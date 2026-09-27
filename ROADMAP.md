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
- **Progress** (`audits/GENERATED_GALLERY_20260927/coverage.json`, regenerate with `coverage.mjs` after each batch): **150 of 631 Earth species (23.8 %)** have a generated creature passing native with zero hand edits: quadruped 37/205, fish 59/132, biped-bird 32/102, insect 5/41, serpent 16/22, hopper 1/18; every other family 0. None is visually accepted or admitted. Master gallery: `gallery.jpg`. Batches score with ONE command: `score-batch.mjs <batch> <tag>` (observed supports).

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

## Current Codex sprint handoff — 2026-09-27, I5 repair + art together

Dakk explicitly renewed complete I5 repair and said not to pause art. Goal remains generated art for all631 Earth creatures with full biome battle movement and one final human visual pass. Own lane openai/mac only; Claude mailbox absolute read-only, reply only own TO_CLAUDE. Signed G commits, own normal push after develop+7owners and current PUBLIC/UNFROZEN workflow check. Preserve Claude handoff byte-identically on signed --no-ff merges. No hosted/PR/label/develop/main/release/deploy/version bump. Disk196GiB floor40GiB; two preview directories. Reuse uninterrupted startup receipt C59.

**I5:** historical c506 calibration1 remains stopped, never retried. Actual cause now reproduced: pinned recipe chip z40 covers phone Back, click opens Shipyard. Signed829008f9a lowers chip to21 below panels; phone+desktop native Back restores exact row777 focus, uncovered chip still opens Shipyard; z40 mutant fails. V2 second keyboard entry also fixed to observed11Tabs,63instrument controls/actual omitted-patch mutant pass. All78outcomes/40ceilings/v1history unchanged. Evidence `audits/I5_BACK_REPAIR_20260927`. Next: quiet committed battery, one separate clean signed changed-source local3cal+1cert proof, first-red stop. No active budget or certificate claim until raw-verified success; only then implement explicit v2 profile selection without rewriting history. No wait for Dakk/Claude reply.

**C100 fish:** signed1ea0b7312 delivers guarded opt-in batch (`fish-seams-batch.mjs`): exact canonical/master/static/semantic/pattern/source admission,16negative controls/2actual mutants, Gar byte parity. Cold-WaterFish/Sunfish/Snailfish static/native PASS, Harpy nonfish skipped. Cold-WaterFish/Sunfish continuous in inspected reaction/late idle; **Snailfish still large head/trunk and lower-fin splits**, held despite green. Fullfilms+9namedstills; no default or visual admission. Claude independently reviews candidates.

**C101 art:** `audits/G2_C101_20260927/pilot.json`,24 exact1254 original paintings (12fish8birds4quads),2patternPASS/22notrequired.23framingPASS; Deep-SeaFishREFUSE96/97pxvs101 preserved. Per-source full-size anatomy holds and7pregen context clarifications retained. Claude scores automatically; no absence/admission inferred from prompts. Prior coverage150/631 afterC98, C99fivefishseams independently selected withholds. Keep more broad batches~24, fourquadlegs/bothearswhereanatomicallypresent/true tails; foldedbirdwingsabove tails; xmonotone snakes; pattern-first prompts.

**Other open repairs preserved:** Bobcat replacement native933/0 with lethal p9512.6ms vs old191.2ms, ear/paw/sliver holds. SnowyOwl10exactstagefailures/7standalone; rejected fade/collar/weight candidates. Foreleg25%guard done. Basslargegap; Cicadacast/hit/tame/faint; insect handreferences; Hyraxtail-absent exhaustive action remainsred; Raven/Vulturewingtail; Marmot/Cattle/RedFoxcompression; ArcticFoxcuts; Tiger/Ocelot/Fisheralpha seams. D26finisher completed without widening join eligibility. Source-bound phone originals continue aseligible. Full prior details archived verbatim above.

**Next:** commit24originals, quietbattery+7owners/freshpushpreflight; ownpush, read Claude mailbox and merge newer signed lane preserving handoff, then fresh I5 proof on exact signed source. Continue art and source-supported repairs; don't turn a green number into visual acceptance. No app switching or relay needed.
