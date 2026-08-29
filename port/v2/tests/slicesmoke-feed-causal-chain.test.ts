import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  assessCompendiumFeedAudioAcknowledgement,
  assessCompendiumFeedCommittedOutcome,
  assessCompendiumFeedPendingWindow,
  assessCompendiumFeedTwoDocumentStaleOutcome,
  selectArc5FeedFixtureBurnVerb,
} from '../tools/slicesmoke-contract.mjs';

const source = readFileSync(
  fileURLToPath(new URL('../tools/slicesmoke.mjs', import.meta.url)),
  'utf8',
);
const digest = (character: string): string => character.repeat(64);
const canonicalJson = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const row = value as Record<string, unknown>;
    return `{${Object.keys(row).sort().map((key) => (
      `${JSON.stringify(key)}:${canonicalJson(row[key])}`
    )).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
};
const hashCanonical = (value: unknown): string => createHash('sha256')
  .update(canonicalJson(value)).digest('hex');
const hashText = (value: string): string => createHash('sha256').update(value).digest('hex');

const fixture = Object.freeze({
  logicalId: 's1337',
  creatureId: `creature-v1:${digest('1')}`,
  foodLotId: `specimen-v1:${digest('2')}`,
  fedBefore: 19,
  fedAfter: 20,
  foodQuantityBefore: 2,
  foodQuantityAfter: 1,
});

function pendingBundle() {
  const sessionDraws = { tame: 4 };
  const authority = {
    activePlayMs: 2_000,
    sessionRng: { seed: 68, ordinal: 3, draws: sessionDraws },
  };
  const predecessor = { ordinal: 0, kind: 'predecessor', witness: 'prior' };
  const persistent = {
    globalRevision: 40,
    ownershipRevision: 9,
    sourceRevision: 9,
    sourceDigest: digest('5'),
    targetDigest: digest('4'),
    rawPersistenceFingerprint: digest('6'),
    durableFingerprint: digest('3'),
    arc4Fingerprint: digest('7'),
    unrelatedFingerprint: digest('8'),
    receiptCount: 1,
    receiptKeys: ['receipt:0'],
    receiptRawRows: [JSON.stringify(predecessor)],
    receiptRows: [predecessor],
    authorityVersion: 1,
    authority,
    authorityJson: JSON.stringify(authority),
    sessionSeed: 68,
    sessionOrdinal: 3,
    sessionDraws,
    sessionDrawsFingerprint: hashCanonical(sessionDraws),
  };
  const common = {
    ...persistent,
    feedResult: 'null',
    controller: {
      pendingWork: 1,
      lastRequest: { creatureId: fixture.creatureId, foodLotId: fixture.foodLotId },
    },
    actionCoordinator: {
      inFlight: true,
      owner: { busy: true, operation: 'arc5.companion-feed' },
      hold: { phase: 'holding', operation: 'arc5.companion-feed' },
    },
    ui: {
      statusKind: 'pending',
      confirmDisabled: true,
      radioCount: 2,
      allRadiosDisabled: true,
      backEnabled: true,
      closeEnabled: true,
    },
  };
  return {
    fixture,
    documentToken: 'feed-document',
    heartbeat: {
      schema: 'cf-v2-f4-heartbeat-quiescence/v1',
      documentToken: 'feed-document',
      wasRunning: true,
      stopped: true,
      cycleSettled: true,
    },
    activation: {
      pressCount: 1,
      presses: [{
        kind: 'confirm', trusted: true, tag: 'BUTTON',
        creatureId: fixture.creatureId, foodLotId: fixture.foodLotId,
      }],
    },
    before: {
      ...persistent,
      feedResult: common.feedResult,
    },
    held: structuredClone(common),
    retry: {
      ...structuredClone(common),
      confirmClickCount: 1,
      requestStable: true,
      point: {
        ok: true, selectorCount: 1, tag: 'BUTTON', disabled: true,
        visible: true, hitOwner: true, x: 320, y: 420, width: 120, height: 44,
      },
      dispatch: {
        kind: 'cdp-mouse', button: 'left', clickCount: 1, x: 320, y: 420,
      },
    },
    competing: {
      kind: 'unavailable', durability: 'none', convergence: 'none',
      verb: 'tame', detail: 'write-authority-unavailable', result: null,
    },
    lifecycle: {
      back: {
        trusted: true, tag: 'BUTTON', targetId: 'codexback', panelMode: 'list',
        pendingWork: 1, ownerBusy: true,
      },
      close: {
        trusted: true, tag: 'BUTTON', panelOwner: 'codex', panelOpen: null,
        attachedMountCount: 0, pendingWork: 1, ownerBusy: true,
      },
    },
  };
}

function committedBundle() {
  const sessionDraws = { tame: 4 };
  const predecessor = { ordinal: 0, kind: 'predecessor', witness: 'prior' };
  const authorityBefore = {
    activePlayMs: 2_000,
    sessionRng: { seed: 68, ordinal: 3, draws: sessionDraws },
  };
  const before = {
    globalRevision: 40,
    ownershipRevision: 9,
    receiptCount: 1,
    authorityVersion: 1,
    authority: authorityBefore,
    authorityJson: JSON.stringify(authorityBefore),
    codecAt: 1_000,
    segmentCodecAt: 1_000,
    sessionSeed: 68,
    sessionOrdinal: 3,
    sessionDraws,
    sourceRevision: 9,
    sourceDigest: digest('5'),
    targetDigest: digest('6'),
    arc4Fingerprint: digest('7'),
    sessionDrawsFingerprint: hashCanonical(sessionDraws),
    foodInvariantFingerprint: digest('9'),
    targetRemainderFingerprint: digest('a'),
    unrelatedFingerprint: digest('b'),
    durableFingerprint: digest('c'),
    fixedCarrierCount: 5,
    receiptKeys: ['receipt:0'],
    receiptRawRows: [JSON.stringify(predecessor)],
    receiptRows: [predecessor],
  };
  const receiptWitness = canonicalJson({
    schema: 'cf-v2-arc5-feed-witness/v1',
    receiptOrdinal: before.sessionOrdinal,
    parentRevision: before.ownershipRevision,
    parentDigest: before.targetDigest,
    creatureId: fixture.creatureId,
    foodLotId: fixture.foodLotId,
    fedBefore: fixture.fedBefore,
    fedAfter: fixture.fedAfter,
    foodQuantityBefore: fixture.foodQuantityBefore,
    foodQuantityAfter: fixture.foodQuantityAfter,
  });
  const receipt = {
    ordinal: 3,
    kind: 'arc5-companion-feed',
    witness: receiptWitness,
  };
  const authorityAfter = {
    ...authorityBefore,
    sessionRng: { seed: 68, ordinal: 4, draws: sessionDraws },
  };
  const after = {
    ...before,
    globalRevision: 41,
    ownershipRevision: 10,
    receiptCount: 2,
    authority: authorityAfter,
    authorityJson: JSON.stringify(authorityAfter),
    codecAt: 2_000,
    segmentCodecAt: 2_000,
    sessionOrdinal: 4,
    targetDigest: digest('d'),
    durableFingerprint: digest('e'),
    creatureId: fixture.creatureId,
    foodLotId: fixture.foodLotId,
    fedBefore: fixture.fedBefore,
    fedAfter: fixture.fedAfter,
    foodQuantityBefore: fixture.foodQuantityBefore,
    foodQuantityAfter: fixture.foodQuantityAfter,
    lotTombstoned: false,
    lotDisposition: null,
    tombstoneSnapshotQuantity: null,
    receiptOrdinal: 3,
    receiptKind: 'arc5-companion-feed',
    receiptWitness,
    receiptWitnessDigest: hashText(receiptWitness),
    receiptKeys: ['receipt:0', 'receipt:3'],
    receiptRawRows: [JSON.stringify(predecessor), JSON.stringify(receipt)],
    receiptRows: [predecessor, receipt],
    runtime: { revision: 41, sessionSeed: 68, sessionOrdinal: 4, sessionDraws },
  };
  return {
    fixture,
    heartbeat: {
      documentToken: 'feed-document',
      quiesced: {
        schema: 'cf-v2-f4-heartbeat-quiescence/v1',
        documentToken: 'feed-document',
        wasRunning: true,
        stopped: true,
        cycleSettled: true,
      },
      resumed: {
        schema: 'cf-v2-f4-heartbeat-resume/v1',
        documentToken: 'feed-document',
        running: true,
      },
    },
    toastSerialBefore: 5,
    before,
    after,
    settled: {
      result: {
        creatureId: fixture.creatureId,
        foodLotId: fixture.foodLotId,
        fedBefore: fixture.fedBefore,
        fedAfter: fixture.fedAfter,
        foodQuantityBefore: fixture.foodQuantityBefore,
        foodQuantityAfter: fixture.foodQuantityAfter,
        revision: 41,
        ownershipRevision: 10,
      },
      controller: { pendingWork: 0, lastOutcome: { kind: 'committed' } },
      lastOutcome: 'committed:41',
      toastSerial: 6,
      toastText: 'Meal complete',
    },
    audioCreates: 1,
    audioStarts: [{
      startReturned: true, sourceConnected: true, contextState: 'running',
      pendingWork: 0, lastOutcome: 'committed:41', toastSerial: 6,
    }],
    audioGraph: {
      schema: 'cf-v2-feed-audio-graph/v1',
      sourceNodeId: 'oscillator-1',
      destinationNodeId: 'destination-1',
      nodes: [
        { nodeId: 'oscillator-1', contextId: 'context-1', nodeType: 'OscillatorNode' },
        { nodeId: 'gain-1', contextId: 'context-1', nodeType: 'GainNode' },
        { nodeId: 'bus-1', contextId: 'context-1', nodeType: 'GainNode' },
        { nodeId: 'destination-1', contextId: 'context-1', nodeType: 'AudioDestinationNode' },
      ],
      edges: [
        { contextId: 'context-1', sourceId: 'oscillator-1', destinationId: 'gain-1' },
        { contextId: 'context-1', sourceId: 'gain-1', destinationId: 'bus-1' },
        { contextId: 'context-1', sourceId: 'bus-1', destinationId: 'destination-1' },
      ],
    },
    reopened: {
      logicalId: fixture.logicalId,
      creatureId: fixture.creatureId,
      fed: fixture.fedAfter,
      foodLotId: fixture.foodLotId,
      foodQuantity: fixture.foodQuantityAfter,
      pendingWork: 0,
    },
    reloaded: {
      ...after,
      durableFingerprint: after.durableFingerprint,
      globalRevision: after.globalRevision,
      ownershipRevision: after.ownershipRevision,
      logicalId: fixture.logicalId,
      creatureId: fixture.creatureId,
      fed: fixture.fedAfter,
      foodLotId: fixture.foodLotId,
      foodQuantity: fixture.foodQuantityAfter,
      pendingWork: 0,
      runtime: { revision: 41, sessionSeed: 68, sessionOrdinal: 4, sessionDraws },
    },
  };
}

function leaseSnapshot(token: string, heartbeat: number) {
  const row = {
    schema: 1,
    held: true,
    ownerId: 'celestial-frontier-game-tab',
    token,
    heartbeat,
  };
  return { raw: JSON.stringify(row), row };
}

function nativeFeedActivation(
  document: Readonly<{ targetId: string; documentToken: string }>,
  x: number,
) {
  return {
    point: {
      ok: true, selectorCount: 1, tag: 'BUTTON', disabled: false,
      visible: true, hitOwner: true, x, y: 420, width: 120, height: 44,
    },
    dispatch: { kind: 'cdp-mouse', button: 'left', clickCount: 1, x, y: 420 },
    pressCount: 1,
    presses: [{
      kind: 'confirm', trusted: true, tag: 'BUTTON', pointerType: 'mouse',
      creatureId: fixture.creatureId, foodLotId: fixture.foodLotId,
      documentToken: document.documentToken, targetId: document.targetId,
    }],
  };
}

function releasedConvergenceAudio() {
  return {
    schema: 'cf-v2-tame-greeting-audio/v1',
    disposed: true,
    armed: 0,
    activeVoiceId: null,
    counterpart: { key: null, generation: null, status: 'none' },
    runtime: {
      state: 'disposed',
      contextState: null,
      nodes: { active: 0 },
      voices: { active: 0, ids: [] },
      creatureEmitters: { active: 0 },
      reservations: { voices: { active: 0 }, nodes: { active: 0 } },
    },
  };
}

function twoDocumentStaleBundle() {
  const loserDocument = {
    targetId: 'feed-target-loser',
    sessionId: 'feed-session-loser',
    documentToken: 'feed-document-loser',
    origin: 'http://127.0.0.1:4173',
  };
  const winnerDocument = {
    targetId: 'feed-target-winner',
    sessionId: 'feed-session-winner',
    documentToken: 'feed-document-winner',
    origin: loserDocument.origin,
  };
  const winner = {
    ...committedBundle(),
    committedRawPersistenceFingerprint: digest('f'),
  };
  Object.assign(winner.after, {
    creatureFed: fixture.fedAfter,
    foodQuantity: fixture.foodQuantityAfter,
    rawPersistenceFingerprint: winner.committedRawPersistenceFingerprint,
  });
  winner.heartbeat.documentToken = winnerDocument.documentToken;
  winner.heartbeat.quiesced.documentToken = winnerDocument.documentToken;
  winner.heartbeat.resumed.documentToken = winnerDocument.documentToken;

  const parentSnapshot = () => ({
    rawPersistenceFingerprint: digest('4'),
    projection: structuredClone(winner.before),
  });
  const staleRuntime = {
    schema: 'cf-v2-f4-runtime/v1',
    revision: winner.before.globalRevision,
    sessionSeed: winner.before.sessionSeed,
    sessionOrdinal: winner.before.sessionOrdinal,
    sessionDraws: structuredClone(winner.before.sessionDraws),
    activePlayMs: winner.before.authority.activePlayMs,
    visible: true,
    answerable: false,
    leaseOwned: false,
    staleBlocked: true,
    leaseHeartbeat: null,
    accruing: false,
    commits: 1,
    staleWrites: 1,
    leaseLosses: 0,
  };
  const releasedRuntime = { ...structuredClone(staleRuntime), visible: false };
  const feedRequest = {
    surface: {
      generation: 7,
      logicalId: fixture.logicalId,
      speciesId: `species-v1:${digest('3')}`,
      surfaceKey: 'feed-surface-key',
    },
    contextKey: 'feed-context-key',
    ownershipRevision: winner.before.ownershipRevision,
    ownershipDigest: winner.before.targetDigest,
    creatureId: fixture.creatureId,
    foodLotId: fixture.foodLotId,
    fedBefore: fixture.fedBefore,
    fedAfter: fixture.fedAfter,
    foodQuantityBefore: fixture.foodQuantityBefore,
    foodQuantityAfter: fixture.foodQuantityAfter,
  };
  const playerCopy = {
    schema: 'cf-v2-compendium-feed-outcome/v1',
    kind: 'refused',
    convergence: 'read-only-reload',
    request: structuredClone(feedRequest),
    title: 'Reload required.',
    detail: 'Feed authority changed before durability. Meals and flora are unchanged.',
  };
  const feedAssessorOnlyFields = new Set([
    'runtime',
    'fedBefore', 'fedAfter', 'creatureId', 'foodLotId',
    'foodQuantityBefore', 'foodQuantityAfter',
    'receiptOrdinal', 'receiptKind', 'receiptWitness', 'receiptWitnessDigest',
  ]);
  const persistedWinner = Object.fromEntries(
    Object.entries(winner.after).filter(([key]) => !feedAssessorOnlyFields.has(key)),
  );
  const loserBaselineLease = leaseSnapshot(loserDocument.documentToken, 11);
  const winnerLease = leaseSnapshot(winnerDocument.documentToken, 12);
  return {
    fixture,
    documents: { loser: loserDocument, winner: winnerDocument },
    orchestration: { sameDocumentFaultInjectionCalls: 0, directWriterCalls: 0 },
    activations: {
      loser: nativeFeedActivation(loserDocument, 320),
      winner: nativeFeedActivation(winnerDocument, 360),
    },
    parent: {
      loserBefore: parentSnapshot(),
      loserHeld: parentSnapshot(),
      winnerBefore: parentSnapshot(),
    },
    lease: {
      ttlMs: 10_000,
      takeoverElapsedMs: 10_025,
      loserBaseline: loserBaselineLease,
      contenderObserved: structuredClone(loserBaselineLease),
      winnerAcquired: winnerLease,
      winnerCommitted: structuredClone(winnerLease),
    },
    winner,
    loser: {
      settled: {
        lastOutcome: 'refused:transaction:stale',
        lastResult: null,
        feedResult: 'null',
        controller: {
          schema: 'cf-v2-compendium-feed-diagnostics/v1',
          pendingWork: 0,
          convergenceLatched: true,
          lastRequest: feedRequest,
          lastOutcome: playerCopy,
        },
        actionCoordinator: {
          inFlight: false,
          owner: { busy: false, operation: null },
          hold: { phase: 'released', operation: 'arc5.companion-feed' },
        },
        toastSerialBefore: 5,
        toastSerialAfter: 6,
        toastText: 'Reload required.Feed authority changed before durability. Meals and flora are unchanged.',
        audioCreates: 0,
        audioStarts: [],
        rawPersistenceFingerprint: winner.committedRawPersistenceFingerprint,
        durableAfterAttempt: structuredClone(persistedWinner),
      },
      convergence: {
        released: true,
        witnessCount: 1,
        witness: {
          schema: 'cf-v2-f4-authority-convergence/v1',
          status: 'released',
          errors: [],
          detail: 'Arc 5 Feed authority transaction:stale',
          documentToken: loserDocument.documentToken,
          before: {
            hold: 'transient-read',
            mutationBlocked: true,
            heartbeatRunning: false,
            leaseReadCount: 3,
            revisionReadCount: 2,
            runtime: staleRuntime,
            audio: null,
          },
          after: {
            heartbeatRunning: false,
            leaseReadCount: 3,
            revisionReadCount: 2,
            runtime: releasedRuntime,
            audio: releasedConvergenceAudio(),
          },
        },
      },
      reloaded: {
        documentToken: 'feed-document-loser-reload',
        bootKind: 'current-v5',
        rawPersistenceFingerprint: winner.committedRawPersistenceFingerprint,
        durable: structuredClone(persistedWinner),
        feed: {
          logicalId: fixture.logicalId,
          creatureId: fixture.creatureId,
          fed: fixture.fedAfter,
          foodLotId: fixture.foodLotId,
          foodQuantity: fixture.foodQuantityAfter,
          pendingWork: 0,
        },
        persistence: {
          mutationBlocked: true,
          runtime: {
            schema: 'cf-v2-f4-runtime/v1',
            revision: winner.after.globalRevision,
            sessionSeed: winner.after.sessionSeed,
            sessionOrdinal: winner.after.sessionOrdinal,
            sessionDraws: structuredClone(winner.after.sessionDraws),
            activePlayMs: winner.after.authority.activePlayMs,
            visible: false,
            answerable: false,
            leaseOwned: false,
            staleBlocked: false,
            leaseHeartbeat: null,
            accruing: false,
            commits: 0,
            staleWrites: 0,
            leaseLosses: 0,
          },
        },
      },
    },
  };
}

describe('Slice Arc 5 Feed causal-chain evidence', () => {
  it('seeds the burn with the missing Feed prerequisite before restoring card order', () => {
    const rows = [
      { verb: 'tame', status: 'ready', button: { modelEnabled: 'true' } },
      { verb: 'scavenge', status: 'ready', button: { modelEnabled: 'true' } },
      { verb: 'sample', status: 'ready', button: { modelEnabled: 'true' } },
    ];
    const creature = { assignment: null, fed: 19 };
    const flora = { kind: 'flora', quantity: 2 };
    expect(selectArc5FeedFixtureBurnVerb({ creatures: [], specimenLots: [] }, rows)).toBe('tame');
    expect(selectArc5FeedFixtureBurnVerb({ creatures: [creature], specimenLots: [] }, rows))
      .toBe('scavenge');
    expect(selectArc5FeedFixtureBurnVerb({ creatures: [creature], specimenLots: [flora] }, rows))
      .toBe('tame');
    expect(selectArc5FeedFixtureBurnVerb({ creatures: [creature], specimenLots: [
      { kind: 'flora', quantity: 0 },
    ] }, rows)).toBe('scavenge');
    expect(selectArc5FeedFixtureBurnVerb({ creatures: [
      { assignment: 'field-scout', fed: 19 },
    ], specimenLots: [flora] }, rows)).toBe('tame');
    expect(selectArc5FeedFixtureBurnVerb({ creatures: [
      { assignment: null, fed: 200 },
    ], specimenLots: [flora] }, rows)).toBe('tame');
    expect(selectArc5FeedFixtureBurnVerb({ creatures: [creature], specimenLots: [
      { kind: 'fungi', quantity: 2 },
    ] }, rows)).toBe('scavenge');
    expect(selectArc5FeedFixtureBurnVerb({ creatures: [], specimenLots: [flora] }, rows))
      .toBe('tame');
    expect(selectArc5FeedFixtureBurnVerb({ creatures: [creature], specimenLots: [] }, [
      rows[0], rows[2],
    ])).toBeNull();
    expect(selectArc5FeedFixtureBurnVerb({}, [])).toBeNull();
  });

  it('requires the exact product fence while Feed is held without optimism', () => {
    const good = pendingBundle();
    expect(assessCompendiumFeedPendingWindow(good)).toEqual({ ok: true, reasons: [] });

    const wrongDetail = structuredClone(good);
    wrongDetail.competing.detail = 'worked-out';
    expect(assessCompendiumFeedPendingWindow(wrongDetail)).toEqual({
      ok: false,
      reasons: ['global mutation fence'],
    });

    const optimistic = structuredClone(good);
    optimistic.held.durableFingerprint = digest('0');
    expect(assessCompendiumFeedPendingWindow(optimistic)).toEqual({
      ok: false,
      reasons: ['held no optimistic publication'],
    });

    const rawMetadataWrite = structuredClone(good);
    rawMetadataWrite.held.rawPersistenceFingerprint = digest('0');
    expect(assessCompendiumFeedPendingWindow(rawMetadataWrite)).toEqual({
      ok: false,
      reasons: ['held full raw persistence fixed point'],
    });

    const earlyRevision = structuredClone(good);
    earlyRevision.held.globalRevision += 1;
    expect(assessCompendiumFeedPendingWindow(earlyRevision)).toEqual({
      ok: false,
      reasons: ['held revision fixed point'],
    });

    const earlyReceipt = structuredClone(good);
    earlyReceipt.held.receiptRawRows = earlyReceipt.held.receiptRawRows.map(
      (raw, index) => (index === 0 ? `${raw}\n` : raw),
    );
    expect(assessCompendiumFeedPendingWindow(earlyReceipt)).toEqual({
      ok: false,
      reasons: ['held receipt ledger fixed point'],
    });

    const earlyF4 = structuredClone(good);
    earlyF4.held.authorityJson += '\n';
    expect(assessCompendiumFeedPendingWindow(earlyF4)).toEqual({
      ok: false,
      reasons: ['held F4 authority fixed point'],
    });

    const earlyUnrelated = structuredClone(good);
    earlyUnrelated.held.unrelatedFingerprint = digest('0');
    expect(assessCompendiumFeedPendingWindow(earlyUnrelated)).toEqual({
      ok: false,
      reasons: ['held unrelated durable fixed point'],
    });

    const vacuousRetry = structuredClone(good);
    vacuousRetry.retry.point.hitOwner = false;
    expect(assessCompendiumFeedPendingWindow(vacuousRetry)).toEqual({
      ok: false,
      reasons: ['exact native disabled retry dispatch'],
    });

    const liveHeartbeat = structuredClone(good);
    liveHeartbeat.heartbeat.stopped = false;
    expect(assessCompendiumFeedPendingWindow(liveHeartbeat)).toEqual({
      ok: false,
      reasons: ['heartbeat-quiesced Feed snapshot window'],
    });
  });

  it('binds the final F4 ordinal, immutable witness, draw stability and Arc 5 remainder', () => {
    const good = committedBundle();
    expect(assessCompendiumFeedCommittedOutcome(good)).toEqual({ ok: true, reasons: [] });

    const wrongOrdinal = structuredClone(good);
    for (const candidate of [wrongOrdinal.after, wrongOrdinal.reloaded]) {
      candidate.sessionOrdinal = good.before.sessionOrdinal + 2;
      candidate.authority = structuredClone(candidate.authority);
      candidate.authority.sessionRng.ordinal = candidate.sessionOrdinal;
      candidate.authorityJson = JSON.stringify(candidate.authority);
      candidate.runtime = { ...candidate.runtime, sessionOrdinal: candidate.sessionOrdinal };
    }
    expect(assessCompendiumFeedCommittedOutcome(wrongOrdinal)).toEqual({
      ok: false,
      reasons: ['one global revision, ownership successor, and Feed receipt'],
    });

    const wrongWitness = structuredClone(good);
    wrongWitness.after.receiptWitness = wrongWitness.after.receiptWitness.replace(
      fixture.creatureId,
      `creature-v1:${digest('0')}`,
    );
    expect(assessCompendiumFeedCommittedOutcome(wrongWitness)).toEqual({
      ok: false,
      reasons: ['one global revision, ownership successor, and Feed receipt'],
    });

    const wrongDraws = structuredClone(good);
    wrongDraws.after.sessionDrawsFingerprint = digest('0');
    expect(assessCompendiumFeedCommittedOutcome(wrongDraws)).toEqual({
      ok: false,
      reasons: ['Arc 5-only fixed-five successor'],
    });

    const collateral = structuredClone(good);
    collateral.after.targetRemainderFingerprint = digest('0');
    expect(assessCompendiumFeedCommittedOutcome(collateral)).toEqual({
      ok: false,
      reasons: ['Arc 5-only fixed-five successor'],
    });

    const extraReceiptField = structuredClone(good);
    const receiptIndex = extraReceiptField.after.receiptRows.length - 1;
    Object.assign(extraReceiptField.after.receiptRows[receiptIndex]!, { extra: true });
    extraReceiptField.after.receiptRawRows[receiptIndex] = JSON.stringify(
      extraReceiptField.after.receiptRows[receiptIndex],
    );
    expect(assessCompendiumFeedCommittedOutcome(extraReceiptField)).toEqual({
      ok: false,
      reasons: ['one global revision, ownership successor, and Feed receipt'],
    });

    const extraAuthorityField = structuredClone(good);
    Object.assign(extraAuthorityField.after.authority, { extra: true });
    extraAuthorityField.after.authorityJson = JSON.stringify(extraAuthorityField.after.authority);
    expect(assessCompendiumFeedCommittedOutcome(extraAuthorityField)).toEqual({
      ok: false,
      reasons: ['Arc 5-only fixed-five successor'],
    });

    const extraRngField = structuredClone(good);
    Object.assign(extraRngField.after.authority.sessionRng, { extra: true });
    extraRngField.after.authorityJson = JSON.stringify(extraRngField.after.authority);
    expect(assessCompendiumFeedCommittedOutcome(extraRngField)).toEqual({
      ok: false,
      reasons: ['Arc 5-only fixed-five successor'],
    });

    const staleRuntimeRevision = structuredClone(good);
    staleRuntimeRevision.after.runtime.revision -= 1;
    expect(assessCompendiumFeedCommittedOutcome(staleRuntimeRevision)).toEqual({
      ok: false,
      reasons: ['Arc 5-only fixed-five successor'],
    });

    const staleReloadRuntimeRevision = structuredClone(good);
    staleReloadRuntimeRevision.reloaded.runtime.revision -= 1;
    expect(assessCompendiumFeedCommittedOutcome(staleReloadRuntimeRevision)).toEqual({
      ok: false,
      reasons: ['full-reload durable fixed point'],
    });

    const codecTimestampSplit = structuredClone(good);
    codecTimestampSplit.after.segmentCodecAt += 1;
    expect(assessCompendiumFeedCommittedOutcome(codecTimestampSplit)).toEqual({
      ok: false,
      reasons: ['Arc 5-only fixed-five successor'],
    });

    const laterReloadCheckpoint = structuredClone(good);
    laterReloadCheckpoint.reloaded.codecAt += 1;
    laterReloadCheckpoint.reloaded.segmentCodecAt += 1;
    expect(assessCompendiumFeedCommittedOutcome(laterReloadCheckpoint)).toEqual({
      ok: true,
      reasons: [],
    });

    const backwardReloadCodec = structuredClone(good);
    backwardReloadCodec.reloaded.codecAt = good.after.codecAt - 1;
    backwardReloadCodec.reloaded.segmentCodecAt = good.after.segmentCodecAt - 1;
    expect(assessCompendiumFeedCommittedOutcome(backwardReloadCodec)).toEqual({
      ok: false,
      reasons: ['full-reload durable fixed point'],
    });

    const suspendedAcknowledgement = structuredClone(good);
    suspendedAcknowledgement.audioStarts[0]!.contextState = 'suspended';
    expect(assessCompendiumFeedCommittedOutcome(suspendedAcknowledgement)).toEqual({
      ok: false,
      reasons: ['one post-settlement acknowledgement'],
    });

    expect(assessCompendiumFeedAudioAcknowledgement({
      audioCreates: good.audioCreates,
      audioStarts: good.audioStarts,
      audioGraph: good.audioGraph,
      globalRevision: good.after.globalRevision,
      toastSerial: good.settled.toastSerial,
    })).toEqual({ ok: true, reasons: [] });

    const startDidNotReturn = structuredClone(good);
    startDidNotReturn.audioStarts[0]!.startReturned = false;
    expect(assessCompendiumFeedCommittedOutcome(startDidNotReturn)).toEqual({
      ok: false,
      reasons: ['one post-settlement acknowledgement'],
    });

    const routeStopsAtBus = structuredClone(good);
    routeStopsAtBus.audioGraph.edges.pop();
    expect(assessCompendiumFeedCommittedOutcome(routeStopsAtBus)).toEqual({
      ok: false,
      reasons: ['one post-settlement acknowledgement'],
    });

    const crossContextIntermediate = structuredClone(good);
    const intermediate = crossContextIntermediate.audioGraph.nodes.find((node) => (
      node.nodeId !== crossContextIntermediate.audioGraph.sourceNodeId
      && node.nodeId !== crossContextIntermediate.audioGraph.destinationNodeId
      && crossContextIntermediate.audioGraph.edges.some((edge) => (
        edge.sourceId === node.nodeId || edge.destinationId === node.nodeId
      ))
    ));
    expect(intermediate).toBeDefined();
    intermediate!.contextId = 'context-cross-owner';
    expect(assessCompendiumFeedCommittedOutcome(crossContextIntermediate)).toEqual({
      ok: false,
      reasons: ['one post-settlement acknowledgement'],
    });

    const falseDestination = structuredClone(good);
    falseDestination.audioGraph.nodes.at(-1)!.nodeType = 'GainNode';
    expect(assessCompendiumFeedCommittedOutcome(falseDestination)).toEqual({
      ok: false,
      reasons: ['one post-settlement acknowledgement'],
    });

    const graphShapeMutation = structuredClone(good);
    Object.assign(graphShapeMutation.audioGraph.edges[0]!, { connected: true });
    expect(assessCompendiumFeedCommittedOutcome(graphShapeMutation)).toEqual({
      ok: false,
      reasons: ['one post-settlement acknowledgement'],
    });

    const heartbeatNotResumed = structuredClone(good);
    heartbeatNotResumed.heartbeat.resumed.running = false;
    expect(assessCompendiumFeedCommittedOutcome(heartbeatNotResumed)).toEqual({
      ok: false,
      reasons: ['heartbeat-owned Feed snapshot lifecycle'],
    });
  });

  it('requires one native two-document winner and one stale loser fixed point', () => {
    const good = twoDocumentStaleBundle();
    expect(assessCompendiumFeedTwoDocumentStaleOutcome(good)).toEqual({
      ok: true,
      reasons: [],
    });
    const expectOnly = (
      mutate: (candidate: ReturnType<typeof twoDocumentStaleBundle>) => void,
      reason: string,
    ) => {
      const candidate = structuredClone(good);
      mutate(candidate);
      expect(assessCompendiumFeedTwoDocumentStaleOutcome(candidate)).toEqual({
        ok: false,
        reasons: [reason],
      });
    };
    const refreshLeaseRaw = (snapshot: { raw: string; row: object }) => {
      snapshot.raw = JSON.stringify(snapshot.row);
    };

    expectOnly((candidate) => {
      const token = candidate.documents.loser.documentToken;
      candidate.documents.winner.documentToken = token;
      candidate.activations.winner.presses[0]!.documentToken = token;
      candidate.winner.heartbeat.documentToken = token;
      candidate.winner.heartbeat.quiesced.documentToken = token;
      candidate.winner.heartbeat.resumed.documentToken = token;
      candidate.lease.winnerAcquired.row.token = token;
      candidate.lease.winnerCommitted.row.token = token;
      refreshLeaseRaw(candidate.lease.winnerAcquired);
      refreshLeaseRaw(candidate.lease.winnerCommitted);
    }, 'real two-document identities');
    expectOnly((candidate) => {
      candidate.orchestration.sameDocumentFaultInjectionCalls = 1;
    }, 'no injected stale or direct writer');
    expectOnly((candidate) => {
      candidate.orchestration.directWriterCalls = 1;
    }, 'no injected stale or direct writer');
    expectOnly((candidate) => {
      candidate.activations.loser.presses[0]!.trusted = false;
    }, 'two trusted native Feed confirmations');
    expectOnly((candidate) => {
      candidate.activations.winner.presses[0]!.trusted = false;
    }, 'two trusted native Feed confirmations');
    expectOnly((candidate) => {
      candidate.activations.winner.pressCount = 2;
      candidate.activations.winner.presses.push(
        structuredClone(candidate.activations.winner.presses[0]!),
      );
    }, 'two trusted native Feed confirmations');
    expectOnly((candidate) => {
      candidate.parent.loserHeld.projection.targetDigest = digest('0');
    }, 'exact shared pre-durable Feed parent');
    expectOnly((candidate) => {
      candidate.lease.winnerAcquired.row.token = 'foreign-document';
      refreshLeaseRaw(candidate.lease.winnerAcquired);
    }, 'TTL-bound active-play lease handoff');
    expectOnly((candidate) => {
      candidate.lease.takeoverElapsedMs = candidate.lease.ttlMs - 1;
    }, 'TTL-bound active-play lease handoff');
    expectOnly((candidate) => {
      candidate.winner.settled.lastOutcome = 'refused:transaction:stale';
    }, 'winner one exact committed Feed');
    expectOnly((candidate) => {
      candidate.loser.settled.controller.lastOutcome.detail = 'Nothing was used.';
    }, 'loser real stale refusal and owner release');
    expectOnly((candidate) => {
      candidate.loser.settled.controller.lastOutcome.request.creatureId
        = `creature-v1:${digest('0')}`;
    }, 'loser real stale refusal and owner release');
    expectOnly((candidate) => {
      (candidate.loser.settled as { lastResult: unknown }).lastResult = { fedAfter: 20 };
    }, 'loser no publication or acknowledgement');
    expectOnly((candidate) => {
      candidate.loser.settled.audioCreates = 1;
    }, 'loser no publication or acknowledgement');
    expectOnly((candidate) => {
      candidate.loser.settled.toastSerialAfter = candidate.loser.settled.toastSerialBefore;
    }, 'loser no publication or acknowledgement');
    expectOnly((candidate) => {
      candidate.loser.settled.toastText = 'Meal complete.';
    }, 'loser no publication or acknowledgement');
    expectOnly((candidate) => {
      candidate.loser.settled.rawPersistenceFingerprint = digest('0');
    }, 'loser stale attempt preserves winner durable bytes');
    expectOnly((candidate) => {
      candidate.loser.convergence.witness.before.runtime.staleWrites = 0;
      candidate.loser.convergence.witness.after.runtime.staleWrites = 0;
    }, 'single stale convergence release');
    expectOnly((candidate) => {
      candidate.loser.convergence.witnessCount = 0;
    }, 'single stale convergence release');
    expectOnly((candidate) => {
      candidate.loser.convergence.released = false;
    }, 'single stale convergence release');
    expectOnly((candidate) => {
      candidate.loser.convergence.witnessCount = 2;
    }, 'single stale convergence release');
    expectOnly((candidate) => {
      candidate.loser.convergence.witness.detail = 'Arc 5 Feed authority stale';
    }, 'single stale convergence release');
    expectOnly((candidate) => {
      candidate.loser.convergence.witness.after.runtime.visible = true;
    }, 'single stale convergence release');
    expectOnly((candidate) => {
      candidate.loser.convergence.witness.after.audio.disposed = false;
    }, 'single stale convergence release');
    expectOnly((candidate) => {
      candidate.loser.reloaded.documentToken = candidate.documents.loser.documentToken;
    }, 'loser replacement document and current-v5 boot');
    expectOnly((candidate) => {
      candidate.loser.reloaded.rawPersistenceFingerprint = digest('0');
    }, 'loser reload byte-identical winner fixed point');
    expectOnly((candidate) => {
      const durable = candidate.loser.reloaded.durable as Record<string, unknown>;
      durable.globalRevision = Number(durable.globalRevision) + 1;
    }, 'loser reload byte-identical winner fixed point');
    expectOnly((candidate) => {
      const durable = candidate.loser.reloaded.durable as Record<string, unknown>;
      durable.receiptCount = Number(durable.receiptCount) + 1;
    }, 'loser reload byte-identical winner fixed point');
    expectOnly((candidate) => {
      candidate.loser.reloaded.persistence.runtime.answerable = true;
    }, 'loser reload remains read-only under winner lease');
  });

  it('wires both decisions to native Compendium interaction and reload evidence', () => {
    const detailOwnerStart = source.indexOf('const arc5FeedOpenDetail = async');
    const detailOwnerEnd = source.indexOf('const arc5FeedChoiceSelector', detailOwnerStart);
    const detailOwner = source.slice(detailOwnerStart, detailOwnerEnd);
    const setupOwnerStart = source.indexOf('const audioArm = await evalIn', detailOwnerEnd);
    const setupOwnerEnd = source.indexOf('const initialFeedUi = await arc5FeedOpenDetail', setupOwnerStart);
    const setupOwner = source.slice(setupOwnerStart, setupOwnerEnd);
    const raceOwnerNeedle = '    /* A genuinely separate same-origin document now wins';
    const raceOwnerStart = source.indexOf(raceOwnerNeedle, setupOwnerEnd);
    const raceOwnerEnd = source.indexOf('    const committedBundle = {', raceOwnerStart);
    const raceOwner = source.slice(raceOwnerStart, raceOwnerEnd);
    expect(detailOwnerStart).toBeGreaterThanOrEqual(0);
    expect(detailOwnerEnd).toBeGreaterThan(detailOwnerStart);
    expect(setupOwnerStart).toBeGreaterThan(detailOwnerEnd);
    expect(setupOwnerEnd).toBeGreaterThan(setupOwnerStart);
    expect(raceOwnerStart).toBeGreaterThan(setupOwnerEnd);
    expect(raceOwnerEnd).toBeGreaterThan(raceOwnerStart);
    expect(source.lastIndexOf(raceOwnerNeedle)).toBe(raceOwnerStart);
    for (const binding of [
      "const loserFeedActivation = await arc5FeedClick(\n      '#codexpanel [data-arc5-feed-confirm]', 'Arc 5 Feed confirm',\n    );",
      'const pendingAssessment = assessCompendiumFeedPendingWindow(pendingBundle);',
      "window.__CF_SLICE__.api.__smokeCaptureCurrentSurface('tame')",
      'const committedAssessment = assessCompendiumFeedCommittedOutcome(committedBundle);',
      'const twoDocumentAssessment = assessCompendiumFeedTwoDocumentStaleOutcome(',
      'receiptWitness: receipt?.witness ?? null,',
      'targetRemainderFingerprint:',
      'sessionDrawsFingerprint:',
      'rawPersistenceFingerprint:',
      'const arc5FeedRawPersistenceFingerprint = (raw) => arc5FeedHash({',
      'rawPersistenceFingerprint: arc5FeedRawPersistenceFingerprint(heldRawMetadataMutant)',
      'selectArc5FeedFixtureBurnVerb(',
      "failSliceWithoutCascade(\n      'ARC 5 FEED FIXTURE:",
      "waitDesktopValue('Arc 5 Feed Sound settings', `window.__CF_SLICE__.api.state().panelOpen==='set'`)",
      "arc5FeedClick('#setpanel [data-pnx]', 'Arc 5 Feed Settings Close')",
      "waitForF4Writable('Arc 5 Feed pre-action writable authority')",
    ]) expect(source).toContain(binding);
    expect(detailOwner).toContain(
      "arc5FeedClick('#railcodex', `${label} Compendium opener`, driver)",
    );
    expect(detailOwner).not.toContain("arc5FeedClick('#dockcodex'");
    expect(detailOwner).toContain('${fixture.sourceIndex}/(count-1)');
    expect(detailOwner).toContain("route:'scan'");
    expect(detailOwner).toContain('visits<256');
    expect(detailOwner).not.toContain('*96');
    expect(detailOwner).not.toContain('*58');
    expect(setupOwner).toContain('const audioBaseline = await evalIn');
    expect(setupOwner).toContain('audioBaseline.creates !== 0 || audioBaseline.starts.length !== 0');
    expect(setupOwner).not.toContain('audio-prime');
    expect(setupOwner).not.toContain("await evalIn('window.__cfFeedAudioCreates=0;window.__cfFeedAudioStarts=[]')");
    for (const binding of [
      'const loserTargetId = t.targetId;',
      'const loserOrigin = new URL(URL0).origin;',
      "url: 'about:blank', newWindow: true, background: false,",
      "await send('Runtime.addBinding', { name: '__cfF4StartHidden' }, winnerSession);",
      "await send('Page.navigate', { url: URL0 }, winnerSession);",
      "const winnerOrigin = await winnerDriver.evaluate('location.origin');",
      "window.__CF_SLICE__.api.__smokeRunF4Heartbeat();",
      'const takeoverElapsedMs = performance.now() - takeoverStartedAt;',
      'ttlMs: 10_000,',
      'loserBaseline: loserLeaseBaseline,',
      'contenderObserved: contenderObservedLease,',
      'winnerAcquired: winnerAcquiredLease,',
      'winnerCommitted: winnerCommittedLease,',
      "const winnerFeedActivation = await arc5FeedClick(\n        '#codexpanel [data-arc5-feed-confirm]',\n        'Arc 5 Feed winner confirm', winnerDriver,\n      );",
      'loser: { targetId: loserTargetId, sessionId: sess,',
      'winner: { targetId: winnerTarget.targetId, sessionId: winnerSession,',
    ]) expect(raceOwner).toContain(binding);
    expect(raceOwner).not.toContain('__smokeStaleNextArc5FeedAuthority');
    expect(raceOwner).not.toContain('revisionRepo');
    expect(raceOwner).not.toContain('indexedDB.open');
    expect(raceOwner).not.toMatch(/\.objectStore\([^)]*\)\.(?:add|put|delete|clear)\s*\(/u);
    expect(raceOwner).not.toMatch(/\.mutate\s*\(/u);
    expect(source).toContain('const retryDispatch = retryPoint?.ok ? await clickDesktopPoint(retryPoint) : null;');
    expect(source).toContain('window.__CF_SLICE__.api.__smokeQuiesceF4Heartbeat()');
    expect(source).toContain('window.__CF_SLICE__.api.__smokeResumeF4Heartbeat()');
    expect(source).toContain('const result=Reflect.apply(originalStart,this,arguments)');
    expect(source).toContain("await send('WebAudio.enable', {}, winnerSession);");
    expect(source).toContain('compendiumFeedWebAudioGraph(');
    expect(source).toContain("'Arc 5 Feed successful oscillator start'");
    expect(source).toContain("node.nodeType === 'AudioDestinationNode'");
    expect(source).toContain('sourceNode?.contextId === edge.contextId');
    expect(source).toContain('destinationNode?.contextId === edge.contextId');
    expect(source).toContain('evidence.starts[0]?.startReturned===true');
    expect(source).not.toContain("panelOpen==='sets'");
    expect(source).not.toContain('#settingspanel [data-pnx]');
    expect(source).not.toContain('heldRawMetadataProjection');
    expect(source).not.toContain('__smokeFeed');
  });
});
