import{fetchPackedSvg}from'./static-mold-drawings.mjs';
const paths=new Set(['/vendor/exceljs/exceljs.min.js','/vendor/fontkit/fontkit.umd.min.js','/simulador/vendor/three.core.js','/simulador/vendor/three.module.js','/simulador/kit-catalog.js']);
// Keep public import URLs stable while storing these large libraries losslessly.
export async function servePackedVendorScript(request,assets){
 const url=new URL(request.url);if(!assets||!paths.has(url.pathname)||!['GET','HEAD'].includes(request.method))return null;
 const res=await fetchPackedSvg(assets,url);if(!res.ok){await res.body?.cancel();return null;}
 const bytes=await res.arrayBuffer(),hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join(''),etag='"vendor-'+hash+'"',headers=new Headers({'Content-Type':'text/javascript; charset=utf-8','X-Content-Type-Options':'nosniff','Cache-Control':'public, max-age=0, must-revalidate','ETag':etag});
 if(request.headers.get('If-None-Match')===etag)return new Response(null,{status:304,headers});
 return new Response(request.method==='HEAD'?null:bytes,{headers});
}
