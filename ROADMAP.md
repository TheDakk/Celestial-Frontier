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

## SESSION HANDOFF — 2026-09-13 · Pack6 / C2 rest admission

Pack6 committed verbatim18bd7368 after staged C2 sourcec1452f46.23provided paths verified
in audits/LONG_SESSION_20260913/pack6-receipt.json; prior Codex LOG retained verbatim in
LOG-CODEX-PRE-PACK6.md. Pack6 supersedes Pack5. WORK_ORDER/CONTRACTS/LOG-A11/LOG-B govern.
MOTION_KIT/SOUND_KIT are supplied bytes; their implementation claims describe Claude's lane.
Nick's delegated decisions are adopted: study audio through decorativeVoicePort(); impact
image holds240ms after hitstop then fades120ms. No additional kit wording changed.

C1 mechanical intake COMPLETE; Nick owns final image acceptance. Both impact clusters are
accepted master paint; no further Wild correction, erosion, repaint or generation. Current
anchors retain targeted impact,second-pass travel,unchanged launch; MID accepted. Art Kit4.3
and frozen style/4E unchanged. The10unpainted effects remain explicitly procedural until Nick
schedules4K. No Blender/projection/texture-finisher work.

C2 rest admission: CreatureRigV1 uses record joints/local offsets/body-length units and
inherited transforms. Civet32parts with10turnaround underlaps,fox22authoredparts,procedural21
painter-emittedparts all pass native WebGL master comparisons:0changedRGBAchannels each.
Evidence: audits/C2_PARTS_ATLAS_20260913/native-rest-02 (Civet),native-fox-rest-01,
native-procedural-rest-01. Missing-head mutants change234525/284037/6832channels respectively;
mean empty-pose update0.0068/0.0069/0.0066ms. These are NOT60fps,motion,contact or staging gates.

Procedural capture originally perturbed ordinary paint; native-painter-parts-01/02 preserve
those refusals. Current observation finishes ordinary paint first, then replays the same seeded
winning owner solely for masks. Original ink stays authoritative; replay anatomy/material and
full original-alpha coverage must agree. native-painter-parts-03 on782e827a passes0ordinary
render differences,34714paintedpixels,21parts,31quadrupedjoints,actualsurface translucent.
Newrecord/master/labels/declaration there. Atlas procedural/ is543x261,0packedpixel changes.
Only four-legged banded-tail observer capture is implemented; other families must emit actual
LOG-A11/LOG-B inventories in future, never synthetic records labelled real. Fox has no supplied
turnaround/patches; no invented asset. Per-creature part data is allowed; clips stay shared.

body-cards-01 contains actual read-only Claude compiler outputs for Civet/fox/procedural and
idle/melee/hit timelines, source/input hashes. Repeated outputs identical; missing-head controls
refuse. Civet small0.85/furred,fox medium1.0/furred,procedural huge1.4/translucent. Explicit
record fields still missing: mass,locomotion,realm,weapons,luminous,numeric rotation/secondary
limits. Compiler supplies named mappings or procedural genome/template defaults; cards' notes
are empty. No manually typed card or changed per-creature curves.

NEXT C2: producer gsap-adapter still broadcasts root translation to all joints, compounding
inherited local offsets. Do not change our contract to hide it. Read-only probe, one-line patch
and copy-ready Claude prompt at audits/C2_MOTION_INTEROP_20260913/. Nick was asked whether
Claude should fix or grant a one-time exception; no answer/exception yet. Protected source
untouched. Once corrected: focused interop, Motion-timed joint/ground/contact qualification,
Civet–Platypus turn in accepted3platearena,10second Civet/fox/procedural captures for Nick.
C2 is not complete. Do not invent a GSAP acceptance from static rest or sampled timelines.

C3 follows C2: original rights-recorded quadruped archetype,Wild/battle sets,temperate rain/fur
impacts. CONTRACTS1 exact filenames,48k24bitmono dry WAV plus Opus/SHA. Placeholder synth is
not C3; first new sound class stops for Nick. C4 twelve-at-time approved-order library/arenas,
every sheet Nick's eye. C5 prune openai/mac then3MERGE-COMMITtiers into develop: production UI,
painted engine,research tools as tools. No new branches; LFS rewrite only on Nick's explicit go.
No PRReady before Civet/weatherpick/phone-tier. PR42parked. RainE retained/active; secondweather
ladder,up-to3redistributable~1GBMacfinishers then1phoneattempt queued. Klein stopped; no delivery
beforephone-tierresult. Future develop→main release separate exact authorization/full chain.

Ownership: OpenAI/Codex on macOS,/Users/nick/Projects/celestial-frontier-openai-mac,openai/mac
tracksorigin/openai/mac. f5e17fb8=89aheadupstream/200aheadcacheddevelop,0behind; signing works.
Uninterrupted September12toolchain receipt reused. No Github write/Actions,push,label,dispatch,
merge,release,deploy or history rewrite. Claude owns motion/,effects/,battle2/,soundkit/,
worldlife/ and their tests. No main.ts hunk. Claude's next action is the prepared producer fix;
Nick may pass its review prompt in Claude, no routine branch sync needed. Current targeted
checks/typecheck/rootvalidate pass;24preexistingfullsuitefailures remain C5,not rerun.

## C2 motion continuation — corrected producer admitted

Interop response/probe committed verbatim e92941cb. ZIP also contains protected source/test
files; only the two expressly requested audit paths were imported. Corrected source SHA
6a206acdae092961ca21245c5f00949bcaab53e27bffbac01837210181cf4c74 verified read-only in Claude's
tree. Nick identifies64bef82e; supplied response mentions45beca27. Exact file hash matches.
Ownership exception no longer needed; no protected modules changed or merged into this tree.

Record-driven contact solver uses existing two-bone kinematics; planted idle/hit preserves
actual paw positions/perspective offsets, flight passes through. Family compression cap8%body
length; unreachable contacts refuse, never slide the paw. Seven focused rig/contact tests pass
with unconstrained-paw,unreachable-target and wrong-family negatives. Typecheck/rootvalidate
pass. These are mechanical precursor checks, not motion/shape/60fps acceptance.

parts-motion-runner/entry load the3real atlases, current Wild registered images and accepted
arena. Compile actual Claude cards/timelines read-only into a temporary browser bundle; no
source copied into tree. GSAP poses are batched once per frame, constrained by anatomy; same
curves on every creature. Captures contain an outgoing and incoming turn beside accepted rainE,
seeded Pixi8 effects,240msimpacthold,kit choreography. Existing whoosh/ping only; C3 pending.
Native first run is NEW audits/C2_PARTS_MOTION_20260913/proof-01 after commit. All failures kept;
no automatic retry, no kit/main.ts/GitHub edit. Stop at ten-second captures for Nick's eye.
