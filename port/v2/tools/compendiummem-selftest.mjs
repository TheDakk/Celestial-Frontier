/* Browser-free negative controls for compendiummem.

   Every control starts from one fully green synthetic observation, mutates
   exactly the named dimension, and requires the real evaluator to publish a
   scoped failure. A real browser would make these controls slower and less
   trustworthy; Chromium is the subject of the certifying run, not the oracle
   for its own instrument. */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ART_DIAGNOSTICS_SCHEMA, BASELINE_OBSERVATION_TIMEOUT_MS, BUDGET_SCHEMA,
  CANDIDATE_TRANSPORT_TIMEOUT_MS, COMMAND_TIMEOUT_MS, DIAGNOSTICS_SCHEMA,
  EXPECTED_OUTCOMES, OUTCOME_IDS, REPORT_INPUT_KEYS, REPORT_SCHEMA,
  calibrationMetrics, compendiumCdpOptions, compendiumProfileEmulationOptions,
  evaluateProfile, phaseObservationAccepted, remainingCommandTimeoutMs, sha256,
  validProfileEmulationOptions, validTransportTimeoutPolicy, validateBudgetRecord,
  verifyTerminalReport,
} from './compendiummem-contract.mjs';
import {
  buildBrokenBaselineProjection, buildCompendiumFixture,
} from './compendiummem-fixture.mjs';

function assert(condition, message) { if (!condition) throw new Error(`COMPENDIUMMEM SELFTEST: ${message}`); }
function clone(value) { return structuredClone(value); }

function activeBudget(fixture) {
  const metrics = {
    mountedRows: 20, heapUsedBytes: 10_100_000, documents: 2, nodes: 400,
    jsEventListeners: 80, liveCacheEntries: 30, liveDecodedPixels: 600_000,
    liveDecodedBytes: 2_400_000, liveEncodedBytes: 150_000,
    queuedJobsPeak: 20, activeJobsPeak: 1, liveLeases: 20, liveSubscribers: 0,
    livePortraitCacheEntries: 1, livePortraitEncodedBytes: 400_000,
    warmHeapRangeBytes: 200, warmDecodedBytesRange: 0, warmEncodedBytesRange: 0,
  };
  const sample = (profile, index, commit = 'a'.repeat(40), observedFaults = null) => ({
    runId: `selftest-${index}`, commit,
    workingTreeDigest: 'b'.repeat(64), inputDigest: 'c'.repeat(64), sourceChanged: false,
    sourceState: 'committed',
    fixtureRowsSha256: fixture.rowsSha256,
    measuredAt: `2026-08-16T00:00:0${index}.000Z`,
    browser: {
      executable: '/selftest/chrome', product: 'Chrome/Selftest', revision: 'selftest',
      userAgent: 'selftest', jsVersion: 'selftest', protocolVersion: '1.3',
    },
    metrics: { ...metrics },
    ...(observedFaults ? { observedFaults: [...observedFaults] } : {}),
  });
  const ceiling = {
    rationale: 'Synthetic selftest ceiling above every synthetic measured maximum.',
    mountedRowsMax: 40, heapUsedBytesMax: 20_000_000, documentsMax: 4, nodesMax: 1000,
    jsEventListenersMax: 200, liveCacheEntriesMax: 100, liveDecodedPixelsMax: 2_000_000,
    liveDecodedBytesMax: 8_000_000, liveEncodedBytesMax: 1_000_000,
    queuedJobsPeakMax: 20, activeJobsPeakMax: 4, liveLeasesMax: 100,
    liveSubscribersMax: 100, livePortraitCacheEntriesMax: 4,
    livePortraitEncodedBytesMax: 1_000_000,
    warmHeapRangeBytesMax: 1000, warmDecodedBytesRangeMax: 1000,
    warmEncodedBytesRangeMax: 1000,
  };
  return {
    schema: BUDGET_SCHEMA, status: 'active',
    fixture: {
      schema: fixture.schema, generator: fixture.generator,
      count: fixture.count, rowsSha256: fixture.rowsSha256,
    },
    requirements: { fixtureCount: 1500, listNaturalDimensionMax: 132, commandTimeoutMs: 2000, warmCycles: 4 },
    calibration: {
      requiredIndependentRunsPerProfile: 3,
      selectionRule: 'Selftest only: all exact synthetic observations are explicit.',
      headroomRationaleRequired: true,
      samples: {
        phone: [sample('phone', 1), sample('phone', 2), sample('phone', 3)],
        desktop: [sample('desktop', 1), sample('desktop', 2), sample('desktop', 3)],
      },
    },
    pairedBrokenBaseline: {
      status: 'measured', commit: '38447019517147319bd08c598202d097ee866874',
      collectorCommit: 'a'.repeat(40),
      projectionRowsSha256: buildBrokenBaselineProjection(fixture).rowsSha256,
      expectedFaults: ['unwindowed-1500-rows', 'list-source-440', 'full-portrait-cache-exposure', 'eager-art-import'],
      samples: {
        phone: [sample('broken-phone', 1, '38447019517147319bd08c598202d097ee866874',
          ['unwindowed-1500-rows', 'list-source-440', 'full-portrait-cache-exposure', 'eager-art-import'])],
        desktop: [sample('broken-desktop', 1, '38447019517147319bd08c598202d097ee866874',
          ['unwindowed-1500-rows', 'list-source-440', 'full-portrait-cache-exposure', 'eager-art-import'])],
      },
    },
    ceilings: { phone: { ...ceiling }, desktop: { ...ceiling } },
  };
}

function artSnapshot({ portrait = false, closed = false, generation = 1 } = {}) {
  const cacheEntries = 24;
  const decodedPixels = cacheEntries * 132 * 132;
  return {
    schema: ART_DIAGNOSTICS_SCHEMA,
    deviceClass: 'desktop',
    limits: {
      budgetStatus: 'provisional-candidate', cacheEntries: 256, decodedPixels: 8_000_000,
      decodedBytes: 32_000_000, encodedBytes: 5_000_000,
      encodedByteBasis: 'utf8-data-url', queuedJobs: 256, activeJobs: 4,
      leases: 400, portraitEntries: 8, portraitEncodedBytes: 20_000_000,
    },
    live: {
      cacheEntries, decodedPixels, decodedBytes: decodedPixels * 4,
      encodedBytes: 120_000, queuedJobs: 0, activeJobs: 0,
      leases: closed ? 4 : 20, subscribers: 0,
      portraitCacheEntries: portrait ? 1 : 0,
      portraitEncodedBytes: portrait ? 400_000 : 0,
    },
    totals: {
      leaseAcquires: 140 + generation, releases: 110, jobStarts: 90,
      jobCompletes: 85, jobCancels: 5, jobErrors: 1, dedupeHits: 12,
      disposals: 40, thumbCanvasRenders: 85,
      fullPortraitRendersForThumb: 0, fullPortraitDecodesForThumb: 0,
      maxQueuedJobs: 20, maxActiveJobs: 1,
    },
    keys: {
      leased: ['key-live'], queued: [], active: [],
      cached: Array.from({ length: cacheEntries }, (_, i) => `key-${i}`),
    },
  };
}

