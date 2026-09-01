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

## ▶▶▶ SESSION HANDOFF — 2026-09-01 · SHARE WAITER LEXICAL-SCOPE REPAIR BROWSER-FREE GREEN ◀◀◀

### Exact current boundary

- **Owner/scope:** OpenAI/Codex desktop on macOS at
  `/Users/nick/Projects/celestial-frontier-openai-mac`, branch **openai/mac**, upstream
  **origin/openai/mac**. Exact clean SSH-signed source
  **3f8f8704c851fc4c7547b8644d008dd1bba5d34f** (tree
  **979726f7035e7ca3c45de4fb80565b5d0d2d4481**, parent
  **c0f7215bd1ec932f6357b6cfc1e045b5644ba389**) contains the browser-free-green Share fixed-point
  repair and passed its clean tracked-input develop preflight.
- Browser-CDP selftest and live Compendium preflight passed on Edge **152.0.4191.53** / CDP
  **1.3**. Browser point version remains per-run provenance and does not trigger a rebaseline.
- Compendium **20260901072803827-52451-8168677f8e** passed **78/78** once/no-retry in
  **65,672 ms** with zero findings or blocked outcomes and six review PNGs. Exact named verification
  passed before Slice. Producer authority was
  **410d2639ec981647adc20b3ae00576c0d60839296c7b763333fa2a00c79b42a6**; budget authority was
  **78269c722c0d64438c0d407e0d8df3a8a284715af35bff94ed6f7d8dbba569c2**.
- Exact-source develop Slice **20260901072936648-52803-f33e3b0b5239** then stopped terminal red
  once/no-retry after **336,730 ms** with exactly **1 finding / 1 scope**, `harness`, message
  `waitForF4ActionSequenceFixedPoint is not defined`, and all ten screenshots. Glass correctly did
  not run, and 3f8f870 was not retried or relabelled.
- **Hosted authority:** PR #35 still has five consumed hosted terminal-red attempts against base
  **7a9f4c1370dd84292388d718c38ff34214f6203b**. All approval labels are absent. No push, label,
  hosted attempt, retry, Ready transition, merge, release, version bump, preview/publication or
  deployment is currently authorized. PR #35 remains Draft/unmerged; `develop`, `main` and the
  live site are unchanged.

### Exact 3f8f870 stop and complete diagnosis

- Exact 3f8f870 completed the ordinary journey and all ten required screenshot surfaces, then
  entered collision controls through boot, import, baseline and the first named Search gesture. It
  failed before Search settlement; collision Share was never reached, so this exact run did not
  cross or retest c0's `collision-share-1` boundary.
- The shared `waitForF4ActionSequenceFixedPoint` declaration was nested inside the first
  `if (!OUTCOME_CONTROLS_ONLY)` block. The later collision controls intentionally run outside that
  block and called the otherwise-correct helper from a lexical scope where it did not exist.
- The terminal message was therefore an instrument ReferenceError after the real journey, not a
  product, gameplay, save, progression, presentation, browser-family or timeout finding.

### Browser-free-verified dirty bounded successor

- The unchanged waiter is lifted only to the enclosing `try`, above the full-journey gate, so both
  the ordinary journey and outcome-controls-only collision adapter share one lexical owner. Its
  exact receipt, authority and settlement semantics are unchanged.
- An Acorn lexical-visibility audit requires exactly one waiter declaration, inventories all five
  direct calls and proves every call occurs after and inside the declaration's scope. Its re-gated
  historical mutant leaves one call inaccessible and must fail.
- Focused four-file verification passes **58/58**; all TypeScript programs, `node --check` and the
  collision-only real-Edge diagnostic—including collision Share and reload—pass. The complete
  develop profile passes **259 files /
  2,660 passed / 1 skipped**, **34** clean art sources, **1,014/1,014** routes and **454**
  specification fields with zero inert fields. Independent code audit is **APPROVED**.
