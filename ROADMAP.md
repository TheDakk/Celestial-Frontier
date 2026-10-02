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

## CLAUDE SESSION HANDOFF — 2026-10-01 (session 7) · ART RESUMED · AI FINISHER IN THE LOOP · C132 PROGRAM ISSUED
**Session 7 (2026-10-01), on top of the session-6 block below (still valid unless superseded here):**
- **Dakk resumed development** (option b): "I want the AI runtime involved" (meaning: in the art work) and the priorities are the
  documented battle vision — local AI generation, battle scenes, animations, the smooth Pokémon/FF-style painted battle.
- Merged Codex's housekeeping `4cf16a128` (`f307d0a0`); develop gate PASS (5,726 / 2 expected / 2 skipped) with the local-AI
  runtime set aside and restored.
- **C121 scored** (`37123ed3`): 11/24 native PASS; accepted Finch, Sandpiper, Wasp, plus Ptarmigan and Vulture on the remainder-
  island repair (`audits/BIRD_ISLANDS_C121_20261001`). Lark, Chough, Hawk, Crow, Snowy Owl held: island 5.9–41.6 % > 5 % cap (D28).
  **Coverage 179/631 (28.4 %), 18 held.**
- **AI finisher in the art loop** (`audits/AI_FINISH_C121_20261001`): `finish-batch.mjs` (D26 runner generalized; labels derived for
  polygon fits) + `rebind-batch.mjs` (copies only finisher-changed pixels so the keyer's despilled edges stay) + `native.mjs`.
  5/5 conservation PASS, ~44 s each, phone zero-model; `painter-vs-finished.jpg` shows the change on G2 originals is subtle.
- **C132** (`audits/MAILBOX/C132_ART_PROGRAM_20261001.md`) is the whole remaining battle/art/local-AI program for Codex, written
  from MOTION_KIT, ART_KIT Arena/Effects, ATTACK_ANATOMY, SOUND_KIT, §20 and C15. Claude's side: score every batch (incl. finisher),
  wire arenas into `compileHabitatBattle` and effects into the stage the day they land, §20 Command/S4/boss proposal.
- **Disk (2026-10-02, Dakk's word):** deleted the rewrite verify copies `~/Backups/cf-verify-checkout`, `cf-verify-from-github`, `cf-verify-develop`
  (~43 GB; the ref lists kept in `~/Backups/cf-verify-from-github-lists/`). The pre-rewrite backup, `cf-push-ready` and `cf-identity-rewrite-v4`
  (~35 GB) still wait on GitHub Support. Overnight agent worktrees are removed after each merge (~19 GB each). 154 GiB free.
- **Overnight 2026-10-01/02 (C132 program, both lanes):** Claude-side builds merged: theme-effect registry + all 11 painted
  themes wired; home-ground arena routing from delivery manifests, live encounter worlds, medium-aware (water sets only when both
  fighters swim); effects launch at the attacker's posed contact joint; guardian boss choreography (`?guardianChoreo=1`, off; D2 bear
  film PASS in `audits/GUARDIAN_CHOREOGRAPHY_20261001/film-d2-bear-01`); G1 reviewed absence now reaches the author before its checks.
  **Dakk decided D29 (arena canvas 1672×941) and D30 (WebP runtime plates in the offline pack), and accepted all 45 arena sets —
  every one of the 43 biome families has a painted arena** (pack 83.5 MB / 128 MiB). Scored C136 (reptiles: Iguana, Horned Lizard,
  Land Iguana), C151 (Wildebeest, Saiga — first ungulates); all accepted creatures AI-finished + filmed. **Coverage 184/631.**
  Open: reptile sprawler motion profile (C163), head-down islands over the cap (D28), Codex's I5 epoch on `72bbe1531` (my develop gate:
  5,963 PASS, only the expected producer red).
- **Open for Dakk:** D28 (island cap; 6 more birds now wait on it); finisher scope (every accepted G2 original vs procedural creatures);
  dev-preview redeploy; PR #44 hosted attempt.

## CLAUDE SESSION HANDOFF — 2026-10-01 (session 6, end) · DEVELOPMENT PAUSED · IDENTITY CLEANUP DONE
Self-contained for a fresh Claude session. Codex's block follows below. Session 5's handoff is verbatim at the top of `ROADMAP_ARCHIVE.md`.

