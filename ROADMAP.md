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

## ▶▶▶ SESSION HANDOFF — 2026-08-15 · F1B WORLDGEN TRUTHFUL CONTRACT ◀◀◀

### Cold start

- Verify repository/branch ownership live before work: Codex macOS works only in the folder ending
  `/celestial-frontier-openai-mac` on `openai/mac`; Claude macOS uses `anthropic/mac`; Windows uses
  the matching rows in `PARALLEL_GIT_PROTOCOL.md`.
- Read in order: this handoff · `PROCESS_LAWS.md` · `PARALLEL_GIT_PROTOCOL.md` · `AGENTS.md` or
  `CLAUDE.md` · [`port/V2_PROGRAM_ROADMAP.md`](port/V2_PROGRAM_ROADMAP.md) ·
  `EXPLORATION_SHIPS_LOOT_AND_COMPANIONS.md` · `port/RUBRICS.md` · `port/DECISIONS.md` ·
  `port/v2/README.md` · `port/v2/DEVIATIONS.md` · `port/DEVELOPMENT_PREVIEW.md`.
- Resolve Git, PR, checks and publication live. Historical run IDs below are evidence, not an
  assertion about a newer tip. Never copy files manually between agent worktrees.

### Integrated foundation

- F1a remains integrated at `a1dabdeb4059292d67d7a89652e92fb317d750c7`; F1b Charter remains
  integrated at `bd49beb0693b45fdd57d4acad746ade79843a91e`.
