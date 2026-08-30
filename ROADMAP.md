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

## ▶▶▶ SESSION HANDOFF — 2026-08-30 · AE2 EVIDENCE PRESERVED · SLICE ORACLES REPAIRED · SIGN/CERTIFY NEXT ◀◀◀

### Exact current boundary

- **Owner/scope:** OpenAI/Codex desktop on macOS at
  /Users/nick/Projects/celestial-frontier-openai-mac, branch **openai/mac**, upstream
  **origin/openai/mac**. This batch is V2-only: port/v2 evidence tooling/tests, immutable audit
  carriers and current Markdown. Legacy main.js / celestial-frontier.html, develop, main, the live
  site and every other worktree remain untouched.
- **Last signed clean source:** **ae2a0023da3a90a98e548452113395149847aee5** (tree
  **0588ff7bc7e978e75be92227cdad3eb1b3a2fe29**, parent
  **0f814a6f39912d81a3a738e0c70297e9b697550c**) contains the Guide/Release and named-CF1 product
  repair plus the clean-candidate handoff. It is **20 commits ahead** of origin/openai/mac.
- **Current worktree:** an unsigned changed-source successor of ae2a002… contains the preserved ae2
  evidence, three bounded Slice-oracle repairs, executable negative controls and synchronized
  references described below. It has browser-free acceptance but no changed-head browser
  certificate. Resolve and record its exact signed commit/tree only after committing this batch.
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

### Exact ae2 evidence preserved without retry

Exact signed source **ae2a0023da3a90a98e548452113395149847aee5** ran Compendium once with
run ID **20260830-pr35-guide-cf1-ae2a0023da3a-compendium-certification**. It passed its named
verifier and all **78/78** outcomes: 39 phone + 39 desktop in **63,446 ms**.

- Carrier: audits/ARC1C_COMPENDIUM_PR35_GUIDE_CF1_REPAIR_PASS_20260830_AE2A002.json.gz
- Gzip: **451,761 bytes**, SHA-256
  **c41e40c0f7da7829d894f762fe4dee94b1d4a5dd663c07211e76f3700cc56d0f**
- Raw: **10,869,876 bytes**, SHA-256
  **864efc28836ca5aaff9ea3efa286169f4fd49f49e6811e68375fb5837f72098d**

The exact unchanged source then ran Slice once with ID
**20260830132231723-50968-0e9bd00aee77**. It stopped terminal red after **91,465 ms**, with zero
automatic retries, **8 findings / 8 scopes**, seven partial screenshots and no PASS marker:

1. guide-compendium-copy-control-failed
2. guide-audio-ownership-control-failed
3. guide-charter-copy-control-failed
4. guide-charter-polarity-control-failed
5. atlas-authorization-setup
6. atlas-authorization
7. f4-replacement-outcome
8. arc-2-inventory-reload-atlas

- JSON carrier:
  audits/ARC4_SLICE_PR35_POST_REPAIR_INSTRUMENT_DRIFT_20260830_AE2A002.json.gz
  — **78,146 gzip / 905,230 raw bytes**, SHA-256
  **f2749443714acbfebcfd12a0527502b1156a67560eaec068f751ddcde665f045** /
  **585b006d26970ef9f9e4d2cd954f6f8791df935594535dd3b1dde0b51312412c**
- Log carrier:
  audits/ARC4_SLICE_PR35_POST_REPAIR_INSTRUMENT_DRIFT_20260830_AE2A002.log.gz
  — **37,399 gzip / 420,442 raw bytes**, SHA-256
  **9d57cded083613decc33233db185d0c53d6c6bf1ae7d65f2b74209705cfbc699** /
  **73fd34e7c3126ad57b15b794e26e1b8f36ef2848dd523ebb4c55ee101b043262**

Glass and Recovery **did not run**. The new browser-free evidence replay exact-binds all three
carrier identities, source/run IDs, 78/78 Compendium PASS, ordered eight-scope Slice red, seven PNG
receipts, child/log evidence, historical F4 trace and explicit denial of Glass/Recovery authority.
Nothing relabels the terminal-red Slice as PASS.

### Bounded repairs completed from the exact findings

**Rendered Guide controls**