- The successor is a dirty, unsigned working tree. It inherits no browser certificate from exact
  3f8f870; a new clean signed candidate and fresh chain are mandatory.

### Immutable exact-source evidence

- Compendium PASS:
  `audits/ARC1A_COMPENDIUM_PR35_SHARE_FIXED_POINT_PREDECESSOR_PASS_20260901_3F8F870.json.gz`
  — gzip **453,021 bytes**, SHA-256
  `38773d1a6824755974904db9a65e02e3f0a46f1f93fd65b283a84f2b6bdda686`; raw
  **10,829,352 bytes**, SHA-256
  `334135eb4832f8df14d543643319b3c345527f6fb01d81ff361171bb1bbfdf40`.
- Slice FAIL:
  `audits/ARC4_SLICE_PR35_SHARE_WAITER_LEXICAL_SCOPE_RED_20260901_3F8F870.json.gz`
  — gzip **1,867 bytes**, SHA-256
  `32739f49df0b72d583092f1fe4faf508dbeaf81404d66ed0c02857d5a1b214cb`; raw
  **5,954 bytes**, SHA-256
  `08b57e977ffce25e7c328c0c84b6742d26eb78a6a9c0a5400c7d6526c07101d0`.
- Slice log:
  `audits/ARC4_SLICE_PR35_SHARE_WAITER_LEXICAL_SCOPE_RED_20260901_3F8F870.log.gz`
  — gzip **1,509 bytes**, SHA-256
  `c9547a98a94c1899ae09b88abee5ff8d38bdd87b0d23a44f9085ae686edd5de8`; raw
  **3,746 bytes**, SHA-256
  `18f1bf064ff918548ef0855af554244b513e71f7fbfd2f065c51bf95ab046a08`.
- All three carriers pass gzip integrity and deterministic `gzip -n -9` recompression. They bind only
  exact signed 3f8f870. Older c0 and hosted reds remain immutable history.

### Unchanged product and program boundary

Gameplay and Share/fixed-point semantics, save schema/semantics, CF1, deterministic generation,
creature/genome/plant/biome/Guardian structures, art/audio, copy, CSS, focus and geometry are
unchanged. Browser-family/CDP policy, numeric rulers, timeouts and one-attempt/no-retry policy are
unchanged. Compendium's sealed 78 outcomes and producer remain unchanged. SceneMemory remains
production-only/quarantined; Recovery is not part of develop. No roadmap feature, Arc/Gate/HUMAN
status, preview rule, release identity, version or deployment status changed.

### What remains

1. Commit the lexical-scope repair and synchronized docs/evidence as one clean SSH-signed candidate,
   then run
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

- **OpenAI/Codex next:** sign the bounded Share-waiter lexical-scope successor, run its tracked-input
  rehearsal, then run one exact no-retry Compendium → Slice → Glass chain. Do not push, label or dispatch
  until the final candidate is
  terminal green locally and Nick supplies a fresh exact hosted authorization.
- **PR:** existing draft #35, base **develop**, source **openai/mac**. Copy-ready title:
  **feat(v2): complete roadmap campaign and harden action-time CI evidence**.
- **Copy-ready PR description:** “Completes the established v2 roadmap campaign without recreating
  its systems; preserves creature/genome/universe art structures; hardens action-time evidence and
  exact Survey/Share predecessor settlement; derives the valid one-or-two receipt Share topology
  from same-transaction canonical catalog plus legacy state; keeps its shared waiter lexically
  visible to both journey modes; and causal-stops descendants after any red. Product behavior,
  saves, CSS, numeric rulers, retry and browser-version policy are
  unchanged. No release, version bump, preview or deployment is included.”
- **Claude Code next:** Nick does **not** need to open Claude yet. Open it only after PR #35's final
  exact head is terminal green and merged into `develop`; Claude must use a fresh `anthropic/*`
  branch and must not edit this OpenAI worktree.
- **Release status:** no release, version bump, preview publication or deployment is in progress.
