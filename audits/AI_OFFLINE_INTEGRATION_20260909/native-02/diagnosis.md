# Read-only timeout diagnosis and next bounded step

Observed boundary: the actual worker emits `loaded` immediately after denoiser session creation.
The product translated that to Drawing at 31.706 s after Land. A completed step is emitted only
after `session.run()`, `noise_pred.getData()`, the CPU Euler update and tensor disposal. The current
receipt cannot distinguish those boundaries. The 600 s timeout covers worker creation, session
loading and all four steps; it is not a sliding progress deadline. Model execution may have begun
without producing a first-step report.

Sources: [stage-worker](../../../tools/local-image-generation/stage-worker.mjs),
[product stage lifetime](../../../port/v2/apps/game/src/local-ai-runtime.ts), and
[this run](result.json). The sixteen retained ORT messages are provider-assignment warnings also
present in prior successful runs. No GPU validation error or crash is recorded in this receipt.
That does not establish the absence of device loss or a graphics stall. The failure screenshot
also timed out, so a responsive graphics path at termination is not proven.

The earlier [1024 portable run](../../LOCAL_AV_AI_CONTINUATION_20260909/browser-1024-quality-01/result.json)
used two references, 512×288 and 480×320. Its denoise events report loaded at 6,963.755 ms, first
step at 74,758.670 ms and completion at 281,687.380 ms: 67,794.915 ms between loaded and first step.
That is a different workload. The six-reference 135.671 s output used the block32 derivative;
it cannot supply a timing claim for this original Q8 graph.

Sequence arithmetic: output contributes 2,304 tokens; the earlier two inputs contribute 576 and
600, with 512 text tokens, totaling 3,992. The present six 480×320 inputs contribute 3,600, totaling
6,416 with output and text. A prior [native graph trace](../../LOCAL_AV_AI_CONTINUATION_20260909/browser-native-profile-02/native-profile-4-denoise.json)
records `node_MatMul_453_kernel_time` output `[1,24,2984,2984]` float16 and 427,404,288 bytes on
WebGpuExecutionProvider. Extrapolating that materialized score shape to 6,416 tokens gives
1,975,922,688 bytes per score tensor and 2.583 times the 3,992-token area. This is **shape arithmetic,
not measured current native memory or proof of OOM**. Additional GPU work, transient allocation
pressure and a graphics stall remain hypotheses. This record does not choose one as root cause.

Next Codex implementation: add a bounded first-step diagnostic for the same portable graph and
exact six-reference recipe/shape, retaining the original four-step sigma schedule. Persist markers
immediately before and after `session.run()` and `noise_pred.getData()`, and direct `device.lost` /
uncaptured-error evidence, then stop after the first step. Use already present pinned model bytes;
no second full installation is needed solely to separate compute/readback/device failure. Check
its positive/error/timeout controls before one changed native attempt. Keep existing product
quality gates and timeout, source freeze and shared locks. This diagnostic has **not** been
implemented or run in this checkpoint. Do not rerun the unchanged full native02 command.
