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

## ▶▶▶ SESSION HANDOFF — 2026-08-30 · EXECUTION-LATE WORKER OWNERSHIP REPAIRED · SIGNED · CHANGED-HEAD CERTIFICATION NEXT ◀◀◀

### Exact current boundary

- **Owner/scope:** OpenAI/Codex desktop on macOS at
  /Users/nick/Projects/celestial-frontier-openai-mac, branch **openai/mac**, upstream
  **origin/openai/mac**. Work remains limited to the v2 port, its evidence tooling/tests and
  current Markdown. Legacy main.js / celestial-frontier.html, develop, main, the live-site
  repository and every other agent worktree remain untouched.
- **Signed implementation/evidence repair:** exact commit
  **fb423c4b52ca89721778baf5860f39a0faec6074** (tree
  **14d5ee9ff93a491ab8e72025ffe8f8a7fa5b5d35**, parent signed exact-source browser checkpoint
  **38d8848c984089d33f4bafa1043e36c2cbb2ce9e**) contains an embedded SSH signature. It preserves
  the exact 38d terminal product failure, adds an independent immutable replay, closes the
  execution-late first-install worker ownership gap, seals every adoption guard with direct
  negative controls, refreshes generated authorities/budgets and updates the existing v2 release
  note plus every affected current reference. It changes no creature, genome, painter, gameplay or
  save structure.
- **Documentation closure:** this lean handoff/archive update is the direct signed successor to
  fb423c4…. Resolve its exact current hash with git rev-parse HEAD; never overwrite or relabel
  either signed checkpoint.
- **Branch relationship:** fb423c4… is fourteen commits ahead of origin/openai/mac; its
  documentation closure adds one local commit. Fetched origin/develop
  **7a9f4c1370dd84292388d718c38ff34214f6203b** remains an ancestor. Nothing in this batch has
  been pushed.
- **PR boundary:** draft PR **#35** remains **openai/mac → develop**. Remote head
  **017fa6decbc41809188768ccdb98ab86ef1b9ebc** and base
  **7a9f4c1370dd84292388d718c38ff34214f6203b** are unchanged; the PR is blocked and unmerged.
- **Actions boundary:** GITHUB_ACTIONS_BUDGET.md is **UNFROZEN**, the repository is assumed
  public, and **zero hosted attempts are authorized**. The 3,000-minute cap applies fail-closed if
  visibility becomes private or ambiguous. Do not push, label, dispatch, rerun, mark Ready, merge,
  release, bump a version, publish a preview or deploy without Nick authorizing one exact final
  head/base attempt.
- **Browser policy:** compatible Edge/Chrome/Chromium point versions are provenance only. They never
  trigger a rebaseline, threshold change or product repair. Current local provenance is canonical
  Microsoft Edge 152.0.4191.53, CDP 1.3; acceptance remains family/protocol plus the sealed
  source-inventoried capability contract.
- **Historical automated chain:** signed source 3f69e88… retains the immutable green
  Layout → SceneMemory → Compendium → Slice → Glass → Recovery campaign. It is history only; no
  successor inherits or relabels it. Bare Glass still refuses without its exact named-verified
  Slice predecessor by design.

### Exact terminal product failure and immutable evidence

Exact clean signed source **38d8848c984089d33f4bafa1043e36c2cbb2ce9e** ran
**20260830-pr35-recovered-oracle-38d8848c9840-compendium-certification** exactly once with zero
automatic retries under accepted Edge 152.0.4191.53 / CDP 1.3. It stopped terminal
**product-fail after 3,115 ms** at phone veteran-earth-planetside settlement. Zero of 78 outcomes
ran, all 78 were blocked, and no desktop profile, review PNG, Slice, Glass or Recovery successor
was created.

The first worker-local painter import failed with stage import, code painter-import and exact
101-character message:

    Failed to fetch dynamically imported module: http://127.0.0.1:60340/assets/speciespainter-DJWZf0vw.js

Message SHA-256:
**4b70e1e85120ff791ef5461e1d9588edee6d17a6d162dc4b7edc0435d3500c53**.

Preserved immutable evidence:

- Carrier:
  audits/ARC1C_COMPENDIUM_PR35_PAINTER_IMPORT_PRODUCT_FAILURE_20260830_38D8848.json.gz
