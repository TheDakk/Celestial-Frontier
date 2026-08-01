/* The four zoom modes, verbatim vocabulary from v1.8.9 (st.mode):
   universe → galaxy → system → surface. Transitions carry their required
   context — you cannot be "in a galaxy" without a galaxy — so an illegal
   navigation is unrepresentable at the type level and REJECTED at runtime,
   instead of surfacing later as the NaN-camera class of crash the old
   load path had to defend against. */

export type ZoomMode = 'universe' | 'galaxy' | 'system' | 'surface';

/* named optional fields, NOT an index signature — an index signature makes
   concrete node types (GalaxyNode) unassignable, and the save-view spread
   only needs the slimGal field set anyway */
export interface GalRef { seed: number; x: number; y: number; size?: number; sp?: number; tilt?: number; rot?: number; home?: boolean; quasar?: boolean; dwarf?: boolean; }
export interface StarRef { seed: number; x: number; y: number; }
export interface PlanetRef { seed: number; }

export interface NavState {
  mode: ZoomMode;
  gal: GalRef | null;
  star: StarRef | null;
  planet: PlanetRef | null;
}

export const NAV_HOME: NavState = Object.freeze({ mode: 'universe', gal: null, star: null, planet: null });

/* adjacency: each mode reaches only its neighbours (matching the game's
   goTo ladder); leaving a level clears the deeper context so a stale
   star/planet can never leak into the next descent (the st.star-null class
   of per-frame crash, prevented structurally) */
const UP: Record<ZoomMode, ZoomMode | null> = { universe: null, galaxy: 'universe', system: 'galaxy', surface: 'system' };

export type NavResult = { ok: true; state: NavState } | { ok: false; reason: string };

export function enterGalaxy(s: NavState, gal: GalRef): NavResult {
  if (s.mode !== 'universe') return { ok: false, reason: 'enterGalaxy from ' + s.mode };
  if (!gal || !Number.isFinite(gal.seed)) return { ok: false, reason: 'no galaxy' };
  return { ok: true, state: { mode: 'galaxy', gal, star: null, planet: null } };
}
export function enterSystem(s: NavState, star: StarRef): NavResult {
  if (s.mode !== 'galaxy' || !s.gal) return { ok: false, reason: 'enterSystem from ' + s.mode };
  if (!star || !Number.isFinite(star.seed)) return { ok: false, reason: 'no star' };
  return { ok: true, state: { mode: 'system', gal: s.gal, star, planet: null } };
}
export function land(s: NavState, planet: PlanetRef): NavResult {
  if (s.mode !== 'system' || !s.star) return { ok: false, reason: 'land from ' + s.mode };
  if (!planet || !Number.isFinite(planet.seed)) return { ok: false, reason: 'no planet' };
  return { ok: true, state: { mode: 'surface', gal: s.gal, star: s.star, planet } };
}
export function ascend(s: NavState): NavResult {
  const up = UP[s.mode];
  if (!up) return { ok: false, reason: 'already at universe' };
  return {
    ok: true,
    state: {
      mode: up,
      gal: up === 'universe' ? null : s.gal,
      star: up === 'universe' || up === 'galaxy' ? null : s.star,
      planet: null,   /* leaving a surface always clears the planet */
    },
  };
}

/** serialize for the save's `view` (shape-compatible with _sanitizeView input) */
export function navToView(s: NavState): Record<string, unknown> | null {
  if (!s.gal) return null;
  const o: Record<string, unknown> = { type: s.mode === 'surface' || s.mode === 'system' ? (s.planet ? 'planet' : 'star') : 'galaxy', gal: { ...s.gal } };
  if (s.star) o.star = { x: s.star.x, y: s.star.y, seed: s.star.seed };
  if (s.planet) o.pseed = s.planet.seed;
  return o;
}
