import type { Catalogue, PartFrame, Pose, Scaffold, SlotName } from '@cf/art-format';
import type { Recipe, RecipePart } from '@cf/art-recipe';
import { blit, createBuffer, type PixelBuffer } from './buffer';

// The recipe's ramps, marking and glow flag are not applied here: the buffer holds slot values 0-16 for a later display step.

export interface Assembly {
  buffer: PixelBuffer;
  contact: readonly [number, number] | null;
  gaps: readonly string[];
}

/** Where a part lands: the canvas point its frame's anchor is placed on, or the gaps that stopped it. */
interface Placed {
  frame: PartFrame | undefined;
  x: number;
  y: number;
  gaps: string[];
}

/** The attach point a slot hangs from, and whether that point belongs to the head (otherwise the torso). */
function attachFor(slot: SlotName, index: number): { name: string; onHead: boolean } {
  switch (slot) {
    case 'farLimbs': return { name: `far${index}`, onHead: false };
    case 'nearLimbs': return { name: `near${index}`, onHead: false };
    case 'headFeature': return { name: 'feature', onHead: true };
    case 'eyes': return { name: `eye${index}`, onHead: true };
    default: return { name: slot, onHead: false }; // head, tail, back, glow
  }
}

/**
 * Places each recipe part for one pose on a fresh canvas of the recipe's tier, in recipe order.
 * The torso anchor goes at the scaffold origin; every other part's anchor goes at its attach point
 * on the torso (or, for eyes and the head feature, on the head as it actually landed), plus its
 * pose offset, plus the recipe shift for the head or tail. Problems become gaps, never throws,
 * except a pose the scaffold does not hold.
 */
export function assemble(recipe: Recipe, poseId: string, catalogue: Catalogue): Assembly {
  const { buffer, contact, gaps } = assembleWithScaffold(recipe, poseId, catalogue);
  return { buffer, contact, gaps };
}

/** `assemble`, plus the scaffold it looked up (undefined when the catalogue has none), for `compose`. Internal: not re-exported. */
export function assembleWithScaffold(recipe: Recipe, poseId: string, catalogue: Catalogue): Assembly & { scaffold: Scaffold | undefined } {
  const buffer = createBuffer(recipe.tier);
  const gaps: string[] = [...recipe.gaps];
  const scaffold = catalogue.scaffolds.get(recipe.scaffoldId);
  if (scaffold === undefined) return { buffer, contact: null, gaps: [...gaps, `scaffold:${recipe.scaffoldId}`], scaffold };
  if (!Object.hasOwn(scaffold.poses, poseId)) throw new Error(`scaffold ${scaffold.id} has no pose ${poseId}`);
  const pose = scaffold.poses[poseId] as Pose;

  const placed = new Map<RecipePart, Placed>();
  const findPart = (slot: SlotName): RecipePart | undefined => recipe.parts.find((p) => p.slot === slot);

  const place = (rp: RecipePart): Placed => {
    const done = placed.get(rp);
    if (done !== undefined) return done;
    const result = placeOnce(rp);
    placed.set(rp, result);
    return result;
  };

  const placeOnce = (rp: RecipePart): Placed => {
    const skipped = (gap: string): Placed => ({ frame: undefined, x: 0, y: 0, gaps: [gap] });
    const part = catalogue.parts.get(rp.partId);
    if (part === undefined) return skipped(`missing:${rp.partId}`);

    const entry = pose.entries.find((e) => e.slot === rp.slot && e.index === rp.index);
    const frameName = entry === undefined ? 'rest' : entry.frame;
    const own: string[] = [];
    let frame = Object.hasOwn(part.frames, frameName) ? part.frames[frameName] : undefined;
    if (frame === undefined) {
      own.push(`frame:${rp.partId}:${frameName}`);
      frame = Object.hasOwn(part.frames, 'rest') ? part.frames['rest'] : undefined;
      if (frame === undefined) return { frame: undefined, x: 0, y: 0, gaps: own };
    }
    const dx = entry === undefined ? 0 : entry.dx;
    const dy = entry === undefined ? 0 : entry.dy;

    if (rp.slot === 'torso') return { frame, x: scaffold.origin[0] + dx, y: scaffold.origin[1] + dy, gaps: own };

    const { name, onHead } = attachFor(rp.slot, rp.index);
    const hostPart = findPart(onHead ? 'head' : 'torso');
    const host = hostPart === undefined ? undefined : place(hostPart);
    const point = host?.frame !== undefined && Object.hasOwn(host.frame.attach, name) ? host.frame.attach[name] : undefined;
    if (host === undefined || host.frame === undefined || point === undefined) {
      own.push(`attach:${name}`);
      return { frame: undefined, x: 0, y: 0, gaps: own };
    }
    // The attach point is in the host frame's own coordinates; the host's anchor sits at (host.x, host.y).
    let x = host.x + point[0] - host.frame.anchor[0] + dx;
    let y = host.y + point[1] - host.frame.anchor[1] + dy;
    if (rp.slot === 'head') { x += recipe.shift.head[0]; y += recipe.shift.head[1]; }
    if (rp.slot === 'tail') { x += recipe.shift.tail[0]; y += recipe.shift.tail[1]; }
    return { frame, x, y, gaps: own };
  };

  for (const rp of recipe.parts) {
    const p = place(rp);
    gaps.push(...p.gaps);
    if (p.frame !== undefined) blit(buffer, p.frame, p.x, p.y);
  }
  return { buffer, contact: pose.contact ?? null, gaps, scaffold };
}
