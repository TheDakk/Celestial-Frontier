// The morph system M3/M4 (MORPH_SYSTEM_DESIGN.md): MARKINGS from the archetype's PAINTED marking masks (Codex,
// audits/MORPH_CRAB_MARKINGS_20260922 — master-space alpha masks, one per v1 pattern name that the kit hand paints), blended
// with the individual's accent colour; `iridescent` and `lumin` add an emissive lift on the marking (M4). A pattern
// with no painted mask renders plain (the law: a feature nobody painted does not appear). Masks never touch alpha.
import type { CreaturePartsBindingV1 } from '../creature-rig.js';
import type { MorphParamsV1, PaletteParamsV1 } from './morph-params.js';
import { GREY_SATURATION, hslToRgb, rgbToHsl } from './morph-palette.js';
/** v1 `FA_PATTERN` order (main.js). */
export const PATTERN_NAMES = Object.freeze(['plain', 'striped', 'spotted', 'banded', 'mottled', 'iridescent', 'marbled', 'eye-spotted'] as const);
export type PatternName = (typeof PATTERN_NAMES)[number];
export const MASKED_PATTERNS: ReadonlySet<string> = new Set(['striped', 'spotted', 'banded', 'mottled', 'marbled', 'eye-spotted']);
export const MARKING_STRENGTH = 0.85, EMISSIVE_LIFT = 0.28;
/** The painted marking this individual wears, or null (plain, iridescent, no pattern gene). */
export function markingNameV1(params: MorphParamsV1): PatternName | null { if (params.pattern === null) return null; const n = PATTERN_NAMES[params.pattern % PATTERN_NAMES.length]!; return MASKED_PATTERNS.has(n) ? n : null; }
/** M4: iridescent pattern or the lumin gene → an emissive lift on the marking (and, without a marking, on the accent set — not in this slice). */
export function emissiveV1(params: MorphParamsV1): boolean { return params.lumin || (params.pattern !== null && PATTERN_NAMES[params.pattern % PATTERN_NAMES.length] === 'iridescent'); }
export interface AlphaMask { readonly alpha: Uint8Array; readonly width: number; readonly height: number; }
/** A master-space mask (RGBA PNG, alpha = the marking) → an atlas-space alpha mask through the binding's parts: each
 * part was cut from the master at its `cutout` box and pinned unrotated at its atlas `frame` (same size), so the map
 * is a translation per part. Joint patches and bridges carry no marking. */
export function masterMaskToAtlasV1(mask: AlphaMask, binding: Pick<CreaturePartsBindingV1, 'parts' | 'atlasSize'>, masterWidth: number, masterHeight: number, atlasRgba: Uint8Array): AlphaMask {
  if (mask.width !== masterWidth || mask.height !== masterHeight) throw new TypeError('marking: mask is not in master space');
  const W = binding.atlasSize.width, H = binding.atlasSize.height, out = new Uint8Array(W * H); if (atlasRgba.length !== W * H * 4) throw new TypeError('marking: atlas size');
  // cut-out boxes OVERLAP (a carapace marking falls inside a claw's box): a mask pixel maps into a part's frame only
  // where that part has pixels of its own — measured 2026-09-23: without the gate 20,220 marked texels landed on clear atlas
  for (const p of binding.parts) { if (p.kind !== 'part') continue; if (p.frame.width !== p.cutout.width || p.frame.height !== p.cutout.height) throw new TypeError('marking: part frame/cutout size disagree: ' + p.id);
    for (let y = 0; y < p.frame.height; y++) for (let x = 0; x < p.frame.width; x++) { const mx = p.cutout.x + x, my = p.cutout.y + y; if (mx < 0 || my < 0 || mx >= masterWidth || my >= masterHeight) continue; const a = mask.alpha[my * masterWidth + mx]!; if (!a) continue; const ax = p.frame.x + x, ay = p.frame.y + y; if (ax < 0 || ay < 0 || ax >= W || ay >= H) continue; const i = ay * W + ax; if (!atlasRgba[i * 4 + 3]) continue; if (a > out[i]!) out[i] = a; } }
  return Object.freeze({ alpha: out, width: W, height: H });
}
/** Alpha plane of a decoded RGBA mask PNG. */
export function maskAlphaOf(rgba: Uint8Array, width: number, height: number): AlphaMask { const alpha = new Uint8Array(width * height); for (let i = 0; i < width * height; i++) alpha[i] = rgba[i * 4 + 3]!; return Object.freeze({ alpha, width, height }); }
/** Box-downscale an alpha mask (the card master's scale). */
export function scaleMaskV1(mask: AlphaMask, width: number, height: number): AlphaMask {
  const out = new Uint8Array(width * height), sx = mask.width / width, sy = mask.height / height;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) { const x0 = Math.floor(x * sx), x1 = Math.max(x0 + 1, Math.floor((x + 1) * sx)), y0 = Math.floor(y * sy), y1 = Math.max(y0 + 1, Math.floor((y + 1) * sy)); let a = 0, n = 0; for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) { a += mask.alpha[yy * mask.width + xx]!; n++; } out[y * width + x] = Math.round(a / n); }
  return Object.freeze({ alpha: out, width, height });
}
/** Blend the marking onto an RGBA image IN PLACE: masked pixels take the accent hue (luminance kept) — or, with an
 * identity accent, a tonal contrast of the pixel — by mask × strength; emissive lifts luminance and chroma on the mask. */
