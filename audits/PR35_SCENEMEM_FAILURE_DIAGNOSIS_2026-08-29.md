# PR #35 SceneMemory failure diagnosis — 2026-08-29

## Boundary

- Draft PR: `openai/mac` → `develop`, base
  `7a9f4c1370dd84292388d718c38ff34214f6203b`.
- Consumed hosted run: `33278630671`, head
  `017fa6decbc41809188768ccdb98ab86ef1b9ebc`, 2026-08-29 22:27:19Z–22:35:18Z.
- The authorization job passed. Root validation, smoke, legacy checkpoint capture, ten-viewport
  layout, rarity, dead-code, tracked-input, the complete v2 browser-free/type/art/coverage battery,
  current producer authority, Edge installation, and SceneMemory controls all passed.
- The one-attempt SceneMemory product stage stopped on the phone profile with
  `Earth planetfall was rejected`. Its verifier then failed because the stopped report could not
  contain a complete terminal inventory. Compendium, Slice, Glass, personas, preview, and every
  later browser stage correctly did not run.
- The approval label is absent, the run is consumed, PR #35 remains Draft/unmerged, and no retry or
  replacement hosted attempt is authorized by this record.

This document records diagnosis and repair reasoning. It is not an immutable copy of the hosted
artifact and therefore does not invent raw/gzip carrier hashes.

## Root causes

### 1. Survey → Landing crossed only one of two persistence barriers

The one-call browser API can begin while the route into a system still owns an ordinary persistence
checkpoint. Survey then installs its own replacement product checkpoint. The prior implementation
invoked Survey first and waited only the barrier it could see afterward. Under the hosted ordering,
Landing reached Main while persistence was still active and correctly refused the mutation.

The permanent ordering is now explicit and retry-free:

1. capture and drain the current route barrier;
2. start Survey exactly once and retain its exact settlement promise;
3. if Survey cannot start, stop;
4. capture and drain Survey's replacement barrier;
5. require the retained Survey settlement to return true; a later durable false stops;
6. invoke Landing exactly once.

`survey-land-handoff.ts` owns only that choreography. Manually controlled promises prove each
barrier, initial and late refusal, and exactly-once call; omitted-barrier, ignored-late-false and
duplicate-action mutants fail.

### 2. Raw successor evidence disagreed with the persistence codec's same-commit canonical state

Once the route interleaving was removed, a veteran mining timestamp exposed a second systemic
boundary. Product derivation correctly returns raw gameplay state, while the compatibility writer
may apply deterministic save housekeeping using the commit's injected `codecNow`. Several action
wrappers compared their raw predicted whole state with the committed canonical state and could
misclassify a valid durable write as postcommit convergence.

The deterministic F4 product owner now detaches its content registry once, validates the injected
save clock once, and supplies derive callbacks with an owner-minted `canonicalizeState`. That helper
uses the exact same registry snapshot and checked clock as the eventual write. Actions still return
their raw domain derivation to the transaction; seals and expected-state comparisons retain the
codec-canonical prediction. Later-clock veteran controls cover the shared owner and each affected
action family, including the Arc 3 partial-state coordinator.

No wall clock, gameplay RNG, reward, save schema, migration meaning, or numeric ruler changed.

### 3. Exact-build PWA ownership stopped at the window and omitted its worker client

After Landing and canonical settlement were repaired, the real browser reached the biome vista but
reported:

`Failed to fetch dynamically imported module: .../assets/biome-vista-*.js`

The service worker selected the correct exact build for the module-worker entry request using the
initiating window's pin. It did not propagate that build to the fetch event's
`resultingClientId`. The worker's own dynamic import therefore arrived from an unpinned worker
client and the fail-closed PWA correctly returned 503.

Worker and shared-worker entry requests now require a valid `resultingClientId` and copy the
initiator's selected build pin to that child before returning the entry response. Live-build
retention enumerates all client types, not only windows, and confirms an apparently missing client
with `clients.get()` before deleting its pin. Tests prove active/prior isolation, worker-local lazy
imports, missing/invalid child identity, reserved-worker races, termination pruning, and
third-build refusal while a worker still owns the retained predecessor.

