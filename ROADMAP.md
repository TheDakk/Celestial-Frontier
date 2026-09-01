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

## ▶▶▶ SESSION HANDOFF — 2026-09-01 · SHARE/PROGRESSION SEQUENCE REPAIR BROWSER-FREE GREEN ◀◀◀

### Exact current boundary

- **Owner/scope:** OpenAI/Codex desktop on macOS at
  `/Users/nick/Projects/celestial-frontier-openai-mac`, branch **openai/mac**, upstream
  **origin/openai/mac**. The latest clean SSH-signed browser-tested checkpoint is
  **c0f7215bd1ec932f6357b6cfc1e045b5644ba389** (tree
  **ecdc8623e5bad04d25dce0d3710e0d8db13d8704**, parent
  **138cdee0d3840efd899b5ebdbe974fd12d87e828**).
- Exact c0f7215 crossed the repaired Survey surface-expression boundary on Edge
  **152.0.4191.53** / CDP **1.3**. Browser point version remains per-run provenance and does not
  trigger a rebaseline.
- Compendium **20260901061544208-38321-e0d289a02a** passed **78/78** once/no-retry in
  **64,697 ms** with zero findings or blocked outcomes and six review PNGs. Exact named verification
  necessarily passed before Slice. Producer authority was
  **410d2639ec981647adc20b3ae00576c0d60839296c7b763333fa2a00c79b42a6**; budget authority was
  **78269c722c0d64438c0d407e0d8df3a8a284715af35bff94ed6f7d8dbba569c2**.
- Exact-source develop Slice **20260901061722706-38658-429913af5517** then stopped terminal red
  once/no-retry after **337,110 ms** with exactly **1 finding / 1 scope**, `collision-share-1`, and
  ten screenshots. Glass correctly did not run, and c0f7215 was not retried or relabelled.
- **Hosted authority:** PR #35 still has five consumed hosted terminal-red attempts against base
  **7a9f4c1370dd84292388d718c38ff34214f6203b**. All approval labels are absent. No push, label,
  hosted attempt, retry, Ready transition, merge, release, version bump, preview/publication or
  deployment is currently authorized. PR #35 remains Draft/unmerged; `develop`, `main` and the
  live site are unchanged.

### Exact c0f7215 stop and complete diagnosis

- The collision Share product action was correct. On one unchanged document token it moved from
  revision **13**, receipt ordinal **8**, Shares **4** to revision **15**, ordinal **10**, Shares
  **5**. It appended ordinal 8 `arc9-share-send-v1`, then ordinal 9
  `arc9-progression-refresh-v1`; persistence finished at `arc9-progression-committed:15`.
- The owner receipt advanced Shares **4 → 5** while retaining the already-earned `share` event;
  fifth Share caused the separate aggregate progression tail to add `share5`. Best rank remained
  **3** and SessionRNG seed/draws were unchanged. This is the intended
  action-owner-plus-aggregate topology.
- The old Slice oracle accepted only one new Share receipt, sampled a generic writable F4 state
  between or after causal receipts, and therefore rejected this correct two-receipt fixed point.
  This was a harness defect, not a gameplay, save or progression defect.

### Browser-free-verified bounded successor

- Game and Share behavior are unchanged, and there is no product-source change.
  `READ_F4_AUTHORITY_EXPRESSION` now reads the canonical v5 catalog row
  (`catalog` / `v5:catalog`) in the same read-only transaction as revision, player and receipts.
- The predecessor cross-binds exact catalog schema/segment plus its `codex`, `surveyed` and
  `gals` arrays to legacy raw state, while binding existing live `codexCount`,
  `stats.surveys`, best and hybrids. The successor proves both catalog and legacy inputs are
  preserved.
- The accepted sequence is derived from the exact predecessor and product outcome: one
  `arc9-share-send-v1` receipt always; exactly one following `arc9-progression-refresh-v1` receipt
  only when the fifth Share adds `share5` or the post-Share aggregate score raises best rank. The
  final persistence prefix follows the actual last receipt.
- Settlement requires two consecutive exact observations on the same document token. Missing,
  swapped, extra or malformed receipts; wrong revision/ordinal/SessionRNG spans; raw/live drift;
  wrong outcome/counters/achievements/rank; unrelated progression changes; an intermediate sample;
  or overshoot all fail closed.
- The c0 fixture uses the exact captured **26 unlock IDs**; the rank oracle proves parity across
  every threshold and factor, including permanent no-demotion when saved rank 3 exceeds earned
  rank 0 and the action correctly has one Share receipt with no progression tail. One shared
  contract covers all six Share sites: clipboard denial,
  clipboard success, stage-3 forced Share, chapter-3 adjacent Share, collision Share and
  collision-reload Share. Negative
  controls exercise both the ordinary one-receipt and conditional two-receipt shapes, and every
  helper's output is bound to its waiter's arguments.
- Focused verification is **57/57** and all TypeScript programs pass. The complete develop profile
  passes **259 files / 2,659 passed / 1 skipped**, **34** clean art sources, **1,014/1,014** routes
  and **454** specification fields with zero inert fields. Independent final review is **APPROVED**.
- The successor is a dirty, unsigned working tree. It inherits no c0f7215 browser certificate.

