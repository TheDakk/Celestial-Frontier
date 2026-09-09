# Browser local-image proof

Matches implementation as of September9,2026. An isolated authoring experiment for Celestial
Frontier's browser proof of concept; the full engine game comes later. This is not a shipped
game dependency, a selected product model, or a claim that the art requirement has passed.

The browser executes Qwen text encoding, reference VAE encoding, FLUX.2 Klein denoising and VAE
decoding on WebGPU. A loopback HTTP server serves exact files only. It performs no inference.
Each stage owns a fresh worker, and the parent terminates it before proceeding. Cancellation,
timeouts, model/data corruption, nonfinite tensors and GPU errors stop the run. There is no remote
inference API, login, fallback generation or player setup flow in this proof.

## Pinned inputs

- `model-manifest.json`: exact20 runtime model files6,691,020,416 bytes plus7,792-byte model README.
  Conversion `cgb/flux2-klein-4b-onnx-webgpu` at3bffc0efef1d9f84727036cdbc44df3b6ab51131.
- Local `package-lock.json`: ORT Web1.29.0/MIT and Tokenizers0.2.0/Apache-2.0. Install scripts
  disabled. The root and game lockfiles are untouched.
- `source-contract.md`: inspected ONNX graph contracts, actual encoder/decoder128-channel
  packing, Qwen chat/right padding, reference IDs and pinned official scheduler. The model README
  has stale decoder/scheduler details; these are explicitly resolved against primary source.
- `proof-server.mjs`: one canonical Earth request and complete19-organism source snapshot,
  one fixed prompt/noise recipe and a hash-checked approved scene reference, with optional selected Civet identity reference. The six depicted species
  remain Civet, Platypus, Frog, Persimmon, Cranberry and Devil’s Club. Pixels do not create game data.

Weights live in the existing ignored `port/v2/apps/game/smoke/local-image-generation/` cache.
Never commit them or fold them into the existing128MiB game pack. Model bytes, dependency/runtime
bytes, temporary files, saves and the disposable rendered-image cache are separate budgets.
Read `THIRD_PARTY_NOTICES.md` before any future redistribution.

## Local commands

From the repository root, after ROADMAP/process/toolchain startup. Run one foreground owner at a
time. On macOS browser-owning commands require approved outside-sandbox execution on their first
attempt. No hosted action is part of these commands.

```sh
# Inspect inventory: no network or cache write.
node tools/local-image-generation/fetch-model.mjs

# Explicit development model download, stops at first failure and retains a receipt.
node tools/with-toolchain-lock.mjs --label local-ai-model -- node tools/local-image-generation/fetch-model.mjs --download

# Pure math plus localhost download-integrity controls.
node tools/with-toolchain-lock.mjs --label local-ai-controls -- node --test tools/local-image-generation/pipeline-math.test.mjs tools/local-image-generation/download-controls.test.mjs tools/local-image-generation/browser-lifecycle.test.mjs tools/local-image-generation/half-storage.test.mjs tools/local-image-generation/gpu-profile.test.mjs

# Actual native GPU compute; choose a new evidence filename.
node tools/with-toolchain-lock.mjs --label local-ai-gpu -- node tools/local-image-generation/probe-webgpu.mjs /private/tmp/cf-ai-gpu-new.json

# Source-bound browser run; choose a new evidence directory for each changed attempt.
node tools/with-toolchain-lock.mjs --label local-ai-inference -- node tools/local-image-generation/run-browser-proof.mjs /private/tmp/cf-ai-inference-new
```

`run-browser-proof.mjs` verifies every cached model file before opening its isolated browser. It
records exact source hashes, full recipe, stage events, model verification, raw PNG/hash, browser
identity and cleanup. `--preflight` checks page capability without inference or model verification;
`--without-reference` is a deliberately separate ablation, never a silent fallback. A failure
does not start another attempt. Inspect and correct the cause before a changed attempt.
`--identity-reference` adds the exact selected Civet alongside the full scene, with a declared
opaque matte and separately hashed prepared pixels; it cannot accompany `--without-reference`.
`--resolution=1024x576` selects one explicit larger native output. Default remains768×432;
reference sizes stay512×288 and480×320. This changes generated token count and the scheduler's
resolution-derived shift; it is not upsampling or a claim of identical compositions.

`--profile` enables the exact ORT1.29 native profiler and requires timestamp-query. It cannot
accompany preflight. Five bounded per-stage raw traces/summaries at most retain GPU microseconds
separately from overlapping Node host spans. Missing/invalid/incomplete/capacity-overflow traces
fail the run. The original group-limit instrument failure stays in the packet; the corrected
native chain passes all five stages. Raw output matches the unprofiled dual-reference768×432
painting byte for byte on this specific Mac/model/recipe. This is not cross-device determinism.
The sampler's quantized matrix kernels consumed95.5% of observed GPU time in that profile.

`--q8-block32` selects the separate verified derivative created by
`tools/local-image-repack/`, never changes the default/original model, and refuses preflight.
The repository `q8-block32-manifest.json` pins actual graph4,991,273bytes and data347,332,608bytes.
Both are freshly hashed before serving; parent shards stay at their verified canonical location.
Only the denoiser changes. The original quantized values, scale and zero operands are preserved;
GPU accumulation order can differ. This remains an unqualified development option.

The first same-recipe768×432 native comparison completes in69,029ms versus238,809ms original.
All412 Q8 dispatches use `MatMulNBitsWideTile`; sampler GPU duration drops206.66s→33.33s.
Raw output SHA256 `446d0a21aadf253df781c4d3a21a14a5800abaf598cbf7052f2677dc460d633a` differs
from the original despite visually near-identical composition. Art/anatomy/botany shortcomings
persist. This is one Mac/recipe/profiled pair, not general speed, exact pixels or phone support.
The derivative adds about336MiB to the existing developer cache; no player budget is raised.
The conversion17checks, bridge38checks and native source/cleanup evidence remain separate.

