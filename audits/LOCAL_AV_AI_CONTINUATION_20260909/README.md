# Local graphics, audio and AI continuation — September 9, 2026

Nick explicitly directed ongoing local graphics upgrades, audio and local AI generation after
parking draft PR42. He then made matching the approved graphics quality and art direction a
hard requirement for the embedded image model. Work starts on signed/pushed9bfec7dc, with no
hosted test/merge/release and the existing deterministic/biome/species/UI constraints intact.

## Hard image-quality acceptance

An embedded generator must produce the approved cohesive complete-painting treatment. Evaluate
actual model outputs against the retained Living Worlds/full-landfall references: composition,
consistent light and atmosphere, rich but controlled brush/material detail, natural contact and
depth, named Earth anatomy/botany or canonical alien traits, and full-scene cohesion. A successful
inference, small download, fast result or mathematically deterministic recipe is insufficient.
Do not claim this gate passed from model marketing or another generator's reference artwork.

Preserve raw candidate outputs, exact references and complete prompts/conditioning with hashes.
Record reference-image support and every applied transformation. No hand retouch may silently
stand in for the model's generation quality. Reject any result that misses the quality bar and
record why; tuning/fine-tuning or a different runtime/model remains explicit follow-up work.
Final human visual acceptance remains distinct from automated/source/resource evidence.

Nick clarified that the **browser game is the proof of concept for a later full-engine game**.
The current implementation therefore executes ONNX inference in actual browser WebGPU workers.
A native Mac experiment could only establish model quality, not browser/iPhone feasibility. Count transformer/UNet, text encoder, VAE, tokenizer/runtime, compressed/staged
copies and working memory separately; preserve current shipped-pack and protected-save rules.
No million-image pre-generation. Adaptive disposable-image cache limits are separate from the
installed model and from live decode/GPU memory. No candidate is embedded or qualified at start.

## Current bounded owners

- Audio: smooth combat duck/release of ambient/music buses using existing ownership, overlap and
  user-volume rules; mute/hide/panic/dispose must stay immediately silent.
- Graphics loader: enforce the existing8-second deadline with monotonic checks at awaited
  completion/ownership transfer, including throttled-timer controls. No new painting or layout.
- Local AI: select at most two plausible open-weight candidates from primary sources, prefer
  reference-image conditioning and the quality ceiling, then prove one canonical local scene.
  Record software/model license, exact revisions and component storage before implementation.

Root coordinates tests/builds and reference updates; all original
red/scoped evidence remains binding. The uninterrupted startup receipt applies. Caffeinate-di
PID33372 was explicitly requested and both assertions verified; original93550 remains untouched.


## Browser implementation and evidence — work in progress

The isolated `tools/local-image-generation/` package implements a browser-only four-stage pipeline:
Qwen text embeddings → reference VAE encoding → four FLUX.2 Klein denoising steps → VAE decoding.
A fresh owned WebGPU worker handles each graph; termination precedes the next graph. Local HTTP
only serves exact files. The browser performs inference; no Python/native generation or remote
inference service sits behind it. This has not yet been embedded into the game or accepted as
runtime delivery. Full game dependencies and existing128MiB gates remain unchanged.

Pinned candidate: `cgb/flux2-klein-4b-onnx-webgpu` revision
`3bffc0efef1d9f84727036cdbc44df3b6ab51131`. Its actual graph shapes include the recently added
VAE encoder, contrary to an older cached model-card impression. Decoder `packed_latent` has128
channels/16× expansion, not the stale README32-channel/8× bullet. Encoder output is already
patchified and normalized. Pinned official Diffusers source supplies reference coordinates and
the empirical four-step schedule; the conversion README's older shift formula is retained as a
source discrepancy. See `tools/local-image-generation/source-contract.md`.

Model inventory:20 runtime files6,691,020,416 bytes (6.23GiB), plus7,792-byte model README.
Downloads use the exact revision, per-file SHA256 and byte counts, sequential streamed writes,
atomic publication, corruption refusal and finite cancellation/deadlines. No weights enter Git.
The development cache is under ignored `port/v2/apps/game/smoke/local-image-generation/`.
The isolated package pins `onnxruntime-web@1.29.0` and `@huggingface/tokenizers@0.2.0`; scripts
were disabled during install. The earlier source research mentioned ORT1.28; the actual registry
read established1.29 and the lock records the installed version. This is not a game dependency upgrade.

