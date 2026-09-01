import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse } from 'acorn';
import { describe, expect, it } from 'vitest';
import { projectExplorerRank } from '@cf/domain-progression';
import {
  arc9ShareSendSettlementExpectation,
  assessArc9ShareSendSettlement,
  assessF4ActionCommitSequence,
  advanceF4ActionSequenceStability,
} from '../tools/slicesmoke-contract.mjs';

const sliceSmokeSource = readFileSync(
  fileURLToPath(new URL('../tools/slicesmoke.mjs', import.meta.url)),
  'utf8',
);

const TOKEN = 'a0f5049a-5941-4c78-92fc-560e0e6bec37';
const SEED = 3_857_878_622;
const C0F_PRIOR_UNLOCKED: readonly string[] = [
  'first', 'field10', 'fake', 'hybrid', 'rare', 'crafter', 'geared',
  'rimbreaker', 'lastvein', 'cosmicfind', 'skimmer', 'event1', 'event5',
  'guard1', 'essence500', 'bred1', 'bredfail', 'feed5', 'feedfail',
  'duel1', 'duelw1', 'jumps5', 'namer', 'wayfarer', 'dwarfg', 'share',
];

const catalogAuthority = (legacy: {
  codex: unknown[];
  surveyed: unknown[];
  gals: unknown[];
}) => ({
  catalogSchema: 5,
  catalogSegment: 'catalog',
  catalogData: {
    codex: structuredClone(legacy.codex),
    surveyed: structuredClone(legacy.surveyed),
    gals: structuredClone(legacy.gals),
  },
});

function predecessorAuthority({
  shares, unlocked, bestRank = 0, best = 0, hybrids = 0,
  codex = 0, surveyed = 0, galaxies = 0,
}: {
  shares: number;
  unlocked: string[];
  bestRank?: number;
  best?: number;
  hybrids?: number;
  codex?: number;
  surveyed?: number;
  galaxies?: number;
}) {
  const legacy = {
    v: 4, shares, br: bestRank,
    ever: { v: 1, best, hybrids, maxGen: 0, scanhits: 0 },
    ach: [...unlocked],
    codex: Array.from({ length: codex }, (_, index) => ({ id: `codex-${index}` })),
    surveyed: Array.from({ length: surveyed }, (_, index) => `surveyed-${index}`),
    gals: Array.from({ length: galaxies }, (_, index) => index + 1),
  };
  return {
    token: TOKEN,
    raw: { legacyRaw: JSON.stringify(legacy), ...catalogAuthority(legacy) },
    state: {
      codexCount: codex,
      save: {
        stats: { shares, bestRank, best, hybrids, surveys: surveyed },
        unlocked: [...unlocked],
      },
    },
  };
}

const idleActionCoordinator = () => ({
  inFlight: false,
  owner: {
    schema: 'cf-v2-product-action-coordinator-diagnostics/v1',
    busy: false,
    operation: null,
  },
  hold: {
    schema: 'cf-v2-product-action-hold-diagnostics/v1',
    phase: 'idle',
    operation: null,
    sequence: 0,
  },
  faultArmed: {
    storageFailure: false,
    staleAuthority: false,
    publicationFailure: false,
  },
  lastFault: null,
});

