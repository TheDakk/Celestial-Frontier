/* Shared parity machinery for checking ported modules against
   port/baseline-v1.8.9/golden-seeds.json.

   ⚠ This file implements the fixture's OWN documented spec (its _comment block):
     canon: numbers -> non-finite String(v), else Math.round(v*1e9)/1e9;
            objects -> keys sorted; arrays element-wise; undefined -> null
     hash:  FNV-1a-32 run twice (bases 0x811c9dc5, 0x9e3779b9), 8 hex chars
            each, concatenated
     rollup: fold hash(roll + perSeed[i]) from ''
   If this file and tools/goldenseeds-probe.js ever disagree, THE FIXTURE WINS —
   the whole point is that the port reproduces recorded numbers, not that two
   implementations agree with each other. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export interface GoldenFixture {
  seeds: number[];
  generators: Record<string, { tier: string; cases: number; rollup: string; perSeed: string[] }>;
  samples: Array<{ gen: string; i: number; seed: number; canonical: string }>;
  counts: { seeds: number; generators: number; allTier: number; heavyTier: number };
}

export function loadFixture(): GoldenFixture {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const p = path.join(here, '..', '..', 'baseline-v1.8.9', 'golden-seeds.json');
  return JSON.parse(fs.readFileSync(p, 'utf8')) as GoldenFixture;
}

/* ---- canonical form ---- */
function san(v: unknown, d = 0, seen = new WeakSet<object>()): unknown {
  if (d > 8) return '«deep»';
  if (v === undefined || v === null) return null;
  const t = typeof v;
  if (t === 'number') return Number.isFinite(v as number) ? Math.round((v as number) * 1e9) / 1e9 : String(v);
  if (t === 'string' || t === 'boolean') return v;
  if (t === 'function') return '«fn»';
  if (t === 'object') {
    if (Array.isArray(v)) return v.map((e) => san(e, d + 1, seen));
    if (seen.has(v as object)) return '«cycle»';
    seen.add(v as object);
    const o: Record<string, unknown> = {};
    for (const k of Object.keys(v as object).sort()) o[k] = san((v as Record<string, unknown>)[k], d + 1, seen);
    return o;
  }
  return String(v);
}
export function canon(v: unknown): string {
  try { return JSON.stringify(san(v)); } catch (e) { return 'ERR:' + (e as Error).message; }
}

/* ---- FNV-1a 32 ×2 -> 16 hex ---- */
function fnv(s: string, base: number): number {
  let h = base >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}
const hx = (n: number): string => ('0000000' + n.toString(16)).slice(-8);
export function fnvHash(s: string): string { return hx(fnv(s, 0x811c9dc5)) + hx(fnv(s, 0x9e3779b9)); }

export interface ParityResult { name: string; cases: number; mismatches: Array<{ i: number; seed: number; want: string; got: string }>; rollupOk: boolean; }

/** Run one generator across the fixture's seed list and compare per-seed + rollup. */
export function checkGenerator(fx: GoldenFixture, name: string, fn: (seed: number) => unknown): ParityResult {
  const g = fx.generators[name];
  if (!g) throw new Error('fixture has no generator ' + name);
  const mismatches: ParityResult['mismatches'] = [];
  let roll = '';
  for (let i = 0; i < g.cases; i++) {
    const seed = fx.seeds[i]!;
    let c: string;
    try { c = canon(fn(seed)); } catch (e) { c = 'THROW:' + (e as Error).message; }
    const h = fnvHash(c);
    roll = fnvHash(roll + h);
    if (h !== g.perSeed[i] && mismatches.length < 5) mismatches.push({ i, seed, want: g.perSeed[i]!, got: h });
  }
  return { name, cases: g.cases, mismatches, rollupOk: roll === g.rollup };
}
