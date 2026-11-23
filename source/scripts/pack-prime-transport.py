"""Lossless fine-grained COPY/ADD for newly generated PRIME chart layouts."""
import json,sys,gzip,struct,hashlib
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor
import model_delta as delta
from importlib.util import spec_from_file_location,module_from_spec
ROOT=Path(__file__).resolve().parents[1]
spec=spec_from_file_location('affine',ROOT/'scripts/pack-affine-model-deltas.py');affine=module_from_spec(spec);spec.loader.exec_module(affine)
delta.BLOCK=12;delta.STEP=4
entries=json.loads((ROOT/'work/prime-transport-jobs.json').read_text())
def pack(e):
 d=e['descriptor'];p=ROOT/'public'/e['assets']['model'].lstrip('/');base=ROOT/'public/assets/molds'/e['deltaBaseId']/'model.glb';previous=p.with_suffix('.delta.gz').read_bytes();r=affine.pack((p,base,d));packed=p.with_suffix('.delta.gz').read_bytes();payload=gzip.decompress(packed);n=struct.unpack_from('<I',payload,4)[0];meta=json.loads(payload[8:8+n]);ops=len(meta['ops'])
 if len(packed)>=len(previous) or ops>100000 or n>4*1024*1024:p.with_suffix('.delta.gz').write_bytes(previous)
 source=ROOT/'public'/e['assets']['source'].lstrip('/');raw=source.read_bytes();out,sm=delta.encode_delta(p.read_bytes(),raw,e['assets']['model']);oldn=len(gzip.decompress(out));assert len(sm['ops'])<=100000
 source.with_suffix('.delta.gz').write_bytes(out)
 return {'id':d['id'],'modelBytes':p.with_suffix('.delta.gz').stat().st_size,'sourceBytes':len(out),'copyOps':ops,'headerBytes':n,'before':len(previous)}
if __name__=='__main__':
 if len(sys.argv)>1:entries=[e for e in entries if e['descriptor']['id']==sys.argv[1]]
 with ProcessPoolExecutor(max_workers=2) as pool:
  for r in pool.map(pack,entries):print(json.dumps(r),flush=True)
