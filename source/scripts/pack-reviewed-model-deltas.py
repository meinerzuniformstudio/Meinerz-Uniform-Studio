"""Lossless revisions depend on the previous immutable model, never vice versa."""
from model_delta import encode_delta
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor
import json,gzip
ROOT=Path(__file__).resolve().parents[1]
def pack(a):
 old=a['previousId'];new=a['id'];base=ROOT/'public/assets/molds'/old/'model.glb';data=base.read_bytes();result=[]
 for kind in ['model','source']:
  p=ROOT/'public/assets/molds'/new/(kind+'.glb');raw=p.read_bytes();packed,meta=encode_delta(data,raw,'/assets/molds/'+old+'/model.glb');full=gzip.compress(raw,compresslevel=9,mtime=0)
  if len(packed)<len(full):p.with_suffix('.delta.gz').write_bytes(packed);result.append([kind,len(raw),len(packed)])
 return [new,result]
if __name__=='__main__':
 audit=json.loads((ROOT/'scripts/map-proportion-audit.json').read_text())
 with ProcessPoolExecutor(max_workers=4) as pool:
  for row in pool.map(pack,audit):print(*row,flush=True)
