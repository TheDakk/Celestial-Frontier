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

## ▶▶▶ SESSION HANDOFF — 2026-08-30 · 8BDF COMPENDIUM GREEN · SLICE ORACLE RED PRESERVED · SHIFTED LEFT ◀◀◀

### Exact current boundary

- **Owner/scope:** OpenAI/Codex desktop on macOS at
  `/Users/nick/Projects/celestial-frontier-openai-mac`, branch **openai/mac**, upstream
  **origin/openai/mac**. This batch is V2-only: `port/v2` game/evidence tooling/tests, derived
  authority budgets and current Markdown. Legacy `main.js` / `celestial-frontier.html`,
  `develop`, `main`, the live site and every other worktree remain untouched.
- **Signed browser-evidence source:** exact commit
  **8bdf474e92467652729a6980f706ca3a2813682c** (tree
  **7e8f770af63e13e13e57f292ff566f3ceb7f4830**, parent
  **41ca03e8207014b984ed97a3beb150b71162f255**) has an embedded, cryptographically verified
  ED25519 SSH signature. It is **29 commits ahead** of `origin/openai/mac` and supplied the
  one-attempt Compendium PASS plus terminal single-scope Slice red below.
- **Current local repair:** the worktree based on signed `8bdf474…` changes only V2 evidence
  contracts/tests plus immutable carriers and current Markdown. It changes no game product code.
  Commit it as one SSH-signed successor and verify a clean tree before any new tracked-input or
  browser command; a fresh session should resolve and verify that current HEAD.
- **PR boundary:** draft PR **#35**, base **develop**, source **openai/mac**, remains blocked and
  unmerged. Remote head **017fa6decbc41809188768ccdb98ab86ef1b9ebc** and fetched base
  **7a9f4c1370dd84292388d718c38ff34214f6203b** remain unchanged. Nothing in this batch is pushed.
- **Actions boundary:** `GITHUB_ACTIONS_BUDGET.md` is **UNFROZEN**, the repository is assumed
  public, and **zero hosted attempts are authorized**. Do not push, label, dispatch, rerun, mark
  Ready, merge, release, bump a version, publish or deploy without Nick authorizing one exact
  final head/base attempt.
- **Browser policy:** Microsoft Edge **152.0.4191.53** / CDP **1.3** is recorded provenance.
  Compatible Edge/Chrome/Chromium point versions never trigger a rebaseline, threshold change,
  fallback or retry.

### Immutable 8bdf evidence — one Compendium PASS, then one terminal oracle red

- Compendium run `20260830-pr35-arc3-8bdf474e9246-compendium-certification` passed its named
  verifier and all **78/78** outcomes (39 phone + 39 desktop) in **64,108 ms**, once with zero
  retry. Carrier `audits/ARC1C_COMPENDIUM_PR35_ARC0_ORACLE_PASS_20260830_8BDF474.json.gz` is
  **450,176 gzip / 10,832,155 raw bytes**; gzip/raw SHA-256 is
  **802547558972a4c118df18fd2fe857c0ffabcbfcadb6f0cbc71cb31e25c435aa** /
  **c2fa92014af534a96725c3fa81662ebc49d158e3441a972bee663b8d8b1da77a**.
- The exact unchanged source then ran Slice
  `20260830-pr35-arc3-8bdf474e9246-slice-certification` once. It stopped terminal red after
  **111,490 ms**, with zero retry and exactly one scope:
  `arc-0-landing-publication-convergence`.
- Slice JSON carrier
  `audits/ARC4_SLICE_PR35_ARC0_PUBLICATION_ORACLE_RED_20260830_8BDF474.json.gz` is **97,319 gzip /
  726,598 raw bytes**, SHA-256
  **d8fc5dbf6731c0e95aa5984cd945f1995d9ba25c0dc985cca2ffb59cbdb9305f** /
  **b0df4530c52c99ee6bdd8e29af1af0b9ba207a45b36b9e6393f067a2540448f3**.
- Slice log carrier of the same stem is **43,114 gzip / 303,026 raw bytes**, SHA-256
  **b88600767390ef5d79f17134fda5d5093d1d2fb13121d9d869bc2127389c7a9c** /
  **46be64ce0506c0d761787acff8f7d4f02d1bd2e54085f9fce74f932691ed1c17**.
