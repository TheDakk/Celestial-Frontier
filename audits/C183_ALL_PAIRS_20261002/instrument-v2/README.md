# Exact local-beat instrument successor

Status: **PREPARED_UNQUALIFIED**. This is an additive audit instrument only. The failed first attempt, its diagnosis, and every C173 source remain unchanged. No product change, native retry, browser invocation, bundle preparation, or actual loaded-rig execution occurred here. Claude C184 owns the active native window.

`local-beat-probe.mjs` starts the unchanged turn through the real `BattleStage.play` path with clock origin zero, then ticks at the exact requested local time. It refuses a different sampled time or anatomical action. The actual placed joint is read independently after publication. A `finally` callback invalidates the diagnostic segment cache, re-enters turn zero through ordinary `stageAt(0)`, and checks turn, segment, clock and sampled time are all zero, including on a failed read/probe. No time or coordinate tolerance is widened.

The new entry uses this owner for launch/impact gates and semantic stills. The new runner invokes `stillAtTurn` with the named local times and retains the actual sampled time/action/restoration receipt alongside each still. The validator requires the exact launch and impact observations and rejects missing, early, late or stale semantic-still metadata. The existing 1e-6 normalized launch-coordinate comparison remains unchanged. All real live frame times, per-frame CPU work, actions, media, refusal checks and capture conditions keep their original path. The `stageAt` and `capture` bodies compare byte-for-byte with C173 in the small controls.

`run-sweep-v2.mjs` still retains every valid CPU-only RED and continues to report all over-budget pairs. Instrument, source, anatomy, transport and resource failures still stop before another pair. The supervisor's result/aggregation body is unchanged. `validate-v2.mjs` additionally requires the exact current hashes of this successor's entry, runner, helper, both validators, input contract, supervisor, preparation owner and controls; it cannot accept the old prepared manifest.

## Validation actually completed

- `probe-controls.mjs`: **16/16 PASS**, using a tiny stage-contract double, the five exact retained turn offsets, deliberate early/late/wrong-action/mismatched-observation/stale-restoration controls, restore-on-error, unchanged live-body checks and CPU-red continuation checks. This is not a loaded-rig or real-stage result.
- Syntax parsing: **10/10 PASS**, without importing or executing the modules.
- Static peer review: **no actionable defect found**, recorded in `peer-review.json`. Loaded-rig contact geometry, fresh preparation and native replay remain unqualified.

## Pending before proposing another native attempt

1. After C184 terminal release, run `actual-stage-control.mjs`. It loads two actual Crab fits with a synthetic texture decoder and drives the real stage, contact solver and choreography in forward/reverse order. It checks exact launch contacts, deliberate early/late clock errors, a false anchor and restored real pose. This prepared control is **UNRUN** and may itself require repair; no result is predicted.
2. Run this directory's copied `prepare-v2.mjs` into a **new** preparation directory. Its existing targeted preparation workflow resolves this entry and current product, binds the bundle and explicit successor files, and refuses overwrites. The C173 manifest must not be rewritten. No fresh manifest or bundle hash exists yet.
3. Independently review the prepared source closure and new control outcomes. The browser-entry dependency graph is bound by the existing Rolldown transform collector. Explicit node-side launcher/lock/card-builder/profile owners are also pinned; exhaustive ancillary node-side transitive closure is not newly claimed by this patch. Package lock and the existing recorded dependency inventory remain required.
4. Any native attempt still requires its own explicit reservation and signed prepared inputs. Do not rerun the stopped first pair automatically, and do not relabel its recorded 982 frames as a qualified result.

Example commands for the coordinating agent after CPU release (PowerShell, from the repository root):

```powershell
node audits/C183_ALL_PAIRS_20261002/instrument-v2/actual-stage-control.mjs
node audits/C183_ALL_PAIRS_20261002/instrument-v2/prepare-v2.mjs audits/C183_ALL_PAIRS_20261002/instrument-v2/prepared-next
```

These commands have not been run. They are preparation instructions, not native authorization. Any failure is retained and stops its dependent step.
