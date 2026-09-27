# Celestial Frontier — Roadmap & Session Handoff

## 📌 PINNED — STANDING PROCEDURE (Dakk, 2026-07-20): UPDATE THE MARKDOWN DOCS AS WE GO.

The per-system docs at repo root (WORLD_GENERATION · ART_DIRECTION · BIOME_ATLAS ·
SPECIES_AND_GENOME · PROCEDURAL_CHARACTERISTICS · CREATURE_ANIMATION · RARITY_AND_GRADES · RARITY_UNIVERSAL · CAPTURE_AND_BIOSPHERE ·
COMBAT_AND_CONQUEST · PROGRESSION · ECONOMY_LOOT_CRAFTING · QUESTS_AND_CHAPTERS ·
BREEDING_AND_SHARING · DETERMINISM · SAVE_SYSTEM · UI_PRESENTATION · AUDIO · AUDIO_LICENSES ·
EXPLORATION_SHIPS_LOOT_AND_COMPANIONS · LOCAL_AI_GENERATION) are current system references. Update the affected reference
and `celestial-frontier-codebase-reference.md` in the same batch as its code; source wins when they
disagree. `PROCESS_LAWS.md` is the standing reference for earned implementation/testing laws.

## 📌 PINNED — ROADMAP HYGIENE

Keep this file as the lean live handoff: current state, the active batch, next work and process.
Completed batch logs and superseded handoffs live in `ROADMAP_ARCHIVE.md`, newest first, with
nothing deleted. At the end of an Arc, or when this file approaches 400 lines, move aged blocks to
the archive verbatim and refresh this handoff in place.

## CLAUDE SESSION HANDOFF — 2026-09-27 (session 5, end) · GENERATED ART IS THE GOAL · PAUSED FOR I5
Self-contained for a fresh Claude session. Codex's block follows below. Older Claude handoffs are verbatim in `ROADMAP_ARCHIVE.md` (session 4's is at its top).

**Dakk's goal (2026-09-26, verbatim):** "Can we get to the generated art? That's the main goal, so that we have the complete Earth creatures having full movement animations and all the procedurally generated animations in their various different battleground biomes." Dakk does ONE full visual pass at the end; don't stop for per-creature approvals.
**Latest (Codex C125, 2026-09-27):** Dakk paused new art/gameplay: record everything, then finish I5. Claude honours it. **C121 (24 originals, `audits/G2_C121_20260927`) is delivered but NOT scored**; score it first when art resumes.

**Where things stand**
- **Branch:** `anthropic/mac` is pushed through the commit adding this block; every commit is signed G. Codex is merged through `bc86c863` (IndexedDB callback owners; I5 3+1 epoch next under a native/perf reservation).
- **Gate: FULLY GREEN (2026-09-27, `8cbc0f5d`).** From `port/v2`, `node tools/check-profile.mjs --profile=develop` shows PASS: 5,725 pass, 0 red. I5 is closed by Codex's verified v2 certificate (a local 3 calibrations + 1 certification pass; `tests/compendium-active-certificate.test.ts` refuses missing, changed or drifted evidence). Also green: `npm run typecheck`, `npx tsc --noEmit --noUnusedLocals`, `npm run artaudit`, `npm run overridecheck`, `node tools/speccheck.mjs`, `npm run overridecontrol`.
- **Codex reservations:** when Codex posts "native/performance reservation active", run NO native, NO gate and NO heavy CPU until its terminal notice. Host load may starve its foreground timer (C119).
  - If you must stop your own native run, a killed run leaves `$TMPDIR/celestial-frontier-workspace-edca5601ad4f1c5ce26e.lock.json`. Remove it only if its pid is dead AND its `repoRoot` is this checkout.
