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

## ▶▶▶ SESSION HANDOFF — 2026-08-30 · 8792 RED PRESERVED · FOUR-PASS SOURCE READY TO SIGN ◀◀◀

### Exact current boundary

- **Owner/scope:** OpenAI/Codex desktop on macOS at
  `/Users/nick/Projects/celestial-frontier-openai-mac`, branch **openai/mac**, upstream
  **origin/openai/mac**. Exact clean signed source
  **8792e8acc5c20562ae3e17c48d46050824eb99d5** (tree
  **3a6f3639caae6521ed2b6c4fa20fa5392a6fee61**, parent
  **fc18f0416d7b58b2f5b4ed3a0829e259f3dd951b**) is **42 commits ahead** of the fetched remote
  agent branch. Its embedded SSH signature was cryptographically verified.
- **Exact 8792 browser-free boundary:** the hermetic tracked develop preflight passed **253 files /
  2,529 passed / 1 skipped**, all three strict TypeScript programs, **34** art sources with zero
  findings, **1,014/1,014** routes and **454** specification fields with zero inert fields. All five
  classifier-required browser-instrument controls passed once.
- **Exact 8792 terminal stop:** SceneMemory run
  `20260830-pr35-8792e8a-feed-summary-scenemem-certification` ran once/no-retry on Microsoft Edge
  `152.0.4191.53` / CDP `1.3` and completed cleanup in **13,322 ms** at **43/44**. The sole finding
  was `desktop/heap-plateau`; its PASS verifier correctly failed. Compendium, Slice and Glass did
  not run.
- **Preserved evidence:**
  `audits/ARC1C_SCENEMEM_PR35_FEED_SUMMARY_HEAP_PLATEAU_RED_20260830_8792E8A.json.gz` is **49,864
  gzip / 788,479 raw bytes**. Gzip/raw SHA-256 is
  **ddffe7c9c6a3f70be691bbf2aace67dcaf589c9d51bed49815faaeca80e9b2ab** /
  **26123f30de359a2a89802f8b52a085eca44383b9326135e4f426f0846b34ba13**. The original two-pass
  report remains immutable FAIL; it is never retried or relabelled.
- **Diagnosis:** desktop scored aggregate range was **525,716 B** against **524,288 B** and maximum
  positive slope was **168,448.8 B/cycle** against **131,072 B/cycle**. Product ownership stayed
  flat at one scene scope, 19 leases/textures, 18,350,080 live Canvas bytes, 87 managed entries,
  469 nodes / 70 listeners and zero pending work. The endpoint embedder charge moved after the
  scored sample and later fell again; removing only that endpoint-native excess restores both
  product rulers. This is honest two-pass instrument-inconclusive evidence, not proof of a product
  leak and not authority to raise a product threshold.
- **Current dirty batch:** the SceneMemory instrument now always takes four complete passes for
  each snapshot:
  passes 1–2 are fixed settling passes, passes 3–4 are the fixed validity pair, and only pass 4 is
  scored. All raw passes are retained. Absolute pass-4 minus pass-3 deltas for V8, embedder, backing
  and aggregate must remain within one calibrated per-profile phase ceiling; invalid phase stops
  `instrument-fail` before the product contract. Focused SceneMemory coverage is **154 passed**;
  the full browser-free suite is **253 files / 2,539 passed / 1 skipped**, typecheck is green and
  the producer-authority printer is green. Current collector SHA-256 is
  **936d1bfd9cba6bc59c4cd889160981e612e15b012406c55f22cce11108a682a3** and the exact tracked
  calibration-required budget SHA-256 is
  **f453cfe548ec86f65727de17d23a8ef76c2dc3c1bb024c22eb308ff299ccfd99**. No game product source,
  product range/slope limit, timeout, retry, Edge
  baseline, creature/genome, save, art/audio, balance or release identity changed.
- **PR/Actions boundary:** draft PR **#35**, base **develop**, source **openai/mac**, remains Draft,
  blocked, unmerged and unpushed at remote head **017fa6decbc41809188768ccdb98ab86ef1b9ebc**
  against fetched base **7a9f4c1370dd84292388d718c38ff34214f6203b**. `GITHUB_ACTIONS_BUDGET.md`
  is **UNFROZEN**, the repository is public, and **zero hosted attempts are authorized**. No push,
  label, dispatch, rerun, Ready transition, merge, release, version bump, publication or deployment
  is authorized.
