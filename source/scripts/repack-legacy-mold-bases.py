"""Rebase full legacy binaries losslessly onto one immutable full-size anchor.
No mesh or atlas changes; canonical target bytes and SHA256 remain unchanged.
"""
from pathlib import Path
import json,hashlib,gzip,struct,numpy as np
from model_delta import encode_delta,decode_delta
from concurrent.futures import ProcessPoolExecutor
ROOT=Path(__file__).resolve().parents[1];ANCHOR='pack26-normal-redonda-sem-recorte-paired-v1';base=(ROOT/'public/assets/molds'/ANCHOR/'model.glb').read_bytes()
def best(raw):
 n=len(raw)//4;head=b'GLS1'+struct.pack('<I',len(raw))+hashlib.sha256(raw).digest();data=np.frombuffer(raw[:n*4],dtype='u1').reshape(n,4).T.copy().tobytes()+raw[n*4:];packed=gzip.compress(head+data,9,mtime=0);plain=gzip.compress(raw,9,mtime=0);return min([packed,plain],key=len)
def repack(id):
 anchor='pack26-raglan-redonda-sem-recorte-paired-v1' if '-raglan-' in id else ANCHOR;reference=(ROOT/'public/assets/molds'/anchor/'model.glb').read_bytes();path=ROOT/'public/assets/molds'/id;existing=ROOT/'dist/client/assets/molds'/id/'model.glb.gz';target=(path/'model.glb').read_bytes();packed,meta=encode_delta(reference,target,'/assets/molds/'+anchor+'/model.glb');raw=gzip.decompress(packed);assert decode_delta(reference,raw)==target;candidate=best(raw);old=existing.stat().st_size
 if len(candidate)>=old:return [id,old,old]
 (path/'model.delta.gz').write_bytes(packed);(existing.with_name('model.delta.gz')).write_bytes(candidate);existing.unlink();return [id,old,len(candidate)]
if __name__=='__main__':
 ids=[p.parent.name for p in (ROOT/'dist/client/assets/molds').glob('*/model.glb.gz') if p.parent.name not in [ANCHOR,'pack26-raglan-redonda-sem-recorte-paired-v1'] and '-referencia'not in p.parent.name]
 with ProcessPoolExecutor(max_workers=2)as pool:results=list(pool.map(repack,ids))
 previous=json.loads((ROOT/'scripts/legacy-mold-repack-audit.json').read_text()) if (ROOT/'scripts/legacy-mold-repack-audit.json').exists() else [];print(json.dumps(results));results=previous+results;(ROOT/'scripts/legacy-mold-repack-audit.json').write_text(json.dumps(results,indent=2)+'\n')
