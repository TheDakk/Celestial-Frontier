/* Deterministic, complete Compendium input for the real-browser memory gate.

   This intentionally does not import application code: the evidence input
   must be independently reproducible before Vite or a browser exists. The
   field inventory and PRNG order mirror Genome.makeGenome's v1.8.9 contract.
   A small, documented tail adds shapes that real saves contain after
   evolution, extremophile discovery, Earth lineage, and breeding. */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const COMPENDIUM_FIXTURE_SPEC_PATH = path.join(
  here, 'fixtures', 'compendium-1500-v1.json',
);

const KINGDOMS = Object.freeze(['fauna', 'flora', 'fungi', 'microbe']);
const REALMS = Object.freeze([
  'Land Fauna', 'Aquatic Fauna', 'Aerial Fauna', 'Amphibious Life',
  'Subterranean Life', 'Extreme-World Life', 'Gas Giant Life', 'Megafauna',
  'Intelligent Natural Life', 'Collective / Hive Life', 'Exotic Biochemistry',
  'Anomalous Life', 'Flora', 'Fungi', 'Microbial Life', 'Colonial Life',
]);
/* Exact table lengths consumed by makeGenome, in exact draw order. */
const GENE_LENGTHS = Object.freeze({
  color: 17, form: 18, body: 16, loco: 18, trait: 25, size: 6,
  diet: 6, head: 10, limbs: 6, skin: 9, tail: 7, pattern: 8,
  eyes: 6, behavior: 12, habitat: 19, detail: 10, accent: 17,
  temper: 10, sense: 10, repro: 8, life: 6, metab: 6,
});

