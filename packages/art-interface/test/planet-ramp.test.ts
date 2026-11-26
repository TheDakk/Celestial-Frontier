import { describe, expect, it } from 'vitest';
import { madeRamp, nightOf, type ShadeRule, type SwatchRule } from '../src/index';

/** The gas kit's four reference ramps at its reference hue, as its kit.md lists them. */
const KIT_HUE = 32;
const KIT: Record<string, SwatchRule> = {
  jovian: { hue: KIT_HUE, swatches: [0xd5ae82, 0xbc8458, 0xa96742, 0x854536] },
  'cloud-cream': { hue: KIT_HUE, swatches: [0xfff1d9, 0xf8d9a4, 0xe8b76f, 0xd69963] },
  'storm-umber': { hue: KIT_HUE, swatches: [0xd68041, 0xad532f, 0x803e32, 0x573943] },
  'polar-belt': { hue: KIT_HUE, swatches: [0xb6a5a3, 0xa58b88, 0x867481, 0x62596e] },
};
const channels = (rgb: number): [number, number, number] => [(rgb >> 16) & 255, (rgb >> 8) & 255, rgb & 255];
/** Twice a colour's lightness in the artist's rule: its strongest channel and its weakest. */
const light = (rgb: number): number => Math.max(...channels(rgb)) + Math.min(...channels(rgb));
const luma = (rgb: number): number => { const [r, g, b] = channels(rgb); return 299 * r + 587 * g + 114 * b; };

/** The artist's rule in fractions: to hue, saturation and lightness, the hue turned, and back. Each channel is
 *  returned unrounded. */
function turned(rgb: number, by: number): [number, number, number] {
  const [r, g, b] = channels(rgb).map((v) => v / 255) as [number, number, number];
  const [max, min] = [Math.max(r, g, b), Math.min(r, g, b)];
  if (max === min) return [r * 255, g * 255, b * 255];
  const l = (max + min) / 2;
  const s = l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
  const h0 = max === r ? ((g - b) / (max - min) + 6) % 6 : max === g ? (b - r) / (max - min) + 2 : (r - g) / (max - min) + 4;
  const h = (((h0 * 60 + by) % 360) + 360) % 360;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const part = (at: number): number => {
    const t = ((at % 360) + 360) % 360;
    return (t < 60 ? p + ((q - p) * t) / 60 : t < 180 ? q : t < 240 ? p + ((q - p) * (240 - t)) / 60 : p) * 255;
  };
  return [part(h + 120), part(h), part(h - 120)];
}

