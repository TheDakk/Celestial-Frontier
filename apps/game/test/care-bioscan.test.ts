// The biosphere scan is one committed receipt: the hazard's strike, who took it, the world's roster opened, the
// civilization's deeds, a Paragon's page, the Charters and the Ascent, or nothing at all.
// LEGACY celestial-frontier.html v1.8.9: the press 14292-14306, `routeHit` 13144-13171, `damageExplorer`
// 19329-19339, `autoScanWorld` 14888-14922.
import { describe, expect, it } from 'vitest';
import { paragonGenomeV1, paragonSeedV1 } from '@cf/domain-acquisition/paragon-internal';
import { createSessionRNG } from '@cf/domain-sessionrng';
import type { CodexEntry } from '@cf/persistence';
import { captureGateV1 } from '../src/capture';
import { bioscanDangerV1, bioscanFenceV1, bioscanGateV1, bioscanNotices, hazardFlavour } from '../src/care';
import { LEASE_TTL_MS, REGISTRY, createSaveRuntime } from '../src/save/index';
import {
  ADVANCED, CIVILIZED, EARTH_DANGER, EARTH_WOUND, FAR, PARAGON_HOME, VENUS, carePage, clearSession, earthId, heldPage, strikeSession,
} from './care-support';
import { EARTH, earthRows } from './capture-support';
import { SOL, solWorld } from './landing-support';
import { dump } from './save-support';

const committed = async <O extends { kind: string }>(outcome: Promise<O>): Promise<Extract<O, { kind: 'committed' }>> => {
  const settled = await outcome;
  if (settled.kind !== 'committed') throw new Error(`the action was ${settled.kind}: ${JSON.stringify(settled).slice(0, 300)}`);
  return settled as Extract<O, { kind: 'committed' }>;
};
const surveyed = (state: { surveyedSet: readonly unknown[] }) => state.surveyedSet.map(Number);

describe('a clear scan', () => {
  it('writes the surveyed set and the surveys count in one receipt, and opens the world to capture', async () => {
    const page = await carePage({ sessionSeed: clearSession() });
    expect(captureGateV1(page.durable(), page.runtime.extensions, EARTH)).toBe('not-scanned');
    const { state, facts } = await committed(page.scan(EARTH));
    expect(surveyed(state)).toEqual([SOL.earth]);
    expect(state.stats.surveys).toBe(1);
    expect(state.hp).toBe(100);
    expect(state.stats.scanhits ?? 0).toBe(0);
    expect(facts).toMatchObject({ hostile: false, target: 'none', scanned: true, firstScan: true, lifeForms: 19, uncatalogued: 19, dead: false });
    expect(facts.danger.pct).toBe(EARTH_DANGER);
    expect(await page.receipts()).toHaveLength(1);
    expect(page.outcomes.committed).toEqual([{ kind: 'bioscan', receiptOrdinal: 0 }]);
    expect(surveyed(page.live)).toEqual([SOL.earth]);
    expect(captureGateV1(page.durable(), page.runtime.extensions, EARTH)).toBeNull();
  });

  it('counts the pages already held among the life it reveals', async () => {
    const page = await carePage({ sessionSeed: clearSession(), held: [heldPage(11), heldPage(0)] });
    expect((await committed(page.scan(EARTH))).facts).toMatchObject({ lifeForms: 19, uncatalogued: 17 });
  });

  it('a second world raises the count to the size of the set', async () => {
    const page = await carePage({ sessionSeed: clearSession(), change: (state) => { state.surveyedSet = [5, 9] as unknown as string[]; state.stats.surveys = 2; } });
    expect((await committed(page.scan(EARTH))).state.stats.surveys).toBe(3);
  });
});

