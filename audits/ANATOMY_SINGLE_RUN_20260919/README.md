# Anatomy single-run review packet — S2 STOP

The required shared-path stop fired in R2c. No retry or later item was run.
All five crabs passed the static sweep; Civet failed idle at261.948177ms:
**foreNearAnkle painted drift0.260840176px >0.25px**. This is earlier than the retained
pre-R2c idle failure at322.397756ms. The candidate is not admitted.

[Run summary](run-summary.json) · [source-bound static result](R2c/static.json) ·
[Civet failure and support weights](R2c/civet-static.json) · [CPU table](R1c/CPU_TABLE.md).

## What completed

| Item | Result | Evidence |
| --- | --- | --- |
| 0 Toolchain | Node26.9.0 installed;7capability checks PASS | [Receipt](00-toolchain/receipt.json), [verification](00-toolchain/verify.json) |
| R1c-b | Adapter hashes identical;5retained planted contour samples reproduce; current reach gap isolated | [Comparison](R1c/civet.json) |
| R1c-c | All69planned trials retained;59FAIL/10PASS diagnostic trial statuses | [Median/IQR table](R1c/CPU_TABLE.md), [contrasts](R1c/contrasts.json), [raw trials](R1c/cpu-01/report.json) |
| R2c controls | Zero-offset identical; doubled offset passes; unpinned/diffused mutant fails | [Controls](R2c/controls-02.log) |
| R2c actual static sweep | Five crabs PASS; Civet shared red, STOP | [All rows](R2c/static.json) |

Five-crab static outcomes:121samples ×12rows plus601presentation samples per crab.
Exact source-rest geometry returned after each row; this is not native RGBA/rest certification.

| Subject | Max row painted drift px | Endpoint max error | Result |
| --- | ---: | ---: | --- |
| [crab](R2c/crab-static.json) | 0.000062718 | 3.51e-16 | PASS |
| [coconut-crab](R2c/coconut-crab-static.json) | 0.000056790 | 4e-16 | PASS |
| [freshwater-crab](R2c/freshwater-crab-static.json) | 0.000031406 | 4.58e-16 | PASS |
| [mud-crab](R2c/mud-crab-static.json) | 0.000381523 | 4e-16 | PASS |
| [vent-crab](R2c/vent-crab-static.json) | 0.009359585 | 3.51e-16 | PASS |
| [civet](R2c/civet-static.json) | 0.260840176 | 3.14e-16 | SHARED_PATH_RED |

## Shared red diagnosis

At Civet’s failing sample the corrected endpoint error is2.48e-16 normalized image units,
and the rigid-support prediction is0.000834862px. Actual published paint differs from that
prediction by0.260005314px. Its support is interpolated from vertices444/445, both unpinned;
their weights are79.7–92.1% foreNearPaw, only7.8–19.8% foreNearAnkle, with smaller axial
weights. The source offset is13.47784px. The rigid ankle-offset equation is sufficient for
the five endpoint-pinned crabs, but does not describe this diffused, mostly paw-driven Civet
support. ARAP reports zero folds at failure. No input binding, pin, source landmark, limit
or threshold was altered to make it pass. No follow-up repair or replay was attempted.

## Leaf reds and instrument failures

- Persimmon:13declared-scale trials retain84disturb folds and209presentation folds;
 10legacy diagnostic trials retain78/132. These are recorded failures, not adopted settings.
- Flora CPU: declared disturb exceeds2ms for all3subjects; other row failures are retained
 individually. Successful updates have median/Q1/Q3 normalPasses all4. Scale and order both
 produce effects above within-cell IQR for some rows; the table labels the comparisons.
 A failed prefix timing never certifies the complete row.
- Initial R2c control fixture omitted `cf.paint-skin/v1` schema. Three vertices were valid.
 Original [source](R2c/controls-instrument-01.ts) and [error](R2c/controls.log) remain;
 schema-only correction used a fresh output and passed.
- Signing: [helper failure](R2c/signing-helper-failure.json), then [agent refusal](R2c/signing-agent-failure.json).
 R2c code/evidence are staged and unsigned. No signed-producer claim is made for its static sweep.

## Films and sheets

**New films:0. New sheets:0.** S2 occurred before the one authorized native recapture,
R9/Q1 finishing, arena composite and roster sheets. No faint-inclusive/full-row film exists
from this run. These earlier artifacts are indexed only as retained background evidence:

