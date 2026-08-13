import { describe, it, expect } from 'vitest';
import { loadFixture, checkGenerator, canon } from '../../../../tests/parity.js';
import { probeRaw } from '../../../../tests/baseline.js';
import { galaxiesInCell, galaxyProfile, galaxyWormhole, starsInCell, fineStarsInCell, systemFor, supernovaSites } from '@cf/domain-worldgen';
import { slimGal } from '@cf/domain-descriptors';

describe('@cf/domain-worldgen — golden ×1,000 + seven baseline probes', () => {
  it('systemFor: 1,000 golden seeds (heavy tier), per-seed + rollup', () => {
    const r = checkGenerator(loadFixture(), 'systemFor', (s) => {
      const sys = systemFor(s);
      return { n: (sys.planets || []).length, p: (sys.planets || []).slice(0, 3).map((q) => q.P) };
    });
    expect(r.mismatches, r.mismatches.map((m) => `seed[${m.i}]=${m.seed}`).join(', ')).toEqual([]);
    expect(r.rollupOk).toBe(true);
    expect(r.cases).toBe(1000);
  });
  it('galaxiesInCell + slimGal probe', () => {
    expect(canon([galaxiesInCell(0, 0), galaxiesInCell(1, -2), galaxiesInCell(-3, 5)]
      .map((arr) => (arr || []).map((g) => slimGal(g))))).toBe(probeRaw('galaxiesInCell'));
  });
  it('galaxyProfile probe', () => {
    expect(canon([999, 31337, 12].map((s) => galaxyProfile(s)))).toBe(probeRaw('galaxyProfile'));
  });
  it('galaxyWormhole probe', () => {
    expect(canon([999, 31337, 12].map((s) => galaxyWormhole(s)))).toBe(probeRaw('galaxyWormhole'));
  });
  it('starsInCell probe (home galaxy, two cells)', () => {
    const prof = galaxyProfile(999);
    const cells = [starsInCell(999, prof, 0, 0), starsInCell(999, prof, 2, -1)];
    expect(canon(cells)).toBe(probeRaw('starsInCell'));
    for (const cell of cells) {
      expect(Array.isArray(cell.stars)).toBe(true);
      expect(Array.isArray(cell.deco)).toBe(true);
    }
  });
  it('fineStarsInCell probe', () => {
    const prof = galaxyProfile(999);
    expect(canon(fineStarsInCell(999, prof, 1, 1))).toBe(probeRaw('fineStarsInCell'));
  });
  /* ⚠ DEFERRED TO THE DESCRIPTORS MODULE, with the reason on record:
     the stored systemSol value contains _pal palettes on the gas giants that
     systemFor NEVER WRITES. systemFor is memoized; probe.js runs the
     planetDescriptor probes FIRST, and those cache _pal onto the shared P
     objects. The fingerprint therefore encodes PROBE-ORDER MUTATION STATE,
     and byte-parity requires replaying that order — possible only once
     planetDescriptor is ported. The golden systemFor x1,000 (captured with NO
     prior descriptor calls) passes above, which is what proves systemFor
     itself. Re-enable in the Descriptors test with the replay.
     ★ CLOSED 2026-07-31: the replay lives in descriptors/test/parity.test.ts
     ("systemSol REPLAY") and passes byte-for-byte. This skip stays as the
     record of WHY it cannot pass here: this file must keep proving systemFor
     with NO prior descriptor calls — the exact state the golden x1,000 was
     captured in. */
  it.skip('systemSol — byte-for-byte (passes ONLY after descriptor replay; closed in descriptors/test)', () => {
    expect(canon(systemFor(424242))).toBe(probeRaw('systemSol'));
  });
  it('systemOther probe', () => {
    expect(canon([systemFor(1), systemFor(31337)])).toBe(probeRaw('systemOther'));
  });
  it('supernovaSites probe', () => {
    expect(canon(supernovaSites(999, 3))).toBe(probeRaw('supernovaSites'));
  });
  it('★ galaxiesInCell on a POPULATED cell (found 2026-07-31: all three probed cells are EMPTY, so the probe was green while GAL_SPRITES — a free identifier — threw on every real cell)', async () => {
    const { installCaptureHooks } = await import('@cf/domain-descriptors');
    installCaptureHooks();
    let found: unknown[] = [];
    outer: for (let x = -6; x <= 6; x++) for (let y = -6; y <= 6; y++) {
      const gals = galaxiesInCell(x, y) || [];
      if (gals.length) { found = gals; break outer; }
    }
    expect(found.length, 'no populated cell in a 13×13 sweep — generation broken?').toBeGreaterThan(0);
    const g = found[0] as Record<string, unknown>;
    for (const k of ['x', 'y', 'size', 'sp', 'tilt', 'rot', 'seed']) expect(g[k], k).toBeDefined();
  });
});
