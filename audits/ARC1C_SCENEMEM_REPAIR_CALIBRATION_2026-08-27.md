# Arc 1C SceneMemory closed-surface repair calibration — 2026-08-27

This record activates a narrowly bounded heap-only update to the Arc 1C SceneMemory ruler after
the closed-Inventory and delegated-panel-opener ownership repair. Three independent clean
current-product calibrations support 12 MiB for V8 heap and 18 MiB for aggregate heap on both
profiles. Every DOM, listener, range, slope, resource, lifecycle and timing ceiling remains
unchanged.

## Exact source, product and ruler authority

All three candidates began and ended on the same clean committed source:

- commit: `6c9ad85577bd90d6af883dd7b3f13556d24eb3ad`
- tree: `a389646081f9fb5246825d1ac187eeb06504a8e4`
- parent: `862a75b316142348636abea442dab15e87393642`
- branch: `openai/mac`
- state: `committed`
- empty status SHA-256: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
- clean working-tree SHA-256: `f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`
- report/input schemas: `cf-v2-scene-memory-report/v2` /
  `cf-v2-scene-memory-input/v3`
- built-product schema: `cf-v2-scene-memory-build/v1`
- built-product graph: 42 files; SHA-256
  `46e473657f3cda06a6e445c1588ae983f270822d3e745f9009e20bed083f9274`
- serialized build-file inventory SHA-256:
  `3d91bfb1fc1457bbac3309e84b998898591cb762c48060c1132c33190c3a2782`
- fixture: 1,500 rows; rows SHA-256
  `daefba685c3e70febd94781d5b140659f741a181edc32154be57e631af361706`

The exact producer tuple in every report equals the tracked budget authority:

| Producer input | SHA-256 |
| --- | --- |
| collector | `dd41b2901185e225197a3e3991dbfca42766154889bffb756900ade3cd22a6a8` |
| browser CDP | `6da9e2efaaf7f91f9ad93c101368b847a7e77aeb015e83f7768fe11dd85147ce` |
| browser path resolver | `733ab771f60bead83e8d2af4d95339248f7c9b16879903ea89b817677e4a6bc0` |
| workspace lock | `e22a4c268ad0ce71a1c9160f45a2386c413c7fbcfc13f0cc457cf084ff0fd606` |
| fixture generator | `a1b294f0b8b5958910fd873f49d226f80447ad77381cccfd0acb21c82dc7aece` |
| verdict contract | `8b36ec211b8d3355a710408c3399d0d7157686f43734e5b47d531f783bef59e5` |
| fixture spec | `c5792c2c8605765b95170e8d954a157e60c9abfa37500ec93c5e1f81722f69f3` |
| fixture rows | `daefba685c3e70febd94781d5b140659f741a181edc32154be57e631af361706` |
| baseline saves | `a52bfbdc1c65a418eed07a1e7ba5ffd07b36caf5ce10e587c7d34a717deab2a7` |
| v2 package | `87551923ad5af540270ecbbeef73b97bcf90d82ae66867e59a844f1815a98106` |
| v2 lockfile | `a1f1dc3335714fe40c06a99684a5da9d66ea1a24d9db73594efe5b15c11fcd6e` |
| game package | `69e7a046ca620dafabb38d0471b59f682fdc5b15433c2207bcf18a218f38c7de` |
| built product | `46e473657f3cda06a6e445c1588ae983f270822d3e745f9009e20bed083f9274` |
| game HTML | `88074f1c1f360a35f0718386c9619c1801aac1f5abc7b259b606b94cc9d00c30` |
| game main | `7ff00481432163560c61a8dda931a9b99850b06d5a60199b3a02e2ecb48aa5cf` |
| ship visual state | `9bfd27d3d6a75779d3372dfb6386e8e98ef22d92a33b0346819225024c70d762` |
| Shipyard preview | `a3aac0c541a8f824a3625778e89468b5b03653dd29820c3b024fa45a7c753e85` |
| planet texture attachment | `751cb34df8ead64fc5ad274a0fd55dfe1af7bb183949ffebcea2ada5de5903e0` |
| planet texture demand | `a537aacde361e88b692887e6d2fa67674296d828aa0d297673dc34b147322055` |
| scene texture owner | `db7af3f23c3b7d652df37cb54f1082eea177380aefd4f86bc16365a6adbed709` |
| Pixi managed-resource owner | `2d9eaeb667f5a4a763e25bd8e168b721494dda49c252e2411031a258d2653708` |
| Pixi batch texture array | `95ea401f9f05a933f17c9a327b94109bfcc46b0a21cc59789a66537a5b62deb3` |
| scene text | `7ea78c599fed72ab1ba65991270b72d642f6ec2f9768f63ad64d280ce9147731` |

