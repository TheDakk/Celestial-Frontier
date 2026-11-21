import type { PartFrame, PatternName } from '@cf/art-format';
import { PATTERN_TABLE, STRENGTH_KEEP, type PatternRule } from './patterns';

// Flow values and spot values cycle at 15; a colour ramp holds 4 shades (values 1-4, 5-8, 9-12).
const CYCLE = 15;
const RAMP = 4;
const LAST_DRAWN = 12;
// A roll the part does not carry counts as the highest roll: it is kept only at full.
const NO_ROLL = 99;

/** A frame pixel a mark may replace: drawn with a value 1 to 12 (never empty, eye, highlight, glow or iris). */
const markable = (v: number): boolean => v >= 1 && v <= LAST_DRAWN;

/**
 * Paints the creature's marks into a copy of one part frame's pixels.
 * A hand-drawn layer named after the pattern wins and is applied as drawn; otherwise the pattern's rule
 * paints the guide layers (`flow`, `spots`). Returns a new array of the frame's size, or `null` when the
 * frame has no layer that serves the pattern. Pattern `plain` returns an unchanged copy.
 * Only pixels drawn 1 to 12 are ever written; the frame and its layers are never changed.
 */
export function paintMarks(frame: PartFrame, pattern: PatternName, strength: 0 | 1 | 2, phase: number, rolls: readonly number[]): Uint8Array | null {
  const out = Uint8Array.from(frame.pixels);
  if (pattern === 'plain') return out;
  const keep: number = STRENGTH_KEEP[strength];
  const roll = (i: number): number => rolls[i] ?? NO_ROLL;
  const layers = frame.layers ?? {};

  const hand = layers[pattern];
  if (hand !== undefined) {
    paintHand(frame, hand, out, keep, roll);
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
  const spotAt = (x: number, y: number): number => (x < 0 || y < 0 || x >= frame.w || y >= frame.h ? 0 : (spots as Uint8Array)[y * frame.w + x] ?? 0);

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
          if (s === 0) break;
          const pos = place(f, base);
          if (chosen(s) ? !onLine(pos) : onLine(pos) && lineKept(pos)) value = mark;
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

/**
 * Applies a hand-drawn layer: each non-zero value over a drawn pixel replaces it. Its 4-connected marks
 * (over drawn pixels only) are numbered 0, 1, ... in row order of their first pixel; mark n is kept when
 * rolls[n % 15] is under the strength, so full keeps every mark.
 */
function paintHand(frame: PartFrame, layer: Uint8Array, out: Uint8Array, keep: number, roll: (i: number) => number): void {
  const { w, h } = frame;
  const counts = (i: number): boolean => (layer[i] ?? 0) !== 0 && markable(frame.pixels[i] ?? 0);
  const seen = new Uint8Array(w * h);
  let n = 0;
  for (let start = 0; start < w * h; start++) {
    if (seen[start] !== 0 || !counts(start)) continue;
    const kept = roll(n % CYCLE) < keep;
    n++;
    const stack = [start];
    seen[start] = 1;
    while (stack.length > 0) {
      const i = stack.pop() as number;
      if (kept) out[i] = layer[i] ?? 0;
      const x = i % w;
      const next = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i >= w ? i - w : -1, i + w < w * h ? i + w : -1];
      for (const j of next) {
        if (j < 0 || seen[j] !== 0 || !counts(j)) continue;
        seen[j] = 1;
        stack.push(j);
      }
    }
  }
}