function assert(condition, message) {
  if (!condition) throw new Error(`Compendium fixture: ${message}`);
}
function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}
function mulberry32(a) {
  return function next() {
    a |= 0;
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function hashInt(seed, x, y) {
  let h = seed | 0;
  h = Math.imul(h ^ (x | 0), 374761393);
  h = Math.imul(h ^ (y | 0), 668265263);
  h ^= h >>> 15;
  h = Math.imul(h, 2246822519);
  h ^= h >>> 13;
  return h >>> 0;
}
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}
export function stableJson(value) { return JSON.stringify(stable(value)); }

function baseGenome(seed, kingdom, heat) {
  const r = mulberry32((seed ^ 0x9e3b) >>> 0);
  const g = { seed, kingdom };
  for (const [gene, length] of Object.entries(GENE_LENGTHS)) g[gene] = (r() * length) | 0;
  g.lumin = r() < 0.28;
  g.gen = 0;
  g.heat = heat;
  return g;
}

function realisticGenome(index, fixtureSeed) {
  /* The first two are an explicit anti-bare-seed pair. Both are complete,
     valid saved genomes, but the second records post-generation drift while
     deliberately retaining the same numeric seed. A key based on seed alone
     must collapse them and fail the gate. */
  const seed = index < 2
    ? 0x51A7BEEF
    : hashInt(fixtureSeed, index, Math.imul(index + 17, 7919)) >>> 0;
  const kingdom = KINGDOMS[index % KINGDOMS.length];
  const g = baseGenome(seed, kingdom, index % 3);
  if (index === 1) {
    g.kingdom = 'fauna';
    g.accent = (g.accent + 7) % GENE_LENGTHS.accent;
    g.size += 2;
    g.gen = 4;
    g.parents = [0xA11CE001, 0xA11CE002];
    g.evolved = true;
  }
  /* Saved, honestly bred genomes may retain out-of-range drifting genes.
     Readers wrap them; the load path must not rewrite them. */
  if (index > 1 && index % 31 === 0) {
    g.size += 6;
    g.form += 18;
    g.gen = 1 + index % 8;
    g.parents = [hashInt(seed, 1, 7), hashInt(seed, 2, 7)];
  }
  if (index > 1 && index % 47 === 0) g.x = 1;
  if (index > 1 && index % 71 === 0) g.aq = 1;
  if (index > 1 && index % 89 === 0) g.af = 1;
  if (index > 1 && index % 113 === 0) {
    g._earthName = index % 226 === 0 ? 'Wolf' : 'Vanilla Orchid';
    g._cradle = 1;
  }
  if (index > 1 && index % 127 === 0) {
    g._earthBlend = index % 254 === 0 ? 'Apple' : 'Oyster Mushroom';
    g._earthBlendKingdom = index % 254 === 0 ? 'flora' : 'fungi';
    g._anchorVal = 0.22 + (index % 6) * 0.1;
  }
  return g;
}

function label(index) {
  if (index === 0) return 'Same Seed Sentinel Alpha';
  if (index === 1) return 'Same Seed Sentinel Beta';
  if (index === 777) return 'Compendium Filter Beacon';
  return `Evidence Species ${String(index).padStart(4, '0')}`;
}

export function loadCompendiumFixtureSpec() {
  const parsed = JSON.parse(fs.readFileSync(COMPENDIUM_FIXTURE_SPEC_PATH, 'utf8'));
  assert(parsed?.schema === 'cf-v2-compendium-fixture/v1', 'fixture schema drifted');
  assert(parsed.generator === 'compendium-realistic-genomes/v1', 'fixture generator drifted');
  assert(Number.isSafeInteger(parsed.seed) && parsed.seed >= 0, 'fixture seed is invalid');
  assert(parsed.count === 1500, `expected exactly 1500 rows, got ${String(parsed.count)}`);
  assert(Array.isArray(parsed.sameSeedPair) && parsed.sameSeedPair.length === 2,
    'same-seed pair inventory is invalid');
  assert(typeof parsed.filterBeacon === 'string' && parsed.filterBeacon,
    'filter beacon is missing');
  assert(/^[a-f0-9]{64}$/.test(parsed.expectedRowsSha256), 'expected rows digest is invalid');
  assert(/^[a-f0-9]{64}$/.test(parsed.brokenBaselineProjectionRowsSha256),
    'broken-baseline projection digest is invalid');
  return Object.freeze(parsed);
}

export function buildCompendiumFixture({ verifyDigest = true } = {}) {
  const spec = loadCompendiumFixtureSpec();
  const rows = Array.from({ length: spec.count }, (_, index) => {
    const logicalId = index === 0 ? spec.sameSeedPair[0]
      : index === 1 ? spec.sameSeedPair[1]
        : index === 777 ? spec.filterBeacon
          : `cmem-${String(index).padStart(4, '0')}`;
    const g = realisticGenome(index, spec.seed);
    const hybrid = Array.isArray(g.parents) || typeof g._earthBlend === 'string';
    return [logicalId, {
      id: logicalId,
      name: label(index),
      kind: hybrid ? 'Evolved lineage' : 'Surveyed life',
      tier: index % 10,
      realm: REALMS[index % REALMS.length],
      sapient: g.kingdom === 'fauna' && index % 137 === 0 ? 3 : 0,
      from: `Evidence World ${String(index % 97).padStart(2, '0')}`,
      hybrid,
      g,
      where: null,
    }];
  });
  const logicalIds = rows.map(([id]) => id);
  const genomeBytes = rows.map(([, entry]) => stableJson(entry.g));
  assert(new Set(logicalIds).size === spec.count, 'logical IDs are not unique');
  assert(new Set(genomeBytes).size === spec.count, 'complete genomes are not distinct');
  assert(rows[0][1].g.seed === rows[1][1].g.seed,
    'anti-bare-seed pair does not share a seed');
  assert(genomeBytes[0] !== genomeBytes[1],
    'anti-bare-seed pair does not differ as complete genomes');
  const rowsSha256 = sha256(stableJson(rows));
  if (verifyDigest) assert(rowsSha256 === spec.expectedRowsSha256,
    `rows digest drifted: expected ${spec.expectedRowsSha256}, got ${rowsSha256}`);
  return Object.freeze({
    schema: spec.schema,
    generator: spec.generator,
    seed: spec.seed,
    count: spec.count,
    rowsSha256,
    sameSeedPair: Object.freeze([...spec.sameSeedPair]),
    filterBeacon: spec.filterBeacon,
    rows,
  });
}

/* Exact 3844701 keyed imported Compendium rows as `s${seed}`. The primary
   fixture deliberately owns one same-seed/different-complete-genome pair, so
   feeding it unchanged would honestly measure only 1,499 rows. This adapter
   preserves all 1,500 complete workloads but deterministically rekeys only a
   seed that the old importer would collapse. Both the source fixture digest
   and this baseline-only projection digest are recorded in every sample. */
export function buildBrokenBaselineProjection(fixture = buildCompendiumFixture()) {
  const spec = loadCompendiumFixtureSpec();
  const usedSeeds = new Set();
  const rekeys = [];
  const codex = fixture.rows.map(([logicalId, entry], index) => {
    const g = structuredClone(entry.g);
    const originalSeed = Number(g.seed) >>> 0;
    let projectedSeed = originalSeed;
    let salt = 0;
    while (usedSeeds.has(projectedSeed)) {
      projectedSeed = hashInt(originalSeed, index + 1, 0xB45E + salt) >>> 0;
      salt += 1;
    }
    if (projectedSeed !== originalSeed) {
      rekeys.push({ index, logicalId, originalSeed, projectedSeed });
      g.seed = projectedSeed;
    }
    usedSeeds.add(projectedSeed);
    return { g, f: entry.from, ...(entry.where ? { w: entry.where } : {}) };
  });
  assert(codex.length === 1500 && usedSeeds.size === 1500,
    'broken-baseline projection did not preserve 1,500 importer-distinct rows');
  assert(rekeys.length === 1 && rekeys[0].index === 1,
    'broken-baseline projection changed more than the one deliberate duplicate seed');
  const rowsSha256 = sha256(stableJson(codex));
  assert(rowsSha256 === spec.brokenBaselineProjectionRowsSha256,
    `broken-baseline projection digest drifted: expected ${spec.brokenBaselineProjectionRowsSha256}, got ${rowsSha256}`);
  return Object.freeze({
    schema: 'cf-v2-compendium-broken-baseline-projection/v1',
    sourceRowsSha256: fixture.rowsSha256,
    count: codex.length,
    uniqueSeeds: usedSeeds.size,
    rekeys: Object.freeze(rekeys),
    rowsSha256,
    codex,
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const fixture = buildCompendiumFixture({ verifyDigest: !process.argv.includes('--print-digest') });
  if (process.argv.length === 3 && process.argv[2] === '--print-digest') {
    console.log(fixture.rowsSha256);
  } else if (process.argv.length === 2) {
    console.log(JSON.stringify({
      schema: fixture.schema, generator: fixture.generator,
      count: fixture.count, rowsSha256: fixture.rowsSha256,
      sameSeedPair: fixture.sameSeedPair, filterBeacon: fixture.filterBeacon,
    }, null, 2));
  } else {
    console.error('usage: node tools/compendiummem-fixture.mjs [--print-digest]');
    process.exitCode = 2;
  }
}
