import { describe, expect, it } from 'vitest';
import {
  evaluateSceneMemory,
  SCENE_MEMORY_ROUTES,
  SCENE_TEXTURE_KINDS,
  type SceneMemoryBudget,
  type SceneMemoryCycle,
  type SceneMemoryCurrentInput as SceneMemoryInput,
  type SceneMemoryOutcome,
  type SceneMemoryPoint,
  type SceneRegistrySnapshot,
  type PixiManagedResourceOwnerSnapshot,
} from '../tools/scenemem-contract.mjs';

function budget(): SceneMemoryBudget {
  return {
    heapUsedBytesMax: 10_000,
    embedderHeapUsedBytesMax: 5_000,
    backingStorageBytesMax: 2_000,
    heapAggregateBytesMax: 17_000,
    warmHeapAggregateRangeBytesMax: 100,
    warmHeapSlopeBytesPerCycleMax: 20,
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
    surfaceVistaCacheEntriesMax: 1,
    surfaceVistaCachePixelsMax: 412_800,
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

function managedResources(step: number): PixiManagedResourceOwnerSnapshot {
  return {
    schema: 'cf-v2-pixi-managed-resources/v2',
    valid: true,
    hashCount: 2,
    hashes: [
      { name: 'graphics', type: 'renderable', liveEntryCount: 4, clearedEntryCount: 0 },
      { name: 'glTexture', type: 'resource', liveEntryCount: 4, clearedEntryCount: 0 },
    ],
    liveEntryCount: 8,
    clearedEntryCount: 0,
    compactionCount: 5 + step * step,
    compactedSlotCount: 20 + step * step * 3,
    faultCount: 0,
  };
}

function point(step: number, documentToken: string): SceneMemoryPoint {
  return {
    sceneGeneration: 100 + step * 6,
    documentToken,
    registry: registry(step),
    managedResources: managedResources(step),
    managedTextureCount: 6,
    managedTexturePixels: 1_000,
    managedTextureClearedSlots: step === 0 ? 5 : 7,
    sceneTextStyleUpdateListeners: 12,
    localCanvasCacheEntries: 0,
    peakLocalCanvasCacheEntries: 4,
    productRenderTargets: 0,
    retiredFineOwnerCount: 0,
    shipyardDiagnosticsSchema: 'cf-v2-shipyard-diagnostics/v1',
    shipyardPreviewStatus: 'closed',
    shipyardPreviewStateKey: null,
    shipyardPreviewActiveCount: 0,
    shipyardPreviewRetainedCount: 0,
    shipyardPreviewPendingWork: 0,
    pending: 0,
    ringCacheEntries: 0,
    peakRingGeometryEntries: 10,
    surfaceVistaWorkerActive: false,
    surfaceVistaMounted: false,
    surfaceVistaCacheEntries: 1,
    surfaceVistaCachePixels: 412_800,
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
      shipyard: {
        status: 'implemented-static',
        openerDriven: true,
        closeDriven: true,
        stateKey: 'frontier-ig|veteran-refit|array,autoext,cscoop',
        stateMatch: true,
        openPreviewCount: 1,
        openRetainedPreviewCount: 0,
        openPendingPreviewWork: 0,
        closedPreviewCount: 0,
        closedRetainedPreviewCount: 0,
        closedPendingPreviewWork: 0,
      },
      sceneObjectsByRoute: Object.fromEntries(
        SCENE_MEMORY_ROUTES.map((route, routeIndex) => [route, routeIndex + 1]),
      ) as SceneMemoryCycle['inventory']['sceneObjectsByRoute'],
      fine: { requested: true, layer: true, scope: true },
      surface: {
        mode: true, owner: true, scope: true,
        surfaceVistaWorkerActive: false,
        surfaceVistaMounted: true,
        surfaceVistaCacheEntries: 1,
        surfaceVistaCachePixels: 412_800,
      },
    },
  };
}

function input(): SceneMemoryInput {
  const profile = (token: string) => {
    const cycles = [1, 2, 3, 4].map((index) => cycle(index, token));
    return {
      initialVista: {
        surfaceVistaWorkerActive: false,
        surfaceVistaMounted: false,
        surfaceVistaCacheEntries: 0,
        surfaceVistaCachePixels: 0,
      },
      firstSurfaceVista: {
        surfaceVistaWorkerActive: false,
        surfaceVistaMounted: true,
        surfaceVistaCacheEntries: 1,
        surfaceVistaCachePixels: 412_800,
      },
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
      reloadCleanup: {
        schema: 'cf-v2-scene-memory-reload-cleanup/v1' as const,
        documentTokenBefore: token,
        documentTokenAfter: `${token}-replacement`,
        release: {
          schema: 'cf-v2-reload-release/v1' as const,
          status: 'released' as const,
          error: null,
          reason: 'save-import' as const,
          documentToken: token,
          rendererReleased: true,
          stageReleased: true,
          viewDetached: true,
        },
        cacheTransition: {
          schema: 'cf-v2-scene-memory-vista-cache-transition/v1' as const,
          documentToken: token,
          before: {
            surfaceVistaWorkerActive: false,
            surfaceVistaMounted: false,
            surfaceVistaCacheEntries: 1,
            surfaceVistaCachePixels: 412_800,
          },
          after: {
            surfaceVistaWorkerActive: false,
            surfaceVistaMounted: false,
            surfaceVistaCacheEntries: 0,
            surfaceVistaCachePixels: 0,
          },
        },
        replacement: {
          documentToken: `${token}-replacement`,
          surfaceVistaWorkerActive: false,
          surfaceVistaMounted: false,
          surfaceVistaCacheEntries: 0,
          surfaceVistaCachePixels: 0,
        },
      },
    };
  };
  return {
    schema: 'cf-v2-scene-memory-input/v4',
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

describe('Arc 1C scene-memory contract', () => {
  it('accepts complete phone and desktop four-cycle plateau evidence', () => {
    const result = evaluateSceneMemory(input());
    expect(result.status).toBe('pass');
    expect(result.failures).toEqual([]);
    expect(result.outcomes).toHaveLength(44);
  });

  it('rejects the superseded Arc 1B input schema before judging it', () => {
    const stale = input() as unknown as { schema: string };
    stale.schema = 'cf-v2-scene-memory-input/v2';
    expect(() => evaluateSceneMemory(stale as unknown as SceneMemoryInput))
      .toThrow('scene-memory input requires exact phone and desktop profiles/budgets');
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

  it('allows a fixed nonzero precondition pool but requires measured and bfcache slot equality', () => {
    const baseline = input();
    expect(baseline.profiles.phone.precondition.managedTextureClearedSlots).toBe(5);
    expect(baseline.profiles.phone.cycles.map((measured) =>
      measured.managedTextureClearedSlots)).toEqual([7, 7, 7, 7]);
    expect(evaluateSceneMemory(baseline).status).toBe('pass');

    const measuredDrift = input();
    measuredDrift.profiles.phone.cycles[1]!.managedTextureClearedSlots = 8;
    const measuredResult = evaluateSceneMemory(measuredDrift);
    expect(resultFor(measuredResult, 'phone/warm-resource-plateau')).toMatchObject({ pass: false });
    expect(resultFor(measuredResult, 'phone/bfcache-survival').pass).toBe(true);

    const bfcacheDrift = input();
    bfcacheDrift.profiles.phone.bfcache.managedTextureClearedSlots = 8;
    const bfcacheResult = evaluateSceneMemory(bfcacheDrift);
    expect(resultFor(bfcacheResult, 'phone/warm-resource-plateau').pass).toBe(true);
    expect(resultFor(bfcacheResult, 'phone/bfcache-survival')).toMatchObject({ pass: false });
  });

  it('negative controls: shared TextStyle listeners cannot grow, disappear, or drift in bfcache', () => {
    const growing = input();
    growing.profiles.phone.cycles[1]!.sceneTextStyleUpdateListeners++;
    const growingResult = evaluateSceneMemory(growing);
    expect(resultFor(growingResult, 'phone/scene-text-style-listeners').pass).toBe(true);
    expect(resultFor(growingResult, 'phone/warm-resource-plateau')).toMatchObject({ pass: false });
    expect(resultFor(growingResult, 'phone/bfcache-survival').pass).toBe(true);

    const bfcacheDrift = input();
    bfcacheDrift.profiles.phone.bfcache.sceneTextStyleUpdateListeners++;
    const bfcacheResult = evaluateSceneMemory(bfcacheDrift);
    expect(resultFor(bfcacheResult, 'phone/warm-resource-plateau').pass).toBe(true);
    expect(resultFor(bfcacheResult, 'phone/bfcache-survival')).toMatchObject({ pass: false });

    const vacuous = input();
    const profile = vacuous.profiles.phone;
    for (const measured of [profile.precondition, ...profile.cycles, profile.bfcache]) {
      measured.sceneTextStyleUpdateListeners = 0;
    }
    const vacuousResult = evaluateSceneMemory(vacuous);
    expect(resultFor(vacuousResult, 'phone/scene-text-style-listeners')).toMatchObject({
      pass: false,
      message: 'shared TextStyle update-listener witness was absent or vacuous',
    });
    expect(resultFor(vacuousResult, 'phone/warm-resource-plateau').pass).toBe(true);
    expect(resultFor(vacuousResult, 'phone/bfcache-survival').pass).toBe(true);
  });

  it('negative control: stable cleared managed-resource slots cannot plateau green', () => {
    const broken = input();
    const profile = broken.profiles.phone;
    for (const measured of [profile.precondition, ...profile.cycles, profile.bfcache]) {
      measured.managedResources.clearedEntryCount = 1;
    }
    const result = evaluateSceneMemory(broken);
    expect(resultFor(result, 'phone/managed-resource-compaction').message)
      .toContain('cleared entries remained');
    expect(resultFor(result, 'phone/managed-resource-compaction').message)
      .toContain('per-hash cleared total mismatch');
    expect(resultFor(result, 'phone/managed-resource-plateau').pass).toBe(true);
    expect(resultFor(result, 'phone/warm-resource-plateau').pass).toBe(true);
    expect(resultFor(result, 'phone/bfcache-survival').pass).toBe(true);
  });

  it('negative controls: invalid and faulted adapters fail independently', () => {
    const invalid = input();
    invalid.profiles.phone.precondition.managedResources.valid = false;
    const invalidResult = evaluateSceneMemory(invalid);
    expect(resultFor(invalidResult, 'phone/managed-resource-compaction').message)
      .toContain('adapter invalid');
    expect(resultFor(invalidResult, 'phone/managed-resource-plateau').pass).toBe(true);

    const faulted = input();
    const profile = faulted.profiles.phone;
    for (const measured of [profile.precondition, ...profile.cycles, profile.bfcache]) {
      measured.managedResources.faultCount = 1;
    }
    const faultResult = evaluateSceneMemory(faulted);
    expect(resultFor(faultResult, 'phone/managed-resource-compaction').message)
      .toContain('adapter fault');
    expect(resultFor(faultResult, 'phone/managed-resource-plateau').pass).toBe(true);
    expect(resultFor(faultResult, 'phone/bfcache-survival').pass).toBe(true);
  });

  it('negative controls: both compaction counters must advance on every cycle', () => {
    const noCompaction = input();
    const noCompactionProfile = noCompaction.profiles.phone;
    noCompactionProfile.cycles[0]!.managedResources.compactionCount =
      noCompactionProfile.precondition.managedResources.compactionCount;
    const compactionResult = evaluateSceneMemory(noCompaction);
    expect(resultFor(compactionResult, 'phone/managed-resource-compaction').message)
      .toContain('compaction count did not advance');
    expect(resultFor(compactionResult, 'phone/managed-resource-plateau').pass).toBe(true);
    expect(resultFor(compactionResult, 'phone/bfcache-survival').pass).toBe(true);

    const noSlots = input();
    const noSlotsProfile = noSlots.profiles.phone;
    noSlotsProfile.cycles[0]!.managedResources.compactedSlotCount =
      noSlotsProfile.precondition.managedResources.compactedSlotCount;
    const slotsResult = evaluateSceneMemory(noSlots);
    expect(resultFor(slotsResult, 'phone/managed-resource-compaction').message)
      .toContain('compacted slot count did not advance');
    expect(resultFor(slotsResult, 'phone/managed-resource-plateau').pass).toBe(true);
    expect(resultFor(slotsResult, 'phone/bfcache-survival').pass).toBe(true);
  });

  it('negative control: live managed-resource drift fails its dedicated plateau', () => {
    const broken = input();
    broken.profiles.phone.cycles[1]!.managedResources.hashes[0]!.liveEntryCount++;
    broken.profiles.phone.cycles[1]!.managedResources.liveEntryCount++;
    const result = evaluateSceneMemory(broken);
    expect(resultFor(result, 'phone/managed-resource-compaction').pass).toBe(true);
    expect(resultFor(result, 'phone/managed-resource-plateau')).toMatchObject({ pass: false });
    expect(resultFor(result, 'phone/warm-resource-plateau').pass).toBe(true);
    expect(resultFor(result, 'phone/bfcache-survival').pass).toBe(true);
  });

  it('negative controls: per-hash redistribution and semantic drift cannot hide in stable totals', () => {
    const redistributed = input();
    const redistributedHashes =
      redistributed.profiles.phone.cycles[1]!.managedResources.hashes;
    redistributedHashes[0]!.liveEntryCount++;
    redistributedHashes[1]!.liveEntryCount--;
    const redistributedResult = evaluateSceneMemory(redistributed);
    expect(resultFor(redistributedResult, 'phone/managed-resource-compaction').pass).toBe(true);
    expect(resultFor(redistributedResult, 'phone/managed-resource-plateau')).toMatchObject({
      pass: false,
      message: 'settled Pixi managed-resource inventory drifted',
    });
    expect(resultFor(redistributedResult, 'phone/warm-resource-plateau').pass).toBe(true);

    const renamed = input();
    renamed.profiles.phone.cycles[1]!.managedResources.hashes[0]!.name = 'graphics-renamed';
    const renamedResult = evaluateSceneMemory(renamed);
    expect(resultFor(renamedResult, 'phone/managed-resource-compaction').pass).toBe(true);
    expect(resultFor(renamedResult, 'phone/managed-resource-plateau').pass).toBe(false);

    const retyped = input();
    const retypedHashes = retyped.profiles.phone.cycles[1]!.managedResources.hashes;
    retypedHashes[1]!.type = 'renderable';
    retypedHashes.sort((left, right) => {
      const leftIdentity = `${left.type}\u0000${left.name}`;
      const rightIdentity = `${right.type}\u0000${right.name}`;
      return leftIdentity < rightIdentity ? -1 : leftIdentity > rightIdentity ? 1 : 0;
    });
    const retypedResult = evaluateSceneMemory(retyped);
    expect(resultFor(retypedResult, 'phone/managed-resource-compaction').pass).toBe(true);
    expect(resultFor(retypedResult, 'phone/managed-resource-plateau').pass).toBe(false);
  });

  it('negative controls: duplicate identities and aggregate total mismatch fail validation', () => {
    const duplicate = input();
    const duplicateHashes = duplicate.profiles.phone.cycles[1]!.managedResources.hashes;
    duplicateHashes[1]!.name = duplicateHashes[0]!.name;
    duplicateHashes[1]!.type = duplicateHashes[0]!.type;
    const duplicateResult = evaluateSceneMemory(duplicate);
    expect(resultFor(duplicateResult, 'phone/managed-resource-compaction').message)
      .toContain('per-hash identity duplicated');
    expect(resultFor(duplicateResult, 'phone/managed-resource-plateau').pass).toBe(false);

    const totalMismatch = input();
    const totalProfile = totalMismatch.profiles.phone;
    for (const measured of [totalProfile.precondition, ...totalProfile.cycles, totalProfile.bfcache]) {
      measured.managedResources.liveEntryCount++;
    }
    const totalResult = evaluateSceneMemory(totalMismatch);
    expect(resultFor(totalResult, 'phone/managed-resource-compaction').message)
      .toContain('per-hash live total mismatch');
    expect(resultFor(totalResult, 'phone/managed-resource-plateau').pass).toBe(true);
    expect(resultFor(totalResult, 'phone/bfcache-survival').pass).toBe(true);
  });

  it('negative control: a per-hash cleared slot cannot hide behind a zero aggregate', () => {
    const broken = input();
    const profile = broken.profiles.phone;
    for (const measured of [profile.precondition, ...profile.cycles, profile.bfcache]) {
      measured.managedResources.hashes[0]!.clearedEntryCount = 1;
      expect(measured.managedResources.clearedEntryCount).toBe(0);
    }
    const result = evaluateSceneMemory(broken);
    const finding = resultFor(result, 'phone/managed-resource-compaction');
    expect(finding.message).toContain('graphics retained cleared entries');
    expect(finding.message).toContain('per-hash cleared total mismatch');
    expect(resultFor(result, 'phone/managed-resource-plateau').pass).toBe(true);
    expect(resultFor(result, 'phone/bfcache-survival').pass).toBe(true);
  });

  it('negative control: bfcache-only per-hash drift fails survival with stable aggregates', () => {
    const broken = input();
    const hashes = broken.profiles.phone.bfcache.managedResources.hashes;
    hashes[0]!.liveEntryCount++;
    hashes[1]!.liveEntryCount--;
    const result = evaluateSceneMemory(broken);
    expect(resultFor(result, 'phone/managed-resource-compaction').pass).toBe(true);
    expect(resultFor(result, 'phone/managed-resource-plateau').pass).toBe(true);
    expect(resultFor(result, 'phone/bfcache-survival')).toMatchObject({ pass: false });
  });

  it('negative control: bfcache cannot perform another managed-resource compaction', () => {
    const broken = input();
    broken.profiles.phone.bfcache.managedResources.compactionCount++;
    broken.profiles.phone.bfcache.managedResources.compactedSlotCount++;
    const result = evaluateSceneMemory(broken);
    expect(resultFor(result, 'phone/managed-resource-compaction').pass).toBe(true);
    expect(resultFor(result, 'phone/managed-resource-plateau').pass).toBe(true);
    expect(resultFor(result, 'phone/bfcache-survival')).toMatchObject({ pass: false });
  });

  it('semantic controls: managed-resource evidence is exact, safe, and nonvacuous', () => {
    const wrongSchema = input();
    (wrongSchema.profiles.phone.precondition.managedResources as { schema: string }).schema =
      'cf-v2-pixi-managed-resources/v3';
    expect(resultFor(
      evaluateSceneMemory(wrongSchema), 'phone/managed-resource-compaction',
    ).message).toContain('snapshot schema');

    const extraKey = input();
    (extraKey.profiles.phone.precondition.managedResources as unknown as Record<string, unknown>)
      .unexpected = 0;
    expect(resultFor(evaluateSceneMemory(extraKey), 'phone/managed-resource-compaction').message)
      .toContain('snapshot shape');

    const unsafe = input();
    unsafe.profiles.phone.precondition.managedResources.compactionCount =
      Number.MAX_SAFE_INTEGER + 1;
    expect(resultFor(evaluateSceneMemory(unsafe), 'phone/managed-resource-compaction').message)
      .toContain('compactionCount invalid');

    const emptyHashes = input();
    const hashProfile = emptyHashes.profiles.phone;
    for (const measured of [hashProfile.precondition, ...hashProfile.cycles, hashProfile.bfcache]) {
      measured.managedResources.hashCount = 0;
    }
    const hashResult = evaluateSceneMemory(emptyHashes);
    expect(resultFor(hashResult, 'phone/managed-resource-compaction').message)
      .toContain('hash inventory empty');
    expect(resultFor(hashResult, 'phone/managed-resource-plateau').pass).toBe(true);
    expect(resultFor(hashResult, 'phone/bfcache-survival').pass).toBe(true);

    const emptyLive = input();
    const liveProfile = emptyLive.profiles.phone;
    for (const measured of [liveProfile.precondition, ...liveProfile.cycles, liveProfile.bfcache]) {
      measured.managedResources.liveEntryCount = 0;
    }
    const liveResult = evaluateSceneMemory(emptyLive);
    expect(resultFor(liveResult, 'phone/managed-resource-compaction').message)
      .toContain('live inventory empty');
    expect(resultFor(liveResult, 'phone/managed-resource-plateau').pass).toBe(true);
    expect(resultFor(liveResult, 'phone/bfcache-survival').pass).toBe(true);
  });

  it('negative control: registry observation windows must reset in exact sequence', () => {
    const broken = input();
    broken.profiles.phone.cycles[1]!.registry.observationWindow = 1;
    const result = evaluateSceneMemory(broken);
    expect(resultFor(result, 'phone/observation-window-sequence')).toMatchObject({ pass: false });
    expect(resultFor(result, 'phone/warm-resource-plateau').pass).toBe(true);
  });

  it('requires nonzero cycle work and accepts balanced variable reuse work', () => {
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

    const variable = input();
    const variableProfile = variable.profiles.phone;
    for (const measured of variableProfile.cycles.slice(1)) {
      measured.registry.leaseAcquisitions += 8;
      measured.registry.leaseReleases += 8;
    }
    variableProfile.bfcache.sceneGeneration = variableProfile.cycles[3]!.sceneGeneration;
    variableProfile.bfcache.registry = structuredClone(variableProfile.cycles[3]!.registry);
    const variableResult = evaluateSceneMemory(variable);
    expect(resultFor(variableResult, 'phone/cycle-work-deltas')).toMatchObject({ pass: true });
    expect(resultFor(variableResult, 'phone/registry-balance').pass).toBe(true);
    expect(variableResult.status).toBe('pass');
  });

  it('negative control: balanced generation/scope/texture structural drift still fails', () => {
    const broken = input();
    const profile = broken.profiles.phone;
    for (const measured of profile.cycles.slice(1)) {
      measured.sceneGeneration++;
      measured.registry.scopeCreations++;
      measured.registry.scopeDisposals++;
      measured.registry.textureCreations++;
      measured.registry.textureDisposals++;
    }
    profile.bfcache.sceneGeneration = profile.cycles[3]!.sceneGeneration;
    profile.bfcache.registry = structuredClone(profile.cycles[3]!.registry);
    const result = evaluateSceneMemory(broken);
    expect(resultFor(result, 'phone/cycle-work-deltas').message)
      .toContain('structural work deltas differ');
    expect(resultFor(result, 'phone/registry-balance').pass).toBe(true);
    expect(resultFor(result, 'phone/registry-coherence').pass).toBe(true);
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

  it('negative controls: surface vista owners must mount only on surface and release after ascent', () => {
    const workerLeak = input();
    const workerProfile = workerLeak.profiles.phone;
    for (const measured of [
      workerProfile.precondition, ...workerProfile.cycles, workerProfile.bfcache,
    ]) measured.surfaceVistaWorkerActive = true;
    const workerResult = evaluateSceneMemory(workerLeak);
    expect(resultFor(workerResult, 'phone/surface-vista-lifecycle').message)
      .toContain('worker remained active');
    expect(resultFor(workerResult, 'phone/warm-resource-plateau').pass).toBe(true);

    const mountLeak = input();
    mountLeak.profiles.phone.cycles[0]!.surfaceVistaMounted = true;
    const mountResult = evaluateSceneMemory(mountLeak);
    expect(resultFor(mountResult, 'phone/surface-vista-lifecycle').message)
      .toContain('mount state');
    expect(resultFor(mountResult, 'phone/diagnostic-resource-budget').message)
      .toContain('surface vista remained mounted after ascent');

    const missingSurfaceMount = input();
    missingSurfaceMount.profiles.phone.firstSurfaceVista.surfaceVistaMounted = false;
    expect(resultFor(
      evaluateSceneMemory(missingSurfaceMount), 'phone/surface-vista-lifecycle',
    ).message).toContain('first surface: mount state');

    const missingField = input();
    delete (missingField.profiles.phone.precondition as Partial<SceneMemoryPoint>)
      .surfaceVistaMounted;
    expect(resultFor(
      evaluateSceneMemory(missingField), 'phone/surface-vista-lifecycle',
    ).message).toContain('precondition: mount state invalid');
  });

  it('negative controls: the one-entry/412800-pixel vista cache cannot grow or pass vacuously', () => {
    const entries = input();
    entries.profiles.phone.cycles[0]!.surfaceVistaCacheEntries = 2;
    entries.profiles.phone.cycles[0]!.inventory.surface.surfaceVistaCacheEntries = 2;
    expect(resultFor(evaluateSceneMemory(entries), 'phone/surface-vista-lifecycle').message)
      .toContain('cache entries');

    const pixels = input();
    pixels.profiles.phone.firstSurfaceVista.surfaceVistaCachePixels = 412_801;
    expect(resultFor(evaluateSceneMemory(pixels), 'phone/surface-vista-lifecycle').message)
      .toContain('first surface: cache pixels');

    const entryWithoutPixels = input();
    entryWithoutPixels.profiles.phone.firstSurfaceVista.surfaceVistaCachePixels = 0;
    expect(resultFor(
      evaluateSceneMemory(entryWithoutPixels), 'phone/surface-vista-lifecycle',
    ).message).toContain('first surface: cache pixels');

    const pixelsWithoutEntry = input();
    pixelsWithoutEntry.profiles.phone.firstSurfaceVista.surfaceVistaCacheEntries = 0;
    expect(resultFor(
      evaluateSceneMemory(pixelsWithoutEntry), 'phone/surface-vista-lifecycle',
    ).message).toContain('first surface: cache entries');

    const vacuous = input();
    const vacuousProfile = vacuous.profiles.phone;
    vacuousProfile.firstSurfaceVista.surfaceVistaCacheEntries = 0;
    vacuousProfile.firstSurfaceVista.surfaceVistaCachePixels = 0;
    for (const measured of [
      vacuousProfile.precondition, ...vacuousProfile.cycles, vacuousProfile.bfcache,
    ]) {
      measured.surfaceVistaCacheEntries = 0;
      measured.surfaceVistaCachePixels = 0;
    }
    for (const measured of vacuousProfile.cycles) {
      measured.inventory.surface.surfaceVistaCacheEntries = 0;
      measured.inventory.surface.surfaceVistaCachePixels = 0;
    }
    vacuousProfile.reloadCleanup.cacheTransition.before.surfaceVistaCacheEntries = 0;
    vacuousProfile.reloadCleanup.cacheTransition.before.surfaceVistaCachePixels = 0;
    const vacuousResult = evaluateSceneMemory(vacuous);
    expect(resultFor(vacuousResult, 'phone/surface-vista-lifecycle').pass).toBe(false);
    expect(resultFor(vacuousResult, 'phone/warm-resource-plateau').pass).toBe(true);
    expect(resultFor(vacuousResult, 'phone/bfcache-survival').pass).toBe(true);

    const widened = input();
    widened.budgets.phone.surfaceVistaCacheEntriesMax = 2;
    expect(() => evaluateSceneMemory(widened)).toThrow(
      'surface-vista semantic budget must remain exactly 1 entry / 412800 pixels',
    );
  });

  it('negative controls: reload cleanup must bind the positive-to-zero transition and fresh zero', () => {
    const retained = input();
    const cleanup = retained.profiles.phone.reloadCleanup;
    cleanup.cacheTransition.after.surfaceVistaCacheEntries = 1;
    cleanup.cacheTransition.after.surfaceVistaCachePixels = 412_800;
    cleanup.replacement.surfaceVistaCacheEntries = 1;
    cleanup.replacement.surfaceVistaCachePixels = 412_800;
    const retainedResult = evaluateSceneMemory(retained);
    expect(resultFor(retainedResult, 'phone/surface-vista-lifecycle').message)
      .toContain('reload cleanup after: cache entries');
    expect(resultFor(retainedResult, 'phone/surface-vista-lifecycle').message)
      .toContain('reload cleanup replacement: cache entries');

    const coldWasNotZero = input();
    coldWasNotZero.profiles.phone.initialVista.surfaceVistaCacheEntries = 1;
    coldWasNotZero.profiles.phone.initialVista.surfaceVistaCachePixels = 412_800;
    expect(resultFor(
      evaluateSceneMemory(coldWasNotZero), 'phone/surface-vista-lifecycle',
    ).message).toContain('initial universe: cache entries');
  });

  it('negative controls: vista pixels participate in warm and bfcache structural signatures', () => {
    const warmDrift = input();
    warmDrift.profiles.phone.cycles[1]!.surfaceVistaCachePixels = 412_799;
    const warmResult = evaluateSceneMemory(warmDrift);
    expect(resultFor(warmResult, 'phone/surface-vista-lifecycle').pass).toBe(true);
    expect(resultFor(warmResult, 'phone/warm-resource-plateau').pass).toBe(false);

    const bfcacheDrift = input();
    bfcacheDrift.profiles.phone.bfcache.surfaceVistaCachePixels = 412_799;
    const bfcacheResult = evaluateSceneMemory(bfcacheDrift);
    expect(resultFor(bfcacheResult, 'phone/surface-vista-lifecycle').pass).toBe(true);
    expect(resultFor(bfcacheResult, 'phone/bfcache-survival').pass).toBe(false);
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

    const empty = input();
    empty.profiles.phone.cycles[0]!.inventory.sceneObjectsByRoute.shipyard = 0;
    expect(resultFor(evaluateSceneMemory(empty), 'phone/populated-scene'))
      .toMatchObject({ pass: false, message: 'scene proof was empty or vacuous' });
  });

  it('negative control: a future Shipyard claim cannot pass as implemented', () => {
    const broken = input();
    (broken.profiles.phone.cycles[0]!.inventory.shipyard as { status: string }).status =
      'future-arc-1c';
    expect(resultFor(evaluateSceneMemory(broken), 'phone/shipyard-lifecycle').message)
      .toContain('status is not implemented-static');
  });

  it('negative control: the superseded flat future-Shipyard field is rejected', () => {
    const broken = input();
    (broken.profiles.phone.cycles[0]!.inventory as unknown as Record<string, unknown>)
      .shipyardStatus = 'future-arc-1c';
    expect(resultFor(evaluateSceneMemory(broken), 'phone/cycle-inventory'))
      .toMatchObject({ pass: false });
  });

  it('negative control: duplicate active Shipyard previews are rejected', () => {
    const broken = input();
    broken.profiles.phone.cycles[0]!.inventory.shipyard.openPreviewCount = 2;
    expect(resultFor(evaluateSceneMemory(broken), 'phone/shipyard-lifecycle').message)
      .toContain('open preview count must be exactly one');
  });

  it('negative control: preview/canonical visual-state mismatch is rejected', () => {
    const broken = input();
    broken.profiles.phone.cycles[0]!.inventory.shipyard.stateMatch = false;
    expect(resultFor(evaluateSceneMemory(broken), 'phone/shipyard-lifecycle').message)
      .toContain('preview and canonical visual state disagreed');
  });

  it('negative control: a retained preview after real close is rejected', () => {
    const broken = input();
    broken.profiles.phone.cycles[0]!.inventory.shipyard.closedRetainedPreviewCount = 1;
    expect(resultFor(evaluateSceneMemory(broken), 'phone/shipyard-lifecycle').message)
      .toContain('preview retained after close');
  });

  it('negative control: bypassing the visible Shipyard opener is rejected', () => {
    const broken = input();
    broken.profiles.phone.cycles[0]!.inventory.shipyard.openerDriven = false;
    expect(resultFor(evaluateSceneMemory(broken), 'phone/shipyard-lifecycle').message)
      .toContain('open did not use the visible opener');
  });

  it('negative control: bypassing the owned Shipyard close is rejected', () => {
    const broken = input();
    broken.profiles.phone.cycles[0]!.inventory.shipyard.closeDriven = false;
    expect(resultFor(evaluateSceneMemory(broken), 'phone/shipyard-lifecycle').message)
      .toContain('close did not use the owned close control');
  });

  it('negative control: settled point diagnostics cannot hide a Shipyard preview leak', () => {
    const broken = input();
    broken.profiles.phone.cycles[0]!.shipyardPreviewActiveCount = 1;
    broken.profiles.phone.cycles[0]!.pending = 1;
    const result = evaluateSceneMemory(broken);
    expect(resultFor(result, 'phone/diagnostic-resource-budget').message)
      .toContain('settled Shipyard preview must be inactive');
    expect(resultFor(result, 'phone/pending-zero')).toMatchObject({ pass: false });
  });

  it('negative control: an identical retained Shipyard leak at every point stays red', () => {
    const broken = input();
    const profile = broken.profiles.phone;
    for (const measured of [profile.precondition, ...profile.cycles, profile.bfcache]) {
      measured.shipyardPreviewRetainedCount = 1;
      measured.pending = 1;
    }
    const result = evaluateSceneMemory(broken);
    expect(resultFor(result, 'phone/warm-resource-plateau').pass).toBe(true);
    expect(resultFor(result, 'phone/diagnostic-resource-budget').message)
      .toContain('settled Shipyard preview retained resources');
    expect(resultFor(result, 'phone/pending-zero')).toMatchObject({ pass: false });
    expect(result.status).toBe('fail');
  });

  it('negative control: a stale Shipyard diagnostic schema cannot be judged as current', () => {
    const broken = input();
    (broken.profiles.phone.precondition as { shipyardDiagnosticsSchema: string })
      .shipyardDiagnosticsSchema = 'cf-v2-shipyard-diagnostics/v0';
    expect(resultFor(evaluateSceneMemory(broken), 'phone/diagnostic-resource-budget').message)
      .toContain('Shipyard diagnostics schema');
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

  it('negative control: monotonic backing growth fails positive heap slope independently', () => {
    const broken = input();
    broken.profiles.phone.cycles.forEach((measured, index) => {
      measured.heap.backingStorageSize += index * 15;
    });
    const result = evaluateSceneMemory(broken);
    expect(resultFor(result, 'phone/heap-plateau')).toMatchObject({ pass: false });
    expect(resultFor(result, 'phone/heap-dom-budget').pass).toBe(true);
    expect(resultFor(result, 'phone/warm-resource-plateau').pass).toBe(true);

    broken.budgets.phone.warmHeapSlopeBytesPerCycleMax = 25;
    expect(resultFor(evaluateSceneMemory(broken), 'phone/heap-plateau').pass).toBe(true);
  });

  it('negative control: a transient heap spike fails range with a nonpositive slope', () => {
    const broken = input();
    broken.profiles.phone.cycles[1]!.heap.usedSize += 150;
    const result = evaluateSceneMemory(broken);
    expect(resultFor(result, 'phone/heap-plateau')).toMatchObject({ pass: false });
    expect(resultFor(result, 'phone/heap-dom-budget').pass).toBe(true);
    expect(resultFor(result, 'phone/warm-resource-plateau').pass).toBe(true);

    broken.budgets.phone.warmHeapAggregateRangeBytesMax = 200;
    expect(resultFor(evaluateSceneMemory(broken), 'phone/heap-plateau').pass).toBe(true);
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

  it('diagnoses each heap and DOM ceiling with exact field, value, and limit', () => {
    const controls = [
      {
        name: 'V8 heap used bytes',
        values: (fixture: SceneMemoryInput) => ({
          ceiling: fixture.budgets.phone.heapUsedBytesMax,
          set: (value: number) => { fixture.profiles.phone.precondition.heap.usedSize = value; },
        }),
      },
      {
        name: 'embedder heap used bytes',
        values: (fixture: SceneMemoryInput) => ({
          ceiling: fixture.budgets.phone.embedderHeapUsedBytesMax,
          set: (value: number) => { fixture.profiles.phone.precondition.heap.embedderHeapUsedSize = value; },
        }),
      },
      {
        name: 'backing storage bytes',
        values: (fixture: SceneMemoryInput) => ({
          ceiling: fixture.budgets.phone.backingStorageBytesMax,
          set: (value: number) => { fixture.profiles.phone.precondition.heap.backingStorageSize = value; },
        }),
      },
      {
        name: 'aggregate heap bytes',
        values: (fixture: SceneMemoryInput) => {
          fixture.budgets.phone.heapUsedBytesMax = 20_000;
          const heap = fixture.profiles.phone.precondition.heap;
          return {
            ceiling: fixture.budgets.phone.heapAggregateBytesMax,
            set: (value: number) => {
              heap.usedSize = value - heap.embedderHeapUsedSize - heap.backingStorageSize;
            },
          };
        },
      },
      {
        name: 'documents',
        values: (fixture: SceneMemoryInput) => ({
          ceiling: fixture.budgets.phone.documentsMax,
          set: (value: number) => { fixture.profiles.phone.precondition.dom.documents = value; },
        }),
      },
      {
        name: 'nodes',
        values: (fixture: SceneMemoryInput) => ({
          ceiling: fixture.budgets.phone.nodesMax,
          set: (value: number) => { fixture.profiles.phone.precondition.dom.nodes = value; },
        }),
      },
      {
        name: 'JS event listeners',
        values: (fixture: SceneMemoryInput) => ({
          ceiling: fixture.budgets.phone.jsEventListenersMax,
          set: (value: number) => {
            fixture.profiles.phone.precondition.dom.jsEventListeners = value;
          },
        }),
      },
    ] as const;

    for (const control of controls) {
      const exact = input();
      const exactValues = control.values(exact);
      exactValues.set(Math.floor(exactValues.ceiling));
      expect(resultFor(evaluateSceneMemory(exact), 'phone/heap-dom-budget').pass,
        `${control.name} exact ceiling`).toBe(true);

      const next = input();
      const nextValues = control.values(next);
      const actual = Math.floor(nextValues.ceiling) + 1;
      nextValues.set(actual);
      const finding = resultFor(evaluateSceneMemory(next), 'phone/heap-dom-budget');
      expect(finding.pass, `${control.name} next unit`).toBe(false);
      expect(finding.message).toContain(
        `precondition: ${control.name} ${actual} exceeded ceiling ${nextValues.ceiling}`,
      );
    }
  });

  it('diagnoses absent heap and DOM counters instead of collapsing them into one generic red', () => {
    const broken = input() as unknown as {
      profiles: { phone: { precondition: { heap?: unknown; dom?: unknown } } };
    };
    delete broken.profiles.phone.precondition.heap;
    delete broken.profiles.phone.precondition.dom;
    const finding = resultFor(
      evaluateSceneMemory(broken as unknown as SceneMemoryInput),
      'phone/heap-dom-budget',
    );
    expect(finding.message).toContain('precondition: heap counters are absent or invalid');
    expect(finding.message).toContain('precondition: DOM counters are absent or invalid');
  });

  it('retains the prior contract acceptance of valid zero-valued heap components', () => {
    const fixture = input();
    for (const point of [fixture.profiles.phone.precondition, ...fixture.profiles.phone.cycles]) {
      point.heap.usedSize = 0;
      point.heap.embedderHeapUsedSize = 0;
      point.heap.backingStorageSize = 0;
    }
    const finding = resultFor(evaluateSceneMemory(fixture), 'phone/heap-dom-budget');
    expect(finding).toEqual({
      id: 'phone/heap-dom-budget',
      pass: true,
      message: 'heap and DOM counters stayed within supplied ceilings',
    });
  });

  it('rejects an incomplete budget instead of silently dropping a ceiling', () => {
    const broken = input() as unknown as { budgets: { phone: Record<string, number> } };
    delete broken.budgets.phone.nodesMax;
    expect(() => evaluateSceneMemory(broken as unknown as SceneMemoryInput))
      .toThrow('phone scene-memory budget is incomplete or invalid');
  });
});
