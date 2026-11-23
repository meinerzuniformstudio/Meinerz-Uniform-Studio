"""Orthographic technical drawings from canonical GLB geometry, not invented shapes.
Shared shirt/short layers keep the selection screen small and avoid loading WebGL.
"""
import json,hashlib,pathlib,sys,subprocess
import numpy as np
from PIL import Image,ImageDraw,ImageFilter
from shorts_geometry import Glb,ROOT
subprocess.run(['node','scripts/build-kit-preview-input.mjs'],cwd=ROOT,check=True)
entries=json.load(open(ROOT/'work/kit-preview-entries.json'));out=ROOT/'public/simulador/previews';out.mkdir(exist_ok=True)
W,H,SS=640,600,2
SCALE=1160*SS;BASE=555*SS;centers=[160*SS,480*SS]
cache={};mapping={};audit=[];jobs={};shirt_cache={};by_id={e['id']:e for e in entries}
def meshes(entry):
 g=Glb(ROOT/('public'+entry['model']));parts=[]
 for p in entry['panels']:
  pr=g.j['meshes'][p['mesh']]['primitives'][0];pos=g.acc(pr['attributes']['POSITION']);normal=g.acc(pr['attributes']['NORMAL']);idx=g.acc(pr['indices']).reshape(-1,3)
  parts.append((p['label'],pos,normal,idx))
 return parts
def key(parts):
 h=hashlib.sha256()
 for label,pos,n,idx in parts:h.update(label.encode());h.update(pos.tobytes());h.update(n.tobytes());h.update(idx.astype('<u4').tobytes())
 return h.hexdigest()[:20]
def render(parts,name):
 ids=Image.new('I',(W*SS,H*SS),0);canvas=Image.new('RGB',(W*SS,H*SS),'white');draw=ImageDraw.Draw(canvas);tags=ImageDraw.Draw(ids)
 for col,sign in enumerate([1,-1]):
  triangles=[]
  for panel,(label,pos,n,idx) in enumerate(parts):
   projected=np.column_stack((centers[col]+pos[:,0]*sign*SCALE,BASE-(pos[:,1]-.18)*SCALE))
   projected=projected[idx];depth=pos[idx,2].mean(1)*sign
   black=label.startswith(('Gola','Colarinho','Peitilho','Filete','Cós','Recorte')) or label.startswith('Calção lateral')
   light=np.clip(np.abs(n[idx,2].mean(1)),0,1);shade=np.round((228+light*25)/4)*4 if not black else np.round((34+light*12)/3)*3
   triangles.extend((z,xy,int(shade[k]),panel+1) for k,(z,xy) in enumerate(zip(depth,projected)))
  triangles.sort(key=lambda x:x[0])
  for z,xy,shade,panel in triangles:
   poly=[tuple(v) for v in xy];draw.polygon(poly,fill=(shade,shade,shade));tags.polygon(poly,fill=panel)
 tag=np.asarray(ids);edge=np.zeros(tag.shape,bool)
 for dy,dx in [(1,0),(0,1),(-1,0),(0,-1)]:
  shifted=np.roll(tag,(dy,dx),(0,1));edge|=(tag!=shifted)&(tag!=0)
 rgba=np.dstack((np.asarray(canvas),np.where(tag!=0,255,0).astype(np.uint8)));rgba[edge,:3]=54
 im=Image.fromarray(rgba,'RGBA').resize((W,H),Image.Resampling.LANCZOS)
 dest=out/(name+'.webp');im.save(dest,'WEBP',quality=82,method=6,exact=True)
 return dest.stat().st_size
for index,e in enumerate(entries):
 parts=meshes(e);layers={}
 if e['family'] not in shirt_cache:shirt_cache[e['family']]=[p for p in meshes(by_id[e['family']]) if not p[0].startswith(('Calção','Cós','Bermuda'))]
 for kind,subset in [('shirt',shirt_cache[e['family']]),('shorts',[p for p in parts if p[0].startswith(('Calção','Cós','Bermuda'))])]:
  digest=key(subset);name=kind+'-'+digest
  if name not in jobs:jobs[name]=subset
  layers[kind]='/simulador/previews/'+name+'.webp'
 mapping[e['id']]=layers
 audit.append({'id':e['id'],'panels':len(parts),'shirtPanels':len([p for p in parts if not p[0].startswith(('Calção','Cós','Bermuda'))]),'shortsPanels':len([p for p in parts if p[0].startswith(('Calção','Cós','Bermuda'))]),**layers})
 if '--sample' in sys.argv:break
from concurrent.futures import ProcessPoolExecutor,as_completed
with ProcessPoolExecutor(max_workers=4) as pool:
 futures={}
 for name,parts in jobs.items():
  if (out/(name+'.webp')).exists():cache[name]=(out/(name+'.webp')).stat().st_size
  else:futures[pool.submit(render,parts,name)]=name
 for future in as_completed(futures):
  name=futures[future];cache[name]=future.result();print(name,cache[name],flush=True)
# Identical views can share one lossless reference even when hidden meshes differ.
image_hashes={};aliases={}
for name in cache:
 digest=hashlib.sha256((out/(name+'.webp')).read_bytes()).hexdigest()
 if digest in image_hashes:aliases['/simulador/previews/'+name+'.webp']='/simulador/previews/'+image_hashes[digest]+'.webp'
 else:image_hashes[digest]=name
for layers in mapping.values():
 for role,url in layers.items():layers[role]=aliases.get(url,url)
for item in audit:
 for role in ['shirt','shorts']:item[role]=aliases.get(item[role],item[role])
used={url for layers in mapping.values() for url in layers.values()}
for file in out.glob('*.webp'):
 if '/simulador/previews/'+file.name not in used:file.unlink()
(ROOT/'work/kit-previews/mapping.json').write_text(json.dumps(mapping))
(ROOT/'scripts/kit-selection-preview-audit.json').write_text(json.dumps(audit,indent=2)+'\n')
(ROOT/'public/simulador/kit-previews.js').write_text('export const KIT_PREVIEWS='+json.dumps(mapping,separators=(',',':'))+';\n')
print('unique',len(image_hashes),'bytes',sum(p.stat().st_size for p in out.glob('*.webp')),flush=True)
