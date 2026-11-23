"""Correct paired UV scale/orientation without changing any 3D vertex or index."""
import json,struct,hashlib,pathlib,copy
import numpy as np
from scipy.spatial import ConvexHull,cKDTree
ROOT=pathlib.Path(__file__).resolve().parents[1];manifest=json.loads((ROOT/'scripts/elite-upload-manifest.json').read_text());result=[]
def decode(raw):
 n=struct.unpack_from('<I',raw,12)[0];return json.loads(raw[20:20+n]),bytearray(raw[28+n:])
def encode(j,b):
 a=json.dumps(j,separators=(',',':'),ensure_ascii=False).encode();a+=b' '*((-len(a))%4);b=bytes(b);return struct.pack('<III',0x46546c67,2,28+len(a)+len(b))+struct.pack('<II',len(a),0x4e4f534a)+a+struct.pack('<II',len(b),0x004e4942)+b
def arrays(j,b,pr):
 def a(i):
  x=j['accessors'][i];v=j['bufferViews'][x['bufferView']];n={'VEC3':3,'VEC2':2,'SCALAR':1}[x['type']];dt={5126:'<f4',5123:'<u2',5125:'<u4'}[x['componentType']];return np.frombuffer(b,dtype=dt,offset=v.get('byteOffset',0)+x.get('byteOffset',0),count=x['count']*n).reshape(-1,n)
 return a(pr['attributes']['POSITION']).astype(float),a(pr['attributes']['TEXCOORD_0']),a(pr['indices']).reshape(-1,3)
def metric(xyz,uv,ix):
 u=uv[ix].astype(float);p=xyz[ix];du=np.stack([u[:,1]-u[:,0],u[:,2]-u[:,0]],axis=2);dp=np.stack([p[:,1]-p[:,0],p[:,2]-p[:,0]],axis=2);det=np.linalg.det(du);good=abs(det)>1e-14;du=du[good];dp=dp[good];w=abs(det[good])/2;J=dp@np.linalg.inv(du);G=np.einsum('tki,tkj->tij',J,J);avg=np.average(G,axis=0,weights=w);val,vec=np.linalg.eigh(avg);M=np.diag(np.sqrt(np.maximum(np.diag(avg),1e-12)));area3=np.linalg.norm(np.cross(p[:,1]-p[:,0],p[:,2]-p[:,0]),axis=1).sum()/2;return M,float(area3),float(w.sum())
def orient(uv):
 # Align the longest straight convex boundary (cuff/strip edge) horizontally.
 hull=uv[ConvexHull(uv).vertices];es=np.roll(hull,-1,axis=0)-hull;v=es[np.argmax(np.linalg.norm(es,axis=1))];angle=np.arctan2(v[1],v[0]);angle=(angle+np.pi/2)%np.pi-np.pi/2
 if abs(angle)>np.pi/4:angle-=np.sign(angle)*np.pi/2
 c,s=np.cos(angle),np.sin(angle);return uv@np.array([[c,-s],[s,c]])
