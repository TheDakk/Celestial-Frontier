import { DRAW_ORDER, MARK_SLOTS, partId } from '@cf/art-format';
import type { Catalogue, SizeTier, SlotName, Species } from '@cf/art-format';
import type { Body } from './route';
import type { PartMark, RecipePart } from './recipe';
import { pick } from './streams';

/**
 * The back part each skin asks for, by skin gene (the game's FA_SKIN order: scaled, furred, chitinous, slick and
 * wet, plated, warty, feathered, translucent, crystalline); null asks for none. Part of renderer version 1.
 */
export const BACK_KIND_BY_SKIN: readonly (string | null)[] = Object.freeze(
  ['ridge', 'mane', 'carapace', null, 'plates', 'knobs', 'plume', null, 'crystals'],
);

/** The limb kind at a limb index: index 0 is the front pair, 1 the hind pair, 2 and 3 the middle pairs; both legs of a two-legged creature are hind. */
export function limbKind(index: number, legs: number): 'fore' | 'hind' | 'mid' {
  if (legs === 2) return 'hind';
  if (index === 0) return 'fore';
  if (index === 1) return 'hind';
  return 'mid';
}

/** The torso type a scaffold and its parts are named for: the body's torso (its torso type or shape), or `body` when it has none. */
export function torsoKindOf(a: { torso: string }): string {
  return a.torso === '' ? 'body' : a.torso;
}

/** The wing kinds of a winged torso type, by wing index: a pair at index 0, a hindwing pair at index 1. Part of renderer version 1. */
export const WING_KINDS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  membranous: Object.freeze(['wing']),
  fourwinged: Object.freeze(['wing', 'hindwing']),
});

/**
 * The body feature a body carries: `shell-<torso>` on the shelled build, `crystals-<torso>` on the crystalline build,
 * `shell-<shape>` or `crystals-<shape>` on a fish keeping it, `fins-<torso>` on a winged body that is aquatic; else null.
 */
export function bodyFeatureKind(b: Body): string | null {
  if (b.family === 'quadruped') {
    if (b.torso === 'shelled') return 'shell-shelled';
    if (b.torso === 'crystalline') return 'crystals-crystalline';
    if (b.aquatic && Object.hasOwn(WING_KINDS, b.torso)) return `fins-${b.torso}`;
  }
  if (b.family === 'fish') {
    if (b.keeps === 'shell') return `shell-${b.torso}`;
    if (b.keeps === 'crystals') return `crystals-${b.torso}`;
  }
  return null;
}

/**
 * The head features a body carries, as kinds in head-feature index order (hdart.verbatim.js:207-208, 1774-1777,
 * 1825-1832, 2146-2158). A tusked quadruped: `tusks-h<n>`, then `horns-h<n>` when its head kind or trait carries a
 * horn, else `hornlet-h<n>` (the original's one horn per creature, at the size it falls back to, 0.5, when no head horn
 * gives one). A horned quadruped, or any other quadruped with `horn`: `horns-h<n>`. A fish keeping its tusks or its horn: `tusks-h<n>` or `horns-h<n>`. Else none.
 */
export function headFeatureKinds(b: Body): string[] {
  if (b.head === null) return [];
  const h = `h${b.head}`;
  if (b.family === 'quadruped') {
    if (b.torso === 'tusked') return [`tusks-${h}`, b.horn ? `horns-${h}` : `hornlet-${h}`];
    if (b.torso === 'horned' || b.horn) return [`horns-${h}`];
  }
  if (b.family === 'fish') {
    if (b.keeps === 'tusks') return [`tusks-${h}`];
    if (b.keeps === 'horn') return [`horns-${h}`];
  }
  return [];
}

/**
 * Whether a gap says the pack lacks a part no creature is drawn without: a creature is drawn as its family's fallback, never in part, when a torso, a head or a leg it asks for is missing
 * (a `missing:` gap of a part in slot torso or head, or in farLimbs or nearLimbs and not a flipper); every other missing part is left out and the rest is drawn.
 * A body that asks for no head (a radial, a species with `head=0`) has no such gap: no head is missing.
 */
