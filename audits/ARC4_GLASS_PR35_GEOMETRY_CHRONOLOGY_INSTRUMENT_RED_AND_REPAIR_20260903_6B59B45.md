# PR #35 fourteenth hosted stop — Capture focus and Glass geometry chronology

**Date:** 2026-09-03 UTC

**Hosted workflow:** `test-battery` run `33694235427`, attempt 1

**Authorized head/base:** `6b59b452b41c0065fb3946b9cf3b7fc6ac02963c` →
`7a9f4c1370dd84292388d718c38ff34214f6203b`

**Result:** terminal Glass instrument red, no retry, no merge

## Immutable source and authorization boundary

Nick authorized exactly one PR #35 `test-battery` attempt for the head/base above, using the
`actions-budget-approved` label, with a 92-minute maximum and no retry. GitHub tested synthetic
merge `94ec8e41606f9c0e1b16865cdfeff4fb76579b3f`, whose parents are the exact base followed by the
exact head. Its tree `54ab518c2f63c924e2cedfea027b949989f2a79e` is byte-identical to the exact
head tree.

The run was created at `2026-09-02T23:15:23Z`; its battery job ran from approximately
`23:15:32Z` through `2026-09-03T00:30:09Z`, about **74m37s**. Both retained Glass reports record
the same clean detached synthetic merge at their begin and end boundaries: empty-status SHA-256
`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`, working-tree SHA-256
`f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`, and
`sourceChange.detected:false`.

## Passed predecessors and the early/full contradiction

Authorization, checkout/setup, environment/scope/budget policy, legacy browser-free gates, v2
static/art/routing/specification owners, the shared Chrome launcher selftest, root Layout
**787/787** plus freshness verification, Compendium instrument controls and live preflight,
Compendium **78/78** plus named verification, and real-browser Slice plus exact binding all passed.
SceneMemory correctly skipped as production-only/quarantined.

The changed-input early Glass preflight ran before those expensive stages on the same synthetic
merge and hosted Chrome `152.0.7977.64` / CDP `1.3`. Run
`gha-33694235427-1-glass-preflight` passed its one exact small-phone 320×568@2 row in **92,595 ms**
(row **87,172 ms**), with zero findings, instrument failures, blocked controls or retries. It
executed **95/104** controls and retained nine lawful targeted-scope omissions. That PASS was
noncertifying and did not replace the final exact-Slice-bound Glass run.

Compendium then ran from `2026-09-02T23:26:28.114Z` through
`2026-09-03T00:05:02.341Z`, **2,314,227 ms** (about 38m35s). Slice
`gha-33694235427-1-slice` ran from `00:05:06.894Z` through `00:29:22.337Z`,
**1,455,443 ms** (about 24m15s), with zero findings/scopes and ten screenshots. Its report and raw
log SHA-256 are respectively
`0c7a1739881ca7e079a7c7e2c8f1ac3ed2a79739cbaca23a128e2fd2fc194e41` and
`af9035d5bba578aaab0f383d17daf77919f69a4a33f3873279d0a972af49a71c`.

Final Glass `gha-33694235427-1-glass` consumed that exact Slice predecessor and stopped after
**35,412 ms**. Its first small-phone row ran **31,083 ms**. The report retained **67/104**
executed controls, **37** causally blocked controls, zero omissions and zero retries. The remaining
11 viewports did not run. On a `develop` admission only evidence upload follows Glass; Recovery
and preview packaging are `main`-only.

## Retained red and corrected classification

The final report retained one `ARC4_CAPTURE_GEOMETRY_FOCUS` finding and zero instrument failures.
Its recorded Tame, Scavenge and Close outcomes were healthy. The Sample row alone combined:

- a settled button rectangle `{left:36, top:151.171875, right:284, bottom:195.171875}` whose
  centre is `(160, 173.171875)`;
- settled ancestor scroll top `2538` and the matching translated layout rectangle;
- later hit-test points at `(160, 504.171875)`, owned by `NAV`, outside the retained button
  rectangle; and
- a healthy native keyboard focus-visible witness for the Sample action.

Those values cannot describe one browser/layout epoch. The collector measured the rectangle and
scroll, then the ordinary five-second Capture authority heartbeat replaced the card DOM. The
controller restored the prior Scavenge semantic focus with bare `focus()`, which moved the
independently scrolled Survey surface from `2538` to `2207`. A later point sampler then combined
that new scroll epoch with the older retained geometry, producing y `504.171875`. Native
Tab-to-Sample itself passed.

The hosted stop is therefore **instrument**, not product or mixed. The report's old classifier
incorrectly emitted a product finding because its multi-command carrier had no same-epoch
coherence rule. The earlier canary PASS on identical source/browser is useful evidence that the
race was timing-dependent; it is not evidence that the old collector was sound or that the final
red should be retried. Cumulative PR #35 classification is now **10 instrument/infrastructure,
3 product/runtime and 1 mixed** across fourteen consumed attempts.

## Bounded successor

The repair is deliberately split at the true ownership boundary:

