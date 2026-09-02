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

## ▶▶▶ SESSION HANDOFF — 2026-09-02 · GLASS STOP REPAIRED · CURRENT-CODE DOWNSTREAM GREEN ◀◀◀

### Exact current boundary

- **Verified owner:** OpenAI/Codex on macOS at
  `/Users/nick/Projects/celestial-frontier-openai-mac`, branch **openai/mac**, tracking
  **origin/openai/mac**.
- Current local SSH-signed predecessor is
  **05690215771db91601cf9dbcbcaa8d771fe540b5**, tree
  **00ee47169a3929dfbe952842419641a3f69699aa**, one commit ahead of remote
  **18c088de4388edf58eda2c192b71cb94156e26e7**, against `origin/develop`
  **7a9f4c1370dd84292388d718c38ff34214f6203b**.
- The worktree is intentionally dirty with the bounded browser-cleanup and Glass-instrument
  successor. Preserve every change. No gameplay, creature, universe, art, audio, save, loot,
  combat, ruler, numeric ceiling or browser-version policy is being changed.
- Independent launcher/Glass review is **CLEAR**. Focused coverage passes **74/74**, all three v2
  TypeScript programs pass, and the finished dirty source passes the complete browser-free
  `develop` profile at **264/264 files, 2,728 passed / 1 skipped**. The root validator also passes
  with the **50-probe** v1.0 determinism fingerprint unchanged. The signed candidate and clean
  immutable browser chain remain pending.
- There is no authority to push, mutate PR #35, apply a label, dispatch/rerun Actions, mark Ready,
  merge, release, version, publish or deploy.

### Exact local stop and diagnosis

- On exact clean predecessor `0569021…`, the complete browser-free `develop` profile passed
  **263/263 files, 2,719 passed / 1 skipped**. Compendium
  `20260902033229765-66224-f9f0a7aa7a` passed **78/78**. Develop Slice
  `20260902033353481-66577-7b2bc768c3cc` passed with zero findings; report/log SHA-256 is
  `5a9a64e86385c27c85cd6f5b01bbcd140d94f59c8b5df203e632060c65e3e35d` /
  `c54f93683e4a6596317b54b32171a57032054908ca16e1bebf4a353aac877962`.
- Exact-source Glass `20260902034025002-67201-c5ef56b312e9` then stopped once, with no retry,
  after **64,720 ms** at `tablet-portrait: owned browser cleanup failed (kill EPERM)`.
  Its immutable report SHA-256 is
  `6ec30cb1ef2622c94ad68d90b2c7326bc3970b8a7b28ffeca6d45c669029bee9`.
- The first six viewports and all six reload rows were green, with **zero product findings**.
  The stop was process cleanup after tablet portrait, not a game failure. The later six viewports
  correctly did not run.
- The former POSIX cleanup released ownership and then probed/signalled a reusable numeric process
  group. Rapid PGID reuse could produce `EPERM` or, for a same-user group, risk signalling an
  unrelated process group. The successor anchors ownership in a dedicated detached Node sentinel
  through exact browser-PID, final-group-identity, acknowledgement and terminal-KILL barriers and
  performs no post-release PGID probe or signal.
- Segmented testing also exposed a Glass-only 8K Inventory control flaw: a supposed offscreen
  negative control could dispatch real product input when `scrollTop` was already zero. The
  successor uses a deterministic translated-offscreen fallback, proves no input/receipt, restores
  exact prior inline style in `finally`, and classifies instrument failure before product outcome.
- Two deliberate current-turn targeted probes then correctly stopped instrument-red before the
  final sweep. Run `20260902052600888-85161-dd14bc6726f4` caught malformed nested restoration
  interpolation; run `20260902052945783-86025-0f4247ee8571` caught Chromium normalizing an absent
  style attribute to empty on the first removal. Both retained zero product findings and zero
  dispatched product input. Executable restoration and sticky-empty-style controls now make both
  states fail closed instead of passing vacuously.
- The failed run's exact 345 MiB generated profile was retained through report/audit preservation,
  verified unused, removed non-recoverably, and then verified absent. No user or product data was
  removed.

### Segmented downstream verification

