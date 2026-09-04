# PR #35 a922 forensic review — bounded prevention repair

**Date:** 2026-09-03 UTC

**Reviewed source:** `a922c4b74502fc4093ca103d46a189396cad1e8f` against unchanged
`develop` base `7a9f4c1370dd84292388d718c38ff34214f6203b`

**External review input:** `/Users/nick/Downloads/PR35_a922c4b_forensic_review.md`, 20,310 bytes,
SHA-256 `30dda62c165748eae0fa9dd2c76e06739efde3f6de32a5c0fa406d06c1303264`

**Result:** supported risks repaired and locally verified; a later separately authorized
branch-only handoff published the signed payload on `openai/mac` for Claude review, with no label,
hosted run, PR mutation, merge, release, version bump, publication or deployment

## Authority and scope

Nick authorized implementing the attached review's bounded prevention recommendations. That
authorization covers local code, controls, documentation, local verification and signed local
checkpoints only. It does not authorize a GitHub write or consume a hosted attempt. The historical
fifteenth PR #35 run and its 92-minute authorization remain immutable; the proposed successor
envelope is a future maximum, not retroactive authority.

After local closure, Nick separately authorized the normal branch-only push needed for Claude's
independent review. That later authority published the exact signed repair/evidence history and
current handoff to `origin/openai/mac`; it did not authorize `actions-budget-approved`, a workflow
dispatch, PR metadata change, merge, release or deployment.

The repair is confined to workflow orchestration and evidence. It does not redesign or change
Capture, Engineering, Inventory, Compendium, creatures, plants, biomes, Guardians, loot, combat,
world generation, graphics, audio, saves, rewards, odds, balance or player-facing presentation.
No v2 development release note or production identity change is warranted.

## Findings accepted, corrected and deliberately retained

The review correctly identified three material risks:

1. The outer 90-minute battery envelope and Compendium's 40-minute step cap had insufficient
   operating margin for the observed hosted durations.
2. The changed-input canary exercised only `small-phone`, while the repaired native-heartbeat
   path and the Shipyard disclosure race first became deterministic at `large-phone`.
3. A generic keyboard helper retained one exact `<summary>` object across an ordinary F4
   heartbeat even though Engineering rerenders replace that object.

Three review claims required correction before implementation:

- Run 15 began full Glass at approximately **74m09s**, not 77 minutes. A 90-minute green was
  unsafe rather than mathematically impossible. The new 120-minute outer cap is margin against
  measured variability, not a test assertion or permission to wait longer inside product code.
- Compendium completed in about **39m14s**, leaving only 46 seconds under its 40-minute cap. The
  review's attribution of its historical increase to one particular commit is not established by
  the retained evidence. The 55-minute cap is therefore an orchestration allowance, not a
  rebaseline, ruler change or causal diagnosis.
- `EngineeringPanelController` already captured disclosure/focus identity before render and
  restored the matching live replacement after `replaceChildren`. The product focus repair the
  review proposed already existed at a922. No second product implementation was added; only the
  stale evidence helper and its forced-heartbeat proof were repaired.

The mandatory artifact upload remains a hard failure by policy. The existing post-Glass summary
projection preserves terminal diagnosis through an artifact-service outage, but it does not
soft-fail upload, change Glass, advance Recovery or turn a red job green.

## Implemented prevention boundary

### Measured hosted envelope, unchanged topology

- `.github/workflows/test.yml` keeps exactly one two-minute authorization job and one battery job.
- The battery cap is **120 minutes** and the Compendium step cap is **55 minutes**.
- `tools/actions-budget-policy.js` seals both values and continues to reject added jobs, matrices,
  fanout, retries, soft failures and automatic hosted execution.
- A future exact attempt therefore has a configured maximum of **122 total runner-minutes**:
  two authorization minutes plus 120 battery minutes, once, with no retry.

### One early sequential changed-input diagnostic

The existing five-minute changed-input Glass step now runs two targeted rows sequentially on the
same unchanged committed source and canonical hosted Chrome/CDP `1.3` authority:

1. `small-phone`, retaining the five Inventory action/modal controls that own attempts 12–13;
2. `large-phone`, retaining the forced Capture native-Tab heartbeat and one forced Shipyard
   `mining` disclosure heartbeat followed by trusted native Enter.

The rows have distinct immutable run IDs and report paths. The second starts only after the first
is terminal green. Either red stops the step. This adds no runner job, shard, browser, parallel
fanout, retry or certificate; the final exact-Slice-bound 12-row Glass remains unconditional.

### Structured F4 and semantic keyboard evidence

