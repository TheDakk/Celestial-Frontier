import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import {
  assessCompendiumFeedChoiceActivation,
  assessCompendiumFeedAudioAcknowledgement,
  assessCompendiumFeedCommittedOutcome,
  assessCompendiumFeedPendingWindow,
  assessCompendiumFeedPreview,
  assessCompendiumFeedTwoDocumentStaleOutcome,
  buildCompendiumFeedChoiceSettlementExpression,
  compendiumFeedDetailPresentationPasses,
  compendiumFeedSuccessorAvailability,
  compendiumFeedWebAudioEndpointFailureIsInstrument,
  compendiumFeedWebAudioRouteNodeIds,
  projectCompendiumFeedWebAudioGraph,
  selectArc5FeedFixtureBurnVerb,
} from '../tools/slicesmoke-contract.mjs';
import type {
  CompendiumFeedChoiceActivationWitness,
  CompendiumFeedChoiceExpectation,
  CompendiumFeedChoiceReceiptWitness,
  CompendiumFeedPreviewExpectation,
  CompendiumFeedPreviewObservation,
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
  '/refused, stale, converging, replayed, hidden, route-lost, counterpart-lost, and older results remain silent/i.test(mealText)';
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
  postFeedAvailability: 'ready',
});
const readyFeedPresentation = Object.freeze({
  feedState: 'ready',
  summaryCount: 1,
  confirmPresent: true,
  confirmDisabled: true,
  radioCount: 2,
  allRadiosDisabled: false,
  backEnabled: true,
  closeEnabled: true,
});

const choiceDocument = Object.freeze({
  token: 'feed-document', generation: 7, logicalId: fixture.logicalId,
  surfaceKey: 'feed-surface-key', contextKey: 'feed-context-key',
});

function feedChoiceWitness(
  kind: 'creature' | 'flora',
  expectedPriorId: string | null,
): {
  expected: CompendiumFeedChoiceExpectation;
  observation: CompendiumFeedChoiceActivationWitness;
} {
  const expectedId = kind === 'creature' ? fixture.creatureId : fixture.foodLotId;
  const radioId = kind === 'creature' ? 'arc5-feed-creature-0' : 'arc5-feed-flora-0';
  const radioNodeToken = `${radioId}:node-1`;
  const labelNodeToken = `${radioId}:label-1`;
  const choiceFields = {
    radioChoice: kind,
    radioCreatureId: kind === 'creature' ? expectedId : null,
    radioFoodLotId: kind === 'flora' ? expectedId : null,
  };
  const controller = {
    attachedMountCount: 1, delegatedListenerCount: 2, pendingWork: 0,
    convergenceLatched: false, feedState: 'ready',
    surfaceKey: choiceDocument.surfaceKey, contextKey: choiceDocument.contextKey,
  };
  const serials = { pointerdown: 1, click: 2, input: 3, change: 4 } as const;
  const event = (
    type: 'pointerdown' | 'click' | 'input' | 'change',
  ): CompendiumFeedChoiceReceiptWitness => {
    const common = {
      trusted: true, radioId, radioNodeToken, choice: kind, choiceId: expectedId,
      document: { ...choiceDocument }, serial: serials[type],
    };
    if (type === 'pointerdown') {
      return { ...common, type, x: 244, y: 424, pointerType: 'mouse', button: 0 };
    }
    if (type === 'click') return { ...common, type, x: 244, y: 424 };
    return { ...common, type };
  };
  return {
    expected: {
      kind, expectedId, expectedPriorId,
      documentToken: choiceDocument.token,
      generation: choiceDocument.generation,
      logicalId: choiceDocument.logicalId,
      surfaceKey: choiceDocument.surfaceKey,
      contextKey: choiceDocument.contextKey,
    },
    observation: {
      kind, expectedId, expectedPriorId,
      document: { ...choiceDocument },
      prepared: {
        selectorCount: 1, radioIdMatchCount: 1, labelOwnerCount: 1, labelFor: radioId,
        labelConnected: true, labelContainsRadio: true,
        labelWidth: 240, labelHeight: 44, labelVisible: true,
        labelNodeToken, radioId, radioNodeToken,
        radioConnected: true, radioDisabled: false, radioChecked: false,
        ...choiceFields, x: 240, y: 420, labelHitOwner: true, radioHitOwner: true,
        controller: { ...controller },
      },
      dispatch: {
        kind: 'cdp-mouse', button: 'left', clickCount: 1,
        x: 244, y: 424, targetX: 244, targetY: 424,
        document: { ...choiceDocument }, selectorCount: 1, radioIdMatchCount: 1,
        labelOwnerCount: 1,
        labelFor: radioId, labelConnected: true, labelContainsRadio: true, labelNodeToken,
        radioId, radioNodeToken, radioConnected: true,
        radioDisabled: false, radioChecked: false,
        labelWidth: 240, labelHeight: 44, labelVisible: true,
        labelHitOwner: true, radioHitOwner: true,
        ...choiceFields,
      },
      receipt: {
        pointerdowns: [event('pointerdown')], clicks: [event('click')],
        inputs: [event('input')], changes: [event('change')],
      },
      settled: {
        selectorCount: 1, radioIdMatchCount: 1, labelOwnerCount: 1,
        labelFor: radioId, labelConnected: true, labelContainsRadio: true,
        labelNodeToken: `${radioId}:label-2`, radioId,
        radioNodeToken: kind === 'creature' ? radioNodeToken : `${radioId}:node-2`,
        radioConnected: true,
        radioDisabled: false, radioChecked: true, ...choiceFields,
        ui: {
          document: { ...choiceDocument }, controller: { ...controller },
          selectedCreatureId: kind === 'creature' ? expectedId : expectedPriorId,
          selectedFoodLotId: kind === 'flora' ? expectedId : expectedPriorId,
        },
      },
    },
  };
}

