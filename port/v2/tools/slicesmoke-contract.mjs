/* Browser-free semantic decisions shared by the real slice smoke and its
   report selftest. The driver polls only while these functions say the owned
   image work can still settle; it never treats a fixed delay or a long src
   string alone as publication evidence. */

import { createHash } from 'node:crypto';
import { ARC4_PERTAR_FIXTURE } from './arc4-browser-contract.mjs';

const safeInt = (value) => Number.isSafeInteger(value) && value >= 0;
const nonEmptyString = (value) => typeof value === 'string' && value.length > 0;
const hexDigest = (value) => typeof value === 'string' && /^[0-9a-f]{64}$/u.test(value);
const exactKeys = (value, keys) => value !== null && typeof value === 'object'
  && !Array.isArray(value)
  && canonicalJson(Object.keys(value).sort()) === canonicalJson([...keys].sort());
const sha256Text = (value) => typeof value === 'string'
  ? createHash('sha256').update(value).digest('hex') : null;
const canonicalJson = (value) => {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
};
/* The compatibility writer advances one wall-clock anchor plus exactly two
   bounded cooldown-stamp families. Encode those stamps as ages from `at` and
   retain every other field exactly—including complete saved-route geometry
   and every Atlas `where`. The independently derived expected digest can
   therefore tolerate clock passage without tolerating route/product drift. */
export const legacyPostBootProductDigest = (raw) => {
  if (typeof raw !== 'string') return null;
  try {
    const state = JSON.parse(raw);
    if (!state || typeof state !== 'object' || Array.isArray(state)) return null;
    if (!Number.isSafeInteger(state.at) || state.at < 0) return null;
    const at = state.at;
    state.at = 0;
    if (!Array.isArray(state.conq) || !state.conq.every((entry) => Array.isArray(entry)
      && entry.length === 2 && entry[1] && typeof entry[1] === 'object'
      && !Array.isArray(entry[1]) && Number.isSafeInteger(entry[1].t)
      && entry[1].t >= 0 && entry[1].t <= at)) return null;
    state.conq = state.conq.map(([key, value]) => [key, { ...value, t: at - value.t }]);
    if (!Array.isArray(state.minedw) || !state.minedw.every((entry) => Array.isArray(entry)
      && entry.length === 2 && Number.isSafeInteger(entry[1])
      && entry[1] >= 0 && entry[1] <= at)) return null;
    state.minedw = state.minedw.map(([key, stamp]) => [key, at - stamp]);
    return createHash('sha256').update(canonicalJson(state)).digest('hex');
  } catch { return null; }
};

const legacyCodecClock = (raw) => {
  if (typeof raw !== 'string') return null;
  try {
    const value = JSON.parse(raw)?.at;
    return Number.isSafeInteger(value) && value >= 0 ? value : null;
  } catch { return null; }
};

export const SLICE_SCREENSHOT_LOGICAL_NAMES = Object.freeze([
  'codex',
  'earth',
  'galaxy',
  'guide',
  'phone',
  'settings',
  'sol',
  'solmark',
  'training',
  'universe',
]);

export function sliceScreenshotInventoryLine() {
  return 'screenshots: apps/game/smoke/ '
    + SLICE_SCREENSHOT_LOGICAL_NAMES.map((logicalName) => `slice-${logicalName}`).join(' · ');
}

const exactJson = (left, right) => canonicalJson(left) === canonicalJson(right);

const exactF4OldReceiptFixture = (staged) => staged?.ordinal === 1
  && exactJson(staged?.receiptKeys, ['receipt:0'])
  && staged?.receiptRows?.length === 1
  && staged.receiptRows[0]?.ordinal === 0
  && staged.receiptRows[0]?.kind === 'slice-smoke-old-expedition'
  && staged.receiptRows[0]?.witness === 'old-expedition:0';

/** Everything in this assessment is available before import. A malformed
 * staged receipt is therefore just as terminal as a failed stage or tracer
 * arm and must not be deferred until after replacement mutates the source. */
export function assessF4ReplacementSetup({
  heartbeatQuiescence, documentToken, stageStarted, traceArmed, staged,
}) {
  const reasons = [];
  if (!nonEmptyString(documentToken)
    || heartbeatQuiescence?.schema !== 'cf-v2-f4-heartbeat-quiescence/v1'
    || heartbeatQuiescence?.documentToken !== documentToken
    || heartbeatQuiescence?.wasRunning !== true
    || heartbeatQuiescence?.stopped !== true
    || heartbeatQuiescence?.cycleSettled !== true) {
    reasons.push('heartbeat quiescence');
  }
  if (stageStarted !== true) reasons.push('old receipt stage');
  if (traceArmed !== true) reasons.push('native replacement tracer arm');
  if (!exactF4OldReceiptFixture(staged)) reasons.push('old receipt fixture');
  return { ok: reasons.length === 0, reasons };
}

/** Start a side-effecting Slice continuation only after its immediately
 * preceding F4 authority assessment is green. Keeping the decision here lets
 * the browser-free contract execute the red path and prove the callback was
 * never invoked; callers still own the terminal finding and throw. */
export function beginF4GreenContinuation(assessment, continuation) {
  if (typeof continuation !== 'function') {
    throw new TypeError('F4 continuation must be a function');
  }
  if (assessment?.ok !== true) return Object.freeze({ kind: 'blocked' });
  return Object.freeze({ kind: 'started', value: continuation() });
}

const F4_REPLACEMENT_NATIVE_CALLS = Object.freeze([
  ['get', 'meta', 'f3:revision', 1],
  ['get', 'meta', 'f3:lease:active-play', 1],
  ['clear', 'receipts', null, 0],
  ['put', 'player', 'v5:player', 2],
  ['put', 'creatures', 'v5:creatures', 2],
  ['put', 'catalog', 'v5:catalog', 2],
  ['put', 'inventory', 'v5:inventory', 2],
  ['put', 'settings', 'v5:settings', 2],
  ['put', 'meta', 'save', 2],
  ['delete', 'meta', 'save_bak', 1],
  ['put', 'journal', 'v5:pre-migration-v4', 2],
  ['put', 'journal', 'v5:migration', 2],
  ['put', 'meta', 'f3:revision', 2],
]);

const parsedRecord = (raw) => {
  if (typeof raw !== 'string') return null;
  try {
    const value = JSON.parse(raw);
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  } catch { return null; }
};

/** Validate one exact native whole-expedition replacement transaction. The
 * tracer publishes only from the transaction lifecycle; this assessor then
 * binds its complete request ledger back to the immutable portable fixture. */
export function assessF4NativeReplacementTrace({ staged, replacement, expectation }) {
  const reasons = [];
  const add = (reason, condition) => { if (!condition) reasons.push(reason); };
  const expectedStores = [
    'catalog', 'creatures', 'inventory', 'journal',
    'meta', 'player', 'receipts', 'settings',
  ];
  add('transaction lifecycle', replacement?.schema === 'cf-v2-f4-replacement-native/v3'
    && replacement?.status === 'complete'
    && replacement?.candidateCount === 1
    && replacement?.transactionError === false
    && replacement?.mode === 'readwrite'
    && exactJson(replacement?.stores, expectedStores)
    && replacement?.fixtureSha256 === expectation?.fixtureSha256);

  const calls = Array.isArray(replacement?.calls) ? replacement.calls : [];
  add('native request ledger', calls.length === F4_REPLACEMENT_NATIVE_CALLS.length
    && calls.every((call, index) => {
      const expected = F4_REPLACEMENT_NATIVE_CALLS[index];
      return call?.method === expected[0]
        && call?.store === expected[1]
        && call?.key === expected[2]
        && call?.argumentCount === expected[3]
        && call?.keyPath === null
        && call?.autoIncrement === false
        && exactJson(call?.indexNames, [])
        && call?.nativeRequest === true
        && call?.requestSucceeded === true;
    }));

  const predecessorRevisionRaw = calls[0]?.result;
  const leaseRaw = calls[1]?.result;
  const finalRevisionRaw = calls[12]?.value;
  const predecessorRevision = typeof predecessorRevisionRaw === 'string'
    && /^(0|[1-9]\d*)$/u.test(predecessorRevisionRaw)
    ? Number(predecessorRevisionRaw) : null;
  const finalRevision = typeof finalRevisionRaw === 'string'
    && /^(0|[1-9]\d*)$/u.test(finalRevisionRaw)
    ? Number(finalRevisionRaw) : null;
  const lease = parsedRecord(leaseRaw);
  add('checked predecessor fences', predecessorRevision === staged?.revision
    && finalRevision === predecessorRevision + 1
    && replacement?.replacementRevision === finalRevision
    && lease !== null
    && exactKeys(lease, ['schema', 'held', 'ownerId', 'token', 'heartbeat'])
    && lease.schema === 1 && lease.held === true
    && nonEmptyString(lease.ownerId) && nonEmptyString(lease.token)
    && Number.isSafeInteger(lease.heartbeat) && lease.heartbeat >= 0);

  const playerRow = parsedRecord(calls[3]?.value);
  const creaturesRow = parsedRecord(calls[4]?.value);
  const catalogRow = parsedRecord(calls[5]?.value);
  const inventoryRow = parsedRecord(calls[6]?.value);
  const settingsRow = parsedRecord(calls[7]?.value);
  const legacyRaw = calls[8]?.value;
  const snapshot = parsedRecord(calls[10]?.value);
  const migration = parsedRecord(calls[11]?.value);
  const fixtureRaw = snapshot?.raw;
  const fixture = parsedRecord(fixtureRaw);
  const rows = [playerRow, creaturesRow, catalogRow, inventoryRow, settingsRow];
  const segments = ['player', 'creatures', 'catalog', 'inventory', 'settings'];
  const rowShapes = rows.every((row, index) => row !== null
    && row.schema === 5 && row.segment === segments[index]
    && exactKeys(row, index === 3
      ? ['schema', 'segment', 'data', 'extensions']
      : ['schema', 'segment', 'data'])
    && row.data && typeof row.data === 'object' && !Array.isArray(row.data));
  add('replacement rows', rowShapes
    && playerRow !== null
    && !Object.prototype.hasOwnProperty.call(playerRow, 'extensions')
    && replacement?.playerSchema === 5
    && replacement?.authorityCarrierPresent === false
    && replacement?.carrierVersion === null);

  const merged = {};
  let duplicateField = false;
  if (rowShapes) {
    for (const row of rows) {
      for (const [key, value] of Object.entries(row.data)) {
        if (Object.prototype.hasOwnProperty.call(merged, key)) duplicateField = true;
        merged[key] = value;
      }
    }
  }
  add('fixture-bound replacement product', !duplicateField
    && typeof legacyRaw === 'string'
    && sha256Text(legacyRaw) === expectation?.sourceLegacySha256
    && replacement?.legacyRaw === legacyRaw
    && fixture !== null
    && sha256Text(fixtureRaw) === expectation?.fixtureSha256
    && fixture?.legacyV4 === legacyRaw
    && exactJson(inventoryRow?.extensions, fixture?.extensions?.inventory)
    && exactJson(merged, parsedRecord(legacyRaw)));
  add('replacement journal', snapshot !== null
    && exactKeys(snapshot, ['schema', 'sourceSchema', 'raw'])
    && snapshot.schema === 5 && snapshot.sourceSchema === 5
    && migration !== null
    && exactJson(migration, {
      schema: 5,
      kind: 'trusted-portable-v5-replacement',
      phase: 'complete',
      snapshotKey: 'v5:pre-migration-v4',
      codec: 'legacy-v4-split-v1',
    }));
  return { ok: reasons.length === 0, reasons };
}

const f4ReplacementExpectationShape = (expectation) => expectation
  && typeof expectation === 'object'
  && expectation.schema === 'cf-v2-f4-replacement-expectation/v2'
  && hexDigest(expectation.fixtureSha256)
  && hexDigest(expectation.sourceLegacySha256)
  && hexDigest(expectation.successorProductProjectionSha256)
  && (expectation.preparation === 'current' || expectation.preparation === 'ready')
  && Array.isArray(expectation.sourceUnlockedIds)
  && Array.isArray(expectation.addedAchievementIds)
  && Array.isArray(expectation.successorUnlockedIds)
  && Number.isSafeInteger(expectation.priorBestRankIndex)
  && Number.isSafeInteger(expectation.nextBestRankIndex)
  && Number.isSafeInteger(expectation.receiptFreeBootCommits)
  && expectation.receiptFreeBootCommits >= 0
  && exactJson(expectation.successorUnlockedIds, [
    ...expectation.sourceUnlockedIds, ...expectation.addedAchievementIds,
  ])
  && (expectation.preparation === 'current'
    ? expectation.addedAchievementIds.length === 0
      && expectation.priorBestRankIndex === expectation.nextBestRankIndex
      && expectation.progressionWitness === null
    : typeof expectation.progressionWitness === 'string'
      && /^arc9p1:[0-9a-f]{64}$/u.test(expectation.progressionWitness));

const f4ReplacementPrefixFacts = (expectation, expectedShape) => {
  const branch = expectedShape === true ? expectation.preparation : null;
  const expectedPrefix = branch === 'ready' ? 1 : 0;
  const expectedResetRows = branch === 'ready' ? [{
    ordinal: 0,
    kind: 'arc9-progression-refresh-v1',
    witness: expectation.progressionWitness,
  }] : [];
  return {
    branch,
    expectedPrefix,
    expectedResetRows,
    expectedResetKeys: expectedResetRows.map(({ ordinal }) => `receipt:${ordinal}`),
    expectedBootCommits: (expectation?.receiptFreeBootCommits ?? -1) + expectedPrefix,
  };
};

/**
 * Validate every replacement/reset fact that must be authoritative before the
 * diagnostics-only Smoke outcome is allowed to mutate the new expedition.
 * The fixture—not the observed receipt ledger—selects the current/ready boot
 * branch, and this prefix owns its own pre-outcome wall-clock window.
 */
export function assessF4ReplacementPrefix({
  staged, replacement, reset, codecWindow, expectation,
}) {
  const reasons = [];
  const add = (reason, condition) => {
    if (!condition && !reasons.includes(reason)) reasons.push(reason);
  };
  const expectedShape = f4ReplacementExpectationShape(expectation);
  add('fixture authority', expectedShape === true);

  add('old receipt fixture', exactF4OldReceiptFixture(staged));

  const nativeReplacement = assessF4NativeReplacementTrace({ staged, replacement, expectation });
  add('native atomic clear', nativeReplacement.ok);
  add('replacement boundary', Number.isSafeInteger(replacement?.replacementRevision)
    && replacement.replacementRevision >= 1
    && replacement?.playerSchema === 5
    && replacement?.authorityCarrierPresent === false
    && replacement?.carrierVersion === null
    && sha256Text(replacement?.legacyRaw) === expectation?.sourceLegacySha256);

  const {
    branch, expectedPrefix, expectedResetKeys, expectedResetRows, expectedBootCommits,
  } = f4ReplacementPrefixFacts(expectation, expectedShape);
  add('branch selection', branch !== null
    && reset?.raw?.ordinal === expectedPrefix
    && reset?.state?.persistence?.runtime?.sessionOrdinal === expectedPrefix
    && exactJson(reset?.raw?.receiptKeys, expectedResetKeys)
    && exactJson(reset?.raw?.receiptRows, expectedResetRows));
  add('boot revision and RNG', Number.isSafeInteger(reset?.raw?.revision)
    && reset.raw.revision === replacement?.replacementRevision + expectedBootCommits
    && reset?.state?.persistence?.runtime?.revision === reset.raw.revision
    && reset?.state?.persistence?.runtime?.commits === expectedBootCommits
    && Number.isSafeInteger(reset?.raw?.seed)
    && reset.raw.seed >= 0 && reset.raw.seed <= 0xFFFF_FFFF
    && reset?.state?.persistence?.runtime?.sessionSeed === reset.raw.seed
    && exactJson(reset?.raw?.draws, {})
    && exactJson(reset?.state?.persistence?.runtime?.sessionDraws, reset?.raw?.draws));

  const resetUnlocked = reset?.state?.save?.unlocked;
  const resetBestRank = reset?.state?.save?.stats?.bestRank;
  add('aggregate progression delta', branch !== null
    && exactJson(resetUnlocked, expectation?.successorUnlockedIds)
    && resetBestRank === expectation?.nextBestRankIndex
    && (branch === 'current'
      ? reset?.state?.persistence?.lastOutcome !== `arc9-progression-committed:${reset?.raw?.revision}`
      : reset?.state?.persistence?.lastOutcome === `arc9-progression-committed:${reset?.raw?.revision}`));
  const resetCodecClock = legacyCodecClock(reset?.raw?.legacyRaw);
  add('codec clock', Number.isSafeInteger(codecWindow?.startedAt)
    && Number.isSafeInteger(codecWindow?.endedAt)
    && codecWindow.startedAt >= 0
    && codecWindow.endedAt >= codecWindow.startedAt
    && resetCodecClock !== null
    && resetCodecClock >= codecWindow.startedAt
    && resetCodecClock <= codecWindow.endedAt);
  add('unrelated replacement state', legacyPostBootProductDigest(reset?.raw?.legacyRaw)
    === expectation?.successorProductProjectionSha256);
  add('boot presentation silence', reset?.ceremony?.toastOn === false
    && reset?.ceremony?.toastSerial === 0
    && reset?.ceremony?.queuedFx === 0);
  return { ok: reasons.length === 0, reasons };
}

/**
 * A whole-expedition replacement owns an ordinal-zero boundary, but boot may
 * immediately append one independently expected aggregate-progression
 * receipt. The already-green prefix is re-evaluated from the immutable bundle
 * before the exact Smoke receipt and durable successor are accepted.
 */
export function assessF4ReplacementOutcome({
  staged, replacement, reset, outcome, after, productStable, codecWindow, expectation,
}) {
  const prefix = assessF4ReplacementPrefix({
    staged,
    replacement,
    reset,
    codecWindow: {
      startedAt: codecWindow?.startedAt,
      endedAt: codecWindow?.prefixEndedAt,
    },
    expectation,
  });
  const reasons = [...prefix.reasons];
  const add = (reason, condition) => {
    if (!condition && !reasons.includes(reason)) reasons.push(reason);
  };
  const expectedShape = f4ReplacementExpectationShape(expectation);
  const {
    expectedPrefix, expectedResetRows, expectedBootCommits,
  } = f4ReplacementPrefixFacts(expectation, expectedShape);

  const resetCodecClock = legacyCodecClock(reset?.raw?.legacyRaw);
  const afterCodecClock = legacyCodecClock(after?.raw?.legacyRaw);
  add('codec clock', Number.isSafeInteger(codecWindow?.prefixEndedAt)
    && Number.isSafeInteger(codecWindow?.endedAt)
    && codecWindow.endedAt >= codecWindow.prefixEndedAt
    && resetCodecClock !== null && afterCodecClock !== null
    && afterCodecClock >= resetCodecClock
    && afterCodecClock >= codecWindow.prefixEndedAt
    && afterCodecClock <= codecWindow.endedAt);

  const smokeOrdinal = expectedPrefix;
  add('real outcome receipt', outcome?.kind === 'committed'
    && outcome?.beforeOrdinal === smokeOrdinal
    && outcome?.afterOrdinal === smokeOrdinal + 1
    && outcome?.plan?.receiptOrdinal === smokeOrdinal
    && outcome?.receipt?.ordinal === smokeOrdinal
    && outcome?.receipt?.kind === 'slice-smoke-f4-outcome'
    && Number.isFinite(outcome?.plan?.value)
    && outcome?.receipt?.witness === `slice-smoke-f4:${smokeOrdinal}:${outcome?.plan?.value}`);
  add('outcome revision', outcome?.beforeRevision === reset?.raw?.revision
    && outcome?.afterRevision === outcome?.beforeRevision + 1
    && outcome?.revision === outcome?.afterRevision
    && after?.raw?.revision === outcome?.revision
    && after?.state?.persistence?.runtime?.revision === after?.raw?.revision);

  const expectedFinalRows = [...expectedResetRows, {
    ordinal: smokeOrdinal,
    kind: 'slice-smoke-f4-outcome',
    witness: outcome?.receipt?.witness,
  }];
  const expectedFinalKeys = expectedFinalRows.map(({ ordinal }) => `receipt:${ordinal}`);
  add('durable outcome parity', after?.raw?.ordinal === smokeOrdinal + 1
    && after?.state?.persistence?.runtime?.sessionOrdinal === after?.raw?.ordinal
    && after?.raw?.seed === reset?.raw?.seed
    && after?.state?.persistence?.runtime?.sessionSeed === after?.raw?.seed
    && after?.state?.persistence?.runtime?.commits === expectedBootCommits + 1
    && exactJson(after?.raw?.receiptKeys, expectedFinalKeys)
    && exactJson(after?.raw?.receiptRows, expectedFinalRows)
    && after?.raw?.draws?.['diagnostics.slice-smoke.f4'] === 1
    && after?.state?.persistence?.runtime?.sessionDraws?.['diagnostics.slice-smoke.f4'] === 1
    && legacyPostBootProductDigest(after?.raw?.legacyRaw)
      === expectation?.successorProductProjectionSha256
    && after?.state?.persistence?.lastOutcome === `outcome-committed:${after?.raw?.revision}`);
  add('product changed', productStable === true);
  return { ok: reasons.length === 0, reasons };
}

/* A scrollable Inventory row is reachable only after the harness performs
   the same reveal a player needs and then samples the real centre hit. A
   row's un-clipped DOMRect can be tall and well-formed while its centre is
   below the panel scrollport, so geometry without clip + hit ownership is
   not interaction evidence. */
