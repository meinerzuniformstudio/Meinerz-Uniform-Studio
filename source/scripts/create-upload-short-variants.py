"""Transfer supplier shorts seams into each immutable two-part base.
Cuts interpolate only existing triangles: no fitting or movement of the surface.
"""
from shorts_geometry import *
from scipy.spatial import cKDTree
import hashlib,sys
MP=ROOT/'scripts/new-upload-manifest.json';manifest=json.loads(MP.read_text());bases=[m for m in manifest if m.get('bottomParts',2)==2];r4=Glb(ROOT/'public/assets/molds/pack26-calcao-4-partes-referencia/source.glb');r5=Glb(ROOT/'public/assets/molds/pack26-calcao-5-partes-referencia/source.glb')
def fit_transfer(base,ref,front,back,pala=False):
 a,_=base;f=r4.data(front)[0] if not pala else ref.data(front)[0];b=ref.data(back)[0]
 if pala:
  p=ref.data(8)[0];dist,_=cKDTree(p[:,:3]).query(b[:,:3]);sel=b[(dist<.0015)&(b[:,1]>.26),:3];allref=np.vstack([f,b,p[p[:,0]*(-1 if np.mean(a[:,0])<0 else 1)>0]])
 else:
  dist,_=cKDTree(b[:,:3]).query(f[:,:3]);threshold=.04 if front>=4 else .035;sel=f[(dist<.0015)&(np.abs(f[:,0])>threshold),:3];allref=np.vstack([f,b])
 assert len(sel)>10,(front,back,len(sel))
 lo=allref[:,:3].min(0);span=np.ptp(allref[:,:3],axis=0);xyz=(sel-lo)/span*np.ptp(a[:,:3],axis=0)+a[:,:3].min(0);_,idx=cKDTree(a[:,:3]).query(xyz);uv=a[idx,6:]
 return np.polyfit(uv[:,0] if pala else uv[:,1],uv[:,1] if pala else uv[:,0],1).tolist()
