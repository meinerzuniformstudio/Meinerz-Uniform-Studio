"""Tuck the waistband below the shirt hem in the preview only.
Translate the shorts as one rigid image layer: no scaling, cropping or GLB edits.
"""
import json,pathlib
import numpy as np
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parents[1];file=ROOT/'public/simulador/kit-previews.js';data=json.loads(file.read_text().split('=',1)[1].strip().rstrip(';'));images={};audit=[]
def pixels(path):
 if path not in images:images[path]=np.asarray(Image.open(ROOT/('public'+path)).convert('RGBA'))
 return images[path]
for id,entry in data.items():
 shirt=pixels(entry['shirt']);shorts=pixels(entry['shorts']);required=[];views=[]
 for center in [149,491]:
  amounts=[]
  for x in range(center-32,center+33):
   sy=np.flatnonzero(shirt[:460,x,3]>240)
   py=np.flatnonzero(shorts[:,x,3]>240)
   if len(sy)==0 or len(py)==0:continue
   hem=int(sy[-1]);top=int(py[0]);colors=shorts[:,x,:3].mean(axis=1);waist_end=top
   # The first continuous dark region is the waistband and its contact shadow;
   # stop at the bright shorts fabric before reaching any crotch shadows.
   for y in range(top,min(top+105,550)):
    if np.all(colors[y:y+3]>155):waist_end=y-1;break
   amounts.append(max(0,waist_end-hem+3))
  lift=int(max(amounts,default=0));views.append(lift);required.append(lift)
 lift=max(required)
 if lift>60:raise RuntimeError('Unexpected waist fit '+id+' '+str(lift))
 entry['shortsLift']=lift;audit.append({'id':id,'shortsLift':lift,'front':views[0],'back':views[1],'method':'rigid vertical translation; scale unchanged'})
file.write_text('export const KIT_PREVIEWS='+json.dumps(data,separators=(',',':'))+';\n');(ROOT/'scripts/kit-preview-waist-fit.json').write_text(json.dumps(audit,indent=2)+'\n')
print('fit',len(data),'kits; lifts',min(x['shortsLift'] for x in audit),'to',max(x['shortsLift'] for x in audit),'pixels')

selection=ROOT/'scripts/kit-selection-preview-audit.json'
if selection.exists():
 entries=json.loads(selection.read_text())
 for e in entries:e['shortsLift']=data[e['id']]['shortsLift']
 selection.write_text(json.dumps(entries,indent=2)+'\n')
