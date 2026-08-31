import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { evaluateSceneMemory } from '../tools/scenemem-contract.mjs';
import {
  SCENE_MEMORY_BROWSER_AUTHORITY_SCHEMA,
  SCENE_MEMORY_BROWSER_AUTHORITY_SCOPE,
  SCENE_MEMORY_BROWSER_CAPABILITY_CONTRACT,
  SCENE_MEMORY_BROWSER_CAPABILITY_CONTRACT_SHA256,
  SCENE_MEMORY_BROWSER_PROFILE_CONTRACT,
  SCENE_MEMORY_BROWSER_PROFILE_CONTRACT_SHA256,
  SCENE_MEMORY_SHIPYARD_OPEN_OBSERVATION_SCHEMA,
  sceneMemoryBrowserAuthorityMatches,
  sceneMemoryBrowserCapabilityInventoryErrors,
  sceneMemoryCollectProfilesOnce,
  sceneMemoryCollectFixedSnapshot,
  sceneMemoryCollectSnapshotPass,
  sceneMemoryInitialHeapProjection,
  sceneMemoryHeapPhaseControlSlopes,
  sceneMemoryPhaseThresholdForMaximum,
  sceneMemoryProfilePhaseMaximum,
  sceneMemoryCollectorCommandTimeoutMs,
  sceneMemoryMetricSummary,
  sceneMemoryProfileRawBindingErrors,
  sceneMemorySnapshotPairErrors,
  sceneMemorySnapshotHistoricalFourPassErrors,
  sceneMemorySnapshotPhaseErrors,
  sceneMemoryShipyardOpenSettlementReasons,
  sceneMemorySurfaceVistaFaultReasons,
  sceneMemoryVeteranRaw,
  sceneMemoryBfcacheAwayResponse,
  reportBrowserAuthorityErrors,
  terminalOutcomeInventoryErrors,
  terminalPassEvidenceErrors,
  terminalProfileEvidenceErrors,
  terminalSourceAuthorityErrors,
  verifyReport,
} from '../tools/scenemem.mjs';

const collectorSource = readFileSync(
  fileURLToPath(new URL('../tools/scenemem.mjs', import.meta.url)),
  'utf8',
);
const browserCdpSource = readFileSync(
  fileURLToPath(new URL('../tools/browsercdp.mjs', import.meta.url)),
  'utf8',
);
const baselineVeteran = JSON.parse(readFileSync(
  fileURLToPath(new URL('../../baseline-v1.8.9/save-fixtures.json', import.meta.url)),
  'utf8',
)).inputs.veteran_rich as Record<string, unknown>;
const RETAINED_REPORT_FILES = [
  '../../../audits/ARC1C_SCENEMEM_CALIBRATION_CANDIDATE1.json.gz',
  '../../../audits/ARC1C_SCENEMEM_CALIBRATION_CANDIDATE2.json.gz',
  '../../../audits/ARC1C_SCENEMEM_CALIBRATION_CANDIDATE3.json.gz',
  '../../../audits/ARC1C_SCENEMEM_LOCAL_CERTIFICATION.json.gz',
  '../../../audits/ARC1C_SCENEMEM_PR35_V8_GROWTH_CALIBRATION1_20260830_553B06B.json.gz',
] as const;
const HISTORICAL_FOUR_PASS_RED_FILE =
  '../../../audits/ARC1C_SCENEMEM_PR35_FOURPASS_CALIBRATION_INSTRUMENT_RED_20260830_5691E77_CANDIDATE1.json.gz';
const FIXED_EIGHT_RED_FILE =
  '../../../audits/ARC1C_SCENEMEM_PR35_FIXEDEIGHT_CALIBRATION_INSTRUMENT_RED_20260830_CC15E1F_CANDIDATE1.json.gz';
const budgetPath = fileURLToPath(new URL('../budgets/scene-memory-v2.json', import.meta.url));
const currentBudget = JSON.parse(readFileSync(budgetPath, 'utf8'));

function rawContractProjection(snapshot: any): Record<string, unknown> {
  const scene = snapshot.raw.scene;
  const shipyard = snapshot.raw.shipyard;
  const hasSurfaceVista = Object.prototype.hasOwnProperty.call(
    scene, 'surfaceVistaWorkerActive',
  );
  return {
    documentToken: scene.documentToken,
    sceneGeneration: scene.generation,
    registry: scene.registry,
    managedResources: scene.managedResources,
    managedTextureCount: scene.managedTextureCount,
    managedTexturePixels: scene.managedTexturePixels,
    managedTextureClearedSlots: scene.managedTextureClearedSlots,
    sceneTextStyleUpdateListeners: scene.sceneTextStyleUpdateListeners,
    localCanvasCacheEntries: scene.localCanvasCacheEntries,
    peakLocalCanvasCacheEntries: scene.peakLocalCanvasCacheEntries,
    productRenderTargets: scene.productRenderTargets,
    retiredFineOwnerCount: scene.retiredFineOwnerCount,
    shipyardDiagnosticsSchema: shipyard.schema,
    shipyardPreviewStatus: shipyard.status,
    shipyardPreviewStateKey: shipyard.stateKey,
    shipyardPreviewActiveCount: shipyard.activePreviewCount,
    shipyardPreviewRetainedCount: shipyard.retainedPreviewCount,
    shipyardPreviewPendingWork: shipyard.pendingPreviewWork,
    pending: scene.pendingSurfaceRefreshes + scene.pendingSystemRefreshes
      + scene.pendingPersistenceWrites
      + (hasSurfaceVista
        ? Number(scene.surfaceVistaWorkerActive) + Number(scene.surfaceVistaMounted) : 0)
      + scene.retiredFineOwnerCount + shipyard.activePreviewCount
      + shipyard.retainedPreviewCount + shipyard.pendingPreviewWork,
    ringCacheEntries: scene.ringGeometryEntries,
    peakRingGeometryEntries: scene.peakRingGeometryEntries,
    ...(hasSurfaceVista ? {
      surfaceVistaWorkerActive: scene.surfaceVistaWorkerActive,
      surfaceVistaMounted: scene.surfaceVistaMounted,
      surfaceVistaCacheEntries: scene.surfaceVistaCacheEntries,
      surfaceVistaCachePixels: scene.surfaceVistaCachePixels,
    } : {}),
    answerability: {
      target: {
        ok: snapshot.answerability.target.ok,
        elapsedMs: snapshot.answerability.target.durationMs,
        laterTicker: snapshot.answerability.target.value.after
          > snapshot.answerability.target.value.before,
        tickerBefore: snapshot.answerability.target.value.before,
        tickerAfter: snapshot.answerability.target.value.after,
        documentTokenBefore: snapshot.answerability.target.value.documentTokenBefore,
        documentTokenAfter: snapshot.answerability.target.value.documentTokenAfter,
      },
      heartbeat: {
        ok: snapshot.answerability.heartbeat.ok,
        elapsedMs: snapshot.answerability.heartbeat.durationMs,
        independent: true,
        product: snapshot.answerability.heartbeat.product,
        protocolVersion: snapshot.answerability.heartbeat.protocolVersion,
      },
    },
    heap: {
      usedSize: snapshot.heap.usedSize,
      embedderHeapUsedSize: snapshot.heap.embedderHeapUsedSize,
      backingStorageSize: snapshot.heap.backingStorageSize,
    },
    dom: {
      documents: snapshot.dom.documents,
      nodes: snapshot.dom.nodes,
      jsEventListeners: snapshot.dom.jsEventListeners,
    },
  };
}

function rawDerivedProjectionErrors(report: any): string[] {
  const errors: string[] = [];
  for (const [profile, measurement] of Object.entries<any>(report.profiles ?? {})) {
    if (!isDeepStrictEqual(measurement.precondition, rawContractProjection(measurement.warmup))) {
      errors.push(`${profile} precondition is detached from retained warmup evidence`);
    }
    for (const [index, snapshot] of measurement.measured.entries()) {
      const { cycle, inventory, ...point } = measurement.cycles[index] ?? {};
      void cycle;
      void inventory;
      if (!isDeepStrictEqual(point, rawContractProjection(snapshot))) {
        errors.push(`${profile} cycle ${index + 1} is detached from retained raw evidence`);
      }
    }
  }
  return errors;
}

function retainedReports(): any[] {
  return RETAINED_REPORT_FILES.map((relative) => JSON.parse(gunzipSync(readFileSync(
    fileURLToPath(new URL(relative, import.meta.url)),
  )).toString('utf8')));
}

function bindCurrentContract(report: any): void {
  report.contractInput = {
    schema: 'cf-v2-scene-memory-input/v6',
    profiles: Object.fromEntries((['phone', 'desktop'] as const).map((profile) => {
      const measurement = report.profiles[profile];
      return [profile, {
        initial: {
          documentToken: measurement.initial.raw.scene.documentToken,
          heap: sceneMemoryInitialHeapProjection(measurement.initial.heap),
        },
        initialVista: measurement.initialVista,
        firstSurfaceVista: measurement.firstSurfaceVista,
        precondition: measurement.precondition,
        cycles: measurement.cycles,
        bfcache: measurement.bfcache,
        reloadCleanup: measurement.reloadCleanup,
      }];
    })),
    budgets: currentBudget.profiles,
  };
  report.verdict = evaluateSceneMemory(report.contractInput);
  report.outcomes = report.verdict.outcomes;
}

function currentFixedEightSnapshot(snapshot: any): any {
  const scoredLabel = snapshot.label;
  const labels = [
    ...Array.from({ length: 6 }, (_, index) => `${scoredLabel}-phase-settle-${index + 1}`),
    `${scoredLabel}-phase-validity`,
    scoredLabel,
  ];
  const passes = labels.map((label, index) => {
    const pass = structuredClone(snapshot);
    delete pass.heapPhaseProbe;
    delete pass.heapPhasePasses;
    delete pass.heapPhaseValidity;
    pass.label = label;
    pass.answerability.token = label;
    const before = 10_000 + index * 2;
    pass.answerability.target.value.before = before;
    pass.answerability.target.value.after = before + 1;
    pass.raw.state.tickerTicks = before + 1;
    return pass;
  });
  const scored = passes.at(-1)!;
  scored.heapPhasePasses = passes.slice(0, -1);
  scored.heapPhaseValidity = {
    schema: 'cf-v2-scene-memory-heap-phase-validity/v2',
    status: 'valid',
    comparedPasses: [7, 8],
    scoredSnapshotPass: 8,
    maxAbsolutePhaseDeltaBytes: 65_536,
    deltas: {
      usedSize: 0,
      embedderHeapUsedSize: 0,
      backingStorageSize: 0,
      aggregate: 0,
    },
    reasons: [],
  };
  return scored;
}

