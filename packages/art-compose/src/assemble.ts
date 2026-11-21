import { PATTERN_NAMES, type Catalogue, type PartFrame, type Pose, type Scaffold, type SlotName } from '@cf/art-format';
import type { Recipe, RecipePart } from '@cf/art-recipe';
import { blit, createBuffer, type PixelBuffer } from './buffer';
import { paintMarks } from './marks';
import { PHASE_SPREAD } from './patterns';

// The recipe's ramps and glow flag are not applied here: the buffer holds slot values 0-20 for a later display step. An eye part's accent values 5-8 are written as the iris values 17-20.
// A part that carries a mark, on a creature whose pattern is not plain, is painted (marks.ts) before it is stacked.

export interface Assembly {
  buffer: PixelBuffer;
  contact: readonly [number, number] | null;
  gaps: readonly string[];
}

/** Where a part lands: the canvas point its frame's anchor is placed on, or the gaps that stopped it. */
interface Placed {
  frame: PartFrame | undefined;
  frameName: string; // the frame actually used (`rest` after a fallback)
  x: number;
  y: number;
  gaps: string[];
}

/** The attach point a slot hangs from, and whether that point belongs to the head (otherwise the torso). */
function attachFor(slot: SlotName, index: number, legs: number): { names: string[]; onHead: boolean } {
  switch (slot) {
    case 'farLimbs': return { names: [`far${index}_${legs}`, `far${index}`], onHead: false };
    case 'nearLimbs': return { names: [`near${index}_${legs}`, `near${index}`], onHead: false };
    case 'headFeature': return { names: ['feature'], onHead: true };
    case 'eyes': return { names: [`eye${index}`], onHead: true };
    default: return { names: [slot], onHead: false }; // head, tail, back, glow
  }
}

/**
 * Places each recipe part for one pose on a fresh canvas of the recipe's tier, in recipe order.
 * The torso anchor goes at the scaffold origin; every other part's anchor goes at its attach point
 * on the torso (or, for eyes and the head feature, on the head as it actually landed), plus its
 * pose offset, plus the recipe shift for the head or tail. Problems become gaps, never throws.
 * A pose the scaffold does not hold adds the gap `pose:<poseId>` and uses the scaffold's `rest` pose
 * instead, or no pose offsets at all when the scaffold has no `rest` pose either.
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
  let pose: Pose | undefined = Object.hasOwn(scaffold.poses, poseId) ? scaffold.poses[poseId] : undefined;
  if (pose === undefined) {
    gaps.push(`pose:${poseId}`);
    pose = Object.hasOwn(scaffold.poses, 'rest') ? scaffold.poses['rest'] : undefined;
  }
  const entries = pose === undefined ? [] : pose.entries;

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
    const skipped = (gap: string): Placed => ({ frame: undefined, frameName: '', x: 0, y: 0, gaps: [gap] });
    const part = catalogue.parts.get(rp.partId);
    if (part === undefined) return skipped(`missing:${rp.partId}`);

    // The entry for this leg count wins; else the one with no leg count; else none.
    const entry = entries.find((e) => e.slot === rp.slot && e.index === rp.index && e.legs === recipe.legs)
      ?? entries.find((e) => e.slot === rp.slot && e.index === rp.index && e.legs === undefined);
    let frameName = entry === undefined ? 'rest' : entry.frame;
    const own: string[] = [];
    let frame = Object.hasOwn(part.frames, frameName) ? part.frames[frameName] : undefined;
    if (frame === undefined) {
      own.push(`frame:${rp.partId}:${frameName}`);
      frameName = 'rest';
      frame = Object.hasOwn(part.frames, 'rest') ? part.frames['rest'] : undefined;
      if (frame === undefined) return { frame: undefined, frameName, x: 0, y: 0, gaps: own };
    }
    const dx = entry === undefined ? 0 : entry.dx;
    const dy = entry === undefined ? 0 : entry.dy;

    if (rp.slot === 'torso') return { frame, frameName, x: scaffold.origin[0] + dx, y: scaffold.origin[1] + dy, gaps: own };

    const { names, onHead } = attachFor(rp.slot, rp.index, recipe.legs);
    const hostPart = findPart(onHead ? 'head' : 'torso');
    const host = hostPart === undefined ? undefined : place(hostPart);
    const hostAttach = host?.frame?.attach;
    const found = hostAttach === undefined ? undefined : names.find((nm) => Object.hasOwn(hostAttach, nm));
    const point = hostAttach !== undefined && found !== undefined ? hostAttach[found] : undefined;
    const name = names[names.length - 1] as string; // the plain name is the one a gap reports
    if (host === undefined || host.frame === undefined || point === undefined) {
      own.push(`attach:${name}`);
      return { frame: undefined, frameName, x: 0, y: 0, gaps: own };
    }
    // The attach point is in the host frame's own coordinates; the host's anchor sits at (host.x, host.y).
    let x = host.x + point[0] - host.frame.anchor[0] + dx;
    let y = host.y + point[1] - host.frame.anchor[1] + dy;
    if (rp.slot === 'head') { x += recipe.shift.head[0]; y += recipe.shift.head[1]; }
    if (rp.slot === 'tail') { x += recipe.shift.tail[0]; y += recipe.shift.tail[1]; }
    return { frame, frameName, x, y, gaps: own };
  };

  const pattern = PATTERN_NAMES[recipe.marking.pattern];
  for (const rp of recipe.parts) {
    const p = place(rp);
    gaps.push(...p.gaps);
    if (p.frame === undefined) continue;
    let frame = p.frame;
    if (rp.mark !== undefined && recipe.marking.pattern !== 0 && pattern !== undefined) {
      const phase = (recipe.marking.phase + rp.mark.offset % PHASE_SPREAD) % 15;
      const painted = paintMarks(frame, pattern, recipe.marking.strength, phase, rp.mark.rolls);
      // Painted pixels go on a new frame object: the catalogue's frame is never changed.
      if (painted === null) gaps.push(`marks:${rp.partId}:${p.frameName}`);
      else frame = { ...frame, pixels: painted };
    }
    blit(buffer, frame, p.x, p.y, false, rp.slot === 'eyes');
  }
  return { buffer, contact: pose?.contact ?? null, gaps, scaffold };
}
