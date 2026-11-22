import type { Palette } from './types';

/** The text character for each pixel value 0-20: index = value. Used by the part text format and the text pixel form. */
export const PIXEL_CHARS = '.123456789abcdefghijk';

/** Pixel values. Each ramp is four values, dark to light, starting at its base. */
export const PIXEL_TRANSPARENT = 0;
export const PIXEL_PRIMARY = 1;
export const PIXEL_ACCENT = 5;
export const PIXEL_UNDERSIDE = 9;
export const PIXEL_EYE = 13;
export const PIXEL_EYE_HIGHLIGHT = 14;
export const PIXEL_GLOW = 15;
/** Written only by the finishing pass, never by a part. */
export const PIXEL_OUTLINE = 16;
/** 17-20: the iris ramp, dark to light. Written only by the composer (from an eye part's 5-8), never by a part. */
export const PIXEL_IRIS = 17;
/** Iris ramps iris0..iris10: one per theme, in THEME_NAMES order (a generated creature's iris is its theme's). */
export const IRIS_RAMP_COUNT = 11;

/** The game's ability themes (ABILITY_THEMES in the combat package); a cross test holds the two together. */
export const THEME_NAMES = Object.freeze(['fire', 'frost', 'storm', 'tide', 'stone', 'venom', 'void', 'sand', 'chem', 'psionic', 'wild'] as const);
export type ThemeName = (typeof THEME_NAMES)[number];

/** Each theme's colour (0xRRGGBB), as the game's ability table gives it; a cross test holds the two together. */
export const THEME_COLOURS: Readonly<Record<ThemeName, number>> = Object.freeze({
  fire: 0xff7a4a, frost: 0x8fd6ff, storm: 0xffe06a, tide: 0x5fd0c8, stone: 0xcaa06a, venom: 0x9fe06a,
  void: 0xb58cff, sand: 0xe8c878, chem: 0xc0ff5a, psionic: 0xff9fe0, wild: 0x9fb6d6,
});

/**
 * Colour numbers (0xRRGGBB) for pixel values 0-20: index 0 is transparent and holds 0; 1-4, 5-8 and 9-12 are the
 * named primary, accent and underside ramps; 13-16 are the palette's eye, eye highlight, glow and outline colours; 17-20 are the named iris ramp.
 * A ramp name the palette does not hold gives four zeros and is listed in `unknown`; never throws.
 * With a `tint` (a theme colour, 0xRRGGBB), entries 1-12 take each channel as tintChannel(a, t), the original's hide mix
 * (62 parts colour, 38 parts theme); 0 and 13-20 are unchanged. Without one, the table is untouched.
 */
export function colourTable(
  palette: Palette,
  ramps: { primary: string; accent: string; underside: string; iris: string },
  tint?: number,
): { table: number[]; unknown: string[] } {
  const unknown: string[] = [];
  const rgb = (index: number): number => palette.colours[index] ?? 0;
  const ramp = (name: string): number[] => {
    const indices = Object.hasOwn(palette.ramps, name) ? palette.ramps[name] : undefined;
    if (indices === undefined) {
      unknown.push(name);
      return [0, 0, 0, 0];
    }
    return indices.map(rgb);
  };
  const table = [0, ...ramp(ramps.primary), ...ramp(ramps.accent), ...ramp(ramps.underside),
    rgb(palette.eye), rgb(palette.eyeHighlight), rgb(palette.glow), rgb(palette.outline), ...ramp(ramps.iris)];
  if (tint !== undefined) {
    for (let v = 1; v <= 12; v++) {
      const c = table[v] ?? 0;
      table[v] = (tintChannel((c >>> 16) & 255, (tint >>> 16) & 255) << 16) | (tintChannel((c >>> 8) & 255, (tint >>> 8) & 255) << 8)
        | tintChannel(c & 255, tint & 255);
    }
  }
  return { table, unknown };
}

/**
 * The original's hide mix of one channel, round(a x 0.62 + t x 0.38), in whole numbers: (62a + 38t) hundredths,
 * halves rounded up. 62 + 38 = 100, so it never passes 255. Dividing by 100 is a multiply and shift: 5243 / 2^19 is
 * 1/100 to within 1 part in 400000, exact for every sum up to 25550. Two channel pairs, (192, 17) and (228, 3), give
 * one step more than the original's floats, whose value there is a half less float noise.
 */
function tintChannel(a: number, t: number): number {
  return ((62 * a + 38 * t + 50) * 5243) >>> 19;
}
