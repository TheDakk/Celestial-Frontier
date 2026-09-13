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

## SESSION HANDOFF — 2026-09-12 · TEN-SECOND FALLBACK CAPTURES READY

**STOP for Nick's review.** The approved2D quadruped attempt preserves exact master rest pixels
on Civet,fox and the painter-emitted procedural control, but fails shape at clip extremes.
Use no success wording for articulated motion: folded/overstretched triangles remain, and the
fox has8 unreachable IK samples. All three review videos explicitly show WHOLE-PORTRAIT FALLBACK.
Native sourcefb008d58 completes10.163/10.181/10.120s videos at60.00fps; fallback-only update
p95 .10/.10/.00ms. E is intact beside the stage, which uses the retained unoccupied biome plate
from E's recipe. Opponent is whole-portrait Platypus. Captures do not prove ears/jaw/tail motion
or normal-game integration. Full details, failures, hashes and playable MP4s:
audits/CIVET_2D_PROOF_20260912/README.md and captures/. Earlier recorder failures retained;
final recorder continuously feeds rest frames until its start event before timing10 seconds.
Browser/server closed, no model run. Three template tests, two recorder contracts,79 existing
bridge/kinematics/rig tests, package TypeScript and root validate passed in this source batch.

**Next steps:** Nick reviews the fallback captures. Proposed next bounded repair is shared
skin weighting/foot constraints and unreachable-IK handling; do not start it automatically
past this review stop. After the proof decision: up to6 deterministic weather variants on the
saved raw finisher (sky-facing sheen, wet-fur value/contrast compression, foreground streaks
at plate-sky density), no inference, beside E/triptych for Nick's pick. Then at most3 approximately
1GB finisher candidates on Mac, redistribution permitted, same composite/masked0.35 and
compatible precomputed embedding; one best-candidate phone attempt. No delivery engineering
before that result. Klein phone probing remains stopped. Phone17Pro/iOS26.6.2/USB-C; normal
Safari quota1,048,576,000bytes versus Klein expanded transformer4,393,808,634bytes. Earlier
session loss is not established OOM. CF Local Probe certificate was left installed for now.

Accepted ordinary-game art stays rain E (3x droplets/3x specular/2x rain), original and raw
finisher retained; source8b01e38c and browser proofaaacfd6f. Civet proportion authority is what
faunaResetViverridD draws, not ignored QUAD2 generic dimensions. Authored master JSON measures
the accepted view, preserving its perspective/raised-paw support offsets; procedural geometry
is observed from its actual winning draw owner. No raw genes override named Earth anatomy.
Keep turnaround/canid assets for later engine port; Blender browser projection is abandoned.
No3D tokens/projections,texture-finisher passes,effect paintings or kit edits.

Claude's four supplied reviews remain verbatim in signed7f2aa40b and match the supplied ZIP.
Their historical restart/Blender prose is review history; Nick's current approved2D request
controls execution. No larger Blender rework approval question remains active.

**Clean promotion plan:** prune superseded code and pack assets on openai/mac first. Then
split PR42 into three ordered squash-merged tiers into develop: production UI; painted landfall
engine; research tools. Then one develop→main release PR with the full chain. Ready no PR until
Civet2D proof,second weather pick and phone-tier decision have landed. Audits LFS migration is
pending Nick's decision; no history rewrite. Detailed plan remains the supplied
CLAUDE_FULL_REVIEW_20260910/CLEAN_PROMOTION_PLAN.md. No GitHub authority is implied.

Ownership: OpenAI/Codex macOS, /Users/nick/Projects/celestial-frontier-openai-mac, openai/mac
tracking origin/openai/mac. Signedfb008d58 is60 ahead upstream/171 ahead cachedorigin/develop,
zero behind; final evidence/doc commit follows. Only unrelated.DS_Store is excluded. Reuse
Sept12 startup receipt (Node26.8.2). GitHub step NONE; PR42 parked; zero hosted attempts or
writes authorized despite budget UNFROZEN/public/private fallback3000. No PR needed now;
no release/deployment. Claude Code need not open/sync; these local changes are not in develop.
