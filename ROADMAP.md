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

## Current Codex sprint handoff — 2026-10-03, C196 urgent repair

**Development ACTIVE.** C193–C196 read at run start. Claude C195 confirms the authorized replacement develop gate GREEN: 5,995 PASS, two expected failures, three skipped, zero red. D31 is accepted; Earthworm, Sponge and Banana Slug bring coverage to 240/631. No replacement gate or I5 epoch is needed for the C196 portability repair: runtime product tree and all nine selected evidence hashes are unchanged; read-only activation replay PASS on certified source `a0414aa65`.

**C196 history repair:** eight unpushed commits were rewritten with G signatures, replacing only the active epoch shared symlink with `../../../../port/v2`. Rewritten delivery head `22518a460`; remote base `de255a6de` remains an ancestor. Exact mapping in `audits/C196_HISTORY_REPAIR_20261003/rewrite.json`; older mailbox/audit references retain historical pre-C196 IDs. Three dangling absolute links inherited from the published base are removed at the repair tip; all historical regular evidence files stay unchanged, with no historical replay claim. Other lane refs remain untouched. Normal openai/mac push is explicitly authorized; no force operation, guard bypass, hosted action or other branch push.

**Push complete:** normal guarded openai/mac push verified at `c85de35e1`; confirmation is C246. Claude rebuilds its unpushed suffix on the rewritten head before pushing its lane; do not merge the old anthropic/mac suffix back in. **C246 offline source reservation ACTIVE** until explicit terminal: supply and turtle queues continue, no native epoch/sweep. C247 delivers the frozen specialized reference packet: Prawn fleck correction, new manual Leech, held Shrimp/Mussel successors and unchanged accepted Earthworm direct fit. One new Leech-to-Earthworm transfer still refuses; no classifier change or admission claim. See the delivery manifest for341 verified files and5,203 static samples. Dakk need not switch apps or relay files.

**C248 supply delivered:**24 targeted source repaints (12 quadrupeds,11 insects,one Leech), exact native1254-square masters. Whole-original framing21 pass/3 explicit refusals; patterns5 pass/19 not required;14 compiler controls pass.273 files independently verified. Useful source corrections and remaining anatomical visibility holds are separate; no native or coverage acceptance.

### Retained C192 delivery details (historical gate status superseded above)

Dakk's C132 program is ACTIVE on **openai/mac**, macOS, `~/Projects/celestial-frontier-openai-mac`. Signed G commits only; pre-push identity guard unchanged; never --no-verify. Use Dakk/TheDakk and ~/ paths in new records. Claude's handoff above is preserved. Read the sibling's absolute read-only mailbox at start and batch end; write only own TO_CLAUDE. C187–C192 and D28–D31 were read. Signed anthropic/mac through 050db3900 merged --no-ff in 876776c64; reviewed D31 through 8041d168f merged --no-ff in e10a4b750. No retired Windows lane or hosted action.

**I5 PASS; full develop remains RED pending one authorized replacement.** Signed combined product **a0414aa6511d1ee9a9d55a4721f1f622c7fdb7dd** includes Claude's D31 body cast, native proof cast-label reporting and one v2 draft-release bullet. Eight D31 tests, TypeScript, real-label positive/negative controls and native proof bundle checks PASS. Retained fingerprint inventory has 361 keys (not the handoff's 362), with exactly seven intended cast changes. One fresh I5 3+1 epoch and all four independent verifiers PASS in 273.79 seconds, zero retries; selected in 810d5689e with replay ok. No certificate re-bind. The isolated checkout was archived after verification.

Develop on 810d5689e stopped with **5,991 PASS, four FAIL, two expected failures, three skipped**. All four failures came from the newly added D31 bulletin row missing from exact release-oracle inventories. OptionalAI node_modules was renamed aside and restored. C235 ended explicitly at mailbox C236. Repair commits 9307b65b4 and **9c3e42fff** preserve exact 121 rows /120 after removal; the original 120 ordered rows reproduce their prior hash exactly, and a same-count missing-D31 mutant refuses. The 72 release tests and changed evidence-chain contract owner PASS; an adjacent immutable-Slice check also passed. Five current producer files still match the I5 certificate. **No full profile retry occurred.** `audits/C192_RELEASE_ORACLE_REPAIR_20261002` retains diagnostics, independent-review correction and an unrun authorization-guarded replacement wrapper. The remaining user-only gate is one replacement develop profile on the signed correction (or an audit-only descendant), with a fresh reservation and optionalAI aside/restored. No additional I5 is claimed needed for this test/oracle-only correction; any new product change needs the next combined epoch.

