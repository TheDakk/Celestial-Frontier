import { describe, expect, it } from 'vitest';
import { assertCueId, isCueId, parseCueId } from '../apps/game/src/soundkit/cues.js';
import { mixPolicyFor, planCues } from '../apps/game/src/soundkit/mix.js';
import { encodeWav16, readWavHeader } from '../apps/game/src/soundkit/wav.js';
import { createDerivedVoiceRequest } from '../apps/game/src/soundkit/browser-adapter.js';

describe('soundkit cue registry', () => {
  it('accepts the closed vocabulary and rejects everything else', () => {
    for (const id of ['creature:call', 'ability:fire:impact', 'battle:hitstop-thump', 'ambience:bed:temperate-forest',
      'ambience:water:frozen', 'space:star-hum:red-dwarf', 'space:engine:scout', 'economy:discovery-sting:tier-10',
      'economy:loot-pickup:metal:tier-3', 'ui:tap', 'music:landfall-theme:ocean']) expect(isCueId(id), id).toBe(true);
    for (const id of ['creature:bleep', 'ability:laser:impact', 'ability:fire:charge', 'ambience:water:steam',
      'economy:discovery-sting:tier-11', 'economy:loot-pickup:plastic:tier-1', 'chiptune:jingle', '', 'creature']) {
      expect(isCueId(id), id).toBe(false);
    }
    expect(() => assertCueId('creature:bleep')).toThrow(/closed vocabulary/u);
    expect(parseCueId('ability:frost:impact')?.impact).toBe(true);
    expect(parseCueId('ability:frost:travel')?.impact).toBe(false);
  });
});

describe('soundkit mix plan', () => {
  it('maps slots to runtime categories with the section 5 priority order', () => {
    const p = (id: string) => mixPolicyFor(id).priority;
    expect(p('ability:fire:impact')).toBeGreaterThan(p('ability:fire:travel'));
    expect(p('ability:fire:travel')).toBeGreaterThan(p('creature:call'));
    expect(p('creature:call')).toBeGreaterThan(p('ui:tap'));
    expect(p('ui:tap')).toBeGreaterThan(p('ambience:bed:x'));
    expect(p('ambience:bed:x')).toBeGreaterThan(p('music:title'));
    expect(mixPolicyFor('battle:hitstop-thump')).toMatchObject({ slot: 'impact', category: 'combat-gameplay', maxConcurrent: 1 });
    expect(mixPolicyFor('creature:hurt').category).toBe('creature');
    expect(mixPolicyFor('ability:fire:impact').mixIntent.factors.music).toBe(0.75);
    expect(mixPolicyFor('ambience:bed:x', { phone: true }).maxConcurrent).toBe(2);
  });

  it('drops over-concurrency cues in priority order and never delays them', () => {
    const plan = planCues(['creature:call', 'creature:alert', 'creature:hurt', 'battle:hitstop-thump', 'ability:fire:impact', 'ability:wild:travel']);
    expect(plan.admitted.map((v) => v.cueId)).toEqual(['battle:hitstop-thump', 'ability:wild:travel', 'creature:call', 'creature:alert']);
    expect(plan.dropped).toEqual([
      { cueId: 'ability:fire:impact', reason: 'concurrency:impact' },
      { cueId: 'creature:hurt', reason: 'concurrency:creature' },
    ]);
    expect(plan.admitted[0]).toMatchObject({ key: 'soundkit:battle:hitstop-thump', category: 'combat-gameplay', nodeCount: 2, priority: 100 });
    expect(() => planCues(['creature:bleep'])).toThrow(/closed vocabulary/u);
  });

  it('builds a runtime-shaped request whose graph is buffer source into gain', () => {
    const intent = planCues(['creature:call']).admitted[0]!;
    const derived = { cueId: 'call' as const, sampleRate: 48_000 as const, samples: new Float32Array(480), recipeHash: 'x', flags: [] };
    const request = createDerivedVoiceRequest(intent, derived);
    expect(request.maxDurationMs).toBe(110);
    const created: string[] = [];
    const node = (name: string) => ({ connect: () => { created.push(`connect:${name}`); }, disconnect: () => {} });
    const context = {
      currentTime: 0, destination: node('dest'), state: 'running',
      createGain: () => ({ ...node('gain'), gain: { value: 1, setValueAtTime: () => {} } }),
      createBuffer: (_c: number, length: number) => ({ copyToChannel: (s: Float32Array) => { created.push(`buffer:${length}:${s.length}`); } }),
      createBufferSource: () => ({ ...node('source'), buffer: null, onended: null, start: () => {}, stop: () => {} }),
      createAnalyser: () => { throw new Error('unused'); }, createDynamicsCompressor: () => { throw new Error('unused'); },
      resume: async () => {}, close: async () => {},
    };
    const graph = request.create(context as never, { id: 'r', graphNodes: 2, totalNodes: 3 });
    expect(graph.nodes.length).toBe(2);
    expect(created).toEqual(['buffer:480:480', 'connect:source']);
  });
});

describe('soundkit wav', () => {
  it('round-trips header fields and encodes 16-bit PCM', () => {
    const samples = new Float32Array([0, 0.5, -0.5, 1, -1, 2]);
    const wav = encodeWav16(samples, 48_000);
    expect(wav.length).toBe(44 + 12);
    expect(readWavHeader(wav)).toEqual({ sampleRate: 48_000, channels: 1, bitsPerSample: 16, dataBytes: 12, frames: 6 });
    const v = new DataView(wav.buffer);
    expect([v.getInt16(44, true), v.getInt16(46, true), v.getInt16(50, true), v.getInt16(52, true), v.getInt16(54, true)])
      .toEqual([0, 16384, 32767, -32768, 32767]);
    expect(() => readWavHeader(wav.subarray(0, 20))).toThrow(/canonical/u);
  });
});
