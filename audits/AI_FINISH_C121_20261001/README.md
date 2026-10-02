# AI finisher on C121 — 2026-10-01

Dakk (2026-10-01): "I want the AI runtime involved" — in the art work. This packet runs the existing local-AI
creature finisher (FLUX.2 Klein on WebGPU, `tools/local-image-generation`, D26 policy: alpha ≥ 250 interior,
4-pixel same-label erosion, conservation instrument unchanged) on the C121 creatures that pass native, then
rebinds each finished texture onto its unchanged rig and films it with the same battle script.

- `finish-batch.mjs` = the D26 Cougar runner generalized to a subjects list (`[{id, fit}]`). Engine, client,
  model pin, eligibility, conservation and the phone zero-model check are unchanged. Auto fits carry polygon
  declarations, not a label raster, so the label map is derived exactly as `fish-seams-fit.mjs` derives it
  (keyed intake → `cutAuthoredParts`) and kept under `prepared/`.
- `rebind-batch.mjs` = `painted-creature/rebind-finished.mjs` for a subjects list, with ONE deliberate change:
  it copies only finisher-changed pixels. Generated originals sit on an opaque flat background, and the auto
  keyer despills their part edges (919 pixels on the C118 Sugar Glider); copying every part pixel from the
  master would put those halos back. Finisher-changed pixels are all deep interior, so the edges keep the keyed colour.
- Geometry guards are unchanged: the binding parts/paint skin must be byte-identical before and after.

No admission, routing or phone publication. Visual acceptance stays with Dakk's end-of-pass review.
