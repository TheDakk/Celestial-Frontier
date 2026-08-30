import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
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
  sceneMemoryCollectorCommandTimeoutMs,
  sceneMemoryProfileRawBindingErrors,
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
] as const;

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
    "schema: 'cf-v2-scene-memory-input/v4'",
  ];
  return exactBindings.filter((binding) => !source.includes(binding));
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
    const missingVersion = browserCdpSource.replace("send('Browser.getVersion')", "send('Browser.versionMissing')");
    expect(missingVersion).not.toBe(browserCdpSource);
    expect(sceneMemoryBrowserCapabilityInventoryErrors({
      collectorSource, browserCdpSource: missingVersion,
    })).toContain('SceneMemory browser transport lacks Browser.getVersion provenance');
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
      'terminal certification requires the current surface-vista input contract',
    );
    expect(result.errors).toContain('verification requires the same tracked --budget');
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
