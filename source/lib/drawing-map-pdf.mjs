import {PDFDocument,StandardFonts,rgb} from 'pdf-lib';
import {editableTemplateSvg} from './editable-template-svg.mjs';
const decode=s=>s.replace(/&(amp|lt|gt|quot|apos);/g,(_,k)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"}[k]));
const attrs=tag=>Object.fromEntries([...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
const color=s=>{if(s==='white')return rgb(1,1,1);if(s==='none')return undefined;let h=(s||'#333333').replace('#','');if(h.length===3)h=[...h].map(c=>c+c).join('');return rgb(...[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)/255));};
// 4096 SVG pixels at 96 dpi = 3072 PDF points. All panel paths stay vector.
export async function drawingMapPdf(source){
 const svg=editableTemplateSvg(source),doc=await PDFDocument.create(),page=doc.addPage([3072,3072]),font=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold),scale=.75;
 // drawSvgPath scales its complete graphics state, including width/dashes.
 for(const tag of svg.match(/<path\b[^>]*\/>/g)||[]){const a=attrs(tag);page.drawSvgPath(a.d,{x:0,y:3072,scale,color:color(a.fill),borderColor:color(a.stroke),borderWidth:Number(a['stroke-width']||0),...(a['stroke-dasharray']?{borderDashArray:a['stroke-dasharray'].split(/[ ,]+/).map(Number)}:{})});}
 for(const match of svg.matchAll(/<text\b([^>]*)>([^<]*)<\/text>/g)){const a=attrs(match[1]),f=a['font-weight']==='bold'?bold:font,size=Number(a['font-size']||23)*scale;
  const text=[...decode(match[2])].map(c=>{try{f.encodeText(c);return c;}catch{return '?';}}).join('');
  page.drawText(text,{x:Number(a.x||0)*scale,y:3072-Number(a.y||0)*scale,size,font:f,color:color(a.fill)||rgb(.15,.15,.15)});
 }
 doc.setTitle('Meinerz - mapa vetorial para desenho');return doc.save();
}
