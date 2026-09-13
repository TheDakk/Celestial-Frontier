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

## SESSION HANDOFF — 2026-09-13 · C1 v4.3 DIFF AWAITING APPROVAL

Nick authorizes continuation through C1–C5 without repeated proceed questions. Stop for kit
wording changes, first image/sound of a new class, GitHub writes, history rewrites, or scope
questions; every C4 sheet also stops for Nick's eye. Report each package with the evidence
specified in the supplied work order, and log each package in audits/LONG_SESSION_20260913/LOG.md.

Supplied arena review, revised world-life MOTION_KIT.md and SOUND_KIT.md committed verbatim
in8a2dfdc0. Hash/byte receipt: audits/LONG_SESSION_20260913/supplied-kits-receipt.json. The kits'
PROPOSED labels are supplied bytes; Nick's existing approval remains authoritative.
WORK_ORDER.md received September13 from Nick's explicitly attached sibling-worktree file,
read and retained verbatim at audits/LONG_SESSION_20260913/WORK_ORDER.md. Hash/byte/source
receipt: work-order-receipt.json beside it. No sibling worktree edit or Git operation.
Nick says more material is coming; current C1 kit-wording approval stop remains in place.
C1 proposal: audits/LONG_SESSION_20260913/ART_KIT_V43_PROPOSED.diff. Exact eleven review rows,
all game accents source-verified, accent-only/body-colour rule and subject-slot binding.
Canonical ART_KIT.md unchanged v4.2; frozen style/4E unchanged. STOP for Nick's diff approval.
No new painting or sound in this batch. After approval use identical canvas/origin/contact
across Wild phases and retain per-phase JSON fallback; existing4K already requires registration.

C1: propose v4.3 theme material table from the review; stop for wording approval; then repaint
Wild once with common-canvas registration, retaining per-phase anchor JSON as fallback. Game
hexes stay unchanged and are accents only. Arena FAR/MID/NEAR are accepted template v1.
MID's intake-only despill is already complete in signed 07c93945: exactly190 RGB pixels on a
copy, zero alpha changes, originals unchanged. Do not repeat the applied pass. Evidence:
audits/ARENA_V1_ACCEPTANCE_20260912/{acceptance.json,despill-receipt.json,arena-template-v1.png}.
Wild shapes/phases accepted, palette rejected; no accepted complete Wild sequence yet.

C2: parts masks per authored master, turnaround joint patches, painter-emitted procedural
parts, pose application and one deterministic atlas per creature with pinned packer. Compile
body cards from resolved anatomy using Motion Kit §§3–6; report absent fields. Civet versus
Platypus in accepted arena with Motion timings; ten-second Civet/fox/procedural captures.
C2 interface: load parts for a resolved record; apply a pose of joint rotations and offsets;
expose part display objects and pivots. Claude's fixture uses this same contract until C2 lands.
Claude owns the body-card compiler (A1), effects sequencer (A2), battle scene adapter (A3), sound
derivation (A4) and world-life (A5). Codex supplies rig/parts and source assets, without editing
those modules. Effect anchors schema: cf.effect-sequence-anchors/v1. Missing anatomy fields
must produce named refusal. No more continuous-mesh repair, Blender projections or texture
finisher passes. Retain older proof evidence/assets.

C3: quadruped voice archetype, Wild theme set, battle set, temperate rain bed, fur impacts;
rights recorded; 48kHz WAV masters plus Opus. Derive Civet/fox/procedural voices from one
archetype. Motion/Sound frozen paragraphs already approved; do not ask again. SOUND_KIT v1
approved by Nick, frozen text unchanged. Root MOTION_KIT now includes the supplied world-life
layer. Both retain supplied PROPOSED status labels verbatim. First new-class sounds require
Nick's review; the parts-rig body-card audit still reports missing record fields.

C4: approved-order library batches of twelve, arenas per biome family; stop at every sheet.
C5: prune on openai/mac, then promotion tiers into develop with MERGE COMMITS, not squash:
production UI; painted landfall engine; research tooling merged as tools. No new branches.
Audits LFS migration approved in principle, performed by Codex on openai/mac only when Nick
says go; no history rewrite now. No PR Ready before Civet proof/weather pick/phone-tier decision.
One later develop→main release PR with full chain and separate release authority. PR42 parked.

Claude now works on anthropic/mac, which Nick reports contains Codex history, on new motion/,
effects/, battle2/, soundkit/, worldlife/ modules and their tests. Codex must not edit those
paths. Any main.ts hunk must be announced in its commit message. No main.ts change this batch.
No need to open Claude Code now; continue assigned disjoint work, no synchronization requested.

Prior emitter replacement is local/tested: Pixi8 ParticleContainer, recipe-seeded absolute-time
updates, no peer override/second renderer; not yet battle-wired. Three emitter and two despill
tests, v2 TypeScript and root validate passed in07c93945. All approved masters immutable;
PNG optimization copies-only; GSAP3.15.0 and packer core0.3.9/CLI0.3.0 remain pinned.
Rain E remains accepted/active; raw finisher and originals retained. Existing weather and phone
follow-ups remain recorded; the supplied work order does not place weather/phone evaluation
within C1–C5. Preserve those queued requirements and resolve scope when their order matters.
Klein phone probing remains stopped; no delivery engineering before phone-tier result.

Ownership verified: OpenAI/Codex, macOS, /Users/nick/Projects/celestial-frontier-openai-mac,
openai/mac → origin/openai/mac; SSH origin git@github.com:TheDakk/Celestial-Frontier.git.
Pre-intake commit e89cb621:69 ahead upstream/180 ahead cached origin/develop, zero behind. No remote
refresh needed or performed; .DS_Store excluded. Current budget file says UNFROZEN, but Nick's
explicit GitHub step NONE controls: no push/label/dispatch/merge/release/deploy or hosted attempt.
This batch is documentation only; no runtime/build/render or tool maintenance needed.