```sh
node tools/with-toolchain-lock.mjs --label local-ai-block32 -- node tools/local-image-generation/run-browser-proof.mjs /private/tmp/cf-ai-block32-new --identity-reference --q8-block32 --profile
```

The768×432 initial output/reference512×288 are bounded research sizes, not a promise of the final
full-screen quality. Seeds repeat the JS noise recipe, not exact pixels across GPUs or model
versions. Browser-process RSS samples can double-count shared mappings and do not equal peak
unique RAM/VRAM. Native hardware/phone heat and memory qualification remain separate.

## Acceptance

`INFERENCE_COMPLETE_REVIEW_PENDING` only means an output was generated and retained. Compare raw
output against the approved full paintings for composition, light, material detail, environmental
cohesion and exact anatomy/botany. The Earth reference itself has documented Civet identity drift;
reproducing that drift does not satisfy identity parity. Do not retouch raw output to hide model
limitations or count model marketing as evidence. Reference ablation, repeated ownership/cleanup,
actual resource behavior, unsupported devices and human review all precede a shipping decision.

Current attempts and all original failures belong to
`audits/LOCAL_AV_AI_CONTINUATION_20260909/README.md`. No model or source change updates the parked
draft PR automatically, and no build/test result authorizes a release or deployment.


## Canonical appearance input

The runner now prepares `canonical-input/` through the actual game CF1/roster/vista
builders and the pure `landfall-appearance-snapshot.ts` owner. It retains full19
Earth genomes plus six display identities under a separate versioned snapshot,
not regex-extracted TypeScript literals. The snapshot and all59source hashes are
retained; source stability is checked again at run end. The isolated build owns
and releases its V2 lease. Existing prompt/model/reference settings stay separate.

`--preflight` now also reads the actual served recipe and verifies its exact JSON.
The first native snapshot preflight matches the prior generation data except new
appearance metadata. Unknown versions or inconsistent internal export carriers
refuse. Parsed snapshots grant no live roster, route, save or ownership authority.
Other worlds/epochs remain unsupported by this first adapter. Quality is still open:
the stronger1024 one-Civet prompt failed and is preserved; the earlier identity
wording is restored. See the retained single-reference control for its separate
facial-identity/grounding failure. Neither image was installed in the game.


## Owned reference preparation and identity-only comparison

Reference decoding now checks cancellation after each awaited preparation boundary,
closes every created ImageBitmap in finally and retires its scratch canvas before
returning copied tensor values. Matte is validated before allocation.30 controller
cases and six native ImageBitmap/Canvas2D scenarios pass; native prepared pixel
hashes match both earlier references exactly. The native audit substitutes model
workers explicitly, so it is not another inference or native heap certificate.

`--identity-only` uses only the selected Civet WebP with its unchanged480x320 matte
preparation and a new image1 identity prompt. It cannot accompany `--identity-reference`
or `--without-reference`. The full-scene file is not read or served in this mode.
Default/dual recipe bytes remain exact.20 parser/server controls pass; the actual
pinned tokenizer counts367/512. This is an explicit quality experiment, not a default
change or approved art. It changes reference choice and wording together. No generated
output modifies canonical gameplay data or bypasses the quality requirement.


## Queued landing interaction and fixed-shape experiment

The proof's Land button now exposes real ordered progress/ETA, allows Field journal navigation,
and announces completion without switching panels. View landfall returns explicitly. The six
journal names come from the canonical snapshot, not image interpretation. This is a single
page-owned job; no normal-game Land hook, save mutation, reward or durable/background queue.
Closing this development page discards its job/result. Exact original retention is separate work.

Progress counts completed stages/steps, not elapsed-time percentage. The first run estimates
remaining denoising only after two measured steps and labels final processing separately. The
same exact configuration can use one previous successful page-local total duration. Failures,
cancellations, different configurations and step4/4 never imply a completed painting.

`--fixed-denoiser-shapes` is an explicit inference-only experiment. It checks typed input lengths
and supported dimensions, then sets ORT `freeDimensionOverrides` only for denoise. The runner
requires the actual loaded event to match its independent expected dimensions. No weights,
references, four-step arithmetic, noise seed or output resolution are changed by the option.

```sh
node tools/with-toolchain-lock.mjs --label local-ai-fixed-shapes -- node tools/local-image-generation/run-browser-proof.mjs /private/tmp/cf-ai-fixed-new --identity-only --q8-block32 --resolution=1024x576 --fixed-denoiser-shapes
```

On macOS this browser-owning command must run outside Seatbelt on its first attempt. It verifies
already cached bytes; it never downloads missing model files. The native runner clicks the real
controls, verifies navigation/progress/completion, and retains screenshots and source hashes.
Small viewport reflow of a finished image is not phone inference or physical-device proof.
Results and the accumulated review direction are in
[the Claude packet](../../audits/CLAUDE_DIRECTION_REVIEW_20260909/HANDOFF.md). Artwork acceptance
remains false unless a separate visual review explicitly qualifies it.

The measured fixed-shape1024 result is69,034.55ms versus69,948.09ms; rawPNG bytes match.
The1.31% single-run difference is inconclusive, so the option remains experimental. Actual
worker input metadata resolves the requested dimensions. See COMPARISON.json in the packet.
Pre-recipe loading now carries an AbortSignal and a separate pending/failed presentation so
an earlier completed run cannot leave “Ready” visible after a failed retry.
