/* Pure contract for the Compendium real-browser budget gate.

   The browser collector records raw product/CDP/DOM observations. This file
   turns those observations into a sealed outcome inventory and verifies the
   current-run report. Keeping this layer browser-free lets the selftest break
   every required dimension independently without trusting Chromium. */
import crypto from 'node:crypto';

export const REPORT_SCHEMA = 'cf-v2-compendium-memory-report/v1';
export const BUDGET_SCHEMA = 'cf-v2-compendium-memory-budget/v1';
export const DIAGNOSTICS_SCHEMA = 'cf-v2-compendium-diagnostics/v1';
export const ART_DIAGNOSTICS_SCHEMA = 'cf-v2-species-art-diagnostics/v1';
export const PROFILES = Object.freeze(['phone', 'desktop']);
export const COMMAND_TIMEOUT_MS = 2000;
export const CANDIDATE_TRANSPORT_TIMEOUT_MS = 5000;
export const BASELINE_OBSERVATION_TIMEOUT_MS = 180000;
export const REQUIRED_WARM_CYCLES = 4;
export const OUTCOME_IDS = Object.freeze([
  'input-fixture-1500-distinct',
  'lazy-art-not-eager',
  'list-populated',
  'list-source-count-1500',
  'first-row-reached',
  'middle-row-reached',
  'last-row-reached',
  'filter-result',
  'detail-opened',
  'back-restores-focus',
  'close-restores-focus',
  'close-dom-cleanup',
  'focus-row-pinned',
  'planetside-bounded',
  'planetside-hide-release-reacquire',
  'mounted-window-bounded',
  'mounted-natural-dimensions',
  'list-source-132',
  'art-release',
  'art-disposal',
  'art-dedupe',
  'full-identity-key',
  'generation-guard',
  'error-contained',
  'error-recoverable',
  'cap-shrink',
  'canvas-thumb-path',
  'no-full-portrait-thumb-path',
  'settled-jobs',
  'resource-live-limits',
  'warm-plateau',
  'heap-ceiling',
  'dom-ceiling',
  'byte-ceiling',
  'target-answerable-first',
  'heartbeat-first',
  'target-answerable-last',
  'heartbeat-last',
]);
export const EXPECTED_OUTCOMES = Object.freeze(PROFILES.flatMap((profile) =>
  OUTCOME_IDS.map((id) => `${profile}/${id}`)));
export const REPORT_INPUT_KEYS = Object.freeze([
  'fixtureSpec', 'fixtureRows', 'fixtureGenerator', 'budget', 'budgetSchema',
  'outcomeContract', 'collector', 'package', 'packageLock', 'appPackage',
  'baselineSaveFixtures', 'outcomeInventory',
]);
export const REVIEW_PACKET_STATES = Object.freeze(['list', 'detail', 'focus-pinned']);

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function finite(value) { return typeof value === 'number' && Number.isFinite(value); }
function nonnegative(value) { return finite(value) && value >= 0; }
function integer(value) { return Number.isSafeInteger(value); }
function sameJson(left, right) { return JSON.stringify(left) === JSON.stringify(right); }
function exactKeys(value, expected, where, errors) {
  if (!isObject(value)) { errors.push(`${where} must be an object`); return false; }
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (!sameJson(actual, wanted)) {
    errors.push(`${where} keys must be exactly ${wanted.join(', ')}`);
    return false;
  }
  return true;
}
export function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function validTransportTimeoutPolicy({
  candidateTransportTimeoutMs,
  candidateTargetTimeoutMs,
  baselineTransportTimeoutMs,
  baselineObservationTimeoutMs,
}) {
  return integer(candidateTransportTimeoutMs)
    && candidateTransportTimeoutMs === CANDIDATE_TRANSPORT_TIMEOUT_MS
    && candidateTargetTimeoutMs === COMMAND_TIMEOUT_MS
    && integer(baselineTransportTimeoutMs)
    && baselineTransportTimeoutMs === BASELINE_OBSERVATION_TIMEOUT_MS
    && integer(baselineObservationTimeoutMs)
    && baselineObservationTimeoutMs === BASELINE_OBSERVATION_TIMEOUT_MS;
}

export function compendiumCdpOptions(kind, options) {
  if (!['candidate', 'baseline'].includes(kind) || !isObject(options)
    || Object.hasOwn(options, 'commandTimeoutMs')) {
    throw new Error('Compendium CDP options require one sealed transport kind and no timeout override');
  }
  return Object.freeze({
    ...options,
    commandTimeoutMs: kind === 'baseline'
      ? BASELINE_OBSERVATION_TIMEOUT_MS : CANDIDATE_TRANSPORT_TIMEOUT_MS,
  });
}

export function validProfileEmulationOptions(profile, viewport, options) {
  if (!['phone', 'desktop'].includes(profile) || !isObject(viewport) || !isObject(options)
    || !sameJson(Object.keys(options).sort(), ['deviceMetrics', 'touch'])
    || !isObject(options.deviceMetrics) || !isObject(options.touch)
    || !integer(viewport.width) || viewport.width <= 0
    || !integer(viewport.height) || viewport.height <= 0
    || !finite(viewport.dpr) || viewport.dpr <= 0
    || typeof viewport.mobile !== 'boolean') return false;
  const deviceKeys = Object.keys(options.deviceMetrics).sort();
  const expectedDeviceKeys = ['deviceScaleFactor', 'height', 'mobile', 'width'];
  if (!sameJson(deviceKeys, expectedDeviceKeys)
    || options.deviceMetrics.width !== viewport.width
    || options.deviceMetrics.height !== viewport.height
    || options.deviceMetrics.deviceScaleFactor !== viewport.dpr
    || options.deviceMetrics.mobile !== viewport.mobile
    || viewport.mobile !== (profile === 'phone')) return false;
  const touchKeys = Object.keys(options.touch).sort();
  return profile === 'phone'
    ? sameJson(touchKeys, ['enabled', 'maxTouchPoints'])
      && options.touch.enabled === true && options.touch.maxTouchPoints === 5
    : sameJson(touchKeys, ['enabled']) && options.touch.enabled === false;
}

export function compendiumProfileEmulationOptions(profile, viewport) {
  const options = Object.freeze({
    deviceMetrics: Object.freeze({
      width: viewport?.width, height: viewport?.height,
      deviceScaleFactor: viewport?.dpr, mobile: viewport?.mobile,
    }),
    touch: Object.freeze(profile === 'phone'
      ? { enabled: true, maxTouchPoints: 5 } : { enabled: false }),
  });
  if (!validProfileEmulationOptions(profile, viewport, options)) {
    throw new Error('Compendium profile emulation options are invalid');
  }
  return options;
}

export function remainingCommandTimeoutMs(deadlineMs, nowMs, transportTimeoutMs) {
  if (!finite(deadlineMs) || !finite(nowMs) || !integer(transportTimeoutMs)
    || transportTimeoutMs <= 0 || deadlineMs - nowMs < 1) return null;
  return Math.min(transportTimeoutMs, Math.max(1, Math.floor(deadlineMs - nowMs)));
}

export function phaseObservationAccepted(deadlineMs, completedAtMs, value) {
  return finite(deadlineMs) && finite(completedAtMs)
    && completedAtMs < deadlineMs && Boolean(value);
}

export const CEILING_FIELDS = Object.freeze([
  'mountedRowsMax', 'heapUsedBytesMax', 'documentsMax', 'nodesMax',
  'jsEventListenersMax', 'liveCacheEntriesMax', 'liveDecodedPixelsMax',
  'liveDecodedBytesMax', 'liveEncodedBytesMax', 'queuedJobsPeakMax',
  'activeJobsPeakMax', 'liveLeasesMax', 'liveSubscribersMax',
  'livePortraitCacheEntriesMax', 'livePortraitEncodedBytesMax', 'warmHeapRangeBytesMax',
  'warmDecodedBytesRangeMax', 'warmEncodedBytesRangeMax',
]);
export const SAMPLE_METRIC_FIELDS = Object.freeze([
  'mountedRows', 'heapUsedBytes', 'documents', 'nodes', 'jsEventListeners',
  'liveCacheEntries', 'liveDecodedPixels', 'liveDecodedBytes', 'liveEncodedBytes',
  'queuedJobsPeak', 'activeJobsPeak', 'liveLeases', 'liveSubscribers',
  'livePortraitCacheEntries', 'livePortraitEncodedBytes',
  'warmHeapRangeBytes', 'warmDecodedBytesRange', 'warmEncodedBytesRange',
]);