def create(meta,parts):
 ID=meta['id']+f'-shorts{parts}-v1';path=ROOT/'public/assets/molds'/meta['id'];s=Glb(path/'source.glb');C=len(meta['labels']);outdir=ROOT/'public/assets/molds'/ID;outdir.mkdir(exist_ok=True);lower={};palas=[];fits={};stats={'base':meta['id'],'reference':f'pack26-calcao-{parts}-partes-referencia','areaBefore':0.,'areaAfter':0.,'maxPositionDisplacement':0.,'cutMethod':'reference projected to native UV; affine triangle clipping'}
 for m,(f,b) in enumerate([(6,7),(4,5),(1,2),(0,3)]):
  a,ix=s.data(m);line=fit_transfer((a,ix),r4,f,b);fits[str(m)]={'side':line};x,y=split_triangles(a,ix,lambda v:v[6]-np.polyval(line,v[7]));front,back=sorted([x,y],key=lambda ts:-float(ts[:,:,2].mean()));stats['areaBefore']+=area(a[ix])
  if parts==5 and m<2:
   pfit=fit_transfer((a,ix),r5,5 if m==0 else 4,6 if m==0 else 7,True);fits[str(m)]['pala']=pfit;pr=triangles_primitive(back)[0];ba=np.hstack([pr[0][k] for k in ['POSITION','NORMAL','TEXCOORD_0']]);upper,back=split_triangles(ba,pr[1].reshape(-1,3),lambda v:v[7]-np.polyval(pfit,v[6]));assert upper[:,:,1].mean()>back[:,:,1].mean()
   # Upper center-back edge is a straight line in the supplied native pattern.
   verts,edges=boundary(a,ix);adj=collections.defaultdict(list)
   for x,y in edges:adj[x].append(y);adj[y].append(x)
   vertical=edges[(np.abs(verts[edges[:,0],3]-verts[edges[:,1],3])<1e-6)&(np.abs(verts[edges[:,0],4]-verts[edges[:,1],4])>1e-5)]
   ids=np.unique(vertical);ids=[k for k in ids if abs(verts[k,0])<.008 and verts[k,2]<-.02 and verts[k,1]>.30];assert ids
   start=min(ids,key=lambda k:verts[k,4]);chain=[start];prev=-1;cur=start
   while True:
    options=[k for k in adj[cur] if k!=prev and verts[k,4]>verts[cur,4]+1e-8]
    if not options:break
    nxt=max(options,key=lambda k:(verts[k,4]-verts[cur,4])/(abs(verts[k,3]-verts[cur,3])+1e-12))
    chain.append(nxt);prev,cur=cur,nxt
    if verts[cur,4]>a[:,7].min()+np.ptp(a[:,7])*.55:break
   seam=verts[chain];assert len(seam)>20,(meta['id'],m,len(seam));vv,uu=seam[:,4],seam[:,3];assert np.all(np.diff(vv)>0)
   top=float(vv.min());native=upper[:,:,6].copy();center=np.interp(upper[:,:,7],vv,uu);upper[:,:,6]=native-center
   upper[:,:,6][np.abs(upper[:,:,6])<1e-7]=0.;upper[:,:,7]-=top;palas.append(upper)
  lower[2*m]=front;lower[2*m+1]=back
 if parts==5:
  # Reparameterize the sewn center edge to one shared height, retaining U
  # scale. No 3D vertices are welded or displaced.
  spans=[]
  for ts in palas:
   seam=ts[ts[:,:,6]==0.];spans.append([float(seam[:,7].min()),float(seam[:,7].max())])
  height=float(np.mean([hi-lo for lo,hi in spans]))
  for ts,(lo,hi) in zip(palas,spans):ts[:,:,7]=(ts[:,:,7]-lo)*height/(hi-lo);ts[:,:,7]=ts[:,:,7].astype('<f4')
  knots=sorted({float(v[7]) for ts in palas for t in ts for v in t if v[6]==0.});complete=[]
  for ts in palas:
   for tri in ts:
    edge=next(((k,(k+1)%3,(k+2)%3) for k in range(3) if tri[k,6]==0 and tri[(k+1)%3,6]==0 and tri[k,7]!=tri[(k+1)%3,7]),None)
    if edge is None:complete.append(tri);continue
    ia,ib,ic=edge;a,b,c=tri[ia],tri[ib],tri[ic];lo,hi=sorted([a[7],b[7]]);cuts=[v for v in knots if lo+1e-9<v<hi-1e-9];cuts.sort(reverse=a[7]>b[7]);chain=[a]
    for v in cuts:
     t=(v-a[7])/(b[7]-a[7]);p=a+t*(b-a);p[6]=0.;p[7]=v;chain.append(p)
    chain.append(b)
    for x,y in zip(chain,chain[1:]):complete.append(np.array([x,y,c]))
  lower[8]=np.array(complete)
 audit=copy.deepcopy(json.loads((path/'pair-audit.json').read_text()));shift=4 if parts==4 else 5;audit['previousId']=meta['id'];audit['pairs']=[p for p in audit['pairs'] if p['leftMesh']>=4 and p['rightMesh']>=4]
 for p in audit['pairs']:p['leftMesh']+=shift;p['rightMesh']+=shift
 # Corresponding garment components retain a common artwork scale.
 for l,r,kind in [(0,2,'Calção frente'),(1,3,'Calção costas'),(4,6,'Cós frente'),(5,7,'Cós costas')]:
  dims=[np.ptp(lower[i][:,:,6:].reshape(-1,2),axis=0) for i in [l,r]];target=np.mean(dims,axis=0);mirrors=[]
  for i,extent in zip([l,r],dims):
   uv=lower[i][:,:,6:];uv[:]=(uv-uv.reshape(-1,2).min(0))/extent*target;det=np.cross(uv[:,1]-uv[:,0],uv[:,2]-uv[:,0]);mirror=bool(np.median(det)>0)
   if mirror:uv[:,:,0]=target[0]-uv[:,:,0]
   mirrors.append(mirror)
  audit['pairs'].append(dict(kind=kind,leftMesh=l,rightMesh=r,targetWidth=float(target[0]),targetHeight=float(target[1]),leftMirrored=mirrors[0],rightMirrored=mirrors[1],uvWinding='negative (outside-readable)'))
 labels=['Calção frente direito','Calção costas direito','Calção frente esquerdo','Calção costas esquerdo','Cós frente esquerdo','Cós costas esquerdo','Cós frente direito','Cós costas direito']+(['Calção pala traseira'] if parts==5 else [])+meta['labels'][4:];meshes=[triangles_primitive(lower[m]) for m in range(4+parts)]+[primitive(s,m) for m in range(4,len(s.j['meshes']))];labels_all=labels+[s.j['meshes'][m].get('name','Detalhe') for m in range(C,len(s.j['meshes']))];node_map={m:([m*2,m*2+1]+([8] if parts==5 and m==0 else [])) if m<4 else [m+shift] for m in range(len(s.j['meshes']))};j,b=write_meshes(s,meshes,labels_all,node_map)
 stats['areaAfter']=sum(area(ts) for ts in lower.values());assert abs(stats['areaAfter']-stats['areaBefore'])/stats['areaBefore']<1e-6,stats;stats['seamProfiles']=fits;raw=encode(j,b)
 new=copy.deepcopy(meta);new.pop('replaces',None);new.update(id=ID,name=meta['name'].replace('CALÇÃO 2 PARTES',f'CALÇÃO {parts} PARTES'),labels=labels,panelKinds=['shorts']*4+['waist']*4+(['shorts'] if parts==5 else [])+meta['panelKinds'][4:],bottomParts=parts,bottomDerivedFrom=meta['id'],bottomReference=stats['reference'],bottomCutVersion='reference-native-uv-v1',decorativeMeshes=[m+shift for m in meta['decorativeMeshes']],uvCanonicalMeshes=[m+shift for m in meta.get('uvCanonicalMeshes',[])]+([8] if parts==5 else []),sourceName=f'Variante Atlas — {meta["name"]}.glb',originalSourceSha256=hashlib.sha256(raw).hexdigest());(outdir/'source.glb').write_bytes(raw);cloth=copy.deepcopy(j);cloth['meshes']=cloth['meshes'][:len(labels)]
 for n in cloth['nodes']:
  if n.get('mesh',-1)>=len(labels):n.pop('mesh')
 (outdir/'cloth-input.glb').write_bytes(encode(cloth,b));(outdir/'preparation.json').write_text(json.dumps(new,ensure_ascii=False,indent=2)+'\n');(outdir/'shorts-partition.json').write_text(json.dumps(stats,indent=2)+'\n');(outdir/'pair-audit.json').write_text(json.dumps(audit,indent=2)+'\n');print(ID,stats['areaBefore'],stats['areaAfter'],flush=True);return new
if __name__=='__main__':
 from concurrent.futures import ProcessPoolExecutor,as_completed
 if len(sys.argv)>1:bases=[m for m in bases if m['id'] in sys.argv[1:]]
 with ProcessPoolExecutor(max_workers=4) as pool:
  jobs=[pool.submit(create,base,parts) for base in bases for parts in [4,5]]
  for job in as_completed(jobs):
   new=job.result();manifest=[m for m in manifest if m['id']!=new['id']]+[new];MP.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
