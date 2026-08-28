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

## ▶▶▶ SESSION HANDOFF — 2026-08-28 · FINAL12 HARNESS REPAIR SIGNED/BROWSER-FREE GREEN · FINAL13 FULL CHAIN NEXT ◀◀◀

### Exact current boundary

- **Owner/environment:** OpenAI/Codex desktop on macOS, physical root
  `/Users/nick/Projects/celestial-frontier-openai-mac`, branch `openai/mac`, upstream
  `origin/openai/mac`. Work remains local and unpushed; do not edit another agent worktree or the
  sibling live-site repository.
- **Signed checkpoints:** immutable Final12 evidence is preserved at
  `2bf99bd6efaf90d5d458338960ef77b297e22fa9`. The bounded three-file harness repair is signed at
  `5ab4d3ec92a7575fc091ca3b2c358ef01927be02` (tree
  `fcac22860b2ade8f4a626caf9b87eb65c24a40cc`, parent `2bf99bd6efaf90d5d458338960ef77b297e22fa9`).
  Locally known `origin/develop` remains `7a9f4c1370dd84292388d718c38ff34214f6203b`
  and fully contained. This current reference synchronization is not yet the signed clean docs
  descendant required for Final13.
- **Machine continuity:** temporary `/usr/bin/caffeinate -dis` remains active so macOS and
  1Password stay unlocked during signing and browser work. Keep it until a safe endpoint, then
  restore the prior monitors-off configuration.

### Immutable Final12 evidence boundary

- Layout `20260828-phase4-final12-509734533dd4-layout` ran once and passed **787/787** sealed
  outcomes across ten viewports in 76,474 ms. SceneMemory
  `20260828-phase4-final12-509734533dd4-scenemem` ran once and passed **42/42** in 9,974 ms.
  Compendium `20260828-phase4-final12-509734533dd4-compendium` ran once and passed **78/78** in
  43,804 ms with all six PNG bindings. Each passed its named verifier before the next began.
- Slice `20260828-phase4-final12-509734533dd4-slice` ran exactly once for 414,198 ms and remains
  stored **FAIL**, non-certifying, with one `arc-4-stale-convergence` finding, one scope and zero
  automatic retries. Its ten PNGs are manifest-bound. Glass and Recovery correctly did not start.
- The actual stale-convergence product assessment is wholly green: exact 72→73 stale fault, one
  trusted Tame, `tame-refused:stale`, `lastResult:null`, empty-CAS topology, unchanged capture and
  Arc-5 ownership, released old owner, closed replacement start, one native activation and exact
  read-only reload all passed. The retained-result control still isolates only `oldOutcome`.
- The sole stop was the deliberate `witnessAuthorityControl`. Its coordinated before/after
  `sessionOrdinal` mutation now correctly produces exact top-level failures
  `[convergenceRelease, oldUiConvergence]` and exact nested `beforeAuthority`; the stored wrapper
  expected only top-level `convergenceRelease`. That harness expectation became stale when the
  repaired assessor correctly bound witness-before runtime authority to durable raw.
- This is not a product regression or nondeterminism: the Final11 and Final12 product source trees,
  Slice wrapper blob and built `main-BqcJIdne.js` are byte-identical. Final12 remains immutable and
  was not retried. Exact raw/gzip sizes and hashes are recorded in `audits/README.md`; the PNG bytes
  remain ignored local review evidence under the established report-manifest policy.

### Completed bounded repair and browser-free proof

- Commit `5ab4d3e…` changes only `port/v2/tools/slicesmoke.mjs`,
  `port/v2/tools/arc4-browser-contract.mjs` and
  `port/v2/tests/slicesmoke-sixth-red-contract.test.ts`: the wrapper now requires the exact ordered
  double-red plus nested `beforeAuthority`, the full-assessor fixture seals the shared dependency,
  and the static contract rejects the obsolete one-red assumption.
- No product or assessor predicate, shared helper, collector, persistence, save, deterministic
  content, art, numeric ruler, release/version identity or browser policy changed.
- Browser-free final verification is green: Node syntax checks; focused **9/9**; full unit suite
  **138 files / 1,495 passed + 1 skipped**; root validate **1,010 renders / 50 determinism
  fingerprints**; every TypeScript config; `artunused`; Arc-4 Recovery, smoke-report, Glass and
  Compendium mutation selftests; `git diff --check`; and two independent reviews **CLEAR**.
- This proves the bounded harness repair only. It remains **browser-uncertified**, and immutable
  Final12 remains stored FAIL with no retry or successor stages.

### Next exact action

- Finish this synchronized reference batch and sign a clean docs descendant of `5ab4d3e…`.
  That exact unchanged signed source must then run one fresh **Layout → SceneMemory → Compendium →
  Slice → Glass → Recovery** Final13 chain. Run each stage exactly once and serially, named-verify
  it before the next begins, and stop/preserve immediately on any nonzero, red or instrument result;
  never retry a red campaign.
- Only a complete fresh green chain can establish Recovery and the stable Phase-4 checkpoint. HUMAN
  judgment, hosted integration and release authority remain separate.
- Edge `151.0.4129.107` / CDP `1.3` is run provenance only. Compatible Edge point updates never
  trigger rebaselining or threshold changes.

### Queued universe-wide visual polish — after the full green checkpoint

- Apply the richer treatment across the entire universe—galaxy/system space, planets, every biome,
  creature, plant, ship and effect. Sol is calibration only, never a Sol-specific branch.
- Preserve deterministic identity, authored structure, silhouettes, proportions, interaction
  geometry, accessibility, reduced-motion behavior and phone heat/frame/resource budgets.

### Paired handoff

- **OpenAI/Codex:** finish and sign this docs-only descendant, verify it is clean, then run the fresh
  serial Final13 chain from that exact unchanged source under the once-only stop/no-retry protocol.
- **GitHub step:** none. Zero exact hosted attempts are authorized; do not push, open/update a PR,
  dispatch, rerun, merge, deploy, publish or bump a version.
- **PR details:** not needed now. If Nick later authorizes the exact GitHub write, use base
  `develop`, source `openai/mac`, title **`Phase 4: complete the playable-slice campaign repair`**,
  description **`Preserves the immutable Final10–Final12 evidence chains, repairs the Recovery and
  Slice mutation-control oracles with negative controls, completes a fresh signed verification
  chain, and synchronizes the Phase-4 references. No release or deployment is included.`**
- **Anthropic/Claude Code:** Nick does not need to open Claude now. Wait for a future merged PR before
  syncing; do not copy this local campaign work manually.
- **Release status:** no release or deployment; `develop`, `main` and the live site are unchanged.
- **Actions budget:** `UNFROZEN`; repository public; 3,000 fail-closed private/ambiguous cap; zero
  exact hosted attempts authorized.
