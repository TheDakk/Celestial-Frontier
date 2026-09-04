# Full review disposition — 2026-09-04

Status: implementation in progress. This is a finding/evidence ledger, not a replacement roadmap.
Product scope and acceptance remain in `../port/V2_PROGRAM_ROADMAP.md`, `../port/DECISIONS.md`
and `../port/RUBRICS.md`. Current batch state is in `../ROADMAP.md`.

## Input and authority

The exact external read-only review is `CELESTIAL_FRONTIER_FULL_REVIEW_20260904.md`.
SHA-256: `f12395762eeba42a0ce4da22767a38877bf42d62288c98e404ad481face9bfe0`.
The reviewed develop merge is `7bf3e84761da2d1abe21dc6fe751b4bad2308f3b`; its tree
`d339b676eba7f273ffe4a85800944e4ec56452cd` equals tested source
`20301713cce4aec9e0ea2c0cbb618c5ac88a5fed`. Read-only cross-checks on the latter therefore
address the reviewed code. No browser or new test was run during review.

Nick approved the corrected completion plan, not blind execution of every report proposal.
No missing game choice, numeric loot policy, baseline change, infrastructure retry, hosted attempt,
release or human judgment is inferred from that approval.

## PR #35 terminal record

- Run https://github.com/TheDakk/Celestial-Frontier/actions/runs/33835828222, attempt 1:
  required battery job `100908050281` SUCCESS, 04:10:40–05:59:09 UTC, **108m29s**.
- Exact head `20301713cce4aec9e0ea2c0cbb618c5ac88a5fed`; base
  `7a9f4c1370dd84292388d718c38ff34214f6203b`. Authorization job passed.
- Compendium, Slice and full Glass 12/12 plus their named verification passed.
  IDs `gha-33835828222-1-compendiummem`, `gha-33835828222-1-slice`,
  `gha-33835828222-1-glass`. All Glass rows reported zero findings/instrument failures.
- Diagnostic projection and mandatory `battery-evidence` upload succeeded. GitHub artifact
  `9925377490`, 9,982,067 bytes, API digest
  `sha256:7f8484a12dbcddd682e7d4acad8c2da585b0eedd655ffc33ed3aa75d00bbacac`.
  Glass raw report SHA-256 `99078920904b4ce5b97236485dc996aa44e99416a8507b703743bc7216de5388`;
  gzip `38ca07a44018ead88cc91965b47c01c7a7b589d8440d5b56b8795fe06ec38304`.
  This metadata/log verification does not claim a separately downloaded/rehashed archive.
- Merged normally 12:42:54 UTC as `7bf3e84761da2d1abe21dc6fe751b4bad2308f3b`; exact parents
  and tree were independently read back from GitHub. Source branch retained; approval label
  removed; monitor paused. No release/main merge/deployment.
- This closes integration of the implemented slice, not the full vision or HUMAN gates.

## Code-grounded corrections

