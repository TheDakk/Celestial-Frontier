/* Where the player is. Every move goes through the scene package's state machine with places proven from
   the game's own sources, and through the travel gate of the save. */
import {
  NAV_HOME,
  ascHintFor,
  ascend,
  enterGalaxy,
  enterSystem,
  navFromCanonicalCF1Address,
  navToView,
  primeReachHint,
  resolveCF1Galaxy,
  resolveCF1Star,
  resolveCF1StarAddress,
  type NavState,
} from '@cf/scene';
import { HOME_GAL_SEED, HOME_POS, SOL_POS, SOL_SEED } from '@cf/domain-worldconfig';
import type { Bus } from '../bus';
import type { GameEvents } from '../events';
import { restoreRoute } from './route';
import {
  chassisStageFor,
  mapNavOf,
  navigationAuthorityFailureFor,
  provenNavForCode,
  type NavAuthoritySave,
} from './search-travel';

export type NavRefusal = 'prime-reach' | 'charter-reach' | 'not-proven';
export type NavOutcome = { ok: true; nav: NavState } | { ok: false; reason: NavRefusal; hint: string };

export interface NavController {
  readonly nav: NavState;
  enterGalaxy(candidate: { seed: number; x: number; y: number }): NavOutcome;
  enterSystem(candidate: { seed: number; x: number; y: number }): NavOutcome;
  ascend(): NavOutcome;
  travelToCode(code: string): NavOutcome;
  /** At boot: the saved route, or the universe when it cannot be proven. A route that had to change is stored
   *  once. A new expedition is seated in Sol by its first stored route (`solRoute`). */
  restore(savedView: unknown): NavOutcome;
  /** The route to store: where the player is, or the stored bytes while a failed proof holds them. */
  route(): Record<string, unknown> | null;
  solRoute(): Record<string, unknown> | null;
}

export interface NavPorts {
  authority(): NavAuthoritySave;
  liverySeed(): number;
  bus: Bus<GameEvents>;
  requestSave(): void;
}

/** The Sol system, proven from the sources; null only when they fail. */
function solSystemNav(): Extract<NavState, { mode: 'system' }> | null {
  const address = resolveCF1StarAddress({
    galaxy: { seed: HOME_GAL_SEED, x: HOME_POS.x, y: HOME_POS.y },
    star: { seed: SOL_SEED, x: SOL_POS.x, y: SOL_POS.y },
  });
  if (!address.ok) return null;
  const resolved = navFromCanonicalCF1Address(address.address);
  return resolved.ok && resolved.state.mode === 'system' ? resolved.state : null;
}

export function createNavController(ports: NavPorts): NavController {
  let nav: NavState = NAV_HOME;
  let held: { view: Record<string, unknown> | null } | null = null;

  const failureFor = (target: NavState) => navigationAuthorityFailureFor(ports.authority(), target, ports.liverySeed());

  const refuse = (reason: NavRefusal): NavOutcome => {
    /* The game says nothing when a place is not a real one, so that refusal carries no words. */
    const hint = reason === 'prime-reach' ? primeReachHint()
      : reason === 'charter-reach' ? ascHintFor(chassisStageFor(ports.authority(), ports.liverySeed()))
        : '';
    ports.bus.emit('nav:refused', { reason, hint });
    return { ok: false, reason, hint };
  };

  const accept = (next: NavState): NavOutcome => {
    const from = nav.mode;
    nav = next;
    held = null;
    ports.bus.emit('nav:changed', { from, to: next.mode, nav: next });
    ports.requestSave();
    return { ok: true, nav: next };
  };

  /** Refuses a proven place the save may not go to; accepts it otherwise. */
  const gate = (target: NavState, shown: NavState = target): NavOutcome => {
    const failure = failureFor(target);
    return failure === null ? accept(shown) : refuse(failure);
  };

  return {
    get nav() { return nav; },
    enterGalaxy(candidate) {
      const proven = resolveCF1Galaxy(candidate);
      if (!proven.ok) return refuse('not-proven');
      const entered = enterGalaxy(nav, proven.galaxy);
      return entered.ok ? gate(entered.state) : refuse('not-proven');
    },
    enterSystem(candidate) {
      if (nav.mode !== 'galaxy') return refuse('not-proven');
      const proven = resolveCF1Star(nav.gal, candidate);
      if (!proven.ok) return refuse('not-proven');
      const entered = enterSystem(nav, proven.star);
      return entered.ok ? gate(entered.state) : refuse('not-proven');
    },
    ascend() {
      const lifted = ascend(nav);
      return lifted.ok ? accept(lifted.state) : refuse('not-proven');
    },
    travelToCode(code) {
      const target = provenNavForCode(code);
      const shown = target === null ? null : mapNavOf(target);
      return target === null || shown === null ? refuse('not-proven') : gate(target, shown);
    },
    restore(savedView) {
      // A route that cannot be proven, or that the save may no longer travel, falls back to the universe.
      const restored = restoreRoute(savedView, (target) => failureFor(target) === null, NAV_HOME);
      const shown = restored.nav.mode === 'universe' ? restored.nav : mapNavOf(restored.nav) ?? NAV_HOME;
      nav = shown;
      held = restored.writeHeld ? { view: (savedView ?? null) as Record<string, unknown> | null } : null;
      if (restored.repair.pending) ports.requestSave();
      return { ok: true, nav };
    },
    route() {
      return held === null ? navToView(nav) : held.view;
    },
    solRoute() {
      const sol = solSystemNav();
      return sol === null ? null : navToView(sol);
    },
  };
}
