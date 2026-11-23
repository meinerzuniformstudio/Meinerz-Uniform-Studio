"""Approved lateral shorts: exact prototype geometry, paired panels, unchanged shirts."""
from shorts_geometry import *
from pathlib import Path
import hashlib
D=ROOT/'work/lateral-shorts';D.mkdir(exist_ok=True)
entries=json.loads((D/'bases.json').read_text());approved=Glb(ROOT/'work/shorts-lateral-preview/preview.glb')
# Separate the two main pieces on each leg; keep the two approved lateral strips.
meshes=[];labels=['Calção frente direito','Calção costas direito','Calção lateral direito','Calção frente esquerdo','Calção costas esquerdo','Calção lateral esquerdo','Cós esquerdo','Cós direito']
for original,band in [(0,1),(2,3)]:
 a,ix=approved.data(original);ts=a[ix];front=ts[ts[:,:,2].mean(1)>0.007];back=ts[ts[:,:,2].mean(1)<=0.007]
 # Connected charts separated by the lateral cut are identified through UV U.
 middle=json.loads((ROOT/'work/shorts-lateral-preview/audit.json').read_text())['panels'][original//2]['center'];low=ts[ts[:,:,6].mean(1)<middle];high=ts[ts[:,:,6].mean(1)>middle];front,back=sorted([low,high],key=lambda t:-t[:,:,2].mean())
 meshes.extend([triangles_primitive(front),triangles_primitive(back),primitive(approved,band)])
meshes.extend([primitive(approved,4),primitive(approved,5)])
# Every new kit uses these same approved shorts, not a refitted copy.
reference='pack26-calcao-recorte-lateral-aprovado-v1';target=ROOT/'public/assets/molds'/reference;target.mkdir(exist_ok=True)
class Ref:pass
r=Ref();r.j=copy.deepcopy(approved.j);r.j['materials']=[{'name':'Tecido neutro','pbrMetallicRoughness':{'baseColorFactor':[1,1,1,1],'metallicFactor':0,'roughnessFactor':.98},'doubleSided':True}];r.j['nodes']=[{'mesh':i}for i in range(8)]
j,b=write_meshes(r,meshes,labels);raw=encode(j,b);(target/'source.glb').write_bytes(raw);(target/'cloth-input.glb').write_bytes(raw)
base_meta=dict(id=reference,name='CALÇÃO · RECORTE LATERAL',category='calcao',labels=labels,panelKinds=['shorts']*6+['waist']*2,decorativeMeshes=[],uvCanonicalMeshes=[],bottomParts=6,bottomVariant='lateral',sideCut=False,collar='',modeling='',sourceName='Calção recorte lateral aprovado.glb',originalSourceSha256=hashlib.sha256(raw).hexdigest(),refreshBatch='shorts-lateral-2026-11-13',intermediateOnly=True)
result=[base_meta];(target/'preparation.json').write_text(json.dumps(base_meta,ensure_ascii=False,indent=2))
for e in entries:
 d=e['descriptor'];s=Glb(ROOT/'public'/e['assets']['source'].lstrip('/'));oldlabels=[p['label']for p in sorted(d['panels'],key=lambda p:p['mesh'])];count=len(oldlabels);ID=d['id'].removesuffix('-proporcao-v1')+'-shorts-lateral-v1';outdir=ROOT/'public/assets/molds'/ID;outdir.mkdir(exist_ok=True)
 allmeshes=meshes+[primitive(s,i)for i in range(4,len(s.j['meshes']))];alllabels=labels+oldlabels[4:]+[s.j['meshes'][i].get('name','Detalhe')for i in range(count,len(s.j['meshes']))];node_map={0:[0,1,2],1:[3,4,5],2:[6],3:[7],**{i:[i+4]for i in range(4,len(s.j['meshes']))}}
 j,b=write_meshes(s,allmeshes,alllabels,node_map);raw=encode(j,b);cloth=copy.deepcopy(j);cloth['meshes']=cloth['meshes'][:count+4]
 for n in cloth['nodes']:
  if n.get('mesh',-1)>=count+4:n.pop('mesh')
 (outdir/'source.glb').write_bytes(raw);(outdir/'cloth-input.glb').write_bytes(encode(cloth,b))
 m={**d,'id':ID,'name':d['name'].replace('CALÇÃO 2 PARTES','CALÇÃO RECORTE LATERAL'),'labels':labels+oldlabels[4:],'panelKinds':['shorts']*6+['waist']*2+['body']*(count-4),'bottomParts':6,'bottomVariant':'lateral','baseShirtId':d['id'],'bottomReference':reference,'refreshBatch':'shorts-lateral-2026-11-13','decorativeMeshes':[i+4for i in range(count,len(s.j['meshes']))],'uvCanonicalMeshes':[i+4for i in d.get('uvCanonicalMeshes',[])],'sourceName':'Variante aprovada — '+d['name']+'.glb','originalSourceSha256':hashlib.sha256(raw).hexdigest(),'intermediateOnly':True}
 for key in ['panels','primitives','replaces','bottomDerivedFrom','physicalMatrix','layoutGroups']:m.pop(key,None)
 (outdir/'preparation.json').write_text(json.dumps(m,ensure_ascii=False,indent=2));result.append(m);print(ID,flush=True)
(ROOT/'scripts/lateral-shorts-manifest.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