describe('a strike with no scout', () => {
  it('costs the explorer the wound, counts a scan hit, unlocks survivor, and the scan still completes', async () => {
    const page = await carePage({ sessionSeed: strikeSession() });
    const { state, facts } = await committed(page.scan(EARTH));
    expect(state.hp).toBe(100 - EARTH_WOUND);
    expect(state.stats.scanhits).toBe(1);
    expect(state.unlocked).toContain('survivor');
    expect(state.unlocked).not.toContain('brink');
    expect(surveyed(state)).toEqual([SOL.earth]);
    expect(facts).toMatchObject({ hostile: true, target: 'explorer', damage: EARTH_WOUND, hpBefore: 100, hpAfter: 82, dead: false, scanned: true });
    expect(facts.flavour).toMatch(/^Mid-scan, .+\.$/);
  });

  it('the Reinforced Hull takes a quarter off the wound', async () => {
    const page = await carePage({ sessionSeed: strikeSession(), change: (state) => { state.techOwned = ['hull1']; } });
    expect((await committed(page.scan(EARTH))).state.hp).toBe(100 - Math.round(EARTH_WOUND * 0.75));
  });

  it('a strike that leaves under 20 health unlocks brink', async () => {
    const page = await carePage({ sessionSeed: strikeSession(), change: (state) => { state.hp = 37; } });
    const { state } = await committed(page.scan(EARTH));
    expect(state.hp).toBe(19);
    expect(state.unlocked).toEqual(expect.arrayContaining(['survivor', 'brink']));
  });

  it('a strike that leaves exactly 20 health does not: the brink is under 20 (LEGACY 19337)', async () => {
    const page = await carePage({ sessionSeed: strikeSession(), change: (state) => { state.hp = 20 + EARTH_WOUND; } });
    const { state } = await committed(page.scan(EARTH));
    expect(state.hp).toBe(20);
    expect(state.unlocked).toContain('survivor');
    expect(state.unlocked).not.toContain('brink');
  });

  it('the worn suit cuts the wound by its share, behind the hull as well (LEGACY 13149)', async () => {
    // The Hazmat Suit cuts 0.45: round(18 x 0.55) = 10; behind the Reinforced Hull round(14 x 0.55) = 8.
    const suited = (state: { items: Array<[string, number]>; equip: Record<string, string> }) => { state.items = [['hazmat', 1]]; state.equip = { suit: 'hazmat' }; };
    const page = await carePage({ sessionSeed: strikeSession(), change: (state) => { suited(state); } });
    const { state, facts } = await committed(page.scan(EARTH));
    expect(facts.damage).toBe(10);
    expect(state.hp).toBe(90);
    const hulled = await carePage({ sessionSeed: strikeSession(), change: (state) => { suited(state); state.techOwned = ['hull1']; } });
    expect((await committed(hulled.scan(EARTH))).state.hp).toBe(92);
  });

  it('a venus world is 0.12 more dangerous and its mishap is told in venus words (LEGACY 19284, 19245-19261)', async () => {
    const venus = VENUS();
    const seed = strikeSession();
    const page = await carePage({ sessionSeed: seed, change: (state) => { state.landed = [venus.planet.seed]; } });
    const { state, facts } = await committed(page.scan(venus));
    expect(facts.danger).toEqual({ pct: (350 - 170) / 520 + 0.12, dmg: 65 });
    expect(facts.hostile).toBe(true);
    expect(state.hp).toBe(35);
    expect(facts.flavour).toBe(hazardFlavour('venus', createSessionRNG(seed).at('hazard.flavor', 0)));
    expect([
      'Mid-scan, the acid haze seared your lungs.', 'Mid-scan, a pocket of corrosive cloud closed over you.', 'Mid-scan, the furnace-hot, crushing air overcame you.',
    ]).toContain(facts.flavour);
    // The bonus alone decides this strike: a hazard value between the beast's own danger and the venus danger.
    let between = 0;
    for (let s = 1; s < 4000 && between === 0; s++) { const v = createSessionRNG(s).at('survey.hazard', 0); if (v >= 180 / 520 && v < 180 / 520 + 0.12) between = s; }
    const edge = await carePage({ sessionSeed: between, change: (state) => { state.landed = [venus.planet.seed]; } });
    expect((await committed(edge.scan(venus))).facts.hostile).toBe(true);
  });

  it('a world of another galaxy wounds by that galaxy\'s depth tax, not home\'s (LEGACY 19270-19277, 19286)', async () => {
    const far = FAR();
    const page = await carePage({ sessionSeed: strikeSession(), change: (state) => { state.landed = [far.planet.seed]; } });
    const { state, facts } = await committed(page.scan(far));
    // Power 314 in the outermost region: round((10 + 314 / 22) x 2.5) = 61. At home's 0.8 it would be 19.
    expect(facts.danger).toEqual({ pct: (314 - 170) / 520, dmg: 61 });
    expect(facts.damage).toBe(61);
    expect(state.hp).toBe(39);
  });

  it('a strike that kills completes no scan and is still a strike survived in the record; the save holds the explorer at 1', async () => {
    const page = await carePage({ sessionSeed: strikeSession(), change: (state) => { state.hp = EARTH_WOUND; } });
    const { state, facts } = await committed(page.scan(EARTH));
    expect(facts).toMatchObject({ dead: true, hpAfter: 0, scanned: false, firstScan: false });
    // The save never holds a dead explorer (LEGACY 16783: "never load in dead").
    expect(state.hp).toBe(1);
    expect(surveyed(state)).toEqual([]);
    expect(state.stats.surveys ?? 0).toBe(0);
    expect(state.stats.scanhits).toBe(1);
    expect(state.unlocked).toContain('survivor');
    expect(state.unlocked).not.toContain('brink');
  });
});

