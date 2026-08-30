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

## ▶▶▶ SESSION HANDOFF — 2026-08-30 · E4F5 EVIDENCE PRESERVED · F4 ORACLES SIGNED GREEN · BROWSER CHAIN NEXT ◀◀◀

### Exact current boundary

- **Owner/scope:** OpenAI/Codex desktop on macOS at
  /Users/nick/Projects/celestial-frontier-openai-mac, branch **openai/mac**, upstream
  **origin/openai/mac**. This batch is V2-only: port/v2 evidence tooling/tests, immutable audit
  carriers and current Markdown. Legacy main.js / celestial-frontier.html, develop, main, the live
  site and every other worktree remain untouched.
- **Exact evidence source:** signed commit
  **e4f5af4bf628ee2f0b2485077e46dc0ff86b2b0c** (tree
  **38664e8cee474c359eed8b0ffc2f3aa0b5dca3c0**, parent
  **95c2bea727a014b8b181d83e4b0f04a5444b3993**) supplied the one-attempt browser evidence below.
  It was **22 commits ahead** of origin/openai/mac and has an embedded SSH signature. The repaired
  native-transaction/strict-clock/causal-stop candidate is signed commit
  **d335d78a8f4f152e844627c2f28658c03168d1a1** (tree
  **76da593f16b39a99340aa435d5361554fd948ceb**, parent e4f5af4…), **23 commits ahead** of
  origin/openai/mac, with an embedded SSH signature. It has browser-free authority only and does
  not inherit e4f5 browser authority.
- **PR boundary:** draft PR **#35**, base **develop**, source **openai/mac**, remains blocked and
  unmerged. Remote head **017fa6decbc41809188768ccdb98ab86ef1b9ebc** and fetched base
  **7a9f4c1370dd84292388d718c38ff34214f6203b** remain unchanged. Nothing here has been pushed.
- **Actions boundary:** GITHUB_ACTIONS_BUDGET.md is **UNFROZEN**, the repository is assumed public,
  and **zero hosted attempts are authorized**. Do not push, label, dispatch, rerun, mark Ready,
  merge, release, bump a version, publish a preview or deploy without Nick authorizing one exact
  final head/base attempt.
- **Browser policy:** compatible Edge/Chrome/Chromium point versions are provenance only. They do
  not trigger a rebaseline, threshold change, fallback or retry. Accepted local provenance remains
  canonical Microsoft Edge 152.0.4191.53 / CDP 1.3.
- **Historical green chain:** exact signed source 3f69e88… retains its immutable
  Layout → SceneMemory → Compendium → Slice → Glass → Recovery certificate. It is history only;
  bare Glass correctly refuses without its exact named-verified Slice predecessor.

### Exact e4f5 evidence preserved without retry

Exact signed source **e4f5af4bf628ee2f0b2485077e46dc0ff86b2b0c** ran Compendium once with
run ID **20260830-pr35-slice-oracle-e4f5af4bf628-compendium-certification**. It passed its named
verifier and all **78/78** outcomes: 39 phone + 39 desktop in **64,831 ms**, with one attempt and
zero automatic retries.

- Carrier:
  audits/ARC1C_COMPENDIUM_PR35_SLICE_ORACLE_REPAIR_PASS_20260830_E4F5AF4.json.gz
- Gzip: **521,190 bytes**, SHA-256
  **62836b0c47307b77a4656fa82075a7eabb7c18332288272b6eab4e1256e0de61**
- Raw: **10,798,329 bytes**, SHA-256
  **23f93aaf9af016ffd9c6aeaf137539041a63e10ad339495f1837442e73a2a7ca**

The exact unchanged source then ran Slice once with ID
**20260830-pr35-slice-oracle-e4f5af4bf628-slice-certification**. It stopped terminal red after
**98,988 ms**, with zero automatic retries, **4 findings / 4 ordered scopes**, seven partial
screenshots and zero PASS markers:

1. f4-replacement-outcome — replacement boundary; boot revision and RNG; unrelated replacement
   state; durable outcome parity.
