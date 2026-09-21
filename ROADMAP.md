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

## Live handoff — 2026-09-23 Civet markings complete

Verified Codex/macOS in /Users/nick/Projects/celestial-frontier-openai-mac on openai/mac. Claude sibling read-only. Nick authorized one Civet marking-mask set; completed and at the signed review stop. Codex HOLDS. No fetch/sync/push/PR/merge/release/deploy. Signed commits only; report actual local HEAD/ahead after signature verification. Continuing Node 26.9.0 anatomy-run receipt reused; .DS_Store untouched.

Packet: audits/MORPH_CIVET_MARKINGS_20260923/README.md. Deliverables: audits/ANATOMY_COMPLETION_20260917/civet-sentinel-input-01/markings/{striped,spotted,banded,mottled,marbled,eye-spotted}.png and sibling markings.json (cf.marking-masks/v1). All 1254², white RGB with alpha, zero outside keyed alpha and zero protected-part pixels. Plain has no mask; iridescent emissive has no mask. Exact retained Civet compiled-prompt prefix + one marking-only block per output, raw PNGs, hashes, full composites and six-mask-sheet.png retained. No resize or registration transform. One mottled revision after visual review; first draft retained, other five unchanged.

There is no labels.png. Existing binding atlas frames map alpha back to source cutouts. Integrated eyes protected through head (no independent eye/shadow parts); head/jaw/ears/paws/tail excluded, body-only marking allowance. Original coat and tail rings untouched. Record/master/keyed/atlas/binding/manifest hashes unchanged. Conservation controls reject outside-alpha and protected-part mutations; changed mottled layer checked alone. Runtime/solver/rig unchanged, so no repeated batteries/S2/native films. Previous BORROWED_ATLAS_20260922/S2_LEDGER.md remains the runtime reference.

Nick reports previous crab masks d8a1a8f9 merged as fddfa5e4 and borrowed-atlas evidence 3f0607be merged as 50c01248 on Claude, with M3/M4 and cache filmed there. No local sync or re-film. Prior loader default ownership and seventh-argument borrowedAtlas contract remain unchanged.

Paired next steps: Codex holds. Claude consumes the Civet masks through its existing atlas mapping. Nick reviews the six-mask sheet; no implementation decision pending. Open Claude when ready to continue integration. No new intake, roster, P2 or third archetype.

Signing blocker: 1Password refused the Civet marking commit with “agent returned an error”, exit 128. Packet and refusal receipt are staged; Nick has been asked to approve/unlock signing. HEAD remains 3f0607be until this commit succeeds. Sign and verify the existing staged packet, then report actual HEAD/ahead and hold; do not rerun conservation or any battery.

Current Git direction: Nick explicitly requests “push openai/mac”. This authorizes one normal branch push after the pending Civet signature; no fetch/sync/merge, PR, label, workflow dispatch, release or deployment. Budget mode UNFROZEN; inspected workflow triggers are labeled-PR/manual only, with no push trigger. Sign and verify the staged packet, push this branch normally, confirm remote HEAD, then hold. Earlier no-push directions remain history for their completed runs.