function validateCalibrationSample(sample, profile, index, errors, expectedFaults = null) {
  const where = `calibration.samples.${profile}[${index}]`;
  if (!isObject(sample)) { errors.push(`${where} must be an object`); return; }
  exactKeys(sample, [
    'runId', 'commit', 'workingTreeDigest', 'inputDigest', 'sourceState',
    'sourceChanged', 'fixtureRowsSha256', 'measuredAt', 'browser', 'metrics',
    ...(expectedFaults ? ['observedFaults'] : []),
  ], where, errors);
  if (typeof sample.runId !== 'string' || !sample.runId) errors.push(`${where}.runId is missing`);
  if (!/^[a-f0-9]{40}$/.test(String(sample.commit || ''))) errors.push(`${where}.commit is invalid`);
  if (!/^[a-f0-9]{64}$/.test(String(sample.workingTreeDigest || ''))) {
    errors.push(`${where}.workingTreeDigest is invalid`);
  }
  if (!/^[a-f0-9]{64}$/.test(String(sample.inputDigest || ''))) {
    errors.push(`${where}.inputDigest is invalid`);
  }
  if (sample.sourceState !== 'committed') errors.push(`${where}.sourceState must be committed`);
  if (sample.sourceChanged !== false) errors.push(`${where}.sourceChanged must be false`);
  if (!/^[a-f0-9]{64}$/.test(String(sample.fixtureRowsSha256 || ''))) {
    errors.push(`${where}.fixtureRowsSha256 is invalid`);
  }
  if (typeof sample.measuredAt !== 'string' || !Number.isFinite(Date.parse(sample.measuredAt))) {
    errors.push(`${where}.measuredAt is invalid`);
  }
  const browserFields = [
    'executable', 'product', 'revision', 'userAgent', 'jsVersion', 'protocolVersion',
  ];
  if (!isObject(sample.browser)
    || browserFields.some((field) => typeof sample.browser[field] !== 'string'
      || sample.browser[field].length === 0)) {
    errors.push(`${where}.browser provenance is incomplete`);
  } else {
    exactKeys(sample.browser, browserFields, `${where}.browser`, errors);
  }
  if (!isObject(sample.metrics)) { errors.push(`${where}.metrics is missing`); return; }
  exactKeys(sample.metrics, SAMPLE_METRIC_FIELDS, `${where}.metrics`, errors);
  for (const field of SAMPLE_METRIC_FIELDS) {
    if (!nonnegative(sample.metrics[field])) errors.push(`${where}.metrics.${field} is invalid`);
  }
  if (expectedFaults) {
    if (!Array.isArray(sample.observedFaults)
      || new Set(sample.observedFaults).size !== sample.observedFaults.length
      || !sameJson([...sample.observedFaults].sort(), [...expectedFaults].sort())) {
      errors.push(`${where}.observedFaults must prove every sealed broken-baseline fault`);
    }
  }
}

function enforceSharedSampleIdentity(samples, label, errors, expectedCommit = null,
  expectedFixture = null) {
  if (!samples.length) return;
  const identity = (sample) => [sample.commit, sample.workingTreeDigest,
    sample.inputDigest, sample.fixtureRowsSha256,
    sample.browser?.executable, sample.browser?.product, sample.browser?.revision,
    sample.browser?.userAgent, sample.browser?.jsVersion, sample.browser?.protocolVersion].join('\0');
  const first = identity(samples[0]);
  if (samples.some((sample) => identity(sample) !== first)) {
    errors.push(`${label} samples do not share one exact commit/working-tree/input/fixture identity`);
  }
  if (expectedCommit && samples.some((sample) => sample.commit !== expectedCommit)) {
    errors.push(`${label} samples do not match the recorded baseline commit`);
  }
  if (expectedFixture && samples.some((sample) => sample.fixtureRowsSha256 !== expectedFixture)) {
    errors.push(`${label} samples do not match the budget fixture digest`);
  }
}

function enforceIndependentRuns(samples, label, errors) {
  const runIds = samples.map((sample) => sample?.runId);
  const measuredAt = samples.map((sample) => sample?.measuredAt);
  if (new Set(runIds).size !== runIds.length) errors.push(`${label} sample runIds are not independent`);
  if (new Set(measuredAt).size !== measuredAt.length) errors.push(`${label} sample timestamps are not independent`);
}

