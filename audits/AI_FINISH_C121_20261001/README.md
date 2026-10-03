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

## Result (2026-10-01)
- `finish-01/`: 5/5 PASS (Finch, Sandpiper, Wasp, Ptarmigan, Vulture). Conservation PASS, 0 alpha / protected changes, 51k–153k
  RGB pixels changed, ~44 s per subject (Mac, one model construction), phone tier 0 model constructions.
- `rebound-01/`: 5/5 PASS, binding parts and paint skin byte-identical; every changed pixel landed inside the keyed creature.
- `native-01/`: 5/5 DIAGNOSTIC_PASS with each subject's own battle script; full-size late idle whole, no new fringe.
- `painter-vs-finished.jpg`: on these G2 originals the change is subtle (slightly smoother fur and feather), anatomy, pattern and
  colour unchanged. The finisher's larger value is likely the procedural painter's creatures; scope is Dakk's call.