**Dakk's goal (2026-09-26, verbatim):** "Can we get to the generated art? That's the main goal, so that we have the complete Earth creatures having full movement animations and all the procedurally generated animations in their various different battleground biomes." Dakk does ONE full visual pass at the end; don't stop for per-creature approvals.
**Status:** development (art and gameplay) is **PAUSED by Dakk**. Nothing runs until he says go. C121 (24 originals, `audits/G2_C121_20260927`) is delivered but NOT scored; it is first when art resumes. Codex retains 168 generated originals (its block below).

**Where things stand (all ids are post-rewrite)**
- **I5 is fixed.** Codex's local proof passed 3 calibrations + 1 certification with every limit unchanged; the v2 certificate is admitted (`tests/compendium-active-certificate.test.ts`). 5,725 tests and all 7 required owners pass, and Claude confirmed it independently. Codex's `openai/mac` head is `73238cb4`: the rewritten form of its old `13f07d07`, plus the identity re-seal.
- **`anthropic/mac`** is pushed through the commit adding this block. Develop profile **PASS: 5,726 tests, 560 tool tests, 0 red**. Typecheck, `--noUnusedLocals`, artaudit, overridecheck, speccheck, overridecontrol, the Actions budget policy selftest and the legacy gates are all green.
- **PR #44** (`anthropic/mac` → `develop`) is the clean continuation of PR #43, which was closed unmerged and goes to GitHub Support for deletion. #44 has **no labels**. A hosted attempt is Dakk's word: apply ONE label, `actions-budget-approved` (the bounded agent lane, rehearsed locally), one attempt and no retry. The full chain was not rehearsed.
- **`develop`** is `3a5cc296` and shows 10 sealed-pin reds until #44 merges (no direct commits). **`main`** is `8ad32c7b` and turns green at the next release.
- **Decisions open:** D25 (shopping stays off; C110 data point recorded), D27, D28 (remainder-island cap: keep 5% or raise to 10% for reviewed subjects; the default keeps 5%).
- **Art progress:** 175 of 631 Earth species (27.7 %) are accepted and 13 are held (`audits/GENERATED_GALLERY_20260927/coverage.json` counts accepted only).

**IDENTITY REWRITE — 2026-09-30/10-01 (owner-approved force push; read before anything else)**
- All history of this repo and both Pages repos was rewritten to remove the owner's personal identity. The public identity is **TheDakk**; the owner is referred to as **Dakk**. **Never write the owner's real name, e-mail or user-folder name** into any file, commit, message, tag or branch name. Write home paths as `~/…`.
- **Every commit id before 2026-10-01 changed.** Ids quoted in older docs, mailbox rows and evidence refer to the OLD history. The receipt, byte-for-byte proof and tools are in `audits/IDENTITY_RESEAL_20260930/`. Rewritten commits are unsigned (unavoidable); new commits are signed as before.
- The rewrite turned old user-folder paths into `/Users/dakk/…`. In sealed records the project resolves `record.source` through `repoRelativeSource`, so they still work, and live instructions now use `~`. **Two dev tools still hard-code `/Users/dakk/…` for Codex's worktree:** `port/v2/tools/anatomy-verify/score.mjs` and `calibrate.mjs`. Fix them to `os.homedir()` only together with the next I5 certificate re-measure: any `port/v2` source change alters the built service worker and breaks the producer authority (proven 2026-10-01). Historical text keeps the rewritten form.
- **Pre-push identity guard** (`.git/hooks/pre-push` + `.git/identity-guard/old-commits.txt`) is in the shared Mac clone (every worktree) and the site clone, and in both Windows clones. It stores only sha256 digests and refuses old pre-rewrite commits, the name word, the surname, the address/account, home-folder paths and the "owner" field. Never use `--no-verify`. **A new clone gets the guard before its first push.**
- `main`'s workflow file still triggers `test-battery` on every push to `main`, with no authorization job (one such run was cancelled 2026-10-01). Replace it in the next release.
- **Waiting on GitHub Support:** the purge of `refs/pull/1–42/head`, PR #43's head/merge and the cached old commits (purge list in Dakk's local support folder, unchanged). **After Support confirms:** delete the Mac backups (`cf-identity-backup-20260929`, `cf-identity-rewrite-v4`, `cf-push-ready`, the verify folders, `support-request`, the saved package-lock copy) and show Dakk they are gone. Windows deletes its own.
- The dev preview site holds rewritten build files whose pinned hashes no longer match. Redeploy it at Dakk's word.

