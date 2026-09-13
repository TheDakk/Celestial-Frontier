/* Per-ability theme effects (batch 2, B2): the theme library resolves every kit theme to a playable
 * effect, painted where a sequence exists and labelled procedural elsewhere; the player and stage
 * accept procedural phases (no sprite) and tint particles with the theme material. Negative controls:
 * an unknown theme refuses, a duplicate painted theme refuses, a procedural record cannot pose as painted,
 * and a mismatched texture count still throws. */
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseEffectSequenceAnchors, placeEffectSequence, type EffectSequenceAnchors } from '../apps/game/src/effects/anchors.js';
import { EMITTER_PARTICLE_CAP, EMITTER_PRESETS, normalizeEmitterConfig } from '../apps/game/src/effects/emitter.js';
import { EffectSequencePlayer, mirrorDirection, type EffectParticleLike, type EffectPixiHost, type EffectSpriteLike, type EffectTextureLike } from '../apps/game/src/effects/pixi-adapter.js';
import { buildEffectSchedule } from '../apps/game/src/effects/sequencer.js';
import { EFFECT_THEMES, EffectThemeLibrary, PAINTED_EFFECT_LABEL, PROCEDURAL_EFFECT_LABEL, THEME_EMITTERS, THEME_MATERIALS, isProceduralImage, isProceduralSequence, proceduralAnchorsFor } from '../apps/game/src/effects/theme-library.js';
import { COMBAT_THEMES } from '../apps/game/src/battle2/stage.js';
import { PARTICLE_DISC_SIZE, PARTICLE_RIM, particleDiscRgba } from '../apps/game/src/effects/particle-texture.js';
import { buildTurnPlan, sampleTurn } from '../apps/game/src/battle2/choreography.js';
import { ABILITY_THEMES } from '../apps/game/src/soundkit/cues.js';

const wild = (): EffectSequenceAnchors => { const p = parseEffectSequenceAnchors(JSON.parse(readFileSync(new URL('../../../audits/ARENA_EFFECTS_V42_PROOF_20260912/wild-anchors.json', import.meta.url), 'utf8'))); if (!p.ok) throw new Error(p.reason); return p.anchors; };
class FakeSprite implements EffectSpriteLike { x = 0; y = 0; rotation = 0; alpha = 1; visible = true; readonly anchor = { set: () => undefined }; readonly scale = { set: () => undefined }; }
class FakeParticle implements EffectParticleLike { x = 0; y = 0; scaleX = 1; scaleY = 1; anchorX = 0; anchorY = 0; rotation = 0; alpha = 1; tint?: number; }
const host = (): EffectPixiHost & { sprites: FakeSprite[]; particles: FakeParticle[] } => {
  const sprites: FakeSprite[] = [], particles: FakeParticle[] = [];
  return { sprites, particles, createSprite: () => { const s = new FakeSprite(); sprites.push(s); return s; }, createParticle: () => { const p = new FakeParticle(); particles.push(p); return p; }, createParticleContainer: () => ({ addParticle: () => undefined, removeParticle: () => undefined }) };
};
const TEX: EffectTextureLike = { width: 1024, height: 1024 }, DOT: EffectTextureLike = { width: 8, height: 8 };
const ARENA = { groundLineY: 0.78, stands: { left: { x: 1 / 3, y: 0.78 }, right: { x: 2 / 3, y: 0.78 } } };

