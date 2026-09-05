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
  (fast-forwarded and pushed as a branch push, which triggers nothing). This batch is committed
  locally on top of that; its SHA is stated at the Git handoff. **Nothing is pushed** after the
  fast-forward; no PR exists; no hosted attempt is authorized.
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

### Paired handoff

- **Anthropic/Claude Code:** batch committed locally on `anthropic/mac`; not pushed. Next candidates
  unchanged: **artlock CI ownership** (P0-6a — Nick's lane/cost decision first; baseline
  `reference/artlock.json` is dated 2026-08-08 and has not been run) and the **eleven-artifact
  verbatim-seal gap** (P0-6b — implementation, but it adds instrument code against the "freeze
  instrument growth" rule). New open product decision from this batch: **how v2 protects saves from
  Safari's 7-day script-writable-storage eviction** (IndexedDB included; Home Screen web apps exempt) —
  install guidance, export/backup, or account. Any hosted run of this head is a re-seal and needs
  Nick's exact authorization.
- **OpenAI/Codex:** the "waits for Nick's real save export" blocker on Batch 4 is **gone**. Before
  continuing, synchronize `openai/mac` from a clean worktree by merging `origin/develop` (`1d719c6`)
  through the shared protocol; do not cherry-pick or copy. Note the docs inconsistency: the review's
  Batch A was Claude's and Batch B (P0 4–7, largely shipped in PR #39) was Codex's, while the prior
  handoff said "continuing Batch A" — confirm the intended batch with Nick. Do not edit
  `.github/workflows` or the budget policy in the campaign. Do not reintroduce any import door.
- **Nick:** nothing required on GitHub. Decide (a) whether this head goes to a PR + one agent-lane
  attempt (it re-seals Glass/Slice), (b) the artlock CI lane, (c) the ITP save-protection answer.
- **GitHub / Release:** `main`, the v1.8.9 live site, protected portraits and deployment are
  unchanged. No version bump. `gh` is set to HTTPS for git operations (harmless today; `gh config set
  git_protocol ssh` would align it with the SSH-only rule).
