from pathlib import Path
import sys,json,struct,gzip,hashlib,numpy as np
from concurrent.futures import ProcessPoolExecutor
from model_delta import encode_delta,decode_delta,replay_uv
from importlib.util import spec_from_file_location,module_from_spec
ROOT=Path(__file__).resolve().parents[1];spec=spec_from_file_location('affine',ROOT/'scripts/pack-affine-model-deltas.py');affine=module_from_spec(spec);spec.loader.exec_module(affine)
entries=json.loads((ROOT/'work/lateral-shorts/final-entries.json').read_text());reference=next(e for e in entries if e['descriptor']['category']=='calcao');referencePath=ROOT/'public'/reference['assets']['model'].lstrip('/');shared=referencePath.read_bytes()
def pack(e):
 d=e['descriptor'];root=ROOT/'public/assets/molds'/d['id'];model=(root/'model.glb').read_bytes()
 if d.get('baseShirtId'):
  basepath=ROOT/'public/assets/molds'/d['baseShirtId']/'model.glb';base=basepath.read_bytes()+shared;rs=affine.recipes(model,d);zero=bytearray(model)
  for r in rs:np.ndarray((r['count'],2),'<f4',zero,r['targetOffset'],strides=(r['targetStride'],4))[:]=0
  encoded,meta=encode_delta(base,bytes(zero),'/assets/molds/'+d['baseShirtId']+'/model.glb');payload=gzip.decompress(encoded);n=struct.unpack_from('<I',payload,4)[0];literal=payload[8+n:];restored=replay_uv(decode_delta(base,payload),rs);fix=[]
  for r in rs:
   for i in range(r['count']):
    for offset in [r['targetOffset']+i*r['targetStride'],r['targetOffset']+i*r['targetStride']+4]:
     if restored[offset:offset+4]!=model[offset:offset+4]:fix.append([offset,struct.unpack_from('<I',model,offset)[0]]);restored[offset:offset+4]=model[offset:offset+4]
  assert bytes(restored)==model
  meta.update(extraBasePath=reference['assets']['model'],extraBaseSha256=hashlib.sha256(shared).hexdigest(),uvReplay=rs,targetSha256=hashlib.sha256(model).hexdigest())
  if fix:meta['uvFixups']=fix
  header=json.dumps(meta,separators=(',',':')).encode();encoded=gzip.compress(b'ATL1'+struct.pack('<I',len(header))+header+literal,9,mtime=0);(root/'model.delta.gz').write_bytes(encoded)
 source=(root/'source.glb').read_bytes();encoded,_=encode_delta(model,source,e['assets']['model']);(root/'source.delta.gz').write_bytes(encoded);return d['id'],(root/'model.delta.gz').stat().st_size if(root/'model.delta.gz').exists()else len(gzip.compress(model,9))
if __name__=='__main__':
 with ProcessPoolExecutor(max_workers=2)as pool:
  for row in pool.map(pack,entries):print(row,flush=True)
