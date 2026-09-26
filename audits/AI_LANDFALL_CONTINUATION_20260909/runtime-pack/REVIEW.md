# Runtime closure and controls review — 2026-09-09

## Closure actually packaged

The pinned worker imports three project helper modules, Tokenizers.js 0.2.0, and `onnxruntime-web/dist/ort.webgpu.min.mjs` from ONNX Runtime 1.29.0. The installed ORT entry dynamically selects **`ort-wasm-simd-threaded.asyncify.mjs`**, whose browser runtime loads **`ort-wasm-simd-threaded.asyncify.wasm` (25,749,873 bytes)**. Packaging JSEP instead would miss the actual selected runtime. The complete static import graph is grammar-parsed; the one computed browser import and two Node-only `module`/`worker_threads` branches are accepted only in the exact pinned loader files. Tokenizers' installed browser module has no additional ESM imports. Maps, model files and unused runtime variants are omitted. The worker remains unchanged and forces one WASM thread.

The loader contains dynamic compilation; this packet records a requirement to test the deployed CSP rather than claiming a particular policy has already passed. No deployed/native browser run was performed for this packaging batch.

## First outcome controls

All 11 tests passed once under both the shared toolchain wrapper and checkout lock. The real installed-only build and second deterministic build produced the same external manifest SHA. Controls then refused missing WASM, a same-length dependency byte mutation, altered package/lock identity, missing notices, symlink source/output ancestors, existing output, unsafe or duplicate/model paths, and an added static import even when its fixture SHA was repinned. Verifier controls rejected a modified payload, substituted/unsafe manifest and extra unlisted file. Restoring bytes passed against the original external SHA. These mutate only temporary source/output fixtures, not installed dependencies or game owners.

The actual local output was then built once and independently verified by the CLI using that exact external SHA. The verifier demonstrates byte readiness; it does not execute WASM, prove a complete game offline cache, attest a phone, or accept generated artwork.

## Attribution and remaining scope

The pack retains the installed Tokenizers Apache-2.0 license, existing exact ONNX MIT license/banner and provenance, existing model-context notices, plus two official source texts retrieved in this bounded batch:

- [ONNX Runtime ThirdPartyNotices at 2e2543fbe9fae542f921d47a72d21d5a4ef0b710](https://raw.githubusercontent.com/microsoft/onnxruntime/2e2543fbe9fae542f921d47a72d21d5a4ef0b710/ThirdPartyNotices.txt), SHA `53d3fa5821ac016ac24dd35775c996efec86e2ae0841e9a3a5e146c0ae916845`.
- [Diffusers license at 040c7cde626504d14caf63b13b8b25b6a9f62120](https://raw.githubusercontent.com/huggingface/diffusers/040c7cde626504d14caf63b13b8b25b6a9f62120/LICENSE), SHA `f9e2070c247517b1ddf65f7b11b393484a18da91a958fd18a97bd0f241c3125c`.

`license-source/provenance.json` retains retrieval evidence, including the pinned Diffusers root NOTICE's HTTP 404; no NOTICE was invented. The project pipeline preserves that revision's source-contract attribution. The source notice aggregation resolves the missing notice text, but does not prove the npm WASM binary's exact component/build correspondence. The pack therefore retains `distributionQualified: false` pending that correspondence and integration review. Model-context licenses do not make this pack a model distribution.

All prior production-quality, device capability, model storage, complete-app admission and retained-update blockers remain separate. The next integration uses this installed-only config and verified OPFS Blob URLs; there is no automatic multi-gigabyte download, no alternate-model selection, and no new scene generation in this packet.
