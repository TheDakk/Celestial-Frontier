import { DRAW_ORDER, VARIANTS, partId } from '@cf/art-format';
import type { Catalogue, SizeTier, SlotName } from '@cf/art-format';
import { resolveAnatomy } from './resolve';
import { artStream, identityKey, pick } from './streams';

export const RENDERER_VERSION = 1;

export interface RecipePart { slot: SlotName; index: number; partId: string; source: 'own'; }
export interface Recipe {
  version: number; identity: string; family: string; tier: SizeTier; scaffoldId: string;
  parts: readonly RecipePart[]; // in DRAW_ORDER, then by index
  ramps: { primary: string; accent: string; underside: string };
  marking: { pattern: number; flip: boolean; dx: number; dy: number };
  shift: { head: readonly [number, number]; tail: readonly [number, number] }; // each component -1, 0 or 1
  glow: boolean; gaps: readonly string[];
}

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

/** The plain description of one creature. Pure: the same inputs always give a deeply equal, frozen recipe. */
export function buildRecipe(
  genome: Readonly<Record<string, unknown>>,
  lineage: readonly string[],
  catalogue: Catalogue,
  options?: { guardian?: boolean },
): Recipe {
  const a = resolveAnatomy(genome, options);
  const identity = identityKey(genome, lineage);
  const stream = (name: string): (() => number) => artStream(identity, name, RENDERER_VERSION);

  // Every stream is drawn exactly once, in this fixed order, whether or not the result is used.
  // That keeps each choice independent of every other gene.
  const torsoVariant = pick(stream('torso-build'), VARIANTS.torso);
  const headVariant = pick(stream('head-variant'), VARIANTS.head);
  const tailVariant = pick(stream('tail-variant'), VARIANTS.tail);
  const limbVariant = pick(stream('limb-style'), VARIANTS.limb);
  const flip = pick(stream('mark-flip'), 2) === 1;
  const dx = pick(stream('mark-dx'), 3) - 1;
  const dy = pick(stream('mark-dy'), 3) - 1;
  const headShift: [number, number] = [pick(stream('shift-head-x'), 3) - 1, pick(stream('shift-head-y'), 3) - 1];
  const tailShift: [number, number] = [pick(stream('shift-tail-x'), 3) - 1, pick(stream('shift-tail-y'), 3) - 1];
  // ramp-warmth is drawn only to reserve the stream; it is not stored in the recipe in this milestone.
  pick(stream('ramp-warmth'), 3);

  const torsoKind = a.torso === '' ? 'body' : a.torso;
  const wanted: { slot: SlotName; index: number; kind: string; variant: number }[] = [];
  const far = a.limbs >> 1;
  const near = a.limbs - far;
  for (let i = 0; i < far; i++) wanted.push({ slot: 'farLimbs', index: i, kind: 'leg', variant: limbVariant });
  if (a.tail !== 0) wanted.push({ slot: 'tail', index: 0, kind: `t${a.tail}`, variant: tailVariant });
  wanted.push({ slot: 'torso', index: 0, kind: torsoKind, variant: torsoVariant });
  for (let i = 0; i < near; i++) wanted.push({ slot: 'nearLimbs', index: i, kind: 'leg', variant: limbVariant });
  wanted.push({ slot: 'head', index: 0, kind: `h${a.head}`, variant: headVariant });
  for (let i = 0; i < a.eyes; i++) wanted.push({ slot: 'eyes', index: i, kind: 'eye', variant: 0 });
  wanted.sort((x, y) => DRAW_ORDER.indexOf(x.slot) - DRAW_ORDER.indexOf(y.slot) || x.index - y.index);

  const parts: RecipePart[] = [];
  const gaps: string[] = [];
  for (const w of wanted) {
    const picked = partId(a.family, w.slot, w.kind, a.tier, w.variant);
    if (catalogue.parts.has(picked)) {
      parts.push({ slot: w.slot, index: w.index, partId: picked, source: 'own' });
      continue;
    }
    const base = partId(a.family, w.slot, w.kind, a.tier, 0);
    if (catalogue.parts.has(base)) {
      parts.push({ slot: w.slot, index: w.index, partId: base, source: 'own' });
      gaps.push(`variant:${picked}`);
    } else {
      gaps.push(`missing:${base}`);
    }
  }

  return deepFreeze({
    version: RENDERER_VERSION, identity, family: a.family, tier: a.tier,
    scaffoldId: `${a.family}/${torsoKind}/${a.tier}`,
    parts,
    ramps: { primary: `c${a.colour}`, accent: `c${a.accent}`, underside: `c${a.colour}-under` },
    marking: { pattern: a.pattern, flip, dx, dy },
    shift: { head: headShift, tail: tailShift },
    glow: a.glow, gaps,
  });
}
