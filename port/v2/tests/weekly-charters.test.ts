import { beforeAll, describe, expect, it } from 'vitest';
import { installCaptureHooks } from '@cf/domain-descriptors';
import { projectWorldOpportunity } from '@cf/domain-opportunity';
import {
  createMemoryBackend,
  createRevisionedRepository,
  migrateStoredV4ToV5,
  prepareF4AuthorityUpdate,
  prepareV5SaveWrite,
  V4_PRIMARY_KEY,
  type ContentRegistry,
  type SaveStateV2,
} from '@cf/persistence';
import { createSessionRNG } from '@cf/domain-sessionrng';
import {
  resolveCF1WorldAddress,
  type CanonicalCF1WorldAddress,
} from '@cf/scene';
import { createF4RuntimeAuthority } from '../apps/game/src/f4-runtime-authority.js';
import { stageStarterCharterActionV1 } from '../apps/game/src/starter-charter-action.js';
import {
  WEEKLY_CHARTER_MS_V1,
  WEEKLY_CHARTER_POOL_V1,
  commitWeeklyCharterAcceptV1,
  commitWeeklyCharterRolloverV1,
  operationForWeeklyCharterAcceptV1,
  projectWeeklyCharterBoardV1,
  publishWeeklyCharterFieldsV1,
  renderWeeklyCharterBoardV1,
  stageWeeklyCharterAcceptV1,
  stageWeeklyCharterEventV1,
  stageWeeklyCharterRolloverV1,
  wallWeekForWeeklyChartersV1,
  weeklyCharterSlateForWeekV1,
} from '../apps/game/src/weekly-charters.js';
import REGISTRY_JSON from '../../baseline-v1.8.9/content-registry.json';

const REGISTRY = REGISTRY_JSON as unknown as ContentRegistry;
const TRADES = ['st-land', 'st-mine', 'st-scan', 'st-scout', 'st-conq'];

beforeAll(() => installCaptureHooks());

function state(): SaveStateV2 {
  return {
    EPOCH_BASE: 0, essence: 10, explorerName: 'Dakk', lastAnomKey: null,
    stats: { essenceEarned: 20, bestRank: 0 }, pstats: {}, hp: 10, HP_MAX: 10,
    customNames: [], conquered: [], cargo: [], cgx: [], items: [], equip: {}, equipAff: {},
    pinnedRecipe: null, cargoTab: 'mat', seenSp: [], journal: [], mined: [], mineX: [], skimX: [],
    bioX: [], techOwned: [], claimedSets: [], ascCh: 0, ascProg: {}, nameHue: -1,
    savedView: null, fsMode: '', toneMode: '', fontMode: '', sndOn: true, fxOn: true,
    chartsOn: true, shakeOn: true, salvageConfirm: true, notifOn: true, tipsOn: true,
    sfxVol: 1, glassTint: 0, motionMode: 0, cardExpand: 0, notifications: [],
    surveyedSet: [], galSeen: [], surfSeen: [133], xpFirsts: [], sysSeen: [], starKindsSeen: [],
    ptypesSeen: [], eventKeysSeen: [], evAnnounced: [], unlocked: [], landed: [], contacted: [],
    waveOffs: [], primeFill: {}, frontierUnlocked: false, frontierEnding: null, seenGuide: false,
    tutDone: true, rnSeen: '', tutSnapPending: null, scoutId: null, chWeek: -1, chProg: {},
    chacc: [], chDone: [], homeId: null, voiceOn: true, combatSfxOn: true, logMap: [], codex: [],
  };
}

function exactAddress(candidate: unknown): CanonicalCF1WorldAddress {
  const address = resolveCF1WorldAddress(candidate);
  if (!address.ok) throw new Error(`weekly Charter fixture failed: ${address.reason}`);
  return address.address;
}

function solWorld(planetSeed: number): CanonicalCF1WorldAddress {
  return exactAddress({
    galaxy: { seed: 999, x: 90, y: -60 },
    star: { seed: 424242, x: 560, y: 170 },
    planet: { seed: planetSeed },
  });
}

