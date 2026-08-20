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

## ▶▶▶ SESSION HANDOFF — 2026-08-20 · PR #32 EXACT-EDGE PACKAGE NORMALIZATION ◀◀◀

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

### Exact activation head and preserved CI red

- D-TRAIN-1 remains integrated through PR #31 at exact `develop` merge `38447019517147319bd08c598202d097ee866874`.
  PR #32 remains the active OpenAI branch. Exact pushed activation head
  `96464d5e4ca59074c0d8d59719a90a5dedc2dd2d` completed its full local battery with the active
  baseline8/candidate17/18/19 ruler, Compendium 78/78 and named verification, one-attempt Smoke,
  full Glass, nine joined personas, root layout 787/787, and verified nonpublishable preview work.
- Corresponding GitHub Actions run `32394244417`, attempt 1, tested synthetic merge `63665b6…`.
  Root, v2-static, Chrome Smoke, and Chrome Glass were green. Exact-Edge Compendium job
  `96507263338` downloaded and SHA-verified the pinned `.86` package, verified its installed version
  and executable, and passed browser-path plus portable preflight controls. The live one-launch
  preflight then found no CDP endpoint inside the unchanged 45-second startup envelope. The
  candidate never ran; no report, product outcome, or review PNG exists. Verifier/upload failures
  are cascades. Preserve this as a one-attempt, zero-retry environment/instrument red, not a product
  verdict.

### One bounded package-normalization hypothesis

- The passing hosted image `ubuntu24/20260810.271` carried Edge `.78`; installing the pinned `.86`
  package performed unpack/setup, and exact Edge became live-control ready in all four observed runs.
  Image `ubuntu24/20260816.277` already carried `.86`; plain `apt-get install` reported “already the
  newest version,” performed no unpack/setup, and exact Edge became live-control ready in none of
  three observed runs. The current failure spans multiple west-region pools; the evidence does not
  isolate image revision from host-pool placement.
- The only scoped normalization is to force `apt-get install --reinstall` from the same
  SHA-verified `.86` package in both `.github/workflows/test.yml` and
  `.github/workflows/dev-preview-package.yml`, then retain the exact package-version and executable
  checks. This is a strong environment hypothesis, not a proven fix until one matching changed-head
  CI run reaches the live preflight.
- Do not change the Edge package/version or Arc-local product/revision/JS/protocol authority; the
  45/15/5/2-second preflight, 15-second candidate startup, 2-second product observation, one-attempt/
  zero-retry policy, launcher, preflight, collector, product, measurement `6ba58522…`, producer
  `d3223177…`, budget `74e88c2b…`, and test `485be9da…` remain unchanged. No warmup, sleep, relaunch,
  fallback, DBus wrapper, recalibration, or broader infrastructure loop belongs in this batch.

### Next bounded sequence and open human scope

- Keep the two workflows synchronized. The preflight selftest now statically requires each unique
  owned install step's ordered exact URL/SHA/download/hash/reinstall/version/executable chain and
  following preflight; per-workflow removal and outside-step decoys fail. That control is green but
  proves only workflow structure. Review the diff, complete browser-free/static checks, then run the
  required exact-head local battery and push one changed head to existing PR #32 for one corresponding
  test-merge CI attempt. First red stops and is preserved.
- A terminal-green exact-head PR battery remains required before merge. The fresh phone/desktop list,
  focus-pinned, and detail six-image HUMAN judgment remains separately open. Arc 1B gameplay starts
  only after PR #32 closes in order; no Cargo, Shipyard, combat, physical-device heat/battery,
  production release, version bump, or deployment is included here.

## Parallel Git handoff — exact five fields

**Current side:** OpenAI/Codex on macOS owns PR #32. Exact head `96464d5…` and run `32394244417`
are preserved; the scoped working copy normalizes the pinned Edge package in both workflows and
adds the fail-closed static workflow control while refreshing current documentation. It is not yet
a committed, pushed, or CI-proven replacement head.

**GitHub step:** None until the exact new head passes its required local battery and is pushed to
existing PR #32. The deterministic workflow control is implemented and browser-free green. Then require
one corresponding PR test-merge attempt; do not rerun `96464d5…`, mark a red head Ready, create a
new PR, or touch `main`.

**PR details:** base `develop`; source `openai/mac`; existing PR #32 title
**Arc 1A — Bound Compendium portraits and measured resources**. Its description must preserve runs
`32383320206` and `32394244417`, name the displayed-demand repair and unchanged authorities, and
describe `--reinstall` as an unproved hosted-image normalization pending exact-head CI. No release or
deployment is included.

**Other side:** Anthropic/Claude Code does not have this PR #32 follow-up and need not be opened now.
Only after the reviewed exact head merges to `develop` may Claude fetch and merge latest
`origin/develop` into a separate clean `anthropic/*` branch. Never copy files between worktrees.

**Release status:** D-TRAIN-1 is integrated at `3844701…`; Arc 1A/PR #32 remains an OpenAI branch
candidate. No `develop`→`main` merge, production release, version bump, deployment, or site write
was performed or authorized.
