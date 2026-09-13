/* B1: placeholder battle/ability synthesis and the turn audio sink. Every ability and battle cue id in
 * the closed vocabulary renders deterministically, labelled non-shippable, inside the kit length caps;
 * themes are distinguishable by spectral centroid; the sink routes each fired cue through the mix
 * policy into the runtime as a buffer-source request and records the runtime's answer. Negative
 * controls: creature cues refuse in the synth and are skipped in the sink, an unknown id refuses,
 * a runtime rejection and a throw are both recorded, and the synth is cached per cue. */
import { describe, expect, it, vi } from 'vitest';
import type { AudioVoiceRequest, AudioVoiceStartResult } from '@cf/audio';
import { BATTLE_SYNTH_CUE_IDS, BATTLE_SYNTH_LABEL, CUE_MAX_SECONDS, IMPACT_MAX_SECONDS, synthesizeBattleCue } from '../apps/game/src/soundkit/battle-synth.js';
import { SAMPLE_RATE, peakOf } from '../apps/game/src/soundkit/dsp.js';
import { createTurnCueSink } from '../apps/game/src/soundkit/turn-audio.js';
import type { TurnCue } from '../apps/game/src/battle2/cue-plan.js';

const centroid = (x: Float32Array): number => { // zero-crossing rate as a cheap brightness measure
  let z = 0; for (let i = 1; i < x.length; i++) if ((x[i]! >= 0) !== (x[i - 1]! >= 0)) z++; return z / (x.length / SAMPLE_RATE);
};
const cue = (cueId: string, over: Partial<TurnCue> = {}): TurnCue => ({ cueId, atMs: 0, source: 'battle', beat: 't', ...over });

describe('battle synth (placeholder, labelled)', () => {
  it('renders all 33 ability and 16 battle ids deterministically, labelled non-shippable, inside the caps and at -1 dBTP', () => {
    expect(BATTLE_SYNTH_CUE_IDS).toHaveLength(33 + 16);
    for (const id of BATTLE_SYNTH_CUE_IDS) {
      const a = synthesizeBattleCue(id, 7), b = synthesizeBattleCue(id, 7);
      expect(a.placeholder).toBe(true); expect(a.shippable).toBe(false); expect(a.flags).toEqual([BATTLE_SYNTH_LABEL]); expect(a.sampleRate).toBe(SAMPLE_RATE);
      expect(a.samples.length / SAMPLE_RATE).toBeLessThanOrEqual(id.endsWith(':impact') || id === 'battle:hitstop-thump' ? IMPACT_MAX_SECONDS : CUE_MAX_SECONDS);
      expect(peakOf(a.samples)).toBeCloseTo(0.891, 3); expect(a.samples.every(Number.isFinite)).toBe(true);
      expect(Buffer.from(a.samples.buffer).equals(Buffer.from(b.samples.buffer))).toBe(true); expect(a.recipeHash).toBe(b.recipeHash);
      expect(synthesizeBattleCue(id, 8).recipeHash).not.toBe(a.recipeHash);
    }
  });
  it('materials read differently by ear: frost brighter than stone, storm impact deeper than psionic, damage-tick pitch rises with amount', () => {
    const bright = (id: string) => centroid(synthesizeBattleCue(id, 1).samples);
    expect(bright('ability:frost:impact')).toBeGreaterThan(bright('ability:stone:impact') * 2);
    expect(bright('ability:storm:impact')).toBeLessThan(bright('ability:psionic:impact'));
    expect(bright('ability:chem:launch')).toBeGreaterThan(bright('ability:fire:travel'));
    const low = synthesizeBattleCue('battle:damage-tick', 1, { amount: 2 }), high = synthesizeBattleCue('battle:damage-tick', 1, { amount: 120 });
    expect(centroid(high.samples)).toBeGreaterThan(centroid(low.samples) * 1.5); expect(high.recipeHash).not.toBe(low.recipeHash);
    expect(synthesizeBattleCue('battle:damage-tick', 1, { amount: 9999 }).recipeHash).toBe(synthesizeBattleCue('battle:damage-tick', 1, { amount: 200 }).recipeHash); // clamped
  });
  it('refuses creature cues and unknown ids', () => {
    expect(() => synthesizeBattleCue('creature:call', 1)).toThrow(/ability and battle cues only/);
    expect(() => synthesizeBattleCue('ability:lava:impact', 1)).toThrow(/closed vocabulary/);
    expect(() => synthesizeBattleCue('battle:nope', 1)).toThrow(/closed vocabulary/);
  });
});

