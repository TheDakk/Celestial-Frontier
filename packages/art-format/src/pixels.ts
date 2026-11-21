import type { Palette } from './types';

/** The text character for each pixel value 0-16: index = value. Used by the part text format and the text pixel form. */
export const PIXEL_CHARS = '.123456789abcdefg';

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

/**
 * Colour numbers (0xRRGGBB) for pixel values 0-16: index 0 is transparent and holds 0; 1-4, 5-8 and 9-12 are the
 * named primary, accent and underside ramps; 13-16 are the palette's eye, eye highlight, glow and outline colours.
 * A ramp name the palette does not hold gives four zeros and is listed in `unknown`; never throws.
 */
export function colourTable(palette: Palette, ramps: { primary: string; accent: string; underside: string }): { table: number[]; unknown: string[] } {
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
    rgb(palette.eye), rgb(palette.eyeHighlight), rgb(palette.glow), rgb(palette.outline)];
  return { table, unknown };
}
