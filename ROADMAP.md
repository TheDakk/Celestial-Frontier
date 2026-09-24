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

## Live handoff — 2026-09-24 expanded sprint in progress

Codex/macOS owns /Users/nick/Projects/celestial-frontier-openai-mac on openai/mac. Claude’s absolute worktree remains read-only. Nick added items4–7 from Claude’s uncommitted CODEX_PROMPT.md; its exact snapshot and hash are retained at audits/MOTION_FOLLOWUP_20260924. Signedef45f97b records I5 source triage first. PR43 was read-only verified OPEN at anthropic/mac202191a1efe47ca173ce0bbd32809def910b7a45 → develop; it differs from this local source. Standing no-sync/no-merge remains; no certificate attempt or hosted action consumed. I5-FIRST.md explains the exact source gate.

Item4 implemented here: external battle2-assets.json with schema cf-battle2-assets/v1 and files[{path,bytes,sha256}], exact source/final-output inventory validation, digest-verified first-use caching per retained build, no eager arena download. The unchanged128MiB shipped limit includes lazy assets.45 PWA tests,35 release tests and all3 typechecks pass; one local evidence build succeeds. The authority printer then exits2 for stale budget producer, explicitly retained; no rebind. Claude must generate the actual pinned list from its builder and run the integrated controlled-worker picker. Exact shape/next steps: CLAUDE_BATTLE2_MANIFEST.md.

Item5 Centipede0.85× and item7 unused-template wiring are next in this uninterrupted sprint. Item6 remains the signedfb1922a0 stance/override repair, no changed seals or repeated unchanged battery. Existing motion review is audits/MOTION_ANATOMY_20260923/review.html, signedfb1922a0 plus4c23bffc handoff; its unresolved anatomy gates remain explicit.

Codex continues independent work; Claude consumes signed changes and generates the manifest when handed this contract. Nick need not open Claude before this sprint finishes, but may relay the contract now. No push/PR/label/hosted/merge/release/deploy; no new art commissioned. Current Node26.9.0 identity rechecked; startup receipt reused within the same uninterrupted session. Signed commits only through existing wrapper; pre-existing .DS_Store untouched.