export function assessInventoryRowReachability(observation, expectedInstanceId) {
  if (!nonEmptyString(expectedInstanceId)) {
    throw new TypeError('Inventory row reachability requires one exact instance id');
  }
  if (!observation || typeof observation !== 'object') {
    return { ok: false, reasons: ['reachability observation absent'] };
  }
  const reasons = [];
  if (observation.instanceId !== expectedInstanceId) reasons.push('exact row identity');
  if (observation.present !== true || observation.connected !== true) reasons.push('connected row');
  if (observation.tag !== 'BUTTON' || observation.disabled !== false
    || observation.ariaDisabled === 'true') reasons.push('actionable row');
  if (observation.panelId !== 'inventorypanel' || observation.panelOwnsRow !== true) {
    reasons.push('Inventory scroll owner');
  }
  if (observation.scrollRequested !== true) reasons.push('real row reveal request');
  const before = observation.before;
  const after = observation.after;
  const clip = observation.clip;
  const viewport = observation.viewport;
  if (!before || typeof before !== 'object' || typeof before.hitOwned !== 'boolean'
    || !Number.isFinite(before.scrollTop) || !Number.isFinite(before.x) || !Number.isFinite(before.y)) {
    reasons.push('pre-reveal observation');
  }
  if (!after || typeof after !== 'object'
    || !Number.isFinite(after.scrollTop) || !Number.isFinite(after.x) || !Number.isFinite(after.y)
    || !Number.isFinite(after.width) || !Number.isFinite(after.height)) {
    reasons.push('post-reveal observation');
  } else {
    if (after.width <= 0 || after.height < 44) reasons.push('44px row geometry');
    if (after.hitOwned !== true) reasons.push('centre hit ownership');
  }
  if (!clip || typeof clip !== 'object'
    || !Number.isFinite(clip.left) || !Number.isFinite(clip.top)
    || !Number.isFinite(clip.right) || !Number.isFinite(clip.bottom)
    || clip.right <= clip.left || clip.bottom <= clip.top
    || !viewport || typeof viewport !== 'object'
    || !Number.isFinite(viewport.width) || !Number.isFinite(viewport.height)
    || viewport.width <= 0 || viewport.height <= 0) {
    reasons.push('scrollport geometry');
  } else if (after && Number.isFinite(after.x) && Number.isFinite(after.y)) {
    const left = Math.max(0, clip.left);
    const top = Math.max(0, clip.top);
    const right = Math.min(viewport.width, clip.right);
    const bottom = Math.min(viewport.height, clip.bottom);
    if (right <= left || bottom <= top
      || after.x < left || after.x >= right || after.y < top || after.y >= bottom) {
      reasons.push('centre inside visible scrollport');
    }
  }
  if (before && after && before.hitOwned === false
    && Number.isFinite(before.scrollTop) && Number.isFinite(after.scrollTop)
    && Math.abs(after.scrollTop - before.scrollTop) < 0.5) {
    reasons.push('offscreen row reveal movement');
  }
  return { ok: reasons.length === 0, reasons };
}

const INVENTORY_STAGE_REQUIREMENTS = Object.freeze({
  surface: Object.freeze([
    ['panelOpened', 'Inventory panel open'],
    ['rowReachable', 'exact row reachable'],
  ]),
  action: Object.freeze([
    ['panelOpened', 'Inventory panel open'],
    ['rowReachable', 'exact row reachable'],
    ['surfaceGreen', 'surface outcome green'],
  ]),
  'action-controls': Object.freeze([
    ['panelOpened', 'Inventory panel open'],
    ['rowReachable', 'exact row reachable'],
    ['surfaceGreen', 'surface outcome green'],
    ['actionPointGreen', 'action target reachable'],
    ['actionSettled', 'action commit settled'],
    ['actionGreen', 'action outcome green'],
  ]),
  reload: Object.freeze([
    ['panelOpened', 'Inventory panel open'],
    ['rowReachable', 'exact row reachable'],
    ['surfaceGreen', 'surface outcome green'],
    ['actionPointGreen', 'action target reachable'],
    ['actionSettled', 'action commit settled'],
    ['actionGreen', 'action outcome green'],
    ['actionClosed', 'committed detail closed'],
  ]),
});

/* Later Inventory outcomes are meaningful only when their complete causal
   prefix is green. This keeps one missed row from masquerading as modal,
   action, persistence and Atlas regressions, and keeps mutation controls off
   a red base where every mutant would pass vacuously. */
export function assessInventoryStagePrefix(stage, evidence) {
  const requirements = INVENTORY_STAGE_REQUIREMENTS[stage];
  if (!requirements) throw new TypeError(`Unknown Inventory stage ${JSON.stringify(stage)}`);
  const reasons = [];
  for (const [key, diagnosis] of requirements) {
    if (evidence?.[key] !== true) reasons.push(diagnosis);
  }
  return { ok: reasons.length === 0, reasons };
}

/* Arc 3 owns a fresh fixture import and begins mutating a different product
   authority. It may start only when Arc 2's exact fixture was valid and the
   complete native Inventory stage added no finding. Keeping the fixture bit
   separate from the finding count prevents a removed diagnostic push from
   turning a malformed fixture into permission to enter the next arc. */
export function assessArc2InventorySuccessorBoundary(observation) {
  const reasons = [];
  if (observation?.fixtureGreen !== true) reasons.push('exact Arc 2 fixture');
  const findingCountBefore = observation?.findingCountBefore;
  const findingCountAfter = observation?.findingCountAfter;
  if (!safeInt(findingCountBefore) || !safeInt(findingCountAfter)
    || findingCountAfter < findingCountBefore) {
    reasons.push('monotonic Arc 2 finding count');
  } else if (findingCountAfter !== findingCountBefore) {
    reasons.push('zero Arc 2 findings');
  }
  const ok = reasons.length === 0;
  return Object.freeze({
    kind: ok ? 'ready' : 'blocked',
    canEnterMutableArc3: ok,
    reasons: Object.freeze(reasons),
  });
}

const ARC2_INVENTORY_OPERATIONS = Object.freeze([
  'equip', 'unequip', 'salvage', 'pending-claim',
]);

export function assessInventoryOperationActivation(
  observation,
  expectedOperation,
  expectedInstanceId,
  expectedPressCount = expectedOperation === 'salvage' ? 2 : 1,
) {
  if (!ARC2_INVENTORY_OPERATIONS.includes(expectedOperation)
    || !nonEmptyString(expectedInstanceId)
    || !Number.isSafeInteger(expectedPressCount) || expectedPressCount < 1) {
    throw new TypeError('Inventory operation activation requires one operation, exact instance id, and press count');
  }
  const reasons = [];
  const point = observation?.point;
  const points = Array.isArray(observation?.points) ? observation.points : [point];
  const interaction = observation?.interaction;
  if (points.length !== expectedPressCount || points.some((candidate) => !candidate
    || candidate.ok !== true || !Number.isFinite(candidate.x) || !Number.isFinite(candidate.y)
    || !Number.isFinite(candidate.height) || candidate.height < 44)) reasons.push('action target point');
  const presses = Array.isArray(interaction?.presses) ? interaction.presses : [];
  if (!interaction || interaction.pressCount !== expectedPressCount
    || presses.length !== expectedPressCount || presses.some((press) => (
      press?.operation !== expectedOperation || press?.instanceId !== expectedInstanceId
      || press?.tag !== 'BUTTON' || press?.trusted !== true || press?.pointerType !== 'mouse'
      || !Number.isFinite(press?.x) || !Number.isFinite(press?.y)
    ))) {
    reasons.push('trusted action pointer');
  } else if (presses.some((press, index) => Math.abs(press.x - points[index].x) > 0.75
      || Math.abs(press.y - points[index].y) > 0.75)) {
    reasons.push('action point/receipt binding');
  }
  return { ok: reasons.length === 0, reasons };
}

/* Compatibility wrapper retained for the existing Equip selftest. New Slice
   scenarios use the operation-parametric owner above. */
export function assessInventoryActionActivation(observation, expectedInstanceId) {
  const interaction = observation?.interaction;
  const press = interaction && typeof interaction === 'object'
    ? {
      operation: interaction.operation,
      instanceId: interaction.instanceId,
      tag: interaction.tag,
      trusted: interaction.trusted,
      pointerType: interaction.pointerType,
      x: interaction.x,
      y: interaction.y,
    } : null;
  return assessInventoryOperationActivation({
    ...observation,
    interaction: interaction && typeof interaction === 'object'
      ? { ...interaction, presses: press === null ? [] : [press] } : interaction,
  }, 'equip', expectedInstanceId, 1);
}

const exactCountRecord = (pairs, minimum) => {
  if (!Array.isArray(pairs)) return null;
  const counts = {};
  for (const pair of pairs) {
    if (!Array.isArray(pair) || pair.length !== 2 || !nonEmptyString(pair[0])
      || !Number.isSafeInteger(pair[1]) || pair[1] < minimum
      || Object.prototype.hasOwnProperty.call(counts, pair[0])) return null;
    counts[pair[0]] = pair[1];
  }
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
};
const exactPlainRecord = (value) => value && typeof value === 'object' && !Array.isArray(value)
  ? Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right))) : null;

const arc2LegacyProjection = (arc2) => {
  if (arc2?.kind !== 'inventory' || !Array.isArray(arc2.inventory?.entries)
    || !Array.isArray(arc2.inventory?.pendingRewards) || !Array.isArray(arc2.inventory?.equipped)
    || !Array.isArray(arc2.stackableCounts)) return null;
  const counts = new Map();
  for (const row of arc2.stackableCounts) {
    if (!nonEmptyString(row?.baseId) || !Number.isSafeInteger(row?.count) || row.count < 1
      || counts.has(row.baseId)) return null;
    counts.set(row.baseId, row.count);
  }
  const instances = new Map();
  for (const entry of arc2.inventory.entries) {
    const instance = entry?.instance;
    if (!nonEmptyString(instance?.instanceId) || !nonEmptyString(instance?.baseId)
      || instances.has(instance.instanceId)) return null;
    instances.set(instance.instanceId, instance);
    counts.set(instance.baseId, (counts.get(instance.baseId) || 0) + 1);
  }
  for (const reward of arc2.inventory.pendingRewards) {
    const instance = reward?.instance;
    if (!nonEmptyString(instance?.instanceId) || !nonEmptyString(instance?.baseId)
      || instances.has(instance.instanceId)) return null;
    instances.set(instance.instanceId, instance);
    counts.set(instance.baseId, (counts.get(instance.baseId) || 0) + 1);
  }
  const equip = {};
  const equipAff = {};
  for (const binding of arc2.inventory.equipped) {
    const instance = instances.get(binding?.instanceId);
    if (!instance || instance.slot !== binding.slot
      || Object.prototype.hasOwnProperty.call(equip, binding.slot)) return null;
    equip[binding.slot] = instance.baseId;
    if (instance.legacyAffix) equipAff[binding.slot] = {
      k: instance.legacyAffix.affixId,
      v: instance.legacyAffix.value,
      forId: instance.legacyAffix.forBaseId,
    };
  }
  return {
    items: Object.fromEntries([...counts.entries()].sort(([left], [right]) => left.localeCompare(right))),
    equip: exactPlainRecord(equip),
    equipAff: exactPlainRecord(equipAff),
  };
};

const splitInventoryProjection = (value) => ({
  items: exactCountRecord(value?.items, 1),
  equip: exactPlainRecord(value?.eq),
  equipAff: exactPlainRecord(value?.ea),
  cargo: exactCountRecord(value?.cargo, 0),
});

export function arc2InventoryCarrierLegacyCargoParity(evidence, state) {
  const expected = arc2LegacyProjection(evidence?.arc2);
  const legacy = splitInventoryProjection(evidence?.legacy);
  const split = splitInventoryProjection(evidence?.inventoryRow?.data);
  const stateItems = exactCountRecord(state?.save?.items, 1);
  const stateCargo = exactCountRecord(state?.save?.cargo, 0);
  const inventory = evidence?.arc2?.inventory;
  return expected !== null && legacy.items !== null && legacy.equip !== null
    && legacy.equipAff !== null && legacy.cargo !== null
    && split.items !== null && split.equip !== null && split.equipAff !== null && split.cargo !== null
    && stateItems !== null && stateCargo !== null
    && evidence?.revisionRaw === String(evidence?.revision)
    && evidence?.carrierVersion === 1
    && evidence?.inventoryRow?.schema === 5 && evidence?.inventoryRow?.segment === 'inventory'
    && evidence?.legacyRaw === JSON.stringify(evidence?.legacy)
    && evidence?.inventoryRaw === JSON.stringify(evidence?.inventoryRow)
    && evidence?.carrierJson === JSON.stringify(evidence?.arc2)
    && canonicalJson(expected) === canonicalJson({
      items: legacy.items, equip: legacy.equip, equipAff: legacy.equipAff,
    })
    && canonicalJson(expected) === canonicalJson({
      items: split.items, equip: split.equip, equipAff: split.equipAff,
    })
    && canonicalJson(legacy.cargo) === canonicalJson(split.cargo)
    && canonicalJson(legacy.items) === canonicalJson(stateItems)
    && canonicalJson(legacy.cargo) === canonicalJson(stateCargo)
    && state?.inventory?.stateKind === 'inventory' && state?.inventory?.bootstrapPending === false
    && state?.inventory?.revision === inventory?.revision
    && state?.inventory?.entries === inventory?.entries?.length
    && state?.inventory?.pending === inventory?.pendingRewards?.length
    && canonicalJson(state?.inventory?.entryIds)
      === canonicalJson(inventory?.entries?.map(({ instance }) => instance.instanceId))
    && canonicalJson(state?.inventory?.pendingIds)
      === canonicalJson(inventory?.pendingRewards?.map(({ instance }) => instance.instanceId))
    && canonicalJson(state?.inventory?.equippedBindings) === canonicalJson(inventory?.equipped);
}

const actionCoordinatorSettled = (state, completedOperation = null) => {
  const coordinator = state?.engineering?.actionCoordinator;
  const expectedHoldPhase = completedOperation === null ? 'idle' : 'released';
  const expectedHoldOperation = completedOperation === null ? null : `arc2.${completedOperation}`;
  return coordinator?.inFlight === false && coordinator?.owner?.busy === false
    && coordinator?.owner?.operation === null && coordinator?.hold?.phase === expectedHoldPhase
    && coordinator?.hold?.operation === expectedHoldOperation;
};

export function assessArc2InventoryPendingWindow(observation) {
  const operation = observation?.operation;
  const instanceId = observation?.instanceId;
  if (!ARC2_INVENTORY_OPERATIONS.includes(operation) || !nonEmptyString(instanceId)) {
    throw new TypeError('Arc 2 pending window requires one operation and exact instance id');
  }
  const reasons = [];
  const expectedPressCount = operation === 'salvage' ? 2 : 1;
  if (!assessInventoryOperationActivation({
    point: observation?.point,
    points: observation?.points,
    interaction: observation?.activation,
  }, operation, instanceId, expectedPressCount).ok) reasons.push('exact trusted activation');
  const retry = observation?.retry;
  const retryPoint = observation?.retryPoint;
  const retryPresses = Array.isArray(retry?.presses) ? retry.presses : [];
  const retryDispatch = retry?.dispatch;
  if (!retry || retryPoint?.ok !== true || retryPoint?.disabled !== true
    || !Number.isFinite(retryPoint?.x) || !Number.isFinite(retryPoint?.y)
    || retryDispatch?.kind !== 'cdp-mouse' || retryDispatch?.button !== 'left'
    || retryDispatch?.clickCount !== 1 || retryDispatch?.x !== retryPoint.x
    || retryDispatch?.y !== retryPoint.y || retry.pressCount !== retryPresses.length
    || retryPresses.length > 1 || retryPresses.some((press) => (
      press?.operation !== operation || press?.instanceId !== instanceId
      || press?.tag !== 'BUTTON' || press?.trusted !== true || press?.pointerType !== 'mouse'
      || !Number.isFinite(press?.x) || !Number.isFinite(press?.y)
      || Math.abs(press.x - retryPoint.x) > 0.75
      || Math.abs(press.y - retryPoint.y) > 0.75
    ))) reasons.push('exact native disabled retry dispatch');
  if (canonicalJson(observation?.heldRaw) !== canonicalJson(observation?.beforeRaw)
    || canonicalJson(observation?.retriedRaw) !== canonicalJson(observation?.beforeRaw)) {
    reasons.push('pre-durable bytes unchanged');
  }
  const liveProjection = (state) => canonicalJson({
    save: state?.save,
    inventory: state?.inventory,
    rng: {
      seed: state?.persistence?.runtime?.sessionSeed,
      ordinal: state?.persistence?.runtime?.sessionOrdinal,
      draws: state?.persistence?.runtime?.sessionDraws,
    },
  });
  if (liveProjection(observation?.heldState) !== liveProjection(observation?.beforeState)
    || liveProjection(observation?.retriedState) !== liveProjection(observation?.beforeState)) {
    reasons.push('no optimistic live publication');
  }
  const pendingPhase = (state, detail) => {
    const coordinator = state?.engineering?.actionCoordinator;
    const button = detail?.actionButtons?.find((candidate) => candidate.operation === operation
      && candidate.instanceId === instanceId);
    return coordinator?.inFlight === true && coordinator?.owner?.busy === true
      && coordinator?.owner?.operation === `arc2.${operation}`
      && coordinator?.hold?.phase === 'holding'
      && coordinator?.hold?.operation === `arc2.${operation}`
      && detail?.busy === 'true' && detail?.statusKind === 'pending'
      && detail?.diagnostics?.pendingWork === 1
      && button?.disabled === true;
  };
  if (!pendingPhase(observation?.heldState, observation?.heldDetail)
    || !pendingPhase(observation?.retriedState, observation?.retriedDetail)) {
    reasons.push('single held F4 owner/no retry');
  }
  return { ok: reasons.length === 0, reasons };
}

export function assessArc2InventoryPreDurableRefusal(observation) {
  const operation = observation?.operation;
  const instanceId = observation?.instanceId;
  if (!ARC2_INVENTORY_OPERATIONS.includes(operation) || !nonEmptyString(instanceId)) {
    throw new TypeError('Arc 2 pre-durable refusal requires one operation and exact instance id');
  }
  const reasons = [];
  if (observation?.armed !== true || observation?.released !== false
    || !assessInventoryOperationActivation({
      point: observation?.point,
      interaction: observation?.activation,
    }, operation, instanceId, 1).ok) reasons.push('trusted refusal activation/authority seam');
  if (canonicalJson(observation?.afterRaw) !== canonicalJson(observation?.beforeRaw)) {
    reasons.push('pre-durable refusal bytes/receipt/RNG unchanged');
  }
  const liveProjection = (state) => canonicalJson({
    save: state?.save,
    inventory: state?.inventory,
    route: {
      mode: state?.mode, gal: state?.gal, star: state?.star, planet: state?.planet,
      atlasCount: state?.atlasCount, atlasTravelable: state?.atlasTravelable,
    },
    rng: {
      seed: state?.persistence?.runtime?.sessionSeed,
      ordinal: state?.persistence?.runtime?.sessionOrdinal,
      draws: state?.persistence?.runtime?.sessionDraws,
    },
  });
  if (liveProjection(observation?.afterState) !== liveProjection(observation?.beforeState)) {
    reasons.push('pre-durable refusal live state unchanged');
  }
  const detail = observation?.detail;
  if (detail?.open !== true || detail?.detailId !== instanceId || detail?.busy !== 'false'
    || detail?.statusKind !== 'unavailable' || detail?.diagnostics?.pendingWork !== 0
    || detail?.diagnostics?.lastAction?.operation !== operation
    || detail?.diagnostics?.lastAction?.instanceId !== instanceId
    || detail?.diagnostics?.lastAction?.kind !== 'unavailable'
    || !actionCoordinatorSettled(observation?.afterState)) {
    reasons.push('pre-durable refusal settled without owner/retry');
  }
  return { ok: reasons.length === 0, reasons };
}

const countDelta = (before, after) => {
  const keys = [...new Set([...Object.keys(before || {}), ...Object.keys(after || {})])].sort();
  return Object.fromEntries(keys.map((key) => [key, (after?.[key] || 0) - (before?.[key] || 0)])
    .filter(([, value]) => value !== 0));
};

