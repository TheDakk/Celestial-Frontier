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

## ▶▶▶ SESSION HANDOFF — 2026-08-31 · PR #35 HOSTED ACTION-WITNESS RED · LOCAL REPAIR IN PROGRESS ◀◀◀

### Exact current boundary

- **Owner/scope:** OpenAI/Codex desktop on macOS at
  `/Users/nick/Projects/celestial-frontier-openai-mac`, branch **openai/mac**, upstream
  **origin/openai/mac**. Local HEAD and the remote agent branch remain exact
  **8eb0b1bd901c7b36d8900f43f4de7d3a54158a0c**; PR #35 base is exact
  **7a9f4c1370dd84292388d718c38ff34214f6203b** on **develop**.
- The worktree now contains an **uncommitted harness-only Compendium action-witness repair** plus
  its evidence carrier and synchronized references. Product source and CSS are untouched. A new
  signed local commit/head does not exist yet.
- **Authority:** the one exact hosted attempt Nick authorized for the 8eb/base pair is consumed.
  Its label has been removed; PR #35 remains draft and unmerged. There is **no authorization** for
  another push, label, hosted run, retry, Ready transition, merge, release, version bump, preview,
  publication or deployment. `develop`, `main` and the live site are unchanged.

### Consumed hosted result and exact diagnosis

- GitHub Actions run **33437596315**, attempt 1, ran once with
  `actions-budget-approved` and stopped terminal red after **37m14s**. Every stage before
  Compendium passed. Compendium completed **77/78**; its only red was
  `desktop/back-restores-focus`. Slice and Glass did not run. There was no retry.
- The hosted report binds synthetic merge source
  **4ccae861ab2f43f4269edfeefa51fd2e4985a875**, whose tree is identical to exact head
  `8eb0b1b…`. It used the sealed Linux Edge-family/CDP 1.3 browser authority; the point version is
  provenance, not a rebaseline trigger.
- Desktop setup sampled logical row `cmem-0773` at offset **-34**. Linux then needed three
  legitimate row-settlement attempts before the click. At the actual trusted Back action, the
  product captured offset **-92** and restored that same action-time state both immediately and
  after settlement. The phone case preserved **-9 → -9** and passed.
- Therefore the red is an **instrument false negative**: the old assertion compared stale
  pre-settlement setup geometry with a product restore correctly bound to the later action. It is
  not evidence of a product focus/scroll defect.

### Bounded local repair

- Compendium now arms one strict capture-phase trusted-click witness only after the final stable
  action point. It binds the exact document, run/source/browser authority, logical row/index 777,
  unique target/scroller, click coordinates and hit owner, event trust/phase, panel state and the
  action-time scroll anchor. Read/failure paths clean up the listener and carrier without retry.
- The outcome contract requires current evidence to contain the valid witness and requires
  `before` to equal its captured action-time anchor exactly. Immutable historical replay fixtures
  retain their explicit legacy fallback; no historical report is rewritten or relabelled.
- Selftests model the hosted **-34 setup → -92 action → -92 return** chronology and cover missing,
  duplicate, untrusted, wrong-row, foreign-document, duplicate-owner, wrong-hit, retained-carrier
  and independently shifted action/return mutations in both directions.
- Product code, CSS, the fixed **±2px** ruler, numeric ceilings, timeouts, retry policy and
  version-tolerant Edge-family/CDP 1.3 policy are unchanged. No save schema, gameplay balance,
  deterministic generation, creature/genome/plant/biome/Guardian structure or authored art changed.
- Current Compendium authority is producer
  `af74148c97a41a421592baee801611787f065c60a64bf6da38985bf00bdd79c7`, collector
  `a5afcffd2f75e7cc2db1284194bc3eb76bde22bf4a1b4741f5157ce25339df51`, outcome contract
  `1b17df2e4983b44d929acfb16cb3ed79250ad7c9b68e522418a44fb3a58d6692`, measurement
  `20a1b773e7eec309de31772c2b1c0a174c0f175cfc798e573f20a53b966aba2e` and budget
  `c60b2f1fb50e978c0d6f522ee52a0274e9a45cd63a51f1643808229b1e25ce60`.