describe('a strike with a Field Scout standing', () => {
  it('wounds the scout by the wound over 80, leaves the explorer whole, and the carrier agrees with the Compendium', async () => {
    const page = await carePage({ sessionSeed: strikeSession(), held: [heldPage(11, { hurt: 0.3 })], scout: earthId(11) });
    const { state, facts } = await committed(page.scan(EARTH));
    expect(state.hp).toBe(100);
    expect(page.creature(earthId(11))?.hurt).toBe(0.3 + EARTH_WOUND / 80);
    expect(facts).toMatchObject({ hostile: true, target: 'scout', scanned: true });
    expect(facts.scout).toMatchObject({ id: earthId(11), hurtBefore: 0.3, hurtAfter: 0.3 + EARTH_WOUND / 80, condition: 'Injured' });
    // The strike is counted though the scout took it (LEGACY 14295 counts before the strike is routed).
    expect(state.stats.scanhits).toBe(1);
    expect(state.unlocked).not.toContain('survivor');
    expect(state.scoutId).toBe(earthId(11));
    expect(page.carrierAgrees()).toBe(true);
  });

  it('the scout is named by its Earth name in what the scan says (LEGACY 14774, 13163)', async () => {
    const civet = earthRows().findIndex((row) => row._earthName === 'Civet');
    expect(civet).toBeGreaterThanOrEqual(11);
    const page = await carePage({ sessionSeed: strikeSession(), held: [heldPage(civet)], scout: earthId(civet) });
    // The page was stored and read back before the press: it is still the Civet's.
    expect(page.durable().codex.find(([id]) => id === earthId(civet))?.[1].name).toBe('Civet');
    const { facts } = await committed(page.scan(EARTH));
    expect(facts.scout?.name).toBe('Civet');
    expect(bioscanNotices(facts)[0]).toMatchObject({
      title: 'Scout Wounded', message: ['Civet took the strike meant for you — now Bruised (23% hurt). Feed it flora it loves to mend.'],
    });
  });

  it('a strike that would cost the scout its life is not built: the press is refused and nothing is written', async () => {
    const page = await carePage({ sessionSeed: strikeSession(), held: [heldPage(11, { hurt: 0.8 })], scout: earthId(11) });
    const before = await dump(page.backend);
    expect(await page.scan(EARTH)).toMatchObject({ kind: 'refused', detail: 'scout-loss:not-carried' });
    expect(await dump(page.backend)).toEqual(before);
    expect(surveyed(page.live)).toEqual([]);
  });

  // What stands today, until Dakk decides how the save carries a scout's death. The legacy game removes the scout
  // and the scan goes on (13154-13159). Here the refusal reads no random value, so the session's next hazard value
  // is still unread: the player learns that it strikes, and the next press, here or on any world, meets it.
  it('the refused press consumes no roll and takes no receipt, however often it is made; the same strike waits for the next press', async () => {
    const seed = strikeSession();
    const page = await carePage({ sessionSeed: seed, held: [heldPage(11, { hurt: 0.8 }), heldPage(12)], scout: earthId(11) });
    const before = await dump(page.backend);
    for (let press = 0; press < 3; press++) {
      expect(await page.scan(EARTH)).toMatchObject({ kind: 'refused', detail: 'scout-loss:not-carried', transaction: { kind: 'rejected' } });
    }
    expect(page.runtime.diagnostics().sessionDraws).toEqual({});
    expect(await page.receipts()).toEqual([]);
    expect(await dump(page.backend)).toEqual(before);
    expect(page.outcomes.committed).toEqual([]);
    // A healthy beast named the scout in its place takes that very strike: the session's first hazard value.
    await committed(page.scout(earthId(12)));
    const { facts } = await committed(page.scan(EARTH));
    expect(facts).toMatchObject({ hostile: true, target: 'scout', scanned: true });
    expect(facts.scout).toMatchObject({ id: earthId(12), hurtBefore: 0, hurtAfter: EARTH_WOUND / 80 });
    expect(createSessionRNG(seed).at('survey.hazard', 0)).toBeLessThan(EARTH_DANGER);
    expect(page.runtime.diagnostics().sessionDraws).toEqual({ 'survey.hazard': 1, 'hazard.flavor': 1 });
  });
});