| Review claim | Disposition and evidence |
| --- | --- |
| Arc 3 Build → reach is disconnected | Overstated. Permanent Jump Drive/Array/Intergalactic Drive fabrication feeds `scene/src/charter.ts:15` and `main.ts:4868`; real fabrication commits via `arc3-engineering-actions.ts:987`. Five research consumers at `opportunity/src/planner.ts:777` remain unavailable; speed research is not the existing permanent reach ladder. |
| Conquest throws / Guardian rewards unsupported | Overstated. `persistence/src/combat-settlement.ts:868` guards accepted weekly `wk-conq`; ordinary conquest, Guardian/Titan capture, Prime claims, XP and Stardust are live. `main.ts:13429` publishes them. Extra authored Gear/material reward and imbue coexistence are open decisions. |
| Eleven Training lessons | Incorrect count: `training.ts:48` defines fifteen IDs including graduation. Hands-on curriculum remains partial; add lessons alongside real actions. |
| No companion care / bond always null | Qualify: Feed, nonlethal Breed/recovery, Rename and role-only Scout exist. Newly minted bond is null, but `acquisition/src/legacy.ts:237` preserves imported bond. Healing, bond growth and missions remain open. |
| Audio is a stub | Recorded/authored content gap is real; deterministic synthesized interaction, biosphere and Combat Chronicle cues already work. Empty rights bundle is not evidence of silence. |
| Both breeding rules are displayed | Not established; current rendering disproves it. `guide-content.ts:609` selects current partial body, `main.ts:2920` renders that body; `guide-release.test.ts:1240` protects current-versus-legacy distinction. Preserve the immutable V1 snapshot. |
| Ledger literal is a player-visible contradiction | Not established. `economy-ledger.ts:39,103,173` describes analytical source/rate-model availability; no app consumer was found. Do not replace `arc3-deferred` with a false completed model. |
| No verbatim seals exist | Incorrect generally: `dom5-dependency.test.ts:86`, `biome-vista.test.ts:200`, `overridecheck.mjs:537` and species portability already seal subsets. Inventory real gaps; ThumbArt has intentional lifter adaptations, so a generic header/body equality loop is wrong. |
| Runs 13–15 were global timeout failures | Unsupported. Retained diagnoses are verdict composition, geometry across DOM replacement, focus lineage and artifact outage. A global time multiplier does not repair those causes. |
| Compendium store list accidentally omits receipts | Not a missing current store. Both fixture seed paths explicitly open DB version 1; the candidate uses `createIndexedDBBackend('cf-v2-slice')`, default version 2, whose upgrade creates the full store inventory including receipts. Keep this legacy-to-current fixture and historical baseline shape; do not mechanically replace it with the current store list. |
| Stale app header / conflicting agent rules | App header now correctly says 15 Training IDs and live Atlas favorites. Both agent entry points explicitly distinguish preserved production-v1 details from V2 nonlethal breeding/versioned active-play persistence. The fourteen original facades are a completed milestone, not today's package count. |
| Human Arc 4.5 before Arc 5 | Conflicts with Nick's approved combined post-Arc-5 sequence at `V2_PROGRAM_ROADMAP.md` §4.10. Early exploration may inform work but does not close that gate. |

References use V2-relative paths unless otherwise noted; original line numbers identify the reviewed
snapshot and may move during implementation. Evidence applicability is always source-bound.

## Findings / proposed remedies

A report priority is not proof of an emergency. Distinguish product risk, future feature, maintenance
and policy changes. **Open** means not yet implemented/verified, not silently rejected.

