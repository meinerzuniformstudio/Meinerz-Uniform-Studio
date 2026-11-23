import {SHORT_REFERENCE_TEMPLATES} from './short-reference-templates.mjs';
import {PRESENTATION_PACK_TEMPLATES} from './presentation-pack-templates.mjs';
// Reviewed catalog; older atlases remain in superseded-presentation-templates.
export const INSTALLED_TEMPLATES=Object.freeze([...PRESENTATION_PACK_TEMPLATES,...SHORT_REFERENCE_TEMPLATES]);
