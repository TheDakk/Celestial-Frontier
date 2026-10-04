# C173 equid authoring — HELD, no admission

The first coherent source-specific authorings for Wild Pony, Horse and Wild Ass are retained here. They preserve every original painting byte, exact keyed RGBA, ground line, non-ear landmark and anatomical owner identity. Four ear landmarks and 24 existing ear/head/neck/chest/limb contours per source were reviewed against the immutable 1254-square paintings. No runtime, motion, skin, threshold or reference-pool source changed.

**None of these three candidates is ready for native admission or a reference pool.** Each still fails the unchanged D28 5% remainder-island rule, and full-size moving-paint review finds visible defects. The evidence deliberately retains the original fits, the single candidate per source and the first audit-instrument refusal. There was no candidate retry or automatic remainder placement.

| Source | Original first refused remainder island | Candidate first refused remainder island | Full-size result |
| --- | --- | --- | --- |
| Wild Pony | 1,593 pixels, 5.1% | 1,857 pixels, 11.5% | The two traced ear flecks, large dorsal mane opening and many lower-limb fragments are corrected in the software held-faint comparison. The under-jaw opening, extreme folded front leg and fixed-root body hole remain. |
| Horse | 3,634 pixels, 7.5% | 2,072 pixels, 7.7% | The long detached mane strip is largely rejoined and some lower-leg fragments disappear. Crown fragments, broken tail and severe crossed/warped legs remain. A new visible shoulder cut appears in initial idle. |
| Wild Ass | 2,660 pixels, 8.1% | 1,595 pixels, 8.3% | The large detached crest and lower-leg slivers disappear. Tail separation remains. The candidate introduces a visible lower-neck band and shoulder slit in held faint. |

Percentages use each fit's own remainder paint count. Smaller absolute fragments can be a larger share after correct paint has moved to anatomical owners. The cap was not raised, rebound or bypassed, and its automatic placement was not applied.

## Source corrections and limits

`authoring-plan.mjs`, each `authoring-delta.json` and `inputs.json` bind the complete source review. Horse's old near-ear anchor lay on the mane; Wild Ass's old tips stopped below the painted ears; Pony's old near-ear anchor lay to the right of the visible pinna. The new near-ear contour owns both prior source-attributed Pony pixels `[871,353]` and `[882,341]` as `earNearTip`, continuously with the painted pinna. This is a measured local correction, not whole-fit acceptance.

The exact fixed-root polygon was moved first in Horse/Ass priority order so the broadened chest cannot consume its interior anchor. Every other original part order remains unchanged. The prior tail polygons themselves were retained, but expanded limb contours change 3,438 prior tail-owned pixels for Pony, 206 for Horse and 1,947 for Ass. Some old tail masks extend into the rump. All owner-to-owner transitions are recorded, and these interactions remain an explicit review hold; unchanged polygon bytes do not imply unchanged ownership pixels.

The remaining original non-ear landmarks, including existing near/far limb associations, were preserved. This bounded attempt does not establish that those old associations are anatomically sufficient: Horse's severe folded/crossed-leg appearance is an explicit counterexample. There is no claim that paint deletion, a larger repair cap or a new painting is necessary; the remaining source ownership/landmark and seam causes have not all been resolved.

## Evidence

- Three first-pass authored intakes compiled. `harness-derivation.json` changes only successor provenance from the established audit harness: it truthfully records reused non-ear landmarks. Computational intake checks are unchanged.
- `conservation-v2.json` proves exact source/keyed RGBA, deterministic independent priority replay matching compiled labels, exact non-ear landmarks and ground, and unchanged owner inventory. It records all old/new semantic-owner counts. Theft outside the recorded contour scope, source-paint deletion and a synthetic island over 5% are reproduced negative controls.
- `conservation.json` retains the first instrument refusal: three Horse boundary pixels differed because its scope predicate used raw coordinates while raster replay used normalized coordinates. `conservation-instrument-correction.json` and the separate `conservation-v2.mjs` use the exact normalized convention, without an epsilon, scope expansion or candidate change.
- `static-terminal.json` and the three `static.json` files contain 57 action rows plus three full presentations, all passing the established static checks and exact source-pixel rest reconstruction.
- `comparison.json` records 1,488 original/candidate dense published samples, both facings, with zero publication refusals; 36 loaded `CreatureRigV1` comparisons are byte-identical to the runtime-equivalent contact/compiled-skin/ARAP/rigid-parent publication. Source pins remain unchanged through the comparison.
- `visual-review.json` records inspection of all 12 full-size held-faint images, six initial-idle images and three candidate ownership maps. The original negative comparisons remain alongside each candidate.

The raster images are 1254-square software diagnostics with nearest texture sampling and the unchanged opaque-seam sampling guard. They are not GPU/native captures, screen-pixel measurements, performance results or quality admission. Any plotted source positions are normalized coordinates of the original painting; multiplying by 1254 produces **posed source-coordinate pixels**, not native-film pixels. No native/browser job was launched.

All files are local audit evidence. Root owns signing, mailbox delivery and any later scheduling. Product sources and the frozen C172 shared head-faint fix are untouched by this packet.