- UI-P1 PR [#26](https://github.com/TheDakk/Celestial-Frontier/pull/26) reached exact head
  `c1bfc3b7674f5113dd7c9a0c6063fc99737ea1ba` and passed terminal test-battery run
  [`31872279328`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31872279328). It
  merged at `b5e5d0a3b4bb4057fa6d251816454b370e8b2624`. GitHub records no review or PR comments,
  so this handoff does not claim Claude reviewed that integration.
- The exact merge passed every job and final join in `develop` test-battery run
  [`31884952674`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31884952674). Mapped
  publication run [`31885531363`](https://github.com/TheDakk/Celestial-Frontier/actions/runs/31885531363)
  passed development and skipped production; the public manifest serves build
  `develop-b5e5d0a3b4bb` with the full merge SHA.
- Remote automation fast-forwarded agent branches. This worktree fetched and normally
  fast-forwarded clean `openai/mac` to the exact merge before this batch; automation never
  substitutes for the required local folder/branch/clean/fetch check.

### Active F1b WorldGen contract

- DOM-2 was an API-description defect, not a reproduced current gameplay bug: the live caller
  already passes `epochClock.current()`, but the handwritten declaration called the argument `n`
  and returned `unknown`. It now declares `supernovaSites(galaxySeed, epoch): SupernovaSite[]`,
  where `epoch` is the deterministic cosmic-time key and the exact remnant/birth result is typed.
  A plain `number` still cannot nominally reject a count; stronger epoch ownership remains F4.
- DOM-3 is closed only as the sweep-approved facade warning. Importing WorldGen is safe, while a
  first uncached ordinary galaxy/merger/dwarf generation path still reads free `GAL_SPRITES`.
  Empty, special-only and cached paths may not read it. The app installs the descriptors capture
  hook before generation. No eager wrapper, dependency cycle, auto-install or standalone-safety
  claim is introduced.
- DOM-11 is split by owner. This batch types the required own numeric
  `galaxiesInCell(...).web` metadata and removes the app's local `.web` cast. The unrelated
  `_sanitizeSavedGenome` in-place mutation remains open under strays/import persistence work.
- The byte-verbatim `worldgen.verbatim.js`, generator salts, generated values, cache keys/order,
  rendering, navigation, saves, balance, CF1/F2 and clock wiring are unchanged. No Guide topic,
  Training lesson, draft release bullet, version identity, production release or deployment changes.

### Test-first evidence

- Before the declaration repair, the focused WorldGen suite failed the exact semantic sentinel:
  `supernovaSites(seed, n): unknown` did not satisfy the epoch-keyed exact-result contract.
- Permanent controls now prove: empty/cached cells retain own finite `[0,1]` `web`; array spread
  drops it and fails; `NaN` fails; a home-only cell succeeds without the hook; exact ordinary cell
  `(-6,4)` fails with `ReferenceError: GAL_SPRITES is not defined`; the official 16-slot hook then
  yields four galaxies with sprite indices `[6,14,9,2]` and the same deterministic web density.
- Supernova controls preserve the exact epoch-3 baseline, prove same-key cache identity, epoch 3 versus 4
  change, epoch 99 still returns only 1–3 sites, exact remnant/birth shapes, and an invalid remnant
  fails the validator.
- Deliberate defect injections are restored: renaming `epoch` to `n` failed the declaration
  sentinel; returning plain `Gal[]` failed the real `.web` consumer typecheck; restoring
  `unknown` failed the supernova consumer typecheck.
- Current local evidence: focused WorldGen/Descriptors/Scene/Address suites pass 55 tests /1 skip;
  the full v2 suite passes **299 tests /1 skip**; root and app TypeScript programs, `artunused`,
  and `git diff --check` pass. The complete one-attempt real-browser slice smoke passes the full
  Guide/Training/settings/travel/survey/land/save/reload/phone journey with zero console errors.
  Three independent read-only source, test and documentation audits are clean after every
  actionable instrument finding was resolved. Bounded commit
  `29601e478e99b2a114720e23b696e8fb7d79d33c` contains that exact reviewed candidate. Remote
  exact-head CI and independent Claude exact-diff review remain pending and must be recorded before
  integration.

### Next actions

1. Push bounded commit `29601e478e99b2a114720e23b696e8fb7d79d33c` plus this handoff update on
   `openai/mac`; open a draft PR into `develop`.
2. Require exact-head CI and Claude exact-diff review. Resolve only actionable findings on the
   same branch; merge only the reviewed terminal-green exact head under Nick's standing authority.
3. Monitor the resulting `develop` battery and mapped DEV publication. Then continue F1b as
   separate audio pre-init and epoch-contract PRs, followed by F2 canonical ingress before any
   world-bound ownership/reward/receipt writer.

## Parallel Git handoff — exact five fields

**Current side:** OpenAI/Codex on macOS, `openai/mac`, based on clean merged `develop` tip
`b5e5d0a3b4bb4057fa6d251816454b370e8b2624`. Reviewed WorldGen implementation/reference commit
`29601e478e99b2a114720e23b696e8fb7d79d33c` is locally committed with green local gates; this
handoff-only exact-status update follows it.

**GitHub step:** push `openai/mac`, then create a draft PR targeting `develop`. Require matching
terminal-green exact-head CI and Claude review. Do not append this work to merged PR #26 and do not
copy files into an Anthropic worktree.

**PR details:**

- Base branch: `develop`
- Source branch: `openai/mac`
- Copy-ready title: `F1b: make WorldGen contracts truthful`
- Copy-ready description: `Corrects the bounded WorldGen handwritten contract without changing
  the byte-verbatim generator or any generated value. Types required galaxy-cell web metadata and
  exact epoch-keyed supernova remnant/birth results, removes the two app-local casts, and documents
  the transitional GAL_SPRITES precondition precisely. Focused controls prove empty/special/cached
  behavior, exact missing-hook failure and hooked success, epoch stability/change, bounded result
  shapes, and declaration/type regressions in both directions. Updates current WorldGen, port,
  program, deviation, codebase-reference and handoff documents. Explicitly excludes generator
  logic/cache/order, CF1/F2, epoch persistence, _sanitizeSavedGenome, audio, Guide/Training/release
  copy, balance, versioning, production and deployment.`

**Other side:** do not open Claude review until the candidate is committed, pushed and visible as
a draft PR. Then Nick should open Anthropic/Claude Code; Claude fetches and normally fast-forwards
its clean `anthropic/mac` branch and reviews the exact remote diff without editing this worktree.

**Release status:** no release, manual deployment, production version bump, `develop` → `main`
merge, or direct site write is part of this batch.
