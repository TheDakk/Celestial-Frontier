import { MARK_SLOTS, PATTERN_NAMES, SKIN_NAMES, type Catalogue, type Part, type PartFrame, type Pose, type PoseEntry, type Scaffold, type SlotName } from '@cf/art-format';
import type { Recipe, RecipePart } from '@cf/art-recipe';
import { accentAsIris, blit, createBuffer, type PixelBuffer } from './buffer';
import { paintMarks } from './marks';
import { PHASE_SPREAD } from './patterns';
import { finishedPixel } from './finish';
import { armoured, paintSkin, settleTexture, texturedByRule, type Box } from './skin';

// The recipe's ramps and glow flag are not applied here: the buffer holds slot values 0-28 for a later display step. An eye part's accent values 5-8 are written as the iris values 17-20.
// So are a jelly's (family `gelatinous`) torso values 5-8, its organelles, before any mark is painted, so no mark covers one.
// A part that carries a mark, on a creature whose pattern is not plain, is painted (marks.ts) before it is stacked.
// Then, on a creature whose recipe names a skin, every part in a mark slot takes the skin texture (skin.ts), over its marks.
// Once every part is stacked, a texture pixel a rule painted that the stacking left alone (half its cluster under another
// part) is taken back (settleTexture); a drawn skin layer's pixels are never taken back. Armour (plates and chitin on a
// large creature) is settled as the finished picture will show it instead (settleFinished), so no pixel of it stands
// alone once the creature is finished.

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

/** A part's skin texture seed is the creature's phase (0 to 14) plus this for each step of the part's place among the mark slots and indexes. */
const SKIN_SEED_STEP = 15;

/** The family whose torso draws its organelles in the accent values 5-8, shown in the iris ramp (the original paints them in the eye colour). */
const ORGANELLE_FAMILY = 'gelatinous';

/** A copy of a frame's pixels with the accent values 5-8 written as the iris values 17-20. */
function organellesInIris(pixels: Uint8Array): Uint8Array {
  const out = Uint8Array.from(pixels);
  for (let i = 0; i < out.length; i++) out[i] = accentAsIris(out[i] ?? 0);
  return out;
}

/**
 * The attach point a part hangs from, and whether that point belongs to the head (otherwise the torso).
 * A part with `at` hangs from that point on that host, whatever its slot. A wing at index 0 hangs from `wing`, at index 1
 * from `wing1`; a creature has at most two wing pairs, so any other wing index has no point (no names: an `index:` gap).
 * The names are tried in order: a leg's point for this leg count (`far0_6`) before the plain one, and an eye's point for
 * this eye count (`eye0_4`; `eye0_0` for a pit) before the plain one, on whichever host the eye hangs from.
 */
function attachFor(rp: RecipePart, legs: number, eyes: number): { names: string[]; onHead: boolean } {
  const { slot, index } = rp;
  if (rp.at !== undefined) return { names: slot === 'eyes' ? [`${rp.at.point}_${eyes}`, rp.at.point] : [rp.at.point], onHead: rp.at.host === 'head' };
  switch (slot) {
    case 'farWings':
    case 'nearWings': return { names: index === 0 ? ['wing'] : index === 1 ? ['wing1'] : [], onHead: false };
    case 'bodyFeature': return { names: ['back'], onHead: false };
    case 'farLimbs': return { names: [`far${index}_${legs}`, `far${index}`], onHead: false };
    case 'nearLimbs': return { names: [`near${index}_${legs}`, `near${index}`], onHead: false };
    case 'headFeature': return { names: ['feature'], onHead: true };
    case 'eyes': return { names: [`eye${index}_${eyes}`, `eye${index}`], onHead: true };
    default: return { names: [slot], onHead: false }; // head, tail, back, glow
  }
}

/**
 * The pose entry a part takes: the entry for this eye count wins (only an eyes entry carries one); else the one for this
 * leg count; else the one with neither; else none. An entry for another eye count or leg count never applies.
 */
export function poseEntryFor(entries: readonly PoseEntry[], slot: SlotName, index: number, legs: number, eyes: number): PoseEntry | undefined {
  const mine = entries.filter((e) => e.slot === slot && e.index === index);
  return mine.find((e) => e.eyes === eyes)
    ?? mine.find((e) => e.eyes === undefined && e.legs === legs)
    ?? mine.find((e) => e.eyes === undefined && e.legs === undefined);
}

/** The frame a part shows for its pose entry: the entry's frame when the part has it, else `rest` (also when there is no entry). */
export function frameNameFor(part: Part, entry: PoseEntry | undefined): string {
  const wanted = entry === undefined ? 'rest' : entry.frame;
  return Object.hasOwn(part.frames, wanted) ? wanted : 'rest';
}