function diagnostic({ generation, mode = 'list', count = 1500, ids = [], portrait = false,
  closed = false, planetside = true, lazy = false, pinned = null } = {}) {
  const widths = ids.map(() => 132);
  return {
    schema: DIAGNOSTICS_SCHEMA,
    documentToken: lazy ? 'selftest-lazy-document' : 'selftest-main-document',
    generation,
    panel: {
      open: mode !== 'closed', mode, sourceCount: 1500,
      filteredCount: count, query: count === 1500 ? '' : 'filter',
      renderCommits: 50, staleCompletionDrops: 0, closedCompletionCommits: 0,
    },
    window: {
      start: pinned ? 600 : 0, end: pinned ? 620 : Math.max(1, ids.length),
      overscan: 8, beforePx: pinned ? 34_800 : 0, afterPx: 50_000,
      mountedRowCount: ids.length, mountedLogicalIds: [...ids],
      focusedLogicalId: pinned, pinnedLogicalIds: pinned ? [pinned] : [],
    },
    surfaces: {
      list: {
        imageCount: ids.length, naturalWidths: widths, naturalHeights: widths,
        thumbStates: ids.map(() => 'ready'), logicalIds: [...ids],
      },
      detail: {
        open: mode === 'detail', logicalId: mode === 'detail' ? 'cmem-0777-filter-beacon' : null,
        naturalWidth: mode === 'detail' ? 440 : 0,
        naturalHeight: mode === 'detail' ? 440 : 0,
      },
      planetside: {
        visible: planetside, imageCount: planetside ? 4 : 0,
        logicalIds: planetside ? ['planet:0', 'planet:1', 'planet:2', 'planet:3'] : [],
        naturalWidths: planetside ? [132, 132, 132, 132] : [],
        naturalHeights: planetside ? [132, 132, 132, 132] : [],
        thumbStates: planetside ? ['ready', 'ready', 'ready', 'ready'] : [],
      },
    },
    lazyArt: lazy ? { state: 'idle', importStarts: 0 } : { state: 'ready', importStarts: 1 },
    art: lazy ? null : artSnapshot({ portrait, closed, generation }),
  };
}

function snapshot({ generation, ids = [], mode = 'list', count = 1500,
  portrait = false, closed = false, pinned = null, heap = 10_000_000 } = {}) {
  const diagnostics = diagnostic({ generation, ids, mode, count, portrait, closed, pinned });
  return {
    diagnostics,
    heap: { usedSize: heap, totalSize: 14_000_000, embedderHeapUsedSize: 1_000_000, backingStorageSize: 500_000 },
    dom: { documents: 2, nodes: 400, jsEventListeners: 80 },
    raw: {
      mountedRowCount: ids.length, mountedLogicalIds: [...ids],
      rowRects: ids.map((logicalId, index) => ({
        logicalId, top: index * 58, bottom: index * 58 + 58, height: 58,
      })),
      listImages: ids.map((logicalId, index) => ({
        logicalId, naturalWidth: 132, naturalHeight: 132,
        visualKey: `visual-${logicalId}`, sourceSha256: `${index}`.padStart(64, '0'),
      })),
      planetsideImages: diagnostics.surfaces.planetside.logicalIds.map((logicalId) => ({
        logicalId, naturalWidth: 132, naturalHeight: 132,
      })),
      detailNaturalWidth: mode === 'detail' ? 440 : 0,
      detailNaturalHeight: mode === 'detail' ? 440 : 0,
      detailImageCount: mode === 'detail' ? 1 : 0,
      detailSrcPresent: mode === 'detail',
      activeLogicalId: null, activeElementId: null,
      focusedOutsideNormalWindow: pinned !== null,
      viewportHeight: 844, scrollerHeight: 600, scrollTop: 0,
    },
  };
}

