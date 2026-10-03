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

## Current Codex sprint handoff — 2026-10-02, C186 delivery

Dakk's C132 development sprint is ACTIVE on **openai/mac**, macOS, `~/Projects/celestial-frontier-openai-mac`. Signed G commits only; pre-push guard intact; never --no-verify. Owner Dakk/TheDakk and ~/ home paths in new records. Claude's handoff above is preserved. Read the sibling's absolute read-only mailbox at start and batch end; write only own TO_CLAUDE. Latest read C186 explicitly says **do NOT run the all-pair sweep until Dakk authorizes it**. Signed sibling through2879eed4a merged --no-ff in5743b2670, then its signed bivalve mapping f62d359bf in651c95864. No retired Windows lane, develop/main merge, PR, label, hosted run, release or deploy.

**Certified product unchanged.** Fresh I5 remains on0727fe9cd16255a7980911b21dbd2468aaaf7d5b; selector f4a751eea. Three calibrations +one certification +four raw verifiers PASS; replacement develop 5,987 PASS, two expected failures, three skipped, zero reds. OptionalAI node_modules was set aside and restored. This C186 batch is audit-only; no I5/develop rerun or certificate re-bind. Root validate again PASS, including all50 golden deterministic probes. All measured product/tool bytes still match the green selector. Any future product change needs the next combined I5 epoch.

**C228 reservation ends only at its explicit TERMINAL row C234.** No native epoch or sweep ran during this batch. The reservation isolated offline authoring; all subqueues are CPU terminal. Claude may start scoring only after reading C234. No Dakk relay or app switch is needed.

**Current delivered candidates (TO_CLAUDE C229–C233):**
- Specialized: `audits/C186_SPECIALIZED_REFERENCES_20261002/delivery.json`. Six selected fits: direct existing Earthworm/Sponge authoring avoids erroneous automatic reinterpretation; Spider owns both real pedipalps; new Banana Slug supplies a second gastropod subject with observed mouth/four tentacles; Crab supplies a second brachyuran subject with all four walking pairs and corrected real claw hinges; naturally short-armed Brittle Star stays below the existing8x ratio.67 actions/8,107 samples plus4,766 presentation samples, exact conservation/cap controls pass. Full-size runtime-parity software review retains moving edge, seam and style holds. Prawn remains ambiguous and unfit; no invented hidden legs. Existing Leech/Sea Squirt remain the second annelid/filter subjects. Exact bivalve category **plated**, slick only on visible soft tissue; Claude's runner mapping is now merged.
- Ungulates: `audits/C186_SOURCE_HOLD_REPAIRS_20261002/delivery.json`. Eight selected successors: Zebra/Kudu/Gazelle/Oryx/Gaur/Deer/Antelope/Sheep.19 actions each,18,392 total samples plus presentation, exact source paint and unchanged5% D28 placement PASS. Real pinnae replace horn/mane/forehead transfers, short tails stay short; Gaur's source-observed far-leg root resolves the retained11-fold faint. Zebra uses explicitly retained fallback-1, not an invented equivalence to its original recipe. These mixed-origin corrections are not independent whole-family references. Takin far ear, Dromedary compression, Impala far ear, Caribou/Yak/Bactrian broader ownership remain held. Older equid/reptile/primate/bat source holds continue.
- Bittern: `audits/C186_BITTERN_REPAIR_20261002/delivery-v2.json`, selected **fit02**. Three far-leg landmarks and three polygons now follow actual painted knee/ankle/toes. Original exact fractional walk instant still refuses3 triangles; all614 candidate retained-context samples pass.14 static actions/1,694 samples,7 actual loaded-rig parity publications,7,684 samples over five fresh turns and seven source/mutation controls PASS. Full-size independent review confirms repaired far leg; inherited wing/neck openings remain held. Claude must re-film this exact painter fit and re-finish its changed ownership; old AI atlas cannot be rebound. Initial review-only inventory race was caught, preserved and superseded additively.
- Snow Petrel: `audits/C186_PETREL_AUTHORING_20261002/delivery-v2.json` is **HELD_VISUAL**, not a refilm nomination. Near-wing correction passes static but worsens a visible shoulder opening; retained before/after proves the refusal. Far-wing transferred owners are dorsal paint; the current hidden-wing declaration is unsupported. Require truthful visible source or a reviewed future product change, not deletion/invented anatomy. Other Hawk/Owl/Capuchin/Tiger Shark/equid/reptile/primate/bat holds remain unchanged.
- Supply: `audits/C186_CREATURE_SUPPLY_20261002/delivery.json`:24 exact native1254-square originals,11 new identities +13 targeted repairs.20 unchanged canonical routes +four disclosed audit-only layouts;23 compiler controls PASS.21 framing PASS,3 held (Prawn/Snapping Turtle/Softshell Turtle);7 pattern PASS,17 NOT_REQUIRED. Every source reviewed full size with explicit anatomy/style holds. These are candidates, not24 admissions. Prior approved coverage remains **218/631** until Claude reviews and updates it.

**Sweep remains prepared, not authorized.** The earlier matrix stopped at its first Crab pair on an instrument semantic-time mismatch; zero pairs qualified. Failed native evidence and original instrument remain immutable. Additive `audits/C183_ALL_PAIRS_20261002/instrument-v2` exact-beat successor passed arithmetic, loaded-Crab stage and source controls. `prepared-65af716c/manifest.json` SHA c925ac15bd9a2ca25a635f6221f0ca9d611466d63d39fe61944a29235efd6d6f binds38fits/1,444pairs/1,329 unchanged sources. Do not launch, reset the old wrapper or overwrite failed output. Native authorization and a fresh reservation must precede any future attempt; no raised allowances.

**Next lane steps:** Claude merges the signed delivery, scores/films exact selected candidates after C234, independently reviews full-size motion, finishes only eligible source fits, then updates gallery/coverage and mailbox. Codex continues the explicit anatomy/source holds and further24-original supply using the frozen packet dispositions, preserving every negative. All43 biome families/45WebP arenas and11 themes remain wired. Product changes stay batched for the next combined I5. Use the unchanged optional-runtime-aside develop procedure. Keep all work in own lane; no GitHub write or new sweep authority inferred.

**Disk and toolchain:** uninterrupted session reuses C163 startup receipt, Node26.10.0; no updates during certification. Prior completed I5 checkout archival observed23.27GiB free-space recovery, not exclusive allocation attribution. No retained support backups deleted this batch. Current measured free space and batch-end checks are recorded in `audits/C186_PROGRAM_20261002/terminal.json`. Shared reservation/terminal protocol remains mandatory; never broad-kill another process. This handoff supersedes the C183 block archived verbatim below the archive's newest-first history.
