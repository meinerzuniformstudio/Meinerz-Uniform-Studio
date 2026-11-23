from shorts_geometry import *
import hashlib
upload=pathlib.Path('/workspace/scratch/6dcc370bd0ec/upload')
labels={4:['Cós frente direito','Cós frente esquerdo','Cós costas esquerdo','Cós costas direito','Calção frente esquerdo','Calção costas esquerdo','Calção frente direito','Calção costas direito'],5:['Cós frente direito','Cós frente esquerdo','Cós costas esquerdo','Cós costas direito','Calção frente esquerdo','Calção frente direito','Calção costas direito','Calção costas esquerdo','Calção pala traseira']}
manifest=[]
for parts in [4,5]:
 p=upload/f'CALÇÃO {parts} PARTES.glb';s=Glb(p);ID=f'pack26-calcao-{parts}-partes-referencia';out=ROOT/'public/assets/molds'/ID;out.mkdir(exist_ok=True);j,b=write_meshes(s,[primitive(s,m) for m in range(len(labels[parts]))],labels[parts]);j['materials']=[{'name':'Tecido','pbrMetallicRoughness':{'baseColorFactor':[1,1,1,1],'metallicFactor':0,'roughnessFactor':.8},'doubleSided':True}]
 for m in j['meshes']:
  for pr in m['primitives']:pr['material']=0
 for k in ['textures','images','samplers']:j.pop(k,None)
 meta=dict(id=ID,name=f'CALÇÃO {parts} PARTES',category='calcao',sourceName=p.name,originalSourceSha256=hashlib.sha256(p.read_bytes()).hexdigest(),labels=labels[parts],bottomParts=parts,decorativeMeshes=[],panelKinds=['waist']*4+['shorts']*(parts),artBleedPixels=16)
 (out/'source.glb').write_bytes(encode(j,b));(out/'preparation.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n');manifest.append(meta)
 print(ID,len(b))
(ROOT/'scripts/short-reference-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
