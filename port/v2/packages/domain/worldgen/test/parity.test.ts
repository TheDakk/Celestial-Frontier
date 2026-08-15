import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { loadFixture, checkGenerator, canon } from '../../../../tests/parity.js';
import { probeRaw } from '../../../../tests/baseline.js';
import { galaxiesInCell, galaxyProfile, galaxyWormhole, starsInCell, fineStarsInCell, systemFor, supernovaSites } from '@cf/domain-worldgen';
import { slimGal } from '@cf/domain-descriptors';

const declarationSource = readFileSync(
  new URL('../src/worldgen.verbatim.d.ts', import.meta.url),
  'utf8',
);

const CAPTURE_HOOK_KEYS = [
  '_cardFactsSet', '_earthNamePass', 'GAL_KIND',
  'planetThumb', 'starThumb', 'galaxyThumb', 'moonThumb', 'cometThumb', 'beltThumb',
  'GAL_SPRITES',
] as const;

function hasTruthfulSupernovaDeclaration(source: string): boolean {
  return /supernovaSites\(\s*galaxySeed:\s*number,\s*epoch:\s*number\s*\):\s*SupernovaSite\[\]\s*;/.test(source)
    && !/supernovaSites\([^)]*\bn\s*:\s*number/.test(source);
}

function cellWebContract(value: unknown): { ok: boolean; diagnostic: string } {
  if (!Array.isArray(value)) return { ok: false, diagnostic: 'not an array' };
  if (!Object.hasOwn(value, 'web')) return { ok: false, diagnostic: 'missing own web metadata' };
  const web = (value as unknown as { web: unknown }).web;
  if (typeof web !== 'number' || !Number.isFinite(web)) return { ok: false, diagnostic: 'web is not finite' };
  if (web < 0 || web > 1) return { ok: false, diagnostic: 'web is outside [0,1]' };
  return { ok: true, diagnostic: '' };
}

