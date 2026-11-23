// Lay out the complete sheet with one scale. Gutters include space for the
// vector outline, bleed and label, even for a very narrow trim strip.
export function orderedPanels(panels) {
  const lower=p=>p.piece==='shorts'||/^(calção|cós)/i.test(p.label);
  const left=p=>/esquerd/i.test(p.label), right=p=>/direit/i.test(p.label);
  const top=panels.filter(p=>!lower(p)), bottom=panels.filter(lower);
  const row=(...items)=>({axis:'x',items:items.filter(Boolean)});
  const column=(...items)=>({axis:'y',items:items.filter(Boolean)});
  const part=p=>({panel:p});
  const byName=(list,rx)=>list.filter(p=>rx.test(p.label));
  const band=list=>row(...list.map(part));
  const body=byName(top,/^(frente|costas)\b/i).sort((a,b)=>Number(/^costas/i.test(a.label))-Number(/^costas/i.test(b.label)));
  const sleeves=byName(top,/^(manga|filete)/i);
  const collars=byName(top,/^(gola|peitilho)/i);
  const extras=top.filter(p=>!body.includes(p)&&!sleeves.includes(p)&&!collars.includes(p));
  const sleeveSide=side=>column(...sleeves.filter(side).sort((a,b)=>Number(/^filete/i.test(a.label))-Number(/^filete/i.test(b.label))).map(part));
  const lowerSide=side=>{
    const pieces=bottom.filter(side),waist=byName(pieces,/^cós/i);
    const legs=pieces.filter(p=>!waist.includes(p)&&!/^viés/i.test(p.label));
    const trims=byName(pieces,/^viés/i);
    return column(band(waist),band(legs),band(trims));
  };
  const collarRows=[];
  for(let i=0;i<collars.length;i+=2)collarRows.push(band(collars.slice(i,i+2)));
  const layout=column(row(band(body),column(row(sleeveSide(left),sleeveSide(right)),...collarRows)),band(extras),row(lowerSide(left),lowerSide(right)),band(bottom.filter(p=>!left(p)&&!right(p))));
  function measure(node,scale){
    if(node.panel){
      const p=node.panel,w=p.rect.w*scale,h=p.rect.h*scale;
      const width=Math.max(w,Math.min(390,12*(p.label.split('·')[0].trim().length+6)))+40;
      return {w:width,h:h+85,place(x,y,out){out.set(p,{x:x+(width-w)/2,y:y+51,w,h,labelWidth:width-16,labelX:x+8});}};
    }
    const children=node.items.map(item=>measure(item,scale)).filter(box=>box.h>0);
    if(!children.length)return {w:0,h:0,place(){}};
    const horizontal=node.axis==='x',gap=20;
    const sum=k=>children.reduce((n,c)=>n+c[k],gap*(children.length-1));
    const max=k=>Math.max(...children.map(c=>c[k]));
    return {w:horizontal?sum('w'):max('w'),h:horizontal?max('h'):sum('h'),place(x,y,out){
      for(const child of children){child.place(x,y,out);if(horizontal)x+=child.w+gap;else y+=child.h+gap;}
    }};
  }
  let lo=0,hi=Math.min(...panels.map(p=>4000/Math.max(p.rect.w,p.rect.h)));
  for(let i=0;i<35;i++){const s=(lo+hi)/2,box=measure(layout,s);if(box.w<=3996&&box.h<=3810)lo=s;else hi=s;}
  const box=measure(layout,lo),out=new Map();box.place((4096-box.w)/2,210,out);
  if(out.size!==panels.length)throw Error('O mapa contém um painel sem posição.');
  return panels.map(p=>({...p,rect:out.get(p)}));
}