describe('theme library (Art Kit §4K, eleven closed themes)', () => {
  afterEach(() => vi.restoreAllMocks());
  it('names exactly the kit themes, the same list the stage and the Sound Kit use, each with a material tint, an accent and validated emitters', () => {
    expect([...EFFECT_THEMES]).toEqual([...COMBAT_THEMES]); expect([...EFFECT_THEMES]).toEqual([...ABILITY_THEMES]);
    for (const t of EFFECT_THEMES) {
      expect(THEME_MATERIALS[t].tint).not.toBe(THEME_MATERIALS[t].accent); // material carries the identity; the game hex is an accent only
      for (const phase of ['launch', 'travel', 'impact'] as const) { const c = THEME_EMITTERS[t][phase]; expect(c.phase).toBe(phase); expect(normalizeEmitterConfig(c)).toEqual(c); expect(c.maxParticles).toBeLessThanOrEqual(EMITTER_PARTICLE_CAP); }
      expect(THEME_EMITTERS[t].launch.maxParticles + THEME_EMITTERS[t].travel.maxParticles + THEME_EMITTERS[t].impact.maxParticles).toBeLessThanOrEqual(EMITTER_PARTICLE_CAP);
    }
    expect(THEME_EMITTERS.wild).toEqual(EMITTER_PRESETS); // Wild keeps the accepted Motion Kit §7 presets
    expect(THEME_EMITTERS.fire.launch.gravity).toBeLessThan(0); expect(THEME_EMITTERS.stone.impact.gravity).toBeGreaterThan(1); // embers rise, grit falls
    expect(THEME_EMITTERS.void.launch.directionRad).toBeCloseTo(Math.PI); expect(THEME_EMITTERS.psionic.impact.spreadRad).toBeCloseTo(Math.PI); // inhaled debris, snap ring
  });
  it('procedural anchors pass the anchors parser for every theme, are labelled by prefix and image path, and place like a painted sequence', () => {
    for (const t of EFFECT_THEMES) {
      const a = proceduralAnchorsFor(t); // proceduralAnchorsFor throws when its own record fails the parser
      expect(a.schema).toBe('cf.effect-sequence-anchors/v1');
      expect(isProceduralSequence(a)).toBe(true); expect(a.theme).toBe(t); expect(a.phases.map((p) => p.phase)).toEqual(['launch', 'travel', 'impact']);
      for (const p of a.phases) expect(isProceduralImage(p.keyedImage)).toBe(true);
      const placed = placeEffectSequence(a, { attacker: ARENA.stands.left, target: ARENA.stands.right });
      expect(placed.launch.from).toEqual(ARENA.stands.left); expect(placed.impact.from).toEqual({ x: 2 / 3, y: 0.78 });
    }
    expect(isProceduralSequence(wild())).toBe(false); expect(wild().phases.some((p) => isProceduralImage(p.keyedImage))).toBe(false);
  });
  it('resolves painted where a sequence exists and procedural elsewhere; refuses unknown, duplicate, non-kit and procedural-as-painted inputs', () => {
    const lib = new EffectThemeLibrary([wild()]);
    expect(lib.paintedThemes()).toEqual(['wild']);
    const w = lib.resolve('wild'); expect(w.painted).toBe(w.anchors); expect(w.label).toBe(PAINTED_EFFECT_LABEL); expect(w.anchors.sequenceId).toBe(wild().sequenceId);
    const f = lib.resolve('fire'); expect(f.painted).toBeNull(); expect(f.label).toBe(PROCEDURAL_EFFECT_LABEL); expect(isProceduralSequence(f.anchors)).toBe(true); expect(f.material.tint).toBe(0xf2a060);
    expect(lib.anchorsFor('tide').theme).toBe('tide'); expect(lib.emittersFor('storm')).toBe(THEME_EMITTERS.storm); expect(lib.tintFor('void')).toBe(THEME_MATERIALS.void.tint);
    expect(() => lib.resolve('lava')).toThrow(/unknown theme "lava"/); expect(() => lib.resolve('')).toThrow(/unknown theme/);
    expect(() => new EffectThemeLibrary([wild(), wild()])).toThrow(/already has a painted sequence/);
    expect(() => new EffectThemeLibrary([{ ...wild(), theme: 'lava' }])).toThrow(/not a kit theme/);
    expect(() => new EffectThemeLibrary([proceduralAnchorsFor('fire')])).toThrow(/procedural record/);
    expect(new EffectThemeLibrary().paintedThemes()).toEqual([]);
  });
  it('a procedural turn plan schedules the same beats as a painted one (impact on the strike frame) and samples a visible effect window', () => {
    const lib = new EffectThemeLibrary([wild()]);
    const base = { seed: 7, attacker: { side: 'left' as const, mass: 1, card: null, seed: 1, label: 'a' }, target: { side: 'right' as const, mass: 1, card: null, seed: 2, label: 'b' }, outcome: 'hit' as const, damage: 5, arena: ARENA, readyMs: 500, commandMs: 300 };
    const painted = buildTurnPlan({ ...base, delivery: 'melee', theme: 'wild', effect: lib.anchorsFor('wild') });
    const procedural = buildTurnPlan({ ...base, delivery: 'melee', theme: 'stone', effect: lib.anchorsFor('stone') });
    expect(procedural.beats.impactAt).toBe(painted.beats.impactAt); expect(procedural.effect!.schedule.impactAt).toBe(painted.effect!.schedule.impactAt);
    expect(procedural.effect!.schedule.impactAt).toBeCloseTo(procedural.beats.impactAt - procedural.beats.actionStart, 9);
    const s = sampleTurn(procedural, procedural.beats.impactAt + 10); expect(s.effect!.phase).toBe('impact'); expect(s.effect!.emitterPhase).toBe('impact');
    const cast = buildTurnPlan({ ...base, delivery: 'cast', theme: 'frost', effect: lib.anchorsFor('frost') });
    expect(cast.effect!.placement.travel[0]!.from).not.toEqual(cast.effect!.placement.travel[0]!.to); // cast slides origin→contact
  });
});

