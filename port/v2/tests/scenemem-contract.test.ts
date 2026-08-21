import { describe, expect, it } from 'vitest';
import {
  evaluateSceneMemory,
  SCENE_MEMORY_ROUTES,
  SCENE_TEXTURE_KINDS,
  type SceneMemoryBudget,
  type SceneMemoryCycle,
  type SceneMemoryInput,
  type SceneMemoryOutcome,
  type SceneMemoryPoint,
  type SceneRegistrySnapshot,
} from '../tools/scenemem-contract.mjs';

function budget(): SceneMemoryBudget {
  return {
    heapUsedBytesMax: 10_000,
    embedderHeapUsedBytesMax: 5_000,
    backingStorageBytesMax: 2_000,
    heapAggregateBytesMax: 17_000,
    warmHeapAggregateRangeBytesMax: 100,
    documentsMax: 2,
    nodesMax: 1_000,
    jsEventListenersMax: 100,
    peakActiveLeaseCountMax: 20,
    peakLiveTextureCountMax: 20,
    peakLiveCanvasBytesMax: 20_000,
    managedTextureCountMax: 10,
    managedTexturePixelsMax: 3_000,
    localCanvasCacheEntriesMax: 0,
    peakLocalCanvasCacheEntriesMax: 10,
    productRenderTargetsMax: 0,
    ringCacheEntriesMax: 0,
    peakRingGeometryEntriesMax: 10,
    targetElapsedMsMax: 1_000,
    heartbeatElapsedMsMax: 1_000,
  };
}

function kindCounts(value = 1): Record<(typeof SCENE_TEXTURE_KINDS)[number], number> {
  return Object.fromEntries(SCENE_TEXTURE_KINDS.map((kind) => [kind, value])) as
    Record<(typeof SCENE_TEXTURE_KINDS)[number], number>;
}

function registry(step: number): SceneRegistrySnapshot {
  return {
    schema: 'cf-v2-scene-textures/v2',
    observationWindow: step,
    scopeCreations: 20 + step * 7,
    scopeDisposals: 19 + step * 7,
    activeScopeCount: 1,
    leaseAcquisitions: 100 + step * 12,
    leaseReleases: 94 + step * 12,
    activeLeaseCount: 6,
    textureCreations: 80 + step * 8,
    textureDisposals: 74 + step * 8,
    liveTextureCount: 6,
    liveCanvasPixels: 1_000,
    liveCanvasBytes: 4_000,
    peakActiveLeaseCount: 10,
    peakLiveTextureCount: 8,
    peakLiveCanvasPixels: 2_000,
    peakLiveCanvasBytes: 8_000,
    lifetimePeakActiveLeaseCount: 10,
    lifetimePeakLiveTextureCount: 8,
    lifetimePeakLiveCanvasPixels: 2_000,
    externalDestroyFaults: 0,
    balanced: true,
    coherent: true,
    liveLeasesByKind: kindCounts(),
    liveTexturesByKind: kindCounts(),
    activeScopes: [{ label: 'settled-universe', leaseCount: 6, closed: false }],
  };
}

function point(step: number, documentToken: string): SceneMemoryPoint {
  return {
    sceneGeneration: 100 + step * 6,
    documentToken,
    registry: registry(step),
    managedTextureCount: 6,
    managedTexturePixels: 1_000,
    localCanvasCacheEntries: 0,
    peakLocalCanvasCacheEntries: 4,
    productRenderTargets: 0,
    retiredFineOwnerCount: 0,
    pending: 0,
    ringCacheEntries: 0,
    peakRingGeometryEntries: 10,
    answerability: {
      target: {
        ok: true,
        elapsedMs: 20,
        documentTokenBefore: documentToken,
        documentTokenAfter: documentToken,
        tickerBefore: step * 10,
        tickerAfter: step * 10 + 1,
        laterTicker: true,
      },
      heartbeat: {
        ok: true,
        elapsedMs: 5,
        independent: true,
        product: 'HeadlessChrome/150.0.0.0',
        protocolVersion: '1.3',
      },
    },
    heap: { usedSize: 1_000 + step * 10, embedderHeapUsedSize: 500, backingStorageSize: 100 },
    dom: { documents: 1, nodes: 100, jsEventListeners: 20 },
  };
}

