# Cross-lane contracts (Claude lane → Codex lane)

Written 2026-09-13 so Codex's C2 (parts rig) and C3 (sound sources) match what Claude's committed packages already consume. Read-only for Codex; changes are negotiated in this file, not in code.

## 1. Sound sources for C3 (consumed by `soundkit/derive.ts`)

Deliver one **archetype source set** per family; the first is `quadruped`. Archetype keys are exactly: `quadruped, hopper, biped-bird, fish, insect, arachnid, serpent, myriapod, radial, cephalopod, flyer-membrane, primate` (plants have no voice).

Per archetype, one master per creature cue id: `call, alert, attack-vocal, hurt, faint, victory, breath-idle, land-thud`, plus `footfall-set` as four to six short steps. Masters: 48 kHz, 24-bit WAV, mono, under 2 s each (footfalls under 300 ms), peak −1 dBTP, no reverb baked in (the medium filter and room come from the voice card). Filenames are the wiring: `<archetype>.<cue>.wav` (footfalls `<archetype>.footfall-set.<n>.wav`). Record `rights` per master as today. Provide the file list with SHA-256; derivation hashes those bytes into every recipe.

Ability theme sets (Wild first): `<theme>.launch.wav`, `<theme>.travel.wav`, `<theme>.impact.wav` for the eleven themes `fire, frost, storm, tide, stone, venom, void, sand, chem, psionic, wild`. Battle set: `turn-ready, cursor, confirm, cancel, approach-start, hitstop-thump, flash-sting, shake-rumble, damage-tick, miss-whiff, dodge-swish, faint-fall, victory-sting, defeat-sting, battle-start, battle-end`. Ambience bed: `bed.temperate.wav` 24 to 40 s with a clean loop point stated in a sidecar JSON; weather layer `weather.rain.wav`.

The placeholder archetype Claude synthesized (`placeholder-quadruped`) is labelled non-shippable and is replaced the moment `quadruped.*.wav` exist.

## 2. Parts rig runtime interface for C2 (consumed by Claude's A3 battle scene)

```ts
interface CreatureRigV1 {
  readonly recipeHash: string;             // from the resolved-anatomy record
  readonly templateId: 'quadruped' | string;
  readonly parts: ReadonlyArray<{ id: string; display: unknown /* Pixi Container */; pivot: { x: number; y: number }; layer: 'far' | 'near' }>;
  readonly root: unknown;                  // Pixi Container holding all parts
  applyPose(pose: Readonly<Record<string, { rotation: number; dx?: number; dy?: number }>>): void; // joint name → radians and offsets in body-length units
  readonly bounds: { width: number; height: number; groundLineY: number }; // normalized cut-out space
  dispose(): void;
}
```

Joint names are the record's landmark names (root, pelvis, spine, chest, neck, head, jaw, the four legs Root/Knee/Ankle/Paw, tail0..3, earFar/earNear Root/Tip). Claude's motion timelines emit exactly those names. Until C2 lands, Claude's battle scene uses a fixture implementing this interface and labels its captures "fixture rig".

## 3. World-life display factory (already committed in `worldlife/pixi-adapter.ts`)

Wiring passes `{ container: () => new Container(), graphics: () => new Graphics(), sprite?: (texture) => new Sprite(texture) }` and an injected clock. No `pixi.js` import inside the module by design.

## 4. Effects anchors (already consumed by `effects/anchors.ts`)

`cf.effect-sequence-anchors/v1` exactly as Codex emits it; per-phase anchors are the runtime fallback when common-canvas registration is not established.

## 5. Material owner (added 2026-09-13 after A1)

For every creature the **resolved-anatomy record is the authority for materials**, because it comes from the winning painter owner and describes what was actually drawn. Codex's procedural observer (C2) must therefore emit the material it painted (from the genome's FA_SKIN routing through the painter), never a default such as `fur`. Claude's motion and sound compilers read `record.materials.surface` first and fall back to the genome only when the record omits it, recording the fallback in `card.notes`. The A1 proof run recorded one disagreement on the procedural quadruped (record `fur`, genome `translucent`); that is an observer defect to fix in C2, not a compiler choice.

## 6. Engines available on anthropic/mac (for C2 to target)

- `motion/`: `compileBodyCard(record, genome?)`, `buildTimeline(card, actionId, seed)`, `sampleTimeline(tl, ms)`, `createGsapPlayer(tl, target: PoseTarget, {now})`. PoseTarget is `setJoint(name, rotationRadians, dx, dy)` with the record's joint names; the rig's `applyPose` in section 2 is the same vocabulary.
- `effects/`: `parseAnchors`, `placeEffectSequence(anchors, attackerStand, targetStand, groundLine)`, `buildEffectSchedule`, `EffectSequencePlayer` on Pixi 8 `ParticleContainer`.
- `worldlife/`: `compileWorldLife(card, seed, 'arena'|'landfall')`, adapter with a display factory and injected clock.
- `soundkit/`: `compileVoiceCard`, `deriveCue(card, cueId, sources, seed)`; source sets named per section 1.