The canonical recipe retains the full unchanged Earth request/all19 genomes, depicting Civet,
Platypus, Frog, Persimmon, Cranberry and Devil’s Club. First proof output is768×432, with the
approved full Earth composition reduced to512×288 as reference input. The reference itself retains
known Civet identity drift; conditioning on it cannot prove exact master identity. Noise is an
explicit separate seed133/versioned JS recipe; it does not consume world RNG or promise GPU pixels
match across devices. Actual prompt, reference transform/hash and complete authority are recorded.

Completed scoped checks:
- `loader-focused/`: one file27tests PASS, exact two-file hashes unchanged.
- `audio-focused/`: five files268tests PASS, exact tested source unchanged; no listening acceptance.
- `pure-controls/`:28 node:test outcomes PASS, including independent scheduler/noise/packing and
  SHA/size/truncation/cancellation controls. No weights or model inference inside these tests.
- `webgpu-probe.json`: actual f16 compute `[2,4,6,8]` on nonfallback Apple Metal3 adapter PASS,
  Edge152.0.4191.66, max storage buffer4,294,967,292 bytes; owned browser cleanup PASS.
- `browser-preflight/`: isolated page/source recipe loads, WebGPU and cross-origin isolation PASS.
  Retains one incidental favicon404 in the original receipt; later HTML declares an inline favicon.
  This is a page prerequisite check, not a zero-error inference or image-quality certificate.

Read-only review found between-stage cancellation, nonfatal GPU-error reporting, raw half-bit
NaN checks and terminal-receipt cleanup gaps; root corrected them before first inference. Later
lifecycle controls and actual native output still need execution. Earlier evidence is not relabeled.


The actual development download completed once at2026-09-09T05:20:27Z:21files/6,691,028,208bytes,
every byte/hash verified. `model-download.json` is the untouched cache receipt copied into this
review packet; no original failure or retry. Installed proof node_modules occupy about145MiB on
this Mac; this is a filesystem observation, not an optimized browser delivery size.

A later ORT1.29 source check found that native `Float16Array` outputs cannot be copied with the
numeric `new Uint16Array(values)` constructor. The driver now copies their underlying16-bit
storage; two independent controls cover native offset views and the Uint16 fallback. This was
corrected before first inference. `runtime-controls/`:27PASS (14changed math,2storage,11actual
browser-controller VM lifecycle outcomes). These are injected controller checks, not GPU inference.
The exact prompt readback contains299tokens including the correct empty-think wrapper; no truncation.

`browser-inference-01/` is the first real model execution attempt, started after those controls.
It rehashes cached weights, retains exact runtime/recipe/source, and stops on first stage error.
At this log entry its result is pending; do not infer success from the earlier prerequisites.


The publisher README retains157CRLF endings. Its exact evidence path is marked binary in
.gitattributes so a cross-platform checkout cannot invalidate the retained source hash. Other
new source/docs retain normal LF; model/license originals are not silently rewritten.


## Actual browser outcomes

`browser-inference-01` completed all four real stages, producing768×432 PNG906,375bytes,
SHA256`966d34d23c7e95670f485fedca2e6053fdf05d3f46350b8e2c555761692ef1b7`.
Observed pipeline duration196,009ms, including graph loading after the preceding cache verification.
Source/runtime/model hashes and browser cleanup are retained. Eight console entries are ORT
`[W:onnxruntime] VerifyEachNodeIsAssignedToAnEp` warnings, reported by browser logging at error
level; they state some operators use CPU. This is WebGPU-accelerated browser inference, not a
claim that every operator ran on GPU or that the run had zero console entries. No GPU validation
failure or model-stage error was observed. Actual native memory remains unqualified; maximum
sampled summed browser-process RSS2.8174GiB omits/double-counts mappings and cannot establish
unique combined RAM/GPU use. The14s text/1s reference/178s denoise/3s decode timings expose the
image-model stage as the dominant observed latency.

