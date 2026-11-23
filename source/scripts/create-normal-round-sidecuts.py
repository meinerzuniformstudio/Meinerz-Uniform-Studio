"""Partition the original shirt surface; stitch each new side chart on its existing seam.
No silhouette vertices are moved. This is a presentation variant, not a sewing pattern.
"""
import json,struct,hashlib,pathlib,copy
import numpy as np
ROOT=pathlib.Path(__file__).resolve().parents[1];BASE='pack26-normal-redonda-sem-recorte';PREVIOUS='pack26-normal-redonda-com-recorte';ID=PREVIOUS+'-v2'
path=ROOT/'public/assets/molds'/BASE;raw=(path/'source.glb').read_bytes();n=struct.unpack_from('<I',raw,12)[0];j=json.loads(raw[20:20+n]);binary=raw[28+n:]
def acc(i):
 a=j['accessors'][i];v=j['bufferViews'][a['bufferView']];size={'SCALAR':1,'VEC2':2,'VEC3':3}[a['type']];dt={5126:'<f4',5123:'<u2',5125:'<u4'}[a['componentType']];return np.frombuffer(binary,dtype=dt,offset=v.get('byteOffset',0)+a.get('byteOffset',0),count=a['count']*size).reshape(-1,size).copy()
def encode(j,b):
 data=json.dumps(j,separators=(',',':'),ensure_ascii=False).encode();data+=b' '*((-len(data))%4);b+=b'\0'*((-len(b))%4)
 return struct.pack('<III',0x46546c67,2,28+len(data)+len(b))+struct.pack('<II',len(data),0x4e4f534a)+data+struct.pack('<II',len(b),0x004e4942)+b
meta=json.loads((path/'preparation.json').read_text());body=[i for i,l in enumerate(meta['labels']) if l in ['Frente','Costas']];front=next(i for i in body if meta['labels'][i]=='Frente');back=next(i for i in body if meta['labels'][i]=='Costas')
data={i:np.hstack([acc(j['meshes'][i]['primitives'][0]['attributes'][k]) for k in ['POSITION','NORMAL','TEXCOORD_0']]) for i in body}
lookup={i:{tuple(v[:3]):v[6:] for v in data[i]} for i in body};common=lookup[front].keys()&lookup[back].keys();seams={};charts={};caps={}
# Use the native UV width of the normal Gola 27 side panels as the reference.
ref=ROOT/'public/assets/molds/pack26-normal-gola-27-com-recorte';rb=(ref/'source.glb').read_bytes();rn=struct.unpack_from('<I',rb,12)[0];rj=json.loads(rb[20:20+rn]);rm=json.loads((ref/'preparation.json').read_text());widths=[]
for i,label in enumerate(rm['labels']):
 if label.startswith('Recorte lateral'):
  a=rj['accessors'][rj['meshes'][i]['primitives'][0]['attributes']['TEXCOORD_0']];v=rj['bufferViews'][a['bufferView']];uv=np.frombuffer(rb[28+rn:],dtype='<f4',offset=v.get('byteOffset',0),count=a['count']*2).reshape(-1,2);widths.append(float(np.ptp(uv[:,0])))
band=float(np.mean(widths))/2
for side in [-1,1]:
 seam=sorted([p for p in common if p[0]*side>.04 and p[1]<.51],key=lambda p:lookup[front][p][1]);assert len(seam)>100
 seams[side]=set(seam);caps[side]=float(max(p[1] for p in seam))
 fuv=np.array([lookup[front][p] for p in seam]);length=np.r_[0,np.cumsum(np.linalg.norm(np.diff(fuv,axis=0),axis=1))]
 for i in body:
  uv=np.array([lookup[i][p] for p in seam]);assert np.all(np.diff(uv[:,1])>0);charts[i,side]=(uv[:,1],uv[:,0],length)
def extrap(x,xp,fp):
 if x<xp[0]:return float(fp[0]+(x-xp[0])*(fp[1]-fp[0])/(xp[1]-xp[0]))
 if x>xp[-1]:return float(fp[-1]+(x-xp[-1])*(fp[-1]-fp[-2])/(xp[-1]-xp[-2]))
 return float(np.interp(x,xp,fp))
corrs={i:np.corrcoef(data[i][:,0],data[i][:,6])[0,1] for i in body}
output={};stats={'base':BASE,'reference':'pack26-normal-gola-27-com-recorte','bandUvPerHalf':band,'cutTerminatesAt':'armhole boundary (no horizontal cap)','areaBefore':0.,'areaAfter':0.,'maxPositionDisplacement':0.}
strips={-1:[],1:[]}
for mesh in body:
 values=[v.astype(np.float64) for v in data[mesh]];cache={};remaining=[];tris=acc(j['meshes'][mesh]['primitives'][0]['indices']).reshape(-1,3)
 corr=corrs[mesh]
 def split(poly,plane):
  coord,cut,sign,key=plane
  def f(k):return (values[k][coord]-cut)*sign
  yes=[];no=[]
  for a,b in zip(poly,poly[1:]+poly[:1]):
   fa,fb=f(a),f(b)
   if fa<=0:yes.append(a)
   if fa>=0:no.append(a)
   if (fa<0 and fb>0) or (fa>0 and fb<0):
    edge=(min(a,b),max(a,b),key)
    if edge not in cache:
     x,y=edge[:2];t=f(x)/(f(x)-f(y));v=values[x]+t*(values[y]-values[x]);v[coord]=cut;cache[edge]=len(values);values.append(v)
    v=cache[edge];yes.append(v);no.append(v)
  return yes,no
 def triangulate(poly):
  for q in range(1,len(poly)-1):
   t=[poly[0],poly[q],poly[q+1]];a,b,c=[values[k][:3] for k in t]
   if np.linalg.norm(np.cross(b-a,c-a))>1e-14:yield t
 for tri in tris:
  a,b,c=[values[k][:3] for k in tri];stats['areaBefore']+=float(np.linalg.norm(np.cross(b-a,c-a))/2)
  pending=[list(map(int,tri))]
  for side in [-1,1]:
   low=side*corr<0;cut=float(data[mesh][:,6].min()+band if low else data[mesh][:,6].max()-band);planes=[(6,cut,1 if low else -1,('u',side))];next_pending=[]
   for poly in pending:
    inside,outside=split(poly,planes[0]);lower,upper=inside,[]
    if outside:next_pending.append(outside)
    if upper:next_pending.append(upper)
    for t in triangulate(lower):strips[side].append((mesh,[values[k].copy() for k in t]))
   pending=next_pending
  for poly in pending:
   for t in triangulate(poly):remaining.append([values[k].copy() for k in t])
 output[mesh]=remaining
