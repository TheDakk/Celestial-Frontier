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

## SESSION HANDOFF — September19 · R2c‴ constructor correction, acceptance pending

Nick's read-only reviewer§11 diagnoses R2c″ rejection as an instrument defect: preserved
edge rounding −8.975276662232845e−16 was rejected without the constructor's existing1e−8
rounding allowance. One authorized runtime change: reject barycentric<−1e−8; use stored
values unchanged. No other runtime/binding/input/limit/gate change. Prior signed S2 packet8ecb9209
retained. Node26.9.0 uninterrupted startup receipt reused.

Current evidence: audits/ANATOMY_SINGLE_RUN_20260919/R2c-triple-prime/README.md.
25contact tests pass including regenerated real-binding constructor, unchanged negative
coefficient/+0prediction control within1e−12normalized units and −1e−3 rejection with sum1.
Initial test compared pixels (1.28356e−12px), retained; corrected to API prediction units.
TypeScript invocation typo retained/corrected; TypeScript and rootvalidate pass.
Next sign/verify producer, native rest [melee:bite] unchanged inputs, unpinned candidate10
negative control, six-subject sweep. Shared red halts with no further variant; if green
continue all§8 without review stops. Existing expected pose-exporter module reds untouched.

No fetch/push/PR/label/merge/release/deploy. PR42parked; Claude read-only/no app switch or sync.
Pre-existing.DS_Store untouched. Every commit signed and independently verified.