This is exact-build realm ownership, not an Edge point-version pin. Compatible Edge updates remain
provenance only and never trigger a rebaseline, recalibration, or threshold change.

### 4. SceneMemory's same-origin BFCache helper was inside product service-worker scope

After the worker-client repair, SceneMemory reached the BFCache phase. Its old same-origin
`/__scenemem_away__.html` navigation was legitimately handled by the product service worker as an
app navigation, so the instrument received the game index instead of its minimal away document.

SceneMemory now serves that one minimal document from a second ephemeral loopback origin, outside
the product service-worker scope. It uses a data favicon, returns 404 for every other path, remains
open through `Page.navigateToHistoryEntry`, and closes in `finally`. This isolates the instrument
fixture without weakening or bypassing the product PWA.

## Diagnostic and false-green hardening

- Landing and its bounded rejection state are captured in one browser task, including route,
  persistence authority, mutation witness, Landing outcome, and whether convergence was scheduled.
- Every biome-vista fault records a bounded `surfaceVistaLastError`; a positive fault count is a
  terminal SceneMemory failure with the exact cause instead of a generic 30-second timeout.
- Missing, malformed, negative, or internally inconsistent vista diagnostics are also terminal;
  absence cannot impersonate zero faults.
- Stale worker responses remain harmless stale drops. A current response with mismatched document
  token, generation, world, environment fingerprint, profile schema or profile digest authority is
  a fault, not a stale success; its scene and biome key are then checked separately before publish.
- The real product render envelope is validated before `postMessage` for Earth and the non-Earth
  gas, abyss, and reef compositor families.

## Local SceneMemory resource-repair chronology

### Stopped premeasurement invocation — no evidence

Invocation `20260829-pr35-resource-repair-dirty-budget` was manually terminated after its Vite
build and before browser measurement when the independent Guide reopen audit found a real
cached-publication race. It produced no product report or certificate and is neither an automatic retry
nor a SceneMemory product failure. This record therefore assigns it no invented carrier hash or
verdict.

### Zero-cache diagnostic — valid V8-churn red

After the Guide repair, dirty exact-budget diagnostic
`20260829-pr35-resource-repair-guidefix-dirty-budget1` completed on Edge `152.0.4191.53`, built
product `ac61f70c7bf8dc8793a4a686dbf34bc2b48a5ac1c3e5c775476ffc326addf7cc`, and budget
`86d31c25b8f3c075d1b4d20f6a2e6504d43c2683d0c59806e3802c61f62a0e30`. It passed 42/44
outcomes with complete cleanup. Releasing every unowned thumbnail left both profiles with zero
cache entries and repainted the same bounded route on every cycle: phone recorded eight imports /
128 thumbnail jobs; desktop recorded eight imports / 136 jobs. Only desktop failed: BFCache V8
used 12,587,632 bytes against 12,582,912 (+4,720), and its V8 least-squares slope was
154,531.2 B/cycle against 131,072. Aggregate slope, heap range, backing, DOM, listeners, managed
resources and lifecycle all passed. This isolated deterministic worker/task churn from destroying
a reusable route cache; it did not justify a threshold change or an Edge-version rebaseline.

### Bounded base64 cache — valid backing-only red

Retaining the 17 most-recent thumbnails restored one-worker route reuse. Dirty exact-budget
diagnostic `20260829-pr35-bounded-route-cache-dirty-budget1`, built product
`959eafaf8b5975641bd2d1167af3a6542eb97a895ab137ac549bca03a03569c3`, budget
`35407aa1807b3cd3ad91a303cd7095a809c49eb287b8cfc93ce453fec17d9ccd`, and working-tree
SHA-256 `009196b648021bc7847bf8ec51b7fbf0e143e924bd9cf44c720ba9715eef6990`, again completed
42/44 with no fatal event and complete cleanup. Phone retained 16 entries with one import / 16
jobs; desktop retained 17 with one import / 17 jobs. V8 and slope now passed on both profiles:
94,881.6 B/cycle phone and 119,998.4 B/cycle desktop. The only failures were fixed backing-storage
footprints:

