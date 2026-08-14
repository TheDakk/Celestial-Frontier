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

## ▶▶▶ SESSION HANDOFF — 2026-08-14 · F1B CHARTER HARDENING ACTIVE ◀◀◀

### Cold start

- Verify repository/branch ownership live before work: Codex macOS works only in the folder ending
  `/celestial-frontier-openai-mac` on `openai/mac`; Claude macOS uses `anthropic/mac`; Windows uses
  the matching rows in `PARALLEL_GIT_PROTOCOL.md`.
- Read in order: this handoff · `PROCESS_LAWS.md` · `PARALLEL_GIT_PROTOCOL.md` · `AGENTS.md` or
  `CLAUDE.md` · [`port/V2_PROGRAM_ROADMAP.md`](port/V2_PROGRAM_ROADMAP.md) ·
  `EXPLORATION_SHIPS_LOOT_AND_COMPANIONS.md` · `port/RUBRICS.md` · `port/DECISIONS.md` ·
  `port/v2/README.md` · `port/v2/DEVIATIONS.md` · `port/DEVELOPMENT_PREVIEW.md`.
- Resolve current Git/PR/check/publication status live. Historical handoff/CI IDs are context, not
  an assertion about the current tip. Never copy files manually between agent worktrees.

### Current integration state

- F1a PR #24 merged into `develop` at `a1dabdeb4059292d67d7a89652e92fb317d750c7`.
  The remote workflow fast-forwarded all strictly-behind agent branches; this `openai/mac` worktree
  fetched and pulled normally before F1b. Remote auto-sync never replaces the local fetch/pull check.
- F1a's exact merge passed `develop` test-battery run `31805771775`; mapped publication run
  `31807262793` also passed, and the development origin's version marker binds build
  `develop-a1dabdeb4059` to the full merge SHA. These IDs are evidence history; resolve newer state live.
- The active branch contains only the bounded F1b Charter slice: SCN-1, SCN-2 and SCN-6 plus its
  tests, Guide/release truth and synchronized references. It is not yet pushed or in a PR.

### Active F1b Charter contract

- `bankLandfall` rejects non-integer, non-finite, negative, terminal and out-of-range chapter
  positions without changing `ascProg`; it does not clamp malformed input into an award.
- Canonical Charter arrays, chapters, goal arrays and goal objects are compile-time readonly and
  recursively frozen at runtime. Projected live goals keep only frozen aliases.
- A genuine first landing alone banks new progress. After every successful Land action,
  `reconcileV2Chapters` uses one stable saved reach stage to acknowledge every consecutive canonical
  completion, including a saturated imported record; it stops on incomplete/unpowered data and never
  mints a duplicate landfall, goal, drive, reward or reach tier.
- The full accepted/weekly Charter economy and missing mining/fabrication/bioscan/conquest/breeding
  writers remain unavailable. This batch changes no balance table, world generation, CF1 ingress,
  save schema, production version or release channel.
- Guide and the v2 development bulletin carry the revised player truth. Training is unchanged: the
  current six-step slice has no Charter lesson to update or advertise.

### Candidate evidence so far

- Test-first focused scene run failed **2/18** on the old throwing/mutable/missing-reconciliation
  behavior. With the repair restored, the focused suite passes **18/18** and both TypeScript
  configurations pass.
- The first browser run was deliberately retained red: it found two harness-fixture errors—legacy
  conquered/mined worlds legitimately join exported `land`, and an immediate post-reload action sat
  inside the ordinary 1.8-second toast guard. Narrowing the fixture and waiting made that run green,
  but independent review correctly rejected the quiet-window workaround: a one-shot completion could
  still be swallowed, and an already-open Charters board could remain stale. The app now replaces an
  adjacent ambient notice with one polite aggregate and refills an open board from the new ledger.
- The real-browser 390×844 emulated-touch outcome re-lands already-landed Mercury. A powered saturated
  import advances 0→3 once, preserves exact land/progress in memory and IndexedDB, and survives
  reload; matched unpowered and powered-incomplete controls stay at 0. The outcome also freezes the
  exact reward/reach ledger, replaces an immediately preceding real Share notice, and has permanent
  missing/buried-action, wrong-stage, reward/reach and stale-Guide controls. A separate desktop target
  uses a browser mouse to open the visible Charter rail beside Survey and requires the board to leave
  Chapter 1 after Land; its first two setup runs caught harness ordering/mobile-mode reload errors and were
  retained red before the target was isolated. A valid one-step source mutation failed the exact 0→3
  unit assertion (**1/18**), and restored old bank-gated app wiring failed the named browser-touch,
  notice and persisted chapter outcomes. With every mutation restored, the current dirty candidate
  passes the full static suite (**298 passed /1 skipped**), both TypeScript configurations, the
  unused-art audit, full real-browser smoke with zero console errors, the glass-matrix selftest, and
  all **12** isolated viewport classes. These are local diagnostics, not clean exact-commit
  certification; exact-head evidence remains pending until the intentional commit exists.

### Next actions

1. Inspect the exact diff and retain only current code/docs plus permanent controls.
2. Commit intentionally, obtain clean exact-head evidence, push `openai/mac`, and open one draft PR
   into `develop`. Do not start another F1b slice inside it.
3. Claude reviews that exact PR. After review resolution and terminal-green checks, standing authority
   permits its normal merge and monitoring of the mapped `develop` battery/DEV publication.
4. Continue the remaining F1b slices independently, then close F2 canonical ingress before any
   world-bound ownership, receipt or reward writer.

## Parallel Git handoff — exact five fields

**Current side:** OpenAI/Codex on macOS, `openai/mac`. The isolated F1b Charter candidate is local and
under verification; no hand-copy or cross-worktree edit is permitted.

**GitHub step:** none yet. After exact-head proof, open a draft PR from `openai/mac` into `develop`.

**PR details:**

- Base branch: `develop`
- Source branch: `openai/mac`
- Copy-ready title: `Harden and recover imported v2 Charter progression`
- Copy-ready description: `Implements the bounded F1b Charter slice: fail closed on malformed
  landfall chapter positions, deeply freeze canonical chapter/goal data, and reconcile every
  consecutive already-complete reach-backed imported chapter after a real Land action without
  rebanking, duplicate rewards or fabricated reach. Adds focused readonly/bounds/0→3 controls and a
  real-browser emulated-phone Mercury touch re-land that proves exact IndexedDB/reload behavior,
  exact reward/reach preservation, matched unpowered and powered-incomplete controls, guaranteed
  polite aggregate feedback, and an already-open board refresh. Updates Guide and v2 draft copy plus
  current Charter/progression references, deviations, program status and the live handoff. Explicitly
  excludes other F1b work, F2, save-schema
  changes, balancing/content arcs, production versioning, deployment and develop-to-main release work.`

**Other side:** Anthropic/Claude Code does not need to open yet. Once the draft PR exists, Nick should
open Claude for exact-diff review; Claude must first fetch and normally fast-forward its clean branch.

**Release status:** no release, deployment, version bump, `develop` → `main` merge, or manual site
write is part of this batch.
