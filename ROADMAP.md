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

## SESSION HANDOFF — 2026-09-04 · AUDIOVISUAL PILOT BATCH A

### Authority and scope

Nick accepted `port/AAA_AUDIOVISUAL_CAMPAIGN.md` with five amendments: Phase 0/1 Batches A–D
only. Stop after the integrated pilot for Nick's review. No Phase 2, purchases, protected-portrait
changes, hosted runs or release. Top bar/dock/rails leads Phase 2 after approval. Claude owns the
cheap agent-to-develop CI lane on `anthropic/windows`; Codex does not edit CI/budget policy.

### Source and parking

OpenAI/Codex on macOS, `/Users/nick/Projects/celestial-frontier-openai-mac`, branch `openai/mac`,
tracking `origin/openai/mac`. SSH origin `git@github.com:TheDakk/Celestial-Frontier.git`; fresh
SSH authentication as `TheDakk`, repository read and fetch passed. Landed baseline is
`7bf3e84761da2d1abe21dc6fe751b4bad2308f3b` (PR #35 merge).

All post-merge local commits and 85 unfinished gameplay files are preserved at
`cf1b9a7843200ecc281c5113b4139909dc0e3a29` on local `openai/parked-gameplay-20260904`.
Every file matches the pre-parking SHA-256 inventory. This is explicitly unvalidated WIP, not
integration. Nick later authorized an unchanged backup push; origin read-back confirms the same
`cf1b9a7…` parked tip. The active branch was safely recreated from landed develop without reset or force
operations. Pilot product source starts at landed develop; no dependency on parked Research,
Charter/descent/Paragon/Atlas/progression work. Ignored old build output is not evidence.

The full review and `audits/FULL_REVIEW_DISPOSITION_20260904.md` are retained for Claude.
Disposition claims are parked-source evidence, not current develop behavior.
`audits/AAA_BATCH_A_RECONCILIATION_20260904.md` records the reconciliation.

### Policy fixed before measuring

`port/AAA_ASSET_POLICY.md`: <=128 MiB complete installed pack, <=256 MiB aggregate pack payload
through an update. Count response-body bytes including shell/media and duplicate caches; measure
decoded/GPU memory separately. Defer updates rather than deleting active-client assets or saves.
PWA enforcement is not yet established. Editable Blender/REAPER/patch/WAV masters stay outside
public Git, SHA-256 indexed and independently backed up; optimized outputs only, no Git LFS.
Private backup location awaits Nick's selection. Temporary readiness sources are backup-pending.
Offline promise is a fully installed ready PWA while data remains retained, not eviction immunity.

### Current work and next actions

Batch A tool readiness is underway: Blender 5.2.1; REAPER 7.79; Surge XT 1.3.4 instrument/effects
installed. A fresh terminal-only Blender save/separate-reopen/render passes (960×640, Cycles
CPU, 4.39s); PNG inspected. REAPER terminal script loaded Surge VST3 instrument/effects,
saved/reopened the project, and rendered 4s WAV/FLAC successfully after Nick opened the startup
UI; output hashes reverified. Surge standalone CLI help/version pass; its live MIDI/OSC path is
not exercised and offline export uses the verified REAPER VST3 host. Waveform verification
passes. A fresh isolated Edge probe decodes both outputs and processes them through Web Audio;
audible listening, Safari/iPhone/in-game acceptance and independent source backup remain pending.
Nick's requested private creature/ecosystem Blender example is rendered and inspected; its
invented Jungle-inspired Lanternback is concept exploration, not canonical/body-plan acceptance.
Sources and outputs are hashed and locally preserved; independent backup is still pending.
Batches B–D: one ship/biome treatment plus quadruped, biped, avian, serpentine, arthropod,
tentacled, aquatic and flora/fungus at actual 132/300/440, static and animated. No faithful
animation => protected static portrait and explicit incomplete status. Add coherent audio,
styleguide/three mockups and actual-game integration, then submit local pilot for approval.

### Paired next steps / Git

Codex: continue Batch A; independent source-backup selection/verification is the remaining
production-source prerequisite. Original disposition and unchanged parked-backup pushes are done;
new current-side documentation remains local. Budget remains UNFROZEN; last recorded visibility
PUBLIC, private fallback 3,000. No hosted attempts, labels, merges or release authorized.

Prepared local source `openai/review-batches-1-3-20260904` points directly to signed
`8bf9c45d4aae74a6924bcdc201424db0af4770e6`; exact range from landed `7bf3e84…` contains only
Batches 1–3. Exact-archive develop PASS: 274 files, 2,885 tests / one skip, all owners, 42.915s;
1,845 tracked file hashes unchanged. Two phone preflight rows are not yet run on this candidate.
PR is not opened and candidate branch is not pushed. Exact base/source/title/body and evidence:
`audits/PARKED_BATCHES_1_3_PR_PREPARATION_20260904.md`. Batch 4 awaits Nick's real save export and
its own PR; WIP stays parked. These fixes have not been applied to the audiovisual checkout.

Claude on `anthropic/windows`: fetch/read the backed-up parked verifier as reference and continue
the lane; do not merge/copy parked gameplay. Nick selected browser-free develop plus existing
small/large phone rows on every agent PR; full Compendium → Slice → twelve-row Glass only on
develop-to-main or a separate on-demand label. This coverage choice is pending Claude's workflow/
protocol implementation and does not authorize a run. The old Batch 1 workflow/verifier tests
must be composed with Claude's lane through Git. Codex makes no new CI/budget-policy edit.
GitHub action now: none. Nick need not open another app. After a future authorized merge, the
other clean agent branch syncs from develop. Main, live site and deployment remain untouched.

### Local checks at Batch A checkpoint

Root validation PASS (1,010 clean species, 50 unchanged fingerprints). Browser-free develop
PASS: 268 files, 2,785 tests / one skip, all TypeScript/art/route/spec owners. No browser chain,
hosted run or product-source change. Blender readiness render is inspected; REAPER/Surge
terminal save/reopen/render now passes (48kHz stereo, WAV 24-bit/FLAC 16-bit, four seconds,
non-silent and unclipped). Private source-backup selection/verification remains the prerequisite
for production Batches B–D. Claude's review corrections are accepted. Only the unchanged parked
backup received the later authorized push; local documentation, the prepared PR candidate and
concept assets are not integrated. No CI implementation, hosted attempt or release occurred.
