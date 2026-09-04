# PR #35 tenth hosted attempt — SceneMemory allocator-phase instrument red

Date: **2026-09-02**
Status: **immutable consumed red; no retry; no product verdict; no successor-stage authority**

## Exact hosted boundary

- Workflow: `test-battery`, GitHub run `33584052508`, attempt `1`
- Authorization job: `100104337298` — PASS
- Required `battery` job: `100104355093` — terminal FAIL after 6m19s
- Exact head: `18c088de4388edf58eda2c192b71cb94156e26e7`
- Exact base: `7a9f4c1370dd84292388d718c38ff34214f6203b`
- Synthetic merge: `48c72f436ae7156b3c110ca061acd81ac146e6ed`
- Terms: owner-applied `actions-budget-approved`, 92-minute maximum, one attempt, no retry

Every stage through the root 10-viewport Layout ruler passed, including all **787/787** sealed
outcomes and evidence freshness. The current Edge package installed successfully. The first and
only red was the next step, `scene-memory fixed-eighth phase-validity selftest`, after 1.56 seconds:

```text
fixed-eighth sampler did not converge its validity pair
(embedderHeapUsedSize absolute phase delta 532800 exceeded ceiling 65536;
 aggregate absolute phase delta 532800 exceeded ceiling 65536)
```

The stack terminates at `port/v2/tools/scenemem.mjs:1658`. Node was `v26.8.1`. The derived
aggregate breached by the same reported absolute magnitude; it is computed from the component
counters rather than sampled as a separate metric. The failed run emitted no raw pass carrier, so
the signed component directions are not recoverable. The 532,800-byte movement is 8,512 bytes
above the control's deliberate 524,288-byte retained `Uint8Array` allocation.

## Instrument, not product

This selftest opens `about:blank`, installs a synthetic ticker/carrier and is designed to retain
one controlled typed array across each of four cycles. This run stopped at the first cycle's
validity assertion after retaining one array. It does not load Celestial Frontier, create a
SceneMemory product contract, evaluate a memory verdict or produce game outcomes. All adjacent
structural checks were clean: the error
reported no pass-inventory, label, ticker, document, resource, aggregate-detachment, V8-used or
backing-storage reason. The threshold assertion stopped before the later eight-lane growth and
release controls. Cleanup completed; otherwise the terminal error would have been replaced by the
cleanup failure.

The exact SceneMemory tool blob `835c0ab24fac93a9afedbc5cbd49555c323c4cdf` was unchanged across
the immediately preceding hosted heads and this one. Runs `33542791572`, `33560546382` and
`33572309149` all passed the same live control on Edge `152.0.4191.53`, V8 `15.2.23.6`, CDP `1.3`,
Node `26.8.1` and Ubuntu image `20260823.283.1`; every retained-growth lane was exactly 524,288
bytes/cycle and every embedder/backing phase delta was zero. The failing run used a different
physical worker/region and proved canonical Edge/CDP `1.3`, but exact Edge point provenance is not
printed on the failing path. A one-attempt local diagnostic on Node `26.7.0`, Edge
`152.0.4191.53` and CDP `1.3` also passed with the same eight exact slopes and zero
embedder/backing deltas. The comparison strongly diagnoses mutable host/runtime allocator phase;
it is not a game regression or authority to rebaseline a compatible browser point version.

The result repeats the already-preserved `cc15e1f…` fixed-eight candidate-1 class, which stopped at
phone warm-1 P8−P7 embedder/aggregate 287,192/299,720 bytes against the same 65,536-byte hard cap.
That hard stop quarantined SceneMemory certification and product evidence to production and
forbids retries, ceiling widening, extra passes, version rebaselines or another sampler redesign
in this campaign.

## Why it ran and bounded correction

The exact PR diff classified 895 paths with legacy, art-instrument and the former combined browser-
instrument flags all true. SceneMemory itself and shared browser tooling genuinely changed, so
this was not a path-classification false positive. The policy defect was ownership: one broad
browser flag made a known host-sensitive native-heap control beside the production-quarantined
certificate a fail-fast `develop` blocker, contradicting the adjacent workflow statement that host
allocator phase must not block ordinary integration.

The bounded successor changes only admission ownership:

1. current-Edge installation, live fixed-eight selftest, certification and named verification are
   all production-only and remain strict/fail-fast there;
2. deterministic SceneMemory contract, pass-order, threshold, detachment, forged-evidence and
   historical-red controls remain universal in the v2 static suite;
3. the former combined browser-instrument classifier is split so Compendium controls respond to
   Compendium/shared inputs and the generic Chrome launcher control responds only to shared
   transport inputs;
4. `develop` still requires its complete Compendium → Slice → Glass chain on one unchanged source.

No game source, SceneMemory collector, 64 KiB ceiling, eight-pass policy, 512 KiB allocation,
128 KiB/cycle slope, product ruler, browser-family contract, timeout or retry rule changes.
Production remains blocked pending Nick's explicit future SceneMemory activation decision.

## Local successor status

The ownership/scope successor is still an uncommitted local candidate and therefore does not yet
authorize another hosted attempt. Current verification is green: focused workflow/evidence owners
**3 files / 27 tests**; complete `develop` profile **263/263 files, 2,719 passed / 1 skipped**;
all three TypeScript programs; **34** clean art sources; **1,014/1,014** routes; **454** active
fields; the complete art mutation control; browser-path selftest; Compendium browser-preflight
selftest; Compendium **618-control** selftest; and the shared browser-CDP selftest. Independent
review, exact signed clean-source preflight and one fresh Compendium → Slice → Glass chain remain
required before requesting a new exact-head authorization.

## Artifact and stopping state

Artifact `battery-evidence` is ID `9829548871`, archive size 33,817 bytes, digest
`sha256:ed2161535f9d5ddfe3c4f606403d07f540a4cd7f359120f0515b2a4e35085213`, expiring
`2026-09-16T02:46:18Z`. It contains only the three root Layout evidence files because SceneMemory
failed before it could emit a report. Compendium, Slice, Glass, Recovery and preview packaging
correctly skipped; the Compendium instrument and shared Chrome-launcher selftests also did not run.
The authorization is consumed; no retry, merge, release or deployment occurred.
