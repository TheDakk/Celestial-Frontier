import type { Palette } from './types';

/** The text character for each pixel value 0-28: index = value. Used by the part text format and the text pixel form. */
export const PIXEL_CHARS = '.123456789abcdefghijklmnopqrs';

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
/**
 * 21-24: the bone ramp, dark to light: hard pale material (shell, horn, ivory), drawn by a part wherever it may draw 1-12.
 * A named improvement on the original, which paints only ivory apart from the hide. Lit and shaded like a hide ramp;
 * never marked, skinned or given the rarity finish.
 */
export const PIXEL_BONE = 21;
/** The palette ramp bone is drawn in when the caller names no other. */
export const BONE_RAMP = 'bone';
/**
 * 25-28: the deep ramp, dark to light: the hide's own colour, much darker (the mask round the eyes, a socket, a nostril,
 * the mouth line, a deep crease), drawn by a part wherever it may draw bone. A named improvement on the original, whose
 * darkest hide value the theme mix lifts. No palette ramp: colourTable computes it from the primary ramp as shown.
 * Lit and shaded like a hide ramp; never marked, skinned or given the rarity finish.
 */
export const PIXEL_DEEP = 25;
/**
 * The own-ramp values, 21-28: bone, then deep. Each is a ramp of four a part draws, lit and shaded inside itself and
 * rimmed as hide is, that no mark, skin or rarity finish ever paints.
 */
export const OWN_RAMP_FIRST = PIXEL_BONE;
export const OWN_RAMP_LAST = PIXEL_DEEP + 3;
/** Whether the value is an own-ramp value (OWN_RAMP_FIRST to OWN_RAMP_LAST): bone or deep. */
export const isOwnRamp = (v: number): boolean => v >= OWN_RAMP_FIRST && v <= OWN_RAMP_LAST;
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
 * Colour numbers (0xRRGGBB) for pixel values 0-28: index 0 is transparent and holds 0; 1-4, 5-8 and 9-12 are the
 * named primary, accent and underside ramps; 13-16 are the palette's eye, eye highlight, glow and outline colours; 17-20 are the named iris ramp;
 * 21-24 are the bone ramp; 25-28 are the deep ramp.
 * A ramp name the palette does not hold gives four zeros and is listed in `unknown`; never throws. So does a `bone` name.
 * With no `bone` name, bone is the palette's ramp `bone` (BONE_RAMP), and a palette without one gives four zeros and
 * lists nothing: no ramp was named.
 * With an `eyeHighlight` (a palette colour index, a named species' own), entry 14 is that colour in place of the
 * palette's; an index the palette does not hold gives 0, as any colour index does. Without one, the palette's.
 * With a `tint` (a theme colour, 0xRRGGBB), entries 1-12 take each channel as tintChannel(a, t), the original's hide mix
 * (62 parts colour, 38 parts theme), and entries 21-24 as boneTintChannel(a, t), a weak mix (85 parts bone, 15 parts
 * theme) that keeps bone pale under every theme; 0, 13-20 and the four zeros of a ramp the palette lacks are unchanged.
 * Without one, the table is untouched. A tint that is not a whole number 0 to 0xffffff throws a RangeError naming it.
 * Deep is no palette ramp: entry 25 + i is entry 1 + i, the primary ramp as shown (after the tint, when there is one),
 * with each channel as deepChannel(c), 55 hundredths of it. So deep is always the hide's own colour, darker, under
 * every theme; a primary ramp the palette lacks (four zeros) gives four zeros, and nothing more is listed.
 */
export function colourTable(
  palette: Palette,
  ramps: { primary: string; accent: string; underside: string; iris: string; bone?: string; eyeHighlight?: number | undefined },
  tint?: number,
): { table: number[]; unknown: string[] } {
  if (tint !== undefined && !(Number.isInteger(tint) && tint >= 0 && tint <= 0xffffff)) throw new RangeError(`bad tint ${String(tint)}`);
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
  const hide = [0, ...ramp(ramps.primary), ...ramp(ramps.accent), ...ramp(ramps.underside),
    rgb(palette.eye), rgb(ramps.eyeHighlight ?? palette.eyeHighlight), rgb(palette.glow), rgb(palette.outline), ...ramp(ramps.iris)];
  const boneName = ramps.bone ?? BONE_RAMP;
  const boneHeld = Object.hasOwn(palette.ramps, boneName);
  const table = [...hide, ...(boneHeld || ramps.bone !== undefined ? ramp(boneName) : [0, 0, 0, 0])];
  if (tint !== undefined) {
    const mixed = (v: number, channel: (a: number, t: number) => number): void => {
      const c = table[v] ?? 0;
      table[v] = (channel((c >>> 16) & 255, (tint >>> 16) & 255) << 16) | (channel((c >>> 8) & 255, (tint >>> 8) & 255) << 8)
        | channel(c & 255, tint & 255);
    };
    // An unknown ramp stays as it is (black): only the entries of the ramps the palette holds are tinted.
    const held = [ramps.primary, ramps.accent, ramps.underside].map((name) => Object.hasOwn(palette.ramps, name));
    for (let v = 1; v <= 12; v++) if (held[(v - 1) >> 2] === true) mixed(v, tintChannel);
    if (boneHeld) for (let v = PIXEL_BONE; v < PIXEL_BONE + 4; v++) mixed(v, boneTintChannel);
  }
  for (let i = 0; i < 4; i++) {
    const c = table[PIXEL_PRIMARY + i] ?? 0;
    table.push((deepChannel((c >>> 16) & 255) << 16) | (deepChannel((c >>> 8) & 255) << 8) | deepChannel(c & 255));
  }
  return { table, unknown };
}

/**
 * round(n / 100), halves up, in whole numbers, for the sums below (0 to 25500): 5243 / 2^19 is 1/100 to within about
 * 1 part in 43700, exact for every n + 50 up to 25550.
 */
const hundredths = (n: number): number => ((n + 50) * 5243) >>> 19;

/**
 * The original's hide mix of one channel, round(a x 0.62 + t x 0.38), in whole numbers: (62a + 38t) hundredths,
 * halves rounded up. 62 + 38 = 100, so it never passes 255. Dividing by 100 is a multiply and shift (hundredths). Two
 * channel pairs, (192, 17) and (228, 3), give one step more than the original's floats, whose value there is a half
 * less float noise.
 */
function tintChannel(a: number, t: number): number {
  return hundredths(62 * a + 38 * t);
}

/**
 * The bone mix of one channel, round(a x 0.85 + t x 0.15), in whole numbers: (85a + 15t) hundredths, halves rounded
 * up. 85 + 15 = 100, so it never passes 255. The same multiply and shift as the hide mix (hundredths), so the same
 * result on every device.
 */
function boneTintChannel(a: number, t: number): number {
  return hundredths(85 * a + 15 * t);
}

/**
 * The deep scaling of one channel, round(c x 0.55), in whole numbers: 55c hundredths, halves rounded up. The same
 * multiply and shift as the mixes (hundredths), so the same result on every device.
 */
function deepChannel(c: number): number {
  return hundredths(55 * c);
}
