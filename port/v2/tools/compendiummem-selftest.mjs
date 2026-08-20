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
  BASELINE_CALIBRATION_EVIDENCE_SCHEMA, CANDIDATE_CALIBRATION_EVIDENCE_SCHEMA,
  COMMAND_TIMEOUT_MS,
  COMPENDIUM_RAW_SNAPSHOT_REQUIRED_TOKENS, DIAGNOSTICS_SCHEMA,
  EXPECTED_OUTCOMES, FILTER_TRANSITION_SCHEMA, OUTCOME_IDS,
  PARTIAL_FAILURE_SCHEMA, PARTIAL_PROFILE_SCHEMA,
  PRODUCER_ERROR_ARM_SENTINEL, PRODUCER_ERROR_WITNESS_SCHEMA,
  PLAIN_EVALUATE_COMMAND_SCHEMA, RAW_CDP_COMMAND_SCHEMA,
  REPORT_INPUT_KEYS, REPORT_SCHEMA,
  brokenBaselineCacheMetrics, brokenBaselineFailureEvidence, brokenBaselineFaults,
  brokenBaselineCalibrationEvidence,
  calibrationMetrics, candidateNativeKeyDispatches,
  candidateCalibrationEvidence,
  compendiumCalibrationEvaluatorBudget,
  compendiumMeasurementAuthority, compendiumProducerAuthority,
  compendiumBrowserAuthority, compendiumBrowserAuthorityMatches,
  compendiumBudgetBrowserAuthority, validCompendiumBrowserAuthority,
  compendiumCdpOptions, compendiumProfileEmulationOptions,
  compendiumRawSnapshotExpression, evaluateProfile,
  installBrokenBaselineThumbObserver, installBrokenBaselineInitialListArm,
  sealBrokenBaselineInitialListObservation,
  phaseObservationAccepted,
  remainingCommandTimeoutMs, sha256,
  reduceCalibrationEvidence,
  validBrokenBaselineThumbObservation, validProfileEmulationOptions,
  validCompendiumRawSnapshotExpression, validTransportTimeoutPolicy,
  validFilterInputObservation, validFilterTargetObservation, validFilterTelemetrySnapshot,
  validFilterTransitionObservation, validFilterTransitionWitness,
  producerErrorColdProof, producerErrorContained, producerErrorRecoverable,
  producerErrorStages, validProducerErrorPreArmObservation,
  validProducerErrorWorkObservation, validProducerErrorWitness,
  validateBudgetRecord, validCandidateCommandEvidence, verifyTerminalReport,
} from './compendiummem-contract.mjs';
import {
  buildBrokenBaselineProjection, buildCompendiumFixture,
} from './compendiummem-fixture.mjs';
import {
  candidateLegacyWindowSpeciesArtSource, findCandidateSpeciesArtBuildGraph,
} from './speciesart-build.mjs';
import {
  armCandidateProducerError, candidateArmProducerErrorExpression,
  candidateSpeciesPainterChunkSource,
  compendiumBudgetModeAllowed,
  candidateThumbSettlementExpression,
  candidateProducerErrorPreArmExpression, candidateProducerErrorWorkExpression,
  candidateFilterInputExpression, candidateFilterTelemetryExpression,
  collectCandidateSnapshot, createCandidateCollectorObservations,
  createCandidateCommandRecorder,
  driveCandidateFilterTransition, validCandidateFilterInputExpression,
  validCandidateThumbSettlementExpression,
  validCandidateFilterTelemetryExpression, validCandidateArmProducerErrorExpression,
  validCandidateProducerErrorExpression, verifyCompendiumTerminalReport,
} from './compendiummem.mjs';

function assert(condition, message) { if (!condition) throw new Error(`COMPENDIUMMEM SELFTEST: ${message}`); }
function assertThrows(callback, message) {
  let threw = false;
  try { callback(); } catch { threw = true; }
  assert(threw, message);
}
function clone(value) { return structuredClone(value); }

assert(candidateSpeciesPainterChunkSource(
  'SPECIES_PORTRAIT_SIZE renderSpeciesPortraitCanvas renderSpeciesThumbCanvas',
), 'worker-local species painter semantic markers were not recognized');
assert(!candidateSpeciesPainterChunkSource(
  'cf-v2-species-art-diagnostics/v1 active-measured leaseThumb speciesArtDiagnostics',
), 'historical renderer-side diagnostics chunk still impersonated the lazy painter');
assert(!candidateSpeciesPainterChunkSource(
  'renderSpeciesPortraitCanvas renderSpeciesThumbCanvas',
), 'worker entry without the painter constant impersonated the lazy painter');
assert(!candidateSpeciesPainterChunkSource(
  'SPECIES_PORTRAIT_SIZE renderSpeciesPortraitCanvas',
), 'partial worker painter markers were accepted');
assert(candidateLegacyWindowSpeciesArtSource(
  'fullPortraitRendersForThumb canvas.toDataURL()',
), 'legacy synchronous Window species-art markers were not recognized');
assert(!candidateLegacyWindowSpeciesArtSource(
  'fullPortraitRendersForThumb worker phase evidence',
), 'renderer diagnostics alone impersonated the legacy synchronous species-art facade');
assert(!candidateLegacyWindowSpeciesArtSource(
  'canvas.toDataURL()',
), 'an unrelated canvas encoder impersonated the legacy synchronous species-art facade');

