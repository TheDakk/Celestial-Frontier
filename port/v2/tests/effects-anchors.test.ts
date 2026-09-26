import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  ARENA_GROUND_LINE_Y, parseEffectSequenceAnchors, placeEffectSequence, type EffectSequenceAnchors,
} from '../apps/game/src/effects/anchors.js';

const WILD_PATH = fileURLToPath(new URL('../../../audits/ARENA_EFFECTS_V42_PROOF_20260912/wild-anchors.json', import.meta.url));
const wildJson = (): Record<string, unknown> => JSON.parse(readFileSync(WILD_PATH, 'utf8')) as Record<string, unknown>;
const wildAnchors = (): EffectSequenceAnchors => {
  const parsed = parseEffectSequenceAnchors(wildJson());
  if (!parsed.ok) throw new Error(parsed.reason);
  return parsed.anchors;
};

const mutate = (edit: (doc: Record<string, unknown>) => void): string => {
  const doc = wildJson();
  edit(doc);
  const parsed = parseEffectSequenceAnchors(doc);
  if (parsed.ok) throw new Error('expected a refusal');
  return parsed.reason;
};
const phases = (doc: Record<string, unknown>): Record<string, unknown>[] => doc.phases as Record<string, unknown>[];

describe('effects anchors: cf.effect-sequence-anchors/v1', () => {
  it('accepts the committed Wild proof anchors', () => {
    const a = wildAnchors();
    expect(a.sequenceId).toBe('wild-maw-proof-v1');
    expect(a.phaseOrder).toEqual(['launch', 'travel', 'impact']);
    expect(a.phases.map((p) => p.keyedImage)).toEqual(['keyed/wild-launch.png', 'keyed/wild-travel.png', 'keyed/wild-impact.png']);
    expect(a.phases[2]!.contactAnchor).toEqual({ x: 0.8, y: 0.55 });
    expect(Object.isFrozen(a) && Object.isFrozen(a.phases[0]!.alphaBoundsPixels)).toBe(true);
  });

  it('accepts extra travel frames between launch and impact', () => {
    const doc = wildJson();
    (doc.phaseOrder as string[]).splice(2, 0, 'travel');
    phases(doc).splice(2, 0, { ...phases(doc)[1]!, image: 'wild-travel-2.png', keyedImage: 'keyed/wild-travel-2.png' });
    const parsed = parseEffectSequenceAnchors(doc);
    expect(parsed.ok && parsed.anchors.phases.filter((p) => p.phase === 'travel').length).toBe(2);
  });

  it('refuses with a named reason', () => {
    expect(mutate((d) => { d.schema = 'cf.effect-sequence-anchors/v2'; })).toMatch(/^schema:/);
    expect(mutate((d) => { d.phaseOrder = ['launch', 'impact']; })).toMatch(/^phaseOrder/);
    expect(mutate((d) => { d.phaseOrder = ['travel', 'launch', 'impact']; })).toMatch(/must begin with launch/);
    expect(mutate((d) => { d.phaseOrder = ['launch', 'launch', 'impact']; })).toMatch(/only extra travel frames/);
    expect(mutate((d) => { phases(d).splice(1, 1); })).toMatch(/^phases: expected 3 entries/);
    expect(mutate((d) => { phases(d)[1]!.phase = 'impact'; })).toMatch(/^phases\[1\]\.phase: expected travel/);
    expect(mutate((d) => { phases(d)[0]!.originAnchor = [1.2, 0.5]; })).toMatch(/^phases\[0\]\.originAnchor/);
    expect(mutate((d) => { d.contactAnchor = [0.8]; })).toMatch(/^contactAnchor/);
    expect(mutate((d) => { phases(d)[2]!.alphaBoundsPixels = { x: 400, y: 215, width: 1000, height: 836 }; })).toMatch(/outside the 1254x1254 canvas/);
    expect(mutate((d) => { phases(d)[2]!.alphaBoundsPixels = { x: 0, y: 0, width: 0, height: 10 }; })).toMatch(/alphaBoundsPixels/);
    expect(mutate((d) => { delete phases(d)[0]!.keyedImage; })).toMatch(/keyedImage/);
    expect(mutate((d) => { phases(d)[1]!.image = 'wild-launch.png'; })).toMatch(/distinct/);
    expect(mutate((d) => { d.canvasSize = { width: 0, height: 1254 }; })).toMatch(/^canvasSize/);
    expect(mutate((d) => { d.theme = 'Wild!'; })).toMatch(/^theme/);
    expect(parseEffectSequenceAnchors(null)).toEqual({ ok: false, reason: 'anchors: expected an object' });
  });
});

describe('effects placement in arena space', () => {
  const stands = { attacker: { x: 0.3, y: ARENA_GROUND_LINE_Y }, target: { x: 0.7, y: ARENA_GROUND_LINE_Y } };

  it('maps launch to the attacker, impact to the target contact on the ground line, travel between', () => {
    const p = placeEffectSequence(wildAnchors(), stands);
    expect(p.launch.from).toEqual({ x: 0.3, y: 0.78 });
    expect(p.launch.anchor).toEqual({ x: 0.18, y: 0.66 });
    expect(p.impact.to).toEqual({ x: 0.7, y: 0.78 });
    expect(p.impact.anchor).toEqual({ x: 0.8, y: 0.55 });
    expect(p.travel).toHaveLength(1);
    expect(p.travel[0]!.from).toEqual({ x: 0.3, y: 0.78 });
    expect(p.travel[0]!.to).toEqual({ x: 0.7, y: 0.78 });
    expect(p.flipX).toBe(false);
  });

  it('scales the sequence span (0.6) to the stand distance and caps it', () => {
    const p = placeEffectSequence(wildAnchors(), stands);
    expect(p.standDistance).toBeCloseTo(0.4, 12);
    expect(p.scale).toBeCloseTo(0.4 / 0.6, 12);
    expect(p.scaleCapped).toBe(false);
    const far = placeEffectSequence(wildAnchors(), { attacker: { x: 0.02, y: 0.78 }, target: { x: 0.98, y: 0.78 } });
    expect(far.scale).toBe(1.25);
    expect(far.scaleCapped).toBe(true);
    const near = placeEffectSequence(wildAnchors(), { attacker: { x: 0.5, y: 0.78 }, target: { x: 0.52, y: 0.78 } });
    expect(near.scale).toBe(0.2);
  });

  it('flips when the attacker stands to the right and honours a custom ground line', () => {
    const p = placeEffectSequence(wildAnchors(), { attacker: stands.target, target: stands.attacker }, { groundLineY: 0.7 });
    expect(p.flipX).toBe(true);
    expect(p.impact.to).toEqual({ x: 0.3, y: 0.7 });
    expect(() => placeEffectSequence(wildAnchors(), { attacker: { x: 0.3, y: 0.78 }, target: { x: 0.3, y: 0.78 } })).toThrow(/must differ/);
    expect(() => placeEffectSequence(wildAnchors(), { attacker: { x: -0.1, y: 0.78 }, target: { x: 0.3, y: 0.78 } })).toThrow(/normalized/);
  });
});
