/* @module soundkit/music [domain] — the sparse score (D15 Stage 3, Claude 2026-09-26). Kit §2: "Music is sparse, melodic, painted in the
   same palette as the world it plays under, and always ducks." Seven states (the production plan's `menu, calm, wonder, tension, battle,
   major-battle, victory-discovery`), about 6.6 minutes in all: menu 45 s, calm 2 × 60 s, wonder 50 s, tension 40 s, battle and
   major-battle 55 s loops, and four 8 s stings (victory, discovery, defeat, triumph). Each piece is a deterministic SCORE (a seeded modal
   motif, developed by repetition and transposition, over a drone or an ostinato) played by original instruments from `organic.ts` —
   plucked strings, a wooden mallet, a breathed flute, a bowed drone, a frame drum — never a synthesizer bleep. Loops wrap their tail
   into their head, so the seam keeps the rhythm. Rendered mono at 32 kHz, levelled to −18 LUFS integrated, ≤ −1 dBTP. */
import { mulberry32 } from '@cf/domain-rand';
import { runJobV1 } from './ambience.js';
import { applyLevelV1, levelGainV1 } from './leveler.js';
import { LEVEL_GAINS_V1 } from './level-gains.generated.js';
import { bowed, breathTone, drum, len, mallet, mixInto, normalize, pluck } from './organic.js';

export const MUSIC_RATE = 32_000;
export const MUSIC_STATES_V1 = Object.freeze(['menu', 'calm', 'wonder', 'tension', 'battle', 'major-battle', 'victory-discovery'] as const);
export type MusicStateV1 = typeof MUSIC_STATES_V1[number];
export interface MusicPieceV1 { readonly id: string; readonly state: MusicStateV1; readonly seconds: number; readonly loop: boolean; readonly seed: number }
export const MUSIC_PIECES_V1: readonly MusicPieceV1[] = Object.freeze([
  { id: 'menu', state: 'menu', seconds: 45, loop: false, seed: 0x6d01 },
  { id: 'calm-a', state: 'calm', seconds: 60, loop: false, seed: 0x6d02 },
  { id: 'calm-b', state: 'calm', seconds: 60, loop: false, seed: 0x6d03 },
  { id: 'wonder', state: 'wonder', seconds: 50, loop: false, seed: 0x6d04 },
  { id: 'tension', state: 'tension', seconds: 40, loop: false, seed: 0x6d05 },
  { id: 'battle', state: 'battle', seconds: 55, loop: true, seed: 0x6d06 },
  { id: 'major-battle', state: 'major-battle', seconds: 55, loop: true, seed: 0x6d07 },
  { id: 'sting-victory', state: 'victory-discovery', seconds: 8, loop: false, seed: 0x6d08 },
  { id: 'sting-discovery', state: 'victory-discovery', seconds: 8, loop: false, seed: 0x6d09 },
  { id: 'sting-defeat', state: 'victory-discovery', seconds: 8, loop: false, seed: 0x6d0a },
  { id: 'sting-triumph', state: 'victory-discovery', seconds: 8, loop: false, seed: 0x6d0b },
].map((p) => Object.freeze(p as MusicPieceV1)));
export const MUSIC_TOTAL_SECONDS_V1 = MUSIC_PIECES_V1.reduce((s, p) => s + p.seconds, 0);

