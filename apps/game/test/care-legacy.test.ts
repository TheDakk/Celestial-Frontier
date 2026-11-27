// The biosphere scan's rules against the legacy game's own answers. fixtures/v1/recorded/care-field.json was
// recorded from the legacy game (tools/record-v1-fixtures.mjs, `care-field`): `dangerOf` 19278-19288, `depthTax`
// 19270-19277, `hazardFlavor` 19245-19261, `creatureCondition` 18886-18892, `routeHit` 13144-13171,
// `damageExplorer` 19329-19339, the press of Discover Life 14292-14306, `awardXP` 18224-18234, `discoverSpecies`
// 14924-14953 and `paragonWhere` 15380-15404.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { regionAt } from '@cf/domain-strays';
import { HOME_POS, UCELL } from '@cf/domain-worldconfig';
import {
  bioscanDanger, bioscanNotices, creatureCondition, depthTax, depthTaxOf, discoverLifeRow, hazardFlavour, paragonIndexAt, paragonSite, renameNotice,
  resolveBioscanPress, revealBiosphere, routeStrike, scoutNotice, SCOUT_BUTTON, type BioscanFactsV1, type BioscanPressResolution, type CareNotice,
} from '../src/care';
import { scoutLessonXp } from '../src/capture';

type Notes = Array<[string, unknown]>;
type Place = 'home' | 'none' | number;
interface Held { hp: number; scout: string | null; surveyed: number[]; stats: Record<string, number>; genomes: Array<[string, { hurt?: number; xp?: number }]>; notes: Notes }
interface PressInput {
  name: string; seed: number; ptype: string; place: Place; powers: number[]; hp: number; values: number[]; settled?: boolean; tech?: string[];
  suit?: number; scoutHurt?: number; surveyed?: number[]; stats?: Record<string, number>; sites?: Array<[number, number]>; known?: string[]; badge?: string;
}
type Case =
  | { group: 'paragon-site'; input: { index: number }; output: { gal: Record<string, unknown>; star: { x: number; y: number; seed: number }; pseed: number } | null }
  | { group: 'danger'; input: { powers: number[]; ptype: string; place: Place; settled: boolean }; output: { pct: number; dmg: number; top: number } }
  | { group: 'danger-none'; input: { species: string }; output: { pct: number; dmg: number } }
  | { group: 'flavor'; input: { ptype: string; value: number }; output: string }
  | { group: 'condition'; input: { hurt: number | null }; output: { h: number; label: string } }
  | { group: 'route'; input: { dmg: number; suit: number; hp: number; scoutHurt: number | null }; output: Held & { dead: boolean } }
  | { group: 'route-other'; input: { name: string; dmg: number }; output: Held & { dead: boolean } }
  | { group: 'press'; input: PressInput; output: Held & { unread: number } }
  | { group: 'xp'; input: { xp?: number | null; n: number; kind?: string }; output: { xp: number | null; level: number } }
  | { group: 'discover'; input: { name: string; scout: string | null; known?: boolean; scoutKind?: string }; output: { scoutXp: number | null } };
const fixture = JSON.parse(readFileSync(new URL('../../../fixtures/v1/recorded/care-field.json', import.meta.url), 'utf8')) as { cases: Case[] };
const group = <G extends Case['group']>(name: G) => fixture.cases.filter((c) => c.group === name) as Array<Extract<Case, { group: G }>>;

const HOME = { seed: 999, x: 90, y: -60 };
/** The depth tax of a recorded place: the home galaxy, no place, or a region the legacy `regionAt` was made to give. */
const taxOf = (place: Place): number => place === 'home' ? depthTaxOf(true, null) : place === 'none' ? depthTaxOf(false, null) : depthTaxOf(false, place);
const said = (notes: Notes, kind: string): unknown[] => notes.filter(([k]) => k === kind).map(([, value]) => value);

