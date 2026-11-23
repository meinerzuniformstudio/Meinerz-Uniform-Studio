import{test}from'node:test';import assert from'node:assert/strict';import{readFile}from'node:fs/promises';
import{PRESENTATION_PACK_TEMPLATES}from'../lib/presentation-pack-templates.mjs';
import{SIMULATOR_KITS}from'../public/simulador/kit-catalog.js';
import{readGlb,readAccessor}from'../lib/template-generator.mjs';
import{COLLARS,collarFinishes}from'../public/product-catalog.js';
const prime=PRESENTATION_PACK_TEMPLATES.filter(e=>['PRIME','PRIME V'].includes(e.descriptor.collar));
test('PRIME and PRIME V cover all normal/raglan, cut and shorts combinations',()=>{
 assert.equal(prime.length,64);assert.ok(COLLARS.includes('PRIME V'));assert.deepEqual(collarFinishes('PRIME V'),collarFinishes('PRIME'));
 for(const collar of ['PRIME','PRIME V'])for(const modeling of ['NORMAL','RAGLAN'])for(const cutType of ['SEM RECORTE','LATERAL','FAIXA','AXILA'])for(const bottomParts of [2,4,5,6]){
  const matches=prime.filter(e=>Object.entries({collar,modeling,cutType,bottomParts}).every(([k,v])=>e.descriptor[k]===v));assert.equal(matches.length,1);const d=matches[0].descriptor,k=SIMULATOR_KITS.find(k=>k.id===d.id);assert.ok(k);assert.equal(new Set(k.panels.map(p=>p.id)).size,d.panels.length);assert.ok(d.panels.some(p=>p.label==='Frente'));assert.ok(d.panels.some(p=>p.label==='Costas'));
 }
});
test('PRIME atlas uses one shared scale, retains exact cloth geometry and matches every panel UV transform',async()=>{
 for(const e of prime){const d=e.descriptor,source=readGlb(await readFile(new URL('../public'+e.assets.source,import.meta.url))),model=readGlb(await readFile(new URL('../public'+e.assets.model,import.meta.url))),svg=await readFile(new URL('../public'+e.assets.template,import.meta.url),'utf8');
  assert.equal(d.artBleedPixels,16*2/3);assert.ok(d.proportionMethod.includes('no pair stretching'));assert.ok(!svg.includes('BRASÃO'));assert.match(svg,/4096/);
  for(const p of d.panels){assert.ok(svg.includes('CORTE_PAINEL_'+p.number));const sr=source.json.meshes[p.mesh].primitives[p.primitive],mr=model.json.meshes[p.mesh].primitives[p.primitive];
   const si=readAccessor(source.json,source.binary,sr.indices).data,mi=readAccessor(model.json,model.binary,mr.indices).data;assert.equal(si.length,mi.length);
   for(const key of ['POSITION','NORMAL']){const a=readAccessor(source.json,source.binary,sr.attributes[key]).data,b=readAccessor(model.json,model.binary,mr.attributes[key]).data;for(let i=0;i<si.length;i++)for(let axis=0;axis<3;axis++)assert.equal(a[si[i]*3+axis],b[mi[i]*3+axis],d.id+' '+key);}
   const original=readAccessor(model.json,model.binary,mr.attributes.TEXCOORD_1),atlas=readAccessor(model.json,model.binary,mr.attributes.TEXCOORD_0),m=p.physicalMatrix,r=p.rect,min=p.physicalBounds;assert.ok(r.x>=0&&r.y>=0&&r.x+r.w<=4096&&r.y+r.h<=4096);
   for(let i=0;i<atlas.count;i+=37){const u=original.data[i*2],v=original.data[i*2+1],x=(r.x+(u*m[0][0]+v*m[1][0]-min[0])*d.texelsPerUvUnit)/4096,y=(r.y+(u*m[0][1]+v*m[1][1]-min[1])*d.texelsPerUvUnit)/4096;assert.ok(Math.abs(atlas.data[i*2]-x)<1e-7);assert.ok(Math.abs(atlas.data[i*2+1]-y)<1e-7);}
  }
 }
});