# The sewn seam has identical positions on the original front/back. Each half
# uses an injective shear of its original UVs and one shared seam-length axis.
for side in [-1,1]:
 ts=[]
 for mesh,tri in strips[side]:
  vv,uu,length=charts[mesh,side];out=[]
  for vertex in tri:
   v=vertex.copy();nativev=v[7];u=extrap(nativev,vv,uu);corr=corrs[mesh];low=side*corr<0;dist=(v[6]-u)*(1 if low else -1)
   if tuple(np.float32(v[:3])) in seams[side]:dist=0.
   v[6]=dist*(1 if mesh==front else -1);v[7]=extrap(nativev,vv,length);out.append(v)
  ts.append(out)
 output[len(j['meshes'])+(0 if side==1 else 1)]=ts
# Rebuild all primitive buffers, retaining original non-body arrays exactly.
out=copy.deepcopy(j);out['accessors']=[];out['bufferViews']=[];out['meshes']=[];chunks=bytearray()
def put(a,typ,ctype,target):
 chunks.extend(b'\0'*((-len(chunks))%4));vi=len(out['bufferViews']);out['bufferViews'].append({'buffer':0,'byteOffset':len(chunks),'byteLength':a.nbytes,'target':target});chunks.extend(a.tobytes());i=len(out['accessors']);d={'bufferView':vi,'componentType':ctype,'count':len(a),'type':typ}
 if typ=='VEC3':d.update(min=a.min(0).tolist(),max=a.max(0).tolist())
 out['accessors'].append(d);return i
labels=meta['labels']+['Recorte lateral esquerdo','Recorte lateral direito']
for i,label in enumerate(labels):
 if i in output:
  unique={};verts=[];indices=[]
  for tri in output[i]:
   for v in tri:
    v=v.astype('<f4');key=v.tobytes()
    if key not in unique:unique[key]=len(verts);verts.append(v)
    indices.append(unique[key])
  va=np.array(verts);attrs={'POSITION':va[:,:3].copy(),'NORMAL':va[:,3:6].copy(),'TEXCOORD_0':va[:,6:].copy()};ix=np.array(indices,dtype='<u4').reshape(-1,1)
  xyz=attrs['POSITION'][ix.reshape(-1)].reshape(-1,3,3).astype(float);stats['areaAfter']+=float((np.linalg.norm(np.cross(xyz[:,1]-xyz[:,0],xyz[:,2]-xyz[:,0]),axis=1)/2).sum())
 else:
  pr=j['meshes'][i]['primitives'][0];attrs={k:acc(a) for k,a in pr['attributes'].items()};ix=acc(pr['indices']).astype('<u4')
 ids={k:put(a.astype('<f4'),'VEC2' if k.startswith('TEX') else 'VEC3',5126,34962) for k,a in attrs.items()};index=put(ix,'SCALAR',5125,34963);out['meshes'].append({'name':label,'primitives':[{'attributes':ids,'indices':index,'material':0}]})
for i in [len(labels)-2,len(labels)-1]:out['nodes'].append({'mesh':i,'name':labels[i]});out['nodes'][1]['children'].append(len(out['nodes'])-1)
out['buffers']=[{'byteLength':len(chunks)}];out['asset']['generator']='Atlas surface partition sidecut variant 1'
assert abs(stats['areaAfter']-stats['areaBefore'])/stats['areaBefore']<1e-6,stats
meta.update(id=ID,name='KIT · NORMAL · REDONDA · COM RECORTE · CALÇÃO 2 PARTES',labels=labels,panelKinds=meta['panelKinds']+['side-cut','side-cut'],sideCut=True,sourceName='Variante Atlas - gola redonda normal com recortes.glb',derivedFrom=BASE,cutReference=stats['reference'],replaces=PREVIOUS,cutVersion='armhole-through-v2')
target=ROOT/'public/assets/molds'/ID
if target.exists():raise ValueError('Immutable ID already exists')
target.mkdir();prepared=encode(out,bytes(chunks));meta['originalSourceSha256']=hashlib.sha256(prepared).hexdigest();(target/'source.glb').write_bytes(prepared);(target/'cloth-input.glb').write_bytes(prepared);(target/'preparation.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2)+'\n');(target/'surface-partition.json').write_text(json.dumps(stats,indent=2)+'\n')
manifest=json.loads((ROOT/'scripts/presentation-pack-manifest.json').read_text());manifest=[meta if e['id']==PREVIOUS else e for e in manifest];(ROOT/'scripts/presentation-pack-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');print(json.dumps(stats))
