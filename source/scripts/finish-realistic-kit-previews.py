"""Export the complete studio batch atomically; keep the old selection intact
until every garment has rendered. The canonical GLBs and garment scales do not change.
"""
import json,pathlib,re,hashlib,sys,subprocess
from PIL import Image,ImageFilter
ROOT=pathlib.Path(__file__).resolve().parents[1];work=ROOT/'work/kit-realistic';out=ROOT/'public/simulador/previews';jobs=json.loads((work/'jobs.json').read_text());old=json.loads((ROOT/'public/simulador/kit-previews.js').read_text().split('=',1)[1].strip().rstrip(';'))
if '--fit-shirts' in sys.argv:jobs=[j for j in jobs if j['kind']=='shirt']
for job in jobs:
 if not(work/job['filename']).exists() and '--prepare' not in sys.argv:raise RuntimeError('Missing render '+job['filename'])
replacements={};used=set();audit=[]
for job in jobs:
 if not(work/job['filename']).exists():continue
 filename=re.sub(r'^(shirt|shorts)-(?:studio-)?',r'\1-studio-',job['filename'].replace('.png','.webp'))
 if '--fit-shirts' in sys.argv:filename=re.sub(r'^shirt-studio-(?:fit-)?','shirt-studio-fit-',filename)
 if not(out/filename).exists() or (out/filename).stat().st_mtime<(work/job['filename']).stat().st_mtime:
  im=Image.open(work/job['filename']).convert('RGBA');assert im.size==(640,600)
  rgb=im.convert('RGB');mask=im.getchannel('A').filter(ImageFilter.MinFilter(3));rgb=Image.composite(rgb.filter(ImageFilter.MedianFilter(3)),rgb,mask);rgb.putalpha(im.getchannel('A'));rgb.save(out/filename,'WEBP',quality=82,method=6,exact=True)
 before='/simulador/previews/'+job['filename'].replace('.png','.webp');after='/simulador/previews/'+filename;replacements[before]=after;used.add(filename)
 audit.append({'asset':after,'kind':job['kind'],'model':job['model'],'panels':[p['number'] for p in job['panels']],'engine':'Blender Cycles CPU','samples':64,'views':['front','back'],'dimensions':[640,600],'sha256':hashlib.sha256((out/filename).read_bytes()).hexdigest()})
if '--prepare' in sys.argv:
 print('prepared',len(audit),'studio images');raise SystemExit(0)
for kit,layers in old.items():
 for role in ['shirt','shorts']:layers[role]=replacements.get(layers[role],layers[role])
(ROOT/'public/simulador/kit-previews.js').write_text('export const KIT_PREVIEWS='+json.dumps(old,separators=(',',':'))+';\n')
used={layers[role].rsplit('/',1)[-1] for layers in old.values() for role in ['shirt','shorts']}
for file in out.glob('*.webp'):
 if file.name not in used:file.unlink()
selection_audit=ROOT/'scripts/kit-selection-preview-audit.json'
if selection_audit.exists():
 entries=json.loads(selection_audit.read_text())
 for entry in entries:entry.update(old[entry['id']])
 selection_audit.write_text(json.dumps(entries,indent=2)+'\n')
if '--fit-shirts' in sys.argv:
 previous=json.loads((ROOT/'scripts/kit-studio-preview-audit.json').read_text());audit=[a for a in previous if a['kind']!='shirt']+[dict(a,cameraInterior='occluded',bodyInnerShell=False) for a in audit]
(ROOT/'scripts/kit-studio-preview-audit.json').write_text(json.dumps(audit,indent=2)+'\n')
print('studio assets',len(used),'bytes',sum(f.stat().st_size for f in out.glob('*.webp')))

subprocess.run(['python','scripts/fit-kit-preview-waists.py'],cwd=ROOT,check=True)
