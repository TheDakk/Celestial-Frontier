import { describe, expect, it } from 'vitest';
import { NAV_HOME, navToView } from '@cf/scene';
import { encodeWhere } from '@cf/domain-strays';
import { createNavController, type NavController, type NavOutcome } from '../src/nav';
import { navigationAuthorityFailureFor } from '../src/nav/search-travel';
import { mapNavOf, provenNavForCode } from '../src/nav/search-travel';
import { HOME, NEW_GAME, SOL, ownerOf, portsFor } from './nav-support';
import reach from '../../../fixtures/current/reach.json' with { type: 'json' };

type Place = { seed: number; x: number; y: number };
type Target = { mode: string; galaxy: Place; star: Place | null };
const cases = reach.cases as { label: string; save: typeof NEW_GAME; target: Target; expected: string | null }[];
const targetNamed = (name: string): Target => cases.find((c) => c.label.endsWith(`: ${name}`))!.target;

/** Travels from the universe to the target the way a player does: into the galaxy, then into the star. */
function driveTo(nav: NavController, target: Target): NavOutcome {
  const galaxy = nav.enterGalaxy(target.galaxy);
  return galaxy.ok && target.star !== null ? nav.enterSystem(target.star) : galaxy;
}
const codeFor = (nav: NavController): string => encodeWhere(navToView(nav.nav) as never) as string;

describe('the travel gate', () => {
  it.each(cases)('reach case $label answers $expected', (c) => {
    const nav = createNavController(portsFor(c.save).ports);
    const outcome = driveTo(nav, c.target);
    expect(outcome.ok ? null : outcome.reason).toBe(c.expected);
    expect(nav.nav.mode).toBe(c.expected === null ? c.target.mode : c.expected === 'charter-reach' ? 'galaxy' : 'universe');
  });

  it('a new game can enter Sol and no other star', () => {
    const stars = [...new Map(cases.filter((c) => c.target.star !== null).map((c) => [JSON.stringify(c.target), c.target])).values()];
    expect(stars.length).toBe(6);
    const entered = stars.filter((target) => driveTo(createNavController(portsFor(NEW_GAME).ports), target).ok);
    expect(entered.map((target) => target.star)).toEqual([SOL]);
  });

  it('the universe is never refused', () => {
    expect(navigationAuthorityFailureFor(NEW_GAME, NAV_HOME, 0)).toBeNull();
  });
});

describe('a pasted world code', () => {
  const far = targetNamed('the star just outside the Jump Drive ring');

  it('inside reach travels there; outside reach it is refused', () => {
    const scout = createNavController(portsFor(ownerOf('igdrive')).ports);
    expect(driveTo(scout, far).ok).toBe(true);
    const code = codeFor(scout);

    const allowed = portsFor(ownerOf('jumpdrive', 'array'));
    const there = createNavController(allowed.ports);
    expect(there.travelToCode(`  ${code} `).ok).toBe(true);
    expect(navToView(there.nav)).toEqual(navToView(scout.nav));
    expect(allowed.changed.map((e) => [e.from, e.to])).toEqual([['universe', 'system']]);
    expect(allowed.saves).toBe(1);

    const refused = portsFor(ownerOf('jumpdrive'));
    const here = createNavController(refused.ports);
    expect(here.travelToCode(code)).toMatchObject({ ok: false, reason: 'charter-reach' });
    expect(here.nav).toBe(NAV_HOME);
    expect(refused.saves).toBe(0);
  });

  it('for a galaxy enters the galaxy', () => {
    const scout = createNavController(portsFor(NEW_GAME).ports);
    scout.enterGalaxy(HOME);
    const nav = createNavController(portsFor(NEW_GAME).ports);
    expect(nav.travelToCode(codeFor(scout)).ok).toBe(true);
    expect(nav.nav.mode).toBe('galaxy');
  });

  it('for a world arrives at its system', () => {
    const scout = createNavController(portsFor(NEW_GAME).ports);
    driveTo(scout, targetNamed('Sol'));
    const worldCode = encodeWhere({ ...navToView(scout.nav), type: 'planet', pseed: 133 } as never) as string;
    const target = provenNavForCode(worldCode);
    expect(target?.mode).toBe('surface');
    expect(mapNavOf(target!)?.mode).toBe('system');
    const nav = createNavController(portsFor(NEW_GAME).ports);
    expect(nav.travelToCode(worldCode).ok).toBe(true);
    expect(navToView(nav.nav)).toEqual(navToView(scout.nav));
  });

  it('that is not a code, is malformed or names no real place is refused as not proven', () => {
    const scout = createNavController(portsFor(NEW_GAME).ports);
    driveTo(scout, targetNamed('Sol'));
    const noSuchStar = encodeWhere({ ...navToView(scout.nav), star: { x: 1, y: 2, seed: 3 } } as never) as string;
    for (const text of ['Earth', 'CF1-!!!', 'CF1-e30', noSuchStar]) {
      const h = portsFor(ownerOf('igdrive'));
      const nav = createNavController(h.ports);
      expect(nav.travelToCode(text), text).toEqual({ ok: false, reason: 'not-proven', hint: '' });
      expect(nav.nav, text).toBe(NAV_HOME);
      expect(h.refused, text).toEqual([{ reason: 'not-proven', hint: '' }]);
    }
  });
});
