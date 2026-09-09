# Static local AI browser runtime pack — 2026-09-09

Local authoring and verification only. The first focused controls passed **11/11**; the first real pack build and separate expected-manifest-SHA verification passed. No package installation, model download, model inference, browser qualification or hosted write occurred. This packet does not supersede the game/model/quality blockers in `ROADMAP.md` or the earlier native evidence.

## Artifact and exact accounting

The review output is `/private/tmp/cf-runtime-pack-20260909-build-01`. It has 23 inventoried payload files plus `runtime-pack-manifest.json`: **28,393,596 bytes (27.078 MiB)** total. Twenty copied files contribute 28,381,215 bytes; three generated files contribute 4,567 bytes; the inventory contributes 7,814 bytes. There are **no model graphs, weight shards or tokenizer data files**.

External manifest SHA-256: `e2442474afd168c2a7a9f1fb798591583b3ead962ef9135a0980c0f9d739ae21`.
Source-pin SHA-256: `e8e46745d13041b01b80fbffc8e16d489f9a0962914957b0783b35a559a90514`.

The standalone runtime leaves 105,824,132 bytes below the unchanged 128 MiB shipped-pack bound. This is **not combined application admission**: the application and this runtime must be inventoried together. The unchanged 256 MiB retained-update constraint still applies to the complete retained builds. Both qualification flags remain false; no cache policy, service worker or automatic update was added.

## Runtime interface

Deploy the generated `__local_ai/` tree at the same game origin under `/__local_ai/`, preserving relative paths. `runtime.json` uses `cf.local-ai-runtime-pack.v1`, `modelSource: verified-opfs-only`, `modelFiles: {}`, `q8Block32: false`, `autoDownload: false`, and `qualityAccepted: false`. It pins model revision `3bffc0efef1d9f84727036cdbc44df3b6ab51131` and the existing source manifest SHA. The caller must verify installed OPFS model files before filling only verified Blob URLs; this pack provides no developer-file fallback.

The worker URL is `/__local_ai/stage-worker.mjs`. The exact retained Platypus identity is bound to `/__local_ai/reference.png`, SHA `0b4584f76ce18f42e38e0c28e9a42758280d0c0de390d45371422a7e4c91fe57`. The original PNG is copied unchanged at 1536×1024; the runtime conditioning dimensions remain 480×320. This binding is a recipe reference, not an assertion of generated animal fidelity.

`build-01/deployment.json` records the secure-context, COOP/COEP, MIME, resource-policy and no-HTML-fallback requirements. Verify the real application's CSP and Blob/WASM behavior before deployment. The pack does not include a service worker; asset version/cache identity must use the accepted external manifest SHA.

## Reproduction and receipts

Run these commands only under the shared foreground toolchain lock. The CLI additionally acquires the checkout lock. Choose a new output path; existing outputs are always refused.

```sh
node tools/local-image-generation/runtime-pack.mjs build --output=/private/tmp/NEW_UNIQUE_RUNTIME_PACK
node tools/local-image-generation/runtime-pack.mjs verify --output=/private/tmp/NEW_UNIQUE_RUNTIME_PACK --sha256=EXTERNAL_SHA_RETURNED_BY_BUILD
```

`controls-01/result.json` retains the two syntax checks, first 11-test result, frozen tool/test/pin copies and hashes. `build-01/result.json` retains exact argv, output path, byte totals and both PASS results. The small manifest/config/deployment/notices are copied into that directory; the 27 MiB pack itself stays outside tracked source. Test artifacts remain at `/private/tmp/cf-runtime-pack-controls-zA5YEO`; only synthetic test source copies were removed during test cleanup.

The builder accepts only pinned regular files, checks package versions and npm integrity, hashes in 1 MiB chunks, parses import closure, rechecks source after copying, and writes the inventory last. Verification requires its expected external SHA and rejects changed, missing, unsafe or extra payloads. Failed outputs are preserved and never reported ready.
