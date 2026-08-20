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

## ▶▶▶ SESSION HANDOFF — 2026-08-20 · PR #32 EXPLICIT BROWSER AUTHORITY RECALIBRATION ◀◀◀

### Cold start

- Verify repository, branch, upstream, and worktree live. OpenAI/Codex macOS owns
  `/Users/nick/Projects/celestial-frontier-openai-mac` on `openai/mac`; other agents use their own
  worktrees under `PARALLEL_GIT_PROTOCOL.md`.
- Read this handoff, `PROCESS_LAWS.md`, `PARALLEL_GIT_PROTOCOL.md`, `AGENTS.md` or `CLAUDE.md`,
  `ART_DIRECTION.md`, `UI_PRESENTATION.md`, `celestial-frontier-codebase-reference.md`,
  `port/V2_PROGRAM_ROADMAP.md`, `port/RUBRICS.md`, `port/v2/README.md`, `port/v2/DEVIATIONS.md`,
  `port/DEVELOPMENT_PREVIEW.md`, and `tools/README.md`.
- Resolve GitHub and ignored artifacts live. Never reuse an earlier green report for a newer source,
  producer, budget, workflow, or commit; never retry an unchanged red.

### Preserved exact reds and candidate20 quarantine

- D-TRAIN-1 remains integrated through PR #31 at exact `develop` merge
  `38447019517147319bd08c598202d097ee866874`; PR #32 remains the active OpenAI branch. Exact-89's
  78/78 product-complete owned-shutdown red and its lifecycle repair remain preserved history.
- Clean exact source `c49e525535bbb5de70240b922729b5b0a0ec70e5` ran
  `20260820-arc1a-terminal-lifecycle-candidate20` once without retry. It completed 78/78 outcomes
  with zero findings, six PNGs, and complete owned lifecycle, but the reused `.86`-named app had
  self-updated to `Edg/151.0.4129.93`, revision
  `@4a822b1bb7a8566144cff23f6c09a2ab162665f9`. Its calibration report carried null budget/browser
  authority, so this wrong browser was allowed to collect profiles.
- Preserve candidate20 report/sample/terminal-log SHA-256
  `175fac5e3ab71d2e35578235033af59320b7db519e59ec7383bd31c584ccdc5e` /
  `916dd12a288f538148b3d2d4d1b9bd5763800cbd8c54c21f166234ebb0cf9624` /
  `7462144b60a8397404b8000ca859b230ba0ad1ea40c7ca6bff9215864e1f7e91`.
  Candidate20 is quarantined as wrong-browser instrument evidence—not calibration, certification,
  or product failure. Baseline9 did not run.

### Frozen explicit browser-authority boundary

- The budget now requires one explicit top-level browser authority in calibration-required and
  active states: `Edg/151.0.4129.86`, revision
  `@083e754915c9ab93da1d8f7b9c860e4520273900`, JavaScript `15.1.23.7`, protocol `1.3`. Candidate
  and paired-baseline collection compare the live browser before profile collection; mismatch
  publishes early instrument-fail evidence and collects no profile. Every embedded raw capsule and
  complete product/calibration report must replay that authority with a true match.
- Frozen budget/schema/contract/collector/selftest/test SHA-256 values are `71ffa46f…` /
  `695d2529…` / `2620ebf6…` / `07131f5e…` / `240bbe17…` / `6991f6ce…`. Measurement authority is
  `825fb386127f2c8b43a05b0adcb883e9fcab635345831bdfbd0cd5dc051d71a5`; producer remains
  `d32231773e4e06db4074111b49ebe2eca698d5004bd5af3fbd8d2867d765b900`, and browser CDP remains
  `6da9e2efaaf7f91f9ad93c101368b847a7e77aeb015e83f7768fe11dd85147ce`.
- The ruler remains fail-closed: candidate samples are empty, ceilings are null, and the paired
  baseline is `measurement-required`. Historical candidate20 and older rulers cannot cross this
  authority. No timeout, launch argument, product byte, producer, retry, fallback, or observation
  policy changed; this is provenance correctness, not timing optimization.

### Next bounded sequence and open human scope

- Freeze one clean committed repair source. For each launch, materialize an unlaunched exact `.86`
  app afresh from package `b70216e0…` and verify Info.plist `d2c13c8e…`, executable `69349ca6…`,
  framework `be28b9b6…`, the single `.86` version directory, and `Versions/Current → .86`; never
  reuse a launched extraction. Runtime identity remains the final drift check.
- Run `20260820-arc1a-browser-authority-candidate21`, paired
  `20260820-arc1a-browser-authority-baseline9`, then independent candidate22 and candidate23 from
  that identical committed source, exactly once each with zero retries. First red, ambiguity,
  authority/source mismatch, cleanup failure, or publication failure stops.
- If and only if the four runs audit cleanly, activate their ruler, commit it, run one complete
  exact-head local battery, push that unchanged head to existing PR #32, and require one
  corresponding PR test-merge CI attempt. First red stops. Fresh selected-head phone/desktop list,
  focus-pinned, and detail images still require separate HUMAN judgment. Arc 1B gameplay begins
  immediately after terminal-green PR #32 closes; no broader timing work, production release,
  version bump, or deployment is in scope.

## Parallel Git handoff — exact five fields

**Current side:** OpenAI/Codex on macOS owns PR #32. Exact-89 and candidate20 are preserved reds.
The scoped working copy contains the explicit browser-authority repair and fail-closed ruler; it is
not yet the clean committed calibration source.

**GitHub step:** None until baseline9/candidate21/22/23 activate the new authority and the resulting
exact head passes its required local battery. Push only that unchanged head to existing PR #32 and
require one corresponding test-merge attempt; do not reuse candidate20, create a new PR, or touch
`main`.

**PR details:** base `develop`; source `openai/mac`; existing PR #32 title
**Arc 1A — Bound Compendium portraits and measured resources**. Its description must preserve runs
`32383320206`, `32394244417`, exact-89's shutdown false-green, and candidate20's wrong-browser
quarantine; name the explicit runtime pin, new measurement boundary, and unchanged producer. No
release or deployment is included.

**Other side:** Anthropic/Claude Code does not have this PR #32 follow-up and need not be opened now.
Only after the reviewed exact head merges to `develop` may Claude fetch and merge latest
`origin/develop` into a separate clean `anthropic/*` branch. Never copy files between worktrees.

**Release status:** D-TRAIN-1 is integrated at `3844701…`; Arc 1A/PR #32 remains an OpenAI branch
candidate. Arc 1B follows immediately after terminal-green PR #32. No `develop`→`main` merge,
production release, version bump, deployment, or site write was performed or authorized.
