import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  exportSaveV2,
  prepareV5Replacement,
  type ContentRegistry,
} from '@cf/persistence';
import { commitArc9ProgressionRefreshV1 } from '../apps/game/src/arc9-progression-action.js';
import { prepareArc9ProgressionRefreshV1 } from '../apps/game/src/arc9-progression-projection.js';
// @ts-expect-error The executable browser evidence contract intentionally has no declaration shim.
import { assessF4ReplacementOutcome } from '../tools/slicesmoke-contract.mjs';

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
const SUCCESSOR_PRODUCT_SHA = 'c332919c0697072dbeed7965a487f08fdea58039c122d45024002ed174693339';
const PROGRESSION_WITNESS = 'arc9p1:a8f5961bf107300e280aa9cda8160e051e02ab691c80cda40eaf87642d4f62c9';

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const row = value as Record<string, unknown>;
    return `{${Object.keys(row).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(row[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function productDigest(raw: string): string {
  const state = JSON.parse(raw) as Record<string, unknown>;
  delete state.at;
  return createHash('sha256').update(canonicalJson(state)).digest('hex');
}

const readyExpectation = Object.freeze({
  schema: 'cf-v2-f4-replacement-expectation/v1',
  fixtureSha256: FIXTURE_SHA,
  sourceLegacySha256: SOURCE_SHA,
  successorLegacyProductSha256: SUCCESSOR_PRODUCT_SHA,
  preparation: 'ready',
  sourceUnlockedIds: SOURCE_UNLOCKED,
  addedAchievementIds: ADDED,
  successorUnlockedIds: SUCCESSOR_UNLOCKED,
  priorBestRankIndex: 3,
  nextBestRankIndex: 3,
  receiptFreeBootCommits: 1,
  progressionWitness: PROGRESSION_WITNESS,
});

function readyBundle() {
  const successorLegacy = structuredClone(sourceLegacy);
  successorLegacy.ach = [...SUCCESSOR_UNLOCKED];
  successorLegacy.br = 3;
  successorLegacy.at = Number(sourceLegacy.at) + 1_000;
  const resetLegacyRaw = JSON.stringify(successorLegacy);
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
      ordinal: 1,
      receiptKeys: ['receipt:0'],
      receiptRows: [{ ordinal: 0, kind: 'slice-smoke-old-expedition', witness: 'old-expedition:0' }],
    },
    replacement: {
      schema: 'cf-v2-f4-replacement-native/v2', fixtureSha256: FIXTURE_SHA,
      clearCalls: 1, store: 'receipts', mode: 'readwrite', nativeRequest: true,
      stores: ['catalog', 'creatures', 'inventory', 'journal', 'meta', 'player', 'receipts', 'settings'],
      putRequestsNative: true, replacementRevision: 9, playerSchema: 5, carrierVersion: 1,
      replacementSeed: 123, replacementOrdinal: 0, replacementDraws: {}, legacyRaw: envelope.legacyV4,
    },
    reset: {
      state: resetState,
      raw: {
        revision: 11, seed: 123, ordinal: 1, draws: {}, legacyRaw: resetLegacyRaw,
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
        legacyRaw: resetLegacyRaw,
        draws: { 'diagnostics.slice-smoke.f4': 1 },
        receiptKeys: ['receipt:0', 'receipt:1'],
        receiptRows: [progressionReceipt, smokeReceipt],
      },
    },
    productStable: true,
    expectation: readyExpectation,
  };
}

describe('Slice F4 replacement progression boundary', () => {
  it('seals the exact imported fixture, production projection and ordinal-zero witness', async () => {
    expect(createHash('sha256').update(fixtureRaw).digest('hex')).toBe(FIXTURE_SHA);
    expect(createHash('sha256').update(envelope.legacyV4).digest('hex')).toBe(SOURCE_SHA);
    const imported = prepareV5Replacement(fixtureRaw, registry, Number(sourceLegacy.at) + 1_000);
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
    expect(productDigest(exportSaveV2(plan.successorState, Number(sourceLegacy.at) + 1_000)))
      .toBe(SUCCESSOR_PRODUCT_SHA);

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
      codecNow: Number(sourceLegacy.at) + 1_000,
    });
    expect(committed.kind).toBe('committed');
    if (committed.kind === 'committed') expect(committed.witness).toBe(PROGRESSION_WITNESS);
  });

  it('accepts the independently selected ready branch and rejects isolated mutants', () => {
    const baseline = readyBundle();
    expect(assessF4ReplacementOutcome(baseline)).toEqual({ ok: true, reasons: [] });
    const mutations: [string, ReturnType<typeof readyBundle>][] = [
      ['old receipt fixture', { ...baseline, staged: { ...baseline.staged,
        receiptRows: [{ ...baseline.staged.receiptRows[0]!, witness: 'old-expedition:wrong' }] } }],
      ['native atomic clear', { ...baseline, replacement: { ...baseline.replacement, clearCalls: 2 } }],
      ['replacement boundary', { ...baseline, replacement: { ...baseline.replacement, replacementOrdinal: 1 } }],
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

  it('accepts an independently selected already-current replacement with Smoke at ordinal zero', () => {
    const source = structuredClone(sourceLegacy);
    source.ach = [...SOURCE_UNLOCKED];
    source.br = 3;
    source.at = Number(source.at) + 1_000;
    const raw = JSON.stringify(source);
    const baseline = readyBundle();
    const smokeReceipt = {
      ordinal: 0, kind: 'slice-smoke-f4-outcome', witness: 'slice-smoke-f4:0:0.25',
    };
    const expectation = {
      ...readyExpectation,
      sourceLegacySha256: createHash('sha256').update(envelope.legacyV4).digest('hex'),
      successorLegacyProductSha256: productDigest(raw),
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
        raw: { revision: 10, seed: 123, ordinal: 0, draws: {}, legacyRaw: raw, receiptKeys: [], receiptRows: [] },
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
          legacyRaw: raw,
          draws: { 'diagnostics.slice-smoke.f4': 1 },
          receiptKeys: ['receipt:0'], receiptRows: [smokeReceipt],
        },
      },
    };
    expect(assessF4ReplacementOutcome(current)).toEqual({ ok: true, reasons: [] });
  });
});