**Generated-art pipeline (state at the pause; details in mailbox rows C101–C121 and the audit READMEs)**
- `score-batch.mjs <batch> <tag> --fish-seams` runs the whole pipeline in one command; water-only media get the aquatic arena.
- `remainder-islands-fit.mjs` repairs head-down floats per subject after a full-size look (5% cap, D28).
- C110 ungulates are 0/24 against the current references; the fix is hoofed reference packets from Codex (asked in C115).
- Soundscape admission is done: no PCM is rendered or kept while playback is refused.

**Next, in order (Claude) — only at Dakk's word**
1. Read Codex's mailbox (`~/Projects/celestial-frontier-openai-mac/audits/MAILBOX/TO_CLAUDE.md`, read-only) and merge any newer signed `openai/mac` (`--no-ff`; keep this block). Run the develop gate before pushing.
2. When Support confirms the purge: delete the Mac backups listed above and show Dakk they are gone.
3. At Dakk's word: dev preview redeploy; PR #44 hosted attempt (one label) and normal review.
4. When art resumes: score C121, then each new batch with `score-batch.mjs … --fish-seams` (out of the sandbox, never during a Codex reservation). Look at the reaction AND `turn3-hit-idle-90` at full size, write every registry note, run `gallery.mjs` and `coverage.mjs > coverage.json`, add a mailbox row, commit and push. Re-score C110 when the ungulate references arrive (the mutant battery must stay identical). Admission only after Dakk's end-of-pass approval.

