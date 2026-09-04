import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  exportSaveV2,
  importSaveV2,
  prepareV5Replacement,
  type ContentRegistry,
  type SaveStateV2,
} from '@cf/persistence';
import { commitArc9ProgressionRefreshV1 } from '../apps/game/src/arc9-progression-action.js';
import { prepareArc9ProgressionRefreshV1 } from '../apps/game/src/arc9-progression-projection.js';
// @ts-expect-error The executable browser evidence contract intentionally has no declaration shim.
import { assessF4NativeReplacementTrace, assessF4ReplacementOutcome, assessF4ReplacementPrefix, assessF4ReplacementSetup, beginF4GreenContinuation, legacyPostBootProductDigest } from '../tools/slicesmoke-contract.mjs';

const fixtureRaw = fs.readFileSync(
  new URL('../tools/fixtures/arc2-live-outcomes-v1.json', import.meta.url),
  'utf8',
).trim();
const registry = JSON.parse(fs.readFileSync(
  new URL('../../baseline-v1.8.9/content-registry.json', import.meta.url),
  'utf8',
)) as ContentRegistry;
const envelope = JSON.parse(fixtureRaw) as { legacyV4: string };
const sourceLegacy = JSON.parse(envelope.legacyV4) as Record<string, unknown>;
const SOURCE_UNLOCKED = Object.freeze(['first', 'field10', 'fake']);
const ADDED = Object.freeze([
  'hybrid', 'rare', 'crafter', 'geared', 'lastvein', 'cosmicfind',
  'skimmer', 'event1', 'event5', 'guard1', 'essence500', 'bred1',
  'bredfail', 'feed5', 'feedfail', 'duel1', 'duelw1', 'jumps5',
]);
const SUCCESSOR_UNLOCKED = Object.freeze([...SOURCE_UNLOCKED, ...ADDED]);
const FIXTURE_SHA = 'bf908135e38024ee5d11eb9e5811c23c1b2f6c79b8c8a9c9bfc81b94fe24c8a3';
const SOURCE_SHA = '57e9d86d1847ab0bd7d8ba4579b2bfd5a51f9b65715fc1ef412db050a6fadd88';
const SUCCESSOR_PRODUCT_SHA = 'e40a542553ab61a1f9c5800e856a8f1e3c5efd341fdb73dec776d622258bd31c';
const PROGRESSION_WITNESS = 'arc9p1:a8f5961bf107300e280aa9cda8160e051e02ab691c80cda40eaf87642d4f62c9';
const PROJECTION_NOW = Number(sourceLegacy.at) + 18_000_001;
const OUTCOME_NOW = PROJECTION_NOW + 175;

const canonicalEarthView = Object.freeze({
  type: 'planet',
  gal: Object.freeze({
    x: 90, y: -60, size: 78, sp: 0, tilt: 0.62, rot: 0.5,
    seed: 999, home: true, quasar: false, dwarf: false,
  }),
  star: Object.freeze({ x: 560, y: 170, seed: 424242 }),
  pseed: 133,
});
const canonicalEarthAtlasWhere = Object.freeze({
  type: 'planet',
  gal: Object.freeze({
    x: 90, y: -60, size: 78, sp: 0, tilt: 0.62, rot: 0.5,
    seed: 999, home: true,
  }),
  star: Object.freeze({ x: 560, y: 170, seed: 424242 }),
  pseed: 133,
});

function applyExpectedRouteRepair(state: SaveStateV2): SaveStateV2 {
  const repaired = structuredClone(state);
  repaired.savedView = structuredClone(canonicalEarthView);
  for (const [id, entry] of repaired.logMap) {
    if (id === 'p133') entry.where = structuredClone(canonicalEarthAtlasWhere);
    if (id === 'forged-earth') entry.where = null;
  }
  return repaired;
}

function fixedPointRaw(state: SaveStateV2, now: number): string {
  const first = exportSaveV2(state, now);
  const imported = importSaveV2(first, registry, now);
  if (!imported.ok) throw new Error(`expected projection import failed: ${imported.reason}`);
  const second = exportSaveV2(imported.state, now);
  const checked = importSaveV2(second, registry, now);
  if (!checked.ok || exportSaveV2(checked.state, now) !== second) {
    throw new Error('expected projection did not reach the production codec fixed point');
  }
  return second;
}

const readyExpectation = Object.freeze({
  schema: 'cf-v2-f4-replacement-expectation/v2',
  fixtureSha256: FIXTURE_SHA,
  sourceLegacySha256: SOURCE_SHA,
  successorProductProjectionSha256: SUCCESSOR_PRODUCT_SHA,
  preparation: 'ready',
  sourceUnlockedIds: SOURCE_UNLOCKED,
  addedAchievementIds: ADDED,
  successorUnlockedIds: SUCCESSOR_UNLOCKED,
  priorBestRankIndex: 3,
  nextBestRankIndex: 3,
  receiptFreeBootCommits: 1,
  progressionWitness: PROGRESSION_WITNESS,
});

