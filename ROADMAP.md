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

## ▶▶▶ SESSION HANDOFF — 2026-08-30 · SEALED WORKER GRAPHS SIGNED · CLEAN-HEAD COMPENDIUM CERTIFICATION NEXT ◀◀◀

### Exact current boundary

- **Owner/scope:** OpenAI/Codex desktop on macOS at
  /Users/nick/Projects/celestial-frontier-openai-mac, branch **openai/mac**, upstream
  **origin/openai/mac**. This batch is V2-only: port/v2, its evidence tooling/tests and current
  Markdown. Legacy main.js / celestial-frontier.html, develop, main, the live-site repository
  and every other agent worktree remain untouched.
- **Signed sealed-worker implementation:** exact commit
  **16b122b3abf68dee7cecffd181d6ff7a03f9c8f0** (tree
  **f44360aadc5a82cd154fa98d2d6a071dfaff33c8**, parent signed evidence checkpoint
  **be6d6ff6645b9dd11c6ce3c9618aa122fd55b0b2**) contains an embedded SSH signature. It removes
  the execution-late network edge from both art workers, keeps their Window construction lazy,
  seals their complete painter/renderer graphs into one exact worker response, strengthens
  generated-build authority and negative controls, and synchronizes all affected current
  references. Creature, genome, painter output, biome structure, gameplay and save schemas are
  unchanged.
- **Documentation closure:** this lean handoff/archive refresh is the direct signed successor to
  16b122b…. Resolve its full hash with git rev-parse HEAD after committing; never overwrite or
  relabel either signed checkpoint.
- **Branch relationship:** 16b122b… is **17 commits ahead** of origin/openai/mac; the
  documentation closure adds one local commit. Fetched origin/develop
  **7a9f4c1370dd84292388d718c38ff34214f6203b** remains an ancestor. Nothing here has been pushed.
- **PR boundary:** draft PR **#35** remains **openai/mac → develop**. Remote head
  **017fa6decbc41809188768ccdb98ab86ef1b9ebc** and base
  **7a9f4c1370dd84292388d718c38ff34214f6203b** are unchanged; the PR is blocked and unmerged.
- **Actions boundary:** GITHUB_ACTIONS_BUDGET.md is **UNFROZEN**, the repository is assumed
  public, and **zero hosted attempts are authorized**. The 3,000-minute cap applies fail-closed
  if visibility becomes private or ambiguous. Do not push, label, dispatch, rerun, mark Ready,
  merge, release, bump a version, publish a preview or deploy without Nick authorizing one exact
  final head/base attempt.
- **Browser policy:** compatible Edge/Chrome/Chromium point versions are provenance only. They
  never trigger a rebaseline, threshold change or product repair. Last accepted local
  provenance is canonical Microsoft Edge 152.0.4191.53, CDP 1.3; current signed source has not
  yet run its changed-head browser certificate.
- **Historical automated chain:** signed source 3f69e88… retains the immutable green
  Layout → SceneMemory → Compendium → Slice → Glass → Recovery campaign. It is history only;
  no successor inherits or relabels it. Bare Glass still refuses without its exact
  named-verified Slice predecessor by design.

### Exact stopped browser evidence retained without retry

Exact signed source **38d8848c984089d33f4bafa1043e36c2cbb2ce9e** ran
**20260830-pr35-recovered-oracle-38d8848c9840-compendium-certification** exactly once and
stopped phone-only product-fail after 3,115 ms at veteran-earth-planetside: zero outcomes, all
78 blocked, no desktop/PNG/successor. Carrier
audits/ARC1C_COMPENDIUM_PR35_PAINTER_IMPORT_PRODUCT_FAILURE_20260830_38D8848.json.gz is
6,053 gzip bytes / 37,825 raw bytes with SHA-256
**e45b2f65cc93ad717524d52ebddfdd504e2abedf5296d6d5aa287e949be968aa** /
**63014b6dfea3790fe3618344bdf8d5b31de68e1ac54798f5fe80b5a41092ccf5** and replay 4/4.

