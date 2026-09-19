# R9 addendum — finished textures for procedural creatures (the five crabs), 2026-09-19

Author: Claude (anthropic lane), the bounded addendum the approved plan reserved for R9
(`CODEX_REPAIR_PLAN.md` §2, queue R3 → R4 → R9). Format follows the plan's register rows. Status:
**proposed for Nick's approval; not an authorization.** Desktop only per decision D1 (phones receive
retained originals with painter-only fallback; no on-device inference). Path shorthand as in the plan:
G = `port/v2/apps/game/src/`, T = `port/v2/tools/`, D = `audits/ANATOMY_COMPLETION_20260917/`.

## Position in the queue
After R3 (pinch reachable, `contactJoint`) and R4 (frame refusal), and after the R1c decision on the
Mud/Vent contact repair if that decision changes any crab record — R9 rebinds against the records that
are current when it starts and hashes them. R9 changes pixels, never geometry: a finished crab must
produce the same contact, seam, root and fold numbers as its painter-master binding.

## What exists (verified in source)
- Painter masters: `D/crab-masks-05/<id>-master.png` (880×880 key-painted cut-outs) with
  `<id>-labels.png` ownership labels and `<id>-declaration.json`; `record.geometry.cutoutAssetHash`
  binds the master bytes; `record.source` points at the master.
- Build chain: `T/family-review/prepare-observed-crabs.mjs` → `buildAuthoredParts(record, master,
  declaration)` → `parts/atlas/<id>.png` → `buildPaintSkin` → `splitObservedSurfaces` (contact pins) →
  `binding.json` (`atlasSha256`, `parts`, `paintSkin`, `bindingHash`).
- Rig load: `loadCreatureRigV1(record, binding, cutoutBytes, cutoutAlpha, atlasBytes)`; the texture is the
  atlas, geometry comes from `binding.paintSkin` and `parts`.
- Accepted finisher: the landfall engine's one masked finisher at strength 0.35 (`KitEngineSettingsV4`
  in `G/landfall-conditioning.ts`; the stage-worker kit route; "one finisher at strength 0.35 protects
  organism-interior latent cells, leaving boundaries and ground editable" — `LOCAL_AI_GENERATION.md`).
- Retention: `G/ai-landfall-originals.ts` — `AiLandfallOriginalStoreV1 { retain, read, find }`, IndexedDB
  `cf-ai-landfall-originals-v1`, immutable originals keyed by the full admitted input.
- Kit rule: "Preserve the original key-painted master bytes" (`ART_KIT.md`). A finished crab is a **new
  retained original**, never an edit of the master.

## R9 — finished textures for procedural creatures; five crabs; desktop only

- **Files/functions:** new `T/painted-creature/finish-master.mjs` (runs the accepted finisher on a
  painter master with a creature mask; writes `<id>-finished.png` + receipt); new
  `T/painted-creature/finish-conservation.mjs` (the gate below; also exported for tests); `G/landfall-
  conditioning.ts` gains one creature-finish class block for the **same interpreter** (mask polarity:
  interior editable, alpha band and outside protected) — no second interpreter; new `G/creature-
  originals.ts` (`AiCreatureOriginalStoreV1`, sibling of the landfall store, IndexedDB
  `cf-ai-creature-originals-v1`, key = `recordRecipeHash` + `cutoutAssetHash` + finisher-settings hash
  + model hash); `T/family-review/prepare-observed-crabs.mjs` gains `--finished=<dir>` that substitutes
  the finished PNG **as texture source only**; tests beside each; evidence `D/crab-finish-01/`.
- **Contract:** input = the accepted painter master, hash-checked against `cutoutAssetHash`. Finisher =
  the accepted masked finisher, strength 0.35, the accepted steps, seed derived deterministically from
  `record.identity.seed` and `recipeHash` (no `Math.random`/`Date.now`). Output compositing is strict:
  `finished.alpha := master.alpha` byte-for-byte, and every pixel with `master.alpha == 0` is copied from
  the master (key stays exact). **Silhouette/alpha conservation gate:** zero differing alpha bytes;
  `labels.png` untouched; `buildAuthoredParts` + `buildPaintSkin` on the finished master must yield
  `parts` and `paintSkin` **byte-identical** to the painter build (only `atlasSha256` and `bindingHash`
  differ) — that is the proof that painter-stage ownership masks transfer unchanged. **Count
  preservation:** connected-component count per label equal before/after (structural, given alpha and
  labels fixed) **and** per-label-boundary mean gradient magnitude in the finished RGB ≥ the painter
  master's × a recorded ratio (the finisher may not paint a leg into the carapace — the Sept-10 count
  finding); per-part ΔE and SSIM are reported, not gated. **Rebind:** the rig loads the finished atlas;
  the native harness run on the finished binding must reproduce the painter binding's numeric rows
  exactly (contact error, painted-contact drift, seam `maxGapPx`, root drift, fold count, `restChanged
  = 0` against the finished PNG); p95 timings are reported, not equality-gated. **Retention:** `find()`
  before any inference; an existing original is served with zero inference passes; regeneration of an
  existing key is refused; the finished PNG and its receipt (inputs, settings, model hash, sha256) are
  the retained original; the painter master remains the fallback and is never overwritten. **Tier:**
  the finisher entry refuses on the phone tier (D1) and admits on desktop.
- **Controls (both directions, each named in the receipt):** identity — the painter master through
  the gate passes with zero deltas and reproduces `bindingHash`; alpha mutant — one changed alpha byte
  is refused; translate mutant — a 1 px shifted finished PNG fails the parts/paintSkin equality;
  boundary-blur mutant — RGB blurred across one leg/carapace label boundary fails the gradient ratio,
  and a finisher output that keeps boundaries passes; determinism — two runs on identical inputs are
  byte-identical, `seed+1` differs (proving the seed is live) and is discarded, not retained;
  retention — second call performs zero inference; a changed settings hash misses; phone UA refuses,
  desktop admits; rebind — finished-binding native rows equal painter-binding rows, and a deliberately
  mismatched atlas (wrong crab) is refused by `atlasSha256`.
- **Acceptance:** five finished crabs, each with conservation PASS, count-preservation PASS, rebind
  numeric-equality PASS, retention round trip PASS, 25/50/75 stills and a 10 s film on the finished
  binding; one review sheet per the 12-per-sheet rule: five crabs, painter beside finished at 1× and
  3× crops, first new image class → **Nick's review stop**. Numeric passes do not accept; Nick's eye does.
- **Must not touch:** accepted master bytes; `ART_KIT.md`/Motion Kit wording; per-species finisher
  settings or prompts; solver, clips, records, bindings' geometry; reserved `battle2/`, `effects/`,
  `soundkit/`, `worldlife/`; phone tier delivery (R8). No illustrator names anywhere in prompts.
- **Size:** ~250–400 lines across 4–6 code/test files, plus the evidence folder. Desktop Mac only.

## Open for Nick before R9 starts
1. Confirm the finisher model is the one already accepted for the engine painting (no new model).
2. Whether the review sheet should also show one crab in the accepted Earth-temperate arena plate at
   battle scale (recommended: yes — that is where the finish will be judged).