const MODES: Readonly<Record<string, readonly number[]>> = Object.freeze({
  mixolydian: [0, 2, 4, 5, 7, 9, 10], dorian: [0, 2, 3, 5, 7, 9, 10], lydian: [0, 2, 4, 6, 7, 9, 11], phrygian: [0, 1, 3, 5, 7, 8, 10],
  aeolian: [0, 2, 3, 5, 7, 8, 10], harmonic: [0, 2, 3, 5, 7, 8, 11], major: [0, 2, 4, 5, 7, 9, 11], pentatonic: [0, 2, 4, 7, 9],
});
interface Style { readonly mode: string; readonly root: number; readonly bpm: number; readonly lead: 'pluck' | 'flute' | 'mallet'; readonly density: number; readonly drone: boolean; readonly arp: boolean; readonly drums: 0 | 1 | 2; readonly bass: boolean }
const STYLE: Readonly<Record<string, Style>> = Object.freeze({
  menu: { mode: 'mixolydian', root: 62, bpm: 72, lead: 'pluck', density: 0.55, drone: true, arp: false, drums: 0, bass: false },
  'calm-a': { mode: 'dorian', root: 60, bpm: 66, lead: 'pluck', density: 0.4, drone: true, arp: false, drums: 0, bass: false },
  'calm-b': { mode: 'pentatonic', root: 65, bpm: 60, lead: 'flute', density: 0.35, drone: true, arp: false, drums: 0, bass: false },
  wonder: { mode: 'lydian', root: 64, bpm: 60, lead: 'flute', density: 0.45, drone: true, arp: true, drums: 0, bass: false },
  tension: { mode: 'phrygian', root: 57, bpm: 80, lead: 'pluck', density: 0.35, drone: true, arp: false, drums: 1, bass: false },
  battle: { mode: 'aeolian', root: 57, bpm: 100, lead: 'pluck', density: 0.6, drone: false, arp: false, drums: 2, bass: true },
  'major-battle': { mode: 'harmonic', root: 55, bpm: 108, lead: 'mallet', density: 0.65, drone: true, arp: false, drums: 2, bass: true },
  'sting-victory': { mode: 'major', root: 62, bpm: 96, lead: 'pluck', density: 1, drone: false, arp: true, drums: 0, bass: false },
  'sting-discovery': { mode: 'lydian', root: 67, bpm: 84, lead: 'mallet', density: 1, drone: false, arp: true, drums: 0, bass: false },
  'sting-defeat': { mode: 'aeolian', root: 50, bpm: 60, lead: 'pluck', density: 0.8, drone: true, arp: false, drums: 0, bass: false },
  'sting-triumph': { mode: 'mixolydian', root: 62, bpm: 100, lead: 'mallet', density: 1, drone: true, arp: true, drums: 1, bass: false },
});
const hz = (midi: number): number => 440 * Math.pow(2, (midi - 69) / 12);
const degree = (mode: readonly number[], root: number, d: number): number => { const o = Math.floor(d / mode.length), i = ((d % mode.length) + mode.length) % mode.length; return root + 12 * o + mode[i]!; };

interface Note { readonly beat: number; readonly beats: number; readonly midi: number; readonly vel: number }
/** The score: a 4–6 note motif, stated, answered a degree higher, varied and restated, phrase by phrase; rests by density. */
export function scoreV1(piece: MusicPieceV1): { readonly style: Style; readonly beats: number; readonly lead: readonly Note[] } {
  const st = STYLE[piece.id]!, mode = MODES[st.mode]!, r = mulberry32(piece.seed), beats = Math.floor((piece.seconds * st.bpm) / 60);
  const motif: { d: number; len: number }[] = []; let d = 0;
  for (let k = 0, m = 4 + Math.floor(3 * r()); k < m; k++) { d += [-2, -1, 1, 1, 2, 3][Math.floor(r() * 6)]!; motif.push({ d, len: [1, 1, 2, 0.5, 1.5][Math.floor(r() * 5)]! }); }
  const lead: Note[] = []; let beat = piece.id.startsWith('sting') ? 0 : 2, phrase = 0;
  while (beat < beats - 2) {
    const shift = [0, 1, 0, -1, 2, 0][phrase % 6]!, vary = phrase % 3 === 2;
    for (const [k, n] of motif.entries()) { if (beat >= beats - 1) break;
      const rest = !piece.id.startsWith('sting') && r() > st.density; const dd = n.d + shift + (vary && k === motif.length - 1 ? (r() > 0.5 ? 1 : -1) : 0);
      if (!rest) lead.push({ beat, beats: n.len, midi: degree(mode, st.root, dd), vel: 0.6 + 0.4 * r() }); beat += n.len; }
    beat += piece.id.startsWith('sting') ? 0.5 : 2 + Math.floor(3 * r() * (1 - st.density)); phrase++;
  }
  return { style: st, beats, lead };
}

/** Render one piece (mono, MUSIC_RATE), levelled to the music target. */
export const renderMusicPieceV1 = (piece: MusicPieceV1): Float32Array => runJobV1(musicJobV1(piece));
/** The raw render (peak 0.8, un-levelled) as a job that yields every few notes; the soundscape runs it in small slices during the
 *  silence before a piece. */
