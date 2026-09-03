# PR #35 fifteenth hosted stop — native Tab identity and diagnostic retention

**Date:** 2026-09-03 UTC

**Hosted workflow:** `test-battery` run `33708487067`, battery job `100502739510`, attempt 1

**Authorized head/base:** `d529a9727c29fca3cd9f337a5bb4fc2577ceaec3` →
`7a9f4c1370dd84292388d718c38ff34214f6203b`

**Result:** terminal full-Glass red plus an independent artifact-service timeout; no retry and no
merge

## Immutable source and authorization boundary

Nick authorized exactly one PR #35 `test-battery` attempt for the head/base above, using
`actions-budget-approved`, with a 92-minute maximum and no retry. GitHub tested synthetic merge
`ca4abf67ec6eb030642ea925b02f641a2873d88c`, whose parents are the exact base followed by the
exact head. Its tree `65927bf068b2bfa01f91c51dbce614d41ba6f254` is byte-identical to the
exact head tree.

The battery job used about **82m45s** total. Compendium used about **39m14s**, Slice about
**24m32s**, and terminal full Glass about **5m45s**. The exact authorization was consumed by this
single attempt. It was not retried, PR #35 did not merge, `develop` did not move, and the
`actions-budget-approved` label was removed.

## Passed predecessors and exact terminal stop

Authorization and policy checks, legacy browser-free checks, v2 static/art/routing/specification
owners, the shared launcher, the changed-input early small-phone Glass preflight, root Layout
**787/787** plus verification, Compendium **78/78** plus named verification, and real-browser
Slice plus exact binding all passed. SceneMemory correctly skipped because it is
production-only/quarantined.

Full Glass consumed the exact Slice report whose SHA-256 is
`fc488de105b3951ad8b3d6ca1a0dfe7a803e91f8a71241ff873e8123d0457cb3`. It passed the earlier
rows and reached its fourth viewport, `large-phone`, before stopping once with exactly one
`ARC4_CAPTURE_NATIVE_SURVEY_RETURN` finding. Every retained check in that outcome was true except
`idleKeyboardFocus:false`; every earlier viewport and every other recorded clause was green. The
failure occurred before the remaining Glass viewports, and the no-retry rule was honored.

The later mandatory evidence upload independently found **27 files**, then failed
`CreateArtifact` with `ETIMEDOUT`; GitHub created **zero artifacts**. The aggregate job log retains
the terminal Glass line and finding, but the complete Glass report JSON was never uploaded and is
now unrecoverable. Therefore this audit does not invent a Glass report hash, report carrier,
artifact ID or archive digest. The upload outage happened after, and did not cause or alter, the
earlier Glass exit.

## Causal diagnosis and supported classification

The old native-Tab helper retained the exact Scavenge and Sample DOM objects acquired during
setup, across a possible ordinary five-second Capture authority heartbeat, the native CDP Tab,
and final assessment. A healthy heartbeat replaces those DOM objects while preserving the same
semantic controls. The current replacement Sample can therefore own focus while comparison with
the disconnected old Sample incorrectly reports `idleKeyboardFocus:false`.

Loss of the complete hosted JSON prevents absolute event-by-event reconstruction. The audited
source defect and the exact retained failure signature nevertheless support treating this stop as
an **instrument/harness** failure for repair governance, not as proof of a broken player action.
Across all fifteen consumed PR #35 attempts, the ledger is now **11 instrument/infrastructure, 3
product/runtime and 1 mixed**.

## Bounded native-focus repair

The repair follows semantic identity through a real rerender rather than extending a stale object
lifetime:

1. Setup records `cf-v2-glass-arc4-native-tab-setup/v1`; the native listener records the first
   trusted Tab receipt regardless of whether the event began on the expected prior control, and
   the collector re-queries the current prior control.
2. The exact `large-phone` path forces one real F4 heartbeat after setup and before native Tab.
   `cf-v2-glass-arc4-native-tab-heartbeat/v1` validates quiesce, resume, completed heartbeat,
   continuing run state and unchanged document identity. It requires the original Scavenge and
   Sample nodes to disconnect, reacquires both semantic replacements, and requires focus to be
   restored to current Scavenge before Tab.
3. `cf-v2-glass-arc4-native-tab-focus/v1` records the same-document trusted Tab receipt, current
   connected controls, semantic lineage, settled scroll, current active semantic key and focus
   paint. `cf-v2-glass-arc4-native-tab-assessment/v1` keeps transport/schema/document/receipt
   facts in the instrument verdict and current-control/lineage/restoration/scroll/focus facts in
   the product verdict.
