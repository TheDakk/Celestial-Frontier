# C132 — captured Centipede fold candidate

Audit-only candidate. Production ARAP, contact, choreography and acceptance code remain untouched. `receipt.json` pins the exact source inputs and candidate artifacts; `source-overrides.json` is ready for the parent's reserved 4× CPU native run. No native run was made by this packet.

## Reproduction and cause

The failed source capture is `audits/C132_C12_20261001/native-baseline-correct-fit-02/report.json`, source `852c7b2b021652146d0b86a34cb2f095a9a97037`. At 4949.7 ms, Centipede's second approach cycle has elapsed 333.0333333333333/420 ms, with stage displacement 0.05870172991071427 body lengths. The frame takes 543.7 ms and refuses one folded ARAP triangle. The next sample is 5483.1 ms: the 533.4 ms gap skips turn 1 action and hitstop, correctly causing the capture guard's `missing live turn phase` failure.

`reproduce.mjs` reconstructs the preceding and refused poses using the exact card seed, additive idle/approach samples, family contact solver, skeleton matrices and compiled Float32 skin targets. The record, binding and arena recipe hashes match the capture. The preceding target passes; the recorded refused target reproduces the same fold. Its target hash is `325d57820f8ac96aa8a8b70f4dee3a1e1ccbce5ae81a82a3d869fd1d3407098f`.

The active projection cycles through its entire 598,592-visit budget (9,353 triangles × 64) and leaves triangle 2300 inverted, ratio −0.000497084. It joins vertices 1364, 1365 and 1357; the last two are hard pins. The same behavior occurs with the existing JavaScript active solver and with the existing WASM solver. This is not a WASM-only mismatch.

## Candidate

The original active step is retained for the first topology-sized sweep. Later visits use half steps to settle the oscillation. The C leaf, JavaScript fallback and audit admission reference implement exactly that same arithmetic. No additional solve or previous-pose warm start occurs. Floors, hard pins, 64-iteration/598,592-visit ceilings, final ARAP fold refusal, actual Float32 paint fold refusal, joint limits, contact solver, motion curves and capture checks stay intact.

On the recorded refused target, visits fall from 598,592 to 9,897; the final field has no flipped triangle and minimum signed area ratio 0.060454. Maximum distance from the input target falls from 13.568 px to 8.089 px. The published part ratios are 0.060454–2.850155. Node timings are approximately 146 ms versus 3.4 ms in one diagnostic comparison; they are not native 4× CPU results.

`bounded-damping-attempts.json` retains three initial scalar probes. Immediate half steps, three-quarter steps and overrelaxation all removed this fold. The selected delayed half-step candidate preserves ordinary early-converging poses and has lower deformation than overrelaxation. Earlier probe copies remain clearly separate from `arap-candidate.mjs` and the final overrides.

## Evidence and limits

`candidate-check.json` compares all 46 captured turn-1 approach targets plus ten nearby times. All 56 pass the candidate, with exact WASM/JavaScript output, solver-state and heap parity; 48 outputs remain byte-identical to the original. Seven formerly passing targets change (maximum 8.664 source pixels, less than 0.7% of the 1254-pixel source width); the remaining target is the repaired refusal. Across all targets, 1,792 actual published-part checks pass and hard pins remain exact. Published signed area ratios span 0.053638–5.373684. These are deformation measurements, not a new acceptance ceiling: the existing paint guard checks orientation, not a separate scalar strain bound.

Controls still refuse contradictory all-pinned folds, nonfinite targets and a reflected actual published paint part. Refused output stays atomic and target inputs remain unchanged. Five inherited suites pass 31 tests with their assertions unchanged; only their imports/fixture paths point at this audit candidate. They cover real fish cast parity, backend absence, post-work traps, malformed topology/budgets, arithmetic/no-op mutants, queue order, signed zero, overflow and thin reflected triangles. The first copied artifact test mistakenly read the production binary beside candidate bytes; its URL was corrected and the complete focused suite passed. The copy hashes and setup correction are recorded in `inherited-test-provenance.json`.

Claude's guardian extension changed `choreography.ts` after the baseline capture. Its used `makeClip`, `sampleClip` and `addPose` function bodies remain byte-identical, checked against the captured commit. Other reconstruction owners listed in `receipt.json` match the captured source bytes. The candidate itself changes no choreography.

Before native testing, post **native/performance reservation active** and freeze the exact source/override inputs through capture, then post a terminal notice. Use the original pair and script with `CF_CPU_THROTTLE=4` plus this packet's `CF_PROOF_SOURCE_OVERRIDES`. The parent owns native scheduling. Complete-script native performance, full-size motion review and all library-pair coverage remain pending. The I5 certificate is unchanged.

For the deterministic checks only, from the repository root in PowerShell:

```powershell
node audits/C132_C12_REPAIR_20261002/reproduce.mjs
node audits/C132_C12_REPAIR_20261002/check-candidate.mjs
```
