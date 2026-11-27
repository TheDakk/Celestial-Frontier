// Bond and Rest, by Dakk's decision D13 (2026-09-25; BREEDING_AND_SHARING.md, "v2 companion care and bond").
// The legacy game has neither: its wounds never fade on their own (its guide, 19430).
import { describe, expect, it } from 'vitest';
import {
  BOND_LEVELS, REST_ACTION, bondOf, companionCareV1, companionLock, restMinutes, restNotice, settleRestV1,
  type CareAuthority, type CareCommitted, type CareDoor, type CareTransaction,
} from '../src/care';
import type { SaveStateV2 } from '@cf/persistence';
import { carePage, earthId, heldPage, type CarePage } from './care-support';
import { NOW, dump } from './save-support';

const committed = async <O extends { kind: string }>(outcome: Promise<O>): Promise<Extract<O, { kind: 'committed' }>> => {
  const settled = await outcome;
  if (settled.kind !== 'committed') throw new Error(`the action was ${settled.kind}: ${JSON.stringify(settled).slice(0, 300)}`);
  return settled as Extract<O, { kind: 'committed' }>;
};
const PLATYPUS = earthId(11);
const PERSIMMON = earthId(0);
const MINUTE = 60_000;
const beast = (page: CarePage) => page.ownership().creatures.find((row) => `s${String(row.genome.seed)}` === PLATYPUS)!;

