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

## ▶▶▶ SESSION HANDOFF — 2026-09-01 · EXACT 7A8D3A5 LOCAL DEVELOP CHAIN TERMINAL GREEN ◀◀◀

### Exact current boundary

- **Owner/scope:** OpenAI/Codex desktop on macOS at
  `/Users/nick/Projects/celestial-frontier-openai-mac`, branch **openai/mac**, upstream
  **origin/openai/mac**. Exact clean SSH-signed implementation source
  **7a8d3a59b6b516700e45737ec6b67a242a5f785d** (tree
  **517bf3e159a5694ea8e0f12a0e92b127329e6829**) is one commit ahead of the published branch and
  is based against current `origin/develop`
  **7a9f4c1370dd84292388d718c38ff34214f6203b**.
- The current working tree is an evidence/docs-only descendant: four deterministic PASS carriers
  plus synchronized references. Its eventual signed commit SHA is intentionally not self-embedded;
  resolve it after commit with `git rev-parse HEAD`. Preserve every existing change.
- No legacy game, gameplay, creature/genome/plant/biome/Guardian or product source changed. Exact
  cf2d176 and all earlier browser chains remain immutable historical evidence only; the distinct
  7a8d3a5 chain below certifies the current implementation.

### Eighth exact hosted attempt — consumed terminal red

- Nick authorized PR #35's one-time `test-battery` for exact head **c0ad51a…** against exact base
  **7a9f4c1370dd84292388d718c38ff34214f6203b**, label `actions-budget-approved`, maximum
  92 minutes and no retry. GitHub run **33560546382**, attempt 1, used synthetic merge
  **f03a68d75dd03512d2dc994febc9bb18e5b52d9c** with the exact head tree. Authorization job
  **100031692379** passed; battery job **100031723808** completed terminal red after **1h4m43s**.
- Root layout passed **787/787**. Compendium **gha-33560546382-1-compendiummem** passed **78/78**
  once/no-retry in **2,334,319 ms** with zero findings/blocked outcomes and six review PNGs.
- Slice **gha-33560546382-1-slice** stopped once/no-retry after **1,017,899 ms** with exactly
  **2 findings / 2 scopes**. Nine screenshots were retained: Codex, Earth, Galaxy, Guide, phone,
  Settings, Sol, Sol marker and Universe. Training was not reached. Glass, Recovery and preview
  packaging correctly did not run.
- Artifact `battery-evidence` is ID **9823195109**, archive size **9,535,484 bytes**, digest
  `sha256:aeed20df4017f83aea1333547ae0d5ab07cce0d1be22d1974dadcb3f8d5dc5e9`, expiring
  **2026-09-15T22:25:29Z**. The approval label was removed. The authorization is consumed, no retry
  or merge occurred, PR #35 remains Ready/open/unmerged, and **no hosted attempt, push, PR mutation
  or merge is currently authorized**.

### Exact diagnosis and bounded successors

- **Feed acknowledgement lifetime:** the product transaction was exact and durable: global
  revision **107→108**, ownership **16→17**, receipt count/SessionRNG ordinal **20→21**, exactly
  one `arc5-companion-feed` receipt at ordinal 20, fed **0→1**, flora **1→0** plus tombstone, one
  settled “Meal complete…” toast, zero pending work, same-document reopen and reload fixed point.
  Page instrumentation also retained one post-mark oscillator with successful start/connection in a
  running context. Normal short-voice cleanup disconnected its route before the expensive durable
  reads and first raw graph snapshot; final-only graph projection then falsely reported no live
  destination route.
- The audio successor retains an **ordered same-prefix temporal route witness** only while the
  unique post-source-mark oscillator and every same-context destination-path endpoint are
  simultaneously live, then preserves that witness through natural disconnect/destroy teardown. It
  never forms an unordered historical edge union: duplicate, missing, dead-end, false-destination,
  cross-context, connect-before-create and disjoint-time paths stay red.
- **Phone Landing predecessor:** the isolated fresh-phone flow opened Guide for the first time;
  Guide legitimately set `seenGuide` and started `persistView()`. The runner closed Guide and
  touched Land without reacquiring authority. The artifact retained only
  `phone Earth landing did not reach its phone outcome within 6000ms (last null)`; it does not
  directly prove a refusal reason. Source tracing supports the high-confidence root-cause inference
  because `doLand()` refuses while `activePersist` is owned.
- The phone successor closes Guide, quiesces the same-document F4 heartbeat and keeps it quiescent
  through three independently early-resolving waits, each capped at 15 seconds: post-Guide writable
  predecessor, live Land-surface observation and post-Land durable writable/idle fixed point.
  Exactly one native Land action occurs between those waits, then the heartbeat resumes exactly
  once in `finally`. Predecessor timeout evidence retains the complete F4/persistence/coordinator
  state and `landing.lastOutcome`; it never retries the action.
- The hosted run crossed and validated the prior Settings repair: all eleven controls completed
  mutate/restore through **22** exact real writes with raw-v5 continuity, quiet-window authority,
  quiesce/resume and controls. These two later findings do not reopen Settings.

### Verification and immutable evidence

- The combined focused boundary passes **3 files / 21 tests**. The fresh-wait ownership file
  separately passes **8/8** after adding the two exact new wait labels. All three TypeScript
  programs pass.
- Exact clean 7a8d3a5 passes the hermetic tracked-input `develop` preflight at **260 files / 2,675
  passed / 1 skipped** (**2,676 total**), **34** clean art sources, **1,014/1,014** routes and
  **454** declared/non-inert fields.