function cycle(index: number, documentToken: string): SceneMemoryCycle {
  return {
    ...point(index, documentToken),
    cycle: index,
    inventory: {
      routes: [...SCENE_MEMORY_ROUTES],
      shipyardStatus: 'future-arc-1c',
      sceneObjectsByRoute: Object.fromEntries(
        SCENE_MEMORY_ROUTES.map((route, routeIndex) => [route, routeIndex + 1]),
      ) as SceneMemoryCycle['inventory']['sceneObjectsByRoute'],
      fine: { requested: true, layer: true, scope: true },
      surface: { mode: true, owner: true, scope: true },
    },
  };
}

function input(): SceneMemoryInput {
  const profile = (token: string) => {
    const cycles = [1, 2, 3, 4].map((index) => cycle(index, token));
    return {
      precondition: point(0, token),
      cycles,
      bfcache: {
        ...point(4, token),
        pagehidePersisted: true,
        pageshowPersisted: true,
        resumed: true,
        appAlive: true,
        rendererAlive: true,
        stageAlive: true,
        documentTokenBefore: token,
        documentTokenAfter: token,
      },
    };
  };
  return {
    schema: 'cf-v2-scene-memory-input/v1',
    profiles: { phone: profile('phone-document'), desktop: profile('desktop-document') },
    budgets: { phone: budget(), desktop: budget() },
  };
}

function resultFor(result: ReturnType<typeof evaluateSceneMemory>, id: string): SceneMemoryOutcome {
  const found = result.outcomes.find((entry) => entry.id === id);
  expect(found, `missing outcome ${id}`).toBeDefined();
  return found!;
}

function addCoherentLeak(snapshot: SceneRegistrySnapshot): void {
  snapshot.leaseAcquisitions++;
  snapshot.activeLeaseCount++;
  snapshot.textureCreations++;
  snapshot.liveTextureCount++;
  snapshot.liveCanvasPixels += 64;
  snapshot.liveCanvasBytes += 256;
  snapshot.liveLeasesByKind['scene-canvas']++;
  snapshot.liveTexturesByKind['scene-canvas']++;
  snapshot.activeScopes[0]!.leaseCount++;
}

