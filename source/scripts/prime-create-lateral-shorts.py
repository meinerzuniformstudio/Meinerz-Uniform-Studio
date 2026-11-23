"""Combine exact approved lateral shorts with the unmodified PRIME shirt surface."""
from shorts_geometry import *
import hashlib
MP=ROOT/'scripts/prime-upload-manifest.json';manifest=json.loads(MP.read_text());bases=[m for m in manifest if m['bottomParts']==2]
ref=ROOT/'public/assets/molds/pack26-calcao-recorte-lateral-aprovado-v1-proporcao-v1';g=Glb(ref/'source.glb');rm=json.loads((ref/'preparation.json').read_text());labels=rm['labels'];meshes=[primitive(g,i) for i in range(8)]
for m in bases:
 s=Glb(ROOT/'public/assets/molds'/m['id']/'source.glb');C=len(m['labels']);ID=m['id']+'-shorts-lateral-v1';p=ROOT/'public/assets/molds'/ID;p.mkdir()
 allmeshes=meshes+[primitive(s,i) for i in range(4,C)];alllabels=labels+m['labels'][4:];node_map={0:[0,1,2],1:[3,4,5],2:[6],3:[7],**{i:[i+4] for i in range(4,C)}}
 j,b=write_meshes(s,allmeshes,alllabels,node_map);raw=encode(j,b)
 new={**m,'id':ID,'name':m['name'].replace('CALÇÃO 2 PARTES','CALÇÃO RECORTE LATERAL'),'labels':alllabels,'panelKinds':['shorts']*6+['waist']*2+m['panelKinds'][4:],'bottomParts':6,'bottomVariant':'lateral','bottomReference':rm['id'],'baseShirtId':m['id'],'decorativeMeshes':[],'uvCanonicalMeshes':[i+4 for i in m.get('uvCanonicalMeshes',[])],'originalSourceSha256':hashlib.sha256(raw).hexdigest()}
 (p/'source.glb').write_bytes(raw);(p/'cloth-input.glb').write_bytes(raw);(p/'preparation.json').write_text(json.dumps(new,ensure_ascii=False,indent=2)+'\n');(p/'pair-audit.json').write_text(json.dumps({'pairs':[],'method':'exact approved lateral shorts; unchanged native shirt'}))
 manifest.append(new);print(ID,flush=True)
MP.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
