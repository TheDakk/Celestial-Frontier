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

## SESSION HANDOFF — 2026-09-12 · v4.2 ART CANDIDATES AWAIT ACCEPTANCE

**STOP for Nick's visual acceptance before any battle staging.** Applied the approved
v4.2 diff from d2b8d8cd with all three user amendments: Arena FAR opaque, MID/NEAR painted on
magenta then keyed (no extracted masks); ground y=0.78; class enumerations in 0/1/5/6 and
Effects anchor JSON. Frozen paragraph and 4E unchanged. Final diff, all six exact prompts,
masters, keyed review copies, composite, anchor JSON and intake are retained at
audits/ARENA_EFFECTS_V42_PROOF_20260912/README.md. Built-in imagegen: six calls, no rerolls.
The supplied ART_KIT_V42_REVIEW_20260912.md was absent from the stated path and Downloads;
Nick's explicit message supplied sufficient approval/amendments. Do not claim it was read.

Earth temperate plates delivered 1672x941; Wild/Savage Maw launch/travel/impact 1254 square.
All exceed runtime floors. Shared ground line is registered in the recipe; MID is solid and
NEAR transparent at both stands at y=0.78. Authoring seed derives from fixed proof battle
context, never clock; system card is copied verbatim from preserved Earth compiler output.
No hand-typed card. NEAR is roughly the lower fifth, beyond the requested lower tenth.
MID and effects have unresolved key-edge pixels; phase positions differ from requested
percentage anchors. Actual per-phase anchors and measured alpha bounds are recorded.
No qualityAccepted flag is true, no production-ready or clean-edge claim. Masters unchanged.
The ordinary-game accepted painting remains rain E; no local model/finisher/3D run occurred.

**After art acceptance:** stage Civet versus Platypus with the parts rig in this arena;
GSAP shared tweened key poses, easing/anticipation/overshoot/secondary motion, Mac 60 fps,
phone 30 fps budget. Run-up <0.5 s, attack 0.5–0.75 s, hit ~0.3 s, return <0.5 s, brief
hitstop/flash/shake/damage number/quick timing bar. Then ten-second Civet, fox and procedural
quadruped captures. No per-creature clip edits. Prior continuous mesh failed shape despite
exact rest; retained whole-portrait fallback captures are not accepted articulation. Keep
turnaround/canid masters for the later engine port; Blender projection remains abandoned.

Arena runtime still to implement: biome-family template + compiler-filled home-world card
+ stable battle-context seed. Wild uses wild home; guardian lair and One signature; duel
hosts alternate by round with seeded initial host. Phone composes card-lit plates without
finisher, desktop may finish. Cache like originals. No delivery engineering this batch.

Tooling already signed in 3404e5d3: game gsap 3.15.0 / @pixi/particle-emitter 5.0.10; v2 dev
free-tex-packer-core 0.3.9 / CLI 0.3.0. GSAP timelines selected. Emitter Pixi 6/7 peers are
incompatible with direct Pixi 8.19.0 attachment; resolve renderer and seeded explicit-time
integration before effects use. No pin change or second renderer silently. Deterministic
one-atlas-per-creature command uses sorted hash-bound copies, fixed padding/extrusion and
no timestamp metadata. pngquant/oxipng approved idle tools; optimize copies only, never masters.

Focused compiler tests (22) and keyer tests (7) with negative controls, v2 TypeScript and root
validate pass. Initial stale-version and threshold-boundary test failures are preserved with
corrections; no native or hosted retry. Details in the proof README. No checkout lock in tests.

After the proof: up to six deterministic no-inference weather variants (sky-facing sheen,
wet-fur value/contrast, foreground streaks at plate-sky density), beside E/triptych for a pick.
Then at most three ~1 GB redistribution-permitted finisher candidates on Mac with same
composite/masked0.35/compatible embedding; one best-candidate phone attempt. No delivery
engineering before that result. Klein phone probing stopped. iPhone17Pro/iOS26.6.2/USB-C;
normal Safari quota1,048,576,000 vs expanded Klein transformer4,393,808,634 bytes. Prior
session loss not established OOM. Certificate left installed. Rain E source8b01e38c/evidence
aaacfd6f retained; original and raw finisher intact.

Clean promotion: prune superseded code/pack assets on openai/mac first, then three ordered
squash tiers into develop (production UI; painted landfall engine; research tools), then one
develop→main full-chain release PR. No Ready PR until Civet proof, weather pick and phone-tier
decision land. Audits LFS decision pending; no history rewrite. PR42 parked. GitHub step NONE.

Ownership: OpenAI/Codex macOS, /Users/nick/Projects/celestial-frontier-openai-mac, openai/mac
tracking origin/openai/mac. Pre-batch signed HEAD3404e5d3:63 ahead upstream/174 ahead cached
origin/develop, zero behind; final art/code/doc commit follows. Unrelated .DS_Store excluded.
Reuse September12 startup receipt (Node26.8.2). Codex waits for art acceptance; Claude Code
need not open/sync. Budget UNFROZEN/public assumption/private cap3000; zero hosted writes or
attempts authorized. No PR now, no release/deployment. Local work is not in develop/main.
