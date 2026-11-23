import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {DatabaseSync} from 'node:sqlite';
import {registerHooks} from 'node:module';
import {migrations} from './migrations.mjs';
import {TemplateService} from '../lib/template-service.mjs';
import {ProjectService} from '../lib/project-service.mjs';
import {selectPresentationGarments} from '../public/model-panels.js';
import {SUPERSEDED_PRESENTATION_TEMPLATES} from '../lib/superseded-presentation-templates.mjs';

test('standalone presentations retain shirt geometry and maps and create their destination atomically',async t=>{
  const hook=registerHooks({resolve(specifier,context,next){return specifier==='three'?{url:new URL('../public/simulador/vendor/three.module.js',import.meta.url).href,shortCircuit:true}:next(specifier,context)}});
  t.after(()=>hook.deregister());
  const {GLTFLoader}=await import('../public/simulador/vendor/GLTFLoader.js');
  const sql=new DatabaseSync(':memory:');
  sql.exec(migrations.join('\n'));
  const db={prepare(query){
    const stmt=sql.prepare(query);let args=[];
    return {bind(...values){args=values;return this},first:()=>stmt.get(...args),all:()=>({results:stmt.all(...args)}),run:()=>({meta:stmt.run(...args)})};
  },batch(queries){sql.exec('BEGIN');try{const result=queries.map(q=>q.run());sql.exec('COMMIT');return result}catch(error){sql.exec('ROLLBACK');throw error}}};
  const assets={async fetch(req){return new Response(await readFile('public'+new URL(req.url).pathname))}};
  const templates=new TemplateService(db,{},'',undefined,assets);
  const projects=new ProjectService(db,{},templates), user={userId:'designer'};
  const catalog=await templates.catalog(user), shirts=catalog.filter(t=>t.category==='camiseta'&&t.packId);
  assert.ok(shirts.length>40);
  for(const shirt of shirts){
    const d=await templates.descriptor(shirt.id);
    assert.ok(d.panels.length&&d.excludedPrimitiveKeys.length);
    assert.deepEqual(d.garments,['Camiseta']);
    const svg=(await templates.asset(shirt.id,'template')).body;
    assert.deepEqual([...svg.matchAll(/id="PAINEL_(\d+)"/g)].map(m=>+m[1]).sort((a,b)=>a-b),d.panels.map(p=>p.number).sort((a,b)=>a-b));
    assert.equal([...svg.matchAll(/id="CORTE_PAINEL_/g)].length,d.panelCount);
  }
  const id=shirts[0].id, descriptor=await templates.descriptor(id);
  const model=await templates.asset(id,'model');
  const file=await readFile('public'+model.redirect);
  const gltf=await new GLTFLoader().parseAsync(file.buffer.slice(file.byteOffset,file.byteOffset+file.byteLength),'');
  selectPresentationGarments(gltf.scene,gltf.parser.associations,descriptor);
  gltf.scene.traverse(mesh=>{if(mesh.isMesh){const a=gltf.parser.associations.get(mesh);assert.ok(descriptor.primitives.some(p=>p.mesh===a.meshes&&p.primitive===a.primitives));}});
  const input={name:'Camisa de jogo',newFolderName:'ADEMA',templateId:id};
  const created=await projects.create(user,input);
  assert.equal(created.templateId,id);
  assert.equal((await projects.ownFolder(user,created.folderId)).name,'ADEMA');
  await assert.rejects(projects.create(user,input),{status:409});
  assert.equal(sql.prepare('SELECT count(*) AS n FROM projects').get().n,1);
  const old=SUPERSEDED_PRESENTATION_TEMPLATES.find(e=>e.descriptor.id.startsWith('pack26-')).descriptor.id;
  assert.ok(!catalog.some(t=>t.id===old));
  await assert.rejects(templates.available(user,old),{status:404});
  assert.equal((await templates.readable(user,old)).id,old);
});
