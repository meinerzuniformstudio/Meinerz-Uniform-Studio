"""Measure the intrinsic UV metric from triangle edge lengths, never screen bounds.
The chart-to-surface differential includes folded fabric without using its 3D
bounding box. Area weighting suppresses tiny/sliver triangles. Source stays intact.
"""
import json,sys
from pathlib import Path
import numpy as np
from shorts_geometry import Glb
ROOT=Path(__file__).resolve().parents[1]
def measure(entries):
 out={}
 for e in entries:
  d=e['descriptor'];g=Glb(ROOT/'public'/e['assets']['source'].lstrip('/'));panels=[]
  for p in d['panels']:
   pr=g.j['meshes'][p['mesh']]['primitives'][p['primitive']];xyz=g.acc(pr['attributes']['POSITION']).astype(float);uv=g.acc(pr['attributes']['TEXCOORD_0']).astype(float);ix=g.acc(pr['indices']).reshape(-1,3)
   u=uv[ix];x=xyz[ix];du=np.stack([u[:,1]-u[:,0],u[:,2]-u[:,0]],2);dp=np.stack([x[:,1]-x[:,0],x[:,2]-x[:,0]],2);det=np.linalg.det(du);good=abs(det)>max(1e-15,np.median(abs(det))*1e-5)
   J=dp[good]@np.linalg.inv(du[good]);G=np.einsum('tki,tkj->tij',J,J);avg=np.average(G,axis=0,weights=abs(det[good]));val,vec=np.linalg.eigh(avg)
   if min(val)<=0:raise ValueError('Non-positive chart metric: '+d['id'])
   S=(vec*np.sqrt(val))@vec.T;physical=uv@S;panels.append(dict(number=p['number'],matrix=S.tolist(),metric=avg.tolist(),physicalBounds=[*physical.min(0),*physical.max(0)],axisRatio=float(np.sqrt(max(np.diag(avg))/min(np.diag(avg))))))
  out[d['id']]=panels
 return out
if __name__=='__main__':json.dump(measure(json.load(sys.stdin)),sys.stdout,separators=(',',':'))
