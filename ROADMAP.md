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

## ▶▶▶ SESSION HANDOFF — 2026-08-29 · PR #35 RESOURCE REPAIR · FIXED-SECOND SCENEMEM CALIBRATION ◀◀◀

### Exact current boundary

- **Owner/scope:** OpenAI/Codex desktop on macOS at
  `/Users/nick/Projects/celestial-frontier-openai-mac`, branch **`openai/mac`**, upstream
  **`origin/openai/mac`**. Work remains limited to `port/v2` and current Markdown. Legacy
  `main.js` / `celestial-frontier.html`, `develop`, `main`, the live-site repository and
  every other agent worktree are untouched.
- **Local Git state:** committed HEAD is signed
  **`a9f75797d6f838bb7246d3f41164f77e97e6f569`**, parent signed
  `eba00e03f3376c67ab38c5067e9a32da66ce3a3a`, plus the intentional uncommitted SceneMemory
  sampling repair/evidence described below. The branch is two commits ahead of its remote before
  this batch. Preserve the dirty repair until it is reviewed, signed and committed; do not reset
  or overwrite it.
- **PR boundary:** draft PR **#35** is **`openai/mac` → `develop`**, currently remote head
  **`017fa6decbc41809188768ccdb98ab86ef1b9ebc`** against base
  **`7a9f4c1370dd84292388d718c38ff34214f6203b`**. It is open, blocked and unmerged.
- **Actions boundary:** both exact hosted attempts are consumed:
  - run **33273328362** tested head `390e870…` and exposed clean-checkout/static CI-parity gaps;
  - run **33278630671** tested head `017fa6d…`, passed every predecessor through producer binding,
    browser installation and SceneMemory controls, then failed the one-attempt SceneMemory product
    run at **phone Earth planetfall rejected**. Its successors were correctly skipped.
  No label, push, hosted run, retry, Ready transition, merge, release, version bump, preview or
  deployment is currently authorized. `GITHUB_ACTIONS_BUDGET.md` is authoritative.
- **Browser policy:** Edge/Chrome/Chromium point versions are provenance only. No compatible browser
  update may require a rebaseline, threshold move or code change.
- **Historical evidence:** signed source `3f69e88…` retains its immutable green
  Layout → SceneMemory → Compendium → Slice → Glass → Recovery certificate. Later source may cite
  it only as history, never inherit or relabel it. Bare Glass still refuses without its exact Slice
  predecessor ID by design.

### Earlier hosted failure and systemic repair

The hosted symptom was not an Edge update and not a flaky retry case. It exposed a compound
real-browser lifecycle boundary that unit and earlier browser checks did not jointly exercise:

1. Survey replaced its route barrier; the harness drained the pre-Survey barrier and attempted
   Landing before draining the new one.
2. Full-state durable actions could validate with one detached registry/clock but canonicalize later
   with ambient state, leaving a green-looking path whose persistence authority was not one fixed
   point.
3. A prior-build document could create a worker whose entry module came from the active build,
   causing its dynamic biome-vista import to 404 after an exact PWA build transition.
4. The BFCache helper shared the product service-worker origin, so the product worker could intercept
   evidence traffic; existing diagnostics reported only the final refusal instead of the first
   lifecycle fault.

The prevention failure was therefore coverage design: the checks proved neighboring pieces but not
the complete browser outcome. The repaired instrument now fails immediately with the exact barrier,
worker, vista, route or BFCache cause.

### Implemented systemic repair

- **Two-barrier Survey → Landing choreography:** new `survey-land-handoff.ts` drains the current
  route barrier, starts Survey exactly once, drains Survey's replacement barrier, then requires
  that exact Survey settlement to return true before invoking Landing exactly once. A synchronous
  start refusal or later durable false stops the chain; there is no retry or duplicate-write path.
- **One F4 persistence authority:** `outcome-transaction.ts` now detaches the registry once,
  validates one codec clock once and provides `canonicalizeState` bound to that exact registry and
  clock. Landing, Atlas, world name, Scout, Survey, Travel, Sharing, Atlas Favorite, explorer name,
  Nameplate, Frontier ending, Binder, Starter Charters and Arc 3 Mine/Research/fixed Fabrication all
  use it. Arc 3 retains the canonical expected owned state while returning raw domain derivation to
  the transaction.
