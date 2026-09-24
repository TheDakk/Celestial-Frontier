/* Batch 3: creature voices per combatant (B5), phone particle budget (B10), leg-slack diagnostic (B11). */
import { describe, expect, it } from 'vitest';
import { createCreatureVoiceHook, genomeOnlyRecord } from '../apps/game/src/soundkit/creature-voices.js';
import { synthesizePlaceholderQuadruped } from '../apps/game/src/soundkit/placeholder-archetype.js';
import { createTurnCueSink } from '../apps/game/src/soundkit/turn-audio.js';
import type { TurnCue } from '../apps/game/src/battle2/cue-plan.js';
import { EMITTER_PRESETS, PHONE_PARTICLE_SCALE, scaleEmitterBudget } from '../apps/game/src/effects/emitter.js';
import { EffectThemeLibrary, THEME_EMITTERS } from '../apps/game/src/effects/theme-library.js';
import { LEG_SLACK_MIN_BL, compileBodyCard } from '../apps/game/src/motion/body-card.js';
import { civetRecord, foxRecord, syntheticGenome, syntheticRecord } from '../tools/motion-proof/fixtures.js';

const sources = synthesizePlaceholderQuadruped().sources;
const cue = (cueId: string, source: TurnCue['source'] = 'left'): TurnCue => ({ cueId, atMs: 0, source, beat: 't' });
const genomeA = { seed: 4242, size: 2, kingdom: 'fauna', skin: 1, temper: 2, loco: 0, habitat: 5 }, genomeB = { seed: 777, size: 4, kingdom: 'fauna', skin: 3, temper: 6, loco: 1, habitat: 2 };

describe('B5 creature voice hook', () => {
  it('compiles one voice per side (record or genome), derives creature cues deterministically per side, caches, and returns null for a silent side or a non-creature cue', () => {
    const hook = createCreatureVoiceHook({ seed: 9, sources, sides: { left: { record: civetRecord(), genome: null, seed: 1, label: 'Civet' }, right: { record: null, genome: genomeB, seed: 2, label: 'Wildling' } } });
    expect(hook.cards.left!.archetype).toBe('quadruped'); expect(hook.cards.right!.archetype).toBe('quadruped'); expect(hook.status.left).toMatch(/^Civet: quadruped voice/); expect(hook.status.right).toMatch(/^Wildling: quadruped voice/);
    const a = hook(cue('creature:attack-vocal', 'left'))!, b = hook(cue('creature:attack-vocal', 'right'))!;
    expect(a.samples.length).toBeGreaterThan(1000); expect(b.samples.length).toBeGreaterThan(1000);
    expect(Buffer.from(a.samples.buffer).equals(Buffer.from(b.samples.buffer))).toBe(false); // two creatures, two voices
    expect(hook(cue('creature:attack-vocal', 'left'))).toBe(a); expect(hook.cached()).toBe(2); // cached per side and cue
    const again = createCreatureVoiceHook({ seed: 9, sources, sides: { left: { record: civetRecord(), genome: null, seed: 1, label: 'Civet' }, right: { record: null, genome: genomeB, seed: 2, label: 'Wildling' } } });
    expect(Buffer.from(again(cue('creature:attack-vocal', 'left'))!.samples.buffer).equals(Buffer.from(a.samples.buffer))).toBe(true); // deterministic
    expect(hook(cue('ability:wild:impact', 'left'))).toBeNull(); expect(hook(cue('battle:cursor', 'battle'))).toBeNull(); expect(hook(cue('creature:hurt', 'battle'))).toBeNull();
    const silent = createCreatureVoiceHook({ seed: 9, sources, sides: { left: { record: null, genome: null, seed: 1, label: 'Explorer' }, right: { record: null, genome: genomeA, seed: 2, label: 'x' } } });
    expect(silent.cards.left).toBeNull(); expect(silent.status.left).toMatch(/no voice \(no record and no genome\)/); expect(silent(cue('creature:hurt', 'left'))).toBeNull(); expect(silent(cue('creature:hurt', 'right'))).not.toBeNull();
    const plant = createCreatureVoiceHook({ seed: 9, sources, sides: { left: { record: syntheticRecord('plant-woody'), genome: null, seed: 1, label: 'tree' }, right: { record: null, genome: genomeA, seed: 2, label: 'x' } } });
    expect(plant.status.left).toMatch(/no voice \((unknown-archetype:plant-woody|no-voice:plants)\)/); // plants never get a voice, whichever gate refuses first
    expect(genomeOnlyRecord(genomeA, 4242).identity?.speciesVisualKey).toBe('genome:4242');
  });
  it('a body plan with no source set yet has NO voice (labelled) and never throws — a throw here ran inside the stage tick and froze the game\'s shared ticker on a Python in a real browser (2026-09-24)', async () => {
    const { readFileSync } = await import('node:fs');
    const python = JSON.parse(readFileSync(new URL('../apps/game/public/battle2/audits/PYTHON_OPEN_POSE_20260923/candidate-02/fit-01/record.json', import.meta.url), 'utf8'));
    const hook = createCreatureVoiceHook({ seed: 9, sources, sides: { left: { record: python, genome: null, seed: 1, label: 'Python' }, right: { record: civetRecord(), genome: null, seed: 2, label: 'Civet' } } });
    expect(hook.cards.left).toBeNull(); expect(hook.status.left).toMatch(/Python: no voice \(no source set for the \w+ archetype yet\)/);
    expect(() => hook(cue('creature:hurt', 'left'))).not.toThrow(); expect(hook(cue('creature:hurt', 'left'))).toBeNull();
    expect(hook(cue('creature:hurt', 'right'))).not.toBeNull(); // the quadruped still speaks
    // control: give that archetype a source set and the same record gets a voice
    const archetype = /for the (\w+) archetype/.exec(hook.status.left)![1]!;
    const withSet = createCreatureVoiceHook({ seed: 9, sources: { ...sources, [archetype]: Object.values(sources)[0]! }, sides: { left: { record: python, genome: null, seed: 1, label: 'Python' }, right: { record: null, genome: null, seed: 2, label: 'x' } } });
    expect(withSet.cards.left).not.toBeNull(); expect(withSet(cue('creature:hurt', 'left'))).not.toBeNull();
  });
  it('the turn sink plays a creature cue through the hook and skips a silent side with a reason', () => {
    const requests: string[] = [];
    const hook = createCreatureVoiceHook({ seed: 3, sources, sides: { left: { record: null, genome: null, seed: 1, label: 'Explorer' }, right: { record: civetRecord(), genome: null, seed: 2, label: 'Civet' } } });
    const sink = createTurnCueSink({ runtime: { playVoice: (r) => { requests.push(r.key); return { kind: 'started', voiceId: 'v' }; } }, seed: 3, creatureVoice: hook });
    sink.play(cue('creature:hurt', 'right'), 0); sink.play(cue('creature:attack-vocal', 'left'), 0);
    expect(requests).toEqual(['soundkit:creature:hurt']); expect(sink.log.map((e) => e.result)).toEqual(['started', 'skipped: no creature voice for this side']);
  });
});