function currentReportFixture(): any {
  const report = structuredClone(retainedReports().at(-1)!);
  report.schema = 'cf-v2-scene-memory-report/v6';
  report.status = 'pass';
  report.certification = 'contract-budget';
  report.findings = [];
  report.fatalEvents = [];
  report.calibrationBoundary = null;
  report.policy = {
    ...report.policy,
    snapshotPasses: 8,
    settlingPasses: 6,
    validityPasses: [7, 8],
    scoredSnapshotPass: 8,
    phaseInvalidity: 'instrument-fail-before-contract',
    phaseCalibrationHardCapBytes: 65_536,
  };
  for (const profile of ['phone', 'desktop'] as const) {
    const measurement = report.profiles[profile];
    measurement.schema = 'cf-v2-scene-memory-profile/v5';
    measurement.initial = currentFixedEightSnapshot(measurement.initial);
    measurement.warmups = measurement.warmups.map(currentFixedEightSnapshot);
    measurement.warmup = measurement.warmups.at(-1);
    measurement.measured = measurement.measured.map(currentFixedEightSnapshot);
    measurement.bfcacheSnapshot = currentFixedEightSnapshot(measurement.bfcacheSnapshot);
    measurement.precondition = rawContractProjection(measurement.warmup);
    measurement.cycles = measurement.measured.map((snapshot: any, index: number) => ({
      ...rawContractProjection(snapshot),
      cycle: index + 1,
      inventory: measurement.cycles[index].inventory,
    }));
    measurement.bfcache = {
      ...measurement.bfcache,
      ...rawContractProjection(measurement.bfcacheSnapshot),
    };
    measurement.metrics = sceneMemoryMetricSummary(measurement);
  }
  bindCurrentContract(report);
  return report;
}
const PRODUCT_AUTHORITY_BINDINGS = [
  ['gameHtml', 'gameHtmlPath', "const gameHtmlPath = path.join(appDir, 'index.html');"],
  ['shipVisualState', 'shipVisualStatePath',
    "const shipVisualStatePath = path.join(v2Root, 'packages', 'scene', 'src', 'ship-visual-state.ts');"],
  ['shipyardPreview', 'shipyardPreviewPath',
    "const shipyardPreviewPath = path.join(appDir, 'src', 'shipyard-preview.ts');"],
  ['planetTextureAttachment', 'planetTextureAttachmentPath',
    "const planetTextureAttachmentPath = path.join(appDir, 'src', 'planet-texture-attachment.ts');"],
  ['planetTextureDemand', 'planetTextureDemandPath',
    "const planetTextureDemandPath = path.join(appDir, 'src', 'planet-texture-demand.ts');"],
] as const;

