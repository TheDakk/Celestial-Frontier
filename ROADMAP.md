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

## ▶▶▶ SESSION HANDOFF — 2026-08-20 · PR #32 PRODUCT RESOLUTION-DEMAND REPAIR ◀◀◀

### Cold start

- Verify the repository and branch live. OpenAI/Codex macOS owns
  /Users/nick/Projects/celestial-frontier-openai-mac on openai/mac; other agents use their own
  worktrees and branches under PARALLEL_GIT_PROTOCOL.md.
- Read this handoff, PROCESS_LAWS.md, PARALLEL_GIT_PROTOCOL.md, AGENTS.md or CLAUDE.md,
  ART_DIRECTION.md, UI_PRESENTATION.md, celestial-frontier-codebase-reference.md,
  port/V2_PROGRAM_ROADMAP.md, port/RUBRICS.md, port/v2/README.md, port/v2/DEVIATIONS.md, and
  tools/README.md.
- Resolve Git, PR, checks, artifacts, and publication live. Ignored browser reports bind only the
  exact run id, source, inputs, budget bytes, fixture, browser build, and review files they name.
  Never reuse an earlier green report for a newer source, producer, budget, or commit.

### Preserved exact red and repair boundary

- D-TRAIN-1 is integrated through PR #31 at exact develop merge
  `38447019517147319bd08c598202d097ee866874`, the Arc 1A broken-baseline product authority.
  PR #32 remains the active OpenAI branch. Exact pushed head
  `139ce2f9b1bad7a9f81ffdaf07cf9452efb19ccf` passed its complete local battery once, including
  Compendium 78/78 plus named verification, one-attempt Smoke, full Glass, nine joined personas,
  root layout 787/787, and verified nonpublishable preview packaging/browser smoke.
- Corresponding GitHub Actions run `32383320206`, attempt 1, tested clean synthetic merge
  `174a914053a6457a33b1401cce3709c235a28409` for pushed head `139ce2f…` under exact
  Edg/151.0.4129.86 and matching measurement `6ba58522…`, producer `e59685b1…`, and active
  budget `bb4da2bf0b…`. Phone completed 29 stages through veteran-Earth boot readiness.
  Planetside thumb settlement's target `Runtime.evaluate` then missed the unchanged 2,000 ms
  command deadline at `2001.132592` ms while independent root `Browser.getVersion` answered in
  `10.401960` ms.
- That terminal carrier is `product-unanswerable`, not instrument/transport or a timing-policy red:
  zero outcomes, 78 blocked, no review PNG, one attempt, and zero retries. Preserve it without an
  unchanged retry. Report/log SHA-256 values are
  `e75d6ca33063bab5e478025e064e90277b85b44c3798a8b557c6ea70e42f668d` /
  `ca5e14e2f8706b7820984f7902b628a55b5199b209b21ea3c95eb9ac345b873a`; the downloaded artifact
  zip is `28cf83845bdcd4518c5d9a31ac65822bf7371e7e32f79f81850e3858bab47228`.

### Product resolution-demand repair

- Source audit found that cold Planetside entry always requested the 1024 planet-texture tier before
  the fitted globe's displayed backing-pixel demand was known. The bounded product repair computes
  `ceil(diameterCssPx × sceneScale × DPR)` with a finite positive 64px floor. Standard boot demand
  is 609px on the phone profile and 420px on desktop, selecting the existing 512 tier instead of
  speculatively starting at 1024.
- Supported sharpness is preserved. The exact live surface generation plus planet seed and ordinal
  own the sprite. The owner re-reads the cache after the asynchronous bake and swaps the settled
  texture; stale world/generation completions cannot publish. Zoom/DPR changes request only a
  genuinely higher 512/768/1024 tier, suppress duplicate-tier work, and retain the prior tier until
  its successor settles. Maximum tested phone/desktop zoom demand is 1,248/1,280px, which selects
  the existing 1024 tier.
- This changes the game/product and the existing v2.0 development release bullet, not the CDP
  deadline, retry policy, collector, measurement input, save format, deterministic generation,
  release identity, or deployment. Worker and painter bytes remain unchanged.

