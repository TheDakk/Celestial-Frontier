# Browser local-image proof

## Paused local continuation — matches working copy September 9, 2026

Nick's September12 review accepts the twelve first v4 inputs and authorizes one
[contact revision](../../audits/ART_KIT_CONTACT_REVISION_20260912/README.md): same masters,
seed and plate; painted composition, one-pixel erosion/despill, masked0.35 finisher,
402-token runtime projection under512, and no organism inference passes. ART_KIT/4E
are unchanged; wording proposals await approval. The older six-pass425.707s proof and
5120 ceiling remain historical evidence. No --landfall --variant, pack, integrated chain,
OPFS extension or GitHub action. The actual target-iPhone probe still gates delivery work.


Matches implementation as of September9,2026. An isolated authoring experiment for Celestial
Frontier's browser proof of concept; the full engine game comes later. This is not a shipped
game dependency, a selected product model, or a claim that the art requirement has passed.

The browser executes Qwen text encoding, reference VAE encoding, FLUX.2 Klein denoising and VAE
decoding on WebGPU. A loopback HTTP server serves exact files only. It performs no inference.
Each stage owns a fresh worker, and the parent terminates it before proceeding. Cancellation,
timeouts, model/data corruption, nonfinite tensors and GPU errors stop the run. There is no remote
inference API, login or fallback generation. The optional normal-game preview separately exposes
explicit browser model installation; authoring tools are not installed on the player's device.

## Normal-game preview

`game-preview-server.mjs` now serves the ordinary game with `?localai=1`, an exact verified
local model cache and the same browser inference worker. `run-game-integration.mjs` exercises
trusted Land → progress while playing → durable original → Notifications/View → reload. The
server performs no inference or downloads. `--species-references` on the integration runner selects
six individually hashed canonical Earth references through `species-references.mjs` and its
[full-genome source manifest](../../audits/AI_SPECIES_MOBILE_20260909/references/reference-set-v1.json).
Order is Civet, Persimmon, Platypus, Frog, Devil's Club and Cranberry. Each verified original is
prepared at480×320, encoded separately and assigned its own image-token group; soft conditioning
does not guarantee anatomy, count or position. The actual six-reference painting remains
unaccepted for Platypus anatomy, diagnostic botany and canonical placement. Desktop full-model
storage results do not qualify physical-phone installation or inference. See [the current owner reference](../../LOCAL_AI_GENERATION.md),
the [current species/mobile packet](../../audits/AI_SPECIES_MOBILE_20260909/README.md) and the
[preserved initial integration packet](../../audits/AI_GAME_INTEGRATION_20260909/README.md).

The detached fidelity owner now preserves V1 and adds a separately branded V2 contract for
six ordered references and full resident identities, exact PNG/recipe bindings and explicit
flora count. It records the retained V2 painting as species-rejected; it performs no pixel
recognition, observer authentication or full-quality approval. The earlier run happened while
the API was V1-only, and its original evidence remains unchanged. [Formal V2 review and controls](../../audits/AI_OFFLINE_INTEGRATION_20260909/species-review/README.md).

```sh
node tools/with-toolchain-lock.mjs --label individual-species-native -- node tools/local-image-generation/run-game-integration.mjs --output=audits/NEW_SPECIES_ATTEMPT --species-references
```

This command performs actual local inference and needs the ordinary startup, source freeze,
shared locks and approved first-attempt native browser execution outside macOS Seatbelt. It is
not a setup or packaging command; retain a failed attempt and diagnose before a changed attempt.

The local preview now uses `frozen-preview-client.mjs`: a hash-pinned served copy disables the
locked Vite client's unused eager HMR connection while preserving its exports, CSS/query helpers
and real error reporting. Installed dependencies are unchanged; unexpected Vite bytes refuse.
This fixes the WebSocket exception retained in native-generation01 without relabeling that failed
aggregate or repeating inference. Thirteen focused controls and one separate no-inference native
boot/reload passed: actual client bodies captured twice, trusted Skip/durable Sol/continuing
renderer, zero sockets/model requests/runtime exceptions,20 source hashes unchanged and complete
cleanup. Two favicon404 logs remain. [Transport packet](../../audits/AI_SPECIES_MOBILE_20260909/preview-transport/README.md)
contains the first failure, exact source/client evidence and narrow screenshot review.

