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

## ▶▶▶ SESSION HANDOFF — 2026-08-20 · PR #32 SHUTDOWN LIFECYCLE RECALIBRATION ◀◀◀

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

### Preserved exact post-measurement instrument red

- D-TRAIN-1 remains integrated through PR #31 at exact `develop` merge
  `38447019517147319bd08c598202d097ee866874`; PR #32 remains the active OpenAI branch. Exact local
  head `89bfa0581f7eb33c90a79bb8b0ead554626197e7`, run
  `20260820-pr32-89bfa05-compendiummem`, completed all 78/78 product outcomes with zero findings and
  wrote six review PNGs. Its owned browser shutdown then exited 2.
- The terminal log SHA-256 is `b0bb8abcc77c394ba887b73ce192a8e2cd9584a402d7b97f80768b8e7049458f`.
  Report `66ba13665bf5dac4d08907ee3b0c2abb7fec54d06c94fe5d59948bb5c4749888` and verifier
  `98664dca6b07c9937bfa1d0f13aacd0d9364cb793a5a9be67c98a9507ca3d8d4` are false-green because
  success was published before cleanup. Preserve this as one-attempt/no-retry post-measurement
  instrument red—not certification, calibration, or a product failure.

### Frozen lifecycle repair and authority boundary

- `browsercdp.mjs` now distinguishes direct-child process exit from later stdio/`close`: TERM→KILL
  is judged on exit, then owned stderr is released and close remains required. The collector keeps
  reports RUNNING/lifecycle-pending until browser/server cleanup and workspace-lock release; only
  then may it publish a sample or terminal success. Cleanup, release, sample, and report-publication
  failures suppress success, and the verifier requires terminal lifecycle authority.
- Frozen SHA-256 values are browser CDP `6da9e2efaaf7f91f9ad93c101368b847a7e77aeb015e83f7768fe11dd85147ce`,
  collector `f4ad842c8e326bb46a54afdbc0c2aba9b748b69df618d01203593126a959796e`, and selftest
  `2713ed106a1316fb3eb5efbc1eb2adcb53eaba18432040ce1e2a4e5a90b4df6f`. Measurement authority is
  therefore `a3b3bb9f1e32f13a13bcffd09525e29494d694cbae9886060068f693b0b25e6d`; producer remains
  `d32231773e4e06db4074111b49ebe2eca698d5004bd5af3fbd8d2867d765b900`.
- Fail-closed budget/test `ae4ab918471d4e3adec679d4d0a840e227f0c90d513c841eb7711626ce75a833` /
  `60fa5e9f91f148cace3bc117f742b0a67bf3b771bdbbc1f4a6f3a3b8cbfd6a23` deliberately require
  calibration: candidate samples are empty, ceilings are null, and the paired baseline is
  `measurement-required`. Baseline8/candidate17/18/19 and measurement/budget/test
  `6ba58522…` / `74e88c2b…` / `485be9da…` remain truthful history only.
- No timeout, browser/package/version, launch argument, product byte, producer, retry, fallback, or
  observation policy changed. This is lifecycle correctness, not another timing-optimization loop.

### Next bounded sequence and open human scope

- Freeze one clean committed repair source, then collect paired baseline9 plus independent
  candidate20/21/22 under exact Edge .86 exactly once each with zero retries. First red, ambiguity,
  source mismatch, cleanup failure, or publication failure stops; do not reuse the false-green
  exact-89 artifacts or an older ruler.
- If and only if the four runs audit cleanly, activate their ruler, commit it, run one complete
  exact-head local battery, push that unchanged head to existing PR #32, and require one
  corresponding PR test-merge CI attempt. First red stops. Fresh selected-head phone/desktop list,
  focus-pinned, and detail images still require separate HUMAN judgment. Arc 1B gameplay begins
  after PR #32 closes; no broader timing work, production release, version bump, or deployment is
  in scope.

## Parallel Git handoff — exact five fields

**Current side:** OpenAI/Codex on macOS owns PR #32. Exact `89bfa05…` and its post-measurement
shutdown red are preserved. The scoped working copy contains the frozen lifecycle repair and a
fail-closed calibration-required ruler; it is not yet the clean committed calibration source.

**GitHub step:** None until baseline9/candidate20/21/22 activate the new authority and the resulting
exact head passes its required local battery. Push only that unchanged head to existing PR #32 and
require one corresponding test-merge attempt; do not rerun exact-89, create a new PR, or touch
`main`.

**PR details:** base `develop`; source `openai/mac`; existing PR #32 title
**Arc 1A — Bound Compendium portraits and measured resources**. Its description must preserve runs
`32383320206`, `32394244417`, and exact-89's shutdown false-green; name the displayed-demand repair,
the lifecycle repair, new measurement boundary, and unchanged producer. No release or deployment
is included.

**Other side:** Anthropic/Claude Code does not have this PR #32 follow-up and need not be opened now.
Only after the reviewed exact head merges to `develop` may Claude fetch and merge latest
`origin/develop` into a separate clean `anthropic/*` branch. Never copy files between worktrees.

**Release status:** D-TRAIN-1 is integrated at `3844701…`; Arc 1A/PR #32 remains an OpenAI branch
candidate. No `develop`→`main` merge, production release, version bump, deployment, or site write
was performed or authorized.
