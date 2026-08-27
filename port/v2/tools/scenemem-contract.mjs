/* Browser-free Arc 1C scene-memory verdicts. The CDP collector owns
   measurement; this module only judges a complete, explicit inventory. */

export const SCENE_MEMORY_CYCLE_COUNT = 4;
export const SCENE_MEMORY_ROUTES = Object.freeze([
  'universe', 'galaxy', 'galaxy-fine', 'system', 'surface', 'compendium', 'shipyard',
]);
export const SCENE_TEXTURE_KINDS = Object.freeze([
  'scene-canvas', 'galaxy-haze', 'planet-texture',
  'ring-texture', 'surface-cloud', 'star-surface',
]);

const PROFILES = Object.freeze(['phone', 'desktop']);
const BUDGET_FIELDS = Object.freeze([
  'heapUsedBytesMax', 'embedderHeapUsedBytesMax', 'backingStorageBytesMax',
  'heapAggregateBytesMax', 'warmHeapAggregateRangeBytesMax',
  'warmHeapSlopeBytesPerCycleMax',
  'documentsMax', 'nodesMax', 'jsEventListenersMax',
  'peakActiveLeaseCountMax', 'peakLiveTextureCountMax', 'peakLiveCanvasBytesMax',
  'managedTextureCountMax', 'managedTexturePixelsMax', 'localCanvasCacheEntriesMax',
  'peakLocalCanvasCacheEntriesMax', 'productRenderTargetsMax',
  'ringCacheEntriesMax', 'peakRingGeometryEntriesMax',
  'targetElapsedMsMax', 'heartbeatElapsedMsMax',
]);
const MANAGED_RESOURCE_FIELDS = Object.freeze([
  'schema', 'valid', 'hashCount', 'hashes', 'liveEntryCount', 'clearedEntryCount',
  'compactionCount', 'compactedSlotCount', 'faultCount',
]);
const MANAGED_RESOURCE_HASH_FIELDS = Object.freeze([
  'name', 'type', 'liveEntryCount', 'clearedEntryCount',
]);
const MANAGED_RESOURCE_COUNT_FIELDS = Object.freeze([
  'hashCount', 'liveEntryCount', 'clearedEntryCount',
  'compactionCount', 'compactedSlotCount', 'faultCount',
]);
const SHIPYARD_WITNESS_FIELDS = Object.freeze([
  'status', 'openerDriven', 'closeDriven', 'stateKey', 'stateMatch',
  'openPreviewCount', 'openRetainedPreviewCount', 'openPendingPreviewWork',
  'closedPreviewCount', 'closedRetainedPreviewCount', 'closedPendingPreviewWork',
]);
const CYCLE_INVENTORY_FIELDS = Object.freeze([
  'routes', 'shipyard', 'sceneObjectsByRoute', 'fine', 'surface',
]);
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const count = (value) => Number.isSafeInteger(value) && value >= 0;
const finite = (value) => Number.isFinite(value) && value >= 0;
const nonempty = (value) => typeof value === 'string' && value.length > 0;
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const exactKeys = (value, keys) => object(value)
  && same(Object.keys(value).sort(), [...keys].sort());

function outcome(id, pass, message, details = undefined) {
  return Object.freeze({ id, pass, message, ...(details === undefined ? {} : { details }) });
}

function assertBudget(profile, budget) {
  if (!exactKeys(budget, BUDGET_FIELDS)
    || BUDGET_FIELDS.some((field) => !finite(budget[field]))) {
    throw new TypeError(`${profile} scene-memory budget is incomplete or invalid`);
  }
  if (budget.targetElapsedMsMax <= 0 || budget.heartbeatElapsedMsMax <= 0) {
    throw new TypeError(`${profile} answerability deadlines must be positive`);
  }
}

function kindCounts(value) {
  return exactKeys(value, SCENE_TEXTURE_KINDS)
    && SCENE_TEXTURE_KINDS.every((kind) => count(value[kind]));
}

function registryBalanceReasons(registry) {
  if (!object(registry)) return ['registry absent'];
  const reasons = [];
  const fields = [
    'observationWindow',
    'scopeCreations', 'scopeDisposals', 'activeScopeCount',
    'leaseAcquisitions', 'leaseReleases', 'activeLeaseCount',
    'textureCreations', 'textureDisposals', 'liveTextureCount',
  ];
  for (const field of fields) if (!count(registry[field])) reasons.push(`${field} invalid`);
  if (registry.balanced !== true) reasons.push('balanced flag');
  if (registry.activeScopeCount !== 1) reasons.push('settled active scope count');
  if (registry.scopeCreations - registry.scopeDisposals !== registry.activeScopeCount) {
    reasons.push('scope equation');
  }
  if (registry.leaseAcquisitions - registry.leaseReleases !== registry.activeLeaseCount) {
    reasons.push('lease equation');
  }
  if (registry.textureCreations - registry.textureDisposals !== registry.liveTextureCount) {
    reasons.push('texture equation');
  }
  if (!Array.isArray(registry.activeScopes)
    || registry.activeScopes.length !== registry.activeScopeCount) {
    reasons.push('active scope inventory');
  } else {
    let leases = 0;
    for (const scope of registry.activeScopes) {
      if (!object(scope) || typeof scope.label !== 'string' || scope.label.length === 0
        || !count(scope.leaseCount) || scope.closed !== false) {
        reasons.push('active scope shape');
        continue;
      }
      leases += scope.leaseCount;
    }
    if (leases !== registry.activeLeaseCount) reasons.push('scope lease inventory');
  }
  return reasons;
}

