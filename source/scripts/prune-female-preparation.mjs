// Canonical raw sources remain in Git; the old test and production now share
// the same baked female models. Native SVG maps are generated from exact UVs.
import{rm}from'node:fs/promises';
for(const name of ['stein','elite','basico']){await rm('dist/client/teste-calcoes/'+name+'.bin',{force:true});await rm('dist/client/simulador/female/'+name+'-map.svg',{force:true});}
