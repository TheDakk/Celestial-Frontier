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
  COMPENDIUM_BROWSER_HISTORICAL_CAPABILITY_CONTRACT_SHA256S,
  COMPENDIUM_RAW_SNAPSHOT_REQUIRED_TOKENS, DIAGNOSTICS_SCHEMA,
  EXPECTED_OUTCOMES, FILTER_TRANSITION_SCHEMA, OUTCOME_IDS,
  PARTIAL_FAILURE_SCHEMA, PARTIAL_PROFILE_SCHEMA,
  PRODUCER_ERROR_ARM_MESSAGE, PRODUCER_ERROR_ARM_SENTINEL, PRODUCER_ERROR_WITNESS_SCHEMA,
  FOREGROUND_SERVICE_OBSERVATION_SCHEMA, FOREGROUND_SERVICE_RECEIPT_SCHEMA,
  FOREGROUND_SERVICE_RECEIPT_LABELS, FOREGROUND_SERVICE_RECEIPT_TIMEOUT_MS,
  THUMB_SETTLEMENT_OBSERVATION_SCHEMA, THUMB_SETTLEMENT_RECEIPT_SCHEMA,
  THUMB_SETTLEMENT_ACTIVE_SCHEMA, THUMB_SETTLEMENT_RECEIPT_TIMEOUT_MS,
  THUMB_SETTLEMENT_RECEIPT_PLAN,
  MAX_PARTIAL_COMMAND_LEDGER_BYTES, MAX_PARTIAL_COMMAND_LEDGER_ENTRIES,
  MAX_THUMB_SETTLEMENT_BROKER_KEYS, MAX_THUMB_SETTLEMENT_IMAGES,
  MAX_THUMB_SETTLEMENT_FILTER_COUNT,
  MAX_THUMB_SETTLEMENT_REASONS,
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
  classifyCompendiumForegroundServiceTurn,
  classifyCompendiumForegroundServiceTurnReceipt,
  classifyCompendiumThumbSettlement,
  compendiumThumbSettlementProductErrorDiagnosis,
  compendiumThumbSettlementReceiptToken,
  compendiumCdpOptions, compendiumProfileEmulationOptions,
  compendiumRawSnapshotExpression, evaluateProfile,
  CandidateObservationError, isCandidateObservationError,
  installBrokenBaselineThumbObserver, installBrokenBaselineInitialListArm,
  sealBrokenBaselineInitialListObservation,
  phaseObservationAccepted,
  remainingCommandTimeoutMs, sha256,
  reduceCalibrationEvidence,
  validBrokenBaselineThumbObservation, validProfileEmulationOptions,
  validCompendiumForegroundServiceObservation,
  validCompendiumForegroundServiceReceipt,
  validCompendiumThumbSettlementReceipt, validCompendiumActiveThumbSettlement,
  validCompendiumThumbSettlementObservation,
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
  baselineLifecycleFailureReport, candidateLifecycleFailureReport,
  candidateSpeciesPainterChunkSource,
  compendiumBudgetModeAllowed,
  collectWithCompendiumBrowserAuthority,
  candidateForegroundCleanupExpression, candidateForegroundServiceExpression,
  candidateThumbSettlementExpression,
  candidateProducerErrorPreArmExpression, candidateProducerErrorWorkExpression,
  candidateFilterInputExpression, candidateFilterTelemetryExpression,
  candidateRowPointExpression,
  collectCandidateSnapshot, collectCandidateSettledThumbnailSnapshot,
  createCandidateCollectorObservations,
  createCandidateCommandRecorder,
  COMPENDIUM_FOREGROUND_SERVICE_TIMEOUT_MS,
  COMPENDIUM_SERVER_SHUTDOWN_TIMEOUT_MS,
  closeCompendiumServer,
  driveCandidateFilterTransition, validCandidateFilterInputExpression,
  finalizeCompendiumLifecycle,
  ownCandidateForeground,
  settleCandidateRowActivationPoint,
  validCandidateThumbSettlementExpression,
  validCandidateForegroundServiceExpression,
  validCandidateFilterTelemetryExpression, validCandidateArmProducerErrorExpression,
  validCandidateRowPointExpression,
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

const rowPointSource = candidateRowPointExpression('cmem-row-selftest');
assert(validCandidateRowPointExpression(rowPointSource, 'cmem-row-selftest'),
  'the exact row activation expression was rejected');
assert(rowPointSource.includes('elementFromPoint')
  && rowPointSource.includes('r.top<top-0.5||r.bottom>bottom+0.5')
  && rowPointSource.includes('for(const y of ys)for(const x of xs)'),
'row activation lost its full-viewport and hit-test preconditions');
assert(!validCandidateRowPointExpression(
  rowPointSource.replace("document.elementFromPoint(x,y)?.closest?.('[data-cid]')", 'e'),
  'cmem-row-selftest',
), 'a row activation expression without an independent hit test was accepted');
assertThrows(() => candidateRowPointExpression(''),
  'an empty row activation identity was accepted');

{
  let attempt = 0;
  let afterBoundary = false;
  const sequence = [];
  const stablePoint = await settleCandidateRowActivationPoint({
    sessionId: 'row-settlement-session', logicalId: 'cmem-row-selftest',
    scrollToIndex: async () => {
      attempt++;
      afterBoundary = false;
      sequence.push(`scroll:${attempt}`);
    },
    waitReady: async () => { sequence.push(`ready:${attempt}`); },
    evaluate: async (_sessionId, expression, label) => {
      sequence.push(label);
      if (expression.startsWith('new Promise')) {
        afterBoundary = true;
        return true;
      }
      if (attempt === 1 && afterBoundary) return null;
      return attempt === 1 ? { x: 10, y: 20 } : { x: 30, y: 40 };
    },
  });
  assert(JSON.stringify(stablePoint) === JSON.stringify({ x: 30, y: 40 })
    && attempt === 2
    && sequence.includes('row cmem-row-selftest deferred-layout settlement 1')
    && sequence.includes('row cmem-row-selftest post-render point 1'),
  'a row that moved after the deferred render boundary was clicked or never repositioned');

  let unstableRejected = false;
  let unstableAttempt = 0;
  let unstableAfterBoundary = false;
  try {
    await settleCandidateRowActivationPoint({
      sessionId: 'row-settlement-session', logicalId: 'cmem-row-selftest', maxAttempts: 2,
      scrollToIndex: async () => { unstableAttempt++; unstableAfterBoundary = false; },
      waitReady: async () => {},
      evaluate: async (_sessionId, expression) => {
        if (expression.startsWith('new Promise')) {
          unstableAfterBoundary = true;
          return true;
        }
        return { x: unstableAttempt, y: unstableAfterBoundary ? 2 : 1 };
      },
    });
  } catch (error) {
    unstableRejected = error?.classification === 'product-unanswerable'
      && String(error.message).includes('never owned a render-stable activation point');
  }
  assert(unstableRejected,
    'a row without a stable post-render activation point remained green');
}

function syntheticThumbSettlementVisualKey(surface, index) {
  const targetLength = 768 + index;
  const prefix = `${surface}-visual-${index}-`;
  return `${prefix}${'k'.repeat(targetLength - prefix.length)}`;
}

function syntheticThumbSettlementVisualKeys(surface, count) {
  return Array.from({ length: count }, (_, index) =>
    syntheticThumbSettlementVisualKey(surface, index));
}

{
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-species-art-graph-'));
  const assets = path.join(root, 'assets');
  fs.mkdirSync(assets);
  const painterPath = path.join(assets, 'speciespainter-selftest.js');
  const workerPath = path.join(assets, 'species-art.worker-selftest.js');
  const mainPath = path.join(assets, 'main-selftest.js');
  const legacyPath = path.join(assets, 'legacy-species-selftest.js');
  const serviceWorkerPath = path.join(root, 'service-worker.js');
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

    const painterDigest = sha256(Buffer.from(painter));
    const pwaInventory = `const ASSETS=Object.freeze(${JSON.stringify([
      { path: '/assets/speciespainter-selftest.js', sha256: painterDigest },
    ])});self.addEventListener('install',()=>{});self.addEventListener('activate',()=>{});self.addEventListener('fetch',()=>{});`;
    fs.writeFileSync(serviceWorkerPath, pwaInventory);
    assert(findCandidateSpeciesArtBuildGraph(root).painter.relativePath
      === 'assets/speciespainter-selftest.js',
    'the exact declarative PWA asset inventory impersonated a foreign painter execution edge');
    fs.writeFileSync(serviceWorkerPath,
      pwaInventory.replace(painterDigest, '0'.repeat(64)));
    assertThrows(() => findCandidateSpeciesArtBuildGraph(root),
      'a PWA painter inventory with the wrong byte digest was accepted');
    fs.writeFileSync(serviceWorkerPath,
      `${pwaInventory}console.log('speciespainter-selftest.js');`);
    assertThrows(() => findCandidateSpeciesArtBuildGraph(root),
      'an executable painter reference escaped through the PWA inventory allowance');
    fs.rmSync(serviceWorkerPath);

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
  const pageAuthority = {
    targetId: 'thumb-target', sessionId: 'thumb-session', documentToken: 'thumb-document',
  };
  const listReceiptToken = 'phone-compendium-thumb-viewport-contracted-list-1';
  const planetsideReceiptToken = 'phone-compendium-thumb-veteran-earth-planetside-1';
  const listSource = candidateThumbSettlementExpression(
    'list', 1500, pageAuthority, listReceiptToken,
  );
  const planetsideSource = candidateThumbSettlementExpression(
    'planetside', null, pageAuthority, planetsideReceiptToken,
  );
  assert(validCandidateThumbSettlementExpression(
    listSource, 'list', 1500, pageAuthority, listReceiptToken,
  ),
    'exact list thumbnail settlement expression was rejected');
  assert(validCandidateThumbSettlementExpression(
    planetsideSource, 'planetside', null, pageAuthority, planetsideReceiptToken,
  ),
  'exact Planetside thumbnail settlement expression was rejected');
  assertThrows(() => candidateThumbSettlementExpression(
    'list', MAX_THUMB_SETTLEMENT_FILTER_COUNT + 1, pageAuthority, listReceiptToken,
  ), 'collector accepted a list count beyond the contract maximum');
  assertThrows(() => candidateThumbSettlementExpression(
    'list', 1500, pageAuthority, '',
  ), 'collector accepted an empty thumbnail receipt token');
  const maximumReceiptToken = 't'.repeat(256);
  const maximumReceiptTokenSource = candidateThumbSettlementExpression(
    'list', 1500, pageAuthority, maximumReceiptToken,
  );
  assert(validCandidateThumbSettlementExpression(
    maximumReceiptTokenSource, 'list', 1500, pageAuthority, maximumReceiptToken,
  ), 'collector rejected the strict 256-character thumbnail receipt token boundary');
  assertThrows(() => candidateThumbSettlementExpression(
    'list', 1500, pageAuthority, 't'.repeat(257),
  ), 'collector accepted a 257-character thumbnail receipt token');
  assert(!validCandidateThumbSettlementExpression(
    listSource, 'list', MAX_THUMB_SETTLEMENT_FILTER_COUNT + 1,
    pageAuthority, listReceiptToken,
  ), 'expression validator accepted a list count beyond the contract maximum');
  assert(!validCandidateThumbSettlementExpression(
    listSource, 'list', 1500, pageAuthority, 'coordinated-foreign-token',
  ), 'expression validator accepted a different thumbnail receipt token');
  assert(!validCandidateThumbSettlementExpression(
    listSource.replace('complete:img.complete===true', 'complete:true'),
    'list', 1500, pageAuthority, listReceiptToken,
  ), 'a list settlement expression that omitted decode completion was accepted');
  assert(!validCandidateThumbSettlementExpression(
    listSource.replace(
      'visualKeyLength:visualKey===null?null:count(visualKey.length)',
      'visualKeyLength:null',
    ),
    'list', 1500, pageAuthority, listReceiptToken,
  ), 'a list settlement expression that omitted visual-key length was accepted');
  assert(!validCandidateThumbSettlementExpression(
    listSource.replace(
      'leasedIndex:keyIndex(leasedKeys,visualKey)',
      'leasedIndex:null',
    ),
    'list', 1500, pageAuthority, listReceiptToken,
  ), 'a list settlement expression that omitted lease membership was accepted');
  assert(!validCandidateThumbSettlementExpression(
    listSource.replace(
      'cachedIndex:keyIndex(cachedKeys,visualKey)',
      'cachedIndex:null',
    ),
    'list', 1500, pageAuthority, listReceiptToken,
  ), 'a list settlement expression that omitted cache membership was accepted');
  const run = (
    surface, source, expectedCount, receiptToken,
    mountedCount = 2, brokerKeyCount = mountedCount,
  ) => {
    const sealed = greenThumbSettlement(
      surface, mountedCount, expectedCount, { receiptToken, pageAuthority },
    );
    const visualKeys = syntheticThumbSettlementVisualKeys(surface, mountedCount);
    const brokerVisualKeys = syntheticThumbSettlementVisualKeys(surface, brokerKeyCount);
    const sd = {
      imageCount: sealed.ownership.diagnosticImageCount,
      logicalIds: [...sealed.ownership.diagnosticLogicalIds],
      thumbStates: [...sealed.diagnostic.thumbStates],
      visible: sealed.diagnostic.visible,
    };
    const diagnostics = {
      documentToken: sealed.page.documentToken,
      panel: {
        mode: sealed.diagnostic.panelMode,
        filteredCount: sealed.diagnostic.filteredCount,
      },
      surfaces: { list: sd, planetside: sd },
      art: {
        schema: sealed.art.schema,
        keys: { leased: [...brokerVisualKeys], cached: [...brokerVisualKeys] },
        live: {
          cacheEntries: brokerKeyCount, leases: brokerKeyCount,
          subscribers: sealed.broker.subscribers, queuedJobs: sealed.broker.queuedJobs,
          activeJobs: sealed.broker.activeJobs,
        },
      },
      lazyArt: {
        schema: sealed.lazyArt.schema, state: sealed.lazyArt.state,
        importStarts: sealed.lazyArt.importStarts, identity: sealed.lazyArt.identity,
        lastEvent: sealed.lazyArt.lastEvent, lastError: sealed.lazyArt.lastError,
        phases: sealed.lazyArt.phases,
        results: sealed.lazyArt.results, errors: sealed.lazyArt.errors,
        worker: {
          live: sealed.worker.live, starts: sealed.worker.starts, ready: sealed.worker.ready,
          disposals: sealed.worker.disposals, fatals: sealed.worker.fatals,
          protocolErrors: sealed.worker.protocolErrors,
        },
      },
    };
    diagnostics.lazyArt.identity.extra = 'x'.repeat(100_000);
    diagnostics.lazyArt.identity.self = diagnostics.lazyArt.identity;
    diagnostics.lazyArt.extra = diagnostics.lazyArt;
    const images = sealed.images.map((image, index) => ({
      dataset: { visualKey: visualKeys[index], thumbState: image.thumbState },
      closest: () => ({ dataset: { cid: image.logicalId } }),
      getAttribute: () => image.srcPresent ? 'data:image/png;base64,cG5n' : '',
      complete: image.complete,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
    }));
    return new Function('window', 'document', `return ${source}`)(
      { __CF_SLICE__: {
        documentToken: pageAuthority.documentToken,
        api: { compendiumDiagnostics: () => diagnostics },
      } },
      {
        querySelectorAll: () => images,
        visibilityState: 'visible', hidden: false, hasFocus: () => true,
      },
    );
  };
  for (const [surface, source, expectedCount, receiptToken] of [
    ['list', listSource, 1500, listReceiptToken],
    ['planetside', planetsideSource, null, planetsideReceiptToken],
  ]) {
    const observation = run(surface, source, expectedCount, receiptToken);
    const expected = { surface, expectedCount, receiptToken, ...pageAuthority };
    const decision = classifyCompendiumThumbSettlement(observation, expected);
    assert(decision.status === 'ready'
      && !validCompendiumThumbSettlementObservation(observation, expected),
    `${surface} expression did not return one raw structured observation`);
    observation.ready = true;
    observation.reasons = [...decision.reasons];
    assert(validCompendiumThumbSettlementObservation(observation, expected),
      `${surface} expression observation could not be sealed by Node-side recomputation`);
    assert(JSON.stringify(observation).length < 32_000
      && !JSON.stringify(observation).includes('x'.repeat(1_000)),
    `${surface} expression returned unprojected or unbounded nested diagnostics`);
  }
  const boundedObservation = run(
    'list', listSource, 1500, listReceiptToken, MAX_THUMB_SETTLEMENT_IMAGES,
  );
  const boundedSerialized = JSON.stringify(boundedObservation);
  assert(classifyCompendiumThumbSettlement(boundedObservation, {
    surface: 'list', expectedCount: 1500, receiptToken: listReceiptToken, ...pageAuthority,
  }).status === 'ready'
    && boundedObservation.images.every((image) => image.visualKeyLength > 512)
    && boundedObservation.images[0].visualKeyLength === 768
    && boundedObservation.images.at(-1).visualKeyLength >= 827
    && boundedSerialized.length < 32_000
    && !boundedSerialized.includes(syntheticThumbSettlementVisualKey('list', 0)),
  '768–827+ character visual keys did not pass through bounded scalar evidence without truncation');
  assert(MAX_THUMB_SETTLEMENT_BROKER_KEYS === 256,
    'the sealed product broker-key maximum drifted from 256');
  const maximumBrokerObservation = run(
    'list', listSource, 1500, listReceiptToken, MAX_THUMB_SETTLEMENT_IMAGES, 256,
  );
  assert(classifyCompendiumThumbSettlement(maximumBrokerObservation, {
    surface: 'list', expectedCount: 1500, receiptToken: listReceiptToken, ...pageAuthority,
  }).status === 'ready'
    && maximumBrokerObservation.broker.leasedKeyCount === 256
    && maximumBrokerObservation.broker.cachedKeyCount === 256,
  'the exact 256-key broker boundary was not accepted');
  const oversizedBrokerObservation = run(
    'list', listSource, 1500, listReceiptToken, 2, 257,
  );
  const oversizedBrokerDecision = classifyCompendiumThumbSettlement(
    oversizedBrokerObservation,
    { surface: 'list', expectedCount: 1500, receiptToken: listReceiptToken, ...pageAuthority },
  );
  assert(oversizedBrokerDecision.status === 'error'
    && oversizedBrokerObservation.broker.leasedKeyCount === null
    && oversizedBrokerObservation.broker.cachedKeyCount === null
    && oversizedBrokerObservation.broker.leasedDistinctKeyCount === null
    && oversizedBrokerObservation.broker.cachedDistinctKeyCount === null
    && oversizedBrokerObservation.images.every((image) =>
      image.leasedIndex === null && image.cachedIndex === null)
    && oversizedBrokerDecision.reasons.includes(
      'thumb settlement broker leasedKeyCount shape',
    ),
  'a 257-key broker array escaped the bounded collector and strict shape contract');
}

let structuredInstrumentControlCount = 0;

function greenThumbSettlement(
  surface = 'list', mountedCount = 2,
  expectedCount = surface === 'list' ? 1500 : null,
  {
    receiptToken = 'thumb-receipt',
    pageAuthority = {
      targetId: 'thumb-target', sessionId: 'thumb-session', documentToken: 'thumb-document',
    },
  } = {},
) {
  const logicalIds = Array.from({ length: mountedCount }, (_, index) => `${surface}-${index}`);
  const visualKeys = syntheticThumbSettlementVisualKeys(surface, mountedCount);
  const images = logicalIds.map((logicalId, index) => ({
    index, logicalId, visualKeyLength: visualKeys[index].length,
    leasedIndex: index, cachedIndex: index, thumbState: 'ready',
    srcPresent: true, complete: true, naturalWidth: 132, naturalHeight: 132,
  }));
  const observation = {
    schema: THUMB_SETTLEMENT_OBSERVATION_SCHEMA,
    surface,
    expectedCount,
    receiptToken,
    ready: true,
    reasons: [],
    ownership: {
      selector: surface === 'list'
        ? '#codexpanel [data-sel="codex-entry"] img'
        : '#planetside [data-sel="planetside-sp"] img',
      rawImageCount: mountedCount,
      rawLogicalIds: [...logicalIds],
      diagnosticImageCount: mountedCount,
      diagnosticLogicalIds: [...logicalIds],
    },
    diagnostic: {
      panelMode: surface === 'list' ? 'list' : 'closed',
      filteredCount: surface === 'list' && expectedCount !== null ? expectedCount : 1500,
      visible: true,
      thumbStates: images.map((image) => image.thumbState),
    },
    images,
    art: {
      available: true, schema: ART_DIAGNOSTICS_SCHEMA, queuedJobs: 0, activeJobs: 0,
    },
    lazyArt: {
      available: true, schema: 'cf-v2-species-art-worker-diagnostics/v2', state: 'ready',
      importStarts: 1,
      identity: {
        documentToken: pageAuthority.documentToken,
        lastProducerEpoch: 1, lastWorkerInstanceId: 1,
      },
      lastEvent: {
        producerEpoch: 1, workerInstanceId: 1, jobId: mountedCount,
        kind: 'thumb132', event: 'result',
      },
      lastError: null,
      phases: {
        importStarts: 1, importCompletes: 1,
        thumbJobStarts: mountedCount, thumbRenderCompletes: mountedCount,
        thumbEncodeStarts: mountedCount, thumbEncodeCompletes: mountedCount,
        portraitJobStarts: 0, portraitRenderCompletes: 0,
        portraitEncodeStarts: 0, portraitEncodeCompletes: 0,
      },
      results: {
        count: mountedCount, maxImportDurationMs: 4,
        maxRenderDurationMs: 8, maxEncodeDurationMs: 2,
      },
      errors: { capability: 0, protocol: 0, import: 0, paint: 0, encode: 0 },
    },
    worker: {
      available: true, live: false, starts: 1, ready: 1, disposals: 1,
      fatals: 0, protocolErrors: 0,
    },
    broker: {
      available: true, cacheEntries: mountedCount, leases: mountedCount, subscribers: 0,
      queuedJobs: 0, activeJobs: 0,
      leasedKeyCount: mountedCount, cachedKeyCount: mountedCount,
      leasedDistinctKeyCount: mountedCount, cachedDistinctKeyCount: mountedCount,
    },
    page: {
      ...pageAuthority,
      visibilityState: 'visible', hidden: false, focused: true,
    },
  };
  const expected = {
    surface, expectedCount,
    targetId: observation.page.targetId,
    sessionId: observation.page.sessionId,
    documentToken: observation.page.documentToken,
    receiptToken,
  };
  const decision = classifyCompendiumThumbSettlement(observation, expected);
  observation.ready = decision.status === 'ready';
  observation.reasons = [...decision.reasons];
  return observation;
}

