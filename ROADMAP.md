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

## SESSION HANDOFF — 2026-09-05 · DEVELOP SYNC AND AUDIOVISUAL PILOT BATCH A

### Exact source and authority

OpenAI/Codex on macOS, `/Users/nick/Projects/celestial-frontier-openai-mac`, branch `openai/mac`,
tracking `origin/openai/mac`. The checkout was clean at
`3ffee05113904cf5cc8d45a90a6d2704ddf1b1eb` before the requested real merge of
`origin/develop` **`9ea01041dcdc711190bbf909ea8bb743cd993734`**. These are the two merge parents;
no rebase or signed-history rewrite. Exact resulting SHA and terminal check results are reported
at Git handoff, after committing the source so the checks can bind that unchanged commit.
SSH origin `git@github.com:TheDakk/Celestial-Frontier.git`; established authentication as `TheDakk`
and this batch's repository fetch passed.

Nick explicitly authorized this merge, documentation conflict resolution, browser-free checks
and normal `openai/mac` branch push. Budget UNFROZEN, last verified PUBLIC, private fallback
3,000. Branch push triggers no workflow. No PR, label, hosted attempt, release or deployment is
requested. `.github/workflows` and `tools/actions-budget-policy.js` are inherited byte-for-byte
from develop. Any future hosted attempt requires its own exact authorization.

### Landed decisions and preserved work

- PR #36 landed the two-lane battery; PR #38 admitted bounded `openai/review-*` and
  `anthropic/review-*` branches into develop. Agent PRs run browser-free develop plus both phone
  Glass canaries. Full Compendium → Slice → twelve-row Glass runs on develop-to-main or the
  separately authorized full-chain label. The policy selftest expects 81 controls.
- PR #39 integrated the original signed Batches 1–3 through Claude's merge `1219648`, with PR
  merge `1d719c63fbcdb6d0e6ab98a96b16e487aafe1239`. PR #37 is closed as superseded.
  `openai/review-batches-1-3-20260904` stays at `121df53d0d101822f32f2ca98a878db10518e65d`.
- PR #40 landed at `9ea0104`. **Nick's 2026-09-05 decision: v2 is a brand-new game for everyone.**
  No legacy player-save import; never restore Settings “Bring expedition” or a hidden paste path.
  Gate C is v2 persistence on a real device. Keep the existing v1.8.9 codec and evidence-build
  `importBlob` replacement seam. Training recovery remains reload/update-only. The draft bulletin
  is **77 outcomes**. Glass judges retained carriers by their planned
  `GLASS_NEGATIVE_CONTROL_LEDGERS`, not by the newest ledger alone.
- Local and origin `openai/parked-gameplay-20260904` stay at
  `cf1b9a7843200ecc281c5113b4139909dc0e3a29`. Batch 4 / checkpoint / 85-file WIP are not in the
  pilot source. **Batch 4 no longer waits for any save export**; it requires its own bounded
  `openai/review-*` PR and Nick's exact hosted authorization. WIP remains unvalidated and parked.

### Merge verification boundary

The branch's additional work is documentation/audit/campaign policy only. All `port/v2` runtime,
build tools, tests, budgets and package inputs match landed develop. Therefore no additional
`main.ts` producer change is introduced: keep develop's Compendium producer
`430b92d75d40b01f3278f0b00916603c1359acb9278b77142ab3eae810ce5f45` and corresponding test pins.
The develop profile's existing producer-authority check rebuilds and verifies that identity;
there is no duplicate standalone printer run. Measurement authority, calibration and ceilings
remain byte-identical to develop.

Required next checks on the clean committed merge, once and stop on red:
`node port/v2/tools/tracked-input-preflight.mjs --profile=develop` (isolated exact-source
browser-free profile) and `node tools/actions-budget-policy.js --selftest` (81 controls).
Do not present earlier PR #37 / Claude results as evidence for this new merge. No local browser
chain or hosted certificate is requested by this sync. Root `node tools/validate.js` passed after
resolution: 1,010 renders, zero boot/render errors and all 50 v1 fingerprints unchanged. Push
only the tested merge after both remaining checks pass.

### Audiovisual Batch A and policies

Nick accepted `port/AAA_AUDIOVISUAL_CAMPAIGN.md` with five amendments: Phase 0/1 Batches A–D
only; the integrated pilot approval stop stands. No Phase 2, purchases or protected-portrait
changes. Top bar/dock/rails leads Phase 2 after approval. This campaign does not edit CI or budget
policy; Claude owns that lane. Batch A here means **audiovisual source/tool readiness**, not the
external review's lettered implementation batches.

`port/AAA_ASSET_POLICY.md` fixed the ceilings before measuring: complete installed pack ≤128 MiB,
aggregate retained pack payload during update overlap ≤256 MiB. Count actual cached response
bodies including duplicated caches; decoded/GPU memory is separate. Enforcement and real-device
acceptance remain unproven. Offline is an installed, complete, ready PWA promise while storage
is retained; never promise immunity to eviction or save recovery after deletion.

Blender 5.2.1 save/separate-reopen/render passes. REAPER 7.79 loaded Surge XT 1.3.4 instrument and
effects, saved/reopened and exported a four-second WAV/FLAC cue. Isolated Edge decoded both and
processed them through Web Audio. Existing hashed logs are historical tool-readiness evidence;
do not rerun unchanged tests. Human listening, Safari/iPhone and in-game audio acceptance remain
open. The rendered Lanternback/forest concept is an invented example, not canonical portrait
replacement or accepted eight-body-plan coverage.

Editable `.blend`, `.rpp`, patches and WAV masters remain outside public Git, SHA-256 indexed;
optimized outputs only, no Git LFS. **Independent backup destination is still unselected and
unverified.** Local copies on this Mac do not close that prerequisite. Next bounded Batch A task,
after sync/push: preserve the complete existing audio project/recipe/output relative layout in
the private source store and verify its manifest. No rerender or source upload is required.

Batches B–D retain one ship/biome treatment plus quadruped, biped, avian, serpentine, arthropod,
tentacled, aquatic and flora/fungus at actual 132/300/440, static and animated. Unfaithful families
keep the protected static portrait and are explicitly incomplete. Then audio, styleguide/three
mockups and actual-game integration lead to Nick's pilot approval stop.

### Paired handoff

- **OpenAI/Codex:** finish the committed-merge checks and authorized `openai/mac` push, report
  exact SHA/results, then continue only the bounded Batch A source preservation above. Preserve
  both parked/review refs. No new Batch 4 PR is requested by this sync.
- **Anthropic/Claude Code:** may continue unrelated work in its own owned folder. At its next
  coding batch, fetch and merge latest `origin/develop` into its own clean branch. Codex's
  audiovisual documentation is on `openai/mac`, not integrated into develop; do not copy files
  or expect those assets to be installed. The fresh-start decision is already on develop.
- **Nick:** no GitHub action or PR fields needed now; no need to open Claude now. Independent
  master backup still needs a chosen destination before that deliverable can be complete.
- **Release:** develop remains `9ea0104`; main/live site, protected portraits and production
  version remain unchanged. No hosted run, release or deployment in this batch.
