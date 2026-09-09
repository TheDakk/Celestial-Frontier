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