- phone: 3,480,312 bytes against 3,145,728 (+334,584);
- desktop: 3,512,766 bytes against 3,145,728 (+367,038).

Relative to the zero-cache report, backing increased 523,565 bytes phone and 555,615 bytes
desktop, closely matching retained data-URL payloads of 511,340 and 542,686 bytes. Backing was
constant across all four measured cycles apart from the normal 22-byte BFCache witness. This was
retained base64 representation cost, not accumulating ownership.

### Revocable Blob warm cache — valid dirty diagnostic green

The follow-on repair kept the exact bounded working set while converting each settled worker
thumbnail data URL into a page-owned revocable Blob URL before caching. The worker protocol and
original encoded-byte accounting remain unchanged. Broker disposal ownership revokes an external
URL on cache eviction, explicit cache release, broker teardown, dropped/invalid/oversize results,
duplicate-cache results, protocol mismatches and late revoked-generation output; portrait behavior
is unchanged.

Dirty exact-budget diagnostic `20260829-pr35-blob-url-warm-cache-dirty-budget1` completed the
contract **PASS 44/44** on Edge `152.0.4191.53`, built product
`b9b0beed19c123fb4d219f44f8843f24c4b6e3f33850760777f682e9e99a5781`, budget
`6e02abb7b795263632eedcc775ff51fd3b2a2ae11c80c6f1e6da03e400fedaa9`, and working-tree
SHA-256 `36b059d929d997c0d1439e44dea8f07b595587863b54c311a076b7d695af648b`. Phone retained
16 cache entries with one import / 16 jobs, backing storage 2,971,348 bytes and slope
89,506.8 B/cycle. Desktop retained 17 entries with one import / 17 jobs, backing storage
2,972,520 bytes and slope 113,378.4 B/cycle. It recorded no fatal events and completed browser,
server and workspace-lock cleanup.

That green contract verdict is **diagnostic only** because the source was intentionally dirty. It
is not a clean-source SceneMemory certificate, named verification, serial-chain predecessor,
hosted result, HUMAN approval or merge authority. No numeric ceiling, calibration, browser
baseline or historical carrier changed.

### Clean resource-final source — 43/44 instrument-phase slope red, no product leak proved

Clean committed source `a9f75797d6f838bb7246d3f41164f77e97e6f569` (tree
`ce6c40eddcdbe85fe5c9a4dcf2a3bae83bbc5b06`, parent/base
`eba00e03f3376c67ab38c5067e9a32da66ce3a3a`) was unchanged from report begin through end.
PR #35's `develop` base remained `7a9f4c1370dd84292388d718c38ff34214f6203b`. Exact run
`20260829-pr35-resource-final-a9f75797-scenemem` used build
`8ef5d89c2abe1615421961b78608ce3e07916b749b08a65fdc13e17b72d5c254`, active budget/base
`bf559acb1688c7f83223f4381b05ccc02309cf86af6344f6c019ffa0d1ba25e0`, and Edge
`152.0.4191.53` / CDP `1.3`. It ran 2026-08-30 03:18:40.048Z–03:18:51.076Z (11,028 ms), once
with zero automatic retries, no fatal event and complete browser/server/workspace-lock cleanup.

The exact-budget verdict was **43/44**: all 22 phone outcomes and 21 of 22 desktop outcomes passed.
Only `desktop/heap-plateau` failed. The four measured series below are
`V8 used / embedder / backing storage / aggregate`, in bytes:

- phone: `11,408,740 / 2,984,112 / 2,971,326 / 17,364,178` →
  `11,505,044 / 2,997,360 / 2,971,326 / 17,473,730` →
  `11,602,940 / 2,998,880 / 2,971,326 / 17,573,146` →
  `11,687,688 / 3,002,504 / 2,971,326 / 17,661,518`. Component/aggregate least-squares slopes
  were `93,474 / 5,669.6 / 0 / 99,143.6` B/cycle; aggregate range was 297,340 B.