export function lacksEssentialPart(gap: string): boolean {
  const m = /^missing:[^/]*\/([^/]*)\/([^/]*)\//.exec(gap);
  if (m === null) return false;
  const [, slot, kind] = m as unknown as [string, string, string];
  if (slot === 'torso' || slot === 'head') return true;
  return (slot === 'farLimbs' || slot === 'nearLimbs') && kind !== 'flipper' && !kind.startsWith('flipper-');
}

/** A wanted part; `shared` is the kind tried at v0 when `kind` is not held (no gap on the way; a miss names `shared`). */
interface Wanted { slot: SlotName; index: number; kind: string; variant: number; limb: boolean; at?: RecipePart['at']; shared?: string }

/** The first of `ids` the catalogue holds, with its index, or -1. */
function firstHeld(catalogue: Catalogue, ids: readonly string[]): number {
  return ids.findIndex((id) => catalogue.parts.has(id));
}

/** The legs of a creature with `legs` legs, each asking for its role: the far side has legs >> 1, the near side the rest. */
function legsWanted(legs: number, variant: number): Wanted[] {
  const wanted: Wanted[] = [];
  const far = legs >> 1;
  for (let i = 0; i < far; i++) wanted.push({ slot: 'farLimbs', index: i, kind: limbKind(i, legs), variant, limb: true });
  for (let i = 0; i < legs - far; i++) wanted.push({ slot: 'nearLimbs', index: i, kind: limbKind(i, legs), variant, limb: true });
  return wanted;
}

/**
 * The part id the catalogue holds for one wanted part, pushing the gaps met on the way; undefined when it holds none.
 * `build` is the torso type whose own legs (`<role>-<build>`) come first, or '' for none.
 */
function lookUp(catalogue: Catalogue, family: string, tier: SizeTier, build: string, w: Wanted, gaps: string[]): string | undefined {
  const id = (kind: string, variant: number): string => partId(family, w.slot, kind, tier, variant);
  if (w.limb) {
    // A build's own legs come first, where there is a build: the role on this torso type at the chosen variant, then
    // at v0. A pack need not hold them, so going on to the shared role is no gap. Then the role at the chosen variant,
    // the role at v0, the shared leg at the chosen variant, the shared leg at v0.
    const own = build === '' ? [] : [id(`${w.kind}-${build}`, w.variant), id(`${w.kind}-${build}`, 0)];
    const shared = [id(w.kind, w.variant), id(w.kind, 0), id('leg', w.variant), id('leg', 0)];
    const steps = [[], [`variant:${shared[0]}`], [`role:${shared[1]}`], [`role:${shared[1]}`, `variant:${shared[2]}`]];
    const ownHit = firstHeld(catalogue, own);
    if (ownHit >= 0) { if (ownHit === 1) gaps.push(`variant:${own[0]}`); return own[ownHit]; }
    const hit = firstHeld(catalogue, shared);
    if (hit < 0) { gaps.push(`missing:${shared[3]}`); return undefined; }
    gaps.push(...steps[hit]!);
    return shared[hit];
  }
  if (w.shared !== undefined) {
    // An optional own kind, then the shared kind, both at v0: going on to the shared kind is no gap.
    const tries = [id(w.kind, 0), id(w.shared, 0)];
    const hit = firstHeld(catalogue, tries);
    if (hit < 0) { gaps.push(`missing:${tries[1]}`); return undefined; }
    return tries[hit];
  }
  // The torso variant is the bulk step (lean 0, normal 1, heavy 2): a heavy torso the pack lacks falls back to normal
  // before lean. Every other part goes from its variant straight to v0. Either way one variant: gap names the id asked for.
  const tries = w.slot === 'torso' && w.variant === 2 ? [id(w.kind, 2), id(w.kind, 1), id(w.kind, 0)] : [id(w.kind, w.variant), id(w.kind, 0)];
  const hit = firstHeld(catalogue, tries);
  if (hit < 0) { gaps.push(`missing:${tries[tries.length - 1]}`); return undefined; }
  if (hit > 0) gaps.push(`variant:${tries[0]}`);
  return tries[hit];
}

