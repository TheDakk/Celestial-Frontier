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

## ▶▶▶ SESSION HANDOFF — 2026-09-02 · TENTH HOSTED SCENEMEM STOP · LOCAL SCOPE SUCCESSOR ◀◀◀

### Exact current boundary

- **Verified owner:** OpenAI/Codex on macOS at
  `/Users/nick/Projects/celestial-frontier-openai-mac`, branch **openai/mac**, tracking
  **origin/openai/mac**. Local and remote head remain exact SSH-signed
  **18c088de4388edf58eda2c192b71cb94156e26e7** against `origin/develop`
  **7a9f4c1370dd84292388d718c38ff34214f6203b**.
- The shared worktree is intentionally dirty with one uncommitted, bounded SceneMemory workflow/
  scope successor, its focused controls, immutable hosted diagnosis and synchronized current
  references. Preserve every existing change.
- No game source, SceneMemory collector, product ruler, memory ceiling, deterministic mutation
  contract, browser-family contract, timeout or retry rule changed. Production SceneMemory remains
  strict and blocked pending Nick's explicit future activation decision.

### Tenth exact hosted attempt — immutable consumed red

- Nick's one-time PR #35 `test-battery` authority for exact head **18c088de…** against exact base
  **7a9f4c1370dd84292388d718c38ff34214f6203b** was consumed by GitHub run
  **33584052508**, attempt 1, synthetic merge
  **48c72f436ae7156b3c110ca061acd81ac146e6ed**. Authorization job
  **100104337298** passed; required `battery` job **100104355093** stopped terminal red after
  **6m19s**. There was no retry.
- Root validation through the sealed 10-viewport Layout ruler passed **787/787** with fresh
  evidence. The first and only red was the next step,
  `scene-memory fixed-eighth phase-validity selftest`, after 1.56 seconds:
  P8−P7 `embedderHeapUsedSize` and derived aggregate moved **532,800 bytes** against the fixed
  **65,536-byte** phase ceiling.
- The synthetic control opened `about:blank`, retained one deliberate 524,288-byte
  `Uint8Array`, and stopped before its later growth/release lanes. It never loaded Celestial
  Frontier, created a product memory contract, evaluated a product verdict or produced game
  outcomes. Cleanup passed.
- Exact SceneMemory tool blob `835c0ab24fac93a9afedbc5cbd49555c323c4cdf` passed the same
  control in the three immediately preceding hosted runs on Edge **152.0.4191.53**, V8
  **15.2.23.6**, CDP **1.3**, Node **26.8.1** and the same Ubuntu image. A bounded local diagnostic
  also passed all eight exact slopes with zero embedder/backing delta. The evidence diagnoses
  mutable host/runtime allocator phase, not a game regression or Edge-version rebaseline.
  The failing path proved canonical Edge/CDP **1.3** but did not preserve the exact Edge point
  version; `.53` for that failed run would be inference. See
  `audits/ARC1C_SCENEMEM_PR35_HOSTED_PHASE_INSTRUMENT_RED_20260902_18C088D.md`.
- Artifact `battery-evidence` ID **9829548871** is **33,817 bytes**, digest
  `sha256:ed2161535f9d5ddfe3c4f606403d07f540a4cd7f359120f0515b2a4e35085213`, expiring
  `2026-09-16T02:46:18Z`. It contains only the three root Layout evidence files because the
  failing selftest emitted no SceneMemory report. Compendium, Slice, Glass, Recovery and preview
  packaging correctly skipped.
- The run and evidence remain immutable red. Its authorization is consumed and cannot be reused.
  There is **no authority** to push, mutate PR metadata, label, dispatch/rerun Actions, mark Ready,
  merge, release, version, preview, publish or deploy.

### Bounded local ownership correction

- Current-Edge installation, the live fixed-eight retained-allocation selftest, SceneMemory
  certification and named verification are now all **production-only** and remain strict,
  fail-fast owners there.
- Deterministic SceneMemory contract, pass-order, threshold, detachment, forged-evidence and
  historical-red mutation controls remain universal in the static v2 suite.
- The former combined browser-instrument classifier is split: Compendium/selftest inputs own
  `compendium_instrument_changed`; shared transport inputs own
  `browser_transport_changed`. SceneMemory-only collector/budget changes do not leak the live
  native-heap control into `develop`.
- Develop admission remains the complete sealed
  **Compendium → Slice (`develop`) → Glass (`develop`)** chain on one unchanged clean source.
  SceneMemory certification and Recovery remain outside `develop`.
