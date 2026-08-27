import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadFixture, checkGenerator, canon } from '../../../../tests/parity.js';
import { probeRaw } from '../../../../tests/baseline.js';
import {
  installCaptureHooks, roman, starDescriptor, planetDescriptor, moonDescriptor,
  galaxyDescriptor, wormholeDescriptor, cmbDescriptor, oortDescriptor,
  kuiperDescriptor, visitorDescriptor, beltDescriptor,
} from '@cf/domain-descriptors';
import { systemFor, galaxiesInCell } from '@cf/domain-worldgen';
import { GAL_KIND, _EARTH_NAMES as _EARTH_NAMES_V1 } from '../src/apphooks.verbatim.js';
import { _EARTH_NAMES, _earthNamePass } from '../src/apphooks.js';

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

/* ═══ D-CAT-1: THE ONE PLACE v2 IS ALLOWED TO DIFFER FROM v1.8.9 ═══════════
   Four organisms were filed in two kingdoms each, so the roster held 1,014
   records for 1,010 organisms. Nick approved collapsing them as a deliberate
   v2 change. Earth names are handed out by `seed % pool.length`, so shortening
   the flora and microbe pools reassigns the Earth NAME of every flora and
   microbe in every world. That was the accepted cost.

   The baseline is NOT regenerated to absorb it. baseline.json stays v1.8.9
   truth, and this mask carves out exactly the deviation — no wider:
     · fauna (631) and fungi (27) pools are UNTOUCHED, so their names stay
       under full byte parity and are deliberately NOT masked. If a fauna name
       ever moves, this probe still fails, which is the point.
     · every other field — seeds, trait indices, rarity, the descriptive
       phrases, thumbnails — stays under full byte parity for all kingdoms.
   So the mask proves "only the two shortened pools renamed, nothing else
   moved" rather than the useless "the two blobs are similar". */
