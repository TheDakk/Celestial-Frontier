# R2c″ — S2 STOP before native rest

**The new family-contact constructor rejects regenerated Civet support data.** No third
variant, clamp, threshold change or retry follows. Signing is resolved; this is a shared
runtime-path red, not a 1Password block. Implementation producer `766e0917`; corrected audit
producer `224086c9`; both signatures independently verified. Node 26.9.0 throughout.

The exact error is `Contact: invalid support weights foreNearAnkle`. At part
`fore-near-lower`, part vertex 112, field vertex 442, the original barycentric coefficient is
**−8.975276662232845e−16**. It is byte-preserved from candidate-10. The new constructor rejects
`v.barycentric < 0` under a generic “weights” error, although these skin weights sum to 1.
This is a newly introduced validation rejection of retained floating-point interpolation
data. It is not a measured kinematic or ARAP residual and does not establish whether the
contact locks would have passed motion. No tolerance, coefficient or input was changed.

[Native failure](native-rest-02/report.json) · [Exact input/validator diagnosis](constructor-diagnosis.json)
· [Machine-readable verdict](summary.json) · [Verified signatures](signature-verification.json).
All 761 recorded native sources remain hash-identical. Original candidate-10 inputs also
remain unchanged: [input preservation](input-preservation.json).

## Evidence and limitations

- [Shared-split receipt](civet-input/receipt.json): seven support weights changed, six pins
  added; all other weights, topology, coordinates and atlas preserved. `restChanged` remains
  null because native rest was never measured; do not interpret the prepared receipt as admission.
- [Contact tests](contact-tests.log): 24 PASS. [Split/probe tests](tools-tests-fixture-corrected.log): 8 PASS.
  The real-binding unit test reads support weights but does not construct the solver; therefore
  it missed the new negative-barycentric rejection. Synthetic triangles have nonnegative coefficients.
- [Synthetic controls](controls.log): pinned support passes 0.0000252 px, diffused mutant fails
  2.6479415 px; exact-triangle versus old common-point covariance unit control passes.
- [TypeScript](typecheck.log) and [root validation](validate.log) pass.
- [Initial split-test failure](tools-tests.log): incomplete fixture omitted geometry; corrected
  fixture only, retained failure. No runtime retry resulted.
- [Native invocation failure](native-rest-01/report.json): my command requested nonexistent
  quadruped `melee:body`, before measuring anything. The corrected invocation uses the retained
  Civet attack list `[melee:bite]`. Its `native-rest-02` failure is the S2 verdict above.
- [Toolchain and requested portability fixes](toolchain/README.md), signed `dd7909b4`: Node
  unchanged at 26.9.0; Blender bridge 20 PASS. Pose exporter 5 PASS / 2 leaf reds because local
  reserved battle2/choreography.ts and effects/anchors.ts are absent; no copy/sync/skip.
- [Earlier signing failures](signing-block.json) and [explicit retry success](signing-resolved.json)
  are retained. Configured 1Password helper preserved; no unsigned fallback.

Native rest, unpinned-candidate10 negative control, six-subject covariance <=1e-6 px,
five-crab R2c′ bit-identity, and Civet all-row/presentation acceptance are **unrun** after S2.
Prior crab results and 10,515 R2c′ samples remain historical evidence, not R2c″ acceptance.
No new CPU result or phone qualification is claimed. Gates remain 0.25 px, <2 ms, exact rest.

## Accumulated run and handoff

[Single review index](../README.md) retains every prior film/sheet, [CPU table](../R1c/CPU_TABLE.md),
leaf diagnosis, refusal count and unrun item. New films/sheets: 0. Roster attempted: 0;
fit refusals: 0; remaining: 58. Phone-tier proof: absent. R2d → R3 → R4 → full native capture
→ R9/Q1 → R5/R6/R7 → R8 → roster → local PR42 split did not run.

Codex: stopped at S2; no further variant or retry without new direction. Claude: read-only
review if requested, no app switch or sync required. R3 interfaces are not implemented here.
No fetch, push, PR, label, merge, release or deploy. PR42 stays parked; no PR is ready.
This verdict is committed as a signed evidence successor; local HEAD identifies that commit.