/**
 * Places each recipe part for one pose on a fresh canvas of the recipe's tier, in recipe order.
 * The torso anchor goes at the scaffold origin; every other part's anchor goes at its attach point
 * on the torso (or, for eyes and the head feature, on the head as it actually landed), plus its
 * pose offset, plus the recipe shift for the head or tail. Problems become gaps, never throws.
 * A pose the scaffold does not hold adds the gap `pose:<poseId>` and uses the scaffold's `rest` pose
 * instead, or no pose offsets at all when the scaffold has no `rest` pose either. A wing at an index other than 0 and 1
 * (and no `at`) is not drawn and adds the gap `index:<slot>:<index>`.
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

    const entry = poseEntryFor(entries, rp.slot, rp.index, recipe.legs, recipe.eyes);
    const wanted = entry === undefined ? 'rest' : entry.frame;
    const own: string[] = [];
    // A frame the part lacks is a gap; the part then shows rest, or is skipped when it has no rest frame either.
    if (!Object.hasOwn(part.frames, wanted)) own.push(`frame:${rp.partId}:${wanted}`);
    const frameName = frameNameFor(part, entry);
    const frame = Object.hasOwn(part.frames, frameName) ? part.frames[frameName] : undefined;
    if (frame === undefined) return { frame: undefined, frameName, x: 0, y: 0, gaps: own };
    const dx = entry === undefined ? 0 : entry.dx;
    const dy = entry === undefined ? 0 : entry.dy;

    if (rp.slot === 'torso') return { frame, frameName, x: scaffold.origin[0] + dx, y: scaffold.origin[1] + dy, gaps: own };

    const { names, onHead } = attachFor(rp, recipe.legs, recipe.eyes);
    // A slot index the composer has no attach point for (a wing index other than 0 and 1): never drawn, an error gap.
    if (names.length === 0) {
      own.push(`index:${rp.slot}:${rp.index}`);
      return { frame: undefined, frameName, x: 0, y: 0, gaps: own };
    }
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

  // A gene outside PATTERN_NAMES would leave every part unpainted with no gap; it cannot occur, as buildRecipe yields genes 0 to 7 only.
  const pattern = PATTERN_NAMES[recipe.marking.pattern];
  // Skin null (buildRecipe, buildSpeciesRecipe, a radial) paints nothing. A gene outside SKIN_NAMES cannot occur (resolveBody wraps it to 0-8).
  const skin = recipe.skin === null ? undefined : SKIN_NAMES[recipe.skin];
  // Whether this creature's plates or chitin are armour: its tier and its body, the scaffold id without the tier (skins.ts).
  const body = recipe.scaffoldId.slice(0, Math.max(0, recipe.scaffoldId.lastIndexOf('/')));
  const armour = skin !== undefined && armoured(skin, recipe.tier, body);
  // The same creature without any texture a rule paints, kept beside the picture from the first such part on.
  let untextured: PixelBuffer | null = null;
  const textured = { x0: buffer.w, y0: buffer.h, x1: -1, y1: -1 }; // the box round every part a rule textured
  for (const rp of recipe.parts) {
    const p = place(rp);
    gaps.push(...p.gaps);
    if (p.frame === undefined) continue;
    let frame = p.frame;
    let bare: PartFrame | null = null;
    // A new frame object, so the catalogue's frame is never changed.
    if (rp.slot === 'torso' && recipe.family === ORGANELLE_FAMILY) frame = { ...frame, pixels: organellesInIris(frame.pixels) };
    // Only the mark slots take marks: an eye, back part, head feature or glow is never painted and never gets a marks gap.
    if (rp.mark !== undefined && recipe.marking.pattern !== 0 && pattern !== undefined && MARK_SLOTS.includes(rp.slot)) {
      const phase = (recipe.marking.phase + rp.mark.offset % PHASE_SPREAD) % 15;
      const painted = paintMarks(frame, pattern, recipe.marking.strength, phase, rp.mark.rolls);
      // Painted pixels go on a new frame object: the catalogue's frame is never changed.
      if (painted === null) gaps.push(`marks:${rp.partId}:${p.frameName}`);
      else frame = { ...frame, pixels: painted };
    }
    // The skin goes over the marks on every part in a mark slot, whether or not the part carries a mark. The frame's
    // own layers are read, the marked pixels painted. Only a torso frame with nothing to paint (a translucent skin
    // without its layer) is a gap; another part with nothing to paint is drawn as it is, silently.
    if (skin !== undefined && MARK_SLOTS.includes(rp.slot)) {
      // The texture's seed: the creature's phase, and the part's slot and index so two legs sharing a drawing differ.
      const nth = rp.index * MARK_SLOTS.length + MARK_SLOTS.indexOf(rp.slot);
      const skinned = paintSkin(frame, frame.pixels, skin, recipe.tier, recipe.marking.phase + SKIN_SEED_STEP * nth, body);
      if (skinned !== null) {
        if (texturedByRule(frame, skin)) {
          bare = frame;
          untextured ??= { w: buffer.w, h: buffer.h, pixels: Uint8Array.from(buffer.pixels) };
          const left = p.x - frame.anchor[0]; const top = p.y - frame.anchor[1];
          textured.x0 = Math.min(textured.x0, left); textured.y0 = Math.min(textured.y0, top);
          textured.x1 = Math.max(textured.x1, left + frame.w - 1); textured.y1 = Math.max(textured.y1, top + frame.h - 1);
        }
        frame = { ...frame, pixels: skinned };
      } else if (rp.slot === 'torso') gaps.push(`skin:${rp.partId}:${p.frameName}`);
    }
    blit(buffer, frame, p.x, p.y, false, rp.slot === 'eyes');
    if (untextured !== null) blit(untextured, bare ?? frame, p.x, p.y, false, rp.slot === 'eyes');
  }
  if (untextured !== null && armour) {
    clearRoundEyes(buffer, untextured, textured);
    settleFinished(buffer, untextured, textured);
  }
  else if (untextured !== null) settleTexture(buffer.w, buffer.h, untextured.pixels, buffer.pixels, textured);
  return { buffer, contact: pose?.contact ?? null, gaps, scaffold };
}

/**
 * Settles armour on the picture as the finishing pass will show it: the creature and the same creature without its
 * texture are finished in copies (the pixels round the textured parts only), the texture is settled there
 * (settleTexture), and every pixel taken back there is taken back in `buffer`. The finishing pass changes a pixel by
 * its own value and the empty pixels round it alone, and the skin never empties or fills a pixel, so finishing `buffer`
 * afterwards gives exactly the settled copy: no texture pixel of the finished creature stands alone, makes a checker,
 * a run of two values in turn or a comb.
 */
