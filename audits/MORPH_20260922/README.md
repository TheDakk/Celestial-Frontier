# The morph system on the stage — 2026-09-22 (steps 1–4, `MORPH_SYSTEM_DESIGN.md`)

| Evidence | What | Result |
|---|---|---|
| `crab-palette-sheet-01.png` (+ `.json`, `crab-palette-sheet.mjs`) | the crab archetype and 12 palette morphs from 12 seeds, remapped on the painter master by label role (base = body/legs, accent = claws/eyes) | for Nick's eye: finish preserved, only hue/chroma move; low-chroma names desaturate |
| `crimson-vs-turquoise-01/` (`film-script-01.json`, log) | TWO individuals of the same crab archetype on the real battle stage in Edge — left `{seed 77, color crimson, accent turquoise, head 7}` (eye stalks ×1.18), right `{seed 12, color turquoise, accent magenta, head 0}` — through the real loader's morphed-atlas branch (exact JS PNG decode → remap → seam guard → buffer texture) | **DIAGNOSTIC_PASS**, pinch ×2, **0 / 0 refusals**, CPU p95 **1.80 ms** (no per-tick cost by construction: the remap runs once at load) |

Stills: `crimson-vs-turquoise-01/turn0-hit-approach-50.png` (both individuals side by side, planted cadence approach).
Determinism: the individual is `morphParamsV1(genome, recipeHash)` — the same genome on the same archetype on every
device (golden fixture `port/v2/apps/game/src/morph/morph-params.golden.json`). The archetype's record, binding and
atlas bytes are untouched; an identity genome takes the archetype's own load path byte for byte.
