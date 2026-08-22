export type SceneMemoryProfileName = 'phone' | 'desktop';
export type SceneMemoryRoute =
  | 'universe' | 'galaxy' | 'galaxy-fine' | 'system'
  | 'surface' | 'compendium';
export type SceneTextureKind =
  | 'scene-canvas' | 'galaxy-haze' | 'planet-texture'
  | 'ring-texture' | 'surface-cloud' | 'star-surface';

export interface SceneMemoryBudget {
  heapUsedBytesMax: number;
  embedderHeapUsedBytesMax: number;
  backingStorageBytesMax: number;
  heapAggregateBytesMax: number;
  warmHeapAggregateRangeBytesMax: number;
  warmHeapSlopeBytesPerCycleMax: number;
  documentsMax: number;
  nodesMax: number;
  jsEventListenersMax: number;
  peakActiveLeaseCountMax: number;
  peakLiveTextureCountMax: number;
  peakLiveCanvasBytesMax: number;
  managedTextureCountMax: number;
  managedTexturePixelsMax: number;
  localCanvasCacheEntriesMax: number;
  peakLocalCanvasCacheEntriesMax: number;
  productRenderTargetsMax: number;
  ringCacheEntriesMax: number;
  peakRingGeometryEntriesMax: number;
  targetElapsedMsMax: number;
  heartbeatElapsedMsMax: number;
}

export interface SceneRegistrySnapshot {
  schema: 'cf-v2-scene-textures/v2';
  observationWindow: number;
  scopeCreations: number;
  scopeDisposals: number;
  activeScopeCount: number;
  leaseAcquisitions: number;
  leaseReleases: number;
  activeLeaseCount: number;
  textureCreations: number;
  textureDisposals: number;
  liveTextureCount: number;
  liveCanvasPixels: number;
  liveCanvasBytes: number;
  peakActiveLeaseCount: number;
  peakLiveTextureCount: number;
  peakLiveCanvasPixels: number;
  peakLiveCanvasBytes: number;
  lifetimePeakActiveLeaseCount: number;
  lifetimePeakLiveTextureCount: number;
  lifetimePeakLiveCanvasPixels: number;
  externalDestroyFaults: number;
  balanced: boolean;
  coherent: boolean;
  liveLeasesByKind: Record<SceneTextureKind, number>;
  liveTexturesByKind: Record<SceneTextureKind, number>;
  activeScopes: Array<{ label: string; leaseCount: number; closed: boolean }>;
}

export interface PixiManagedResourceHashSnapshot {
  name: string;
  type: 'resource' | 'renderable';
  liveEntryCount: number;
  clearedEntryCount: number;
}

export interface PixiManagedResourceOwnerSnapshot {
  schema: 'cf-v2-pixi-managed-resources/v2';
  valid: boolean;
  hashCount: number;
  hashes: PixiManagedResourceHashSnapshot[];
  liveEntryCount: number;
  clearedEntryCount: number;
  compactionCount: number;
  compactedSlotCount: number;
  faultCount: number;
}

export interface SceneAnswerabilityWitness {
  target: {
    ok: boolean;
    elapsedMs: number;
    documentTokenBefore: string;
    documentTokenAfter: string;
    tickerBefore: number;
    tickerAfter: number;
    laterTicker: boolean;
  };
  heartbeat: {
    ok: boolean;
    elapsedMs: number;
    independent: boolean;
    product: string;
    protocolVersion: string;
  };
}

export interface SceneMemoryPoint {
  sceneGeneration: number;
  documentToken: string;
  registry: SceneRegistrySnapshot;
  managedResources: PixiManagedResourceOwnerSnapshot;
  managedTextureCount: number;
  managedTexturePixels: number;
  managedTextureClearedSlots: number;
  sceneTextStyleUpdateListeners: number;
  localCanvasCacheEntries: number;
  peakLocalCanvasCacheEntries: number;
  productRenderTargets: number;
  retiredFineOwnerCount: number;
  pending: number;
  ringCacheEntries: number;
  peakRingGeometryEntries: number;
  answerability: SceneAnswerabilityWitness;
  heap: { usedSize: number; embedderHeapUsedSize: number; backingStorageSize: number };
  dom: { documents: number; nodes: number; jsEventListeners: number };
}

export interface SceneMemoryCycle extends SceneMemoryPoint {
  cycle: number;
  inventory: {
    routes: SceneMemoryRoute[];
    shipyardStatus: 'future-arc-1c';
    sceneObjectsByRoute: Record<SceneMemoryRoute, number>;
    fine: { requested: boolean; layer: boolean; scope: boolean };
    surface: { mode: boolean; owner: boolean; scope: boolean };
  };
}

export interface SceneMemoryBfcacheWitness extends SceneMemoryPoint {
  pagehidePersisted: boolean;
  pageshowPersisted: boolean;
  resumed: boolean;
  appAlive: boolean;
  rendererAlive: boolean;
  stageAlive: boolean;
  documentTokenBefore: string;
  documentTokenAfter: string;
}

export interface SceneMemoryProfileMeasurement {
  precondition: SceneMemoryPoint;
  cycles: SceneMemoryCycle[];
  bfcache: SceneMemoryBfcacheWitness;
}

export interface SceneMemoryInput {
  schema: 'cf-v2-scene-memory-input/v2';
  profiles: Record<SceneMemoryProfileName, SceneMemoryProfileMeasurement>;
  budgets: Record<SceneMemoryProfileName, SceneMemoryBudget>;
}

export interface SceneMemoryOutcome {
  readonly id: string;
  readonly pass: boolean;
  readonly message: string;
  readonly details?: unknown;
}

export interface SceneMemoryVerdict {
  readonly schema: 'cf-v2-scene-memory-verdict/v1';
  readonly status: 'pass' | 'fail';
  readonly outcomes: readonly SceneMemoryOutcome[];
  readonly failures: readonly SceneMemoryOutcome[];
}

export const SCENE_MEMORY_CYCLE_COUNT: 4;
export const SCENE_MEMORY_ROUTES: readonly SceneMemoryRoute[];
export const SCENE_TEXTURE_KINDS: readonly SceneTextureKind[];
export function evaluateSceneMemory(input: SceneMemoryInput): SceneMemoryVerdict;
