/* Search/CF1 travel application owner.

   This module owns strict public-address ingress, saved-reach authorization,
   Training's source-proven Sol/Earth routes, Search keyboard semantics, and
   the plan that joins an accepted route to one renderer-side commit. Pixi,
   camera mutation, persistence scheduling, Survey rendering, toast copy and
   Compendium content stay behind injected ports so main.ts remains the thin
   composition adapter for those owners. */
import {
  ascend,
  ascAllowsStar,
  canonicalCF1WorldAddressFromNav,
  getProvenGalaxyKey,
  getProvenPlanetKey,
  getProvenStarKey,
  navFromCanonicalCF1Address,
  navToView,
  parseStrictCF1Code,
  resolveCF1GalaxyAddress,
  resolveCF1StarAddress,
  resolveCF1WorldAddress,
  shipVisualStateOf,
  withinReachOf,
  type CanonicalCF1Address,
  type CanonicalCF1WorldAddress,
  type NavState,
  type PlanetNode,
  type ProvenPlanet,
  type ProvenStar,
  type StrictCF1CodeResult,
} from '@cf/scene';
import { HOME_GAL_SEED, HOME_POS, SOL_POS, SOL_SEED } from '@cf/domain-worldconfig';
import { cleanName, encodeWhere } from '@cf/domain-strays';
import type { SaveStateV2 } from '@cf/persistence';

export type SearchTravelAuthoritySave = Pick<SaveStateV2, 'primeFill' | 'items' | 'ascCh'>;
export type NavigationAuthorityFailure = 'prime-reach' | 'charter-reach';
export type TrainingRouteProofResult<T extends NavState> =
  | { readonly ok: true; readonly state: T }
  | { readonly ok: false; readonly reason: 'source-error' | 'unavailable' };

type NonUniverseNav = Exclude<NavState, { mode: 'universe' }>;
type SearchTravelCommittedNav = Extract<NavState, { mode: 'galaxy' | 'system' }>;
type ValidStrictCF1Code = Extract<StrictCF1CodeResult, { kind: 'valid' }>;

export interface SearchTravelCommitPlan {
  readonly target: NonUniverseNav;
  readonly committedNav: SearchTravelCommittedNav;
  readonly focusPlanet: PlanetNode | null;
  readonly focusAddress: CanonicalCF1WorldAddress | null;
  readonly customPlanetName: string | null;
}

export interface SearchTravelControllerPorts {
  readonly search: HTMLInputElement;
  readonly currentNav: () => NavState;
  readonly currentSave: () => SearchTravelAuthoritySave | null;
  readonly shipLiverySeed: () => number;
  readonly currentPlanetName: (address: CanonicalCF1WorldAddress) => string | null;
  readonly routeChangeBlocked: () => boolean;
  readonly mutationsBlocked: () => boolean;
  readonly planetNodeForProof: (star: ProvenStar, planet: ProvenPlanet) => PlanetNode | null;
  /** Return false when a capacity-protected product mutation refuses the
      atomic route/name commit; Search then retains the exact query. */
  readonly commitNavigation: (plan: SearchTravelCommitPlan) => boolean;
  readonly onPrimeReachBlocked: () => void;
  readonly onCharterReachBlocked: () => void;
  readonly compendiumState: () => Readonly<{
    panelOpen: boolean;
    mode: 'closed' | 'list' | 'detail';
    filter: string;
  }>;
  readonly clearCompendium: () => void;
  readonly presentCompendium: (query: string, opener: HTMLInputElement) => void;
  readonly focusCompendiumContinuation: () => void;
  readonly focusAfterAcceptedRoute: () => void;
}

export interface SearchTravelController {
  readonly encodeHere: () => string | null;
  readonly navigationAuthorityFailure: (target: NavState) => NavigationAuthorityFailure | null;
  readonly trainingSolSystemNav: () => Extract<NavState, { mode: 'system' }> | null;
  readonly trainingEarthSurfaceNav: () => TrainingRouteProofResult<Extract<NavState, { mode: 'surface' }>>;
  readonly jumpToProvenNav: (target: NavState, incomingName?: string | null) => boolean;
  readonly jumpToCanonicalAddress: (address: CanonicalCF1Address, incomingName?: string | null) => boolean;
  readonly selectForManualCopy: (text: string) => void;
  readonly blurIfFocused: () => boolean;
  readonly dispose: () => void;
}

