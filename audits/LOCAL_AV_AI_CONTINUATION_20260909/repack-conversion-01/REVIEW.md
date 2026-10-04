# Independent block32 bridge and receipt review

Reviewed 2026-09-09 by a separate Codex agent. Read the new bridge and its browser/server/worker
routing, then compared the repository pin with the retained conversion records. No tests,
conversion, inference, browser run, network access or source changes were performed for this
review. Only this document was written. This is not an independent rerun of the converter.

**No actionable wrong-model, routing or quality-claim defect was found within this bounded
inspection. Pin/receipt metadata is consistent. GPU execution, numerical image equivalence,
performance and art quality are outside this review and remain unqualified here.**

## Bridge scope

The explicit derivative option selects only the denoiser graph. Text encoding, reference
encoding and output decoding retain their original graphs. The worker routes the derivative
graph alongside the three original transformer shards and the new scale/zero parameter file.
The runner verifies the parent inventory before inference; the bridge binds the expected parent
model/revision/graph SHA and checks the derivative files' exact byte counts and streamed hashes.
It rejects symlinks, mismatching files and changes observed during verification. A missing pin
fails closed. The repository pin, rather than the converter's machine-local source-directory
field or status prose, supplies the runtime identity. Both acceptance flags remain false.

Reviewed wiring: `q8-block32.mjs`, `proof-server.mjs`, `stage-worker.mjs`, `browser-proof.mjs`,
`run-browser-proof.mjs`, and the derivative argument parsing in `gpu-profile.mjs`. This does not
re-audit the converter's graph mathematics or every existing browser lifecycle path.

## Read-only consistency observations

The pin's parent model ID/revision and original graph SHA match `model-manifest.json` and the
conversion receipt. All three original shard path/byte/SHA records also match that inventory.
Both derived file records match the pin, receipt and derivative manifest exactly:

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| `transformer-q8-block32.onnx` | 4,991,273 | `cda0a0e0d2778f83236557bcde8d474fed89a2fcbc817ea04f4758d2a064aed8` |
| `repacked-scale-zero.data` | 347,332,608 | `5ba0370ea1eb7af85042aea2a143398990d87759efaf5f36857ad019ce066d82` |

The two retained tensor ledgers agree: 206 entries across 103 node names, with output lengths
summing to 347,332,608 bytes. The four external-data names agree with worker routing. Parsed
stdout and receipt contents agree while their distinct original byte representations/hashes
remain intact. The stdout/stderr hashes match `run.json`; that wrapper records exit0/PASS,
while the conversion records explicitly say `DERIVATIVE_VERIFIED_RUNTIME_PENDING`.

The converter records that scale/zero bytes were independently re-read and B ranges retained;
this review confirms consistency of those records, not a fresh comparison of all weight bytes.
The derivative manifest explicitly retains `accumulationOrderChanged:true`; represented-weight
validation is not a GPU output-equivalence claim. `runtimeQualified:false`, `runtimeVerified:false`
and `qualityAccepted:false` remain in their respective carriers. The native trial has its own
separate receipt and later visual review; no outcome is inferred from this conversion PASS.

## Exact reviewed record hashes

- `receipt.json`: 130,873 bytes; SHA-256 `48d1744e6d4e30fb1ad1aa132f39c293f7feac3cb5640bfe0796413d939df29a`.
- `run.json`: 861 bytes; SHA-256 `4480a7b50db9e944fbd5ef64d53710c61764d847b03d3da5c7464d75381deb7e`.
- `stdout.json`: 93,313 bytes; SHA-256 `8deaf54ce933ad2bd4dcf805b5cffbebe4b8215a749055ef237b05a1be38731d`.
- `start.json`: 1,176 bytes; SHA-256 `3874e0ae717fb2fc575b7711e47b4d822bfcc8792a0157ee74fb0f1dfca4d061`.
- `derivative-manifest.json`: 131,950 bytes; SHA-256 `f7ae6ea3197ef3915394882fe0ac071fc431ec75aa1a19d180396474061fe391`.
- `stderr.log`: 0 bytes; SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.

Reviewed source/pin SHA-256 values (paths relative to `tools/local-image-generation/`):

- `q8-block32.mjs`: `ca9817919519c86b39e4323b13288df73405feb9c7c0d7dcf7bd7113afb53402`.
- `q8-block32-manifest.json`: `d04d80a9c0c73e7ee73ef6a725b4f8e1b9c914d64c5c7b53e1b824c0197b0fe5`.
- `proof-server.mjs`: `4afc08aba3915ee9ba00398e97244cf7999edf1428735e995b8bc29afd7223a8`.
- `stage-worker.mjs`: `9398f955121c5af591aba146cb282096d133b1f561e49f17ef750b23668e1311`.
- `browser-proof.mjs`: `2dc02483e2889bff331c8e4ce0abd8834f476fd63d8c9aff4b1a2b30f6865ccb`.
- `run-browser-proof.mjs`: `43e0b41249f323ffaef5cc7e49c49346be0bf2f60e79618ad9d6b528d2639fc6`.
- `gpu-profile.mjs`: `0c737f91c3031dbe9b12daf31914b12970c041acf61965063a603f2a5d0f49a3`.