| ID | Finding/proposal | Corrected disposition / next acceptance |
| --- | --- | --- |
| P0-1 | Faster develop lane | Open policy design. Preserve meaningful gameplay/save assurance; explicitly name full checks deferred to milestones/release. Current production SceneMemory activation is still open. Measure cost; 8–12 minutes is not proven. |
| P0-2 | Infra rerun/upload transport retry | Open separate policy. Preserve earlier product/instrument red; require verified immutable upload, final archival failure, bounded transport retries only. Cancellations are not automatically infra-safe. No whole-battery retry authorized. |
| P0-3 | jq → Node | Implemented locally: shared targeted verifier, retained-report parity, 344 workflow lines removed, former heartbeat corruptions moved to its tests. Full Slice-bound verification is unchanged. jq remains for run-ID extraction. |
| P0-4 | Persist post-await gate | Implemented and browser-free verified: admission repeats at queued execution/after heartbeat; owner exceptions, failed-import rearm and exact-once save behavior retained. No claim of demonstrated prior import corruption. |
| P0-5 | Harness outside public bundle | Implemented locally: explicit evidence build, distributable dead-code removal, build-consumer admission and ordinary preview readiness. Both final-byte/PWA inspections and distributable Edge flow pass. Unarmed async ordering/native backend are covered; exact-source full certification remains pending. |
| P0-6a | Artlock CI owner | Gap confirmed, open. Artlock is a real catalogue/browser render, not a cheap static check. Assign changed-art/release ownership and provenance before adding cost. Never auto-bless references. |
| P0-6b | Verbatim coverage | Inventory complete: 21 artifacts, ten already protected by full-file/regeneration seals; eleven retain parity but lack equivalent full-artifact regeneration coverage. Use actual lifters for those gaps, never generic header hashing over adapted output. Implementation remains open. |
| P0-7 | Guide/ledger literals | Proposed mechanical fixes rejected for reasons above. Retain correct current Guide; source-model completion belongs to real economy work. |
| P1-focus | Records/Atlas/Charters focus | Implemented; executable real-function/jsdom checks pass for semantic identity, disabled/removed fallback and later focus ownership. Native keyboard/scroll/device acceptance remains open. |
| P1-layering | Scene/domain ownership | Open staged move with compatibility re-exports; preserve identities, brands, imports and byte contracts. No blanket architecture rewrite before gameplay. |
| P1-canonical | Canonical serialization copies | Contracts differ for undefined, sparse arrays, integer-key ordering and admission. Loot's four production uses are Gear equality comparisons, not direct digests. Preserve current semantics and encoded Gear bytes; compatibility fixtures must precede any consolidation. |
| P1-time | Runner budget factor | Global factor rejected. Measure transport/readiness bottlenecks separately from fixed product/evidence deadlines. |
| P1-helpers | Shared source/server helpers | Open incremental extraction with current source/lock/server cleanup semantics; do not merge distinct trust boundaries merely because helpers share names. |
| P1-lists | Shared key inventories | Open deduplication where ownership is genuinely the same. Keep independently authored expectations where they detect a missing producer field. |
| P1-windows | npm.cmd / browser discovery / docs | Three direct npm callers now share the safe invocation owner; four platform/mock tests pass. Windows Chrome resolver change remains deferred because resolver bytes are measurement-authority inputs; actual Windows verification remains open. |
| P1-audio | Voice watchdog | Implemented locally and fake-clock verified: optional finite bound, one injected earliest wake, exact existing cleanup, lifecycle/stale-callback controls and finite caller integration. Native-device scheduling/listening remains open. |
| P1-tests | Layering/targeted domain gaps | Implemented locally without a duplicate blanket suite: world-identity authority tests now reject malformed/shallow-frozen privileged mint input, retain only the exact deeply frozen registered object and refuse structural/public-registry clones. Star-catalog parity now pins `GCELL=42`, `SOL_POS={560,170}` and frozen home/Sol anchors. Focused tests pass; naming and the remaining world configuration parity stay with their existing direct owners. |
| P2-phone | Allocation/navigation/cache/boot | Open measured performance work. Review every save consumer before replacing immediate commits with debounce; preserve travel durability. |
| P2-main | Extract main.ts | Open incremental extraction along existing owners. Generic action coordinator cannot erase domain-specific CAS, publication and recovery guarantees. |
| P2-tools | Instrument diet | Open duplication/ownership audit; keep historical failure replay, determinism/save safety/art locks. No arbitrary line target or deletion based only on not being in CI. |
| P2-memory | Compendium runtime cost | Open Linux timing analysis and coverage decision; no unmeasured calibration/threshold relaxation. |
| P2-docs | Documentation diet | Start with live status/disposition. Archive chronological logs verbatim; refresh reference laws in place. Keep OpenAI/Anthropic entry points with one shared protocol. Do not archive current rules or erase history. |
| P3 | Hygiene findings | Open bounded confirmation: heartbeat branch, wrappers, dependency manifests, painter helpers, case timeouts and focus-ring scheduling. No removal until all callers and source seals are mapped. |

P3 confirmed dependency gap: `@cf/art` already imports Genome in the sealed HD worker and
PlanetGen in the adapted ThumbArt artifact. Both are now declared with matching workspace-lock
entries; existing installed links/manifest equality and Haze ownership checks pass. No painter
source changed. Other P3 items remain open, not bundled into an unreviewed cleanup.

## Initial execution / verification record

- Correct workspace was clean at `2030171`; initial SSH failed signing through 1Password.
  No edits/remote writes occurred in the blocked turn.
- After Nick said ready, SSH fetch succeeded; clean `openai/mac` fast-forwarded to `7bf3e84`.
- Review copy hash matches original exactly. Prior ROADMAP handoff is archived verbatim.
- Runtime, portable npm callers and targeted-verifier work are disjoint bounded tasks.
- No new hosted attempt, release or deployment has run.

## Local batch 1 results

- Runtime: 8 focused files / **52 tests passed**, 685 ms. Tests execute shipped `persistView`
  and refill functions, not retyped control-flow models. Focus is jsdom evidence, not native
  keyboard/scroll/paint proof. Existing save schema, Training/import/replacement guarantees remain.