describe('player with procedural phases and theme tint', () => {
  const playerFor = (textures: readonly (EffectTextureLike | null)[], anchors: EffectSequenceAnchors, h: ReturnType<typeof host>, clock: () => number, flip = false, tint?: number) => {
    const stands = flip ? { attacker: ARENA.stands.right, target: ARENA.stands.left } : { attacker: ARENA.stands.left, target: ARENA.stands.right };
    const schedule = buildEffectSchedule(anchors, { delivery: 'melee', attackerMassClass: 1 }, placeEffectSequence(anchors, stands));
    return new EffectSequencePlayer({ host: h, schedule, phaseTextures: textures, particleTexture: DOT, emitters: THEME_EMITTERS[anchors.theme as 'fire'], seed: 5, clock, arena: { width: 1024, height: 576 }, ...(tint !== undefined ? { particleTint: tint } : {}) });
  };
  it('creates no sprite for a null phase, keeps track mapping, still emits particles with the theme tint, and stays deterministic', () => {
    let now = 0; const h = host();
    const p = playerFor([null, null, null], proceduralAnchorsFor('fire'), h, () => now, false, THEME_MATERIALS.fire.tint);
    expect(p.sprites).toHaveLength(0); expect(p.spriteTracks).toEqual([]); expect(p.spriteForTrack(0)).toBeNull(); expect(h.sprites).toHaveLength(0);
    p.tick(); now = 40; const f = p.tick(); expect(f.liveParticles).toBeGreaterThan(0); expect(h.particles.every((q) => q.tint === 0xf2a060)).toBe(true);
    now = 250; const g = p.tick(); expect(g.sample.phase).toBe('impact');
    const positions = h.particles.slice(0, 10).map((q) => [q.x, q.y]);
    let again = 0; const h2 = host(); const p2 = playerFor([null, null, null], proceduralAnchorsFor('fire'), h2, () => again); p2.tick(); again = 40; p2.tick(); again = 250; p2.tick();
    expect(h2.particles.slice(0, 10).map((q) => [q.x, q.y])).toEqual(positions); expect(h2.particles[0]!.tint).toBeUndefined();
    const mixed = playerFor([TEX, null, TEX], wild(), host(), () => 0);
    expect(mixed.sprites).toHaveLength(2); expect(mixed.spriteTracks).toEqual([0, 2]); expect(mixed.spriteForTrack(1)).toBeNull(); expect(mixed.spriteForTrack(2)).toBe(mixed.sprites[1]);
    expect(() => playerFor([TEX, TEX], wild(), host(), () => 0)).toThrow(/one phase texture/);
  });
  it('tells a pixi ParticleContainer to rebuild when the live count changes, and not otherwise (B4 capture finding: the count was frozen at one dot)', () => {
    let now = 0; const updates: number[] = []; let live = 0;
    const h = host(); h.createParticleContainer = () => ({ addParticle: (...p: unknown[]) => { live += p.length; }, removeParticle: (...p: unknown[]) => { live -= p.length; }, update: () => { updates.push(live); } });
    const p = playerFor([null, null, null], proceduralAnchorsFor('stone'), h, () => now);
    p.tick(); expect(updates).toEqual([]); // nothing live yet
    now = 40; p.tick(); expect(updates.length).toBe(1); expect(updates[0]).toBeGreaterThan(0); // the burst arrived: one rebuild
    const before = updates.length; now = 41; p.tick(); expect(updates.length).toBe(before); // same count → no rebuild
    now = 3000; p.tick(); expect(updates.at(-1)).toBe(0); // everything died → rebuild to zero
    now = 3001; p.tick(); const after = updates.length; p.dispose(); expect(updates.length).toBe(after); // nothing live at dispose → no extra rebuild
    const plain = playerFor([null, null, null], proceduralAnchorsFor('stone'), host(), () => 0); plain.tick(); expect(() => { /* fake without update() */ plain.dispose(); }).not.toThrow();
  });
  it('mirrors emitter directions for a right-to-left sequence (particles fly toward the target on both sides)', () => {
    expect(mirrorDirection(EMITTER_PRESETS.launch, false)).toBe(EMITTER_PRESETS.launch);
    expect(mirrorDirection(EMITTER_PRESETS.launch, true).directionRad).toBeCloseTo(Math.PI);
    expect(mirrorDirection(EMITTER_PRESETS.impact, true).directionRad).toBeCloseTo(Math.PI + Math.PI / 2); // up stays up (mod 2π)
    let now = 0; const l = host(), r = host();
    const pl = playerFor([null, null, null], proceduralAnchorsFor('sand'), l, () => now), pr = playerFor([null, null, null], proceduralAnchorsFor('sand'), r, () => now, true);
    pl.tick(); pr.tick(); now = 60; pl.tick(); pr.tick();
    const meanVx = (h: ReturnType<typeof host>, p: EffectSequencePlayer) => { const s = p.emitterState('launch'); return s.particles.reduce((a, q) => a + q.vx, 0) / Math.max(1, s.particles.length); };
    expect(meanVx(l, pl)).toBeGreaterThan(0); expect(meanVx(r, pr)).toBeLessThan(0);
    expect(pl.emitterState('launch').config.directionRad).toBeCloseTo(THEME_EMITTERS.sand.launch.directionRad); expect(pr.emitterState('launch').config.directionRad).toBeCloseTo(Math.PI - THEME_EMITTERS.sand.launch.directionRad);
  });
});

