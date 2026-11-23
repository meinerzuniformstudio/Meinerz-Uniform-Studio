import {brotliDecompressSync} from 'node:zlib';
import {readModelDelta,applyModelDelta} from '../public/model-delta.js';
import {unpackMoldBytes} from './packed-mold-bytes.mjs';
const sha=async bytes=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
async function fetchFile(assets,url){return assets.fetch(new Request(url,{headers:{'Accept-Encoding':'identity'}}));}
const brotliResponses=new WeakSet();
async function fetchPacked(assets,url){const gz=new URL(url);gz.pathname+='.gz';let res=await fetchFile(assets,gz);if(res.status===404){await res.body?.cancel();const br=new URL(url);br.pathname+='.br';res=await fetchFile(assets,br);if(res.ok)brotliResponses.add(res);}return res;}
async function deltaResponse(assets,url){const u=new URL(url);u.pathname=u.pathname.replace(/\.glb$/,'.delta');return fetchPacked(assets,u);}
async function unpack(response){return unpackMoldBytes(new Uint8Array(brotliResponses.has(response)?brotliDecompressSync(await response.arrayBuffer()):await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()));}
async function reconstruct(assets,url,patch,depth=0,visited=new Set(),budget={bytes:0}){
 // Revised source downloads may refer to their baked model plus the existing
 // four/five-part ancestry. Six frames and a cumulative allocation bound keep
 // the source → five-part → four-part → cut → base chain finite and small.
 budget.bytes+=patch.meta.targetLength;
 if(depth>7||budget.bytes>64*1024*1024||visited.has(url.pathname))throw Error('Referência circular ou pesada de molde.');visited.add(url.pathname);
 const {meta}=patch,baseUrl=new URL(meta.basePath,url);let packed=await fetchPacked(assets,baseUrl),base;
 if(packed.status===404){await packed.body?.cancel();packed=await deltaResponse(assets,baseUrl);if(!packed.ok)throw Error('Base de molde ausente.');base=await reconstruct(assets,baseUrl,readModelDelta(await unpack(packed)),depth+1,visited,budget);}
 else{if(!packed.ok)throw Error('Base de molde indisponível.');base=await unpack(packed);budget.bytes+=base.length;if(budget.bytes>64*1024*1024)throw Error('Base de molde pesada.');}
 if(meta.extraBasePath){const extraUrl=new URL(meta.extraBasePath,url);let res=await fetchPacked(assets,extraUrl),extra;if(res.status===404){await res.body?.cancel();res=await deltaResponse(assets,extraUrl);if(!res.ok)throw Error('Calção de referência ausente.');extra=await reconstruct(assets,extraUrl,readModelDelta(await unpack(res)),depth+1,new Set(visited),budget);}else{if(!res.ok)throw Error('Calção de referência indisponível.');extra=await unpack(res);budget.bytes+=extra.length;}if(budget.bytes>64*1024*1024||await sha(extra)!==meta.extraBaseSha256)throw Error('Calção de referência divergente.');const combined=new Uint8Array(base.length+extra.length);combined.set(base);combined.set(extra,base.length);base=combined;}
 if(await sha(base)!==meta.baseSha256)throw Error('Base de molde divergente.');const bytes=applyModelDelta(base,patch);if(await sha(bytes)!==meta.targetSha256)throw Error('Molde divergente.');return bytes;
}
// Existing URLs serve byte-identical GLBs, using gzip or lossless deltas.
export async function serveCompressedMold(request,assets){
 if(!assets||!['GET','HEAD'].includes(request.method))return null;
 const url=new URL(request.url);if(!/^\/assets\/molds\/[a-z0-9-]+\/(?:model|source)\.glb$/.test(url.pathname))return null;url.search='';
 let packed=await fetchPacked(assets,url),patch;
 if(packed.status===404){await packed.body?.cancel();packed=await deltaResponse(assets,url);if(packed.status===404){await packed.body?.cancel();return null;}if(!packed.ok||!packed.body)return new Response('Não foi possível carregar o molde.',{status:502});try{patch=readModelDelta(await unpack(packed));}catch{return new Response('Pacote de molde inválido.',{status:502});}}
 if(!packed.ok||(!patch&&!packed.body))return new Response('Não foi possível carregar o molde.',{status:502});
 const headers=new Headers(packed.headers);for(const key of ['content-encoding','content-length','content-range','accept-ranges'])headers.delete(key);headers.set('Content-Type','model/gltf-binary');headers.set('X-Content-Type-Options','nosniff');if(patch)headers.set('ETag','"'+patch.meta.targetSha256+'"');
 const etag=headers.get('etag');if(etag&&request.headers.get('if-none-match')?.split(',').map(s=>s.trim()).some(s=>s==='*'||s===etag)){if(!patch)await packed.body.cancel();return new Response(null,{status:304,headers});}
 if(request.method==='HEAD'){if(!patch)await packed.body.cancel();return new Response(null,{status:200,headers});}
 if(!patch)return new Response(await unpack(packed),{status:200,headers});
 try{return new Response(await reconstruct(assets,url,patch),{status:200,headers});}catch{return new Response('Não foi possível reconstruir o molde.',{status:502});}
}
