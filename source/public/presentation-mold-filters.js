import {FILTER_STEPS,filterValue,filterOptions,matchingMolds,chooseFilteredMold,cutLabel,moldVersion,moldFilterSummary} from './mold-filters.js';
export function presentationMoldFilters({host,select,items,currentId,busy}) {
 let draft=items.find(m=>m.id===currentId)||items[0];
 const labels={modeling:'1. Modelagem',collar:'2. Gola',cutType:'3. Recorte',bottomParts:'4. Calção'};
 function render(){
  host.replaceChildren();const prefix={};
  for(const key of FILTER_STEPS){const label=document.createElement('label');label.textContent=labels[key];const input=document.createElement('select');input.setAttribute('aria-label',labels[key]);input.disabled=busy();
   for(const value of filterOptions(items,key,prefix)){const option=document.createElement('option');option.value=value;option.textContent=key==='modeling'?(value==='NORMAL'?'Normal (manga tradicional)':'Raglan'):key==='cutType'?cutLabel(value):key==='bottomParts'?value+' partes':value;input.append(option);}
   input.value=filterValue(draft,key);prefix[key]=input.value;input.addEventListener('change',()=>{if(busy())return;draft=chooseFilteredMold(items,draft,key,input.value);render();});label.append(input);host.append(label);
  }
  const matches=matchingMolds(items,prefix);select.replaceChildren();
  for(const mold of matches){const option=document.createElement('option');option.value=mold.id;option.textContent=(moldVersion(mold)||'Padrão')+' · '+mold.panelCount+' painéis';select.append(option);}
  select.value=draft.id;select.hidden=true;select.disabled=busy();
  if(matches.length>1){const label=document.createElement('label');label.textContent='5. Versão';const input=document.createElement('select');input.setAttribute('aria-label','Versão do molde');input.disabled=busy();for(const mold of matches){const option=document.createElement('option');option.value=mold.id;option.textContent=moldVersion(mold)||'Padrão';input.append(option);}input.value=draft.id;input.addEventListener('change',()=>{if(busy())return;draft=matches.find(m=>m.id===input.value)||draft;render();});label.append(input);host.append(label);}
  const note=document.createElement('p');note.className='helper mold-filter-summary';note.setAttribute('aria-live','polite');note.textContent=moldFilterSummary(draft);host.append(note);
  if(matches.length>1){const source=document.createElement('p');source.className='helper mold-variant-source';source.textContent='Arquivo: '+(draft.variantSource||draft.sourceName||draft.name);host.append(source);}
  const apply=document.createElement('button');apply.type='button';apply.id='applyPresentationMold';apply.className='primary-button';apply.disabled=busy()||draft.id===currentId;apply.textContent=draft.id===currentId?'Molde atual':'Aplicar este molde';apply.addEventListener('click',()=>{if(busy())return;select.value=draft.id;select.dispatchEvent(new Event('change',{bubbles:true}));});host.append(apply);
 }
 render();
 return {reset(id){currentId=id;draft=items.find(m=>m.id===id)||draft;render();}};
}