```sh
node tools/with-toolchain-lock.mjs --label frozen-preview-boot -- node tools/local-image-generation/run-frozen-preview-boot.mjs --output=audits/NEW_PREVIEW_BOOT_ATTEMPT
```

The latter runner starts only the real game via the shared frozen server factory, with no model
cache scan or inference. It is a scoped desktop diagnostic, not the full mobile/PWA qualification.

## Static runtime and retained-painting inspection

`runtime-pack.mjs` builds a deterministic, hash-inventoried `/__local_ai/` runtime closure from the
existing locked dependencies, helpers, six reference assets and notices. It includes the actual
ORT Asyncify lazy JS/WASM files. No weights are copied. Current six-reference output is
37,451,014bytes (35.72MiB); its external inventory SHA is
`ddc09e2128a6fbfea11b3c6b0596359eb97fd7f18198fed38c74b3736502476b`.
The earlier27.08MiB single-reference result remains historical evidence in the continuation packet.
The controller admits the installed-only manifest and refuses generation before explicit OPFS
verification. The source-owned verifier can validate this complete runtime subset inside the
separately inventoried application; unrelated app paths never become trusted runtime files.

After the normal startup and shared locks, use a **new** ignored output directory:

```sh
node tools/with-toolchain-lock.mjs --label ai-runtime-pack -- node tools/local-image-generation/runtime-pack.mjs build --output=/private/tmp/cf-runtime-pack-NEW
node tools/with-toolchain-lock.mjs --label ai-runtime-verify -- node tools/local-image-generation/runtime-pack.mjs verify --output=/private/tmp/cf-runtime-pack-NEW --sha256=EXTERNAL_MANIFEST_SHA
```

Use the exact externally retained manifest SHA printed by that build. Existing output refuses;
source/payload/manifest substitutions, unsafe paths, missing closure and added weights refuse.
No command publishes the pack or starts model downloads.

## Combined optional PWA delivery

`mobile-pack.mjs` reuses the ordinary Vite configuration and sealed PWA inventory, then adds the
externally verified runtime as exact cached assets. It requires a new output and explicit
`--local-diagnostic`; package metadata is working-tree/evidence/nonpublishable. These isolated
assembly tools require native TypeScript stripping and are tested here with installed Node26.8.1.
No extra authoring tool or Node installation is part of the browser player's flow.

```sh
node tools/with-toolchain-lock.mjs --label mobile-ai-build -- node tools/local-image-generation/mobile-pack.mjs build --output=/private/tmp/cf-mobile-pack-NEW --runtime=/private/tmp/cf-runtime-pack-NEW --runtime-sha256=EXTERNAL_RUNTIME_SHA --local-diagnostic
node tools/with-toolchain-lock.mjs --label mobile-ai-verify -- node tools/local-image-generation/mobile-pack.mjs verify --output=/private/tmp/cf-mobile-pack-NEW --sha256=EXTERNAL_MOBILE_SHA
```

Current package03 is `/private/tmp/cf-mobile-pack-20260909-species-03`,97files totaling
56,529,354bytes (53.91MiB), with external manifest SHA
`5dc7a6e41eebe0e71c399db7c526d87ca47a43d850bb1fc3111dcf8c94aa0d5c` and PWA build ID
`42d79c05f4b5269766d35e82c03f7b828f70062dc2bdca54ee98ca5f643465b4`.
Build03 and independent verification passed with426 measured source hashes unchanged. This rebuild
contains the optional worker-import ownership correction and its required development release text.
The unchanged six-reference runtime has the external SHA above. Package02's release-text-only
rebuild, package01 and its first test-hook failure remain intact. Corrected package-copy controls
passed8/8 actual package/HTTP cases and8/8 pure cases on package01. The worker-import correction
separately passed12 targeted package/reply controls,34 existing PWA cases, all3 TypeScript programs
and root validation. The [delivery packet](../../audits/AI_SPECIES_MOBILE_20260909/mobile-delivery/README.md)
retains exact commands, inventories, refusal controls, all versions and first failure diagnosis.