async function fixture(save: SaveStateV2, codecNow: number) {
  const f4 = prepareF4AuthorityUpdate(
    {}, { activePlayMs: 0 }, createSessionRNG(0xC4A7_0002).state(),
  );
  const backend = createMemoryBackend();
  const initial = prepareV5SaveWrite({ state: save, extensions: f4.extensions }, REGISTRY, codecNow);
  await backend.apply([{ store: 'meta', key: V4_PRIMARY_KEY, value: initial.legacyV4Raw }]);
  const migration = await migrateStoredV4ToV5(backend, REGISTRY, codecNow);
  if (migration.kind !== 'migrated') throw new Error(`weekly Charter fixture was ${migration.kind}`);
  await backend.apply(initial.operations);
  const repository = createRevisionedRepository(backend);
  const runtime = createF4RuntimeAuthority({
    backend, repository, registry: REGISTRY, initialRevision: 0,
    initialExtensions: f4.extensions, initialState: initial.canonicalState,
    restoredAuthority: f4.authority, freshSessionSeed: 0,
    ownerId: 'weekly-charter-test', token: 'weekly-charter-document',
    leaseTtlMs: 1_000_000, now: () => codecNow, visible: true, answerable: true,
  });
  expect((await runtime.heartbeat()).kind).toBe('owned');
  return { runtime, repository, state: initial.canonicalState };
}

