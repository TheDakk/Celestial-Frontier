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

## SESSION HANDOFF — 2026-09-12 · TOOLING CONFIGURED; v4.2 STILL AWAITS APPROVAL

Tooling batch: game app has exact gsap 3.15.0 / @pixi/particle-emitter 5.0.10; port/v2
has dev pins free-tex-packer-core 0.3.9 / CLI 0.3.0. Supplied TOOLING_ADDITIONS_20260912.md
is verbatim under CLAUDE_FULL_REVIEW_20260910. pngquant 3.0.3 / oxipng 10.2.1 CLI versions
recorded by updated toolchain --check; missing tools warn. UI_TOOLCHAIN owns the contract.
New rig-atlas.mjs runs sorted, hash-checked copies through the CLI, fixed padding/extrusion,
one atlas, no timestamp metadata; only synthetic fixtures packed. Never optimize master bytes.
GSAP paused timelines are selected for the future parts rig. Emitter 5.0.10 requires Pixi 6/7
peers, while game stays 8.19.0; resolve renderer and seeded/time integration before effects use.
Installed does not mean integrated. No runtime proof, paintings or active kit edits this batch.
Nine focused tests with missing-tool, malformed-version, hash, duplicate, overwrite and atlas-overflow
controls passed; CLI atlas pixel/repeat identity, toolchain --check, v2 TypeScript and root validate
passed. Package/version receipts are under audits/TOOLING_ADDITIONS_20260912/.


**STOP for Nick's approval before painting.** Exact two-addition patch and compiler/staging
contract: audits/ARENA_EFFECTS_V42_PROPOSAL_20260912/PROPOSAL.md and
ART_KIT_v4.2.proposed.diff. Active ART_KIT.md is unchanged v4.1, including frozen paragraph
and 4E. Proposed additions: Arena profile under planets (far/mid/near biome-family plates),
and Effects cut-out sequences for the eleven source ability themes (launch/travel/impact).
The latest supplied Civet review is retained verbatim at
audits/CLAUDE_CIVET_REVIEW_20260912/CLAUDE_CIVET_ARCHITECTURE_REVIEW.md.
Its older stepped-playback instruction is superseded by Nick's explicit smooth 60 fps motion.

**After approval:** paint only Earth temperate arena far/mid/near and one Wild effect sequence;
stage Civet versus Platypus with a parts rig, then show the proof. The former proposed
continuous-mesh repair is superseded. Use strong shared key poses, easing, anticipation,
overshoot and secondary motion; Mac 60 fps / phone 30 fps budget. Combatants face each other
at one third to one half frame height. Parallax run-up <0.5 s, attack 0.5–0.75 s, hit about
0.3 s, return <0.5 s; brief hitstop, flash, shake, damage number and quick timing bar.
Arena recipe = biome-family template + compiler-filled system card + stable battle-context
seed, never clock. Wild uses its home world; guardian its lair with the system's One signature;
duels alternate home by round with seeded initial host. Phone composes template/card lighting
without a finisher; desktop may finish. Cache through originals lifecycle. No implementation,
painting, inference or browser work in this proposal batch. Full effects/library rollout waits.

Prior ten-second captures from native fb008d58 remain labelled WHOLE-PORTRAIT FALLBACK at
audits/CIVET_2D_PROOF_20260912/captures/. Rest matches all three masters exactly; continuous
mesh failed shape, including eight unreachable fox IK samples. Captures do not qualify
articulated motion or normal-game integration. Signed 7a2e5312 retains their evidence.
Painter-drawn Civet geometry remains authority over unused QUAD2 values; authored masters
retain hash-bound pose records. No genes override named Earth anatomy. Turnaround/canid
masters remain for later engine port; no new 3D tokens/projection or texture-finisher passes.

Accepted ordinary-game art remains E (3x droplets / 3x specular / 2x rain), source 8b01e38c,
browser evidence aaacfd6f; original and raw finisher retained. After the proof: up to six
no-inference weather variants using sky-facing sheen, wet-fur value/contrast compression and
foreground streaks at plate-sky density, beside E/triptych for Nick's pick. Then at most three
approximately 1 GB redistribution-permitted finisher candidates on Mac, same composite and
masked 0.35 with compatible precomputed embedding; one best-candidate phone attempt.
No delivery engineering before that result. Klein phone probing stays stopped: normal Safari
quota 1,048,576,000 bytes versus expanded transformer 4,393,808,634 bytes. Prior session loss
is not established OOM. Target iPhone 17 Pro / iOS 26.6.2 / USB-C; certificate left installed.

**Clean promotion plan:** prune superseded code and pack assets on openai/mac first, then
three ordered squash-merged tiers into develop: production UI; painted landfall engine;
research tools. One develop→main release PR with the full chain follows. Ready no PR until
Civet 2D proof, second weather pick and phone-tier decision have landed. Audits LFS migration
awaits Nick's decision; no history rewrite. Detailed supplied plan:
audits/CLAUDE_FULL_REVIEW_20260910/CLEAN_PROMOTION_PLAN.md.

Ownership: OpenAI/Codex macOS, /Users/nick/Projects/celestial-frontier-openai-mac, openai/mac
tracking origin/openai/mac. Signed proposal d2b8d8cd: 62 ahead upstream, 173 ahead cached
origin/develop, zero behind. Tooling commit follows; unrelated .DS_Store excluded.
Reuse September 12 startup receipt (Node 26.8.2). GitHub step NONE; PR42 parked. No hosted
attempts, writes, release or deployment authorized. Codex waits for the two kit additions'
approval; Claude Code need not open or sync, and these local changes are not in develop.
