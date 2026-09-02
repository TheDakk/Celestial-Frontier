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

## ▶▶▶ SESSION HANDOFF — 2026-09-02 · ELEVENTH HOSTED INSTRUMENT STOP · LOCAL SUCCESSOR GREEN ◀◀◀

### Exact current boundary

- **Verified owner:** OpenAI/Codex on macOS at
  `/Users/nick/Projects/celestial-frontier-openai-mac`, branch **openai/mac**, tracking
  **origin/openai/mac**.
- Local `HEAD` and `origin/openai/mac` are exact SSH-signed
  **85431115256137b05d7cdfa590e087fd3b4d52e1**, based against `origin/develop`
  **7a9f4c1370dd84292388d718c38ff34214f6203b**. The worktree intentionally contains the bounded
  launcher/workflow successor, its focused tests, battery audit and synchronized current docs.
  Preserve every change.
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
- A dirty-source root Layout diagnostic already passed **787/787**. It is diagnostic evidence,
  not the final clean certificate.

### Exact remaining closure

1. Inspect the complete diff and synchronize every affected current reference.
2. Create one SSH-signed local implementation/docs commit; do not push.
3. On that exact clean committed source, run the hermetic tracked-input `develop` rehearsal and one
   serial, fail-fast/no-retry Compendium → Slice → Glass chain, including every named verifier.
   Stop on the first red; do not retry.
4. Preserve/index the resulting evidence, refresh this handoff and run the final tracked-input
   proof on the documentation/evidence descendant.
5. Only after all local evidence is green, report the exact final head/base and ask for one fresh
   exact hosted authorization. Merge only if that distinct authorized head is terminal green.

### Paired Git/Claude handoff

- **OpenAI/Codex next:** finish the exact local closure above. Do not push or mutate GitHub.
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
