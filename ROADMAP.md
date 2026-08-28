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

## ▶▶▶ SESSION HANDOFF — 2026-08-28 · FINAL11 COMPLETED THE 20-MINUTE OBSERVATION · TEMPORAL-ORACLE REPAIR NEXT ◀◀◀

### Exact current boundary

- **Owner/environment:** OpenAI/Codex desktop on macOS, physical root
  `/Users/nick/Projects/celestial-frontier-openai-mac`, branch `openai/mac`, upstream
  `origin/openai/mac`. Work remains local and unpushed; do not edit another agent worktree or the
  sibling live-site repository.
- **Repository relationship:** exact origin is
  `git@github.com:TheDakk/Celestial-Frontier.git`; the last environment SSH authentication and
  repository-read proof passed, with no agent/socket/config/remote change since. Before the Final11
  evidence commit, `HEAD` is `1ca67156…`, upstream is 97 commits behind the local branch, and the
  locally known `origin/develop` `7a9f4c1…` is fully contained (0 behind /96 ahead). The only scoped
  working-copy changes are the 17 synchronized Markdown files and seven Final11 audit carriers.
- Signed clean docs source `1ca67156e27d6bd58a324e33b0e6b752adf568bc` supplied immutable Final11.
  Layout passed 787/787 in 76,403 ms; SceneMemory 42/42 in 10,096 ms; Compendium 78/78 in
  45,982 ms; Slice passed with zero findings and ten PNGs in 416,073 ms; Glass passed all 12
  viewports with zero findings or instrument failures in 86,808 ms. Every stage ran once and passed
  named verification.
- Recovery `20260828-phase4-final11-1ca67156e27d-recovery` ran once for 1,291,034 ms. It passed
  through `boundary-crossed`: all 15 observation outcomes passed across 309 samples; Node/browser/
  active elapsed was 1,200,308/1,200,305/1,200,305 ms; exact next-cycle and recovered UI passed.
  `recovered` then failed only the `activePlayProjection` and `closeCheckpoint` assessment checks.
  Cleanup passed and no retry occurred.
- This is an instrument temporal-oracle defect, not a product failure. Recovered raw/rendered/runtime
  was 1,285,118/1,285,098/1,285,404 ms, a valid 20 ms render lag under the existing 10-second law.
  Exhausted raw/state/UI was 79,709/84,738/84,740 ms; closed raw/state was 85,062/85,062 ms with a
  2 ms checkpoint. The old oracle compared close with stale exhausted raw (5,353 ms) instead of the
  latest exhausted live runtime (322 ms). Final11 is immutable, was not retried and is not a
  Recovery certificate. Exact carrier hashes and sizes are in `audits/README.md`.
- The next bounded change is contract-only: allow bounded UI render lag relative to durable raw
  under the existing runtime 10-second law; bind close to the latest exhausted live runtime and the
  exact committed/lost hide witness; mutation-test both directions. Do not change product code,
  version, numeric ruler, deterministic content, browser authority or point-version policy.
- After browser-free verification and independent review, commit/sign one clean repair source and
  restart **Layout → SceneMemory → Compendium → Slice → Glass → recovery** with fresh IDs. Stop on
  any red or instrument result, preserve evidence and do not retry. Only a complete green chain can
  establish Recovery and the stable Phase-4 checkpoint. HUMAN and release authority remain separate.
- Hosted authority remains zero exact attempts: no push, PR write, dispatch, rerun, merge,
  deployment, publication or version bump. Edge `151.0.4129.107` / CDP `1.3` is Final11 provenance
  only; compatible point updates never trigger a rebaseline or threshold change.

### Queued universe-wide visual polish — after the full green checkpoint

- Apply the richer treatment across the entire universe—galaxy/system space, planets, every biome,
  creature, plant, ship and effect. Sol is calibration only, never a Sol-specific branch.
- Preserve deterministic identity, authored structure, interaction geometry, accessibility, reduced-
  motion behavior and phone heat/frame/resource budgets.

### Paired handoff

- **OpenAI/Codex:** preserve/sign the Final11 evidence and synchronized references, implement only
  the bounded temporal-oracle contract repair, run browser-free controls and independent review,
  then commit/sign a clean repair source and start a fresh serial chain at Layout. Nothing is pushed.
- **GitHub step:** none. Zero exact hosted attempts are authorized; do not push, open/update a PR,
  dispatch, rerun, merge, deploy, publish or bump a version.
- **PR details:** not needed now. If Nick later authorizes the exact GitHub write, use base
  `develop`, source `openai/mac`, title **`Phase 4: complete the playable-slice campaign repair`**,
  description **`Preserves the immutable Final10/Final11 evidence chains, repairs the two Recovery
  temporal oracles with mutation controls, completes a fresh signed verification chain, and
  synchronizes the Phase-4 references. No release or deployment is included.`**
- **Anthropic/Claude Code:** Nick does not need to open Claude now. Wait for a future merged PR before
  syncing; do not copy this dirty local campaign work manually.
- **Release status:** no release or deployment; `develop`, `main` and the live site are unchanged.
- **Actions budget:** `UNFROZEN`; repository public; 3,000 fail-closed private/ambiguous cap; zero
  exact hosted attempts authorized.
