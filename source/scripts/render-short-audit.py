from shorts_geometry import *
import matplotlib;matplotlib.use('Agg');import matplotlib.pyplot as plt
from matplotlib.collections import PolyCollection
fig,axes=plt.subplots(2,2,figsize=(10,10));colors=['#4788ae','#d1984d','#4788ae','#d1984d','#70a37b','#b86b73','#70a37b','#b86b73','#a27cb8']
for row,parts in enumerate([4,5]):
 s=Glb(ROOT/f'public/assets/molds/pack26-normal-redonda-sem-recorte-paired-v1-shorts{parts}-v1/source.glb');triangles=[]
 for m in range(parts+4):
  a,i=s.data(m);ts=a[i][:,:,:3];triangles.extend((t,m) for t in ts)
 for col,(side,sign) in enumerate([('frente',1),('costas',-1)]):
  ax=axes[row,col];ordered=sorted(triangles,key=lambda tm:float(tm[0][:,2].mean())*sign);verts=[t[:,[0,1]]*np.array([sign,1]) for t,m in ordered];face=[colors[m] for t,m in ordered];ax.add_collection(PolyCollection(verts,facecolors=face,edgecolors='none'));ax.set_xlim(-.085,.085);ax.set_ylim(.19,.385);ax.set_aspect('equal');ax.axis('off');ax.set_title(f'{parts} partes · {side}')
fig.tight_layout();fig.savefig('/tmp/shorts-surface-audit.png',dpi=150)
