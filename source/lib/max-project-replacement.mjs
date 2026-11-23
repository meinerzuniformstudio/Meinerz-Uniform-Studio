import {CURRENT_DEFAULT_MOLD_ID} from './removed-molds.mjs';
import {PRESENTATION_PACK_TEMPLATES} from './presentation-pack-templates.mjs';
import {SUPERSEDED_PRESENTATION_TEMPLATES} from './superseded-presentation-templates.mjs';
export const MAX_RESET='2026-11-13-max-replace-edge-project-art-v1';
const current=PRESENTATION_PACK_TEMPLATES.filter(e=>e.descriptor.refreshBatch==='max-2026-11-13');
export const MAX_REPLACEMENTS=Object.freeze(SUPERSEDED_PRESENTATION_TEMPLATES.flatMap(e=>{
 const d=e.descriptor;if(!['MAX','GOLA 27'].includes(d.collar))return [];
 const next=current.find(e=>e.descriptor.collar==='MAX'&&e.descriptor.modeling===d.modeling&&e.descriptor.sideCut===d.sideCut&&e.descriptor.bottomParts===(d.bottomParts||2));
 return next?[[d.id,next.descriptor.id]]:[];
}).concat(['kit-edge-2027-mapa-v3','kit-edge-2027-mapa-v3-proporcao-v1'].map(id=>[id,CURRENT_DEFAULT_MOLD_ID])));
const inflight=new WeakMap();
const completed=new WeakSet();
// Owner requested replacing existing MAX/EDGE projects and their old artwork.
// This is one atomic reset: concurrent/stale tabs cannot restore a prior map.
export function replaceMaxProjectArt(db){
 if(!db||completed.has(db))return Promise.resolve();if(inflight.has(db))return inflight.get(db);
 const pending=replace(db).then(()=>completed.add(db)).finally(()=>inflight.delete(db));inflight.set(db,pending);return pending;
}
async function replace(db){
 await db.prepare('CREATE TABLE IF NOT EXISTS atlas_mold_catalog_resets (id TEXT PRIMARY KEY,manifest_json TEXT,completed_at TEXT,removed_rows INTEGER NOT NULL DEFAULT 0,removed_objects INTEGER NOT NULL DEFAULT 0)').run();
 if((await db.prepare('SELECT completed_at FROM atlas_mold_catalog_resets WHERE id=?').bind(MAX_RESET).first())?.completed_at)return;
 const pairs=MAX_REPLACEMENTS,oldIds=pairs.map(([old])=>old),marks=oldIds.map(()=>'?').join(','),date=new Date().toISOString();
 const projectUpdate=db.prepare(`UPDATE projects SET template_id=CASE template_id ${pairs.map(()=>'WHEN ? THEN ?').join(' ')} END,map_key=NULL,map_name=NULL,thumbnail_key=NULL,share_token=NULL,reviewed_version=NULL,reviewed_at='',version=version+1,updated_at=? WHERE template_id IN (${marks})`).bind(...pairs.flat(),date,...oldIds);
 await db.batch([
  // Mark the project migration immediately after UPDATE so changes() records
  // its exact count; batch transaction rollback also rolls back this marker.
  projectUpdate,
  db.prepare('INSERT INTO atlas_mold_catalog_resets (id,completed_at,removed_rows) VALUES (?,?,changes()) ON CONFLICT(id) DO NOTHING').bind(MAX_RESET,date),
  db.prepare(`UPDATE proposals SET enabled=0,updated_at=? WHERE enabled=1 AND id IN (SELECT o.proposal_id FROM proposal_options o JOIN proposal_versions v ON v.id=o.version_id WHERE v.template_id IN (${marks}))`).bind(date,...oldIds),
 ]);
}
