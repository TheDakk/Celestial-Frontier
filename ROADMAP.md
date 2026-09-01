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

## ▶▶▶ SESSION HANDOFF — 2026-09-01 · FRESH-BOOT ORACLE REPAIR BROWSER-FREE GREEN ◀◀◀

### Exact current boundary

- **Owner/scope:** OpenAI/Codex desktop on macOS at
  `/Users/nick/Projects/celestial-frontier-openai-mac`, branch **openai/mac**, upstream
  **origin/openai/mac**. GitHub run **33466661094** tested exact PR #35 head
  **06aba9d2724f9d3395c09e9cb3b9c7af17d8fa0c** against base
  **7a9f4c1370dd84292388d718c38ff34214f6203b**.
- Actions evaluated synthetic merge **337ffd29f1584f1a5c786c4532a79c99876be325**. Its tree is
  byte-equivalent to the exact head tree **e39bcdb8781eeaa6f9ee503cd6cfbb47497899ea**; this was not
  a stale-base or merge-content mismatch.
- Exact clean SSH-signed local source
  **6030035dff1779c3fc3be7e4f46f376ff01455e8** (tree
  **f2fa2c7b2928c8a7fa82f753f847e62c72044bc3**, parent **06aba9d2724f9d3395c09e9cb3b9c7af17d8fa0c**)
  passed its hermetic tracked-input rehearsal and supplied one no-retry local browser attempt.
- Its Compendium predecessor passed, but Slice stopped before its first Survey action on one
  fresh-document readiness-oracle defect. The bounded dirty successor is browser-free green but is
  not yet signed, tracked-input rehearsed or browser-certified; it inherits no 6030035 certificate.
- **Authority:** the fifth `actions-budget-approved`, 92-minute-maximum, one-attempt/no-retry
  authorization is consumed. Its label was removed. No push, label, hosted attempt, retry, Ready
  transition, merge, release, version bump, preview/publication or deployment is currently
  authorized. PR #35 remains Draft/unmerged; `develop`, `main` and the live site are unchanged.

### Exact 6030035 local stop and complete failure-surface diagnosis

- Exact 6030035 passed `node tools/tracked-input-preflight.mjs --profile=develop`: **257 files /
  2,622 passed / 1 skipped**, all three TypeScript programs, **34** clean art sources,
  **1,014/1,014** routes and **454** non-inert specification fields from a fresh exported index.
- The changed-Slice browser-CDP selftest and live Compendium preflight passed. Edge
  **152.0.4191.53** / CDP **1.3** is per-run provenance only and triggers no rebaseline.
- Compendium **20260901051716174-22348-bea719354e** passed **78/78** with zero findings or blocked
  outcomes in **64,220 ms**; exact named verification passed.
- Develop Slice **20260901051837279-22717-480519033de4** stopped after **24,458 ms** with exactly
  **1 finding / 1 scope**, `harness`, and no screenshots. Before the first keyboard Milky Way
  Survey action, a fully writable same-document authority at revision 5 was rejected solely because
  its immutable boot provenance was `fresh-v5`, while the generic assessor required `current-v5`.
- The retained observation was otherwise exact: persistence ready, no hold or pending write,
  current visible/answerable/lease-owned/accruing runtime, and live↔raw revision/SessionRNG parity.
  This is an instrument false red, not product-bug evidence. Glass correctly did not run; 6030035
  was not retried and will not be relabelled.

### Browser-free-verified bounded successor

- `assessF4ReadyAuthority` is now one browser-free contract. `current-v5` remains the default;
  `fresh-v5` is accepted only when the caller explicitly names an initial-page boundary, supplies
  the exact original document token and has no previous token. Boot provenance is never rewritten.
- Desktop pointer/core flow, the isolated keyboard journey and the fresh-phone journey explicitly
  bind that original token through their valid fresh lifetime, including each post-Survey fixed
  point. Reload/replacement/current-document paths retain strict `current-v5` authority and cannot
  opt into fresh acceptance.
- Directional controls reject absent/short/drifted tokens, a previous-token fresh bind, unknown or
  missing boot kinds, missing scene resources, pending persistence writes, lost lease, raw revision
  drift and every other authority fault. The pre-existing Survey receipt/revision/persistence,
  route/render/card/action, coordinator-idle and causal-stop requirements remain intact.