Exact signed successor **dc6004cf4426df72bea141ac77b0be927f36886c** then tested fetch-time
clients.get adoption exactly once, with zero retry, as
**20260830-pr35-execution-late-dc6004cf4426-compendium-certification**. It again stopped
phone-only product-fail after 3,112 ms at the same stage: zero outcomes, all 78 blocked, eight
errored rows, no desktop/PNG/successor. The worker reached ready and then failed its first
worker-local painter fetch with exact 101-character message SHA-256
**90440d44f6d316cd1f3cfc45d816162f1267eef27eddcddcb413e5cd854e2a08**. Carrier
audits/ARC1C_COMPENDIUM_PR35_EXECUTION_LATE_PAINTER_IMPORT_PRODUCT_FAILURE_20260830_DC6004C.json.gz
is 6,127 gzip bytes / 38,665 raw bytes with SHA-256
**2e65494085d46cf4b68b62d3df58884b22b9d5a5c9ad1378c018a73c036f6b53** /
**c48e48a5385799bdf4535bf97b7bacf545b24182998978067b68c9bb08f27a38** and replay 4/4.

That second exact stop falsifies fetch-time adoption as a portable repair. Neither run is a
calibration sample, Edge rebaseline or authorization to retry unchanged source.

### Cause and fail-closed repair

A dedicated worker entry can load before first-install claim, then its later worker-local
import can become controlled without a retained-build pin. Activation reconciliation cannot
portably enumerate every execution-late realm, and FetchEvent client identity was not a safe
ownership oracle. The permanent repair removes the later request:

- species-art.worker.ts statically owns the species painter; biome-vista.worker.ts statically
  owns the biome renderer; Vite emits each as one content-hashed JavaScript file;
- Window-side Worker construction stays lazy and still begins only after a real owner and the
  serviced boot turn, so boot/render-thread behavior and cache/lease ownership remain intact;
- the generated PWA performs no fetch-time adoption; unpinned requests remain exact-503
  fail-closed and mixed/prior-build protections remain unchanged;
- generateBundle and writeBundle each require exactly one species and one biome worker entry and
  reject every emitted JavaScript dependency edge;
- pinned es-module-lexer detects static, re-export, computed and comment-separated dynamic import
  grammar; pinned Acorn detects nested Worker/SharedWorker and importScripts forms while ignoring
  strings, comments, templates and real regexes;
- parenthesized, bracketed, sequence, call/apply and global-qualified loaders are negative
  controls. Direct Worker, SharedWorker and importScripts names are intentionally reserved even
  when lexically shadowed, preventing ambiguous generated ownership;
- schema-stable import telemetry now truthfully means first-job painter acquisition; static
  module evaluation occurs before worker code and is not falsely timed.

### Current immutable authorities and browser-free acceptance

- Compendium measurement / outcome contract / collector:
  **5c408472b808f09e9f31133905635f08b7ef3588fad151f5f68e2a67ff68b1d0** /
  **9fc43fe4d29453ec4b546a53a2e62bc874499c67bae9f0f0f4c33e8063c41828** /
  **0af0f5884c0eec67cea7c6696c20a2c691c669fa93ee255fd1c54d17b56d5010**.
- Producer authority v2 / generated service worker:
  **0889c46e9007273da5c0d5de875e611b147ad5ed8b4280730783131d315c5ddb** /
  **7227773d0df1c688af2ff48eca58e4c0d9b65b8b7b6046eb3f45cc8da1262d8b**.
- Generated index / Window owner / sealed worker+painter:
  **720060efe570bb9c6a802eaad8ea94751b6f38bd35059487e07c36e0afbbc180** /
  **7b9bf1843eae0f914a43049bc618524314361a585c1b845cfcedf10e9c069319** /
  **25519cabdf0963bdc722b591855e7c7fdaaecbead63fdfa2d499bf35382f7172**.
- Scene build / species build-graph authority:
  **4d6a8b3ae7b4e797cd4239db411e027db929d07013dc24c2163604e38d189582** /
  **e591551391f3ed31a494c94d7e1f659633daa460f0571b973bc81cd6888a9c66**.
- Package / lock authority:
  **cf6298a7a72720952ab8bfe7a2fdcf0dde2c135e537e1ce5190303c6a06aa3a7** /
  **a2dcb380866a57618ae345c2559c1483dd781833f1a258d604a8254b7acf6a9f**.
- Active Compendium / SceneMemory budget:
  **d0c39b95f90a46fe38d65cc742ef91436a4e414c558659656250c9cf813b0e17** /
  **4325f0689927f00d5ffcc5a60acc1b47ca8738e250f15d5b64d351ce3af7b325**.
