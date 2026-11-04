# Local image-generation proof — third-party notices

Recorded 2026-09-09. These are retained source/license records for the isolated local
experiment. **Distribution is not qualified.** This packet does not add the model or
runtime to the game, authorize redistribution, or establish that every bundled dependency
and model conversion notice has been accounted for.

## Components and exact sources

| Component | Version/revision inspected | Retained license evidence |
| --- | --- | --- |
| Black Forest Labs FLUX.2 Klein 4B | `e7b7dc27f91deacad38e78976d1f2b499d76a294` | [Exact upstream Apache-2.0 text](licenses/flux2-klein-4b-LICENSE.md) from [the pinned model](https://huggingface.co/black-forest-labs/FLUX.2-klein-4B/blob/e7b7dc27f91deacad38e78976d1f2b499d76a294/LICENSE.md). |
| Qwen Qwen3-4B | `1cfa9a7208912126459214e8b04321603b3df60c` | [Exact upstream Apache-2.0 text](licenses/qwen3-4b-LICENSE) from [the resolved official model revision](https://huggingface.co/Qwen/Qwen3-4B/blob/1cfa9a7208912126459214e8b04321603b3df60c/LICENSE). |
| ONNX Runtime Web and Common | installed `1.29.0`; official `v1.29.0` source tag resolves to `2e2543fbe9fae542f921d47a72d21d5a4ef0b710` | [Full upstream MIT text](licenses/onnxruntime-1.29.0-LICENSE) and [exact installed Web bundle banner](licenses/onnxruntime-web-1.29.0-installed-banner.txt). Copyright (c) Microsoft Corporation. |
| Hugging Face Tokenizers.js | installed `@huggingface/tokenizers@0.2.0` | [Exact installed Apache-2.0 LICENSE](licenses/tokenizers-0.2.0-LICENSE). |
| cgb ONNX/WebGPU model conversion | `3bffc0efef1d9f84727036cdbc44df3b6ab51131` | Apache-2.0 is declared in the [pinned model card](https://huggingface.co/cgb/flux2-klein-4b-onnx-webgpu/blob/3bffc0efef1d9f84727036cdbc44df3b6ab51131/README.md). Its retained repository tree contains no separate LICENSE or NOTICE file. |

The full texts are preserved byte-for-byte, including original formatting and final-newline
presence. [provenance.json](licenses/provenance.json) records every local SHA-256/byte count,
source URL, resolved model/tag revision, installed package version, package JSON hash and
package-lock integrity. It also records the installed Web bundle hash whose leading license
comment was copied. These hashes establish the retained files' identity, not license completeness.

The installed ONNX Runtime Web/Common packages expose MIT package metadata, and the Web bundle
contains its MIT copyright banner, but neither installed package contains a standalone full
license/notice file. Therefore the full MIT text here comes from the [official immutable source
commit](https://github.com/microsoft/onnxruntime/blob/2e2543fbe9fae542f921d47a72d21d5a4ef0b710/LICENSE),
not from an invented installed LICENSE. The npm package metadata supplies no `gitHead`; resolving
the matching release tag does not establish a reproduced source-to-binary build.

## Remaining qualification boundary

The converter names FLUX.2 Klein 4B and Qwen3-4B but does not pin their conversion-source commits.
The FLUX revision was selected for this experiment; the official Qwen license revision was
resolved during this notice collection. Neither is represented as a proven ancestor of the
converted weight blobs. The quantization/export modifications are the converter's work; Celestial
Frontier's local driver and scene recipe do not rewrite the downloaded model files.

Before any distribution decision, reconcile the exact shipped model/runtime inventory with its
upstream attribution, modification and applicable NOTICE requirements, including bundled or
transitive runtime components and any source-derived pipeline code. In particular, the existing
mathematical source contract cites Diffusers; this bounded four-component collection does not
claim to complete that project's or the entire runtime dependency tree's notices. Preserve these
original license texts and the converter card rather than replacing them with this summary.

This collection read only small public metadata/license files and the already installed packages.
It installed no packages, downloaded no weights, ran no tests and performed no hosted write.
