import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import Excel from 'exceljs';
import {drawBrandLogo} from '../public/brand-assets.js';
import {writeListWorkbook,readOrderWorkbook} from '../public/order-files.js';
import {prepareListSheets,parseListMatrix} from '../public/order-list.js';

test('Meinerz theme variants share the supplied geometry and outline lettering',async()=>{
 const variants=await Promise.all(['light','dark'].map(t=>readFile(new URL('../public/assets/meinerz/studio-'+t+'.svg',import.meta.url),'utf8')));const paths=variants.map(s=>[...s.matchAll(/\bd="([^"]+)"/g)].map(m=>m[1]));assert.deepEqual(paths[0],paths[1]);assert.ok(paths[0].length>10);for(const svg of variants){assert.match(svg,/viewBox="0 0 4253.7 1052.36"/);assert.doesNotMatch(svg,/<text|<script|<image|foreignObject|<!DOCTYPE/i);}
});
test('presentation and video logos retain the entire native aspect ratio without viewport cropping',()=>{
 const image={naturalWidth:1200,naturalHeight:297},calls=[],ctx={drawImage(...args){calls.push(args);}};const r=drawBrandLogo(ctx,image,12,15,440,160);assert.equal(calls[0].length,5);assert.equal(calls[0][0],image);assert.ok(Math.abs(r.width/r.height-1200/297)<1e-12);assert.ok(r.width<=440&&r.height<=160);
});
test('Meinerz templates import legacy models without losing leading zero numbers or empty fields',async()=>{
 const bytes=await writeListWorkbook([],Excel,{template:true}),book=new Excel.Workbook();await book.xlsx.load(bytes);assert.match(book.creator,/Meinerz Uniform Studio/);const metadata=book.getWorksheet('_Modelo Meinerz');assert.equal(metadata.getCell('A1').value,'atlas.order-list');metadata.name='_Modelo Atlas';metadata.getCell('A1').value='atlas.order-list';book.creator='Atlas Uniform Studio · Andrei Raimundi';
 book.getWorksheet('Pedido').addRow(['Linha',null,'00','M','G',1,null]);const sheets=prepareListSheets(await readOrderWorkbook(await book.xlsx.writeBuffer(),Excel)),parsed=parseListMatrix(sheets.find(s=>s.enabled));assert.equal(parsed.records.length,1);assert.equal(parsed.records[0].numero,'00');assert.equal(parsed.records[0].nome,'');assert.equal(parsed.records[0].adicional,'');assert.equal(parsed.records[0].produto,'Kit');
});
test('every current tool screen uses Meinerz branding and the supplied logo variants',async()=>{
 for(const file of ['pedido.html','organizador.html','viewer.html','acervo.html','proposta.html','simulador/editor.html']){const html=await readFile(new URL('../public/'+file,import.meta.url),'utf8');assert.doesNotMatch(html.replace(/<select[^>]*data-order="factoryId"[^>]*>[\s\S]*?<\/select>/g,''),/ATLAS UNIFORM STUDIO/i);assert.match(html,/studio-light\.svg/);assert.match(html,/studio-dark\.svg/);assert.match(html,/atlas-brand\.css/);}
});