2. arc-3-mine-action — unrelated durable Engineering rows/extensions preserved.
3. arc-3-mine-action-controls-failed — the same preservation mismatch contaminated the dependent
   mutation-control assessment.
4. harness — the continued Arc 3 Survey pre-purchase route timed out after 6,000 ms with zero rows.

- JSON carrier:
  audits/ARC4_SLICE_PR35_REPLACEMENT_ENGINEERING_SURVEY_RED_20260830_E4F5AF4.json.gz
  — **106,663 gzip / 784,482 raw bytes**, SHA-256
  **405ba09fb441dee907a2a03fa116acd54acfcccd821b10d919e02419f083c3c1** /
  **4d588a0e6e49fee7b85f662ff26266ef009bff09bdb9d316cd75b1531c5f3ca3**
- Log carrier:
  audits/ARC4_SLICE_PR35_REPLACEMENT_ENGINEERING_SURVEY_RED_20260830_E4F5AF4.log.gz
  — **43,745 gzip / 323,366 raw bytes**, SHA-256
  **f84f5d14529b4b8e1476d7d1f14a8715cda3dd9d0ba75241a076d2b0088acc7a** /
  **f3fb5deaf0a87b7be832345a8256bea872307fa2c91ea23b0783e0217303861a**

Glass and Recovery **did not run** and have no e4f5 successor authority. The browser-free replay
port/v2/tests/pr35-e4f5-slice-oracle-evidence-replay.test.ts exact-binds all three carrier
identities, clean source begin/end, 78/78 Compendium PASS, four ordered Slice scopes and messages,
structured reasons, raw output and explicit denial of Glass/Recovery authority; its focused
acceptance is **5/5**. The report remains a four-scope historical red, never a single-scope PASS.

### Signed local repair from the exact findings

- **Native replacement transaction:** the v3 tracer inventories every IndexedDB readwrite first
  observed before the eight-store replacement completes and requires exactly one. It freezes at
  that causal boundary, so the required later lease-release CAS cannot overwrite the witness.
  Within each transaction it
  observes every available object-store request method plus `index()` access, then requires the
  exact ordered 13-call get/clear/put/delete ledger,
  explicit keys and argument counts, empty index inventories, keyPath/auto-increment shape, native
  request identity and settlement, predecessor revision, held lease, replacement rows, exact
  fixture/legacy mirrors and migration journals. It publishes only when that transaction completes
  and rejects aborts, transaction errors, duplicates, splits, pre-completion subset/superset side
  transactions, hidden add/cursor/index work, reordered or missing calls, failed/non-native
  requests, wrong fences, malformed rows and journal drift. A post-completion lease-release control
  remains green.
- **Strict codec clock:** the expected successor is independently produced through the production
  import/export fixed point. Its digest permits only the codec-owned export anchor plus the exact
  conquest and mined-world stamp ages relative to that anchor. Complete saved-route geometry,
  every Atlas where, achievements, inventory, Prime, Codex and all other product bytes remain
  exact. The observed codec anchors must also stay inside the measured replacement window.
- **Causal stop:** a red stage/tracer/staged-receipt setup stops before import; a red replacement
  prefix stops before the Smoke outcome; a red outcome or negative control stops before hide and
  Arc 3. Before staging or arming, Slice stops and settles the live periodic heartbeat and binds its
  exact document witness, removing the arm→import timer race. A future failure therefore preserves
  one actionable root instead of manufacturing the three e4f5 derivative scopes.
- Executable controls cover current and ready boot branches, full transaction lifecycle and
  request mutants, strict clock/product/route mutations, embedded tracer execution and
  finding → stop → controls ordering.
- These are browser-evidence instrument repairs. No save schema, RNG policy, gameplay balance,
  world/genome/creature identity, creature structure, biome structure, painter output or
  player-facing product capability changed.

### Current browser-free acceptance

- Full V2 suite: **248 files / 2,481 passed / 1 skipped**.
- **npm run typecheck: green**.
- Focused F4 + e4f5 + ae2 replay set: **17/17 green**.
- Signed candidate **d335d78a…** contains the repair, immutable e4f5 carriers, evidence replay and
  synchronized current references. This acceptance is browser-free authority only. It is not a
  fresh browser PASS, HUMAN visual acceptance, hosted CI green, merge authority or
  release/deployment authority.