function syntheticMeasurement(profile, fixture) {
  const baseViewportHeight = profile === 'phone' ? 844 : 800;
  const first = fixture.rows[0][0];
  const middle = fixture.rows[750][0];
  const last = fixture.rows[1499][0];
  const filter = fixture.filterBeacon;
  const firstIds = fixture.rows.slice(0, 20).map(([id]) => id);
  const middleIds = fixture.rows.slice(740, 760).map(([id]) => id);
  const deepIds = fixture.rows.slice(768, 788).map(([id]) => id);
  const lastIds = fixture.rows.slice(1480).map(([id]) => id);
  const lazyBoot = snapshot({ generation: 0, ids: [], mode: 'closed', closed: true });
  lazyBoot.diagnostics = diagnostic({ generation: 0, ids: [], mode: 'closed', closed: true, planetside: false, lazy: true });
  const lazyEnd = clone(lazyBoot);
  const initial = snapshot({ generation: 1, ids: [], mode: 'closed', closed: true });
  const firstPoint = snapshot({ generation: 2, ids: firstIds });
  const resizeExpanded = snapshot({
    generation: 2, ids: fixture.rows.slice(0, 28).map(([id]) => id),
  });
  firstPoint.raw.viewportHeight = baseViewportHeight;
  resizeExpanded.raw.viewportHeight = baseViewportHeight + 240;
  resizeExpanded.raw.scrollerHeight = 840;
  const resizeContracted = snapshot({
    generation: 2, ids: fixture.rows.slice(0, 12).map(([id]) => id),
  });
  resizeContracted.raw.viewportHeight = baseViewportHeight - 180;
  resizeContracted.raw.scrollerHeight = 420;
  const resizeRestored = clone(firstPoint);
  const middlePoint = snapshot({ generation: 4, ids: middleIds });
  const lastPoint = snapshot({ generation: 5, ids: lastIds });
  const filtered = snapshot({ generation: 7, ids: [filter], count: 1 });
  const detail = snapshot({ generation: 8, ids: [], count: 1, mode: 'detail', portrait: true });
  const detailClosed = snapshot({ generation: 9, ids: [], count: 1, mode: 'closed', portrait: true, closed: true });
  detailClosed.raw.detailImageCount = 1;
  detailClosed.raw.detailSrcPresent = false;
  detailClosed.raw.detailNaturalWidth = 0;
  detailClosed.raw.detailNaturalHeight = 0;
  const back = snapshot({ generation: 9, ids: deepIds, count: 1500, portrait: true });
  back.raw.activeLogicalId = filter;
  const focusPinned = snapshot({ generation: 11, ids: [first, ...middleIds], portrait: true, pinned: first });
  focusPinned.raw.focusRing = {
    outlineWidth: 3, outlineOffset: -3, outlineExtension: 0, outlineStyle: 'solid',
    rowLeft: 20, rowRight: 360, scrollerLeft: 20, scrollerRight: 360,
    ringLeft: 20, ringRight: 360,
    horizontallyContained: true,
  };
  const closed = snapshot({ generation: 13, ids: [], mode: 'closed', portrait: true, closed: true });
  closed.raw.activeElementId = 'dockcodex';
  const planetside = snapshot({ generation: 14, ids: [], mode: 'closed', portrait: true, closed: true });
  const warm = Array.from({ length: 4 }, (_, index) =>
    snapshot({ generation: 20 + index, ids: [], mode: 'closed', portrait: true,
      closed: true, heap: 10_000_000 + index * 50 }));
  for (const point of [initial, firstPoint, resizeExpanded, resizeContracted, resizeRestored,
    middlePoint, lastPoint, filtered, detail, detailClosed, back, focusPinned, closed,
    planetside, ...warm]) {
    point.diagnostics.art.deviceClass = profile;
  }
  return {
    profile,
    reviewPacket: [],
    viewport: profile === 'phone'
      ? { width: 390, height: 844, dpr: 3, mobile: true }
      : { width: 1280, height: 800, dpr: 1, mobile: false },
    fixture: {
      count: fixture.count, uniqueLogicalIds: fixture.count,
      uniqueCompleteGenomes: fixture.count, rowsSha256: fixture.rowsSha256,
      sameSeedShared: true, sameSeedCompleteDistinct: true,
    },
    lazySpeciesResource: {
      path: 'assets/speciesart-selftest.js', sha256: 'e'.repeat(64), matches: [], endMatches: [],
    },
    documentTokens: {
      lazy: 'selftest-lazy-document', lazyEnd: 'selftest-lazy-document',
      main: 'selftest-main-document',
    },
    targets: { first, middle, last, filter, detail: filter, pinned: first },
    identity: { alphaKey: 'complete-key-alpha', betaKey: 'complete-key-beta' },
    phases: {
      dedupe: { before: 10, after: 12, dedupeHitsDelta: 2 },
      churn: { before: 1, after: 5, jobCancelsDelta: 4 },
      backNavigation: {
        before: {
          logicalId: deepIds[0], offsetPx: -12, scrollTop: 44_544,
          window: { start: 768, end: 788, beforePx: 44_544, afterPx: 41_296 },
          selectedLogicalId: filter, selectedIndex: 777,
          selectedMounted: true, selectedIntersects: true,
          selectedInWindow: true, selectedPinned: false, activeLogicalId: filter,
        },
        after: {
          logicalId: deepIds[0], offsetPx: -12, scrollTop: 44_544,
          window: { start: 768, end: 788, beforePx: 44_544, afterPx: 41_296 },
          selectedLogicalId: filter, selectedIndex: 777,
          selectedMounted: true, selectedIntersects: true,
          selectedInWindow: true, selectedPinned: false, activeLogicalId: filter,
        },
        afterSettled: {
          logicalId: deepIds[0], offsetPx: -12, scrollTop: 44_544,
          window: { start: 768, end: 788, beforePx: 44_544, afterPx: 41_296 },
          selectedLogicalId: filter, selectedIndex: 777,
          selectedMounted: true, selectedIntersects: true,
          selectedInWindow: true, selectedPinned: false, activeLogicalId: filter,
        },
      },
      close: { beforeLeases: 24, afterLeases: 4, releasesDelta: 20 },
      planetsideLifecycle: {
        hidden: {
          computedHidden: true, liveLeases: 0,
          images: ['planet:0', 'planet:1', 'planet:2', 'planet:3'].map((logicalId) => ({
            logicalId, srcPresent: false, visualKeyPresent: false, thumbState: 'released',
          })),
        },
        revealed: {
          liveLeases: 4,
          logicalIds: ['planet:0', 'planet:1', 'planet:2', 'planet:3'],
          images: ['planet:0', 'planet:1', 'planet:2', 'planet:3'].map((logicalId) => ({
            logicalId, naturalWidth: 132, naturalHeight: 132,
          })),
        },
      },
      viewportResize: {
        base: firstPoint, expanded: resizeExpanded,
        contracted: resizeContracted, restored: resizeRestored,
      },
      keyboardTraversal: {
        initialWindowEnd: 20,
        crossedWindowBoundary: true,
        reviewFocus: { logicalId: fixture.rows[30][0], intersects: true,
          outlineWidth: 3, outlineOffset: -3 },
        samples: Array.from({ length: 31 }, (_, index) => ({
          expectedIndex: index, expectedLogicalId: fixture.rows[index][0],
          actualIndex: index, actualLogicalId: fixture.rows[index][0],
          mounted: true, mountedRowCount: 20,
          windowStart: index < 20 ? 0 : 8, windowEnd: index < 20 ? 20 : 32,
        })),
      },
      jobPeaks: {
        deviceClass: profile, queuedJobsPeak: 20, activeJobsPeak: 1,
        queuedJobsLimit: 256, activeJobsLimit: 1,
      },
    },
    points: { lazyBoot, lazyEnd, initial, first: firstPoint, middle: middlePoint, last: lastPoint,
      filtered, detail, detailClosed, back, focusPinned, closed, planetside, warm,
      error: {
        jobErrorsDelta: 1, uiResponsive: true, poisonedCacheEntry: false,
        recoveryJobCompletesDelta: 1, recoveredKey: 'recovered-key',
      },
      capShrink: {
        beforeEntries: 140, afterEntries: 80, phoneLimit: 96,
        afterDecodedBytes: 5_500_000, phoneDecodedBytesLimit: 8_000_000,
        beforeDeviceClass: 'desktop', afterDeviceClass: 'phone', restoredDeviceClass: profile,
        disposalsDelta: 60,
      },
    },
    answerability: [
      { target: { ok: true, ms: 20, value: `${profile}-first`, expected: `${profile}-first` },
        heartbeat: { ok: true, ms: 15, product: 'Chrome/Selftest' } },
      { target: { ok: true, ms: 25, value: `${profile}-last`, expected: `${profile}-last` },
        heartbeat: { ok: true, ms: 18, product: 'Chrome/Selftest' } },
    ],
  };
}