{
  const expected = {
    surface: 'list', expectedCount: 1500,
    targetId: 'thumb-target', sessionId: 'thumb-session', documentToken: 'thumb-document',
    receiptToken: 'thumb-receipt',
  };
  const green = greenThumbSettlement();
  const currentLastError = ({
    stage = 'paint', jobId = 1, kind = 'thumb132',
    code = 'injected-failure', message = PRODUCER_ERROR_ARM_MESSAGE,
  } = {}) => ({
    producerEpoch: 1, workerInstanceId: 1, jobId, kind, stage, code, message,
  });
  assert(classifyCompendiumThumbSettlement(green, expected).status === 'ready'
    && validCompendiumThumbSettlementObservation(green, expected),
  'the exact structured thumbnail settlement observation was rejected');
  const planetside = greenThumbSettlement('planetside', 2, null);
  const planetsideExpected = {
    surface: 'planetside', expectedCount: null,
    targetId: 'thumb-target', sessionId: 'thumb-session', documentToken: 'thumb-document',
    receiptToken: 'thumb-receipt',
  };
  assert(classifyCompendiumThumbSettlement(
    planetside, planetsideExpected,
  ).status === 'ready' && validCompendiumThumbSettlementObservation(
    planetside, planetsideExpected,
  ), 'the exact structured Planetside settlement observation was rejected');
  const unfilteredList = greenThumbSettlement('list', 2, null);
  const unfilteredListExpected = { ...expected, expectedCount: null };
  assert(classifyCompendiumThumbSettlement(unfilteredList, unfilteredListExpected).status === 'ready'
    && validCompendiumThumbSettlementObservation(unfilteredList, unfilteredListExpected),
  'a list settlement without a filtered-count predicate was rejected');
  for (const observation of [null, 7]) {
    let rejected = null;
    try {
      classifyCompendiumThumbSettlement(observation, expected);
      if (observation === null || typeof observation !== 'object'
        || Array.isArray(observation)) {
        rejected = new Error(
          `phone list thumb settlement: thumbnail observation was not an object (${JSON.stringify(observation)})`,
        );
        throw rejected;
      }
    } catch (error) {
      rejected = error;
    }
    structuredInstrumentControlCount++;
    assert(rejected instanceof Error && !(rejected instanceof TypeError)
      && rejected.message
        === `phone list thumb settlement: thumbnail observation was not an object (${JSON.stringify(observation)})`,
    `a ${observation === null ? 'null' : 'non-object'} thumbnail observation lost its actionable diagnosis`);
  }

  const semanticControls = [
    ['schema identity', (value) => { value.schema = 'stale-schema'; }, 'error'],
    ['surface identity', (value) => { value.surface = 'planetside'; }, 'error'],
    ['expected-count identity', (value) => { value.expectedCount = 1499; }, 'error'],
    ['receipt-token identity', (value) => { value.receiptToken = 'foreign-token'; }, 'error'],
    ['raw selector ownership', (value) => { value.ownership.selector = '#foreign img'; }, 'error'],
    ['target identity', (value) => { value.page.targetId = 'foreign-target'; }, 'error'],
    ['session identity', (value) => { value.page.sessionId = 'foreign-session'; }, 'error'],
    ['stale document identity', (value) => {
      value.page.documentToken = 'stale-document';
    }, 'error'],
    ['page visibility state', (value) => { value.page.visibilityState = 'hidden'; }, 'error'],
    ['page hidden flag', (value) => { value.page.hidden = true; }, 'error'],
    ['page focus', (value) => { value.page.focused = false; }, 'error'],
    ['list panel ownership', (value) => { value.diagnostic.panelMode = 'closed'; }, 'pending'],
    ['list filtered count', (value) => { value.diagnostic.filteredCount = 3; }, 'pending'],
    ['raw image array count', (value) => { value.images.pop(); }, 'pending'],
    ['empty mounted window', (value) => {
      value.images = [];
      value.ownership.rawImageCount = 0;
      value.ownership.rawLogicalIds = [];
      value.ownership.diagnosticImageCount = 0;
      value.ownership.diagnosticLogicalIds = [];
      value.diagnostic.thumbStates = [];
    }, 'pending'],
    ['raw image count', (value) => { value.ownership.rawImageCount = 1; }, 'pending'],
    ['diagnostic image count', (value) => {
      value.ownership.diagnosticImageCount = 1;
    }, 'pending'],
    ['raw logical-id ownership', (value) => {
      value.ownership.rawLogicalIds[0] = 'foreign-logical';
    }, 'pending'],
    ['diagnostic logical-id ownership', (value) => {
      value.ownership.diagnosticLogicalIds[0] = 'foreign-logical';
    }, 'pending'],
    ['diagnostic state ownership', (value) => {
      value.diagnostic.thumbStates[0] = 'placeholder';
    }, 'pending'],
    ['distinct logical ids', (value) => {
      value.images[1].logicalId = value.images[0].logicalId;
      value.ownership.rawLogicalIds[1] = value.images[0].logicalId;
      value.ownership.diagnosticLogicalIds[1] = value.images[0].logicalId;
    }, 'pending'],
    ['missing visual key', (value) => {
      value.images[0].visualKeyLength = null;
    }, 'pending', 'raw visual keys absent'],
    ['duplicate visual key', (value) => {
      value.images[1].leasedIndex = value.images[0].leasedIndex;
      value.images[1].cachedIndex = value.images[0].cachedIndex;
    }, 'pending', 'raw visual keys non-distinct in broker lease inventory'],
    ['lease inventory absence', (value) => {
      value.images[0].leasedIndex = null;
    }, 'pending', 'raw visual keys absent from broker lease inventory'],
    ['cache inventory absence', (value) => {
      value.images[0].cachedIndex = null;
    }, 'pending', 'raw visual keys absent from broker cache inventory'],
    ['copied lease index', (value) => {
      value.images[1].leasedIndex = value.images[0].leasedIndex;
    }, 'pending', 'raw visual keys non-distinct in broker lease inventory'],
    ['wrong cache index', (value) => {
      value.images[0].cachedIndex = value.broker.cachedKeyCount;
    }, 'pending', 'raw visual keys absent from broker cache inventory'],
    ['image index', (value) => { value.images[0].index = 1; }, 'pending'],
    ['image thumb state', (value) => {
      value.images[0].thumbState = 'placeholder';
      value.diagnostic.thumbStates[0] = 'placeholder';
    }, 'pending'],
    ['image terminal error state', (value) => {
      value.images[0].thumbState = 'error';
      value.diagnostic.thumbStates[0] = 'error';
      value.lazyArt.lastError = currentLastError();
      value.lazyArt.errors.paint = 1;
    }, 'product-error', 'image 0 thumb state "error"'],
    ['terminal error missing last-error evidence', (value) => {
      value.images[0].thumbState = 'error';
      value.diagnostic.thumbStates[0] = 'error';
      value.lazyArt.errors.paint = 1;
    }, 'error', 'terminal thumbnail state omitted last-error evidence'],
    ['terminal error unavailable producer diagnostics', (value) => {
      value.images[0].thumbState = 'error';
      value.diagnostic.thumbStates[0] = 'error';
      value.lazyArt = {
        available: false, schema: null, state: null, importStarts: null,
        identity: null, lastEvent: null, lastError: null,
        phases: null, results: null, errors: null,
      };
      value.worker = {
        available: false, live: null, starts: null, ready: null, disposals: null,
        fatals: null, protocolErrors: null,
      };
    }, 'error', 'terminal thumbnail state lacks complete producer diagnostics'],
    ['terminal error wrong art diagnostics schema', (value) => {
      value.images[0].thumbState = 'error';
      value.diagnostic.thumbStates[0] = 'error';
      value.art.schema = 'stale-art';
      value.lazyArt.lastError = currentLastError();
      value.lazyArt.errors.paint = 1;
    }, 'error', 'terminal thumbnail state lacks complete producer diagnostics'],
    ['terminal error stale producer identity', (value) => {
      value.images[0].thumbState = 'error';
      value.diagnostic.thumbStates[0] = 'error';
      value.lazyArt.lastError = {
        ...currentLastError(), producerEpoch: 2, workerInstanceId: 2,
      };
      value.lazyArt.errors.paint = 1;
    }, 'error', 'terminal lazy-art last-error producer identity'],
    ['image source', (value) => { value.images[0].srcPresent = false; }, 'pending'],
    ['image decode', (value) => { value.images[0].complete = false; }, 'pending'],
    ['image width', (value) => { value.images[0].naturalWidth = 131; }, 'pending'],
    ['image height', (value) => { value.images[0].naturalHeight = 131; }, 'pending'],
    ['art unavailable', (value) => {
      value.art = { available: false, schema: null, queuedJobs: null, activeJobs: null };
      value.broker = {
        available: false, cacheEntries: null, leases: null, subscribers: null,
        queuedJobs: null, activeJobs: null,
        leasedKeyCount: null, cachedKeyCount: null,
        leasedDistinctKeyCount: null, cachedDistinctKeyCount: null,
      };
    }, 'pending'],
    ['art schema', (value) => { value.art.schema = 'stale-art'; }, 'pending'],
    ['art queued jobs', (value) => {
      value.art.queuedJobs = 1; value.broker.queuedJobs = 1;
    }, 'pending'],
    ['art active jobs', (value) => {
      value.art.activeJobs = 1; value.broker.activeJobs = 1;
    }, 'pending'],
    ['lazy-art unavailable', (value) => {
      value.lazyArt = {
        available: false, schema: null, state: null, importStarts: null,
        identity: null, lastEvent: null, lastError: null,
        phases: null, results: null, errors: null,
      };
      value.worker = {
        available: false, live: null, starts: null, ready: null, disposals: null,
        fatals: null, protocolErrors: null,
      };
    }, 'pending'],
    ['lazy-art schema', (value) => { value.lazyArt.schema = 'stale-worker'; }, 'error'],
    ['lazy-art state', (value) => { value.lazyArt.state = 'loading'; }, 'pending'],
    ['lazy-art terminal error state', (value) => {
      value.lazyArt.state = 'error';
      value.lazyArt.lastError = currentLastError({
        stage: 'import', jobId: null, kind: null,
        code: 'painter-import', message: 'painter import refused',
      });
      value.lazyArt.errors.import = 1;
    }, 'product-error', 'lazy-art state "error"'],
    ['lazy-art document identity', (value) => {
      value.lazyArt.identity.documentToken = 'stale-document';
    }, 'error'],
    ['lazy-art producer epoch', (value) => {
      value.lazyArt.identity.lastProducerEpoch += 1;
    }, 'error'],
    ['lazy-art worker instance', (value) => {
      value.lazyArt.identity.lastWorkerInstanceId += 1;
    }, 'error'],
    ['lazy-art last event absent', (value) => { value.lazyArt.lastEvent = null; }, 'ready'],
    ['lazy-art last-event producer', (value) => {
      value.lazyArt.lastEvent.producerEpoch += 1;
    }, 'error'],
    ['lazy-art last-event worker', (value) => {
      value.lazyArt.lastEvent.workerInstanceId += 1;
    }, 'error'],
    ['lazy-art last-event job', (value) => { value.lazyArt.lastEvent.jobId += 1; }, 'ready'],
    ['lazy-art last-event kind', (value) => {
      value.lazyArt.lastEvent.kind = 'portrait440';
    }, 'ready'],
    ['lazy-art last-event name', (value) => {
      value.lazyArt.lastEvent.event = 'error';
    }, 'ready'],
    ['lazy-art import summary', (value) => { value.lazyArt.importStarts += 1; }, 'pending'],
    ['lazy-art phase import starts', (value) => {
      value.lazyArt.phases.importStarts += 1;
    }, 'pending'],
    ['lazy-art phase import completes', (value) => {
      value.lazyArt.phases.importCompletes += 1;
    }, 'pending'],
    ['lazy-art phase thumb jobs', (value) => {
      value.lazyArt.phases.thumbJobStarts += 1;
    }, 'ready'],
    ['lazy-art phase thumb renders', (value) => {
      value.lazyArt.phases.thumbRenderCompletes += 1;
    }, 'pending'],
    ['lazy-art phase thumb encode starts', (value) => {
      value.lazyArt.phases.thumbEncodeStarts += 1;
    }, 'pending'],
    ['lazy-art phase thumb encode completes', (value) => {
      value.lazyArt.phases.thumbEncodeCompletes += 1;
    }, 'pending'],
    ['lazy-art phase portrait jobs', (value) => {
      value.lazyArt.phases.portraitJobStarts += 1;
    }, 'ready'],
    ['lazy-art phase portrait renders', (value) => {
      value.lazyArt.phases.portraitRenderCompletes += 1;
    }, 'pending'],
    ['lazy-art phase portrait encode starts', (value) => {
      value.lazyArt.phases.portraitEncodeStarts += 1;
    }, 'pending'],
    ['lazy-art phase portrait encode completes', (value) => {
      value.lazyArt.phases.portraitEncodeCompletes += 1;
    }, 'pending'],
    ['lazy-art result count', (value) => { value.lazyArt.results.count += 1; }, 'pending'],
    ['lazy-art import duration', (value) => {
      value.lazyArt.results.maxImportDurationMs += 1;
    }, 'ready'],
    ['lazy-art render duration', (value) => {
      value.lazyArt.results.maxRenderDurationMs += 1;
    }, 'ready'],
    ['lazy-art encode duration', (value) => {
      value.lazyArt.results.maxEncodeDurationMs += 1;
    }, 'ready'],
    ...['capability', 'protocol', 'import', 'paint', 'encode'].map((field) => [
      `lazy-art ${field} errors`, (value) => { value.lazyArt.errors[field] += 1; }, 'ready',
    ]),
    ['worker/lazy-art availability', (value) => {
      value.worker = {
        available: false, live: null, starts: null, ready: null, disposals: null,
        fatals: null, protocolErrors: null,
      };
    }, 'pending'],
    ['broker/art availability', (value) => {
      value.broker = {
        available: false, cacheEntries: null, leases: null, subscribers: null,
        queuedJobs: null, activeJobs: null,
        leasedKeyCount: null, cachedKeyCount: null,
        leasedDistinctKeyCount: null, cachedDistinctKeyCount: null,
      };
    }, 'pending'],
    ['broker leased key count drift', (value) => {
      value.broker.leasedKeyCount -= 1;
    }, 'pending', 'broker leased key count 1/2'],
    ['broker cached key count drift', (value) => {
      value.broker.cachedKeyCount -= 1;
    }, 'pending', 'broker cached key count 1/2'],
    ['broker leased distinct-count drift', (value) => {
      value.broker.leasedDistinctKeyCount -= 1;
    }, 'pending', 'broker leased keys non-distinct 1/2'],
    ['broker cached distinct-count drift', (value) => {
      value.broker.cachedDistinctKeyCount -= 1;
    }, 'pending', 'broker cached keys non-distinct 1/2'],
    ['broker/art queued jobs', (value) => { value.broker.queuedJobs = 1; }, 'pending'],
    ['broker/art active jobs', (value) => { value.broker.activeJobs = 1; }, 'pending'],
  ];
  for (const [label, mutate, status, expectedReason] of semanticControls) {
    structuredInstrumentControlCount++;
    const changed = clone(green);
    mutate(changed);
    const decision = classifyCompendiumThumbSettlement(changed, expected);
    assert(decision.status === status && decision.reasons.length > 0,
      `structured thumbnail ${label} did not produce an actionable ${status} decision`);
    if (expectedReason) {
      assert(decision.reasons.includes(expectedReason),
        `structured thumbnail ${label} lost exact diagnosis ${JSON.stringify(expectedReason)}`);
    }
    assert(!validCompendiumThumbSettlementObservation(changed, expected),
      `structured thumbnail ${label} retained copied green readiness/reasons`);
    changed.ready = decision.status === 'ready';
    changed.reasons = [...decision.reasons];
    assert(validCompendiumThumbSettlementObservation(changed, expected),
      `structured thumbnail ${label} could not retain its recomputed diagnosis`);
  }

  const recoveredCumulativeTelemetry = clone(green);
  recoveredCumulativeTelemetry.lazyArt.errors.import = 1;
  recoveredCumulativeTelemetry.lazyArt.lastEvent.event = 'error:import';
  recoveredCumulativeTelemetry.lazyArt.identity.lastProducerEpoch = 2;
  recoveredCumulativeTelemetry.lazyArt.identity.lastWorkerInstanceId = 2;
  recoveredCumulativeTelemetry.lazyArt.lastEvent.producerEpoch = 2;
  recoveredCumulativeTelemetry.lazyArt.lastEvent.workerInstanceId = 2;
  recoveredCumulativeTelemetry.lazyArt.lastError = currentLastError({
    stage: 'import', jobId: null, kind: null,
    code: 'painter-import', message: 'historical painter import refusal',
  });
  recoveredCumulativeTelemetry.worker.fatals = 1;
  const recoveredCumulativeDecision = classifyCompendiumThumbSettlement(
    recoveredCumulativeTelemetry, expected,
  );
  structuredInstrumentControlCount++;
  assert(recoveredCumulativeDecision.status === 'ready'
    && recoveredCumulativeDecision.reasons.some((reason) =>
      reason.includes('errors=0,0,1,0,0') && reason.includes('error:import')),
  'recovered cumulative producer-error telemetry was treated as a current terminal error');

  const maximumLastErrorMessage = clone(green);
  const boundedLastErrorMessage = 'x'.repeat(512);
  maximumLastErrorMessage.lazyArt.errors.paint = 1;
  maximumLastErrorMessage.lazyArt.lastError = currentLastError({
    message: boundedLastErrorMessage,
  });
  const maximumLastErrorDecision = classifyCompendiumThumbSettlement(
    maximumLastErrorMessage, expected,
  );
  maximumLastErrorMessage.ready = true;
  maximumLastErrorMessage.reasons = [...maximumLastErrorDecision.reasons];
  structuredInstrumentControlCount++;
  assert(maximumLastErrorDecision.status === 'ready'
    && maximumLastErrorDecision.reasons.some((reason) =>
      reason.includes(`message=512,${sha256(boundedLastErrorMessage)}`))
    && validCompendiumThumbSettlementObservation(maximumLastErrorMessage, expected),
  'the exact 512-character last-error message boundary overflowed its bounded decision witness');

  const authorityBeforeProductError = clone(green);
  authorityBeforeProductError.images[0].thumbState = 'error';
  authorityBeforeProductError.diagnostic.thumbStates[0] = 'error';
  authorityBeforeProductError.lazyArt.lastError = currentLastError();
  authorityBeforeProductError.lazyArt.errors.paint = 1;
  authorityBeforeProductError.page.targetId = 'foreign-target';
  const authorityBeforeProductDecision = classifyCompendiumThumbSettlement(
    authorityBeforeProductError, expected,
  );
  structuredInstrumentControlCount++;
  assert(authorityBeforeProductDecision.status === 'error'
    && authorityBeforeProductDecision.reasons.includes('target identity "foreign-target"')
    && authorityBeforeProductDecision.reasons.includes('image 0 thumb state "error"'),
  'a terminal product marker outranked lost page authority');

  const planetsideHidden = clone(planetside);
  planetsideHidden.diagnostic.visible = false;
  const planetsideHiddenDecision = classifyCompendiumThumbSettlement(
    planetsideHidden, planetsideExpected,
  );
  structuredInstrumentControlCount++;
  assert(planetsideHiddenDecision.status === 'pending'
    && planetsideHiddenDecision.reasons.includes('Planetside surface hidden'),
  'structured Planetside settlement did not retain its hidden-surface diagnosis');

  const staleReady = clone(green);
  staleReady.ready = false;
  structuredInstrumentControlCount++;
  assert(classifyCompendiumThumbSettlement(staleReady, expected).status === 'ready'
    && !validCompendiumThumbSettlementObservation(staleReady, expected),
  'structured thumbnail settlement accepted a copied false readiness bit');
  const staleReasons = clone(green);
  staleReasons.reasons = ['copied stale reason'];
  structuredInstrumentControlCount++;
  assert(classifyCompendiumThumbSettlement(staleReasons, expected).status === 'ready'
    && !validCompendiumThumbSettlementObservation(staleReasons, expected),
  'structured thumbnail settlement accepted a copied reason list');
  const maximumTokenExpected = { ...expected, receiptToken: 't'.repeat(256) };
  const maximumTokenObservation = clone(green);
  maximumTokenObservation.receiptToken = maximumTokenExpected.receiptToken;
  const maximumTokenDecision = classifyCompendiumThumbSettlement(
    maximumTokenObservation, maximumTokenExpected,
  );
  maximumTokenObservation.ready = maximumTokenDecision.status === 'ready';
  maximumTokenObservation.reasons = [...maximumTokenDecision.reasons];
  assert(validCompendiumThumbSettlementObservation(
    maximumTokenObservation, maximumTokenExpected,
  ), 'contract rejected the strict 256-character thumbnail receipt token boundary');
  const oversizedTokenExpected = { ...expected, receiptToken: 't'.repeat(257) };
  const oversizedTokenObservation = clone(green);
  oversizedTokenObservation.receiptToken = oversizedTokenExpected.receiptToken;
  structuredInstrumentControlCount++;
  assert(!validCompendiumThumbSettlementObservation(
    oversizedTokenObservation, oversizedTokenExpected,
  ), 'contract accepted a 257-character thumbnail receipt token');

  const shapeControls = [
    ['top-level exact keys', (value) => { value.extra = true; }],
    ['schema shape', (value) => { value.schema = ''; }],
    ['surface shape', (value) => { value.surface = ''; }],
    ['expected-count shape', (value) => { value.expectedCount = 1_000_001; }],
    ['receipt-token shape', (value) => { value.receiptToken = ''; }],
    ['ready shape', (value) => { value.ready = 'yes'; }],
    ['reasons shape', (value) => { value.reasons = ['duplicate', 'duplicate']; }],
    ['ownership exact keys', (value) => { delete value.ownership.selector; }],
    ['selector shape', (value) => { value.ownership.selector = ''; }],
    ['raw-count shape', (value) => { value.ownership.rawImageCount = -1; }],
    ['diagnostic-count shape', (value) => {
      value.ownership.diagnosticImageCount = 1_000_001;
    }],
    ['raw-id array shape', (value) => { value.ownership.rawLogicalIds[0] = 1; }],
    ['diagnostic-id array shape', (value) => {
      value.ownership.diagnosticLogicalIds[0] = {};
    }],
    ['diagnostic exact keys', (value) => { delete value.diagnostic.panelMode; }],
    ['panel-mode shape', (value) => { value.diagnostic.panelMode = ''; }],
    ['filtered-count shape', (value) => { value.diagnostic.filteredCount = -1; }],
    ['surface-visible shape', (value) => { value.diagnostic.visible = null; }],
    ['thumb-state array shape', (value) => { value.diagnostic.thumbStates[0] = null; }],
    ['image exact keys', (value) => { delete value.images[0].complete; }],
    ['image index shape', (value) => { value.images[0].index = 64; }],
    ['image logical-id shape', (value) => { value.images[0].logicalId = {}; }],
    ['image visual-key length shape', (value) => { value.images[0].visualKeyLength = {}; }],
    ['image leased-index shape', (value) => { value.images[0].leasedIndex = {}; }],
    ['image cached-index shape', (value) => { value.images[0].cachedIndex = {}; }],
    ['image leased-index cap shape', (value) => {
      value.images[0].leasedIndex = MAX_THUMB_SETTLEMENT_BROKER_KEYS;
    }],
    ['image cached-index cap shape', (value) => {
      value.images[0].cachedIndex = MAX_THUMB_SETTLEMENT_BROKER_KEYS;
    }],
    ['image thumb-state shape', (value) => { value.images[0].thumbState = {}; }],
    ['image source shape', (value) => { value.images[0].srcPresent = 1; }],
    ['image completion shape', (value) => { value.images[0].complete = 1; }],
    ['image width shape', (value) => { value.images[0].naturalWidth = -1; }],
    ['image height shape', (value) => { value.images[0].naturalHeight = 8193; }],
    ['art exact keys', (value) => { delete value.art.activeJobs; }],
    ['art availability shape', (value) => { value.art.available = 'yes'; }],
    ['art schema shape', (value) => { value.art.schema = ''; }],
    ['art queued shape', (value) => { value.art.queuedJobs = -1; }],
    ['art active shape', (value) => { value.art.activeJobs = -1; }],
    ['unavailable art values', (value) => { value.art.available = false; }],
    ['lazy-art exact keys', (value) => { delete value.lazyArt.state; }],
    ['lazy-art availability shape', (value) => { value.lazyArt.available = 'yes'; }],
    ['lazy-art schema shape', (value) => { value.lazyArt.schema = ''; }],
    ['lazy-art state shape', (value) => { value.lazyArt.state = ''; }],
    ['lazy-art document shape', (value) => { value.lazyArt.identity.documentToken = ''; }],
    ['lazy-art imports shape', (value) => { value.lazyArt.importStarts = -1; }],
    ['lazy-art identity exact keys', (value) => {
      delete value.lazyArt.identity.lastProducerEpoch;
    }],
    ['lazy-art producer epoch shape', (value) => {
      value.lazyArt.identity.lastProducerEpoch = -1;
    }],
    ['lazy-art worker identity shape', (value) => {
      value.lazyArt.identity.lastWorkerInstanceId = -1;
    }],
    ['lazy-art last-event exact keys', (value) => {
      delete value.lazyArt.lastEvent.jobId;
    }],
    ...['producerEpoch', 'workerInstanceId', 'jobId'].map((field) => [
      `lazy-art last-event ${field} shape`, (value) => { value.lazyArt.lastEvent[field] = -1; },
    ]),
    ['lazy-art last-event kind shape', (value) => { value.lazyArt.lastEvent.kind = ''; }],
    ['lazy-art last-event name shape', (value) => { value.lazyArt.lastEvent.event = ''; }],
    ['lazy-art last-error exact keys', (value) => {
      value.lazyArt.lastError = currentLastError();
      delete value.lazyArt.lastError.code;
    }],
    ['lazy-art last-error producer shape', (value) => {
      value.lazyArt.lastError = { ...currentLastError(), producerEpoch: 0 };
    }],
    ['lazy-art last-error worker shape', (value) => {
      value.lazyArt.lastError = { ...currentLastError(), workerInstanceId: 0 };
    }],
    ['lazy-art last-error job shape', (value) => {
      value.lazyArt.lastError = { ...currentLastError(), jobId: 0 };
    }],
    ['lazy-art last-error kind shape', (value) => {
      value.lazyArt.lastError = { ...currentLastError(), kind: 'landscape' };
    }],
    ['lazy-art last-error ownership tuple shape', (value) => {
      value.lazyArt.lastError = { ...currentLastError(), jobId: null };
    }],
    ['lazy-art last-error stage shape', (value) => {
      value.lazyArt.lastError = { ...currentLastError(), stage: 'render' };
    }],
    ['lazy-art last-error code shape', (value) => {
      value.lazyArt.lastError = { ...currentLastError(), code: 'INVALID CODE' };
    }],
    ['lazy-art last-error empty message shape', (value) => {
      value.lazyArt.lastError = { ...currentLastError(), message: '' };
    }],
    ['lazy-art last-error message bound', (value) => {
      value.lazyArt.lastError = { ...currentLastError(), message: 'x'.repeat(513) };
    }],
    ['lazy-art phases exact keys', (value) => {
      delete value.lazyArt.phases.importStarts;
    }],
    ...[
      'importStarts', 'importCompletes',
      'thumbJobStarts', 'thumbRenderCompletes', 'thumbEncodeStarts', 'thumbEncodeCompletes',
      'portraitJobStarts', 'portraitRenderCompletes',
      'portraitEncodeStarts', 'portraitEncodeCompletes',
    ].map((field) => [
      `lazy-art phase ${field} shape`, (value) => { value.lazyArt.phases[field] = -1; },
    ]),
    ['lazy-art results exact keys', (value) => { delete value.lazyArt.results.count; }],
    ['lazy-art result count shape', (value) => { value.lazyArt.results.count = -1; }],
    ...['maxImportDurationMs', 'maxRenderDurationMs', 'maxEncodeDurationMs'].map((field) => [
      `lazy-art result ${field} shape`, (value) => { value.lazyArt.results[field] = -1; },
    ]),
    ['lazy-art errors exact keys', (value) => { delete value.lazyArt.errors.capability; }],
    ...['capability', 'protocol', 'import', 'paint', 'encode'].map((field) => [
      `lazy-art error ${field} shape`, (value) => { value.lazyArt.errors[field] = -1; },
    ]),
    ['unavailable lazy-art values', (value) => { value.lazyArt.available = false; }],
    ['worker exact keys', (value) => { delete value.worker.live; }],
    ['worker availability shape', (value) => { value.worker.available = 'yes'; }],
    ['worker live shape', (value) => { value.worker.live = null; }],
    ...['starts', 'ready', 'disposals', 'fatals', 'protocolErrors'].map((field) => [
      `worker ${field} shape`, (value) => { value.worker[field] = -1; },
    ]),
    ['unavailable worker values', (value) => { value.worker.available = false; }],
    ['broker exact keys', (value) => { delete value.broker.cacheEntries; }],
    ['broker availability shape', (value) => { value.broker.available = 'yes'; }],
    ...[
      'cacheEntries', 'leases', 'subscribers', 'queuedJobs', 'activeJobs',
      'leasedKeyCount', 'cachedKeyCount',
      'leasedDistinctKeyCount', 'cachedDistinctKeyCount',
    ].map((field) => [
      `broker ${field} shape`, (value) => { value.broker[field] = -1; },
    ]),
    ['broker key-count cap shape', (value) => {
      value.broker.leasedKeyCount = MAX_THUMB_SETTLEMENT_BROKER_KEYS + 1;
    }],
    ['broker distinct-count cap shape', (value) => {
      value.broker.cachedDistinctKeyCount = MAX_THUMB_SETTLEMENT_BROKER_KEYS + 1;
    }],
    ['unavailable broker values', (value) => { value.broker.available = false; }],
    ['page exact keys', (value) => { delete value.page.targetId; }],
    ['target identity shape', (value) => { value.page.targetId = ''; }],
    ['session identity shape', (value) => { value.page.sessionId = ''; }],
    ['document identity shape', (value) => { value.page.documentToken = ''; }],
    ['page visibility shape', (value) => { value.page.visibilityState = ''; }],
    ['page hidden shape', (value) => { value.page.hidden = null; }],
    ['page focus shape', (value) => { value.page.focused = null; }],
  ];
  for (const [label, mutate] of shapeControls) {
    structuredInstrumentControlCount++;
    const changed = clone(green);
    mutate(changed);
    assert(classifyCompendiumThumbSettlement(changed, expected).status === 'error'
      && !validCompendiumThumbSettlementObservation(changed, expected),
    `structured thumbnail ${label} escaped strict bounded shape validation`);
  }
  const sampledUnwindowed = greenThumbSettlement('list', 64, 1500);
  sampledUnwindowed.ownership.rawImageCount = 1500;
  sampledUnwindowed.ownership.diagnosticImageCount = 1500;
  const sampledUnwindowedDecision = classifyCompendiumThumbSettlement(
    sampledUnwindowed, expected,
  );
  sampledUnwindowed.ready = false;
  sampledUnwindowed.reasons = [...sampledUnwindowedDecision.reasons];
  structuredInstrumentControlCount++;
  assert(sampledUnwindowedDecision.status === 'pending'
    && sampledUnwindowedDecision.reasons.includes('raw image count 1500/64')
    && sampledUnwindowedDecision.reasons.includes('diagnostic image count 1500/64')
    && validCompendiumThumbSettlementObservation(sampledUnwindowed, expected),
  'a 1,500-image regression could not retain its actionable 64-image bounded sample');
  const worstCase = greenThumbSettlement('list', 64, 1500);
  worstCase.schema = 'stale-schema';
  worstCase.surface = 'planetside';
  worstCase.expectedCount = 1499;
  worstCase.ownership.selector = '#foreign img';
  worstCase.ownership.rawImageCount = 1500;
  worstCase.ownership.diagnosticImageCount = 1500;
  worstCase.ownership.rawLogicalIds = Array.from({ length: 64 }, () => null);
  worstCase.ownership.diagnosticLogicalIds = Array.from({ length: 64 }, () => null);
  worstCase.diagnostic.panelMode = 'closed';
  worstCase.diagnostic.filteredCount = 1499;
  worstCase.diagnostic.thumbStates = Array.from({ length: 64 }, () => 'ready');
  worstCase.images.forEach((image, index) => {
    image.index = (index + 1) % 64;
    image.logicalId = null;
    image.visualKeyLength = null;
    image.leasedIndex = null;
    image.cachedIndex = null;
    image.thumbState = 'placeholder';
    image.srcPresent = false;
    image.complete = false;
    image.naturalWidth = 0;
    image.naturalHeight = 0;
  });
  worstCase.art.schema = 'stale-art';
  worstCase.art.queuedJobs = 1;
  worstCase.art.activeJobs = 1;
  worstCase.lazyArt.schema = 'stale-worker';
  worstCase.lazyArt.state = 'loading';
  worstCase.lazyArt.importStarts += 1;
  worstCase.lazyArt.identity.documentToken = 'foreign-lazy-document';
  worstCase.lazyArt.identity.lastProducerEpoch += 1;
  worstCase.lazyArt.phases.importCompletes += 1;
  worstCase.lazyArt.phases.thumbRenderCompletes += 1;
  worstCase.lazyArt.results.count += 1;
  for (const field of ['capability', 'protocol', 'import', 'paint', 'encode']) {
    worstCase.lazyArt.errors[field] = 1;
  }
  worstCase.worker = {
    available: false, live: null, starts: null, ready: null, disposals: null,
    fatals: null, protocolErrors: null,
  };
  worstCase.broker.queuedJobs = 2;
  worstCase.broker.activeJobs = 2;
  worstCase.page.targetId = 'foreign-target';
  worstCase.page.sessionId = 'foreign-session';
  worstCase.page.documentToken = 'foreign-document';
  worstCase.page.visibilityState = 'hidden';
  worstCase.page.hidden = true;
  worstCase.page.focused = false;
  const worstCaseDecision = classifyCompendiumThumbSettlement(worstCase, expected);
  worstCase.ready = false;
  worstCase.reasons = [...worstCaseDecision.reasons];
  structuredInstrumentControlCount++;
  assert(worstCaseDecision.status === 'error'
    && worstCaseDecision.reasons.length > 128
    && worstCaseDecision.reasons.length <= MAX_THUMB_SETTLEMENT_REASONS
    && !worstCaseDecision.reasons.some((reason) =>
      reason.startsWith('thumb settlement reason cardinality '))
    && validCompendiumThumbSettlementObservation(worstCase, expected),
  '64-image worst-case settlement reasons did not round-trip within the sealed bound');
  const excessiveReasons = clone(green);
  excessiveReasons.reasons = Array.from(
    { length: MAX_THUMB_SETTLEMENT_REASONS + 1 }, (_, index) => `reason-${index}`,
  );
  structuredInstrumentControlCount++;
  assert(!validCompendiumThumbSettlementObservation(excessiveReasons, expected),
    'a settlement observation exceeded the sealed reason cardinality');
  structuredInstrumentControlCount++;
  assertThrows(() => classifyCompendiumThumbSettlement(green, {
    ...expected, unsealed: true,
  }), 'structured thumbnail settlement accepted unsealed expected authority');
  structuredInstrumentControlCount++;
  assertThrows(() => classifyCompendiumThumbSettlement(planetside, {
    ...planetsideExpected, expectedCount: 8,
  }), 'structured Planetside settlement accepted an invented fixed image count');
}