**Traps (obey them)**
- **Local-AI runtime trap (2026-10-01):** the I5 producer authority was re-bound on a clean clone WITHOUT the optional, git-ignored local-AI runtime (`tools/local-image-generation/node_modules`). A worktree that has it installed (this one and Codex's i5-back-proof) emits extra `dist/__local_ai/` assets and a different service worker, so the develop gate shows exactly one red: `current-producer-authorities` (`inputs.serviceWorker.sha256`, `sha256`). With the folder renamed aside the gate is PASS (verified 2026-10-01, then restored). The hosted runner has no runtime, so it matches. Run the gate with the folder set aside; never re-bind the certificate to a local-AI build. A lasting fix (exclude `__local_ai/` from the service-worker identity) is a source change and waits for the next I5 re-measure.
- Disk ≥ 40 GiB free. Browser-owning commands run out of the sandbox. Codex's sealed inventories are never rebound by Claude.
- Inline `//` comments swallow dense one-line JS; use `/* */`. `Buffer.slice()` is a view.
- zsh: no word-splitting (use arrays); `$VAR:r…` is a modifier, so write `${VAR}:refs/…`; `path` is tied to `PATH`, so never `read … path`.
- `git fetch --prune` does NOT overwrite existing local tags; use `git fetch origin '+refs/tags/*:refs/tags/*'`.
- A green number is not visual acceptance. The static runner needs its fit and output under `audits/`.
- Codex reservations: when Codex posts "native/performance reservation active", run no native, gate or heavy CPU until its terminal notice.

## Current Codex sprint handoff — 2026-10-02, C132 development RESUMED

Dakk resumed the full program in `audits/MAILBOX/C132_ART_PROGRAM_20261001.md`. Read Claude's absolute read-only
mailbox at `~/Projects/celestial-frontier-anthropic-mac/audits/MAILBOX/TO_CODEX.md` at run start and batch end;
write only this lane's `audits/MAILBOX/TO_CLAUDE.md`. Signed G merges `4cad826c9`, `062d85b2a` and `31f088a4d` include Claude
through `02a94595c`, including live-world routing, all ten painted themes and D29. His handoff above is preserved.

**Program and ownership:** 43 biome-family FAR/MID/NEAR sets; ten remaining painted ability-theme sequences;
anatomical full-stage attacks; Centipede C12 and all-pair 60 fps at 4× CPU; continuing 24-original batches and
reference/template gaps; ~1 GB finisher Mac comparison and text-encoder-free iPhone preparation; recorded C3 cues.
Claude scores, repairs islands, runs accepted finishes/finished-rig films, updates coverage and wires accepted deliveries.
Latest C136 coverage is 181/631 accepted, 19 held. Dakk's final visual pass and physical-phone gates remain open.

**Delivered and measured:**
- `C132_ARENAS_20261001`: D29 admits native 1672×941 alongside native 2560×1440. Twelve new triplets and all eight
  earlier candidates now pass both exact master/runtime checks: 20 sets, 60 selected separate paintings, 402 source/input
  hashes. `d29-delivery-batch-01.json` binds the manifests and concrete visual holds. No set is accepted or registered;
  all refused predecessors and prior reports remain. `d29-delivery-batch-02.json` adds 16 more triplets, 48 selected paintings and 320 checked input hashes (36 candidates total). `d29-delivery-batch-03.json` adds Carbon, Sulfurdeck, Obsidian and Abyssgreen (40 total). `d29-delivery-batch-04.json` adds Banded, Ammonia and Magma Sea (43 total). Glass v3 completes the native canvas gap in one separate reference-based generation. `complete-candidate-inventory.json` now binds 44 candidate triplets / 132 paintings across all 43 canonical families, with 88 mechanical PASS, 44 correct acceptance refusals and 879 checked input hashes; zero new visual acceptances or registrations. A nine-layer exact-RGBA encoding study saves 36.53% with lossless WebP but does not establish compliance with the unchanged pack cap.
- `C132_EFFECTS_20261001`: ten themes / 30 phase assets pass delivery controls and full-script native films at 4× CPU
  on signed `b80e4b156`: zero rig refusals, CPU p95 6.2–6.4 ms. All 30 phases are visible in actual-film review.
  Ground-level placement despite a jaw attack and four low-contrast phases remain concrete holds; Claude's separate
  full-size admission and registry wiring in `9f9032526` is merged.
- `G2_C132_QUADRUPEDS_20261001`: 24 immutable originals scored by Claude; Iguana and repaired Horned Lizard accepted.
  `C136_SPRAWLER_REFERENCES_20261002`: Monitor Lizard, Iguana and Newt manual references remain UNMEASURED;
  24 exact-original reviewed external-pinna absence declarations are ready for C136 re-scoring.
- `C136_COMPILER_PRESENCE_20261002`: production reviewed-presence adapter admits only the separate hash-bound ear schema;
  four additional painting-template families cover 32 canonical names. Prior compiler outcomes and five old layouts remain
  covered; 101 focused tests and root validation pass. This is authoring support, not runtime rig or visual admission.
- `C132_C12_REPAIR_20261002`: reproduced the exact 543.7 ms Centipede fold stall, then a bounded correction candidate
  completed the same full native film at 4× CPU on signed `615e755c8`: 789 live frames, zero refusals, CPU p95 9.0 ms.
  Five frames still exceed 16.667 ms (maximum 23.5); all 18 stills equal baseline, including an existing Chimpanzee victory
  deformation. Source promotion passes 34 leaf controls. The corrected 9-test library owner now proves 38 archetypes / 114 scale cases with 342 explicit anatomical attacks and returns, zero refusals, and no swallowed declaration failures (`C132_LIBRARY_SCALE_ATTACK_20261002`); strict all-pair performance and visual acceptance are not claimed.
- `C132_PHONE_FINISH_20261001`: 639 MB image-model candidate compared against the same five C121 subjects on signed
  `779912d5f`; 5/5 conservation PASS, zero protected-pixel changes, 4.683 s total. All five outputs are visually REJECTED.
  Separate phone probe binds a 728 MB transport payload and precomputed embedding, with no text-encoder/tokenizer routes;
  three HTTP/route controls pass. No physical device run, resident/GPU-memory qualification or product admission.
- `C132_SOUND_20261001`: 49 recorded-file cue candidates, including 11 separately layered impacts. Technical checks pass;
  listening, loudness/mass extremes, battle timing and runtime admission remain open.

**Authoring handoffs:** `C132_FAINT_GROUND_20261002` confirms the C136 Alligator frame holds final FAINT with zero
underlying idle. A continuous head/neck candidate clears ground in 5,070 publications; a detached spine-owned fragment
and layered tail clipping still hold the whole creature. Five controls and actual-rig byte parity pass; no runtime change.
The next 24-original batch `G2_C136_REPAIRS_20261002` has 23 framing PASS and one refused. Three standing-bird/insect
manual references plus an incomplete Water Strider draft are in `C136_BIRD_INSECT_REFERENCES_20261002`; all 79 authored
owners contain paint, with anatomy/contact holds retained. `G2_C136_TARGETED_EDITS_20261002` adds four separate successors
for Giant Salamander, Giraffe, Buffalo and Bee, all framing PASS, original source paintings unchanged.

**Gates and next steps:** C162's fresh I5 3+1 epoch on signed `06e0b0f60` PASSED all four collectors and all four raw verifiers, unchanged limits, zero retries; C163 released the reservation. `C132_I5_EPOCH_20261002` retains the exact evidence and the active selector now binds its nine required inputs. Independent replay and 21 certificate admission/refusal controls pass. The temporary managed checkout was archived, not retained. The first full develop profile then stopped at one stale draft-release copy hash (5,811 passed); the explicit ordered 120-bullet hash is refreshed, with all 29 Guide-copy controls passing. The corrected full develop profile on signed `8d69e67bf` is GREEN: 5,812 passed, 2 expected fail, 3 skipped, then all three TypeScript programs, artaudit, overridecheck and speccheck; the old red log is retained. Optional AI dependencies were restored. Separate overridecontrol and all 81 Actions policy controls also pass. No I5 re-bind or product change accompanies the copy-oracle correction. Final strengthened scale-owner closure is GREEN on signed `f85c1ce94`: the full develop profile again passes all 5,812 tests and every static owner, with optional AI dependencies restored. The intervening test-only container typing stop is retained and fixed without changing behavior, assertions or thresholds. See `C132_LIBRARY_SCALE_ATTACK_20261002/typed-final-develop-profile.json`.

C159 released the preceding Centipede SIMD epoch. Exact promotion has 17 leaf controls, nine library controls and root validation passing; its one 4× film has 789 live frames, zero refusals, CPU p95 8.7 ms, three slow frames (maximum 23.3 ms), and 18 stills equal the prior corrected film. Strict all-pair performance and visual acceptance remain open. C160/C161 delivered that promotion and the first 20-set D29 arena batch. C164 records the pack limit: those candidate runtime plates plus the current pack exceed the unchanged 128 MiB limit by at least 65,952,503 bytes. Claude owns registration and needs a delivery/encoding plan before admitting all sets. The complete 44-set candidate inventory now totals 280,356,509 runtime bytes; with the measured current pack, its 348,681,876-byte lower bound exceeds the same cap by 214,464,148 bytes. All biome candidate paintings are delivered; visual, delivery-budget and native admission remain open.

Post the exact reservation before every native/performance epoch and release it afterward; no concurrent heavy work. Browser commands require outside-sandbox execution. Score/calibrate home resolution and exact service-worker `__local_ai/` exclusion are included in the measured product, with focused controls in `C132_I5_PREP_20261002`. New v2 evidence aliases home paths without changing samples or old evidence. For develop, rename `tools/local-image-generation/node_modules` aside and always restore it afterward.

**Operations:** OpenAI/Codex, macOS, `~/Projects/celestial-frontier-openai-mac`, `openai/mac` only. Signed G commits,
hooks/pre-push guard retained, no new branches. Startup receipt reused from `C132_PROGRAM_20261001`. Documented cleanup
is approximately 101 GB: roughly 57 GB worktrees, 43 GB verification copies, and 1.23 GB measured own scratch recovery.
This is not an exact summed APFS delta; attributing prior usage to unrelated activity was unsupported. After temporary I5 checkout retirement, approximately
165.9 GB / 154.5 GiB is free; identity backups remain preserved. The temporary checkout removal is not added to the earlier cleanup total. Budget UNFROZEN; normal own-branch push requires green local battery and current
visibility/workflow checks. Normal own-branch push through signed `7203ca5af` succeeded with the guard enabled. The final delivery is the green signed `f85c1ce94` source plus this documentation/evidence closure; synchronize only `openai/mac` normally, with the guard enabled. No PR, label, hosted attempt, develop/main merge, release or deploy.
Next Codex work: remaining generated creature/fit coverage, authoring-side island/tail defects, anatomical surface anchors and strict all-pair 4× performance (three slow C12 frames remain). Claude scores the 44 arena candidates and creature deliveries, resolves visual/medium holds and plans delivery within the fixed cap. Physical-phone qualification and Dakk's visual acceptance remain open. Signed mailbox handoffs require no Dakk relay or app switch.
