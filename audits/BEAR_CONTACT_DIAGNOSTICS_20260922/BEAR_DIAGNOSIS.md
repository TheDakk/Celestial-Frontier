# Bear support iteration diagnosis

Diagnostic producer `5c5c8d78e934c9fdade33621dcde991aa195ed11`; original runtime/fit producer `1ff30009`. All sixteen first-refusal replays exactly reproduce the retained errors with the original three corrections. Only the audit clone was measured through 32 corrections; production remains unchanged.

## Convergence and paw

The fourteen support-refusing action rows and presentation all fail on **hindFarAnkle**. More iterations approach a two-cycle around **0.305154 px**, not a passing solution. At pass 32 the other active supports are within 0.000000538 px. All four bear support models reduce to 100% ankle ownership: no conflicting mixed weights were found. These are LBS/kinematic residuals before ARAP publication, so extra ARAP iterations cannot explain this refusal.

The hind-far support is offset (−3, −12) source pixels from its ankle, distance 12.369317 px; its almost straight two-bone chain makes the endpoint-offset fixed point oscillate as shared root accommodation changes. At idle, pass31 and32 predict opposite sides of the target with almost equal residual, rather than converging. This is a non-convergent endpoint-offset iteration on this geometry, not evidence that four differently weighted supports demand incompatible poses.

| First refusing row | ms | Pass 3 px | Pass 8 px | Pass 16 px | Pass 32 px |
|---|---:|---:|---:|---:|---:|
| idle | 50.989 | 0.263504085 | 0.294285615 | 0.304530921 | 0.305154422 |
| approach | 5.633 | 0.262449440 | 0.293993971 | 0.304513826 | 0.305154379 |
| melee:bite | 165.244 | 0.264052039 | 0.294436794 | 0.304539775 | 0.305154444 |
| alert | 3.967 | 0.264052039 | 0.294436794 | 0.304539775 | 0.305154444 |
| approach:walk | 5.633 | 0.262449440 | 0.293993971 | 0.304513826 | 0.305154379 |
| approach:trot | 5.633 | 0.262449440 | 0.293993971 | 0.304513826 | 0.305154379 |
| melee:claw | 165.244 | 0.264052039 | 0.294436794 | 0.304539775 | 0.305154444 |
| melee:gore | 165.244 | 0.264052039 | 0.294436794 | 0.304539775 | 0.305154444 |
| melee:tail | 235.156 | 0.265335732 | 0.294790034 | 0.304560446 | 0.305154496 |
| melee:headbutt | 165.244 | 0.264052039 | 0.294436794 | 0.304539775 | 0.305154444 |
| cast | 14.433 | 0.264781263 | 0.294637616 | 0.304551530 | 0.305154473 |
| hit | 435.367 | 0.253987215 | 0.291621217 | 0.304374099 | 0.305154021 |
| victory | 7.133 | 0.262037368 | 0.293879779 | 0.304507128 | 0.305154362 |
| feed | 473.733 | 0.269002455 | 0.295791954 | 0.304618938 | 0.305154640 |
| presentation | 116.667 | 0.263723827 | 0.294346270 | 0.304534474 | 0.305154431 |

Per-support vectors, targets, offsets and stance membership at every pass are retained in [bear-diagnostic.json](bear-diagnostic.json); compact pass3/pass32 breakdown is in [diagnostic-summary.json](diagnostic-summary.json).

## Gate scale and controls

The gate is **absolute native source pixels**, not a fraction of body length or screen size: the solver multiplies normalized x/y residual by record.geometry.width/height, then compares the Euclidean length with0.25. Resizing a record would change the pixel residual; no resize was performed. Root compression is a separate scale-relative gate at0.08×measured motion length.

| Control | Idle sample ms | Native width | Pass 3 maximum residual px |
|---|---:|---:|---:|
| crab | 0.000000000 | 880 | 0 |
| crab | 25.178773375 | 880 | 0 |
| civet | 0.000000000 | 1254 | 1.39221967288e-13 |
| civet | 20.149859774 | 1254 | 2.76933667908e-05 |

## Gallop

At180.266667ms, the limiting chain is **hindFarRoot → hindFarKnee → hindFarAnkle**, on the initial endpoint solve before any support correction. It needs40.251735338px of shared downward root accommodation against39.993999550px: **0.257735788px over**. Root-to-target distance385.455562251px exceeds its two-bone length345.763941880px. This is a chain reach/compression failure, not an angular-limit failure. Rest supports reproduce it at the same sample.

## One proposed fix — Nick decision, not applied

Authorize an **analytic rigid-support IK branch for endpoint-only supports**, solving the observed rigid support point directly and deriving the anatomical ankle transform from its unchanged offset. Keep the mixed-weight path, exact rest, terminal rule, existing limits, compression and0.25px gates unchanged. This targets the oscillating endpoint-offset fixed point without raising iteration count or changing paint/weights/landmarks. It needs its own positive/negative controls and S2 producer before adoption. It does not claim to solve gallop’s independently demonstrated compression limit; that refusal remains. No proposed fix was implemented in this run.