function greenForegroundServiceObservation({
  targetId = 'foreground-target', sessionId = 'foreground-session',
  documentToken = 'foreground-document', serviceToken = 'foreground-service',
} = {}) {
  const visiblePhase = (sequence) => ({
    observed: true, sequence, visibilityState: 'visible', hidden: false, focused: true,
  });
  return {
    schema: FOREGROUND_SERVICE_OBSERVATION_SCHEMA,
    targetId, sessionId, documentToken, visibilityState: 'visible',
    hidden: false, focused: true,
    service: {
      token: serviceToken, visibilityChanges: 0, focusLosses: 0,
      arm: visiblePhase(0), raf: visiblePhase(1), laterTask: visiblePhase(2),
    },
  };
}

function syntheticProfileForegroundEvidence(profile) {
  const pageAuthorities = {
    lazy: {
      targetId: `${profile}-lazy-target`, sessionId: `${profile}-lazy-session`,
      documentToken: 'selftest-lazy-document',
    },
    main: {
      targetId: `${profile}-main-target`, sessionId: `${profile}-main-session`,
      documentToken: 'selftest-main-document',
    },
  };
  const foregroundServices = FOREGROUND_SERVICE_RECEIPT_LABELS.map((label, index) => {
    const pageAuthority = index === 1 ? pageAuthorities.main : pageAuthorities.lazy;
    const serviceToken = `${profile}-compendium-foreground-${index + 1}`;
    const expected = { ...pageAuthority, serviceToken };
    const issuedAtMs = index === 2 ? 4_000_000 : 1_000 + index * 10_000;
    return {
      schema: FOREGROUND_SERVICE_RECEIPT_SCHEMA,
      label,
      expected,
      observation: greenForegroundServiceObservation({ ...pageAuthority, serviceToken }),
      timing: {
        issuedAtMs,
        deadlineMs: issuedAtMs + FOREGROUND_SERVICE_RECEIPT_TIMEOUT_MS,
        receivedAtMs: issuedAtMs + 100,
        timeoutMs: FOREGROUND_SERVICE_RECEIPT_TIMEOUT_MS,
      },
      cleanup: { cleanupPresent: false, servicePresent: false },
    };
  });
  return { pageAuthorities, foregroundServices };
}

{
  const expected = {
    targetId: 'foreground-target', sessionId: 'foreground-session',
    documentToken: 'foreground-document', serviceToken: 'foreground-service',
  };
  const green = greenForegroundServiceObservation();
  assert(validCompendiumForegroundServiceObservation(green)
    && classifyCompendiumForegroundServiceTurn(green, expected).status === 'ready'
    && classifyCompendiumForegroundServiceTurnReceipt(green, expected, 100, 99).status === 'ready',
  'exact attach-derived foreground service receipt was rejected');
  const pendingPhase = () => ({
    observed: false, sequence: null, visibilityState: null, hidden: null, focused: null,
  });
  const foregroundControls = [
    ['wrong target', (value) => { value.targetId = 'foreign-target'; }, 'error'],
    ['wrong session', (value) => { value.sessionId = 'foreign-session'; }, 'error'],
    ['stale document', (value) => { value.documentToken = 'stale-document'; }, 'error'],
    ['wrong service', (value) => { value.service.token = 'foreign-service'; }, 'error'],
    ['hidden page state', (value) => { value.visibilityState = 'hidden'; }, 'error'],
    ['hidden page flag', (value) => { value.hidden = true; }, 'error'],
    ['unfocused page', (value) => { value.focused = false; }, 'error'],
    ['visibility loss', (value) => { value.service.visibilityChanges = 1; }, 'error'],
    ['focus loss', (value) => { value.service.focusLosses = 1; }, 'error'],
    ['hidden arm state', (value) => { value.service.arm.visibilityState = 'hidden'; }, 'error'],
    ['hidden arm flag', (value) => { value.service.arm.hidden = true; }, 'error'],
    ['unfocused arm', (value) => { value.service.arm.focused = false; }, 'error'],
    ['hidden rAF state', (value) => { value.service.raf.visibilityState = 'hidden'; }, 'error'],
    ['hidden rAF flag', (value) => { value.service.raf.hidden = true; }, 'error'],
    ['unfocused rAF', (value) => { value.service.raf.focused = false; }, 'error'],
    ['hidden later-task state', (value) => {
      value.service.laterTask.visibilityState = 'hidden';
    }, 'error'],
    ['hidden later-task flag', (value) => { value.service.laterTask.hidden = true; }, 'error'],
    ['unfocused later task', (value) => { value.service.laterTask.focused = false; }, 'error'],
    ['arm sequence', (value) => { value.service.arm.sequence = 1; }, 'error'],
    ['rAF sequence', (value) => { value.service.raf.sequence = 2; }, 'error'],
    ['later-task sequence', (value) => { value.service.laterTask.sequence = 1; }, 'error'],
    ['arm absent', (value) => { value.service.arm = pendingPhase(); }, 'error'],
    ['rAF pending', (value) => {
      value.service.raf = pendingPhase(); value.service.laterTask = pendingPhase();
    }, 'pending'],
    ['later task pending', (value) => { value.service.laterTask = pendingPhase(); }, 'pending'],
    ['phase reversal', (value) => { value.service.raf = pendingPhase(); }, 'error'],
  ];
  for (const [label, mutate, status] of foregroundControls) {
    structuredInstrumentControlCount++;
    const changed = clone(green);
    mutate(changed);
    const decision = classifyCompendiumForegroundServiceTurn(changed, expected);
    assert(decision.status === status && decision.reasons.length > 0,
      `foreground service ${label} did not produce an actionable ${status} decision`);
  }

  for (const [label, deadlineMs, receivedAtMs] of [
    ['exact deadline', 100, 100], ['late deadline', 100, 101],
  ]) {
    structuredInstrumentControlCount++;
    const decision = classifyCompendiumForegroundServiceTurnReceipt(
      green, expected, deadlineMs, receivedAtMs,
    );
    assert(decision.status === 'error'
      && decision.reasons[0].includes('received at/after deadline'),
    `foreground service ${label} remained certifying`);
  }
  const foregroundShapeControls = [
    ['schema shape', (value) => { value.schema = 'wrong'; }],
    ['top-level exact keys', (value) => { value.unsealed = true; }],
    ['target shape', (value) => { value.targetId = ''; }],
    ['session shape', (value) => { value.sessionId = ''; }],
    ['document shape', (value) => { value.documentToken = ''; }],
    ['visibility shape', (value) => { value.visibilityState = ''; }],
    ['hidden shape', (value) => { value.hidden = null; }],
    ['focused shape', (value) => { value.focused = null; }],
    ['service exact keys', (value) => { delete value.service.token; }],
    ['service token shape', (value) => { value.service.token = ''; }],
    ['visibility count shape', (value) => { value.service.visibilityChanges = -1; }],
    ['focus count shape', (value) => { value.service.focusLosses = -1; }],
    ['arm phase shape', (value) => { value.service.arm.sequence = null; }],
    ['rAF phase shape', (value) => { value.service.raf.hidden = null; }],
    ['later-task phase shape', (value) => { value.service.laterTask.observed = 'yes'; }],
  ];
  for (const [label, mutate] of foregroundShapeControls) {
    structuredInstrumentControlCount++;
    const changed = clone(green);
    mutate(changed);
    assert(!validCompendiumForegroundServiceObservation(changed)
      && classifyCompendiumForegroundServiceTurn(changed, expected).status === 'error',
    `foreground service ${label} escaped strict observation validation`);
  }
  structuredInstrumentControlCount++;
  assertThrows(() => classifyCompendiumForegroundServiceTurn(green, {
    ...expected, unsealed: true,
  }), 'foreground service accepted unsealed expected authority');
  structuredInstrumentControlCount++;
  assertThrows(() => classifyCompendiumForegroundServiceTurnReceipt(
    green, expected, 100, -1,
  ), 'foreground service accepted a negative monotonic receipt time');
}

