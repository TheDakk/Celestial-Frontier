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

## ▶▶▶ SESSION HANDOFF — 2026-09-05 UTC · V2 STARTS FRESH: LEGACY SAVE IMPORT WITHDRAWN, SETTINGS IMPORT DOOR REMOVED · LOCAL BATCH ON anthropic/mac · NO HOSTED AUTHORITY ◀◀◀

### Exact boundary

- **Anthropic/Claude Code on macOS:** `/Users/nick/Projects/celestial-frontier-anthropic-mac`,
  branch **anthropic/mac**, based on `develop` **1d719c63fbcdb6d0e6ab98a96b16e487aafe1239** (merge of
  PR #39) plus the 2026-09-05 Windows handoff commit `55f5651a6b926c36b1cc5d40f9a7cb3f6ffec290`
  (fast-forwarded and pushed as a branch push, which triggers nothing). This batch went out as **PR #40** (head
  `88bd00168f15b9cf88f2d07d7f1d32ed9949de20`), passed its one Nick-authorized agent-lane attempt
  (run `33944372214`, battery job `101247702939`, **6m29s**) and merged normally as `develop`
  **9ea01041dcdc711190bbf909ea8bb743cd993734**; the label was removed and `anthropic/mac` is
  fast-forwarded to that merge plus this record commit. No hosted authority remains.
- Nick's decisions this session (2026-09-05): (1) "Nobody is running old saves… treat it as a
  brand-new game. But we want saves going forward for v2." (2) Remove the player-facing import door
  now, keep the Training recovery dialog. (3) Recovery lock offers reload/update only — no hidden
  paste path. Recorded in `port/DECISIONS.md` (Gate C row), `port/RUBRICS.md` (Gate C rows),
  `port/V2_PROGRAM_ROADMAP.md`, `port/v2/README.md`, `SAVE_SYSTEM.md`, `UI_PRESENTATION.md`,
  `PROCESS_LAWS.md`, `celestial-frontier-codebase-reference.md`, `port/DEVELOPMENT_PREVIEW.md` and
  the `port/v2/DEVIATIONS.md` overlay.
- Budget **UNFROZEN**, visibility **PUBLIC**, private fallback **3,000**. **Zero** hosted attempts,
  labels, merges or releases are authorized. The next hosted run of this head will change sealed
  Glass/Slice outcomes (see below) and therefore needs Nick's exact authorization as a re-seal.

### What changed (product, v2 only; v1 `main.js`/html untouched)

1. **Settings → “Bring expedition” door removed** (`#setimport` row, listener, paste textarea,
   Pick file, Import & reload, live error region, `cf_v2_import_original` keepsake). The retained
   `#importsheet` element is now only the nonclosable **Field Training recovery sheet**
   (`unknown-checkpoint` / `route-unavailable`, copy “Update and reload.” / “Reload to retry.”,
   single **Reload to retry** action; Escape and outside focus return to it). The
   `__CF_EVIDENCE_BUILD__` slice API keeps `importBlob` as the Slice/Glass **replacement driver**
   (fixture seeding + reload-evidence chain); no player path reaches it.
2. **Not changed on purpose:** the v1.8.9 codec (`import-v2.ts` / v4 envelope / v5 partition /
   `migrateLegacyOwnership`) is v2's own load path for a brand-new game and stays. "Legacy" in the
   persistence packages means that codec, not a player import.
3. Guide + `V2_DRAFT_RELEASE` copy: no import promises; the draft bulletin is **77** outcomes (the two
   import bullets became one fresh-start bullet). Read-only mode: “a protected reload is the only
   recovery path.”

### Instruments and seals touched (every change negative-controlled)

- `tools/slicesmoke.mjs`: door steps replaced by an **absence** check (no `#setimport`, no stale
  import controls, recovery sheet hidden without a lock); the whitespace replacement now drives the
  evidence seam and asserts the keepsake is **never written**; phone import-modal block retired;
  D-TRAIN refusal reads `[data-sel="recovery-copy"]`, requires Close absent and no import copy;
  `V2_DRAFT_BULLET_COUNT = 77`; `GUIDE_DRAFT_BULLET_AUTHORITY` resealed to 77 /
  `bbb06e0d2daced207d5c9c30d32739dcf3cc7794943dc321f246ef44a90c07c8`.
