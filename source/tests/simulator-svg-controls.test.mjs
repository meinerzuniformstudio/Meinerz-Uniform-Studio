import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {IMPORTED_GRAPHICS} from '../public/simulador/imported-graphics.js';
import {GRAPHIC_IDS,AVAILABLE_GRAPHICS} from '../public/simulador/graphics.js';
import {eliteState} from '../public/simulador/elite.js';
import {layer,move,normalizeText,clone} from '../public/simulador/core.js';
import {applyGraphic} from '../public/simulador/layers.js';
import {setLiveSymmetry,synchronizeLive} from '../public/simulador/symmetry.js';
import {validateSimulatorState} from '../lib/simulator-validation.mjs';
const manifest=JSON.parse(await readFile(new URL('../public/simulador/models/kit-edge-2027.json',import.meta.url)));
// Imported SVG files are archived resources; the active library now uses editable graphics.
test('archived SVG assets stay self-contained and integrity checked',async()=>{
 assert.equal(IMPORTED_GRAPHICS.length,18);
 for(const g of IMPORTED_GRAPHICS){assert.ok(!GRAPHIC_IDS.has(g.id));const bytes=await readFile(new URL('../public'+g.src,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),g.sha256);assert.equal(bytes.length,g.bytes);const svg=bytes.toString();assert.match(svg,/<svg\b/);assert.match(svg,/<path\b/);assert.doesNotMatch(svg,/<(?:script|foreignObject|image|use)\b|\bon\w+\s*=|<!DOCTYPE|(?:href|src)=/i);}
});
test('active graphic replacement stays one layer, preserves mirroring and rejects archived library IDs',()=>{
 const s=eliteState(manifest.panels);s.panels[0].layers=[];s.active=s.panels[0].id;
 const first=applyGraphic(s,'pinstripes').layer;Object.assign(first,{mirrorX:true,rotation:45});applyGraphic(s,'stripes');assert.equal(s.panels[0].layers.length,1);
 const saved=validateSimulatorState(s).panels[0].layers[0];assert.equal(saved.pattern,'stripes');assert.equal(saved.mirrorX,true);assert.equal(saved.rotation,45);saved.pattern='svg-999';s.panels[0].layers=[saved];assert.throws(()=>validateSimulatorState(s));
});
test('precise movement preserves coordinates without implicit snapping',()=>{
 for(const type of ['text','image','badge']){const l=layer(type);move(l,.52,.37);assert.equal(l.x,.52);assert.equal(l.y,.37);move(l,.6,.4);assert.equal(l.x,.6);l.snapCenter=false;move(l,.51,.2);assert.equal(l.x,.51);}
 const pattern=layer('pattern');move(pattern,.51,.4);assert.equal(pattern.x,.51);
});
test('player labels remain upright with fixed personalization on save',()=>{
 for(const angle of [0,90,-90,180]){const l=layer('text',{text:'10',rotation:angle});normalizeText(l);assert.equal(l.text,'00');assert.equal(l.rotation,0);}
 for(const angle of [45,35,-12])assert.equal(normalizeText(layer('text',{text:'JOGADOR',rotation:angle})).rotation,0);
 const s=eliteState(manifest.panels);s.panels[0].layers=[layer('text',{text:'00',font:'mnz-autumn-26',rotation:90})];assert.equal(validateSimulatorState(s).panels[0].layers[0].rotation,0);
});
test('default symmetry preserves independent colors; explicit color opt-in shares them',()=>{
 let s=eliteState(manifest.panels);s.active='sleeve-right';const p=id=>s.panels.find(p=>p.id===id);p('sleeve-right').layers=[];p('sleeve-left').layers=[];
 let previous=clone(s);applyGraphic(s,'pinstripes');synchronizeLive(s,previous);assert.equal(p('sleeve-left').layers[0].pattern,'pinstripes');
 s=setLiveSymmetry(s,{pairId:'sleeves',sourceId:'sleeve-right',colors:true,base:true}).state;previous=clone(s);const c=s.panels.find(p=>p.id==='front');Object.assign(p('sleeve-right'),{color:c.color,colorId:c.colorId});Object.assign(p('sleeve-right').layers[0],{color:c.color,colorId:c.colorId});synchronizeLive(s,previous);assert.equal(p('sleeve-left').layers[0].colorId,c.colorId);
 s=setLiveSymmetry(s,{pairId:'sleeves',sourceId:'sleeve-right',colors:false,base:false}).state;const kept=p('sleeve-left').layers[0].colorId;previous=clone(s);p('sleeve-right').layers[0].x=.2;synchronizeLive(s,previous);assert.equal(p('sleeve-left').layers[0].x,.8);assert.equal(s.symmetry.sleeves.colors,false);assert.equal(p('sleeve-left').layers[0].colorId,kept);
});

test('retired catalog choices remain unavailable for new selections',()=>{assert.ok(AVAILABLE_GRAPHICS.length>0);for(const id of ['straight-line','h-stripes','double-sash','shoulders','svg-01']){assert.ok(!AVAILABLE_GRAPHICS.some(g=>g.id===id));const s=eliteState(manifest.panels);assert.throws(()=>applyGraphic(s,id));}});
