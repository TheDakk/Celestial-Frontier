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

## SESSION HANDOFF — P1 accepted art; hidden-pair implementation and faint finding

Nick accepts P1 generation01 art and corrects the old count-law finding: Coconut Crab has
six visible walking legs; the fourth pair is present but hidden. No regeneration. Read-only
anthropic authority `audits/VISION_PROGRAM_20260920/P1_VERDICT.md`; no sibling edits/sync.
Current packet: [audits/VISION_P1_COCONUT_20260920/hidden-01/README.md](audits/VISION_P1_COCONUT_20260920/hidden-01/README.md).
Original PNG/prompt/tool evidence remains byte-identical in the parent packet.

`cf.anatomy-presence/v2.hidden` explicitly declares leg3Far/leg3Near. Full inferred skeleton
inventory retained; hidden joints own no visible part/positive skin weight or contact chain.
The new P1 fit02 has21 visible parts and unchanged1254-square RGBA, exact atlas reconstruction,
eleven passing action rows and presentation. Faint hits the unchanged−35° post-IK limit;
measurement needs−50.0539666° at leg2NearFoot/260ms. No landmark move or limit relaxation.
Nick authorized the measured contact-limit extension: all six brachyuran subjects,12,318
samples, give Knee17.1176319° / Foot50.0539666° maxima. Shared contact limits are now±30°/±65°
by max+10°, round-up-to5°; raw clips and raw±35° limits unchanged. Native acceptance/film
and the final production-check sweep are pending. The prior faint red remains evidence.

Codex continues independent hidden-presence controls and signed evidence. Claude reviews
read-only; Nick's art acceptance already stands. No app switch needed for Git. Roster and
four further crab packets hold. R4/prior anatomy packet are complete history; Codex R9
canonical at a separately authorized future re-merge. PR42 stays parked.

Branch openai/mac, Node26.9.0 uninterrupted receipt reused. No fetch, sync, push, PR, merge,
release, deploy or new branch. All commits signed/verified, no unsigned fallback.
Pre-existing untracked .DS_Store remains untouched. Report only actual local HEAD/ahead
against cached origin/openai/mac. No hosted action is authorized or needed.
