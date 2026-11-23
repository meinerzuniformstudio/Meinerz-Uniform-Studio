# PRIME / PRIME V — 16 November 2026

Added 64 combinations: 2 collars × normal/raglan × no cut/lateral/faixa/axila × shorts 2/4/5/lateral. Existing catalog IDs and artwork layouts remain unchanged.

- Four supplied CLO files were reduced to cloth only. All indexed cloth POSITION, NORMAL and TEXCOORD_0 values are byte-identical to the uploads; native node transforms are retained. See `scripts/prime-original-audit.json`.
- Derived seams interpolate original triangles, without moving original vertices. Surface partition area is checked within 1e-6. Axila and faixa are generated construction variants, not additional supplier originals.
- Maps retain separate paired-panel dimensions, calibrate each intrinsic chart, use one shared atlas scale, and have vector SVG/PDF and the existing 10.67 px bleed. No per-panel fit or pair stretching.
- Studio previews render the actual meshes in Blender Cycles. Only the preview's shorts image layer is translated to tuck the waist under the hem.
- New geometry, atlas, combination and transport tests pass. TypeScript checking passes.
- Four existing MAX/retired-EDGE fixture tests fail identically at the baseline commit; no new failures in that subset.
- Browser QA verified selection of PRIME V / raglan / axila / lateral shorts and all 19 editor panels. The cloud browser has no WebGL acceleration; live 3D interaction is not verified there.

Deployment: build, existing pruning/compression scripts, `prune-prime-preparation.mjs`, byte-plane packing, then `compress-mold-brotli.mjs`. Both codecs restore exact original bytes; no quantization or mesh decimation. `check-prime-deployment.mjs` exercises the production reconstruction path for all 128 model/source assets.

## Durable asset publication

The new binary models and vector maps exceed the main static-package allowance. They are stored in the Site's existing R2 bucket under `prime-assets-20261116`, preserving canonical same-origin paths. All 256 objects are allowlisted by size and SHA256. A temporary runtime secret authorizes the batch import; existing keys cannot be replaced by different content. The batch is marked READY only when every expected object has the expected checksum. PRIME choices stay hidden until READY. The temporary key is removed and the same saved version redeployed after import. Model and map bytes remain reproducible from source; no other Site or public audience is introduced.