export function assessArc2InventoryOperationOutcome(observation) {
  const operation = observation?.operation;
  const instanceId = observation?.instanceId;
  if (!ARC2_INVENTORY_OPERATIONS.includes(operation) || !nonEmptyString(instanceId)) {
    throw new TypeError('Arc 2 operation outcome requires one operation and exact instance id');
  }
  const reasons = [];
  const before = observation?.beforeRaw;
  const after = observation?.afterRaw;
  const beforeState = observation?.beforeState;
  const afterState = observation?.afterState;
  const beforeInventory = before?.arc2?.inventory;
  const afterInventory = after?.arc2?.inventory;
  const beforeAuthority = before?.authority?.sessionRng;
  const afterAuthority = after?.authority?.sessionRng;
  if (!arc2InventoryCarrierLegacyCargoParity(before, beforeState)
    || !arc2InventoryCarrierLegacyCargoParity(after, afterState)) {
    reasons.push('Arc 2 carrier/legacy items/equip/cargo parity');
  }
  const beforeReceiptKeys = Array.isArray(before?.receiptKeys) ? before.receiptKeys : [];
  const afterReceiptKeys = Array.isArray(after?.receiptKeys) ? after.receiptKeys : [];
  const beforeKeySet = new Set(beforeReceiptKeys);
  const newReceiptKeys = afterReceiptKeys.filter((key) => !beforeKeySet.has(key));
  const receiptIndex = afterReceiptKeys.indexOf(newReceiptKeys[0]);
  const receipt = receiptIndex >= 0 ? after?.receiptRows?.[receiptIndex] : null;
  const oldReceiptPrefixStable = beforeReceiptKeys.length > 0
    && beforeReceiptKeys.length === before?.receiptRawRows?.length
    && beforeReceiptKeys.length === before?.receiptRows?.length
    && afterReceiptKeys.length === after?.receiptRawRows?.length
    && afterReceiptKeys.length === after?.receiptRows?.length
    && new Set(afterReceiptKeys).size === afterReceiptKeys.length
    && beforeReceiptKeys.every((key, index) => afterReceiptKeys[index] === key
      && before.receiptRawRows[index] === after.receiptRawRows[index]
      && canonicalJson(before.receiptRows[index]) === canonicalJson(after.receiptRows[index]));
  const beforeRuntime = beforeState?.persistence?.runtime;
  const afterRuntime = afterState?.persistence?.runtime;
  if (before?.carrierJson === after?.carrierJson
    || after?.revision !== before?.revision + 1
    || afterInventory?.revision !== beforeInventory?.revision + 1
    || before?.authorityVersion !== 1 || after?.authorityVersion !== 1
    || before?.authorityJson !== JSON.stringify(before?.authority)
    || after?.authorityJson !== JSON.stringify(after?.authority)
    || !safeInt(beforeAuthority?.seed) || beforeAuthority.seed > 0xFFFF_FFFF
    || afterAuthority?.seed !== beforeAuthority.seed
    || afterAuthority?.ordinal !== beforeAuthority?.ordinal + 1
    || canonicalJson(afterAuthority?.draws) !== canonicalJson(beforeAuthority?.draws)
    || beforeRuntime?.sessionSeed !== beforeAuthority?.seed
    || beforeRuntime?.sessionOrdinal !== beforeAuthority?.ordinal
    || canonicalJson(beforeRuntime?.sessionDraws) !== canonicalJson(beforeAuthority?.draws)
    || afterRuntime?.sessionSeed !== afterAuthority?.seed
    || afterRuntime?.sessionOrdinal !== afterAuthority?.ordinal
    || canonicalJson(afterRuntime?.sessionDraws) !== canonicalJson(afterAuthority?.draws)
    || beforeRuntime?.revision !== before?.revision || afterRuntime?.revision !== after?.revision
    || !oldReceiptPrefixStable || newReceiptKeys.length !== 1
    || newReceiptKeys[0] !== `receipt:${beforeAuthority?.ordinal}`
    || afterReceiptKeys.length !== beforeReceiptKeys.length + 1
    || receipt?.ordinal !== beforeAuthority?.ordinal || receipt?.kind !== `arc2-${operation}`
    || receipt?.witness !== `arc2:${operation}:${beforeAuthority?.ordinal}:${instanceId}:${afterInventory?.revision}`
    || after?.receiptRawRows?.[receiptIndex] !== JSON.stringify(receipt)) {
    reasons.push('one revision/ordinal/receipt with unchanged RNG draws');
  }
  const beforeEntry = beforeInventory?.entries?.find(({ instance }) => instance.instanceId === instanceId);
  const afterEntry = afterInventory?.entries?.find(({ instance }) => instance.instanceId === instanceId);
  const beforePending = beforeInventory?.pendingRewards?.find(({ instance }) => instance.instanceId === instanceId);
  const afterPending = afterInventory?.pendingRewards?.find(({ instance }) => instance.instanceId === instanceId);
  const beforeEquipped = beforeInventory?.equipped?.some(({ instanceId: id }) => id === instanceId) === true;
  const afterEquipped = afterInventory?.equipped?.some(({ instanceId: id }) => id === instanceId) === true;
  const beforeItems = exactCountRecord(before?.legacy?.items, 1);
  const afterItems = exactCountRecord(after?.legacy?.items, 1);
  const beforeCargo = exactCountRecord(before?.legacy?.cargo, 0);
  const afterCargo = exactCountRecord(after?.legacy?.cargo, 0);
  const cargoDelta = countDelta(beforeCargo, afterCargo);
  const itemDelta = countDelta(beforeItems, afterItems);
  const exactRows = (actual, expected) => Array.isArray(actual) && Array.isArray(expected)
    && canonicalJson(actual) === canonicalJson(expected);
  const exactBindings = (actual, expected) => Array.isArray(actual) && Array.isArray(expected)
    && canonicalJson([...actual].sort((left, right) => canonicalJson(left).localeCompare(canonicalJson(right))))
      === canonicalJson([...expected].sort((left, right) => canonicalJson(left).localeCompare(canonicalJson(right))));
  const stableEnvelope = beforeInventory && afterInventory
    && beforeInventory.schema === afterInventory.schema
    && beforeInventory.capacity === afterInventory.capacity;
  const expectedEquipped = beforeEntry
    ? [...(beforeInventory?.equipped || []).filter((binding) => binding.slot !== beforeEntry.instance.slot),
      { slot: beforeEntry.instance.slot, instanceId }]
    : null;
  let transition = false;
  if (operation === 'equip') {
    transition = !!beforeEntry && !!afterEntry && !beforeEquipped && afterEquipped && stableEnvelope
      && exactRows(afterInventory?.entries, beforeInventory?.entries)
      && exactRows(afterInventory?.pendingRewards, beforeInventory?.pendingRewards)
      && exactBindings(afterInventory?.equipped, expectedEquipped)
      && canonicalJson(beforeItems) === canonicalJson(afterItems)
      && canonicalJson(beforeCargo) === canonicalJson(afterCargo);
  } else if (operation === 'unequip') {
    transition = !!beforeEntry && !!afterEntry && beforeEquipped && !afterEquipped && stableEnvelope
      && exactRows(afterInventory?.entries, beforeInventory?.entries)
      && exactRows(afterInventory?.pendingRewards, beforeInventory?.pendingRewards)
      && exactBindings(afterInventory?.equipped,
        beforeInventory?.equipped?.filter((binding) => binding.instanceId !== instanceId))
      && canonicalJson(beforeItems) === canonicalJson(afterItems)
      && canonicalJson(beforeCargo) === canonicalJson(afterCargo);
  } else if (operation === 'salvage') {
    transition = !!beforeEntry && !afterEntry && !beforePending && !afterPending && !beforeEquipped
      && stableEnvelope
      && exactRows(afterInventory?.entries,
        beforeInventory?.entries?.filter((entry) => entry.instance.instanceId !== instanceId))
      && exactRows(afterInventory?.pendingRewards, beforeInventory?.pendingRewards)
      && exactBindings(afterInventory?.equipped, beforeInventory?.equipped)
      && canonicalJson(itemDelta) === canonicalJson({ [beforeEntry?.instance?.baseId]: -1 })
      && canonicalJson(cargoDelta) === canonicalJson(observation?.expectedCargoDelta);
  } else {
    transition = !beforeEntry && !!beforePending && !!afterEntry && !afterPending && !afterEquipped
      && stableEnvelope
      && exactRows(afterInventory?.entries, [...(beforeInventory?.entries || []), {
        instance: beforePending.instance, favorite: false, locked: false,
      }])
      && exactRows(afterInventory?.pendingRewards,
        beforeInventory?.pendingRewards?.filter((reward) => reward.instance.instanceId !== instanceId))
      && exactBindings(afterInventory?.equipped, beforeInventory?.equipped)
      && canonicalJson(beforeItems) === canonicalJson(afterItems)
      && canonicalJson(beforeCargo) === canonicalJson(afterCargo);
  }
  if (!transition) reasons.push(`exact ${operation} publication`);
  const detail = observation?.afterDetail;
  const lastAction = detail?.diagnostics?.lastAction;
  const expectedInverse = operation === 'equip' ? 'unequip' : 'equip';
  const detailGreen = operation === 'salvage'
    ? detail?.open === false && detail?.sheetHidden === true && detail?.ariaHidden === 'true'
      && detail?.bodyChildren === 0 && detail?.diagnostics?.activeCount === 0
      && detail?.diagnostics?.retainedCount === 0
      && detail?.diagnostics?.pendingWork === 0 && detail?.diagnostics?.selectedInstanceId === null
    : detail?.open === true && detail?.detailId === instanceId && detail?.busy === 'false'
      && detail?.statusKind === 'committed' && detail?.diagnostics?.activeCount === 1
      && detail?.diagnostics?.pendingWork === 0 && detail?.actions?.includes(expectedInverse) === true;
  if (!detailGreen || lastAction?.operation !== operation || lastAction?.instanceId !== instanceId
    || lastAction?.kind !== 'committed') reasons.push('committed detail/lifecycle publication');
  const unrelated = (state) => canonicalJson({
    mode: state?.mode, gal: state?.gal, star: state?.star, planet: state?.planet,
    atlasCount: state?.atlasCount, atlasTravelable: state?.atlasTravelable,
    landed: state?.save?.landed, customNames: state?.save?.customNames,
    savedView: state?.save?.savedView,
  });
  if (unrelated(afterState) !== unrelated(beforeState)
    || canonicalJson(after?.legacy?.log) !== canonicalJson(before?.legacy?.log)
    || !actionCoordinatorSettled(afterState, operation === 'equip' ? null : operation)) {
    reasons.push('unrelated product continuity/owner release');
  }
  return { ok: reasons.length === 0, reasons };
}

export function assessInventoryRowActivation(observation, expectedInstanceId) {
  if (!nonEmptyString(expectedInstanceId)) {
    throw new TypeError('Inventory row activation requires one exact instance id');
  }
  const reasons = [];
  const point = observation?.point;
  const pointer = observation?.pointer;
  if (!point || point.hitOwned !== true || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
    reasons.push('row target point');
  }
  if (!pointer || pointer.instanceId !== expectedInstanceId || pointer.tag !== 'BUTTON'
    || pointer.trusted !== true || pointer.pointerType !== 'mouse'
    || !Number.isFinite(pointer.x) || !Number.isFinite(pointer.y)) {
    reasons.push('trusted row pointer');
  } else if (point && Number.isFinite(point.x) && Number.isFinite(point.y)
    && (Math.abs(pointer.x - point.x) > 0.75 || Math.abs(pointer.y - point.y) > 0.75)) {
    reasons.push('row point/receipt binding');
  }
  return { ok: reasons.length === 0, reasons };
}

export function assessInventoryDetailClose(observation, expectedInstanceId) {
  if (!nonEmptyString(expectedInstanceId)) {
    throw new TypeError('Inventory detail Close requires one exact focus-return instance id');
  }
  const reasons = [];
  const point = observation?.point;
  const pointer = observation?.pointer;
  if (!point || point.ok !== true || point.tag !== 'BUTTON' || point.owner !== 'inventory-sheet'
    || !Number.isFinite(point.x) || !Number.isFinite(point.y)
    || !Number.isFinite(point.width) || point.width < 44
    || !Number.isFinite(point.height) || point.height < 44) reasons.push('Close target point');
  if (!pointer || pointer.tag !== 'BUTTON' || pointer.closeOwner !== 'inventory-sheet'
    || pointer.trusted !== true || pointer.pointerType !== 'mouse'
    || !Number.isFinite(pointer.x) || !Number.isFinite(pointer.y)) reasons.push('trusted Close pointer');
  else if (point && Number.isFinite(point.x) && Number.isFinite(point.y)
    && (Math.abs(pointer.x - point.x) > 0.75 || Math.abs(pointer.y - point.y) > 0.75)) {
    reasons.push('Close point/receipt binding');
  }
  const closed = observation?.closed;
  if (!closed || closed.sheetPresent !== true || closed.open !== false
    || closed.hidden !== true || closed.ariaHidden !== 'true' || closed.bodyChildren !== 0
    || closed.focusInstanceId !== expectedInstanceId || closed.panelPresent !== true
    || closed.panelDisplay !== 'block' || closed.panelAriaHidden !== 'false'
    || closed.panelOpen !== 'inventory' || closed.openerPresent !== true
    || closed.inventoryExpanded !== 'true' || closed.panelInert !== false
    || closed.diagnostics?.activeCount !== 0 || closed.diagnostics?.retainedCount !== 0
    || closed.diagnostics?.pendingWork !== 0 || closed.diagnostics?.selectedInstanceId !== null) {
    reasons.push('closed focus/zero ownership');
  }
  return { ok: reasons.length === 0, reasons };
}

export function assessInventoryPanelClose(observation) {
  const reasons = [];
  const point = observation?.point;
  const pointer = observation?.pointer;
  if (!point || point.ok !== true || point.owner !== 'inventory' || point.tag !== 'BUTTON'
    || !Number.isFinite(point.x) || !Number.isFinite(point.y)
    || !Number.isFinite(point.width) || point.width < 44
    || !Number.isFinite(point.height) || point.height < 44) reasons.push('panel Close target point');
  if (!pointer || pointer.tag !== 'BUTTON' || pointer.panelCloseOwner !== 'inventory'
    || pointer.trusted !== true || pointer.pointerType !== 'mouse'
    || !Number.isFinite(pointer.x) || !Number.isFinite(pointer.y)) {
    reasons.push('trusted panel Close pointer');
  } else if (point && Number.isFinite(point.x) && Number.isFinite(point.y)
    && (Math.abs(pointer.x - point.x) > 0.75 || Math.abs(pointer.y - point.y) > 0.75)) {
    reasons.push('panel Close point/receipt binding');
  }
  const settled = observation?.settled;
  if (!settled || settled.panelPresent !== true || settled.display !== 'none'
    || settled.ariaHidden !== 'true' || settled.openerPresent !== true
    || settled.panelOpen !== null || settled.inventoryExpanded !== 'false'
    || settled.focusId !== 'railinventory' || settled.diagnostics?.activeCount !== 0
    || settled.diagnostics?.retainedCount !== 0 || settled.diagnostics?.pendingWork !== 0
    || settled.diagnostics?.selectedInstanceId !== null) {
    reasons.push('closed panel/focus/zero ownership');
  }
  return { ok: reasons.length === 0, reasons };
}

/* A carrier surviving reload does not prove that the transaction receipt or
   its F4 authority survived. Compare the full receipt store at three distinct
   levels (keys, exact raw bytes, parsed semantics), then bind the exact Equip
   receipt to the pre-commit ordinal. Only SessionRNG is stable across the
   document boundary: activePlayMs, revisions, commits, lease state and tokens
   may advance through legitimate receipt-free checkpoints. */
export function assessInventoryReloadDurability(observation, expectedInstanceId, expectedInventoryRevision) {
  if (!nonEmptyString(expectedInstanceId) || !safeInt(expectedInventoryRevision)) {
    throw new TypeError('Inventory reload durability requires one exact instance id and inventory revision');
  }
  const committed = observation?.committed;
  const reloaded = observation?.reloaded;
  const committedRuntime = observation?.committedRuntime;
  const reloadedRuntime = observation?.reloadedRuntime;
  const committedKeys = Array.isArray(committed?.receiptKeys) ? committed.receiptKeys : [];
  const reloadedKeys = Array.isArray(reloaded?.receiptKeys) ? reloaded.receiptKeys : [];
  const coherentReceiptRows = (evidence, keys) => keys.every((key, index) => {
    const raw = evidence?.receiptRawRows?.[index];
    const row = evidence?.receiptRows?.[index];
    if (!nonEmptyString(key) || typeof raw !== 'string' || !row || typeof row !== 'object'
      || Array.isArray(row) || !safeInt(row.ordinal) || key !== `receipt:${row.ordinal}`) return false;
    try { return canonicalJson(JSON.parse(raw)) === canonicalJson(row); }
    catch { return false; }
  });
  const receiptEvidenceComplete = committedKeys.length >= 2 && reloadedKeys.length >= 2
    && committedKeys.length === committed?.receiptRawRows?.length
    && committedKeys.length === committed?.receiptRows?.length
    && reloadedKeys.length === reloaded?.receiptRawRows?.length
    && reloadedKeys.length === reloaded?.receiptRows?.length
    && new Set(committedKeys).size === committedKeys.length
    && new Set(reloadedKeys).size === reloadedKeys.length
    && coherentReceiptRows(committed, committedKeys)
    && coherentReceiptRows(reloaded, reloadedKeys);
  const committedRng = committed?.authority?.sessionRng;
  const reloadedRng = reloaded?.authority?.sessionRng;
  const rngProjection = (rng) => canonicalJson({
    seed: rng?.seed,
    ordinal: rng?.ordinal,
    draws: rng?.draws,
  });
  const runtimeProjection = (runtime) => canonicalJson({
    seed: runtime?.sessionSeed,
    ordinal: runtime?.sessionOrdinal,
    draws: runtime?.sessionDraws,
  });
  const expectedReceiptOrdinal = safeInt(committedRng?.ordinal) && committedRng.ordinal > 0
    ? committedRng.ordinal - 1 : null;
  const expectedReceiptKey = expectedReceiptOrdinal === null ? null : `receipt:${expectedReceiptOrdinal}`;
  const committedReceiptIndex = expectedReceiptKey === null ? -1 : committedKeys.indexOf(expectedReceiptKey);
  const reloadedReceiptIndex = expectedReceiptKey === null ? -1 : reloadedKeys.indexOf(expectedReceiptKey);
  const committedReceipt = committedReceiptIndex >= 0 ? committed?.receiptRows?.[committedReceiptIndex] : null;
  const reloadedReceipt = reloadedReceiptIndex >= 0 ? reloaded?.receiptRows?.[reloadedReceiptIndex] : null;
  const expectedWitness = expectedReceiptOrdinal === null ? null
    : `arc2:equip:${expectedReceiptOrdinal}:${expectedInstanceId}:${expectedInventoryRevision}`;
  const drawsAreObjects = !!(committedRng?.draws && typeof committedRng.draws === 'object'
    && !Array.isArray(committedRng.draws) && reloadedRng?.draws && typeof reloadedRng.draws === 'object'
    && !Array.isArray(reloadedRng.draws) && committedRuntime?.sessionDraws
    && typeof committedRuntime.sessionDraws === 'object' && !Array.isArray(committedRuntime.sessionDraws)
    && reloadedRuntime?.sessionDraws && typeof reloadedRuntime.sessionDraws === 'object'
    && !Array.isArray(reloadedRuntime.sessionDraws));
  const seedIsUint32 = safeInt(committedRng?.seed) && committedRng.seed <= 0xFFFF_FFFF;
  const ok = receiptEvidenceComplete
    && canonicalJson(reloadedKeys) === canonicalJson(committedKeys)
    && canonicalJson(reloaded?.receiptRawRows) === canonicalJson(committed?.receiptRawRows)
    && canonicalJson(reloaded?.receiptRows) === canonicalJson(committed?.receiptRows)
    && committed?.authorityVersion === 1 && reloaded?.authorityVersion === 1
    && committed?.authorityJson === JSON.stringify(committed?.authority)
    && reloaded?.authorityJson === JSON.stringify(reloaded?.authority)
    && seedIsUint32 && safeInt(committedRng?.ordinal) && drawsAreObjects
    && rngProjection(reloadedRng) === rngProjection(committedRng)
    && runtimeProjection(committedRuntime) === rngProjection(committedRng)
    && runtimeProjection(reloadedRuntime) === rngProjection(reloadedRng)
    && committedReceiptIndex >= 0 && reloadedReceiptIndex === committedReceiptIndex
    && committedReceipt?.ordinal === expectedReceiptOrdinal
    && reloadedReceipt?.ordinal === expectedReceiptOrdinal
    && committedReceipt?.kind === 'arc2-equip' && reloadedReceipt?.kind === 'arc2-equip'
    && committedReceipt?.witness === expectedWitness && reloadedReceipt?.witness === expectedWitness
    && committed?.receiptRawRows?.[committedReceiptIndex] === JSON.stringify(committedReceipt)
    && reloaded?.receiptRawRows?.[reloadedReceiptIndex] === JSON.stringify(reloadedReceipt);
  return { ok, reasons: ok ? [] : ['durable receipt/F4 authority reload'] };
}

