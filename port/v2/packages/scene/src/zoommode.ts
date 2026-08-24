/* The four v1.8.9 zoom-mode names remain unchanged. What changes here is
   authority: a seed-shaped caller object is no longer navigation context.
   Every non-home state is built from runtime-proven CF1 hierarchy nodes,
   frozen, and registered in this module's private provenance set. */
import {
  isCanonicalCF1Address,
  getProvenPlanetKey,
  isProvenGalaxy,
  isProvenPlanet,
  isProvenPlanetFor,
  isProvenStar,
  isProvenStarFor,
  resolveCF1GalaxyAddress,
  resolveCF1StarAddress,
  resolveCF1WorldAddress,
  type CF1AddressFailure,
  type CanonicalCF1WorldAddress,
  type ProvenGalaxy,
  type ProvenPlanet,
  type ProvenStar,
} from './address.js';

declare const NAV_STATE_BRAND: unique symbol;

interface NavStateBrand {
  readonly [NAV_STATE_BRAND]: true;
}

export type ZoomMode = 'universe' | 'galaxy' | 'system' | 'surface';

export interface UniverseNav extends NavStateBrand {
  readonly mode: 'universe';
  readonly gal: null;
  readonly star: null;
  readonly planet: null;
}

export interface GalaxyNav extends NavStateBrand {
  readonly mode: 'galaxy';
  readonly gal: ProvenGalaxy;
  readonly star: null;
  readonly planet: null;
}

export interface SystemNav extends NavStateBrand {
  readonly mode: 'system';
  readonly gal: ProvenGalaxy;
  readonly star: ProvenStar;
  readonly planet: null;
}

export interface SurfaceNav extends NavStateBrand {
  readonly mode: 'surface';
  readonly gal: ProvenGalaxy;
  readonly star: ProvenStar;
  readonly planet: ProvenPlanet;
}

export type NavState = UniverseNav | GalaxyNav | SystemNav | SurfaceNav;

export type NavTransitionFailure =
  | 'unproven-nav-state'
  | 'enter-galaxy-from-non-universe'
  | 'unproven-galaxy'
  | 'enter-system-from-non-galaxy'
  | 'unproven-star'
  | 'star-parent-mismatch'
  | 'land-from-non-system'
  | 'unproven-planet'
  | 'planet-parent-mismatch'
  | 'already-at-universe'
  | 'unproven-address';

export type NavResult<T extends NavState = NavState> =
  | Readonly<{ ok: true; state: T }>
  | Readonly<{ ok: false; reason: NavTransitionFailure }>;

export type ResolveViewToNavFailure = CF1AddressFailure | NavTransitionFailure | 'malformed-view';
export type ResolveViewToNavResult =
  | Readonly<{ ok: true; state: NavState }>
  | Readonly<{ ok: false; reason: ResolveViewToNavFailure }>;

export type ResolveSurfaceNavAddressFailure =
  | CF1AddressFailure
  | NavTransitionFailure
  | 'surface-nav-required'
  | 'world-address-mismatch';
export type ResolveSurfaceNavAddressResult =
  | Readonly<{ ok: true; address: CanonicalCF1WorldAddress }>
  | Readonly<{ ok: false; reason: ResolveSurfaceNavAddressFailure }>;

const PROVEN_NAV_STATES = new WeakSet<object>();

function registerNav<T extends object>(value: T): T & NavStateBrand {
  const frozen = Object.freeze(value) as T & NavStateBrand;
  PROVEN_NAV_STATES.add(frozen);
  return frozen;
}

function isProvenNavState(value: unknown): value is NavState {
  return typeof value === 'object' && value !== null && PROVEN_NAV_STATES.has(value);
}

function success<T extends NavState>(state: T): NavResult<T> {
  return Object.freeze({ ok: true, state });
}

function failure(reason: NavTransitionFailure): Readonly<{ ok: false; reason: NavTransitionFailure }> {
  return Object.freeze({ ok: false, reason });
}