describe('the gates of a scan', () => {
  it('a world not stood on, a world with no life and a world already revealed are refused, and nothing is written', async () => {
    const page = await carePage({ sessionSeed: clearSession(), change: (state) => { state.landed = [SOL.mars]; } });
    const before = await dump(page.backend);
    expect(await page.scan(CIVILIZED())).toMatchObject({ kind: 'refused', detail: 'not-landed' });
    expect(await page.scan(solWorld(SOL.mars))).toMatchObject({ kind: 'refused', detail: 'no-life' });
    expect(await dump(page.backend)).toEqual(before);
    await committed(page.scan(EARTH));
    const after = await dump(page.backend);
    expect(await page.scan(EARTH)).toMatchObject({ kind: 'refused', detail: 'already-revealed' });
    expect(await dump(page.backend)).toEqual(after);
    expect(bioscanGateV1(page.durable(), page.runtime.extensions, EARTH)).toBe('already-revealed');
  });

  it('a world whose every species the Compendium already holds is revealed already, scanned or not (LEGACY 13719)', async () => {
    const all = earthRows().map((_, index) => heldPage(index));
    const page = await carePage({ sessionSeed: clearSession(), held: all });
    expect(page.durable().codex).toHaveLength(19);
    expect(surveyed(page.durable())).toEqual([]);
    const before = await dump(page.backend);
    expect(bioscanGateV1(page.durable(), page.runtime.extensions, EARTH)).toBe('already-revealed');
    expect(await page.scan(EARTH)).toMatchObject({ kind: 'refused', detail: 'already-revealed' });
    expect(await dump(page.backend)).toEqual(before);
    // One species short of all of them, the row stands.
    const short = await carePage({ sessionSeed: clearSession(), held: all.slice(1) });
    expect(bioscanGateV1(short.durable(), short.runtime.extensions, EARTH)).toBeNull();
    expect((await committed(short.scan(EARTH))).facts).toMatchObject({ lifeForms: 19, uncatalogued: 1 });
  });

  it('a conquered world is safe to scan: no random value is read', async () => {
    const world = CIVILIZED();
    const page = await carePage({ sessionSeed: strikeSession(), change: (state) => { state.conquered = [[world.planet.seed, { t: 0, tier: 1 }]]; } });
    const { facts } = await committed(page.scan(world));
    expect(facts).toMatchObject({ hostile: false, rolled: false });
    expect(page.runtime.diagnostics().sessionDraws).toEqual({});
  });

  it('a scan with danger reads the hazard value and the flavour value, once each', async () => {
    const page = await carePage({ sessionSeed: clearSession() });
    await committed(page.scan(EARTH));
    expect(page.runtime.diagnostics().sessionDraws).toEqual({ 'survey.hazard': 1, 'hazard.flavor': 1 });
  });

  it('a scan after the lease is lost writes nothing and says refused', async () => {
    const page = await carePage({ sessionSeed: clearSession() });
    const successor = createSaveRuntime({
      backend: page.backend, registry: REGISTRY, initialRevision: page.runtime.revision, initialExtensions: page.runtime.extensions,
      initialState: page.durable(), restoredAuthority: null, freshSessionSeed: 9,
      ownerId: 'tab', token: 'document-b', leaseTtlMs: LEASE_TTL_MS, now: page.time.now, visible: true, answerable: true,
    });
    await successor.heartbeat();
    page.time.advance(LEASE_TTL_MS + 1);
    await expect(successor.heartbeat()).resolves.toMatchObject({ kind: 'owned' });
    const before = await dump(page.backend);
    expect(await page.scan(EARTH)).toMatchObject({ kind: 'refused', detail: 'lost' });
    expect(await dump(page.backend)).toEqual(before);
    expect(page.outcomes.refused).toEqual([{ kind: 'bioscan', reason: 'lost' }]);
  });
});

