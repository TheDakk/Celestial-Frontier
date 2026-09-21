# Stage displacement — ordered run

ContactPhase.stageDisplacement is signed measured body-length units. In stage mode only, each stance target recedes by displacement × scaleLength. Solver mode ignores the field; omitted stage displacement preserves the prior path. No clamp, limit, skin, binding or raw clip change. Non-finite stage input refuses.

Claude’s third pin currently does not pass a displacement in ctx; caller/test must supply it. The adapter divides normalized source displacement by card.scaleLength, matching this solver. Keep displacement bounded by the existing reach gates; this change does not turn a long run-up into one anatomically unlimited planted stride.

Node26.9.0 uninterrupted anatomy-run receipt reused. Initial edit command used the wrong cwd and made no edits or test run; corrected before focused checks. Focused checks and one signed-producer S2 sweep follow.

Focused stage/support3/3 and stance5/5 PASS; app typecheck and root validation PASS. The published mesh support also passes0.25px after signed stage displacement. The first negative-control travel was too small (0.1237 arena px) to exceed0.25px; retained in focused.log, then the input travel was increased from0.006 to0.03 body lengths. No production gate was changed. Full184.32px-at-quarter-scale single-stance mutant correctly refuses reach; caller must test stance intervals and pass actual displacement, rather than expect unlimited planting.

## S2 complete

Signed producer `d8787235`; one sweep PASS. All six subject receipts exactly equal the prior stage-support ledger; five crab rows also bit-identical to R2c′. See [S2 ledger](S2_LEDGER.md). No S2 halt.