function productAuthorityBindingErrors(source: string): string[] {
  const errors: string[] = [];
  const fields = /const PRODUCER_AUTHORITY_FIELDS = Object\.freeze\(\[([\s\S]*?)\]\);/
    .exec(source)?.[1] ?? '';
  const inputs = /function exactInputs\(fixture, budgetFile = null, buildSha256 = null\) \{[\s\S]*?return Object\.freeze\(\{([\s\S]*?)\n  \}\);/
    .exec(source)?.[1] ?? '';
  for (const [field, pathName, declaration] of PRODUCT_AUTHORITY_BINDINGS) {
    if (source.split(declaration).length - 1 !== 1) errors.push(`${field} path declaration`);
    if (fields.split(`'${field}'`).length - 1 !== 1) errors.push(`${field} authority field`);
    if (inputs.split(`${field}: hashFile(${pathName}),`).length - 1 !== 1) {
      errors.push(`${field} exact input binding`);
    }
  }
  return errors;
}

function shipyardRouteBindingErrors(source: string): string[] {
  const exactBindings = [
    "'#dockshipyard,#railshipyard', 'open Shipyard'",
    "'#shipyardpanel [data-pnx=\"shipyard\"]', 'close Shipyard'",
    "S.api.shipyardDiagnostics()",
    'SCENE_MEMORY_SHIPYARD_OPEN_OBSERVATION_SCHEMA',
    'sceneMemoryShipyardOpenSettlementReasons(value).length === 0',
    'reasons: diagnose(last)',
    "document.querySelectorAll('#shipyardpanel [data-cf-shipyard-preview=\"v1\"]')",
    'e=s.engineering,de=d?.engineering,',
    "unavailable=document.querySelector('#shipyardpanel [data-engineering-state]')",
    "actionControlCount=document.querySelectorAll('#shipyardpanel [data-engineering-action]').length",
    'arc3:{stateKind:e?.stateKind??null,protection:e?.protection??null,',
    "unavailableReason:unavailable?.getAttribute('data-engineering-unavailable')??null",
    'actionControlCount,diagnosticsActionControlCount:de?.actionControlCount??null',
    "visitedRoutes.push('shipyard');",
    'sceneObjectsByRoute.shipyard = shipyardOpen.domPreviewCount;',
    "shipyardStatus: 'implemented-static'",
    "const OUTCOME_COUNT = 44;",
  ];
  const errors = [];
  for (const binding of exactBindings) {
    if (!source.includes(binding)) errors.push(binding);
  }
  if (source.includes("openPanel('shipyard')") || source.includes("togglePanel('shipyard')")) {
    errors.push('collector bypassed visible Shipyard controls');
  }
  return errors;
}

function surfaceTierSettlementBindingErrors(source: string): string[] {
  const exactBindings = [
    'r.pendingSurfaceRefreshes===0&&r.pendingSystemRefreshes===0',
    'r.surfaceCurrentTierPx===${expectedTierPx}&&r.surfaceRequestedTierPx===0',
    'r.surfaceCurrentBackingWidth===${expectedTierPx}',
    'r.surfaceCurrentBackingHeight===${expectedTierPx}',
    'return {...r,rendererDpr:s.rendererDpr,settled}',
    '(value) => value?.settled === true, ART_TIMEOUT_MS',
    'sceneMemorySurfaceVistaFaultReasons,',
    '(value) => sceneMemorySurfaceVistaFaultReasons(value).length > 0',
    'product reported a terminal fault',
    'r.surfaceVistaWorkerActive===false&&r.surfaceVistaMounted===true',
    'r.surfaceVistaCacheEntries===${SURFACE_VISTA_CACHE_ENTRIES_MAX}',
    'r.surfaceVistaCachePixels<=${SURFACE_VISTA_CACHE_PIXELS_MAX}',
    '&&r.surfaceVistaWorkerActive===false&&r.surfaceVistaMounted===false',
    "const SURFACE_VISTA_RELOAD_CLEANUP_BINDING = '__cfSceneMemoryVistaCacheCleanup';",
    "schema:'cf-v2-scene-memory-vista-cache-transition/v1'",
    'before?.surfaceVistaCacheEntries>0&&after?.surfaceVistaCacheEntries===0',
    'measurement.initialVista = surfaceVistaState(measurement.initial.raw.scene);',
    'measurement.firstSurfaceVista = surfaceVistaState(warmupRoute.surfaceVistaObservation);',
    'measurement.reloadCleanup = await collectReloadCleanup({',
    '+ Number(scene.surfaceVistaWorkerActive) + Number(scene.surfaceVistaMounted)',
    'surfaceVistaCacheEntriesMax: max((point) => point.surfaceVistaCacheEntries)',
    'errors.push(...sceneMemoryProfileRawBindingErrors(measurement)',
    "schema: 'cf-v2-scene-memory-input/v6'",
  ];
  return exactBindings.filter((binding) => !source.includes(binding));
}

function sourceNormalizedHeapBindingErrors(source: string): string[] {
  const projectionUse =
    'heap: sceneMemoryInitialHeapProjection(measurement.initial.heap),';
  const exactBindings = [
    "const REPORT_SCHEMA = 'cf-v2-scene-memory-report/v6';",
    "const BUDGET_SCHEMA = 'cf-v2-scene-memory-budget/v7';",
    "const PROFILE_SCHEMA = 'cf-v2-scene-memory-profile/v5';",
    "schema: 'cf-v2-scene-memory-input/v6'",
    'documentToken: measurement.initial.raw.scene.documentToken,',
    'export function sceneMemoryInitialHeapProjection(heap) {',
    projectionUse,
    'initialHeapUsedBytesMax: initialHeapUsed',
    'initialHeapAggregateBytesMax: initialHeapUsed',
    'heapUsedGrowthBytesMax: max(heapGrowth)',
    'heapNormalizedWorkingSetBytesMax: max((point) => heapGrowth(point)',
    'terminal certification requires the current source-normalized input contract',
  ];
  const errors = exactBindings.filter((binding) => !source.includes(binding));
  if (source.split(projectionUse).length - 1 !== 2 && !errors.includes(projectionUse)) {
    errors.push(projectionUse);
  }
  return errors;
}

function collectorTimeoutBindingErrors(source: string): string[] {
  const exactBindings = [
    'timeoutMs: sceneMemoryCollectorCommandTimeoutMs(timeoutMs)',
    'return Math.min(timeoutMs, COMMAND_TIMEOUT_MS);',
    "'request intentional replacement reload');",
    'const deadline = performance.now() + ART_TIMEOUT_MS;',
  ];
  return exactBindings.filter((binding) => !source.includes(binding));
}

function bfcacheAwayBoundaryErrors(source: string): string[] {
  const exactBindings = [
    'function serveBfcacheAwayPage() {',
    'const projected = sceneMemoryBfcacheAwayResponse(url.pathname);',
    "server.listen(0, '127.0.0.1', () => {",
    'const away = await serveBfcacheAwayPage();',
    'url: `${away.origin}/__scenemem_bfcache_away__.html`',
    '<link rel="icon" href="data:,">',
    "await send('Page.navigateToHistoryEntry', { entryId: gameEntryId }, sessionId, {",
    'await away.close();',
  ];
  const errors = exactBindings.filter((binding) => !source.includes(binding));
  if (source.includes('`${origin}/__scenemem_away__.html`')) {
    errors.push('bfcache away navigation remains inside the product service-worker scope');
  }
  return errors;
}

function landingRejectionEvidenceBindingErrors(source: string): string[] {
  const start = source.indexOf('const landAttempt = await collector.evaluate(');
  const end = source.indexOf('\n  const surfaceRoute = await observe(', start);
  const owner = start >= 0 && end > start ? source.slice(start, end) : '';
  const bindings = [
    'const accepted = await api.landOn(',
    'const state = api?.state?.() ?? null;',
    'protectedDetail: state.persistence.protectedDetail ?? null,',
    'convergenceReloadScheduled: state.persistence.convergenceReloadScheduled ?? null,',
    'mutationBlockWitness: state.persistence.mutationBlockWitness ?? null,',
    'runtime: state.persistence.runtime ?? null,',
    'landing: state.landing ?? null,',
    'productAssert(landAttempt?.accepted === true,',
    'landAttempt?.evidence ?? landAttempt',
    "landAttempt?.evidence?.route?.mode === 'surface'",
    'landAttempt?.evidence?.persistence?.convergenceReloadScheduled === false',
  ];
  const errors = bindings.filter((binding) => !owner.includes(binding));
  if (owner.split('collector.evaluate(').length - 1 !== 1) {
    errors.push('Earth Landing and its rejection witness do not share exactly one browser task');
  }
  if (owner.includes('__smokeArmF4ConvergenceReloadHold')) {
    errors.push('SceneMemory suppresses the production convergence reload');
  }
  return errors;
}

function buildGraphAuthorityBindingErrors(source: string): string[] {
  const exactBindings = [
    "'package', 'packageLock', 'appPackage', 'buildDist', 'gameHtml', 'gameMain'",
    'buildDist: buildSha256,',
    'inputs = exactInputs(fixture, authoritativeBudgetFile, build.sha256);',
    'const currentBuild = distIdentity();',
    "errors.push('built product graph authority drifted')",
    'exactInputs(fixture, authoritativeBudgetFile, currentBuild.sha256)',
  ];
  return exactBindings.filter((binding) => !source.includes(binding));
}

function profileAttemptBindingErrors(source: string): string[] {
  const start = source.indexOf('async function runGate(options)');
  const end = source.indexOf('\nfunction surfaceInventoryFromObservation(', start);
  const owner = start >= 0 && end > start ? source.slice(start, end) : '';
  const exactBindings = [
    'await sceneMemoryCollectProfilesOnce(async (profile, viewport) => {',
    'const measurement = await collectProfile({',
  ];
  return exactBindings.filter((binding) => owner.split(binding).length - 1 !== 1);
}

function phaseInvalidityStagingErrors(source: string): string[] {
  const errors: string[] = [];
  const collectStart = source.indexOf('async function collectProfile({');
  const collectEnd = source.indexOf('\nfunction browserSample(', collectStart);
  const owner = collectStart >= 0 && collectEnd > collectStart
    ? source.slice(collectStart, collectEnd) : '';
  const stages = [
    ['initial', 'measurement.initial = await sceneMemoryCollectFixedSnapshot({',
      'for (let index = 0; index < WARMUP_CYCLES; index++) {'],
    ['warmup', 'measurement.warmup = await sceneMemoryCollectFixedSnapshot({',
      'measurement.precondition = contractPoint(measurement.warmup);'],
    ['measured', 'const snapshot = await sceneMemoryCollectFixedSnapshot({',
      'const bfcacheEvidence = await collectBfcache({'],
    ['bfcache', 'measurement.bfcacheSnapshot = bfcacheEvidence.snapshot;',
      'measurement.reloadCleanup = await collectReloadCleanup({'],
  ] as const;
  for (const [label, startToken, endToken] of stages) {
    const start = owner.indexOf(startToken);
    const end = owner.indexOf(endToken, start + startToken.length);
    const stage = start >= 0 && end > start ? owner.slice(start, end) : '';
    const progress = stage.indexOf('onProgress(measurement);');
    const assertion = stage.indexOf('assertSceneMemoryHeapPhaseSnapshot(');
    if (progress < 0 || assertion <= progress) {
      errors.push(`${label} phase evidence is not staged before its instrument assertion`);
    }
  }
  const assertionStart = source.indexOf('function assertSceneMemoryHeapPhaseSnapshot(');
  const assertionEnd = source.indexOf('\nexport function sceneMemoryHeapPhaseControlSlopes(', assertionStart);
  const assertionOwner = assertionStart >= 0 && assertionEnd > assertionStart
    ? source.slice(assertionStart, assertionEnd) : '';
  if (!assertionOwner.includes('assert(errors.length === 0,')
    || assertionOwner.includes('productAssert(')) {
    errors.push('phase invalidity is not a plain instrument assertion');
  }
  return errors;
}

function calibrationBoundaryBindingErrors(source: string): string[] {
  const exactBindings = [
    "const CALIBRATION_BUDGET_RELATIVE_PATH = 'port/v2/budgets/scene-memory-v2.json';",
    'const boundaryFile = assertBudgetAuthority(calibrationBudgetPath);',
    'const validation = validateSceneMemoryBudget(boundaryBudget);',
    "assert(boundaryBudget.status === 'calibration-required',",
    'sha256: hashFile(boundaryFile),',
    'calibrationBoundary,',
    "!/^[a-f0-9]{40}$/.test(report.source?.begin?.commit || '')",
    "!/^[a-f0-9]{64}$/.test(report.source?.begin?.workingTreeSha256 || '')",
    "'git', ['rev-parse', '--verify', `${report.source.begin.commit}^{commit}`]",
    'resolvedCommit !== report.source.begin.commit',
    "'show', `${report.source.begin.commit}:${CALIBRATION_BUDGET_RELATIVE_PATH}`",
    'sha256(boundaryBlob) !== report.calibrationBoundary.sha256',
    'const boundaryValidation = validateSceneMemoryBudget(boundaryBudget);',
    "boundaryBudget.status !== 'calibration-required'",
    '!same(boundaryBudget.authority?.producer, expectedProducerAuthority)',
    '!same(boundaryBudget.authority?.browser, expectedBrowserAuthority)',
  ];
  return exactBindings.filter((binding) => !source.includes(binding));
}

const settledShipyardOpenObservation = Object.freeze({
  schema: SCENE_MEMORY_SHIPYARD_OPEN_OBSERVATION_SCHEMA,
  panelOpen: 'shipyard',
  shipVisualStateKey: 'ship:v1:fixture',
  domPreviewCount: 1,
  domStateKey: 'ship:v1:fixture',
  arc3: Object.freeze({
    stateKind: 'unavailable',
    protection: 'legacy-refused:legacy-seed-missing',
    bootstrapPending: false,
    bootstrapCandidateReady: false,
  }),
  presentation: Object.freeze({
    state: 'unavailable',
    unavailableReason: 'Engineering details and actions are unavailable while this expedition’s Engineering record is protected.',
    actionControlCount: 0,
    diagnosticsActionControlCount: 0,
  }),
  diagnostics: Object.freeze({
    schema: 'cf-v2-shipyard-diagnostics/v1',
    status: 'open',
    stateKey: 'ship:v1:fixture',
    activePreviewCount: 1,
    retainedPreviewCount: 0,
    pendingPreviewWork: 0,
    engineering: Object.freeze({
      schema: 'cf-v2-engineering-panel-diagnostics/v1',
      activeCount: 1,
      pendingWork: 0,
      actionControlCount: 0,
      activePreviewCount: 1,
      previewStateKey: 'ship:v1:fixture',
      retainedPreviewCount: 0,
      faultCount: 0,
    }),
  }),
});

describe('scene-memory terminal verifier', () => {
  const browserAuthority = Object.freeze({
    schema: SCENE_MEMORY_BROWSER_AUTHORITY_SCHEMA,
    scope: SCENE_MEMORY_BROWSER_AUTHORITY_SCOPE,
    family: 'microsoft-edge',
    protocolVersion: '1.3',
    capabilityContract: SCENE_MEMORY_BROWSER_CAPABILITY_CONTRACT,
    capabilityContractSha256: SCENE_MEMORY_BROWSER_CAPABILITY_CONTRACT_SHA256,
    profileContract: SCENE_MEMORY_BROWSER_PROFILE_CONTRACT,
    profileContractSha256: SCENE_MEMORY_BROWSER_PROFILE_CONTRACT_SHA256,
  });
  const browserProvenance = Object.freeze({
    executable: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    product: 'Edg/151.0.4129.101',
    revision: '@revision-101',
    userAgent: 'Mozilla/5.0 HeadlessChrome/151.0.0.0 Edg/151.0.0.0',
    jsVersion: '15.1.23.9',
    protocolVersion: '1.3',
  });

  function snapshotHarness(heaps: Array<Record<string, number>>, failGc = false) {
    const trace: string[] = [];
    let ticker = 10;
    let heapIndex = 0;
    const raw = structuredClone(retainedReports().at(-1)!.profiles.phone.measured[0].raw);
    const send = async (method: string) => {
      trace.push(method);
      if (method === 'Runtime.evaluate') {
        const before = ticker++;
        return { result: { value: {
          started: true, before, after: ticker++,
          documentTokenBefore: 'snapshot-test-document',
          documentTokenAfter: 'snapshot-test-document',
        } } };
      }
      if (method === 'Browser.getVersion') {
        return { product: 'Edg/152.0.4191.53', protocolVersion: '1.3' };
      }
      if (method === 'HeapProfiler.collectGarbage') {
        if (failGc) throw new Error('intentional GC control');
        return {};
      }
      if (method === 'Runtime.getHeapUsage') return heaps[heapIndex++]!;
      if (method === 'Memory.getDOMCounters') {
        return { documents: 1, nodes: 469, jsEventListeners: 70 };
      }
      throw new Error(`unexpected method ${method}`);
    };
    const collector = {
      evaluate: async () => {
        trace.push('carrier');
        const current = structuredClone(raw);
        current.state.tickerTicks = ticker;
        current.scene.documentToken = 'snapshot-test-document';
        return current;
      },
    };
    return { trace, send, collector };
  }

  function fixedEightHeaps(
    validity: Record<string, number>,
    scored: Record<string, number>,
    settling: Array<Record<string, number>> = [],
  ): Array<Record<string, number>> {
    return [
      ...Array.from({ length: 6 }, (_, index) => settling[index] ?? validity),
      validity,
      scored,
    ];
  }

  it('retains all eight fixed passes and scores pass eight whether it is higher or lower', async () => {
    const phaseThresholdBytes = 4 * 1024;
    const settle1 = { usedSize: 91_000, embedderHeapUsedSize: 82_000, backingStorageSize: 73_000 };
    const settle2 = { usedSize: 12_000, embedderHeapUsedSize: 23_000, backingStorageSize: 34_000 };
    const validity = { usedSize: 10_000, embedderHeapUsedSize: 20_000, backingStorageSize: 30_000 };
    const cases = [
      {
        name: 'higher',
        scored: { usedSize: 10_400, embedderHeapUsedSize: 20_400, backingStorageSize: 30_400 },
      },
      {
        name: 'lower',
        scored: { usedSize: 9_600, embedderHeapUsedSize: 19_600, backingStorageSize: 29_600 },
      },
    ] as const;
    const onePass = [
      'Runtime.evaluate', 'Browser.getVersion', 'HeapProfiler.collectGarbage',
      'Runtime.getHeapUsage', 'carrier', 'Memory.getDOMCounters',
    ];

    for (const control of cases) {
      const harness = snapshotHarness(fixedEightHeaps(
        validity, control.scored, [settle1, settle2],
      ));
      const snapshot = await sceneMemoryCollectFixedSnapshot({
        send: harness.send, sessionId: 'snapshot-session', collector: harness.collector,
        profile: 'phone', label: `phone-warm-${control.name}`,
        phaseThresholdBytes, stableResourcesRequired: true,
      });
      expect(harness.trace, control.name).toEqual(Array.from(
        { length: 8 }, () => onePass,
      ).flat());
      expect(snapshot.heapPhasePasses.map((pass: any) => pass.label), control.name).toEqual([
        `phone-warm-${control.name}-phase-settle-1`,
        `phone-warm-${control.name}-phase-settle-2`,
        `phone-warm-${control.name}-phase-settle-3`,
        `phone-warm-${control.name}-phase-settle-4`,
        `phone-warm-${control.name}-phase-settle-5`,
        `phone-warm-${control.name}-phase-settle-6`,
        `phone-warm-${control.name}-phase-validity`,
      ]);
      expect(snapshot.label, control.name).toBe(`phone-warm-${control.name}`);
      expect(snapshot.heapPhasePasses.map((pass: any) => pass.heap), control.name)
        .toEqual([settle1, settle2, validity, validity, validity, validity, validity]);
      expect(snapshot.heap, control.name).toEqual(control.scored);
      expect(snapshot.heapAggregateBytes, control.name).toBe(
        control.scored.usedSize + control.scored.embedderHeapUsedSize
          + control.scored.backingStorageSize,
      );
      expect(snapshot.heapPhaseValidity, control.name).toMatchObject({
        schema: 'cf-v2-scene-memory-heap-phase-validity/v2',
        status: 'valid',
        comparedPasses: [7, 8],
        scoredSnapshotPass: 8,
        maxAbsolutePhaseDeltaBytes: phaseThresholdBytes,
        deltas: {
          usedSize: 400,
          embedderHeapUsedSize: 400,
          backingStorageSize: 400,
          aggregate: 1_200,
        },
        reasons: [],
      });
      expect(sceneMemorySnapshotPhaseErrors(
        snapshot, true, phaseThresholdBytes,
      ), control.name).toEqual([]);
    }
  });

  it('accepts exact positive/negative component deltas and rejects threshold plus one', async () => {
    const phaseThresholdBytes = 4 * 1024;
    const base = {
      usedSize: 100_000,
      embedderHeapUsedSize: 200_000,
      backingStorageSize: 300_000,
    };
    const collect = async (field: keyof typeof base, delta: number, label: string) => {
      const scored = { ...base, [field]: base[field] + delta };
      const harness = snapshotHarness(fixedEightHeaps(base, scored));
      return sceneMemoryCollectFixedSnapshot({
        send: harness.send, sessionId: 'snapshot-session', collector: harness.collector,
        profile: 'desktop', label, phaseThresholdBytes, stableResourcesRequired: true,
      });
    };

    for (const field of [
      'usedSize', 'embedderHeapUsedSize', 'backingStorageSize',
    ] as const) {
      for (const sign of [-1, 1] as const) {
        const exact = await collect(
          field, sign * phaseThresholdBytes, `${field}-${sign}-exact`,
        );
        expect(exact.heapPhaseValidity.deltas[field], `${field}/${sign}/exact`)
          .toBe(phaseThresholdBytes);
        expect(exact.heapPhaseValidity.deltas.aggregate, `${field}/${sign}/aggregate-exact`)
          .toBe(phaseThresholdBytes);
        expect(sceneMemorySnapshotPhaseErrors(
          exact, true, phaseThresholdBytes,
        ), `${field}/${sign}/exact`).toEqual([]);

        const next = await collect(
          field, sign * (phaseThresholdBytes + 1), `${field}-${sign}-next`,
        );
        const errors = sceneMemorySnapshotPhaseErrors(next, true, phaseThresholdBytes);
        expect(next.heapPhaseValidity.status, `${field}/${sign}/next`).toBe('invalid');
        expect(errors, `${field}/${sign}/next`).toContain(
          `${field} absolute phase delta ${phaseThresholdBytes + 1} exceeded ceiling ${phaseThresholdBytes}`,
        );
        expect(errors, `${field}/${sign}/aggregate-next`).toContain(
          `aggregate absolute phase delta ${phaseThresholdBytes + 1} exceeded ceiling ${phaseThresholdBytes}`,
        );
      }
    }
  });

  it('controls aggregate exact/+1 in both directions and rejects component cancellation', async () => {
    const phaseThresholdBytes = 4 * 1024;
    const base = {
      usedSize: 100_000,
      embedderHeapUsedSize: 200_000,
      backingStorageSize: 300_000,
    };
    const collect = async (deltas: Record<keyof typeof base, number>, label: string) => {
      const scored = Object.fromEntries(Object.entries(base).map(([field, value]) => [
        field, value + deltas[field as keyof typeof base],
      ])) as typeof base;
      return sceneMemoryCollectFixedSnapshot({
        ...snapshotHarness(fixedEightHeaps(base, scored)),
        sessionId: 'snapshot-session', profile: 'desktop', label,
        phaseThresholdBytes, stableResourcesRequired: true,
      });
    };

    for (const sign of [-1, 1] as const) {
      const exact = await collect({
        usedSize: sign * 1_366,
        embedderHeapUsedSize: sign * 1_365,
        backingStorageSize: sign * 1_365,
      }, `aggregate-${sign}-exact`);
      expect(exact.heapPhaseValidity.deltas.aggregate, `${sign}/exact`).toBe(phaseThresholdBytes);
      expect(sceneMemorySnapshotPhaseErrors(
        exact, true, phaseThresholdBytes,
      ), `${sign}/exact`).toEqual([]);

      const next = await collect({
        usedSize: sign * 1_366,
        embedderHeapUsedSize: sign * 1_366,
        backingStorageSize: sign * 1_365,
      }, `aggregate-${sign}-next`);
      expect(next.heapPhaseValidity.deltas.aggregate, `${sign}/next`)
        .toBe(phaseThresholdBytes + 1);
      expect(sceneMemorySnapshotPhaseErrors(
        next, true, phaseThresholdBytes,
      ), `${sign}/next`).toEqual([
        `aggregate absolute phase delta ${phaseThresholdBytes + 1} exceeded ceiling ${phaseThresholdBytes}`,
      ]);
    }

    const cancelled = await collect({
      usedSize: phaseThresholdBytes + 1,
      embedderHeapUsedSize: -(phaseThresholdBytes + 1),
      backingStorageSize: 0,
    }, 'component-cancellation');
    expect(cancelled.heapPhaseValidity.deltas).toEqual({
      usedSize: phaseThresholdBytes + 1,
      embedderHeapUsedSize: phaseThresholdBytes + 1,
      backingStorageSize: 0,
      aggregate: 0,
    });
    expect(sceneMemorySnapshotPhaseErrors(
      cancelled, true, phaseThresholdBytes,
    )).toEqual([
      `usedSize absolute phase delta ${phaseThresholdBytes + 1} exceeded ceiling ${phaseThresholdBytes}`,
      `embedderHeapUsedSize absolute phase delta ${phaseThresholdBytes + 1} exceeded ceiling ${phaseThresholdBytes}`,
    ]);
  });

  it('projects only the three scored counters from extensible raw CDP heap evidence', () => {
    const projected = sceneMemoryInitialHeapProjection({
      usedSize: 100,
      totalSize: 1_000,
      embedderHeapUsedSize: 200,
      backingStorageSize: 300,
      futureHeapCounter: 4_000,
    });
    expect(projected).toEqual({
      usedSize: 100,
      embedderHeapUsedSize: 200,
      backingStorageSize: 300,
    });
    expect(Object.keys(projected).sort()).toEqual([
      'backingStorageSize', 'embedderHeapUsedSize', 'usedSize',
    ]);
    expect(projected).not.toHaveProperty('totalSize');
    expect(projected).not.toHaveProperty('futureHeapCounter');
  });

  it('keeps one snapshot pass in exact answerable-GC-heap-carrier-DOM order', async () => {
    const heap = { usedSize: 10, embedderHeapUsedSize: 20, backingStorageSize: 30 };
    const harness = snapshotHarness([heap]);
    const snapshot = await sceneMemoryCollectSnapshotPass({
      send: harness.send, sessionId: 'snapshot-session', collector: harness.collector,
      profile: 'desktop', label: 'desktop-pass',
    });
    expect(harness.trace).toEqual([
      'Runtime.evaluate', 'Browser.getVersion', 'HeapProfiler.collectGarbage',
      'Runtime.getHeapUsage', 'carrier', 'Memory.getDOMCounters',
    ]);
    expect(snapshot.heap).toEqual(heap);

    const failed = snapshotHarness([heap], true);
    await expect(sceneMemoryCollectSnapshotPass({
      send: failed.send, sessionId: 'snapshot-session', collector: failed.collector,
      profile: 'desktop', label: 'desktop-failed-pass',
    })).rejects.toThrow('intentional GC control');
    expect(failed.trace).toEqual([
      'Runtime.evaluate', 'Browser.getVersion', 'HeapProfiler.collectGarbage',
    ]);
  });

  it('rejects missing, reordered, detached, resource-drifted, or forged phase validity', async () => {
    const phaseThresholdBytes = 4 * 1024;
    const heap = { usedSize: 100_000, embedderHeapUsedSize: 200_000, backingStorageSize: 300_000 };
    const snapshot: any = structuredClone(await sceneMemoryCollectFixedSnapshot({
      ...snapshotHarness(fixedEightHeaps(heap, heap)),
      sessionId: 'snapshot-session', profile: 'phone', label: 'phone-warm-1',
      phaseThresholdBytes, stableResourcesRequired: true,
    }));
    expect(sceneMemorySnapshotPhaseErrors(snapshot, true, phaseThresholdBytes)).toEqual([]);

    const missingPasses = structuredClone(snapshot);
    delete missingPasses.heapPhasePasses;
    expect(sceneMemorySnapshotPhaseErrors(
      missingPasses, true, phaseThresholdBytes,
    )).toEqual(expect.arrayContaining([
      'heap phase pass inventory must contain exactly 8 fixed passes',
      'heap phase validity deltas are absent or invalid',
      'heap phase validity evidence is detached from the retained raw passes',
    ]));

    const missingValidity = structuredClone(snapshot);
    delete missingValidity.heapPhaseValidity;
    expect(sceneMemorySnapshotPhaseErrors(
      missingValidity, true, phaseThresholdBytes,
    )).toEqual(['heap phase validity evidence is detached from the retained raw passes']);

    const reordered = structuredClone(snapshot);
    reordered.heapPhasePasses.reverse();
    expect(sceneMemorySnapshotPhaseErrors(
      reordered, true, phaseThresholdBytes,
    )).toContain('heap phase pass order/labels are invalid');

    const missingInterior = structuredClone(snapshot);
    missingInterior.heapPhasePasses.splice(3, 1);
    expect(sceneMemorySnapshotPhaseErrors(
      missingInterior, true, phaseThresholdBytes,
    )).toContain('heap phase pass inventory must contain exactly 8 fixed passes');

    const wrongToken = structuredClone(snapshot);
    wrongToken.heapPhasePasses[0].answerability.token = snapshot.label;
    expect(sceneMemorySnapshotPhaseErrors(
      wrongToken, true, phaseThresholdBytes,
    )).toContain('heap phase pass 1 answerability target carrier is invalid');

    const detachedDocument = structuredClone(snapshot);
    detachedDocument.heapPhasePasses[1].raw.scene.documentToken = 'detached-document';
    expect(sceneMemorySnapshotPhaseErrors(
      detachedDocument, true, phaseThresholdBytes,
    )).toContain('heap phase pass 2 resource carrier is detached from answerability');

    const clonedValidity = structuredClone(snapshot);
    const retainedPasses = clonedValidity.heapPhasePasses;
    const retainedValidity = clonedValidity.heapPhaseValidity;
    Object.assign(clonedValidity, structuredClone(retainedPasses[6]));
    clonedValidity.label = snapshot.label;
    clonedValidity.answerability.token = snapshot.label;
    clonedValidity.heapPhasePasses = retainedPasses;
    clonedValidity.heapPhaseValidity = retainedValidity;
    expect(sceneMemorySnapshotPhaseErrors(
      clonedValidity, true, phaseThresholdBytes,
    )).toContain('heap phase ticker progression is invalid between passes 7 and 8');

    const detached = structuredClone(snapshot);
    detached.heapPhasePasses[6].heapAggregateBytes++;
    expect(sceneMemorySnapshotPhaseErrors(
      detached, true, phaseThresholdBytes,
    )).toEqual(expect.arrayContaining([
      'heap phase pass 7 heap aggregate is detached from raw counters',
      'heap phase validity deltas are absent or invalid',
      'heap phase validity evidence is detached from the retained raw passes',
    ]));

    const drifted = structuredClone(snapshot);
    drifted.heapPhasePasses[6].raw.compendium.artLive = { changed: true };
    expect(sceneMemorySnapshotPhaseErrors(
      drifted, true, phaseThresholdBytes,
    )).toContain('heap phase validity resource fingerprint drifted between passes 7 and 8');

    const forged = structuredClone(snapshot);
    forged.heap = {
      ...forged.heap,
      usedSize: forged.heap.usedSize + phaseThresholdBytes + 1,
    };
    forged.heapAggregateBytes += phaseThresholdBytes + 1;
    expect(forged.heapPhaseValidity.status).toBe('valid');
    expect(sceneMemorySnapshotPhaseErrors(
      forged, true, phaseThresholdBytes,
    )).toEqual(expect.arrayContaining([
      `usedSize absolute phase delta ${phaseThresholdBytes + 1} exceeded ceiling ${phaseThresholdBytes}`,
      `aggregate absolute phase delta ${phaseThresholdBytes + 1} exceeded ceiling ${phaseThresholdBytes}`,
      'heap phase validity evidence is detached from the retained raw passes',
    ]));
  });

  it('preserves the historical fixed-second pair oracle for retained evidence', () => {
    const snapshot: any = structuredClone(
      retainedReports().at(-1)!.profiles.phone.measured[0],
    );
    expect(sceneMemorySnapshotPairErrors(snapshot, true)).toEqual([]);
    expect(sceneMemorySnapshotPairErrors({})).toEqual(['heap phase probe is absent']);

    const reordered = structuredClone(snapshot);
    reordered.heapPhaseProbe.label = 'phone-warm-1';
    expect(sceneMemorySnapshotPairErrors(reordered, true)).toContain(
      'heap phase probe order/label is invalid',
    );
    const detached = structuredClone(snapshot);
    detached.heapAggregateBytes++;
    expect(sceneMemorySnapshotPairErrors(detached, true)).toContain(
      'scored snapshot heap aggregate is detached from raw counters',
    );
    const drifted = structuredClone(snapshot);
    drifted.heapPhaseProbe.dom.nodes++;
    expect(sceneMemorySnapshotPairErrors(drifted, true)).toContain(
      'heap phase resource fingerprint drifted between fixed passes',
    );
    for (const [label, mutate, expected] of [
      ['answerability', (value: any) => { delete value.heapPhaseProbe.answerability; },
        'heap phase probe answerability target carrier is invalid'],
      ['raw carrier', (value: any) => { delete value.heapPhaseProbe.raw.compendium; },
        'heap phase probe resource carrier is incomplete'],
      ['DOM carrier', (value: any) => { delete value.heapPhaseProbe.dom; },
        'heap phase probe DOM carrier is invalid'],
      ['Compendium resources', (value: any) => {
        value.heapPhaseProbe.raw.compendium.artLive = { changed: true };
      }, 'heap phase resource fingerprint drifted between fixed passes'],
      ['Compendium lazy work', (value: any) => {
        value.heapPhaseProbe.raw.compendium.lazyArt = { changed: true };
      }, 'heap phase resource fingerprint drifted between fixed passes'],
      ['route state', (value: any) => {
        value.heapPhaseProbe.raw.state.mode = 'different-route';
      }, 'heap phase resource fingerprint drifted between fixed passes'],
    ] as const) {
      const mutated = structuredClone(snapshot);
      mutate(mutated);
      expect(sceneMemorySnapshotPairErrors(mutated, true), label).toContain(expected);
    }
  });

  it('replays the immutable four-pass calibration red without relabelling it', () => {
    const report = JSON.parse(gunzipSync(readFileSync(fileURLToPath(new URL(
      HISTORICAL_FOUR_PASS_RED_FILE, import.meta.url,
    )))).toString('utf8'));
    expect(report).toMatchObject({
      schema: 'cf-v2-scene-memory-report/v5',
      status: 'instrument-fail',
      profiles: {
        phone: { schema: 'cf-v2-scene-memory-profile/v4' },
        desktop: { schema: 'cf-v2-scene-memory-profile/v4' },
      },
    });

    const phoneSnapshots = [
      report.profiles.phone.initial,
      ...report.profiles.phone.warmups,
      ...report.profiles.phone.measured,
      report.profiles.phone.bfcacheSnapshot,
    ];
    expect(phoneSnapshots).toHaveLength(10);
    phoneSnapshots.forEach((snapshot, index) => {
      expect(sceneMemorySnapshotHistoricalFourPassErrors(
        snapshot, index > 0, 65_536,
      ), `phone historical snapshot ${index + 1}`).toEqual([]);
    });

    expect(sceneMemorySnapshotHistoricalFourPassErrors(
      report.profiles.desktop.initial, false, 65_536,
    )).toEqual([
      'usedSize absolute phase delta 68472 exceeded ceiling 65536',
      'aggregate absolute phase delta 68472 exceeded ceiling 65536',
    ]);
    expect(report.profiles.desktop.initial.heapPhaseValidity).toMatchObject({
      schema: 'cf-v2-scene-memory-heap-phase-validity/v1',
      comparedPasses: [3, 4],
      scoredSnapshotPass: 4,
      deltas: { usedSize: 68_472, aggregate: 68_472 },
    });
  });

  it('replays the immutable fixed-eight red that removed SceneMemory from develop admission', () => {
    const compressed = readFileSync(fileURLToPath(new URL(
      FIXED_EIGHT_RED_FILE, import.meta.url,
    )));
    expect(compressed).toHaveLength(32_448);
    expect(createHash('sha256').update(compressed).digest('hex')).toBe(
      '702a6ca1ff8ae508f215aa961a946844f0095b7777ac67f6ec7ec6a9d3d0180f',
    );
    const raw = gunzipSync(compressed);
    expect(raw).toHaveLength(745_707);
    expect(createHash('sha256').update(raw).digest('hex')).toBe(
      'f4c5940efcd2deeea9ce7cbc68bb9e13022b889bf57e015d5c1bec04db4692a4',
    );
    const report = JSON.parse(raw.toString('utf8'));
    expect(report).toMatchObject({
      schema: 'cf-v2-scene-memory-report/v6',
      status: 'instrument-fail',
      runId: '20260830-pr35-fixedeight-cc15e1f-candidate1',
      lifecycle: { status: 'complete' },
      cleanup: { browser: true, server: true, workspaceLock: true },
      source: {
        begin: { commit: 'cc15e1f967f6644405cad7c3460cd8181b6a043f', state: 'committed' },
        end: { commit: 'cc15e1f967f6644405cad7c3460cd8181b6a043f', state: 'committed' },
      },
      policy: {
        attemptCount: 1,
        snapshotPasses: 8,
        settlingPasses: 6,
        validityPasses: [7, 8],
        scoredSnapshotPass: 8,
        automaticRetries: 0,
      },
      calibrationBoundary: {
        status: 'calibration-required',
        sha256: '5edac549b6ee0fa79afe5b6f282d68f0439c4385f0afe5d8f2ac58035d8eb96a',
      },
      contractInput: null,
      verdict: null,
      outcomes: [],
      browser: {
        executable: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
        product: 'Edg/152.0.4191.53',
        revision: '@4ee8983fdce2559a0ae8f8376934c5ed353035cd',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0',
        jsVersion: '15.2.23.6',
        protocolVersion: '1.3',
      },
      findings: [
        'phone phone-warm-1: fixed eighth snapshot phase is invalid (embedderHeapUsedSize absolute phase delta 287192 exceeded ceiling 65536; aggregate absolute phase delta 299720 exceeded ceiling 65536)',
      ],
      fatalEvents: [],
    });
    expect(report.profiles).not.toHaveProperty('desktop');
    const completed = [
      report.profiles.phone.initial,
      ...report.profiles.phone.warmups,
    ];
    expect(completed).toHaveLength(5);
    completed.forEach((snapshot, index) => {
      expect(sceneMemorySnapshotPhaseErrors(
        snapshot, index > 0, 65_536,
      ), `completed fixed-eight snapshot ${index + 1}`).toEqual([]);
    });
    expect(report.profiles.phone.measured).toHaveLength(1);
    expect(sceneMemorySnapshotPhaseErrors(
      report.profiles.phone.measured[0], true, 65_536,
    )).toEqual([
      'embedderHeapUsedSize absolute phase delta 287192 exceeded ceiling 65536',
      'aggregate absolute phase delta 299720 exceeded ceiling 65536',
    ]);
  });

  it('derives the next fixed phase threshold without widening beyond the hard cap', () => {
    for (const [maximum, threshold] of [
      [0, 4_096], [4_095, 4_096], [4_096, 8_192], [8_191, 8_192],
      [8_192, 16_384], [16_383, 16_384], [16_384, 32_768], [32_767, 32_768],
      [32_768, 65_536], [65_535, 65_536], [65_536, null],
    ] as const) {
      expect(sceneMemoryPhaseThresholdForMaximum(maximum), String(maximum)).toBe(threshold);
    }
    expect(() => sceneMemoryPhaseThresholdForMaximum(-1)).toThrow(
      'heap phase calibration maximum must be a nonnegative integer',
    );
    expect(() => sceneMemoryPhaseThresholdForMaximum(1.5)).toThrow(
      'heap phase calibration maximum must be a nonnegative integer',
    );
  });

  it('projects the maximum from exactly 10 retained profile snapshots', async () => {
    const phaseThresholdBytes = 4 * 1024;
    const base = { usedSize: 100_000, embedderHeapUsedSize: 200_000, backingStorageSize: 300_000 };
    const snapshots = [];
    for (let index = 0; index < 10; index++) {
      const scored = {
        ...base,
        embedderHeapUsedSize: base.embedderHeapUsedSize + (index + 1) * 31,
      };
      snapshots.push(await sceneMemoryCollectFixedSnapshot({
        ...snapshotHarness(fixedEightHeaps(base, scored)),
        sessionId: 'snapshot-session', profile: 'desktop', label: `desktop-phase-${index}`,
        phaseThresholdBytes, stableResourcesRequired: true,
      }));
    }
    const measurement = {
      initial: snapshots[0],
      warmups: snapshots.slice(1, 5),
      measured: snapshots.slice(5, 9),
      bfcacheSnapshot: snapshots[9],
    };
    const maximum = sceneMemoryProfilePhaseMaximum(measurement);
    expect(maximum).toMatchObject({
      snapshotCount: 10,
      fieldCount: 4,
      maximumBytes: 310,
    });
    expect(maximum.deltas).toHaveLength(10);
    expect(maximum.deltas.at(-1)).toEqual({
      usedSize: 0,
      embedderHeapUsedSize: 310,
      backingStorageSize: 0,
      aggregate: 310,
    });
    expect(() => sceneMemoryProfilePhaseMaximum({
      ...measurement, warmups: measurement.warmups.slice(1),
    })).toThrow('heap phase calibration profile must retain exactly 10 snapshots');
  });

  it('keeps genuine 512 KiB/cycle retained growth visible in all eight fixed lanes', () => {
    const retainedPerCycle = 512 * 1024;
    const snapshot = (cycle: number) => {
      const lanes = [10_000, 20_000, 30_000, 40_000, 50_000, 60_000, 70_000, 80_000]
        .map((offset) => offset + cycle * retainedPerCycle);
      return {
        heapPhasePasses: lanes.slice(0, 7).map((backingStorageSize) => ({
          heap: { backingStorageSize },
        })),
        heap: { backingStorageSize: lanes[7] },
      };
    };
    const snapshots = [1, 2, 3, 4].map(snapshot);
    expect(sceneMemoryHeapPhaseControlSlopes(snapshots)).toEqual({
      pass1: retainedPerCycle,
      pass2: retainedPerCycle,
      pass3: retainedPerCycle,
      pass4: retainedPerCycle,
      pass5: retainedPerCycle,
      pass6: retainedPerCycle,
      pass7: retainedPerCycle,
      pass8: retainedPerCycle,
    });
    expect(() => sceneMemoryHeapPhaseControlSlopes([
      snapshot(1), snapshot(2), snapshot(3),
    ])).toThrow('heap phase control requires four fixed retained-growth cycles');
    const invalid = structuredClone(snapshots);
    invalid[3]!.heap.backingStorageSize = Number.NaN;
    expect(() => sceneMemoryHeapPhaseControlSlopes(invalid))
      .toThrow('heap phase control pass 8 backing sample is invalid');
  });

  it('attempts each exact profile once and never reinvokes after a failure', async () => {
    const calls: string[] = [];
    const measurements = await sceneMemoryCollectProfilesOnce(async (profile, viewport) => {
      calls.push(profile);
      return viewport.width;
    });
    expect(calls).toEqual(['phone', 'desktop']);
    expect(measurements).toEqual({ phone: 390, desktop: 1280 });

    for (const [failedProfile, expectedCalls] of [
      ['phone', ['phone']],
      ['desktop', ['phone', 'desktop']],
    ] as const) {
      const failedCalls: string[] = [];
      await expect(sceneMemoryCollectProfilesOnce(async (profile) => {
        failedCalls.push(profile);
        if (profile === failedProfile) throw new Error(`terminal ${profile} fault`);
        return profile;
      })).rejects.toThrow(`terminal ${failedProfile} fault`);
      expect(failedCalls, failedProfile).toEqual(expectedCalls);
    }
  });

  it('binds runGate to one one-shot owner and one collector call per profile', () => {
    expect(profileAttemptBindingErrors(collectorSource)).toEqual([]);
    for (const token of [
      'await sceneMemoryCollectProfilesOnce(async (profile, viewport) => {',
      'const measurement = await collectProfile({',
    ]) {
      const start = collectorSource.indexOf('async function runGate(options)');
      const end = collectorSource.indexOf('\nfunction surfaceInventoryFromObservation(', start);
      const owner = collectorSource.slice(start, end);
      const duplicated = collectorSource.slice(0, start)
        + owner.replace(token, `${token}\n      ${token}`)
        + collectorSource.slice(end);
      expect(duplicated, token).not.toBe(collectorSource);
      expect(profileAttemptBindingErrors(duplicated), token).toContain(token);
    }
  });

  it('stages every invalid phase carrier before a plain pre-contract instrument stop', () => {
    expect(phaseInvalidityStagingErrors(collectorSource)).toEqual([]);
    const swapped = collectorSource.replace(
      'onProgress(measurement);\n    assertSceneMemoryHeapPhaseSnapshot(',
      'assertSceneMemoryHeapPhaseSnapshot(\n    onProgress(measurement);',
    );
    expect(swapped).not.toBe(collectorSource);
    expect(phaseInvalidityStagingErrors(swapped)).toContain(
      'initial phase evidence is not staged before its instrument assertion',
    );
    const productRed = collectorSource.replace(
      'assert(errors.length === 0,\n    `${profile} ${label}: fixed eighth snapshot phase is invalid',
      'productAssert(errors.length === 0,\n    `${profile} ${label}: fixed eighth snapshot phase is invalid',
    );
    expect(productRed).not.toBe(collectorSource);
    expect(phaseInvalidityStagingErrors(productRed)).toContain(
      'phase invalidity is not a plain instrument assertion',
    );
  });

  it('requires calibration-required at the tracked source commit and binds its exact blob', () => {
    expect(calibrationBoundaryBindingErrors(collectorSource)).toEqual([]);
    const activeCalibration = collectorSource.replace(
      "assert(boundaryBudget.status === 'calibration-required',",
      "assert(boundaryBudget.status === 'active',",
    );
    expect(activeCalibration).not.toBe(collectorSource);
    expect(calibrationBoundaryBindingErrors(activeCalibration)).toContain(
      "assert(boundaryBudget.status === 'calibration-required',",
    );

    const detachedCommit = collectorSource.replace(
      "'show', `${report.source.begin.commit}:${CALIBRATION_BUDGET_RELATIVE_PATH}`",
      "'show', `HEAD:${CALIBRATION_BUDGET_RELATIVE_PATH}`",
    );
    expect(detachedCommit).not.toBe(collectorSource);
    expect(calibrationBoundaryBindingErrors(detachedCommit)).toContain(
      "'show', `${report.source.begin.commit}:${CALIBRATION_BUDGET_RELATIVE_PATH}`",
    );
  });

  it('keeps the protected veteran baseline exact except for the existing null view seat', () => {
    const expected = { ...structuredClone(baselineVeteran), view: null };
    const raw = sceneMemoryVeteranRaw();
    const measurement = JSON.parse(raw) as Record<string, unknown>;
    expect(Object.keys(measurement)).toEqual(Object.keys(expected));
    expect(measurement).toEqual(expected);
    expect(raw).toBe(JSON.stringify(expected));
    expect(measurement).toMatchObject({
      view: null,
      tut: 1,
      mx: [[201, 4]],
      minedw: [[201, 1_753_898_800_000]],
      skx: [[424242, 2]],
      tech: ['scan1', 'hull1', 'nope'],
    });
    expect(measurement.log).toEqual(baselineVeteran.log);
    expect(measurement.items).toEqual(baselineVeteran.items);
    expect(measurement.eq).toEqual(baselineVeteran.eq);
  });

  it('accepts one complete field-level Shipyard settlement observation', () => {
    expect(sceneMemoryShipyardOpenSettlementReasons(settledShipyardOpenObservation)).toEqual([]);
    expect(settledShipyardOpenObservation.arc3).toEqual({
      stateKind: 'unavailable',
      protection: 'legacy-refused:legacy-seed-missing',
      bootstrapPending: false,
      bootstrapCandidateReady: false,
    });
    expect(settledShipyardOpenObservation.presentation).toMatchObject({
      state: 'unavailable',
      actionControlCount: 0,
      diagnosticsActionControlCount: 0,
    });
  });

  it('negative controls: every single unsettled Shipyard field reports its own reason', () => {
    const controls: Array<readonly [string, (value: any) => void]> = [
      ['observationSchema', (value) => { value.schema = 'wrong'; }],
      ['panelOpen', (value) => { value.panelOpen = null; }],
      ['arc3StateKind', (value) => { value.arc3.stateKind = 'loaded'; }],
      ['arc3Protection', (value) => { value.arc3.protection = null; }],
      ['arc3BootstrapPending', (value) => { value.arc3.bootstrapPending = true; }],
      ['arc3BootstrapCandidateReady', (value) => {
        value.arc3.bootstrapCandidateReady = true;
      }],
      ['presentationState', (value) => { value.presentation.state = null; }],
      ['presentationUnavailableReason', (value) => {
        value.presentation.unavailableReason = 'wrong';
      }],
      ['presentationActionControlCount', (value) => {
        value.presentation.actionControlCount = 1;
      }],
      ['presentationDiagnosticsActionControlCount', (value) => {
        value.presentation.diagnosticsActionControlCount = 1;
      }],
      ['shipVisualStateKey', (value) => { value.shipVisualStateKey = null; }],
      ['domPreviewCount', (value) => { value.domPreviewCount = 0; }],
      ['stateKeyAgreement', (value) => { value.domStateKey = 'wrong'; }],
      ['stateKeyAgreement', (value) => { value.diagnostics.stateKey = 'wrong'; }],
      ['diagnosticsSchema', (value) => { value.diagnostics.schema = 'wrong'; }],
      ['diagnosticsStatus', (value) => { value.diagnostics.status = 'closed'; }],
      ['diagnosticsActivePreviewCount', (value) => {
        value.diagnostics.activePreviewCount = 0;
      }],
      ['diagnosticsRetainedPreviewCount', (value) => {
        value.diagnostics.retainedPreviewCount = 1;
      }],
      ['diagnosticsPendingPreviewWork', (value) => {
        value.diagnostics.pendingPreviewWork = 1;
      }],
      ['panelDiagnosticsSchema', (value) => {
        value.diagnostics.engineering.schema = 'wrong';
      }],
      ['panelDiagnosticsActiveCount', (value) => {
        value.diagnostics.engineering.activeCount = 0;
      }],
      ['panelDiagnosticsPendingWork', (value) => {
        value.diagnostics.engineering.pendingWork = 1;
      }],
      ['panelDiagnosticsActionControlCount', (value) => {
        value.diagnostics.engineering.actionControlCount = 1;
      }],
      ['panelDiagnosticsActivePreviewCount', (value) => {
        value.diagnostics.engineering.activePreviewCount = 0;
      }],
      ['panelDiagnosticsPreviewStateKey', (value) => {
        value.diagnostics.engineering.previewStateKey = 'wrong';
      }],
      ['panelDiagnosticsRetainedPreviewCount', (value) => {
        value.diagnostics.engineering.retainedPreviewCount = 1;
      }],
      ['panelDiagnosticsFaultCount', (value) => {
        value.diagnostics.engineering.faultCount = 1;
      }],
    ];
    for (const [reason, mutate] of controls) {
      const value = structuredClone(settledShipyardOpenObservation);
      mutate(value);
      expect(sceneMemoryShipyardOpenSettlementReasons(value), reason).toEqual([reason]);
    }
  });

  it('accepts Edge point-version drift under one capability/profile authority', () => {
    for (const [product, revision, jsVersion] of [
      ['Edg/151.0.4129.101', '@revision-101', '15.1.23.9'],
      ['Edg/151.0.4129.107', '@revision-107', '15.1.23.12'],
      ['Edg/999.8.7.6', '@future-revision', '99.8.7'],
    ]) {
      const observed = { ...browserProvenance, product, revision, jsVersion };
      expect(sceneMemoryBrowserAuthorityMatches(observed, browserAuthority), product).toBe(true);
      expect(reportBrowserAuthorityErrors(observed, browserAuthority), product).toEqual([]);
    }
  });

  it('negative controls: wrong family, protocol, and incomplete provenance cannot bind', () => {
    expect(reportBrowserAuthorityErrors(null, browserAuthority)).toEqual([
      'terminal report browser authority is missing',
    ]);
    expect(reportBrowserAuthorityErrors({
      ...browserProvenance, product: 'Chrome/151.0.4129.107',
    }, browserAuthority)).toEqual([
      'terminal report browser family is not Microsoft Edge',
    ]);
    expect(reportBrowserAuthorityErrors({
      ...browserProvenance, protocolVersion: '1.2',
    }, browserAuthority)).toEqual([
      'terminal report browser protocol does not match the SceneMemory contract',
    ]);
    for (const field of ['executable', 'revision', 'userAgent', 'jsVersion'] as const) {
      const incomplete = { ...browserProvenance, [field]: '' };
      expect(reportBrowserAuthorityErrors(incomplete, browserAuthority), field).toEqual([
        'terminal report browser authority is incomplete',
      ]);
    }
    expect(reportBrowserAuthorityErrors({
      ...browserProvenance, executable: 'relative/msedge',
    }, browserAuthority)).toEqual([
      'terminal report browser authority is incomplete',
    ]);
  });

  it('binds every required CDP domain and capability to the collector', () => {
    expect(sceneMemoryBrowserCapabilityInventoryErrors({
      collectorSource, browserCdpSource,
    })).toEqual([]);
  });

  it('negative control: a missing capability or provenance command turns the inventory red', () => {
    const missingMemory = collectorSource.replace(
      "send('Memory.getDOMCounters'",
      "send('Memory.getDOMCountersMissing'",
    );
    expect(missingMemory).not.toBe(collectorSource);
    expect(sceneMemoryBrowserCapabilityInventoryErrors({
      collectorSource: missingMemory, browserCdpSource,
    })).toContain('SceneMemory collector capability inventory is missing Memory.getDOMCounters');
    for (const method of ['Runtime.enable', 'HeapProfiler.enable']) {
      const productionEnable = collectorSource.replace(
        "['Runtime.enable', 'Page.enable', 'HeapProfiler.enable', 'Log.enable']",
        "['Page.enable', 'Log.enable']",
      );
      expect(productionEnable, method).not.toBe(collectorSource);
      expect(sceneMemoryBrowserCapabilityInventoryErrors({
        collectorSource: productionEnable, browserCdpSource,
      }).join('; '), method).toContain(method);
    }
    const missingVersion = browserCdpSource.replace("send('Browser.getVersion')", "send('Browser.versionMissing')");
    expect(missingVersion).not.toBe(browserCdpSource);
    expect(sceneMemoryBrowserCapabilityInventoryErrors({
      collectorSource, browserCdpSource: missingVersion,
    })).toContain('SceneMemory browser transport lacks Browser.getVersion provenance');
  });

  it('binds the live heap-phase control to Edge authority and cleanup before PASS', () => {
    const bindings = [
      'assert(sceneMemoryBrowserAuthority(controlBrowser) !== null,',
      "if (closed?.success !== true) cleanupErrors.push('Target.closeTarget did not confirm success');",
      'if (cleanupErrors.length) {',
      'if (primaryError) throw primaryError;',
      'SCENE MEMORY HEAP PHASE SELFTEST: PASS',
    ];
    for (const binding of bindings) expect(collectorSource, binding).toContain(binding);
    expect(collectorSource.indexOf('if (primaryError) throw primaryError;')).toBeLessThan(
      collectorSource.indexOf('SCENE MEMORY HEAP PHASE SELFTEST: PASS'),
    );
    for (const binding of bindings.slice(0, 2)) {
      const missing = collectorSource.replace(binding, '/* removed by mutation control */');
      expect(missing, binding).not.toBe(collectorSource);
      expect(missing, binding).not.toContain(binding);
    }
  });

  it('negative control: a swapped or drifted device profile cannot verify', () => {
    const report = structuredClone(retainedReports()[0]!);
    expect(terminalProfileEvidenceErrors(report.profiles)).toEqual([]);
    report.profiles.phone.viewport.dpr = 2;
    expect(terminalProfileEvidenceErrors(report.profiles)).toContain(
      'phone terminal profile evidence is incomplete, mismatched, or red',
    );
    report.profiles.phone.viewport.dpr = 3;
    report.profiles.desktop.profile = 'phone';
    expect(terminalProfileEvidenceErrors(report.profiles)).toContain(
      'desktop terminal profile evidence is incomplete, mismatched, or red',
    );
  });

  it('fails closed instead of throwing when a current profile is absent', () => {
    expect(() => terminalProfileEvidenceErrors({}, true)).not.toThrow();
    expect(terminalProfileEvidenceErrors({}, true)).toContain(
      'phone surface vista evidence is incomplete',
    );
  });

  it('requires exact empty fatal-event and finding inventories for PASS', () => {
    expect(terminalPassEvidenceErrors([], [])).toEqual([]);
  });

  it('negative control: missing, null, or nonempty terminal evidence cannot be laundered', () => {
    expect(terminalPassEvidenceErrors(undefined, null)).toEqual([
      'terminal fatal-event inventory must be an exact empty array',
      'terminal finding inventory must be an exact empty array',
    ]);
    expect(terminalPassEvidenceErrors([{ method: 'Runtime.exceptionThrown' }], ['fatal'])).toEqual([
      'terminal fatal-event inventory must be an exact empty array',
      'terminal finding inventory must be an exact empty array',
    ]);
  });

  it('requires one unchanged committed source identity through verification', () => {
    const committed = Object.freeze({
      commit: 'a'.repeat(40),
      branch: 'openai/mac',
      state: 'committed',
      statusSha256: 'b'.repeat(64),
      workingTreeSha256: 'c'.repeat(64),
    });
    expect(terminalSourceAuthorityErrors(committed, committed, committed)).toEqual([]);
  });

  it('negative control: a dirty diagnostic cannot be relabeled PASS', () => {
    const dirty = Object.freeze({
      commit: 'a'.repeat(40),
      branch: 'openai/mac',
      state: 'dirty-diagnostic',
      statusSha256: 'b'.repeat(64),
      workingTreeSha256: 'c'.repeat(64),
    });
    expect(terminalSourceAuthorityErrors(dirty, dirty, dirty)).toEqual([
      'terminal source authority must be committed and clean',
    ]);
  });

  it('binds the terminal outcome inventory byte-for-byte to contract replay', () => {
    const canonical = Array.from({ length: 44 }, (_, index) => ({
      id: `outcome-${index}`,
      pass: true,
      message: `canonical-${index}`,
    }));
    expect(terminalOutcomeInventoryErrors(canonical, structuredClone(canonical))).toEqual([]);
  });

  it('negative control: a count-consistent missing ID and duplicate cannot verify', () => {
    const canonical = Array.from({ length: 44 }, (_, index) => ({
      id: `outcome-${index}`,
      pass: true,
      message: `canonical-${index}`,
    }));
    const tampered = structuredClone(canonical);
    tampered[17] = structuredClone(tampered[16]!);
    expect(tampered).toHaveLength(44);
    expect(tampered.every((outcome) => outcome.pass)).toBe(true);
    expect(terminalOutcomeInventoryErrors(tampered, canonical)).toEqual([
      'terminal outcome inventory differs from the imported contract replay',
    ]);
  });

  it('re-derives every retained SceneMemory contract point from raw observations', () => {
    for (const report of retainedReports()) {
      expect(rawDerivedProjectionErrors(report), report.runId).toEqual([]);
    }
  });

  it('fails closed when current raw surface-vista evidence is absent', () => {
    expect(sceneMemoryProfileRawBindingErrors({})).toEqual([
      'initial vista evidence is detached from its raw snapshot',
      'precondition is detached from its raw warmup snapshot',
      'surface vista observation inventory is incomplete',
      'measured snapshot inventory is incomplete',
      'bfcache raw snapshot is absent',
    ]);
  });

  it('negative control: a cycle cannot be detached from unchanged retained raw evidence', () => {
    const report = structuredClone(retainedReports().at(-1)!);
    const rawBefore = structuredClone(report.profiles.phone.measured[0]);
    report.profiles.phone.cycles[0].managedTextureCount++;
    expect(report.profiles.phone.measured[0]).toEqual(rawBefore);
    expect(rawDerivedProjectionErrors(report)).toEqual([
      'phone cycle 1 is detached from retained raw evidence',
    ]);
  });

  it('constructs genuine current fixed-eight evidence before verifier mutations', () => {
    const report = currentReportFixture();
    expect(terminalProfileEvidenceErrors(
      report.profiles, true, false, true, true,
    )).toEqual([]);
    for (const profile of ['phone', 'desktop'] as const) {
      const measurement = report.profiles[profile];
      expect(sceneMemoryProfileRawBindingErrors(measurement), profile).toEqual([]);
      const snapshots = [
        measurement.initial,
        ...measurement.warmups,
        ...measurement.measured,
        measurement.bfcacheSnapshot,
      ];
      expect(snapshots).toHaveLength(10);
      snapshots.forEach((snapshot: any, index: number) => {
        expect(sceneMemorySnapshotPhaseErrors(
          snapshot, index > 0 && index < 9, 65_536,
        ), `${profile} snapshot ${index + 1}`).toEqual([]);
      });
    }
    expect(report.contractInput.schema).toBe('cf-v2-scene-memory-input/v6');
    expect(report.verdict).toMatchObject({
      schema: 'cf-v2-scene-memory-verdict/v5',
      status: 'pass',
      failures: [],
    });
    expect(report.outcomes).toHaveLength(44);
  });

  it('negative control: the v6 initial baseline cannot detach from its scored raw snapshot', () => {
    const report = currentReportFixture();

    const baseline = verifyReport(report, report.runId, { budgetFile: budgetPath });
    expect(baseline.errors).not.toContain(
      'contract input is detached from the collected profile evidence',
    );

    report.contractInput.profiles.phone.initial.heap = {
      ...report.contractInput.profiles.phone.initial.heap,
      usedSize: report.contractInput.profiles.phone.initial.heap.usedSize + 1,
    };
    const detached = verifyReport(report, report.runId, { budgetFile: budgetPath });
    expect(detached.errors).toContain(
      'contract input is detached from the collected profile evidence',
    );
  });

  it('negative control: a cross-profile initial snapshot cannot launder v6 growth', () => {
    const report = currentReportFixture();
    report.profiles.phone.initial = structuredClone(report.profiles.desktop.initial);
    report.profiles.phone.metrics = sceneMemoryMetricSummary(report.profiles.phone);
    bindCurrentContract(report);

    const result = verifyReport(report, report.runId, { budgetFile: budgetPath });
    expect(result.errors).toContain('phone initial snapshot label/profile drifted');
    expect(result.errors).toContain('phone initial snapshot document identity drifted');
    expect(result.errors).toContain('imported contract verdict is stale or red');
  });

  it('negative control: a same-profile warmup cannot masquerade as the initial snapshot', () => {
    const report = currentReportFixture();
    report.profiles.phone.initial = structuredClone(report.profiles.phone.warmups[0]);
    report.profiles.phone.metrics = sceneMemoryMetricSummary(report.profiles.phone);
    bindCurrentContract(report);

    const result = verifyReport(report, report.runId, { budgetFile: budgetPath });
    expect(result.errors).toContain('phone initial snapshot label/profile drifted');
  });

  it('negative control: profile-v3 normalized metrics are re-derived from raw evidence', () => {
    const report = currentReportFixture();
    report.profiles.phone.metrics = {
      ...report.profiles.phone.metrics,
      heapUsedGrowthBytesMax: report.profiles.phone.metrics.heapUsedGrowthBytesMax + 1,
    };

    const result = verifyReport(report, report.runId, { budgetFile: budgetPath });
    expect(result.errors).toContain(
      'phone normalized metric summary is detached from retained profile evidence',
    );
  });

  it('rejects a PASS-shaped report whose budget certification was laundered', () => {
    const result = verifyReport({
      schema: 'cf-v2-scene-memory-report/v2',
      runId: 'tampered-certification',
      status: 'pass',
      certification: 'bogus',
      inputs: { budget: null },
    }, 'tampered-certification', { budgetFile: null });

    expect(result.ok).toBe(false);
    expect(result.errors).toContain('report certification must be contract-budget');
    expect(result.errors).toContain(
      'terminal certification requires the current source-normalized input contract',
    );
    expect(result.errors).toContain('verification requires the same tracked --budget');
  });

  it('rejects a PASS-shaped report that does not score the fixed eighth snapshot pass', () => {
    const result = verifyReport({
      schema: 'cf-v2-scene-memory-report/v6',
      runId: 'tampered-fixed-eighth-policy',
      status: 'pass',
      lifecycle: { schema: 'cf-v2-scene-memory-report-lifecycle/v1', status: 'complete' },
      policy: {
        attemptCount: 1, automaticRetries: 0, warmupCycles: 4, measuredWarmCycles: 4,
        snapshotPasses: 8, settlingPasses: 6, validityPasses: [7, 8],
        scoredSnapshotPass: 7,
      },
      certification: 'contract-budget',
      cleanup: { browser: true, server: true, workspaceLock: true },
      inputs: { budget: null },
    }, 'tampered-fixed-eighth-policy', { budgetFile: null });
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('one-attempt/warm-cycle/fixed-eighth phase policy drifted');
  });

  it('binds every Arc 1C product source into exact budget authority', () => {
    expect(productAuthorityBindingErrors(collectorSource)).toEqual([]);
  });

  it('negative controls: stale or aliased product authority cannot stay green', () => {
    const omitted = collectorSource.replace(
      'shipVisualState: hashFile(shipVisualStatePath),',
      '',
    );
    expect(omitted).not.toBe(collectorSource);
    expect(productAuthorityBindingErrors(omitted)).toContain(
      'shipVisualState exact input binding',
    );

    const aliased = collectorSource.replace(
      'shipyardPreview: hashFile(shipyardPreviewPath),',
      'shipyardPreview: hashFile(gameMainPath),',
    );
    expect(aliased).not.toBe(collectorSource);
    expect(productAuthorityBindingErrors(aliased)).toContain(
      'shipyardPreview exact input binding',
    );

    const missingAuthorityField = collectorSource.replace("'gameHtml', 'gameMain',", "'gameMain',");
    expect(missingAuthorityField).not.toBe(collectorSource);
    expect(productAuthorityBindingErrors(missingAuthorityField)).toContain(
      'gameHtml authority field',
    );
  });

  it('binds the full deterministic built graph into run, budget, and verifier authority', () => {
    expect(buildGraphAuthorityBindingErrors(collectorSource)).toEqual([]);
  });

  it('negative control: selected source leaves cannot replace transitive build authority', () => {
    const leafOnly = collectorSource
      .replace("'package', 'packageLock', 'appPackage', 'buildDist', 'gameHtml', 'gameMain'",
        "'package', 'packageLock', 'appPackage', 'gameHtml', 'gameMain'")
      .replace('buildDist: buildSha256,', '')
      .replace('inputs = exactInputs(fixture, authoritativeBudgetFile, build.sha256);',
        'inputs = exactInputs(fixture, authoritativeBudgetFile);')
      .replace('const currentBuild = distIdentity();', 'const currentBuild = report.build;')
      .replace("if (!same(report?.build, currentBuild)) errors.push('built product graph authority drifted');", '')
      .replace('exactInputs(fixture, authoritativeBudgetFile, currentBuild.sha256)',
        'exactInputs(fixture, authoritativeBudgetFile)');
    expect(leafOnly).not.toBe(collectorSource);
    expect(buildGraphAuthorityBindingErrors(leafOnly)).toHaveLength(6);
  });

  it('uses the visible Shipyard opener and owned close in the exact seven-route collector', () => {
    expect(shipyardRouteBindingErrors(collectorSource)).toEqual([]);
  });

  it('negative control: removing the real Shipyard opener is detected', () => {
    const bypassed = collectorSource.replace(
      "'#dockshipyard,#railshipyard', 'open Shipyard'",
      "'#shipyardpanel', 'open Shipyard'",
    );
    expect(bypassed).not.toBe(collectorSource);
    expect(shipyardRouteBindingErrors(bypassed)).toContain(
      "'#dockshipyard,#railshipyard', 'open Shipyard'",
    );
  });

  it('negative control: dropping protected Engineering observation context is detected', () => {
    const missingContext = collectorSource.replace(
      "unavailable=document.querySelector('#shipyardpanel [data-engineering-state]')",
      "unavailable=null",
    );
    expect(missingContext).not.toBe(collectorSource);
    expect(shipyardRouteBindingErrors(missingContext)).toContain(
      "unavailable=document.querySelector('#shipyardpanel [data-engineering-state]')",
    );
  });

  it('captures a rejected Earth Landing and bounded failure state in one browser task', () => {
    expect(landingRejectionEvidenceBindingErrors(collectorSource)).toEqual([]);
  });

  it('negative controls: split evidence, held reload, and a missing convergence assertion turn red', () => {
    const split = collectorSource.replace(
      'const state = api?.state?.() ?? null;',
      'const state = null; /* mutation control loses the rejected document */',
    );
    expect(split).not.toBe(collectorSource);
    expect(landingRejectionEvidenceBindingErrors(split)).toContain(
      'const state = api?.state?.() ?? null;',
    );
    const held = collectorSource.replace(
      'const accepted = await api.landOn(',
      'api.__smokeArmF4ConvergenceReloadHold();\n    const accepted = await api.landOn(',
    );
    expect(held).not.toBe(collectorSource);
    expect(landingRejectionEvidenceBindingErrors(held)).toContain(
      'SceneMemory suppresses the production convergence reload',
    );
    const convergenceBlind = collectorSource.replace(
      '&& landAttempt?.evidence?.persistence?.convergenceReloadScheduled === false',
      '',
    );
    expect(convergenceBlind).not.toBe(collectorSource);
    expect(landingRejectionEvidenceBindingErrors(convergenceBlind)).toContain(
      'landAttempt?.evidence?.persistence?.convergenceReloadScheduled === false',
    );
  });

  it('waits for the published surface tier after pending HD work clears', () => {
    expect(surfaceTierSettlementBindingErrors(collectorSource)).toEqual([]);
  });

  it('binds the current report/profile/input schemas and scored initial heap projection', () => {
    expect(sourceNormalizedHeapBindingErrors(collectorSource)).toEqual([]);
  });

  it('negative control: no source-normalized schema, metric, or baseline binding is decorative', () => {
    const bindings = [
      "const REPORT_SCHEMA = 'cf-v2-scene-memory-report/v6';",
      "const BUDGET_SCHEMA = 'cf-v2-scene-memory-budget/v7';",
      "const PROFILE_SCHEMA = 'cf-v2-scene-memory-profile/v5';",
      "schema: 'cf-v2-scene-memory-input/v6'",
      'documentToken: measurement.initial.raw.scene.documentToken,',
      'export function sceneMemoryInitialHeapProjection(heap) {',
      'heap: sceneMemoryInitialHeapProjection(measurement.initial.heap),',
      'initialHeapUsedBytesMax: initialHeapUsed',
      'initialHeapAggregateBytesMax: initialHeapUsed',
      'heapUsedGrowthBytesMax: max(heapGrowth)',
      'heapNormalizedWorkingSetBytesMax: max((point) => heapGrowth(point)',
      'terminal certification requires the current source-normalized input contract',
    ];
    for (const binding of bindings) {
      const missing = collectorSource.replaceAll(binding, '/* removed by mutation control */');
      expect(missing, binding).not.toBe(collectorSource);
      expect(sourceNormalizedHeapBindingErrors(missing), binding).toContain(binding);
    }
  });

  it('fails a surface settlement immediately with the bounded worker cause', () => {
    expect(sceneMemorySurfaceVistaFaultReasons({
      surfaceVistaFaults: 0,
      surfaceVistaLastError: null,
    })).toEqual([]);
    expect(sceneMemorySurfaceVistaFaultReasons({
      surfaceVistaFaults: 1,
      surfaceVistaLastError: 'worker rendering failed exactly',
    })).toEqual(['surface vista fault (1): worker rendering failed exactly']);
    for (const malformed of [
      {},
      { surfaceVistaFaults: '0', surfaceVistaLastError: null },
      { surfaceVistaFaults: -1, surfaceVistaLastError: null },
    ]) {
      expect(sceneMemorySurfaceVistaFaultReasons(malformed)).toEqual([
        'surface vista fault diagnostics are missing or invalid',
      ]);
    }
    expect(sceneMemorySurfaceVistaFaultReasons({
      surfaceVistaFaults: 0,
      surfaceVistaLastError: 'orphaned failure detail',
    })).toEqual(['surface vista fault diagnostics are inconsistent']);
  });

  it('negative control: removing the surface worker terminal-fault predicate turns red', () => {
    const missingTerminal = collectorSource.replace(
      '(value) => sceneMemorySurfaceVistaFaultReasons(value).length > 0',
      '() => false',
    );
    expect(missingTerminal).not.toBe(collectorSource);
    expect(surfaceTierSettlementBindingErrors(missingTerminal)).toContain(
      '(value) => sceneMemorySurfaceVistaFaultReasons(value).length > 0',
    );
  });

  it('negative control: a cleared requested tier cannot impersonate publication', () => {
    const impossible = collectorSource.replace(
      'r.surfaceCurrentTierPx===${expectedTierPx}&&r.surfaceRequestedTierPx===0',
      'r.surfaceRequestedTierPx===${expectedTierPx}',
    );
    expect(impossible).not.toBe(collectorSource);
    expect(surfaceTierSettlementBindingErrors(impossible)).toEqual([
      'r.surfaceCurrentTierPx===${expectedTierPx}&&r.surfaceRequestedTierPx===0',
    ]);
  });

  it('negative control: tier bookkeeping cannot replace the attached backing witness', () => {
    const missingBacking = collectorSource
      .replace('&&r.surfaceCurrentBackingWidth===${expectedTierPx}', '')
      .replace('&&r.surfaceCurrentBackingHeight===${expectedTierPx}', '');
    expect(missingBacking).not.toBe(collectorSource);
    expect(surfaceTierSettlementBindingErrors(missingBacking)).toEqual([
      'r.surfaceCurrentBackingWidth===${expectedTierPx}',
      'r.surfaceCurrentBackingHeight===${expectedTierPx}',
    ]);
  });

  it('negative controls: vista cold exercise, pending owners, and reload cleanup stay bound', () => {
    for (const binding of [
      'measurement.initialVista = surfaceVistaState(measurement.initial.raw.scene);',
      '+ Number(scene.surfaceVistaWorkerActive) + Number(scene.surfaceVistaMounted)',
      'before?.surfaceVistaCacheEntries>0&&after?.surfaceVistaCacheEntries===0',
      'errors.push(...sceneMemoryProfileRawBindingErrors(measurement)',
    ]) {
      const missing = collectorSource.replace(binding, '/* removed by mutation control */');
      expect(missing, binding).not.toBe(collectorSource);
      expect(surfaceTierSettlementBindingErrors(missing), binding).toContain(binding);
    }
  });

  it('keeps every collector command inside the transport cap while long phases retain their own deadline', () => {
    expect(sceneMemoryCollectorCommandTimeoutMs()).toBe(5_000);
    expect(sceneMemoryCollectorCommandTimeoutMs(30_000)).toBe(5_000);
    expect(sceneMemoryCollectorCommandTimeoutMs(2_000)).toBe(2_000);
    expect(() => sceneMemoryCollectorCommandTimeoutMs(0)).toThrow(
      'SceneMemory collector command timeout must be a positive integer',
    );
    expect(() => sceneMemoryCollectorCommandTimeoutMs(1.5)).toThrow(
      'SceneMemory collector command timeout must be a positive integer',
    );
    expect(collectorTimeoutBindingErrors(collectorSource)).toEqual([]);
  });

  it('owns a separate minimal origin for the bfcache away document', () => {
    expect(bfcacheAwayBoundaryErrors(collectorSource)).toEqual([]);
  });

  it('projects only the bfcache readiness document at the runtime server boundary', () => {
    const ready = sceneMemoryBfcacheAwayResponse('/__scenemem_bfcache_away__.html');
    expect(ready).toMatchObject({
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
    expect(ready.body).toContain('globalThis.__CF_SCENEMEM_AWAY__=true');
    expect(sceneMemoryBfcacheAwayResponse('/not-the-away-page')).toEqual({
      status: 404,
      headers: {},
      body: '',
    });
  });

  it('negative controls: the bfcache away document cannot re-enter product scope or leak its server', () => {
    const sameOrigin = collectorSource.replace(
      'url: `${away.origin}/__scenemem_bfcache_away__.html`',
      'url: `${origin}/__scenemem_away__.html`',
    );
    expect(sameOrigin).not.toBe(collectorSource);
    expect(bfcacheAwayBoundaryErrors(sameOrigin)).toContain(
      'bfcache away navigation remains inside the product service-worker scope',
    );
    const leaked = collectorSource.replace('await away.close();', '/* close removed */');
    expect(leaked).not.toBe(collectorSource);
    expect(bfcacheAwayBoundaryErrors(leaked)).toContain('await away.close();');
  });

  it('negative controls: a transport-cap bypass or reload command widened to the phase budget turns red', () => {
    const bypassed = collectorSource.replace(
      'timeoutMs: sceneMemoryCollectorCommandTimeoutMs(timeoutMs)',
      'timeoutMs',
    );
    expect(bypassed).not.toBe(collectorSource);
    expect(collectorTimeoutBindingErrors(bypassed)).toContain(
      'timeoutMs: sceneMemoryCollectorCommandTimeoutMs(timeoutMs)',
    );

    const widenedReload = collectorSource.replace(
      "'request intentional replacement reload');",
      "'request intentional replacement reload', ART_TIMEOUT_MS);",
    );
    expect(widenedReload).not.toBe(collectorSource);
    expect(collectorTimeoutBindingErrors(widenedReload)).toContain(
      "'request intentional replacement reload');",
    );
  });
});
