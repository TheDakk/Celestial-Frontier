import { isOwnRamp, type PartFrame, type PatternName } from '@cf/art-format';
import { MOTTLE_LINE_STEP, MOTTLE_PAIR_SHIFT, MOTTLE_SPOT_STEP, PATTERN_TABLE, STRENGTH_KEEP, type PatternRule } from './patterns';

// Flow values and spot values cycle at 15; a colour ramp holds 4 shades (values 1-4, 5-8, 9-12).
const CYCLE = 15;
const RAMP = 4;
const LAST_DRAWN = 12;
// A roll the part does not carry counts as the highest roll: it is kept only at full.
const NO_ROLL = 99;

/** A frame pixel a mark may replace: drawn with a value 1 to 12 (never empty, eye, highlight, glow, iris, bone or deep). */
const markable = (v: number): boolean => v >= 1 && v <= LAST_DRAWN;
/** A value a hand-drawn layer may write: a hide ramp value 1 to 12 or an own-ramp value 21 to 28 (bone or deep). */
export const handValue = (v: number): boolean => markable(v) || isOwnRamp(v);

/**
 * Paints the creature's marks into a copy of one part frame's pixels.
 * A hand-drawn layer named after the pattern wins and is applied as drawn at every strength; otherwise the pattern's rule
 * paints the guide layers (`flow`, `spots`). Returns a new array of the frame's size, or `null` when the
 * frame has no layer that serves the pattern. Pattern `plain` returns an unchanged copy.
 * Only pixels drawn 1 to 12 are ever written, so bone and deep (21 to 28) are never marked; the frame and its layers are never changed.
 */
export function paintMarks(frame: PartFrame, pattern: PatternName, strength: 0 | 1 | 2, phase: number, rolls: readonly number[]): Uint8Array | null {
  const out = Uint8Array.from(frame.pixels);
  if (pattern === 'plain') return out;
  const keep: number = STRENGTH_KEEP[strength];
  const roll = (i: number): number => rolls[i] ?? NO_ROLL;
  const layers = frame.layers ?? {};

  const hand = layers[pattern];
  if (hand !== undefined) {
    for (let i = 0; i < out.length; i++) {
      const v = hand[i] ?? 0;
      // Only a hide, bone or deep value is written: a frame built in code could hold any value in its hand layer.
      if (handValue(v) && markable(frame.pixels[i] ?? 0)) out[i] = v;
    }
    return out;
  }

  const rule = PATTERN_TABLE[pattern];
  const flow = layers.flow;
  const spots = layers.spots;
  const readsFlow = rule.mode !== 'spots' && rule.mode !== 'rings';
  const readsSpots = rule.mode !== 'lines';
  if ((readsFlow && flow === undefined) || (readsSpots && spots === undefined)) return null;

  const base = phase % CYCLE;
  /** The flow value's place in the 15-step cycle at this phase, or -1 for no line. */
  const place = (f: number, at: number): number => (f === 0 ? -1 : (f - 1 + at) % CYCLE);
  const onLine = (pos: number): boolean => pos >= 0 && pos % rule.period < rule.on;
  /** Stripe k = floor(pos / period), counted down without division, is kept when its roll is under the strength. */
  const lineKept = (pos: number): boolean => {
    let k = 0;
    for (let rest = pos; rest >= rule.period; rest -= rule.period) k++;
    return roll(k) < keep;
  };
  const chosen = (s: number): boolean => s !== 0 && roll(s - 1) * 100 < rule.percent * keep;
  /** The spot value at (x, y); outside the frame or on a pixel a mark may not replace it is 0, so a rim forms there. */
  const spotAt = (x: number, y: number): number => {
    if (x < 0 || y < 0 || x >= frame.w || y >= frame.h) return 0;
    const i = y * frame.w + x;
    return markable(frame.pixels[i] ?? 0) ? (spots as Uint8Array)[i] ?? 0 : 0;
  };

  for (let y = 0; y < frame.h; y++) {
    for (let x = 0; x < frame.w; x++) {
      const i = y * frame.w + x;
      const host = frame.pixels[i] ?? 0;
      if (!markable(host)) continue;
      const mark = markValue(rule, host);
      const f = flow === undefined ? 0 : flow[i] ?? 0;
      const s = spots === undefined ? 0 : spots[i] ?? 0;
      let value = 0;
      switch (rule.mode) {
        case 'lines': {
          const pos = place(f, base);
          if (onLine(pos) && lineKept(pos)) value = mark;
          break;
        }
        case 'spots':
          if (chosen(s)) value = mark;
          break;
        case 'rings':
          if (chosen(s)) {
            const rim = spotAt(x - 1, y) !== s || spotAt(x + 1, y) !== s || spotAt(x, y - 1) !== s || spotAt(x, y + 1) !== s;
            value = rim ? mark : rule.centre;
          }
          break;
        case 'mottle': {
          // Inside a spot blob and on a flow line only; the cell is the blob crossed with a pair of neighbouring lines.
          if (s === 0 || f === 0) break;
          const cell = (s * MOTTLE_SPOT_STEP + (place(f, base) >> MOTTLE_PAIR_SHIFT) * MOTTLE_LINE_STEP) % CYCLE;
          if (roll(cell) * 100 < rule.percent * keep) value = mark;
          break;
        }
        case 'veins': {
          const pos = place(f, chosen(s) ? base + rule.jog : base);
          if (onLine(pos) && lineKept(pos)) value = mark;
          break;
        }
      }
      if (value !== 0) out[i] = value;
    }
  }
  return out;
}

/** The rule's mark value for a host pixel 1-12, by the host's shade 0-3 inside its own ramp. */
function markValue(rule: PatternRule, host: number): number {
  return rule.shade[(host - 1) % RAMP] ?? 0;
}

