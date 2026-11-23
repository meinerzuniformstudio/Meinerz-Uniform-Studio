import assert from 'node:assert/strict';
import test from 'node:test';
import {INSTALLED_TEMPLATES} from '../lib/installed-templates.mjs';
import {orderedDescriptor} from '../lib/ordered-drawing.mjs';
import {SIMULATOR_KITS,simulatorKit} from '../public/simulador/kit-catalog.js';
import {prepareBakedGeometry} from '../public/model-panels.js';
import {Float32BufferAttribute} from '../public/simulador/vendor/three.module.js';

test('the simulator and the drawing sheet use identical rects and preserve garment sides',()=>{
 for(const kit of SIMULATOR_KITS){
  const original=INSTALLED_TEMPLATES.find(e=>e.descriptor.id===kit.id).descriptor;
  const d=orderedDescriptor(original),sim=simulatorKit(d.id);
  const panel=label=>d.panels.find(p=>p.label===label);
  assert.ok(panel('Frente').rect.x<panel('Costas').rect.x);
  for(const side of ['esquerda','direita']){
   const sleeve=panel('Manga '+side),trim=panel('Filete manga '+side);
   if(trim)assert.ok(trim.rect.y>sleeve.rect.y+sleeve.rect.h);
  }
  const top=d.panels.filter(p=>!(/^(Calção|Cós)/.test(p.label)));
  const lower=d.panels.filter(p=>!top.includes(p));
  assert.ok(Math.min(...lower.map(p=>p.rect.y))>Math.max(...top.map(p=>p.rect.y+p.rect.h)));
  const left=lower.filter(p=>p.label.includes('esquerdo')),right=lower.filter(p=>p.label.includes('direito'));
  assert.ok(Math.max(...left.map(p=>p.rect.x+p.rect.w))<Math.min(...right.map(p=>p.rect.x)));
  for(const side of [left,right]){
   const waists=side.filter(p=>p.label.startsWith('Cós')),legs=side.filter(p=>p.label.startsWith('Calção'));
   if(waists.length&&legs.length)assert.ok(Math.max(...waists.map(p=>p.rect.y+p.rect.h))<Math.min(...legs.map(p=>p.rect.y)));
  }
  for(const p of d.panels){
   const r=p.rect,old=p.sourceMapRect,q=sim.panels.find(q=>q.mesh===p.mesh&&q.primitive===p.primitive);
   assert.deepEqual(q.rect,r);assert.ok(Math.abs(r.w/old.w-r.h/old.h)<1e-8);
   const a=new Float32BufferAttribute([old.x/4096,old.y/4096,(old.x+old.w)/4096,(old.y+old.h)/4096],2);
   const {atlasUv}=prepareBakedGeometry({attributes:{uv:a,uv1:a}},p);
   assert.ok(Math.abs(atlasUv.getX(0)*4096-r.x)<.001&&Math.abs(atlasUv.getY(1)*4096-r.h-r.y)<.001);
   assert.ok(r.x>=16&&r.y>=16&&r.x+r.w<4080&&r.y+r.h<4080);
   for(const other of d.panels.filter(other=>other.number>p.number)){const b=other.rect;assert.ok(r.x+r.w+24<=b.x||b.x+b.w+24<=r.x||r.y+r.h+24<=b.y||b.y+b.h+24<=r.y);}
  }
 }
});
