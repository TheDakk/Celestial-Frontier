# P2 phone — Batch 4 current analysis and retained history

## Step 3d — current phone evidence and incomplete performance measurement (2026-09-05)

Matches the retained Step 3c/3d evidence below. **The two phone diagnostics passed; the separate performance measurement is incomplete.** This analysis reads existing artifacts only. It introduces no measurement, retry, instrument repair, optimization or acceptance claim for later source.

The accepted Step 3c Slice/two-phone sequence used exact source **`b76b69aa7099f3d7db99380e6687be18be7ead51`**, branch `openai/review-batch4-gameplay-20260905`. Both Glass reports record clean committed source unchanged at start/end. Their working-tree SHA256 is `f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`. The once-only profiler used the distinct clean reporting successor **`4fa82d0c9fd648fcb05497552e244d594b1a959f`**; its runner records the same ending source and `unchanged: true`. These results must retain their separate source identities.

### Current retained phone diagnostics

| Existing measurement | Small phone | Large phone |
| --- | ---: | ---: |
| Viewport, CSS pixels | 320 × 568 | 412 × 915 |
| Emulated DPR / actual renderer DPR | 2 / 2 | 3 / 2 |
| Glass command duration | 16.742 s | 16.167 s |
| Report / viewport duration | 14,755 / 11,561 ms | 14,234 / 11,355 ms |
| Replacement app-init complete | 129.0 ms | 106.5 ms |
| Replacement save-load complete | 170.4 ms | 141.3 ms |
| Replacement scene-rendered | 232.9 ms | 192.9 ms |
| Replacement first tick | 345.9 ms | 334.4 ms |
| Replacement ready-emitted | 684.1 ms | 620.7 ms |
| Recorded reload elapsed | 714 ms | 661 ms |
| App / backdrop backing dimensions, each | 640 × 1136 | 824 × 1830 |
| Combined backing pixels | 1,454,080 | 3,015,840 |

Both ready witnesses have complete document readiness, save/view/renderer/stage readiness and three ticker ticks. Both enforce a declared 8,388,608-pixel ceiling per canvas. At release, renderer/stage release and view detachment are true, each canvas becomes 1 × 1, and the recorded status is `released` with no error. Backing pixels and release witnesses are not measured heap or GPU allocations.

Both reports are `targeted-diagnostic`, `certifying: false`, with null predecessors, zero findings, zero instrument failures, zero blocked controls and zero automatic retries. Small records 93 selected / 9 omitted controls; large records 94 / 8, each from 102 planned. This is the two-row phone evidence, not a full 12-row Glass certificate. The retained Slice passed in **374.555 s** and printed **galaxy rebuild: 29 ms**. Its identity here is the terminal log plus runner association; no separate immutable Slice certificate ID is invented.

These runs used desktop macOS headless Edge `Edg/152.0.4191.62`, revision `@98614824c284c7a332f949435bc56c0107ee732f`, JS `15.2.23.8`, CDP `1.3`, and zero emulated safe-area insets. Ready timestamps belong to `reloadEvidence[0].bootPhases[*].validation.witness.performanceNow` / the ready witness in the **replacement document after the evidence save-import seam**. They are not initial cold-boot TTI. Harness durations and retained CDP command timings are not player latency; one sample per viewport supplies no variance or percentile estimate.

### Audio/cache limits and once-only profiler result

Both release audio snapshots are disposed and muted, with null context state and context generation 0. Cache active/peak/evictions are **0/0/0**, budget 32; nodes active/peak are **0/0**, budget 96; voices active/peak/started/completed/stopped/stolen are all **0**, budget 24; emitters active/peak are **0/0**, budget 8. Source-stop, node-disconnect, cache-release failures and total faults are all **0**. These empty release snapshots establish neither a populated audio workload nor cache eviction quality. No populated species/biome cache series, cache bytes, native heap/GPU peaks or leaks, installed offline bytes/eviction, physical iPhone/Safari/PWA, thermal or battery proof is retained.

On source `4fa82d0c9fd648fcb05497552e244d594b1a959f`, `npm run perf -- 4` ran once using the recorded Edge executable at **4× CPU**, phone **390 × 844 @ 3×**. It exited **1 after 28.472 s**, printing:

```text
painted: 1292ms
answerable: NEVER
galaxy rebuild (throttled): -1ms
SLICE PERF: measurement incomplete — painted, answerable, and galaxy rebuild must all resolve
```