export function applyMarkingV1(rgba: Uint8Array, width: number, height: number, mask: AlphaMask, accent: PaletteParamsV1, emissive: boolean, strength = MARKING_STRENGTH): number {
  if (mask.width !== width || mask.height !== height) throw new TypeError('marking: mask size'); let changed = 0;
  for (let i = 0; i < width * height; i++) { const m = mask.alpha[i]!; if (!m) continue; const j = i * 4, a = rgba[j + 3]!; if (!a) continue;
    const hsl = rgbToHsl(rgba[j]!, rgba[j + 1]!, rgba[j + 2]!); let h = hsl[0]!, s = hsl[1]!, l = hsl[2]!;
    if (accent.hue !== null) { h = accent.hue; s = Math.min(1, Math.max(s, 0.35) * accent.chroma); } else { l = l > 0.5 ? l - 0.3 : l + 0.3; s = Math.min(1, s * accent.chroma); }
    if (emissive) { l = Math.min(1, l + EMISSIVE_LIFT); s = Math.min(1, Math.max(s, GREY_SATURATION) * 1.2); }
    const t = hslToRgb(h, s, l), k = (m / 255) * strength; const r = Math.round(rgba[j]! + (t[0]! - rgba[j]!) * k), g = Math.round(rgba[j + 1]! + (t[1]! - rgba[j + 1]!) * k), b = Math.round(rgba[j + 2]! + (t[2]! - rgba[j + 2]!) * k);
    if (r !== rgba[j] || g !== rgba[j + 1] || b !== rgba[j + 2]) changed++; rgba[j] = r; rgba[j + 1] = g; rgba[j + 2] = b; }
  return changed;
}

/** M4 without a marking: an iridescent or lumin individual with no painted mask glows on its ACCENT set (head, claws,
 * tail, ears…): a half-strength emissive lift over the accent frames / labels — in place. */
export const EMISSIVE_ACCENT_LIFT = EMISSIVE_LIFT * 0.5;
export function applyEmissiveAccentV1(rgba: Uint8Array, width: number, height: number, isAccent: (index: number) => boolean): number {
  let changed = 0;
  for (let i = 0; i < width * height; i++) { if (!isAccent(i)) continue; const j = i * 4; if (!rgba[j + 3]) continue; const hsl = rgbToHsl(rgba[j]!, rgba[j + 1]!, rgba[j + 2]!); const h = hsl[0]!, s = Math.min(1, Math.max(hsl[1]!, GREY_SATURATION) * 1.2), l = Math.min(1, hsl[2]! + EMISSIVE_ACCENT_LIFT);
    const t = hslToRgb(h, s, l); if (t[0] !== rgba[j] || t[1] !== rgba[j + 1] || t[2] !== rgba[j + 2]) changed++; rgba[j] = t[0]!; rgba[j + 1] = t[1]!; rgba[j + 2] = t[2]!; }
  return changed;
}
