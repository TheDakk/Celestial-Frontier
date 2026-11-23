import type { PartFrame, SkinName } from '@cf/art-format';
import { handValue } from './marks';
import { SKIN_TABLE, type SkinRule } from './skins';

const LAST_DRAWN = 12;

/** A frame pixel the skin may change: drawn with a value 1 to 12 (never empty, eye, highlight, glow, outline, iris, bone or deep). */
const skinnable = (v: number): boolean => v >= 1 && v <= LAST_DRAWN;
/** The colour ramp a value 1 to 12 belongs to: 0 for 1-4, 1 for 5-8, 2 for 9-12. */
const rampOf = (v: number): number => (v - 1) >> 2;

/**
 * Paints the creature's skin texture into a copy of `pixels`, one part frame's pixels with its marks already painted
 * (the original draws the skin over the patterned hide). A hand-drawn layer named for the skin wins, exactly as a
 * hand-drawn marks layer does: each value 1 to 12 or 21 to 28 (bone, deep) it holds replaces the pixel, in any ramp. Otherwise the skin's rule
 * (skins.ts) steps texture pixels one shade inside their own ramp, so the rule never moves a mark out of its ramp.
 * Only a pixel drawn 1 to 12 is ever written, so bone and deep (21 to 28) never take a skin; the rule writes only a value 1 to 12.
 * Returns a new array, or `null` when the rule is `none` and the frame has no layer named for the skin.
 * Never changes its inputs. Pixels of any length but the frame's w x h throw a RangeError: a wrong array is refused,
 * never painted truncated or misaligned.
 */
export function paintSkin(frame: PartFrame, pixels: Uint8Array, skin: SkinName): Uint8Array | null {
  if (pixels.length !== frame.w * frame.h) throw new RangeError(`paintSkin: ${pixels.length} pixels for a ${frame.w}x${frame.h} frame`);
  const hand = frame.layers?.[skin];
  const rule = SKIN_TABLE[skin];
  if (hand === undefined && rule.mode === 'none') return null;
  const out = Uint8Array.from(pixels);

  if (hand !== undefined) {
    for (let i = 0; i < out.length; i++) {
      const host = pixels[i] ?? 0;
      const v = hand[i] ?? 0;
      // As a hand-drawn marks layer: any hide, bone or deep value replaces a drawn pixel. A frame built in code could hold
      // any value in its hand layer, so a reserved value is never written.
      if (skinnable(host) && handValue(v)) out[i] = v;
    }
    return out;
  }

  // ty: the row inside the cell; odd: the cell row's parity, counted as the rows go (no division).
  let ty = 0;
  let odd = false;
  for (let y = 0; y < frame.h; y++) {
    const shift = odd ? rule.stagger % rule.across : 0;
    for (let x = 0; x < frame.w; x++) {
      const i = y * frame.w + x;
      const host = pixels[i] ?? 0;
      if (!skinnable(host)) continue;
      const tx = (x + rule.across - shift) % rule.across;
      if (!onTexture(rule, tx, ty, y === 0 ? 0 : pixels[i - frame.w] ?? 0)) continue;
      const stepped = host + rule.step;
      if (skinnable(stepped) && rampOf(stepped) === rampOf(host)) out[i] = stepped;
    }
    ty++;
    if (ty === rule.down) {
      ty = 0;
      odd = !odd;
    }
  }
  return out;
}

/** Whether the pixel at column `tx` and row `ty` of its cell, below the pixel `above` (0 outside the frame), is a texture pixel. */
function onTexture(rule: SkinRule, tx: number, ty: number, above: number): boolean {
  switch (rule.mode) {
    case 'grid': return tx === 0 || ty === 0;
    case 'rows': return ty === 0;
    case 'dots': return tx === 0 && ty === 0;
    case 'edge': return above === 0;
    case 'none': return false;
  }
}