function registryCoherenceReasons(registry) {
  if (!object(registry)) return ['registry absent'];
  const reasons = [];
  if (registry.schema !== 'cf-v2-scene-textures/v2') reasons.push('registry schema');
  if (registry.coherent !== true) reasons.push('coherent flag');
  if (registry.externalDestroyFaults !== 0) reasons.push('external destroy fault');
  for (const field of [
    'liveCanvasPixels', 'liveCanvasBytes', 'peakActiveLeaseCount',
    'peakLiveTextureCount', 'peakLiveCanvasPixels', 'peakLiveCanvasBytes',
    'lifetimePeakActiveLeaseCount', 'lifetimePeakLiveTextureCount',
    'lifetimePeakLiveCanvasPixels',
  ]) if (!count(registry[field])) reasons.push(`${field} invalid`);
  if (registry.liveCanvasBytes !== registry.liveCanvasPixels * 4) reasons.push('live canvas bytes');
  if (registry.peakLiveCanvasBytes !== registry.peakLiveCanvasPixels * 4) {
    reasons.push('peak canvas bytes');
  }
  if (registry.lifetimePeakActiveLeaseCount < registry.peakActiveLeaseCount
    || registry.lifetimePeakLiveTextureCount < registry.peakLiveTextureCount
    || registry.lifetimePeakLiveCanvasPixels < registry.peakLiveCanvasPixels) {
    reasons.push('lifetime peak below observation peak');
  }
  if (!kindCounts(registry.liveLeasesByKind)) reasons.push('lease kinds');
  if (!kindCounts(registry.liveTexturesByKind)) reasons.push('texture kinds');
  if (kindCounts(registry.liveLeasesByKind)
    && SCENE_TEXTURE_KINDS.reduce((sum, kind) => sum + registry.liveLeasesByKind[kind], 0)
      !== registry.activeLeaseCount) reasons.push('lease kind total');
  if (kindCounts(registry.liveTexturesByKind)
    && SCENE_TEXTURE_KINDS.reduce((sum, kind) => sum + registry.liveTexturesByKind[kind], 0)
      !== registry.liveTextureCount) reasons.push('texture kind total');
  if (count(registry.liveTextureCount) && count(registry.activeLeaseCount)
    && registry.liveTextureCount > registry.activeLeaseCount) reasons.push('texture without lease');
  if (kindCounts(registry.liveLeasesByKind) && kindCounts(registry.liveTexturesByKind)) {
    for (const kind of SCENE_TEXTURE_KINDS) {
      if (registry.liveTexturesByKind[kind] > registry.liveLeasesByKind[kind]) {
        reasons.push(`${kind} texture without lease`);
      }
    }
  }
  return reasons;
}

function managedResourceSnapshotReasons(snapshot) {
  if (!object(snapshot)) return ['snapshot absent'];
  const reasons = [];
  if (!exactKeys(snapshot, MANAGED_RESOURCE_FIELDS)) reasons.push('snapshot shape');
  if (snapshot.schema !== 'cf-v2-pixi-managed-resources/v2') reasons.push('snapshot schema');
  if (snapshot.valid !== true) reasons.push('adapter invalid');
  for (const field of MANAGED_RESOURCE_COUNT_FIELDS) {
    if (!count(snapshot[field])) reasons.push(`${field} invalid`);
  }
  if (!count(snapshot.hashCount) || snapshot.hashCount === 0) reasons.push('hash inventory empty');
  if (!Array.isArray(snapshot.hashes) || snapshot.hashes.length !== snapshot.hashCount) {
    reasons.push('per-hash inventory incomplete');
  } else {
    const identities = new Set();
    const identityOrder = [];
    let liveEntryCount = 0;
    let clearedEntryCount = 0;
    for (const hash of snapshot.hashes) {
      if (!exactKeys(hash, MANAGED_RESOURCE_HASH_FIELDS)
        || !nonempty(hash.name) || hash.name.trim() !== hash.name
        || (hash.type !== 'resource' && hash.type !== 'renderable')
        || !count(hash.liveEntryCount) || !count(hash.clearedEntryCount)) {
        reasons.push('per-hash entry invalid');
        continue;
      }
      const identity = `${hash.type}\u0000${hash.name}`;
      if (identities.has(identity)) reasons.push('per-hash identity duplicated');
      identities.add(identity);
      identityOrder.push(identity);
      liveEntryCount += hash.liveEntryCount;
      clearedEntryCount += hash.clearedEntryCount;
      if (hash.clearedEntryCount !== 0) reasons.push(`${hash.name} retained cleared entries`);
    }
    if (!same(identityOrder, [...identityOrder].sort())) {
      reasons.push('per-hash inventory is not canonical');
    }
    if (liveEntryCount !== snapshot.liveEntryCount) reasons.push('per-hash live total mismatch');
    if (clearedEntryCount !== snapshot.clearedEntryCount) {
      reasons.push('per-hash cleared total mismatch');
    }
  }
  if (!count(snapshot.liveEntryCount) || snapshot.liveEntryCount === 0) {
    reasons.push('live inventory empty');
  }
  if (snapshot.clearedEntryCount !== 0) reasons.push('cleared entries remained');
  if (!count(snapshot.compactionCount) || snapshot.compactionCount === 0) {
    reasons.push('compaction witness absent');
  }
  if (!count(snapshot.compactedSlotCount) || snapshot.compactedSlotCount === 0) {
    reasons.push('compacted-slot witness absent');
  }
  if (snapshot.faultCount !== 0) reasons.push('adapter fault');
  return reasons;
}

