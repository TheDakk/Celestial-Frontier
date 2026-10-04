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
- **STATE 2026-10-04 (read this first in a new session):** coverage **270/631 (42.8 %)**, only Snow Petrel held
  (`audits/GENERATED_GALLERY_20260927/coverage.json`). Both lanes pushed and develop-green (6,005); I5 re-certified on Codex's
  456ac7c52. Decisions D28 (island cap 0.5), D29 (arena 1672x941), D30 (WebP arenas, all 45 accepted), D31 (cast attack for
  limbless/sessile — merged) are in `audits/MAILBOX/DECISIONS.md`. **Pending:** Dakk authorized ONE combined I5 3+1 + ONE develop
  gate on Codex's `f8ff0413e` (mailbox C204) — Codex runs it; hold native/heavy CPU until its TERMINAL row. **Next for Claude:**
  score Codex's C274–C281 deliveries (48 identities) and re-score Supply B cephalopods with the qualified Octopus reference;
  per batch: `score-batch.mjs <batch> <tag> --fish-seams --extra-refs=audits/G1_AUTO_AUTHOR_20260926/pilots/reference-pool-extras-c223.json`
  → full-frame + zoomed late-idle review → island repair (`audits/BIRD_ISLANDS_C121_20261001/run.mjs` pattern) → registry/coverage
  → AI finish (`audits/AI_FINISH_C121_20261001/{finish-batch,rebind-batch,native}.mjs`) → mailbox row → push. **Laws learned:**
  post "Claude native window ACTIVE/TERMINAL" rows around native work; a Codex reservation ends only at its TERMINAL row; never
  `pkill` by name; scrub `/Users/<name>` to `~` and check `mode 120000` symlinks before every commit; review fliers on FULL
  frames (the crop sheet shows only the ground band); after a TaskStop of a native run remove this worktree's stale workspace lock;
  zsh does not word-split `$x` (use explicit args). The all-pairs sweep stays on HOLD until Dakk says otherwise.
- **SESSION 8 (2026-10-04, in progress):** static scoring done, Node only (`adc3e4cd7`): **g2c274 7/23** (Wild Pig, Cow, Hyrax, Cardinal,
  Sparrow, Pigeon, Cardinalfish; Bowfin held at framing REFUSE), **g2c275 10/24** (Capybara, Grizzly, Toucan, Falcon, Duck, Stork,
  Arapaima-f02, Angelfish, Tuna, Swordfish-f02), **g2c257ceph 0/4** (Octopus is leave-one-species-out of its own reference; Giant Octopus
  extra rear appendage 13.2 %, Cuttlefish arm2 19 %, Squid wrong-family). Static RED, which are motion limits and not mine to touch: Black Bear and Okapi
  (gallop scale compression), Kookaburra (folded triangles), Wahoo intake (caudal/body bound). Systemic: 7 short-tailed ungulates/bears
  refuse on `tail3` against long-tailed refs, so a short-tail reference is needed. **Next:** after Codex's C204 TERMINAL row, re-run the same three
  `score-batch.mjs … --pilot=<file> --extra-refs=…c223-octopus.json --fish-seams` commands WITHOUT `--no-native` (intake/static are
  cached), then review, island repair, finish, gate and push. Pilots: `pilots/c274-scoring.json`, Codex's `C203_CREATURE_SUPPLY_B_20261004/pilot-selected.json`.
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

## Current Codex sprint handoff — 2026-10-04, C281 terminal

**No active reservation: C272 and C279 TERMINAL—RELEASED.** All source agents, CPU and browser work finished. All-pairs remains HOLD, zero runs.

**Completed authorized chain:** Dakk/C203 authorized exactly one I5(3+1)+develop on456ac7c52. Four phases/named verifiers, selection/replay allPASS. Selection08dd81237(G); develop6,005PASS/2expected fail/3skipped/0red. Terminale2e9bb10c(G) and source-onlyd8755d36d(G) are pushed normally onopenai/mac with guard intact. Optional local-AI node_modules was set aside and restored. No retry, limit change or re-bind; instrument link relative. Evidence `audits/C203_I5_EPOCH_20261004`. Archived temporary checkout recovered25.27GiB; final free122.45GiB.

**New LOCAL product awaiting fresh gate authority:** dfb009650(G), signed mailbox-only --no-ff mergef50abbd59(G). Low-slack painted trot uses fixed0.25 torso/root excursion below existing3% anatomical slack, preserving full idle/limbs/timing/limits. Observed-socket insects retract toward their sockets with two hit/tame steps. An earlier runtime lattice search was rejected for4.7s setup; final profile measured0.2–1.3ms in Node.147 motion tests,49 insect tests,3TypeScript projects/root validatePASS. Exact source manifest and all907 native inputs verified. Evidence `audits/C203_PRODUCT_CANDIDATE_20261004`. **No I5/develop has run on this product.** Dakk must authorize ONE new combined3+1+develop on this frozen product before certification/push. Never re-bind or automatically retry.

**Red Fox delivery:** `audits/C203_NATIVE_HOLDS_20261004/fox-islands-02/fit` closes observed nape/root-patch openings; static13actions/presentation and35 actual-rig software samplesPASS. Native onf50abbd59:933live/937encoded frames,4turns,15.53s,zero refusals/skips/capture failures. Film/review `audits/C203_FOX_NATIVE_20261004`. Full-size/native reviewed poses retain continuity; Claude owns AI finish/re-film/gallery after certification. **Snow Petrel remains visualRED:** old-source proximal-wing tear; folded-source tail/wing distortion. Preserve every predecessor and its refusal.

**C274+C275 supply:**48 new identities, two24-original batches (`audits/C203_CREATURE_SUPPLY_20261004` and `audits/C203_CREATURE_SUPPLY_B_20261004`). A23framingPASS/BowfinREFUSE; B24selectedPASS with4failed originals retained and corrected successors.48 provenance/negative controls total; all sources full-size reviewed with anatomy/style holds. Claude scores exact selected sources with qualified pools; no admission count claimed. Coverage remains270 until Claude updates it.

**C276–C277 references terminal HELD:** primate Gorilla/Howler static/hand-contact prototype passes, but observed underlap gaps remain; one Gorilla source edit still conceals arm root. Insect Beetle static13/13 but elytral/fringe tears; Grasshopper successors9/13 and visualRED. Myriapod source/count/joint-budget blockers remain. Qualified pools empty; use `delivery-v2.json` in `audits/C203_PRIMATE_REFERENCES_20261004` and `audits/C203_ARTHROPOD_REFERENCES_20261004`. Do not use diagnostic fits as qualified references. Octopus qualified pool remains `audits/C202_CEPHALOPOD_REFERENCES_20261004/qualified-reference-pool.json`; retain other pool entries when adding it. Prior Tortoise/Albatross repairs are in the now-certified456ac7c52 product.

**Next steps:** Claude reads C274–C281, scores eligible originals and retains all named holds. Codex requests one fresh combined I5+develop on the local candidate; only after authorization post a new reservation, run unchanged limits/first-red stop, select/replay, restore optionalAI, post terminal and normally push own branch ifgreen. No Dakk relay/app switch needed. No PR, label, hosted run, develop/main merge, release or deploy. Read sibling mailbox at batch end and before native; latest remainsC203. Never commit absolute symlinks or owner identity; use Dakk/TheDakk and ~/ paths.
