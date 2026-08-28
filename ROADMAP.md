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

## ▶▶▶ SESSION HANDOFF — 2026-08-27 · FINAL6 STOPPED AT SLICE · INVENTORY CAUSAL REPAIR READY FOR SIGNED SUCCESSOR ◀◀◀

### Exact local boundary

- **Owner/environment:** OpenAI/Codex desktop on macOS, exact root
  `/Users/nick/Projects/celestial-frontier-openai-mac`, branch `openai/mac`, upstream
  `origin/openai/mac`. Do not edit another agent's worktree or the sibling live-site repository.
- **Signed Final6 source:** `ea845d77d9783599c269f708462eb650e2c3e245` (tree
  `1d041580e3977555898b9f8efaef9f3db5ab2166`, parent `39e4f20…`) has a verified good ED25519
  signature and was 91 commits ahead of `origin/openai/mac` before the current local repair.
- **Current worktree:** dirty only for the bounded Slice evidence repair, its structural tests,
  preserved Final6 carriers, synchronized references and the species-strip browser-resolver repair.
  No product behavior, numeric ruler,
  deterministic content, save format or release identity changed. Do not claim post-repair
  campaign/Slice browser evidence until a new signed clean successor runs.
- **Hosted authority:** `GITHUB_ACTIONS_BUDGET.md` is `UNFROZEN` and the repository is public, but
  **zero exact hosted attempts are currently authorized**. The 3,000 cap remains fail-closed if
  repository visibility becomes private or ambiguous. No push, PR creation/update, label,
  dispatch, rerun, merge, deployment, publication or production version bump is authorized by the
  mode alone.

### Immutable Final6 campaign result

- Layout `20260827-phase4-final6-ea845d77d978-layout`: **PASS 787/787** in 75,826 ms; named
  verifier PASS.
- SceneMemory `20260827-phase4-final6-ea845d77d978-scenemem`: **PASS 42/42** in 10,085 ms;
  named verifier PASS.
- Compendium `20260827-phase4-final6-ea845d77d978-compendium`: **PASS 78/78** in 45,661 ms;
  all six review PNG bindings present; named verifier PASS.
- Slice `20260827-phase4-final6-ea845d77d978-slice`: one terminal **FAIL** after 420,570 ms,
  five findings/five scopes, one attempt and zero retry. Glass and recovery correctly did not start.
- Root cause: the exact valid 164px thermal Inventory button had raw center `x=1035.5, y=751`,
  below its scrollport. The old collector neither revealed nor scrolled it before skipping the
  click. The missing detail/equip/close/reload outcomes were causal instrument cascades, not four
  independent product findings. Edge `151.0.4129.107` / CDP `1.3` is provenance only.
- Final6 is immutable and cannot resume. Its exact preserved carriers, compressed/raw sizes and
  hashes are recorded in `audits/README.md`:
  - `PHASE4_LAYOUT_CURRENT_INPUT_PASS_20260828_014710842.json.gz`
  - `ARC1C_SCENEMEM_CURRENT_INPUT_PASS_20260828_014750410.json.gz`
  - `COMPENDIUMMEM_CURRENT_INPUT_PASS_20260828_014927668.json.gz`
  - `ARC4_SLICE_CURRENT_INPUT_FAILURE_20260828_015651534.json.gz`
  - `ARC4_SLICE_CURRENT_INPUT_FAILURE_20260828_015651534.log.gz`

### Current bounded repair

- The collector now resolves the exact Inventory instance, requires a connected enabled native
  button owned by the exact Inventory surface, calls native `scrollIntoView`, waits for both a
  rendering opportunity and a later task, and records pre/post center, scrollport, clipping,
  containment, movement and exact center-hit ownership.
- Trusted row and action receipts bind exact target, type, trust and client coordinates. Both the
  44×44 detail Close and registered-panel Close paths bind exact pointer ownership plus raw
  display/ARIA/focus/inert/lifecycle/selected-instance outcomes. Detail Close also proves its parent
  Inventory remains visibly open and opener-expanded; reload binds exact receipt keys, raw bytes,
  parsed semantics and stable F4 seed/ordinal/draw authority, including the Equip witness.
- Every mutable descendant now requires a complete green causal prefix. A failed opener, row,
  detail surface, action, Close, reload or Atlas prerequisite records only its actionable root
  finding and terminates dependent judgments rather than manufacturing product cascades.
- `smoke:report:selftest` carries directionally independent controls for reachability, both Close
  contracts, receipts, lifecycle fields and every prefix. The structural Vitest pins ordering and
  ownership, deletion-tests every terminator/binding, reverses causal guards and rejects stale
  fields/reasons. Independent browser-free glass/oracle and reload-durability reviews are CLEAR.