- desktop: `11,950,660 / 2,957,936 / 2,972,498 / 17,881,094` →
  `12,097,412 / 2,962,112 / 2,972,498 / 18,032,022` →
  `12,198,548 / 2,964,160 / 2,972,498 / 18,135,206` →
  `12,277,376 / 3,114,088 / 2,972,498 / 18,363,962`. Component/aggregate least-squares slopes
  were `108,128.4 / 47,050.4 / 0 / 155,178.8` B/cycle; aggregate range was 482,868 B.

Range stayed below 524,288 B, and desktop V8's own slope stayed below the 131,072 B/cycle ruler.
The only numeric breach was aggregate slope, by 24,106.8 B/cycle. The first three desktop embedder
samples moved only +4,176 and +2,048 B; the fourth alone moved +149,928 B and supplied the failing
aggregate delta. All component ceilings still passed: desktop maxima were 12,491,984 B V8,
3,114,088 B embedder, 2,972,521 B backing and 18,363,962 B aggregate against respective
12,582,912 / 4,194,304 / 3,145,728 / 18,874,368 B ceilings.

Every resource witness across the four measured cycles contradicted accumulating ownership:

- phone / desktop thumbnail state stayed at 16 / 17 cache entries, one import and 16 / 17 total
  jobs; each held zero queued/active jobs, live art leases, subscribers, portraits, producer
  protocol errors or worker errors, and backing storage was byte-flat;
- measured DOM stayed exactly 472 nodes / 71 listeners on phone and 469 / 70 on desktop;
- each profile retained one scene scope, 19 live scene leases/textures, 4,587,520 live canvas
  pixels, a balanced/coherent registry and zero external faults; six managed-resource hashes held
  87 live entries, zero cleared entries and zero faults while expected compaction advanced;
- pending surface/system/persistence work, retired fine owners, ring and local-canvas caches,
  product render targets, Shipyard previews/retained DOM/pending work and resource faults all
  remained zero; the single 412,800-pixel vista cache entry, managed texture inventory and 13
  shared TextStyle listeners remained constant;
- the ordered route inventory repeated exactly on all four cycles, then BFCache survival and
  renderer/stage/view/vista-cache reload cleanup passed.

Source review found no surviving broker, listener, controller, image, Blob URL, worker, Pixi or DOM
owner. The LRU `Map.delete` + `Map.set` touch is capable of bounded transient OrderedHashMap churn,
but the report proves no retained map backing table; the earlier dirty Blob diagnostic ran that
same 17-entry path green at 113,378.4 B/cycle, while this clean run's V8 slope was lower at
108,128.4 B/cycle. The isolated fourth-sample embedder movement, not V8 Map backing, made aggregate
red.

The causal verdict is therefore a terminal **instrument-phase/ruler observation**, not a proved
product resource leak. It warrants no threshold move, browser rebaseline, cache/LRU rewrite or
other speculative product change. The stop remains real and preserved: the serial rule skipped the
standalone Compendium stage and every later browser stage, and no retry was run.

Immutable carrier
`ARC1C_SCENEMEM_PR35_RESOURCE_FINAL_FAILURE_20260829_A9F75797.json.gz` is 31,185 bytes with
SHA-256 `5cfe7acf15fe6af68e578028374f25be9dd74dd14fa6d5b385eb3e81b7c1d9a0`; it passes gzip
integrity and expands to the exact 430,413-byte raw report with SHA-256
`ceeaa327220c51021da26aae98558d695ce657343ced9ddc510fa8ebd61ce74a`. This red supplies no
SceneMemory certificate, named green predecessor, hosted, HUMAN, merge, release or deployment
authority.

### Heap-phase diagnostics — authority refusal, paired measurement and permanent direction

