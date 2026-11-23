import {readFile} from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import {editableTemplateSvg} from '../lib/editable-template-svg.mjs';
import {PRESENTATION_PACK_TEMPLATES} from '../lib/presentation-pack-templates.mjs';
test('drawing panels are independent outlined curves with unchanged atlas coordinates',()=>{
 const original='<svg width="4096" viewBox="0 0 4096 4096"><g id="ARTE_DESENHE_AQUI"><g id="CORPO"><path id="PAINEL_1" fill="white" d="M10,20 L30,40 Z"/></g></g><g id="GUIAS_OCULTAR_ANTES_DE_EXPORTAR"><path fill="none" stroke="#abc123" d="M10,20 L30,40 Z"/><text>Frente</text></g></svg>';
 const result=editableTemplateSvg(original);
 assert.match(result,/<path id="PAINEL_1" fill="white" d="M10,20 L30,40 Z" stroke="#abc123"/);
 assert.equal((result.match(/<path /g)||[]).length,1);
 assert.match(result,/<text>Frente<\/text>/);
 assert.doesNotMatch(result,/id="CORPO"|id="ARTE_DESENHE_AQUI"/);
 assert.equal(editableTemplateSvg(result),result);
});
test('all 75 installed drawing maps expose one editable curve per numbered panel',async()=>{
 for(const entry of PRESENTATION_PACK_TEMPLATES){const svg=entry.templateSvg||await readFile(new URL('../public/assets/molds/'+entry.descriptor.id+'/template.svg',import.meta.url),'utf8');
  assert.doesNotMatch(svg,/\sdata-[\w:-]+=/);
  assert.equal((svg.match(/<path id="PAINEL_/g)||[]).length,entry.descriptor.panels.length);
  assert.doesNotMatch(svg,/id="ARTE_DESENHE_AQUI"|insensitive=|locked=/);
  assert.equal((svg.match(/<g /g)||[]).length,1);
 }
});
test('Corel export strips preserved SVG data on the page and each panel',()=>{
 const original='<svg xmlns="http://www.w3.org/2000/svg" data-editable-panels="1" width="4096" height="4096" viewBox="0 0 4096 4096"><path id="PAINEL_1" data-name="Frente" fill="white" d="M10,20 L30,40 Z" stroke="#123456"/><g id="GUIAS_OCULTAR_ANTES_DE_EXPORTAR"><text textLength="120" lengthAdjust="spacingAndGlyphs">Frente</text></g></svg>';
 const clean=editableTemplateSvg(original);
 assert.doesNotMatch(clean,/data-|textLength=|lengthAdjust=/);
 assert.match(clean,/id="PAINEL_1"/);assert.match(clean,/d="M10,20 L30,40 Z"/);
 assert.match(clean,/viewBox="0 0 4096 4096"/);assert.equal(clean,editableTemplateSvg(clean));
});
