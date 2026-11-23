'use client';
import {moldOptionName} from '@/public/mold-collections.js';
import {FILTER_STEPS,filterValue,filterOptions,matchingMolds,chooseFilteredMold,cutLabel,moldVersion,moldFilterSummary} from '@/public/mold-filters.js';
type Mold={id:string;name:string;category:string;panelCount:number;line?:string;packId?:string;modeling?:string;collar?:string;sideCut?:boolean;cutType?:string;bottomParts?:number;variant?:string;variantSource?:string;sourceName?:string};
const labels:Record<string,string>={modeling:'1. Modelagem',collar:'2. Gola',cutType:'3. Recorte',bottomParts:'4. Calção'};
export default function MoldPicker({templates,value,onChange,disabled=false}:{templates:Mold[];value:string;onChange:(id:string)=>void;disabled?:boolean}){
 const selected=templates.find(t=>t.id===value);
 const kits=templates.filter(t=>t.packId&&t.category==='conjunto');
 const shirts=templates.filter(t=>t.category==='camiseta');
 const others=templates.filter(t=>!t.packId&&t.category!=='camiseta');
 const mode=selected?.category==='camiseta'?'shirt':selected?.packId?'kit':'other';
 const pack=mode==='shirt'?shirts:kits;
 const current=selected||pack[0];
 if(!current)return null;
 const filters:Record<string,string>={};
 const steps=FILTER_STEPS.filter(key=>mode!=='shirt'||key!=='bottomParts').map(key=>{const options=filterOptions(pack,key,filters),chosen=filterValue(current,key);filters[key]=chosen;return {key,options,chosen};});
 const matching=matchingMolds(pack,filters);
 return <div className="mold-hierarchy">
  <label>Tipo de peça<select aria-label="Tipo de molde" value={mode} disabled={disabled} onChange={e=>{const list=e.target.value==='shirt'?shirts:e.target.value==='kit'?kits:others;const next=list.find(t=>t.modeling===current.modeling&&t.collar===current.collar&&t.cutType===current.cutType&&t.sideCut===current.sideCut&&t.variant===current.variant)||list[0];onChange(next?.id||'');}}>{kits.length>0&&<option value="kit">Kit camiseta + calção</option>}{shirts.length>0&&<option value="shirt">Somente camiseta</option>}{others.length>0&&<option value="other">Outras peças</option>}</select></label>
  {mode==='other'||!current.packId?<select id="projectMold" aria-label="Molde da peça" value={value} onChange={e=>onChange(e.target.value)} disabled={disabled}>{(mode==='shirt'?shirts:others).map(t=><option value={t.id} key={t.id}>{moldOptionName(t)}</option>)}</select>:<>
   <div className="mold-filter-grid">{steps.map(({key,options,chosen})=><label key={key}>{labels[key]}<select aria-label={labels[key]} value={chosen} disabled={disabled} onChange={e=>{const next=chooseFilteredMold(pack,current,key,e.target.value);if(next)onChange(next.id);}}>{options.map(option=><option value={option} key={option}>{key==='modeling'?(option==='NORMAL'?'Normal (manga tradicional)':'Raglan'):key==='cutType'?cutLabel(option):key==='bottomParts'?(option==='6'?'Recorte lateral':option+' partes'):option}</option>)}</select></label>)}</div>
   {(matching.length>1||(mode==='shirt'&&shirts.some(t=>!t.packId)))&&<label>Versão<select id="projectMold" aria-label="Versão do molde" value={value} disabled={disabled} onChange={e=>onChange(e.target.value)}>{(mode==='shirt'&&shirts.some(t=>!t.packId)?shirts:matching).map((t:Mold)=><option key={t.id} value={t.id}>{t.packId?(moldVersion(t)||t.name):t.name}</option>)}</select></label>}
   <p className="mold-hierarchy-path">{mode==='shirt'?current.name:moldFilterSummary(current)}<br/>{current.panelCount} painéis · combinação disponível</p>
   {matching.length>1&&<p className="helper">Arquivo: {current.variantSource||current.sourceName||current.name}</p>}
  </>}
  <a className="outline-button" href="/assets/molds/pack26-mapas.zip?rev=compact-20261113" download>Baixar todos os mapas (PDF + SVG)</a>
 </div>;
}