const byDrawOrder = (x: Wanted, y: Wanted): number => DRAW_ORDER.indexOf(x.slot) - DRAW_ORDER.indexOf(y.slot) || x.index - y.index;

/** The family whose body carries no back part. */
const NO_BACK_FAMILY = 'radial';

/**
 * The parts a fauna body asks for (resolveBody), in DRAW_ORDER then index, and the gaps met on the way; every other
 * kingdom asks for none. Leg roles (`limbs` legs; a build's own legs, `<role>-<torso>`, before the shared ones), the
 * torso, the skin's back part on the torso kind (none on a radial), the head features (headFeatureKinds, at index 0
 * and 1, all hung from the head's `feature` point), and a mark for every part in a mark slot when the creature is
 * patterned. Head `h<head>`
 * only when `head` is not null; tail `t<tail>` whenever `tail` is not null, `t0` included. Eyes: none when null, `eye`
 * at 0 to `eyes - 1`, two `pit` parts when `eyes` is 0; a body without a head part places them on its torso (`at`).
 * A winged build asks for its WING_KINDS at each wing index in both wing slots, and, aquatic, for two `flipper-<torso>`
 * near limbs (falling back to `flipper`); any other airborne quadruped for `sails-<torso>` (falling back to `sails`) in
 * nearWings, hung from the torso's `back`; a body feature (bodyFeatureKind) in bodyFeature. All at v0.
 */
export function planBodyParts(
  b: Body,
  variants: { torso: number; head: number; tail: number; limb: number },
  stream: (name: string) => () => number,
  catalogue: Catalogue,
): { parts: RecipePart[]; gaps: string[] } {
  const parts: RecipePart[] = [];
  const gaps: string[] = [];
  if (b.kingdom !== 'fauna') return { parts, gaps };

  const torsoKind = torsoKindOf(b);
  const wanted: Wanted[] = legsWanted(b.limbs, variants.limb);
  if (b.tail !== null) wanted.push({ slot: 'tail', index: 0, kind: `t${b.tail}`, variant: variants.tail, limb: false });
  wanted.push({ slot: 'torso', index: 0, kind: torsoKind, variant: variants.torso, limb: false });
  const back = BACK_KIND_BY_SKIN[b.skin] ?? null;
  if (back !== null && b.family !== NO_BACK_FAMILY) wanted.push({ slot: 'back', index: 0, kind: `${back}-${torsoKind}`, variant: 0, limb: false });
  if (b.head !== null) {
    wanted.push({ slot: 'head', index: 0, kind: `h${b.head}`, variant: variants.head, limb: false });
  }
  headFeatureKinds(b).forEach((kind, i) => wanted.push({ slot: 'headFeature', index: i, kind, variant: 0, limb: false }));
  const wings = Object.hasOwn(WING_KINDS, b.torso) ? WING_KINDS[b.torso] : undefined;
  if (b.family === 'quadruped' && wings !== undefined) {
    wings.forEach((wing, i) => {
      for (const slot of ['farWings', 'nearWings'] as const) wanted.push({ slot, index: i, kind: `${wing}-${b.torso}`, variant: 0, limb: false });
    });
    if (b.aquatic) {
      for (let i = 0; i < 2; i++) wanted.push({ slot: 'nearLimbs', index: i, kind: `flipper-${b.torso}`, shared: 'flipper', variant: 0, limb: false });
    }
  } else if (b.family === 'quadruped' && b.airborne) {
    wanted.push({ slot: 'nearWings', index: 0, kind: `sails-${b.torso}`, shared: 'sails', variant: 0, limb: false, at: { host: 'torso', point: 'back' } });
  }
  const feature = bodyFeatureKind(b);
  if (feature !== null) wanted.push({ slot: 'bodyFeature', index: 0, kind: feature, variant: 0, limb: false });
  if (b.eyes !== null) {
    const [kind, count] = b.eyes === 0 ? ['pit', 2] : ['eye', b.eyes];
    for (let i = 0; i < count; i++) {
      const eye: Wanted = { slot: 'eyes', index: i, kind, variant: 0, limb: false };
      if (b.head === null) eye.at = { host: 'torso', point: `eye${i}` };
      wanted.push(eye);
    }
  }
  wanted.sort(byDrawOrder);

  for (const w of wanted) {
    const found = lookUp(catalogue, b.family, b.tier, b.torso, w, gaps);
    if (found === undefined) continue;
    const part: RecipePart = { slot: w.slot, index: w.index, partId: found, source: 'own' };
    if (w.at !== undefined) part.at = w.at;
    if (b.pattern !== 0 && MARK_SLOTS.includes(w.slot)) part.mark = markFor(w.slot, w.index, stream);
    parts.push(part);
  }
  return { parts, gaps };
}