## Browser authority and point-version law

Every candidate recorded the same complete browser provenance:

- executable: `/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge`
- product: `Edg/151.0.4129.107`
- revision: `@419e77616b4ed7d0a544b85cb53ccd5b74d5f135`
- JavaScript: `15.1.23.12`
- protocol: CDP `1.3`
- user agent: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36
  (KHTML, like Gecko) HeadlessChrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0`

Edge `.107` is provenance only. The reusable ruler binds Microsoft Edge family + CDP `1.3`, the
capability contract SHA-256
`58487bff9b835edcc108ce033e900db84f54b447c46f283cf2c6cce1753edef7`, and the profile
contract SHA-256
`f565ba2a38577f80c16c41762a5fb4e2214f3b320c50e017f1262c0784a6a0ef`. It does not pin a
point version, revision, JavaScript build, user agent or executable path. A routine compatible Edge
update does not require rebaselining or move a threshold; a producer, capability, protocol or
profile-contract change still fails closed.

## Retained exact carriers

Each candidate ran exactly once with zero automatic retries, four unmeasured warm-up cycles and
four measured cycles. All covered Universe, Galaxy, Galaxy fine, System, Surface, the 1,500-row
Compendium and implemented-static Shipyard. Each completed 42/42 outcomes with no findings or fatal
events, unique phone/desktop targets and document tokens, and true browser/server/workspace-lock
cleanup. Each remains marked `calibration-only-not-certified`.

| Run ID | UTC interval | Duration | Raw bytes / SHA-256 | Gzip bytes / SHA-256 |
| --- | --- | ---: | --- | --- |
| `20260827-phase4-repair-candidate1` | `17:28:41.284Z`–`17:28:51.301Z` | 10,017 ms | 305,457 / `d447a5c76bcfbc1e9df87c51f0c35bc6e960c70f6afb31f8bdcf54765efcb39b` | 22,278 / `bd91cbbfba7daf7fd283f2f1d523a34ca0aed1b46a8d5acb6030889b80df75d1` |
| `20260827-phase4-repair-candidate2` | `17:29:23.979Z`–`17:29:34.312Z` | 10,333 ms | 305,452 / `e6ec574ddd5f475158d78bdd960dbd11541e16502b6a6bfce69a5484b34ba7da` | 22,268 / `6f7d0a17cc60fda9c8c07d0e41d9206c1ea7d2c63233c0cc3494e03ecfb67a14` |
| `20260827-phase4-repair-candidate3` | `17:30:01.030Z`–`17:30:11.586Z` | 10,556 ms | 305,301 / `52d54330efc5ca07ded8645fb1b33e029ed7da11cc18ae892c38e0a0e7ce08f7` | 22,214 / `6015b3620aadf55b3abdb807cdc19bb97b85b37e21b3f3d8ba2e6a1ddd59fc82` |

All intervals are on 2026-08-27. All three carriers pass `gzip -t`; deterministic `gzip -9 -n`
recompression reproduces each recorded gzip SHA-256 exactly. The focused test independently hashes
compressed and decompressed bytes, reconstructs every metric from raw points, binds the source,
browser, producer, build and fixture tuples, and byte-replays the imported verdict.

## Independently recomputed metrics and selected ceilings

### Phone

| Metric | Candidate 1 | Candidate 2 | Candidate 3 | Maximum | Ceiling |
| --- | ---: | ---: | ---: | ---: | ---: |
| `heapUsedBytesMax` | 11,566,152 | 11,560,168 | 11,512,616 | 11,566,152 | **12,582,912** |
| `embedderHeapUsedBytesMax` | 3,481,240 | 3,500,024 | 3,478,096 | 3,500,024 | 4,194,304 |
| `backingStorageBytesMax` | 2,877,762 | 2,877,834 | 2,877,834 | 2,877,834 | 3,145,728 |
| `heapAggregateBytesMax` | 17,675,214 | 17,681,258 | 17,634,678 | 17,681,258 | **18,874,368** |
| `warmHeapAggregateRangeBytesMax` | 133,024 | 149,348 | 116,400 | 149,348 | 524,288 |
| `warmHeapSlopeBytesPerCycleMax` | 44,907.2 | 56,304.4 | 45,648.4 | 56,304.4 | 131,072 |
| `documentsMax` | 3 | 3 | 3 | 3 | 3.5 |
| `nodesMax` | 676 | 676 | 676 | 676 | 704 |
| `jsEventListenersMax` | 71 | 71 | 71 | 71 | 80 |
| `peakActiveLeaseCountMax` | 84 | 84 | 84 | 84 | 84.5 |
| `peakLiveTextureCountMax` | 74 | 74 | 74 | 74 | 74.5 |
| `peakLiveCanvasBytesMax` | 30,288,704 | 30,288,704 | 30,288,704 | 30,288,704 | 30,288,705 |
| `managedTextureCountMax` | 43 | 43 | 43 | 43 | 48 |
| `managedTexturePixelsMax` | 6,049,570 | 6,049,570 | 6,049,570 | 6,049,570 | 6,553,600 |
| `localCanvasCacheEntriesMax` | 0 | 0 | 0 | 0 | 0.5 |
| `peakLocalCanvasCacheEntriesMax` | 2 | 2 | 2 | 2 | 2.5 |
| `productRenderTargetsMax` | 0 | 0 | 0 | 0 | 0.5 |
| `ringCacheEntriesMax` | 0 | 0 | 0 | 0 | 0.5 |
| `peakRingGeometryEntriesMax` | 2 | 2 | 2 | 2 | 2.5 |
| `targetElapsedMsMax` | 9.19604199999958 | 7.94420799999989 | 7.605666999999812 | 9.19604199999958 | 1,000 |
| `heartbeatElapsedMsMax` | 1.5418330000002243 | 1.365958999999748 | 1.4466249999995853 | 1.5418330000002243 | 100 |

### Desktop

| Metric | Candidate 1 | Candidate 2 | Candidate 3 | Maximum | Ceiling |
| --- | ---: | ---: | ---: | ---: | ---: |
| `heapUsedBytesMax` | 11,602,208 | 11,628,536 | 11,630,936 | 11,630,936 | **12,582,912** |
| `embedderHeapUsedBytesMax` | 3,389,992 | 3,335,256 | 3,353,888 | 3,389,992 | 4,194,304 |
| `backingStorageBytesMax` | 2,877,874 | 2,877,874 | 2,877,874 | 2,877,874 | 3,145,728 |
| `heapAggregateBytesMax` | 17,614,246 | 17,632,682 | 17,636,682 | 17,636,682 | **18,874,368** |
| `warmHeapAggregateRangeBytesMax` | 188,996 | 218,248 | 193,332 | 218,248 | 524,288 |
| `warmHeapSlopeBytesPerCycleMax` | 63,914 | 72,506.8 | 64,800 | 72,506.8 | 131,072 |
| `documentsMax` | 3 | 3 | 3 | 3 | 3.5 |
| `nodesMax` | 673 | 673 | 673 | 673 | 704 |
| `jsEventListenersMax` | 70 | 70 | 70 | 70 | 80 |
| `peakActiveLeaseCountMax` | 81 | 81 | 81 | 81 | 81.5 |
| `peakLiveTextureCountMax` | 72 | 72 | 72 | 72 | 72.5 |
| `peakLiveCanvasBytesMax` | 30,255,936 | 30,255,936 | 30,255,936 | 30,255,936 | 30,255,937 |
| `managedTextureCountMax` | 43 | 43 | 43 | 43 | 48 |
| `managedTexturePixelsMax` | 5,647,874 | 5,647,874 | 5,647,874 | 5,647,874 | 6,291,456 |
| `localCanvasCacheEntriesMax` | 0 | 0 | 0 | 0 | 0.5 |
| `peakLocalCanvasCacheEntriesMax` | 2 | 2 | 2 | 2 | 2.5 |
| `productRenderTargetsMax` | 0 | 0 | 0 | 0 | 0.5 |
| `ringCacheEntriesMax` | 0 | 0 | 0 | 0 | 0.5 |
| `peakRingGeometryEntriesMax` | 2 | 2 | 2 | 2 | 2.5 |
| `targetElapsedMsMax` | 8.969166000000769 | 9.657332999999198 | 9.97754199999872 | 9.97754199999872 | 1,000 |
| `heartbeatElapsedMsMax` | 1.3477079999993293 | 0.43220800000017334 | 1.3235830000012356 | 1.3477079999993293 | 100 |

## Heap-only activation and headroom

The immediate pre-activation budget, already rebound to this current producer, has SHA-256
`110211c3f53e623f3eff1d6df7b01606225baef6cde9a0682b5460abb04dffe5`. The activated budget
has SHA-256 `e6c4aeea762fc0e36432cda131a0f75dc77fef857ea8bfb852b9188b3aef7375`.
The complete numeric diff is exactly:

| Profile | Field | Before | After | Maximum observed | Exact headroom |
| --- | --- | ---: | ---: | ---: | ---: |
| phone | `heapUsedBytesMax` | 10,485,760 | 12,582,912 | 11,566,152 | 1,016,760 B (8.08% of ceiling) |
| phone | `heapAggregateBytesMax` | 16,777,216 | 18,874,368 | 17,681,258 | 1,193,110 B (6.32% of ceiling) |
| desktop | `heapUsedBytesMax` | 10,485,760 | 12,582,912 | 11,630,936 | 951,976 B (7.57% of ceiling) |
| desktop | `heapAggregateBytesMax` | 16,777,216 | 18,874,368 | 17,636,682 | 1,237,686 B (6.56% of ceiling) |

`port/v2/tests/scenemem-budget.test.ts` proves that these are the only four values changed from the
immediate pre-activation profiles. It replays all three candidates green with strict headroom over
every metric; lowers every positive ceiling below its own largest observation; injects the first
integer into every calibrated-zero field; accepts each activated heap ceiling exactly; and rejects
the next byte with the exact field/value/ceiling diagnosis.

The preserved paired broken baseline
`ARC1C_SCENEMEM_CURRENT_INPUT_FAILURE_20260827_163818607.json.gz` remains red after activation:
phone still has 898 nodes / 90 listeners and desktop 895 / 89 against unchanged 704 / 80. Its replay
now contains no heap breach, and a second replay with both heap ceilings removed still fails only
those same DOM/listener outcomes. This proves the heap update did not bless the closed-surface
ownership defect that the product repair removed.

Historical Edge `.101` local certificates and the hosted Linux timing red retain their original
source, producer, build, budget and browser truth. They are replayed as historical evidence rather
than rewritten against this activation.

## Claim limits and next evidence

- These are local calibration-only reports, not an exact-budget SceneMemory certificate.
- They do not make Compendium, Slice, Glass, recovery, HUMAN, hosted CI, a pull request or an
  integration ref green.
- They do not authorize a version bump, release, publication or deployment.
- A clean committed activation source must still run one exact-budget SceneMemory certificate and
  named verifier before the serial campaign can proceed.
- The ruler still excludes Shipyard build writers, audio lifecycle and true GPU-byte accounting.
  Product-owned decoded pixels and managed-texture pixels remain named proxies, not portable
  physical GPU-memory claims.
