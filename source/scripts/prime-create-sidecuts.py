"""Derive lateral, faixa and axila panels by subdividing native cloth triangles.
No existing vertex is moved; seam intersections use barycentric interpolation.
"""
from pathlib import Path
import sys
BASE=Path(__file__).resolve().parent
for cut in (sys.argv[1:] or ['LATERAL','FAIXA','AXILA']):
 s=(BASE/'prestige-create-sidecuts.py').read_text().replace('prestige-upload-manifest.json','prime-upload-manifest.json')
 a=s.index('bases=[e for e in manifest');b=s.index('# Same proportion',a)
 s=s[:a]+"bases=[e for e in manifest if not e['sideCut'] and e.get('bottomParts')==2]\n"+s[b:]
 s=s.replace("ID=BASE.replace('-sem-recorte','-com-recorte')+'-derived-v1'",f"ID=BASE.replace('-sem-recorte','-{cut.lower()}')+'-derived-v1'")
 if cut=='FAIXA':s=s.replace("BAND_RATIO=reference['bandUvPerHalf']/.51158377", "BAND_RATIO=.0645")
 if cut=='AXILA':
  at=s.index(' # Shared UV seams do not weld')
  s=s[:at]+''' # Reference axila insert occupies the upper side only. Clipping retains
 # native UVs in the lower triangles returned to their original body panel.
 from shorts_geometry import split_triangles
 for side in [-1,1]:
  kept=[]
  for mesh,tri in strips[side]:
   arr=np.array(tri);lo=float(data[mesh][:,1].min());hi=float(data[mesh][:,1].max());level=lo+(hi-lo)*.47
   upper,lower=split_triangles(arr,np.array([[0,1,2]]),lambda v:level-v[1])
   kept.extend((mesh,list(t)) for t in upper)
   output[mesh].extend(list(t) for t in lower)
  strips[side]=kept
'''+s[at:]
 s=s.replace("'Recorte lateral esquerdo','Recorte lateral direito'",repr('Recorte '+cut.lower()+' esquerdo')+','+repr('Recorte '+cut.lower()+' direito'))
 s=s.replace("cutType='LATERAL'",f"cutType='{cut}'")
 s=s.replace("meta['name'].replace('SEM RECORTE','COM RECORTE')",f"meta['name'].replace('SEM RECORTE','RECORTE {cut}')")
 s=s.replace("'maxPositionDisplacement':0.",f"'maxPositionDisplacement':0.,'construction':'{cut}', 'sourceSurfacePreserved':True")
 s=s.replace("'Recorte lateral'",repr('Recorte '+cut.lower()))
 s=s.replace('if len(sys.argv)>1:', 'if False:')
 exec(compile(s,str(BASE/'prime-create-sidecuts.py'),'exec'))
