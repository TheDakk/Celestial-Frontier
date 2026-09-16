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

## SESSION HANDOFF — 2026-09-16 · whole-animal animation

Verified OpenAI/Codex on macOS, `/Users/nick/Projects/celestial-frontier-openai-mac`,
`openai/mac`, tracking `origin/openai/mac`. Signed starting head `b79fd32e` is 117 ahead
cached upstream and 228 ahead cached `origin/develop`. This is the uninterrupted toolchain
session; reuse its startup receipt and do not update tools during active evidence jobs.

Nick's animation direction is recorded in
[audits/C2_CONTINUOUS_SKIN_20260916/UNIVERSAL_ANIMATION_PLAN.md](audits/C2_CONTINUOUS_SKIN_20260916/UNIVERSAL_ANIMATION_PLAN.md).
Accepted painted creatures must feel alive and attack with anticipation, weight and recovery.
The delivery architecture is a shared runtime plus anatomy-specific templates driven by actual
painter-emitted anatomy/material/part records, covering land, air, water and rooted organisms.
Qualify each family and its procedural extremes; neither a family registry nor the Civet proof
establishes universal coverage. Hidden surfaces/turning views require actual source coverage.
Physical iPhone performance remains a separate qualification at the approved 30 fps budget.

Latest bounded batch: [universal pose foundation](audits/UNIVERSAL_ANIMATION_20260916/README.md).
The actual rig uses `skeleton-pose.mjs`, taking each owner's graph and body axis; asset admission
remains quadruped-only. Read-only producer interoperability passes 14 templates / 161 actions /
4,644 samples (13 synthetic family records). The observer refuses extra-leg records instead
of overwriting fore/hind joints; ordinary drawing is unchanged. 121 tool tests, 20 focused tests,
game/package types and root validation pass. New native gates preserve all 30 prior C2 PNG bytes;
films measure 60.003/60.002/59.903 fps and CPU p95 1.4/1.7/0.9 ms. These remain dirty diagnostics.
Next code package: actual bird painter geometry/part observation, then family asset admission,
real reuse controls and ordinary two-combatant integration under the existing ownership contract.
Do not relabel synthetic motion fixtures as real painter coverage. Physical iPhone remains separate.
The earlier six review ZIPs are unchanged; this batch supplies a separate review addendum.

Preceding C2 repair replaces stretched seam bands with continuous source-painted skin, split at
independent limb surfaces and joined at real proximal body attachments. It preserves source
masters, atlas bytes, part count, depth, bone curves and contact bounds. A fixed local shape
solver and compiled sparse weights deform the skin; actual rendered paw contours and original
source joins are measured independently. The current producer is read-only Claude GSAP adapter
SHA-256 `6a206acdae092961ca21245c5f00949bcaab53e27bffbac01837210181cf4c74`.

Current audit: [README](audits/C2_CONTINUOUS_SKIN_20260916/README.md) and
[review prompt](audits/C2_CONTINUOUS_SKIN_20260916/REVIEW_PROMPT.md). Prior native diagnostics
are retained, including a timing failure, painted-paw drift, missed face orientation, and source
attachment gaps that earlier positive-triangle checks did not detect. Candidate10 closes the
body joins and fixes the intervening Fox fold through consistent shared-socket influence spaces.
Native12 passes all three on the actual Kernel05 Wasm normal-pass leaf: 1,201 samples each,
rest/final-rest zero changed channels, inclusive gate-loop CPU p95 0.60/0.70/0.30 ms. Actual normal
passes are 4,844/4,840/4,840 for Civet/fox/procedural, with zero robust fallbacks. The consumer
smoothly releases/reacquires support and preserves one idle phase across both turn roles;
disposable internal sampling guards remove texture-cut hairlines without changing source bytes
or rest pixels. Kernel05's 117 Node tests, 15 runtime tests, game typecheck and root validation
pass, including the unchanged 50-probe deterministic fingerprint. Unprofiled Motion06 delivers all three
ten-second diagnostic films at 60 fps and update p95 1.6/1.7/0.9 ms, meeting the unchanged strict
<2 ms gate. Earlier red receipts remain retained. Dirty diagnostic evidence is not clean-source
qualification or visual acceptance. No further optimization loop is planned.

Review: the latest `audits/UNIVERSAL_ANIMATION_20260916/motion-01/*-10s.webm` films and
byte-identical native pose images for actual
painted shape and fluid motion; after the signing refusal is resolved, obtain clean signed-source
native rest/contact/continuity/CPU gates and exact-source ten-second Civet, fox and procedural
arena films on unchanged source. Require rest/final-rest zero changed channels, no skin tears or
spikes, planted paint within one native pixel, unchanged 8% contact compression bound, CPU p95
under 2 ms, and actual 60 fps capture evidence. The same template/curves must serve all three.
Do not weaken motion or substitute a labelled portrait fallback as completed articulated C2.
Nick owns visual acceptance. Ordinary-game rig integration and other family qualification follow
through the agreed CreatureRigV1 contract; Claude's owned modules remain read-only here.

C3 audio remains at signed `b79fd32e`: 1,669 source entries / 1,665 unique originals, 1,662
fully decode, three quarantined; 1,617 validated WAV/Opus pairs and 203/631 fauna reference
identities, with 428 still missing. References are not species-behavior/listening acceptance.
43 biome recipes have 486 routes (484 rendered, two intentional silences). Consolidated audio
review: `audio-production/REVIEW_PROMPT.md` and `REVIEW_PACKS.md`; 23 ZIPs below30MB. No new
ordinary-game audio promotion or phone proof. Preserve all authentic/fictional distinctions.

C1 mechanical intake complete; Nick owns final Wild acceptance. C4 stays twelve assets per
review sheet. Rain E active; second weather pick and smaller-finisher phone decision open.
Klein phone probes stopped. C5 pruning precedes three merge-commit tiers into develop (UI,
painted engine, research tools as tools). No PR Ready before recorded prerequisites; LFS only
on Nick's explicit go. No new branches, kit edits, GitHub writes, Actions, merges or deployment.
Budget file says UNFROZEN/public, private fallback3,000; Nick's GitHub-step-none still controls.

Codex continues C2 locally; no new commit has been created. Three signed-checkpoint attempts
were refused by the 1Password agent, including a PTY attempt. Nick has been asked to resolve the
signing refusal; no visible Git-signing prompt is confirmed. A read-only agent check finds the
configured public key matches one listed identity, but the refusal's cause remains unresolved
despite Nick's unlocked report. There is no unsigned fallback. Claude need not open or sync now
and does not have this uncommitted repair. Use the consolidated C2 review prompt when Nick
requests review. PR42 parked; develop/main/live site unchanged.
