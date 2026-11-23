// Deployment-only lossless codec change. Preserve canonical GLS1/delta payloads.
import{readdir,readFile,writeFile,unlink}from'node:fs/promises';
import{gunzipSync,brotliCompressSync,brotliDecompressSync,constants}from'node:zlib';
const root='dist/client/assets/molds';let saved=0,count=0;
for(const dir of await readdir(root,{withFileTypes:true})){if(!dir.isDirectory())continue;for(const name of await readdir(root+'/'+dir.name)){if(!/^(model|source)\.(glb|delta)\.gz$/.test(name))continue;
 const file=root+'/'+dir.name+'/'+name,old=await readFile(file),raw=gunzipSync(old),packed=brotliCompressSync(raw,{params:{[constants.BROTLI_PARAM_QUALITY]:8}});
 if(packed.length+1024>=old.length)continue;if(!brotliDecompressSync(packed).equals(raw))throw Error('Transport bytes changed');await writeFile(file.slice(0,-3)+'.br',packed);await unlink(file);saved+=old.length-packed.length;count++;
}}
console.log({brotliPackedMolds:count,savedBytes:saved});
