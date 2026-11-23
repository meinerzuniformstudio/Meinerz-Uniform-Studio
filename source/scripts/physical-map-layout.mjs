// Immutable revision: canonical sources/old atlases remain readable by saved art.
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {readGlb,readAccessor} from '../lib/template-generator.mjs';
import {editableTemplateSvg} from '../lib/editable-template-svg.mjs';
import {artBleedSvg,ART_BLEED_PIXELS} from '../lib/art-bleed-svg.mjs';
import {drawingMapPdf} from '../lib/drawing-map-pdf.mjs';
import {PDFDocument,StandardFonts} from 'pdf-lib';
export async function createPhysicalMapEntries(entries,{suffix='-proporcao-v1',preservePairShapes=false}={}){
const root=new URL('../',import.meta.url),dir=id=>new URL(`public/assets/molds/${id}/`,root);
const measured=spawnSync('python',['scripts/measure-panel-proportions.py'],{input:JSON.stringify(entries),encoding:'utf8',maxBuffer:30*1024*1024});if(measured.status!==0)throw Error(measured.stderr);const metrics=JSON.parse(measured.stdout);
const fontDoc=await PDFDocument.create(),font=await fontDoc.embedFont(StandardFonts.Helvetica),bold=await fontDoc.embedFont(StandardFonts.HelveticaBold);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const transform=(u,v,m)=>[u*m[0][0]+v*m[1][0],u*m[0][1]+v*m[1][1]];
const encode=(json,binary)=>{const j=Buffer.from(JSON.stringify(json)),n=Math.ceil(j.length/4)*4,b=Buffer.alloc(28+n+binary.length);b.writeUInt32LE(0x46546c67);b.writeUInt32LE(2,4);b.writeUInt32LE(b.length,8);b.writeUInt32LE(n,12);b.writeUInt32LE(0x4e4f534a,16);b.fill(32,20,20+n);j.copy(b,20);b.writeUInt32LE(binary.length,20+n);b.writeUInt32LE(0x004e4942,24+n);binary.copy(b,28+n);return b;};
const replacements=new Map(entries.map(e=>[e.descriptor.id,e.descriptor.id+suffix])),revised=[],audit=[];
for(const entry of entries){
 const original=entry.descriptor,d=structuredClone(original),oldId=d.id,newId=replacements.get(oldId),target=dir(newId);await mkdir(target,{recursive:true});
 const source=await readFile(new URL(entry.assets.source.slice(1),new URL('public/',root))),sourceGlb=readGlb(source),model=readGlb(await readFile(new URL(entry.assets.model.slice(1),new URL('public/',root)))),json=model.json,binary=Buffer.from(model.binary);
 const proof=await readFile(new URL(entry.assets.proof.slice(1),new URL('public/',root)),'utf8');
 const rawPaths=new Map([...proof.matchAll(/<path\b[^>]*id="PAINEL_(\d+)"[^>]*\/>/g)].map(m=>[+m[1],m[0].match(/\bd="([^"]+)"/)[1]]));
 const units=new Map(metrics[oldId].map(p=>[p.number,p]));
 // Equal components get one common pair box after physical calibration. This
 // only removes the small differences caused by the posed left/right fabric.
 const pairs=new Map();for(const p of d.panels){const label=p.label||p.displayName||`Painel ${p.number}`;p.label=label;p.displayName=`${label} · P${String(p.number).padStart(2,'0')}`;const key=label.replace(/\b(esquerdo|esquerda|direito|direita)\b/gi,'lado').trim();if(/Manga|manga|Filete|filete|Recorte|Calção|Cós/.test(label)){if(!pairs.has(key))pairs.set(key,[]);pairs.get(key).push(p);}}
 const pairReport=[];for(const [key,list] of (preservePairShapes?[]:pairs)){if(![2,4].includes(list.length))continue;const dims=list.map(p=>{const b=units.get(p.number).physicalBounds;return[b[2]-b[0],b[3]-b[1]];}),avg=[0,1].map(k=>dims.reduce((s,v)=>s+v[k],0)/dims.length);for(let i=0;i<list.length;i++){const m=units.get(list[i].number),adjust=avg.map((v,k)=>v/dims[i][k]);m.pairAdjustment=adjust;m.matrix=m.matrix.map(row=>row.map((v,k)=>v*adjust[k]));m.physicalBounds=[m.physicalBounds[0]*adjust[0],m.physicalBounds[1]*adjust[1],m.physicalBounds[2]*adjust[0],m.physicalBounds[3]*adjust[1]];}pairReport.push({kind:key,panels:list.map(p=>p.number),width:avg[0],height:avg[1],maxAdjustment:Math.max(...dims.flatMap(v=>v.map((x,k)=>Math.abs(avg[k]/x-1))))});}
 const groupFor=p=>/Calção|Cós|Bermuda|bolso/.test(p.label)?'CALCAO_E_COS':/Manga|Filete/.test(p.label)?'MANGAS_E_FILETES':/Gola|gola|Colarinho|Peitilho/.test(p.label)?'GOLAS':'CORPO_E_RECORTES';
 const groups=[['CORPO_E_RECORTES','CORPO E RECORTES'],['GOLAS','GOLAS'],['MANGAS_E_FILETES','MANGAS E FILETES'],['CALCAO_E_COS','CALÇÃO E CÓS']].map(([id,title])=>({id,title,panels:[]}));
 for(const p of d.panels){p.group=groupFor(p);groups.find(g=>g.id===p.group).panels.push(p.number);}
 for(const g of groups)g.panels.sort((a,b)=>{const rank=n=>/^Frente/.test(d.panels[n-1].label)?0:/^Costas/.test(d.panels[n-1].label)?1:/^Manga|^Calção/.test(d.panels[n-1].label)?0:/^Filete/.test(d.panels[n-1].label)?1:2;return rank(a)-rank(b)||a-b;});
 const margin=100,gap=76;
 function layout(scale,apply=false){const rects=new Map(),headings=new Map();function pack(g,x,y,maxW){if(!g.panels.length)return{bottom:y};headings.set(g.id,{x,y:y+35});let xx=x,yy=y+120,rowH=0;for(const n of g.panels){const b=units.get(n).physicalBounds,w=(b[2]-b[0])*scale,h=(b[3]-b[1])*scale,slot=Math.max(w,235);if(slot>maxW)return null;if(xx>x&&xx+slot>x+maxW){xx=x;yy+=rowH+125;rowH=0;}rects.set(n,{x:xx,y:yy,w,h,labelWidth:slot});xx+=slot+gap;rowH=Math.max(rowH,h);}return{bottom:yy+rowH};}
  const body=pack(groups[0],margin,340,2650),collar=pack(groups[1],2900,340,1096);if(!body||!collar)return null;let y=Math.max(body.bottom,collar.bottom)+70;const sleeves=pack(groups[2],margin,y,3896);if(!sleeves)return null;y=sleeves.bottom+70;const shorts=pack(groups[3],margin,y,3896);if(!shorts||shorts.bottom>3980)return null;
  if(apply){for(const p of d.panels)p.rect=rects.get(p.number);for(const g of groups)g.heading=headings.get(g.id);}return true;
 }
 let lo=0,hi=100000;for(let i=0;i<45;i++){const mid=(lo+hi)/2;if(layout(mid))lo=mid;else hi=mid;}const scale=lo*.98;if(!layout(scale,true)||scale<=0)throw Error('No layout: '+oldId);
 d.id=newId;d.preparedFrom=oldId;delete d.intermediateOnly;d.replaces=oldId;d.mapRevision='physical-v1';d.proportionMethod='area-weighted intrinsic UV metric; full positive affine; shared paired bounds';d.texelsPerUvUnit=scale;d.artBleedPixels=ART_BLEED_PIXELS;d.layoutGroups=groups.filter(g=>g.panels.length);d.atlasRevision=(d.atlasRevision||0)+1;
 for(const key of ['derivedFrom','bottomDerivedFrom'])if(replacements.has(d[key]))d[key]=replacements.get(d[key]);
 const view=new DataView(binary.buffer,binary.byteOffset,binary.byteLength),paths=new Map();
 for(const p of d.panels){const measure=units.get(p.number),matrix=measure.matrix,min=measure.physicalBounds.slice(0,2),r=p.rect;p.physicalMatrix=matrix;p.physicalBounds=measure.physicalBounds;p.physicalSize=[r.w/scale,r.h/scale];p.atlasTransform=[matrix[0][0]*scale,matrix[0][1]*scale,matrix[1][0]*scale,matrix[1][1]*scale,r.x-min[0]*scale,r.y-min[1]*scale];delete p.atlasScale;delete p.matchedToPanel;
  const pr=json.meshes[p.mesh].primitives[p.primitive],uv=readAccessor(sourceGlb.json,sourceGlb.binary,sourceGlb.json.meshes[p.mesh].primitives[p.primitive].attributes.TEXCOORD_0),acc=json.accessors[pr.attributes.TEXCOORD_0],bv=json.bufferViews[acc.bufferView];for(let i=0;i<uv.count;i++){const [x,y]=transform(uv.data[i*2],uv.data[i*2+1],matrix),at=(bv.byteOffset||0)+(acc.byteOffset||0)+i*(bv.byteStride||8);view.setFloat32(at,(r.x+(x-min[0])*scale)/4096,true);view.setFloat32(at+4,(r.y+(y-min[1])*scale)/4096,true);}
  const old=original.panels.find(o=>o.number===p.number),sx=old.atlasScale?.x||original.texelsPerUvUnit,sy=old.atlasScale?.y||original.texelsPerUvUnit,od=rawPaths.get(p.number);if(!od)throw Error('Missing original contour '+oldId+' '+p.number);
  paths.set(p.number,od.replace(/([ML])(-?[\d.]+),(-?[\d.]+)/g,(_,op,x,y)=>{const u=(+x-old.rect.x)/sx+old.uvBounds[0],v=(+y-old.rect.y)/sy+old.uvBounds[1],[a,b]=transform(u,v,matrix);return`${op}${(r.x+(a-min[0])*scale).toFixed(3)},${(r.y+(b-min[1])*scale).toFixed(3)}`;}));
 }
 const labelBoxes=[];function text(x,y,value,size=24,weight=false){return`<text x="${x.toFixed(3)}" y="${y.toFixed(3)}" font-family="Arial,sans-serif" font-size="${size}"${weight?' font-weight="bold"':''} fill="#263c49">${esc(value)}</text>`;}
 function wrap(value,width,size=24){const lines=[];let line='';for(const word of value.split(' ')){const next=line?line+' '+word:word;if(line&&font.widthOfTextAtSize(next,size)>width){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);return lines;}
 function svg(proofMode=false){const art=[],guides=[];guides.push(text(100,80,'ATLAS · MAPA DE ARTE',33,true));const titles=wrap(d.name,3890,37);titles.forEach((v,i)=>guides.push(text(100,140+i*46,v,37,true)));guides.push(text(100,245,'CONTÍNUO: LIMITE DA SANGRIA 10,67 PX    |    TRACEJADO: CONTORNO DA PEÇA    |    OCULTE AS GUIAS AO EXPORTAR',23));
  for(const g of d.layoutGroups){guides.push(text(g.heading.x,g.heading.y,g.title,32,true));for(const n of g.panels){const p=d.panels.find(v=>v.number===n),r=p.rect,path=paths.get(n);art.push(`<path id="PAINEL_${n}" fill="${proofMode?'#d8e8eb':'#ffffff'}" stroke="#555555" stroke-width="2" fill-rule="evenodd" d="${path}"/>`);const lines=wrap(p.displayName,r.labelWidth-8,23);if(lines.length>2)throw Error('Label requires >2 rows '+p.displayName);lines.forEach((line,k)=>{const y=r.y-52+k*28;guides.push(text(r.x,y,line,23));if(!proofMode)labelBoxes.push({panel:n,text:line,x:r.x,y:y-23,w:font.widthOfTextAtSize(line,23),h:29});});}}
  const raw=`<svg xmlns="http://www.w3.org/2000/svg" width="4096" height="4096" viewBox="0 0 4096 4096"><title>${esc(d.name)}</title><rect width="4096" height="4096" fill="#ffffff"/>${art.join('')}<g id="GUIAS_OCULTAR_ANTES_DE_EXPORTAR">${guides.join('')}</g></svg>`;return artBleedSvg(editableTemplateSvg(raw));
 }
 const templateSvg=svg(),proofSvg=svg(true);d.guideLabelBoxes=labelBoxes;
 await writeFile(new URL('source.glb',target),source);await writeFile(new URL('model.glb',target),encode(json,binary));await writeFile(new URL('descriptor.json',target),JSON.stringify(d,null,2)+'\n');await writeFile(new URL('template.svg',target),templateSvg);await writeFile(new URL('proof.svg',target),proofSvg);await writeFile(new URL('map.pdf',target),await drawingMapPdf(templateSvg));
 for(const file of ['preparation.json','pair-audit.json','surface-partition.json','shorts-partition.json'])try{await copyFile(new URL(file,dir(oldId)),new URL(file,target));}catch(e){if(e.code!=='ENOENT')throw e;}
 const revisedEntry={...entry,descriptor:d,templateSvg,assets:Object.fromEntries(['model','source','template','proof'].map(k=>[k,`/assets/molds/${newId}/${k}.${['source','model'].includes(k)?'glb':'svg'}`])),assetsPdf:`/assets/molds/${newId}/map.pdf`,createdAt:'2026-11-13T11:00:00.000Z'};revised.push(revisedEntry);audit.push({previousId:oldId,id:newId,panels:metrics[oldId],pairs:pairReport});console.log(newId,d.panelCount);
}
return {entries:revised,audit};
}