- **Browser policy:** compatible Chromium-family browsers at CDP **1.3** are accepted by generic
  gates; SceneMemory and Compendium require Edge-family CDP **1.3**. Point versions are provenance
  only and never require a rebaseline or threshold change.

### Four-pass phase-validity decision

- Every snapshot follows four unconditional complete
  `answerable → GC → heap → carrier → DOM` passes. Passes 1–2 settle; passes 3–4 form the validity
  pair; pass 4 alone supplies product metrics. No pass is selected by value, and there is no
  minimum, best-of, conditional fifth pass, sample retry or run retry.
- Per snapshot, the instrument compares absolute pass-4/pass-3 deltas for V8 used, embedder heap,
  backing storage and their aggregate. Any invalid pair is instrument failure before product
  outcomes, so allocator phase cannot masquerade as either a product leak or a green certificate.
- Producer/schema changes require exactly **three** clean calibration-only candidates, each one
  attempt/no retry on one unchanged signed source/build/browser tuple. For each profile, let `M` be
  the maximum across its 30 candidate snapshots and all four fields. Select the smallest of
  **4/8/16/32/64 KiB** strictly greater than `M`; if `M ≥ 64 KiB`, activation is forbidden and
  diagnosis resumes.
- Calibration may select only the phase-validity ceilings. Existing product component, range,
  slope, growth, normalized-working-set, DOM/listener, resource, ownership, pending, BFCache,
  answerability and surface-vista limits remain unchanged. Calibration observations are not
  certificates, and activation is not certification.
- Calibration itself is fail-closed behind the canonical tracked v6
  `calibration-required` budget. Every candidate records that exact blob hash, and active-budget
  replay reads the blob from the candidate's reported clean source commit, revalidates it and
  cross-binds its producer/browser authority. Candidate carriers must be Git-tracked regular
  non-symlink files under `audits/`; invented, untracked, symlinked or cross-producer carriers fail.

### Exact next work

1. SSH-sign the reviewed clean calibration-required source and verify its signature.
2. Run exactly three clean calibration-only candidates, once each with zero retry. Preserve and
   replay each raw carrier, derive each profile's phase maximum and select only the deterministic
   bounded ceiling above. Any ownership, product-ruler or ≥64 KiB phase drift returns to diagnosis.
3. Activate the reviewed producer/schema/budget bindings without changing product rulers. Sign and
   verify that clean activation source.
4. On the exact activation commit, run the tracked develop preflight and the changed-instrument
   controls once, then one fresh fail-fast **SceneMemory → Compendium → Slice → Glass** chain on
   unchanged committed source. Stop after the first nonzero, red or instrument result; never retry.
5. Preserve and named-verify each available report and refresh this handoff. Do **not** run Recovery
   for agent → `develop`; Recovery belongs to a separately authorized production candidate.

### Product-roadmap and HUMAN boundary

This pass does not recreate or redesign the implemented V2 systems. The current batch changes only
SceneMemory measurement validity. The landed Feed semantic-summary repair, Capture publication
repair, universe-wide art treatment, creature/genome identity, capture math/pools, Guardians/Prime
Codex, loot/Pureforged, exploration, crafting, combat, care/progression, audio and deterministic
persistence remain otherwise untouched.

Still-open work that requires authored product decisions or HUMAN/device proof remains explicit in
the system references and `port/V2_PROGRAM_ROADMAP.md`: conquest-imbue coexistence, another
Guardian reward table, canonical mission/care/healing rules, broader Chronicle/Museum history,
achievement reward claims, Fifty Paragons, remaining production media/depth, veteran import,
accessibility, and physical phone/tablet install, heat, battery, true-GPU and first-journey
judgment. Automation must not invent those decisions merely to call the roadmap complete.

### Paired Git/Claude handoff

- **OpenAI/Codex now:** sign the reviewed four-pass source, collect exactly three calibration-only
  candidates, activate the bounded validity ruler, and run one fresh local no-retry develop chain.
- **GitHub step now:** none. Zero hosted attempts are authorized.
- **PR #35 after local green:** existing draft, base **develop**, source **openai/mac**, title
  **feat(v2): complete roadmap campaign and harden CI parity**. Its next exact push/hosted head is
  not authorized.
- **Claude Code now:** Nick does **not** need to open Claude yet. Claude must not edit this OpenAI
  worktree. After PR #35 is terminal-green and merged into `develop`, Claude should branch
  `anthropic/*` from that exact integration commit for the requested whole-plan polish.
- **Release status:** `develop`, `main` and the live site remain unchanged. No release, version
  bump, preview publication or deployment is in progress.