- Gzip: **6,053 bytes**, SHA-256
  **e45b2f65cc93ad717524d52ebddfdd504e2abedf5296d6d5aa287e949be968aa**
- Raw: **37,825 bytes**, SHA-256
  **63014b6dfea3790fe3618344bdf8d5b31de68e1ac54798f5fe80b5a41092ccf5**
- Independent replay: **4/4**, binding the exact signed source, browser, authorities, once-only
  lifecycle, phone stop, zero outcomes/all 78 blocked and the complete trusted worker receipt
  without importing the live budget or evaluator.

The earlier 830… instrument stop and d33… recovered-worker oracle red remain immutable historical
evidence. Neither is rebound or relabelled by this repair.

### Cause and fail-closed repair

The post-claim activation pass remains necessary but was not exhaustive. A dedicated/shared worker
whose realm was not execution-ready could be omitted by both the activation matchAll snapshots and
claim, then become controlled before its first lazy painter fetch. That fetch had a UA-owned
clientId but no retained-build pin, so the exact-build service worker correctly returned 503.

The repair closes only the unambiguous first-install case:

- on an unpinned non-navigation request, the generated service worker accepts adoption only when
  activeBuildId exactly equals its generated BUILD_ID, priorBuildId is null and clientId is valid;
- clients.get(clientId) must confirm a live client whose type is exactly worker or sharedworker;
- only then is the exact active pin written; the existing verified marker, inventory, path and cache
  gates still select the response, so success is zero-network and exact-byte;
- unknown/absent clients, windows, retained-prior/update states and wrong-active states remain the
  exact no-pin 503;
- removing the adoption seam recreates the product stop, while independent type, prior and active
  guard mutants each demonstrate the corruption their guard prevents;
- no sleep, retry, broad request adoption, network fallback, cross-build guess or Edge-version
  special case was added.

The repair changes disposable exact-app-byte routing only. It changes no save schema or write,
species painter byte/pixel path, seed, genome, anatomy, silhouette, palette, crop, biome/vista
structure, cache ruler, numeric ceiling, outcome inventory or player-visible system behavior beyond
preventing blank first-install worker art.

### Current authority and browser-free acceptance

- Browser capability:
  **35eb09daa39f211b8e9015f59b77a983b5870611322d673c47f7ff4f2b61e341**
- Compendium measurement:
  **fc54f822dc7f93481fbb1402b7c7940bc9a618b836112fd5514e8130de9f29ed**
- Outcome contract:
  **f756bc7557613dd6c61ecb35acd9de752d54a7d0e51a52e192f361dca3f4ab29**
- Collector:
  **2a74e941abbe701ca5c1d3952a7451ccd11ce3284d794f9e22aa0a79c0315237**
- Producer authority v2:
  **06ddfc4853c2f20e95f5433485a852e2cd72afe5a10d128cf1486313d924aabf**
- Generated index / owner:
  **4ae1f01cf82354a8812393ba9b2e95f869bcdde996cfa7bd7ed05d568b330fc7** /
  **26418744ec36102969f681b7ad0905ad864de78c72ddcf9d81d41a4537dd0fd1**
- Species worker / painter:
  **901c40143b09d43241fb311a877c422df6fb5d997350cf0da91220ef8a973c1e** /
  **de44ec89c54ab8e8d168e369bfdada554a08a9af4fd02f2ca777b7430d2b6686**
- Generated service worker:
  **a837e771b08c8a3b48c5d4331366cf243d9dcbd538057237273f63e9bf580d2a**
- Scene build:
  **aacc61fc7cf22a0199e6a4b35f0170d266ef3b54e43429f23542acb23229315e**
- Active Compendium budget:
  **1e2b751f66be8902d9e09a90f2e2510c518d69b2c5309ac40b7965263c6210af**
- Active SceneMemory budget:
  **15b35f6e1c39f8a49ff39eee3dbe3430c6a8e7bc34f46518f22254264002d327**
- Compendium selftest: **591/591 independent product/instrument controls pass**.
- Focused repair battery: **4 files / 74 tests pass**.
- Final authority/budget/PWA/carrier/release audit: **6 files / 112 tests pass**.
- Independent carrier replay: **4/4 pass**.
- Full browser-free v2 suite: **240 files / 2,437 passed / 1 skipped**.
- Root, app and worker TypeScript programs: **all green**.
- Independent authority printer: SceneMemory budget, Compendium measurement budget and Compendium
  producer budget **all match**.
