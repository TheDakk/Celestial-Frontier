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

## SESSION HANDOFF — 2026-09-16 · procedural motion iteration

Review http://127.0.0.1:49816/procedural/ and
[audit/prompt](audits/PROCEDURAL_BATTLE_ITERATION_20260916/README.md).
Previous /habitats/, /families/ and /impact/ remain. The review page uses one selected video
at a time after the embedded browser crashed with four players; recovery verification is
recorded with the package. Three real genomes use the existing canvas painter, not AI paint.

[Procedural motion iteration](audits/PROCEDURAL_BATTLE_ITERATION_20260916/README.md) adds
three real generated genomes (10032,10052,10271), with painter-emitted landmarks/masks/materials,
zero observation drift and one lossless atlas each. Shared genome-aware body cards and smooth
review transitions pass484 individual plus601 assembled native samples per creature, exact rest
and final rest, and separated-mesh negative controls. All three recorded about60fps/0.4ms rig
update p95. This covers only current four-leg/banded-tail observation support, not every family.
The habitat diagnostic now subtracts compiled hitstop from locomotion, poses and body travel;
both turn roles freeze identically and1,202 source-join/medium-containment samples pass. Its
latest fish/bird updates are0.9/0.6ms p95.36 focused tests,typecheck/root validation pass. These
remain diagnostic tools; normal gameplay is not yet wired. Fine silhouette aliasing, source
shadow deformation, planted contact, other painter owners and phone qualification remain open.

Native proofs: native-1-polished,native-2,native-3 (608/606/607frames,10.117/10.100/10.117s)
and native-habitat-01 (607frames/10.117s). Source hashes in each report bind dirty diagnostics;
these are not clean-source certificates. No source art, kit, main.ts, combat or sibling edit.
The procedural trial scans272 seeds with declared exclusions, no hand fitting or clip edits.
Do not generalize these results to extra legs, other tails, aquatic/airborne procedural owners.

Next: Nick reviews films. Fix shadow/edge presentation with image-based controls, complete
other painter masks/records and qualify more anatomical extremes. Bird needs opponent-facing
flight; Frog ground contact remains open. Then connect admitted encounter/world/record data
through CreatureRigV1 to ordinary gameplay and separately qualify30fps on the physical phone.
Preserve8% contact bound, exact rest/source joins and strict<2ms per-creature update requirement.

Signed code/evidence checkpoint73b93592 contains the accumulated continuation and this batch;
119 ahead cached origin/openai/mac and230 ahead origin/develop at that checkpoint. Signing
succeeded through the configured1Password helper, without a fallback or configuration change.
A documentation receipt follows it. Code checks are complete; hosted chain was not run.

C3 remains signed b79fd32e:1,669 source entries/1,665 unique originals,1,662 decode,three quarantined;
1,617 WAV/Opus pairs and203/631 fauna reference identities,428 missing.43 biome recipes/486 routes,
484 rendered,two intentional silences. References are not species-behavior/listening acceptance.
Audio review audio-production/REVIEW_PROMPT.md and REVIEW_PACKS.md;23 ZIPs below30MB.
C1 mechanical intake complete; Nick owns final Wild acceptance. C4 remains twelve assets/sheet.
Rain E active; second weather pick and smaller-finisher phone decision open. Klein probes stopped.
C5: prune on openai/mac, then three merge-commit tiers into develop (UI,engine,tools), followed by
one develop→main release PR/full chain only when separately authorized. No Ready before required
proof/weather/phone decisions. Audits LFS approved in principle; perform only on Nick's explicit go.

OpenAI/Codex continues locally on openai/mac. No new branches, kit edits, GitHub writes, Actions,
merges, release, deployment or history rewrite. PR42 parked. Claude need not open/sync now; when
Nick requests review, provide the consolidated prompt and named evidence, not an automatic merge.
Reuse the uninterrupted September15–16 toolchain receipt; do not update tools during evidence jobs.
