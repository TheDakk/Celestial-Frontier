# G5 reusable per-individual finisher engine — 2026-09-26

Matches engine code as of 2026-09-26. This is the engine delivery to Claude's G5
routing owner. It does **not** claim gameplay routing, physical-phone model
qualification, G1 admission, or Nick's visual-quality acceptance.

## Delivered contract

`port/v2/apps/game/src/creature-finish-engine.ts` exports
`createCreatureFinishEngineV1` and `creatureFinishIdentityV1`. The caller supplies
an admitted source PNG, the original RGBA label map, decompressed binding bytes,
and their expected SHA-256 pins. G3's trusted manifest resolver remains responsible
for selecting admitted inputs and pinning network delivery. Source admission is
not inferred from the finisher's pixel-conservation result.

The immutable `creature-originals` store is injected directly (use the existing
`createAiCreatureOriginalStoreV1` in the browser). The effective settings identity
binds exact individual ID, genome visual key, original settings SHA, seed,
dimensions, labels SHA and binding SHA. Record recipe, source PNG and model SHA
remain the other three existing store identity fields. Same-species individuals
therefore do not share a cache entry accidentally.

The default queue bounds four total running/waiting unique requests (configurable
1–8), deduplicates exact requests, and runs one at a time. It snapshots source
buffers before enqueueing. A full queue returns a painter fallback; it does not
spawn another model or schedule a retry. Closing stops queued work and prevents
an in-flight result from being retained. The caller owns disposing its injected
worker/model; engine close does not terminate a caller-owned worker.

Resolution is validated retained original → validated delivered original →
capable-desktop inference → explicit painter fallback. `createInfer` is a lazy
factory, never called by the phone path. Inference receives copies of source
pixels/labels/binding, exact individual and visual IDs, seed, record recipe SHA,
model SHA, and original settings SHA. The adapter must verify that its actual
model/settings match those pins. It returns finished RGBA plus unchanged labels
and binding bytes. No model, Worker, WebGPU, Canvas, or inference runtime is
imported by the engine itself.

The **existing `finish-conservation.mjs` is unchanged**. It runs on produced pixels
and on the decoded encoded PNG. Exact source/output labels and binding equality
are checked separately, including mutations to the callback's source buffers.
An all-zero ownership map is refused rather than accepting a vacuous part gate.
Partial alpha and RGB underneath zero alpha survive the existing straight-alpha
PNG codec exactly; there is no Canvas roundtrip, resizing or lossy compression.

Engineering payload bounds are at most 4,194,304 pixels, 8 MiB PNG, 16 MiB binding
and the existing 1 MiB receipt limit. These protect a bounded request; they do not
change sealed admission or conservation thresholds. Existing/delivered originals
are hash-, receipt-, dimension- and conservation-verified before use. Corruption
returns a fallback and does not trigger inference as an automatic repair.

## Focused verification

From `port/v2`:

```
npx vitest run tests/creature-finish-engine.test.ts
npx tsc --noEmit -p apps/game/tsconfig.json
```

13/13 focused tests pass (`focused-tests.log`); application TypeScript passes.
Controls cover exact-request deduplication, distinct individuals, serial execution,
immutable cache reuse, zero phone model construction, delivered-original reuse,
alpha/outside-RGB/labels/binding/source-mutation/boundary-gradient refusals,
wrong source pins, empty labels, queue saturation, caller buffer reuse,
close-before-retain, corrupt delivery, and each cache-key axis. A positive control
changes visible RGB while preserving translucent alpha and hidden RGB, proving
that the test is not limited to unchanged output.

These focused tests use a memory implementation of the existing store interface
and deterministic injected inference; they are not an IndexedDB or native-model
performance claim.

## Prepared native proof (not yet run)

`native-runner.mjs` adapts the existing `finish-master.mjs` harness to this engine.
It uses only the five already-admitted crab fits under
`audits/ANATOMY_COMPLETION_20260917/crab-fits-03`, the cached pinned model and the
unchanged kit worker. The client runs five actual model inferences and verifies
exact-request deduplication plus subsequent cache reuse. It then closes the
store, deletes its isolated-origin database, and tests all five delivered PNGs
in a fresh real IndexedDB store with Worker construction forbidden and zero
phone factory calls. A missing delivered individual must fall back. The host
rechecks each retained PNG through the unchanged conservation instrument.

Run on a clean signed head, with the workspace lock and approved out-of-sandbox
browser execution:

```
node audits/G5_FINISHER_ENGINE_20260926/native-runner.mjs /private/tmp/cf-g5-native-NEW
```

A phone path exercised in desktop Chromium is not physical iPhone qualification.
The harness retains original labels and binding bytes; it does not create a new
fit or admit any G2 pilot image. Its real model output still needs Nick's quality
review and Claude's game routing. Native results are added only after execution.

## Remaining owner work

Claude routes admitted G3/G4 sources and the landfall queue into this engine,
provides the model adapter/capability policy and trusted finished-original delivery,
and binds the returned texture into the existing unchanged geometry. Codex owns
engine/native finisher evidence. Phones consume delivered finished PNGs; actual
phone delivery/rendering remains a separate qualification. G1 is still red and
G2 pilot masters are not substituted for admitted rigs.

Disk at engine batch start: 232 GiB free on `/System/Volumes/Data`.
