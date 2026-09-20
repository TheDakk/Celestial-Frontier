# R2c‴ — S2 STOP at Civet's ankle limit

Signed producer **0dd26298** passed native exact rest and the required unpinned negative
control. All five crabs pass all 12 rows plus 601 presentation samples, bit-for-bit with R2c′.
Civet passes idle and approach, then **melee:bite at102.122222ms requires foreFarAnkle61.560489°**,
above its unchanged60° maximum (existing numerical slack1e−7°). No further variant or retry.

[Verdict and controls](summary.json) · [Static sweep](static.json) · [Sweep log](static-run.log)
· [Verified producer signature](producer-signature.json).

The limit check throws after the fixed-point solve and before publication. The failing frame
has no published endpoint/paint/ARAP residual; the last completed Civet sample is bite94.266667ms.
Its retained raw clip pose is in civet-static.json; it is not the rejected solved pose. No
post-failure replay, relaxed limit, clamp, kit, binding or source change was made.

## Required controls

- [Native rest proof](native-rest-proof.json): restChanged0, finalRestChanged0; one-pixel
  shift control changes1,511,112RGBA channel bytes. [Native report](native-rest-01/report.json),
  [rest image](native-rest-01/family-rest.png). This is rest-only, not a motion film or CPU proof.
- [Unpinned candidate10 control](unpinned-control.json): expected failure at bite70.7ms,
  foreNearAnkle0.2500952006px against0.25px; exact-model covariance0. [Every control sample](unpinned-support-samples.jsonl.gz).
- Exact-model covariance0 for every retained support sample on all six subjects. Civet's
  remaining rows/presentation are unrun after S2; no full Civet admission is claimed.
- Crab ARAP/publication remains at the Float32 floor shown below. Civet's locked supports now
  also remain below0.000088px across completed samples. These are measured values, not literal
  zero; the complete five-crab row results are bit-identical to R2c′.
- [Binding receipt](../R2c-double-prime/civet-input/receipt.json) remains immutable: seven support
  weights/six added pins from R2c″, no new regeneration here. Native-rest-proof.json supplies
  the completed native result without rewriting its prior prepared receipt.
- [Source/input preservation](input-and-source-preservation.json):779unique hashes unchanged,
  including original candidate10 and regenerated Civet binding/atlas inputs.
- Prior [diffused mutant control](../R2c-double-prime/controls.log) remains retained:2.64794px
  expected failure versus pinned0.0000252px. No unchanged rerun after S2.

## Every published sample

10,520 sample records, with support LBS prediction, target, kinematic residual, separate
ARAP/publication residual and covariance vectors. Samples from the failing frame do not exist.

| Subject | Samples | Max covariance px | Max ARAP/publication px | R2c′ rows bit-identical |
| --- | ---: | ---: | ---: | --- |
| crab | 2053 | 0 | 6.27693939e-05 | yes |
| coconut-crab | 2053 | 0 | 5.99326448e-05 | yes |
| freshwater-crab | 2053 | 0 | 3.65628248e-05 | yes |
| mud-crab | 2053 | 0 | 3.51793196e-05 | yes |
| vent-crab | 2053 | 0 | 4.80103897e-05 | yes |
| civet | 255 | 0 | 8.78648428e-05 | partial; S2 |

- [crab samples](crab-support-samples.jsonl.gz) · [row report](crab-static.json).
- [coconut-crab samples](coconut-crab-support-samples.jsonl.gz) · [row report](coconut-crab-static.json).
- [freshwater-crab samples](freshwater-crab-support-samples.jsonl.gz) · [row report](freshwater-crab-static.json).
- [mud-crab samples](mud-crab-support-samples.jsonl.gz) · [row report](mud-crab-static.json).
- [vent-crab samples](vent-crab-support-samples.jsonl.gz) · [row report](vent-crab-static.json).
- [civet samples](civet-support-samples.jsonl.gz) · [row report](civet-static.json).

## Constructor correction and retained instrument results

The only runtime diff from R2c″ is `v.barycentric < −1e−8`. Stored coefficients are preserved
without snap or renormalization; other limits and gates stay0.25px,<2ms,exactrest.
[Direction receipt](direction.json) references read-only reviewer§11; no sync/copy.

[25contact tests PASS](contact-tests-native-units.log): regenerated real binding constructs;
stored−8.975276662232845e−16 remains exact, prediction matches a+0control within1e−12 normalized
prediction coordinates; −1e−3 with sum preserved still throws. The [first unit assertion](contact-tests.log)
compared after pixel conversion and measured1.2835631168434424e−12px. That result is retained;
the corrected assertion uses the prediction API's native units, not a claim of≤1e−12px.
[TypeScript PASS](typecheck-corrected.log), [initial command typo](typecheck.log),
[root validation PASS](validate.log). Existing pose-exporter module reds are expected until a
separately authorized re-merge, so they were not retried. [Earlier tooling receipt](../R2c-double-prime/toolchain/README.md).

## Accumulated packet and local handoff

[Single review index](../README.md) retains every earlier film/sheet, [CPU table](../R1c/CPU_TABLE.md),
refusal count and leaf diagnosis. New full-row films0; new sheets0; phone-tier proof absent.
Roster0attempted/0fit refusals/58remaining. R2d→R3/T1/travel/contactJoint/pinch/profile→R4→native
full-row recapture→R9/Q1→R5/R6/R7→R8→roster→localPR42split remain unrun because S2 fired.

Codex: stopped, no further variant or retry without new direction. Claude: read-only review
if requested; no app switch or sync needed. PR42parked; no PR is ready. No fetch/push/PR/label/
merge/release/deploy. Pre-existing.DS_Store untouched. Node26.9.0 throughout; uninterrupted
startup receipt reused. This packet is signed as an evidence successor; local HEAD identifies it.
