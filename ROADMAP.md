# Celestial Frontier — Roadmap & Session Handoff

## 📌 PINNED — STANDING PROCEDURE (Nick, 2026-07-20): UPDATE THE MARKDOWN DOCS AS WE GO.

The per-system docs at repo root (WORLD_GENERATION · ART_DIRECTION · BIOME_ATLAS ·
SPECIES_AND_GENOME · RARITY_AND_GRADES · RARITY_UNIVERSAL · CAPTURE_AND_BIOSPHERE ·
COMBAT_AND_CONQUEST · PROGRESSION · ECONOMY_LOOT_CRAFTING · QUESTS_AND_CHAPTERS ·
BREEDING_AND_SHARING · DETERMINISM · SAVE_SYSTEM · UI_PRESENTATION · AUDIO · AUDIO_LICENSES ·
EXPLORATION_SHIPS_LOOT_AND_COMPANIONS) are current system references. Update the affected reference
and `celestial-frontier-codebase-reference.md` in the same batch as its code; source wins when they
disagree. `PROCESS_LAWS.md` is the standing reference for earned implementation/testing laws.

## 📌 PINNED — ROADMAP HYGIENE

Keep this file as the lean live handoff: current state, the active batch, next work and process.
Completed batch logs and superseded handoffs live in `ROADMAP_ARCHIVE.md`, newest first, with
nothing deleted. At the end of an Arc, or when this file approaches 400 lines, move aged blocks to
the archive verbatim and refresh this handoff in place.

## ▶▶▶ SESSION HANDOFF — 2026-08-15 · F1B UI-P1 PR #26 CI SOCKET-PHASE REPAIR ◀◀◀

### Cold start

- Verify repository/branch ownership live before work: Codex macOS works only in the folder ending
  `/celestial-frontier-openai-mac` on `openai/mac`; Claude macOS uses `anthropic/mac`; Windows uses
  the matching rows in `PARALLEL_GIT_PROTOCOL.md`.
- Read in order: this handoff · `PROCESS_LAWS.md` · `PARALLEL_GIT_PROTOCOL.md` · `AGENTS.md` or
  `CLAUDE.md` · [`port/V2_PROGRAM_ROADMAP.md`](port/V2_PROGRAM_ROADMAP.md) ·
  `EXPLORATION_SHIPS_LOOT_AND_COMPANIONS.md` · `port/RUBRICS.md` · `port/DECISIONS.md` ·
  `port/v2/README.md` · `port/v2/DEVIATIONS.md` · `port/DEVELOPMENT_PREVIEW.md`.
- Resolve current Git/PR/check/publication status live. Historical handoff/CI IDs are evidence, not
  an assertion about the current tip. Never copy files manually between agent worktrees.

### Current integration state