- The stored Slice remains FAIL and is never relabelled. Glass and Recovery did not run and have
  no `8bdf474…` successor authority.

### Root diagnosis and shift-left repair

- **No product defect:** the pre-action and held old-document live products have zero differing
  fields; both serialize to **1,876 bytes** with SHA-256
  **e353f175bdea46856ef7b6c9e1bc554a50870fa054dc7a687a293bb761ce9e78**. Both correctly retain
  `cardOpen: true` and `cardTitle: "Pertar"`.
- **Impossible old oracle:** the same check also called a pre-Survey source-route helper requiring
  `cardOpen: false`, so a correct post-Survey state could never pass.
- **Shifted left:** the new runner atomically captures held state, card code and target before
  release. The complete absolute Pertar route, rendered-scene, open card, canonical CF1 payload and
  exact-key target predicate live beside `assessArc0LandingPublicationWithheld` in the shared
  browser-free contract. Independent mutations cover every field plus old-document product drift
  before Edge opens.
- **Real-red replay:** `port/v2/tests/pr35-8bdf-arc0-publication-evidence-replay.test.ts` binds all
  three carriers, signed source, 78/78 predecessor, one terminal scope, no-retry/no-successor
  boundary, exact held product/state contradiction and the historical absence of held
  `cardCode`/target capture. It does not promote the pre-action Survey values into held evidence;
  the next run must supply the new complete capture.
- **Prior bounded repairs remain:** Research/Fabricator focus lineage, explicit Survey predecessor,
  exact coordinator idle, current Arc 5 v3 diagnostics and 74-row Guide inventory are unchanged.
- **No behavior inflation:** no retry, sleep, timeout increase, save/gameplay schema bump, balance,
  RNG, world/genome/creature identity, creature/biome/art structure, audio, numeric ruler or
  compatible-browser rebaseline changed.

### Current browser-free and derived-authority acceptance

- Full V2 suite: **251 files / 2,501 passed / 1 skipped** in **23.49 seconds**.
- **`npm run typecheck`: green** across root, game and worker configurations.
- Latest focused Arc 0 + real-evidence replay: **16/16 green**.
- Syntax checks and `git diff --check`: green. Independent product-flow review confirms no
  `main.ts` change is warranted.
- Development bulletin: **74 bullets**, ordered rendered SHA-256
  **050b8cbf52bc3eeb2a247acd8ecb5c1e01d123bf2e00c19c8f08eafe7d44e892**.
- Current Compendium producer / index / owner / generated service worker:
  **f2f1629a98962801a740d0448d955d08c1ccd9157149edb42169bf0a317e43f3** /
  **45fc756d924fabd03b3b214e0fd80697e463c59a686a190fcee2b076d05de27c** /
  `assets/main-BYnoCcc9.js` (**13afe063806bca9b829866070c08741ea0749ca07c1d7dcecf3175c1dae9bfa5**) /
  **5a968f36984021e39a0cb9e70b2ec37b607563c08a29240b078b828f3d0607d3**.
- Current Scene build / gameMain: **9351f6fc2311365a5dfc8a4c0b0629d862d7c91f6cd00a83e236b1ce824a6e17** /
  **07bdf8aac9bd8224870f2749df18461576d733c55555698dd247ddeffb83f831**.
  Compendium / Scene budget-file SHA-256:
  **c4f6dddffdf88e42819c567c26132a66f3924a7423002cbfca4564e2defb9d0b** /
  **670f8ecc2c0bc5715fb92b263820db577a70c3faf254151ff11f45de8fe645f7**.
- Fixed rulers, numeric ceilings, calibration samples and historical authorities are unchanged.
  Browser-free green is not fresh browser, HUMAN, hosted, merge, release or deployment authority.

### Exact next work — one clean admission and one no-retry browser chain

1. Commit the shared-assessor repair, real-evidence replay, immutable carriers and synchronized
   Markdown as one SSH-signed successor of exact `8bdf474e9246…`; verify its embedded signature
   and a clean tree.
