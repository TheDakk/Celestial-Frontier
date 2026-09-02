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

## ▶▶▶ SESSION HANDOFF — 2026-09-02 · ELEVENTH HOSTED INSTRUMENT STOP · LOCAL DEVELOP CHAIN GREEN ◀◀◀

### Exact current boundary

- **Verified owner:** OpenAI/Codex on macOS at
  `/Users/nick/Projects/celestial-frontier-openai-mac`, branch **openai/mac**, tracking
  **origin/openai/mac**.
- Exact SSH-signed implementation/docs certificate is
  **a484c39b30c8cdecac464c31283f64efb0263628**, tree
  **eb9ed823ff165ff89d9c8137f006e30497931c73**, parent
  **85431115256137b05d7cdfa590e087fd3b4d52e1**, based against `origin/develop`
  **7a9f4c1370dd84292388d718c38ff34214f6203b**. The signed documentation/evidence descendant
  containing this handoff is current local `HEAD`; use `git rev-parse HEAD` for its exact id.
- `origin/openai/mac` remains **85431115256137b05d7cdfa590e087fd3b4d52e1**. The implementation
  certificate is one local commit ahead; the documentation/evidence descendant is two commits
  ahead after completion. No remote write has occurred.
- This batch changes no game source, creatures, plants, biomes, Guardians, universe content,
  graphics, audio, save, progression, combat, loot, ruler, numeric ceiling, outcome inventory or
  browser point-version policy.
- No push, label, hosted attempt, rerun, PR mutation, Ready transition, merge, release, version
  bump, publication or deployment is authorized.

### Eleventh exact hosted attempt — immutable consumed red

- Nick's exact one-time PR #35 `test-battery` authority for head **8543111…** against base
  **7a9f4c1…** was consumed by GitHub run **33628648136**, attempt 1, synthetic merge
  **44659456e15f5250fdcf566516da8f85a1ef5328**, tree
  **517f2e08b53b631b5f493ce39872334bceff83a4**. The required job stopped terminal red after
  **6m30s**; there was no retry.
- Authorization, checkout/setup, environment/scope/policy, legacy browser-free work, v2 static
  gates, art mutation, root Layout **787/787** and Compendium's instrument controls passed.
  SceneMemory correctly skipped as production-only.
- The first and only red was `changed-or-production Chrome launcher selftest`:
  `SELFTEST abnormal browser exit after Browser.close: injected failure was accepted`.
  The synthetic fixture never loaded Celestial Frontier. Exact Edge installation, live
  Compendium, Slice and Glass correctly did not run.
- The approval label was removed; PR #35 remains open/unmerged. The exact 8543111 authorization is
  consumed and must not be retried.

### Eleven-attempt diagnosis and right-sized ownership

- The hosted history classifies as **8 instrument/infrastructure stops, 2 product/runtime stops
  and 1 mixed stop**. The dominant loop was evidence-instrument reliability and sequencing, not a
  game with thousands of independent defects.
- The **2,728** browser-free assertions are one consolidated local suite that completes in about
  40 seconds; they are not 2,728 jobs and are not the long-delay source.
- Keep as `develop` admission: exact authorization/scope/policy, one consolidated develop profile,
  relevant legacy/Layout work, one Compendium certificate and verifier, one critical Slice and
  verifier, then full 12-viewport Glass and verifier.
- Run resolver/launcher/Compendium synthetic controls only when their inputs change and always
  before the expensive consumer they validate. Keep live SceneMemory and Recovery
  production-only/quarantined; production still requires Nick's separate SceneMemory activation
  decision.
- Post-merge candidates—not silently part of this repair—are runtime/selftest file separation,
  content-addressed certificate reuse, critical-versus-exhaustive Slice ownership, a thin
  nonduplicating prehost orchestrator and smaller future PRs. See
  `audits/PR35_TEST_BATTERY_RIGHTSIZING_AND_LAUNCHER_RED_20260902_8543111.md`.

### Bounded shared-launcher successor

- Close phase is recorded before synchronous `Browser.close` send, but close-request authority is
  claimed only after send succeeds. Cleanup waits for exact browser lifecycle rather than a
  sentinel tree that cannot quiesce before cleanup.
- The integrated abnormal-exit control uses a receipt-bearing `SIGUSR2` handler and deterministic
  exit code `17`; pure SIGABRT classifier controls remain without relying on hosted core-dump
  timing.
- The sentinel terminates and observes the exact browser, flushes lifecycle IPC, then announces
  final identity and waits for acknowledgement before terminal group SIGKILL. Diagnostics remain
  latched until terminal ownership; profile removal requires proven termination; direct-kill
  failure stays provisional until lifecycle expiry.
