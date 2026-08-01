/* Universe-mode scene composition: galaxy node descriptors for the cells
   around a camera center, straight from the ported domain. Pure — the
   renderer decides pixels; this decides WHAT exists where. */
import { galaxiesInCell } from '@cf/domain-worldgen';
import { UCELL, HOME_POS, HOME_GAL_SEED } from '@cf/domain-worldconfig';

export interface GalaxyNode {
  seed: number; x: number; y: number; size: number;
  sp: number; tilt: number; rot: number;
  home: boolean; quasar: boolean; dwarf: boolean;
  /* special populations, passed through for the renderer's bespoke draws */
  radio: boolean; blazar: boolean;
  bridge: { x2: number; y2: number } | null;
}

/** Galaxy nodes for the (2r+1)² cells centered on world position (cx,cy).
    ⚠ requires the capture hooks (GAL_SPRITES) until GalaxyArt ports —
    callers run installCaptureHooks() first, same as the descriptor tests. */
export function universeGalaxies(cx: number, cy: number, r: number): GalaxyNode[] {
  const ccx = Math.floor(cx / UCELL), ccy = Math.floor(cy / UCELL);
  const out: GalaxyNode[] = [];
  for (let gx = ccx - r; gx <= ccx + r; gx++) for (let gy = ccy - r; gy <= ccy + r; gy++) {
    for (const g of (galaxiesInCell(gx, gy) || []) as Array<Record<string, unknown>>) {
      out.push({
        seed: g.seed as number, x: g.x as number, y: g.y as number, size: g.size as number,
        sp: g.sp as number, tilt: g.tilt as number, rot: g.rot as number,
        home: !!g.home, quasar: !!g.quasar, dwarf: !!g.dwarf,
        radio: !!g.radio, blazar: !!g.blazar,
        bridge: (g.bridge && typeof g.bridge === 'object') ? (g.bridge as { x2: number; y2: number }) : null,
      });
    }
  }
  return out;
}

/** The home view: the cells around HOME_POS must contain the home galaxy. */
export function homeUniverse(r = 2): GalaxyNode[] {
  return universeGalaxies(HOME_POS.x, HOME_POS.y, r);
}
export { HOME_GAL_SEED, HOME_POS };
