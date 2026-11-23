// Canonical sources stay in Git. Paired preparation sources are not needed by
// the browser: only their baked model and drawing assets are deployed.
import {readdir,unlink,readFile,rm} from 'node:fs/promises';
import path from 'node:path';
const preparationOnly=new Set(['pack26-normal-polo-redonda-sem-recorte-v2','pack26-normal-redonda-com-recorte','pack26-normal-redonda-com-recorte-v2']);
const derivedSource=root=>/-(?:paired|derived)-v\d+$/.test(root)||preparationOnly.has(path.basename(root));
async function prune(root,buildOutput=false){let entries;try{entries=await readdir(root,{withFileTypes:true});}catch(error){if(error.code==='ENOENT')return;throw error;}for(const entry of entries){const file=path.join(root,entry.name);if(entry.isDirectory())await prune(file,buildOutput);else if(entry.isFile()&&(/^\.(?:model|source|cloth-input)\.glb(?:\.gz)?\.[A-Za-z0-9]+$/.test(entry.name)||(buildOutput&&((['cloth-input.glb','preparation.json','pair-audit.json','surface-partition.json'].includes(entry.name)||(entry.name==='descriptor.json'&&path.basename(root).startsWith('pack26-'))||(/^(?:preview|pair-preview|map-preview)\.png$/.test(entry.name)&&path.basename(root).startsWith('pack26-')))||(derivedSource(root)&&/^source\.glb(?:\.gz)?$/.test(entry.name))))))await unlink(file).catch(error=>{if(error.code!=='ENOENT')throw error;});}}
// The repository is the canonical, reproducible source. Prune deployment copies
// only: removing preparation sources here would break old project downloads.
await prune('dist/client/assets/molds',true);
// PDFs and revised proof sheets are reproduced by serveMoldDrawing from their
// canonical template. Originals stay in Git; public download URLs stay valid.
for(const entry of await readdir('dist/client/assets/molds',{withFileTypes:true})){
 if(!entry.isDirectory())continue;
 for(const file of ['map.pdf',...(/(?:-proporcao-v1|-compacto-v2)$/.test(entry.name)?['proof.svg','proof.svg.gz']:[])])
  await unlink(path.join('dist/client/assets/molds',entry.name,file)).catch(error=>{if(error.code!=='ENOENT')throw error;});
}

// Draft IDs from this upload batch were never selectable or used by projects.
const batch=JSON.parse(await readFile('scripts/upload-refresh-audit.json','utf8'));
for(const id of batch.intermediateIds){if(!/^[a-z0-9-]*20261113[a-z0-9-]*$/.test(id)||id.endsWith('-proporcao-v1'))throw Error('Invalid staging ID');await rm(path.join('dist/client/assets/molds',id),{recursive:true,force:true});}

// This batch's preparation IDs were never offered to projects.
const eliteBatch=JSON.parse(await readFile('scripts/elite-upload-audit.json','utf8'));
for(const id of eliteBatch.intermediateIds){if(!id.includes('elitebatch-20261113')||id.endsWith('-proporcao-v1'))throw Error('Invalid Elite staging ID');await rm(path.join('dist/client/assets/molds',id),{recursive:true,force:true});}

const vfixBatch=JSON.parse(await readFile('scripts/vfix-upload-audit.json','utf8'));
for(const id of vfixBatch.intermediateIds){if(!id.includes('vfix-20261113')||id.endsWith('-proporcao-v1'))throw Error('Invalid V staging ID');await rm(path.join('dist/client/assets/molds',id),{recursive:true,force:true});}

const maxBatch=JSON.parse(await readFile('scripts/max-upload-audit.json','utf8'));
for(const id of maxBatch.intermediateIds){if(!id.includes('maxbatch-20261113')||id.endsWith('-proporcao-v1'))throw Error('Invalid MAX staging ID');await rm(path.join('dist/client/assets/molds',id),{recursive:true,force:true});}
// EDGE was removed by the owner; the simulator now uses the MAX atlas too.
for(const id of ['kit-edge-2027','kit-edge-2027-mapa-v3','kit-edge-2027-mapa-v3-proporcao-v1'])await rm(path.join('dist/client/assets/molds',id),{recursive:true,force:true});
await rm('dist/client/simulador/models/kit-edge-2027.json',{force:true});

const prestigeBatch=JSON.parse(await readFile('scripts/prestige-upload-audit.json','utf8'));
for(const id of prestigeBatch.intermediateIds){if(!id.includes('prestigebatch-20261113')||id.endsWith('-proporcao-v1'))throw Error('Invalid Prestige staging ID');await rm(path.join('dist/client/assets/molds',id),{recursive:true,force:true});}

const lateralBatch=JSON.parse(await readFile('scripts/lateral-shorts-audit.json','utf8'));
for(const id of lateralBatch.intermediateIds){if(!id.includes('shorts-lateral-v1')&&!id.includes('calcao-recorte-lateral-aprovado-v1'))throw Error('Invalid lateral staging ID');await rm(path.join('dist/client/assets/molds',id),{recursive:true,force:true});}

// Compact drawing sheets are reconstructed losslessly from their previous SVG.
for(const e of await readdir('dist/client/assets/molds',{withFileTypes:true})){if(!e.isDirectory()||!e.name.endsWith('-compacto-v2'))continue;for(const f of ['template.svg','proof.svg'])await unlink(path.join('dist/client/assets/molds',e.name,f)).catch(e=>{if(e.code!=='ENOENT')throw e;});}
