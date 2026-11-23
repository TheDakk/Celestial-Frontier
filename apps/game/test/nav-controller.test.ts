import { describe, expect, it } from 'vitest';
import { NAV_HOME, ascHintFor, getProvenGalaxyKey, getProvenStarKey, primeReachHint } from '@cf/scene';
import { createNavController } from '../src/nav';
import { HOME, NEW_GAME, SOL, ownerOf, portsFor } from './nav-support';
import reach from '../../../fixtures/current/reach.json' with { type: 'json' };

const targetNamed = (name: string) => reach.cases.find((c) => c.label.endsWith(`: ${name}`))!.target;
const KAUM = targetNamed("Kaum's star").star!;
const OUTSIDE = targetNamed('the galaxy just outside the Solar Reach').galaxy;

describe('the nav controller', () => {
  it('starts at the universe', () => {
    expect(createNavController(portsFor(NEW_GAME).ports).nav).toBe(NAV_HOME);
  });

  it('an accepted move goes through the proven place, emits nav:changed once and requests one save', () => {
    const h = portsFor(NEW_GAME);
    const nav = createNavController(h.ports);
    const galaxy = nav.enterGalaxy(HOME);
    expect(galaxy.ok && galaxy.nav).toBe(nav.nav);
    expect(nav.nav.mode === 'galaxy' && getProvenGalaxyKey(nav.nav.gal)).toBeTruthy();
    expect([h.changed.length, h.saves]).toEqual([1, 1]);
    expect(h.changed[0]).toEqual({ from: 'universe', to: 'galaxy', nav: nav.nav });

    expect(nav.enterSystem(SOL).ok).toBe(true);
    expect(nav.nav.mode === 'system' && getProvenStarKey(nav.nav.star)).toBeTruthy();
    expect([h.changed.length, h.saves]).toEqual([2, 2]);
    expect(h.changed[1]).toEqual({ from: 'galaxy', to: 'system', nav: nav.nav });
    expect(h.refused).toEqual([]);
  });

  it("a refusal leaves the nav unchanged, emits nav:refused with the game's hint and requests no save", () => {
    const h = portsFor(ownerOf('jumpdrive'));
    const nav = createNavController(h.ports);
    expect(nav.enterGalaxy(OUTSIDE)).toEqual({ ok: false, reason: 'prime-reach', hint: primeReachHint() });
    expect(nav.nav).toBe(NAV_HOME);

    nav.enterGalaxy(HOME);
    const before = nav.nav;
    expect(nav.enterSystem(KAUM)).toEqual({ ok: false, reason: 'charter-reach', hint: ascHintFor(1) });
    expect(nav.nav).toBe(before);
    expect(h.refused).toEqual([
      { reason: 'prime-reach', hint: primeReachHint() },
      { reason: 'charter-reach', hint: ascHintFor(1) },
    ]);
    expect([h.changed.length, h.saves]).toEqual([1, 1]);
    expect(ascHintFor(1)).not.toBe(ascHintFor(0));
  });

  it('a place that is not a real one, or a move the map does not allow, is refused as not proven', () => {
    const h = portsFor(ownerOf('igdrive'));
    const nav = createNavController(h.ports);
    expect(nav.enterGalaxy({ ...HOME, x: HOME.x + 1 })).toEqual({ ok: false, reason: 'not-proven', hint: '' });
    expect(nav.enterSystem(SOL)).toMatchObject({ ok: false, reason: 'not-proven' });
    nav.enterGalaxy(HOME);
    expect(nav.enterGalaxy(HOME)).toMatchObject({ ok: false, reason: 'not-proven' });
    expect(nav.enterSystem({ ...SOL, seed: 5 })).toMatchObject({ ok: false, reason: 'not-proven' });
    expect(nav.nav.mode).toBe('galaxy');
    expect([h.changed.length, h.saves, h.refused.length]).toEqual([1, 1, 4]);
  });

  it('ascend goes system to galaxy to universe and refuses at the universe', () => {
    const h = portsFor(NEW_GAME);
    const nav = createNavController(h.ports);
    nav.enterGalaxy(HOME);
    const galaxy = nav.nav;
    nav.enterSystem(SOL);
    expect(nav.ascend().ok).toBe(true);
    expect(nav.nav.mode === 'galaxy' && nav.nav.gal).toBe(galaxy.gal);
    expect(nav.ascend().ok).toBe(true);
    expect(nav.nav).toBe(NAV_HOME);
    expect([h.changed.length, h.saves]).toEqual([4, 4]);
    expect(nav.ascend()).toEqual({ ok: false, reason: 'not-proven', hint: '' });
    expect(nav.nav).toBe(NAV_HOME);
    expect([h.changed.length, h.saves]).toEqual([4, 4]);
    expect(h.changed.slice(2).map((e) => [e.from, e.to])).toEqual([['system', 'galaxy'], ['galaxy', 'universe']]);
  });
});
