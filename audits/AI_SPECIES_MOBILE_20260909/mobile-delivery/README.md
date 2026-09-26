# Combined mobile AI delivery — 2026-09-09

Matches source in the commit containing this packet. Parent checkpoint is signed `83ee60f3`.
OpenAI/Codex · macOS · `/Users/nick/Projects/celestial-frontier-openai-mac` · `openai/mac`.
This is a local diagnostic implementation, not a hosted or physical-phone qualification.

`tools/local-image-generation/mobile-pack.mjs` uses the established Vite configuration and
sealed PWA builder with an explicit optional model transport policy. It adds every byte of an
externally SHA-verified runtime pack to the same exact service-worker asset inventory. The
ordinary build configuration remains unchanged. Controls compare its generated default worker
revision with signed83ee60f3 byte-for-byte, rather than accepting a merely similar source path.

The builder never downloads or includes model weights, installs a package, publishes, or overwrites
an existing output. It requires `--local-diagnostic`; artifacts are marked nonpublishable and
working-tree/evidence builds. Its final immutable manifest binds the exact written files, PWA
build identity, runtime inventory SHA and source checkpoint. Independent verification refuses
changed, omitted, unexpected, unsafe and model/source-map files. Final app + runtime + worker +
manifest admission remains128MiB. The exact static current/prior pair remains256MiB; without an
external prior package the arithmetic explicitly measures a same-size successor envelope.
Browser storage metadata, model OPFS, retained paintings and GPU/RAM are separate, unqualified
quantities. Arithmetic is not proof of physical browser disk usage or actual update activation.

A source review found that active + prior + an installing candidate can occupy three build caches.
The optional worker therefore also counts actual response payloads in every retained build cache
before installing and refuses before any candidate CacheStorage write could exceed256MiB,
including its completion marker. It deletes only the failed candidate and preserves prior data.
This executable guard covers the installation overlap that two-package arithmetic cannot prove.
Control-cache metadata and browser implementation overhead are explicitly outside that payload
measurement; the model download route never writes to CacheStorage.

The optional service worker allows only the20 exact pinned Hugging Face URLs from the existing
model manifest, GET, CORS, credentials omitted, a current/prior pinned document owner and bounded
open-ended resume Range. It issues no request until the existing explicit OPFS installation owner
asks for one. No response enters CacheStorage. CORS and complete-file SHA verification remain the
delivery owner's authority; redirects may resolve signed Hugging Face storage endpoints.
Normal workers still refuse all external resources. No model mirror/fallback is distributed.

The localhost static server verifies the entire package before listening, serves only enumerated
paths and rejects altered bytes before each response. It supplies COOP/COEP/CORP/nosniff and exact
MIME types (including the real Asyncify WASM), with genuine404s for missing assets. Initial
`/?localai=1` is allowed on the exact index document. Other asset query substitutions refuse.

## First controls

`controls-01.log`:7/7PASS, no retry. Native Node emits its expected experimental type-stripping
warning. Cases cover unchanged default worker hash, exact128/256MiB arithmetic and+1/invalid
controls, policy host/revision/query/duplicate/size refusal, no automatic model requests, explicit
streaming uncached GET/Range, denied writes/credentials/ranges/owners, cached runtime reads with
network absent, and modified PWA identity/table refusal. These are executed worker-program
controls, not a physical browser or phone claim.

`controls-02/stdout.log`:8/8PASS after adding the update-overlap guard. Source copies are retained
for this run. The new negative/positive control uses a synthetic cached response byte-length
fixture to prove refusal without prior deletion and successful installation when space is restored;
it does not allocate or claim a native256MiB cache. Normal worker byte identity still passes.
The species adapter owner also ran the unchanged34-case PWA suite and all three TypeScript programs
successfully before the subsequent overlap-guard addition; final combined checks remain separate.

## Actual combined package

The first actual build and its separate external-SHA verification both passed. The unchanged
package is `/private/tmp/cf-mobile-pack-20260909-species-01`,97files totaling56,528,315bytes
(53.91MiB), leaving77,689,413bytes below128MiB. Its same-size successor envelope is113,056,630bytes
(107.82MiB), leaving155,378,826bytes below256MiB. These are exact encoded payload totals, not
browser storage-overhead, physical-phone or full-model measurements.

- Mobile manifest SHA: `4ed80ae51e216306a548d55e1f980735c08ff25bec6b563e2887cc9e992b7e53`.
- PWA build ID: `9eb570011711a9f939815f07cfd57433cae578669b3695272fa6d8c283e52a47`.
- Runtime manifest SHA: `ddc09e2128a6fbfea11b3c6b0596359eb97fd7f18198fed38c74b3736502476b`.

`build-01/` retains the artifact inventory, exact commands, output and before/after source hashes.
All measured build inputs stayed unchanged. Vite's standard large-chunk warning remains recorded;
no warning threshold or chunking rule was relaxed. Its aggregate staysFAIL because the following
package test's before-hook passed an already-created `mkdtemp` directory to strict non-overwriting
`fs.cp`, producing0PASS/8hook failures before HTTP or mutation assertions. The pure checks after it
were not run. Neither the independently successful build nor the first failure is relabelled.

