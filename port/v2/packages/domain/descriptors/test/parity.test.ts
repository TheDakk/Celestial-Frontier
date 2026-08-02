import { describe, it, expect, beforeAll } from 'vitest';
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
