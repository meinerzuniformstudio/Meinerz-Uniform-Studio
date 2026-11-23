import{test}from'node:test';import assert from'node:assert/strict';import{readFile}from'node:fs/promises';import{PRIME_ASSET_INDEX}from'../lib/prime-asset-index.mjs';import{primeImport,primeAssets}from'../lib/prime-assets.mjs';
function bucket(){const files=new Map();return{files,async head(k){return files.get(k)||null},async put(k,bytes,opts={}){files.set(k,{bytes,...opts,etag:'unit-test-etag'})},async get(k){const x=files.get(k);return x?{...x,body:x.bytes}:null},async list({prefix}){return{objects:[...files].filter(([k])=>k.startsWith(prefix)).map(([key,x])=>({key,customMetadata:x.customMetadata}))}}};}
test('PRIME import requires the temporary key and exact immutable allowlisted content',async()=>{
 const b=bucket(),env={BUCKET:b,PRIME_ASSET_UPLOAD_KEY:'unit-test-only'},file=PRIME_ASSET_INDEX[0],url='https://atlas.test/api/internal/prime-import?path='+encodeURIComponent(file.path),bytes=await readFile(new URL('../public'+file.path,import.meta.url));
 assert.equal((await primeImport(new Request(url,{method:'PUT',body:bytes}),env)).status,404);
 const headers={Authorization:'Bearer unit-test-only','Content-Length':String(file.size)};
 assert.equal((await primeImport(new Request(url,{method:'PUT',headers,body:Buffer.alloc(file.size)}),env)).status,400);
 assert.equal((await primeImport(new Request(url,{method:'PUT',headers,body:bytes}),env)).status,200);
 assert.equal((await primeImport(new Request(url,{method:'PUT',headers,body:bytes}),env)).status,200);assert.equal(b.files.size,1);
 assert.equal((await primeImport(new Request('https://atlas.test/api/internal/prime-import?action=finish',{method:'POST',headers}),env)).status,409);
 assert.equal((await primeImport(new Request(url,{method:'PUT',headers,body:bytes}),{BUCKET:b})).status,404);
 const assets=primeAssets({async fetch(){return new Response(null,{status:404})}},b);assert.deepEqual(Buffer.from(await(await assets.fetch(new Request('https://atlas.test'+file.path))).arrayBuffer()),bytes);
});
