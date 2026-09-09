# Browser Klein proof: mathematical source contract

Matches inspected graph metadata and authored math as of 2026-09-09. This is a
bounded browser proof component, not accepted painting quality, browser execution,
phone qualification, game integration or cross-device pixel parity. Tests are
prepared, **not run** in this authoring batch.

## Immutable sources

Model: [`cgb/flux2-klein-4b-onnx-webgpu`](https://huggingface.co/cgb/flux2-klein-4b-onnx-webgpu/tree/3bffc0efef1d9f84727036cdbc44df3b6ab51131),
revision `3bffc0efef1d9f84727036cdbc44df3b6ab51131`, Apache-2.0 declared.
The latest two commits add a VAE encoder, although README still lists three graphs.
The complete runtime tree, excluding sample art/README/.gitattributes, totals
**6,691,020,416 bytes (6.2315 GiB)** including all tokenizer files. This is disk
content, not activation/peak RAM/GPU memory or a disposable scene-cache allowance.
Carry upstream licenses/notices with redistribution; metadata alone is not a
complete notice package. No weight `.data` files were downloaded for this review.

Graph protobufs were read in memory and checked against the listed public LFS
SHA-256 values; their code was not executed:

| Graph | Bytes | SHA-256 |
| --- | ---: | --- |
| `vae_encoder.onnx` | 596081 | `f7cc93e70cc3a9555cb7bf1b02d2eaab83d706cf0a4ddf6da86dffb56daf05f9` |
| `transformer_q8.onnx` | 4991601 | `1c56c0b6ce5ce474a5ae5cc126ec3201516540e7f743de308dc07c9e72fb6102` |
| `vae_decoder.onnx` | 760826 | `05f3f6de75b760d5f3b6cbd6efa40ddc8bb7bc4dad58c1dabc85e96383871a7d` |

Encoder external weights: `vae_encoder.onnx.data`, 137756672 bytes, SHA-256
`9ac7e0847f5b1a6a077ad38688042a53bc004e986d15dc8c0e37a962aad68671` (metadata only).
The model tree contains no exporter/browser driver source. The linked live driver
returned HTTP403 during source inspection; no bypass or runtime-version inference.

Official mathematical source is Diffusers commit
`040c7cde626504d14caf63b13b8b25b6a9f62120` (Apache-2.0):

- [Klein pipeline](https://github.com/huggingface/diffusers/blob/040c7cde626504d14caf63b13b8b25b6a9f62120/src/diffusers/pipelines/flux2/pipeline_flux2_klein.py):
  source SHA-256 `8a57a8a7f1c22fc0c5bc5d3fd1bd9bc76c17c1f4d6644cc73370651dd955358e`;
  image positions/packing lines319–395, reference preparation519–545, scheduler811–823,
  concat/sliced update840–879.
- [Empirical scheduler helper](https://github.com/huggingface/diffusers/blob/040c7cde626504d14caf63b13b8b25b6a9f62120/src/diffusers/pipelines/flux2/pipeline_flux2.py#L159):
  source SHA-256 `1b08ae75e2f9490146571f55a1466461fab415463ee3513ccc4ee831db3da6dd`.

## Contracts used by the module

Batch size is exactly one. Pixel dimensions are multiples of16. Math transpose
arguments are **packed** dimensions (`pixelHeight/16`, `pixelWidth/16`).

- Encoder: `sample` float32 `[1,3,H,W]`, preprocessed RGB in `[-1,1]`; output
  `packed_latent` float32 `[1,128,H/16,W/16]`. Its final graph nodes select the
  posterior mean, patchify2×2, subtract folded mean and divide folded standard
  deviation. Do not sample posterior noise, patchify or normalize that output again.
- Transformer: `hidden_states` float16 `[1,N,128]`, `encoder_hidden_states` float16
  `[1,T,7680]`, `timestep` float16 `[1]`, `img_ids` int64 `[1,N,4]`, `txt_ids`
  int64 `[1,T,4]`; output `noise_pred` float16 `[1,N,128]`. `N` is dynamic and
  includes output and fixed reference tokens; these shape declarations do not prove
  every larger shape fits or runs correctly in WebGPU.
- Decoder: **`packed_latent` float32 `[1,128,h,w]`**, output `sample` float32
  `[1,3,16h,16w]`. The README's final32-channel/8× bullet is stale. The graph already
  folds denormalization and unpatchification; the module only transposes token order.
- IDs are `[t,row,column,0]` in row-major token order; generated t=0, references
  t=10,20,... . References are appended unchanged on each denoising call. Integrate
  only the leading output-token predictions. The module returns a fresh output
  array and cannot mutate borrowed reference latents.
- Sigma schedule uses the pinned official empirical mu, **output tokens only**,
  exponential time shift of `[1,...,1/steps]`, then terminal0. At1024tokens/4steps,
  mu=`2.030689707949945`. This differs materially from the conversion README's
  older linear-shift example mu≈0.63. Record the chosen recipe, not a mixture.
- Noise is separately versioned recipe data: explicit uint32 seed, mulberry32
  stream with midpoint-open uniforms, Box–Muller pairs. It does not consume game
  RNG and does not reproduce PyTorch's normal generator. JS transcendental/GPU
  rounding is not a promise of identical pixels on different devices.
- Binary16 scalar conversion rounds binary32 ties to even. Tensor wrappers reject
  nonfinite/overflow values. Euler storage is float32, with float16 input conversion
  at the driver's call boundary; this is not upstream binary16 accumulation parity.

Module allocation guards (16384latent tokens,4194304tensor elements,1000steps) bound this pure
proof utility; they grant no device admission. Root owns output/reference caps,
preprocessing, tokenizer/text IDs, runtime pin, downloads, worker staging, disposal,
network/offline checks and actual visual acceptance. A square512 output and one
bounded reference are suitable first operational dimensions, not acceptance of
lower image quality than the approved full cohesive paintings.

## Exact text preparation for the driver

The pinned official Klein helper208–260 wraps one user message with
`add_generation_prompt=true`, `enable_thinking=false`. For a plain string prompt
and no tools/system message, the pinned cgb Jinja template emits exactly:

```js
'<|im_start|>user\n' + prompt + '<|im_end|>\n' +
'<|im_start|>assistant\n<think>\n\n</think>\n\n'
```

The empty think tags are part of disabling thinking, not unwanted reasoning to
remove. Tokenize to512 with RIGHT padding, pad ID151643 (`<|endoftext|>`), actual
text attention mask1 then padding mask0. EOS is151645. No BOS/default system
message is added. Official Python enables right truncation; for the bounded proof,
count the full wrapped text and refuse >512 tokens so source instructions cannot
silently disappear. The cgb tokenizer config itself omits padding/truncation side;
[Transformersv4.57.1 base defaults](https://github.com/huggingface/transformers/blob/v4.57.1/src/transformers/tokenization_utils_base.py#L1417)
are right/right and its Qwen2TokenizerFast class does not override them. Set them
explicitly in the JS driver instead of relying on another runtime's defaults.

`txt_ids` is int64 `[1,512,4]`, **`[0,0,0,l]` for l=0..511**, including the padding
positions; it is not all zeros. This is the official `_prepare_text_ids` helper,
lines266–282 of the pinned Klein pipeline. The text graph already returns the
layer9/18/27 combination as `[1,512,7680]`; do not re-stack its output. The tensor
wrapper cap covers all3,932,160 text values as well as latent tensors.

## Prepared focused check

From the repository root:

```sh
node --test tools/local-image-generation/pipeline-math.test.mjs
```

Checks cover independent scheduler anchors/inverse outcomes, stale-schedule and
reference-token-count controls, every finite binary16 roundtrip plus known halfway
cases, deterministic normal-distribution outcomes and zero/uniform controls,
non-square channel/pixel identity, reference IDs and output-only Euler semantics.
No model run, browser check, package installation or test command was executed by
this component's author. The coordinating agent owns the first fail-stop execution
and durable receipt; its result must not be inferred from this prepared document.


## Native ORT profiling instrument · 2026-09-09

The actual proof loads `ort-wasm-simd-threaded.asyncify.mjs`, which uses the native
WebGPU provider. The former unexecuted JSEP-only collector has been replaced;
`env.webgpu.profiling.ondata` is not used. Source is pinned to ORT1.29.0 commit
`2e2543fbe9fae542f921d47a72d21d5a4ef0b710`, MIT:

- [WASM session options](https://github.com/microsoft/onnxruntime/blob/2e2543fbe9fae542f921d47a72d21d5a4ef0b710/onnxruntime/wasm/api.cc#L151-L155)
  enables native profiling through `enableProfiling:true`.
- [Native profiler storage](https://github.com/microsoft/onnxruntime/blob/2e2543fbe9fae542f921d47a72d21d5a4ef0b710/onnxruntime/core/common/profiler.h#L146-L152)
  is `std::cout` under WASM. [Emission](https://github.com/microsoft/onnxruntime/blob/2e2543fbe9fae542f921d47a72d21d5a4ef0b710/onnxruntime/core/common/profiler.cc#L127-L160)
  writes a complete Chrome-trace JSON array on `endProfiling`, one event per line.
  `profiler.cc` SHA256 `07e4b045f87cc28ae6ba80afa0e079eb2b94e0677d943aa5c43c3e4fb97b2736`.
- [Categories](https://github.com/microsoft/onnxruntime/blob/2e2543fbe9fae542f921d47a72d21d5a4ef0b710/include/onnxruntime/core/common/profiler_common.h#L14-L29)
  are Session, Node, Kernel, Api. [WebGPU events](https://github.com/microsoft/onnxruntime/blob/2e2543fbe9fae542f921d47a72d21d5a4ef0b710/onnxruntime/core/providers/webgpu/webgpu_context.cc#L875-L892)
  use Api, pid/tid−1, name, shapes and cache_key; hardware nanoseconds are divided
  by1000 and rounded to **microseconds** for native ts/dur. Context SHA256
  `f58ff773be3d61ef9b285372010ed9caddcdaa4a70686b622c33bdf6dc561c88`.
- [Public JS endProfiling](https://github.com/microsoft/onnxruntime/blob/2e2543fbe9fae542f921d47a72d21d5a4ef0b710/js/common/lib/inference-session-impl.ts#L221-L223)
  returns void; [WASM wrapper](https://github.com/microsoft/onnxruntime/blob/2e2543fbe9fae542f921d47a72d21d5a4ef0b710/js/web/lib/wasm/proxy-wrapper.ts#L258-L270)
  calls the native core. Return is not a profile-completion receipt. Installed
  asyncify JS binds `console.log` during WASM initialization, so the worker installs
  its wrapper before session creation and activates capture only at endProfiling.
- [Native MatMulNBits](https://github.com/microsoft/onnxruntime/blob/2e2543fbe9fae542f921d47a72d21d5a4ef0b710/onnxruntime/contrib_ops/webgpu/quantization/matmul_nbits.h#L81)
  accepts bits4/8/2. Header SHA256
  `85809a902a1f1996b0f86068b34cb93bbce1d963abe5045343aea5a5622be58a`.
  The old JS Q4-only TODO cannot establish native Q8 CPU fallback. Node assignment
  warnings alone do not identify the kernels responsible for slow sampling.

`--profile` is explicit and incompatible with `--preflight`; it may accompany
one of the existing reference modes. Normal inference does not enable profiling
or request timestamp-query. Profile mode refuses absent timestamp-query support
before creating a session, then profiles every graph stage including all four
transformer steps. This instrumentation perturbs performance and is not a new
baseline, optimization, device admission or quality acceptance.

`gpu-profile.mjs` retains at most32MiB of stdout per stage,100000 events and2048
aggregate groups, with at most five stages. Capacity, version, malformed/nonfinite
metadata, incomplete framing, missing Node/GPU events or zero total GPU duration
are failures. There is no silent truncation, zero-cost assumption or idle/drain
heuristic. The30second completion deadline is a failure bound only. Completion
requires the actual closing JSON array and a successful full parse **before**
release; successful release is observed before worker completion/termination.
Normal cancellation and crash remain failures and cannot manufacture a profile.

The runner retains raw stdout with SHA256 and separate summary files before
propagating a stage error. Truncated red traces are explicitly failed snapshots,
not valid JSON/complete evidence. Full traces are kept out of the frequently
polled DOM/event log. CPUExecutionProvider Node intervals remain distinct from
other providers' host Node intervals and GPU timestamp dispatches; these sums
may overlap and must not be added together or equated with end-to-end latency.
Groups retain actual native program names and shapes; raw traces retain cache keys,
individual intervals and other categories for later diagnosis.

Prepared focused command (coordinator owns execution and receipt):

```sh
node --test tools/local-image-generation/gpu-profile.test.mjs
```

Ten cases cover known microsecond totals, provider separation, dimension groups,
actual multiline framing, missing/zero samples, stale JSEP/native contracts,
nonfinite/negative fields, byte/event/group capacity, retained malformed/partial
outputs and profile flag compatibility. No tests, browser or inference were run
by this component author in the profiling batch. The first actual profiled result
must establish native stdout/timestamp operation; this source contract does not
claim it has already succeeded.


### Native name grouping correction after first retained profile failure

The first native profile attempt stopped in the text stage with
`Native profile group limit`. Its complete raw trace has4639 events and2088745
bytes; the run remains **FAIL**. Before correcting source, exact failed collector,
tests and this preceding contract were preserved under
`audits/LOCAL_AV_AI_CONTINUATION_20260909/browser-native-profile-01/failed-instrument-source/`.
The preservation receipt checks collector/test hashes against the run's start
inventory; the contract was not in that runner's mjs/json/html inventory.

The missing source detail is [PendingKernelInfo's constructor](https://github.com/microsoft/onnxruntime/blob/2e2543fbe9fae542f921d47a72d21d5a4ef0b710/onnxruntime/core/providers/webgpu/webgpu_context.h#L34-L42):
`absl::StrJoin({kernel_name, kernel_type, program_name}, "&")`.
Header SHA256 `ba00159f04840eaf2b187d8b086fe23a0b516237fdfc0f8d14aa541759583f31`.
[The caller](https://github.com/microsoft/onnxruntime/blob/2e2543fbe9fae542f921d47a72d21d5a4ef0b710/onnxruntime/core/providers/webgpu/webgpu_context.cc#L666-L669)
passes `context.NodeName()`, `context.OpType()`, `program.Name()`, then the cache key,
inputs and outputs. A value such as `node_linear_188_Q4&MatMulNBits&MatMulNBits`
is a node label plus op and program, not one kernel/program name.

The corrected key is actual `(opType, programName, shapes)`; unique graph node
labels and weight-dependent cache keys are not keys. Each group retains the first
three full native-name/cache-key dispatch examples; the raw trace still retains
every original label, cache key and event. Actual shape and program distinctions
remain separate, and the **2048 total-group cap is unchanged**. Malformed, empty
or ambiguous names fail instead of merging into an unknown/default bucket.

The prepared regression uses2065 unique node labels for one op/program/shape and
checks exact retained count/duration plus bounded examples. A mutant with truly
distinct shapes must fail the unchanged cap. Separate controls reject malformed
native names and keep different ops/programs apart. Thirteen focused cases are
now prepared; the author did not run them or rerun inference. The independent
numeric reading of the original text trace is diagnostic only and cannot relabel
the original failed run or establish transformer-stage performance.


### Explicit block32 derivative — September9 continuation

The default transformer remains the pinned original Q8/block128 graph. The
`--q8-block32` proof option accepts only the repository-owned
`q8-block32-manifest.json` variant `q8-block32-repacked-v1` and exact graph/data
hashes. It cannot accompany preflight. The loopback server verifies original
model files first, then both derivative files from one fixed ignored directory.
It serves exactly those two files alongside the original three read-only shards;
generated manifest paths or success flags never choose runtime locations.
Only the denoiser receives the variant. Text/encoder/decoder inputs stay unchanged.

The converter's separate17-test/real-byte evidence is in `repack-controls-01`
and `repack-conversion-01` under the September9 continuation packet. All103
MatMulNBits nodes now declare block32; contiguous uint8 B bytes/ranges stay
unchanged. Exact original float16 scale and uint8 zero bytes repeat four times.
Every347,332,608 derived parameter byte was independently re-read and compared;
non-target protobuf fields/order remain byte-preserved. New graph4,991,273 bytes,
SHA256 `cda0a0e0d2778f83236557bcde8d474fed89a2fcbc817ea04f4758d2a064aed8`;
new data SHA256 `5ba0370ea1eb7af85042aea2a143398990d87759efaf5f36857ad019ce066d82`.

Represented weights match, but GPU accumulation order may change. Neither the
pin nor the conversion receipt claims runtime qualification, identical activations,
identical images or accepted art. The first native comparison owns those separate
observations. The changed bridge's38 focused checks passed, including original
model preservation, unknown-variant rejection and real corrupt/truncated/symlink
file refusals. These checks do not establish GPU speed or final quality.
