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

## ▶▶▶ SESSION HANDOFF — 2026-08-15 · F1B EPOCH PERSISTENCE CONTRACT ◀◀◀

### Cold start

- Verify repository/branch ownership live before work: Codex macOS works only in the folder ending
  `/celestial-frontier-openai-mac` on `openai/mac`; Claude macOS uses `anthropic/mac`; Windows
  uses the matching rows in `PARALLEL_GIT_PROTOCOL.md`.
- Read in order: this handoff · `PROCESS_LAWS.md` · `PARALLEL_GIT_PROTOCOL.md` · `AGENTS.md` or
  `CLAUDE.md` · `PROGRESSION.md` · `SAVE_SYSTEM.md` ·
  [`port/V2_PROGRAM_ROADMAP.md`](port/V2_PROGRAM_ROADMAP.md) ·
  `EXPLORATION_SHIPS_LOOT_AND_COMPANIONS.md` · `port/RUBRICS.md` · `port/DECISIONS.md` ·
  `port/v2/README.md` · `port/v2/DEVIATIONS.md` · `port/DEVELOPMENT_PREVIEW.md`.
- Resolve Git, PR, checks and publication live. Historical run IDs below are evidence, not an
  assertion about a newer tip. Never copy files manually between agent worktrees.

### Integrated foundation through audio

- F1a remains integrated at `a1dabdeb4059292d67d7a89652e92fb317d750c7`; F1b Charter remains
  integrated at `bd49beb0693b45fdd57d4acad746ade79843a91e`; UI-P1 remains integrated at
  `b5e5d0a3b4bb4057fa6d251816454b370e8b2624`; WorldGen remains integrated at
  `a50e593e2135f55ae8c37e6ece1f10c52701346b`.