export function assessInventoryOperationSequenceDurability(observation, expectedOperations) {
  if (!Array.isArray(expectedOperations) || expectedOperations.length < 1
    || expectedOperations.some((entry) => !ARC2_INVENTORY_OPERATIONS.includes(entry?.operation)
      || !nonEmptyString(entry?.instanceId) || !safeInt(entry?.receiptOrdinal)
      || !safeInt(entry?.inventoryRevision))) {
    throw new TypeError('Inventory operation durability requires one exact operation ledger');
  }
  const committed = observation?.committed;
  const reloaded = observation?.reloaded;
  const committedRuntime = observation?.committedRuntime;
  const reloadedRuntime = observation?.reloadedRuntime;
  const committedKeys = Array.isArray(committed?.receiptKeys) ? committed.receiptKeys : [];
  const reloadedKeys = Array.isArray(reloaded?.receiptKeys) ? reloaded.receiptKeys : [];
  const coherentRows = (evidence, keys) => keys.length === evidence?.receiptRawRows?.length
    && keys.length === evidence?.receiptRows?.length
    && new Set(keys).size === keys.length
    && keys.every((key, index) => {
      const raw = evidence.receiptRawRows[index];
      const row = evidence.receiptRows[index];
      if (!nonEmptyString(key) || typeof raw !== 'string' || !row || typeof row !== 'object'
        || Array.isArray(row) || !safeInt(row.ordinal) || key !== `receipt:${row.ordinal}`) return false;
      try {
        return canonicalJson(JSON.parse(raw)) === canonicalJson(row) && raw === JSON.stringify(row);
      } catch { return false; }
    });
  const committedRng = committed?.authority?.sessionRng;
  const reloadedRng = reloaded?.authority?.sessionRng;
  const rngProjection = (rng) => canonicalJson({ seed: rng?.seed, ordinal: rng?.ordinal, draws: rng?.draws });
  const runtimeProjection = (runtime) => canonicalJson({
    seed: runtime?.sessionSeed, ordinal: runtime?.sessionOrdinal, draws: runtime?.sessionDraws,
  });
  const sequenceContiguous = expectedOperations.every((entry, index) => index === 0
    || (entry.receiptOrdinal === expectedOperations[index - 1].receiptOrdinal + 1
      && entry.inventoryRevision === expectedOperations[index - 1].inventoryRevision + 1));
  const ledgerBound = expectedOperations.every((entry) => {
    const key = `receipt:${entry.receiptOrdinal}`;
    const committedIndex = committedKeys.indexOf(key);
    const reloadedIndex = reloadedKeys.indexOf(key);
    const expectedWitness = `arc2:${entry.operation}:${entry.receiptOrdinal}:${entry.instanceId}:${entry.inventoryRevision}`;
    const committedReceipt = committedIndex >= 0 ? committed?.receiptRows?.[committedIndex] : null;
    const reloadedReceipt = reloadedIndex >= 0 ? reloaded?.receiptRows?.[reloadedIndex] : null;
    return committedIndex >= 0 && reloadedIndex === committedIndex
      && committedReceipt?.ordinal === entry.receiptOrdinal
      && reloadedReceipt?.ordinal === entry.receiptOrdinal
      && committedReceipt?.kind === `arc2-${entry.operation}`
      && reloadedReceipt?.kind === `arc2-${entry.operation}`
      && committedReceipt?.witness === expectedWitness
      && reloadedReceipt?.witness === expectedWitness
      && committed.receiptRawRows[committedIndex] === JSON.stringify(committedReceipt)
      && reloaded.receiptRawRows[reloadedIndex] === JSON.stringify(reloadedReceipt);
  });
  const last = expectedOperations.at(-1);
  const ok = committedKeys.length >= expectedOperations.length + 1
    && coherentRows(committed, committedKeys) && coherentRows(reloaded, reloadedKeys)
    && canonicalJson(reloadedKeys) === canonicalJson(committedKeys)
    && canonicalJson(reloaded?.receiptRawRows) === canonicalJson(committed?.receiptRawRows)
    && canonicalJson(reloaded?.receiptRows) === canonicalJson(committed?.receiptRows)
    && committed?.authorityVersion === 1 && reloaded?.authorityVersion === 1
    && committed?.authorityJson === JSON.stringify(committed?.authority)
    && reloaded?.authorityJson === JSON.stringify(reloaded?.authority)
    && safeInt(committedRng?.seed) && committedRng.seed <= 0xFFFF_FFFF
    && committedRng?.draws && typeof committedRng.draws === 'object' && !Array.isArray(committedRng.draws)
    && reloadedRng?.draws && typeof reloadedRng.draws === 'object' && !Array.isArray(reloadedRng.draws)
    && committedRuntime?.sessionDraws && typeof committedRuntime.sessionDraws === 'object'
    && !Array.isArray(committedRuntime.sessionDraws)
    && reloadedRuntime?.sessionDraws && typeof reloadedRuntime.sessionDraws === 'object'
    && !Array.isArray(reloadedRuntime.sessionDraws)
    && rngProjection(reloadedRng) === rngProjection(committedRng)
    && runtimeProjection(committedRuntime) === rngProjection(committedRng)
    && runtimeProjection(reloadedRuntime) === rngProjection(reloadedRng)
    && sequenceContiguous && ledgerBound
    && committedRng?.ordinal === last.receiptOrdinal + 1;
  return { ok, reasons: ok ? [] : ['durable Arc 2 operation ledger/F4 authority reload'] };
}

/* Arc 4's terminal burn is setup for the player-live Feed proof that follows.
   Prefer only the missing Feed prerequisite while preserving the production
   card's first-ready order after both exact ownership rows exist. */
export function selectArc5FeedFixtureBurnVerb(captureState, rows) {
  const ready = Array.isArray(rows) ? rows.filter((row) => (
    ['tame', 'scavenge', 'sample'].includes(row?.verb)
      && row?.status === 'ready' && row?.button?.modelEnabled === 'true'
  )) : [];
  if (ready.length === 0) return null;
  const hasCreature = Array.isArray(captureState?.creatures)
    && captureState.creatures.some((row) => (
      row?.assignment === null && safeInt(row?.fed ?? 0) && (row?.fed ?? 0) < 200
    ));
  const hasFlora = Array.isArray(captureState?.specimenLots)
    && captureState.specimenLots.some((row) => (
      row?.kind === 'flora' && safeInt(row?.quantity) && row.quantity > 0
  ));
  const preferred = !hasCreature ? 'tame' : !hasFlora ? 'scavenge' : null;
  if (preferred !== null) return ready.find((row) => row.verb === preferred)?.verb ?? null;
  return ready[0].verb;
}

/* Feed can legitimately consume the last currently eligible companion or
   flora lot. Derive the post-commit browser oracle from the durable
   predecessor instead of reusing the pre-action `ready` predicate. */
export function compendiumFeedSuccessorAvailability({
  readyCompanionCountBefore,
  selectedCompanionReadyAfter,
  floraLotCountBefore,
  selectedFloraLotPresentAfter,
} = {}) {
  if (!safeInt(readyCompanionCountBefore) || readyCompanionCountBefore < 1
    || typeof selectedCompanionReadyAfter !== 'boolean'
    || !safeInt(floraLotCountBefore) || floraLotCountBefore < 1
    || typeof selectedFloraLotPresentAfter !== 'boolean') {
    throw new TypeError(
      'Compendium Feed successor availability requires an eligible exact predecessor',
    );
  }
  const readyCompanionCountAfter = readyCompanionCountBefore
    - (selectedCompanionReadyAfter ? 0 : 1);
  const floraLotCountAfter = floraLotCountBefore
    - (selectedFloraLotPresentAfter ? 0 : 1);
  if (readyCompanionCountAfter === 0) return 'no-eligible-companion';
  if (floraLotCountAfter === 0) return 'no-flora';
  return 'ready';
}

export function compendiumFeedDetailPresentationPasses(
  observation, expectedAvailability,
) {
  if (!['ready', 'no-eligible-companion', 'no-flora'].includes(expectedAvailability)) {
    throw new TypeError('Compendium Feed presentation requires an exact availability');
  }
  const common = observation?.feedState === expectedAvailability
    && safeInt(observation?.summaryCount)
    && typeof observation?.confirmPresent === 'boolean'
    && safeInt(observation?.radioCount) && observation.radioCount > 0
    && typeof observation?.allRadiosDisabled === 'boolean'
    && observation?.backEnabled === true
    && observation?.closeEnabled === true;
  if (!common) return false;
  return expectedAvailability === 'ready'
    ? observation.summaryCount === 1
      && observation.confirmPresent === true
      && observation.confirmDisabled === true
      && observation.radioCount >= 2
      && observation.allRadiosDisabled === false
    : observation.summaryCount === 0
      && observation.confirmPresent === false
      && observation.confirmDisabled === null
      && observation.allRadiosDisabled === true;
}

/* Runtime.evaluate parses template-literal contents only after the expensive
   browser route reaches them. Keep the Feed settlement expression in one pure
   builder so the browser-free contract can compile the exact generated bytes
   and negative-control both missing and surplus closure braces. */
export function buildCompendiumFeedChoiceSettlementExpression(
  prefix, selector, feedUiExpression,
) {
  if (!prefix || typeof prefix !== 'object' || Array.isArray(prefix)
    || !nonEmptyString(selector) || !nonEmptyString(feedUiExpression)) {
    throw new TypeError(
      'Compendium Feed settlement expression requires exact prefix, selector and UI expression',
    );
  }
  return `(()=>{const prefix=${JSON.stringify(prefix)},h=window.__cfFeedChoiceHarness,
    selector=${JSON.stringify(selector)},labels=[...document.querySelectorAll(selector)],
    label=labels[0]??null,radio=label?.control??null,radioId=radio?.id??null,
    ui=${feedUiExpression};return {
      ...prefix,receipt:h?.receipt??{pointerdowns:[],clicks:[],inputs:[],changes:[]},
      settled:{selectorCount:labels.length,
        radioIdMatchCount:radioId?[...document.querySelectorAll('[id]')]
          .filter((node)=>node.id===radioId).length:0,
        labelOwnerCount:radioId?[...document.querySelectorAll('label[for]')]
          .filter((node)=>node.htmlFor===radioId).length:0,
        labelFor:label?.htmlFor??null,labelConnected:label?.isConnected===true,
        labelContainsRadio:!!label&&!!radio&&label.contains(radio),
        labelNodeToken:h?.tokenOf?.(label)??null,radioId,
        radioNodeToken:h?.tokenOf?.(radio)??null,
        radioConnected:radio?.isConnected===true,radioDisabled:radio?.disabled??null,
        radioChecked:radio?.checked??null,radioChoice:radio?.dataset.arc5FeedChoice??null,
        radioCreatureId:radio?.dataset.arc5FeedCreatureId??null,
        radioFoodLotId:radio?.dataset.arc5FeedFoodLotId??null,
        ui:{document:ui.document,controller:{...(ui.controller??{}),feedState:ui.feedState},
          selectedCreatureId:ui.selectedCreatureId,selectedFoodLotId:ui.selectedFoodLotId}}}})()`;
}

/* A Feed choice is not the label that happens to contain its radio. Bind the
   exact current nested native control before dispatch, re-query that same
   identity at dispatch time, and require the trusted browser event chain to
   settle in both DOM and controller state before another choice may start. */
export function assessCompendiumFeedChoiceActivation(observation, expected) {
  if (!['creature', 'flora'].includes(expected?.kind)
    || !nonEmptyString(expected?.expectedId)
    || (expected?.expectedPriorId !== null
      && !nonEmptyString(expected?.expectedPriorId))
    || !nonEmptyString(expected?.documentToken)
    || !safeInt(expected?.generation)
    || !nonEmptyString(expected?.logicalId)
    || !nonEmptyString(expected?.surfaceKey)
    || !nonEmptyString(expected?.contextKey)) {
    throw new TypeError('Compendium Feed choice evidence requires one exact current choice identity');
  }
  const reasons = [];
  const add = (reason, condition) => { if (!condition) reasons.push(reason); };
  const currentDocument = (candidate) => candidate?.token === expected.documentToken
    && candidate?.generation === expected.generation
    && candidate?.logicalId === expected.logicalId
    && candidate?.surfaceKey === expected.surfaceKey
    && candidate?.contextKey === expected.contextKey;
  const exactChoice = (candidate) => candidate?.radioChoice === expected.kind
    && candidate?.radioCreatureId === (expected.kind === 'creature' ? expected.expectedId : null)
    && candidate?.radioFoodLotId === (expected.kind === 'flora' ? expected.expectedId : null);
  const currentController = (candidate) => candidate?.attachedMountCount === 1
    && candidate?.delegatedListenerCount === 2
    && candidate?.pendingWork === 0
    && candidate?.convergenceLatched === false
    && candidate?.feedState === 'ready'
    && candidate?.surfaceKey === expected.surfaceKey
    && candidate?.contextKey === expected.contextKey;
  const prepared = observation?.prepared;
  const dispatch = observation?.dispatch;
  const settled = observation?.settled;
  const preparedRadioId = prepared?.radioId;
  const preparedNodeToken = prepared?.radioNodeToken;

  add('exact Feed choice expectation', observation?.kind === expected.kind
    && observation?.expectedId === expected.expectedId
    && observation?.expectedPriorId === expected.expectedPriorId);
  add('exact current Feed document', currentDocument(observation?.document));
  add('current Feed controller', currentController(prepared?.controller));
  add('unique label-radio ownership', prepared?.selectorCount === 1
    && prepared?.radioIdMatchCount === 1
    && prepared?.labelOwnerCount === 1
    && prepared?.labelConnected === true
    && prepared?.labelContainsRadio === true
    && nonEmptyString(prepared?.labelNodeToken)
    && nonEmptyString(preparedRadioId)
    && nonEmptyString(preparedNodeToken)
    && prepared?.labelFor === preparedRadioId
    && exactChoice(prepared));
  add('ready unchecked Feed radio', prepared?.radioConnected === true
    && prepared?.radioDisabled === false && prepared?.radioChecked === false);
  add('44px current Feed hit target', Number.isFinite(prepared?.x)
    && Number.isFinite(prepared?.y) && Number.isFinite(prepared?.labelWidth)
    && prepared.labelWidth >= 44 && Number.isFinite(prepared?.labelHeight)
    && prepared.labelHeight >= 44 && prepared?.labelVisible === true
    && prepared?.labelHitOwner === true && prepared?.radioHitOwner === true);
  add('dispatch-time Feed radio identity', currentDocument(dispatch?.document)
    && dispatch?.selectorCount === 1
    && dispatch?.radioIdMatchCount === 1
    && dispatch?.labelOwnerCount === 1
    && dispatch?.labelConnected === true
    && dispatch?.labelContainsRadio === true
    && nonEmptyString(dispatch?.labelNodeToken)
    && dispatch?.labelFor === preparedRadioId
    && dispatch?.radioId === preparedRadioId
    && dispatch?.radioNodeToken === preparedNodeToken
    && dispatch?.radioConnected === true
    && dispatch?.radioDisabled === false
    && dispatch?.radioChecked === false
    && Number.isFinite(dispatch?.labelWidth) && dispatch.labelWidth >= 44
    && Number.isFinite(dispatch?.labelHeight) && dispatch.labelHeight >= 44
    && dispatch?.labelVisible === true
    && dispatch?.labelHitOwner === true && dispatch?.radioHitOwner === true
    && exactChoice(dispatch));
  add('exact CDP Feed choice dispatch', dispatch?.kind === 'cdp-mouse'
    && dispatch?.button === 'left' && dispatch?.clickCount === 1
    && Number.isFinite(dispatch?.targetX) && Number.isFinite(dispatch?.targetY)
    && dispatch?.x === dispatch.targetX && dispatch?.y === dispatch.targetY);

  const receipt = observation?.receipt;
  const exactReceipt = (candidate, type) => candidate?.type === type
    && candidate?.trusted === true
    && candidate?.radioId === preparedRadioId
    && candidate?.radioNodeToken === preparedNodeToken
    && candidate?.choice === expected.kind
    && candidate?.choiceId === expected.expectedId
    && (['pointerdown', 'click'].includes(type)
      ? (Object.hasOwn(candidate ?? {}, 'x') && Object.hasOwn(candidate ?? {}, 'y')
        && candidate?.x === dispatch?.x && candidate?.y === dispatch?.y)
      : (!Object.hasOwn(candidate ?? {}, 'x') && !Object.hasOwn(candidate ?? {}, 'y')
        && !Object.hasOwn(candidate ?? {}, 'pointerType')
        && !Object.hasOwn(candidate ?? {}, 'button')))
    && currentDocument(candidate?.document);
  const pointerdowns = Array.isArray(receipt?.pointerdowns) ? receipt.pointerdowns : [];
  const clicks = Array.isArray(receipt?.clicks) ? receipt.clicks : [];
  const inputs = Array.isArray(receipt?.inputs) ? receipt.inputs : [];
  const changes = Array.isArray(receipt?.changes) ? receipt.changes : [];
  add('trusted current Feed pointer receipt', pointerdowns.length === 1
    && clicks.length === 1
    && exactReceipt(pointerdowns[0], 'pointerdown')
    && pointerdowns[0]?.pointerType === 'mouse'
    && pointerdowns[0]?.button === 0
    && pointerdowns[0]?.serial === 1
    && exactReceipt(clicks[0], 'click')
    && clicks[0]?.serial === 2);
  add('exact Feed input receipt', inputs.length === 1
    && exactReceipt(inputs[0], 'input') && inputs[0]?.serial === 3);
  add('exact Feed change receipt', changes.length === 1
    && exactReceipt(changes[0], 'change') && changes[0]?.serial === 4);

  const currentSelection = expected.kind === 'creature'
    ? settled?.ui?.selectedCreatureId : settled?.ui?.selectedFoodLotId;
  add('settled current Feed choice', currentDocument(settled?.ui?.document)
    && currentController(settled?.ui?.controller)
    && settled?.selectorCount === 1
    && settled?.radioIdMatchCount === 1
    && settled?.labelOwnerCount === 1
    && settled?.labelConnected === true
    && settled?.labelContainsRadio === true
    && nonEmptyString(settled?.labelNodeToken)
    && settled?.labelFor === preparedRadioId
    && settled?.radioId === preparedRadioId
    && nonEmptyString(settled?.radioNodeToken)
    && settled?.radioConnected === true && settled?.radioDisabled === false
    && settled?.radioChecked === true
    && exactChoice(settled)
    && currentSelection === expected.expectedId);
  const priorSelection = expected.kind === 'creature'
    ? settled?.ui?.selectedFoodLotId : settled?.ui?.selectedCreatureId;
  add('preserved prior Feed choice', priorSelection === expected.expectedPriorId);
  return { ok: reasons.length === 0, reasons };
}

/* Choice receipts establish that both native radios accepted the player.
   This separate preview boundary retains the complete browser observation
   while requiring the exact current authority, rendered transitions, and an
   action coordinator that has not yet crossed into Feed confirmation. */
export function assessCompendiumFeedPreview(observation, expected) {
  const authority = expected?.authority;
  const baseline = expected?.baseline;
  const baselineCoordinator = baseline?.actionCoordinator;
  const baselineOwner = baselineCoordinator?.owner;
  const baselineHold = baselineCoordinator?.hold;
  const validOperation = (value) => value === null || nonEmptyString(value);
  const knownHoldPhase = (value) => [
    'idle', 'armed', 'holding', 'release-requested', 'released',
  ].includes(value);
  if (!nonEmptyString(expected?.documentToken)
    || !safeInt(expected?.generation)
    || !nonEmptyString(expected?.logicalId)
    || !nonEmptyString(expected?.surfaceKey)
    || !nonEmptyString(expected?.contextKey)
    || !safeInt(authority?.revision)
    || !hexDigest(authority?.sourceDigest)
    || !hexDigest(authority?.targetDigest)
    || !nonEmptyString(expected?.creatureId)
    || !nonEmptyString(expected?.foodLotId)
    || !safeInt(expected?.fedBefore) || expected.fedBefore >= 200
    || expected?.fedAfter !== expected.fedBefore + 1
    || !safeInt(expected?.foodQuantityBefore) || expected.foodQuantityBefore < 1
    || expected?.foodQuantityAfter !== expected.foodQuantityBefore - 1
    || baseline === null || typeof baseline !== 'object' || Array.isArray(baseline)
    || !Object.hasOwn(baseline, 'actionCoordinator')
    || !Object.hasOwn(baseline, 'lastOutcome') || !Object.hasOwn(baseline, 'result')
    || typeof baselineCoordinator?.inFlight !== 'boolean'
    || typeof baselineOwner?.busy !== 'boolean'
    || !validOperation(baselineOwner?.operation)
    || !knownHoldPhase(baselineHold?.phase)
    || !validOperation(baselineHold?.operation)
    || !safeInt(baselineHold?.sequence)) {
    throw new TypeError('Compendium Feed preview evidence requires one exact pre-choice expectation');
  }

  const reasons = [];
  const add = (reason, condition) => { if (!condition) reasons.push(reason); };
  const document = observation?.document;
  add('exact Feed preview document token', document?.token === expected.documentToken);
  add('exact Feed preview generation', document?.generation === expected.generation);
  add('exact Feed preview logical ID', document?.logicalId === expected.logicalId);
  add('exact Feed preview surface key', document?.surfaceKey === expected.surfaceKey);
  add('exact Feed preview context key', document?.contextKey === expected.contextKey);

  const observedAuthority = observation?.authority;
  add('unchanged Feed preview authority revision',
    observedAuthority?.revision === authority.revision);
  add('unchanged Feed preview source digest',
    observedAuthority?.sourceDigest === authority.sourceDigest);
  add('unchanged Feed preview target digest',
    observedAuthority?.targetDigest === authority.targetDigest);

  const controller = observation?.controller;
  add('attached Feed preview mount', controller?.attachedMountCount === 1);
  add('installed Feed preview listeners', controller?.delegatedListenerCount === 2);
  add('idle Feed preview controller', controller?.pendingWork === 0);
  add('unlatched Feed preview convergence', controller?.convergenceLatched === false);
  add('ready Feed preview state', controller?.feedState === 'ready');
  add('exact controller Feed surface key', controller?.surfaceKey === expected.surfaceKey);
  add('exact controller Feed context key', controller?.contextKey === expected.contextKey);
  add('exact controller Feed creature selection',
    controller?.selectedCreatureId === expected.creatureId);
  add('exact controller Feed flora selection',
    controller?.selectedFoodLotId === expected.foodLotId);

  const dom = observation?.dom;
  add('exact DOM Feed creature selection', dom?.selectedCreatureId === expected.creatureId);
  add('exact DOM Feed flora selection', dom?.selectedFoodLotId === expected.foodLotId);
  add('unique Feed preview summary owner', dom?.summaryCount === 1);
  const meals = `Meals ${expected.fedBefore} → ${expected.fedAfter}`;
  const quantity = `Quantity ${expected.foodQuantityBefore} → ${expected.foodQuantityAfter}`;
  const occursOnce = (needle) => typeof dom?.summary === 'string'
    && dom.summary.split(needle).length === 2;
  add('exact Feed Meals transition', occursOnce(meals));
  add('exact Feed Quantity transition', occursOnce(quantity));
  add('present Feed preview confirmation', dom?.confirmPresent === true);
  add('enabled Feed preview confirmation', dom?.confirmDisabled === false);

  const coordinator = observation?.actionCoordinator;
  add('unchanged quiescent Feed preview in-flight state',
    coordinator?.inFlight === baselineCoordinator.inFlight
      && coordinator?.inFlight === false);
  add('unchanged quiescent Feed preview owner busy state',
    coordinator?.owner?.busy === baselineOwner.busy
      && coordinator?.owner?.busy === false);
  add('unchanged Feed preview owner operation',
    coordinator?.owner?.operation === baselineOwner.operation);
  add('unchanged quiescent Feed preview hold phase',
    coordinator?.hold?.phase === baselineHold.phase
      && ['idle', 'released'].includes(coordinator?.hold?.phase));
  add('unchanged Feed preview hold operation',
    coordinator?.hold?.operation === baselineHold.operation);
  add('unchanged Feed preview hold sequence',
    coordinator?.hold?.sequence === baselineHold.sequence);
  add('unchanged Feed preview last outcome',
    exactJson(observation?.lastOutcome, baseline.lastOutcome));
  add('unchanged Feed preview result', exactJson(observation?.result, baseline.result));
  return { ok: reasons.length === 0, reasons, observation };
}

