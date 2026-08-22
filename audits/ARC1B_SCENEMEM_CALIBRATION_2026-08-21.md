# Arc 1B scene-memory calibration — 2026-08-21

This record fixes the tracked scene-memory ceilings from three independent local calibration runs. It is local exact-head evidence, not hosted terminal certification. Shipyard is not implemented and remains Arc 1C; the Arc 1B route covers Universe, Galaxy, Galaxy fine, System, Surface, and the 1,500-row Compendium fixture.

## Clean calibration authority

All three reports began and ended on the same committed, clean source authority:

- commit: `79c605f9c7ab8b63ad082d852c38d66ad6bb11af`
- branch: `openai/mac`
- source state: `committed`
- empty-status SHA-256: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
- working-tree SHA-256: `f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`
- production-build SHA-256: `2b0484df5c969e8c51853c2d15c1290bffbd98db6dd427abf4c2615a6c46341f`
- fixture: 1,500 rows; rows SHA-256 `daefba685c3e70febd94781d5b140659f741a181edc32154be57e631af361706`

The reports also share the exact producer authority carried into `port/v2/budgets/scene-memory-v1.json`:

| Producer input | SHA-256 |
| --- | --- |
| collector | `d9af74726d0227cdf6794e361e9ca9dc318a73cd65c9402dfdb43bd6ae20b55e` |
| browser CDP | `6da9e2efaaf7f91f9ad93c101368b847a7e77aeb015e83f7768fe11dd85147ce` |
| browser path resolver | `733ab771f60bead83e8d2af4d95339248f7c9b16879903ea89b817677e4a6bc0` |
| workspace lock | `e22a4c268ad0ce71a1c9160f45a2386c413c7fbcfc13f0cc457cf084ff0fd606` |
| fixture generator | `a1b294f0b8b5958910fd873f49d226f80447ad77381cccfd0acb21c82dc7aece` |
| verdict contract | `79e1f806aca3eabe7740b176164d940abfaf8254337d987dd3c651715d6d10b6` |
| fixture spec | `c5792c2c8605765b95170e8d954a157e60c9abfa37500ec93c5e1f81722f69f3` |
| fixture rows | `daefba685c3e70febd94781d5b140659f741a181edc32154be57e631af361706` |
| baseline save fixtures | `a52bfbdc1c65a418eed07a1e7ba5ffd07b36caf5ce10e587c7d34a717deab2a7` |
| root package | `6bad342bf5503275608ebae5c0e730658c82d608cd58f4c1d62a4457f85d673f` |
| root lockfile | `a6b7eb9f9439d7c76d7cf0ee154ef6221e9ad73226c7a5f0e893feaf4231a110` |
| game package | `d935051fd788aa303363adf84a51bc1b030ae05f488a0058585322465d9b7135` |
| game main | `24a51b6408e6dc755dd4315d8523f9ffe3db2c328e419d619122bfb82f829ac3` |
| scene texture owner | `db7af3f23c3b7d652df37cb54f1082eea177380aefd4f86bc16365a6adbed709` |
| Pixi managed-resource owner | `2d9eaeb667f5a4a763e25bd8e168b721494dda49c252e2411031a258d2653708` |
| Pixi batch texture array | `95ea401f9f05a933f17c9a327b94109bfcc46b0a21cc59789a66537a5b62deb3` |
| scene text | `7ea78c599fed72ab1ba65991270b72d642f6ec2f9768f63ad64d280ce9147731` |

Exact browser tuple for every run: executable `/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge`; product `Edg/151.0.4129.93`; revision `@4a822b1bb7a8566144cff23f6c09a2ab162665f9`; JavaScript `15.1.23.7`; protocol `1.3`; user agent `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0`.

Each run used one attempt, no automatic retry, four warm-up cycles, and four measured cycles. Each independently replayed all 40 contract outcomes successfully (`40/40`, zero failures), finished with lifecycle `complete`, and confirmed cleanup of the browser, server, and workspace lock.

## Retained candidates

| Run ID | UTC interval | Duration | Decompressed JSON SHA-256 | Gzip SHA-256 |
| --- | --- | ---: | --- | --- |
| `20260821-arc1b-calibration-candidate1` | `2026-08-22T00:16:59.671Z`–`2026-08-22T00:17:07.933Z` | 8,262 ms | `4c910d4969e4874f5c3ba63fc030888cecbfb6cf4fd4d6794ddb36def5142a56` | `45dea923ad3b7d1cc07df3349f2268430ad673046a18f086dc754d0cb30553ec` |
| `20260821-arc1b-calibration-candidate2` | `2026-08-22T00:17:22.843Z`–`2026-08-22T00:17:30.950Z` | 8,107 ms | `0e4d9d6c302cd34a6b6004c00c8442aecc542fc51758ac966803697b82e0b20f` | `754509a8e56dc9ca81f3ff864a3e6da68cb20bb3f94c6f7d0c2dbc4e5939bc30` |
| `20260821-arc1b-calibration-candidate3` | `2026-08-22T00:17:42.183Z`–`2026-08-22T00:17:50.106Z` | 7,923 ms | `93b7c10854ec950dc8d5b5ea33a4308762c79014e506a30023d301f6308c0e2c` | `9cc49cd08cfe61c132284134c451f88dd69d634f9b4cc0409bfadb92396f0b4c` |

