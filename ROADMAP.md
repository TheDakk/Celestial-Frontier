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

## ▶▶▶ SESSION HANDOFF — 2026-08-30 · 941 EVIDENCE PRESERVED · GUIDE/CF1 REPAIRED · CLEAN-HEAD CERTIFICATION NEXT ◀◀◀

### Exact current boundary

- **Owner/scope:** OpenAI/Codex desktop on macOS at
  /Users/nick/Projects/celestial-frontier-openai-mac, branch **openai/mac**, upstream
  **origin/openai/mac**. This batch is V2-only: port/v2, its evidence tooling/tests, immutable
  audit carriers and current Markdown. Legacy main.js / celestial-frontier.html, develop, main,
  the live-site repository and every other agent worktree remain untouched.
- **Signed predecessor:** exact clean commit
  **941ba45a96e5baabadc255d53db86fa935cefe81** (tree
  **f4258642e6c4e80eb76dda7e7e499b5efbee69f0**, parent
  **16b122b3abf68dee7cecffd181d6ff7a03f9c8f0**) supplied the preserved browser evidence below.
  The current repair is its direct changed-source successor and must be signed with this handoff
  before any changed-head browser run. Resolve that clean candidate with git rev-parse HEAD after
  committing; never relabel the exact-941 reports as evidence for its descendant.
- **Branch relationship:** 941ba45… is **18 commits ahead** of origin/openai/mac; this signed
  implementation/evidence/docs closure will add one local commit. Fetched origin/develop
  **7a9f4c1370dd84292388d718c38ff34214f6203b** remains an ancestor. Nothing in this batch has
  been pushed.
- **PR boundary:** draft PR **#35** remains **openai/mac → develop**. Remote head
  **017fa6decbc41809188768ccdb98ab86ef1b9ebc** and base
  **7a9f4c1370dd84292388d718c38ff34214f6203b** are unchanged; the PR is blocked and unmerged.
- **Actions boundary:** GITHUB_ACTIONS_BUDGET.md is **UNFROZEN**, the repository is assumed
  public, and **zero hosted attempts are authorized**. Do not push, label, dispatch, rerun, mark
  Ready, merge, release, bump a version, publish a preview or deploy without Nick authorizing one
  exact final head/base attempt.
- **Browser policy:** compatible Edge/Chrome/Chromium point versions are provenance only. They
  never trigger a rebaseline or threshold change. Accepted local provenance remains canonical
  Microsoft Edge 152.0.4191.53 / CDP 1.3. The current changed source has no browser certificate.
- **Historical full chain:** signed source 3f69e88… retains its immutable green
  Layout → SceneMemory → Compendium → Slice → Glass → Recovery campaign. It is history only;
  bare Glass still refuses without its exact named-verified Slice predecessor by design.

### Exact 941 browser evidence preserved without retry

Exact signed source **941ba45a96e5baabadc255d53db86fa935cefe81** passed Compendium run
**20260830-pr35-sealed-worker-941ba45a96e5-compendium-certification** once with no retry:
**78/78** outcomes (39 desktop + 39 phone), six exact-bound review PNGs, Edge
152.0.4191.53 / CDP 1.3 and a successful named verifier.

- Carrier:
  audits/ARC1C_COMPENDIUM_PR35_SEALED_WORKER_PASS_20260830_941BA45.json.gz
- Gzip: **452,127 bytes**, SHA-256
  **e6f2aa4dfcbf94830f3c0059a8e64239956ac0d2e0685c8e267a338faba2f6f8**
- Raw: **10,881,302 bytes**, SHA-256
  **d4b2b2aa07f3b1f4a70903d4d8ae82abe1eaf755523a51d7ecc85d1e610c109b**

Its exact-source Slice run **20260830115041916-36220-7ed2dd2ef398** then stopped red once,
without retry, with **63 findings across 42 scopes**: 62 Guide-family publication/geometry
instrument findings plus one named CF1 custom-name → Follow timeout. It retained six partial
screenshots. Glass and Recovery did not run.

- JSON carrier:
  audits/ARC4_SLICE_PR35_GUIDE_INSTRUMENT_AND_NAMED_CF1_PRODUCT_FAILURE_20260830_941BA45.json.gz
  — **40,180 gzip / 522,130 raw bytes**, SHA-256
  **c7b314352c65e5dd24120eb5982a78e87a899f488a78e3c205156a2e134eedad** /
  **65917019eeb8c74d258b89ab793ad13db2fc2619da1f21d7b0b2b6550e44c07d**