/* Arc 5's first player-live action deliberately keeps its browser evidence
   compact and causal. The pending assessor accepts only the exact native
   Compendium activation, unchanged durable/live ownership, one global
   product owner, disabled Feed choices, and still-usable Back/Close escape
   routes. It does not infer success from controller source markers. */
export function assessCompendiumFeedPendingWindow(observation) {
  const fixture = observation?.fixture;
  if (!fixture || !nonEmptyString(fixture.logicalId)
    || !nonEmptyString(fixture.creatureId) || !nonEmptyString(fixture.foodLotId)
    || !safeInt(fixture.fedBefore) || fixture.fedBefore >= 200
    || fixture.fedAfter !== fixture.fedBefore + 1
    || !Number.isSafeInteger(fixture.foodQuantityBefore)
    || fixture.foodQuantityBefore < 1
    || fixture.foodQuantityAfter !== fixture.foodQuantityBefore - 1) {
    throw new TypeError('Compendium Feed pending evidence requires one exact eligible companion and flora lot');
  }
  const reasons = [];
  const activation = observation?.activation;
  const presses = Array.isArray(activation?.presses) ? activation.presses : [];
  if (activation?.pressCount !== 1 || presses.length !== 1
    || presses[0]?.kind !== 'confirm' || presses[0]?.trusted !== true
    || presses[0]?.tag !== 'BUTTON'
    || presses[0]?.creatureId !== fixture.creatureId
    || presses[0]?.foodLotId !== fixture.foodLotId) {
    reasons.push('one exact trusted Feed confirmation');
  }
  const heartbeat = observation?.heartbeat;
  if (!nonEmptyString(observation?.documentToken)
    || heartbeat?.schema !== 'cf-v2-f4-heartbeat-quiescence/v1'
    || heartbeat?.documentToken !== observation.documentToken
    || heartbeat?.wasRunning !== true || heartbeat?.stopped !== true
    || heartbeat?.cycleSettled !== true) {
    reasons.push('heartbeat-quiesced Feed snapshot window');
  }
  const before = observation?.before;
  const pendingLedgerShape = (candidate) => Array.isArray(candidate?.receiptKeys)
    && Array.isArray(candidate?.receiptRawRows) && Array.isArray(candidate?.receiptRows)
    && candidate.receiptCount === candidate.receiptKeys.length
    && candidate.receiptKeys.length === candidate.receiptRawRows.length
    && candidate.receiptKeys.length === candidate.receiptRows.length;
  const pendingF4Shape = (candidate) => candidate?.authorityVersion === 1
    && exactKeys(candidate?.authority, ['activePlayMs', 'sessionRng'])
    && safeInt(candidate.authority.activePlayMs)
    && exactKeys(candidate.authority.sessionRng, ['seed', 'ordinal', 'draws'])
    && safeInt(candidate.authority.sessionRng.seed)
    && candidate.authority.sessionRng.seed <= 0xFFFF_FFFF
    && safeInt(candidate.authority.sessionRng.ordinal)
    && candidate.authority.sessionRng.draws !== null
    && typeof candidate.authority.sessionRng.draws === 'object'
    && !Array.isArray(candidate.authority.sessionRng.draws)
    && candidate?.authorityJson === JSON.stringify(candidate.authority)
    && candidate?.sessionSeed === candidate.authority.sessionRng.seed
    && candidate?.sessionOrdinal === candidate.authority.sessionRng.ordinal
    && candidate?.sessionDraws !== null && typeof candidate?.sessionDraws === 'object'
    && !Array.isArray(candidate.sessionDraws)
    && canonicalJson(candidate.sessionDraws) === canonicalJson(candidate.authority.sessionRng.draws)
    && candidate?.sessionDrawsFingerprint === sha256Text(canonicalJson(candidate.sessionDraws));
  if (!safeInt(before?.globalRevision) || !safeInt(before?.ownershipRevision)
    || !safeInt(before?.sourceRevision) || !hexDigest(before?.sourceDigest)
    || !hexDigest(before?.targetDigest) || !hexDigest(before?.durableFingerprint)
    || !hexDigest(before?.rawPersistenceFingerprint)
    || !hexDigest(before?.arc4Fingerprint) || !hexDigest(before?.unrelatedFingerprint)
    || !pendingLedgerShape(before) || !pendingF4Shape(before)
    || typeof before?.feedResult !== 'string') {
    reasons.push('exact pending baseline');
  }
  for (const [phase, candidate] of [
    ['held', observation?.held],
    ['retry', observation?.retry],
  ]) {
    if (!candidate || !hexDigest(candidate.durableFingerprint)
      || !hexDigest(candidate.targetDigest) || typeof candidate.feedResult !== 'string'
      || candidate.durableFingerprint !== before?.durableFingerprint
      || candidate.targetDigest !== before?.targetDigest
      || candidate.feedResult !== before?.feedResult) {
      reasons.push(`${phase} no optimistic publication`);
    }
    if (!hexDigest(candidate?.rawPersistenceFingerprint)
      || candidate.rawPersistenceFingerprint !== before?.rawPersistenceFingerprint) {
      reasons.push(`${phase} full raw persistence fixed point`);
    }
    if (!safeInt(candidate?.globalRevision) || !safeInt(candidate?.ownershipRevision)
      || !safeInt(candidate?.sourceRevision)
      || candidate.globalRevision !== before?.globalRevision
      || candidate.ownershipRevision !== before?.ownershipRevision
      || candidate.sourceRevision !== before?.sourceRevision) {
      reasons.push(`${phase} revision fixed point`);
    }
    if (!pendingLedgerShape(candidate)
      || canonicalJson({ count: candidate.receiptCount, keys: candidate.receiptKeys,
        raws: candidate.receiptRawRows, rows: candidate.receiptRows })
        !== canonicalJson({ count: before?.receiptCount, keys: before?.receiptKeys,
          raws: before?.receiptRawRows, rows: before?.receiptRows })) {
      reasons.push(`${phase} receipt ledger fixed point`);
    }
    if (!pendingF4Shape(candidate)
      || canonicalJson({ authorityVersion: candidate.authorityVersion,
        authorityJson: candidate.authorityJson, authority: candidate.authority,
        sessionSeed: candidate.sessionSeed, sessionOrdinal: candidate.sessionOrdinal,
        sessionDraws: candidate.sessionDraws,
        sessionDrawsFingerprint: candidate.sessionDrawsFingerprint })
        !== canonicalJson({ authorityVersion: before?.authorityVersion,
          authorityJson: before?.authorityJson, authority: before?.authority,
          sessionSeed: before?.sessionSeed, sessionOrdinal: before?.sessionOrdinal,
          sessionDraws: before?.sessionDraws,
          sessionDrawsFingerprint: before?.sessionDrawsFingerprint })) {
      reasons.push(`${phase} F4 authority fixed point`);
    }
    if (!hexDigest(candidate?.sourceDigest) || !hexDigest(candidate?.arc4Fingerprint)
      || !hexDigest(candidate?.unrelatedFingerprint)
      || candidate.sourceDigest !== before?.sourceDigest
      || candidate.arc4Fingerprint !== before?.arc4Fingerprint
      || candidate.unrelatedFingerprint !== before?.unrelatedFingerprint) {
      reasons.push(`${phase} unrelated durable fixed point`);
    }
  }
  const pendingExact = (candidate) => candidate?.controller?.pendingWork === 1
    && candidate.controller.lastRequest?.creatureId === fixture.creatureId
    && candidate.controller.lastRequest?.foodLotId === fixture.foodLotId
    && candidate.actionCoordinator?.inFlight === true
    && candidate.actionCoordinator?.owner?.busy === true
    && candidate.actionCoordinator?.owner?.operation === 'arc5.companion-feed'
    && candidate.actionCoordinator?.hold?.phase === 'holding'
    && candidate.actionCoordinator?.hold?.operation === 'arc5.companion-feed'
    && candidate.ui?.statusKind === 'pending'
    && candidate.ui?.confirmDisabled === true
    && candidate.ui?.radioCount >= 2
    && candidate.ui?.allRadiosDisabled === true
    && candidate.ui?.backEnabled === true
    && candidate.ui?.closeEnabled === true;
  if (!pendingExact(observation?.held) || !pendingExact(observation?.retry)) {
    reasons.push('single pending owner and disabled Feed controls');
  }
  const retryPoint = observation?.retry?.point;
  const retryDispatch = observation?.retry?.dispatch;
  if (retryPoint?.ok !== true || retryPoint?.selectorCount !== 1
    || retryPoint?.tag !== 'BUTTON' || retryPoint?.disabled !== true
    || retryPoint?.visible !== true || retryPoint?.hitOwner !== true
    || !Number.isFinite(retryPoint?.x) || !Number.isFinite(retryPoint?.y)
    || !Number.isFinite(retryPoint?.width) || retryPoint.width <= 0
    || !Number.isFinite(retryPoint?.height) || retryPoint.height < 44
    || retryDispatch?.kind !== 'cdp-mouse' || retryDispatch?.button !== 'left'
    || retryDispatch?.clickCount !== 1 || retryDispatch?.x !== retryPoint.x
    || retryDispatch?.y !== retryPoint.y) {
    reasons.push('exact native disabled retry dispatch');
  }
  if (observation?.retry?.confirmClickCount !== 1
    || observation?.retry?.requestStable !== true) {
    reasons.push('disabled second confirmation suppressed');
  }
  if (observation?.competing?.kind !== 'unavailable'
    || observation?.competing?.durability !== 'none'
    || observation?.competing?.convergence !== 'none'
    || observation?.competing?.verb !== 'tame'
    || observation?.competing?.detail !== 'write-authority-unavailable'
    || observation?.competing?.result !== null) {
    reasons.push('global mutation fence');
  }
  const back = observation?.lifecycle?.back;
  const close = observation?.lifecycle?.close;
  if (back?.trusted !== true || back?.tag !== 'BUTTON'
    || back?.targetId !== 'codexback' || back?.panelMode !== 'list'
    || back?.pendingWork !== 1 || back?.ownerBusy !== true) {
    reasons.push('pending Back remains usable');
  }
  if (close?.trusted !== true || close?.tag !== 'BUTTON'
    || close?.panelOwner !== 'codex' || close?.panelOpen !== null
    || close?.attachedMountCount !== 0 || close?.pendingWork !== 1
    || close?.ownerBusy !== true) {
    reasons.push('pending Close remains usable');
  }
  return { ok: reasons.length === 0, reasons };
}

/* CDP's WebAudio domain reports protocol node types (`Oscillator`,
   `AudioDestination`), not the similarly named DOM interfaces
   (`OscillatorNode`, `AudioDestinationNode`). Keep event projection here so
   the collector and its browser-free controls consume the same raw vocabulary. */
export function projectCompendiumFeedWebAudioGraph({
  events, sessionId, enableMark, sourceMark,
}) {
  if (!Array.isArray(events) || !nonEmptyString(sessionId)
    || !safeInt(enableMark) || !safeInt(sourceMark) || sourceMark < enableMark) {
    throw new TypeError('Compendium Feed WebAudio projection requires one exact event window');
  }
  const nodes = new Map();
  const edges = new Map();
  const sourceNodeIds = [];
  for (const [eventIndex, event] of events.entries()) {
    if (eventIndex < enableMark || event?.sessionId !== sessionId) continue;
    if (event.method === 'WebAudio.audioNodeCreated') {
      const node = event.params?.node;
      if (!nonEmptyString(node?.nodeId) || !nonEmptyString(node?.contextId)
        || !nonEmptyString(node?.nodeType)) continue;
      nodes.set(node.nodeId, {
        nodeId: node.nodeId, contextId: node.contextId, nodeType: node.nodeType,
      });
      if (eventIndex >= sourceMark && node.nodeType === 'Oscillator') {
        sourceNodeIds.push(node.nodeId);
      }
    } else if (event.method === 'WebAudio.audioNodeWillBeDestroyed') {
      const nodeId = event.params?.nodeId;
      nodes.delete(nodeId);
      for (const [key, edge] of edges) {
        if (edge.sourceId === nodeId || edge.destinationId === nodeId) edges.delete(key);
      }
    } else if (event.method === 'WebAudio.nodesConnected') {
      const { contextId, sourceId, destinationId } = event.params ?? {};
      if (nonEmptyString(contextId) && nonEmptyString(sourceId)
        && nonEmptyString(destinationId)) {
        edges.set(`${contextId}|${sourceId}|${destinationId}`, {
          contextId, sourceId, destinationId,
        });
      }
    } else if (event.method === 'WebAudio.nodesDisconnected') {
      const { contextId, sourceId, destinationId } = event.params ?? {};
      for (const [key, edge] of edges) {
        if (edge.contextId === contextId && edge.sourceId === sourceId
          && (!nonEmptyString(destinationId) || edge.destinationId === destinationId)) {
          edges.delete(key);
        }
      }
    }
  }
  const sourceNodeId = sourceNodeIds.length === 1 ? sourceNodeIds[0] : null;
  const source = sourceNodeId === null ? null : nodes.get(sourceNodeId);
  const destinations = [...nodes.values()].filter((node) => (
    node.nodeType === 'AudioDestination' && node.contextId === source?.contextId
  ));
  const nodeTypeInventory = Object.entries([...nodes.values()].reduce((inventory, node) => {
    inventory[node.nodeType] = (inventory[node.nodeType] ?? 0) + 1;
    return inventory;
  }, {})).sort(([left], [right]) => left.localeCompare(right));
  return {
    schema: 'cf-v2-feed-audio-graph/v1',
    sourceNodeId,
    destinationNodeId: destinations.length === 1 ? destinations[0].nodeId : null,
    sourceCandidateCount: sourceNodeIds.length,
    destinationCandidateCount: destinations.length,
    nodeTypeInventory,
    nodes: [...nodes.values()].sort((left, right) => left.nodeId.localeCompare(right.nodeId)),
    edges: [...edges.values()]
      .filter((edge) => {
        const sourceNode = nodes.get(edge.sourceId);
        const destinationNode = nodes.get(edge.destinationId);
        return sourceNode?.contextId === edge.contextId
          && destinationNode?.contextId === edge.contextId;
      })
      .sort((left, right) => `${left.contextId}|${left.sourceId}|${left.destinationId}`
        .localeCompare(`${right.contextId}|${right.sourceId}|${right.destinationId}`)),
  };
}

/* Return one deterministic source-to-destination route using the same
   same-context raw CDP graph semantics as the assessor. The live negative
   control uses this route so it cannot accidentally mutate an unrelated
   branch and pass vacuously. */
export function compendiumFeedWebAudioRouteNodeIds(graph) {
  const nodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
  const edges = Array.isArray(graph?.edges) ? graph.edges : [];
  const byId = new Map(nodes.map((node) => [node?.nodeId, node]));
  const source = byId.get(graph?.sourceNodeId);
  const destination = byId.get(graph?.destinationNodeId);
  const contextId = source?.contextId;
  if (source?.nodeType !== 'Oscillator'
    || destination?.nodeType !== 'AudioDestination'
    || !nonEmptyString(contextId) || destination.contextId !== contextId) return [];
  const outgoing = new Map();
  for (const edge of edges) {
    const edgeSource = byId.get(edge?.sourceId);
    const edgeDestination = byId.get(edge?.destinationId);
    if (edge?.contextId !== contextId || edgeSource?.contextId !== contextId
      || edgeDestination?.contextId !== contextId) continue;
    const targets = outgoing.get(edge.sourceId) ?? [];
    targets.push(edge.destinationId);
    outgoing.set(edge.sourceId, targets);
  }
  for (const targets of outgoing.values()) targets.sort((left, right) => left.localeCompare(right));
  const queue = [source.nodeId];
  const visited = new Set(queue);
  const predecessor = new Map();
  while (queue.length > 0) {
    const current = queue.shift();
    if (current === destination.nodeId) {
      const route = [current];
      while (predecessor.has(route[0])) route.unshift(predecessor.get(route[0]));
      return route;
    }
    for (const target of outgoing.get(current) ?? []) {
      if (!visited.has(target)) {
        visited.add(target);
        predecessor.set(target, current);
        queue.push(target);
      }
    }
  }
  return [];
}

/* A raw-CDP endpoint mismatch is a harness failure only when the page-side
   wrapper still proves the complete exact post-settlement start. If the
   wrapper sees a duplicate, missing or semantically bad acknowledgement,
   preserve that as a product-red outcome instead of hiding it behind an
   instrument exception. */
function compendiumFeedPostSettlementSourceStartIsExact(observation) {
  const starts = Array.isArray(observation?.audioStarts) ? observation.audioStarts : [];
  const start = starts[0];
  return observation?.audioCreates === 1 && starts.length === 1
    && exactKeys(start, [
      'startReturned', 'sourceConnected', 'contextState',
      'pendingWork', 'lastOutcome', 'toastSerial',
    ])
    && start.startReturned === true && start.sourceConnected === true
    && start.contextState === 'running' && start.pendingWork === 0
    && start.lastOutcome === `committed:${observation?.globalRevision}`
    && start.toastSerial === observation?.toastSerial;
}

export function compendiumFeedWebAudioEndpointFailureIsInstrument(observation) {
  const wrapperBindsExactStart = compendiumFeedPostSettlementSourceStartIsExact(observation);
  const graph = observation?.audioGraph;
  const graphBindsEndpoints = graph?.sourceCandidateCount === 1
    && graph?.destinationCandidateCount === 1
    && nonEmptyString(graph?.sourceNodeId) && nonEmptyString(graph?.destinationNodeId);
  return wrapperBindsExactStart && !graphBindsEndpoints;
}

/* A source-level connect call proves only that an oscillator handed bytes to
   some node. The browser oracle must also bind that exact post-arm source to
   a live CDP WebAudio path ending at its context's AudioDestination, and must
   observe `start()` returning successfully after visible settlement. */
export function assessCompendiumFeedAudioAcknowledgement(observation) {
  const reasons = [];
  if (!compendiumFeedPostSettlementSourceStartIsExact(observation)) {
    reasons.push('successful post-settlement source start');
  }

  const graph = observation?.audioGraph;
  const nodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
  const edges = Array.isArray(graph?.edges) ? graph.edges : [];
  const nodeIds = nodes.map((node) => node?.nodeId);
  const edgeIds = edges.map((edge) => [
    edge?.contextId, edge?.sourceId, edge?.destinationId,
  ].join('|'));
  const expectedNodeTypeInventory = Object.entries(nodes.reduce((inventory, node) => {
    if (nonEmptyString(node?.nodeType)) {
      inventory[node.nodeType] = (inventory[node.nodeType] ?? 0) + 1;
    }
    return inventory;
  }, {})).sort(([left], [right]) => left.localeCompare(right));
  const exactGraphShape = graph?.schema === 'cf-v2-feed-audio-graph/v1'
    && nonEmptyString(graph?.sourceNodeId) && nonEmptyString(graph?.destinationNodeId)
    && graph?.sourceCandidateCount === 1 && graph?.destinationCandidateCount === 1
    && canonicalJson(graph?.nodeTypeInventory) === canonicalJson(expectedNodeTypeInventory)
    && nodes.length > 0 && edges.length > 0
    && new Set(nodeIds).size === nodeIds.length
    && new Set(edgeIds).size === edgeIds.length
    && nodes.every((node) => exactKeys(node, ['nodeId', 'contextId', 'nodeType'])
      && nonEmptyString(node.nodeId) && nonEmptyString(node.contextId)
      && nonEmptyString(node.nodeType))
    && edges.every((edge) => exactKeys(edge, ['contextId', 'sourceId', 'destinationId'])
      && nonEmptyString(edge.contextId) && nonEmptyString(edge.sourceId)
      && nonEmptyString(edge.destinationId));
  const routeNodeIds = exactGraphShape ? compendiumFeedWebAudioRouteNodeIds(graph) : [];
  if (!exactGraphShape || routeNodeIds.length < 2) {
    reasons.push('live AudioDestination route');
  }
  return { ok: reasons.length === 0, reasons };
}