- The fixed **64 KiB** phase ceiling, eight-pass policy, 512 KiB retained allocation, 128 KiB/cycle
  slope and all cleanup/negative controls remain unchanged. This is workflow ownership repair, not
  threshold widening, extra sampling, retry or another sampler redesign.

### Local verification already green

- Focused workflow/evidence coverage passes **3 files / 27 tests**.
- The complete browser-free `develop` profile passes **263/263 files, 2,719 passed / 1 skipped**;
  all three TypeScript programs pass, with **34** clean art sources, **1,014/1,014** routes and
  **454** active fields.
- The complete art mutation control, browser-path selftest, Compendium browser-preflight selftest,
  Compendium **618-control** selftest and shared browser-CDP selftest all pass.
- This is still an uncommitted candidate. Independent review, exact signed clean-source preflight
  and a fresh unchanged-source browser chain remain required; these green checks do not create
  hosted authority.

### Exact remaining local closure

1. Complete independent diff review and current-reference agreement. Confirm the workflow has no
   `develop` path to SceneMemory install, live selftest, certification or verification, while all
   deterministic SceneMemory mutation owners remain selected.
2. Create one SSH-signed clean-source successor containing the bounded workflow/scope repair,
   controls, immutable hosted audit and synchronized references. Record its exact commit/tree and
   verify a clean worktree.
3. Run the hermetic tracked-input `develop` preflight once on that exact signed source. Then run
   exactly one fail-fast/no-retry, named-verified
   **Compendium → Slice (`develop`) → Glass (`develop`)** chain on the same unchanged source;
   stop after any nonzero, red or instrument result. Do not run live SceneMemory or Recovery.
4. If green, preserve the exact Compendium/Slice/Glass report and Slice log carriers, update the
   current references in one signed docs-only descendant, run the final clean tracked-input
   preflight, and do not rerun or rebind the browser certificate.
5. Stop locally and request Nick's fresh exact authorization naming the final full head/base,
   PR #35, `test-battery`, `actions-budget-approved`, the 92-minute maximum and no retry.
   Only that authority permits pushing `openai/mac`, refreshing PR metadata and running one hosted
   attempt; merge into `develop` only if that exact head is terminal green and branch protection
   is satisfied.

### Product and HUMAN boundary

The browser game remains the main product: an effectively infinite deterministic universe for
exploration, mining, crafting, Pureforged loot, creature care/breeding and Pokémon-like combat,
Guardian progression and long-term return play. This batch changes admission ownership only and
does not recreate or alter established gameplay, creature, universe, art or audio systems.

Authored visual/listening/accessibility/first-journey judgment, physical phone/tablet install, heat,
battery and true-GPU review remain HUMAN. Explicitly parked design and production work stays in the
system references and `port/V2_PROGRAM_ROADMAP.md`; automated admission does not silently claim it.

### Paired Git/Claude handoff

- **OpenAI/Codex next:** complete the five local closure steps above, then stop for a fresh exact
  hosted authorization. Do not reuse run 33584052508 or its label.
- **PR:** existing #35, base **develop**, source **openai/mac**. Copy-ready title:
  **feat(v2): complete roadmap campaign and harden action-time CI evidence**.
- **Copy-ready PR description:** “Completes the established v2 roadmap campaign without recreating
  its systems; preserves the immutable tenth hosted SceneMemory allocator-phase instrument red;
  makes live native-heap selftest/certification strictly production-only while retaining universal
  deterministic SceneMemory mutation controls; splits Compendium and shared-browser scope owners;
  and preserves develop's exact no-retry Compendium → Slice → Glass admission chain. No product
  ruler, threshold, browser-version policy, release, version bump or deployment is changed.”
- **Claude Code next:** Nick does **not** need to open Claude yet. After PR #35 is terminal green
  and merged into `develop`, open Claude/Fable for the requested full polish review from a fresh
  `anthropic/*` branch. Claude must fetch/merge `origin/develop` in its own clean worktree and
  never edit or copy files from this OpenAI worktree.
- **Integration/release:** current branch → PR #35 → `develop` only after exact hosted green.
  `develop` → `main`, SceneMemory activation, release/version/deploy and production evidence are
  separate explicit authorizations.
- **Actions budget:** mode **UNFROZEN**, repository assumed public while verified, private fallback
  cap **3,000**, and **zero** hosted attempts currently authorized.