function settleFinished(buffer: PixelBuffer, untextured: PixelBuffer, box: Box): void {
  const { w, h } = buffer;
  // The settling reads up to three pixels past the texture, which lies inside `box`: only those pixels are finished.
  const x0 = Math.max(0, box.x0 - REACH); const x1 = Math.min(w - 1, box.x1 + REACH);
  const y0 = Math.max(0, box.y0 - REACH); const y1 = Math.min(h - 1, box.y1 + REACH);
  const shown = new Uint8Array(w * h);
  const bare = new Uint8Array(w * h);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = y * w + x;
      shown[i] = finishedPixel(w, h, buffer.pixels, x, y);
      bare[i] = buffer.pixels[i] === untextured.pixels[i] ? shown[i] ?? 0 : finishedPixel(w, h, untextured.pixels, x, y);
    }
  }
  settleTexture(w, h, bare, shown, box, true);
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) if (shown[y * w + x] === bare[y * w + x]) buffer.pixels[y * w + x] = untextured.pixels[y * w + x] ?? 0;
  }
}
/** How far from any pixel of an eye, each way, armour is taken back once the creature is stacked. */
const EYE_MARGIN = 2;
/** A pixel of an eye: the eye, its highlight or its iris (13, 14, 17 to 20). */
const eyePixel = (v: number): boolean => v === 13 || v === 14 || (v >= 17 && v <= 20);

/**
 * Takes back the texture within `EYE_MARGIN` pixels of every eye pixel of the stacked creature, wherever the eye came
 * from (its own part, a pose's offset, the body's own drawing), so no armour touches an eye. The part painter already
 * keeps a box round each eye point clear; an eye larger than that box, or moved by a pose, is caught here.
 */
function clearRoundEyes(buffer: PixelBuffer, untextured: PixelBuffer, box: Box): void {
  const { w, h } = buffer;
  for (let y = Math.max(0, box.y0 - EYE_MARGIN); y <= box.y1 + EYE_MARGIN && y < h; y++) {
    for (let x = Math.max(0, box.x0 - EYE_MARGIN); x <= box.x1 + EYE_MARGIN && x < w; x++) {
      if (!eyePixel(buffer.pixels[y * w + x] ?? 0)) continue;
      for (let ny = Math.max(0, y - EYE_MARGIN); ny <= y + EYE_MARGIN && ny < h; ny++) {
        for (let nx = Math.max(0, x - EYE_MARGIN); nx <= x + EYE_MARGIN && nx < w; nx++) buffer.pixels[ny * w + nx] = untextured.pixels[ny * w + nx] ?? 0;
      }
    }
  }
}

/** How far past a texture pixel the settling reads: the four pixels of a run from it, either way. */
const REACH = 3;