for meta in manifest:
 oldid=meta['id'];newid=oldid+'-paired-v1';root=ROOT/'public/assets/molds'/oldid;target=ROOT/'public/assets/molds'/newid
 if target.exists():raise ValueError('Immutable ID exists '+newid)
 raw=(root/'source.glb').read_bytes();j,b=decode(raw);records={i:arrays(j,b,m['primitives'][0]) for i,m in enumerate(j['meshes']) if i<len(meta['labels'])};density=[]
 for i,label in enumerate(meta['labels']):
  if label in ['Frente','Costas']:
   M,a3,au=metric(*records[i]);density.append(np.sqrt(au/a3))
 unit=float(np.median(density));audit={'previousId':oldid,'bodyUvUnitsPerModelUnit':unit,'method':'intrinsic axis units, sewn cuff alignment, shared pair bounds, outside-readable UV winding','pairs':[]}
 for prefix in ['Manga ','Filete manga ','Recorte lateral ','Recorte faixa ','Recorte axila ','Calção ','Cós ']:
  ids=[i for i,l in enumerate(meta['labels']) if l.startswith(prefix)]
  if len(ids)!=2:continue
  sides={('left' if any(w in meta['labels'][i] for w in ['esquerda','esquerdo']) else 'right'):i for i in ids}
  if len(sides)!=2:raise ValueError('Ambiguous pair '+oldid+' '+prefix)
  transformed={};areas={};before={}
  for i in ids:
   xyz,uv,ix=records[i];before[i]=np.ptp(uv,axis=0).tolist();M,a3,au=metric(xyz,uv,ix);chart=(uv.astype(float)-uv.mean(0))@M
   if prefix=='Manga ':
    side='esquerda' if 'esquerda' in meta['labels'][i] else 'direita';fillet=next((k for k,l in enumerate(meta['labels']) if l=='Filete manga '+side),None)
    if fillet is not None:
     seamset=set(map(tuple,records[fillet][0]));seam=np.array([chart[k] for k,p in enumerate(xyz) if tuple(p) in seamset])
     if len(seam)>10:
      _,_,vectors=np.linalg.svd(seam-seam.mean(0),full_matrices=False);v=vectors[0];angle=(np.arctan2(v[1],v[0])+np.pi/2)%np.pi-np.pi/2;c,t=np.cos(angle),np.sin(angle);chart=chart@np.array([[c,-t],[t,c]])
   transformed[i]=chart*unit;areas[i]=a3
  # Use the larger, better sampled pattern as reference for the common aspect.
  ref=sides['right'];dims=np.ptp(transformed[ref],axis=0)
  avgarea=sum(areas.values())/2;refarea=areas[ref];dims*=np.sqrt(avgarea/refarea)
  for i in ids:
   u=transformed[i];transformed[i]=(u-u.min(0))/np.ptp(u,axis=0)*dims
  left,right=sides['left'],sides['right'];mirrors={}
  # All native CLO garment charts use the same negative triangle winding.
  # A positive chart would mirror readable artwork on the outside of the piece.
  for i in ids:
   u=transformed[i][records[i][2]];det=(u[:,1,0]-u[:,0,0])*(u[:,2,1]-u[:,0,1])-(u[:,1,1]-u[:,0,1])*(u[:,2,0]-u[:,0,0]);mirrors[i]=float(np.median(det))>0
   if mirrors[i]:transformed[i][:,0]=dims[0]-transformed[i][:,0]
  rc=float(np.corrcoef(transformed[right][:,0],records[right][0][:,2])[0,1]);lc=float(np.corrcoef(transformed[left][:,0],records[left][0][:,2])[0,1]);mirror=mirrors[left]
  for i in ids:
   # Preserve native UV offsets for provenance; the atlas installer repacks them.
   v=transformed[i]+records[i][1].min(0);records[i][1][:]=v.astype('<f4')
  audit['pairs'].append({'kind':prefix.strip(),'leftMesh':left,'rightMesh':right,'before':{str(i):before[i] for i in ids},'targetWidth':float(dims[0]),'targetHeight':float(dims[1]),'leftMirrored':bool(mirror),'rightFrontCorrelation':rc,'leftFrontCorrelationAfter':lc,'rightMirrored':bool(mirrors[right]),'uvWinding':'negative (outside-readable)'})
 new=copy.deepcopy(meta);new.update(id=newid,replaces=oldid,pairNormalization='intrinsic-paired-v1',artBleedPixels=16);target.mkdir();source=encode(j,b);(target/'source.glb').write_bytes(source)
 cloth=copy.deepcopy(j);count=len(meta['labels']);cloth['meshes']=cloth['meshes'][:count]
 for node in cloth['nodes']:
  if node.get('mesh',-1)>=count:node.pop('mesh')
 (target/'cloth-input.glb').write_bytes(encode(cloth,b));(target/'preparation.json').write_text(json.dumps(new,ensure_ascii=False,indent=2)+'\n');(target/'pair-audit.json').write_text(json.dumps(audit,indent=2)+'\n');result.append(new);print(newid,[(p['kind'],p['leftMirrored']) for p in audit['pairs']],flush=True)
(ROOT/'scripts/elite-upload-manifest.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
