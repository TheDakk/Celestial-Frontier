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

## ▶▶▶ SESSION HANDOFF — 2026-08-30 · BATTERY RIGHT-SIZED · STORAGE DIAGNOSIS FAIL-CLOSED ◀◀◀

### Exact current boundary

- **Owner/scope:** OpenAI/Codex desktop on macOS at
  `/Users/nick/Projects/celestial-frontier-openai-mac`, branch **openai/mac**, upstream
  **origin/openai/mac**. Exact signed tested source
  **961d1071d059e0f73e14a6a4ead61f5e4696535b** (tree
  **e1acc7753e8f89ca13bc7dd0fce300c5fba454f3**, parent
  **7f89bb2a70604da5b79673bd22d25786cab468d2**) is **34 commits ahead** of the fetched remote
  agent branch. Its signature was cryptographically verified with the configured SSH identity.
- **Current local successor:** only the Slice browser runner, its existing focused causal-source
  test, exact 961 evidence replay/carriers and synchronized documentation are dirty. The runner
  now proves target/focus/coordinator readiness before arming, observes the latch before input,
  refuses an unfocused dispatch, and retains pre-arm/post-arm/post-press/deadline state plus final
  raw/UI/interaction evidence. No game/app source, creature/genome structure, save schema,
  art/audio system, balance, numeric browser ruler, timeout, retry, release identity or
  Edge-version baseline changed.
- **PR boundary:** draft PR **#35**, base **develop**, source **openai/mac**, remains blocked,
  unmerged and unpushed at remote head **017fa6decbc41809188768ccdb98ab86ef1b9ebc** against
  fetched base **7a9f4c1370dd84292388d718c38ff34214f6203b**.
- **Actions boundary:** `GITHUB_ACTIONS_BUDGET.md` is **UNFROZEN** and the repository is public,
  so standard hosted runners are free; the 3,000 cap applies fail-closed if visibility changes.
  **Zero hosted attempts are authorized.** No push, label, dispatch, rerun, Ready transition,
  merge, release, version bump, publication or deployment is authorized.
- **Browser policy:** compatible Chromium-family browsers at CDP **1.3** are accepted by the
  generic gates; SceneMemory and Compendium require Edge-family CDP **1.3**. Point versions are
  provenance only and never require a rebaseline.

### Decision — the battery is now proportional to the promotion risk

- The apparently large number is **2,510 passing assertions plus 1 intentional skip inside one
  roughly 23-second Vitest process**. It is not 2,510 Actions jobs, browser launches or sequential
  workflows. Those fast assertions cover independent product invariants and remain the cheapest
  protection against regressions.
- One fail-fast owner now defines the only static profiles:
  - **dev — 4 commands:** one full Vitest run and the root, game and worker TypeScript programs;
  - **develop — 7 commands:** dev plus one art audit, one exact route/coverage audit and one
    specification audit;
  - **production — 8 commands:** develop plus the expensive 107-mutation override control.
- The specification audit's **5 negative controls are folded into its normal command**; they no
  longer need another workflow step. The Compendium ruler's **591 synthetic mutation controls**
  run only for production or when its browser instrument/workflow dependency closure changes;
  normal develop admission keeps the live preflight beside the one real certificate.
- Duplicate/low-value execution has been removed: no second Vitest/current-producer run, no loose
  TypeScript pass beside strict TypeScript, no duplicate selftests already owned by Vitest, no
  routine coverage-gap pass beside the stronger route audit, no production mutation control in
  ordinary coding, no persona recertification, and one evidence upload.
- The remaining develop browser stages are intentionally distinct:
  **SceneMemory → Compendium → Slice → Glass**. They measure retained scene memory, Compendium
  lifecycle memory, real gameplay/outcomes and 12-viewport presentation respectively. Combining
  them would hide the causal owner and make failures slower to diagnose. **Recovery and package
  smoke are production-only**, not development taxes.