function c0fShareFiveFixture() {
  const beforeRows = [
    { ordinal: 0, kind: 'arc9-progression-refresh-v1', witness: 'boot-progression' },
    { ordinal: 1, kind: 'arc0-world-name', witness: 'alpha-name' },
    { ordinal: 2, kind: 'arc9-share-follow-v1', witness: 'alpha-follow' },
    { ordinal: 3, kind: 'arc9-share-send-v1', witness: 'alpha-share' },
    { ordinal: 4, kind: 'arc0-atlas', witness: 'alpha-atlas' },
    { ordinal: 5, kind: 'arc0-land', witness: 'alpha-land' },
    { ordinal: 6, kind: 'arc0-world-name', witness: 'beta-name' },
    { ordinal: 7, kind: 'arc9-share-follow-v1', witness: 'beta-follow' },
  ];
  const beforeRuntime = {
    schema: 'cf-v2-f4-runtime/v1',
    revision: 13,
    commits: 10,
    sessionSeed: SEED,
    sessionOrdinal: 8,
    sessionDraws: {},
  };
  const priorUnlocked = [...C0F_PRIOR_UNLOCKED];
  const beforeLegacy = {
    v: 4, shares: 4, br: 3,
    ever: { v: 1, best: 4, hybrids: 1, maxGen: 3, scanhits: 0 },
    ach: [...priorUnlocked],
    codex: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
    surveyed: ['a', 'b'],
    gals: [999, 350410949],
  };
  const beforeState = {
    persistence: {
      lastOutcome: 'arc9-share-follow-committed:13',
      runtime: beforeRuntime,
    },
    landing: {
      schema: 'cf-v2-arc0-landing-app-state/v1',
      actionCoordinator: idleActionCoordinator(),
    },
    codexCount: beforeLegacy.codex.length,
    save: {
      stats: { shares: 4, bestRank: 3, best: 4, hybrids: 1,
        surveys: beforeLegacy.surveyed.length },
      unlocked: [...priorUnlocked],
    },
  };
  const beforeAuthority = {
    token: TOKEN,
    raw: {
      revision: 13,
      revisionRaw: '13',
      seed: SEED,
      ordinal: 8,
      draws: {},
      legacyRaw: JSON.stringify(beforeLegacy),
      ...catalogAuthority(beforeLegacy),
      receiptKeys: beforeRows.map(({ ordinal }) => `receipt:${ordinal}`),
      receiptRows: beforeRows,
    },
    state: beforeState,
  };
  const afterRows = [
    ...structuredClone(beforeRows),
    { ordinal: 8, kind: 'arc9-share-send-v1', witness: 'beta-share' },
    { ordinal: 9, kind: 'arc9-progression-refresh-v1', witness: 'share5-progression' },
  ];
  const afterLegacy = {
    ...structuredClone(beforeLegacy),
    shares: 5,
    ach: [...priorUnlocked, 'share5'],
  };
  const afterState = {
    persistence: {
      lastOutcome: 'arc9-progression-committed:15',
      runtime: {
        ...beforeRuntime,
        revision: 15,
        commits: 12,
        sessionOrdinal: 10,
      },
    },
    landing: {
      schema: 'cf-v2-arc0-landing-app-state/v1',
      actionCoordinator: idleActionCoordinator(),
    },
    codexCount: beforeState.codexCount,
    save: {
      stats: { shares: 5, bestRank: 3, best: 4, hybrids: 1,
        surveys: beforeLegacy.surveyed.length },
      unlocked: [...beforeState.save.unlocked, 'share5'],
    },
  };
  const afterAuthority = {
    token: TOKEN,
    raw: {
      revision: 15,
      revisionRaw: '15',
      seed: SEED,
      ordinal: 10,
      draws: {},
      legacyRaw: JSON.stringify(afterLegacy),
      ...catalogAuthority(afterLegacy),
      receiptKeys: afterRows.map(({ ordinal }) => `receipt:${ordinal}`),
      receiptRows: afterRows,
    },
    state: afterState,
  };
  return { beforeAuthority, afterAuthority, state: afterState };
}

type C0fFixture = ReturnType<typeof c0fShareFiveFixture>;

function assessExpected(value: C0fFixture) {
  return assessArc9ShareSendSettlement({
    beforeAuthority: value.beforeAuthority,
    afterAuthority: value.afterAuthority,
    state: value.state,
  });
}

function section(source: string, start: string, end: string): string {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  expect(startIndex, `missing source section start ${JSON.stringify(start)}`).toBeGreaterThanOrEqual(0);
  expect(endIndex, `missing source section end ${JSON.stringify(end)}`).toBeGreaterThan(startIndex);
  return source.slice(startIndex, endIndex);
}

type AstNode = Readonly<{
  type: string;
  start?: number;
  end?: number;
  [key: string]: unknown;
}>;

const isAstNode = (value: unknown): value is AstNode => value !== null
  && typeof value === 'object'
  && typeof (value as { type?: unknown }).type === 'string';

function shareWaiterLexicalAudit(source: string) {
  const root = parse(source, {
    ecmaVersion: 'latest',
    sourceType: 'module',
  }) as unknown as AstNode;
  const declarations: Array<Readonly<{ node: AstNode; ancestors: readonly AstNode[] }>> = [];
  const calls: Array<Readonly<{ node: AstNode; ancestors: readonly AstNode[] }>> = [];
  const visit = (node: AstNode, ancestors: readonly AstNode[]) => {
    if (node.type === 'VariableDeclarator'
      && isAstNode(node.id)
      && node.id.type === 'Identifier'
      && node.id.name === 'waitForF4ActionSequenceFixedPoint') {
      declarations.push({ node, ancestors });
    }
    if (node.type === 'CallExpression'
      && isAstNode(node.callee)
      && node.callee.type === 'Identifier'
      && node.callee.name === 'waitForF4ActionSequenceFixedPoint') {
      calls.push({ node, ancestors });
    }
    for (const [key, value] of Object.entries(node)) {
      if (key === 'type' || key === 'start' || key === 'end') continue;
      if (isAstNode(value)) visit(value, [...ancestors, node]);
      else if (Array.isArray(value)) {
        for (const entry of value) {
          if (isAstNode(entry)) visit(entry, [...ancestors, node]);
        }
      }
    }
  };
  visit(root, []);
  const declaration = declarations.length === 1 ? declarations[0] : null;
  const declarationScope = declaration
    ? [...declaration.ancestors].reverse()
      .find((node) => node.type === 'BlockStatement' || node.type === 'Program') ?? null
    : null;
  const inaccessibleCalls = calls.filter((call) => !declaration
    || !declarationScope
    || !call.ancestors.includes(declarationScope)
    || (call.node.start ?? -1) <= (declaration.node.start ?? Number.MAX_SAFE_INTEGER));
  return Object.freeze({
    declarationCount: declarations.length,
    callCount: calls.length,
    inaccessibleCallCount: inaccessibleCalls.length,
  });
}