- **develop** is still `c1791e21`; PR #43 is open; no hosted attempt.
- **Decisions:** D25 open (shopping stays off; the C110 data point is recorded there); D27 open; **D28 new** (remainder-island cap: keep 5% or raise it to 10% for reviewed subjects; the default keeps 5%).
- **Progress:** `audits/GENERATED_GALLERY_20260927/coverage.json` counts **ACCEPTED only** (Claude's full-size review; held entries are listed as `heldNotCounted`). **175 of 631 Earth species (27.7 %)** are accepted and 13 are held. Master gallery: `gallery.jpg`; registry: `gallery-registry.json`, whose notes say HELD or why accepted.

**HOSTED READINESS — PR #43 (`anthropic/mac` → `develop`), 2026-09-27 end of day**
- **Commit `66e19826` fixed a hosted red nobody could see locally.** Both Glass phone canaries, which the bounded agent lane always runs, were PRODUCT-RED on `SHIPYARD_STATE_TRUTH`. The shared Engineering contract still pinned 70 Shipyard controls, while the product renders 85 (70 + 15 Fabricator ×5, D16 `e1882e49`) and has `diag.trainingPractice` (Forge Training). The develop profile never runs browser canaries.
  - The fix changes the contract, Glass and Slice.
  - A new product-bound test renders the real panel and must equal the contract list exactly; the stale 70 fails it.
- **Rehearsed locally on this exact source, everything the AGENT lane runs, all green.** The PR touches 65,631 paths, so `battery-scope` marks every scope changed.
  - Browser-free checks: `actions-budget-policy --selftest`; the legacy gates `preflight:selftest`, `validate`, `smoke`, `trainingcheckpoint`, `rarity-sanity`, `deadcode`; the develop profile (5,726 PASS); `overridecontrol`.
  - Browser checks: `browsercdp --selftest`; Glass small-phone and large-phone PASS, 0 findings; `browserpath`, `compendiummem-browser-preflight` and `compendiummem:selftest`; root `uilayout --selftest`, `uilayout` and `--verify-run`.
  - Plus typecheck, `--noUnusedLocals`, artaudit, overridecheck and speccheck.
- **Not rehearsable here, so residual risk:**
  - The hosted Glass `--verify-targeted-run` requires canonical Chrome; this Mac has only Edge. The runs it verifies pass.
  - Large-phone Glass had 1 load-time instrument flake (Settings audio settlement) in 5 local runs. The hosted lane has no retry.
  - The FULL chain (Compendium certification, Slice, the 12-viewport Glass matrix, Recovery) was not rehearsed. `slicesmoke` changed in `66e19826`.
- **PR #43 still carries the stale `actions-full-chain-approved` label from 2026-09-21.** The workflow fires only on a *labeled* event, and no push since then has started a run.
  - A hosted attempt is Dakk's word: remove the label, then apply ONE label.
  - **Recommended: `actions-budget-approved` (the bounded agent lane)**, rehearsed above.
  - The full chain is heavier and not rehearsed.
  - Per the budget file: one attempt, no retry.

**Session 5 results (details in the mailbox rows C101–C121 and the audit READMEs)**
- **`score-batch.mjs <batch> <tag> [--fish-seams]`** runs the whole pipeline in one command.
  - `--fish-seams` runs Codex's guarded fish repair. Fish are accepted on the seams fit only after a side-by-side full-size look.
  - Water-only media (the eels) get the aquatic arena.
- **Remainder islands** (`audits/BIRD_ISLANDS_20260927`, `audits/QUAD_ISLANDS_20260927`): in the head-down late idle, body-owned slivers float beside the head.
  - `remainder-islands-fit.mjs` reassigns them on the exact raster: 5% cap, tested, 3 mutants. Apply it per subject only after the full-size look shows a float; islands are nearly universal and usually harmless.
  - 8/8 in-cap repairs fixed the defect.
- **Soundscape admission (C105) is DONE** (`f77e158c`). `AudioRuntime.mayPlay` / `DecorativeVoicePort.mayPlay`; no PCM while not admitted. Codex measured soundscape PCM at 0.
- **C110 ungulates: 0/24** (short tails, ear tips, thin fore-ankles against the current references). Shopping admits only 2, so the fix is hoofed REFERENCE packets, which have been asked of Codex (C115).

**Next, in order (Claude), once art resumes**
1. Read Codex's mailbox (`/Users/dakk/Projects/celestial-frontier-openai-mac/audits/MAILBOX/TO_CLAUDE.md`, read-only) and merge any newer signed `openai/mac` (`--no-ff`; keep this block).
2. Score C121, then each new batch: `node audits/G1_AUTO_AUTHOR_20260926/score-batch.mjs <batchDir> <fresh-tag> --fish-seams` (out of the sandbox, never during a Codex reservation).
   - Look at the reaction AND `turn3-hit-idle-90` at full size.
   - Fish: compare the unrepaired fit with the seams fit. Land animals and birds with a float: `remainder-islands-fit.mjs` → static → native → look.
   - Write every registry note (accepted reason or HELD), then run `gallery.mjs` and `coverage.mjs > coverage.json`, add a mailbox row, commit and push.
3. When Codex delivers ungulate references: add them to `pilots/reference-pool-extras.json`. The mutant battery (`run-mutants.mjs --counter --extra-refs=…`) must stay identical, then re-score C110.
4. Admission only after Dakk's end-of-pass approval.

**Traps (obey them)**
- Disk ≥ 40 GiB free.
- Inline `//` comments swallow dense one-line JS; use `/* */`.
- zsh does not word-split: use arrays or `${pr%%:*}`.
- `Buffer.slice()` is a view.
- The static runner needs its fit and output under `audits/`.
- A green number is not visual acceptance.
- Browser-owning commands run out of the sandbox.
- Codex's sealed inventories are never rebound by Claude.

## Current Codex sprint handoff — 2026-09-27, development paused; I5 proof passed

**Dakk's latest instruction:** pause art/gameplay development, record everything, finish I5 immediately. Do not start further painting/repair batches without his resumption. No active generation is pending. All168 recent originals in seven24 batches (C101/106/107/110/114/118/121) are saved and signed; C121 is queued first for Claude when art resumes. Claude's latest score is175/631 accepted in his native review,13held; Dakk's final visual acceptance is still outstanding. D28 undecided: retain5%island cap.

**I5 proof:** signed product d20c2716604209a67359d4f16cfaac504347963f passed3calibrations+1certification and all4rawverifiers, no retry or source drift; all78outcomes/40ceilings and historical v1 bytes unchanged. Evidence signedafec51f84; Claude pause handoff merged through816f30dd1 in d34db50. `audits/I5_IDB_OWNERS_20260927/epoch/execution.json` is the terminal certified record. No native reservation remains. The explicit active-v2 selector now admits only fully verified raw evidence matching current measurement and built product. I5 CLOSED: final develop profile5725PASS (2expectedfail/2skipped,0unexpectedfailures), allseven ownersPASS on signed991997ae5; source/loghashesverified. Current source digest and complete proof are in audits/I5_IDB_OWNERS_20260927/RESULT.json. Claude independently confirmed the same green battery in signede573f934; merge05716bf adds only his roadmap/mailbox confirmation, preserving his handoff byte-identically. Checkpoint7227a39af was normally pushed toopenai/mac; this confirmation supplement changes documentation/evidence only. No hosted action.

**Repairs carried:** actual Back chip occlusion, Mac native keycode timer starvation, painted/audio cache lifetime, padded raster scratch disposal (exact7,077,888bytes), and IDB callback wrappers (exact11transient listeners). Database-owned capture dispatch replaces per-operation native callbacks while preserving atomic save/stale/abort/error outcomes. Native checks plus real mutants are retained. Every stopped epoch remains stopped with raw evidence preserved; none was resumed. Full pause/history map: `audits/I5_IDB_OWNERS_20260927/SESSION_HANDOFF.md`; previous Codex handoff archived verbatim.

**When Dakk resumes:** C121 automatic scoring; hand-authored reference packets (standing/folded birds, separated-leg cat/dog/mustelid/insects/ungulates); remaining insect/bird/quad motion and body/tail seams; Bobcat slowdown; broad pattern-first G2 batches and eligible finished originals. Do not infer visual acceptance from green metrics. Main project goal remains all631 Earth creatures with their own generated painting and full battle-biome movement, one final Dakk pass.

**Operations:** openai/mac only, signedG commits; Claude's absolute mailbox read-only at run start/batch end, replies onlyownTO_CLAUDE. Merge newerGanthropic/mac --no-ff preserving Claude handoff byte-identically and grep conflicts. Quiet develop+7owners before own normal push, fresh PUBLIC/UNFROZEN/workflow checks. No PR/label/hosted/develop/main/release/deploy/version bump. Native commands outside sandbox. Disk167GiB, floor40. Reuse managed i5-back-proof atd20; do not rerun successful/stopped epochs or weaken/rebind a certificate for later source changes. No app-switch/relay needed.
