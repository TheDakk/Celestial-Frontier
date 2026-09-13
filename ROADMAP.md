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

## SESSION HANDOFF — 2026-09-12 · ARENA v1 ACCEPTED; v4.3 REVIEW FILES NEEDED

STOP at the v4.3 proposal/approval boundary. Missing supplied files: ARENA_EFFECTS_REVIEW_20260912.md
(the eleven-row material table) and revised MOTION_KIT.md including world-life. Neither is in
this worktree/Downloads; path question is pending. Do not invent the ten unknown theme rows or
world-life text. Current ART_KIT.md remains v4.2; no repaint. Known Wild row/rules and exact
remaining order: audits/ARENA_V1_ACCEPTANCE_20260912/V43_PENDING.md.

Arena FAR/MID/NEAR from75a5c4a4 ACCEPTED as template v1. Acceptance manifest and one corrected
MID copy at audits/ARENA_V1_ACCEPTANCE_20260912/. Exactly190 RGB pixels corrected in one applied
pass, all alpha and accepted masters unchanged. Initial guard found212 total residual edge
pixels and wrote nothing; corrected selection reconstructs exactly the original190 unresolved
cases. It does not recolour the other22. No repaint. Wild shapes/phases ACCEPTED, palette
REJECTED (reads Frost); retain per-phase anchor JSON as fallback. No current Wild art accepted
as a complete effect. Active ordinary-game rain E remains unchanged.

v4.3 must be a proposed diff: closed eleven-theme material/shape table in Effects, game hex
accent only. Wild = claw rake, fur tufts, torn leaves, kicked earth, wind streaks in warm ochre
and earth tones, #9fb6d6 sheen. Game theme hexes unchanged. Show full diff and stop for Nick.
After approval repaint Wild launch/travel/impact once with common-canvas registration.

Motion/Sound frozen paragraphs are APPROVED. SOUND_KIT.md status metadata now approved v1,
frozen text unchanged. Revised Motion Kit commit waits for supplied world-life file; older
proposed13,236-byte root retained meanwhile. Do not ask for frozen approval again. Compile
Civet body card from resolved anatomy per Motion §§3–6 and use mass-scaled timings; report
missing mass/locomotion/realm/per-part materials/secondary order/weapons/luminous/joint limits
rather than interpreting raw genes for named Earth anatomy. Prior gap audit retained.

First sound work is authorized when the order reaches it: quadruped archetype voice set,
Wild theme set, battle set, temperate rain bed, fur impacts only. Derive Civet, fox and one
procedural voice from the one archetype, present all three side by side to listen, and wire
approach, strike, hitstop, impact, hurt, damage ticks, victory. None recorded/derived/wired
in this batch. Then Civet–Platypus parts-rig turn in accepted arena v1 with repainted Wild,
and ten-second Civet/fox/procedural captures. No new 3D/projection/texture-finisher work.

Tooling correction done: @pixi/particle-emitter removed with37 unused transitives; game stays
Pixi8.19.0. SeededBattleEmitter uses actual Pixi8 ParticleContainer, finite recipe-seeded
coefficients and absolute elapsed-time updates, <=200 particles, caller-owned texture.
Three tests: clock/RNG refusal, seed mutation, 30/60Hz and seek equality, real Pixi object
updates/disposal, budgets/time refusal. No browser/performance or game-wiring claim.
Tests live in app source beside other Pixi tests: root strict types collide with Pixi's
bundled WebGPU declarations, already isolated by the existing app tsconfig. No typecheck
flags weakened. Two targeted-despill tests pass, v2 TypeScript and root validate pass.
GSAP3.15.0/core0.3.9/CLI0.3.0 remain pinned; deterministic one-atlas tool unchanged. PNG masters
immutable; optimizers copies-only, approved idle policy unchanged. No unit checkout lock.

After proof: second no-inference weather ladder (sheen/value/foreground rain), then up to3
~1GB redistribution-permitted finisher candidates on Mac, one best phone attempt. Klein phone
probing stopped; no delivery work before phone result. iPhone17Pro/iOS26.6.2/USB-C. Retain rain
E/original/raw finisher, old fallback captures and canid/turnaround assets for later port.

Promotion: prune superseded code/pack assets on openai/mac, three ordered squash tiers to
develop (UI; landfall engine; research), one develop→main full-chain release. Ready no PR until
Civet proof/weather pick/phone-tier decision. LFS migration pending Nick; no history rewrite.
GitHub step NONE, PR42 parked. No hosted write/attempt, release or deployment authorized.

Ownership: OpenAI/Codex macOS, /Users/nick/Projects/celestial-frontier-openai-mac, openai/mac
tracking origin/openai/mac. Pre-batch1e65e006:65 ahead upstream/176 ahead cached origin/develop,
zero behind. Local completion commit follows; unrelated .DS_Store excluded. Reuse Sept12
startup receipt (Node26.8.2). Claude Code need not open/sync; local work is not in develop.
