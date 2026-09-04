import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { getFixedRecipePlan } from '@cf/domain-loot';
import { createSessionRNG } from '@cf/domain-sessionrng';
import {
  ARC2_LOOT_NAMESPACE,
  ARC2_LOOT_SEGMENT,
  ARC3_ENGINEERING_NAMESPACE,
  ARC3_ENGINEERING_SEGMENT,
  importSaveV2,
  prepareArc2LootLegacyMigration,
  prepareF4AuthorityUpdate,
  readF4Authority,
  type ContentRegistry,
  type SaveStateV2,
  type V5Extensions,
} from '@cf/persistence';
import { NAV_HOME } from '@cf/scene';
import { prepareArc3AppBootstrap } from '../apps/game/src/arc3-engineering-actions.js';
import {
  TRAINING_FORGE_PRACTICE_COMPLETION_SCHEMA_V1,
  TRAINING_FORGE_PRACTICE_EVENT_V1,
  TrainingForgePracticeAuthorityV1,
  createTrainingForgePracticeAdapterV1,
  projectTrainingForgePracticePlanV1,
  type TrainingForgePracticeSourceV1,
  type TrainingForgePracticeTicketV1,
} from '../apps/game/src/training-forge-practice.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const baseline = path.join(here, '..', '..', 'baseline-v1.8.9');
const REGISTRY = JSON.parse(
  fs.readFileSync(path.join(baseline, 'content-registry.json'), 'utf8'),
) as ContentRegistry;
const NOW = 1_753_900_060_000;

function freshSave(): SaveStateV2 {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(`fresh save failed: ${imported.reason}`);
  return imported.state;
}

function productExtensions(save: SaveStateV2): V5Extensions {
  const loot = prepareArc2LootLegacyMigration({
    extensions: {},
    legacy: { items: save.items, equip: save.equip, equipAff: save.equipAff },
    capacity: 32,
  });
  if (loot.kind !== 'prepared') throw new Error(`Arc 2 fixture was ${loot.kind}`);
  const engineering = prepareArc3AppBootstrap({
    extensions: loot.extensions,
    save,
    sources: Object.freeze({ current: NAV_HOME, saved: null, atlas: Object.freeze([]) }),
  });
  if (engineering.kind !== 'prepared') {
    throw new Error(`Arc 3 fixture was ${engineering.kind}`);
  }
  return prepareF4AuthorityUpdate(
    engineering.extensions,
    { activePlayMs: 44_000 },
    createSessionRNG(0xD7A1_0002, { capture: 4, combat: 9 }, 17).state(),
  ).extensions;
}

function sourceFixture(): TrainingForgePracticeSourceV1 {
  const state = freshSave();
  state.cargo = [['Fe', 91], ['Al', 7]];
  state.cgx = [['Fe', 2]];
  state.items = [['plate', 7]];
  state.stats.crafts = 23;
  state.stats.charters = 5;
  state.ascCh = 1;
  state.ascProg = { 'c2-land': 1 };
  state.chWeek = 29;
  state.chProg = { 'st-mine': 1 };
  state.chacc = ['st-mine'];
  state.chDone = ['st-land'];
  state.unlocked = ['firststeps'];
  state.savedView = { mode: 'galaxy', galaxySeed: 999, x: 90, y: -60 };
  return Object.freeze({ state, extensions: productExtensions(state), codecNow: NOW });
}

function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value as Record<string, unknown>)) deepFreeze(child);
  return Object.freeze(value);
}

function json(value: unknown): string {
  return JSON.stringify(value);
}

