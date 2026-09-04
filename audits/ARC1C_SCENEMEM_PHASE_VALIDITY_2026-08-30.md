# Arc 1C SceneMemory fixed phase-validity repair — 2026-08-30

Status: **immutable four-pass and fixed-eight instrument reds preserved; SceneMemory quarantined to
production; develop calibration closed**.

This audit owns the replacement sequence for the two-pass SceneMemory heap sampler after exact signed source
`8792e8acc5c20562ae3e17c48d46050824eb99d5` produced one honest but phase-inconclusive
`desktop/heap-plateau` red. It does not alter game code, product memory limits, Edge-family authority
or any earlier report. Exact signed four-pass source
`5691e77ea470434dd5352901b0a6240a242a48ad` then refused its first calibration attempt before any
product verdict because its fixed P3/P4 initial pair exceeded the 64 KiB hard cap. That red is
preserved below. The implemented successor uses a fixed P7/P8 validity pair after six unconditional
settling passes. Its browser-free schemas, authority hashes and controls are complete below. Exact
signed `cc15e1f…` then crossed the hard refusal, closing this develop calibration as recorded below.

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

## Superseded fixed four-pass protocol

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

## Immutable four-pass candidate-1 instrument red

- Source: `5691e77ea470434dd5352901b0a6240a242a48ad`
- Run: `20260830-pr35-fourpass-5691e77-candidate1`
- Result: **`instrument-fail`** after 8,352 ms; one attempt and zero retries
- Lifecycle: **complete**
- Cleanup: browser **true**, server **true**, workspace lock **true**
- Finding: desktop initial P4−P3 `usedSize` and aggregate absolute deltas were **68,472 bytes**
  against the fixed **65,536-byte** hard cap
- Contract/verdict/outcomes: **absent / absent / empty**
- Carrier:
  `ARC1C_SCENEMEM_PR35_FOURPASS_CALIBRATION_INSTRUMENT_RED_20260830_5691E77_CANDIDATE1.json.gz`
- Gzip: 38,936 bytes,
  `53bf343e503c7a9898ca64116c03c0926aed3221ba224bcb22ae739ae945fcf8`
- Raw: 688,360 bytes,
  `5bb037c4e8d1f8e1b24bb902d31fac747410a35e62b2f37f552c91db276d7557`

The phone profile completed all ten snapshots; its initial P2→P3 V8/aggregate rise was 106,336
bytes and P3→P4 was still 44,084 bytes, while every later phone P3/P4 pair was at most 3,984
bytes. Desktop initial likewise moved 105,300 bytes from P2→P3 and another 68,472 bytes from
P3→P4. This is exact evidence that the initial collector/answerability/native allocator phase had
not settled by P4, not authority to widen the ceiling or make a product finding. Candidate 1 is
therefore immutable instrument evidence rather than a calibration candidate. Candidates 2 and 3
did not run. No Compendium, Slice or Glass successor ran.

## Implemented fixed-eight successor

Every initial, warmup, measured and BFCache snapshot executes exactly eight unconditional
complete passes in the same
`answerability → HeapProfiler.collectGarbage → Runtime.getHeapUsage → product carrier → DOM`
order. P1–P6 are fixed settling passes. P7 and P8 are the fixed validity pair, and P8 alone is
scored. All eight raw carriers are retained. There is no best/minimum selection, conditional ninth
pass, retry or fallback.

The instrument re-derives absolute P8−P7 deltas for V8 used size, embedder used size, backing
storage and aggregate. Missing, duplicate, reordered or detached passes, ticker/document/role
failure, resource drift or any excessive delta remains `instrument-fail` before contract creation.
Persistent cross-cycle product growth remains visible because P8 is preselected and scored in every
snapshot. The existing 524,288-byte range and 131,072-byte/cycle slope rulers remain unchanged.

## Precommitted calibration rule — hard-stopped

The plan required exactly three **fresh** calibration-only reports once each, without retry, on one unchanged
clean signed fixed-eight source/build/browser tuple. Each report retains ten P7/P8 pairs per profile
and four delta fields per pair. For each profile:

1. `M` is the maximum across all 30 snapshot pairs and all four fields.
2. Select the smallest threshold in 4/8/16/32/64 KiB that is **strictly greater** than `M`.
3. If `M >= 64 KiB`, do not activate, widen or retry; redesign the sampling protocol.

The tracked budget binds the ordered three-carrier set and its canonical SHA-256, the derivation
rule, the eight fixed pass roles and the selected phone/desktop thresholds. The four-pass red cannot
enter that set. Calibration reports are not certificates. Activation is not certification.

The calibration source is explicitly precommitted: the canonical Git-tracked
`port/v2/budgets/scene-memory-v2.json` had to validate as v7 `calibration-required` before a browser
can launch. Each candidate records the exact blob hash. Activation replay resolves the candidate's
literal 40-hex clean source commit, reads that exact budget blob with Git, revalidates its state and
cross-binds its producer and browser authority. Candidate report carriers must themselves be
Git-tracked regular non-symlink files under `audits/`. A mutable rev, stale/active budget,
untracked/symlinked carrier, different producer, detached raw contract input or invented product
verdict is rejected.