The tracked budget file has schema `cf-v2-scene-memory-budget/v1` and SHA-256 `78a9e81a121d2598b8d83bbbd0c8311e503470dcd88083f959fc82c181ee5afb`.

## Observed maxima and selected ceilings

“Observed” is the maximum value seen across the three clean candidates for that profile. Bytes are shown as exact integers; timing is in milliseconds.

| Metric | Phone observed | Phone ceiling | Desktop observed | Desktop ceiling |
| --- | ---: | ---: | ---: | ---: |
| `heapUsedBytesMax` | 8,974,168 | 10,485,760 | 8,901,508 | 10,485,760 |
| `embedderHeapUsedBytesMax` | 3,795,336 | 4,194,304 | 3,315,192 | 4,194,304 |
| `backingStorageBytesMax` | 2,248,486 | 3,145,728 | 2,248,454 | 3,145,728 |
| `heapAggregateBytesMax` | 14,776,582 | 16,777,216 | 14,204,738 | 16,777,216 |
| `warmHeapAggregateRangeBytesMax` | 142,228 | 524,288 | 189,436 | 524,288 |
| `warmHeapSlopeBytesPerCycleMax` | 40,716.8 | 131,072 | 51,232.8 | 131,072 |
| `documentsMax` | 3 | 3.5 | 3 | 3.5 |
| `nodesMax` | 596 | 640 | 593 | 640 |
| `jsEventListenersMax` | 70 | 80 | 69 | 80 |
| `peakActiveLeaseCountMax` | 84 | 84.5 | 81 | 81.5 |
| `peakLiveTextureCountMax` | 74 | 74.5 | 72 | 72.5 |
| `peakLiveCanvasBytesMax` | 30,288,704 | 30,288,705 | 30,255,936 | 30,255,937 |
| `managedTextureCountMax` | 43 | 48 | 43 | 48 |
| `managedTexturePixelsMax` | 6,049,570 | 6,553,600 | 5,647,874 | 6,291,456 |
| `localCanvasCacheEntriesMax` | 0 | 0.5 | 0 | 0.5 |
| `peakLocalCanvasCacheEntriesMax` | 2 | 2.5 | 2 | 2.5 |
| `productRenderTargetsMax` | 0 | 0.5 | 0 | 0.5 |
| `ringCacheEntriesMax` | 0 | 0.5 | 0 | 0.5 |
| `peakRingGeometryEntriesMax` | 2 | 2.5 | 2 | 2.5 |
| `targetElapsedMsMax` | 7.439875 | 250 | 11.135 | 250 |
| `heartbeatElapsedMsMax` | 1.31575 | 100 | 1.460583 | 100 |

## Ceiling rationale

Exact product-owned sentinels get intentionally narrow thresholds: count-like integer outcomes use `+0.5`, and exact canvas-byte peaks use `+1`. Those bounds accept the calibrated integer but fail on the first additional owned unit. Settled canvas/ring caches and product render targets therefore remain effectively zero; transient cache and ring peaks remain exactly two; lease, texture, and canvas-byte peaks remain tied to the known route workload.

DOM counters and managed-texture proxies have modest cross-host headroom because browser bookkeeping and texture proxy representation can vary without implying retained product ownership. Answerability timing has similarly modest operational headroom for a loaded runner while remaining far below the command timeout. Absolute heap ceilings use deliberate MiB bands: 10 MiB V8 heap, 4 MiB embedder heap, 3 MiB backing storage, and a 16 MiB aggregate band for both profiles.

The four-cycle candidates alone observed aggregate ranges of at most 142,228 bytes on phone and 189,436 bytes on desktop, with slopes of at most 40,716.8 and 51,232.8 bytes/cycle. The retained post-fix 12-cycle diagnostic adds the longer-window check: full-window range was 496,188 bytes on phone and 513,652 bytes on desktop, while the full-window least-squares slopes were 41,991 and 47,012 bytes/cycle. Across every sliding four-cycle window, the maxima were 69,798 bytes/cycle on phone and 70,049.2 on desktop. That evidence selects a 524,288-byte range ceiling and a 131,072-byte/cycle slope ceiling: enough room for bounded inspector/GC phase placement across a longer window, but still materially below the pre-fix `BatchTextureArray` diagnostic slopes of 648,704 bytes/cycle on phone and 765,221 on desktop, which continue to fail.

The retained candidates are calibration-only reports (`calibration-only-not-certified`). They establish the budget and its authority; a separate exact-authority run using that budget is required for a certifying verdict, and hosted terminal-green status remains a separate GitHub check.

## Exact-budget local certification

Clean descendant commit `e244c9e2342c6abd79ca4efcd3d26eb46d3d8910` added only the tracked budget, retained calibration capsules and controls, and test-battery wiring; the product/ruler producer authority above remained unchanged. Its single local run `20260821-arc1b-local-certification` used that tracked budget once with zero retries and returned `PASS`: 40/40 outcomes, no findings or fatal events, complete lifecycle, browser/server/workspace-lock cleanup, and an independent `--verify-run` PASS. The decompressed report SHA-256 is `c487731dea7e7813b094cb1c080f04239e30c8c74e8be9322ae7de684a786d17`; retained gzip SHA-256 is `430ff07d46adf9ba060949a41f59632ddc2691fcbc9d1da330b5f9564178bb44`.

That report certifies exactly `e244c9e…`, not later documentation-only descendants and not GitHub's synthetic test-merge. The hosted test-battery remains unrun and unauthorized for this Arc 1B head.