- The complete current-byte browser-free battery is green: 137 Vitest files / 1,483 passed / one
  intentional skip; root/app/worker TypeScript; `artunused`; 887-module build; Slice, Glass,
  recovery, Compendium, preview and persona selftests; exact producer authorities; root validation,
  50-probe v1 fingerprint and diff/syntax checks. The separately browser-owning species-strip
  selftest also passed its valid Earth/procedural and intentional-unknown controls out of sandbox.
  Final whole-diff code, reload-durability, glass/oracle and documentation reviews are all CLEAR.
  The remaining pre-campaign step is the signed clean successor commit and identity verification.
- This is instrument-only work, so `V2_DRAFT_RELEASE`, production version and player release notes
  remain unchanged.
- The optional species-strip art checker also shed its stale Windows-only Edge path and now uses the
  shared cross-platform browser-executable resolver and completes a real CDP render. Its positive Earth/procedural render
  and intentional unknown-species rejection both pass on this Mac; compatible point updates remain
  non-baseline inputs and do not move art thresholds. Species Strip does not itself emit a browser
  provenance certificate.

### Next exact execution sequence

1. Commit the completed reviewed repair with a verified signature, verify clean tree/source
   identity and create a fresh Final7
   campaign identity. Final6 IDs and evidence must never be reused or overwritten.
2. On the unchanged signed successor, run exactly once and serially:
   **Layout → SceneMemory → Compendium → Slice → Glass → recovery**, with fresh run IDs, exact
   stage producer authority and each named verifier. On macOS, request approved out-of-sandbox
   execution on the first attempt for each browser-owning command.
3. Any red or instrument failure stops the chain immediately. Preserve actionable report/log
   evidence, do not auto-retry and do not run downstream stages.
4. Only after the full chain is green may the playable Phase-4 checkpoint be called stable and the
   queued visual-polish implementation begin. HUMAN journey/listening/assistive-technology review,
   hosted evidence and production release remain separate open authorities.

### Queued universe-wide visual polish — not implemented yet

- Nick approved carrying the reference video's richer presentation across the **entire universe**:
  galaxy/system space, planets, all biomes, creatures, plants, ships and effects. Sol is a
  calibration scene only, never a Sol-specific branch.
- This is a systemic treatment layer: stronger warm/cool separation, controlled bloom,
  atmospheric depth/haze, rim/specular highlights, silhouette separation and bounded particles,
  with deterministic environment-local variation.
- **Polish, do not redesign.** Preserve authored biome compositions; organism anatomy, silhouette,
  proportions, scale and placement role; seed identity; rarity/grade cues; interaction geometry;
  and gameplay readability. No random or hand-authored per-seed exceptions.
- Acceptance needs representative before/after identity comparisons across warm/cool, dark/bright,
  inhabited/lifeless, terrestrial/ocean/gas and flora/fauna cases; same-seed determinism;
  high-contrast and reduced-motion behavior; and phone heat, frame-time, texture/cache, particle and
  retained-resource budgets. Device-class degradation may reduce effects, never content identity.
- Current truth is recorded in `ART_DIRECTION.md`, `BIOME_ATLAS.md`,
  `UI_PRESENTATION.md`, `EXPLORATION_SHIPS_LOOT_AND_COMPANIONS.md`, `port/RUBRICS.md` and
  `port/V2_PROGRAM_ROADMAP.md`.

### Broader remaining plan and paired handoff

- After the stable campaign and visual pass: run the complete whole-plan code/documentation polish
  review, address only evidence-backed findings, repeat the affected gates, then package HUMAN
  review. Production release/deploy/version work requires separate explicit authorization.
- **Current side: OpenAI/Codex** — continue here; finish and sign the local repair, then run Final7
  from Layout. Nothing in this batch is pushed or merged yet.
- **GitHub step: none.** `UNFROZEN` mode alone authorizes no push, PR write, label or hosted run;
  report the final local commit and ahead count.
- **PR details:** not needed now. If Nick later authorizes the exact GitHub write, use base
  `develop`, source `openai/mac`, title
  **`Phase 4: complete the playable-slice campaign repair`**, and description
  **`Repairs the fail-closed Slice Inventory evidence chain, preserves Final6 evidence, completes the fresh signed verification campaign, and synchronizes the Phase-4 references.`**
- **Other side: Anthropic/Claude Code** — Nick does **not** need to open Claude now. Claude has no
  unmerged change to synchronize with this batch and should wait until the future PR is merged into
  `develop` before syncing it; do not copy files manually or edit against this dirty campaign work.
- **Release status:** no release or deployment performed; `develop`, `main` and the live site are
  unchanged.
- **Actions budget:** `UNFROZEN`; repository public; 3,000 fail-closed cap whenever private or
  ambiguous; zero exact hosted attempts authorized.