- Windows: **4/4** mocked platform/callsite checks; existing Recovery selftest passed. Two
  Recovery source seals changed mechanically with the portable build invocation, not its rules.
  `artaudit` initially reported three false stale-build findings because its matcher recognized
  only the old spelling. It now recognizes the shared invocation, retains positive/negative
  controls, and passes **34 art sources / zero findings** (0.46s focused).
- Targeted Glass: retained real small/large Chrome reports replay unchanged. One-time old-jq
  comparison rejected **38 shared corruptions**; Node additionally refused five source/omission/
  raw-evidence forgeries accepted by jq. All **73 former heartbeat corruptions** moved unchanged
  to shared-verifier tests. The workflow loses **344 lines**, with both canaries, seven-minute cap,
  full final chain, immutable IDs, zero retries and mandatory artifacts retained. Independent
  bounded verifier review: CLEAR. Full certificate verification remains separate.
- Initial targeted suites: **27/27** verifier/diagnostic/keyboard tests; existing evidence-chain
  suite caught one stale CLI spelling pin, synchronized without weakening it. Root integration
  checks passed **20/20** across workflow, targeted verifier and Windows callers (6.91s).
- Consolidated `check-profile --profile=develop`: **271 files**, **2,806 passed / 1 skipped /
  5 failed**, 41.56s. The five were three stale current-producer fixture expectations and two
  intentional new draft-bullet count/hash references. Profile stopped before typechecking; no
  browser chain ran. These reds are retained, not called a green aggregate.
- Focused closure: Compendium budget **28/28 passed** (833ms), after its first 27/28 pass exposed
  a remaining stale current-producer narrative. Release/Guide **55/55 passed** (3.00s), after a
  54/55 pass exposed the deletion-control count. Current draft is **78** ordered unique bullets,
  SHA-256 `9c0eb6ed6f20ff44250f417c310c6652ccc75683df9aeb64f404edea53461272`.
  V1 history/copy and release version are unchanged. Exact source/count duplication is still a
  maintenance finding for the shared-inventory work, not grounds to delete outcome checks.
- Remaining develop commands completed separately and passed: strict root TypeScript,
  app TypeScript, worker TypeScript; art audit **34 / 0**; route/override **1,014/1,014** with
  **1,010/1,010** Earth catalogue coverage; spec **454 fields / zero inert** and 5/5 self-controls.
  No second full aggregate was needed to discover another failure.
- Root `node tools/validate.js`: PASS, zero boot/render errors, **1,010 species** rendered,
  all **50** deterministic probes equal the V1.0 fingerprint. Root V1 tracked output is unchanged.
  Actions policy selftest: **66/66 PASS**. Glass selftest already ran inside the universal
  evidence-chain suite; it was not launched again as a duplicate owner.
- All new results are local. No fresh exact-source browser certificate, native phone acceptance,
  full Windows run, production SceneMemory activation, hosted run or integration is claimed.

### Current fingerprint, not recalibration

The independently built app changes Compendium's current producer only to
`1ce8862d0fa48cce753b800be337c277f66a26c414eba339b134063221adb1a7`.
Index SHA-256 `0e8ebbfa233e80bd2639d0ef92ee74ac9cb6d158e48fddd5a87c138741ee06c7`;
owner `assets/main-C-tWEeLQ.js`, SHA-256
`f8907c93ab53ebf0c2207a513e88eaa562e661dbc3ee389b7fabbe52779d6151`;
service-worker SHA-256 `3bc838bdff56b8446a6ffae62beed9fb6bf680e65901b258a2a1c371ce9eca11`.
Species worker/painter bytes are unchanged. Measurement remains
`b83cbb85149e9d17207865deaf8edc3fc5d12a3e14f5c271a1f7d9110bf681da`;
numeric-ceilings digest remains
`a5f05be521eb127f3e74306bd69538bdb6d3b564875ed921f2c7f3c0904def83`.
The all-authorities printer correctly exited 2 before current-producer rebinding, also reporting
quarantined SceneMemory drift. Historical samples/ruler and SceneMemory budget were not rewritten.

### Next bounded implementation boundary

