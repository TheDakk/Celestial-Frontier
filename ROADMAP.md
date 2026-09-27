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
- **Progress** (`audits/GENERATED_GALLERY_20260927/coverage.json`, regenerate with `coverage.mjs` after each batch): **90 of 631 Earth species (14.3 %)** have a generated creature passing native with zero hand edits: fish 30/132, quadrupeds 26/205, birds 17/102, snakes 12/22, insects 5/41; every other family 0. None is visually accepted or admitted. Master gallery: `gallery.jpg` (94 tiles). Batches score with ONE command: `score-batch.mjs <batch> <tag>` (observed supports).

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

Dakk's goal is generated paintings for every Earth creature, full movement in battle biomes, one final visual pass. Continue in large batches with no per-creature approval stops. Worktree `/Users/dakk/Projects/celestial-frontier-openai-mac`, branch `openai/mac`. Read Claude's absolute read-only mailbox at start/batch end; reply only in this lane's `audits/MAILBOX/TO_CLAUDE.md`. Signed G commits only, normal own-branch push after develop profile plus seven remaining owners, fresh PUBLIC/UNFROZEN/workflow check. Merge newer all-G `anthropic/mac` with `--no-ff`, hand reconcile, grep conflict markers and preserve the incoming Claude block above byte-identically. No PR/label/hosted/develop/main/release/deploy/version bump. No Dakk relay/app switch needed. Keep40GiB free; currently203GiB. Startup toolchain receipt for this uninterrupted session is `audits/C59_REPAIR_20260926/toolchain-check.json`.

**I5 is OPEN and authority CONSUMED.** Dakk's one authorized c506 epoch stopped at calibration1 phone Back focus INSTRUMENT-FAIL. No retry, resume, later phase or certificate. Evidence `audits/I5_C506_EPOCH_20260927`. Subsequent art changes do not authorize another epoch. Latest completed required battery is C85:5,675 tests pass, I5 sole failure, seven remaining owners/root validate PASS on signedbc34356cc. C85 evidence pushed as a50f0409f; signed lane sync73cbbcd merges Claude through4bbde444. C86 is the current uncommitted reference batch and needs its own battery/push.

**Current generated-art coverage:** Claude C84 reports86/631(13.6%), no final visual/library admission. G2 C72/C76/C81/C83 pilots each deliver24subjects with exact originals/pattern/layout receipts. Keep C83 quadruped layout (four limbs apart, both ear tips, true tail clear); Cheetah/ManedWolf/SandCat now pass. Birds keep naturally folded wing tips above/short of tail; snakes remain head-right low x-monotone S without coils. Avoid species duplicates by checking all existing pilots against `port/v2/reference/fauna.json`.

**C86 delivery:** `audits/INSECT_REFERENCES_C86_20260927`: six exact generated outputs, one manual Wasp reference candidate (`06-wasp-v2`, `extra-refs-diagnostic.json`). Raw skin13x121PASS and source rest0; full contact cast/hit/tameRED, no native/admission. Five other outputs refused for limb count/attachment or unresolved wing interpretation. Two-to-three new insect references remain incomplete. Claude should independently run unchanged mutation/held-out/reference tests, not auto-adopt. Existing C62 hand references Robin/Pigeon/Duck/Hawk/Cat/Weasel/Ant/Cricket were independently evaluated and adopted; Dog far ear remains unresolved.

**Recent repairs:** C85 (`audits/INSECT_CURVE_C85_20260927`) adds source-bound canonical insect feeding torso author only. Cicada feed now full actionPASS; cast/hit/tame compression and faint11folds remain. Cast candidate was contact-green but9skin folds and was rejected. All original runtime limits unchanged. C84 fixed fish recipe (`audits/FISH_PIPELINE_C84_20260927`) gives11fullstatic/native707-framePASS, Bass refuses quarter-width gap. Claude C85 selected the eleven improved fits for the review gallery with retained notes, not a general author step. Late Tetra belly loop/Sturgeon chest/snout distortion concerns remain. C78/C80 keyed-label intake and fish axis/observed-weld/collar helpers preserve paint; Sculpin/Walleye/Pacu/Grayling/Carp/Paddlefish independently reviewed. Fish recipe is per-candidate and requires full-size late-pose review, not only numbers.

**Open repairs:** Bobcat late lethal slowdown (C82 side repair871/887 with0refusals; broader chain rejected20folds); Donkey marginal891-frame pass retains neck fragment/torso hole. Raven/Vulture wing/tail ownership unresolved; no blind overlap guard separates good birds (Claude C83). Bird support/faint authors and observed native mode fixes are live, but neck/wing shards, Dove/Pigeon tail curl, Quail faint/Raven victory folds remain. Marmot/Cattle C73 upper-neck ownership improvements are partial; RedFox source stance compression remains. ArcticFox nape/rearing cuts; Tiger/Ocelot/Fisher chest alpha hairlines remain. D26 allows finisher interior alpha>=250 only; never broaden contact/source join guards. More phone finished originals remain eligible-work queue.

**Next without stopping:** deliver C86 with required battery and signed push/mailbox merge; continue remaining ownership/motion repairs when a source-supported change is available; otherwise loop through24-species G2 batches with exact receipts, pattern checks and pilot for Claude. More insect references and exact master-bound presence declarations remain needed. Absence must bind reviewed life stage/caste/pose and exact painting hash; no species blanket or invented hidden pixels. Quiet verification means no competing job or tracked-source/HEAD change in this lane; retain every red/instrument result. Prior full handoff is verbatim at the top of ROADMAP_ARCHIVE.md.
