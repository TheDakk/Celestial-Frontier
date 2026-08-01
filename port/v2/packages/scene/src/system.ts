/* System-mode scene composition: the star, its planets in orbit order, and
   the system furniture (belt/kuiper), straight from ported systemFor. Pure —
   occlusion/z-order is the renderer's job (the spike proved ring occlusion
   needs no special architecture); WHAT exists in the system is decided here. */
import { systemFor } from '@cf/domain-worldgen';
import { SOL_SEED } from '@cf/domain-worldconfig';

export interface PlanetNode {
  name: string;
  orb: number;                          /* orbit radius — render order derives from it */
  seed: number;
  type: string;
  ring: boolean;
  moons: number;
  P: Record<string, unknown>;           /* the full memoized params — NEVER mutate
                                           (the systemSol lesson: memoized generators
                                           make call order observable state) */
}
export interface SystemScene {
  starSeed: number;
  sol: boolean;
  kind: string;
  starCol: string;
  starR: number;
  planets: PlanetNode[];                /* sorted by orb, innermost first */
  belt: unknown;
  kuiper: unknown;
  hz: unknown;
}

export function systemScene(starSeed: number): SystemScene {
  const sys = systemFor(starSeed) as Record<string, unknown>;
  const planets = ((sys.planets || []) as Array<{ name?: string; orb?: number; P: Record<string, unknown> }>)
    .map((pl) => ({
      name: pl.name || 'Planet',
      orb: pl.orb ?? 0,
      seed: pl.P.seed as number,
      type: (pl.P.type as string) || 'rocky',
      ring: !!pl.P.ring,
      moons: (pl.P.moons as number) || 0,
      P: pl.P,
    }))
    .sort((a, b) => a.orb - b.orb);
  return {
    starSeed, sol: !!sys.sol, kind: (sys.kind as string) || '',
    starCol: (sys.starCol as string) || '', starR: (sys.starR as number) || 0,
    planets, belt: sys.belt ?? null, kuiper: sys.kuiper ?? null, hz: sys.hz ?? null,
  };
}
export { SOL_SEED };