The harness review identifies an explicit Vite evidence mode, not `DEV` gating. The default
distributable must omit `__CF_SLICE__` and ten additional diagnostic/fault window-binding sites.
Preserve existing awaited no-op action boundaries until equivalent ordering is proven. A dynamic
import alone is insufficient because PWA precaches emitted runtime chunks. Evidence builders
(Slice, Glass, candidate Compendium, SceneMemory, Recovery, sliceperf and authority printer) must
opt in; historical baseline builds retain their own contract. Preview stays distributable and
its existing `__CF_SLICE__.api.state()` readiness read must move to actual DOM/Guide readiness.
Prove mode separation, save/product equivalence, valid PWA resources and honest current input
fingerprints without changing fixed numeric limits. Batch 1 is locally committed as
`e0acfabf80a055b4c1132c49a9461c42a391afb0`; this next boundary is now in its working-copy batch 2.
Before any real build, a single-file minifier check showed that hiding only the API left dormant
fault bodies in output. Explicit compile-time gates at the fault consumers are therefore part
of this implementation; the unverified API-only state is not accepted or distributed.

The faster-develop coverage decision is requested explicitly: browser-free + two phone canaries
versus retaining the entire chain on every integration. Deferring the long chain to milestone/
release is a coverage-policy change, not a free optimization; it is not silently enabled here.

## Local batch 2 — explicit evidence-build isolation

Base is local signed `e0acfabf80a055b4c1132c49a9461c42a391afb0`. All results below use its
working-copy successor, not an exact clean-source certificate. There is no hosted action.

- `__CF_EVIDENCE_BUILD__` gates the public Slice API and ten additional diagnostic bindings,
  fault injection selectors and destructive implementations. Default persistence uses the exact
  native backend/promises. Unarmed holds retain their asynchronous boundaries; frame → task →
  answerability → art activation ordering is unchanged. Focused runtime checks: **98/98**, eight
  suites (1.09s), including six new compiled/executable isolation/ordering cases.
- Seven evidence builders explicitly select `--mode evidence` and verify its parsed HTML marker.
  Candidate Compendium changes, historical baseline build commands do not. Default preview
  packaging builds and requires distributable mode. Raw `vite preview` only serves existing dist;
  a fresh ordinary build is required before manually serving distributable output.
- Actual distributable build: **965 modules, 1.93s**. Executable JS inspection found **zero** of
  fourteen diagnostic/fault markers in 24 files including the service worker. All **29** final
  PWA asset hashes match. Main `assets/main-A8uhAW-r.js`, **1,558,278 bytes**, SHA-256
  `7f0b0164143031e731dd3e958eff505156e88314c48e9183200f575d750bb0c5`;
  index `c4ebb29682b53a8c10699b47db44cadef2b417ca42834e34b06b2a394ad88238`;
  service worker `f5312cde74fc5737f74347c807b3f9569d9b8b81edee0e128e8f6d74620f7de9`.
  Source maps were excluded from executable-code inspection; this is not source-code secrecy.
- Local-only package `port/v2/apps/game/smoke/dev-preview-e0acfab-build-isolation-20260904`,
  content SHA-256 `2fcfc4785722238e5d2008e1267fe238ce197cd31a23a5ab98d60ac3fec60f14`.
  The first browser check was **instrument-red**: the new readiness predicate incorrectly treated
  Training's painted inert background as hidden. Repair separated painted readiness from action
  admission and added the real Skip Training action before Guide. One post-repair check on the
  same package passed in Edge **152.0.4191.62**, boot → real Skip → normal control restoration →
  Guide with full `e0acfab…` identity, no diagnostic API/badge. No storage injection or inert
  removal. Package remains **dirty/local-only/nonpublishable**, and programmatic real-control
  activation does not claim native pointer/keyboard or physical-device acceptance.
- Independent review then found an opacity-zero readiness blind spot. The predicate now checks
  ancestor display/visibility and effective opacity/filter opacity; focused positive, transparent,
  malformed and inert controls pass. App and package bytes did not change for this instrument
  correction; the earlier browser result is not relabelled as a new run.
- Actual evidence build: **965 modules, 1.86s**; fourteen diagnostic/fault markers present in its
  23 asset JS files, all **29** final PWA hashes match. Built tree is
  `56dabfc36734e5369fc9faf0dbe0720d9cb3dda0a2eb93e3235bdbdf297c00b9` (52 files).
  Species worker/painter remains byte-identical:
  `25519cabdf0963bdc722b591855e7c7fdaaecbead63fdfa2d499bf35382f7172`.
