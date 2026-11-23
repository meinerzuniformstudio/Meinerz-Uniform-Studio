// Exercise the real production reconstruction path against packaged static files.
import{readFile}from'node:fs/promises';import{createHash}from'node:crypto';
import{primeAssets}from'../lib/prime-assets.mjs';
import{serveCompressedMold}from'../lib/static-mold-binaries.mjs';
const entries=JSON.parse(await readFile('work/prime-transport-jobs.json','utf8'));
const staticAssets={async fetch(request){const path=new URL(request.url).pathname;if(!/^\/assets\/molds\/[a-z0-9-]+\/[a-z0-9.-]+$/.test(path))return new Response(null,{status:404});try{return new Response(await readFile('dist/client'+path));}catch(e){if(e.code==='ENOENT')return new Response(null,{status:404});throw e;}}};
const bucket={async get(key){try{return {body:await readFile('public'+key.replace(/^prime-assets-20261116/,'')),etag:'audit'};}catch(e){if(e.code==='ENOENT')return null;throw e;}}};
const assets=primeAssets(staticAssets,bucket);
let checked=0;
for(const e of entries)for(const kind of ['model','source']){const path=e.assets[kind],expected=await readFile('public'+path),res=await serveCompressedMold(new Request('https://atlas.test'+path),assets);if(!res?.ok)throw Error('Unusable '+path+' '+res?.status+' '+(res?await res.text():''));const actual=Buffer.from(await res.arrayBuffer());if(!actual.equals(expected))throw Error('Changed bytes '+path);checked++;}
console.log({primePackedAssetsVerified:checked,mode:'production reconstruction, exact canonical bytes'});