- The superseded ae2 handoff is archived byte-verbatim with SHA-256
  **90be1b5cdd1731881152e323e9c2274ced74f611e7198b4d49dab487e18c56a9**.

### Exact next work — one immutable browser chain

1. From port/v2 on the exact clean signed docs-closure successor of **d335d78a…**, stop on any
   nonzero:

       node tools/tracked-input-preflight.mjs
       npm run compendiummem:selftest
       node tools/compendiummem-browser-preflight.mjs --selftest
       node tools/compendiummem-browser-preflight.mjs

   Browser-owning commands run outside the macOS sandbox. No automatic retry or fallback exists.
2. Reserve one new commit-derived Compendium ID and run it once:

       CF_COMPENDIUMMEM_RUN_ID=<exact-id> npm run compendiummem
       node tools/compendiummem.mjs --verify-run=<exact-id>

   Preserve and stop on any product-red or instrument-red.
3. Only if Compendium is terminal-green, keep committed source unchanged and run the exact README
   sequence: smoke:report:selftest → one smoke:ci → named Slice verification. Preserve and stop if
   Slice is red; do not run Glass or Recovery and do not retry.
4. Only if Slice is terminal-green, run glassmatrix:selftest → one Glass bound to the exact Slice
   ID → exact two-ID verification → arc4recovery:selftest → one Recovery bound to both exact
   predecessors → exact three-ID verification. Stop at the first nonzero/red/instrument result.
5. Preserve exact reports/logs/PNGs, update audits/README.md and this handoff, sign the
   evidence/docs closure, then rerun tracked-input preflight on the final clean committed index.
6. Report the immutable final head/base to Nick. Only a new authorization naming that exact pair
   may push, apply actions-budget-approved, run the one 92-minute hosted battery and, if
   terminal-green, merge PR #35 normally into develop.

### Product-roadmap and HUMAN boundary

The dependency-ready V2 gameplay campaign remains implemented. This instrument repair does not
recreate or redesign the established creature/genome, Guardian/Prime Codex, loot/Pureforged,
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

- **OpenAI/Codex now:** remain in this worktree, sign this docs-only closure over exact candidate
  d335d78a…, then complete exactly one serial local browser chain. Make no GitHub write without
  exact authorization.
- **GitHub step now:** none.
- **PR #35:** existing draft; base **develop**, source **openai/mac**, title
  **feat(v2): complete roadmap campaign and harden CI parity**.
- **Copy-ready PR description:**

      Completes the dependency-ready V2 local roadmap campaign while preserving the established
      creature/genome, Guardian/Prime Codex, loot/Pureforged, exploration, combat, progression,
      universe-wide art/audio and save-schema boundaries. It preserves exact e4f5 Compendium
      78/78 PASS plus its terminal four-scope Slice red, and repairs the native F4 replacement
      transaction oracle, strict production-codec clock projection and causal stop locally.
      Current signed browser-free acceptance is 248 files with 2,481 passed and 1 skipped; npm run
      typecheck is green. A fresh exact clean-head Compendium → Slice → Glass → Recovery chain
      remains required before this draft can become Ready or use one authorized hosted battery.
      No legacy-v1 source, production release, version bump, preview publication or deployment is
      included. Base: develop. Source: openai/mac.

  Append the immutable final head/base and exact browser-chain result only after closure.
- **Claude Code now:** Nick does **not** need to open Claude yet. Claude must not edit this OpenAI
  worktree. After PR #35 is terminal-green and merged into develop, Claude should create or update
  an anthropic/* branch from that exact integration commit for the requested whole-plan polish
  review.
- **Release status:** develop, main and the live site remain unchanged. No release, version bump,
  preview publication or deployment is in progress.
- **Actions budget:** UNFROZEN, repository assumed public, private cap 3,000 fail-closed,
  **zero authorized hosted attempts**.
