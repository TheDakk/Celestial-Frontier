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
  sceneMemoryBrowserAuthorityMatches,
  sceneMemoryBrowserCapabilityInventoryErrors,
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
const RETAINED_REPORT_FILES = [
  '../../../audits/ARC1C_SCENEMEM_CALIBRATION_CANDIDATE1.json.gz',
  '../../../audits/ARC1C_SCENEMEM_CALIBRATION_CANDIDATE2.json.gz',
  '../../../audits/ARC1C_SCENEMEM_CALIBRATION_CANDIDATE3.json.gz',
  '../../../audits/ARC1C_SCENEMEM_LOCAL_CERTIFICATION.json.gz',
] as const;

function rawContractProjection(snapshot: any): Record<string, unknown> {
  const scene = snapshot.raw.scene;
  const shipyard = snapshot.raw.shipyard;
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
      + scene.retiredFineOwnerCount + shipyard.activePreviewCount
      + shipyard.retainedPreviewCount + shipyard.pendingPreviewWork,
    ringCacheEntries: scene.ringGeometryEntries,
    peakRingGeometryEntries: scene.peakRingGeometryEntries,
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
    "s.panelOpen==='shipyard'",
    "document.querySelectorAll('#shipyardpanel [data-cf-shipyard-preview=\"v1\"]')",
    "visitedRoutes.push('shipyard');",
    'sceneObjectsByRoute.shipyard = shipyardOpen.activePreviewCount;',
    "shipyardStatus: 'implemented-static'",
    "const OUTCOME_COUNT = 42;",
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
  ];
  return exactBindings.filter((binding) => !source.includes(binding));
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
    const canonical = Array.from({ length: 42 }, (_, index) => ({
      id: `outcome-${index}`,
      pass: true,
      message: `canonical-${index}`,
    }));
    expect(terminalOutcomeInventoryErrors(canonical, structuredClone(canonical))).toEqual([]);
  });

  it('negative control: a count-consistent missing ID and duplicate cannot verify', () => {
    const canonical = Array.from({ length: 42 }, (_, index) => ({
      id: `outcome-${index}`,
      pass: true,
      message: `canonical-${index}`,
    }));
    const tampered = structuredClone(canonical);
    tampered[17] = structuredClone(tampered[16]!);
    expect(tampered).toHaveLength(42);
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

  it('waits for the published surface tier after pending HD work clears', () => {
    expect(surfaceTierSettlementBindingErrors(collectorSource)).toEqual([]);
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
});