- Focused verification passed **5 files / 79 tests**. All three TypeScript programs passed.
  Final `node tools/check-profile.mjs --profile=develop` passed **258 files / 2,628 passed / 1
  skipped**, **34** clean art sources, **1,014/1,014** routes and **454** non-inert specification
  fields. Independent final review is **APPROVED**.
- The successor changes only the Slice instrument/contracts/tests and these current references.
  Current Compendium producer authority remains
  **410d2639ec981647adc20b3ae00576c0d60839296c7b763333fa2a00c79b42a6**.
- The successor is still a dirty working tree: its clean signed candidate, tracked-input rehearsal
  and unchanged-source Compendium → Slice → Glass chain are **pending**. No browser certificate is
  claimed by this handoff.

### Immutable exact-source evidence

- Compendium PASS:
  `audits/ARC1A_COMPENDIUM_PR35_FRESH_BOOT_READINESS_PREDECESSOR_PASS_20260901_6030035.json.gz` —
  gzip **452,461 bytes**, SHA-256
  `c962c4443a375cbccab541b3e7439e48fdaca2d8b77a9de28fdf337035f5bd27`; raw
  **10,843,413 bytes**, SHA-256
  `7f8b399771f287667d05cd7e9b86b747ffe42422d4251f32abaa8e6a5b28a6fc`.
- Slice FAIL:
  `audits/ARC4_SLICE_PR35_FRESH_BOOT_READINESS_ORACLE_RED_20260901_6030035.json.gz` — gzip
  **2,699 bytes**, SHA-256
  `b97e9a34319efab061eb7f8f4ab8569f1162a0c7abc6486501aa3d574ed68fdb`; raw **11,308
  bytes**, SHA-256 `fc1b1cdfdd5fa8c4f4390aca98a407a6fd473f74f1cd5f5784877535b1220cd8`.
- Slice log:
  `audits/ARC4_SLICE_PR35_FRESH_BOOT_READINESS_ORACLE_RED_20260901_6030035.log.gz` — gzip
  **2,924 bytes**, SHA-256
  `e1a70f1ac1279d23fd5241c6f1455db0e811f4ab39e546ebfe1632239881e259`; raw **7,273
  bytes**, SHA-256 `348f2d950f9136e33227d9276879fd843655a9f155947f1344e4bef13df77470`.
- All three carriers pass gzip integrity and remain bound only to exact signed 6030035. The prior
  hosted 337ffd2 PASS/red carriers remain immutable historical evidence and are not relabelled.

### Unchanged product boundary

Gameplay, save schema/semantics, deterministic generation, creature/genome/plant/biome/Guardian
structures, art/audio, CSS and presentation geometry are unchanged. Browser-family/CDP policy,
numeric rulers, timeouts and the one-attempt/no-retry rule are unchanged. This bounded repair
corrects an evidence oracle's treatment of immutable fresh-document provenance; it does not change
the game, any roadmap system, Arc/Gate status, development preview or release boundary.

### What remains

1. Commit the bounded successor as one clean SSH-signed candidate, then run
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

- **OpenAI/Codex next:** commit the bounded fresh-boot oracle successor, run its tracked-input develop rehearsal,
  then its exact no-retry Compendium → Slice → Glass chain. Do not push, label or dispatch until that
  exact candidate is terminal green locally and Nick supplies a fresh exact hosted authorization.
- **PR:** existing draft #35, base **develop**, source **openai/mac**. Copy-ready title:
  **feat(v2): complete roadmap campaign and harden action-time CI evidence**.
- **Copy-ready PR description:** “Completes the established v2 roadmap campaign without recreating
  its systems; preserves creature/genome/universe art structures; hardens action-time evidence and
  exact Survey-predecessor settlement across every dependent Slice Enter/Land path; binds immutable
  fresh-document provenance without weakening reload authority; and causal-stops descendants after
  any red. Product behavior, save semantics, CSS, numeric rulers, retry policy and
  browser-version policy are unchanged. No release, version bump, preview or deployment is included.”
- **Claude Code next:** Nick does **not** need to open Claude yet. Open it only after PR #35's final
  exact head is terminal green and merged into `develop`; Claude must use a fresh `anthropic/*`
  branch and must not edit this OpenAI worktree.
- **Release status:** no release, version bump, preview publication or deployment is in progress.
