// The morph system on the CARD (Nick 2026-09-22, option 3: the painted individual is the creature everywhere, phone
// included). A Pixi-free rasteriser over the archetype's sealed CARD MASTER (≤512², `tools/morph/build-card-masters.mjs`):
// palette exact (the same remap the stage applies), proportion by label-region scaling about the sub-tree root's pivot
// (the transform the rig applies to a rigid part; the skin mesh is smoother, unnoticeable at card size). Output: a square
// RGBA raster of `size` px, alpha-weighted box downscale of the alpha-box crop. Deterministic per (archetype, genome).
import type { BodyCard } from '../motion/body-card.js';
import type { MorphParamsV1 } from './morph-params.js';
import { paletteRoleOfGroup, remapAtlasPaletteV1, type PaletteFrame, type PaletteRole } from './morph-palette.js';
import { jointScalesV1 } from './morph-skeleton.js';
import { applyMarkingV1, emissiveV1, type AlphaMask } from './morph-markings.js';
export interface CardMasterV1 { readonly width: number; readonly height: number; readonly master: Uint8Array; readonly labels: Uint8Array; }
export interface CardReceiptV1 { readonly labels: ReadonlyArray<Readonly<{ label: number; id: string; joint: string; layer: 'far' | 'near' }>>; readonly landmarks: Readonly<Record<string, readonly [number, number]>>; readonly card: Readonly<{ width: number; height: number }>; }
export const CARD_MARGIN = 0.06;
export interface CardRenderInput { readonly master: CardMasterV1; readonly receipt: CardReceiptV1; readonly card: Pick<BodyCard, 'parts'>; readonly params: MorphParamsV1; readonly size: number; /** the painted marking in CARD-master space (scaled from the master-space mask), when the archetype has one for this pattern */ readonly markingMask?: AlphaMask | null; }
/** Sub-tree membership from the body card's parent links: every joint under (and including) each scaled root. */
function subtreesOf(card: Pick<BodyCard, 'parts'>, scales: Readonly<Record<string, number>>): ReadonlyArray<Readonly<{ root: string; scale: number; joints: ReadonlySet<string> }>> {
  const children = new Map<string, string[]>(); for (const p of card.parts) { const list = children.get(p.parent) ?? []; list.push(p.joint); children.set(p.parent, list); }
  return Object.entries(scales).map(([root, scale]) => { const joints = new Set<string>(); const stack = [root]; while (stack.length) { const j = stack.pop()!; if (joints.has(j)) continue; joints.add(j); for (const c of children.get(j) ?? []) stack.push(c); } return Object.freeze({ root, scale, joints }); });
}
/** Steps 1–2 in master space (palette, then proportion): the individual at the card master's own size. */
export function cardCompositeV1(input: Omit<CardRenderInput, 'size'>): Uint8Array {
  const { master: m, receipt, card, params, markingMask } = input; const W = m.width, H = m.height;
  if (m.master.length !== W * H * 4 || m.labels.length !== W * H * 4) throw new TypeError('card: master/labels size');
  const groupOf = new Map(card.parts.map((p) => [p.joint, p.group] as const)), parentOf = new Map(card.parts.map((p) => [p.joint, p.parent] as const));
  const jointOfLabel = new Map(receipt.labels.map((l) => [l.label, l.joint] as const)), roleOfLabel = new Map<number, PaletteRole>(receipt.labels.map((l) => [l.label, paletteRoleOfGroup(groupOf.get(l.joint))] as const));
  // 1. palette: remap the whole master once per role, composite by each pixel's label role (label 0 = fringe/shadow: kept)
  let px = m.master;
  if (!params.identity) { const whole: PaletteFrame[] = [{ x: 0, y: 0, width: W, height: H, role: 'base' }]; const out = new Uint8Array(m.master);
    for (const role of ['base', 'accent'] as const) { const full = remapAtlasPaletteV1(m.master, W, H, [{ ...whole[0]!, role }], params); for (let i = 0; i < W * H; i++) if (roleOfLabel.get(m.labels[i * 4]!) === role) { out[i * 4] = full[i * 4]!; out[i * 4 + 1] = full[i * 4 + 1]!; out[i * 4 + 2] = full[i * 4 + 2]!; } }
    px = out; }
  // 1b. the painted marking (M3/M4), before proportion so it scales with a grown head/tail
  if (markingMask) { const out = px === m.master ? new Uint8Array(m.master) : px; applyMarkingV1(out, W, H, markingMask, params.accent, emissiveV1(params)); px = out; }
  // 2. proportion: scaled sub-trees drawn about their root's pivot (the parent landmark) over a base without them
  //    composited in the rig's layer order: far base → far sub-trees → near base → near sub-trees (a near leg stays in
  //    front of an enlarged far tail; label 0 = fringe/shadow counts as far base)
  const trees = subtreesOf(card, jointScalesV1(card, params));
  if (trees.length) { const inTree = (label: number) => { const j = jointOfLabel.get(label); return j !== undefined && trees.some((t) => t.joints.has(j)); };
    const layerOfLabel = new Map(receipt.labels.map((l) => [l.label, l.layer] as const));
    const out = new Uint8Array(W * H * 4);
    const blendBase = (layer: 'far' | 'near') => { for (let i = 0; i < W * H; i++) { const l = m.labels[i * 4]!; if (inTree(l) || (layerOfLabel.get(l) ?? 'far') !== layer) continue; const a = px[i * 4 + 3]!; if (!a) continue; const o = i * 4, k = a / 255; out[o] = Math.round(px[o]! * k + out[o]! * (1 - k)); out[o + 1] = Math.round(px[o + 1]! * k + out[o + 1]! * (1 - k)); out[o + 2] = Math.round(px[o + 2]! * k + out[o + 2]! * (1 - k)); out[o + 3] = Math.max(a, out[o + 3]!); } };
    const layerOfTree = (t: { joints: ReadonlySet<string> }): 'far' | 'near' => { let near = 0, far = 0; for (const l of receipt.labels) if (t.joints.has(l.joint)) { if (l.layer === 'near') near++; else far++; } return near > far ? 'near' : 'far'; };
    const drawTrees = (layer: 'far' | 'near') => { for (const t of trees) { if (layerOfTree(t) !== layer) continue; const pj = parentOf.get(t.root) ?? 'root', lm = receipt.landmarks[pj] ?? receipt.landmarks['root']!; const cx = lm[0] * W, cy = lm[1] * H;
      // bounding box of the tree's pixels, scaled about the pivot
      let x0 = W, y0 = H, x1 = -1, y1 = -1; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const l = m.labels[(y * W + x) * 4]!; if (l && jointOfLabel.has(l) && t.joints.has(jointOfLabel.get(l)!)) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
      if (x1 < 0) continue; const sx0 = Math.max(0, Math.floor(cx + (x0 - cx) * t.scale)), sx1 = Math.min(W - 1, Math.ceil(cx + (x1 - cx) * t.scale)), sy0 = Math.max(0, Math.floor(cy + (y0 - cy) * t.scale)), sy1 = Math.min(H - 1, Math.ceil(cy + (y1 - cy) * t.scale));
      for (let y = Math.min(sy0, y0); y <= Math.max(sy1, y1); y++) for (let x = Math.min(sx0, x0); x <= Math.max(sx1, x1); x++) { const qx = Math.round(cx + (x - cx) / t.scale), qy = Math.round(cy + (y - cy) / t.scale); if (qx < 0 || qy < 0 || qx >= W || qy >= H) continue; const qi = qy * W + qx, l = m.labels[qi * 4]!; const j = jointOfLabel.get(l); if (j === undefined || !t.joints.has(j)) continue;
        const a = px[qi * 4 + 3]!; if (!a) continue; const o = (y * W + x) * 4, oa = out[o + 3]!, k = a / 255; out[o] = Math.round(px[qi * 4]! * k + out[o]! * (1 - k)); out[o + 1] = Math.round(px[qi * 4 + 1]! * k + out[o + 1]! * (1 - k)); out[o + 2] = Math.round(px[qi * 4 + 2]! * k + out[o + 2]! * (1 - k)); out[o + 3] = Math.max(a, oa); } } };
    blendBase('far'); drawTrees('far'); blendBase('near'); drawTrees('near');
    px = out; }
  return px;
}
/** Alpha box of an RGBA image (pixels with alpha > 8). */
export function alphaBoxV1(rgba: Uint8Array, W: number, H: number): Readonly<{ x0: number; y0: number; x1: number; y1: number }> { let x0 = W, y0 = H, x1 = -1, y1 = -1; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (rgba[(y * W + x) * 4 + 3]! > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } return Object.freeze({ x0, y0, x1, y1 }); }
export function renderCardIndividualV1(input: CardRenderInput): Uint8Array {
  const { size } = input, W = input.master.width, H = input.master.height; if (!(size > 0 && Number.isInteger(size))) throw new TypeError('card: size');
  const px = cardCompositeV1(input);
  // 3. crop to the alpha box (square, centred) with a margin, alpha-weighted box downscale to size×size
  const { x0: bx0, y0: by0, x1: bx1, y1: by1 } = alphaBoxV1(px, W, H);
  if (bx1 < 0) throw new Error('card: empty master');
  const side = Math.max(bx1 - bx0 + 1, by1 - by0 + 1) * (1 + 2 * CARD_MARGIN), cxm = (bx0 + bx1 + 1) / 2, cym = (by0 + by1 + 1) / 2, X0 = cxm - side / 2, Y0 = cym - side / 2, sc = side / size;
  const out = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { const xa = X0 + x * sc, xb = X0 + (x + 1) * sc, ya = Y0 + y * sc, yb = Y0 + (y + 1) * sc; let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let yy = Math.max(0, Math.floor(ya)); yy < Math.min(H, Math.max(Math.floor(ya) + 1, Math.ceil(yb))); yy++) for (let xx = Math.max(0, Math.floor(xa)); xx < Math.min(W, Math.max(Math.floor(xa) + 1, Math.ceil(xb))); xx++) { const i = (yy * W + xx) * 4, al = px[i + 3]!; r += px[i]! * al; g += px[i + 1]! * al; b += px[i + 2]! * al; a += al; n++; }
    const o = (y * size + x) * 4; if (a > 0) { out[o] = Math.round(r / a); out[o + 1] = Math.round(g / a); out[o + 2] = Math.round(b / a); out[o + 3] = Math.round(a / n); } }
  return out;
}