describe('a press is held to the row the player was shown', () => {
  it('a press after the epoch turned is refused: nothing is written and no value is read', async () => {
    const venus = VENUS();
    const page = await carePage({ sessionSeed: strikeSession(), change: (state) => { state.landed = [venus.planet.seed]; state.EPOCH_BASE = 1; } });
    // The row as it stood an epoch ago: another beast, another danger.
    const then = { ...page.durable(), EPOCH_BASE: 0 };
    expect(bioscanDangerV1(then, venus)).toMatchObject({ pct: (350 - 170) / 520 + 0.12, dmg: 65 });
    expect(bioscanDangerV1(page.durable(), venus)).toMatchObject({ pct: (279 - 170) / 520 + 0.12, dmg: 57 });
    const before = await dump(page.backend);
    expect(await page.scan(venus, bioscanFenceV1(then, venus))).toEqual({ kind: 'refused', detail: 'presentation:changed', transaction: null });
    expect(await dump(page.backend)).toEqual(before);
    expect(page.runtime.diagnostics().sessionDraws).toEqual({});
    expect(await page.receipts()).toEqual([]);
    // Earth's danger is the same at every epoch; the old row is refused all the same.
    expect(bioscanDangerV1(then, EARTH)).toEqual(bioscanDangerV1(page.durable(), EARTH));
    expect(await page.scan(EARTH, bioscanFenceV1(then, EARTH))).toMatchObject({ kind: 'refused', detail: 'presentation:changed' });
    expect(await dump(page.backend)).toEqual(before);
  });

  it('the roll is made at the danger the row showed (LEGACY 14293), and at no other', async () => {
    const venus = VENUS();
    const page = await carePage({ sessionSeed: strikeSession(), change: (state) => { state.landed = [venus.planet.seed]; state.EPOCH_BASE = 1; } });
    const shown = bioscanDangerV1(page.durable(), venus);
    const fence = page.fence(venus);
    const { facts } = await committed(page.scan(venus, fence));
    expect(facts.danger).toEqual({ pct: shown.pct, dmg: shown.dmg });
    expect(facts.damage).toBe(57);
    // A row shown with danger, pressed after the world was conquered and its danger gone: refused, not rolled at either.
    const world = CIVILIZED();
    const settled = await carePage({ sessionSeed: strikeSession(), change: (state) => { state.conquered = [[world.planet.seed, { t: 0, tier: 1 }]]; } });
    const dangerous = bioscanFenceV1({ ...settled.durable(), conquered: [] }, world);
    expect(dangerous).not.toBe(settled.fence(world));
    const before = await dump(settled.backend);
    expect(await settled.scan(world, dangerous)).toMatchObject({ kind: 'refused', detail: 'presentation:changed' });
    expect(await dump(settled.backend)).toEqual(before);
  });
});