### Immutable exact-source evidence

- Compendium PASS:
  `audits/ARC1A_COMPENDIUM_PR35_COLLISION_SHARE_SEQUENCE_PREDECESSOR_PASS_20260901_C0F7215.json.gz`
  — gzip **524,314 bytes**, SHA-256
  `76b69a84cfaacbdc83c4bed13ae533c2168cb45ef0cd2664648b892a49b4dd66`; raw
  **10,843,992 bytes**, SHA-256
  `f958ab4af34a697a3a72ef96451cbe4fb47bf0c6ed9283a0fecc1cfa7e3905e9`.
- Slice FAIL:
  `audits/ARC4_SLICE_PR35_COLLISION_SHARE_SEQUENCE_ORACLE_RED_20260901_C0F7215.json.gz`
  — gzip **34,717 bytes**, SHA-256
  `0ed2ae49138e825d0e8ddfe4fd1f83d969b2a2eddac3b5f0436550ded34a181a`; raw
  **156,021 bytes**, SHA-256
  `925c32e00bf8f77ac61a1052f918e321ac4e9cdc84145857d3d7c8a7a93b9fc9`.
- Slice log:
  `audits/ARC4_SLICE_PR35_COLLISION_SHARE_SEQUENCE_ORACLE_RED_20260901_C0F7215.log.gz`
  — gzip **10,713 bytes**, SHA-256
  `fe6841003e8cb5b0c23c8048bdb7c783420f6d8593579c871cade0cf8871cf2f`; raw
  **67,516 bytes**, SHA-256
  `4fd323a2a6be3427d2a8f7483edb070b93e821b691e9f12e74a0ea03d29801e4`.
- All three carriers pass gzip integrity and deterministic `gzip -n` recompression. They bind only
  exact signed c0f7215. Older exact-source and hosted reds remain immutable history.

### Unchanged product and program boundary

Gameplay and Share semantics, save schema/semantics, CF1, deterministic generation,
creature/genome/plant/biome/Guardian structures, art/audio, copy, CSS, focus and geometry are
unchanged. Browser-family/CDP policy, numeric rulers, timeouts and one-attempt/no-retry policy are
unchanged. Compendium's sealed 78 outcomes and producer remain unchanged. SceneMemory remains
production-only/quarantined; Recovery is not part of develop. No roadmap feature, Arc/Gate/HUMAN
status, preview rule, release identity, version or deployment status changed.

### What remains

1. Commit one clean SSH-signed candidate and run
   `node tools/tracked-input-preflight.mjs --profile=develop` against that exact commit.
2. On that unchanged source, run one fresh local Compendium → Slice → Glass chain once/no-retry,
   with every named verifier. Stop after any red or ambiguity.
3. If locally terminal green, commit the exact evidence/docs descendant and rerun its tracked-input
   preflight without rebinding the browser certificate.
4. Only then obtain Nick's fresh exact authorization naming the final head, base
   **7a9f4c1370dd84292388d718c38ff34214f6203b**, PR #35, `test-battery`,
   `actions-budget-approved`, 92-minute maximum and no retry. Push/update/run exactly once.
5. Merge PR #35 into `develop` only if that exact hosted attempt is terminal green and branch
   protection is satisfied. Claude then begins the requested full-plan polish review from a fresh
   `anthropic/*` branch at the exact `develop` merge commit.

### Product vision and HUMAN boundary

The browser game remains the main bread-and-butter product: a deterministic, effectively infinite
universe built for repeat exploration, mining, crafting, exceptional loot and Pureforged gear,
creature discovery/care/breeding and Pokémon-like combat, Guardian progression and long-term return
play. Existing implemented systems and source-aligned references remain the foundation.

Authored visual/listening/accessibility/first-journey judgment, physical phone/tablet install, heat,
battery and true-GPU review remain HUMAN. Explicitly parked design/production work remains in the
system references and `port/V2_PROGRAM_ROADMAP.md`; this harness repair changes no Arc/Gate status.

### Paired Git/Claude handoff

- **OpenAI/Codex next:** sign the bounded Share-sequence successor, run its tracked-input rehearsal,
  then run one exact no-retry Compendium → Slice → Glass chain. Do not push, label or dispatch
  until the final candidate is
  terminal green locally and Nick supplies a fresh exact hosted authorization.
- **PR:** existing draft #35, base **develop**, source **openai/mac**. Copy-ready title:
  **feat(v2): complete roadmap campaign and harden action-time CI evidence**.
- **Copy-ready PR description:** “Completes the established v2 roadmap campaign without recreating
  its systems; preserves creature/genome/universe art structures; hardens action-time evidence and
  exact Survey/Share predecessor settlement; derives the valid one-or-two receipt Share topology
  from same-transaction canonical catalog plus legacy state; and causal-stops descendants after
  any red. Product behavior, saves, CSS, numeric rulers, retry and browser-version policy are
  unchanged. No release, version bump, preview or deployment is included.”
- **Claude Code next:** Nick does **not** need to open Claude yet. Open it only after PR #35's final
  exact head is terminal green and merged into `develop`; Claude must use a fresh `anthropic/*`
  branch and must not edit this OpenAI worktree.
- **Release status:** no release, version bump, preview publication or deployment is in progress.