- Current Compendium measurement is
  `de87857f5b3bf6ae9d2626c185c180fab22ec0e4859e7dc90b3b1f89089b3a29`; collector
  `3ce7ed13c57f7feabc2653b9f7ce5eb323bc3305a19646f2cd93af5032d2dc5e` changes only explicit
  build mode/admission, not the measurement algorithm. Current producer is
  `e690f6aa7134b776c8bf33f665940f46b30efb546cd287e26df2d34866bc9c10`:
  index `1a393add78ffaa6bb48a2abd42e5c806cb81ac86a2a383cda10e840b55182757`, owner
  `assets/main-CmDVRgZf.js` / `43c99cfc772f6b1e3bad171557e9db8fed444f4329597c5f26de9d4e94982111`,
  service worker `b3c3721e9d3b18d555501876c2bfe8c7232dff264d19e8c133cd1804e1fe5a2b`.
  The printer's initial exit 2 honestly reported the stale current pins and quarantined
  SceneMemory mismatch. Current Compendium pins/narrative now reconcile; **28/28** budget tests
  pass. Every unrelated field, historical sample/ruler and numeric ceiling is unchanged; numeric
  digest remains `a5f05be521eb127f3e74306bd69538bdb6d3b564875ed921f2c7f3c0904def83`.
  SceneMemory remains quarantined and its budget was not rewritten.
- One consolidated develop profile: **274 files, 2,842 passed / one skipped / four failed**,
  **41.32s**. Three failures were case deadlines during eager parser import/startup; the fourth
  was an overlooked 77→78 draft-inventory assertion from batch 1. The parser now loads only on
  actual build inspection, preserving its synchronous parsed-document semantics and avoiding
  startup cost for malformed CLI/source-only tools. No timeout was raised. The stale count is
  synchronized with the existing 78-bullet artifact; no new release bullet/version change.
  Focused final-source closure is recorded below; this first aggregate remains red.
- Three TypeScript programs, art audit **34/0**, routes **1,014/1,014**, spec **454/0** plus five
  controls, and root validation all pass. Root validation rendered **1,010** species with zero
  errors and retained all **50** V1 fingerprints. V1 tracked output is unchanged.

Final-source closure: **46/46** across all three failed suites (16.42s); build-mode/readiness
**36/36** (832ms), including a fresh-process control proving source-only imports do not load
jsdom. The three deadline failures occurred during eager parser startup/concurrent static work;
lazy loading removes that new overhead without increasing deadlines. These focused results do
not claim a second green aggregate under identical concurrent load. Independent bounded isolation
review is clear after the opacity and lazy-import repairs. No new build was needed for those
instrument-only edits. Preview package selftest passed; Recovery and Windows-callsite focused
checks passed. Glass selftest is owned by the evidence-chain suite, not duplicated afterward.

App main source SHA-256 is `df5495ae8e54796ae988257d58c7262fc8371f685b501a032bfd5cfb4dec47d6`.
Batch 2 is ready for local commit; its exact signed successor is recorded at Git handoff rather
than self-embedded. No full browser chain, native-device acceptance, production activation,
release or GitHub write is claimed.

## Local batch 3 — finite audio lifetime and reference/dependency corrections

Base is signed `13d24af38fecdedb363d32a3ecfa4d7c9c3b5924`; this is its locally checked successor,
not a newly admitted browser certificate. Batch 2 was clean/three commits ahead before editing.

- Runtime accepts optional integer `maxDurationMs` from 1 through 2,147,483,647. Bounded voices
  require an injected asynchronous scheduler; unbounded compatibility calls allocate no watchdog.
  The deadline is sampled after graph construction and before starting its sources. One earliest
  wake uses the injected monotonic clock, not audio-context time, wall-clock rewards or game RNG.
  Overdue/missing-onended cleanup reuses `finishVoice`, removes the owner before hostile callbacks,
  and releases sources, nodes, concurrency and mix. Natural/manual/steal/mute/hide/dispose/context
  paths still own ordinary cleanup. Invalid scheduler/clock behavior fail-closes bounded voices;
  no global clock or new diagnostics schema was added.