4. Visible focus now requires a painted decoration with nonzero color alpha and a real computed
   style change. A transparent outline cannot satisfy the product outcome.

Deterministic controls cover a missing or wrong receipt, wrong document identity, prior-focus loss
before Tab, missing current target, focus loss after an accepted receipt, and transparent focus
paint. Each viewport now emits a concise `START` followed by one
`PASS`/`PRODUCT-RED`/`INSTRUMENT-RED` line with duration and bounded diagnosis counts. No browser,
viewport, retry, timeout, job or certifying outcome was added, removed or weakened.

## Fail-closed post-Glass diagnostic retention

The workflow now runs one browser-free `retain exact Glass terminal diagnostic` projection
immediately after Glass whenever Glass was not skipped. The projection validates the exact
immutable terminal report against `CF_V2_GLASSMATRIX_RUN_ID`, source, profile, Slice ID/hash
binding, exact 12-row inventory, completed timing prefix and terminal state. A valid terminal PASS,
product red or instrument red may be projected; a missing, still-running, malformed or
wrong-bound report fails closed.

The projection places bounded first-red diagnosis, viewport timings, report hashes/sizes and a
deterministic gzip/base64 carrier of the complete report in `GITHUB_STEP_SUMMARY` under schema
`cf-v2-glassmatrix-diagnostic-projection/v1`. It neither converts a Glass red into green nor
replaces Glass, named verification or mandatory artifact upload. It adds no retry, browser,
timeout or workflow job. This closes the future diagnostic-retention gap, but it cannot recreate
run `33708487067`'s already-lost full JSON.

## Independent review and local verification

The independent native-focus review and independent diagnostic-projection review are both
**CLEAR**. Focused combined tests pass **24/24**; the diagnostic/evidence-chain subset passes
**12/12**; Actions policy passes **64/64**. Glass selftest, TypeScript typecheck, syntax and diff
checks are green.

Targeted local Edge/CDP run `20260903043639066-7926-2f4122517015` passed the exact
`large-phone` row in **11,037 ms**, with **3/3** Arc 4 outcomes, zero findings and zero instrument
failures. Its raw evidence proves:

- initial Scavenge and Sample were connected and Scavenge was focused;
- the same document identity survived quiesce, resume and the completed heartbeat;
- both original nodes disconnected, both current semantic replacements were acquired, and focus
  was restored to current Scavenge;
- the trusted native Tab receipt originated on current Scavenge with semantic key
  `capture:scavenge`;
- current Sample was connected and focused with active semantic key `capture:sample`, settled
  scroll, stable replacement identity across its two scroll samples, and painted visible focus;
  and
- the final focus decoration changed to a solid, nontransparent `rgb(255, 217, 106)` outline.

That targeted run is a noncertifying diagnostic, not a substitute for a future authorized hosted
certificate.

The complete browser-free `develop` profile passes **266/266 files, 2,758 passed / 1 skipped**,
all three TypeScript programs, **34** art sources with zero findings, **1,014/1,014** live route
keys with zero dead, **1,010/1,010** species, and **454** declared fields with zero unread or
inert.

Compendium measurement and producer authority remain, respectively,
`b83cbb85149e9d17207865deaf8edc3fc5d12a3e14f5c271a1f7d9110bf681da` and
`c216cdc9e8d62800699bc592949726a197f3d8cb6613d1a35086ecd69a1d8cae`. The fixed ruler, numeric
ceilings and 78-outcome inventory are unchanged; this is not a rebaseline.

## Preserved product and release scope

This bounded batch changes Glass evidence identity, deterministic controls and diagnostic
retention only. It does not change Capture mechanics, pools, odds, SessionRNG, Yield, ecology,
ownership, rewards, saves, card structure, creatures/genomes, plants, biomes, Guardians, world
generation, loot, graphics or audio. It has no player-visible release note, release version,
production identity, Gate/HUMAN closure, publication or deployment effect.

No push, label, workflow dispatch, retry, PR mutation, merge, release, version bump, publication
or deployment is currently authorized. A future hosted attempt requires a new exact
workflow/head/base/minutes/no-retry authorization; PR #35 may merge into `develop` only if that
exact future attempt is terminal green.