/** Strict semantic validation supplements the checked-in JSON Schema. */
export function validateBudgetRecord(record, fixtureRowsSha256 = null,
  brokenBaselineProjectionRowsSha256 = null) {
  const errors = [];
  if (!isObject(record)) return { ok: false, errors: ['budget must be an object'] };
  exactKeys(record, [
    'schema', 'status', 'fixture', 'requirements', 'calibration',
    'pairedBrokenBaseline', 'ceilings',
  ], 'budget', errors);
  if (record.schema !== BUDGET_SCHEMA) errors.push(`budget schema must be ${BUDGET_SCHEMA}`);
  if (!['calibration-required', 'active'].includes(record.status)) {
    errors.push('budget status must be calibration-required or active');
  }
  if (!isObject(record.requirements)) errors.push('budget requirements are missing');
  else {
    exactKeys(record.requirements, [
      'fixtureCount', 'listNaturalDimensionMax', 'commandTimeoutMs', 'warmCycles',
    ], 'requirements', errors);
    if (record.requirements.fixtureCount !== 1500) errors.push('fixtureCount must remain exactly 1500');
    if (record.requirements.listNaturalDimensionMax !== 132) {
      errors.push('listNaturalDimensionMax must remain exactly 132');
    }
    if (record.requirements.commandTimeoutMs !== COMMAND_TIMEOUT_MS) {
      errors.push(`commandTimeoutMs must remain exactly ${COMMAND_TIMEOUT_MS}`);
    }
    if (record.requirements.warmCycles !== REQUIRED_WARM_CYCLES) {
      errors.push(`warmCycles must remain exactly ${REQUIRED_WARM_CYCLES}`);
    }
  }
  if (!isObject(record.fixture)
    || record.fixture.schema !== 'cf-v2-compendium-fixture/v1'
    || record.fixture.generator !== 'compendium-realistic-genomes/v1'
    || record.fixture.count !== 1500
    || !/^[a-f0-9]{64}$/.test(String(record.fixture.rowsSha256 || ''))) {
    errors.push('budget fixture provenance is invalid');
  } else if (fixtureRowsSha256 && record.fixture.rowsSha256 !== fixtureRowsSha256) {
    errors.push('budget fixture digest does not match the current deterministic input');
  }
  if (isObject(record.fixture)) exactKeys(record.fixture,
    ['schema', 'generator', 'count', 'rowsSha256'], 'fixture', errors);
  if (!isObject(record.calibration)
    || record.calibration.requiredIndependentRunsPerProfile !== 3
    || typeof record.calibration.selectionRule !== 'string'
    || !record.calibration.selectionRule.trim()
    || typeof record.calibration.headroomRationaleRequired !== 'boolean'
    || record.calibration.headroomRationaleRequired !== true
    || !isObject(record.calibration.samples)) {
    errors.push('calibration workflow is incomplete');
  } else {
    exactKeys(record.calibration, [
      'requiredIndependentRunsPerProfile', 'selectionRule',
      'headroomRationaleRequired', 'samples',
    ], 'calibration', errors);
    exactKeys(record.calibration.samples, PROFILES, 'calibration.samples', errors);
    for (const profile of PROFILES) {
      const samples = record.calibration.samples[profile];
      if (!Array.isArray(samples)) errors.push(`calibration.samples.${profile} must be an array`);
      else {
        samples.forEach((sample, index) => validateCalibrationSample(sample, profile, index, errors));
        enforceIndependentRuns(samples, `candidate ${profile}`, errors);
      }
    }
    const allCandidateSamples = PROFILES.flatMap((profile) =>
      Array.isArray(record.calibration.samples[profile]) ? record.calibration.samples[profile] : []);
    enforceSharedSampleIdentity(allCandidateSamples, 'candidate calibration', errors,
      null, record.fixture?.rowsSha256 || null);
  }
  if (!isObject(record.pairedBrokenBaseline)
    || !['measurement-required', 'measured'].includes(record.pairedBrokenBaseline.status)
    || !/^[a-f0-9]{40}$/.test(String(record.pairedBrokenBaseline.commit || ''))
    || !(record.pairedBrokenBaseline.collectorCommit === null
      || /^[a-f0-9]{40}$/.test(String(record.pairedBrokenBaseline.collectorCommit || '')))
    || !/^[a-f0-9]{64}$/.test(String(record.pairedBrokenBaseline.projectionRowsSha256 || ''))
    || !Array.isArray(record.pairedBrokenBaseline.expectedFaults)
    || !sameJson([...record.pairedBrokenBaseline.expectedFaults].sort(), [
      'eager-art-import', 'full-portrait-cache-exposure',
      'list-source-440', 'unwindowed-1500-rows',
    ])
    || !isObject(record.pairedBrokenBaseline.samples)) {
    errors.push('paired pre-Arc1A broken-baseline provenance is incomplete');
  } else {
    exactKeys(record.pairedBrokenBaseline,
      ['status', 'commit', 'collectorCommit', 'projectionRowsSha256', 'expectedFaults', 'samples'],
      'pairedBrokenBaseline', errors);
    exactKeys(record.pairedBrokenBaseline.samples, PROFILES,
      'pairedBrokenBaseline.samples', errors);
    for (const profile of PROFILES) {
      const samples = record.pairedBrokenBaseline.samples[profile];
      if (!Array.isArray(samples)) errors.push(`pairedBrokenBaseline.samples.${profile} must be an array`);
      else {
        samples.forEach((sample, index) => validateCalibrationSample(
          sample, `pairedBrokenBaseline.${profile}`, index, errors,
          record.pairedBrokenBaseline.expectedFaults,
        ));
        enforceIndependentRuns(samples, `paired broken-baseline ${profile}`, errors);
      }
    }
    const allBaselineSamples = PROFILES.flatMap((profile) =>
      Array.isArray(record.pairedBrokenBaseline.samples[profile])
        ? record.pairedBrokenBaseline.samples[profile] : []);
    enforceSharedSampleIdentity(allBaselineSamples, 'paired broken-baseline', errors,
      record.pairedBrokenBaseline.commit, record.fixture?.rowsSha256 || null);
    if (brokenBaselineProjectionRowsSha256
      && record.pairedBrokenBaseline.projectionRowsSha256
        !== brokenBaselineProjectionRowsSha256) {
      errors.push('paired broken-baseline projection digest does not match the deterministic adapter input');
    }
    if (record.pairedBrokenBaseline.status === 'measured'
      && !/^[a-f0-9]{40}$/.test(String(record.pairedBrokenBaseline.collectorCommit || ''))) {
      errors.push('measured paired broken baseline requires its exact collector commit');
    }
  }
  if (record.status === 'calibration-required') {
    if (record.ceilings !== null) errors.push('calibration-required budget must keep ceilings null');
  } else {
    if (isObject(record.ceilings)) exactKeys(record.ceilings, PROFILES, 'ceilings', errors);
    if (!isObject(record.ceilings)) errors.push('active budget ceilings are missing');
    for (const profile of PROFILES) {
      const samples = record.calibration?.samples?.[profile];
      if (!Array.isArray(samples) || samples.length < 3) {
        errors.push(`active budget needs at least three ${profile} calibration samples`);
      }
      const baselineSamples = record.pairedBrokenBaseline?.samples?.[profile];
    if (record.pairedBrokenBaseline?.status !== 'measured'
        || !Array.isArray(baselineSamples) || baselineSamples.length < 1) {
        errors.push(`active budget needs a measured paired broken baseline for ${profile}`);
      }
      const ceiling = record.ceilings?.[profile];
      if (!isObject(ceiling)) { errors.push(`active ${profile} ceilings are missing`); continue; }
      exactKeys(ceiling, ['rationale', ...CEILING_FIELDS], `ceilings.${profile}`, errors);
      if (typeof ceiling.rationale !== 'string' || !ceiling.rationale.trim()) {
        errors.push(`active ${profile} ceiling rationale is missing`);
      }
      for (const field of CEILING_FIELDS) {
        if (!nonnegative(ceiling[field])) errors.push(`active ${profile}.${field} is invalid`);
      }
      if (Array.isArray(samples) && samples.length) {
        for (let i = 0; i < CEILING_FIELDS.length; i++) {
          const ceilingField = CEILING_FIELDS[i];
          const sampleField = SAMPLE_METRIC_FIELDS[i];
          const measuredMax = Math.max(...samples.map((sample) => sample.metrics?.[sampleField] ?? Infinity));
          if (finite(ceiling[ceilingField]) && ceiling[ceilingField] < measuredMax) {
            errors.push(`active ${profile}.${ceilingField} is below measured ${sampleField} max`);
          }
        }
      }
    }
    const candidateCommit = record.calibration?.samples?.phone?.[0]?.commit;
    if (!/^[a-f0-9]{40}$/.test(String(record.pairedBrokenBaseline?.collectorCommit || ''))
      || record.pairedBrokenBaseline.collectorCommit !== candidateCommit) {
      errors.push('active broken-baseline collectorCommit must match the candidate calibration commit');
    }
    const candidatePhoneRuns = record.calibration?.samples?.phone?.map((sample) => sample.runId).sort();
    const candidateDesktopRuns = record.calibration?.samples?.desktop?.map((sample) => sample.runId).sort();
    if (!sameJson(candidatePhoneRuns, candidateDesktopRuns)) {
      errors.push('active candidate phone/desktop samples do not come from the same independent runs');
    }
    const baselinePhoneRuns = record.pairedBrokenBaseline?.samples?.phone?.map((sample) => sample.runId).sort();
    const baselineDesktopRuns = record.pairedBrokenBaseline?.samples?.desktop?.map((sample) => sample.runId).sort();
    if (!sameJson(baselinePhoneRuns, baselineDesktopRuns)) {
      errors.push('active broken-baseline phone/desktop samples do not come from the same independent runs');
    }
  }
  return { ok: errors.length === 0, errors };
}

function values(object) { return isObject(object) ? Object.values(object) : []; }
function listImages(snapshot) {
  return Array.isArray(snapshot?.raw?.listImages) ? snapshot.raw.listImages : [];
}
function planetsideImages(snapshot) {
  return Array.isArray(snapshot?.raw?.planetsideImages) ? snapshot.raw.planetsideImages : [];
}
function art(snapshot) { return snapshot?.diagnostics?.art || null; }
function liveWithinLimits(snapshot, profile) {
  const a = art(snapshot);
  if (!isObject(a) || a.schema !== ART_DIAGNOSTICS_SCHEMA
    || !isObject(a.live) || !isObject(a.limits)
    || a.deviceClass !== profile
    || a.limits.budgetStatus !== 'provisional-candidate'
    || a.limits.encodedByteBasis !== 'utf8-data-url') return false;
  const pairs = [
    ['cacheEntries', 'cacheEntries'], ['decodedPixels', 'decodedPixels'],
    ['decodedBytes', 'decodedBytes'], ['encodedBytes', 'encodedBytes'],
    ['queuedJobs', 'queuedJobs'], ['activeJobs', 'activeJobs'],
    ['leases', 'leases'],
    ['portraitCacheEntries', 'portraitEntries'],
    ['portraitEncodedBytes', 'portraitEncodedBytes'],
  ];
  return pairs.every(([liveField, limitField]) => nonnegative(a.live[liveField])
    && nonnegative(a.limits[limitField]) && a.live[liveField] <= a.limits[limitField]);
}
function allPositive132(images) {
  return images.length > 0 && images.every((image) =>
    typeof image.logicalId === 'string' && image.logicalId
    && image.naturalWidth === 132 && image.naturalHeight === 132);
}
function settled(snapshot) {
  const a = art(snapshot);
  return !!a && a.live.queuedJobs === 0 && a.live.activeJobs === 0;
}
function range(numbers) {
  return numbers.length ? Math.max(...numbers) - Math.min(...numbers) : Infinity;
}
function maxAt(snapshots, getter) {
  const read = snapshots.map(getter);
  return read.length && read.every(nonnegative) ? Math.max(...read) : Infinity;
}