- [crab prior10second film](../ANATOMY_COMPLETION_20260917/crab-native-04/family-10s.webm).
- [coconut-crab prior10second film](../ANATOMY_COMPLETION_20260917/coconut-crab-native-04/family-10s.webm).
- [freshwater-crab prior10second film](../ANATOMY_COMPLETION_20260917/freshwater-crab-native-04/family-10s.webm).
- [Prior coconut-crab-review-01 sheet](../ANATOMY_COMPLETION_20260917/review-diagnosis-01/coconut-crab-review-01.png).
- [Prior coconut-crab-review-02 sheet](../ANATOMY_COMPLETION_20260917/review-diagnosis-01/coconut-crab-review-02.png).
- [Prior coconut-crab-review-03 sheet](../ANATOMY_COMPLETION_20260917/review-diagnosis-01/coconut-crab-review-03.png).
- [Prior coconut-crab-review-04 sheet](../ANATOMY_COMPLETION_20260917/review-diagnosis-01/coconut-crab-review-04.png).
- [Prior coconut-crab-transition sheet](../ANATOMY_COMPLETION_20260917/review-diagnosis-01/coconut-crab-transition.png).
- [Prior crab-film-01 sheet](../ANATOMY_COMPLETION_20260917/review-diagnosis-01/crab-film-01.png).
- [Prior crab-review-01 sheet](../ANATOMY_COMPLETION_20260917/review-diagnosis-01/crab-review-01.png).
- [Prior crab-review-02 sheet](../ANATOMY_COMPLETION_20260917/review-diagnosis-01/crab-review-02.png).
- [Prior crab-review-03 sheet](../ANATOMY_COMPLETION_20260917/review-diagnosis-01/crab-review-03.png).
- [Prior crab-review-04 sheet](../ANATOMY_COMPLETION_20260917/review-diagnosis-01/crab-review-04.png).
- [Prior crab-transition sheet](../ANATOMY_COMPLETION_20260917/review-diagnosis-01/crab-transition.png).
- [Prior freshwater-crab-review-01 sheet](../ANATOMY_COMPLETION_20260917/review-diagnosis-01/freshwater-crab-review-01.png).
- [Prior freshwater-crab-review-02 sheet](../ANATOMY_COMPLETION_20260917/review-diagnosis-01/freshwater-crab-review-02.png).
- [Prior freshwater-crab-review-03 sheet](../ANATOMY_COMPLETION_20260917/review-diagnosis-01/freshwater-crab-review-03.png).
- [Prior freshwater-crab-review-04 sheet](../ANATOMY_COMPLETION_20260917/review-diagnosis-01/freshwater-crab-review-04.png).
- [Prior freshwater-crab-transition sheet](../ANATOMY_COMPLETION_20260917/review-diagnosis-01/freshwater-crab-transition.png).

## Unrun items and refusal accounting

R2d → R3/T1/travel/contactJoint/pinch → R4 → native recapture → R9/Q1 → R5/R6/R7 →
R8 phone delivery → roster → PR42split are **not run**, because S2 forbids advancing.
Phone-tier proof: absent; no phone qualification or canary claim. Roster:0attempted,
0fit refusals,58remaining. Those zero counts mean unrun, not acceptance.
No finished-crab or open-gape candidate was painted and no review verdict is inferred.

## Local handoff

Verified identity: OpenAI/Codex on macOS, `/Users/nick/Projects/celestial-frontier-openai-mac`,
`openai/mac` tracking `origin/openai/mac`. Last signed HEAD184962789eb2ed82343668a1601cc71e26ed83b6;
137ahead cached origin/openai/mac,248ahead cached origin/develop. No fetch or remote freshness claim.
[Three commits independently verified](signature-verification.json):6365167e(toolchain),
416b020e(R1cproducer),18496278(CPUevidence). R2c remains staged/unsigned after1Password refusal.
No persistent signer change, private-key export, new branch, sync, push, PR mutation, hosted
attempt, merge, release, deployment or history operation. Pre-existing.DS_Store untouched.

Codex: stopped at S2; do not resume or retry without new direction, and resolve signing before
any future producer admission. Claude: may read this packet if Nick requests review; do not
sync/merge or start E1 from an R3producer, because R3does not exist here. No app switch needed.
PR42remains parked. No PR is ready; future authorized split targets develop, never main.