`main.ts` now returns one exact `cf-v2-f4-heartbeat-cycle-receipt/v1` from every lawful heartbeat
exit. It distinguishes `completed`, `skipped` and `failed`, carries a typed reason, binds the live
document token, and records whether Shipyard, Compendium and Capture refreshes completed or why
they did not. Unexpected exceptions still reject rather than masquerading as a receipt.

Slice and Glass no longer carry a Shipyard `<summary>` object across a browser/heartbeat boundary.
They re-query the one current semantic target at event time, retain original disconnection and
replacement lineage, and bind full descriptor parity across setup, heartbeat initial/after,
trusted Enter receipt, event target and active control. The forced `large-phone` row requires the
ordinary heartbeat receipt to be `completed`, its reason to be null and
`refresh.shipyard` to be `completed`; Enter must toggle only the current `mining` disclosure.

Visibility is an outcome, not a stored boolean. Current evidence requires exact computed
`visibility: visible`, a 44×44-or-larger rectangle and positive cumulative opacity across the
target and all ancestors, including CSS `filter: opacity(...)` in number and percentage forms.
Controls force `visibility: collapse`, target opacity zero, ancestor opacity zero and filter-based
transparency after replacement; each must remain instrument-coherent and product-red.

### Current Glass PASS authority

The current report schema is `cf-v2-glassmatrix/v2`. A v1 report remains readable only as
historical non-PASS diagnostic evidence; neither a full nor targeted v1 PASS may certify or
publish current success. The named Glass verifier, Recovery, diagnostic projection and automated
persona consumer all require the deep v2 Shipyard heartbeat inventory for PASS.

The hosted jq verdict independently replays the exact setup, initial and post-heartbeat state,
cycle receipt, replacement facts, full descriptors, trusted Enter receipt, geometry, visibility,
cumulative opacity and exact assessment maps. It does not trust precomputed all-true booleans.

## Adversarial closure

The batch includes paired controls for stale/disconnected targets, wrong document or descriptor,
missing or skipped F4 cycle, absent/replaced/current focus, forged assessment maps, malformed
inventory, v1 PASS downgrade, synchronized blank accessible names, `visibility: collapse`, direct
opacity zero, ancestor opacity zero and incomplete hosted-jq initial state. Product-red disclosure
setup is recorded before waiting for the toggle, so an actionable product failure cannot time out
and be relabelled as an instrument failure.

Independent pre-signing rereview found and closed two adjacent carrier gaps. The forced Shipyard
path now quiesces and settles the ambient five-second heartbeat before reacquiring and binding its
deliberate-cycle baseline, so a natural heartbeat cannot replace the setup node in the narrow
setup-to-quiescence window. Zero or duplicate setup targets now require exact false/null style,
geometry and empty-descriptor facts and remain instrument-green/product-red; mismatched counts or
populated empty-carrier fields remain instrument-red. New behavioral and ordering controls cover
both directions.

Focused verification after these repairs passes **8/8 files and 73/73 tests**, all three
TypeScript programs, Glass report selftest, Arc 4 Recovery selftest, persona selftest and the
Actions policy's **66** fail-closed controls.

The first consolidated browser-free profile then stopped at exactly one intentional fail-closed
current-producer assertion because the `main.ts` evidence change had changed the generated owner
bundle. Recomputing the source graph produced Compendium producer authority
`ad74e459e00a12c516fc7fbfc17122cb53faa14ef89bdbe5d4e6776d658cb907`, with index
`cd0e95da7c7fd873dc690b5a7033bc3694f7c7a11b42cffe013731695bead12a`, owner
`assets/main-DwocSeDU.js` /
`91ef7057d47019b37c558c4f719ba91dcf7f012232443e03da36228bda91aeaa`, unchanged worker/painter
`assets/species-art.worker-DnnSDKMy.js` /
`25519cabdf0963bdc722b591855e7c7fdaaecbead63fdfa2d499bf35382f7172`, and service worker
`e9cfc8c7324bef9e1b94741fe5e83ffcc3ca9ea9ec9c96056d18e9b2dde5ca0c`. Measurement authority
remains `b83cbb85149e9d17207865deaf8edc3fc5d12a3e14f5c271a1f7d9110bf681da`; no numeric ceiling,
fixed-ruler input, outcome inventory or historical sample changed. Focused authority coverage then
passed **32/32**, and the consolidated profile passed **268/268 files, 2,785 passed / 1 skipped**,
all three TypeScript programs, art audit, override audit and specification audit.

## Clean-source local browser evidence

