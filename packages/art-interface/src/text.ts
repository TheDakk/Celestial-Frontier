import type { PixelBuffer } from '@cf/art-compose';
import { BOX_GLYPH, STAND_IN_ICON } from './sheet';
import type { DisplayFont, Drawing, Glyph, InterfaceSheet } from './sheet';

/** What a caller asked for that the sheet lacks, one entry per use: glyph code points, icon names, element names. */
export interface Gaps { glyphs: number[]; icons: string[]; elements: string[] }

/** The glyph drawn for each character of the text, in order; `missing` holds the code point where it is the box. */
function glyphsOf(font: DisplayFont, text: string): Array<{ glyph: Glyph; missing: number | null }> {
  const box = font.glyphs.get(BOX_GLYPH);
  if (box === undefined) throw new Error('the font has no box glyph');
  const out: Array<{ glyph: Glyph; missing: number | null }> = [];
  for (const character of text) {
    const codePoint = character.codePointAt(0) ?? BOX_GLYPH;
    const glyph = font.glyphs.get(codePoint);
    out.push(glyph === undefined ? { glyph: box, missing: codePoint } : { glyph, missing: null });
  }
  return out;
}

const widthOf = (font: DisplayFont, glyphs: ReadonlyArray<{ glyph: Glyph }>): number =>
  glyphs.reduce((w, { glyph }) => w + glyph.w, 0) + font.gap * Math.max(0, glyphs.length - 1);

/** One line of text: the glyph widths plus the font's gap between neighbours, and the font's line height. */
export function measureText(font: DisplayFont, text: string): { w: number; h: number } {
  return { w: widthOf(font, glyphsOf(font, text)), h: font.line };
}

/**
 * One line of text as pixel values (0 transparent, 1 to 4 the glyphs' ramp), exactly as large as measureText says:
 * each glyph placed from the top of the line box, left to right, the font's gap apart.
 * A missing glyph draws the U+FFFD box and is counted.
 */
export function drawText(font: DisplayFont, text: string, gaps: Gaps): PixelBuffer {
  const glyphs = glyphsOf(font, text);
  const w = widthOf(font, glyphs);
  const pixels = new Uint8Array(w * font.line);
  let x = 0;
  for (const { glyph, missing } of glyphs) {
    if (missing !== null) gaps.glyphs.push(missing);
    for (let gy = 0; gy < glyph.h; gy++) {
      for (let gx = 0; gx < glyph.w; gx++) pixels[gy * w + x + gx] = glyph.pixels[gy * glyph.w + gx] ?? 0;
    }
    x += glyph.w + font.gap;
  }
  return { w, h: font.line, pixels };
}

/** A missing icon draws the icon named 'missing' and is counted. */
export function iconOrStandIn(sheet: InterfaceSheet, name: string, gaps: Gaps): Drawing {
  const found = sheet.icons.get(name);
  if (found !== undefined) return found;
  gaps.icons.push(name);
  const standIn = sheet.icons.get(STAND_IN_ICON);
  if (standIn === undefined) throw new Error('the sheet has no stand-in icon');
  return standIn;
}