export function evaluateProfile(measurement, budget, fixture) {
  const profile = measurement?.profile;
  if (!PROFILES.includes(profile)) throw new Error(`unknown Compendium profile ${String(profile)}`);
  const ceiling = budget?.ceilings?.[profile];
  if (budget?.status !== 'active' || !isObject(ceiling)) {
    throw new Error(`${profile}: an active measured budget is required for certification`);
  }
  const points = measurement.points || {};
  const warm = Array.isArray(points.warm) ? points.warm : [];
  const resize = measurement.phases?.viewportResize;
  const resizePoints = [resize?.base, resize?.expanded, resize?.contracted, resize?.restored]
    .filter(Boolean);
  const selected = [points.first, points.middle, points.last, points.filtered,
    points.detail, points.detailClosed, points.back, points.focusPinned, points.closed,
    points.planetside, ...resizePoints, ...warm].filter(Boolean);
  const final = warm[warm.length - 1] || points.planetside || points.closed;
  const finalArt = art(final);
  const outcomes = [];
  const add = (id, ok, diagnosis, evidence = null) => outcomes.push({
    id: `${profile}/${id}`, profile, check: id,
    status: ok ? 'pass' : 'fail', diagnosis: ok ? null : `${profile}: ${diagnosis}`,
    evidence,
  });
  const fixtureOk = measurement.fixture?.count === 1500
    && measurement.fixture?.uniqueLogicalIds === 1500
    && measurement.fixture?.uniqueCompleteGenomes === 1500
    && measurement.fixture?.rowsSha256 === fixture.rowsSha256
    && measurement.fixture?.sameSeedShared === true
    && measurement.fixture?.sameSeedCompleteDistinct === true;
  add('input-fixture-1500-distinct', fixtureOk,
    'fixture was empty, short, duplicated, or did not match the sealed 1,500-genome input', measurement.fixture);
  const initial = points.lazyBoot;
  const lazyEnd = points.lazyEnd;
  const lazyResource = measurement.lazySpeciesResource;
  add('lazy-art-not-eager', initial?.diagnostics?.lazyArt?.state === 'idle'
    && initial?.diagnostics?.lazyArt?.importStarts === 0 && initial?.diagnostics?.art === null
    && lazyEnd?.diagnostics?.documentToken === initial?.diagnostics?.documentToken
    && lazyEnd?.diagnostics?.lazyArt?.state === 'idle'
    && lazyEnd?.diagnostics?.lazyArt?.importStarts === 0 && lazyEnd?.diagnostics?.art === null
    && typeof lazyResource?.path === 'string' && lazyResource.path.endsWith('.js')
    && /^[a-f0-9]{64}$/.test(String(lazyResource?.sha256 || ''))
    && Array.isArray(lazyResource?.matches) && lazyResource.matches.length === 0
    && Array.isArray(lazyResource?.endMatches) && lazyResource.endMatches.length === 0,
  'the semantically identified species-art executable loaded before a Compendium/Planetside owner requested it',
  { loader: initial?.diagnostics?.lazyArt, resource: lazyResource });
  const firstDiag = points.first?.diagnostics;
  add('list-populated', firstDiag?.panel?.open === true && firstDiag?.panel?.mode === 'list'
    && firstDiag?.schema === DIAGNOSTICS_SCHEMA
    && typeof firstDiag?.documentToken === 'string' && firstDiag.documentToken
    && firstDiag?.window?.mountedRowCount > 0 && listImages(points.first).length > 0,
  'the measured list was empty or not mounted', {
    panel: firstDiag?.panel, mounted: firstDiag?.window?.mountedRowCount,
  });
  add('list-source-count-1500', firstDiag?.panel?.sourceCount === 1500
    && firstDiag?.panel?.filteredCount === 1500,
  'the browser did not measure the full 1,500-row source', firstDiag?.panel);
  add('first-row-reached', points.first?.raw?.mountedLogicalIds?.includes(measurement.targets?.first),
    'the first logical row was not mounted', points.first?.raw?.mountedLogicalIds);
  add('middle-row-reached', points.middle?.raw?.mountedLogicalIds?.includes(measurement.targets?.middle),
    'the middle logical row was not mounted after native scrolling', points.middle?.raw?.mountedLogicalIds);
  add('last-row-reached', points.last?.raw?.mountedLogicalIds?.includes(measurement.targets?.last),
    'the last logical row was not mounted after native scrolling', points.last?.raw?.mountedLogicalIds);
  add('filter-result', points.filtered?.diagnostics?.panel?.filteredCount === 1
    && points.filtered?.raw?.mountedLogicalIds?.includes(measurement.targets?.filter),
  'the native search did not isolate and mount the filter beacon', {
    panel: points.filtered?.diagnostics?.panel, ids: points.filtered?.raw?.mountedLogicalIds,
  });
  add('detail-opened', points.detail?.diagnostics?.panel?.mode === 'detail'
    && points.detail?.diagnostics?.surfaces?.detail?.open === true
    && points.detail?.diagnostics?.surfaces?.detail?.logicalId === measurement.targets?.detail
    && points.detail?.raw?.detailNaturalWidth === 440 && points.detail?.raw?.detailNaturalHeight === 440,
  'native row activation did not render the selected detail portrait', {
    panel: points.detail?.diagnostics?.panel, detail: points.detail?.diagnostics?.surfaces?.detail,
  });
  const backNavigation = measurement.phases?.backNavigation;
  const backWasDeepAndVisible = backNavigation?.before?.window?.start > 0
    && backNavigation?.before?.selectedLogicalId === measurement.targets?.detail
    && backNavigation?.before?.selectedIndex === 777
    && backNavigation?.before?.selectedMounted === true
    && backNavigation?.before?.selectedIntersects === true;
  const backAnchorStable = typeof backNavigation?.before?.logicalId === 'string'
    && backNavigation.before.logicalId
    && backNavigation.before.logicalId === backNavigation?.after?.logicalId
    && backNavigation.before.logicalId === backNavigation?.afterSettled?.logicalId
    && finite(backNavigation.before.offsetPx) && finite(backNavigation?.after?.offsetPx)
    && finite(backNavigation?.afterSettled?.offsetPx)
    && Math.abs(backNavigation.before.offsetPx - backNavigation.after.offsetPx) <= 2
    && Math.abs(backNavigation.before.offsetPx - backNavigation.afterSettled.offsetPx) <= 2;
  const backSelectionStable = [backNavigation?.after, backNavigation?.afterSettled]
    .every((sample) => sample?.selectedLogicalId === measurement.targets?.detail
      && sample?.selectedIndex === 777 && sample?.selectedMounted === true
      && sample?.selectedIntersects === true
      && (sample?.selectedInWindow === true || sample?.selectedPinned === true)
      && sample?.activeLogicalId === measurement.targets?.detail);
  add('back-restores-focus', points.back?.diagnostics?.panel?.mode === 'list'
    && points.back?.raw?.activeLogicalId === measurement.targets?.detail
    && points.back?.diagnostics?.panel?.filteredCount === 1500
    && points.back?.diagnostics?.panel?.query === ''
    && backWasDeepAndVisible && backAnchorStable && backSelectionStable,
  'Back did not restore the selected deep row and logical top-anchor/offset after two settlements', {
    mode: points.back?.diagnostics?.panel?.mode, active: points.back?.raw?.activeLogicalId,
    navigation: backNavigation,
  });
  const closedPlanetsideCount = points.closed?.diagnostics?.surfaces?.planetside?.visible
    ? points.closed.diagnostics.surfaces.planetside.logicalIds?.length ?? 0 : 0;
  add('close-restores-focus', points.closed?.diagnostics?.panel?.mode === 'closed'
    && ['dockcodex', 'railcodex'].includes(points.closed?.raw?.activeElementId)
    && art(points.closed)?.live?.leases === closedPlanetsideCount
    && art(points.closed)?.live?.subscribers <= closedPlanetsideCount,
  'Close did not return focus to its opener or release Compendium ownership', {
    panel: points.closed?.diagnostics?.panel, activeElementId: points.closed?.raw?.activeElementId,
    planetsideCount: closedPlanetsideCount, live: art(points.closed)?.live,
  });
  add('close-dom-cleanup', points.detailClosed?.diagnostics?.panel?.mode === 'closed'
    && points.detailClosed?.raw?.mountedRowCount === 0
    && points.detailClosed?.raw?.listImages?.length === 0
    && (points.detailClosed?.raw?.detailImageCount === 0
      || (points.detailClosed?.raw?.detailImageCount === 1
        && points.detailClosed?.raw?.detailSrcPresent === false
        && points.detailClosed?.raw?.detailNaturalWidth === 0
        && points.detailClosed?.raw?.detailNaturalHeight === 0))
    && points.closed?.raw?.mountedRowCount === 0
    && points.closed?.raw?.listImages?.length === 0,
  'detail→Close retained a decoded 440px source or final list→Close retained mounted rows/images', {
    detailClosed: points.detailClosed?.raw, listClosed: points.closed?.raw,
  });
  const pinnedId = measurement.targets?.pinned;
  const focusRing = points.focusPinned?.raw?.focusRing;
  const keyboardTraversal = measurement.phases?.keyboardTraversal;
  const traversalSamples = Array.isArray(keyboardTraversal?.samples)
    ? keyboardTraversal.samples : [];
  const keyboardTraversalOk = traversalSamples.length > keyboardTraversal?.initialWindowEnd
    && keyboardTraversal?.crossedWindowBoundary === true
    && keyboardTraversal?.reviewFocus?.intersects === true
    && keyboardTraversal?.reviewFocus?.outlineWidth >= 3
    && keyboardTraversal?.reviewFocus?.outlineOffset
      <= -keyboardTraversal?.reviewFocus?.outlineWidth
    && traversalSamples.every((sample, index) => sample.expectedIndex === index
      && sample.actualIndex === index
      && sample.expectedLogicalId === fixture.rows?.[index]?.[0]
      && sample.actualLogicalId === fixture.rows?.[index]?.[0]
      && sample.mounted === true && sample.mountedRowCount > 0
      && sample.mountedRowCount <= ceiling.mountedRowsMax && sample.mountedRowCount < 1500);
  add('focus-row-pinned', points.focusPinned?.diagnostics?.window?.focusedLogicalId === pinnedId
    && points.focusPinned?.diagnostics?.window?.pinnedLogicalIds?.includes(pinnedId)
    && points.focusPinned?.raw?.mountedLogicalIds?.includes(pinnedId)
    && points.focusPinned?.raw?.focusedOutsideNormalWindow === true
    && focusRing?.outlineStyle !== 'none' && focusRing?.outlineWidth >= 3
    && focusRing?.outlineOffset <= -focusRing?.outlineWidth
    && focusRing?.outlineExtension === Math.max(0,
      focusRing?.outlineWidth + focusRing?.outlineOffset)
    && Math.abs(focusRing?.ringLeft
      - (focusRing?.rowLeft - focusRing?.outlineExtension)) <= 0.1
    && Math.abs(focusRing?.ringRight
      - (focusRing?.rowRight + focusRing?.outlineExtension)) <= 0.1
    && focusRing?.ringLeft >= focusRing?.scrollerLeft - 0.5
    && focusRing?.ringRight <= focusRing?.scrollerRight + 0.5
    && focusRing?.horizontallyContained === true
    && keyboardTraversalOk,
  'focus pin/ring containment or native Tab traversal across a virtual-window boundary failed', {
    window: points.focusPinned?.diagnostics?.window,
    focusedOutsideNormalWindow: points.focusPinned?.raw?.focusedOutsideNormalWindow,
    focusRing, keyboardTraversal,
  });
  const psIds = points.planetside?.diagnostics?.surfaces?.planetside?.logicalIds;
  const psRawIds = planetsideImages(points.planetside).map((image) => image.logicalId);
  const psLifecycle = measurement.phases?.planetsideLifecycle;
  add('planetside-bounded', points.planetside?.diagnostics?.surfaces?.planetside?.visible === true
    && Array.isArray(psIds) && psIds.length > 0 && psIds.length <= 8
    && new Set(psIds).size === psIds.length && sameJson(psRawIds, psIds)
    && allPositive132(planetsideImages(points.planetside)),
  'Planetside did not expose a populated, unique, at-most-eight 132px thumb surface', {
    planetside: points.planetside?.diagnostics?.surfaces?.planetside,
    images: planetsideImages(points.planetside),
  });
  add('planetside-hide-release-reacquire', psLifecycle?.hidden?.computedHidden === true
    && psLifecycle?.hidden?.liveLeases === 0
    && Array.isArray(psLifecycle?.hidden?.images)
    && psLifecycle.hidden.images.length === psIds.length
    && psLifecycle.hidden.images.every((image) => image.srcPresent === false
      && image.visualKeyPresent === false && image.thumbState === 'released')
    && sameJson(psLifecycle?.revealed?.logicalIds, psIds)
    && psLifecycle?.revealed?.liveLeases === psIds.length
    && allPositive132(psLifecycle?.revealed?.images || []),
  'hidden Planetside retained a lease/source/key or failed to reacquire the same ready 132px roster',
  psLifecycle);
  const mountedMax = maxAt(selected, (snapshot) => snapshot.raw?.mountedRowCount);
  const resizeWindowOk = resizePoints.length === 4
    && resize.base.raw?.viewportHeight === measurement.viewport?.height
    && resize.contracted.raw?.viewportHeight < resize.base.raw.viewportHeight
    && resize.expanded.raw?.viewportHeight > resize.base.raw.viewportHeight
    && resize.restored.raw?.viewportHeight === resize.base.raw.viewportHeight
    && resize.contracted.raw?.scrollerHeight < resize.base.raw?.scrollerHeight - 0.5
    && resize.contracted.diagnostics?.window?.end < resize.base.diagnostics?.window?.end
    && resize.contracted.raw?.mountedRowCount < resize.base.raw?.mountedRowCount
    && resize.expanded.raw?.scrollerHeight > resize.contracted.raw?.scrollerHeight + 0.5
    && resize.expanded.diagnostics?.window?.end > resize.contracted.diagnostics?.window?.end
    && resize.expanded.raw?.mountedRowCount > resize.contracted.raw?.mountedRowCount
    && resize.restored.raw?.scrollerHeight > resize.contracted.raw?.scrollerHeight + 0.5
    && resize.restored.diagnostics?.window?.end > resize.contracted.diagnostics?.window?.end
    && resize.restored.raw?.mountedRowCount > resize.contracted.raw?.mountedRowCount
    && resizePoints.every((snapshot) => snapshot.raw?.mountedRowCount > 0
      && Math.abs(snapshot.raw.scrollTop - resize.base.raw.scrollTop) <= 1);
  add('mounted-window-bounded', mountedMax <= ceiling.mountedRowsMax && mountedMax < 1500
    && resizeWindowOk,
  'mounted rows exceeded the measured ceiling, or measured scroller contraction/expansion/restoration stayed stale/blank',
  { observedMax: mountedMax, ceiling: ceiling.mountedRowsMax, viewportResize: resize });
  add('mounted-natural-dimensions', selected.every((snapshot) => {
    const rows = snapshot.raw?.mountedLogicalIds;
    const images = listImages(snapshot);
    const rects = snapshot.raw?.rowRects;
    const sortedRects = Array.isArray(rects)
      ? [...rects].sort((left, right) => left.top - right.top) : [];
    return Array.isArray(rows) && rows.length === snapshot.raw?.mountedRowCount
      && new Set(rows).size === rows.length && images.length === rows.length
      && new Set(images.map((image) => image.logicalId)).size === images.length
      && sameJson(images.map((image) => image.logicalId), rows)
      && Array.isArray(rects) && rects.length === rows.length
      && new Set(rects.map((rect) => rect.logicalId)).size === rects.length
      && sameJson(rects.map((rect) => rect.logicalId), rows)
      && rects.every((rect) => finite(rect.top) && finite(rect.bottom)
        && finite(rect.height) && rect.height >= 44
        && Math.abs((rect.bottom - rect.top) - rect.height) < 0.5)
      && sortedRects.every((rect, index) => index === 0
        || rect.top >= sortedRects[index - 1].bottom - 0.5);
  }), 'raw mounted rows/images/rects disagreed, overlapped, or violated the 44px measured floor');
  const allThumbImages = selected.flatMap((snapshot) => listImages(snapshot))
    .concat(planetsideImages(points.planetside));
  add('list-source-132', allPositive132(allThumbImages),
    'a list/Planetside source was empty, zero-sized, or used a 440/full-size asset', allThumbImages);
  add('art-release', measurement.phases?.close?.releasesDelta > 0
    && measurement.phases?.close?.beforeLeases > measurement.phases?.close?.afterLeases
    && measurement.phases?.close?.afterLeases === closedPlanetsideCount
    && finalArt?.totals?.releases <= finalArt?.totals?.leaseAcquires,
  'the scoped list Close did not release ownership down to the Planetside-only baseline', {
    close: measurement.phases?.close, totals: finalArt?.totals,
  });
  add('art-disposal', points.capShrink?.disposalsDelta > 0,
    'the scoped immediate cap shrink did not dispose real assets', points.capShrink);
  add('art-dedupe', measurement.phases?.dedupe?.dedupeHitsDelta > 0,
    'the scoped native retained-row filter handoff did not hit the shared producer/cache',
  measurement.phases?.dedupe);
  add('full-identity-key', typeof measurement.identity?.alphaKey === 'string'
    && typeof measurement.identity?.betaKey === 'string'
    && measurement.identity.alphaKey !== measurement.identity.betaKey,
  'same-seed/different-complete-genome rows collapsed to one art key', measurement.identity);
  add('generation-guard', integer(points.initial?.diagnostics?.generation)
    && integer(final?.diagnostics?.generation)
    && final.diagnostics.generation > points.initial.diagnostics.generation
    && nonnegative(final.diagnostics.panel.staleCompletionDrops)
    && final.diagnostics.panel.closedCompletionCommits === 0
    && measurement.phases?.churn?.jobCancelsDelta > 0,
  'generation did not advance, invalidated work was not cancelled, or closed DOM was mutated', {
    initial: points.initial?.diagnostics?.generation, final: final?.diagnostics?.generation,
    panel: final?.diagnostics?.panel, churn: measurement.phases?.churn,
  });
  add('error-contained', points.error?.jobErrorsDelta === 1
    && points.error?.uiResponsive === true && points.error?.poisonedCacheEntry === false,
  'one-shot producer failure did not remain contained and answerable', points.error);
  add('error-recoverable', points.error?.recoveryJobCompletesDelta >= 1
    && typeof points.error?.recoveredKey === 'string' && points.error.recoveredKey,
  'the failed key did not recover through a later real request', points.error);
  add('cap-shrink', points.capShrink?.beforeEntries > points.capShrink?.afterEntries
    && points.capShrink?.afterEntries <= points.capShrink?.phoneLimit
    && points.capShrink?.afterDecodedBytes <= points.capShrink?.phoneDecodedBytesLimit
    && points.capShrink?.beforeDeviceClass === 'desktop'
    && points.capShrink?.afterDeviceClass === 'phone'
    && points.capShrink?.restoredDeviceClass === profile
    && points.capShrink?.disposalsDelta > 0,
  'immediate phone-class trim did not shrink entries/decoded bytes and dispose assets', points.capShrink);
  add('canvas-thumb-path', finalArt?.totals?.thumbCanvasRenders > 0
    && finalArt.totals.thumbCanvasRenders >= finalArt.totals.jobCompletes,
  'thumb jobs bypassed the owned 132×132 canvas render path', finalArt?.totals);
  const beforeDetail = [points.first, points.middle, points.last, points.filtered].filter(Boolean);
  const afterDetail = [points.detailClosed, points.back, points.focusPinned,
    points.planetside, ...warm].filter(Boolean);
  const detailPortraitEntries = art(points.detail)?.live?.portraitCacheEntries;
  const detailPortraitBytes = art(points.detail)?.live?.portraitEncodedBytes;
  add('no-full-portrait-thumb-path', finalArt?.totals?.fullPortraitRendersForThumb === 0
    && finalArt?.totals?.fullPortraitDecodesForThumb === 0
    && beforeDetail.every((snapshot) => art(snapshot)?.live?.portraitCacheEntries === 0
      && art(snapshot)?.live?.portraitEncodedBytes === 0)
    && detailPortraitEntries === 1 && detailPortraitBytes > 0
    && afterDetail.every((snapshot) => art(snapshot)?.live?.portraitCacheEntries <= detailPortraitEntries
      && art(snapshot)?.live?.portraitEncodedBytes <= detailPortraitBytes),
  'thumb traffic rendered/decoded or grew the full-portrait cache beyond the one legitimate detail portrait', {
    totals: finalArt?.totals, detailPortraitEntries, detailPortraitBytes,
    after: afterDetail.map((snapshot) => ({
      entries: art(snapshot)?.live?.portraitCacheEntries,
      bytes: art(snapshot)?.live?.portraitEncodedBytes,
    })),
  });
  add('settled-jobs', warm.length >= REQUIRED_WARM_CYCLES && warm.every(settled),
    'warm-cycle evidence was short or retained queued/active jobs', warm.map((snapshot) => art(snapshot)?.live));
  const mainToken = points.initial?.diagnostics?.documentToken;
  const jobPeaks = measurement.phases?.jobPeaks;
  add('resource-live-limits', typeof mainToken === 'string' && mainToken
    && points.lazyBoot?.diagnostics?.documentToken !== mainToken
    && points.initial?.diagnostics?.documentToken === mainToken
    && liveWithinLimits(points.initial, profile)
    && jobPeaks?.deviceClass === profile
    && integer(jobPeaks?.queuedJobsPeak) && jobPeaks.queuedJobsPeak >= 1
    && integer(jobPeaks?.activeJobsPeak) && jobPeaks.activeJobsPeak >= 1
    && integer(jobPeaks?.queuedJobsLimit) && jobPeaks.queuedJobsPeak <= jobPeaks.queuedJobsLimit
    && integer(jobPeaks?.activeJobsLimit) && jobPeaks.activeJobsPeak <= jobPeaks.activeJobsLimit
    && selected.every((snapshot) => snapshot.diagnostics?.schema === DIAGNOSTICS_SCHEMA
      && snapshot.diagnostics?.documentToken === mainToken && liveWithinLimits(snapshot, profile)),
    'a live resource dimension exceeded or lacked its product-owned limit');
  const plateauTail = warm.slice(-3);
  const warmHeapRange = range(plateauTail.map((snapshot) => snapshot.heap?.usedSize));
  const warmDecodedRange = range(plateauTail.map((snapshot) => art(snapshot)?.live?.decodedBytes));
  const warmEncodedRange = range(plateauTail.map((snapshot) => art(snapshot)?.live?.encodedBytes));
  add('warm-plateau', warm.length >= REQUIRED_WARM_CYCLES
    && warmHeapRange <= ceiling.warmHeapRangeBytesMax
    && warmDecodedRange <= ceiling.warmDecodedBytesRangeMax
    && warmEncodedRange <= ceiling.warmEncodedBytesRangeMax,
  'settled warm cycles did not plateau within measured ranges', {
    warmHeapRange, warmDecodedRange, warmEncodedRange,
    ceilings: {
      heap: ceiling.warmHeapRangeBytesMax,
      decoded: ceiling.warmDecodedBytesRangeMax,
      encoded: ceiling.warmEncodedBytesRangeMax,
    },
  });
  const heapMax = maxAt(selected, (snapshot) => snapshot.heap?.usedSize);
  add('heap-ceiling', heapMax <= ceiling.heapUsedBytesMax,
    'Runtime.getHeapUsage usedSize exceeded the measured ceiling', {
      observedMax: heapMax, ceiling: ceiling.heapUsedBytesMax,
  });
  const documentsMax = maxAt(selected, (snapshot) => snapshot.dom?.documents);
  const nodesMax = maxAt(selected, (snapshot) => snapshot.dom?.nodes);
  const listenersMax = maxAt(selected, (snapshot) => snapshot.dom?.jsEventListeners);
  add('dom-ceiling', documentsMax <= ceiling.documentsMax && nodesMax <= ceiling.nodesMax
    && listenersMax <= ceiling.jsEventListenersMax,
  'Memory.getDOMCounters exceeded a measured document/node/listener ceiling', {
    observed: { documentsMax, nodesMax, listenersMax },
    ceilings: {
      documentsMax: ceiling.documentsMax, nodesMax: ceiling.nodesMax,
      jsEventListenersMax: ceiling.jsEventListenersMax,
    },
  });
  const cacheMax = maxAt(selected, (snapshot) => art(snapshot)?.live?.cacheEntries);
  const decodedPixelsMax = maxAt(selected, (snapshot) => art(snapshot)?.live?.decodedPixels);
  const decodedBytesMax = maxAt(selected, (snapshot) => art(snapshot)?.live?.decodedBytes);
  const encodedBytesMax = maxAt(selected, (snapshot) => art(snapshot)?.live?.encodedBytes);
  const queuedJobsPeak = jobPeaks?.queuedJobsPeak;
  const activeJobsPeak = jobPeaks?.activeJobsPeak;
  const leasesMax = maxAt(selected, (snapshot) => art(snapshot)?.live?.leases);
  const subscribersMax = maxAt(selected, (snapshot) => art(snapshot)?.live?.subscribers);
  const portraitEntriesMax = maxAt(selected,
    (snapshot) => art(snapshot)?.live?.portraitCacheEntries);
  const portraitEncodedBytesMax = maxAt(selected,
    (snapshot) => art(snapshot)?.live?.portraitEncodedBytes);
  add('byte-ceiling', cacheMax <= ceiling.liveCacheEntriesMax
    && decodedPixelsMax <= ceiling.liveDecodedPixelsMax
    && decodedBytesMax <= ceiling.liveDecodedBytesMax
    && encodedBytesMax <= ceiling.liveEncodedBytesMax
    && queuedJobsPeak >= 1 && queuedJobsPeak <= ceiling.queuedJobsPeakMax
    && activeJobsPeak >= 1 && activeJobsPeak <= ceiling.activeJobsPeakMax
    && leasesMax <= ceiling.liveLeasesMax
    && subscribersMax <= ceiling.liveSubscribersMax
    && portraitEntriesMax <= ceiling.livePortraitCacheEntriesMax
    && portraitEncodedBytesMax <= ceiling.livePortraitEncodedBytesMax,
  'resource counts, jobs, ownership, portrait cache, or byte/pixel totals exceeded a measured ceiling', {
    observed: { cacheMax, decodedPixelsMax, decodedBytesMax, encodedBytesMax,
      queuedJobsPeak, activeJobsPeak, leasesMax, subscribersMax,
      portraitEntriesMax, portraitEncodedBytesMax },
    ceilings: {
      cache: ceiling.liveCacheEntriesMax, decodedPixels: ceiling.liveDecodedPixelsMax,
      decodedBytes: ceiling.liveDecodedBytesMax, encodedBytes: ceiling.liveEncodedBytesMax,
      queuedJobsPeak: ceiling.queuedJobsPeakMax, activeJobsPeak: ceiling.activeJobsPeakMax,
      leases: ceiling.liveLeasesMax, subscribers: ceiling.liveSubscribersMax,
      portraitEntries: ceiling.livePortraitCacheEntriesMax,
      portraitEncodedBytes: ceiling.livePortraitEncodedBytesMax,
    },
  });
  const answerability = Array.isArray(measurement.answerability) ? measurement.answerability : [];
  const firstAnswer = answerability[0];
  const lastAnswer = answerability[1];
  const answerabilityShapeOk = answerability.length === 2;
  const targetOk = (probe, expected) => probe?.target?.ok === true
    && nonnegative(probe.target.ms) && probe.target.ms <= COMMAND_TIMEOUT_MS
    && probe.target.expected === expected && probe.target.value === expected;
  const heartbeatOk = (probe) => probe?.heartbeat?.ok === true
    && nonnegative(probe.heartbeat.ms) && probe.heartbeat.ms <= COMMAND_TIMEOUT_MS
    && typeof probe.heartbeat.product === 'string' && probe.heartbeat.product;
  add('target-answerable-first', answerabilityShapeOk && targetOk(firstAnswer, `${profile}-first`),
    'first post-load target task missed the 2s answerability deadline', firstAnswer?.target);
  add('heartbeat-first', answerabilityShapeOk && heartbeatOk(firstAnswer),
    'first independent browser heartbeat missed the 2s deadline', firstAnswer?.heartbeat);
  add('target-answerable-last', answerabilityShapeOk && targetOk(lastAnswer, `${profile}-last`),
    'final warm-cycle target task missed the 2s answerability deadline', lastAnswer?.target);
  add('heartbeat-last', answerabilityShapeOk && heartbeatOk(lastAnswer),
    'final independent browser heartbeat missed the 2s deadline', lastAnswer?.heartbeat);
  if (!sameJson(outcomes.map((outcome) => outcome.id),
    OUTCOME_IDS.map((id) => `${profile}/${id}`))) {
    throw new Error(`${profile}: internal outcome inventory order drifted`);
  }
  return outcomes;
}