export function resolveStrictCF1Address(parsed: ValidStrictCF1Code): CanonicalCF1Address | null {
  const resolved = parsed.tier === 'galaxy'
    ? resolveCF1GalaxyAddress(parsed.candidate)
    : parsed.tier === 'star'
      ? resolveCF1StarAddress(parsed.candidate)
      : resolveCF1WorldAddress(parsed.candidate);
  return resolved.ok ? resolved.address : null;
}

export function navigationAuthorityFailureFor(
  authoritySave: SearchTravelAuthoritySave,
  target: NavState,
  shipLiverySeed: number,
): NavigationAuthorityFailure | null {
  if (target.mode === 'universe') return null;
  const candidatePrimeCount = Object.keys(authoritySave.primeFill || {}).length;
  const candidateStage = shipVisualStateOf({
    items: authoritySave.items,
    ascCh: authoritySave.ascCh,
    liverySeed: shipLiverySeed,
  }).chassisStage;
  if (!withinReachOf(candidatePrimeCount, target.gal.x, target.gal.y)) return 'prime-reach';
  if ((target.mode === 'system' || target.mode === 'surface')
    && !ascAllowsStar(candidateStage, target.gal.seed, target.star)) return 'charter-reach';
  return null;
}

export function createSearchTravelController(
  ports: SearchTravelControllerPorts,
): SearchTravelController {
  let disposed = false;

  const authorityFailure = (target: NavState): NavigationAuthorityFailure | null => {
    if (target.mode === 'universe') return null;
    const authoritySave = ports.currentSave();
    if (authoritySave === null) {
      throw new Error('Search/travel authority is unavailable before save publication');
    }
    return navigationAuthorityFailureFor(authoritySave, target, ports.shipLiverySeed());
  };

  const encodeHere = (): string | null => {
    const current = ports.currentNav();
    const view = navToView(current);
    if (!view) return null;
    const currentAddress = current.mode === 'surface'
      ? canonicalCF1WorldAddressFromNav(current) : null;
    const name = currentAddress?.ok
      ? ports.currentPlanetName(currentAddress.address) : null;
    return encodeWhere(view as never, name || undefined) as string;
  };

  const trainingSolSystemNav = (): Extract<NavState, { mode: 'system' }> | null => {
    const authoritySave = ports.currentSave();
    if (authoritySave === null) return null;
    const isSol = (state: NavState): state is Extract<NavState, { mode: 'system' }> =>
      state.mode === 'system'
      && state.gal.seed === HOME_GAL_SEED
      && state.gal.x === HOME_POS.x
      && state.gal.y === HOME_POS.y
      && state.star.seed === SOL_SEED
      && state.star.x === SOL_POS.x
      && state.star.y === SOL_POS.y
      && navigationAuthorityFailureFor(authoritySave, state, ports.shipLiverySeed()) === null;
    const current = ports.currentNav();
    if (isSol(current)) return current;
    if (current.mode === 'surface') {
      const lifted = ascend(current);
      if (lifted.ok && isSol(lifted.state)) return lifted.state;
    }
    const address = resolveCF1StarAddress({
      galaxy: { seed: HOME_GAL_SEED, x: HOME_POS.x, y: HOME_POS.y },
      star: { seed: SOL_SEED, x: SOL_POS.x, y: SOL_POS.y },
    });
    if (!address.ok) return null;
    const resolved = navFromCanonicalCF1Address(address.address);
    return resolved.ok && isSol(resolved.state) ? resolved.state : null;
  };

  const trainingEarthSurfaceNav = (): TrainingRouteProofResult<Extract<NavState, { mode: 'surface' }>> => {
    const authoritySave = ports.currentSave();
    if (authoritySave === null) return { ok: false, reason: 'unavailable' };
    const address = resolveCF1WorldAddress({
      galaxy: { seed: HOME_GAL_SEED, x: HOME_POS.x, y: HOME_POS.y },
      star: { seed: SOL_SEED, x: SOL_POS.x, y: SOL_POS.y },
      planet: { seed: 133 },
    });
    if (!address.ok) {
      return { ok: false, reason: address.reason === 'source-error' ? 'source-error' : 'unavailable' };
    }
    const resolved = navFromCanonicalCF1Address(address.address);
    if (!resolved.ok || resolved.state.mode !== 'surface') {
      return { ok: false, reason: 'unavailable' };
    }
    const state = resolved.state;
    const exact = state.gal.seed === HOME_GAL_SEED
      && state.gal.x === HOME_POS.x && state.gal.y === HOME_POS.y
      && state.star.seed === SOL_SEED && state.star.x === SOL_POS.x && state.star.y === SOL_POS.y
      && state.planet.seed === 133 && state.planet.ordinal === 2
      && getProvenGalaxyKey(state.gal) !== null
      && getProvenStarKey(state.star) !== null
      && getProvenPlanetKey(state.planet) !== null
      && navigationAuthorityFailureFor(authoritySave, state, ports.shipLiverySeed()) === null;
    return exact ? { ok: true, state } : { ok: false, reason: 'unavailable' };
  };

  const jumpToProvenNav = (target: NavState, incomingName: string | null = null): boolean => {
    if (ports.routeChangeBlocked()) return false;
    const authoritySave = ports.currentSave();
    if (authoritySave === null || target.mode === 'universe') return false;
    const failure = navigationAuthorityFailureFor(authoritySave, target, ports.shipLiverySeed());
    if (failure === 'prime-reach') {
      ports.onPrimeReachBlocked();
      return false;
    }
    if (failure === 'charter-reach') {
      ports.onCharterReachBlocked();
      return false;
    }
    const focusPlanet = target.mode === 'surface'
      ? ports.planetNodeForProof(target.star, target.planet)
      : null;
    const focusAddress = target.mode === 'surface'
      ? canonicalCF1WorldAddressFromNav(target) : null;
    if (target.mode === 'surface'
      && (!focusPlanet || focusPlanet.seed !== target.planet.seed
        || focusPlanet.ordinal !== target.planet.ordinal
        || !focusAddress?.ok)) return false;

    let committedNav: SearchTravelCommittedNav;
    if (target.mode === 'surface') {
      const lifted = ascend(target);
      if (!lifted.ok || lifted.state.mode !== 'system') return false;
      committedNav = lifted.state;
    } else committedNav = target;

    const customPlanetName = focusPlanet && incomingName && !ports.mutationsBlocked()
      ? cleanName(incomingName) || null
      : null;
    const committed = ports.commitNavigation(Object.freeze({
      target,
      committedNav,
      focusPlanet,
      focusAddress: focusAddress?.ok ? focusAddress.address : null,
      customPlanetName,
    }));
    return committed;
  };

  const jumpToCanonicalAddress = (
    address: CanonicalCF1Address,
    incomingName: string | null = null,
  ): boolean => {
    const resolved = navFromCanonicalCF1Address(address);
    return resolved.ok ? jumpToProvenNav(resolved.state, incomingName) : false;
  };

  const focusSearch = (): void => { ports.search.focus(); };
  const onSearchKeydown = (event: KeyboardEvent): void => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    event.stopPropagation();
    const query = ports.search.value.trim();
    if (!query) {
      const compendium = ports.compendiumState();
      if (compendium.panelOpen && compendium.mode === 'list' && compendium.filter) {
        ports.search.value = '';
        ports.clearCompendium();
        ports.focusCompendiumContinuation();
      }
      return;
    }
    const strict = parseStrictCF1Code(query);
    if (strict.kind === 'invalid') {
      focusSearch();
      return;
    }
    if (strict.kind === 'valid') {
      const address = resolveStrictCF1Address(strict);
      if (address && jumpToCanonicalAddress(address, strict.name)) {
        ports.search.value = '';
        queueMicrotask(ports.focusAfterAcceptedRoute);
      } else focusSearch();
      return;
    }
    ports.presentCompendium(query, ports.search);
    ports.focusCompendiumContinuation();
  };

  ports.search.addEventListener('keydown', onSearchKeydown);

  return Object.freeze({
    encodeHere,
    navigationAuthorityFailure: authorityFailure,
    trainingSolSystemNav,
    trainingEarthSurfaceNav,
    jumpToProvenNav,
    jumpToCanonicalAddress,
    selectForManualCopy: (text: string): void => {
      ports.search.value = text;
      ports.search.focus();
      ports.search.select();
    },
    blurIfFocused: (): boolean => {
      if (ports.search.ownerDocument.activeElement !== ports.search) return false;
      ports.search.blur();
      return true;
    },
    dispose: (): void => {
      if (disposed) return;
      disposed = true;
      ports.search.removeEventListener('keydown', onSearchKeydown);
    },
  });
}