- Runtime focused suite **78/78 PASS**, 487ms. Initial **75 pass / one fail** exposed only the
  hostile-getter test's stale expected field inventory; the new optional fields are now included
  in its once-only-read expectations. No unchanged red retry or timeout increase.
- Exactly three finite request builders cover creature expressions, generic ecology and all
  registered combat cue families/motifs. Their bounds use actual last source-stop plans plus a
  **250ms cleanup-only allowance**. Existing synthesis, source starts/stops, mix policy, seeds,
  envelopes and `main.ts` are unchanged. The one shared app runtime supplies cancellable browser
  timers and permits a fake scheduler. Separate legacy stings keep their own native-stop path.
- Builder suites **18/18 PASS**; final app-owner suite **52/52 PASS**. The initial combined run
  was **69 pass / one fail**: its new cleanup test incorrectly expected a fake's historical
  connection array to clear. The existing fake deliberately records disconnect calls instead;
  the corrected exact-count assertion passes without changing product code.
- Independent bounded review **CLEAR**. A proposed nested-clock admission issue was retracted:
  the existing public `voiceAdmissionInProgress` guard already refuses nested play for the entire
  inner operation. No speculative repair was added. Native timer scheduling/listening is not
  established by read-only review or deterministic fake-clock tests.
- Art's existing Genome/PlanetGen imports are now declared in package metadata and lockfile.
  Installed workspace links and manifest/lock equality pass; Haze ownership **6/6** (390ms),
  species portability **5/5** (1.37s). No painter source or dependency version changed.
- Both agent entry points distinguish V1-only consumed-parent/save/clock descriptions from V2's
  approved nonlethal companions and versioned active-play persistence. Arc 3's body now reflects
  the already-implemented Pureforged path and the genuine missing research consequence owners.
  The legacy-v1 Compendium seed remains intentional: current DB version 2 creates receipts on
  upgrade. Do not remove this fixture coverage to match a current-store list mechanically.
- Existing V2 audio draft bullet now describes lifetime cleanup; **78** bullets remain,
  ordered text SHA-256 `21d167aac4d2c147675d97d587507a93b9362bb6a9cf07406c075b258491ccc1`.
  Slice's ordered authority follows the actual rendered-text digest. Guide/release focused checks
  **52/52 PASS**, 1.94s. No production version/popup or immutable V1 history changed.
- All three TypeScript programs pass. Root validation again passes **1,010** renders with zero
  errors and all **50** V1 fingerprints unchanged. No full profile/browser chain was repeated.
- One fresh evidence build passed in **1.93s**, 52 files, built-tree SHA-256
  `ee016dc5a966dc8851bf0f6501919bb75141f4a47eb01f6e9ecca96b15547dd3`.
  Current Compendium measurement is `4a93479b62b032155a4825bde6425ebd430ccb286979dc69e90064bb3c7f5e12`;
  only its package-lock input changes to
  `53527ca265e744f32e47b2cc9bad1663633826782903610faf360503a5f12e4d` for existing art dependency
  declarations. Collector/measurement algorithms are unchanged. Current producer is
  `3c20acc35e2839101e551ac10575ef27d29df5edd6d7ae29e97130252605ec1b`, index
  `fd81bf3649162f778526d6311056cafddc63bd23ab3b87006a4bb1c9ff4557c8`, owner
  `assets/main-Biahj8TR.js` / `428b859e0a6d055732572b60491628f4481eb1d8b7211cf8eb0918ba69b6f474`,
  service worker `f5d250928064ff28c07366794bf7a9d4c4cbb3f1daf68ba63a59e6b202a60264`.
  Species worker/painter remains `25519cabdf0963bdc722b591855e7c7fdaaecbead63fdfa2d499bf35382f7172`.
  The printer correctly exited 2 before current-pin refresh and reports quarantined SceneMemory
  drift; it is not a failed product run. Historical samples/ruler and numeric ceilings remain
  unchanged (`a5f05be521eb127f3e74306bd69538bdb6d3b564875ed921f2c7f3c0904def83`).