export function sameSourceIdentity(left, right) {
  return isObject(left) && isObject(right)
    && left.commit === right.commit && left.branch === right.branch
    && left.state === right.state
    && left.statusSha256 === right.statusSha256
    && left.workingTreeSha256 === right.workingTreeSha256;
}

function validCommittedSourceIdentity(source) {
  return isObject(source) && /^[a-f0-9]{40}$/.test(String(source.commit || ''))
    && typeof source.branch === 'string' && source.branch.length > 0
    && source.state === 'committed'
    && /^[a-f0-9]{64}$/.test(String(source.statusSha256 || ''))
    && /^[a-f0-9]{64}$/.test(String(source.workingTreeSha256 || ''));
}

function validReviewPacket(packet, runId, verifyArtifact) {
  if (!Array.isArray(packet)) return false;
  const expected = PROFILES.flatMap((profile) =>
    REVIEW_PACKET_STATES.map((state) => `${profile}/${state}`));
  const actual = packet.map((item) => `${item?.profile}/${item?.state}`);
  const files = packet.map((item) => item?.file);
  return actual.length === expected.length
    && sameJson([...actual].sort(), [...expected].sort())
    && new Set(actual).size === actual.length
    && new Set(files).size === files.length
    && packet.every((item) =>
    typeof item?.file === 'string'
      && item.file === `apps/game/smoke/compendiummem-${runId}-${item.profile}-${item.state}.png`
      && Number.isSafeInteger(item.bytes) && item.bytes > 0
      && /^[a-f0-9]{64}$/.test(String(item.sha256 || ''))
      && (typeof verifyArtifact !== 'function' || verifyArtifact(item) === true));
}