function managedResourceProgressReasons(precondition, cycles) {
  if (!object(precondition?.managedResources)
    || cycles.length !== SCENE_MEMORY_CYCLE_COUNT
    || cycles.some((cycle) => !object(cycle?.managedResources))) {
    return ['precondition/cycle compaction sequence incomplete'];
  }
  const points = [precondition, ...cycles];
  const reasons = [];
  for (let index = 1; index < points.length; index++) {
    const before = points[index - 1].managedResources;
    const after = points[index].managedResources;
    const compactionDelta = after.compactionCount - before.compactionCount;
    const compactedSlotDelta = after.compactedSlotCount - before.compactedSlotCount;
    if (!Number.isSafeInteger(compactionDelta) || compactionDelta <= 0) {
      reasons.push(`cycle ${index}: compaction count did not advance`);
    }
    if (!Number.isSafeInteger(compactedSlotDelta) || compactedSlotDelta <= 0) {
      reasons.push(`cycle ${index}: compacted slot count did not advance`);
    }
  }
  return reasons;
}

function managedResourceStructuralSignature(snapshot) {
  return {
    hashCount: snapshot?.hashCount,
    hashes: snapshot?.hashes,
    liveEntryCount: snapshot?.liveEntryCount,
    clearedEntryCount: snapshot?.clearedEntryCount,
    faultCount: snapshot?.faultCount,
  };
}

function shipyardWitnessReasons(witness) {
  if (!object(witness)) return ['witness absent'];
  const reasons = [];
  if (!exactKeys(witness, SHIPYARD_WITNESS_FIELDS)) reasons.push('witness shape');
  if (witness.status !== 'implemented-static') reasons.push('status is not implemented-static');
  if (witness.openerDriven !== true) reasons.push('open did not use the visible opener');
  if (witness.closeDriven !== true) reasons.push('close did not use the owned close control');
  if (!nonempty(witness.stateKey) || witness.stateKey.trim() !== witness.stateKey) {
    reasons.push('visual state key absent or noncanonical');
  }
  if (witness.stateMatch !== true) reasons.push('preview and canonical visual state disagreed');
  for (const field of [
    'openPreviewCount', 'openRetainedPreviewCount', 'openPendingPreviewWork',
    'closedPreviewCount', 'closedRetainedPreviewCount', 'closedPendingPreviewWork',
  ]) if (!count(witness[field])) reasons.push(`${field} invalid`);
  if (witness.openPreviewCount !== 1) reasons.push('open preview count must be exactly one');
  if (witness.openRetainedPreviewCount !== 0) reasons.push('open retained preview count must be zero');
  if (witness.openPendingPreviewWork !== 0) reasons.push('open preview work did not settle');
  if (witness.closedPreviewCount !== 0) reasons.push('closed preview count must be zero');
  if (witness.closedRetainedPreviewCount !== 0) reasons.push('preview retained after close');
  if (witness.closedPendingPreviewWork !== 0) reasons.push('closed preview work did not settle');
  return reasons;
}

