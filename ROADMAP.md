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

## ▶▶▶ SESSION HANDOFF — 2026-08-30 · 4AC4 EVIDENCE PRESERVED · TWO FALSE REDS REPAIRED · ONE CHAIN NEXT ◀◀◀

### Exact current boundary

- **Owner/scope:** OpenAI/Codex desktop on macOS at
  `/Users/nick/Projects/celestial-frontier-openai-mac`, branch **openai/mac**, upstream
  **origin/openai/mac**. This batch is V2-only. Legacy `main.js` /
  `celestial-frontier.html`, `develop`, `main`, the live site and every other worktree
  remain untouched.
- **Signed evidence source:** exact commit
  **4ac4d3cf8b717e0a2a52d53a4e6e2c5eb89637a1** (tree
  **a00c83dd5867c88b89d9474f868f3e930cc18d42**, parent
  **8bdf474e92467652729a6980f706ca3a2813682c**) has a verified ED25519 SSH signature. It is
  **30 commits ahead** of `origin/openai/mac` and supplied the one-attempt Compendium PASS plus
  terminal Slice red below.
- **Current local repair:** no product source changed. The worktree changes only
  `port/v2/tools/slicesmoke.mjs`, immutable 4ac4 evidence carriers, this live handoff/archive and
  `audits/README.md`. Commit these as one SSH-signed successor before any fresh tracked-input or
  browser command.
- **PR boundary:** draft PR **#35**, base **develop**, source **openai/mac**, remains blocked and
  unmerged. Remote head **017fa6decbc41809188768ccdb98ab86ef1b9ebc** and fetched base
  **7a9f4c1370dd84292388d718c38ff34214f6203b** remain unchanged. Nothing in this batch is pushed.
- **Actions boundary:** `GITHUB_ACTIONS_BUDGET.md` is **UNFROZEN**, the repository is assumed
  public, and **zero hosted attempts are authorized**. Do not push, label, dispatch, rerun, mark
  Ready, merge, release, bump a version, publish or deploy without one new exact authorization.
- **Browser policy:** Microsoft Edge **152.0.4191.53** / CDP **1.3** is provenance only.
  Compatible Edge/Chrome/Chromium updates never trigger a rebaseline or threshold change.

### Immutable 4ac4 evidence — Compendium PASS, then terminal two-scope Slice red

- Compendium run `20260830183843086-13837-7b626b40e8` passed its named verifier and all
  **78/78** outcomes (39 phone + 39 desktop) in **65,002 ms**, once with zero retry.
  `audits/ARC1C_COMPENDIUM_PR35_EXACTNESS_PASS_20260830_4AC4D3C.json.gz` is **519,732 gzip /
  10,777,529 raw bytes**; gzip/raw SHA-256 is
  **64d9b29a20e0841bbfedc427fffa831895402b1c49bc2db69073e62f2cb8db6b** /
  **ac188c49aaaefff92f1efc9ea5d856de39dc418d6c89407ea974b9aba2fba85b**.
- The exact unchanged source then ran Slice `20260830184013566-14221-2941ac202e95` once. It
  stopped terminal red after **152,754 ms**, with zero retry and two independent scopes:
  `arc-5-compact-carrier-boot` and `arc-4-tame-greeting-audio-start`.
- Slice JSON/log carriers
  `audits/ARC4_SLICE_PR35_COMPACT_AUDIO_FIXTURE_RED_20260830_4AC4D3C.{json,log}.gz` are
  **140,191 / 65,708 gzip bytes** and **1,101,615 / 455,499 raw bytes**. Their gzip SHA-256 is
  **4df4d3d0a8f165d9eba78480acff7461e08d79ad278e2e24dbf1280e2ec9c6ab** /
  **7012e78bf0d3db3f204a7353fe6ee0ba19563acaca2c300e1352059d84e3efcb**; raw SHA-256 is
  **6c39ea537d2647f1439df8efbf7376661d891f9df4b8d3b4df7384597c59ea88** /
  **026aa75231e0fd08f1a91b00f2d48b80d01fd5cdf516db2fe0390d6cd179151a**.
- The stored Slice remains FAIL and is never relabelled. Glass and Recovery did not run and have
  no `4ac4d3c…` successor authority.

### Bounded repair — no product change and no new checks

- **Arc 5 false red:** every migration-specific outcome passed: exact legacy stage/source,
  one-CAS upgrade, receipt/RNG stability, four-shard integrity, aligned zero-write reload,
  replacement-document identity and both mutations. The only failure used the global F4 commit
  total as if it belonged solely to Arc 5, rejecting the legitimate second Arc 9 progression
  catch-up transaction. Only those two global `commits === 1` predicates are removed; both exact
  Arc 5 runtime projections and the isolated upgrade document's one-CAS assertion remain.
