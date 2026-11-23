import{readFile,writeFile,readdir}from'node:fs/promises';
import{gzipSync,gunzipSync}from'node:zlib';
import{createHash}from'node:crypto';
import{unpackMoldBytes}from'../lib/packed-mold-bytes.mjs';
let saved=0,count=0;
for(const dir of await readdir('dist/client/assets/molds',{withFileTypes:true})){
 if(!dir.isDirectory())continue;
 for(const name of await readdir('dist/client/assets/molds/'+dir.name)){
  if(!/^(?:model|source)\.(?:glb|delta)\.gz$/.test(name))continue;
  const path='dist/client/assets/molds/'+dir.name+'/'+name,old=await readFile(path),raw=await unpackMoldBytes(gunzipSync(old));
  if(raw.length>24*1024*1024)throw Error('Mold exceeds bounded transport size');
  const data=Buffer.alloc(raw.length+40);data.write('GLS1');data.writeUInt32LE(raw.length,4);createHash('sha256').update(raw).digest().copy(data,8);const n=Math.floor(raw.length/4);
  for(let i=0;i<n;i++)for(let k=0;k<4;k++)data[40+k*n+i]=raw[i*4+k];
  data.set(raw.subarray(n*4),40+n*4);const packed=gzipSync(data,{level:9});
  if(packed.length+1024>=old.length)continue;
  if(!Buffer.from(await unpackMoldBytes(gunzipSync(packed))).equals(Buffer.from(raw)))throw Error('Mold packing changed canonical bytes');
  await writeFile(path,packed);saved+=old.length-packed.length;count++;
 }
}
console.log(JSON.stringify({bytePlanePackedFiles:count,savedBytes:saved}));