describe('Slice Share settlement fixed point', () => {
  it('derives the bounded Share receipt topology from its exact predecessor', () => {
    expect(arc9ShareSendSettlementExpectation(predecessorAuthority({
      shares: 3, unlocked: ['first'],
    }))).toEqual({
      counterBefore: 3,
      counterAfter: 4,
      priorUnlockedIds: ['first'],
      nextUnlockedIds: ['first', 'share'],
      priorBestRankIndex: 0,
      nextBestRankIndex: 0,
      shareAchievementAdded: true,
      share5AchievementAdded: false,
      progressionTailRequired: false,
      expectedKinds: ['arc9-share-send-v1'],
      persistencePrefix: 'arc9-share-send-committed:',
    });
    expect(arc9ShareSendSettlementExpectation(predecessorAuthority({
      shares: 4, unlocked: ['first', 'share'],
    }))).toEqual({
      counterBefore: 4,
      counterAfter: 5,
      priorUnlockedIds: ['first', 'share'],
      nextUnlockedIds: ['first', 'share', 'share5'],
      priorBestRankIndex: 0,
      nextBestRankIndex: 0,
      shareAchievementAdded: false,
      share5AchievementAdded: true,
      progressionTailRequired: true,
      expectedKinds: ['arc9-share-send-v1', 'arc9-progression-refresh-v1'],
      persistencePrefix: 'arc9-progression-committed:',
    });
    expect(arc9ShareSendSettlementExpectation(predecessorAuthority({
      shares: 5, unlocked: ['first', 'share', 'share5'],
    }))).toEqual({
      counterBefore: 5,
      counterAfter: 6,
      priorUnlockedIds: ['first', 'share', 'share5'],
      nextUnlockedIds: ['first', 'share', 'share5'],
      priorBestRankIndex: 0,
      nextBestRankIndex: 0,
      shareAchievementAdded: false,
      share5AchievementAdded: false,
      progressionTailRequired: false,
      expectedKinds: ['arc9-share-send-v1'],
      persistencePrefix: 'arc9-share-send-committed:',
    });
  });

  it('derives a rank-only progression tail when the first Share crosses Scout', () => {
    const expectation = arc9ShareSendSettlementExpectation(predecessorAuthority({
      shares: 0, unlocked: ['compat-a', 'compat-b', 'compat-c', 'compat-d'],
    }));
    expect(expectation).toMatchObject({
      counterBefore: 0,
      counterAfter: 1,
      nextUnlockedIds: ['compat-a', 'compat-b', 'compat-c', 'compat-d', 'share'],
      priorBestRankIndex: 0,
      nextBestRankIndex: 1,
      shareAchievementAdded: true,
      share5AchievementAdded: false,
      progressionTailRequired: true,
      expectedKinds: ['arc9-share-send-v1', 'arc9-progression-refresh-v1'],
      persistencePrefix: 'arc9-progression-committed:',
    });
    expect(expectation.nextBestRankIndex).toBe(projectExplorerRank({
      surveyedLivingWorldCount: 0,
      cataloguedSpeciesCount: 0,
      bestRawRarityTier: 0,
      unlockedAchievementCount: 5,
      hybridCount: 0,
      galaxyCount: 0,
    }).index);
  });

  it('preserves permanent best rank when the current score is lower', () => {
    const expectation = arc9ShareSendSettlementExpectation(predecessorAuthority({
      shares: 1, unlocked: ['share'], bestRank: 3,
    }));
    expect(projectExplorerRank({
      surveyedLivingWorldCount: 0,
      cataloguedSpeciesCount: 0,
      bestRawRarityTier: 0,
      unlockedAchievementCount: 1,
      hybridCount: 0,
      galaxyCount: 0,
    }).index).toBe(0);
    expect(expectation).toMatchObject({
      priorBestRankIndex: 3,
      nextBestRankIndex: 3,
      progressionTailRequired: false,
      expectedKinds: ['arc9-share-send-v1'],
      persistencePrefix: 'arc9-share-send-committed:',
    });
  });

  it('matches every product Explorer-rank threshold and Share score factor', () => {
    const rankFloors = [30, 90, 220, 460, 900, 1_700, 3_000, 5_200, 8_200];
    const thresholdCases = [
      { score: 6, expectedIndex: 0, label: 'base rank' },
      ...rankFloors.flatMap((floor, index) => [
        { score: floor - 1, expectedIndex: index, label: `below ${floor}` },
        { score: floor, expectedIndex: index + 1, label: `at ${floor}` },
      ]),
    ];
    for (const value of thresholdCases) {
      const hybrids = value.score - 6;
      const expectation = arc9ShareSendSettlementExpectation(predecessorAuthority({
        shares: 1, unlocked: ['share'], hybrids,
      }));
      const product = projectExplorerRank({
        surveyedLivingWorldCount: 0,
        cataloguedSpeciesCount: 0,
        bestRawRarityTier: 0,
        unlockedAchievementCount: 1,
        hybridCount: hybrids,
        galaxyCount: 0,
      });
      expect(product.index, value.label).toBe(value.expectedIndex);
      expect(expectation.nextBestRankIndex, value.label).toBe(product.index);
    }

    const factorCases = [
      { label: 'surveyed living worlds', surveyed: 1, boundaryHybrids: 20 },
      { label: 'catalogued species', codex: 1, boundaryHybrids: 22 },
      { label: 'best raw rarity', best: 1, boundaryHybrids: 12 },
      { label: 'unlocked achievements', unlocked: ['share', 'extra'], boundaryHybrids: 18 },
      { label: 'hybrids', boundaryHybrids: 24 },
      { label: 'galaxies', galaxies: 1, boundaryHybrids: 21 },
    ];
    for (const value of factorCases) {
      const unlocked = value.unlocked ?? ['share'];
      for (const [delta, expectedIndex] of [[-1, 0], [0, 1]] as const) {
        const hybrids = value.boundaryHybrids + delta;
        const label = `${value.label} ${delta === 0 ? 'at' : 'below'} Scout`;
        const expectation = arc9ShareSendSettlementExpectation(predecessorAuthority({
          shares: 1,
          unlocked,
          codex: value.codex ?? 0,
          surveyed: value.surveyed ?? 0,
          galaxies: value.galaxies ?? 0,
          best: value.best ?? 0,
          hybrids,
        }));
        const product = projectExplorerRank({
          surveyedLivingWorldCount: value.surveyed ?? 0,
          cataloguedSpeciesCount: value.codex ?? 0,
          bestRawRarityTier: value.best ?? 0,
          unlockedAchievementCount: unlocked.length,
          hybridCount: hybrids,
          galaxyCount: value.galaxies ?? 0,
        });
        expect(product.index, label).toBe(expectedIndex);
        expect(expectation.nextBestRankIndex, label).toBe(product.index);
      }
    }
  });

  it('rejects malformed or raw/live-divergent predecessors before deriving an oracle', () => {
    const valid = predecessorAuthority({
      shares: 4, unlocked: ['share'], codex: 1, surveyed: 1, galaxies: 1,
    });
    const malformed = [
      null,
      {},
      { ...structuredClone(valid), raw: {} },
      { ...structuredClone(valid), state: {} },
      (() => { const value = structuredClone(valid); value.state.save.stats.shares = 3; return value; })(),
      (() => { const value = structuredClone(valid); value.state.save.unlocked = []; return value; })(),
      (() => { const value = structuredClone(valid); value.state.codexCount = 0; return value; })(),
      (() => { const value = structuredClone(valid);
        value.state.save.stats.surveys = 0; return value; })(),
      (() => { const value = structuredClone(valid); value.raw.catalogSchema = 4; return value; })(),
      (() => { const value = structuredClone(valid); value.raw.catalogSegment = 'player'; return value; })(),
      (() => { const value = structuredClone(valid); value.raw.catalogData.codex = []; return value; })(),
      (() => { const value = structuredClone(valid); value.raw.catalogData.surveyed = []; return value; })(),
      (() => { const value = structuredClone(valid); value.raw.catalogData.gals = []; return value; })(),
      (() => { const value = structuredClone(valid); const raw = JSON.parse(value.raw.legacyRaw);
        raw.shares = 4.5; value.raw.legacyRaw = JSON.stringify(raw); return value; })(),
      (() => { const value = structuredClone(valid); const raw = JSON.parse(value.raw.legacyRaw);
        raw.ach = ['share', 'share']; value.raw.legacyRaw = JSON.stringify(raw); return value; })(),
      (() => { const value = structuredClone(valid); const raw = JSON.parse(value.raw.legacyRaw);
        raw.codex.push(structuredClone(raw.codex[0]));
        value.raw.legacyRaw = JSON.stringify(raw); return value; })(),
      (() => { const value = structuredClone(valid); const raw = JSON.parse(value.raw.legacyRaw);
        raw.surveyed.push(raw.surveyed[0]);
        value.raw.legacyRaw = JSON.stringify(raw); return value; })(),
      (() => { const value = structuredClone(valid); const raw = JSON.parse(value.raw.legacyRaw);
        raw.gals.push(raw.gals[0]);
        value.raw.legacyRaw = JSON.stringify(raw); return value; })(),
    ];
    for (const value of malformed) {
      expect(() => arc9ShareSendSettlementExpectation(value)).toThrow(TypeError);
    }
  });

  it('accepts the exact c0f Share-five two-commit successor', () => {
    const value = c0fShareFiveFixture();
    expect(arc9ShareSendSettlementExpectation(value.beforeAuthority)).toEqual({
      counterBefore: 4,
      counterAfter: 5,
      priorUnlockedIds: C0F_PRIOR_UNLOCKED,
      nextUnlockedIds: [...C0F_PRIOR_UNLOCKED, 'share5'],
      priorBestRankIndex: 3,
      nextBestRankIndex: 3,
      shareAchievementAdded: false,
      share5AchievementAdded: true,
      progressionTailRequired: true,
      expectedKinds: ['arc9-share-send-v1', 'arc9-progression-refresh-v1'],
      persistencePrefix: 'arc9-progression-committed:',
    });
    expect(assessExpected(value)).toEqual({ ok: true, reasons: [] });
  });

  it('replays the obsolete one-commit oracle as the exact c0f red', () => {
    const value = c0fShareFiveFixture();
    expect(assessF4ActionCommitSequence({
      beforeAuthority: value.beforeAuthority,
      afterAuthority: value.afterAuthority,
      state: value.state,
      expectedKinds: ['arc9-share-send-v1'],
      expectedPersistenceLastOutcome:
        `arc9-share-send-committed:${value.afterAuthority.raw.revision}`,
    })).toEqual({
      ok: false,
      reasons: [
        'exact raw revision span',
        'exact live runtime span',
        'exact SessionRNG span',
        'exact action receipt sequence',
        'exact persistence outcome',
      ],
    });
  });

  it('accepts an exact first-Share rank-only progression successor', () => {
    const value = c0fShareFiveFixture();
    const priorUnlocked = ['compat-a', 'compat-b', 'compat-c', 'compat-d'];
    value.beforeAuthority.state.save.stats = {
      shares: 0, bestRank: 0, best: 0, hybrids: 0, surveys: 0,
    };
    value.beforeAuthority.state.save.unlocked = [...priorUnlocked];
    value.beforeAuthority.state.codexCount = 0;
    value.beforeAuthority.raw.legacyRaw = JSON.stringify({
      v: 4, shares: 0, br: 0,
      ever: { v: 1, best: 0, hybrids: 0, maxGen: 0, scanhits: 0 },
      ach: priorUnlocked, codex: [], surveyed: [], gals: [],
    });
    Object.assign(value.beforeAuthority.raw, catalogAuthority({
      codex: [], surveyed: [], gals: [],
    }));
    value.state.save.stats = {
      shares: 1, bestRank: 1, best: 0, hybrids: 0, surveys: 0,
    };
    value.state.save.unlocked = [...priorUnlocked, 'share'];
    value.state.codexCount = 0;
    value.afterAuthority.raw.legacyRaw = JSON.stringify({
      v: 4, shares: 1, br: 1,
      ever: { v: 1, best: 0, hybrids: 0, maxGen: 0, scanhits: 0 },
      ach: [...priorUnlocked, 'share'], codex: [], surveyed: [], gals: [],
    });
    Object.assign(value.afterAuthority.raw, catalogAuthority({
      codex: [], surveyed: [], gals: [],
    }));
    expect(assessExpected(value)).toEqual({ ok: true, reasons: [] });
  });

  it.each([
    ['missing progression receipt', (value: C0fFixture) => {
      value.afterAuthority.raw.receiptKeys.pop();
      value.afterAuthority.raw.receiptRows.pop();
    }, 'exact Share sequence: exact action receipt sequence'],
    ['swapped receipt kinds', (value: C0fFixture) => {
      value.afterAuthority.raw.receiptRows[8]!.kind = 'arc9-progression-refresh-v1';
      value.afterAuthority.raw.receiptRows[9]!.kind = 'arc9-share-send-v1';
    }, 'exact Share sequence: exact action receipt sequence'],
    ['extra receipt', (value: C0fFixture) => {
      value.afterAuthority.raw.receiptKeys.push('receipt:10');
      value.afterAuthority.raw.receiptRows.push({
        ordinal: 10, kind: 'unexpected-tail', witness: 'unexpected-tail',
      });
    }, 'exact Share sequence: exact action receipt sequence'],
    ['one-commit revision/runtime/ordinal span', (value: C0fFixture) => {
      value.afterAuthority.raw.revision = 14;
      value.afterAuthority.raw.revisionRaw = '14';
      value.afterAuthority.raw.ordinal = 9;
      value.state.persistence.runtime.revision = 14;
      value.state.persistence.runtime.commits = 11;
      value.state.persistence.runtime.sessionOrdinal = 9;
      value.state.persistence.lastOutcome = 'arc9-progression-committed:14';
    }, 'exact Share sequence: exact raw revision span'],
    ['three-commit revision/runtime/ordinal span', (value: C0fFixture) => {
      value.afterAuthority.raw.revision = 16;
      value.afterAuthority.raw.revisionRaw = '16';
      value.afterAuthority.raw.ordinal = 11;
      value.state.persistence.runtime.revision = 16;
      value.state.persistence.runtime.commits = 13;
      value.state.persistence.runtime.sessionOrdinal = 11;
      value.state.persistence.lastOutcome = 'arc9-progression-committed:16';
    }, 'exact Share sequence: exact raw revision span'],
    ['predecessor receipt tail drift', (value: C0fFixture) => {
      value.afterAuthority.raw.receiptRows[7]!.witness = 'mutated-beta-follow';
    }, 'exact Share sequence: exact predecessor receipt rows'],
    ['document-token replacement', (value: C0fFixture) => {
      value.afterAuthority.token = 'replacement-document';
    }, 'exact Share sequence: same document identity'],
    ['wrong final persistence outcome', (value: C0fFixture) => {
      value.state.persistence.lastOutcome = 'arc9-share-send-committed:15';
    }, 'exact Share sequence: exact persistence outcome'],
    ['unchanged Share counter', (value: C0fFixture) => {
      value.state.save.stats.shares = 4;
      const raw = JSON.parse(value.afterAuthority.raw.legacyRaw);
      raw.shares = 4;
      value.afterAuthority.raw.legacyRaw = JSON.stringify(raw);
    }, 'exact Share counter successor'],
    ['missing share5 successor', (value: C0fFixture) => {
      value.state.save.unlocked.pop();
      const raw = JSON.parse(value.afterAuthority.raw.legacyRaw);
      raw.ach.pop();
      value.afterAuthority.raw.legacyRaw = JSON.stringify(raw);
    }, 'exact Share achievement successor'],
    ['reordered Share achievements', (value: C0fFixture) => {
      value.state.save.unlocked.reverse();
      const raw = JSON.parse(value.afterAuthority.raw.legacyRaw);
      raw.ach.reverse();
      value.afterAuthority.raw.legacyRaw = JSON.stringify(raw);
    }, 'exact Share achievement successor'],
    ['wrong best-rank successor', (value: C0fFixture) => {
      value.state.save.stats.bestRank = 2;
      const raw = JSON.parse(value.afterAuthority.raw.legacyRaw);
      raw.br = 2;
      value.afterAuthority.raw.legacyRaw = JSON.stringify(raw);
    }, 'exact Share rank successor'],
    ['unrelated raw rank input drift', (value: C0fFixture) => {
      const raw = JSON.parse(value.afterAuthority.raw.legacyRaw);
      raw.gals.push(12345);
      value.afterAuthority.raw.legacyRaw = JSON.stringify(raw);
    }, 'Share-unrelated durable rank inputs unchanged'],
    ['after-only catalog rank input drift', (value: C0fFixture) => {
      value.afterAuthority.raw.catalogData.gals.push(12345);
    }, 'Share-unrelated durable rank inputs unchanged'],
    ['live-only catalogued-species drift', (value: C0fFixture) => {
      value.state.codexCount += 1;
    }, 'Share-unrelated live rank inputs unchanged'],
    ['live-only surveyed-world drift', (value: C0fFixture) => {
      value.state.save.stats.surveys += 1;
    }, 'Share-unrelated live rank inputs unchanged'],
    ['live-only best-rarity drift', (value: C0fFixture) => {
      value.state.save.stats.best += 1;
    }, 'Share-unrelated live rank inputs unchanged'],
    ['live-only hybrid drift', (value: C0fFixture) => {
      value.state.save.stats.hybrids += 1;
    }, 'Share-unrelated live rank inputs unchanged'],
  ])('rejects %s', (_label, mutate, reason) => {
    const value = c0fShareFiveFixture();
    mutate(value);
    expect(assessExpected(value).reasons).toContain(reason);
  });

  it('executes intermediate to final to stable polling and rejects overshoot', () => {
    const final = c0fShareFiveFixture();
    const intermediate = structuredClone(final);
    intermediate.afterAuthority.raw.revision = 14;
    intermediate.afterAuthority.raw.revisionRaw = '14';
    intermediate.afterAuthority.raw.ordinal = 9;
    intermediate.afterAuthority.raw.receiptKeys.pop();
    intermediate.afterAuthority.raw.receiptRows.pop();
    intermediate.state.persistence.runtime.revision = 14;
    intermediate.state.persistence.runtime.commits = 11;
    intermediate.state.persistence.runtime.sessionOrdinal = 9;
    intermediate.state.persistence.lastOutcome = 'arc9-share-send-committed:14';
    intermediate.state.save.unlocked.pop();
    const intermediateLegacy = JSON.parse(intermediate.afterAuthority.raw.legacyRaw);
    intermediateLegacy.ach.pop();
    intermediate.afterAuthority.raw.legacyRaw = JSON.stringify(intermediateLegacy);
    const intermediateAssessment = assessExpected(intermediate);
    const finalAssessment = assessExpected(final);
    expect(intermediateAssessment.ok).toBe(false);
    expect(finalAssessment).toEqual({ ok: true, reasons: [] });
    expect(advanceF4ActionSequenceStability(0, intermediateAssessment)).toEqual({
      status: 'pending', consecutiveExactSamples: 0,
    });
    const firstFinal = advanceF4ActionSequenceStability(0, finalAssessment);
    expect(firstFinal).toEqual({ status: 'pending', consecutiveExactSamples: 1 });
    expect(advanceF4ActionSequenceStability(
      firstFinal.consecutiveExactSamples,
      finalAssessment,
    )).toEqual({ status: 'ready', consecutiveExactSamples: 2 });

    const overshoot = structuredClone(final);
    overshoot.afterAuthority.raw.revision = 16;
    overshoot.afterAuthority.raw.revisionRaw = '16';
    overshoot.afterAuthority.raw.ordinal = 11;
    overshoot.afterAuthority.raw.receiptKeys.push('receipt:10');
    overshoot.afterAuthority.raw.receiptRows.push({
      ordinal: 10, kind: 'unexpected-tail', witness: 'overshoot',
    });
    overshoot.state.persistence.runtime.revision = 16;
    overshoot.state.persistence.runtime.commits = 13;
    overshoot.state.persistence.runtime.sessionOrdinal = 11;
    overshoot.state.persistence.lastOutcome = 'unexpected-committed:16';
    const overshootAssessment = assessExpected(overshoot);
    expect(overshootAssessment.ok).toBe(false);
    expect(advanceF4ActionSequenceStability(1, overshootAssessment)).toEqual({
      status: 'pending', consecutiveExactSamples: 0,
    });
  });

  it('binds all six Share assertion sites to predecessor-derived expectations', () => {
    expect(sliceSmokeSource.match(/\barc9ShareSendSettlementExpectation\(/gu)).toHaveLength(6);
    expect(sliceSmokeSource).not.toMatch(/expectedKind:\s*'arc9-share-send-v1'/u);
    expect(sliceSmokeSource).not.toMatch(/expectedKinds:\s*\[\s*'arc9-share-send-v1'\s*\]/u);

    const denied = section(
      sliceSmokeSource,
      '  const deniedShareBeforeAuthority = await waitForF4Writable(',
      '  const deniedCopy = await waitDesktopValue(',
    );
    const accepted = section(
      sliceSmokeSource,
      '  const acceptedShareBeforeAuthority = await waitForF4Writable(',
      '  const acceptedCopy = await waitDesktopValue(',
    );
    const stage3 = section(
      sliceSmokeSource,
      '  const stage3ShareExpectation = arc9ShareSendSettlementExpectation(',
      '  const stage3ForcedShare = await evalNavPh(',
    );
    const charter = section(
      sliceSmokeSource,
      '    if (expectedChapter === 3) {',
      '      beforeLand = adjacentShare.state;',
    );
    const collision = section(
      sliceSmokeSource,
      '  const collisionActions = [];',
      '  const collisionBeforeReloadToken = await sliceToken(',
    );
    const collisionReload = section(
      sliceSmokeSource,
      '  const collisionReloadSearches = [];',
      "  await send('Target.closeTarget', { targetId: collisionTarget.targetId });",
    );

    expect(denied).toMatch(/arc9ShareSendSettlementExpectation\(\s*deniedShareBeforeAuthority\s*,?\s*\)/u);
    expect(accepted).toMatch(/arc9ShareSendSettlementExpectation\(\s*acceptedShareBeforeAuthority\s*,?\s*\)/u);
    expect(stage3).toMatch(/arc9ShareSendSettlementExpectation\(\s*stage3AddAuthority\s*,?\s*\)/u);
    expect(charter).toMatch(/arc9ShareSendSettlementExpectation\(\s*surveyAuthority\s*,?\s*\)/u);
    expect(collision).toMatch(/arc9ShareSendSettlementExpectation\(\s*shareBeforeAuthority\s*,?\s*\)/u);
    expect(collisionReload).toMatch(/arc9ShareSendSettlementExpectation\(\s*shareBeforeAuthority\s*,?\s*\)/u);

    expect(denied).toMatch(/expectation:\s*deniedShareExpectation/u);
    expect(accepted).toMatch(/expectation:\s*acceptedShareExpectation/u);
    expect(stage3).toMatch(/expectation:\s*stage3ShareExpectation/u);
    expect(charter).toMatch(/expectation:\s*shareExpectation/u);
    for (const owner of [collision, collisionReload]) {
      expect(owner).toMatch(/expectedKinds:\s*shareExpectation\.expectedKinds/u);
      expect(owner).toMatch(/persistencePrefix:\s*shareExpectation\.persistencePrefix/u);
    }

    for (const owner of [denied, accepted, stage3, charter, collision, collisionReload]) {
      expect(owner).toContain('assessSettlement: assessArc9ShareSendSettlement');
    }
    for (const owner of [denied, accepted, stage3, charter]) {
      expect(owner).toContain('waitForF4ActionSequenceFixedPoint({');
    }
    for (const owner of [collision, collisionReload]) {
      expect(owner).toContain('waitForControlCommitSequence({');
    }
  });

  it('reads v5 catalog authority in the same transaction as revision and receipts', () => {
    const reader = section(
      sliceSmokeSource,
      "const READ_F4_AUTHORITY_EXPRESSION = `",
      'const F4_READY_STATE_PROJECTION_EXPRESSION = `',
    );
    expect(reader).toContain("db.transaction(['meta','player','catalog','receipts'],'readonly')");
    expect(reader).toContain("get('catalog','v5:catalog')");
    expect(reader).toContain('catalogSchema:catalogRow?.schema??null');
    expect(reader).toContain('catalogSegment:catalogRow?.segment??null');
    expect(reader).toContain('catalogData:catalogRow?.data??null');
  });

  it('routes both collision loops through the strict two-sample sequence waiter', () => {
    const adapter = section(
      sliceSmokeSource,
      '  const waitForControlCommitSequence = async ({',
      '  const nativeControlClick = async (session, selector) => {',
    );
    expect(adapter).toContain('waitForF4ActionSequenceFixedPoint({');
    expect(adapter).toContain('assessSettlement,');
    expect(adapter).not.toContain('await waitControlF4Writable(session, `${label} settlement`');

    const strictWaiter = section(
      sliceSmokeSource,
      '  const waitForF4ActionSequenceFixedPoint = async ({',
      '  const travelCheck = `',
    );
    expect(strictWaiter).toContain('let consecutiveExactSamples = 0;');
    expect(strictWaiter).toContain('advanceF4ActionSequenceStability(');
    expect(strictWaiter).toContain("if (readiness.ok && stability.status === 'ready')");
    expect(strictWaiter).toContain('consecutiveExactSamples = 0;');
    expect(strictWaiter).toContain('assessF4ActionCommitSequence({');
    expect(strictWaiter).toContain('assessSettlement({');
    expect(strictWaiter).toContain('expectedKinds: expectation.expectedKinds');
    expect(strictWaiter).toContain('`${expectation.persistencePrefix}${snapshot.raw?.revision}`');
  });

  it('keeps the shared sequence waiter lexically visible to every direct caller', () => {
    expect(shareWaiterLexicalAudit(sliceSmokeSource)).toEqual({
      declarationCount: 1,
      callCount: 6,
      inaccessibleCallCount: 0,
    });
    const regatedMutant = `try {
      if (!OUTCOME_CONTROLS_ONLY) {
        const waitForF4ActionSequenceFixedPoint = async () => true;
        await waitForF4ActionSequenceFixedPoint();
      }
      await waitForF4ActionSequenceFixedPoint();
    } catch {}`;
    expect(shareWaiterLexicalAudit(regatedMutant)).toEqual({
      declarationCount: 1,
      callCount: 2,
      inaccessibleCallCount: 1,
    });
  });
});
