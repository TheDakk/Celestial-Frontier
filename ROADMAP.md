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
- **Later 2026-10-02:** combined I5 re-certified on the 45-WebP-arena + sprawler product (`i5-v2-20e80c9127b1`); develop gate
  GREEN (5,975 PASS, 0 red); anthropic/mac pushed. Coverage **196/631**: the 10 sprawler reptiles (Codex's C173 motion profile),
  Mara, Lark + Hummingbird (C181 head contours), Bat (C190 spread reference; first membrane flier) — all AI-finished + filmed.
  Held: Hawk/Crow/Snowy Owl + Capuchin (a pointed nape/shoulder spike in the head-down late idle — a cross-family motion class,
  Codex diagnosing, C172), Wild Pony (fleck), Gorilla. New families need more references (C168). **Review trap:** the crop sheet
  `native-g2c54/crops.mjs` shows only the ground band — review aerial fighters on full frames. Dakk's queue: three arena repaints
  (marsh-r3, dunesea-r2, freshwater-lake-v3 — registration is a product change for the next I5 batch), guardian choreography
  default, D28, preview redeploy, PR #44.
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

## Current Codex sprint handoff — 2026-10-04, C202 references ACTIVE

**C266 delivery:** Tortoise observed ankle/paw boundary corrected; exact retained4-fold context now passes and native841frames has zero refusals. Selected fit: `audits/C202_NATIVE_HOLDS_20261004/tortoise-ankle-boundary-01/fit02`; Claude finish/admission remains.

**C265 delivery:**24 new native1254 uncovered-quadruped originals at `audits/C202_CREATURE_SUPPLY_20261004`;24 framing passes/14 provenance controls. Named source holds remain. Reference qualification and exact remaining native failures continue under C264. Product/certificate unchanged;123.98GiB free.

**C264 reservation ACTIVE.** C202 signed handoff merged at387b366d0; coverage270. Current work prioritizes qualified primate/cephalopod/insect/myriapod references, exact remaining Tortoise/Red Fox/Albatross/Petrel source repairs, and24 originals aimed at qualified classes. Three disjoint agents prepare source/static evidence; root owns serial native qualification. The previous C201 handoff below is historical pending this batch’s final archive. Only explicit C264 TERMINAL releases the window.

### Prior completed C201 handoff

**Development ACTIVE; C251 reservation TERMINAL — RELEASED at C261.** All three parallel source queues and CPU jobs are terminal. Signed anthropic/mac C198 merged --no-ff at b3335e613; latest sibling mailbox is C201 after startup and read-only review. Preserve Claude’s handoff above. Coverage remains251/631; no new admissions claimed. Detailed current receipts: `audits/C198_PROGRAM_20261003` and TO_CLAUDE C252–C261.

**I5 PASS; replacement develop GREEN6,000.** Claude C199 records Dakk’s replacement authorization; C200 records6,000 PASS/zero red/two expected failures/three skipped on merge39811d3ee, whose complete tree is identical to our66c146409. Signed Claude descendants through6976a955b merged --no-ff at327c5b407; later differences are audit/mailbox only. All nine selected C198 I5 files remain exact. No additional gate/epoch/re-bind is needed or run. Product869ce0e44 and selected proof5e485e206 remain authoritative; coverage-map correction ea8f87a99 preserves53 pending identities and built product bytes.

**Claude C201 native window ACTIVE.** Claude films Prawn strikes, Tortoise fit02, prior-source Capuchin D28 and Tiger Shark source joins, then scores all72 A/B/C originals. Codex runs no native, gate or heavy CPU work during that window. Three disjoint read-only reviews confirmed the completed deliveries and held statuses; no duplicate generation or admission claim. Normal guarded own-lane push completed through e834910f0, recorded in C263 and push.json; the final receipt commit follows on the same unchanged product. Current evidence: `audits/C201_SYNC_20261003`. Final free space127.41GiB; no cleanup or new worktree this synchronization.

**Deliveries:**
- C252/C255 Prawn physical observed foreleg-tip strike (not D31 cast),35 original focus tests plus18 correction checks;200 prior family timelines/11 non-melee Prawn timelines byte-identical. Source pink swimmeret fringe remains held. Current additive repair proof is `audits/C198_PRAWN_ATTACK_20261003/pending-map-correction`.
- C254 Tortoise source packet: C250 actually retained7 rig refusals, five captured walk contexts reproduced. Final02-both-far-leg-fringes/fit01 clears all five through exactly433 prior-root pixels, source paint/landmarks/materials unchanged.19 static actions/2,299 samples +1,492 presentation and10 exact-context actual-rig rasters PASS. Two earlier refusals remain unlocated. Hanging shin strips/gaps stay HELD_VISUAL; no native grounding/admission claim.
- C256–C258 supply A/B/C:72 distinct unchanged native1254-square originals, exactly24 each, one built-in generation per source on unchanged canonical pipeline.64 framing PASS/eight REFUSE; six required pattern PASS/66 not required;46 evidence controls PASS. All72 full-size inspected, source-specific roots/limbs/contacts/proportions held explicitly. No source count is an admission count.
- C259 references: independently authored new Gorilla/Capuchin diagnostics retain real static/contact/fold reds; no pool admission. Squid/Cuttlefish arm roots and insect six-complete-chain visibility remain source-blocked. Partial Grasshopper/Dobsonfly inventories never equate visible feet to full chains.
- C260 holds: Tiger Shark source joins close the reviewed pectoral opening with intact tail notch; prior-source Capuchin D28 removes the detached hindleg strip. Both exact selected fits in queue-status.final.json are held scoring candidates. Petrel join is VISUAL_REJECT (crushed head/eye despite green mechanics). Capybara true tail-absence correction still RED. Rhea/Prawn/Shrimp/C239/C248 exact holds remain; C190-accepted Hawk/Owl preserved.

**Verification/operations:** parent rehashed1,630 manifest entries/289,304,505 bytes, independently checked72 original hashes and full-size review subsets. Root validate/golden50 PASS. All20 commits through e18a0bd76 have G signatures. Unchanged pre-push guard passes read-only local rehearsal;25 tracked symlinks have relative targets only. Isolated I5 checkout archived after jobs ended: observed24.90GiB recovery,128.94GiB free at final source check. Optional local-AI runtime restored. New records use Dakk/TheDakk and~/ paths.

**Next:** Claude continues its C201 sequential filming/scoring, preserving all visual/static/anatomy holds and posts its terminal result. Codex reads that mailbox before any further native/heavy work; current source queues are terminal and all72 originals await Claude’s admission. The normal guarded openai/mac push is complete; its signed receipt and the current coordination are in C262–C263. **All-pairs remains HOLD**, zero runs. No PR, label, hosted run, develop/main merge, release or deploy. Dakk need not relay files or open the other app.