Independent `browser-inference-01/VISUAL_REVIEW.md` viewed output, full scene reference and exact
Civet master. Scene cohesion is convincing; six subject categories are findable. Exact Civet
face/coat identity and botanical/anatomical diagnostic details remain open. No quality acceptance.

`browser-reference-ablation` completed on the same source/model/seed/schedule with reference
conditioning disabled:142,347ms, PNG857,060bytes, SHA256
`212715a9196d6b045b85c681ec785b5019e8b1e9bf1e9b3d25ac21d16f14f70d`.
Root visual comparison sees more generic berry branches/leaves and a more rodent-like Platypus,
with the reference-enabled scene closer to the requested shared painting. This is a single
controlled pair, not multi-seed quality coverage. Both raw images remain unretouched.

A third bounded `browser-identity-reference` run adds the selected original Civet WebP asimage2
and explicitly prioritizes its identity over the drifted Civet in the full scene. The original
768×512 alpha asset SHA186d76da… remains untouched. Model preprocessing scales it480×320 and
composites a declared opaque#72786e background; each actual normalized input tensor receives a
separate SHA256. This is documented conditioning, not a manually retouched model output.
`identity-input-controls/` passes13actual-controller outcomes, including explicit matte ordering
and invalid-matte refusal. The third run's result is pending at this entry.

Static checks: `static-checks/` first passed64Guide/release-contract tests, then stopped onTS2416:
the old FakeContext.currentTime inferred literal12 while the new advancing subclass usednumber.
Only the base fixture annotation changed to number; runtime behavior/test logic is unchanged.
`static-corrected/` then passed all3V2 TypeScript programs and rootvalidate:1,010named renders,
zero boot errors,50original fingerprints, legacyHTML byte-identical. Originalred remains intact;
Guide64PASS was not repeated. These are local scoped checks, not PR42/current-head admission.


## Identity reference result and native audio instrumentation

`browser-identity-reference` completed actual browser inference in227,170ms. Its raw768×432
PNG is887,249bytes, SHA256`84c2aa9fd18841d6b3fdfe0a412a260136cbcc1738824a648d77347f92103d68`.
The recipe retains the383-token prompt, both original reference hashes and normalized RGB tensor
hashes: scene`bed3684dde2c27b8b62ebd2d7ae115a90892ea086d43de2a8bd795697091f8b0`,
Civet`96fe0622f6dca3e0ed1a3052aea75a771bf58294b938387778a8b2435e7b2323`.
The owned browser closed and source hashes stayed unchanged. Root viewed all three raw images:
the dual-reference result improves the long pale muzzle, amber eye and warm golden coat while
retaining shared riverbank lighting. Tail framing and fine species details remain open; none
is marked qualityAccepted. No retouch, game replacement or human acceptance is inferred.

The new `port/v2/tools/audio-native-mix/` harness renders the actual production mixer through a
bounded OfflineAudioContext adapter. Its first attempt `native-audio-01` stopped atTS2322 on the
audit ConstantSourceNode callback type; no build or browser ran. The corrected narrow audit bridge
left product types unchanged. `native-audio-02` passed that typecheck, then stopped at a missing
plugin-object brace in the new isolated builder. Its syntax error/log/source remain retained;
no browser ran. A correction is being prepared separately; neither original receipt is relabeled.


`native-audio-03` completes syntax→strict harness TypeScript→isolated build→native waveform chain
PASS. The65-source build and18 raw PCM planes are bound to the retained manifest. Native report
SHA256`3b4b2a4ce36068017ce6e196c804310002d29ebac05c506b7ff67d08b5eac4d8` records six400ms48kHz
renders: two positive scenarios, neutral-intent/immediate-step/early-restore negative controls,
then restored positive. One independent waveform acceptor accepts the positives and rejects all
three faults. It observes25ms duck/90ms recovery, overlap, interrupted recovery, latest saved
volume and immediate category-zero silence. All contexts' runtime voices/owners/nodes/faults,
connections and source handlers finish at zero; the disclosed adapter closes once. Owned browser
and server close successfully. Source callbacks are manually stopped inside this audit and
watchdogs are inert: this is native DSP evidence, not native gameplay gestures, natural-onended,
watchdog/real-time, speaker/device or HUMAN listening acceptance. Product source did not change
between the retained first instrumentation failures and this corrected attempt.


