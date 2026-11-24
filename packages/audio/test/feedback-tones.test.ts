import { describe, expect, it } from 'vitest';
import {
  FEEDBACK_TONES,
  arrivalChord,
  scheduleTone,
  type AudioNodeLike,
  type Tone,
  type ToneContextLike,
} from '../src/index.js';

/* A fake context that records what was asked of it. No fixture exists for these tones: every expected
   value is cited by the LEGACY line it is read from. */

type ParamEvent = readonly [kind: 'set' | 'exp', value: number, time: number];

class FakeParam {
  value = 0;
  readonly events: ParamEvent[] = [];
  setValueAtTime(value: number, time: number): void { this.events.push(['set', value, time]); }
  exponentialRampToValueAtTime(value: number, time: number): void { this.events.push(['exp', value, time]); }
}

class FakeNode implements AudioNodeLike {
  readonly to: AudioNodeLike[] = [];
  connect(destination: AudioNodeLike): void { this.to.push(destination); }
  disconnect(): void { this.to.length = 0; }
}

class FakeGain extends FakeNode {
  readonly gain = new FakeParam();
}

class FakeOscillator extends FakeNode {
  type = 'unset';
  readonly frequency = new FakeParam();
  readonly detune = new FakeParam();
  startedAt: number | null = null;
  stoppedAt: number | null = null;
  start(when?: number): void { this.startedAt = when ?? null; }
  stop(when?: number): void { this.stoppedAt = when ?? null; }
}

class FakeContext implements ToneContextLike {
  readonly oscillators: FakeOscillator[] = [];
  readonly gains: FakeGain[] = [];
  createOscillator(): FakeOscillator {
    const node = new FakeOscillator();
    this.oscillators.push(node);
    return node;
  }
  createGain(): FakeGain {
    const node = new FakeGain();
    this.gains.push(node);
    return node;
  }
}

function play(tone: Tone, at: number): { ctx: FakeContext; out: FakeNode } {
  const ctx = new FakeContext();
  const out = new FakeNode();
  scheduleTone(ctx, out, tone, at);
  return { ctx, out };
}

/** The events of a gain, with times rounded to the microsecond so that sums of seconds compare. */
function envelope(gain: FakeGain): ParamEvent[] {
  return gain.gain.events.map(([kind, value, time]) => [kind, value, Math.round(time * 1e6) / 1e6] as const);
}

const hz = (tone: Tone): number[] => tone.notes.map((note) => note.hz);
const waves = (tone: Tone): string[] => tone.notes.map((note) => note.wave);

