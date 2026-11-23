import {simulatorKit} from '../public/simulador/kit-catalog.js';

export function shirtDescriptor(base) {
  const kit = simulatorKit(base.id);
  if (!kit || base.bottomParts !== 2 || base.category !== 'conjunto') return null;
  const lower = new Set(kit.panels.filter(p => p.piece === 'shorts').map(p => `m${p.mesh}p${p.primitive || 0}`));
  const panels = base.panels.filter(p => !lower.has(`m${p.mesh}p${p.primitive}`));
  const numbers = new Set(panels.map(p => p.number));
  const name = base.name.replace(/^KIT\b/i,'CAMISETA').replace(/\s*·\s*CALÇÃO.*$/i,'');
  return {...base, id:base.id+'-camiseta', baseTemplateId:base.id, name, category:'camiseta',
    garments:['Camiseta'], bottomParts:undefined, bottomVariant:undefined, thumbnailUrl:undefined,
    panelCount:panels.length, panels, primitives:base.primitives.filter(p => !lower.has(p.key)),
    excludedPrimitiveKeys:[...lower], logoGuides:base.logoGuides?.filter(g => numbers.has(g.panel)),
    catalogPath:[name], layoutGroups:[{id:'CAMISETA', title:'CAMISETA', panels:[...numbers], heading:{x:76,y:325}}]};
}

// Keep the registered UV positions and the original bleed and trim curves.
export function shirtDrawing(source, descriptor) {
  const keep = new Set(descriptor.panels.map(p => p.number));
  const artwork = [], trim = [];
  for (const [tag, prefix, number] of source.matchAll(/<path\b[^>]*?\bid="(PAINEL_|CORTE_PAINEL_)(\d+)"[^>]*\/>/g)) {
    if (keep.has(Number(number))) (prefix === 'PAINEL_' ? artwork : trim).push(tag);
  }
  if (artwork.length !== keep.size) throw Error('Mapa da camiseta incompleto.');
  const escape = value => String(value).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const label = (x,y,value,size) => `<text x="${x}" y="${y}" font-family="Arial,sans-serif" font-size="${size}">${escape(value)}</text>`;
  const labels = descriptor.panels.map(p=>label(p.rect.x,p.rect.y-16,p.displayName,20));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="4096" height="4096" viewBox="0 0 4096 4096"><title>${escape(descriptor.name)}</title><rect width="4096" height="4096" fill="#ffffff"/>${artwork.join('')}<g id="GUIAS_OCULTAR_ANTES_DE_EXPORTAR">${label(76,90,descriptor.name,32)}${label(76,145,'Oculte as guias antes de exportar a página inteira.',23)}${trim.join('')}${labels.join('')}</g></svg>`;
}
