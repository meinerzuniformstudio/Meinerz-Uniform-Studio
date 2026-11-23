"""Owner-supplied Elite/V batch. Explicit panel labels; never move a 3D vertex."""
from pathlib import Path
import json
BASE=Path(__file__).resolve().parent
configs=[
 ('GOLA ELITE -  SEM RECORTE - NORMAL.glb','normal-elite-sem-recorte','NORMAL','ELITE','SEM RECORTE','', ['Manga direita','Manga esquerda','Filete manga direita','Filete manga esquerda','Gola frente direita','Gola frente esquerda','Frente','Costas']),
 ('KIT ELITE- NORMAL - RECORTE FAIXA - CALÇÃO BASICO.glb','normal-elite-faixa','NORMAL','ELITE','FAIXA','',['Manga direita','Manga esquerda','Filete manga direita','Filete manga esquerda','Gola frente direita','Gola frente esquerda','Costas','Frente','Recorte faixa esquerdo','Recorte faixa direito']),
 ('KIT ELITE RAGLAN- SEM RECORTES - CALÇÃO BASICO(1).glb','raglan-elite-sem-recorte','RAGLAN','ELITE','SEM RECORTE','',['Gola frente esquerda','Gola frente direita','Filete manga esquerda','Filete manga direita','Manga direita','Manga esquerda','Costas','Frente']),
 ('KIT ELITE RAGLAN- RECORTE FAIXA - CALÇÃO BASICO.glb','raglan-elite-faixa-01','RAGLAN','ELITE','FAIXA','VERSÃO 01',['Gola frente esquerda','Gola frente direita','Filete manga esquerda','Filete manga direita','Manga direita','Manga esquerda','Frente','Costas','Recorte faixa esquerdo','Recorte faixa direito']),
 ('KIT ELITE- ARREDONDADO FAIXA - CALÇÃO BASICO(1).glb','raglan-elite-faixa-02','RAGLAN','ELITE','FAIXA','VERSÃO 02',['Gola frente esquerda','Gola frente direita','Filete manga esquerda','Filete manga direita','Manga direita','Manga esquerda','Frente','Costas','Recorte faixa esquerdo','Recorte faixa direito']),
 ('KIT ELITE RECORTE ARREDONDADO CALÇÃO BASICO.glb','raglan-elite-axila-01','RAGLAN','ELITE','AXILA','VERSÃO 01',['Gola frente esquerda','Gola frente direita','Frente','Recorte axila esquerdo','Recorte axila direito','Filete manga esquerda','Filete manga direita','Costas','Manga direita','Manga esquerda']),
 ('KIT ELITE- ARREDONDADO - CALÇÃO BASICO(1).glb','raglan-elite-axila-02','RAGLAN','ELITE','AXILA','VERSÃO 02',['Gola frente esquerda','Gola frente direita','Frente','Recorte axila esquerdo','Recorte axila direito','Filete manga esquerda','Filete manga direita','Costas','Manga direita','Manga esquerda']),
 ('KIT GOLA V  NORMAL.glb','normal-v-sem-recorte','NORMAL','V','SEM RECORTE','',['Filete manga direita','Filete manga esquerda','Gola inteira','Manga direita','Manga esquerda','Costas','Frente']),
 ('KIT GOLA V TRASPASSADA NORMAL.glb','normal-v-traspassada-sem-recorte','NORMAL','V TRASPASSADA','SEM RECORTE','',['Filete manga direita','Filete manga esquerda','Manga direita','Manga esquerda','Costas','Frente','Gola inteira']),
]
# Reuse the established compact GLB encoder and node-preserving preparation.
s=(BASE/'prepare-replacement-uploads.py').read_text()
a=s.index('configs=');b=s.index(' original=path.read_bytes()',a)
s=s[:a]+'''configs=json.loads(CONFIG_JSON)
for filename,slugpart,modeling,collar,cutType,variant,tail in configs:
 path=pathlib.Path(sys.argv[1])/filename
 cfg=dict(id='pack26-'+slugpart+'-elitebatch-20261113',modeling=modeling,collar=collar,cutType=cutType,variant=variant)
 explicit=['Calção direito','Calção esquerdo','Cós esquerdo','Cós direito']+tail
'''+s[b:]
a=s.index("  pr=m['primitives'][0];xyz=");b=s.index('  kept.append(i);',a)
s=s[:a]+'''  label=explicit[len(kept)]
  kind='shorts' if label.startswith('Calção') else 'waist' if label.startswith('Cós') else 'body' if label in ['Frente','Costas'] else 'side-cut' if label.startswith('Recorte') else 'sleeve' if label.startswith('Manga') else 'filet' if label.startswith('Filete') else 'collar'
'''+s[b:]
a=s.index(' seen={}');b=s.index(" if any(e['id']==slug",a)
s=s[:a]+''' assert len(kept)==len(explicit),(path.name,len(kept),len(explicit))
 slug=cfg['id'];modeling=cfg['modeling'];collar=cfg['collar'];cut=cfg['cutType']!='SEM RECORTE';variant=cfg['variant']
 title='KIT · '+modeling+' · '+collar+' · '+('RECORTE '+cfg['cutType'] if cut else 'SEM RECORTE')+(' · '+variant if variant else '')+' · CALÇÃO 2 PARTES'
'''+s[b:]
s=s.replace("meta.update(artBleedPixels=16,", "meta.update(cutType=cfg['cutType'],variant=variant,variantSource=path.name,artBleedPixels=16,")
s=s.replace("refreshBatch='2026-11-13'","refreshBatch='elite-2026-11-13'")
s=s.replace("scripts/new-upload-manifest.json","scripts/elite-upload-manifest.json")
s=s.replace('CONFIG_JSON',repr(json.dumps(configs,ensure_ascii=False)))
exec(compile(s,str(BASE/'prepare-elite-uploads.py'),'exec'))
