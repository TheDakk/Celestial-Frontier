# Arc 1C SceneMemory fixed phase-validity repair — 2026-08-30

Status: **implementation/calibration boundary; not yet activated or certified**.

This audit owns the replacement for the two-pass SceneMemory heap sampler after exact signed source
`8792e8acc5c20562ae3e17c48d46050824eb99d5` produced one honest but phase-inconclusive
`desktop/heap-plateau` red. It does not alter game code, product memory limits, Edge-family authority
or any earlier report. Candidate, activation and fresh-certificate evidence will be appended here
after each immutable step completes.

## Immutable predecessor

- Run: `20260830-pr35-8792e8a-feed-summary-scenemem-certification`
- Result: **43/44** in 13,322 ms; one attempt, zero retries, complete cleanup
- Finding: `desktop/heap-plateau` only
- Build: `82557aa745288a5889f11ebbd37f1cedbb8154792d61703ba7fded2939e6ad3b`
- Carrier: `ARC1C_SCENEMEM_PR35_FEED_SUMMARY_HEAP_PLATEAU_RED_20260830_8792E8A.json.gz`
- Gzip: 49,864 bytes,
  `ddffe7c9c6a3f70be691bbf2aace67dcaf589c9d51bed49815faaeca80e9b2ab`
- Raw: 788,479 bytes,
  `26123f30de359a2a89802f8b52a085eca44383b9326135e4f426f0846b34ba13`

Desktop aggregate warm range was 525,716 bytes against 524,288; maximum positive slope was
168,448.8 bytes/cycle against 131,072. The final probe/scored embedder value fell
3,402,288 → 3,105,136 bytes, then BFCache later measured 2,382,592. V8 slope was ordinary, backing
slope was zero, and every registered product owner, resource, DOM/listener and pending-work witness
was flat. The two-pass producer correctly called its own P2 series red. Because it retained no P3,
it cannot prove that the P2 endpoint had reached a repeatable native allocator phase. The result
remains red forever; the replacement requires fresh evidence and never retroactively passes it.

## Fixed four-pass protocol

Every initial, warmup, measured and BFCache snapshot always performs four complete passes in exact
`answerability → HeapProfiler.collectGarbage → Runtime.getHeapUsage → product carrier → DOM`
order:

1. P1 `${label}-phase-settle-1` — fixed settling pass.
2. P2 `${label}-phase-settle-2` — fixed settling pass.
3. P3 `${label}-phase-validity` — fixed validity candidate.
4. P4 `${label}` — fixed validity confirmation and the only scored pass.

All four complete raw carriers are retained. P3/P4 must preserve the same document, route, DOM and
resource fingerprint. The instrument independently re-derives absolute P4−P3 deltas for V8 used
size, embedder used size, backing storage and their aggregate. Each must be no greater than the one
activated `maxAbsolutePhaseDeltaBytes` for that profile. Missing, duplicate, reordered or detached
passes; resource drift; a forged validity summary; or an excessive delta produces `instrument-fail`
before `contractInput`, verdict or outcomes exist. There is no best-of selection, conditional fifth
pass, sample retry or automatic run retry.

Persistent product growth remains visible because P4 is fixed in advance and all four lanes must
retain it. The existing four-cycle aggregate range ceiling remains 524,288 bytes and the maximum
positive V8/embedder/backing/aggregate slope ceiling remains 131,072 bytes/cycle.

## Precommitted calibration rule

Exactly three calibration-only reports must run once each, without retry, on one unchanged clean
signed source/build/browser tuple. Each report retains ten P3/P4 pairs per profile and four delta
fields per pair. For each profile:

1. `M` is the maximum across all 30 snapshot pairs and all four fields.
2. Select the smallest threshold in 4/8/16/32/64 KiB that is **strictly greater** than `M`.
3. If `M >= 64 KiB`, do not activate, widen or retry; redesign the sampling protocol.

The tracked budget binds the ordered three-carrier set and its canonical SHA-256, the derivation
rule, the fixed pass roles and the selected phone/desktop thresholds. Calibration reports are not
certificates. Activation is not certification.

The calibration source is explicitly precommitted: the canonical Git-tracked
`port/v2/budgets/scene-memory-v2.json` must validate as v6 `calibration-required` before a browser
can launch. Each candidate records the exact blob hash. Activation replay resolves the candidate's
literal 40-hex clean source commit, reads that exact budget blob with Git, revalidates its state and
cross-binds its producer and browser authority. Candidate report carriers must themselves be
Git-tracked regular non-symlink files under `audits/`. A mutable rev, stale/active budget,
untracked/symlinked carrier, different producer, detached raw contract input or invented product
verdict is rejected.

## Implementation checkpoint before browser calibration

- Current collector SHA-256:
  `936d1bfd9cba6bc59c4cd889160981e612e15b012406c55f22cce11108a682a3`
- Calibration-required budget SHA-256:
  `f453cfe548ec86f65727de17d23a8ef76c2dc3c1bb024c22eb308ff299ccfd99`
- Product build SHA-256 remains:
  `82557aa745288a5889f11ebbd37f1cedbb8154792d61703ba7fded2939e6ad3b`
- Focused contract/budget/tool/workflow coverage: **154/154 passed**.
- Complete browser-free suite: **253 files / 2,539 passed / 1 skipped**.
- All three strict TypeScript programs and the exact producer-authority printer passed.
- Independent code/authority reviews are closed on the implementation. No game product file,
  product ceiling, retry, timeout, browser-family contract or release identity changed.

## Required discrimination controls

- Exact pass count, order and labels; missing, duplicate and reordered pass mutations.
- Fixed P4 scoring when P4 is higher and when it is lower than P3.
- Exact-limit and +1-byte P3/P4 mutations in both directions for V8, embedder, backing and aggregate.
- Cross-component cancellation cannot hide component drift.
- Raw-pass and validity-summary detachment, document/profile/role substitution and resource drift.
- Persistent cross-cycle growth in V8, embedder, backing and aggregate remains product-red when
  phase-valid.
- The live retained-allocation control shows more than 128 KiB/cycle in all four lanes for a real
  512 KiB/cycle allocation, then observes backing storage fall after release.
- Named verification re-derives every raw delta against the exact tracked profile threshold before
  replaying the unchanged input-v5/verdict-v4 product contract.

## Remaining immutable steps

1. Sign one clean calibration source.
2. Capture and preserve exactly three calibration-only candidates once each.
3. Derive and activate the v6 authority without changing the collector or product source.
4. Sign the activation and run one fresh no-retry SceneMemory certificate and named verification.
5. Only after SceneMemory passes may the unchanged-source chain advance to Compendium, Slice and
   Glass.
