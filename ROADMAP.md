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

## ▶▶▶ SESSION HANDOFF — 2026-08-29 · PR #35 BROWSER-LIFECYCLE REPAIR · LOCAL CANDIDATE IN FINAL PROOF ◀◀◀

### Exact current boundary

- **Owner/scope:** OpenAI/Codex desktop on macOS at
  `/Users/nick/Projects/celestial-frontier-openai-mac`, branch **`openai/mac`**, upstream
  **`origin/openai/mac`**. Work remains limited to `port/v2` and current Markdown. Legacy
  `main.js` / `celestial-frontier.html`, `develop`, `main`, the live-site repository and
  every other agent worktree are untouched.
- **Local Git state:** committed HEAD is
  **`017fa6decbc41809188768ccdb98ab86ef1b9ebc`** plus the intentional uncommitted repair described
  below. Preserve the dirty repair until it is signed and committed; do not reset or overwrite it.
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

### What failed and why the earlier green checks missed it

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

### Current local evidence

- Focused repair suites independently passed the original **22 files / 327 tests**, the final
  identity/canonicalization/no-retry controls at **7 files / 152 tests**, and the exact durable
  Survey-result wiring at **8 files / 37 tests**.
- Current authority/budget suite: **3 files / 45 passed / 0 failed**.
- Full browser-free suite: **234 files / 2,373 passed / 1 skipped / 0 failed**.
- TypeScript: root, game app and worker programs are green.
- Static contract:
  - `artunused` green;
  - **34 art sources / 0 findings**;
  - **1,014/1,014** override routes with all mutation controls;
  - **1,010/1,010** coverage routes;
  - **454 declared / 0 never-read / 0 inert** specification fields.
- A dirty-source diagnostic browser run
  **`20260829233652913-23084-4b4362f86b`** completed phone and desktop SceneMemory mechanics,
  including Earth Landing, the biome worker/lazy import, Compendium, Shipyard, ascent, BFCache and
  reload cleanup. It is calibration-only because the source was dirty; it is not final certificate
  authority and did not consume a hosted attempt.
- Current authority identities:
  - Scene build: `7c248bbc2b7071280af1b8b353536beb7b7a65b5448b69a48d6fd7276ac18647`
  - Scene collector: `aa5c3711eb21277fbf24fc539f2a4564915692259bb874aff662066d4ec67f3a`
  - Scene main: `56f052edc4bd2665eb5e385fb55524add2ba6e9d645cc72d771ae044c757bc21`
  - Scene budget: `0647661b16126ec97610befb862e698b1a497d60055c3650cf07660d2eaa8c75`
  - Compendium measurement: `7e9b1e11295ddc5682f9609711422dd3af969a257e3d02cf11848ae8ef6b18b4`
  - Compendium producer: `31156351571571958b10a734e57c5626ca03398403d9f46a5c54f126b862b3ce`
  - Compendium budget: `84a5f574462fe789d97b3b00a579ddee771aff856ec4b10b24156080d5563b86`
- Numeric ceilings, the 44-outcome SceneMemory ruler, Compendium measurement contract and browser
  family policy did not move.

### Exact work remaining before another GitHub attempt

1. Finish the aggregate diff/doc audit, then create a signed local implementation candidate.
2. From that clean committed runtime, run one named SceneMemory attempt and named verification.
   Stop on any red or instrument result; do not retry automatically.
3. Run one named Compendium attempt and named verification because its producer includes the changed
   game bundle. Stop on any red or instrument result; do not retry automatically.
4. Record those exact local results, sign the documentation closure and run
   `node tools/tracked-input-preflight.mjs` against the final committed index.
5. Report the exact final head/base to Nick. Only a new authorization naming that immutable pair may
   push the head, apply `actions-budget-approved`, permit one 92-minute `test-battery` with no
   retry and merge on terminal green.
6. After integration into `develop`, hand that exact integrated source to Claude Fable on an
   `anthropic/*` branch for the requested full-system polish review. OpenAI/Codex then fixes only
   accepted findings and repeats the same local-first discipline.

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
