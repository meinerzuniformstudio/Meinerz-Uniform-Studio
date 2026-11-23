import {artBleedSvg,ART_BLEED_PIXELS} from './art-bleed-svg.mjs';
import {editableTemplateSvg} from './editable-template-svg.mjs';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const f=n=>Number(n).toFixed(3);
// All panels use one shared scale. No rotation, stretching or per-piece resize.
export function compactPanelLayout(panels){
 const gap=48,label=62,margin=76,top=350,W=4096-margin*2,H=3990-top;
 const waist=panels.filter(p=>/^Cós/.test(p.label)),other=panels.filter(p=>!/^Cós/.test(p.label));
 function attempt(scale,columns,sort){
  const item=p=>({number:p.number,w:Math.max(p.physicalSize[0]*scale,250)+gap,h:p.physicalSize[1]*scale+label+gap,p});
  const items=other.map(item),cos=waist.map(item);if(cos.length){const rows=[];for(let i=0;i<cos.length;i+=columns)rows.push(cos.slice(i,i+columns));const box={w:Math.max(...rows.map(row=>row.reduce((s,p)=>s+p.w,0))),h:rows.reduce((s,row)=>s+Math.max(...row.map(p=>p.h)),0),children:[]};let yy=0;for(const row of rows){let xx=0;for(const p of row){box.children.push({...p,xx,yy});xx+=p.w;}yy+=Math.max(...row.map(p=>p.h));}items.push(box);}
  items.sort((a,b)=>sort===0?b.w*b.h-a.w*a.h:Math.max(b.w,b.h)-Math.max(a.w,a.h));let free=[{x:0,y:0,w:W,h:H}],placed=new Map();
  for(const item of items){let best=null;for(const r of free)if(item.w<=r.w&&item.h<=r.h){const score=Math.min(r.w-item.w,r.h-item.h)*10000+Math.max(r.w-item.w,r.h-item.h);if(!best||score<best.score)best={...r,score};}if(!best)return null;const used={x:best.x,y:best.y,w:item.w,h:item.h};const next=[];for(const r of free){if(used.x>=r.x+r.w||used.x+used.w<=r.x||used.y>=r.y+r.h||used.y+used.h<=r.y){next.push(r);continue;}if(used.x>r.x)next.push({x:r.x,y:r.y,w:used.x-r.x,h:r.h});if(used.x+used.w<r.x+r.w)next.push({x:used.x+used.w,y:r.y,w:r.x+r.w-used.x-used.w,h:r.h});if(used.y>r.y)next.push({x:r.x,y:r.y,w:r.w,h:used.y-r.y});if(used.y+used.h<r.y+r.h)next.push({x:r.x,y:used.y+used.h,w:r.w,h:r.y+r.h-used.y-used.h});}free=next.filter((r,i)=>!next.some((q,j)=>i!==j&&r.x>=q.x&&r.y>=q.y&&r.x+r.w<=q.x+q.w&&r.y+r.h<=q.y+q.h&&(r.w*r.h<q.w*q.h||j<i)));
   for(const child of item.children||[{...item,xx:0,yy:0}])placed.set(child.number,{x:margin+used.x+child.xx,y:top+used.y+child.yy+label,w:child.p.physicalSize[0]*scale,h:child.p.physicalSize[1]*scale,labelWidth:child.w-gap});
  }return {rects:placed,groups:[{id:'PAINEIS',title:'PAINÉIS · CÓS AGRUPADOS',panels:panels.map(p=>p.number),heading:{x:margin,y:top-25}}]};
 }
 let winner=null;for(const columns of [...new Set([1,2,waist.length||1])])for(const sort of [0,1]){let low=0,high=100000;for(let i=0;i<36;i++){const mid=(low+high)/2;if(attempt(mid,columns,sort))low=mid;else high=mid;}const scale=low*.995,result=attempt(scale,columns,sort);if(result&&(!winner||scale>winner.scale))winner={...result,scale};}if(!winner)throw Error('No compact layout');return winner;
}
export function relayoutDrawingSvg(source,recipe){
 const {descriptor:d,previous}=recipe,paths=new Map();
 for(const m of source.matchAll(/<path\b[^>]*id="CORTE_PAINEL_(\d+)"[^>]*\/>/g))paths.set(+m[1],m[0].match(/\bd="([^"]*)"/)[1]);
 const art=[],guides=[],text=(x,y,s,size=23)=>`<text x="${f(x)}" y="${f(y)}" font-family="Arial,sans-serif" font-size="${size}" fill="#263c49">${esc(s)}</text>`;
 guides.push(text(90,85,'MEINERZ UNIFORM STUDIO · MAPA DE ARTE',32),text(90,142,d.name,30),text(90,208,'SANGRIA 10,67 PX · TRACEJADO: CONTORNO DA PEÇA',21),text(90,246,'OCULTE GUIAS_OCULTAR_ANTES_DE_EXPORTAR ANTES DE EXPORTAR A ARTE · PÁGINA INTEIRA 4096 × 4096',21));
 for(const g of d.layoutGroups)guides.push(text(g.heading.x,g.heading.y,g.title,28));
 for(const p of d.panels){const old=previous.panels.find(q=>q.number===p.number),r=p.rect,ratio=d.texelsPerUvUnit/previous.scale;let path=paths.get(p.number);if(!path)throw Error('Missing trim contour '+p.number);const points=[...path.matchAll(/[ML](-?[\d.]+),(-?[\d.]+)/g)].map(m=>[+m[1],+m[2]]),bounds=[Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))];path=path.replace(/([ML])(-?[\d.]+),(-?[\d.]+)/g,(_,op,x,y)=>`${op}${f(r.x+(+x-bounds[0])*r.w/(bounds[2]-bounds[0]))},${f(r.y+(+y-bounds[1])*r.h/(bounds[3]-bounds[1]))}`);art.push(`<path id="PAINEL_${p.number}" fill="#ffffff" stroke="#555555" stroke-width="2" fill-rule="evenodd" d="${path}"/>`);
  const words=p.displayName.split(' '),lines=[];let line='';for(const word of words){if((line+' '+word).length*12>r.labelWidth&&line){lines.push(line);line=word;}else line+=(line?' ':'')+word;}if(line)lines.push(line);if(lines.length>2)throw Error('Label overflows '+p.displayName);lines.forEach((s,k)=>guides.push(text(r.x,r.y-48+k*27,s)));
 }
 const raw=`<svg xmlns="http://www.w3.org/2000/svg" width="4096" height="4096" viewBox="0 0 4096 4096"><title>${esc(d.name)}</title><rect width="4096" height="4096" fill="#ffffff"/>${art.join('')}<g id="GUIAS_OCULTAR_ANTES_DE_EXPORTAR">${guides.join('')}</g></svg>`;
 return artBleedSvg(editableTemplateSvg(raw));
}
