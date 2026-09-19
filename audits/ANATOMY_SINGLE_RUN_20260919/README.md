# Anatomy single-run review packet — R2c′ S2 STOP

Latest bounded correction: [R2c′ verdict and all evidence](R2c-prime/README.md).
Five crabs reproduce R2c rows bit-for-bit. Civet idle and approach now pass; **melee:bite fails
at 54.988889 ms with 0.266107412 px drift against 0.25 px**. No retry or later stage ran.

At failure: exact-LBS kinematic residual 0.099957721 px; separate ARAP/publication residual
0.181297781 px. Their vectors produce the failed drift. The weighted common-point model
itself converged; spatially varying triangle weights explain its difference from exact LBS.
[Sample vectors and diagnosis](R2c-prime/README.md#residual-attribution-at-the-failure).

| Item | Current outcome | Evidence |
| --- | --- | --- |
| Toolchain | Node 26.9.0 installed; seven capability checks PASS | [Receipt](00-toolchain/receipt.json) |
| R1c-b | Adapter identical; candidate-10 contour reproduction; reach gap diagnosed | [Comparison](R1c/civet.json) |
| R1c-c | All 69 controlled trials retained; leaf reds remain | [CPU median/IQR table](R1c/CPU_TABLE.md), [raw trials](R1c/cpu-01/report.json) |
| R2c | Five crabs passed, Civet failed; original stopped evidence now signed ca851fb6 | [Original stop packet](R2c/PACKET_AT_STOP.md) |
| R2c′ | Five crabs bit-identical; Civet melee:bite shared red | [Static sweep](R2c-prime/static.json), [all sample files](R2c-prime/README.md#every-sample-retained) |
| Remaining §8 | Unrun because S2 fired | [Exact summary](R2c-prime/summary.json) |

The earlier instrument schema failure and signing refusals are retained in the original stop
packet. Signing is now resolved; both halted evidence and correction producer are signed and
independently verified. No numerical result constitutes visual acceptance.

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

OpenAI/Codex on macOS: `/Users/nick/Projects/celestial-frontier-openai-mac`, `openai/mac`
tracking `origin/openai/mac`. Halted packet `ca851fb6`; candidate producer `dd33865c0e60994b37df31364959e89749d277a8`.
This verdict receives a separate signed evidence successor; use local git log for its hash.
No fetch/sync/push, PR mutation, hosted attempt, merge, release, deployment or history change.
Pre-existing `.DS_Store` untouched. No signing configuration or private-key change.

Codex: stopped at S2; no retry or continued repair without a new direction. Claude: read-only
review if requested; no app switch or sync required. R3 does not exist here. PR42 stays parked;
no PR is ready and the local split was not reached. Future authorized integration targets
`develop`, never directly `main`.