Admission remains128MiB including final package metadata. The same-size successor envelope is
113,058,708bytes (107.82MiB). Since active + prior + an installing candidate can occupy three caches,
the optional worker also counts retained build response payloads and refuses before a candidate
write crosses256MiB, deleting only its failed candidate. Browser metadata, OPFS model files,
retained art and live GPU/RAM are distinct budgets. This is not physical-device disk accounting.

The optional worker forwards only the20 exact pinned Hugging Face model GETs from a retained
current/prior document, with CORS, omitted credentials and bounded open-ended Range. These requests
happen only after explicit Install/Resume and never enter CacheStorage. Complete streamed file
hashes remain the OPFS owner's admission rule. No model data is packaged or automatically fetched;
the original20-file model is still6.23GiB. Default PWA worker bytes and its external refusal remain
unchanged. Local model storage preserves its open disclosure during progress so Pause stays usable.

`createMobilePackServer({directory, expectedManifestSha256})` supplies a verified isolated loopback
static origin, exact MIME and COOP/COEP/CORP/nosniff headers, an HTTP outcome ledger and owned close.
It permits initial`/?localai=1`; unknown assets return404 with no HTML fallback. The optional native
`run-mobile-model-delivery.mjs --pack=PATH --sha256=EXTERNAL_MOBILE_SHA --output=NEW_AUDIT_DIRECTORY`
uses normal controls and an independently hashed loopback mirror of already present model bytes.
Default mode performs delivery/readback and the module-only pre-GPU guard without inference;
the separate explicit `--landfall` option described below also runs the local model offline.
It does not ship a mirror or redirect player requests in the product. Root coordinates its
one-attempt browser run after source freeze. Both full-model native01/02 receipts remain FAIL.
Attempt01 installed all20 files but stopped before offline work after its hard reload bypassed
service-worker control. Corrected02 proved activated control across all3 documents,21 service-worker
model interceptions, real Range resume,6,392 native chunks /6,691,020,416bytes and108.690seconds for
local-mirror install. It then physically closed both servers, completed normal offline reload and
in-game full verification in79.775seconds, and read all20 native Blobs through the compiled production
owner with exact sizes/head/tail digests plus a rejected shifted-slice mutant. The final module
observer failed. No internet download, model inference or phone qualification occurred.

Three subsequent small module attempts remain red. The source correction now admits a module
request with explicit empty `resultingClientId` only from a persisted `worker:true` pin bound to the
retained active/prior build and exact asset table. Window-only, missing or stale owners still
refuse; default worker bytes are unchanged. **Separate native04 PASS on verified package03**:
unmodified stage-worker imports returned the existing pre-GPU invalid-profile response both online
and after origin closure/CDP offline/new-document normal reload. All95 cache asset digests and the
25,749,873-byte lazy Asyncify WASM SHA matched. No WASM instantiation, model OPFS namespace,
GPU/model work or inference occurred;12 measured sources stayed unchanged, zero browser error
events/loading failures were recorded and cleanup completed. [Runner and failure history](../../audits/AI_SPECIES_MOBILE_20260909/MOBILE_NATIVE_RUNNER.md)
keeps this bounded module result separate from native01/02 aggregate FAIL. The6.23GiB OPFS copy
was not repeated solely for the module correction.