describe('Arc 1B scene-memory contract', () => {
  it('accepts complete phone and desktop four-cycle plateau evidence', () => {
    const result = evaluateSceneMemory(input());
    expect(result.status).toBe('pass');
    expect(result.failures).toEqual([]);
    expect(result.outcomes).toHaveLength(32);
  });

  it('negative controls: the explicit precondition and first measured cycle cannot be discarded', () => {
    const absent = input() as unknown as {
      profiles: { phone: { precondition?: SceneMemoryPoint } };
    };
    delete absent.profiles.phone.precondition;
    expect(resultFor(
      evaluateSceneMemory(absent as unknown as SceneMemoryInput),
      'phone/measurement-precondition',
    )).toMatchObject({ pass: false });

    const firstCycleDrift = input();
    firstCycleDrift.profiles.phone.cycles[0]!.managedTextureCount--;
    expect(resultFor(evaluateSceneMemory(firstCycleDrift), 'phone/warm-resource-plateau'))
      .toMatchObject({ pass: false });
  });

  it('negative control: registry observation windows must reset in exact sequence', () => {
    const broken = input();
    broken.profiles.phone.cycles[1]!.registry.observationWindow = 1;
    const result = evaluateSceneMemory(broken);
    expect(resultFor(result, 'phone/observation-window-sequence')).toMatchObject({ pass: false });
    expect(resultFor(result, 'phone/warm-resource-plateau').pass).toBe(true);
  });

  it('negative controls: cycle work must be nonzero, balanced, and equal', () => {
    const zero = input();
    const zeroProfile = zero.profiles.phone;
    for (const measured of zeroProfile.cycles) {
      measured.sceneGeneration = zeroProfile.precondition.sceneGeneration;
      for (const field of [
        'scopeCreations', 'scopeDisposals', 'leaseAcquisitions', 'leaseReleases',
        'textureCreations', 'textureDisposals',
      ] as const) measured.registry[field] = zeroProfile.precondition.registry[field];
    }
    zeroProfile.bfcache.sceneGeneration = zeroProfile.cycles[3]!.sceneGeneration;
    zeroProfile.bfcache.registry = structuredClone(zeroProfile.cycles[3]!.registry);
    expect(resultFor(evaluateSceneMemory(zero), 'phone/cycle-work-deltas').message)
      .toContain('positive');

    const unequal = input();
    const unequalProfile = unequal.profiles.phone;
    for (const measured of unequalProfile.cycles.slice(1)) {
      measured.sceneGeneration++;
      for (const field of [
        'scopeCreations', 'scopeDisposals', 'leaseAcquisitions', 'leaseReleases',
        'textureCreations', 'textureDisposals',
      ] as const) measured.registry[field]++;
    }
    unequalProfile.bfcache.sceneGeneration = unequalProfile.cycles[3]!.sceneGeneration;
    unequalProfile.bfcache.registry = structuredClone(unequalProfile.cycles[3]!.registry);
    const unequalResult = evaluateSceneMemory(unequal);
    expect(resultFor(unequalResult, 'phone/cycle-work-deltas').message)
      .toContain('differ');
    expect(resultFor(unequalResult, 'phone/registry-balance').pass).toBe(true);
  });

  it('negative control: a coherent missing release breaks the exact warm plateau', () => {
    const broken = input();
    const finalCycle = broken.profiles.phone.cycles[3]!;
    addCoherentLeak(finalCycle.registry);
    finalCycle.managedTextureCount = finalCycle.registry.liveTextureCount;
    finalCycle.managedTexturePixels = finalCycle.registry.liveCanvasPixels;
    broken.profiles.phone.bfcache.registry = structuredClone(finalCycle.registry);
    broken.profiles.phone.bfcache.managedTextureCount = finalCycle.managedTextureCount;
    broken.profiles.phone.bfcache.managedTexturePixels = finalCycle.managedTexturePixels;
    const result = evaluateSceneMemory(broken);
    expect(resultFor(result, 'phone/warm-resource-plateau')).toMatchObject({
      pass: false,
      message: 'measured resource inventory drifted or retained an extra owner',
    });
    expect(resultFor(result, 'phone/registry-balance').pass).toBe(true);
    expect(resultFor(result, 'phone/registry-coherence').pass).toBe(true);
    expect(resultFor(result, 'phone/cycle-work-deltas').message).toContain('unbalanced');
  });

  it('negative control: premature external destruction fails coherence independently', () => {
    const broken = input();
    const snapshot = broken.profiles.phone.cycles[1]!.registry;
    snapshot.externalDestroyFaults = 1;
    snapshot.coherent = false;
    const result = evaluateSceneMemory(broken);
    const finding = resultFor(result, 'phone/registry-coherence');
    expect(finding.pass).toBe(false);
    expect(finding.message).toContain('external destroy fault');
    expect(resultFor(result, 'phone/registry-balance').pass).toBe(true);
  });

  it('negative control: an unbalanced release equation cannot claim registry health', () => {
    const broken = input();
    broken.profiles.phone.cycles[0]!.registry.leaseReleases--;
    const finding = resultFor(evaluateSceneMemory(broken), 'phone/registry-balance');
    expect(finding.pass).toBe(false);
    expect(finding.message).toContain('lease equation');
  });

  it('negative control: a transient allocation peak cannot hide behind a settled plateau', () => {
    const broken = input();
    const snapshot = broken.profiles.phone.precondition.registry;
    snapshot.peakLiveCanvasPixels = 6_000;
    snapshot.peakLiveCanvasBytes = 24_000;
    snapshot.lifetimePeakLiveCanvasPixels = 6_000;
    const result = evaluateSceneMemory(broken);
    expect(resultFor(result, 'phone/transient-peak')).toMatchObject({ pass: false });
    expect(resultFor(result, 'phone/warm-resource-plateau').pass).toBe(true);
  });

  it('negative controls: route objects and DOM/listener counts are part of the plateau', () => {
    const routeDrift = input();
    routeDrift.profiles.phone.cycles[0]!.inventory.sceneObjectsByRoute.surface++;
    const routeResult = evaluateSceneMemory(routeDrift);
    expect(resultFor(routeResult, 'phone/warm-resource-plateau')).toMatchObject({ pass: false });
    expect(resultFor(routeResult, 'phone/populated-scene').pass).toBe(true);

    const listenerDrift = input();
    listenerDrift.profiles.phone.cycles[0]!.dom.jsEventListeners++;
    const listenerResult = evaluateSceneMemory(listenerDrift);
    expect(resultFor(listenerResult, 'phone/warm-resource-plateau')).toMatchObject({ pass: false });
    expect(resultFor(listenerResult, 'phone/heap-dom-budget').pass).toBe(true);
  });

  it('negative controls: stable retired owners and extra settled scopes cannot plateau green', () => {
    const retired = input();
    for (const measured of retired.profiles.phone.cycles) measured.retiredFineOwnerCount = 1;
    expect(resultFor(evaluateSceneMemory(retired), 'phone/warm-resource-plateau'))
      .toMatchObject({ pass: false });

    const extraScope = input();
    const profile = extraScope.profiles.phone;
    for (const measured of [profile.precondition, ...profile.cycles, profile.bfcache]) {
      measured.registry.scopeCreations++;
      measured.registry.activeScopeCount++;
      measured.registry.activeScopes.push({ label: 'retired-fine', leaseCount: 0, closed: false });
    }
    const scopeResult = evaluateSceneMemory(extraScope);
    expect(resultFor(scopeResult, 'phone/warm-resource-plateau')).toMatchObject({ pass: false });
    expect(resultFor(scopeResult, 'phone/registry-balance').message)
      .toContain('settled active scope count');
  });

  it('negative controls: settled ring and local-canvas caches must be evicted to zero', () => {
    const ring = input();
    const ringProfile = ring.profiles.phone;
    for (const measured of [ringProfile.precondition, ...ringProfile.cycles, ringProfile.bfcache]) {
      measured.ringCacheEntries = 1;
    }
    const ringResult = evaluateSceneMemory(ring);
    expect(resultFor(ringResult, 'phone/ring-cache-bound')).toMatchObject({ pass: false });
    expect(resultFor(ringResult, 'phone/warm-resource-plateau').pass).toBe(true);

    const local = input();
    const localProfile = local.profiles.phone;
    for (const measured of [localProfile.precondition, ...localProfile.cycles, localProfile.bfcache]) {
      measured.localCanvasCacheEntries = 1;
    }
    const localResult = evaluateSceneMemory(local);
    expect(resultFor(localResult, 'phone/diagnostic-resource-budget').message)
      .toContain('settled local canvas cache must be empty');
    expect(resultFor(localResult, 'phone/warm-resource-plateau').pass).toBe(true);
  });

  it('negative controls: evicted current caches cannot hide an over-budget window peak', () => {
    const ringPeak = input();
    const ringProfile = ringPeak.profiles.phone;
    for (const measured of [ringProfile.precondition, ...ringProfile.cycles, ringProfile.bfcache]) {
      measured.peakRingGeometryEntries = 11;
      expect(measured.ringCacheEntries).toBe(0);
    }
    const ringResult = evaluateSceneMemory(ringPeak);
    expect(resultFor(ringResult, 'phone/ring-cache-bound')).toMatchObject({ pass: false });
    expect(resultFor(ringResult, 'phone/warm-resource-plateau').pass).toBe(true);
    expect(resultFor(ringResult, 'phone/bfcache-survival').pass).toBe(true);

    const localPeak = input();
    const localProfile = localPeak.profiles.phone;
    for (const measured of [localProfile.precondition, ...localProfile.cycles, localProfile.bfcache]) {
      measured.peakLocalCanvasCacheEntries = 11;
      expect(measured.localCanvasCacheEntries).toBe(0);
    }
    const localResult = evaluateSceneMemory(localPeak);
    expect(resultFor(localResult, 'phone/diagnostic-resource-budget').message)
      .toContain('peak local canvas cache exceeded budget');
    expect(resultFor(localResult, 'phone/warm-resource-plateau').pass).toBe(true);
    expect(resultFor(localResult, 'phone/bfcache-survival').pass).toBe(true);
  });

  it('negative controls: zero peaks cannot pass after losing either Sol update hook', () => {
    const noRingUpdates = input();
    const ringProfile = noRingUpdates.profiles.phone;
    for (const measured of [ringProfile.precondition, ...ringProfile.cycles, ringProfile.bfcache]) {
      measured.peakRingGeometryEntries = 0;
    }
    const ringResult = evaluateSceneMemory(noRingUpdates);
    expect(resultFor(ringResult, 'phone/ring-cache-bound')).toMatchObject({ pass: false });
    expect(resultFor(ringResult, 'phone/diagnostic-resource-budget').pass).toBe(true);
    expect(resultFor(ringResult, 'phone/warm-resource-plateau').pass).toBe(true);
    expect(resultFor(ringResult, 'phone/bfcache-survival').pass).toBe(true);

    const noLocalCanvasUpdates = input();
    const localProfile = noLocalCanvasUpdates.profiles.phone;
    for (const measured of [localProfile.precondition, ...localProfile.cycles, localProfile.bfcache]) {
      measured.peakLocalCanvasCacheEntries = 0;
    }
    const localResult = evaluateSceneMemory(noLocalCanvasUpdates);
    expect(resultFor(localResult, 'phone/diagnostic-resource-budget').message)
      .toContain('peak local canvas cache lacked Sol route witness');
    expect(resultFor(localResult, 'phone/ring-cache-bound').pass).toBe(true);
    expect(resultFor(localResult, 'phone/warm-resource-plateau').pass).toBe(true);
    expect(resultFor(localResult, 'phone/bfcache-survival').pass).toBe(true);
  });

  it('negative control: renderer proxy and product render targets stay bounded', () => {
    const oversizedProxy = input();
    oversizedProxy.profiles.phone.cycles[0]!.managedTextureCount = 11;
    const proxyFinding = resultFor(
      evaluateSceneMemory(oversizedProxy), 'phone/diagnostic-resource-budget',
    );
    expect(proxyFinding.pass).toBe(false);
    expect(proxyFinding.message).toContain('managed texture count exceeded budget');

    const renderTarget = input();
    renderTarget.profiles.phone.cycles[0]!.productRenderTargets = 1;
    const renderTargetFinding = resultFor(
      evaluateSceneMemory(renderTarget), 'phone/diagnostic-resource-budget',
    );
    expect(renderTargetFinding.pass).toBe(false);
    expect(renderTargetFinding.message).toContain('product render targets must remain zero');
  });

  it('negative control: pending work must settle to exactly zero', () => {
    const broken = input();
    broken.profiles.phone.cycles[0]!.pending = 1;
    expect(resultFor(evaluateSceneMemory(broken), 'phone/pending-zero'))
      .toMatchObject({ pass: false, message: 'pending scene work remained' });
  });

  it('negative controls: route omission and an empty scene cannot pass vacuously', () => {
    const missingRoute = input();
    missingRoute.profiles.phone.cycles[0]!.inventory.routes.pop();
    expect(resultFor(evaluateSceneMemory(missingRoute), 'phone/cycle-inventory'))
      .toMatchObject({ pass: false });

    const prematureShipyard = input();
    prematureShipyard.profiles.phone.cycles[0]!.inventory.shipyardStatus =
      'live' as unknown as 'future-arc-1c';
    expect(resultFor(evaluateSceneMemory(prematureShipyard), 'phone/cycle-inventory'))
      .toMatchObject({ pass: false });

    const empty = input();
    empty.profiles.phone.cycles[0]!.inventory.sceneObjectsByRoute.surface = 0;
    expect(resultFor(evaluateSceneMemory(empty), 'phone/populated-scene'))
      .toMatchObject({ pass: false, message: 'scene proof was empty or vacuous' });
  });

  it('negative controls: target and browser heartbeat fail independently', () => {
    const target = input();
    target.profiles.phone.cycles[0]!.answerability.target.ok = false;
    const targetFinding = resultFor(evaluateSceneMemory(target), 'phone/answerability');
    expect(targetFinding.pass).toBe(false);
    expect(targetFinding.message).toContain('target failed');
    expect(targetFinding.message).not.toContain('heartbeat failed');

    const heartbeat = input();
    heartbeat.profiles.phone.cycles[0]!.answerability.heartbeat.ok = false;
    const heartbeatFinding = resultFor(evaluateSceneMemory(heartbeat), 'phone/answerability');
    expect(heartbeatFinding.pass).toBe(false);
    expect(heartbeatFinding.message).toContain('heartbeat failed');
    expect(heartbeatFinding.message).not.toContain('target failed');
  });

  it('negative controls: target success requires a later ticker on the same document', () => {
    const staleTicker = input();
    const staleTarget = staleTicker.profiles.phone.precondition.answerability.target;
    staleTarget.tickerAfter = staleTarget.tickerBefore;
    const staleFinding = resultFor(evaluateSceneMemory(staleTicker), 'phone/answerability');
    expect(staleFinding.message).toContain('target later ticker');

    const replacedDocument = input();
    replacedDocument.profiles.phone.precondition.answerability.target.documentTokenAfter =
      'replacement-document';
    const documentFinding = resultFor(
      evaluateSceneMemory(replacedDocument), 'phone/answerability',
    );
    expect(documentFinding.message).toContain('target document token');
  });

  it('negative controls: heartbeat identity must be independent and nonempty', () => {
    const dependent = input();
    dependent.profiles.phone.precondition.answerability.heartbeat.independent = false;
    expect(resultFor(evaluateSceneMemory(dependent), 'phone/answerability').message)
      .toContain('heartbeat not independent');

    const anonymous = input();
    anonymous.profiles.phone.precondition.answerability.heartbeat.product = '';
    expect(resultFor(evaluateSceneMemory(anonymous), 'phone/answerability').message)
      .toContain('heartbeat identity');
  });

  it('negative control: a destroyed/replaced document is not bfcache survival', () => {
    const broken = input();
    broken.profiles.phone.bfcache.documentTokenAfter = 'replacement-document';
    broken.profiles.phone.bfcache.appAlive = false;
    expect(resultFor(evaluateSceneMemory(broken), 'phone/bfcache-survival'))
      .toMatchObject({ pass: false });
  });

  it('negative control: bfcache cannot mutate balanced cumulative registry counters', () => {
    const broken = input();
    broken.profiles.phone.bfcache.registry.leaseAcquisitions++;
    broken.profiles.phone.bfcache.registry.leaseReleases++;
    const result = evaluateSceneMemory(broken);
    expect(resultFor(result, 'phone/bfcache-survival')).toMatchObject({ pass: false });
    expect(resultFor(result, 'phone/registry-balance').pass).toBe(true);
    expect(resultFor(result, 'phone/registry-coherence').pass).toBe(true);
  });

  it('checks fine/surface witnesses and supplied heap/DOM ceilings', () => {
    const inconsistent = input();
    inconsistent.profiles.phone.cycles[0]!.inventory.fine.scope = false;
    expect(resultFor(evaluateSceneMemory(inconsistent), 'phone/fine-surface-consistency'))
      .toMatchObject({ pass: false });

    const oversized = input();
    oversized.profiles.desktop.cycles[0]!.dom.nodes = 1_001;
    expect(resultFor(evaluateSceneMemory(oversized), 'desktop/heap-dom-budget'))
      .toMatchObject({ pass: false });
  });

  it('rejects an incomplete budget instead of silently dropping a ceiling', () => {
    const broken = input() as unknown as { budgets: { phone: Record<string, number> } };
    delete broken.budgets.phone.nodesMax;
    expect(() => evaluateSceneMemory(broken as unknown as SceneMemoryInput))
      .toThrow('phone scene-memory budget is incomplete or invalid');
  });
});
