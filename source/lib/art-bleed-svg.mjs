export const ART_BLEED_PIXELS=16*2/3;
// Small parallel contour around the drawing field. Model UVs continue to use
// the original trim contour; only the editable art field gains this margin.
export function expandArtPath(d,padding=ART_BLEED_PIXELS){
 return d.split(/[Zz]/).filter(s=>s.trim()).map(part=>{
  const points=[...part.matchAll(/[ML](-?[\d.]+),(-?[\d.]+)/g)].map(m=>[+m[1],+m[2]]);
  if(points.length<3)return part+' Z';
  let area=0;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length];area+=a[0]*b[1]-b[0]*a[1];}
  const sign=area>=0?1:-1,normal=(a,b)=>{const x=b[0]-a[0],y=b[1]-a[1],len=Math.hypot(x,y)||1;return [sign*y/len,-sign*x/len];};
  return points.map((p,i)=>{const before=points[(i+points.length-1)%points.length],after=points[(i+1)%points.length],a=normal(before,p),b=normal(p,after),x=a[0]+b[0],y=a[1]+b[1],den=1+a[0]*b[0]+a[1]*b[1];let dx=den>1e-8?padding*x/den:padding*b[0],dy=den>1e-8?padding*y/den:padding*b[1];const distance=Math.hypot(dx,dy);if(distance>padding*2){dx*=padding*2/distance;dy*=padding*2/distance;}return `${i?'L':'M'}${(p[0]+dx).toFixed(3)},${(p[1]+dy).toFixed(3)}`;}).join(' ')+' Z';
 }).join(' ');
}
export function artBleedSvg(svg){
 if(/<!-- ATLAS_ART_BLEED_[\d.]+ -->/.test(svg))return svg;
 const at=svg.indexOf('<g id="GUIAS_OCULTAR_ANTES_DE_EXPORTAR"');
 if(at<0)return svg;
 const cutGuides=[];
 const art=svg.slice(0,at).replace(/<path\b[^>]*id="PAINEL_\d+"[^>]*\/>/g,tag=>{
  const d=tag.match(/\bd="([^"]+)"/)?.[1];if(!d)return tag;
  const number=tag.match(/id="PAINEL_(\d+)"/)[1];
  cutGuides.push(`<path id="CORTE_PAINEL_${number}" fill="none" stroke="#587181" stroke-width="2" stroke-dasharray="10 7" d="${d}"/>`);
  return tag.replace(/\bd="[^"]*"/,`d="${expandArtPath(d)}"`).replace(/\sstroke="[^"]*"/,' stroke="#555555"').replace(/\sstroke-width="[^"]*"/,' stroke-width="2"');
 });
 const guides=svg.slice(at).replace(/(<g id="GUIAS_OCULTAR_ANTES_DE_EXPORTAR">)/,'$1'+cutGuides.join('')).replace('OCULTE AS GUIAS ANTES DE EXPORTAR','SANGRIA 10,67 PX · OCULTE AS GUIAS ANTES DE EXPORTAR');
 return art+'<!-- ATLAS_ART_BLEED_10.666667 -->'+guides;
}