- That unchanged source completed one serial, fail-fast/no-retry local develop chain on Edge
  **152.0.4191.53** / CDP **1.3**; the point version is provenance only. Every named verifier
  passed. Compendium **20260901230136598-19910-e9b7eb9b5e** passed **78/78** in **65,672 ms**
  with zero findings/blocked outcomes. Slice **20260901230304318-20264-c5997bf96c8f** passed
  terminal certifying under `develop` in **376,101 ms** with zero findings/scopes and ten
  screenshots; report/log SHA-256 is **12e9b797…32c8a / 887e9d3d…a63e5**. Glass
  **20260901230935469-20802-a0d3c9067c92** consumed that exact Slice and passed **12/12**
  viewports, **12/12** reload rows, **104/104** controls and **36/36** Arc 4 outcomes in
  **116,633 ms** with zero findings/instrument failures; report SHA-256 is
  **c9dcc93e…5b64**.
- Hosted evidence is preserved as deterministic `gzip -n -9` carriers:
  `ARC1A_COMPENDIUM_PR35_FEED_AUDIO_ROUTE_PHONE_LANDING_PREDECESSOR_PASS_20260901_F03A68D.json.gz`
  (gzip **487,306** bytes / SHA-256 **61ae809d…96bf**; raw **12,846,608** /
  **e072796c…d040**), `ARC4_SLICE_PR35_FEED_AUDIO_ROUTE_PHONE_LANDING_RED_20260901_F03A68D.json.gz`
  (gzip **84,367** / **81a1858f…e17e**; raw **800,679** / **d34b160e…492**) and its log
  (gzip **39,079** / **cec392ef…efcd**; raw **343,139** / **3b352cc9…e58c**). Every full hash is
  indexed in `audits/README.md`; gzip integrity and deterministic recompression pass.
- Exact 7a8d3a5 PASS evidence is preserved as four deterministic carriers: Compendium
  `ARC1A_COMPENDIUM_PR35_FEED_AUDIO_PHONE_LANDING_REPAIR_PASS_20260901_7A8D3A5.json.gz`
  (gzip **451,640 / 1d79a88c…677a**; raw **10,826,781 / 4755265d…6b3c**), Slice report
  `ARC4_SLICE_PR35_FEED_AUDIO_PHONE_LANDING_REPAIR_PASS_20260901_7A8D3A5.json.gz`
  (gzip **1,958 / dbc970cc…1abf**; raw **6,126 / 12e9b797…32c8a**), Slice log
  `ARC4_SLICE_PR35_FEED_AUDIO_PHONE_LANDING_REPAIR_PASS_20260901_7A8D3A5.log.gz`
  (gzip **3,290 / 42e1b210…4518**; raw **6,950 / 887e9d3d…a63e5**) and Glass
  `ARC4_GLASS_PR35_FEED_AUDIO_PHONE_LANDING_REPAIR_PASS_20260901_7A8D3A5.json.gz`
  (gzip **78,874 / 4ca9229f…a660**; raw **898,861 / c9dcc93e…5b64**). Full hashes are in
  `audits/README.md`.

### What remains

1. SSH-sign the evidence/docs-only descendant, resolve its exact `git rev-parse HEAD`, prove its
   raw `gpgsig` and clean tree, then pass `node tools/tracked-input-preflight.mjs --profile=develop`
   on that exact commit. Do not rerun or rebind 7a8d3a5's exact browser chain.
2. Only then ask Nick for fresh authorization naming that final exact head, base
   **7a9f4c1370dd84292388d718c38ff34214f6203b**, PR #35, `test-battery`,
   `actions-budget-approved`, 92-minute maximum and no retry. Merge only if that exact hosted
   attempt is terminal green and branch protection is satisfied.

### Unchanged product and HUMAN boundary

These repairs change no product behavior, save schema, CF1/deterministic generation, creature/
genome/plant/biome/Guardian structure, art/audio content, Feed or Landing semantics, gameplay
balance, progression, copy, CSS, geometry, memory ceiling, product timeout, global CDP deadline,
ruler, retry or compatible-browser policy. The phone harness observation caps intentionally change
from 6 seconds to 15 seconds. The browser game remains the main product: effectively infinite
exploration, mining/crafting/loot and Pureforged gear, creature care/breeding/combat, Guardian progression and long-term
return play. Authored visual/listening/accessibility/first-journey judgment, physical-device heat/
battery/install and true-GPU review remain HUMAN.

### Paired Git/Claude handoff

- **OpenAI/Codex next:** complete the two local steps above. Do not push, label, dispatch or merge
  until the exact final signed head is locally terminal green and Nick supplies a fresh exact hosted
  authorization; the c0ad authorization is consumed and cannot be reused.
- **PR:** existing #35, base **develop**, source **openai/mac**. Copy-ready title:
  **feat(v2): complete roadmap campaign and harden action-time CI evidence**.
- **Copy-ready PR description:** “Completes the established v2 roadmap campaign without recreating
  its systems; preserves creature/genome/universe art structures; retains exact Feed transaction
  durability while capturing an ordered simultaneously-live WebAudio acknowledgement route through
  natural teardown; quiesces the same-document heartbeat across three capped post-Guide/Land waits
  and one phone Land action; preserves immutable eighth-attempt evidence; and records exact clean
  7a8d3a5's named-verified terminal-green local Compendium → Slice → Glass chain. The phone harness
  observation caps change from 6s to 15s; no product timeout, global CDP deadline, retry, Edge
  rebaseline, fixed ruler, save-schema, release, version, preview or deployment change is included.”
- **Claude Code next:** Nick does **not** need to open Claude yet. Open it only after PR #35's final
  exact head is terminal green and merged into `develop`; Claude must use a fresh `anthropic/*`
  branch and must not edit this OpenAI worktree.
- **Release status:** no release, version bump, preview publication or deployment is in progress.
