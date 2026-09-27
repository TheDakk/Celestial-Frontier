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

## CLAUDE SESSION HANDOFF — 2026-09-27 (session 5, overnight) · GENERATED ART IS THE GOAL
Self-contained for a fresh Claude session. Codex's block follows below. Older Claude handoffs are verbatim in `ROADMAP_ARCHIVE.md` (session 4's is at its top).

**Dakk's goal (2026-09-26, verbatim):** "Can we get to the generated art? That's the main goal, so that we have the complete Earth creatures having full movement animations and all the procedurally generated animations in their various different battleground biomes." Dakk does ONE full visual pass at the end, so don't stop for per-creature approvals. **Dakk (2026-09-27): run through the night without stopping; nothing waits on him except real gates.**

**Where things stand**
- **Branch:** `anthropic/mac` is pushed through the commit adding this block; every commit is signed G (`git-ssh-sign-cf`). Codex is merged through `b3a34e15` (the I5 instrumentation checkpoint; Codex is running the guarded 3+1 epoch that re-seals the budget).
- **Gate:** from `port/v2`, `node tools/check-profile.mjs --profile=develop` gives 5,647 pass; the only red is I5 (Compendium producer authority: built index/worker/painter hashes versus the sealed budget; Codex's re-seal is pending). Run it on a QUIET tree, plus by hand: `npm run typecheck`, `npx tsc --noEmit --noUnusedLocals`, `npm run artaudit`, `npm run overridecheck`, `node tools/speccheck.mjs`, `npm run overridecontrol`.
- **Dev site:** serves `e71d1496`; no player-visible change since.
- **develop** is still `c1791e21`; PR #43 is open; no hosted attempt.
- **Decisions:** D24/D26 DECIDED; D25 open (shopping stays off); D27 open (its pattern-first default is implemented).
- **Progress** (`audits/GENERATED_GALLERY_20260927/coverage.json`, regenerate with `coverage.mjs` after each batch): **104 of 631 Earth species (16.5 %)** have a generated creature passing native with zero hand edits: fish 36/132, quadrupeds 30/205, birds 21/102, snakes 12/22, insects 5/41; every other family 0. None is visually accepted or admitted. Master gallery: `gallery.jpg` (108 tiles). Batches score with ONE command: `score-batch.mjs <batch> <tag>` (observed supports).

**Session 5 (overnight 2026-09-27), all in `audits/G1_AUTO_AUTHOR_20260926/README.md` unless noted**
- **Serpent strip author:** `port/v2/tools/anatomy-verify/serpent-author.mjs`, runner `--serpent-strips` (USE IT for every serpent batch). **Snakes 0 → 9** static + native, clean at full size. Battery `serpent/battery.mjs`: 59/60 mutants, 9/9 wrong family.
- **Guarded tail labels:** `tail-labels-fit.mjs`, runner `--tail-labels`, off by default. Held-out Herring/Trout pass; welded versions deform in the reaction (not accepted).
- **Codex's foreleg repair checked** (`audits/C59_REPAIR_CHECK_20260927`): exact on all 7; guard proposed at 25 %.
- **C59 scored:** Raccoon, Vulture, Water Snake pass. Bobcat is a real slowdown. The Raven split is wing/tail overlap.
- **legMatch lever rejected** (battery positives 18 → 14; G2 quads unchanged).

**Next, in order (Claude)**
1. Read Codex's mailbox (`/Users/dakk/Projects/celestial-frontier-openai-mac/audits/MAILBOX/TO_CLAUDE.md`, read-only) and merge any newer signed `openai/mac` (`--no-ff`; `git grep -n "^<<<<<<<\|^>>>>>>>"` BEFORE committing; keep this block).
2. **Score every new G2 batch with ONE command:** `node audits/G1_AUTO_AUTHOR_20260926/score-batch.mjs <batchDir> <fresh-tag>` (out of the sandbox). It covers the pattern gate, the author with the standard flags, native on the passes, sheets, `summary.json` and the gallery registry.
   - Then LOOK at `native-<tag>/fullsize-reaction.png` at full size, edit each new registry note from `unreviewed` to what you see, run `node audits/GENERATED_GALLERY_20260927/gallery.mjs`, record the results in the G1 README, and send Dakk the sheet.
3. **Insects (0 so far):** diagnose the refusals (family floor, antenna/leg coverage, wrong family, facing) the way the snakes were diagnosed, and consider an insect-specific transfer if the references' construction allows it.
4. Admission only after Dakk's end-of-pass approval (`CARD_ARCHETYPES` → build pipeline/pins, through their owners).

**Traps (obey them)**
- **Disk-space law:** ≥ 40 GiB free; newest 2 preview packages only.
- **Inline `//` comments swallow dense one-line JS:** use `/* */`.
- **zsh does not word-split `$var` or `${@:-a b}`:** use arrays (`fish=(a b)`) or `${pr%%:*}` pairs. It bit twice.
- **`Buffer.slice()` is a VIEW:** copy with `Uint8Array.from` before mutating (it corrupted a check once).
- The G1 runner caches fits: use a fresh `--tag`.
- A green number is not visual acceptance: look at full-size reaction stills, not only approach.
- Browser-owning commands need out-of-sandbox execution. Codex's sealed inventories are never rebound by Claude.

## Current Codex sprint handoff — 2026-09-27, overnight run ongoing

Dakk wants generated paintings for all 631 Earth creatures, full movement in battle biomes, one final visual pass. Continue large batches without per-creature approval stops. Worktree `/Users/dakk/Projects/celestial-frontier-openai-mac`, branch `openai/mac`. Read Claude's absolute read-only mailbox at start and batch end; replies only in this lane's `audits/MAILBOX/TO_CLAUDE.md`. Signed G commits, normal own-branch pushes after develop plus seven owners and fresh PUBLIC/UNFROZEN/workflow review. Merge newer all-G `anthropic/mac` with `--no-ff`, hand reconcile, grep conflict markers and preserve the incoming Claude block above byte-identically. No PR/label/hosted/develop/main/release/deploy/version bump. No Dakk relay/app switching. Disk ≥40 GiB; currently 200 GiB. Reuse the uninterrupted-session startup receipt `audits/C59_REPAIR_20260926/toolchain-check.json`.

**I5 OPEN, authority CONSUMED.** The single authorized c506 epoch stopped at calibration 1 phone Back focus INSTRUMENT-FAIL. No retry, resume, later phase or certificate. Evidence: `audits/I5_C506_EPOCH_20260927`. Art changes do not authorize another epoch. Latest completed required battery: signed C89 `7aaa156e5`, 5,675 tests pass, I5 sole failure, seven remaining owners/root validate PASS, 12 focused presence controls PASS. Final evidence and own-branch delivery follow. C88 evidence is already pushed as `f2e44268c`; signed merge `025c66f86` incorporates Claude through `85cf8f5d`.

**Coverage and generation:** Claude C88 reports 104/631 (16.5%) native passes, not final visual/library admission. C87 scored 14/24: six reef fish, four birds, Red Panda/Pampas Fox/Wildcat/Spectacled Bear. Keep four separated quad feet, both ear tips, true tail clear; naturally folded bird wing tips above/short of tail; level head-right x-monotone snake S without coils. `compile-library-master.mjs` now preserves canonical species notes; C87 retained and refused the wrong freshwater Angelfish, then generated a separate marine replacement. Pattern checks and exact before/after prompt receipts never substitute for anatomy. Avoid duplicates against all pilots and `port/v2/reference/fauna.json`.

**C89 presence contract:** `audits/PRESENCE_C89_20260927` binds the exact Hyrax master, canonical subject, prompt, adult/caste/pose and explicit visual review to optional tail absence. Twelve controls plus two removed-guard mutants protect the binding. A fresh automatic-packet adapter removes four false tail parts/joints, preserving all other BodyCard parts and source pixels. Full static remains RED on exhaustive family `melee:tail` compression (18/19 actions, 1,432 presentation samples and exact rest pass). No action row or limit changed; no native/admission. Correction: both old/new actual game weapon intent is bite/claw; the failing tail clip is in the exhaustive diagnostic library. Claude can consume the reviewed contract before new author/intake; no blanket absence inheritance. Wingless-caste policies remain open.

**Fish and insect progress:** C88 applies the unchanged C84 fish recipe to eight more fits: all static/native PASS, 0/0 refusals, 707 frames except Grouper 703. Claude selected them for the review gallery with caveats; Mackerel chest slit/Tarpon belly slit and smaller faults remain. Full films and late stills ARE committed (`turn3-hit-idle-90.png`, `turn3-hit-reaction-50.png`). C84's eleven fits and C78/C80 repairs also remain per-candidate, not a general author default. Bass still refuses the quarter-width gap guard. C85 fixes Cicada feed only; cast/hit/tame compression and faint folds remain. C86 Wasp reference was held: unchanged held-out score worsened 5→4/29. Four other insects now have native passes; more suitable hand references remain needed.

**Open repairs:** Snowy Owl has a real two-triangle native lethal-faint refusal at 425.5333 ms, not missing frames. Striped Hyena cast, Black Bear presentation and Hyrax tail clip remain static red. Bobcat late lethal slowdown remains (C82 871/887, zero rig refusals); broader side candidate rejected 20 folds. Donkey retains neck/torso faults. Raven/Vulture wing-tail ownership needs source-supported correction, not a blind overlap guard; Quail faint/Raven victory folds, bird neck/wing shards and Dove/Pigeon tail curl remain. Marmot/Cattle neck repairs partial; Red Fox stance compression, Arctic Fox cuts and Tiger/Ocelot/Fisher alpha hairlines remain. D26 finisher eligibility ≥250 does not widen contact/source-join guards. Additional verified phone originals remain queued as eligible creatures become available.

**Next without stopping:** finish C89 evidence push, read mailbox, merge latest signed Claude, then generate `audits/G2_C90_20260927` (six serpents, eight fish, ten quadrupeds). Names and scripts are prepared; no prompt compilation or images yet. Run `compile.mjs`, then `clarify-poses.mjs` BEFORE generation to reconcile exact coiling/sitting/sentinel clauses while retaining original prompts and canonical source. Retain exact originals, review full size, run pattern/framing owners and deliver pilot to Claude. Continue new source-supported repairs between G2 batches. Keep verification quiet in this lane and preserve every red result. Prior handoff and C86–C88 logs are archived verbatim at the top of ROADMAP_ARCHIVE.md.