The first diagnostic invocation,
`20260829-pr35-a9f75797-heap-phase-diagnostic1`, supplied the tracked budget after changing the
collector. Its producer identity no longer matched the budget's bound collector/input set, so the
instrument correctly stopped before browser measurement with
`scene-memory budget producer authority does not match this collector/input set`. There are no
profiles and no verdict to interpret. It ran once with zero automatic retries, retained the exact
unchanged product build identity
`8ef5d89c2abe1615421961b78608ce3e07916b749b08a65fdc13e17b72d5c254`, and completed all
cleanup without a fatal event. This is the required fail-closed behavior, not a product result.

Immutable carrier
`ARC1C_SCENEMEM_PR35_HEAP_PHASE_DIAGNOSTIC1_INSTRUMENT_STOP_20260829.json.gz` is 5,669 bytes
with SHA-256 `6529648717ef9a0cc9d5ae67fa2c2d49b31102ff9dad8ed03f2af13099bd9ae3`; it passes gzip
integrity and expands to the exact 15,022-byte raw report with SHA-256
`47d3c9d371c622576410256ebf6fce94c4268ed90afa563ad06e85e9fdb82d4e`.

The second invocation, `20260829-pr35-a9f75797-heap-phase-diagnostic2`, deliberately omitted a
budget and ran as non-certifying dirty calibration on the same exact build and Edge
`152.0.4191.53` / CDP `1.3`. It captured two fixed complete
answerable → GC → heap → carrier → DOM passes at every snapshot:

- clean-source lane A had placed a +149,928 B desktop embedder movement at the final cycle, making
  aggregate slope 155,178.8 B/cycle and the exact-budget verdict red;
- diagnostic lane A placed a comparable +160,936 B movement at cycle 2, then settled, making its
  aggregate slope 108,199.2 B/cycle and the old first-pass verdict green solely because the charge
  occupied a different least-squares position;
- fixed lane B recorded desktop embedder
  `[2,926,904, 2,913,008, 2,932,760, 2,930,552]`: range 19,752 B, slope 3,069.6 B/cycle, and
  aggregate slope 111,021.6 B/cycle. Phone fixed-B aggregate slope was 92,435.2 B/cycle.

All resource evidence stayed flat or balanced in both profiles: backing storage, DOM/listeners,
the bounded thumbnail cache with one import and fixed job totals, the scene registry, managed
resources, vista/ring/local-canvas caches, pending work, route inventory, BFCache survival and
reload cleanup. A live isolated retained-allocation control added 512 KiB per cycle and both lanes
reported exactly 524,288 B/cycle; releasing it dropped backing storage from 2,097,191 bytes to 39.
Thus the fixed second lane still observes real retained growth and its release rather than merely
suppressing a noisy value.

Immutable carrier `ARC1C_SCENEMEM_PR35_HEAP_PHASE_DIAGNOSTIC2_20260829.json.gz` is 43,249
bytes with SHA-256 `88d2551efcab8b9448cae2ab8160af62bab3e85436489d0effc35f0c940d3774`; it passes gzip
integrity and expands to the exact 763,245-byte raw report with SHA-256
`cd0a2751c33ceafc282882318de989fb8f7e7ddb042c0cfc842c5c8611a86f0c`.

The evidence-backed permanent direction is a fixed full second pass: retain lane A for diagnosis
and always score lane B. The collector must never select a minimum/best-of sample, conditionally
retry a snapshot or retry a red run. Numeric ceilings, browser authority, product build and game
bytes remain unchanged. Because both reports came from changed dirty collector source, neither is
a clean certificate, named predecessor, calibration/budget authority or permission to advance the
serial browser chain; fresh clean producer authority and certification remain required.

### Clean fixed-second calibration — three green candidates and authority-only activation

The permanent collector was then committed as clean source
`4f1ed65db421f16386bc06a167a52a5af9dc51d3` (tree
`e07c19e10ed1f7f1026d6d7b80d407591c353b53`). Exactly three independent calibration runs
retained that commit at source begin and end, reused the unchanged build
`8ef5d89c2abe1615421961b78608ce3e07916b749b08a65fdc13e17b72d5c254`, reported schema
v3 / input v4, completed browser/server/workspace-lock cleanup, and passed all **44/44** outcomes.
Their Edge `152.0.4191.53` / CDP `1.3` tuple is provenance only; no Edge-version rebaseline,
recalibration rule or threshold movement follows.

