// Byte-plane packing improves compression of float buffers. It never quantizes
// values: the complete GLB/delta is restored and checked before it is used.
export async function unpackMoldBytes(input){
 const bytes=input instanceof Uint8Array?input:new Uint8Array(input);
 if(bytes.length<4||new DataView(bytes.buffer,bytes.byteOffset,4).getUint32(0,true)!==0x31534c47)return bytes;
 if(bytes.length<40)throw Error('Cabeçalho de molde incompleto.');
 const length=new DataView(bytes.buffer,bytes.byteOffset+4,4).getUint32(0,true);
 if(length<8||length>24*1024*1024||bytes.length!==length+40)throw Error('Tamanho de molde inválido.');
 const source=bytes.subarray(40),out=new Uint8Array(length),count=Math.floor(length/4);
 for(let i=0;i<count;i++)for(let k=0;k<4;k++)out[i*4+k]=source[k*count+i];
 out.set(source.subarray(count*4),count*4);
 const hash=new Uint8Array(await crypto.subtle.digest('SHA-256',out));
 if(!hash.every((b,i)=>b===bytes[8+i]))throw Error('Conteúdo de molde divergente.');
 return out;
}
