// Lossless COPY/ADD transport. Meinerz UVs can be replayed from the model's
// preserved native UVs, with the exact same arithmetic used by the map baker.
function validateUvReplay(meta){
 if(meta.uvReplay===undefined)return;
 if(!Array.isArray(meta.uvReplay)||meta.uvReplay.length>128)throw Error('UV de molde inválido.');let total=0;
 for(const r of meta.uvReplay){
  if(!r||![r.sourceOffset,r.targetOffset,r.count,r.sourceStride,r.targetStride].every(Number.isSafeInteger)||r.sourceOffset<0||r.targetOffset<0||r.sourceOffset%4||r.targetOffset%4||r.count<1||r.sourceStride<8||r.sourceStride>256||r.targetStride<8||r.targetStride>256||r.sourceStride%4||r.targetStride%4||r.sourceOffset+(r.count-1)*r.sourceStride+8>meta.targetLength||r.targetOffset+(r.count-1)*r.targetStride+8>meta.targetLength||!Array.isArray(r.matrix)||r.matrix.length!==4||!Array.isArray(r.origin)||r.origin.length!==2||!Array.isArray(r.rect)||r.rect.length!==2||![...r.matrix,...r.origin,...r.rect,r.scale].every(Number.isFinite)||r.scale<=0)throw Error('UV de molde inválido.');
  total+=r.count;if(total>500000)throw Error('UV de molde excede o limite.');
 }
 const targets=meta.uvReplay.map(r=>[r.targetOffset,r.targetOffset+(r.count-1)*r.targetStride+8]);
 for(const r of meta.uvReplay){const end=r.sourceOffset+(r.count-1)*r.sourceStride+8;if(targets.some(([a,b])=>r.sourceOffset<b&&end>a))throw Error('UV original sobreposto.');}
 if(meta.uvFixups!==undefined&&(!Array.isArray(meta.uvFixups)||meta.uvFixups.length>10000||meta.uvFixups.some(f=>!Array.isArray(f)||f.length!==2||!f.every(Number.isSafeInteger)||f[0]%4||f[0]<0||f[1]<0||f[1]>4294967295||!targets.some(([a,b])=>f[0]>=a&&f[0]+4<=b))))throw Error('Correção de UV inválida.');
}
export function readModelDelta(input){
 const bytes=input instanceof Uint8Array?input:new Uint8Array(input),view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 if(bytes.length<8||view.getUint32(0,true)!==0x314c5441)throw Error('Pacote de molde inválido.');
 const n=view.getUint32(4,true);if(n<2||n>4*1024*1024||8+n>bytes.length)throw Error('Cabeçalho de molde inválido.');
 const meta=JSON.parse(new TextDecoder().decode(bytes.subarray(8,8+n)));
 if(!/^\/assets\/molds\/[a-z0-9-]+\/model\.glb$/.test(meta.basePath)||!Number.isSafeInteger(meta.targetLength)||meta.targetLength<28||meta.targetLength>20*1024*1024||!Array.isArray(meta.ops)||meta.ops.length>100000||!/^[a-f0-9]{64}$/.test(meta.targetSha256)||!/^[a-f0-9]{64}$/.test(meta.baseSha256))throw Error('Descrição de molde inválida.');
 if(meta.extraBasePath!==undefined&&(!/^\/assets\/molds\/[a-z0-9-]+\/model\.glb$/.test(meta.extraBasePath)||!/^[a-f0-9]{64}$/.test(meta.extraBaseSha256)))throw Error('Referência adicional inválida.');
 validateUvReplay(meta);return {meta,literal:bytes.subarray(8+n)};
}
export function applyModelDelta(base,input){
 const {meta,literal}=input?.meta?input:readModelDelta(input),source=base instanceof Uint8Array?base:new Uint8Array(base),out=new Uint8Array(meta.targetLength);let at=0;
 for(const op of meta.ops){if(!Array.isArray(op)||op.length!==3||![0,1].includes(op[0])||!Number.isSafeInteger(op[1])||!Number.isSafeInteger(op[2])||op[1]<0||op[2]<1||at+op[2]>out.length)throw Error('Bloco de molde inválido.');const src=op[0]===0?source:literal;if(op[1]+op[2]>src.length)throw Error('Bloco de molde incompleto.');out.set(src.subarray(op[1],op[1]+op[2]),at);at+=op[2];}
 if(at!==out.length)throw Error('Molde incompleto.');validateUvReplay(meta);
 if(meta.uvReplay){const v=new DataView(out.buffer);for(const r of meta.uvReplay){const [a,b,c,d]=r.matrix;for(let i=0;i<r.count;i++){const at=r.sourceOffset+i*r.sourceStride,u=v.getFloat32(at,true),w=v.getFloat32(at+4,true),x=u*a+w*c,y=u*b+w*d,target=r.targetOffset+i*r.targetStride;v.setFloat32(target,(r.rect[0]+(x-r.origin[0])*r.scale)/4096,true);v.setFloat32(target+4,(r.rect[1]+(y-r.origin[1])*r.scale)/4096,true);}}for(const [at,bits]of meta.uvFixups||[])v.setUint32(at,bits,true);}
 return out;
}
