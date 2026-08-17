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
  ART_DIAGNOSTICS_SCHEMA, BASELINE_OBSERVATION_TIMEOUT_MS,
  BROKEN_BASELINE_EXPECTED_FAULTS, BROKEN_BASELINE_PORTRAIT_CACHE_CAPS,
  BROKEN_BASELINE_THUMB_CACHE_CAP, BROKEN_BASELINE_THUMB_OBSERVER_SCHEMA,
  BUDGET_SCHEMA, CANDIDATE_BROWSER_LABEL, CANDIDATE_TRANSPORT_TIMEOUT_MS,
  COMMAND_TIMEOUT_MS,
  COMPENDIUM_RAW_SNAPSHOT_REQUIRED_TOKENS, DIAGNOSTICS_SCHEMA,
  EXPECTED_OUTCOMES, FILTER_TRANSITION_SCHEMA, OUTCOME_IDS,
  PARTIAL_FAILURE_SCHEMA, PARTIAL_PROFILE_SCHEMA,
  PLAIN_EVALUATE_COMMAND_SCHEMA, RAW_CDP_COMMAND_SCHEMA,
  REPORT_INPUT_KEYS, REPORT_SCHEMA,
  brokenBaselineCacheMetrics, brokenBaselineFailureEvidence, brokenBaselineFaults,
  calibrationMetrics, compendiumCdpOptions, compendiumProfileEmulationOptions,
  compendiumRawSnapshotExpression, evaluateProfile,
  installBrokenBaselineThumbObserver,
  phaseObservationAccepted,
  remainingCommandTimeoutMs, sha256,
  validBrokenBaselineThumbObservation, validProfileEmulationOptions,
  validCompendiumRawSnapshotExpression, validTransportTimeoutPolicy,
  validFilterTransitionObservation, validFilterTransitionWitness,
  validateBudgetRecord, validCandidateCommandEvidence, verifyTerminalReport,
} from './compendiummem-contract.mjs';
import {
  buildBrokenBaselineProjection, buildCompendiumFixture,
} from './compendiummem-fixture.mjs';
import {
  collectCandidateSnapshot, createCandidateCollectorObservations,
  driveCandidateFilterTransition,
} from './compendiummem.mjs';

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
      expectedFaults: [...BROKEN_BASELINE_EXPECTED_FAULTS],
      samples: {
        phone: [sample('broken-phone', 1, '38447019517147319bd08c598202d097ee866874',
          [...BROKEN_BASELINE_EXPECTED_FAULTS])],
        desktop: [sample('broken-desktop', 1, '38447019517147319bd08c598202d097ee866874',
          [...BROKEN_BASELINE_EXPECTED_FAULTS])],
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

function syntheticFilterObservation({
  profile, ready, query, filteredCount, generation, sourceCount = 1500,
}) {
  const art = artSnapshot({ generation });
  art.deviceClass = profile;
  return {
    ready, mode: 'list', query, filteredCount, sourceCount, generation,
    art: { live: clone(art.live), totals: clone(art.totals) },
  };
}

function syntheticFilterTransition({
  profile, entryMode, query, filteredCount, baselineGeneration,
  priorQuery, priorFilteredCount,
}) {
  const falsy = syntheticFilterObservation({
    profile, ready: false, query: priorQuery,
    filteredCount: priorFilteredCount, generation: baselineGeneration,
  });
  const settled = syntheticFilterObservation({
    profile, ready: true, query, filteredCount,
    generation: baselineGeneration + 1,
  });
  return {
    schema: FILTER_TRANSITION_SCHEMA,
    entryMode,
    expectedQuery: query,
    expectedFilteredCount: filteredCount,
    input: {
      focused: true, cleared: true, value: query,
      panelMode: entryMode === 'visible' ? 'list' : 'closed',
    },
    baselineGeneration,
    falsyObservations: [falsy],
    settled,
    generationDelta: 1,
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
      filterTransitions: [
        syntheticFilterTransition({
          profile, entryMode: 'visible', query: 'Same Seed Sentinel', filteredCount: 2,
          baselineGeneration: 5, priorQuery: '', priorFilteredCount: 1500,
        }),
        syntheticFilterTransition({
          profile, entryMode: 'hidden', query: 'Compendium Filter Beacon', filteredCount: 1,
          baselineGeneration: 9, priorQuery: 'Same Seed Sentinel', priorFilteredCount: 2,
        }),
        syntheticFilterTransition({
          profile, entryMode: 'reopen', query: '', filteredCount: 1500,
          baselineGeneration: 10, priorQuery: 'Compendium Filter Beacon', priorFilteredCount: 1,
        }),
      ],
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
    policy: {
      attemptCount: 1, automaticRetries: 0, commandTimeoutMs: 2000,
      targetTimeoutMs: 2000, heartbeatTimeoutMs: 2000, transportTimeoutMs: 5000,
    },
    source: { begin: source, end: { ...source } },
    inputs: Object.fromEntries(REPORT_INPUT_KEYS.map((key) => [key, sha256(`selftest-${key}`)])),
    browser: {
      executable: '/selftest/chrome', product: 'Chrome/Selftest', revision: 'selftest',
      user_agent: 'selftest', js_version: 'selftest', protocol_version: '1.3',
    },
    budget: { status: budget.status }, expectedOutcomes: [...EXPECTED_OUTCOMES],
    outcomes, findings: [], profiles, partialFailure: null, blockedOutcomes: [],
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

export async function runCompendiumMemSelftest() {
  const rawSnapshotExpression = compendiumRawSnapshotExpression();
  const parsesRawSnapshotExpression = (source) => {
    try { new Function(`"use strict"; return (${source});`); return true; }
    catch { return false; }
  };
  assert(parsesRawSnapshotExpression(rawSnapshotExpression)
    && validCompendiumRawSnapshotExpression(rawSnapshotExpression),
  'the exact collector-owned raw snapshot expression does not parse or lacks its outcome shape');
  const finalClosure = '}}})()';
  const finalClosureAt = rawSnapshotExpression.length - finalClosure.length;
  assert(rawSnapshotExpression.slice(finalClosureAt) === finalClosure,
    'the raw snapshot expression no longer owns the sealed IIFE/object closure');
  const historicalShortTail = `${rawSnapshotExpression.slice(0, finalClosureAt)}}})()`;
  assert(!parsesRawSnapshotExpression(historicalShortTail)
    && !validCompendiumRawSnapshotExpression(historicalShortTail),
  'the historical one-IIFE-body-brace-short snapshot expression parsed');
  for (let offset = 0; offset < 3; offset++) {
    const braceAt = finalClosureAt + offset;
    const missingBrace = rawSnapshotExpression.slice(0, braceAt)
      + rawSnapshotExpression.slice(braceAt + 1);
    assert(!parsesRawSnapshotExpression(missingBrace)
      && !validCompendiumRawSnapshotExpression(missingBrace),
    `raw snapshot expression accepted missing final brace ${offset + 1}`);
  }
  const extraClose = `${rawSnapshotExpression})`;
  assert(!parsesRawSnapshotExpression(extraClose)
    && !validCompendiumRawSnapshotExpression(extraClose),
  'raw snapshot expression accepted an extra final parenthesis');
  for (const token of COMPENDIUM_RAW_SNAPSHOT_REQUIRED_TOKENS) {
    const replacement = token.startsWith('return ')
      ? token.replace('diagnostics', 'diagnosticz') : `${token.slice(0, -1)}Missing:`;
    const missingShape = rawSnapshotExpression.replace(token, replacement);
    assert(parsesRawSnapshotExpression(missingShape)
      && !validCompendiumRawSnapshotExpression(missingShape),
    `raw snapshot expression accepted missing outcome-shape token ${token}`);
  }
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

  const runCandidateWaitScenario = async (plans, {
    phaseWindowMs = 3000, label = 'list thumb settlement', answerabilityExpected = null,
    acceptValue = null,
  } = {}) => {
    let phaseClock = 1000;
    let issuedAt = phaseClock;
    let attempt = -1;
    const calls = [];
    const ledger = [];
    const sleeps = [];
    const stagesStarted = [];
    const stagesCompleted = [];
    const observedValues = [];
    const now = (role) => {
      if (role === 'issued') {
        attempt += 1;
        issuedAt = phaseClock;
        return issuedAt;
      }
      if (role === 'Runtime.evaluate' || role === 'Browser.getVersion') {
        const plan = plans[attempt];
        const side = role === 'Runtime.evaluate' ? plan.target : plan.heartbeat;
        const completedAt = issuedAt + side.deltaMs;
        phaseClock = Math.max(phaseClock, completedAt);
        return completedAt;
      }
      return phaseClock;
    };
    const send = async (method, params, sessionId, options) => {
      calls.push({ method, params, sessionId, options, attempt });
      const plan = plans[attempt];
      const side = method === 'Runtime.evaluate' ? plan.target : plan.heartbeat;
      if (side.reject) throw new Error(side.error);
      if (method === 'Runtime.evaluate') {
        return side.exception
          ? { exceptionDetails: { text: side.exception } }
          : { result: { value: side.value } };
      }
      return { product: side.product ?? 'Chrome/Selftest' };
    };
    let value = null;
    let failure = null;
    const observations = createCandidateCollectorObservations({
      send, profile: 'phone', now,
      pause: async (ms) => { sleeps.push(ms); phaseClock += ms; },
      onStageStarted: (stage) => stagesStarted.push(stage),
      onStageCompleted: (stage) => stagesCompleted.push(stage),
      onCommand: (command) => ledger.push(command),
    });
    try {
      value = answerabilityExpected === null
        ? await observations.waitValue(
          'selftest-session', label, 'selftest-expression', {
            timeoutMs: phaseWindowMs,
            ...(acceptValue ? {
              acceptValue,
              onObservation: (observation) => observedValues.push(clone(observation)),
            } : {}),
          },
        )
        : await observations.answerability('selftest-session', answerabilityExpected);
    } catch (error) { failure = error; }
    return {
      value, failure, calls, ledger, sleeps, stagesStarted, stagesCompleted, observedValues,
    };
  };
  const readyPlan = {
    target: { deltaMs: 10, value: { ready: true } },
    heartbeat: { deltaMs: 15, product: 'Chrome/Selftest' },
  };
  const candidateReady = await runCandidateWaitScenario([readyPlan]);
  assert(candidateReady.failure === null && candidateReady.value.ready === true
    && candidateReady.calls.length === 2 && candidateReady.ledger.length === 1
    && JSON.stringify(candidateReady.stagesStarted) === JSON.stringify(['list thumb settlement'])
    && JSON.stringify(candidateReady.stagesCompleted) === JSON.stringify(['list thumb settlement'])
    && validCandidateCommandEvidence(candidateReady.ledger[0])
    && candidateReady.calls.every((call) => call.options.timeoutMs === COMMAND_TIMEOUT_MS)
    && candidateReady.calls.find((call) => call.method === 'Runtime.evaluate')?.sessionId
      === 'selftest-session'
    && candidateReady.calls.find((call) => call.method === 'Browser.getVersion')?.sessionId
      === undefined,
  'the call-site-used candidate wait did not arm one 2s target/root-heartbeat observation');
  const candidateAnswerabilityReady = await runCandidateWaitScenario([{
    target: { deltaMs: 10, value: 'phone-first' },
    heartbeat: { deltaMs: 15, product: 'Chrome/Selftest' },
  }], { phaseWindowMs: COMMAND_TIMEOUT_MS, answerabilityExpected: 'phone-first' });
  assert(candidateAnswerabilityReady.failure === null
    && candidateAnswerabilityReady.value.target.ok === true
    && candidateAnswerabilityReady.value.target.value === 'phone-first'
    && candidateAnswerabilityReady.value.heartbeat.ok === true
    && JSON.stringify(candidateAnswerabilityReady.stagesCompleted)
      === JSON.stringify(['answerability phone-first']),
  'the production answerability owner did not retain its paired target/root-heartbeat evidence');
  const oneMillisecondDrift = clone(candidateReady.ledger[0]);
  oneMillisecondDrift.timeoutMs = 1;
  oneMillisecondDrift.commandDeadlineMs = oneMillisecondDrift.issuedAtMs + 1;
  for (const settlement of [oneMillisecondDrift.target, oneMillisecondDrift.heartbeat]) {
    settlement.completedAtMs = oneMillisecondDrift.issuedAtMs + 0.5;
    settlement.durationMs = 0.5;
    settlement.timely = true;
  }
  assert(!validCandidateCommandEvidence(oneMillisecondDrift),
    'candidate command evidence accepted a fabricated 1ms timeout with ample phase time');
  const candidateFalsyThenReady = await runCandidateWaitScenario([
    { ...readyPlan, target: { deltaMs: 10, value: null } }, readyPlan,
  ]);
  assert(candidateFalsyThenReady.failure === null
    && candidateFalsyThenReady.calls.filter((call) => call.method === 'Runtime.evaluate').length === 2
    && candidateFalsyThenReady.calls.filter((call) => call.method === 'Browser.getVersion').length === 2
    && candidateFalsyThenReady.ledger.length === 2 && candidateFalsyThenReady.sleeps.length === 1,
  'the candidate wait did not repoll only after one completed on-time falsy observation');
  const structuredPending = {
    ready: false, query: 'old', filteredCount: 2, sourceCount: 1500, generation: 7,
  };
  const structuredReady = {
    ready: true, query: 'new', filteredCount: 1, sourceCount: 1500, generation: 8,
  };
  const candidateStructuredThenReady = await runCandidateWaitScenario([
    { ...readyPlan, target: { deltaMs: 10, value: structuredPending } },
    { ...readyPlan, target: { deltaMs: 10, value: structuredReady } },
  ], { acceptValue: (observation) => observation?.ready === true });
  assert(candidateStructuredThenReady.failure === null
    && candidateStructuredThenReady.value.ready === true
    && JSON.stringify(candidateStructuredThenReady.observedValues)
      === JSON.stringify([structuredPending, structuredReady])
    && candidateStructuredThenReady.ledger.length === 2
    && candidateStructuredThenReady.sleeps.length === 1,
  'the production candidate wait lost a structured falsy transition observation');
  const runFilterDriverScenario = async (entryMode, query, expectedCount, {
    wrongFocus = false, wrongExactValue = false, generationDelta = 1,
    invalidPending = false, missingReopen = false,
  } = {}) => {
    const actions = [];
    const transitions = [];
    const baselineGeneration = 40;
    const name = query || '<clear>';
    const panelMode = entryMode === 'visible' ? 'list' : 'closed';
    const waitValue = async (_sessionId, label, expression, options = {}) => {
      actions.push(`wait:${label}`);
      if (label === `filter ${name} input focus`) {
        return { focused: !wrongFocus, value: 'prior query', panelMode };
      }
      if (label === `filter ${name} input cleared`) {
        return { focused: true, cleared: true, value: '', panelMode };
      }
      if (label === `filter ${name} exact input`) {
        assert(expression.includes(JSON.stringify(query)),
          'filter exact-input proof did not bind the requested query');
        return {
          focused: true, cleared: true,
          value: wrongExactValue ? `prior query${query}` : query,
          panelMode, generation: baselineGeneration,
        };
      }
      if (label === `filter ${name}`) {
        assert(typeof options.acceptValue === 'function'
          && typeof options.onObservation === 'function',
        'filter transition did not use the structured candidate wait hooks');
        const pending = syntheticFilterObservation({
          profile: 'phone', ready: false, query: 'prior query',
          filteredCount: 2, generation: baselineGeneration,
        });
        if (invalidPending) delete pending.art.totals;
        options.onObservation(pending, { selftest: 'pending' });
        assert(options.acceptValue(pending) === false,
          'non-ready filter observation was accepted');
        const settled = syntheticFilterObservation({
          profile: 'phone', ready: true, query, filteredCount: expectedCount,
          generation: baselineGeneration + generationDelta,
        });
        options.onObservation(settled, { selftest: 'settled' });
        assert(options.acceptValue(settled) === true,
          'ready filter observation was rejected');
        return settled;
      }
      throw new Error(`unexpected filter-driver wait label ${label}`);
    };
    let failure = null;
    let result = null;
    try {
      result = await driveCandidateFilterTransition({
        sessionId: 'selftest-session', entryMode, query, expectedCount, platform: 'darwin',
        click: async (_sessionId, selector, label) => {
          actions.push(`click:${selector}:${label}`);
          if (missingReopen && label === 'ordinary Compendium reopen') {
            throw new Error('selftest ordinary Compendium opener unavailable');
          }
        },
        key: async (_sessionId, keyName, _code, modifier = 0, labelPrefix = '') => {
          actions.push(`key:${labelPrefix}:${keyName}:${modifier}`);
        },
        sendStage: async (label, method, params) => {
          actions.push(`send:${label}:${method}:${params.text}`);
        },
        evaluate: async (_sessionId, _expression, label) => {
          actions.push(`evaluate:${label}`);
          return { focused: true, panelMode: 'list' };
        },
        waitValue,
        onTransitionStarted: (transition) => {
          actions.push('transition:start');
          transitions.push(transition);
        },
      });
    } catch (error) { failure = error; }
    return { actions, failure, result, transitions };
  };
  const nonemptyFilterDriver = await runFilterDriverScenario(
    'hidden', 'Compendium Filter Beacon', 1,
  );
  assert(nonemptyFilterDriver.failure === null
    && validFilterTransitionWitness(nonemptyFilterDriver.result)
    && nonemptyFilterDriver.result.falsyObservations.length === 1
    && validFilterTransitionObservation(nonemptyFilterDriver.result.falsyObservations[0])
    && JSON.stringify(nonemptyFilterDriver.actions) === JSON.stringify([
      'click:#searchbox:search Compendium Filter Beacon',
      'wait:filter Compendium Filter Beacon input focus',
      'key:filter Compendium Filter Beacon select-all:a:4',
      'key:filter Compendium Filter Beacon delete:Backspace:0',
      'wait:filter Compendium Filter Beacon input cleared',
      'send:insert filter Compendium Filter Beacon:Input.insertText:Compendium Filter Beacon',
      'wait:filter Compendium Filter Beacon exact input',
      'transition:start', 'key:filter Compendium Filter Beacon submit:Enter:0',
      'wait:filter Compendium Filter Beacon',
    ]),
  'the real native-filter driver skipped focus/delete/exact-value proof or lost its falsy witness');
  const emptyFilterTelemetry = clone(nonemptyFilterDriver.result.falsyObservations[0]);
  emptyFilterTelemetry.art = { live: {}, totals: {} };
  assert(!validFilterTransitionObservation(emptyFilterTelemetry),
    'empty art live/totals objects passed as diagnostic filter telemetry');
  const visibleFilterDriver = await runFilterDriverScenario(
    'visible', 'Same Seed Sentinel', 2,
  );
  assert(visibleFilterDriver.failure === null
    && validFilterTransitionWitness(visibleFilterDriver.result)
    && visibleFilterDriver.result.entryMode === 'visible'
    && visibleFilterDriver.result.input.panelMode === 'list'
    && visibleFilterDriver.actions[0] === 'evaluate:focus visible filter Same Seed Sentinel'
    && !visibleFilterDriver.actions.some((action) => action.startsWith('click:#searchbox'))
    && visibleFilterDriver.actions.includes('key:filter Same Seed Sentinel submit:Enter:0'),
  'the real filter driver did not exercise the already-visible main branch with native keys');
  const clearFilterDriver = await runFilterDriverScenario('reopen', '', 1500);
  assert(clearFilterDriver.failure === null
    && validFilterTransitionWitness(clearFilterDriver.result)
    && clearFilterDriver.actions.includes('key:filter <clear> delete:Backspace:0')
    && !clearFilterDriver.actions.some((action) => action.startsWith('send:insert filter'))
    && !clearFilterDriver.actions.some((action) => action.includes(':Enter:'))
    && clearFilterDriver.actions.includes(
      'click:#dockcodex, #railcodex:ordinary Compendium reopen',
    ),
  'the real clear-filter driver did not use the post-close ordinary Compendium reopen');
  const inertEmptyEnterDriver = await runFilterDriverScenario('hidden', '', 1500);
  assert(inertEmptyEnterDriver.failure?.message.includes('dependencies are invalid')
    && inertEmptyEnterDriver.actions.length === 0,
  'the driver accepted the correct-product inert hidden empty-Enter path as a clear transition');
  const missingClearOpener = await runFilterDriverScenario(
    'reopen', '', 1500, { missingReopen: true },
  );
  assert(missingClearOpener.failure?.message.includes('opener unavailable')
    && missingClearOpener.transitions.length === 1
    && missingClearOpener.transitions[0].settled === null
    && !missingClearOpener.actions.includes('wait:filter <clear>'),
  'a missing ordinary Compendium opener was hidden by empty Enter or a filter retry');
  const unfocusedFilterDriver = await runFilterDriverScenario(
    'hidden', 'Compendium Filter Beacon', 1, { wrongFocus: true },
  );
  assert(unfocusedFilterDriver.failure?.message.includes('focus was not proven')
    && !unfocusedFilterDriver.actions.some((action) => action.startsWith('key:')),
  'the native-filter driver continued after a false focus proof');
  const concatenatedFilterDriver = await runFilterDriverScenario(
    'hidden', 'Compendium Filter Beacon', 1, { wrongExactValue: true },
  );
  assert(concatenatedFilterDriver.failure?.message.includes('exact input value/generation')
    && !concatenatedFilterDriver.actions.some((action) => action.includes(':Enter:')),
  'a concatenated nonempty→nonempty search reached Enter without an exact-value proof');
  const invalidFilterObservation = await runFilterDriverScenario(
    'hidden', 'Compendium Filter Beacon', 1, { invalidPending: true },
  );
  assert(invalidFilterObservation.failure?.message.includes('observation shape was invalid')
    && invalidFilterObservation.transitions[0]?.falsyObservations.length === 0,
  'a filter transition recorded a falsy observation without art live/totals');
  const candidateTargetTimeout = await runCandidateWaitScenario([{
    target: {
      deltaMs: COMMAND_TIMEOUT_MS, reject: true,
      error: `${CANDIDATE_BROWSER_LABEL}: timed out waiting for Runtime.evaluate`,
    },
    heartbeat: { deltaMs: 15, product: 'Chrome/Selftest' },
  }]);
  assert(candidateTargetTimeout.failure?.classification === 'product-unanswerable'
    && candidateTargetTimeout.failure.message.includes('phone list thumb settlement')
    && candidateTargetTimeout.calls.length === 2 && candidateTargetTimeout.ledger.length === 1
    && candidateTargetTimeout.sleeps.length === 0
    && validCandidateCommandEvidence(candidateTargetTimeout.failure.command, {
      requireProductTimeout: true,
    }),
  'a target-only timeout with timely root heartbeat was retried, lost its label, or labeled instrument');
  const candidateAnswerabilityTimeout = await runCandidateWaitScenario([{
    target: {
      deltaMs: COMMAND_TIMEOUT_MS, reject: true,
      error: `${CANDIDATE_BROWSER_LABEL}: timed out waiting for Runtime.evaluate`,
    },
    heartbeat: { deltaMs: 15, product: 'Chrome/Selftest' },
  }], { phaseWindowMs: COMMAND_TIMEOUT_MS, answerabilityExpected: 'phone-first' });
  assert(candidateAnswerabilityTimeout.failure?.classification === 'product-unanswerable'
    && candidateAnswerabilityTimeout.failure.message.includes('answerability phone-first')
    && candidateAnswerabilityTimeout.calls.length === 2
    && candidateAnswerabilityTimeout.sleeps.length === 0
    && candidateAnswerabilityTimeout.stagesCompleted.length === 0,
  'answerability target starvation was caught-and-continued into a later instrument stage');
  const candidateUnprefixedTimeout = await runCandidateWaitScenario([{
    target: {
      deltaMs: COMMAND_TIMEOUT_MS, reject: true,
      error: 'timed out waiting for Runtime.evaluate',
    },
    heartbeat: { deltaMs: 15, product: 'Chrome/Selftest' },
  }]);
  assert(candidateUnprefixedTimeout.failure?.classification === 'instrument',
    'an unbranded/unprefixed timeout string fabricated product starvation');
  const candidateBothTimeout = await runCandidateWaitScenario([{
    target: {
      deltaMs: COMMAND_TIMEOUT_MS, reject: true,
      error: `${CANDIDATE_BROWSER_LABEL}: timed out waiting for Runtime.evaluate`,
    },
    heartbeat: {
      deltaMs: COMMAND_TIMEOUT_MS, reject: true,
      error: `${CANDIDATE_BROWSER_LABEL}: timed out waiting for Browser.getVersion`,
    },
  }]);
  assert(candidateBothTimeout.failure?.classification === 'instrument'
    && candidateBothTimeout.calls.length === 2 && candidateBothTimeout.ledger.length === 1
    && candidateBothTimeout.sleeps.length === 0,
  'a failed/late root heartbeat was not retained as terminal instrument evidence');
  const candidateExactBoundary = await runCandidateWaitScenario([{
    target: { deltaMs: COMMAND_TIMEOUT_MS, value: { ready: true } },
    heartbeat: { deltaMs: 15, product: 'Chrome/Selftest' },
  }]);
  assert(candidateExactBoundary.failure?.classification === 'product-unanswerable'
    && candidateExactBoundary.calls.length === 2 && candidateExactBoundary.sleeps.length === 0,
  'an exact-deadline truthy target observation was accepted or retried');
  const candidateClipped = await runCandidateWaitScenario([{
    target: { deltaMs: 1199, value: { ready: true } },
    heartbeat: { deltaMs: 15, product: 'Chrome/Selftest' },
  }], { phaseWindowMs: 1200 });
  assert(candidateClipped.failure === null
    && candidateClipped.calls.every((call) => call.options.timeoutMs === 1200),
  'candidate target/heartbeat commands were not clipped to the positive remaining phase time');
  const candidateEarlyFakeTimeout = await runCandidateWaitScenario([{
    target: { deltaMs: 10, reject: true, error: 'timed out waiting for Runtime.evaluate' },
    heartbeat: { deltaMs: 15, product: 'Chrome/Selftest' },
  }]);
  assert(candidateEarlyFakeTimeout.failure?.classification === 'instrument',
    'an early protocol rejection merely spelling “timeout” fabricated product starvation');
  const candidatePageException = await runCandidateWaitScenario([{
    target: { deltaMs: 10, exception: 'selftest candidate page exception' },
    heartbeat: { deltaMs: 15, product: 'Chrome/Selftest' },
  }]);
  assert(candidatePageException.failure?.classification === 'instrument'
    && candidatePageException.failure.command?.target?.resultState === 'page-exception'
    && candidatePageException.ledger.length === 1,
  'candidate page exception was not retained as a terminal failure command');
  let plainCalls = 0;
  let plainFailure = null;
  const plainLedger = [];
  const plainStagesStarted = [];
  const plainStagesCompleted = [];
  const plainObservations = createCandidateCollectorObservations({
    send: async () => {
      plainCalls += 1;
      throw new Error(`${CANDIDATE_BROWSER_LABEL}: timed out waiting for Runtime.evaluate`);
    },
    profile: 'phone', now: (role) => role === 'issued' ? 10 : 20,
    pause: async () => {}, onStageStarted: (stage) => plainStagesStarted.push(stage),
    onStageCompleted: (stage) => plainStagesCompleted.push(stage),
    onCommand: (command) => plainLedger.push(command),
  });
  try {
    await plainObservations.evaluate(
      'selftest-session', 'selftest-expression', 'main initial product/DOM snapshot',
    );
  } catch (error) { plainFailure = error; }
  assert(plainCalls === 1
    && JSON.stringify(plainStagesStarted) === JSON.stringify(['main initial product/DOM snapshot'])
    && plainStagesCompleted.length === 0 && plainLedger.length === 1
    && plainFailure?.message.includes('phone main initial product/DOM snapshot')
    && plainFailure.message.includes('5000ms transport cap')
    && plainFailure.compendiumCommand?.schema === PLAIN_EVALUATE_COMMAND_SCHEMA,
  'the real plain-evaluate wrapper retried or lost profile/label/transport context');
  let pageException = null;
  const pageExceptionLedger = [];
  const pageExceptionObservations = createCandidateCollectorObservations({
    send: async () => ({ exceptionDetails: { text: 'selftest page exception' } }),
    profile: 'phone', now: (role) => role === 'issued' ? 10 : 11,
    pause: async () => {}, onStageStarted: () => {}, onStageCompleted: () => {},
    onCommand: (command) => pageExceptionLedger.push(command),
  });
  try {
    await pageExceptionObservations.evaluate(
      'selftest-session', 'selftest-expression', 'page exception stage',
    );
  } catch (error) { pageException = error; }
  assert(pageException?.message === 'phone page exception stage: page evaluation threw (selftest page exception)'
    && pageException.compendiumCommand?.status === 'page-exception'
    && pageExceptionLedger.length === 1,
  'page exception diagnosis was conflated with a target/transport timeout');
  const rawStagesStarted = [];
  const rawStagesCompleted = [];
  const rawCommands = [];
  const rawStageObservations = createCandidateCollectorObservations({
    send: async (method) => {
      if (method === 'Runtime.evaluate') return { result: { value: { snapshot: true } } };
      throw new Error(`${CANDIDATE_BROWSER_LABEL}: timed out waiting for ${method}`);
    },
    profile: 'phone', now: (role) => role === 'issued' ? 10 : 11,
    pause: async () => {},
    onStageStarted: (stage) => rawStagesStarted.push(stage),
    onStageCompleted: (stage) => rawStagesCompleted.push(stage),
    onCommand: (command) => rawCommands.push(command),
  });
  await rawStageObservations.evaluate(
    'selftest-session', 'selftest-expression', 'main initial product/DOM snapshot',
  );
  let rawHeapFailure = null;
  try {
    await rawStageObservations.sendStage(
      'main initial heap usage', 'Runtime.getHeapUsage', {}, 'selftest-session',
    );
  } catch (error) { rawHeapFailure = error; }
  assert(rawHeapFailure?.message.includes(
    'phone main initial heap usage: Runtime.getHeapUsage failed under the 5000ms transport cap',
  )
    && JSON.stringify(rawStagesStarted) === JSON.stringify([
      'main initial product/DOM snapshot', 'main initial heap usage',
    ])
    && JSON.stringify(rawStagesCompleted) === JSON.stringify([
      'main initial product/DOM snapshot',
    ])
    && rawHeapFailure.compendiumCommand?.schema === RAW_CDP_COMMAND_SCHEMA
    && rawHeapFailure.compendiumCommand?.method === 'Runtime.getHeapUsage'
    && rawCommands.length === 1,
  'post-snapshot raw heap timeout lost its exact method/failing stage or completed too early');
  let garbageCollectionContinued = false;
  const garbageCollectionCalls = [];
  let garbageCollectionFailure = null;
  try {
    await collectCandidateSnapshot({
      sessionId: 'selftest-session', label: 'main initial',
      rawSnapshotExpression: 'selftest-expression',
      evaluate: async () => { garbageCollectionContinued = true; },
      sendStage: async (label, method) => {
        garbageCollectionCalls.push({ label, method });
        throw rawHeapFailure;
      },
    });
  } catch (error) { garbageCollectionFailure = error; }
  assert(garbageCollectionFailure === rawHeapFailure && garbageCollectionContinued === false
    && JSON.stringify(garbageCollectionCalls) === JSON.stringify([{
      label: 'main initial garbage collection', method: 'HeapProfiler.collectGarbage',
    }]),
  'failed mandatory garbage collection was swallowed or snapshot collection continued');

  let observerNow = 100;
  class FakeCanvas {
    constructor(width = 132, height = 132) {
      this.width = width; this.height = height; this.calls = []; this.serial = 0;
    }
  }
  Object.defineProperty(FakeCanvas.prototype, 'toDataURL', {
    configurable: true, enumerable: false, writable: true,
    value: function (...args) {
      if (!(this instanceof FakeCanvas)) throw new TypeError('illegal fake canvas receiver');
      this.calls.push(args); this.serial += 1;
      return `data:image/png;base64,selftest-${this.serial}-${args.join('-')}-payload`;
    },
  });
  class FakeTextEncoder {
    encode(value) { return new Uint8Array(String(value).length); }
  }
  const originalCanvasDescriptor = Object.getOwnPropertyDescriptor(
    FakeCanvas.prototype, 'toDataURL',
  );
  const fakeObserverGlobal = {};
  const fakeObserver = installBrokenBaselineThumbObserver(
    fakeObserverGlobal, FakeCanvas, FakeTextEncoder, { now: () => observerNow },
    BROKEN_BASELINE_THUMB_OBSERVER_SCHEMA, BROKEN_BASELINE_THUMB_CACHE_CAP,
  );
  const installedCanvasDescriptor = Object.getOwnPropertyDescriptor(
    FakeCanvas.prototype, 'toDataURL',
  );
  const fakeCanvas = new FakeCanvas();
  const forwarded = fakeCanvas.toDataURL('image/png', 0.8);
  assert(forwarded === 'data:image/png;base64,selftest-1-image/png-0.8-payload'
    && JSON.stringify(fakeCanvas.calls) === JSON.stringify([['image/png', 0.8]])
    && installedCanvasDescriptor.configurable === originalCanvasDescriptor.configurable
    && installedCanvasDescriptor.enumerable === originalCanvasDescriptor.enumerable
    && installedCanvasDescriptor.writable === originalCanvasDescriptor.writable
    && fakeObserver.descriptorPreserved === true
    && fakeObserver.totalExact132Completions === 1,
  'the exact pre-document thumb observer changed receiver/args/return/descriptor semantics');
  fakeObserver.preOwnerExact132Completions = fakeObserver.totalExact132Completions;
  fakeObserver.phase = 'initial-list';
  for (let index = 0; index < 601; index++) {
    observerNow += 1;
    fakeCanvas.toDataURL('image/png', index);
  }
  const beforeWrongSize = fakeObserver.totalExact132Completions;
  new FakeCanvas(131, 132).toDataURL('image/png');
  let wrongReceiverThrew = false;
  try { Reflect.apply(installedCanvasDescriptor.value, {}, ['image/png']); }
  catch { wrongReceiverThrew = true; }
  assert(fakeObserver.initialListCompletions === 601
    && fakeObserver.initialListCacheEncodedByteLengths.length === 600
    && fakeObserver.totalExact132Completions === beforeWrongSize
    && fakeObserver.observerErrors === 0 && wrongReceiverThrew,
  'thumb observer did not isolate exact-132 successes or retain the final cache-cap completions');
  const stableThumbObservation = {
    preOwnerExact132Completions: 8,
    initialListCompletions: 1500,
    cacheEntries: BROKEN_BASELINE_THUMB_CACHE_CAP,
    cacheEncodedBytes: 6_000_000,
    totalExact132Completions: 1508,
    observerErrors: 0,
    descriptorPreserved: true,
    quietMs: 1000,
  };
  assert(validBrokenBaselineThumbObservation(stableThumbObservation),
    'an exact stable thumb completion observation was rejected');
  for (const mutation of [
    { initialListCompletions: 1501 },
    { cacheEntries: BROKEN_BASELINE_THUMB_CACHE_CAP - 1 },
    { cacheEncodedBytes: 0 },
    { totalExact132Completions: 1509 },
    { observerErrors: 1 },
    { descriptorPreserved: false },
    { quietMs: 999 },
  ]) {
    assert(!validBrokenBaselineThumbObservation({ ...stableThumbObservation, ...mutation }),
      'an extra/missing/unstable thumb completion observation passed the sealed contract');
  }
  const baselineFaultRaw = {
    mountedRows: 1500, imageCount: 1500,
    naturalWidths: Array(1500).fill(440), naturalHeights: Array(1500).fill(440),
    sourceInstanceCount: 1500, dataImageCount: 1500,
    distinctSources: BROKEN_BASELINE_PORTRAIT_CACHE_CAPS.desktop + 1,
    sourceInstanceEncodedBytes: 1_500_000,
    referencedPixels: 1500 * 440 * 440,
  };
  const baselineFaultObservation = (profile, raw = baselineFaultRaw) => ({
    profile, list: raw,
    eagerResource: 'http://127.0.0.1/assets/speciesart-broken.js',
    speciesChunk: 'speciesart-broken.js',
  });
  for (const profile of ['phone', 'desktop']) {
    const greenRaw = {
      ...baselineFaultRaw,
      /* Many distinct genome keys may legitimately paint identical PNGs.
         One more distinct full portrait than the exact LRU cap still proves
         the DOM exposure without pretending all 1,500 URLs are unique. */
      distinctSources: BROKEN_BASELINE_PORTRAIT_CACHE_CAPS[profile] + 1,
    };
    const observed = brokenBaselineFaults(baselineFaultObservation(profile, greenRaw));
    assert(JSON.stringify([...observed].sort())
      === JSON.stringify([...BROKEN_BASELINE_EXPECTED_FAULTS].sort()),
    `${profile} truthful broken-baseline observation missed a sealed fault`);
    const exactCap = brokenBaselineFaults(baselineFaultObservation(profile, {
      ...greenRaw, distinctSources: BROKEN_BASELINE_PORTRAIT_CACHE_CAPS[profile],
    }));
    assert(!exactCap.includes('full-portrait-dom-exposure'),
      `${profile} exact-cap distinct resources falsely proved full DOM exposure`);
  }
  const missingSource = brokenBaselineFaults(baselineFaultObservation('phone', {
    ...baselineFaultRaw, distinctSources: BROKEN_BASELINE_PORTRAIT_CACHE_CAPS.phone + 1,
    sourceInstanceCount: 1499, dataImageCount: 1499,
  }));
  assert(!missingSource.includes('full-portrait-dom-exposure'),
    'one empty/non-data image source still proved 1,500 full portrait DOM references');
  const shortBaseline = brokenBaselineFaults(baselineFaultObservation('phone', {
    ...baselineFaultRaw, mountedRows: 1499, imageCount: 1499,
  }));
  assert(!shortBaseline.includes('unwindowed-1500-rows')
    && !shortBaseline.includes('list-source-440'),
  'a 1,499-row broken baseline proved exact 1,500-row faults');
  const thumbSizedBaseline = brokenBaselineFaults(baselineFaultObservation('phone', {
    ...baselineFaultRaw, naturalWidths: [132, ...Array(1499).fill(440)],
  }));
  assert(!thumbSizedBaseline.includes('list-source-440')
    && !thumbSizedBaseline.includes('full-portrait-dom-exposure'),
    'a 132px list source passed the broken 440px source control');
  for (const raw of [
    { ...baselineFaultRaw, sourceInstanceEncodedBytes: 0 },
    { ...baselineFaultRaw, referencedPixels: 1500 * 440 * 440 - 1 },
  ]) {
    assert(!brokenBaselineFaults(baselineFaultObservation('desktop', raw))
      .includes('full-portrait-dom-exposure'),
    'missing instance bytes/pixel area still proved full portrait DOM exposure');
  }
  for (const profile of ['phone', 'desktop']) {
    const portraitCacheCap = BROKEN_BASELINE_PORTRAIT_CACHE_CAPS[profile];
    const cacheRaw = {
      ...baselineFaultRaw,
      thumbRenderCompletions: 1500,
      modeledThumbCacheEntries: BROKEN_BASELINE_THUMB_CACHE_CAP,
      thumbCacheEncodedBytes: 6_000_000,
      thumbObserverPreOwnerExact132Completions: 8,
      thumbObserverTotalExact132Completions: 1508,
      thumbObserverErrors: 0,
      thumbObserverDescriptorPreserved: true,
      thumbObserverStableQuietMs: 1000,
      modeledPortraitCacheEntries: portraitCacheCap,
      modeledPortraitCacheEncodedBytes: 3_000_000,
    };
    const warmCacheRaw = [0, 1, 2, 3].map((index) => ({
      renderStartThumbCacheEntries: BROKEN_BASELINE_THUMB_CACHE_CAP,
      renderStartThumbCacheEncodedBytes: 6_000_000 + index * 100,
    }));
    const cacheMetrics = brokenBaselineCacheMetrics(profile, cacheRaw, warmCacheRaw);
    assert(cacheMetrics?.liveCacheEntries === 600
      && cacheMetrics.liveCacheEntries !== cacheMetrics.livePortraitCacheEntries
      && cacheMetrics.livePortraitCacheEntries === portraitCacheCap
      && cacheMetrics.liveDecodedPixels === 600 * 132 * 132
      && cacheMetrics.liveDecodedBytes === 600 * 132 * 132 * 4
      && cacheMetrics.liveEncodedBytes === 6_000_300
      && cacheMetrics.warmDecodedBytesRange === 0
      && cacheMetrics.warmEncodedBytesRange === 200
      && cacheMetrics.queuedJobsPeak === 0 && cacheMetrics.activeJobsPeak === 0
      && cacheMetrics.liveLeases === 0 && cacheMetrics.liveSubscribers === 0,
    `${profile} broken-baseline thumb/portrait cache carriers were conflated`);
    for (const mutation of [
      { thumbRenderCompletions: 1499 },
      { modeledThumbCacheEntries: portraitCacheCap },
      { thumbCacheEncodedBytes: 0 },
      { modeledPortraitCacheEntries: BROKEN_BASELINE_THUMB_CACHE_CAP },
      { modeledPortraitCacheEncodedBytes: 0 },
    ]) {
      assert(brokenBaselineCacheMetrics(
        profile, { ...cacheRaw, ...mutation }, warmCacheRaw,
      ) === null,
        `${profile} incomplete or cross-wired private-cache evidence produced budget metrics`);
    }
    for (const mutation of [
      { renderStartThumbCacheEntries: BROKEN_BASELINE_THUMB_CACHE_CAP - 1 },
      { renderStartThumbCacheEncodedBytes: 0 },
    ]) {
      const brokenWarm = warmCacheRaw.map((point, index) =>
        index === 2 ? { ...point, ...mutation } : point);
      assert(brokenBaselineCacheMetrics(profile, cacheRaw, brokenWarm) === null,
        `${profile} invalid render-start warm cache evidence produced budget metrics`);
    }
  }
  const partialBaseline = brokenBaselineFailureEvidence([
    { profile: 'phone', evidence: { sourceInstanceCount: 1500 } },
    { profile: 'desktop', evidence: { sourceInstanceCount: 1500 } },
  ]);
  assert(partialBaseline.evidenceStatus === 'partial-diagnostic-not-budget-samples'
    && Object.keys(partialBaseline.profiles).sort().join(',') === 'desktop,phone'
    && partialBaseline.profiles.phone.evidence.sourceInstanceCount === 1500,
  'completed raw baseline profiles were discarded or mislabeled on instrument failure');
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
    ['double filter generation', (m) => {
      const transition = m.phases.filterTransitions[1];
      transition.settled.generation = transition.baselineGeneration + 2;
      transition.generationDelta = 2;
    }, 'generation-guard'],
    ['filter input proof drift', (m) => {
      m.phases.filterTransitions[1].input.value = 'Same Seed SentinelCompendium Filter Beacon';
    }, 'generation-guard'],
    ['filter falsy diagnostics missing art totals', (m) => {
      delete m.phases.filterTransitions[1].falsyObservations[0].art.totals;
    }, 'generation-guard'],
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
  const partialReview = report.reviewPacket.filter((item) => item.profile === 'phone'
    && ['list', 'focus-pinned'].includes(item.state));
  const preBrowserPartial = {
    ...clone(report), status: 'instrument-fail', browser: null, outcomes: [],
    findings: ['instrument: pre-browser selftest failure'], profiles: {}, reviewPacket: [],
    partialFailure: {
      schema: PARTIAL_FAILURE_SCHEMA, classification: 'instrument', profile: null,
      lastCompletedStage: null, failingStage: 'preflight', command: null,
    },
    blockedOutcomes: [...EXPECTED_OUTCOMES],
  };
  assert(verifyTerminalReport(preBrowserPartial, 'selftest-current').ok,
    'true pre-browser/profile-null instrument evidence was forced to invent browser provenance');
  const malformedPreBrowser = clone(preBrowserPartial);
  malformedPreBrowser.browser = { ...clone(report.browser), executable: '' };
  assert(!verifyTerminalReport(malformedPreBrowser, 'selftest-current').ok,
    'pre-browser instrument evidence accepted malformed non-null browser provenance');
  const productPartial = {
    ...clone(report),
    status: 'product-unanswerable',
    outcomes: [],
    findings: [`product: ${candidateTargetTimeout.failure.message}`],
    profiles: {
      phone: {
        schema: PARTIAL_PROFILE_SCHEMA,
        profile: 'phone',
        viewport: { ...phoneViewport },
        evidenceStatus: 'partial-non-certifying',
        lastCompletedStage: 'Compendium open',
        failingStage: 'list thumb settlement',
        completedStages: ['review list', 'review focus-pinned', 'Compendium open'],
        commandLedger: [clone(candidateTargetTimeout.failure.command)],
        filterTransitions: [],
        reviewPacket: clone(partialReview),
      },
    },
    reviewPacket: clone(partialReview),
    partialFailure: {
      schema: PARTIAL_FAILURE_SCHEMA,
      classification: 'product-unanswerable',
      profile: 'phone',
      lastCompletedStage: 'Compendium open',
      failingStage: 'list thumb settlement',
      command: clone(candidateTargetTimeout.failure.command),
    },
    blockedOutcomes: [...EXPECTED_OUTCOMES],
  };
  const partialArtifact = () => true;
  const productPartialCheck = verifyTerminalReport(productPartial, 'selftest-current', {
    verifyArtifact: partialArtifact,
  });
  assert(productPartialCheck.ok,
    `healthy-heartbeat product-unanswerable partial report was rejected: ${productPartialCheck.errors.join('; ')}`);
  const filterTimeoutPartial = clone(productPartial);
  const filterTimeoutCommand = clone(candidateBothTimeout.failure.command);
  filterTimeoutCommand.label = 'filter Compendium Filter Beacon';
  const pendingBeacon = clone(phone.phases.filterTransitions[1]);
  pendingBeacon.settled = null;
  pendingBeacon.generationDelta = null;
  filterTimeoutPartial.status = 'instrument-fail';
  filterTimeoutPartial.findings = [
    'instrument: phone filter Compendium Filter Beacon: root heartbeat failed',
  ];
  filterTimeoutPartial.partialFailure.classification = 'instrument';
  filterTimeoutPartial.partialFailure.lastCompletedStage
    = 'filter Compendium Filter Beacon submit key Enter up';
  filterTimeoutPartial.partialFailure.failingStage = filterTimeoutCommand.label;
  filterTimeoutPartial.partialFailure.command = clone(filterTimeoutCommand);
  filterTimeoutPartial.profiles.phone.lastCompletedStage
    = 'filter Compendium Filter Beacon submit key Enter up';
  filterTimeoutPartial.profiles.phone.failingStage = filterTimeoutCommand.label;
  filterTimeoutPartial.profiles.phone.completedStages.push(
    'filter Same Seed Sentinel', 'filter Compendium Filter Beacon exact input',
    'filter Compendium Filter Beacon submit key Enter down',
    'filter Compendium Filter Beacon submit key Enter up',
  );
  filterTimeoutPartial.profiles.phone.commandLedger = [clone(filterTimeoutCommand)];
  filterTimeoutPartial.profiles.phone.filterTransitions = [
    clone(phone.phases.filterTransitions[0]), pendingBeacon,
  ];
  assert(verifyTerminalReport(filterTimeoutPartial, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'filter-timeout partial report lost its completed/pending transition witness');
  const beaconBackspacePartial = clone(filterTimeoutPartial);
  const beaconBackspaceCommand = clone(rawHeapFailure.compendiumCommand);
  beaconBackspaceCommand.label = 'filter Compendium Filter Beacon delete key Backspace down';
  beaconBackspaceCommand.method = 'Input.dispatchKeyEvent';
  beaconBackspaceCommand.error = 'selftest Backspace transport failure';
  beaconBackspacePartial.findings = [
    `instrument: phone ${beaconBackspaceCommand.label}: Input.dispatchKeyEvent failed under the `
      + `${beaconBackspaceCommand.timeoutMs}ms transport cap (${beaconBackspaceCommand.error})`,
  ];
  beaconBackspacePartial.partialFailure.lastCompletedStage
    = 'filter Compendium Filter Beacon select-all key a up';
  beaconBackspacePartial.partialFailure.failingStage = beaconBackspaceCommand.label;
  beaconBackspacePartial.partialFailure.command = clone(beaconBackspaceCommand);
  beaconBackspacePartial.profiles.phone.lastCompletedStage
    = 'filter Compendium Filter Beacon select-all key a up';
  beaconBackspacePartial.profiles.phone.failingStage = beaconBackspaceCommand.label;
  beaconBackspacePartial.profiles.phone.completedStages
    = beaconBackspacePartial.profiles.phone.completedStages
      .slice(0, beaconBackspacePartial.profiles.phone.completedStages
        .indexOf('filter Same Seed Sentinel') + 1)
      .concat([
        'filter Compendium Filter Beacon select-all key a down',
        'filter Compendium Filter Beacon select-all key a up',
      ]);
  beaconBackspacePartial.profiles.phone.commandLedger = [clone(beaconBackspaceCommand)];
  beaconBackspacePartial.profiles.phone.filterTransitions = [
    clone(phone.phases.filterTransitions[0]),
  ];
  assert(verifyTerminalReport(beaconBackspacePartial, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'Beacon Backspace failure with its exact prior transition prefix was rejected');
  const beaconBackspaceDroppedPrefix = clone(beaconBackspacePartial);
  beaconBackspaceDroppedPrefix.profiles.phone.completedStages
    = beaconBackspaceDroppedPrefix.profiles.phone.completedStages
      .filter((stage) => stage !== 'filter Same Seed Sentinel');
  beaconBackspaceDroppedPrefix.profiles.phone.filterTransitions = [];
  assert(!verifyTerminalReport(beaconBackspaceDroppedPrefix, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'a Beacon Backspace failure dropped the prior Same Seed stage/witness/ledger prefix');
  const droppedLateFilterWitness = clone(filterTimeoutPartial);
  droppedLateFilterWitness.profiles.phone.filterTransitions = [];
  assert(!verifyTerminalReport(droppedLateFilterWitness, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'a late filter timeout dropped its completed and pending transition prefix');
  const droppedPriorFilterStageAndWitness = clone(filterTimeoutPartial);
  droppedPriorFilterStageAndWitness.profiles.phone.completedStages
    = droppedPriorFilterStageAndWitness.profiles.phone.completedStages
      .filter((stage) => stage !== 'filter Same Seed Sentinel');
  droppedPriorFilterStageAndWitness.profiles.phone.filterTransitions = [];
  assert(!verifyTerminalReport(droppedPriorFilterStageAndWitness, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'a Beacon timeout dropped the prior terminal stage together with all filter witnesses');
  const droppedPendingFilterWitness = clone(filterTimeoutPartial);
  droppedPendingFilterWitness.profiles.phone.filterTransitions.pop();
  assert(!verifyTerminalReport(droppedPendingFilterWitness, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'a post-baseline filter timeout dropped only its pending transition witness');
  const droppedPendingInputProof = clone(filterTimeoutPartial);
  droppedPendingInputProof.profiles.phone.completedStages
    = droppedPendingInputProof.profiles.phone.completedStages
      .filter((stage) => stage !== 'filter Compendium Filter Beacon exact input');
  assert(!verifyTerminalReport(droppedPendingInputProof, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'a pending filter witness lost its exact-input baseline stage');
  const injectedEarlyFilterWitness = clone(productPartial);
  const injectedPending = clone(phone.phases.filterTransitions[0]);
  injectedPending.settled = null;
  injectedPending.generationDelta = null;
  injectedEarlyFilterWitness.profiles.phone.filterTransitions = [injectedPending];
  assert(!verifyTerminalReport(injectedEarlyFilterWitness, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'an early pre-filter failure injected a future pending transition witness');
  const completedThenLaterFailure = clone(filterTimeoutPartial);
  completedThenLaterFailure.findings = ['instrument: post-filter selftest failure'];
  completedThenLaterFailure.partialFailure.lastCompletedStage = 'filter Same Seed Sentinel';
  completedThenLaterFailure.partialFailure.failingStage = 'post-filter selftest failure';
  completedThenLaterFailure.partialFailure.command = null;
  completedThenLaterFailure.profiles.phone.lastCompletedStage = 'filter Same Seed Sentinel';
  completedThenLaterFailure.profiles.phone.failingStage = 'post-filter selftest failure';
  completedThenLaterFailure.profiles.phone.completedStages
    = completedThenLaterFailure.profiles.phone.completedStages
      .slice(0, completedThenLaterFailure.profiles.phone.completedStages
        .indexOf('filter Same Seed Sentinel') + 1);
  completedThenLaterFailure.profiles.phone.commandLedger = [];
  completedThenLaterFailure.profiles.phone.filterTransitions = [
    clone(phone.phases.filterTransitions[0]),
  ];
  assert(verifyTerminalReport(completedThenLaterFailure, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'a completed filter witness plus later instrument failure was rejected');
  const downgradedCompletedFilter = clone(completedThenLaterFailure);
  downgradedCompletedFilter.profiles.phone.filterTransitions[0].settled = null;
  downgradedCompletedFilter.profiles.phone.filterTransitions[0].generationDelta = null;
  assert(!verifyTerminalReport(downgradedCompletedFilter, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'a completed terminal filter stage was downgraded to a pending/null witness');
  const partialFilterMissingTotals = clone(filterTimeoutPartial);
  delete partialFilterMissingTotals.profiles.phone
    .filterTransitions[1].falsyObservations[0].art.totals;
  assert(!verifyTerminalReport(partialFilterMissingTotals, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'partial filter witness accepted a falsy observation missing art totals');
  const partialCompletedDoubleFill = clone(filterTimeoutPartial);
  const partialCompletedTransition = partialCompletedDoubleFill.profiles.phone.filterTransitions[0];
  partialCompletedTransition.settled.generation
    = partialCompletedTransition.baselineGeneration + 2;
  partialCompletedTransition.generationDelta = 2;
  assert(!verifyTerminalReport(partialCompletedDoubleFill, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'a completed +2 filter generation was laundered by a later instrument partial');
  const rawHeapPartial = clone(productPartial);
  rawHeapPartial.status = 'instrument-fail';
  rawHeapPartial.findings = [`instrument: ${rawHeapFailure.message}`];
  rawHeapPartial.partialFailure.classification = 'instrument';
  rawHeapPartial.partialFailure.lastCompletedStage = 'main initial product/DOM snapshot';
  rawHeapPartial.partialFailure.failingStage = 'main initial heap usage';
  rawHeapPartial.partialFailure.command = clone(rawHeapFailure.compendiumCommand);
  rawHeapPartial.profiles.phone.lastCompletedStage = 'main initial product/DOM snapshot';
  rawHeapPartial.profiles.phone.failingStage = 'main initial heap usage';
  rawHeapPartial.profiles.phone.completedStages = ['main initial product/DOM snapshot'];
  rawHeapPartial.profiles.phone.commandLedger = [clone(rawHeapFailure.compendiumCommand)];
  rawHeapPartial.profiles.phone.reviewPacket = [];
  rawHeapPartial.reviewPacket = [];
  assert(verifyTerminalReport(rawHeapPartial, 'selftest-current').ok,
    'post-snapshot raw heap failure did not retain exact completed/failing/method evidence');
  const rawHeapWrongMethod = clone(rawHeapPartial);
  rawHeapWrongMethod.partialFailure.command.method = 'Memory.getDOMCounters';
  rawHeapWrongMethod.profiles.phone.commandLedger[0].method = 'Memory.getDOMCounters';
  assert(!verifyTerminalReport(rawHeapWrongMethod, 'selftest-current').ok,
    'raw-CDP failure method drifted independently from its diagnosis');
  const rawHeapWrongStage = clone(rawHeapPartial);
  rawHeapWrongStage.partialFailure.failingStage = 'main initial product/DOM snapshot';
  rawHeapWrongStage.partialFailure.command.label = 'main initial product/DOM snapshot';
  rawHeapWrongStage.profiles.phone.failingStage = 'main initial product/DOM snapshot';
  rawHeapWrongStage.profiles.phone.commandLedger[0].label
    = 'main initial product/DOM snapshot';
  assert(!verifyTerminalReport(rawHeapWrongStage, 'selftest-current').ok,
    'raw-CDP failure stage drifted independently from its diagnosis');
  const desktopPartialReport = clone(productPartial);
  const desktopPartialMeasurement = desktopPartialReport.profiles.phone;
  desktopPartialMeasurement.profile = 'desktop';
  desktopPartialMeasurement.viewport = { ...desktopViewport };
  desktopPartialMeasurement.completedStages = ['Compendium open'];
  desktopPartialMeasurement.reviewPacket = [];
  desktopPartialMeasurement.commandLedger[0].profile = 'desktop';
  desktopPartialReport.partialFailure.profile = 'desktop';
  desktopPartialReport.partialFailure.command.profile = 'desktop';
  desktopPartialReport.profiles = {
    phone: clone(report.profiles.phone), desktop: desktopPartialMeasurement,
  };
  desktopPartialReport.reviewPacket = [];
  assert(verifyTerminalReport(desktopPartialReport, 'selftest-current').ok,
    'phone-complete plus desktop-partial collection prefix was rejected');
  const wrongProfileOrder = clone(desktopPartialReport);
  wrongProfileOrder.profiles = {
    desktop: wrongProfileOrder.profiles.desktop,
    phone: wrongProfileOrder.profiles.phone,
  };
  assert(!verifyTerminalReport(wrongProfileOrder, 'selftest-current').ok,
    'desktop evidence was accepted before the fixed phone collection prefix');
  const postCollectionPartial = {
    ...clone(report), status: 'instrument-fail', outcomes: [], findings: [
      'instrument: post-profile selftest failure',
    ], reviewPacket: [], partialFailure: {
      schema: PARTIAL_FAILURE_SCHEMA, classification: 'instrument', profile: null,
      lastCompletedStage: null, failingStage: 'sealed outcome evaluation', command: null,
    }, blockedOutcomes: [...EXPECTED_OUTCOMES],
  };
  assert(verifyTerminalReport(postCollectionPartial, 'selftest-current').ok,
    'both-complete profile:null post-collection evidence was rejected');
  const incompletePostCollection = clone(postCollectionPartial);
  delete incompletePostCollection.profiles.desktop;
  assert(!verifyTerminalReport(incompletePostCollection, 'selftest-current').ok,
    'phone-only profile:null post-collection evidence omitted the desktop current prefix');
  const shiftCandidateCommand = (command, deltaMs) => {
    const shifted = clone(command);
    shifted.issuedAtMs += deltaMs;
    shifted.phaseDeadlineMs += deltaMs;
    shifted.commandDeadlineMs += deltaMs;
    for (const settlement of [shifted.target, shifted.heartbeat]) {
      settlement.completedAtMs += deltaMs;
    }
    return shifted;
  };
  const twoCommandPartial = clone(productPartial);
  const shiftedTerminal = shiftCandidateCommand(candidateTargetTimeout.failure.command, 3000);
  twoCommandPartial.partialFailure.command = clone(shiftedTerminal);
  twoCommandPartial.profiles.phone.commandLedger = [
    clone(candidateReady.ledger[0]), clone(shiftedTerminal),
  ];
  assert(verifyTerminalReport(twoCommandPartial, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'serial same-profile/same-browser partial command ledger was rejected');
  const retriedCandidateFailure = clone(twoCommandPartial);
  retriedCandidateFailure.profiles.phone.commandLedger[0]
    = clone(candidateTargetTimeout.failure.command);
  assert(!verifyTerminalReport(retriedCandidateFailure, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'a failed candidate command was followed by another command/retry');
  const healthyClaimedAsFailure = clone(productPartial);
  healthyClaimedAsFailure.status = 'instrument-fail';
  healthyClaimedAsFailure.findings = ['instrument: healthy command claimed as failure'];
  healthyClaimedAsFailure.partialFailure.classification = 'instrument';
  healthyClaimedAsFailure.partialFailure.command = clone(candidateReady.ledger[0]);
  healthyClaimedAsFailure.profiles.phone.commandLedger = [
    clone(candidateReady.ledger[0]),
  ];
  assert(!verifyTerminalReport(healthyClaimedAsFailure, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'a healthy candidate observation was accepted as the reported failure command');
  const earlierWrongProfile = clone(twoCommandPartial);
  earlierWrongProfile.profiles.phone.commandLedger[0].profile = 'desktop';
  assert(!verifyTerminalReport(earlierWrongProfile, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'an earlier partial-ledger command escaped its enclosing profile');
  const earlierWrongProduct = clone(twoCommandPartial);
  earlierWrongProduct.profiles.phone.commandLedger[0].heartbeat.product = 'Chrome/Other';
  assert(!verifyTerminalReport(earlierWrongProduct, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'an earlier fulfilled heartbeat escaped terminal browser provenance');
  const earlierUnownedStage = clone(twoCommandPartial);
  earlierUnownedStage.profiles.phone.commandLedger[0].label = 'unowned earlier stage';
  assert(!verifyTerminalReport(earlierUnownedStage, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'an earlier command escaped completed/failing stage ownership');
  const nonserialLedger = clone(twoCommandPartial);
  const overlappingTerminal = shiftCandidateCommand(candidateTargetTimeout.failure.command, 14);
  nonserialLedger.partialFailure.command = clone(overlappingTerminal);
  nonserialLedger.profiles.phone.commandLedger[1] = clone(overlappingTerminal);
  assert(!verifyTerminalReport(nonserialLedger, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'partial command ledger accepted a command issued before the prior pair settled');
  const nulledProductTimeout = clone(productPartial);
  nulledProductTimeout.status = 'instrument-fail';
  nulledProductTimeout.findings = ['instrument: laundered product timeout'];
  nulledProductTimeout.partialFailure.classification = 'instrument';
  nulledProductTimeout.partialFailure.command = null;
  assert(!verifyTerminalReport(nulledProductTimeout, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'instrument-style null command laundered a terminal product timeout');
  const pageExceptionPartial = clone(productPartial);
  pageExceptionPartial.status = 'instrument-fail';
  pageExceptionPartial.findings = ['instrument: candidate page exception'];
  pageExceptionPartial.partialFailure.classification = 'instrument';
  pageExceptionPartial.partialFailure.command = clone(candidatePageException.failure.command);
  pageExceptionPartial.profiles.phone.commandLedger = [
    clone(candidatePageException.failure.command),
  ];
  assert(verifyTerminalReport(pageExceptionPartial, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'candidate page-exception command was rejected as partial instrument evidence');
  const nulledPageException = clone(pageExceptionPartial);
  nulledPageException.partialFailure.command = null;
  assert(!verifyTerminalReport(nulledPageException, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'null command laundered a terminal candidate page exception');
  const partialClaimedOutcome = clone(productPartial);
  partialClaimedOutcome.outcomes.push(clone(report.outcomes[0]));
  assert(!verifyTerminalReport(partialClaimedOutcome, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'product-unanswerable partial report fabricated a completed outcome');
  const partialMissingBlocked = clone(productPartial);
  partialMissingBlocked.blockedOutcomes.pop();
  assert(!verifyTerminalReport(partialMissingBlocked, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'product-unanswerable report omitted one blocked sealed outcome');
  const partialInstrumentLabel = clone(productPartial);
  partialInstrumentLabel.status = 'instrument-fail';
  partialInstrumentLabel.findings = ['instrument: mislabeled healthy-heartbeat target timeout'];
  partialInstrumentLabel.partialFailure.classification = 'instrument';
  assert(!verifyTerminalReport(partialInstrumentLabel, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'healthy-heartbeat target timeout was accepted as instrument ambiguity');
  const partialLateHeartbeat = clone(productPartial);
  const lateHeartbeat = partialLateHeartbeat.partialFailure.command.heartbeat;
  lateHeartbeat.completedAtMs = partialLateHeartbeat.partialFailure.command.commandDeadlineMs;
  lateHeartbeat.durationMs = lateHeartbeat.completedAtMs
    - partialLateHeartbeat.partialFailure.command.issuedAtMs;
  lateHeartbeat.timely = false;
  partialLateHeartbeat.profiles.phone.commandLedger[0]
    = clone(partialLateHeartbeat.partialFailure.command);
  assert(!verifyTerminalReport(partialLateHeartbeat, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'late heartbeat was accepted as product-unanswerable evidence');
  const partialWrongCommandProfile = clone(productPartial);
  partialWrongCommandProfile.partialFailure.command.profile = 'desktop';
  partialWrongCommandProfile.profiles.phone.commandLedger.at(-1).profile = 'desktop';
  assert(!verifyTerminalReport(partialWrongCommandProfile, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'partial timeout command was not bound to its reported profile');
  const partialWrongCommandLabel = clone(productPartial);
  partialWrongCommandLabel.partialFailure.command.label = 'different candidate stage';
  partialWrongCommandLabel.profiles.phone.commandLedger.at(-1).label = 'different candidate stage';
  assert(!verifyTerminalReport(partialWrongCommandLabel, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'partial timeout command was not bound to its reported failing stage');
  const partialNonterminalCommand = clone(productPartial);
  partialNonterminalCommand.profiles.phone.commandLedger.push(clone(candidateReady.ledger[0]));
  assert(!verifyTerminalReport(partialNonterminalCommand, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'partial failure command was accepted before a later ledger command');
  const partialWrongHeartbeatProduct = clone(productPartial);
  partialWrongHeartbeatProduct.partialFailure.command.heartbeat.product = 'Chrome/Other';
  partialWrongHeartbeatProduct.profiles.phone.commandLedger.at(-1).heartbeat.product = 'Chrome/Other';
  assert(!verifyTerminalReport(partialWrongHeartbeatProduct, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'partial timeout heartbeat was not bound to terminal browser provenance');
  const partialDroppedReview = clone(productPartial);
  partialDroppedReview.reviewPacket.pop();
  partialDroppedReview.profiles.phone.reviewPacket.pop();
  assert(!verifyTerminalReport(partialDroppedReview, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'partial terminal report discarded an already completed review stage/artifact');
  const plainInstrumentPartial = {
    ...clone(report),
    status: 'instrument-fail', outcomes: [],
    findings: [`instrument: ${plainFailure.message}`],
    profiles: {
      phone: {
        schema: PARTIAL_PROFILE_SCHEMA, profile: 'phone', viewport: { ...phoneViewport },
        evidenceStatus: 'partial-non-certifying', lastCompletedStage: null,
        failingStage: 'main initial product/DOM snapshot', completedStages: [],
        commandLedger: [clone(plainFailure.compendiumCommand)], filterTransitions: [],
        reviewPacket: [],
      },
    },
    reviewPacket: [],
    partialFailure: {
      schema: PARTIAL_FAILURE_SCHEMA, classification: 'instrument', profile: 'phone',
      lastCompletedStage: null, failingStage: 'main initial product/DOM snapshot',
      command: clone(plainFailure.compendiumCommand),
    },
    blockedOutcomes: [...EXPECTED_OUTCOMES],
  };
  assert(verifyTerminalReport(plainInstrumentPartial, 'selftest-current').ok,
    'labeled plain-evaluate failure did not retain valid partial stage/command evidence');
  for (const field of ['executable', 'revision']) {
    const missingInstrumentBrowser = clone(plainInstrumentPartial);
    missingInstrumentBrowser.browser[field] = '';
    assert(!verifyTerminalReport(missingInstrumentBrowser, 'selftest-current').ok,
      `profile-owned instrument partial accepted blank browser ${field}`);
  }
  const candidateFailureThenPlain = clone(plainInstrumentPartial);
  const earlierCandidateFailure = clone(candidateTargetTimeout.failure.command);
  earlierCandidateFailure.label = 'main initial product/DOM snapshot';
  const terminalPlainFailure = clone(plainFailure.compendiumCommand);
  terminalPlainFailure.issuedAtMs += 4000;
  terminalPlainFailure.completedAtMs += 4000;
  candidateFailureThenPlain.partialFailure.command = clone(terminalPlainFailure);
  candidateFailureThenPlain.profiles.phone.commandLedger = [
    earlierCandidateFailure, clone(terminalPlainFailure),
  ];
  assert(!verifyTerminalReport(candidateFailureThenPlain, 'selftest-current').ok,
    'a terminal plain failure laundered an earlier healthy-heartbeat target timeout/retry');
  const nonterminalPlainFailure = clone(plainInstrumentPartial);
  const laterCandidateCommand = shiftCandidateCommand(candidateReady.ledger[0], 100);
  laterCandidateCommand.label = 'main initial product/DOM snapshot';
  nonterminalPlainFailure.profiles.phone.commandLedger.push(laterCandidateCommand);
  assert(!verifyTerminalReport(nonterminalPlainFailure, 'selftest-current').ok,
    'a plain-evaluate failure was accepted before a later ledger command');
  for (const field of ['targetTimeoutMs', 'heartbeatTimeoutMs', 'transportTimeoutMs']) {
    const driftedPolicy = clone(report);
    driftedPolicy.policy[field] += 1;
    assert(!verifyTerminalReport(driftedPolicy, 'selftest-current').ok,
      `report accepted drifted ${field}`);
  }
  const blockedPass = clone(report);
  blockedPass.blockedOutcomes = [EXPECTED_OUTCOMES[0]];
  assert(!verifyTerminalReport(blockedPass, 'selftest-current').ok,
    'complete PASS retained a blocked outcome');
  const partialPass = clone(report);
  partialPass.partialFailure = clone(productPartial.partialFailure);
  assert(!verifyTerminalReport(partialPass, 'selftest-current').ok,
    'complete PASS retained partial-failure evidence');
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
      outcomes: [], findings: ['instrument: injected pre-browser failure'], browser: null,
      profiles: {}, reviewPacket: [], blockedOutcomes: [...EXPECTED_OUTCOMES],
      partialFailure: {
        schema: PARTIAL_FAILURE_SCHEMA, classification: 'instrument', profile: null,
        lastCompletedStage: null, failingStage: 'preflight', command: null,
      },
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
  if (process.argv.length === 2) await runCompendiumMemSelftest();
  else {
    console.error('usage: node tools/compendiummem-selftest.mjs');
    process.exitCode = 2;
  }
}
