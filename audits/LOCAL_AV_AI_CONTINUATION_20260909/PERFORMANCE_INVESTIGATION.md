# Browser image-generation performance investigation — 2026-09-09

This record separates measured bottlenecks from source-derived hypotheses. Raw model graphs and
weights stay unchanged. Actual native profiling adds overhead and is not an optimized baseline.

## Text-stage observation

The original `browser-native-profile-01` instrument failed its grouping limit. Its complete raw
trace is retained separately from corrected offline analysis; the original verdict remains FAIL.
GPU MatMulNBits dispatches consumed6,628,303us (96.3% of6,884,136us observed GPU time). CPU Node
spans total28,074us. Twenty-seven host readback intervals before CPU IsNaN sum6,745,424us but
include waiting for prior GPU work; do not add that to GPU time or call it CPU computation.
`NATIVE_TEXT_DIAGNOSIS.json` and the corrected-parser analysis retain exact totals and raw hashes.
These are text-encoder observations, not yet an explanation of the slow image sampler.

## Rejected immediate rewrite: IsNaN → Not(Equal(X,X))

Read-only protobuf inspection found27 IsNaN nodes in the text graph, following Softmax and
feeding Where before attention MatMul. The transformer has zero IsNaN nodes. Both use opset18.
Pinned graph hashes:

- text_encoder_q4.onnx: e1670f1d203cf2e5cadecce4b2c13d436eefa228a66b7bc6bc629074e9dc0a1b
- transformer_q8.onnx: 1c56c0b6ce5ce474a5ae5cc126ec3201516540e7f743de308dc07c9e72fb6102

ORT1.29 at2e2543fbe9fae542f921d47a72d21d5a4ef0b710 registers float16 Equal and boolean Not:
[Equal source](https://github.com/microsoft/onnxruntime/blob/2e2543fbe9fae542f921d47a72d21d5a4ef0b710/onnxruntime/core/providers/webgpu/math/binary_elementwise_ops.cc#L472),
[Not source](https://github.com/microsoft/onnxruntime/blob/2e2543fbe9fae542f921d47a72d21d5a4ef0b710/onnxruntime/core/providers/webgpu/math/unary_elementwise_ops.cc#L187).
However, [WGSL floating-point rules](https://www.w3.org/TR/2026/CRD-WGSL-20260831/#floating-point-evaluation)
permit assumptions excluding NaN/infinity. Self-comparison is therefore not a proven portable
NaN-preserving substitute merely because the IEEE algebra works. This rewrite is not implemented:
it targets the smaller text stage and carries an unqualified semantic risk. No graph editor,
package install, derivative weights, tests or model run was created for it.

## Device-feature hypothesis — investigation pending

The proof explicitly requests shader-f16, plus timestamp-query in profiling mode. Other optional
adapter features are not enabled automatically on a requested GPUDevice. Inspect exact native
ORT MatMulNBits fast-path conditions and actual supported adapter features before deciding
whether an explicit optional-feature experiment is justified. No speedup is claimed yet.


## Native sampler result and feature disposition

Corrected profile02 completes all five stages. Sampler GPU time is206,655,649us;412MatMulNBits
dispatches account for197,359,252us (95.5015%). The profiled raw output exactly matches the same-
Mac unprofiled768×432 dual-reference PNG. This is one recipe/device, not general pixel parity.

ORT's default device requests available subgroups, but enabling it alone cannot unlock this
Apple/WASM Q8 fast path. Subgroup matrices are excluded under __wasm__, DP4A excludes Apple,
and the remaining wide tile requires block32. All103 current transformer nodes use block128.
Exact source links, hashes, node metadata and eligibility are retained in
`q8-block32-feasibility.json`. No ungrounded feature-toggle model run was attempted.

## Next separately identified derivative

All103 packed-weight shapes are uint8[N,K/128,128], with explicit f16 scales and uint8 zero
points. K is divisible by128 and changed initializer names have unique consumers. Their numeric
represented weights can remain unchanged with block32, unchanged contiguous B payload, and each
scale/zero repeated four times. No re-quantization or retraining is proposed. Extra data would
be347,332,608bytes plus graph/manifest, using the original verified shards read-only. The full
metadata receipt includes the first rejected absent-zero diagnostic and corrected768-value sample.
A converter must reject conflicting shape annotations, duplicate protobuf fields/attributes,
unsupported types and existing output directories. Actual model import, GPU kernel selection,
latency and raw output comparison remain required; a mathematical packing proof alone is not
inference or quality acceptance. New `tools/local-image-repack/` work is pending separately.