describe('D-TRAIN-2 in-memory Forge practice authority', () => {
  it('projects the canonical Iron Plate recipe instead of duplicating its material cost', () => {
    const recipe = getFixedRecipePlan('plate');
    const plan = projectTrainingForgePracticePlanV1();
    expect(plan).toEqual({
      schema: 'cf-v2-training-forge-practice/v1',
      baseId: 'plate',
      name: 'Iron Plate',
      category: 'part',
      outputCount: 1,
      loanedMaterials: Object.entries(recipe.materialCost).map(([id, quantity]) => ({ id, quantity })),
    });
    expect(plan.loanedMaterials).toEqual([{ id: 'Fe', quantity: 4 }]);
    expect(Object.isFrozen(plan)).toBe(true);
    expect(Object.isFrozen(plan.loanedMaterials)).toBe(true);
  });

  it('uses the real fixed-fabrication derivation while leaving every live authority byte untouched', () => {
    const source = sourceFixture();
    const beforeState = json(source.state);
    const beforeExtensions = json(source.extensions);
    const beforeRng = readF4Authority(source.extensions);
    const beforeSurfaces = {
      cargo: structuredClone(source.state.cargo),
      cgx: structuredClone(source.state.cgx),
      items: structuredClone(source.state.items),
      equip: structuredClone(source.state.equip),
      equipAff: structuredClone(source.state.equipAff),
      stats: structuredClone(source.state.stats),
      ascCh: source.state.ascCh,
      ascProg: structuredClone(source.state.ascProg),
      chWeek: source.state.chWeek,
      chProg: structuredClone(source.state.chProg),
      chacc: structuredClone(source.state.chacc),
      chDone: structuredClone(source.state.chDone),
      unlocked: structuredClone(source.state.unlocked),
      savedView: structuredClone(source.state.savedView),
    };
    deepFreeze(source.state);
    deepFreeze(source.extensions);

    const random = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('ambient RNG consulted');
    });
    const clock = vi.spyOn(Date, 'now').mockImplementation(() => {
      throw new Error('ambient clock consulted');
    });
    let outcome: ReturnType<ReturnType<typeof createTrainingForgePracticeAdapterV1>['fabricate']>;
    try {
      const adapter = createTrainingForgePracticeAdapterV1();
      expect(adapter.enter(source)).toMatchObject({
        kind: 'ready', snapshot: { status: 'ready', retainedSandboxCount: 1 },
      });
      outcome = adapter.fabricate();
    } finally {
      random.mockRestore();
      clock.mockRestore();
    }

    expect(outcome.kind).toBe('completed');
    if (outcome.kind !== 'completed') return;
    expect(outcome.completion).toMatchObject({
      schema: TRAINING_FORGE_PRACTICE_COMPLETION_SCHEMA_V1,
      generation: 1,
      baseId: 'plate',
      name: 'Iron Plate',
      spentMaterials: [{ id: 'Fe', quantity: 4 }],
      outputCount: 1,
      outputLocation: 'stackable',
      event: {
        type: TRAINING_FORGE_PRACTICE_EVENT_V1,
        detail: {
          schema: TRAINING_FORGE_PRACTICE_COMPLETION_SCHEMA_V1,
          generation: 1,
          baseId: 'plate',
          outputCount: 1,
        },
      },
      liveEffects: {
        persistenceWrites: 0,
        receiptWrites: 0,
        sessionRngDraws: 0,
        inventoryWrites: 0,
        charterWrites: 0,
        achievementWrites: 0,
        routeWrites: 0,
      },
    });
    expect(outcome.completion.derivationWitness).toContain('"operation":"fabricate-fixed"');
    expect(outcome.snapshot).toMatchObject({ status: 'completed', retainedSandboxCount: 0 });
    expect(json(source.state)).toBe(beforeState);
    expect(json(source.extensions)).toBe(beforeExtensions);
    expect(readF4Authority(source.extensions)).toEqual(beforeRng);
    expect({
      cargo: source.state.cargo,
      cgx: source.state.cgx,
      items: source.state.items,
      equip: source.state.equip,
      equipAff: source.state.equipAff,
      stats: source.state.stats,
      ascCh: source.state.ascCh,
      ascProg: source.state.ascProg,
      chWeek: source.state.chWeek,
      chProg: source.state.chProg,
      chacc: source.state.chacc,
      chDone: source.state.chDone,
      unlocked: source.state.unlocked,
      savedView: source.state.savedView,
    }).toEqual(beforeSurfaces);
  });

  it('is deterministic from the same source and never advances the live F4 draw or receipt authority', () => {
    const source = sourceFixture();
    const beforeRng = readF4Authority(source.extensions);
    const run = () => {
      const adapter = createTrainingForgePracticeAdapterV1();
      const opened = adapter.enter(source);
      expect(opened.kind).toBe('ready');
      const crafted = adapter.fabricate();
      expect(crafted.kind).toBe('completed');
      if (crafted.kind !== 'completed') throw new Error(crafted.detail);
      return crafted.completion;
    };
    const first = run();
    const replay = run();
    expect(replay).toEqual(first);
    expect(readF4Authority(source.extensions)).toEqual(beforeRng);
    expect(beforeRng).toMatchObject({
      kind: 'loaded',
      authority: {
        activePlayMs: 44_000,
        sessionRng: { seed: 0xD7A1_0002, ordinal: 17, draws: { capture: 4, combat: 9 } },
      },
    });
  });

  it('brands sessions, rejects stale action/cleanup, and releases the one sandbox on close and dispose', () => {
    const authority = new TrainingForgePracticeAuthorityV1();
    const first = authority.open(sourceFixture());
    const second = authority.open(sourceFixture());
    expect(first.kind).toBe('ready');
    expect(second.kind).toBe('ready');
    if (first.kind !== 'ready' || second.kind !== 'ready') return;

    expect(authority.fabricate(first.ticket)).toMatchObject({
      kind: 'refused', reason: 'stale-session',
      snapshot: { status: 'ready', generation: 2, retainedSandboxCount: 1 },
    });
    expect(authority.close(first.ticket)).toMatchObject({
      kind: 'refused', reason: 'stale-session',
      snapshot: { status: 'ready', retainedSandboxCount: 1 },
    });
    const lookalike = Object.freeze({ ...second.ticket }) as TrainingForgePracticeTicketV1;
    expect(authority.fabricate(lookalike)).toMatchObject({
      kind: 'refused', reason: 'stale-session',
    });
    expect(authority.close(second.ticket)).toMatchObject({
      kind: 'closed', snapshot: { status: 'closed', retainedSandboxCount: 0 },
    });
    expect(authority.fabricate(second.ticket)).toMatchObject({
      kind: 'refused', reason: 'stale-session',
    });

    const third = authority.open(sourceFixture());
    expect(third.kind).toBe('ready');
    if (third.kind !== 'ready') return;
    const completed = authority.fabricate(third.ticket);
    expect(completed).toMatchObject({
      kind: 'completed', snapshot: { status: 'completed', retainedSandboxCount: 0 },
    });
    const completedRevision = authority.snapshot().revision;
    expect(authority.fabricate(third.ticket)).toMatchObject({
      kind: 'refused', reason: 'already-completed',
      snapshot: { retainedSandboxCount: 0 },
    });
    expect(authority.snapshot().revision).toBe(completedRevision);

    const fourth = authority.open(sourceFixture());
    expect(fourth.kind).toBe('ready');
    if (fourth.kind !== 'ready') return;
    expect(authority.dispose()).toMatchObject({ status: 'disposed', retainedSandboxCount: 0 });
    const disposed = authority.dispose();
    expect(authority.dispose()).toEqual(disposed);
    expect(authority.fabricate(fourth.ticket)).toMatchObject({
      kind: 'refused', reason: 'disposed', snapshot: { retainedSandboxCount: 0 },
    });
    expect(authority.close(fourth.ticket)).toMatchObject({
      kind: 'refused', reason: 'disposed', snapshot: { retainedSandboxCount: 0 },
    });
    expect(authority.open(sourceFixture())).toMatchObject({
      kind: 'refused', reason: 'disposed', snapshot: { retainedSandboxCount: 0 },
    });
  });

  it('fails closed on protected source carriers or a refused real derivation and retains no sandbox', () => {
    const future = sourceFixture();
    const futureExtensions = structuredClone(future.extensions) as Record<
      string,
      Record<string, { version: number; json: string }>
    >;
    futureExtensions[ARC2_LOOT_SEGMENT]![ARC2_LOOT_NAMESPACE] = { version: 99, json: '{}' };
    const protectedAuthority = new TrainingForgePracticeAuthorityV1();
    const beforeFuture = json(futureExtensions);
    expect(protectedAuthority.open({
      ...future,
      extensions: futureExtensions,
    })).toMatchObject({
      kind: 'refused',
      reason: 'source-protected',
      snapshot: { status: 'refused', retainedSandboxCount: 0 },
    });
    expect(json(futureExtensions)).toBe(beforeFuture);

    const corrupt = sourceFixture();
    const corruptExtensions = structuredClone(corrupt.extensions) as Record<
      string,
      Record<string, { version: number; json: string }>
    >;
    corruptExtensions[ARC3_ENGINEERING_SEGMENT]![ARC3_ENGINEERING_NAMESPACE] = {
      version: 1,
      json: '{}',
    };
    const refusedAuthority = new TrainingForgePracticeAuthorityV1();
    const beforeCorrupt = json(corruptExtensions);
    const opened = refusedAuthority.open({ ...corrupt, extensions: corruptExtensions });
    expect(opened.kind).toBe('ready');
    if (opened.kind !== 'ready') return;
    expect(refusedAuthority.fabricate(opened.ticket)).toMatchObject({
      kind: 'refused',
      reason: 'derivation-refused',
      detail: 'derive:arc3-carrier-corrupt',
      snapshot: { status: 'refused', retainedSandboxCount: 0 },
    });
    expect(json(corruptExtensions)).toBe(beforeCorrupt);

    const badClock = new TrainingForgePracticeAuthorityV1();
    expect(badClock.open({ ...sourceFixture(), codecNow: Number.NaN })).toMatchObject({
      kind: 'refused', reason: 'source-protected',
      snapshot: { retainedSandboxCount: 0 },
    });
  });

  it('provides a narrow Main/Training adapter with explicit enter, lesson event, exit, and teardown', () => {
    const adapter = createTrainingForgePracticeAdapterV1();
    expect(adapter.fabricate()).toMatchObject({ kind: 'refused', reason: 'not-open' });
    expect(adapter.enter(sourceFixture())).toMatchObject({
      kind: 'ready', snapshot: { revision: 1, generation: 1, status: 'ready' },
    });
    const result = adapter.fabricate();
    expect(result).toMatchObject({
      kind: 'completed',
      completion: {
        event: {
          type: TRAINING_FORGE_PRACTICE_EVENT_V1,
          detail: { baseId: 'plate', outputCount: 1 },
        },
      },
    });
    expect(adapter.exit()).toMatchObject({ status: 'closed', retainedSandboxCount: 0 });
    expect(adapter.fabricate()).toMatchObject({ kind: 'refused', reason: 'not-open' });
    expect(adapter.dispose()).toMatchObject({ status: 'disposed', retainedSandboxCount: 0 });
    expect(adapter.fabricate()).toMatchObject({ kind: 'refused', reason: 'disposed' });
  });
});
