import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadFixture, checkGenerator, canon } from '../../../../tests/parity.js';
import { probeRaw } from '../../../../tests/baseline.js';
import { encodeWhere, decodeWhere, winEstimate, floraStat, biomeFor, hdGenesFor, _sanitizeSavedGenome } from '@cf/domain-strays';
import { battleStats } from '@cf/domain-combatcore';
import { makeGenome } from '@cf/domain-genome';
import { systemFor } from '@cf/domain-worldgen';
import { climateBand } from '@cf/domain-surveyphrases';

const fx = loadFixture();
const G1 = () => makeGenome(1234, 'fauna', 0.5);
const G2 = () => makeGenome(5678, 'fauna', 0.2);

describe('@cf/domain-strays — golden ×2,000 (the last two of the 25 generators)', () => {
  it('biomeFor: 1,000 systems (recipe mirrors goldenseeds-probe.js)', () => {
    const r = checkGenerator(fx, 'biomeFor', (s) => {
      const sys = systemFor(s); const pl = (sys.planets || [])[0] as { P: { seed: number }; orb?: number } | undefined;
      if (!pl) return 'no-planet';
      const b = climateBand(pl.P, sys, pl.orb !== undefined ? pl.orb : 2);
      const res = biomeFor(pl.P, b) as { k?: unknown } | null;
      return res ? (res.k || res) : null;
    });
    expect(r.mismatches).toEqual([]); expect(r.rollupOk).toBe(true);
  });
  it('hdGenesFor: 1,000 seeds (the genome→visual-gene contract)', () => {
    const r = checkGenerator(fx, 'hdGenesFor', (s) => hdGenesFor(makeGenome(s, 'fauna', 0.5)));
    expect(r.mismatches).toEqual([]); expect(r.rollupOk).toBe(true);
  });
});

describe('baseline probes (recipes mirror tools/probe.js exactly)', () => {
  it('whereCodec probe', () => {
    const w = {
      type: 'planet',
      gal: { x: 90, y: -60, size: 14.5, sp: 4, tilt: 0.62, rot: 1.13, seed: 999, home: true },
      star: { x: 560, y: 170, seed: 424242 },
      pseed: 133,
    };
    const code = encodeWhere(w, 'Test Place');
    expect(canon([code, decodeWhere(code)])).toBe(probeRaw('whereCodec'));
  });
  it('winEstimate probe', () => {
    expect(canon(winEstimate(
      { name: 'A', genome: G1(), stats: battleStats(G1()) },
      { name: 'B', genome: G2(), stats: battleStats(G2()) }))).toBe(probeRaw('winEstimate'));
  });
  it('floraStat probe', () => {
    expect(canon([makeGenome(9, 'flora', 0.8), makeGenome(21, 'flora', 0.4)].map((g) => floraStat(g)))).toBe(probeRaw('floraStat'));
  });
  it('speciesPortrait probe (hdGenesFor ×5 — HD-always-on made dataURLs vacuous; this pins the art contract)', () => {
    expect(canon([G1(), G2(), makeGenome(9, 'fauna', 0.8), makeGenome(10, 'fauna', 0.1),
      makeGenome(11, 'fauna', 0.6)].map((g) => hdGenesFor(g)))).toBe(probeRaw('speciesPortrait'));
  });
});

