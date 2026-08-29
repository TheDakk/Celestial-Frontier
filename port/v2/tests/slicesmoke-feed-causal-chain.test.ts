import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  assessCompendiumFeedAudioAcknowledgement,
  assessCompendiumFeedCommittedOutcome,
  assessCompendiumFeedPendingWindow,
  assessCompendiumFeedTwoDocumentStaleOutcome,
  compendiumFeedWebAudioEndpointFailureIsInstrument,
  compendiumFeedWebAudioRouteNodeIds,
  projectCompendiumFeedWebAudioGraph,
  selectArc5FeedFixtureBurnVerb,
} from '../tools/slicesmoke-contract.mjs';

const source = readFileSync(
  fileURLToPath(new URL('../tools/slicesmoke.mjs', import.meta.url)),
  'utf8',
);
const glassSource = readFileSync(
  fileURLToPath(new URL('../tools/glassmatrix.mjs', import.meta.url)),
  'utf8',
);
const FEED_RELEASE_SILENCE_PREDICATE_SOURCE =
  '/refused, stale, converging, replayed, hidden, route-lost, and counterpart-lost paths remain silent/i.test(mealText)';
const feedReleaseSilenceWiringIsSemantic = (owner: string): boolean =>
  owner.includes(FEED_RELEASE_SILENCE_PREDICATE_SOURCE);
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
const feedAudioPreferenceSetupIsComplete = (owner: string): boolean => [
  'sndOn:state.sndOn===true',
  'voiceOn:state.voiceOn===true',
  "arc5FeedClick('#setsnd', 'Arc 5 Feed Sound On')",
  "arc5FeedClick('#setvoice', 'Arc 5 Feed Creature voices On')",
  'audioPreferencesEnabled.sndOn !== true || audioPreferencesEnabled.voiceOn !== true',
].every((binding) => owner.includes(binding));

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

const FEED_AUDIO_SESSION = 'feed-audio-session';
type FeedAudioProtocolEvent = {
  sessionId: string;
  method: string;
  params: {
    node?: { nodeId: string; contextId: string; nodeType: string };
    nodeId?: string;
    contextId?: string;
    sourceId?: string;
    destinationId?: string;
  };
};
function feedAudioProtocolEvents(): FeedAudioProtocolEvent[] {
  const created = (nodeId: string, nodeType: string, contextId = 'context-1') => ({
    sessionId: FEED_AUDIO_SESSION,
    method: 'WebAudio.audioNodeCreated',
    params: { node: { nodeId, contextId, nodeType } },
  });
  const connected = (sourceId: string, destinationId: string, contextId = 'context-1') => ({
    sessionId: FEED_AUDIO_SESSION,
    method: 'WebAudio.nodesConnected',
    params: { contextId, sourceId, destinationId },
  });
  return [
    created('oscillator-1', 'Oscillator'),
    created('gain-1', 'Gain'),
    created('bus-1', 'Gain'),
    created('destination-1', 'AudioDestination'),
    connected('oscillator-1', 'gain-1'),
    connected('gain-1', 'bus-1'),
    connected('bus-1', 'destination-1'),
  ];
}