function liveSignature(point) {
  const registry = point?.registry;
  return {
    activeScopeCount: registry?.activeScopeCount,
    activeLeaseCount: registry?.activeLeaseCount,
    liveTextureCount: registry?.liveTextureCount,
    liveCanvasPixels: registry?.liveCanvasPixels,
    liveCanvasBytes: registry?.liveCanvasBytes,
    liveLeasesByKind: SCENE_TEXTURE_KINDS.map((kind) => registry?.liveLeasesByKind?.[kind]),
    liveTexturesByKind: SCENE_TEXTURE_KINDS.map((kind) => registry?.liveTexturesByKind?.[kind]),
    managedTextureCount: point?.managedTextureCount,
    managedTexturePixels: point?.managedTexturePixels,
    managedTextureClearedSlots: point?.managedTextureClearedSlots,
    sceneTextStyleUpdateListeners: point?.sceneTextStyleUpdateListeners,
    localCanvasCacheEntries: point?.localCanvasCacheEntries,
    peakLocalCanvasCacheEntries: point?.peakLocalCanvasCacheEntries,
    productRenderTargets: point?.productRenderTargets,
    retiredFineOwnerCount: point?.retiredFineOwnerCount,
    shipyardDiagnosticsSchema: point?.shipyardDiagnosticsSchema,
    shipyardPreviewStatus: point?.shipyardPreviewStatus,
    shipyardPreviewStateKey: point?.shipyardPreviewStateKey,
    shipyardPreviewActiveCount: point?.shipyardPreviewActiveCount,
    shipyardPreviewRetainedCount: point?.shipyardPreviewRetainedCount,
    shipyardPreviewPendingWork: point?.shipyardPreviewPendingWork,
    pending: point?.pending,
    ringCacheEntries: point?.ringCacheEntries,
    peakRingGeometryEntries: point?.peakRingGeometryEntries,
  };
}

function warmSignature(cycle) {
  const registry = cycle?.registry;
  return {
    ...liveSignature(cycle),
    peakActiveLeaseCount: registry?.peakActiveLeaseCount,
    peakLiveTextureCount: registry?.peakLiveTextureCount,
    peakLiveCanvasPixels: registry?.peakLiveCanvasPixels,
    peakLiveCanvasBytes: registry?.peakLiveCanvasBytes,
    sceneObjectsByRoute: SCENE_MEMORY_ROUTES.map(
      (route) => cycle?.inventory?.sceneObjectsByRoute?.[route],
    ),
    shipyard: cycle?.inventory?.shipyard,
    documents: cycle?.dom?.documents,
    nodes: cycle?.dom?.nodes,
    jsEventListeners: cycle?.dom?.jsEventListeners,
  };
}

function cumulativeRegistrySignature(registry) {
  return {
    observationWindow: registry?.observationWindow,
    scopeCreations: registry?.scopeCreations,
    scopeDisposals: registry?.scopeDisposals,
    leaseAcquisitions: registry?.leaseAcquisitions,
    leaseReleases: registry?.leaseReleases,
    textureCreations: registry?.textureCreations,
    textureDisposals: registry?.textureDisposals,
    lifetimePeakActiveLeaseCount: registry?.lifetimePeakActiveLeaseCount,
    lifetimePeakLiveTextureCount: registry?.lifetimePeakLiveTextureCount,
    lifetimePeakLiveCanvasPixels: registry?.lifetimePeakLiveCanvasPixels,
    externalDestroyFaults: registry?.externalDestroyFaults,
  };
}

const WORK_FIELDS = Object.freeze([
  'sceneGeneration', 'scopeCreations', 'scopeDisposals',
  'leaseAcquisitions', 'leaseReleases', 'textureCreations', 'textureDisposals',
]);

function workCounters(point) {
  return {
    sceneGeneration: point?.sceneGeneration,
    scopeCreations: point?.registry?.scopeCreations,
    scopeDisposals: point?.registry?.scopeDisposals,
    leaseAcquisitions: point?.registry?.leaseAcquisitions,
    leaseReleases: point?.registry?.leaseReleases,
    textureCreations: point?.registry?.textureCreations,
    textureDisposals: point?.registry?.textureDisposals,
  };
}

function cycleWorkReasons(precondition, cycles) {
  const points = [precondition, ...cycles];
  if (points.length !== SCENE_MEMORY_CYCLE_COUNT + 1
    || points.some((point) => WORK_FIELDS.some((field) => !count(workCounters(point)[field])))) {
    return ['precondition/cycle work counters invalid'];
  }
  const structuralDeltas = [];
  for (let index = 1; index < points.length; index++) {
    const before = workCounters(points[index - 1]);
    const after = workCounters(points[index]);
    const delta = Object.fromEntries(WORK_FIELDS.map((field) => [field, after[field] - before[field]]));
    if (WORK_FIELDS.some((field) => !Number.isSafeInteger(delta[field]) || delta[field] <= 0)) {
      return [`cycle ${index}: work delta must be positive`];
    }
    if (delta.scopeCreations !== delta.scopeDisposals
      || delta.leaseAcquisitions !== delta.leaseReleases
      || delta.textureCreations !== delta.textureDisposals) {
      return [`cycle ${index}: creation/release work delta is unbalanced`];
    }
    if (delta.leaseAcquisitions < delta.textureCreations) {
      return [`cycle ${index}: lease work did not cover texture creation`];
    }
    structuralDeltas.push({
      sceneGeneration: delta.sceneGeneration,
      scopeCreations: delta.scopeCreations,
      scopeDisposals: delta.scopeDisposals,
      textureCreations: delta.textureCreations,
      textureDisposals: delta.textureDisposals,
    });
  }
  return structuralDeltas.every((delta) => same(delta, structuralDeltas[0]))
    ? [] : ['cycle structural work deltas differ'];
}