- Canonical v2 draft release inventory: **73 bullets**, unchanged, distributed 13/14/16/18/12
  across its five categories.
- Rebuilt authority graph, gzip/raw reproduction, chronology review, scoped whole diff and
  adversarial PWA review: **green / CLEAR**.
- The superseded recovered-worker handoff is archived byte-verbatim with SHA-256
  **b48956f4fc447affa9b227fc0479049c4b75c8cd5a67e648701205b2394a426f**.

This is signed browser-free product/instrument authority. It is **not** a fresh Compendium browser
certificate, HUMAN visual acceptance, successor-chain evidence, hosted CI green or merge/release
authority.

### Exact next work — one changed-head attempt, then stop or advance

1. Sign this documentation closure and require a clean worktree. From port/v2, run
   node tools/tracked-input-preflight.mjs. Then run npm run compendiummem:selftest,
   node tools/compendiummem-browser-preflight.mjs --selftest and exactly one live
   node tools/compendiummem-browser-preflight.mjs. Any nonzero stops the campaign; there is no
   version-triggered rebaseline or automatic retry.
2. From that exact clean signed documentation HEAD, run exactly one fresh Compendium certificate
   with a unique commit-derived run ID and zero retries, then named-verify that exact immutable ID.
   A product-red or instrument-red stops the chain and is preserved before any changed-head repair.
3. Only if Compendium is terminal-green, keep the committed source unchanged and run the strict
   serial chain copied in port/v2/README.md:
   - npm run smoke:report:selftest → one npm run smoke:ci → exact named Slice verifier;
   - npm run glassmatrix:selftest → one Glass run with that exact Slice ID → exact two-ID verifier;
   - npm run arc4recovery:selftest → one Recovery run with both exact predecessor IDs → exact
     three-ID verifier.
   Stop at the first red/nonzero result. Never invoke bare Glass or substitute a latest pointer for
   an immutable predecessor ID.
4. Preserve exact reports/logs/PNGs, refresh this handoff at the end of the batch, sign any
   evidence/documentation closure and rerun tracked-input preflight on the final clean committed
   index. A docs-only descendant does not change product bytes but must never relabel an earlier
   exact-source browser result.
5. Report the final full head/base to Nick. Only a new authorization naming that exact pair may
   push, apply actions-budget-approved, run the one 92-minute hosted battery and—if
   terminal-green—merge PR #35 normally into develop.

### Product-roadmap boundary

The dependency-ready v2 gameplay campaign remains implemented. This repair does not recreate or
redesign the established creature/genome, Guardian/Prime Codex, loot, Pureforged crafting,
exploration, combat, progression, universe-wide visual or audio systems. Existing creature anatomy,
silhouette, proportions, topology, seeds, identity and interaction geometry remain protected.

Still-open work requires authored product decisions or HUMAN/device evidence and must not be invented
merely to call the roadmap complete: conquest-imbue coexistence, an additional Guardian reward
table, canonical mission/care/healing rules, broader Chronicle/Museum history, achievement reward
claims, Fifty Paragons, remaining production media/depth, real-veteran import, accessibility, and
physical phone/tablet install, heat, battery, true-GPU and first-journey judgment. Current system
references and port/V2_PROGRAM_ROADMAP.md own those boundaries.

### Paired Git/Claude handoff

- **OpenAI/Codex now:** remain in this worktree, complete the exact local browser chain and make no
  GitHub write until Nick authorizes one immutable final head/base attempt.
- **GitHub step now:** none.
- **PR #35:** base develop, source openai/mac, title
  **feat(v2): complete roadmap campaign and harden CI parity**. Refresh its description only when
  the final clean head is ready; include the first-install/execution-late worker repairs, preserved
  red evidence, current full local verification, exact browser-chain result, cross-agent
  synchronization effect and explicit no-release/deployment boundary.
- **Claude Code now:** Nick does **not** need to open Claude yet. Claude must not edit this OpenAI
  worktree. After PR #35 is terminal-green and merged into develop, Claude should create or update
  an anthropic/* branch from that exact integration commit and perform the requested whole-plan
  polish review.
- **Release status:** develop, main and the live site remain unchanged. No release, version bump,
  preview publication or deployment is in progress.
