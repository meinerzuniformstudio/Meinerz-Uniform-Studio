"""Add continuous sidecut variants, preserving original 3D geometry and corrected pairs.
Shared seam charts may join separate sewn vertices in UV space only. Positions
and normals remain on their original triangles; seam edge subdivisions use
linear interpolation, including decorative multi-primitive meshes unchanged.
"""
import json,struct,hashlib,pathlib,copy,collections,sys
import numpy as np
ROOT=pathlib.Path(__file__).resolve().parents[1];MP=ROOT/'scripts/new-upload-manifest.json';manifest=json.loads(MP.read_text());existing={(e['modeling'],e['collar'],e.get('variant','')) for e in manifest if e['sideCut']};exclude={'POLO RETRÔ','ELITE','ELITE ARREDONDADA','GOLA 27'}
bases=[e for e in manifest if not e['sideCut'] and e['collar'] not in exclude and (e['modeling'],e['collar'],e.get('variant','')) not in existing]
# Same proportion as the approved normal-round variant: about 8.58% per half.
reference=json.loads((ROOT/'public/assets/molds/pack26-normal-redonda-com-recorte-v2/surface-partition.json').read_text());BAND_RATIO=reference['bandUvPerHalf']/.51158377

def encode(j,b):
 a=json.dumps(j,separators=(',',':'),ensure_ascii=False).encode();a+=b' '*((-len(a))%4);b=bytes(b);b+=b'\0'*((-len(b))%4);return struct.pack('<III',0x46546c67,2,28+len(a)+len(b))+struct.pack('<II',len(a),0x4e4f534a)+a+struct.pack('<II',len(b),0x004e4942)+b

