# Chin/throat join review — September 16

Nick found an open notch under the Civet's chin in the previous neck repair. The original body survived, but the replacement head sat above the old throat rim. That is a different defect from deleted body pixels: the previous body-preservation gate was insufficient.

## Repair and scope

The source-backed profile is fitted lower into the existing painted throat (normalized pivot y 0.445 → 0.492). No original PNG, kit paragraph, skeleton, motion curve, seed, contact bound or game outcome changed. Ear/jaw motion and facing remain. The accepted originals are retained; this is authored view alignment, not a species-specific animation curve or a universal Civet offset.

`head-04/views.json` hash-binds seventeen overlapping interior attachment ribbons between the actual profile mesh and original neck skin. `attachment-coverage.mjs` follows barycentric points in the published triangles and tests native rendered alpha along the attachment. It is independent of skeleton family and does not fill gaps by guessing anatomy. A padded native render prevents lunges from leaving the measurement surface. The alpha threshold remains 230; source preservation remains a separate check.

## Evidence

- `native-07/report.json`: all seventeen throat ribbons are covered across 601 explicit-time samples (10,217 ribbon observations), minimum alpha 242. The retained visible chin-notch image fails with 110 missing samples on its diagnostic ribbon.
- Original visible source joins remain continuous in 1,803 left-creature poses: Civet 23 joins, fox 26, procedural quadruped 21. Civet head-subtree joins are explicitly replaced by the source-view check; they are not counted as visible original skin.
- The Platypus's 23 source joins pass in each of those three pairings. Largest measured source-join discrepancy remains below 0.00014 native pixel and below the unchanged Float32 rounding allowance. This is geometric join continuity, not a new complete painted-foot contact qualification.
- `still-parity-positive.json`: all 15 final post-recording stills are byte-identical to the independent still-only run. `still-parity-negative.json` rejects the original reset path with 1,268,965 changed channels. Reproduce with `port/v2/tools/battle-facing/compare-stills.mjs`.
- `motion-02/`: final ten-second films and stills, including both combatants. Actual media decoding and frame pacing are recorded by the capture runner. Dirty diagnostic evidence does not qualify clean signed source or phone performance.
- `focused-tool-tests.txt`: 29 passing tests. They include real retained source-join failures, one-pixel missing coverage, invalid/unknown surface refusal, reflected/non-square geometry, hash-bound intake, and synthetic positive/negative controls for all fourteen family vocabularies. Synthetic coverage is not painted-family acceptance.
- `game-typecheck.txt` and `root-validate.txt`: separate code validation receipts. Legacy deterministic fingerprint remains unchanged.

The remaining universal-family work is recorded in `UNIVERSAL_COVERAGE_REVIEW.md`. No ordinary-game promotion or claim of every possible creature being finished follows from this proof.

## Failures retained and fixed

- `native-01`: initial lower fit looked closed in stills.
- `native-02`: new instrument incorrectly addressed the part container instead of its child mesh; fixed without relaxing the gate.
- `native-03`: the new gate caught a six-pixel opening at 1883.333 ms. The fit was given additional source-painted overlap; motion was unchanged.
- `native-04`: the lunge left an unpadded native measurement canvas. Fixed by a 2× canvas with a centered native-scale origin; no off-canvas skip.
- `native-05`/`06`: dense attachment and full left-body checks pass; `native-07` additionally checks the Platypus.
- `capture-oracle-parity.json`: original post-recording stills differ from fresh explicit-time stills. Capture cleanup had reset the performance players. The runner now re-selects the creature before sampling named poses. The old stills remain evidence, not the final review images; their accompanying motion video was not affected by this cleanup bug.

Review locally at http://127.0.0.1:49816/throat/ with Before/After and half-speed playback. Nick owns visual acceptance. GitHub step none; PR42 parked. HEAD remains signed 1a6dd61d (118 ahead cached origin/openai/mac, 229 ahead cached origin/develop); later work remains staged pending 1Password signing. No unsigned fallback or signing configuration change. Codex continues local work; Claude need not open or sync now.
