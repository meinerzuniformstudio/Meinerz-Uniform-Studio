import {orderedDescriptor,orderedDrawing,MAP_REVISION} from './ordered-drawing.mjs';
import {shirtDescriptor,shirtDrawing} from './shirt-presentation-templates.mjs';
import{simulatorKit}from'../public/simulador/kit-catalog.js';
import{femaleDescriptor}from'../public/simulador/female-kits.js';
import{femaleModel,femaleDrawing}from'./female-template-assets.mjs';
import {fetchPackedSvg} from './static-mold-drawings.mjs';
import {currentCollarName,currentCollarDescriptor} from '../public/collar-names.js';
import {SUPERSEDED_PRESENTATION_TEMPLATES} from './superseded-presentation-templates.mjs';
const retiredAxila=INSTALLED_TEMPLATES.filter(e=>e.descriptor.cutType==='AXILA' && (e.descriptor.modeling!=='RAGLAN'||e.descriptor.collar!=='ELITE')).map(e=>e.descriptor.id);
const supersededIds=new Set(SUPERSEDED_PRESENTATION_TEMPLATES.flatMap(e=>[e.descriptor.id,e.descriptor.replaces]).concat(retiredAxila,INSTALLED_TEMPLATES.map(e=>e.descriptor.replaces)).filter(Boolean));
import {drawingMapPdf} from './drawing-map-pdf.mjs';
import {editableTemplateSvg} from './editable-template-svg.mjs';
import {isWithdrawnTemplate,WITHDRAWN_TEMPLATE_MESSAGE} from './withdrawn-templates.mjs';
import {isRemovedMold,REMOVED_MOLD_MESSAGE} from './removed-molds.mjs';
import {INSTALLED_TEMPLATES} from './installed-templates.mjs';
import {presentationGarments} from '../public/order-presentation.js';
import {moldCollection} from '../public/mold-collections.js';
import { AppError } from './project-service.mjs';
import { requireAdminUser, isAdminUser } from './admin-auth.mjs';
import { generateTemplate, TemplateError, TEMPLATE_LIMITS } from './template-generator.mjs';
import { BUILTIN_TEMPLATE } from '../public/template-catalog.js';
import { SIMULATOR_PRESENTATION_TEMPLATES } from './simulator-presentation-templates.mjs';

