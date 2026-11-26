import { quotient } from './planet-noise';

type Four = readonly [number, number, number, number];
/** A ramp as the gas kit rules it: four colours (0xRRGGBB) as the artist drew them, in the kit's order, and the hue
 *  in whole degrees they were drawn at. At another hue each colour's hue is turned by as far as that hue is from this
 *  one, its saturation and lightness kept. */
export interface SwatchRule { hue: number; swatches: Four }
/** A ramp as the terran kit rules it: for each of its four steps, in the kit's order, how many whole degrees its hue
 *  stands from the ramp's, and its saturation and lightness in whole hundredths. `hue` is the hue the kit's reference
 *  colours were made at. */
export interface ShadeRule { hue: number; offsets: Four; saturation: Four; lightness: Four }
/** A ramp's rule, in the form its kit gives it. */
export type RampRule = SwatchRule | ShadeRule;

/** n over `parts` to the nearest whole number, a half going to the even one. n is 0 or more, parts is even. */
function nearest(n: number, parts: number): number {
  const whole = quotient(n, parts);
  const rest = 2 * (n - whole * parts);
  return rest > parts || (rest === parts && (whole & 1) === 1) ? whole + 1 : whole;
}
const sixtieths = (n: number): number => nearest(n, 60);
/** The three channels of a colour whose strongest is `most`, weakest `least`, and the one between `up` when it rises
 *  across its sixth of the wheel and `down` when it falls, in the sixth numbered `part` from red. */
function wheel(part: number, most: number, least: number, up: number, down: number): number {
  const made = [[most, up, least], [down, most, least], [least, most, up], [least, down, most], [up, least, most], [most, least, down]][part] ?? [most, most, most];
  return ((made[0] ?? 0) << 16) | ((made[1] ?? 0) << 8) | (made[2] ?? 0);
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
  return wheel(part, most, least, up, down);
}

/** The colour of a hue in whole degrees (0 to 359) with a saturation and a lightness in whole hundredths: the usual
 *  rule, each channel to the nearest byte and a half to the even one, worked exactly. With `spread` the saturation
 *  times how far the lightness is from black or white, whichever is nearer, a channel in 600,000ths of white is
 *  30 * (200 * lightness - spread) at its weakest, 30 * (200 * lightness + spread) at its strongest, and between
 *  them the weakest and `spread` for every degree across its sixth of the wheel. */
function shaded(hue: number, saturation: number, lightness: number): number {
  const spread = (lightness > 50 ? 200 - 2 * lightness : 2 * lightness) * saturation;
  const part = quotient(hue, 60);
  const along = hue - part * 60;
  const [least, most] = [30 * (200 * lightness - spread), 30 * (200 * lightness + spread)];
  const byte = (n: number): number => nearest(255 * n, 600000);
  return wheel(part, byte(most), byte(least), byte(least + spread * along), byte(least + spread * (60 - along)));
}

/** The artist's ramp at any whole hue, by its kit's rule, its four colours in the rule's own order. Either way the
 *  colours of a ramp keep the hues between them, at the rule's own hue the ramp is the artist's reference ramp, and
 *  hues a whole turn apart give the same ramp. */
export function madeRamp(rule: RampRule, hue: number): [number, number, number, number] {
  if (!Number.isInteger(hue) || !Number.isInteger(rule.hue)) throw new Error(`a ramp is made at a whole hue, not ${Number.isInteger(hue) ? rule.hue : hue}`);
  if ('offsets' in rule) {
    const step = (i: 0 | 1 | 2 | 3): number => {
      for (const part of [rule.saturation[i], rule.lightness[i]]) {
        if (!Number.isInteger(part) || part < 0 || part > 100) throw new Error(`a ramp's saturation and lightness are whole hundredths, 0 to 100, not ${part}`);
      }
      return shaded((((hue + rule.offsets[i]) % 360) + 360) % 360, rule.saturation[i], rule.lightness[i]);
    };
    return [step(0), step(1), step(2), step(3)];
  }
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
