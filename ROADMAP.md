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

## ▶▶▶ SESSION HANDOFF — 2026-09-01 · OWNER-CLAIM LATCH REPAIR LOCALLY CERTIFIED ◀◀◀

### Exact current boundary

- **Owner/scope:** OpenAI/Codex desktop on macOS at
  `/Users/nick/Projects/celestial-frontier-openai-mac`, branch **openai/mac**, upstream
  **origin/openai/mac**. Published remote HEAD remains exact SSH-signed
  **6f6fb4fbb80ebdc685fd073ac6b06a1496a8f921**. Exact local SSH-signed implementation source
  **a45220421195042a8702aa1265e96d40d839fc38** (tree
  **9a30b2d74d4949a16a56809dc4197c12cc7c3c74**, parent **6f6fb4f…**) contains the bounded repair.
  This handoff and its four immutable carriers form an evidence/docs-only closure over a452204;
  no product, instrument, workflow or ruler bytes change after the certified source. The signed
  closure branch head is clean and passes the hermetic tracked-input `develop` profile at **259
  files / 2,665 passed / 1 skipped**; resolve its exact transport identity with `git rev-parse HEAD`.
- Exact 4a595e2's prior local **Compendium → Slice → Glass** pass remains immutable historical
  evidence only. The current certificate is the distinct exact-a452204 chain below.

### Sixth exact hosted attempt — consumed terminal red

- Nick authorized PR #35's one-time `test-battery` for exact head **6f6fb4f…** against exact base
  **7a9f4c1370dd84292388d718c38ff34214f6203b**, label `actions-budget-approved`, maximum
  92 minutes and no retry. The branch/PR metadata was synchronized and PR #35 was made Ready.
- GitHub run **33522000552**, attempt 1, used synthetic merge
  **e0e9e96ef96e0904a5dd3927df1e6ed9c9cb4e2d** / tree
  **d3700156b50d9b72911b3071708c422906de9644**; the tree is byte-identical to exact head.
  Authorization job **99903322649** passed; battery job **99903362700** completed terminal red.
- Every invoked stage through Compendium passed. Compendium
  **gha-33522000552-1-compendiummem** passed **78/78** once/no-retry in **1,764,010 ms** with
  zero findings/blocked outcomes and six review PNGs.
- Slice stopped once/no-retry after **206,138 ms** with exactly **1 finding / 1 scope**,
  `harness`: `universe-to-galaxy zoom did not reach its browser outcome within 6000ms (last null)`.
  Six screenshots were retained. Glass, Recovery and preview packaging correctly did not run.
- The approval label was removed. The attempt is consumed, PR #35 remains Ready/open/unmerged, and
  **no hosted attempt, retry, push, PR metadata mutation or merge is currently authorized**.

### Root cause and bounded successor

- Automatic galaxy arrival and wormhole traversal could consume a one-shot latch after a caller
  preflight but before the mutable direct-travel owner actually claimed its shared coordinator and
  `activePersist`. Its second synchronous authority check could still refuse, leaving the same
  centered zoom intent permanently suppressed. A timeout or retry cannot recover a consumed latch.
- `settleArc9DirectTravel` now invokes one `onAttemptClaimed` callback only after coordinator and
  persistence ownership are installed and before its first await. Galaxy claims its latch in that
  callback. Mutable wormhole begin receives the automatic key and claims its latch in the same
  callback; inspection-only navigation publishes synchronously without consuming the mutable latch.
  Refusal/defer is no attempt; held → clear → unchanged intent produces exactly one accepted action.
- Slice owns a diagnostics-only, identity-cleared `activePersist` hold. It creates no IndexedDB
  write, save mutation, revision or receipt. The browser control quiesces an already-running exact
  document heartbeat, proves two held ticker turns with a null latch and idle coordinator, verifies
  raw F4 authority stayed byte-exact, releases once, then requires one
  `arc9-galaxy-arrival-v1` and one `arc9-travel-committed:` fixed point.
- The readiness contract permits `migrated-v4` only through explicit opt-in on the initial exact
  document with no previous token; defaults, reloads and replacements remain strict.
- Current Compendium producer authority is
  **dce2cb58666a3d57f510bd2f3417111ab8ccb553513f103a7ff65f79b7b27753** and current budget-file
  SHA-256 is **c215ede9ed0075aedd33a4d09233c63794b675d608a92b26546171e68187d9e3**. The fixed ruler,
  numeric ceilings, 78-outcome inventory, historical samples and version-tolerant Edge-family/CDP
  1.3 policy are unchanged; this is a producer rebind, not recalibration.

### Verification and evidence now present

- Focused Arc 9/readiness/fixed-point/Compendium/current-authority verification passes
  **5 files / 79 tests**; the final two-file inspection/cleanup control rerun passes **16/16**.
  `node --check`, `git diff --check` and all three TypeScript programs pass. Independent rereview
  approved the product order and heartbeat binding; its two test-only false-green findings now have
  executable negative controls.
- The complete browser-free develop profile passes **259 files / 2,665 passed / 1 skipped**, all
  TypeScript programs, **34** clean art sources, **1,014/1,014** routes and **454** non-inert fields.
