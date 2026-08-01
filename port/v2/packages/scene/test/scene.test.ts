import { describe, it, expect, beforeAll } from 'vitest';
import { NAV_HOME, enterGalaxy, enterSystem, land, ascend, navToView, homeUniverse, systemScene, HOME_GAL_SEED, SOL_SEED, type NavState } from '@cf/scene';
import { installCaptureHooks } from '@cf/domain-descriptors';

beforeAll(() => installCaptureHooks());

describe('@cf/scene — zoom-mode state machine (Gate D navigation core)', () => {
  it('the full descent and return: universe → galaxy → system → surface → back up', () => {
    const gal = { seed: 999, x: 90, y: -60 };
    const star = { seed: 424242, x: 560, y: 170 };
    const planet = { seed: 133 };
    let s: NavState = NAV_HOME;
    const g1 = enterGalaxy(s, gal); expect(g1.ok).toBe(true); s = (g1 as { ok: true; state: NavState }).state;
    const s1 = enterSystem(s, star); expect(s1.ok).toBe(true); s = (s1 as { ok: true; state: NavState }).state;
    const l1 = land(s, planet); expect(l1.ok).toBe(true); s = (l1 as { ok: true; state: NavState }).state;
    expect(s.mode).toBe('surface');
    /* the return ladder clears context as it goes — a stale star/planet can
       never leak into the next descent (the st.star-null crash class) */
    s = (ascend(s) as { ok: true; state: NavState }).state;
    expect(s.mode).toBe('system'); expect(s.planet).toBeNull();
    s = (ascend(s) as { ok: true; state: NavState }).state;
    expect(s.mode).toBe('galaxy'); expect(s.star).toBeNull();
    s = (ascend(s) as { ok: true; state: NavState }).state;
    expect(s.mode).toBe('universe'); expect(s.gal).toBeNull();
    expect(ascend(s).ok).toBe(false);
  });
  it('illegal jumps are rejected, not absorbed', () => {
    expect(enterSystem(NAV_HOME, { seed: 1, x: 0, y: 0 }).ok).toBe(false);
    expect(land(NAV_HOME, { seed: 1 }).ok).toBe(false);
    expect(enterGalaxy(NAV_HOME, { seed: NaN, x: 0, y: 0 }).ok).toBe(false);
  });
  it('navToView emits the save-view shape (the _sanitizeView contract)', () => {
    const gal = { seed: 999, x: 90, y: -60, size: 14.5, sp: 4, tilt: 0.62, rot: 1.13, home: true };
    let s = (enterGalaxy(NAV_HOME, gal) as { ok: true; state: NavState }).state;
    s = (enterSystem(s, { seed: 424242, x: 560, y: 170 }) as { ok: true; state: NavState }).state;
    s = (land(s, { seed: 133 }) as { ok: true; state: NavState }).state;
    const v = navToView(s)!;
    expect(v.type).toBe('planet');
    expect((v.gal as { seed: number }).seed).toBe(999);
    expect((v.star as { seed: number }).seed).toBe(424242);
    expect(v.pseed).toBe(133);
  });
});

describe('@cf/scene — universe composition from the ported domain', () => {
  it('★ the home view contains the home galaxy (seed 999) — the anchor the whole slice descends from', () => {
    const nodes = homeUniverse(2);
    expect(nodes.length).toBeGreaterThan(0);
    const home = nodes.find((n) => n.seed === HOME_GAL_SEED);
    expect(home, 'home galaxy missing from its own cells').toBeDefined();
    expect(home!.home).toBe(true);
  });
  it('composition is deterministic (two calls, identical nodes)', () => {
    expect(JSON.stringify(homeUniverse(1))).toBe(JSON.stringify(homeUniverse(1)));
  });
});

describe('@cf/scene — system composition (the Gate D descent target)', () => {
  it('★ Sol: eight planets Mercury→Neptune in orbit order, Earth seed 133, gas giants ringed/mooned', () => {
    const s = systemScene(SOL_SEED);
    expect(s.sol).toBe(true);
    expect(s.planets.map((p) => p.name)).toEqual(['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']);
    const earth = s.planets[2]!;
    expect(earth.seed).toBe(133);
    expect(earth.type).toBe('terran');
    expect(s.planets[5]!.ring, 'Saturn wears its ring').toBe(true);
    /* orbit order is the render ladder — strictly increasing */
    for (let i = 1; i < s.planets.length; i++) expect(s.planets[i]!.orb).toBeGreaterThan(s.planets[i - 1]!.orb);
  });
  it('a procedural system is deterministic and orbit-sorted', () => {
    const a = systemScene(31337), b = systemScene(31337);
    expect(JSON.stringify(a.planets.map((p) => [p.seed, p.orb]))).toBe(JSON.stringify(b.planets.map((p) => [p.seed, p.orb])));
    for (let i = 1; i < a.planets.length; i++) expect(a.planets[i]!.orb).toBeGreaterThanOrEqual(a.planets[i - 1]!.orb);
  });
  it('the P objects are the MEMOIZED originals — composition must not clone or mutate them (the systemSol lesson)', () => {
    const s1 = systemScene(1);
    const s2 = systemScene(1);
    for (let i = 0; i < s1.planets.length; i++) expect(s1.planets[i]!.P).toBe(s2.planets[i]!.P);
  });
});
