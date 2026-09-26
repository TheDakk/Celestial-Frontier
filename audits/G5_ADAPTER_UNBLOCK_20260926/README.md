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

## Prepared native proof (pending signed clean source)

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

Do not run before the parent signs a clean checkpoint and grants the native slot.
No quality acceptance or physical-iPhone qualification is implied by this proof.
