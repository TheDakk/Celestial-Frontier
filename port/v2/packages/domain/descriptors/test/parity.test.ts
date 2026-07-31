import { describe, it, expect, beforeAll } from 'vitest';
import { loadFixture, checkGenerator, canon } from '../../../../tests/parity.js';
import { probeRaw } from '../../../../tests/baseline.js';
import {
  installCaptureHooks, roman, starDescriptor, planetDescriptor, moonDescriptor,
  galaxyDescriptor, wormholeDescriptor, cmbDescriptor, oortDescriptor,
  kuiperDescriptor, visitorDescriptor, beltDescriptor,
} from '@cf/domain-descriptors';
import { systemFor, galaxiesInCell } from '@cf/domain-worldgen';
import { GAL_KIND } from '../src/apphooks.verbatim.js';

beforeAll(() => installCaptureHooks());
const fx = loadFixture();

type Pl = { P: Record<string, unknown> & { seed: number }; orb?: number; moons?: unknown[]; name?: string };
const planets = (sys: ReturnType<typeof systemFor>): Pl[] => ((sys.planets || []) as Pl[]);

describe('@cf/domain-descriptors — golden ×2,000 (heavy tier)', () => {
  it('planetDescriptor: 1,000 systems (this also finally VALUE-pins Ecology + SurveyPhrases text paths)', () => {
    const r = checkGenerator(fx, 'planetDescriptor', (s) => {
      const sys = systemFor(s); const pl = planets(sys)[0];
      if (!pl) return 'no-planet';
      return planetDescriptor(pl.P, sys, pl);
    });
    expect(r.mismatches, r.mismatches.map((m) => `seed[${m.i}]=${m.seed}`).join(', ')).toEqual([]);
    expect(r.rollupOk).toBe(true);
    expect(r.cases).toBe(1000);
  });
  it('starDescriptor: 1,000 seeds', () => {
    const r = checkGenerator(fx, 'starDescriptor', (s) => starDescriptor(s));
    expect(r.mismatches).toEqual([]); expect(r.rollupOk).toBe(true);
  });
});

describe('baseline probes (recipes mirror tools/probe.js exactly)', () => {
  const SEEDS = [133, 1, 2, 3, 42, 1000, 31337, 99999, 123456, 7777777];
  it('roman probe', () => {
    expect(canon([roman(1), roman(4), roman(9), roman(14), roman(16)])).toBe(probeRaw('roman'));
  });
  it('starDescriptor probe (10 seeds incl. Sol)', () => {
    expect(canon(SEEDS.map((s) => starDescriptor(s)))).toBe(probeRaw('starDescriptor'));
  });
  it('planetDescriptor probe — Sol first 4 planets INCLUDING EARTH (exercises the cradle roster), then 1 and 31337', () => {
    const out: unknown[] = [];
    for (const ss of [424242, 1, 31337]) {
      const sys = systemFor(ss);
      for (const pl of planets(sys).slice(0, 4)) out.push(planetDescriptor(pl.P, sys, pl));
    }
    expect(canon(out)).toBe(probeRaw('planetDescriptor'));
  });
  it('★ systemSol REPLAY — the probe deferred since module 6 closes here', () => {
    /* The stored systemSol encodes PROBE-ORDER MUTATION: descriptor drawing
       caches _pal = gasPalette(P) onto the memoized gas giants before the
       capture serialized the system. Replay the same order — planetDescriptor
       over Sol (idempotent if the previous test already ran) — THEN compare.
       This is the port lesson made executable: memoized generators turn call
       order into observable state. */
    const sys = systemFor(424242);
    for (const pl of planets(sys).slice(0, 4)) planetDescriptor(pl.P, sys, pl);
    /* the probe recipe touches planets 0–3; gas giants sit further out, so
       ALSO replay the remaining planets exactly as the game's boot render
       did — planetThumb is what draws them in the capture environment */
    for (const pl of planets(sys)) planetDescriptor(pl.P, sys, pl);
    expect(canon(systemFor(424242))).toBe(probeRaw('systemSol'));
  });
  it('moonDescriptor probe (vacuous by capture — Sol planets carry no moons at this call shape)', () => {
    const sys = systemFor(424242);
    const out: unknown[] = [];
    for (const pl of planets(sys)) for (const m of ((pl.moons || []) as unknown[]).slice(0, 2)) out.push(moonDescriptor(pl as never, m as never));
    expect(canon(out)).toBe(probeRaw('moonDescriptor'));
  });
  it('galaxyDescriptor probe (vacuous by capture — cell (0,0) holds no galaxies)', () => {
    expect(canon(galaxiesInCell(0, 0).slice(0, 3).map((g) => galaxyDescriptor(g as never)))).toBe(probeRaw('galaxyDescriptor'));
  });
  it('miscDescriptors probe (wormhole, CMB, oort, kuiper, visitor, belt)', () => {
    expect(canon([wormholeDescriptor(), cmbDescriptor(), oortDescriptor(31337),
      kuiperDescriptor(systemFor(31337) as never, 31337), visitorDescriptor(31337),
      beltDescriptor(systemFor(424242) as never, 424242)])).toBe(probeRaw('miscDescriptors'));
  });
});

describe('real-input coverage for the two vacuous probes (no recorded truth — structural)', () => {
  it('galaxyDescriptor on real galaxies: rows, GAL_KIND label, designation present', () => {
    /* find a populated cell; the home cell region is guaranteed non-empty */
    let gals: unknown[] = [];
    outer: for (let x = -6; x <= 6; x++) for (let y = -6; y <= 6; y++) {
      gals = galaxiesInCell(x, y) || [];
      if (gals.length) break outer;
    }
    expect(gals.length).toBeGreaterThan(0);
    const d = galaxyDescriptor(gals[0] as never);
    expect(typeof d.title).toBe('string');
    expect(Array.isArray(d.rows)).toBe(true);
    expect(d.rows.length).toBeGreaterThan(3);
    expect(GAL_KIND.length).toBe(16);
  });
});