`NEVER` means the bounded run obtained no answerable measurement; `-1` is an unresolved result, not a negative elapsed time. The existing profiler waits for `mode === 'universe'` and `trail === 'Cosmos'` before its answerability path. That assumption is a possible compatibility consideration, **not a demonstrated cause**: this result alone cannot distinguish unmet setup from a product or profiler fault. No retry or instrument repair followed. The valid paint observation does not establish answerability, and the separate Slice 29-ms rebuild is a different observation from this unresolved throttled result.

The profiler's retained evidence-build log reports 989 modules and the existing >500-kB chunk warning. Selected Vite sizes are below; these are output sizes, not bytes loaded at boot, runtime memory or the complete shipped/offline pack.

| Output | Vite size | Vite gzip |
| --- | ---: | ---: |
| Main JS | 1,782.05 kB | 469.18 kB |
| Species-art worker | 1,312.28 kB | Not printed |
| Species-art lazy JS | 1,265.97 kB | 353.61 kB |
| Biome-vista worker | 220.68 kB | Not printed |
| Guide / release JS | 130.92 / 146.93 kB | 44.31 / 56.49 kB |
| Index HTML | 77.42 kB | 17.13 kB |

### Exact retained artifact identities

SHA256 values below identify the retained bytes, not a new certification. The historical Step 2a section following this addition remains historical and is not substituted for these sources.

| Artifact | Bytes | SHA256 |
| --- | ---: | --- |
| [Step3d extraction](/private/tmp/cf-overnight-batch4-20260905/step3d-phone-evidence.json) | 19,904 | `a4aa575f496ab974b9c0a041467a80ef9c677dbe6b8c91d42f75d23463aba237` |
| [Step3c runner result](/private/tmp/cf-overnight-batch4-20260905/step3c-browser/result.json) | 769 | `b7ca6c4f4cc5ed662236305564c12a67344cb943a70ff2f8c814fa8a5025a453` |
| [Step3c Slice log](/private/tmp/cf-overnight-batch4-20260905/step3c-browser/1-node.log) | 6,736 | `93e2c6f6ba9f2b812a6e71b9e331534e7051fbc3fa30ae7a4fb3c58e021153e3` |
| [Small-phone immutable 20260905130448827-82289-0980a0b3326f](/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/smoke/glassmatrix-20260905130448827-82289-0980a0b3326f.json) | 101,066 | `e076f1e7fd9a0cfd09c78854d35b5cc5c8ef8077e4392b44d6dc9c7626f068ca` |
| [Small-phone runner log](/private/tmp/cf-overnight-batch4-20260905/step3c-browser/2-node.log) | 3,745 | `8913784be6cf06900dfd526332f9a3d764c153a62a1e1086b8710ff14cfe33f3` |
| [Large-phone immutable 20260905130505505-82440-b058674b0097](/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/smoke/glassmatrix-20260905130505505-82440-b058674b0097.json) | 105,618 | `8bea992efd6777c819c359457601fcec3ee5bffa1403d856977668d30dc3cf1e` |
| [Large-phone runner log](/private/tmp/cf-overnight-batch4-20260905/step3c-browser/3-node.log) | 3,745 | `1e0ed3d37387a5503f3de6477e9c71936f3154bfdfa895f27b452a80d44d0e77` |
| [Step3d measurement result](/private/tmp/cf-overnight-batch4-20260905/step3d-measurement/result.json) | 519 | `62994b90b36d1999cba26cf4dfaca58f8c7cfaca8cdf54f143284570cb06933c` |
| [Step3d sliceperf log](/private/tmp/cf-overnight-batch4-20260905/step3d-measurement/sliceperf.log) | 3,663 | `dd989f243a7d69411cb4cd4e452061c6e84becfed3221b4c14936641dd2f2c60` |


---

# P2 phone: existing accepted Step 2a evidence

Read-only extraction prepared 2026-09-05. No browser, build, test, or new measurement was run for this report. This is historical evidence for accepted Step 2a only; it supplies no browser proof for the current uncommitted Step 2b corrections.

Exact measured source: `4a82f161da2a7b3c4a029421d8a16c23fc62955d`, branch `openai/review-batch4-gameplay-20260905`. Both immutable Glass reports record committed, clean, unchanged source at start and end. Working-tree SHA256: `f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a`.

The evidence supports functional phone navigation, replacement-document readiness, bounded canvas density, and reload resource release on desktop Edge phone emulation. It does not establish cold-start performance, interaction latency distributions, populated art-cache behavior, native memory usage, or physical iPhone/Safari behavior.

## Evidence identity