describe('the scan hazard against the legacy game', () => {
  it('the fixture holds every group it was recorded with', () => {
    expect(Object.fromEntries([...new Set(fixture.cases.map((c) => c.group))].map((name) => [name, group(name).length]))).toEqual({
      'paragon-site': 50, danger: 936, 'danger-none': 2, flavor: 54, condition: 11, route: 480, 'route-other': 2, press: 55, xp: 10, discover: 8,
    });
  });

  it('the danger of a world is the legacy game\'s for all 936 recorded worlds, and a world with no beast has none', () => {
    for (const { input, output } of group('danger')) {
      const got = bioscanDanger({ powers: input.powers, planetType: input.ptype, settled: input.settled, depthTax: taxOf(input.place) });
      expect([got.pct, got.dmg, got.top], JSON.stringify(input)).toEqual([output.pct, output.dmg, output.top]);
    }
    for (const { output } of group('danger-none')) {
      const got = bioscanDanger({ powers: [], planetType: 'terran', settled: false, depthTax: taxOf('home') });
      expect([got.pct, got.dmg]).toEqual([output.pct, output.dmg]);
    }
  });

  it('the depth tax is 0.8 at home and climbs by region to 2.5, as the universe places its galaxies', () => {
    expect(depthTax(HOME)).toBe(0.8);
    expect(depthTax(null)).toBe(1);
    const seen = new Map<number, number>();
    for (let k = 0; k < 80; k++) { const x = HOME_POS.x + k * UCELL * 0.5; seen.set(regionAt(x, HOME_POS.y), depthTax({ seed: 5, x, y: HOME_POS.y })); }
    expect([...seen.entries()].sort((a, b) => a[0] - b[0])).toEqual([[0, 1], [1, 1.3], [2, 1.6], [3, 1.9], [4, 2.2], [5, 2.5]]);
  });

  it('the words of a mishap are the legacy game\'s for all 54 recorded draws', () => {
    for (const { input, output } of group('flavor')) expect(hazardFlavour(input.ptype, input.value), JSON.stringify(input)).toBe(output);
  });

  it('a creature\'s condition is named as the legacy game names it', () => {
    for (const { input, output } of group('condition')) {
      const got = creatureCondition(input.hurt);
      expect([got.h, got.label], String(input.hurt)).toEqual([output.h, output.label]);
    }
  });

  it('a strike is cut by the suit and taken by the scout or the explorer as in all 480 recorded strikes, with what it unlocks', () => {
    let brinks = 0;
    for (const { input, output } of group('route')) {
      const got = routeStrike({ dmg: input.dmg, suitCut: input.suit, hp: input.hp, scoutHurt: input.scoutHurt });
      const label = JSON.stringify(input);
      expect(got.hpAfter, label).toBe(output.hp);
      expect(got.dead, label).toBe(output.dead);
      expect(got.target, label).toBe(input.scoutHurt === null ? 'explorer' : 'scout');
      // What the legacy game unlocked, in its order: `brink` under 20 health and alive, then `survivor`; nothing for a scout.
      expect(got.unlocks, label).toEqual(said(output.notes, 'unlock'));
      if (got.unlocks.includes('brink')) brinks++;
      expect(got.scoutLost, label).toBe(said(output.notes, 'removed').length === 1);
      if (got.scoutLost) expect(said(output.notes, 'removed'), label).toEqual(['s4000']);
      else if (input.scoutHurt !== null) expect(got.scoutHurtAfter, label).toBe(output.genomes[0]?.[1].hurt);
      else expect(got.scoutHurtAfter, label).toBeNull();
    }
    // The fixture holds the edge itself: 21 health less 1 leaves 20 and no `brink`; 20 less 1 leaves 19 and unlocks it.
    const at = (hp: number) => group('route').find((c) => c.input.dmg === 1 && c.input.suit === 0 && c.input.hp === hp && c.input.scoutHurt === null)!;
    expect([at(21).output.hp, said(at(21).output.notes, 'unlock')]).toEqual([20, ['survivor']]);
    expect([at(20).output.hp, said(at(20).output.notes, 'unlock')]).toEqual([19, ['brink', 'survivor']]);
    expect(brinks).toBeGreaterThan(20);
  });

  it('with no beast for a scout the explorer takes the strike, as in the two recorded cases of a scout that is a plant or gone', () => {
    // The save's carrier cannot name a plant or a missing creature the scout, so the action finds no scout there.
    for (const { input, output } of group('route-other')) {
      const got = routeStrike({ dmg: input.dmg, suitCut: 0, hp: 100, scoutHurt: null });
      expect([got.target, got.hpAfter, got.dead, got.unlocks], input.name).toEqual(['explorer', output.hp, output.dead, said(output.notes, 'unlock')]);
      expect(said(output.notes, 'removed'), input.name).toEqual([]);
    }
  });

  it('every one of the 55 recorded presses of Discover Life is resolved as the legacy game resolved it', () => {
    for (const { input, output } of group('press')) {
      const danger = bioscanDanger({ powers: input.powers, planetType: input.ptype, settled: input.settled === true, depthTax: taxOf(input.place) });
      const got: BioscanPressResolution = resolveBioscanPress({
        danger, planetType: input.ptype, draws: input.values, reinforcedHull: (input.tech ?? []).includes('hull1'), suitCut: input.suit ?? 0,
        hp: input.hp, scoutHurt: input.scoutHurt ?? null,
      });
      const label = JSON.stringify(input);
      // The legacy game reads a random value only when there is danger, and a second only when the first struck.
      expect(got.drawsRead, label).toBe(input.values.length - output.unread);
      expect(got.hpAfter, label).toBe(output.hp);
      expect(got.hostile ? 1 : 0, label).toBe((output.stats.scanhits ?? 0) - (input.stats?.scanhits ?? 0));
      expect(got.scanCompletes, label).toBe(output.surveyed.includes(input.seed));
      expect(got.dead, label).toBe(said(output.notes, 'death').length === 1);
      if (got.dead) expect(said(output.notes, 'death'), label).toEqual([got.flavour]);
      expect(got.target === 'explorer', label).toBe(said(output.notes, 'unlock').includes('survivor'));
      if (input.scoutHurt != null) {
        const lost = said(output.notes, 'removed').includes('s4000');
        expect(got.target === 'scout' && got.scoutLost, label).toBe(lost);
        if (!lost) expect(got.scoutHurtAfter ?? input.scoutHurt, label).toBe(output.genomes.find(([id]) => id === 's4000')?.[1].hurt ?? 0);
      }
    }
  });

  it('what each of the 55 recorded presses unlocked, counted, said to the Charters and catalogued is what the legacy game did', () => {
    const seen = { civ: 0, spacefar: 0, brink: 0, deeds: 0, quiet: 0, stored: 0, held: 0, unscanned: 0 };
    for (const { input, output } of group('press')) {
      const danger = bioscanDanger({ powers: input.powers, planetType: input.ptype, settled: input.settled === true, depthTax: taxOf(input.place) });
      const strike = resolveBioscanPress({
        danger, planetType: input.ptype, draws: input.values, reinforcedHull: (input.tech ?? []).includes('hull1'), suitCut: input.suit ?? 0,
        hp: input.hp, scoutHurt: input.scoutHurt ?? null,
      });
      const label = JSON.stringify(input);
      // The recorder's Paragon table is the case's own; its Paragon i has seed 9000 + i.
      const site = (input.sites ?? []).find(([seed]) => seed === input.seed);
      const before = { surveyed: input.surveyed ?? [], surveys: (input.surveyed ?? []).length, paragons: input.stats?.paragons ?? 0 };
      const reveal = !strike.scanCompletes ? null : revealBiosphere({
        planetSeed: input.seed, surveyed: before.surveyed, surveys: before.surveys, badge: input.badge ?? null,
        paragon: site === undefined ? null : { index: site[1], held: (input.known ?? []).includes(`s${9000 + site[1]}`) }, paragons: before.paragons,
      });
      // Everything the legacy game unlocked, in its order: the strike's, then the civilization's.
      expect([...strike.unlocks, ...(reveal?.unlocks ?? [])], label).toEqual(said(output.notes, 'unlock'));
      // The `bioscan` deed is said once, by a world new to the surveyed set, and by no other press.
      expect(reveal?.firstScan === true ? ['bioscan'] : [], label).toEqual(said(output.notes, 'event'));
      expect(reveal?.surveyed ?? before.surveyed, label).toEqual(output.surveyed);
      expect(reveal?.surveys ?? before.surveys, label).toBe(output.stats.surveys);
      // A Paragon is stored at its home unless the Compendium holds it, as "Paragon site #N", and only then counted.
      expect(reveal == null || reveal.paragon === null ? [] : [[`s${9000 + reveal.paragon}`, `Paragon site #${reveal.paragon + 1}`]], label).toEqual(said(output.notes, 'stored'));
      expect(reveal?.paragons ?? before.paragons, label).toBe(output.stats.paragons ?? 0);
      for (const id of said(output.notes, 'unlock')) if (id === 'civ' || id === 'spacefar' || id === 'brink') seen[id]++;
      if (reveal === null) seen.unscanned++; else if (reveal.firstScan) seen.deeds++; else seen.quiet++;
      if (reveal != null && reveal.paragon !== null) seen.stored++;
      if (site !== undefined && reveal != null && reveal.paragon === null) seen.held++;
    }
    // The fixture holds each answer both ways, so none of the comparisons above is empty.
    expect(seen).toEqual({ civ: 2, spacefar: 1, brink: 4, deeds: 50, quiet: 1, stored: 3, held: 1, unscanned: 4 });
  });

  it('what a scan says is what the legacy game said, for every recorded press', () => {
    // The legacy game drew a small picture before some titles and a heart in one line; an icon stands for each here.
    const PICTURE = /^[\p{Extended_Pictographic}\uFE0F]+ /u;
    const legacyWords = (text: string) => text.replace(/<\/?b>/g, '');
    const words = (notices: readonly CareNotice[]) => notices.map((notice) => [
      notice.icon !== null, notice.title, notice.message.map((part) => typeof part === 'string' ? part : part.icon === 'heart' ? '\u2764' : `{${part.icon}}`).join(''),
    ]);
    let compared = 0;
    for (const { input, output } of group('press')) {
      const danger = bioscanDanger({ powers: input.powers, planetType: input.ptype, settled: input.settled === true, depthTax: taxOf(input.place) });
      const got = resolveBioscanPress({
        danger, planetType: input.ptype, draws: input.values, reinforcedHull: (input.tech ?? []).includes('hull1'), suitCut: input.suit ?? 0,
        hp: input.hp, scoutHurt: input.scoutHurt ?? null,
      });
      const known = new Set(input.known ?? []);
      const lifeForms = input.powers.length + 1;
      const facts = {
        hostile: got.hostile, damage: got.damage, flavour: got.flavour, target: got.target, hpAfter: got.hpAfter, dead: got.dead, scanned: got.scanCompletes,
        scout: got.target !== 'scout' ? null : got.scoutLost
          ? { id: 's4000', name: 'Scout', hurtBefore: input.scoutHurt!, hurtAfter: null, condition: null, lost: true }
          : { id: 's4000', name: 'Scout', hurtBefore: input.scoutHurt!, hurtAfter: got.scoutHurtAfter, condition: creatureCondition(got.scoutHurtAfter).label, lost: false },
        // The legacy game has no Rest, so no recorded press met a resting scout.
        scoutResting: null,
        lifeForms, uncatalogued: lifeForms - [...known].filter((id) => id === 's3000' || /^s200\d$/.test(id)).length,
      } as unknown as BioscanFactsV1;
      expect(words(bioscanNotices(facts)), JSON.stringify(input))
        .toEqual((said(output.notes, 'toast') as Array<[string, string]>).map(([title, text]) => [PICTURE.test(title), title.replace(PICTURE, ''), legacyWords(text)]));
      compared++;
    }
    expect(compared).toBe(55);
    // Four of them cost the scout its life, and say so.
    expect(group('press').filter(({ output }) => (said(output.notes, 'toast') as Array<[string, string]>).some(([title]) => title.endsWith('Scout Lost')))).toHaveLength(4);
  });

  it('the row, the Scout button and the rename say the legacy words', () => {
    expect(discoverLifeRow(19, { pct: 114 / 520, dmg: 18, top: 284 })).toEqual({
      label: 'Discover Life', text: '19 life forms detected', danger: '22% danger',
      tip: 'Hostile wildlife may wound you for 18 HP — conquer the world first to discover life safely',
    });
    expect(discoverLifeRow(4, { pct: 0, dmg: 0, top: 0 })).toMatchObject({ danger: null, tip: 'Discover & catalogue this world’s species' });
    expect(SCOUT_BUTTON).toEqual({
      label: 'Scout', standing: 'Scouting',
      tip: 'Your Field Scout takes the hit when a bioscan turns hostile — wounds and all. A scout with nothing left is lost forever.',
    });
    expect(scoutNotice('Civet', { named: true, resting: false })).toEqual({ icon: 'scout', title: 'Field Scout', message: ['Civet now walks point — it takes the hit when a bioscan turns hostile.'] });
    expect(scoutNotice('Civet', { named: false, resting: false }).message).toEqual(['Civet stands down. Hostile scans risk your own HP again.']);
    expect(renameNotice({ speciesId: 's1', name: 'Rex', achievementIds: [] })).toEqual({
      icon: null, title: 'Renamed', message: ['Rex it is — the name travels inside its creature code too.'],
    });
  });
});

