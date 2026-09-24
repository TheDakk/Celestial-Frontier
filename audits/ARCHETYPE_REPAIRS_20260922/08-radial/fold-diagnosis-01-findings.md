# Starfish: seven retained first-fold poses

Executed `node audits/ARCHETYPE_REPAIRS_20260922/08-radial/fold-diagnosis-01.mjs` once. Each of the original seven first failed poses was evaluated once through the actual compiled field and ARAP owners. Every original error and complete ARAP statistics object reproduces exactly. All attempted output buffers retain their sentinel values: no rejected geometry was published. This was not a static battery, native film, timing certificate, or admission run.

Original fit-01 record, binding, and static report remained unchanged. All 21 current bundled source hashes remained stable. Thirteen match the original static receipt exactly; `arap-skin.mjs` and `orientation-projector.mjs` changed during the already-signed exact-parity optimizations, and six modules are new to this diagnostic closure. The receipt explicitly distinguishes these identities; historical bytes are not relabeled as current. Exact historical failed-pose error/statistics equality is asserted separately.

## Rejected ownership

Part counts below are memberships, not a disjoint partition: shared triangles may touch more than one observed part. The JSON retains exact triangle IDs, source and target vertices, private rejected coordinates, ownership, weights, pins, and pins within two graph hops.

| Original row / first failed ms | Folded triangles | Main observed part membership |
| --- | --- | --- |
| approach:pulse / 147.5 | 30 | arm3-base 22; arm1-middle 5; arm3-middle 3; arm2-middle 2; arm2-base 1; arm4-middle 1 |
| melee:sting-arms / 185.4222222222222 | 9 | arm3-base 9 |
| cast / 187.08333333333334 | 27 | arm3-base 16; arm1-middle 5; arm2-middle/base 3 each; arm4-middle 3; arm1-base 1 |
| dodge / 80.46666666666667 | 19 | arm3-base 19 |
| faint / 255.86666666666667 | 2 | arm3-middle 2 |
| victory / 81.4 | 27 | arm3-base 20; arm4-middle 4; arm1-middle 3; arm4-base 1 |
| presentation, approach:pulse / 5983.333333333333 | 95 | arm3-base 60; arm3-middle 12; arm1-middle 11; arm4-middle 7; arm1-base 6; arm2-middle 6; arm2-base/arm4-base 2 each |

All coordinates refer to the original 1254-square master and original arm IDs. The dominant arm3 is the lower-left physical arm and already has the motion owner's expected odd parity. Therefore the separately identified arm1/arm4 swap does **not** explain the primary folds by itself.

The arm3-base failed-vertex boxes are:

- pulse: (410,705)–(587,841)
- melee: (470,685)–(548,783)
- cast: (410,695)–(567.5,841)
- dodge: (450,666)–(567.5,802.5)
- victory: (430,685)–(567.5,822)
- presentation: (410,666)–(587,900)

Faint's two arm3-middle folds lie at (430,880)–(450,900), farther down the same physical arm.

## Pin/ownership conflict to inspect visually

The melee failure directly includes three pure-root pinned source vertices at (479.5,714.5), (489,705), and (470,724), together with an arm3Seg0 pin at (528.5,763.5). These source points occupy the proximal lower-left arm/central-body transition while following different owners. The failed neighborhood contains 35 pins, 18 of them pure root.

Presentation's rejected triangles directly include 20 pinned vertices, 17 pure root and three arm-owned. Its two-hop neighborhoods contain 200 unique pins, 160 pure root. Exact source coordinates and weights are retained in the JSON. This establishes that the fold neighborhoods contain conflicting body/arm ownership constraints; it does not establish that any particular pin may be removed. The appropriate authoring review is to compare observed anatomy against the body remainder, arm bases, and middle boundaries in these exact regions. Any correction must preserve true central-disc ownership and assign only visibly arm-owned pixels to that arm; do not loosen or bypass the solver.

This diagnostic ends after the seven original samples. Parent owns the manually observed mask correction and any subsequent changed-input admission.