/* The settled assessor consumes already-projected exact durable facts. This
   keeps browser orchestration separate from semantics while still requiring
   one global revision/receipt, one Arc 5 successor, exact fed/lot changes,
   untouched Arc 4 + F4 RNG + unrelated carriers, a visible committed result,
   post-settlement audio, and the same bytes after full reload. */
export function assessCompendiumFeedCommittedOutcome(observation) {
  const fixture = observation?.fixture;
  if (!fixture || !nonEmptyString(fixture.creatureId)
    || !nonEmptyString(fixture.foodLotId)
    || !['ready', 'no-eligible-companion', 'no-flora'].includes(
      fixture.postFeedAvailability,
    )) {
    throw new TypeError('Compendium Feed committed evidence requires exact IDs');
  }
  const reasons = [];
  const heartbeat = observation?.heartbeat;
  if (!nonEmptyString(heartbeat?.documentToken)
    || heartbeat?.quiesced?.schema !== 'cf-v2-f4-heartbeat-quiescence/v1'
    || heartbeat.quiesced.documentToken !== heartbeat.documentToken
    || heartbeat.quiesced.wasRunning !== true
    || heartbeat.quiesced.stopped !== true
    || heartbeat.quiesced.cycleSettled !== true
    || heartbeat?.resumed?.schema !== 'cf-v2-f4-heartbeat-resume/v1'
    || heartbeat.resumed.documentToken !== heartbeat.documentToken
    || heartbeat.resumed.running !== true) {
    reasons.push('heartbeat-owned Feed snapshot lifecycle');
  }
  const before = observation?.before;
  const after = observation?.after;
  const expectedReceiptWitness = canonicalJson({
    schema: 'cf-v2-arc5-feed-witness/v1',
    receiptOrdinal: before?.sessionOrdinal,
    parentRevision: before?.ownershipRevision,
    parentDigest: before?.targetDigest,
    creatureId: fixture.creatureId,
    foodLotId: fixture.foodLotId,
    fedBefore: fixture.fedBefore,
    fedAfter: fixture.fedAfter,
    foodQuantityBefore: fixture.foodQuantityBefore,
    foodQuantityAfter: fixture.foodQuantityAfter,
  });
  const expectedReceiptWitnessDigest = sha256Text(expectedReceiptWitness);
  const coherentReceiptLedger = (candidate) => {
    const keys = candidate?.receiptKeys;
    const raws = candidate?.receiptRawRows;
    const rows = candidate?.receiptRows;
    if (!Array.isArray(keys) || !Array.isArray(raws) || !Array.isArray(rows)
      || keys.length !== raws.length || keys.length !== rows.length
      || new Set(keys).size !== keys.length) return false;
    return keys.every((key, index) => {
      const raw = raws[index];
      const row = rows[index];
      if (!nonEmptyString(key) || typeof raw !== 'string'
        || !exactKeys(row, ['ordinal', 'kind', 'witness'])
        || !safeInt(row.ordinal) || key !== `receipt:${row.ordinal}`) return false;
      try {
        return raw === JSON.stringify(row)
          && canonicalJson(JSON.parse(raw)) === canonicalJson(row);
      } catch { return false; }
    });
  };
  const receiptAt = (candidate, key) => {
    const index = candidate?.receiptKeys?.indexOf?.(key) ?? -1;
    return index < 0 ? null : {
      index,
      raw: candidate.receiptRawRows?.[index] ?? null,
      row: candidate.receiptRows?.[index] ?? null,
    };
  };
  const beforeKeys = Array.isArray(before?.receiptKeys) ? before.receiptKeys : [];
  const afterKeys = Array.isArray(after?.receiptKeys) ? after.receiptKeys : [];
  const expectedReceiptKey = `receipt:${before?.sessionOrdinal}`;
  const expectedReceipt = receiptAt(after, expectedReceiptKey);
  const predecessorRowsPreserved = beforeKeys.every((key) => {
    const prior = receiptAt(before, key);
    const next = receiptAt(after, key);
    return prior !== null && next !== null && prior.raw === next.raw
      && canonicalJson(prior.row) === canonicalJson(next.row);
  });
  const newReceiptKeys = afterKeys.filter((key) => !beforeKeys.includes(key));
  const immediateReceiptLedgerExact = coherentReceiptLedger(before)
    && coherentReceiptLedger(after)
    && before?.receiptCount === beforeKeys.length
    && after?.receiptCount === afterKeys.length
    && canonicalJson(newReceiptKeys) === canonicalJson([expectedReceiptKey])
    && predecessorRowsPreserved
    && expectedReceipt?.row?.ordinal === after?.receiptOrdinal
    && expectedReceipt?.row?.kind === after?.receiptKind
    && expectedReceipt?.row?.witness === after?.receiptWitness
    && expectedReceipt?.raw === JSON.stringify(expectedReceipt?.row);
  const f4ProjectionExact = (candidate) => {
    const rng = candidate?.authority?.sessionRng;
    return candidate?.authorityVersion === 1
      && exactKeys(candidate?.authority, ['activePlayMs', 'sessionRng'])
      && safeInt(candidate.authority.activePlayMs)
      && exactKeys(rng, ['seed', 'ordinal', 'draws'])
      && typeof candidate?.authorityJson === 'string'
      && candidate.authorityJson === JSON.stringify(candidate.authority)
      && safeInt(rng?.seed) && rng.seed <= 0xFFFF_FFFF
      && safeInt(rng?.ordinal)
      && rng?.draws !== null && typeof rng?.draws === 'object' && !Array.isArray(rng.draws)
      && candidate.sessionSeed === rng.seed
      && candidate.sessionOrdinal === rng.ordinal
      && canonicalJson(candidate.sessionDraws) === canonicalJson(rng.draws)
      && candidate.sessionDrawsFingerprint === sha256Text(canonicalJson(rng.draws));
  };
  const runtimeMatchesF4 = (candidate) => canonicalJson({
    revision: candidate?.runtime?.revision,
    seed: candidate?.runtime?.sessionSeed,
    ordinal: candidate?.runtime?.sessionOrdinal,
    draws: candidate?.runtime?.sessionDraws,
  }) === canonicalJson({
    revision: candidate?.globalRevision,
    seed: candidate?.sessionSeed,
    ordinal: candidate?.sessionOrdinal,
    draws: candidate?.sessionDraws,
  });
  if (!safeInt(before?.globalRevision) || after?.globalRevision !== before.globalRevision + 1
    || !safeInt(before?.ownershipRevision)
    || after?.ownershipRevision !== before.ownershipRevision + 1
    || !safeInt(before?.receiptCount) || after?.receiptCount !== before.receiptCount + 1
    || !safeInt(before?.sessionOrdinal) || !safeInt(after?.receiptOrdinal)
    || after.receiptOrdinal !== before.sessionOrdinal
    || after?.sessionOrdinal !== before.sessionOrdinal + 1
    || after?.receiptKind !== 'arc5-companion-feed'
    || after?.receiptWitness !== expectedReceiptWitness
    || after?.receiptWitnessDigest !== expectedReceiptWitnessDigest
    || !immediateReceiptLedgerExact) {
    reasons.push('one global revision, ownership successor, and Feed receipt');
  }
  if (after?.creatureId !== fixture.creatureId
    || after?.fedBefore !== fixture.fedBefore || after?.fedAfter !== fixture.fedAfter
    || after?.foodLotId !== fixture.foodLotId
    || after?.foodQuantityBefore !== fixture.foodQuantityBefore
    || after?.foodQuantityAfter !== fixture.foodQuantityAfter
    || after?.lotTombstoned !== (fixture.foodQuantityAfter === 0)
    || (fixture.foodQuantityAfter === 0
      ? !exactKeys(after?.lotDisposition, ['ordinal', 'actionKind', 'witnessDigest'])
        || after.lotDisposition.ordinal !== after.receiptOrdinal
        || after.lotDisposition.actionKind !== 'companion-feed'
        || after.lotDisposition.witnessDigest !== expectedReceiptWitnessDigest
        || after?.tombstoneSnapshotQuantity !== fixture.foodQuantityBefore
      : after?.lotDisposition !== null || after?.tombstoneSnapshotQuantity !== null)) {
    reasons.push('exact companion and flora mutation');
  }
  const arc5SuccessorExact = safeInt(before?.sourceRevision) && safeInt(after?.sourceRevision)
    && hexDigest(before?.sourceDigest) && hexDigest(after?.sourceDigest)
    && hexDigest(before?.targetDigest) && hexDigest(after?.targetDigest)
    && hexDigest(before?.arc4Fingerprint) && hexDigest(after?.arc4Fingerprint)
    && safeInt(before?.sessionSeed) && after?.sessionSeed === before.sessionSeed
    && hexDigest(before?.sessionDrawsFingerprint)
    && hexDigest(after?.sessionDrawsFingerprint)
    && hexDigest(before?.foodInvariantFingerprint)
    && hexDigest(after?.foodInvariantFingerprint)
    && hexDigest(before?.targetRemainderFingerprint)
    && hexDigest(after?.targetRemainderFingerprint)
    && hexDigest(before?.unrelatedFingerprint) && hexDigest(after?.unrelatedFingerprint)
    && hexDigest(before?.durableFingerprint) && hexDigest(after?.durableFingerprint)
    && safeInt(before?.codecAt) && safeInt(before?.segmentCodecAt)
    && safeInt(after?.codecAt) && safeInt(after?.segmentCodecAt)
    && before.codecAt === before.segmentCodecAt
    && after.codecAt === after.segmentCodecAt
    && after.codecAt >= before.codecAt
    && f4ProjectionExact(before) && f4ProjectionExact(after)
    && runtimeMatchesF4(after)
    && after.sourceDigest === before.sourceDigest
    && after?.sourceRevision === before?.sourceRevision
    && after?.targetDigest !== before?.targetDigest
    && after?.durableFingerprint !== before?.durableFingerprint
    && after?.arc4Fingerprint === before?.arc4Fingerprint
    && after?.sessionDrawsFingerprint === before?.sessionDrawsFingerprint
    && after?.foodInvariantFingerprint === before?.foodInvariantFingerprint
    && after?.targetRemainderFingerprint === before?.targetRemainderFingerprint
    && after?.unrelatedFingerprint === before?.unrelatedFingerprint
    && before?.fixedCarrierCount === 5 && after?.fixedCarrierCount === 5;
  if (!arc5SuccessorExact) {
    reasons.push('Arc 5-only fixed-five successor');
  }
  const result = observation?.settled?.result;
  const controller = observation?.settled?.controller;
  if (!result || result.creatureId !== fixture.creatureId
    || result.foodLotId !== fixture.foodLotId
    || result.fedBefore !== fixture.fedBefore || result.fedAfter !== fixture.fedAfter
    || result.foodQuantityBefore !== fixture.foodQuantityBefore
    || result.foodQuantityAfter !== fixture.foodQuantityAfter
    || result.revision !== after?.globalRevision
    || result.ownershipRevision !== after?.ownershipRevision
    || controller?.pendingWork !== 0
    || controller?.lastOutcome?.kind !== 'committed'
    || observation?.settled?.lastOutcome !== `committed:${after?.globalRevision}`
    || observation?.settled?.toastSerial !== observation?.toastSerialBefore + 1
    || !String(observation?.settled?.toastText ?? '').includes('Meal complete')) {
    reasons.push('settled visible exact result');
  }
  const audioAssessment = assessCompendiumFeedAudioAcknowledgement({
    audioCreates: observation?.audioCreates,
    audioStarts: observation?.audioStarts,
    audioGraph: observation?.audioGraph,
    globalRevision: after?.globalRevision,
    toastSerial: observation?.settled?.toastSerial,
  });
  if (!audioAssessment.ok) {
    reasons.push('one post-settlement acknowledgement');
  }
  const reopened = observation?.reopened;
  if (reopened?.logicalId !== fixture.logicalId
    || reopened?.creatureId !== fixture.creatureId
    || reopened?.fed !== fixture.fedAfter
    || reopened?.foodLotId !== fixture.foodLotId
    || reopened?.foodQuantity !== fixture.foodQuantityAfter
    || !compendiumFeedDetailPresentationPasses(
      reopened, fixture.postFeedAvailability,
    )
    || reopened?.pendingWork !== 0) {
    reasons.push('same-document Compendium refresh');
  }
  const reloaded = observation?.reloaded;
  const reloadLedgerExact = !immediateReceiptLedgerExact || (
    coherentReceiptLedger(reloaded)
    && canonicalJson(reloaded?.receiptKeys) === canonicalJson(after?.receiptKeys)
    && canonicalJson(reloaded?.receiptRawRows) === canonicalJson(after?.receiptRawRows)
    && canonicalJson(reloaded?.receiptRows) === canonicalJson(after?.receiptRows)
  );
  const reloadArc5FixedPoint = !arc5SuccessorExact || (
    reloaded?.sourceRevision === after?.sourceRevision
    && reloaded?.sourceDigest === after?.sourceDigest
    && reloaded?.targetDigest === after?.targetDigest
    && reloaded?.arc4Fingerprint === after?.arc4Fingerprint
    && reloaded?.sessionSeed === after?.sessionSeed
    && reloaded?.sessionOrdinal === after?.sessionOrdinal
    && reloaded?.sessionDrawsFingerprint === after?.sessionDrawsFingerprint
    && reloaded?.foodInvariantFingerprint === after?.foodInvariantFingerprint
    && reloaded?.targetRemainderFingerprint === after?.targetRemainderFingerprint
    && reloaded?.unrelatedFingerprint === after?.unrelatedFingerprint
    && safeInt(reloaded?.codecAt) && safeInt(reloaded?.segmentCodecAt)
    && reloaded.codecAt === reloaded.segmentCodecAt
    && reloaded.codecAt >= after?.codecAt
    && reloaded?.fixedCarrierCount === 5
    && reloaded?.receiptCount === after?.receiptCount
    && f4ProjectionExact(reloaded) && runtimeMatchesF4(reloaded)
  );
  if (!hexDigest(reloaded?.durableFingerprint)
    || reloaded.durableFingerprint !== after?.durableFingerprint
    || !safeInt(reloaded?.globalRevision)
    || reloaded.globalRevision < after?.globalRevision
    || reloaded?.ownershipRevision !== after?.ownershipRevision
    || !reloadArc5FixedPoint || !reloadLedgerExact
    || reloaded?.logicalId !== fixture.logicalId
    || reloaded?.creatureId !== fixture.creatureId
    || reloaded?.fed !== fixture.fedAfter
    || reloaded?.foodLotId !== fixture.foodLotId
    || reloaded?.foodQuantity !== fixture.foodQuantityAfter
    || !compendiumFeedDetailPresentationPasses(
      reloaded, fixture.postFeedAvailability,
    )
    || reloaded?.pendingWork !== 0) {
    reasons.push('full-reload durable fixed point');
  }
  return { ok: reasons.length === 0, reasons };
}

/* A representative stale Feed write is meaningful only when two independent
   browser Documents start from the same exact parent, the second Document
   earns the real active-play lease after its full observation TTL, and its
   native Feed commit wins before the first Document resumes its held native
   action. The loser must then fail its real revision CAS, publish nothing,
   release its final lifecycle exactly once, and reload onto the winner's
   byte-identical fixed point while the winner still owns write authority.

   This assessor deliberately consumes projected browser evidence instead of
   owning any browser or persistence seam. In particular, zero invocation
   counts for the legacy same-document stale hook and direct writer paths are
   required alongside the two trusted native activations. */