### Preserved evidence and verification so far

- Immutable carrier:
  `audits/ARC1A_COMPENDIUM_PR35_HOSTED_BACK_ACTION_WITNESS_INSTRUMENT_RED_20260831_4CCAE86.json.gz`
  — gzip **566,480 bytes**, SHA-256
  `075ba73e3a9209b89c7892192c671e20e47bfb663fd4a41569c66218270d6f0d`; raw
  **12,775,383 bytes**, SHA-256
  `0a8a840ce2f410e467640bf6813b95114d16da673cb9660ea1d65a1cc245f862`.
  `gzip -t` passed. The carrier remains the original **77 pass / 1 fail** report and explicitly
  proves that the old producer had no action witness.
- Focused Vitest verification passed **5 files / 56 tests**, including current producer authority
  and the five-test immutable failure-carrier contract. `npm run compendiummem:selftest` passed
  **611 controls**; syntax checks passed.
- The standalone producer printer may still report the quarantined SceneMemory source against the
  dirty successor. The develop-scoped current-authority tests are green. SceneMemory is
  production-only and must not be rebound as part of this Compendium harness repair.
- The complete browser-free develop profile, typecheck and fresh unchanged-source
  Compendium → Slice → Glass browser chain are still pending for the new signed candidate. Nothing
  in this paragraph is yet a terminal-green successor certificate.

### Exact remaining local sequence

1. Finish all affected current-reference updates, run focused diff/contract checks, create the clean
   SSH-signed implementation/docs commit and record its exact head.
2. Run the complete browser-free develop profile and typecheck once on that clean commit.
3. From the same unchanged clean source, run exactly one fail-fast/no-retry
   **Compendium → Slice (`develop`) → Glass (`develop`)** chain, named-verifying each report and
   stopping on any nonzero, red or instrument result. SceneMemory remains production-only/
   quarantined and Recovery is not part of develop.
4. If terminal green, preserve the exact carriers, refresh current docs in a signed docs-only
   descendant and leave the worktree clean. Do not rerun the unchanged candidate.
5. A fresh authorization must name the resulting exact full head, base SHA, PR #35,
   `test-battery`, `actions-budget-approved`, 92-minute maximum and no retry before any new
   GitHub write. Merge into `develop` only if that exact attempt is terminal green and branch
   protection is satisfied.

### Product vision and HUMAN boundary

The browser game remains the main bread-and-butter product: a deterministic, effectively infinite
universe built for repeat exploration, mining, crafting, exceptional loot and Pureforged gear,
creature discovery/care/breeding and Pokémon-like combat, Guardian progression and long-term return
play. Existing implemented systems and their source-aligned Markdown references remain the
foundation; this repair makes admission evidence truthful without recreating those systems.

Authored visual/listening/accessibility/first-journey judgment, physical phone/tablet install, heat,
battery and true-GPU review remain HUMAN. Explicitly parked design/production work remains in the
system references and `port/V2_PROGRAM_ROADMAP.md`; this harness repair does not silently claim it.

### Paired Git/Claude handoff

- **OpenAI/Codex next:** complete the exact local sequence above. Do not push or start another
  hosted attempt without Nick's fresh exact-head authorization.
- **PR:** existing draft #35, base **develop**, source **openai/mac**. Copy-ready title:
  **feat(v2): complete roadmap campaign and harden action-time CI evidence**.
- **Copy-ready PR description:** “Completes the established v2 roadmap campaign without recreating
  its systems; preserves creature/genome/universe art structures; hardens Compendium Back evidence
  with a strict trusted action-time witness captured after final row settlement; synchronizes all
  current references; and binds admission to one exact no-retry Compendium → Slice → Glass develop
  chain. Product behavior, CSS, the fixed ruler and browser-version policy are unchanged. No
  release, version bump or deployment is included.”
- **Claude Code next:** Nick does **not** need to open Claude until the new exact PR #35 head is
  terminal green and merged into `develop`. Claude should then branch from that integration commit
  under `anthropic/*` for the full-plan polish review; Claude must not edit this OpenAI worktree.
- **Release status:** no release, version bump, preview publication or deployment is in progress.