function validProfileMeasurements(profiles) {
  if (!isObject(profiles)
    || !sameJson(Object.keys(profiles).sort(), [...PROFILES].sort())) return false;
  return PROFILES.every((profile) => {
    const measurement = profiles[profile];
    return isObject(measurement) && measurement.profile === profile
      && isObject(measurement.viewport) && isObject(measurement.fixture)
      && isObject(measurement.documentTokens) && isObject(measurement.points)
      && isObject(measurement.phases) && isObject(measurement.lazySpeciesResource)
      && Array.isArray(measurement.answerability)
      && Array.isArray(measurement.reviewPacket);
  });
}

export function verifyTerminalReport(report, expectedRunId, {
  allowCalibration = false, verifyArtifact = null,
} = {}) {
  const errors = [];
  if (!isObject(report)) return { ok: false, errors: ['report must be an object'] };
  if (report.schema !== REPORT_SCHEMA) errors.push(`report schema must be ${REPORT_SCHEMA}`);
  if (report.runId !== expectedRunId) errors.push('report runId is not the requested current run');
  const terminal = allowCalibration ? ['pass', 'fail', 'instrument-fail', 'calibration']
    : ['pass', 'fail', 'instrument-fail'];
  if (!terminal.includes(report.status)) errors.push('report is not terminal');
  if (!isObject(report.policy) || report.policy.attemptCount !== 1
    || report.policy.automaticRetries !== 0 || report.policy.commandTimeoutMs !== COMMAND_TIMEOUT_MS) {
    errors.push('one-attempt/no-retry/2s command policy is invalid');
  }
  if (typeof report.startedAt !== 'string' || !Number.isFinite(Date.parse(report.startedAt))
    || typeof report.endedAt !== 'string' || !Number.isFinite(Date.parse(report.endedAt))
    || Date.parse(report.endedAt) < Date.parse(report.startedAt)) {
    errors.push('report timing is invalid');
  }
  if (!isObject(report.source) || !sameSourceIdentity(report.source.begin, report.source.end)) {
    errors.push('source identity changed or is incomplete');
  }
  if (!isObject(report.inputs)
    || !sameJson(Object.keys(report.inputs), REPORT_INPUT_KEYS)
    || values(report.inputs).some((value) => typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value))) {
    errors.push('exact input provenance is incomplete');
  }
  if (!sameJson(report.expectedOutcomes, EXPECTED_OUTCOMES)) {
    errors.push('sealed expected-outcome inventory drifted');
  }
  if (report.status === 'instrument-fail') {
    if (!Array.isArray(report.outcomes) || report.outcomes.length !== 0) {
      errors.push('instrument-fail report must not claim product outcomes');
    }
    if (!Array.isArray(report.findings) || report.findings.length < 1) {
      errors.push('instrument-fail report lacks a diagnosis');
    }
    return { ok: errors.length === 0, errors };
  }
  if (!validCommittedSourceIdentity(report.source?.begin)
    || !validCommittedSourceIdentity(report.source?.end)) {
    errors.push('certifying/calibration evidence requires one clean committed 40-hex source identity');
  }
  const reportBrowserFields = [
    'executable', 'product', 'revision', 'user_agent', 'js_version', 'protocol_version',
  ];
  if (!isObject(report.browser)
    || reportBrowserFields.some((field) => typeof report.browser[field] !== 'string'
      || report.browser[field].length === 0)) {
    errors.push('browser provenance is incomplete');
  }
  if (!Array.isArray(report.outcomes)) errors.push('outcomes are missing');
  else {
    const ids = report.outcomes.map((outcome) => outcome?.id);
    if (!sameJson(ids, EXPECTED_OUTCOMES)) errors.push('current-run outcome inventory is missing, duplicated, or reordered');
    for (const outcome of report.outcomes) {
      if (!['pass', 'fail'].includes(outcome?.status)) errors.push(`outcome ${String(outcome?.id)} has invalid status`);
      if (outcome?.status === 'fail' && (typeof outcome.diagnosis !== 'string' || !outcome.diagnosis)) {
        errors.push(`failed outcome ${String(outcome?.id)} lacks a diagnosis`);
      }
    }
  }
  const failed = Array.isArray(report.outcomes)
    ? report.outcomes.filter((outcome) => outcome?.status === 'fail') : [];
  if (!validProfileMeasurements(report.profiles)) {
    errors.push('raw phone/desktop profile measurements are incomplete');
  }
  if (!validReviewPacket(report.reviewPacket, expectedRunId, verifyArtifact)) {
    errors.push('run-bound phone/desktop visual review packet is incomplete');
  }
  if (report.status === 'pass' && failed.length) errors.push('PASS report contains failed outcomes');
  if (report.status === 'pass' && report.budget?.status !== 'active') {
    errors.push('PASS report did not use an active measured budget');
  }
  if (report.status === 'pass' && (!Array.isArray(report.findings) || report.findings.length !== 0)) {
    errors.push('PASS report contains findings');
  }
  if (report.status === 'fail' && !failed.length) errors.push('FAIL report contains no failed outcome');
  if (report.status === 'calibration') {
    if (!allowCalibration) errors.push('calibration report is not certifying evidence');
    if (failed.length) errors.push('calibration report contains failed behavioral outcomes');
    if (!Array.isArray(report.findings) || report.findings.length !== 0) {
      errors.push('calibration report contains findings');
    }
    if (report.budget?.status !== 'calibration-required') {
      errors.push('calibration report did not retain the fail-closed budget state');
    }
  }
  return { ok: errors.length === 0, errors };
}

