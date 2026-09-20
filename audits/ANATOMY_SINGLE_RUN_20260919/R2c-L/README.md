# R2c-L — S2 STOP during reporting-only measurement

**Civet bite157.111111ms exceeds the unchanged8% scale-compression bound.** Signed and
independently verified measurement producer `1523b0b5`. The tool reports post-IK joint-limit
exceedances instead of throwing in an isolated temporary bundle; production checks remain
unchanged. This additional compression red stops the sweep. No retry or further variant.

All five crabs completed all12rows plus601presentation samples, with **zero limit exceedances**
and exact R2c′ row/presentation identity. Civet completed idle/approach and20bite samples before
S2. Full required measurement is incomplete, so **contactLimitsDeg was not added and no new
contact ranges were chosen**. Raw limitsDeg and the169-action battery are byte-identical.

[Summary](summary.json) · [Sweep](measure/static.json) · [Sweep log](measure/run.log)
· [Every reported limit exceedance and maxima](measure/limits.json) · [Signature](measurement-signature.json).

## Compression diagnosis

Declared scale length0.2801785145, unchanged bound0.0224142812 normalized units =28.107509px
vertically. Last published bite sample149.255556ms used24.509773px of correction. The required
correction at157.111111ms was not published by the throw and is **unknown**, rather than the
previous sample's value. The raw failed root pose is retained, distinct from a solved pose.
[Read-only diagnosis](compression-diagnosis.json). No diagnostic replay or compression change.

## Partial Civet table — not adopted limits

These maxima stop before the remainder of bite, other rows and presentation. They cannot
supply the requested complete measured-max+10°round-up-to5° values.15Civet exceedances were
recorded, each with subject,row,time,joint,required degrees,raw and solved root/spine/chest,
and world hip drop. Five-crab exceedance counts remain0.

| Joint | Signed degrees at max absolute value | Row | Time ms |
| --- | ---: | --- | ---: |
| hindFarKnee | 14.054419 | melee:bite | 149.255556 |
| hindFarAnkle | -20.686672 | idle | 1208.991586 |
| hindFarPaw | -30.068543 | melee:bite | 149.255556 |
| foreFarKnee | -52.249782 | melee:bite | 117.833333 |
| foreFarAnkle | 71.815103 | melee:bite | 125.688889 |
| foreFarPaw | -57.871119 | melee:bite | 149.255556 |
| hindNearKnee | 6.030310 | idle | 1208.991586 |
| hindNearAnkle | 36.962922 | melee:bite | 141.400000 |
| hindNearPaw | -40.196142 | melee:bite | 149.255556 |
| foreNearKnee | 29.989276 | melee:bite | 149.255556 |
| foreNearAnkle | -61.128081 | melee:bite | 117.833333 |
| foreNearPaw | 50.104168 | melee:bite | 117.833333 |

## Preserved source and measurement scope

[Transform receipt](measure/transform.json) records the one exact throw replaced inside the
temporary diagnostic bundle. `run-report-limits.mjs --reportLimits` requires the explicit
static-tool flag; no runtime report mode exists. Exact-span and single-transform guards are
live. Every other physical/contact/shape/rest gate stayed live. [Preservation receipt](preservation.json)
verifies bundled source/input hashes plus production solver/contracts/raw-battery identity to
prior signed `c7b4fdfd`. No raw-clip battery rerun is claimed.

10,527published sample records retain kinematic/model/ARAP/covariance vectors:

- [crab](measure/crab-support-samples.jsonl.gz) · [rows](measure/crab-static.json)
- [coconut-crab](measure/coconut-crab-support-samples.jsonl.gz) · [rows](measure/coconut-crab-static.json)
- [freshwater-crab](measure/freshwater-crab-support-samples.jsonl.gz) · [rows](measure/freshwater-crab-static.json)
- [mud-crab](measure/mud-crab-support-samples.jsonl.gz) · [rows](measure/mud-crab-static.json)
- [vent-crab](measure/vent-crab-support-samples.jsonl.gz) · [rows](measure/vent-crab-static.json)
- [Civet](measure/civet-support-samples.jsonl.gz) · [rows/failure/raw pose](measure/civet-static.json)

The failed sample has no published residual. Earlier native exact-rest/unpinned controls
remain in [R2c‴](../R2c-triple-prime/README.md); this reporting run is not native admission.
Node26.9.0 uninterrupted startup reused. Reviewer§12 read-only; no sync/copy.

## Accumulated run and handoff

[Single review index](../README.md) retains every earlier film/sheet, [CPU table](../R1c/CPU_TABLE.md),
leaf reds and refusal counts. New films/sheets0, phone proof absent; roster0attempted/0refusals/
58remaining. R2c-L contact-limit implementation and remaining controls, §10 acceptance, R2d,
R3 and remaining§8 stages are unrun after S2. Crouch×3/fallback controls need the new contract
and therefore were not run. No partial measurement is used to widen a range.

Codex stopped; no retry/variant without new direction. Claude can review read-only if requested;
no app switch or sync needed. No fetch/push/PR/label/merge/release/deploy. PR42parked. This final
packet is a signed evidence successor; local HEAD identifies it. Pre-existing.DS_Store untouched.