describe('particle disc (the one tintable texture)', () => {
  it('is deterministic, opaque white at the core, darker and translucent at the rim, transparent at the corners, and refuses bad sizes', () => {
    const a = particleDiscRgba(), b = particleDiscRgba(PARTICLE_DISC_SIZE);
    expect(a.length).toBe(PARTICLE_DISC_SIZE * PARTICLE_DISC_SIZE * 4); expect(Buffer.from(a).equals(Buffer.from(b))).toBe(true);
    const px = (x: number, y: number) => Array.from(a.subarray((y * PARTICLE_DISC_SIZE + x) * 4, (y * PARTICLE_DISC_SIZE + x) * 4 + 4));
    expect(px(8, 8)).toEqual([255, 255, 255, 255]); expect(px(0, 0)).toEqual([0, 0, 0, 0]); expect(px(15, 0)[3]).toBe(0);
    const rim = px(14, 8); expect(rim[0]).toBeLessThan(255); expect(rim[0]).toBeGreaterThanOrEqual(Math.round(255 * (1 - PARTICLE_RIM.darkness)) - 1); expect(rim[3]).toBeGreaterThan(0); expect(rim[3]).toBeLessThan(255);
    expect(() => particleDiscRgba(3)).toThrow(/4\.\.256/); expect(() => particleDiscRgba(7.5)).toThrow(); expect(particleDiscRgba(4)).toHaveLength(64);
  });
});