function answerabilityReasons(value, budget, documentToken) {
  if (!object(value)) return ['answerability witness absent'];
  const reasons = [];
  const target = value.target;
  if (!object(target) || target.ok !== true) reasons.push('target failed');
  else {
    if (!finite(target.elapsedMs) || target.elapsedMs >= budget.targetElapsedMsMax) {
      reasons.push('target deadline');
    }
    if (target.laterTicker !== true || !count(target.tickerBefore)
      || !count(target.tickerAfter) || target.tickerAfter <= target.tickerBefore) {
      reasons.push('target later ticker');
    }
    if (!nonempty(documentToken) || !nonempty(target.documentTokenBefore)
      || target.documentTokenBefore !== documentToken
      || target.documentTokenAfter !== target.documentTokenBefore) {
      reasons.push('target document token');
    }
  }
  const heartbeat = value.heartbeat;
  if (!object(heartbeat) || heartbeat.ok !== true) reasons.push('heartbeat failed');
  else {
    if (!finite(heartbeat.elapsedMs) || heartbeat.elapsedMs >= budget.heartbeatElapsedMsMax) {
      reasons.push('heartbeat deadline');
    }
    if (heartbeat.independent !== true) reasons.push('heartbeat not independent');
    if (!nonempty(heartbeat.product) || !nonempty(heartbeat.protocolVersion)) {
      reasons.push('heartbeat identity');
    }
  }
  return reasons;
}

function heapAggregate(point) {
  const heap = point?.heap;
  if (!object(heap) || !finite(heap.usedSize) || !finite(heap.embedderHeapUsedSize)
    || !finite(heap.backingStorageSize)) return Number.POSITIVE_INFINITY;
  return heap.usedSize + heap.embedderHeapUsedSize + heap.backingStorageSize;
}

function heapDomBudgetReasons(pointsWithLabels, budget) {
  const reasons = [];
  const check = (label, name, value, ceiling, valid) => {
    if (!valid(value)) reasons.push(`${label}: ${name} is absent or invalid`);
    else if (value > ceiling) reasons.push(`${label}: ${name} ${value} exceeded ceiling ${ceiling}`);
  };
  const heapCounter = (value) => finite(value) && value >= 0;
  const domCounter = (value) => count(value) && value > 0;
  for (const [label, point] of pointsWithLabels) {
    const heap = point?.heap;
    if (!object(heap)) {
      reasons.push(`${label}: heap counters are absent or invalid`);
    } else {
      check(label, 'V8 heap used bytes', heap.usedSize, budget.heapUsedBytesMax, heapCounter);
      check(label, 'embedder heap used bytes', heap.embedderHeapUsedSize,
        budget.embedderHeapUsedBytesMax, heapCounter);
      check(label, 'backing storage bytes', heap.backingStorageSize,
        budget.backingStorageBytesMax, heapCounter);
      const aggregate = heapAggregate(point);
      if (finite(aggregate) && aggregate > budget.heapAggregateBytesMax) {
        reasons.push(`${label}: aggregate heap bytes ${aggregate} exceeded ceiling ${budget.heapAggregateBytesMax}`);
      }
    }
    const dom = point?.dom;
    if (!object(dom)) {
      reasons.push(`${label}: DOM counters are absent or invalid`);
    } else {
      check(label, 'documents', dom.documents, budget.documentsMax, domCounter);
      check(label, 'nodes', dom.nodes, budget.nodesMax, domCounter);
      check(label, 'JS event listeners', dom.jsEventListeners,
        budget.jsEventListenersMax, domCounter);
    }
  }
  return reasons;
}

function leastSquaresSlope(values) {
  if (!Array.isArray(values) || values.length !== SCENE_MEMORY_CYCLE_COUNT
    || values.some((value) => !finite(value))) return Number.POSITIVE_INFINITY;
  const xMean = (values.length - 1) / 2;
  const yMean = values.reduce((sum, value) => sum + value, 0) / values.length;
  let numerator = 0;
  let denominator = 0;
  for (let index = 0; index < values.length; index++) {
    const xDelta = index - xMean;
    numerator += xDelta * (values[index] - yMean);
    denominator += xDelta * xDelta;
  }
  return denominator > 0 ? numerator / denominator : Number.POSITIVE_INFINITY;
}

function maximumPositiveHeapSlope(cycles) {
  const series = [
    cycles.map((cycle) => cycle?.heap?.usedSize),
    cycles.map((cycle) => cycle?.heap?.embedderHeapUsedSize),
    cycles.map((cycle) => cycle?.heap?.backingStorageSize),
    cycles.map(heapAggregate),
  ];
  return Math.max(0, ...series.map(leastSquaresSlope));
}

