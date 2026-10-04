# Additive delivery boundary

`delivery-v2.json` is the current deliverable inventory and supersedes only the file-inclusion boundary of `delivery.json`. The original manifest and every earlier result remain byte-identical history. Neither candidate is qualified, and no source/runtime result changes.

All compiled `*.bundle.mjs` executables stay local and are ignored by Git. `local-bundles.json` preserves their exact native bytes/count/hash records without delivering the executable content. The three dense bundles contain generic third-party absolute-path documentation examples; none contains the owner's actual home path. Excluding every bundle avoids publishing those examples and keeps a consistent source-only reproduction boundary.

The retained `run-probe.mjs`, `run-dense.mjs` and `run-stage.mjs` are the audit bundling entry points. Their adjacent execution receipts bind the exact bundle hashes and all input source hashes used at execution. Reproduction requires matching those recorded inputs and the toolchain; current helper source may include later additive corrections, so rebuilding current source is not asserted to reproduce a historical executable byte-for-byte. The exact historical executables remain available locally. Do not rewrite historical execution receipts or infer that an omitted executable was never run.

This change adds only the delivery manifest, exclusion receipt and local ignore policy. All original paintings, authored fits, negative controls, dense result data and full-size review images remain delivered.