const replacementPreparation = (() => {
  const prepared = prepareV5Replacement(fixtureRaw, registry, PROJECTION_NOW);
  if (prepared.kind !== 'prepared') throw new Error(`replacement fixture is ${prepared.kind}`);
  return prepared;
})();
const readyProgression = (() => {
  const prepared = prepareArc9ProgressionRefreshV1(replacementPreparation.state);
  if (prepared.kind !== 'ready') throw new Error(`progression fixture is ${prepared.kind}`);
  return prepared;
})();
const readyResetLegacyRaw = fixedPointRaw(
  applyExpectedRouteRepair(readyProgression.successorState),
  PROJECTION_NOW,
);
const readyAfterLegacyRaw = (() => {
  const imported = importSaveV2(readyResetLegacyRaw, registry, OUTCOME_NOW);
  if (!imported.ok) throw new Error(`outcome clock import failed: ${imported.reason}`);
  return fixedPointRaw(imported.state, OUTCOME_NOW);
})();

function nativeReplacementTrace(predecessorRevision: number) {
  const request = (
    method: 'get' | 'clear' | 'put' | 'delete',
    store: string,
    key: string | null,
    argumentCount: number,
    fields: Record<string, unknown> = {},
  ) => ({
    method, store, key, argumentCount, keyPath: null, autoIncrement: false,
    indexNames: [], nativeRequest: true, requestSucceeded: true, ...fields,
  });
  const operationCalls = replacementPreparation.operations.map((operation) => (
    operation.value === undefined
      ? request('delete', operation.store, operation.key, 1)
      : request('put', operation.store, operation.key, 2, { value: operation.value })
  ));
  const calls = [
    request('get', 'meta', 'f3:revision', 1, { result: String(predecessorRevision) }),
    request('get', 'meta', 'f3:lease:active-play', 1, { result: JSON.stringify({
      schema: 1, held: true, ownerId: 'slice-smoke-owner', token: 'slice-smoke-token', heartbeat: 7,
    }) }),
    request('clear', 'receipts', null, 0),
    ...operationCalls,
    request('put', 'meta', 'f3:revision', 2, { value: String(predecessorRevision + 1) }),
  ];
  return {
    schema: 'cf-v2-f4-replacement-native/v3', fixtureSha256: FIXTURE_SHA,
    status: 'complete', candidateCount: 1, transactionError: false, mode: 'readwrite',
    stores: ['catalog', 'creatures', 'inventory', 'journal', 'meta', 'player', 'receipts', 'settings'],
    calls, replacementRevision: predecessorRevision + 1, legacyRaw: envelope.legacyV4,
    playerSchema: 5, authorityCarrierPresent: false, carrierVersion: null,
  };
}

function readyBundle() {
  const progressionReceipt = {
    ordinal: 0, kind: 'arc9-progression-refresh-v1', witness: PROGRESSION_WITNESS,
  };
  const smokeReceipt = {
    ordinal: 1, kind: 'slice-smoke-f4-outcome', witness: 'slice-smoke-f4:1:0.25',
  };
  const resetState = {
    save: { unlocked: [...SUCCESSOR_UNLOCKED], stats: { bestRank: 3 } },
    persistence: {
      lastOutcome: 'arc9-progression-committed:11',
      runtime: { revision: 11, sessionSeed: 123, sessionOrdinal: 1, sessionDraws: {}, commits: 2 },
    },
  };
  return {
    staged: {
      revision: 8,
      ordinal: 1,
      receiptKeys: ['receipt:0'],
      receiptRows: [{ ordinal: 0, kind: 'slice-smoke-old-expedition', witness: 'old-expedition:0' }],
    },
    replacement: nativeReplacementTrace(8),
    reset: {
      state: resetState,
      raw: {
        revision: 11, seed: 123, ordinal: 1, draws: {}, legacyRaw: readyResetLegacyRaw,
        receiptKeys: ['receipt:0'], receiptRows: [progressionReceipt],
      },
      ceremony: { toastOn: false, toastSerial: 0, queuedFx: 0 },
    },
    outcome: {
      kind: 'committed', beforeRevision: 11, afterRevision: 12, revision: 12,
      beforeOrdinal: 1, afterOrdinal: 2,
      plan: { value: 0.25, receiptOrdinal: 1 }, receipt: smokeReceipt,
    },
    after: {
      state: {
        save: resetState.save,
        persistence: {
          lastOutcome: 'outcome-committed:12',
          runtime: {
            revision: 12, sessionSeed: 123, sessionOrdinal: 2,
            sessionDraws: { 'diagnostics.slice-smoke.f4': 1 }, commits: 3,
          },
        },
      },
      raw: {
        revision: 12, seed: 123, ordinal: 2,
        legacyRaw: readyAfterLegacyRaw,
        draws: { 'diagnostics.slice-smoke.f4': 1 },
        receiptKeys: ['receipt:0', 'receipt:1'],
        receiptRows: [progressionReceipt, smokeReceipt],
      },
    },
    productStable: true,
    codecWindow: {
      startedAt: PROJECTION_NOW - 1,
      prefixEndedAt: PROJECTION_NOW + 1,
      endedAt: OUTCOME_NOW + 1,
    },
    expectation: readyExpectation,
  };
}

