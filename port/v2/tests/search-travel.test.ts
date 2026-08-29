import { createRequire } from 'node:module';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import {
  NAV_HOME,
  canonicalCF1WorldAddressFromNav,
  navFromCanonicalCF1Address,
  parseStrictCF1Code,
  resolveCF1GalaxyAddress,
  resolveCF1StarAddress,
  resolveCF1WorldAddress,
  systemScene,
  universeGalaxies,
  type NavState,
  type PlanetNode,
} from '@cf/scene';
import {
  createSearchTravelController,
  navigationAuthorityFailureFor,
  type SearchTravelAuthoritySave,
  type SearchTravelCommitPlan,
} from '../apps/game/src/search-travel.js';

interface TestWindow extends Window {
  close: () => void;
  KeyboardEvent: typeof KeyboardEvent;
}
interface TestDom { window: TestWindow }

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as {
  JSDOM: new (html: string, options?: Record<string, unknown>) => TestDom;
};

const GALAXY = 'CF1-eyJ0IjoiZyIsImciOls5MCwtNjAsNzgsMCwwLjYyLDAuNSw5OTksMV19';
const STAR = 'CF1-eyJ0IjoicyIsImciOls5MCwtNjAsNzgsMCwwLjYyLDAuNSw5OTksMV0sInMiOls1NjAsMTcwLDQyNDI0Ml19';
const EARTH = 'CF1-eyJ0IjoicCIsImciOls5MCwtNjAsNzgsMCwwLjYyLDAuNSw5OTksMV0sInMiOls1NjAsMTcwLDQyNDI0Ml0sInAiOjEzM30';
const FORGED_SOL = 'CF1-eyJ0IjoicyIsImciOls5MCwtNjAsNzgsMCwwLjYyLDAuNSw5OTksMV0sInMiOls1NjAuMDEsMTcwLDQyNDI0Ml19';
const SHIP_LIVERY_SEED = 0x5111;
const HOME_CANDIDATE = Object.freeze({
  galaxy: Object.freeze({ seed: 999, x: 90, y: -60 }),
  star: Object.freeze({ seed: 424242, x: 560, y: 170 }),
  planet: Object.freeze({ seed: 133 }),
});
const FINE_STAR_CANDIDATE = Object.freeze({
  galaxy: HOME_CANDIDATE.galaxy,
  star: Object.freeze({ seed: 1664319693, x: -164.45360307302326, y: -117.94395204260945 }),
});
const BASE_AUTHORITY: SearchTravelAuthoritySave = Object.freeze({
  primeFill: Object.freeze({}),
  items: [],
  ascCh: 0,
});
type ProofIdentity = 'exact' | 'null' | 'wrong-seed' | 'wrong-ordinal';

beforeAll(() => installCaptureHooks());

const openDoms: TestDom[] = [];
afterEach(() => {
  for (const dom of openDoms.splice(0)) dom.window.close();
});

function codeOf(value: unknown): string {
  return 'CF1-' + Buffer.from(JSON.stringify(value), 'utf8').toString('base64url');
}

function provenNav(
  kind: 'galaxy' | 'star' | 'surface',
): Exclude<NavState, { mode: 'universe' }> {
  const address = kind === 'galaxy'
    ? resolveCF1GalaxyAddress({ galaxy: HOME_CANDIDATE.galaxy })
    : kind === 'star'
      ? resolveCF1StarAddress(HOME_CANDIDATE)
      : resolveCF1WorldAddress(HOME_CANDIDATE);
  if (!address.ok) throw new Error(`fixture address proof failed: ${address.reason}`);
  const resolved = navFromCanonicalCF1Address(address.address);
  if (!resolved.ok) throw new Error(`fixture navigation failed: ${resolved.reason}`);
  return resolved.state;
}

function fineStarNav(): Extract<NavState, { mode: 'system' }> {
  const address = resolveCF1StarAddress(FINE_STAR_CANDIDATE);
  if (!address.ok) throw new Error(`fine-star proof failed: ${address.reason}`);
  const resolved = navFromCanonicalCF1Address(address.address);
  if (!resolved.ok || resolved.state.mode !== 'system') throw new Error('fine-star navigation failed');
  return resolved.state;
}