- F1a PR #24 remains integrated at `a1dabdeb4059292d67d7a89652e92fb317d750c7`.
- F1b Charter PR [#25](https://github.com/TheDakk/Celestial-Frontier/pull/25) completed Claude review
  and passed final-head test-battery run
  [`31858641826`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31858641826) at
  `a0ee7666f5fb1edf22a0035acfeb7df1beebefe9`. It merged normally into `develop` at
  `bd49beb0693b45fdd57d4acad746ade79843a91e`.
- That exact merge passed all jobs and the final join in `develop` test-battery run
  [`31867609188`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31867609188).
  Mapped publication run
  [`31868417305`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31868417305) passed
  development and skipped production; the public marker serves build `develop-bd49beb0693b` with
  the full merge SHA. This is DEV evidence only, never production/release authority.
- Remote branch synchronization fast-forwarded the agent branches. This Codex worktree fetched and
  normally fast-forwarded `openai/mac` to the same merge before UI-P1 began; remote automation never
  substitutes for the local clean/fetch/branch check.
- Draft PR [#26](https://github.com/TheDakk/Celestial-Frontier/pull/26) carries UI-P1 from
  `openai/mac` into `develop`. Exact head `ea972a8f43fbe4a3382d1e1c00a2bd46f1606bbc` is permanently
  bound to red test-battery run
  [`31870103561`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31870103561): v2-smoke
  stopped in the shared browser launcher selftest before gameplay, so it is not a certifying head and
  must not be retried unchanged.

### Active F1b UI-P1 contract

- The ported document `pointerdown` manager protected `#raillft` through a literal exception but
  omitted structurally identical `#railrgt`. A real-browser mouse press in its rendered 8px flex
  gap hit the rail root and closed an unrelated active panel.
- Registered panel roots and opener buttons keep element-identity ownership. Stable non-dismiss
  chrome—the top bar, dock, Survey and both rails—now declares one generic
  `data-panel-boundary` marker at its root; the handler has no second chrome-ID list.
- A browser-mouse press in either rail gap preserves the active panel, `aria-expanded` and `aria-hidden`.
  Removing either rail marker independently recreates dismissal. Temporarily assigning the marker
  to the exact hit-tested canvas point prevents dismissal; restoring genuine unmarked sky closes.
- Both delegated document handlers reject non-`Element` targets before `closest`, restoring the
  legacy runtime boundary instead of trusting a TypeScript assertion.
- Search deliberately retains its established outside-dismiss/focus behavior. Modal lifecycle,
  Training choreography, panel coexistence/layering, Escape ownership, UI-P2/P3/P4, saves, worldgen,
  CF1, balance, art/audio, production version and release/deployment are excluded.
- No Guide topic or Training lesson changes: neither teaches rail spacing. The existing v2 draft
  **ONE SURFACE, ONE CLOSE** outcome now states the usable rail-gap/empty-sky behavior; no bulletin
  item or shipped-version identity was added.

### Evidence

- Test first: the old build failed the complete real-browser smoke on missing boundary inventory,
  the exact right-rail root-gap close, both rail-removal discriminators, two non-Element
  `closest` exceptions, and the ignored owned-canvas control. The measured right target was
  `#railrgt`, gap 8px, pointer type mouse; Compendium changed from open/`aria-hidden=false` to
  closed/`aria-hidden=true`. The old literal left exception remained visible to its control.
- With the bounded repair restored, `npm test` reports **298 passed / 1 skipped**; both root and app
  TypeScript programs pass; `git diff --check` and tool syntax pass; the complete one-attempt
  real-browser smoke passes the original journey plus both browser-mouse rail gaps, independent marker
  removal, owned/unowned canvas directions, non-Element targets and zero console errors.
- The synchronized static release semantics, unused-art audit, glass-matrix selftest and all 12
  isolated viewport classes pass. Three independent read-only audits are clean after their findings
  were resolved. Final PR-head CI and Claude exact-diff review remain required; local evidence does
  not certify or integrate the candidate.
- The red PR run exposed inherited instrument coupling, not a UI defect. The first live-provenance
  browser found a valid `DevToolsActivePort` inside its 30-second startup allowance, constructed the
  socket, then incorrectly reused the 1,500-millisecond command ceiling for WebSocket opening and
  expired before `Browser.getVersion`. Static, root and full 12-viewport glass jobs passed; gameplay
  smoke never ran, persona/preview was skipped, and the final join was red only as dependency
  cascade. No smoke artifact exists, which is honest phase evidence rather than another finding.
- Test first, a deterministic delayed socket failed because its 1-second socket budget was ignored
  in favor of a 100-millisecond command ceiling. The bounded repair makes startup one monotonic,
  absolute spawn → endpoint → socket-open deadline; a validated socket cap starts before construction
  and can use only its remaining time. Cold and warm selftest legs own 15/10-second socket caps
  inside unchanged 30/10-second startup budgets; commands stay at 1,500 milliseconds and shutdown
  at 2 seconds. Delayed-open, explicit-cap,
  remaining-startup clamp, pre-construction expiry, constructor-overrun plus CONNECTING-error guard,
  just-late-open, never-open and invalid-cap controls now pass locally.
  Portable rejection cases prove failure cleanup; both real-browser legs assert profile cleanup in
  `finally` whether opening rejects or succeeds. The exact failed three-command phase also passes.
  Preview's 16-second delayed-endpoint control, the full v2 smoke, glass selftest/all 12 viewports,
  and the shared root layout selftest/all 787 outcomes across 10 viewports also pass.

### Next actions

1. Commit and push the independently audited bounded instrument repair to draft PR #26. Do not retry
   run `31870103561`.
2. Require fresh exact-head CI; only then request Claude review of
   the new exact head. Resolve only actionable findings on the same branch.
3. Merge only a reviewed, terminal-green exact head under Nick's standing authority; monitor the
   resulting `develop` battery and mapped DEV publication before the next PR.
4. Continue remaining F1b as separate WorldGen declaration/runtime, audio pre-init and epoch-contract
   PRs, then F2 canonical ingress before any world-bound ownership/reward/receipt writer.

## Parallel Git handoff — exact five fields

**Current side:** OpenAI/Codex on macOS, `openai/mac`, based on clean merge
`bd49beb0693b45fdd57d4acad746ade79843a91e`. Bounded UI-P1 implementation commit
`d6ccb9b810fc644437ed205e4f6dbed7974cdba1` is pushed with synchronized docs/tests. The current
working tree additionally contains only the bounded browser socket-phase instrument repair and its
current references; resolve its eventual commit and checks live.

**GitHub step:** draft PR [#26](https://github.com/TheDakk/Celestial-Frontier/pull/26) targets
`develop` from `openai/mac`. Its old exact head and run `31870103561` remain red history. Push a new
repair head, then require Claude review and matching terminal-green CI. Do not reuse or edit merged
PR #25 and do not copy files into an Anthropic worktree.

**PR details:**

- Base branch: `develop`
- Source branch: `openai/mac`
- Copy-ready title: `F1b: declare panel tap boundaries and restore rail symmetry`
- Copy-ready description: `Fixes the bounded UI-P1 outside-dismiss defect by replacing the
  asymmetric chrome-ID exception list with declarative root ownership for the top bar, dock, Survey
  and both desktop rails. Real-CDP smoke uses browser-mouse input on each rendered 8px rail gap,
  preserves the active panel and ARIA state, removes each marker to recreate dismissal,
  distinguishes temporarily owned from genuine empty canvas, preserves deliberate Search dismissal,
  and proves both delegated document listeners fail closed on non-Element targets. Updates the v2
  draft outcome and current
  UI/process/program/reference/handoff documents. Also separates browser WebSocket-open timing from
  post-open command timing under one monotonic absolute startup deadline, with independent cap,
  remaining-budget, constructor, just-late, never-open and cleanup controls and no retry or generic
  timeout expansion. Explicitly excludes Search policy changes,
  modal/Training/coexistence/Escape refactors, UI-P2/P3/P4, saves, worldgen/CF1, balance/content,
  production versioning, deployment and develop-to-main release work.`

**Other side:** do not start or finalize Claude review on the known-red head. After the repaired PR
head is pushed, Nick should open Anthropic/Claude Code for exact-diff review of PR #26. Claude first
fetches and normally fast-forwards its clean
`anthropic/mac` branch and reviews remotely without editing this worktree.

**Release status:** no release, manual deployment, production version bump, `develop` → `main`
merge, or direct site write is part of this batch.