- Exact a452204 passed the clean tracked-input `develop` preflight with the same **259 files / 2,665
  passed / 1 skipped** inventory. Edge `152.0.4191.53` / CDP `1.3` then supplied one unchanged-
  source, fail-fast/no-retry local develop chain; its point version is provenance only:
  - Compendium **20260901164254371-82172-eaeba62d1a** passed **78/78** with zero findings/blocked
    outcomes, complete phone/desktop profiles and six review PNGs in **65,076 ms**, then passed its
    exact named verifier.
  - Slice **20260901164421191-82525-616ea739fbb1** passed the full core loop, repaired held-intent
    universe→galaxy control, all ten screenshots and zero console errors/findings/scopes in
    **361,371 ms**, then passed its exact `develop` verifier. Report SHA-256 is
    **d9c4abec7764d37bb029d115d2162931ccc5ffaf3fb26754d2ab3881a4bd902b**.
  - Glass **20260901165038911-82999-7c3323ea05c7** consumed that exact Slice and passed **12/12**
    viewports with zero findings/instrument failures, no blocked/omitted controls and no retries in
    **113,150 ms**, then passed its exact Slice-bound verifier. Report SHA-256 is
    **2554d6843a198ee02b3a417bb77ea035f2c73bc4db47ff0124e6ccb1783fc887**.
- Hosted evidence is preserved as deterministic gzip carriers:
  `ARC1A_COMPENDIUM_PR35_AUTOMATIC_ARRIVAL_LATCH_PREDECESSOR_PASS_20260901_E0E9E96.json.gz`
  (gzip **487,460** bytes / **5548afae…**; raw **12,837,924** / **3376d856…**),
  `ARC4_SLICE_PR35_UNIVERSE_GALAXY_TRANSIENT_LATCH_RED_20260901_E0E9E96.json.gz`
  (gzip **1,600** / **05b8fc38…**; raw **4,547** / **efa5a506…**) and its log
  (gzip **1,677** / **602915a0…**; raw **4,097** / **04626d14…**). Exact full hashes and GitHub
  artifact metadata are in `audits/README.md`.
- The clean a452204 chain is preserved by four more deterministic gzip carriers: Compendium
  (gzip **453,964** / **ef0179a7…**; raw **10,878,178** / **23625d7f…**), Slice report
  (gzip **1,957** / **d2641592…**; raw **6,126** / **d9c4abec…**), Slice log
  (gzip **3,289** / **18a37aab…**; raw **6,950** / **03f495ae…**) and Glass
  (gzip **78,745** / **53541e4f…**; raw **898,685** / **2554d684…**). Exact filenames and full
  hashes are in `audits/README.md`.

### What remains

1. Ask Nick for one fresh authorization naming the final exact `git rev-parse HEAD`, base
   **7a9f4c1370dd84292388d718c38ff34214f6203b**, PR #35,
   `test-battery`, `actions-budget-approved`, 92-minute maximum and no retry. Push/update/label only
   under that authorization; stop after any hosted red and do not automatically retry.
2. Merge into `develop` only if that exact hosted attempt is terminal green and branch protection
   is satisfied. Claude then begins the requested full-plan polish review from the exact merge.
3. Do **not** repeat or rebind the a452204 browser chain: the final descendant changes only
   evidence/docs and the exact implementation certificate remains bound to a452204.

### Unchanged product and HUMAN boundary

The repair changes no save schema, CF1/deterministic generation, creature/genome/plant/biome/
Guardian structure, art/audio, gameplay balance, progression rewards, copy, CSS, geometry, memory
ceiling, timeout or retry. The browser game remains the main product: effectively infinite
exploration, mining/crafting/loot and Pureforged gear, creature care/breeding/combat, Guardian
progression and long-term return play. Authored visual/listening/accessibility/first-journey
judgment, physical-device heat/battery/install and true-GPU review remain HUMAN.

### Paired Git/Claude handoff

- **OpenAI/Codex next:** request one fresh exact-head authorization for the locally complete branch.
  Do not push, label, dispatch, mutate PR metadata or merge before it is granted.
- **PR:** existing #35, base **develop**, source **openai/mac**. Copy-ready title:
  **feat(v2): complete roadmap campaign and harden action-time CI evidence**.
- **Copy-ready PR description:** “Completes the established v2 roadmap campaign without recreating
  its systems; preserves creature/genome/universe art structures; hardens action-time evidence and
  exact Survey/Share/Travel settlement; treats transient automatic travel refusal as no attempt;
  claims galaxy/wormhole one-shot latches only from the mutable owner's synchronous coordinator and
  persistence claim; and retains immutable sixth-attempt evidence. No timeout, retry, Edge rebaseline,
  fixed-ruler, save-schema, release, version, preview or deployment change is included.”
- **Claude Code next:** Nick does **not** need to open Claude yet. Open it only after PR #35's final
  exact head is terminal green and merged into `develop`; Claude must use a fresh `anthropic/*`
  branch and must not edit this OpenAI worktree.
- **Release status:** no release, version bump, preview publication or deployment is in progress.
