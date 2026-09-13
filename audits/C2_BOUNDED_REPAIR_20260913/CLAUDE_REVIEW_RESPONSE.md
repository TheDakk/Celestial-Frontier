# C2 bounded repair (pack 7) — review response (Claude, read-only)

Date: 2026-09-13. Reviewed from `cf-c2-pack7-repair-review.zip` (source 1873abe0): `RESULT.json`, `native-gates-01/report.json`, the rest and 7400 ms renders (old, repaired, red overlay), `candidate-01` declarations, records and receipts, `initial-patch-refusal.json`, the rig, contact, joint-patch and gate sources. The candidate fox record was compiled through the actual `compileBodyCard` in this worktree. Both 7400 ms renders and the rest render were measured with a new read-only tool, `port/v2/tools/motion-proof/seam-oracle.mjs` (Claude lane, committed with this response; its records are beside this file). Nick owns final acceptance. No repair here.

## 1. Implementation of the two corrections: CONFIRMED as specified

Head patch radius 0.045 and a new `neck` patch 0.040 bound to the neck's parent pivot (the chest landmark), both sampling the same retained fur centre [0.35, 0.49]; one 33-part atlas; masks, clips, pivots and the rig unchanged. The square-crop key guard refused 253 corner magenta pixels outside the disc, the refusal is retained, and the corrected guard checks retained ink after disc and coverage masking with the retained-magenta control still refusing: that is the right guard. Rest: 0 changed RGBA channels. The renderer measured the exact GSAP 7400 ms pose at 1254 square for both declarations; the old declaration control is present (24,473 versus 24,370). All as requested.

## 2. Why the patches added 103 pixels and the throat seam stays

The patch is a disc centred on the **pivot** (the neck landmark for `head`, the chest landmark for `neck`). The seam opens along the **ownership cut** between the two parts, and that cut is not at the pivot: it runs across the throat and up over the crown, 40 to 110 px from the landmark. A 56 px disc at the pivot reaches the middle of the cut and none of its ends, so the wedge that opens at the ends (throat, and the crown behind the ears) is untouched. Enlarging the radius further cannot fix this: the disc would have to reach the far ends of a cut that is longer than the neck is thick, and the patch builder also confines patch ink to opaque base paint in the same layer, so a disc cannot grow past the silhouette anyway. The +103 is exactly the middle of the cut that the bigger disc now reaches.

The same geometry is why every other joint opens: in the 7400 ms render the tail segments, the ankles, the jaw and the ears all show black wedges at their straight cuts. This is the mechanism, not a civet-specific cut.

## 3. The ruler: separating vacated silhouette from opened seams

The rest-silhouette rule I prescribed was wrong as a pass gate and I own that: a turned head legitimately vacates its rest region, so "rest pixels now transparent" cannot reach 0 for any real pose; 24,370 mostly counts the space behind the crown that the head left. The failed gate stays failed and the numbers stay as recorded.

**Clarified ruler (proposed, not applied retroactively):** `seam-oracle.mjs` counts transparent pixels that lie **inside the posed body envelope** (a morphological closing of the rendered alpha, radius 2 % of image width, so anything narrower than 4 % is "inside") **and within a disc of 10 % of image width around the joint's rest pivot**. Vacated space behind a moved part is outside the envelope and is not counted; a wide concavity (between legs) is not closed and is not counted; a wedge at a joint is. Report pose-minus-rest per joint so a resting concavity inside a disc is subtracted. Its own tests (`tests/seam-oracle.test.ts`) show a 6 px wedge counted, an intact body 0, a wide notch 0, a moved part 0.

Measured on the delivered renders (pixels; rest baseline, then old and repaired minus rest):

| joint | rest | old 0.025 | repaired 0.045 + neck 0.040 |
|---|---|---|---|
| head | 0 | +1,771 | +1,667 |
| neck | 0 | +1,473 | +1,366 |
| jaw | 0 | +2,350 | +2,350 |
| earFarTip / earNearTip | 287 / 198 | +3,010 / +3,711 | unchanged |
| tail1 / tail2 / tail3 | 1,291 / 3,276 / 656 | +3,199 / +11,836 / +8,203 | unchanged |
| foreNearAnkle / hindNearAnkle / hindFarAnkle | 959 / 4,947 / 2,345 | +14,598 / +8,318 / +16,670 | unchanged |

Head and neck: 0 at rest, about 1,700 and 1,400 open in the hit pose, and the patches removed about 100 each. The throat seam in the crop is that residue. Under this ruler the target for the head and neck discs at 7400 ms is 0 (their rest baseline), with the disc-only declaration as the failing control (1,771 / 1,473).

## 4. Fox: ACCEPT the corrected authored record

Only the three knee landmarks moved (hindNear, foreFar, foreNear), on the same hash-bound master; roots, ankles, paws, ground, materials, clip set and mask polygons are unchanged and the mask binding is rehashed with identical polygons. Through the actual compiler here: legSlack hindFar 4.23 %, foreFar 3.19 %, hindNear 4.01 %, foreNear 3.23 % BL, bounds inside, no notes (the near-collinear note is gone). Rest 0 changed channels; the old record still refuses at exactly 1375 ms with the unchanged reason; the corrected record passes 1,200 samples at 120 Hz with a maximum compression of 5.02 % under the unchanged 8 % cap. No defect found. This does not establish shape for the fox parts rig; it establishes that the fox can now be captured without the constraint refusing.

## 5. ONE bounded next repair for Nick to authorize: boundary-band underlaps at the head and neck cuts

**Changed data/code (Codex lane):** a second patch kind in the joint-patch declaration, `{ kind: "band", child: "head", parent: "neck", depth: 0.035 }` and `{ kind: "band", child: "neck", parent: "chest", depth: 0.035 }`. The builder takes the **child part's own opaque pixels within `depth` (fraction of image width) of the child/parent cut line**, duplicates them into a patch **attached to the parent joint** (so it moves with the parent and stays flush with the parent's edge), drawn beneath both base parts in the child's layer. When the child rotates away it vacates exactly the band the duplicate still occupies, so the wedge is filled with the child's own painted fur; when it rotates in, the band is hidden under the child. No turnaround sample, no generation, no new pixels: the paint is the master's. The disc patches stay as they are. Nothing else changes: masks, clips, pivots, the rig contract, the 8 % bound.

**Positive evidence:** rest render 0 changed RGBA channels (the bands are hidden at rest, one-owner reconstruction still holds for the base parts; patches are the sanctioned duplicates). At the same 7400 ms pose, `seam-oracle.mjs` head and neck seam pixels ≤ rest baseline (0), and a crop of the throat and crown with no arena showing.
**Negative control:** the disc-only declaration on the same frame must still count 1,771 / 1,366-class values; a band with `depth: 0.005` must leave most of the wedge and fail.
**Scope:** head and neck only, one atlas rebuild, no ten-second capture until the gate passes. If it holds, the same declaration extends to jaw, ears, tail and ankle cuts as ordinary declaration rows, which is the general repair every joint in the render needs.

GitHub step: none. PR42 stays parked.
