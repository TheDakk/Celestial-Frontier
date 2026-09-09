# Static Earth landing painting — verified local display prototype

Current September 8, 2026 state: **the six-file candidate is applied and bound to
its real exported asset; scoped integration verification passed**. This is a display/quality
prototype. Nick requires finished scenes generated on demand during play and wants local
generation investigated first; no per-planet catalogue or generation service is implemented. Nick explicitly
approved ImageMagick resize/encoding while preserving quality. The optional
`paintedlanding=1` route selects one leased opaque Civet landing still for the
complete canonical Earth request/all-19-genome admission. Existing roster rows,
accepted UI band, default presentation and gameplay identity remain unchanged.
[Application receipt](integration-start.json).

The unchanged [1875×839 master](civet-landing-original.png) is 2,885,444 bytes,
SHA `e7ef04af6c5d75bad9e41a26082f814a95893928e814309dd8a720e4fa2a2740`.
The [lossless 960×430 export](export-lossless/earth-civet-landing-v1.webp) is
600,756 bytes, SHA `cd2c616abb35610f6ec63382f6476436f27a8c1a2c698757c8a66d34a5b2e0ec`.
Its decoded RGB exactly equals the [resized reference](export-lossless/display-reference.png);
resizing still reduces spatial detail relative to the full master. The original
[export receipt](export-lossless/receipt.json) retains its honest
`ENCODING_EXACT_BUT_OVER_RUNTIME_BUDGET` result against the old 512 KiB limit.
The current loader accepts an explicit exact byte count up to 640 KiB, and this
recipe declares exactly 600,756; undeclared loads retain the original 512 KiB
ceiling. This narrow source change does not relabel the earlier receipt or prove
runtime performance. [Storage and quality details](STORAGE_AND_QUALITY.md).

## Preserved preparation history

The six original runtime candidate files remain under [prepared-source](prepared-source/)
and in [prepared-runtime.patch](prepared-runtime.patch). They record the earlier
unapplied state while export permission was pending. They are not the final asset-bound
source and must not overwrite the current digest or exact-size loader change.
[The original preparation receipt](prepared-runtime.json) retains the first wrong-path
apply-check failure. [The corrected check](prepared-runtime-check.json) passed against
that patch once without applying it. Both immutable receipts retain their original
state; a clean apply check was not compilation or runtime proof.

The separate [math-foundation static chain](../CIVET_PAINTED_PARTS_20260908/static-corrected-results.json)
passed all three V2 TypeScript programs and root validation after the earlier restoration.
The then-unapplied candidate was **not validated by that PASS**. Current candidate tests,
static checks, build and native outcomes must be recorded against their own frozen source.

## Verification and local preview

- [First focused/static chain](integration-static-results.json): 11 files / 146 tests PASS,
  then TS2352 in the new mutable deep-clone fixture. Validation/browser stages did not run.
- [Corrected static chain](integration-static-corrected-results.json): the explicit clone cast
  was corrected; five changed-file tests, all three V2 TypeScript programs and root validation
  PASS. Root HTML stayed byte-identical: 1,010 named renders, zero boot errors, 50 fingerprints.
- [First native chain](native-v2/chain-report.json): one evidence build; desktop and phone PASS,
  then blocked mode stopped on an observer error treating server-wide file inventory as the
  selected page's request trace. The wrong SHA had already been rejected by the loader.
- [Remaining corrected chain](native-v3-remaining/chain-report.json): only blocked and default
  ran on that unchanged build. Both PASS; page-session/request/payload/loader correlation and
  ten mutated evidence controls reject wrong observations. Prior desktop/phone reports, images,
  source hashes and the complete 97-file dist are bound and retained without rerun/rebuild.
- [Local preview](preview-package-results.json): ordinary distributable package and isolated
  browser check PASS. Its parent is acca36b; it is explicitly dirty-local-only, publishable:false,
  not a clean-commit certificate. No diagnostic game API is installed in this human package.

