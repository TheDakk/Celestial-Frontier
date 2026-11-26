import { quotient } from './planet-noise';

/** A ramp as the artist drew it: four colours (0xRRGGBB), lightest first, and the hue in whole degrees they were
 *  drawn at. */
export interface RampRule { hue: number; swatches: readonly [number, number, number, number] }

/** n sixtieths to the nearest whole number, a half going to the even one. n is 0 or more. */
function sixtieths(n: number): number {
  const whole = quotient(n, 60);
  const rest = n - whole * 60;
  return rest > 30 || (rest === 30 && (whole & 1) === 1) ? whole + 1 : whole;
}

/** A colour with its hue turned `by` whole degrees (0 to 359), its saturation and lightness kept: the artist's rule,
 *  to hue, saturation and lightness and back, each channel to the nearest byte and a half to the even one. Keeping
 *  the saturation and the lightness is keeping the strongest and the weakest channel, so only the middle channel is
 *  worked out, and a turn of nothing gives the colour back. A hue is held as sixtieths of a channel step: 60 times
 *  the spread between strongest and weakest is one sixth of the wheel. */
function turned(rgb: number, by: number): number {
  const [r, g, b] = [(rgb >> 16) & 255, (rgb >> 8) & 255, rgb & 255];
  const [most, least] = [Math.max(r, g, b), Math.min(r, g, b)];
  const spread = most - least;
  if (spread === 0) return rgb;
  const sixth = 60 * spread;
  const own = most === r ? (g >= b ? 60 * (g - b) : 6 * sixth - 60 * (b - g)) : most === g ? 2 * sixth + 60 * (b - r) : 4 * sixth + 60 * (r - g);
  const hue = own + by * spread;
  const at = hue >= 6 * sixth ? hue - 6 * sixth : hue;
  const part = quotient(at, sixth);
  const along = at - part * sixth;
  const up = sixtieths(60 * least + along);
  const down = sixtieths(60 * most - along);
  const made = [[most, up, least], [down, most, least], [least, most, up], [least, down, most], [up, least, most], [most, least, down]][part] ?? [r, g, b];
  return ((made[0] ?? 0) << 16) | ((made[1] ?? 0) << 8) | (made[2] ?? 0);
}

/** The artist's ramp at any whole hue: each colour's hue turned by as far as the hue is from the rule's, so the
 *  colours of a ramp, and the ramps of a kit, keep the hues between them. At the rule's own hue it is the artist's
 *  ramp. Hues a whole turn apart give the same ramp. */
export function madeRamp(rule: RampRule, hue: number): [number, number, number, number] {
  if (!Number.isInteger(hue) || !Number.isInteger(rule.hue)) throw new Error(`a ramp is made at a whole hue, not ${Number.isInteger(hue) ? rule.hue : hue}`);
  const by = (((hue - rule.hue) % 360) + 360) % 360;
  const [a, b, c, d] = rule.swatches;
  return [turned(a, by), turned(b, by), turned(c, by), turned(d, by)];
}

/** A colour in the night: `share` sixteenths of its own colour and the rest of the night sky's, a channel at a time,
 *  as the map's shade item works it. A share past 16 is a light, and stops at white. */
export function nightOf(rgb: number, share: number, sky: number): number {
  const rest = Math.max(0, 16 - share);
  const at = (shift: number): number => Math.min(255, (((rgb >> shift) & 255) * share + ((sky >> shift) & 255) * rest) >> 4);
  return (at(16) << 16) | (at(8) << 8) | at(0);
}
