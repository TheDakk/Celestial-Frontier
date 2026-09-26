# G5 adapter unblock — C43(a)/(b), 2026-09-26

Matches source as of 2026-09-26. Codex owns the worker admission, padding and
transport implementation; Claude owns the game adapter and routing. This does
not change G1 admission, the finisher strength/steps, or the conservation gate.

## Source dimensions and canvas

The active `creature-finish-math.mjs` admission accepts integer source dimensions
128–2048 inclusive. The original source remains at (0,0). The worker pads only the
right and bottom to the next multiple of16, with zero RGBA/zero ownership labels.
1254×1254 therefore uses a1264×1264 work canvas. There is no scale, crop of source
paint, landmark shift, or resampling. The existing four-pixel erosion and latent
mask thresholds apply to that padded canvas. Padded pixels are never editable.
The original source RGB/alpha is copied first, only admitted interior RGB is
replaced, and the result is cropped back to the original dimensions. The existing
`finish-conservation.mjs` remains unchanged and measures original coordinates.

The result adds `width`, `height` and
`workCanvas:{width,height,paddingRight,paddingBottom}` as provenance. Aligned
sources, including the five880² crabs, receive zero padding. The separate old
experiment-shaped admission in `kit-engine-math.mjs` is unchanged; it is not the
active shipped `creature-finish-v1` worker path.

## Transferred input contract

`compileCreatureFinishV1` now accepts the exported `CreatureFinishImageV1` union
for both master and labels:

```
{width, height, sha256, buffer: ArrayBuffer}
// OR the retained native-harness transport:
{width, height, sha256, url: '/inputs/<id>.rgba'}
```

Use ordinary owned ArrayBuffers and list both in `worker.postMessage`'s transfer
list. Hash the **original unpadded RGBA bytes**. The worker snapshots and verifies
exact `width*height*4` length and SHA-256 before constructing its model engine.
The engine rechecks before inference. URL and buffer together, neither transport,
wrong URLs, detached/shared/resizable buffers, wrong lengths, wrong SHA and
mismatched master/label dimensions all refuse. No Blob URL/network policy was
expanded. Phone tier refusal and fixed finisher settings stay intact.

The game adapter should pass fresh transferable copies of the engine callback's
RGBA and labels; never detach the callback's immutable source buffers. It retains
labels/binding equality and sends the returned original-size RGBA to the existing
lossless PNG engine. The worker's old Canvas preview blob is not the retained PNG
producer; the engine's exact codec remains the retained-output authority.

## Verification

- `focused-tests.log`:12/12 pass, including1254 padding, unchanged source and label
  bytes, partial alpha/hidden RGB preservation, padding exclusion, wrong canvas
  shapes, reference corruption/ambiguity, detached/shared/resizable buffers, and
  actual worker dispatch refusing corrupt bytes before model construction.
- `worker-regression.log`:14/14 existing worker/kit orchestration tests pass.
- The initial worker-dispatch test lacked stub `ort`/`Tokenizer` bindings after
  stripping imports. Its diagnostic is retained in
  `focused-tests-instrument-setup.log`; supplying those dependency stubs fixed
  the test setup. No production rule was relaxed to pass it.
- Native runner syntax and browser client bundling pass. Application TypeScript
  result is reported to the parent batch when it completes.

## Native harness and required proof (attempt below refused)

`native-runner.mjs` uses the shipped Cougar source
`audits/ART_BATTLE_FOCUS_20260925/cougar-repair-03/fit-03`, whose original master is
1254². `native-client.ts` exercises actual `postMessage` transfer lists and asserts
sender buffers detach. Before the single real inference it submits corrupted
transferred label bytes and requires refusal with zero model progress events.
The real output must be1254², report1264² internal canvas, pass unchanged
conservation, cache/deduplication, and exact delivered-original reuse through a
fresh IndexedDB store with zero phone model construction. The host rechecks
conservation and unchanged source hashes. There is no new fit or G2 admission.

```
node audits/G5_ADAPTER_UNBLOCK_20260926/native-runner.mjs /private/tmp/cf-g5-native1254-NEW
```

Any future native attempt needs a fresh clean signed source and the shared native slot; do not retry the unchanged refused source. The alpha-eligibility decision below remains pending.
No quality acceptance or physical-iPhone qualification is implied by this proof.


