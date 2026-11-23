// Canonical PNG originals stay in Git. The entry screen uses the WebP versions;
// these unreferenced originals and an offline contact sheet are not deployed.
import{unlink}from'node:fs/promises';
for(const path of ['assets/entry/uniform-product.png','assets/entry/futsal-athlete.png','assets/entry/football-athlete.png','assets/molds/pack26-sidecut-variants-preview.png'])await unlink('dist/client/'+path).catch(e=>{if(e.code!=='ENOENT')throw e;});
