# Octopus: original static evidence versus current source

Read-only comparison at current HEAD `7a6f45980eeb5c1c400a55be188cd16a0f3faf63` against original static HEAD `5a58994496f0ec0ac05ccc786d57094d98173942`. No test, build, browser, or qualification was run. Full hashes and exact reviewed diffs are in `source-delta.json`.

The original immutable fit passed 13 action rows plus presentation and exact rest. All five original hashed fit inputs still match: record, binding, atlas manifest, atlas image, and keyed image.

Of 50 original source owners, **46 are byte-identical, four changed, none are missing**:

| Changed owner | Relevance |
| --- | --- |
| `port/v2/tools/creature-animation/arap-skin.mjs` | Adds optional forward and active orientation WASM backends with existing JS fallback. Executed solver source changed. |
| `port/v2/tools/creature-animation/orientation-projector.mjs` | Dispatches those optional backends transactionally, falling back to the retained JS algorithms on failure. Executed source and performance path changed; existing constraints, iteration bounds, and refusal policy remain. |
| `port/v2/apps/game/src/motion/family-templates.ts` | Removes only unused `spine6`; no graph, limits, or actions changed. |
| `port/v2/apps/game/src/motion/body-card.ts` | Removes only unused `classifyRealm` import and unused `realmFromLabel`; active body-card compilation is unchanged. |

The changed solver owners import five additional runtime modules absent from the old receipt: `wasm-orientation-forward.mjs`, `orientation-forward-bytes.mjs`, `wasm-orientation-active.mjs`, `orientation-active-bytes.mjs`, and `orientation-active-reference.mjs`. Their current hashes are retained separately. This inspection does not assert a freshly bundled dependency inventory.

One current-source qualification of the unchanged fit has a concrete changed-source basis. Preserve the original PASS under its original hashes; do not relabel it as a current-source PASS. The dead-code removals alone would not justify repeating the battery, but the executed solver/backend changes distinguish a fresh qualification from an unchanged retry.

The original native attempt failed before filming because its selected home arena did not support either aquatic Octopus. That setup refusal is separate from the historical green static rows. Parent owns the current aquatic harness setup and any new qualification; this comparison makes no native, CPU, film, or acceptance claim.