/* ═══ code-fixtures: the two buckets module 14 could not close ═══ */
interface CodeFx {
  whereCodes: Record<string, { code: string; decoded: string }>;
  sanitizeSavedGenome: Record<string, { input: string; output: string; changed: boolean; sizeIn: string | null; sizeOut: string | null; sizePreserved: boolean }>;
}
function loadCodeFx(): CodeFx {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return JSON.parse(fs.readFileSync(path.join(here, '..', '..', '..', '..', '..', 'baseline-v1.8.9', 'code-fixtures.json'), 'utf8')) as CodeFx;
}
const clone = <T,>(o: T): T => { try { return JSON.parse(JSON.stringify(o)) as T; } catch { return o; } };
const call = (fn: unknown, a: unknown, b?: unknown): unknown => {
  try { return (fn as (...x: unknown[]) => unknown)(a, b); } catch (e) { return 'THROW:' + (e as Error).message; }
};
const base = (k?: string, t?: number) => makeGenome(1234, k || 'fauna', t === undefined ? 0.5 : t);
const withF = (extra: Record<string, unknown>) => { const g = clone(base()) as Record<string, unknown>; for (const k in extra) g[k] = extra[k]; return g; };
const GENOMES: Record<string, Record<string, unknown>> = {
  fauna_basic: base('fauna', 0.5) as never, flora_basic: base('flora', 0.3) as never,
  fungi_basic: base('fungi', 0.7) as never, microbe_basic: base('microbe', 0.1) as never,
  size_0: withF({ size: 0 }), size_5: withF({ size: 5 }),
  size_6_drifted: withF({ size: 6, gen: 3 }), size_12_drifted: withF({ size: 12, gen: 5 }),
  size_huge: withF({ size: 1e6 }), size_negative: withF({ size: -3 }),
  apex_12: withF({ apex: 12, lumin: true, wild: 1 }), apex_invalid: withF({ apex: 3 }),
  par_8: withF({ par: 8 }), par_invalid: withF({ par: 99 }),
  xp_leveled: withF({ xp: 4200 }), xp_zero: withF({ xp: 0 }),
  gen5_hybrid: withF({ gen: 5, lumin: true, wild: 1, size: 4 }),
  hostile_nan: withF({ size: NaN, fer: NaN, xp: NaN }),
  hostile_infinity: withF({ size: Infinity, xp: -Infinity }),
  hostile_strings: withF({ size: '4', gen: '2', xp: '999' }),
  hostile_extrakeys: withF({ _mult: 99, _wf: 1, __evil: 'x', fed: 99999, brood: 99999 }),
  hostile_missing: { seed: 7 }, hostile_empty: {},
};
const WHERES: Record<string, Record<string, unknown>> = {
  home_planet: { type: 'planet', gal: { x: 90, y: -60, size: 14.5, sp: 4, tilt: 0.62, rot: 1.13, seed: 999, home: true }, star: { x: 560, y: 170, seed: 424242 }, pseed: 133 },
  deep_region: { type: 'planet', gal: { x: 8100, y: -4200, size: 9.25, sp: 1, tilt: 0.1, rot: 2.9, seed: 31337 }, star: { x: -12, y: 44, seed: 7 }, pseed: 4242 },
  star_only: { type: 'star', gal: { x: 0, y: 0, size: 10, sp: 0, tilt: 0, rot: 0, seed: 1 }, star: { x: 1, y: 2, seed: 99 } },
  minimal: { type: 'planet' },
};

describe('code-fixtures — the buckets awaiting these strays (now closed)', () => {
  const cf = loadCodeFx();
  it('whereCodes: code + decode for all 4 location cases', () => {
    for (const wk of Object.keys(WHERES).sort()) {
      const want = cf.whereCodes[wk]!;
      const code = call(encodeWhere, clone(WHERES[wk]), 'Test Place');
      expect(code, `whereCodes.${wk}.code`).toBe(want.code);
      const back = (typeof code === 'string' && code.indexOf('THROW:') !== 0) ? call(decodeWhere, code) : null;
      expect(canon(back), `whereCodes.${wk}.decoded`).toBe(want.decoded);
    }
  });
  it('_sanitizeSavedGenome: output + changed + ★ sizePreserved (the v1.8.7 invariant) for all 23 genomes', () => {
    for (const gk of Object.keys(GENOMES).sort()) {
      const want = cf.sanitizeSavedGenome[gk]!;
      expect(canon(GENOMES[gk]), `sanitize.${gk}.input`).toBe(want.input);
      const s = call(_sanitizeSavedGenome, clone(GENOMES[gk]));
      const outC = canon(s);
      expect(outC, `sanitize.${gk}.output`).toBe(want.output);
      expect(outC !== canon(GENOMES[gk]), `sanitize.${gk}.changed`).toBe(want.changed);
      const sizePreserved = !!(s && typeof s === 'object') && String((s as { size?: unknown }).size) === String((GENOMES[gk] as { size?: unknown }).size);
      expect(sizePreserved, `sanitize.${gk}.sizePreserved — a clamp here repeats the v1.8.6 save corruption`).toBe(want.sizePreserved);
    }
  });
  it('_sanitizeSavedGenome preserves set-qualified Earth lineage provenance', () => {
    const input = {
      ...clone(GENOMES.fauna_basic),
      _earthBlend: 'Green Algae',
      _earthBlendKingdom: 'flora',
      _anchorVal: 0.73,
    };
    const sanitized = call(_sanitizeSavedGenome, input) as Record<string, unknown> | null;
    expect(sanitized?._earthBlend).toBe('Green Algae');
    expect(sanitized?._earthBlendKingdom).toBe('flora');
    expect(sanitized?._anchorVal).toBe(0.73);
  });
});