function maskDedupe(canonJson: string): string {
  return canonJson
    /* the species records: "_earthName":"Rambutan" (flora/microbe only — the
       kingdom field sits after it in key-sorted order. [^}]* keeps the lazy
       match inside ONE species object — `.*?` would happily run past the
       object boundary and mask a fauna name that happened to be followed by a
       flora one. */
    .replace(/"_earthName":"[^"]*"(?=,"accent"[^}]*"kingdom":"(?:flora|microbe)")/g,
      '"_earthName":"«D-CAT-1»"')
    /* the compendium rows: ["Flora","Rambutan — violet fern-analogues",…].
       The trailing "sp:" tag is REQUIRED in the match so this only touches
       species rows — Earth's static prose rows ("Forests, grasses and ocean
       algae — they make the oxygen") stay under full parity. */
    .replace(/\["(Flora|Microbe)","[^"—]*— ([^"]*)","bio","sp:/g,
      '["$1","«D-CAT-1» — $2","bio","sp:');
}

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
    /* ⚠ D-CAT-1 makes this the ONE probe that cannot be byte-equal to v1.8.9.
       The baseline is NOT regenerated (rule 5) — instead the deviation is
       masked on BOTH sides, and masked as narrowly as it actually is. */
    expect(maskDedupe(canon(out))).toBe(maskDedupe(probeRaw('planetDescriptor')));
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

describe('★ D-CAT-1 — the deduped roster, and the mask that lets it past parity', () => {
  /* ⚠ The mask above is the seventh-plus instance of the project's oldest
     trap waiting to happen: a check that passes because it stopped looking.
     A mask one character too greedy turns the planetDescriptor probe vacuous
     and nobody finds out. So it is negative-controlled in BOTH directions —
     it must hide the flora/microbe rename, and it must still expose every
     other edit. */
  const SPECIES = (name: string, kingdom: string): string =>
    `{"_cradle":1,"_earthName":"${name}","accent":2,"kingdom":"${kingdom}","seed":7}`;

  it('MASKS the flora and microbe renames (the approved deviation)', () => {
    expect(maskDedupe(SPECIES('Rambutan', 'flora')))
      .toBe(maskDedupe(SPECIES('Green Algae', 'flora')));
    expect(maskDedupe(SPECIES('Halophile', 'microbe')))
      .toBe(maskDedupe(SPECIES('Tardigrade', 'microbe')));
    expect(maskDedupe('["Flora","Rambutan — violet fern-analogues","bio","sp:1"]'))
      .toBe(maskDedupe('["Flora","Green Algae — violet fern-analogues","bio","sp:1"]'));
  });

  it('NEGATIVE CONTROL — fauna and fungi names are still fully pinned', () => {
    expect(maskDedupe(SPECIES('Oryx', 'fauna')))
      .not.toBe(maskDedupe(SPECIES('Civet', 'fauna')));
    expect(maskDedupe(SPECIES('Mildew', 'fungi')))
      .not.toBe(maskDedupe(SPECIES('Giant Puffball', 'fungi')));
    expect(maskDedupe('["Fauna","Oryx — large, bone-white","bio","sp:1"]'))
      .not.toBe(maskDedupe('["Fauna","Civet — large, bone-white","bio","sp:1"]'));
  });

  it('NEGATIVE CONTROL — a flora rename is masked but its DESCRIPTION is not', () => {
    expect(maskDedupe('["Flora","Rambutan — violet fern-analogues","bio","sp:1"]'))
      .not.toBe(maskDedupe('["Flora","Rambutan — ochre fern-analogues","bio","sp:1"]'));
  });

  it('NEGATIVE CONTROL — Earth’s static prose rows carry no sp: tag and stay pinned', () => {
    expect(maskDedupe('["Flora","Forests, grasses and ocean algae — they make the oxygen","bio"]'))
      .not.toBe(maskDedupe('["Flora","Forests and grasses — they make the oxygen","bio"]'));
  });

  it('NEGATIVE CONTROL — the mask cannot leak across a species boundary', () => {
    /* two adjacent records, fauna first. A `.*?` lookahead would reach the
       flora record’s kingdom and wrongly mask the fauna name. */
    const pair = (faunaName: string): string =>
      `[${SPECIES(faunaName, 'fauna')},${SPECIES('Rambutan', 'flora')}]`;
    expect(maskDedupe(pair('Oryx'))).not.toBe(maskDedupe(pair('Civet')));
  });

  it('the roster now holds 1,010 organisms with no cross-kingdom duplicate', () => {
    const seen = new Map<string, string[]>();
    let total = 0;
    for (const [k, names] of Object.entries(_EARTH_NAMES)) {
      total += names.length;
      for (const n of names) seen.set(n, [...(seen.get(n) ?? []), k]);
    }
    const dupes = [...seen].filter(([, ks]) => ks.length > 1);
    expect(dupes.map(([n, ks]) => `${n}: ${ks.join('+')}`)).toEqual([]);
    expect(total).toBe(1010);
    expect(seen.size).toBe(1010);
  });

  it('each duplicate survives in exactly the kingdom that should own it', () => {
    const has = (k: keyof typeof _EARTH_NAMES, n: string): boolean => _EARTH_NAMES[k].includes(n);
    expect([has('fauna', 'Tardigrade'), has('microbe', 'Tardigrade')]).toEqual([true, false]);
    expect([has('fungi', 'Reindeer Lichen'), has('flora', 'Reindeer Lichen')]).toEqual([true, false]);
    expect([has('flora', 'Green Algae'), has('microbe', 'Green Algae')]).toEqual([true, false]);
    expect([has('microbe', 'Snow Algae'), has('flora', 'Snow Algae')]).toEqual([true, false]);
  });

  it('⚠ the VERBATIM roster is untouched — the deviation lives in the owned wrapper', () => {
    /* If this ever fails, someone edited apphooks.verbatim.js directly. That
       breaks the lift contract and the next `node tools/lift-apphooks.mjs`
       silently reverts their work. */
    expect(Object.fromEntries(Object.entries(_EARTH_NAMES_V1).map(([k, v]) => [k, v.length])))
      .toEqual({ fauna: 631, flora: 334, fungi: 27, microbe: 22 });
  });

  it('the name pass hands out only deduped names, and never repeats one', () => {
    const list = Array.from({ length: 40 }, (_, i) => ({ kingdom: 'flora', seed: i * 7919 }));
    _earthNamePass(list as never);
    const got = list.map((g) => (g as { _earthName?: string })._earthName!);
    expect(got.filter((n) => n === 'Reindeer Lichen' || n === 'Snow Algae')).toEqual([]);
    expect(new Set(got).size).toBe(got.length);
    expect(got.every((n) => _EARTH_NAMES.flora.includes(n))).toBe(true);
  });
});

/* The original v1.8.9 fingerprint values for moonDescriptor and
   galaxyDescriptor are both [] because its recipes selected no objects. This
   supplemental fixture is captured from the immutable shipped HTML by
   tools/v189-descriptor-evidence.mjs. Keep baseline.json untouched: the fixture
   closes that historical blind spot without regenerating or weakening it. */
const DESCRIPTOR_EVIDENCE_COMMIT = '92098e91ddc2028cbab9149293b58166f483764c';
const DESCRIPTOR_SOURCE_SHA256 = '9f90f506a7cfcf5b721d80e7b956e0ef717edf04d004edf825ddb4f0303b3c88';
const DESCRIPTOR_CASE_IDS = [
  'sol-earth-moon-0',
  'system-1-planet-0-moon-0',
  'cell--6-4-galaxy-0',
] as const;

interface DescriptorEvidenceCase {
  id: string;
  recipe: Record<string, unknown>;
  raw: Record<string, unknown>;
  canonicalJson: string;
  canonicalJsonByteLength: number;
  canonicalJsonSha256: string;
}

interface DescriptorEvidence {
  _comment: string[];
  captureSchema: string;
  capturedAgainst: { tag: string; commit: string };
  source: { retrieval: string; path: string; bytes: number; sha256: string };
  capture: {
    probeFile: string; probeSha256: string;
    fakeCanvasFile: string; fakeCanvasSha256: string;
    canonicalisation: string;
  };
  guards: Record<string, unknown>;
  observedErrors: string[];
  cases: DescriptorEvidenceCase[];
  evidenceSha256: string;
}

const descriptorTestDir = path.dirname(fileURLToPath(import.meta.url));
const descriptorEvidenceFile = path.join(
  descriptorTestDir, '..', '..', '..', '..', '..', 'baseline-v1.8.9', 'descriptor-fixtures.json',
);
const descriptorEvidence = JSON.parse(fs.readFileSync(descriptorEvidenceFile, 'utf8')) as DescriptorEvidence;
const sha256 = (value: string | Buffer): string => crypto.createHash('sha256').update(value).digest('hex');

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort()
      .map((key) => [key, stable((value as Record<string, unknown>)[key])]));
  }
  return value;
}