| Evidence | Recorded result and duration | Authority |
|---|---|---|
| Slice, develop | PASS; 369.674 s command duration | [step2a-browser/1-node.log](/private/tmp/cf-overnight-batch4-20260905/step2a-browser/1-node.log); [runner result](/private/tmp/cf-overnight-batch4-20260905/step2a-browser/result.json) |
| Small phone | PASS; 15.652 s command; 13929 ms report; 10776 ms viewport | [20260905084458232-43718-e61972a6c183](/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/smoke/glassmatrix-20260905084458232-43718-e61972a6c183.json) |
| Large phone | PASS; 15.871 s command; 13687 ms report; 10784 ms viewport | [20260905084514360-43868-d2601441f645](/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/smoke/glassmatrix-20260905084514360-43868-d2601441f645.json) |

The command/report/viewport durations are harness durations, not boot or navigation response times. Each Glass artifact has `scope: targeted-diagnostic`, `certifying: false`, `predecessors: null`, one viewport, zero findings and zero instrument failures. Small recorded 93 selected negative controls and 9 omitted; large recorded 94 selected and 8 omitted, each out of 102 planned. Both record zero automatic retries. These are not a full viewport certificate or a complete certification chain.

The retained Slice authority here is its terminal stdout plus the runner result and the accepted-source handoff in [the overnight report](/Users/nick/Projects/celestial-frontier-openai-mac/audits/BATCH4_OVERNIGHT_REPORT_20260905.md:1195). A bounded exact-SHA search of `port/v2/apps/game/smoke/*.json` found only the two immutable Glass reports and their mutable phone pointers; no separate immutable Slice report ID for this source was found. Do not manufacture a Slice certificate ID.

## Browser and emulation