export function calibrationMetrics(measurement) {
  const resize = measurement.phases?.viewportResize;
  const selected = [measurement.points?.first, measurement.points?.middle,
    measurement.points?.last, measurement.points?.filtered, measurement.points?.detail,
    measurement.points?.detailClosed, measurement.points?.back,
    measurement.points?.focusPinned, measurement.points?.closed,
    measurement.points?.planetside,
    resize?.base, resize?.contracted, resize?.expanded, resize?.restored,
    ...(measurement.points?.warm || [])].filter(Boolean);
  const tail = (measurement.points?.warm || []).slice(-3);
  return {
    mountedRows: maxAt(selected, (snapshot) => snapshot.raw?.mountedRowCount),
    heapUsedBytes: maxAt(selected, (snapshot) => snapshot.heap?.usedSize),
    documents: maxAt(selected, (snapshot) => snapshot.dom?.documents),
    nodes: maxAt(selected, (snapshot) => snapshot.dom?.nodes),
    jsEventListeners: maxAt(selected, (snapshot) => snapshot.dom?.jsEventListeners),
    liveCacheEntries: maxAt(selected, (snapshot) => art(snapshot)?.live?.cacheEntries),
    liveDecodedPixels: maxAt(selected, (snapshot) => art(snapshot)?.live?.decodedPixels),
    liveDecodedBytes: maxAt(selected, (snapshot) => art(snapshot)?.live?.decodedBytes),
    liveEncodedBytes: maxAt(selected, (snapshot) => art(snapshot)?.live?.encodedBytes),
    queuedJobsPeak: measurement.phases?.jobPeaks?.queuedJobsPeak,
    activeJobsPeak: measurement.phases?.jobPeaks?.activeJobsPeak,
    liveLeases: maxAt(selected, (snapshot) => art(snapshot)?.live?.leases),
    liveSubscribers: maxAt(selected, (snapshot) => art(snapshot)?.live?.subscribers),
    livePortraitCacheEntries: maxAt(selected,
      (snapshot) => art(snapshot)?.live?.portraitCacheEntries),
    livePortraitEncodedBytes: maxAt(selected,
      (snapshot) => art(snapshot)?.live?.portraitEncodedBytes),
    warmHeapRangeBytes: range(tail.map((snapshot) => snapshot.heap?.usedSize)),
    warmDecodedBytesRange: range(tail.map((snapshot) => art(snapshot)?.live?.decodedBytes)),
    warmEncodedBytesRange: range(tail.map((snapshot) => art(snapshot)?.live?.encodedBytes)),
  };
}