- Audio PR [#28](https://github.com/TheDakk/Celestial-Frontier/pull/28) reached exact final head
  `f2f6b5b4c42eaace78ad45e3ed2ee9e345b4c8ba`. Approved-branch-flow run
  [`31897329792`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31897329792) and every
  job/final join in test-battery run
  [`31897329813`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31897329813) passed.
  GitHub recorded no review or PR comments, so this handoff does not claim Claude reviewed it.
  PR #28 merged normally into `develop` at
  `44925f62abdfcdf9c17e512dd49a57a183e217ec`.
- The merge passed every job and final join in exact-`develop` test-battery run
  [`31901215076`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31901215076). Mapped
  publication run [`31902113008`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31902113008)
  passed development and correctly skipped production. The public DEV manifest serves build
  `develop-44925f62abdf` from that full merge SHA.
- Remote automation fast-forwarded agent branches. This worktree fetched and verified clean
  `openai/mac`, `origin/openai/mac`, and `origin/develop` at that exact merge before epoch work
  began. Automation never substitutes for the required local folder/branch/clean/fetch check.

### Active F1b epoch contract

- DOM-1 is confirmed as a HIGH future-wiring hazard, not a reproduced current-player save defect.
  `EpochClock.base()` is the immutable sanitized construction origin, but its public JSDoc told
  callers to persist it. Following that instruction would freeze all epoch progress made during the
  session.
- The current app already does the right thing: boot constructs once from imported `EPOCH_BASE`
  and a fresh monotonic elapsed segment, each ordinary save snapshots `epochClock.current()`, the
  exporter writes that compatibility field as `epoch`, and the next boot constructs a new clock
  from the serialized snapshot. Saving does not rebase the live clock.
- The bounded repair changes no clock math, balance, save schema, bytes, importer/exporter behavior,
  or player outcome. It corrects the package contract, persistence layering comments, ecology
  declaration, no-DOM diagnostic wording, and app comments; a focused two-session unit contract
  distinguishes immutable `base()` from advancing `current()`. The same reference refresh also
  corrects two stale legacy descriptions that still called retired `HARVEST_CD` the live harvest
  gate; runtime readiness has used `HARVEST_EPOCHS` against `COSMIC_EPOCH` since v1.8.8.
- The existing browser check merely required a numeric epoch and would remain green if the app
  changed `current()` to `base()`. The smoke now advances the app-owned monotonic source by one
  exact 1,200-second epoch, calls the real `persistView()`, reads the real IndexedDB primary,
  reloads the same origin with a fresh document token, and requires that exact snapshot to survive.
  Stored-base and stale-reload substitutions are independent controls.
- Current elapsed time is page-residence monotonic time, not a proved visible-and-answerable
  active-play policy. F3 owns the CAS/revision and cross-tab lease substrate. F4 owns hidden-tab/
  visibility semantics, automatic integer-edge persistence/invalidation, live global-read timing,
  SessionRNG wiring, and the separate persisted `activePlayMs` clock/accrual policy for missions,
  Recovery, and Auto-Extractor readiness.
- No Guide topic, Training lesson, v2 draft release bullet, version, production release, manual
  deployment, world generation, navigation, reward, or balance change belongs to this batch.

### Evidence status

- Focused `@cf/domain-progression` passes **10/10**, including the two-session persistence recipe;
  the complete v2 suite passes **26 files /312 passed /1 skipped**; both root and app TypeScript
  programs, `artunused`, syntax, and `git diff --check` pass.
- The complete one-attempt real-browser smoke passes after the epoch gate advances live `0 → 1`,
  stores `1` in the raw primary, reloads `1`, discards the page-local clock shadow, and reports zero
  console errors. Deliberately changing the one production write from `current()` back to `base()`
  turns the same run red with the exact scoped result `before:0, after:1, stored:0, reloaded:0`.
  Restoring `current()` returns the complete run to green; there was no retry or timeout change.
- Three independent read-only source, harness/control, and documentation/handoff audits are clean
  after their findings were resolved. The archived audio payload remains byte-verbatim. Committed
  exact-head CI, review/waiver, integration, the resulting `develop` battery, and mapped DEV
  publication are still pending.

### Next actions

1. Commit and push the bounded candidate and open a draft PR from `openai/mac` into `develop`.
2. Require fresh exact-head CI. Merge only a reviewed-or-explicitly-waived terminal-green exact
   head, monitor `develop` and mapped DEV publication, then begin F2 canonical ingress.
3. No world-bound ownership/reward/receipt writer starts before F2.

## Parallel Git handoff — exact five fields

**Current side:** OpenAI/Codex on macOS, `openai/mac`, based on synchronized `develop` merge
`44925f62abdfcdf9c17e512dd49a57a183e217ec`. The worktree contains only the bounded epoch
contract/test/browser-evidence candidate, synchronized current references, the byte-verbatim
archived audio handoff, and this live program/handoff update. Resolve later commit/PR/check state
live rather than inferring it from this pre-publication snapshot.

**GitHub step:** after the complete local evidence is green, commit and push `openai/mac`, then
open a new **draft** PR targeting `develop`. Do not reuse PR #28, push to another agent branch,
touch `main`, publish manually, or claim production/release authority.

**PR details:**

- Base branch: `develop`
- Source branch: `openai/mac`
- Copy-ready title: `F1b: correct the epoch persistence contract`
- Copy-ready description: `Corrects the misleading EpochClock contract that told consumers to
  persist the immutable construction base even though the current application correctly snapshots
  the advancing current() value. Documents the exact boot/save/reload recipe and the separate future
  activePlayMs authority, adds a two-session package contract, and extends real-browser smoke through
  current() → persistView() → exported IndexedDB bytes → fresh reload with base/stale-reload controls.
  Also corrects the adjacent legacy reference that still described retired HARVEST_CD as the live
  harvest gate. Runtime clock math, balance, save schema/bytes, world generation, Guide/Training/release copy,
  versioning, production and deployment remain unchanged. F3 CAS/tab-lease and F4 visibility,
  automatic epoch-edge persistence, live clock publication and SessionRNG work remain open.
  Verification passes 10/10 focused progression tests, 26 files with 312 passed/1 skipped, both
  TypeScript programs, artunused, diff hygiene, and the complete browser journey. Restoring the old
  base() write turns the browser gate red with live 1 versus stored/reloaded 0; restoring current()
  returns it green. Three independent final source, harness/control, and documentation audits are clean.`

**Other side:** Claude need not act while the candidate is local. After the exact PR head is pushed
and terminal green, Claude may review the remote diff from a clean synchronized `anthropic/mac`;
Nick may explicitly waive that exact-head review. Claude must not edit this worktree.

**Release status:** no release, manual deployment, production version bump, `develop` → `main`
merge, or direct site write is part of this batch.
