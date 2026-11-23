import {readFile,writeFile} from 'node:fs/promises';
import {generateTemplate} from '../lib/template-generator.mjs';
import {drawingMapPdf} from '../lib/drawing-map-pdf.mjs';
const manifest=JSON.parse(await readFile('scripts/short-reference-manifest.json')),entries=[];
for(const meta of manifest){const dir=`public/assets/molds/${meta.id}/`,source=await readFile(dir+'source.glb'),r=await generateTemplate(source,{id:meta.id,name:meta.name,category:'calcao',offlineTrusted:true}),d=r.descriptor;
 for(const p of d.panels){p.label=meta.labels[p.mesh];p.displayName=p.label;const pr=d.primitives.find(x=>x.mesh===p.mesh);pr.label=p.label;pr.displayName=p.label;}
 Object.assign(d,{bottomParts:meta.bottomParts,line:'jogo',referenceSourceSha256:meta.originalSourceSha256,artBleedPixels:16});
 for(const p of d.panels){const label=meta.labels[p.mesh];for(const k of ['svg','proof'])r[k]=r[k].replace(new RegExp(`(<text[^>]*>)[^<]*P${String(p.number).padStart(2,'0')}[^<]*(</text>)`,'g'),`$1${label} · P${String(p.number).padStart(2,'0')}$2`);}
 for(const [file,data]of [['model.glb',r.model],['template.svg',r.svg],['proof.svg',r.proof],['map.pdf',await drawingMapPdf(r.svg)],['descriptor.json',JSON.stringify(d,null,2)]])await writeFile(dir+file,data);
 entries.push({descriptor:d,status:'published',sourceName:meta.sourceName,createdAt:'2026-11-12T19:30:00.000Z',assets:Object.fromEntries(['model','source','template','proof'].map(k=>[k,`/assets/molds/${meta.id}/${k}.${['source','model'].includes(k)?'glb':'svg'}`])),assetsPdf:`/assets/molds/${meta.id}/map.pdf`});console.log(meta.id,d.panelCount);
}
await writeFile('lib/short-reference-templates.mjs','// New owner-supplied standalone shorts, immutable IDs.\nexport const SHORT_REFERENCE_TEMPLATES=Object.freeze('+JSON.stringify(entries)+');\n');
