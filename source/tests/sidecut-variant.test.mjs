import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {readGlb,readAccessor} from '../lib/template-generator.mjs';
import {SUPERSEDED_PRESENTATION_TEMPLATES as history} from '../lib/superseded-presentation-templates.mjs';import {PRESENTATION_PACK_TEMPLATES as revised} from '../lib/presentation-pack-templates.mjs';const pack=history.filter(e=>e.descriptor.packId&&!e.descriptor.mapRevision&&e.descriptor.id.includes('-paired-v1'));
const id='pack26-normal-redonda-com-recorte-v2-paired-v1',base='pack26-normal-redonda-sem-recorte';
const load=async id=>readGlb(await readFile(new URL('../public/assets/molds/'+id+'/source.glb',import.meta.url)));
function area(glb,meshes){let sum=0;for(const i of meshes){const pr=glb.json.meshes[i].primitives[0],p=readAccessor(glb.json,glb.binary,pr.attributes.POSITION).data,ix=readAccessor(glb.json,glb.binary,pr.indices).data;for(let k=0;k<ix.length;k+=3){const [a,b,c]=[ix[k],ix[k+1],ix[k+2]].map(i=>p.slice(i*3,i*3+3));const u=b.map((v,i)=>v-a[i]),v=c.map((v,i)=>v-a[i]);sum+=Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])/2;}}return sum;}
test('normal round variant partitions the shirt into two centers and two side panels without changing surface area or other garments',async()=>{
 const a=await load(base),b=await load(id),entry=pack.find(e=>e.descriptor.id===id),d=entry.descriptor;
 assert.ok(pack.some(e=>e.descriptor.id===base+'-paired-v1'));assert.equal(d.derivedFrom,base);assert.equal(d.cutReference,'pack26-normal-gola-27-com-recorte');assert.equal(d.sideCut,true);assert.equal(d.panelCount,13);
 assert.equal(d.panels.filter(p=>p.label.startsWith('Recorte lateral')).length,2);
 const originalBody=a.json.meshes.flatMap((m,i)=>['Frente','Costas'].includes(m.name)?[i]:[]),newBody=b.json.meshes.flatMap((m,i)=>/^(Frente|Costas|Recorte lateral)/.test(m.name)?[i]:[]);
 assert.ok(Math.abs(area(a,originalBody)-area(b,newBody))/area(a,originalBody)<1e-6);
 for(let i=0;i<a.json.meshes.length;i++)if(!originalBody.includes(i)){const x=a.json.meshes[i].primitives[0],y=b.json.meshes[i].primitives[0];for(const k of ['POSITION','NORMAL'])assert.deepEqual(readAccessor(a.json,a.binary,x.attributes[k]).data,readAccessor(b.json,b.binary,y.attributes[k]).data);assert.deepEqual(readAccessor(a.json,a.binary,x.indices).data,readAccessor(b.json,b.binary,y.indices).data);}
 // Both new boundaries share exactly the same physical positions as their
 // neighboring center panels, so changing panel color cannot open a gap.
 const points=meshes=>new Set(meshes.flatMap(i=>{const pr=b.json.meshes[i].primitives[0],p=readAccessor(b.json,b.binary,pr.attributes.POSITION).data;return Array.from({length:p.length/3},(_,k)=>Array.from(p.slice(k*3,k*3+3)).join(','));}));
 const center=points(originalBody);
 for(const i of newBody.filter(i=>!originalBody.includes(i)))assert.ok([...points([i])].filter(k=>center.has(k)).length>100);
});

test('both center cuts run all the way to the armhole without leftover tabs',async()=>{
 const a=await load(base),b=await load(id),stats=JSON.parse(await readFile(new URL('../public/assets/molds/pack26-normal-redonda-com-recorte-v2/surface-partition.json',import.meta.url)));
 for(let mesh=0;mesh<a.json.meshes.length;mesh++)if(['Frente','Costas'].includes(a.json.meshes[mesh].name)){
  const bounds=(g,i)=>{const pr=g.json.meshes[i].primitives[0],uv=readAccessor(g.json,g.binary,pr.attributes.TEXCOORD_0).data;let lo=Infinity,hi=-Infinity;for(let k=0;k<uv.length;k+=2){lo=Math.min(lo,uv[k]);hi=Math.max(hi,uv[k]);}return [lo,hi];};
  const original=bounds(a,mesh),cut=bounds(b,mesh);
  assert.ok(Math.abs(cut[0]-(original[0]+stats.bandUvPerHalf))<1e-7);
  assert.ok(Math.abs(cut[1]-(original[1]-stats.bandUvPerHalf))<1e-7);
 }
 assert.equal(stats.cutTerminatesAt,'armhole boundary (no horizontal cap)');
});