## Superseded four-pass implementation checkpoint

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

## Fixed-eight browser-free implementation checkpoint

- Authority schemas: **report v6 / profile v5 / input v6 / verdict v5 / budget v7**.
- Collector SHA-256:
  `c4968d0a2cfb489c46df94f603d9730c995760b3ca2a289b1f3774662d663b71`
- Verdict-contract SHA-256:
  `e973f8c8f3eeae05c1c9c1328926f2ccf6f4aba7b3602f6bf5ab623a6163d599`
- Calibration-required budget SHA-256:
  `5edac549b6ee0fa79afe5b6f282d68f0439c4385f0afe5d8f2ac58035d8eb96a`
- Focused contract/budget/tool/workflow coverage: **4 files / 158 passed**, including the
  genuine-current fixture control.
- Complete browser-free suite: **253 files / 2,543 passed / 1 skipped**.
- All three strict TypeScript programs and the exact producer-authority printer passed.
- No game product file, product ceiling, retry, timeout, browser-family contract or release
  identity changed.

## Immutable fixed-eight candidate-1 hard stop

- Source: `cc15e1f967f6644405cad7c3460cd8181b6a043f`
- Run: `20260830-pr35-fixedeight-cc15e1f-candidate1`; one attempt, zero retries
- Browser: Edge `152.0.4191.53`, CDP `1.3`
- Lifecycle/cleanup: complete; browser, server and workspace lock all released
- Finding: phone `warm-1` P8−P7 embedder **287,192 bytes** and aggregate **299,720 bytes** versus
  the **65,536-byte** hard refusal
- Contract/verdict/outcomes: null / null / empty
- Not run: desktop, candidates 2–3, activation and certification
- Carrier: `ARC1C_SCENEMEM_PR35_FIXEDEIGHT_CALIBRATION_INSTRUMENT_RED_20260830_CC15E1F_CANDIDATE1.json.gz`
- Gzip: 32,448 bytes,
  `702a6ca1ff8ae508f215aa961a946844f0095b7777ac67f6ec7ec6a9d3d0180f`
- Raw: 745,707 bytes,
  `f4c5940efcd2deeea9ce7cbc68bb9e13022b889bf57e015d5c1bec04db4692a4`

This is immutable instrument evidence, not a product verdict or browser PASS. Per the precommitted
hard stop, candidates 2–3, retry, widening, added passes and another redesign are forbidden in this
campaign. SceneMemory is production-only/quarantined and never a `develop` merge blocker. Its live
selftest remains changed-instrument-or-production.

## Required discrimination controls

- Exact eight-pass count, order and labels; missing, duplicate and reordered pass mutations.
- Fixed P8 scoring when P8 is higher and when it is lower than P7.
- Exact-limit and +1-byte P7/P8 mutations in both directions for V8, embedder, backing and aggregate.
- Cross-component cancellation cannot hide component drift.
- Raw-pass and validity-summary detachment, document/profile/role substitution and resource drift.
- Persistent cross-cycle growth in V8, embedder, backing and aggregate remains product-red when
  phase-valid.
- The live retained-allocation control shows more than 128 KiB/cycle in all eight lanes for a real
  512 KiB/cycle allocation, then observes backing storage fall after release.
- Named verification re-derives every raw delta against the exact tracked profile threshold before
  replaying the current input-v6/verdict-v5 product contract.

## Remaining boundary

1. Develop continues with one no-retry **Compendium → Slice → Glass** chain.
2. Production remains **SceneMemory → Compendium → Slice → Glass → Recovery** and requires a
   later explicit SceneMemory activation decision before it can begin.

## 2026-09-02 hosted allocator-phase confirmation and ownership correction

The line above stating that the live selftest remained changed-instrument-or-production is now a
historical boundary, not current workflow ownership. Exact PR #35 run `33584052508` proved why:
the identical selftest blob that passed the prior three Edge 152 / Node 26.8 / Ubuntu-image runs
stopped on a different hosted worker at P8−P7 embedder/derived aggregate **532,800 bytes** versus
the **65,536-byte** cap. The synthetic control loaded `about:blank`, never loaded the game and
created no product verdict. Complete evidence is in
`ARC1C_SCENEMEM_PR35_HOSTED_PHASE_INSTRUMENT_RED_20260902_18C088D.md`.

The hard stop continues to forbid retry, widening, extra passes, point-version rebaseline or
another sampler redesign. The durable correction is ownership: live current-Edge installation,
the fixed-eight retained-allocation selftest, certification and verification are all production-
only. Develop still runs the complete deterministic SceneMemory mutation suite and its required
Compendium → Slice → Glass chain. The live selftest remains strict and fail-fast in production,
which still requires Nick's explicit future activation decision.