const date = () => new Date().toISOString();
const categories = ['camiseta','calcao','conjunto','outro'];
export class TemplateService {
  /** @param {readonly any[]} installedTemplates
   * @param {any} staticAssets */
  constructor(db, bucket, adminId = '', installedTemplates = INSTALLED_TEMPLATES, staticAssets = null) { this.staticAssets=staticAssets; this.db = db; this.bucket = bucket; this.adminId = adminId; this.installedTemplates = [...installedTemplates,...SUPERSEDED_PRESENTATION_TEMPLATES.filter(entry=>!installedTemplates.some(item=>item.descriptor.id===entry.descriptor.id)),...SIMULATOR_PRESENTATION_TEMPLATES.filter(entry=>!installedTemplates.some(item=>item.descriptor.id===entry.descriptor.id))].filter(entry=>!isRemovedMold(entry.descriptor.id)); }
  orderedBase(id){
    if(!String(id).endsWith(MAP_REVISION))return null;
    const baseId=id.slice(0,-MAP_REVISION.length);
    const entry=this.shirtBase(baseId)||this.installedTemplates.find(e=>e.descriptor.id===baseId);
    return entry?.descriptor.id.startsWith('pack26-')?{entry,baseId}:null;
  }
  shirtBase(id) {
    if (!String(id).endsWith('-camiseta')) return null;
    return this.installedTemplates.find(e=>e.descriptor.id === id.slice(0,-'-camiseta'.length) && e.descriptor.bottomParts === 2);
  }
  installedRow(id) {
    const base=this.shirtBase(id);
    if(base){
      const descriptor=shirtDescriptor(base.descriptor);
      if(descriptor)return {...this.installedRow(base.descriptor.id),id,name:descriptor.name,category:'camiseta',layout_json:JSON.stringify(descriptor)};
    }
    const kit=String(id).startsWith('female-')?simulatorKit(id):null;
    if(kit?.gender==='FEMININA'){const descriptor=femaleDescriptor(kit),url='/api/templates/'+id+'/assets/';return{id,name:kit.name,category:descriptor.category,status:'published',model_key:url+'model',source_key:url+'source',svg_key:url+'template',proof_key:url+'proof',layout_json:JSON.stringify(descriptor),source_name:'Kit feminino modular',created_by:this.adminId,created_at:'2026-11-17T00:00:00Z',updated_at:'2026-11-17T00:00:00Z'};}
    const entry=this.installedTemplates.find(item=>item.descriptor.id===id);
    if(!entry)return null;
    const {descriptor,assets}=entry;
    return {id,name:descriptor.name,category:descriptor.category,status:entry.status,model_key:assets.model,source_key:assets.source,svg_key:assets.template,proof_key:assets.proof,layout_json:JSON.stringify(descriptor),source_name:entry.sourceName,created_by:this.adminId,created_at:entry.createdAt,updated_at:entry.createdAt};
  }
  async ensureInstalled(id) {
    const row=this.installedRow(id);if(!row)return;
    await this.db.prepare('INSERT INTO templates (id,name,category,status,model_key,source_key,svg_key,proof_key,layout_json,source_name,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING')
      .bind(row.id,row.name,row.category,row.status,row.model_key,row.source_key,row.svg_key,row.proof_key,row.layout_json,row.source_name,row.created_by,row.created_at,row.updated_at).run();
  }
  summary(row) {
    row={...row,name:currentCollarName(row.name)};
    const layout = currentCollarDescriptor(JSON.parse(row.layout_json));
    if(row.id===BUILTIN_TEMPLATE.id)return {...BUILTIN_TEMPLATE,name:row.name,line:moldCollection({...layout,id:row.id}),category:row.category,status:row.status,updatedAt:row.updated_at};
    return { id:row.id, name:row.name, line:moldCollection({...layout,id:row.id}), gender:layout.gender,femaleShort:layout.femaleShort,bottomMoldId:layout.bottomMoldId,separated:layout.separated,bottomVariant:layout.bottomVariant,packId:layout.packId,modeling:layout.modeling,collar:layout.collar,sideCut:layout.sideCut,cutType:layout.cutType,variantSource:layout.variantSource,bottomParts:layout.bottomParts,variant:layout.variant,artBleedPixels:layout.artBleedPixels,pairNormalization:layout.pairNormalization,catalogPath:layout.catalogPath, category:row.category, kind:'generated', status:row.status,
      panelCount:layout.panelCount, triangles:layout.triangles, pageSize:4096, sourceName:row.source_name,
      createdAt:row.created_at, updatedAt:row.updated_at, orientation:layout.orientation, ...(layout.thumbnailUrl?{thumbnailUrl:layout.thumbnailUrl}:{}) };
  }
  async row(id) {
    if(isRemovedMold(id))throw new AppError(404,REMOVED_MOLD_MESSAGE);
    const row = await this.db.prepare('SELECT * FROM templates WHERE id = ?').bind(id).first() || this.installedRow(id);
    if(!row)throw new AppError(404,'Molde não encontrado.');
    if(supersededIds.has(id)||(/^pack26-/.test(id)&&!this.installedTemplates.some(e=>e.descriptor.id===id)&&!this.shirtBase(id)))return {...row,status:'archived',superseded:true};
    // Apply withdrawal to persisted published rows too; old project assets remain readable.
    if(isWithdrawnTemplate(id))return {...row,status:'deleted',withdrawn:true};
    // Clarify the original default label even when it was persisted before the second polo existed.
    if(id==='polo'&&row.name==='POLO')return {...row,name:'POLO COM RECORTE V'};
    return {...row,name:currentCollarName(row.name),layout_json:JSON.stringify(currentCollarDescriptor(JSON.parse(row.layout_json)))};
  }
  async catalog(user) {
    if(!user?.userId)throw new AppError(401,'Entre na sua conta para continuar.');
    const rows=await this.db.prepare("SELECT * FROM templates WHERE status = 'published' ORDER BY created_at DESC").all();
    const builtin=await this.builtin();
    const primeReady=!this.bucket?.head||!!(await this.bucket.head('prime-assets-20261116/READY'));
    const saved = new Map(rows.results.map(r=>[r.id,r]));
    const overrides = await this.db.prepare("SELECT id FROM templates WHERE status <> 'published'").all();
    const hidden = new Set(overrides.results.map(r=>r.id));
    const installedIds = new Set(this.installedTemplates.map(e=>e.descriptor.id));
    const catalog = [];
    for(const entry of this.installedTemplates){
      const d=entry.descriptor;
      if(entry.presentationOnly || entry.status!=='published' || supersededIds.has(d.id) || hidden.has(d.id) || isWithdrawnTemplate(d.id) || (!primeReady && ['PRIME','PRIME V'].includes(d.collar)))continue;
      const row=saved.get(d.id)||this.installedRow(d.id);
      catalog.push({...this.summary(row),id:d.id.startsWith('pack26-')?d.id+MAP_REVISION:d.id});
      if(d.category==='conjunto' && d.bottomParts===2){
        const shirt=this.installedRow(d.id+'-camiseta');
        if(shirt)catalog.push({...this.summary(shirt),id:shirt.id+MAP_REVISION});
      }
    }
    return [...(builtin.status==='published'&&!isRemovedMold(builtin.id)?[builtin]:[]),...catalog,...rows.results.filter(row=>row.id!==BUILTIN_TEMPLATE.id&&!installedIds.has(row.id)&&!row.id.startsWith('pack26-')&&!supersededIds.has(row.id)&&!isWithdrawnTemplate(row.id)&&!isRemovedMold(row.id)).map(row=>this.summary(row))];
  }
  async builtin() {
    const row=await this.db.prepare('SELECT * FROM templates WHERE id = ?').bind(BUILTIN_TEMPLATE.id).first();
    return row?this.summary(row):{...BUILTIN_TEMPLATE};
  }
  async ensureBuiltin() {
    const at=date();
    await this.db.prepare("INSERT INTO templates (id,name,category,status,model_key,source_key,svg_key,proof_key,layout_json,source_name,created_by,created_at,updated_at) VALUES (?,?,?,'published',?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING")
      .bind(BUILTIN_TEMPLATE.id,BUILTIN_TEMPLATE.name,BUILTIN_TEMPLATE.category,BUILTIN_TEMPLATE.modelUrl,BUILTIN_TEMPLATE.modelUrl,BUILTIN_TEMPLATE.templateUrl,BUILTIN_TEMPLATE.proofUrl,JSON.stringify(BUILTIN_TEMPLATE),'camiseta.glb',this.adminId,at,at).run();
  }
  async adminList(user) {
    requireAdminUser(user,this.adminId);
    const rows=await this.db.prepare('SELECT * FROM templates ORDER BY created_at DESC').all();
    const primeReady=!this.bucket?.head||!!(await this.bucket.head('prime-assets-20261116/READY'));
    const installed=await Promise.all(this.installedTemplates.filter(entry=>!entry.presentationOnly&&(primeReady||!['PRIME','PRIME V'].includes(entry.descriptor.collar))).map(entry=>this.row(entry.descriptor.id))),ids=new Set(this.installedTemplates.map(entry=>entry.descriptor.id));
    return [...installed.filter(row=>!row.withdrawn&&!row.superseded).map(row=>this.summary(row)),...(!isRemovedMold(BUILTIN_TEMPLATE.id)?[await this.builtin()]:[]),...rows.results.filter(row=>row.id!==BUILTIN_TEMPLATE.id&&!ids.has(row.id)&&!row.id.startsWith('pack26-')&&!supersededIds.has(row.id)&&!isWithdrawnTemplate(row.id)&&!isRemovedMold(row.id)).map(row=>this.summary(row))];
  }
  async available(user,id) {
    const ordered=this.orderedBase(id);
    if(ordered)return {...await this.available(user,ordered.baseId),id};
    const shirtBase=this.shirtBase(id);
    if(shirtBase)await this.available(user,shirtBase.descriptor.id);
    const female=String(id).startsWith('female-')?simulatorKit(id):null;if(female?.gender==='FEMININA')await this.available(user,female.baseModel);
    if(!user?.userId)throw new AppError(401,'Entre na sua conta para continuar.');
    if(isRemovedMold(id))throw new AppError(404,REMOVED_MOLD_MESSAGE);
    if(id===BUILTIN_TEMPLATE.id){const builtin=await this.builtin();if(builtin.status!=='published')throw new AppError(404,'Este molde não está disponível para novos projetos.');return builtin;}
    if(id.includes('-prime-20261116')&&this.bucket?.head&&!await this.bucket.head('prime-assets-20261116/READY'))throw new AppError(503,'Os novos moldes estão sendo preparados. Tente novamente em alguns minutos.');
    const row=await this.row(id);
    if(row.status!=='published')throw new AppError(404,'Este molde não está disponível para novos projetos.');
    return this.summary(row);
  }
  async descriptor(id) {
    const ordered=this.orderedBase(id);
    if(ordered)return orderedDescriptor(await this.descriptor(ordered.baseId));
    if(isRemovedMold(id))throw new AppError(404,REMOVED_MOLD_MESSAGE);
    if(id===BUILTIN_TEMPLATE.id)return this.builtin();
    const row=await this.row(id);return {...JSON.parse(row.layout_json),name:row.name,status:row.status,category:row.category};
  }
  async readable(user,id) {
    const ordered=this.orderedBase(id);
    if(ordered)return orderedDescriptor(await this.readable(user,ordered.baseId));
    if(!user?.userId)throw new AppError(401,'Entre na sua conta para continuar.');
    if(isRemovedMold(id))throw new AppError(404,REMOVED_MOLD_MESSAGE);
    const state=id===BUILTIN_TEMPLATE.id?await this.builtin():await this.row(id);
    if(state.status!=='published'&&!state.superseded&&!isAdminUser(user,this.adminId))throw new AppError(404,'Molde não encontrado.');
    return this.descriptor(id);
  }
  async create(user,input,file) {
    requireAdminUser(user,this.adminId);
    const name=typeof input?.name==='string'?input.name.trim():'';
    if(!name||name.length>80)throw new AppError(400,'Dê um nome ao molde com até 80 caracteres.');
    if(!categories.includes(input.category))throw new AppError(400,'Selecione o tipo de peça.');
    if(!file||typeof file.arrayBuffer!=='function'||!file.size||file.size>TEMPLATE_LIMITS.bytes||!file.name.toLowerCase().endsWith('.glb'))throw new AppError(400,'Envie um GLB completo, de até 20 MB.');
    const id=`molde-${crypto.randomUUID()}`, bytes=new Uint8Array(await file.arrayBuffer());
    let generated;
    try { generated=await generateTemplate(bytes,{id,name,category:input.category,up:input.up,front:input.front}); }
    catch(error){if(error instanceof TemplateError)throw new AppError(400,error.message);throw error;}
    if(input.line!==undefined&&!['jogo','passeio'].includes(input.line))throw new AppError(400,'Escolha Jogo ou Passeio.');
    generated.descriptor.line=input.line||'jogo';
    const keys={model:`templates/${id}/model.glb`,source:`templates/${id}/source.glb`,svg:`templates/${id}/template.svg`,proof:`templates/${id}/proof.svg`},written=[];
    try {
      for(const [kind,data,type] of [['model',generated.model,'model/gltf-binary'],['source',bytes,'model/gltf-binary'],['svg',generated.svg,'image/svg+xml'],['proof',generated.proof,'image/svg+xml']]) {
        written.push(keys[kind]);await this.bucket.put(keys[kind],data,{httpMetadata:{contentType:type}});
      }
      const at=date();
      await this.db.prepare('INSERT INTO templates (id,name,category,status,model_key,source_key,svg_key,proof_key,layout_json,source_name,created_by,created_at,updated_at) VALUES (?,?,?,\'draft\',?,?,?,?,?,?,?,?,?)').bind(id,name,input.category,keys.model,keys.source,keys.svg,keys.proof,JSON.stringify(generated.descriptor),String(file.name).slice(0,180),user.userId,at,at).run();
    }catch(error){if(written.length)await this.bucket.delete(written).catch(()=>{});throw error;}
    return this.summary(await this.row(id));
  }
  async status(user,id,input) {
    requireAdminUser(user,this.adminId);
    if(isRemovedMold(id))throw new AppError(404,REMOVED_MOLD_MESSAGE);
    if(isWithdrawnTemplate(id))throw new AppError(400,WITHDRAWN_TEMPLATE_MESSAGE);
    if(id===BUILTIN_TEMPLATE.id)await this.ensureBuiltin();
    await this.ensureInstalled(id);
    const row=await this.row(id);
    if(row.status==='deleted')throw new AppError(400,'Restaure este molde pela lixeira antes de publicar.');
    if(!['published','archived'].includes(input?.status))throw new AppError(400,'Selecione uma situação válida para o molde.');
    if(input.status==='published'&&input.confirmed!==true)throw new AppError(400,'Confira o mapa e confirme a publicação.');
    await this.db.prepare('UPDATE templates SET status = ?,updated_at = ? WHERE id = ?').bind(input.status,date(),id).run();
    return this.summary(await this.row(id));
  }
  async update(user,id,input) {
    requireAdminUser(user,this.adminId);
    if(isRemovedMold(id))throw new AppError(404,REMOVED_MOLD_MESSAGE);
    if(isWithdrawnTemplate(id))throw new AppError(400,WITHDRAWN_TEMPLATE_MESSAGE);
    const name=typeof input?.name==='string'?input.name.trim():'';
    if(!name||name.length>80)throw new AppError(400,'Dê um nome ao molde com até 80 caracteres.');
    if(!categories.includes(input.category))throw new AppError(400,'Selecione o tipo de peça.');
    if(id===BUILTIN_TEMPLATE.id)await this.ensureBuiltin();
    await this.ensureInstalled(id);
    const row=await this.row(id);
    if(row.status==='deleted')throw new AppError(400,'Restaure este molde antes de editar.');
    if(input.line!==undefined&&!['jogo','passeio'].includes(input.line))throw new AppError(400,'Escolha Jogo ou Passeio.');
    const layout=JSON.parse(row.layout_json);if(!layout.garments&&row.category==='conjunto')layout.garments=presentationGarments({...layout,id,name:row.name,category:row.category});layout.line=input.line||moldCollection({...layout,id});
    await this.db.prepare('UPDATE templates SET name = ?,category = ?,layout_json = ?,updated_at = ? WHERE id = ?').bind(name,input.category,JSON.stringify(layout),date(),id).run();
    return this.summary(await this.row(id));
  }
  async remove(user,id) {
    requireAdminUser(user,this.adminId);
    if(isRemovedMold(id))throw new AppError(404,REMOVED_MOLD_MESSAGE);
    if(id===BUILTIN_TEMPLATE.id)await this.ensureBuiltin();
    await this.ensureInstalled(id);
    await this.row(id);
    // Reversible removal; retain the geometry used by existing projects/links.
    await this.db.prepare("UPDATE templates SET status = 'deleted',updated_at = ? WHERE id = ?").bind(date(),id).run();
    return this.summary(await this.row(id));
  }
  async restore(user,id) {
    requireAdminUser(user,this.adminId);
    if(isRemovedMold(id))throw new AppError(404,REMOVED_MOLD_MESSAGE);
    if(isWithdrawnTemplate(id))throw new AppError(400,WITHDRAWN_TEMPLATE_MESSAGE);
    const row=await this.row(id);
    if(row.status!=='deleted')throw new AppError(400,'Este molde não está na lixeira.');
    await this.db.prepare('UPDATE templates SET status = ?,updated_at = ? WHERE id = ?').bind(id===BUILTIN_TEMPLATE.id?'published':'draft',date(),id).run();
    return this.summary(await this.row(id));
  }
  async asset(id,kind) {
    const ordered=this.orderedBase(id);
    if(ordered){
      if(kind==='model'||kind==='source')return this.asset(ordered.baseId,kind);
      if(!['template','proof','pdf'].includes(kind))throw new AppError(404,'Arquivo não encontrado.');
      const response=await fetchPackedSvg(this.staticAssets,new URL(ordered.entry.assets.template,'https://atlas.internal'));
      if(!response.ok)throw new AppError(404,'Mapa indisponível.');
      const svg=orderedDrawing(await response.text(),await this.descriptor(id),kind==='proof');
      return kind==='pdf'?{body:await drawingMapPdf(svg),httpMetadata:{contentType:'application/pdf'}}:{body:svg,httpMetadata:{contentType:'image/svg+xml'}};
    }
    const base=this.shirtBase(id);
    if(base){
      if(kind==='model'||kind==='source')return this.asset(base.descriptor.id,kind);
      if(!['template','proof','pdf'].includes(kind))throw new AppError(404,'Arquivo não encontrado.');
      const response=await fetchPackedSvg(this.staticAssets,new URL(base.assets.template,'https://atlas.internal'));
      if(!response.ok)throw new AppError(404,'Mapa da camiseta indisponível.');
      const svg=shirtDrawing(await response.text(),shirtDescriptor(base.descriptor));
      return kind==='pdf'?{body:await drawingMapPdf(svg),httpMetadata:{contentType:'application/pdf'}}:{body:svg,httpMetadata:{contentType:'image/svg+xml'}};
    }
    const female=String(id).startsWith('female-')?simulatorKit(id):null;
    if(female?.gender==='FEMININA'){if(!['model','source','template','proof','pdf'].includes(kind))throw new AppError(404,'Arquivo não encontrado.');const model=await femaleModel(female,this.staticAssets);if(['model','source'].includes(kind))return{body:model,httpMetadata:{contentType:'model/gltf-binary'}};const svg=femaleDrawing(model,female);return kind==='pdf'?{body:await drawingMapPdf(svg),httpMetadata:{contentType:'application/pdf'}}:{body:svg,httpMetadata:{contentType:'image/svg+xml'}};}
    if(isRemovedMold(id))throw new AppError(404,REMOVED_MOLD_MESSAGE);
    if(kind==='pdf'){
      const installed=this.installedTemplates.find(entry=>entry.descriptor.id===id);
      if(installed?.assetsPdf)return {redirect:installed.assetsPdf};
      let svg=installed?.templateSvg;
      if(!svg){const row=await this.row(id),object=await this.bucket.get(row.svg_key);if(!object)throw new AppError(404,'Arquivo não encontrado.');svg=await object.text();}
      return {body:await drawingMapPdf(svg),httpMetadata:{contentType:'application/pdf'}};
    }
    if(!['model','template','proof','source'].includes(kind))throw new AppError(404,'Arquivo não encontrado.');
    if(id===BUILTIN_TEMPLATE.id) {
      const path={model:BUILTIN_TEMPLATE.modelUrl,template:BUILTIN_TEMPLATE.templateUrl,proof:BUILTIN_TEMPLATE.proofUrl,source:BUILTIN_TEMPLATE.modelUrl}[kind];return {redirect:path};
    }
    const row=await this.row(id),key={model:row.model_key,source:row.source_key,template:row.svg_key,proof:row.proof_key}[kind];
    const installed=this.installedTemplates.find(entry=>entry.descriptor.id===id);
    if(installed&&key===installed.assets[kind]&&(kind!=='template'||row.name===JSON.parse(row.layout_json).name))return {redirect:kind==='template'?key+'?corel=2':key};
    const object=installed&&kind==='template'&&key===installed.assets.template?{text:async()=>{if(installed.templateSvg)return installed.templateSvg;if(!this.staticAssets)throw new AppError(503,'Mapa indisponível.');const res=await fetchPackedSvg(this.staticAssets,new URL('https://atlas.internal'+installed.assets.template));if(!res.ok)throw new AppError(404,'Mapa não encontrado.');return res.text();}}:await this.bucket.get(key);if(!object)throw new AppError(404,'Arquivo não encontrado.');
    if(kind==='template'&&row.name!==JSON.parse(row.layout_json).name){
      const escape=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]));
      const original=typeof object.text==='function'?await object.text():String(object.data);
      const svg=original.replace(/<title>[\s\S]*?<\/title>/,()=>`<title>${escape(row.name)} — mapa de desenho</title>`)
        .replace(/(<text x="100" y="90"[^>]*>)[\s\S]*?(<\/text>)/,(_,start,end)=>start+escape(row.name)+end);
      return {body:editableTemplateSvg(svg),data:editableTemplateSvg(svg),httpMetadata:{contentType:'image/svg+xml'}};
    }
    if(kind==='template'){const svg=editableTemplateSvg(typeof object.text==='function'?await object.text():String(object.data));return {body:svg,data:svg,httpMetadata:{contentType:'image/svg+xml'}};}
    return object;
  }
}