- Log carrier:
  audits/ARC4_SLICE_PR35_GUIDE_INSTRUMENT_AND_NAMED_CF1_PRODUCT_FAILURE_20260830_941BA45.log.gz
  — **19,473 gzip / 253,140 raw bytes**, SHA-256
  **d5321f9ea85d949f32f6b688ddbc11b8638ae6e776a97feb6502b7ca392416f9** /
  **c54bd170a95eedf884bf591dd4c17241a1460cfcde7dc3a79cfa32bcdc56113c**

The carriers have an independent browser-free evidence-chain replay. These exact red findings are
diagnosis, not an Edge calibration sample, and cannot authorize an unchanged-source retry.

### Repair completed from the exact findings

**Guide and Release authority**

- Guide waits now bind the exact published DOM identity after its microtask publication rather
  than sampling a fixed delay. Actions still fire once; bounded observation never retries them.
- The gate exact-binds all **9 categories**, all **41 category/topic/availability tuples**
  (**34 partial / 7 unavailable**), all category labels and all topic bodies.
- Search must be present, enabled, focusable and restored; disabled and restoration mutants fail.
  Panel-open, body, loading and alert state remain in timeout diagnosis.
- Release history exact-binds all **57 ordered rows** by count + SHA-256, with constant-count
  duplicate/reorder controls and exact restoration.
- The v2 draft exact-binds all **73 ordered bullets** by count + SHA-256, with replacement/swap,
  duplicate, missing-row, empty-section and heading-order controls. The Pureforged evidence
  contract now binds this canonical authority and all ten truthful / eighteen unavailable
  feature-claim controls.
- Browser-free tests parse and execute the category, topic, release and dynamic CF1 predicates;
  stale literals or dead control code cannot satisfy the contract.

**Named CF1 custom-name → Follow product sequence**

- search-travel.ts now owns one commitSearchTravelSequence. Once a custom name is accepted, a
  synchronous persistence reservation prevents an ordinary save debounce from interposing before
  the exact route commit.
- The same sequence owns Follow/direct Travel. It performs at most one catch-up only when the name
  committed but route settlement refused or could not be joined.
- Landing and Atlas refuse behind the Training checkpoint write hold outside active Training and
  recheck after the heartbeat. Atlas already-durable rebinds its route WeakMap sidecar or schedules
  convergence reload if rebinding cannot be proven.
- The private lifecycle/pagehide owner can complete its existing work without being starved by
  ordinary deferral; heartbeat remains subordinate to product work.
- Runtime state exposes sharing.followOutcome. Slice now requires coordinator idle, Jumps +1,
  committed:a->b, exact arc9-share-follow-committed:<revision> persistence receipt and the exact
  saved Sol route. Missing-owner, unchanged-Jumps, inspection-only, receipt-free and wrong-route
  mutants all fail.
- Six causal sequence cases and static wiring negatives cover success, refusal, joined work,
  catch-up, convergence and no-double-commit boundaries.
- No save schema, RNG, world/genome/creature identity, creature structure, biome structure,
  painter output or gameplay balance was changed.

### Current immutable authorities and browser-free acceptance

- Compendium measurement / outcome contract / collector remain:
  **5c408472b808f09e9f31133905635f08b7ef3588fad151f5f68e2a67ff68b1d0** /
  **9fc43fe4d29453ec4b546a53a2e62bc874499c67bae9f0f0f4c33e8063c41828** /
  **0af0f5884c0eec67cea7c6696c20a2c691c669fa93ee255fd1c54d17b56d5010**.
- Current Compendium producer / generated index / Window owner / generated service worker:
  **baa5ae1fb106ba6679e99c0e6d45bb352851cb72877feb3aa71f776df947128b** /
  **0f769e57d2d76e4b03be32a3a0ea5d61c7275279f4962af748b0aae3a447d8c0** /
  **assets/main-C621myNE.js** with SHA-256
  **2cc35316b84a08ea1035e866949e77a7e36985cac9acb038ac67293e7684e861** /
  **927f3e1ac45346ec4b0fa5f69a0b4486008d98783b5bd966c7f9aced7f16530f**.
- Sealed species worker/painter remains
  **25519cabdf0963bdc722b591855e7c7fdaaecbead63fdfa2d499bf35382f7172**.
- Current Scene build / gameMain:
  **96bb633f5c92675709655a7c24c2eb92f442324f431087c02b752ad665fcfa9d** /
  **07bdf8aac9bd8224870f2749df18461576d733c55555698dd247ddeffb83f831**.
- Active Compendium / Scene budget files:
  **eb286baba5843e46110055e29ffeb8098a7f4c9c301d85727ff07427c5ca813c** /
  **6ce69d1a6888a1a79c159f79a6cf9ba671f1aeec1e40430d54931da36e88cf5d**;
  pre-activation derived Scene budget SHA-256 is
  **e45903ca3a213798cd3e85c97c3061e6fd6d8ed35541ee3df2ec9e597cd2216c**.