describe('a ramp made at any whole hue', () => {
  it('at the reference hue is the artist\'s reference ramp, colour for colour', () => {
    for (const rule of Object.values(KIT)) expect(madeRamp(rule, KIT_HUE)).toEqual(rule.swatches);
  });
  it('at every one of the 360 hues is four distinct colours running light to dark, each as light as its reference', () => {
    for (const rule of Object.values(KIT)) {
      for (let hue = 0; hue < 360; hue++) {
        const ramp = madeRamp(rule, hue);
        expect(ramp).toHaveLength(4);
        expect(new Set(ramp).size).toBe(4);
        for (let i = 0; i < 4; i++) {
          expect(Number.isInteger(ramp[i]) && ramp[i]! >= 0 && ramp[i]! <= 0xffffff).toBe(true);
          expect(light(ramp[i]!)).toBe(light(rule.swatches[i]!));
          if (i > 0) expect(light(ramp[i]!)).toBeLessThan(light(ramp[i - 1]!));
        }
      }
    }
  });
  it('the body, cloud and polar ramps also run light to dark by the eye\'s weights at every hue, and the storm ramp\'s first two', () => {
    // The rule keeps a colour's lightness, not its weight to the eye: the storm ramp's last colour has a hue of its
    // own, and at blue hues it weighs more than the one before it.
    for (const [name, steps] of [['jovian', 4], ['cloud-cream', 4], ['polar-belt', 4], ['storm-umber', 2]] as const) {
      for (let hue = 0; hue < 360; hue++) {
        const ramp = madeRamp(KIT[name]!, hue);
        for (let i = 1; i < steps; i++) expect(luma(ramp[i]!)).toBeLessThan(luma(ramp[i - 1]!));
      }
    }
  });
  it('is the artist\'s rule worked in fractions, each channel rounded to the nearest byte, at every hue', () => {
    let checked = 0;
    for (const rule of Object.values(KIT)) {
      for (let hue = 0; hue < 360; hue++) {
        const ramp = madeRamp(rule, hue);
        rule.swatches.forEach((swatch, i) => {
          const want = turned(swatch, hue - rule.hue);
          channels(ramp[i]!).forEach((got, c) => {
            const exact = want[c]!;
            // A channel that lands a hair from halfway between two bytes is the fractions' to lose, not the rule's.
            if (Math.abs(Math.abs(exact - Math.floor(exact)) - 0.5) < 1e-6) return;
            expect(got).toBe(Math.round(exact));
            checked++;
          });
        });
      }
    }
    expect(checked).toBeGreaterThan(16_000);
  });
  it('rounds a channel that lands halfway to the even byte', () => {
    // Weakest 0, strongest 255, hue 0: 30 degrees on, the middle channel is 127 and a half, and 128 is even; from a
    // weakest of 2 it is 128 and a half, and 128 again.
    expect(madeRamp({ hue: 0, swatches: [0xff0000, 0xff0202, 0x800000, 0x400000] }, 30).slice(0, 2)).toEqual([0xff8000, 0xff8002]);
  });
  it('hue 0 and hue 360 agree, as do any two hues a whole turn apart', () => {
    for (const rule of Object.values(KIT)) {
      expect(madeRamp(rule, 360)).toEqual(madeRamp(rule, 0));
      expect(madeRamp(rule, -1)).toEqual(madeRamp(rule, 359));
      expect(madeRamp(rule, 392)).toEqual(rule.swatches);
    }
  });
  it('a grey stays the grey it is at every hue, and a hue that is not whole is refused', () => {
    for (let hue = 0; hue < 360; hue += 7) expect(madeRamp({ hue: 32, swatches: [0xeeeeee, 0x999999, 0x555555, 0x111111] }, hue)).toEqual([0xeeeeee, 0x999999, 0x555555, 0x111111]);
    expect(() => madeRamp(KIT['jovian']!, 0.5)).toThrow('a ramp is made at a whole hue, not 0.5');
  });
});

/** The terran kit's nine roles as its kit.md lists them, dark to light: reference hue, hue offsets, saturation and
 *  lightness in hundredths, and the kit's own reference colours. */
const TERRAN: Record<string, [ShadeRule, number[]]> = {
  pelagic: [{ hue: 213, offsets: [10, 3, -4, -10], saturation: [58, 65, 63, 60], lightness: [26, 31, 36, 42] }, [0x1c3269, 0x1c4582, 0x225e96, 0x2b7aab]],
  shoal: [{ hue: 177, offsets: [11, 4, -3, -9], saturation: [67, 60, 54, 54], lightness: [32, 40, 54, 70] }, [0x1b7a88, 0x29a1a3, 0x4ac9bc, 0x89dccb]],
  meadow: [{ hue: 81, offsets: [13, 5, -4, -12], saturation: [34, 39, 49, 54], lightness: [34, 46, 59, 71] }, [0x537439, 0x7ba348, 0xadca63, 0xd1dd8d]],
  canopy: [{ hue: 146, offsets: [12, 6, -4, -16], saturation: [37, 40, 38, 32], lightness: [24, 33, 42, 53] }, [0x275443, 0x327656, 0x429460, 0x61ae6e]],
  stone: [{ hue: 29, offsets: [-11, -6, 1, 8], saturation: [24, 29, 32, 34], lightness: [36, 47, 60, 74] }, [0x725346, 0x9b7055, 0xba9978, 0xd3c2a6]],
  sand: [{ hue: 42, offsets: [-14, -8, -2, 4], saturation: [46, 53, 63, 66], lightness: [46, 57, 68, 81] }, [0xab723f, 0xcb9957, 0xe1bf7a, 0xefe0af]],
  tundra: [{ hue: 100, offsets: [40, 25, 4, -13], saturation: [17, 17, 22, 26], lightness: [36, 46, 58, 71] }, [0x4c6b57, 0x618965, 0x89ab7c, 0xb7c8a2]],
  ice: [{ hue: 194, offsets: [14, 5, -4, -13], saturation: [38, 46, 44, 40], lightness: [56, 72, 84, 93] }, [0x6492b9, 0x97c4d8, 0xc4e2e8, 0xe6f4f4]],
  vapour: [{ hue: 201, offsets: [14, 6, -2, -11], saturation: [34, 36, 43, 44], lightness: [68, 79, 88, 96] }, [0x92a9c9, 0xb6cbdd, 0xd3e5ee, 0xf0f8f9]],
};
/** A hue, saturation and lightness as a colour, in fractions, each channel unrounded. */
function shaded(hue: number, s: number, l: number): [number, number, number] {
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const part = (at: number): number => {
    const t = ((at % 360) + 360) % 360;
    return (t < 60 ? p + ((q - p) * t) / 60 : t < 180 ? q : t < 240 ? p + ((q - p) * (240 - t)) / 60 : p) * 255;
  };
  return [part(hue + 120), part(hue), part(hue - 120)];
}