{
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-species-art-graph-'));
  const assets = path.join(root, 'assets');
  fs.mkdirSync(assets);
  const painterPath = path.join(assets, 'speciespainter-selftest.js');
  const workerPath = path.join(assets, 'species-art.worker-selftest.js');
  const mainPath = path.join(assets, 'main-selftest.js');
  const legacyPath = path.join(assets, 'legacy-species-selftest.js');
  const indexPath = path.join(root, 'index.html');
  const painter = 'export const SPECIES_PORTRAIT_SIZE=440;export function renderSpeciesPortraitCanvas(){};export function renderSpeciesThumbCanvas(){};';
  const worker = 'const a="cf-v2-species-art-worker-request/v1",b="cf-v2-species-art-worker-response/v1";OffscreenCanvas;FileReaderSync;postMessage;addEventListener;import("./speciespainter-selftest.js");';
  const main = 'new Worker(new URL("/assets/species-art.worker-selftest.js",import.meta.url),{type:"module",name:"cf-species-art"});';
  try {
    fs.writeFileSync(painterPath, painter);
    fs.writeFileSync(workerPath, worker);
    fs.writeFileSync(mainPath, main);
    fs.writeFileSync(legacyPath,
      'export const counter="fullPortraitRendersForThumb";document.createElement("canvas").toDataURL();');
    fs.writeFileSync(indexPath, '<script type="module" src="/assets/main-selftest.js"></script>');
    const graph = findCandidateSpeciesArtBuildGraph(root);
    assert(graph.painter.relativePath === 'assets/speciespainter-selftest.js'
      && graph.worker.relativePath === 'assets/species-art.worker-selftest.js'
      && graph.owner.relativePath === 'assets/main-selftest.js',
    'exact index->worker->painter build graph was not identified');

    fs.writeFileSync(mainPath, 'console.log("orphan worker")');
    assertThrows(() => findCandidateSpeciesArtBuildGraph(root),
      'an orphan worker/painter pair was accepted without an index-owned Worker edge');
    fs.writeFileSync(mainPath, main);

    fs.writeFileSync(mainPath,
      'new Worker(new URL("/assets/species-art.worker-selftest.js",import.meta.url),{type:"classic",name:"cf-species-art"});');
    assertThrows(() => findCandidateSpeciesArtBuildGraph(root),
      'a non-module species-art Worker edge was accepted');
    fs.writeFileSync(mainPath, `${main}${main}`);
    assertThrows(() => findCandidateSpeciesArtBuildGraph(root),
      'duplicate species-art Worker edges were accepted');
    fs.writeFileSync(mainPath, main);

    fs.writeFileSync(mainPath, `import "./species-art.worker-selftest.js";${main}`);
    assertThrows(() => findCandidateSpeciesArtBuildGraph(root),
      'a Window static import of the species-art worker was accepted');
    fs.writeFileSync(mainPath, `import("./species-art.worker-selftest.js");${main}`);
    assertThrows(() => findCandidateSpeciesArtBuildGraph(root),
      'a Window dynamic import of the species-art worker was accepted');
    fs.writeFileSync(mainPath, main);

    fs.writeFileSync(mainPath, `import "./legacy-species-selftest.js";${main}`);
    assertThrows(() => findCandidateSpeciesArtBuildGraph(root),
      'a renderer-reachable legacy synchronous species-art facade was accepted');
    fs.writeFileSync(mainPath, main);

    fs.writeFileSync(mainPath, `${main}console.log("speciespainter-selftest.js")`);
    assertThrows(() => findCandidateSpeciesArtBuildGraph(root),
      'renderer reference to the worker-local painter was accepted');
    fs.writeFileSync(mainPath, main);

    fs.writeFileSync(indexPath,
      '<link rel="modulepreload" href="/assets/speciespainter-selftest.js"><script type="module" src="/assets/main-selftest.js"></script>');
    assertThrows(() => findCandidateSpeciesArtBuildGraph(root),
      'index modulepreload of the worker-local painter was accepted');
    fs.writeFileSync(indexPath, '<script type="module" src="/assets/main-selftest.js"></script>');

    fs.writeFileSync(indexPath,
      '<link rel="modulepreload" href="/assets/species-art.worker-selftest.js"><script type="module" src="/assets/main-selftest.js"></script>');
    assertThrows(() => findCandidateSpeciesArtBuildGraph(root),
      'index modulepreload of the dedicated species-art worker was accepted');
    fs.writeFileSync(indexPath, '<script type="module" src="/assets/main-selftest.js"></script>');

    fs.writeFileSync(workerPath,
      'import "./speciespainter-selftest.js";const a="cf-v2-species-art-worker-request/v1",b="cf-v2-species-art-worker-response/v1";OffscreenCanvas;FileReaderSync;postMessage;addEventListener;');
    assertThrows(() => findCandidateSpeciesArtBuildGraph(root),
      'static-only worker painter import was accepted');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

{
  const listSource = candidateThumbSettlementExpression('list', 1);
  const planetsideSource = candidateThumbSettlementExpression('planetside');
  assert(validCandidateThumbSettlementExpression(listSource, 'list', 1),
    'exact list thumbnail settlement expression was rejected');
  assert(validCandidateThumbSettlementExpression(planetsideSource, 'planetside'),
    'exact Planetside thumbnail settlement expression was rejected');
  assert(!validCandidateThumbSettlementExpression(
    listSource.replace('img.complete===true', 'true'), 'list', 1,
  ), 'a list settlement expression that omitted decode completion was accepted');
  const run = (source, {
    src = true, complete = true, width = 132, height = 132,
    state = 'ready', queuedJobs = 0, activeJobs = 0,
    mode = 'list', filteredCount = 1, visible = true, imageCount = 1,
  } = {}) => {
    const images = Array.from({ length: imageCount }, () => ({
      getAttribute: () => src ? 'data:image/png;base64,cG5n' : '',
      complete, naturalWidth: width, naturalHeight: height,
    }));
    const diagnostics = {
      panel: { mode, filteredCount },
      surfaces: {
        list: { thumbStates: [state] },
        planetside: { visible, thumbStates: [state] },
      },
      art: { live: { queuedJobs, activeJobs } },
    };
    return new Function('window', 'document', `return ${source}`)(
      { __CF_SLICE__: { api: { compendiumDiagnostics: () => diagnostics } } },
      { querySelectorAll: () => images },
    );
  };
  assert(run(listSource) !== null && run(planetsideSource) !== null,
    'decoded 132px settlement was not accepted for both real surfaces');
  for (const [label, mutation] of [
    ['missing source', { src: false }],
    ['incomplete decode', { complete: false }],
    ['zero width', { width: 0 }],
    ['wrong height', { height: 131 }],
    ['placeholder state', { state: 'placeholder' }],
    ['queued work', { queuedJobs: 1 }],
    ['active work', { activeJobs: 1 }],
    ['image/state count mismatch', { imageCount: 2 }],
  ]) {
    assert(run(listSource, mutation) === null,
      `list thumbnail settlement accepted ${label}`);
  }
  assert(run(listSource, { filteredCount: 2 }) === null,
    'list thumbnail settlement accepted the wrong filtered count');
  assert(run(planetsideSource, { visible: false }) === null,
    'Planetside thumbnail settlement accepted a hidden surface');
}

function activeBudget(fixture) {
  const measurementInputs = Object.fromEntries(
    REPORT_INPUT_KEYS.map((key) => [key, sha256(`selftest-${key}`)]),
  );
  const metrics = {
    mountedRows: 20, heapUsedBytes: 10_100_000, documents: 2, nodes: 400,
    embedderHeapUsedBytes: 1_100_000, backingStorageBytes: 600_000,
    heapAggregateBytes: 11_800_000,
    jsEventListeners: 80, liveCacheEntries: 30, liveDecodedPixels: 600_000,
    liveDecodedBytes: 2_400_000, liveEncodedBytes: 150_000,
    queuedJobsPeak: 20, activeJobsPeak: 1, liveLeases: 20, liveSubscribers: 0,
    livePortraitCacheEntries: 1, livePortraitEncodedBytes: 400_000,
    warmHeapAggregateRangeBytes: 200, warmEncodedBytesRange: 0,
  };
  const measurementAuthority = compendiumMeasurementAuthority(measurementInputs);
  const producerAuthority = compendiumProducerAuthority({
    index: { relativePath: 'index.html', sha256: '1'.repeat(64) },
    owner: { relativePath: 'assets/main-selftest.js', sha256: 'd'.repeat(64) },
    worker: { relativePath: 'assets/species-art.worker-selftest.js', sha256: 'f'.repeat(64) },
    painter: { relativePath: 'assets/speciespainter-selftest.js', sha256: 'e'.repeat(64) },
  });
  assert(producerAuthority, 'synthetic producer authority did not canonicalize');
  const candidateEvidence = (profile, runId) => {
    const tuple = [
      20, 10_100_000, 1_100_000, 600_000, 2, 400, 80,
      30, 600_000, 2_400_000, 150_000, 20, 0, 1, 400_000,
    ];
    const points = Object.fromEntries([
      'first', 'middle', 'last', 'filtered', 'detail', 'detailClosed', 'back',
      'focusPinned', 'closed', 'planetside', 'warmCachePrecondition', 'postCapRestored',
      'resizeBase', 'resizeContracted', 'resizeExpanded', 'resizeRestored',
    ].map((key) => [key, [...tuple]]));
    const warm = [9_900, 9_800, 9_900, 10_000].map((usedOffset) => {
      const value = [...tuple]; value[1] = 10_090_000 + usedOffset; return value;
    });
    return {
      schema: CANDIDATE_CALIBRATION_EVIDENCE_SCHEMA, runId, profile,
      points, warm, jobPeaks: { queuedJobsPeak: 20, activeJobsPeak: 1 },
    };
  };
  const baselineEvidence = (profile, runId) => {
    const point = [1500, 10_100_000, 1_100_000, 600_000, 2, 400, 80];
    const encoded = 500_000;
    return {
      schema: BASELINE_CALIBRATION_EVIDENCE_SCHEMA, runId, profile,
      list: [...point], detail: [...point],
      warm: Array.from({ length: 4 }, () => ({
        point: [...point], renderStartThumbCacheEntries: 600,
        renderStartThumbCacheEncodedBytes: encoded,
      })),
      listWitness: {
        naturalDimensionHistogram: [[440, 440, 1500]],
        distinctSources: 1500, sourceInstanceCount: 1500, dataImageCount: 1500,
        sourceInstanceEncodedBytes: 1_000_000,
        thumbObserver: {
          expectedPreOwnerExact132Completions: 8,
          preOwnerExact132Completions: 8, initialListCompletions: 1500,
          cacheEntries: 600, cacheEncodedBytes: encoded,
          totalExact132Completions: 1508, errors: 0,
          descriptorPreserved: true, stableQuietMs: 1000,
        },
        portraitCache: {
          entries: profile === 'phone' ? 96 : 256, encodedBytes: 400_000,
        },
      },
      eagerImport: {
        observedResource: 'https://selftest.invalid/assets/species-selftest.js',
        speciesChunk: 'assets/species-selftest.js',
      },
    };
  };
  const sample = (
    profile, index, commit = 'a'.repeat(40), observedFaults = null,
    runId = `selftest-${index}`,
  ) => {
    const evidence = observedFaults
      ? baselineEvidence(profile, runId) : candidateEvidence(profile, runId);
    const reduced = reduceCalibrationEvidence(evidence);
    assert(reduced, `synthetic ${profile} calibration evidence did not reduce`);
    return {
    runId, commit,
    workingTreeDigest: 'b'.repeat(64), inputDigest: 'c'.repeat(64),
    measurementAuthoritySha256: measurementAuthority.sha256, sourceChanged: false,
    ...(!observedFaults ? { producerAuthoritySha256: producerAuthority.sha256 } : {}),
    sourceState: 'committed',
    fixtureRowsSha256: fixture.rowsSha256,
    measuredAt: `2026-08-16T00:00:0${index}.000Z`,
    browser: {
      executable: '/selftest/chrome', product: 'Chrome/Selftest', revision: 'selftest',
      userAgent: 'selftest', jsVersion: 'selftest', protocolVersion: '1.3',
    },
    metrics: { ...reduced.metrics }, evidence,
    ...(observedFaults ? { observedFaults: [...observedFaults] } : {}),
  }; };
  const ceiling = {
    rationale: 'Synthetic selftest ceiling above every synthetic measured maximum.',
    mountedRowsMax: 40, heapUsedBytesMax: 20_000_000, documentsMax: 4, nodesMax: 1000,
    embedderHeapUsedBytesMax: 5_000_000, backingStorageBytesMax: 5_000_000,
    heapAggregateBytesMax: 25_000_000,
    jsEventListenersMax: 200, liveCacheEntriesMax: 300, liveDecodedPixelsMax: 5_000_000,
    liveDecodedBytesMax: 20_000_000, liveEncodedBytesMax: 1_000_000,
    queuedJobsPeakMax: 20.5, activeJobsPeakMax: 4, liveLeasesMax: 100,
    liveSubscribersMax: 100, livePortraitCacheEntriesMax: 4,
    livePortraitEncodedBytesMax: 1_000_000,
    warmHeapAggregateRangeBytesMax: 1000, warmEncodedBytesRangeMax: 1000,
  };
  return {
    schema: BUDGET_SCHEMA, status: 'active',
    fixture: {
      schema: fixture.schema, generator: fixture.generator,
      count: fixture.count, rowsSha256: fixture.rowsSha256,
    },
    requirements: { fixtureCount: 1500, listNaturalDimensionMax: 132, commandTimeoutMs: 2000, warmCycles: 4 },
    measurementAuthority, producerAuthority,
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
        phone: [sample('phone', 1, '38447019517147319bd08c598202d097ee866874',
          [...BROKEN_BASELINE_EXPECTED_FAULTS], 'selftest-baseline-1')],
        desktop: [sample('desktop', 1, '38447019517147319bd08c598202d097ee866874',
          [...BROKEN_BASELINE_EXPECTED_FAULTS], 'selftest-baseline-1')],
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
      budgetStatus: 'active-measured', cacheEntries: 256, decodedPixels: 8_000_000,
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

function workerArtDiagnostics({ lazy = false } = {}) {
  return lazy ? {
    schema: 'cf-v2-species-art-worker-diagnostics/v1',
    state: 'idle', importStarts: 0,
    identity: {
      documentToken: 'selftest-lazy-document',
      lastProducerEpoch: 0, lastWorkerInstanceId: 0,
    },
    lastEvent: null,
    worker: {
      live: false, starts: 0, ready: 0, disposals: 0, fatals: 0, protocolErrors: 0,
    },
    phases: {
      importStarts: 0, importCompletes: 0,
      thumbJobStarts: 0, thumbRenderCompletes: 0,
      thumbEncodeStarts: 0, thumbEncodeCompletes: 0,
      portraitJobStarts: 0, portraitRenderCompletes: 0,
      portraitEncodeStarts: 0, portraitEncodeCompletes: 0,
    },
    results: {
      count: 0, maxImportDurationMs: 0,
      maxRenderDurationMs: 0, maxEncodeDurationMs: 0,
    },
    errors: { capability: 0, protocol: 0, import: 0, paint: 0, encode: 0 },
  } : {
    schema: 'cf-v2-species-art-worker-diagnostics/v1',
    state: 'ready', importStarts: 8,
    identity: {
      documentToken: 'selftest-main-document',
      lastProducerEpoch: 8, lastWorkerInstanceId: 8,
    },
    lastEvent: {
      producerEpoch: 8, workerInstanceId: 8, jobId: 87,
      kind: 'thumb132', event: 'result',
    },
    worker: {
      live: false, starts: 8, ready: 8, disposals: 8, fatals: 0, protocolErrors: 0,
    },
    phases: {
      importStarts: 8, importCompletes: 8,
      thumbJobStarts: 86, thumbRenderCompletes: 85,
      thumbEncodeStarts: 85, thumbEncodeCompletes: 85,
      portraitJobStarts: 1, portraitRenderCompletes: 1,
      portraitEncodeStarts: 1, portraitEncodeCompletes: 1,
    },
    results: {
      count: 86, maxImportDurationMs: 8,
      maxRenderDurationMs: 12, maxEncodeDurationMs: 4,
    },
    errors: { capability: 0, protocol: 0, import: 0, paint: 1, encode: 0 },
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
    lazyArt: workerArtDiagnostics({ lazy }),
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

function syntheticFilterTelemetry(profile, generation) {
  const art = artSnapshot({ generation });
  art.deviceClass = profile;
  return {
    generation,
    art: { live: clone(art.live), totals: clone(art.totals) },
  };
}

function syntheticFilterInputObservation({
  ready, value, panelMode, focused = true,
  selectionStart = value.length, selectionEnd = value.length,
}) {
  return { ready, focused, value, selectionStart, selectionEnd, panelMode };
}

function syntheticFilterTargetGroup() {
  return {
    observationCount: 2,
    falsyObservations: [{ ready: false, x: null, y: null }],
    accepted: { ready: true, x: 120, y: 40 },
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
  const panelMode = entryMode === 'visible' ? 'list' : 'closed';
  const focusFalsy = syntheticFilterInputObservation({
    ready: false, focused: false, value: priorQuery, panelMode,
  });
  const focusAccepted = syntheticFilterInputObservation({
    ready: true, value: priorQuery, panelMode,
  });
  const selectionFalsy = syntheticFilterInputObservation({
    ready: false, focused: false, value: priorQuery, panelMode,
    selectionStart: 0, selectionEnd: 0,
  });
  const selectionAccepted = syntheticFilterInputObservation({
    ready: true, value: priorQuery, panelMode,
    selectionStart: 0, selectionEnd: priorQuery.length,
  });
  const clearFalsy = syntheticFilterInputObservation({
    ready: false, focused: false, value: priorQuery, panelMode,
    selectionStart: 0, selectionEnd: priorQuery.length,
  });
  const clearAccepted = syntheticFilterInputObservation({
    ready: true, value: '', panelMode, selectionStart: 0, selectionEnd: 0,
  });
  const exactInputFalsy = syntheticFilterInputObservation({
    ready: false, focused: false, value: query, panelMode,
  });
  const exactInputAccepted = syntheticFilterInputObservation({
    ready: true, value: query, panelMode,
  });
  return {
    schema: FILTER_TRANSITION_SCHEMA,
    entryMode,
    expectedQuery: query,
    expectedFilteredCount: filteredCount,
    entryTarget: entryMode === 'visible' ? null : syntheticFilterTargetGroup(),
    reopenTarget: entryMode === 'reopen' ? syntheticFilterTargetGroup() : null,
    focus: {
      observationCount: 2, falsyObservations: [focusFalsy], accepted: focusAccepted,
    },
    beforeShortcut: syntheticFilterTelemetry(profile, baselineGeneration),
    selection: {
      observationCount: 2, falsyObservations: [selectionFalsy],
      accepted: selectionAccepted,
    },
    cleared: {
      observationCount: 2, falsyObservations: [clearFalsy], accepted: clearAccepted,
    },
    afterClear: syntheticFilterTelemetry(profile, baselineGeneration),
    exactInput: {
      observationCount: 2, falsyObservations: [exactInputFalsy],
      accepted: exactInputAccepted,
    },
    inputTelemetry: syntheticFilterTelemetry(profile, baselineGeneration),
    baselineGeneration,
    observationCount: 2,
    falsyObservations: [falsy],
    settled,
    generationDelta: 1,
  };
}

function syntheticProducerErrorArt({
  cacheEntries, cacheLimit = 96, queuedJobs = 0, activeJobs = 0,
  leases = 24, subscribers = 0,
  leaseAcquires = 24, releases = 0, jobStarts = 20, jobCompletes = 19,
  jobCancels = 0, jobErrors = 1, disposals = 0,
}) {
  return {
    cacheLimit, cachedKeyCount: cacheEntries,
    live: { cacheEntries, queuedJobs, activeJobs, leases, subscribers },
    totals: {
      leaseAcquires, releases, jobStarts, jobCompletes, jobCancels, jobErrors, disposals,
    },
  };
}

function syntheticProducerRows(fixture, { error = false, pending = false } = {}) {
  return fixture.rows.slice(0, 20).map(([logicalId], index) => ({
    logicalId, index, visualKey: `producer-key-${index}`,
    thumbState: index === 0 ? (error ? 'error' : pending ? 'placeholder' : 'ready') : 'ready',
    naturalWidth: index === 0 && (error || pending) ? 0 : 132,
    naturalHeight: index === 0 && (error || pending) ? 0 : 132,
    complete: true,
    cached: index !== 0 || (!error && !pending),
  }));
}

function syntheticProducerWorkObservation(profile, fixture, {
  ready, error = false, pending = false, recovery = false,
} = {}) {
  const rows = syntheticProducerRows(fixture, { error, pending });
  const stateCounts = { placeholder: 0, ready: 0, error: 0, released: 0, other: 0 };
  for (const row of rows) stateCounts[row.thumbState]++;
  const cacheLimit = profile === 'phone' ? 96 : 256;
  const art = recovery
    ? syntheticProducerErrorArt({
      cacheEntries: pending ? 23 : 24, cacheLimit, queuedJobs: pending ? 1 : 0,
      subscribers: pending ? 1 : 0, leaseAcquires: 44, releases: 20,
      jobStarts: pending ? 24 : 25, jobCompletes: pending ? 23 : 24, jobErrors: 1,
    })
    : error
      ? syntheticProducerErrorArt({
        cacheEntries: 23, cacheLimit, leaseAcquires: 24,
        jobStarts: 24, jobCompletes: 23, jobErrors: 1,
      })
      : syntheticProducerErrorArt({
        cacheEntries: 4, cacheLimit, queuedJobs: pending ? 20 : 0,
        subscribers: pending ? 20 : 0, leaseAcquires: 24,
        jobStarts: 4, jobCompletes: 4, jobErrors: 0,
      });
  return {
    ready, panelMode: 'list', sourceCount: 1500, generation: recovery ? 3 : 2,
    mountedRowCount: rows.length,
    mountedDistinctLogicalIds: rows.length,
    mountedDistinctVisualKeys: rows.length,
    stateCounts, rows,
    art,
  };
}

function syntheticProducerErrorWitness(profile, fixture) {
  const preArm = {
    ready: true, panelMode: 'closed', sourceCount: 1500, listImageCount: 0,
    planetsideVisible: true, planetsideImageCount: 4,
    planetsideReadyCount: 4, planetsideDistinctVisualKeys: 4,
    cachedKeys: Array.from({ length: 4 }, (_, index) => `planetside-key-${index}`),
    art: syntheticProducerErrorArt({
      cacheEntries: 4, cacheLimit: profile === 'phone' ? 96 : 256,
      leases: 4, subscribers: 0, leaseAcquires: 4,
      jobStarts: 4, jobCompletes: 4, jobErrors: 0,
    }),
  };
  const publicationFalsy = syntheticProducerWorkObservation(profile, fixture, {
    ready: false, pending: true,
  });
  const publication = syntheticProducerWorkObservation(profile, fixture, {
    ready: true, error: true,
  });
  const recoveryFalsy = syntheticProducerWorkObservation(profile, fixture, {
    ready: false, pending: true, recovery: true,
  });
  const recovery = syntheticProducerWorkObservation(profile, fixture, {
    ready: true, recovery: true,
  });
  return {
    schema: PRODUCER_ERROR_WITNESS_SCHEMA,
    preArm: { observationCount: 1, falsyObservations: [], accepted: preArm },
    armSentinel: PRODUCER_ERROR_ARM_SENTINEL,
    openTarget: syntheticFilterTargetGroup(),
    publication: {
      observationCount: 2, falsyObservations: [publicationFalsy], accepted: publication,
    },
    answerability: {
      target: { ok: true, ms: 10, value: `${profile}-error`, expected: `${profile}-error` },
      heartbeat: { ok: true, ms: 15, product: 'Chrome/Selftest' },
    },
    closeTarget: syntheticFilterTargetGroup(),
    recoveryOpenTarget: syntheticFilterTargetGroup(),
    recovery: {
      observationCount: 2, falsyObservations: [recoveryFalsy], accepted: recovery,
    },
    commands: [],
  };
}

function retimeCandidateEvidence(template, profile, label, issuedAtMs) {
  const command = clone(template);
  const delta = issuedAtMs - command.issuedAtMs;
  command.profile = profile;
  command.label = label;
  command.issuedAtMs += delta;
  command.phaseDeadlineMs += delta;
  command.commandDeadlineMs += delta;
  command.target.completedAtMs += delta;
  command.heartbeat.completedAtMs += delta;
  return command;
}

function syntheticProducerErrorCommands(template, witness, profile, startMs = 1000) {
  const stages = producerErrorStages(profile);
  const labels = [
    [stages.preArm, witness.preArm.observationCount],
    [stages.openTarget, witness.openTarget.observationCount],
    [stages.publication, witness.publication.observationCount],
    [stages.answerability, witness.answerability === null ? 0 : 1],
    [stages.closeTarget, witness.closeTarget.observationCount],
    [stages.recoveryOpenTarget, witness.recoveryOpenTarget.observationCount],
    [stages.recovery, witness.recovery.observationCount],
  ];
  let serial = 0;
  return labels.flatMap(([label, count]) => Array.from({ length: count }, () => {
    const command = retimeCandidateEvidence(
      template, profile, label, startMs + serial * 100,
    );
    serial += 1;
    return command;
  }));
}

function syntheticMeasurement(profile, fixture, candidateCommandTemplate) {
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
  const nativeCacheEntries = profile === 'phone' ? 96 : 256;
  const nativeDecodedPixels = nativeCacheEntries * 132 * 132;
  for (const point of warm) {
    point.diagnostics.art.limits.cacheEntries = nativeCacheEntries;
    point.diagnostics.art.limits.decodedPixels = nativeDecodedPixels;
    point.diagnostics.art.limits.decodedBytes = nativeDecodedPixels * 4;
    point.diagnostics.art.live.cacheEntries = nativeCacheEntries;
    point.diagnostics.art.live.decodedPixels = nativeDecodedPixels;
    point.diagnostics.art.live.decodedBytes = nativeDecodedPixels * 4;
    point.diagnostics.art.keys.cached = Array.from(
      { length: nativeCacheEntries }, (_, index) => `warm-key-${index}`,
    ).sort();
  }
  const warmCachePrecondition = clone(warm[0]);
  const postCapRestored = clone(warm.at(-1));
  const producerErrorWitness = syntheticProducerErrorWitness(profile, fixture);
  producerErrorWitness.commands = syntheticProducerErrorCommands(
    candidateCommandTemplate, producerErrorWitness, profile,
  );
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
      indexPath: 'index.html', indexSha256: '1'.repeat(64),
      ownerPath: 'assets/main-selftest.js', ownerSha256: 'd'.repeat(64),
      path: 'assets/speciespainter-selftest.js', sha256: 'e'.repeat(64),
      workerPath: 'assets/species-art.worker-selftest.js', workerSha256: 'f'.repeat(64),
      ownership: 'dedicated-worker-dynamic-import', matches: [], endMatches: [],
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
      warmCachePrecondition,
      resourceOrder: [
        'warm-precondition', 'warm-1', 'warm-2', 'warm-3', 'warm-4',
        'cap-before', 'cap-after', 'profile-restored', 'post-cap-restored',
      ],
      producerErrorWitness,
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
      capShrink: {
        beforeEntries: 140, afterEntries: 80, phoneLimit: 96,
        afterDecodedBytes: 5_500_000, phoneDecodedBytesLimit: 8_000_000,
        beforeDeviceClass: 'desktop', afterDeviceClass: 'phone', restoredDeviceClass: profile,
        disposalsDelta: 60, warmCyclesSealed: 4,
        warmTerminalJobStarts: 90, beforeJobStarts: 90,
        warmTerminalDisposals: 40, beforeDisposals: 40,
      },
      postCapRestored,
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
  const inputs = Object.fromEntries(
    REPORT_INPUT_KEYS.map((key) => [key, sha256(`selftest-${key}`)]),
  );
  inputs.fixtureRows = budget.fixture.rowsSha256;
  const browser = {
    executable: '/selftest/chrome', product: 'Chrome/Selftest', revision: 'selftest',
    user_agent: 'selftest', js_version: 'selftest', protocol_version: '1.3',
  };
  const browserAuthority = compendiumBudgetBrowserAuthority(budget);
  return {
    schema: REPORT_SCHEMA, status: 'pass', runId,
    startedAt: '2026-08-16T00:00:00.000Z', endedAt: '2026-08-16T00:00:01.000Z',
    durationMs: 1000,
    policy: {
      attemptCount: 1, automaticRetries: 0, commandTimeoutMs: 2000,
      targetTimeoutMs: 2000, heartbeatTimeoutMs: 2000, transportTimeoutMs: 5000,
    },
    source: { begin: source, end: { ...source } },
    inputs, browser,
    budget: {
      status: budget.status, path: 'budgets/compendium-memory-v1.json', sha256: inputs.budget,
      browserAuthority,
      browserAuthorityMatch: browserAuthority === null
        ? null : compendiumBrowserAuthorityMatches(browser, browserAuthority),
      producerAuthority: clone(budget.producerAuthority),
      observedProducerAuthority: clone(budget.producerAuthority),
      producerAuthorityMatch: true,
    },
    expectedOutcomes: [...EXPECTED_OUTCOMES],
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
  const recorderLedger = [];
  let recorderWitness = null;
  const recorderStage = producerErrorStages('phone').preArm;
  const recordCandidateCommand = createCandidateCommandRecorder({
    commandLedger: recorderLedger,
    producerErrorCandidateLabels: new Set([recorderStage]),
    getProducerErrorWitness: () => recorderWitness,
  });
  const beforeWitnessCommand = clone(candidateReady.ledger[0]);
  beforeWitnessCommand.label = recorderStage;
  recordCandidateCommand(beforeWitnessCommand);
  recorderWitness = { commands: [] };
  const retainedProducerCommand = clone(candidateReady.ledger[0]);
  retainedProducerCommand.label = recorderStage;
  recordCandidateCommand(retainedProducerCommand);
  const unrelatedCommand = clone(candidateReady.ledger[0]);
  unrelatedCommand.label = 'unrelated candidate stage';
  recordCandidateCommand(unrelatedCommand);
  assert(recorderLedger.length === 3 && recorderWitness.commands.length === 1
    && recorderWitness.commands[0] === retainedProducerCommand,
  'the real collector command callback did not retain the exact producer subset only while owned');
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
    selectionFault = null, clearFault = null, telemetryFault = null,
    focusFalsyCount = 2, selectionFalsyCount = 3, clearFalsyCount = 4,
    exactInputFalsyCount = 2, priorValueOverride = null,
  } = {}) => {
    const actions = [];
    const transitions = [];
    const cheapExpressions = [];
    const telemetryExpressions = [];
    const keyCalls = [];
    const targetCalls = [];
    const baselineGeneration = 40;
    const name = query || '<clear>';
    const panelMode = entryMode === 'visible' ? 'list' : 'closed';
    const expectedPriorValue = entryMode === 'visible' ? ''
      : entryMode === 'hidden' ? 'Same Seed Sentinel' : 'Compendium Filter Beacon';
    const priorValue = priorValueOverride ?? expectedPriorValue;
    const observe = (observation, options) => {
      options.onObservation?.(observation, { selftest: 'filter-input' });
      return options.acceptValue ? options.acceptValue(observation) : Boolean(observation);
    };
    const waitValue = async (_sessionId, label, expression, options = {}) => {
      actions.push(`wait:${label}`);
      if (label === `filter ${name} input focus`) {
        cheapExpressions.push(expression);
        for (let index = 0; index < focusFalsyCount; index += 1) {
          const pending = syntheticFilterInputObservation({
            ready: false, focused: false, value: priorValue, panelMode,
          });
          assert(observe(pending, options) === false,
            'an unfocused Search observation was accepted');
        }
        const accepted = syntheticFilterInputObservation({
          ready: true, focused: !wrongFocus, value: priorValue, panelMode,
        });
        if (!observe(accepted, options)) {
          throw new Error(`filter ${name}: search input focus was not proven before replacement`);
        }
        return accepted;
      }
      if (label === `filter ${name} before shortcut telemetry`
        || label === `filter ${name} cleared telemetry`
        || label === `filter ${name} exact input telemetry`) {
        telemetryExpressions.push(expression);
        const telemetry = syntheticFilterTelemetry('phone', baselineGeneration);
        if (telemetryFault?.label === label) {
          if (telemetryFault.kind === 'missing') delete telemetry.art.totals;
          if (telemetryFault.kind === 'non-scalar') telemetry.art.live.activeJobs = 'busy';
        }
        assert(options.acceptValue(telemetry) === true,
          'one-shot filter telemetry was not accepted exactly once');
        return telemetry;
      }
      if (label === `filter ${name} full selection`) {
        cheapExpressions.push(expression);
        for (let index = 0; index < selectionFalsyCount; index += 1) {
          const pending = syntheticFilterInputObservation({
            ready: false, focused: false, value: priorValue, panelMode,
            selectionStart: 0, selectionEnd: 0,
          });
          assert(observe(pending, options) === false,
            'a partial select-all observation was accepted');
        }
        const accepted = syntheticFilterInputObservation({
          ready: true, value: priorValue, panelMode,
          selectionStart: 0, selectionEnd: priorValue.length,
        });
        if (selectionFault === 'missing') {
          accepted.selectionStart = null; accepted.selectionEnd = null;
        }
        if (selectionFault === 'partial') accepted.selectionEnd = Math.max(0, priorValue.length - 1);
        if (selectionFault === 'focus-loss') accepted.focused = false;
        if (selectionFault === 'mode-drift') accepted.panelMode = 'detail';
        if (!observe(accepted, options)) {
          throw new Error(`filter ${name}: native select-all did not produce an exact full selection`);
        }
        return accepted;
      }
      if (label === `filter ${name} input cleared`) {
        cheapExpressions.push(expression);
        for (let index = 0; index < clearFalsyCount; index += 1) {
          const pending = syntheticFilterInputObservation({
            ready: false, focused: false, value: priorValue, panelMode,
            selectionStart: 0, selectionEnd: priorValue.length,
          });
          assert(observe(pending, options) === false,
            'a residual-value clear observation was accepted');
        }
        const accepted = syntheticFilterInputObservation({
          ready: true, value: '', panelMode, selectionStart: 0, selectionEnd: 0,
        });
        if (clearFault === 'residual') {
          accepted.value = priorValue; accepted.selectionEnd = priorValue.length;
        }
        if (clearFault === 'focus-loss') accepted.focused = false;
        if (clearFault === 'mode-drift') accepted.panelMode = 'detail';
        if (!observe(accepted, options)) {
          throw new Error(`filter ${name}: selected prior text was not explicitly deleted`);
        }
        return accepted;
      }
      if (label === `filter ${name} exact input`) {
        cheapExpressions.push(expression);
        assert(expression.includes(JSON.stringify(query)),
          'filter exact-input proof did not bind the requested query');
        for (let index = 0; index < exactInputFalsyCount; index += 1) {
          const pending = syntheticFilterInputObservation({
            ready: false, focused: false, value: query, panelMode,
          });
          assert(observe(pending, options) === false,
            'an unfocused exact-input observation was accepted');
        }
        const accepted = syntheticFilterInputObservation({
          ready: true,
          value: wrongExactValue ? `prior query${query}` : query,
          panelMode,
        });
        if (!observe(accepted, options)) {
          throw new Error(`filter ${name}: exact input value/generation was not proven before Enter`);
        }
        return accepted;
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
        click: async (_sessionId, selector, label, { targetWitness = null } = {}) => {
          actions.push(`click:${selector}:${label}`);
          if (missingReopen && label === 'ordinary Compendium reopen') {
            throw new Error('selftest ordinary Compendium opener unavailable');
          }
          targetCalls.push({ selector, label, witnessed: targetWitness !== null });
          assert(targetWitness !== null,
            `filter ${name}: product driver did not attach its ${label} target witness`);
          const falsyTarget = { ready: false, x: null, y: null };
          const acceptedTarget = { ready: true, x: 120, y: 40 };
          assert(validFilterTargetObservation(falsyTarget)
            && validFilterTargetObservation(acceptedTarget),
          `filter ${name}: synthetic target observation shape drifted`);
          targetWitness.observationCount += 2;
          targetWitness.falsyObservations.push(falsyTarget);
          targetWitness.accepted = acceptedTarget;
        },
        key: async (
          _sessionId, keyName, code, modifier = 0, labelPrefix = '', commands = [],
        ) => {
          const dispatches = candidateNativeKeyDispatches(keyName, code, modifier, commands);
          keyCalls.push({ keyName, code, modifier, labelPrefix, commands: [...commands], dispatches });
          actions.push(`key:${labelPrefix}:${keyName}:${modifier}:${commands.join(',')}`);
        },
        sendStage: async (label, method, params) => {
          actions.push(`send:${label}:${method}:${params.text}`);
        },
        evaluate: async (_sessionId, expression, label) => {
          actions.push(`evaluate:${label}`);
          assert(!expression.includes('compendiumDiagnostics'),
            'visible filter focus setup invoked the full diagnostic API');
          return { focused: true, panelMode: 'list' };
        },
        waitValue,
        onTransitionStarted: (transition) => {
          actions.push('transition:start');
          transitions.push(transition);
        },
      });
    } catch (error) { failure = error; }
    return {
      actions, failure, result, transitions, cheapExpressions, telemetryExpressions, keyCalls,
      targetCalls,
    };
  };
  const nonemptyFilterDriver = await runFilterDriverScenario(
    'hidden', 'Compendium Filter Beacon', 1,
  );
  assert(nonemptyFilterDriver.failure === null
    && validFilterTransitionWitness(nonemptyFilterDriver.result)
    && nonemptyFilterDriver.result.falsyObservations.length === 1
    && nonemptyFilterDriver.result.observationCount === 2
    && validFilterTransitionObservation(nonemptyFilterDriver.result.falsyObservations[0])
    && nonemptyFilterDriver.actions[0] === 'transition:start'
    && nonemptyFilterDriver.result.selection.observationCount === 4
    && nonemptyFilterDriver.result.selection.falsyObservations.length === 3
    && nonemptyFilterDriver.result.cleared.observationCount === 5
    && nonemptyFilterDriver.result.cleared.falsyObservations.length === 4
    && nonemptyFilterDriver.result.focus.observationCount === 3
    && nonemptyFilterDriver.result.focus.falsyObservations.length === 2
    && nonemptyFilterDriver.result.exactInput.observationCount === 3
    && nonemptyFilterDriver.result.exactInput.falsyObservations.length === 2
    && nonemptyFilterDriver.result.entryTarget.observationCount === 2
    && nonemptyFilterDriver.result.entryTarget.falsyObservations.length === 1
    && nonemptyFilterDriver.result.entryTarget.accepted.ready === true
    && nonemptyFilterDriver.result.reopenTarget === null
    && nonemptyFilterDriver.targetCalls.length === 1
    && nonemptyFilterDriver.targetCalls[0].witnessed === true
    && nonemptyFilterDriver.cheapExpressions.length === 4
    && nonemptyFilterDriver.cheapExpressions.every((expression) =>
      !expression.includes('compendiumDiagnostics'))
    && nonemptyFilterDriver.telemetryExpressions.length === 3
    && nonemptyFilterDriver.telemetryExpressions.every((expression) =>
      expression.includes('compendiumDiagnostics'))
    && JSON.stringify(nonemptyFilterDriver.keyCalls[0].commands) === '["selectAll"]'
    && JSON.stringify(nonemptyFilterDriver.keyCalls[0].dispatches[0].commands) === '["selectAll"]'
    && !Object.hasOwn(nonemptyFilterDriver.keyCalls[0].dispatches[1], 'commands')
    && nonemptyFilterDriver.actions.includes(
      'send:insert filter Compendium Filter Beacon:Input.insertText:Compendium Filter Beacon',
    )
    && nonemptyFilterDriver.actions.at(-1) === 'wait:filter Compendium Filter Beacon',
  'the real native-filter driver skipped focus/delete/exact-value proof or lost its falsy witness');
  const oldShortcutOnly = candidateNativeKeyDispatches('a', 'KeyA', 4);
  assert(!Object.hasOwn(oldShortcutOnly[0], 'commands')
    && JSON.stringify(oldShortcutOnly) !== JSON.stringify(nonemptyFilterDriver.keyCalls[0].dispatches),
  'the old platform-shortcut-only path was indistinguishable from CDP selectAll');
  assert(validFilterInputObservation(nonemptyFilterDriver.result.selection.accepted)
    && validFilterTelemetrySnapshot(nonemptyFilterDriver.result.beforeShortcut),
  'the real filter-driver witness did not use the sealed cheap/telemetry validators');
  const filterExpressionCases = [
    { phase: 'focus', expectedValue: null },
    { phase: 'selection', expectedValue: 'Same Seed Sentinel' },
    { phase: 'cleared', expectedValue: '' },
    { phase: 'exact-input', expectedValue: 'Compendium Filter Beacon' },
  ].map((options, index) => ({
    options: { ...options, expectedPanelMode: 'closed' },
    source: nonemptyFilterDriver.cheapExpressions[index],
  }));
  assert(filterExpressionCases.every(({ options, source }) =>
    source === candidateFilterInputExpression(options)
      && validCandidateFilterInputExpression(source, options)),
  'the real driver did not consume the parsed, phase-bound cheap expression factory');
  const [focusExpression, selectionExpression, clearExpression, exactExpression]
    = filterExpressionCases;
  const executeCheapExpression = (source, {
    value, selectionStart, selectionEnd, focused = true, panelMode = 'closed',
  }) => {
    const input = { value, selectionStart, selectionEnd };
    const panel = {
      style: { display: panelMode === 'closed' ? 'none' : 'block' },
      getAttribute: (name) => name === 'aria-hidden'
        ? (panelMode === 'closed' ? 'true' : 'false') : null,
      querySelector: (selector) => selector === '[data-sel="codex-scroll"]'
        && panelMode === 'list' ? {} : selector === '[data-sel="detail-portrait"]'
          && panelMode === 'detail' ? {} : null,
    };
    const document = {
      activeElement: focused ? input : null,
      querySelector: (selector) => selector === '#searchbox' ? input
        : selector === '#codexpanel' ? panel : null,
    };
    return new Function('document', `"use strict"; return (${source});`)(document);
  };
  const priorBeacon = 'Same Seed Sentinel';
  assert(executeCheapExpression(focusExpression.source, {
    value: priorBeacon, selectionStart: priorBeacon.length,
    selectionEnd: priorBeacon.length,
  }).ready === true
    && executeCheapExpression(focusExpression.source, {
      value: priorBeacon, selectionStart: priorBeacon.length,
      selectionEnd: priorBeacon.length, focused: false,
    }).ready === false
    && executeCheapExpression(selectionExpression.source, {
      value: priorBeacon, selectionStart: 0, selectionEnd: priorBeacon.length,
    }).ready === true
    && executeCheapExpression(selectionExpression.source, {
      value: priorBeacon, selectionStart: 0, selectionEnd: priorBeacon.length - 1,
    }).ready === false
    && executeCheapExpression(clearExpression.source, {
      value: '', selectionStart: 0, selectionEnd: 0,
    }).ready === true
    && executeCheapExpression(clearExpression.source, {
      value: 'x', selectionStart: 0, selectionEnd: 1,
    }).ready === false
    && executeCheapExpression(exactExpression.source, {
      value: 'Compendium Filter Beacon', selectionStart: 24, selectionEnd: 24,
    }).ready === true
    && executeCheapExpression(exactExpression.source, {
      value: 'Compendium Filter Beaconx', selectionStart: 25, selectionEnd: 25,
    }).ready === false
    && executeCheapExpression(exactExpression.source, {
      value: 'Compendium Filter Beacon', selectionStart: 24, selectionEnd: 24,
      panelMode: 'list',
    }).ready === false,
  'the exact embedded cheap expression did not enforce focus/value/selection/panel semantics');
  const cheapExpressionMutations = [
    focusExpression.source.slice(0, -1),
    focusExpression.source.replace(
      'const e=', 'window.__CF_SLICE__?.api?.compendiumDiagnostics?.();const e=',
    ),
    focusExpression.source.replace('document.activeElement===e', 'true'),
    focusExpression.source.replace('panelMode==="closed"', 'true'),
    selectionExpression.source.replace(
      'selectionStart===0&&selectionEnd===value.length', 'true',
    ),
    clearExpression.source.replace('selectionStart===0&&selectionEnd===0', 'true'),
    exactExpression.source.replace('value==="Compendium Filter Beacon"', 'true'),
  ];
  const cheapMutationOptions = [
    focusExpression.options, focusExpression.options, focusExpression.options,
    focusExpression.options, selectionExpression.options, clearExpression.options,
    exactExpression.options,
  ];
  assert(cheapExpressionMutations.every((source, index) =>
    !validCandidateFilterInputExpression(source, cheapMutationOptions[index])),
  'a broken/full-diagnostic/under-specified cheap input expression passed the production parser');
  const telemetryExpression = candidateFilterTelemetryExpression();
  assert(nonemptyFilterDriver.telemetryExpressions.every((source) =>
    source === telemetryExpression && validCandidateFilterTelemetryExpression(source)),
  'the driver did not consume the exact parsed scalar telemetry projection');
  for (const mutation of [
    telemetryExpression.slice(0, -1),
    telemetryExpression.replace('generation:d.generation', 'generation:0'),
    telemetryExpression.replace('live:a.live', 'live:{}'),
    telemetryExpression.replace('totals:a.totals', 'totals:{}'),
  ]) {
    assert(!validCandidateFilterTelemetryExpression(mutation),
      'a broken or under-specified telemetry expression passed its production parser');
  }
  const telemetryFixture = syntheticFilterTelemetry('phone', 40);
  let telemetryReads = 0;
  const telemetryExecution = new Function(
    'window', `"use strict"; return (${telemetryExpression});`,
  )({ __CF_SLICE__: { api: { compendiumDiagnostics: () => {
    telemetryReads++;
    return { generation: telemetryFixture.generation, art: telemetryFixture.art };
  } } } });
  assert(telemetryReads === 1
    && JSON.stringify(telemetryExecution) === JSON.stringify(telemetryFixture),
  'the exact embedded telemetry expression did not project one scalar diagnostic sample');
  const filterStress = await runFilterDriverScenario(
    'hidden', 'Compendium Filter Beacon', 1,
    { selectionFalsyCount: 25, clearFalsyCount: 31 },
  );
  assert(filterStress.failure === null
    && filterStress.result.selection.falsyObservations.length === 25
    && filterStress.result.cleared.falsyObservations.length === 31
    && filterStress.result.focus.falsyObservations.length === 2
    && filterStress.result.exactInput.falsyObservations.length === 2
    && filterStress.cheapExpressions.length === 4
    && filterStress.telemetryExpressions.length === 3,
  'many falsy input observations grew full-diagnostic work or lost cheap rows');
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
    && visibleFilterDriver.result.exactInput.accepted.panelMode === 'list'
    && visibleFilterDriver.actions[0] === 'transition:start'
    && visibleFilterDriver.actions[1] === 'evaluate:focus visible filter Same Seed Sentinel'
    && visibleFilterDriver.result.entryTarget === null
    && visibleFilterDriver.result.reopenTarget === null
    && visibleFilterDriver.targetCalls.length === 0
    && !visibleFilterDriver.actions.some((action) => action.startsWith('click:#searchbox'))
    && visibleFilterDriver.actions.includes('key:filter Same Seed Sentinel submit:Enter:0:'),
  'the real filter driver did not exercise the already-visible main branch with native keys');
  const clearFilterDriver = await runFilterDriverScenario('reopen', '', 1500);
  assert(clearFilterDriver.failure === null
    && validFilterTransitionWitness(clearFilterDriver.result)
    && clearFilterDriver.actions.includes('key:filter <clear> delete:Backspace:0:')
    && !clearFilterDriver.actions.some((action) => action.startsWith('send:insert filter'))
    && !clearFilterDriver.actions.some((action) => action.includes(':Enter:'))
    && clearFilterDriver.actions.includes(
      'click:#dockcodex, #railcodex:ordinary Compendium reopen',
    )
    && clearFilterDriver.targetCalls.length === 2
    && clearFilterDriver.targetCalls.every((call) => call.witnessed === true)
    && clearFilterDriver.result.entryTarget.observationCount === 2
    && clearFilterDriver.result.reopenTarget.observationCount === 2,
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
  for (const [label, options, expected] of [
    ['missing native selection', { selectionFault: 'missing' }, 'exact full selection'],
    ['partial native selection', { selectionFault: 'partial' }, 'exact full selection'],
    ['selection focus loss', { selectionFault: 'focus-loss' }, 'exact full selection'],
    ['selection panel-mode drift', { selectionFault: 'mode-drift' }, 'exact full selection'],
    ['residual value after Backspace', { clearFault: 'residual' }, 'explicitly deleted'],
    ['clear focus loss', { clearFault: 'focus-loss' }, 'explicitly deleted'],
    ['clear panel-mode drift', { clearFault: 'mode-drift' }, 'explicitly deleted'],
    ['missing scalar telemetry', {
      telemetryFault: {
        label: 'filter Compendium Filter Beacon before shortcut telemetry', kind: 'missing',
      },
    }, 'shape was invalid'],
    ['non-scalar telemetry', {
      telemetryFault: {
        label: 'filter Compendium Filter Beacon cleared telemetry', kind: 'non-scalar',
      },
    }, 'shape was invalid'],
  ]) {
    const scenario = await runFilterDriverScenario(
      'hidden', 'Compendium Filter Beacon', 1, options,
    );
    assert(scenario.failure?.message.includes(expected)
      && (!options.telemetryFault
        || validFilterTransitionWitness(scenario.transitions[0], { allowPending: true })),
      `${label} reached the native filter action`);
  }
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

  const producerErrorMessage = 'compendiummem injected producer error';
  const producerErrorSentinel = 'cf-v2-compendium-producer-error-armed/v1';
  const producerErrorExpression = candidateArmProducerErrorExpression();
  let producerErrorExpressionParsed = false;
  try {
    new Function(`"use strict"; return (${producerErrorExpression});`);
    producerErrorExpressionParsed = true;
  } catch { /* asserted below */ }
  assert(producerErrorExpressionParsed
    && validCandidateArmProducerErrorExpression(producerErrorExpression),
  'the exact collector-owned producer-error arm expression did not parse or validate');
  const producerErrorSentinelClause = `return ${JSON.stringify(producerErrorSentinel)}`;
  assert((producerErrorExpression.match(/evidence\.failNextThumb\(/g) || []).length === 1
    && producerErrorExpression.includes(`failNextThumb(${JSON.stringify(producerErrorMessage)})`)
    && producerErrorExpression.includes(producerErrorSentinelClause),
  'the producer-error arm expression lost its exact hook/message/sentinel contract');
  const historicalBareVoidExpression = producerErrorExpression.replace(
    `\n    ${producerErrorSentinelClause}`, '',
  );
  const wrongProducerErrorMessage = producerErrorExpression.replace(
    producerErrorMessage, 'wrong producer error message',
  );
  const wrongProducerErrorSentinel = producerErrorExpression.replace(
    producerErrorSentinel, 'cf-v2-compendium-producer-error-wrong/v1',
  );
  assert(!validCandidateArmProducerErrorExpression(historicalBareVoidExpression)
    && !validCandidateArmProducerErrorExpression(wrongProducerErrorMessage)
    && !validCandidateArmProducerErrorExpression(wrongProducerErrorSentinel),
  'a no-return, wrong-message, or wrong-sentinel producer-error arm expression validated');
  const producerPreArmExpression = candidateProducerErrorPreArmExpression();
  const producerWorkExpression = candidateProducerErrorWorkExpression();
  assert(validCandidateProducerErrorExpression(producerPreArmExpression, 'pre-arm')
    && validCandidateProducerErrorExpression(producerWorkExpression, 'work'),
  'the exact collector-owned producer-error observation expressions did not parse/validate');
  assert(!validCandidateProducerErrorExpression(
    producerPreArmExpression.replace('planetsideImageCount>0', 'planetsideImageCount>=0'),
    'pre-arm',
  ) && !validCandidateProducerErrorExpression(
    producerWorkExpression.replace(
      "(row.thumbState!=='ready'||(row.complete&&row.naturalWidth===132&&row.naturalHeight===132))",
      'true',
    ),
    'work',
  ) && !validCandidateProducerErrorExpression(producerWorkExpression.slice(0, -1), 'work'),
  'weakened cold-owner/terminal-work or syntactically truncated producer evidence validated');
  const producerStagesInventory = producerErrorStages('phone').sequence;
  assert(producerStagesInventory.every((stage) => !stage.toLowerCase().includes('scroll'))
    && producerStagesInventory.indexOf('producer error publication')
      < producerStagesInventory.indexOf('producer error recovery'),
  'the sealed producer-error control reintroduced scrolling or reversed publication/recovery');

  const runProducerErrorArmScenario = async ({
    expression = null, hookError = null, returnedValue = null,
  } = {}) => {
    const calls = [];
    const hookMessages = [];
    const ledger = [];
    const stagesStarted = [];
    const stagesCompleted = [];
    let clock = 10;
    const window = {
      __CF_SLICE__: { api: { __compendiumEvidence: {
        failNextThumb: (message) => {
          hookMessages.push(message);
          if (hookError !== null) throw new Error(hookError);
        },
      } } },
    };
    const observations = createCandidateCollectorObservations({
      send: async (method, params, sessionId, options) => {
        calls.push({ method, params, sessionId, options });
        try {
          let value = new Function(
            'window', `"use strict"; return (${params.expression});`,
          )(window);
          if (returnedValue !== null) value = returnedValue;
          return value === undefined
            ? { result: { type: 'undefined' } }
            : { result: { type: typeof value, value } };
        } catch (error) {
          return { exceptionDetails: { text: error instanceof Error ? error.message : String(error) } };
        }
      },
      profile: 'phone', now: () => clock++, pause: async () => {},
      onStageStarted: (stage) => stagesStarted.push(stage),
      onStageCompleted: (stage) => stagesCompleted.push(stage),
      onCommand: (command) => ledger.push(command),
    });
    let value = null;
    let failure = null;
    try {
      value = expression === null
        ? await armCandidateProducerError({
          sessionId: 'selftest-session', evaluate: observations.evaluate,
        })
        : await observations.evaluate(
          'selftest-session', expression, 'arm producer error',
        );
    } catch (error) { failure = error; }
    return {
      calls, hookMessages, ledger, stagesStarted, stagesCompleted, value, failure,
    };
  };
  const producerErrorArmed = await runProducerErrorArmScenario();
  assert(producerErrorArmed.failure === null
    && producerErrorArmed.value === producerErrorSentinel
    && JSON.stringify(producerErrorArmed.hookMessages) === JSON.stringify([producerErrorMessage])
    && producerErrorArmed.calls.length === 1
    && producerErrorArmed.calls[0].method === 'Runtime.evaluate'
    && producerErrorArmed.calls[0].params.expression === producerErrorExpression
    && producerErrorArmed.calls[0].options.timeoutMs === CANDIDATE_TRANSPORT_TIMEOUT_MS
    && JSON.stringify(producerErrorArmed.stagesStarted) === JSON.stringify(['arm producer error'])
    && JSON.stringify(producerErrorArmed.stagesCompleted) === JSON.stringify(['arm producer error'])
    && producerErrorArmed.ledger.length === 0,
  'the real producer-error arm helper did not call the exact hook once and return its sentinel once');
  const producerErrorWrongSentinel = await runProducerErrorArmScenario({
    returnedValue: 'cf-v2-compendium-producer-error-wrong/v1',
  });
  assert(producerErrorWrongSentinel.calls.length === 1
    && producerErrorWrongSentinel.hookMessages.length === 1
    && producerErrorWrongSentinel.failure?.message
      === 'candidate producer-error arm sentinel mismatch: cf-v2-compendium-producer-error-wrong/v1',
  'the producer-error arm helper accepted a wrong by-value sentinel or retried it');
  const producerErrorBareVoid = await runProducerErrorArmScenario({
    expression: historicalBareVoidExpression,
  });
  assert(producerErrorBareVoid.calls.length === 1
    && JSON.stringify(producerErrorBareVoid.hookMessages) === JSON.stringify([producerErrorMessage])
    && producerErrorBareVoid.failure?.message
      === 'phone arm producer error: Runtime.evaluate returned no by-value result'
    && producerErrorBareVoid.failure.compendiumCommand?.status === 'page-exception'
    && producerErrorBareVoid.ledger.length === 1
    && producerErrorBareVoid.stagesCompleted.length === 0,
  'the historical bare-void producer-error arm did not fail closed as one no-value command');
  const producerErrorHookThrows = await runProducerErrorArmScenario({
    hookError: 'selftest producer hook threw',
  });
  assert(producerErrorHookThrows.calls.length === 1
    && JSON.stringify(producerErrorHookThrows.hookMessages) === JSON.stringify([producerErrorMessage])
    && producerErrorHookThrows.failure?.message
      === 'phone arm producer error: page evaluation threw (selftest producer hook threw)'
    && producerErrorHookThrows.failure.compendiumCommand?.status === 'page-exception'
    && producerErrorHookThrows.ledger.length === 1
    && producerErrorHookThrows.stagesCompleted.length === 0,
  'a thrown producer-error hook was retried or ceased to be a page exception');

  const rawStagesStarted = [];
  const rawStagesCompleted = [];
  const rawCommands = [];
  const rawStageObservations = createCandidateCollectorObservations({
    send: async (method) => {
      if (method === 'Runtime.evaluate') return { result: { value: true } };
      if (method === 'HeapProfiler.collectGarbage') return {};
      throw new Error(`${CANDIDATE_BROWSER_LABEL}: timed out waiting for ${method}`);
    },
    profile: 'phone', now: (role) => role === 'issued' ? 10 : 11,
    pause: async () => {},
    onStageStarted: (stage) => rawStagesStarted.push(stage),
    onStageCompleted: (stage) => rawStagesCompleted.push(stage),
    onCommand: (command) => rawCommands.push(command),
  });
  let rawHeapFailure = null;
  try {
    await collectCandidateSnapshot({
      sessionId: 'selftest-session', label: 'main initial',
      rawSnapshotExpression: 'selftest-expression',
      evaluate: rawStageObservations.evaluate,
      sendStage: rawStageObservations.sendStage,
    });
  } catch (error) { rawHeapFailure = error; }
  assert(rawHeapFailure?.message.includes(
    'phone main initial heap usage: Runtime.getHeapUsage failed under the 5000ms transport cap',
  )
    && JSON.stringify(rawStagesStarted) === JSON.stringify([
      'main initial animation task', 'main initial garbage collection',
      'main initial heap usage',
    ])
    && JSON.stringify(rawStagesCompleted) === JSON.stringify([
      'main initial animation task', 'main initial garbage collection',
    ])
    && rawHeapFailure.compendiumCommand?.schema === RAW_CDP_COMMAND_SCHEMA
    && rawHeapFailure.compendiumCommand?.method === 'Runtime.getHeapUsage'
    && rawCommands.length === 1,
  'post-GC raw heap timeout lost its exact method/failing stage or completed too early');
  const garbageCollectionSequence = [];
  const garbageCollectionCalls = [];
  let garbageCollectionFailure = null;
  try {
    await collectCandidateSnapshot({
      sessionId: 'selftest-session', label: 'main initial',
      rawSnapshotExpression: 'selftest-expression',
      evaluate: async (_sessionId, _expression, label) => {
        garbageCollectionSequence.push(`evaluate:${label}`);
        return true;
      },
      sendStage: async (label, method) => {
        garbageCollectionSequence.push(`send:${label}`);
        garbageCollectionCalls.push({ label, method });
        throw rawHeapFailure;
      },
    });
  } catch (error) { garbageCollectionFailure = error; }
  assert(garbageCollectionFailure === rawHeapFailure
    && JSON.stringify(garbageCollectionSequence) === JSON.stringify([
      'evaluate:main initial animation task', 'send:main initial garbage collection',
    ])
    && JSON.stringify(garbageCollectionCalls) === JSON.stringify([{
      label: 'main initial garbage collection', method: 'HeapProfiler.collectGarbage',
    }]),
  'snapshot did not service one renderer turn before mandatory GC or continued after GC failed');
  const successfulSnapshotSequence = [];
  const successfulSnapshot = await collectCandidateSnapshot({
    sessionId: 'selftest-session', label: 'ordered snapshot',
    rawSnapshotExpression: 'selftest-expression',
    evaluate: async (_sessionId, _expression, label) => {
      successfulSnapshotSequence.push(`evaluate:${label}`);
      return label.endsWith('product/DOM snapshot')
        ? { diagnostics: { exact: true }, raw: { exact: true } } : true;
    },
    sendStage: async (label, method) => {
      successfulSnapshotSequence.push(`send:${label}:${method}`);
      if (method === 'Runtime.getHeapUsage') return {
        usedSize: 1, totalSize: 2, embedderHeapUsedSize: 3, backingStorageSize: 4,
      };
      if (method === 'Memory.getDOMCounters') return {
        documents: 1, nodes: 2, jsEventListeners: 3,
      };
      return {};
    },
  });
  assert(JSON.stringify(successfulSnapshotSequence) === JSON.stringify([
    'evaluate:ordered snapshot animation task',
    'send:ordered snapshot garbage collection:HeapProfiler.collectGarbage',
    'send:ordered snapshot heap usage:Runtime.getHeapUsage',
    'evaluate:ordered snapshot product/DOM snapshot',
    'send:ordered snapshot DOM counters:Memory.getDOMCounters',
  ]) && successfulSnapshot.heap.backingStorageSize === 4
    && successfulSnapshot.diagnostics.exact === true
    && successfulSnapshot.raw.exact === true,
  'candidate snapshot reordered cleanup, heap, diagnostics, or DOM evidence');

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
  class FakeElement {
    constructor(opener) { this.opener = opener; }
    closest(selector) {
      return this.opener && selector === '#dockcodex,#railcodex' ? this : null;
    }
  }
  const originalCanvasDescriptor = Object.getOwnPropertyDescriptor(
    FakeCanvas.prototype, 'toDataURL',
  );
  const fakeClickListeners = new Set();
  const fakeObserverGlobal = {
    addEventListener(type, listener, capture) {
      assert(type === 'click' && capture === true,
        'initial-list arm registered the wrong event phase');
      fakeClickListeners.add(listener);
    },
    removeEventListener(type, listener, capture) {
      assert(type === 'click' && capture === true,
        'initial-list arm removed the wrong event phase');
      fakeClickListeners.delete(listener);
    },
    dispatchClick(target) {
      for (const listener of [...fakeClickListeners]) listener({ target });
    },
  };
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
  observerNow = 1099;
  assert(installBrokenBaselineInitialListArm(
    fakeObserverGlobal, FakeElement, { now: () => observerNow },
    BROKEN_BASELINE_THUMB_OBSERVER_SCHEMA, '#dockcodex,#railcodex', 2,
  ) === null && fakeObserver.phase === 'pre-owner' && fakeClickListeners.size === 0,
  'initial-list observer armed with one pre-owner completion still missing');
  observerNow = 1100;
  assert(installBrokenBaselineInitialListArm(
    fakeObserverGlobal, FakeElement, { now: () => observerNow },
    BROKEN_BASELINE_THUMB_OBSERVER_SCHEMA, '#dockcodex,#railcodex', 2,
  ) === null && fakeObserver.phase === 'pre-owner' && fakeClickListeners.size === 0,
  'initial-list observer treated a quiet N-1 completion count as drained');
  observerNow += 1;
  fakeCanvas.toDataURL('image/png', 'second-pre-owner');
  observerNow += 999;
  assert(installBrokenBaselineInitialListArm(
    fakeObserverGlobal, FakeElement, { now: () => observerNow },
    BROKEN_BASELINE_THUMB_OBSERVER_SCHEMA, '#dockcodex,#railcodex', 2,
  ) === null && fakeObserver.phase === 'pre-owner' && fakeClickListeners.size === 0,
  'initial-list observer armed before the exact owner count stayed quiet');
  observerNow += 1;
  const fakeInitialListArm = installBrokenBaselineInitialListArm(
    fakeObserverGlobal, FakeElement, { now: () => observerNow },
    BROKEN_BASELINE_THUMB_OBSERVER_SCHEMA, '#dockcodex,#railcodex', 2,
  );
  assert(fakeInitialListArm?.phase === 'awaiting-initial-list-click'
    && fakeInitialListArm.stableTotal === 2
    && fakeInitialListArm.expectedPreOwnerExact132Completions === 2
    && fakeInitialListArm.quietMs === 1000
    && fakeClickListeners.size === 1,
  'initial-list observer did not retain the exact drained owner carrier');
  fakeObserverGlobal.dispatchClick(new FakeElement(false));
  assert(fakeObserver.phase === 'awaiting-initial-list-click'
    && fakeObserver.totalExact132Completions === 2
    && fakeObserver.initialListCompletions === 0,
  'a late pre-owner completion or unrelated click crossed the initial-list boundary');
  fakeObserverGlobal.dispatchClick(new FakeElement(true));
  assert(fakeObserver.phase === 'initial-list'
    && fakeObserver.preOwnerExact132Completions === 2
    && fakeObserver.initialListCompletions === 0
    && fakeObserver.initialListCacheEncodedByteLengths.length === 0
    && fakeClickListeners.size === 0,
  'the actual opener click did not atomically seal the late pre-owner completion');
  assertThrows(() => installBrokenBaselineInitialListArm(
    fakeObserverGlobal, FakeElement, { now: () => observerNow },
    BROKEN_BASELINE_THUMB_OBSERVER_SCHEMA, '#dockcodex,#railcodex', 2,
  ), 'an already-started initial-list phase accepted a second arm');
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
  observerNow += 999;
  assert(sealBrokenBaselineInitialListObservation(
    fakeObserverGlobal, { now: () => observerNow },
    BROKEN_BASELINE_THUMB_OBSERVER_SCHEMA, BROKEN_BASELINE_THUMB_CACHE_CAP, 601,
  ) === null && fakeObserver.phase === 'initial-list',
  'initial-list completion evidence sealed before one full quiet second');
  observerNow += 1;
  const atomicInitialListSeal = sealBrokenBaselineInitialListObservation(
    fakeObserverGlobal, { now: () => observerNow },
    BROKEN_BASELINE_THUMB_OBSERVER_SCHEMA, BROKEN_BASELINE_THUMB_CACHE_CAP, 601,
  );
  assert(atomicInitialListSeal?.expectedPreOwnerExact132Completions === 2
    && atomicInitialListSeal.preOwnerExact132Completions === 2
    && atomicInitialListSeal.initialListCompletions === 601
    && atomicInitialListSeal.cacheEntries === 600
    && atomicInitialListSeal.totalExact132Completions === 603
    && atomicInitialListSeal.quietMs === 1000
    && atomicInitialListSeal.cacheCap === BROKEN_BASELINE_THUMB_CACHE_CAP
    && fakeObserver.phase === 'post-initial-list',
  'initial-list completion evidence was not atomically sealed with its quiet observation');
  assertThrows(() => sealBrokenBaselineInitialListObservation(
    fakeObserverGlobal, { now: () => observerNow },
    BROKEN_BASELINE_THUMB_OBSERVER_SCHEMA, BROKEN_BASELINE_THUMB_CACHE_CAP, 601,
  ), 'a post-initial-list state accepted a second terminal seal');
  const stableThumbObservation = {
    expectedPreOwnerExact132Completions: 8,
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
  const lateClickListeners = new Set();
  const lateArmState = {
    schema: BROKEN_BASELINE_THUMB_OBSERVER_SCHEMA,
    phase: 'pre-owner', descriptorPreserved: true, observerErrors: 0,
    totalExact132Completions: 2, expectedPreOwnerExact132Completions: null,
    preOwnerExact132Completions: null, initialListCompletions: 0,
    initialListCacheEncodedByteLengths: [], lastCompletionAt: 0,
  };
  const lateArmGlobal = {
    __CF_COMPENDIUM_BASELINE_THUMBS__: lateArmState,
    addEventListener(_type, listener) { lateClickListeners.add(listener); },
    removeEventListener(_type, listener) { lateClickListeners.delete(listener); },
  };
  assert(installBrokenBaselineInitialListArm(
    lateArmGlobal, FakeElement, { now: () => 1000 },
    BROKEN_BASELINE_THUMB_OBSERVER_SCHEMA, '#dockcodex,#railcodex', 2,
  )?.stableTotal === 2 && lateClickListeners.size === 1,
  'the post-arm late-completion control did not establish its exact owner boundary');
  lateArmState.totalExact132Completions += 1;
  for (const listener of [...lateClickListeners]) listener({ target: new FakeElement(true) });
  assert(lateArmState.phase === 'initial-list'
    && lateArmState.preOwnerExact132Completions === 3
    && !validBrokenBaselineThumbObservation({
      ...stableThumbObservation,
      expectedPreOwnerExact132Completions: 2,
      preOwnerExact132Completions: 3,
      totalExact132Completions: 1503,
    }),
  'a completion after the exact owner arm crossed the opener boundary without turning evidence red');
  for (const mutation of [
    { expectedPreOwnerExact132Completions: 7 },
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
      thumbObserverExpectedPreOwnerExact132Completions: 8,
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
    budget.measurementAuthority, budget.producerAuthority,
  );
  const budgetCheck = validateBudget(budget);
  assert(budgetCheck.ok, `synthetic active budget rejected: ${budgetCheck.errors.join('; ')}`);
  assert(compendiumBudgetModeAllowed({ calibrate: false, budgetStatus: 'active' })
    && compendiumBudgetModeAllowed({ calibrate: true, budgetStatus: 'calibration-required' })
    && !compendiumBudgetModeAllowed({ calibrate: true, budgetStatus: 'active' })
    && !compendiumBudgetModeAllowed({ calibrate: false, budgetStatus: 'calibration-required' })
    && !compendiumBudgetModeAllowed({ calibrate: 'false', budgetStatus: 'active' }),
  'calibration/certification mode was not fail-closed against the exact budget state');
  const browserAuthority = compendiumBudgetBrowserAuthority(budget);
  assert(validCompendiumBrowserAuthority(browserAuthority)
    && JSON.stringify(compendiumBrowserAuthority(
      budget.calibration.samples.phone[0].browser,
    )) === JSON.stringify(browserAuthority)
    && compendiumBrowserAuthorityMatches({
      executable: '/usr/bin/microsoft-edge-stable', product: 'Chrome/Selftest',
      revision: 'selftest', user_agent: 'Linux selftest', js_version: 'selftest',
      protocol_version: '1.3',
    }, browserAuthority),
  'Arc browser authority did not accept the same exact build across host path/UA provenance');
  assert(!compendiumBrowserAuthorityMatches({
    product: 'Chrome/Other', revision: 'selftest', js_version: 'selftest',
    protocol_version: '1.3',
  }, browserAuthority), 'a different browser product matched the Arc authority');
  for (const field of ['product', 'revision', 'jsVersion', 'protocolVersion']) {
    const mismatchedBaselineBrowser = clone(budget);
    const sampleBrowser = mismatchedBaselineBrowser.pairedBrokenBaseline.samples.phone[0].browser;
    sampleBrowser[field] = `${sampleBrowser[field]}-other`;
    assert(validateBudget(mismatchedBaselineBrowser).errors.some((error) =>
      /does not match the Arc 1A calibration authority/.test(error)),
    `paired baseline ${field} drift escaped the candidate browser authority`);
  }
  const equalMeasuredCeiling = clone(budget);
  equalMeasuredCeiling.ceilings.phone.queuedJobsPeakMax
    = equalMeasuredCeiling.calibration.samples.phone[0].metrics.queuedJobsPeak;
  assert(validateBudget(equalMeasuredCeiling).errors.some((error) =>
    /must be strictly above measured queuedJobsPeak max/.test(error)),
  'a ceiling equal to the observed maximum bypassed the headroom law');
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
  const staleCandidateSampleAuthority = clone(budget);
  staleCandidateSampleAuthority.calibration.samples.phone[0]
    .measurementAuthoritySha256 = 'f'.repeat(64);
  assert(validateBudget(staleCandidateSampleAuthority).errors.some((error) =>
    /candidate calibration samples do not match the budget measurement authority/.test(error)),
  'a candidate sample from a stale measurement authority entered the active ruler');
  const staleBaselineSampleAuthority = clone(budget);
  staleBaselineSampleAuthority.pairedBrokenBaseline.samples.desktop[0]
    .measurementAuthoritySha256 = 'f'.repeat(64);
  assert(validateBudget(staleBaselineSampleAuthority).errors.some((error) =>
    /paired broken-baseline samples do not match the budget measurement authority/.test(error)),
  'a broken-baseline sample from a stale measurement authority entered the active ruler');
  const forgedMeasurementAuthorityInput = clone(budget);
  forgedMeasurementAuthorityInput.measurementAuthority.inputs.collector = 'f'.repeat(64);
  assert(validateBudget(forgedMeasurementAuthorityInput).errors.some((error) =>
    /measurement authority is invalid/.test(error)),
  'a forged measurement-authority input retained a stale aggregate digest');
  const forgedMeasurementAuthorityDigest = clone(budget);
  forgedMeasurementAuthorityDigest.measurementAuthority.sha256 = 'f'.repeat(64);
  assert(validateBudget(forgedMeasurementAuthorityDigest).errors.some((error) =>
    /measurement authority is invalid/.test(error)),
  'a forged measurement-authority digest was accepted');
  const staleMeasurementAuthority = clone(budget);
  staleMeasurementAuthority.measurementAuthority.inputs.collector = 'f'.repeat(64);
  staleMeasurementAuthority.measurementAuthority.sha256 = sha256(
    JSON.stringify(staleMeasurementAuthority.measurementAuthority.inputs),
  );
  assert(validateBudget(staleMeasurementAuthority).errors.some((error) =>
    /does not match the current collector\/evaluator inputs/.test(error)),
  'a self-consistent stale measurement authority matched the current instrument');
  for (const key of Object.keys(budget.measurementAuthority.inputs)) {
    const driftedInputAuthority = clone(budget);
    driftedInputAuthority.measurementAuthority.inputs[key] = 'e'.repeat(64);
    driftedInputAuthority.measurementAuthority.sha256 = sha256(
      JSON.stringify(driftedInputAuthority.measurementAuthority.inputs),
    );
    assert(validateBudget(driftedInputAuthority).errors.some((error) =>
      /does not match the current collector\/evaluator inputs/.test(error)),
    `self-consistent stale measurement input ${key} matched the current authority`);
  }
  const staleCandidateProducerAuthority = clone(budget);
  staleCandidateProducerAuthority.calibration.samples.phone[0]
    .producerAuthoritySha256 = 'f'.repeat(64);
  assert(validateBudget(staleCandidateProducerAuthority).errors.some((error) =>
    /candidate calibration samples do not match the budget producer authority/.test(error)),
  'a candidate sample from a stale built producer entered the active ruler');
  const forgedProducerAuthorityInput = clone(budget);
  forgedProducerAuthorityInput.producerAuthority.inputs.worker.sha256 = '0'.repeat(64);
  assert(validateBudget(forgedProducerAuthorityInput).errors.some((error) =>
    /producer authority is invalid/.test(error)),
  'a forged producer-authority input retained a stale aggregate digest');
  const forgedProducerAuthorityDigest = clone(budget);
  forgedProducerAuthorityDigest.producerAuthority.sha256 = 'f'.repeat(64);
  assert(validateBudget(forgedProducerAuthorityDigest).errors.some((error) =>
    /producer authority is invalid/.test(error)),
  'a forged producer-authority digest was accepted');
  const staleProducerAuthority = clone(budget);
  staleProducerAuthority.producerAuthority.inputs.worker.sha256 = '0'.repeat(64);
  staleProducerAuthority.producerAuthority.sha256 = sha256(
    JSON.stringify(staleProducerAuthority.producerAuthority.inputs),
  );
  for (const profile of ['phone', 'desktop']) {
    for (const sample of staleProducerAuthority.calibration.samples[profile]) {
      sample.producerAuthoritySha256 = staleProducerAuthority.producerAuthority.sha256;
    }
  }
  assert(validateBudget(staleProducerAuthority).errors.some((error) =>
    /does not match the current built index\/owner\/worker\/painter/.test(error)),
  'a self-consistent stale producer authority matched the current built graph');
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
  const candidateEvidenceChanged = clone(budget);
  candidateEvidenceChanged.calibration.samples.phone[0].evidence.points.first[1] += 1;
  assert(validateBudget(candidateEvidenceChanged).errors.some((error) =>
    /metrics do not recompute from raw calibration evidence/.test(error)),
  'candidate raw evidence changed while its copied metrics stayed green');
  const candidateMetricsChanged = clone(budget);
  candidateMetricsChanged.calibration.samples.phone[0].metrics.heapUsedBytes += 1;
  assert(validateBudget(candidateMetricsChanged).errors.some((error) =>
    /metrics do not recompute from raw calibration evidence/.test(error)),
  'candidate copied metrics changed without matching raw evidence');
  const candidateEvidenceRunDrift = clone(budget);
  candidateEvidenceRunDrift.calibration.samples.phone[0].evidence.runId = 'other-run';
  assert(validateBudget(candidateEvidenceRunDrift).errors.some((error) =>
    /evidence is invalid or not bound to its run\/profile/.test(error)),
  'candidate evidence escaped its enclosing run identity');
  const candidateEvidenceProfileDrift = clone(budget);
  candidateEvidenceProfileDrift.calibration.samples.phone[0].evidence.profile = 'desktop';
  assert(validateBudget(candidateEvidenceProfileDrift).errors.some((error) =>
    /evidence is invalid or not bound to its run\/profile/.test(error)),
  'candidate evidence escaped its enclosing profile identity');
  const candidateEvidenceWrongSchema = clone(budget);
  candidateEvidenceWrongSchema.calibration.samples.phone[0].evidence.schema = 'wrong';
  assert(validateBudget(candidateEvidenceWrongSchema).errors.some((error) =>
    /evidence is invalid or not bound to its run\/profile/.test(error)),
  'candidate evidence with the wrong schema was accepted');
  const candidateEvidenceMissingPoint = clone(budget);
  delete candidateEvidenceMissingPoint.calibration.samples.phone[0].evidence.points.first;
  assert(validateBudget(candidateEvidenceMissingPoint).errors.some((error) =>
    /evidence is invalid or not bound to its run\/profile/.test(error)),
  'candidate evidence missing one fixed measured point was accepted');
  const candidateEvidenceReordered = clone(budget);
  candidateEvidenceReordered.calibration.samples.phone[0].evidence.points = Object.fromEntries(
    Object.entries(candidateEvidenceReordered.calibration.samples.phone[0].evidence.points).reverse(),
  );
  assert(validateBudget(candidateEvidenceReordered).errors.some((error) =>
    /evidence is invalid or not bound to its run\/profile/.test(error)),
  'candidate evidence with reordered canonical point carriers was accepted');
  const candidateEvidenceShortWarm = clone(budget);
  candidateEvidenceShortWarm.calibration.samples.phone[0].evidence.warm.pop();
  assert(validateBudget(candidateEvidenceShortWarm).errors.some((error) =>
    /evidence is invalid or not bound to its run\/profile/.test(error)),
  'candidate evidence with a shortened warm series was accepted');
  const candidateEvidenceJobPeak = clone(budget);
  candidateEvidenceJobPeak.calibration.samples.phone[0].evidence.jobPeaks.queuedJobsPeak += 1;
  assert(validateBudget(candidateEvidenceJobPeak).errors.some((error) =>
    /metrics do not recompute from raw calibration evidence/.test(error)),
  'candidate raw job-peak evidence changed while its copied metrics stayed green');
  const baselineEvidenceChanged = clone(budget);
  baselineEvidenceChanged.pairedBrokenBaseline.samples.phone[0].evidence.list[1] += 1;
  assert(validateBudget(baselineEvidenceChanged).errors.some((error) =>
    /metrics do not recompute from raw calibration evidence/.test(error)),
  'baseline raw numeric evidence changed while its copied metrics stayed green');
  const baselineFaultEvidenceChanged = clone(budget);
  baselineFaultEvidenceChanged.pairedBrokenBaseline.samples.phone[0]
    .evidence.listWitness.naturalDimensionHistogram[0][0] = 439;
  assert(validateBudget(baselineFaultEvidenceChanged).errors.some((error) =>
    /observedFaults do not recompute from raw calibration evidence/.test(error)),
  'baseline raw fault evidence changed while copied fault IDs stayed green');
  const baselineEvidenceRunDrift = clone(budget);
  baselineEvidenceRunDrift.pairedBrokenBaseline.samples.phone[0].evidence.runId = 'other-run';
  assert(validateBudget(baselineEvidenceRunDrift).errors.some((error) =>
    /evidence is invalid or not bound to its run\/profile/.test(error)),
  'baseline evidence escaped its enclosing run identity');
  const crossSchemaCandidate = clone(budget);
  crossSchemaCandidate.calibration.samples.phone[0].evidence = clone(
    crossSchemaCandidate.pairedBrokenBaseline.samples.phone[0].evidence,
  );
  crossSchemaCandidate.calibration.samples.phone[0].evidence.runId
    = crossSchemaCandidate.calibration.samples.phone[0].runId;
  assert(validateBudget(crossSchemaCandidate).errors.some((error) =>
    /candidate evidence used the broken-baseline evidence schema|metrics do not recompute/.test(error)),
  'broken-baseline evidence was accepted as a candidate calibration carrier');
  const phone = syntheticMeasurement('phone', fixture, candidateReady.ledger[0]);
  const desktop = syntheticMeasurement('desktop', fixture, candidateReady.ledger[0]);
  for (const measurement of [phone, desktop]) {
    const witness = measurement.phases.producerErrorWitness;
    assert(validProducerErrorWitness(witness, measurement.profile)
      && validProducerErrorPreArmObservation(witness.preArm.accepted)
      && validProducerErrorWorkObservation(witness.publication.accepted)
      && validProducerErrorWorkObservation(witness.recovery.accepted)
      && producerErrorColdProof(witness, measurement.profile)
      && producerErrorContained(witness, measurement.profile)
      && producerErrorRecoverable(witness, measurement.profile),
    `${measurement.profile} synthetic stable-open producer witness was not fully green`);
  }
  const nonzeroSettledPreArmSubscriber = clone(
    phone.phases.producerErrorWitness.preArm.accepted,
  );
  nonzeroSettledPreArmSubscriber.art.live.subscribers = 1;
  const nonzeroSettledPublicationSubscriber = clone(
    phone.phases.producerErrorWitness.publication.accepted,
  );
  nonzeroSettledPublicationSubscriber.art.live.subscribers = 1;
  const nonzeroSettledRecoverySubscriber = clone(
    phone.phases.producerErrorWitness.recovery.accepted,
  );
  nonzeroSettledRecoverySubscriber.art.live.subscribers = 1;
  assert(!validProducerErrorPreArmObservation(nonzeroSettledPreArmSubscriber)
    && validProducerErrorWorkObservation(nonzeroSettledPublicationSubscriber)
    && validProducerErrorWorkObservation(nonzeroSettledRecoverySubscriber),
  'subscriber leaks were not separated into precondition versus product evidence');
  const structurallySettledPlaceholder = clone(
    phone.phases.producerErrorWitness.publication.accepted,
  );
  structurallySettledPlaceholder.rows[0].thumbState = 'placeholder';
  structurallySettledPlaceholder.stateCounts.error = 0;
  structurallySettledPlaceholder.stateCounts.placeholder = 1;
  assert(validProducerErrorWorkObservation(structurallySettledPlaceholder),
    'a jobs-zero stable mounted placeholder was misclassified as incomplete evidence');
  const decodePendingRecovery = clone(phone.phases.producerErrorWitness.recovery.accepted);
  decodePendingRecovery.rows[0].complete = false;
  const wrongDimensionRecovery = clone(phone.phases.producerErrorWitness.recovery.accepted);
  wrongDimensionRecovery.rows[0].naturalWidth = 131;
  assert(!validProducerErrorWorkObservation(decodePendingRecovery)
    && !validProducerErrorWorkObservation(wrongDimensionRecovery),
  'recovery accepted a ready cached row before its exact 132px image decode completed');
  const multiJobRecovery = clone(phone.phases.producerErrorWitness);
  multiJobRecovery.recovery.accepted.art.totals.jobStarts += 2;
  multiJobRecovery.recovery.accepted.art.totals.jobCompletes += 2;
  multiJobRecovery.recovery.accepted.art.totals.leaseAcquires += 2;
  multiJobRecovery.recovery.accepted.art.totals.releases += 2;
  multiJobRecovery.recovery.accepted.art.cachedKeyCount += 2;
  multiJobRecovery.recovery.accepted.art.live.cacheEntries += 2;
  assert(producerErrorRecoverable(multiJobRecovery, 'phone'),
    'a clean recovery with additional source-valid RO tail completions was rejected');
  const multiJobMissingAcquire = clone(multiJobRecovery);
  multiJobMissingAcquire.recovery.accepted.art.totals.leaseAcquires--;
  const multiJobMissingRelease = clone(multiJobRecovery);
  multiJobMissingRelease.recovery.accepted.art.totals.releases--;
  const multiJobBalancedLeaseDeficit = clone(multiJobRecovery);
  multiJobBalancedLeaseDeficit.recovery.accepted.art.totals.leaseAcquires--;
  multiJobBalancedLeaseDeficit.recovery.accepted.art.totals.releases--;
  assert(!producerErrorRecoverable(multiJobMissingAcquire, 'phone')
    && !producerErrorRecoverable(multiJobMissingRelease, 'phone'),
  'extra recovery jobs passed without matching transient acquire/release ownership');
  assert(!producerErrorRecoverable(multiJobBalancedLeaseDeficit, 'phone'),
    'balanced transient ownership deficit bypassed the recovery job/lease lower bound');
  const flatCacheWithoutDisposal = clone(phone.phases.producerErrorWitness);
  flatCacheWithoutDisposal.recovery.accepted.art.cachedKeyCount
    = flatCacheWithoutDisposal.publication.accepted.art.cachedKeyCount;
  flatCacheWithoutDisposal.recovery.accepted.art.live.cacheEntries
    = flatCacheWithoutDisposal.publication.accepted.art.live.cacheEntries;
  assert(!producerErrorRecoverable(flatCacheWithoutDisposal, 'phone'),
    'a flat recovery cache passed without the matching disposal counter');
  const generatedMetricBudget = clone(budget);
  const generatedPhoneMetrics = calibrationMetrics(phone);
  const generatedDesktopMetrics = calibrationMetrics(desktop);
  assert(generatedPhoneMetrics.mountedRows === 28
    && generatedDesktopMetrics.mountedRows === 28,
  'calibration metrics did not retain the expanded-viewport mounted-row maximum');
  for (const [measurement, baseMetrics] of [
    [phone, generatedPhoneMetrics], [desktop, generatedDesktopMetrics],
  ]) {
    const parityMeasurement = clone(measurement);
    parityMeasurement.phases.warmCachePrecondition.heap.embedderHeapUsedSize
      = baseMetrics.embedderHeapUsedBytes + 1;
    parityMeasurement.points.postCapRestored.heap.backingStorageSize
      = baseMetrics.backingStorageBytes + 1;
    const expectedMetrics = calibrationMetrics(parityMeasurement);
    assert(expectedMetrics.embedderHeapUsedBytes === baseMetrics.embedderHeapUsedBytes + 1
      && expectedMetrics.backingStorageBytes === baseMetrics.backingStorageBytes + 1,
    `${measurement.profile} calibration metrics omitted distinct warm-precondition or post-cap carriers`);
    const projected = candidateCalibrationEvidence(parityMeasurement, {
      runId: `candidate-projector-${measurement.profile}`,
    });
    const reduced = reduceCalibrationEvidence(projected);
    assert(reduced && JSON.stringify(reduced.metrics) === JSON.stringify(expectedMetrics),
      `${measurement.profile} candidate capsule projector did not reproduce independently computed calibration metrics`);
  }
  {
    const snapshot = ({ mountedRows, usedSize, embedderHeapUsedSize,
      backingStorageSize, documents, nodes, jsEventListeners, cacheEncodedBytes = null }) => ({
      raw: {
        mountedRows,
        ...(cacheEncodedBytes === null ? {} : {
          renderStartThumbCacheEntries: BROKEN_BASELINE_THUMB_CACHE_CAP,
          renderStartThumbCacheEncodedBytes: cacheEncodedBytes,
        }),
      },
      heap: { usedSize, embedderHeapUsedSize, backingStorageSize },
      dom: { documents, nodes, jsEventListeners },
    });
    const list = snapshot({
      mountedRows: 1500, usedSize: 101, embedderHeapUsedSize: 11,
      backingStorageSize: 1, documents: 2, nodes: 301, jsEventListeners: 41,
    });
    Object.assign(list.raw, {
      naturalWidths: Array(1500).fill(440), naturalHeights: Array(1500).fill(440),
      distinctSources: 1500, sourceInstanceCount: 1500, dataImageCount: 1500,
      sourceInstanceEncodedBytes: 1_500_000,
      thumbObserverExpectedPreOwnerExact132Completions: 7,
      thumbObserverPreOwnerExact132Completions: 7, thumbRenderCompletions: 1500,
      modeledThumbCacheEntries: BROKEN_BASELINE_THUMB_CACHE_CAP,
      thumbCacheEncodedBytes: 600_000,
      thumbObserverTotalExact132Completions: 1507, thumbObserverErrors: 0,
      thumbObserverDescriptorPreserved: true, thumbObserverStableQuietMs: 1200,
      modeledPortraitCacheEntries: BROKEN_BASELINE_PORTRAIT_CACHE_CAPS.phone,
      modeledPortraitCacheEncodedBytes: 960_000,
    });
    const detail = snapshot({
      mountedRows: 1499, usedSize: 202, embedderHeapUsedSize: 22,
      backingStorageSize: 2, documents: 3, nodes: 402, jsEventListeners: 52,
    });
    const warm = [
      [1496, 303, 33, 3, 2, 503, 63, 610_000],
      [1497, 404, 44, 4, 2, 504, 74, 620_000],
      [1498, 505, 55, 5, 2, 505, 85, 630_000],
      [1499, 606, 66, 6, 2, 506, 96, 640_000],
    ].map(([mountedRows, usedSize, embedderHeapUsedSize, backingStorageSize,
      documents, nodes, jsEventListeners, cacheEncodedBytes]) => snapshot({
      mountedRows, usedSize, embedderHeapUsedSize, backingStorageSize,
      documents, nodes, jsEventListeners, cacheEncodedBytes,
    }));
    const eagerResource = 'https://selftest.invalid/assets/species-selftest.js';
    const speciesChunk = 'assets/species-selftest.js';
    const projected = brokenBaselineCalibrationEvidence({
      runId: 'baseline-projector-phone', profile: 'phone', list, detail, warm,
      eagerResource, speciesChunk,
    });
    assert(projected
      && JSON.stringify(projected.list) === JSON.stringify([1500, 101, 11, 1, 2, 301, 41])
      && JSON.stringify(projected.detail) === JSON.stringify([1499, 202, 22, 2, 3, 402, 52])
      && JSON.stringify(projected.warm[0].point)
        === JSON.stringify([1496, 303, 33, 3, 2, 503, 63])
      && JSON.stringify(projected.listWitness.naturalDimensionHistogram)
        === JSON.stringify([[440, 440, 1500]])
      && projected.listWitness.thumbObserver.expectedPreOwnerExact132Completions === 7
      && projected.listWitness.thumbObserver.preOwnerExact132Completions === 7
      && projected.listWitness.thumbObserver.initialListCompletions === 1500
      && projected.listWitness.thumbObserver.totalExact132Completions === 1507
      && projected.listWitness.portraitCache.entries === 96
      && projected.eagerImport.observedResource === eagerResource
      && projected.eagerImport.speciesChunk === speciesChunk,
    'broken-baseline collector snapshot projector did not preserve its fixed capsule field order');
    const reduced = reduceCalibrationEvidence(projected);
    const expected = {
      mountedRows: 1500, heapUsedBytes: 606, documents: 3, nodes: 506,
      embedderHeapUsedBytes: 66, backingStorageBytes: 6, heapAggregateBytes: 678,
      jsEventListeners: 96, liveCacheEntries: 600,
      liveDecodedPixels: 600 * 132 * 132,
      liveDecodedBytes: 600 * 132 * 132 * 4, liveEncodedBytes: 640_000,
      queuedJobsPeak: 0, activeJobsPeak: 0, liveLeases: 0, liveSubscribers: 0,
      livePortraitCacheEntries: 96, livePortraitEncodedBytes: 960_000,
      warmHeapAggregateRangeBytes: 226, warmEncodedBytesRange: 20_000,
    };
    assert(reduced
      && Object.entries(expected).every(([key, value]) => reduced.metrics[key] === value)
      && JSON.stringify(reduced.observedFaults) === JSON.stringify(BROKEN_BASELINE_EXPECTED_FAULTS),
    'broken-baseline capsule reduction did not reproduce independent maxima, ranges, cache metrics, and faults');
  }
  for (const sample of generatedMetricBudget.calibration.samples.phone) {
    sample.evidence = candidateCalibrationEvidence(phone, { runId: sample.runId });
    sample.metrics = clone(reduceCalibrationEvidence(sample.evidence).metrics);
  }
  for (const sample of generatedMetricBudget.calibration.samples.desktop) {
    sample.evidence = candidateCalibrationEvidence(desktop, { runId: sample.runId });
    sample.metrics = clone(reduceCalibrationEvidence(sample.evidence).metrics);
  }
  const generatedMetricBudgetCheck = validateBudget(generatedMetricBudget);
  assert(generatedMetricBudgetCheck.ok,
    `collector-generated candidate metric shape cannot activate the strict budget contract: ${generatedMetricBudgetCheck.errors.join('; ')}`);
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
    ['species painter worker ownership missing', (m) => {
      m.lazySpeciesResource.ownership = 'renderer-import';
    }, 'lazy-art-not-eager'],
    ['species painter Window owner missing', (m) => {
      m.lazySpeciesResource.ownerPath = m.lazySpeciesResource.workerPath;
    }, 'lazy-art-not-eager'],
    ['species painter and worker chunk merged', (m) => {
      m.lazySpeciesResource.workerPath = m.lazySpeciesResource.path;
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
    ['filter dropped Search-target falsy state', (m) => {
      m.phases.filterTransitions[1].entryTarget.falsyObservations.pop();
    }, 'generation-guard'],
    ['filter Search-target count drift', (m) => {
      m.phases.filterTransitions[1].entryTarget.observationCount++;
    }, 'generation-guard'],
    ['filter success target labeled falsy', (m) => {
      const target = m.phases.filterTransitions[1].entryTarget;
      target.falsyObservations[0] = { ...clone(target.accepted), ready: false };
    }, 'generation-guard'],
    ['filter missing ordinary reopen target', (m) => {
      m.phases.filterTransitions[2].reopenTarget.accepted = null;
      m.phases.filterTransitions[2].reopenTarget.observationCount--;
    }, 'generation-guard'],
    ['filter input proof drift', (m) => {
      m.phases.filterTransitions[1].exactInput.accepted.value
        = 'Same Seed SentinelCompendium Filter Beacon';
    }, 'generation-guard'],
    ['filter pointer-close erased prior value', (m) => {
      const transition = m.phases.filterTransitions[1];
      transition.focus.accepted.value = '';
      transition.selection.accepted.value = '';
      transition.selection.accepted.selectionEnd = 0;
      transition.selection.falsyObservations[0].value = '';
    }, 'generation-guard'],
    ['filter reopen retained stale prior value', (m) => {
      const transition = m.phases.filterTransitions[2];
      transition.focus.accepted.value = 'Same Seed Sentinel';
      transition.selection.accepted.value = 'Same Seed Sentinel';
      transition.selection.accepted.selectionEnd = 'Same Seed Sentinel'.length;
      transition.selection.falsyObservations[0].value = 'Same Seed Sentinel';
    }, 'generation-guard'],
    ['filter missing full selection', (m) => {
      const selected = m.phases.filterTransitions[1].selection.accepted;
      selected.selectionStart = null; selected.selectionEnd = null;
    }, 'generation-guard'],
    ['filter partial selection', (m) => {
      m.phases.filterTransitions[1].selection.accepted.selectionEnd -= 1;
    }, 'generation-guard'],
    ['filter success-semantic selection labeled falsy', (m) => {
      const transition = m.phases.filterTransitions[1];
      transition.selection.falsyObservations[0] = {
        ...clone(transition.selection.accepted), ready: false,
      };
    }, 'generation-guard'],
    ['filter success-semantic focus labeled falsy', (m) => {
      const transition = m.phases.filterTransitions[1];
      transition.focus.falsyObservations[0] = {
        ...clone(transition.focus.accepted), ready: false,
      };
    }, 'generation-guard'],
    ['filter selection focus loss', (m) => {
      m.phases.filterTransitions[1].selection.accepted.focused = false;
    }, 'generation-guard'],
    ['filter cleared residual value', (m) => {
      const cleared = m.phases.filterTransitions[1].cleared.accepted;
      cleared.value = 'l'; cleared.selectionEnd = 1;
    }, 'generation-guard'],
    ['filter cleared mode drift', (m) => {
      m.phases.filterTransitions[1].cleared.accepted.panelMode = 'detail';
    }, 'generation-guard'],
    ['filter success-semantic clear labeled falsy', (m) => {
      const transition = m.phases.filterTransitions[1];
      transition.cleared.falsyObservations[0] = {
        ...clone(transition.cleared.accepted), ready: false,
      };
    }, 'generation-guard'],
    ['filter success-semantic exact input labeled falsy', (m) => {
      const transition = m.phases.filterTransitions[1];
      transition.exactInput.falsyObservations[0] = {
        ...clone(transition.exactInput.accepted), ready: false,
      };
    }, 'generation-guard'],
    ['filter missing one-shot telemetry', (m) => {
      delete m.phases.filterTransitions[1].afterClear.art.live;
    }, 'generation-guard'],
    ['filter non-scalar telemetry', (m) => {
      m.phases.filterTransitions[1].inputTelemetry.art.totals.jobStarts = 'many';
    }, 'generation-guard'],
    ['filter dropped cleared falsy state', (m) => {
      m.phases.filterTransitions[1].cleared.falsyObservations.pop();
    }, 'generation-guard'],
    ['filter dropped focus falsy state', (m) => {
      m.phases.filterTransitions[1].focus.falsyObservations.pop();
    }, 'generation-guard'],
    ['filter dropped exact-input falsy state', (m) => {
      m.phases.filterTransitions[1].exactInput.falsyObservations.pop();
    }, 'generation-guard'],
    ['filter dropped terminal falsy state', (m) => {
      m.phases.filterTransitions[1].falsyObservations.pop();
    }, 'generation-guard'],
    ['filter success-semantic terminal state labeled falsy', (m) => {
      const transition = m.phases.filterTransitions[1];
      transition.falsyObservations[0] = {
        ...clone(transition.settled), ready: false,
      };
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
    ['cap shrink phase order drift', (m) => {
      [m.phases.resourceOrder[5], m.phases.resourceOrder[6]]
        = [m.phases.resourceOrder[6], m.phases.resourceOrder[5]];
    }, 'cap-shrink'],
    ['warm resource order drift', (m) => {
      [m.phases.resourceOrder[1], m.phases.resourceOrder[2]]
        = [m.phases.resourceOrder[2], m.phases.resourceOrder[1]];
    }, 'warm-precondition'],
    ['cap shrink warm count copied short', (m) => {
      m.points.capShrink.warmCyclesSealed = 3;
    }, 'cap-shrink'],
    ['cap shrink job chronology forged', (m) => {
      m.points.capShrink.beforeJobStarts = m.points.capShrink.warmTerminalJobStarts - 1;
    }, 'cap-shrink'],
    ['cap shrink disposal chronology forged', (m) => {
      m.points.capShrink.beforeDisposals = m.points.capShrink.warmTerminalDisposals - 1;
    }, 'cap-shrink'],
    ['wrong selected device class', (m) => { m.points.first.diagnostics.art.deviceClass = m.profile === 'phone' ? 'desktop' : 'phone'; }, 'resource-live-limits'],
    ['wrong pre-override device class', (m) => { m.points.initial.diagnostics.art.deviceClass = m.profile === 'phone' ? 'desktop' : 'phone'; }, 'resource-live-limits'],
    ['wrong cap-shrink device class', (m) => { m.points.capShrink.afterDeviceClass = 'desktop'; }, 'cap-shrink'],
    ['producer error swallowed', (m) => {
      m.phases.producerErrorWitness.publication.accepted.art.totals.jobErrors = 0;
    }, 'error-contained'],
    ['producer error publication placeholder after settled jobs', (m) => {
      const publication = m.phases.producerErrorWitness.publication.accepted;
      publication.rows[0].thumbState = 'placeholder';
      publication.stateCounts.error = 0;
      publication.stateCounts.placeholder = 1;
    }, 'error-contained'],
    ['producer error publication has zero mounted ownership', (m) => {
      const w = m.phases.producerErrorWitness;
      w.publication.accepted.art.live.leases = w.preArm.accepted.art.live.leases;
    }, 'error-contained'],
    ['producer error publication leaked a settled subscriber', (m) => {
      m.phases.producerErrorWitness.publication.accepted.art.live.subscribers = 1;
    }, 'error-contained'],
    ['producer error publication net acquisition drift', (m) => {
      m.phases.producerErrorWitness.publication.accepted.art.totals.leaseAcquires--;
    }, 'error-contained'],
    ['producer error publication total decreases', (m) => {
      const w = m.phases.producerErrorWitness;
      w.publication.accepted.art.totals.jobStarts
        = w.preArm.accepted.art.totals.jobStarts - 1;
    }, 'error-contained'],
    ['producer error publication start settlement delta drift', (m) => {
      m.phases.producerErrorWitness.publication.accepted.art.totals.jobStarts++;
    }, 'error-contained'],
    ['producer error publication starts without an owning acquisition', (m) => {
      const art = m.phases.producerErrorWitness.publication.accepted.art;
      art.totals.jobStarts++;
      art.totals.jobCompletes++;
      art.cachedKeyCount++;
      art.live.cacheEntries++;
    }, 'error-contained'],
    ['producer error publication cache arithmetic drift', (m) => {
      const art = m.phases.producerErrorWitness.publication.accepted.art;
      art.cachedKeyCount++; art.live.cacheEntries++;
    }, 'error-contained'],
    ['producer error lifetime lease counter offset', (m) => {
      const w = m.phases.producerErrorWitness;
      for (const observation of [w.preArm.accepted, w.publication.accepted, w.recovery.accepted]) {
        observation.art.totals.leaseAcquires += 5;
      }
    }, 'error-contained'],
    ['producer error lifetime job counter offset', (m) => {
      const w = m.phases.producerErrorWitness;
      for (const observation of [w.preArm.accepted, w.publication.accepted, w.recovery.accepted]) {
        observation.art.totals.jobStarts += 5;
      }
    }, 'error-contained'],
    ['producer error lifetime cache counter offset', (m) => {
      const w = m.phases.producerErrorWitness;
      for (const observation of [w.preArm.accepted, w.publication.accepted, w.recovery.accepted]) {
        observation.art.cachedKeyCount += 5;
        observation.art.live.cacheEntries += 5;
      }
      w.preArm.accepted.cachedKeys.push(...Array.from(
        { length: 5 }, (_, index) => `stale-cache-key-${index}`,
      ));
      w.preArm.accepted.cachedKeys.sort();
    }, 'error-contained'],
    ['producer error cold-key proof missing', (m) => {
      const w = m.phases.producerErrorWitness;
      w.publication.accepted.rows.forEach((row, index) => {
        row.visualKey = `prearm-key-${index % w.preArm.accepted.art.cachedKeyCount}`;
      });
      w.publication.accepted.mountedDistinctVisualKeys = w.preArm.accepted.art.cachedKeyCount;
    }, 'error-contained'],
    ['producer error invariant row zero was already warm', (m) => {
      const pre = m.phases.producerErrorWitness.preArm.accepted;
      pre.cachedKeys.push('producer-key-0');
      pre.cachedKeys.sort();
      pre.art.cachedKeyCount++;
      pre.art.live.cacheEntries++;
    }, 'error-contained'],
    ['producer error landed on a churnable nonzero row', (m) => {
      const publication = m.phases.producerErrorWitness.publication.accepted;
      publication.rows[0].thumbState = 'ready';
      publication.rows[0].naturalWidth = 132;
      publication.rows[0].naturalHeight = 132;
      publication.rows[0].cached = true;
      publication.rows[1].thumbState = 'error';
      publication.rows[1].naturalWidth = 0;
      publication.rows[1].naturalHeight = 0;
      publication.rows[1].cached = false;
    }, 'error-contained'],
    ['producer error poisoned', (m) => {
      m.phases.producerErrorWitness.publication.accepted.rows[0].cached = true;
    }, 'error-contained'],
    ['producer error DOM publication missing after delta', (m) => {
      const publication = m.phases.producerErrorWitness.publication.accepted;
      publication.rows[0].thumbState = 'ready';
      publication.rows[0].naturalWidth = 132;
      publication.rows[0].naturalHeight = 132;
      publication.stateCounts.error = 0;
      publication.stateCounts.ready++;
    }, 'error-contained'],
    ['producer error recovery logical row drift', (m) => {
      m.phases.producerErrorWitness.recovery.accepted.rows[0].logicalId = 'wrong-row';
    }, 'error-recoverable'],
    ['producer error recovery placeholder after settled jobs', (m) => {
      const recovery = m.phases.producerErrorWitness.recovery.accepted;
      recovery.rows[0].thumbState = 'placeholder';
      recovery.rows[0].naturalWidth = 0;
      recovery.rows[0].naturalHeight = 0;
      recovery.rows[0].cached = false;
      recovery.stateCounts.ready--;
      recovery.stateCounts.placeholder = 1;
    }, 'error-recoverable'],
    ['producer error recovery has zero mounted ownership', (m) => {
      m.phases.producerErrorWitness.recovery.accepted.art.live.leases = 0;
    }, 'error-recoverable'],
    ['producer error recovery leaked a settled subscriber', (m) => {
      m.phases.producerErrorWitness.recovery.accepted.art.live.subscribers = 1;
    }, 'error-recoverable'],
    ['producer error recovery net acquisition drift', (m) => {
      m.phases.producerErrorWitness.recovery.accepted.art.totals.leaseAcquires--;
    }, 'error-recoverable'],
    ['producer error recovery total decreases', (m) => {
      const w = m.phases.producerErrorWitness;
      w.recovery.accepted.art.totals.jobStarts
        = w.publication.accepted.art.totals.jobStarts - 1;
    }, 'error-recoverable'],
    ['producer error recovery start delta missing', (m) => {
      const w = m.phases.producerErrorWitness;
      w.recovery.accepted.art.totals.jobStarts = w.publication.accepted.art.totals.jobStarts;
    }, 'error-recoverable'],
    ['producer error recovery repeats an error', (m) => {
      m.phases.producerErrorWitness.recovery.accepted.art.totals.jobErrors++;
    }, 'error-recoverable'],
    ['producer error recovery disposal/cache drift', (m) => {
      m.phases.producerErrorWitness.recovery.accepted.art.totals.disposals++;
    }, 'error-recoverable'],
    ['producer error recovery key drift', (m) => {
      m.phases.producerErrorWitness.recovery.accepted.rows[0].visualKey = 'wrong-key';
    }, 'error-recoverable'],
    ['producer error no recovery', (m) => {
      const w = m.phases.producerErrorWitness;
      w.recovery.accepted.art.totals.jobCompletes
        = w.publication.accepted.art.totals.jobCompletes;
    }, 'error-recoverable'],
    ['canvas bypass', (m) => { m.points.warm.at(-1).diagnostics.art.totals.thumbCanvasRenders = 0; }, 'canvas-thumb-path'],
    ['full portrait thumb path', (m) => { m.points.warm.at(-1).diagnostics.art.totals.fullPortraitRendersForThumb = 1; }, 'no-full-portrait-thumb-path'],
    ['full portrait thumb decode path', (m) => { m.points.warm.at(-1).diagnostics.art.totals.fullPortraitDecodesForThumb = 1; }, 'no-full-portrait-thumb-path'],
    ['portrait cache thumb pollution', (m) => { m.points.first.diagnostics.art.live.portraitCacheEntries = 1; m.points.first.diagnostics.art.live.portraitEncodedBytes = 100; }, 'no-full-portrait-thumb-path'],
    ['eager import', (m) => { m.points.lazyBoot.diagnostics.lazyArt = { state: 'ready', importStarts: 1 }; m.points.lazyBoot.diagnostics.art = artSnapshot(); }, 'lazy-art-not-eager'],
    ['late eager import', (m) => { m.points.lazyEnd.diagnostics.lazyArt = { state: 'ready', importStarts: 1 }; m.points.lazyEnd.diagnostics.art = artSnapshot(); }, 'lazy-art-not-eager'],
    ['lazy worker constructed', (m) => {
      const lazyWorker = workerArtDiagnostics();
      lazyWorker.phases.portraitJobStarts = 0;
      lazyWorker.phases.portraitRenderCompletes = 0;
      lazyWorker.phases.portraitEncodeStarts = 0;
      lazyWorker.phases.portraitEncodeCompletes = 0;
      lazyWorker.results.count--;
      m.points.lazyBoot.diagnostics.lazyArt = lazyWorker;
    }, 'lazy-art-not-eager'],
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
    ['warm series short', (m) => { m.points.warm.pop(); }, 'warm-precondition'],
    ['warm precondition cache short', (m) => {
      m.phases.warmCachePrecondition.diagnostics.art.live.cacheEntries--;
    }, 'warm-precondition'],
    ['warm precondition decoded pixels short', (m) => {
      m.phases.warmCachePrecondition.diagnostics.art.live.decodedPixels -= 132 * 132;
    }, 'warm-precondition'],
    ['warm precondition decoded bytes short', (m) => {
      m.phases.warmCachePrecondition.diagnostics.art.live.decodedBytes -= 132 * 132 * 4;
    }, 'warm-precondition'],
    ['warm precondition encoded bytes exceed product limit', (m) => {
      const a = m.phases.warmCachePrecondition.diagnostics.art;
      a.live.encodedBytes = a.limits.encodedBytes + 1;
    }, 'warm-precondition'],
    ['warm precondition device class drift', (m) => {
      m.phases.warmCachePrecondition.diagnostics.art.deviceClass
        = m.profile === 'phone' ? 'desktop' : 'phone';
    }, 'warm-precondition'],
    ['warm cycle cache short', (m) => {
      m.points.warm[1].diagnostics.art.live.cacheEntries--;
    }, 'warm-precondition'],
    ['warm precondition queued work', (m) => {
      m.phases.warmCachePrecondition.diagnostics.art.live.queuedJobs = 1;
    }, 'warm-precondition'],
    ['warm precondition active work', (m) => {
      m.phases.warmCachePrecondition.diagnostics.art.live.activeJobs = 1;
    }, 'warm-precondition'],
    ['warm precondition leaked subscriber', (m) => {
      m.phases.warmCachePrecondition.diagnostics.art.live.subscribers = 1;
    }, 'warm-precondition'],
    ['warm cache key omitted behind copied count', (m) => {
      m.points.warm[1].diagnostics.art.keys.cached.pop();
    }, 'warm-precondition'],
    ['warm cache key duplicated behind copied count', (m) => {
      const keys = m.points.warm[1].diagnostics.art.keys.cached;
      keys[1] = keys[0];
    }, 'warm-precondition'],
    ['warm cache identity churn behind stable counts', (m) => {
      const keys = m.points.warm[2].diagnostics.art.keys.cached;
      keys[keys.length - 1] = 'zzzz-warm-substituted-key';
    }, 'warm-precondition'],
    ['warm cache repainted the same identities', (m) => {
      m.points.warm[2].diagnostics.art.totals.jobStarts++;
    }, 'warm-precondition'],
    ['warm cache disposed behind stable identities', (m) => {
      m.points.warm[2].diagnostics.art.totals.disposals++;
    }, 'warm-precondition'],
    ['warm cache recreated a released worker', (m) => {
      const lazyArt = m.points.warm[2].diagnostics.lazyArt;
      lazyArt.worker.starts++;
      lazyArt.worker.ready++;
      lazyArt.worker.disposals++;
      lazyArt.identity.lastProducerEpoch++;
      lazyArt.identity.lastWorkerInstanceId++;
      lazyArt.lastEvent.producerEpoch++;
      lazyArt.lastEvent.workerInstanceId++;
    }, 'warm-precondition'],
    ['warm precondition worker retained', (m) => {
      m.phases.warmCachePrecondition.diagnostics.lazyArt.worker.live = true;
    }, 'warm-precondition'],
    ['settled worker retained', (m) => {
      const lazyArt = m.points.warm.at(-1).diagnostics.lazyArt;
      lazyArt.worker.live = true;
    }, 'settled-jobs'],
    ['worker disposal omitted', (m) => {
      m.points.warm.at(-1).diagnostics.lazyArt.worker.disposals--;
    }, 'settled-jobs'],
    ['worker document identity drift', (m) => {
      m.points.warm.at(-1).diagnostics.lazyArt.identity.documentToken = 'foreign-document';
    }, 'settled-jobs'],
    ['worker producer epoch drift', (m) => {
      const lazyArt = m.points.warm.at(-1).diagnostics.lazyArt;
      lazyArt.identity.lastProducerEpoch--;
      lazyArt.lastEvent.producerEpoch--;
    }, 'settled-jobs'],
    ['worker instance identity drift', (m) => {
      const lazyArt = m.points.warm.at(-1).diagnostics.lazyArt;
      lazyArt.identity.lastWorkerInstanceId--;
      lazyArt.lastEvent.workerInstanceId--;
    }, 'settled-jobs'],
    ['worker last producer epoch drift', (m) => {
      m.points.warm.at(-1).diagnostics.lazyArt.lastEvent.producerEpoch--;
    }, 'settled-jobs'],
    ['worker last instance drift', (m) => {
      m.points.warm.at(-1).diagnostics.lazyArt.lastEvent.workerInstanceId--;
    }, 'settled-jobs'],
    ['worker last job identity drift', (m) => {
      m.points.warm.at(-1).diagnostics.lazyArt.lastEvent.jobId--;
    }, 'settled-jobs'],
    ['worker last event omitted', (m) => {
      m.points.warm.at(-1).diagnostics.lazyArt.lastEvent = null;
    }, 'settled-jobs'],
    ['worker last event is not a result', (m) => {
      m.points.warm.at(-1).diagnostics.lazyArt.lastEvent.event = 'phase:encode-complete';
    }, 'settled-jobs'],
    ['worker last result kind drift', (m) => {
      m.points.warm.at(-1).diagnostics.lazyArt.lastEvent.kind = 'portrait440';
    }, 'settled-jobs'],
    ['worker terminal state copied stale', (m) => {
      m.points.warm.at(-1).diagnostics.lazyArt.state = 'loading';
    }, 'settled-jobs'],
    ['worker readiness omitted', (m) => {
      m.points.warm.at(-1).diagnostics.lazyArt.worker.ready--;
    }, 'settled-jobs'],
    ['worker adapter protocol error hidden', (m) => {
      m.points.warm.at(-1).diagnostics.lazyArt.worker.protocolErrors = 1;
    }, 'settled-jobs'],
    ['worker top-level import start omitted', (m) => {
      m.points.warm.at(-1).diagnostics.lazyArt.importStarts--;
    }, 'settled-jobs'],
    ['worker phase import start omitted', (m) => {
      const phases = m.points.warm.at(-1).diagnostics.lazyArt.phases;
      phases.importStarts--;
      phases.importCompletes--;
    }, 'settled-jobs'],
    ['worker import completion omitted', (m) => {
      m.points.warm.at(-1).diagnostics.lazyArt.phases.importCompletes--;
    }, 'settled-jobs'],
    ['worker thumb job/render edge drift', (m) => {
      const lazyArt = m.points.warm.at(-1).diagnostics.lazyArt;
      lazyArt.phases.thumbJobStarts++;
      lazyArt.lastEvent.jobId++;
    }, 'settled-jobs'],
    ['worker thumb render/encode edge drift', (m) => {
      const lazyArt = m.points.warm.at(-1).diagnostics.lazyArt;
      lazyArt.phases.thumbJobStarts++;
      lazyArt.phases.thumbRenderCompletes++;
      lazyArt.lastEvent.jobId++;
    }, 'settled-jobs'],
    ['worker thumb encode completion edge drift', (m) => {
      const lazyArt = m.points.warm.at(-1).diagnostics.lazyArt;
      lazyArt.phases.thumbJobStarts++;
      lazyArt.phases.thumbRenderCompletes++;
      lazyArt.phases.thumbEncodeStarts++;
      lazyArt.lastEvent.jobId++;
    }, 'settled-jobs'],
    ['worker portrait job/render edge drift', (m) => {
      const lazyArt = m.points.warm.at(-1).diagnostics.lazyArt;
      lazyArt.phases.portraitJobStarts++;
      lazyArt.lastEvent.jobId++;
    }, 'settled-jobs'],
    ['worker portrait render/encode edge drift', (m) => {
      const lazyArt = m.points.warm.at(-1).diagnostics.lazyArt;
      lazyArt.phases.portraitJobStarts++;
      lazyArt.phases.portraitRenderCompletes++;
      lazyArt.lastEvent.jobId++;
    }, 'settled-jobs'],
    ['worker portrait encode completion edge drift', (m) => {
      const lazyArt = m.points.warm.at(-1).diagnostics.lazyArt;
      lazyArt.phases.portraitJobStarts++;
      lazyArt.phases.portraitRenderCompletes++;
      lazyArt.phases.portraitEncodeStarts++;
      lazyArt.lastEvent.jobId++;
    }, 'settled-jobs'],
    ['worker portrait path omitted', (m) => {
      const lazyArt = m.points.warm.at(-1).diagnostics.lazyArt;
      lazyArt.phases.portraitJobStarts = 0;
      lazyArt.phases.portraitRenderCompletes = 0;
      lazyArt.phases.portraitEncodeStarts = 0;
      lazyArt.phases.portraitEncodeCompletes = 0;
      lazyArt.results.count--;
      lazyArt.lastEvent.jobId--;
    }, 'settled-jobs'],
    ['worker result total copied stale', (m) => {
      m.points.warm.at(-1).diagnostics.lazyArt.results.count--;
    }, 'settled-jobs'],
    ['worker capability error hidden', (m) => {
      m.points.warm.at(-1).diagnostics.lazyArt.errors.capability = 1;
    }, 'settled-jobs'],
    ['worker core protocol error hidden', (m) => {
      m.points.warm.at(-1).diagnostics.lazyArt.errors.protocol = 1;
    }, 'settled-jobs'],
    ['worker import error hidden', (m) => {
      m.points.warm.at(-1).diagnostics.lazyArt.errors.import = 1;
    }, 'settled-jobs'],
    ['worker encode error hidden', (m) => {
      m.points.warm.at(-1).diagnostics.lazyArt.errors.encode = 1;
    }, 'settled-jobs'],
    ['worker failure bypassed', (m) => {
      const lazyArt = m.points.warm.at(-1).diagnostics.lazyArt;
      lazyArt.errors.paint = 0;
      lazyArt.phases.thumbJobStarts--;
      lazyArt.lastEvent.jobId--;
    }, 'settled-jobs'],
    ['worker fatal hidden', (m) => {
      m.points.warm.at(-1).diagnostics.lazyArt.worker.fatals = 1;
    }, 'settled-jobs'],
    ['warm aggregate plateau', (m) => {
      m.points.warm[2].heap.backingStorageSize += 5000;
    }, 'warm-plateau'],
    ['warm encoded plateau', (m) => {
      m.points.warm[2].diagnostics.art.live.encodedBytes += 5000;
    }, 'warm-plateau'],
    ['post-cap restored snapshot missing', (m) => {
      delete m.points.postCapRestored;
    }, 'cap-shrink'],
    ['post-cap device class drift', (m) => {
      m.points.postCapRestored.diagnostics.art.deviceClass
        = m.profile === 'phone' ? 'desktop' : 'phone';
    }, 'cap-shrink'],
    ['post-cap queued work retained', (m) => {
      m.points.postCapRestored.diagnostics.art.live.queuedJobs = 1;
    }, 'cap-shrink'],
    ['post-cap active work retained', (m) => {
      m.points.postCapRestored.diagnostics.art.live.activeJobs = 1;
    }, 'cap-shrink'],
    ['post-cap subscriber retained', (m) => {
      m.points.postCapRestored.diagnostics.art.live.subscribers = 1;
    }, 'cap-shrink'],
    ['post-cap worker retained', (m) => {
      m.points.postCapRestored.diagnostics.lazyArt.worker.live = true;
    }, 'cap-shrink'],
    ['post-cap worker disposal omitted', (m) => {
      m.points.postCapRestored.diagnostics.lazyArt.worker.disposals--;
    }, 'cap-shrink'],
    ['post-cap worker error hidden', (m) => {
      m.points.postCapRestored.diagnostics.lazyArt.errors.encode = 1;
    }, 'cap-shrink'],
    ['post-cap measured heap exceeds ceiling', (m) => {
      m.points.postCapRestored.heap.usedSize = 20_000_001;
    }, 'heap-ceiling'],
    ['post-cap resource-order evidence omitted', (m) => {
      m.phases.resourceOrder.pop();
    }, 'cap-shrink'],
    ['post-cap resource-order suffix permuted', (m) => {
      const last = m.phases.resourceOrder.length - 1;
      [m.phases.resourceOrder[last - 1], m.phases.resourceOrder[last]]
        = [m.phases.resourceOrder[last], m.phases.resourceOrder[last - 1]];
    }, 'cap-shrink'],
    ['used heap ceiling', (m) => {
      m.points.first.heap.usedSize = 20_000_001;
    }, 'heap-ceiling'],
    ['embedder heap ceiling', (m) => {
      m.points.first.heap.embedderHeapUsedSize = 5_000_001;
    }, 'heap-ceiling'],
    ['backing storage ceiling', (m) => {
      m.points.first.heap.backingStorageSize = 5_000_001;
    }, 'heap-ceiling'],
    ['aggregate heap ceiling', (m) => {
      m.points.first.heap.usedSize = 19_000_001;
      m.points.first.heap.embedderHeapUsedSize = 4_000_000;
      m.points.first.heap.backingStorageSize = 3_000_000;
    }, 'heap-ceiling'],
    ['target timeout', (m) => { m.answerability[0].target.ms = 2001; }, 'target-answerable-first'],
    ['heartbeat timeout', (m) => { m.answerability.at(-1).heartbeat.ms = 2001; }, 'heartbeat-last'],
    ['missing final answerability probe', (m) => { m.answerability.pop(); }, 'target-answerable-last'],
    ['duplicate first answerability probe', (m) => { m.answerability[1] = clone(m.answerability[0]); }, 'target-answerable-last'],
    ['swapped answerability probes', (m) => { m.answerability.reverse(); }, 'target-answerable-first'],
  ];
  const dormantScalarControls = [
    ['state', (value) => { value.state = 'loading'; }],
    ['top-level import start', (value) => { value.importStarts = 1; }],
    ['document identity', (value) => { value.identity.documentToken = 'foreign-document'; }],
    ['producer epoch', (value) => { value.identity.lastProducerEpoch = 1; }],
    ['worker instance', (value) => { value.identity.lastWorkerInstanceId = 1; }],
    ['last event', (value) => { value.lastEvent = {
      producerEpoch: 1, workerInstanceId: 1, jobId: 1, kind: 'thumb132', event: 'result',
    }; }],
    ['live worker', (value) => { value.worker.live = true; }],
  ];
  for (const field of ['starts', 'ready', 'disposals', 'fatals', 'protocolErrors']) {
    dormantScalarControls.push([
      `worker ${field}`, (value) => { value.worker[field] = 1; },
    ]);
  }
  for (const field of [
    'importStarts', 'importCompletes',
    'thumbJobStarts', 'thumbRenderCompletes', 'thumbEncodeStarts', 'thumbEncodeCompletes',
    'portraitJobStarts', 'portraitRenderCompletes', 'portraitEncodeStarts',
    'portraitEncodeCompletes',
  ]) {
    dormantScalarControls.push([
      `phase ${field}`, (value) => { value.phases[field] = 1; },
    ]);
  }
  for (const field of [
    'count', 'maxImportDurationMs', 'maxRenderDurationMs', 'maxEncodeDurationMs',
  ]) {
    dormantScalarControls.push([
      `result ${field}`, (value) => { value.results[field] = 1; },
    ]);
  }
  for (const field of ['capability', 'protocol', 'import', 'paint', 'encode']) {
    dormantScalarControls.push([
      `error ${field}`, (value) => { value.errors[field] = 1; },
    ]);
  }
  for (const [field, mutateDormant] of dormantScalarControls) {
    controls.push([
      `lazy worker dormant ${field}`,
      (measurement) => mutateDormant(measurement.points.lazyBoot.diagnostics.lazyArt),
      'lazy-art-not-eager',
    ]);
  }

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
  const productionVerify = (candidate, overrides = {}) => verifyCompendiumTerminalReport(
    candidate, 'selftest-current', {
      budgetRecord: budget, expectedBudgetSha256: report.budget.sha256,
      fixture, expectedInputs: report.inputs, expectedSourceIdentity: report.source.begin,
      ...overrides,
    },
  );
  const boundReportCheck = productionVerify(report);
  assert(boundReportCheck.ok,
    `production budget-bound terminal report was rejected: ${boundReportCheck.errors.join('; ')}`);
  const locallyConsistentWrongAuthority = clone(report);
  locallyConsistentWrongAuthority.browser.revision = 'other-revision';
  locallyConsistentWrongAuthority.budget.browserAuthority.revision = 'other-revision';
  locallyConsistentWrongAuthority.budget.browserAuthorityMatch = true;
  assert(verifyTerminalReport(locallyConsistentWrongAuthority, 'selftest-current').ok
    && !productionVerify(locallyConsistentWrongAuthority).ok,
  'a locally self-consistent report laundered a browser authority different from the exact budget');
  const locallyConsistentWrongProducer = clone(report);
  const wrongProducer = compendiumProducerAuthority({
    ...clone(report.budget.producerAuthority.inputs),
    worker: {
      ...clone(report.budget.producerAuthority.inputs.worker), sha256: 'a'.repeat(64),
    },
  });
  assert(wrongProducer, 'synthetic wrong producer authority did not canonicalize');
  locallyConsistentWrongProducer.budget.producerAuthority = clone(wrongProducer);
  locallyConsistentWrongProducer.budget.observedProducerAuthority = clone(wrongProducer);
  locallyConsistentWrongProducer.budget.producerAuthorityMatch = true;
  assert(verifyTerminalReport(locallyConsistentWrongProducer, 'selftest-current').ok
    && !productionVerify(locallyConsistentWrongProducer).ok,
  'a locally self-consistent report laundered a producer authority different from the exact budget');
  const missingObservedProducer = clone(report);
  missingObservedProducer.budget.observedProducerAuthority = null;
  missingObservedProducer.budget.producerAuthorityMatch = null;
  assert(!verifyTerminalReport(missingObservedProducer, 'selftest-current').ok,
    'complete PASS omitted its observed built producer authority');
  const forgedProducerMatch = clone(report);
  forgedProducerMatch.budget.observedProducerAuthority = clone(wrongProducer);
  forgedProducerMatch.budget.producerAuthorityMatch = true;
  assert(!verifyTerminalReport(forgedProducerMatch, 'selftest-current').ok,
    'forged producerAuthorityMatch true over a different built graph was accepted');
  assert(!productionVerify(report, { expectedBudgetSha256: 'f'.repeat(64) }).ok,
  'production terminal verification accepted a report against the wrong budget byte hash');
  assert(!verifyCompendiumTerminalReport(report, 'selftest-current').ok,
    'production terminal verification accepted an unbound budget/report pair');
  const wrongInputBudget = clone(report);
  wrongInputBudget.inputs.budget = 'f'.repeat(64);
  const wrongMetadataBudget = clone(report);
  wrongMetadataBudget.budget.sha256 = 'f'.repeat(64);
  assert(verifyTerminalReport(wrongInputBudget, 'selftest-current').ok
    && verifyTerminalReport(wrongMetadataBudget, 'selftest-current').ok
    && !productionVerify(wrongInputBudget).ok && !productionVerify(wrongMetadataBudget).ok,
  'one of the two report budget-byte carriers escaped exact production binding');
  const wrongCollectorInput = clone(report);
  wrongCollectorInput.inputs.collector = 'f'.repeat(64);
  assert(verifyTerminalReport(wrongCollectorInput, 'selftest-current').ok
    && !productionVerify(wrongCollectorInput).ok,
  'a stale/tampered collector input digest escaped exact current-input binding');
  const wrongSource = clone(report);
  wrongSource.source.begin.commit = 'f'.repeat(40);
  wrongSource.source.end.commit = 'f'.repeat(40);
  assert(verifyTerminalReport(wrongSource, 'selftest-current').ok
    && !productionVerify(wrongSource).ok,
  'a stale/tampered clean-looking source identity escaped exact-current-source binding');
  const staleRawHeapPass = clone(report);
  staleRawHeapPass.profiles.phone.points.first.heap.usedSize
    = budget.ceilings.phone.heapUsedBytesMax + 1;
  assert(verifyTerminalReport(staleRawHeapPass, 'selftest-current').ok
    && !productionVerify(staleRawHeapPass).ok,
  'a stale PASS ignored raw heap evidence above the exact active ceiling');
  const staleRawProductStatusPass = clone(report);
  staleRawProductStatusPass.profiles.phone.points.first.diagnostics.art.limits.budgetStatus
    = 'provisional-candidate';
  assert(verifyTerminalReport(staleRawProductStatusPass, 'selftest-current').ok
    && !productionVerify(staleRawProductStatusPass).ok,
  'a stale PASS ignored raw product diagnostics from the provisional budget state');
  const truthfulHeapFail = clone(staleRawHeapPass);
  truthfulHeapFail.outcomes = [
    ...evaluateProfile(truthfulHeapFail.profiles.phone, budget, fixture),
    ...evaluateProfile(truthfulHeapFail.profiles.desktop, budget, fixture),
  ];
  const truthfulHeapFindings = truthfulHeapFail.outcomes
    .filter((outcome) => outcome.status === 'fail').map((outcome) => outcome.diagnosis);
  truthfulHeapFail.status = 'fail';
  truthfulHeapFail.findings = truthfulHeapFindings;
  assert(productionVerify(truthfulHeapFail).ok,
    'a truthful raw-over-ceiling FAIL was rejected by exact outcome replay');
  const wrongActiveStatusFail = clone(truthfulHeapFail);
  wrongActiveStatusFail.budget.status = 'calibration-required';
  assert(verifyTerminalReport(wrongActiveStatusFail, 'selftest-current').ok
    && !productionVerify(wrongActiveStatusFail).ok,
  'a complete FAIL misstated the exact active budget status');
  const staleBalancedLeaseDeficitPass = clone(report);
  staleBalancedLeaseDeficitPass.profiles.phone.phases.producerErrorWitness
    = clone(multiJobBalancedLeaseDeficit);
  assert(!verifyTerminalReport(staleBalancedLeaseDeficitPass, 'selftest-current').ok,
    'a stale PASS laundered a balanced transient ownership deficit');
  const staleLifetimeLeasePass = clone(report);
  const staleLifetimeJobPass = clone(report);
  const staleLifetimeCachePass = clone(report);
  for (const stale of [staleLifetimeLeasePass, staleLifetimeJobPass, staleLifetimeCachePass]) {
    const witness = stale.profiles.phone.phases.producerErrorWitness;
    for (const observation of [
      witness.preArm.accepted, witness.publication.accepted, witness.recovery.accepted,
    ]) {
      if (stale === staleLifetimeLeasePass) observation.art.totals.leaseAcquires += 5;
      if (stale === staleLifetimeJobPass) observation.art.totals.jobStarts += 5;
      if (stale === staleLifetimeCachePass) {
        observation.art.cachedKeyCount += 5;
        observation.art.live.cacheEntries += 5;
      }
    }
    if (stale === staleLifetimeCachePass) {
      witness.preArm.accepted.cachedKeys.push(...Array.from(
        { length: 5 }, (_, index) => `stale-cache-key-${index}`,
      ));
      witness.preArm.accepted.cachedKeys.sort();
    }
  }
  assert(!verifyTerminalReport(staleLifetimeLeasePass, 'selftest-current').ok
    && !verifyTerminalReport(staleLifetimeJobPass, 'selftest-current').ok
    && !verifyTerminalReport(staleLifetimeCachePass, 'selftest-current').ok,
  'constant-offset producer lifetime counters laundered stale PASS outcomes');
  const completeProductFailureReport = (brokenPhone) => {
    const brokenOutcomes = [
      ...evaluateProfile(brokenPhone, budget, fixture),
      ...evaluateProfile(desktop, budget, fixture),
    ];
    const failedReport = terminalReport(
      'selftest-current', brokenOutcomes, budget, { phone: brokenPhone, desktop },
    );
    failedReport.status = 'fail';
    failedReport.findings = brokenOutcomes
      .filter((outcome) => outcome.status === 'fail')
      .map((outcome) => outcome.diagnosis);
    return failedReport;
  };
  const doubleFillPhone = clone(phone);
  const doubleFillTransition = doubleFillPhone.phases.filterTransitions[1];
  doubleFillTransition.settled.generation = doubleFillTransition.baselineGeneration + 2;
  doubleFillTransition.generationDelta = 2;
  const staleDoubleFillPass = clone(report);
  const staleDoubleFillPassTransition = staleDoubleFillPass.profiles.phone
    .phases.filterTransitions[1];
  staleDoubleFillPassTransition.settled.generation
    = staleDoubleFillPassTransition.baselineGeneration + 2;
  staleDoubleFillPassTransition.generationDelta = 2;
  assert(!verifyTerminalReport(staleDoubleFillPass, 'selftest-current').ok,
    'a stale PASS outcome inventory ignored raw +2 native filter generation evidence');
  const doubleFillReport = completeProductFailureReport(doubleFillPhone);
  assert(doubleFillReport.outcomes.some((outcome) =>
    outcome.id === 'phone/generation-guard' && outcome.status === 'fail')
    && verifyTerminalReport(doubleFillReport, 'selftest-current').ok,
  'a complete +2 native filter generation was misclassified as malformed/instrument evidence');
  const pointerClosePriorDriftPhone = clone(phone);
  const pointerCloseTransition = pointerClosePriorDriftPhone.phases.filterTransitions[1];
  pointerCloseTransition.focus.accepted.value = '';
  pointerCloseTransition.focus.accepted.selectionStart = 0;
  pointerCloseTransition.focus.accepted.selectionEnd = 0;
  pointerCloseTransition.selection.accepted.value = '';
  pointerCloseTransition.selection.accepted.selectionStart = 0;
  pointerCloseTransition.selection.accepted.selectionEnd = 0;
  const stalePointerClosePass = clone(report);
  const stalePointerCloseTransition = stalePointerClosePass.profiles.phone
    .phases.filterTransitions[1];
  stalePointerCloseTransition.focus.accepted.value = '';
  stalePointerCloseTransition.focus.accepted.selectionStart = 0;
  stalePointerCloseTransition.focus.accepted.selectionEnd = 0;
  stalePointerCloseTransition.selection.accepted.value = '';
  stalePointerCloseTransition.selection.accepted.selectionStart = 0;
  stalePointerCloseTransition.selection.accepted.selectionEnd = 0;
  assert(!verifyTerminalReport(stalePointerClosePass, 'selftest-current').ok,
    'a stale PASS outcome inventory ignored raw pointer-close prior-value drift');
  const pointerClosePriorDriftReport = completeProductFailureReport(pointerClosePriorDriftPhone);
  assert(pointerClosePriorDriftReport.outcomes.some((outcome) =>
    outcome.id === 'phone/generation-guard' && outcome.status === 'fail')
    && verifyTerminalReport(pointerClosePriorDriftReport, 'selftest-current').ok,
  'a complete pointer-close prior-value regression was rejected instead of verifying as FAIL');
  const malformedCompleteFilterEvidence = clone(doubleFillReport);
  delete malformedCompleteFilterEvidence.profiles.phone
    .phases.filterTransitions[1].selection;
  assert(!verifyTerminalReport(malformedCompleteFilterEvidence, 'selftest-current').ok,
    'a product-red complete report accepted a structurally missing filter-selection witness');
  const missingErrorDomPhone = clone(phone);
  const missingErrorPublication = missingErrorDomPhone.phases
    .producerErrorWitness.publication.accepted;
  missingErrorPublication.rows[0].thumbState = 'ready';
  missingErrorPublication.rows[0].naturalWidth = 132;
  missingErrorPublication.rows[0].naturalHeight = 132;
  missingErrorPublication.stateCounts.error = 0;
  missingErrorPublication.stateCounts.ready++;
  const missingErrorDomReport = completeProductFailureReport(missingErrorDomPhone);
  assert(missingErrorDomReport.outcomes.some((outcome) =>
    outcome.id === 'phone/error-contained' && outcome.status === 'fail')
    && verifyTerminalReport(missingErrorDomReport, 'selftest-current').ok,
  'a settled job-error delta without retained error DOM was misclassified as malformed/instrument');
  const staleMissingErrorDomPass = clone(report);
  const staleMissingPublication = staleMissingErrorDomPass.profiles.phone.phases
    .producerErrorWitness.publication.accepted;
  staleMissingPublication.rows[0].thumbState = 'ready';
  staleMissingPublication.rows[0].naturalWidth = 132;
  staleMissingPublication.rows[0].naturalHeight = 132;
  staleMissingPublication.stateCounts.error = 0;
  staleMissingPublication.stateCounts.ready++;
  assert(!verifyTerminalReport(staleMissingErrorDomPass, 'selftest-current').ok,
    'a stale PASS ignored a settled producer error whose DOM publication vanished');
  const placeholderPublicationPhone = clone(phone);
  const placeholderPublication = placeholderPublicationPhone.phases
    .producerErrorWitness.publication.accepted;
  placeholderPublication.rows[0].thumbState = 'placeholder';
  placeholderPublication.stateCounts.error = 0;
  placeholderPublication.stateCounts.placeholder = 1;
  const placeholderPublicationReport = completeProductFailureReport(
    placeholderPublicationPhone,
  );
  assert(placeholderPublicationReport.outcomes.some((outcome) =>
    outcome.id === 'phone/error-contained' && outcome.status === 'fail')
    && verifyTerminalReport(placeholderPublicationReport, 'selftest-current').ok,
  'a jobs-zero publication placeholder was not preserved as complete product FAIL');
  const stalePlaceholderPublicationPass = clone(report);
  const stalePlaceholderPublication = stalePlaceholderPublicationPass.profiles.phone.phases
    .producerErrorWitness.publication.accepted;
  stalePlaceholderPublication.rows[0].thumbState = 'placeholder';
  stalePlaceholderPublication.stateCounts.error = 0;
  stalePlaceholderPublication.stateCounts.placeholder = 1;
  assert(!verifyTerminalReport(stalePlaceholderPublicationPass, 'selftest-current').ok,
    'a stale PASS ignored a jobs-zero publication placeholder');
  const publicationSubscriberLeakPhone = clone(phone);
  publicationSubscriberLeakPhone.phases.producerErrorWitness.publication
    .accepted.art.live.subscribers = 1;
  const publicationSubscriberLeakReport = completeProductFailureReport(
    publicationSubscriberLeakPhone,
  );
  assert(publicationSubscriberLeakReport.outcomes.some((outcome) =>
    outcome.id === 'phone/error-contained' && outcome.status === 'fail')
    && verifyTerminalReport(publicationSubscriberLeakReport, 'selftest-current').ok,
  'a settled publication subscriber leak was not preserved as complete product FAIL');
  const stalePublicationSubscriberPass = clone(report);
  stalePublicationSubscriberPass.profiles.phone.phases.producerErrorWitness
    .publication.accepted.art.live.subscribers = 1;
  assert(!verifyTerminalReport(stalePublicationSubscriberPass, 'selftest-current').ok,
    'a stale PASS ignored a settled publication subscriber leak');
  const placeholderRecoveryPhone = clone(phone);
  const placeholderRecovery = placeholderRecoveryPhone.phases
    .producerErrorWitness.recovery.accepted;
  placeholderRecovery.rows[0].thumbState = 'placeholder';
  placeholderRecovery.rows[0].naturalWidth = 0;
  placeholderRecovery.rows[0].naturalHeight = 0;
  placeholderRecovery.rows[0].cached = false;
  placeholderRecovery.stateCounts.ready--;
  placeholderRecovery.stateCounts.placeholder = 1;
  const placeholderRecoveryReport = completeProductFailureReport(placeholderRecoveryPhone);
  assert(placeholderRecoveryReport.outcomes.some((outcome) =>
    outcome.id === 'phone/error-recoverable' && outcome.status === 'fail')
    && verifyTerminalReport(placeholderRecoveryReport, 'selftest-current').ok,
  'a jobs-zero recovery placeholder was not preserved as complete product FAIL');
  const stalePlaceholderRecoveryPass = clone(report);
  const stalePlaceholderRecovery = stalePlaceholderRecoveryPass.profiles.phone.phases
    .producerErrorWitness.recovery.accepted;
  stalePlaceholderRecovery.rows[0].thumbState = 'placeholder';
  stalePlaceholderRecovery.rows[0].naturalWidth = 0;
  stalePlaceholderRecovery.rows[0].naturalHeight = 0;
  stalePlaceholderRecovery.rows[0].cached = false;
  stalePlaceholderRecovery.stateCounts.ready--;
  stalePlaceholderRecovery.stateCounts.placeholder = 1;
  assert(!verifyTerminalReport(stalePlaceholderRecoveryPass, 'selftest-current').ok,
    'a stale PASS ignored a jobs-zero recovery placeholder');
  const recoverySubscriberLeakPhone = clone(phone);
  recoverySubscriberLeakPhone.phases.producerErrorWitness.recovery
    .accepted.art.live.subscribers = 1;
  const recoverySubscriberLeakReport = completeProductFailureReport(recoverySubscriberLeakPhone);
  assert(recoverySubscriberLeakReport.outcomes.some((outcome) =>
    outcome.id === 'phone/error-recoverable' && outcome.status === 'fail')
    && verifyTerminalReport(recoverySubscriberLeakReport, 'selftest-current').ok,
  'a settled recovery subscriber leak was not preserved as complete product FAIL');
  const staleRecoverySubscriberPass = clone(report);
  staleRecoverySubscriberPass.profiles.phone.phases.producerErrorWitness
    .recovery.accepted.art.live.subscribers = 1;
  assert(!verifyTerminalReport(staleRecoverySubscriberPass, 'selftest-current').ok,
    'a stale PASS ignored a settled recovery subscriber leak');
  const staleRecoveryPhone = clone(phone);
  const staleRecoveryWitness = staleRecoveryPhone.phases.producerErrorWitness;
  staleRecoveryWitness.recovery.accepted.art.totals.jobCompletes
    = staleRecoveryWitness.publication.accepted.art.totals.jobCompletes;
  staleRecoveryWitness.recovery.accepted.rows[0].visualKey = 'stale-wrong-key';
  const staleRecoveryReport = completeProductFailureReport(staleRecoveryPhone);
  assert(staleRecoveryReport.outcomes.some((outcome) =>
    outcome.id === 'phone/error-recoverable' && outcome.status === 'fail')
    && verifyTerminalReport(staleRecoveryReport, 'selftest-current').ok,
  'a stale/wrong recovery without a new completion was not preserved as product FAIL');
  const staleRecoveryPass = clone(report);
  staleRecoveryPass.profiles.phone.phases.producerErrorWitness.recovery.accepted
    .art.totals.jobCompletes = staleRecoveryPass.profiles.phone.phases
      .producerErrorWitness.publication.accepted.art.totals.jobCompletes;
  assert(!verifyTerminalReport(staleRecoveryPass, 'selftest-current').ok,
    'a stale PASS ignored recovery without a new producer completion');
  const noColdProofReport = completeProductFailureReport(clone(phone));
  const noColdPublication = noColdProofReport.profiles.phone.phases
    .producerErrorWitness.publication.accepted;
  noColdPublication.rows.forEach((row, index) => { row.visualKey = `prearm-key-${index % 4}`; });
  noColdPublication.mountedDistinctVisualKeys = 4;
  noColdProofReport.outcomes = [
    ...evaluateProfile(noColdProofReport.profiles.phone, budget, fixture),
    ...evaluateProfile(desktop, budget, fixture),
  ];
  noColdProofReport.findings = noColdProofReport.outcomes
    .filter((outcome) => outcome.status === 'fail').map((outcome) => outcome.diagnosis);
  assert(!verifyTerminalReport(noColdProofReport, 'selftest-current').ok,
    'a complete report certified product semantics without a stable mounted cold-key proof');
  const warmInvariantRowPass = clone(report);
  const warmInvariantPre = warmInvariantRowPass.profiles.phone.phases
    .producerErrorWitness.preArm.accepted;
  warmInvariantPre.cachedKeys.push('producer-key-0');
  warmInvariantPre.cachedKeys.sort();
  warmInvariantPre.art.cachedKeyCount++;
  warmInvariantPre.art.live.cacheEntries++;
  assert(!verifyTerminalReport(warmInvariantRowPass, 'selftest-current').ok,
    'a stale PASS armed the one-shot producer failure with invariant row zero already warm');
  const wrongErrorRowPhone = clone(phone);
  const wrongErrorRows = wrongErrorRowPhone.phases.producerErrorWitness
    .publication.accepted.rows;
  wrongErrorRows[0].thumbState = 'ready';
  wrongErrorRows[0].naturalWidth = 132;
  wrongErrorRows[0].naturalHeight = 132;
  wrongErrorRows[0].cached = true;
  wrongErrorRows[1].thumbState = 'error';
  wrongErrorRows[1].naturalWidth = 0;
  wrongErrorRows[1].naturalHeight = 0;
  wrongErrorRows[1].cached = false;
  const wrongErrorRowReport = completeProductFailureReport(wrongErrorRowPhone);
  assert(wrongErrorRowReport.outcomes.some((outcome) =>
    outcome.id === 'phone/error-contained' && outcome.status === 'fail')
    && verifyTerminalReport(wrongErrorRowReport, 'selftest-current').ok,
  'an injected error on a churnable nonzero row was not preserved as product FAIL');
  const staleWrongErrorRowPass = clone(report);
  const staleWrongErrorRows = staleWrongErrorRowPass.profiles.phone.phases
    .producerErrorWitness.publication.accepted.rows;
  staleWrongErrorRows[0].thumbState = 'ready';
  staleWrongErrorRows[0].naturalWidth = 132;
  staleWrongErrorRows[0].naturalHeight = 132;
  staleWrongErrorRows[0].cached = true;
  staleWrongErrorRows[1].thumbState = 'error';
  staleWrongErrorRows[1].naturalWidth = 0;
  staleWrongErrorRows[1].naturalHeight = 0;
  staleWrongErrorRows[1].cached = false;
  assert(!verifyTerminalReport(staleWrongErrorRowPass, 'selftest-current').ok,
    'a stale PASS ignored the injected error landing outside invariant row zero');
  const malformedProducerWitness = clone(report);
  malformedProducerWitness.profiles.phone.phases.producerErrorWitness.publication
    .observationCount++;
  assert(!verifyTerminalReport(malformedProducerWitness, 'selftest-current').ok,
    'a producer publication observation count drifted from its progressive witness');
  const missingProducerWitnessField = clone(report);
  delete missingProducerWitnessField.profiles.phone.phases
    .producerErrorWitness.recoveryOpenTarget;
  assert(!verifyTerminalReport(missingProducerWitnessField, 'selftest-current').ok,
    'a complete producer witness omitted one sealed lifecycle carrier');
  const droppedCompleteProducerCommand = clone(report);
  droppedCompleteProducerCommand.profiles.phone.phases
    .producerErrorWitness.commands.pop();
  assert(!verifyTerminalReport(droppedCompleteProducerCommand, 'selftest-current').ok,
    'a complete producer witness dropped a paired command while retaining its observation');
  const duplicateCompleteProducerCommand = clone(report);
  duplicateCompleteProducerCommand.profiles.phone.phases.producerErrorWitness.commands.push(
    retimeCandidateEvidence(
      candidateReady.ledger[0], 'phone', producerErrorStages('phone').recovery, 2200,
    ),
  );
  assert(!verifyTerminalReport(duplicateCompleteProducerCommand, 'selftest-current').ok,
    'a complete producer witness added a serial paired command without an observation');
  const wrongCompleteProducerHeartbeat = clone(report);
  wrongCompleteProducerHeartbeat.profiles.phone.phases.producerErrorWitness
    .commands[0].heartbeat.product = 'Chrome/Foreign';
  assert(!verifyTerminalReport(wrongCompleteProducerHeartbeat, 'selftest-current').ok,
    'complete producer commands were not bound to browser provenance');
  const driftedProducerAnswerReceipt = clone(report);
  driftedProducerAnswerReceipt.profiles.phone.phases.producerErrorWitness
    .answerability.target.ms += 1;
  assert(!verifyTerminalReport(driftedProducerAnswerReceipt, 'selftest-current').ok,
    'producer answerability receipt timing drifted from its retained paired command');
  const successSemanticProducerFalsy = clone(report);
  const successSemanticGroup = successSemanticProducerFalsy.profiles.phone.phases
    .producerErrorWitness.publication;
  successSemanticGroup.falsyObservations[0] = clone(successSemanticGroup.accepted);
  successSemanticGroup.falsyObservations[0].ready = false;
  assert(!verifyTerminalReport(successSemanticProducerFalsy, 'selftest-current').ok,
    'a success-semantic producer observation was accepted as a retained falsy poll');
  const partialReview = report.reviewPacket.filter((item) => item.profile === 'phone'
    && ['list', 'focus-pinned'].includes(item.state));
  const preBrowserPartial = {
    ...clone(report), status: 'instrument-fail', browser: null, outcomes: [],
    budget: {
      ...clone(report.budget), browserAuthorityMatch: null,
      observedProducerAuthority: null, producerAuthorityMatch: null,
    },
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
  let producerCommandSerial = 0;
  const retimeProducerCandidateCommand = (template, label) => {
    const issuedAtMs = 3000 + producerCommandSerial++ * 100;
    return retimeCandidateEvidence(template, 'phone', label, issuedAtMs);
  };
  const fullPhoneProducerWitness = clone(phone.phases.producerErrorWitness);
  const producerStagesComplete = [...producerErrorStages('phone').sequence];
  const snapshotStageGroup = (base) => [
    `${base} animation task`, `${base} garbage collection`, `${base} heap usage`,
    `${base} product/DOM snapshot`, `${base} DOM counters`,
  ];
  const bootSnapshotStages = [
    ...snapshotStageGroup('fresh lazy-control'),
    ...snapshotStageGroup('main initial'),
  ];
  const fixtureSetupStages = [
    'set device class', 'install exact fixture', 'validate exact fixture',
  ];
  const listReviewStages = [
    ...snapshotStageGroup('first rows'), 'screenshot list', 'review list',
  ];
  const focusReviewStages = [
    ...snapshotStageGroup('contracted viewport'),
    ...snapshotStageGroup('expanded viewport'),
    ...snapshotStageGroup('restored viewport'),
    'screenshot focus-pinned', 'review focus-pinned',
  ];
  const producerLedgerComplete = clone(fullPhoneProducerWitness.commands);
  const productTerminalCommand = retimeProducerCandidateCommand(
    candidateTargetTimeout.failure.command, 'list thumb settlement',
  );
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
        completedStages: [
          ...bootSnapshotStages, ...fixtureSetupStages, ...producerStagesComplete,
          ...listReviewStages, ...focusReviewStages, 'Compendium open',
        ],
        commandLedger: [...clone(producerLedgerComplete), clone(productTerminalCommand)],
        producerErrorWitness: clone(fullPhoneProducerWitness),
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
      command: clone(productTerminalCommand),
    },
    blockedOutcomes: [...EXPECTED_OUTCOMES],
  };
  const partialArtifact = () => true;
  const productPartialCheck = verifyTerminalReport(productPartial, 'selftest-current', {
    verifyArtifact: partialArtifact,
  });
  assert(productPartialCheck.ok,
    `healthy-heartbeat product-unanswerable partial report was rejected: ${productPartialCheck.errors.join('; ')}`);
  const omittedFirstRowsTransaction = clone(productPartial);
  omittedFirstRowsTransaction.profiles.phone.completedStages
    = omittedFirstRowsTransaction.profiles.phone.completedStages.filter((stage) =>
      !snapshotStageGroup('first rows').includes(stage));
  assert(!verifyTerminalReport(omittedFirstRowsTransaction, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'a later list/focus review retained after deleting the whole first-rows snapshot transaction');
  for (const base of [
    'fresh lazy-control', 'main initial', 'contracted viewport',
    'expanded viewport', 'restored viewport',
  ]) {
    const omittedPrerequisite = clone(productPartial);
    omittedPrerequisite.profiles.phone.completedStages
      = omittedPrerequisite.profiles.phone.completedStages.filter((stage) =>
        !snapshotStageGroup(base).includes(stage));
    assert(!verifyTerminalReport(omittedPrerequisite, 'selftest-current', {
      verifyArtifact: partialArtifact,
    }).ok, `a focus review retained after deleting the whole ${base} snapshot transaction`);
  }
  for (const stage of fixtureSetupStages) {
    const omittedSetup = clone(productPartial);
    omittedSetup.profiles.phone.completedStages
      = omittedSetup.profiles.phone.completedStages.filter((value) => value !== stage);
    assert(!verifyTerminalReport(omittedSetup, 'selftest-current', {
      verifyArtifact: partialArtifact,
    }).ok, `a first-rows review retained after deleting the required ${stage} setup stage`);
  }
  const omittedProducerBlock = clone(productPartial);
  omittedProducerBlock.profiles.phone.completedStages
    = omittedProducerBlock.profiles.phone.completedStages.filter((stage) =>
      !producerStagesComplete.includes(stage));
  assert(!verifyTerminalReport(omittedProducerBlock, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'a first-rows review retained after deleting the whole producer proof block');
  const producerBeforeFixture = clone(productPartial);
  const producerBeforeFixtureStages = producerBeforeFixture.profiles.phone.completedStages;
  const producerStartIndex = producerBeforeFixtureStages.indexOf(producerStagesComplete[0]);
  const movedProducerBlock = producerBeforeFixtureStages.splice(
    producerStartIndex, producerStagesComplete.length,
  );
  const setDeviceIndex = producerBeforeFixtureStages.indexOf('set device class');
  producerBeforeFixtureStages.splice(setDeviceIndex, 0, ...movedProducerBlock);
  assert(producerStartIndex >= 0 && setDeviceIndex >= 0
    && !verifyTerminalReport(producerBeforeFixture, 'selftest-current', {
      verifyArtifact: partialArtifact,
    }).ok, 'the producer proof block was accepted before fixture setup/validation');
  const swappedResizeTransactions = clone(productPartial);
  const swappedResizeStages = swappedResizeTransactions.profiles.phone.completedStages;
  const contractedIndex = swappedResizeStages.indexOf('contracted viewport animation task');
  const expandedIndex = swappedResizeStages.indexOf('expanded viewport animation task');
  const contractedGroup = swappedResizeStages.splice(contractedIndex, 5);
  const shiftedExpandedIndex = swappedResizeStages.indexOf('expanded viewport animation task');
  swappedResizeStages.splice(shiftedExpandedIndex + 5, 0, ...contractedGroup);
  assert(contractedIndex >= 0 && expandedIndex > contractedIndex
    && !verifyTerminalReport(swappedResizeTransactions, 'selftest-current', {
      verifyArtifact: partialArtifact,
    }).ok, 'focus review accepted expanded and contracted snapshot transactions out of source order');
  const firstRowsAfterScreenshot = clone(productPartial);
  const firstRowsStages = firstRowsAfterScreenshot.profiles.phone.completedStages;
  const firstRowsStart = firstRowsStages.indexOf('first rows animation task');
  const firstRowsGroup = firstRowsStages.splice(firstRowsStart, 5);
  const listScreenshotIndex = firstRowsStages.indexOf('screenshot list');
  firstRowsStages.splice(listScreenshotIndex + 1, 0, ...firstRowsGroup);
  assert(firstRowsStart >= 0 && listScreenshotIndex >= 0
    && !verifyTerminalReport(firstRowsAfterScreenshot, 'selftest-current', {
      verifyArtifact: partialArtifact,
    }).ok, 'list screenshot was accepted before its measured first-rows snapshot transaction');
  const reviewBeforeScreenshot = clone(productPartial);
  const reviewOrderStages = reviewBeforeScreenshot.profiles.phone.completedStages;
  const screenshotListIndex = reviewOrderStages.indexOf('screenshot list');
  const reviewListIndex = reviewOrderStages.indexOf('review list');
  [reviewOrderStages[screenshotListIndex], reviewOrderStages[reviewListIndex]]
    = [reviewOrderStages[reviewListIndex], reviewOrderStages[screenshotListIndex]];
  assert(screenshotListIndex >= 0 && reviewListIndex > screenshotListIndex
    && !verifyTerminalReport(reviewBeforeScreenshot, 'selftest-current', {
      verifyArtifact: partialArtifact,
    }).ok, 'list review was accepted before its screenshot stage');
  const duplicateSnapshotTransaction = clone(productPartial);
  const duplicateInsert = duplicateSnapshotTransaction.profiles.phone.completedStages
    .indexOf('first rows animation task');
  duplicateSnapshotTransaction.profiles.phone.completedStages.splice(
    duplicateInsert, 0, ...snapshotStageGroup('first rows'),
  );
  assert(duplicateInsert >= 0
    && !verifyTerminalReport(duplicateSnapshotTransaction, 'selftest-current', {
      verifyArtifact: partialArtifact,
    }).ok, 'a duplicated whole first-rows snapshot transaction was accepted');
  const duplicateScreenshotStage = clone(productPartial);
  const duplicateScreenshotIndex = duplicateScreenshotStage.profiles.phone.completedStages
    .indexOf('screenshot list');
  duplicateScreenshotStage.profiles.phone.completedStages.splice(
    duplicateScreenshotIndex, 0, 'screenshot list',
  );
  assert(duplicateScreenshotIndex >= 0
    && !verifyTerminalReport(duplicateScreenshotStage, 'selftest-current', {
      verifyArtifact: partialArtifact,
    }).ok, 'a duplicated list screenshot stage was accepted');
  const omittedReviewScreenshot = clone(productPartial);
  omittedReviewScreenshot.profiles.phone.completedStages
    = omittedReviewScreenshot.profiles.phone.completedStages.filter((stage) =>
      stage !== 'screenshot focus-pinned');
  assert(!verifyTerminalReport(omittedReviewScreenshot, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'a completed focus review omitted its required screenshot stage');
  const postStageValidationPartial = clone(productPartial);
  postStageValidationPartial.status = 'instrument-fail';
  postStageValidationPartial.findings = [
    'instrument: local validation failed after Compendium open',
  ];
  postStageValidationPartial.partialFailure.classification = 'instrument';
  postStageValidationPartial.partialFailure.failingStage = 'after Compendium open';
  postStageValidationPartial.partialFailure.command = null;
  postStageValidationPartial.profiles.phone.failingStage = 'after Compendium open';
  postStageValidationPartial.profiles.phone.commandLedger.pop();
  assert(verifyTerminalReport(postStageValidationPartial, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'a distinct local post-stage validation failure was rejected');
  const completedStageClaimedAsFailure = clone(postStageValidationPartial);
  completedStageClaimedAsFailure.partialFailure.failingStage = 'Compendium open';
  completedStageClaimedAsFailure.profiles.phone.failingStage = 'Compendium open';
  assert(!verifyTerminalReport(completedStageClaimedAsFailure, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'a completed stage was accepted as the partial report failingStage');
  const detailWithoutFilterHistory = clone(productPartial);
  const detailReviewItem = report.reviewPacket.find((item) =>
    item.profile === 'phone' && item.state === 'detail');
  assert(detailReviewItem, 'synthetic report omitted its phone detail review item');
  detailWithoutFilterHistory.reviewPacket.push(clone(detailReviewItem));
  detailWithoutFilterHistory.profiles.phone.reviewPacket.push(clone(detailReviewItem));
  const openIndex = detailWithoutFilterHistory.profiles.phone.completedStages
    .lastIndexOf('Compendium open');
  detailWithoutFilterHistory.profiles.phone.completedStages.splice(openIndex, 0,
    ...snapshotStageGroup('middle rows'),
    ...snapshotStageGroup('last rows'),
    ...snapshotStageGroup('filtered row'),
    ...snapshotStageGroup('detail'), 'screenshot detail', 'review detail');
  assert(!verifyTerminalReport(detailWithoutFilterHistory, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'a detail review fabricated middle/filter/detail snapshots without native filter witnesses');
  const publicationPartial = clone(productPartial);
  const pendingProducerWitness = clone(fullPhoneProducerWitness);
  pendingProducerWitness.publication.accepted = null;
  pendingProducerWitness.publication.observationCount
    = pendingProducerWitness.publication.falsyObservations.length;
  pendingProducerWitness.answerability = null;
  pendingProducerWitness.closeTarget = {
    observationCount: 0, falsyObservations: [], accepted: null,
  };
  pendingProducerWitness.recoveryOpenTarget = {
    observationCount: 0, falsyObservations: [], accepted: null,
  };
  pendingProducerWitness.recovery = {
    observationCount: 0, falsyObservations: [], accepted: null,
  };
  const producerPartialStages = producerErrorStages('phone');
  pendingProducerWitness.commands = [
    ...fullPhoneProducerWitness.commands.filter((command) =>
      command.label === producerPartialStages.preArm),
    ...fullPhoneProducerWitness.commands.filter((command) =>
      command.label === producerPartialStages.openTarget),
    ...fullPhoneProducerWitness.commands.filter((command) =>
      command.label === producerPartialStages.publication)
      .slice(0, pendingProducerWitness.publication.observationCount),
  ].map(clone);
  const publicationCompletedStages = [
    ...bootSnapshotStages, ...fixtureSetupStages,
    ...producerPartialStages.sequence.slice(
      0, producerPartialStages.sequence.indexOf(producerPartialStages.publication),
    ),
  ];
  const partialProducerCommands = clone(pendingProducerWitness.commands);
  const publicationFailureCommand = retimeProducerCandidateCommand(
    candidateBothTimeout.failure.command, producerPartialStages.publication,
  );
  pendingProducerWitness.commands.push(clone(publicationFailureCommand));
  publicationPartial.status = 'instrument-fail';
  publicationPartial.findings = [
    'instrument: phone producer error publication: root heartbeat failed',
  ];
  publicationPartial.reviewPacket = [];
  publicationPartial.partialFailure = {
    schema: PARTIAL_FAILURE_SCHEMA, classification: 'instrument', profile: 'phone',
    lastCompletedStage: publicationCompletedStages.at(-1),
    failingStage: producerPartialStages.publication,
    command: clone(publicationFailureCommand),
  };
  publicationPartial.profiles.phone = {
    schema: PARTIAL_PROFILE_SCHEMA, profile: 'phone', viewport: { ...phoneViewport },
    evidenceStatus: 'partial-non-certifying',
    lastCompletedStage: publicationCompletedStages.at(-1),
    failingStage: producerPartialStages.publication,
    completedStages: publicationCompletedStages,
    commandLedger: [
      ...partialProducerCommands, clone(publicationFailureCommand),
    ],
    producerErrorWitness: pendingProducerWitness,
    filterTransitions: [], reviewPacket: [],
  };
  assert(verifyTerminalReport(publicationPartial, 'selftest-current').ok,
    'a stable-open pending publication lost its progressive falsies/stage/command evidence');
  const oldMultiScrollAmbiguity = clone(publicationPartial);
  oldMultiScrollAmbiguity.profiles.phone.completedStages.push('scroll toward row 1000');
  oldMultiScrollAmbiguity.profiles.phone.lastCompletedStage = 'scroll toward row 1000';
  oldMultiScrollAmbiguity.partialFailure.lastCompletedStage = 'scroll toward row 1000';
  assert(!verifyTerminalReport(oldMultiScrollAmbiguity, 'selftest-current').ok,
    'the old arm-then-multi-scroll lifecycle was accepted as a stable publication phase');
  const droppedProducerFalsy = clone(publicationPartial);
  droppedProducerFalsy.profiles.phone.producerErrorWitness.publication
    .falsyObservations.pop();
  assert(!verifyTerminalReport(droppedProducerFalsy, 'selftest-current').ok,
    'a pending producer publication dropped a retained falsy observation');
  const droppedProducerCommand = clone(publicationPartial);
  const publicationCommandIndex = droppedProducerCommand.profiles.phone.commandLedger
    .findIndex((command) => command.label === producerPartialStages.publication);
  droppedProducerCommand.profiles.phone.commandLedger.splice(publicationCommandIndex, 1);
  assert(publicationCommandIndex >= 0
    && !verifyTerminalReport(droppedProducerCommand, 'selftest-current').ok,
  'a pending producer publication dropped a paired target/heartbeat command');
  const droppedProducerWitnessCommand = clone(publicationPartial);
  droppedProducerWitnessCommand.profiles.phone.producerErrorWitness.commands.pop();
  assert(!verifyTerminalReport(droppedProducerWitnessCommand, 'selftest-current').ok,
    'a pending producer witness dropped a command while the outer ledger retained it');
  const shiftProducerCommand = (command, deltaMs) => {
    const shifted = clone(command);
    shifted.issuedAtMs += deltaMs;
    shifted.phaseDeadlineMs += deltaMs;
    shifted.commandDeadlineMs += deltaMs;
    shifted.target.completedAtMs += deltaMs;
    shifted.heartbeat.completedAtMs += deltaMs;
    return shifted;
  };
  const duplicatedProducerCommand = clone(publicationPartial);
  const duplicatedLedger = duplicatedProducerCommand.profiles.phone.commandLedger;
  const originalPublicationIndex = duplicatedLedger.findIndex((command) =>
    command.label === producerPartialStages.publication);
  const duplicatePublicationCommand = shiftProducerCommand(
    duplicatedLedger[originalPublicationIndex], 40,
  );
  const shiftedPublicationFailure = shiftProducerCommand(
    duplicatedLedger[originalPublicationIndex + 1], 80,
  );
  duplicatedLedger.splice(
    originalPublicationIndex + 1, 1,
    duplicatePublicationCommand, shiftedPublicationFailure,
  );
  duplicatedProducerCommand.partialFailure.command = clone(shiftedPublicationFailure);
  assert(!verifyTerminalReport(duplicatedProducerCommand, 'selftest-current').ok,
    'an extra serial producer publication command escaped its retained observation count');
  const futureProducerRecovery = clone(publicationPartial);
  futureProducerRecovery.profiles.phone.producerErrorWitness.recovery
    = clone(fullPhoneProducerWitness.recovery);
  assert(!verifyTerminalReport(futureProducerRecovery, 'selftest-current').ok,
    'a publication-stage partial injected future recovery evidence');
  let filterCommandSerial = 0;
  const retimeFilterCandidateCommand = (template, label) => {
    const command = clone(template);
    const issuedAtMs = 10_000 + filterCommandSerial++ * 100;
    const delta = issuedAtMs - command.issuedAtMs;
    command.label = label;
    command.issuedAtMs += delta;
    command.phaseDeadlineMs += delta;
    command.commandDeadlineMs += delta;
    command.target.completedAtMs += delta;
    command.heartbeat.completedAtMs += delta;
    return command;
  };
  const shiftFilterCandidateCommand = (template, deltaMs) => {
    const command = clone(template);
    command.issuedAtMs += deltaMs;
    command.phaseDeadlineMs += deltaMs;
    command.commandDeadlineMs += deltaMs;
    command.target.completedAtMs += deltaMs;
    command.heartbeat.completedAtMs += deltaMs;
    return command;
  };
  const retimeFilterRawCommand = (template, label, method, error) => {
    const command = clone(template);
    const issuedAtMs = 10_000 + filterCommandSerial++ * 100;
    command.label = label; command.method = method; command.error = error;
    command.issuedAtMs = issuedAtMs;
    command.completedAtMs = issuedAtMs + command.durationMs;
    return command;
  };
  const transitionStageNames = (transition, { terminal = true, throughSelection = false } = {}) => {
    const name = transition.expectedQuery || '<clear>';
    const stages = [
      ...(transition.entryMode === 'visible'
        ? [`focus visible filter ${name}`]
        : [`search ${name} target`, `search ${name} mouse press`, `search ${name} mouse release`]),
      `filter ${name} input focus`, `filter ${name} before shortcut telemetry`,
      `filter ${name} select-all key a down`, `filter ${name} select-all key a up`,
      `filter ${name} full selection`,
    ];
    if (throughSelection) return stages;
    stages.push(
      `filter ${name} delete key Backspace down`, `filter ${name} delete key Backspace up`,
      `filter ${name} input cleared`, `filter ${name} cleared telemetry`,
      ...(transition.expectedQuery ? [`insert filter ${name}`] : []),
      `filter ${name} exact input`, `filter ${name} exact input telemetry`,
      ...(transition.entryMode === 'reopen'
        ? ['ordinary Compendium reopen target', 'ordinary Compendium reopen mouse press',
          'ordinary Compendium reopen mouse release']
        : [`filter ${name} submit key Enter down`, `filter ${name} submit key Enter up`]),
      ...(terminal ? [`filter ${name}`] : []),
    );
    return stages;
  };
  const transitionObservationCommands = (transition) => {
    const name = transition.expectedQuery || '<clear>';
    const commands = [];
    const addCandidate = (label, count = 1) => {
      for (let index = 0; index < count; index += 1) {
        commands.push(retimeFilterCandidateCommand(candidateReady.ledger[0], label));
      }
    };
    if (transition.entryTarget !== null && transition.entryTarget.observationCount > 0) {
      addCandidate(`search ${name} target`, transition.entryTarget.observationCount);
    }
    for (const [group, label, precedingTelemetry] of [
      [transition.focus, `filter ${name} input focus`, null],
      [transition.selection, `filter ${name} full selection`, transition.beforeShortcut],
      [transition.cleared, `filter ${name} input cleared`, null],
      [transition.exactInput, `filter ${name} exact input`, transition.afterClear],
    ]) {
      if (precedingTelemetry !== null) {
        addCandidate(label === `filter ${name} full selection`
          ? `filter ${name} before shortcut telemetry`
          : `filter ${name} cleared telemetry`);
      }
      for (let index = 0; index < group.observationCount; index += 1) {
        addCandidate(label);
      }
    }
    if (transition.inputTelemetry !== null) {
      addCandidate(`filter ${name} exact input telemetry`);
    }
    if (transition.reopenTarget !== null && transition.reopenTarget.observationCount > 0) {
      addCandidate(
        'ordinary Compendium reopen target', transition.reopenTarget.observationCount,
      );
    }
    addCandidate(`filter ${name}`, transition.observationCount);
    return commands;
  };
  const baseCompletedStages = [
    ...bootSnapshotStages, ...fixtureSetupStages, ...producerStagesComplete,
    ...listReviewStages, ...focusReviewStages, 'Compendium open',
  ];
  const baseProducerLedger = clone(producerLedgerComplete);
  const firstTransition = clone(phone.phases.filterTransitions[0]);
  const firstTransitionStages = transitionStageNames(firstTransition);
  const firstTransitionLedger = transitionObservationCommands(firstTransition);
  const filterTimeoutPartial = clone(productPartial);
  const pendingBeacon = clone(phone.phases.filterTransitions[1]);
  pendingBeacon.observationCount = pendingBeacon.falsyObservations.length;
  pendingBeacon.settled = null;
  pendingBeacon.generationDelta = null;
  const pendingBeaconStages = transitionStageNames(pendingBeacon, { terminal: false });
  const pendingBeaconLedger = transitionObservationCommands(pendingBeacon);
  const filterTimeoutCommand = retimeFilterCandidateCommand(
    candidateBothTimeout.failure.command, 'filter Compendium Filter Beacon',
  );
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
  filterTimeoutPartial.profiles.phone.completedStages = [
    ...baseCompletedStages, ...firstTransitionStages,
    ...snapshotStageGroup('middle rows'), ...snapshotStageGroup('last rows'),
    ...pendingBeaconStages,
  ];
  filterTimeoutPartial.profiles.phone.commandLedger = [
    ...clone(baseProducerLedger), ...clone(firstTransitionLedger),
    ...clone(pendingBeaconLedger), clone(filterTimeoutCommand),
  ];
  filterTimeoutPartial.profiles.phone.filterTransitions = [
    firstTransition, pendingBeacon,
  ];
  assert(verifyTerminalReport(filterTimeoutPartial, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'filter-timeout partial report lost its completed/pending transition witness');
  const lostAcceptedSearchTarget = clone(filterTimeoutPartial);
  const lostSearchTargetGroup = lostAcceptedSearchTarget.profiles.phone
    .filterTransitions[1].entryTarget;
  lostSearchTargetGroup.accepted = null;
  lostSearchTargetGroup.falsyObservations.push({ ready: false, x: null, y: null });
  assert(!verifyTerminalReport(lostAcceptedSearchTarget, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'a completed Search target was rewritten as an all-falsy pending target witness');
  const beaconSearchTargetFailure = clone(filterTimeoutPartial);
  const pendingBeaconAtSearchTarget = clone(phone.phases.filterTransitions[1]);
  pendingBeaconAtSearchTarget.entryTarget = {
    observationCount: 1,
    falsyObservations: [{ ready: false, x: null, y: null }],
    accepted: null,
  };
  pendingBeaconAtSearchTarget.focus = {
    observationCount: 0, falsyObservations: [], accepted: null,
  };
  pendingBeaconAtSearchTarget.beforeShortcut = null;
  pendingBeaconAtSearchTarget.selection = {
    observationCount: 0, falsyObservations: [], accepted: null,
  };
  pendingBeaconAtSearchTarget.cleared = {
    observationCount: 0, falsyObservations: [], accepted: null,
  };
  pendingBeaconAtSearchTarget.afterClear = null;
  pendingBeaconAtSearchTarget.exactInput = {
    observationCount: 0, falsyObservations: [], accepted: null,
  };
  pendingBeaconAtSearchTarget.inputTelemetry = null;
  pendingBeaconAtSearchTarget.baselineGeneration = null;
  pendingBeaconAtSearchTarget.observationCount = 0;
  pendingBeaconAtSearchTarget.falsyObservations = [];
  pendingBeaconAtSearchTarget.settled = null;
  pendingBeaconAtSearchTarget.generationDelta = null;
  const pendingBeaconAtSearchTargetLedger = transitionObservationCommands(
    pendingBeaconAtSearchTarget,
  );
  const searchTargetFailureCommand = retimeFilterCandidateCommand(
    candidateBothTimeout.failure.command, 'search Compendium Filter Beacon target',
  );
  beaconSearchTargetFailure.findings = [
    'instrument: phone search Compendium Filter Beacon target: root heartbeat failed',
  ];
  beaconSearchTargetFailure.partialFailure.lastCompletedStage = 'last rows DOM counters';
  beaconSearchTargetFailure.partialFailure.failingStage = searchTargetFailureCommand.label;
  beaconSearchTargetFailure.partialFailure.command = clone(searchTargetFailureCommand);
  beaconSearchTargetFailure.profiles.phone.lastCompletedStage = 'last rows DOM counters';
  beaconSearchTargetFailure.profiles.phone.failingStage = searchTargetFailureCommand.label;
  beaconSearchTargetFailure.profiles.phone.completedStages = [
    ...baseCompletedStages, ...firstTransitionStages,
    ...snapshotStageGroup('middle rows'), ...snapshotStageGroup('last rows'),
  ];
  beaconSearchTargetFailure.profiles.phone.commandLedger = [
    ...clone(baseProducerLedger), ...clone(firstTransitionLedger),
    ...pendingBeaconAtSearchTargetLedger,
    clone(searchTargetFailureCommand),
  ];
  beaconSearchTargetFailure.profiles.phone.filterTransitions = [
    clone(firstTransition), pendingBeaconAtSearchTarget,
  ];
  const beaconSearchTargetFailureCheck = verifyTerminalReport(
    beaconSearchTargetFailure, 'selftest-current', {
    verifyArtifact: partialArtifact,
    },
  );
  assert(beaconSearchTargetFailureCheck.ok,
    `a Search target failure lost its healthy falsy poll plus exact failed attempt: ${beaconSearchTargetFailureCheck.errors.join('; ')}`);
  const searchTargetMissingLastRows = clone(beaconSearchTargetFailure);
  searchTargetMissingLastRows.profiles.phone.completedStages
    = searchTargetMissingLastRows.profiles.phone.completedStages.filter((stage) =>
      !snapshotStageGroup('last rows').includes(stage));
  searchTargetMissingLastRows.partialFailure.lastCompletedStage = 'middle rows DOM counters';
  searchTargetMissingLastRows.profiles.phone.lastCompletedStage = 'middle rows DOM counters';
  assert(!verifyTerminalReport(searchTargetMissingLastRows, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'a second filter Search failure omitted its source-prior last-row snapshot');
  const crossStageLedgerSwap = clone(filterTimeoutPartial);
  const beaconFocusCommandIndex = crossStageLedgerSwap.profiles.phone.commandLedger
    .findIndex((command) => command.label === 'filter Compendium Filter Beacon input focus');
  const beaconSelectionCommandIndex = crossStageLedgerSwap.profiles.phone.commandLedger
    .findIndex((command) => command.label === 'filter Compendium Filter Beacon full selection');
  assert(beaconFocusCommandIndex >= 0 && beaconSelectionCommandIndex > beaconFocusCommandIndex,
    'selftest filter command ledger did not contain ordered focus and selection observations');
  [crossStageLedgerSwap.profiles.phone.commandLedger[beaconFocusCommandIndex].label,
    crossStageLedgerSwap.profiles.phone.commandLedger[beaconSelectionCommandIndex].label]
    = [crossStageLedgerSwap.profiles.phone.commandLedger[beaconSelectionCommandIndex].label,
      crossStageLedgerSwap.profiles.phone.commandLedger[beaconFocusCommandIndex].label];
  assert(!verifyTerminalReport(crossStageLedgerSwap, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'a partial filter ledger reordered selection ahead of focus while preserving counts');
  const duplicatedSearchTargetCommand = clone(filterTimeoutPartial);
  const duplicateTargetLedger = duplicatedSearchTargetCommand.profiles.phone.commandLedger;
  const firstSearchTargetIndex = duplicateTargetLedger.findIndex((command) =>
    command.label === 'search Compendium Filter Beacon target');
  const nextSearchTargetCommand = duplicateTargetLedger[firstSearchTargetIndex + 1];
  const firstSearchTargetCommand = duplicateTargetLedger[firstSearchTargetIndex];
  const targetIssueGap = nextSearchTargetCommand.issuedAtMs
    - firstSearchTargetCommand.issuedAtMs;
  const duplicateTargetShift = Math.floor(targetIssueGap / 2);
  const extraSearchTargetCommand = shiftFilterCandidateCommand(
    firstSearchTargetCommand, duplicateTargetShift,
  );
  assert(firstSearchTargetIndex >= 0
    && nextSearchTargetCommand.label === 'search Compendium Filter Beacon target'
    && Math.max(
      firstSearchTargetCommand.target.completedAtMs,
      firstSearchTargetCommand.heartbeat.completedAtMs,
    ) <= extraSearchTargetCommand.issuedAtMs
    && Math.max(
      extraSearchTargetCommand.target.completedAtMs,
      extraSearchTargetCommand.heartbeat.completedAtMs,
    ) <= nextSearchTargetCommand.issuedAtMs,
  'selftest could not insert one serial duplicate Search target observation');
  duplicateTargetLedger.splice(firstSearchTargetIndex + 1, 0, extraSearchTargetCommand);
  assert(!verifyTerminalReport(duplicatedSearchTargetCommand, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'a serial duplicate Search target command escaped its retained observation count');
  const droppedSearchTargetCommand = clone(filterTimeoutPartial);
  const droppedSearchTargetIndex = droppedSearchTargetCommand.profiles.phone.commandLedger
    .findIndex((command) => command.label === 'search Compendium Filter Beacon target');
  droppedSearchTargetCommand.profiles.phone.commandLedger.splice(droppedSearchTargetIndex, 1);
  assert(droppedSearchTargetIndex >= 0
    && !verifyTerminalReport(droppedSearchTargetCommand, 'selftest-current', {
      verifyArtifact: partialArtifact,
    }).ok, 'a Search target command was dropped without changing its retained observation count');
  const driftedSearchTargetCount = clone(filterTimeoutPartial);
  driftedSearchTargetCount.profiles.phone.filterTransitions[1]
    .entryTarget.falsyObservations.push({ ready: false, x: null, y: null });
  driftedSearchTargetCount.profiles.phone.filterTransitions[1]
    .entryTarget.observationCount++;
  assert(!verifyTerminalReport(driftedSearchTargetCount, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'a Search target witness count grew without its paired candidate command');
  const reorderedSearchTargetCommand = clone(filterTimeoutPartial);
  const reorderedTargetLedger = reorderedSearchTargetCommand.profiles.phone.commandLedger;
  const laterSearchTargetIndex = reorderedTargetLedger.findLastIndex((command) =>
    command.label === 'search Compendium Filter Beacon target');
  const beforeShortcutCommandIndex = reorderedTargetLedger.findIndex((command) =>
    command.label === 'filter Compendium Filter Beacon before shortcut telemetry');
  [reorderedTargetLedger[laterSearchTargetIndex].label,
    reorderedTargetLedger[beforeShortcutCommandIndex].label]
    = [reorderedTargetLedger[beforeShortcutCommandIndex].label,
      reorderedTargetLedger[laterSearchTargetIndex].label];
  assert(laterSearchTargetIndex >= 0 && beforeShortcutCommandIndex > laterSearchTargetIndex
    && !verifyTerminalReport(reorderedSearchTargetCommand, 'selftest-current', {
      verifyArtifact: partialArtifact,
    }).ok, 'a Search target command moved after input focus while preserving label counts');
  const droppedOneShotTelemetryCommand = clone(filterTimeoutPartial);
  const afterClearTelemetryCommandIndex = droppedOneShotTelemetryCommand.profiles.phone.commandLedger
    .findIndex((command) => command.label
      === 'filter Compendium Filter Beacon cleared telemetry');
  droppedOneShotTelemetryCommand.profiles.phone.commandLedger.splice(
    afterClearTelemetryCommandIndex, 1,
  );
  assert(afterClearTelemetryCommandIndex >= 0
    && !verifyTerminalReport(droppedOneShotTelemetryCommand, 'selftest-current', {
      verifyArtifact: partialArtifact,
    }).ok, 'a partial filter ledger dropped its successful one-shot cleared telemetry command');
  const lateFailureRelabeledEarly = clone(filterTimeoutPartial);
  const earlyLabel = 'filter Compendium Filter Beacon input focus';
  lateFailureRelabeledEarly.partialFailure.failingStage = earlyLabel;
  lateFailureRelabeledEarly.partialFailure.command.label = earlyLabel;
  lateFailureRelabeledEarly.profiles.phone.failingStage = earlyLabel;
  lateFailureRelabeledEarly.profiles.phone.commandLedger.at(-1).label = earlyLabel;
  assert(!verifyTerminalReport(lateFailureRelabeledEarly, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'a late filter failure was laundered into an already-completed early focus stage');
  const droppedTerminalFalsy = clone(filterTimeoutPartial);
  droppedTerminalFalsy.profiles.phone.filterTransitions[1].falsyObservations.pop();
  assert(!verifyTerminalReport(droppedTerminalFalsy, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'a pending terminal filter poll dropped a retained falsy product state');
  const pendingSuccessLabeledFalsy = clone(filterTimeoutPartial);
  const pendingTransition = pendingSuccessLabeledFalsy.profiles.phone.filterTransitions[1];
  pendingTransition.falsyObservations[0] = {
    ...clone(phone.phases.filterTransitions[1].settled), ready: false,
  };
  assert(!verifyTerminalReport(pendingSuccessLabeledFalsy, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'a pending terminal filter poll labeled a success-semantic state falsy');
  const droppedTerminalCommand = clone(filterTimeoutPartial);
  const terminalCommandIndex = droppedTerminalCommand.profiles.phone.commandLedger
    .findIndex((command) => command.label === 'filter Compendium Filter Beacon'
      && command.target.status === 'fulfilled');
  droppedTerminalCommand.profiles.phone.commandLedger.splice(terminalCommandIndex, 1);
  assert(terminalCommandIndex >= 0
    && !verifyTerminalReport(droppedTerminalCommand, 'selftest-current', {
      verifyArtifact: partialArtifact,
    }).ok, 'a pending terminal filter poll dropped its healthy paired command');
  const droppedCompletedTerminalCommand = clone(filterTimeoutPartial);
  const completedTerminalCommandIndex = droppedCompletedTerminalCommand.profiles.phone.commandLedger
    .findIndex((command) => command.label === 'filter Same Seed Sentinel');
  droppedCompletedTerminalCommand.profiles.phone.commandLedger.splice(
    completedTerminalCommandIndex, 1,
  );
  assert(completedTerminalCommandIndex >= 0
    && !verifyTerminalReport(droppedCompletedTerminalCommand, 'selftest-current', {
      verifyArtifact: partialArtifact,
    }).ok, 'a completed filter dropped one falsy/accepted terminal paired command');
  const droppedFocusFalsy = clone(filterTimeoutPartial);
  droppedFocusFalsy.profiles.phone.filterTransitions[1].focus.falsyObservations.pop();
  assert(!verifyTerminalReport(droppedFocusFalsy, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'a pending filter witness dropped a focus observation');
  const droppedExactInputCommand = clone(filterTimeoutPartial);
  const exactInputCommandIndex = droppedExactInputCommand.profiles.phone.commandLedger
    .findIndex((command) => command.label === 'filter Compendium Filter Beacon exact input');
  droppedExactInputCommand.profiles.phone.commandLedger.splice(exactInputCommandIndex, 1);
  assert(exactInputCommandIndex >= 0
    && !verifyTerminalReport(droppedExactInputCommand, 'selftest-current', {
      verifyArtifact: partialArtifact,
    }).ok, 'a pending filter witness dropped an exact-input paired command');
  const beaconBackspacePartial = clone(filterTimeoutPartial);
  const pendingBeaconAtBackspace = clone(phone.phases.filterTransitions[1]);
  pendingBeaconAtBackspace.cleared = {
    observationCount: 0, falsyObservations: [], accepted: null,
  };
  pendingBeaconAtBackspace.afterClear = null;
  pendingBeaconAtBackspace.exactInput = {
    observationCount: 0, falsyObservations: [], accepted: null,
  };
  pendingBeaconAtBackspace.inputTelemetry = null;
  pendingBeaconAtBackspace.baselineGeneration = null;
  pendingBeaconAtBackspace.observationCount = 0;
  pendingBeaconAtBackspace.falsyObservations = [];
  pendingBeaconAtBackspace.settled = null;
  pendingBeaconAtBackspace.generationDelta = null;
  const pendingBeaconSelectionLedger = transitionObservationCommands(pendingBeaconAtBackspace);
  const beaconBackspaceCommand = retimeFilterRawCommand(
    rawHeapFailure.compendiumCommand,
    'filter Compendium Filter Beacon delete key Backspace down',
    'Input.dispatchKeyEvent', 'selftest Backspace transport failure',
  );
  beaconBackspacePartial.findings = [
    `instrument: phone ${beaconBackspaceCommand.label}: Input.dispatchKeyEvent failed under the `
      + `${beaconBackspaceCommand.timeoutMs}ms transport cap (${beaconBackspaceCommand.error})`,
  ];
  beaconBackspacePartial.partialFailure.lastCompletedStage
    = 'filter Compendium Filter Beacon full selection';
  beaconBackspacePartial.partialFailure.failingStage = beaconBackspaceCommand.label;
  beaconBackspacePartial.partialFailure.command = clone(beaconBackspaceCommand);
  beaconBackspacePartial.profiles.phone.lastCompletedStage
    = 'filter Compendium Filter Beacon full selection';
  beaconBackspacePartial.profiles.phone.failingStage = beaconBackspaceCommand.label;
  beaconBackspacePartial.profiles.phone.completedStages = [
    ...baseCompletedStages, ...firstTransitionStages,
    ...snapshotStageGroup('middle rows'), ...snapshotStageGroup('last rows'),
    ...transitionStageNames(pendingBeaconAtBackspace, { throughSelection: true }),
  ];
  beaconBackspacePartial.profiles.phone.commandLedger = [
    ...clone(baseProducerLedger), ...clone(firstTransitionLedger),
    ...clone(pendingBeaconSelectionLedger),
    clone(beaconBackspaceCommand),
  ];
  beaconBackspacePartial.profiles.phone.filterTransitions = [
    clone(firstTransition), pendingBeaconAtBackspace,
  ];
  assert(verifyTerminalReport(beaconBackspacePartial, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'Beacon Backspace failure with its exact prior transition prefix was rejected');
  const secondFilterBeforeLastRows = clone(beaconBackspacePartial);
  const secondFilterStages = transitionStageNames(
    pendingBeaconAtBackspace, { throughSelection: true },
  );
  const secondFilterStageSet = new Set(secondFilterStages);
  secondFilterBeforeLastRows.profiles.phone.completedStages
    = secondFilterBeforeLastRows.profiles.phone.completedStages.filter((stage) =>
      !secondFilterStageSet.has(stage));
  const secondFilterLastRowsStart = secondFilterBeforeLastRows.profiles.phone.completedStages
    .indexOf('last rows animation task');
  secondFilterBeforeLastRows.profiles.phone.completedStages.splice(
    secondFilterLastRowsStart, 0, ...secondFilterStages,
  );
  secondFilterBeforeLastRows.partialFailure.lastCompletedStage = 'last rows DOM counters';
  secondFilterBeforeLastRows.profiles.phone.lastCompletedStage = 'last rows DOM counters';
  assert(secondFilterLastRowsStart >= 0
    && !verifyTerminalReport(secondFilterBeforeLastRows, 'selftest-current', {
      verifyArtifact: partialArtifact,
    }).ok, 'the second filter proof block was accepted before its last-row source anchor');
  const droppedSelectAllPredecessor = clone(beaconBackspacePartial);
  droppedSelectAllPredecessor.profiles.phone.completedStages
    = droppedSelectAllPredecessor.profiles.phone.completedStages.filter((stage) =>
      stage !== 'filter Compendium Filter Beacon select-all key a down');
  assert(!verifyTerminalReport(droppedSelectAllPredecessor, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'a Backspace failure omitted its native select-all predecessor stage');
  const reorderedSelectAllPredecessor = clone(beaconBackspacePartial);
  const selectDownIndex = reorderedSelectAllPredecessor.profiles.phone.completedStages
    .indexOf('filter Compendium Filter Beacon select-all key a down');
  const selectUpIndex = reorderedSelectAllPredecessor.profiles.phone.completedStages
    .indexOf('filter Compendium Filter Beacon select-all key a up');
  [reorderedSelectAllPredecessor.profiles.phone.completedStages[selectDownIndex],
    reorderedSelectAllPredecessor.profiles.phone.completedStages[selectUpIndex]]
    = [reorderedSelectAllPredecessor.profiles.phone.completedStages[selectUpIndex],
      reorderedSelectAllPredecessor.profiles.phone.completedStages[selectDownIndex]];
  assert(!verifyTerminalReport(reorderedSelectAllPredecessor, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'a Backspace failure reordered native select-all down/up chronology');
  const beaconBackspaceDroppedPrefix = clone(beaconBackspacePartial);
  beaconBackspaceDroppedPrefix.profiles.phone.completedStages
    = beaconBackspaceDroppedPrefix.profiles.phone.completedStages
      .filter((stage) => stage !== 'filter Same Seed Sentinel');
  beaconBackspaceDroppedPrefix.profiles.phone.filterTransitions.shift();
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
  const droppedClearFalsyState = clone(filterTimeoutPartial);
  droppedClearFalsyState.profiles.phone.filterTransitions[1]
    .cleared.falsyObservations.pop();
  assert(!verifyTerminalReport(droppedClearFalsyState, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'a partial filter witness dropped a falsy cleared-state row');
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
    = [...baseCompletedStages, ...firstTransitionStages];
  completedThenLaterFailure.profiles.phone.commandLedger = [
    ...clone(baseProducerLedger), ...clone(firstTransitionLedger),
  ];
  completedThenLaterFailure.profiles.phone.filterTransitions = [
    clone(firstTransition),
  ];
  assert(verifyTerminalReport(completedThenLaterFailure, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'a completed filter witness plus later instrument failure was rejected');
  const allFiltersThenLaterFailure = clone(completedThenLaterFailure);
  const allCompletedTransitions = clone(phone.phases.filterTransitions);
  allFiltersThenLaterFailure.partialFailure.lastCompletedStage = 'filter <clear>';
  allFiltersThenLaterFailure.profiles.phone.lastCompletedStage = 'filter <clear>';
  allFiltersThenLaterFailure.profiles.phone.completedStages = [
    ...baseCompletedStages,
    ...transitionStageNames(allCompletedTransitions[0]),
    ...snapshotStageGroup('middle rows'), ...snapshotStageGroup('last rows'),
    ...transitionStageNames(allCompletedTransitions[1]),
    ...snapshotStageGroup('filtered row'),
    ...transitionStageNames(allCompletedTransitions[2]),
  ];
  allFiltersThenLaterFailure.profiles.phone.commandLedger
    = [...clone(baseProducerLedger),
      ...allCompletedTransitions.flatMap((transition) => transitionObservationCommands(transition))];
  allFiltersThenLaterFailure.profiles.phone.filterTransitions = allCompletedTransitions;
  assert(verifyTerminalReport(allFiltersThenLaterFailure, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'three completed filter transitions plus a later instrument failure were rejected');
  const detailReviewPartial = clone(allFiltersThenLaterFailure);
  detailReviewPartial.findings = ['instrument: post-detail selftest failure'];
  detailReviewPartial.partialFailure.lastCompletedStage = 'review detail';
  detailReviewPartial.partialFailure.failingStage = 'post-detail selftest failure';
  detailReviewPartial.profiles.phone.lastCompletedStage = 'review detail';
  detailReviewPartial.profiles.phone.failingStage = 'post-detail selftest failure';
  detailReviewPartial.reviewPacket.push(clone(detailReviewItem));
  detailReviewPartial.profiles.phone.reviewPacket.push(clone(detailReviewItem));
  const [visibleTransition, hiddenTransition, reopenTransition] = allCompletedTransitions;
  const visibleStages = transitionStageNames(visibleTransition);
  const hiddenStages = transitionStageNames(hiddenTransition);
  const reopenStages = transitionStageNames(reopenTransition);
  detailReviewPartial.profiles.phone.completedStages = [
    ...baseCompletedStages,
    ...visibleStages,
    ...snapshotStageGroup('middle rows'),
    ...snapshotStageGroup('last rows'),
    ...hiddenStages,
    ...snapshotStageGroup('filtered row'),
    ...reopenStages,
    ...snapshotStageGroup('detail'), 'screenshot detail', 'review detail',
  ];
  assert(verifyTerminalReport(detailReviewPartial, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'a source-ordered producer/filter/snapshot/detail partial prefix was rejected');
  for (const base of ['middle rows', 'last rows', 'filtered row', 'detail']) {
    const omittedDetailPrerequisite = clone(detailReviewPartial);
    omittedDetailPrerequisite.profiles.phone.completedStages
      = omittedDetailPrerequisite.profiles.phone.completedStages.filter((stage) =>
        !snapshotStageGroup(base).includes(stage));
    assert(!verifyTerminalReport(omittedDetailPrerequisite, 'selftest-current', {
      verifyArtifact: partialArtifact,
    }).ok, `a detail review retained after deleting the whole ${base} snapshot transaction`);
  }
  for (const [label, stages] of [
    ['visible', visibleStages], ['hidden', hiddenStages], ['reopen', reopenStages],
  ]) {
    const omittedFilterBlock = clone(detailReviewPartial);
    omittedFilterBlock.profiles.phone.completedStages
      = omittedFilterBlock.profiles.phone.completedStages.filter((stage) =>
        !stages.includes(stage));
    assert(!verifyTerminalReport(omittedFilterBlock, 'selftest-current', {
      verifyArtifact: partialArtifact,
    }).ok, `a detail review retained after deleting the whole ${label} filter stage block`);
  }
  const visibleFilterAfterMiddle = clone(detailReviewPartial);
  const visibleFilterStages = visibleFilterAfterMiddle.profiles.phone.completedStages;
  const visibleStart = visibleFilterStages.indexOf(visibleStages[0]);
  const movedVisible = visibleFilterStages.splice(visibleStart, visibleStages.length);
  const middleEnd = visibleFilterStages.indexOf('middle rows DOM counters');
  visibleFilterStages.splice(middleEnd + 1, 0, ...movedVisible);
  assert(visibleStart >= 0 && middleEnd >= 0
    && !verifyTerminalReport(visibleFilterAfterMiddle, 'selftest-current', {
      verifyArtifact: partialArtifact,
    }).ok, 'the visible filter proof block was accepted after its dependent middle snapshot');
  const reopenTerminalFailure = clone(filterTimeoutPartial);
  const pendingClearTransition = clone(phone.phases.filterTransitions[2]);
  pendingClearTransition.observationCount = pendingClearTransition.falsyObservations.length;
  pendingClearTransition.settled = null;
  pendingClearTransition.generationDelta = null;
  const completedBeforeClear = clone(phone.phases.filterTransitions.slice(0, 2));
  const reopenTerminalLedger = [
    ...completedBeforeClear.flatMap((transition) => transitionObservationCommands(transition)),
    ...transitionObservationCommands(pendingClearTransition),
  ];
  const reopenTerminalCommand = retimeFilterCandidateCommand(
    candidateBothTimeout.failure.command, 'filter <clear>',
  );
  reopenTerminalFailure.findings = [
    'instrument: phone filter <clear>: root heartbeat failed',
  ];
  reopenTerminalFailure.partialFailure.lastCompletedStage
    = 'ordinary Compendium reopen mouse release';
  reopenTerminalFailure.partialFailure.failingStage = reopenTerminalCommand.label;
  reopenTerminalFailure.partialFailure.command = clone(reopenTerminalCommand);
  reopenTerminalFailure.profiles.phone.lastCompletedStage
    = 'ordinary Compendium reopen mouse release';
  reopenTerminalFailure.profiles.phone.failingStage = reopenTerminalCommand.label;
  reopenTerminalFailure.profiles.phone.completedStages = [
    ...baseCompletedStages,
    ...transitionStageNames(completedBeforeClear[0]),
    ...snapshotStageGroup('middle rows'), ...snapshotStageGroup('last rows'),
    ...transitionStageNames(completedBeforeClear[1]),
    ...snapshotStageGroup('filtered row'),
    ...transitionStageNames(pendingClearTransition, { terminal: false }),
  ];
  reopenTerminalFailure.profiles.phone.commandLedger = [
    ...clone(baseProducerLedger), ...reopenTerminalLedger, clone(reopenTerminalCommand),
  ];
  reopenTerminalFailure.profiles.phone.filterTransitions = [
    ...completedBeforeClear, pendingClearTransition,
  ];
  const reopenTerminalFailureCheck = verifyTerminalReport(
    reopenTerminalFailure, 'selftest-current', { verifyArtifact: partialArtifact },
  );
  assert(reopenTerminalFailureCheck.ok,
    `a post-reopen terminal filter failure was rejected: ${reopenTerminalFailureCheck.errors.join('; ')}`);
  const reopenMissingFilteredRows = clone(reopenTerminalFailure);
  reopenMissingFilteredRows.profiles.phone.completedStages
    = reopenMissingFilteredRows.profiles.phone.completedStages.filter((stage) =>
      !snapshotStageGroup('filtered row').includes(stage));
  assert(!verifyTerminalReport(reopenMissingFilteredRows, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'a reopen filter failure omitted its source-prior filtered-row snapshot');
  const reopenBeforeFilteredRows = clone(reopenTerminalFailure);
  const pendingReopenStages = transitionStageNames(
    pendingClearTransition, { terminal: false },
  );
  const pendingReopenStageSet = new Set(pendingReopenStages);
  reopenBeforeFilteredRows.profiles.phone.completedStages
    = reopenBeforeFilteredRows.profiles.phone.completedStages.filter((stage) =>
      !pendingReopenStageSet.has(stage));
  const filteredRowsStart = reopenBeforeFilteredRows.profiles.phone.completedStages
    .indexOf('filtered row animation task');
  reopenBeforeFilteredRows.profiles.phone.completedStages.splice(
    filteredRowsStart, 0, ...pendingReopenStages,
  );
  reopenBeforeFilteredRows.partialFailure.lastCompletedStage = 'filtered row DOM counters';
  reopenBeforeFilteredRows.profiles.phone.lastCompletedStage = 'filtered row DOM counters';
  assert(filteredRowsStart >= 0
    && !verifyTerminalReport(reopenBeforeFilteredRows, 'selftest-current', {
      verifyArtifact: partialArtifact,
    }).ok, 'the reopen filter proof block was accepted before its filtered-row source anchor');
  const lostAcceptedReopenTarget = clone(reopenTerminalFailure);
  const lostReopenTargetGroup = lostAcceptedReopenTarget.profiles.phone
    .filterTransitions[2].reopenTarget;
  lostReopenTargetGroup.accepted = null;
  lostReopenTargetGroup.falsyObservations.push({ ready: false, x: null, y: null });
  assert(!verifyTerminalReport(lostAcceptedReopenTarget, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'a completed ordinary reopen target was rewritten as all-falsy before terminal failure');
  const duplicatedReopenTargetCommand = clone(allFiltersThenLaterFailure);
  const duplicateReopenLedger = duplicatedReopenTargetCommand.profiles.phone.commandLedger;
  const firstReopenTargetIndex = duplicateReopenLedger.findIndex((command) =>
    command.label === 'ordinary Compendium reopen target');
  const nextReopenTargetCommand = duplicateReopenLedger[firstReopenTargetIndex + 1];
  const firstReopenTargetCommand = duplicateReopenLedger[firstReopenTargetIndex];
  const reopenTargetShift = Math.floor(
    (nextReopenTargetCommand.issuedAtMs - firstReopenTargetCommand.issuedAtMs) / 2,
  );
  const extraReopenTargetCommand = shiftFilterCandidateCommand(
    firstReopenTargetCommand, reopenTargetShift,
  );
  assert(firstReopenTargetIndex >= 0
    && nextReopenTargetCommand.label === 'ordinary Compendium reopen target'
    && Math.max(
      firstReopenTargetCommand.target.completedAtMs,
      firstReopenTargetCommand.heartbeat.completedAtMs,
    ) <= extraReopenTargetCommand.issuedAtMs
    && Math.max(
      extraReopenTargetCommand.target.completedAtMs,
      extraReopenTargetCommand.heartbeat.completedAtMs,
    ) <= nextReopenTargetCommand.issuedAtMs,
  'selftest could not insert one serial duplicate ordinary reopen target observation');
  duplicateReopenLedger.splice(firstReopenTargetIndex + 1, 0, extraReopenTargetCommand);
  assert(!verifyTerminalReport(duplicatedReopenTargetCommand, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'a serial duplicate ordinary reopen target escaped its retained observation count');
  const droppedReopenTargetCommand = clone(allFiltersThenLaterFailure);
  const droppedReopenIndex = droppedReopenTargetCommand.profiles.phone.commandLedger
    .findIndex((command) => command.label === 'ordinary Compendium reopen target');
  droppedReopenTargetCommand.profiles.phone.commandLedger.splice(droppedReopenIndex, 1);
  assert(droppedReopenIndex >= 0
    && !verifyTerminalReport(droppedReopenTargetCommand, 'selftest-current', {
      verifyArtifact: partialArtifact,
    }).ok, 'an ordinary reopen target command was dropped without its witness count');
  const driftedReopenTargetCount = clone(allFiltersThenLaterFailure);
  driftedReopenTargetCount.profiles.phone.filterTransitions[2]
    .reopenTarget.falsyObservations.push({ ready: false, x: null, y: null });
  driftedReopenTargetCount.profiles.phone.filterTransitions[2]
    .reopenTarget.observationCount++;
  assert(!verifyTerminalReport(driftedReopenTargetCount, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'ordinary reopen target witness count grew without a candidate command');
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
  rawHeapPartial.partialFailure.lastCompletedStage = 'main initial garbage collection';
  rawHeapPartial.partialFailure.failingStage = 'main initial heap usage';
  rawHeapPartial.partialFailure.command = clone(rawHeapFailure.compendiumCommand);
  rawHeapPartial.profiles.phone.lastCompletedStage = 'main initial garbage collection';
  rawHeapPartial.profiles.phone.failingStage = 'main initial heap usage';
  rawHeapPartial.profiles.phone.completedStages = [
    ...snapshotStageGroup('fresh lazy-control'),
    'main initial animation task', 'main initial garbage collection',
  ];
  rawHeapPartial.profiles.phone.commandLedger = [clone(rawHeapFailure.compendiumCommand)];
  rawHeapPartial.profiles.phone.producerErrorWitness = null;
  rawHeapPartial.profiles.phone.reviewPacket = [];
  rawHeapPartial.reviewPacket = [];
  assert(verifyTerminalReport(rawHeapPartial, 'selftest-current').ok,
    'post-GC raw heap failure did not retain exact completed/failing/method evidence');
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
  const desktopPartialReport = clone(rawHeapPartial);
  const desktopPartialMeasurement = desktopPartialReport.profiles.phone;
  desktopPartialMeasurement.profile = 'desktop';
  desktopPartialMeasurement.viewport = { ...desktopViewport };
  desktopPartialMeasurement.reviewPacket = [];
  desktopPartialMeasurement.commandLedger[0].profile = 'desktop';
  desktopPartialReport.partialFailure.profile = 'desktop';
  desktopPartialReport.partialFailure.command.profile = 'desktop';
  desktopPartialReport.findings = [
    `instrument: desktop ${desktopPartialReport.partialFailure.command.label}: `
      + `${desktopPartialReport.partialFailure.command.method} failed under the `
      + `${desktopPartialReport.partialFailure.command.timeoutMs}ms transport cap `
      + `(${desktopPartialReport.partialFailure.command.error})`,
  ];
  desktopPartialReport.profiles = {
    phone: clone(report.profiles.phone), desktop: desktopPartialMeasurement,
  };
  desktopPartialReport.reviewPacket = [];
  const desktopPartialCheck = verifyTerminalReport(desktopPartialReport, 'selftest-current');
  assert(desktopPartialCheck.ok,
    `phone-complete plus desktop-partial collection prefix was rejected: ${desktopPartialCheck.errors.join('; ')}`);
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
  const earlierHealthy = shiftCandidateCommand(candidateReady.ledger[0], 2500);
  earlierHealthy.label = 'list thumb settlement';
  const shiftedTerminal = shiftCandidateCommand(candidateTargetTimeout.failure.command, 3000);
  twoCommandPartial.partialFailure.command = clone(shiftedTerminal);
  twoCommandPartial.profiles.phone.commandLedger = [
    ...clone(baseProducerLedger), clone(earlierHealthy), clone(shiftedTerminal),
  ];
  assert(verifyTerminalReport(twoCommandPartial, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'serial same-profile/same-browser partial command ledger was rejected');
  const retriedCandidateFailure = clone(twoCommandPartial);
  retriedCandidateFailure.profiles.phone.commandLedger[
    retriedCandidateFailure.profiles.phone.commandLedger.length - 2
  ] = clone(candidateTargetTimeout.failure.command);
  assert(!verifyTerminalReport(retriedCandidateFailure, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'a failed candidate command was followed by another command/retry');
  const healthyClaimedAsFailure = clone(productPartial);
  healthyClaimedAsFailure.status = 'instrument-fail';
  healthyClaimedAsFailure.findings = ['instrument: healthy command claimed as failure'];
  healthyClaimedAsFailure.partialFailure.classification = 'instrument';
  healthyClaimedAsFailure.partialFailure.command = clone(earlierHealthy);
  healthyClaimedAsFailure.profiles.phone.commandLedger = [
    ...clone(baseProducerLedger), clone(earlierHealthy),
  ];
  assert(!verifyTerminalReport(healthyClaimedAsFailure, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'a healthy candidate observation was accepted as the reported failure command');
  const earlierWrongProfile = clone(twoCommandPartial);
  earlierWrongProfile.profiles.phone.commandLedger.at(-2).profile = 'desktop';
  assert(!verifyTerminalReport(earlierWrongProfile, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'an earlier partial-ledger command escaped its enclosing profile');
  const earlierWrongProduct = clone(twoCommandPartial);
  earlierWrongProduct.profiles.phone.commandLedger.at(-2).heartbeat.product = 'Chrome/Other';
  assert(!verifyTerminalReport(earlierWrongProduct, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'an earlier fulfilled heartbeat escaped terminal browser provenance');
  const earlierUnownedStage = clone(twoCommandPartial);
  earlierUnownedStage.profiles.phone.commandLedger.at(-2).label = 'unowned earlier stage';
  assert(!verifyTerminalReport(earlierUnownedStage, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'an earlier command escaped completed/failing stage ownership');
  const nonserialLedger = clone(twoCommandPartial);
  const overlappingTerminal = shiftCandidateCommand(candidateTargetTimeout.failure.command, 14);
  nonserialLedger.partialFailure.command = clone(overlappingTerminal);
  nonserialLedger.profiles.phone.commandLedger[nonserialLedger.profiles.phone.commandLedger.length - 1]
    = clone(overlappingTerminal);
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
  const shiftedPageException = shiftCandidateCommand(candidatePageException.failure.command, 3000);
  pageExceptionPartial.partialFailure.command = clone(shiftedPageException);
  pageExceptionPartial.profiles.phone.commandLedger = [
    ...clone(baseProducerLedger), clone(shiftedPageException),
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
        evidenceStatus: 'partial-non-certifying',
        lastCompletedStage: 'main initial heap usage',
        failingStage: 'main initial product/DOM snapshot', completedStages: [
          ...snapshotStageGroup('fresh lazy-control'),
          'main initial animation task', 'main initial garbage collection',
          'main initial heap usage',
        ],
        commandLedger: [clone(plainFailure.compendiumCommand)],
        producerErrorWitness: null, filterTransitions: [],
        reviewPacket: [],
      },
    },
    reviewPacket: [],
    partialFailure: {
      schema: PARTIAL_FAILURE_SCHEMA, classification: 'instrument', profile: 'phone',
      lastCompletedStage: 'main initial heap usage',
      failingStage: 'main initial product/DOM snapshot',
      command: clone(plainFailure.compendiumCommand),
    },
    blockedOutcomes: [...EXPECTED_OUTCOMES],
  };
  assert(verifyTerminalReport(plainInstrumentPartial, 'selftest-current').ok,
    'labeled plain-evaluate failure did not retain valid partial stage/command evidence');
  const missingSnapshotHeapPrefix = clone(plainInstrumentPartial);
  missingSnapshotHeapPrefix.profiles.phone.completedStages.splice(
    missingSnapshotHeapPrefix.profiles.phone.completedStages
      .indexOf('main initial garbage collection'), 1,
  );
  missingSnapshotHeapPrefix.profiles.phone.lastCompletedStage = 'main initial heap usage';
  assert(!verifyTerminalReport(missingSnapshotHeapPrefix, 'selftest-current').ok,
    'snapshot product failure accepted a missing GC substage');
  const reorderedSnapshotPrefix = clone(plainInstrumentPartial);
  const mainAnimationIndex = reorderedSnapshotPrefix.profiles.phone.completedStages
    .indexOf('main initial animation task');
  const mainGarbageIndex = reorderedSnapshotPrefix.profiles.phone.completedStages
    .indexOf('main initial garbage collection');
  [reorderedSnapshotPrefix.profiles.phone.completedStages[mainAnimationIndex],
    reorderedSnapshotPrefix.profiles.phone.completedStages[mainGarbageIndex]] = [
    reorderedSnapshotPrefix.profiles.phone.completedStages[mainGarbageIndex],
    reorderedSnapshotPrefix.profiles.phone.completedStages[mainAnimationIndex],
  ];
  assert(!verifyTerminalReport(reorderedSnapshotPrefix, 'selftest-current').ok,
    'snapshot product failure accepted a reordered rAF/GC prefix');
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
  const crossHostBrowser = clone(report);
  crossHostBrowser.browser.executable = '/usr/bin/microsoft-edge-stable';
  crossHostBrowser.browser.user_agent = 'Linux selftest';
  assert(verifyTerminalReport(crossHostBrowser, 'selftest-current').ok,
    'same exact Arc browser build was rejected solely for a cross-host path/UA');
  const missingPassAuthority = clone(report);
  missingPassAuthority.budget.browserAuthority = null;
  missingPassAuthority.budget.browserAuthorityMatch = null;
  assert(!verifyTerminalReport(missingPassAuthority, 'selftest-current').ok,
    'active PASS without an Arc browser authority was accepted');
  const falsePassAuthority = clone(report);
  falsePassAuthority.budget.browserAuthorityMatch = false;
  assert(!verifyTerminalReport(falsePassAuthority, 'selftest-current').ok,
    'active PASS with a false browser-authority match was accepted');
  const forgedPassAuthority = clone(report);
  forgedPassAuthority.browser.product = 'Chrome/Other';
  forgedPassAuthority.budget.browserAuthorityMatch = true;
  assert(!verifyTerminalReport(forgedPassAuthority, 'selftest-current').ok,
    'forged browserAuthorityMatch true over a different product was accepted');
  const authorityMismatch = clone(report);
  authorityMismatch.status = 'instrument-fail';
  authorityMismatch.browser.product = 'Chrome/Other';
  authorityMismatch.budget.browserAuthorityMatch = false;
  authorityMismatch.outcomes = [];
  authorityMismatch.findings = [
    'instrument: browser does not match the exact Arc 1A calibration authority',
  ];
  authorityMismatch.profiles = {};
  authorityMismatch.reviewPacket = [];
  authorityMismatch.partialFailure = {
    schema: PARTIAL_FAILURE_SCHEMA, classification: 'instrument', profile: null,
    lastCompletedStage: null, failingStage: 'Arc 1A browser authority', command: null,
  };
  authorityMismatch.blockedOutcomes = [...EXPECTED_OUTCOMES];
  assert(verifyTerminalReport(authorityMismatch, 'selftest-current').ok,
    'exact pre-measurement browser-authority mismatch report was rejected');
  const lateAuthorityMismatch = clone(authorityMismatch);
  lateAuthorityMismatch.profiles.phone = clone(phone);
  assert(!verifyTerminalReport(lateAuthorityMismatch, 'selftest-current').ok,
    'browser-authority mismatch retained product measurements');
  const producerAuthorityMismatch = clone(report);
  producerAuthorityMismatch.status = 'instrument-fail';
  producerAuthorityMismatch.browser = null;
  producerAuthorityMismatch.budget.browserAuthorityMatch = null;
  producerAuthorityMismatch.budget.observedProducerAuthority = clone(wrongProducer);
  producerAuthorityMismatch.budget.producerAuthorityMatch = false;
  producerAuthorityMismatch.outcomes = [];
  producerAuthorityMismatch.findings = [
    'instrument: built producer does not match the exact Arc 1A calibration authority',
  ];
  producerAuthorityMismatch.profiles = {};
  producerAuthorityMismatch.reviewPacket = [];
  producerAuthorityMismatch.partialFailure = {
    schema: PARTIAL_FAILURE_SCHEMA, classification: 'instrument', profile: null,
    lastCompletedStage: null, failingStage: 'Arc 1A producer authority', command: null,
  };
  producerAuthorityMismatch.blockedOutcomes = [...EXPECTED_OUTCOMES];
  assert(verifyTerminalReport(producerAuthorityMismatch, 'selftest-current').ok,
    'exact pre-browser producer-authority mismatch report was rejected');
  const lateProducerAuthorityMismatch = clone(producerAuthorityMismatch);
  lateProducerAuthorityMismatch.browser = clone(report.browser);
  lateProducerAuthorityMismatch.budget.browserAuthorityMatch = true;
  lateProducerAuthorityMismatch.profiles.phone = clone(phone);
  assert(!verifyTerminalReport(lateProducerAuthorityMismatch, 'selftest-current').ok,
    'producer-authority mismatch retained browser/product measurements');
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
      budget: {
        ...running.budget, browserAuthorityMatch: null,
        observedProducerAuthority: null, producerAuthorityMatch: null,
      },
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
  calibration.budget.browserAuthority = null;
  calibration.budget.browserAuthorityMatch = null;
  const calibrationEvaluator = compendiumCalibrationEvaluatorBudget(budget.producerAuthority);
  assert(calibrationEvaluator, 'synthetic calibration evaluator was unavailable');
  calibration.outcomes = [
    ...evaluateProfile(calibration.profiles.phone, calibrationEvaluator, fixture),
    ...evaluateProfile(calibration.profiles.desktop, calibrationEvaluator, fixture),
  ];
  calibration.findings = calibration.outcomes
    .filter((outcome) => outcome.status === 'fail').map((outcome) => outcome.diagnosis);
  assert(verifyTerminalReport(calibration, 'selftest-current', { allowCalibration: true }).ok,
    'explicit non-certifying calibration report was rejected');
  assert(!verifyTerminalReport(calibration, 'selftest-current').ok,
    'calibration report was accepted as certifying evidence');
  const calibrationBudget = clone(budget);
  calibrationBudget.status = 'calibration-required';
  calibrationBudget.ceilings = null;
  calibrationBudget.calibration.samples = { phone: [], desktop: [] };
  calibrationBudget.pairedBrokenBaseline.status = 'measurement-required';
  calibrationBudget.pairedBrokenBaseline.collectorCommit = null;
  calibrationBudget.pairedBrokenBaseline.samples = { phone: [], desktop: [] };
  const productionCalibration = verifyCompendiumTerminalReport(
    calibration, 'selftest-current', {
      allowCalibration: true, budgetRecord: calibrationBudget,
      expectedBudgetSha256: calibration.budget.sha256,
      fixture, expectedInputs: calibration.inputs,
      expectedSourceIdentity: calibration.source.begin,
    },
  );
  assert(productionCalibration.ok,
    `production-bound calibration report was rejected: ${productionCalibration.errors.join('; ')}`);
  const calibrationFailure = clone(calibration);
  calibrationFailure.status = 'fail';
  calibrationFailure.profiles.phone.points.first.raw.mountedRowCount = 1500;
  calibrationFailure.profiles.phone.points.first.diagnostics.window.mountedRowCount = 1500;
  calibrationFailure.outcomes = [
    ...evaluateProfile(calibrationFailure.profiles.phone, calibrationEvaluator, fixture),
    ...evaluateProfile(calibrationFailure.profiles.desktop, calibrationEvaluator, fixture),
  ];
  calibrationFailure.findings = calibrationFailure.outcomes
    .filter((outcome) => outcome.status === 'fail').map((outcome) => outcome.diagnosis);
  assert(calibrationFailure.findings.length > 0 && verifyCompendiumTerminalReport(
    calibrationFailure, 'selftest-current', {
      allowCalibration: true, budgetRecord: calibrationBudget,
      expectedBudgetSha256: calibration.budget.sha256,
      fixture, expectedInputs: calibration.inputs,
      expectedSourceIdentity: calibration.source.begin,
    },
  ).ok, 'truthful product FAIL during calibration was rejected');
  const missingCalibrationFailureFindings = clone(calibrationFailure);
  missingCalibrationFailureFindings.findings = [];
  assert(!verifyCompendiumTerminalReport(
    missingCalibrationFailureFindings, 'selftest-current', {
      allowCalibration: true, budgetRecord: calibrationBudget,
      expectedBudgetSha256: calibration.budget.sha256,
      fixture, expectedInputs: calibration.inputs,
      expectedSourceIdentity: calibration.source.begin,
    },
  ).ok, 'calibration-mode FAIL omitted its replayed failed-outcome findings');
  const staleCalibrationFailureFindings = clone(calibrationFailure);
  staleCalibrationFailureFindings.findings[0] = 'stale copied calibration failure';
  assert(!verifyCompendiumTerminalReport(
    staleCalibrationFailureFindings, 'selftest-current', {
      allowCalibration: true, budgetRecord: calibrationBudget,
      expectedBudgetSha256: calibration.budget.sha256,
      fixture, expectedInputs: calibration.inputs,
      expectedSourceIdentity: calibration.source.begin,
    },
  ).ok, 'calibration-mode FAIL replaced a replayed diagnosis with stale summary text');
  const reorderedCalibrationFailureFindings = clone(calibrationFailure);
  reorderedCalibrationFailureFindings.profiles.phone.points.first
    .raw.listImages[0].naturalWidth = 440;
  reorderedCalibrationFailureFindings.profiles.phone.points.first
    .raw.listImages[0].naturalHeight = 440;
  reorderedCalibrationFailureFindings.outcomes = [
    ...evaluateProfile(
      reorderedCalibrationFailureFindings.profiles.phone, calibrationEvaluator, fixture,
    ),
    ...evaluateProfile(
      reorderedCalibrationFailureFindings.profiles.desktop, calibrationEvaluator, fixture,
    ),
  ];
  reorderedCalibrationFailureFindings.findings
    = reorderedCalibrationFailureFindings.outcomes
      .filter((outcome) => outcome.status === 'fail').map((outcome) => outcome.diagnosis);
  assert(reorderedCalibrationFailureFindings.findings.length > 1,
    'selftest could not construct multiple truthful calibration FAIL findings');
  reorderedCalibrationFailureFindings.findings.reverse();
  assert(!verifyCompendiumTerminalReport(
    reorderedCalibrationFailureFindings, 'selftest-current', {
      allowCalibration: true, budgetRecord: calibrationBudget,
      expectedBudgetSha256: calibration.budget.sha256,
      fixture, expectedInputs: calibration.inputs,
      expectedSourceIdentity: calibration.source.begin,
    },
  ).ok, 'calibration-mode FAIL reordered replayed failed-outcome findings');
  const staleCalibrationFailure = clone(calibrationFailure);
  staleCalibrationFailure.profiles.phone.points.first.raw.listImages[0].naturalWidth = 440;
  staleCalibrationFailure.profiles.phone.points.first.raw.listImages[0].naturalHeight = 440;
  assert(!verifyCompendiumTerminalReport(
    staleCalibrationFailure, 'selftest-current', {
      allowCalibration: true, budgetRecord: calibrationBudget,
      expectedBudgetSha256: calibration.budget.sha256,
      fixture, expectedInputs: calibration.inputs,
      expectedSourceIdentity: calibration.source.begin,
    },
  ).ok, 'calibration-mode FAIL copied stale outcomes over changed raw product evidence');
  const staleCalibrationOutcomes = clone(calibration);
  staleCalibrationOutcomes.profiles.phone.points.warm[2]
    .diagnostics.art.keys.cached[
      staleCalibrationOutcomes.profiles.phone.points.warm[2]
        .diagnostics.art.keys.cached.length - 1
    ] = 'zzzz-stale-calibration-key';
  assert(!verifyCompendiumTerminalReport(
    staleCalibrationOutcomes, 'selftest-current', {
      allowCalibration: true, budgetRecord: calibrationBudget,
      expectedBudgetSha256: calibration.budget.sha256,
      fixture, expectedInputs: calibration.inputs,
      expectedSourceIdentity: calibration.source.begin,
    },
  ).ok, 'calibration artifact copied PASS outcomes over changed raw warm evidence');
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