- **Audio fixture false red:** the shared Pertar scenario and oracle own Chapter index 1 plus the
  first alien-world bioscan, but its source accidentally inherited the veteran save's later
  `asc === 2`. Product correctly omitted the ineligible Charter bonus. The collector then aged
  past the normal 3.6-second toast lifecycle, even though its terminal observation proved exactly
  one claimed event and one naturally completed voice with zero stops, steals, rejections or
  faults. The fixture now starts at `asc === 1` with `c2-scan` absent/zero; its audio digest is
  resealed. The derived Arc 0 landing-fault fixture stays at its prior later Charter chapter so it
  remains a landing-publication scenario, not a new reward test. The strict live assertive-toast,
  Charter-copy, one-start and no-replay checks remain.
- **Causal stop:** compact-carrier failure now uses the existing fail-stop path. A future red ends
  Slice immediately instead of running a later independent journey and presenting multiple
  problems at once.
- **Frozen scope:** no check, test file, stage, timeout, retry, product schema, balance, RNG,
  browser ruler or rebaseline was added. The inventory stays **251 files / 2,501 passed / 1
  skipped**. This is the hard boundary for the remaining campaign: consolidate/fix existing
  certification only; do not grow a second product around the game.

### Browser-free acceptance

- Focused fixture/audio/Arc 0 coverage: **5 files / 89 passed**.
- Complete V2 suite: **251 files / 2,501 passed / 1 skipped** in **23.39 seconds**.
- `npm run typecheck`: green across root, game and worker configurations.
- `node --check port/v2/tools/slicesmoke.mjs` and `git diff --check`: green.
- No app/gameplay file changed. Browser-free green is not fresh browser, HUMAN, hosted, merge,
  release or deployment authority.

### Exact next work — one admission and one no-retry browser chain

1. Commit this bounded harness repair, immutable evidence and synchronized Markdown as one
   SSH-signed successor of exact `4ac4d3cf8b71…`; verify its signature and a clean tree.
2. Run `node tools/tracked-input-preflight.mjs` from `port/v2` on that exact clean commit.
   Stop on nonzero. Do not add another suite or repeat the 2,501-test battery manually.
3. Run the existing Compendium selftest/preflight, then one commit-derived Compendium execution
   and exact named verification. No fallback and no retry.
4. Only if Compendium is green, run the existing Slice report selftest, one Slice execution and
   exact named verification. Stop on any red; do not run Glass or Recovery.
5. Only if Slice is green, run one Glass bound to that exact Slice and one Recovery bound to both
   exact predecessors, with their existing selftests/verifiers. Preserve and stop at first red.
6. Preserve exact final evidence, refresh current docs, sign the closure and rerun tracked-input
   preflight once on the final clean commit.
7. Report immutable final head/base to Nick. A hosted write still requires a new authorization
   naming that exact pair.

### Product-roadmap and HUMAN boundary

The dependency-ready V2 gameplay campaign remains implemented. This repair does not recreate or
redesign the established creature/genome, Guardian/Prime Codex, loot/Pureforged, exploration,
combat, progression, universe-wide visual or audio systems. Existing creature anatomy,
silhouette, proportions, topology, seeds, identity and interaction geometry remain protected.

Still-open items require authored product decisions or HUMAN/device evidence and must not be
invented merely to call the roadmap complete: conquest-imbue coexistence, another Guardian reward
table, canonical mission/care/healing rules, broader Chronicle/Museum history, achievement reward
claims, Fifty Paragons, remaining production media/depth, real-veteran import, accessibility, and
physical phone/tablet install, heat, battery, true-GPU and first-journey judgment. Current system
references and `port/V2_PROGRAM_ROADMAP.md` own those boundaries.

### Paired Git/Claude handoff

- **OpenAI/Codex now:** sign this bounded repair, run exact clean admission, then one serial
  Compendium → Slice → Glass → Recovery chain with causal stop and no retry.
- **GitHub step now:** none. Zero hosted attempts are authorized.
- **PR #35:** existing draft; base **develop**, source **openai/mac**, title
  **feat(v2): complete roadmap campaign and harden CI parity**.
- **Claude Code now:** Nick does **not** need to open Claude yet. Claude must not edit this OpenAI
  worktree. After PR #35 is terminal-green and merged into `develop`, Claude should use an
  `anthropic/*` branch from that exact integration commit for the requested whole-plan polish.
- **Release status:** `develop`, `main` and the live site remain unchanged. No release, version
  bump, preview publication or deployment is in progress.
- **Actions budget:** UNFROZEN, repository assumed public, private cap 3,000 fail-closed,
  **zero authorized hosted attempts**.
