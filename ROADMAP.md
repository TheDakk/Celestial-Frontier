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

## ▶▶▶ SESSION HANDOFF — 2026-09-01 · SURVEY REPAIR BROWSER-FREE GREEN · BROWSER CHAIN PENDING ◀◀◀

### Exact current boundary

- **Owner/scope:** OpenAI/Codex desktop on macOS at
  `/Users/nick/Projects/celestial-frontier-openai-mac`, branch **openai/mac**, upstream
  **origin/openai/mac**. GitHub run **33466661094** tested exact PR #35 head
  **06aba9d2724f9d3395c09e9cb3b9c7af17d8fa0c** against base
  **7a9f4c1370dd84292388d718c38ff34214f6203b**.
- Actions evaluated synthetic merge **337ffd29f1584f1a5c786c4532a79c99876be325**. Its tree is
  byte-equivalent to the exact head tree **e39bcdb8781eeaa6f9ee503cd6cfbb47497899ea**; this was not
  a stale-base or merge-content mismatch.
- The bounded Survey-settlement harness repair and regression controls are browser-free verified.
  They are not yet a clean signed candidate, have not run the fresh browser chain and do not inherit
  the predecessor's certificate.
- **Authority:** the fifth `actions-budget-approved`, 92-minute-maximum, one-attempt/no-retry
  authorization is consumed. Its label was removed. No push, label, hosted attempt, retry, Ready
  transition, merge, release, version bump, preview/publication or deployment is currently
  authorized. PR #35 remains Draft/unmerged; `develop`, `main` and the live site are unchanged.

### Fifth hosted stop and complete failure-surface diagnosis

- Run **33466661094** completed terminal red after **32m41s**. Root/v2 prerequisites, tracked-input
  and static checks, art mutation, root Layout/freshness, SceneMemory selftests, changed Compendium
  selftests, the Chrome launcher selftest and exact Edge install/preflight all passed.
- Compendium run **gha-33466661094-1-compendiummem** passed **78/78** with zero findings or blocked
  outcomes in **1,420,350 ms**. Edge **151.0.4129.101** / CDP **1.3** was accepted; its point version
  is provenance only and requires no rebaseline.
- Develop Slice **gha-33466661094-1-slice** stopped after **115,766 ms** with **13 findings / 8
  scopes** and five screenshots. Its first causal finding was the non-Sol Survey → Enter step:
  `charter block did not expose the live stage-0 Engineering/Jump Drive path: "Expedition action
  settlingStay on this location until its durable result settles. Survey Close remains available."`
- The runner opened a receipt-bearing non-Sol Survey and pressed Enter before Survey's asynchronous
  F4 settlement. The product correctly refused the dependent mutation under its global durability
  fence and stayed in the galaxy; the remaining **12** findings were cascades. The Sol Survey path
  had the same unawaited predecessor gap. This is one causal harness race, not thirteen product bugs.
- Glass correctly skipped after Slice red. Nothing was retried or relabelled.

### Browser-free-verified local successor

- Every Survey-dependent Enter/Land path now waits for an exact same-document Survey F4 fixed point:
  exact receipt/revision and persistence, current route/render/card/action identity, and coordinator
  idle. The shared contract covers pointer, keyboard, touch and already-current routes.
- A red, replaced or still-settling Survey causal-stops before every dependent Enter/Land action.
  The regression surface includes the original early core flow and each dependent action order; it
  does not widen a timeout or add a retry.
- `state().landing.surveyOutcome` remains diagnostic-only so a red report can name the Survey
  predecessor without turning that observation into action authority.
- Final acceptance additionally requires Atlas Travel to settle exactly one
  `arc9-galaxy-arrival-v1` / `arc9-travel-committed:` commit rather than pretending Travel is a
  no-write path; single and sequence runtime schemas bind before/after live↔raw SessionRNG parity;
  the current Survey must reject retained faults; and paired stable-but-wrong current live/raw
  revision, seed, ordinal and draw controls must all fail.
- After those four review findings were fixed, the focused current set passed **4 files / 73 tests**,
  all three TypeScript programs passed, and two independent code reviews were **APPROVED**.
- Final `node tools/check-profile.mjs --profile=develop` passed **257 files / 2,622 passed / 1
  skipped**, **34** clean art sources, **1,014/1,014** routes and **454** non-inert specification
  fields. Current Compendium producer authority remains
  **410d2639ec981647adc20b3ae00576c0d60839296c7b763333fa2a00c79b42a6**.
- The clean signed candidate, tracked-input rehearsal and unchanged-source Compendium → Slice →
  Glass chain are still **pending**. No browser certificate is claimed by this handoff.

### Immutable hosted evidence

- GitHub artifact **battery-evidence**, ID **9785718444**, size **7,687,662 bytes**, digest
  `sha256:3618053ebac857230e696b2560c961bcca0d338812865002d47c9192acd56652`, expires
  **2026-09-15**.