The stopped viewport and every stage after it were exercised individually on the same final
current-code dirty source. All seven share status SHA-256
`6007ed45db87795e6c06ab3e97efca5cd1ceb6443acdfd82421f3bc2d39b433b` and working-tree SHA-256
`23884a5d5050bc79642d25ac4700e58b269e0deee2d61464c37143550815c027`; every run passed with
zero findings, zero instrument failures, zero retries and a green reload row:

- tablet-portrait `20260902053159926-86747-9a6ec544ca9f`
- tablet-landscape `20260902053214646-86864-a72ce4d83aef`
- laptop-720p `20260902053229583-86982-528e2a6690f0`
- desktop `20260902053243665-86740-fd3ed6b519f9`
- desktop-1080p `20260902053339974-87246-c7e46a84c35d`
- ultrawide `20260902053354610-87392-74be39e3fc8d`
- desktop-8k `20260902053409007-87239-adca4be4b296`

These runs prove the repaired stop and downstream surfaces independently. They are diagnostics,
not a substitute for the final clean unchanged-source certificate.

### Authority boundary

- Compendium measurement authority is now
  **a963f40135651323bb2c0f2a0a6fa7a381ab3905e43b6e5721f45e9f38e50e62**,
  refreshing only `browserCdp` to
  **8c6094e4e4bc05c40ace80478b038890e2e8c33856e5932a60805ac71249e0df**.
- Compendium producer authority remains
  **308b97e6f1cedca1cde2c4b857d4fb64f45a3165a64a61fb8acd080447c0ef77**.
  The fixed ruler, every numeric ceiling, all historical samples, 78-outcome inventory and
  version-tolerant Edge-family/CDP `1.3` policy are unchanged.
- SceneMemory remains deliberately stale/red, production-only and quarantined. Do not refresh its
  producer authority, run its live heap selftest or treat it as a `develop` blocker. Production
  still requires Nick's separate future SceneMemory activation decision.
- The authority printer exits `2` solely for SceneMemory's intentionally stale `browserCdp`,
  `buildDist`, `gameHtml` and `gameMain` inputs; both Compendium budget matches are true. That is
  the expected fail-closed production boundary, not a `develop` failure.

### Exact remaining closure

1. Finish final diff review, create one SSH-signed clean-source candidate and record its
   exact commit/tree.
2. Run the hermetic tracked-input `develop` preflight once. On that unchanged source, run exactly
   one fail-fast/no-retry, named-verified
   **Compendium → Slice (`develop`) → Glass (`develop`)** chain. Stop after any nonzero, red or
   instrument result. Do not run SceneMemory or Recovery.
3. Preserve the exact report/log carriers, complete the signed documentation descendant and final
   clean tracked-input proof, then stop locally.
4. Request Nick's fresh exact authorization naming the final full head, base
   `7a9f4c1370dd84292388d718c38ff34214f6203b`, PR #35, `test-battery`,
   `actions-budget-approved`, the 92-minute maximum and no retry. Merge only if that exact hosted
   attempt is terminal green and branch protection is satisfied.

### Paired Git/Claude handoff

- **OpenAI/Codex next:** complete the four local closure steps above. No GitHub action is currently
  authorized.
- **PR:** existing #35, base **develop**, source **openai/mac**.
- **Title:** `feat(v2): complete roadmap campaign and harden action-time CI evidence`
- **Description:** “Completes the established v2 roadmap campaign without recreating its gameplay
  systems; keeps live SceneMemory native-heap work production-only while retaining deterministic
  controls; replaces reusable-PGID browser cleanup with sentinel-anchored exact ownership; prevents
  Glass Inventory negative controls from dispatching product input; refreshes only Compendium's
  browser-transport measurement authority; and preserves develop's exact no-retry
  Compendium → Slice → Glass admission chain. Includes synchronized audits and references. No
  ruler, ceiling, browser-version policy, release, version bump or deployment is changed.”
- **Claude Code next:** Nick does not need to open Claude yet. After PR #35 is terminal green and
  merged into `develop`, Claude/Fable should begin the requested full polish review from a fresh
  `anthropic/*` branch after fetching and merging `origin/develop` in its own clean worktree.
- **Actions budget:** mode **UNFROZEN**, public-repository assumption while verified, private
  fallback cap **3,000**, and **zero** hosted attempts authorized.
