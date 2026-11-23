import {readdir,readFile,writeFile} from 'node:fs/promises';
import {editableTemplateSvg} from '../lib/editable-template-svg.mjs';
async function visit(dir){for(const item of await readdir(dir,{withFileTypes:true})){const p=dir+'/'+item.name;if(item.isDirectory())await visit(p);else if(item.name==='template.svg')await writeFile(p,editableTemplateSvg(await readFile(p,'utf8')));}}
await visit('public/assets/molds');
for(const file of ['lib/presentation-pack-templates.mjs','lib/installed-templates.mjs','lib/simulator-presentation-templates.mjs']){
 const source=await readFile(file,'utf8');
 const next=source.replace(/"templateSvg":("(?:\\.|[^"\\])*")/g,(_,literal)=>'"templateSvg":'+JSON.stringify(editableTemplateSvg(JSON.parse(literal))));
 await writeFile(file,next);
}
await import('./build-presentation-pack-download.mjs');