- **Complete later-clock regression surface:** every full-state action family now proves that a
  veteran mining floor survives a later ambient clock. The three shared Arc 3 operations have the
  same regression.
- **Exact-build PWA workers:** service-worker routing pins Worker and SharedWorker
  `resultingClientId` to the initiator-selected build before returning the entry module. Retention
  now considers all client realms and explicitly confirms an omitted reserved client before pruning.
  Tests cover prior-pinned worker entry plus prior lazy import, active-only refusal, invalid/missing
  resulting identity, a worker blocking third-build pruning and pruning after termination.
- **Actionable SceneMemory:** Landing and bounded state evidence stay in the same browser task;
  surface route and absence of convergence reload are asserted; vista counters/errors fail closed;
  current-worker identity mismatch is a fault while a genuinely stale response is dropped; all real
  render envelopes are validated before postMessage; and BFCache uses an ephemeral separate origin
  outside product service-worker scope.
- **Exact diagnostics:** Landing refusals, Survey mismatches, worker identity, surface-vista and
  terminal wait faults now carry bounded causes that identify the first broken boundary rather than
  a generic planetfall failure.
- **Documentation and authority:** current persistence, determinism, progression, quests,
  exploration/companions, biome, UI, preview, rubric, program-roadmap, deviation, README,
  codebase-reference, process-law and budget documents describe the same repaired contract.
  Historical evidence and HUMAN criteria remain unchanged.

### Subsequent signed resource repair and exact remaining red

Signed `a9f75797…` closes the later browser ownership findings without changing game structure:
controller listeners attach only while owned; panel bubbling has one delegated owner; Survey
invalid-route state destroys its controller; Guide/release archives are lazy; species thumbnails use
one bounded 17-entry warm Blob-URL cache with complete lease/eviction/disposal ownership; and dropped,
late, invalid or replaced broker results relinquish their backing resources. The browser-free suite
on that source passed **235 files / 2,394 tests / 1 skipped**, all three TypeScript programs and
producer derivation.

The first and only clean SceneMemory certification on `a9f75797…`, run
`20260829-pr35-resource-final-a9f75797-scenemem`, correctly stopped **43/44** and skipped Compendium.
Every product-owned resource, cache, lease, worker, Blob, DOM, listener, Pixi, backing-storage,
BFCache and cleanup outcome was green. The sole red was desktop heap plateau: V8 slope
108,128.4 B/cycle passed, backing was flat, and a one-time final embedder charge of 149,928 B made
aggregate slope 155,178.8 B/cycle exceed the unchanged 131,072 ruler.

The preserved paired diagnostic on the exact same `8ef5d89c…` product build, Edge
`152.0.4191.53` and flat ownership inventories moved the native embedder charge to cycle 2
(+160,936 B). That made the old first-pass aggregate calculation green solely because the charge
moved away from the OLS endpoint. A deterministic second complete
answerability → GC → heap → carrier → DOM pass stayed stable (desktop embedder range 19,752 B,
slope 3,069.6; aggregate slope 111,021.6). The permanent repair therefore always retains pass 1
as raw phase evidence and scores pass 2—never the minimum, average, best-of or a retry—and retains
all four warmup snapshots. A real isolated 512 KiB-per-cycle retained-allocation control passed with
both lanes at exactly 524,288 B/cycle; releasing the arrays reduced backing from 2,097,191 B to
39 B. Numeric ceilings, Edge-family authority and all product/build bytes remain unchanged.

### Current local evidence

- Focused repair suites independently passed the original **22 files / 327 tests**, the final
  identity/canonicalization/no-retry controls at **7 files / 152 tests**, and the exact durable
  Survey-result wiring at **8 files / 37 tests**.
- Fixed-second SceneMemory focus: **4 files / 127 passed / 0 failed**; the real retained-allocation
  browser control is green in both sampling lanes and release direction.
- Final calibration-candidate browser-free sweep: **235 files / 2,401 passed / 1 skipped** with
  exactly one deliberate red: current producer authority reports only `collector`, because the old
  budget must remain fail-closed until fresh calibration is activated. No other test failed. The
  final authority-activation descendant must repeat the suite once with that binding green.
- TypeScript: root, game app and worker programs are green on the current dirty repair.
- Static contract:
  - `artunused` green;
  - **34 art sources / 0 findings**;
  - **1,014/1,014** override routes with all mutation controls;
  - **1,010/1,010** coverage routes;
  - **454 declared / 0 never-read / 0 inert** specification fields.
