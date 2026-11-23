import pathlib,json,struct,gzip,numpy as np
from PIL import Image,ImageDraw
for name in ['stein','elite','basico']:
 b=gzip.decompress(pathlib.Path('public/teste-calcoes/'+name+'.bin').read_bytes());n=struct.unpack_from('<I',b,12)[0];d=json.loads(b[20:20+n]);raw=b[28+n:]
 def acc(i):
  a=d['accessors'][i];v=d['bufferViews'][a['bufferView']];size={'SCALAR':1,'VEC2':2,'VEC3':3}[a['type']];dtype={5121:'u1',5123:'<u2',5125:'<u4',5126:'<f4'}[a['componentType']];return np.frombuffer(raw,dtype=dtype,count=a['count']*size,offset=v.get('byteOffset',0)+a.get('byteOffset',0)).reshape(a['count'],size)
 meshes=[]
 for m in d['meshes']:
  q=m['primitives'][0];p=acc(q['attributes']['POSITION']);idx=acc(q['indices']).reshape(-1,3);normal=acc(q['attributes']['NORMAL']);meshes.append((p,idx,normal,'5480' in m['name'] or name=='stein' and m['name'].split('_')[-1] in ['71610','71612','71607','71614']))
 points=np.concatenate([p for p,_,_,_ in meshes]);lo=points.min(axis=0);hi=points.max(axis=0);scale=min(250/(hi[0]-lo[0]),380/(hi[1]-lo[1]));im=Image.new('RGBA',(640,600));draw=ImageDraw.Draw(im)
 for side in [0,1]:
  polys=[]
  for p,idx,norm,trim in meshes:
   for ids in idx:
    ps=p[ids];ns=norm[ids].mean(axis=0);shade=max(.6,min(1,.83+.17*abs(float(ns@np.array([.2,.5,.85])))));value=int((42 if trim else 244)*shade);uv=[((float(v[0]-(lo[0]+hi[0])/2))*(1 if side==0 else -1)*scale+160+side*320,450-float(v[1]-lo[1])*scale) for v in ps];polys.append((float(ps[:,2].mean())*(1 if side==0 else -1),uv,(value,value,value,255)))
  for _,poly,color in sorted(polys,key=lambda x:x[0]):draw.polygon(poly,fill=color)
 im.save('public/simulador/female/'+name+'-preview.webp',quality=90)