function viewFailure(reason: ResolveViewToNavFailure): ResolveViewToNavResult {
  return Object.freeze({ ok: false, reason });
}

function galaxyNav(gal: ProvenGalaxy): GalaxyNav {
  return registerNav({ mode: 'galaxy' as const, gal, star: null, planet: null });
}

function systemNav(gal: ProvenGalaxy, star: ProvenStar): SystemNav {
  return registerNav({ mode: 'system' as const, gal, star, planet: null });
}

function surfaceNav(gal: ProvenGalaxy, star: ProvenStar, planet: ProvenPlanet): SurfaceNav {
  return registerNav({ mode: 'surface' as const, gal, star, planet });
}

export const NAV_HOME: UniverseNav = registerNav({
  mode: 'universe' as const,
  gal: null,
  star: null,
  planet: null,
});

export function enterGalaxy(s: NavState, gal: ProvenGalaxy): NavResult<GalaxyNav> {
  if (!isProvenNavState(s)) return failure('unproven-nav-state');
  if (s.mode !== 'universe') return failure('enter-galaxy-from-non-universe');
  if (!isProvenGalaxy(gal)) return failure('unproven-galaxy');
  return success(galaxyNav(gal));
}

export function enterSystem(s: NavState, star: ProvenStar): NavResult<SystemNav> {
  if (!isProvenNavState(s)) return failure('unproven-nav-state');
  if (s.mode !== 'galaxy') return failure('enter-system-from-non-galaxy');
  if (!isProvenStar(star)) return failure('unproven-star');
  if (!isProvenStarFor(star, s.gal)) return failure('star-parent-mismatch');
  return success(systemNav(s.gal, star));
}

export function land(s: NavState, planet: ProvenPlanet): NavResult<SurfaceNav> {
  if (!isProvenNavState(s)) return failure('unproven-nav-state');
  if (s.mode !== 'system') return failure('land-from-non-system');
  if (!isProvenPlanet(planet)) return failure('unproven-planet');
  if (!isProvenPlanetFor(planet, s.star)) return failure('planet-parent-mismatch');
  return success(surfaceNav(s.gal, s.star, planet));
}

export function ascend(s: NavState): NavResult<UniverseNav | GalaxyNav | SystemNav> {
  if (!isProvenNavState(s)) return failure('unproven-nav-state');
  switch (s.mode) {
    case 'universe': return failure('already-at-universe');
    case 'galaxy': return success(NAV_HOME);
    case 'system': return success(galaxyNav(s.gal));
    case 'surface': return success(systemNav(s.gal, s.star));
  }
}

/** Build navigation from one registered canonical address. Structural copies
    are rejected even when they retain genuine child objects. */
export function navFromCanonicalCF1Address(
  address: unknown,
): NavResult<GalaxyNav | SystemNav | SurfaceNav> {
  if (!isCanonicalCF1Address(address)) return failure('unproven-address');
  const galaxy = enterGalaxy(NAV_HOME, address.galaxy);
  if (!galaxy.ok || !('star' in address)) return galaxy;
  const system = enterSystem(galaxy.state, address.star);
  if (!system.ok || !('planet' in address)) return system;
  return land(system.state, address.planet);
}

/** Recover the complete canonical ownership address from a live surface.
    A NavState lookalike is not authority: the state itself, every hierarchy
    node, both parent links, and the planet's source ordinal must still prove.
    Re-resolution also catches generator/source drift before an ownership
    caller can persist or act on the world. */