describe('the feedback tones as data', () => {
  it('deny falls: 200 then 150, both triangle', () => {
    // LEGACY main.js:16262
    expect(FEEDBACK_TONES.deny.notes).toEqual([
      { wave: 'triangle', hz: 200, startMs: 0, attackMs: 12, durMs: 100, stopMs: 120, peak: 0.13 },
      { wave: 'triangle', hz: 150, startMs: 80, attackMs: 12, durMs: 140, stopMs: 160, peak: 0.11 },
    ]);
    expect(FEEDBACK_TONES.deny.master).toBeUndefined();
  });

  it('confirm rises: 660 then 990, both sine', () => {
    // LEGACY main.js:16263
    expect(FEEDBACK_TONES.confirm.notes).toEqual([
      { wave: 'sine', hz: 660, startMs: 0, attackMs: 12, durMs: 90, stopMs: 110, peak: 0.13 },
      { wave: 'sine', hz: 990, startMs: 70, attackMs: 12, durMs: 120, stopMs: 140, peak: 0.11 },
    ]);
    expect(FEEDBACK_TONES.confirm.master).toBeUndefined();
  });

  it('deny and confirm share no frequency and no wave', () => {
    // LEGACY main.js:16257 (a blocked action must sound unmistakably unlike a successful one)
    const { deny, confirm } = FEEDBACK_TONES;
    expect(hz(deny).filter((value) => hz(confirm).includes(value))).toEqual([]);
    expect(waves(deny).filter((value) => waves(confirm).includes(value))).toEqual([]);
  });

  it('a blip reaches its peak in 12 ms and its oscillator stops 20 ms after its envelope ends', () => {
    // LEGACY main.js:16252 (the attack), main.js:16254 (the stop)
    for (const note of [...FEEDBACK_TONES.deny.notes, ...FEEDBACK_TONES.confirm.notes]) {
      expect(note.attackMs).toBe(12);
      expect(note.stopMs - note.durMs).toBe(20);
    }
  });

  it('fail is two sines, 220 then 207.6, 280 ms apart, each up in 40 ms and out at 1,100 ms', () => {
    // LEGACY main.js:16067-16074
    expect(FEEDBACK_TONES.fail.notes).toEqual([
      { wave: 'sine', hz: 220, startMs: 0, attackMs: 40, durMs: 1100, stopMs: 1200, peak: 0.09 },
      { wave: 'sine', hz: 207.6, startMs: 280, attackMs: 40, durMs: 1100, stopMs: 1200, peak: 0.09 },
    ]);
    expect(FEEDBACK_TONES.fail.master).toBeUndefined();
  });

  it('the fanfare climbs 392, 494, 587, 784, 110 ms apart, two triangles each at -4 and +5 cents', () => {
    // LEGACY main.js:16122 (the notes), main.js:16126-16129 (the pair, its envelope and its stop)
    const expected = [392, 494, 587, 784].flatMap((frequency, index) => [-4, 5].map((detuneCents) => ({
      wave: 'triangle', hz: frequency, startMs: index * 110, attackMs: 30, durMs: 950, stopMs: 1000, peak: 0.1, detuneCents,
    })));
    expect(FEEDBACK_TONES.fanfare.notes).toEqual(expected);
  });

  it('the fanfare passes through one master envelope: 0.18 at 50 ms, out at 1,700 ms', () => {
    // LEGACY main.js:16123-16124
    expect(FEEDBACK_TONES.fanfare.master).toEqual({ peak: 0.18, attackMs: 50, durMs: 1700 });
  });

  it('the tones cannot be changed by a caller', () => {
    expect(Object.isFrozen(FEEDBACK_TONES)).toBe(true);
    expect(Object.isFrozen(FEEDBACK_TONES.deny.notes)).toBe(true);
    expect(Object.isFrozen(FEEDBACK_TONES.deny.notes[0])).toBe(true);
    expect(Object.isFrozen(FEEDBACK_TONES.fanfare.master)).toBe(true);
  });
});

describe('the arrival chord', () => {
  it('the arrival root for tiers 0..5 is 110 x 2^(k/12) for k = 0,1,2,3,4,0', () => {
    // LEGACY main.js:16185
    const steps = [0, 1, 2, 3, 4, 0];
    for (const [tier, k] of steps.entries()) {
      expect(arrivalChord(tier).notes[0]!.hz).toBeCloseTo(110 * Math.pow(2, k / 12), 9);
    }
    expect(arrivalChord(0).notes[0]!.hz).toBe(110);
    expect(arrivalChord(5).notes[0]!.hz).toBe(110);
  });

  it('holds partials 1 (triangle), 1.5, 2 and 3 (sine), detuned -6, +6, -6, +6 cents', () => {
    // LEGACY main.js:16191-16194
    const chord = arrivalChord(0);
    expect(chord.notes.map((note) => note.hz)).toEqual([110, 165, 220, 330]);
    expect(chord.notes.map((note) => note.wave)).toEqual(['triangle', 'sine', 'sine', 'sine']);
    expect(chord.notes.map((note) => note.detuneCents)).toEqual([-6, 6, -6, 6]);
  });

  it('staggers the partials 60 ms apart at steady levels 0.5, 0.25, 0.5/3, 0.125, all stopping together at 2,000 ms', () => {
    // LEGACY main.js:16195 (the level, with no envelope of its own), main.js:16196 (start and stop)
    const chord = arrivalChord(3);
    expect(chord.notes.map((note) => note.startMs)).toEqual([0, 60, 120, 180]);
    expect(chord.notes.map((note) => note.peak)).toEqual([0.5, 0.25, 0.5 / 3, 0.125]);
    expect(chord.notes.map((note) => note.attackMs)).toEqual([undefined, undefined, undefined, undefined]);
    expect(chord.notes.map((note) => note.startMs + note.stopMs)).toEqual([2000, 2000, 2000, 2000]);
  });

  it('passes through one master envelope: 0.30 at 350 ms, out at 2,000 ms', () => {
    // LEGACY main.js:16187-16189
    expect(arrivalChord(2).master).toEqual({ peak: 0.3, attackMs: 350, durMs: 2000 });
  });

  it('a missing tier sounds as tier 0', () => {
    // LEGACY main.js:16185 ((tier||0)%5)
    expect(arrivalChord(Number.NaN).notes[0]!.hz).toBe(110);
  });
});

