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

## SESSION HANDOFF — 2026-09-12 · 2D CIVET PROOF

Current instruction: replace abandoned Blender projection with one reusable 2D deformable-mesh
quadruped template over the accepted Civet, fox family reference and one painter-emitted
procedural quadruped. Retain turnaround and canid masters for later engine port. No more 3D
tokens/projections, texture finisher, effect painting, kit edits or Klein phone probing.
Shared finite idle/attack/hit and a staged Pixi turn beside accepted E; stop at ten-second
captures for Nick. Explicit whole-portrait fallback if rest/shape cannot hold. Full details,
authority reconciliation and limitations: audits/CIVET_2D_PROOF_20260912/README.md.
First native source2c33f8c7: exact rest passes for all three; shape fails and all use labelled
whole-portrait fallback. First capture durations were short; one recorder-only correction is
prepared, with no artwork/curve change. Capture again and verify durations independently. Three new template tests/negative controls,79 existing
bridge/kinematics/rig tests, package TypeScript and root validation PASS. No normal-game battle
route changed. Keep the source clean and signed before the isolated native runner.

Claude's four latest supplied files committed verbatim in signed7f2aa40b; hashes match
/Users/nick/Downloads/claude-reviews-20260912-civet-and-promotion.zip. Supplied historical kit/
Blender restart prose remains verbatim evidence; Nick's current 2D approval governs execution.
No earlier pending larger-Blender-rework question remains active.

Accepted ordinary-game painting: rain E (droplets3x/specular3x/rain2x), original and raw finisher
retained; activation8b01e38c and normal-game evidenceaaacfd6f accepted. After this proof: up to six
new deterministic weather variants (sky-facing sheen band, wet-fur value/contrast compression,
foreground streaks at sky density), no inference, beside E/triptych for Nick's pick. Then at most
three redistribution-permitting approximately1GB phone finisher candidates tested on Mac with
the same composite, masked0.35 and compatible precomputed embedding; one best-candidate phone
attempt, no delivery engineering before result. Klein phone probing stopped by Nick. Earlier
session loss is not established OOM: normal Safari quota1,048,576,000bytes and expanded transformer
4,393,808,634bytes. Phone17Pro/iOS26.6.2/USB-C; CF Local Probe certificate left installed for now.

**Clean promotion plan:** prune superseded code and pack assets on openai/mac first; split PR42
into three ordered squash-merged tiers into develop (production UI; painted landfall engine;
research tools); then one develop→main release PR with the full chain. Ready no PR until the
Civet 2D proof, second weather pick and phone-tier decision have landed. Audits LFS migration
awaits Nick's decision; do not rewrite history. Detailed supplied plan:
audits/CLAUDE_FULL_REVIEW_20260910/CLEAN_PROMOTION_PLAN.md. This records future order only.

Ownership: OpenAI/Codex macOS, /Users/nick/Projects/celestial-frontier-openai-mac, openai/mac
tracking origin/openai/mac. Signed7f2aa40b is55 ahead upstream/166 ahead cachedorigin/develop,
zero behind both; scoped 2D source/doc commit follows. Unrelated.DS_Store untouched. Reuse
September12 startup receipt (Node26.8.2). GitHub step NONE; PR42 parked; zero hosted attempts
or GitHub writes authorized despite budget UNFROZEN/public/private fallback3000. No PR needed
now, no release/deployment. Claude Code need not open/sync; local changes are not in develop.

Recorder-only source2652f5cb timed out before returning a capture; attempt-02 retains it.
Next uses real native input for the audio gesture plus explicit bounded startup diagnostics.
Art/curves unchanged; no new art attempt and no mesh-success claim.

Source4eb7e24c diagnosed recorder-start deadline: zero-rate canvas stream needs a new draw
before first frame request. Add that rest draw; retain attempt-03; art/curves still unchanged.


**Current stop:** signed HEAD4eb7e24c (58 ahead origin/openai/mac,169 ahead cachedorigin/develop,
zero behind). The one-line recorder first-frame fix and attempt-03 evidence are staged. Two
attempts to sign it failed with "1Password: agent returned an error"; no new commit exists.
Nick has been asked to unlock/allow Git signing. After it works, sign staged work, verify it,
then run the isolated recorder once into a NEW output directory; check ffprobe durations.
No rig/art/curve parameter change is authorized by that recorder repair. The native geometry
finding remains failed; captures must say whole-portrait fallback. No ten-second file is yet
qualified; first short videos remain at /private/tmp/cf-quadruped-proof-20260912-01. Refresh
references and retain final media/receipts, then stop for Nick's review. No queued work starts.
