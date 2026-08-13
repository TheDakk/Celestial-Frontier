# Celestial Frontier — Roadmap & Session Handoff

## 📌 PINNED — STANDING PROCEDURE (Nick, 2026-07-20): UPDATE THE MARKDOWN DOCS AS WE GO.
## The per-system docs at repo root (WORLD_GENERATION · ART_DIRECTION · BIOME_ATLAS ·
## SPECIES_AND_GENOME · RARITY_AND_GRADES · RARITY_UNIVERSAL · CAPTURE_AND_BIOSPHERE · COMBAT_AND_CONQUEST ·
## PROGRESSION · ECONOMY_LOOT_CRAFTING · QUESTS_AND_CHAPTERS · BREEDING_AND_SHARING ·
## DETERMINISM · SAVE_SYSTEM · UI_PRESENTATION · AUDIO · AUDIO_LICENSES · EXPLORATION_SHIPS_LOOT_AND_COMPANIONS) are
## the SOURCE OF TRUTH we pull from for a full-system review/edit later. RULE: whenever we change a
## system, update its doc IN THE SAME BATCH (and bump its "matches code as of" marker) — the same
## way we run validate and update this roadmap. A change isn't done until its markdown reflects it.
## Also keep celestial-frontier-codebase-reference.md (code map) in sync when functions move/appear.
## ★ PROCESS_LAWS.md (extracted from this file 2026-07-30) is the other standing reference —
## READ IT BEFORE TOUCHING UI OR TESTS. Same discipline: refreshed in place, never archived.

## 📌 PINNED — ROADMAP HYGIENE (Nick, 2026-07-21): KEEP THIS FILE LEAN. This doc holds ONLY the
## live SESSION HANDOFF (state / what's done / NEXT backlog / process). Completed batch logs and
## superseded handoff blocks live in `ROADMAP_ARCHIVE.md` (history + traceability, nothing deleted).
## RULE, run at the END OF EACH ARC (or whenever this file grows past ~400 lines): move every batch
## block older than the current one to the TOP of the archive's batch section, verbatim, then refresh
## the SESSION HANDOFF here so WHAT'S DONE / NEXT reflect reality. Rewrite the handoff in place — the
## roadmap stays a one-screen read. History is one file away, git-diffable.
## ▶▶▶ SESSION HANDOFF — 2026-08-13 · ARC 0 STABILIZATION REPAIR IN WORKTREE; EXACT-HEAD CI + DEV PUBLICATION PENDING ◀◀◀

### Cold start

- Workspace: `/Users/nick/Projects/celestial-frontier-openai-mac`.
- Owner/branch: OpenAI/Codex on `openai/mac`; never commit directly to `develop` or `main`.
- Integration base and current local HEAD before this stabilization batch:
  `69985e7b337ba070997c66dc793383ff30acd128`. It is also current `origin/develop`.
  Resolve HEAD, upstream, worktree, PR/check and publication state live before any Git action;
  this handoff records an in-progress working copy, not an exact pushed repair head.
- Read next: `PROCESS_LAWS.md` · `PARALLEL_GIT_PROTOCOL.md` ·
  `celestial-frontier-codebase-reference.md` · `port/DEVELOPMENT_PREVIEW.md` ·
  `port/v2/README.md` · `port/v2/DEVIATIONS.md` · `port/HANDOFF_NEXT_SESSION.md`.

### Why stabilization interrupted Arc 1

Documentation follow-up PR #19 merged into `develop` at
`69985e7b337ba070997c66dc793383ff30acd128`. Its push battery, run `31726083132`, was
**success**, but mapped publisher run `31728733734` did not publish that exact commit:

| Publisher job | Exact terminal evidence |
| --- | --- |
| Development | Job `94543538353` — **failed** while starting exact Chrome at the 15-second CDP startup bound, after the approved candidate passed and produced content SHA-256 `d7d6550b84882b20f826c1a79abe8a756305799a28fff4f4424e1baa561ded0b`. |
| Production | Job `94543539013` — **skipped**. |

No candidate deploy step ran. The noindex DEV origin therefore safely remains the prior Arc 0
publication: **v2.0 development** build `develop-c5aadc8a0842`, source
`c5aadc8a08424ddfc919bc2e4489b79e0f25b076`, content SHA-256
`8bd6c26c86ffac287797fe4112d86052b71437e8155770a72907a6bb06dc91ff`.
Production, `main`, release identity and production Pages were untouched.

### Repair in the current worktree

- The generic owned browser launcher retains its 15-second startup contract. Only the exact
  development-preview verification caller receives bounded 30-second startup and command limits,
  matching the observed Linux CI cold-start phase without adding a blind retry or weakening later
  browser/product outcome checks.
- The preview selftest captures the exact caller options on every platform. Its POSIX browser
  control starts real Chromium immediately but withholds the outer CDP endpoint for 16 seconds:
  the generic 15-second caller must reject, while the exact 30-second preview caller must start,
  answer `Browser.getVersion`, close and clean up. This gives Chromium the full positive budget
  instead of spending 16 seconds before process start.