- The base/head classifier owns conditional controls and is mutation-tested. Its closure now
  includes every Compendium fixture, builder, lock, budget and instrument dependency, so a
  relevant change cannot silently skip the ruler controls while ordinary gameplay changes do.

### Immutable d611 → 7f → 961 evidence and the repaired Arc 4 boundary

- Exact d611 passed root Layout **787/787**, SceneMemory **44/44** and Compendium **78/78** once,
  unchanged and with zero retry. Slice then stopped terminal red after **170,889 ms** with five
  scopes; Glass correctly did not run. All useful raw carriers are preserved deterministically
  under `audits/` with hashes and sizes in `audits/README.md`.
- The retained report proves this was **not five product defects**. Pertar's real shared ledger at
  action readiness is boot progression receipt **0** → Survey **1** → Landing **2**. First Sample
  correctly commits Capture receipt **3** at revision +1, then the eligible Arc 9 progression
  receipt **4** at revision +2, adding `rare` and `legend` while best rank stays 3.
- The obsolete Arc 4 oracle wrongly required an empty cross-system ledger and exactly one new
  receipt. The repair now proves the exact ordered prefix, the exact two-receipt progression tail,
  independent negative controls, and a causal stop before Storage when Sample is red. A redundant
  campaign-wide source-shape assertion was pruned; the focused Sample boundary owns the rule.
- Immutable-evidence replay verifies every retained raw/gzip identity and the original red facts.
  The historical report remains red; no result was relabelled and no browser retry occurred.
- Exact signed 7f then passed its tracked-input develop profile, conditional heap/launcher controls,
  SceneMemory **44/44** in **12,753 ms** and Compendium **78/78** in **63,310 ms**, all unchanged,
  named-verified and once/no-retry. Slice stopped after **159,754 ms** with exactly one causal scope,
  `arc-4-tame-greeting-audio`; Glass correctly did not run.
- Every Tame/audio/action/classifier/mutation/reload outcome was green. Only fixture setup
  `actionAuthorityPrefix` was red because the new prefix check pinned Sample's complete Landing
  witness, including state-derived seal `9ccc8a03…`. The equally valid Tame fixture differs only at
  that opaque full-state seal (`10d953c3…`); all causal fields and the world-identity seal agree.
- The bounded successor substitutes only the observed canonical lowercase SHA-256 into one exact
  Landing witness byte template. Both retained real variants are positive; malformed seal and
  changed invariant-field controls are red. It does not allowlist versions or digests and does not
  duplicate the private product codec. The 7f report remains immutable FAIL.
- Exact signed 961 then passed the complete tracked-input develop profile, SceneMemory **44/44**
  in **12,912 ms** and Compendium **78/78** in **63,695 ms**, all unchanged, named-verified and
  once/no-retry. Slice reached Storage and stopped after **171,033 ms** with exactly one generic
  `harness` timeout; Glass correctly did not run. The old runner discarded the arm, target,
  coordinator, product, durable and UI state before its assessor could classify the timeout, so
  that immutable report proves neither a product failure nor a safe setup.
- The current runner-only repair follows the already-proven Arc 3 pattern: exact native Tame
  readiness precedes the one-shot hook; the hook return and visible latch must both be true before
  input; keyboard dispatch additionally requires real focus; and any wait/capture/classifier red
  retains four ordered phase snapshots and causal-stops before stale-authority or later Arc 4 work.
  The existing assessor now receives the real `waitError` and `captureErrors` instead of hard-coded
  green placeholders. Historical 961 evidence stays red.

### Acceptance on exact 961 and the current bounded successor

- `node tools/check-profile.mjs --profile=develop`: **PASS** —
  **253 files / 2,510 passed / 1 skipped**, all three TypeScript programs, **34** art sources
  with zero findings, **1,014/1,014** routes covering **1,010/1,010** Earth species, and
  **454** declared specification fields with zero unread/inert fields.
- Integrated specification controls: **5/5 PASS**. Conditional Compendium selftest:
  **591 independent controls PASS**. Compendium live-preflight selftest: **PASS**.
