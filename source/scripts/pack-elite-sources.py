"""Lossless source reconstruction from each baked model; no geometry simplification."""
import json
from pathlib import Path
from model_delta import encode_delta
ROOT=Path(__file__).resolve().parents[1]
for e in json.loads((ROOT/'work/elite-transport-jobs.json').read_text()):
 p=ROOT/'public/assets/molds'/e['descriptor']['id'];packed,_=encode_delta((p/'model.glb').read_bytes(),(p/'source.glb').read_bytes(),e['assets']['model']);(p/'source.delta.gz').write_bytes(packed);print(p.name,len(packed),flush=True)
