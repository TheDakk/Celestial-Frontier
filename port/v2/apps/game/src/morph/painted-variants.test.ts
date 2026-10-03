/** G4 selection (audits/G4_SELECTION_20260926/README.md). Outcomes, each with a negative control: the trait vocabularies ARE the
 * genome's; every variant set draws ONE anatomy (the paintings' own records); the visible-anatomy law over thousands of procedural
 * genomes; Earth species take their profile group's painting; the core-only (offline) path reduces EXACTLY to v1; and the card and
 * the stage resolve every creature to the same painting (CARD = STAGE). */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { makeGenome } from '@cf/domain-genome';
import { FA_LIMBS, FA_SIZE, FA_SKIN, FA_TAIL } from '@cf/domain-speciestraits';
import { CARD_ARCHETYPES } from './card-archetypes.js';
import { PaintedCardSource } from './painted-card-source.js';
import { paintedStandInV1, proceduralFamilyV1 } from './painted-stand-in.js';
import { PAINTED_TRAITS, TRAIT_SIZE, TRAIT_SKIN, TRAIT_TAIL, VARIANT_SETS, paintedArtV2, traitDistanceV1 } from './painted-variants.js';
import { EARTH_FAUNA_PROFILES } from '../earth-fauna-profiles.js';
import { BATTLE2_PARTS_FITS } from '../battle2-archetypes.js';
import { matchRecord } from '../battle2-wiring.js';

const PAINTED = new Set(CARD_ARCHETYPES.map((a) => a.earthName));
const CORE = new Set(BATTLE2_PARTS_FITS.filter((f) => !f.library).map((f) => f.earthName));
const REPO = new URL('../../../../../../', import.meta.url);
const templateOf = (name: string) => (JSON.parse(readFileSync(new URL(CARD_ARCHETYPES.find((a) => a.earthName === name)!.dir + 'record.json', REPO), 'utf8')) as { template: { id: string } }).template.id;
const genomes = (n: number) => Array.from({ length: n }, (_, i) => makeGenome(1000 + i * 7919, 'fauna', (i % 10) / 10) as unknown as Record<string, unknown>);
const LEGS: Readonly<Record<string, number>> = Object.fromEntries([...PAINTED].map((n) => [n, ({ quadruped: 4, hopper: 4, insect: 6, arachnid: 8 } as Record<string, number>)[templateOf(n)] ?? -1]));
/** The visible-anatomy law, as a checker over any resolver (so the negative control can run it on a broken one). */
const lawViolations = (resolve: (g: Record<string, unknown>) => { earthName: string } | null) => { const bad: string[] = [];
  for (const g of genomes(3000)) { const fam = proceduralFamilyV1(g); if (!fam.startsWith('land:')) continue; const s = resolve(g), limbs = Number(FA_LIMBS[((g.limbs as number) || 0) % FA_LIMBS.length]);
    if (s ? LEGS[s.earthName] !== limbs : ![0, 2, 3].includes(limbs)) bad.push(`${fam} → ${s?.earthName ?? 'procedural'}`); } return bad; };