describe('scheduleTone', () => {
  it('creates one oscillator per note at the recorded start times', () => {
    for (const tone of [FEEDBACK_TONES.deny, FEEDBACK_TONES.confirm, FEEDBACK_TONES.fail, FEEDBACK_TONES.fanfare, arrivalChord(4)]) {
      const { ctx } = play(tone, 10);
      expect(ctx.oscillators).toHaveLength(tone.notes.length);
      for (const [index, note] of tone.notes.entries()) {
        const oscillator = ctx.oscillators[index]!;
        expect(oscillator.type).toBe(note.wave);
        expect(oscillator.frequency.value).toBe(note.hz);
        expect(oscillator.detune.value).toBe(note.detuneCents ?? 0);
        expect(oscillator.startedAt).toBeCloseTo(10 + note.startMs / 1000, 9);
        expect(oscillator.stoppedAt).toBeCloseTo(10 + (note.startMs + note.stopMs) / 1000, 9);
      }
    }
  });

  it('shapes each blip from near silence up to its peak and back, by exponential ramps', () => {
    // LEGACY main.js:16251-16253
    const { ctx, out } = play(FEEDBACK_TONES.deny, 5);
    expect(ctx.gains).toHaveLength(2);
    expect(envelope(ctx.gains[0]!)).toEqual([['set', 0.0001, 5], ['exp', 0.13, 5.012], ['exp', 0.0001, 5.1]]);
    expect(envelope(ctx.gains[1]!)).toEqual([['set', 0.0001, 5.08], ['exp', 0.11, 5.092], ['exp', 0.0001, 5.22]]);
    for (const [index, oscillator] of ctx.oscillators.entries()) {
      expect(oscillator.to).toEqual([ctx.gains[index]]);
      expect(ctx.gains[index]!.to).toEqual([out]);
    }
  });

  it('sends every fanfare note through the one master envelope, and only the master to the output', () => {
    // LEGACY main.js:16123-16125, main.js:16129
    const { ctx, out } = play(FEEDBACK_TONES.fanfare, 2);
    expect(ctx.gains).toHaveLength(9);
    const master = ctx.gains.find((gain) => gain.to.includes(out))!;
    expect(ctx.gains.filter((gain) => gain.to.includes(out))).toEqual([master]);
    expect(envelope(master)).toEqual([['set', 0.0001, 2], ['exp', 0.18, 2.05], ['exp', 0.0001, 3.7]]);
    const noteGains = ctx.gains.filter((gain) => gain !== master);
    for (const gain of noteGains) expect(gain.to).toEqual([master]);
    expect(envelope(noteGains[2]!)).toEqual([['set', 0.0001, 2.11], ['exp', 0.1, 2.14], ['exp', 0.0001, 3.06]]);
  });

  it('holds each arrival partial at its steady level under the master envelope', () => {
    // LEGACY main.js:16187-16190, main.js:16195
    const { ctx, out } = play(arrivalChord(0), 1);
    const master = ctx.gains.find((gain) => gain.to.includes(out))!;
    expect(envelope(master)).toEqual([['set', 0.0001, 1], ['exp', 0.3, 1.35], ['exp', 0.0001, 3]]);
    const partials = ctx.gains.filter((gain) => gain !== master);
    expect(partials.map((gain) => gain.gain.value)).toEqual([0.5, 0.25, 0.5 / 3, 0.125]);
    for (const gain of partials) {
      expect(gain.gain.events).toEqual([]);
      expect(gain.to).toEqual([master]);
    }
  });

  it('asks nothing of the context but oscillators and gains, and makes no sound of an empty tone', () => {
    const { ctx, out } = play({ notes: [] }, 0);
    expect(ctx.oscillators).toEqual([]);
    expect(ctx.gains).toEqual([]);
    expect(out.to).toEqual([]);
  });
});