## Native attempt and bounded eligibility inventory (retained refusal)

The single authorized run on signed
`bfe76a6bbfa1303c73976944cc1a9be316836a88` **REFUSED** the unchanged Cougar source
with `No editable creature interior`. It did not produce a finished PNG or start
model inference. The valid job's source dimensions were 1254² and its padded
canvas 1264². The corrupt-transfer control was refused before any model progress;
four buffers detached across the negative and valid submissions. This is a
retained valid refusal, not a successful native1254 proof.

`native-bfe76a6b-refused/result.json` preserves the complete native result and
`source-stats.json` identifies the exact source pins and alpha distribution.
Cougar has 375,802 painted pixels but only193 alpha255 pixels; most of its
interior is alpha253, so no original pixel has the required fully opaque9×9
same-owner neighborhood.

The subsequent bounded read-only inventory (`eligibility-inventory.mjs`, `.json`
and `.log`) verifies the master, canonical record and labels pins for all34
labels-present sources among the38 pinned archetypes. Only the five880² crabs
are eligible; **zero1254 sources pass**. Wolf and Salmon also have zero original
editable pixels. Padding does not change the editable-pixel count. No alternate
subject was inferred, no alpha was normalized, and no threshold changed.

The pre-model eligibility check now runs the **same existing padded mask** inside
`prepareCreatureFinishJob`, after exact input hash checks and before the worker
constructs its GPU/model engine. The engine recomputes the mask rather than
trusting a caller-supplied derived mask. The worker-dispatch negative control
proves a correctly hashed alpha253 source refuses with zero engine constructions,
and the alpha255 positive control still reaches the engine. Results are in
`pre-model-eligibility-tests.log`.

A proposed alpha>=250 eligibility decision is pending separately. This packet
neither adopts that proposal nor claims the requested real1254 native proof has
passed. Original alpha bytes, fixed boundary width, labels/binding equality and
the existing conservation gate remain unchanged.


## Final integrated result and handoff

The final browser-free develop profile has **5,635 PASS, one FAIL (I5), two expected failures and two skips** across560 files. All seven manual owners pass: root/app/worker TypeScript, artaudit, overridecheck, speccheck and overridecontrol. Root validate passes with zero boot errors,1010 rendered Earth species and the unchanged50-probe v1.0 fingerprint. `final-battery/results.json` binds logs and changed code hashes.

The first integrated run exposed two repairable test issues: an old119/118 bulletin-count control and a test hash helper receiving a Uint8ClampedArray union. Updating the count pair to120/119 and explicitly copying the guard output into Uint8Array preserves the complete assertions. `pre-repair-battery` retains that run. Only the failed profile and app TypeScript owner were repeated; the six unchanged passing manual owners were carried forward. C45's earlier app check preceded its last test assertion; the final integrated app check is authoritative.

C41/C45 stage and phone contracts are complete in this lane (`C41.md`, `C45.md`). Stage composition is verified finish → existing individual morph → protected alpha check → seam guard. The in-place alpha-baseline alias is repaired. Fifteen focused stage/pinned/morph tests pass. No delivered finished originals or runtime library entries are published here.

C43's size/transfer code and pre-engine rejection are complete, but **the real1254 finish proof remains blocked**: the unchanged alpha===255 mask admits zero editable interior on every labels-present1254 source. Nick's proposed alpha>=250 eligibility decision is pending; no threshold or conservation gate changed. Do not claim native1254 acceptance or publish a nonexistent finished PNG.

The one six-case fit refinement was rejected; all six reds remain explicit in G1_FIT_REPAIR_20260926. G2_FAMILY_PILOT_20260926 retains20 unedited1254 masters, one sheet and independent observations. G4_COPY_REMEASURE_20260926 records the one120-bullet copy measurement. D24 remains open, D25 off, G1 red and S4 parked.

Cleanup removed82,199,096 bytes of ignored rejected-fit copies and completed native preparation scratch, retaining original inputs, full reports, hashes and reproduction scripts. Finder metadata has a temporary backup; only the three permanent worktrees and newest two previews remain. Free disk227GiB. See `cleanup.json`.
