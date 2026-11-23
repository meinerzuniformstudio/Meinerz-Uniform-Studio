import {brotliDecompressSync} from 'node:zlib';
import {relayoutDrawingSvg} from './compact-drawing-layout.mjs';
import {drawingMapPdf} from './drawing-map-pdf.mjs';
// Canonical SVGs may be stored losslessly compressed in the deployment only.
export async function fetchPackedSvg(assets,url,depth=0){
 if(depth>2)return new Response(null,{status:404});
 let res=await assets.fetch(new Request(url,{headers:{'Accept-Encoding':'identity'}}));
 if(res.status!==404)return res;await res.body?.cancel();
 const packedUrl=new URL(url);packedUrl.pathname+='.gz';res=await assets.fetch(new Request(packedUrl,{headers:{'Accept-Encoding':'identity'}}));
 let brotli=false;if(res.status===404){await res.body?.cancel();packedUrl.pathname=packedUrl.pathname.slice(0,-3)+'.br';res=await assets.fetch(new Request(packedUrl,{headers:{'Accept-Encoding':'identity'}}));brotli=true;}
 if(res.status===404&&/\/assets\/molds\/[a-z0-9-]+-compacto-v2\/template\.svg$/.test(new URL(url).pathname)){
  await res.body?.cancel();const recipeUrl=new URL(url);recipeUrl.pathname=recipeUrl.pathname.replace(/template\.svg$/,'template.layout.json.br');const recipeRes=await assets.fetch(new Request(recipeUrl));if(!recipeRes.ok)return recipeRes;
  const recipe=JSON.parse(brotliDecompressSync(await recipeRes.arrayBuffer()).toString('utf8'));
  if(!/^\/assets\/molds\/[a-z0-9-]+\/template\.svg$/.test(recipe.basePath)||recipe.basePath===new URL(url).pathname)return new Response(null,{status:404});
  const base=await fetchPackedSvg(assets,new URL(recipe.basePath,url),depth+1);if(!base.ok)return base;
  return new Response(relayoutDrawingSvg(await base.text(),recipe),{headers:{'Content-Type':'image/svg+xml; charset=utf-8'}});
 }
 if(!res.ok||!res.body)return res;
 const headers=new Headers(res.headers);for(const key of ['content-encoding','content-length','content-range','accept-ranges'])headers.delete(key);headers.set('Content-Type','image/svg+xml; charset=utf-8');
 return new Response(brotli?brotliDecompressSync(await res.arrayBuffer()):res.body.pipeThrough(new DecompressionStream('gzip')),{headers});
}
// Preserve all original download URLs without duplicating their contours.
export async function serveMoldDrawing(request,assets){
 if(!assets||!['GET','HEAD'].includes(request.method))return null;
 const url=new URL(request.url),match=url.pathname.match(/^\/assets\/molds\/([a-z0-9-]+)\/(map\.pdf|proof\.svg|template\.svg)$/),isPdf=match?.[2]==='map.pdf';
 if(!match&&!/^\/(?:assets|simulador)\/[a-zA-Z0-9_.%/-]+\.svg$/.test(url.pathname))return null;
 const sourceUrl=new URL(url);sourceUrl.search='';if(isPdf)sourceUrl.pathname=sourceUrl.pathname.replace(/map\.pdf$/,'template.svg');
 let source=await fetchPackedSvg(assets,sourceUrl),derivedProof=false;
 if(!source.ok&&match?.[2]==='proof.svg'&&/(?:-proporcao-v1|-compacto-v2)$/.test(match[1])){await source.body?.cancel();sourceUrl.pathname=sourceUrl.pathname.replace(/proof\.svg$/,'template.svg');source=await fetchPackedSvg(assets,sourceUrl);derivedProof=true;}
 if(!source.ok){await source.body?.cancel();return null;}
 const svg=await source.text(),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(svg))),v=>v.toString(16).padStart(2,'0')).join('');
 const etag=`W/"atlas-drawing-${hash}-${isPdf?'pdf2':derivedProof?'proof1':'svg1'}"`,headers=new Headers({'Content-Type':isPdf?'application/pdf':'image/svg+xml; charset=utf-8','X-Content-Type-Options':'nosniff','Cache-Control':'public, max-age=0, must-revalidate','ETag':etag});
 if(request.headers.get('if-none-match')?.split(',').map(v=>v.trim()).some(v=>v==='*'||v.replace(/^W\//,'')===etag.replace(/^W\//,'')))return new Response(null,{status:304,headers});
 if(request.method==='HEAD')return new Response(null,{headers});
 return new Response(isPdf?await drawingMapPdf(svg):derivedProof?svg.replace(/(<path id="PAINEL_\d+" fill=")#ffffff(")/g,'$1#d8e8eb$2'):svg,{headers});
}
