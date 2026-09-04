import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { importSaveV2, type ContentRegistry, type SaveStateV2 } from '@cf/persistence';
import {
  CHECKPOINT_STATE_LIVE_OVERLAY_FIELDS,
  CHECKPOINT_STATE_OVERLAY_FIELDS,
  CHECKPOINT_STATE_TRAINING_REPLACEMENT_FIELDS,
  SAVE_STATE_V2_FIELD_INVENTORY,
  projectCheckpointState,
  type CheckpointStateInput,
  type CheckpointStateProjection,
} from '../apps/game/src/checkpoint-state.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const baseline = path.join(here, '..', '..', 'baseline-v1.8.9');
const REGISTRY = JSON.parse(fs.readFileSync(
  path.join(baseline, 'content-registry.json'),
  'utf8',
)) as ContentRegistry;
const NOW = 1_753_900_060_000;

function baseState(): SaveStateV2 {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(`checkpoint base save failed: ${imported.reason}`);
  return imported.state;
}

function projected(outcome: CheckpointStateProjection): Extract<CheckpointStateProjection, {
  readonly kind: 'projected';
}> {
  if (outcome.kind !== 'projected') throw new Error(`checkpoint refused: ${outcome.detail}`);
  return outcome;
}

function input(
  durable: SaveStateV2,
  live: SaveStateV2,
  trainingReplacement = false,
): CheckpointStateInput {
  return {
    durable,
    live,
    savedView: {
      type: 'galaxy',
      gal: { seed: 999, x: 90, y: -60 },
    },
    epoch: 42,
    trainingReplacement,
  };
}

function liveValue(field: keyof SaveStateV2, value: unknown): unknown {
  switch (field) {
    case 'EPOCH_BASE': return 9_999;
    case 'savedView': return { type: 'planet', pseed: 999_999 };
    case 'explorerName': return 'Live Explorer';
    case 'nameHue': return 3;
    case 'pinnedRecipe': return 'live-recipe';
    case 'cargoTab': return 'gear';
    case 'fsMode': return 'fs-xl';
    case 'toneMode': return 'tone-max';
    case 'fontMode': return 'font-mono';
    case 'sndOn':
    case 'fxOn':
    case 'chartsOn':
    case 'shakeOn':
    case 'salvageConfirm':
    case 'notifOn':
    case 'tipsOn':
    case 'seenGuide':
    case 'voiceOn':
    case 'combatSfxOn': return !value;
    case 'sfxVol': return 0.31;
    case 'glassTint': return 0.61;
    case 'motionMode': return 1;
    case 'cardExpand': return 7;
    case 'rnSeen': return 'live-rn';
    case 'tutDone': return !value;
    case 'tutSnapPending': return { view: { type: 'star', live: true } };
    default:
      if (typeof value === 'number') return value === 123 ? 124 : 123;
      if (typeof value === 'string') return `live-${field}`;
      if (typeof value === 'boolean') return !value;
      if (Array.isArray(value)) return [`live-${field}`];
      return { live: field };
  }
}

function allFieldsMutated(state: SaveStateV2): SaveStateV2 {
  const live = structuredClone(state) as SaveStateV2;
  const record = live as unknown as Record<string, unknown>;
  for (const field of SAVE_STATE_V2_FIELD_INVENTORY) {
    record[field] = liveValue(field, record[field]);
  }
  return live;
}