export function* rawMusicJobV1(piece: MusicPieceV1): Generator<void, Float32Array> {
  const { style: st, beats, lead } = scoreV1(piece), mode = MODES[st.mode]!, spb = 60 / st.bpm, tail = piece.loop ? 3 : 2, total = piece.seconds + tail, rate = MUSIC_RATE;
  const y = new Float32Array(len(total, rate)), r = mulberry32(piece.seed ^ 0xabc); let work = 0;
  const tick = (): boolean => ++work % 6 === 0;
  for (const n of lead) { if (tick()) yield;
    const s = n.beats * spb, at = len(n.beat * spb, rate), f = hz(n.midi);
    const v = st.lead === 'flute' ? breathTone(Math.max(0.3, s * 1.1), f, piece.seed + n.beat * 7, rate) : st.lead === 'mallet' ? mallet(Math.max(0.6, s * 1.5), f, piece.seed + n.beat * 7, rate) : pluck(Math.max(0.6, s * 2), f, 1.6, 0.5, piece.seed + n.beat * 7, rate);
    mixInto(y, v, 0.55 * n.vel, at);
  }
  if (st.drone) for (let b = 0; b < beats; b += 16) { yield; const sec = Math.min(16 * spb + 1.5, total - b * spb); if (sec <= 0.5) break;
    mixInto(y, bowed(sec, hz(degree(mode, st.root - 24, 0)), piece.seed + b, rate), 0.28, len(b * spb, rate));
    mixInto(y, bowed(sec, hz(degree(mode, st.root - 24, 4)), piece.seed + b + 1, rate), 0.16, len(b * spb, rate)); }
  if (st.arp) for (let b = 0; b < beats; b += 0.5) { if (r() > 0.7) continue; if (tick()) yield; const d = [0, 2, 4, 7, 4, 2][Math.floor(b * 2) % 6]!; mixInto(y, mallet(0.9, hz(degree(mode, st.root, d)), piece.seed + Math.round(b * 10), rate), 0.14, len(b * spb, rate)); }
  if (st.bass) for (let b = 0; b < beats; b += 2) { if (tick()) yield; const d = [0, 0, 5, 3][Math.floor(b / 2) % 4]!; mixInto(y, pluck(spb * 2.2, hz(degree(mode, st.root - 24, d)), 1.2, 0.3, piece.seed + b * 3, rate), 0.4, len(b * spb, rate)); }
  if (st.drums) for (let b = 0; b < beats; b += 1) { if (tick()) yield; const bar = b % 4;
    if (bar === 0 || (st.drums === 2 && bar === 2)) mixInto(y, drum(0.6, 62, piece.seed + b, 0, rate), 0.55, len(b * spb, rate));
    if (st.drums === 2) mixInto(y, drum(0.2, 180, piece.seed + b + 500, 0.6, rate), 0.18, len((b + 0.5) * spb, rate)); }
  const body = len(piece.seconds, rate);
  let out: Float32Array;
  if (piece.loop) { out = y.slice(0, body); for (let i = body; i < y.length; i++) out[i - body] = out[i - body]! + y[i]!; } // the tail wraps into the head
  else out = y.slice(0, body + len(1.5, rate));
  yield;
  return normalize(out, 0.8);
}
export const musicLevelKeyV1 = (piece: MusicPieceV1): string => `music:${piece.id}`;
/** The runtime job: the raw render, then the STORED level gain (generated, drift-tested; the meter only for content the table lacks). */
export function* musicJobV1(piece: MusicPieceV1): Generator<void, Float32Array> {
  const raw = yield* rawMusicJobV1(piece), stored = LEVEL_GAINS_V1[musicLevelKeyV1(piece)];
  const gain = stored ?? levelGainV1(raw, MUSIC_RATE, 'music'); yield;
  return applyLevelV1(raw, MUSIC_RATE, gain);
}
export const musicPieceV1 = (id: string): MusicPieceV1 => { const p = MUSIC_PIECES_V1.find((x) => x.id === id); if (!p) throw new RangeError(`no music piece ${id}`); return p; };