function projectedFeedAudioGraph(events = feedAudioProtocolEvents(), sourceMark = 0) {
  return projectCompendiumFeedWebAudioGraph({
    events,
    sessionId: FEED_AUDIO_SESSION,
    enableMark: 0,
    sourceMark,
  });
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
    audioGraph: projectedFeedAudioGraph(),
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

  it('projects exact raw CDP WebAudio node types and rejects vacuous routes', () => {
    const baseline = committedBundle();
    const assessGraph = (audioGraph: ReturnType<typeof projectedFeedAudioGraph>) => (
      assessCompendiumFeedAudioAcknowledgement({
        audioCreates: baseline.audioCreates,
        audioStarts: baseline.audioStarts,
        audioGraph,
        globalRevision: baseline.after.globalRevision,
        toastSerial: baseline.settled.toastSerial,
      })
    );
    const good = projectedFeedAudioGraph();
    expect(good.sourceNodeId).toBe('oscillator-1');
    expect(good.destinationNodeId).toBe('destination-1');
    expect(good.sourceCandidateCount).toBe(1);
    expect(good.destinationCandidateCount).toBe(1);
    expect(good.nodeTypeInventory).toEqual([
      ['AudioDestination', 1], ['Gain', 2], ['Oscillator', 1],
    ]);
    expect(assessGraph(good)).toEqual({ ok: true, reasons: [] });

    const staleInventory = structuredClone(good);
    const gainInventory = staleInventory.nodeTypeInventory.filter(([nodeType]) => (
      nodeType === 'Gain'
    ));
    expect(gainInventory).toHaveLength(1);
    gainInventory[0]![1] += 1;
    expect(assessGraph(staleInventory)).toEqual({
      ok: false,
      reasons: ['live AudioDestination route'],
    });
    const wrongSourceCandidateCount = structuredClone(good);
    wrongSourceCandidateCount.sourceCandidateCount += 1;
    expect(assessGraph(wrongSourceCandidateCount)).toEqual({
      ok: false,
      reasons: ['live AudioDestination route'],
    });
    const wrongDestinationCandidateCount = structuredClone(good);
    wrongDestinationCandidateCount.destinationCandidateCount += 1;
    expect(assessGraph(wrongDestinationCandidateCount)).toEqual({
      ok: false,
      reasons: ['live AudioDestination route'],
    });

    const withOneDomInterfaceName = (rawType: string, domType: string) => {
      let changeCount = 0;
      const events = feedAudioProtocolEvents().map((event) => {
        const node = event.params?.node;
        if (!node || node.nodeType !== rawType) return event;
        changeCount += 1;
        return { ...event, params: { node: { ...node, nodeType: domType } } };
      });
      expect(changeCount).toBe(1);
      return events;
    };
    const domSourceGraph = projectedFeedAudioGraph(
      withOneDomInterfaceName('Oscillator', 'OscillatorNode'),
    );
    expect(assessGraph(domSourceGraph)).toEqual({
      ok: false,
      reasons: ['live AudioDestination route'],
    });
    expect(compendiumFeedWebAudioEndpointFailureIsInstrument({
      audioCreates: baseline.audioCreates,
      audioStarts: baseline.audioStarts,
      audioGraph: domSourceGraph,
      globalRevision: baseline.after.globalRevision,
      toastSerial: baseline.settled.toastSerial,
    })).toBe(true);
    const domDestinationGraph = projectedFeedAudioGraph(
      withOneDomInterfaceName('AudioDestination', 'AudioDestinationNode'),
    );
    expect(assessGraph(domDestinationGraph)).toEqual({
      ok: false,
      reasons: ['live AudioDestination route'],
    });
    expect(compendiumFeedWebAudioEndpointFailureIsInstrument({
      audioCreates: baseline.audioCreates,
      audioStarts: baseline.audioStarts,
      audioGraph: domDestinationGraph,
      globalRevision: baseline.after.globalRevision,
      toastSerial: baseline.settled.toastSerial,
    })).toBe(true);
    expect(compendiumFeedWebAudioEndpointFailureIsInstrument({
      audioCreates: baseline.audioCreates,
      audioStarts: baseline.audioStarts,
      audioGraph: good,
      globalRevision: baseline.after.globalRevision,
      toastSerial: baseline.settled.toastSerial,
    })).toBe(false);
    expect(compendiumFeedWebAudioEndpointFailureIsInstrument({
      audioCreates: 0,
      audioStarts: [],
      audioGraph: domSourceGraph,
      globalRevision: baseline.after.globalRevision,
      toastSerial: baseline.settled.toastSerial,
    })).toBe(false);
    expect(compendiumFeedWebAudioEndpointFailureIsInstrument({
      audioCreates: 1,
      audioStarts: [],
      audioGraph: domSourceGraph,
      globalRevision: baseline.after.globalRevision,
      toastSerial: baseline.settled.toastSerial,
    })).toBe(false);
    const badStartMutations = [
      { startReturned: false },
      { sourceConnected: false },
      { contextState: 'suspended' },
      { pendingWork: 1 },
      { lastOutcome: 'refused:transaction:stale' },
      { toastSerial: baseline.settled.toastSerial + 1 },
      { extra: true },
    ];
    for (const mutation of badStartMutations) {
      expect(compendiumFeedWebAudioEndpointFailureIsInstrument({
        audioCreates: baseline.audioCreates,
        audioStarts: [{ ...baseline.audioStarts[0], ...mutation }],
        audioGraph: domSourceGraph,
        globalRevision: baseline.after.globalRevision,
        toastSerial: baseline.settled.toastSerial,
      })).toBe(false);
    }

    const branchedEvents = feedAudioProtocolEvents();
    branchedEvents.splice(4, 0,
      {
        sessionId: FEED_AUDIO_SESSION,
        method: 'WebAudio.audioNodeCreated',
        params: { node: { nodeId: '00-unrelated', contextId: 'context-1', nodeType: 'Gain' } },
      },
      {
        sessionId: FEED_AUDIO_SESSION,
        method: 'WebAudio.audioNodeCreated',
        params: { node: { nodeId: '01-unrelated', contextId: 'context-1', nodeType: 'Gain' } },
      },
      {
        sessionId: FEED_AUDIO_SESSION,
        method: 'WebAudio.nodesConnected',
        params: { contextId: 'context-1', sourceId: '00-unrelated', destinationId: '01-unrelated' },
      });
    const branchedGraph = projectedFeedAudioGraph(branchedEvents);
    const route = compendiumFeedWebAudioRouteNodeIds(branchedGraph);
    expect(route).toEqual(['oscillator-1', 'gain-1', 'bus-1', 'destination-1']);
    const routeIntermediateId = route[1];
    const routeTargets = branchedGraph.nodes.filter((node) => node.nodeId === routeIntermediateId);
    expect(routeTargets).toHaveLength(1);
    routeTargets[0]!.contextId = 'cross-context-negative-control';
    expect(assessGraph(branchedGraph)).toEqual({
      ok: false,
      reasons: ['live AudioDestination route'],
    });

    const wrongSession = feedAudioProtocolEvents();
    wrongSession[0] = { ...wrongSession[0]!, sessionId: 'foreign-session' };
    expect(assessGraph(projectedFeedAudioGraph(wrongSession))).toEqual({
      ok: false,
      reasons: ['live AudioDestination route'],
    });

    const duplicateSource = feedAudioProtocolEvents();
    duplicateSource.splice(1, 0, {
      sessionId: FEED_AUDIO_SESSION,
      method: 'WebAudio.audioNodeCreated',
      params: { node: {
        nodeId: 'oscillator-2', contextId: 'context-1', nodeType: 'Oscillator',
      } },
    });
    const duplicateSourceGraph = projectedFeedAudioGraph(duplicateSource);
    expect(assessGraph(duplicateSourceGraph)).toEqual({
      ok: false,
      reasons: ['live AudioDestination route'],
    });
    expect(compendiumFeedWebAudioEndpointFailureIsInstrument({
      audioCreates: 1,
      audioStarts: baseline.audioStarts,
      audioGraph: duplicateSourceGraph,
      globalRevision: baseline.after.globalRevision,
      toastSerial: baseline.settled.toastSerial,
    })).toBe(true);
    expect(compendiumFeedWebAudioEndpointFailureIsInstrument({
      audioCreates: 2,
      audioStarts: [...baseline.audioStarts, ...baseline.audioStarts],
      audioGraph: duplicateSourceGraph,
      globalRevision: baseline.after.globalRevision,
      toastSerial: baseline.settled.toastSerial,
    })).toBe(false);

    const duplicateDestination = feedAudioProtocolEvents();
    duplicateDestination.splice(4, 0, {
      sessionId: FEED_AUDIO_SESSION,
      method: 'WebAudio.audioNodeCreated',
      params: { node: {
        nodeId: 'destination-2', contextId: 'context-1', nodeType: 'AudioDestination',
      } },
    });
    expect(assessGraph(projectedFeedAudioGraph(duplicateDestination))).toEqual({
      ok: false,
      reasons: ['live AudioDestination route'],
    });

    expect(assessGraph(projectedFeedAudioGraph(feedAudioProtocolEvents(), 1))).toEqual({
      ok: false,
      reasons: ['live AudioDestination route'],
    });

    const destroyedSource = feedAudioProtocolEvents();
    destroyedSource.push({
      sessionId: FEED_AUDIO_SESSION,
      method: 'WebAudio.audioNodeWillBeDestroyed',
      params: { nodeId: 'oscillator-1' },
    });
    expect(assessGraph(projectedFeedAudioGraph(destroyedSource))).toEqual({
      ok: false,
      reasons: ['live AudioDestination route'],
    });

    const disconnectedRoute = feedAudioProtocolEvents();
    disconnectedRoute.push({
      sessionId: FEED_AUDIO_SESSION,
      method: 'WebAudio.nodesDisconnected',
      params: {
        contextId: 'context-1',
        sourceId: 'bus-1',
        destinationId: 'destination-1',
      },
    });
    expect(assessGraph(projectedFeedAudioGraph(disconnectedRoute))).toEqual({
      ok: false,
      reasons: ['live AudioDestination route'],
    });

    expect(assessGraph(good)).toEqual({ ok: true, reasons: [] });
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
    const destinationEdges = routeStopsAtBus.audioGraph.edges.filter((edge) => (
      edge.destinationId === routeStopsAtBus.audioGraph.destinationNodeId
    ));
    expect(destinationEdges).toHaveLength(1);
    routeStopsAtBus.audioGraph.edges = routeStopsAtBus.audioGraph.edges.filter((edge) => (
      edge !== destinationEdges[0]
    ));
    expect(routeStopsAtBus.audioGraph.edges).toHaveLength(good.audioGraph.edges.length - 1);
    expect(assessCompendiumFeedCommittedOutcome(routeStopsAtBus)).toEqual({
      ok: false,
      reasons: ['one post-settlement acknowledgement'],
    });

    const crossContextIntermediate = structuredClone(good);
    const crossContextRoute = compendiumFeedWebAudioRouteNodeIds(
      crossContextIntermediate.audioGraph,
    );
    expect(crossContextRoute).toEqual([
      'oscillator-1', 'gain-1', 'bus-1', 'destination-1',
    ]);
    const intermediateTargets = crossContextIntermediate.audioGraph.nodes.filter(
      (node) => node.nodeId === crossContextRoute[1],
    );
    expect(intermediateTargets).toHaveLength(1);
    intermediateTargets[0]!.contextId = 'context-cross-owner';
    expect(assessCompendiumFeedCommittedOutcome(crossContextIntermediate)).toEqual({
      ok: false,
      reasons: ['one post-settlement acknowledgement'],
    });

    const falseDestination = structuredClone(good);
    const destinationTargets = falseDestination.audioGraph.nodes.filter((node) => (
      node.nodeId === falseDestination.audioGraph.destinationNodeId
    ));
    expect(destinationTargets).toHaveLength(1);
    destinationTargets[0]!.nodeType = 'Gain';
    expect(assessCompendiumFeedCommittedOutcome(falseDestination)).toEqual({
      ok: false,
      reasons: ['one post-settlement acknowledgement'],
    });

    const graphShapeMutation = structuredClone(good);
    const sourceEdges = graphShapeMutation.audioGraph.edges.filter((edge) => (
      edge.sourceId === graphShapeMutation.audioGraph.sourceNodeId
    ));
    expect(sourceEdges).toHaveLength(1);
    Object.assign(sourceEdges[0]!, { connected: true });
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
      'const twoDocumentAssessment = committedAssessment.ok === true',
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
    expect(feedAudioPreferenceSetupIsComplete(setupOwner)).toBe(true);
    expect(feedReleaseSilenceWiringIsSemantic(source)).toBe(true);
    expect(feedReleaseSilenceWiringIsSemantic(glassSource)).toBe(true);
    expect(feedReleaseSilenceWiringIsSemantic(
      source.replace(FEED_RELEASE_SILENCE_PREDICATE_SOURCE,
        FEED_RELEASE_SILENCE_PREDICATE_SOURCE.replace('/i.test', '/.test')),
    )).toBe(false);
    expect(feedReleaseSilenceWiringIsSemantic(
      glassSource.replace(FEED_RELEASE_SILENCE_PREDICATE_SOURCE,
        FEED_RELEASE_SILENCE_PREDICATE_SOURCE.replace('/i.test', '/.test')),
    )).toBe(false);
    expect(feedAudioPreferenceSetupIsComplete(
      setupOwner.replace(
        "arc5FeedClick('#setvoice', 'Arc 5 Feed Creature voices On')",
        "arc5FeedClick('#setsnd', 'Arc 5 Feed Sound On')",
      ),
    )).toBe(false);
    expect(feedAudioPreferenceSetupIsComplete(
      setupOwner.replace(
        'audioPreferencesEnabled.sndOn !== true || audioPreferencesEnabled.voiceOn !== true',
        'audioPreferencesEnabled.sndOn !== true',
      ),
    )).toBe(false);
    expect(feedAudioPreferenceSetupIsComplete(setupOwner)).toBe(true);
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
    expect(source).toContain(
      'projectCompendiumFeedWebAudioGraph({ events, sessionId, enableMark, sourceMark })',
    );
    expect(source).toContain(
      'Arc 5 Feed WebAudio instrument could not bind one exact raw CDP Oscillator',
    );
    expect(source).toContain(
      'audioEvidence = await winnerDriver.evaluate(`({creates:window.__cfFeedAudioCreates??null,',
    );
    expect(source).toContain('compendiumFeedWebAudioEndpointFailureIsInstrument({');
    expect(source).toContain(
      'const crossContextAudioRoute = compendiumFeedWebAudioRouteNodeIds(',
    );
    expect(source).toContain('disconnectedAudioTargets.length === 1');
    expect(source).toContain('disconnectedAudioChangeCount === 1');
    expect(source).toContain('falseDestinationAudioTargets.length === 1');
    expect(source).toContain('falseDestinationAudioChangeCount === 1');
    expect(source).toContain('crossContextAudioTargets.length === 1');
    expect(source).toContain('crossContextAudioChangeCount === 1');
    expect(source).toContain('const audioEvidenceDeadline = Date.now() + 3_000;');
    expect(source).not.toContain("'Arc 5 Feed successful oscillator start'");
    expect(source).not.toContain("node.nodeType === 'OscillatorNode'");
    expect(source).not.toContain("node.nodeType === 'AudioDestinationNode'");
    expect(source).toContain(
      'const twoDocumentAssessment = committedAssessment.ok === true',
    );
    expect(source).toContain(
      'const twoDocumentControl = twoDocumentAssessment.ok === true',
    );
    expect(source).toContain(
      'const committedControls = committedAssessment.ok === true ? [',
    );
    expect(source).toContain('audioEvidence.starts[0]?.startReturned === true');
    expect(source).not.toContain("panelOpen==='sets'");
    expect(source).not.toContain('#settingspanel [data-pnx]');
    expect(source).not.toContain('heldRawMetadataProjection');
    expect(source).not.toContain('__smokeFeed');
  });
});
