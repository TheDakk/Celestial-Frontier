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

## ▶▶▶ SESSION HANDOFF — 2026-08-28 · FINAL11 TEMPORAL ORACLES REPAIRED · FRESH FULL CHAIN NEXT ◀◀◀

### Exact current boundary

- **Owner/environment:** OpenAI/Codex desktop on macOS, physical root
  `/Users/nick/Projects/celestial-frontier-openai-mac`, branch `openai/mac`, upstream
  `origin/openai/mac`. Work remains local and unpushed; do not edit another agent worktree or the
  sibling live-site repository.
- **Repository relationship:** exact origin is
  `git@github.com:TheDakk/Celestial-Frontier.git`; locally known `origin/develop` is
  `7a9f4c1370dd84292388d718c38ff34214f6203b` and remains fully contained. Signed Final11 evidence
  checkpoint `c0a8f9fe91fa6a2e2c77370a330e78b239012678` preserves the immutable carriers and synchronized
  evidence references. Signed assessor/tests/docs repair
  `12d826a8abde7af345980f5f9ce3502b946d2d6e` (tree
  `fec8792f2e0f1eec1de381986ce2fd44c0ef4fd4`, parent `c0a8f9f…`) is the reviewed implementation
  checkpoint; both embedded SSH signatures verified.
- **Machine continuity:** a temporary `/usr/bin/caffeinate -dis` hold is active so macOS and
  1Password stay unlocked through signing and the browser campaign. Keep it active until a safe
  checkpoint, then restore the prior monitors-off behavior.

### Immutable Final11 and repaired assessor boundary

- Signed clean docs source `1ca67156e27d6bd58a324e33b0e6b752adf568bc` supplied immutable
  Final11. Layout passed 787/787; SceneMemory 42/42; Compendium 78/78; Slice passed with zero findings
  and ten PNGs; Glass passed all 12 viewports with zero findings or instrument failures. Every stage
  ran once and passed named verification.
- Recovery `20260828-phase4-final11-1ca67156e27d-recovery` ran once for 1,291,034 ms and completed
  the real uninterrupted 20-minute observation, exact boundary crossing and recovered UI. Its stored
  report remains `fail`, with only `activePlayProjection` and `closeCheckpoint` false; cleanup
  passed and no retry occurred. Gzip/raw SHA-256 remain
  `cb44985eb4894e34d518f521df8506c7b4aec452afcc8a2351f52eb5dd9b698a` /
  `fa035d12a50a55b7e51ebca9de565c59b0f02d5941d1a19ccd4d5f65ae8febcb`.
- The current assessor replays that unchanged bundle wholly green; this does **not** rewrite Final11
  or create a Recovery certificate. Projection now binds durable raw to an equal-or-later live
  runtime while allowing the existing at-most-10-second rendered lag. Close now binds against the
  latest exhausted State/UI live runtime, requires the closed durable/raw and hidden runtime clocks
  to agree, permits only checkpoint duration plus 1,000 ms, and requires the exact committed/lost
  six-key hide witness plus revision-bound `lastOutcome`.
- Positive exact-boundary fixtures reproduce Final11's 79,709 / 84,697 / 84,738 / 84,740 ms
  exhausted chronology, 85,062 ms close and 1,285,118 / 1,285,098 / 1,285,402 / 1,285,404 ms
  recovery chronology. Isolated controls turn red for runtime-before-raw, future or over-lagged
  rendering, close-before-latest-live, boundary +1 ms, hidden-runtime mismatch, each malformed
  witness field/key set and mismatched `lastOutcome`.
- Scope is assessor/tests/docs only: no product code, save shape, deterministic content, version,
  numeric ruler, browser capability authority or Edge point-version policy changed.

### Verification and next exact action

- Browser-free verification is green: `node --check`; focused Recovery 6/6; full Vitest 138 files,
  1,495 passed /one intentional skip; root validate 1,010 renders /50-probe exact fingerprint;
  root/app typecheck; `artunused`; Recovery, Smoke-report, Glass and Compendium instrument
  selftests; and independent code, documentation and whole-diff reviews CLEAR.
- Once this handoff is committed and signed, that clean docs-only checkpoint is the exact fresh
  campaign source. Verify its signature and a clean tree, derive fresh IDs from its full hash, then
  run exactly once and serially: **Layout → SceneMemory → Compendium → Slice → Glass → Recovery**.
  Each stage must pass its named verifier before the next starts. Stop on any product-red or
  instrument-red result,
  preserve its carrier and do not retry.
- Only a complete fresh green chain can establish Recovery and the stable Phase-4 checkpoint. HUMAN
  judgment, hosted integration and release authority remain separate.
- Hosted authority remains zero exact attempts: no push, PR write, dispatch, rerun, merge,
  deployment, publication or version bump. Edge `151.0.4129.107` / CDP `1.3` is Final11
  provenance only; compatible point updates never trigger a rebaseline or threshold change.

### Queued universe-wide visual polish — after the full green checkpoint

- Apply the richer treatment across the entire universe—galaxy/system space, planets, every biome,
  creature, plant, ship and effect. Sol is calibration only, never a Sol-specific branch.
- Preserve deterministic identity, authored structure, silhouettes, proportions, interaction
  geometry, accessibility, reduced-motion behavior and phone heat/frame/resource budgets.

### Paired handoff

- **OpenAI/Codex:** sign and verify the clean docs-only handoff checkpoint, run the fresh serial
  campaign without retry, preserve its evidence and synchronize references. After the stable green
  checkpoint, continue the remaining authorized arcs and universe-wide nonstructural polish.
- **GitHub step:** none. Zero exact hosted attempts are authorized; do not push, open/update a PR,
  dispatch, rerun, merge, deploy, publish or bump a version.
- **PR details:** not needed now. If Nick later authorizes the exact GitHub write, use base
  `develop`, source `openai/mac`, title **`Phase 4: complete the playable-slice campaign repair`**,
  description **`Preserves the immutable Final10/Final11 evidence chains, repairs the two Recovery
  temporal oracles with mutation controls, completes a fresh signed verification chain, and
  synchronizes the Phase-4 references. No release or deployment is included.`**
- **Anthropic/Claude Code:** Nick does not need to open Claude now. Wait for a future merged PR before
  syncing; do not copy this local campaign work manually.
- **Release status:** no release or deployment; `develop`, `main` and the live site are unchanged.
- **Actions budget:** `UNFROZEN`; repository public; 3,000 fail-closed private/ambiguous cap; zero
  exact hosted attempts authorized.
