"""Studio renders from the actual PRIME meshes; no changes to production GLBs."""
import json,pathlib
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parents[1];entries=json.loads((ROOT/'work/prime-final-entries.json').read_text());file=ROOT/'public/simulador/kit-previews.js';mapping=json.loads(file.read_text().split('=',1)[1].strip().rstrip(';'));out=ROOT/'public/simulador/previews';seen=set()
for e in entries:
 d=e['descriptor'];stem=('shirt-prime-'+'-'.join([d['modeling'],d['collar'],d['cutType']])).lower().replace(' ','-');shorts='shorts-prime-'+str(d['bottomParts']);paths={}
 for kind,name in [('shirt',stem),('shorts',shorts)]:
  target=out/(name+'.webp')
  if name not in seen:
   im=Image.open(ROOT/'work/kit-realistic'/(name+'.png')).convert('RGBA');assert im.size==(640,600);im.save(target,'WEBP',quality=88,method=6,exact=True);seen.add(name)
  paths[kind]='/simulador/previews/'+target.name
 mapping[d['id']]=paths
file.write_text('export const KIT_PREVIEWS='+json.dumps(mapping,separators=(',',':'))+';\n');print('PRIME previews',len(entries),'kits',len(seen),'images')