{
  const attachment = {
    targetId: 'foreground-target', sessionId: 'foreground-session',
    documentToken: 'foreground-document',
  };
  const identities = {
    activationTargetId: attachment.targetId, sessionId: attachment.sessionId,
    serviceToken: 'foreground-service',
  };
  const source = candidateForegroundServiceExpression(identities);
  structuredInstrumentControlCount++;
  assert(validCandidateForegroundServiceExpression(source, identities)
    && !validCandidateForegroundServiceExpression(
      source.replace('requestAnimationFrame', 'queueMicrotask'), identities,
    )
    && COMPENDIUM_FOREGROUND_SERVICE_TIMEOUT_MS === 5_000,
  'collector foreground expression did not seal the exact rAF service source and timeout');
  structuredInstrumentControlCount++;
  assert(candidateForegroundCleanupExpression().includes('delete window[serviceKey]')
    && candidateForegroundCleanupExpression().includes('cleanupPresent:'),
  'collector foreground cleanup expression no longer removes and reports both globals');

  const runOwner = async ({
    activationTargetId = attachment.targetId,
    observedTargetId = activationTargetId,
    cleanup = { cleanupPresent: false, servicePresent: false },
    mutateObservation = () => {}, waitFailure = null,
    cleanupFailures = new Map(),
  } = {}) => {
    const calls = [];
    const observation = greenForegroundServiceObservation();
    observation.targetId = observedTargetId;
    mutateObservation(observation);
    try {
      const value = await ownCandidateForeground({
        attachment, activationTargetId, serviceToken: identities.serviceToken,
        label: 'fresh lazy-control',
        sendStage: async (label, method, params, sessionId) => {
          calls.push({ label, method, params, sessionId });
        },
        waitValue: async (sessionId, label, expression, options) => {
          calls.push({ label, method: 'candidate-wait', sessionId, expression });
          if (waitFailure !== null) throw waitFailure;
          const command = { phaseDeadlineMs: 6_000, target: { completedAtMs: 1_100 } };
          options.onObservation(observation, command);
          assert(options.acceptValue(observation) === true,
            'collector foreground waiter ignored its ready classifier decision');
          return observation;
        },
        evaluate: async (sessionId, expression, label) => {
          calls.push({ label, method: 'cleanup-evaluate', sessionId, expression });
          return cleanup;
        },
        sendCleanup: async (method, params, sessionId, options) => {
          calls.push({
            label: 'raw-failure-cleanup', method, params, sessionId, options,
          });
          if (cleanupFailures.has(method)) throw cleanupFailures.get(method);
          if (method === 'Runtime.evaluate') {
            return { result: { value: cleanup } };
          }
          return {};
        },
      });
      return { calls, value };
    } catch (error) {
      if (error !== null && typeof error === 'object') error.compendiumSelftestCalls = calls;
      throw error;
    }
  };
  const owned = await runOwner();
  structuredInstrumentControlCount++;
  assert(JSON.stringify(owned.calls.slice(0, 3).map((call) => [
    call.method, call.sessionId ?? null,
  ])) === JSON.stringify([
    ['Target.activateTarget', null],
    ['Emulation.setFocusEmulationEnabled', attachment.sessionId],
    ['Page.bringToFront', attachment.sessionId],
  ])
    && owned.calls[0].params.targetId === attachment.targetId
    && owned.calls[1].params.enabled === true
    && owned.value.expected.targetId === attachment.targetId
    && owned.value.observation.targetId === attachment.targetId
    && validCompendiumForegroundServiceReceipt(owned.value, 'fresh lazy-control')
    && owned.value.cleanup.cleanupPresent === false
    && owned.value.cleanup.servicePresent === false
    && !owned.calls.some((call) => call.method === 'Emulation.setFocusEmulationEnabled'
      && call.params?.enabled === false),
  'collector foreground owner lost activate -> focus -> bring-to-front order or attach identity');

  const failureCases = [
    ['wait', {
      waitFailure: new CandidateObservationError(
        'product-unanswerable', 'synthetic foreground wait failure', { selftest: true },
      ),
    }],
    ['shape', { mutateObservation: (value) => { value.schema = 'stale-schema'; } }],
    ['authority', { observedTargetId: 'foreign-target' }],
  ];
  for (const [label, options] of failureCases) {
    let rejected = null;
    try {
      await runOwner(options);
    } catch (error) {
      rejected = error;
    }
    const retainedCalls = rejected?.compendiumSelftestCalls || [];
    const cleanupMethods = retainedCalls.slice(-2).map((call) => call.method);
    structuredInstrumentControlCount++;
    assert(rejected instanceof Error
      && JSON.stringify(cleanupMethods) === JSON.stringify([
        'Runtime.evaluate', 'Emulation.setFocusEmulationEnabled',
      ])
      && retainedCalls.at(-1).params.enabled === false,
    `collector ${label} failure did not clean document state then disable focus in order`);
  }

  const primaryCleanupError = new CandidateObservationError(
    'product-unanswerable', 'synthetic classified foreground failure', { selftest: 'command' },
  );
  const cleanupFailures = new Map([
    ['Runtime.evaluate', new Error('synthetic document cleanup failure')],
    ['Emulation.setFocusEmulationEnabled', new Error('synthetic focus cleanup failure')],
  ]);
  let surfacedCleanupError = null;
  try { await runOwner({ waitFailure: primaryCleanupError, cleanupFailures }); }
  catch (error) { surfacedCleanupError = error; }
  structuredInstrumentControlCount++;
  assert(surfacedCleanupError === primaryCleanupError
    && isCandidateObservationError(surfacedCleanupError)
    && surfacedCleanupError.classification === 'product-unanswerable'
    && surfacedCleanupError.command?.selftest === 'command'
    && surfacedCleanupError.compendiumForegroundCleanupFailures?.length === 2
    && surfacedCleanupError.compendiumForegroundPrimaryMessage
      === 'synthetic classified foreground failure',
  'foreground cleanup failures replaced or reclassified the primary CandidateObservationError');

  let wrongActivationRejected = false;
  try {
    await runOwner({
      activationTargetId: 'foreign-target', observedTargetId: 'foreign-target',
    });
  } catch (error) {
    wrongActivationRejected = error?.compendiumObservation?.targetId === 'foreign-target'
      && error.message.includes('foreground authority');
  }
  structuredInstrumentControlCount++;
  assert(wrongActivationRejected,
    'collector foreground owner accepted activation of a different target');

  let cleanupResidueRejected = false;
  try { await runOwner({ cleanup: { cleanupPresent: false, servicePresent: true } }); }
  catch (error) { cleanupResidueRejected = error.message.includes('retained document globals'); }
  structuredInstrumentControlCount++;
  assert(cleanupResidueRejected,
    'collector foreground owner accepted retained service globals after cleanup');

  const collectorForegroundSource = fs.readFileSync(
    fileURLToPath(new URL('./compendiummem.mjs', import.meta.url)), 'utf8',
  );
  const claimStart = collectorForegroundSource.indexOf('const claimForeground = async');
  const claimEnd = collectorForegroundSource.indexOf('const seedSave = async', claimStart);
  const claimSource = claimStart >= 0 && claimEnd > claimStart
    ? collectorForegroundSource.slice(claimStart, claimEnd) : '';
  const clearOwner = claimSource.indexOf('foregroundOwner = null;');
  const claimOwner = claimSource.indexOf('const receipt = await ownCandidateForeground');
  const publishOwner = claimSource.indexOf('foregroundOwner = attachment;');
  structuredInstrumentControlCount++;
  assert(clearOwner >= 0 && claimOwner > clearOwner && publishOwner > claimOwner,
    'collector caller did not clear stale foreground ownership before a new claim');
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
    serviceWorker: { relativePath: 'service-worker.js', sha256: 'c'.repeat(64) },
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
  const browserForRun = (runId) => {
    const variants = {
      'selftest-1': {
        product: 'Edg/151.0.4129.101', revision: '@selftest-edge-101',
        jsVersion: '15.1.23.9', executable: '/selftest/edge-101',
      },
      'selftest-2': {
        product: 'Edg/151.0.4129.107', revision: '@selftest-edge-107',
        jsVersion: '15.1.24.1', executable: '/selftest/edge-107',
      },
      'selftest-3': {
        product: 'Edg/999.42.7.3', revision: '@selftest-edge-future',
        jsVersion: '99.42.7.3', executable: '/selftest/edge-future',
      },
      'selftest-baseline-1': {
        product: 'Edg/152.0.4200.1', revision: '@selftest-edge-baseline',
        jsVersion: '15.2.1.0', executable: '/selftest/edge-baseline',
      },
    };
    const variant = variants[runId];
    assert(variant, `synthetic browser provenance is missing for ${runId}`);
    return {
      ...variant,
      userAgent: `Microsoft Edge selftest provenance for ${runId}`,
      protocolVersion: '1.3',
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
    browser: browserForRun(runId),
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
  const browserAuthority = compendiumBrowserAuthority({
    product: 'Edg/151.0.4129.101', revision: '@selftest-edge-101',
    jsVersion: '15.1.23.9', protocolVersion: '1.3',
  });
  assert(browserAuthority, 'synthetic browser authority did not canonicalize');
  return {
    schema: BUDGET_SCHEMA, status: 'active',
    browserAuthority,
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
      rulerAuthority: {
        schema: 'cf-v2-compendium-fixed-ruler-authority/v1',
        calibrationStatus: 'sealed-exact-input',
        ceilingScope: 'numeric-ceilings-only',
        measurementAuthoritySha256: measurementAuthority.sha256,
        producerAuthoritySha256: producerAuthority.sha256,
        currentCertification: 'fresh-exact-producer-required',
      },
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

const SYNTHETIC_THUMB_EDGE_PX = 132;
const SYNTHETIC_WARM_RETAINED_UNLEASED_THUMBS = 17;
const SYNTHETIC_PLANETSIDE_LOGICAL_IDS = Object.freeze(
  Array.from({ length: 8 }, (_, index) => `planet:${index}`),
);
const SYNTHETIC_PLANETSIDE_VISUAL_KEYS = Object.freeze(
  SYNTHETIC_PLANETSIDE_LOGICAL_IDS.map((logicalId) => `visual-${logicalId}`),
);

function artSnapshot({ portrait = false, closed = false, generation = 1 } = {}) {
  const cacheEntries = 24;
  const decodedPixels = cacheEntries * SYNTHETIC_THUMB_EDGE_PX * SYNTHETIC_THUMB_EDGE_PX;
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
      leases: closed ? SYNTHETIC_PLANETSIDE_LOGICAL_IDS.length : 20, subscribers: 0,
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
    schema: 'cf-v2-species-art-worker-diagnostics/v2',
    state: 'idle', importStarts: 0,
    identity: {
      documentToken: 'selftest-lazy-document',
      lastProducerEpoch: 0, lastWorkerInstanceId: 0,
    },
    lastEvent: null,
    lastError: null,
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
    schema: 'cf-v2-species-art-worker-diagnostics/v2',
    state: 'ready', importStarts: 8,
    identity: {
      documentToken: 'selftest-main-document',
      lastProducerEpoch: 8, lastWorkerInstanceId: 8,
    },
    lastEvent: {
      producerEpoch: 8, workerInstanceId: 8, jobId: 87,
      kind: 'thumb132', event: 'result',
    },
    lastError: {
      producerEpoch: 1, workerInstanceId: 1, jobId: 1, kind: 'thumb132',
      stage: 'paint', code: 'injected-failure', message: PRODUCER_ERROR_ARM_MESSAGE,
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
  const widths = ids.map(() => SYNTHETIC_THUMB_EDGE_PX);
  const panelClosed = mode === 'closed';
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
      start: panelClosed ? 0 : (pinned ? 600 : 0),
      end: panelClosed ? 0 : (pinned ? 620 : Math.max(1, ids.length)),
      overscan: panelClosed ? 0 : 8,
      beforePx: panelClosed ? 0 : (pinned ? 34_800 : 0),
      afterPx: panelClosed ? 0 : 50_000,
      mountedRowCount: ids.length, mountedLogicalIds: [...ids],
      focusedLogicalId: panelClosed ? null : pinned,
      pinnedLogicalIds: panelClosed ? [] : (pinned ? [pinned] : []),
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
        visible: planetside,
        imageCount: planetside ? SYNTHETIC_PLANETSIDE_LOGICAL_IDS.length : 0,
        logicalIds: planetside ? [...SYNTHETIC_PLANETSIDE_LOGICAL_IDS] : [],
        naturalWidths: planetside
          ? SYNTHETIC_PLANETSIDE_LOGICAL_IDS.map(() => SYNTHETIC_THUMB_EDGE_PX) : [],
        naturalHeights: planetside
          ? SYNTHETIC_PLANETSIDE_LOGICAL_IDS.map(() => SYNTHETIC_THUMB_EDGE_PX) : [],
        thumbStates: planetside ? SYNTHETIC_PLANETSIDE_LOGICAL_IDS.map(() => 'ready') : [],
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
      planetsideImages: diagnostics.surfaces.planetside.logicalIds.map((logicalId, index) => ({
        logicalId, naturalWidth: SYNTHETIC_THUMB_EDGE_PX,
        naturalHeight: SYNTHETIC_THUMB_EDGE_PX,
        visualKey: SYNTHETIC_PLANETSIDE_VISUAL_KEYS[index], thumbState: 'ready',
      })),
      detailNaturalWidth: mode === 'detail' ? 440 : 0,
      detailNaturalHeight: mode === 'detail' ? 440 : 0,
      detailImageCount: mode === 'detail' ? 1 : 0,
      detailSrcPresent: mode === 'detail',
      activeLogicalId: null, activeElementId: null,
      focusedOutsideNormalWindow: pinned !== null,
      viewportHeight: 844, scrollerHeight: mode === 'closed' ? 0 : 600, scrollTop: 0,
    },
  };
}

function setSyntheticWarmRetainedThumbs(
  point, retainedCount = SYNTHETIC_WARM_RETAINED_UNLEASED_THUMBS,
) {
  const art = point.diagnostics.art;
  const leasedKeys = point.raw.planetsideImages.map((image) => image.visualKey);
  const retainedKeys = Array.from(
    { length: retainedCount }, (_, index) => `warm-retained-unleased-${index}`,
  );
  const cachedKeys = [...leasedKeys, ...retainedKeys];
  const decodedPixels = cachedKeys.length
    * SYNTHETIC_THUMB_EDGE_PX * SYNTHETIC_THUMB_EDGE_PX;
  art.live.cacheEntries = cachedKeys.length;
  art.live.decodedPixels = decodedPixels;
  art.live.decodedBytes = decodedPixels * 4;
  art.live.leases = leasedKeys.length;
  art.live.queuedJobs = 0;
  art.live.activeJobs = 0;
  art.live.subscribers = 0;
  art.live.portraitCacheEntries = 0;
  art.live.portraitEncodedBytes = 0;
  art.keys.leased = leasedKeys;
  art.keys.queued = [];
  art.keys.active = [];
  art.keys.cached = cachedKeys;
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
      heartbeat: { ok: true, ms: 15, product: 'Edg/151.0.4129.107' },
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

function syntheticThumbnailSettlementReceipt({
  profile, pageAuthority, candidateCommandTemplate, planIndex, attempt, issuedAtMs,
}) {
  const browserProduct = 'Edg/151.0.4129.107';
  const planEntry = THUMB_SETTLEMENT_RECEIPT_PLAN[planIndex];
  const receiptToken = compendiumThumbSettlementReceiptToken(
    profile, planEntry.label, attempt,
  );
  const expected = {
    surface: planEntry.surface,
    expectedCount: planEntry.expectedCount,
    ...pageAuthority,
    receiptToken,
  };
  const mountedCount = planEntry.expectedCount === 1 ? 1 : 2;
  const observation = greenThumbSettlement(
    planEntry.surface, mountedCount, planEntry.expectedCount,
    { receiptToken, pageAuthority },
  );
  const command = retimeCandidateEvidence(
    candidateCommandTemplate, profile, `${planEntry.label} thumb settlement`,
    issuedAtMs + 25,
  );
  command.phaseDeadlineMs = issuedAtMs + THUMB_SETTLEMENT_RECEIPT_TIMEOUT_MS;
  command.commandDeadlineMs = Math.min(
    command.phaseDeadlineMs, command.issuedAtMs + command.timeoutMs,
  );
  const receipt = {
    schema: THUMB_SETTLEMENT_RECEIPT_SCHEMA,
    label: planEntry.label,
    attempt,
    expected,
    observation,
    command,
    timing: {
      issuedAtMs,
      deadlineMs: issuedAtMs + THUMB_SETTLEMENT_RECEIPT_TIMEOUT_MS,
      receivedAtMs: Math.max(
        command.target.completedAtMs, command.heartbeat.completedAtMs,
      ),
      timeoutMs: THUMB_SETTLEMENT_RECEIPT_TIMEOUT_MS,
    },
  };
  assert(validCompendiumThumbSettlementReceipt(receipt, {
    profile, pageAuthority, browserProduct, planIndex,
  }), `${profile} synthetic thumbnail receipt ${planEntry.label} attempt ${attempt} was not exact`);
  return receipt;
}

function syntheticProfileThumbnailSettlements(
  profile, pageAuthority, candidateCommandTemplate,
) {
  return THUMB_SETTLEMENT_RECEIPT_PLAN.map((_, planIndex) => {
    return syntheticThumbnailSettlementReceipt({
      profile, pageAuthority, candidateCommandTemplate, planIndex, attempt: 1,
      issuedAtMs: 100_000 + planIndex * 40_000,
    });
  });
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
    snapshot({ generation: 20 + index, ids: [], mode: 'closed', portrait: false,
      closed: true, heap: 10_000_000 + index * 50 }));
  for (const point of [initial, firstPoint, resizeExpanded, resizeContracted, resizeRestored,
    middlePoint, lastPoint, filtered, detail, detailClosed, back, focusPinned, closed,
    planetside, ...warm]) {
    point.diagnostics.art.deviceClass = profile;
  }
  const nativeCacheEntries = profile === 'phone' ? 96 : 256;
  const nativeDecodedPixels = nativeCacheEntries
    * SYNTHETIC_THUMB_EDGE_PX * SYNTHETIC_THUMB_EDGE_PX;
  for (const point of warm) {
    point.diagnostics.art.limits.cacheEntries = nativeCacheEntries;
    point.diagnostics.art.limits.decodedPixels = nativeDecodedPixels;
    point.diagnostics.art.limits.decodedBytes = nativeDecodedPixels * 4;
    setSyntheticWarmRetainedThumbs(point);
  }
  const warmCachePrecondition = clone(warm[0]);
  const postCapRestored = clone(warm.at(-1));
  const producerErrorWitness = syntheticProducerErrorWitness(profile, fixture);
  producerErrorWitness.commands = syntheticProducerErrorCommands(
    candidateCommandTemplate, producerErrorWitness, profile,
  );
  const foregroundEvidence = syntheticProfileForegroundEvidence(profile);
  const thumbnailSettlements = syntheticProfileThumbnailSettlements(
    profile, foregroundEvidence.pageAuthorities.main, candidateCommandTemplate,
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
      serviceWorkerPath: 'service-worker.js', serviceWorkerSha256: 'c'.repeat(64),
      ownership: 'dedicated-worker-dynamic-import', matches: [], endMatches: [],
    },
    documentTokens: {
      lazy: 'selftest-lazy-document', lazyEnd: 'selftest-lazy-document',
      main: 'selftest-main-document',
    },
    pageAuthorities: foregroundEvidence.pageAuthorities,
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
      close: {
        beforeLeases: 24,
        afterLeases: SYNTHETIC_PLANETSIDE_LOGICAL_IDS.length,
        releasesDelta: 24 - SYNTHETIC_PLANETSIDE_LOGICAL_IDS.length,
      },
      planetsideLifecycle: {
        hidden: {
          computedHidden: true, liveLeases: 0,
          images: SYNTHETIC_PLANETSIDE_LOGICAL_IDS.map((logicalId) => ({
            logicalId, srcPresent: false, visualKeyPresent: false, thumbState: 'released',
          })),
        },
        revealed: {
          liveLeases: SYNTHETIC_PLANETSIDE_LOGICAL_IDS.length,
          logicalIds: [...SYNTHETIC_PLANETSIDE_LOGICAL_IDS],
          images: SYNTHETIC_PLANETSIDE_LOGICAL_IDS.map((logicalId, index) => ({
            logicalId, naturalWidth: SYNTHETIC_THUMB_EDGE_PX,
            naturalHeight: SYNTHETIC_THUMB_EDGE_PX,
            visualKey: SYNTHETIC_PLANETSIDE_VISUAL_KEYS[index], thumbState: 'ready',
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
      foregroundServices: foregroundEvidence.foregroundServices,
      thumbnailSettlements,
      thumbnailSettlementHistory: thumbnailSettlements.map(clone),
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
        heartbeat: { ok: true, ms: 15, product: 'Edg/151.0.4129.107' } },
      { target: { ok: true, ms: 25, value: `${profile}-last`, expected: `${profile}-last` },
        heartbeat: { ok: true, ms: 18, product: 'Edg/151.0.4129.107' } },
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
    executable: '/selftest/edge-107', product: 'Edg/151.0.4129.107',
    revision: '@selftest-edge-107', user_agent: 'Microsoft Edge selftest',
    js_version: '15.1.24.1', protocol_version: '1.3',
  };
  const browserAuthority = compendiumBudgetBrowserAuthority(budget);
  return {
    schema: REPORT_SCHEMA, status: 'pass', runId,
    lifecycle: {
      schema: 'cf-v2-compendium-report-lifecycle/v1', status: 'complete',
    },
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
    acceptValue = null, onObservation = null,
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
      return { product: side.product ?? 'Edg/151.0.4129.107' };
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
            ...(acceptValue ? { acceptValue } : {}),
            ...(acceptValue || onObservation ? {
              onObservation: (observation, command) => {
                observedValues.push(clone(observation));
                onObservation?.(observation, command);
              },
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
    heartbeat: { deltaMs: 15, product: 'Edg/151.0.4129.107' },
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
  const compactedThumbLedger = [];
  const recordCompactedThumb = createCandidateCommandRecorder({
    commandLedger: compactedThumbLedger,
    producerErrorCandidateLabels: new Set(),
    getProducerErrorWitness: () => null,
  });
  const firstThumbPoll = clone(candidateReady.ledger[0]);
  firstThumbPoll.label = `${THUMB_SETTLEMENT_RECEIPT_PLAN[0].label} thumb settlement`;
  const terminalThumbPoll = clone(firstThumbPoll);
  recordCompactedThumb(firstThumbPoll);
  recordCompactedThumb(terminalThumbPoll);
  const nextThumbAttemptPoll = clone(terminalThumbPoll);
  nextThumbAttemptPoll.phaseDeadlineMs += THUMB_SETTLEMENT_RECEIPT_TIMEOUT_MS;
  recordCompactedThumb(nextThumbAttemptPoll);
  assert(compactedThumbLedger.length === 2
    && compactedThumbLedger[0] === terminalThumbPoll
    && compactedThumbLedger[1] === nextThumbAttemptPoll,
  'thumbnail polling was not compacted to one terminal command per semantic deadline group');
  const countBoundLedger = [];
  const recordCountBound = createCandidateCommandRecorder({
    commandLedger: countBoundLedger,
    producerErrorCandidateLabels: new Set(),
    getProducerErrorWitness: () => null,
  });
  for (let index = 0; index < MAX_PARTIAL_COMMAND_LEDGER_ENTRIES; index++) {
    recordCountBound({ label: `bounded-${index}` });
  }
  assert(countBoundLedger.length === MAX_PARTIAL_COMMAND_LEDGER_ENTRIES,
    'candidate command recorder rejected its exact entry boundary');
  structuredInstrumentControlCount++;
  assertThrows(() => recordCountBound({ label: 'one-entry-over' }),
    'candidate command recorder accepted one entry beyond its sealed bound');
  assert(countBoundLedger.length === MAX_PARTIAL_COMMAND_LEDGER_ENTRIES,
    'entry-bound refusal mutated the retained command ledger');
  const byteBoundLedger = [];
  const recordByteBound = createCandidateCommandRecorder({
    commandLedger: byteBoundLedger,
    producerErrorCandidateLabels: new Set(),
    getProducerErrorWitness: () => null,
  });
  structuredInstrumentControlCount++;
  assertThrows(() => recordByteBound({
    label: 'one-command-over-byte-bound', payload: 'x'.repeat(MAX_PARTIAL_COMMAND_LEDGER_BYTES),
  }), 'candidate command recorder accepted a command beyond its sealed byte bound');
  assert(byteBoundLedger.length === 0,
    'byte-bound refusal mutated the retained command ledger');
  const candidateAnswerabilityReady = await runCandidateWaitScenario([{
    target: { deltaMs: 10, value: 'phone-first' },
    heartbeat: { deltaMs: 15, product: 'Edg/151.0.4129.107' },
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
  const candidateTerminalProductError = await runCandidateWaitScenario([{
    ...readyPlan,
    target: { deltaMs: 10, value: { state: 'error' } },
  }], {
    acceptValue: () => false,
    onObservation: () => {
      throw new CandidateObservationError(
        'product-fail', 'phone list thumb settlement: synthetic terminal product error',
      );
    },
  });
  assert(candidateTerminalProductError.failure?.classification === 'product-fail'
    && isCandidateObservationError(candidateTerminalProductError.failure)
    && candidateTerminalProductError.calls.length === 2
    && candidateTerminalProductError.ledger.length === 1
    && candidateTerminalProductError.observedValues.length === 1
    && candidateTerminalProductError.sleeps.length === 0
    && candidateTerminalProductError.stagesCompleted.length === 0,
  'one explicit product-error observation slept, repolled, or became an instrument timeout');
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
    heartbeat: { deltaMs: 15, product: 'Edg/151.0.4129.107' },
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
    heartbeat: { deltaMs: 15, product: 'Edg/151.0.4129.107' },
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
    heartbeat: { deltaMs: 15, product: 'Edg/151.0.4129.107' },
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
    heartbeat: { deltaMs: 15, product: 'Edg/151.0.4129.107' },
  }]);
  assert(candidateExactBoundary.failure?.classification === 'product-unanswerable'
    && candidateExactBoundary.calls.length === 2 && candidateExactBoundary.sleeps.length === 0,
  'an exact-deadline truthy target observation was accepted or retried');
  const candidateClipped = await runCandidateWaitScenario([{
    target: { deltaMs: 1199, value: { ready: true } },
    heartbeat: { deltaMs: 15, product: 'Edg/151.0.4129.107' },
  }], { phaseWindowMs: 1200 });
  assert(candidateClipped.failure === null
    && candidateClipped.calls.every((call) => call.options.timeoutMs === 1200),
  'candidate target/heartbeat commands were not clipped to the positive remaining phase time');
  const candidateEarlyFakeTimeout = await runCandidateWaitScenario([{
    target: { deltaMs: 10, reject: true, error: 'timed out waiting for Runtime.evaluate' },
    heartbeat: { deltaMs: 15, product: 'Edg/151.0.4129.107' },
  }]);
  assert(candidateEarlyFakeTimeout.failure?.classification === 'instrument',
    'an early protocol rejection merely spelling “timeout” fabricated product starvation');
  const candidatePageException = await runCandidateWaitScenario([{
    target: { deltaMs: 10, exception: 'selftest candidate page exception' },
    heartbeat: { deltaMs: 15, product: 'Edg/151.0.4129.107' },
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

  const deferredWindowScenario = async (settledBoundary) => {
    let deferredRemount = true;
    let surfaceReady = true;
    const sequence = [];
    const evaluate = async (_sessionId, _expression, label) => {
      sequence.push(`evaluate:${label}`);
      if (label.endsWith('animation task')
        || label.endsWith('deferred-window settlement')) {
        if (deferredRemount) {
          deferredRemount = false;
          surfaceReady = false;
        }
        return true;
      }
      if (label.endsWith('product/DOM snapshot')) {
        return {
          diagnostics: { exact: surfaceReady },
          raw: { listImages: [{ naturalWidth: surfaceReady ? 132 : 0 }] },
        };
      }
      return true;
    };
    const sendStage = async (label, method) => {
      sequence.push(`send:${label}:${method}`);
      if (method === 'Runtime.getHeapUsage') return {
        usedSize: 1, totalSize: 2, embedderHeapUsedSize: 3, backingStorageSize: 4,
      };
      if (method === 'Memory.getDOMCounters') return {
        documents: 1, nodes: 2, jsEventListeners: 3,
      };
      return {};
    };
    const waitReady = async () => {
      sequence.push('wait:thumbs-ready');
      surfaceReady = true;
      return { ready: true };
    };
    const dependencies = {
      sessionId: 'selftest-session', label: 'focused off-window row',
      rawSnapshotExpression: 'selftest-expression', evaluate, sendStage,
    };
    const point = settledBoundary
      ? await collectCandidateSettledThumbnailSnapshot({ ...dependencies, waitReady })
      : await collectCandidateSnapshot(dependencies);
    return { point, sequence };
  };
  const historicalDeferredCapture = await deferredWindowScenario(false);
  const settledDeferredCapture = await deferredWindowScenario(true);
  assert(historicalDeferredCapture.point.raw.listImages[0].naturalWidth === 0
    && settledDeferredCapture.point.raw.listImages[0].naturalWidth === 132
    && JSON.stringify(settledDeferredCapture.sequence.slice(0, 4)) === JSON.stringify([
      'wait:thumbs-ready',
      'evaluate:focused off-window row deferred-window settlement',
      'wait:thumbs-ready',
      'evaluate:focused off-window row animation task',
    ]),
  'deferred virtual-window remount was not consumed and re-settled before snapshot');

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
  const carriedRulerBudget = clone(budget);
  carriedRulerBudget.calibration.rulerAuthority.measurementAuthoritySha256 = 'd'.repeat(64);
  carriedRulerBudget.calibration.rulerAuthority.producerAuthoritySha256 = 'e'.repeat(64);
  for (const profile of ['phone', 'desktop']) {
    for (const sample of carriedRulerBudget.calibration.samples[profile]) {
      sample.measurementAuthoritySha256 = 'd'.repeat(64);
      sample.producerAuthoritySha256 = 'e'.repeat(64);
    }
    for (const sample of carriedRulerBudget.pairedBrokenBaseline.samples[profile]) {
      sample.measurementAuthoritySha256 = 'd'.repeat(64);
    }
  }
  const carriedRulerCheck = validateBudget(carriedRulerBudget);
  assert(carriedRulerCheck.ok,
    `historical ruler did not remain distinct from live authority: ${carriedRulerCheck.errors.join('; ')}`);
  const reboundRulerSample = clone(carriedRulerBudget);
  reboundRulerSample.calibration.samples.phone[0].producerAuthoritySha256 =
    reboundRulerSample.producerAuthority.sha256;
  const reboundRulerErrors = validateBudget(reboundRulerSample).errors.join('; ');
  assert(reboundRulerErrors.includes(
    'candidate calibration samples do not match the fixed ruler producer authority',
  ), 'one historical sample could be rebound to the live producer');
  const reboundRulerMeasurement = clone(carriedRulerBudget);
  reboundRulerMeasurement.pairedBrokenBaseline.samples.desktop[0].measurementAuthoritySha256 =
    reboundRulerMeasurement.measurementAuthority.sha256;
  const reboundMeasurementErrors = validateBudget(reboundRulerMeasurement).errors.join('; ');
  assert(reboundMeasurementErrors.includes(
    'paired broken-baseline samples do not match the fixed ruler measurement authority',
  ), 'one historical baseline sample could be rebound to the live measurement authority');
  assert(compendiumBudgetModeAllowed({ calibrate: false, budgetStatus: 'active' })
    && compendiumBudgetModeAllowed({ calibrate: true, budgetStatus: 'calibration-required' })
    && !compendiumBudgetModeAllowed({ calibrate: true, budgetStatus: 'active' })
    && !compendiumBudgetModeAllowed({ calibrate: false, budgetStatus: 'calibration-required' })
    && !compendiumBudgetModeAllowed({ calibrate: 'false', budgetStatus: 'active' }),
  'calibration/certification mode was not fail-closed against the exact budget state');
  const browserAuthority = compendiumBudgetBrowserAuthority(budget);
  assert(validCompendiumBrowserAuthority(browserAuthority),
    'synthetic Arc browser compatibility authority was invalid');
  const compatibleBrowserVariants = [
    {
      executable: '/selftest/edge-101', product: 'Edg/151.0.4129.101',
      revision: '@selftest-edge-101', user_agent: 'macOS Edge selftest',
      js_version: '15.1.23.9', protocol_version: '1.3',
    },
    {
      executable: '/usr/bin/microsoft-edge-stable', product: 'Edg/151.0.4129.107',
      revision: '@selftest-edge-107', user_agent: 'Linux Edge selftest',
      js_version: '15.1.24.1', protocol_version: '1.3',
    },
    {
      executable: '/future/edge', product: 'Edg/999.42.7.3',
      revision: '@selftest-edge-future', user_agent: 'Future Edge selftest',
      js_version: '99.42.7.3', protocol_version: '1.3',
    },
  ];
  for (const browser of compatibleBrowserVariants) {
    assert(JSON.stringify(compendiumBrowserAuthority(browser))
      === JSON.stringify(browserAuthority)
      && compendiumBrowserAuthorityMatches(browser, browserAuthority),
    `version-tolerant Edge authority rejected ${browser.product}`);
  }
  const historicalCapabilitySha256 =
    COMPENDIUM_BROWSER_HISTORICAL_CAPABILITY_CONTRACT_SHA256S[0];
  const historicalBrowserAuthority = {
    ...browserAuthority, capabilityContractSha256: historicalCapabilitySha256,
  };
  structuredInstrumentControlCount++;
  assert(COMPENDIUM_BROWSER_HISTORICAL_CAPABILITY_CONTRACT_SHA256S.length === 1
    && historicalCapabilitySha256
      === '6eed33ed9784f7c7774c4b1bf8d4e880986e31667324d9a1aa7b8dd62fe5a476'
    && validCompendiumBrowserAuthority(historicalBrowserAuthority)
    && compendiumBrowserAuthorityMatches(
      compatibleBrowserVariants[0], historicalBrowserAuthority,
    ),
  'the known historical browser-capability authority did not remain semantically verifiable');
  const unknownBrowserAuthority = {
    ...historicalBrowserAuthority, capabilityContractSha256: 'f'.repeat(64),
  };
  structuredInstrumentControlCount++;
  assert(!validCompendiumBrowserAuthority(unknownBrowserAuthority)
    && !compendiumBrowserAuthorityMatches(
      compatibleBrowserVariants[0], unknownBrowserAuthority,
    ),
  'an unknown browser-capability authority matched current Edge semantics');
  const historicalAuthorityBudget = clone(budget);
  historicalAuthorityBudget.browserAuthority = historicalBrowserAuthority;
  const historicalAuthorityBudgetCheck = validateBudget(historicalAuthorityBudget);
  structuredInstrumentControlCount++;
  assert(compendiumBudgetBrowserAuthority(historicalAuthorityBudget) === null
    && !historicalAuthorityBudgetCheck.ok
    && historicalAuthorityBudgetCheck.errors.some((error) =>
      error.includes('budget browser authority is invalid')),
  'a historical browser-capability hash served as the current budget authority');
  const incompatibleBrowserVariants = [
    ['Chrome family', { ...compatibleBrowserVariants[0], product: 'Chrome/151.0.4129.101' }],
    ['malformed Edge product', { ...compatibleBrowserVariants[0], product: 'Edg/151.0.4129' }],
    ['missing product', { ...compatibleBrowserVariants[0], product: '' }],
    ['missing revision', { ...compatibleBrowserVariants[0], revision: '' }],
    ['missing JavaScript version', { ...compatibleBrowserVariants[0], js_version: '' }],
    ['incompatible CDP protocol', { ...compatibleBrowserVariants[0], protocol_version: '9.9' }],
  ];
  for (const [label, browser] of incompatibleBrowserVariants) {
    assert(compendiumBrowserAuthority(browser) === null
      && !compendiumBrowserAuthorityMatches(browser, browserAuthority),
    `${label} matched the Arc browser compatibility authority`);
  }
  assert(new Set(budget.calibration.samples.phone
    .map((sample) => sample.browser.product)).size === 3,
  'synthetic calibration did not exercise three independently updated Edge versions');
  const freshHostProvenanceBudget = clone(budget);
  for (const profile of ['phone', 'desktop']) {
    for (const sample of freshHostProvenanceBudget.calibration.samples[profile]) {
      sample.browser.executable = `/private/tmp/${sample.runId}/Microsoft Edge`;
      sample.browser.userAgent = `host provenance for ${sample.runId}`;
    }
    for (const sample of freshHostProvenanceBudget.pairedBrokenBaseline.samples[profile]) {
      sample.browser.executable = `/private/tmp/${sample.runId}/Microsoft Edge`;
      sample.browser.userAgent = `baseline host provenance for ${sample.runId}`;
    }
  }
  const freshHostProvenanceCheck = validateBudget(freshHostProvenanceBudget);
  assert(freshHostProvenanceCheck.ok
    && new Set(freshHostProvenanceBudget.calibration.samples.phone
      .map((sample) => sample.browser.executable)).size === 3,
  `distinct per-run browser paths/host UAs did not embed under one compatibility authority: ${freshHostProvenanceCheck.errors.join('; ')}`);
  const exactObservedBrowser = {
    executable: '/selftest/edge-101', product: 'Edg/151.0.4129.101',
    revision: '@selftest-edge-101', user_agent: 'Microsoft Edge selftest',
    js_version: '15.1.23.9', protocol_version: '1.3',
  };
  const runInjectedBrowserAuthority = async ({
    label, budgetRecord = budget, observedBrowser = exactObservedBrowser,
  }) => {
    const evidence = [];
    let collectionCalls = 0;
    let thrown = null;
    let value = null;
    try {
      value = await collectWithCompendiumBrowserAuthority({
        budget: budgetRecord, browser: observedBrowser,
        recordEvidence: (record) => { evidence.push(record); },
        collect: async () => { collectionCalls += 1; return `${label}-collected`; },
        mismatchMessage: `${label} browser authority mismatch`,
      });
    } catch (error) { thrown = error; }
    return { evidence, collectionCalls, thrown, value };
  };
  const compatibleAuthorityCollection = await runInjectedBrowserAuthority({
    label: 'candidate-compatible',
  });
  assert(compatibleAuthorityCollection.thrown === null
    && compatibleAuthorityCollection.value === 'candidate-compatible-collected'
    && compatibleAuthorityCollection.collectionCalls === 1
    && compatibleAuthorityCollection.evidence.length === 1
    && compatibleAuthorityCollection.evidence[0].browserAuthorityMatch === true
    && JSON.stringify(compatibleAuthorityCollection.evidence[0].browserAuthority)
      === JSON.stringify(browserAuthority),
  'browser compatibility authority did not record true before one protected collection');
  for (const kind of ['candidate', 'baseline']) {
    for (const browser of compatibleBrowserVariants) {
      const updated = await runInjectedBrowserAuthority({
        label: `${kind}-${browser.product.replaceAll('.', '-')}`,
        observedBrowser: browser,
      });
      assert(updated.thrown === null && updated.collectionCalls === 1
        && updated.evidence.length === 1
        && updated.evidence[0].browserAuthorityMatch === true,
      `${kind} ${browser.product} update was rejected or retried`);
    }
    for (const [label, observedBrowser] of incompatibleBrowserVariants) {
      const incompatible = await runInjectedBrowserAuthority({
        label: `${kind}-${label.replaceAll(' ', '-').toLowerCase()}`, observedBrowser,
      });
      assert(incompatible.thrown?.message.endsWith('browser authority mismatch')
        && incompatible.collectionCalls === 0 && incompatible.evidence.length === 1
        && JSON.stringify(incompatible.evidence[0].browserAuthority)
          === JSON.stringify(browserAuthority)
        && incompatible.evidence[0].browserAuthorityMatch === false,
      `${kind} ${label} collected product/profile evidence or retried`);
    }
    const nullAuthorityBudget = clone(budget);
    nullAuthorityBudget.browserAuthority = null;
    const nullAuthority = await runInjectedBrowserAuthority({
      label: `${kind}-null`, budgetRecord: nullAuthorityBudget,
    });
    assert(nullAuthority.thrown?.message === `${kind}-null browser authority mismatch`
      && nullAuthority.collectionCalls === 0 && nullAuthority.evidence.length === 1
      && nullAuthority.evidence[0].browserAuthority === null
      && nullAuthority.evidence[0].browserAuthorityMatch === false,
    `${kind} null browser authority collected product/profile evidence or retried`);
    const forgedAuthorityBudget = clone(budget);
    forgedAuthorityBudget.browserAuthority = {
      ...clone(browserAuthority), family: 'google-chrome',
    };
    const forgedAuthority = await runInjectedBrowserAuthority({
      label: `${kind}-forged`, budgetRecord: forgedAuthorityBudget,
    });
    assert(forgedAuthority.thrown?.message === `${kind}-forged browser authority mismatch`
      && forgedAuthority.collectionCalls === 0 && forgedAuthority.evidence.length === 1
      && forgedAuthority.evidence[0].browserAuthorityMatch === false,
    `${kind} forged compatibility authority collected product evidence or retried`);
  }
  const updatedBaselineBrowser = clone(budget);
  for (const profile of ['phone', 'desktop']) {
    updatedBaselineBrowser.pairedBrokenBaseline.samples[profile][0].browser = {
      executable: '/selftest/edge-baseline-updated', product: 'Edg/1000.0.0.1',
      revision: '@selftest-edge-baseline-updated',
      userAgent: 'Updated baseline Edge selftest', jsVersion: '100.0.0.1',
      protocolVersion: '1.3',
    };
  }
  assert(validateBudget(updatedBaselineBrowser).ok,
    'a paired baseline Edge update shared by both profiles forced a rebaseline');
  for (const [field, value] of [
    ['product', 'Edg/1001.0.0.1'], ['revision', '@other-revision'],
    ['jsVersion', '101.0.0.1'], ['executable', '/other/edge'],
    ['userAgent', 'other host provenance'], ['protocolVersion', '9.9'],
  ]) {
    const mismatchedRunBrowser = clone(updatedBaselineBrowser);
    mismatchedRunBrowser.pairedBrokenBaseline.samples.phone[0].browser[field] = value;
    assert(validateBudget(mismatchedRunBrowser).errors.some((error) =>
      /does not bind one exact browser provenance tuple across profiles/.test(error)),
    `paired baseline same-run ${field} mismatch escaped provenance pairing`);
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
    /candidate calibration samples do not match the fixed ruler measurement authority/.test(error)),
  'a candidate sample from a stale measurement authority entered the active ruler');
  const staleBaselineSampleAuthority = clone(budget);
  staleBaselineSampleAuthority.pairedBrokenBaseline.samples.desktop[0]
    .measurementAuthoritySha256 = 'f'.repeat(64);
  assert(validateBudget(staleBaselineSampleAuthority).errors.some((error) =>
    /paired broken-baseline samples do not match the fixed ruler measurement authority/.test(error)),
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
    /candidate calibration samples do not match the fixed ruler producer authority/.test(error)),
  'a candidate sample from a stale built producer entered the active ruler');
  const forgedProducerAuthorityInput = clone(budget);
  forgedProducerAuthorityInput.producerAuthority.inputs.worker.sha256 = '0'.repeat(64);
  assert(validateBudget(forgedProducerAuthorityInput).errors.some((error) =>
    /producer authority is invalid/.test(error)),
  'a forged producer-authority input retained a stale aggregate digest');
  const forgedServiceWorkerAuthorityInput = clone(budget);
  forgedServiceWorkerAuthorityInput.producerAuthority.inputs.serviceWorker.sha256 = '0'.repeat(64);
  assert(validateBudget(forgedServiceWorkerAuthorityInput).errors.some((error) =>
    /producer authority is invalid/.test(error)),
  'a forged service-worker authority input retained a stale aggregate digest');
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
    /does not match the current built index\/owner\/worker\/painter\/service-worker/.test(error)),
  'a self-consistent stale producer authority matched the current built graph');
  const staleServiceWorkerAuthority = clone(budget);
  staleServiceWorkerAuthority.producerAuthority.inputs.serviceWorker.sha256 = '0'.repeat(64);
  staleServiceWorkerAuthority.producerAuthority.sha256 = sha256(
    JSON.stringify(staleServiceWorkerAuthority.producerAuthority.inputs),
  );
  assert(validateBudget(staleServiceWorkerAuthority).errors.some((error) =>
    /does not match the current built index\/owner\/worker\/painter\/service-worker/.test(error)),
  'a self-consistent service-worker mutant matched the current built graph');
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
  const producerObservations = (group) => [
    ...group.falsyObservations, group.accepted,
  ].filter(Boolean);
  const offsetProducerArtHistory = (observation, added) => {
    observation.art.cachedKeyCount += added;
    observation.art.live.cacheEntries += added;
    observation.art.totals.jobStarts += added;
    observation.art.totals.jobCompletes += added;
  };
  const offsetProducerLeaseHistory = (observation, added) => {
    observation.art.totals.leaseAcquires += added;
    observation.art.totals.releases += added;
  };
  const addPreArmCachedKeys = (witness, keys) => {
    const acceptedPre = witness.preArm.accepted;
    const before = new Set(acceptedPre.cachedKeys);
    for (const key of keys) before.add(key);
    const added = before.size - acceptedPre.cachedKeys.length;
    for (const observation of producerObservations(witness.preArm)) {
      const observationKeys = new Set(observation.cachedKeys);
      for (const key of keys) observationKeys.add(key);
      observation.cachedKeys = [...observationKeys].sort();
      offsetProducerArtHistory(observation, added);
      offsetProducerLeaseHistory(observation, added);
    }
    return added;
  };
  const cacheProducerKeysBeforeArm = (witness, keys) => {
    const added = addPreArmCachedKeys(witness, keys);
    for (const observation of witness.publication.falsyObservations) {
      offsetProducerArtHistory(observation, added);
    }
    for (const observation of [
      ...producerObservations(witness.publication),
      ...producerObservations(witness.recovery),
    ]) {
      offsetProducerLeaseHistory(observation, added);
    }
  };
  const carryProducerCacheHistory = (witness, keys) => {
    const added = addPreArmCachedKeys(witness, keys);
    for (const observation of [
      ...producerObservations(witness.publication),
      ...producerObservations(witness.recovery),
    ]) {
      offsetProducerArtHistory(observation, added);
      offsetProducerLeaseHistory(observation, added);
    }
  };
  const producerHistoryChronological = (witness) => {
    const observations = [
      ...producerObservations(witness.preArm),
      ...producerObservations(witness.publication),
      ...producerObservations(witness.recovery),
    ];
    return observations.every((observation, index) => {
      if (index === 0) return true;
      const prior = observations[index - 1].art;
      return observation.art.cachedKeyCount >= prior.cachedKeyCount
        && observation.art.live.cacheEntries >= prior.live.cacheEntries
        && Object.keys(prior.totals).every((key) =>
          observation.art.totals[key] >= prior.totals[key]);
    });
  };
  const equalCardinalityCold = clone(phone.phases.producerErrorWitness);
  carryProducerCacheHistory(equalCardinalityCold, Array.from(
    { length: equalCardinalityCold.publication.accepted.mountedRowCount
      - equalCardinalityCold.preArm.accepted.cachedKeys.length },
    (_, index) => `unrelated-prearm-key-${index}`,
  ));
  const largerPreCacheCold = clone(equalCardinalityCold);
  carryProducerCacheHistory(largerPreCacheCold, ['one-more-unrelated-prearm-key']);
  const allMountedWarm = clone(phone.phases.producerErrorWitness);
  cacheProducerKeysBeforeArm(
    allMountedWarm, allMountedWarm.publication.accepted.rows.map((row) => row.visualKey),
  );
  const rowZeroWarm = clone(phone.phases.producerErrorWitness);
  cacheProducerKeysBeforeArm(rowZeroWarm, [rowZeroWarm.publication.accepted.rows[0].visualKey]);
  assert(producerErrorColdProof(equalCardinalityCold, 'phone')
    && producerErrorContained(equalCardinalityCold, 'phone')
    && producerErrorRecoverable(equalCardinalityCold, 'phone')
    && producerHistoryChronological(equalCardinalityCold)
    && producerErrorColdProof(largerPreCacheCold, 'phone')
    && producerErrorContained(largerPreCacheCold, 'phone')
    && producerErrorRecoverable(largerPreCacheCold, 'phone')
    && producerHistoryChronological(largerPreCacheCold)
    && !producerErrorColdProof(allMountedWarm, 'phone')
    && !producerErrorColdProof(rowZeroWarm, 'phone')
    && producerHistoryChronological(rowZeroWarm),
  'exact cold-key lifecycle depended on unrelated cache cardinality or lost stable row-zero ownership');
  const mixedWarmCold = clone(phone.phases.producerErrorWitness);
  cacheProducerKeysBeforeArm(
    mixedWarmCold, mixedWarmCold.publication.accepted.rows.slice(-5).map((row) => row.visualKey),
  );
  const insufficientColdStarts = clone(mixedWarmCold);
  const insufficientArt = insufficientColdStarts.publication.accepted.art;
  insufficientArt.totals.jobStarts--;
  insufficientArt.totals.jobCompletes--;
  insufficientArt.cachedKeyCount--;
  insufficientArt.live.cacheEntries--;
  const insufficientPreArt = insufficientColdStarts.preArm.accepted.art;
  const insufficientColdKeyCount = new Set(insufficientColdStarts.publication.accepted.rows
    .map((row) => row.visualKey)
    .filter((key) => !insufficientColdStarts.preArm.accepted.cachedKeys.includes(key))).size;
  const insufficientStartDelta = insufficientArt.totals.jobStarts
    - insufficientPreArt.totals.jobStarts;
  const insufficientCompleteDelta = insufficientArt.totals.jobCompletes
    - insufficientPreArt.totals.jobCompletes;
  const insufficientErrorDelta = insufficientArt.totals.jobErrors
    - insufficientPreArt.totals.jobErrors;
  assert(producerErrorContained(mixedWarmCold, 'phone')
    && producerHistoryChronological(mixedWarmCold)
    && producerHistoryChronological(insufficientColdStarts)
    && insufficientStartDelta === insufficientColdKeyCount - 1
    && insufficientStartDelta === insufficientCompleteDelta + insufficientErrorDelta
    && !producerErrorContained(insufficientColdStarts, 'phone'),
  'mixed warm/cold publication did not bind job starts to the exact cold mounted-key count');
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

    const reorderedLru = clone(measurement);
    [reorderedLru.phases.warmCachePrecondition, ...reorderedLru.points.warm]
      .forEach((point, index) => {
        const keys = point.diagnostics.art.keys.cached;
        const offset = (index + 1) % keys.length;
        point.diagnostics.art.keys.cached = [...keys.slice(offset), ...keys.slice(0, offset)];
      });
    const reorderedOutcomes = evaluateProfile(reorderedLru, budget, fixture);
    assert(reorderedOutcomes.every((outcome) => outcome.status === 'pass'),
      `${measurement.profile} stable cache membership was coupled to raw LRU insertion order`);
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
    ['service-worker producer drift', (m) => {
      m.lazySpeciesResource.serviceWorkerSha256 = '0'.repeat(64);
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
    ['producer error all mounted keys were already warm', (m) => {
      const w = m.phases.producerErrorWitness;
      cacheProducerKeysBeforeArm(
        w, w.publication.accepted.rows.map((row) => row.visualKey),
      );
    }, 'error-contained'],
    ['producer error invariant row zero was already warm', (m) => {
      cacheProducerKeysBeforeArm(m.phases.producerErrorWitness, ['producer-key-0']);
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
    ['close ownership leak', (m) => {
      m.points.closed.diagnostics.art.live.leases
        = SYNTHETIC_PLANETSIDE_LOGICAL_IDS.length + 1;
    }, 'close-restores-focus'],
    ['closed detail source retained', (m) => { m.points.detailClosed.raw.detailSrcPresent = true; m.points.detailClosed.raw.detailNaturalWidth = 440; m.points.detailClosed.raw.detailNaturalHeight = 440; }, 'close-dom-cleanup'],
    ['planetside overflow', (m) => { m.points.planetside.diagnostics.surfaces.planetside.logicalIds = Array.from({ length: 9 }, (_, i) => `p:${i}`); }, 'planetside-bounded'],
    ['hidden Planetside source retained', (m) => { m.phases.planetsideLifecycle.hidden.images[0].srcPresent = true; }, 'planetside-hide-release-reacquire'],
    ['filter wrong count', (m) => { m.points.filtered.diagnostics.panel.filteredCount = 2; }, 'filter-result'],
    ['missing first', (m) => { m.points.first.raw.mountedLogicalIds = []; }, 'first-row-reached'],
    ['missing middle', (m) => { m.points.middle.raw.mountedLogicalIds = []; }, 'middle-row-reached'],
    ['missing last', (m) => { m.points.last.raw.mountedLogicalIds = []; }, 'last-row-reached'],
    ['warm jobs', (m) => { m.points.warm[2].diagnostics.art.live.activeJobs = 1; }, 'settled-jobs'],
    ['warm series short', (m) => { m.points.warm.pop(); }, 'warm-precondition'],
    ['warm precondition Compendium panel open', (m) => {
      m.phases.warmCachePrecondition.diagnostics.panel.open = true;
      m.phases.warmCachePrecondition.diagnostics.panel.mode = 'list';
    }, 'warm-precondition'],
    ['warm cycle Compendium panel open', (m) => {
      m.points.warm[1].diagnostics.panel.open = true;
      m.points.warm[1].diagnostics.panel.mode = 'list';
    }, 'warm-precondition'],
    ['warm precondition retained mounted window row', (m) => {
      const point = m.phases.warmCachePrecondition;
      point.diagnostics.window.end = 1;
      point.diagnostics.window.overscan = 8;
      point.diagnostics.window.afterPx = 49_942;
      point.diagnostics.window.mountedRowCount = 1;
      point.diagnostics.window.mountedLogicalIds = ['warm-leaked-window-row'];
      point.raw.mountedRowCount = 1;
      point.raw.mountedLogicalIds = ['warm-leaked-window-row'];
      point.raw.rowRects = [{
        logicalId: 'warm-leaked-window-row', top: 0, bottom: 58, height: 58,
      }];
      point.raw.scrollerHeight = 600;
    }, 'warm-precondition'],
    ['warm cycle retained valid list thumbnail DOM', (m) => {
      const point = m.points.warm[2];
      const logicalId = 'warm-leaked-list-row';
      point.diagnostics.window.end = 1;
      point.diagnostics.window.overscan = 8;
      point.diagnostics.window.afterPx = 49_942;
      point.diagnostics.window.mountedRowCount = 1;
      point.diagnostics.window.mountedLogicalIds = [logicalId];
      point.diagnostics.surfaces.list = {
        imageCount: 1,
        naturalWidths: [SYNTHETIC_THUMB_EDGE_PX],
        naturalHeights: [SYNTHETIC_THUMB_EDGE_PX],
        thumbStates: ['ready'],
        logicalIds: [logicalId],
      };
      point.raw.mountedRowCount = 1;
      point.raw.mountedLogicalIds = [logicalId];
      point.raw.rowRects = [{ logicalId, top: 0, bottom: 58, height: 58 }];
      point.raw.listImages = [{
        logicalId,
        naturalWidth: SYNTHETIC_THUMB_EDGE_PX,
        naturalHeight: SYNTHETIC_THUMB_EDGE_PX,
        visualKey: 'warm-leaked-list-visual-key',
        sourceSha256: 'a'.repeat(64),
      }];
      point.raw.scrollerHeight = 600;
    }, 'warm-precondition'],
    ['warm cycle retained live detail portrait DOM', (m) => {
      const point = m.points.warm[3];
      point.diagnostics.surfaces.detail = {
        open: true,
        logicalId: 'warm-leaked-detail',
        naturalWidth: 440,
        naturalHeight: 440,
      };
      point.raw.detailNaturalWidth = 440;
      point.raw.detailNaturalHeight = 440;
      point.raw.detailImageCount = 1;
      point.raw.detailSrcPresent = true;
    }, 'warm-precondition'],
    ['warm diagnostic window drift without raw leak', (m) => {
      m.phases.warmCachePrecondition.diagnostics.window.start = 1;
    }, 'warm-precondition'],
    ['warm raw mounted row leak without diagnostic drift', (m) => {
      m.points.warm[0].raw.mountedRowCount = 1;
    }, 'warm-precondition'],
    ['warm diagnostic list leak without raw image', (m) => {
      m.points.warm[1].diagnostics.surfaces.list = {
        imageCount: 1,
        naturalWidths: [SYNTHETIC_THUMB_EDGE_PX],
        naturalHeights: [SYNTHETIC_THUMB_EDGE_PX],
        thumbStates: ['ready'],
        logicalIds: ['warm-diagnostic-only-list-row'],
      };
    }, 'warm-precondition'],
    ['warm raw list leak without diagnostic image', (m) => {
      m.points.warm[1].raw.listImages = [{
        logicalId: 'warm-raw-only-list-row',
        naturalWidth: SYNTHETIC_THUMB_EDGE_PX,
        naturalHeight: SYNTHETIC_THUMB_EDGE_PX,
        visualKey: 'warm-raw-only-list-visual-key',
        sourceSha256: 'b'.repeat(64),
      }];
    }, 'warm-precondition'],
    ['warm diagnostic detail leak without raw source', (m) => {
      m.points.warm[2].diagnostics.surfaces.detail = {
        open: true,
        logicalId: 'warm-diagnostic-only-detail',
        naturalWidth: 440,
        naturalHeight: 440,
      };
    }, 'warm-precondition'],
    ['warm raw detail leak without diagnostic detail', (m) => {
      const raw = m.points.warm[2].raw;
      raw.detailNaturalWidth = 440;
      raw.detailNaturalHeight = 440;
      raw.detailImageCount = 1;
      raw.detailSrcPresent = true;
    }, 'warm-precondition'],
    ['warm precondition hid Planetside roster', (m) => {
      m.phases.warmCachePrecondition.diagnostics.surfaces.planetside.visible = false;
    }, 'warm-precondition'],
    ['warm precondition Planetside roster short', (m) => {
      m.phases.warmCachePrecondition.raw.planetsideImages.pop();
    }, 'warm-precondition'],
    ['warm precondition Planetside logical identity duplicated', (m) => {
      const images = m.phases.warmCachePrecondition.raw.planetsideImages;
      images[1].logicalId = images[0].logicalId;
    }, 'warm-precondition'],
    ['warm precondition diagnostic Planetside roster drift', (m) => {
      m.phases.warmCachePrecondition.diagnostics.surfaces.planetside.logicalIds[0]
        = 'warm-diagnostic-roster-drift';
    }, 'warm-precondition'],
    ['warm precondition Planetside visual identity duplicated', (m) => {
      const images = m.phases.warmCachePrecondition.raw.planetsideImages;
      images[1].visualKey = images[0].visualKey;
    }, 'warm-precondition'],
    ['warm precondition Planetside thumbnail not exact 132px', (m) => {
      m.phases.warmCachePrecondition.raw.planetsideImages[0].naturalWidth
        = SYNTHETIC_THUMB_EDGE_PX - 1;
    }, 'warm-precondition'],
    ['warm precondition Planetside thumbnail not ready', (m) => {
      m.phases.warmCachePrecondition.raw.planetsideImages[0].thumbState = 'placeholder';
    }, 'warm-precondition'],
    ['warm precondition live lease cardinality drift', (m) => {
      m.phases.warmCachePrecondition.diagnostics.art.live.leases++;
    }, 'warm-precondition'],
    ['warm precondition retained queued-key inventory', (m) => {
      m.phases.warmCachePrecondition.diagnostics.art.keys.queued
        = ['warm-stale-queued-key'];
    }, 'warm-precondition'],
    ['warm precondition retained active-key inventory', (m) => {
      m.phases.warmCachePrecondition.diagnostics.art.keys.active
        = ['warm-stale-active-key'];
    }, 'warm-precondition'],
    ['warm precondition retained-unleased count 16', (m) => {
      setSyntheticWarmRetainedThumbs(m.phases.warmCachePrecondition, 16);
    }, 'warm-precondition'],
    ['warm precondition retained-unleased count 18', (m) => {
      setSyntheticWarmRetainedThumbs(m.phases.warmCachePrecondition, 18);
    }, 'warm-precondition'],
    ['warm precondition decoded-pixel math drift', (m) => {
      m.phases.warmCachePrecondition.diagnostics.art.live.decodedPixels
        -= SYNTHETIC_THUMB_EDGE_PX * SYNTHETIC_THUMB_EDGE_PX;
    }, 'warm-precondition'],
    ['warm precondition decoded-byte math drift', (m) => {
      m.phases.warmCachePrecondition.diagnostics.art.live.decodedBytes
        -= SYNTHETIC_THUMB_EDGE_PX * SYNTHETIC_THUMB_EDGE_PX * 4;
    }, 'warm-precondition'],
    ['warm precondition encoded bytes exceed product limit', (m) => {
      const a = m.phases.warmCachePrecondition.diagnostics.art;
      a.live.encodedBytes = a.limits.encodedBytes + 1;
    }, 'warm-precondition'],
    ['warm precondition device class drift', (m) => {
      m.phases.warmCachePrecondition.diagnostics.art.deviceClass
        = m.profile === 'phone' ? 'desktop' : 'phone';
    }, 'warm-precondition'],
    ['warm cycle retained-unleased count 16', (m) => {
      setSyntheticWarmRetainedThumbs(m.points.warm[1], 16);
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
    ['warm precondition retained portrait entry', (m) => {
      m.phases.warmCachePrecondition.diagnostics.art.live.portraitCacheEntries = 1;
    }, 'warm-precondition'],
    ['warm precondition retained portrait bytes', (m) => {
      m.phases.warmCachePrecondition.diagnostics.art.live.portraitEncodedBytes = 400_000;
    }, 'warm-precondition'],
    ['warm leased key absent from cache', (m) => {
      const point = m.phases.warmCachePrecondition;
      const missingKey = 'warm-uncached-planetside-key';
      point.diagnostics.art.keys.leased[0] = missingKey;
      point.raw.planetsideImages[0].visualKey = missingKey;
    }, 'warm-precondition'],
    ['warm leased key duplicated', (m) => {
      const point = m.phases.warmCachePrecondition;
      point.diagnostics.art.keys.leased[1] = point.diagnostics.art.keys.leased[0];
    }, 'warm-precondition'],
    ['warm cache key omitted behind copied count', (m) => {
      m.points.warm[1].diagnostics.art.keys.cached.pop();
    }, 'warm-precondition'],
    ['warm cache key duplicated behind copied count', (m) => {
      const keys = m.points.warm[1].diagnostics.art.keys.cached;
      keys[1] = keys[0];
    }, 'warm-precondition'],
    ['warm Planetside/lease identity mismatch behind correct counts', (m) => {
      const art = m.phases.warmCachePrecondition.diagnostics.art;
      const retainedKey = art.keys.cached.find((key) => !art.keys.leased.includes(key));
      art.keys.leased[0] = retainedKey;
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

  const missingForegroundServices = clone(phone);
  delete missingForegroundServices.phases.foregroundServices;
  const missingForegroundOutcomes = evaluateProfile(
    missingForegroundServices, budget, fixture,
  );
  structuredInstrumentControlCount++;
  assert(missingForegroundOutcomes.some((outcome) =>
    outcome.check === 'lazy-art-not-eager' && outcome.status === 'fail'),
  'direct evaluator stayed green when the current profile omitted foreground service receipts');

  const historicalForegroundOmission = clone(phone);
  delete historicalForegroundOmission.pageAuthorities;
  delete historicalForegroundOmission.phases.foregroundServices;
  const strictHistoricalOutcomes = evaluateProfile(
    historicalForegroundOmission, budget, fixture,
  );
  structuredInstrumentControlCount++;
  assert(strictHistoricalOutcomes.some((outcome) =>
    outcome.check === 'lazy-art-not-eager' && outcome.status === 'fail'),
  'a foreground-omitting profile escaped the strict current evaluator');
  structuredInstrumentControlCount++;
  assertThrows(() => evaluateProfile(
    historicalForegroundOmission, budget, fixture,
    { allowHistoricalForegroundOmission: true },
  ), 'direct evaluator accepted a historical foreground-omission bypass');

  const missingThumbnailSettlements = clone(phone);
  delete missingThumbnailSettlements.phases.thumbnailSettlements;
  const missingThumbnailOutcomes = evaluateProfile(
    missingThumbnailSettlements, budget, fixture,
  );
  structuredInstrumentControlCount++;
  assert(missingThumbnailOutcomes.some((outcome) =>
    outcome.check === 'lazy-art-not-eager' && outcome.status === 'fail'),
  'direct evaluator stayed green when the current profile omitted thumbnail receipts');

  const strictThumbnailOmission = clone(phone);
  delete strictThumbnailOmission.phases.thumbnailSettlements;
  structuredInstrumentControlCount++;
  assertThrows(() => evaluateProfile(
    strictThumbnailOmission, budget, fixture,
    { allowHistoricalThumbnailOmission: true },
  ), 'direct evaluator accepted a historical thumbnail-omission bypass');

  const brokenCurrentForeground = clone(phone);
  brokenCurrentForeground.phases.foregroundServices[0].timing.deadlineMs += 1;
  const brokenCurrentOutcomes = evaluateProfile(
    brokenCurrentForeground, budget, fixture,
  );
  structuredInstrumentControlCount++;
  assert(brokenCurrentOutcomes.some((outcome) =>
    outcome.check === 'lazy-art-not-eager' && outcome.status === 'fail'),
  'historical replay option laundered a present but broken current foreground receipt');

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
  const foregroundTerminalControls = [
    ['missing receipt', (profile) => { profile.phases.foregroundServices.pop(); }],
    ['duplicate receipt', (profile) => {
      profile.phases.foregroundServices[1]
        = clone(profile.phases.foregroundServices[0]);
    }],
    ['receipt order', (profile) => {
      [profile.phases.foregroundServices[0], profile.phases.foregroundServices[1]]
        = [profile.phases.foregroundServices[1], profile.phases.foregroundServices[0]];
    }],
    ['coordinated stale target', (profile) => {
      const receipt = profile.phases.foregroundServices[0];
      receipt.expected.targetId = 'coordinated-stale-target';
      receipt.observation.targetId = 'coordinated-stale-target';
    }],
    ['coordinated stale session', (profile) => {
      const receipt = profile.phases.foregroundServices[0];
      receipt.expected.sessionId = 'coordinated-stale-session';
      receipt.observation.sessionId = 'coordinated-stale-session';
    }],
    ['coordinated stale document', (profile) => {
      const receipt = profile.phases.foregroundServices[0];
      receipt.expected.documentToken = 'coordinated-stale-document';
      receipt.observation.documentToken = 'coordinated-stale-document';
    }],
    ['coordinated wrong service', (profile) => {
      const receipt = profile.phases.foregroundServices[0];
      receipt.expected.serviceToken = 'coordinated-wrong-service';
      receipt.observation.service.token = 'coordinated-wrong-service';
    }],
    ['hidden receipt', (profile) => {
      const observation = profile.phases.foregroundServices[0].observation;
      observation.visibilityState = 'hidden';
      observation.hidden = true;
    }],
    ['unfocused receipt', (profile) => {
      profile.phases.foregroundServices[0].observation.focused = false;
    }],
    ['visibility loss', (profile) => {
      profile.phases.foregroundServices[0].observation.service.visibilityChanges = 1;
    }],
    ['focus loss', (profile) => {
      profile.phases.foregroundServices[0].observation.service.focusLosses = 1;
    }],
    ['arm reordered', (profile) => {
      profile.phases.foregroundServices[0].observation.service.arm.sequence = 1;
    }],
    ['rAF reordered', (profile) => {
      profile.phases.foregroundServices[0].observation.service.raf.sequence = 2;
    }],
    ['later task reordered', (profile) => {
      profile.phases.foregroundServices[0].observation.service.laterTask.sequence = 1;
    }],
    ['receipt at deadline', (profile) => {
      const timing = profile.phases.foregroundServices[0].timing;
      timing.receivedAtMs = timing.deadlineMs;
    }],
    ['non-exact deadline', (profile) => {
      profile.phases.foregroundServices[0].timing.deadlineMs += 1;
    }],
    ['wrong timeout', (profile) => {
      profile.phases.foregroundServices[0].timing.timeoutMs = 4_999;
    }],
    ['cleanup residue', (profile) => {
      profile.phases.foregroundServices[0].cleanup.cleanupPresent = true;
    }],
    ['service residue', (profile) => {
      profile.phases.foregroundServices[0].cleanup.servicePresent = true;
    }],
    ['missing page authorities', (profile) => { delete profile.pageAuthorities; }],
  ];
  for (const [label, mutate] of foregroundTerminalControls) {
    const changed = clone(report);
    mutate(changed.profiles.phone);
    structuredInstrumentControlCount++;
    assert(!verifyTerminalReport(changed, 'selftest-current').ok
      && !productionVerify(changed).ok,
    `terminal verifier accepted foreground service ${label}`);
  }
  const latestThumbnailCarriers = (profile, planIndex) => {
    const label = THUMB_SETTLEMENT_RECEIPT_PLAN[planIndex].label;
    const latestHistory = profile.phases.thumbnailSettlementHistory
      .filter((receipt) => receipt.label === label).at(-1);
    return [profile.phases.thumbnailSettlements[planIndex], latestHistory];
  };
  const thumbnailTerminalControls = [
    ['missing receipt', (profile) => { profile.phases.thumbnailSettlements.pop(); }],
    ['duplicate receipt', (profile) => {
      profile.phases.thumbnailSettlements[1]
        = clone(profile.phases.thumbnailSettlements[0]);
    }],
    ['receipt order', (profile) => {
      [profile.phases.thumbnailSettlements[0], profile.phases.thumbnailSettlements[1]]
        = [profile.phases.thumbnailSettlements[1], profile.phases.thumbnailSettlements[0]];
    }],
    ['coordinated token identity', (profile) => {
      for (const receipt of latestThumbnailCarriers(profile, 0)) {
        receipt.expected.receiptToken = 'coordinated-foreign-token';
        receipt.observation.receiptToken = 'coordinated-foreign-token';
      }
    }],
    ['coordinated page identity', (profile) => {
      for (const receipt of latestThumbnailCarriers(profile, 0)) {
        receipt.expected.targetId = 'coordinated-foreign-target';
        receipt.observation.page.targetId = 'coordinated-foreign-target';
      }
    }],
    ['coordinated expected semantics', (profile) => {
      for (const receipt of latestThumbnailCarriers(profile, 1)) {
        receipt.expected.expectedCount = 1499;
        receipt.observation.expectedCount = 1499;
        receipt.observation.diagnostic.filteredCount = 1499;
        const decision = classifyCompendiumThumbSettlement(
          receipt.observation, receipt.expected,
        );
        receipt.observation.ready = decision.status === 'ready';
        receipt.observation.reasons = [...decision.reasons];
      }
    }],
    ['command label', (profile) => {
      for (const receipt of latestThumbnailCarriers(profile, 0)) {
        receipt.command.label = 'foreign thumb settlement';
      }
    }],
    ['command profile', (profile) => {
      for (const receipt of latestThumbnailCarriers(profile, 0)) {
        receipt.command.profile = 'desktop';
      }
    }],
    ['command timing', (profile) => {
      for (const receipt of latestThumbnailCarriers(profile, 0)) {
        receipt.command.phaseDeadlineMs += 1;
      }
    }],
    ['receipt timing', (profile) => {
      for (const receipt of latestThumbnailCarriers(profile, 0)) {
        receipt.timing.timeoutMs -= 1;
      }
    }],
    ['late receipt', (profile) => {
      for (const receipt of latestThumbnailCarriers(profile, 0)) {
        receipt.timing.receivedAtMs = receipt.timing.deadlineMs;
      }
    }],
    ['wrong heartbeat browser', (profile) => {
      for (const receipt of latestThumbnailCarriers(profile, 0)) {
        receipt.command.heartbeat.product = 'Edg/999.42.7.3';
      }
    }],
    ['independently mutated main page', (profile) => {
      profile.pageAuthorities.main.targetId = 'foreign-main-target';
    }],
  ];
  for (const [label, mutate] of thumbnailTerminalControls) {
    const changed = clone(report);
    mutate(changed.profiles.phone);
    structuredInstrumentControlCount++;
    assert(!verifyTerminalReport(changed, 'selftest-current').ok
      && !productionVerify(changed).ok,
    `terminal verifier accepted thumbnail receipt ${label}`);
  }
  const retokenThumbnailReceipt = (receipt, profile, attempt) => {
    const receiptToken = compendiumThumbSettlementReceiptToken(
      profile, receipt.label, attempt,
    );
    receipt.attempt = attempt;
    receipt.expected.receiptToken = receiptToken;
    receipt.observation.receiptToken = receiptToken;
  };
  const coordinatedAttemptWithoutHistory = clone(report);
  const coordinatedAttemptProfile = coordinatedAttemptWithoutHistory.profiles.phone;
  for (const receipt of [
    coordinatedAttemptProfile.phases.thumbnailSettlements[0],
    coordinatedAttemptProfile.phases.thumbnailSettlementHistory[0],
  ]) retokenThumbnailReceipt(receipt, 'phone', 2);
  structuredInstrumentControlCount++;
  assert(!verifyTerminalReport(coordinatedAttemptWithoutHistory, 'selftest-current').ok
    && !productionVerify(coordinatedAttemptWithoutHistory).ok,
  'coordinated complete attempt/token inflation escaped without prior accepted history');

  const completeRetryReceipt = syntheticThumbnailSettlementReceipt({
    profile: 'phone', pageAuthority: phone.pageAuthorities.main,
    candidateCommandTemplate: candidateReady.ledger[0],
    planIndex: 0, attempt: 2, issuedAtMs: 135_000,
  });
  const completeRetryReport = clone(report);
  completeRetryReport.profiles.phone.phases.thumbnailSettlementHistory.splice(
    1, 0, clone(completeRetryReceipt),
  );
  completeRetryReport.profiles.phone.phases.thumbnailSettlements[0]
    = clone(completeRetryReceipt);
  const completeRetryLocal = verifyTerminalReport(
    completeRetryReport, 'selftest-current',
  );
  const completeRetryBound = productionVerify(completeRetryReport);
  assert(completeRetryLocal.ok && completeRetryBound.ok,
    `complete retry with append-only accepted history was rejected: ${[
      ...completeRetryLocal.errors, ...completeRetryBound.errors,
    ].join('; ')}`);

  const completeHistoryControls = [
    ['missing accepted receipt', (profile) => {
      profile.phases.thumbnailSettlementHistory.splice(0, 1);
    }],
    ['reordered attempts', (profile) => {
      const history = profile.phases.thumbnailSettlementHistory;
      [history[0], history[1]] = [history[1], history[0]];
    }],
    ['duplicate attempt', (profile) => {
      profile.phases.thumbnailSettlementHistory.splice(
        1, 0, clone(profile.phases.thumbnailSettlementHistory[0]),
      );
    }],
    ['skipped attempt', (profile) => {
      retokenThumbnailReceipt(profile.phases.thumbnailSettlementHistory[1], 'phone', 3);
      retokenThumbnailReceipt(profile.phases.thumbnailSettlements[0], 'phone', 3);
    }],
    ['wrong latest receipt', (profile) => {
      profile.phases.thumbnailSettlements[0]
        = clone(profile.phases.thumbnailSettlementHistory[0]);
    }],
    ['history command', (profile) => {
      profile.phases.thumbnailSettlementHistory[0].command.label
        = 'foreign thumb settlement';
    }],
    ['history timing', (profile) => {
      profile.phases.thumbnailSettlementHistory[0].timing.timeoutMs -= 1;
    }],
    ['history page', (profile) => {
      const receipt = profile.phases.thumbnailSettlementHistory[0];
      receipt.expected.targetId = 'foreign-history-target';
      receipt.observation.page.targetId = 'foreign-history-target';
    }],
    ['history browser', (profile) => {
      profile.phases.thumbnailSettlementHistory[0].command.heartbeat.product
        = 'Edg/999.42.7.3';
    }],
  ];
  for (const [label, mutate] of completeHistoryControls) {
    const changed = clone(completeRetryReport);
    mutate(changed.profiles.phone);
    structuredInstrumentControlCount++;
    assert(!verifyTerminalReport(changed, 'selftest-current').ok
      && !productionVerify(changed).ok,
    `terminal verifier accepted complete thumbnail history ${label}`);
  }
  const missingLifecycle = clone(report);
  delete missingLifecycle.lifecycle;
  assert(!productionVerify(missingLifecycle).ok,
    'terminal report without cleanup/release lifecycle authority stayed verifier-green');
  const pendingLifecycle = clone(report);
  pendingLifecycle.lifecycle.status = 'pending';
  assert(!productionVerify(pendingLifecycle).ok,
    'lifecycle-pending PASS stayed verifier-green');
  const failedPassLifecycle = clone(report);
  failedPassLifecycle.lifecycle.status = 'failed';
  assert(!productionVerify(failedPassLifecycle).ok,
    'lifecycle-failed PASS stayed verifier-green');
  const independentlyUpdatedBrowser = clone(report);
  independentlyUpdatedBrowser.browser.product = 'Edg/999.42.7.3';
  independentlyUpdatedBrowser.browser.revision = '@selftest-edge-future';
  independentlyUpdatedBrowser.browser.js_version = '99.42.7.3';
  independentlyUpdatedBrowser.browser.executable = '/future/edge';
  independentlyUpdatedBrowser.browser.user_agent = 'Future Edge selftest';
  const replaceHeartbeatProduct = (value) => {
    if (Array.isArray(value)) {
      for (const item of value) replaceHeartbeatProduct(item);
      return;
    }
    if (value === null || typeof value !== 'object') return;
    for (const [key, item] of Object.entries(value)) {
      if (key === 'product' && item === 'Edg/151.0.4129.107') {
        value[key] = 'Edg/999.42.7.3';
      } else replaceHeartbeatProduct(item);
    }
  };
  replaceHeartbeatProduct(independentlyUpdatedBrowser.profiles);
  independentlyUpdatedBrowser.budget.browserAuthorityMatch = true;
  const independentlyUpdatedLocalCheck = verifyTerminalReport(
    independentlyUpdatedBrowser, 'selftest-current',
  );
  const independentlyUpdatedProductionCheck = productionVerify(independentlyUpdatedBrowser);
  assert(independentlyUpdatedLocalCheck.ok && independentlyUpdatedProductionCheck.ok,
    `an independently updated compatible Edge report was rejected by the active budget: ${[
      ...independentlyUpdatedLocalCheck.errors, ...independentlyUpdatedProductionCheck.errors,
    ].join('; ')}`);
  const corruptedCompatibilityAuthority = clone(report);
  corruptedCompatibilityAuthority.budget.browserAuthority.capabilityContractSha256
    = 'f'.repeat(64);
  corruptedCompatibilityAuthority.budget.browserAuthorityMatch = true;
  assert(!verifyTerminalReport(corruptedCompatibilityAuthority, 'selftest-current').ok
    && !productionVerify(corruptedCompatibilityAuthority).ok,
  'a forged capability-contract digest remained verifier-green');
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
  const noColdProofWitness = noColdProofReport.profiles.phone.phases
    .producerErrorWitness;
  cacheProducerKeysBeforeArm(
    noColdProofWitness,
    noColdProofWitness.publication.accepted.rows.map((row) => row.visualKey),
  );
  noColdProofReport.outcomes = [
    ...evaluateProfile(noColdProofReport.profiles.phone, budget, fixture),
    ...evaluateProfile(desktop, budget, fixture),
  ];
  noColdProofReport.findings = noColdProofReport.outcomes
    .filter((outcome) => outcome.status === 'fail').map((outcome) => outcome.diagnosis);
  assert(!verifyTerminalReport(noColdProofReport, 'selftest-current').ok,
    'a stale complete report certified an exact distinct all-warm mounted set');
  const warmInvariantRowPass = clone(report);
  const warmInvariantWitness = warmInvariantRowPass.profiles.phone.phases
    .producerErrorWitness;
  cacheProducerKeysBeforeArm(warmInvariantWitness, ['producer-key-0']);
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
      diagnosis: 'pre-browser selftest failure',
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
        diagnosis: candidateTargetTimeout.failure.message,
        pageAuthorities: clone(phone.pageAuthorities),
        thumbnailSettlements: [],
        thumbnailSettlementHistory: [],
        activeThumbnailSettlement: null,
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
      diagnosis: candidateTargetTimeout.failure.message,
    },
    blockedOutcomes: [...EXPECTED_OUTCOMES],
  };
  const partialArtifact = () => true;
  const setPartialDiagnosis = (candidate, diagnosis) => {
    const prefix = candidate.partialFailure.classification === 'instrument'
      ? 'instrument' : 'product';
    candidate.partialFailure.diagnosis = diagnosis;
    candidate.findings = [`${prefix}: ${diagnosis}`];
    const partialProfile = candidate.partialFailure.profile === null
      ? null : candidate.profiles[candidate.partialFailure.profile];
    if (partialProfile?.schema === PARTIAL_PROFILE_SCHEMA) {
      partialProfile.diagnosis = diagnosis;
    }
  };
  const productPartialCheck = verifyTerminalReport(productPartial, 'selftest-current', {
    verifyArtifact: partialArtifact,
  });
  assert(productPartialCheck.ok,
    `healthy-heartbeat product-unanswerable partial report was rejected: ${productPartialCheck.errors.join('; ')}`);
  const arbitraryFindingMismatch = clone(productPartial);
  arbitraryFindingMismatch.findings = ['product: arbitrary unrelated diagnosis'];
  structuredInstrumentControlCount++;
  assert(!verifyTerminalReport(arbitraryFindingMismatch, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'a partial finding drifted independently from its sealed diagnosis');

  const firstThumbReceipt = clone(phone.phases.thumbnailSettlements[0]);
  const nextThumbPlan = THUMB_SETTLEMENT_RECEIPT_PLAN[1];
  const nextThumbAttempt = 1;
  const nextThumbIssuedAtMs = firstThumbReceipt.timing.receivedAtMs + 1_000;
  const nextThumbExpected = {
    surface: nextThumbPlan.surface,
    expectedCount: nextThumbPlan.expectedCount,
    ...phone.pageAuthorities.main,
    receiptToken: compendiumThumbSettlementReceiptToken(
      'phone', nextThumbPlan.label, nextThumbAttempt,
    ),
  };
  const nextThumbActive = {
    schema: THUMB_SETTLEMENT_ACTIVE_SCHEMA,
    label: nextThumbPlan.label,
    attempt: nextThumbAttempt,
    expected: nextThumbExpected,
    lastObservation: null,
    lastDecision: null,
    lastCommand: null,
    timing: {
      issuedAtMs: nextThumbIssuedAtMs,
      deadlineMs: nextThumbIssuedAtMs + THUMB_SETTLEMENT_RECEIPT_TIMEOUT_MS,
      receivedAtMs: null,
      timeoutMs: THUMB_SETTLEMENT_RECEIPT_TIMEOUT_MS,
    },
  };
  assert(validCompendiumActiveThumbSettlement(nextThumbActive, {
    profile: 'phone', pageAuthority: phone.pageAuthorities.main,
    browserProduct: report.browser.product, planIndex: 1,
  }), 'synthetic partial thumbnail active tail was not exact');
  const thumbnailPrefixPartial = clone(productPartial);
  thumbnailPrefixPartial.status = 'instrument-fail';
  thumbnailPrefixPartial.partialFailure.classification = 'instrument';
  thumbnailPrefixPartial.partialFailure.command = null;
  thumbnailPrefixPartial.partialFailure.lastCompletedStage = firstThumbReceipt.command.label;
  thumbnailPrefixPartial.partialFailure.failingStage
    = `${nextThumbPlan.label} thumb settlement`;
  thumbnailPrefixPartial.profiles.phone.commandLedger.pop();
  thumbnailPrefixPartial.profiles.phone.commandLedger.push(clone(firstThumbReceipt.command));
  thumbnailPrefixPartial.profiles.phone.completedStages.push(firstThumbReceipt.command.label);
  thumbnailPrefixPartial.profiles.phone.lastCompletedStage = firstThumbReceipt.command.label;
  thumbnailPrefixPartial.profiles.phone.failingStage
    = `${nextThumbPlan.label} thumb settlement`;
  thumbnailPrefixPartial.profiles.phone.thumbnailSettlements = [firstThumbReceipt];
  thumbnailPrefixPartial.profiles.phone.thumbnailSettlementHistory
    = [clone(firstThumbReceipt)];
  thumbnailPrefixPartial.profiles.phone.activeThumbnailSettlement = nextThumbActive;
  setPartialDiagnosis(thumbnailPrefixPartial,
    'viewport-contracted thumbnail settlement did not begin');
  const thumbnailPrefixCheck = verifyTerminalReport(
    thumbnailPrefixPartial, 'selftest-current', { verifyArtifact: partialArtifact },
  );
  assert(thumbnailPrefixCheck.ok,
    `exact partial thumbnail prefix/tail was rejected: ${thumbnailPrefixCheck.errors.join('; ')}`);

  for (const field of ['targetId', 'sessionId', 'documentToken']) {
    const coordinatedStaleAuthority = clone(thumbnailPrefixPartial);
    const foreign = `coordinated-foreign-${field}`;
    for (const receipt of [
      coordinatedStaleAuthority.profiles.phone.thumbnailSettlements[0],
      coordinatedStaleAuthority.profiles.phone.thumbnailSettlementHistory[0],
    ]) {
      receipt.expected[field] = foreign;
      receipt.observation.page[field] = foreign;
    }
    coordinatedStaleAuthority.profiles.phone.activeThumbnailSettlement.expected[field] = foreign;
    structuredInstrumentControlCount++;
    assert(!verifyTerminalReport(coordinatedStaleAuthority, 'selftest-current', {
      verifyArtifact: partialArtifact,
    }).ok, `partial thumbnail evidence coordinated a stale ${field} without attach authority`);
  }
  const independentlyStalePartialAuthority = clone(thumbnailPrefixPartial);
  independentlyStalePartialAuthority.profiles.phone.pageAuthorities.main.targetId
    = 'foreign-main-target';
  structuredInstrumentControlCount++;
  assert(!verifyTerminalReport(independentlyStalePartialAuthority, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'partial attach-derived page authority drifted independently from thumbnail evidence');
  const missingPartialPageAuthorities = clone(thumbnailPrefixPartial);
  delete missingPartialPageAuthorities.profiles.phone.pageAuthorities;
  structuredInstrumentControlCount++;
  assert(!verifyTerminalReport(missingPartialPageAuthorities, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'partial thumbnail evidence omitted its attach-derived page authorities');

  const readyUnreceipted = clone(phone.phases.thumbnailSettlements[1]);
  const terminalProductObservation = clone(readyUnreceipted.observation);
  terminalProductObservation.images[0].thumbState = 'error';
  terminalProductObservation.diagnostic.thumbStates[0] = 'error';
  terminalProductObservation.lazyArt.lastError = {
    producerEpoch: terminalProductObservation.lazyArt.identity.lastProducerEpoch,
    workerInstanceId: terminalProductObservation.lazyArt.identity.lastWorkerInstanceId,
    jobId: terminalProductObservation.lazyArt.lastEvent?.jobId ?? 1,
    kind: 'thumb132', stage: 'paint', code: 'injected-failure',
    message: PRODUCER_ERROR_ARM_MESSAGE,
  };
  terminalProductObservation.lazyArt.errors.paint += 1;
  const terminalProductDecision = classifyCompendiumThumbSettlement(
    terminalProductObservation, readyUnreceipted.expected,
  );
  terminalProductObservation.ready = false;
  terminalProductObservation.reasons = [...terminalProductDecision.reasons];
  const terminalProductActive = {
    schema: THUMB_SETTLEMENT_ACTIVE_SCHEMA,
    label: readyUnreceipted.label,
    attempt: readyUnreceipted.attempt,
    expected: clone(readyUnreceipted.expected),
    lastObservation: terminalProductObservation,
    lastDecision: terminalProductDecision,
    lastCommand: clone(readyUnreceipted.command),
    timing: clone(readyUnreceipted.timing),
  };
  assert(terminalProductDecision.status === 'product-error'
    && validCompendiumActiveThumbSettlement(terminalProductActive, {
      profile: 'phone', pageAuthority: phone.pageAuthorities.main,
      browserProduct: report.browser.product, planIndex: 1,
    }), 'synthetic terminal product-error active tail was not exact');
  const terminalProductDiagnosis = compendiumThumbSettlementProductErrorDiagnosis(
    'phone', readyUnreceipted.label,
  );
  const productFailPartial = clone(thumbnailPrefixPartial);
  productFailPartial.status = 'product-fail';
  productFailPartial.partialFailure.classification = 'product-fail';
  productFailPartial.partialFailure.command = null;
  productFailPartial.profiles.phone.commandLedger.push(
    clone(readyUnreceipted.command),
  );
  productFailPartial.profiles.phone.activeThumbnailSettlement = terminalProductActive;
  setPartialDiagnosis(productFailPartial, terminalProductDiagnosis);
  const productFailCheck = verifyTerminalReport(
    productFailPartial, 'selftest-current', { verifyArtifact: partialArtifact },
  );
  assert(productFailCheck.ok,
    `terminal product-fail partial report was rejected: ${productFailCheck.errors.join('; ')}`);

  const substitutedProductFailStatus = clone(productFailPartial);
  substitutedProductFailStatus.status = 'instrument-fail';
  structuredInstrumentControlCount++;
  assert(!verifyTerminalReport(substitutedProductFailStatus, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'a product-fail report was accepted after status-only substitution');
  const reclassifiedProductFail = clone(productFailPartial);
  reclassifiedProductFail.status = 'instrument-fail';
  reclassifiedProductFail.partialFailure.classification = 'instrument';
  setPartialDiagnosis(reclassifiedProductFail, terminalProductDiagnosis);
  structuredInstrumentControlCount++;
  assert(!verifyTerminalReport(reclassifiedProductFail, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'a terminal product-error tail was coordinated into instrument-fail');
  const productTimeoutSubstitution = clone(productFailPartial);
  productTimeoutSubstitution.status = 'product-unanswerable';
  productTimeoutSubstitution.partialFailure.classification = 'product-unanswerable';
  setPartialDiagnosis(productTimeoutSubstitution, terminalProductDiagnosis);
  structuredInstrumentControlCount++;
  assert(!verifyTerminalReport(productTimeoutSubstitution, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'a terminal product-error tail was coordinated into product-unanswerable');

  const readyReceiptFailureActive = {
    schema: THUMB_SETTLEMENT_ACTIVE_SCHEMA,
    label: readyUnreceipted.label,
    attempt: readyUnreceipted.attempt,
    expected: readyUnreceipted.expected,
    lastObservation: readyUnreceipted.observation,
    lastDecision: classifyCompendiumThumbSettlement(
      readyUnreceipted.observation, readyUnreceipted.expected,
    ),
    lastCommand: readyUnreceipted.command,
    timing: readyUnreceipted.timing,
  };
  assert(!validCompendiumActiveThumbSettlement(readyReceiptFailureActive, {
    profile: 'phone', pageAuthority: phone.pageAuthorities.main,
    browserProduct: report.browser.product, planIndex: 1,
  }) && validCompendiumActiveThumbSettlement(readyReceiptFailureActive, {
    profile: 'phone', pageAuthority: phone.pageAuthorities.main,
    browserProduct: report.browser.product, planIndex: 1,
    allowReadyReceiptFailure: true,
  }), 'ready observation was not isolated to the explicit receipt-failure tail authority');
  const readyReceiptFailurePartial = clone(thumbnailPrefixPartial);
  readyReceiptFailurePartial.profiles.phone.commandLedger.push(
    clone(readyUnreceipted.command),
  );
  readyReceiptFailurePartial.profiles.phone.activeThumbnailSettlement
    = readyReceiptFailureActive;
  setPartialDiagnosis(readyReceiptFailurePartial,
    `phone ${readyUnreceipted.label}: accepted thumbnail settlement receipt is invalid`);
  const readyReceiptFailureCheck = verifyTerminalReport(
    readyReceiptFailurePartial, 'selftest-current', { verifyArtifact: partialArtifact },
  );
  assert(readyReceiptFailureCheck.ok,
    `truthful ready-but-unreceipted instrument tail was rejected: ${readyReceiptFailureCheck.errors.join('; ')}`);
  const launderedReadyTail = clone(readyReceiptFailurePartial);
  setPartialDiagnosis(launderedReadyTail, 'unrelated instrument failure');
  structuredInstrumentControlCount++;
  assert(!verifyTerminalReport(launderedReadyTail, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'ready active tail escaped without the exact receipt-assembly diagnosis');

  const missingPartialReceiptPrefix = clone(thumbnailPrefixPartial);
  missingPartialReceiptPrefix.profiles.phone.thumbnailSettlements = [];
  structuredInstrumentControlCount++;
  assert(!verifyTerminalReport(missingPartialReceiptPrefix, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'active thumbnail tail survived a missing completed receipt prefix');
  const missingPartialActiveTail = clone(thumbnailPrefixPartial);
  missingPartialActiveTail.profiles.phone.activeThumbnailSettlement = null;
  structuredInstrumentControlCount++;
  assert(!verifyTerminalReport(missingPartialActiveTail, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'thumbnail-stage failure omitted its active settlement tail');
  const skippedPartialReceipt = clone(thumbnailPrefixPartial);
  skippedPartialReceipt.profiles.phone.thumbnailSettlements[0]
    = clone(phone.phases.thumbnailSettlements[1]);
  skippedPartialReceipt.profiles.phone.thumbnailSettlementHistory[0]
    = clone(phone.phases.thumbnailSettlementHistory[1]);
  structuredInstrumentControlCount++;
  assert(!verifyTerminalReport(skippedPartialReceipt, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'partial thumbnail receipt prefix began after the first sealed plan phase');
  const partialActiveTokenMismatch = clone(thumbnailPrefixPartial);
  partialActiveTokenMismatch.profiles.phone.activeThumbnailSettlement
    .expected.receiptToken = 'foreign-active-token';
  structuredInstrumentControlCount++;
  assert(!verifyTerminalReport(partialActiveTokenMismatch, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'partial thumbnail active tail accepted a foreign receipt token');
  const partialActiveTimingMismatch = clone(thumbnailPrefixPartial);
  partialActiveTimingMismatch.profiles.phone.activeThumbnailSettlement.timing.timeoutMs -= 1;
  structuredInstrumentControlCount++;
  assert(!verifyTerminalReport(partialActiveTimingMismatch, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'partial thumbnail active tail accepted a non-exact phase ruler');

  const retryThumbActive = clone(nextThumbActive);
  retryThumbActive.label = firstThumbReceipt.label;
  retryThumbActive.attempt = firstThumbReceipt.attempt + 1;
  retryThumbActive.expected = {
    ...firstThumbReceipt.expected,
    receiptToken: compendiumThumbSettlementReceiptToken(
      'phone', firstThumbReceipt.label, retryThumbActive.attempt,
    ),
  };
  const thumbnailRetryPartial = clone(thumbnailPrefixPartial);
  thumbnailRetryPartial.partialFailure.failingStage
    = `${firstThumbReceipt.label} thumb settlement`;
  thumbnailRetryPartial.profiles.phone.failingStage
    = `${firstThumbReceipt.label} thumb settlement`;
  thumbnailRetryPartial.profiles.phone.activeThumbnailSettlement = retryThumbActive;
  setPartialDiagnosis(thumbnailRetryPartial,
    'veteran Earth thumbnail settlement retry did not begin');
  const thumbnailRetryCheck = verifyTerminalReport(
    thumbnailRetryPartial, 'selftest-current', { verifyArtifact: partialArtifact },
  );
  assert(thumbnailRetryCheck.ok,
    `exact semantic thumbnail retry tail was rejected: ${thumbnailRetryCheck.errors.join('; ')}`);
  const retryWithoutPriorReceipt = clone(thumbnailRetryPartial);
  retryWithoutPriorReceipt.profiles.phone.thumbnailSettlementHistory = [];
  structuredInstrumentControlCount++;
  assert(!verifyTerminalReport(retryWithoutPriorReceipt, 'selftest-current', {
    verifyArtifact: partialArtifact,
  }).ok, 'semantic thumbnail retry omitted its prior accepted receipt');
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
  setPartialDiagnosis(postStageValidationPartial,
    'local validation failed after Compendium open');
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
    diagnosis: 'phone producer error publication: root heartbeat failed',
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
    diagnosis: 'phone producer error publication: root heartbeat failed',
    pageAuthorities: clone(phone.pageAuthorities),
    thumbnailSettlements: [], thumbnailSettlementHistory: [],
    activeThumbnailSettlement: null,
  };
  assert(verifyTerminalReport(publicationPartial, 'selftest-current').ok,
    'a stable-open pending publication lost its progressive falsies/stage/command evidence');
  const healthyColdProofFailure = clone(publicationPartial);
  const healthyColdProofWitness = clone(fullPhoneProducerWitness);
  healthyColdProofWitness.answerability = null;
  healthyColdProofWitness.closeTarget = {
    observationCount: 0, falsyObservations: [], accepted: null,
  };
  healthyColdProofWitness.recoveryOpenTarget = {
    observationCount: 0, falsyObservations: [], accepted: null,
  };
  healthyColdProofWitness.recovery = {
    observationCount: 0, falsyObservations: [], accepted: null,
  };
  healthyColdProofWitness.commands = fullPhoneProducerWitness.commands.filter((command) =>
    [producerPartialStages.preArm, producerPartialStages.openTarget,
      producerPartialStages.publication].includes(command.label)).map(clone);
  const healthyColdProofCompleted = [
    ...bootSnapshotStages, ...fixtureSetupStages,
    ...producerPartialStages.sequence.slice(
      0, producerPartialStages.sequence.indexOf(producerPartialStages.coldProof),
    ),
  ];
  healthyColdProofFailure.findings = [
    'instrument: phone producer error cold-key proof: local validation failed',
  ];
  healthyColdProofFailure.partialFailure = {
    schema: PARTIAL_FAILURE_SCHEMA, classification: 'instrument', profile: 'phone',
    lastCompletedStage: producerPartialStages.publication,
    failingStage: producerPartialStages.coldProof,
    command: null,
    diagnosis: 'phone producer error cold-key proof: local validation failed',
  };
  healthyColdProofFailure.profiles.phone = {
    schema: PARTIAL_PROFILE_SCHEMA, profile: 'phone', viewport: { ...phoneViewport },
    evidenceStatus: 'partial-non-certifying',
    lastCompletedStage: producerPartialStages.publication,
    failingStage: producerPartialStages.coldProof,
    completedStages: healthyColdProofCompleted,
    commandLedger: clone(healthyColdProofWitness.commands),
    producerErrorWitness: healthyColdProofWitness,
    filterTransitions: [], reviewPacket: [],
    diagnosis: 'phone producer error cold-key proof: local validation failed',
    pageAuthorities: clone(phone.pageAuthorities),
    thumbnailSettlements: [], thumbnailSettlementHistory: [],
    activeThumbnailSettlement: null,
  };
  const honestColdProofFailure = clone(healthyColdProofFailure);
  const honestColdProofWitness = honestColdProofFailure.profiles.phone
    .producerErrorWitness;
  cacheProducerKeysBeforeArm(
    honestColdProofWitness,
    [honestColdProofWitness.publication.accepted.rows[0].visualKey],
  );
  const honestColdProofCheck = verifyTerminalReport(
    honestColdProofFailure, 'selftest-current',
  );
  assert(producerHistoryChronological(honestColdProofWitness)
    && honestColdProofCheck.ok,
    `a truthful coldProof-stage failure was rejected: ${honestColdProofCheck.errors.join('; ')}`);
  assert(!verifyTerminalReport(healthyColdProofFailure, 'selftest-current').ok,
    'a partial report labeled coldProof as failed while its retained predicate was healthy');
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
  setPartialDiagnosis(filterTimeoutPartial,
    'phone filter Compendium Filter Beacon: root heartbeat failed');
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
  setPartialDiagnosis(beaconSearchTargetFailure,
    'phone search Compendium Filter Beacon target: root heartbeat failed');
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
  setPartialDiagnosis(beaconBackspacePartial,
    `phone ${beaconBackspaceCommand.label}: Input.dispatchKeyEvent failed under the `
      + `${beaconBackspaceCommand.timeoutMs}ms transport cap (${beaconBackspaceCommand.error})`);
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
  setPartialDiagnosis(completedThenLaterFailure, 'post-filter selftest failure');
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
  setPartialDiagnosis(detailReviewPartial, 'post-detail selftest failure');
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
  setPartialDiagnosis(reopenTerminalFailure,
    'phone filter <clear>: root heartbeat failed');
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
  setPartialDiagnosis(rawHeapPartial, rawHeapFailure.message);
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
  setPartialDiagnosis(desktopPartialReport,
    `desktop ${desktopPartialReport.partialFailure.command.label}: `
      + `${desktopPartialReport.partialFailure.command.method} failed under the `
      + `${desktopPartialReport.partialFailure.command.timeoutMs}ms transport cap `
      + `(${desktopPartialReport.partialFailure.command.error})`);
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
      diagnosis: 'post-profile selftest failure',
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
  setPartialDiagnosis(pageExceptionPartial, 'candidate page exception');
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
        diagnosis: plainFailure.message,
        pageAuthorities: clone(phone.pageAuthorities),
        thumbnailSettlements: [], thumbnailSettlementHistory: [],
        activeThumbnailSettlement: null,
      },
    },
    reviewPacket: [],
    partialFailure: {
      schema: PARTIAL_FAILURE_SCHEMA, classification: 'instrument', profile: 'phone',
      lastCompletedStage: 'main initial heap usage',
      failingStage: 'main initial product/DOM snapshot',
      command: clone(plainFailure.compendiumCommand),
      diagnosis: plainFailure.message,
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
    'compatible Edge provenance was rejected solely for a cross-host path/UA');
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
    'instrument: browser does not match the Arc 1A browser compatibility authority',
  ];
  authorityMismatch.profiles = {};
  authorityMismatch.reviewPacket = [];
  authorityMismatch.partialFailure = {
    schema: PARTIAL_FAILURE_SCHEMA, classification: 'instrument', profile: null,
    lastCompletedStage: null, failingStage: 'Arc 1A browser compatibility authority', command: null,
    diagnosis: 'browser does not match the Arc 1A browser compatibility authority',
  };
  authorityMismatch.blockedOutcomes = [...EXPECTED_OUTCOMES];
  const authorityMismatchCheck = verifyTerminalReport(authorityMismatch, 'selftest-current');
  assert(authorityMismatchCheck.ok,
    `pre-measurement browser-compatibility mismatch report was rejected: ${authorityMismatchCheck.errors.join('; ')}`);
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
    diagnosis: 'built producer does not match the exact Arc 1A calibration authority',
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
        diagnosis: 'injected pre-browser failure',
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

  const collectorSource = fs.readFileSync(
    fileURLToPath(new URL('./compendiummem.mjs', import.meta.url)), 'utf8',
  );
  const ownedLifecycleBlock = (start, end) => {
    const from = collectorSource.indexOf(start);
    const to = collectorSource.indexOf(end, from + start.length);
    return from >= 0 && to > from ? collectorSource.slice(from, to) : '';
  };
  const thumbnailSettlementBlock = ownedLifecycleBlock(
    '  const waitThumbSettlement = async (sessionId, surface, expectedCount, phaseLabel) => {',
    '  const waitListReady = (sessionId, phaseLabel, expectedCount = null) =>',
  );
  const thumbnailClassificationAt = thumbnailSettlementBlock.indexOf(
    'decision = classifyCompendiumThumbSettlement(observation, expected);',
  );
  const thumbnailObjectMutationGuardAt = thumbnailSettlementBlock.indexOf(
    "if (observation !== null && typeof observation === 'object'",
  );
  const thumbnailNonObjectGuardAt = thumbnailSettlementBlock.indexOf(
    "if (observation === null || typeof observation !== 'object'",
  );
  const thumbnailDiagnosisAt = thumbnailSettlementBlock.indexOf(
    'thumbnail observation was not an object',
  );
  const thumbnailMutationAt = thumbnailSettlementBlock.indexOf(
    "observation.ready = decision.status === 'ready';",
  );
  structuredInstrumentControlCount++;
  assert(thumbnailClassificationAt >= 0
    && thumbnailClassificationAt < thumbnailObjectMutationGuardAt
    && thumbnailObjectMutationGuardAt < thumbnailMutationAt
    && thumbnailMutationAt < thumbnailNonObjectGuardAt
    && thumbnailNonObjectGuardAt < thumbnailDiagnosisAt,
  'collector lost its null/non-object thumbnail diagnosis before observation mutation');
  const thumbnailAuthorityErrorAt = thumbnailSettlementBlock.indexOf(
    "if (decision.status === 'error') {",
  );
  const thumbnailProductErrorAt = thumbnailSettlementBlock.indexOf(
    "if (decision.status === 'product-error') {",
  );
  const thumbnailReadyAt = thumbnailSettlementBlock.indexOf(
    "if (decision.status === 'ready') {",
  );
  const thumbnailProductTailAt = thumbnailSettlementBlock.indexOf(
    'activeThumbnailSettlement = observedTail;', thumbnailProductErrorAt,
  );
  const thumbnailProductThrowAt = thumbnailSettlementBlock.indexOf(
    "'product-fail',", thumbnailProductErrorAt,
  );
  structuredInstrumentControlCount++;
  assert(thumbnailAuthorityErrorAt >= 0
    && thumbnailAuthorityErrorAt < thumbnailProductErrorAt
    && thumbnailProductErrorAt < thumbnailProductTailAt
    && thumbnailProductTailAt < thumbnailProductThrowAt
    && thumbnailProductThrowAt < thumbnailReadyAt,
  'collector lost authority-first immediate product-error termination before ready publication');
  const receiptValidationAt = thumbnailSettlementBlock.indexOf(
    'if (!validCompendiumThumbSettlementReceipt(receipt, {',
  );
  const readyFailureTailAt = thumbnailSettlementBlock.indexOf(
    'activeThumbnailSettlement = observedTail;', receiptValidationAt,
  );
  const receiptPublicationAt = thumbnailSettlementBlock.indexOf(
    'thumbnailSettlementHistory.push(receipt);', receiptValidationAt,
  );
  structuredInstrumentControlCount++;
  assert(receiptValidationAt >= 0 && readyFailureTailAt > receiptValidationAt
    && receiptPublicationAt > readyFailureTailAt,
  'collector published a ready active tail before receipt validation failed');
  const exactOwnershipWrappers = Object.freeze({
    browser: [
      '  const closeBrowserOnce = async () => {',
      '    const owned = browser;',
      '    browser = null;',
      '    if (owned) await owned.close();',
      '  };',
    ].join('\n'),
    server: [
      '  const closeServerOnce = async () => {',
      '    const owned = server;',
      '    server = null;',
      '    if (owned) await owned.close();',
      '  };',
    ].join('\n'),
    lock: [
      '  const releaseLockOnce = () => {',
      '    if (!lockOwned) return;',
      '    lockOwned = false;',
      '    releaseLock();',
      '  };',
    ].join('\n'),
  });
  const containsExactlyOnce = (source, needle) => {
    const first = source.indexOf(needle);
    return first >= 0 && source.indexOf(needle, first + needle.length) < 0;
  };
  const browserAuthoritySeamBlock = ownedLifecycleBlock(
    'export async function collectWithCompendiumBrowserAuthority(',
    'function sampleBrowser(',
  );
  const validBrowserAuthoritySeam = (block) => {
    const authorityAt = block.indexOf(
      'const browserAuthority = compendiumBudgetBrowserAuthority(budget);',
    );
    const validityAt = block.indexOf(
      'const browserAuthorityMatch = validCompendiumBrowserAuthority(browserAuthority)',
    );
    const comparisonAt = block.indexOf(
      '&& compendiumBrowserAuthorityMatches(browser, browserAuthority);',
    );
    const recordAt = block.indexOf('await recordEvidence(evidence);');
    const rejectionAt = block.indexOf(
      'if (!browserAuthorityMatch) throw new Error(mismatchMessage);',
    );
    const collectionAt = block.indexOf('return await collect();');
    return containsExactlyOnce(block,
      'const browserAuthority = compendiumBudgetBrowserAuthority(budget);')
      && containsExactlyOnce(block,
        'const browserAuthorityMatch = validCompendiumBrowserAuthority(browserAuthority)')
      && containsExactlyOnce(block,
        '&& compendiumBrowserAuthorityMatches(browser, browserAuthority);')
      && containsExactlyOnce(block, 'await recordEvidence(evidence);')
      && containsExactlyOnce(block,
        'if (!browserAuthorityMatch) throw new Error(mismatchMessage);')
      && containsExactlyOnce(block, 'return await collect();')
      && authorityAt < validityAt && validityAt < comparisonAt
      && comparisonAt < recordAt && recordAt < rejectionAt && rejectionAt < collectionAt;
  };
  assert(validBrowserAuthoritySeam(browserAuthoritySeamBlock),
    'shared browser-authority seam was not record-first/fail-closed before collection');
  for (const [label, before, after] of [
    [
      'null authority validity',
      'const browserAuthorityMatch = validCompendiumBrowserAuthority(browserAuthority)',
      'const browserAuthorityMatch = true',
    ],
    [
      'field comparison',
      '&& compendiumBrowserAuthorityMatches(browser, browserAuthority);',
      '&& true;',
    ],
    [
      'recorded outcome',
      'await recordEvidence(evidence);',
      'await Promise.resolve();',
    ],
    [
      'terminal rejection',
      'if (!browserAuthorityMatch) throw new Error(mismatchMessage);',
      'if (false) throw new Error(mismatchMessage);',
    ],
  ]) {
    const mutation = browserAuthoritySeamBlock.replace(before, after);
    assert(mutation !== browserAuthoritySeamBlock && !validBrowserAuthoritySeam(mutation),
      `${label} browser-authority seam mutation stayed green`);
  }
  const validOwnedLifecycleBlock = (block, reportOwner) => {
    const call = 'const finalized = await finalizeCompendiumLifecycle({';
    const callAt = block.indexOf(call);
    const directTerminal = ['report', 'provisionalReport']
      .map((value) => `atomicWriteJson(${reportOwner}, ${value})`);
    return callAt >= 0 && block.indexOf(call, callAt + call.length) < 0
      && block.includes(`publishReport: (report) => atomicWriteJson(${reportOwner}, report)`)
      && block.includes('closeBrowser: closeBrowserOnce')
      && block.includes('closeServer: closeServerOnce')
      && block.includes('releaseLock: releaseLockOnce')
      && block.includes('try { await closeBrowserOnce(); }')
      && block.includes('try { await closeServerOnce(); }')
      && block.includes('try { releaseLockOnce(); }')
      && Object.values(exactOwnershipWrappers).every((wrapper) =>
        containsExactlyOnce(block, wrapper))
      && directTerminal.every((publication) => !block.slice(0, callAt).includes(publication))
      && !block.includes('await browser.close()') && !block.includes('await server.close()');
  };
  const baselineLifecycleBlock = ownedLifecycleBlock(
    'async function runBrokenBaselineCalibration(', 'async function runGate(',
  );
  const candidateLifecycleBlock = ownedLifecycleBlock(
    'async function runGate(', 'async function main(',
  );
  const validCalibrationAuthorityRunner = (
    block, collectorName, reportOwner, evidenceCarrier,
  ) => {
    const seamCall = 'await collectWithCompendiumBrowserAuthority({';
    const callAt = block.indexOf(seamCall);
    const recordAt = block.indexOf('recordEvidence: (evidence) => {', callAt);
    const carrierAt = block.indexOf(evidenceCarrier, recordAt);
    const reportAt = block.indexOf(`atomicWriteJson(${reportOwner}, running`, recordAt);
    const collectAt = block.indexOf('collect: async () => {', callAt);
    const productAt = block.indexOf(`await ${collectorName}({`, collectAt);
    const mismatchAt = block.indexOf('mismatchMessage:', collectAt);
    return containsExactlyOnce(block, seamCall)
      && callAt >= 0 && recordAt > callAt && carrierAt > recordAt && reportAt > carrierAt
      && collectAt > reportAt && productAt > collectAt && mismatchAt > productAt;
  };
  assert(validCalibrationAuthorityRunner(
    baselineLifecycleBlock, 'collectBrokenBaselineProfile', 'baselineReportPath',
    'baselineBudgetEvidence = { ...baselineBudgetEvidence, ...evidence };',
  ) && validCalibrationAuthorityRunner(
    candidateLifecycleBlock, 'collectProfile', 'reportPath',
    'budget: { ...running.budget, ...evidence },',
  ), 'candidate/baseline calibration did not bind collection behind recorded browser authority');
  for (const [kind, block, collectorName, reportOwner, evidenceCarrier] of [
    [
      'baseline', baselineLifecycleBlock, 'collectBrokenBaselineProfile',
      'baselineReportPath',
      'baselineBudgetEvidence = { ...baselineBudgetEvidence, ...evidence };',
    ],
    [
      'candidate', candidateLifecycleBlock, 'collectProfile', 'reportPath',
      'budget: { ...running.budget, ...evidence },',
    ],
  ]) {
    for (const [label, before, after] of [
      [
        'shared seam', 'await collectWithCompendiumBrowserAuthority({',
        'await Promise.resolve({',
      ],
      ['record callback', 'recordEvidence: (evidence) => {', 'ignoredEvidence: (evidence) => {'],
      ['recorded authority carrier', evidenceCarrier, 'void evidence;'],
      ['protected collection', 'collect: async () => {', 'unprotected: async () => {'],
    ]) {
      const mutation = block.replace(before, after);
      assert(mutation !== block
        && !validCalibrationAuthorityRunner(
          mutation, collectorName, reportOwner, evidenceCarrier,
        ),
      `${kind} ${label} browser-authority mutation stayed green`);
    }
  }
  const baselineLifecycleFailureBlock = ownedLifecycleBlock(
    'export function baselineLifecycleFailureReport(',
    'async function runBrokenBaselineCalibration(',
  );
  const baselineAuthorityCarrierTokens = [
    'browser: null, budget: baselineBudgetEvidence, findings: [], profiles: {},',
    'inputs, inputDigest, browser: browser.browser, budget: baselineBudgetEvidence,',
    'browserAuthority: baselineBudgetEvidence.browserAuthority,',
    'inputs, inputDigest, browser: browser?.browser || null, budget: baselineBudgetEvidence,',
  ];
  const validBaselineAuthorityCarriers = (runnerBlock, failureBlock) =>
    baselineAuthorityCarrierTokens.every((token) => containsExactlyOnce(runnerBlock, token))
      && containsExactlyOnce(failureBlock, 'budget: provisionalReport.budget,');
  assert(validBaselineAuthorityCarriers(
    baselineLifecycleBlock, baselineLifecycleFailureBlock,
  ), 'baseline running/success/failure/sample did not preserve browser-authority evidence');
  for (const token of baselineAuthorityCarrierTokens) {
    const mutation = baselineLifecycleBlock.replace(token, '/* removed authority carrier */');
    assert(mutation !== baselineLifecycleBlock
      && !validBaselineAuthorityCarriers(mutation, baselineLifecycleFailureBlock),
    `baseline ${token} removal mutation stayed green`);
  }
  const baselineFailureCarrierMutation = baselineLifecycleFailureBlock.replace(
    'budget: provisionalReport.budget,', 'budget: null,',
  );
  assert(baselineFailureCarrierMutation !== baselineLifecycleFailureBlock
    && !validBaselineAuthorityCarriers(
      baselineLifecycleBlock, baselineFailureCarrierMutation,
    ), 'baseline lifecycle-failure browser-authority carrier mutation stayed green');
  const cliVerifyBlock = ownedLifecycleBlock(
    "  const verifyArg = process.argv.slice(2).find((arg) => arg.startsWith('--verify-run='));",
    '  const baselineArg = process.argv.slice(2)',
  );
  const boundCliVerifierCall = [
    '    const verification = verifyCompendiumTerminalReport(report, expectedRunId, {',
    '      allowCalibration: false, verifyArtifact: verifyReviewArtifact,',
    '      budgetRecord: budget, expectedBudgetSha256: hashFile(budgetPath),',
    '      fixture, expectedInputs, expectedSourceIdentity,',
    '    });',
  ].join('\n');
  const validBoundCliVerifier = (block) => containsExactlyOnce(block, boundCliVerifierCall)
    && !block.includes('const verification = verifyTerminalReport(')
    && block.includes('if (!verification.ok) {')
    && block.includes("return report.status === 'pass' ? 0 : 1;");
  assert(validBoundCliVerifier(cliVerifyBlock),
    'CLI report verifier was not uniquely bound to production lifecycle/input authority');
  const rawCliVerifierMutation = cliVerifyBlock.replace(
    'const verification = verifyCompendiumTerminalReport(',
    'const verification = verifyTerminalReport(',
  );
  assert(rawCliVerifierMutation !== cliVerifyBlock
    && !validBoundCliVerifier(rawCliVerifierMutation),
  'CLI raw-contract verifier substitution mutation stayed green');
  assert(validOwnedLifecycleBlock(baselineLifecycleBlock, 'baselineReportPath')
    && validOwnedLifecycleBlock(candidateLifecycleBlock, 'reportPath'),
  'candidate/baseline runtime did not uniquely route terminal publication through lifecycle cleanup');
  const lifecycleRunners = [
    ['baseline', baselineLifecycleBlock, 'baselineReportPath'],
    ['candidate', candidateLifecycleBlock, 'reportPath'],
  ];
  const ownershipConsumptionMutations = [
    ['browser', '    browser = null;\n'],
    ['server', '    server = null;\n'],
    ['lock', '    lockOwned = false;\n'],
  ];
  let rejectedOwnershipConsumptionMutations = 0;
  for (const [runner, block, reportOwner] of lifecycleRunners) {
    for (const [owner, consumption] of ownershipConsumptionMutations) {
      const mutated = block.replace(consumption, '');
      assert(mutated !== block,
        `${runner} ${owner} exactly-once negative control did not mutate its owner`);
      assert(!validOwnedLifecycleBlock(mutated, reportOwner),
        `${runner} ${owner} consumption removal stayed green and could double-clean in outer finally`);
      rejectedOwnershipConsumptionMutations += 1;
    }
  }
  assert(rejectedOwnershipConsumptionMutations === 6,
    'candidate/baseline exactly-once ownership mutation inventory was incomplete');
  assert(!validOwnedLifecycleBlock(
    baselineLifecycleBlock.replace(
      'publishReport: (report) => atomicWriteJson(baselineReportPath, report)',
      'publishReport: null',
    ),
    'baselineReportPath',
  ), 'baseline lifecycle-removal mutation stayed green');
  assert(!validOwnedLifecycleBlock(
    candidateLifecycleBlock.replace(
      'publishReport: (report) => atomicWriteJson(reportPath, report)',
      'publishReport: null',
    ),
    'reportPath',
  ), 'candidate lifecycle-removal mutation stayed green');
  assert(!validOwnedLifecycleBlock(
    candidateLifecycleBlock.replace(
      'const finalized = await finalizeCompendiumLifecycle({',
      'atomicWriteJson(reportPath, report);\n'
        + '  const finalized = await finalizeCompendiumLifecycle({',
    ),
    'reportPath',
  ), 'pre-cleanup candidate terminal-publication mutation stayed green');

  const serverCloseBlock = ownedLifecycleBlock(
    'export function closeCompendiumServer(', 'function git(',
  );
  const validServerCloseBlock = (block) => block.includes('const startedAt = now();')
    && block.includes('const deadline = startedAt + timeoutMs;')
    && block.includes('if (settled) return;')
    && block.includes('receivedAt >= deadline')
    && block.includes('timer = setTimer(enforceDeadline, timeoutMs);')
    && block.includes('settled = true;\n      if (timer !== null) clearTimer(timer);\n      let finalFailure = failure;')
    && block.includes('server.closeAllConnections();')
    && block.includes('server.close((error) => finish(error || null, now()));');
  assert(validServerCloseBlock(serverCloseBlock)
    && collectorSource.includes('close: () => closeCompendiumServer(server)'),
  'static-server owner did not preserve the bounded forced-close lifecycle seam');
  assert(!validServerCloseBlock(serverCloseBlock.replace(
    'receivedAt >= deadline', 'receivedAt > deadline',
  )), 'server-close exact-deadline acceptance mutation stayed green');
  assert(!validServerCloseBlock(serverCloseBlock.replace(
    'server.closeAllConnections();', '/* forced cleanup removed */',
  )), 'server-close forced-cleanup removal mutation stayed green');
  assert(!validServerCloseBlock(serverCloseBlock.replace(
    'timer = setTimer(enforceDeadline, timeoutMs);', 'timer = null;',
  )), 'server-close deadline-timer removal mutation stayed green');
  assert(!validServerCloseBlock(serverCloseBlock.replace(
    'if (settled) return;', '/* settlement guard removed */',
  )), 'server-close settlement-guard removal mutation stayed green');
  assert(!validServerCloseBlock(serverCloseBlock.replace(
    'settled = true;\n      if (timer !== null) clearTimer(timer);\n      let finalFailure = failure;',
    'if (timer !== null) clearTimer(timer);\n      let finalFailure = failure;',
  )), 'server-close pre-force settlement removal mutation stayed green');
  assert(COMPENDIUM_SERVER_SHUTDOWN_TIMEOUT_MS === 2_000,
    'static-server shutdown bound drifted from 2000ms');

  const runServerCloseControl = async ({
    callbackAt = null, callbackError = null, deadlineAt = null,
  }) => {
    let current = 0;
    let closeCalls = 0;
    let forceCalls = 0;
    let clearCalls = 0;
    let callback = null;
    let timers = [];
    const promise = closeCompendiumServer({
      close(next) { closeCalls += 1; callback = next; },
      closeAllConnections() { forceCalls += 1; },
    }, {
      timeoutMs: COMPENDIUM_SERVER_SHUTDOWN_TIMEOUT_MS,
      now: () => current,
      setTimer(next, delay) {
        const token = { next, delay };
        timers.push(token);
        return token;
      },
      clearTimer() { clearCalls += 1; },
    });
    if (callbackAt !== null) {
      current = callbackAt;
      callback(callbackError);
    } else {
      current = deadlineAt;
      timers.at(-1).next();
    }
    let error = null;
    try { await promise; } catch (caught) { error = caught; }
    return { closeCalls, forceCalls, clearCalls, error, timers };
  };
  const justBeforeServerClose = await runServerCloseControl({ callbackAt: 1_999 });
  const exactServerClose = await runServerCloseControl({ callbackAt: 2_000 });
  const lateServerClose = await runServerCloseControl({ callbackAt: 2_001 });
  const missingServerClose = await runServerCloseControl({ deadlineAt: 2_000 });
  const failedServerClose = await runServerCloseControl({
    callbackAt: 100,
    callbackError: new Error('injected http.Server.close callback failure'),
  });
  assert(justBeforeServerClose.closeCalls === 1 && justBeforeServerClose.forceCalls === 0
    && justBeforeServerClose.clearCalls === 1 && justBeforeServerClose.error === null,
  'just-before-deadline static-server shutdown did not succeed exactly once');
  for (const [label, control] of [
    ['exact-deadline', exactServerClose],
    ['late', lateServerClose],
    ['missing-callback', missingServerClose],
  ]) {
    assert(control.closeCalls === 1 && control.forceCalls === 1
      && control.clearCalls === 1
      && control.error?.message
        === 'Compendium static server did not close before the 2000ms shutdown deadline',
    `${label} static-server shutdown did not fail closed and force cleanup exactly once`);
  }
  assert(failedServerClose.closeCalls === 1 && failedServerClose.forceCalls === 1
    && failedServerClose.clearCalls === 1
    && failedServerClose.error?.message === 'injected http.Server.close callback failure',
  'production static-server close wrapper swallowed its callback error');

  let earlyCurrent = 0;
  let earlyCallback = null;
  let earlyForceCalls = 0;
  const earlyTimers = [];
  const earlyPromise = closeCompendiumServer({
    close(callback) { earlyCallback = callback; },
    closeAllConnections() { earlyForceCalls += 1; },
  }, {
    timeoutMs: COMPENDIUM_SERVER_SHUTDOWN_TIMEOUT_MS,
    now: () => earlyCurrent,
    setTimer(callback, delay) {
      const token = { callback, delay };
      earlyTimers.push(token);
      return token;
    },
    clearTimer() {},
  });
  earlyCurrent = 1_999;
  earlyTimers[0].callback();
  assert(earlyTimers.length === 2 && earlyTimers[1].delay === 1,
    'early shutdown timer did not retain the immutable deadline');
  earlyCurrent = 2_000;
  earlyTimers[1].callback();
  let earlyTimerError = null;
  try { await earlyPromise; } catch (error) { earlyTimerError = error; }
  assert(earlyCallback !== null && earlyForceCalls === 1
    && earlyTimerError?.message
      === 'Compendium static server did not close before the 2000ms shutdown deadline',
  'rescheduled shutdown deadline did not fail closed at the exact boundary');

  let reentrantCurrent = 0;
  let reentrantCallback = null;
  let reentrantForceCalls = 0;
  let reentrantTimer = null;
  const reentrantPromise = closeCompendiumServer({
    close(callback) { reentrantCallback = callback; },
    closeAllConnections() {
      reentrantForceCalls += 1;
      reentrantCallback();
    },
  }, {
    timeoutMs: COMPENDIUM_SERVER_SHUTDOWN_TIMEOUT_MS,
    now: () => reentrantCurrent,
    setTimer(callback, delay) {
      reentrantTimer = { callback, delay };
      return reentrantTimer;
    },
    clearTimer() {},
  });
  reentrantCurrent = 2_000;
  reentrantTimer.callback();
  reentrantCallback();
  let reentrantError = null;
  try { await reentrantPromise; } catch (error) { reentrantError = error; }
  assert(reentrantForceCalls === 1
    && reentrantError?.message
      === 'Compendium static server did not close before the 2000ms shutdown deadline',
  'forced connection cleanup reentrancy did not settle exactly once');

  let staleCurrent = 0;
  let staleCallback = null;
  let staleForceCalls = 0;
  let staleClearCalls = 0;
  let staleTimer = null;
  const stalePromise = closeCompendiumServer({
    close(callback) { staleCallback = callback; },
    closeAllConnections() { staleForceCalls += 1; },
  }, {
    timeoutMs: COMPENDIUM_SERVER_SHUTDOWN_TIMEOUT_MS,
    now: () => staleCurrent,
    setTimer(callback, delay) {
      staleTimer = { callback, delay };
      return staleTimer;
    },
    clearTimer() { staleClearCalls += 1; },
  });
  staleCurrent = 100;
  staleCallback();
  await stalePromise;
  staleCurrent = 2_000;
  staleTimer.callback();
  staleCallback();
  assert(staleForceCalls === 0 && staleClearCalls === 1,
    'cleared timer or duplicate callback changed a successful shutdown result');

  const lifecycleTemp = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-compendiummem-lifecycle-'));
  try {
    const runLifecycleControl = async ({
      label, kind = 'candidate', browserFailure = null, serverFailure = null,
      releaseFailure = null, seedSuccessSample = false,
      samplePublicationFailure = null, sampleDiscardFailure = null,
      reportPublicationFailures = [], failureBuilderFailure = null,
    }) => {
      const controlDir = path.join(lifecycleTemp, label);
      fs.mkdirSync(controlDir);
      const lifecycleReportPath = path.join(controlDir, 'report.json');
      const samplePath = path.join(controlDir, 'success-sample.json');
      const provisional = kind === 'candidate' ? clone(report) : {
        schema: 'cf-v2-compendium-broken-baseline-report/v1', status: 'measured',
        runId: `selftest-${label}`, startedAt: '2026-08-16T00:00:00.000Z',
        endedAt: '2026-08-16T00:00:01.000Z', durationMs: 1000,
        policy: {
          attemptCount: 1, automaticRetries: 0,
          observationTimeoutMs: BASELINE_OBSERVATION_TIMEOUT_MS,
        },
        collectorSource: clone(report.source), baselineSource: clone(report.source),
        inputs: clone(report.inputs), inputDigest: 'd'.repeat(64),
        browser: clone(report.browser), budget: {
          status: 'calibration-required', path: 'budgets/compendium-memory-v1.json',
          sha256: report.inputs.budget,
          browserAuthority: clone(browserAuthority), browserAuthorityMatch: true,
        }, findings: [],
        profiles: {
          phone: { profile: 'phone', diagnostic: 'complete' },
          desktop: { profile: 'desktop', diagnostic: 'complete' },
        },
        samplePath: path.basename(samplePath),
      };
      if (kind === 'candidate') {
        for (const profile of ['phone', 'desktop']) {
          provisional.profiles[profile].reviewPacket = provisional.reviewPacket
            .filter((item) => item.profile === profile);
        }
      }
      const running = {
        ...clone(provisional), status: 'running', endedAt: null, durationMs: null,
        lifecycle: {
          schema: 'cf-v2-compendium-report-lifecycle/v1', status: 'pending',
        },
        outcomes: [], findings: [], profiles: {}, reviewPacket: [],
      };
      atomicWriteJson(lifecycleReportPath, running);
      if (seedSuccessSample) atomicWriteJson(samplePath, { status: 'stale-success' });
      const trace = [];
      const assertReportStillRunning = (owner) => {
        const current = JSON.parse(fs.readFileSync(lifecycleReportPath, 'utf8'));
        assert(current.status === 'running',
          `${label} exposed ${current.status} before ${owner} cleanup completed`);
      };
      const rejectedPublicationStages = new Set(reportPublicationFailures);
      let result = null;
      let thrown = null;
      try {
        result = await finalizeCompendiumLifecycle({
          provisionalReport: provisional, provisionalExitCode: 0,
          closeBrowser: async () => {
            trace.push('browser:close');
            assertReportStillRunning('browser');
            if (browserFailure) throw new Error(browserFailure);
          },
          closeServer: async () => {
            trace.push('server:close');
            assertReportStillRunning('server');
            if (serverFailure) throw new Error(serverFailure);
          },
          publishSuccessSample: () => {
            trace.push('sample:publish');
            atomicWriteJson(samplePath, { status: 'current-success' });
            if (samplePublicationFailure) throw new Error(samplePublicationFailure);
          },
          discardSuccessSample: () => {
            trace.push('sample:discard');
            if (sampleDiscardFailure) throw new Error(sampleDiscardFailure);
            try { fs.unlinkSync(samplePath); }
            catch (error) { if (error?.code !== 'ENOENT') throw error; }
          },
          publishReport: (value) => {
            const publicationStage = value.lifecycle?.status || value.status;
            trace.push(`report:${value.status}:${publicationStage}`);
            if (rejectedPublicationStages.has(publicationStage)) {
              throw new Error(`injected ${publicationStage} report publication failure`);
            }
            atomicWriteJson(lifecycleReportPath, value);
          },
          releaseLock: () => {
            trace.push('lock:release');
            if (releaseFailure) throw new Error(releaseFailure);
          },
          makeFailureReport: (failures) => {
            if (failureBuilderFailure) throw new Error(failureBuilderFailure);
            return kind === 'candidate'
              ? candidateLifecycleFailureReport(provisional, failures)
              : baselineLifecycleFailureReport(provisional, failures);
          },
        });
      } catch (error) { thrown = error; }
      const persisted = JSON.parse(fs.readFileSync(lifecycleReportPath, 'utf8'));
      assert(trace.filter((entry) => entry === 'browser:close').length === 1
        && trace.filter((entry) => entry === 'server:close').length === 1
        && trace.filter((entry) => entry === 'lock:release').length === 1,
      `${label} did not close/release every lifecycle owner exactly once`);
      const persistedSample = fs.existsSync(samplePath)
        ? JSON.parse(fs.readFileSync(samplePath, 'utf8')) : null;
      return { result, thrown, persisted, trace, samplePath, persistedSample };
    };

    const lifecycleSuccess = await runLifecycleControl({ label: 'success' });
    assert(lifecycleSuccess.thrown === null && lifecycleSuccess.result.exitCode === 0
      && lifecycleSuccess.persisted.status === 'pass'
      && lifecycleSuccess.persisted.lifecycle.status === 'complete'
      && lifecycleSuccess.trace.join('|')
        === 'browser:close|server:close|report:running:pending|lock:release|sample:publish|report:pass:complete'
      && fs.existsSync(lifecycleSuccess.samplePath)
      && productionVerify(lifecycleSuccess.persisted).ok,
    'cleanup-complete lifecycle did not publish exactly one verifier-green PASS/sample');

    const browserCleanupRed = await runLifecycleControl({
      label: 'candidate-browser-red', browserFailure: 'injected browser shutdown failure',
      seedSuccessSample: true,
    });
    assert(browserCleanupRed.result.exitCode === 2
      && browserCleanupRed.persisted.status === 'instrument-fail'
      && browserCleanupRed.persisted.lifecycle.status === 'failed'
      && browserCleanupRed.persisted.outcomes.length === 0
      && browserCleanupRed.persisted.blockedOutcomes.length === EXPECTED_OUTCOMES.length
      && browserCleanupRed.persisted.reviewPacket.length === 6
      && browserCleanupRed.persisted.findings.some((finding) =>
        finding === 'instrument: browser shutdown: injected browser shutdown failure')
      && browserCleanupRed.trace.indexOf('server:close')
        > browserCleanupRed.trace.indexOf('browser:close')
      && !browserCleanupRed.trace.includes('sample:publish')
      && !fs.existsSync(browserCleanupRed.samplePath)
      && productionVerify(browserCleanupRed.persisted).ok,
    'browser cleanup rejection left candidate PASS/sample/verifier authority');

    const baselineCleanupRed = await runLifecycleControl({
      label: 'baseline-server-red', kind: 'baseline',
      serverFailure: 'injected server shutdown failure', seedSuccessSample: true,
    });
    assert(baselineCleanupRed.result.exitCode === 2
      && baselineCleanupRed.persisted.status === 'instrument-fail'
      && baselineCleanupRed.persisted.evidenceStatus
        === 'partial-diagnostic-not-budget-samples'
      && baselineCleanupRed.persisted.budget.browserAuthorityMatch === true
      && JSON.stringify(baselineCleanupRed.persisted.budget.browserAuthority)
        === JSON.stringify(browserAuthority)
      && baselineCleanupRed.persisted.findings.some((finding) =>
        finding === 'instrument: static server shutdown: injected server shutdown failure')
      && !baselineCleanupRed.trace.includes('sample:publish')
      && !fs.existsSync(baselineCleanupRed.samplePath),
    'server cleanup rejection left baseline MEASURED/sample authority');

    const combinedCleanupRed = await runLifecycleControl({
      label: 'combined-red', browserFailure: 'injected browser failure',
      serverFailure: 'injected server failure', seedSuccessSample: true,
    });
    assert(combinedCleanupRed.persisted.status === 'instrument-fail'
      && combinedCleanupRed.persisted.findings.length === 1
      && combinedCleanupRed.persisted.findings[0]
        === 'instrument: browser shutdown: injected browser failure; '
          + 'static server shutdown: injected server failure'
      && !fs.existsSync(combinedCleanupRed.samplePath)
      && productionVerify(combinedCleanupRed.persisted).ok,
    'combined cleanup rejection did not retain both ordered diagnoses and terminal red');

    const releaseCleanupRed = await runLifecycleControl({
      label: 'release-red', releaseFailure: 'injected lock release failure',
    });
    assert(releaseCleanupRed.result.exitCode === 2
      && releaseCleanupRed.persisted.status === 'instrument-fail'
      && releaseCleanupRed.trace.join('|')
        === 'browser:close|server:close|report:running:pending|lock:release|sample:discard|report:instrument-fail:failed'
      && !fs.existsSync(releaseCleanupRed.samplePath)
      && releaseCleanupRed.persisted.findings.some((finding) =>
        finding === 'instrument: workspace lock release: injected lock release failure')
      && productionVerify(releaseCleanupRed.persisted).ok,
    'workspace-lock release rejection left final PASS/sample/verifier authority');

    const terminalPublicationRed = await runLifecycleControl({
      label: 'terminal-publication-red', reportPublicationFailures: ['complete'],
    });
    assert(terminalPublicationRed.thrown === null
      && terminalPublicationRed.result.exitCode === 2
      && terminalPublicationRed.persisted.status === 'instrument-fail'
      && terminalPublicationRed.persisted.lifecycle.status === 'failed'
      && terminalPublicationRed.trace.join('|')
        === 'browser:close|server:close|report:running:pending|lock:release|sample:publish|report:pass:complete|sample:discard|report:instrument-fail:failed'
      && terminalPublicationRed.persisted.findings.some((finding) => finding
        === 'instrument: terminal report publication: injected complete report publication failure')
      && !fs.existsSync(terminalPublicationRed.samplePath)
      && productionVerify(terminalPublicationRed.persisted).ok,
    'terminal-report publication rejection left a success sample or verifier-green PASS');

    const samplePublicationRed = await runLifecycleControl({
      label: 'sample-publication-red',
      samplePublicationFailure: 'injected success sample publication failure',
    });
    assert(samplePublicationRed.thrown === null
      && samplePublicationRed.result.exitCode === 2
      && samplePublicationRed.result.successSamplePublished === false
      && samplePublicationRed.persisted.status === 'instrument-fail'
      && samplePublicationRed.persisted.lifecycle.status === 'failed'
      && samplePublicationRed.trace.join('|')
        === 'browser:close|server:close|report:running:pending|lock:release|sample:publish|sample:discard|report:instrument-fail:failed'
      && samplePublicationRed.trace.filter((entry) => entry === 'sample:publish').length === 1
      && samplePublicationRed.trace.filter((entry) => entry === 'sample:discard').length === 1
      && samplePublicationRed.persisted.findings.some((finding) => finding
        === 'instrument: success sample publication: injected success sample publication failure')
      && samplePublicationRed.persistedSample === null
      && productionVerify(samplePublicationRed.persisted).ok,
    'success-sample publication rejection left disk/sample/PASS authority inconsistent');

    const sampleDiscardRed = await runLifecycleControl({
      label: 'sample-discard-red',
      reportPublicationFailures: ['complete'],
      sampleDiscardFailure: 'injected success sample discard failure',
    });
    assert(sampleDiscardRed.thrown === null
      && sampleDiscardRed.result.exitCode === 2
      && sampleDiscardRed.result.successSamplePublished === false
      && sampleDiscardRed.persisted.status === 'instrument-fail'
      && sampleDiscardRed.persisted.lifecycle.status === 'failed'
      && sampleDiscardRed.trace.join('|')
        === 'browser:close|server:close|report:running:pending|lock:release|sample:publish|report:pass:complete|sample:discard|report:instrument-fail:failed'
      && sampleDiscardRed.trace.filter((entry) => entry === 'sample:publish').length === 1
      && sampleDiscardRed.trace.filter((entry) => entry === 'sample:discard').length === 1
      && sampleDiscardRed.persisted.findings.length === 1
      && sampleDiscardRed.persisted.findings[0]
        === 'instrument: terminal report publication: injected complete report publication failure; '
          + 'success sample suppression: injected success sample discard failure'
      && sampleDiscardRed.persistedSample?.status === 'current-success'
      && productionVerify(sampleDiscardRed.persisted).ok,
    'success-sample discard rejection did not leave exact terminal-red/disk evidence');

    const pendingPublicationRed = await runLifecycleControl({
      label: 'pending-publication-red', reportPublicationFailures: ['pending'],
    });
    assert(pendingPublicationRed.thrown === null
      && pendingPublicationRed.result.exitCode === 2
      && pendingPublicationRed.persisted.status === 'instrument-fail'
      && !pendingPublicationRed.trace.includes('sample:publish')
      && !fs.existsSync(pendingPublicationRed.samplePath)
      && productionVerify(pendingPublicationRed.persisted).ok,
    'pending-report publication rejection exposed success authority');

    const releaseAndRedPublication = await runLifecycleControl({
      label: 'release-and-red-publication-red',
      releaseFailure: 'injected lock release failure',
      reportPublicationFailures: ['failed'], seedSuccessSample: true,
    });
    assert(releaseAndRedPublication.thrown === null
      && releaseAndRedPublication.result.exitCode === 2
      && releaseAndRedPublication.persisted.status === 'running'
      && releaseAndRedPublication.persisted.lifecycle.status === 'pending'
      && !fs.existsSync(releaseAndRedPublication.samplePath)
      && !productionVerify(releaseAndRedPublication.persisted).ok
      && releaseAndRedPublication.result.failures.some((failure) =>
        failure.stage === 'instrument-fail report publication'),
    'combined lock-release/red-publication rejection left verifier-green success authority');

    const failureBuilderRejected = await runLifecycleControl({
      label: 'failure-builder-rejected',
      browserFailure: 'injected browser shutdown failure',
      failureBuilderFailure: 'injected failure-report builder failure',
      seedSuccessSample: true,
    });
    assert(failureBuilderRejected.result === null
      && failureBuilderRejected.thrown?.message === 'injected failure-report builder failure'
      && failureBuilderRejected.persisted.status === 'running'
      && failureBuilderRejected.persisted.lifecycle.status === 'pending'
      && failureBuilderRejected.trace.filter((entry) => entry === 'browser:close').length === 1
      && failureBuilderRejected.trace.filter((entry) => entry === 'server:close').length === 1
      && failureBuilderRejected.trace.filter((entry) => entry === 'lock:release').length === 1
      && !fs.existsSync(failureBuilderRejected.samplePath)
      && !productionVerify(failureBuilderRejected.persisted).ok,
    'throwing failure-report construction leaked an owner or verifier-green success');
  } finally {
    const prefix = os.tmpdir().endsWith(path.sep) ? os.tmpdir() : os.tmpdir() + path.sep;
    assert(lifecycleTemp.startsWith(prefix),
      `refusing unsafe lifecycle temporary cleanup ${lifecycleTemp}`);
    fs.rmSync(lifecycleTemp, { recursive: true });
  }
  const calibration = clone(report);
  calibration.status = 'calibration';
  calibration.budget.status = 'calibration-required';
  calibration.budget.browserAuthority = clone(browserAuthority);
  calibration.budget.browserAuthorityMatch = true;
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
  console.log(`COMPENDIUMMEM SELFTEST: PASS — ${controls.length + structuredInstrumentControlCount} independent product/instrument controls`);
  console.log('  empty + short fixtures; unwindowed rows; exact 132/440 dimensions');
  console.log('  release/disposal/dedupe/full identity/generation/focus/error/cap/canvas/eager import');
  console.log('  count-only bytes, warm plateau, target+heartbeat, stale PASS, missing outcome, no retry');
  console.log('  structured thumbnail ownership/state/decode/work/page diagnostics; exact foreground service authority');
  console.log('  cleanup-before-publication: browser/server/lock rejection stays terminal red; success samples suppressed');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length === 2) await runCompendiumMemSelftest();
  else {
    console.error('usage: node tools/compendiummem-selftest.mjs');
    process.exitCode = 2;
  }
}