- Clean, deterministic nonzero, missing-lifecycle, TERM-resistant/SIGKILL and pre-barrier-error
  integrated controls plus source mutations cover both failure directions. The workflow runs this
  shared launcher control before every expensive browser consumer.
- Independent final review is **CLEAR**. Current launcher SHA-256 is
  **4236ec3fc357d987c525bfde3e58eec09f38373dab8faff61d5712dc598ba7ca**. Compendium measurement
  authority is **b83cbb85149e9d17207865deaf8edc3fc5d12a3e14f5c271a1f7d9110bf681da**,
  refreshing only `browserCdp`; producer authority remains
  **308b97e6f1cedca1cde2c4b857d4fb64f45a3165a64a61fb8acd080447c0ef77**.

### Local proof completed

- Focused launcher/workflow/preflight/authority coverage passes **152/152**.
- Shared browser-CDP selftest passes all startup, deadline, lifecycle, cleanup, missing-evidence,
  abnormal-exit, TERM/SIGKILL, profile and provenance controls.
- Compendium's browser-free instrument selftest passes **618/618** controls.
- The complete browser-free `develop` profile passes **264/264 files, 2,728 passed / 1 skipped**,
  all three TypeScript programs, **34** art sources with zero findings, **1,014/1,014** routes and
  **454** declared fields with zero inert fields.
- The hermetic tracked-input rehearsal passes exact clean source **a484c39…**, proving the same
  result from committed Git inputs in a fresh temporary clone.
- Root Layout `local-1788355721508-17420-624f697795` passes **787/787** across 10 viewports in
  **76,917 ms** and passes named verification.
- Compendium `20260902133054645-17703-2cf459762b` passes **78/78** with zero findings/blocked
  outcomes in **65,415 ms** and passes named verification.
- Develop Slice `20260902133238723-18057-fb0557070177` passes terminal/certifying with zero
  findings/scopes and ten screenshots in **363,456 ms**. Its named verifier binds report/log
  SHA-256 `6724025357702846ef9283d4ecd55ba0e86f57a3d4a87607b33953a9717851b5` /
  `4e3750b8eea9e2ad2df8b9edb73a49b9a321dd7e1bea5e6a4f1a9f43ad6f44da`.
- Glass `20260902133910919-18520-cab54654b9fd` consumes that exact Slice and passes **12/12**
  viewports, **12/12** reload rows and **104/104** controls with zero blocked/omitted controls,
  findings, instrument failures or retries in **116,033 ms**. Slice-bound named verification
  passes; report SHA-256 is
  `eec545ab3215a5cbeb0c52cf316bc4e0bfcbc16c27c31e023d7b55223a5838cc`.
- Five deterministic `gzip -n -9` carriers preserve Layout, Compendium, Slice report/log and
  Glass. Integrity, exact raw comparison and deterministic recompression all pass; full names,
  sizes and hashes are indexed in `audits/README.md` and the current audit. No stage retried and
  the exact implementation source remained clean and byte-identical throughout.
- The signed documentation/evidence descendant containing this handoff also passes the final
  hermetic tracked-input `develop` proof with the same **264/264 files, 2,728 passed / 1 skipped**
  and green TypeScript/art/specification owners. Local closure is complete.

### Exact remaining closure

1. Stop locally: implementation, evidence, synchronized current references and final tracked-input
   proof are complete. Do not rerun the unchanged local battery.
2. Report the exact final head/base and ask for one fresh exact hosted authorization. Merge only if
   that distinct authorized head is terminal green.

### Paired Git/Claude handoff

- **OpenAI/Codex next:** report the exact hosted-ready head and request one fresh exact attempt.
  Do not push or mutate GitHub without that authority.
- **PR:** existing #35, base **develop**, source **openai/mac**.
- **Title:** `feat(v2): complete roadmap campaign and harden action-time CI evidence`
- **Description:** “Completes the established v2 roadmap campaign without recreating its gameplay
  systems; keeps live SceneMemory production-only; makes shared Chromium lifecycle evidence
  deterministic and causally ordered before expensive consumers; preserves the no-retry
  Compendium → Slice → Glass develop chain; and documents the eleven-attempt battery review. No
  ruler, ceiling, browser-version policy, release, version bump or deployment changes.”
- **Claude Code next:** Nick does not need to open Claude yet. After PR #35 is terminal green and
  merged into `develop`, Claude/Fable should begin the requested full polish review from a fresh
  `anthropic/*` branch synchronized from `origin/develop`.
- **Actions budget:** mode **UNFROZEN**, public-repository assumption while verified, private
  fallback cap **3,000**, and **zero** hosted attempts authorized.
