// The biosphere scan is one committed receipt: the hazard's strike, who took it, the world's roster opened, the
// civilization's deeds, a Paragon's page, the Charters and the Ascent, or nothing at all.
// LEGACY celestial-frontier.html v1.8.9: the press 14292-14306, `routeHit` 13144-13171, `damageExplorer`
// 19329-19339, `autoScanWorld` 14888-14922.
import { describe, expect, it } from 'vitest';
import { paragonSeedV1 } from '@cf/domain-acquisition/paragon-internal';
import { createSessionRNG } from '@cf/domain-sessionrng';
import { captureGateV1 } from '../src/capture';
import { bioscanGateV1 } from '../src/care';
import { LEASE_TTL_MS, REGISTRY, createSaveRuntime } from '../src/save/index';
import { ADVANCED, CIVILIZED, EARTH_DANGER, EARTH_WOUND, PARAGON_HOME, carePage, clearSession, earthId, heldPage, strikeSession } from './care-support';
import { EARTH } from './capture-support';
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
    expect(state.unlocked).not.toContain('survivor');
    expect(state.scoutId).toBe(earthId(11));
    expect(page.carrierAgrees()).toBe(true);
  });

  it('a strike that would cost the scout its life is not built: the press is refused and nothing is written', async () => {
    const page = await carePage({ sessionSeed: strikeSession(), held: [heldPage(11, { hurt: 0.8 })], scout: earthId(11) });
    const before = await dump(page.backend);
    expect(await page.scan(EARTH)).toMatchObject({ kind: 'refused', detail: 'scout-loss:not-carried' });
    expect(await dump(page.backend)).toEqual(before);
    expect(surveyed(page.live)).toEqual([]);
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

  it('the first scan moves the accepted Discover-life Charter and, away from Sol, the Ascent; in training neither', async () => {
    const civilized = CIVILIZED();
    const page = await carePage({ sessionSeed: clearSession(), change: (state) => { state.chacc = ['st-scan']; state.landed = [civilized.planet.seed]; } });
    const home = await committed(page.scan(EARTH));
    expect(home.facts.charters).toEqual({ progressIds: ['st-scan'], completedIds: ['st-scan'] });
    expect(home.state.chDone).toContain('st-scan');
    expect(home.state.ascProg['c2-scan']).toBeUndefined();
    const away = await committed(page.scan(civilized));
    expect(away.state.ascProg['c2-scan']).toBe(1);

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

  it('at a Paragon\'s home world the Paragon is catalogued: one page more, no creature, no attempt spent', async () => {
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
    // A world with no beast has no danger: the scan read no random value, so the next scan's hazard is the session's first.
    const next = await committed(page.scan(EARTH));
    expect(next.facts.hostile).toBe(createSessionRNG(0xC4A7_0002).at('survey.hazard', 0) < EARTH_DANGER);
    expect(next.facts.paragon).toBeNull();
    expect(next.state.stats.paragons).toBe(1);
  });
});
