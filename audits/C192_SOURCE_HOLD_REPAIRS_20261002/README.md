# C192 held-source corrections — 2026-10-02

Five source-observed correction candidates pass the unchanged offline static and conservation checks. **All remain pending visual scoring; Rhea and Snow Petrel have strong visible anatomy/ownership holds.** One fresh Tiger Shark painting and an unresolved Capuchin review are also retained. This packet changes no product/runtime, pool, acceptance registry, motion, limits or certificate. No native browser, finisher, sweep or gate was run in this lane.

Paths below are relative to this audit. `final-checks.json` binds the complete selected paths and exact record/binding/master hashes; `visual-review.json` binds the full-size images and findings.

| Subject | Selected correction fit | Static action samples | Presentation samples | Actual-rig parity samples |
| --- | --- | ---: | ---: | ---: |
| Wild Ass | `01-wild-ass/axial-joins-02/fit` | 19 × 121 = 2,299 | 1,709 | 20 |
| Serval | `02-serval-tail-neck/axial-joins-02/fit` | 19 × 121 = 2,299 | 1,710 | 20 + 2 exact former-refusal phases |
| Horse | `03b-horse-pinnae/axial-joins-02/fit` | 19 × 121 = 2,299 | 1,705 | 20 + 1 exact former-refusal phase |
| Rhea | `04-rhea-legs/islands-01/fit` | 14 × 121 = 1,694 | 1,082 | 20 |
| Snow Petrel | `05b-snow-petrel-leg/islands-01/fit` | 14 × 121 = 1,694 | 1,086 | 20 |

Selected totals: **10,285 action samples, 7,292 presentation samples, 103 actual-rig parity samples; zero selected refusals.** These are offline samples, not performance measurements or an exhaustive proof of every pose. The separate Capuchin review contains 10 passing parity samples and no correction.

## Corrections and remaining holds

- **Wild Ass:** four observed fore-far landmarks/contours follow the painted carpal bend and fetlock. The baseline's loose triangular ankle/hoof fragment is continuous in the successor. Two observed axial paint joins close a small torso hole and mane opening. Sharp limb bends and small shoulder/overlapping-leg separations remain in raw faint.
- **Serval:** inherited tail controls/masks ran into the hind leg; the actual tail is short, at source x267–362/y529–591. Four tail controls/contours and an observed nape region correct that ownership. Original hop **116.5 ms / five folds** and tail **144.3111111111111 ms / four folds** are preserved as negatives; the corrected actual rig passes those exact local phases. Two axial joins close the upper-back V gap. A triangular ear/nape patch and angular limb separations remain.
- **Horse:** the fore-far ankle moves from the cannon segment to the actual fetlock, with four observed chain controls/contours. Original faint **197.8 ms / three folds** is preserved; the corrected actual rig passes that exact local phase. Four ear controls/contours move inherited mane points onto real pinnae. The observed mane envelope and two axial joins close the detached mane strip/body hole. A sharply pinched hind-leg bend and some magenta mane/tail edge residue remain.
- **Rhea — held:** six leg landmarks/contours recover the two visible leg chains. The final full-size faint still tears the inherited wing/back surfaces and leaves feather pieces. An independently visible far-wing interpretation is missing. No hidden wing was invented or declared absent to force the fit through.
- **Snow Petrel — held:** two near-wing points/contours follow the visible folded shoulder. That first post-D28 candidate **failed faint at 367.8666666666667 ms with two folds**; its full report and exact localization are retained in `05-snow-petrel-wing/islands-01/`. A successor corrects three near-leg points/contours where fixed body ownership intruded into the painted leg, and passes the static suite. Its full-size faint still has a large back/far-wing opening, wing/tail crossing and separated feather surfaces. The inherited far-wing/back interpretation remains unresolved.
- **Capuchin — review only:** `07-capuchin-review/` loads the existing `audits/C168_PRIMATE_REFERENCES_20261002/capuchin-contours/fit01`. Historical neck/head anchor distances are near zero, so those measurements do not justify a blanket neck weld. Neck sampling versus arm/shoulder attribution remains held; no speculative source or ownership change was made.