def create(meta):
 BASE=meta['id'];ID=BASE.replace('-sem-recorte','-com-recorte')+'-derived-v1';path=ROOT/'public/assets/molds'/BASE;raw=(path/'source.glb').read_bytes();n=struct.unpack_from('<I',raw,12)[0];j=json.loads(raw[20:20+n]);binary=raw[28+n:];C=len(meta['labels']);target=ROOT/'public/assets/molds'/ID
 if target.exists():raise ValueError('Immutable ID exists: '+ID)
 def acc(i):
  a=j['accessors'][i];v=j['bufferViews'][a['bufferView']];size={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']];dt={5126:'<f4',5123:'<u2',5125:'<u4'}[a['componentType']];return np.frombuffer(binary,dtype=dt,offset=v.get('byteOffset',0)+a.get('byteOffset',0),count=a['count']*size).reshape(-1,size).copy()
 body=[i for i,l in enumerate(meta['labels']) if l in ['Frente','Costas']];front=next(i for i in body if meta['labels'][i]=='Frente');back=next(i for i in body if meta['labels'][i]=='Costas');assert len(body)==2
 data={i:np.hstack([acc(j['meshes'][i]['primitives'][0]['attributes'][k]) for k in ['POSITION','NORMAL','TEXCOORD_0']]) for i in body};charts={};seamkeys={};corrs={i:float(np.corrcoef(data[i][:,0],data[i][:,6])[0,1]) for i in body};bands={i:float(np.ptp(data[i][:,6]))*BAND_RATIO for i in body};
 for mesh in body:
  # Weld duplicate normal vertices for boundary inspection, not for rendering.
  arr=data[mesh];unique={};canonical=[]
  for v in arr:
   key=tuple(v[[0,1,2,6,7]])
   if key not in unique:unique[key]=len(unique)
   canonical.append(unique[key])
  inverse={v:k for k,v in unique.items()};ix=acc(j['meshes'][mesh]['primitives'][0]['indices']).reshape(-1,3);ci=np.array(canonical)[ix];edges=collections.Counter(tuple(sorted(e)) for t in ci for e in [(t[0],t[1]),(t[1],t[2]),(t[2],t[0])]);boundary=[e for e,count in edges.items() if count==1]
  for side in [-1,1]:
   low=side*corrs[mesh]<0;cut=arr[:,6].min()+bands[mesh] if low else arr[:,6].max()-bands[mesh];graph=collections.defaultdict(set)
   for a,b in boundary:
    va,vb=np.array(inverse[a]),np.array(inverse[b]);du=abs(va[3]-vb[3]);dv=abs(va[4]-vb[4])
    if dv<=du*4:continue
    if min(va[0]*side,vb[0]*side)<.025 or max(va[1],vb[1])>.525:continue
    if not ((max(va[3],vb[3])<cut) if low else (min(va[3],vb[3])>cut)):continue
    graph[a].add(b);graph[b].add(a)
   components=[];seen=set()
   for start in graph:
    if start in seen:continue
    stack=[start];component=[];seen.add(start)
    while stack:
     a=stack.pop();component.append(a)
     for b in graph[a]:
      if b not in seen:seen.add(b);stack.append(b)
    components.append(component)
   assert components,(BASE,mesh,side,'missing seam')
   component=max(components,key=lambda c:max(inverse[v][4] for v in c)-min(inverse[v][4] for v in c));seam=sorted([np.array(inverse[v]) for v in component],key=lambda v:v[4]);assert len(seam)>15,(BASE,mesh,side,len(seam))
   uv=np.array([v[3:] for v in seam]);assert np.all(np.diff(uv[:,1])>0);length=np.r_[0,np.cumsum(np.linalg.norm(np.diff(uv,axis=0),axis=1))];charts[mesh,side]=(uv[:,1],uv[:,0],length/length[-1]);seamkeys[mesh,side]={tuple(np.float32(v[:3])) for v in seam}
 # Common vertical units follow the original front seam. Back native UVs are
 # mapped monotonically to it, accommodating independently sampled sewn edges.
 lengths={}
 for side in [-1,1]:
  vv,uu,_=charts[front,side];lengths[side]=float(np.linalg.norm(np.diff(np.c_[uu,vv],axis=0),axis=1).sum())
 def extrap(x,xp,fp):
  if x<xp[0]:return float(fp[0]+(x-xp[0])*(fp[1]-fp[0])/(xp[1]-xp[0]))
  if x>xp[-1]:return float(fp[-1]+(x-xp[-1])*(fp[-1]-fp[-2])/(xp[-1]-xp[-2]))
  return float(np.interp(x,xp,fp))
 output={};strips={-1:[],1:[]};stats={'base':BASE,'reference':'pack26-normal-redonda-com-recorte-v2','bandRatio':BAND_RATIO,'bandUvPerMesh':bands,'cutTerminatesAt':'armhole boundary (no horizontal cap)','areaBefore':0.,'areaAfter':0.,'maxPositionDisplacement':0.}
 for mesh in body:
  values=[v.astype(float) for v in data[mesh]];cache={};remaining=[];tris=acc(j['meshes'][mesh]['primitives'][0]['indices']).reshape(-1,3)
  def split(poly,cut,sign,side):
   f=lambda i:(values[i][6]-cut)*sign;yes=[];no=[]
   for a,b in zip(poly,poly[1:]+poly[:1]):
    fa,fb=f(a),f(b)
    if fa<=0:yes.append(a)
    if fa>=0:no.append(a)
    if fa*fb<0:
     edge=(min(a,b),max(a,b),side)
     if edge not in cache:
      x,y=edge[:2];t=f(x)/(f(x)-f(y));v=values[x]+t*(values[y]-values[x]);v[6]=cut;cache[edge]=len(values);values.append(v)
     yes.append(cache[edge]);no.append(cache[edge])
   return yes,no
  def triangles(poly):
   for q in range(1,len(poly)-1):
    vs=[values[k].copy() for k in [poly[0],poly[q],poly[q+1]]]
    if np.linalg.norm(np.cross(vs[1][:3]-vs[0][:3],vs[2][:3]-vs[0][:3]))>1e-14:yield vs
  for tri in tris:
   a,b,c=[values[k][:3] for k in tri];stats['areaBefore']+=float(np.linalg.norm(np.cross(b-a,c-a))/2);pending=list(map(int,tri))
   for side in [-1,1]:
    low=side*corrs[mesh]<0;cut=float(data[mesh][:,6].min()+bands[mesh] if low else data[mesh][:,6].max()-bands[mesh]);inside,pending=split(pending,cut,1 if low else -1,side) if pending else ([],[])
    for t in triangles(inside):strips[side].append((mesh,t))
   remaining.extend(triangles(pending))
  output[mesh]=remaining
 # Keep only the side component connected to the hem. A vertical cut can
 # cross the empty armhole and touch a separate shoulder corner above it;
 # that corner belongs to the center, not to the lateral insert.
 for side in [-1,1]:
  kept=[]
  for mesh in body:
   ts=[t for m,t in strips[side] if m==mesh];parents=list(range(len(ts)));owner={}
   def find(i):
    while parents[i]!=i:parents[i]=parents[parents[i]];i=parents[i]
    return i
   for k,t in enumerate(ts):
    for v in t:
     key=tuple(np.float32(v[[0,1,2,6,7]]))
     if key in owner:parents[find(k)]=find(owner[key])
     else:owner[key]=k
   components=collections.defaultdict(list)
   for k,t in enumerate(ts):components[find(k)].append(t)
   main=min(components,key=lambda c:min(v[1] for t in components[c] for v in t))
   for c,triangles in components.items():
    if c==main:kept.extend((mesh,t) for t in triangles)
    else:output[mesh].extend(triangles)
  strips[side]=kept
 # Shared UV seams do not weld or move independently sampled 3D boundaries.
 for side in [-1,1]:
  halves={front:[],back:[]}
  for mesh,tri in strips[side]:
   vv,uu,param=charts[mesh,side];low=side*corrs[mesh]<0;out=[]
   for vertex in tri:
    v=vertex.copy();nv=v[7];dist=(v[6]-extrap(nv,vv,uu))*(1 if low else -1)
    if tuple(np.float32(v[:3])) in seamkeys[mesh,side]:dist=0.
    v[6]=dist*(1 if mesh==front else -1);v[7]=float(np.float32(extrap(nv,vv,param)*lengths[side]));out.append(v)
   halves[mesh].append(out)
  knots=sorted({float(v[7]) for ts in halves.values() for t in ts for v in t if v[6]==0.})
  complete=[]
  for ts in halves.values():
   for tri in ts:
    edge=next(((k,(k+1)%3,(k+2)%3) for k in range(3) if tri[k][6]==0 and tri[(k+1)%3][6]==0 and tri[k][7]!=tri[(k+1)%3][7]),None)
    if edge is None:complete.append(tri);continue
    ia,ib,ic=edge;a,b,c=tri[ia],tri[ib],tri[ic];lo,hi=sorted([a[7],b[7]]);cuts=[s for s in knots if lo+1e-9<s<hi-1e-9];cuts.sort(reverse=a[7]>b[7]);chain=[a]
    for s in cuts:
     t=(s-a[7])/(b[7]-a[7]);v=a+t*(b-a);v[6]=0.;v[7]=s;chain.append(v)
    chain.append(b)
    for x,y in zip(chain,chain[1:]):complete.append([x.copy(),y.copy(),c.copy()])
  output[C+(0 if side==1 else 1)]=complete
 # Match dimensions and outside UV winding of the already-corrected charts.
 audit=copy.deepcopy(json.loads((path/'pair-audit.json').read_text()));audit['previousId']=BASE;raws={};dims=[]
 for i in [C,C+1]:
  a=np.array(output[i]);uv=a[:,:,6:];dims.append(np.ptp(uv.reshape(-1,2),axis=0));raws[i]=a
 targetdims=np.mean(dims,axis=0);mirrored={}
 for i,a in raws.items():
  uv=a[:,:,6:];lo=uv.reshape(-1,2).min(0);extent=np.ptp(uv.reshape(-1,2),axis=0);uv[:]=(uv-lo)/extent*targetdims;det=np.cross(uv[:,1]-uv[:,0],uv[:,2]-uv[:,0]);mirrored[i]=float(np.median(det))>0
  if mirrored[i]:uv[:,:,0]=targetdims[0]-uv[:,:,0]
  output[i]=a.tolist()
 audit['pairs'].append({'kind':'Recorte lateral','leftMesh':C,'rightMesh':C+1,'targetWidth':float(targetdims[0]),'targetHeight':float(targetdims[1]),'leftMirrored':bool(mirrored[C]),'rightMirrored':bool(mirrored[C+1]),'uvWinding':'negative (outside-readable)'})
 out=copy.deepcopy(j);out['accessors']=[];out['bufferViews']=[];out['meshes']=[];chunks=bytearray()
 def put(a,typ,ctype,target):
  chunks.extend(b'\0'*((-len(chunks))%4));vi=len(out['bufferViews']);out['bufferViews'].append({'buffer':0,'byteOffset':len(chunks),'byteLength':a.nbytes,'target':target});chunks.extend(a.tobytes());i=len(out['accessors']);d={'bufferView':vi,'componentType':ctype,'count':len(a),'type':typ}
  if typ=='VEC3':d.update(min=a.min(0).tolist(),max=a.max(0).tolist())
  out['accessors'].append(d);return i
 labels=meta['labels']+['Recorte lateral esquerdo','Recorte lateral direito'];order=[*range(C),None,None,*range(C,len(j['meshes']))]
 for newmesh,oldmesh in enumerate(order):
  if newmesh in output:
   unique={};verts=[];indices=[]
   for tri in output[newmesh]:
    for vertex in tri:
     v=np.array(vertex,dtype='<f4');key=v.tobytes()
     if key not in unique:unique[key]=len(verts);verts.append(v)
     indices.append(unique[key])
   a=np.array(verts);attrs={'POSITION':a[:,:3].copy(),'NORMAL':a[:,3:6].copy(),'TEXCOORD_0':a[:,6:].copy()};ix=np.array(indices,dtype='<u4').reshape(-1,1);primitives=[(attrs,ix,0)];xyz=attrs['POSITION'][ix.reshape(-1)].reshape(-1,3,3).astype(float);stats['areaAfter']+=float((np.linalg.norm(np.cross(xyz[:,1]-xyz[:,0],xyz[:,2]-xyz[:,0]),axis=1)/2).sum())
  else:
   primitives=[({k:acc(a) for k,a in pr['attributes'].items()},acc(pr['indices']).astype('<u4'),pr.get('material',0)) for pr in j['meshes'][oldmesh]['primitives']]
  prs=[]
  for attrs,ix,material in primitives:
   ids={k:put(a.astype('<f4'),'VEC2' if k.startswith('TEX') else 'VEC3',5126,34962) for k,a in attrs.items()};index=put(ix,'SCALAR',5125,34963);prs.append({'attributes':ids,'indices':index,'material':material})
  out['meshes'].append({'name':labels[newmesh] if newmesh<len(labels) else j['meshes'][oldmesh]['name'],'primitives':prs})
 frontnode=next(k for k,n in enumerate(out['nodes']) if n.get('mesh')==front);parent=next(k for k,n in enumerate(out['nodes']) if frontnode in n.get('children',[]));backnode=next(n for n in out['nodes'] if n.get('mesh')==back)
 for key in ['matrix','translation','rotation','scale']:assert out['nodes'][frontnode].get(key)==backnode.get(key),(BASE,key,'different body transforms')
 for node in out['nodes']:
  if node.get('mesh',-1)>=C:node['mesh']+=2
 for i in [C,C+1]:
  node={k:copy.deepcopy(v) for k,v in out['nodes'][frontnode].items() if k in ['matrix','translation','rotation','scale']};node.update(mesh=i,name=labels[i]);out['nodes'].append(node);out['nodes'][parent]['children'].append(len(out['nodes'])-1)
 out['buffers']=[{'byteLength':len(chunks)}];out['asset']['generator']='Atlas continuous sidecut variants 1';assert abs(stats['areaAfter']-stats['areaBefore'])/stats['areaBefore']<1e-6,stats
 new=copy.deepcopy(meta);new.pop('replaces',None);new.update(id=ID,name=meta['name'].replace('SEM RECORTE','COM RECORTE'),labels=labels,panelKinds=meta['panelKinds']+['side-cut','side-cut'],sideCut=True,derivedFrom=BASE,cutReference=stats['reference'],cutVersion='armhole-through-shared-seam-v1',uvCanonicalMeshes=[C,C+1],decorativeMeshes=[i+2 for i in meta['decorativeMeshes']],sourceName='Variante Atlas - '+meta['modeling']+' '+meta['collar']+' com recortes.glb')
 prepared=encode(out,chunks);new['originalSourceSha256']=hashlib.sha256(prepared).hexdigest();target.mkdir();(target/'source.glb').write_bytes(prepared);cloth=copy.deepcopy(out);cloth['meshes']=cloth['meshes'][:C+2]
 for node in cloth['nodes']:
  if node.get('mesh',-1)>=C+2:node.pop('mesh')
 (target/'cloth-input.glb').write_bytes(encode(cloth,chunks));(target/'preparation.json').write_text(json.dumps(new,ensure_ascii=False,indent=2)+'\n');(target/'surface-partition.json').write_text(json.dumps(stats,indent=2)+'\n');(target/'pair-audit.json').write_text(json.dumps(audit,indent=2)+'\n');print(ID,stats['areaBefore'],stats['areaAfter'],flush=True);return new
if len(sys.argv)>1:
 bases=[e for e in manifest if e['id']==sys.argv[1]]
 assert len(bases)==1
 targetid=bases[0]['id'].replace('-sem-recorte','-com-recorte')+'-derived-v1'
 manifest=[e for e in manifest if e['id']!=targetid]
for base in bases:
 new=create(base);manifest.append(new);MP.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
