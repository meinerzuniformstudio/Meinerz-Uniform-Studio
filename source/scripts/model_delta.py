import hashlib,json,struct,gzip
BLOCK=64;STEP=32
def index_base(base):
 index={}
 for i in range(0,len(base)-BLOCK+1,STEP):
  key=hashlib.blake2b(base[i:i+BLOCK],digest_size=8).digest();bucket=index.setdefault(key,[])
  if len(bucket)<4:bucket.append(i)
 return index
def encode_delta(base,target,base_path,index=None):
 index=index if index is not None else index_base(base);ops=[];literal=bytearray();at=0;pending=0;n=len(target)
 def add(end):
  nonlocal pending
  if end>pending:ops.append([1,len(literal),end-pending]);literal.extend(target[pending:end])
 while at+BLOCK<=n:
  key=hashlib.blake2b(target[at:at+BLOCK],digest_size=8).digest();best=(0,0)
  for off in index.get(key,[]):
   if base[off:off+BLOCK]!=target[at:at+BLOCK]:continue
   length=BLOCK;limit=min(len(base)-off,n-at)
   for step in [4096,128,4,1]:
    while length+step<=limit and base[off+length:off+length+step]==target[at+length:at+length+step]:length+=step
   length-=length%4
   if length>best[0]:best=length,off
  if best[0]>=BLOCK:
   add(at);length,off=best;ops.append([0,off,length]);at+=length;pending=at
  else:at+=4
 add(n)
 meta={'basePath':base_path,'baseSha256':hashlib.sha256(base).hexdigest(),'targetLength':n,'targetSha256':hashlib.sha256(target).hexdigest(),'ops':ops};header=json.dumps(meta,separators=(',',':')).encode();data=b'ATL1'+struct.pack('<I',len(header))+header+literal
 assert decode_delta(base,data)==target
 return gzip.compress(data,compresslevel=9,mtime=0),meta
def decode_delta(base,data):
 assert data[:4]==b'ATL1';n=struct.unpack_from('<I',data,4)[0];m=json.loads(data[8:8+n]);literal=data[8+n:];out=bytearray()
 for kind,offset,length in m['ops']:out.extend((base if kind==0 else literal)[offset:offset+length])
 if m.get('uvReplay'):out=replay_uv(out,m['uvReplay']);
 for offset,bits in m.get('uvFixups',[]):struct.pack_into('<I',out,offset,bits)
 assert len(out)==m['targetLength'];assert hashlib.sha256(out).hexdigest()==m['targetSha256'];return bytes(out)

def replay_uv(raw,recipes):
 import numpy as np
 out=bytearray(raw)
 for r in recipes:
  a,b,c,d=r['matrix'];uv=np.ndarray((r['count'],2),dtype='<f4',buffer=out,offset=r['sourceOffset'],strides=(r['sourceStride'],4)).astype(np.float64);target=np.ndarray((r['count'],2),dtype='<f4',buffer=out,offset=r['targetOffset'],strides=(r['targetStride'],4));x=uv[:,0]*a+uv[:,1]*c;y=uv[:,0]*b+uv[:,1]*d;target[:,0]=(r['rect'][0]+(x-r['origin'][0])*r['scale'])/4096;target[:,1]=(r['rect'][1]+(y-r['origin'][1])*r['scale'])/4096
 return out