2. From `port/v2` on that exact clean commit, stop on any nonzero:

       node tools/tracked-input-preflight.mjs
       npm run compendiummem:selftest
       node tools/compendiummem-browser-preflight.mjs --selftest
       node tools/compendiummem-browser-preflight.mjs

   Browser-owning commands run outside the macOS sandbox. No fallback or automatic retry exists.
3. Reserve one commit-derived Compendium ID; run Compendium once and named-verify that exact report.
   Preserve and stop on any product-red or instrument-red.
4. Only if Compendium is terminal-green, run `smoke:report:selftest`, one `smoke:ci`, and exact
   named Slice verification. Preserve and stop if Slice is red; do not run Glass or Recovery.
5. Only if Slice is terminal-green, run `glassmatrix:selftest`, one Glass bound to that Slice and
   exact two-ID verification; then `arc4recovery:selftest`, one uninterrupted Recovery bound to
   both predecessors, and exact three-ID verification. Stop at the first nonzero/red/instrument.
6. Preserve exact reports/logs/PNGs, update `audits/README.md` and this handoff, sign the evidence
   closure, then rerun tracked-input preflight on the final clean committed index.
7. Report immutable final head/base to Nick. A hosted write still requires one new authorization
   naming that exact pair; no current local result authorizes push, label, battery or merge.

### Product-roadmap and HUMAN boundary

The dependency-ready V2 gameplay campaign remains implemented. This repair does not recreate or
redesign the established creature/genome, Guardian/Prime Codex, loot/Pureforged, exploration,
combat, progression, universe-wide visual or audio systems. Existing creature anatomy, silhouette,
proportions, topology, seeds, identity and interaction geometry remain protected.

Still-open items require authored product decisions or HUMAN/device evidence and must not be
invented merely to call the roadmap complete: conquest-imbue coexistence, another Guardian reward
table, canonical mission/care/healing rules, broader Chronicle/Museum history, achievement reward
claims, Fifty Paragons, remaining production media/depth, real-veteran import, accessibility, and
physical phone/tablet install, heat, battery, true-GPU and first-journey judgment. Current system
references and `port/V2_PROGRAM_ROADMAP.md` own those boundaries.

### Paired Git/Claude handoff

- **OpenAI/Codex now:** commit this browser-free oracle repair/evidence handoff, run exact clean
  tracked admission, then one serial Compendium → Slice → Glass → Recovery chain with causal
  stop/no retry.
- **GitHub step now:** none. Zero hosted attempts are authorized.
- **PR #35:** existing draft; base **develop**, source **openai/mac**, title
  **feat(v2): complete roadmap campaign and harden CI parity**.
- **Copy-ready PR description:**

      Completes the dependency-ready V2 local roadmap campaign while preserving established
      creature/genome, Guardian/Prime Codex, loot/Pureforged, exploration, combat, progression,
      universe-wide art/audio and save-schema boundaries. Exact signed 8bdf474 passed Compendium
      78/78 once/no-retry, then preserved a terminal single-scope Slice red with no Glass/Recovery
      successor. The Landing product was byte-exact; the old instrument impossibly required its
      certified open post-Survey Pertar card to be closed. The repair moves exact product/route
      judgment into a browser-free assessor, adds isolated controls and replays the immutable real
      red locally. Earlier focus, Survey predecessor, coordinator, Arc 5 v3 and Guide-inventory
      repairs remain. Browser-free acceptance is 251 files / 2,501 passed / 1 skipped with all
      typechecks green. A fresh exact clean-head
      Compendium → Slice → Glass → Recovery chain remains required before this draft can become
      Ready or use one authorized hosted battery. No legacy-v1 source, production release, version
      bump, preview publication or deployment is included. Base: develop. Source: openai/mac.

  Append the immutable final head/base and exact browser-chain result only after closure.
- **Claude Code now:** Nick does **not** need to open Claude yet. Claude must not edit this OpenAI
  worktree. After PR #35 is terminal-green and merged into `develop`, Claude should create/update
  an `anthropic/*` branch from that exact integration commit for the requested whole-plan polish.
- **Release status:** `develop`, `main` and the live site remain unchanged. No release, version
  bump, preview publication or deployment is in progress.
- **Actions budget:** UNFROZEN, repository assumed public, private cap 3,000 fail-closed,
  **zero authorized hosted attempts**.