## Native CPU/GPU profiling

The source-verified ORT1.29 native profiler is separate from the unused legacy JSEP callback API.
Explicit `--profile` requests timestamp-query, captures bounded native stdout Chrome-trace JSON
before session release, and retains raw/summary files. Actual complete arrays are required;
quiet timers, absent samples or missing GPU timings cannot become a zero-cost PASS. Caps remain
32MiB/100,000events/2,048groups per stage, maximum five stages. Node host spans and GPU hardware
microseconds are separate overlapping timing domains and are never added together.

`native-profile-controls` passes13 script syntax checks plus28 tests (18 actual-controller flows,
10 native parser/options controls). Controller cases cover failed profile publication boundaries,
raw-trace retention on failure and keeping large traces out of progress text. Actual
`browser-native-profile-01` then stopped at the text stage: the new instrument treated each unique
`node&op&program` label as a separate program group. It retained complete2,088,745-byte JSON with
4,639events but exceeded the aggregate group cap; originalFAIL/source copies remain untouched.
No denoise/decode was attempted. Browser cleanup and source readback passed.

Exact native source establishes that labels serialize node, operator and program in that order.
The corrected parser groups actual operator/program/shapes and keeps bounded full-label/cache-key
examples plus all raw events. It retains the same2,048-group cap. `native-profile-controls-corrected`
passes13 focused tests including2,049 different node labels for one kernel and a real distinct-
shape overflow control. Offline readback of the old raw trace now yields104groups; this is separate
analysis, not a retroactive native PASS. Text GPU MatMulNBits consumed6,628,303us of6,884,136us
observed GPU time. CPU Node spans total28,074us; readback waits overlap GPU work. These values
do not diagnose the transformer. `browser-native-profile-02` is the changed-instrument attempt
with the same model, seed, prompt, dimensions and two references; result pending at this entry.

Final root validation passes again after the native harness batch:1,010named renders, zero boot
errors,50original fingerprints, byte-identical legacyHTML. Its exact log SHA agrees with the
previous pass; this is no new legacy behavior or broadened native admission.


`browser-native-profile-02` completed all five stages in238,809ms, with complete finite traces,
unchanged source and clean browser shutdown. Its rawPNG exactly matches the prior unprofiled
same-Mac dual-reference PNG/hash84c2aa9f…; this does not extend pixel determinism across hardware.
The sampler emitted18,686events, with206,655,649us observed GPU time;412MatMulNBits dispatches
account for197,359,252us (95.5%). Node host spans separately total298,625us. Quantized GPU matrix
operations dominate this run, not CPU fallback. Full raw hashes and summaries remain in the packet.

A native1024×576 comparison now uses the same model/seed/steps/prompt and both reference inputs.
Only output dimensions change; the existing scheduler computes its resolution-derived shift.
`larger-image-controls` passes syntax and14parser/options tests, including arbitrary-resolution
refusal. The original768×432 outputs remain unchanged; `browser-1024-quality-01` is pending.
This is a bounded quality/resource experiment, not acceptance or a game-delivery budget increase.


`browser-1024-quality-01` completed in299,816ms, producing1,546,068-byte PNG SHA256
`ba364110721e0e89779dfded699a40244bd9632b284451a5f9503b01302ad8db`. Root and independent review
explicitly reject it: two overlapping/fused Civet body forms and two tails violate the single
organism/count/anatomy contract, and bank support becomes ambiguous reflective-water placement.
Added pixels improve some texture but do not establish canonical plants/small-animal anatomy.
No raw output was retouched or installed in the game; the768composition remains stronger but
also unaccepted. Complete model/source/browser cleanup evidence remains retained.