export function assessCompendiumFeedTwoDocumentStaleOutcome(observation) {
  const fixture = observation?.fixture;
  if (!fixture || !nonEmptyString(fixture.creatureId)
    || !nonEmptyString(fixture.foodLotId)) {
    throw new TypeError('Compendium Feed two-document stale evidence requires exact IDs');
  }
  const reasons = [];
  const loserDocument = observation?.documents?.loser;
  const winnerDocument = observation?.documents?.winner;
  const exactDocument = (candidate) => nonEmptyString(candidate?.targetId)
    && nonEmptyString(candidate?.sessionId)
    && nonEmptyString(candidate?.documentToken)
    && nonEmptyString(candidate?.origin);
  if (!exactDocument(loserDocument) || !exactDocument(winnerDocument)
    || loserDocument.targetId === winnerDocument.targetId
    || loserDocument.sessionId === winnerDocument.sessionId
    || loserDocument.documentToken === winnerDocument.documentToken
    || loserDocument.origin !== winnerDocument.origin) {
    reasons.push('real two-document identities');
  }

  const orchestration = observation?.orchestration;
  if (orchestration?.sameDocumentFaultInjectionCalls !== 0
    || orchestration?.directWriterCalls !== 0) {
    reasons.push('no injected stale or direct writer');
  }

  const exactNativeFeedActivation = (candidate, document) => {
    const point = candidate?.point;
    const dispatch = candidate?.dispatch;
    const presses = candidate?.presses;
    const press = Array.isArray(presses) && presses.length === 1 ? presses[0] : null;
    return point?.ok === true && point?.selectorCount === 1
      && point?.tag === 'BUTTON' && point?.disabled === false
      && point?.visible === true && point?.hitOwner === true
      && Number.isFinite(point?.x) && Number.isFinite(point?.y)
      && Number.isFinite(point?.width) && point.width > 0
      && Number.isFinite(point?.height) && point.height >= 44
      && dispatch?.kind === 'cdp-mouse' && dispatch?.button === 'left'
      && dispatch?.clickCount === 1 && dispatch?.x === point.x && dispatch?.y === point.y
      && candidate?.pressCount === 1 && press?.kind === 'confirm'
      && press?.trusted === true && press?.tag === 'BUTTON'
      && press?.pointerType === 'mouse'
      && press?.creatureId === fixture.creatureId
      && press?.foodLotId === fixture.foodLotId
      && press?.documentToken === document?.documentToken
      && press?.targetId === document?.targetId;
  };
  if (!exactNativeFeedActivation(observation?.activations?.loser, loserDocument)
    || !exactNativeFeedActivation(observation?.activations?.winner, winnerDocument)) {
    reasons.push('two trusted native Feed confirmations');
  }

  const winner = observation?.winner;
  const parent = observation?.parent;
  const exactParentSnapshot = (candidate) => hexDigest(candidate?.rawPersistenceFingerprint)
    && candidate?.projection !== null && typeof candidate?.projection === 'object'
    && !Array.isArray(candidate.projection);
  const loserBeforeParent = parent?.loserBefore;
  const loserHeldParent = parent?.loserHeld;
  const winnerBeforeParent = parent?.winnerBefore;
  if (!exactParentSnapshot(loserBeforeParent)
    || !exactParentSnapshot(loserHeldParent)
    || !exactParentSnapshot(winnerBeforeParent)
    || canonicalJson(loserBeforeParent) !== canonicalJson(loserHeldParent)
    || canonicalJson(loserBeforeParent) !== canonicalJson(winnerBeforeParent)
    || canonicalJson(winnerBeforeParent?.projection) !== canonicalJson(winner?.before)) {
    reasons.push('exact shared pre-durable Feed parent');
  }

  const exactLeaseSnapshot = (candidate) => {
    const row = candidate?.row;
    return exactKeys(candidate, ['raw', 'row'])
      && typeof candidate.raw === 'string' && candidate.raw === JSON.stringify(row)
      && exactKeys(row, ['schema', 'held', 'ownerId', 'token', 'heartbeat'])
      && row.schema === 1 && row.held === true
      && row.ownerId === 'celestial-frontier-game-tab'
      && nonEmptyString(row.token) && safeInt(row.heartbeat);
  };
  const lease = observation?.lease;
  const loserBaselineLease = lease?.loserBaseline;
  const contenderObservedLease = lease?.contenderObserved;
  const winnerAcquiredLease = lease?.winnerAcquired;
  const winnerCommittedLease = lease?.winnerCommitted;
  if (lease?.ttlMs !== 10_000 || !Number.isFinite(lease?.takeoverElapsedMs)
    || lease.takeoverElapsedMs < lease.ttlMs
    || !exactLeaseSnapshot(loserBaselineLease)
    || !exactLeaseSnapshot(contenderObservedLease)
    || !exactLeaseSnapshot(winnerAcquiredLease)
    || !exactLeaseSnapshot(winnerCommittedLease)
    || loserBaselineLease.row.token !== loserDocument?.documentToken
    || contenderObservedLease.raw !== loserBaselineLease.raw
    || winnerAcquiredLease.row.token !== winnerDocument?.documentToken
    || winnerAcquiredLease.row.heartbeat !== loserBaselineLease.row.heartbeat + 1
    || winnerAcquiredLease.row.ownerId !== loserBaselineLease.row.ownerId
    || winnerCommittedLease.raw !== winnerAcquiredLease.raw) {
    reasons.push('TTL-bound active-play lease handoff');
  }

  let winnerAssessment = null;
  try { winnerAssessment = assessCompendiumFeedCommittedOutcome(winner); }
  catch { winnerAssessment = null; }
  if (winnerAssessment?.ok !== true
    || winner?.heartbeat?.documentToken !== winnerDocument?.documentToken
    || !hexDigest(winner?.committedRawPersistenceFingerprint)) {
    reasons.push('winner one exact committed Feed');
  }
  const feedAssessorOnlyFields = new Set([
    'runtime',
    'fedBefore', 'fedAfter', 'creatureId', 'foodLotId',
    'foodQuantityBefore', 'foodQuantityAfter',
    'receiptOrdinal', 'receiptKind', 'receiptWitness', 'receiptWitnessDigest',
  ]);
  const persistedFeedProjection = (candidate) => candidate !== null
    && typeof candidate === 'object' && !Array.isArray(candidate)
    ? Object.fromEntries(Object.entries(candidate).filter(
      ([key]) => !feedAssessorOnlyFields.has(key),
    ))
    : null;
  const winnerDurableProjection = persistedFeedProjection(winner?.after);

  const loserSettled = observation?.loser?.settled;
  const loserController = loserSettled?.controller;
  const loserRequest = loserController?.lastRequest;
  const loserCopy = loserController?.lastOutcome;
  const loserCoordinator = loserSettled?.actionCoordinator;
  const exactLoserRequest = nonEmptyString(loserRequest?.surface?.surfaceKey)
    && nonEmptyString(loserRequest?.contextKey)
    && loserRequest?.ownershipRevision === winner?.before?.ownershipRevision
    && loserRequest?.ownershipDigest === winner?.before?.targetDigest
    && loserRequest?.creatureId === fixture.creatureId
    && loserRequest?.foodLotId === fixture.foodLotId
    && loserRequest?.fedBefore === fixture.fedBefore
    && loserRequest?.fedAfter === fixture.fedAfter
    && loserRequest?.foodQuantityBefore === fixture.foodQuantityBefore
    && loserRequest?.foodQuantityAfter === fixture.foodQuantityAfter;
  if (loserSettled?.lastOutcome !== 'refused:transaction:stale'
    || loserController?.schema !== 'cf-v2-compendium-feed-diagnostics/v1'
    || loserController?.pendingWork !== 0
    || loserController?.convergenceLatched !== true
    || !exactLoserRequest
    || loserCopy?.schema !== 'cf-v2-compendium-feed-outcome/v1'
    || loserCopy?.kind !== 'refused'
    || loserCopy?.convergence !== 'read-only-reload'
    || canonicalJson(loserCopy?.request) !== canonicalJson(loserRequest)
    || loserCopy?.title !== 'Reload required.'
    || loserCopy?.detail !== 'Feed authority changed before durability. Meals and flora are unchanged.'
    || loserCoordinator?.inFlight !== false
    || loserCoordinator?.owner?.busy !== false
    || loserCoordinator?.owner?.operation !== null
    || loserCoordinator?.hold?.phase !== 'released'
    || loserCoordinator?.hold?.operation !== 'arc5.companion-feed') {
    reasons.push('loser real stale refusal and owner release');
  }
  if (loserSettled?.lastResult !== null || loserSettled?.feedResult !== 'null'
    || !safeInt(loserSettled?.toastSerialBefore)
    || loserSettled?.toastSerialAfter !== loserSettled.toastSerialBefore + 1
    || !/reload required/iu.test(loserSettled?.toastText ?? '')
    || /meal complete/iu.test(loserSettled?.toastText ?? '')
    || loserSettled?.audioCreates !== 0
    || !Array.isArray(loserSettled?.audioStarts)
    || loserSettled.audioStarts.length !== 0) {
    reasons.push('loser no publication or acknowledgement');
  }
  if (!hexDigest(loserSettled?.rawPersistenceFingerprint)
    || loserSettled.rawPersistenceFingerprint !== winner?.committedRawPersistenceFingerprint
    || canonicalJson(loserSettled?.durableAfterAttempt)
      !== canonicalJson(winnerDurableProjection)) {
    reasons.push('loser stale attempt preserves winner durable bytes');
  }

  const exactReleasedAudio = (audio) => {
    const counterpartReleased = audio?.counterpart?.status === 'none'
      ? audio.counterpart.key === null && audio.counterpart.generation === null
      : audio?.counterpart?.status === 'lost';
    return audio?.schema === 'cf-v2-tame-greeting-audio/v1'
      && audio.disposed === true && audio.armed === 0
      && audio.activeVoiceId === null && counterpartReleased
      && audio.runtime?.state === 'disposed' && audio.runtime.contextState === null
      && audio.runtime.nodes?.active === 0 && audio.runtime.voices?.active === 0
      && Array.isArray(audio.runtime.voices.ids) && audio.runtime.voices.ids.length === 0
      && audio.runtime.creatureEmitters?.active === 0
      && audio.runtime.reservations?.voices?.active === 0
      && audio.runtime.reservations?.nodes?.active === 0;
  };
  const convergence = observation?.loser?.convergence;
  const witness = convergence?.witness;
  const beforeRelease = witness?.before;
  const afterRelease = witness?.after;
  const beforeRuntime = beforeRelease?.runtime;
  const afterRuntime = afterRelease?.runtime;
  const runtimeParentExact = (runtime) => runtime?.schema === 'cf-v2-f4-runtime/v1'
    && runtime.revision === winner?.before?.globalRevision
    && runtime.sessionSeed === winner?.before?.sessionSeed
    && runtime.sessionOrdinal === winner?.before?.sessionOrdinal
    && canonicalJson(runtime.sessionDraws) === canonicalJson(winner?.before?.sessionDraws)
    && safeInt(runtime.activePlayMs)
    && runtime.activePlayMs >= (winner?.before?.authority?.activePlayMs ?? Number.POSITIVE_INFINITY)
    && safeInt(runtime.commits) && safeInt(runtime.staleWrites)
    && safeInt(runtime.leaseLosses);
  const runtimeTuple = (runtime) => canonicalJson({
    revision: runtime?.revision,
    sessionSeed: runtime?.sessionSeed,
    sessionOrdinal: runtime?.sessionOrdinal,
    sessionDraws: runtime?.sessionDraws,
    activePlayMs: runtime?.activePlayMs,
    staleBlocked: runtime?.staleBlocked,
    commits: runtime?.commits,
    staleWrites: runtime?.staleWrites,
    leaseLosses: runtime?.leaseLosses,
  });
  if (convergence?.released !== true || convergence?.witnessCount !== 1
    || witness?.schema !== 'cf-v2-f4-authority-convergence/v1'
    || witness?.status !== 'released'
    || !Array.isArray(witness?.errors) || witness.errors.length !== 0
    || witness?.detail !== 'Arc 5 Feed authority transaction:stale'
    || witness?.documentToken !== loserDocument?.documentToken
    || !safeInt(beforeRelease?.leaseReadCount)
    || afterRelease?.leaseReadCount !== beforeRelease.leaseReadCount
    || !safeInt(beforeRelease?.revisionReadCount)
    || afterRelease?.revisionReadCount !== beforeRelease.revisionReadCount
    || !runtimeParentExact(beforeRuntime) || !runtimeParentExact(afterRuntime)
    || beforeRelease?.hold !== 'transient-read'
    || beforeRelease?.mutationBlocked !== true
    || beforeRelease?.heartbeatRunning !== false
    || beforeRuntime?.visible !== true || beforeRuntime?.answerable !== false
    || beforeRuntime?.leaseOwned !== false || beforeRuntime?.staleBlocked !== true
    || beforeRuntime?.leaseHeartbeat !== null || beforeRuntime?.accruing !== false
    || beforeRuntime?.staleWrites < 1
    || afterRelease?.heartbeatRunning !== false
    || afterRuntime?.visible !== false || afterRuntime?.answerable !== false
    || afterRuntime?.leaseOwned !== false || afterRuntime?.leaseHeartbeat !== null
    || afterRuntime?.accruing !== false
    || runtimeTuple(afterRuntime) !== runtimeTuple(beforeRuntime)
    || !exactReleasedAudio(afterRelease?.audio)) {
    reasons.push('single stale convergence release');
  }

  const reloaded = observation?.loser?.reloaded;
  if (!nonEmptyString(reloaded?.documentToken)
    || reloaded.documentToken === loserDocument?.documentToken
    || reloaded.documentToken === winnerDocument?.documentToken
    || reloaded?.bootKind !== 'current-v5') {
    reasons.push('loser replacement document and current-v5 boot');
  }
  if (!hexDigest(reloaded?.rawPersistenceFingerprint)
    || reloaded.rawPersistenceFingerprint !== winner?.committedRawPersistenceFingerprint
    || canonicalJson(reloaded?.durable) !== canonicalJson(winnerDurableProjection)
    || reloaded?.feed?.logicalId !== fixture.logicalId
    || reloaded?.feed?.creatureId !== fixture.creatureId
    || reloaded?.feed?.fed !== fixture.fedAfter
    || reloaded?.feed?.foodLotId !== fixture.foodLotId
    || reloaded?.feed?.foodQuantity !== fixture.foodQuantityAfter
    || reloaded?.feed?.pendingWork !== 0) {
    reasons.push('loser reload byte-identical winner fixed point');
  }
  const reloadRuntime = reloaded?.persistence?.runtime;
  if (reloaded?.persistence?.mutationBlocked !== true
    || reloadRuntime?.schema !== 'cf-v2-f4-runtime/v1'
    || reloadRuntime?.revision !== winner?.after?.globalRevision
    || reloadRuntime?.sessionSeed !== winner?.after?.sessionSeed
    || reloadRuntime?.sessionOrdinal !== winner?.after?.sessionOrdinal
    || canonicalJson(reloadRuntime?.sessionDraws) !== canonicalJson(winner?.after?.sessionDraws)
    || reloadRuntime?.visible !== false || reloadRuntime?.answerable !== false
    || reloadRuntime?.leaseOwned !== false || reloadRuntime?.leaseHeartbeat !== null
    || reloadRuntime?.accruing !== false) {
    reasons.push('loser reload remains read-only under winner lease');
  }
  return { ok: reasons.length === 0, reasons };
}

/* Arc 0 classifies an expected native action result, document identity and
   bounded settlement wait before a generic harness catch can erase the
   causal product scope. */
export function assessArc0LandingAwaitBoundary({
  actualAccepted,
  expectedAccepted,
  actionDocumentToken,
  expectedDocumentToken,
  waitError = null,
} = {}) {
  const reasons = [];
  if (typeof expectedAccepted !== 'boolean'
    || actualAccepted !== expectedAccepted) {
    reasons.push(`accepted ${JSON.stringify(actualAccepted)} !== ${JSON.stringify(expectedAccepted)}`);
  }
  if (typeof expectedDocumentToken !== 'string' || expectedDocumentToken.length === 0
    || actionDocumentToken !== expectedDocumentToken) {
    reasons.push('action document token drifted');
  }
  if (waitError !== null) {
    const message = typeof waitError === 'string' ? waitError : String(waitError);
    reasons.push(`expected stage did not settle: ${message.slice(0, 2_048)}`);
  }
  return Object.freeze({ ok: reasons.length === 0, reasons: Object.freeze(reasons) });
}

/* Publication-failure evidence is evaluated browser-free as two independent
   facts: the old document retained its exact live product, and it retained
   the already-certified post-Survey route/card. Keeping this executable
   decision outside the browser driver prevents a contradictory route oracle
   from consuming another full Slice certification attempt. */
const ARC0_LANDING_LIVE_PRODUCT_KEYS = Object.freeze([
  'mode', 'gal', 'galX', 'galY', 'star', 'starX', 'starY', 'planet',
  'planetOrdinal', 'navGalaxyKey', 'navStarKey', 'navWorldKey', 'save',
]);
const ARC0_PERTAR_GALAXY_KEY = ARC4_PERTAR_FIXTURE.worldKey.slice(
  0, ARC4_PERTAR_FIXTURE.worldKey.indexOf('|s:'),
);
const ARC0_PERTAR_STAR_KEY = ARC4_PERTAR_FIXTURE.worldKey.slice(
  0, ARC4_PERTAR_FIXTURE.worldKey.lastIndexOf('|p:'),
);
const ARC0_PERTAR_SHARE_PAYLOAD = Object.freeze({
  t: 'p',
  g: Object.freeze([
    ARC4_PERTAR_FIXTURE.worldAddress.galaxy.x,
    ARC4_PERTAR_FIXTURE.worldAddress.galaxy.y,
    ARC4_PERTAR_FIXTURE.worldAddress.galaxy.size,
    ARC4_PERTAR_FIXTURE.worldAddress.galaxy.sp,
    ARC4_PERTAR_FIXTURE.worldAddress.galaxy.tilt,
    ARC4_PERTAR_FIXTURE.worldAddress.galaxy.rot,
    ARC4_PERTAR_FIXTURE.worldAddress.galaxy.seed,
    (ARC4_PERTAR_FIXTURE.worldAddress.galaxy.home ? 1 : 0)
      | (ARC4_PERTAR_FIXTURE.worldAddress.galaxy.quasar ? 2 : 0)
      | (ARC4_PERTAR_FIXTURE.worldAddress.galaxy.dwarf ? 4 : 0),
  ]),
  s: Object.freeze([
    ARC4_PERTAR_FIXTURE.publicStar.x,
    ARC4_PERTAR_FIXTURE.publicStar.y,
    ARC4_PERTAR_FIXTURE.publicStar.seed,
  ]),
  p: ARC4_PERTAR_FIXTURE.planet.seed,
});
const decodeArc0Cf1Payload = (code) => {
  if (typeof code !== 'string' || !code.startsWith('CF1-')) return null;
  try {
    const payload = JSON.parse(Buffer.from(code.slice(4), 'base64url').toString('utf8'));
    return payload && typeof payload === 'object' && !Array.isArray(payload) ? payload : null;
  } catch { return null; }
};

/* This is the complete absolute post-Survey Pertar route/card/share predicate.
   It remains browser-free: the browser collects only plain state, CF1 code and
   target evidence, while this contract owns the verdict and its mutations. */
export function arc0LandingSurveyRouteIsExact({ state, cardCode, target } = {}) {
  const payload = decodeArc0Cf1Payload(cardCode);
  const canonicalCardCode = payload === null ? null
    : `CF1-${Buffer.from(JSON.stringify(payload)).toString('base64url')}`;
  return state?.mode === 'system'
    && state?.gal === ARC4_PERTAR_FIXTURE.galaxy.seed
    && state?.galX === ARC4_PERTAR_FIXTURE.galaxy.x
    && state?.galY === ARC4_PERTAR_FIXTURE.galaxy.y
    && state?.star === ARC4_PERTAR_FIXTURE.publicStar.seed
    && state?.starX === ARC4_PERTAR_FIXTURE.publicStar.x
    && state?.starY === ARC4_PERTAR_FIXTURE.publicStar.y
    && state?.planet === null && state?.planetOrdinal === null
    && state?.navGalaxyKey === ARC0_PERTAR_GALAXY_KEY
    && state?.navStarKey === ARC0_PERTAR_STAR_KEY && state?.navWorldKey === null
    && state?.cardOpen === true && state?.cardTitle === 'Pertar'
    && state?.epoch === ARC4_PERTAR_FIXTURE.ecologyEpoch
    && exactKeys(state?.renderedScene, [
      'serial', 'mode', 'ecologyEpoch', 'galaxyKey', 'starKey', 'worldKey',
    ])
    && Number.isInteger(state?.renderedScene?.serial) && state.renderedScene.serial > 0
    && state.renderedScene.mode === 'system'
    && state.renderedScene.ecologyEpoch === ARC4_PERTAR_FIXTURE.ecologyEpoch
    && state.renderedScene.galaxyKey === ARC0_PERTAR_GALAXY_KEY
    && state.renderedScene.starKey === ARC0_PERTAR_STAR_KEY
    && state.renderedScene.worldKey === null
    && exactKeys(payload, ['t', 'g', 's', 'p'])
    && exactJson(payload, ARC0_PERTAR_SHARE_PAYLOAD)
    && cardCode === canonicalCardCode
    && exactKeys(target, [
      'seed', 'ordinal', 'screenX', 'screenY', 'width', 'height',
    ])
    && target?.seed === ARC4_PERTAR_FIXTURE.planet.seed
    && target?.ordinal === ARC4_PERTAR_FIXTURE.planet.ordinal
    && Number.isFinite(target.screenX) && Number.isFinite(target.screenY)
    && Number.isFinite(target.width) && target.width > 0
    && Number.isFinite(target.height) && target.height > 0;
}

export function assessArc0LandingPublicationWithheld({
  beforeProduct,
  heldProduct,
  heldState,
  cardCode,
  target,
} = {}) {
  const reasons = [];
  const complete = (product) => exactKeys(product, ARC0_LANDING_LIVE_PRODUCT_KEYS)
    && product.save !== null && typeof product.save === 'object'
    && !Array.isArray(product.save);
  if (!complete(beforeProduct) || !complete(heldProduct)) {
    reasons.push('old document live product evidence was incomplete');
  } else if (!exactJson(beforeProduct, heldProduct)) {
    reasons.push('old document live product changed before replacement');
  }
  if (!arc0LandingSurveyRouteIsExact({ state: heldState, cardCode, target })) {
    reasons.push('old document did not retain its exact post-Survey route/card/share/target');
  }
  return Object.freeze({ ok: reasons.length === 0, reasons: Object.freeze(reasons) });
}

const ARC0_LANDING_FAULT_ARM_KEYS = Object.freeze([
  'storageFailure', 'staleAuthority', 'publicationFailure',
]);

/* Arc 0 setup/reload evidence accepts only the current complete coordinator
   projection. An empty or partially renamed fault map must not pass merely
   because every value that happens to remain is false, and a diagnostic hold
   from an earlier action is not an idle predecessor. */
export function arc0LandingCoordinatorIsIdle(state, { clearFault = false } = {}) {
  const landing = state?.landing;
  const coordinator = landing?.actionCoordinator;
  const owner = coordinator?.owner;
  const hold = coordinator?.hold;
  const faultArmed = coordinator?.faultArmed;
  return landing?.schema === 'cf-v2-arc0-landing-app-state/v1'
    && exactKeys(
      coordinator,
      ['inFlight', 'owner', 'hold', 'faultArmed', 'lastFault'],
    )
    && coordinator.inFlight === false
    && exactKeys(owner, ['schema', 'busy', 'operation'])
    && owner.schema === 'cf-v2-product-action-coordinator-diagnostics/v1'
    && owner.busy === false && owner.operation === null
    && exactKeys(hold, ['schema', 'phase', 'operation', 'sequence'])
    && hold.schema === 'cf-v2-product-action-hold-diagnostics/v1'
    && hold.phase === 'idle' && hold.operation === null && hold.sequence === 0
    && exactKeys(faultArmed, ARC0_LANDING_FAULT_ARM_KEYS)
    && ARC0_LANDING_FAULT_ARM_KEYS.every((key) => faultArmed[key] === false)
    && (!clearFault || coordinator.lastFault === null);
}

/* A D-TRAIN transaction can only judge the product's busy-refusal branch
   after the harness proves that its exact fixture owns the current document
   and that the real Training action is runnable. Optional-chaining a missing
   button turns setup drift into a false product verdict. */
export function assessTrainingBusyRefusalPrecondition(observation, expected) {
  if (!expected || typeof expected !== 'object'
    || !nonEmptyString(expected.documentToken)
    || !nonEmptyString(expected.primaryRaw)) {
    throw new TypeError('Training busy-refusal precondition requires exact document and primary bytes');
  }
  if (!observation || typeof observation !== 'object') {
    return { ok: false, reasons: ['precondition observation absent'] };
  }
  const reasons = [];
  if (observation.documentToken !== expected.documentToken) reasons.push('document identity');
  if (observation.primaryRaw !== expected.primaryRaw) reasons.push('primary bytes');
  const state = observation.state;
  if (!state || typeof state !== 'object') reasons.push('Training state absent');
  else {
    if (state.tutActive !== true || state.tutDone !== false || state.tutStep !== 'welcome') {
      reasons.push('Training is not runnable at welcome');
    }
    if (state.trainingCheckpointKind !== 'legacy-v1'
      || state.trainingCheckpointWriteHeld !== true
      || !state.tutSnapshotPending || typeof state.tutSnapshotPending !== 'object'
      || Array.isArray(state.tutSnapshotPending)) {
      reasons.push('legacy checkpoint ownership');
    }
    if (state.mode !== 'system' || state.gal !== 999 || state.star !== 424242 || state.planet !== null
      || !nonEmptyString(state.navGalaxyKey) || !nonEmptyString(state.navStarKey)
      || state.navWorldKey !== null) {
      reasons.push('Training route');
    }
    const rendered = state.renderedScene;
    if (!rendered || typeof rendered !== 'object' || rendered.mode !== 'system'
      || !safeInt(rendered.serial) || rendered.serial < 1
      || rendered.galaxyKey !== state.navGalaxyKey || rendered.starKey !== state.navStarKey
      || rendered.worldKey !== null) {
      reasons.push('rendered Training route');
    }
  }
  if (observation.card !== true || observation.trainingBody !== true) reasons.push('Training card');
  const button = observation.button;
  if (!button || typeof button !== 'object' || button.present !== true
    || button.connected !== true || button.disabled !== false || button.visible !== true
    || observation.buttonOwnedByCard !== true) {
    reasons.push('runnable Skip action');
  }
  const status = observation.status;
  if (!status || typeof status !== 'object' || status.present !== true || status.hidden !== true
    || observation.statusOwnedByCard !== true) {
    reasons.push('idle Training status');
  }
  if (observation.tickerStarted !== true) reasons.push('outgoing ticker');
  return { ok: reasons.length === 0, reasons };
}

export function trainingBindingReceiptBeforeDeadline(
  entries, expectedCount, deadlineMs, receivedAtMs,
) {
  if (!Array.isArray(entries) || !Number.isInteger(expectedCount) || expectedCount <= 0
    || !Number.isFinite(deadlineMs) || !Number.isFinite(receivedAtMs)) {
    throw new TypeError('Training binding receipt requires entries, positive count, and finite monotonic times');
  }
  return entries.length >= expectedCount && receivedAtMs < deadlineMs;
}