- The three supplied Edge `.ips` reports share one non-product signature: Node-launched Edge under
  `com.openai.codex`/ChatGPT aborts on the main thread in
  `TransformProcessType` → `_RegisterApplication` within 100 ms. macOS logs show Codex Seatbelt
  denial at LaunchServices/WindowServer registration. This occurs before CDP, page creation, GPU
  allocation or game code and shows no memory-pressure signature.
- The shared resolver/owned launcher and the v2 spike launch surfaces now reject macOS Codex
  Seatbelt before browser spawn with an actionable elevated-execution instruction. Preflight's
  executable-negative control removes that advisory environment so it still proves a non-browser
  executable was actually launched and rejected. No new Edge `.ips` appeared after the permitted
  host-browser runs checked in this batch.

### Current local evidence (working-copy scope)

| Check | Result |
| --- | --- |
| Full v2 tests | **PASS** — 25 files, 283 passed, 1 skipped. |
| Root + app typecheck | **PASS**. |
| Arc 0 focused review | **PASS** — 42/42; no Arc 0 regression found. |
| Real `npm run smoke` | **PASS** on the current working copy. |
| Combined `npm run preview:selftest` | **PASS** with captured-options and delayed-endpoint controls. |
| `preflight:selftest` | **PASS**. |
| Permitted-host preflight | **PASS**, with only the expected Edge 151 versus pinned Edge 150 warning. |
| Permitted-host `browsercdp` selftest | **PASS**, including proof that the Seatbelt marker executable remained untouched. |
| Syntax and scoped diff checks | **PASS**. |

This is not final exact-head CI or publication evidence. Freeze the repair in a commit, push it,
run the required PR battery once, and retain the first result. The PR URL/head, PR jobs,
`develop` merge/push jobs, candidate hash and mapped DEV publication are all **pending**.

### Next order

1. Finish the stabilization PR and require its exact clean head to be mergeable and terminal-green.
   Nick's standing 2026-08-13 proceed authority then permits the normal merge into `develop` and
   monitoring of the exact push battery and mapped DEV publication without another generic prompt.
   It does not authorize marking a draft Ready, bypassing red/ambiguous evidence, `develop` →
   `main`, a release/version decision, manual Pages write or production deployment.
2. Confirm the mapped DEV origin advances from the retained `c5aadc` build to the exact merged
   repair source and candidate hash; a failed publication must leave the retained build intact.
3. Begin Arc 1 from the resulting clean, live-verified agent branch: Compendium virtualization and
   resource ownership, then pure reach-shared `ShipVisualState`.
4. Keep `D-CF1-2` partial: extend source-derived identity proof before adding any world-bound
   ownership/reward/receipt writer. Keep later economy, engineering, capture, companions, combat,
   audio, legacy and human-play work behind their own action/outcome proof.

## Parallel Git handoff — exact five fields

**Current side:** OpenAI/Codex on macOS, branch `openai/mac`; the stabilization repair is an
uncommitted working copy based on `develop` commit
`69985e7b337ba070997c66dc793383ff30acd128`. Final repair commit, push, PR, CI, merge and mapped
publication evidence are pending.

**GitHub step:** after the scoped diff and required local evidence are frozen, push `openai/mac`
and create/update its draft PR into `develop`. Do not mark a draft Ready under standing authority.
Once the exact PR head is otherwise clean, mergeable and terminal-green, the standing proceed
authority permits its normal eligible merge and monitoring without another generic confirmation.

**PR details:**

- Base branch: `develop`
- Source branch: `openai/mac`
- Copy-ready title: `Stabilize development browser launch and publication`
- Copy-ready description:

  > Repairs the Arc 0 development-publication infrastructure after the exact Linux Chrome process
  > exceeded the prior 15-second CDP startup bound. The generic launcher keeps that bound; only the
  > exact development-preview caller receives bounded 30-second startup/command limits, backed by
  > captured-options and delayed-endpoint controls proving the generic caller rejects while the
  > preview caller starts, answers and cleans up. It also prevents macOS Codex Seatbelt browser
  > launches before spawn across the shared launcher and spike tools, so Edge cannot reach the
  > pre-CDP LaunchServices SIGABRT seen in the three supplied crash reports, and hardens preflight's
  > executable negative control. Verification: full v2 tests (25 files, 283 passed, 1 skipped),
  > root/app typecheck, Arc 0 focused 42/42, real browser smoke, combined preview selftest,
  > preflight selftest and permitted-host preflight, owned-launcher selftest including an untouched
  > Seatbelt marker, syntax checks and scoped diff checks all pass. After merge, both agent
  > environments can synchronize from the repaired `develop`; final exact-head CI and mapped DEV
  > publication remain required. This PR includes no `develop` → `main` merge, production release,
  > version bump, manual Pages write or production deployment.

**Other side:** Anthropic/Claude Code on Windows does not need to be opened now and does not yet
have this unmerged repair. It may continue unrelated work, but must not expect these bytes or copy
files manually. After the PR merges, at its next coding batch and only from a clean worktree, fetch
`origin`, inspect state, then merge current `origin/develop` into `anthropic/windows`.

**Release status:** `develop` is still `69985e7b337ba070997c66dc793383ff30acd128`; the DEV site
still serves the retained `c5aadc` build because the later mapped publisher failed before deploy.
`main` and production are untouched. No production release, deployment or version bump occurred.