describe('turn cue sink', () => {
  const runtime = (answer: (r: AudioVoiceRequest) => AudioVoiceStartResult) => { const requests: AudioVoiceRequest[] = []; return { requests, playVoice: (r: AudioVoiceRequest) => { requests.push(r); return answer(r); } }; };
  it('routes fired cues through the mix policy into the runtime as buffer-source requests, caches synthesis, and logs results', () => {
    const rt = runtime(() => ({ kind: 'started', voiceId: 'v1' }));
    const sink = createTurnCueSink({ runtime: rt, seed: 5 });
    sink.play(cue('battle:turn-ready'), 0); sink.play(cue('ability:fire:impact', { source: 'left', atMs: 400 }), 3); sink.play(cue('battle:turn-ready'), 1);
    expect(rt.requests).toHaveLength(3); expect(sink.cached()).toBe(2);
    expect(rt.requests[0]).toMatchObject({ key: 'soundkit:battle:turn-ready', category: 'combat-gameplay', nodeCount: 2, meaning: { kind: 'decorative' } });
    expect(rt.requests[1]).toMatchObject({ key: 'soundkit:ability:fire:impact', priority: 100, concurrencyGroup: 'soundkit:impact', maxConcurrent: 1 });
    expect(rt.requests[1]!.maxDurationMs).toBeGreaterThan(0);
    expect(sink.log).toEqual([expect.objectContaining({ cueId: 'battle:turn-ready', result: 'started', lateMs: 0 }), expect.objectContaining({ cueId: 'ability:fire:impact', source: 'left', atMs: 400, lateMs: 3, result: 'started' }), expect.objectContaining({ result: 'started' })]);
    // The request's graph is one buffer source into one gain, built on the fake context.
    const created: string[] = []; const node = (n: string) => ({ connect: () => { created.push(`connect:${n}`); }, disconnect: () => {} });
    const ctx = { currentTime: 0, createBuffer: (_c: number, length: number) => ({ copyToChannel: () => { created.push(`buffer:${length}`); } }), createBufferSource: () => ({ ...node('source'), buffer: null, onended: null, start: () => {}, stop: () => {} }), createGain: () => ({ ...node('gain'), gain: { setValueAtTime: () => {} } }) };
    const graph = rt.requests[0]!.create(ctx as never, { voiceId: 'v', budgets: {} } as never);
    expect(graph.nodes).toHaveLength(2); expect(created.some((c) => c.startsWith('buffer:'))).toBe(true);
  });
  it('skips creature cues without a voice hook, uses the hook when given, and records rejections, throws and vocabulary refusals', () => {
    const rt = runtime((r) => (r.key.includes('hurt') ? { kind: 'rejected', reason: 'cooldown' } : { kind: 'started', voiceId: 'v' }));
    const voice = vi.fn((c: TurnCue): { samples: Float32Array; sampleRate: typeof SAMPLE_RATE } | null => (c.source === "right" ? { samples: new Float32Array(480), sampleRate: SAMPLE_RATE } : null));
    const sink = createTurnCueSink({ runtime: rt, seed: 1, creatureVoice: voice, phone: true, logLimit: 3 });
    sink.play(cue('creature:attack-vocal', { source: 'left' }), 0); expect(sink.log.at(-1)!.result).toMatch(/skipped: no creature voice/); expect(rt.requests).toHaveLength(0);
    sink.play(cue('creature:hurt', { source: 'right' }), 0); expect(rt.requests).toHaveLength(1); expect(sink.log.at(-1)!.result).toBe('rejected: cooldown');
    sink.play(cue('creature:bleep'), 0); expect(sink.log.at(-1)!.result).toMatch(/refused/);
    const thrower = createTurnCueSink({ runtime: { playVoice: () => { throw new Error('boom'); } }, seed: 1 });
    thrower.play(cue('battle:cursor'), 0); expect(thrower.log[0]!.result).toBe('error: boom');
    sink.play(cue('battle:cursor'), 0); sink.play(cue('battle:confirm'), 0); expect(sink.log).toHaveLength(3); expect(sink.log[0]!.cueId).toBe('creature:bleep'); // bounded log keeps the newest
    const silent = createTurnCueSink({ runtime: rt, seed: 1 }); silent.play(cue('creature:hurt', { source: 'right' }), 0); expect(silent.log[0]!.result).toMatch(/skipped/);
  });
});
