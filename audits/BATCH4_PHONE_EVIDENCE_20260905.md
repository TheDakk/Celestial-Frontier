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