- The control now mutates the one exact rendered-text occurrence even when inline markup splits the
  sentence across Text nodes. A DOM Range owns the mutation.
- Zero or duplicate occurrences refuse without mutation; exact innerHTML restoration is required.
- Rendered checks join direct block children with word boundaries, so contradictions cannot hide
  where sibling blocks would otherwise concatenate.
- The stale Breed phrase and Charter polarity oracle are corrected. Executable JSDOM controls prove
  split-markup omission, contradiction, negation, duplicate/zero refusal and exact restoration.

**Atlas row/action/input authority**

- A semantic Atlas row remains a non-interactive source-identified DIV. Its exact nested native
  BUTTON[data-atlas-travel] owns Travel; the Favorite sibling remains independently present.
- All seven stale paths now sample the exact child action after scroll + render settlement and bind
  row/action identity, native role/type, enabled state, accessible name, 44px geometry, hit test and
  optional focus.
- Authorization, reload continuity, D-TRAIN, keyboard Space/Enter and collision-world routes retain
  trusted pointer/keydown receipts with exact BUTTON role, data-atlas-travel, parent data-aid and
  coordinates.
- A red setup/receipt stops before dependent dispatch or navigation waits, so one root diagnosis
  cannot turn into a timeout cascade. Tests seal this causal order, including the authorization
  setup guard.
- Collision Atlas openers and actions are validated before their row/navigation wait. Role,
  identity, hit, size and coordinate mutants fail. The Training DOM fixture now mirrors the real
  DIV row plus Travel/Favorite actions.

**F4 replacement prefix and chronology**

- The assessor selects current versus ready from an independent projection of the exact imported
  fixture, never from the observed post-boot receipt ledger.
- Both branches bind the native atomic clear, exact source bytes, replacement revision/seed/ordinal
  zero/draws, one independently expected receipt-free product/bootstrap commit, silent
  presentation, aggregate-only successor, unrelated-state digest and immediate Smoke successor.
- Current accepts an empty post-boot ledger and assigns Smoke ordinal zero. Ready requires exactly
  one fixed-point arc9-progression-refresh-v1 receipt at ordinal zero and assigns Smoke ordinal one.
- The retained fixture sequence is staged revision **7** → replacement **8** → receipt-free
  bootstrap **9** → Arc 9 receipt 0/revision **10** → Smoke receipt 1/revision **11**. Runtime
  commits equal two before Smoke and three afterward.
- Sealed identities include imported trimmed fixture
  **bf908135e38024ee5d11eb9e5811c23c1b2f6c79b8c8a9c9bfc81b94fe24c8a3**,
  source legacy bytes **57e9d86d1847ab0bd7d8ba4579b2bfd5a51f9b65715fc1ef412db050a6fadd88**,
  successor product **c332919c0697072dbeed7965a487f08fdea58039c122d45024002ed174693339**
  and progression witness
  **arc9p1:a8f5961bf107300e280aa9cda8160e051e02ab691c80cda40eaf87642d4f62c9**.

These are instrument/evidence repairs. No save schema, RNG policy, gameplay balance, world/genome/
creature identity, creature structure, biome structure, painter output or player-facing product
capability changed.

### Current browser-free acceptance

- Full V2 suite: **247 files / 2,471 passed / 1 skipped**.
- Root, app and worker TypeScript programs: **all green**.
- Focused Guide/Atlas/F4/evidence/progression/training integration contracts: green.
- Production build inside the suite: **964 modules**; generated main asset remains
  **assets/main-C621myNE.js**. Product source and prior art/Scene/Compendium authorities are
  unchanged because this batch modifies only evidence tooling/tests/docs.
- node syntax checks and git diff --check: green.
- Independent Atlas runtime re-audit: clear after causal-order tests.
- The superseded handoff is archived byte-verbatim with SHA-256
  **f26ce6552b2e3b5f6b867c64270daa5c4149e08d48f1473a16866bce6008f5bf**.

This acceptance is browser-free authority only. It is not changed-head browser evidence, HUMAN
visual acceptance, hosted CI green, merge authority or release/deployment authority.

### Exact next work — sign, preflight and one immutable browser chain

