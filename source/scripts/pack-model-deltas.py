from model_delta import *
from pathlib import Path
from concurrent.futures import ProcessPoolExecutor,as_completed
ROOT=Path(__file__).resolve().parents[1];molds=ROOT/'public/assets/molds';manifest=json.loads((ROOT/'scripts/presentation-pack-manifest.json').read_text())
def pack(basepath,targetpath):
 base=basepath.read_bytes();target=targetpath.read_bytes();rel='/'+str(basepath.relative_to(ROOT/'public'));packed,meta=encode_delta(base,target,rel);full=gzip.compress(target,compresslevel=9,mtime=0);out=targetpath.with_suffix('.delta.gz')
 if len(packed)<len(full):out.write_bytes(packed);return str(out.relative_to(molds)),len(packed),len(full)
 out.unlink(missing_ok=True);return str(out.relative_to(molds)),None,len(full)
if __name__=='__main__':
 jobs=[]
 for m in manifest:
  if m.get('bottomDerivedFrom'):
   baseid=m['bottomDerivedFrom']+('-shorts4-v1' if m['bottomParts']==5 else '');jobs.append((molds/baseid/'model.glb',molds/m['id']/'model.glb'))
 active={m['id'] for m in manifest};originals=[m for m in manifest if m.get('bottomParts',2)==2]
 for target in molds.glob('*/model.glb'):
  if target.parent.name in active or target.parent.name.startswith('kit-edge') or target.parent.name.endswith('-referencia'):continue
  old=target.parent.name;candidates=[m for m in originals if m.get('replaces')==old or m['id'].removesuffix('-paired-v1')==old]
  if not candidates:
   prep=target.with_name('preparation.json')
   if prep.exists():
    meta=json.loads(prep.read_text());candidates=[m for m in originals if all(m.get(k)==meta.get(k) for k in ['modeling','collar','sideCut','variant'])]
  if not candidates:candidates=[m for m in originals if m['collar']=='REDONDA' and not m['sideCut'] and m['modeling']=='NORMAL']
  jobs.append((molds/candidates[0]['id']/'model.glb',target))
 for p in molds.glob('*/source.glb'):
  model=p.with_name('model.glb')
  if not model.exists() and p.parent.name=='kit-edge-2027':model=molds/'kit-edge-2027-mapa-v3/model.glb'
  if model.exists():jobs.append((model,p))
 results=[]
 with ProcessPoolExecutor(max_workers=4) as pool:
  futures=[pool.submit(pack,*job) for job in jobs]
  for f in as_completed(futures):
   result=f.result();results.append(result);print(*result,flush=True)
 (ROOT/'scripts/model-delta-audit.json').write_text(json.dumps(results,indent=2)+'\n')