### Fail-closed authority and bounded calibration

- The product/copy change makes built producer authority
  `d32231773e4e06db4074111b49ebe2eca698d5004bd5af3fbd8d2867d765b900`: index
  `dee9af3a18ee0a2513b9ac5d2d0a885040f46008af707f0525a1deeeb502f3bc`, owner
  `assets/main-Da536xWA.js` /
  `283828737eefe7774fc27c96319335cb4f1a9433862fe295af56436c5d59031a`, with worker and painter
  unchanged. Measurement authority remains
  `6ba58522fc961e145df4f065f913d99d8b18355a20d664b9bcdc90741057638a`.
- The tracked ruler correctly fails closed at `calibration-required`: phone/desktop candidate
  samples are empty, the paired baseline is `measurement-required`, and ceilings are null. Current
  budget/test SHA-256 values are
  `9f53ebe69e007f33eb0b38331f8750ecbe70a0a884edfe261800c0e9f01bb011` /
  `c2b68b3ec1f7fea1b1013fb024676be1f3aad45a3726eb613febf07c79ee6210`.
  Baseline7/candidate14/15/16, their strict ceilings, exact-139 local battery, and run `32383320206`
  remain truthful history for producer `e59685b1…`; none crosses into or certifies
  `d3223177…`.
- Freeze one clean committed repair/collector head. Under unchanged exact Edge .86 and measurement
  `6ba58522…`, collect one one-attempt/no-retry paired baseline8 against legacy product
  `38447019517147319bd08c598202d097ee866874`, then independent one-attempt/no-retry
  candidate17, candidate18, and candidate19 against the identical committed candidate head and
  producer.
- Activate a successor ruler only if every candidate replays 78/78, baseline8 retains all four
  sealed faults and discriminating breaches, all raw capsules and authorities match, and every
  ceiling is strictly above the three-run maximum with written rationale. Then run one complete
  exact-activation-head local battery and one corresponding PR test-merge CI attempt.
- First red, ambiguity, source mismatch, or unverifiable carrier stops the transition and is
  preserved. Do not widen a timing bound, alter CDP/measurement tools, retry an unchanged red, or
  start another infrastructure loop. After PR #32 closes in order, return to Arc 1B/gameplay.

### Human and scope boundary

- The fresh phone/desktop list, focus-pinned, and detail six-image HUMAN review remains open and
  cannot be supplied by hashes, dimensions, automated geometry, or model inspection.
- Arc 1A does not add Cargo, Shipyard, ownership inventory, creature instances, rewards, combat,
  missions, companions, crafting, research, an Arc 1B combined scene/GPU plateau, physical-device
  heat/battery evidence, a production release, or deployment.

## Parallel Git handoff — exact five fields

**Current side:** OpenAI/Codex on macOS owns PR #32's bounded product resolution-demand repair and
fail-closed producer transition. Product, budget, test, and documentation bytes must be committed
together before baseline8/candidate17/18/19. No current browser run may certify the
`d3223177…` producer yet.

**GitHub step:** None until the clean pre-calibration commit, fresh calibration/activation, one
exact-activation-head battery, and one corresponding PR test-merge attempt complete under the stop
rule. PR #32 already exists; do not create another PR, mark a red head Ready, or touch `main`.

**PR details:** base `develop`; source `openai/mac`; existing title
**Arc 1A — Bound Compendium portraits and measured resources**. Update its description after the
activation head exists to name run `32383320206`, the displayed-demand/zoom repair, producer
`d3223177…`, fresh baseline8/candidate17/18/19 authority, and exact final verification. No release
or deployment is included.

**Other side:** Anthropic/Claude Code does not have this PR #32 repair and need not be opened now.
Only after the exact reviewed head merges to `develop` may Claude fetch and merge the latest
`origin/develop` into a separate clean `anthropic/*` branch under the startup protocol. Never
copy files from this OpenAI worktree.

**Release status:** D-TRAIN-1 is integrated at `3844701…`. Arc 1A/PR #32 remains an OpenAI branch
candidate. No `develop`→`main` merge, production release, version bump, manual deployment, or
production-site write was performed or authorized.
