"""Replay baked atlas UVs without storing their redundant float array.
The complete reconstructed GLB must retain the exact canonical SHA256.
"""
import json,struct,gzip,hashlib
from pathlib import Path
from model_delta import encode_delta,decode_delta,replay_uv
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
def recipes(raw,d):
 n=struct.unpack_from('<I',raw,12)[0];j=json.loads(raw[20:20+n]);start=28+n;out=[]
 for p in d['panels']:
  pr=j['meshes'][p['mesh']]['primitives'][p['primitive']];target=j['accessors'][pr['attributes']['TEXCOORD_0']];source=j['accessors'][pr['attributes']['TEXCOORD_1']];tb=j['bufferViews'][target['bufferView']];sb=j['bufferViews'][source['bufferView']];assert target['count']==source['count'] and target['componentType']==source['componentType']==5126
  matrix=p['physicalMatrix'];out.append(dict(sourceOffset=start+sb.get('byteOffset',0)+source.get('byteOffset',0),targetOffset=start+tb.get('byteOffset',0)+target.get('byteOffset',0),count=target['count'],sourceStride=sb.get('byteStride',8),targetStride=tb.get('byteStride',8),matrix=[matrix[0][0],matrix[0][1],matrix[1][0],matrix[1][1]],origin=p['physicalBounds'][:2],rect=[p['rect']['x'],p['rect']['y']],scale=d['texelsPerUvUnit']))
 return out
def pack(job):
 path,basepath,d=job;target=path.read_bytes();base=basepath.read_bytes();rs=recipes(target,d);zero=bytearray(target)
 for r in rs:np.ndarray((r['count'],2),dtype='<f4',buffer=zero,offset=r['targetOffset'],strides=(r['targetStride'],4))[:]=0
 packed,_=encode_delta(base,bytes(zero),'/'+str(basepath.relative_to(ROOT/'public')));data=gzip.decompress(packed);n=struct.unpack_from('<I',data,4)[0];meta=json.loads(data[8:8+n]);literal=data[8+n:];restored=replay_uv(decode_delta(base,data),rs);fix=[]
 for r in rs:
  for i in range(r['count']):
   at=r['targetOffset']+i*r['targetStride']
   for offset in [at,at+4]:
    if restored[offset:offset+4]!=target[offset:offset+4]:fix.append([offset,struct.unpack_from('<I',target,offset)[0]]);restored[offset:offset+4]=target[offset:offset+4]
 assert bytes(restored)==target,path
 meta.update(uvReplay=rs,targetSha256=hashlib.sha256(target).hexdigest())
 if fix:meta['uvFixups']=fix
 h=json.dumps(meta,separators=(',',':')).encode();out=gzip.compress(b'ATL1'+struct.pack('<I',len(h))+h+literal,9,mtime=0);dest=path.with_suffix('.delta.gz');before=dest.stat().st_size if dest.exists() else len(gzip.compress(target,9));dest.write_bytes(out);return dict(id=d['id'],before=before,after=len(out),fixups=len(fix),canonicalSha256=meta['targetSha256'])
if __name__=='__main__':
 import sys
 from concurrent.futures import ProcessPoolExecutor
 entries=json.load(open(sys.argv[1]));jobs=[]
 for e in entries:
  d=e['descriptor'];p=ROOT/'public'/e['assets']['model'].lstrip('/');patch=p.with_suffix('.delta.gz')
  if e.get('deltaBaseId'):basepath=ROOT/'public/assets/molds'/e['deltaBaseId']/'model.glb'
  elif patch.exists():
   b=gzip.decompress(patch.read_bytes());n=struct.unpack_from('<I',b,4)[0];m=json.loads(b[8:8+n]);basepath=ROOT/'public'/m['basePath'].lstrip('/')
  else:raise ValueError('Explicit immutable base required '+d['id'])
  jobs.append((p,basepath,d))
 with ProcessPoolExecutor(max_workers=4) as pool:
  results=list(pool.map(pack,jobs))
 for r in results:print(json.dumps(r),flush=True)
 print('saved',sum(r['before']-r['after'] for r in results),flush=True)