`q8-block32-feasibility.json` records a bounded read-only next optimization: all103 actual Q8
transformer nodes use block128, K divisible by128, explicit uint8 zero points and f16 scales.
Splitting packed B into four32-value blocks while repeating each scale AND zero point four times
preserves represented weights; a768-weight independent sample agrees exactly. The first130-byte
sample attempt's absent-zero assumption failed and is retained separately; corrected sample reads
786bytes. All103 observed nodes/412GPUdispatches satisfy the other native wide-kernel gates.
The converter is separate upcoming work, not a modified/qualified model. Extra scale/zero payload
would be347,332,608bytes plus graph/metadata while reusing original shards. Floating accumulation
order and final image equivalence still require an actual derivative run. No feature-only speed
experiment or unsafe IsNaN rewrite was performed.


## Local checkpoint and next derivative batch

Signed verified`ceb107fdcf6f33f8d60cfd071fbea907a4bb68df` commits214completed proof/audio/loader
and evidence files. `checkpoint-signing.json` is the untouched next-batch copy of the actual
command-scoped existing-1Password-agent receipt; no private key or settings changed. The branch
is one ahead of parked origin9bf; no push, hosted run or release. The enormous majority of new
text is exact JSON evidence, not game code. `checkpoint-whitespace.json` preserves four original
raw-log EOF warnings and one frozen harness README trailing space; that check remains nonzero,
not relabeled PASS. Runtime/code whitespace is clean; no policy was weakened.

New `tools/local-image-repack/` work is outside that completed checkpoint. It must prove strict
parent identity, safe new ignored output, exact Q8 represented weights, immutable original
shards, new derivative identity/hash and separate measured GPU/quality outcomes. The existing
model and all accepted/unaccepted artwork stay intact. No inference speedup has been established.


## Verified block32 derivative and native comparison

`repack-controls-01` passes17 focused protobuf/representation/integrity/ownership controls and
all five converter syntax checks. `repack-conversion-01` completes first attempt in3.75s, verifies
all three original shard hashes, preserves unchanged B ranges and protobuf fields, and independently
re-reads every347,332,608 new scale/zero byte. Source and all handle cleanup checks pass. Exact
conversion status remains `DERIVATIVE_VERIFIED_RUNTIME_PENDING`; subsequent inference does not
rewrite the earlier receipt. The derived graph/data add352,323,881 bytes (about336MiB) to the
ignored developer cache, no additional model download or original-shard copy.

`derivative-bridge-controls` passes38 focused checks before native execution. The repository pin
binds actual derived graph/data hashes; `--q8-block32` selects only the denoiser and fails closed
on unknown variants or corrupt/truncated/symlink assets. Original model remains the default.
`repack-conversion-01/REVIEW.md` independently checks pin/receipt consistency and bridge routing.

`browser-block32-profile-01` completes all five native stages with source unchanged and owned
browser/server closed. Same seed, prompt, resolution, reference inputs and schedule as original
`browser-native-profile-02`; `COMPARISON.json` checks recipe equality except the derivative field.
All412 Q8 dispatches now select `MatMulNBitsWideTile`. Measured sampler GPU time206,655,649µs→
33,325,520µs (6.20×); Q8 GPU197,359,252µs→24,261,563µs (8.13×). Total observed generation
238,809ms→69,029ms (3.46×). These are one same-Mac profiled pair, not cold-cache, phone or
cross-device results. Summed process RSS remains an imprecise shared-mapping measure.

Raw768×432 PNG886,736bytes SHA256
`446d0a21aadf253df781c4d3a21a14a5800abaf598cbf7052f2677dc460d633a` looks near-identical to the
original but differs in bytes. Root's visual inspection retains crowded tail, uncertain Platypus
anatomy and diagnostic botany/detail limits. Speed does not qualify the painting; qualityAccepted
remains false. The prior1024 fused/duplicated Civet rejection stays intact. No model/game install,
cache-policy change, gameplay identity change, hosted action or release follows this experiment.

The derivative batch's final root validation PASS preserves1,010 named renders, zero boot
errors and50 original fingerprints. Legacy HTML SHA256 remains
`5d0844c45efa29ef0bd4d9f8254daeb1662d6f9e0934ceb6e30219d04e477746`.
This scoped validation does not replace full changed-head V2 admission or prior native blockers.