describe('Slice F4 replacement progression boundary', () => {
  it('seals the exact imported fixture, production projection and ordinal-zero witness', async () => {
    expect(createHash('sha256').update(fixtureRaw).digest('hex')).toBe(FIXTURE_SHA);
    expect(createHash('sha256').update(envelope.legacyV4).digest('hex')).toBe(SOURCE_SHA);
    const imported = prepareV5Replacement(fixtureRaw, registry, PROJECTION_NOW);
    expect(imported.kind).toBe('prepared');
    if (imported.kind !== 'prepared') return;
    const plan = prepareArc9ProgressionRefreshV1(imported.state);
    expect(plan.kind).toBe('ready');
    if (plan.kind !== 'ready') return;
    expect(plan.source.unlockedIds).toEqual(SOURCE_UNLOCKED);
    expect(plan.addedAchievementIds).toEqual(ADDED);
    expect(plan.successor.unlockedIds).toEqual(SUCCESSOR_UNLOCKED);
    expect([plan.priorBestRankIndex, plan.nextBestRankIndex]).toEqual([3, 3]);
    expect(prepareArc9ProgressionRefreshV1(plan.successorState).kind).toBe('current');
    expect(legacyPostBootProductDigest(readyResetLegacyRaw)).toBe(SUCCESSOR_PRODUCT_SHA);
    expect(legacyPostBootProductDigest(readyAfterLegacyRaw)).toBe(SUCCESSOR_PRODUCT_SHA);
    expect(assessF4NativeReplacementTrace({
      staged: readyBundle().staged,
      replacement: readyBundle().replacement,
      expectation: readyExpectation,
    })).toEqual({ ok: true, reasons: [] });

    const runtime = {
      commitAction: async (input: any) => {
        const derived = input.derive({ receiptOrdinal: 0, draft: structuredClone(input.state) });
        const receipt = { ordinal: 0, kind: input.receiptKind, witness: derived.witness };
        return {
          kind: 'committed', revision: 1, state: derived.state,
          saved: { canonicalState: derived.state },
          plan: { operation: input.operation, receiptOrdinal: 0 }, receipt,
        };
      },
    };
    const committed = await commitArc9ProgressionRefreshV1({
      runtime: runtime as never,
      state: imported.state,
      codecNow: PROJECTION_NOW,
    });
    expect(committed.kind).toBe('committed');
    if (committed.kind === 'committed') expect(committed.witness).toBe(PROGRESSION_WITNESS);
  });

  it('accepts the independently selected ready branch and rejects isolated mutants', () => {
    const baseline = readyBundle();
    expect(assessF4ReplacementPrefix({
      staged: baseline.staged,
      replacement: baseline.replacement,
      reset: baseline.reset,
      codecWindow: {
        startedAt: baseline.codecWindow.startedAt,
        endedAt: baseline.codecWindow.prefixEndedAt,
      },
      expectation: baseline.expectation,
    })).toEqual({ ok: true, reasons: [] });
    expect(assessF4ReplacementOutcome(baseline)).toEqual({ ok: true, reasons: [] });
    const mutations: [string, ReturnType<typeof readyBundle>][] = [
      ['old receipt fixture', { ...baseline, staged: { ...baseline.staged,
        receiptRows: [{ ...baseline.staged.receiptRows[0]!, witness: 'old-expedition:wrong' }] } }],
      ['native atomic clear', { ...baseline, replacement: { ...baseline.replacement,
        calls: baseline.replacement.calls.slice(1),
      } }],
      ['replacement boundary', { ...baseline, replacement: { ...baseline.replacement,
        authorityCarrierPresent: true,
      } }],
      ['branch selection', { ...baseline, reset: { ...baseline.reset, raw: { ...baseline.reset.raw,
        receiptRows: [{ ...baseline.reset.raw.receiptRows[0]!, witness: 'arc9p1:wrong' }] } } }],
      ['boot revision and RNG', { ...baseline, reset: { ...baseline.reset, raw: { ...baseline.reset.raw, revision: 12 } } }],
      ['aggregate progression delta', { ...baseline, reset: { ...baseline.reset,
        state: { ...baseline.reset.state, save: { ...baseline.reset.state.save,
          unlocked: SUCCESSOR_UNLOCKED.slice(0, -1),
        } },
      } }],
      ['unrelated replacement state', { ...baseline, reset: { ...baseline.reset,
        raw: { ...baseline.reset.raw, legacyRaw: JSON.stringify({
          ...JSON.parse(baseline.reset.raw.legacyRaw), essence: 5001,
        }) },
      } }],
      ['codec clock', { ...baseline, codecWindow: {
        ...baseline.codecWindow, startedAt: OUTCOME_NOW + 2,
      } }],
      ['boot presentation silence', { ...baseline, reset: { ...baseline.reset,
        ceremony: { ...baseline.reset.ceremony, toastOn: true },
      } }],
      ['real outcome receipt', { ...baseline, outcome: { ...baseline.outcome, beforeOrdinal: 0 } }],
      ['outcome revision', { ...baseline, outcome: { ...baseline.outcome, afterRevision: 13 } }],
      ['durable outcome parity', { ...baseline, after: { ...baseline.after,
        raw: { ...baseline.after.raw, ordinal: 1 },
      } }],
      ['product changed', { ...baseline, productStable: false }],
    ];
    for (const [reason, mutant] of mutations) {
      expect(assessF4ReplacementOutcome(mutant).reasons, reason).toContain(reason);
    }
  });

  it('rejects every native transaction split, lifecycle, request, fence, row, and journal mutant', () => {
    const baseline = readyBundle();
    const base = baseline.replacement;
    const mutateCall = (index: number, fields: Record<string, unknown>) => ({
      ...base,
      calls: base.calls.map((call, callIndex) => callIndex === index ? { ...call, ...fields } : call),
    });
    const valueMutation = (
      index: number,
      mutate: (value: Record<string, any>) => void,
      traceFields: Record<string, unknown> = {},
    ) => {
      const value = JSON.parse(String((base.calls[index] as { value?: unknown }).value)) as Record<string, any>;
      mutate(value);
      return { ...mutateCall(index, { value: JSON.stringify(value) }), ...traceFields };
    };
    const swapped = structuredClone(base.calls);
    [swapped[3], swapped[4]] = [swapped[4]!, swapped[3]!];
    const mutants: Array<[string, typeof base]> = [
      ['wrong trace fixture provenance', { ...base, fixtureSha256: '0'.repeat(64) }],
      ['aborted transaction', { ...base, status: 'aborted' }],
      ['second qualifying transaction', { ...base, candidateCount: 2 }],
      ['transaction error', { ...base, transactionError: true }],
      ['reordered requests', { ...base, calls: swapped }],
      ['missing request', { ...base, calls: base.calls.slice(0, -1) }],
      ['extra request', { ...base, calls: [...base.calls, { ...base.calls[12]! }] }],
      ['non-native request', mutateCall(3, { nativeRequest: false })],
      ['failed request', mutateCall(3, { requestSucceeded: false })],
      ['one-argument put', mutateCall(3, { argumentCount: 1 })],
      ['keyPath store', mutateCall(3, { keyPath: 'id' })],
      ['auto-increment store', mutateCall(3, { autoIncrement: true })],
      ['indexed store', mutateCall(3, { indexNames: ['hidden'] })],
      ['wrong predecessor', mutateCall(0, { result: '7' })],
      ['malformed lease', mutateCall(1, { result: '{"schema":1}' })],
      ['wrong final revision', mutateCall(12, { value: '10' })],
      ['replacement F4 carrier survived', valueMutation(3, (row) => {
        row.extensions = { 'f4.authority': { version: 1, json: '{}' } };
      }, { authorityCarrierPresent: true, carrierVersion: 1 })],
      ['wrong segment', valueMutation(4, (row) => { row.segment = 'catalog'; })],
      ['wrong inventory extension', valueMutation(6, (row) => {
        row.extensions.inventory = { version: 1, json: '{}' };
      })],
      ['wrong legacy mirror', mutateCall(8, { value: '{}', legacyRaw: '{}' })],
      ['wrong snapshot', valueMutation(10, (row) => { row.sourceSchema = 4; })],
      ['wrong migration', valueMutation(11, (row) => { row.codec = 'wrong'; })],
    ];
    for (const [label, replacement] of mutants) {
      expect(assessF4NativeReplacementTrace({
        staged: baseline.staged,
        replacement,
        expectation: baseline.expectation,
      }).ok, label).toBe(false);
    }
  });

  it('keeps clock passage narrow and every route/product field exact', () => {
    const baseline = readyBundle();
    const mutateRaw = (mutate: (state: Record<string, any>) => void): string => {
      const state = JSON.parse(baseline.reset.raw.legacyRaw) as Record<string, any>;
      mutate(state);
      return JSON.stringify(state);
    };
    const mutants: Array<[string, string]> = [
      ['conquest stamp', mutateRaw((state) => { state.conq[0][1].t = 0; })],
      ['mined stamp', mutateRaw((state) => { state.minedw[0][1] = 0; })],
      ['save clock without owned stamps', mutateRaw((state) => { state.at += 1; })],
      ['saved route geometry', mutateRaw((state) => { state.view.gal.size += 1; })],
      ['Earth Atlas route', mutateRaw((state) => { state.log[0].where = null; })],
      ['forged Atlas revival', mutateRaw((state) => {
        state.log[2].where = structuredClone(canonicalEarthAtlasWhere);
      })],
      ['achievement bytes', mutateRaw((state) => { state.ach.pop(); })],
      ['essence', mutateRaw((state) => { state.essence += 1; })],
      ['cargo', mutateRaw((state) => { state.cargo[0][1] += 1; })],
      ['Prime', mutateRaw((state) => { state.prime.stone.tier += 1; })],
      ['Codex', mutateRaw((state) => { state.codex[0].g.seed += 1; })],
    ];
    for (const [label, legacyRaw] of mutants) {
      const result = assessF4ReplacementOutcome({
        ...baseline,
        reset: { ...baseline.reset, raw: { ...baseline.reset.raw, legacyRaw } },
      });
      expect(result.reasons, label).toContain('unrelated replacement state');
    }
  });

  it('executes no guarded continuation for red setup/prefix authority', () => {
    let calls = 0;
    const staged = readyBundle().staged;
    const documentToken = 'f4-replacement-document';
    const heartbeatQuiescence = {
      schema: 'cf-v2-f4-heartbeat-quiescence/v1',
      documentToken,
      wasRunning: true,
      stopped: true,
      cycleSettled: true,
    };
    expect(assessF4ReplacementSetup({
      heartbeatQuiescence,
      documentToken,
      stageStarted: true,
      traceArmed: true,
      staged,
    })).toEqual({ ok: true, reasons: [] });
    expect(assessF4ReplacementSetup({
      heartbeatQuiescence,
      documentToken,
      stageStarted: false,
      traceArmed: false,
      staged,
    })).toEqual({
      ok: false,
      reasons: ['old receipt stage', 'native replacement tracer arm'],
    });
    expect(assessF4ReplacementSetup({
      heartbeatQuiescence: { ...heartbeatQuiescence, cycleSettled: false },
      documentToken,
      stageStarted: true,
      traceArmed: true,
      staged,
    })).toEqual({ ok: false, reasons: ['heartbeat quiescence'] });
    const redSetup = assessF4ReplacementSetup({
      heartbeatQuiescence,
      documentToken,
      stageStarted: true,
      traceArmed: true,
      staged: {
        ...staged,
        receiptRows: [{ ...staged.receiptRows[0], witness: 'wrong-old-expedition' }],
      },
    });
    expect(redSetup).toEqual({ ok: false, reasons: ['old receipt fixture'] });
    const deniedSetup = beginF4GreenContinuation(
      redSetup,
      () => { calls++; return 'imported'; },
    );
    expect(deniedSetup).toEqual({ kind: 'blocked' });
    expect(calls).toBe(0);

    const baseline = readyBundle();
    const redPrefix = assessF4ReplacementPrefix({
      staged: baseline.staged,
      replacement: { ...baseline.replacement, calls: baseline.replacement.calls.slice(1) },
      reset: baseline.reset,
      codecWindow: {
        startedAt: baseline.codecWindow.startedAt,
        endedAt: baseline.codecWindow.prefixEndedAt,
      },
      expectation: baseline.expectation,
    });
    expect(redPrefix.ok).toBe(false);
    const deniedOutcome = beginF4GreenContinuation(
      redPrefix,
      () => { calls++; return 'outcome'; },
    );
    expect(deniedOutcome).toEqual({ kind: 'blocked' });
    expect(calls).toBe(0);

    const started = beginF4GreenContinuation(
      { ok: true, reasons: [] },
      () => { calls++; return 'continued'; },
    );
    expect(started).toEqual({ kind: 'started', value: 'continued' });
    expect(calls).toBe(1);
  });

  it('publishes only settled native trace and fail-stops setup, prefix, outcome, and controls', () => {
    const source = fs.readFileSync(new URL('../tools/slicesmoke.mjs', import.meta.url), 'utf8');
    const armStart = source.indexOf('const ARM_F4_REPLACEMENT_TRACE_EXPRESSION');
    const armEnd = source.indexOf('/* A smoke that reads a stale build', armStart);
    const arm = source.slice(armStart, armEnd);
    expect(armStart).toBeGreaterThan(-1);
    expect(arm.match(/localStorage\.setItem\(key/g)).toHaveLength(1);
    expect(arm.indexOf('finish=(candidate,status)=>')).toBeLessThan(arm.indexOf('localStorage.setItem(key'));
    expect(arm.indexOf('record=(store,method,args,request)=>')).toBeGreaterThan(arm.indexOf('localStorage.setItem(key'));
    expect(arm).toContain("Object.getOwnPropertyNames(proto).filter((name)=>!excludedMethods.has(name)");
    expect(arm).toContain("excludedMethods=new Set(['constructor','createIndex','deleteIndex'])");
    expect(arm).toContain('indexNames:store.indexNames?[...store.indexNames].map(String).sort():null');

    const setup = source.indexOf('const f4ReplacementSetupAssessment = assessF4ReplacementSetup({');
    const quiesce = source.lastIndexOf(
      'const f4ReplacementHeartbeatQuiescence = await evalIn(',
      setup,
    );
    const stage = source.lastIndexOf('const f4StageStarted = await evalIn(', setup);
    const importGuard = source.indexOf('const f4ImportContinuation = beginF4GreenContinuation(', setup);
    const importCall = source.indexOf('window.__CF_SLICE__.api.importBlob(', importGuard);
    const setupStop = source.indexOf("failSliceWithoutCascade('F4 REPLACEMENT/SETUP:", importGuard);
    const resetWait = source.indexOf("await waitForSlice(sess, 'F4 receipt-reset import replacement'", importGuard);
    const prefix = source.indexOf('const f4ReplacementPrefixAssessment = assessF4ReplacementPrefix(', resetWait);
    const outcomeGuard = source.indexOf('const f4OutcomeContinuation = beginF4GreenContinuation(', prefix);
    const outcomeCall = source.indexOf('window.__CF_SLICE__.api.__smokeCommitF4Outcome()', outcomeGuard);
    const prefixStop = source.indexOf("failSliceWithoutCascade('F4 REPLACEMENT/PREFIX:", outcomeGuard);
    expect([
      quiesce, stage, setup, importGuard, importCall, setupStop, resetWait,
      prefix, outcomeGuard, outcomeCall, prefixStop,
    ].every((index) => index >= 0)).toBe(true);
    expect(quiesce).toBeLessThan(stage);
    expect(stage).toBeLessThan(setup);
    expect(setup).toBeLessThan(importGuard);
    expect(importGuard).toBeLessThan(importCall);
    expect(setupStop).toBeLessThan(resetWait);
    expect(resetWait).toBeLessThan(prefix);
    expect(prefix).toBeLessThan(outcomeGuard);
    expect(outcomeGuard).toBeLessThan(outcomeCall);

    const finding = source.indexOf("fails.push('F4 REPLACEMENT/OUTCOME:");
    const stop = source.indexOf("failSliceWithoutCascade('F4 REPLACEMENT/OUTCOME:", finding);
    const controls = source.indexOf('const f4ReplacementControls = [', finding);
    const controlsFinding = source.indexOf("fails.push('F4 REPLACEMENT/OUTCOME CONTROL FAILED", controls);
    const controlsStop = source.indexOf("failSliceWithoutCascade('F4 REPLACEMENT/OUTCOME CONTROL FAILED:", controlsFinding);
    const mutableHide = source.indexOf('const f4HideArmed = await evalIn(', controlsStop);
    expect([finding, stop, controls, controlsFinding, controlsStop, mutableHide]
      .every((index) => index >= 0)).toBe(true);
    expect(finding).toBeLessThan(stop);
    expect(stop).toBeLessThan(controls);
    expect(controls).toBeLessThan(controlsFinding);
    expect(controlsFinding).toBeLessThan(controlsStop);
    expect(controlsStop).toBeLessThan(mutableHide);
  });

  it('executes the exact embedded tracer against native-shaped transaction lifecycle controls', () => {
    const source = fs.readFileSync(new URL('../tools/slicesmoke.mjs', import.meta.url), 'utf8');
    const match = source.match(/const ARM_F4_REPLACEMENT_TRACE_EXPRESSION = `([\s\S]*?)`;/u);
    expect(match).not.toBeNull();
    const expression = match![1]!.replace(
      '${JSON.stringify(F4_REPLACEMENT_EXPECTATION.fixtureSha256)}',
      JSON.stringify(FIXTURE_SHA),
    );
    class FakeRequest extends EventTarget {
      result: unknown;
      succeed(result?: unknown): void {
        this.result = result;
        this.dispatchEvent(new Event('success'));
      }
    }
    class FakeTransaction extends EventTarget {
      readonly mode = 'readwrite';
      constructor(readonly objectStoreNames = [
        'catalog', 'creatures', 'inventory', 'journal',
        'meta', 'player', 'receipts', 'settings',
      ]) { super(); }
    }
    const globals = globalThis as unknown as Record<string, unknown>;
    const runTrace = (
      extra?: (stores: Record<string, any>) => void,
      preCompletionAbortedCandidate = false,
      successfulSideStores?: string[],
      postCompletionSideStores?: string[],
    ): { trace: Record<string, any>; beforeSettlement: string | null } => {
      class FakeObjectStore {
        readonly keyPath = null;
        readonly autoIncrement = false;
        readonly indexNames: string[] = [];
        readonly requests: FakeRequest[] = [];
        constructor(readonly name: string, readonly transaction: FakeTransaction) {}
        get(_key: string): FakeRequest { return makeRequest(this); }
        clear(): FakeRequest { return makeRequest(this); }
        put(_value: string, _key: string): FakeRequest { return makeRequest(this); }
        delete(_key: string): FakeRequest { return makeRequest(this); }
        add(_value: string, _key?: string): FakeRequest { return makeRequest(this); }
        count(_query?: unknown): FakeRequest { return makeRequest(this); }
        getAll(_query?: unknown, _count?: number): FakeRequest { return makeRequest(this); }
        getAllKeys(_query?: unknown, _count?: number): FakeRequest { return makeRequest(this); }
        getKey(_query: unknown): FakeRequest { return makeRequest(this); }
        openCursor(_query?: unknown, _direction?: string): FakeRequest { return makeRequest(this); }
        openKeyCursor(_query?: unknown, _direction?: string): FakeRequest { return makeRequest(this); }
        index(_name: string): object { throw new Error('fake index is absent'); }
      }
      const makeRequest = (store: FakeObjectStore): FakeRequest => {
        const request = new FakeRequest();
        store.requests.push(request);
        return request;
      };
      const values = new Map<string, string>();
      const localStorage = {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => { values.set(key, value); },
        removeItem: (key: string) => { values.delete(key); },
      };
      const priorStore = globals.IDBObjectStore;
      const priorRequest = globals.IDBRequest;
      const priorWindow = globals.window;
      const priorLocalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
      globals.IDBObjectStore = FakeObjectStore;
      globals.IDBRequest = FakeRequest;
      globals.window = {};
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true, writable: true, value: localStorage,
      });
      try {
        expect(Function(`return (${expression})`)()).toBe(true);
        const tx = new FakeTransaction();
        const stores = Object.fromEntries(tx.objectStoreNames.map((name) => [
          name, new FakeObjectStore(name, tx),
        ])) as Record<string, FakeObjectStore>;
        const predecessor = stores.meta!.get('f3:revision');
        const lease = stores.meta!.get('f3:lease:active-play');
        predecessor.succeed('8');
        lease.succeed(JSON.stringify({
          schema: 1, held: true, ownerId: 'slice-smoke-owner', token: 'slice-smoke-token', heartbeat: 7,
        }));
        stores.receipts!.clear();
        for (const operation of replacementPreparation.operations) {
          const store = stores[operation.store]!;
          if (operation.value === undefined) store.delete(operation.key);
          else store.put(operation.value, operation.key);
        }
        stores.meta!.put('9', 'f3:revision');
        extra?.(stores);
        for (const store of Object.values(stores)) {
          for (const request of store.requests) {
            if (request !== predecessor && request !== lease) request.succeed();
          }
        }
        if (successfulSideStores) {
          const side = new FakeTransaction(successfulSideStores);
          const sideStore = new FakeObjectStore(successfulSideStores[0]!, side);
          const sideWrite = sideStore.put('hidden-side-value', 'hidden-side-row');
          sideWrite.succeed();
          side.dispatchEvent(new Event('complete'));
        }
        if (preCompletionAbortedCandidate) {
          const aborted = new FakeTransaction(['meta']);
          const abortedMeta = new FakeObjectStore('meta', aborted);
          abortedMeta.get('f3:revision').succeed('9');
          aborted.dispatchEvent(new Event('abort'));
        }
        const beforeSettlement = localStorage.getItem('cf_slice_f4_replacement_trace');
        tx.dispatchEvent(new Event('complete'));
        if (postCompletionSideStores) {
          const release = new FakeTransaction(postCompletionSideStores);
          const releaseStore = new FakeObjectStore(postCompletionSideStores[0]!, release);
          const releaseWrite = releaseStore.put('released', 'f3:lease:active-play');
          releaseWrite.succeed();
          release.dispatchEvent(new Event('complete'));
        }
        return {
          beforeSettlement,
          trace: JSON.parse(localStorage.getItem('cf_slice_f4_replacement_trace')!),
        };
      } finally {
        globals.IDBObjectStore = priorStore;
        globals.IDBRequest = priorRequest;
        globals.window = priorWindow;
        if (priorLocalStorage) Object.defineProperty(globalThis, 'localStorage', priorLocalStorage);
        else delete globals.localStorage;
      }
    };

    const baseline = runTrace();
    expect(baseline.beforeSettlement).toBeNull();
    expect(assessF4NativeReplacementTrace({
      staged: readyBundle().staged,
      replacement: baseline.trace,
      expectation: readyExpectation,
    })).toEqual({ ok: true, reasons: [] });

    const postReplacementRelease = runTrace(undefined, false, undefined, ['meta']).trace;
    expect(postReplacementRelease.candidateCount).toBe(1);
    expect(assessF4NativeReplacementTrace({
      staged: readyBundle().staged,
      replacement: postReplacementRelease,
      expectation: readyExpectation,
    })).toEqual({ ok: true, reasons: [] });

    const hiddenCalls: Array<[string, (stores: Record<string, any>) => void]> = [
      ['add', (stores) => { stores.inventory.add('hidden', 'hidden-row'); }],
      ['count', (stores) => { stores.receipts.count(); }],
      ['getAll', (stores) => { stores.catalog.getAll(); }],
      ['getAllKeys', (stores) => { stores.creatures.getAllKeys(); }],
      ['getKey', (stores) => { stores.settings.getKey('hidden'); }],
      ['openCursor', (stores) => { stores.catalog.openCursor(); }],
      ['openKeyCursor', (stores) => { stores.inventory.openKeyCursor(); }],
      ['index', (stores) => { try { stores.player.index('hidden'); } catch { /* attempted access is evidence */ } }],
    ];
    for (const [method, extra] of hiddenCalls) {
      const { trace } = runTrace(extra);
      expect(trace.calls.some((call: any) => call.method === method), method).toBe(true);
      expect(assessF4NativeReplacementTrace({
        staged: readyBundle().staged,
        replacement: trace,
        expectation: readyExpectation,
      }).reasons, method).toContain('native request ledger');
    }

    const expectedStores = [
      'catalog', 'creatures', 'inventory', 'journal',
      'meta', 'player', 'receipts', 'settings',
    ];
    const sideTransactions: Array<[string, string[]]> = [
      ['subset', ['meta']],
      ['superset', [...expectedStores, 'shadow']],
    ];
    for (const [label, stores] of sideTransactions) {
      const { trace } = runTrace(undefined, false, stores);
      expect(trace.candidateCount, label).toBe(2);
      expect(assessF4NativeReplacementTrace({
        staged: readyBundle().staged,
        replacement: trace,
        expectation: readyExpectation,
      }).reasons, label).toContain('transaction lifecycle');
    }

    const invalid = runTrace(undefined, true).trace;
    expect(invalid.status).toBe('complete');
    expect(invalid.candidateCount).toBe(2);
    expect(assessF4NativeReplacementTrace({
      staged: readyBundle().staged,
      replacement: invalid,
      expectation: readyExpectation,
    }).ok).toBe(false);
  });

  it('accepts an independently selected already-current replacement with Smoke at ordinal zero', () => {
    const currentResetRaw = fixedPointRaw(
      applyExpectedRouteRepair(replacementPreparation.state),
      PROJECTION_NOW,
    );
    const currentAfterImported = importSaveV2(currentResetRaw, registry, OUTCOME_NOW);
    if (!currentAfterImported.ok) throw new Error(currentAfterImported.reason);
    const currentAfterRaw = fixedPointRaw(currentAfterImported.state, OUTCOME_NOW);
    const baseline = readyBundle();
    const smokeReceipt = {
      ordinal: 0, kind: 'slice-smoke-f4-outcome', witness: 'slice-smoke-f4:0:0.25',
    };
    const expectation = {
      ...readyExpectation,
      sourceLegacySha256: createHash('sha256').update(envelope.legacyV4).digest('hex'),
      successorProductProjectionSha256: legacyPostBootProductDigest(currentResetRaw),
      preparation: 'current', addedAchievementIds: [], successorUnlockedIds: SOURCE_UNLOCKED,
      progressionWitness: null, receiptFreeBootCommits: 1,
    };
    const current = {
      ...baseline,
      expectation,
      reset: {
        state: {
          save: { unlocked: [...SOURCE_UNLOCKED], stats: { bestRank: 3 } },
          persistence: {
            lastOutcome: 'replacement-committed:10',
            runtime: { revision: 10, sessionSeed: 123, sessionOrdinal: 0, sessionDraws: {}, commits: 1 },
          },
        },
        raw: {
          revision: 10, seed: 123, ordinal: 0, draws: {},
          legacyRaw: currentResetRaw, receiptKeys: [], receiptRows: [],
        },
        ceremony: { toastOn: false, toastSerial: 0, queuedFx: 0 },
      },
      outcome: {
        ...baseline.outcome,
        beforeRevision: 10, afterRevision: 11, revision: 11,
        beforeOrdinal: 0, afterOrdinal: 1,
        plan: { value: 0.25, receiptOrdinal: 0 }, receipt: smokeReceipt,
      },
      after: {
        state: {
          save: { unlocked: [...SOURCE_UNLOCKED], stats: { bestRank: 3 } },
          persistence: {
            lastOutcome: 'outcome-committed:11',
            runtime: {
              revision: 11, sessionSeed: 123, sessionOrdinal: 1,
              sessionDraws: { 'diagnostics.slice-smoke.f4': 1 }, commits: 2,
            },
          },
        },
        raw: {
          revision: 11, seed: 123, ordinal: 1,
          legacyRaw: currentAfterRaw,
          draws: { 'diagnostics.slice-smoke.f4': 1 },
          receiptKeys: ['receipt:0'], receiptRows: [smokeReceipt],
        },
      },
    };
    expect(assessF4ReplacementOutcome(current)).toEqual({ ok: true, reasons: [] });
  });
});
