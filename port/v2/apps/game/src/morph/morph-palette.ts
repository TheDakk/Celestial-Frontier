// The morph system, step 2 (MORPH_SYSTEM_DESIGN.md M2): a pure RGBA remap of an atlas by part role with LUMINANCE
// PRESERVED — the painted finish (shading, edges, fur/chitin structure) survives; only hue and chroma move. Applied
// once per individual at load; never per tick. Alpha is never touched; pixels outside every frame are never touched.
import type { MorphParamsV1, PaletteParamsV1 } from './morph-params.js';
export type PaletteRole = 'base' | 'accent' | 'keep';
export interface PaletteFrame { readonly x: number; readonly y: number; readonly width: number; readonly height: number; readonly role: PaletteRole; }
/** Chroma floor below which a pixel is grey and keeps its hue (eyes, claws, whites, blacks): HSL saturation. */
export const GREY_SATURATION = 0.08;
// scratch HSL/RGB triples: the remap visits every pixel of a 2048² atlas several times — no per-pixel allocation
const HSL = new Float64Array(3), RGB = new Uint8ClampedArray(3);
const rgbToHsl = (r: number, g: number, b: number): Float64Array => {
  r /= 255; g /= 255; b /= 255; const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) { HSL[0] = 0; HSL[1] = 0; HSL[2] = l; return HSL; }
  const d = max - min, s = l > 0.5 ? d / (2 - max - min) : d / (max + min); let h: number;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0); else if (max === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
  HSL[0] = h * 60; HSL[1] = s; HSL[2] = l; return HSL;
};
const hue2rgb = (p: number, q: number, t: number): number => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; };
const hslToRgb = (h: number, s: number, l: number): Uint8ClampedArray => {
  if (s === 0) { const v = Math.round(l * 255); RGB[0] = v; RGB[1] = v; RGB[2] = v; return RGB; } const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q, hh = h / 360;
  RGB[0] = Math.round(hue2rgb(p, q, hh + 1 / 3) * 255); RGB[1] = Math.round(hue2rgb(p, q, hh) * 255); RGB[2] = Math.round(hue2rgb(p, q, hh - 1 / 3) * 255); return RGB;
};
/** The archetype's own dominant hue over a role (alpha- and saturation-weighted circular mean), so the remap ROTATES
 * the painting's hue relationships onto the target instead of flattening every pixel to one hue. */
export function dominantHue(rgba: Uint8Array, width: number, frames: readonly PaletteFrame[], role: PaletteRole): number | null {
  let sx = 0, sy = 0;
  for (const f of frames) { if (f.role !== role) continue; for (let y = f.y; y < f.y + f.height; y++) for (let x = f.x; x < f.x + f.width; x++) { const i = (y * width + x) * 4, a = rgba[i + 3]!; if (!a) continue; const hsl = rgbToHsl(rgba[i]!, rgba[i + 1]!, rgba[i + 2]!), h = hsl[0]!, s = hsl[1]!; if (s < GREY_SATURATION) continue; const w = a * s; sx += w * Math.cos(h * Math.PI / 180); sy += w * Math.sin(h * Math.PI / 180); } }
  if (sx === 0 && sy === 0) return null; return ((Math.atan2(sy, sx) * 180 / Math.PI) % 360 + 360) % 360;
}
/** Remap one atlas. Returns a NEW buffer; identity params return a byte-identical copy. */
export function remapAtlasPaletteV1(rgba: Uint8Array, width: number, height: number, frames: readonly PaletteFrame[], params: MorphParamsV1): Uint8Array {
  if (rgba.length !== width * height * 4) throw new TypeError('morph palette: rgba size');
  for (const f of frames) if (f.x < 0 || f.y < 0 || f.x + f.width > width || f.y + f.height > height) throw new RangeError('morph palette: frame outside the atlas');
  const out = new Uint8Array(rgba);
  if (params.identity) return out;
  const apply = (role: 'base' | 'accent', p: PaletteParamsV1): void => {
    if (p.hue === null && p.chroma === 1) return;
    const from = p.hue === null ? null : dominantHue(rgba, width, frames, role); const delta = p.hue === null || from === null ? 0 : p.hue - from;
    for (const f of frames) { if (f.role !== role) continue; for (let y = f.y; y < f.y + f.height; y++) for (let x = f.x; x < f.x + f.width; x++) {
      const i = (y * width + x) * 4; if (!rgba[i + 3]) continue; const hsl = rgbToHsl(rgba[i]!, rgba[i + 1]!, rgba[i + 2]!), h = hsl[0]!, s = hsl[1]!, l = hsl[2]!; if (s < GREY_SATURATION) continue;
      const rgb = hslToRgb(((h + delta) % 360 + 360) % 360, Math.min(1, s * p.chroma), l); out[i] = rgb[0]!; out[i + 1] = rgb[1]!; out[i + 2] = rgb[2]!; } }
  };
  apply('base', params.base); apply('accent', params.accent);
  return out;
}
/** M-B conservation: what a remap is allowed to change. */
export function paletteConservationV1(before: Uint8Array, after: Uint8Array, width: number, height: number, frames: readonly PaletteFrame[]): Readonly<{ alphaChanged: number; outsideChanged: number; luminanceMaxDelta: number; changed: number }> {
  if (before.length !== after.length || before.length !== width * height * 4) throw new TypeError('conservation: sizes');
  const inside = new Uint8Array(width * height); for (const f of frames) for (let y = f.y; y < f.y + f.height; y++) for (let x = f.x; x < f.x + f.width; x++) inside[y * width + x] = 1;
  let alphaChanged = 0, outsideChanged = 0, lMax = 0, changed = 0;
  for (let i = 0; i < width * height; i++) { const j = i * 4; if (before[j + 3] !== after[j + 3]) alphaChanged++;
    const diff = before[j] !== after[j] || before[j + 1] !== after[j + 1] || before[j + 2] !== after[j + 2]; if (!diff) continue; changed++; if (!inside[i]) outsideChanged++;
    const lb = (Math.max(before[j]!, before[j + 1]!, before[j + 2]!) + Math.min(before[j]!, before[j + 1]!, before[j + 2]!)) / 2, la = (Math.max(after[j]!, after[j + 1]!, after[j + 2]!) + Math.min(after[j]!, after[j + 1]!, after[j + 2]!)) / 2; const d = Math.abs(lb - la); if (d > lMax) lMax = d; }
  return Object.freeze({ alphaChanged, outsideChanged, luminanceMaxDelta: lMax, changed });
}
/** Roles from a body card's part groups: body and legs are the base coat; head, arms (claws), tail, ears, antennae,
 * wings, fins, fronds are the accent set; a part with no joint group (the shadow) is kept. Default answer to
 * MORPH_SYSTEM_DESIGN §5.2 until an archetype declares its own. */
export function paletteRoleOfGroup(group: string | undefined): PaletteRole { if (!group) return 'keep'; return group === 'body' || group === 'legs' ? 'base' : 'accent'; }
