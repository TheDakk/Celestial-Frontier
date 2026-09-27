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
- **Progress** (`audits/GENERATED_GALLERY_20260927/coverage.json`, regenerate with `coverage.mjs` after each batch): **125 of 631 Earth species (19.8 %)** have a generated creature passing native with zero hand edits: quadruped 34/205, fish 45/132, biped-bird 24/102, insect 5/41, serpent 16/22, hopper 1/18; every other family 0. None is visually accepted or admitted. Master gallery: `gallery.jpg` (129 tiles). Batches score with ONE command: `score-batch.mjs <batch> <tag>` (observed supports).

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

Dakk wants generated paintings for all631 Earth creatures, full movement in battle biomes, one final visual pass. Continue batches without per-creature stops. Worktree `/Users/dakk/Projects/celestial-frontier-openai-mac`, branch `openai/mac`. Read Claude's absolute read-only mailbox at start/end; replies only own `audits/MAILBOX/TO_CLAUDE.md`. Signed G commits; normal own-branch push after develop + seven owners and fresh PUBLIC/UNFROZEN/workflow review. Merge newer all-G `anthropic/mac` with `--no-ff`, keep incoming Claude block byte-identical, grep conflict markers. No PR/label/hosted/develop/main/release/deploy/version bump. No relay/app switching. Disk199GiB, floor40GiB. Startup receipt `audits/C59_REPAIR_20260926/toolchain-check.json` covers this uninterrupted session.

**I5 OPEN, authority CONSUMED:** the one authorized c506 epoch stopped at calibration1 phone Back focus INSTRUMENT-FAIL; `audits/I5_C506_EPOCH_20260927`. No retry, resume, later phase or certification. Latest complete battery C94 signed8e5e1590:5675 tests pass/I5 sole failure, seven remaining owners/root/11focused controls pass; evidence pusheda2feb30f. Current mergec0911699 includes signed Claude through0c43f14b. C95 quiet battery and own delivery follow.

**Generation C95:** `audits/G2_C95_20260927/pilot.json` has24 untouched1254 originals, six each fish/birds/quads/insects, exact receipts and full-original reviews. Five required patterns pass;19NOT_REQUIRED. Framing21PASS/3REFUSE (Tigerfish97px, Coelacanth54/58px, Springtail76px vs101px unchanged). Bonefish extra fin, Coelacanth chin protrusion, Mosquito sex ambiguity, Black Fly second antenna, Springtail antenna/furcula and generic Cold-Adapted Insect identity are explicit holds/caveats. Nine pre-generation context clarifications retain before bytes; no hand anatomy/retouch/admission. Claude C93 reports C92 nine natives, coverage125/631(19.8%). Keep broad24-species batches, avoid duplicate pilot names; pattern-first canonical prompts, four quad feet/both ears/true tails, naturally folded bird wing tips distinct from tail, x-monotone snake S without coil.

**C94 production tooling repair:** opaque same-joint merges now enter `intake-authored.mjs` through existing exact-keyed-label schema. Original master/keyer RGBA/label hashes bound; native-alpha Ant labels byte-identical;11focused tests and actual old-selector mutant. `audits/KEYED_REGION_C94_20260927/aphid-fit` compiles21owners, exact keyed/rest/atlas0. Aphid still RED on cast366ms/hit356.25ms compression and presentation; inherited wing regions on a visibly wingless painting remain anatomy HOLD. No native or absence inference. Claude may consume the repaired route on fresh packets without changing limits.

**Snowy Owl diagnosis C91/C93:** exact native-seed wider interval has10 stage and7 standalone faint failures; standalone passes only at the original425.5333ms instant. Early idle fade, foot collars and106-vertex local-chain weight candidates all rejected; no production/default/limit changes. Five interval controls and exact-clock instrument correction retained in `audits/FAINT_COMPOSITION_C93_20260927`. A future repair must cover the whole motion, not cherry-pick the passing instant.

**Other progress and open repairs:** foreleg25% guard done. C84 eleven + C88 eight fish static/native passes close major gaps, with late Mackerel/Tarpon slits and smaller faults retained; named late stills committed. Candidate gallery selections, not general adoption. Bass quarter-width gap refuses. C85 Cicada feed repaired; cast/hit/tame compression and faint folds remain. Termite abdomen line remains; Wasp hand reference held after score worsened5→4/29. Hyrax reviewed tail absence is consumed, but exhaustive melee:tail stays RED; actual game already bite/claw, no diagnostic skipped.

Bobcat late lethal slowdown (~190ms moving faint), detached forepaw despite zero refusals; broader side candidate rejected20folds. Donkey neck/torso holes. Raven/Vulture wing-tail ownership; Quail faint/Raven victory; bird shards and Dove/Pigeon tail curl. Marmot/Cattle neck partial; Red Fox stance compression, Arctic Fox cuts and Tiger/Ocelot/Fisher alpha hairlines. D26≥250 finisher does not widen join guards. More suitable hand insect references and source-supported presence reviews remain needed; publish more verified phone originals as eligible.

**Next without stopping:** finish C95 quiet battery, signed evidence/own push, absolute mailbox read/merge newer all-G Claude. Resume bounded source-supported repairs, then more G2. Preserve failures, no I5 retry. Claude scores each pilot; Dakk need not relay or open another app.
