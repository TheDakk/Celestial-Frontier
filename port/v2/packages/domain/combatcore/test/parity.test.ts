import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadFixture, checkGenerator, canon } from '../../../../tests/parity.js';
import { probeRaw } from '../../../../tests/baseline.js';
import { battleStats, abilityOf, abilityTheme, runDuel, encodeCreature, decodeCreature, normGenome } from '@cf/domain-combatcore';
import { cleanName } from '@cf/domain-strays';
import { makeGenome } from '@cf/domain-genome';

const fx = loadFixture();
const G1 = () => makeGenome(1234, 'fauna', 0.5);
const G2 = () => makeGenome(5678, 'fauna', 0.2);

describe('@cf/domain-combatcore — golden ×1,000 (heavy tier)', () => {
  it('battleStats: 1,000 seeds', () => {
    const r = checkGenerator(fx, 'battleStats', (s) => battleStats(makeGenome(s, 'fauna', 0.5)));
    expect(r.mismatches).toEqual([]); expect(r.rollupOk).toBe(true);
  });
});

describe('baseline probes (recipes mirror tools/probe.js exactly)', () => {
  it('battleStats probe', () => {
    expect(canon([G1(), G2()].map((g) => battleStats(g)))).toBe(probeRaw('battleStats'));
  });
  it('abilityOf + abilityTheme probes', () => {
    expect(canon([G1(), G2()].map((g) => abilityOf(g)))).toBe(probeRaw('abilityOf'));
    expect(canon([G1(), G2()].map((g) => abilityTheme(g)))).toBe(probeRaw('abilityTheme'));
  });
  it('runDuel probe (deterministic duel, full transcript)', () => {
    const a = { name: 'A', genome: G1(), stats: battleStats(G1()) };
    const b = { name: 'B', genome: G2(), stats: battleStats(G2()) };
    expect(canon(runDuel(a, b))).toBe(probeRaw('runDuel'));
  });
  it('creatureCodec probe (code string + decode round trip)', () => {
    const entry = { name: 'Testling', genome: G1() };
    const code = encodeCreature(entry);
    expect(canon([code, decodeCreature(code)])).toBe(probeRaw('creatureCodec'));
  });
  it('normGenome probe', () => {
    expect(canon(normGenome(G1()))).toBe(probeRaw('normGenome'));
  });
  it('cleanName probe (via @cf/domain-strays)', () => {
    expect(canon([cleanName('<b>Evil&"Name\'</b> with a very long tail beyond cap'), cleanName('  ok  ')])).toBe(probeRaw('cleanName'));
  });
});

/* ═══ code-fixtures.json — the curated adversarial-edge corpus (Gate C feed).
   Inputs rebuilt EXACTLY per tools/codefixtures-probe.js: clone() is a JSON
   round-trip (NaN/Infinity become null in transit — deliberately), extras are
   assigned AFTER cloning so hostile NaN/Infinity/string values reach the
   hardeners as themselves.
   ⚠ whereCodes + sanitizeSavedGenome buckets NEED encodeWhere/decodeWhere and
   _sanitizeSavedGenome — strays queued for Gate B; recorded, not silent. ═══ */
interface CodeFx {
  creatureCodes: Record<string, { code: string; decoded: string; roundTripGenome: boolean }>;
  championCodes: Record<string, { code: string; decoded: string; roundTripGenome: boolean }>;
  normGenome: Record<string, { input: string; output: string; changed: boolean }>;
  cleanName: Record<string, string>;
}
function loadCodeFx(): CodeFx {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return JSON.parse(fs.readFileSync(path.join(here, '..', '..', '..', '..', '..', 'baseline-v1.8.9', 'code-fixtures.json'), 'utf8')) as CodeFx;
}
const clone = <T,>(o: T): T => { try { return JSON.parse(JSON.stringify(o)) as T; } catch { return o; } };
const call = (fn: (...a: never[]) => unknown, a: unknown, b?: unknown): unknown => {
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
const NAMES: Record<string, string> = {
  plain: 'Testling', html: '<b>Evil&"Name\'</b> with a very long tail beyond the cap',
  unicode: 'Zoë — Ω星 🜏', very_long: new Array(400).join('x'), empty: '', spaces: '   padded   ',
};

describe('code-fixtures — share & champion codes over the 23-genome corpus', () => {
  const cf = loadCodeFx();
  it('creatureCodes + championCodes: code, decode, and round-trip verdict all match', () => {
    for (const gk of Object.keys(GENOMES).sort()) {
      const entry = { name: 'Testling', genome: GENOMES[gk] };
      for (const [bucket, champ] of [['creatureCodes', false], ['championCodes', true]] as const) {
        const want = cf[bucket][gk]!;
        const code = call(encodeCreature as never, clone(entry), champ);
        expect(code, `${bucket}.${gk}.code`).toBe(want.code);
        const back = (typeof code === 'string' && code.indexOf('THROW:') !== 0) ? call(decodeCreature as never, code) : null;
        expect(canon(back), `${bucket}.${gk}.decoded`).toBe(want.decoded);
        expect(canon((back as { genome?: unknown } | null)?.genome || null) === canon(GENOMES[gk]), `${bucket}.${gk}.roundTripGenome`).toBe(want.roundTripGenome);
      }
    }
  });
  it('name edge cases through the codec + cleanName', () => {
    for (const nk of Object.keys(NAMES).sort()) {
      expect(canon(call(cleanName as never, NAMES[nk])), `cleanName.${nk}`).toBe(cf.cleanName[nk]);
      const want = cf.creatureCodes['name_' + nk]!;
      const code = call(encodeCreature as never, { name: NAMES[nk], genome: GENOMES.fauna_basic }, false);
      expect(code, `name_${nk}.code`).toBe(want.code);
      const back = (typeof code === 'string' && code.indexOf('THROW:') !== 0) ? call(decodeCreature as never, code) : null;
      expect(canon(back), `name_${nk}.decoded`).toBe(want.decoded);
    }
  });
  it('normGenome (untrusted-import hardener): output + changed verdict per case', () => {
    for (const gk of Object.keys(GENOMES).sort()) {
      const want = cf.normGenome[gk]!;
      expect(canon(GENOMES[gk]), `normGenome.${gk}.input`).toBe(want.input);
      const n = call(normGenome as never, clone(GENOMES[gk]));
      expect(canon(n), `normGenome.${gk}.output`).toBe(want.output);
      expect(canon(n) !== canon(GENOMES[gk]), `normGenome.${gk}.changed`).toBe(want.changed);
    }
  });
  it('set-qualified Earth lineage survives normalization and share-code round trip', () => {
    const genome = {
      ...clone(GENOMES.fauna_basic),
      _earthBlend: 'Green Algae',
      _earthBlendKingdom: 'flora',
      _anchorVal: 0.73,
    };
    const normalized = call(normGenome as never, clone(genome)) as Record<string, unknown>;
    expect(normalized._earthBlend).toBe('Green Algae');
    expect(normalized._earthBlendKingdom).toBe('flora');
    const code = call(encodeCreature as never, { name: 'Lineage Sentinel', genome }, false);
    expect(typeof code).toBe('string');
    const decoded = call(decodeCreature as never, code) as { genome: Record<string, unknown> } | null;
    expect(decoded?.genome._earthBlend).toBe('Green Algae');
    expect(decoded?.genome._earthBlendKingdom).toBe('flora');
    expect(decoded?.genome._anchorVal).toBe(0.73);
  });
});