- `tools/glassmatrix.mjs` + `glassmatrix-evidence-contract.mjs`: `import`, `import-preferences`,
  `import-modal` and the import `MODAL_ESCAPE_RESTORE` outcomes retired; `#setimport` left the
  Settings focus rows; negative controls `modal-background-containment-restore` and
  `modal-live-error` retired (modal law stays proven by `inventory-modal-*` and the Slice D-TRAIN
  refusal). **Ledger versioning:** `GLASS_NEGATIVE_CONTROL_LEDGERS` /
  `glassPlannedNegativeControlLedger` judge a carrier against the exact ledger it planned, so the
  retained PR35 phone carriers (104 planned) replay green while new runs plan 102; swapped,
  reordered, partial and non-array ledgers match nothing (negative-controlled). `import-phase-sequence`
  and the replacement/reload outcomes are unchanged (harness-driven). Bullet pins 78→77 (control 76).
- `budgets/compendium-memory-v1.json`: **producer authority only** re-derived by
  `print-producer-authorities.mjs` after the final build (`430b92d75d40…`, owner
  `assets/main-Bh74eiXq.js`); measurement authority, ruler, ceilings and calibration samples untouched;
  `selectionRule` cites the previous and current producers. `tools/devpreview.mjs` storage contract:
  no localStorage keys.
- Tests: `read-only-settings-main-wiring` now rejects any `#setimport` (selector or markup) with
  injected-door controls; anchors moved to `#importretry`; Guide/release regexes follow the copy;
  `f4-heartbeat` re-anchored on `phase('release-started')`; `compendium-budget` pins follow the
  producer authority.

### Local gates on this head (macOS, Node 26.7.0)

- `npm run typecheck` PASS · `npm run artunused` PASS · `npx vitest run` **274 files / 2,886 passed / 1 skipped, 0 failed**
- `node tools/glassmatrix.mjs --selftest` PASS · `npm run preview:selftest` PASS · `npm run smoke:report:selftest` PASS
- Glass ledger negative controls PASS (7/7) · `npm install` relinked five workspace packages that the
  local checkout lacked (`package-lock.json` restored; its only diff was key order)
- `node tools/slicesmoke.mjs --profile=develop` **PASS** (Slice + Arc 4 ledger; exact 77-outcome bulletin;
  Guide 9/43/41) on local Edge. ⚠ The new smoke *absence* check (no `#setimport`, no stale import
  controls) has no in-run negative control yet — its vitest twin (`read-only-settings-main-wiring`
  injecting a door) is the only both-directions proof; add a smoke-side injected-door control before
  trusting a hosted PASS of that step.
- Glass agent-lane canaries: `node tools/glassmatrix.mjs --viewport=small-phone` **PASS** (10,923 ms, 0 findings,
  0 instrument failures) then `--viewport=large-phone` **PASS** (10,439 ms, 0/0) — targeted, noncertifying.
  The full certifying 12-viewport matrix was **not** run locally (it requires `--slice-run=<immutable Slice
  run id>` from `smoke:ci`); it is the hosted full lane's job. No hosted run. No certification is claimed.

### ⏭ NEXT SESSION — Batch 4 overnight review is PENDING (recorded 2026-09-05, later)

- Codex ran the unattended Batch 4 overnight prompt and pushed its review branch
  **`origin/openai/review-batch4-gameplay-20260905`**: validated product head
  **`b173353b9e273c4b223e8ee8d6ee181081f79b4a`**, signed report-only successor **`bc42dbc`** (branch head),
  base `develop` **`9ea01041dcdc711190bbf909ea8bb743cd993734`** (unchanged). Codex's own report says: signed core
  `5377069` merged as a real merge parent, all five primary items accepted at their own checkpoints
  (2a st-scan Starter Charter, 2b deterministic descent/wave-offs, 2c 50-Paragon hunt + `para10` Claim,
  2d exact-instance creature progression, 2e mature Atlas), stretch 3a–3c done, 3d measurement-only with
  answerability/throttled-rebuild parked (`npm run perf -- 4` incomplete). Claimed final gates on `b173353`:
  vitest **301 files / 3,100 passed / 1 skipped**, typecheck/artunused, Glass selftest, Slice develop
  profile, both phone canaries (zero findings), root validate (50 fingerprints), budget selftest (81). Draft
  bulletin **79 outcomes**; Compendium producer `c1e784b7…`; sixteen browser/profile reds recorded and
  corrected on new sources; no product reversion. Weekly Charter lifecycle, Forge Training, living
  portrait preview and bulk WIP copy stay parked from `cf1b9a7`.
