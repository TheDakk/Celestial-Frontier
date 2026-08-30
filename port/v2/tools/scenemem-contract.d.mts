export type SceneMemoryProfileName = 'phone' | 'desktop';
export type SceneMemoryRoute =
  | 'universe' | 'galaxy' | 'galaxy-fine' | 'system'
  | 'surface' | 'compendium' | 'shipyard';
export type SceneTextureKind =
  | 'scene-canvas' | 'galaxy-haze' | 'planet-texture'
  | 'ring-texture' | 'surface-cloud' | 'star-surface';

export interface SceneMemoryLegacyBudget {
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

export interface SceneMemoryRawBudget extends SceneMemoryLegacyBudget {
  surfaceVistaCacheEntriesMax: number;
  surfaceVistaCachePixelsMax: number;
}

export interface SceneMemoryBudget
  extends Omit<SceneMemoryRawBudget, 'heapUsedBytesMax' | 'heapAggregateBytesMax'> {
  initialHeapUsedBytesMax: number;
  initialHeapAggregateBytesMax: number;
  heapUsedGrowthBytesMax: number;
  heapNormalizedWorkingSetBytesMax: number;
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

export interface SceneMemoryVistaState {
  surfaceVistaWorkerActive: boolean;
  surfaceVistaMounted: boolean;
  surfaceVistaCacheEntries: number;
  surfaceVistaCachePixels: number;
}

export interface SceneMemoryLegacyPoint {
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
  shipyardDiagnosticsSchema: 'cf-v2-shipyard-diagnostics/v1';
  shipyardPreviewStatus: 'closed';
  shipyardPreviewStateKey: null;
  shipyardPreviewActiveCount: number;
  shipyardPreviewRetainedCount: number;
  shipyardPreviewPendingWork: number;
  pending: number;
  ringCacheEntries: number;
  peakRingGeometryEntries: number;
  answerability: SceneAnswerabilityWitness;
  heap: { usedSize: number; embedderHeapUsedSize: number; backingStorageSize: number };
  dom: { documents: number; nodes: number; jsEventListeners: number };
}

export interface SceneMemoryPoint extends SceneMemoryLegacyPoint, SceneMemoryVistaState {}

export interface SceneMemoryLegacySurfaceWitness {
  mode: boolean;
  owner: boolean;
  scope: boolean;
}

export interface SceneMemorySurfaceWitness
  extends SceneMemoryLegacySurfaceWitness, SceneMemoryVistaState {}

export interface SceneMemoryCycleInventory<
  TSurface extends SceneMemoryLegacySurfaceWitness = SceneMemorySurfaceWitness,
> {
  routes: SceneMemoryRoute[];
  shipyard: {
    status: 'implemented-static';
    openerDriven: boolean;
    closeDriven: boolean;
    stateKey: string;
    stateMatch: boolean;
    openPreviewCount: number;
    openRetainedPreviewCount: number;
    openPendingPreviewWork: number;
    closedPreviewCount: number;
    closedRetainedPreviewCount: number;
    closedPendingPreviewWork: number;
  };
  sceneObjectsByRoute: Record<SceneMemoryRoute, number>;
  fine: { requested: boolean; layer: boolean; scope: boolean };
  surface: TSurface;
}

export interface SceneMemoryLegacyCycle extends SceneMemoryLegacyPoint {
  cycle: number;
  inventory: SceneMemoryCycleInventory<SceneMemoryLegacySurfaceWitness>;
}

export interface SceneMemoryCycle extends SceneMemoryPoint {
  cycle: number;
  inventory: SceneMemoryCycleInventory;
}

export interface SceneMemoryReloadCleanupWitness {
  schema: 'cf-v2-scene-memory-reload-cleanup/v1';
  documentTokenBefore: string;
  documentTokenAfter: string;
  release: {
    schema: 'cf-v2-reload-release/v1';
    status: 'released';
    error: null;
    reason: 'save-import';
    documentToken: string;
    rendererReleased: boolean;
    stageReleased: boolean;
    viewDetached: boolean;
  };
  cacheTransition: {
    schema: 'cf-v2-scene-memory-vista-cache-transition/v1';
    documentToken: string;
    before: SceneMemoryVistaState;
    after: SceneMemoryVistaState;
  };
  replacement: SceneMemoryVistaState & { documentToken: string };
}

export interface SceneMemoryLegacyBfcacheWitness extends SceneMemoryLegacyPoint {
  pagehidePersisted: boolean;
  pageshowPersisted: boolean;
  resumed: boolean;
  appAlive: boolean;
  rendererAlive: boolean;
  stageAlive: boolean;
  documentTokenBefore: string;
  documentTokenAfter: string;
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

export interface SceneMemoryLegacyProfileMeasurement {
  precondition: SceneMemoryLegacyPoint;
  cycles: SceneMemoryLegacyCycle[];
  bfcache: SceneMemoryLegacyBfcacheWitness;
}

export interface SceneMemoryV4ProfileMeasurement {
  initialVista: SceneMemoryVistaState;
  firstSurfaceVista: SceneMemoryVistaState;
  precondition: SceneMemoryPoint;
  cycles: SceneMemoryCycle[];
  bfcache: SceneMemoryBfcacheWitness;
  reloadCleanup: SceneMemoryReloadCleanupWitness;
}

export interface SceneMemoryProfileMeasurement extends SceneMemoryV4ProfileMeasurement {
  initial: {
    documentToken: string;
    heap: SceneMemoryPoint['heap'];
  };
}

export interface SceneMemoryLegacyInput {
  schema: 'cf-v2-scene-memory-input/v3';
  profiles: Record<SceneMemoryProfileName, SceneMemoryLegacyProfileMeasurement>;
  budgets: Record<SceneMemoryProfileName, SceneMemoryLegacyBudget | SceneMemoryRawBudget>;
}

export interface SceneMemoryV4Input {
  schema: 'cf-v2-scene-memory-input/v4';
  profiles: Record<SceneMemoryProfileName, SceneMemoryV4ProfileMeasurement>;
  budgets: Record<SceneMemoryProfileName, SceneMemoryRawBudget>;
}

export interface SceneMemoryCurrentInput {
  schema: 'cf-v2-scene-memory-input/v5';
  profiles: Record<SceneMemoryProfileName, SceneMemoryProfileMeasurement>;
  budgets: Record<SceneMemoryProfileName, SceneMemoryBudget>;
}

export type SceneMemoryInput = SceneMemoryLegacyInput | SceneMemoryV4Input | SceneMemoryCurrentInput;

export interface SceneMemoryOutcome {
  readonly id: string;
  readonly pass: boolean;
  readonly message: string;
  readonly details?: unknown;
}

export interface SceneMemoryVerdict {
  readonly schema:
    | 'cf-v2-scene-memory-verdict/v2'
    | 'cf-v2-scene-memory-verdict/v3'
    | 'cf-v2-scene-memory-verdict/v4';
  readonly status: 'pass' | 'fail';
  readonly outcomes: readonly SceneMemoryOutcome[];
  readonly failures: readonly SceneMemoryOutcome[];
}

export const SCENE_MEMORY_CYCLE_COUNT: 4;
export const SCENE_MEMORY_ROUTES: readonly SceneMemoryRoute[];
export const SCENE_TEXTURE_KINDS: readonly SceneTextureKind[];
export function evaluateSceneMemory(input: SceneMemoryInput): SceneMemoryVerdict;
