/* Galaxy-mode scene composition: the star field and deco (nebulae, clusters,
   remnants) of one galaxy, straight from ported starsInCell. Pure.

   THE CELL CONVENTION, read from the Renderer (main.js ~4120) rather than
   guessed — the first naive scan probed cells (0,0)…(3,3) and saw nothing,
   which looked like a bug and was ASTRONOMY: those cells sit inside the
   supermassive black hole's void (stars within rad 34 of the core are
   swallowed; thinning to 85). Coordinates are GALAXY-LOCAL pixels, cells are
   GCELL=42 wide, content exists only for cell centers within GR=1200, and
   the Renderer clips its iteration window to ±(HALO/GCELL+1) with
   HALO = GR × 1.7. */
import { starsInCell, galaxyProfile } from '@cf/domain-worldgen';
import { GR, GCELL } from '@cf/domain-worldconfig';

export interface StarNode { x: number; y: number; c: string; s: number; seed: number; sol?: boolean; }   /* sol: the Sun, injected at SOL_POS (main.js 1531) */
export interface DecoNode { k: string; x: number; y: number; [k: string]: unknown; }
export interface GalaxyCellContent { stars: StarNode[]; deco: DecoNode[]; }

const HALO_CELLS = Math.floor((GR * 1.7) / GCELL) + 1;

/** One cell's content — the render loop's unit of work. Cached upstream by
    the domain (starsInCell memoizes); do not mutate what comes back. */
export function galaxyCell(galSeed: number, prof: Record<string, unknown>, cx: number, cy: number): GalaxyCellContent {
  return starsInCell(galSeed, prof, cx, cy) as unknown as GalaxyCellContent;
}

/** The Renderer's viewport→cell window, verbatim clip semantics:
    world-rect (x0,y0)-(x1,y1) in galaxy-local px → inclusive cell bounds,
    clamped to the halo. */
export function galaxyCellWindow(x0: number, y0: number, x1: number, y1: number): { cx0: number; cy0: number; cx1: number; cy1: number } {
  return {
    cx0: Math.max(Math.floor(x0 / GCELL), -HALO_CELLS - 1),
    cy0: Math.max(Math.floor(y0 / GCELL), -HALO_CELLS - 1),
    cx1: Math.min(Math.floor(x1 / GCELL), HALO_CELLS + 1),
    cy1: Math.min(Math.floor(y1 / GCELL), HALO_CELLS + 1),
  };
}

/** Whole-disc composition (pre-generation / tests / minimaps): every cell
    whose content can exist. Streaming render paths should use
    galaxyCellWindow + galaxyCell instead. */
export function galaxyScene(galSeed: number): { prof: Record<string, unknown>; stars: StarNode[]; deco: DecoNode[] } {
  const prof = galaxyProfile(galSeed) as Record<string, unknown>;
  const R = Math.ceil(GR / GCELL) + 1;
  const stars: StarNode[] = [], deco: DecoNode[] = [];
  for (let cx = -R; cx <= R; cx++) for (let cy = -R; cy <= R; cy++) {
    const cell = galaxyCell(galSeed, prof, cx, cy);
    for (const s of cell.stars) stars.push(s);
    for (const d of cell.deco) deco.push(d);
  }
  return { prof, stars, deco };
}
export { GR, GCELL, HALO_CELLS };