The optional `--landfall` proof installs into a fresh diagnostic profile using native Install,
Pause, normal reload and Resume. After closing both servers, it verifies all OPFS model bytes,
checks native Blob readback and the actual worker-module reply, then drives ordinary canonical
Earth Land. The helper requires the portable model (`q8Block32:false`), six references, real
progress/ETA and responsive Notifications, followed by retained Ready, native Inspect/View and
the same original ID/PNG digest after a normal offline reload and Survey inspection. It reads
the already displayed Blob; no original is injected into storage. Model files can still require
large ORT allocations. The 600-second stage timeout and 15-minute observation bound are not
speed promises. Default mode remains free of inference.

```sh
node tools/with-toolchain-lock.mjs --label offline-landfall -- node tools/local-image-generation/run-mobile-model-delivery.mjs --pack=/private/tmp/cf-mobile-pack-20260909-species-03 --sha256=5dc7a6e41eebe0e71c399db7c526d87ca47a43d850bb1fc3111dcf8c94aa0d5c --output=audits/NEW_OFFLINE_INTEGRATION --landfall
```

This command requires the same source freeze, shared locks and outside-Seatbelt native execution
as other browser-owning commands. Preserve any failure before a changed attempt. Dedicated worker
targets receive no debugger attachment; absent positive startup evidence during known inference
sets `workerStartupEvidenceAvailable:false` and `noReloadInference:null`. Repeated same-original,
same-route and zero-job observations support only `noReloadJobObserved`, while any observed new
startup after reload fails. [Current native outcome and first-failure diagnosis](../../LOCAL_AI_GENERATION.md)
keep this new offline-inference attempt separate from prior delivery-only runs and the
[independent runner review](../../audits/AI_OFFLINE_INTEGRATION_20260909/runner-review.md).

Actual offline-integration native02 is **aggregate FAIL**. The 20-file installation used real
Pause/reload/Range Resume; the measured Resume-to-ready interval from the local mirror was
103.635 seconds. True offline normal-game rehash took 79.326 seconds.
Native Blob readback, module guard, durable Land and early Notifications responsiveness passed.
All six reference encodings completed, and Drawing appeared at 31.706 seconds after Land. The
unchanged 600-second stage limit then expired before a completed denoise step, ETA or PNG; Ready,
Inspect/View and post-generation reload were not reached. `modelExecutionAttempted:true` with
`modelExecuted:false` records that missing completed-denoise observation, not no model work.
The failure screenshot also timed out. All 31 measured sources and final package verification
remained unchanged, and owned resources closed. Native01's live-inventory failure is preserved;
no unchanged retry, new model, package or timeout adjustment followed this native02 failure.
Physical iPhone/Safari/PWA/CDN delivery, thermals and inference latency remain separate gates.
Existing model/source/phone and species-quality blockers persist. Native runtime source-version correspondence is corroborated
by embedded commit and matching notices; selected-component SBOM/reproduced-build and complete
distribution acceptance remain unqualified.

`run-landfall-viewer.mjs --output=NEW_AUDIT_DIRECTORY` checks the ordinary game’s full-painting
viewer with the prior native original committed through the real original-store owner. It drives
trusted controls, resize, native-pixel pan, Close/keyboard and reload; it performs no new inference.
Run through the shared wrapper outside macOS Seatbelt. Keep the original native-generation proof
and this explicitly retained-image UI audit distinct. See the [continuation packet](../../audits/AI_LANDFALL_CONTINUATION_20260909/README.md).

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
Friendly failure/cancellation remains visible from either panel, with raw errors in the evidence.
Already-requested cancellation is checked after the decode await, before synchronous publication.
The completed image and explicit return bind the full job/recipe, PNG, world key, environment,
ecology epoch and snapshot hash to this existing Earth panel. A changed binding refuses the
publication/return; this does not implement multiworld routing or grant canonical game authority.
The 42-case controller suite includes same-turn cancellation and removed-guard controls, changed
identity/PNG/notice/panel rejection, exact restoration, and visible failure/retry outcomes.
The actual Claude response, clarified visual record and remaining quality/delivery gaps are in
[the review disposition](../../audits/CLAUDE_DIRECTION_REVIEW_20260909/REVIEW_DISPOSITION.md).

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