describe('receipt-free checkpoint state projector', () => {
  it('exports an exhaustive save inventory and the exact ordinary/training touch scopes', () => {
    const stateKeys = Object.keys(baseState()).sort();
    const inventory = [...SAVE_STATE_V2_FIELD_INVENTORY].sort();
    expect(new Set(inventory).size).toBe(inventory.length);
    expect(inventory).toEqual(stateKeys);
    expect(CHECKPOINT_STATE_OVERLAY_FIELDS).toEqual([
      'EPOCH_BASE', 'savedView', 'explorerName', 'nameHue', 'pinnedRecipe', 'cargoTab',
      'fsMode', 'toneMode', 'fontMode', 'sndOn', 'fxOn', 'chartsOn', 'shakeOn',
      'salvageConfirm', 'notifOn', 'tipsOn', 'sfxVol', 'glassTint', 'motionMode',
      'cardExpand', 'seenGuide', 'rnSeen', 'voiceOn', 'combatSfxOn',
    ]);
    expect(CHECKPOINT_STATE_LIVE_OVERLAY_FIELDS).toEqual([
      'explorerName', 'nameHue', 'pinnedRecipe', 'cargoTab', 'fsMode', 'toneMode',
      'fontMode', 'sndOn', 'fxOn', 'chartsOn', 'shakeOn', 'salvageConfirm',
      'notifOn', 'tipsOn', 'sfxVol', 'glassTint', 'motionMode', 'cardExpand',
      'seenGuide', 'rnSeen', 'voiceOn', 'combatSfxOn',
    ]);
    expect(CHECKPOINT_STATE_TRAINING_REPLACEMENT_FIELDS).toEqual([
      'tutDone', 'tutSnapPending',
    ]);
    const overlap = CHECKPOINT_STATE_TRAINING_REPLACEMENT_FIELDS.filter((field) => (
      (CHECKPOINT_STATE_OVERLAY_FIELDS as readonly string[]).includes(field)
    ));
    expect(overlap).toEqual([]);
  });

  it('mutates every live top-level field but overlays only the exact ordinary scope', () => {
    const durable = baseState();
    durable.stats.essenceEarned = 17;
    durable.customNames = [['p133', 'Durable Earth']];
    durable.logMap = [['durable-atlas', { id: 'durable-atlas', title: 'Keep' }]];
    durable.tutDone = true;
    durable.tutSnapPending = { durable: true };
    const durableBefore = structuredClone(durable);
    const live = allFieldsMutated(durable);
    const request = input(durable, live, false);
    const outcome = projected(projectCheckpointState(request));
    const output = outcome.state as unknown as Record<string, unknown>;
    const durableRecord = durableBefore as unknown as Record<string, unknown>;
    const liveRecord = live as unknown as Record<string, unknown>;
    const liveOverlay = new Set<string>(CHECKPOINT_STATE_LIVE_OVERLAY_FIELDS);

    expect(outcome.appliedFields).toEqual(CHECKPOINT_STATE_OVERLAY_FIELDS);
    for (const field of SAVE_STATE_V2_FIELD_INVENTORY) {
      if (field === 'EPOCH_BASE') expect(output[field], field).toBe(42);
      else if (field === 'savedView') expect(output[field], field).toEqual(request.savedView);
      else if (liveOverlay.has(field)) expect(output[field], field).toEqual(liveRecord[field]);
      else expect(output[field], field).toEqual(durableRecord[field]);
    }
    expect(outcome.state.customNames).toEqual([['p133', 'Durable Earth']]);
    expect(outcome.state.logMap).toEqual([
      ['durable-atlas', { id: 'durable-atlas', title: 'Keep' }],
    ]);
    expect(outcome.state.tutDone).toBe(true);
    expect(outcome.state.tutSnapPending).toEqual({ durable: true });
    expect(durable).toEqual(durableBefore);
  });

  it('adds only tutDone and tutSnapPending for an explicit Training replacement', () => {
    const durable = baseState();
    durable.tutDone = true;
    durable.tutSnapPending = { durable: 'checkpoint' };
    const live = allFieldsMutated(durable);
    const outcome = projected(projectCheckpointState(input(durable, live, true)));

    expect(outcome.appliedFields).toEqual([
      ...CHECKPOINT_STATE_OVERLAY_FIELDS,
      ...CHECKPOINT_STATE_TRAINING_REPLACEMENT_FIELDS,
    ]);
    expect(outcome.state.tutDone).toBe(live.tutDone);
    expect(outcome.state.tutSnapPending).toEqual(live.tutSnapPending);
    expect(outcome.state.stats).toEqual(durable.stats);
    expect(outcome.state.customNames).toEqual(durable.customNames);
    expect(outcome.state.logMap).toEqual(durable.logMap);
  });

  it('detaches the durable tree, explicit route, and Training evidence in both directions', () => {
    const durable = baseState();
    durable.stats = { ...durable.stats, essenceEarned: 9 };
    durable.logMap = [['atlas-1', { id: 'atlas-1', nested: { durable: true } }]];
    const live = structuredClone(durable);
    live.tutDone = false;
    live.tutSnapPending = { view: { type: 'galaxy', live: true } };
    const savedView = { type: 'star', star: { seed: 424242, x: 560, y: 170 } };
    const outcome = projected(projectCheckpointState({
      durable, live, savedView, epoch: 19, trainingReplacement: true,
    }));

    expect(outcome.state).not.toBe(durable);
    expect(outcome.state.stats).not.toBe(durable.stats);
    expect(outcome.state.logMap).not.toBe(durable.logMap);
    expect(outcome.state.savedView).not.toBe(savedView);
    expect(outcome.state.tutSnapPending).not.toBe(live.tutSnapPending);

    durable.stats.essenceEarned = 999;
    (durable.logMap[0]![1].nested as { durable: boolean }).durable = false;
    savedView.star.seed = 1;
    (live.tutSnapPending as { view: { live: boolean } }).view.live = false;
    expect(outcome.state.stats.essenceEarned).toBe(9);
    expect(outcome.state.logMap[0]![1]).toEqual({
      id: 'atlas-1', nested: { durable: true },
    });
    expect((outcome.state.savedView!.star as { seed: number }).seed).toBe(424242);
    expect(outcome.state.tutSnapPending).toEqual({
      view: { type: 'galaxy', live: true },
    });

    outcome.state.stats.essenceEarned = 111;
    (outcome.state.savedView!.star as { seed: number }).seed = 222;
    (outcome.state.tutSnapPending as { view: { live: boolean } }).view.live = true;
    expect(durable.stats.essenceEarned).toBe(999);
    expect(savedView.star.seed).toBe(1);
    expect((live.tutSnapPending as { view: { live: boolean } }).view.live).toBe(false);
  });

  it('is deterministic and reaches the same ordinary and Training fixed points', () => {
    const durable = baseState();
    const live = allFieldsMutated(durable);
    const ordinaryFirst = projected(projectCheckpointState(input(durable, live, false)));
    const ordinarySecond = projected(projectCheckpointState({
      durable: ordinaryFirst.state,
      live: ordinaryFirst.state,
      savedView: ordinaryFirst.state.savedView,
      epoch: ordinaryFirst.state.EPOCH_BASE,
      trainingReplacement: false,
    }));
    expect(ordinarySecond.state).toEqual(ordinaryFirst.state);
    expect(ordinarySecond.state).not.toBe(ordinaryFirst.state);

    const trainingFirst = projected(projectCheckpointState(input(durable, live, true)));
    const trainingSecond = projected(projectCheckpointState({
      durable: trainingFirst.state,
      live: trainingFirst.state,
      savedView: trainingFirst.state.savedView,
      epoch: trainingFirst.state.EPOCH_BASE,
      trainingReplacement: true,
    }));
    expect(trainingSecond.state).toEqual(trainingFirst.state);
    expect(JSON.stringify(trainingSecond)).toBe(JSON.stringify(trainingFirst));
  });

  it('accepts the optional overflow binding as absent without minting it', () => {
    const durable = baseState();
    const live = baseState();
    delete durable.xpFirstsBinding;
    delete live.xpFirstsBinding;
    const outcome = projected(projectCheckpointState(input(durable, live)));
    expect(Object.prototype.hasOwnProperty.call(outcome.state, 'xpFirstsBinding')).toBe(false);
  });

  it.each([
    ['durable cycle', (request: CheckpointStateInput) => {
      (request.durable.stats as Record<string, unknown>).self = request.durable.stats;
    }, 'durable:invalid'],
    ['durable accessor', (request: CheckpointStateInput) => {
      Object.defineProperty(request.durable, 'stats', { enumerable: true, get: () => ({}) });
    }, 'durable:invalid'],
    ['live top-level accessor', (request: CheckpointStateInput) => {
      Object.defineProperty(request.live, 'stats', { enumerable: true, get: () => ({}) });
    }, 'live:invalid'],
    ['saved-view cycle', (request: CheckpointStateInput) => {
      const view = request.savedView as Record<string, unknown>;
      view.self = view;
    }, 'saved-view:invalid'],
    ['saved-view accessor', (request: CheckpointStateInput) => {
      Object.defineProperty(request.savedView!, 'type', { enumerable: true, get: () => 'star' });
    }, 'saved-view:invalid'],
    ['Training snapshot cycle', (request: CheckpointStateInput) => {
      const snapshot: Record<string, unknown> = {};
      snapshot.self = snapshot;
      request.live.tutSnapPending = snapshot;
      Object.assign(request as unknown as { trainingReplacement: boolean }, {
        trainingReplacement: true,
      });
    }, 'training-field:tutSnapPending:invalid'],
  ] as const)('refuses %s without exposing a partial candidate', (_label, mutate, detail) => {
    const request = input(baseState(), baseState());
    mutate(request);
    expect(projectCheckpointState(request)).toEqual({ kind: 'refused', detail });
  });

  it('fails closed on input, durable, live, and saved-view proxies', () => {
    const addressable = input(baseState(), baseState());
    const hostileInput = new Proxy(addressable, {
      getPrototypeOf() { throw new Error('input proxy trap'); },
    });
    expect(projectCheckpointState(hostileInput)).toEqual({
      kind: 'refused', detail: 'input:invalid',
    });

    const durableProxy = input(baseState(), baseState());
    Object.assign(durableProxy as unknown as { durable: SaveStateV2 }, {
      durable: new Proxy(durableProxy.durable, {
        getPrototypeOf() { throw new Error('durable proxy trap'); },
      }),
    });
    expect(projectCheckpointState(durableProxy).kind).toBe('refused');

    const liveProxy = input(baseState(), baseState());
    Object.assign(liveProxy as unknown as { live: SaveStateV2 }, {
      live: new Proxy(liveProxy.live, {
        ownKeys() { throw new Error('live proxy trap'); },
      }),
    });
    expect(projectCheckpointState(liveProxy).kind).toBe('refused');

    const viewProxy = input(baseState(), baseState());
    Object.assign(viewProxy as unknown as { savedView: Record<string, unknown> }, {
      savedView: new Proxy(viewProxy.savedView!, {
        getPrototypeOf() { throw new Error('view proxy trap'); },
      }),
    });
    expect(projectCheckpointState(viewProxy)).toEqual({
      kind: 'refused', detail: 'saved-view:invalid',
    });
  });

  it('does not traverse or inherit a cyclic forbidden live product subtree', () => {
    const durable = baseState();
    durable.stats.essenceEarned = 5;
    const live = baseState();
    const cyclic = live.stats as Record<string, unknown>;
    cyclic.self = cyclic;
    const outcome = projected(projectCheckpointState(input(durable, live, false)));
    expect(outcome.state.stats).toEqual(durable.stats);
    expect((outcome.state.stats as Record<string, unknown>).self).toBeUndefined();
  });

  it.each([
    ['explorerName', 7, 'live-field:explorerName:invalid'],
    ['sndOn', 'yes', 'live-field:sndOn:invalid'],
    ['sfxVol', Number.NaN, 'live-field:sfxVol:invalid'],
    ['pinnedRecipe', {}, 'live-field:pinnedRecipe:invalid'],
  ] as const)('rejects malformed live %s', (field, value, detail) => {
    const request = input(baseState(), baseState());
    (request.live as unknown as Record<string, unknown>)[field] = value;
    expect(projectCheckpointState(request)).toEqual({ kind: 'refused', detail });
  });

  it('rejects malformed replacement-only and explicit inputs', () => {
    const badTraining = input(baseState(), baseState(), true);
    (badTraining.live as unknown as Record<string, unknown>).tutDone = 'yes';
    expect(projectCheckpointState(badTraining)).toEqual({
      kind: 'refused', detail: 'training-field:tutDone:invalid',
    });

    for (const epoch of [-1, 10_001, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      const request = input(baseState(), baseState());
      Object.assign(request as unknown as { epoch: number }, { epoch });
      expect(projectCheckpointState(request), String(epoch)).toEqual({
        kind: 'refused', detail: 'epoch:invalid',
      });
    }

    const extra = { ...input(baseState(), baseState()), extra: true } as unknown as CheckpointStateInput;
    expect(projectCheckpointState(extra)).toEqual({ kind: 'refused', detail: 'input:invalid' });
  });
});
