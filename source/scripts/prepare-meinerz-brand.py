from pathlib import Path
import xml.etree.ElementTree as E
s=E.parse('/workspace/scratch/83dd29f7e6d0/upload/MEINERZ UNIFORM STUDIO.svg').getroot();ns={'s':'http://www.w3.org/2000/svg'};glyphs={g.get('unicode'):g for g in s.findall('.//s:glyph',ns)};paths=s.findall('.//s:g[@id="_2646921331248"]/s:path',ns);body=''.join('<path d="'+p.get('d')+'"/>' for p in paths);text='';x=771
for char in 'UNIFORM STUDIO':
 g=glyphs.get(char)
 if g is not None:
  if g.get('d'):text+='<path transform="translate('+str(x)+' 1041.13) scale(.3521 -.3521)" d="'+g.get('d')+'"/>'
  x+=float(g.get('horiz-adv-x','729'))*.3521
 else:x+=220*.3521
for name,color in [('dark','#111111'),('light','#ffffff')]:
 svg='<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="297" viewBox="0 0 4253.7 1052.36" fill="'+color+'">'+body+text+'</svg>'
 Path('public/assets/meinerz/studio-'+name+'.svg').write_text(svg)
Path('public/assets/meinerz/meinerz.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="175" viewBox="0 0 4253.7 620" fill="#111111">'+body+'</svg>')
# Preserve internal compatibility keys, storage IDs and document numbers.
for root in ['app','public','lib']:
 for p in Path(root).rglob('*'):
  if not p.is_file() or p.suffix not in ['.js','.mjs','.tsx','.ts','.html','.css']:continue
  s=p.read_text();s=s.replace('ATLAS UNIFORM STUDIO','MEINERZ UNIFORM STUDIO').replace('ATLAS Uniform Studio','Meinerz Uniform Studio').replace('Atlas Uniform Studio','Meinerz Uniform Studio')
  s=s.replace('/assets/atlas/atlas-logo-light.svg','/assets/meinerz/studio-light.svg?v=20261113').replace('/assets/atlas/atlas-logo-dark.svg','/assets/meinerz/studio-dark.svg?v=20261113').replace('/assets/atlas/atlas-logo-print.png','/assets/meinerz/meinerz-print.png')
  # Public prose only; camelCase code and persisted identifiers are unchanged.
  s=s.replace('AO ATLAS','AO MEINERZ UNIFORM STUDIO').replace('pela ATLAS','pela MEINERZ').replace('da ATLAS','da MEINERZ').replace('logo Atlas','logo Meinerz').replace('Simulador ATLAS','Simulador Meinerz').replace('PEDIDO — ATLAS','PEDIDO — MEINERZ').replace('— ATLAS','— MEINERZ').replace("'ATLAS · Pedido", "'MEINERZ · Pedido")
  p.write_text(s)
p=Path('public/atlas-brand.css');p.write_text(p.read_text().replace('aspect-ratio:3.55','aspect-ratio:4.04'))
p=Path('public/production-sheet.js');s=p.read_text().replace("d.rect(16,14,258,38,C.ink,'none',1.5)","d.rect(16,14,258,38,C.white,'none',1.5)").replace("d.text('ATLAS',37,43,27,C.white,true)","d.text('MEINERZ',37,43,27,C.ink,true)");p.write_text(s)