function farGalaxyNav(): Extract<NavState, { mode: 'galaxy' }> {
  const candidate = universeGalaxies(4_000, 4_000, 2)
    .find((galaxy) => Math.hypot(galaxy.x - 90, galaxy.y + 60) > 1_000);
  if (!candidate) throw new Error('far-galaxy fixture search failed');
  const address = resolveCF1GalaxyAddress({
    galaxy: { seed: candidate.seed, x: candidate.x, y: candidate.y },
  });
  if (!address.ok) throw new Error(`far-galaxy proof failed: ${address.reason}`);
  const resolved = navFromCanonicalCF1Address(address.address);
  if (!resolved.ok || resolved.state.mode !== 'galaxy') throw new Error('far-galaxy navigation failed');
  return resolved.state;
}

function createHarness() {
  const dom = new JSDOM(`<!doctype html><html><body>
    <input id="search" type="search">
    <button id="continuation">Compendium continuation</button>
    <button id="route-focus">Route focus</button>
  </body></html>`, { url: 'https://example.test/' });
  openDoms.push(dom);
  const document = dom.window.document;
  const input = document.querySelector<HTMLInputElement>('#search')!;
  const continuation = document.querySelector<HTMLButtonElement>('#continuation')!;
  const routeFocus = document.querySelector<HTMLButtonElement>('#route-focus')!;
  let nav: NavState = NAV_HOME;
  let authority: SearchTravelAuthoritySave | null = BASE_AUTHORITY;
  let routeBlocked = false;
  let mutationsBlocked = false;
  let commitAccepted = true;
  let commitHold: Promise<void> | null = null;
  let releaseCommitHold: (() => void) | null = null;
  let proofIdentity: ProofIdentity = 'exact';
  let lastProof: PlanetNode | null = null;
  let compendium: {
    panelOpen: boolean;
    mode: 'closed' | 'list' | 'detail';
    filter: string;
  } = { panelOpen: false, mode: 'closed', filter: '' };
  const planetNames = new Map<string, string>();
  const commits: SearchTravelCommitPlan[] = [];
  const primeBlocks = vi.fn();
  const charterBlocks = vi.fn();
  const clears = vi.fn(() => { compendium = { panelOpen: true, mode: 'list', filter: '' }; });
  const presentations = vi.fn<(query: string, opener: HTMLInputElement) => void>();
  const continuationFocuses = vi.fn(() => { continuation.focus(); });
  const acceptedFocuses = vi.fn(() => { routeFocus.focus(); });
  const controller = createSearchTravelController({
    search: input,
    currentNav: () => nav,
    currentSave: () => authority,
    shipLiverySeed: () => SHIP_LIVERY_SEED,
    currentPlanetName: (address) => planetNames.get(address.key) ?? null,
    routeChangeBlocked: () => routeBlocked,
    mutationsBlocked: () => mutationsBlocked,
    planetNodeForProof: (star, planet) => {
      const exact = systemScene(star.seed).planets.find((candidate) => (
        candidate.seed === planet.seed && candidate.ordinal === planet.ordinal
      )) ?? null;
      if (proofIdentity === 'null' || exact === null) lastProof = null;
      else if (proofIdentity === 'wrong-seed') lastProof = { ...exact, seed: exact.seed + 1 };
      else if (proofIdentity === 'wrong-ordinal') lastProof = { ...exact, ordinal: exact.ordinal + 1 };
      else lastProof = exact;
      return lastProof;
    },
    commitNavigation: async (plan) => {
      if (commitHold !== null) await commitHold;
      if (!commitAccepted) return false;
      commits.push(plan);
      nav = plan.committedNav;
      if (plan.focusAddress && plan.customPlanetName) {
        planetNames.set(plan.focusAddress.key, plan.customPlanetName);
      }
      return true;
    },
    onPrimeReachBlocked: primeBlocks,
    onCharterReachBlocked: charterBlocks,
    compendiumState: () => compendium,
    clearCompendium: clears,
    presentCompendium: presentations,
    focusCompendiumContinuation: continuationFocuses,
    focusAfterAcceptedRoute: acceptedFocuses,
  });
  const parentKeydowns = vi.fn();
  document.body.addEventListener('keydown', parentKeydowns);
  const keydown = (value: string, key: string, focusSearch: boolean): KeyboardEvent => {
    input.value = value;
    (focusSearch ? input : routeFocus).focus();
    const event = new dom.window.KeyboardEvent('keydown', {
      key, bubbles: true, cancelable: true,
    });
    input.dispatchEvent(event);
    return event;
  };
  const enter = (value: string): KeyboardEvent => keydown(value, 'Enter', true);
  const enterBlurred = (value: string): KeyboardEvent => keydown(value, 'Enter', false);
  const settle = async (): Promise<void> => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  };
  return {
    dom, document, input, continuation, routeFocus, controller, commits,
    primeBlocks, charterBlocks, clears, presentations, continuationFocuses, acceptedFocuses,
    parentKeydowns, keydown, enter, enterBlurred, settle,
    setNav: (value: NavState) => { nav = value; },
    setAuthority: (value: SearchTravelAuthoritySave | null) => { authority = value; },
    setRouteBlocked: (value: boolean) => { routeBlocked = value; },
    setMutationsBlocked: (value: boolean) => { mutationsBlocked = value; },
    setCommitAccepted: (value: boolean) => { commitAccepted = value; },
    holdCommit: (): (() => void) => {
      commitHold = new Promise<void>((resolve) => { releaseCommitHold = resolve; });
      return () => {
        releaseCommitHold?.();
        releaseCommitHold = null;
        commitHold = null;
      };
    },
    setProofIdentity: (value: ProofIdentity) => { proofIdentity = value; },
    lastProof: () => lastProof,
    setCompendium: (value: typeof compendium) => { compendium = value; },
    setPlanetName: (state: Extract<NavState, { mode: 'surface' }>, name: string) => {
      const address = canonicalCF1WorldAddressFromNav(state);
      if (!address.ok) throw new Error(`name fixture address failed: ${address.reason}`);
      planetNames.set(address.address.key, name);
    },
  };
}

