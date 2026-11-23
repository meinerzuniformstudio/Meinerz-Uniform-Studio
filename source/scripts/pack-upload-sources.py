from pathlib import Path
import json
from model_delta import encode_delta
ROOT=Path(__file__).resolve().parents[1]
entries=json.loads((ROOT/'work/refresh-transport-jobs.json').read_text())
for e in entries:
 d=e['descriptor'];folder=ROOT/'public/assets/molds'/d['id'];source=(folder/'source.glb').read_bytes();model=(folder/'model.glb').read_bytes();packed,_=encode_delta(model,source,'/assets/molds/'+d['id']+'/model.glb');(folder/'source.delta.gz').write_bytes(packed);print(d['id'],len(source),len(packed),flush=True)