- Candidate 1, run `20260829-pr35-fixed-second-4f1ed65-candidate1`, is preserved as
  `ARC1C_SCENEMEM_PR35_FIXED_SECOND_CALIBRATION_CANDIDATE1_20260829.json.gz`: 786,292 raw
  bytes, SHA-256 `30863b06f0cf383518c47f3b36b87bb1b0ba38e0b3da586d96c4924e88c1c98b`;
  49,848 gzip bytes, SHA-256
  `248286a1ddbec6b66494a31be2f58ffe05e4cc1d9d9067228191467d3f7849ac`.
- Candidate 2, run `20260829-pr35-fixed-second-4f1ed65-candidate2`, is preserved as
  `ARC1C_SCENEMEM_PR35_FIXED_SECOND_CALIBRATION_CANDIDATE2_20260829.json.gz`: 786,927 raw
  bytes, SHA-256 `d60224544f44eabc512465b515623e1c87522fc2014b5ebb571b03f966ae7841`;
  49,800 gzip bytes, SHA-256
  `03eb43e77669a11d3dbd8ab01c80ff069e5ff0fb2cc0cca0e936727be2b9ced5`.
- Candidate 3, run `20260829-pr35-fixed-second-4f1ed65-candidate3`, is preserved as
  `ARC1C_SCENEMEM_PR35_FIXED_SECOND_CALIBRATION_CANDIDATE3_20260829.json.gz`: 786,955 raw
  bytes, SHA-256 `941b9e580bf744c7b5a8aca8e1edad61701227a8f7074d0bc4e9065cf73848ad`;
  49,833 gzip bytes, SHA-256
  `f3f4f1f71c4c33cf665e24b5aa208af9b6872222988e020902a3646b9ed62788`.

Candidate phone/desktop aggregate slopes were 90,528.8 / 115,485.6, 98,815.2 / 119,155.1 and
97,813.6 / 123,150 B/cycle. The largest phone/desktop aggregate ranges were 296,020 / 366,268 B.
All remain below the unchanged 131,072 B/cycle slope and 524,288 B range ceilings, and all three
gzip carriers expand to the exact raw hashes above. This completes calibration evidence only; it
does not certify the current budget or authorize a successor browser stage.

The authority-only activation changes only the budget's collector binding from
`aa5c3711eb21277fbf24fc539f2a4564915692259bb874aff662066d4ec67f3a` to
`7a1dc670327fed3f04fa120a78be64a5a87227a355292f47d37353522f50d931`. The resulting
activated budget SHA-256 is
`304c325f4c6eda8236494065afc61d319cf8df2223d27ab4ac90f28ac43bc184`; every product,
input, measurement, sample and numeric-ruler field is unchanged. Its complete browser-free battery
passed **235 files / 2,404 tests / 1 skipped**, and all three TypeScript programs passed. One clean
no-retry exact-budget certification and named verification remain pending, so Compendium and all
later stages remain blocked.

## Local evidence boundary

Dirty diagnostic run `20260829233652913-23084-4b4362f86b` completed the full phone and desktop
SceneMemory mechanics through Earth Landing, biome worker/lazy import, Compendium, Shipyard,
ascent, BFCache return, and reload cleanup. It exited zero as **CALIBRATION ONLY** because the source
was intentionally dirty and no checked-in budget was supplied. That label is a source-authority
boundary, not a product failure or a browser certificate.

The final source-authority records, complete browser-free totals, signed commit, and clean
exact-budget SceneMemory run were generated after the repair stopped changing; the clean run is the
43/44 terminal red preserved above, not a certificate. A future serial campaign may proceed only
from a later clean committed source under the one-attempt/no-retry rule; this record itself
authorizes no rerun. Historical signed `3f69e88…` evidence remains truthful for its own bytes and
is never relabelled as evidence for this repair.
