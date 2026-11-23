"""Prepare owner PRIME originals: retain all cloth triangles, UVs and transforms.
Only strip avatar/material textures; never rescale, decimate or refit the garment.
"""
from pathlib import Path
import json
BASE=Path(__file__).resolve().parent
configs=[]
for modeling in ['NORMAL','RAGLAN']:
 for collar,title in [('PRIME','GOLA PRIME REDONDA'),('PRIME V','GOLA PRIME V')]:
  filename=f'{title} - {modeling}.glb'
  tail=(['Filete manga esquerda','Filete manga direita','Manga esquerda','Manga direita','Costas','Gola costas','Gola frente','Peitilho','Frente'] if modeling=='RAGLAN' else ['Filete manga esquerda','Filete manga direita','Gola costas','Gola frente']+(['Peitilho'] if collar=='PRIME V' else [])+['Manga esquerda','Manga direita','Frente' if collar=='PRIME V' else 'Costas','Costas' if collar=='PRIME V' else 'Frente'])
  configs.append([filename,f'{modeling.lower()}-{collar.lower().replace(" ","-")}-sem-recorte',modeling,collar,'SEM RECORTE','',tail])
s=(BASE/'prepare-replacement-uploads.py').read_text();a=s.index('configs=');b=s.index(' original=path.read_bytes()',a)
s=s[:a]+'''configs=json.loads(CONFIG_JSON)
for filename,slugpart,modeling,collar,cutType,variant,tail in configs:
 path=pathlib.Path(sys.argv[1])/filename
 cfg=dict(id='pack26-'+slugpart+'-prime-20261116',modeling=modeling,collar=collar,cutType=cutType,variant=variant)
 explicit=['Calção direito','Calção esquerdo','Cós esquerdo','Cós direito']+tail
'''+s[b:]
a=s.index("  pr=m['primitives'][0];xyz=");b=s.index('  kept.append(i);',a)
s=s[:a]+'''  label=explicit[len(kept)]
  kind='shorts' if label.startswith('Calção') else 'waist' if label.startswith('Cós') else 'body' if label in ['Frente','Costas'] else 'sleeve' if label.startswith('Manga') else 'filet' if label.startswith('Filete') else 'collar'
'''+s[b:]
a=s.index(' seen={}');b=s.index(" if any(e['id']==slug",a)
s=s[:a]+''' assert len(kept)==len(explicit),(path.name,len(kept),len(explicit))
 slug=cfg['id'];modeling=cfg['modeling'];collar=cfg['collar'];cut=False;variant=''
 title='KIT · '+modeling+' · '+collar+' · SEM RECORTE · CALÇÃO 2 PARTES'
'''+s[b:]
s=s.replace("meta.update(artBleedPixels=16,", "meta.update(cutType=cfg['cutType'],variantSource=path.name,geometryPolicy='original vertices, normals, UVs and node transforms unchanged; no decimation',artBleedPixels=16,")
s=s.replace("refreshBatch='2026-11-13'","refreshBatch='prime-2026-11-16'").replace('scripts/new-upload-manifest.json','scripts/prime-upload-manifest.json')
s=s.replace("(target/'preparation.json').write_text", "(target/'pair-audit.json').write_text(json.dumps({'pairs':[],'method':'native chart dimensions preserved without pair stretching'}));(target/'preparation.json').write_text")
s=s.replace('CONFIG_JSON',repr(json.dumps(configs,ensure_ascii=False)))
exec(compile(s,str(BASE/'prepare-prime-uploads.py'),'exec'))
