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
| P0-5 | Harness outside public bundle | Open dedicated evidence-build contract, not DEV-only gating. Current Slice builds production assets and requires hooks; prove fault implementations absent from distributable assets while product logic/PWA identity remain equivalent. |
| P0-6a | Artlock CI owner | Gap confirmed, open. Artlock is a real catalogue/browser render, not a cheap static check. Assign changed-art/release ownership and provenance before adding cost. Never auto-bless references. |
| P0-6b | Verbatim coverage | Open coverage inventory for unsealed artifacts only; preserve existing exact-source tests and lifter transforms. |
| P0-7 | Guide/ledger literals | Proposed mechanical fixes rejected for reasons above. Retain correct current Guide; source-model completion belongs to real economy work. |
| P1-focus | Records/Atlas/Charters focus | Implemented; executable real-function/jsdom checks pass for semantic identity, disabled/removed fallback and later focus ownership. Native keyboard/scroll/device acceptance remains open. |
| P1-layering | Scene/domain ownership | Open staged move with compatibility re-exports; preserve identities, brands, imports and byte contracts. No blanket architecture rewrite before gameplay. |
| P1-canonical | Canonical serialization copies | Open compatibility fixtures first; loot digest bytes including existing undefined behavior cannot silently change. |
| P1-time | Runner budget factor | Global factor rejected. Measure transport/readiness bottlenecks separately from fixed product/evidence deadlines. |
| P1-helpers | Shared source/server helpers | Open incremental extraction with current source/lock/server cleanup semantics; do not merge distinct trust boundaries merely because helpers share names. |
| P1-lists | Shared key inventories | Open deduplication where ownership is genuinely the same. Keep independently authored expectations where they detect a missing producer field. |
| P1-windows | npm.cmd / browser discovery / docs | Three direct npm callers now share the safe invocation owner; four platform/mock tests pass. Windows Chrome resolver change remains deferred because resolver bytes are measurement-authority inputs; actual Windows verification remains open. |
| P1-audio | Voice watchdog | Open bounded injected-clock lifetime design, preserving normal onended cleanup and suspension semantics. |
| P1-tests | Layering/targeted domain gaps | Open naming/worldconfig/mint coverage assessment; prioritize real forgery boundaries, no duplicate blanket test suite. |
| P2-phone | Allocation/navigation/cache/boot | Open measured performance work. Review every save consumer before replacing immediate commits with debounce; preserve travel durability. |
| P2-main | Extract main.ts | Open incremental extraction along existing owners. Generic action coordinator cannot erase domain-specific CAS, publication and recovery guarantees. |
| P2-tools | Instrument diet | Open duplication/ownership audit; keep historical failure replay, determinism/save safety/art locks. No arbitrary line target or deletion based only on not being in CI. |
| P2-memory | Compendium runtime cost | Open Linux timing analysis and coverage decision; no unmeasured calibration/threshold relaxation. |
| P2-docs | Documentation diet | Start with live status/disposition. Archive chronological logs verbatim; refresh reference laws in place. Keep OpenAI/Anthropic entry points with one shared protocol. Do not archive current rules or erase history. |
| P3 | Hygiene findings | Open bounded confirmation: heartbeat branch, wrappers, dependency manifests, painter helpers, case timeouts and focus-ring scheduling. No removal until all callers and source seals are mapped. |

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
fingerprints without changing fixed numeric limits. No code for this next boundary has landed.

The faster-develop coverage decision is requested explicitly: browser-free + two phone canaries
versus retaining the entire chain on every integration. Deferring the long chain to milestone/
release is a coverage-policy change, not a free optimization; it is not silently enabled here.
