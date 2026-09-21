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

## Live handoff — 2026-09-22 crab markings and borrowed atlas complete

Verified Codex/macOS in /Users/nick/Projects/celestial-frontier-openai-mac, branch openai/mac. Claude sibling remains read-only. Nick's two-item run is complete; Codex HOLDS. Signed local commits only. No fetch/sync/push/PR/merge/release/deploy. Continuing-run Node 26.9.0 receipt reused; existing .DS_Store untouched.

Signed/verified marking commit d8a1a8f9941df45241e3ac0bd459fbc1b85932e8; loader producer 5b6f89c7b0d9a2e35f4bc5ed57df33b5eaf363ac. Final evidence commit follows; report actual local HEAD/ahead without fetching. Earlier signing refusals are retained. Prior bear evidence was signed as 88adb919; Nick reports Claude's observed-support bear proof accepted, so no further bear work.

Marking packet: audits/MORPH_CRAB_MARKINGS_20260922/README.md. Six white-alpha masks in audits/ANATOMY_COMPLETION_20260917/crab-fits-03/crab/markings/, with sibling markings.json mapping patterns to files/hashes/exact sent prompts. All 880², zero pixels outside keyed master alpha; eyes/shadow excluded. Master, record, binding, labels and atlas unchanged. Retained P1 archetype prompt plus one marking-only block; built-in imagegen raw 1254² outputs retained. Registration/resize/clipping receipt and one rejected stripe output retained. Plain no mask; iridescent emissive. six-mask-sheet.png is pending Nick's visual review. No second archetype or intake.

Loader packet: audits/BORROWED_ATLAS_20260922/README.md. Optional seventh argument {borrowedAtlas:true} after the custom decoder preserves a caller-owned atlas Texture and TextureSource on rig disposal and decoded-dimension refusal. Default ownership unchanged. Per-rig objects still release; cache owner releases texture only after every borrower disposes. Ownership captured at load. Hash admission and all solver/skin behavior unchanged.

One focused actual-Pixi both-way ownership control reproduced the old bug, then passed on the change; app typecheck and root validation PASS. One S2 sweep on signed 5b6f89c7 PASS_STATIC: all six complete receipts and decompressed support samples byte-identical to BEAR_RIGID_SUPPORT_IK_20260922/s2; five crabs R2c′-identical; Civet drift 0.16525637288346104 px; exact rest/presentation pass. S2_LEDGER.md and s2/identity.json contain evidence. No retry, native film or new CPU measurement. Do not repeat completed checks.

Paired next steps: Codex holds. Claude consumes signed masks and loader producer for M3/M4 master-to-atlas mapping and the morph texture cache, using the existing custom decoder plus {borrowedAtlas:true}; its integration retains cache lifetime responsibility. Nick reviews the six-mask sheet; no remaining implementation decision. No need to open the other app for a blocker; switch to Claude when ready to continue its integration. Roster/P2/new intake remain held.
