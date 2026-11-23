/* Where the words of a map stand, in whole art pixels: the same inputs give the same places on every device. */

/** The words of a caption on as few lines as fit `max`, broken at its spaces; `widthOf` measures one line. A single
 *  word wider than `max` keeps a line to itself. */
export function wrapWords(text: string, widthOf: (line: string) => number, max: number): string[] {
  const lines: string[] = [];
  for (const word of text.split(' ')) {
    const last = lines.length - 1;
    const joined = `${lines[last]} ${word}`;
    if (last >= 0 && widthOf(joined) <= max) lines[last] = joined;
    else lines.push(word);
  }
  return lines;
}

export interface Box { x: number; y: number; w: number; h: number }
export interface Disc { x: number; y: number; r: number }
export type Side = 'below' | 'above' | 'right' | 'left';

/** Words to stand by a body. `x`, `y` is the body's centre and `clear` how far from it the words keep: the game's own
 *  offset, or past the body's ring where that is farther. `side` is where the game letters them; `centre` words lie on
 *  the point itself. A lower `rank` is placed sooner; within a rank the larger body (`size`, its radius) goes first. */
export interface LabelSpec { text: string; w: number; h: number; x: number; y: number; clear: number; side: Side | 'centre'; rank: number; size: number }
export interface PlacedLabel extends Box { text: string; side: Side | 'centre' }
/** What words must keep off (`keepOut`: the top bar and the dock) and would rather keep off (`discs`: every body drawn, and
 *  each pixel of a line drawn across the map as a disc of radius 1). */
export interface Surroundings { view: { w: number; h: number }; keepOut: readonly Box[]; discs: readonly Disc[] }

const SIDES = ['below', 'above', 'right', 'left'] as const;

/** Two boxes share a pixel. */
export function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}
/** A box reaches inside a disc. */
export function reaches(box: Box, disc: Disc): boolean {
  const dx = disc.x - Math.min(Math.max(disc.x, box.x), box.x + box.w);
  const dy = disc.y - Math.min(Math.max(disc.y, box.y), box.y + box.h);
  return dx * dx + dy * dy < disc.r * disc.r;
}

/** The box of a label's words on a side of its body. Words over, under or on a body that is in the view are slid
 *  sideways to stay in the view, when they fit it. */
function boxOn(spec: LabelSpec, side: Side | 'centre', view: { w: number; h: number }): Box {
  const { w, h } = spec;
  const slides = spec.x >= 0 && spec.x < view.w && w <= view.w;
  const across = spec.x - (w >> 1);
  const x = slides ? Math.min(Math.max(across, 0), view.w - w) : across;
  if (side === 'below') return { x, y: spec.y + spec.clear, w, h };
  if (side === 'above') return { x, y: spec.y - spec.clear - h, w, h };
  if (side === 'centre') return { x, y: spec.y - (h >> 1), w, h };
  return { x: side === 'right' ? spec.x + spec.clear : spec.x - spec.clear - w, y: spec.y - (h >> 1), w, h };
}

/**
 * Stands each label by its body: on the game's own side when that is free, else on the next of below, above, right
 * and left. A side is free when the words there overlap no words already placed and neither the top bar nor the dock;
 * a side that also lies wholly in the view and off every body is taken before one that does not. A label with no free
 * side is left out. The nearest and largest bodies are placed first: by rank, then the larger body, then the one nearer
 * the middle of the view, then the text. Whole numbers in, whole numbers out.
 */
export function placeLabels(specs: readonly LabelSpec[], around: Surroundings): PlacedLabel[] {
  const { view } = around;
  const from = (spec: LabelSpec): number => {
    const dx = 2 * spec.x - view.w;
    const dy = 2 * spec.y - view.h;
    return dx * dx + dy * dy;
  };
  const order = specs.map((spec, index) => ({ spec, index })).sort((a, b) =>
    a.spec.rank - b.spec.rank || b.spec.size - a.spec.size || from(a.spec) - from(b.spec)
    || (a.spec.text < b.spec.text ? -1 : a.spec.text > b.spec.text ? 1 : 0) || a.index - b.index);
  const placed: PlacedLabel[] = [];
  for (const { spec } of order) {
    const boxes = [spec.side, ...SIDES.filter((side) => side !== spec.side)].map((side) => ({ side, box: boxOn(spec, side, view) }));
    const free = boxes.filter(({ box }) => !placed.some((other) => overlaps(box, other)) && !around.keepOut.some((bar) => overlaps(box, bar)));
    const best = free.find(({ box }) => box.x >= 0 && box.y >= 0 && box.x + box.w <= view.w && box.y + box.h <= view.h
      && !around.discs.some((disc) => reaches(box, disc))) ?? free[0];
    if (best !== undefined) placed.push({ text: spec.text, side: best.side, ...best.box });
  }
  return placed;
}