function supernovaContract(value: unknown): { ok: boolean; diagnostic: string } {
  if (!Array.isArray(value) || value.length < 1 || value.length > 3) {
    return { ok: false, diagnostic: 'site count is outside 1-3' };
  }
  for (const site of value as Array<Record<string, unknown>>) {
    if (!Number.isFinite(site.x) || !Number.isFinite(site.y)) return { ok: false, diagnostic: 'site coordinates are invalid' };
    if (!Number.isInteger(site.seed) || (site.seed as number) < 0 || (site.seed as number) > 0xffffffff) {
      return { ok: false, diagnostic: 'site seed is not uint32' };
    }
    if (typeof site.remnant !== 'string' || !['NS', 'shell', 'BH'].includes(site.remnant)) {
      return { ok: false, diagnostic: 'unknown remnant' };
    }
    if (!Array.isArray(site.births) || site.births.length < 1 || site.births.length > 3) {
      return { ok: false, diagnostic: 'birth count is outside 1-3' };
    }
    for (const birth of site.births as Array<Record<string, unknown>>) {
      if (!Number.isFinite(birth.x) || !Number.isFinite(birth.y)) return { ok: false, diagnostic: 'birth coordinates are invalid' };
      if (!Number.isInteger(birth.seed) || (birth.seed as number) < 0 || (birth.seed as number) > 0xffffffff) {
        return { ok: false, diagnostic: 'birth seed is not uint32' };
      }
    }
  }
  return { ok: true, diagnostic: '' };
}

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
    const cells = [galaxiesInCell(0, 0), galaxiesInCell(1, -2), galaxiesInCell(-3, 5)];
    expect(canon(cells.map((arr) => arr.map((g) => slimGal(g))))).toBe(probeRaw('galaxiesInCell'));
    for (const cell of cells) {
      const web: number = cell.web;
      expect(web).toBe(cell.web);
      expect(cellWebContract(cell)).toEqual({ ok: true, diagnostic: '' });
    }
    expect(galaxiesInCell(0, 0)).toBe(cells[0]);
    expect(cellWebContract(galaxiesInCell(0, 0))).toEqual({ ok: true, diagnostic: '' });

    /* Permanent instrument controls: array spread drops the custom property,
       and a non-finite clone proves the validator is not merely checking for
       property presence. Never mutate the memoized real arrays. */
    expect(cellWebContract([...cells[0]!])).toEqual({ ok: false, diagnostic: 'missing own web metadata' });
    const nonFinite = [...cells[0]!] as unknown[] & { web: number };
    nonFinite.web = Number.NaN;
    expect(cellWebContract(nonFinite)).toEqual({ ok: false, diagnostic: 'web is not finite' });
    const outOfRange = [...cells[0]!] as unknown[] & { web: number };
    outOfRange.web = 2;
    expect(cellWebContract(outOfRange)).toEqual({ ok: false, diagnostic: 'web is outside [0,1]' });
    expect(cellWebContract({ web: 0.5 })).toEqual({ ok: false, diagnostic: 'not an array' });
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
  it('declares supernovaSites as an epoch-keyed exact result, not a requested count', () => {
    expect(hasTruthfulSupernovaDeclaration(declarationSource)).toBe(true);
    expect(hasTruthfulSupernovaDeclaration(
      'export function supernovaSites(galaxySeed: number, n: number): SupernovaSite[];',
    )).toBe(false);

    const epoch3 = supernovaSites(999, 3);
    const epoch4 = supernovaSites(999, 4);
    const epoch99 = supernovaSites(999, 99);
    const independentlyTyped: Array<{
      x: number;
      y: number;
      remnant: 'NS' | 'shell' | 'BH';
      seed: number;
      births: Array<{ x: number; y: number; seed: number }>;
    }> = epoch3;
    expect(independentlyTyped).toBe(epoch3);
    expect(supernovaSites(999, 3)).toBe(epoch3); /* memo identity; the baseline above pins value */
    expect(canon(epoch3)).not.toBe(canon(epoch4));
    expect(supernovaContract(epoch3)).toEqual({ ok: true, diagnostic: '' });
    expect(supernovaContract(epoch4)).toEqual({ ok: true, diagnostic: '' });
    expect(supernovaContract(epoch99)).toEqual({ ok: true, diagnostic: '' });
    expect(epoch99.length).toBeLessThanOrEqual(3);

    const site = epoch3[0]!;
    const birth = site.births[0]!;
    const malformed: Array<[unknown, string]> = [
      [[], 'site count is outside 1-3'],
      [[{ ...site, x: Number.NaN }], 'site coordinates are invalid'],
      [[{ ...site, seed: -1 }], 'site seed is not uint32'],
      [[{ ...site, remnant: { toString: () => 'NS' } }], 'unknown remnant'],
      [[{ ...site, births: [] }], 'birth count is outside 1-3'],
      [[{ ...site, births: [{ ...birth, y: Number.NaN }] }], 'birth coordinates are invalid'],
      [[{ ...site, births: [{ ...birth, seed: -1 }] }], 'birth seed is not uint32'],
    ];
    for (const [value, diagnostic] of malformed) {
      expect(supernovaContract(value)).toEqual({ ok: false, diagnostic });
    }
  });
  /* MUST REMAIN LAST: the hooked success memoizes (-6,4), so any future
     missing-hook test must reserve a fresh coordinate or isolate the module. */
  it('★ documents the exact GAL_SPRITES precondition: special-only succeeds, ordinary generation fails until hooks install', async () => {
    const prior = new Map(CAPTURE_HOOK_KEYS.map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
    expect(Reflect.deleteProperty(globalThis, 'GAL_SPRITES')).toBe(true);
    try {
      const specialOnly = galaxiesInCell(0, -1);
      expect(specialOnly.map((g) => g.seed)).toEqual([999]);
      expect(cellWebContract(specialOnly)).toEqual({ ok: true, diagnostic: '' });

      let missingHook: unknown;
      try { galaxiesInCell(-6, 4); } catch (error) { missingHook = error; }
      expect(missingHook).toBeInstanceOf(ReferenceError);
      expect(String((missingHook as Error).message)).toContain('GAL_SPRITES');

      const { installCaptureHooks } = await import('@cf/domain-descriptors');
      installCaptureHooks();
      const generated = galaxiesInCell(-6, 4);
      expect(generated.length).toBe(4);
      expect(generated.map((g) => g.sp)).toEqual([6, 14, 9, 2]);
      expect(generated.web).toBe(0.18673954586404728);
      expect(cellWebContract(generated)).toEqual({ ok: true, diagnostic: '' });
    } finally {
      for (const key of CAPTURE_HOOK_KEYS) {
        Reflect.deleteProperty(globalThis, key);
        const descriptor = prior.get(key);
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      }
    }
  });
});
