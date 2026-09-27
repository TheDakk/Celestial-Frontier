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
- **Progress** (`audits/GENERATED_GALLERY_20260927/coverage.json`, regenerate with `coverage.mjs` after each batch): **136 of 631 Earth species (21.6 %)** have a generated creature passing native with zero hand edits: quadruped 35/205, fish 50/132, biped-bird 29/102, insect 5/41, serpent 16/22, hopper 1/18; every other family 0. None is visually accepted or admitted. Master gallery: `gallery.jpg`. Batches score with ONE command: `score-batch.mjs <batch> <tag>` (observed supports).

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

Dakk wants generated paintings for all631 Earth creatures, full movement in battle biomes, one final visual pass. Continue batches without per-creature stops. Worktree `/Users/dakk/Projects/celestial-frontier-openai-mac`, branch `openai/mac`. Read Claude's absolute read-only mailbox at start/end; replies only own `audits/MAILBOX/TO_CLAUDE.md`. Signed G commits, normal own-branch pushes after develop + seven owners and fresh PUBLIC/UNFROZEN/workflow review. Merge newer all-G `anthropic/mac` with --no-ff, preserve incoming Claude handoff byte-identically, grep conflict markers. No PR/label/hosted/develop/main/release/deploy/version bump; no relay/app switching. Disk196GiB, floor40GiB, two preview directories. Startup receipt `audits/C59_REPAIR_20260926/toolchain-check.json` covers this uninterrupted session.

**I5 OPEN, authority CONSUMED:** single authorized c506 epoch stopped at calibration1 phone Back focus INSTRUMENT-FAIL (`audits/I5_C506_EPOCH_20260927`). No retry/resume/later phase/certification. Latest complete battery C98 signedb75a7e15:5675pass/I5sole failure, seven remaining owners/root pass, evidence pushede31217c5. Current signed merge9d394ad2 includesClaude073509e5. C99 quiet battery and own delivery follow.

**C99 fish seam batch:** `audits/FISH_PIPELINE_C99_20260927`, exact native-winning Gar/Killifish/Parrotfish/Rabbitfish/Sea Bass, unchanged C84/C88 recipe. Five static/native PASS,707frames/0refusals each, CPU p953.1–4.3ms at4x. Six selector controls/two actual mutants; source/protected0. Large body/pectoral openings closed at full-size reaction+late idle. Gar tiny fleck, Rabbitfish angular back, face/fine-edge caveats remain. Five films/15named stills retained; redundant75stills in hashed scratch. No default or visual admission. General observed fish seam integration is the next repair lever.

**G2 throughput:** C98 has24 exact originals (10fish/8birds/4quads/2bees), five required patterns and24unchanged framing passes. Claude C99 scored13natives, coverage150/631(23.8%); Snailfish badly fragments, Cold-WaterFish/Sunfish unwelded, Petrel native RED. Numeric passes do not clear original anatomy holds: BlindFish eye mark, SmallFish extra fin, Icefish extra dorsal structures, Snailfish chin barbel, Screamer horn/spur, Tern streamers, bee wing inventory/Bumblebee5feet. C95 had24originals/11natives. Keep broad batches~24, absent prior pilot names, pattern-first canonical identities, four quad feet/both ears/true natural tails, bird wing tips distinct from tail, x-monotone side-on snakes. No retouch, invented absence or per-creature approval stop.

**Recent repairs:** C96 new Bobcat source layout+unchanged author19actions/1702presentation PASS, native933frames/0refusals; lethal interval p9512.6ms vs old191.2ms. Different painting/mesh, not isolated solver benchmark. Claude selected with ear flecks/foreleg sliver/crouched-paw holds; old rig remains. C97 explicit Springtail→chitin primary-source material map accepted,85otherprofiles exact/actual removed-map mutant. Springtail fallback13actions/presentation passes but front legs semanticUNRESOLVED; no native. C94 opaque same-joint intake through exact-keyed schema fixed,11controls+old-selector mutant; Aphid cast/hit/presentation RED and inherited wing anatomy held.

**Open repairs:** Snowy Owl exact stage interval has10failures/standalone7; early idle fade/collars/local-chain weighting rejected, no native retry. Foreleg25%guard done. C84/C88 nineteen fish seam candidates selected for gallery with subtle holds; Bass large gap refuses. Cicada feed repaired; cast/hit/tame/faint remain RED. Termite abdomen line; Wasp reference held5→4/29. Hyrax source-bound tail absence consumed but exhaustive melee:tail diagnostic stays RED; actual game already bite/claw. Raven/Vulture wing-tail, Quail faint/Raven victory, bird shards/tail curl. Marmot/Cattle partial, RedFox stance compression, ArcticFox cuts, Tiger/Ocelot/Fisher alpha hairlines. D26≥250finisher does not widen joins. Suitable hand insect references/presence reviews and verified phone originals still needed.

**Next without stopping:** C99quiet battery/signed evidence/own push, absolute mailbox read/merge newer all-G Claude preserving handoff. Continue bounded source-supported repairs, general fish seam integration with unchanged observation/negative controls, then moreG2. Claude independently scores every pilot and compares repaired fits. No I5 retry. Dakk need not relay or open another app.