function stableJson(value: unknown): string { return JSON.stringify(stable(value)); }

function aggregateEvidenceSha256(evidence: DescriptorEvidence): string {
  const core = structuredClone(evidence) as Partial<DescriptorEvidence>;
  delete core.evidenceSha256;
  return sha256(stableJson(core));
}

function descriptorEvidenceErrors(evidence: DescriptorEvidence): string[] {
  const errors: string[] = [];
  const expectedRecipes: Record<string, Record<string, unknown>> = {
    'sol-earth-moon-0': { descriptor: 'moonDescriptor', systemSeed: 424242, planetSeed: 133, moonIndex: 0 },
    'system-1-planet-0-moon-0': { descriptor: 'moonDescriptor', systemSeed: 1, planetIndex: 0, moonIndex: 0 },
    'cell--6-4-galaxy-0': { descriptor: 'galaxyDescriptor', cell: [-6, 4], galaxyIndex: 0, galaxySeed: 2024882063 },
  };
  if (evidence.captureSchema !== 'cf-v1.8.9-descriptor-evidence/v1') errors.push('schema');
  if (evidence.capturedAgainst.tag !== 'v1.8.9') errors.push('tag');
  if (evidence.capturedAgainst.commit !== DESCRIPTOR_EVIDENCE_COMMIT) errors.push('commit');
  if (evidence.source.path !== 'celestial-frontier.html') errors.push('source path');
  if (evidence.source.bytes !== 1963584) errors.push('source bytes');
  if (evidence.source.sha256 !== DESCRIPTOR_SOURCE_SHA256) errors.push('source hash');
  if (evidence.capture.probeFile !== '../v2/tools/v189-descriptor-probe.js') errors.push('probe path');
  if (evidence.capture.fakeCanvasFile !== '../../tools/fake2d.js') errors.push('fake-canvas path');
  if (evidence.observedErrors.length !== 0) errors.push('observed errors');
  if (stableJson(evidence.guards) !== stableJson({
    solSeed: 424242,
    earthPlanetSeed: 133,
    proceduralSystemSeed: 1,
    proceduralPlanetSeed: 2416138383,
    galaxyCell: [-6, 4],
    galaxySeed: 2024882063,
    galaxyKindCount: 16,
  })) errors.push('guards');
  if (stableJson(evidence.cases.map((row) => row.id)) !== stableJson(DESCRIPTOR_CASE_IDS)) errors.push('case inventory');

  const fixtureDir = path.dirname(descriptorEvidenceFile);
  const probeBytes = fs.readFileSync(path.resolve(fixtureDir, evidence.capture.probeFile));
  const fakeCanvasBytes = fs.readFileSync(path.resolve(fixtureDir, evidence.capture.fakeCanvasFile));
  if (sha256(probeBytes) !== evidence.capture.probeSha256) errors.push('probe hash');
  if (sha256(fakeCanvasBytes) !== evidence.capture.fakeCanvasSha256) errors.push('fake-canvas hash');

  for (const row of evidence.cases) {
    if (stableJson(row.recipe) !== stableJson(expectedRecipes[row.id])) errors.push(`${row.id} recipe`);
    if (stableJson(row.raw) !== row.canonicalJson) errors.push(`${row.id} raw/canonical`);
    if (Buffer.byteLength(row.canonicalJson) !== row.canonicalJsonByteLength) errors.push(`${row.id} bytes`);
    if (sha256(row.canonicalJson) !== row.canonicalJsonSha256) errors.push(`${row.id} hash`);
  }
  if (aggregateEvidenceSha256(evidence) !== evidence.evidenceSha256) errors.push('aggregate hash');
  return errors;
}