- **Claude's job next session (read-only on the review branch, own worktree only):** fetch; read
  `audits/BATCH4_OVERNIGHT_REPORT_20260905.md`, `BATCH4_OVERNIGHT_REDS_20260905.json`,
  `BATCH4_PHONE_EVIDENCE_20260905.md`, `BATCH4_PROPOSED_PR_20260905.md` from the branch via `git show`;
  verify the checkpoint table against `git log`; diff `bc42dbc` vs `develop` for scope (no import door,
  no `.github/workflows`/policy/artlock reference edits, no reserved product decisions fabricated, pins
  moved together); replay the fast gates and both phone canaries on `b173353` in a scratch checkout;
  then give Nick a merge/no-merge recommendation with the exact PR base/source/title/body. **Do not**
  open the PR, label, or merge — Nick authorizes the one agent-lane attempt after the review.

### Paired handoff

- **Anthropic/Claude Code (later on 2026-09-05, local batch on `anthropic/mac`, no PR):** (1) the Slice smoke
  absence check now carries its **in-run both-directions control** — an injected `#setimport` row plus a
  stale `#importtext` turns the check red and its removal restores green (`slicesmoke --profile=develop`
  PASS with the control; vitest 274/2,886 unchanged). (2) **Artlock evidence for the P0-6a lane decision:**
  `node tools/artlock.mjs` against the last bless (2026-08-06, `5499e4e`) reports **[DRIFT] 1250 of 1250
  assets changed** (undeclared flora/fauna/quadruped/bird/invert/species classes) and **[SAME] 4 HARD
  pairs** (Wheat≈Rye 0.26, Barley≈Wheat 0.32, Barley≈Rye 0.32, Stick Insect≈Mudminnow 0.57) → FAIL.
  Sensor-stability control: a scratch whole-catalogue bless followed by a re-render reports **0 of 1250**
  drift with identical SAME/HARD counts, so the drift is real, not instrument noise. Causes are plausibly
  both: **136 art-source commits since the bless** (incl. `c55cc63` universe-wide visual polish 2026-08-28,
  the Wave 2d/2e full-reset repairs 2026-08-10, D-ART-188) and the browser moving to **Edge 152.0.4191.62**;
  separating the two needs the Aug 6 source re-rendered under today's Edge. ⚠ artlock **rewrites**
  `reference/samepairs.json` and `reference/shapepairs.json` on every run (the ratchet) — both were
  restored here; a CI wiring must treat those as outputs, never as inputs. **A re-bless is a human claim
  ("someone looked") and is Nick's, not an agent's**; wiring artlock into any lane before a fresh bless
  turns every art PR red on day one. The four HARD pairs are worth an art look regardless. Next candidates
  unchanged: **artlock CI ownership** (P0-6a — Nick's lane/cost decision first; baseline
  `reference/artlock.json` is dated 2026-08-08 and has not been run) and the **eleven-artifact
  verbatim-seal gap** (P0-6b — implementation, but it adds instrument code against the "freeze
  instrument growth" rule). New open product decision from this batch: **how v2 protects saves from
  Safari's 7-day script-writable-storage eviction** (IndexedDB included; Home Screen web apps exempt) —
  install guidance, export/backup, or account. Any hosted run of this head is a re-seal and needs
  Nick's exact authorization.
- **OpenAI/Codex:** the "waits for Nick's real save export" blocker on Batch 4 is **gone**. Before
  continuing, synchronize `openai/mac` from a clean worktree by merging `origin/develop` (`1d719c6`)
  through the shared protocol; do not cherry-pick or copy. Nick clarified (2026-09-05): Codex's
  **Batch A is the audiovisual pilot** (distinct from the external review's lettered batches); continue
  it after the sync. Batch 4 no longer waits for any save export — only its own PR from a bounded
  `openai/review-*` branch and Nick's exact hosted authorization. Once this batch's PR merges, sync
  again before touching Settings/Guide/Training code, and do not reintroduce any import door. Do not
  edit `.github/workflows` or the budget policy in the campaign.
- **Nick:** nothing required on GitHub. Open decisions: (a) the artlock CI lane, (b) the ITP
  save-protection answer (install guidance, export/backup, or account).
- **GitHub / Release:** `main`, the v1.8.9 live site, protected portraits and deployment are
  unchanged. No version bump. `gh` is set to HTTPS for git operations (harmless today; `gh config set
  git_protocol ssh` would align it with the SSH-only rule).