- Executable: `/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge`.
- Product: `Edg/152.0.4191.62`; revision: `@98614824c284c7a332f949435bc56c0107ee732f`.
- JavaScript: `15.2.23.8`; CDP: `1.3`.
- User agent: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0`.
- Small: 320 × 568 CSS pixels, emulated DPR 2, mobile true. Large: 412 × 915, emulated DPR 3, mobile true. Both have zero safe-area insets in these runs.

This was headless macOS Edge using local loopback origins, not an installed PWA on an iPhone, Safari, a network-constrained mobile run, or a thermal/battery run. One sample per viewport provides no variance or percentile estimate.

## Recorded replacement boot and navigation

The following timestamps are `reloadEvidence[0].bootPhases[*].validation.witness.performanceNow`, rounded to 0.1 ms from the stored values. They belong to the replacement document after save import, not the initial cold launch. The source JSON retains full precision.

| Phase / recorded value | Small phone | Large phone |
|---|---:|---:|
| app-init-start | 90.6 ms | 79.9 ms |
| app-init-complete | 127.7 ms | 108.4 ms |
| save-load-start | 128.4 ms | 109.2 ms |
| save-load-complete | 163.5 ms | 144.3 ms |
| scene-rendered | 215.2 ms | 195.5 ms |
| wiring-complete | 215.3 ms | 195.7 ms |
| ticker-started | 215.3 ms | 195.7 ms |
| first-tick | 352.7 ms | 333.3 ms |
| ready-scheduled | 369.9 ms | 349.2 ms |
| ready-emitted | 734.8 ms | 638.9 ms |
| Recorded reload `elapsedMs` | 772 ms | 676 ms |
| Ticker ticks at ready witness | 4 | 3 |

Both ready witnesses record complete document readiness, save ready, connected view, renderer ready, and stage ready. Their two post-reload exact-context probes completed in 2/15 ms (small) and 2/6 ms (large); accompanying browser-process heartbeat probes each took 1 ms. These are CDP command durations, not player input latency.

Slice records one **galaxy rebuild: 27 ms**. Its terminal PASS covers keyboard canvas → galaxy → system → Land → Leave/Escape, Survey-first touch at 390 × 844, phone Land/Leave round-trip, pinch, responsive chrome, native Compendium query/detail/Back, and lazy-art focus retention. There is no recorded per-route latency distribution, FPS series, long-task trace, or initial cold-boot TTI in the retained logs/reports.

The large-phone report also retains one Shipyard Mining keyboard heartbeat outcome: its original summary node was replaced, the current replacement regained focus, trusted Enter toggled the disclosure from open to closed, and the assessment passed. Small-phone planned/observed count for this particular scenario is 0; do not generalize the large-only outcome to both.

## Canvas allocation and resource/cache diagnostics

These are backing-pixel counts and lifecycle witnesses, not measured heap or GPU byte allocations.

| Recorded ready/release field | Small phone | Large phone |
|---|---:|---:|
| Actual renderer DPR | 2 | 2 |
| App canvas backing dimensions | 640 × 1136 | 824 × 1830 |
| Backdrop canvas backing dimensions | 640 × 1136 | 824 × 1830 |
| Combined backing pixels | 1,454,080 | 3,015,840 |
| Declared backing-pixel ceiling, per canvas | 8,388,608 | 8,388,608 |
| Released app/backdrop canvas dimensions, each | 1 × 1 | 1 × 1 |

At save-import release, both witnesses record `rendererReleased`, `stageReleased`, and `viewDetached` true, with status `released` and no error. The large emulated DPR 3 viewport used actual renderer DPR 2. This demonstrates the recorded touch density cap and canvas release behavior; it is not a native allocation/leak test.

Both release witnesses contain the same disposed, muted audio snapshot: context state null and context generation 0; cache active 0, peak 0, budget 32, evictions 0; nodes active/peak 0 with budget 96; voices active/peak/started/completed/stopped/stolen 0 with budget 24; emitters active/peak 0 with budget 8. Source-stop, node-disconnect and cache-release failures are all 0; faults total 0. Because no audio context or populated voice/cache workload is evidenced in this snapshot, these zeros cannot establish audio load performance or eviction quality.

No populated species/biome art-cache entries, cache bytes, hit/miss/eviction series, texture allocations, native heap peaks/deltas, or installed offline storage bytes were retained in these artifacts. Slice says its Engineering checks passed with one owned preview and zero retained work, but the stdout does not retain numeric resource samples for that assertion.

## Recorded build payload diagnostics

These are Vite-reported evidence-build sizes from the retained logs. They are neither runtime allocations nor the complete shipped/offline pack size.

| Output | Reported size | Reported gzip |
|---|---:|---:|
| Main JS | 1,686.17 kB | 444.46 kB |
| Species-art worker | 1,312.28 kB | not printed |
| Species-art lazy JS | 1,265.97 kB | 354.04 kB |
| Biome-vista worker | 220.68 kB | not printed |
| Guide JS | 126.26 kB | 42.83 kB |
| Release JS | 143.76 kB | 55.40 kB |
| Index HTML | 72.70 kB | 16.25 kB |
| Service worker | 17.67 kB | not printed |

Vite reported 976 transformed modules and a >500 kB minified chunk warning. These identify payload sizes for later investigation; they do not prove redundant downloads, loaded bytes at boot, or an offline-cache ceiling violation. No new optimization or measurement is justified as completed by this extraction.

## Evidence limits for the blocked handoff

Retain the accepted Step 2a phone results as historical diagnostics. Current Step 2b signing/SSH failures and its newer browser-free checks are separate evidence; no Step 2b browser claim follows from these reports. The retained Step 2a Arc 4 ledger explicitly says develop, 14 burn steps, publication convergence not selected, and recovery not claimed. No production/SceneMemory, long-running recovery, physical iPhone thermal performance, offline eviction persistence, or new art/audio pilot approval is established here.

## Artifact hashes

SHA256 values computed by reading the existing files during this extraction:

- [1-node.log](/private/tmp/cf-overnight-batch4-20260905/step2a-browser/1-node.log): `876615679f8a495cd13c9f59155b1c3e5765341dadf3e92bcd2d0f2e43b849c7` (6736 bytes).
- [2-node.log](/private/tmp/cf-overnight-batch4-20260905/step2a-browser/2-node.log): `009a998653e61ae196cdbcb516486760990ef858e7c6c453c36cb1ef7607d0b1` (3745 bytes).
- [3-node.log](/private/tmp/cf-overnight-batch4-20260905/step2a-browser/3-node.log): `1a8d17989deab1cbf82a0dc17ab3083ad96131c85a9d75fccfef4d05b8ba4757` (3745 bytes).
- [result.json](/private/tmp/cf-overnight-batch4-20260905/step2a-browser/result.json): `778a3982d8422754d92f902c1f0f7863f92b9a6d18ca55411c996b2d71586710` (769 bytes).
- [glassmatrix-20260905084458232-43718-e61972a6c183.json](/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/smoke/glassmatrix-20260905084458232-43718-e61972a6c183.json): `87ce6829d7cdf215483669b9e8881631cae11905bcc57e39374430b0dffd025a` (101128 bytes).
- [glassmatrix-20260905084514360-43868-d2601441f645.json](/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/apps/game/smoke/glassmatrix-20260905084514360-43868-d2601441f645.json): `db00b11ae355ea947e063b3a73277283ec495ea21d13a5ce465086be506d717c` (105628 bytes).
