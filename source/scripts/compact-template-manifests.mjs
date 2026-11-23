import{readFile,writeFile}from'node:fs/promises';
// Paths point to immutable static SVGs; inlining every chart duplicates tens of
// megabytes in the Worker. The EDGE fixture also supports the native bridge.
for(const [file,key] of [['presentation-pack-templates','PRESENTATION_PACK_TEMPLATES'],['short-reference-templates','SHORT_REFERENCE_TEMPLATES'],['superseded-presentation-templates','SUPERSEDED_PRESENTATION_TEMPLATES'],['reviewed-retained-templates','REVIEWED_RETAINED_TEMPLATES']]){
 const module=await import('../lib/'+file+'.mjs');const entries=structuredClone(module[key]);for(const e of entries)if(!e.descriptor.id.startsWith('kit-edge-2027-mapa-v3'))delete e.templateSvg;
 await writeFile('lib/'+file+'.mjs',`// Immutable Atlas drawing maps. SVGs are served from their canonical assets.\nexport const ${key}=Object.freeze(${JSON.stringify(entries)});\n`);
}
