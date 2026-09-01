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

## ▶▶▶ SESSION HANDOFF — 2026-08-31 · FOURTH HOSTED RED · LAUNCHER REPAIR LOCAL ◀◀◀

### Exact current boundary

- **Owner/scope:** OpenAI/Codex desktop on macOS at
  `/Users/nick/Projects/celestial-frontier-openai-mac`, branch **openai/mac**, upstream
  **origin/openai/mac**. Current clean commit and pushed PR #35 head are exact
  **73b6f7bcb99e6ed7728794d8be66917ce2ae7d1a**; PR #35 base remains exact
  **7a9f4c1370dd84292388d718c38ff34214f6203b** on **develop**.
- The working tree contains a bounded shared-Chrome-launcher/workflow/authority repair. It is not a
  signed successor and has no current browser certificate. The prior exact `9b37ffc…`
  Compendium → Slice → Glass chain remains immutable historical evidence for its own bytes.
- **Authority:** GitHub run **33453239307** consumed PR #35's fourth authorized
  `test-battery` attempt. No push, label, hosted attempt, retry, Ready transition, merge, release,
  version bump, preview/publication or deployment is currently authorized. PR #35 remains
  draft/unmerged; `develop`, `main` and the live site are unchanged.

### Fourth hosted result and exact diagnosis

- Run **33453239307** tested exact head
  **73b6f7bcb99e6ed7728794d8be66917ce2ae7d1a** against exact base
  **7a9f4c1370dd84292388d718c38ff34214f6203b** once with no retry. Every invoked stage through
  Compendium passed, including Compendium **78/78** and its exact named verifier.
- The later shared Chrome launcher selftest stopped red because its unique temporary browser profile
  remained/reappeared after cleanup. Slice and Glass were correctly skipped. This is an immutable
  launcher-instrument failure, not a product, Compendium, Slice or Glass verdict.
- The old launcher owned only the directly spawned PID. It judged termination from that process,
  destroyed inherited stderr, removed the profile once and never proved descendant-tree quiescence.
  A surviving Chromium descendant could therefore recreate the supposedly removed unique profile.

### Consolidated local repair

- On POSIX, a healthy session first sends bounded CDP `Browser.close`; only a still-live owner
  escalates. POSIX owns one detached process group, applies bounded **TERM → KILL**, permanently latches
  `ESRCH` as gone and proves no-collateral sibling survival plus observable group quiescence.
- Windows disables `Browser.close` and requires successful bounded `taskkill /T`, escalating to
  `/F`; pre-exited or otherwise unproved cleanup fails closed. It claims neither Job Object
  ownership nor independently observable whole-tree quiescence.
- Cleanup proves the owned profile stays absent for **100 ms**, preserves the primary failure while
  attaching cleanup failure independently, and still cleans the browser when `ws.close()` throws.
- Workflow order now runs the changed-or-production Chrome launcher selftest before installing and
  running the long sealed exact-Edge Compendium certificate. Fail-fast order changes; the one-run,
  no-retry and uninterrupted exact-Edge preflight → certificate → verifier chain do not.

### Current authority and local verification

- Final derived Compendium measurement is
  **dc470bfd74284084425f6c737d7d421a93396cae9ac81e223492149d0e856836** and shared
  `browserCdp` input is
  **929acd22c89c9697c780a8220c0629278de5583eba8d5f0b74d52d9e3daea8b6**. Collector
  **ffe0494e42d5bf383141709d5ddeacaa65933ed7a7f1c51a85dac265d5b1621d**, outcome contract
  **1b17df2e4983b44d929acfb16cb3ed79250ad7c9b68e522418a44fb3a58d6692** and producer
  **af74148c97a41a421592baee801611787f065c60a64bf6da38985bf00bdd79c7** are unchanged.
- SceneMemory remains production-only/quarantined. Its tracked `calibration-required` authority is
  intentionally stale until a separate explicit production activation decision; develop ignores
  that mismatch, while production and the standalone all-authorities printer remain fail-closed.
- The repaired launcher selftest passes against real local Edge. The complete local develop profile
  passes **254/254 files / 2,567 passed / 1 skipped**, with all TypeScript programs and art,
  override, route and specification owners green.
- Focused current-authority coverage passes **32/32** and the final combined focused suite passes
  **160/160**. Its prior **159/160** result had only the expected `selectionRule` bookkeeping red
  after the Compendium authority rebind; that literal bookkeeping is repaired.
- Product code/bytes, CSS, the fixed **±2px** ruler, numeric ceilings, timeouts, retry/click policy,
  78-outcome inventory and version-tolerant Edge-family/CDP 1.3 policy are unchanged. No gameplay,
  save, deterministic generation, creature/genome/plant/biome/Guardian, art or audio semantics
  changed.

### What remains

1. Finish bounded local diagnostics/review, synchronize these references and commit the repair
   locally. Do not invent or pre-document the successor SHA.
2. From that exact clean signed successor, run one fail-fast/no-retry local
   **Compendium → Slice → Glass** develop chain with every named verifier. Stop after any red,
   nonzero, ambiguity or instrument result.
3. Preserve any fresh exact-source carriers and references in a signed descendant. Only after Nick
   gives a new exact authorization naming the final head/base, PR #35, `test-battery`,
   `actions-budget-approved`, 92-minute maximum and no retry may `openai/mac` be pushed and one
   new hosted attempt run.
4. Merge PR #35 into `develop` only if that exact hosted attempt is terminal green and branch
   protection is satisfied. Claude then begins the requested full-plan polish review from a fresh
   `anthropic/*` branch based on the exact integrated `develop` commit. Production remains a
   separate explicitly authorized campaign with SceneMemory activation.

### Product vision and HUMAN boundary

The browser game remains the main bread-and-butter product: a deterministic, effectively infinite
universe built for repeat exploration, mining, crafting, exceptional loot and Pureforged gear,
creature discovery/care/breeding and Pokémon-like combat, Guardian progression and long-term return
play. Existing implemented systems and source-aligned references remain the foundation; this
launcher repair neither recreates nor changes them.

Authored visual/listening/accessibility/first-journey judgment, physical phone/tablet install, heat,
battery and true-GPU review remain HUMAN. Explicitly parked design/production work remains in the
system references and `port/V2_PROGRAM_ROADMAP.md`; automated admission does not silently claim it.

### Paired Git/Claude handoff

- **OpenAI/Codex next:** finish the bounded repair diagnostics/docs and local commit, then produce one
  fresh exact-clean no-retry develop browser chain. Do not push, label or dispatch beforehand.
- **PR:** existing draft #35, base **develop**, source **openai/mac**. Copy-ready title:
  **feat(v2): complete roadmap campaign and harden action-time CI evidence**.
- **Copy-ready PR description:** “Completes the established v2 roadmap campaign without recreating
  its systems; preserves creature/genome/universe art structures; hardens Compendium Back evidence
  and shared raw-CDP browser cleanup; moves the launcher selftest ahead of the long exact-Edge
  certificate; and binds admission to one exact no-retry Compendium → Slice → Glass develop chain.
  Product behavior, CSS, fixed rulers and browser-version policy are unchanged. No release, version
  bump or deployment is included.”
- **Claude Code next:** Nick does **not** need to open Claude until the final exact PR #35 head is
  terminal green and merged into `develop`. Claude should then branch from that integration commit
  under `anthropic/*` for the full-plan polish review; Claude must not edit this OpenAI worktree.
- **Release status:** no release, version bump, preview publication or deployment is in progress.
