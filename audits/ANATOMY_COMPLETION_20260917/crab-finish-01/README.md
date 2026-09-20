# R9 — finished textures for the five crabs, first evidence run (2026-09-19 night, anthropic lane)

Producer `8b901e6c` (signed; tooling commit), tree clean (`dirtyDiagnostic: false`), Edge over CDP on the
pinned local model (`cgb/flux2-klein-4b-onnx-webgpu` @ `3bffc0ef…`, served from the ignored cache by a loopback
mirror; no download, no network). **Status: PASS on every gate for all five crabs.** Quality is NOT accepted by
any gate here; the review sheet is for Nick's eye and Codex's review.

| Crab | alpha/key | gradient ratio | SSIM (luma) | work scale | editable cells | repainted px | time |
|---|---|---:|---:|---:|---:|---:|---:|
| crab | PASS | 0.928 | 0.994 | 3× | 242 / 2520 | 7,115 | 22.1 s |
| coconut-crab | PASS | 0.959 | 0.984 | 1× | 60 / 612 | 16,735 | 11.0 s |
| freshwater-crab | PASS | 0.955 | 0.996 | 2× | 184 / 1836 | 12,012 | 14.0 s |
| mud-crab | PASS | 0.938 | 0.996 | 2× | 183 / 1995 | 12,037 | 15.3 s |
| vent-crab | PASS | 0.997 | 0.997 | 2× | 99 / 1980 | 6,416 | 15.0 s |

Files: `<id>-finished.png` (the retained finished texture, painter-frame size), `<id>-finished.json` (receipt:
record hash, master hash, finished sha256, seed, settings, prompt sha, model, kit sha, head), `<id>-finished-raw.png`
(work-canvas finisher output before restoration), `<id>-composite.png` (what the VAE saw), `<id>-protection.png`
(white = editable interior on the work canvas), `<id>-conservation.json` (every gate + ΔE/SSIM per label),
`<id>-prompt.txt`, `recipes.json`, `result.json`, `review-sheet.png`, `rebind-equality.json`. The raw RGBA inputs were
not retained (3 MB each; their sha256 is in `result.json` and they are rebuilt from the painter masters by the tool).

## What the finisher may and may not do (as built, `port/v2/tools/painted-creature/finish-master.mjs`)
- The accepted masked finisher only: strength 0.35, one step, 512-token ceiling, same engine and sampler as the
  landfall (`tools/local-image-generation/kit-worker-engine.mjs#finishCreature`). Seed = record identity seed ⊕
  recipe-hash prefix. Prompt = the kit's frozen style paragraph + a subject line + accuracy + the fauna negatives
  (379–392 tokens).
- Work canvas: the silhouette is cropped (+32 px margin) and upscaled by an integer factor ≤ 4 so that one 16 px
  latent cell covers a few master pixels (a painter crab is ~250 px wide inside an 880 px frame). The result is
  box-filtered back to master pixels.
- Mask polarity (creature class): the **solid** interior (alpha ≥ 250, eroded 4 px) is editable; the alpha band,
  soft-alpha pixels (the shadow) and everything outside are protected. Only pixels inside that eroded interior take
  finisher colour; every other pixel and the whole alpha plane are the painter's byte for byte.
- Gates (`finish-conservation.mjs`): zero differing alpha bytes and zero changed transparent pixels; label component
  counts (structural); mean luminance step across label boundaries ≥ 0.6 × the painter's (measured 0.93–1.00);
  parts + paint skin rebuilt from the finished texture byte-identical to the painter build except `atlasSha256` /
  `bindingHash` (`rebind-equality.json`, five PASS; fits in `../crab-fits-finished-01/`, built with
  `prepare-observed-crabs.mjs --finished=`); the real rig loader admits each finished fit on its own atlas and
  refuses swapped atlases (`apps/game/src/battle2/finished-fit.test.ts`, 5 PASS).
- Retention: `apps/game/src/creature-originals.ts` (IndexedDB `cf-ai-creature-originals-v1`; one finish per exact
  input; regeneration refused; painter master never stored). Not yet wired into a game route.

## Diagnostics retained (`diagnostics/`)
- `scratch-01`: the full-size triptych reference pushed the denoiser to 9,109 tokens → ORT integer overflow. The
  reference is now optional and off by default (`--no-triptych`); the landfall's own reference stays as it was.
- `scratch-02`: native-scale run, no work canvas, no per-pixel restoration: only 38 of 3,025 cells editable and the
  VAE round trip softened every opaque pixel (SSIM 0.50, the shadow repainted). Green on the alpha gate and wrong;
  the sheet shows it. This is what motivated the work canvas, the solid-alpha rule and interior-only restoration.
- `scratch-03`: the corrected pipeline on `crab` alone (SSIM 0.994); identical to the evidence row above.

## Findings for Nick (decisions, not defects)
1. **At the accepted 0.35 × 1 step the finish is subtle.** The sheet shows slight plate texture and shading inside
   carapace and claws; the painter's flat look remains. The setting was accepted for the landfall's scene contact,
   not for creature finishing. A bounded strength/steps study on one crab (e.g. 0.35/1, 0.5/2, 0.65/4) would show
   the ceiling; it changes an accepted parameter, so it needs your word.
2. **coconut-crab got a 1× work canvas** (its crop is 536 px, so 2× would exceed the 1024 px `workCanvasMax`). Raising
   the setting to 1088 for that crab is a one-line rerun.
3. The Civet (Earth sentinel) is not in this run: its parts come from a polygon declaration, not painter labels, so
   the label-boundary gate needs its ownership map from the parts build. Same tool, one more subject table row.
4. The native rebind rows (contact error, drift, seams, rest) on Codex's harness are the other half of the rebind
   control and run at the R3 re-merge on the regenerated bindings.