describe('a ramp made from hue offsets, saturations and lightnesses', () => {
  it('at each role\'s reference hue is the terran kit\'s own reference ramp, colour for colour, dark to light', () => {
    for (const [rule, reference] of Object.values(TERRAN)) expect(madeRamp(rule, rule.hue)).toEqual(reference);
  });
  it('at every one of the 360 hues, each of the nine roles\' 1,440 colours is the kit\'s rule worked in fractions and rounded to the nearest byte', () => {
    for (const [rule] of Object.values(TERRAN)) {
      let checked = 0;
      for (let hue = 0; hue < 360; hue++) {
        const ramp = madeRamp(rule, hue);
        expect(new Set(ramp).size).toBe(4);
        ramp.forEach((made, i) => {
          const want = shaded(hue + rule.offsets[i]!, rule.saturation[i]! / 100, rule.lightness[i]! / 100);
          // Six channels in all land halfway between two bytes; there the fractions may fall either way.
          if (want.some((exact) => Math.abs(Math.abs(exact - Math.floor(exact)) - 0.5) < 1e-6)) return;
          expect(channels(made)).toEqual(want.map((exact) => Math.round(exact)));
          if (i > 0) expect(light(made)).toBeGreaterThan(light(ramp[i - 1]!));
          checked++;
        });
      }
      expect(checked).toBeGreaterThanOrEqual(1434);
    }
  });
  it('a channel that lands halfway goes to the even byte, hues a whole turn apart agree, and no saturation is a grey', () => {
    // Lightness 50 and saturation 100 at hue 30: the middle channel is 127 and a half.
    const rule: ShadeRule = { hue: 0, offsets: [0, 0, 0, 0], saturation: [100, 100, 0, 0], lightness: [50, 30, 40, 100] };
    expect(madeRamp(rule, 30)).toEqual([0xff8000, 0x994c00, 0x666666, 0xffffff]);
    expect(madeRamp(TERRAN['ice']![0], 360 + 194)).toEqual(TERRAN['ice']![1]);
    expect(madeRamp(TERRAN['ice']![0], 194 - 720)).toEqual(TERRAN['ice']![1]);
  });
  it('refuses a saturation or lightness that is not a whole number of hundredths from 0 to 100', () => {
    expect(() => madeRamp({ hue: 0, offsets: [0, 0, 0, 0], saturation: [10, 20, 30, 101], lightness: [10, 20, 30, 40] }, 0)).toThrow('a ramp\'s saturation and lightness are whole hundredths, 0 to 100, not 101');
    expect(() => madeRamp({ hue: 0, offsets: [0, 0, 0, 0], saturation: [10, 20, 30, 40], lightness: [10, 20, -1, 40] }, 0)).toThrow('a ramp\'s saturation and lightness are whole hundredths, 0 to 100, not -1');
  });
});

describe('a colour in the night', () => {
  it('keeps its share of sixteenths and takes the rest from the night sky, a channel at a time', () => {
    expect(nightOf(0xffffff, 16, 0x030610)).toBe(0xffffff);
    expect(nightOf(0xffffff, 0, 0x030610)).toBe(0x030610);
    expect(nightOf(0x808080, 8, 0x000000)).toBe(0x404040);
    expect(nightOf(0xd5ae82, 10, 0x030610)).toBe((((0xd5 * 10 + 3 * 6) >> 4) << 16) | (((0xae * 10 + 6 * 6) >> 4) << 8) | ((0x82 * 10 + 0x10 * 6) >> 4));
  });
  it('a cloud in full night is two sixteenths of its colour over a black sky', () => {
    expect(nightOf(0xfff1d9, 2, 0)).toBe((31 << 16) | (30 << 8) | 27);
  });
  it('a share past sixteen is a light and never passes white', () => {
    expect(nightOf(0xf0f0f0, 19, 0x030610)).toBe(0xffffff);
  });
});