function diagnosticResourceReasons(point, budget) {
  if (!object(point)) return ['resource point absent'];
  const reasons = [];
  for (const field of [
    'managedTextureCount', 'managedTexturePixels', 'managedTextureClearedSlots',
    'localCanvasCacheEntries', 'peakLocalCanvasCacheEntries',
    'productRenderTargets', 'retiredFineOwnerCount',
    'shipyardPreviewActiveCount', 'shipyardPreviewRetainedCount',
    'shipyardPreviewPendingWork',
  ]) if (!count(point[field])) reasons.push(`${field} invalid`);
  if (point.shipyardDiagnosticsSchema !== 'cf-v2-shipyard-diagnostics/v1') {
    reasons.push('Shipyard diagnostics schema');
  }
  if (point.shipyardPreviewStatus !== 'closed') reasons.push('settled Shipyard status must be closed');
  if (point.shipyardPreviewStateKey !== null) reasons.push('settled Shipyard state key must be null');
  /* Pixi's deprecated managedTextures inventory is deliberately secondary:
     it also includes backdrop/Text/Graphics sources and may exclude a culled
     product canvas that has not uploaded. The named registry is the ownership
     authority; this independent renderer proxy is bounded, not equated. */
  if (point.managedTextureCount > budget.managedTextureCountMax) {
    reasons.push('managed texture count exceeded budget');
  }
  if (point.managedTexturePixels > budget.managedTexturePixelsMax) {
    reasons.push('managed texture pixels exceeded budget');
  }
  if (point.localCanvasCacheEntries !== 0
    || point.localCanvasCacheEntries > budget.localCanvasCacheEntriesMax) {
    reasons.push('settled local canvas cache must be empty');
  }
  if (point.peakLocalCanvasCacheEntries > budget.peakLocalCanvasCacheEntriesMax) {
    reasons.push('peak local canvas cache exceeded budget');
  }
  if (point.peakLocalCanvasCacheEntries === 0) {
    reasons.push('peak local canvas cache lacked Sol route witness');
  }
  if (point.productRenderTargets !== 0
    || point.productRenderTargets > budget.productRenderTargetsMax) {
    reasons.push('product render targets must remain zero');
  }
  if (point.retiredFineOwnerCount !== 0) reasons.push('retired fine owners must remain zero');
  if (point.shipyardPreviewActiveCount !== 0) reasons.push('settled Shipyard preview must be inactive');
  if (point.shipyardPreviewRetainedCount !== 0) reasons.push('settled Shipyard preview retained resources');
  if (point.shipyardPreviewPendingWork !== 0) reasons.push('settled Shipyard preview work remained');
  return reasons;
}