The corrected fixture copies into a new `package` child under the temporary parent, preserving
`errorOnExist:true`, `force:false`, the exact source package and every assertion. No product,
worker, output package or verification budget changed; the package was not rebuilt.
`package-controls-02/` passed8/8 real-package/HTTP controls and8/8 final pure controls with unchanged
measured sources. It proves exact package/runtime tables and totals; same-length tamper, omission,
symlink, extra app/model/map/empty-directory and qualification-promotion refusal; correct localhost
headers/MIME, initial`?localai=1`, genuine404s, and refusal of post-startup changed bytes followed
by success after exact restoration. Its HTTP server and locks closed normally. The restored test
copy remains at `/private/tmp/cf-mobile-package-controls-SCUhG2/package` for local diagnosis.

Actual service-worker controlled browser/offline reopen, full6.23GiB installation and physical
phone results remain separate native evidence. This package/control receipt does not claim them.

## Preserved package02 after required release-note update

The native full-model candidate was `/private/tmp/cf-mobile-pack-20260909-species-02`.
`build-02/` records why a changed build was necessary: the required draft development release
bullet now describes the individual reference inputs and reachable Pause control. It changes no
release/version identity or gameplay behavior. The only changed application input is
`port/v2/apps/game/src/release-content.ts`; the separately corrected package test fixture is not
an application input. No source/runtime/model dependency changed, and no old output was overwritten.

Build02 and its separate external-SHA verification bothPASS; all426 measured source hashes stayed
unchanged during this run. Current totals are97files,56,528,433bytes (53.91MiB), with a same-size
successor envelope of113,056,866bytes (107.82MiB). External mobile manifest SHA is
`15cad742de80e6d1488c1d5f2af429c09b913481ebb372a3950df918de6c6485`; PWA build ID is
`3f7ca9a54a4d7daecd5c59f0f61f586e4c3684fb93241e6d822712b8fd3be39a`.
The runtime external SHA is unchanged. The8 package/HTTP and8 pure controls above remain explicitly
bound to unchanged package01 before the release-text edit; no new browser/device result is inferred.
The full-model native attempts used package02. The six-reference generation used its separate
local game-preview owner. Current module proof uses package03 below.

## Current package03 and native outcomes

`build-03/` independently builds and verifies the optional worker-import correction and its draft
release text, retaining all 426 measured input hashes unchanged. Package03 is
`/private/tmp/cf-mobile-pack-20260909-species-03`: 97 files, 56,529,354 bytes / 53.91 MiB; same-size
retained pair 113,058,708 bytes / 107.82 MiB. Runtime manifest SHA remains unchanged.

- Mobile manifest SHA256: `5dc7a6e41eebe0e71c399db7c526d87ca47a43d850bb1fc3111dcf8c94aa0d5c`.
- PWA build ID: `42d79c05f4b5269766d35e82c03f7b828f70062dc2bdca54ee98ca5f643465b4`.

[Full-model native01/02](../MOBILE_NATIVE_RUNNER.md) remain aggregate FAIL. Native02 positively
records full twenty-file Install/Pause/Range resume, actual controlled server-off offline reload,
full native rehash and twenty production Blob reads. The final module observer failed. All model
bytes came from an existing local mirror; no real CDN/phone transfer or model inference was tested.

[Worker-import diagnosis](../WORKER_IMPORT_DIAGNOSIS.md) isolates static imports carrying worker
destination and empty resultingClientId. Optional imports now require explicit worker:true ownership
bound to the same retained build, with existing exact cache/asset guards. Ten package/ownership and
two reply controls, 34 existing PWA tests, three TypeScript programs and root validation pass.
[Native04](../offline-runtime-native-04/result.json) passes using unchanged package03: actual ESM
replies online/offline through its pre-GPU guard, exact cached assets/lazy WASM bytes, absent model
store and complete cleanup. It does not allocate a model or qualify a physical phone. Earlier
packages, failed attempts, qualification flags and physical-device boundaries remain unchanged.

## Commands

Run each command under the shared toolchain foreground lock. The build/verify CLIs themselves
hold the checkout workspace lock. Use a new output directory and an externally recorded runtime
manifest SHA; never rely on a surviving temporary directory alone.

```sh
node tools/with-toolchain-lock.mjs --label mobile-ai-pack-build -- node tools/local-image-generation/mobile-pack.mjs build --output=/private/tmp/cf-mobile-ai-UNIQUE --runtime=/private/tmp/cf-runtime-UNIQUE --runtime-sha256=EXTERNAL_SHA --local-diagnostic
node tools/with-toolchain-lock.mjs --label mobile-ai-pack-verify -- node tools/local-image-generation/mobile-pack.mjs verify --output=/private/tmp/cf-mobile-ai-UNIQUE --sha256=EXTERNAL_MOBILE_SHA
```

Native tools can import `createMobilePackServer({directory, expectedManifestSha256})`, which binds
only127.0.0.1 and returns the exact origin, request ledger and owned close operation. Browser tools
must run outside macOS Seatbelt under the same locks, retain first failures and close their browser,
server and locks before claiming success.

The isolated assembly tool imports the existing TypeScript PWA and model metadata directly.
This batch uses installed Node26.8.1 and requires native TypeScript stripping; no broader Node
compatibility is claimed by these runs. This is a local authoring-tool limit, not a browser/player installation or a
change to the normal Vite build/runtime dependency contract. The first baseline controls compared
Git83ee60f3 directly; the current portable check stores the independently measured default worker
revision`cb8017579878e3ea3ce74d59047e57036897b4963d34291012ace439d9389496`
so it also works in a shallow clone.

The companion review packet now corroborates native runtime source-version correspondence from
embedded WASM commit2e2543fbe9, npm integrity and the matching official source notice. It does not
prove a reproduced binary build or selected-component SBOM. Full distribution acceptance and
physical iPhone/Safari/PWA/install/thermals/inference latency remain separate gates.