describe('Search/CF1 travel application owner', () => {
  it('proves Training routes and encodes the current proven hierarchy with its custom name', async () => {
    const h = createHarness();
    const sol = h.controller.trainingSolSystemNav();
    expect(sol).toMatchObject({
      mode: 'system',
      gal: { seed: 999, x: 90, y: -60 },
      star: { seed: 424242, x: 560, y: 170 },
    });
    const earth = h.controller.trainingEarthSurfaceNav();
    expect(earth).toMatchObject({
      ok: true,
      state: { mode: 'surface', planet: { seed: 133, ordinal: 2 } },
    });
    if (!earth.ok) throw new Error('Earth route unexpectedly unavailable');
    h.setNav(earth.state);
    h.setPlanetName(earth.state, 'Blue Home');
    const encoded = h.controller.encodeHere();
    expect(encoded).not.toBeNull();
    expect(parseStrictCF1Code(encoded!)).toMatchObject({
      kind: 'valid', tier: 'planet', name: 'Blue Home',
      candidate: { galaxy: { seed: 999 }, star: { seed: 424242 }, planet: { seed: 133 } },
    });

    h.setNav(NAV_HOME);
    expect(h.controller.encodeHere()).toBeNull();
    h.setAuthority(null);
    expect(h.controller.trainingSolSystemNav()).toBeNull();
    expect(h.controller.trainingEarthSurfaceNav()).toEqual({ ok: false, reason: 'unavailable' });
    expect(h.controller.navigationAuthorityFailure(NAV_HOME)).toBeNull();
    expect(() => h.controller.navigationAuthorityFailure(provenNav('galaxy')))
      .toThrow('authority is unavailable');
    expect(await h.controller.jumpToProvenNav(provenNav('galaxy'))).toBe(false);
    expect(h.commits).toHaveLength(0);
    expect(h.primeBlocks).not.toHaveBeenCalled();
    expect(h.charterBlocks).not.toHaveBeenCalled();

    const event = h.enter(GALAXY);
    expect(event.defaultPrevented).toBe(true);
    expect(h.input.value).toBe(GALAXY);
    expect(h.document.activeElement).toBe(h.input);
    expect(h.commits).toHaveLength(0);
    expect(h.primeBlocks).not.toHaveBeenCalled();
    expect(h.charterBlocks).not.toHaveBeenCalled();
    expect(h.parentKeydowns).not.toHaveBeenCalled();
    await Promise.resolve();
    expect(h.acceptedFocuses).not.toHaveBeenCalled();
  });

  it('keeps galaxy/star/planet codes distinct and commits a surface route through one system seam', async () => {
    const h = createHarness();
    for (const [code, mode] of [[GALAXY, 'galaxy'], [STAR, 'system']] as const) {
      const event = h.enter(code);
      expect(event.defaultPrevented).toBe(true);
      await h.settle();
      expect(h.commits.at(-1)?.target.mode).toBe(mode);
      expect(h.commits.at(-1)?.committedNav.mode).toBe(mode);
      expect(h.commits.at(-1)?.followedCode).toBe(code);
      expect(h.input.value).toBe('');
      expect(h.document.activeElement).toBe(h.routeFocus);
    }

    const namedEarth = codeOf({
      t: 'p', g: [90, -60, 78, 0, 0.62, 0.5, 999, 1],
      s: [560, 170, 424242], p: 133, n: ' Blue Home ',
    });
    h.enter(namedEarth);
    await h.settle();
    const plan = h.commits.at(-1)!;
    expect(plan.target).toMatchObject({ mode: 'surface', planet: { seed: 133, ordinal: 2 } });
    expect(plan.committedNav).toMatchObject({ mode: 'system', star: { seed: 424242 } });
    expect(plan.focusAddress).toMatchObject({
      key: 'CF1|g:999@90,-60|s:424242@560,170|p:133#2',
    });
    expect(plan.focusPlanet).toMatchObject({ seed: 133, ordinal: 2 });
    expect(plan.customPlanetName).toBe('Blue Home');
    expect(plan.followedCode).toBe(namedEarth);
    expect(h.commits).toHaveLength(3);
    expect(h.acceptedFocuses).toHaveBeenCalledTimes(3);
  });

  it('keeps malformed/rejected marked codes corrective and sends only ordinary text to Compendium', async () => {
    const h = createHarness();
    const unownedKey = h.keydown('unchanged', 'Escape', true);
    expect(unownedKey.defaultPrevented).toBe(false);
    expect(h.parentKeydowns).toHaveBeenCalledOnce();
    for (const rejected of ['CF1-not-base64', FORGED_SOL]) {
      h.enterBlurred(rejected);
      expect(h.input.value).toBe(rejected);
      expect(h.document.activeElement).toBe(h.input);
      expect(h.commits).toHaveLength(0);
      expect(h.presentations).not.toHaveBeenCalled();
      expect(h.parentKeydowns).toHaveBeenCalledOnce();
    }

    h.enter('Lumen');
    expect(h.presentations).toHaveBeenCalledOnce();
    expect(h.presentations).toHaveBeenCalledWith('Lumen', h.input);
    expect(h.document.activeElement).toBe(h.continuation);

    h.setCompendium({ panelOpen: true, mode: 'list', filter: 'Lumen' });
    h.enter('   ');
    expect(h.clears).toHaveBeenCalledOnce();
    expect(h.input.value).toBe('');
    expect(h.continuationFocuses).toHaveBeenCalledTimes(2);

    h.setRouteBlocked(true);
    h.enter(GALAXY);
    expect(h.commits).toHaveLength(0);
    expect(h.input.value).toBe(GALAXY);
    expect(h.document.activeElement).toBe(h.input);

    h.setRouteBlocked(false);
    h.setCommitAccepted(false);
    h.enter(EARTH);
    await h.settle();
    expect(h.commits).toHaveLength(0);
    expect(h.input.value).toBe(EARTH);
    expect(h.document.activeElement).toBe(h.input);
    expect(h.acceptedFocuses).not.toHaveBeenCalled();
  });

  it('does not erase a newer query while an accepted route is settling', async () => {
    const h = createHarness();
    const release = h.holdCommit();
    const event = h.enter(GALAXY);
    expect(event.defaultPrevented).toBe(true);
    h.input.value = 'newer intent';
    release();
    await h.settle();
    expect(h.commits).toHaveLength(1);
    expect(h.input.value).toBe('newer intent');
    expect(h.acceptedFocuses).not.toHaveBeenCalled();
  });

  it('enforces Prime, Charter, source-proof, and mutation fences in both directions', async () => {
    const h = createHarness();
    const homeGalaxy = provenNav('galaxy');
    const earth = provenNav('surface');
    if (earth.mode !== 'surface') throw new Error('Earth fixture must be a surface');
    const fineStar = fineStarNav();
    const farGalaxy = farGalaxyNav();
    expect(navigationAuthorityFailureFor(BASE_AUTHORITY, homeGalaxy, SHIP_LIVERY_SEED)).toBeNull();
    expect(navigationAuthorityFailureFor(BASE_AUTHORITY, farGalaxy, SHIP_LIVERY_SEED)).toBe('prime-reach');
    expect(navigationAuthorityFailureFor(BASE_AUTHORITY, fineStar, SHIP_LIVERY_SEED)).toBe('charter-reach');
    const wrongHomeParent = {
      ...earth,
      gal: { ...earth.gal, x: earth.gal.x + 1 },
    } as typeof earth;
    const wrongSolParent = {
      ...earth,
      star: { ...earth.star, x: earth.star.x + 0.01 },
    } as typeof earth;
    expect(navigationAuthorityFailureFor(
      BASE_AUTHORITY, wrongHomeParent, SHIP_LIVERY_SEED,
    )).toBe('charter-reach');
    expect(navigationAuthorityFailureFor(
      BASE_AUTHORITY, wrongSolParent, SHIP_LIVERY_SEED,
    )).toBe('charter-reach');
    expect(navigationAuthorityFailureFor({
      ...BASE_AUTHORITY, items: [['array', 1]],
    }, fineStar, SHIP_LIVERY_SEED)).toBeNull();
    expect(navigationAuthorityFailureFor({
      ...BASE_AUTHORITY, items: [['array', 1]],
    }, wrongHomeParent, SHIP_LIVERY_SEED)).toBe('charter-reach');

    expect(await h.controller.jumpToProvenNav(farGalaxy)).toBe(false);
    expect(h.primeBlocks).toHaveBeenCalledOnce();
    expect(await h.controller.jumpToProvenNav(fineStar)).toBe(false);
    expect(h.charterBlocks).toHaveBeenCalledOnce();
    expect(h.commits).toHaveLength(0);

    h.setProofIdentity('null');
    expect(await h.controller.jumpToProvenNav(earth, 'Blue Home')).toBe(false);
    expect(h.commits).toHaveLength(0);
    expect(h.lastProof()).toBeNull();
    for (const [identity, mismatch] of [
      ['wrong-seed', { seed: 134, ordinal: 2 }],
      ['wrong-ordinal', { seed: 133, ordinal: 3 }],
    ] as const) {
      h.setProofIdentity(identity);
      expect(await h.controller.jumpToProvenNav(earth, 'Blue Home')).toBe(false);
      expect(h.lastProof()).toMatchObject(mismatch);
      expect(h.commits).toHaveLength(0);
    }
    h.setProofIdentity('exact');
    h.setMutationsBlocked(true);
    expect(await h.controller.jumpToProvenNav(earth, 'Blue Home')).toBe(true);
    expect(h.commits.at(-1)?.customPlanetName).toBeNull();
    expect(h.commits.at(-1)?.followedCode).toBeNull();
    h.setMutationsBlocked(false);
    expect(await h.controller.jumpToProvenNav(earth, ' Blue Home ')).toBe(true);
    expect(h.commits.at(-1)?.customPlanetName).toBe('Blue Home');
    expect(h.commits.at(-1)?.followedCode).toBeNull();
  });

  it('owns manual-copy selection, Escape focus release, and idempotent listener disposal', () => {
    const h = createHarness();
    h.controller.selectForManualCopy(EARTH);
    expect(h.input.value).toBe(EARTH);
    expect(h.document.activeElement).toBe(h.input);
    expect(h.input.selectionStart).toBe(0);
    expect(h.input.selectionEnd).toBe(EARTH.length);
    expect(h.controller.blurIfFocused()).toBe(true);
    expect(h.document.activeElement).not.toBe(h.input);
    expect(h.controller.blurIfFocused()).toBe(false);

    h.controller.dispose();
    h.controller.dispose();
    h.enter('Lumen');
    expect(h.presentations).not.toHaveBeenCalled();
    expect(h.commits).toHaveLength(0);
  });
});