**Current art state:** D28 default 0.5 is Dakk-approved; full-size acceptance remains required. Coverage is Claude's **237/631**, not increased by these candidate deliveries. D29/D30 accepted 45 WebP arena sets and all 11 themes remain unchanged. D31 was reviewed and merged, not rebuilt; Claude's Earthworm/Sponge/Banana Slug films are retained. Native harness currently loads only Wild painted effects and does not claim a Stone film.

**Signed source deliveries (no automatic acceptance):**

- C239: `audits/C192_CREATURE_SUPPLY_20261002/delivery.json`,24 exact native1254-square originals,20 canonical routes plus four disclosed audit-only layouts.22 whole-original framing PASS; Prawn/Shrimp held.8 pattern PASS,15 NOT_REQUIRED, Spotted Hyena refused for pointed ears.23 compiler and six review controls PASS; parent verified271 entries. The fine Shrimp tips exposed an automatic keyed-mask framing false-green; that result is retained with an explicit original-image refusal. Clam hinge remains a source hold.
- C240: `audits/C192_C233_AUTHORING_HANDOFF_20261002/delivery.json` and independent `C192_C233_MATERIAL_REVIEW_20261002`. Six source/identity-bound material proposals; Sloth furred, five scuted turtle bodies plated. Turtle exposed neck/limb/tail partition stays HELD_PARTITION_PENDING; no claim tags prove shell rigidity. Softshell stays held. No blanket xenarthran/freshwater mapping or runner change.
- C242: `audits/C192_SOURCE_HOLD_REPAIRS_20261002/delivery.json`,five selected static-passing correction fits: Wild Ass, Serval, Horse, Rhea, Snow Petrel.10,285 action,7,292 presentation and103 actual-rig parity samples PASS. Wild Ass forehoof fragment is continuous; exact Horse/Serval historical fold phases pass on corrected real anatomy. All five remain visually held; Rhea/Petrel have strong wing/back tears. Read selected paths and full-size holds in README. One fresh Tiger Shark upper-tail-notch painting is retained without old-mask rebinding. Capuchin remains an unresolved review.1,230 file entries independently verified.
- C243 specialized refs: `audits/C192_SPECIALIZED_REFERENCES_20261002/delivery.json`. Four manual diagnostic fits(Snail/Prawn/Shrimp/Mussel),43 actions/5,203 samples PASS, with conservation and actual-rig publication evidence. Snail's reviewed cast is cleaner; Prawn/Shrimp retain visual fragments/gaps. New provisional Mussel external hinge is anatomically reasoned from inspected specimen text, but cast opens broad shell/mantle gaps: HELD_VISUAL, **not a qualified bivalve film**. D28's measured153 movable Mussel pixels are an unattempted diagnostic, not a solution claimed for broad gaps. Ten new reference paintings plus retained source failures; primate/bat/Earthworm/C233 diagnosis packets name remaining hidden-root, classifier, eye and facing holds. No invented anatomy or native claim.

**Reservation and next actions:** C237 is TERMINAL — RELEASED at mailbox C244. All source agents and CPU work are terminal; `audits/C192_PROGRAM_20261002/terminal.json` records the final state and 2,087 verified delivery entries. Claude can inspect the signed source packets and, once the reservation is released, score/review qualified candidates; green-product integration waits for the replacement develop result. Codex keeps the complete correction ready and performs no unauthorized retry. Dakk need not open the other app or relay files. No PR, label, push, hosted run, develop/main merge, release or deploy occurred.

**All-pairs remains HOLD under C186.** Zero sweep runs this batch. The C183 exact-beat instrument and its 1,444-pair manifest remain immutable; the old prepared source inventory predates D31 and must be refreshed before a future specifically authorized run. No 60-fps or all-pair acceptance claim.

**Checks and disk:** root validate and all 50 golden probes PASS. Uninterrupted startup reuses the C163 toolchain receipt, Node 26.10.0; no updates or dependency installs during certification. Managed I5 checkout retirement observed 23.19GiB free-space recovery (109.56→132.75GiB), not an exclusive allocation measurement; no retained audit evidence was removed. Final free space, signature/guard checks and manifest verification are in the C192 program terminal record. Earlier C186 handoff is archived verbatim, newest-first.
