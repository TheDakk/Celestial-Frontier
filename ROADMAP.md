# Celestial Frontier — Roadmap & Session Handoff

## 📌 PINNED — STANDING PROCEDURE (Nick, 2026-07-20): UPDATE THE MARKDOWN DOCS AS WE GO.

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

## SESSION HANDOFF — 2026-09-16 · shared anatomy and full-clip review

Nick's requirement is shared, anatomy-driven animation across all Earth and procedural
creatures. No species/seed/hash exceptions in the numerical solver or clip code. Authored
masters retain fitted observations; procedural painters must emit what they draw. See
CREATURE_ANIMATION.md's universal architecture/variation gates, ATTACK_ANATOMY.md and
[audits/ANIMATION_COMPLETION_20260916/README.md](audits/ANIMATION_COMPLETION_20260916/README.md).

This batch adds eight physical motions (32 selector rows), expands explicit anatomical
absence and rejects broad marine/crust/sessile aliases that invented the wrong body graph.
Post-easing bounds close nine original limit violations; exact secondary sampling fixes
GSAP/pure mismatch.169 actions/40,729 synthetic samples pass. All631 fauna are catalogued;
573 have candidate moves,58 need new topology. This is not573 finished animated masters.

Whole-library painted checks found cast/dodge/victory folds missed by four-action proofs.
The shared solver preserves its previous fast solution and uses bounded active-set repair
only for unresolved folds. Pins, masters, poses, source-join gates and atomic refusal remain.
Native current-solver reports: fish-native-04, frog-native-04, broad-native-01; bird-native-02
is an earlier solver snapshot explicitly labelled in the review. All clips have named frames;
films are ten seconds. Some timing remains over2ms (frog victory2.2ms; broad film p952.2ms).
No final visual, full-game combat or iPhone qualification is claimed.

36 motion/anatomy tests,33 skin/solver controls, TypeScript and root validation pass.
checks.json names the final evidence; failed experiments and raw logs remain for review.
No main.ts hunk, painting, model run, kit edit or other reserved Claude-module edit.
The updated GSAP producer SHA is600e413b90587a5d3b2f40ace148a95e6e692fb82f3b4d2eba2f17b12f0a8660;
historical runners pinned to6a206acd remain historical. Use the new source-hashed diagnostic.

Review: http://127.0.0.1:49816/animation-library/ ; species-coverage/ now serves catalogue-03.
The combined REVIEW_PROMPT.md here indexes all prior C2 stages and the separate C3 package.
Preview can be rebuilt with tools/animation-completion/review.mjs from repo root under the
existing toolchain lock; serve the resulting directory with tools/family-review/review-server.mjs
(paths under port/v2). The current scratch server serves /private/tmp/cf-animation-preview-20260916.

Next work: qualify remaining full-body poses and timing; extend record-described topology
and painter observations for variable appendage counts and the58 unmatched bodies; test shared
repairs on multiple legal shapes and materials. Then fit art, prove contact/media/scene integration
and qualify the physical phone. Do not declare whole-library/whole-species completion from
synthetic fixtures or a passing film. Do not reduce a creature's motion just to hide a fold.

Last signed HEAD at batch preparation: fd26b9f8;121 ahead cached origin/openai/mac,232 ahead
origin/develop. The final signed checkpoint again failed with "1Password: agent returned an error".
All work is saved/staged; checkpoint.json records exit128. Never use unsigned fallback
or push the staged candidate.

C3 stays signed b79fd32e: 1,669 source entries/1,665 unique originals,1,662 decode,three
quarantined;1,617 WAV/Opus pairs and203/631 fauna reference identities,428 missing.43 biome
recipes/486 routes,484 rendered,two intentional silences. Not listening/species acceptance.
Audio production REVIEW_PROMPT.md/REVIEW_PACKS.md identify23 ZIPs below30MB. C1 mechanical
intake complete; Nick owns final Wild acceptance. C4 remains12 assets/sheet. Rain E active;
second weather pick and smaller-finisher phone decision open. Klein probes stopped.
C5 pruning on openai/mac, then UI/engine/tools tiers into develop by merge commits; one
future develop→main release PR/full chain only with separate authorization. No Ready before
proof/weather/phone decisions. LFS migration awaits Nick's explicit go; no history rewrite.

OpenAI/Codex continues locally. Claude need not open or sync now; Nick can supply the
consolidated REVIEW_PROMPT.md when ready. No GitHub write, Actions, branch, merge, release,
deploy or history rewrite. PR42 parked.
