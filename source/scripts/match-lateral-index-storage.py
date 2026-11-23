"""Use the parent's exact unsigned index representation; never change a triangle."""
from shorts_geometry import *
import hashlib
entries=json.loads((ROOT/'work/lateral-shorts/final-entries.json').read_text())
for e in entries:
 d=e['descriptor'];parent=d.get('baseShirtId')
 if not parent:continue
 old=Glb(ROOT/'public/assets/molds'/parent/'model.glb')
 for kind in ['model','source']:
  path=ROOT/'public/assets/molds'/d['id']/(kind+'.glb');g=Glb(path);binary=bytearray(g.b)
  for m in range(8,len(g.j['meshes'])):
   for k,p in enumerate(g.j['meshes'][m]['primitives']):
    oldp=old.j['meshes'][m-4]['primitives'][k];ctype=old.j['accessors'][oldp['indices']]['componentType'];a=g.j['accessors'][p['indices']]
    if ctype==a['componentType']:continue
    values=g.acc(p['indices']);assert values.max()<65536 and ctype==5123
    view=g.j['bufferViews'][a['bufferView']];at=view.get('byteOffset',0)+a.get('byteOffset',0);encoded=values.astype('<u2').tobytes();binary[at:at+view['byteLength']]=b'\0'*view['byteLength'];binary[at:at+len(encoded)]=encoded;view['byteLength']=len(encoded);a['componentType']=5123
  raw=encode(g.j,binary);path.write_bytes(raw)
  if kind=='source':d['sourceSha256']=hashlib.sha256(raw).hexdigest()
 (ROOT/'public/assets/molds'/d['id']/'descriptor.json').write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
(ROOT/'work/lateral-shorts/final-entries.json').write_text(json.dumps(entries))
# Keep the registered immutable descriptor in sync with the canonical source hash.
p=ROOT/'lib/presentation-pack-templates.mjs';s=p.read_text();prefix=s[:s.index('Object.freeze(')+len('Object.freeze(')];pack=json.loads(s[len(prefix):].removesuffix(');\n'));updated={e['descriptor']['id']:e for e in entries}
p.write_text(prefix+json.dumps([updated.get(e['descriptor']['id'],e)for e in pack],ensure_ascii=False,separators=(',',':'))+');\n')