function feedPreviewWitness(holdPhase: 'idle' | 'released' = 'released'): {
  expected: CompendiumFeedPreviewExpectation;
  observation: CompendiumFeedPreviewObservation;
} {
  const authority = {
    revision: 9,
    sourceDigest: digest('3'),
    targetDigest: digest('4'),
  };
  const actionCoordinator = {
    inFlight: false,
    owner: { busy: false, operation: null },
    hold: {
      phase: holdPhase,
      operation: holdPhase === 'released' ? 'arc4.capture.sample' : null,
      sequence: holdPhase === 'released' ? 4 : 0,
    },
  };
  const baseline = {
    actionCoordinator: structuredClone(actionCoordinator),
    lastOutcome: null,
    result: null,
  };
  return {
    expected: {
      documentToken: choiceDocument.token,
      generation: choiceDocument.generation,
      logicalId: choiceDocument.logicalId,
      surfaceKey: choiceDocument.surfaceKey,
      contextKey: choiceDocument.contextKey,
      authority: { ...authority },
      creatureId: fixture.creatureId,
      foodLotId: fixture.foodLotId,
      fedBefore: fixture.fedBefore,
      fedAfter: fixture.fedAfter,
      foodQuantityBefore: fixture.foodQuantityBefore,
      foodQuantityAfter: fixture.foodQuantityAfter,
      baseline: structuredClone(baseline),
    },
    observation: {
      document: { ...choiceDocument },
      authority: { ...authority },
      controller: {
        attachedMountCount: 1,
        delegatedListenerCount: 2,
        pendingWork: 0,
        convergenceLatched: false,
        feedState: 'ready',
        surfaceKey: choiceDocument.surfaceKey,
        contextKey: choiceDocument.contextKey,
        selectedCreatureId: fixture.creatureId,
        selectedFoodLotId: fixture.foodLotId,
      },
      dom: {
        selectedCreatureId: fixture.creatureId,
        selectedFoodLotId: fixture.foodLotId,
        summaryCount: 1,
        summary: `Pertar: Meals ${fixture.fedBefore} → ${fixture.fedAfter}. Use 1 Leaf: Quantity ${fixture.foodQuantityBefore} → ${fixture.foodQuantityAfter}.`,
        confirmPresent: true,
        confirmDisabled: false,
      },
      actionCoordinator: structuredClone(actionCoordinator),
      lastOutcome: baseline.lastOutcome,
      result: baseline.result,
    },
  };
}

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
  const priorNotices = [
    { id: 3, tt: 'Charted <world>', ms: 'Keep exact & escaped copy.', t: 300, read: true },
    { id: 2, tt: 'A prior unread notice', ms: 'Retain its unread state.', t: 200, read: false },
  ];
  const mealMessage = `Meals ${fixture.fedBefore} → ${fixture.fedAfter}. Used 1 flora; ${fixture.foodQuantityAfter} remain in that lot.`;
  const savedNotices = [{ id: 4, tt: 'Meal complete.', ms: mealMessage, t: 2_001, read: false }, ...priorNotices];
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
    unrelatedExceptNotificationsFingerprint: digest('b'),
    notificationHistory: { legacy: priorNotices, player: structuredClone(priorNotices) },
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
    notificationHistory: structuredClone(before.notificationHistory),
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
      toastText: `Meal complete.${mealMessage}`,
      notificationToast: { title: 'Meal complete.', message: mealMessage, visible: true, serial: 6, observedAt: 2_002 },
    },
    audioCreates: 1,
    audioStarts: [{
      startReturned: true, sourceConnected: true, contextState: 'running',
      pendingWork: 0, lastOutcome: 'committed:41', toastSerial: 6,
    }],
    audioGraph: projectedFeedAudioGraph(),
    reopened: {
      ...readyFeedPresentation,
      logicalId: fixture.logicalId,
      creatureId: fixture.creatureId,
      fed: fixture.fedAfter,
      foodLotId: fixture.foodLotId,
      foodQuantity: fixture.foodQuantityAfter,
      pendingWork: 0,
    },
    reloaded: {
      ...readyFeedPresentation,
      ...after,
      notificationHistory: { legacy: savedNotices, player: structuredClone(savedNotices) },
      unrelatedFingerprint: digest('f'),
      codecAt: 2_100,
      segmentCodecAt: 2_100,
      durableFingerprint: after.durableFingerprint,
      globalRevision: after.globalRevision + 1,
      ownershipRevision: after.ownershipRevision,
      logicalId: fixture.logicalId,
      creatureId: fixture.creatureId,
      fed: fixture.fedAfter,
      foodLotId: fixture.foodLotId,
      foodQuantity: fixture.foodQuantityAfter,
      pendingWork: 0,
      runtime: { revision: 42, sessionSeed: 68, sessionOrdinal: 4, sessionDraws },
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
  it('derives the exact post-Feed availability from the eligible predecessor', () => {
    const availability = (
      readyCompanionCountBefore: number,
      selectedCompanionReadyAfter: boolean,
      floraLotCountBefore: number,
      selectedFloraLotPresentAfter: boolean,
    ) => compendiumFeedSuccessorAvailability({
      readyCompanionCountBefore,
      selectedCompanionReadyAfter,
      floraLotCountBefore,
      selectedFloraLotPresentAfter,
    });

    expect(availability(1, true, 1, true)).toBe('ready');
    expect(availability(2, false, 1, true)).toBe('ready');
    expect(availability(1, false, 2, false)).toBe('no-eligible-companion');
    expect(availability(1, true, 1, false)).toBe('no-flora');
    expect(() => availability(0, true, 1, true)).toThrow(TypeError);
    expect(() => compendiumFeedSuccessorAvailability({
      readyCompanionCountBefore: 1,
      selectedCompanionReadyAfter: true,
      floraLotCountBefore: 1,
      selectedFloraLotPresentAfter: null as unknown as boolean,
    })).toThrow(TypeError);

    const unavailablePresentation = {
      feedState: 'no-flora',
      summaryCount: 0,
      confirmPresent: false,
      confirmDisabled: null,
      radioCount: 1,
      allRadiosDisabled: true,
      backEnabled: true,
      closeEnabled: true,
    };
    expect(compendiumFeedDetailPresentationPasses(
      readyFeedPresentation, 'ready',
    )).toBe(true);
    expect(compendiumFeedDetailPresentationPasses(
      unavailablePresentation, 'no-flora',
    )).toBe(true);
    for (const [field, value] of [
      ['summaryCount', 1], ['confirmPresent', true], ['confirmDisabled', false],
      ['radioCount', 0], ['allRadiosDisabled', false],
      ['backEnabled', false], ['closeEnabled', false],
    ] as const) {
      expect(compendiumFeedDetailPresentationPasses(
        { ...unavailablePresentation, [field]: value }, 'no-flora',
      )).toBe(false);
    }
    expect(() => compendiumFeedDetailPresentationPasses(
      unavailablePresentation, 'protected' as 'ready',
    )).toThrow(TypeError);
  });

  it('replays the immutable 134f Feed reopen red as a phase-blind harness finding', () => {
    const reportGzip = readFileSync(fileURLToPath(new URL(
      '../../../audits/ARC5_SLICE_PR35_FEED_REOPEN_CONVERGENCE_RED_20260830_134F62E.json.gz',
      import.meta.url,
    )));
    const logGzip = readFileSync(fileURLToPath(new URL(
      '../../../audits/ARC5_SLICE_PR35_FEED_REOPEN_CONVERGENCE_RED_20260830_134F62E.log.gz',
      import.meta.url,
    )));
    const reportRaw = gunzipSync(reportGzip);
    const logRaw = gunzipSync(logGzip);
    const bytesHash = (value: Uint8Array): string => createHash('sha256')
      .update(value).digest('hex');

    expect([reportGzip.byteLength, bytesHash(reportGzip)]).toEqual([
      2_915, '2d1a30993c2dd660fbbe10bc0126a01c64dc063023df9a60d2b16c383ffb96c7',
    ]);
    expect([reportRaw.byteLength, bytesHash(reportRaw)]).toEqual([
      12_550, '9095773c6bfa6919af38e55f8c7eb6cbab18ada30ebd86baadfdd3a883c2e9c8',
    ]);
    expect([logGzip.byteLength, bytesHash(logGzip)]).toEqual([
      2_699, '3ef925a0ed6214fda496bdabbb69359f037d3cebafaa7831e9a25d38de8b1f00',
    ]);
    expect([logRaw.byteLength, bytesHash(logRaw)]).toEqual([
      7_012, 'eeac0afd8070550ebec1384b7b752cb4c8f746054724bc4ad6330589fd25f50c',
    ]);

    const report = JSON.parse(reportRaw.toString('utf8')) as any;
    expect({
      schema: report.schema,
      status: report.status,
      terminal: report.terminal,
      runId: report.run?.id,
      source: report.source?.commit,
      sourceEnd: report.sourceEnd?.commit,
      sourceChanged: report.sourceChange?.detected,
      browser: report.browser?.version,
      retries: report.retryPolicy?.automaticRetries,
      findings: report.summary?.findingCount,
      scopes: report.summary?.scopeCount,
    }).toEqual({
      schema: 'cf-v2-slice-smoke-ci/v1',
      status: 'fail',
      terminal: true,
      runId: '20260830-pr35-quarantine-134f62e-slice-certification',
      source: '134f62e08b8a7180f798394e08a404ed935e2782',
      sourceEnd: '134f62e08b8a7180f798394e08a404ed935e2782',
      sourceChanged: false,
      browser: 'Microsoft Edge 152.0.4191.53',
      retries: 0,
      findings: 1,
      scopes: 1,
    });
    expect(report.findings).toHaveLength(1);
    expect(report.findings[0]?.scope).toBe('harness');
    const message = String(report.findings[0]?.message ?? '');
    const lastMarker = '(last ';
    const lastStart = message.indexOf(lastMarker);
    expect(lastStart).toBeGreaterThan(0);
    expect(message.endsWith(')')).toBe(true);
    const terminal = JSON.parse(message.slice(lastStart + lastMarker.length, -1));

    expect({
      feedState: terminal.feedState,
      revision: terminal.authority?.revision,
      generation: terminal.document?.generation,
      pendingWork: terminal.controller?.pendingWork,
      convergenceLatched: terminal.controller?.convergenceLatched,
      actionBusy: terminal.actionCoordinator?.owner?.busy,
      lastOutcome: terminal.lastOutcome,
      result: terminal.result,
      summaryCount: terminal.summaryCount,
      confirmPresent: terminal.confirmPresent,
      confirmDisabled: terminal.confirmDisabled,
      radioCount: terminal.radioCount,
      allRadiosDisabled: terminal.allRadiosDisabled,
      backEnabled: terminal.backEnabled,
      closeEnabled: terminal.closeEnabled,
    }).toEqual({
      feedState: 'no-flora',
      revision: 17,
      generation: 4,
      pendingWork: 0,
      convergenceLatched: false,
      actionBusy: false,
      lastOutcome: 'committed:128',
      result: {
        creatureId: 'creature-v1:0401b128fd981bb987e2f344bb44ece186cf905446062bbfdac65d433430400f',
        foodLotId: 'specimen-v1:92a15baf8a0175ab2f6960d43f5abdd555968e881fcd6afb562b4726e08f99d0',
        fedBefore: 0,
        fedAfter: 1,
        foodQuantityBefore: 1,
        foodQuantityAfter: 0,
        lotTombstoned: true,
        receiptOrdinal: 20,
        revision: 128,
        ownershipRevision: 17,
      },
      summaryCount: 0,
      confirmPresent: false,
      confirmDisabled: null,
      radioCount: 1,
      allRadiosDisabled: true,
      backEnabled: true,
      closeEnabled: true,
    });
    expect(terminal.feedState === 'ready').toBe(false);
    expect(compendiumFeedSuccessorAvailability({
      readyCompanionCountBefore: 1,
      selectedCompanionReadyAfter: true,
      floraLotCountBefore: 1,
      selectedFloraLotPresentAfter: false,
    })).toBe(terminal.feedState);
  });

  it('compiles the exact Feed settlement expression and rejects closure drift', () => {
    const expression = buildCompendiumFeedChoiceSettlementExpression(
      {
        kind: 'creature', expectedId: fixture.creatureId, expectedPriorId: null,
        document: choiceDocument, prepared: {}, dispatch: {},
      },
      `#codexpanel label[data-arc5-feed-creature-label="${fixture.creatureId}"]`,
      '({document:null,controller:null,feedState:null,selectedCreatureId:null,selectedFoodLotId:null})',
    );
    const compile = (candidate: string): void => {
      Function(`"use strict"; return (${candidate});`);
    };
    const missingClosure = expression.replace(/\}\)\(\)$/u, ')()');
    const surplusClosure = expression.replace(/\)\(\)$/u, '})()');

    expect(expression.endsWith('}}}})()')).toBe(true);
    expect(() => compile(expression)).not.toThrow();
    expect(() => compile(missingClosure)).toThrow(SyntaxError);
    expect(() => compile(surplusClosure)).toThrow(SyntaxError);
  });

  it('binds each native Feed choice to one current nested radio and preserves the first choice', () => {
    const creature = feedChoiceWitness('creature', null);
    expect(assessCompendiumFeedChoiceActivation(
      creature.observation, creature.expected,
    )).toEqual({ ok: true, reasons: [] });
    const flora = feedChoiceWitness('flora', fixture.creatureId);
    expect(assessCompendiumFeedChoiceActivation(
      flora.observation, flora.expected,
    )).toEqual({ ok: true, reasons: [] });

    const expectOnly = (
      mutate: (candidate: any) => void,
      reason: string,
    ) => {
      const candidate = structuredClone(flora.observation);
      mutate(candidate);
      expect(assessCompendiumFeedChoiceActivation(candidate, flora.expected))
        .toEqual({ ok: false, reasons: [reason] });
    };

    expectOnly((candidate) => { candidate.kind = 'creature'; },
      'exact Feed choice expectation');
    expectOnly((candidate) => { candidate.expectedId = 'foreign-lot'; },
      'exact Feed choice expectation');
    expectOnly((candidate) => { candidate.expectedPriorId = null; },
      'exact Feed choice expectation');

    for (const field of ['token', 'logicalId', 'surfaceKey', 'contextKey'] as const) {
      expectOnly((candidate) => { candidate.document[field] = `${field}-stale`; },
        'exact current Feed document');
    }
    expectOnly((candidate) => { candidate.document.generation += 1; },
      'exact current Feed document');

    for (const [field, value] of [
      ['attachedMountCount', 0], ['delegatedListenerCount', 0], ['pendingWork', 1],
      ['convergenceLatched', true], ['feedState', 'protected'],
      ['surfaceKey', 'stale-surface'], ['contextKey', 'stale-context'],
    ] as const) {
      expectOnly((candidate) => { candidate.prepared.controller[field] = value; },
        'current Feed controller');
    }

    expectOnly((candidate) => { candidate.prepared.selectorCount = 2; },
      'unique label-radio ownership');
    expectOnly((candidate) => { candidate.prepared.radioIdMatchCount = 2; },
      'unique label-radio ownership');
    expectOnly((candidate) => { candidate.prepared.labelOwnerCount = 2; },
      'unique label-radio ownership');
    expectOnly((candidate) => { candidate.prepared.labelConnected = false; },
      'unique label-radio ownership');
    expectOnly((candidate) => { candidate.prepared.labelContainsRadio = false; },
      'unique label-radio ownership');
    expectOnly((candidate) => { candidate.prepared.labelFor = 'foreign-radio'; },
      'unique label-radio ownership');
    expectOnly((candidate) => {
      candidate.prepared.labelNodeToken = '';
    },
      'unique label-radio ownership');
    expectOnly((candidate) => { candidate.prepared.radioFoodLotId = 'foreign-lot'; },
      'unique label-radio ownership');
    expectOnly((candidate) => { candidate.prepared.radioChoice = 'creature'; },
      'unique label-radio ownership');

    expectOnly((candidate) => { candidate.prepared.radioConnected = false; },
      'ready unchecked Feed radio');
    expectOnly((candidate) => { candidate.prepared.radioDisabled = true; },
      'ready unchecked Feed radio');
    expectOnly((candidate) => { candidate.prepared.radioChecked = true; },
      'ready unchecked Feed radio');
    expectOnly((candidate) => { candidate.prepared.labelHeight = 43.999; },
      '44px current Feed hit target');
    expectOnly((candidate) => { candidate.prepared.labelWidth = 43.999; },
      '44px current Feed hit target');
    expectOnly((candidate) => { candidate.prepared.labelVisible = false; },
      '44px current Feed hit target');
    expectOnly((candidate) => { candidate.prepared.labelHitOwner = false; },
      '44px current Feed hit target');
    expectOnly((candidate) => { candidate.prepared.radioHitOwner = false; },
      '44px current Feed hit target');
    expectOnly((candidate) => { candidate.dispatch.radioNodeToken = 'replacement-node'; },
      'dispatch-time Feed radio identity');
    expectOnly((candidate) => { candidate.dispatch.radioIdMatchCount = 2; },
      'dispatch-time Feed radio identity');
    expectOnly((candidate) => { candidate.dispatch.labelOwnerCount = 2; },
      'dispatch-time Feed radio identity');
    expectOnly((candidate) => { candidate.dispatch.labelContainsRadio = false; },
      'dispatch-time Feed radio identity');
    expectOnly((candidate) => { candidate.dispatch.radioConnected = false; },
      'dispatch-time Feed radio identity');
    expectOnly((candidate) => { candidate.dispatch.radioDisabled = true; },
      'dispatch-time Feed radio identity');
    expectOnly((candidate) => { candidate.dispatch.radioFoodLotId = 'foreign-lot'; },
      'dispatch-time Feed radio identity');
    expectOnly((candidate) => { candidate.dispatch.document.contextKey = 'stale-context'; },
      'dispatch-time Feed radio identity');
    expectOnly((candidate) => { candidate.dispatch.labelWidth = 43.999; },
      'dispatch-time Feed radio identity');
    expectOnly((candidate) => { candidate.dispatch.labelHeight = 43.999; },
      'dispatch-time Feed radio identity');
    expectOnly((candidate) => { candidate.dispatch.labelVisible = false; },
      'dispatch-time Feed radio identity');
    expectOnly((candidate) => { candidate.dispatch.labelHitOwner = false; },
      'dispatch-time Feed radio identity');
    expectOnly((candidate) => { candidate.dispatch.radioHitOwner = false; },
      'dispatch-time Feed radio identity');

    expectOnly((candidate) => { candidate.dispatch.kind = 'synthetic-click'; },
      'exact CDP Feed choice dispatch');
    expectOnly((candidate) => { candidate.dispatch.button = 'right'; },
      'exact CDP Feed choice dispatch');
    expectOnly((candidate) => { candidate.dispatch.clickCount = 2; },
      'exact CDP Feed choice dispatch');
    expectOnly((candidate) => { candidate.dispatch.targetX = Number.NaN; },
      'exact CDP Feed choice dispatch');

    expect(flora.observation.dispatch.x).not.toBe(flora.observation.prepared.x);
    expect(flora.observation.receipt.inputs[0]?.x).toBeUndefined();
    expect(flora.observation.receipt.changes[0]?.y).toBeUndefined();

    expectOnly((candidate) => { candidate.receipt.pointerdowns = []; },
      'trusted current Feed pointer receipt');
    expectOnly((candidate) => { candidate.receipt.pointerdowns[0].trusted = false; },
      'trusted current Feed pointer receipt');
    expectOnly((candidate) => { candidate.receipt.pointerdowns.push(
      structuredClone(candidate.receipt.pointerdowns[0]),
    ); }, 'trusted current Feed pointer receipt');
    expectOnly((candidate) => { candidate.receipt.clicks[0].document.token = 'stale-document'; },
      'trusted current Feed pointer receipt');
    expectOnly((candidate) => { candidate.receipt.clicks[0].choiceId = 'foreign-lot'; },
      'trusted current Feed pointer receipt');
    expectOnly((candidate) => { candidate.receipt.pointerdowns[0].serial = 2; },
      'trusted current Feed pointer receipt');
    expectOnly((candidate) => { candidate.receipt.pointerdowns[0].x = null; },
      'trusted current Feed pointer receipt');
    expectOnly((candidate) => { candidate.receipt.clicks[0].serial = 1; },
      'trusted current Feed pointer receipt');
    expectOnly((candidate) => { candidate.receipt.clicks[0].x += 1; },
      'trusted current Feed pointer receipt');

    expectOnly((candidate) => { candidate.receipt.inputs = []; },
      'exact Feed input receipt');
    expectOnly((candidate) => { candidate.receipt.inputs[0].trusted = false; },
      'exact Feed input receipt');
    expectOnly((candidate) => { candidate.receipt.inputs.push(
      structuredClone(candidate.receipt.inputs[0]),
    ); }, 'exact Feed input receipt');
    expectOnly((candidate) => { candidate.receipt.inputs[0].radioNodeToken = 'stale-node'; },
      'exact Feed input receipt');
    expectOnly((candidate) => { candidate.receipt.inputs[0].serial = 4; },
      'exact Feed input receipt');
    expectOnly((candidate) => { candidate.receipt.inputs[0].x = null; },
      'exact Feed input receipt');
    expectOnly((candidate) => { candidate.receipt.inputs[0].pointerType = 'mouse'; },
      'exact Feed input receipt');

    expectOnly((candidate) => { candidate.receipt.changes = []; },
      'exact Feed change receipt');
    expectOnly((candidate) => { candidate.receipt.changes[0].trusted = false; },
      'exact Feed change receipt');
    expectOnly((candidate) => { candidate.receipt.changes.push(
      structuredClone(candidate.receipt.changes[0]),
    ); }, 'exact Feed change receipt');
    expectOnly((candidate) => { candidate.receipt.changes[0].document.generation += 1; },
      'exact Feed change receipt');
    expectOnly((candidate) => { candidate.receipt.changes[0].serial = 3; },
      'exact Feed change receipt');
    expectOnly((candidate) => { candidate.receipt.changes[0].y = 424; },
      'exact Feed change receipt');
    expectOnly((candidate) => { candidate.receipt.changes[0].button = null; },
      'exact Feed change receipt');

    expectOnly((candidate) => { candidate.settled.selectorCount = 2; },
      'settled current Feed choice');
    expectOnly((candidate) => { candidate.settled.radioIdMatchCount = 2; },
      'settled current Feed choice');
    expectOnly((candidate) => { candidate.settled.labelOwnerCount = 2; },
      'settled current Feed choice');
    expectOnly((candidate) => { candidate.settled.labelFor = 'foreign-radio'; },
      'settled current Feed choice');
    expectOnly((candidate) => { candidate.settled.labelConnected = false; },
      'settled current Feed choice');
    expectOnly((candidate) => { candidate.settled.labelContainsRadio = false; },
      'settled current Feed choice');
    expectOnly((candidate) => { candidate.settled.labelNodeToken = ''; },
      'settled current Feed choice');
    expectOnly((candidate) => { candidate.settled.radioChecked = false; },
      'settled current Feed choice');
    expectOnly((candidate) => { candidate.settled.radioNodeToken = ''; },
      'settled current Feed choice');
    expectOnly((candidate) => { candidate.settled.radioConnected = false; },
      'settled current Feed choice');
    expectOnly((candidate) => { candidate.settled.radioFoodLotId = 'foreign-lot'; },
      'settled current Feed choice');
    expectOnly((candidate) => { candidate.settled.ui.document.surfaceKey = 'stale-surface'; },
      'settled current Feed choice');
    expectOnly((candidate) => { candidate.settled.ui.controller.delegatedListenerCount = 0; },
      'settled current Feed choice');
    expectOnly((candidate) => { candidate.settled.ui.controller.surfaceKey = 'stale-surface'; },
      'settled current Feed choice');
    expectOnly((candidate) => { candidate.settled.ui.selectedFoodLotId = 'foreign-lot'; },
      'settled current Feed choice');
    expectOnly((candidate) => { candidate.settled.ui.selectedCreatureId = null; },
      'preserved prior Feed choice');

    expect(() => assessCompendiumFeedChoiceActivation(flora.observation, {
      ...flora.expected, expectedId: '',
    })).toThrow(/one exact current choice identity/u);
  });

  it('retains one exact pre-action Feed preview and diagnoses every drift in isolation', () => {
    const good = feedPreviewWitness();
    expect(good.observation.actionCoordinator.hold.phase).toBe('released');
    const accepted = assessCompendiumFeedPreview(good.observation, good.expected);
    expect(accepted).toEqual({ ok: true, reasons: [], observation: good.observation });
    expect(accepted.observation).toBe(good.observation);
    const idle = feedPreviewWitness('idle');
    expect(assessCompendiumFeedPreview(idle.observation, idle.expected))
      .toEqual({ ok: true, reasons: [], observation: idle.observation });

    const expectOnly = (
      mutate: (candidate: any) => void,
      reason: string,
    ) => {
      const candidate = structuredClone(good.observation);
      mutate(candidate);
      const assessment = assessCompendiumFeedPreview(candidate, good.expected);
      expect(assessment.ok).toBe(false);
      expect(assessment.reasons).toEqual([reason]);
      expect(assessment.observation).toBe(candidate);
    };

    expectOnly((candidate) => { candidate.document.token = 'stale-document'; },
      'exact Feed preview document token');
    expectOnly((candidate) => { candidate.document.generation += 1; },
      'exact Feed preview generation');
    expectOnly((candidate) => { candidate.document.logicalId = 'stale-logical'; },
      'exact Feed preview logical ID');
    expectOnly((candidate) => { candidate.document.surfaceKey = 'stale-surface'; },
      'exact Feed preview surface key');
    expectOnly((candidate) => { candidate.document.contextKey = 'stale-context'; },
      'exact Feed preview context key');

    expectOnly((candidate) => { candidate.authority.revision += 1; },
      'unchanged Feed preview authority revision');
    expectOnly((candidate) => { candidate.authority.sourceDigest = digest('5'); },
      'unchanged Feed preview source digest');
    expectOnly((candidate) => { candidate.authority.targetDigest = digest('6'); },
      'unchanged Feed preview target digest');

    expectOnly((candidate) => { candidate.controller.attachedMountCount = 0; },
      'attached Feed preview mount');
    expectOnly((candidate) => { candidate.controller.delegatedListenerCount = 0; },
      'installed Feed preview listeners');
    expectOnly((candidate) => { candidate.controller.pendingWork = 1; },
      'idle Feed preview controller');
    expectOnly((candidate) => { candidate.controller.convergenceLatched = true; },
      'unlatched Feed preview convergence');
    expectOnly((candidate) => { candidate.controller.feedState = 'protected'; },
      'ready Feed preview state');
    expectOnly((candidate) => { candidate.controller.surfaceKey = 'stale-surface'; },
      'exact controller Feed surface key');
    expectOnly((candidate) => { candidate.controller.contextKey = 'stale-context'; },
      'exact controller Feed context key');
    expectOnly((candidate) => { candidate.controller.selectedCreatureId = null; },
      'exact controller Feed creature selection');
    expectOnly((candidate) => { candidate.controller.selectedFoodLotId = null; },
      'exact controller Feed flora selection');

    expectOnly((candidate) => { candidate.dom.selectedCreatureId = null; },
      'exact DOM Feed creature selection');
    expectOnly((candidate) => { candidate.dom.selectedFoodLotId = null; },
      'exact DOM Feed flora selection');
    expectOnly((candidate) => { candidate.dom.summaryCount = 0; },
      'unique Feed preview summary owner');
    expectOnly((candidate) => { candidate.dom.summaryCount = 2; },
      'unique Feed preview summary owner');
    expectOnly((candidate) => {
      candidate.dom.summary = candidate.dom.summary.replace('Meals 19 → 20', 'Meals 19 → 19');
    }, 'exact Feed Meals transition');
    expectOnly((candidate) => {
      candidate.dom.summary = candidate.dom.summary.replace('Quantity 2 → 1', 'Quantity 2 → 2');
    }, 'exact Feed Quantity transition');
    expectOnly((candidate) => { candidate.dom.confirmPresent = false; },
      'present Feed preview confirmation');
    expectOnly((candidate) => { candidate.dom.confirmDisabled = true; },
      'enabled Feed preview confirmation');

    expectOnly((candidate) => { candidate.actionCoordinator.inFlight = true; },
      'unchanged quiescent Feed preview in-flight state');
    expectOnly((candidate) => { candidate.actionCoordinator.owner.busy = true; },
      'unchanged quiescent Feed preview owner busy state');
    expectOnly((candidate) => {
      candidate.actionCoordinator.owner.operation = 'arc5.companion-feed';
    }, 'unchanged Feed preview owner operation');
    expectOnly((candidate) => { candidate.actionCoordinator.hold.phase = 'holding'; },
      'unchanged quiescent Feed preview hold phase');
    expectOnly((candidate) => {
      candidate.actionCoordinator.hold.operation = 'arc5.companion-feed';
    }, 'unchanged Feed preview hold operation');
    expectOnly((candidate) => { candidate.actionCoordinator.hold.sequence += 1; },
      'unchanged Feed preview hold sequence');
    for (const phase of ['armed', 'holding', 'release-requested'] as const) {
      const candidate = {
        ...good.observation,
        actionCoordinator: {
          ...good.observation.actionCoordinator,
          hold: { ...good.observation.actionCoordinator.hold, phase },
        },
      };
      const expectation = {
        ...good.expected,
        baseline: {
          ...good.expected.baseline,
          actionCoordinator: {
            ...good.expected.baseline.actionCoordinator,
            hold: { ...good.expected.baseline.actionCoordinator.hold, phase },
          },
        },
      };
      const assessment = assessCompendiumFeedPreview(candidate, expectation);
      expect(assessment.ok).toBe(false);
      expect(assessment.reasons).toEqual([
        'unchanged quiescent Feed preview hold phase',
      ]);
      expect(assessment.observation).toBe(candidate);
    }
    expectOnly((candidate) => { candidate.lastOutcome = 'pending'; },
      'unchanged Feed preview last outcome');
    expectOnly((candidate) => { candidate.result = { fedAfter: fixture.fedAfter }; },
      'unchanged Feed preview result');

    expect(() => assessCompendiumFeedPreview(good.observation, {
      ...good.expected,
      authority: { ...good.expected.authority, sourceDigest: 'not-a-digest' },
    })).toThrow(/one exact pre-choice expectation/u);
  });

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

    const naturallyDisconnectedRoute = feedAudioProtocolEvents();
    naturallyDisconnectedRoute.push({
      sessionId: FEED_AUDIO_SESSION,
      method: 'WebAudio.nodesDisconnected',
      params: {
        contextId: 'context-1',
        sourceId: 'bus-1',
        destinationId: 'destination-1',
      },
    });
    const naturallyDisconnectedGraph = projectedFeedAudioGraph(naturallyDisconnectedRoute);
    expect(compendiumFeedWebAudioRouteNodeIds(naturallyDisconnectedGraph)).toEqual([
      'oscillator-1', 'gain-1', 'bus-1', 'destination-1',
    ]);
    expect(assessGraph(naturallyDisconnectedGraph)).toEqual({ ok: true, reasons: [] });

    const naturallyDestroyedSource = feedAudioProtocolEvents();
    naturallyDestroyedSource.push({
      sessionId: FEED_AUDIO_SESSION,
      method: 'WebAudio.audioNodeWillBeDestroyed',
      params: { nodeId: 'oscillator-1' },
    });
    const naturallyDestroyedGraph = projectedFeedAudioGraph(naturallyDestroyedSource);
    expect(compendiumFeedWebAudioRouteNodeIds(naturallyDestroyedGraph)).toEqual([
      'oscillator-1', 'gain-1', 'bus-1', 'destination-1',
    ]);
    expect(assessGraph(naturallyDestroyedGraph)).toEqual({ ok: true, reasons: [] });

    const naturallyDestroyedContext = feedAudioProtocolEvents();
    naturallyDestroyedContext.push({
      sessionId: FEED_AUDIO_SESSION,
      method: 'WebAudio.contextWillBeDestroyed',
      params: { contextId: 'context-1' },
    });
    expect(assessGraph(projectedFeedAudioGraph(naturallyDestroyedContext))).toEqual({
      ok: true,
      reasons: [],
    });

    const fullyTornDownRoute = feedAudioProtocolEvents();
    for (const [sourceId, destinationId] of [
      ['oscillator-1', 'gain-1'],
      ['gain-1', 'bus-1'],
      ['bus-1', 'destination-1'],
    ] as const) fullyTornDownRoute.push({
      sessionId: FEED_AUDIO_SESSION,
      method: 'WebAudio.nodesDisconnected',
      params: { contextId: 'context-1', sourceId, destinationId },
    });
    for (const nodeId of ['oscillator-1', 'gain-1', 'bus-1', 'destination-1']) {
      fullyTornDownRoute.push({
        sessionId: FEED_AUDIO_SESSION,
        method: 'WebAudio.audioNodeWillBeDestroyed',
        params: { nodeId },
      });
    }
    const fullyTornDownGraph = projectedFeedAudioGraph(fullyTornDownRoute);
    expect(assessGraph(fullyTornDownGraph)).toEqual({
      ok: true,
      reasons: [],
    });

    const tornDownFalseDestination = structuredClone(fullyTornDownGraph);
    const tornDownDestination = tornDownFalseDestination.nodes.find((node) => (
      node.nodeId === tornDownFalseDestination.destinationNodeId
    ));
    expect(tornDownDestination).toBeDefined();
    tornDownDestination!.nodeType = 'Gain';
    expect(assessGraph(tornDownFalseDestination)).toEqual({
      ok: false,
      reasons: ['live AudioDestination route'],
    });

    const tornDownCrossContext = structuredClone(fullyTornDownGraph);
    const tornDownRouteNodeIds = compendiumFeedWebAudioRouteNodeIds(tornDownCrossContext);
    expect(tornDownRouteNodeIds).toEqual([
      'oscillator-1', 'gain-1', 'bus-1', 'destination-1',
    ]);
    const tornDownIntermediate = tornDownCrossContext.nodes.find((node) => (
      node.nodeId === tornDownRouteNodeIds[1]
    ));
    expect(tornDownIntermediate).toBeDefined();
    tornDownIntermediate!.contextId = 'cross-context-negative-control';
    expect(assessGraph(tornDownCrossContext)).toEqual({
      ok: false,
      reasons: ['live AudioDestination route'],
    });

    const tornDownStaleInventory = structuredClone(fullyTornDownGraph);
    const tornDownGainInventory = tornDownStaleInventory.nodeTypeInventory.find(([nodeType]) => (
      nodeType === 'Gain'
    ));
    expect(tornDownGainInventory).toBeDefined();
    tornDownGainInventory![1] += 1;
    expect(assessGraph(tornDownStaleInventory)).toEqual({
      ok: false,
      reasons: ['live AudioDestination route'],
    });

    const neverConnected = feedAudioProtocolEvents().slice(0, -1);
    expect(assessGraph(projectedFeedAudioGraph(neverConnected))).toEqual({
      ok: false,
      reasons: ['live AudioDestination route'],
    });

    const disjointTimeRoute = [
      feedAudioProtocolEvents()[0]!,
      feedAudioProtocolEvents()[3]!,
      {
        sessionId: FEED_AUDIO_SESSION,
        method: 'WebAudio.nodesConnected',
        params: {
          contextId: 'context-1', sourceId: 'oscillator-1', destinationId: 'gain-1',
        },
      },
      {
        sessionId: FEED_AUDIO_SESSION,
        method: 'WebAudio.nodesConnected',
        params: {
          contextId: 'context-1', sourceId: 'gain-1', destinationId: 'destination-1',
        },
      },
      feedAudioProtocolEvents()[1]!,
    ];
    expect(assessGraph(projectedFeedAudioGraph(disjointTimeRoute))).toEqual({
      ok: false,
      reasons: ['live AudioDestination route'],
    });

    const duplicateLiveConnection = feedAudioProtocolEvents();
    duplicateLiveConnection.splice(5, 0, structuredClone(duplicateLiveConnection[4]!));
    expect(assessGraph(projectedFeedAudioGraph(duplicateLiveConnection))).toEqual({
      ok: false,
      reasons: ['live AudioDestination route'],
    });

    const duplicateUnrelatedConnection = feedAudioProtocolEvents();
    duplicateUnrelatedConnection.push(
      {
        sessionId: FEED_AUDIO_SESSION,
        method: 'WebAudio.audioNodeCreated',
        params: { node: {
          nodeId: 'unrelated-1', contextId: 'context-1', nodeType: 'Gain',
        } },
      },
      {
        sessionId: FEED_AUDIO_SESSION,
        method: 'WebAudio.audioNodeCreated',
        params: { node: {
          nodeId: 'unrelated-2', contextId: 'context-1', nodeType: 'Gain',
        } },
      },
      {
        sessionId: FEED_AUDIO_SESSION,
        method: 'WebAudio.nodesConnected',
        params: {
          contextId: 'context-1', sourceId: 'unrelated-1', destinationId: 'unrelated-2',
        },
      },
      {
        sessionId: FEED_AUDIO_SESSION,
        method: 'WebAudio.nodesConnected',
        params: {
          contextId: 'context-1', sourceId: 'unrelated-1', destinationId: 'unrelated-2',
        },
      },
    );
    expect(assessGraph(projectedFeedAudioGraph(duplicateUnrelatedConnection))).toEqual({
      ok: true,
      reasons: [],
    });

    const contextDestroyedBeforeRoute = feedAudioProtocolEvents().slice(0, -1);
    contextDestroyedBeforeRoute.push({
      sessionId: FEED_AUDIO_SESSION,
      method: 'WebAudio.contextWillBeDestroyed',
      params: { contextId: 'context-1' },
    }, feedAudioProtocolEvents().at(-1)!);
    expect(assessGraph(projectedFeedAudioGraph(contextDestroyedBeforeRoute))).toEqual({
      ok: false,
      reasons: ['live AudioDestination route'],
    });

    const destroyedBeforeRoute = feedAudioProtocolEvents().slice(0, -1);
    destroyedBeforeRoute.push({
      sessionId: FEED_AUDIO_SESSION,
      method: 'WebAudio.audioNodeWillBeDestroyed',
      params: { nodeId: 'oscillator-1' },
    }, {
      sessionId: FEED_AUDIO_SESSION,
      method: 'WebAudio.nodesConnected',
      params: {
        contextId: 'context-1', sourceId: 'bus-1', destinationId: 'destination-1',
      },
    });
    expect(assessGraph(projectedFeedAudioGraph(destroyedBeforeRoute))).toEqual({
      ok: false,
      reasons: ['live AudioDestination route'],
    });

    const duplicateAfterTeardown = structuredClone(fullyTornDownRoute);
    duplicateAfterTeardown.push({
      sessionId: FEED_AUDIO_SESSION,
      method: 'WebAudio.audioNodeCreated',
      params: { node: {
        nodeId: 'oscillator-2', contextId: 'context-1', nodeType: 'Oscillator',
      } },
    });
    expect(assessGraph(projectedFeedAudioGraph(duplicateAfterTeardown))).toEqual({
      ok: false,
      reasons: ['live AudioDestination route'],
    });

    const duplicateDestinationAfterTeardown = structuredClone(fullyTornDownRoute);
    duplicateDestinationAfterTeardown.push({
      sessionId: FEED_AUDIO_SESSION,
      method: 'WebAudio.audioNodeCreated',
      params: { node: {
        nodeId: 'destination-2', contextId: 'context-1', nodeType: 'AudioDestination',
      } },
    });
    expect(assessGraph(projectedFeedAudioGraph(duplicateDestinationAfterTeardown))).toEqual({
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

    const wrongReopenedAvailability = structuredClone(good);
    (wrongReopenedAvailability.reopened as { feedState: string }).feedState = 'no-flora';
    expect(assessCompendiumFeedCommittedOutcome(wrongReopenedAvailability)).toEqual({
      ok: false,
      reasons: ['same-document Compendium refresh'],
    });

    const wrongReloadedAvailability = structuredClone(good);
    (wrongReloadedAvailability.reloaded as { feedState: string }).feedState = 'no-flora';
    expect(assessCompendiumFeedCommittedOutcome(wrongReloadedAvailability)).toEqual({
      ok: false,
      reasons: ['full-reload durable fixed point'],
    });

    for (const [field, value] of [
      ['summaryCount', 0], ['confirmPresent', false], ['confirmDisabled', null],
      ['radioCount', 0], ['allRadiosDisabled', true],
      ['backEnabled', false], ['closeEnabled', false],
    ] as const) {
      const wrongReopenedPresentation = structuredClone(good);
      Object.assign(wrongReopenedPresentation.reopened, { [field]: value });
      expect(assessCompendiumFeedCommittedOutcome(wrongReopenedPresentation)).toEqual({
        ok: false,
        reasons: ['same-document Compendium refresh'],
      });
      const wrongReloadedPresentation = structuredClone(good);
      Object.assign(wrongReloadedPresentation.reloaded, { [field]: value });
      expect(assessCompendiumFeedCommittedOutcome(wrongReloadedPresentation)).toEqual({
        ok: false,
        reasons: ['full-reload durable fixed point'],
      });
    }

    const exhausted = structuredClone(good);
    Object.assign(exhausted.fixture, {
      foodQuantityBefore: 1,
      foodQuantityAfter: 0,
      postFeedAvailability: 'no-flora',
    });
    const exhaustedWitness = canonicalJson({
      schema: 'cf-v2-arc5-feed-witness/v1',
      receiptOrdinal: exhausted.before.sessionOrdinal,
      parentRevision: exhausted.before.ownershipRevision,
      parentDigest: exhausted.before.targetDigest,
      creatureId: exhausted.fixture.creatureId,
      foodLotId: exhausted.fixture.foodLotId,
      fedBefore: exhausted.fixture.fedBefore,
      fedAfter: exhausted.fixture.fedAfter,
      foodQuantityBefore: exhausted.fixture.foodQuantityBefore,
      foodQuantityAfter: exhausted.fixture.foodQuantityAfter,
    });
    const exhaustedWitnessDigest = hashText(exhaustedWitness);
    for (const candidate of [exhausted.after, exhausted.reloaded]) {
      Object.assign(candidate, {
        foodQuantityBefore: 1,
        foodQuantityAfter: 0,
        lotTombstoned: true,
        lotDisposition: {
          ordinal: candidate.receiptOrdinal,
          actionKind: 'companion-feed',
          witnessDigest: exhaustedWitnessDigest,
        },
        tombstoneSnapshotQuantity: 1,
        receiptWitness: exhaustedWitness,
        receiptWitnessDigest: exhaustedWitnessDigest,
      });
      const lastReceipt = candidate.receiptRows.length - 1;
      candidate.receiptRows[lastReceipt]!.witness = exhaustedWitness;
      candidate.receiptRawRows[lastReceipt] = JSON.stringify(candidate.receiptRows[lastReceipt]);
    }
    const exhaustedNoticeMessage = `Meals ${exhausted.fixture.fedBefore} → ${exhausted.fixture.fedAfter}. Used 1 flora; the exact lot is now empty.`;
    exhausted.settled.notificationToast.message = exhaustedNoticeMessage;
    exhausted.settled.toastText = `Meal complete.${exhaustedNoticeMessage}`;
    for (const history of Object.values(exhausted.reloaded.notificationHistory)) {
      history[0]!.ms = exhaustedNoticeMessage;
    }
    Object.assign(exhausted.settled.result, {
      foodQuantityBefore: 1,
      foodQuantityAfter: 0,
    });
    const exhaustedPresentation = {
      feedState: 'no-flora',
      summaryCount: 0,
      confirmPresent: false,
      confirmDisabled: null,
      radioCount: 1,
      allRadiosDisabled: true,
      backEnabled: true,
      closeEnabled: true,
    };
    Object.assign(exhausted.reopened, { foodQuantity: 0, ...exhaustedPresentation });
    Object.assign(exhausted.reloaded, { foodQuantity: 0, ...exhaustedPresentation });
    expect(assessCompendiumFeedCommittedOutcome(exhausted)).toEqual({ ok: true, reasons: [] });

    const exhaustedPhaseBlind = structuredClone(exhausted);
    exhaustedPhaseBlind.reopened.feedState = 'ready';
    expect(assessCompendiumFeedCommittedOutcome(exhaustedPhaseBlind)).toEqual({
      ok: false,
      reasons: ['same-document Compendium refresh'],
    });
  });

  it('requires exactly one durable unread Feed notice and preserves prior history in both codec owners', () => {
    const good = committedBundle();
    const reason = { ok: false, reasons: ['exact post-Feed notification checkpoint'] };
    expect(assessCompendiumFeedCommittedOutcome(good)).toEqual({ ok: true, reasons: [] });
    type Bundle = ReturnType<typeof committedBundle>;
    const mutateRows = (bundle: Bundle, mutate: (rows: Bundle['before']['notificationHistory']['legacy']) => void) => {
      for (const rows of Object.values(bundle.reloaded.notificationHistory)) mutate(rows);
    };
    const mutations: Array<(bundle: Bundle) => void> = [
      (b) => { Reflect.deleteProperty(b.reloaded, 'notificationHistory'); },
      (b) => { b.reloaded.notificationHistory = structuredClone(b.after.notificationHistory); },
      (b) => mutateRows(b, (rows) => { rows[0]!.read = true; }),
      (b) => mutateRows(b, (rows) => { rows[0]!.tt = 'Another result'; }),
      (b) => mutateRows(b, (rows) => { rows[0]!.ms += ' changed'; }),
      (b) => mutateRows(b, (rows) => { rows[0]!.id = rows[1]!.id; }),
      (b) => mutateRows(b, (rows) => { rows[0]!.id += 1; }),
      (b) => mutateRows(b, (rows) => { rows[0]!.t = b.after.codecAt - 1; }),
      (b) => mutateRows(b, (rows) => { rows[0]!.t = b.settled.notificationToast.observedAt + 1; }),
      (b) => mutateRows(b, (rows) => { rows[0]!.tt = 'x'.repeat(201); }),
      (b) => mutateRows(b, (rows) => { rows[0]!.ms = 'x'.repeat(401); }),
      (b) => mutateRows(b, (rows) => { rows[0]!.id = 0x8000_0000; }),
      (b) => mutateRows(b, (rows) => { Reflect.set(rows[0]!, 'extra', true); }),
      (b) => mutateRows(b, (rows) => { Reflect.deleteProperty(rows[0]!, 'read'); }),
      (b) => mutateRows(b, (rows) => { rows[1]!.read = !rows[1]!.read; }),
      (b) => mutateRows(b, (rows) => { rows[1]!.ms += ' changed'; }),
      (b) => mutateRows(b, (rows) => { rows.splice(1, 1); }),
      (b) => mutateRows(b, (rows) => { rows.splice(1, 2, rows[2]!, rows[1]!); }),
      (b) => mutateRows(b, (rows) => { rows.splice(1, 0, { ...rows[0]! }); }),
      (b) => { b.reloaded.notificationHistory.player[0]!.read = true; },
      (b) => { b.after.notificationHistory.player[0]!.read = false; },
      (b) => { b.settled.notificationToast.visible = false; },
      (b) => { b.settled.notificationToast.message = 'A different painted result'; },
      (b) => { b.settled.notificationToast.serial -= 1; },
      (b) => { Reflect.deleteProperty(b.settled, 'notificationToast'); },
    ];
    for (const [index, mutate] of mutations.entries()) {
      const bad = structuredClone(good);
      mutate(bad);
      expect(assessCompendiumFeedCommittedOutcome(bad), `notice mutation ${index}`).toEqual(reason);
    }
    const unrelated = structuredClone(good);
    unrelated.reloaded.unrelatedExceptNotificationsFingerprint = digest('0');
    expect(assessCompendiumFeedCommittedOutcome(unrelated)).toEqual({
      ok: false, reasons: ['full-reload durable fixed point'],
    });
    const earlyMutation = structuredClone(good);
    earlyMutation.after.unrelatedFingerprint = digest('0');
    expect(assessCompendiumFeedCommittedOutcome(earlyMutation)).toEqual({
      ok: false, reasons: ['Arc 5-only fixed-five successor'],
    });
  });

  it('accepts the first notice and exact 50-row retention with signed-ID wrap and collisions', () => {
    const first = committedBundle();
    for (const state of [first.before, first.after]) {
      state.notificationHistory = { legacy: [], player: [] };
    }
    const firstNotice = { ...first.reloaded.notificationHistory.legacy[0]!, id: 1 };
    first.reloaded.notificationHistory = { legacy: [firstNotice], player: [{ ...firstNotice }] };
    expect(assessCompendiumFeedCommittedOutcome(first)).toEqual({ ok: true, reasons: [] });
    const capped = committedBundle();
    const prior = Array.from({ length: 50 }, (_, index) => ({
      id: index === 0 ? 0x7FFF_FFFF : index < 3 ? -0x8000_0000 + index - 1 : index,
      tt: `Prior ${index}`, ms: `Exact previous ${index}`, t: index + 100, read: index % 2 === 0,
    }));
    for (const state of [capped.before, capped.after]) {
      state.notificationHistory = { legacy: structuredClone(prior), player: structuredClone(prior) };
    }
    const head = { ...capped.reloaded.notificationHistory.legacy[0]!, id: -0x8000_0000 + 2 };
    const next = [head, ...prior.slice(0, 49)];
    capped.reloaded.notificationHistory = { legacy: next, player: structuredClone(next) };
    expect(assessCompendiumFeedCommittedOutcome(capped)).toEqual({ ok: true, reasons: [] });
    for (const rows of Object.values(capped.reloaded.notificationHistory)) rows.push(prior[49]!);
    expect(assessCompendiumFeedCommittedOutcome(capped)).toEqual({
      ok: false, reasons: ['exact post-Feed notification checkpoint'],
    });
  });

  it('keeps the full fingerprint and removes only the two codec notification vectors from the separate digest', () => {
    const start = source.indexOf('  const arc5FeedCodecStableRecord =');
    const end = source.indexOf('  const arc5FeedFixture =', start);
    expect(start).toBeGreaterThan(0);
    expect(end).toBeGreaterThan(start);
    const project = Function(`${source.slice(start, end)}; return arc5FeedUnrelatedData;`)() as
      (raw: unknown, omitNotifications?: boolean) => unknown;
    const prior = committedBundle().before.notificationHistory.legacy;
    const raw = {
      legacy: { notifs: prior, hp: 70, at: 1_000 },
      playerRow: { data: { notifs: structuredClone(prior), hp: 70, at: 1_000 }, extensions: {} },
      creaturesRow: { data: { creatures: ['a'] }, extensions: {} },
      catalogRow: { data: { codex: ['a'] }, extensions: {} },
      inventoryRow: { data: { items: ['a'], notifs: ['unrelated nested name'] }, extensions: {} },
      settingsRow: { data: { snd: true }, extensions: {} },
    };
    const noticeOnly = structuredClone(raw);
    noticeOnly.legacy.notifs.unshift({ id: 4, tt: 'Meal complete.', ms: 'A new message', t: 2_000, read: false });
    noticeOnly.playerRow.data.notifs = structuredClone(noticeOnly.legacy.notifs);
    expect(hashCanonical(project(noticeOnly))).not.toBe(hashCanonical(project(raw)));
    expect(hashCanonical(project(noticeOnly, true))).toBe(hashCanonical(project(raw, true)));
    const mutations: Array<(candidate: typeof raw) => void> = [
      (b) => { b.legacy.hp += 1; },
      (b) => { b.playerRow.data.hp += 1; },
      (b) => { b.creaturesRow.data.creatures.push('new'); },
      (b) => { b.catalogRow.data.codex.push('new'); },
      (b) => { b.inventoryRow.data.items.push('new'); },
      (b) => { b.inventoryRow.data.notifs.push('must stay guarded'); },
      (b) => { b.settingsRow.data.snd = false; },
      (b) => { Reflect.set(b.playerRow.extensions, 'unrelated.owner', { version: 1, json: '{}' }); },
    ];
    for (const mutate of mutations) {
      const changed = structuredClone(raw);
      mutate(changed);
      expect(hashCanonical(project(changed, true))).not.toBe(hashCanonical(project(raw, true)));
    }
    expect(source).toContain('unrelatedFingerprint: arc5FeedHash(arc5FeedUnrelatedData(raw))');
    expect(source).toContain('legacy: raw?.legacy?.notifs ?? null');
    expect(source).toContain('player: raw?.playerRow?.data?.notifs ?? null');
    expect(source).toContain('observedAt:Date.now()');
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

  it('causal-orders both native Feed choice/preview sequences with retained diagnostics', () => {
    const owner = (candidate: string, start: string, end: string): string | null => {
      const startIndex = candidate.indexOf(start);
      if (startIndex < 0 || candidate.indexOf(start, startIndex + 1) >= 0) return null;
      const endIndex = candidate.indexOf(end, startIndex + start.length);
      return endIndex > startIndex ? candidate.slice(startIndex, endIndex) : null;
    };
    const ordered = (candidate: string, needles: readonly string[]): boolean => {
      let cursor = -1;
      for (const needle of needles) {
        const next = candidate.indexOf(needle, cursor + 1);
        if (next < 0) return false;
        cursor = next;
      }
      return true;
    };
    const occurrences = (candidate: string, needle: string): number =>
      candidate.split(needle).length - 1;
    const isCausalFeedWiring = (candidate: string): boolean => {
      const fixtureOwner = owner(
        candidate, '  const arc5FeedFixture = (() => {',
        '  const arc5FeedCarrierProjection = (raw, fixture) => {',
      );
      const feedUi = owner(
        candidate, '  const ARC5_FEED_UI_EXPRESSION =',
        '  const desktopArc5FeedDriver = Object.freeze({',
      );
      const desktopPointer = owner(
        candidate, '  const clickDesktopPoint = async (point) => {',
        '  const armDesktopPointerReceipt = async',
      );
      const targetDriver = owner(
        candidate, '  const createArc5FeedTargetDriver = (targetSession) => {',
        '  const arc5FeedClick = async (',
      );
      const detail = owner(
        candidate, '  const arc5FeedOpenDetail = async (',
        '  const arc5FeedChoiceSelector = (kind, id) =>',
      );
      const choice = owner(
        candidate, '  const activateArc5FeedChoice = async (',
        '  const collectArc5FeedPreview = async (',
      );
      const preview = owner(
        candidate, '  const collectArc5FeedPreview = async (',
        '  const arc5FeedRenderedValues = async (',
      );
      const rendered = owner(
        candidate, '  const arc5FeedRenderedValues = async (',
        '\n\n  if (arc5FeedFixture === null) {',
      );
      const initial = owner(
        candidate,
        "    const initialFeedUi = await arc5FeedOpenDetail(arc5FeedFixture, 'Arc 5 Feed');",
        '    /* A genuinely separate same-origin document now wins',
      );
      const winner = owner(
        candidate, '      const winnerInitialFeedUi = await arc5FeedOpenDetail(',
        '      const audioEvidenceDeadline = Date.now() + 3_000;',
      );
      const postCommitReopen = owner(
        candidate, '      settledUi = {',
        '      const loserPagehideKey =',
      );
      const postCommitReload = owner(
        candidate, "      await waitForF4Writable('Arc 5 Feed loser restored after winner close'",
        '      const loserConfirmPresses =',
      );
      if (!fixtureOwner || !feedUi || !desktopPointer || !targetDriver || !detail
        || !choice || !preview || !rendered || !initial || !winner || !postCommitReopen
        || !postCommitReload) {
        return false;
      }
      const noSyntheticChoice = (section: string): boolean =>
        !/\.click\s*\(|\.checked\s*=|dispatchEvent\s*\(\s*new\s+(?:Event|MouseEvent|PointerEvent)/u
          .test(section);
      const noAsyncEscape = (section: string): boolean =>
        !/\.catch\s*\(|Promise\.all\s*\(/u.test(section);
      const rawCdpPointer = (section: string, session: 'sess' | 'targetSession'): boolean => {
        const calls = section.match(new RegExp(
          `send\\('Input\\.dispatchMouseEvent', \\{[\\s\\S]*?\\}, ${session}\\);`, 'gu',
        )) ?? [];
        return calls.length === 2
          && calls[0]?.includes("type: 'mousePressed'") === true
          && calls[1]?.includes("type: 'mouseReleased'") === true
          && noSyntheticChoice(section);
      };

      return occurrences(candidate, 'activateArc5FeedChoice(') === 4
        && occurrences(candidate, 'collectArc5FeedPreview(') === 2
        && occurrences(candidate, 'buildCompendiumFeedChoiceSettlementExpression(') === 1
        && fixtureOwner.includes('const readyCompanionCountBefore = source.creatures.filter(')
        && fixtureOwner.includes('const postFeedAvailability = compendiumFeedSuccessorAvailability({')
        && fixtureOwner.includes('selectedCompanionReadyAfter: fedBefore + 1 < 200,')
        && fixtureOwner.includes('floraLotCountBefore: floraLots.length,')
        && fixtureOwner.includes('selectedFloraLotPresentAfter: food.quantity - 1 > 0,')
        && fixtureOwner.includes('postFeedAvailability,')
        && feedUi.includes(
          "feedSummaries=[...mount?.querySelectorAll('[data-arc5-feed-summary]')??[]],",
        )
        && feedUi.includes(
          'summaryCount:feedSummaries.length,summary:text(feedSummaries[0]),',
        )
        && !feedUi.includes("querySelector('.compendium-feed-summary')")
        && candidate.includes('const desktopArc5FeedDriver = Object.freeze({\n'
          + '    evaluate: evalIn,\n    wait: waitDesktopValue,\n'
          + '    clickPoint: clickDesktopPoint,\n  });')
        && rawCdpPointer(desktopPointer, 'sess')
        && rawCdpPointer(targetDriver, 'targetSession')
        && targetDriver.includes('return Object.freeze({ evaluate, wait, clickPoint });')
        && detail.includes(
          "fixture, label, driver = desktopArc5FeedDriver, expectedAvailability = 'ready',",
        )
        && detail.includes(
          '&& compendiumFeedDetailPresentationPasses(ui, expectedAvailability)',
        )
        && rendered.includes('summaryCount:ui.summaryCount,')
        && rendered.includes('confirmPresent:ui.confirmPresent,confirmDisabled:ui.confirmDisabled,')
        && rendered.includes('radioCount:ui.radioCount,allRadiosDisabled:ui.allRadiosDisabled,')
        && rendered.includes('backEnabled:ui.backEnabled,closeEnabled:ui.closeEnabled')
        && ordered(choice, [
          'h.receipt={pointerdowns:[],clicks:[],inputs:[],changes:[]};',
          "for(const type of ['pointerdown','click','input','change'])document.addEventListener(",
          'if (!arc5FeedChoicePreparationPasses(preparation, expected)) {',
          'dispatchPreflight = await driver.evaluate',
          'if (!arc5FeedChoiceDispatchPasses(',
          'const nativeDispatch = await driver.clickPoint(dispatchPreflight);',
          'assessment = assessCompendiumFeedChoiceActivation(observation, expected);',
          'if (assessment.ok) return observation;',
          '+ JSON.stringify({ expected, assessment, observation }));',
        ])
        && choice.includes('JSON.stringify({ expected, observation: preparation })')
        && choice.includes('JSON.stringify({ expected, preparation, dispatch: dispatchPreflight })')
        && noSyntheticChoice(choice) && noAsyncEscape(choice)
        && ordered(preview, [
          'const expression = `(()=>{const ui=${ARC5_FEED_UI_EXPRESSION};return {',
          'observation = await driver.evaluate(expression);',
          'assessment = assessCompendiumFeedPreview(observation, expected);',
          'if (assessment.ok) return Object.freeze({ expected, assessment, observation });',
          '+ JSON.stringify({ expected, assessment, observation }));',
        ])
        && !preview.includes('?ui:null') && !preview.includes('? ui : null')
        && noAsyncEscape(preview)
        && ordered(initial, [
          'const companionChoiceActivation = await activateArc5FeedChoice(',
          'const floraChoiceActivation = await activateArc5FeedChoice(',
          'const selectedUi = await collectArc5FeedPreview(',
          'const beforeRaw = await evalIn(ARC4_DURABLE_READ_EXPRESSION);',
          'const loserFeedActivation = await arc5FeedClick(',
        ])
        && initial.includes("'creature', arc5FeedFixture.creatureId, null, initialFeedUi.document,")
        && initial.includes("'flora', arc5FeedFixture.foodLotId, arc5FeedFixture.creatureId,\n"
          + "      initialFeedUi.document, 'Arc 5 exact flora choice',")
        && initial.includes("arc5FeedFixture, initialFeedUi, 'Arc 5 exact Feed preview',")
        && initial.includes("'#codexpanel [data-arc5-feed-confirm]', 'Arc 5 Feed confirm',")
        && noAsyncEscape(initial)
        && ordered(winner, [
          'const winnerCompanionChoiceActivation = await activateArc5FeedChoice(',
          'const winnerFloraChoiceActivation = await activateArc5FeedChoice(',
          'const winnerSelectedUi = await collectArc5FeedPreview(',
          'const winnerBeforeActionRaw = await winnerDriver.evaluate(',
          'const winnerFeedActivation = await arc5FeedClick(',
        ])
        && winner.includes("'creature', arc5FeedFixture.creatureId, null,\n"
          + '        winnerInitialFeedUi.document')
        && winner.includes("'flora', arc5FeedFixture.foodLotId, arc5FeedFixture.creatureId,\n"
          + '        winnerInitialFeedUi.document')
        && winner.includes('arc5FeedFixture, winnerInitialFeedUi,\n'
          + "        'Arc 5 winner exact Feed preview', winnerDriver,")
        && winner.includes("'#codexpanel [data-arc5-feed-confirm]',\n"
          + "        'Arc 5 Feed winner confirm', winnerDriver,")
        && postCommitReopen.includes(
          "arc5FeedFixture.postFeedAvailability,\n      );\n      reopened = await arc5FeedRenderedValues",
        )
        && postCommitReload.includes(
          "arc5FeedFixture, 'Arc 5 Feed reloaded detail', desktopArc5FeedDriver,\n"
          + '        arc5FeedFixture.postFeedAvailability,',
        )
        && noAsyncEscape(winner);
    };
    const replaceOnce = (candidate: string, before: string, after: string): string => {
      expect(occurrences(candidate, before)).toBe(1);
      return candidate.replace(before, after);
    };
    const reverseMarkers = (candidate: string, first: string, second: string): string => {
      expect(occurrences(candidate, first)).toBe(1);
      expect(occurrences(candidate, second)).toBe(1);
      return candidate.replace(first, '__CF_FEED_FIRST__')
        .replace(second, first).replace('__CF_FEED_FIRST__', second);
    };

    expect(isCausalFeedWiring(source)).toBe(true);
    expect(isCausalFeedWiring(replaceOnce(
      source,
      "feedSummaries=[...mount?.querySelectorAll('[data-arc5-feed-summary]')??[]],",
      "feedSummaries=[...panel?.querySelectorAll('.compendium-feed-summary')??[]],",
    ))).toBe(false);
    expect(isCausalFeedWiring(replaceOnce(
      source,
      'const nativeDispatch = await driver.clickPoint(dispatchPreflight);',
      "const nativeDispatch = await driver.evaluate('document.querySelector(\\\"input\\\")?.click()');",
    ))).toBe(false);
    const initialFeedOwner = owner(
      source,
      "    const initialFeedUi = await arc5FeedOpenDetail(arc5FeedFixture, 'Arc 5 Feed');",
      '    /* A genuinely separate same-origin document now wins',
    );
    expect(initialFeedOwner).not.toBeNull();
    expect(isCausalFeedWiring(replaceOnce(source, initialFeedOwner!, reverseMarkers(
      initialFeedOwner!,
      'const selectedUi = await collectArc5FeedPreview(',
      'const beforeRaw = await evalIn(ARC4_DURABLE_READ_EXPRESSION);',
    )))).toBe(false);
    expect(isCausalFeedWiring(reverseMarkers(
      source,
      'const winnerSelectedUi = await collectArc5FeedPreview(',
      'const winnerBeforeActionRaw = await winnerDriver.evaluate(',
    ))).toBe(false);
    expect(isCausalFeedWiring(replaceOnce(
      source,
      "      'Arc 5 exact companion choice',\n    );",
      "      'Arc 5 exact companion choice',\n    ).catch(() => null);",
    ))).toBe(false);
    expect(isCausalFeedWiring(replaceOnce(
      source,
      "    const initialFeedUi = await arc5FeedOpenDetail(arc5FeedFixture, 'Arc 5 Feed');",
      "    const initialFeedUi = await arc5FeedOpenDetail(arc5FeedFixture, 'Arc 5 Feed');\n"
        + '    await Promise.all([]);',
    ))).toBe(false);
    expect(isCausalFeedWiring(replaceOnce(
      source,
      '+ JSON.stringify({ expected, assessment, observation }));\n    } finally {',
      '+ JSON.stringify({ expected }));\n    } finally {',
    ))).toBe(false);
    expect(isCausalFeedWiring(replaceOnce(
      source,
      '+ JSON.stringify({ expected, assessment, observation }));\n  };\n  const arc5FeedRenderedValues',
      '+ JSON.stringify({ expected }));\n  };\n  const arc5FeedRenderedValues',
    ))).toBe(false);
    expect(isCausalFeedWiring(replaceOnce(
      source,
      '&& compendiumFeedDetailPresentationPasses(ui, expectedAvailability)',
      '&& ui.feedState === expectedAvailability',
    ))).toBe(false);
    expect(isCausalFeedWiring(replaceOnce(
      source,
      'selectedFloraLotPresentAfter: food.quantity - 1 > 0,',
      'selectedFloraLotPresentAfter: true,',
    ))).toBe(false);
    expect(isCausalFeedWiring(replaceOnce(
      source,
      "arc5FeedFixture.postFeedAvailability,\n      );\n      reopened = await arc5FeedRenderedValues",
      "'ready',\n      );\n      reopened = await arc5FeedRenderedValues",
    ))).toBe(false);
    expect(isCausalFeedWiring(replaceOnce(
      source,
      "arc5FeedFixture, 'Arc 5 Feed reloaded detail', desktopArc5FeedDriver,\n"
        + '        arc5FeedFixture.postFeedAvailability,',
      "arc5FeedFixture, 'Arc 5 Feed reloaded detail', desktopArc5FeedDriver,\n"
        + "        'ready',",
    ))).toBe(false);
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
      "arc5FeedClick('#dockcodex', `${label} Compendium opener`, driver)",
    );
    expect(detailOwner).not.toContain("arc5FeedClick('#railcodex'");
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