The implementation and its first documentation checkpoint are committed as
`f348b249c69fcbecc25cf7a8dd54bd9feb09cab5`, parent `a922c4b…`, tree
`5f9bae1466f84366e3801832738d76148be9d159`. The commit object contains an SSH signature. This
clone has no configured `gpg.ssh.allowedSignersFile`, so local Git cannot map that signature to an
allowed identity; the audit records the signed object without claiming identity verification.

All browser work below ran once/no-retry from that unchanged clean commit with Microsoft Edge
`152.0.4191.53`, CDP `1.3`. Browser preflight passed capability contract SHA-256
`35eb09daa39f211b8e9015f59b77a983b5870611322d673c47f7ff4f2b61e341`.

Compendium run `20260903163424801-81698-61f9306500` passed all **78/78** expected outcomes in
**70,593 ms**, with zero blocked outcomes and zero findings. Begin/end source both bind exact
commit `f348b249…`, branch `openai/mac`, committed state and empty-status SHA-256
`e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`. The current report
SHA-256 is `8dcaf50316fa93f50f34bb7c2047890606931937de47f4f0b8c9e00386a48491`; the named
`--verify-run` invocation passed. Observed measurement and producer authorities exactly match the
tracked values above.

The requested Glass follow-up was deliberately diagnostic rather than certifying. Each row below
has `scope=targeted-diagnostic`, `schema=cf-v2-glassmatrix/v2`, exact matching start/end commit,
terminal PASS, zero findings and zero instrument failures. Each command exited zero only after the
report's post-write verifier accepted it.

| Viewport | Immutable run ID | Viewport / report ms | Report SHA-256 |
|---|---|---:|---|
| `large-phone` | `20260903-pr35-forensic-f348b249c69f-large-phone` | 12,891 / 15,510 | `a042c7fb7a86c49e023e955780fe6f3a39be42c714b31aa2558a7e3d2662ed20` |
| `phone-landscape` | `20260903-pr35-forensic-f348b249c69f-phone-landscape` | 13,004 / 15,959 | `b083c18d90b5df594ba1403eedc96ad9e401190f99e03521412a4fe18b6bced2` |
| `tablet-portrait` | `20260903-pr35-forensic-f348b249c69f-tablet-portrait` | 12,358 / 14,965 | `c0f9bdafe9768cf165e5c2f0fe28980df6b6a7e84dcb40e64c00a2e0ba4f8391` |
| `tablet-landscape` | `20260903-pr35-forensic-f348b249c69f-tablet-landscape` | 12,231 / 14,871 | `7dafd1020b887e5349f7eb1fc9a23691a93cab6f8981cdbe7cd916cc1e2607d1` |
| `laptop-720p` | `20260903-pr35-forensic-f348b249c69f-laptop-720p` | 11,347 / 14,142 | `e6e0d85c27bd9f24cd5d7248085723a6c835395a2f91ad1465f8e5a2409edf0a` |
| `desktop` | `20260903-pr35-forensic-f348b249c69f-desktop` | 11,854 / 14,678 | `a3daa5c7d6284b908eeaa06d85c44d11e576e978273d5a3a103a3cb8a192bbbe` |
| `desktop-1080p` | `20260903-pr35-forensic-f348b249c69f-desktop-1080p` | 11,314 / 13,909 | `712a98bef069f36a7846b2553301be2356b876b6f33c22813ec183fd2d3a69d8` |
| `ultrawide` | `20260903-pr35-forensic-f348b249c69f-ultrawide` | 11,069 / 14,065 | `3f904bad8559a2b41cbcb86fb2ae935cce1089056ea2629a1dacf6795197c584` |
| `desktop-8k` | `20260903-pr35-forensic-f348b249c69f-desktop-8k` | 11,749 / 14,177 | `08232e9d53ecf97b3b5213638c789f1724fb9f6635631da06b4bf09a5db1fa14` |

These nine rows do not claim the omitted `small-phone`, `compact-phone`, or `primary-phone` rows,
or the full 12-viewport matrix; they do not have a Slice predecessor and cannot authorize Glass
certification, Recovery, hosted success or merge. They close only the bounded local forensic
follow-up Nick requested.

## Future hosted boundary

No hosted attempt is authorized by this audit. Before any future PR #35 run, the final clean
signed head must pass local evidence and Nick must authorize that exact `test-battery` workflow,
exact head, unchanged base, `actions-budget-approved`, maximum **122 total runner-minutes**, and
no retry. Only a terminal-green exact attempt may permit PR #35 to merge normally into `develop`.
Artifact upload remains mandatory and hard-fail.
