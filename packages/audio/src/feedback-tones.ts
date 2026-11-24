/* The feedback tones of the legacy game ("did that work?"): deny, confirm, fail, the fanfare and the
   planetfall arrival chord, as data, and the one scheduler that turns a tone into oscillators.

   The scheduler takes the context, the output node and the start time from its caller: it holds no
   context, reads no clock and decides nothing about sound being on, the volume or whether the context is
   running. Those stay with whoever calls it. */
import type { AudioNodeLike } from './runtime.js';

export interface ToneNote {
  readonly wave: 'sine' | 'triangle';
  readonly hz: number;
  /** When the oscillator starts, after the tone's own start. */
  readonly startMs: number;
  /** With `attackMs`: when the note's level is back at near silence, after the note's start. */
  readonly durMs: number;
  /** When the oscillator stops, after the note's start. */
  readonly stopMs: number;
  /** The level the note rises to, or holds when it has no attack. */
  readonly peak: number;
  /** The rise from near silence to `peak`. Absent: the note holds `peak` from start to stop, unshaped. */
  readonly attackMs?: number;
  readonly detuneCents?: number;
}

/** One envelope every note of a tone passes through, timed from the tone's start. */
export interface ToneMaster {
  readonly peak: number;
  readonly attackMs: number;
  readonly durMs: number;
}

export interface Tone {
  readonly notes: readonly ToneNote[];
  readonly master?: ToneMaster;
}

export type FeedbackTone = 'deny' | 'confirm' | 'fail' | 'fanfare';

export interface ToneParamLike {
  value: number;
  setValueAtTime(value: number, time: number): unknown;
  exponentialRampToValueAtTime(value: number, time: number): unknown;
}

export interface ToneGainLike extends AudioNodeLike {
  readonly gain: ToneParamLike;
}

export interface ToneOscillatorLike {
  type: string;
  readonly frequency: { value: number };
  readonly detune: { value: number };
  connect(destination: AudioNodeLike): unknown;
  start(when?: number): void;
  stop(when?: number): void;
}

/** The two things the scheduler asks of an audio context. A browser AudioContext fits. */
export interface ToneContextLike {
  createOscillator(): ToneOscillatorLike;
  createGain(): ToneGainLike;
}

/** Near silence: an exponential ramp cannot start from or reach zero. */
const FLOOR = 0.0001;

function tone(notes: readonly ToneNote[], master?: ToneMaster): Tone {
  const frozen = Object.freeze(notes.map((note) => Object.freeze(note)));
  return Object.freeze(master ? { notes: frozen, master: Object.freeze(master) } : { notes: frozen });
}

/** A short shaped note: up in 12 ms, down by `durMs`, the oscillator let run 20 ms longer. */
function blip(wave: ToneNote['wave'], hz: number, startMs: number, durMs: number, peak: number): ToneNote {
  return { wave, hz, startMs, attackMs: 12, durMs, stopMs: durMs + 20, peak };
}

const FANFARE_HZ = [392, 494, 587, 784] as const;
const FANFARE_DETUNE_CENTS = [-4, 5] as const;

export const FEEDBACK_TONES: Readonly<Record<FeedbackTone, Tone>> = Object.freeze({
  deny: tone([blip('triangle', 200, 0, 100, 0.13), blip('triangle', 150, 80, 140, 0.11)]),
  confirm: tone([blip('sine', 660, 0, 90, 0.13), blip('sine', 990, 70, 120, 0.11)]),
  fail: tone([220, 207.6].map((hz, index): ToneNote => ({
    wave: 'sine', hz, startMs: index * 280, attackMs: 40, durMs: 1100, stopMs: 1200, peak: 0.09,
  }))),
  fanfare: tone(
    FANFARE_HZ.flatMap((hz, index) => FANFARE_DETUNE_CENTS.map((detuneCents): ToneNote => ({
      wave: 'triangle', hz, startMs: index * 110, attackMs: 30, durMs: 950, stopMs: 1000, peak: 0.1, detuneCents,
    }))),
    { peak: 0.18, attackMs: 50, durMs: 1700 },
  ),
});

const ARRIVAL_PARTIALS = [1, 1.5, 2, 3] as const;
const ARRIVAL_MS = 2000;

/** The planetfall chord of a world of this tier: the root climbs a semitone a tier and returns every fifth. */
export function arrivalChord(tier: number): Tone {
  const root = 110 * Math.pow(2, ((tier || 0) % 5) / 12);
  return tone(
    ARRIVAL_PARTIALS.map((partial, index): ToneNote => ({
      wave: index ? 'sine' : 'triangle',
      hz: root * partial,
      startMs: index * 60,
      durMs: ARRIVAL_MS - index * 60,
      stopMs: ARRIVAL_MS - index * 60,
      peak: 0.5 / (index + 1),
      detuneCents: index % 2 ? 6 : -6,
    })),
    { peak: 0.3, attackMs: 350, durMs: ARRIVAL_MS },
  );
}

function shape(gain: ToneParamLike, at: number, attackMs: number, durMs: number, peak: number): void {
  gain.setValueAtTime(FLOOR, at);
  gain.exponentialRampToValueAtTime(peak, at + attackMs / 1000);
  gain.exponentialRampToValueAtTime(FLOOR, at + durMs / 1000);
}

/** Schedules every note of `tone` on `ctx`, into `out`, the tone starting at `atSeconds` of the context's time. */
export function scheduleTone(ctx: ToneContextLike, out: AudioNodeLike, tone: Tone, atSeconds: number): void {
  let bus = out;
  if (tone.master && tone.notes.length > 0) {
    const master = ctx.createGain();
    shape(master.gain, atSeconds, tone.master.attackMs, tone.master.durMs, tone.master.peak);
    master.connect(out);
    bus = master;
  }
  for (const note of tone.notes) {
    const start = atSeconds + note.startMs / 1000;
    const oscillator = ctx.createOscillator();
    const level = ctx.createGain();
    oscillator.type = note.wave;
    oscillator.frequency.value = note.hz;
    if (note.detuneCents !== undefined) oscillator.detune.value = note.detuneCents;
    if (note.attackMs === undefined) level.gain.value = note.peak;
    else shape(level.gain, start, note.attackMs, note.durMs, note.peak);
    oscillator.connect(level);
    level.connect(bus);
    oscillator.start(start);
    oscillator.stop(atSeconds + (note.startMs + note.stopMs) / 1000);
  }
}