- Fixed ruler measurement / producer / numeric ceilings remain
  **cd1586e200daa0c984b4cfd398e9238f732383eda3815b86b2f8085ce292fa78** /
  **d97370c081e9431170e7b796264015e8784cc2914719785e1f9ba41c56ea8271** /
  **a5f05be521eb127f3e74306bd69538bdb6d3b564875ed921f2c7f3c0904def83**.
- Full browser-free v2 suite: **244 files / 2,459 passed / 1 skipped**.
- Root, app and worker TypeScript programs: **all green**.
- Production build: **964 modules / 52 files**; the authority printer reports all SceneMemory,
  Compendium measurement and producer budgets matched.
- artunused, artaudit (**34 sources / zero findings**), override coverage
  (**1,010/1,010**), full override mutation control, speccheck (**454 fields / zero inert**),
  focused Guide/CF1/authority tests, exact evidence replay and git diff --check are green.
- The superseded live handoff is archived byte-verbatim with SHA-256
  **c41221714e24874318e202fc70395f0d52bbfe29299c047a70bfa0eec2088b5a**.

This is browser-free product/instrument authority. It is **not** changed-head browser evidence,
HUMAN visual acceptance, hosted CI green, merge authority or release/deployment authority.

### Exact next work — signed clean head and one serial browser chain

1. Sign this complete implementation/evidence/docs batch and require a clean worktree. From
   port/v2 run:

       node tools/tracked-input-preflight.mjs
       npm run compendiummem:selftest
       node tools/compendiummem-browser-preflight.mjs --selftest
       node tools/compendiummem-browser-preflight.mjs

   Any nonzero stops. Browser-owning commands run once outside the macOS sandbox. There is no
   version-triggered rebaseline, fallback or automatic retry.
2. From that exact clean signed head, reserve one commit-derived Compendium ID and run once:

       CF_COMPENDIUMMEM_RUN_ID=<exact-id> npm run compendiummem
       node tools/compendiummem.mjs --verify-run=<exact-id>

   A product-red or instrument-red stops and is preserved before any changed-head repair.
3. Only if Compendium is terminal-green, keep committed source unchanged and run the exact
   README sequence: smoke:report:selftest → one smoke:ci → named Slice verification →
   glassmatrix:selftest → one Glass bound to the exact Slice ID → exact two-ID verification →
   arc4recovery:selftest → one Recovery bound to both predecessors → exact three-ID verification.
   Stop at the first nonzero/red/instrument result. Never use a latest pointer or bare Glass.
4. Preserve exact reports/logs/PNGs, refresh this handoff and audits/README.md, sign the
   evidence/docs closure, then rerun tracked-input preflight on the final clean committed index.
   A docs-only descendant never relabels an earlier exact-source report.
5. Report the immutable final head/base to Nick. Only a new authorization naming that exact pair
   may push, apply actions-budget-approved, run the one 92-minute hosted battery and, if
   terminal-green, merge PR #35 normally into develop.

### Product-roadmap boundary

The dependency-ready V2 gameplay campaign remains implemented. This repair does not recreate or
redesign the established creature/genome, Guardian/Prime Codex, loot, Pureforged crafting,
exploration, combat, progression, universe-wide visual or audio systems. Existing creature
anatomy, silhouette, proportions, topology, seeds, identity and interaction geometry remain
protected.

Still-open work requires authored product decisions or HUMAN/device evidence and must not be
invented merely to call the roadmap complete: conquest-imbue coexistence, an additional Guardian
reward table, canonical mission/care/healing rules, broader Chronicle/Museum history, achievement
reward claims, Fifty Paragons, remaining production media/depth, real-veteran import,
accessibility, and physical phone/tablet install, heat, battery, true-GPU and first-journey
judgment. Current system references and port/V2_PROGRAM_ROADMAP.md own those boundaries.

### Paired Git/Claude handoff

- **OpenAI/Codex now:** remain in this worktree, create the signed clean candidate and complete
  the exact local browser chain. Make no GitHub write without exact authorization.
- **GitHub step now:** none.
- **PR #35:** existing draft; base **develop**, source **openai/mac**, title
  **feat(v2): complete roadmap campaign and harden CI parity**. Refresh its description only
  after the final clean browser-chain head exists.
- **Claude Code now:** Nick does **not** need to open Claude yet. Claude must not edit this
  OpenAI worktree. After PR #35 is terminal-green and merged into develop, Claude should create
  or update an anthropic/* branch from that exact integration commit and perform the requested
  whole-plan polish review.
- **Release status:** develop, main and the live site remain unchanged. No release, version bump,
  preview publication or deployment is in progress.
- **Actions budget:** UNFROZEN, repository assumed public, private cap 3,000 fail-closed,
  **zero authorized hosted attempts**.