/** The slots a named species may bring a part of its own for, kind `<key>` at index 0: asked for only where the pack holds it. */
const SPECIES_OPTIONAL_SLOTS: readonly SlotName[] = ['farWings', 'nearWings', 'bodyFeature', 'back', 'headFeature'];

/**
 * The parts a named species asks for, in DRAW_ORDER then index, and the gaps met on the way: its own torso, head and
 * (with a tail) tail, kind `key`; legs by role, its own (`<role>-<key>`) before the shared role and the shared leg; the
 * its own eye (kind `key`) where the pack holds one, else the family's shared eye, `eyes` times. Every part at v0, none marked. A missing part is a `missing:` gap and is left out.
 * Then each optional part of its own the pack holds, kind `key` at index 0: far and near wings, a body feature, a back
 * part, a head feature; one the pack lacks is no gap. A species without a head (`head=0`) asks for no head and no head
 * feature, and each eye hangs from its torso's `eye<i>`, as planBodyParts places the eyes of a body without a head part.
 */
export function planSpeciesParts(species: Species, catalogue: Catalogue): { parts: RecipePart[]; gaps: string[] } {
  const parts: RecipePart[] = [];
  const gaps: string[] = [];
  const own = (slot: SlotName): Wanted => ({ slot, index: 0, kind: species.key, variant: 0, limb: false });
  const holds = (slot: SlotName): boolean => catalogue.parts.has(partId(species.family, slot, species.key, species.tier, 0));
  const wanted: Wanted[] = legsWanted(species.legs, 0);
  if (species.tail) wanted.push(own('tail'));
  wanted.push(own('torso'));
  if (species.head) wanted.push(own('head'));
  // The species' own eye where the pack holds one; it is optional, so the shared eye is no gap.
  const eyeKind = holds('eyes') ? species.key : 'eye';
  for (let i = 0; i < species.eyes; i++) {
    const eye: Wanted = { slot: 'eyes', index: i, kind: eyeKind, variant: 0, limb: false };
    if (!species.head) eye.at = { host: 'torso', point: `eye${i}` };
    wanted.push(eye);
  }
  for (const slot of SPECIES_OPTIONAL_SLOTS) if (holds(slot) && (species.head || slot !== 'headFeature')) wanted.push(own(slot));
  wanted.sort(byDrawOrder);
  for (const w of wanted) {
    const found = lookUp(catalogue, species.family, species.tier, species.key, w, gaps);
    if (found === undefined) continue;
    const part: RecipePart = { slot: w.slot, index: w.index, partId: found, source: 'own' };
    if (w.at !== undefined) part.at = w.at;
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