function failedChecks(measurement, budget, fixture) {
  return evaluateProfile(measurement, budget, fixture)
    .filter((outcome) => outcome.status === 'fail');
}

function control(label, baseline, budget, fixture, mutate, expectedCheck) {
  const broken = clone(baseline);
  mutate(broken);
  const failures = failedChecks(broken, budget, fixture);
  assert(failures.some((failure) => failure.check === expectedCheck),
    `${label} did not fail ${expectedCheck}; got ${failures.map((failure) => failure.check).join(', ')}`);
  const owned = failures.find((failure) => failure.check === expectedCheck);
  assert(typeof owned.diagnosis === 'string' && owned.diagnosis.startsWith(`${baseline.profile}:`),
    `${label} did not publish its own scoped diagnosis`);
}

function terminalReport(runId, outcomes, budget, profiles) {
  const source = {
    commit: 'a'.repeat(40), branch: 'openai/selftest', state: 'committed',
    statusSha256: 'b'.repeat(64), workingTreeSha256: 'c'.repeat(64),
  };
  return {
    schema: REPORT_SCHEMA, status: 'pass', runId,
    startedAt: '2026-08-16T00:00:00.000Z', endedAt: '2026-08-16T00:00:01.000Z',
    durationMs: 1000,
    policy: { attemptCount: 1, automaticRetries: 0, commandTimeoutMs: 2000 },
    source: { begin: source, end: { ...source } },
    inputs: Object.fromEntries(REPORT_INPUT_KEYS.map((key) => [key, sha256(`selftest-${key}`)])),
    browser: {
      executable: '/selftest/chrome', product: 'Chrome/Selftest', revision: 'selftest',
      user_agent: 'selftest', js_version: 'selftest', protocol_version: '1.3',
    },
    budget: { status: budget.status }, expectedOutcomes: [...EXPECTED_OUTCOMES],
    outcomes, findings: [], profiles,
    reviewPacket: ['phone', 'desktop'].flatMap((profile) =>
      /* Match the real collector chronology; verification seals the exact
         unique profile/state set rather than an incidental array order. */
      ['list', 'focus-pinned', 'detail'].map((state) => ({
        profile, state,
        file: `apps/game/smoke/compendiummem-${runId}-${profile}-${state}.png`,
        bytes: 100, sha256: sha256(`${runId}-${profile}-${state}`),
      }))),
  };
}

function atomicWriteJson(file, value) {
  const temporary = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2) + '\n');
  fs.renameSync(temporary, file);
}