- The clean a9f red, the pre-browser authority stop and the paired noncertifying diagnostic are
  preserved as deterministic gzip carriers in `audits/`; none is relabelled, retried or treated as
  certification. Compendium and all later browser stages remain correctly skipped after the clean
  43/44 stop.
- Current authority identities:
  - Scene build: `8ef5d89c2abe1615421961b78608ce3e07916b749b08a65fdc13e17b72d5c254`
  - Scene main: `0a54536bfc363b12c668aa276a2987e98bba32e41c5dbf546609d621972a840c`
  - Historical first-pass collector: `aa5c3711eb21277fbf24fc539f2a4564915692259bb874aff662066d4ec67f3a`
  - Historical active budget: `bf559acb1688c7f83223f4381b05ccc02309cf86af6344f6c019ffa0d1ba25e0`
  - Fixed-second collector/budget: pending clean calibration and authority-only activation; the
    historical collector binding must remain red until that activation is signed.
  - Compendium measurement: `7e9b1e11295ddc5682f9609711422dd3af969a257e3d02cf11848ae8ef6b18b4`
  - Compendium producer: `0de7dc1a95ceeb35738d4cb17e7ccd464aab947848a9fe643e7c69355836bf13`
  - Compendium budget: `5d7b54235cf9470cd7f2c042612a402f79edda3c91ee2ba83bfbe21126001d49`
- Numeric ceilings, the 44-outcome SceneMemory ruler, Compendium measurement contract and browser
  family policy did not move.

### Exact work remaining before another GitHub attempt

1. Finish independent review of the fixed-second collector, docs and controls; sign one clean local
   calibration candidate while the old collector authority remains deliberately fail-closed.
2. On that exact unchanged clean collector/product, collect exactly three named one-attempt
   SceneMemory calibrations, preserve each raw report, and confirm pass-2 samples remain below every
   unchanged ceiling. These are planned measurement samples, not retries or certificates.
3. Change only the SceneMemory collector producer binding (and its expected hash/docs), keep every
   numeric/browser/product field byte-identical, run focused negative controls plus the full
   browser-free/typecheck/producer battery once, and sign the authority activation.
4. From that exact clean activation, run one named SceneMemory certification and named verification.
   Stop on any red/instrument result with no retry. Only if green, run one named Compendium attempt
   and verification; its game build is still `8ef5d89c…`.
5. Preserve the exact results, refresh this handoff/authorities, sign the documentation closure and
   run `node tools/tracked-input-preflight.mjs` against the final committed index.
6. Report the exact final head/base to Nick. Only a new authorization naming that immutable pair may
   push, label, run the one 92-minute hosted battery and merge. After green integration, hand the
   exact `develop` commit to Claude Fable on an `anthropic/*` branch for the requested polish review.

### Product-roadmap boundary

The dependency-ready v2 gameplay campaign remains implemented; this repair does not recreate or
redesign established creature, genome, Guardian, Prime Codex, loot, crafting, exploration, combat,
progression, visual or audio systems. Pureforged remains the approved current player-facing name,
while stable `exceptional-v1` identities remain unchanged.

Still-open items require authored product decisions or HUMAN/device evidence and must not be
invented merely to call the roadmap complete: the conquest-imbue coexistence policy, extra Guardian
reward table, canonical mission/care/healing rules, broader Chronicle/Museum history, achievement
reward claims, Fifty Paragons, remaining production media/depth, real-veteran import, accessibility
and physical phone/tablet install, heat, battery, GPU and first-journey judgment. The relevant
current system docs and `port/V2_PROGRAM_ROADMAP.md` own those boundaries.

### Paired Git/Claude handoff

- **OpenAI/Codex now:** remain in this worktree, complete the six local steps above and do no GitHub
  write until Nick authorizes one exact final head/base attempt.
- **Claude Code now:** Nick does **not** need to open Claude yet. Claude must not edit this OpenAI
  worktree. After a green merge into `develop`, create an `anthropic/*` branch/worktree from that
  exact integration commit and use the review axes already documented in the program roadmap and
  current references.
- **PR details:** base `develop`, source `openai/mac`, title
  **`feat(v2): complete roadmap campaign and harden CI parity`**.
- **Release status:** `develop`, `main` and the live site are unchanged. No production release or
  deployment is in progress.