function profileOutcomes(profile, measurement, budget) {
  const out = [];
  const precondition = measurement?.precondition;
  const cycles = Array.isArray(measurement?.cycles) ? measurement.cycles : [];
  const bfcache = measurement?.bfcache;
  const preconditionOk = object(precondition) && count(precondition.sceneGeneration)
    && nonempty(precondition.documentToken)
    && precondition.registry?.observationWindow === 0
    && cycles.length === SCENE_MEMORY_CYCLE_COUNT
    && cycles.every((cycle) => cycle?.documentToken === precondition.documentToken);
  out.push(outcome(`${profile}/measurement-precondition`, preconditionOk,
    preconditionOk
      ? 'explicit window-zero precondition and stable document present'
      : 'precondition was absent, not reset, or changed documents'));

  const complete = cycles.length === SCENE_MEMORY_CYCLE_COUNT
    && cycles.every((cycle, index) => cycle?.cycle === index + 1
      && exactKeys(cycle?.inventory, CYCLE_INVENTORY_FIELDS)
      && same(cycle?.inventory?.routes, SCENE_MEMORY_ROUTES));
  out.push(outcome(`${profile}/cycle-inventory`, complete,
    complete ? 'four ordered route inventories present' : 'expected four exact travel inventories'));

  const shipyardReasons = cycles.flatMap((cycle, index) =>
    shipyardWitnessReasons(cycle?.inventory?.shipyard)
      .map((reason) => `cycle ${index + 1}: ${reason}`));
  out.push(outcome(`${profile}/shipyard-lifecycle`, shipyardReasons.length === 0,
    shipyardReasons.length
      ? shipyardReasons.join('; ')
      : 'visible opener, exact visual state, one preview, and owned close lifecycle agree'));

  const observationSequence = object(precondition) && precondition.registry?.observationWindow === 0
    && cycles.length === SCENE_MEMORY_CYCLE_COUNT
    && cycles.every((cycle, index) => cycle?.registry?.observationWindow === index + 1)
    && bfcache?.registry?.observationWindow === SCENE_MEMORY_CYCLE_COUNT;
  out.push(outcome(`${profile}/observation-window-sequence`, observationSequence,
    observationSequence
      ? 'registry observation window reset once before every measured cycle'
      : 'registry observation window was skipped, repeated, or reset after measurement'));

  const workReasons = cycleWorkReasons(precondition, cycles);
  out.push(outcome(`${profile}/cycle-work-deltas`, workReasons.length === 0,
    workReasons.length
      ? workReasons.join('; ')
      : 'all four cycles performed equal structural work with balanced lease reuse'));

  const plateau = cycles.length === SCENE_MEMORY_CYCLE_COUNT
    && cycles.every((cycle) => same(warmSignature(cycle), warmSignature(cycles[0])))
    && cycles.every((cycle) => cycle?.registry?.activeScopeCount === 1
      && cycle?.retiredFineOwnerCount === 0);
  out.push(outcome(`${profile}/warm-resource-plateau`, plateau,
    plateau
      ? 'all four measured cycles have an exact settled resource plateau'
      : 'measured resource inventory drifted or retained an extra owner'));

  const registries = [['precondition', precondition?.registry]]
    .concat(cycles.map((cycle, index) => [`cycle ${index + 1}`, cycle?.registry]))
    .concat([['bfcache', bfcache?.registry]]);
  const balance = registries.flatMap(([label, registry]) =>
    registryBalanceReasons(registry).map((reason) => `${label}: ${reason}`));
  out.push(outcome(`${profile}/registry-balance`, balance.length === 0,
    balance.length ? balance.join('; ') : 'registry accounting balances'));
  const coherence = registries.flatMap(([label, registry]) =>
    registryCoherenceReasons(registry).map((reason) => `${label}: ${reason}`));
  out.push(outcome(`${profile}/registry-coherence`, coherence.length === 0,
    coherence.length ? coherence.join('; ') : 'registry ownership is coherent'));

  const pointsWithLabels = [['precondition', precondition]]
    .concat(cycles.map((cycle, index) => [`cycle ${index + 1}`, cycle]))
    .concat([['bfcache', bfcache]]);
  const allPoints = pointsWithLabels.map(([, point]) => point);
  const sceneTextStyleListeners = allPoints.every((point) =>
    count(point?.sceneTextStyleUpdateListeners) && point.sceneTextStyleUpdateListeners > 0);
  out.push(outcome(`${profile}/scene-text-style-listeners`, sceneTextStyleListeners,
    sceneTextStyleListeners
      ? 'every populated universe anchor retained shared TextStyle update listeners'
      : 'shared TextStyle update-listener witness was absent or vacuous'));
  const managedResourceReasons = pointsWithLabels.flatMap(([label, point]) =>
    managedResourceSnapshotReasons(point?.managedResources).map((reason) =>
      `${label}: ${reason}`));
  managedResourceReasons.push(...managedResourceProgressReasons(precondition, cycles));
  out.push(outcome(`${profile}/managed-resource-compaction`,
    managedResourceReasons.length === 0,
    managedResourceReasons.length
      ? managedResourceReasons.join('; ')
      : 'Pixi managed-resource hashes were compacted in every measured cycle'));
  const managedResourcePlateau = object(precondition?.managedResources)
    && cycles.length === SCENE_MEMORY_CYCLE_COUNT
    && cycles.every((cycle) => same(
      managedResourceStructuralSignature(cycle?.managedResources),
      managedResourceStructuralSignature(precondition.managedResources),
    ));
  out.push(outcome(`${profile}/managed-resource-plateau`, managedResourcePlateau,
    managedResourcePlateau
      ? 'precondition and all four measured cycles share one managed-resource inventory'
      : 'settled Pixi managed-resource inventory drifted'));
  const diagnosticResources = pointsWithLabels.flatMap(([label, point]) =>
    diagnosticResourceReasons(point, budget).map((reason) =>
      `${label}: ${reason}`));
  out.push(outcome(`${profile}/diagnostic-resource-budget`, diagnosticResources.length === 0,
    diagnosticResources.length
      ? diagnosticResources.join('; ') : 'managed textures, canvas caches, and render targets agree'));
  const pending = allPoints.every((point) => point?.pending === 0);
  out.push(outcome(`${profile}/pending-zero`, pending,
    pending ? 'all owned work settled' : 'pending scene work remained'));
  const ringBound = allPoints.every((point) => count(point?.ringCacheEntries)
    && point.ringCacheEntries === 0 && point.ringCacheEntries <= budget.ringCacheEntriesMax
    && count(point?.peakRingGeometryEntries) && point.peakRingGeometryEntries > 0
    && point.peakRingGeometryEntries <= budget.peakRingGeometryEntriesMax);
  out.push(outcome(`${profile}/ring-cache-bound`, ringBound,
    ringBound
      ? 'settled ring cache was empty with a positive bounded Sol-route peak'
      : 'ring cache was not evicted or lacked a positive bounded Sol-route peak'));

  const consistent = cycles.length === SCENE_MEMORY_CYCLE_COUNT && cycles.every((cycle) => {
    const fine = cycle?.inventory?.fine;
    const surface = cycle?.inventory?.surface;
    return fine?.requested === true && fine?.layer === true && fine?.scope === true
      && surface?.mode === true && surface?.owner === true && surface?.scope === true;
  });
  out.push(outcome(`${profile}/fine-surface-consistency`, consistent,
    consistent ? 'fine and surface witnesses agree with their owners' : 'fine/surface witness was absent or inconsistent'));

  const populated = cycles.length === SCENE_MEMORY_CYCLE_COUNT && cycles.every((cycle) => {
    const counts = cycle?.inventory?.sceneObjectsByRoute;
    return exactKeys(counts, SCENE_MEMORY_ROUTES)
      && SCENE_MEMORY_ROUTES.every((route) => count(counts[route]) && counts[route] > 0)
      && cycle?.registry?.activeLeaseCount > 0 && cycle?.registry?.liveTextureCount > 0;
  });
  out.push(outcome(`${profile}/populated-scene`, populated,
    populated ? 'every route retained a populated scene' : 'scene proof was empty or vacuous'));

  const peak = allPoints.every((point) => point?.registry?.peakActiveLeaseCount <= budget.peakActiveLeaseCountMax
    && point?.registry?.peakLiveTextureCount <= budget.peakLiveTextureCountMax
    && point?.registry?.peakLiveCanvasBytes <= budget.peakLiveCanvasBytesMax);
  out.push(outcome(`${profile}/transient-peak`, peak,
    peak ? 'transient ownership stayed within budget' : 'transient ownership peak exceeded budget'));

  const answerable = pointsWithLabels.flatMap(([label, point]) =>
    answerabilityReasons(point?.answerability, budget, point?.documentToken).map((reason) =>
      `${label}: ${reason}`));
  out.push(outcome(`${profile}/answerability`, answerable.length === 0,
    answerable.length ? answerable.join('; ') : 'target and browser heartbeat answered'));

  const heapDomReasons = heapDomBudgetReasons(pointsWithLabels, budget);
  out.push(outcome(`${profile}/heap-dom-budget`, heapDomReasons.length === 0,
    heapDomReasons.length
      ? heapDomReasons.join('; ')
      : 'heap and DOM counters stayed within supplied ceilings'));

  const warmHeaps = cycles.map(heapAggregate);
  const warmHeapRange = warmHeaps.length === SCENE_MEMORY_CYCLE_COUNT
    ? Math.max(...warmHeaps) - Math.min(...warmHeaps) : Number.POSITIVE_INFINITY;
  const warmHeapSlope = maximumPositiveHeapSlope(cycles);
  const heapPlateau = warmHeapRange <= budget.warmHeapAggregateRangeBytesMax
    && warmHeapSlope <= budget.warmHeapSlopeBytesPerCycleMax;
  out.push(outcome(`${profile}/heap-plateau`, heapPlateau,
    heapPlateau
      ? 'four measured heap samples stayed within range and positive-slope ceilings'
      : 'measured heap range or positive slope exceeded budget'));

  const bfcacheOk = object(bfcache) && bfcache.pagehidePersisted === true
    && bfcache.pageshowPersisted === true && bfcache.resumed === true
    && bfcache.appAlive === true && bfcache.rendererAlive === true && bfcache.stageAlive === true
    && nonempty(bfcache.documentTokenBefore)
    && bfcache.documentTokenAfter === bfcache.documentTokenBefore
    && cycles.length === SCENE_MEMORY_CYCLE_COUNT
    && bfcache.documentToken === cycles.at(-1)?.documentToken
    && bfcache.documentTokenBefore === bfcache.documentToken
    && bfcache.sceneGeneration === cycles.at(-1)?.sceneGeneration
    && same(cumulativeRegistrySignature(bfcache.registry),
      cumulativeRegistrySignature(cycles.at(-1)?.registry))
    && object(bfcache.managedResources)
    && same(bfcache.managedResources, cycles.at(-1)?.managedResources)
    && same(liveSignature(bfcache), liveSignature(cycles.at(-1)));
  out.push(outcome(`${profile}/bfcache-survival`, bfcacheOk,
    bfcacheOk ? 'persisted pagehide/pageshow preserved the live application' : 'bfcache resume changed or destroyed its owner'));
  return out;
}

export function evaluateSceneMemory(input) {
  if (!object(input) || input.schema !== 'cf-v2-scene-memory-input/v3'
    || !exactKeys(input.profiles, PROFILES) || !exactKeys(input.budgets, PROFILES)) {
    throw new TypeError('scene-memory input requires exact phone and desktop profiles/budgets');
  }
  const outcomes = [];
  for (const profile of PROFILES) {
    assertBudget(profile, input.budgets[profile]);
    outcomes.push(...profileOutcomes(profile, input.profiles[profile], input.budgets[profile]));
  }
  const failures = outcomes.filter((entry) => !entry.pass);
  return Object.freeze({
    schema: 'cf-v2-scene-memory-verdict/v2',
    status: failures.length === 0 ? 'pass' : 'fail',
    outcomes: Object.freeze(outcomes),
    failures: Object.freeze(failures),
  });
}
