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

## Current Codex sprint handoff — 2026-10-02, C173 ACTIVE

Dakk authorizes the C132 sprint on `openai/mac`, macOS, with disjoint parallel agents and large signed batches. Claude's handoff above is preserved. Latest sibling C180 is merged as a signed mailbox-only change in `60a71c4e6`; source results through C179 were merged in `a7dc3342e`. Coverage is204/631: Crow plus five C197 fish repaints accepted, AI-finished and filmed. All43 biome families retain45 accepted WebP arena sets; all11 effects remain wired. No PR/label/hosted/develop/main/release/deploy.

**Product and I5 complete:** C201 shared canonical held-faint repair fixes all four reported spikes (Hawk/Crow/Snowy Owl/Capuchin), verified by Claude's unchanged-fit full native frames. Existing belly/neck/shoulder seams remain held except Crow accepted. Product changes are signed in `48507653f`;55 targeted checks, full typecheck,1,984 publications/zero refusals and80 rig byte comparisons pass. No skin, source binding or limit changed. Fresh combined I5 on signed product `a7dc3342e9783f7fcb47d73d51e62b08deb910cf` passed three calibrations, one certification and four raw verifiers in272.93s with zero retries. The new selector and raw evidence are signed in `e92e40047`; independently replays after temporary-checkout archival. Old20e80c912 proof remains historical. **Do not repeat or re-bind I5.**

**Native/gate blocker, C210/C212:** C205 is TERMINAL/RELEASED. Develop on `e92e40047` exited143 after Vite build/Vitest startup with no test verdict; optional local-AI runtime restored, aside absent. Automatic approval review rejected a prepared replacement under AGENTS.md's nonzero/no-retry rule. Explicit Dakk approval was requested and is still pending; elapsed time is not authorization. No replacement gate, matrix run or push occurred. C180 discloses Claude's overlapping gate and broad process kills; `c180-disclosure.json` records this credible external interruption separately from the original evidence. Exact sender is not observed. I5 predates that gate window. No broad cross-lane process kills; use owned processes and shared lock.

**Performance prepared, not run:** `audits/C173_ALL_PAIRS_20261002/prepared-a7dc3342/manifest.json`, SHA `a4c0694d4eb6a492c5382228e68bd3d339906cb9a476491f2f127f74efee39a7`, binds38fits/1,444ordered pairs/1,321sources.40synthetic controls and12 current boundary controls pass. Same1000/60ms CPU limit at4xCPU; complete valid CPU-only reds are retained and collection continues, every slow sample reported. Instrument/source/anatomy/transport/resource failure stops; no retries,60GiB free-space floor. CPU PASS alone is not display/phone60fps qualification. After explicit recovery authorization: read sibling terminal state, post fresh reservation, verify source hashes, run one replacement develop with optional AI folder set aside/restored, then the full prepared sweep only if green. No approval workaround.

**Source deliveries, all explicit holds preserved:** C19624 originals (17quadrupeds/seven first primates); C197nine selected repaint successors plus C200pattern observations; six separate framing successors; eight specialized originals; C204exact-source Chameleon/Marine Iguana pinna reviews. C202 independently authored Caiman/Giraffe/Earthworm/Sponge technical references pass58action rows/four presentations/conservation/D28, awaiting Claude; Monkey/Snail/Mussel remain held. C207standing Bat correction removes false multi-clawed front paws but hidden folded-wing chains still block a complete fit. C209equid re-authoring passes57static rows/three presentations yet retains11.5%/7.7%/8.3% island refusals and visible defects. Spider passes static/conservation but retains9.1% island; Brittle Star observed proportions fail unchanged guard; Shrimp/Fiddler chains remain occluded. Do not invent anatomy or spend native runs on known rejected references.

**Latest delivery C211:** `audits/C206_BIRD_SOURCE_REPAINTS_20261002/delivery.json`, SHA `02db7e2d84b4d3c662322350d2253beda96a931f7710ec8192bf6f7c69cd141b`, freezes24targeted bird source repaints,255files/32,569,864bytes. All exact native1254-square generator bytes, canonical compiler/ART_KIT/Atlas/prompt proofs and pattern receipts verified;23framingPASS/GodwitREFUSE. Full-size observations retain Grebe feet/Screamer horn and other anatomy holds. These are replacement candidates, not new accepted coverage. Claude scores/finishes/films admissible packets and updates gallery/coverage. Remaining class gaps and held sources still need genuine visible anatomy; no family is claimed complete.

**Sound C198:** All49C141 recorded cues measured by actual loudness owner;32pass/17quietness refusals and seven identical PCM groups. Exact audition page and runtime admission plan delivered. Headphone/phone listening was not performed; no runtime recordings admitted.

**Disk and continuation:** Temporary c173-i5 checkout is archived, source absent, retained certificate verifies. Observed free-space increase across retirement21.76GiB; free142.29GiB then. Final batch observation 142.29 GiB. Reuse uninterrupted session's C163_SPRAWLER startup receipt. Read sibling mailbox at every batch boundary and write only this lane's TO_CLAUDE. Claude may continue independent source scoring while native recovery is blocked. Codex next action depends on explicit gate-recovery approval; normal own-branch push only after the required full green battery and intact pre-push guard. No Dakk relay or app switch needed.
