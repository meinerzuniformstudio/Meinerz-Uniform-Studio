# Female uniforms — 17 November 2026

The simulator asks for masculine or feminine before a new drawing. Feminine
kits reuse the selected existing shirt and exactly one supplier lower garment:
STEIN (CAL-F01), straight/basic two-part (CAL-F02), or ELITE (CAL-F03).

Only three lower meshes are stored. `femaleKitId` deterministically identifies
the shirt and lower model without generating every combination. The composer
copies every POSITION, NORMAL, native UV and index value. It repacks atlas UV0
at a common physical scale; individual panels retain their aspect ratios.
Preparation sources are the three supplied GLBs, retained in the user's files,
and the geometry-only GLBs in `public/teste-calcoes/*.bin`. Run
`scripts/prepare-female-shorts.mjs` to reproduce the baked lower models.
Byte-plane packing and gzip restore exact bytes and verify SHA-256.

Each garment rotates around its own centre. Four-view exports and the video
keep the shirt at the left and shorts at the right. Female production images
use a transparent 2×2 grid; separate-piece presentations are also supported.
Native presentation descriptors and exact SVG/PDF maps are resolved on demand.

A female piece in an order requires a reviewed native female presentation.
The lower model must agree with the technical CAL-F mold. Manual uploads do
not satisfy this requirement. Drafts remain editable. Review/release rejects
missing/wrong references; the server additionally verifies owner, current
reviewed version, template, and exact original PNG bytes. Changing the mold,
replacing the image, or editing the presentation requires relinking it.
Mixed masculine/feminine orders are supported per product.

Validation: 33 targeted tests covering model composition, all 216 current shirt
bases × 3 female lower models, editable states, standalone pieces, four-view
restoration, native project/order creation, wrong-model/stale/foreign proof,
PNG replacement, existing exports and lists, including loading the composed GLBs through the actual Three.js loader. TypeScript checking and build
pass. Browser QA covers required selection, female editor panels and the order
proof prompt. Accelerated WebGL QA is unavailable in the cloud browser.

Two pre-existing fixture assertions in older suites assume 152 kits and the
retired non-compact default MAX ID; the current baseline already has 216 kits
and the compact MAX default. Those fixtures were not changed for this feature.

Publication: use the existing lossless packaging sequence, adding
`prune-female-preparation.mjs` before drawing compression. Old test-only raw
models and offline SVG copies stay in Git; published views share the canonical
female assets. Keep the current Site, access audience, database and R2 bindings.