export function runCompendiumMemSelftest() {
  const timeoutPolicy = {
    candidateTransportTimeoutMs: CANDIDATE_TRANSPORT_TIMEOUT_MS,
    candidateTargetTimeoutMs: COMMAND_TIMEOUT_MS,
    baselineTransportTimeoutMs: BASELINE_OBSERVATION_TIMEOUT_MS,
    baselineObservationTimeoutMs: BASELINE_OBSERVATION_TIMEOUT_MS,
  };
  assert(validTransportTimeoutPolicy(timeoutPolicy),
    'configured baseline heavy command is not admitted by its CDP transport ceiling');
  assert(!validTransportTimeoutPolicy({ ...timeoutPolicy, baselineTransportTimeoutMs: 5000 }),
    'the rejected 5s baseline transport configuration passed the pure timeout policy');
  assert(!validTransportTimeoutPolicy({
    ...timeoutPolicy, baselineTransportTimeoutMs: BASELINE_OBSERVATION_TIMEOUT_MS + 1,
  }), 'a widened baseline transport hang ceiling passed the exact timeout policy');
  assert(!validTransportTimeoutPolicy({ ...timeoutPolicy, candidateTargetTimeoutMs: 2001 }),
    'candidate target/heartbeat deadline drifted above the exact 2s law');
  assert(!validTransportTimeoutPolicy({
    ...timeoutPolicy, candidateTransportTimeoutMs: CANDIDATE_TRANSPORT_TIMEOUT_MS + 1,
  }), 'a widened candidate transport hang ceiling passed the exact timeout policy');
  const baselineOpenOptions = compendiumCdpOptions('baseline', {
    label: 'selftest-baseline', userDataPrefix: 'selftest-baseline', startupTimeoutMs: 15_000,
  });
  const candidateOpenOptions = compendiumCdpOptions('candidate', {
    label: 'selftest-candidate', userDataPrefix: 'selftest-candidate', startupTimeoutMs: 15_000,
  });
  assert(Object.isFrozen(baselineOpenOptions)
    && baselineOpenOptions.commandTimeoutMs === BASELINE_OBSERVATION_TIMEOUT_MS,
  'the actual baseline launcher options factory did not admit the heavy observation timeout');
  assert(Object.isFrozen(candidateOpenOptions)
    && candidateOpenOptions.commandTimeoutMs === CANDIDATE_TRANSPORT_TIMEOUT_MS
    && COMMAND_TIMEOUT_MS === 2000,
  'the actual candidate launcher options factory weakened the exact 2s target law');
  let timeoutOverrideRejected = false;
  try {
    compendiumCdpOptions('baseline', { commandTimeoutMs: 5000 });
  } catch { timeoutOverrideRejected = true; }
  assert(timeoutOverrideRejected,
    'the launcher options factory accepted an independent call-site timeout override');
  const phaseDeadline = 16_000;
  const fakeEvaluate = (completedAt) => ({
    commandTimeoutMs: remainingCommandTimeoutMs(
      phaseDeadline, 1_000, BASELINE_OBSERVATION_TIMEOUT_MS,
    ),
    accepted: phaseObservationAccepted(phaseDeadline, completedAt, { ready: true }),
  });
  assert(fakeEvaluate(phaseDeadline - 1).commandTimeoutMs === 15_000
    && fakeEvaluate(phaseDeadline - 1).accepted,
  'an on-time baseline phase observation or its clipped remaining timeout was rejected');
  assert(!fakeEvaluate(phaseDeadline).accepted && !fakeEvaluate(phaseDeadline + 1).accepted,
    'an exact-deadline or late truthy baseline phase observation was accepted');
  const phoneViewport = { width: 390, height: 844, dpr: 3, mobile: true };
  const desktopViewport = { width: 1280, height: 800, dpr: 1, mobile: false };
  const phoneEmulation = compendiumProfileEmulationOptions('phone', phoneViewport);
  const desktopEmulation = compendiumProfileEmulationOptions('desktop', desktopViewport);
  assert(validProfileEmulationOptions('phone', phoneViewport, phoneEmulation)
    && Object.isFrozen(phoneEmulation) && Object.isFrozen(phoneEmulation.touch)
    && phoneEmulation.touch.enabled === true && phoneEmulation.touch.maxTouchPoints === 5,
  'the shared phone CDP emulation payload is not sealed at five touch points');
  assert(validProfileEmulationOptions('desktop', desktopViewport, desktopEmulation)
    && Object.isFrozen(desktopEmulation) && Object.isFrozen(desktopEmulation.touch)
    && JSON.stringify(desktopEmulation.touch) === JSON.stringify({ enabled: false }),
  'the shared desktop CDP emulation payload did not omit maxTouchPoints');
  assert(!validProfileEmulationOptions('desktop', desktopViewport, {
    ...desktopEmulation, touch: { enabled: false, maxTouchPoints: 0 },
  }), 'the rejected desktop maxTouchPoints=0 payload passed the shared contract');
  assert(!validProfileEmulationOptions('phone', phoneViewport, {
    ...phoneEmulation, touch: { enabled: false },
  }), 'a disabled phone touch payload passed the shared contract');
  for (const maxTouchPoints of [0, 17]) {
    assert(!validProfileEmulationOptions('phone', phoneViewport, {
      ...phoneEmulation, touch: { enabled: true, maxTouchPoints },
    }), `phone maxTouchPoints=${maxTouchPoints} passed the exact five-point contract`);
  }
  const fixture = buildCompendiumFixture();
  const baselineProjection = buildBrokenBaselineProjection(fixture);
  assert(baselineProjection.count === 1500 && baselineProjection.uniqueSeeds === 1500,
    'baseline-only projection did not survive the old seed-keyed importer at 1,500 rows');
  assert(baselineProjection.rekeys.length === 1
    && baselineProjection.rekeys[0].logicalId === fixture.sameSeedPair[1]
    && baselineProjection.sourceRowsSha256 === fixture.rowsSha256,
  'baseline-only projection did not isolate and bind the deliberate duplicate-seed row');
  const budget = activeBudget(fixture);
  const validateBudget = (record) => validateBudgetRecord(
    record, fixture.rowsSha256, baselineProjection.rowsSha256,
  );
  const budgetCheck = validateBudget(budget);
  assert(budgetCheck.ok, `synthetic active budget rejected: ${budgetCheck.errors.join('; ')}`);
  const duplicateBudget = clone(budget);
  duplicateBudget.calibration.samples.phone[1] = clone(duplicateBudget.calibration.samples.phone[0]);
  assert(validateBudget(duplicateBudget).errors.some((error) =>
    /runIds are not independent|timestamps are not independent/.test(error)),
  'duplicate calibration run masqueraded as an independent sample');
  const mixedBudget = clone(budget);
  mixedBudget.calibration.samples.desktop[2].inputDigest = 'd'.repeat(64);
  assert(validateBudget(mixedBudget).errors.some((error) =>
    /do not share one exact/.test(error)),
  'mixed candidate input digest was accepted');
  const dirtyBudget = clone(budget);
  dirtyBudget.calibration.samples.phone[0].sourceState = 'dirty-diagnostic';
  assert(validateBudget(dirtyBudget).errors.some((error) =>
    /sourceState must be committed/.test(error)),
  'dirty calibration sample was accepted into an active budget');
  const longCommitBudget = clone(budget);
  longCommitBudget.calibration.samples.phone[0].commit = 'a'.repeat(64);
  assert(validateBudget(longCommitBudget).errors.some((error) =>
    /commit is invalid/.test(error)),
  'non-Git 64-hex calibration commit was accepted');
  const emptyBrowserBudget = clone(budget);
  emptyBrowserBudget.calibration.samples.phone[0].browser.userAgent = '';
  assert(validateBudget(emptyBrowserBudget).errors.some((error) =>
    /browser provenance is incomplete/.test(error)),
  'empty calibration browser provenance was accepted');
  const unknownBudget = clone(budget);
  unknownBudget.uncheckedCeiling = 1;
  assert(validateBudget(unknownBudget).errors.some((error) =>
    /budget keys must be exactly/.test(error)),
  'unknown budget field bypassed the strict semantic schema');
  const wrongProjectionBudget = clone(budget);
  wrongProjectionBudget.pairedBrokenBaseline.projectionRowsSha256 = '0'.repeat(64);
  assert(validateBudget(wrongProjectionBudget).errors.some((error) =>
    /projection digest does not match/.test(error)),
  'different broken-baseline projection was accepted as the adapter input');
  for (const [field, value] of [
    ['schema', 'wrong-fixture-schema'],
    ['generator', 'wrong-fixture-generator'],
    ['count', 1499],
  ]) {
    const wrongFixture = clone(budget);
    wrongFixture.fixture[field] = value;
    assert(validateBudget(wrongFixture).errors.some((error) =>
      /fixture provenance is invalid/.test(error)),
    `wrong fixture ${field} bypassed semantic validation`);
  }
  const missingBaselineFault = clone(budget);
  missingBaselineFault.pairedBrokenBaseline.samples.phone[0].observedFaults.pop();
  assert(validateBudget(missingBaselineFault).errors.some((error) =>
    /observedFaults must prove every sealed/.test(error)),
  'baseline sample missing one observed fault was accepted');
  const phone = syntheticMeasurement('phone', fixture);
  const desktop = syntheticMeasurement('desktop', fixture);
  const generatedMetricBudget = clone(budget);
  const generatedPhoneMetrics = calibrationMetrics(phone);
  const generatedDesktopMetrics = calibrationMetrics(desktop);
  assert(generatedPhoneMetrics.mountedRows === 28
    && generatedDesktopMetrics.mountedRows === 28,
  'calibration metrics did not retain the expanded-viewport mounted-row maximum');
  for (const sample of generatedMetricBudget.calibration.samples.phone) {
    sample.metrics = clone(generatedPhoneMetrics);
  }
  for (const sample of generatedMetricBudget.calibration.samples.desktop) {
    sample.metrics = clone(generatedDesktopMetrics);
  }
  assert(validateBudget(generatedMetricBudget).ok,
    'collector-generated candidate metric shape cannot activate the strict budget contract');
  for (const measurement of [phone, desktop]) {
    const outcomes = evaluateProfile(measurement, budget, fixture);
    assert(outcomes.length === OUTCOME_IDS.length,
      `${measurement.profile} did not emit the sealed outcome count`);
    assert(outcomes.every((outcome) => outcome.status === 'pass'),
      `${measurement.profile} green fixture was red: ${JSON.stringify(outcomes.filter((o) => o.status === 'fail'))}`);
  }

  const controls = [
    ['empty fixture', (m) => { m.fixture.count = 0; m.fixture.uniqueLogicalIds = 0; m.fixture.uniqueCompleteGenomes = 0; }, 'input-fixture-1500-distinct'],
    ['short fixture', (m) => { m.fixture.count = 1499; m.fixture.uniqueLogicalIds = 1499; m.fixture.uniqueCompleteGenomes = 1499; }, 'input-fixture-1500-distinct'],
    ['eager static species chunk resource', (m) => {
      m.lazySpeciesResource.matches = ['http://127.0.0.1/assets/speciesart-selftest.js'];
    }, 'lazy-art-not-eager'],
    ['late static species chunk resource', (m) => {
      m.lazySpeciesResource.endMatches = ['http://127.0.0.1/assets/speciesart-selftest.js'];
    }, 'lazy-art-not-eager'],
    ['unwindowed rows', (m) => { m.points.first.raw.mountedRowCount = 1500; m.points.first.diagnostics.window.mountedRowCount = 1500; }, 'mounted-window-bounded'],
    ['stale resize window', (m) => {
      m.phases.viewportResize.contracted.diagnostics.window.end = m.phases.viewportResize.base.diagnostics.window.end;
      m.phases.viewportResize.contracted.raw.mountedRowCount = m.phases.viewportResize.base.raw.mountedRowCount;
    }, 'mounted-window-bounded'],
    ['stale expanded resize window', (m) => {
      m.phases.viewportResize.expanded.raw.scrollerHeight = m.phases.viewportResize.contracted.raw.scrollerHeight;
      m.phases.viewportResize.expanded.diagnostics.window.end = m.phases.viewportResize.contracted.diagnostics.window.end;
      m.phases.viewportResize.expanded.raw.mountedRowCount = m.phases.viewportResize.contracted.raw.mountedRowCount;
    }, 'mounted-window-bounded'],
    ['440 list source', (m) => { m.points.first.raw.listImages[0].naturalWidth = 440; m.points.first.raw.listImages[0].naturalHeight = 440; }, 'list-source-132'],
    ['wrong 131 thumb', (m) => { m.points.first.raw.listImages[0].naturalWidth = 131; m.points.first.raw.listImages[0].naturalHeight = 131; }, 'list-source-132'],
    ['wrong 439 detail', (m) => { m.points.detail.raw.detailNaturalWidth = 439; m.points.detail.raw.detailNaturalHeight = 439; }, 'detail-opened'],
    ['mounted image missing', (m) => { m.points.first.raw.listImages.pop(); }, 'mounted-natural-dimensions'],
    ['mounted image duplicate', (m) => { m.points.first.raw.listImages[1].logicalId = m.points.first.raw.listImages[0].logicalId; }, 'mounted-natural-dimensions'],
    ['mounted row overlap', (m) => { m.points.first.raw.rowRects[1].top = 20; m.points.first.raw.rowRects[1].bottom = 78; }, 'mounted-natural-dimensions'],
    ['release', (m) => { m.phases.close.releasesDelta = 0; }, 'art-release'],
    ['disposal', (m) => { m.points.capShrink.disposalsDelta = 0; }, 'art-disposal'],
    ['dedupe', (m) => { m.phases.dedupe.dedupeHitsDelta = 0; }, 'art-dedupe'],
    ['bare seed', (m) => { m.identity.betaKey = m.identity.alphaKey; }, 'full-identity-key'],
    ['generation cancellation', (m) => { m.phases.churn.jobCancelsDelta = 0; }, 'generation-guard'],
    ['stale publication', (m) => { m.points.warm.at(-1).diagnostics.panel.closedCompletionCommits = 1; }, 'generation-guard'],
    ['focus recycling', (m) => { m.points.focusPinned.diagnostics.window.pinnedLogicalIds = []; }, 'focus-row-pinned'],
    ['clipped outside focus ring', (m) => {
      const ring = m.points.focusPinned.raw.focusRing;
      ring.outlineOffset = -1; ring.outlineExtension = 2;
      ring.ringLeft = ring.rowLeft - 2; ring.ringRight = ring.rowRight + 2;
      ring.horizontallyContained = false;
    }, 'focus-row-pinned'],
    ['review packet focus hidden', (m) => { m.phases.keyboardTraversal.reviewFocus.intersects = false; }, 'focus-row-pinned'],
    ['virtual Tab traversal order', (m) => { m.phases.keyboardTraversal.samples[21].actualIndex = 22; }, 'focus-row-pinned'],
    ['Back shifts selected row outside bounded window', (m) => {
      m.phases.backNavigation.after.window.start = 900;
      m.phases.backNavigation.after.window.end = 920;
      m.phases.backNavigation.after.selectedInWindow = false;
      m.phases.backNavigation.after.selectedPinned = false;
    }, 'back-restores-focus'],
    ['Back shifted logical anchor', (m) => { m.phases.backNavigation.after.offsetPx += 9; }, 'back-restores-focus'],
    ['count-only byte growth', (m) => { m.points.first.diagnostics.art.live.encodedBytes = 2_000_000; }, 'byte-ceiling'],
    ['zero queued-job peak', (m) => { m.phases.jobPeaks.queuedJobsPeak = 0; }, 'resource-live-limits'],
    ['zero active-job peak', (m) => { m.phases.jobPeaks.activeJobsPeak = 0; }, 'resource-live-limits'],
    ['product queued-job peak limit', (m) => {
      m.phases.jobPeaks.queuedJobsPeak = m.phases.jobPeaks.queuedJobsLimit + 1;
    }, 'resource-live-limits'],
    ['product active-job peak limit', (m) => {
      m.phases.jobPeaks.activeJobsPeak = m.phases.jobPeaks.activeJobsLimit + 1;
    }, 'resource-live-limits'],
    ['measured queued-job peak ceiling', (m) => { m.phases.jobPeaks.queuedJobsPeak = 21; }, 'byte-ceiling'],
    ['measured active-job peak ceiling', (m) => { m.phases.jobPeaks.activeJobsPeak = 5; }, 'byte-ceiling'],
    ['measured lease ceiling', (m) => { m.points.first.diagnostics.art.live.leases = 101; }, 'byte-ceiling'],
    ['measured subscriber ceiling', (m) => { m.points.first.diagnostics.art.live.subscribers = 101; }, 'byte-ceiling'],
    ['measured portrait-entry ceiling', (m) => { m.points.detail.diagnostics.art.live.portraitCacheEntries = 5; }, 'byte-ceiling'],
    ['measured portrait-byte ceiling', (m) => { m.points.detail.diagnostics.art.live.portraitEncodedBytes = 1_000_001; }, 'byte-ceiling'],
    ['cap shrink', (m) => { m.points.capShrink.afterEntries = m.points.capShrink.beforeEntries; }, 'cap-shrink'],
    ['wrong selected device class', (m) => { m.points.first.diagnostics.art.deviceClass = m.profile === 'phone' ? 'desktop' : 'phone'; }, 'resource-live-limits'],
    ['wrong pre-override device class', (m) => { m.points.initial.diagnostics.art.deviceClass = m.profile === 'phone' ? 'desktop' : 'phone'; }, 'resource-live-limits'],
    ['wrong cap-shrink device class', (m) => { m.points.capShrink.afterDeviceClass = 'desktop'; }, 'cap-shrink'],
    ['producer error swallowed', (m) => { m.points.error.jobErrorsDelta = 0; }, 'error-contained'],
    ['producer error poisoned', (m) => { m.points.error.poisonedCacheEntry = true; }, 'error-contained'],
    ['producer error no recovery', (m) => { m.points.error.recoveryJobCompletesDelta = 0; }, 'error-recoverable'],
    ['canvas bypass', (m) => { m.points.warm.at(-1).diagnostics.art.totals.thumbCanvasRenders = 0; }, 'canvas-thumb-path'],
    ['full portrait thumb path', (m) => { m.points.warm.at(-1).diagnostics.art.totals.fullPortraitRendersForThumb = 1; }, 'no-full-portrait-thumb-path'],
    ['portrait cache thumb pollution', (m) => { m.points.first.diagnostics.art.live.portraitCacheEntries = 1; m.points.first.diagnostics.art.live.portraitEncodedBytes = 100; }, 'no-full-portrait-thumb-path'],
    ['eager import', (m) => { m.points.lazyBoot.diagnostics.lazyArt = { state: 'ready', importStarts: 1 }; m.points.lazyBoot.diagnostics.art = artSnapshot(); }, 'lazy-art-not-eager'],
    ['late eager import', (m) => { m.points.lazyEnd.diagnostics.lazyArt = { state: 'ready', importStarts: 1 }; m.points.lazyEnd.diagnostics.art = artSnapshot(); }, 'lazy-art-not-eager'],
    ['missing product limit', (m) => { delete m.points.first.diagnostics.art.limits.encodedBytes; }, 'resource-live-limits'],
    ['product budget status missing', (m) => { delete m.points.first.diagnostics.art.limits.budgetStatus; }, 'resource-live-limits'],
    ['product diagnostic schema drift', (m) => { m.points.first.diagnostics.schema = 'wrong'; }, 'resource-live-limits'],
    ['mixed document token', (m) => { m.points.first.diagnostics.documentToken = 'foreign-document'; }, 'resource-live-limits'],
    ['close ownership leak', (m) => { m.points.closed.diagnostics.art.live.leases = 5; }, 'close-restores-focus'],
    ['closed detail source retained', (m) => { m.points.detailClosed.raw.detailSrcPresent = true; m.points.detailClosed.raw.detailNaturalWidth = 440; m.points.detailClosed.raw.detailNaturalHeight = 440; }, 'close-dom-cleanup'],
    ['planetside overflow', (m) => { m.points.planetside.diagnostics.surfaces.planetside.logicalIds = Array.from({ length: 9 }, (_, i) => `p:${i}`); }, 'planetside-bounded'],
    ['hidden Planetside source retained', (m) => { m.phases.planetsideLifecycle.hidden.images[0].srcPresent = true; }, 'planetside-hide-release-reacquire'],
    ['filter wrong count', (m) => { m.points.filtered.diagnostics.panel.filteredCount = 2; }, 'filter-result'],
    ['missing first', (m) => { m.points.first.raw.mountedLogicalIds = []; }, 'first-row-reached'],
    ['missing middle', (m) => { m.points.middle.raw.mountedLogicalIds = []; }, 'middle-row-reached'],
    ['missing last', (m) => { m.points.last.raw.mountedLogicalIds = []; }, 'last-row-reached'],
    ['warm jobs', (m) => { m.points.warm[2].diagnostics.art.live.activeJobs = 1; }, 'settled-jobs'],
    ['warm plateau', (m) => { m.points.warm[2].heap.usedSize += 5000; }, 'warm-plateau'],
    ['target timeout', (m) => { m.answerability[0].target.ms = 2001; }, 'target-answerable-first'],
    ['heartbeat timeout', (m) => { m.answerability.at(-1).heartbeat.ms = 2001; }, 'heartbeat-last'],
    ['missing final answerability probe', (m) => { m.answerability.pop(); }, 'target-answerable-last'],
    ['duplicate first answerability probe', (m) => { m.answerability[1] = clone(m.answerability[0]); }, 'target-answerable-last'],
    ['swapped answerability probes', (m) => { m.answerability.reverse(); }, 'target-answerable-first'],
  ];
  for (const [label, mutate, expected] of controls) {
    control(label, phone, budget, fixture, mutate, expected);
  }

  const outcomes = [
    ...evaluateProfile(phone, budget, fixture),
    ...evaluateProfile(desktop, budget, fixture),
  ];
  const report = terminalReport('selftest-current', outcomes, budget, { phone, desktop });
  const validReportCheck = verifyTerminalReport(report, 'selftest-current');
  assert(validReportCheck.ok,
    `valid terminal report was rejected: ${validReportCheck.errors.join('; ')}`);
  const missingProfile = clone(report);
  delete missingProfile.profiles.phone;
  assert(!verifyTerminalReport(missingProfile, 'selftest-current').ok,
    'PASS missing raw phone profile measurements was accepted');
  const missing = clone(report);
  missing.outcomes.splice(17, 1);
  assert(!verifyTerminalReport(missing, 'selftest-current').ok,
    'missing sealed outcome was accepted');
  const retry = clone(report);
  retry.policy.attemptCount = 2; retry.policy.automaticRetries = 1;
  assert(!verifyTerminalReport(retry, 'selftest-current').ok,
    'multi-attempt/retry report was accepted');
  const missingInput = clone(report);
  delete missingInput.inputs.collector;
  assert(!verifyTerminalReport(missingInput, 'selftest-current').ok,
    'report with a missing named input digest was accepted');
  const mixed = clone(report);
  mixed.source.end.workingTreeSha256 = 'd'.repeat(64);
  assert(!verifyTerminalReport(mixed, 'selftest-current').ok,
    'mixed-source report was accepted');
  const dirty = clone(report);
  dirty.source.begin.state = 'dirty-diagnostic';
  dirty.source.end.state = 'dirty-diagnostic';
  assert(!verifyTerminalReport(dirty, 'selftest-current').ok,
    'dirty-source PASS was accepted');
  const invalidCommit = clone(report);
  invalidCommit.source.begin.commit = '';
  invalidCommit.source.end.commit = '';
  assert(!verifyTerminalReport(invalidCommit, 'selftest-current').ok,
    'missing-git/invalid-commit PASS was accepted');
  const emptyBrowser = clone(report);
  emptyBrowser.browser.protocol_version = '';
  assert(!verifyTerminalReport(emptyBrowser, 'selftest-current').ok,
    'PASS with empty browser provenance was accepted');
  const missingReview = clone(report);
  missingReview.reviewPacket.pop();
  assert(!verifyTerminalReport(missingReview, 'selftest-current').ok,
    'PASS with a missing run-bound review image was accepted');
  const staleReviewName = clone(report);
  staleReviewName.reviewPacket[0].file = staleReviewName.reviewPacket[0].file
    .replace('selftest-current', 'selftest-stale');
  assert(!verifyTerminalReport(staleReviewName, 'selftest-current').ok,
    'review image from another run was accepted');
  const duplicateReviewFile = clone(report);
  duplicateReviewFile.reviewPacket[1].file = duplicateReviewFile.reviewPacket[0].file;
  assert(!verifyTerminalReport(duplicateReviewFile, 'selftest-current').ok,
    'two review states pointing at one same-run file were accepted');
  const artifactReport = clone(report);
  const png = Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), Buffer.from('selftest-png')]);
  const artifacts = new Map();
  for (const item of artifactReport.reviewPacket) {
    artifacts.set(item.file, Buffer.from(png));
    item.bytes = png.length;
    item.sha256 = sha256(png);
  }
  const verifyArtifact = (item) => {
    const bytes = artifacts.get(item.file);
    return Buffer.isBuffer(bytes) && bytes.length === item.bytes
      && sha256(bytes) === item.sha256
      && bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'));
  };
  assert(verifyTerminalReport(artifactReport, 'selftest-current', { verifyArtifact }).ok,
    'present hash-bound PNG review packet was rejected');
  artifacts.delete(artifactReport.reviewPacket[0].file);
  assert(!verifyTerminalReport(artifactReport, 'selftest-current', { verifyArtifact }).ok,
    'missing review artifact was accepted');
  artifacts.set(artifactReport.reviewPacket[0].file, Buffer.from('corrupt'));
  assert(!verifyTerminalReport(artifactReport, 'selftest-current', { verifyArtifact }).ok,
    'corrupt review artifact was accepted');
  const stale = clone(report); stale.runId = 'selftest-stale';
  assert(!verifyTerminalReport(stale, 'selftest-current').ok,
    'stale PASS was accepted for the current run');

  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-compendiummem-selftest-'));
  try {
    const file = path.join(temp, 'report.json');
    atomicWriteJson(file, stale);
    const running = { ...clone(report), runId: 'selftest-current', status: 'running', outcomes: [] };
    atomicWriteJson(file, running);
    assert(JSON.parse(fs.readFileSync(file, 'utf8')).status === 'running',
      'current running record did not replace stale PASS before work');
    const instrumentFail = {
      ...running, status: 'instrument-fail', endedAt: '2026-08-16T00:00:00.100Z',
      outcomes: [], findings: ['selftest: injected pre-browser failure'], browser: null,
    };
    atomicWriteJson(file, instrumentFail);
    const current = JSON.parse(fs.readFileSync(file, 'utf8'));
    const verified = verifyTerminalReport(current, 'selftest-current');
    assert(verified.ok, `current instrument-fail report rejected: ${verified.errors.join('; ')}`);
    assert(current.status === 'instrument-fail' && current.findings[0].includes('injected'),
      'injected early exit left stale/running evidence instead of terminal current red');
  } finally {
    const prefix = os.tmpdir().endsWith(path.sep) ? os.tmpdir() : os.tmpdir() + path.sep;
    assert(temp.startsWith(prefix), `refusing unsafe temporary cleanup ${temp}`);
    fs.rmSync(temp, { recursive: true });
  }
  const calibration = clone(report);
  calibration.status = 'calibration';
  calibration.budget.status = 'calibration-required';
  assert(verifyTerminalReport(calibration, 'selftest-current', { allowCalibration: true }).ok,
    'explicit non-certifying calibration report was rejected');
  assert(!verifyTerminalReport(calibration, 'selftest-current').ok,
    'calibration report was accepted as certifying evidence');
  console.log(`COMPENDIUMMEM SELFTEST: PASS — ${controls.length} independent product controls`);
  console.log('  empty + short fixtures; unwindowed rows; exact 132/440 dimensions');
  console.log('  release/disposal/dedupe/full identity/generation/focus/error/cap/canvas/eager import');
  console.log('  count-only bytes, warm plateau, target+heartbeat, stale PASS, missing outcome, no retry');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length === 2) runCompendiumMemSelftest();
  else {
    console.error('usage: node tools/compendiummem-selftest.mjs');
    process.exitCode = 2;
  }
}
