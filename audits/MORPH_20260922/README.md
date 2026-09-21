# The morph system on the stage — 2026-09-22 (steps 1–4, `MORPH_SYSTEM_DESIGN.md`)

| Evidence | What | Result |
|---|---|---|
| `crab-palette-sheet-01.png` (+ `.json`, `crab-palette-sheet.mjs`) | the crab archetype and 12 palette morphs from 12 seeds, remapped on the painter master by label role (base = body/legs, accent = claws/eyes) | for Nick's eye: finish preserved, only hue/chroma move; low-chroma names desaturate |
| `card-markings-sheet-01.png` (+ `.json`, `card-markings-sheet.mjs`) | the crab × the eight v1 patterns × three rows (own colour + turquoise accent; the same emissive; crimson base / golden accent) through the real card source | for Nick's eye: M3/M4 on the card |
| `crimson-vs-turquoise-01/` (`film-script-01.json`, log) | TWO individuals of the same crab archetype on the real battle stage in Edge — left `{seed 77, color crimson, accent turquoise, head 7}` (eye stalks ×1.18), right `{seed 12, color turquoise, accent magenta, head 0}` — through the real loader's morphed-atlas branch (exact JS PNG decode → remap → seam guard → buffer texture) | **DIAGNOSTIC_PASS**, pinch ×2, **0 / 0 refusals**, CPU p95 **1.80 ms** (no per-tick cost by construction: the remap runs once at load) |

| `striped-vs-eyespotted-lumin-01/` (`film-script-02-markings.json`) | M3/M4 first film — RETAINED AS A FINDING: the left crab `{color 12 (the archetype's own), accent turquoise, striped}` filmed fully teal because the fit record's `genome` block has no colour genes, so its own colour read as a morph | DIAGNOSTIC_PASS, 0 / 0, 1.60 ms — but the wrong picture |
| `striped-vs-eyespotted-lumin-02/` | same script after `archetypeGenomeV1` (own genes from `identity.speciesVisualKey`): orange crab with turquoise stripes vs golden crab with crimson emissive eye-spots — Codex's painted masks (`d8a1a8f9`) on the real stage | **DIAGNOSTIC_PASS**, **0 / 0**, **1.70 ms** |

Stills: `striped-vs-eyespotted-lumin-02/turn0-hit-approach-50.png` (markings on the stage), `crimson-vs-turquoise-01/turn0-hit-approach-50.png` (both individuals side by side, planted cadence approach).
Determinism: the individual is `morphParamsV1(genome, recipeHash)` — the same genome on the same archetype on every
device (golden fixture `port/v2/apps/game/src/morph/morph-params.golden.json`). The archetype's record, binding and
atlas bytes are untouched; an identity genome takes the archetype's own load path byte for byte.