function descriptorCase(id: typeof DESCRIPTOR_CASE_IDS[number]): DescriptorEvidenceCase {
  const found = descriptorEvidence.cases.find((row) => row.id === id);
  if (!found) throw new Error(`descriptor evidence missing ${id}`);
  return found;
}

describe('independent v1.8.9 exact bytes for the two vacuous baseline probes', () => {
  it('binds raw records to the immutable source, capture recipe and every stored hash', () => {
    expect(descriptorEvidenceErrors(descriptorEvidence)).toEqual([]);
  });

  it('pins the real Sol moon and a generated procedural moon byte-for-byte', () => {
    const sol = systemFor(424242);
    const earth = planets(sol).find((planet) => planet.P.seed === 133);
    const procedural = planets(systemFor(1))[0];
    expect(earth).toBeDefined();
    expect(procedural).toBeDefined();
    expect(canon(moonDescriptor(earth as never, 0 as never)))
      .toBe(descriptorCase('sol-earth-moon-0').canonicalJson);
    expect(canon(moonDescriptor(procedural as never, 0 as never)))
      .toBe(descriptorCase('system-1-planet-0-moon-0').canonicalJson);
  });

  it('pins one populated, merging galaxy byte-for-byte', () => {
    const galaxy = galaxiesInCell(-6, 4)[0];
    expect(galaxy).toBeDefined();
    expect(galaxy?.seed).toBe(2024882063);
    expect(GAL_KIND.length).toBe(16);
    expect(canon(galaxyDescriptor(galaxy as never)))
      .toBe(descriptorCase('cell--6-4-galaxy-0').canonicalJson);
  });

  it('negative-controls stale provenance and tampered raw evidence', () => {
    const stale = structuredClone(descriptorEvidence);
    stale.capturedAgainst.commit = '0'.repeat(40);
    stale.evidenceSha256 = aggregateEvidenceSha256(stale);
    expect(descriptorEvidenceErrors(stale)).toContain('commit');

    const tampered = structuredClone(descriptorEvidence);
    tampered.cases[1]!.raw.title = 'Tampered moon';
    expect(descriptorEvidenceErrors(tampered)).toEqual(expect.arrayContaining([
      'system-1-planet-0-moon-0 raw/canonical',
      'aggregate hash',
    ]));
  });

  it('negative-controls meaningful current moon and galaxy field mutations', () => {
    const procedural = planets(systemFor(1))[0]!;
    const moon = structuredClone(moonDescriptor(procedural as never, 0 as never)) as {
      title: string; rows: Array<[string, string]>;
    };
    moon.rows[1]![1] = 'Invented ocean beneath the surface';
    expect(canon(moon)).not.toBe(descriptorCase('system-1-planet-0-moon-0').canonicalJson);

    const galaxy = structuredClone(galaxyDescriptor(galaxiesInCell(-6, 4)[0] as never)) as unknown as {
      designation: { tier: number }; rows: Array<[string, string, string?]>;
    };
    galaxy.designation.tier = 4;
    galaxy.rows[2]![1] = '~71 billion stars';
    expect(canon(galaxy)).not.toBe(descriptorCase('cell--6-4-galaxy-0').canonicalJson);
  });
});
