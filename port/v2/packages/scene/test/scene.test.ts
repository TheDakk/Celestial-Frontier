import { describe, it, expect, beforeAll } from 'vitest';
import { NAV_HOME, enterGalaxy, enterSystem, land, ascend, navToView, homeUniverse, HOME_GAL_SEED, type NavState } from '@cf/scene';
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