Final composed-source audio closure is **148/148** across all five affected suites, **697ms**;
current budget tests **28/28**, **770ms**. Structural comparison to batch-2 HEAD proves exactly
eight budget paths changed: the two current measurement fields, five current producer fields and
selection narrative. All unrelated/historical/numeric fields are unchanged. Diff check is clean.
This completed batch is ready for a local signed commit; exact SHA is reported at Git handoff.
Remaining campaign work is still open. Research restoration, combat modifier/reward choices,
fast-lane coverage and real-device/HUMAN acceptance are not inferred from these local checks.

## Local batch 4 — connected research, living-world actions and expedition records

Base is signed `8bf9c45d4aae74a6924bcdc201424db0af4770e6`; this is its local working-copy
successor, not an exact-source browser certificate or release candidate.

- All six existing Research rows remain the canonical rows with their authored costs and
  prerequisites. Reinforced Hull reduces only hostile Bioscan wounds by 25%; Xenobotany adds one
  point only to a safe explorer Flora meal; Fusion, Antimatter and Warp Fold select the existing
  2x/4x/8x travel-presentation ladder. Existing permanent Jump Drive reach is unchanged. Worn
  `heal`, `scut` and `speed` capabilities join only their named effects.
- The analytical economy source model now derives Mine/Skim availability, fixed recipes,
  Research and connected effects from canonical opportunity, inventory and Engineering facts.
  Deep Scanner prerequisite authority comes only from canonical owned-item counts. A retained
  deterministic scenario fixture proves representative source/effect rows without adding random
  loot, sockets, upgrades or new reward tables.
- A living-world survey exposes explicit **Discover Life**. Ordinary inspection remains read-only;
  the native action completes one existing Survey settlement and one deterministic hostile-hazard
  draw in one F4 receipt/CAS. Reinforced Hull and worn protection affect only the disclosed wound.
  A standing Scout intercepts at no worse than Critical; otherwise the explorer remains at least
  1 HP. Hostile survival joins `survivor` and re-runs aggregate/rank projection inside that same
  receipt, so durable state and ceremony agree without a second write or reroll. Capture/Yield,
  loot and the accepted `st-scan` Charter remain separate owners.
- One real owned Flora detail can consume one canonical specimen as an explorer meal. A safe meal
  applies worn healing and permanent seeded-stat nourishment; poison heals/grows nothing and is
  nonlethal. `fieldmedic` and high-risk-safe `gambler` join only from the verified meal result.
  Companion Feed, genomes, creature identity and lineage are unchanged.
- The exact Field Scout standing before a successful genuinely-first-species capture earns up to
  +2 XP, capped at 486, in the same durable capture receipt. No Scout, miss or repeat earns XP.
  Independent review corrected a pre-existing app assumption that Arc 4 and Arc 5 revisions must
  be equal: each successor now proves its own retained parent +1 and the V1/source projection must
  still agree. This permits legitimate prior Feed/Breed/Rename/Scout changes without weakening
  capture publication. A forged Arc 5 parent fails closed.
- Expedition Records now include a read-only bounded Chronicle & Museum: separate latest-first
  battle and Legacy Journal galleries plus authority-order first-species discovery and Prime
  galleries, each capped at 60. It creates no save field, chronology, reward, mission or share
  card. Arc 9 now has 26 exact live event joins; only `daily` and `decade` remain blocked pending
  their deliberate time/event authority.
- The review's narrow world-identity test gaps are closed directly: privileged mint registration
  refuses malformed/shallow-frozen inputs and public clones, while the exact frozen registry
  object is retained; star-catalog parity pins and freezes the Sol/home configuration anchors.

Independent bounded review is clear for Scout/capture (**96/96**) and for Bioscan/meal/travel
(**30/30**). Final composed-source closure is **364/364** across 39 affected test files;
Guide/Training is **47/47** and the Slice/Glass copy contracts are **95/95**. All three TypeScript
programs, the Glass selftest and diff check pass. Root validation renders all 1,010 V1 species with
zero errors and retains all 50 V1 fingerprints. The v2 draft remains 78 unique ordered bullets,
SHA-256 `198bddf5c969151eba3ad9358cbcd016be0fd7c26b4e8524953892bf40484587`.
The exact local commit is recorded in the session handoff after creation. No full profile/browser
chain, hosted action, version bump, release or deployment is claimed here.