1. **Product presentation:** passive Capture authority rerenders restore the matching semantic
   action with `focus({preventScroll:true})`, preserving focus without taking ownership of the
   user's or harness's independent scroll position. Explicit action settlement retains its prior
   default-focus reveal behavior. Capture pools, odds, SessionRNG, Yield, ownership, rewards, save
   schema and card structure do not change.
2. **Glass instrumentation:** each action now focuses before scrolling, optionally forces one
   deterministic small-phone heartbeat replacement, reacquires the replacement node, and collects
   rectangle, ancestor scroll, translated layout, centre hit-test and focus evidence inside one
   browser-side chronology across stable frames. The heartbeat control proves quiesce/resume,
   exact document identity, completed replacement, restored semantic focus and preserved scroll.
3. **Classification:** every action/Close carrier has an explicit schema. A partially populated or
   cross-epoch carrier is instrument-red and causal-stops before product geometry assessment. A
   wholly missing product target remains coherent evidence for the existing product assessor; a
   coherent current-node point may support a product verdict. The product assessor now explicitly
   requires `focused:true` for every action and Close witness and a settled Close scroll; isolated
   mutations prove an unfocused action, unfocused Close and unsettled Close each red.

The deterministic mutation reproduces the hosted y `173` → y `504`/`NAV` contradiction and must
fail only the coherence owner. A separate product mutation models the hosted `2538` → `2207`
scroll rollback and proves the passive focus repair. No timeout, retry, browser pin, viewport,
control inventory, job or certifying stage is added or weakened.

The freshly derived Compendium measurement authority remains
`b83cbb85149e9d17207865deaf8edc3fc5d12a3e14f5c271a1f7d9110bf681da`; the current producer
authority is `c216cdc9e8d62800699bc592949726a197f3d8cb6613d1a35086ecd69a1d8cae`. Its changed built
leaves are index
`d0b1397bfe6e7f0eeb2db59d5dc424136336d5646a08bca2415a4797f2584a64`, owner
`assets/main-CwKRu39a.js` /
`5750c8a40693a6ef2c73e7692170500164f76e0e80eec506bf534c42da8c8360`, and service worker
`a58f287726ca38851665b366580e8910ed4f9d98b0a050fd17804b2d9afa8dc8`. Worker/painter bytes,
the fixed ruler, numeric ceilings, 78-outcome inventory and historical samples remain unchanged.
This is source identity, not a memory rebaseline.

At this documentation checkpoint the repair remains in the shared working tree. Focused repair and
negative-control coverage passes **53/53**. The complete browser-free `develop` profile passes
**265/265 files, 2,749 passed / 1 skipped**, all three TypeScript programs, the 34-source art audit,
1,014/1,014 live route keys with zero dead, 1,010/1,010 species, and 454 declared fields with zero
unread or inert. Its exact clean signed source and unchanged-source Compendium → Slice → full Glass
local certificate are still **pending**. No browser-chain or hosted green certificate is claimed
here.

## Permanent retained carriers

The temporary GitHub `battery-evidence` artifact is ID `9873073563`, **9,778,683 bytes**, archive
digest `sha256:56e88b3609f013ce4fd9773efebd0d5ecfb01cc23dd76219f305ad89b93d9a44`, created
`2026-09-03T00:30:06Z` and expiring `2026-09-17T00:30:04Z`.

Both unique Glass reports are preserved because the same-source early PASS/full-red contradiction
is causal evidence. The mutable `glassmatrix-report.json` pointer is not authority.

- `ARC4_GLASS_PR35_GEOMETRY_CHRONOLOGY_EARLY_PREFLIGHT_PASS_20260903_6B59B45.json.gz`:
  raw **83,698 bytes**, SHA-256
  `81d7e65cd5b5e7eae69d0c64da38476f01666cb3932b67f3da28d75dd2d1087a`; deterministic
  `gzip -n -9` **10,090 bytes**, SHA-256
  `db541bf32cc76d8d29460b44d172a57c58c8e44f2f154fbf742f781cffe2404a`.
- `ARC4_GLASS_PR35_GEOMETRY_CHRONOLOGY_INSTRUMENT_RED_20260903_6B59B45.json.gz`:
  raw **104,791 bytes**, SHA-256
  `cb1798431ec801b3a6bc499a8fb5a929da756222ca833c7ab7f41012808e48d2`; deterministic
  `gzip -n -9` **11,188 bytes**, SHA-256
  `395172d82a8cdb7f05372c60b64ceeb93370a4013561ec7cb3ba9995ec25035f`.

Both pass `gzip -t`; decompression reproduces the raw hash, and independent deterministic
recompression reproduces the gzip hash.

## Authority after the stop

The exact one-run authorization is consumed. `actions-budget-approved` is absent; PR #35 remains
Ready/open/unmerged and `develop` remains at the exact base above. There was no retry and no merge.
No current push, label, dispatch, rerun, PR mutation, merge, release, version bump, publication or
deployment authority exists. A repaired local result cannot create hosted authority.