## Source and compiler boundaries

The five authored species preserve their original master bytes exactly. Each `correction.json` names the changed source-observed landmarks/regions. **Unedited G1 authoring is inherited; these mixed-origin repairs are not independent whole-family references.** The generic intake helper's manual-authoring metadata describes the intake mechanism and does not supersede this scoped provenance. Every selection keeps `qualityAccepted:false` and `independentReferenceEligible:false`.

D28 placement uses the authorized **0.5** default. New receipts bind that value and the exact helper hash. Historical baseline receipts are retained byte-for-byte even where their old prose still says 5%. Source RGBA, alpha, unedited polygons/landmarks, reconstructed atlas pixels and actual output ownership are checked independently. Placement changes only remainder owners.

The three quadruped `axial-joins-02` recipes use the unchanged `splitObservedSurfaces` API with exactly `neck|spine` and `root|spine`: visibly continuous source torso/neck boundaries. They change only the compiled binding; source coordinates, record, labels, atlas and keyed bytes are identical to the preceding D28 fit. All solver settings except topology-derived pin indices remain byte-equivalent. No ear/jaw/limb-crossing or overlapping-wing boundary is broadly welded. `axial-joins-01/instrument-refusal.json` retains an incorrect audit comparison against the unsplit solver; no static or pose publication ran for that preparation failure.

## Tiger Shark fresh source

`06-tiger-shark-v4/master.png` is one genuine builtin ImageGen edit of the preserved C183 v3 painting. Exact sent prompt, generation path, source/output hashes and subject provenance are adjacent. Output is native **1254 × 1254**, SHA256 `e20466d22482d56d3b59b719bdb9f7e501d545ac2ea11be536c1bea0de9f2039`.

Full-size review sees a concave subterminal notch on the upper caudal lobe, a longer upper than lower lobe, and retained dark vertical flank bars. The established 8% framing check passes (left/right/top/bottom margins 135/161/449/443 px; minimum 101 px). **The notch shape and anatomy still need scoring.** The generator changed pixels beyond the tail: this is a fresh painting, and no old masks or rig were rebound.

## Evidence and limitations

- `attempts.json` lists all 20 static artifacts: 17 new candidate stages and three exact historical baselines. It preserves the failed Snow Petrel stage and three preparation/instrument failures. No failure is relabelled as a pass.
- `final-checks.json`: five final-output checks PASS; 125 bound source files verify; retained Horse/Serval/Snow Petrel negative reports remain RED. Actual output ownership-color and keyed-RGBA mutations are rejected; solver-limit mutation is rejected for each axial recipe. The existing conservation receipts retain paint-addition/deletion and explicit legacy 0.05 structural-island negative controls; that legacy control does not change the authorized 0.5 default.
- `provenance-checks.json`: four actual-rig review bundle closures and their exact output bytes verify; generation prompt/source/output identities and retained baseline copies verify.
- Reviews load `CreatureRig`, apply actual sampled family actions, and compare published part Float32 buffers against independent paint publication. Full-size software rasters sample the original atlas. They are **raw family-action/source-size diagnostics**, not the native stage clock, stage grounding envelope, GPU compositor, finished-art film or 60 fps proof. The repeated/reversed sample order is retained in each review. Raw faint positions below the drawn ground line are not presented as a measured battle-stage grounding defect.
- `delivery.json` inventories every retained file except itself. No runtime or admission edits are included. The original sources, prior candidates, negatives and exact sent prompt bytes stay intact.

The sibling mailbox was read again at batch end through C192. CPU work is terminal; no command, browser or measurement is active in this lane. Parent owns signing and the mailbox handoff. Further quality scoring and any future native work remain separate.
