# Arc 1C scene-memory calibration and local certification — 2026-08-22

This record fixes the Arc 1C `cf-v2-scene-memory-budget/v2` authority and ceilings from three independent clean local calibration runs, then records one clean local exact-budget certification. It is retained local evidence for the exact heads named below; the claim limits at the end remain controlling.

## Product and ruler authority

All three calibration reports began and ended on the same clean product/ruler source:

- commit: `a4de5007ffc9131b8bc952a0a4cb469d9139039e`
- branch: `openai/mac`
- state: `committed`
- empty-status SHA-256: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
- working-tree SHA-256: `f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`
- report schema: `cf-v2-scene-memory-report/v2`
- built-product schema: `cf-v2-scene-memory-build/v1`
- built-product graph: 38 files; SHA-256 `44eb670cc2160c39ff5c159f5f1aec1e68e5d6bae5d02e75bf0e2eec026ff81e`
- fixture: 1,500 rows; rows SHA-256 `daefba685c3e70febd94781d5b140659f741a181edc32154be57e631af361706`

The budget-activation and local-certification head was clean commit `59530da3bf40965adf9c54f169b310e11ccdd0f8` on `openai/mac`. Its report began and ended at that exact committed source with the same empty-status and working-tree digests. The report's complete producer tuple and built graph are byte-identical to the calibration tuple; the source-head difference therefore does not silently substitute a different measured product or ruler.

The exact producer authority is:

| Producer input | SHA-256 |
| --- | --- |
| collector | `c0c626d1b8a4bc577161debf477f97cfa9c8be4d735fecaaa16124afcae2e957` |
| browser CDP | `6da9e2efaaf7f91f9ad93c101368b847a7e77aeb015e83f7768fe11dd85147ce` |
| browser path resolver | `733ab771f60bead83e8d2af4d95339248f7c9b16879903ea89b817677e4a6bc0` |
| workspace lock | `e22a4c268ad0ce71a1c9160f45a2386c413c7fbcfc13f0cc457cf084ff0fd606` |
| fixture generator | `a1b294f0b8b5958910fd873f49d226f80447ad77381cccfd0acb21c82dc7aece` |
| verdict contract | `8019a0f0bf938aa59f45bb6dfaaf56adb77b08073f9d4fa24c2d0592f5bf623d` |
| fixture spec | `c5792c2c8605765b95170e8d954a157e60c9abfa37500ec93c5e1f81722f69f3` |
| fixture rows | `daefba685c3e70febd94781d5b140659f741a181edc32154be57e631af361706` |
| baseline save fixtures | `a52bfbdc1c65a418eed07a1e7ba5ffd07b36caf5ce10e587c7d34a717deab2a7` |
| v2 workspace package | `6bad342bf5503275608ebae5c0e730658c82d608cd58f4c1d62a4457f85d673f` |
| v2 workspace lockfile | `a6b7eb9f9439d7c76d7cf0ee154ef6221e9ad73226c7a5f0e893feaf4231a110` |
| game package | `d935051fd788aa303363adf84a51bc1b030ae05f488a0058585322465d9b7135` |
| built-product graph | `44eb670cc2160c39ff5c159f5f1aec1e68e5d6bae5d02e75bf0e2eec026ff81e` |
| game HTML | `dd4b69852e309d7eab44df07dab37ee01b1d157b3948de805f6b1092b2edb538` |
| game main | `e493beec8251b013b19c3191a400df74c872a2b75adc9e57eb87f9c9b97062aa` |
| ship visual state | `9bfd27d3d6a75779d3372dfb6386e8e98ef22d92a33b0346819225024c70d762` |
| Shipyard preview | `a3aac0c541a8f824a3625778e89468b5b03653dd29820c3b024fa45a7c753e85` |
| planet texture attachment | `00e4b63f28cf6fc01c3285eaa6f6e840154eda669e4bf7334aec660d2822857a` |
| planet texture demand | `a537aacde361e88b692887e6d2fa67674296d828aa0d297673dc34b147322055` |
| scene texture owner | `db7af3f23c3b7d652df37cb54f1082eea177380aefd4f86bc16365a6adbed709` |
| Pixi managed-resource owner | `2d9eaeb667f5a4a763e25bd8e168b721494dda49c252e2411031a258d2653708` |
| Pixi batch texture array | `95ea401f9f05a933f17c9a327b94109bfcc46b0a21cc59789a66537a5b62deb3` |
| scene text | `7ea78c599fed72ab1ba65991270b72d642f6ec2f9768f63ad64d280ce9147731` |

