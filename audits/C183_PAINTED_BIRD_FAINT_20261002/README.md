# C183 painted-bird faint expectations — 2026-10-02

The five reported reds are obsolete assertions about the old final head curl, not a newly observed runtime regression. The original test required every contact-passing timeline to remain identical and exempted only torso joints for the four adapted faint cases. C201 intentionally changes final `neck0`, `neck1` and `head` rotations for painted grounded birds, including contact-valid birds, to remove the native nape spike. Contact validity never proved that the old silhouette was safe.

The baseline on signed `5cc190cd31ac22b466785351bba854c5219431d8` reproduces exactly **5 FAIL / 7 PASS**. Its source-hashed log and complete original test are retained in `baseline-01.json`, `baseline-01.log` and `painted-bird-author.before.ts.txt`. Goose's first mismatch contains only those final head-chain values plus the C201 note and derived timeline hash. Vulture, Dove, Pigeon and Hawk fail the old unchanged-head assertion. Their preserved contact checks still report zero candidate refusals.

Only `port/v2/apps/game/src/motion/painted-bird-author.test.ts` changes in executable source. The revised expectation requires the exact C201 outcome: original rest and anticipation keys, original key times/easing, and zero final local rotation for the three head-chain joints. Every already-passing non-faint timeline remains deeply equal. Every already-passing faint timeline differs only in the three prescribed final values, the specific C201 note and its derived hash. The actual painted contact solver is now also rechecked on every formerly passing candidate.

The four originally contact-failing faint fixtures retain their failing-old/passing-current controls, unchanged phases, duration, limits, secondary motion, deformation, limbs, wings, tail and explicit editor constructor. Only the already-authorized torso author and the now explicitly asserted C201 head settling may differ. Five new deliberate timeline mutants restore the old nape curl, erase the initial nod, alter a wing, widen a head limit or change timing; every mutant is rejected. The adjacent unchanged axial-faint suite still reproduces and bounds the actual attributed paint spike, primate throat gap and bird wing-transition defects.

**Validation:** first corrected targeted run **23/23 PASS** across painted-bird-author and axial-faint; app TypeScript check PASS with no diagnostics. The existing20-second exhaustive-test ceiling is unchanged. No fixture, master, binding, solver, contact limit, frame budget, authored curve or runtime source was modified. No native or full-develop run was launched here. The fresh combined I5 boundary belongs to the parent task.

The current `CREATURE_ANIMATION.md` C77 paragraph now distinguishes the torso author preserving its input head curve from the C201 head adjustment that precedes it. A separate parent-requested Bittern reference note cites the root-owned deterministic phase diagnosis; it does not claim a Bittern fix or lift its hold.

Reproduction from the repository root, using PowerShell:

```powershell
node audits/C183_PAINTED_BIRD_FAINT_20261002/run-check.mjs NEW_TAG apps/game/src/motion/painted-bird-author.test.ts apps/game/src/motion/axial-faint.test.ts
```

The helper refuses an existing result tag. A new execution still requires the shared native/performance coordination window; this command is not permission to retry a failed gate. Exact executed commands, exit status, source hashes and sanitized logs are retained in the receipts. Git, mailbox, ROADMAP, branch handoff and product qualification remain with the parent task.