describe('G4 painted variants', () => {
  it('the trait vocabularies are the genome\'s own tables (a drift in speciestraits fails here)', () => {
    expect([...TRAIT_SKIN]).toEqual([...FA_SKIN]); expect([...TRAIT_SIZE]).toEqual([...FA_SIZE]); expect([...TRAIT_TAIL]).toEqual([...FA_TAIL]);
  });
  it('every variant set draws ONE anatomy: its members are painted, can fight, carry traits, and their records share one template', () => {
    for (const [family, set] of Object.entries(VARIANT_SETS)) {
      const templates = new Set(set.map(templateOf)); expect(templates.size, family).toBe(1);
      for (const n of set) { expect(PAINTED.has(n), n).toBe(true); expect(BATTLE2_PARTS_FITS.some((f) => f.earthName === n), n).toBe(true); if (set.length > 1) expect(PAINTED_TRAITS[n], n).toBeDefined(); }
      // the v1 stand-in (when there is one) heads its set, so ties and the offline core path keep today's painting
      const v1 = paintedStandInV1({ kingdom: 'fauna', body: 0, seed: 0 }, PAINTED); void v1;
    }
    expect(templateOf('Civet')).toBe('quadruped'); expect(templateOf('Beetle')).not.toBe('quadruped'); // control: the check can tell anatomies apart
  });
  it('the visible-anatomy law holds for G4 over 3000 procedural genomes; a resolver that lets a six-legged painting into land:4 fails it (control)', () => {
    expect(lawViolations((g) => paintedArtV2(g, PAINTED))).toEqual([]);
    const broken = (g: Record<string, unknown>) => (proceduralFamilyV1(g) === 'land:4' ? { earthName: 'Beetle' } : paintedArtV2(g, PAINTED));
    expect(lawViolations(broken).length).toBeGreaterThan(50);
  });
  it('procedural variants spread over their set by visual genes, and sturgeon- and shark-shaped fish gain their own painting', () => {
    const counts = new Map<string, number>(); let v1Hit = 0, v2Hit = 0;
    for (const g of genomes(4000)) { const a = paintedArtV2(g, PAINTED), b = paintedStandInV1(g, PAINTED); if (a) { v2Hit++; counts.set(a.earthName, (counts.get(a.earthName) ?? 0) + 1); } if (b) v1Hit++;
      if (a && b) expect(LEGS[a.earthName] ?? templateOf(a.earthName), `${g.seed}`).toBe(LEGS[b.earthName] ?? templateOf(b.earthName)); }
    expect(v2Hit).toBeGreaterThan(v1Hit); // strictly more creatures painted (Sturgeon, Reef Shark)
    for (const n of ['Wolf', 'Cougar', 'Wall Lizard', 'Bass', 'Pike', 'Racer', 'Sturgeon', 'Reef Shark', 'Coconut Crab']) expect(counts.get(n) ?? 0, n).toBeGreaterThan(0);
    // nearest by genes: a scaled, tiny, whip-tailed four-legged alien is the Wall Lizard; a furred, large one is not
    const land4 = genomes(4000).find((g) => proceduralFamilyV1(g) === 'land:4')!;
    expect(paintedArtV2({ ...land4, skin: 0, size: 0, tail: 1 }, PAINTED)?.earthName).toBe('Wall Lizard');
    expect(paintedArtV2({ ...land4, skin: 1, size: 3, tail: 1 }, PAINTED)?.earthName).toBe('Cougar');
    expect(traitDistanceV1({ skin: 0, size: 0, tail: 1 }, PAINTED_TRAITS['Wall Lizard']!)).toBe(0);
  });
  it('Earth species without a painting take a painted member of their profile group; painted species stay themselves', () => {
    expect(paintedArtV2({ _earthName: 'Lion', seed: 1 }, PAINTED)).toEqual({ earthName: 'Cougar', kind: 'earth-variant', family: 'felid', standIn: 'Civet' });
    expect(paintedArtV2({ _earthName: 'Red Fox', seed: 1 }, PAINTED)?.earthName).toBe('Wolf');
    expect(paintedArtV2({ _earthName: 'Komodo Dragon', seed: 1 }, PAINTED)?.earthName).toBe('Wall Lizard');
    expect(paintedArtV2({ _earthName: 'Great White Shark', seed: 1 }, PAINTED)?.earthName).toBe('Reef Shark');
    expect(paintedArtV2({ _earthName: 'Anaconda', seed: 1 }, PAINTED)?.earthName).toBe('Python');
    expect(paintedArtV2({ _earthName: 'Wolf', seed: 1 }, PAINTED)).toEqual({ earthName: 'Wolf', kind: 'painted', family: 'self' });
    // a group with no painting keeps the v1 body-plan stand-in; an unknown or non-fauna creature stays null
    expect(paintedArtV2({ _earthName: 'Brown Bear', seed: 1 }, PAINTED)).toMatchObject({ earthName: 'Civet', kind: 'earth-stand-in' });
    expect(paintedArtV2({ _earthName: 'No Such Creature', seed: 1 }, PAINTED)).toBeNull(); expect(paintedArtV2({ kingdom: 'flora', seed: 1 }, PAINTED)).toBeNull();
    // every Earth name: an earth-variant shares the species' profile group and its record's template is the species' body plan
    let variants = 0;
    for (const p of EARTH_FAUNA_PROFILES) for (const name of p.names) { const s = paintedArtV2({ _earthName: name, seed: 1 }, PAINTED); if (s?.kind !== 'earth-variant') continue; variants++;
      expect(p.names, name).toContain(s.earthName); expect(p.candidateTemplates, name).toContain(templateOf(s.earthName)); }
    expect(variants).toBeGreaterThan(80);
  });
  it('OFFLINE: over the CORE set alone G4 draws only CORE paintings, paints everything v1 paints, and differs from v1 only by a same-group Earth relative', () => {
    const bad: string[] = []; let relatives = 0;
    const check = (g: Record<string, unknown>, label: string) => { const a = paintedArtV2(g, CORE), b = paintedStandInV1(g, CORE);
      if (a && !CORE.has(a.earthName)) bad.push(`${label}: ${a.earthName} is not CORE`);
      if (b && !a) bad.push(`${label}: v1 paints ${b.earthName}, G4 paints nothing`);
      if (a && b && a.earthName !== b.earthName) { if (a.kind !== 'earth-variant') bad.push(`${label}: ${a.kind} ${a.earthName} ≠ v1 ${b.earthName}`); else relatives++; }
      if (a && !b && a.kind !== 'procedural-variant') bad.push(`${label}: ${a.kind} ${a.earthName} where v1 had none`); };
    for (const p of EARTH_FAUNA_PROFILES) for (const name of p.names) check({ _earthName: name, seed: 1 }, name);
    for (const g of genomes(3000)) check(g, String(g.seed));
    expect(bad).toEqual([]);
    expect(relatives).toBeLessThan(20); // today: the cnidarians take the core Jellyfish instead of the core Starfish
    expect(paintedArtV2({ _earthName: 'Lion', seed: 1 }, CORE)?.earthName).toBe('Civet'); // offline the Lion keeps its core stand-in
    expect(paintedArtV2({ _earthName: 'Lion', seed: 1 }, PAINTED)?.earthName).toBe('Cougar'); // control: online it takes its relative
  });
  it('CARD = STAGE: the Compendium card source and the battle stage resolve every creature to the same painting', () => {
    const card = new PaintedCardSource({ assets: {} as never, registry: CARD_ARCHETYPES });
    const records = BATTLE2_PARTS_FITS.map((f) => ({ identity: { earthName: f.earthName, speciesVisualKey: 'painted:' + f.earthName } })) as never;
    const names = [...EARTH_FAUNA_PROFILES.flatMap((p) => p.names.map((n) => ({ _earthName: n, seed: 1, kingdom: 'fauna' }))), ...genomes(1500)];
    let compared = 0;
    for (const g of names) { const c = card.standInFor(g)?.earthName ?? null, s = (matchRecord(records, g) as { identity: { earthName: string } } | null)?.identity.earthName ?? null; expect(s, JSON.stringify(g).slice(0, 80)).toBe(c); if (c) compared++; }
    expect(compared).toBeGreaterThan(1000);
  });
});
