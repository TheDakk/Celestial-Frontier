import { DRAW_ORDER, MARK_SLOTS, partId } from '@cf/art-format';
import type { Catalogue, SlotName } from '@cf/art-format';
import type { Anatomy } from './resolve';
import type { PartMark, RecipePart } from './recipe';
import { pick } from './streams';

/**
 * The back part each skin asks for, by skin gene (the game's FA_SKIN order: scaled, furred, chitinous, slick and
 * wet, plated, warty, feathered, translucent, crystalline); null asks for none. Part of renderer version 1.
 */
export const BACK_KIND_BY_SKIN: readonly (string | null)[] = Object.freeze(
  ['ridge', 'mane', 'carapace', null, 'plates', 'knobs', 'plume', null, 'crystals'],
);

/** The head feature a torso type asks for; other torso types ask for none. Part of renderer version 1. */
export const HEAD_FEATURE_BY_TORSO: Readonly<Record<string, string>> = Object.freeze({ tusked: 'tusks', horned: 'horns' });

/** The limb kind at a limb index: index 0 is the front pair, 1 the hind pair, 2 and 3 the middle pairs; a pair is hind. */
export function limbKind(index: number, legs: number): 'fore' | 'hind' | 'mid' {
  if (legs === 2) return 'hind';
  if (index === 0) return 'fore';
  if (index === 1) return 'hind';
  return 'mid';
}

interface Wanted { slot: SlotName; index: number; kind: string; variant: number; limb: boolean }

/** The first of `ids` the catalogue holds, with its index, or -1. */
function firstHeld(catalogue: Catalogue, ids: readonly string[]): number {
  return ids.findIndex((id) => catalogue.parts.has(id));
}

/**
 * The parts a fauna creature asks for, in DRAW_ORDER then index, and the gaps met on the way. Leg roles, the skin's
 * back part, the torso type's head feature, and a mark for every part in a mark slot when the creature is patterned.
 * Every other kingdom asks for no parts.
 */
export function planParts(
  a: Anatomy,
  variants: { torso: number; head: number; tail: number; limb: number },
  stream: (name: string) => () => number,
  catalogue: Catalogue,
): { parts: RecipePart[]; gaps: string[] } {
  const parts: RecipePart[] = [];
  const gaps: string[] = [];
  if (a.kingdom !== 'fauna') return { parts, gaps };

  const torsoKind = a.torso === '' ? 'body' : a.torso;
  const wanted: Wanted[] = [];
  const far = a.limbs >> 1;
  const near = a.limbs - far;
  for (let i = 0; i < far; i++) wanted.push({ slot: 'farLimbs', index: i, kind: limbKind(i, a.limbs), variant: variants.limb, limb: true });
  if (a.tail !== 0) wanted.push({ slot: 'tail', index: 0, kind: `t${a.tail}`, variant: variants.tail, limb: false });
  wanted.push({ slot: 'torso', index: 0, kind: torsoKind, variant: variants.torso, limb: false });
  const back = BACK_KIND_BY_SKIN[a.skin] ?? null;
  if (back !== null) wanted.push({ slot: 'back', index: 0, kind: `${back}-${torsoKind}`, variant: 0, limb: false });
  for (let i = 0; i < near; i++) wanted.push({ slot: 'nearLimbs', index: i, kind: limbKind(i, a.limbs), variant: variants.limb, limb: true });
  wanted.push({ slot: 'head', index: 0, kind: `h${a.head}`, variant: variants.head, limb: false });
  if (Object.hasOwn(HEAD_FEATURE_BY_TORSO, a.torso)) {
    wanted.push({ slot: 'headFeature', index: 0, kind: `${HEAD_FEATURE_BY_TORSO[a.torso]}-h${a.head}`, variant: 0, limb: false });
  }
  for (let i = 0; i < a.eyes; i++) wanted.push({ slot: 'eyes', index: i, kind: 'eye', variant: 0, limb: false });
  wanted.sort((x, y) => DRAW_ORDER.indexOf(x.slot) - DRAW_ORDER.indexOf(y.slot) || x.index - y.index);

  for (const w of wanted) {
    const id = (kind: string, variant: number): string => partId(a.family, w.slot, kind, a.tier, variant);
    let found: string | undefined;
    if (w.limb) {
      // The role at the chosen variant, the role at v0, the shared leg at the chosen variant, the shared leg at v0.
      const tries = [id(w.kind, w.variant), id(w.kind, 0), id('leg', w.variant), id('leg', 0)];
      const steps = [[], [`variant:${tries[0]}`], [`role:${tries[1]}`], [`role:${tries[1]}`, `variant:${tries[2]}`]];
      const hit = firstHeld(catalogue, tries);
      if (hit < 0) gaps.push(`missing:${tries[3]}`);
      else { found = tries[hit]; gaps.push(...steps[hit]!); }
    } else {
      const tries = [id(w.kind, w.variant), id(w.kind, 0)];
      const hit = firstHeld(catalogue, tries);
      if (hit < 0) gaps.push(`missing:${tries[1]}`);
      else { found = tries[hit]; if (hit === 1) gaps.push(`variant:${tries[0]}`); }
    }
    if (found === undefined) continue;
    const part: RecipePart = { slot: w.slot, index: w.index, partId: found, source: 'own' };
    if (a.pattern !== 0 && MARK_SLOTS.includes(w.slot)) part.mark = markFor(w.slot, w.index, stream);
    parts.push(part);
  }
  return { parts, gaps };
}

/** A part's mark data, from two streams keyed by its slot and index, so parts that share a drawing still differ. */
function markFor(slot: SlotName, index: number, stream: (name: string) => () => number): PartMark {
  const offset = pick(stream(`mark-offset-${slot}-${index}`), 15);
  const spots = stream(`mark-spots-${slot}-${index}`);
  const rolls: number[] = [];
  for (let i = 0; i < 15; i++) rolls.push(pick(spots, 100));
  return { offset, rolls };
}
