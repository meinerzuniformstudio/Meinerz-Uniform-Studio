// Intermediate PRIME preparation files stay in Git, not in the deploy payload.
import{readFile,rm}from'node:fs/promises';
const batch=JSON.parse(await readFile('scripts/prime-upload-audit.json','utf8'));
for(const id of batch.intermediateIds){if(!id.includes('-prime-20261116')||id.endsWith('-mapa-v1'))throw Error('Invalid PRIME preparation ID');await rm('dist/client/assets/molds/'+id,{recursive:true,force:true});}
// Final PRIME model/source/maps are served from the Site's existing R2 bucket.
for(const e of batch.entries){if(!e.id.includes('-prime-20261116')||!e.id.endsWith('-mapa-v1'))throw Error('Invalid PRIME asset ID');await rm('dist/client/assets/molds/'+e.id,{recursive:true,force:true});}
