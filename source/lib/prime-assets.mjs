import{PRIME_ASSET_INDEX}from'./prime-asset-index.mjs';
const prefix='prime-assets-20261116',marker=prefix+'/READY',allowed=new Map(PRIME_ASSET_INDEX.map(f=>[f.path,f]));
export const isPrimePath=path=>/^\/assets\/molds\/[a-z0-9-]+-prime-20261116[a-z0-9-]*\/[a-z0-9.-]+$/.test(path);
export const primeReady=async bucket=>!!(bucket&&await bucket.head(marker));
export function primeAssets(assets,bucket){return{async fetch(request){const path=new URL(request.url).pathname;if(bucket&&allowed.has(path)){const object=await bucket.get(prefix+path);if(object)return new Response(object.body,{headers:{'Content-Type':allowed.get(path).type,'Cache-Control':'public, max-age=0, must-revalidate',ETag:'"'+object.etag+'"'}});}return assets.fetch(request);}};}
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function primeImport(request,env){
 const u=new URL(request.url);
 if(u.pathname==='/api/prime-assets-ready')return json({ready:await primeReady(env.BUCKET)});
 if(u.pathname!=='/api/internal/prime-import')return null;
 const token=env.PRIME_ASSET_UPLOAD_KEY;
 if(!token||request.headers.get('authorization')!=='Bearer '+token)return json({error:'Acesso indisponível.'},404);
 if(!env.BUCKET)return json({error:'Armazenamento indisponível.'},503);
 if(request.method==='POST'&&u.searchParams.get('action')==='finish'){
  const rows=await env.BUCKET.list({prefix:prefix+'/assets/',limit:1000,include:['customMetadata']}),have=new Map(rows.objects.map(o=>[o.key,o]));
  const missing=PRIME_ASSET_INDEX.filter(f=>have.get(prefix+f.path)?.customMetadata?.sha256!==f.sha256);
  if(missing.length)return json({error:'Lote incompleto.',missing:missing.map(f=>f.path)},409);
  await env.BUCKET.put(marker,JSON.stringify({files:PRIME_ASSET_INDEX.length,at:new Date().toISOString()}));return json({ready:true,files:PRIME_ASSET_INDEX.length});
 }
 if(request.method!=='PUT')return json({error:'Método não permitido.'},405);
 const path=u.searchParams.get('path'),file=allowed.get(path);if(!file)return json({error:'Arquivo fora do lote.'},400);
 if(Number(request.headers.get('content-length'))!==file.size||file.size>4*1024*1024)return json({error:'Tamanho inválido.'},413);
 const bytes=await request.arrayBuffer();if(bytes.byteLength!==file.size)return json({error:'Arquivo incompleto.'},400);
 const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');if(hash!==file.sha256)return json({error:'Conteúdo divergente.'},400);
 const key=prefix+path,existing=await env.BUCKET.head(key);if(existing&&existing.customMetadata?.sha256!==hash)return json({error:'Destino imutável já existe.'},409);
 if(!existing)await env.BUCKET.put(key,bytes,{httpMetadata:{contentType:file.type},customMetadata:{sha256:hash}});
 return json({saved:true,path});
}
