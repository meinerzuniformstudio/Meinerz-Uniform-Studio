import {readFile} from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import {inflateSync} from 'node:zlib';
import {PDFDocument} from 'pdf-lib';
import {drawingMapPdf} from '../lib/drawing-map-pdf.mjs';
import {PRESENTATION_PACK_TEMPLATES} from '../lib/presentation-pack-templates.mjs';
test('all pack maps have a matching page and native PDF curves without SVG data, images or restrictions',async()=>{
 for(const entry of PRESENTATION_PACK_TEMPLATES){
  const bytes=await drawingMapPdf(entry.templateSvg||await readFile(new URL('../public/assets/molds/'+entry.descriptor.id+'/template.svg',import.meta.url),'utf8')),pdf=await PDFDocument.load(bytes),page=pdf.getPages()[0];
  assert.equal(pdf.getPageCount(),1);assert.deepEqual(page.getSize(),{width:3072,height:3072});assert.equal(pdf.isEncrypted,false);assert.equal(page.node.Annots()?.size()||0,0);
  const content=page.node.Contents().asArray().map(ref=>inflateSync(pdf.context.lookup(ref).getContents()).toString()).join('\n');
  assert.ok((content.match(/\nh\n/g)||[]).length>=entry.descriptor.panels.length,entry.descriptor.id);
  assert.doesNotMatch(content,/data-name|data-editable|SVG|\sDo\s/);
 }
});
