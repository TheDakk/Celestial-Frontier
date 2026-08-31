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

## ▶▶▶ SESSION HANDOFF — 2026-08-31 · 6AE RED PRESERVED · REPAIRS + FAST DEVELOP BOUNDARY GREEN ◀◀◀

### Exact current boundary

- **Owner/scope:** OpenAI/Codex desktop on macOS at
  `/Users/nick/Projects/celestial-frontier-openai-mac`, branch **openai/mac**, upstream
  **origin/openai/mac**. Exact clean SSH-signed source before this dirty local repair is
  **6ae723afadf04aeecdff9c41b598777634ebba3e**, whose parent
  **186b653456542588c2e4fe5db46234ccdebeb1d0** implements the develop/production assurance split.
  The worktree contains the bounded repair, its mutation controls, immutable evidence carriers and
  current documentation; it is not yet a clean signed successor.
- **Exact Compendium predecessor:** run
  `20260831-pr35-assurance-split-6ae723a-compendium-certification` passed **78/78** in
  **68,137 ms** on Edge `152.0.4191.53` / CDP `1.3`, with complete cleanup and its exact named
  verifier green.
- **Immutable Slice stop:** on the same unchanged clean 6ae source, run
  `20260831-pr35-assurance-split-6ae723a-slice-certification` ran once/no-retry and stopped after
  **224,032 ms** with **4 findings / 4 scopes**. Its PASS verifier correctly rejected the report.
  Glass did not run. The red is preserved and will never be retried or relabelled.
- **Evidence:** deterministic Compendium PASS and Slice JSON/log carriers, their raw/gzip sizes and
  SHA-256 hashes, and the causal diagnosis are recorded at the top of `audits/README.md`.
- **Browser-free repair boundary:** the bounded successor passed **6 focused files / 65 tests** and
  all three strict TypeScript programs. Its one consolidated
  `node tools/check-profile.mjs --profile=develop` boundary is green at **253/253 files / 2,551
  passed / 1 skipped**, all three TypeScript programs, **34** art sources with zero findings,
  **1,014/1,014** routes and **454** specification fields with zero inert fields. No fresh browser
  claim is made yet.
- **Scope:** the three findings are instrument ownership/oracle defects. This repair adds no player
  capability, save-schema, creature/genome, art/audio, balance, timeout, retry, browser ruler,
  Edge-version baseline, SceneMemory threshold or release-identity change.

### Three independent roots and bounded fixes

1. **Training source-error route:** the fixture borrowed normal Survey→Landing while
   `trainingCheckpointWriteHeld` was active, so the correctly write-bearing Survey path refused
   before reaching Training's existing route-only landing owner. A strict smoke-only route now
   requires active Training, the write hold, current System mode and the exact current-system
   planet, presents the write-free card and enters existing `doLand` synchronously. Setup failure
   stops causally instead of manufacturing a second rendered-scene finding.
2. **D-TRAIN post-reload successor:** after Training commits `R2`, the injected post-durable
   publication failure reloads and Arc 9 correctly commits the fresh-document successor at
   **revision R3**, with **one** progression receipt, **ordinal +1**, unchanged RNG seed/draws and
   the exact final unlocked-achievement set/best rank. The assessor and its independent negative
   controls now bind that real final state while leaving all other D-TRAIN cases receiptless.
3. **Lazy Compendium asset representation:** the product intentionally converts decoded 132 px
   thumbnail data into Window-owned revocable **Blob URLs**. The observation now requires decoded
   `blob:` assets, treats document/API loss as structured non-settlement, and guards old-row globals
   when a replacement document republishes diagnostics. The exact generated expression is compiled
   and mutation-tested browser-free.

### Fast-gate closure

- The first consolidated run stopped in **28 seconds**, before any browser, on two deterministic
  stale boundaries: the async Landing inventory had not counted the new guarded Training route,
  and the all-profile producer test still made quarantined SceneMemory source identity block
  `develop`. Both are repaired and mutation-controlled; this is the intended short edit→diagnose
  loop rather than another hours-long Edge attempt.
- Compendium measurement/producer authority remains exact in every profile. Its current producer is
  **1a47c883e8713e263b69ad7ab5edc3016403c871ad7288a86d0838bc685d0cb0** under budget SHA-256
  **81caabc08443fd1463e29fcb88e02e8ae92b81ae21a8cfd6ab3aa5b0022bc025**; numeric rulers and
  historical evidence are unchanged.
- `check-profile` now overwrites inherited profile state for every child. Direct `npm test` defaults
  to `dev`; Compendium binds in `dev|develop|production`; SceneMemory current-product binding rejoins
  only `production`. SceneMemory source/build mutation tests still run in every profile, and the
  standalone authority printer remains all-authorities fail-closed. No command, workflow job or
  battery stage was added.

### Exact next work

1. Finish this exact-count documentation refresh and final diff check, then create one SSH-signed
   local commit on **openai/mac**. The instrument repair and profile-scope reviews are both clear.
2. Only from that unchanged clean signed source, run at most one fail-fast/no-retry
   **Compendium → Slice (`develop`) → Glass (`develop`)** chain. Named-verify each exact report and
   stop immediately on any nonzero, red or instrument result. Do not run SceneMemory or Recovery.
3. If the local chain is green, preserve its evidence and refresh this handoff once. Any push,
   hosted battery, Ready transition or merge still requires Nick to authorize that exact head and
   hosted attempt under `GITHUB_ACTIONS_BUDGET.md`.
4. **SceneMemory remains production-only/quarantined.** Production remains
   **SceneMemory → Compendium → Slice (`production`) → Glass (`production`) → Recovery** and needs
   a future explicit SceneMemory activation decision.

### Product-roadmap and HUMAN boundary

This batch repairs evidence instruments around already-implemented behavior; it does not recreate
or redesign the game. Feed, Capture, the universe-wide art treatment, creature/genome identity,
capture math/pools, Guardians/Prime Codex, loot/Pureforged, exploration, crafting, combat,
care/progression, audio and deterministic persistence remain intact.

Still-open work requiring authored product decisions or HUMAN/device proof remains explicit in the
system references and `port/V2_PROGRAM_ROADMAP.md`: conquest-imbue coexistence, another Guardian
reward table, canonical mission/care/healing rules, broader Chronicle/Museum history, achievement
reward claims, Fifty Paragons, remaining production media/depth, veteran import, accessibility,
and physical phone/tablet install, heat, battery, true-GPU and first-journey judgment. Automation
must not invent those decisions merely to call the roadmap complete.

### Paired Git/Claude handoff

- **OpenAI/Codex now:** finish the bounded local repair, one consolidated develop static boundary,
  review and signed commit; then run no more than one exact no-retry develop browser chain.
- **GitHub step now:** none. Zero hosted attempts are authorized; do not push, label, dispatch,
  mark Ready, merge, release, version-bump, publish or deploy.
- **PR #35 after local green:** existing draft, base **develop**, source **openai/mac**, title
  **feat(v2): complete roadmap campaign and harden CI parity**. Its next exact push/hosted head is
  not authorized.
- **Claude Code now:** Nick does **not** need to open Claude yet, and Claude must not edit this
  OpenAI worktree. After PR #35 is terminal-green and merged into `develop`, Claude should create an
  `anthropic/*` branch from that exact integration commit for the requested whole-plan polish.
- **Release status:** `develop`, `main` and the live site remain unchanged. No release, version
  bump, preview publication or deployment is in progress.
