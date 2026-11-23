import { describe, expect, it } from 'vitest';
import { NAV_HOME, navToView } from '@cf/scene';
import { createNavController } from '../src/nav';
import { classifyRouteRepair, routeFingerprint } from '../src/nav/route';
import { HOME, NEW_GAME, SOL, ownerOf, portsFor } from './nav-support';
import reach from '../../../fixtures/current/reach.json' with { type: 'json' };

const KAUM = reach.cases.find((c) => c.label.endsWith(": Kaum's star"))!.target.star!;
/** A route as storage hands it back. */
const stored = (view: unknown): unknown => JSON.parse(JSON.stringify(view));

const GALAXY = { x: 90, y: -60, size: 86, sp: 12, tilt: 0.4, rot: 0.8, seed: 999, home: false, quasar: false, dwarf: false };
const STORED_GALAXY = { seed: 999, rot: 0.8, tilt: 0.4, sp: 12, size: 86, y: -60, x: 90 };
const STAR = { x: 560, y: 170, seed: 424242 };
const SYSTEM = { type: 'star', gal: GALAXY, star: STAR };
const STORED_SYSTEM = { star: STAR, gal: STORED_GALAXY, type: 'star' };

describe('route repair intent', () => {
  it('treats spelled-out false galaxy flags and their omission as the same route', () => {
    expect(routeFingerprint(SYSTEM)).toBe(routeFingerprint(STORED_SYSTEM));
    expect(classifyRouteRepair({ before: STORED_SYSTEM, after: SYSTEM, savedRouteWriteHeld: false }))
      .toEqual({ changed: false, pending: false });
  });

  it('tells different routes apart, and a true flag from a missing one', () => {
    expect(classifyRouteRepair({ before: null, after: SYSTEM, savedRouteWriteHeld: false })).toEqual({ changed: true, pending: true });
    expect(routeFingerprint(SYSTEM)).not.toBe(routeFingerprint({ ...SYSTEM, star: { ...STAR, seed: 1 } }));
    expect(routeFingerprint({ ...SYSTEM, gal: { ...GALAXY, home: true } })).not.toBe(routeFingerprint(STORED_SYSTEM));
  });

  it('a held route is never pending', () => {
    expect(classifyRouteRepair({ before: null, after: SYSTEM, savedRouteWriteHeld: true })).toEqual({ changed: true, pending: false });
    expect(classifyRouteRepair({ before: SYSTEM, after: SYSTEM, savedRouteWriteHeld: true })).toEqual({ changed: false, pending: false });
  });
});

describe('the saved route at boot', () => {
  it('a saved route restores to the same place after a reboot', () => {
    for (const place of ['universe', 'galaxy', 'system'] as const) {
      const first = createNavController(portsFor(NEW_GAME).ports);
      if (place !== 'universe') first.enterGalaxy(HOME);
      if (place === 'system') first.enterSystem(SOL);
      const h = portsFor(NEW_GAME);
      const second = createNavController(h.ports);
      expect(second.restore(stored(first.route()))).toEqual({ ok: true, nav: second.nav });
      expect(second.nav.mode, place).toBe(place);
      expect(navToView(second.nav), place).toEqual(navToView(first.nav));
      expect(second.route(), place).toEqual(first.route());
      expect([h.saves, h.changed.length, h.refused.length], place).toEqual([0, 0, 0]);
    }
  });

  it('a saved route that cannot be proven falls back to the universe and is repaired once, not on every boot', () => {
    const noSuchStar = { type: 'star', gal: GALAXY, star: { x: 1, y: 2, seed: 3 } };
    for (const broken of [noSuchStar, { type: 'moon' }, 'CF1-', 7]) {
      const h = portsFor(NEW_GAME);
      const nav = createNavController(h.ports);
      nav.restore(stored(broken));
      expect(nav.nav).toBe(NAV_HOME);
      expect(nav.route()).toEqual(navToView(NAV_HOME));
      expect(h.saves).toBe(1);

      const again = portsFor(NEW_GAME);
      const rebooted = createNavController(again.ports);
      rebooted.restore(stored(nav.route()));
      expect(rebooted.nav).toBe(NAV_HOME);
      expect(again.saves).toBe(0);
    }
  });

  it('a saved route the save may no longer travel to falls back to the universe', () => {
    const scout = createNavController(portsFor(ownerOf('igdrive')).ports);
    scout.enterGalaxy(HOME);
    scout.enterSystem(KAUM);
    const kept = createNavController(portsFor(ownerOf('igdrive')).ports);
    kept.restore(stored(scout.route()));
    expect(kept.route()).toEqual(scout.route());

    const h = portsFor(NEW_GAME);
    const nav = createNavController(h.ports);
    nav.restore(stored(scout.route()));
    expect(nav.nav).toBe(NAV_HOME);
    expect(h.saves).toBe(1);
  });

  it('a saved world route seats its system and leaves the stored route alone', () => {
    const scout = createNavController(portsFor(NEW_GAME).ports);
    scout.enterGalaxy(HOME);
    scout.enterSystem(SOL);
    const h = portsFor(NEW_GAME);
    const nav = createNavController(h.ports);
    nav.restore({ ...(stored(scout.route()) as object), type: 'planet', pseed: 133 });
    expect(navToView(nav.nav)).toEqual(scout.route());
    expect(h.saves).toBe(0);
  });

  it('a new expedition is seated in Sol by the route it is first stored with', () => {
    const h = portsFor(NEW_GAME);
    const nav = createNavController(h.ports);
    nav.restore(stored(nav.solRoute()));
    expect(nav.route()).toMatchObject({ type: 'star', star: SOL });
    expect([nav.nav.mode, h.saves]).toEqual(['system', 0]);
  });

  it('an empty saved route is the universe', () => {
    const h = portsFor(NEW_GAME);
    const nav = createNavController(h.ports);
    nav.restore(undefined);
    expect(nav.nav).toBe(NAV_HOME);
    expect(h.saves).toBe(0);
  });
});