/* A rendering-opportunity-owned outcome is evidence only while the exact page
   target and document are foregrounded and have crossed both halves of the
   production scheduler (rAF, then a later task). Runtime.evaluate can still
   answer for a background page whose rAF queue is intentionally paused, so
   target command success alone is not foreground authority. */
export function classifyForegroundServiceTurn(observation, expected) {
  if (!expected || typeof expected !== 'object'
    || !nonEmptyString(expected.targetId)
    || !nonEmptyString(expected.documentToken)
    || !nonEmptyString(expected.serviceToken)) {
    throw new TypeError('foreground service authority requires exact target, document, and service tokens');
  }
  if (!observation || typeof observation !== 'object') {
    return { status: 'error', reasons: ['foreground observation absent'] };
  }
  const errors = [];
  const pending = [];
  if (observation.targetId !== expected.targetId) {
    errors.push(`target identity ${JSON.stringify(observation.targetId)}`);
  }
  if (observation.documentToken !== expected.documentToken) {
    errors.push(`document identity ${JSON.stringify(observation.documentToken)}`);
  }
  if (observation.visibilityState !== 'visible' || observation.hidden !== false) {
    errors.push(`page visibility ${JSON.stringify(observation.visibilityState)}/${JSON.stringify(observation.hidden)}`);
  }
  if (observation.focused !== true) errors.push('page unfocused');
  const service = observation.service;
  if (!service || typeof service !== 'object') errors.push('service witness absent');
  else {
    if (service.token !== expected.serviceToken) {
      errors.push(`service identity ${JSON.stringify(service.token)}`);
    }
    if (!safeInt(service.visibilityChanges)) errors.push('visibility change count invalid');
    else if (service.visibilityChanges !== 0) {
      errors.push(`visibility changed ${service.visibilityChanges} time(s)`);
    }
    if (!safeInt(service.focusLosses)) errors.push('focus loss count invalid');
    else if (service.focusLosses !== 0) errors.push(`focus lost ${service.focusLosses} time(s)`);
    if (service.laterTask === true && service.raf !== true) errors.push('service phase order');
    for (const [phase, serviced, visibilityState, hidden, focused] of [
      ['arm', true, service.armVisibilityState, service.armHidden, service.armFocused],
      ['rendering opportunity', service.raf, service.rafVisibilityState, service.rafHidden, service.rafFocused],
      ['later task', service.laterTask, service.laterVisibilityState, service.laterHidden, service.laterFocused],
    ]) {
      if (serviced !== true) {
        pending.push(`${phase} pending`);
        continue;
      }
      if (visibilityState !== 'visible' || hidden !== false) {
        errors.push(`${phase} visibility ${JSON.stringify(visibilityState)}/${JSON.stringify(hidden)}`);
      }
      if (focused !== true) errors.push(`${phase} unfocused`);
    }
  }
  if (errors.length) return { status: 'error', reasons: [...errors, ...pending] };
  if (pending.length) return { status: 'pending', reasons: pending };
  return { status: 'ready', reasons: [] };
}

export function classifyForegroundServiceTurnReceipt(
  observation, expected, deadlineMs, receivedAtMs,
) {
  if (!Number.isFinite(deadlineMs) || !Number.isFinite(receivedAtMs)) {
    throw new TypeError('foreground service receipt requires finite monotonic times');
  }
  const decision = classifyForegroundServiceTurn(observation, expected);
  if (receivedAtMs < deadlineMs) return decision;
  return {
    status: 'error',
    reasons: [
      `foreground observation received at/after deadline (${receivedAtMs} >= ${deadlineMs})`,
      ...decision.reasons,
    ],
  };
}

/* The lazy-art live and closed owners share one held network release, but
   they must not share the product's persistence/F4 origin. Each fresh origin
   also installs the exact PWA: Chromium therefore requests the sealed worker
   entry with destination=worker for the product and may request it with
   destination=empty while filling the offline cache. Either role may reach
   the server first and a cache hit may keep the other off the network, so the
   art outcome proves product completion while this ledger rejects duplicate
   requests within either exact role. */
export function assessLazyOwnerOriginGate({
  liveOrigin, closedOrigin, expectedPath, stage, requestAttempts,
} = {}) {
  const errors = [];
  const pending = [];
  if (!nonEmptyString(liveOrigin)) errors.push('live owner origin');
  if (!nonEmptyString(closedOrigin)) errors.push('closed owner origin');
  if (nonEmptyString(liveOrigin) && liveOrigin === closedOrigin) {
    errors.push('distinct owner origins');
  }
  if (!nonEmptyString(expectedPath) || !expectedPath.startsWith('/')) {
    errors.push('exact sealed-worker request path');
  }
  if (stage !== 'pre-release' && stage !== 'settled') {
    errors.push('known lazy-owner request stage');
  }
  if (!Array.isArray(requestAttempts)) {
    errors.push('sealed-worker request-attempt ledger');
  } else {
    const recognized = requestAttempts.every((attempt, index) => attempt
      && attempt.ordinal === index + 1
      && (attempt.owner === 'closed' || attempt.owner === 'live')
      && (attempt.destination === 'worker' || attempt.destination === 'empty')
      && (attempt.phase === 'held' || attempt.phase === 'post-release')
      && attempt.method === 'GET'
      && attempt.pathname === expectedPath);
    if (!recognized) errors.push('recognized sealed-worker request roles');
    const roleKeys = requestAttempts.map((attempt) => `${attempt?.owner ?? ''}:${attempt?.destination ?? ''}`);
    if (new Set(roleKeys).size !== roleKeys.length) {
      errors.push('one request per sealed-worker role and owner');
    }
    if (stage === 'pre-release' && requestAttempts.some((attempt) => attempt?.phase !== 'held')) {
      errors.push('pre-release requests remain held');
    }
    for (const owner of ['closed', 'live']) {
      const attempts = requestAttempts.filter((attempt) => attempt?.owner === owner);
      if (attempts.length === 0) {
        if (stage === 'pre-release') pending.push(`${owner} sealed-worker request pending`);
        else errors.push(`${owner} sealed-worker request missing`);
      } else if (stage === 'settled' && !attempts.some((attempt) => attempt.phase === 'held')) {
        errors.push(`${owner} held request history`);
      }
    }
  }
  const status = errors.length ? 'error' : pending.length ? 'pending' : 'ready';
  return { status, ok: status === 'ready', reasons: [...errors, ...pending] };
}

/* A network-visible Worker request is not mandatory after a newly installed
   service worker claims a fresh origin: the exact entry can be served from
   its verified cache. Product authority therefore comes from the loader's
   own document/producer identity and counters, not from guessing which HTTP
   request won the first-install race. */
export function assessLazyProductProducerSettlement(
  diagnostics, expectedDocumentToken, expectedResults = null,
) {
  const reasons = [];
  if (!nonEmptyString(expectedDocumentToken)) reasons.push('expected document token');
  if (expectedResults !== null && (!Number.isInteger(expectedResults) || expectedResults < 0)) {
    reasons.push('expected result count');
  }
  if (!diagnostics || typeof diagnostics !== 'object') {
    return { ok: false, reasons: [...reasons, 'lazy-art producer diagnostics'] };
  }
  if (diagnostics.schema !== 'cf-v2-species-art-worker-diagnostics/v2') reasons.push('diagnostic schema');
  if (diagnostics.state !== 'ready') reasons.push('ready producer state');
  if (diagnostics.importStarts !== 1) reasons.push('one loader producer acquisition');
  if (diagnostics.identity?.documentToken !== expectedDocumentToken) reasons.push('exact producer document token');
  if (diagnostics.identity?.lastProducerEpoch !== 1) reasons.push('one producer epoch');
  if (diagnostics.identity?.lastWorkerInstanceId !== 1) reasons.push('one worker instance');
  if (diagnostics.worker?.starts !== 1) reasons.push('one worker start');
  if (diagnostics.worker?.ready !== 1) reasons.push('one worker ready');
  if (diagnostics.worker?.live !== false) reasons.push('settled worker is not live');
  if (diagnostics.worker?.disposals !== 1) reasons.push('one worker disposal');
  if (diagnostics.worker?.fatals !== 0) reasons.push('zero worker fatals');
  if (diagnostics.worker?.protocolErrors !== 0) reasons.push('zero worker protocol errors');
  const phaseFields = [
    'importStarts', 'importCompletes',
    'thumbJobStarts', 'thumbRenderCompletes', 'thumbEncodeStarts', 'thumbEncodeCompletes',
    'portraitJobStarts', 'portraitRenderCompletes', 'portraitEncodeStarts', 'portraitEncodeCompletes',
  ];
  const phasesComplete = diagnostics.phases && phaseFields.every((field) => (
    Number.isInteger(diagnostics.phases[field]) && diagnostics.phases[field] >= 0
  ));
  if (!phasesComplete || diagnostics.phases.importStarts !== 1
    || diagnostics.phases.importCompletes !== 1) {
    reasons.push('one complete worker acquisition phase');
  }
  if (!diagnostics.lastEvent || diagnostics.lastEvent.producerEpoch !== 1
    || diagnostics.lastEvent.workerInstanceId !== 1) {
    reasons.push('last event belongs to exact producer');
  }
  if (diagnostics.lastError !== null) reasons.push('no retained producer error');
  const resultsComplete = diagnostics.results
    && Number.isInteger(diagnostics.results.count) && diagnostics.results.count >= 0
    && ['maxImportDurationMs', 'maxRenderDurationMs', 'maxEncodeDurationMs']
      .every((field) => Number.isFinite(diagnostics.results[field]) && diagnostics.results[field] >= 0);
  if (!resultsComplete) reasons.push('complete producer result diagnostics');
  if (resultsComplete && expectedResults !== null && diagnostics.results.count !== expectedResults) {
    reasons.push('exact producer result count');
  }
  if (phasesComplete && resultsComplete) {
    const thumbComplete = diagnostics.phases.thumbRenderCompletes
      === diagnostics.phases.thumbEncodeStarts
      && diagnostics.phases.thumbEncodeStarts === diagnostics.phases.thumbEncodeCompletes
      && diagnostics.phases.thumbJobStarts >= diagnostics.phases.thumbRenderCompletes;
    const portraitComplete = diagnostics.phases.portraitRenderCompletes
      === diagnostics.phases.portraitEncodeStarts
      && diagnostics.phases.portraitEncodeStarts === diagnostics.phases.portraitEncodeCompletes
      && diagnostics.phases.portraitJobStarts >= diagnostics.phases.portraitRenderCompletes;
    const resultParity = diagnostics.results.count
      === diagnostics.phases.thumbEncodeCompletes + diagnostics.phases.portraitEncodeCompletes;
    if (!thumbComplete || !portraitComplete || !resultParity) reasons.push('coherent producer phase/results');
  }
  if (expectedResults !== null) {
    const exactThumbPhases = phasesComplete
      && diagnostics.phases.thumbJobStarts === expectedResults
      && diagnostics.phases.thumbRenderCompletes === expectedResults
      && diagnostics.phases.thumbEncodeStarts === expectedResults
      && diagnostics.phases.thumbEncodeCompletes === expectedResults
      && diagnostics.phases.portraitJobStarts === 0
      && diagnostics.phases.portraitRenderCompletes === 0
      && diagnostics.phases.portraitEncodeStarts === 0
      && diagnostics.phases.portraitEncodeCompletes === 0;
    if (!exactThumbPhases) reasons.push('exact thumbnail producer phases');
    if (expectedResults > 0 && (diagnostics.lastEvent?.event !== 'result'
      || diagnostics.lastEvent?.kind !== 'thumb132'
      || diagnostics.lastEvent?.jobId !== expectedResults)) {
      reasons.push('final product result event');
    }
  }
  if (!diagnostics.errors || ['capability', 'protocol', 'import', 'paint', 'encode']
    .some((field) => diagnostics.errors[field] !== 0)) {
    reasons.push('zero lazy-art producer errors');
  }
  return { ok: reasons.length === 0, reasons };
}

export function buildLazyRefillObservationExpression(foregroundExpression) {
  if (typeof foregroundExpression !== 'string' || foregroundExpression.length === 0) {
    throw new TypeError('lazy refill observation requires its foreground expression');
  }
  return `(()=>{ const S=window.__CF_SLICE__,
    foreground=${foregroundExpression},d=S?.api?.compendiumDiagnostics?.()??null;
    if(!d)return {done:false,reason:'slice-document-unavailable',foreground};
    const
    close=document.querySelector('#codexpanel [data-pnx]'),rows=[...document.querySelectorAll('#codexpanel [data-ci]')],
    originalRows=Array.isArray(window.__cfLazyOriginalRows)?window.__cfLazyOriginalRows:null,
    imageNodes=rows.map(row=>row.querySelector('img')),images=imageNodes.map(image=>{const src=image?.getAttribute('src')||null;return {exists:!!image,
      state:image?.dataset.thumbState||null,hasSrc:!!src,
      srcKind:src?.startsWith('blob:')?'blob-url':src?.startsWith('data:image/')?'data-image':src?'other':null,
      complete:image?.complete===true,naturalWidth:image?.naturalWidth||0,naturalHeight:image?.naturalHeight||0,
      width:image?.getAttribute('width')||null,height:image?.getAttribute('height')||null}}),
    art=d.art||null,live=art?.live||null,lazyArt=d.lazyArt||null;
    const settled=images.length===3&&images.every(image=>image.exists&&image.state==='ready'
      &&image.srcKind==='blob-url'&&image.complete&&image.naturalWidth===132&&image.naturalHeight===132)
      &&lazyArt?.state==='ready'&&live?.queuedJobs===0&&live?.activeJobs===0;
    return {done:settled,panelMode:d.panel.mode,images,
      queuedJobs:live?.queuedJobs??null,activeJobs:live?.activeJobs??null,foreground,
      lazyArt:lazyArt?{schema:lazyArt.schema,state:lazyArt.state,importStarts:lazyArt.importStarts,
        identity:lazyArt.identity,lastEvent:lazyArt.lastEvent,lastError:lazyArt.lastError,
        worker:lazyArt.worker,phases:lazyArt.phases,
        results:lazyArt.results,errors:lazyArt.errors}:null,
      art:art?{schema:art.schema,deviceClass:art.deviceClass,live:art.live,totals:art.totals,keys:art.keys}:null,
      sameClose:close===window.__cfLazyOriginalClose,
      sameRows:originalRows!==null&&rows.length===originalRows.length&&rows.every((row,index)=>row===originalRows[index]),
      generation:d.generation,renderCommits:d.panel.renderCommits,focus:document.activeElement===close,
      exact132:images.length===3&&images.every(image=>image.srcKind==='blob-url'
        &&image.complete&&image.naturalWidth===132&&image.naturalHeight===132)}; })()`;
}

export function planetsidePhaseRemainingMs(deadlineMs, nowMs) {
  if (!Number.isFinite(deadlineMs) || !Number.isFinite(nowMs)) {
    throw new TypeError('Planetside phase deadline and monotonic observation must be finite');
  }
  return Math.max(0, Math.floor(deadlineMs - nowMs));
}

export function planetsideRuntimeTimeoutDecision(error, phaseTimeoutMs) {
  const message = typeof error?.message === 'string' ? error.message : '';
  if (!/(?:^|: )timed out waiting for Runtime\.evaluate$/.test(message)) return null;
  if (!Number.isInteger(phaseTimeoutMs) || phaseTimeoutMs <= 0) {
    throw new TypeError('Planetside phase timeout must be a positive integer');
  }
  return {
    status: 'pending',
    reasons: [`phase deadline expired during target observation (${phaseTimeoutMs}ms)`],
  };
}

/* Compendium detail is an explicitly asynchronous 440px owner. A connected
   placeholder is expected while the worker crosses its serviced turn, but a
   stale owner, producer error or contradictory ready state is terminal. */
export function classifyCompendiumDetailSettlement(observation, expected) {
  if (!expected || typeof expected !== 'object'
    || !nonEmptyString(expected.documentToken)
    || !safeInt(expected.preEnterGeneration)
    || expected.preEnterGeneration >= Number.MAX_SAFE_INTEGER
    || !nonEmptyString(expected.logicalId)) {
    throw new TypeError('Compendium detail settlement requires exact document, generation and logical owner');
  }
  if (!observation || typeof observation !== 'object') {
    return { status: 'pending', reasons: ['observation absent'] };
  }
  const terminal = [];
  const pending = [];
  if (observation.panelMode !== 'detail' || observation.detailPresent !== true) {
    terminal.push(`detail surface ${JSON.stringify(observation.panelMode)}/${JSON.stringify(observation.detailPresent)}`);
  }
  if (observation.documentToken !== expected.documentToken) {
    terminal.push(`document identity ${JSON.stringify(observation.documentToken)}`);
  }
  if (observation.generation !== expected.preEnterGeneration + 1) {
    terminal.push(`Compendium generation ${JSON.stringify(observation.generation)}`);
  }
  if (observation.logicalId !== expected.logicalId) {
    terminal.push(`logical owner ${JSON.stringify(observation.logicalId)}`);
  }
  const image = observation.image;
  if (!image || typeof image !== 'object' || image.present !== true) {
    terminal.push('detail image absent');
  } else {
    if (image.connected !== true) terminal.push('detail image disconnected');
    if (image.state === 'error') terminal.push('detail portrait producer error');
    else if (image.state === 'placeholder') pending.push('detail portrait placeholder');
    else if (image.state !== 'ready') terminal.push(`detail portrait state ${JSON.stringify(image.state)}`);
    if (image.state === 'ready') {
      if (image.hasSrc !== true) terminal.push('detail portrait ready without src');
      else if (!safeInt(image.srcLength) || image.srcLength <= 5000) {
        terminal.push(`detail portrait src length ${JSON.stringify(image.srcLength)}`);
      }
      if (image.complete !== true) pending.push('detail portrait decode pending');
      if (image.complete === true && (image.naturalWidth !== 440 || image.naturalHeight !== 440)) {
        terminal.push(`detail portrait dimensions ${image.naturalWidth}x${image.naturalHeight}`);
      }
    }
  }
  if (terminal.length) return { status: 'error', reasons: [...pending, ...terminal] };
  if (pending.length) return { status: 'pending', reasons: pending };
  return { status: 'ready', reasons: [] };
}

export function classifyCompendiumDetailReceipt(
  observation, expected, deadlineMs, receivedAtMs,
) {
  if (!Number.isFinite(deadlineMs) || !Number.isFinite(receivedAtMs)) {
    throw new TypeError('Compendium detail receipt requires finite monotonic times');
  }
  const decision = classifyCompendiumDetailSettlement(observation, expected);
  if (receivedAtMs < deadlineMs) return decision;
  return {
    status: 'error',
    reasons: [
      `detail observation received at/after deadline (${receivedAtMs} >= ${deadlineMs})`,
      ...decision.reasons,
    ],
  };
}

export function classifyPlanetsideSettlement(observation) {
  const reasons = [];
  if (!observation || typeof observation !== 'object') {
    return { status: 'pending', reasons: ['observation absent'] };
  }
  if (observation.on !== true) reasons.push('surface hidden');
  if (!safeInt(observation.n) || observation.n < 3 || observation.n > 8) {
    reasons.push(`roster count ${JSON.stringify(observation.n)}`);
  }
  if (!Array.isArray(observation.images) || observation.images.length !== observation.n) {
    reasons.push(`image count ${JSON.stringify(observation.images?.length)}`);
  }
  const images = Array.isArray(observation.images) ? observation.images : [];
  const terminal = [];
  images.forEach((image, index) => {
    if (!image || typeof image !== 'object') {
      terminal.push(`image ${index} shape`);
      return;
    }
    if (image.state === 'error') terminal.push(`image ${index} producer error`);
    else if (image.state === 'placeholder') reasons.push(`image ${index} placeholder`);
    else if (image.state !== 'ready') terminal.push(`image ${index} state ${JSON.stringify(image.state)}`);
    if (image.state === 'ready') {
      if (image.hasSrc !== true) terminal.push(`image ${index} ready without src`);
      if (image.complete !== true) reasons.push(`image ${index} decode pending`);
      if (image.complete === true && (image.naturalWidth !== 132 || image.naturalHeight !== 132)) {
        terminal.push(`image ${index} dimensions ${image.naturalWidth}x${image.naturalHeight}`);
      }
    }
  });
  if (terminal.length) return { status: 'error', reasons: [...reasons, ...terminal] };

  const art = observation.art;
  if (!art || typeof art !== 'object' || !art.live || typeof art.live !== 'object') {
    reasons.push('art diagnostics absent');
  } else {
    if (!safeInt(art.live.queuedJobs)) reasons.push('queuedJobs invalid');
    else if (art.live.queuedJobs !== 0) reasons.push(`queuedJobs ${art.live.queuedJobs}`);
    if (!safeInt(art.live.activeJobs)) reasons.push('activeJobs invalid');
    else if (art.live.activeJobs !== 0) reasons.push(`activeJobs ${art.live.activeJobs}`);
  }
  const allReady = images.length === observation.n && images.length >= 3
    && images.every((image) => image?.state === 'ready' && image.hasSrc === true
      && image.complete === true && image.naturalWidth === 132 && image.naturalHeight === 132);
  return {
    status: reasons.length === 0 && allReady ? 'ready' : 'pending',
    reasons,
  };
}