## Larger composition studies and canonical snapshot implementation

`browser-grounded-1024-01` runs one revised480-token replacement instruction using
the verified derivative. Technical generation completes76,800ms, but root rejects
the overlapping two-Civet anatomy and water contact. `browser-single-reference-1024-01`
uses the original299-token base instruction and one scene reference:67,515ms, one
Civet, but wrong gray/short facial identity and water placement remain. Both retain
rawPNG/fullrecipes/source/cleanup and explicit visual rejection/limits. This removes
an image and its related wording together, not an isolated image-count ablation.
The failed prompt source is preserved byte-for-byte and the prior wording restored.
The independent768 derivative visual review and corrected read-only5dcd6e64 signature
receipt are retained in this successor batch; the signing wrapper's original public-
key-format assertion followed a successful commit and was not a1Password failure.

`landfall-appearance-snapshot.ts` adds a pure source-produced appearance boundary:
actual branded roster admission, existing exact Earth gate, detached deeply frozen
full19roster plus six complete display identities/anchors, versioned schema/recipe,
no preview metadata or live authority in exported JSON. Nine new tests plus current
Earth/roster controls give33PASS; all3V2 TS and isolated entryTS PASS. The snapshot
requires no wall clock, gameplay RNG, save changes or image acceptance.

`snapshot-controls-01` then stops at first exporter failure: its new source observer
incorrectly rejected legitimate virtual compiler runtime `\0rolldown/runtime.js`.
The earlier passed steps, failed manifest and exact failed exporter source remain.
`snapshot-export-corrected-01` explicitly records only that known helper's source
hash, retains strict unknown/external refusals and removes the deprecated bundler
option. It exports59sources and releases the isolated build lease. Current canonical
JSON SHA256 `a23ef143d97bb7e72c8b5cc72b858266246fd72682dd29de00e0e3fc69848b3f`.

`browser-canonical-snapshot-preflight-01` proves actual served recipe equality,
source stability and owned browser cleanup. `PARITY.json` compares with the prior
identity recipe: request, all19roster, prompt, references and generation settings
match exactly; only appearance metadata is added. `REFUSAL_CONTROLS.json` records
seven actual pre-listen rejections. This is internal source-owned export integrity,
not an external authenticated importer or gameplay-authority reconstruction.
No new GPU inference, arbitrary world adapter or generated-art mount follows from
these input checks; all model-quality/device/full-admission blockers remain open.


Final review found that a disappeared captured source could throw from the runner's
`finally` block before its receipt was saved. `source-integrity.mjs` now checks all
local-tool and canonical source rows, records read failures/changes, and lets the
runner publish a red result. The real-file deletion/corruption control proves both
faults are retained and the original files pass after restoration. Final root
validation passes with unchanged legacyHTML. The changed finalizer's separate
`browser-canonical-snapshot-preflight-02` passes the native served-recipe check,
all81source rows unchanged and owned browser closure. No GPU inference was repeated.

The snapshot checkpoint staged-whitespace check returns2 for blank final lines in
two original raw logs (focused/typecheck); exact hashes and findings are retained
in `snapshot-checkpoint-whitespace.json`. Those logs are not trimmed or relabeled
PASS. The separately scoped non-audit/source whitespace check returns0.


## Advisory scene cache planning

The next local batch adds an unmounted pure planner for known encoded scene
variants. It supports explicit provisional500MB/1GB/2GB profiles and desktop
selection up to5GB, accounts for origin bytes once plus future margins/staging,
and proposes deterministic LRU removals only with verified surviving exact copies.
Sole originals, all non-scene data, pins, leases and in-flight entries are protected.
Unknown estimates or insufficient eligible space pause admission without partial
removal proposals. No storage I/O, UI setting, device detector or executor exists.
[Contract and first verification](SCENE_CACHE_PLAN.md):24focused tests, all3V2 TS
programs and rootvalidate PASS;7input hashes unchanged. Independent review's copy
identity consistency finding was corrected before execution. No new failed run or
retry. This does not close protected binary retention, cross-tab execution, device
qualification, art acceptance or full changed-head admission.