export function canonicalCF1WorldAddressFromNav(
  state: unknown,
): ResolveSurfaceNavAddressResult {
  const reject = (reason: ResolveSurfaceNavAddressFailure): ResolveSurfaceNavAddressResult =>
    Object.freeze({ ok: false, reason });
  if (!isProvenNavState(state)) return reject('unproven-nav-state');
  if (state.mode !== 'surface') return reject('surface-nav-required');
  if (!isProvenGalaxy(state.gal)) return reject('unproven-galaxy');
  if (!isProvenStar(state.star)) return reject('unproven-star');
  if (!isProvenStarFor(state.star, state.gal)) return reject('star-parent-mismatch');
  if (!isProvenPlanet(state.planet)) return reject('unproven-planet');
  if (!isProvenPlanetFor(state.planet, state.star)) return reject('planet-parent-mismatch');
  const expectedKey = getProvenPlanetKey(state.planet);
  if (!expectedKey) return reject('world-address-mismatch');

  const resolved = resolveCF1WorldAddress({
    galaxy: state.gal,
    star: state.star,
    planet: { seed: state.planet.seed },
  });
  if (!resolved.ok) return reject(resolved.reason);
  if (resolved.address.key !== expectedKey
    || resolved.address.planet.seed !== state.planet.seed
    || resolved.address.planet.ordinal !== state.planet.ordinal) {
    return reject('world-address-mismatch');
  }
  return Object.freeze({ ok: true, address: resolved.address });
}

function slimGalaxy(gal: ProvenGalaxy): Record<string, unknown> {
  return {
    x: gal.x,
    y: gal.y,
    size: gal.size,
    sp: gal.sp,
    tilt: gal.tilt,
    rot: gal.rot,
    seed: gal.seed,
    home: gal.home,
    quasar: gal.quasar,
    dwarf: gal.dwarf,
  };
}

function slimStar(star: ProvenStar): Record<string, unknown> {
  return { x: star.x, y: star.y, seed: star.seed };
}

/** Exact legacy save/share projection. Runtime provenance and source-cell/
    ordinal metadata deliberately never cross this serialization boundary. */
export function navToView(s: NavState): Record<string, unknown> | null {
  if (!isProvenNavState(s)) throw new TypeError('navToView requires a proven NavState');
  switch (s.mode) {
    case 'universe': return null;
    case 'galaxy': return { type: 'galaxy', gal: slimGalaxy(s.gal) };
    case 'system': return { type: 'star', gal: slimGalaxy(s.gal), star: slimStar(s.star) };
    case 'surface': return {
      type: 'planet',
      gal: slimGalaxy(s.gal),
      star: slimStar(s.star),
      pseed: s.planet.seed,
    };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Strict persisted/public view ingress. `null` alone is canonical home.
    Non-null tiers must prove their complete claimed hierarchy; malformed
    children never degrade into a lower, partially trusted mode. */
export function resolveViewToNav(view: unknown): ResolveViewToNavResult {
  if (view === null) return success(NAV_HOME);
  if (!isRecord(view)) return viewFailure('malformed-view');

  let resolved;
  switch (view.type) {
    case 'galaxy':
      if (!Object.prototype.hasOwnProperty.call(view, 'gal')
        || Object.prototype.hasOwnProperty.call(view, 'star')
        || Object.prototype.hasOwnProperty.call(view, 'pseed')) return viewFailure('malformed-view');
      resolved = resolveCF1GalaxyAddress({ galaxy: view.gal });
      break;
    case 'star':
      if (!Object.prototype.hasOwnProperty.call(view, 'gal')
        || !Object.prototype.hasOwnProperty.call(view, 'star')
        || Object.prototype.hasOwnProperty.call(view, 'pseed')) return viewFailure('malformed-view');
      resolved = resolveCF1StarAddress({ galaxy: view.gal, star: view.star });
      break;
    case 'planet':
      if (!Object.prototype.hasOwnProperty.call(view, 'gal')
        || !Object.prototype.hasOwnProperty.call(view, 'star')
        || !Object.prototype.hasOwnProperty.call(view, 'pseed')) return viewFailure('malformed-view');
      resolved = resolveCF1WorldAddress({
        galaxy: view.gal,
        star: view.star,
        planet: { seed: view.pseed },
      });
      break;
    default:
      return viewFailure('malformed-view');
  }
  if (!resolved.ok) return viewFailure(resolved.reason);
  return navFromCanonicalCF1Address(resolved.address);
}
