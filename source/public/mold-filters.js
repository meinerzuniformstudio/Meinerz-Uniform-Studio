// A cut is a garment construction, not a different collar.
export const moldCollar = mold => mold.collar==='ELITE ARREDONDADA'?'ELITE':mold.collar||'';
export const moldCut = mold => mold.cutType || (!mold.sideCut?'SEM RECORTE':moldCollar(mold)==='ELITE'?(mold.variant==='FAIXA'?'FAIXA':'AXILA'):'LATERAL');
export const moldVersion = mold => mold.variant==='FAIXA'?'':mold.variant||'';
export const cutLabel = cut => ({'SEM RECORTE':'Sem recorte',FAIXA:'Recorte faixa',AXILA:'Recorte axila',LATERAL:'Recorte lateral'})[cut]||cut;
export const filterValue = (mold,key) => key==='collar'?moldCollar(mold):key==='cutType'?moldCut(mold):key==='bottomParts'?String(mold.bottomParts||2):key==='variant'?moldVersion(mold):mold[key]||'';
export const FILTER_STEPS=['modeling','collar','cutType','bottomParts'];
export const matchingMolds=(items,filters)=>items.filter(m=>Object.entries(filters).every(([key,value])=>filterValue(m,key)===String(value)));
export function filterOptions(items,key,filters={}) {
 return [...new Set(matchingMolds(items,filters).map(m=>filterValue(m,key)))].sort((a,b)=>key==='bottomParts'?Number(a)-Number(b):a.localeCompare(b,'pt-BR'));
}
// Preserve downstream choices when available; never synthesize an unavailable combination.
export function chooseFilteredMold(items,current,key,value) {
 const index=FILTER_STEPS.indexOf(key),prefix=Object.fromEntries(FILTER_STEPS.slice(0,index).map(k=>[k,filterValue(current,k)]));
 const candidates=matchingMolds(items,{...prefix,[key]:String(value)});
 const score=m=>FILTER_STEPS.slice(index+1).reduce((n,k)=>n+(filterValue(m,k)===filterValue(current,k)?(k==='bottomParts'?4:2):0),0)+(moldVersion(m)===moldVersion(current)?1:0);
 return candidates.slice().sort((a,b)=>score(b)-score(a))[0]||current;
}
export const moldFilterSummary=m=>[m.modeling==='NORMAL'?'Normal':'Raglan',moldCollar(m),cutLabel(moldCut(m)),moldVersion(m),m.bottomVariant==='lateral'?'Calção recorte lateral':'Calção '+(m.bottomParts||2)+' partes'].filter(Boolean).join(' · ');
