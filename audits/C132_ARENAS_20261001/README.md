# C132 painted arena candidates — 2026-10-02

Eight separately generated FAR/MID/NEAR compositions are retained for review. **Zero sets are accepted or registered.** Every selected original is 1672×941; `cf.arena-delivery/v1` requires native 2560×1440. The exact new validator rejects all eight master sets and all eight keyed runtime sets on that dimension requirement. The old technical intake passes are narrower and do not override this hold.

The packet is in `~/Projects/celestial-frontier-openai-mac/audits/C132_ARENAS_20261001`. The sibling routing contract was read in `~/Projects/celestial-frontier-anthropic-mac/audits/ARENA_ROUTING_20261001/README.md`; the merged validator is used directly. No registration, runtime wiring, native epoch, acceptance exemption, upscaling or certificate rebinding occurred.

| Candidate directory | Full-size composition findings |
| --- | --- |
| `freshwater-lake-v2` | Replacement NEAR has an irregular edge, but the bottom texture transition and small chroma remnants remain. |
| `coral` | Distinct reef water depth; pink/mauve edge content and repeated terrain contours need refinement. |
| `dunesea` | Selected FAR removes invented moons. Terrain contour seams and mauve boundary bands remain. |
| `tundra` | Selected MID corrects the rejected ultra-wide/text attempt. Coherent candidate, still requires independent scoring. |
| `jungle-v2` | Selected MID removes the chopped trunk. Bright side-foliage edge remnants remain; background detail may compete with combatants. |
| `savanna-v2` | Selected MID removes the baked distant mountains/chopped canopy. NEAR produces a strong horizontal texture boundary. |
| `marsh` | Clear wet silt runway. Duplicated gray reed/water shelf and reed edge remnants remain conspicuous. |
| `karst-cave` | Selected NEAR corrects an ultra-wide attempt. Coherent framing, with scattered magenta edge remnants needing repair. |

Each directory includes original source paintings, keyed copies, full-size composition, four-row layer sheet, generation receipts, old `cf.arena-intake/v1` manifest, and an additional `delivery.pending.json` in the exact `cf.arena-delivery/v1` shape. The latter points to `arena-delivery-recipe.json` and an explicitly false `acceptance.pending.json`. The derived recipe adds the required layer labels without rewriting the previously delivered recipe/intake bytes. `delivery-review.json` records the complete exact-validator failures and full-size findings. It is not approval.

`delivery-summary.json` binds the validator and all generation receipts. The source paintings are byte-for-byte copies of built-in imagegen outputs; failed alternatives remain in their original/versioned directories. The original `freshwater-lake`, `jungle` and `savanna` compositions are superseded candidates, retained for their visible failure cases. Wrong-aspect attempts, invented fish/moons and pseudo-text failures also remain. Runtime key/despill operations act on copies only; the existing terrain keyer and one existing RGB-only edge correction preserve the source and alpha. A zero unresolved-edge count visibly coexists with bad seams, so the packet never equates that metric to visual acceptance.

`compile.mjs` prepared 135 prompts: all 43 canonical biome profiles plus freshwater-lake and karst-cave habitat variants. Canonical palette/weather/hazard/fauna/flora come from the game profile table. Named stage materials and depth are explicit authored interpretations; no live planet snapshot or star binding is fabricated. All three roles use the locked Living Worlds triptych. Frozen kit reference, style, accuracy, layout, technical and negative sections remain intact. `inventory.json` preserves the original compiler snapshot; `inventory-current.json` contains current prompt hashes. `prompt-amendments.json` verifies 20 SUBJECT-only refinements against preserved originals, including repair prompts.

Generation of further families is held because the built-in tool returned non-admissible dimensions despite the exact kit request. Prepared canonical priority after the first eight is archipelago, mangrove, pack ice, canyon and boulder, following Claude's routing coverage. A future generation route must demonstrate native 2560×1440 before mass production. Every candidate still needs visual repair/scoring, Dakk acceptance, route review and native battle proof.

The generation/compiler/intake/finalization scripts are append-only authoring helpers: they refuse to overwrite existing outputs. `finalize.mjs` was executed once; its checked result is in the delivery summary. Re-running it in this frozen directory intentionally refuses the first existing output. Parent owns the signed batch, mailbox record and required repository checks.