1. Sign this complete code/evidence/docs batch and require a clean worktree. Record its exact commit,
   tree and branch-ahead relationship in a signed docs-only closure if needed.
2. From port/v2 on that exact clean signed head, stop on any nonzero:

       node tools/tracked-input-preflight.mjs
       npm run compendiummem:selftest
       node tools/compendiummem-browser-preflight.mjs --selftest
       node tools/compendiummem-browser-preflight.mjs

   Browser-owning commands run outside the macOS sandbox. No automatic retry or fallback exists.
3. Reserve one commit-derived Compendium ID and run once:

       CF_COMPENDIUMMEM_RUN_ID=<exact-id> npm run compendiummem
       node tools/compendiummem.mjs --verify-run=<exact-id>

   Preserve and stop on any product-red or instrument-red.
4. Only if Compendium is terminal-green, keep committed source unchanged and run the exact README
   chain: smoke:report:selftest → one smoke:ci → named Slice verification → glassmatrix:selftest →
   one Glass bound to the exact Slice ID → exact two-ID verification → arc4recovery:selftest → one
   Recovery bound to both predecessors → exact three-ID verification.
5. Preserve exact reports/logs/PNGs, update audits/README.md and this handoff, sign the evidence/docs
   closure, then rerun tracked-input preflight on the final clean committed index.
6. Report the immutable final head/base to Nick. Only a new authorization naming that exact pair may
   push, apply actions-budget-approved, run the one 92-minute hosted battery and, if terminal-green,
   merge PR #35 normally into develop.

### Product-roadmap boundary

The dependency-ready V2 gameplay campaign remains implemented. This harness repair does not recreate
or redesign the established creature/genome, Guardian/Prime Codex, loot/Pureforged, exploration,
combat, progression, universe-wide visual or audio systems. Existing creature anatomy, silhouette,
proportions, topology, seeds, identity and interaction geometry remain protected.

Still-open work requires authored product decisions or HUMAN/device evidence and must not be
invented merely to call the roadmap complete: conquest-imbue coexistence, an additional Guardian
reward table, canonical mission/care/healing rules, broader Chronicle/Museum history, achievement
reward claims, Fifty Paragons, remaining production media/depth, real-veteran import, accessibility,
and physical phone/tablet install, heat, battery, true-GPU and first-journey judgment. Current
system references and port/V2_PROGRAM_ROADMAP.md own those boundaries.

### Paired Git/Claude handoff

- **OpenAI/Codex now:** remain in this worktree, sign the clean candidate and complete exactly one
  serial local browser chain. Make no GitHub write without exact authorization.
- **GitHub step now:** none.
- **PR #35:** existing draft; base **develop**, source **openai/mac**, title
  **feat(v2): complete roadmap campaign and harden CI parity**.
- **Copy-ready PR description:**

      Completes the dependency-ready V2 local roadmap campaign while preserving the established
      creature/genome, Guardian/Prime Codex, loot/Pureforged, exploration, combat, progression,
      universe-wide art/audio and save-schema boundaries. It preserves exact-941 evidence and the
      exact ae2 Compendium 78/78 PASS plus terminal eight-scope Slice red, then repairs rendered
      Guide controls, semantic Atlas row/native Travel/input authority with causal stop guards, and
      independently selected F4 replacement-prefix chronology. Current local browser-free
      acceptance is 247 files with 2,471 passed and 1 skipped; all three TypeScript programs are
      green. A fresh exact clean-head Compendium → Slice → Glass → Recovery chain remains required
      before this draft can become Ready or use one authorized hosted battery. No legacy-v1 source,
      production release, version bump, preview publication or deployment is included. Base:
      develop. Source: openai/mac.

  Append the immutable final head/base and exact browser-chain result only after closure.
- **Claude Code now:** Nick does **not** need to open Claude yet. Claude must not edit this OpenAI
  worktree. After PR #35 is terminal-green and merged into develop, Claude should create or update
  an anthropic/* branch from that exact integration commit for the requested whole-plan polish
  review.
- **Release status:** develop, main and the live site remain unchanged. No release, version bump,
  preview publication or deployment is in progress.
- **Actions budget:** UNFROZEN, repository assumed public, private cap 3,000 fail-closed,
  **zero authorized hosted attempts**.