## Browser, build, and budget authority

Every calibration and certification run used the same browser tuple:

- executable: `/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge`
- product: `Edg/151.0.4129.101`
- revision: `@cc1d9f4080fd9140611a9600b8d1615db310105d`
- JavaScript version: `15.1.23.9`
- protocol version: `1.3`
- user agent: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0`

The built-product graph SHA-256 is `44eb670cc2160c39ff5c159f5f1aec1e68e5d6bae5d02e75bf0e2eec026ff81e`. The active budget is `port/v2/budgets/scene-memory-v2.json`, schema `cf-v2-scene-memory-budget/v2`, SHA-256 `3b71d14ca297ec4d536669d2edf960ac4d01671dd7a0c9eb11a2fb76e4fc43f7`. The certification report binds that exact budget hash both in its input tuple and terminal budget witness.

## Retained exact evidence

Each run used one attempt, zero automatic retries, four unmeasured warm-up cycles, and four measured cycles. The route covered Universe, Galaxy, Galaxy fine, System, Surface, the 1,500-row Compendium, and the implemented static Shipyard. Every report finished with lifecycle `complete` and browser/server/workspace-lock cleanup.

| Run ID | Kind | UTC interval | Duration | Decompressed JSON SHA-256 | Gzip SHA-256 |
| --- | --- | --- | ---: | --- | --- |
| `arc1c-candidate-1` | calibration | `2026-08-22T03:52:53.526Z`–`2026-08-22T03:53:01.757Z` | 8,231 ms | `045b43a26852449a810da3be36759c473f809994b3a68d4657af900875d4647b` | `ada50b3cc3f3c143d06ffc42d8e8b0cf3379a57ee17bf2ba1faa7eb11ca3bda0` |
| `arc1c-candidate-2` | calibration | `2026-08-22T03:53:38.654Z`–`2026-08-22T03:53:46.703Z` | 8,049 ms | `d4a51a4422fe4a3ae89223110676fe0f9a7939c8f8892792dd98c0e210e2d958` | `80a77eeb21d970add3529a4375738ea2aa9234c2eb8f479a931c56ab2ac43601` |
| `arc1c-candidate-3` | calibration | `2026-08-22T03:54:15.206Z`–`2026-08-22T03:54:23.290Z` | 8,084 ms | `4bf113e40fe6e94a4a127aba3256ecca2ab90cc9f7bd3564be00662a44238ff8` | `385d4622e669cc0849aced533da50869b01a6b11ef5d06e3e61afe5de910a593` |
| `20260822-arc1-local-certification` | exact-budget certification | `2026-08-22T04:15:02.146Z`–`2026-08-22T04:15:10.476Z` | 8,330 ms | `e24ceef86d17fb4a47bbb10e58f81d442cac6e3def28923672448f6c47eac3a5` | `0d83e6ce339205beb0b5387008ca74ca9b1f95cb22bf61444c439da36405f2a6` |

All three calibration reports are correctly marked `calibration-only-not-certified`; each independently replayed 42/42 green outcomes with no findings or fatal events. The exact-budget run is marked `contract-budget` and `pass`; it also replayed 42/42, with no failures, findings, or fatal events.

## Calibration maxima and selected ceilings

“Observed” is the exact maximum serialized metric across the three clean calibration candidates for that profile. Timing is milliseconds; byte and count metrics are exact integers unless the ceiling deliberately uses a half-step sentinel.

| Metric | Phone observed | Phone ceiling | Desktop observed | Desktop ceiling |
| --- | ---: | ---: | ---: | ---: |
| `heapUsedBytesMax` | 9072440 | 10485760 | 9048356 | 10485760 |
| `embedderHeapUsedBytesMax` | 3793400 | 4194304 | 3381320 | 4194304 |
| `backingStorageBytesMax` | 2265640 | 3145728 | 2265608 | 3145728 |
| `heapAggregateBytesMax` | 14926512 | 16777216 | 14416324 | 16777216 |
| `warmHeapAggregateRangeBytesMax` | 180844 | 524288 | 198584 | 524288 |
| `warmHeapSlopeBytesPerCycleMax` | 57108 | 131072 | 35190 | 131072 |
| `documentsMax` | 3 | 3.5 | 3 | 3.5 |
| `nodesMax` | 644 | 704 | 641 | 704 |
| `jsEventListenersMax` | 74 | 80 | 73 | 80 |
| `peakActiveLeaseCountMax` | 84 | 84.5 | 81 | 81.5 |
| `peakLiveTextureCountMax` | 74 | 74.5 | 72 | 72.5 |
| `peakLiveCanvasBytesMax` | 30288704 | 30288705 | 30255936 | 30255937 |
| `managedTextureCountMax` | 43 | 48 | 43 | 48 |
| `managedTexturePixelsMax` | 6049570 | 6553600 | 5647874 | 6291456 |
| `localCanvasCacheEntriesMax` | 0 | 0.5 | 0 | 0.5 |
| `peakLocalCanvasCacheEntriesMax` | 2 | 2.5 | 2 | 2.5 |
| `productRenderTargetsMax` | 0 | 0.5 | 0 | 0.5 |
| `ringCacheEntriesMax` | 0 | 0.5 | 0 | 0.5 |
| `peakRingGeometryEntriesMax` | 2 | 2.5 | 2 | 2.5 |
| `targetElapsedMsMax` | 8.11645899999985 | 250 | 9.003083999999944 | 250 |
| `heartbeatElapsedMsMax` | 1.22191599999951 | 100 | 1.4792500000003201 | 100 |

The half-step and single-byte ceilings are strict sentinels: the first additional owned integer unit fails. Heap, DOM, managed-texture, and answerability ceilings retain bounded operational headroom while every candidate remains strictly below every selected ceiling. The budget test independently lowers every positive ceiling below its observed maximum and confirms a red verdict, and separately injects the first nonzero value into every calibrated-zero field.

## Exact-budget certification metrics

These are the exact serialized maxima from `20260822-arc1-local-certification`; the retained test independently recomputes them from the report's precondition, four measured cycles, and bfcache witness before replaying the imported contract verdict.

| Metric | Phone certification | Desktop certification |
| --- | ---: | ---: |
| `heapUsedBytesMax` | 9032796 | 9022444 |
| `embedderHeapUsedBytesMax` | 3840216 | 3380168 |
| `backingStorageBytesMax` | 2265640 | 2265608 |
| `heapAggregateBytesMax` | 14856464 | 14351364 |
| `warmHeapAggregateRangeBytesMax` | 65848 | 101656 |
| `warmHeapSlopeBytesPerCycleMax` | 31836.8 | 35481.2 |
| `documentsMax` | 3 | 3 |
| `nodesMax` | 644 | 641 |
| `jsEventListenersMax` | 74 | 73 |
| `peakActiveLeaseCountMax` | 84 | 81 |
| `peakLiveTextureCountMax` | 74 | 72 |
| `peakLiveCanvasBytesMax` | 30288704 | 30255936 |
| `managedTextureCountMax` | 43 | 43 |
| `managedTexturePixelsMax` | 6049570 | 5647874 |
| `localCanvasCacheEntriesMax` | 0 | 0 |
| `peakLocalCanvasCacheEntriesMax` | 2 | 2 |
| `productRenderTargetsMax` | 0 | 0 |
| `ringCacheEntriesMax` | 0 | 0 |
| `peakRingGeometryEntriesMax` | 2 | 2 |
| `targetElapsedMsMax` | 7.746958000000177 | 10.63799999999992 |
| `heartbeatElapsedMsMax` | 1.1424999999999272 | 1.2182089999996606 |

The certification stayed within every selected ceiling and returned the imported contract's exact 42-outcome green inventory. `port/v2/tests/scenemem-budget.test.ts` binds both the compressed and decompressed report hashes, the exact source/browser/producer/build/budget authorities, terminal cleanup and empty failure inventories, recomputed metrics, and byte-equal verdict/outcome replay.

## Claim limits

- This is local exact-head evidence. It is not a hosted GitHub Actions result and does not make any PR or merge ref terminal-green.
- It is not HUMAN review or approval and does not satisfy any rubric item marked `[HUMAN]`.
- It does not by itself close a port Gate, an Arc acceptance decision, or any production-readiness gate.
- It is not a production version bump, release, deployment, publish, or authorization for any of those actions.
- The certification binds exact source commit `59530da3bf40965adf9c54f169b310e11ccdd0f8` and the calibrated product/ruler tuple from `a4de5007ffc9131b8bc952a0a4cb469d9139039e`; it does not certify later descendants.
- The ruler explicitly excludes Shipyard build writers, audio lifecycle, and true GPU-byte measurement. Product-owned decoded pixels and Pixi managed-texture pixels remain named proxies, not a claim of portable physical GPU memory accounting.