describe('weekly Charters', () => {
  it('pins the exact eight authored rows, wall bucket, and deterministic three-row draw', () => {
    expect(WEEKLY_CHARTER_POOL_V1.map(({ id, count, stardust }) => [id, count, stardust])).toEqual([
      ['wk-land', 3, 20], ['wk-mine', 3, 25], ['wk-scan', 3, 25], ['wk-sp', 5, 25],
      ['wk-conq', 1, 30], ['wk-feed', 3, 20], ['wk-breed', 1, 30], ['wk-hostile', 1, 35],
    ]);
    expect(wallWeekForWeeklyChartersV1(WEEKLY_CHARTER_MS_V1 - 1)).toBe(0);
    expect(wallWeekForWeeklyChartersV1(WEEKLY_CHARTER_MS_V1)).toBe(1);
    expect(weeklyCharterSlateForWeekV1(0).map(({ id }) => id)).toEqual([
      'wk-conq', 'wk-sp', 'wk-mine',
    ]);
    expect(weeklyCharterSlateForWeekV1(1).map(({ id }) => id)).toEqual([
      'wk-hostile', 'wk-feed', 'wk-breed',
    ]);
    expect(weeklyCharterSlateForWeekV1(2).map(({ id }) => id)).toEqual([
      'wk-mine', 'wk-scan', 'wk-land',
    ]);
    expect(() => weeklyCharterSlateForWeekV1(-1)).toThrow('exact integer range');
  });

  it('gates the slate behind the five trades and shares the exact three-active cap', () => {
    const gated = projectWeeklyCharterBoardV1(state(), WEEKLY_CHARTER_MS_V1 * 2);
    expect(gated).toMatchObject({
      kind: 'projected',
      board: { week: 2, rolloverRequired: true, tradesComplete: false, rows: [] },
    });
    const open = state();
    open.chDone = [...TRADES];
    open.chacc = ['st-mercury', 'st-mars', 'st-giants'];
    const full = projectWeeklyCharterBoardV1(open, WEEKLY_CHARTER_MS_V1 * 2);
    expect(full.kind === 'projected' && full.board.rows.map(({ definition }) => definition.id))
      .toEqual(['wk-mine', 'wk-scan', 'wk-land']);
    const refused = stageWeeklyCharterAcceptV1({
      draft: open, id: 'wk-mine', codecNow: WEEKLY_CHARTER_MS_V1 * 2,
    });
    expect(refused).toMatchObject({ kind: 'refused', reason: 'three accepted Charters is the exact cap' });
  });

  it('renders only semantic current rows and puts Accept on available work alone', () => {
    const locked = projectWeeklyCharterBoardV1(state(), WEEKLY_CHARTER_MS_V1 * 2);
    if (locked.kind !== 'projected') throw new Error(locked.reason);
    const lockedMarkup = renderWeeklyCharterBoardV1(locked.board);
    expect(lockedMarkup).toContain('data-weekly-charter-locked');
    expect(lockedMarkup).toContain('Finish the five Trades starter Charters');
    expect(lockedMarkup).not.toContain('data-weekly-charter-accept=');

    const save = state();
    save.chDone = [...TRADES];
    save.chWeek = 2;
    save.chacc = ['wk-scan'];
    save.chProg = { 'wk-scan': 1, 'wk-mine': 3 };
    const open = projectWeeklyCharterBoardV1(save, WEEKLY_CHARTER_MS_V1 * 2);
    if (open.kind !== 'projected') throw new Error(open.reason);
    const markup = renderWeeklyCharterBoardV1(open.board);
    expect(markup).toContain('data-weekly-week="2"');
    expect(markup).toContain('data-weekly-clock-status="same-week"');
    expect(markup).toContain('Deep veins');
    expect(markup).toContain('Field naturalist');
    expect(markup).toContain('Boots on three worlds');
    expect(markup).toContain('3 / 3 · +25 ✦');
    expect(markup).toContain('1 / 3 · +25 ✦');
    expect(markup).toContain('0 / 3 · +20 ✦');
    expect(markup).toContain('data-weekly-charter-accept="wk-land"');
    expect(markup).not.toContain('data-weekly-charter-accept="wk-scan"');
    expect(markup).not.toContain('data-weekly-charter-accept="wk-mine"');
    expect(markup).toContain('complete this week');
    expect(markup).toContain('Week 2 is current.');

    const backward = structuredClone(save);
    const held = projectWeeklyCharterBoardV1(backward, WEEKLY_CHARTER_MS_V1);
    if (held.kind !== 'projected') throw new Error(held.reason);
    expect(renderWeeklyCharterBoardV1(held.board))
      .toContain('Saved week 2 is preserved while the wall clock reports week 1.');
  });

  it('rolls forward atomically, expires only weekly carriers, and initializes an older save', () => {
    const save = state();
    save.chDone = [...TRADES];
    save.chWeek = 0;
    save.chacc = ['st-mercury', 'wk-conq'];
    save.chProg = { 'st-mercury': 1, 'wk-conq': 0, 'wk-sp': 4 };
    const rolled = stageWeeklyCharterRolloverV1({
      draft: save, codecNow: WEEKLY_CHARTER_MS_V1,
    });
    expect(rolled).toMatchObject({
      kind: 'ready',
      facts: {
        status: 'forward-rollover', sourceWeek: 0, effectiveWeek: 1,
        expiredAcceptedIds: ['wk-conq'], clearedProgressIds: ['wk-conq', 'wk-sp'],
      },
    });
    expect(save).toMatchObject({
      chWeek: 1, chacc: ['st-mercury'], chProg: { 'st-mercury': 1 }, essence: 10,
    });

    const older = state();
    older.chDone = [...TRADES];
    older.chProg = { 'wk-old': 9, 'st-land': 1 };
    const initialized = stageWeeklyCharterRolloverV1({
      draft: older, codecNow: WEEKLY_CHARTER_MS_V1 * 2,
    });
    expect(initialized).toMatchObject({ kind: 'ready', facts: { status: 'initialized' } });
    expect(older).toMatchObject({ chWeek: 2, chProg: { 'st-land': 1 } });
  });

  it('preserves an ordinary backward clock and protects an impossible future without mutation', () => {
    const backward = state();
    backward.chDone = [...TRADES];
    backward.chWeek = 2;
    backward.chacc = ['wk-mine'];
    backward.chProg = { 'wk-mine': 1 };
    const beforeBackward = structuredClone(backward);
    expect(stageWeeklyCharterRolloverV1({
      draft: backward, codecNow: WEEKLY_CHARTER_MS_V1,
    })).toMatchObject({ kind: 'current', facts: { status: 'backward-preserved', effectiveWeek: 2 } });
    expect(backward).toEqual(beforeBackward);
    expect(operationForWeeklyCharterAcceptV1(
      backward, WEEKLY_CHARTER_MS_V1, 'wk-mine',
    )).toBe('arc8.weekly-charter-accept:2:wk-mine');

    const impossible = structuredClone(backward);
    impossible.chWeek = 3;
    const beforeImpossible = structuredClone(impossible);
    expect(stageWeeklyCharterRolloverV1({
      draft: impossible, codecNow: WEEKLY_CHARTER_MS_V1,
    })).toMatchObject({ kind: 'refused', reason: expect.stringContaining('impossibly ahead') });
    expect(projectWeeklyCharterBoardV1(impossible, WEEKLY_CHARTER_MS_V1)).toMatchObject({
      kind: 'protected', reason: expect.stringContaining('impossibly ahead'),
    });
    expect(impossible).toEqual(beforeImpossible);
  });

  it('accepts only a source-drawn row, never backfills it, and reaches a fixed point', () => {
    const save = state();
    save.chDone = [...TRADES];
    save.chProg = { 'wk-mine': 2 };
    const accepted = stageWeeklyCharterAcceptV1({
      draft: save, id: 'wk-mine', codecNow: WEEKLY_CHARTER_MS_V1 * 2,
    });
    expect(accepted).toMatchObject({
      kind: 'ready', facts: { acceptedId: 'wk-mine', rollover: { status: 'initialized' } },
    });
    expect(save).toMatchObject({ chWeek: 2, chacc: ['wk-mine'], chProg: {} });
    expect(stageWeeklyCharterAcceptV1({
      draft: save, id: 'wk-mine', codecNow: WEEKLY_CHARTER_MS_V1 * 2,
    })).toMatchObject({ kind: 'current' });
    expect(stageWeeklyCharterAcceptV1({
      draft: save, id: 'wk-feed', codecNow: WEEKLY_CHARTER_MS_V1 * 2,
    })).toMatchObject({ kind: 'refused', reason: 'weekly Charter is outside the current slate' });
  });

  it('requires first-world product facts and exact registered opportunities for Mine and Survey', () => {
    const opportunity = projectWorldOpportunity(solWorld(135));
    const save = state();
    save.chDone = [...TRADES];
    save.chWeek = 2;
    save.chacc = ['wk-mine', 'wk-scan'];
    save.chProg = { 'wk-mine': 2, 'wk-scan': 2 };
    expect(stageWeeklyCharterEventV1({
      draft: save, extensions: {}, codecNow: WEEKLY_CHARTER_MS_V1 * 2,
      event: { kind: 'mined', opportunity, first: false },
    })).toMatchObject({ kind: 'current' });
    expect(save.chProg).toEqual({ 'wk-mine': 2, 'wk-scan': 2 });
    const mine = stageWeeklyCharterEventV1({
      draft: save, extensions: {}, codecNow: WEEKLY_CHARTER_MS_V1 * 2,
      event: { kind: 'mined', opportunity, first: true },
    });
    expect(mine).toMatchObject({
      kind: 'ready', facts: { progressIds: ['wk-mine'], completions: [{ id: 'wk-mine', stardust: 25 }] },
    });
    expect(save).toMatchObject({
      essence: 35, chacc: ['wk-scan'], chProg: { 'wk-mine': 3, 'wk-scan': 2 },
      stats: { essenceEarned: 45, charters: 1 },
    });
    const survey = stageWeeklyCharterEventV1({
      draft: save, extensions: {}, codecNow: WEEKLY_CHARTER_MS_V1 * 2,
      event: { kind: 'bioscan', opportunity, first: true },
    });
    expect(survey).toMatchObject({
      kind: 'ready', facts: { completions: [{ id: 'wk-scan', stardust: 25 }] },
    });
    expect(save).toMatchObject({ essence: 60, chacc: [], stats: { charters: 2 } });

    const forged = state();
    forged.chDone = [...TRADES];
    forged.chWeek = 2;
    forged.chacc = ['wk-mine'];
    const before = structuredClone(forged);
    expect(stageWeeklyCharterEventV1({
      draft: forged, extensions: {}, codecNow: WEEKLY_CHARTER_MS_V1 * 2,
      event: { kind: 'mined', opportunity: structuredClone(opportunity), first: true },
    })).toMatchObject({ kind: 'refused', reason: expect.stringContaining('registered world opportunity') });
    expect(forged).toEqual(before);
  });

  it('derives hostile landfall from canonical source planet type and keeps safe/repeat landings inert', () => {
    const hostile = projectWorldOpportunity(solWorld(135));
    const safe = projectWorldOpportunity(solWorld(134));
    expect(hostile.source.planetType).toBe('gas');
    const save = state();
    save.chDone = [...TRADES];
    save.chWeek = 1;
    save.chacc = ['wk-hostile', 'wk-feed', 'wk-breed'];
    expect(stageWeeklyCharterEventV1({
      draft: save, extensions: {}, codecNow: WEEKLY_CHARTER_MS_V1,
      event: { kind: 'landfall', opportunity: safe, first: true },
    })).toMatchObject({ kind: 'current' });
    expect(stageWeeklyCharterEventV1({
      draft: save, extensions: {}, codecNow: WEEKLY_CHARTER_MS_V1,
      event: { kind: 'landfall', opportunity: hostile, first: false },
    })).toMatchObject({ kind: 'current' });
    expect(stageWeeklyCharterEventV1({
      draft: save, extensions: {}, codecNow: WEEKLY_CHARTER_MS_V1,
      event: { kind: 'landfall', opportunity: hostile, first: true },
    })).toMatchObject({
      kind: 'ready', facts: { completions: [{ id: 'wk-hostile', stardust: 35 }] },
    });
    expect(stageWeeklyCharterEventV1({
      draft: save, extensions: {}, codecNow: WEEKLY_CHARTER_MS_V1,
      event: { kind: 'fed', ok: false },
    })).toMatchObject({ kind: 'current' });
    expect(stageWeeklyCharterEventV1({
      draft: save, extensions: {}, codecNow: WEEKLY_CHARTER_MS_V1,
      event: { kind: 'bred', ok: true },
    })).toMatchObject({ kind: 'ready', facts: { completions: [{ id: 'wk-breed' }] } });
  });

  it('preserves the authored landfall, species, conquest, and welcome-meal filters', () => {
    const opportunity = projectWorldOpportunity(solWorld(134));

    const land = state();
    land.chDone = [...TRADES];
    land.chWeek = 2;
    land.chacc = ['wk-land'];
    land.chProg = { 'wk-land': 2 };
    expect(stageWeeklyCharterEventV1({
      draft: land, extensions: {}, codecNow: WEEKLY_CHARTER_MS_V1 * 2,
      event: { kind: 'landfall', opportunity, first: false },
    })).toMatchObject({ kind: 'current' });
    expect(stageWeeklyCharterEventV1({
      draft: land, extensions: {}, codecNow: WEEKLY_CHARTER_MS_V1 * 2,
      event: { kind: 'landfall', opportunity, first: true },
    })).toMatchObject({ kind: 'ready', facts: { completions: [{ id: 'wk-land', stardust: 20 }] } });

    const codex = state();
    codex.chDone = [...TRADES];
    codex.chWeek = 0;
    codex.chacc = ['wk-sp', 'wk-conq'];
    codex.chProg = { 'wk-sp': 4 };
    expect(stageWeeklyCharterEventV1({
      draft: codex, extensions: {}, codecNow: 0,
      event: { kind: 'species', codexId: 'sp-source-proven', first: false },
    })).toMatchObject({ kind: 'current' });
    expect(stageWeeklyCharterEventV1({
      draft: codex, extensions: {}, codecNow: 0,
      event: { kind: 'species', codexId: 'sp-source-proven', first: true },
    })).toMatchObject({ kind: 'ready', facts: { completions: [{ id: 'wk-sp', stardust: 25 }] } });
    expect(stageWeeklyCharterEventV1({
      draft: codex, extensions: {}, codecNow: 0,
      event: { kind: 'conquest', address: opportunity.address, first: true },
    })).toMatchObject({ kind: 'ready', facts: { completions: [{ id: 'wk-conq', stardust: 30 }] } });

    const meal = state();
    meal.chDone = [...TRADES];
    meal.chWeek = 1;
    meal.chacc = ['wk-feed'];
    meal.chProg = { 'wk-feed': 2 };
    expect(stageWeeklyCharterEventV1({
      draft: meal, extensions: {}, codecNow: WEEKLY_CHARTER_MS_V1,
      event: { kind: 'fed', ok: false },
    })).toMatchObject({ kind: 'current' });
    expect(stageWeeklyCharterEventV1({
      draft: meal, extensions: {}, codecNow: WEEKLY_CHARTER_MS_V1,
      event: { kind: 'fed', ok: true },
    })).toMatchObject({ kind: 'ready', facts: { completions: [{ id: 'wk-feed', stardust: 20 }] } });
  });

  it('expires prior-week accepted work before an event and never pays the stale row', () => {
    const save = state();
    save.chDone = [...TRADES];
    save.chWeek = 0;
    save.chacc = ['wk-conq'];
    const result = stageWeeklyCharterEventV1({
      draft: save, extensions: {}, codecNow: WEEKLY_CHARTER_MS_V1,
      event: { kind: 'bred', ok: true },
    });
    expect(result).toMatchObject({
      kind: 'ready', facts: { rollover: { status: 'forward-rollover', expiredAcceptedIds: ['wk-conq'] }, completions: [] },
    });
    expect(save).toMatchObject({ chWeek: 1, chacc: [], chProg: {}, essence: 10 });
  });

  it('composes a weekly completion into the owning product witness and rejects a duplicate join key', () => {
    const opportunity = projectWorldOpportunity(solWorld(135));
    const save = state();
    save.chDone = [...TRADES];
    save.chWeek = 2;
    save.chacc = ['wk-mine'];
    save.chProg = { 'wk-mine': 2 };
    const staged = stageStarterCharterActionV1({
      draft: save,
      extensions: {},
      predecessorWrites: Object.freeze([]),
      predecessorWitness: JSON.stringify({ product: 'mine' }),
      event: { kind: 'mined', address: opportunity.address },
      weekly: {
        codecNow: WEEKLY_CHARTER_MS_V1 * 2,
        events: Object.freeze([{ kind: 'mined', opportunity, first: true }]),
      },
      receiptOrdinal: 7,
    });
    expect(staged).toMatchObject({
      kind: 'ready', weeklyFact: { changed: true, completions: [{ id: 'wk-mine' }] },
    });
    if (staged.kind === 'ready') {
      expect(JSON.parse(staged.witness)).toMatchObject({
        product: 'mine', weeklyCharter: {
          events: [{ kind: 'mined', first: true }],
          completions: [{ id: 'wk-mine', stardust: 25 }],
        },
      });
    }
    const duplicateSave = state();
    duplicateSave.chDone = [...TRADES];
    duplicateSave.chWeek = 2;
    duplicateSave.chacc = ['wk-mine'];
    expect(stageStarterCharterActionV1({
      draft: duplicateSave,
      extensions: {}, predecessorWrites: Object.freeze([]),
      predecessorWitness: JSON.stringify({ weeklyCharter: { forged: true } }),
      event: { kind: 'mined', address: opportunity.address },
      weekly: {
        codecNow: WEEKLY_CHARTER_MS_V1 * 2,
        events: Object.freeze([{ kind: 'mined', opportunity, first: true }]),
      },
      receiptOrdinal: 8,
    })).toMatchObject({ kind: 'refused', reason: 'Charter predecessor witness is not composable' });
  });

  it('commits and publishes one accepted row through one receipt without mutating the live parent', async () => {
    const save = state();
    save.chDone = [...TRADES];
    const codecNow = WEEKLY_CHARTER_MS_V1 * 2;
    const built = await fixture(save, codecNow);
    const before = structuredClone(built.state);
    const ordinal = built.runtime.sessionRng.ordinal;
    const outcome = await commitWeeklyCharterAcceptV1({
      state: built.state, id: 'wk-mine', codecNow, authority: built.runtime,
    });
    expect(outcome).toMatchObject({
      kind: 'committed',
      state: { chWeek: 2, chacc: ['wk-mine'] },
      facts: { action: 'accept', id: 'wk-mine' },
      transaction: { receipt: { kind: 'arc8-weekly-charter-accept-v1' } },
    });
    expect(built.state).toEqual(before);
    expect(built.runtime.sessionRng).toMatchObject({ ordinal: ordinal + 1, draws: {} });
    if (outcome.kind !== 'committed') return;
    publishWeeklyCharterFieldsV1(built.state, outcome);
    expect(built.state).toMatchObject({ chWeek: 2, chacc: ['wk-mine'] });
    expect((await commitWeeklyCharterAcceptV1({
      state: built.state, id: 'wk-mine', codecNow, authority: built.runtime,
    })).kind).toBe('current');
    expect(built.runtime.sessionRng.ordinal).toBe(ordinal + 1);
    await built.runtime.release();
  });

  it('commits one forward rollover and reaches a replay-free current state', async () => {
    const save = state();
    save.chDone = [...TRADES];
    save.chWeek = 0;
    save.chacc = ['wk-conq', 'st-mercury'];
    save.chProg = { 'wk-conq': 0, 'st-mercury': 1 };
    const codecNow = WEEKLY_CHARTER_MS_V1;
    const built = await fixture(save, codecNow);
    const before = structuredClone(built.state);
    const ordinal = built.runtime.sessionRng.ordinal;
    const outcome = await commitWeeklyCharterRolloverV1({
      state: built.state, codecNow, authority: built.runtime,
    });
    expect(outcome).toMatchObject({
      kind: 'committed',
      state: { chWeek: 1, chacc: ['st-mercury'], chProg: { 'st-mercury': 1 } },
      facts: { action: 'rollover', id: null },
      transaction: { receipt: { kind: 'arc8-weekly-charter-rollover-v1' } },
    });
    expect(built.state).toEqual(before);
    if (outcome.kind !== 'committed') return;
    publishWeeklyCharterFieldsV1(built.state, outcome);
    expect((await commitWeeklyCharterRolloverV1({
      state: built.state, codecNow, authority: built.runtime,
    })).kind).toBe('current');
    expect(built.runtime.sessionRng.ordinal).toBe(ordinal + 1);
    await built.runtime.release();
  });

  it('keeps rollover unpublished on stale authority and leaves no retry receipt', async () => {
    const save = state();
    save.chDone = [...TRADES];
    save.chWeek = 0;
    save.chacc = ['wk-conq'];
    const codecNow = WEEKLY_CHARTER_MS_V1;
    const built = await fixture(save, codecNow);
    expect((await built.repository.mutate({ expectedRevision: 0, writes: [] })).kind).toBe('committed');
    const before = structuredClone(built.state);
    const ordinal = built.runtime.sessionRng.ordinal;
    const outcome = await commitWeeklyCharterRolloverV1({
      state: built.state, codecNow, authority: built.runtime,
    });
    expect(outcome).toMatchObject({ kind: 'refused', detail: 'stale' });
    expect(built.state).toEqual(before);
    expect(await built.repository.readReceipt(ordinal)).toBeUndefined();
    expect(built.runtime.sessionRng).toMatchObject({ ordinal, draws: {} });
    await built.runtime.release();
  });

  it('converges read-only after a durable acceptance whose receipt cannot be verified', async () => {
    const save = state();
    save.chDone = [...TRADES];
    const codecNow = WEEKLY_CHARTER_MS_V1 * 2;
    const built = await fixture(save, codecNow);
    const before = structuredClone(built.state);
    const authority = Object.freeze({
      commitAction: async (input: Parameters<typeof built.runtime.commitAction>[0]) => {
        const outcome = await built.runtime.commitAction(input);
        if (outcome.kind !== 'committed') return outcome;
        return Object.freeze({
          ...outcome,
          receipt: Object.freeze({ ...outcome.receipt, kind: 'forged-weekly-receipt' }),
        });
      },
    });
    const outcome = await commitWeeklyCharterAcceptV1({
      state: built.state, id: 'wk-mine', codecNow, authority,
    });
    expect(outcome).toMatchObject({
      kind: 'committed-convergence', detail: 'committed-verification-mismatch',
    });
    expect(built.state).toEqual(before);
    expect(await built.repository.revision()).toBe(1);
    await built.runtime.release();
  });
});