- Compendium PASS:
  `audits/ARC1A_COMPENDIUM_PR35_CORE_FLOW_SURVEY_PREDECESSOR_PASS_20260901_337FFD2.json.gz` — gzip
  **487,297 bytes**, SHA-256
  `45db57e4541516a1d623c7b73b554e80f2331be654e7e9df20d93083cc1eaa07`; raw
  **12,842,866 bytes**, SHA-256
  `43e13051779f63cb5c664713f353a2696df30cb020c76f8000476c07cb9094c6`.
- Slice FAIL:
  `audits/ARC4_SLICE_PR35_CORE_FLOW_SURVEY_SETTLEMENT_RED_20260901_337FFD2.json.gz` — gzip
  **2,857 bytes**, SHA-256
  `58676472d7615543879e65b293a6a467099a317484c05fac6b3f342ebce8537f`; raw **10,199
  bytes**, SHA-256 `9d9ea6e88cc344478ae828dc08d7c0d380d94257d535976aac57a60a696d67d1`.
- Slice log:
  `audits/ARC4_SLICE_PR35_CORE_FLOW_SURVEY_SETTLEMENT_RED_20260901_337FFD2.log.gz` — gzip
  **2,628 bytes**, SHA-256
  `f2b36e8c80bca680d8389ad9c76eb55a781c25dc79bcde33ca29ccef7998428e`; raw **6,334
  bytes**, SHA-256 `dab0a53cd0767a34fbde159f6988b27029d4663cac61e0e3b94824207495ae23`.
- All three carriers pass gzip integrity and remain bound to synthetic merge 337ffd2 / exact
  tree-equivalent head 06aba9d. The prior exact-source PASS carriers remain immutable historical
  evidence and are not relabelled as evidence for the local successor.

### Unchanged product boundary

Gameplay, save schema/semantics, deterministic generation, creature/genome/plant/biome/Guardian
structures, art/audio, CSS and presentation geometry are unchanged. Browser-family/CDP policy,
numeric rulers, timeouts and the one-attempt/no-retry rule are unchanged. The correct
**Expedition action settling** refusal remains product behavior; this batch repairs the harness's
predecessor ownership and causal stop, not the game.

### What remains

1. Commit one clean SSH-signed candidate, then run
   `node tools/tracked-input-preflight.mjs --profile=develop` against that exact committed source.
2. On the same unchanged source, run one fresh local Compendium → Slice → Glass develop chain,
   once/no-retry, with every named verifier. Stop after any red or ambiguity; SceneMemory
   certification remains production-only and Recovery is not develop.
3. Commit exact descendant evidence and refresh these current references without rebinding the
   certificate. No manual development preview is part of admission and none has run in this batch.
4. Only after local terminal green, obtain Nick's fresh exact authorization naming the final head,
   base **7a9f4c1370dd84292388d718c38ff34214f6203b**, PR #35, `test-battery`,
   `actions-budget-approved`, 92-minute maximum and no retry. Then push/update/run once.
5. Merge PR #35 into `develop` only if that exact hosted attempt is terminal green and branch
   protection is satisfied. After integration, Claude begins the requested full-plan polish review
   from a fresh `anthropic/*` branch at the exact `develop` merge commit.

### Product vision and HUMAN boundary

The browser game remains the main bread-and-butter product: a deterministic, effectively infinite
universe built for repeat exploration, mining, crafting, exceptional loot and Pureforged gear,
creature discovery/care/breeding and Pokémon-like combat, Guardian progression and long-term return
play. Existing implemented systems and source-aligned references remain the foundation.

Authored visual/listening/accessibility/first-journey judgment, physical phone/tablet install, heat,
battery and true-GPU review remain HUMAN. Explicitly parked design/production work remains in the
system references and `port/V2_PROGRAM_ROADMAP.md`; this harness repair changes no Arc/Gate status.

### Paired Git/Claude handoff

- **OpenAI/Codex next:** create the clean signed candidate, run its tracked-input develop rehearsal,
  then its exact no-retry Compendium → Slice → Glass chain. Do not push, label or dispatch until that
  exact candidate is terminal green locally and Nick supplies a fresh exact hosted authorization.
- **PR:** existing draft #35, base **develop**, source **openai/mac**. Copy-ready title:
  **feat(v2): complete roadmap campaign and harden action-time CI evidence**.
- **Copy-ready PR description:** “Completes the established v2 roadmap campaign without recreating
  its systems; preserves creature/genome/universe art structures; hardens action-time evidence and
  exact Survey-predecessor settlement across every dependent Slice Enter/Land path; and causal-stops
  descendants after any red. Product behavior, save semantics, CSS, numeric rulers, retry policy and
  browser-version policy are unchanged. No release, version bump, preview or deployment is included.”
- **Claude Code next:** Nick does **not** need to open Claude yet. Open it only after PR #35's final
  exact head is terminal green and merged into `develop`; Claude must use a fresh `anthropic/*`
  branch and must not edit this OpenAI worktree.
- **Release status:** no release, version bump, preview publication or deployment is in progress.