- Focused Arc 4 causality plus immutable evidence replay: **2 files / 5 PASS**.
- The first consolidated profile attempt exposed one misplaced TypeScript suppression comment
  after all assertions passed. It was corrected test-only, TypeScript passed independently, and
  the complete profile then passed. This is retained as diagnosis, not hidden as a game failure.
- Exact 7f conditional controls: Scene fixed-second heap **PASS** at 524,288 B/cycle; Chromium
  launcher/deadline/cleanup selftest **PASS**. SceneMemory and Compendium browser predecessors are
  green as recorded above; Slice remains red and grants no Glass/HUMAN/hosted/merge/release claim.
- Exact 961 tracked admission passed at the same **253 files / 2,510 passed / 1 skipped** profile,
  then its browser predecessors passed as recorded above. Its terminal Slice report is preserved
  under `audits/` with raw/gzip identities and zero retry.
- Current runner/evidence repair: focused Arc 4 causality plus immutable replay is **2 files / 5
  PASS**; the complete develop profile remains **253 files / 2,510 passed / 1 skipped**, all three
  TypeScript programs, art/route/spec gates and integrated 5/5 spec controls green. Independent
  review found no product-path change, unsafe dispatch, null/control hazard or cleanup leak; its two
  test-only mutation gaps were added and pass.

### Exact next work — one clean local admission and one no-retry browser chain

1. Finish synchronized docs/diff/syntax checks and commit the bounded storage diagnostic plus
   immutable 961 evidence as one SSH-signed successor; verify its signature and a clean worktree.
2. Run `node tools/tracked-input-preflight.mjs --profile=develop` once on that exact clean commit.
3. The current change touches only Slice evidence/dispatch diagnosis, not the browser launcher/memory
   instrument dependency closure, so do not repeat its already-green conditional controls. Run one
   exact SceneMemory → Compendium → Slice → Glass chain on the changed source. Stop on the first
   nonzero, red or instrument result; never retry automatically. Glass runs only after green Slice.
4. Preserve and named-verify each available immutable report. Do **not** run Recovery for this
   agent → `develop` admission; Recovery belongs to the later separately authorized
   `develop` → `main` production candidate.
5. Refresh this handoff with the exact clean source and final local evidence. Report the exact
   base/head to Nick. A GitHub write still requires a separately authorized exact attempt.

### Product-roadmap and HUMAN boundary

This pass does not recreate or redesign the implemented V2 systems. The existing universe-wide
art treatment, creature/genome identity, Guardians/Prime Codex, loot/Pureforged, exploration,
crafting, combat, care/progression, audio and deterministic persistence remain untouched.

Still-open work that requires authored product decisions or HUMAN/device proof remains explicit in
the system references and `port/V2_PROGRAM_ROADMAP.md`: conquest-imbue coexistence, another
Guardian reward table, canonical mission/care/healing rules, broader Chronicle/Museum history,
achievement reward claims, Fifty Paragons, remaining production media/depth, veteran import,
accessibility, and physical phone/tablet install, heat, battery, true-GPU and first-journey
judgment. Automation must not invent those decisions merely to call the roadmap complete.

### Paired Git/Claude handoff

- **OpenAI/Codex now:** sign the bounded storage-diagnostic repair/evidence, run one clean tracked
  admission, then one final local develop browser chain with causal stop and no retry.
- **GitHub step now:** none. Zero hosted attempts are authorized.
- **PR #35 after local green:** existing draft, base **develop**, source **openai/mac**, title
  **feat(v2): complete roadmap campaign and harden CI parity**. Its exact push/hosted head is not
  yet authorized.
- **Claude Code now:** Nick does **not** need to open Claude yet. Claude must not edit this OpenAI
  worktree. After PR #35 is terminal-green and merged into `develop`, Claude should branch
  `anthropic/*` from that exact integration commit for the requested whole-plan polish.
- **Release status:** `develop`, `main` and the live site remain unchanged. No release, version
  bump, preview publication or deployment is in progress.