describe('B10 phone particle budget', () => {
  it('halves cap, burst and rate, keeps lives, speeds and sizes, stays normalized, and refuses a bad scale', () => {
    const p = scaleEmitterBudget(EMITTER_PRESETS.impact, PHONE_PARTICLE_SCALE);
    expect(p.maxParticles).toBe(50); expect(p.burst).toBe(50); expect(p.rate).toBe(0); expect(p.lifeMs).toEqual(EMITTER_PRESETS.impact.lifeMs); expect(p.size).toEqual(EMITTER_PRESETS.impact.size);
    expect(scaleEmitterBudget(EMITTER_PRESETS.travel, 0.5).rate).toBe(150); expect(scaleEmitterBudget(EMITTER_PRESETS.travel, 1)).toBe(EMITTER_PRESETS.travel);
    expect(() => scaleEmitterBudget(EMITTER_PRESETS.travel, 0)).toThrow(/0 < scale <= 1/); expect(() => scaleEmitterBudget(EMITTER_PRESETS.travel, 1.5)).toThrow();
    const lib = new EffectThemeLibrary();
    expect(lib.emittersFor('fire')).toBe(THEME_EMITTERS.fire); expect(lib.emittersFor('fire', 'desktop')).toBe(THEME_EMITTERS.fire);
    const phone = lib.emittersFor('fire', 'phone');
    expect(phone.impact.maxParticles).toBe(Math.round(THEME_EMITTERS.fire.impact.maxParticles / 2)); expect(phone.launch.burst).toBe(Math.round(THEME_EMITTERS.fire.launch.burst / 2)); expect(phone.impact.gravity).toBe(THEME_EMITTERS.fire.impact.gravity);
    expect(() => lib.emittersFor('fire', 'tablet' as never)).toThrow(/unknown tier/);
  });
});

describe('B11 leg slack diagnostic on the body card', () => {
  it('reports rest slack per leg in body lengths and notes a near-collinear chain (the fox foreNear from the C2 review) without refusing', () => {
    const civet = compileBodyCard(civetRecord()), fox = compileBodyCard(foxRecord());
    for (const c of [civet, fox]) { expect(Object.keys(c.bounds.legSlack).sort()).toEqual(['foreFar', 'foreNear', 'hindFar', 'hindNear']); for (const v of Object.values(c.bounds.legSlack)) expect(Number.isFinite(v)).toBe(true); }
    expect(fox.bounds.legSlack.foreNear).toBeLessThan(0.005); expect(fox.notes.some((n) => /leg slack under 3%/.test(n) && /foreNear/.test(n))).toBe(true); expect(fox.bounds.inside).toBe(true);
    expect(civet.bounds.legSlack.hindFar).toBeGreaterThan(LEG_SLACK_MIN_BL); expect(civet.notes.some((n) => /leg slack/.test(n) && /foreNear/.test(n))).toBe(true); // the civet's foreNear is near-straight too
    const hopper = compileBodyCard(syntheticRecord('hopper'), syntheticGenome('hopper')); expect(hopper.notes.some((n) => /leg slack/.test(n) && /fore/.test(n))).toBe(true); expect(hopper.bounds.legSlack.hindFar).toBeGreaterThan(LEG_SLACK_MIN_BL); // the synthetic hopper's fore legs are drawn straight, its hind legs folded
    expect(compileBodyCard(syntheticRecord('fish'), syntheticGenome('fish')).bounds.legSlack).toEqual({}); // no legs, no rows
  });
});