describe('what a completed scan leads to', () => {
  it('a civilized world unlocks civ; a spacefaring one unlocks spacefar as well', async () => {
    const [civilized, advanced] = [CIVILIZED(), ADVANCED()];
    const page = await carePage({ sessionSeed: clearSession(), change: (state) => { state.landed = [civilized.planet.seed, advanced.planet.seed]; } });
    const first = await committed(page.scan(civilized));
    expect(first.state.unlocked).toContain('civ');
    expect(first.state.unlocked).not.toContain('spacefar');
    expect(first.facts.achievementIds).toContain('civ');
    const second = await committed(page.scan(advanced));
    expect(second.state.unlocked).toEqual(expect.arrayContaining(['civ', 'spacefar']));
  });

  it('Earth, whose badge is Home, unlocks neither', async () => {
    const page = await carePage({ sessionSeed: clearSession() });
    const { state } = await committed(page.scan(EARTH));
    expect(state.unlocked).not.toContain('civ');
  });

  it('the first scan moves the accepted Discover-life Charter and the Ascent, on Earth as on any world; in training neither', async () => {
    const civilized = CIVILIZED();
    const page = await carePage({ sessionSeed: clearSession(), change: (state) => { state.chacc = ['st-scan']; state.landed = [civilized.planet.seed]; } });
    const home = await committed(page.scan(EARTH));
    expect(home.facts.charters).toEqual({ progressIds: ['st-scan'], completedIds: ['st-scan'] });
    expect(home.state.chDone).toContain('st-scan');
    // LEGACY 25232: `c2-scan` has no place filter (its neighbour `c2-land`, 25231, has one), so Earth's scan is 1 of 2.
    expect(home.state.ascProg['c2-scan']).toBe(1);
    const away = await committed(page.scan(civilized));
    expect(away.state.ascProg['c2-scan']).toBe(2);

    const training = await carePage({ sessionSeed: clearSession(), change: (state) => { state.tutDone = false; state.chacc = ['st-scan']; } });
    const lesson = await committed(training.scan(EARTH));
    expect(lesson.facts.charters).toEqual({ progressIds: [], completedIds: [] });
    expect(lesson.state.chDone).toEqual([]);
    expect(surveyed(lesson.state)).toEqual([SOL.earth]);
    // LEGACY 25285: the Ascent hears nothing in training, an alien world's scan included.
    const far = await carePage({ sessionSeed: clearSession(), change: (state) => { state.tutDone = false; state.landed = [civilized.planet.seed]; } });
    const alien = await committed(far.scan(civilized));
    expect(surveyed(alien.state)).toEqual([civilized.planet.seed]);
    expect(alien.state.ascProg['c2-scan']).toBeUndefined();
  });

  it('at a Paragon\'s home world the Paragon is catalogued: one page more, a whole beast, no attempt spent', async () => {
    const home = PARAGON_HOME();
    const page = await carePage({ change: (state) => { state.landed = [home.planet.seed]; } });
    const { state, facts } = await committed(page.scan(home));
    const id = `s${paragonSeedV1(0)}`;
    expect(facts.paragon).toMatchObject({ index: 0, speciesId: id });
    expect(state.stats.paragons).toBe(1);
    const entry = state.codex.find(([held]) => held === id)?.[1];
    expect(entry).toMatchObject({ id, kind: 'Fauna', from: 'Paragon site #1', hybrid: false });
    expect(entry?.name).toBe(facts.paragon?.name);
    expect(state.stats.best).toBe(facts.paragon?.tier);
    // The page raises the best find before the achievements are looked at (LEGACY 16476-16480): a Paragon is
    // Rare or better, so Deep Find is earned by this very scan.
    expect(facts.paragon!.tier).toBeGreaterThanOrEqual(3);
    expect(facts.achievementIds).toContain('rare');
    expect(state.bioX).toEqual([]);
    expect(state.codex).toHaveLength(1);
    expect(page.carrierAgrees()).toBe(true);
    // A Paragon is a beast like any other (LEGACY 14904-14917 stores it with `_storeSpecies`): it can be named the
    // Field Scout (15150), and then it is the one that takes the next strike.
    expect(await committed(page.scout(id))).toMatchObject({ facts: { scoutAfter: id, named: true } });
    expect(page.durable().scoutId).toBe(id);
    expect(page.carrierAgrees()).toBe(true);
    await committed(page.scout(id));
    // A world with no beast has no danger: the scan read no random value, so the next scan's hazard is the session's first.
    const next = await committed(page.scan(EARTH));
    expect(next.facts.hostile).toBe(createSessionRNG(0xC4A7_0002).at('survey.hazard', 0) < EARTH_DANGER);
    expect(next.facts.paragon).toBeNull();
    expect(next.state.stats.paragons).toBe(1);
  });

  it('a Paragon the Compendium already holds is not catalogued or counted again (LEGACY 14909)', async () => {
    const home = PARAGON_HOME();
    const genome = paragonGenomeV1(0) as unknown as Record<string, unknown>;
    const id = `s${paragonSeedV1(0)}`;
    const held: [string, CodexEntry] = [id, { id, name: 'A Paragon', kind: 'Fauna', tier: 8, realm: 'land', sapient: 0, from: 'Paragon site #1', hybrid: false, g: genome, where: null }];
    const page = await carePage({ held: [held], change: (state) => { state.landed = [home.planet.seed]; state.stats.paragons = 3; } });
    expect(page.durable().codex.map(([page]) => page)).toEqual([id]);
    const { state, facts } = await committed(page.scan(home));
    expect(facts.scanned).toBe(true);
    expect(facts.paragon).toBeNull();
    expect(state.stats.paragons).toBe(3);
    expect(state.codex.map(([page]) => page)).toEqual([id]);
    expect(page.carrierAgrees()).toBe(true);
  });
});
