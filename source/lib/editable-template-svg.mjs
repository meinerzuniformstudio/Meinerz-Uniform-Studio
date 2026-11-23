// Native paths for vector editors: one outlined object per panel, without
// nested artwork groups or a second contour sitting over the drawing object.
export function editableTemplateSvg(svg) {
  // Corel preserves unsupported data-* attributes as SVG data attached to
  // protected objects. Export only standard SVG presentation attributes.
  svg=svg.replace(/\sdata-[\w:-]+="[^"]*"/g,'');
  const guidesStart=svg.indexOf('<g id="GUIAS_OCULTAR_ANTES_DE_EXPORTAR"');
  const art=guidesStart<0?svg:svg.slice(0,guidesStart);
  const guides=guidesStart<0?'':svg.slice(guidesStart);
  const contours=new Map();
  for (const tag of guides.match(/<path\b[^>]*\/>/g)||[]) {
    const d=tag.match(/\bd="([^"]*)"/)?.[1],stroke=tag.match(/\bstroke="([^"]*)"/)?.[1];
    if(d&&stroke) contours.set(d,stroke);
  }
  // These generated groups carry only IDs (no transform or inherited styling).
  const flat=art.replace(/<g id="[^"]*">|<\/g>/g,'').replace(/<path\b[^>]*id="PAINEL_\d+"[^>]*\/>/g,tag=>{
    if (/\bstroke=/.test(tag)) return tag;
    const d=tag.match(/\bd="([^"]*)"/)?.[1];
    return tag.replace('/>',` stroke="${contours.get(d)||'#454545'}" stroke-width="3"/>`);
  });
  // Bleed maps need a separate, removable trim contour. Removing every guide
  // path here erased that contour again whenever a download was converted.
  const panelIds=[...art.matchAll(/id="PAINEL_(\d+)"/g)].map(m=>m[1]);let legacyCut=0;
  const labels=guides.replace(/<path\b[^>]*\/>/g,tag=>{
    if(/\bid="(?:CORTE_PAINEL_\d+|GUIA_LOGO_[a-zA-Z0-9_-]+)"/.test(tag))return tag;
    if(svg.includes('ATLAS_ART_BLEED_16')&&/stroke="#a0a0a0"/.test(tag)&&legacyCut<panelIds.length)
      return tag.replace('<path',`<path id="CORTE_PAINEL_${panelIds[legacyCut++]}"`).replace('stroke="#a0a0a0"','stroke="#587181" stroke-dasharray="10 7"');
    return '';
  });
  return (flat+labels).replace(/\s(?:textLength|lengthAdjust)="[^"]*"/g,'');
}