describe('bond and Rest, by Dakk\'s decision D13', () => {
  it('"Bond levels 0–5 (Wary 0, Familiar 3, Trusted 8, Devoted 15, Kindred 25, Soulbound 40 memories)"', () => {
    expect(BOND_LEVELS.map(({ level, name, memories }) => [level, name, memories])).toEqual([
      [0, 'Wary', 0], [1, 'Familiar', 3], [2, 'Trusted', 8], [3, 'Devoted', 15], [4, 'Kindred', 25], [5, 'Soulbound', 40],
    ]);
    const levels = [0, 1, 2, 3, 7, 8, 14, 15, 24, 25, 39, 40, 128].map((count) => bondOf(count).level);
    expect(levels).toEqual([0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
    expect(bondOf(2)).toMatchObject({ level: 0, name: 'Wary', memories: 2, next: { level: 1, name: 'Familiar', memories: 3, remaining: 1 } });
    expect(bondOf(40)).toMatchObject({ level: 5, name: 'Soulbound', next: null });
  });

  it('"2 active minutes per 0.1 hurt, rounded up, at most 20"', () => {
    expect([0, 0.01, 0.1, 0.11, 0.2, 0.3, 0.35, 0.5, 0.6, 0.85, 0.95, 1].map((hurt) => restMinutes(hurt)))
      .toEqual([0, 2, 2, 4, 4, 6, 8, 10, 12, 18, 20, 20]);
    expect(restMinutes(null)).toBe(0);
  });
});

describe('Rest', () => {
  it('"One receipt SEALS the heal (hurt → 0) and assigns … readyAt = the committed active-play snapshot + the duration"', async () => {
    const page = await carePage({ activePlayMs: 5 * MINUTE, held: [heldPage(11, { hurt: 0.35 })] });
    const { state, facts } = await committed(page.rest(PLATYPUS));
    const at = page.runtime.activePlayMs();
    // 0.35 hurt is four tenths rounded up: eight minutes of play.
    expect(facts).toMatchObject({ speciesId: PLATYPUS, name: 'Platypus', hurtBefore: 0.35, minutes: 8, startedAtActivePlayMs: at, readyAtActivePlayMs: at + 8 * MINUTE });
    expect(at).toBeGreaterThanOrEqual(5 * MINUTE);
    expect(page.creature(PLATYPUS)).not.toHaveProperty('hurt');
    expect(beast(page)).toMatchObject({ hurt: null, assignment: { kind: 'mission', missionId: `rest:${at + 8 * MINUTE}` } });
    expect(state.codex.find(([id]) => id === PLATYPUS)?.[1].g.assignment).toEqual({ kind: 'mission', missionId: `rest:${at + 8 * MINUTE}` });
    expect(page.carrierAgrees()).toBe(true);
    expect(await page.receipts()).toHaveLength(1);
    expect(page.outcomes.committed).toEqual([{ kind: REST_ACTION, receiptOrdinal: 0 }]);
    expect(page.runtime.diagnostics().sessionDraws).toEqual({});
    expect(restNotice(facts)).toEqual({ icon: 'rest', title: 'Resting', message: ['Platypus — 8 min of play left'] });
    // What was stored reads back the same.
    expect((await page.stored()).state.codex.find(([id]) => id === PLATYPUS)?.[1].g.assignment).toEqual({ kind: 'mission', missionId: `rest:${at + 8 * MINUTE}` });
  });

  it('"The first recovery from Injured or worse is the bond memory recovered:injured", once', async () => {
    const page = await carePage({ activePlayMs: 7 * MINUTE, held: [heldPage(11, { hurt: 0.3 })] });
    const first = await committed(page.rest(PLATYPUS));
    expect(first.facts).toMatchObject({ minutes: 6, recovered: true, bond: { levelBefore: 0, levelAfter: 0, memories: 1 } });
    // The memory is stamped with the active play its receipt committed.
    expect(first.facts.startedAtActivePlayMs).toBeGreaterThanOrEqual(7 * MINUTE);
    const remembered = beast(page).bond!;
    expect(remembered.memories.map(({ id, kind, atActivePlayMs }) => [id, kind, atActivePlayMs])).toEqual([['recovered:injured', 'recovery', first.facts.startedAtActivePlayMs]]);
    expect((await page.stored()).state.codex.find(([id]) => id === PLATYPUS)?.[1].g.bond).toMatchObject({ level: 0, memories: [{ id: 'recovered:injured' }] });
    // The same beast, wounded worse and rested again: no second memory.
    const again = await carePage({ held: [heldPage(11, { hurt: 0.6, bond: JSON.parse(JSON.stringify(remembered)) as Record<string, unknown> })] });
    const second = await committed(again.rest(PLATYPUS));
    expect(second.facts).toMatchObject({ minutes: 12, recovered: false, bond: { memories: 1 } });
    expect(beast(again).bond!.memories).toHaveLength(1);
  });

  it('a bruise is no recovery to remember: under 0.3 the Rest adds no memory', async () => {
    const page = await carePage({ held: [heldPage(11, { hurt: 0.29 })] });
    const { facts } = await committed(page.rest(PLATYPUS));
    expect(facts).toMatchObject({ minutes: 6, recovered: false, bond: { memories: 0 } });
    expect(beast(page).bond).toBeNull();
  });

  it('"at most 20": the worst wound rests twenty minutes', async () => {
    const page = await carePage({ held: [heldPage(11, { hurt: 0.95 })] });
    expect((await committed(page.rest(PLATYPUS))).facts).toMatchObject({ minutes: 20, recovered: true });
  });

  it('a whole beast, a plant and a species the Compendium does not hold: refused, nothing written', async () => {
    const page = await carePage({ held: [heldPage(11), heldPage(0)] });
    const before = await dump(page.backend);
    expect(await page.rest(PLATYPUS)).toMatchObject({ kind: 'refused', detail: 'rest:healthy' });
    expect(await page.rest(PERSIMMON)).toMatchObject({ kind: 'refused', detail: 'not-a-beast' });
    expect(await page.rest(earthId(12))).toMatchObject({ kind: 'refused', detail: 'not-in-compendium' });
    expect(await dump(page.backend)).toEqual(before);
  });
});

describe('"locking breed, combat, dispatch and Feed until ready"', () => {
  it('a resting beast is not fed, mended or rested again, and nothing is written; at the boundary itself it is free', async () => {
    const page = await carePage({ held: [heldPage(11, { hurt: 0.35 }), heldPage(0), heldPage(1)] });
    const { facts } = await committed(page.rest(PLATYPUS));
    const before = await dump(page.backend);
    expect(await page.feed(PLATYPUS, PERSIMMON)).toMatchObject({ kind: 'refused', detail: 'resting' });
    expect(await page.mend(PLATYPUS)).toMatchObject({ kind: 'refused' });
    expect(await page.rest(PLATYPUS)).toMatchObject({ kind: 'refused', detail: 'resting' });
    // One millisecond of play short of the boundary it still rests.
    page.time.advance(8 * MINUTE - 1 - (page.runtime.activePlayMs() - facts.startedAtActivePlayMs));
    expect(page.runtime.activePlayMs()).toBe(facts.readyAtActivePlayMs - 1);
    expect(await page.feed(PLATYPUS, PERSIMMON)).toMatchObject({ kind: 'refused', detail: 'resting' });
    expect(await dump(page.backend)).toEqual(before);
    expect(await page.receipts()).toHaveLength(1);
    // The lock every locked command reads: breed, combat, dispatch and Feed alike.
    expect(companionLock(beast(page), facts.readyAtActivePlayMs - 1)).toBe('resting');
    expect(companionLock(beast(page), facts.readyAtActivePlayMs)).toBeNull();
    // At the boundary it is fed.
    page.time.advance(1);
    expect(page.runtime.activePlayMs()).toBe(facts.readyAtActivePlayMs);
    const fed = await committed(page.feed(PLATYPUS, PERSIMMON));
    expect(fed.facts.meals[0]).toMatchObject({ hurtBefore: 0, hurtAfter: 0, fedAfter: 2 });
  });

  it('nothing heals while the game is closed: the boundary is on the clock of active play, which a reload keeps', async () => {
    const first = await carePage({ activePlayMs: 3 * MINUTE, held: [heldPage(11, { hurt: 0.35 }), heldPage(0)] });
    const { facts } = await committed(first.rest(PLATYPUS));
    await first.runtime.release();
    // Another page, later by the wall clock, opens the same save: the clock of active play stands where it was stored.
    const { bootedHarness } = await import('./save-loop-support');
    const { settleFeedV1 } = await import('../src/care');
    const second = await bootedHarness(first.backend, 'document-b');
    expect(second.runtime.activePlayMs()).toBeLessThan(facts.readyAtActivePlayMs);
    expect(await settleFeedV1({ door: second.loop }, { speciesId: PLATYPUS, floraId: PERSIMMON, codecNow: NOW + 86_400_000 })).toMatchObject({ kind: 'refused', detail: 'resting' });
    second.time.advance(facts.readyAtActivePlayMs - second.runtime.activePlayMs());
    expect(await settleFeedV1({ door: second.loop }, { speciesId: PLATYPUS, floraId: PERSIMMON, codecNow: NOW + 86_400_000 })).toMatchObject({ kind: 'committed' });
  });

  it('a beast away on a mission is not fed or rested either', async () => {
    const page = await carePage({ held: [heldPage(11, { hurt: 0.5, assignment: { kind: 'mission', missionId: 'mission:4' } }), heldPage(0)] });
    expect(await page.feed(PLATYPUS, PERSIMMON)).toMatchObject({ kind: 'refused', detail: 'away' });
    expect(await page.rest(PLATYPUS)).toMatchObject({ kind: 'refused', detail: 'away' });
    // Its card offers no Rest while it is away, hurt as it is.
    expect(companionCareV1(beast(page), 0)).toMatchObject({ condition: 'Injured', lock: 'away', resting: false, restMinutes: 0 });
  });

  it('a beast recovering after a union is fed all the same, and keeps its recovery; it cannot begin a Rest', async () => {
    // "Recovery never blocks Feed. … Only a mission blocks a meal" (BREEDING_AND_SHARING.md, the fix of 2026-09-25).
    const recovery = { kind: 'recovery', readyAtActivePlayMs: 1_000_000_000 };
    const page = await carePage({ held: [heldPage(11, { hurt: 0.5, assignment: recovery }), heldPage(0)] });
    expect(await page.rest(PLATYPUS)).toMatchObject({ kind: 'refused', detail: 'recovering' });
    expect((await committed(page.feed(PLATYPUS, PERSIMMON))).facts.meals[0]).toMatchObject({ hurtAfter: 0.25 });
    expect(beast(page).assignment).toEqual(recovery);
  });
});

describe('the care card', () => {
  it('shows the condition or the rest left, the Rest on offer, the tastes it has learned and the bond', async () => {
    const page = await carePage({ held: [heldPage(11, { hurt: 0.35 }), heldPage(0), heldPage(1)] });
    // The Platypus loves Vitality and Insight and dislikes Ferocity; it has tasted nothing.
    expect(companionCareV1(beast(page), page.runtime.activePlayMs())).toEqual({
      condition: 'Injured', resting: false, restMinutesLeft: 0, restMinutes: 8, lock: null,
      favors: [null, null], dislikes: [null],
      bond: { level: 0, name: 'Wary', memories: 0, next: { level: 1, name: 'Familiar', memories: 3, remaining: 3, unlock: BOND_LEVELS[1]!.unlock } },
    });
    await committed(page.feed(PLATYPUS, PERSIMMON));
    expect(companionCareV1(beast(page), page.runtime.activePlayMs())).toMatchObject({ condition: 'Bruised', restMinutes: 2, favors: [null, 'Insight'], dislikes: [null], bond: { memories: 2 } });
    const { facts } = await committed(page.rest(PLATYPUS));
    expect(companionCareV1(beast(page), facts.startedAtActivePlayMs + 30_001)).toMatchObject({ condition: 'Healthy', resting: true, restMinutesLeft: 2, restMinutes: 0, lock: 'resting' });
    expect(companionCareV1(beast(page), facts.readyAtActivePlayMs)).toMatchObject({ condition: 'Healthy', resting: false, restMinutesLeft: 0, lock: null });
    expect(bondOf(2).name).toBe('Wary');
  });
});

describe('the check after storage', () => {
  type Lie = (committed: CareCommitted) => CareCommitted;
  function lyingDoor(page: CarePage, lie: Lie): CareDoor {
    const changed = (answer: CareTransaction): CareTransaction => answer.kind === 'committed' ? lie(answer) : answer;
    return {
      settle: (kind, commit) => page.loop.settle(kind, (runtime: CareAuthority, durable: SaveStateV2) => commit({
        get extensions() { return runtime.extensions; },
        commitAction: async (input) => changed(await runtime.commitAction(input)),
        commitMultiOutcome: async (input) => changed(await runtime.commitMultiOutcome(input)),
      }, durable)),
    };
  }
  const genome = (change: (g: Record<string, unknown>) => Record<string, unknown>): Lie => (answer) => {
    const state = { ...answer.state, codex: answer.state.codex.map(([id, entry]) => [id, id === PLATYPUS ? { ...entry, g: change(entry.g) } : entry]) } as SaveStateV2;
    return { ...answer, state, saved: { ...answer.saved, canonicalState: state } } as CareCommitted;
  };

  it('a Rest whose stored state is not the staged one is not called committed, whatever is missing', async () => {
    const cases: Array<[string, Lie]> = [
      ['hurt', genome((g) => ({ ...g, hurt: 0.35 }))],
      ['rest', genome(({ assignment: _assignment, ...g }) => g)],
      ['rest', genome((g) => ({ ...g, assignment: { kind: 'mission', missionId: 'rest:1' } }))],
      ['bond', genome(({ bond: _bond, ...g }) => g)],
    ];
    for (const [missing, lie] of cases) {
      const page = await carePage({ held: [heldPage(11, { hurt: 0.35 })] });
      expect(await settleRestV1({ door: lyingDoor(page, lie) }, { speciesId: PLATYPUS, codecNow: NOW }), missing)
        .toMatchObject({ kind: 'committed-convergence', detail: `postcommit:${missing}` });
    }
    const honest = await carePage({ held: [heldPage(11, { hurt: 0.35 })] });
    expect(await settleRestV1({ door: lyingDoor(honest, (answer) => answer) }, { speciesId: PLATYPUS, codecNow: NOW })).toMatchObject({ kind: 'committed' });
  });
});
