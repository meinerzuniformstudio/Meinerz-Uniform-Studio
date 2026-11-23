import json,struct,copy,collections,pathlib
import numpy as np
ROOT=pathlib.Path(__file__).resolve().parents[1]
def read(path):
 raw=path.read_bytes();n=struct.unpack_from('<I',raw,12)[0];return json.loads(raw[20:20+n]),raw[28+n:]
def encode(j,b):
 a=json.dumps(j,separators=(',',':'),ensure_ascii=False).encode();a+=b' '*((-len(a))%4);b=bytes(b);b+=b'\0'*((-len(b))%4);return struct.pack('<III',0x46546c67,2,28+len(a)+len(b))+struct.pack('<II',len(a),0x4e4f534a)+a+struct.pack('<II',len(b),0x004e4942)+b
class Glb:
 def __init__(self,path):self.j,self.b=read(path)
 def acc(self,i):
  a=self.j['accessors'][i];v=self.j['bufferViews'][a['bufferView']];size={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']];dt={5126:'<f4',5123:'<u2',5125:'<u4'}[a['componentType']];return np.frombuffer(self.b,dtype=dt,offset=v.get('byteOffset',0)+a.get('byteOffset',0),count=a['count']*size).reshape(-1,size).copy()
 def data(self,m):
  p=self.j['meshes'][m]['primitives'][0];return np.hstack([self.acc(p['attributes'][k]) for k in ['POSITION','NORMAL','TEXCOORD_0']]),self.acc(p['indices']).reshape(-1,3)
def write_meshes(src,meshes,labels,node_map=None):
 out=copy.deepcopy(src.j);out['accessors']=[];out['bufferViews']=[];out['meshes']=[];chunks=bytearray()
 def put(a,typ,ctype,target):
  a=np.ascontiguousarray(a);chunks.extend(b'\0'*((-len(chunks))%4));vi=len(out['bufferViews']);out['bufferViews'].append({'buffer':0,'byteOffset':len(chunks),'byteLength':a.nbytes,'target':target});chunks.extend(a.tobytes());i=len(out['accessors']);d={'bufferView':vi,'componentType':ctype,'count':len(a),'type':typ}
  if typ=='VEC3':d.update(min=a.min(0).tolist(),max=a.max(0).tolist())
  out['accessors'].append(d);return i
 for k,prs in enumerate(meshes):
  new=[]
  for attrs,ix,mat in prs:
   ids={key:put(a.astype('<f4'),'VEC2' if key.startswith('TEX') else 'VEC3',5126,34962) for key,a in attrs.items()};index=put(ix.astype('<u4').reshape(-1,1),'SCALAR',5125,34963);new.append({'attributes':ids,'indices':index,'material':mat})
  out['meshes'].append({'name':labels[k], 'primitives':new})
 if node_map is None:
  # Compact standalone source: original transforms copied onto cloth nodes only.
  out['nodes']=[dict({k:copy.deepcopy(v) for k,v in next(n for n in src.j['nodes'] if n.get('mesh')==m).items() if k in ['matrix','translation','rotation','scale']},mesh=m,name=labels[m]) for m in range(len(meshes))];out['scenes']=[{'nodes':list(range(len(meshes)))}];out['scene']=0
 else:
  for n in out['nodes']:
   if 'mesh' in n:
    old=n['mesh'];n['mesh']=node_map[old][0]
    # duplicate transform as siblings under same parent
  for old,news in node_map.items():
   original=next(k for k,n in enumerate(src.j['nodes']) if n.get('mesh')==old)
   for m in news[1:]:
    node=copy.deepcopy(out['nodes'][original]);node['mesh']=m;node['name']=labels[m];index=len(out['nodes']);out['nodes'].append(node)
    parent=next((n for n in out['nodes'] if original in n.get('children',[])),None)
    if parent is not None:parent['children'].append(index)
    else:out['scenes'][out.get('scene',0)]['nodes'].append(index)
 out['buffers']=[{'byteLength':len(chunks)}];out.pop('skins',None);out.pop('animations',None)
 return out,chunks

def primitive(src,m):
 return [({k:src.acc(v) for k,v in p['attributes'].items() if k in ['POSITION','NORMAL','TEXCOORD_0']},src.acc(p['indices']),p.get('material',0)) for p in src.j['meshes'][m]['primitives']]
def boundary(a,ix):
 keys={};remap=[]
 for v in a:
  key=tuple(v[[0,1,2,6,7]]);remap.append(keys.setdefault(key,len(keys)))
 inv=np.array(list(keys));ci=np.array(remap)[ix];edges=collections.Counter(tuple(sorted(e)) for t in ci for e in [(t[0],t[1]),(t[1],t[2]),(t[2],t[0])]);return inv,np.array([e for e,n in edges.items() if n==1])
def triangles_primitive(ts):
 unique={};verts=[];ix=[]
 for t in ts:
  for vertex in t:
   v=np.array(vertex,dtype='<f4');key=v.tobytes()
   if key not in unique:unique[key]=len(verts);verts.append(v)
   ix.append(unique[key])
 a=np.array(verts);return [({'POSITION':a[:,:3].copy(),'NORMAL':a[:,3:6].copy(),'TEXCOORD_0':a[:,6:].copy()},np.array(ix,dtype='<u4'),0)]
def split_triangles(a,ix,fn):
 values=[v.astype(float) for v in a];cache={};yes=[];no=[]
 for tri in ix:
  inside=[];outside=[];poly=list(map(int,tri))
  for x,y in zip(poly,poly[1:]+poly[:1]):
   fx,fy=fn(values[x]),fn(values[y])
   if fx<=0:inside.append(x)
   if fx>=0:outside.append(x)
   if fx*fy<0:
    key=tuple(sorted([x,y]))
    if key not in cache:
     p,q=key;fp,fq=fn(values[p]),fn(values[q]);t=fp/(fp-fq);v=values[p]+t*(values[q]-values[p]);cache[key]=len(values);values.append(v)
    inside.append(cache[key]);outside.append(cache[key])
  for poly,out in [(inside,yes),(outside,no)]:
   for i in range(1,len(poly)-1):
    t=np.array([values[k] for k in [poly[0],poly[i],poly[i+1]]]);
    if np.linalg.norm(np.cross(t[1,:3]-t[0,:3],t[2,:3]-t[0,:3]))>1e-14:out.append(t)
 return np.array(yes),np.array(no)
def area(ts):return float(np.linalg.norm(np.cross(ts[:,1,:3]-ts[:,0,:3],ts[:,2,:3]-ts[:,0,:3]),axis=1).sum()/2)