describe('the scout\'s lesson against the legacy game', () => {
  it('experience is added as the legacy game adds it, to a beast only', () => {
    for (const { input, output } of group('xp')) {
      if (input.kind === 'Flora') { expect(output.xp).toBeNull(); continue; }
      // The save holds a creature's experience to 486, where the ninth and last level is reached (`levelOf` 17567).
      expect(scoutLessonXp(input.xp ?? null, input.n), JSON.stringify(input)).toBe(Math.min(486, output.xp!));
    }
  });
  // The recorded `discover` cases are compared where the lesson is made: through a capture, in care-scout.test.ts.
});

describe('the Fifty Paragons against the legacy game', () => {
  it('each of the 50 home worlds is the one the legacy game walks to', () => {
    const sites = group('paragon-site');
    expect(sites).toHaveLength(50);
    for (const { input, output } of sites) {
      const site = paragonSite(input.index);
      expect(site === null ? null : { gal: site.galaxy, star: site.star, pseed: site.planetSeed }, String(input.index))
        .toEqual(output === null ? null : { gal: output.gal, star: output.star, pseed: output.pseed });
    }
  });

  it('a world is a Paragon\'s home by its planet seed, and no other world is', () => {
    const sites = group('paragon-site');
    for (const { input, output } of sites) expect(paragonIndexAt(output!.pseed)).toBe(input.index);
    expect(new Set(sites.map((c) => c.output!.pseed)).size).toBe(50);
    expect(paragonIndexAt(133)).toBeNull();
    expect(paragonIndexAt(sites[0]!.output!.pseed + 1)).toBeNull();
  });
});
