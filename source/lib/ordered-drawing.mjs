import {orderedPanels} from '../public/ordered-panel-layout.js';
import {expandArtPath} from './art-bleed-svg.mjs';
export const MAP_REVISION='-ord1';
export function orderedDescriptor(base){
  const panels=orderedPanels(base.panels).map((p,i)=>({...p,sourceMapRect:base.panels[i].rect}));
  return {...base,id:base.id+MAP_REVISION,baseTemplateId:undefined,mapRevision:'ord1',panels,
    layoutGroups:[{id:'PAINEIS',title:'Painéis',panels:panels.map(p=>p.number),heading:{x:50,y:180}}],logoGuides:[]};
}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const text=(x,y,v,size)=>`<text x="${x}" y="${y}" font-family="Arial,sans-serif" font-size="${size}" fill="#263c49">${esc(v)}</text>`;
export function orderedDrawing(source,descriptor,proof=false){
  const paths=new Map();
  for(const [tag,n] of source.matchAll(/<path\b[^>]*\bid="CORTE_PAINEL_(\d+)"[^>]*\/>/g))paths.set(+n,tag.match(/\bd="([^"]+)"/)[1]);
  const guides=[],art=[];
  for(const p of descriptor.panels){
    const r=p.rect,old=p.sourceMapRect,scale=r.w/old.w,sourcePath=paths.get(p.number);
    if(!sourcePath)throw Error('Contorno ausente no painel '+p.number);
    const path=sourcePath.replace(/([ML])(-?[\d.]+),(-?[\d.]+)/g,(_,op,x,y)=>op+(r.x+(+x-old.x)*scale).toFixed(3)+','+(r.y+(+y-old.y)*scale).toFixed(3));
    const bleed=expandArtPath(path,descriptor.artBleedPixels);
    art.push(`<path id="PAINEL_${p.number}" fill="${proof?'#d8e8eb':'#ffffff'}" stroke="#555555" stroke-width="2" fill-rule="evenodd" d="${bleed}"/>`);
    guides.push(`<path id="CORTE_PAINEL_${p.number}" fill="none" stroke="#587181" stroke-width="2" stroke-dasharray="10 7" d="${path}"/>`,text(r.labelX,r.y-20,p.displayName||p.label,20));
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="4096" height="4096" viewBox="0 0 4096 4096"><title>${esc(descriptor.name)}</title><rect width="4096" height="4096" fill="#ffffff"/>${art.join('')}<g id="GUIAS_OCULTAR_ANTES_DE_EXPORTAR">${text(56,74,descriptor.name,34)}${text(56,128,'Sangria '+descriptor.artBleedPixels.toLocaleString('pt-BR',{maximumFractionDigits:2})+' px · Oculte as guias e exporte a página inteira.',23)}${guides.join('')}</g></svg>`;
}