[Review the static Earth prototype](http://127.0.0.1:64179/?paintedlanding=1), served only on
this Mac by PID24408 / exec76755. [Server receipt](preview-server.json) binds the exact package;
content SHA `473671306f100ece340e6e78ba2c7d2d9a5902103035c3ba2274e655dd41c0d5`.
Skip Field Training for this disposable review, use Search to follow
`CF1|g:999@90,-60|s:424242@560,170|p:133#2`, then use the actual Survey/Land controls.
The browser-panel request was queued, not proof Nick viewed it. The server owns no authoring
lock. Earlier preview servers and their origins remain untouched. Stop only this server using
its recorded live PID after verifying identity; restart its unchanged server helper with the
absolute package path and a new receipt path. No hosted publication occurred.

[Desktop/phone visual assessment](VISUAL_REVIEW.md) · [Player storage measurement](player-storage-build.json).

`native-landing-still-runner.mjs` is the original independent preparation copy adapted from
[the settled Earth observer](../AV_EARTH_LAYERED_SCENE_20260908/native-earth-layers-settled-runner.mjs).
It and `native-landing-still-chain.mjs` remain unchanged preparation evidence. The current
`native-landing-still-v2-runner.mjs` / `native-landing-still-v2-chain.mjs` pair is the
first integration observer pair; its recorded partial PASS and instrument failure remain intact.
V3 runs only the corrected remaining modes against that same build. The bounded chain targets desktop
1440×1000 at DPR 1, phone 390×844 at DPR 2, wrong-asset fallback and default fallback,
in that order on four fresh origins. It stops on the first nonzero/timeout,
ambiguous report or source/dist drift. Each observer has a 90-second native-work
bound; the child process limit is 150 seconds including startup/cleanup.

The parent supplies one frozen evidence dist, a new output directory, the shared
foreground and checkout leases, and approved macOS browser execution outside
Seatbelt. No runner acquires nested locks or builds/tests sources.

Expected runtime contract:

- `?paintedlanding=1`, variant `painted-earth-civet-landing-v1`, one actual labeled
  `earth-painted-landing-still` sprite backed by one opaque 960×430 owned canvas.
- Exact native Earth Survey/Land, one durable safe-Earth receipt, same full
  navigation address/environment/profile; the actual Planetside DOM retains
  count 19 and the canonical full-roster fingerprint. All 19 genome equality and
  each-resident mutation rejection belong to the source-bound focused admission
  tests at [painted-earth-landing-binding.test.ts](../../port/v2/tests/painted-earth-landing-binding.test.ts)
  (applied and tested). The earlier prepared copy remains historical.
  No private runtime roster or mutation hook is introduced or claimed.
- Actual Pixi geometry independently agrees with the existing upper-chrome to
  Biosphere DOM band. The same composition acceptor receives the baseline,
  hidden sprite, visible globe/cloud, old H÷2 placement, and restored observations.
  Full-stage paint deltas and exact restores supplement 35 native canvas hit
  samples and unchanged DOM control rectangles. One full opaque image replaces
  the earlier two-layer expectation; no individual-resident proof is asserted.
- Wrong-asset mode fulfils only the exact new image URL with the prior valid
  `earth-riverbank-v1.webp` bytes plus trailing padding to exactly 600,756 bytes,
  correct MIME/200 and a different SHA. Padding is a pre-decode hash control, not a claim
  that the padded file is an approved or decoded asset. The loader
  must report `painted vista SHA-256 mismatch`, make one fetch and retain canonical
  fallback. Default mode must make zero new painted-asset requests.
- Native Escape (desktop) or Survey/Leave world (phone) retires the actual sprite,
  texture/source/lease and shrinks the owned still canvas to 1×1; fallback keeps
  its existing 960×430 cache. Loader abort/decode/current/last state and the cloud
  container's actual retirement remain measured.

This is a bounded optional static landing pilot. It does not establish human art
acceptance, complete anatomy from pixels, Compendium portrait extraction, live
creature animation, full battery certification, physical iPhone/Safari or native
GPU-driver memory release. Preserve prior D-9e and verification blockers in the
root handoff; this packet does not supersede earlier evidence.
