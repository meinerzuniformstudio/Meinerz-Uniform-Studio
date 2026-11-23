import{readFile,writeFile}from'node:fs/promises';
import{createPhysicalMapEntries}from'./physical-map-layout.mjs';
import{readGlb,readAccessor}from'../lib/template-generator.mjs';
import{compactPanelLayout,relayoutDrawingSvg}from'../lib/compact-drawing-layout.mjs';
import{drawingMapPdf}from'../lib/drawing-map-pdf.mjs';
const drafts=JSON.parse(await readFile('work/prime-draft-entries.json','utf8'));
const {entries,audit}=await createPhysicalMapEntries(drafts,{suffix:'-mapa-v1',preservePairShapes:true});
const encode=(j,b)=>{const raw=Buffer.from(JSON.stringify(j)),n=Math.ceil(raw.length/4)*4,o=Buffer.alloc(28+n+b.length);o.writeUInt32LE(0x46546c67);o.writeUInt32LE(2,4);o.writeUInt32LE(o.length,8);o.writeUInt32LE(n,12);o.writeUInt32LE(0x4e4f534a,16);o.fill(32,20,20+n);raw.copy(o,20);o.writeUInt32LE(b.length,20+n);o.writeUInt32LE(0x004e4942,24+n);b.copy(o,28+n);return o;};
for(const e of entries){const before=structuredClone(e.descriptor),d=e.descriptor,layout=compactPanelLayout(d.panels),root='public/assets/molds/'+d.id;
 const model=readGlb(await readFile(root+'/model.glb')),j=model.json,b=Buffer.from(model.binary),view=new DataView(b.buffer,b.byteOffset,b.byteLength);
 d.artBleedPixels=16*2/3;d.texelsPerUvUnit=layout.scale;d.layoutGroups=layout.groups;d.mapRevision='prime-compact-v1';d.logoGuides=[];delete d.guideLabelBoxes;
 for(const p of d.panels){p.rect=layout.rects.get(p.number);p.group='PAINEIS';const r=p.rect,m=p.physicalMatrix,min=p.physicalBounds;p.atlasTransform=[m[0][0]*layout.scale,m[0][1]*layout.scale,m[1][0]*layout.scale,m[1][1]*layout.scale,r.x-min[0]*layout.scale,r.y-min[1]*layout.scale];
  const pr=j.meshes[p.mesh].primitives[p.primitive],uv=readAccessor(j,b,pr.attributes.TEXCOORD_1),acc=j.accessors[pr.attributes.TEXCOORD_0],bv=j.bufferViews[acc.bufferView];
  for(let i=0;i<uv.count;i++){const u=uv.data[i*2],v=uv.data[i*2+1],x=u*m[0][0]+v*m[1][0],y=u*m[0][1]+v*m[1][1],at=(bv.byteOffset||0)+(acc.byteOffset||0)+i*(bv.byteStride||8);view.setFloat32(at,(r.x+(x-min[0])*layout.scale)/4096,true);view.setFloat32(at+4,(r.y+(y-min[1])*layout.scale)/4096,true);}
 }
 const svg=relayoutDrawingSvg(e.templateSvg,{previous:{scale:before.texelsPerUvUnit,panels:before.panels.map(p=>({number:p.number,rect:p.rect}))},descriptor:d});
 await writeFile(root+'/model.glb',encode(j,b));await writeFile(root+'/descriptor.json',JSON.stringify(d,null,2)+'\n');await writeFile(root+'/template.svg',svg);await writeFile(root+'/proof.svg',svg.replaceAll('fill="#ffffff" stroke=','fill="#d8e8eb" stroke='));await writeFile(root+'/map.pdf',await drawingMapPdf(svg));delete e.templateSvg;delete d.replaces;
 d.proportionMethod='intrinsic metric per native panel, no pair stretching; one common atlas scale';await writeFile(root+'/descriptor.json',JSON.stringify(d,null,2)+'\n');
}
await writeFile('work/prime-final-entries.json',JSON.stringify(entries));await writeFile('scripts/prime-map-audit.json',JSON.stringify(audit,null,2)+'\n');