- Fixed ruler measurement / producer and numeric ceilings remain
  **cd1586e200daa0c984b4cfd398e9238f732383eda3815b86b2f8085ce292fa78** /
  **d97370c081e9431170e7b796264015e8784cc2914719785e1f9ba41c56ea8271** and
  **a5f05be521eb127f3e74306bd69538bdb6d3b564875ed921f2c7f3c0904def83**.
- Focused final acceptance: **5 files / 106 tests pass**.
- Compendium selftest: **591/591 independent product/instrument controls pass**.
- Full browser-free v2 suite: **242 files / 2,443 passed / 1 skipped**.
- Root, app and worker TypeScript programs: **all green**; artunused is green.
- Production build: **964 modules**, both real sealed workers parse with zero dependency edges;
  authority printer reports SceneMemory, Compendium measurement and producer budgets all match.
- Offline npm lock dry-run, direct two-direction scanner controls, exact release inventory
  (**73 bullets**), scoped whole-diff review, documentation-authority audit and git diff --check:
  **green / CLEAN**.
- Superseded live handoff is archived byte-verbatim with SHA-256
  **980243f76c2d0591675fb56c797ccec2aea64dcdfed94a67b75a1bbadaeb5e75**.

This is signed browser-free product/instrument authority. It is **not** a fresh Compendium browser
certificate, HUMAN visual acceptance, successor-chain result, hosted CI green or merge/release
authority.

### Exact next work — clean-head browser chain, one attempt per stage

1. Sign this documentation closure and require a clean worktree. From port/v2 run:

       node tools/tracked-input-preflight.mjs
       npm run compendiummem:selftest
       node tools/compendiummem-browser-preflight.mjs --selftest
       node tools/compendiummem-browser-preflight.mjs

   The live preflight is one browser-owning attempt outside the macOS sandbox. Any nonzero stops;
   there is no version-triggered rebaseline, fallback or automatic retry.
2. From that exact clean signed documentation HEAD, choose a unique commit-derived ID such as
   20260830-pr35-sealed-worker-<docs-short>-compendium-certification and run exactly once:

       CF_COMPENDIUMMEM_RUN_ID=<exact-id> npm run compendiummem
       node tools/compendiummem.mjs --verify-run=<exact-id>

   A product-red or instrument-red stops the chain and is preserved before any changed-head
   repair. Do not retry unchanged source.
3. Only if Compendium is terminal-green, keep committed source unchanged and run the strict
   serial chain copied in port/v2/README.md:
   - smoke:report:selftest → one smoke:ci → named Slice verifier;
   - glassmatrix:selftest → one Glass with the exact Slice ID → exact two-ID verifier;
   - arc4recovery:selftest → one Recovery with both predecessor IDs → exact three-ID verifier.
   Stop at the first red/nonzero result. Never invoke bare Glass or use a latest pointer.
4. Preserve exact reports/logs/PNGs, refresh this handoff, sign any evidence/docs closure and
   rerun tracked-input preflight on the final clean committed index. A docs-only descendant does
   not change product bytes but must never relabel an earlier exact-source report.
5. Report the final full head/base to Nick. Only a new authorization naming that exact pair may
   push, apply actions-budget-approved, run the one 92-minute hosted battery and, if terminal-
   green, merge PR #35 normally into develop.

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

- **OpenAI/Codex now:** remain in this worktree, complete the exact local browser chain and make
  no GitHub write until Nick authorizes one immutable final head/base attempt.
- **GitHub step now:** none.
- **PR #35:** existing draft; base **develop**, source **openai/mac**, title
  **feat(v2): complete roadmap campaign and harden CI parity**. Refresh its description only
  after the final clean browser-chain head exists. It must summarize the sealed-worker root
  cause/repair, preserved 38d/dc600 reds, current local verification and exact chain result,
  cross-agent synchronization effect, base/head and explicit no-release/deployment boundary.
- **Claude Code now:** Nick does **not** need to open Claude yet. Claude must not edit this
  OpenAI worktree. After PR #35 is terminal-green and merged into develop, Claude should create
  or update an anthropic/* branch from that exact integration commit and perform the requested
  whole-plan polish review.
- **Release status:** develop, main and the live site remain unchanged. No release, version bump,
  preview publication or deployment is in progress.
- **Actions budget:** UNFROZEN, repository assumed public, private cap 3,000 fail-closed,
  **zero authorized hosted attempts**.
