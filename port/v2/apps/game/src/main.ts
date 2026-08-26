/* THE SLICE (Phases 3–4) — a Pixi renderer over @cf/scene speaking the
   Renderer's visual language (main.js recipes number-for-number), wearing
   the game's chrome at the GOLDEN SCREENS' geometry. Everything that can be
   wrong lives in the tested packages; this file draws, moves a camera, and
   forwards input into the tested state machines.

   Live today: the full descent ladder with zoom-driven transitions ·
   survey-first input (tap = describePick card, explicit card action = dive) · the
   charter/Ascent gates (toasting the build that opens the ring) · wormhole
   travel (reach-clamped) · comets/visitor/supernovae/moon terminators/cloud
   deck · THE REAL SAVE LOOP (importSaveV2 ⇄ exportSaveV2 over IndexedDB,
   with CF-RR-002 recovery wired) · panels (one-panel law/focus restoration)
   · Settings/Compendium/Records · search (code-paste travel) · the shipped
   audio stings · capped COSMIC_EPOCH on an app-owned monotonic session segment.

   Still ahead (recorded in ROADMAP's NEXT): the remaining 15 lessons of the complete 21-step training port,
   full Atlas chart/favorites presentation, rarity stings, ring↔planet mutual shadows, PROTO star disk,
   biome vista surfaces (Phase 6). Static deterministic Canvas species portraits
   are live; retained Pixi actors, meshes, and portrait animation remain Phase 5. */
import { Application, BatchTextureArray, Container, Graphics, Sprite, Texture, Text, TextStyle, cleanHash, extensions, CullerPlugin } from 'pixi.js';
import {
  galSpriteFor, decoSprite, getPlanetSprite, starSprite,
  _rockSet, _ringSprite, _starSurf, _moonSpr, _dwarfSpr,
  _rogueSpr, _beamSpr, _nsCoreSpr, _bhSpr, _cloudSpr,
  _wormSpr, snSiteSprite, _bhDiscSpr, _protoSpr,
  _quasarSpr, _visitorSpr, _comaSpr, _vtrailSpr,
  galaxyHaze,
} from '@cf/art';
import { initAudio, playWhoosh, playSurveyPing, applySfxGain } from '@cf/audio';
import type { AudioContextLike, AudioCounterpartReceipt } from '@cf/audio';
import {
  registerPanel, fillPanel, togglePanel, openPanel, closePanels, openPanelId,
  createPanelOpenController,
} from './panels.js';
import {
  CompendiumVirtualList,
  type CompendiumVirtualRow,
  type CompendiumReturnState,
  type CompendiumWindowSnapshot,
} from './compendium.js';
import {
  bindSpeciesThumb,
  SpeciesArtLoader,
  SpeciesThumbLeaseGroup,
  type Portrait440,
  type SpeciesThumbBinding,
} from './species-art-loader.js';
import {
  initTraining, gameEvent, trainingActive, trainingStepId,
  type TrainingEndIntent, type TrainingEndResult,
} from './training.js';
import {
  buildLegacyTrainingRestoreCandidate,
  committedTrainingArc4State,
  committedTrainingArc5State,
  committedTrainingArc2State,
  prepareTrainingArc4Restore,
  prepareTrainingArc5Restore,
  prepareTrainingArc2Restore,
  type PreparedTrainingArc4Restore,
} from './training-restore.js';
import {
  classifyBootRouteRepair,
  type BootRouteProjection,
} from './boot-route-repair.js';
import {
  applyArc5BootLiveProjection,
  captureArc5BootLiveProjection,
  classifyArc5TrainingBootGate,
  runArc5BootRuntimeGate,
  type Arc5BootGateClassification,
} from './arc5-boot-runtime-gate.js';
import {
  displayedPlanetTextureDemandPx,
  type SurfacePlanetTextureIdentity,
} from './planet-texture-demand.js';
import {
  SURFACE_PLANET_TEXTURE_REFRESH_MS,
  SurfacePlanetTextureAttachment,
} from './planet-texture-attachment.js';
import {
  CanvasTextureRegistry,
  type SceneTextureKind,
  type SceneTextureLease,
  type SceneTextureScope,
} from './scene-texture-owner.js';
import { PixiManagedResourceOwner } from './pixi-managed-resource-owner.js';
import { installBatchTextureArrayUidCompaction } from './pixi-batch-texture-array.js';
import { createSceneText } from './scene-text.js';
import {
  shipVisualStateKey,
} from './shipyard-preview.js';
import { canonicalWorldRoster, type CanonicalWorldRoster } from './world-roster.js';
import {
  getGuideCatalogue, getGuideTopic, searchGuide,
  type GuideCategoryId, type GuideTopicId, type GuideTopicView,
} from './guide-content.js';
import {
  getCurrentV2Release, getReleaseHistory, hasUnseenV2Release, V2_DEVELOPMENT_VERSION,
  type ReleaseNoteView, type V2ShippedRelease,
} from './release-content.js';
import { projectDisplayRarity } from './rarity-presentation.js';
import {
  createSearchTravelController,
  navigationAuthorityFailureFor,
} from './search-travel.js';
import { createAppChromeController } from './app-chrome.js';
import {
  NAV_HOME, enterGalaxy, enterSystem, land, ascend, navToView, resolveViewToNav,
  canonicalCF1WorldAddressFromNav,
  resolveCF1Galaxy, resolveCF1Star, resolveCF1World,
  resolveCF1WorldAddress,
  isProvenPlanetFor, getProvenGalaxyKey, getProvenStarKey, getProvenPlanetKey,
  universeGalaxies, provenGalaxyCell, galaxyFineCell, galaxyCellWindow, systemScene,
  reachRadiusOf, currentRegionOf, ascHintFor, primeReachHint,
  bankLandfall, reconcileV2Chapters, currentV2Objective, projectV2Charter,
  shipVisualStateOf,
  GR, GCELL, type NavState, type GalaxyNode, type PlanetNode,
  type ProvenGalaxy, type ProvenStar, type ProvenPlanet,
  type ShipVisualState,
} from '@cf/scene';
import {
  SCENE_ENGINEERING_ADDRESS_RESOLVER,
  type EngineeringStateV2,
} from '@cf/domain-opportunity';
import {
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  capturePresentationFenceV1,
  formatCaptureChancePercentV1,
  ownershipSourceStateV1,
  ownershipStateDigestV1,
  ownershipStateDigestV2,
  projectCapturePresentationV1,
  type AcquisitionVerbV1,
  type CapturePresentationReadyV1,
  type OwnershipStateV1,
  type OwnershipStateV2,
} from '@cf/domain-acquisition';
import { galaxyProfile, systemFor, FCELL, galaxyWormhole, supernovaSites, galaxiesInCell, UNOISE } from '@cf/domain-worldgen';
import { SYS_R, UCELL, OBS_R, HOME_POS, SOL_SEED } from '@cf/domain-worldconfig';
import { galaxyName, starName, properName } from '@cf/domain-naming';
import { mulberry32, hashInt, TAU } from '@cf/domain-rand';
import {
  installCaptureHooks, planetDescriptor, describePickWithState,
  SOL_MOONS, galaxyStats, fmtBig,
  type Descriptor, type DescriptorPick,
} from '@cf/domain-descriptors';
import { encodeWhere } from '@cf/domain-strays';
import { describeSpecies } from '@cf/domain-genome';
import { battleStats, STAT_NAMES, STAT_HUES } from '@cf/domain-combatcore';
import {
  STORES, createSaveRepository, createIndexedDBBackend,
  createRevisionedRepository, initializeFreshV5, migrateStoredV4ToV5,
  prepareV5Replacement, readF4Authority, readRevisionedSaveV5WithRecovery,
  arc4OwnershipLegacyMirrorMatches, readArc4Ownership,
  ARC5_OWNERSHIP_MIGRATION_VERSION,
  committedArc5OwnershipState,
  prepareArc5OwnershipMigration, readArc5OwnershipMigration,
  arc2LootLegacyMirrorMatches, prepareArc2LootLegacyMigration,
  prepareArc2LootInventoryWrite, projectArc2LootLegacyMirror,
  readArc2EngineeringLoadout, readArc2Loot, readArc3Engineering,
  importSaveV2, exportSaveV2,
  type SaveStateV2, type ContentRegistry, type Arc2LootStateV1,
  type Arc5OwnershipMigrationEvidence,
  type PreparedArc5OwnershipMigrationV2,
  type ImportRouteIngressV2, type ImportTrainingSnapshotIngressV2,
  type StorageBackend, type V5Extensions,
} from '@cf/persistence';
import {
  MAX_GEAR_CAPACITY,
} from '@cf/domain-loot';
import { runF3PersistenceBrowserProbe } from './f3-persistence-browser-probe.js';
import {
  createEcologyEpochEdgeAuthority,
  type EcologyEpochCheckpointIntent,
  type EcologyEpochEdgeAuthority,
  type EcologyEpochPublication,
  type EcologyEpochProjectionRefreshToken,
  type EcologyEpochStage,
} from './ecology-epoch-edge.js';
import {
  planArc2InventoryAction,
  projectArc2LegacyAction,
  type Arc2InventoryOperation,
} from './inventory-actions.js';
import { InventoryPanelController } from './inventory-panel.js';
import {
  EngineeringPanelController,
  type EngineeringPanelActionRequest,
} from './engineering-panel.js';
import {
  createProductActionCoordinator,
  createProductActionDiagnosticHold,
} from './product-action-coordinator.js';
import {
  projectEngineeringPanelReadModel,
  projectOrbitalMineralSurveyRow,
} from './engineering-panel-model.js';
import {
  deriveArc3FixedFabricationAction,
  deriveArc3MineAction,
  deriveArc3ResearchAction,
  deriveArc3SkimAction,
  prepareArc3AppBootstrap,
  publishArc3LegacyCompatibilityFields,
  publishArc3FixedFabricationFields,
  publishArc3MiningFields,
  publishArc3ResearchFields,
  publishArc3SkimFields,
  stageArc3BootstrapLegacyProjection,
  verifyArc3CommittedAction,
  verifyArc3CommittedFixedFabricationAction,
  verifyArc3CommittedResearchAction,
  type Arc3AddressInventoryDiagnostics,
  type Arc3AppDerivation,
  type Arc3AppDerivationOutcome,
} from './arc3-engineering-actions.js';
import {
  commitArc4CaptureAttemptV1,
  prepareArc4AppBootstrap,
  publishArc4CaptureFields,
  publishArc4LegacyCompatibilityFields,
  stageArc4BootstrapLegacyProjection,
  verifyArc4CommittedCaptureV1,
} from './arc4-capture-action.js';
import {
  CAPTURE_CARD_OUTCOME_SCHEMA,
  CAPTURE_CARD_READ_MODEL_SCHEMA,
  CAPTURE_CARD_VERB_ORDER,
  CaptureCardController,
  type CaptureCardActionOutcome,
  type CaptureCardActionRequest,
  type CaptureCardOpportunityReadModel,
  type CaptureCardReadModelV1,
  type CaptureCardVerb,
} from './capture-card.js';
import { composeAcquisitionSnapshotV1 } from './acquisition-snapshot.js';
import {
  TAME_GREETING_AUDIO_DIAGNOSTICS_SCHEMA,
  createTameGreetingAudioOwner,
  type TameGreetingAudioDiagnostics,
  type TameGreetingAudioOwner,
  type TameGreetingClaim,
} from './tame-greeting-audio.js';
import {
  createF4RuntimeAuthority,
  type F4RuntimeAuthority,
} from './f4-runtime-authority.js';
import REGISTRY_JSON from '../../../../baseline-v1.8.9/content-registry.json';

installBatchTextureArrayUidCompaction(BatchTextureArray);
document.title = `Celestial Frontier v${V2_DEVELOPMENT_VERSION} — Development`;
installCaptureHooks();   /* GAL_SPRITES etc. until GalaxyArt fully replaces the hooks */
/* THE PORTRAIT ENGINE IS A WORKER-LOCAL LAZY CHUNK: heavy species painters stay
   off the renderer boot path. The first serviced art owner enables a broker that
   owns at most one producer at a time and terminates it when the queue drains;
   thumbnails/portraits return as validated PNG assets without a sync fallback. */
const REGISTRY = REGISTRY_JSON as unknown as ContentRegistry;
const customNames = new Map<string, string>();

extensions.add(CullerPlugin);   /* offscreen sprites skip render — thousands of stars, one flag */

const app = new Application();
const pixiManagedResourceOwner = new PixiManagedResourceOwner(() => app.renderer, cleanHash);
const sceneTextureRegistry = new CanvasTextureRegistry<HTMLCanvasElement, Texture>(
  (resource) => Texture.from(resource, true),
);
let sceneTextureGeneration = 0;
let peakRingGeometryEntries = 0;
let peakLocalCanvasCacheEntries = 0;
let sceneTextureScope: SceneTextureScope<HTMLCanvasElement, Texture> | null =
  sceneTextureRegistry.createScope('bootstrap');
let fineTextureScope: SceneTextureScope<HTMLCanvasElement, Texture> | null = null;
const currentSceneTextureScope = (): SceneTextureScope<HTMLCanvasElement, Texture> => {
  if (!sceneTextureScope) throw new Error('scene texture scope is unavailable');
  return sceneTextureScope;
};
const sceneTexture = (
  resource: HTMLCanvasElement,
  kind: SceneTextureKind = 'scene-canvas',
): Texture => currentSceneTextureScope().acquire(resource, kind);
const sceneTextureLease = (
  resource: HTMLCanvasElement,
  kind: SceneTextureKind = 'scene-canvas',
): SceneTextureLease<Texture> => currentSceneTextureScope().acquireLease(resource, kind);
const DOCUMENT_TOKEN = crypto.randomUUID();
/* A lease identity belongs to one live Document, not sessionStorage: browsers
   may clone sessionStorage into a duplicated/opener tab. BFCache retains this
   same JS realm and therefore correctly retains this token. */
const F4_TAB_TOKEN = DOCUMENT_TOKEN;
const speciesArtLoader = new SpeciesArtLoader(DOCUMENT_TOKEN);
const F4_LEASE_TTL_MS = 10_000;
const F4_HEARTBEAT_MS = F4_LEASE_TTL_MS / 2;
const F4_CHECKPOINT_MS = 30_000;
const F4_OWNER_ID = 'celestial-frontier-game-tab';
const F4_START_HIDDEN_FOR_SMOKE = typeof (window as unknown as Record<string, unknown>).__cfF4StartHidden === 'function';
let f4VisibilityOverrideHidden = F4_START_HIDDEN_FOR_SMOKE;
const f4PageVisible = (): boolean => document.visibilityState === 'visible' && !f4VisibilityOverrideHidden;
let f4Runtime: F4RuntimeAuthority | null = null;
let f4HeartbeatTimer = 0;
let f4HeartbeatInFlight: Promise<void> | null = null;
let f4LastCheckpointAt = performance.now();
let f4SeedBootstrapPending = false;
let bootAuthorityCommitInFlight: Promise<boolean> | null = null;
let bootRouteRepairPending = false;
let arc2LootState: Arc2LootStateV1 | null = null;
let arc2LootBootstrapPending = false;
let arc2LootProtection: string | null = null;
let lastArc2LootOutcome: string | null = null;
let arc3EngineeringState: EngineeringStateV2 | null = null;
let arc3EngineeringBootstrapPending = false;
/* Every product migration/reconciliation stages into this one detached save.
   Later product owners must start from the prior candidate so disjoint legacy
   mirrors join the same boot-authority CAS instead of overwriting each other. */
let bootProductBootstrapCandidate: SaveStateV2 | null = null;
let arc3EngineeringProtection: string | null = null;
let arc3AddressDiagnostics: Arc3AddressInventoryDiagnostics | null = null;
let arc3LegacyDiagnostics: unknown = null;
let lastArc3BootstrapOutcome: string | null = null;
let lastArc3EngineeringOutcome: string | null = null;
let lastArc3ProjectionDiagnostics: unknown = null;
let arc4OwnershipState: OwnershipStateV1 | null = null;
let arc4OwnershipBootstrapPending = false;
let arc4OwnershipProtection: string | null = null;
let lastArc4BootstrapOutcome: string | null = null;
let lastArc4CaptureOutcome: string | null = null;
let arc5OwnershipState: OwnershipStateV2 | null = null;
let arc5OwnershipEvidence: Arc5OwnershipMigrationEvidence | null = null;
let arc5OwnershipBootstrapPrepared: PreparedArc5OwnershipMigrationV2 | null = null;
let arc5OwnershipBootstrapPending = false;
let arc5OwnershipProtection: string | null = null;
let lastArc5BootstrapOutcome: string | null = null;
let currentCapturePresentationFence: string | null = null;
let tameGreetingAudioOwner: TameGreetingAudioOwner | null = null;
let smokeRejectNextArc4ActionStorage = false;
let smokeStaleNextArc4ActionAuthority = false;
let smokeRejectNextArc4Publication = false;
let lastSmokeArc4ActionFaultWitness: Readonly<{
  schema: 'cf-v2-arc4-action-fault-witness/v1';
  operation: string;
  injection: 'storage-failure' | 'stale-authority' | 'publication-failure';
  phase: 'injecting' | 'settled' | 'injection-failed';
  beforeRevision: number;
  injectedRevision: number | null;
  outcome: string | null;
}> | null = null;
let f4AuthorityReloadScheduled = false;
let smokeRejectNextF4HideCheckpoint = false;
let lastF4HideWitness: Readonly<{
  schema: 'cf-v2-f4-hide/v1'; checkpoint: 'committed' | 'skipped' | 'rejected';
  checkpointError: string | null; visibilityAttempted: boolean;
  visibilityOutcome: string | null; visibilityError: string | null;
}> | null = null;
function scheduleF4AuthorityConvergenceReload(runtime: F4RuntimeAuthority, detail: string): void {
  persistHold = 'transient-read';
  persistenceProtectedDetail = detail;
  runtime.setAnswerable(false);
  tameGreetingAudioOwner?.setAnswerable(false);
  stopF4Heartbeat();
  if (f4AuthorityReloadScheduled) return;
  f4AuthorityReloadScheduled = true;
  setTimeout(() => {
    void (async () => {
      await tameGreetingAudioOwner?.dispose().catch(() => undefined);
      await runtime.release().catch(() => undefined);
      location.reload();
    })();
  }, 0);
}
async function ensureF4RevisionCurrent(runtime: F4RuntimeAuthority): Promise<boolean> {
  try {
    const durableRevision = await revisionRepo.revision();
    if (durableRevision === runtime.revision) return true;
    scheduleF4AuthorityConvergenceReload(
      runtime,
      `lease acquisition observed revision ${runtime.revision}/${durableRevision}; reloading stable authority`,
    );
    return false;
  } catch (error) {
    persistHold = 'protected-payload';
    persistenceBootKind = 'transient-protected';
    persistenceProtectedDetail = `revision verification failed (${error instanceof Error ? error.message : String(error)})`;
    runtime.setAnswerable(false);
    tameGreetingAudioOwner?.setAnswerable(false);
    stopF4Heartbeat();
    return false;
  }
}
async function ensureBootAuthorityCommit(runtime: F4RuntimeAuthority): Promise<boolean> {
  if (!arc5OwnershipBootstrapPending
    && !f4SeedBootstrapPending && !bootRouteRepairPending
    && !arc2LootBootstrapPending && !arc3EngineeringBootstrapPending
    && !arc4OwnershipBootstrapPending) return true;
  if (runtime !== f4Runtime || !runtime.diagnostics().leaseOwned) return false;
  if (bootAuthorityCommitInFlight) return bootAuthorityCommitInFlight;
  const productBootstrapWasPending = arc2LootBootstrapPending;
  const engineeringBootstrapWasPending = arc3EngineeringBootstrapPending;
  const ownershipBootstrapWasPending = arc4OwnershipBootstrapPending;
  const ownershipStateAtCommit = arc4OwnershipState;
  const ownershipV2BootstrapWasPending = arc5OwnershipBootstrapPending;
  const ownershipV2StateAtCommit = arc5OwnershipState;
  const ownershipV2PreparedAtCommit = arc5OwnershipBootstrapPrepared;
  const productCandidate = bootProductBootstrapCandidate;
  const run = (async (): Promise<boolean> => {
    let durable = false;
    try {
      if ((engineeringBootstrapWasPending
        || (ownershipBootstrapWasPending && ownershipStateAtCommit?.mode === 'current'))
        && productCandidate === null) {
        throw new Error('product bootstrap candidate is missing');
      }
      if (productBootstrapWasPending) {
        const rejector = (window as unknown as Record<string, unknown>).__cfRejectArc2ProductBootstrap;
        if (typeof rejector === 'function' && (rejector as (payload: string) => unknown)(JSON.stringify({
          schema: 'cf-v2-arc2-bootstrap-control/v1',
          documentToken: DOCUMENT_TOKEN,
          stateKind: arc2LootState?.kind ?? null,
        })) === true) {
          throw new Error('slice-smoke injected Arc 2 product bootstrap rejection');
        }
      }
      if (engineeringBootstrapWasPending) {
        const rejector = (window as unknown as Record<string, unknown>).__cfRejectArc3EngineeringBootstrap;
        const payload = JSON.stringify({
          schema: 'cf-v2-arc3-bootstrap-control/v1',
          documentToken: DOCUMENT_TOKEN,
          stateRevision: arc3EngineeringState?.revision ?? null,
          candidateReady: productCandidate !== null,
          projectionDiagnostics: Array.isArray(lastArc3ProjectionDiagnostics)
            ? lastArc3ProjectionDiagnostics.length : null,
        });
        if (typeof rejector === 'function'
          && (rejector as (payload: string) => unknown)(payload) === true) {
          throw new Error('slice-smoke injected Arc 3 engineering bootstrap rejection');
        }
      }
      if (engineeringBootstrapWasPending) lastArc3BootstrapOutcome = 'commit-attempted';
      if (ownershipBootstrapWasPending) lastArc4BootstrapOutcome = 'commit-attempted';
      if (ownershipV2BootstrapWasPending) lastArc5BootstrapOutcome = 'commit-attempted';
      const seeded = await runtime.commit(productCandidate ?? save, Date.now());
      lastPersistenceOutcome = seeded.kind === 'committed'
        ? `seed-committed:${seeded.revision}` : `seed-${seeded.kind}`;
      if (seeded.kind !== 'committed') {
        if (seeded.kind === 'stale') {
          scheduleF4AuthorityConvergenceReload(
            runtime,
            `boot authority commit observed newer revision ${seeded.actualRevision}; reloading stable authority`,
          );
        }
        throw new Error(`boot authority commit refused: ${seeded.kind}`);
      }
      durable = true;
      if (engineeringBootstrapWasPending) {
        publishArc3LegacyCompatibilityFields(save, seeded.saved.canonicalState);
        lastArc3BootstrapOutcome = 'committed-published';
      }
      if (ownershipBootstrapWasPending) {
        if (ownershipStateAtCommit === null) {
          throw new Error('Arc 4 bootstrap state is missing');
        }
        const loaded = readArc4Ownership(
          seeded.saved.extensions,
          SCENE_OWNERSHIP_ADDRESS_RESOLVER,
        );
        if (loaded.kind !== 'loaded'
          || ownershipStateDigestV1(loaded.state)
            !== ownershipStateDigestV1(ownershipStateAtCommit)) {
          throw new Error('Arc 4 bootstrap carrier did not converge');
        }
        if (loaded.state.mode === 'current') {
          if (!arc4OwnershipLegacyMirrorMatches(
            loaded.state,
            seeded.saved.canonicalState,
          )) {
            throw new Error('Arc 4 bootstrap legacy mirror did not converge');
          }
          publishArc4LegacyCompatibilityFields(save, seeded.saved.canonicalState);
          syncCustomNameIndex();
          arc4OwnershipProtection = null;
        } else {
          arc4OwnershipProtection = 'legacy-protected';
        }
        arc4OwnershipState = loaded.state;
        lastArc4BootstrapOutcome = loaded.state.mode === 'current'
          ? 'committed-published' : 'committed-protected';
      }
      if (ownershipV2BootstrapWasPending) {
        if (ownershipV2StateAtCommit === null || ownershipV2PreparedAtCommit === null
          || ownershipV2PreparedAtCommit.state !== ownershipV2StateAtCommit) {
          throw new Error('Arc 5 bootstrap preparation is missing');
        }
        const loaded = committedArc5OwnershipState(
          ownershipV2PreparedAtCommit,
          seeded.saved.extensions,
          SCENE_OWNERSHIP_ADDRESS_RESOLVER,
        );
        if (loaded === null) {
          throw new Error('Arc 5 bootstrap compact carrier did not converge');
        }
        arc5OwnershipState = loaded.state;
        arc5OwnershipEvidence = loaded.evidence;
        arc5OwnershipProtection = loaded.state.mode === 'current'
          ? null : 'legacy-protected';
        lastArc5BootstrapOutcome = loaded.state.mode === 'current'
          ? 'committed-published' : 'committed-protected';
      }
      bootProductBootstrapCandidate = null;
      f4SeedBootstrapPending = false;
      bootRouteRepairPending = false;
      arc2LootBootstrapPending = false;
      arc3EngineeringBootstrapPending = false;
      arc4OwnershipBootstrapPending = false;
      arc5OwnershipBootstrapPending = false;
      arc5OwnershipBootstrapPrepared = null;
      if (productBootstrapWasPending) {
        arc2LootProtection = null;
        inventoryPanelController.setState(arc2LootState);
      }
      if (engineeringBootstrapWasPending) arc3EngineeringProtection = null;
      f4LastCheckpointAt = performance.now();
      return true;
    } catch (error) {
      /* Any pre-durable bootstrap refusal is terminal for this runtime. Clear
         every staged bootstrap bit before releasing its lease so a later
         visibility edge cannot retry F4 alone with product extensions that
         never crossed their compatibility-state boundary. */
      f4SeedBootstrapPending = false;
      bootRouteRepairPending = false;
      arc2LootBootstrapPending = false;
      arc3EngineeringBootstrapPending = false;
      arc4OwnershipBootstrapPending = false;
      arc5OwnershipBootstrapPending = false;
      arc5OwnershipBootstrapPrepared = null;
      bootProductBootstrapCandidate = null;
      if (productBootstrapWasPending) {
        arc2LootState = null;
        arc2LootProtection = 'bootstrap-failed';
        inventoryPanelController.setState(null);
      }
      if (engineeringBootstrapWasPending) {
        arc3EngineeringState = null;
        arc3EngineeringProtection = durable
          ? 'committed-publication-reload' : 'bootstrap-failed';
        lastArc3BootstrapOutcome = durable
          ? 'committed-publication-reload' : 'rejected';
      }
      if (ownershipBootstrapWasPending) {
        arc4OwnershipState = null;
        arc4OwnershipProtection = durable
          ? 'committed-publication-reload' : 'bootstrap-failed';
        lastArc4BootstrapOutcome = durable
          ? 'committed-publication-reload' : 'rejected';
      }
      if (ownershipV2BootstrapWasPending) {
        arc5OwnershipState = null;
        arc5OwnershipEvidence = null;
        arc5OwnershipProtection = durable
          ? 'committed-publication-reload' : 'bootstrap-failed';
        lastArc5BootstrapOutcome = durable
          ? 'committed-publication-reload' : 'rejected';
        if (durable) {
          arc4OwnershipState = null;
          arc4OwnershipProtection = 'committed-publication-reload';
          lastArc4BootstrapOutcome = 'committed-publication-reload';
        }
      }
      persistHold = 'protected-payload';
      persistenceBootKind = 'transient-protected';
      persistenceProtectedDetail = error instanceof Error ? error.message : String(error);
      runtime.setAnswerable(false);
      stopF4Heartbeat();
      if (durable) {
        scheduleF4AuthorityConvergenceReload(
          runtime,
          `product bootstrap committed; publication ${persistenceProtectedDetail}`,
        );
      } else {
        await runtime.release().catch(() => undefined);
        if (f4Runtime === runtime) f4Runtime = null;
      }
      return false;
    }
  })();
  bootAuthorityCommitInFlight = run;
  try { return await run; }
  finally { if (bootAuthorityCommitInFlight === run) bootAuthorityCommitInFlight = null; }
}
function f4RuntimeMayMutate(runtime: F4RuntimeAuthority | null = f4Runtime): runtime is F4RuntimeAuthority {
  if (!runtime || persistHold || f4SeedBootstrapPending || bootRouteRepairPending
    || arc2LootBootstrapPending || arc3EngineeringBootstrapPending
    || arc5OwnershipBootstrapPending
    || arc4OwnershipBootstrapPending) return false;
  const diagnostics = runtime.diagnostics();
  return diagnostics.leaseOwned && !diagnostics.staleBlocked;
}
function f4RuntimeMayAnswer(runtime: F4RuntimeAuthority | null = f4Runtime): runtime is F4RuntimeAuthority {
  return f4PageVisible() && ecologyEpochAuthority.projectionMayAnswer()
    && f4RuntimeMayMutate(runtime);
}
const stopF4Heartbeat = (): void => {
  if (f4HeartbeatTimer !== 0) clearInterval(f4HeartbeatTimer);
  f4HeartbeatTimer = 0;
};
const heartbeatF4 = async (): Promise<void> => {
  if (!f4Runtime || !f4PageVisible()
    || activePersist || importWriteInFlight || replacementTransaction) return;
  if (f4HeartbeatInFlight) return f4HeartbeatInFlight;
  let heartbeatOwned = false;
  let checkpointDue = false;
  const runtime = f4Runtime;
  const run = runtime.heartbeat().then((outcome) => {
    heartbeatOwned = outcome.kind === 'owned';
    checkpointDue = outcome.kind === 'owned'
      && performance.now() - f4LastCheckpointAt >= F4_CHECKPOINT_MS;
  });
  f4HeartbeatInFlight = run;
  try { await run; }
  finally { if (f4HeartbeatInFlight === run) f4HeartbeatInFlight = null; }
  if (heartbeatOwned) {
    if (!await ensureF4RevisionCurrent(runtime)) return;
    if ((f4SeedBootstrapPending || bootRouteRepairPending
      || arc2LootBootstrapPending || arc3EngineeringBootstrapPending
      || arc4OwnershipBootstrapPending || arc5OwnershipBootstrapPending)
      && !await ensureBootAuthorityCommit(runtime)) return;
    if (f4RuntimeMayAnswer(runtime)) {
      runtime.setAnswerable(app.ticker?.started === true);
      tameGreetingAudioOwner?.setAnswerable(runtime.diagnostics().answerable);
    }
  }
  /* A receipt-bearing product action may already own activePersist while awaiting this
     heartbeat. Queuing this heartbeat's checkpoint behind that same barrier
     would make the action await the heartbeat while the heartbeat awaits the
     action. A later ordinary checkpoint remains free to queue after settle. */
  if (checkpointDue && !productActionInFlight) await persistView();
  if (heartbeatOwned && openPanelId() === 'shipyard' && !productActionInFlight) {
    refreshEngineeringPanelState();
  }
  if (heartbeatOwned && card.style.display !== 'none'
    && surveyOwnsCurrentCaptureSurface() && !productActionInFlight) {
    refreshCaptureCardState();
  }
};
const settleF4Heartbeat = async (): Promise<void> => {
  if (f4HeartbeatInFlight) await f4HeartbeatInFlight;
};
const startF4Heartbeat = (): void => {
  if (!f4Runtime || persistHold || !f4PageVisible() || f4HeartbeatTimer !== 0) return;
  f4HeartbeatTimer = window.setInterval(() => { void heartbeatF4(); }, F4_HEARTBEAT_MS);
};
let persistedPagehideCount = 0;
let persistedPageshowCount = 0;
let f4HideInFlight: Promise<void> | null = null;
const checkpointAndHideF4 = (): Promise<void> => {
  if (f4HideInFlight) return f4HideInFlight;
  const runtime = f4Runtime;
  if (!runtime) return Promise.resolve();
  /* Stop accrual at the lifecycle event, then checkpoint the captured interval
     while the old lease is still fenced. The periodic checkpoint bounds loss
     when pagehide itself cannot finish asynchronous storage. */
  runtime.setAnswerable(false);
  tameGreetingAudioOwner?.setAnswerable(false);
  const run = (async () => {
    let checkpoint: 'committed' | 'skipped' | 'rejected' = 'skipped';
    let checkpointError: string | null = null;
    let visibilityAttempted = false;
    let visibilityOutcome: string | null = null;
    let visibilityError: string | null = null;
    try {
      if (smokeRejectNextF4HideCheckpoint) {
        smokeRejectNextF4HideCheckpoint = false;
        throw new Error('slice-smoke injected F4 hide checkpoint rejection');
      }
      await settleF4Heartbeat();
      checkpoint = await persistView() ? 'committed' : 'skipped';
    } catch (error) {
      checkpoint = 'rejected';
      checkpointError = error instanceof Error ? error.message : String(error);
    } finally {
      visibilityAttempted = true;
      try { visibilityOutcome = (await runtime.setVisible(false)).kind; }
      catch (error) {
        visibilityError = error instanceof Error ? error.message : String(error);
        try { await runtime.release(); visibilityOutcome = 'release-fallback'; }
        catch (releaseError) {
          visibilityError += `; release fallback: ${releaseError instanceof Error ? releaseError.message : String(releaseError)}`;
        }
      }
    }
    lastF4HideWitness = Object.freeze({
      schema: 'cf-v2-f4-hide/v1', checkpoint, checkpointError,
      visibilityAttempted, visibilityOutcome, visibilityError,
    });
  })();
  f4HideInFlight = run;
  const clear = (): void => { if (f4HideInFlight === run) f4HideInFlight = null; };
  void run.then(clear, clear);
  return run;
};
const showF4 = async (): Promise<void> => {
  if (f4HideInFlight) await f4HideInFlight.catch(() => undefined);
  const runtime = f4Runtime;
  if (!runtime || !f4PageVisible()) return;
  const outcome = await runtime.setVisible(true);
  if (outcome.kind === 'owned') {
    if (!await ensureF4RevisionCurrent(runtime)) return;
    if ((f4SeedBootstrapPending || bootRouteRepairPending
      || arc2LootBootstrapPending || arc3EngineeringBootstrapPending
      || arc4OwnershipBootstrapPending || arc5OwnershipBootstrapPending)
      && !await ensureBootAuthorityCommit(runtime)) return;
    if (persistHold || runtime !== f4Runtime) return;
    if (!ecologyEpochAuthority.projectionMayAnswer()) {
      try { refreshCommittedEcologyProjection(); }
      catch (error) {
        scheduleF4AuthorityConvergenceReload(
          runtime,
          `deferred ecology projection rejected (${error instanceof Error ? error.message : String(error)})`,
        );
        return;
      }
    }
    runtime.setAnswerable(f4RuntimeMayAnswer(runtime) && app.ticker?.started === true);
    tameGreetingAudioOwner?.setAnswerable(runtime.diagnostics().answerable);
  } else {
    runtime.setAnswerable(false);
    tameGreetingAudioOwner?.setAnswerable(false);
  }
  startF4Heartbeat();
};
addEventListener('pagehide', (event) => {
  tameGreetingAudioOwner?.setHidden(true);
  if (!event.persisted) void tameGreetingAudioOwner?.dispose();
  stopF4Heartbeat();
  void checkpointAndHideF4();
  if (event.persisted) {
    persistedPagehideCount++;
    speciesArtLoader.suspendForBfcache();
  }
  else speciesArtLoader.dispose('document pagehide');
});
addEventListener('pageshow', (event) => {
  if (event.persisted) {
    persistedPageshowCount++;
    speciesArtLoader.resumeFromBfcache();
    tameGreetingAudioOwner?.setHidden(false);
    void showF4();
  }
});
addEventListener('visibilitychange', () => {
  tameGreetingAudioOwner?.setHidden(document.visibilityState !== 'visible');
  if (!f4Runtime) return;
  if (document.visibilityState !== 'visible') {
    stopF4Heartbeat();
    void checkpointAndHideF4();
    return;
  }
  void showF4();
});
type ReloadCanvasRelease = {
  beforeWidth: number;
  beforeHeight: number;
  afterWidth: number;
  afterHeight: number;
};
type ReplacementReloadReason = 'training-restart' | 'training-complete' | 'training-recovery' | 'save-import' | 'storage-retry';
type ImportPhaseStage =
  | 'invoked' | 'validation-rejected' | 'claim-rejected' | 'claimed'
  | 'waiting-active-persist' | 'no-active-persist' | 'active-persist-settled'
  | 'primary-write-started' | 'primary-write-complete' | 'primary-write-rejected'
  | 'release-started' | 'release-complete';
type ImportPhaseWitness = {
  schema: 'cf-v2-import-phase/v1';
  phaseId: string;
  reason: 'save-import';
  documentToken: string;
  stage: ImportPhaseStage;
  sequence: number;
  tickerStarted: boolean;
  performanceNow: number;
  error: string | null;
};
let lastImportPhaseWitness: ImportPhaseWitness | null = null;
type TrainingRestoreStage =
  | 'invoked' | 'validation-rejected' | 'claim-rejected' | 'claimed'
  | 'waiting-active-persist' | 'no-active-persist' | 'active-persist-settled'
  | 'candidate-started' | 'earth-proven' | 'source-deferred' | 'candidate-rejected'
  | 'primary-write-started' | 'primary-write-complete' | 'primary-write-rejected'
  | 'live-swap-complete' | 'reload-scheduled' | 'released';
type TrainingRestoreWitness = {
  schema: 'cf-v2-training-restore/v1';
  operationId: string;
  documentToken: string;
  intent: TrainingEndIntent;
  checkpointKind: ImportTrainingSnapshotIngressV2['kind'];
  stage: TrainingRestoreStage;
  sequence: number;
  tickerStarted: boolean;
  performanceNow: number;
  error: string | null;
};
type ReloadReleaseWitness = {
  schema: 'cf-v2-reload-release/v1';
  status: 'released' | 'release-failed';
  error: string | null;
  reason: ReplacementReloadReason;
  documentToken: string;
  audio: TameGreetingAudioDiagnostics | null;
  rendererReleased: boolean;
  stageReleased: boolean;
  viewDetached: boolean;
  appCanvas: ReloadCanvasRelease;
  backdropCanvas: ReloadCanvasRelease;
};
function tameGreetingAudioReleasedForReload(
  diagnostics: TameGreetingAudioDiagnostics | null,
): diagnostics is TameGreetingAudioDiagnostics {
  if (diagnostics === null) return false;
  const counterpartReleased = diagnostics.counterpart.status === 'none'
    ? diagnostics.counterpart.key === null && diagnostics.counterpart.generation === null
    : diagnostics.counterpart.status === 'lost';
  return diagnostics.schema === TAME_GREETING_AUDIO_DIAGNOSTICS_SCHEMA
    && diagnostics.disposed === true
    && diagnostics.armed === 0
    && diagnostics.activeVoiceId === null
    && counterpartReleased
    && diagnostics.runtime.state === 'disposed'
    && diagnostics.runtime.contextState === null
    && diagnostics.runtime.nodes.active === 0
    && diagnostics.runtime.voices.active === 0
    && diagnostics.runtime.voices.ids.length === 0
    && diagnostics.runtime.creatureEmitters.active === 0
    && diagnostics.runtime.reservations.voices.active === 0
    && diagnostics.runtime.reservations.nodes.active === 0;
}
type BootPhaseStage =
  | 'app-init-start' | 'app-init-complete' | 'backdrop-complete'
  | 'save-load-start' | 'save-load-complete' | 'scene-rendered'
  | 'slice-published' | 'wiring-complete' | 'ticker-started'
  | 'first-tick' | 'ready-scheduled' | 'ready-emitted';
type BootPhaseWitness = {
  schema: 'cf-v2-boot-phase/v1';
  documentToken: string;
  sequence: number;
  stage: BootPhaseStage;
  tickerStarted: boolean;
  performanceNow: number;
  error: null;
};
let bootPhaseSequence = 0;
function emitBootPhase(stage: BootPhaseStage): void {
  const witness: BootPhaseWitness = {
    schema: 'cf-v2-boot-phase/v1', documentToken: DOCUMENT_TOKEN,
    sequence: ++bootPhaseSequence, stage,
    tickerStarted: app.ticker?.started === true,
    performanceNow: performance.now(), error: null,
  };
  try {
    const binding = (window as unknown as Record<string, unknown>).__cfBootPhaseWitness;
    if (typeof binding === 'function') (binding as (payload: string) => unknown)(JSON.stringify(witness));
  } catch { /* optional diagnostics must never strand ordinary boot */ }
}
const unreleasedCanvas = (): ReloadCanvasRelease => ({
  beforeWidth: 0, beforeHeight: 0, afterWidth: 0, afterHeight: 0,
});
let releaseRendererForReload = (
  reason: ReplacementReloadReason,
  audio: TameGreetingAudioDiagnostics | null,
): ReloadReleaseWitness => ({
  schema: 'cf-v2-reload-release/v1', status: 'release-failed',
  error: 'renderer release hook was not initialized', reason,
  documentToken: DOCUMENT_TOKEN, audio,
  rendererReleased: false, stageReleased: false, viewDetached: false,
  appCanvas: unreleasedCanvas(), backdropCanvas: unreleasedCanvas(),
});
let replacementReloadScheduled = false;
let replacementReloadPending = false;
type ReplacementTransaction = Readonly<{
  reason: ReplacementReloadReason;
  token: symbol;
  tickerWasStarted: boolean;
  persistWasScheduled: boolean;
}>;
let replacementTransaction: ReplacementTransaction | null = null;
function claimReplacementTransaction(reason: ReplacementReloadReason): ReplacementTransaction | null {
  /* A reason string is not ownership: two rapid imports have the same reason
     but are distinct writes. One opaque claim per operation prevents either
     flow from releasing/reloading while another same-kind write is pending. */
  if (replacementTransaction) return null;
  tameGreetingAudioOwner?.setAnswerable(false);
  stopF4Heartbeat();
  /* Stop the outgoing renderer before the first persistence await. At an 8K
     software-rendered viewport, allowing another 16.7M-pixel frame to start
     can starve the IndexedDB completion task for the whole import budget.
     A failed replacement restarts only a ticker that this claim stopped; a
     successful replacement destroys it while quiescent. */
  const tickerWasStarted = app.ticker?.started === true;
  if (tickerWasStarted) {
    f4Runtime?.setAnswerable(false);
    app.stop();
  }
  const persistWasScheduled = _persistT !== 0;
  const claim = Object.freeze({
    reason, token: Symbol(reason), tickerWasStarted, persistWasScheduled,
  });
  replacementTransaction = claim;
  clearTimeout(_persistT); _persistT = 0;
  return claim;
}
function releaseReplacementTransaction(claim: ReplacementTransaction, rearmPersist = true): void {
  if (!replacementReloadScheduled && replacementTransaction === claim) {
    replacementTransaction = null;
    if (claim.tickerWasStarted && app.ticker && !app.ticker.started) {
      app.start();
      const runtime = f4Runtime;
      if (f4RuntimeMayAnswer(runtime)) {
        runtime.setAnswerable(true);
        tameGreetingAudioOwner?.setAnswerable(true);
      }
    }
    if (!persistHold) startF4Heartbeat();
    /* A refused replacement must not silently discard a pending settings
       slider write merely because ownership canceled its debounce timer. */
    if (rearmPersist && claim.persistWasScheduled) persistSoon();
  }
}
function scheduleReplacementReload(
  claim: ReplacementTransaction,
  afterRelease?: (witness: ReloadReleaseWitness) => void,
): void {
  /* These are the app's intentional, durable-write reloads. Release
     the old 8K renderer/backdrop before asking the browser to construct the
     replacement document; otherwise two capped backing stores can overlap
     during navigation. This is deliberately not a pagehide teardown: a
     BFCache restore must never revive an Application that we destroyed. */
  if (replacementReloadScheduled || replacementTransaction !== claim) return;
  const { reason } = claim;
  replacementReloadScheduled = true;
  replacementReloadPending = true;
  void (async () => {
    /* The old document must release its private lease before its renderer is
       destroyed and a fresh document token tries to acquire. */
    await settleF4Heartbeat();
    const audioOwner = tameGreetingAudioOwner;
    const audioReleaseErrors: string[] = [];
    try { await audioOwner?.dispose(); }
    catch (error) {
      audioReleaseErrors.push(error instanceof Error ? error.message : String(error));
    }
    let audioRelease: TameGreetingAudioDiagnostics | null = null;
    try { audioRelease = audioOwner?.diagnostics() ?? null; }
    catch (error) {
      audioReleaseErrors.push(error instanceof Error ? error.message : String(error));
    }
    if (!tameGreetingAudioReleasedForReload(audioRelease)) {
      audioReleaseErrors.push('audio release postcondition failed');
    }
    const runtime = f4Runtime;
    let runtimeReleaseError: string | null = null;
    try { await runtime?.release(); }
    catch (error) { runtimeReleaseError = error instanceof Error ? error.message : String(error); }
    if (f4Runtime === runtime) f4Runtime = null;

    let appChromeReleaseError: string | null = null;
    try { appChrome.dispose(); }
    catch (error) {
      appChromeReleaseError = error instanceof Error ? error.message : String(error);
    }

    let witness: ReloadReleaseWitness;
    try { witness = releaseRendererForReload(reason, audioRelease); }
    catch (error) {
      witness = {
        schema: 'cf-v2-reload-release/v1', status: 'release-failed',
        error: error instanceof Error ? error.message : String(error), reason,
        documentToken: DOCUMENT_TOKEN, audio: audioRelease,
        rendererReleased: false, stageReleased: false, viewDetached: false,
        appCanvas: unreleasedCanvas(), backdropCanvas: unreleasedCanvas(),
      };
    }
    const ownerReleaseErrors = [...audioReleaseErrors, runtimeReleaseError, appChromeReleaseError]
      .filter((error): error is string => error !== null);
    if (ownerReleaseErrors.length > 0) {
      witness = {
        ...witness,
        status: 'release-failed',
        error: [witness.error, ...ownerReleaseErrors].filter(Boolean).join('; '),
      };
    }
    /* Runtime.addBinding installs this optional diagnostics seam before the
       page boots. Ordinary play has no such property. CDP receives the release
       evidence outside the dying execution context, so a vanished global can
       never masquerade as a replacement page becoming ready. */
    try {
      const binding = (window as unknown as Record<string, unknown>).__cfReloadReleaseWitness;
      if (typeof binding === 'function') (binding as (payload: string) => unknown)(JSON.stringify(witness));
    } catch { /* evidence harness fails closed when its binding is absent/broken */ }
    try { afterRelease?.(witness); }
    catch { /* optional evidence must never strand a completed durable write */ }
    /* One task boundary lets WebGL context loss/canvas resize settle and lets
       importBlob resolve, without retrying or hiding a failed navigation. */
    setTimeout(() => location.reload(), 0);
  })();
}
/* ---- THE PHASE 4 CHROME (UI_PRESENTATION contracts): the unified topbar
   (trail · player chip · objective chip) publishing --topbar-h, the hint
   pill, the Georgia-italic caption line, and the 44px dock. Static DOM in
   index.html; app-chrome owns filling, measurement, and observation. ---- */
const appChrome = createAppChromeController({
  onViewportResize: () => {
    /* rotation moves minWH while the ascend floors read gz0/sz0 live (audit
       #8) — recompute for the mode you are IN so the thresholds agree */
    if (nav.mode === 'galaxy') gz0 = 0.42 * minWH() / GR;
    else if (nav.mode === 'system') sz0 = 0.40 * minWH() / SYS_R;
  },
});
const {
  syncTopbarH,
  syncDockH,
  syncContextH: syncCtxH,
  syncHintH,
  setContext: setCtx,
  setHint,
  setTrail,
} = appChrome;
/* Survey and Planetside retain their existing synchronization seam while the
   DOM and geometry authority live entirely in app-chrome. */
function syncSurfaceChromeBottom(): void {
  appChrome.syncSurfaceChromeBottom();
}
const esc = (s: unknown): string => String(s ?? '').replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]!));
type DevelopmentPreviewIdentity = Readonly<{
  sourceCommit: string;
  shortCommit: string;
  sourceState: string;
  expectedOrigin: string;
  publishable: boolean;
  developmentVersion: string;
}>;
const previewIdentity = (globalThis as typeof globalThis & {
  __CF_DEV_PREVIEW__?: DevelopmentPreviewIdentity;
}).__CF_DEV_PREVIEW__;
function guideBuildIdentity(): string {
  const source = previewIdentity?.sourceCommit;
  const build = source && /^[0-9a-f]{40}$/.test(source)
    ? `<span data-sel="guide-build-commit">Build ${esc(source)}</span>`
    : '<span data-sel="guide-build-commit">Local development source</span>';
  return `<div class="guide-build" data-sel="guide-build"><b>Celestial Frontier v${esc(V2_DEVELOPMENT_VERSION)} development</b>${build}</div>`;
}
const indexedDBPersistenceBackend = createIndexedDBBackend('cf-v2-slice');
let smokeRejectArc3StorageBoundary = false;
let smokeRejectArc4StorageBoundary = false;
/* Browser-gate one-shot storage faults still cross the production revision
   repository and exact product-action owner. Only the armed action-scoped
   compare-and-apply is rejected; ordinary play delegates byte-for-byte. */
const persistenceBackend: StorageBackend = {
  get: (store, key) => indexedDBPersistenceBackend.get(store, key),
  apply: (operations) => indexedDBPersistenceBackend.apply(operations),
  compareAndApply: (checks, operations, clearStores) => {
    if (smokeRejectArc3StorageBoundary) {
      smokeRejectArc3StorageBoundary = false;
      return Promise.reject(new Error('slice-smoke injected Arc 3 action storage failure'));
    }
    if (smokeRejectArc4StorageBoundary) {
      smokeRejectArc4StorageBoundary = false;
      return Promise.reject(new Error('slice-smoke injected Arc 4 capture storage failure'));
    }
    return indexedDBPersistenceBackend.compareAndApply(checks, operations, clearStores);
  },
  keys: (store) => indexedDBPersistenceBackend.keys(store),
  clear: (stores) => indexedDBPersistenceBackend.clear(stores),
};
const repo = createSaveRepository(persistenceBackend);
const revisionRepo = createRevisionedRepository(persistenceBackend);
const EMPTY_V5_EXTENSIONS: V5Extensions = Object.freeze({});
type PersistenceBootKind =
  | 'fresh-v5' | 'migrated-v4' | 'current-v5'
  | 'recovered-v4-protected' | 'future-protected'
  | 'corrupt-protected' | 'transient-protected';
let persistenceBootKind: PersistenceBootKind = 'transient-protected';
let persistenceProtectedDetail: string | null = null;
let f4AuthorityBootKind: ReturnType<typeof readF4Authority>['kind'] | 'unavailable' = 'unavailable';
let lastPersistenceOutcome: string | null = null;
let lastSmokeImportRaceWitness: Readonly<{
  beforeRevision: number;
  afterRevision: number;
  outcome: string;
}> | null = null;
/* THE REAL SAVE LOOP: the slice persists a genuine cfcc_save_v2 blob through
   the v5 split-store/revision boundary while retaining exportSaveV2 as the
   compatibility mirror. The nav view rides in `view`, landings ride in
   `land`. An older slice store that held only {nav,view} JSON migrates once
   through the persistence package's exact stored-source bridge. */
let save: SaveStateV2;
let f3PersistenceBrowserProbeInFlight = false;
async function runF3PersistenceBrowserEvidence() {
  if (f3PersistenceBrowserProbeInFlight) {
    throw new Error('F3 persistence browser probe is already running');
  }
  f3PersistenceBrowserProbeInFlight = true;
  try {
    const now = Date.now();
    return await runF3PersistenceBrowserProbe({
      dbPrefix: `cf-f3-probe-${crypto.randomUUID()}`,
      legacyV4Raw: exportSaveV2(save, now),
      registry: REGISTRY,
      now,
    });
  } finally {
    f3PersistenceBrowserProbeInFlight = false;
  }
}
/* Import keeps raw route evidence outside the v4 save. Proven navigation is
   likewise runtime-only: exporter spreads no brands, keys, ordinals, or
   source cells into player bytes. */
let atlasRouteStates = new WeakMap<Record<string, unknown>, NavState>();
let importedRouteIngress: ImportRouteIngressV2 | null = null;
let trainingSnapshotIngress: ImportTrainingSnapshotIngressV2 = Object.freeze({ kind: 'none' });
let trainingCheckpointWriteHeld = false;
let trainingBootRouteBlocked = false;
let trainingBootRuntimeOnlySeat = false;
let savedRouteWriteHeld = false;
let smokeRejectNextTrainingRouteResolution = false;
let smokeRejectNextTrainingCandidateProof = false;
let smokeRejectNextTrainingCommit = false;
let smokeRejectNextTrainingPublish = false;
let trainingRestoreOperationSerial = 0;
let lastTrainingRestoreWitness: TrainingRestoreWitness | null = null;
/* COSMIC_EPOCH is a separately capped ecology/legacy-harvest projection over
   F4's already-authoritative activePlayMs. Candidate time stays private until
   one receipt-free lease/revision CAS commits; gameplay and rendering consume
   only published(). Hidden, unanswerable and lease-losing documents therefore
   accrue neither readiness nor ecology without duplicating F4's clock policy. */
let ecologyEpochAuthority: EcologyEpochEdgeAuthority = createEcologyEpochEdgeAuthority({
  restoredEpoch: 0,
  activePlayAtBootMs: 0,
});
let ecologyObservedActivePlayMs = 0;
let ecologyEdgeCheckpointInFlight: Promise<boolean> | null = null;
let lastEcologyEdgeOutcome: string | null = null;
const currentEcologyEpoch = (): number => ecologyEpochAuthority.published();
const ecologyActivePlayNow = (): number => {
  const runtime = f4Runtime;
  if (runtime !== null) {
    ecologyObservedActivePlayMs = Math.max(
      ecologyObservedActivePlayMs,
      runtime.diagnostics().activePlayMs,
    );
  }
  return ecologyObservedActivePlayMs;
};
const ecologyEpochBlocksActions = (): boolean => (
  ecologyEpochAuthority.blocksEcology(ecologyActivePlayNow())
);
const TOUCH_DPR = navigator.maxTouchPoints > 0
  || (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches);
/* The app and its full-viewport 2D backdrop coexist. Treat one 4096² store
   as their aggregate pixel budget, not as permission for two 4096² stores.
   CSS viewports larger than one half-budget are an ultra-density stress case:
   preserve native backing through UHD 3840×2160, then cap each simultaneous
   store at 2,073,600 pixels (1,920×1,080) so a slow software renderer retains
   sustained answerability after publishing readiness and across resize. */
const MAX_FULL_VIEWPORT_BACKING_PIXELS = 16_777_216;
const FULL_VIEWPORT_CANVAS_COUNT = 2;
const MAX_BACKING_PIXELS_PER_CANVAS = MAX_FULL_VIEWPORT_BACKING_PIXELS / FULL_VIEWPORT_CANVAS_COUNT;
const MAX_ULTRA_VIEWPORT_BACKING_PIXELS_PER_CANVAS = 2_073_600;
const roundedBackingPixels = (width: number, height: number, resolution: number): number =>
  Math.max(1, Math.round(width * resolution)) * Math.max(1, Math.round(height * resolution));
const fitResolutionToPixelCap = (
  requested: number, width: number, height: number, pixelCap: number,
): number => {
  const dimensionFloor = Math.min(1 / width, 1 / height);
  let low = dimensionFloor;
  let high = Math.max(dimensionFloor, requested);
  if (roundedBackingPixels(width, height, high) <= pixelCap) return high;
  /* The square-root memory bound is continuous, while both Canvas and Pixi
     round backing dimensions independently. Find the greatest representable
     resolution whose actual rounded width×height still fits the selected cap. */
  for (let i = 0; i < 64; i++) {
    const mid = low + (high - low) / 2;
    if (mid === low || mid === high) break;
    if (roundedBackingPixels(width, height, mid) <= pixelCap) low = mid;
    else high = mid;
  }
  return low;
};
type RendererDensityPlan = Readonly<{
  dpr: number;
  backingPixelCapPerCanvas: number;
  viewportWidth: number;
  viewportHeight: number;
}>;
const effectiveDensityPlan = (): RendererDensityPlan => {
  const viewportWidth = Math.max(1, innerWidth);
  const viewportHeight = Math.max(1, innerHeight);
  const viewportPixels = viewportWidth * viewportHeight;
  const backingPixelCapPerCanvas = viewportPixels > MAX_BACKING_PIXELS_PER_CANVAS
    ? MAX_ULTRA_VIEWPORT_BACKING_PIXELS_PER_CANVAS
    : MAX_BACKING_PIXELS_PER_CANVAS;
  const device = Number.isFinite(devicePixelRatio) ? Math.max(1, devicePixelRatio) : 1;
  const heatCap = TOUCH_DPR ? 2 : 3;
  const memoryCap = Math.sqrt(backingPixelCapPerCanvas / viewportPixels);
  /* A CSS viewport can exceed one canvas's standard half-budget beyond UHD.
     Pixi supports sub-1 resolution while autoDensity preserves the CSS box,
     so keep the selected twin-canvas ceiling instead of silently exceeding
     it at the old DPR-1 floor. */
  const dimensionFloor = Math.min(1 / viewportWidth, 1 / viewportHeight);
  const requested = Math.max(dimensionFloor, Math.min(device, heatCap, memoryCap));
  return {
    dpr: fitResolutionToPixelCap(
      requested, viewportWidth, viewportHeight, backingPixelCapPerCanvas,
    ),
    backingPixelCapPerCanvas,
    viewportWidth,
    viewportHeight,
  };
};
let densityPlan = effectiveDensityPlan();
let DPR = densityPlan.dpr;
const minWH = (): number => Math.max(80, Math.min(innerWidth, innerHeight));   /* floor: a zero-sized window must not mint z=0 → NaN cameras (audit #8) */

let nav: NavState = NAV_HOME;
const describePick = (pick: DescriptorPick): Descriptor | null =>
  describePickWithState(pick, nav, (key) => customNames.get(key));
type ProvenGalaxyStats = Readonly<{ stars: number; planets: number }>;
const provenGalaxyStats = new WeakMap<ProvenGalaxy, ProvenGalaxyStats>();
function statsForProvenGalaxy(galaxy: ProvenGalaxy): ProvenGalaxyStats {
  const cached = provenGalaxyStats.get(galaxy);
  if (cached) return cached;
  /* The lifted helper memoizes by assigning `_stats` to its argument. Proven
     hierarchy objects are deliberately frozen, so give that presentation
     helper a disposable mutable copy and keep its result in an app sidecar. */
  const raw = galaxyStats({ ...galaxy } as never) as ProvenGalaxyStats;
  const computed = Object.freeze({ stars: raw.stars, planets: raw.planets });
  provenGalaxyStats.set(galaxy, computed);
  return computed;
}
type RenderedSceneReceipt = Readonly<{
  serial: number;
  mode: NavState['mode'];
  ecologyEpoch: number;
  galaxyKey: string | null;
  starKey: string | null;
  worldKey: string | null;
}>;
let renderedSceneReceipt: RenderedSceneReceipt = Object.freeze({
  serial: 0, mode: 'universe', ecologyEpoch: 0,
  galaxyKey: null, starKey: null, worldKey: null,
});
let smokeAbortNextRenderBeforeReceipt = false;
function abortRenderBeforeReceiptForSmoke(): boolean {
  if (!smokeAbortNextRenderBeforeReceipt) return false;
  smokeAbortNextRenderBeforeReceipt = false;
  return true;
}
function recordRenderedScene(state: NavState): void {
  renderedSceneReceipt = Object.freeze({
    serial: renderedSceneReceipt.serial + 1,
    mode: state.mode,
    ecologyEpoch: currentEcologyEpoch(),
    galaxyKey: state.mode === 'universe' ? null : getProvenGalaxyKey(state.gal),
    starKey: state.mode === 'system' || state.mode === 'surface' ? getProvenStarKey(state.star) : null,
    worldKey: state.mode === 'surface' ? getProvenPlanetKey(state.planet) : null,
  });
}
const cam = { x: 0, y: 0, z: 1 };
const camT = { x: 0, y: 0, z: 1 };   /* eased target — the goTo feel */
const world = new Container();
/* the game's entry zooms, recomputed at each descent (main.js 3396/3462) */
let gz0 = 0.42 * minWH() / GR;
let sz0 = 0.40 * minWH() / SYS_R;

/* ---- the survey card: HTML over TYPED SELECTORS (Gate D contract).
   Position/layout is CSS's (index.html #survey: below --topbar-h, clear of
   the dock — the CF1806-02 burial class prevented structurally). esc covers
   quotes: keys/classes land in ATTRIBUTES (2026-08-01 exploit pass). ---- */
const card = document.createElement('aside');
card.id = 'survey';
card.className = 'glass';
card.dataset.panelBoundary = '';
card.setAttribute('role', 'region');
card.setAttribute('aria-label', 'Survey card');
card.setAttribute('aria-hidden', 'true');
document.body.appendChild(card);
const surveyDockEl = document.getElementById('docksurvey')!;
const chartsDockEl = document.getElementById('dockcharts')!;
let surveyFocusReturn: HTMLElement | null = null;
let lastCard: Descriptor | null = null;
let cardCtx: {
  p: PlanetNode;
  gal: ProvenGalaxy;
  star: ProvenStar;
  planet: ProvenPlanet;
} | null = null;
interface CardTravelAction { label: 'Enter galaxy' | 'Enter system'; run: () => void; }
let cardTravelAction: CardTravelAction | null = null;
const captureCardController = new CaptureCardController({
  root: card,
  onNativeTameGesture: () => {
    tameGreetingAudioOwner?.armNativeTameGesture();
  },
  onAction: (request) => {
    const presentationFence = currentCapturePresentationFence;
    captureCardController.setPending(request);
    void runCaptureCardAction(request, presentationFence);
  },
});
function surveyOwnsCurrentCaptureSurface(): boolean {
  return nav.mode === 'surface' && cardCtx !== null
    && getProvenGalaxyKey(nav.gal) === getProvenGalaxyKey(cardCtx.gal)
    && getProvenStarKey(nav.star) === getProvenStarKey(cardCtx.star)
    && getProvenPlanetKey(nav.planet) === getProvenPlanetKey(cardCtx.planet)
    && !trainingActive();
}
function reconstructCurrentSurfaceSurvey() {
  /* A replacement document restores only its durable route. The first Survey
     activation may rebuild presentation from that route, but only after the
     live hierarchy, source ordinal and completed render all prove the same
     world. This path presents no new player action and therefore owns no
     persistence, capture draw/receipt, Survey event or audio. */
  if (nav.mode !== 'surface' || trainingActive()) return false;
  const address = canonicalCF1WorldAddressFromNav(nav);
  if (!address.ok
    || renderedSceneReceipt.serial <= 0
    || renderedSceneReceipt.mode !== 'surface'
    || renderedSceneReceipt.ecologyEpoch !== currentEcologyEpoch()
    || renderedSceneReceipt.galaxyKey !== getProvenGalaxyKey(nav.gal)
    || renderedSceneReceipt.starKey !== getProvenStarKey(nav.star)
    || renderedSceneReceipt.worldKey !== address.address.key) return false;
  const planet = planetNodeForProof(nav.star, nav.planet);
  if (planet === null
    || planet.seed !== address.address.planet.seed
    || planet.ordinal !== address.address.planet.ordinal
    || !presentPlanetSurvey(planet, nav.star, nav.planet)) return false;
  surveyFocusReturn = surveyDockEl;
  return true;
}
type SurveyPresentationRow = readonly [key: string, value: string, cls?: string];
const EMPTY_SURVEY_PRESENTATION_ROWS = Object.freeze([]) as readonly SurveyPresentationRow[];

function showSurvey(
  d: Descriptor,
  actionsHtml?: string,
  travelAction: CardTravelAction | null = null,
  supplementalRows: readonly SurveyPresentationRow[] = EMPTY_SURVEY_PRESENTATION_ROWS,
  preparedCaptureRoster: CanonicalWorldRoster | null = null,
): void {
  if (document.activeElement === app.canvas) surveyFocusReturn = app.canvas;
  cardTravelAction = travelAction;
  if (actionsHtml === undefined) cardCtx = null;
  lastCard = d;
  const travelHtml = travelAction
    ? '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0 4px">' +
      `<button data-act="travel" style="background:rgba(202,162,79,0.14);color:#ffd9a0;border:1px solid #caa24f;border-radius:999px;padding:8px 16px;cursor:pointer;min-height:44px;font:12px system-ui">${esc(travelAction.label)}</button>` +
      '</div>'
    : '';
  const rows = [
    ...(d.rows as Array<[string, string, string?]>).filter(([key]) => key !== 'Spectral class'),
    ...supplementalRows,
  ];
  const isPlanet = typeof d.planetSeed === 'number';
  const landedPlanet = isPlanet && !!save?.landed.includes(d.planetSeed as number);
  const rarityView = typeof d.designation?.name === 'string'
    ? projectDisplayRarity(d.designation.tier)
    : null;
  const rarityVisible = rarityView !== null && (!isPlanet || landedPlanet);
  const rarity = rarityVisible
    ? `<div data-row="Rarity" class="survey-row"><span>Rarity</span><br>${esc(rarityView.name)}</div>`
    : '';
  const ownsCurrentSurface = surveyOwnsCurrentCaptureSurface();
  const captureHtml = ownsCurrentSurface
    ? '<section data-capture-card-body aria-label="Biosphere capture"></section>'
    : '';
  card.innerHTML =
    '<div class="survey-head">' +
    `<div><h2 data-sel="title">${esc(d.title)}</h2>` +
    `<div data-sel="sub">${esc(d.sub)}${d.badge ? ` · <b data-sel="badge">${esc(d.badge)}</b>` : ''}</div></div>` +
    '<button type="button" class="surface-close" data-survey-close aria-label="Close Survey card">✕</button></div>' +
    travelHtml +
    (actionsHtml || '') +   /* the card's ACTION ROW (Land · +Atlas · share) — buttons are trusted markup, never save text */
    captureHtml + rarity + rows.map(([k, v, cls]) =>
      `<div data-row="${esc(k)}" data-cls="${esc(cls || '')}" class="survey-row"><span>${esc(k)}</span><br>${esc(v)}</div>`).join('');
  const captureMount = card.querySelector<HTMLElement>('[data-capture-card-body]');
  if (captureMount === null) captureCardController.detach();
  else {
    captureCardController.attach(captureMount);
    if (!productActionInFlight) refreshCaptureCardState(preparedCaptureRoster);
  }
  card.style.display = 'block';
  card.dataset.ecologyEpoch = String(currentEcologyEpoch());
  card.setAttribute('aria-hidden', 'false');
  document.body.classList.add('card-open');
  syncSurfaceChromeBottom();
  surveyDockEl.classList.add('on');
  surveyDockEl.setAttribute('aria-expanded', 'true');
}
function hideSurvey(restoreFocus = false): void {
  card.style.display = 'none';
  card.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('card-open');
  syncSurfaceChromeBottom();
  surveyDockEl.classList.remove('on');
  surveyDockEl.setAttribute('aria-expanded', 'false');
  if (restoreFocus && surveyFocusReturn?.isConnected) {
    const target = surveyFocusReturn;
    surveyFocusReturn = null;
    queueMicrotask(() => target.focus());
  }
}
function closeVisibleSurveyAndAscend(restoreFocus: boolean): void {
  /* Survey Close remains available while an action settles, but the shared
     goUp() fence still owns whether this same input may change route. Idle
     surface Escape/right-click therefore closes and lifts exactly once;
     pending capture closes only and cannot reach rerender/persistence. */
  hideSurvey(restoreFocus);
  if (nav.mode === 'surface') goUp();
}
function invalidateSurveyTravel(): void {
  cardTravelAction = null;
  surveyFocusReturn = null;
  card.querySelector('[data-act="travel"]')?.remove();
}

/* ---- the save-import sheet (Phase 4's second UI component; GATE C's front
   door): paste or pick your cfcc_save_v2 blob — VALIDATED through the real
   importSaveV2 first and stored as primary. The player's external backup
   remains the authoritative exact copy; the app only ATTEMPTS an additional
   untouched local keepsake because browser storage may refuse it. ---- */
const sheet = document.createElement('div');
sheet.id = 'importsheet';
sheet.setAttribute('role', 'dialog');
sheet.setAttribute('aria-modal', 'true');
sheet.setAttribute('aria-label', 'Bring your expedition');
sheet.style.cssText = 'position:fixed;inset:0;padding:calc(var(--safe-top,0px) + 16px) calc(var(--safe-right,0px) + 16px) calc(var(--safe-bottom,0px) + 16px) calc(var(--safe-left,0px) + 16px);' +
  'box-sizing:border-box;align-items:center;justify-content:center;overflow:hidden;background:rgba(4,6,12,0.7);display:none;z-index:40';
sheet.innerHTML =
  '<div style="position:relative;width:min(520px,100%);box-sizing:border-box;max-height:100%;overflow:auto;' +
  'background:rgba(10,16,30,0.97);border:1px solid #2a3c5e;border-radius:12px;padding:18px;color:#cfe0f4;font:13px/1.5 system-ui,sans-serif">' +
  '<h2 style="font-size:15px;margin:0 0 4px">Bring your expedition</h2>' +
  '<span data-sel="import-safety" style="color:var(--dim)">Paste or pick a moderator-provided copied expedition save. Keep that external moderator backup as the authoritative exact copy. The app checks the save before storing it and attempts an additional exact local keepsake after import, but browser storage can refuse that keepsake.</span>' +
  '<textarea id="importtext" aria-label="Paste expedition save data" style="width:100%;height:120px;margin:10px 0;background:#0b1220;color:#cfe0f4;border:1px solid #22304a;border-radius:8px;padding:8px;box-sizing:border-box;font:12px monospace"></textarea>' +
  '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
  '<button id="importgo" style="background:#1d3a5e;color:#eaf2ff;border:1px solid #3a5c8e;border-radius:8px;padding:8px 14px;cursor:pointer;min-height:44px">Import & reload</button>' +
  '<button id="importpick" type="button" style="background:#14233c;color:#cfe0f4;border:1px solid #2a3c5e;border-radius:8px;padding:8px 14px;cursor:pointer;min-height:44px">Pick file</button>' +
  '<input id="importfile" aria-label="Choose an expedition save file" type="file" accept=".json,.txt" tabindex="-1" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)">' +
  '<button id="importretry" type="button" hidden style="background:#14233c;color:#cfe0f4;border:1px solid #2a3c5e;border-radius:8px;padding:8px 14px;cursor:pointer;min-height:44px">Reload to retry</button>' +
  '<button id="importclose" style="background:transparent;color:var(--dim);border:1px solid #22304a;border-radius:8px;padding:8px 14px;cursor:pointer;min-height:44px">close</button>' +
  '</div><div id="importmsg" role="alert" aria-live="assertive" aria-atomic="true" style="margin-top:8px;color:#e8a0a0"></div></div>';
document.body.appendChild(sheet);
const importBackgroundState = new Map<HTMLElement, { inert: boolean; ariaHidden: string | null }>();
let importBackgroundObserver: MutationObserver | null = null;
type TrainingRecoveryLock = 'unknown-checkpoint' | 'route-unavailable';
let trainingRecoveryLock: TrainingRecoveryLock | null = null;
function rememberAndLockImportBackground(el: HTMLElement): void {
  if (el === sheet) return;
  if (!importBackgroundState.has(el)) {
    importBackgroundState.set(el, { inert: el.inert, ariaHidden: el.getAttribute('aria-hidden') });
  }
  if (!el.inert) el.inert = true;
  if (el.getAttribute('aria-hidden') !== 'true') el.setAttribute('aria-hidden', 'true');
}
function enforceImportBackgroundInert(): void {
  for (const child of [...document.body.children]) {
    if (child instanceof HTMLElement) rememberAndLockImportBackground(child);
  }
}
function configureImportSheet(): void {
  const title = sheet.querySelector<HTMLElement>('h2')!;
  const safety = sheet.querySelector<HTMLElement>('[data-sel="import-safety"]')!;
  const close = sheet.querySelector<HTMLButtonElement>('#importclose')!;
  const retry = sheet.querySelector<HTMLButtonElement>('#importretry')!;
  sheet.dataset.mode = trainingRecoveryLock || 'import';
  if (trainingRecoveryLock) {
    title.textContent = trainingRecoveryLock === 'unknown-checkpoint'
      ? 'Field Training checkpoint protected'
      : 'Field Training route unavailable';
    safety.textContent = trainingRecoveryLock === 'unknown-checkpoint'
      ? 'This checkpoint is not recognized by this build. Exploration is locked so no change can appear saved while its bytes remain protected. Update and reload, or import a trusted complete expedition.'
      : 'Field Training could not verify its route to Sol. Exploration is locked so practice cannot become unsaved session-only progress. Reload to retry, or import a trusted complete expedition.';
    close.hidden = true;
    close.disabled = true;
    retry.hidden = false;
    sheet.setAttribute('aria-label', title.textContent || 'Field Training recovery');
    return;
  }
  title.textContent = 'Bring your expedition';
  safety.textContent = 'Paste or pick a moderator-provided copied expedition save. Keep that external moderator backup as the authoritative exact copy. The app checks the save before storing it and attempts an additional exact local keepsake after import, but browser storage can refuse that keepsake.';
  close.hidden = false;
  close.disabled = false;
  retry.hidden = true;
  sheet.setAttribute('aria-label', 'Bring your expedition');
}
/* ---- THE DOCK: eight live controls, every press proven by an EFFECT (the
   simrun-dom law — a dead button never ships). charts/sound flip the REAL
   save fields and persist through exportSaveV2. ---- */
function openImportSheet(): void {
  closePanels();
  configureImportSheet();
  if (sheet.style.display !== 'none') {
    enforceImportBackgroundInert();
    (sheet.querySelector('#importtext') as HTMLTextAreaElement | null)?.focus();
    return;
  }
  importBackgroundState.clear();
  enforceImportBackgroundInert();
  importBackgroundObserver?.disconnect();
  importBackgroundObserver = new MutationObserver(enforceImportBackgroundInert);
  importBackgroundObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ['inert', 'aria-hidden'],
    childList: true,
    subtree: true,
  });
  sheet.style.display = 'flex';
  (sheet.querySelector('#importtext') as HTMLTextAreaElement | null)?.focus();
}
function closeImportSheet(): void {
  if (trainingRecoveryLock) {
    (sheet.querySelector<HTMLElement>('#importtext') || sheet.querySelector<HTMLElement>('button'))?.focus();
    return;
  }
  importBackgroundObserver?.disconnect();
  importBackgroundObserver = null;
  sheet.style.display = 'none';
  for (const [el, { inert, ariaHidden }] of importBackgroundState) {
    el.inert = inert;
    if (ariaHidden === null) el.removeAttribute('aria-hidden'); else el.setAttribute('aria-hidden', ariaHidden);
  }
  importBackgroundState.clear();
  document.getElementById('docksets')?.focus();
}
function openTrainingRecoverySheet(reason: TrainingRecoveryLock): void {
  trainingRecoveryLock = reason;
  openImportSheet();
}
document.addEventListener('focusin', (event) => {
  if (sheet.style.display === 'none' || sheet.contains(event.target as Node)) return;
  (sheet.querySelector<HTMLElement>('#importtext') || sheet.querySelector<HTMLElement>('button'))?.focus();
}, true);
surveyDockEl.addEventListener('click', () => {
  /* Re-show a retained card. A fresh replacement document deliberately has
     none, so its native dock activation may source-prove and present the
     current rendered surface without replaying a Survey action. */
  if (cardCtx && !activeCardPlanetWhere()) {
    cardCtx = null;
    captureCardController.detach();
    card.innerHTML = '';
    hideSurvey();
    return;
  }
  const staleCaptureMount = card.querySelector<HTMLElement>('[data-capture-card-body]');
  if (staleCaptureMount !== null && !surveyOwnsCurrentCaptureSurface()) {
    captureCardController.detach();
    staleCaptureMount.remove();
  }
  if (staleCaptureMount !== null && surveyOwnsCurrentCaptureSurface()
    && !productActionInFlight) refreshCaptureCardState();
  if (card.style.display === 'none' && !card.innerHTML
    && reconstructCurrentSurfaceSurvey()) return;
  if (card.style.display === 'none' && card.innerHTML && cardCtx) {
    const context = cardCtx;
    surveyFocusReturn = surveyDockEl;
    /* A retained planet card may have crossed Surface/System since it was
       painted. Re-prove and rebuild it without replaying the Survey action. */
    if (presentPlanetSurvey(context.p, context.star, context.planet)) return;
  }
  if (card.style.display === 'none' && card.innerHTML) {
    surveyFocusReturn = surveyDockEl;
    card.style.display = 'block';
    card.setAttribute('aria-hidden', 'false');
    document.body.classList.add('card-open');
    surveyDockEl.classList.add('on');
    surveyDockEl.setAttribute('aria-expanded', 'true');
  } else hideSurvey();
});
chartsDockEl.addEventListener('click', () => {
  if (!save) return;   /* pre-boot click (audit #3) */
  save.chartsOn = !save.chartsOn;
  chartsDockEl.classList.toggle('on', save.chartsOn);
  chartsDockEl.setAttribute('aria-pressed', String(save.chartsOn));
  if (chartLayer) chartLayer.visible = save.chartsOn;
  fillSettings();   /* the panel mirrors the dock (and vice versa) */
  void persistView();
});

/* ---- SETTINGS (the first rail panel): every control drives a REAL save
   field and persists through exportSaveV2 — sound, volume (the squared-
   taper bus), charts, motion (Auto follows the OS), the glass tint ---- */
const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');
function motionOK(): boolean {
  /* main.js motionOK: Auto (-1) follows the OS preference LIVE */
  return save.motionMode === -1 ? !reducedMotionQuery.matches : save.motionMode === 0;
}
function applyGlass(): void {
  /* Bright space art sits directly behind every panel. The old 0.40 floor
     can reduce secondary copy to roughly 1–2.5:1, so v2 enforces the first
     contrast-safe glass tier while retaining the player's more-solid choice. */
  const a = Math.min(Math.max(save.glassTint, 0.82), 0.98);
  document.documentElement.style.setProperty('--glass-a', String(a));
}
function applyDisplayPreferences(): void {
  const body = document.body;
  body.classList.remove('fs-lg', 'fs-xl', 'tone-bright', 'tone-max', 'font-sys', 'font-mono');
  if (save.fsMode) body.classList.add(save.fsMode);
  if (save.toneMode) body.classList.add(save.toneMode);
  if (save.fontMode) body.classList.add(save.fontMode);
  body.classList.toggle('motion-reduced', !motionOK());
  applyGlass();
  syncTopbarH(); syncDockH(); syncCtxH(); syncHintH(); syncSurfaceChromeBottom();
}
reducedMotionQuery.addEventListener('change', () => {
  if (save?.motionMode === -1) applyDisplayPreferences();
});
function fillSettings(): void {
  if (!save) return;   /* a click before boot finishes must not throw */
  fillPanel('set',
    '<h3>Settings</h3>' +
    `<div class="row"><label>Sound</label><button id="setsnd" aria-label="Sound" aria-pressed="${save.sndOn}" class="${save.sndOn ? 'on' : ''}" data-sel="set-sound">${save.sndOn ? 'On' : 'Off'}</button></div>` +
    `<div class="row"><label>Volume</label><input id="setvol" data-sel="set-vol" aria-label="Sound volume" type="range" min="0" max="100" value="${Math.round(save.sfxVol * 100)}"></div>` +
    `<div class="row"><label>Creature voices</label><button id="setvoice" aria-label="Creature voices" aria-pressed="${save.voiceOn}" class="${save.voiceOn ? 'on' : ''}" data-sel="set-voice">${save.voiceOn ? 'On' : 'Off'}</button></div>` +
    `<div class="row"><label>Text size</label><span class="seg" role="group" aria-label="Text size">` +
    [['', 'A'], ['fs-lg', 'A+'], ['fs-xl', 'A++']].map(([v, t]) =>
      `<button data-pref="size" data-value="${v}" aria-pressed="${save.fsMode === v}" class="${save.fsMode === v ? 'on' : ''}">${t}</button>`).join('') +
    '</span></div>' +
    `<div class="row"><label>Text tone</label><span class="seg" role="group" aria-label="Text tone">` +
    [['', 'Soft'], ['tone-bright', 'Bright'], ['tone-max', 'Max']].map(([v, t]) =>
      `<button data-pref="tone" data-value="${v}" aria-pressed="${save.toneMode === v}" class="${save.toneMode === v ? 'on' : ''}">${t}</button>`).join('') +
    '</span></div>' +
    `<div class="row"><label>Font</label><span class="seg" role="group" aria-label="Font">` +
    [['', 'Rounded'], ['font-sys', 'System'], ['font-mono', 'Mono']].map(([v, t]) =>
      `<button data-pref="font" data-value="${v}" aria-pressed="${save.fontMode === v}" class="${save.fontMode === v ? 'on' : ''}">${t}</button>`).join('') +
    '</span></div>' +
    `<div class="row"><label>Star charts</label><button id="setcharts" aria-label="Star charts" aria-pressed="${save.chartsOn}" class="${save.chartsOn ? 'on' : ''}">${save.chartsOn ? 'On' : 'Off'}</button></div>` +
    `<div class="row"><label>Motion</label><span class="seg" role="group" aria-label="Motion">` +
    [[-1, 'Auto'], [0, 'Full'], [1, 'Reduced']].map(([v, t]) =>
      `<button data-motion="${v}" aria-pressed="${save.motionMode === v}" class="${save.motionMode === v ? 'on' : ''}">${t}</button>`).join('') +
    '</span></div>' +
    `<div class="row"><label>Panel tint</label><input id="setglass" aria-label="Panel tint" type="range" min="82" max="98" value="${Math.round(Math.max(save.glassTint, 0.82) * 100)}"></div>` +
    `<div class="row"><label>Field Training</label><button id="setrestart" data-sel="set-restart">Restart</button></div>` +
    `<div class="row"><label>Save data</label><button id="setimport" data-sel="set-import">Bring expedition</button></div>`);
  const el = document.getElementById('setpanel')!;
  const refillAndFocus = (selector: string): void => {
    fillSettings();
    el.querySelector<HTMLElement>(selector)?.focus();
  };
  el.querySelector('#setsnd')!.addEventListener('click', () => {
    save.sndOn = !save.sndOn;
    applySfxGain();   /* Sound Off zeros and suspends the live sting bus */
    tameGreetingAudioOwner?.syncSettings();
    refillAndFocus('#setsnd'); void persistView();
  });
  el.querySelector('#setvol')!.addEventListener('input', (e) => {
    save.sfxVol = (+(e.target as HTMLInputElement).value) / 100;
    applySfxGain();   /* the shared bus retapers live */
    tameGreetingAudioOwner?.syncSettings();
    persistSoon();
  });
  el.querySelector('#setvoice')!.addEventListener('click', () => {
    save.voiceOn = !save.voiceOn;
    tameGreetingAudioOwner?.syncSettings();
    refillAndFocus('#setvoice'); void persistView();
  });
  for (const b of el.querySelectorAll<HTMLElement>('[data-pref]')) b.addEventListener('click', () => {
    const value = b.dataset.value || '';
    if (b.dataset.pref === 'size') save.fsMode = value;
    else if (b.dataset.pref === 'tone') save.toneMode = value;
    else if (b.dataset.pref === 'font') save.fontMode = value;
    const selector = `[data-pref="${b.dataset.pref}"][data-value="${CSS.escape(value)}"]`;
    applyDisplayPreferences(); refillAndFocus(selector); void persistView();
  });
  el.querySelector('#setcharts')!.addEventListener('click', () => {
    save.chartsOn = !save.chartsOn;
    chartsDockEl.classList.toggle('on', save.chartsOn);
    chartsDockEl.setAttribute('aria-pressed', String(save.chartsOn));
    if (chartLayer) chartLayer.visible = save.chartsOn;
    refillAndFocus('#setcharts'); void persistView();
  });
  for (const b of el.querySelectorAll('[data-motion]')) b.addEventListener('click', () => {
    save.motionMode = +(b as HTMLElement).dataset.motion!;
    applyDisplayPreferences(); refillAndFocus(`[data-motion="${save.motionMode}"]`); void persistView();
  });
  el.querySelector('#setrestart')!.addEventListener('click', async (event) => {
    /* Veteran restart is a reversible drill: begin in Sol where the lesson
       is winnable, then restore the exact pre-drill view on skip/finish. */
    const button = event.currentTarget as HTMLButtonElement;
    if (trainingSnapshotIngress.kind !== 'none' || trainingCheckpointWriteHeld) {
      toast('Training checkpoint retained', 'Finish or recover the pending Field Training checkpoint before starting another drill. Nothing changed.');
      return;
    }
    const homeNav = searchTravel.trainingSolSystemNav();
    if (!homeNav) {
      toast('Route unavailable', 'Field Training could not verify the route to Sol. Your expedition is unchanged.');
      return;
    }
    const replacement = claimReplacementTransaction('training-restart');
    if (!replacement) {
      toast('Save replacement underway', 'Finish the current expedition replacement before restarting Field Training.');
      return;
    }
    const prior = save.tutDone;
    const priorSnapshot = save.tutSnapPending;
    const priorSnapshotIngress = trainingSnapshotIngress;
    const priorNav = nav;
    const priorSavedView = save.savedView;
    const priorSavedRouteWriteHeld = savedRouteWriteHeld;
    button.disabled = true;
    /* A transient source failure deliberately leaves the imported route
       field held while the runtime stays at Cosmos. Restarting Training is
       an explicit replacement write, so transfer that held pre-drill route
       into the one-key snapshot instead of snapshotting the neutral fallback. */
    const snapshotView = savedRouteWriteHeld ? save.savedView : navToView(nav);
    save.tutSnapPending = { view: snapshotView };
    trainingSnapshotIngress = Object.freeze({ kind: 'current-view', view: snapshotView });
    save.tutDone = false;
    nav = homeNav;
    savedRouteWriteHeld = false;
    if (await persistView(replacement)) scheduleReplacementReload(replacement);
    else {
      releaseReplacementTransaction(replacement);
      save.tutDone = prior;
      save.tutSnapPending = priorSnapshot;
      trainingSnapshotIngress = priorSnapshotIngress;
      nav = priorNav;
      save.savedView = priorSavedView;
      savedRouteWriteHeld = priorSavedRouteWriteHeld;
      button.disabled = false;
      toast('Save unavailable', 'Field Training was not restarted; your current expedition is unchanged.');
    }
  });
  el.querySelector('#setimport')!.addEventListener('click', openImportSheet);
  el.querySelector('#setglass')!.addEventListener('input', (e) => {
    save.glassTint = (+(e.target as HTMLInputElement).value) / 100;
    applyGlass(); persistSoon();
  });
}

/* ---- GUIDE + RELEASE HISTORY — one source-addressed continuation of the
   mature v1 manual, not a second seven-topic manual. All 43 authored IDs and
   the 56-release archive remain synchronized to v1.8.9; current capability
   copy replaces any legacy promise whose mechanic is not yet live in v2. ---- */
const GUIDE_CATALOGUE = getGuideCatalogue();
function guideBodyEl(): HTMLElement | null {
  return document.querySelector('#guidepanel [data-sel="guide-body"]');
}
function guideCategoryOf(id: GuideTopicId): (typeof GUIDE_CATALOGUE)[number] | undefined {
  return GUIDE_CATALOGUE.find((category) => category.topics.some((topic) => topic.id === id));
}
function guideTopicRow(topic: GuideTopicView, icon = '•'): string {
  const status = topic.availability === 'unavailable' ? 'Not yet in v2'
    : topic.availability === 'partial' ? 'Partly live' : 'Live';
  return `<button class="guide-item" data-sel="guide-topic" data-guide-topic="${topic.id}" data-guide-availability="${topic.availability}">` +
    `<span class="guide-icon">${icon}</span><span><b>${esc(topic.title)}</b><small>${esc(status)}</small></span><span aria-hidden="true">›</span></button>`;
}
function interactiveGuideBody(source: string): string {
  /* Legacy Guide cross-links are trusted source-addressed HTML spans. V2
     upgrades them to native buttons so the same links work by touch,
     pointer, keyboard, and assistive technology. */
  const template = document.createElement('template');
  template.innerHTML = source;
  for (const span of template.content.querySelectorAll<HTMLElement>('span[data-gt]')) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'guide-inline-link';
    button.dataset.gt = span.dataset.gt;
    button.innerHTML = span.innerHTML;
    span.replaceWith(button);
  }
  return template.innerHTML;
}
function focusGuide(selector: string): void {
  guideBodyEl()?.querySelector<HTMLElement>(selector)?.focus();
}
function renderGuideMenu(focusResult = false): void {
  const body = guideBodyEl(); if (!body) return;
  body.innerHTML = GUIDE_CATALOGUE.map((category) =>
    `<button class="guide-item guide-category" data-guide-category="${category.id}"><span class="guide-icon">${category.icon}</span>` +
    `<span><b>${esc(category.title)}</b><small>${esc(category.blurb)} · ${category.topics.length} topics</small></span><span aria-hidden="true">›</span></button>`).join('');
  body.scrollTop = 0;
  if (focusResult) focusGuide('[data-guide-category]');
}
function renderGuideCategory(id: GuideCategoryId, focusResult = false): void {
  const category = GUIDE_CATALOGUE.find((candidate) => candidate.id === id);
  const body = guideBodyEl(); if (!category || !body) return;
  body.innerHTML = `<button class="guide-back" data-guide-home>‹ All topics</button>` +
    category.topics.map((topic) => guideTopicRow(topic, category.icon)).join('');
  body.scrollTop = 0;
  if (focusResult) focusGuide('[data-guide-home]');
}
function renderGuideTopic(id: GuideTopicId, focusResult = false): void {
  const topic = getGuideTopic(id);
  const category = guideCategoryOf(id);
  const body = guideBodyEl(); if (!topic || !category || !body) return;
  const status = topic.availability === 'unavailable' ? 'Not yet available in v2'
    : topic.availability === 'partial' ? 'Partly available in this development build'
      : 'Available in this development build';
  const siblings = category.topics.filter((candidate) => candidate.id !== id).slice(0, 4);
  body.innerHTML = `<button class="guide-back" data-guide-category="${category.id}">‹ ${esc(category.title)}</button>` +
    `<article class="guide-topic"><h4 tabindex="-1" data-guide-heading>${category.icon} ${esc(topic.title)}</h4>` +
    `<div class="guide-status" data-guide-status="${topic.availability}">${esc(status)}</div>${interactiveGuideBody(topic.body)}` +
    (siblings.length ? `<div class="guide-related"><b>Also in ${esc(category.title)}</b>` +
      siblings.map((candidate) => `<button data-guide-topic="${candidate.id}">${esc(candidate.title)}</button>`).join('') + '</div>' : '') +
    '</article>';
  body.scrollTop = 0;
  if (focusResult) focusGuide('[data-guide-category]');
}
function renderGuideSearch(query: string): void {
  const body = guideBodyEl(); if (!body) return;
  const hits = searchGuide(query);
  if (query.trim().length < 2) { renderGuideMenu(); return; }
  body.innerHTML = hits.length
    ? hits.map((topic) => guideTopicRow(topic, guideCategoryOf(topic.id)?.icon || '•')).join('')
    : `<div class="empty">Nothing matches “${esc(query.trim())}”. Try “landing”, “save”, “breeding”, or “stardust”.</div>`;
  body.scrollTop = 0;
}
function renderReleaseHistory(focusResult = false): void {
  const body = guideBodyEl(); if (!body) return;
  const releases = getReleaseHistory({ includeDraft: true });
  body.innerHTML = '<button class="guide-back" data-guide-home>‹ Guide</button>' +
    '<div class="guide-release-intro"><b>Expedition bulletins</b><br>' +
    `v${esc(V2_DEVELOPMENT_VERSION)} names this development playtest but cannot trigger a production update popup. The complete v1 history below remains immutable.</div>` +
    releases.map((release, index) => `<button class="guide-item" data-release-index="${index}">` +
      `<span class="guide-icon">${release.status === 'draft' ? '🧪' : '✦'}</span><span><b>${release.version ? 'v' + esc(release.version) + ' · ' : ''}${esc(release.title)}</b>` +
      `<small>${release.status === 'draft' ? 'UNRELEASED DEVELOPMENT' : esc(release.date) + (release.status === 'shipped' ? ' · v2 release' : ' · legacy release')}</small></span><span aria-hidden="true">›</span></button>`).join('');
  body.scrollTop = 0;
  if (focusResult) focusGuide('[data-guide-home]');
}
function renderRelease(index: number, focusResult = false, releases = getReleaseHistory({ includeDraft: true })): void {
  const release = releases[index];
  const body = guideBodyEl(); if (!release || !body) return;
  body.innerHTML = '<button class="guide-back" data-guide-releases>‹ All bulletins</button>' +
    `<article class="guide-topic"><h4 tabindex="-1" data-guide-heading>${release.version ? 'v' + esc(release.version) + ' · ' : ''}${esc(release.title)}</h4>` +
    `<div class="guide-status" data-guide-status="${release.status}">${release.status === 'draft' ? `v${esc(V2_DEVELOPMENT_VERSION)} DEVELOPMENT · not a production release` : esc(release.date) + (release.status === 'shipped' ? ' · v2 release' : ' · legacy v1 history')}</div>` +
    release.sections.map((section) => `<h5>${section.heading}</h5><ul>${section.bullets.map((bullet) => `<li>${bullet}</li>`).join('')}</ul>`).join('') + '</article>';
  body.scrollTop = 0;
  if (focusResult) focusGuide('[data-guide-releases]');
}
let pendingReleaseBulletin: V2ShippedRelease | null = null;
function showV2ReleaseBulletin(
  current: V2ShippedRelease,
  history: readonly ReleaseNoteView[] = getReleaseHistory(),
): boolean {
  if (!hasUnseenV2Release(save.rnSeen, current)) return false;
  /* A first expedition owns one blocking onboarding surface at a time. Queue
     a shipped bulletin until Training is finished/skipped instead of opening
     the Guide underneath its lesson card and marking unseen copy as read. */
  if (trainingActive()) { pendingReleaseBulletin = current; return false; }
  const index = history.findIndex((release) => release.status === 'shipped' && release.version === current.version);
  if (index < 0) return false;
  openPanel('guide', null);
  renderRelease(index, true, history);
  if (!blockPlayerMutation('release-seen')) {
    save.rnSeen = current.version;
    pendingReleaseBulletin = null;
    void persistView();
  }
  return true;
}
function showUnseenV2Release(): boolean {
  /* The mature one-time bulletin rule is ready before the first production
     v2 release, but the v2.0 development identity can never trigger it. */
  const current = getCurrentV2Release();
  if (!current) return false;
  const history = getReleaseHistory({ includeDraft: true });
  return showV2ReleaseBulletin(current, history);
}
function flushPendingReleaseBulletin(): void {
  const current = pendingReleaseBulletin;
  if (!current || trainingActive()) return;
  const history = getReleaseHistory({ includeDraft: true, shippedReleases: [current] });
  showV2ReleaseBulletin(current, history);
}
function fillGuide(): void {
  if (!save) return;
  fillPanel('guide',
    '<h3>Guide to the Universe</h3>' +
    guideBuildIdentity() +
    '<div class="guide-tools"><input id="guidesearch" type="search" autocomplete="off" aria-label="Search the Guide" placeholder="Search 41 Guide topics">' +
    '<button data-guide-releases>Release history</button></div>' +
    '<div class="sub guide-scope">The mature manual, adapted to what is actually live in this v2 development build. Unported active systems stay visible and honestly marked; intentionally dormant topics remain recorded but hidden.</div>' +
    '<div class="guide-body" data-sel="guide-body"></div>');
  renderGuideMenu();
  if (!save.seenGuide && !blockPlayerMutation('guide-seen')) {
    save.seenGuide = true;
    void persistView();
  }
}
document.getElementById('guidepanel')!.addEventListener('input', (event) => {
  if ((event.target as HTMLElement).id === 'guidesearch') renderGuideSearch((event.target as HTMLInputElement).value);
});
document.getElementById('guidepanel')!.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;
  const topicEl = target.closest<HTMLElement>('[data-guide-topic],[data-gt]');
  const topic = (topicEl?.dataset.guideTopic || topicEl?.dataset.gt) as GuideTopicId | undefined;
  const category = target.closest<HTMLElement>('[data-guide-category]')?.dataset.guideCategory as GuideCategoryId | undefined;
  const releaseIndex = target.closest<HTMLElement>('[data-release-index]')?.dataset.releaseIndex;
  if (topic) renderGuideTopic(topic, true);
  else if (category) renderGuideCategory(category, true);
  else if (releaseIndex !== undefined) renderRelease(+releaseIndex, true);
  else if (target.closest('[data-guide-releases]')) renderReleaseHistory(true);
  else if (target.closest('[data-guide-home]')) renderGuideMenu(true);
});

/* ---- COMPENDIUM (read-only over the save's codex — the real catalog).
   The logical catalogue may contain 1,500 records; only approximately two
   viewports plus a pinned focused row own DOM and thumbnail leases. ---- */
type CodexRecord = SaveStateV2['codex'][number][1];
type CodexVirtualRow = CompendiumVirtualRow<CodexRecord>;
type CodexReturnState = CompendiumReturnState;
type CodexMode = 'closed' | 'list' | 'detail';
const EMPTY_CODEX_WINDOW: CompendiumWindowSnapshot = Object.freeze({
  start: 0, end: 0, overscan: 0, beforePx: 0, afterPx: 0,
  mountedRowCount: 0, mountedLogicalIds: Object.freeze([]),
  focusedLogicalId: null, pinnedLogicalIds: Object.freeze([]),
});
let codexFilter = '';
let codexMode: CodexMode = 'closed';
let codexGeneration = 0;
let codexList: CompendiumVirtualList<CodexRecord> | null = null;
let codexRows: readonly CodexVirtualRow[] = Object.freeze([]);
let codexWindow: CompendiumWindowSnapshot = EMPTY_CODEX_WINDOW;
let codexReturnState: CodexReturnState | null = null;
let codexDetailLogicalId: string | null = null;
let codexDetailArtCancel: (() => void) | null = null;
let codexRenderCommits = 0;
let codexStaleCompletionDrops = 0;
let codexClosedCompletionCommits = 0;
let compendiumFixtureRows: Array<[string, CodexRecord]> | null = null;

function disposeCodexList(): void {
  codexList?.dispose();
  codexList = null;
  codexWindow = EMPTY_CODEX_WINDOW;
}
function cancelCodexDetailArt(): void {
  codexDetailArtCancel?.();
  codexDetailArtCancel = null;
}
function closeCodexSurface(): void {
  const wasOpen = codexMode !== 'closed';
  disposeCodexList();
  cancelCodexDetailArt();
  /* Detail uses the approved 440px portrait path rather than a thumbnail
     lease. Closing still relinquishes its retained DOM decode immediately;
     the art cache remains under the package's own byte budget. */
  for (const image of document.querySelectorAll<HTMLImageElement>('#codexpanel img')) {
    image.removeAttribute('src');
  }
  codexRows = Object.freeze([]);
  codexMode = 'closed';
  codexDetailLogicalId = null;
  document.getElementById('codexpanel')!.classList.remove('codex-list-mode');
  if (wasOpen) codexGeneration++;
}
function activeCodexSource(): Array<[string, CodexRecord]> {
  return compendiumFixtureRows ?? save.codex;
}
function filteredCodexRows(): readonly CodexVirtualRow[] {
  const f = codexFilter.toLowerCase();
  return Object.freeze(activeCodexSource()
    .map(([logicalId, value], sourceIndex) => ({ logicalId: String(logicalId), sourceIndex, value }))
    .filter(({ value }) => !f
      || (value.name + ' ' + value.kind + ' ' + value.realm).toLowerCase().includes(f)));
}
function filteredCodexCount(): number {
  const f = codexFilter.toLowerCase();
  if (!f) return activeCodexSource().length;
  let count = 0;
  for (const [, value] of activeCodexSource()) {
    if ((value.name + ' ' + value.kind + ' ' + value.realm).toLowerCase().includes(f)) count++;
  }
  return count;
}
function mountCodexRow(row: CodexVirtualRow, generation: number): {
  readonly element: HTMLButtonElement;
  dispose(): void;
} {
  const e = row.value;
  const rarityView = projectDisplayRarity(e.tier);
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'centry compendium-row';
  button.dataset.sel = 'codex-entry';
  button.dataset.ci = String(row.sourceIndex);   /* compatibility for existing smoke selectors */
  const image = document.createElement('img');
  image.className = 'compendium-thumb';
  image.alt = '';
  image.width = 132;
  image.height = 132;
  const copy = document.createElement('span');
  copy.className = 'compendium-row-copy';
  copy.innerHTML = `<b>${esc(e.name)}</b> <span class="sub">· ${esc(e.kind)}${rarityView ? ` · <span data-sel="codex-row-rarity" style="color:${esc(rarityView.hex)}">${esc(rarityView.name)}</span>` : ''}${e.hybrid ? ' · hybrid' : ''}</span>` +
    `<span class="sub compendium-row-origin">${esc(e.realm)}${e.from ? ' — ' + esc(e.from) : ''}</span>`;
  button.append(image, copy);
  let binding: SpeciesThumbBinding | null = null;
  let disposed = false;
  /* CompendiumVirtualList connects and assigns the logical id after this
     factory returns. Acquire on the next microtask so a warm synchronous hit
     is still subject to the same connection/key guards as an async miss. */
  queueMicrotask(() => {
    if (disposed || !button.isConnected || button.dataset.cid !== row.logicalId) return;
    binding = bindSpeciesThumb(speciesArtLoader, {
      owner: `codex:${generation}:${row.logicalId}`,
      image,
      genome: e.g as Record<string, unknown>,
      isCurrent: () => codexGeneration === generation
        && codexMode === 'list'
        && openPanelId() === 'codex'
        && button.dataset.cid === row.logicalId,
      onCommit: () => {
        if (openPanelId() === 'codex' && codexMode === 'list') codexRenderCommits++;
        else codexClosedCompletionCommits++;
      },
      onStale: () => { codexStaleCompletionDrops++; },
    });
  });
  return {
    element: button,
    dispose: () => { disposed = true; binding?.release(); binding = null; },
  };
}
function fillCodex(filter?: string, restore?: CodexReturnState | null): void {
  if (!save) return;
  /* Keep the prior window's leases alive through the new window's mount
     microtasks. A retained row then acquires the same real in-flight job
     before old ownership releases, exercising ordinary deduplication without
     retaining any thumbnail into detail or adding an evidence-only lease. */
  const previousList = codexList;
  codexList = null;
  codexWindow = EMPTY_CODEX_WINDOW;
  cancelCodexDetailArt();
  codexFilter = filter ?? codexFilter;
  codexMode = 'list';
  codexDetailLogicalId = null;
  const generation = ++codexGeneration;
  codexRows = filteredCodexRows();
  const f = codexFilter.toLowerCase();
  const panel = document.getElementById('codexpanel')!;
  panel.classList.add('codex-list-mode');
  fillPanel('codex',
    `<h3>Compendium <span style="color:#7ec8f0" data-sel="codex-count">${codexRows.length}</span>${f ? ` <span class="sub codex-query">· “${esc(codexFilter)}”</span>` : ''}</h3>` +
    (codexRows.length === 0
      ? `<div class="empty">${f ? 'Nothing matches — the search also takes CF1 share codes.' : 'No species yet — imported discoveries appear here. Live catalogue writing arrives with the discovery path.'}</div>`
      : '<div class="compendium-scroll" data-sel="codex-scroll" role="group" aria-label="Compendium species"></div>'));
  if (!codexRows.length) {
    previousList?.dispose();
    codexReturnState = null;
    return;
  }
  const scroller = panel.querySelector<HTMLElement>('[data-sel="codex-scroll"]')!;
  const nextList = new CompendiumVirtualList({
    scroller,
    rows: codexRows,
    mountRow: (row) => mountCodexRow(row, generation),
  });
  codexList = nextList;
  if (restore) nextList.restoreState(restore);
  queueMicrotask(() => {
    if (codexList === nextList && codexGeneration === generation) nextList.refreshWindow();
  });
  if (previousList) queueMicrotask(() => previousList.dispose());
  codexReturnState = null;
}
/* the Compendium DETAIL CARD: the whole domain stack speaking for one
   creature — describeSpecies (fixture-pinned sentences + fauna enrichments),
   battleStats (the five stats as bars in their own hues), the grade badge.
   The static Canvas portrait is live. Pixi living actors and animation remain
   a separate Phase 5 pipeline. */
function fillCodexDetail(idx: number): void {
  if (!save) return;
  const row = activeCodexSource()[idx];
  if (!row) { fillCodex(); return; }
  if (codexList) {
    const state = codexList.captureState();
    /* Back returns to the activated logical row even on touch browsers that
       do not focus a button during pointer activation. */
    codexReturnState = Object.freeze({
      scrollTop: state.scrollTop,
      focusedLogicalId: String(row[0]),
      anchorLogicalId: state.anchorLogicalId,
      anchorOffsetPx: state.anchorOffsetPx,
      anchorHeightPx: state.anchorHeightPx,
    });
  }
  disposeCodexList();
  codexRows = Object.freeze([]);
  cancelCodexDetailArt();
  const generation = ++codexGeneration;
  codexMode = 'detail';
  codexDetailLogicalId = String(row[0]);
  document.getElementById('codexpanel')!.classList.remove('codex-list-mode');
  const e = row[1];
  const rarityView = projectDisplayRarity(e.tier);
  let body = '';
  try {
    const d = describeSpecies(e.g as never) as { desc?: string; detail?: string; diet?: string; anatomy?: string; temper?: string; sense?: string; repro?: string; life?: string; metab?: string; habitat?: string; behavior?: string };
    const st = battleStats(e.g as never) as Record<string, number>;
    const KEYS = ['vit', 'fer', 'res', 'agi', 'ins'];   /* STAT_KEYS order — names/hues are position-indexed */
    const mx = Math.max(1, ...KEYS.map((k) => st[k] || 0));
    const names = STAT_NAMES as readonly string[], hues = STAT_HUES as readonly string[];
    body =
      '<img data-sel="detail-portrait" data-art-state="placeholder" alt="" width="440" height="440" ' +
      'style="width:100%;height:auto;border-radius:10px;border:1px solid #22304a;margin:2px 0 8px;background:#0b1220">' +
      `<div style="margin:4px 0 8px"><b style="font-size:16px;color:#f4f8ff">${esc(e.name)}</b>` +
      (rarityView ? ` <span data-sel="detail-grade" style="border:1px solid ${esc(rarityView.hex)};color:${esc(rarityView.hex)};border-radius:999px;padding:1px 9px;font-size:11px">${esc(rarityView.name)}</span>` : '') +
      `<div class="sub">${esc(e.kind)} · ${esc(e.realm)}${e.hybrid ? ' · hybrid' : ''}${e.from ? ' · ' + esc(e.from) : ''}</div></div>` +
      `<div style="color:#b7c8e4;margin-bottom:8px" data-sel="detail-desc">${esc(d.desc || '')} ${esc(d.detail || '')}</div>` +
      KEYS.map((k, i) => {
        const v = st[k] || 0;
        return `<div class="row" style="min-height:24px" data-sel="detail-stat"><label style="flex:0 0 84px">${esc(names[i] || k)}</label>` +
          `<span style="flex:1;height:9px;border-radius:999px;background:#16202f;overflow:hidden"><span style="display:block;height:100%;width:${Math.round((v / mx) * 100)}%;background:${esc(hues[i] || '#7ec8f0')}"></span></span>` +
          `<span style="flex:0 0 40px;text-align:right;color:var(--dim)">${Math.round(v)}</span></div>`;
      }).join('') +
      (['diet', 'anatomy', 'temper', 'sense', 'repro', 'life', 'metab', 'habitat', 'behavior'] as const)
        .filter((k) => (d as Record<string, unknown>)[k])
        .map((k) => `<div class="centry"><span class="sub">${k}</span><br>${esc((d as Record<string, string>)[k])}</div>`).join('');
  } catch {
    body = '<div class="empty">This record did not decode — the genome may predate the Compendium.</div>';
  }
  fillPanel('codex', `<h3><button id="codexback" style="background:none;border:0;color:#9fdcff;cursor:pointer;font:13px var(--ui);padding:8px;min-height:44px">‹ Compendium</button></h3><div data-sel="codex-detail">${body}</div>`);
  const portrait = document.querySelector<HTMLImageElement>('#codexpanel [data-sel="detail-portrait"]');
  if (portrait) {
    const publishPortrait = (asset: Portrait440 | null, error?: unknown): void => {
      const current = codexGeneration === generation && codexMode === 'detail'
        && codexDetailLogicalId === String(row[0]) && openPanelId() === 'codex'
        && portrait.isConnected;
      if (!current) { codexStaleCompletionDrops++; return; }
      if (error !== undefined || !asset || asset.width !== 440 || asset.height !== 440) {
        portrait.removeAttribute('src');
        portrait.dataset.artState = 'error';
        return;
      }
      portrait.src = asset.url;
      portrait.dataset.artState = 'ready';
    };
    try {
      const request = speciesArtLoader.requestPortrait(
        'codex-detail', e.g as Record<string, unknown>, publishPortrait,
      );
      codexDetailArtCancel = request.cancel;
      if (request.current) publishPortrait(request.current);
    } catch {
      portrait.dataset.artState = 'error';
    }
  }
  const back = document.getElementById('codexback')!;
  back.addEventListener('click', () => fillCodex(codexFilter, codexReturnState));
  back.focus();
}
function fillRecords(): void {
  if (!save) return;
  const st = save.stats || {};
  const counts: Array<[string, number]> = [
    ['galaxies seen', save.galSeen.length], ['systems charted', save.sysSeen.length],
    ['worlds landed', save.landed.length], ['world types met', save.ptypesSeen.length],
    ['star kinds met', save.starKindsSeen.length], ['species catalogued', save.codex.length],
    ['surveys', save.surveyedSet.length],
  ];
  const jr = save.journal.slice(-40).reverse();
  fillPanel('rec',
    '<h3>Records</h3>' +
    counts.map(([k, v]) => `<div class="row" style="min-height:26px"><label>${esc(k)}</label><span style="color:#7ec8f0">${v}</span></div>`).join('') +
    (st.essenceEarned ? `<div class="row" style="min-height:26px"><label>stardust earned</label><span style="color:#ffd9a0">✦ ${st.essenceEarned}</span></div>` : '') +
    '<h3 style="margin-top:14px">Journal</h3>' +
    (jr.length === 0
      ? '<div class="empty" data-sel="journal-empty">No imported Journal entries yet — live Journal writing is not connected in this development slice.</div>'
      : jr.map((j) => `<div class="centry" data-sel="journal-entry"><b>${esc(j.n)}</b><div class="sub">${esc(j.w)}</div></div>`).join('')));
}
/* THE STAR ATLAS ('log' in the game): every charted place, tap to TRAVEL
   (jumpToView — the same charter gates as everything else) */
function fillAtlas(): void {
  if (!save) return;
  const rows = save.logMap;
  fillPanel('atlas',
    `<h3>Star Atlas <span style="color:#7ec8f0" data-sel="atlas-count">${rows.length}</span></h3>` +
    (rows.length === 0
      ? '<div class="empty" data-sel="atlas-empty">Nothing charted yet — tap “+ Add to Star Atlas” on any survey card.</div>'
      : rows.map(([id, e]) => {
        const travelable = atlasRouteStates.has(e as Record<string, unknown>);
        const unavailable = travelable ? '' : ' · route unavailable in this build';
        return `<button type="button" class="centry" data-sel="atlas-entry" data-aid="${esc(id)}"${travelable ? '' : ' disabled aria-disabled="true"'}><b>${esc(String(e.title || id))}</b>${e.badge ? ` <span class="sub">· ${esc(String(e.badge))}</span>` : ''}<span class="sub" style="display:block">${esc(String(e.sub || ''))}${unavailable}</span></button>`;
      }).join('')));
}
document.getElementById('atlaspanel')!.addEventListener('click', (e) => {
  const row = (e.target as HTMLElement).closest('[data-aid]');
  if (!row || !save) return;
  const hit = save.logMap.find(([id]) => id === (row as HTMLElement).dataset.aid);
  if (hit) {
    const route = atlasRouteStates.get(hit[1] as Record<string, unknown>);
    if (!route) return;
    const keyboard = document.activeElement === row;
    const moved = searchTravel.jumpToProvenNav(route);
    if (moved) {
      closePanels();
      if (keyboard) app.canvas.focus();
    }
  }
});
/* CHARTERS — current-slice projection over canonical saved chapter data.
   The pure projection keeps legacy progress/reach intact while presenting
   only real v2 actions; never render the unported canonical copy directly. */
function fillCharters(): void {
  if (!save) return;
  const projection = projectV2Charter(save.ascCh, save.ascProg, ascStage());
  const chapter = !projection
    ? '<div class="centry" data-sel="charter-ch" data-chstate="complete">' +
        '<b>Charter record</b><div class="sub" style="margin:2px 0 6px">' +
        'This expedition’s established Charter progress and reach are preserved.</div></div>'
    : (() => {
      const goals = projection.goals.map((goal) => {
        const have = Math.min(save.ascProg[goal.id] || 0, goal.n);
        const pct = Math.round((have / goal.n) * 100);
        return `<div class="row" style="min-height:24px" data-sel="charter-goal"><label style="font-size:12px">${esc(goal.t)}</label>` +
          `<span style="flex:0 0 90px;display:flex;align-items:center;gap:6px"><span style="flex:1;height:7px;border-radius:999px;background:#16202f;overflow:hidden"><span style="display:block;height:100%;width:${pct}%;background:${have >= goal.n ? '#caa24f' : '#7ec8f0'}"></span></span><span style="color:var(--dim);font-size:11px">${have}/${goal.n}</span></span></div>`;
      }).join('');
      const note = projection.state === 'actionable' ? ''
        : `<div class="sub" data-sel="charter-boundary" style="margin-top:8px">${esc(projection.note)}</div>`;
      return `<div class="centry" data-sel="charter-ch" data-chstate="${projection.state}">` +
        `<b style="${projection.state === 'actionable' ? 'color:#ffd9a0' : ''}">${projection.state === 'complete' ? '✓ ' : ''}${esc(projection.name)}</b>` +
        `<div class="sub" style="margin:2px 0 6px">${esc(projection.intro)}</div>` + goals + note + '</div>';
    })();
  fillPanel('ch', '<h3>Charters — Current Expedition</h3>' + chapter);
}
registerPanel({ id: 'ch', el: document.getElementById('chpanel')!, btns: [document.getElementById('dockcharters'), document.getElementById('railcharters')], onOpen: fillCharters });
document.getElementById('dockcharters')!.addEventListener('click', () => togglePanel('ch'));
document.getElementById('railcharters')!.addEventListener('click', () => togglePanel('ch'));
registerPanel({ id: 'atlas', el: document.getElementById('atlaspanel')!, btns: [document.getElementById('dockatlas'), document.getElementById('railatlas')], onOpen: () => { fillAtlas(); gameEvent('atlas-open', { open: true }); } });
document.getElementById('dockatlas')!.addEventListener('click', () => togglePanel('atlas'));
document.getElementById('railatlas')!.addEventListener('click', () => togglePanel('atlas'));
registerPanel({ id: 'set', el: document.getElementById('setpanel')!, btns: [document.getElementById('docksets')], onOpen: fillSettings });
registerPanel({ id: 'guide', el: document.getElementById('guidepanel')!, btns: [document.getElementById('dockguide')], onOpen: fillGuide });
const codexOpenController = createPanelOpenController({
  id: 'codex',
  defaultRequest: () => '',
  populate: (filter: string) => fillCodex(filter),
});
registerPanel({ id: 'codex', el: document.getElementById('codexpanel')!, btns: [document.getElementById('dockcodex'), document.getElementById('railcodex')], onOpen: () => {
  /* An ordinary Compendium open is a fresh catalogue view. Search may apply
     one requested query as its opening population, while detail → Back
     deliberately keeps the active query. Closing a search result and
     reopening from the dock still starts with the unfiltered catalogue. */
  codexOpenController.onOpen();
}, onClose: closeCodexSurface });
registerPanel({ id: 'rec', el: document.getElementById('recpanel')!, btns: [document.getElementById('dockrecords'), document.getElementById('railrecords')], onOpen: fillRecords });
const inventoryPanelController = new InventoryPanelController({
  panel: document.getElementById('inventorypanel')!,
  sheet: document.getElementById('inventorysheet')!,
  openers: [document.getElementById('dockinventory'), document.getElementById('railinventory')],
  onAction: ({ operation, instanceId }) => commitArc2InventoryAction(operation, instanceId),
  requiresSalvageConfirmation: () => save.salvageConfirm,
});
registerPanel(inventoryPanelController.registration());
const engineeringPanelController = new EngineeringPanelController({
  panel: document.getElementById('shipyardpanel')!,
  openers: [document.getElementById('dockshipyard'), document.getElementById('railshipyard')],
  onAction: (request) => {
    engineeringPanelController.setPending(request);
    void runEngineeringPanelAction(request);
  },
});
let engineeringPanelReleased = false;
const engineeringPanelRegistration = engineeringPanelController.registration();
registerPanel({
  ...engineeringPanelRegistration,
  onOpen: () => {
    refreshEngineeringPanelState();
    engineeringPanelRegistration.onOpen();
  },
});
function shipyardDiagnostics(): unknown {
  const diagnostics = engineeringPanelController.diagnostics();
  const panelOpen = openPanelId() === 'shipyard';
  return Object.freeze({
    schema: 'cf-v2-shipyard-diagnostics/v1',
    status: panelOpen ? 'open' : 'closed',
    stateKey: panelOpen ? currentShipVisualState().stateKey : null,
    activePreviewCount: diagnostics.activePreviewCount,
    retainedPreviewCount: diagnostics.retainedPreviewCount,
    pendingPreviewWork: diagnostics.pendingWork,
    engineering: diagnostics,
  });
}
document.getElementById('docksets')!.addEventListener('click', () => togglePanel('set'));
document.getElementById('dockguide')!.addEventListener('click', () => togglePanel('guide'));
document.getElementById('dockcodex')!.addEventListener('click', () => togglePanel('codex'));
document.getElementById('railcodex')!.addEventListener('click', () => togglePanel('codex'));
document.getElementById('dockrecords')!.addEventListener('click', () => togglePanel('rec'));
document.getElementById('railrecords')!.addEventListener('click', () => togglePanel('rec'));
document.getElementById('dockshipyard')!.addEventListener('click', () => togglePanel('shipyard'));
document.getElementById('railshipyard')!.addEventListener('click', () => togglePanel('shipyard'));
document.getElementById('dockinventory')!.addEventListener('click', () => togglePanel('inventory'));
document.getElementById('railinventory')!.addEventListener('click', () => togglePanel('inventory'));
/* codex list rows open the detail card (delegated — rows refill often) */
document.getElementById('codexpanel')!.addEventListener('click', (e) => {
  const row = (e.target as HTMLElement).closest('[data-ci]');
  if (row) fillCodexDetail(+(row as HTMLElement).dataset.ci!);
});

/* ---- THE SEARCH BAR (the goldens' top-right slot): a marked CF1 string is
   exact route input, never tolerant display data. All three route tiers are
   regenerated and proven before the common authorization/commit seam. */
const searchTravel = createSearchTravelController({
  search: document.getElementById('searchbox') as HTMLInputElement,
  currentNav: () => nav,
  currentSave: () => save || null,
  shipLiverySeed: () => SHIP_LIVERY_SEED,
  currentPlanetName: (planetSeed) => customNames.get('p' + planetSeed) || null,
  routeChangeBlocked: () => blockRouteChangeWhileProductAction(),
  mutationsBlocked: () => playerMutationsBlocked(),
  planetNodeForProof,
  commitNavigation: ({ target, committedNav, focusPlanet, customPlanetName }) => {
    if (focusPlanet && customPlanetName) {
      customNames.set('p' + focusPlanet.seed, customPlanetName);
      save.customNames = [...customNames.entries()];
    }
    nav = committedNav;
    savedRouteWriteHeld = false;
    if (nav.mode === 'galaxy') { gz0 = 0.42 * minWH() / GR; camT.z = gz0 * 1.05; }
    else { sz0 = 0.40 * minWH() / SYS_R; camT.z = sz0 * 1.05; }
    cam.z = camT.z * 0.7; cam.x = camT.x = 0; cam.y = camT.y = 0;
    playWhoosh();
    rerender();
    if (focusPlanet && target.mode === 'surface') {
      surveyPlanet(focusPlanet, target.star, target.planet);
    }
  },
  onPrimeReachBlocked: () => { toastPrimeReachBoundary(); },
  onCharterReachBlocked: () => { toastCharterBoundary(ascHintFor(ascStage())); },
  compendiumState: () => ({
    panelOpen: openPanelId() === 'codex',
    mode: codexMode,
    filter: codexFilter,
  }),
  clearCompendium: () => { fillCodex(''); },
  presentCompendium: (query, opener) => { codexOpenController.present(query, opener); },
  focusCompendiumContinuation: () => {
    (document.querySelector<HTMLElement>('#codexpanel [data-ci]')
      || document.querySelector<HTMLElement>('#codexpanel [data-pnx]'))?.focus();
  },
  focusAfterAcceptedRoute: () => {
    const action = card.querySelector<HTMLElement>('[data-act="landcta"],[data-act="travel"]');
    (action || app.canvas).focus();
  },
});
sheet.querySelector('#importclose')!.addEventListener('click', closeImportSheet);
sheet.querySelector('#importpick')!.addEventListener('click', () => (sheet.querySelector('#importfile') as HTMLInputElement).click());
sheet.querySelector('#importretry')!.addEventListener('click', () => {
  const replacement = claimReplacementTransaction('training-recovery');
  if (replacement) scheduleReplacementReload(replacement);
});
sheet.querySelector('#importfile')!.addEventListener('change', (e) => {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (!f) return;
  void f.text().then((txt) => { (sheet.querySelector('#importtext') as HTMLTextAreaElement).value = txt; });
});
async function importBlob(raw: string, diagnosticPhaseId?: string): Promise<string | null> {
  /* returns an error message, or null on success (then we reload) */
  let phaseSequence = 0;
  const phase = (stage: ImportPhaseStage, error: string | null = null): void => {
    const witness: ImportPhaseWitness = {
      schema: 'cf-v2-import-phase/v1',
      phaseId: typeof diagnosticPhaseId === 'string' && diagnosticPhaseId
        ? diagnosticPhaseId : `${DOCUMENT_TOKEN}:import`,
      reason: 'save-import', documentToken: DOCUMENT_TOKEN,
      stage, sequence: ++phaseSequence,
      tickerStarted: app.ticker?.started === true,
      performanceNow: performance.now(), error,
    };
    lastImportPhaseWitness = witness;
    try {
      const binding = (window as unknown as Record<string, unknown>).__cfImportPhaseWitness;
      if (typeof binding === 'function') (binding as (payload: string) => unknown)(JSON.stringify(witness));
    } catch { /* optional evidence is fail-closed in the harness */ }
  };
  phase('invoked');
  /* JSON permits surrounding whitespace. Keep the exact submitted text
     for the recovery keepsake, while retaining the importer's historical
     trimmed candidate for classification and the live primary. */
  const checkedRaw = raw.trim();
  const replacementPrepared = prepareV5Replacement(checkedRaw, REGISTRY, Date.now());
  if (replacementPrepared.kind === 'future-version') {
    phase('validation-rejected', 'future-version');
    return 'This save is from a newer Celestial Frontier build. Update first; nothing was stored.';
  }
  if (replacementPrepared.kind !== 'prepared') {
    phase('validation-rejected', 'invalid save payload');
    return 'That does not load as a Celestial Frontier save — nothing was stored.';
  }
  const runtime = f4Runtime;
  if (!f4RuntimeMayMutate(runtime)) {
    phase('validation-rejected', 'versioned persistence authority unavailable');
    return 'This expedition is protected from writes. Reload after resolving the storage warning, then try again.';
  }
  const replacement = claimReplacementTransaction('save-import');
  if (!replacement) {
    phase('claim-rejected', 'another replacement transaction already owns the app');
    return 'Another expedition replacement is finishing. Wait for its reload, then try again.';
  }
  phase('claimed');
  /* Import is a replacement transaction, not another autosave. Cancel a
     pending slider debounce, stop new exports, and let an export already in
     flight settle before the validated bytes become primary. Otherwise an
     older settings snapshot can win the race after the import write. */
  clearTimeout(_persistT); _persistT = 0;
  importWriteInFlight = true;
  const priorPersist = activePersist;
  phase(priorPersist ? 'waiting-active-persist' : 'no-active-persist');
  if (priorPersist) {
    await priorPersist.catch(() => false);
    phase('active-persist-settled');
  }
  await settleF4Heartbeat();
  phase('primary-write-started');
  let authorityRefused = false;
  try {
    /* The runtime owns the exact lease and observed revision. Its dedicated
       repository replacement clears the prior expedition's receipts in the
       SAME transaction as split rows, empty extensions, backup/snapshot and
       next revision, so reset ordinal zero cannot collide with old history. */
    const mutation = await runtime.replace(replacementPrepared.operations);
    if (mutation.kind !== 'committed') {
      authorityRefused = true;
      persistHold = 'protected-payload';
      persistenceProtectedDetail = `replacement authority ${mutation.kind}; reload required`;
      runtime.setAnswerable(false);
      stopF4Heartbeat();
      throw new Error(`versioned replacement refused: ${mutation.kind}`);
    }
    lastPersistenceOutcome = `replacement-committed:${mutation.revision}`;
    phase('primary-write-complete');
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    phase('primary-write-rejected', message);
    importWriteInFlight = false;
    /* A repository I/O exception leaves the same authority eligible for a
       player retry, so renew it. A semantic refusal (or a release rejection
       after runtime conflict) is permanently read-only in this document and
       must retry release instead of reacquiring a ghost lease. */
    const authorityLost = authorityRefused || runtime.diagnostics().staleBlocked;
    if (authorityLost) {
      if (!persistHold) {
        persistHold = 'protected-payload';
        persistenceProtectedDetail = 'replacement authority lost; reload required';
        runtime.setAnswerable(false);
        stopF4Heartbeat();
      }
      await runtime.release().catch(() => undefined);
    } else await runtime.heartbeat().catch(() => ({ kind: 'lost' as const }));
    releaseReplacementTransaction(replacement);
    return 'Storage refused the write (private mode?).';
  }
  /* Best-effort extra keepsake only: the external moderator backup remains
     authoritative. The live primary evolves through exportSaveV2 from the
     first frame, so retain the exact input locally when browser storage
     permits it, without blocking an otherwise valid import when it does not. */
  try { localStorage.setItem('cf_v2_import_original', raw); } catch { /* keepsake only */ }
  phase('release-started');
  scheduleReplacementReload(replacement, (witness) => {
    phase('release-complete', witness.error);
  });
  return null;
}
sheet.querySelector('#importgo')!.addEventListener('click', () => {
  const raw = (sheet.querySelector('#importtext') as HTMLTextAreaElement).value;
  void importBlob(raw).then((err) => { if (err) (sheet.querySelector('#importmsg') as HTMLElement).textContent = err; });
});

/* ---- the Charter toast: name the honest current-slice boundary ---- */
const toastEl = document.createElement('div');
toastEl.id = 'toast';
toastEl.setAttribute('role', 'status');
toastEl.setAttribute('aria-live', 'polite');
toastEl.setAttribute('aria-atomic', 'true');
toastEl.className = 'glass';
document.body.appendChild(toastEl);
let _toastT = 0, _toastHide = 0, _toastSerial = 0;
let _boundaryToastKey = '', _boundaryToastT = -Infinity, _boundaryToastSerial = -1;
let tameToastCounterpart: Readonly<{
  receipt: AudioCounterpartReceipt;
  title: string;
  detail: string;
}> | null = null;
const TOAST_DEDUP_MS = 1800;
function toastDetailText(): string | null {
  const title = toastEl.querySelector<HTMLElement>('[data-sel="toast-title"]');
  const lineBreak = title?.nextSibling;
  const detail = lineBreak?.nextSibling;
  return title && lineBreak?.nodeName === 'BR' && detail?.nodeType === Node.TEXT_NODE
    ? detail.textContent : null;
}
function tameToastCounterpartIsCurrent(receipt: AudioCounterpartReceipt): boolean {
  const registered = tameToastCounterpart;
  const title = toastEl.querySelector<HTMLElement>('[data-sel="toast-title"]');
  return registered !== null
    && registered.receipt.counterpartKey === receipt.counterpartKey
    && registered.receipt.eventKey === receipt.eventKey
    && registered.receipt.generation === receipt.generation
    && receipt.generation === _toastSerial
    && toastEl.getAttribute('role') === 'status'
    && toastEl.getAttribute('aria-live') === 'assertive'
    && toastEl.getAttribute('aria-atomic') === 'true'
    && toastEl.style.opacity === '1'
    && title?.textContent === registered.title
    && toastDetailText() === registered.detail;
}
function invalidateTameToastCounterpart(): void {
  if (tameToastCounterpart === null) return;
  tameToastCounterpart = null;
  tameGreetingAudioOwner?.counterpartLost();
}
function showToast(title: string, msg: string, assertive: boolean): void {
  invalidateTameToastCounterpart();
  toastEl.setAttribute('aria-live', assertive ? 'assertive' : 'polite');
  toastEl.innerHTML = `<b data-sel="toast-title">${esc(title)}</b><br>${esc(msg)}`;   /* every sink escapes (audit #6) */
  _toastSerial++;
  toastEl.style.opacity = '1';
  clearTimeout(_toastHide);
  _toastHide = window.setTimeout(() => {
    invalidateTameToastCounterpart();
    toastEl.style.opacity = '0';
  }, 3600);
}
function toast(title: string, msg: string, force = false): void {
  const now = performance.now();
  if (!force && now - _toastT < TOAST_DEDUP_MS) return;   /* the game's re-fire guard (review catch: parking inside a gate) */
  _toastT = now;
  showToast(title, msg, force);
}
/* Chapter reconciliation is a one-shot saved outcome: once ascCh moves, a
   later action cannot replay its notice. Replace an ambient Copy/Charted
   message without escalating the polite status region to assertive. */
function toastCharterCompletion(title: string, msg: string): void {
  _toastT = performance.now();
  showToast(title, msg, false);
}
/* A blocked reach action is a distinct contract, not just another ambient
   toast: it must replace a preceding Charted/Copy message immediately, while
   an unchanged blocker remains quiet during zoom/tap re-fire. */
function toastReachBoundary(title: string, msg: string): boolean {
  const now = performance.now();
  const key = title + '\n' + msg;
  const boundaryStillVisible = toastEl.style.opacity === '1' && _toastSerial === _boundaryToastSerial;
  if (key === _boundaryToastKey && boundaryStillVisible && now - _boundaryToastT < TOAST_DEDUP_MS) return false;
  _boundaryToastKey = key;
  _boundaryToastT = now;
  _toastT = now;
  showToast(title, msg, false);
  _boundaryToastSerial = _toastSerial;
  return true;
}
function toastCharterBoundary(msg: string): boolean {
  return toastReachBoundary('⬆ Beyond Your Charter', msg);
}
function toastPrimeReachBoundary(): boolean {
  return toastReachBoundary('⬆ Beyond Your Saved Reach', primeReachHint());
}
function bindTameToastCounterpart(
  eventKey: string,
  title: string,
  detail: string,
): AudioCounterpartReceipt | null {
  const receipt = Object.freeze({
    counterpartKey: `capture-toast:${_toastSerial}`,
    eventKey,
    generation: _toastSerial,
  });
  tameToastCounterpart = Object.freeze({ receipt, title, detail });
  if (tameToastCounterpartIsCurrent(receipt)) return receipt;
  tameToastCounterpart = null;
  return null;
}
function currentTameGreetingRouteKey(): string | null {
  if (nav.mode !== 'surface') return null;
  const address = canonicalCF1WorldAddressFromNav(nav);
  return address.ok ? address.address.key : null;
}
tameGreetingAudioOwner = createTameGreetingAudioOwner({
  createContext: () => new AudioContext() as unknown as AudioContextLike,
  nowMs: () => performance.now(),
  readPolicy: () => ({
    soundOn: save.sndOn,
    creatureVoicesOn: save.voiceOn,
    visible: document.visibilityState === 'visible',
    answerable: f4RuntimeMayAnswer(f4Runtime)
      && f4Runtime!.diagnostics().answerable
      && app.ticker?.started === true
      && !replacementTransaction
      && !replacementReloadPending,
    masterGain: save.sfxVol * save.sfxVol,
    routeKey: currentTameGreetingRouteKey(),
  }),
  verifyCounterpart: tameToastCounterpartIsCurrent,
});
const primeCount = (): number => Object.keys(save.primeFill || {}).length;
const SHIP_LIVERY_SEED = 0x5111;   /* legacy ship painter's stable livery authority */
type ShipVisualViewState = ShipVisualState & { readonly stateKey: string };
function currentShipVisualState(): ShipVisualViewState {
  const visual = shipVisualStateOf({
    items: save.items,
    ascCh: save.ascCh,
    liverySeed: SHIP_LIVERY_SEED,
  });
  return Object.freeze({ ...visual, stateKey: shipVisualStateKey(visual) });
}
const ascStage = (): 0 | 1 | 2 | 3 => currentShipVisualState().chassisStage;

function refreshEngineeringPanelState(): void {
  if (engineeringPanelReleased) return;
  const runtime = f4Runtime;
  if (arc3EngineeringProtection !== null || !f4RuntimeMayMutate(runtime)) {
    engineeringPanelController.setState(null);
    return;
  }
  try {
    /* Presentation is rebuilt from this exact authority snapshot every time
       the panel opens or an action settles. Cached app publication is never
       enough to paint a control after a hostile/stale carrier transition. */
    const engineering = readArc3Engineering(
      runtime.extensions,
      SCENE_ENGINEERING_ADDRESS_RESOLVER,
    );
    const arc2 = readArc2Loot(runtime.extensions);
    const loadout = readArc2EngineeringLoadout(runtime.extensions);
    if (engineering.kind !== 'loaded'
      || arc2.kind !== 'loaded'
      || arc2.state.kind !== 'inventory'
      || loadout.kind !== 'loaded'
      || !arc2LootLegacyMirrorMatches(arc2.state, save)) {
      engineeringPanelController.setState(null);
      return;
    }
    const verified = verifyArc3CommittedAction({
      extensions: runtime.extensions,
      committed: save,
      expectedState: engineering.state,
      codecNow: Date.now(),
      minedTimestampIntent: { kind: 'preserve' },
    });
    if (verified.kind !== 'verified') {
      engineeringPanelController.setState(null);
      return;
    }
    const ship = shipVisualStateOf({
      items: save.items,
      ascCh: save.ascCh,
      liverySeed: SHIP_LIVERY_SEED,
    });
    arc3EngineeringState = verified.state;
    lastArc3ProjectionDiagnostics = verified.projection.diagnostics;
    engineeringPanelController.setState(projectEngineeringPanelReadModel({
      ship,
      nav,
      engineering: verified.state,
      loadout: loadout.loadout,
      economy: {
        cargo: save.cargo,
        exceptionalCargo: save.cgx,
        stardust: save.essence,
        signatureIds: Object.freeze(Object.keys(save.primeFill).sort()),
        hp: save.hp,
      },
      activePlayMs: runtime.diagnostics().activePlayMs,
    }));
  } catch {
    /* A presentation projection never repairs or launders authority. The
       durable action seam will independently report the exact refusal. */
    engineeringPanelController.setState(null);
  }
}

function updateChips(): void {
  const stage = ascStage();
  const objective = currentV2Objective(save.ascCh, save.ascProg, stage);
  const projection = projectV2Charter(save.ascCh, save.ascProg, stage);
  appChrome.renderStatus({
    explorerName: save.explorerName,
    essence: save.essence,
    landedWorlds: save.landed.length,
    hp: save.hp,
    hpMax: save.HP_MAX,
    primeCount: primeCount(),
    objective: objective
      ? { kind: 'progress', text: objective.text, have: objective.have, need: objective.need }
      : projection?.state === 'boundary'
        ? { kind: 'boundary', name: projection.name }
        : null,
  });
}
function hudText(): void {
  /* the chrome per mode: trail (setTrail), hint pill, the caption line
     (setCtxText) — strings carried from the Renderer's own tails */
  updateChips();
  if (nav.mode === 'universe') {
    setTrail(['Cosmos']);
    setHint('tap a galaxy to survey · Enter on its card or zoom in to dive');
    updateUniverseCtx();
  } else if (nav.mode === 'galaxy' && nav.gal) {
    setTrail(['Cosmos', galaxyName(nav.gal.seed)]);
    setHint('tap a star to survey · Enter on its card · zoom out to rise');
    const gs2 = statsForProvenGalaxy(nav.gal);
    setCtx('every dot is one of ~' + fmtBig(gs2.stars) + ' stars sharing ~' + fmtBig(gs2.planets) + ' worlds — zoom deeper and more keep resolving');
  } else if (nav.mode === 'system' && nav.gal && nav.star) {
    setTrail([galaxyName(nav.gal.seed), starName(nav.star.seed)]);
    setHint('tap a world to survey · press Land on its card · zoom out to rise');
    const sys = systemScene(nav.star.seed);
    const raw = systemFor(nav.star.seed) as { binary?: unknown };
    const desc = nav.star.seed === 424242 ? 'Sol — humanity’s own yellow star' : 'this star';
    const extra = raw.binary ? ' · a binary pair — two suns share this sky' : '';
    setCtx(sys.planets.length
      ? sys.planets.length + ' worlds orbit ' + desc + extra
      : 'no planets here — zoom out and try another star');
  } else if (nav.mode === 'surface' && nav.gal && nav.star && nav.planet) {
    const p = planetNodeForProof(nav.star, nav.planet);
    setTrail([galaxyName(nav.gal.seed), starName(nav.star.seed), p ? p.name : 'Surface']);
    setHint('press Leave world, right-click, or Escape to lift off');
    setCtx('planetfall — the survey card carries the world’s roster');
  }
  syncSurfaceChromeBottom();
}
function updateUniverseCtx(): void {
  /* the Renderer's universe caption ladder (main.js 3788), verbatim text */
  const zc = zCut();
  const dist = Math.hypot(camT.x, camT.y);
  setCtx(camT.z < zc * 0.8
    ? 'each grain of light is an entire galaxy — filaments and voids weave the cosmic web, on and on without end'
    : (dist > OBS_R
      ? 'beyond the observable universe — hypothetical space no telescope can ever see'
      : 'galaxies cluster along the cosmic web, leaving vast dark voids — the orange ring is the edge of the observable universe'));
}

/* ---- slice-local bakes of Renderer inline gradients (verbatim stops) ---- */
let _fbdC: HTMLCanvasElement | null = null;
function fbdSpr(): HTMLCanvasElement {   /* failed brown dwarf (main.js ~4152) */
  if (_fbdC) return _fbdC;
  const S = 32, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d')!;
  const fg = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  fg.addColorStop(0, 'rgba(201,138,106,0.9)'); fg.addColorStop(1, 'transparent');
  g.fillStyle = fg; g.beginPath(); g.arc(S / 2, S / 2, S / 2, 0, TAU); g.fill();
  return (_fbdC = cv);
}
let _bhDiscC: HTMLCanvasElement | null = null;
function bhDiscSpr(): HTMLCanvasElement {   /* the supermassive black hole (main.js ~4200) */
  if (_bhDiscC) return _bhDiscC;
  const S = 128, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d')!, C = S / 2, k = C / 30;   /* world r30 → canvas */
  const sh = g.createRadialGradient(C, C, 0, C, C, 30 * k);
  sh.addColorStop(0, 'rgba(0,0,0,1)'); sh.addColorStop(0.6, 'rgba(0,0,0,0.92)'); sh.addColorStop(1, 'transparent');
  g.fillStyle = sh; g.beginPath(); g.arc(C, C, 30 * k, 0, TAU); g.fill();
  const bh = g.createRadialGradient(C, C, 4 * k, C, C, 22 * k);
  bh.addColorStop(0, 'rgba(0,0,0,1)'); bh.addColorStop(0.5, 'rgba(0,0,0,1)');
  bh.addColorStop(0.64, 'rgba(255,170,60,0.9)'); bh.addColorStop(1, 'transparent');
  g.fillStyle = bh; g.beginPath(); g.arc(C, C, 22 * k, 0, TAU); g.fill();
  return (_bhDiscC = cv);
}
const _coronaC = new Map<string, HTMLCanvasElement>();
function coronaSpr(col: string): HTMLCanvasElement {   /* main-sequence glow (main.js ~5121) */
  const hit = _coronaC.get(col); if (hit) return hit;
  const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d')!, C = S / 2;
  const sg = g.createRadialGradient(C, C, 0, C, C, C);
  sg.addColorStop(0, '#ffffff'); sg.addColorStop(0.25, col); sg.addColorStop(0.6, col + '66'); sg.addColorStop(1, 'transparent');
  g.fillStyle = sg; g.beginPath(); g.arc(C, C, C, 0, TAU); g.fill();
  _coronaC.set(col, cv);
  peakLocalCanvasCacheEntries = Math.max(
    peakLocalCanvasCacheEntries,
    _coronaC.size + _termC.size,
  );
  return cv;
}
let _moonTermC: HTMLCanvasElement | null = null;
function moonTermSpr(): HTMLCanvasElement {
  /* the moon terminator (main.js 5313): a dark offset disc clipped to the
     globe — baked with the shadow at +x; the sprite rotates to the planet's
     orbit angle so the dark limb faces away from the star */
  if (_moonTermC) return _moonTermC;
  const S = 64, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d')!, C = S / 2;
  g.beginPath(); g.arc(C, C, C, 0, TAU); g.clip();
  g.fillStyle = 'rgba(4,6,18,0.55)';
  g.beginPath(); g.arc(C + C * 0.55, C, C * 0.95, 0, TAU); g.fill();
  return (_moonTermC = cv);
}
let _webC: HTMLCanvasElement | null = null;
function webBlobSpr(): HTMLCanvasElement {   /* WEB_BLOB (main.js 3578), verbatim stops */
  if (_webC) return _webC;
  const T = 256, cv = document.createElement('canvas'); cv.width = cv.height = T;
  const g = cv.getContext('2d')!;
  const gr = g.createRadialGradient(T / 2, T / 2, 0, T / 2, T / 2, T / 2);
  gr.addColorStop(0, 'rgba(196,186,245,0.9)'); gr.addColorStop(0.40, 'rgba(150,132,232,0.42)');
  gr.addColorStop(0.75, 'rgba(132,112,225,0.12)'); gr.addColorStop(1, 'rgba(132,112,225,0)');
  g.fillStyle = gr; g.fillRect(0, 0, T, T);
  return (_webC = cv);
}
let _fogBC: HTMLCanvasElement | null = null;
function fogBlobSpr(): HTMLCanvasElement {   /* FOG_BLOB (main.js 3589), verbatim stops */
  if (_fogBC) return _fogBC;
  const T = 256, cv = document.createElement('canvas'); cv.width = cv.height = T;
  const g = cv.getContext('2d')!;
  const gr = g.createRadialGradient(T / 2, T / 2, 0, T / 2, T / 2, T / 2);
  gr.addColorStop(0, 'rgba(6,8,20,0.6)'); gr.addColorStop(0.45, 'rgba(7,9,22,0.32)');
  gr.addColorStop(0.8, 'rgba(5,7,16,0.08)'); gr.addColorStop(1, 'rgba(5,7,16,0)');
  g.fillStyle = gr; g.fillRect(0, 0, T, T);
  return (_fogBC = cv);
}
let _veilC: HTMLCanvasElement | null = null;
function veilSpr(): HTMLCanvasElement {   /* the beyond-charter veil (main.js 3760), proportional bake */
  if (_veilC) return _veilC;
  const S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d')!, C = S / 2;
  const gr = g.createRadialGradient(C, C, C * (0.97 / 2.0), C, C, C);
  gr.addColorStop(0, 'rgba(5,7,16,0)'); gr.addColorStop(0.5, 'rgba(5,7,16,0.2)'); gr.addColorStop(1, 'rgba(4,5,12,0.36)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  return (_veilC = cv);
}
let _obsC: HTMLCanvasElement | null = null;
function obsRingSpr(): HTMLCanvasElement {   /* the observable-universe edge (main.js 3611), proportional band */
  if (_obsC) return _obsC;
  const S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d')!, C = S / 2;
  const gr = g.createRadialGradient(C, C, 0, C, C, C);
  gr.addColorStop(0.9417, 'rgba(255,140,50,0)'); gr.addColorStop(0.9709, 'rgba(255,170,70,0.45)'); gr.addColorStop(1, 'rgba(255,140,50,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(C, C, C, 0, TAU); g.fill();
  return (_obsC = cv);
}
let _radioC: HTMLCanvasElement | null = null;
function radioLobesSpr(): HTMLCanvasElement {   /* jet lobes (main.js 3697), verbatim colors; u px = 1 galaxy-size unit */
  if (_radioC) return _radioC;
  const u = 38, W2 = Math.ceil(6.6 * u), H2 = Math.ceil(2.8 * u);
  const cv = document.createElement('canvas'); cv.width = W2; cv.height = H2;
  const g = cv.getContext('2d')!, cx = W2 / 2, cy = H2 / 2;
  for (const sgn of [-1, 1]) {
    const lg2 = g.createRadialGradient(cx + sgn * 1.9 * u, cy, 0, cx + sgn * 1.9 * u, cy, 1.4 * u);
    lg2.addColorStop(0, 'rgba(255,150,90,0.32)'); lg2.addColorStop(1, 'transparent');
    g.fillStyle = lg2; g.beginPath(); g.arc(cx + sgn * 1.9 * u, cy, 1.4 * u, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,170,110,0.45)'; g.lineWidth = 0.07 * u;
    g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + sgn * 1.9 * u, cy); g.stroke();
  }
  return (_radioC = cv);
}
let _tailC: HTMLCanvasElement | null = null;
function cometTailSpr(): HTMLCanvasElement {   /* the tail gradient (main.js 5388), baked as a strip */
  if (_tailC) return _tailC;
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 8;
  const g = cv.getContext('2d')!;
  const gr = g.createLinearGradient(0, 0, 64, 0);
  gr.addColorStop(0, 'rgba(200,230,255,0.8)'); gr.addColorStop(1, 'transparent');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 8);
  return (_tailC = cv);
}
const _termC = new Map<string, HTMLCanvasElement>();
function terminatorSpr(starCol: string): HTMLCanvasElement {
  /* the day/night overlay (main.js ~5264): lit tint at the starward point,
     night at the far limb, clipped to the globe. Baked with the light at a
     fixed local point; the sprite ROTATES to face the star. Canvas C = 1.5pr. */
  const hit = _termC.get(starCol); if (hit) return hit;
  const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d')!, C = S / 2, pr = C / 1.5;
  const n = parseInt((starCol || '#ffe9c4').slice(1), 16);
  const lr = (n >> 16) & 255, lgc = (n >> 8) & 255, lb = n & 255;
  const lit = 'rgba(' + Math.round(lr * 0.55 + 255 * 0.45) + ',' + Math.round(lgc * 0.55 + 250 * 0.45) + ',' + Math.round(lb * 0.55 + 230 * 0.45) + ',0.18)';
  const lg = g.createRadialGradient(C - pr * 0.5, C, 0, C, C, pr * 1.5);
  lg.addColorStop(0, lit); lg.addColorStop(0.5, 'rgba(0,0,0,0)'); lg.addColorStop(1, 'rgba(0,0,12,0.42)');
  g.fillStyle = lg; g.fillRect(0, 0, S, S);
  g.globalCompositeOperation = 'destination-in';
  g.beginPath(); g.arc(C, C, pr, 0, TAU); g.fill();
  _termC.set(starCol, cv);
  peakLocalCanvasCacheEntries = Math.max(
    peakLocalCanvasCacheEntries,
    _coronaC.size + _termC.size,
  );
  return cv;
}

/* ---- zoom-dependent bookkeeping ---- */
interface StarNodeRef { seed: number; x: number; y: number; c?: string; s: number; }
interface StarEntry { spr: Sprite; star: StarNodeRef; }
interface ScreenScaled { obj: Container; f: number; }   /* scale = f / cam.z */
/* Pixi keys managed canvas-text textures by TextStyle identity. Recreating an
   equivalent style for every scene leaves one null cache key per old label;
   these finite document-owned styles make repeated routes reuse those keys. */
const italicSceneTextStyle = (fontSize: number, fill: string | number): TextStyle =>
  new TextStyle({ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize, fill });
const SCENE_TEXT_STYLES = Object.freeze({
  clusterCaption: italicSceneTextStyle(13, 'rgba(170,150,230,0.34)'),
  voidCaption: italicSceneTextStyle(13, 'rgba(110,118,150,0.4)'),
  homeGalaxy: italicSceneTextStyle(12, 0xffd9a0),
  quasar: italicSceneTextStyle(12, 'rgba(190,215,255,0.85)'),
  radioGalaxy: italicSceneTextStyle(12, 'rgba(255,190,150,0.8)'),
  namedGalaxy: italicSceneTextStyle(12, 'rgba(200,210,240,0.7)'),
  charter: italicSceneTextStyle(13, 'rgba(170,205,255,0.72)'),
  sun: italicSceneTextStyle(12, 'rgba(255,217,160,0.95)'),
  habitableZone: italicSceneTextStyle(10, 'rgba(140,230,170,0.6)'),
  asteroidBelt: italicSceneTextStyle(9.5, 'rgba(180,172,158,0.7)'),
  planet: new TextStyle({
    fontFamily: 'Georgia, serif', fontSize: 11, fill: 'rgba(220,226,255,0.8)',
  }),
  comet: italicSceneTextStyle(9, 'rgba(205,228,255,0.78)'),
  visitor: italicSceneTextStyle(9, 'rgba(230,190,160,0.8)'),
});
const galaxySpins: Array<{ spr: Sprite; base: number }> = [];
let uniNodes: GalaxyNode[] = [];   /* cached universe composition — checkTransitions runs per tick */
let uniCell: { ux: number; uy: number } | null = null;   /* the streamed window's anchor cell */
/* SURVEY-FIRST: one tap opens the typed card; its explicit 44px travel
   action performs the dive. The card can cover the body on a phone, so
   navigation must never depend on a second canvas tap or a timing window. */
function surveyCard(d: unknown, travelAction: CardTravelAction | null = null): void {
  if (d) { showSurvey(d as Descriptor, undefined, travelAction); playSurveyPing(); }
}
let galStars: StarEntry[] = [];
let galTwinkle: StarEntry[] = [];
let screenScaled: ScreenScaled[] = [];
let solMark: Container | null = null;
let bhDisc: Sprite | null = null;
interface GalAnim { spr: Container; kind: 'bhdisc' | 'nsbeam' | 'proto' | 'worm'; seed: number; }
let galAnims: GalAnim[] = [];
let wormPos: { x: number; y: number } | null = null;
/* universe furniture: zoom-gated labels, blazar pulses, the charter fx layer */
let uniLabels: Array<{ t: Text; size: number; gate: number }> = [];   /* gate 0 = the far-zoom web captions */
let uniPulse: Array<{ spr: Sprite; seed: number }> = [];
let charterFx: Container | null = null;
let webLayer: Container | null = null;
let fogFx: Array<{ spr: Sprite; wx: number; wy: number; ramp: number }> = [];
let lastGalaxyBuildMs = 0;
interface CometFx { coma: Sprite; tail: Sprite; label: Text; cm: { off: number; period: number; aMaj: number; ecc: number; tilt: number }; }
let sysComets: CometFx[] = [];
let visitorFx: { wrap: Container; body: Sprite; label: Text; v: { speed: number; off: number; ang: number; b: number } } | null = null;
const zCut = (): number => {
  const W = app.screen.width, H = app.screen.height;   /* logical CSS px — renderer.width/resolution DOUBLE-divided on DPR-3 phones (the off-center-scene bug the perf probe caught) */
  return Math.sqrt((W * H) / (UCELL * UCELL * 3600));   /* main.js 3620 */
};
let fineLayer: Container | null = null;
type RetiredFineTextureOwner = Readonly<{
  layer: Container | null;
  scope: SceneTextureScope<HTMLCanvasElement, Texture> | null;
}>;
const retiredFineTextureOwners = new Set<RetiredFineTextureOwner>();
let fineWin: { fx0: number; fy0: number; fx1: number; fy1: number } | null = null;
let fineStarTargets: Array<{ spr: Sprite; star: StarNodeRef }> = [];
let lastZBucket = 0;
const zBucket = (): number => Math.round(Math.log(cam.z) / Math.log(1.15));
interface Orbiter { c: Container; kind: 'planet' | 'moon' | 'rock' | 'dwarf' | 'beam'; orb: number; sp?: number; a0?: number; mul?: number; pOrb?: number; face?: Sprite[]; planetTextureLease?: SceneTextureLease<Texture>; cloud?: { wrap: Container; a: Sprite; b: Sprite; pr: number }; }
let orbiters: Orbiter[] = [];
let planetTargets: Array<{ holder: Container; planet: PlanetNode }> = [];
let sysLabels: Array<{ t: Text; getPos: (time: number) => { x: number; y: number } }> = [];
let sysStar: { seed: number; col: string; kind: string; starR: number } | null = null;
let chartLayer: Container | null = null;   /* Star charts (chartsOn, OFF by default — v1.3.6, Nick's call) */
let starSurfSpr: Sprite | null = null;
let starSurfTextureLease: SceneTextureLease<Texture> | null = null;
let surfClouds: { a: Sprite; b: Sprite; w: number } | null = null;
let surfacePlanetTextureGeneration = 0;
let surfacePlanetTextureOwner:
  SurfacePlanetTextureAttachment<HTMLCanvasElement, Texture> | null = null;
const SURFACE_PLANET_DIAMETER_CSS_PX = 420;
let systemPlanetTextureRefreshTimer: ReturnType<typeof setTimeout> | null = null;
const baseR = (): number => Math.max(0.7 / cam.z, 0.55);   /* Renderer star sizing (main.js 4126) */

function releaseSurfacePlanetTextureOwner():
  SurfacePlanetTextureAttachment<HTMLCanvasElement, Texture> | null {
  surfacePlanetTextureGeneration++;
  const previous = surfacePlanetTextureOwner;
  previous?.cancelPending();
  surfacePlanetTextureOwner = null;
  return previous;
}

function clearWorld(openNextScope = true): void {
  /* Destroy display objects first, then the scene owner's unique CanvasSource
     set. The painter caches may retain bounded CPU canvases for deterministic
     reuse, but Pixi must not keep their evicted GPU sources reachable. */
  const previousSurfacePlanetTextureOwner = releaseSurfacePlanetTextureOwner();
  if (systemPlanetTextureRefreshTimer !== null) {
    clearTimeout(systemPlanetTextureRefreshTimer);
    systemPlanetTextureRefreshTimer = null;
  }
  const previousFineLayer = fineLayer;
  const previousFineScope = fineTextureScope;
  fineLayer = null;
  fineTextureScope = null;
  retireFineTextureOwner(previousFineLayer, previousFineScope);
  for (const c of world.removeChildren()) c.destroy({ children: true, context: true });
  const releaseFailures: unknown[] = [];
  if (previousSurfacePlanetTextureOwner) {
    try { previousSurfacePlanetTextureOwner.dispose(); }
    catch (error) { releaseFailures.push(error); }
  }
  try { releaseRetiredFineTextureOwners(); }
  catch (error) { releaseFailures.push(error); }
  if (sceneTextureScope) {
    try { sceneTextureScope.dispose(); sceneTextureScope = null; }
    catch (error) { releaseFailures.push(error); }
  }
  _rgCache.clear();
  _coronaC.clear();
  _termC.clear();
  galaxySpins.length = 0;
  galStars = []; galTwinkle = []; screenScaled = [];
  solMark = null; bhDisc = null; fineLayer = null; fineWin = null;
  fineStarTargets = [];
  orbiters = []; planetTargets = []; sysLabels = []; sysStar = null; starSurfSpr = null; starSurfTextureLease = null; surfClouds = null; chartLayer = null;
  galAnims = []; wormPos = null;
  uniLabels = []; uniPulse = []; charterFx = null; webLayer = null; fogFx = [];
  sysComets = []; visitorFx = null;
  sceneTextureGeneration++;
  if (releaseFailures.length) {
    throw new AggregateError(releaseFailures, 'one or more scene texture scopes failed to release');
  }
  pixiManagedResourceOwner.compact();
  if (openNextScope) {
    sceneTextureScope = sceneTextureRegistry.createScope(`scene:${sceneTextureGeneration}`);
  }
}

/* ---- draw passes ---- */
function drawUniverse(): void {
  clearWorld();
  /* THE REAL ART: per-seed painterly sprites (verbatim GalaxyArt painters,
     kind-locked), with the Renderer's exact transform (main.js ~3741).
     STREAMED around the CAMERA. Special populations wear their bespoke
     faces: quasars the feeding-black-hole sprite, radio galaxies their jet
     lobes, colliding pairs their tidal bridge — and the far zoom melts
     into the cosmic web with cluster/void captions (main.js 3658). */
  uniCell = { ux: Math.floor(camT.x / UCELL), uy: Math.floor(camT.y / UCELL) };
  const R = 3;
  /* the cosmic web breath, per cell */
  webLayer = new Container();
  webLayer.eventMode = 'none';
  world.addChild(webLayer);
  for (let cx = uniCell.ux - R; cx <= uniCell.ux + R; cx++) for (let cy = uniCell.uy - R; cy <= uniCell.uy + R; cy++) {
    const gl = galaxiesInCell(cx, cy);
    const web = gl.web ?? 0;
    if (web > 0.5) {
      const b = new Sprite(sceneTexture(webBlobSpr()));
      b.anchor.set(0.5);
      b.position.set(cx * UCELL + UCELL / 2, cy * UCELL + UCELL / 2);
      b.width = UCELL * 1.9; b.height = UCELL * 1.9;
      b.alpha = (web - 0.5) * 0.17;
      b.cullable = true;
      webLayer.addChild(b);
    }
    /* far-zoom captions: clusters glow, voids yawn (sparse, seeded picks) */
    const capt: [string, TextStyle] | null =
      (web > 0.86 && ((cx * 7 + cy * 13) % 29 === 0))
        ? ['galaxy cluster', SCENE_TEXT_STYLES.clusterCaption]
        : (web < 0.05 && ((cx * 5 + cy * 3) % 23 === 0))
          ? ['cosmic void', SCENE_TEXT_STYLES.voidCaption] : null;
    if (capt) {
      const t = createSceneText(capt[0], capt[1]);
      t.anchor.set(0.5);
      t.position.set(cx * UCELL + UCELL / 2, cy * UCELL + UCELL / 2);
      t.visible = false;
      world.addChild(t);
      screenScaled.push({ obj: t, f: 1 });
      uniLabels.push({ t, size: 0, gate: 0 });
    }
  }
  uniNodes = universeGalaxies(camT.x, camT.y, R);
  for (const g of uniNodes) {
    const sz = g.size;
    const onTap = (): void => {
      surveyCard(
        describePick({ kind: g.quasar ? 'quasar' : (g.radio ? 'radio' : 'galaxy'), data: g } as never),
        { label: 'Enter galaxy', run: () => descendGalaxy(g) },
      );
    };
    let label: [string, TextStyle, number] | null = null;   /* text, style, gate */
    if (g.quasar) {
      /* the feeding black hole outshines its galaxy (main.js 3714) */
      const q = new Sprite(sceneTexture(_quasarSpr()));
      q.anchor.set(0.5);
      q.position.set(g.x, g.y);
      q.width = sz * 5.6; q.height = sz * 5.6;
      q.rotation = g.rot;
      q.cullable = true;
      q.eventMode = 'static'; q.cursor = 'pointer';
      q.on('pointertap', onTap);
      world.addChild(q);
      if (g.blazar) uniPulse.push({ spr: q, seed: g.seed });
      label = [
        g.blazar ? 'blazar — a quasar jet aimed straight at you'
          : 'quasar — a feeding black hole outshining its galaxy',
        SCENE_TEXT_STYLES.quasar,
        26,
      ];
    } else {
      if (g.radio) {
        const lobes = new Sprite(sceneTexture(radioLobesSpr()));
        lobes.anchor.set(0.5);
        lobes.position.set(g.x, g.y);
        lobes.width = sz * 6.6; lobes.height = sz * 2.8;
        lobes.rotation = g.rot;
        lobes.eventMode = 'none'; lobes.cullable = true;
        world.addChild(lobes);
        label = ['radio galaxy — jets inflate giant lobes', SCENE_TEXT_STYLES.radioGalaxy, 30];
      }
      if (g.bridge) {
        /* tidal bridge of stars torn between colliding galaxies (main.js 3729) */
        const mx2 = (g.x + g.bridge.x2) / 2, my2 = (g.y + g.bridge.y2) / 2;
        const br = new Graphics();
        br.moveTo(g.x, g.y);
        br.quadraticCurveTo(mx2 + sz * 0.4, my2 - sz * 0.4, g.bridge.x2, g.bridge.y2);
        br.stroke({ width: sz * 0.14, color: 0xd2dcfa, alpha: 0.20 });
        br.eventMode = 'none';
        world.addChild(br);
      }
      const spr = new Sprite(sceneTexture(galSpriteFor(g)));
      spr.anchor.set(0.5);
      spr.position.set(g.x, g.y);
      const k = g.radio ? 0.6 : 1;   /* the radio host draws smaller inside its lobes */
      const px = (sz * 2 * k) / 512;
      spr.scale.set(px, px * g.tilt);
      spr.rotation = g.radio ? g.rot + Math.PI / 2 : g.rot;
      spr.cullable = true;
      spr.eventMode = 'static';
      spr.cursor = 'pointer';
      spr.on('pointertap', onTap);
      world.addChild(spr);
      if (!g.radio) galaxySpins.push({ spr, base: g.rot });
    }
    if (g.home) {
      const t = createSceneText('Milky Way — you are here', SCENE_TEXT_STYLES.homeGalaxy);
      t.anchor.set(0.5, 0);
      t.position.set(g.x, g.y + sz * 1.15 + 4);
      world.addChild(t);
    } else if (label) {
      const t = createSceneText(label[0], label[1]);
      t.anchor.set(0.5, 0);
      t.position.set(g.x, g.y + sz * (g.quasar ? 2 : 2.4));
      t.visible = false;
      world.addChild(t);
      screenScaled.push({ obj: t, f: 1 });
      uniLabels.push({ t, size: sz, gate: label[2] });
    } else if (!g.dwarf) {
      /* every named galaxy earns its name as you close in (main.js 3746) */
      const t = createSceneText(galaxyName(g.seed), SCENE_TEXT_STYLES.namedGalaxy);
      t.anchor.set(0.5, 0);
      t.position.set(g.x, g.y + sz * 1.15);
      t.visible = false;
      world.addChild(t);
      screenScaled.push({ obj: t, f: 1 });
      uniLabels.push({ t, size: sz, gate: 34 });
    }
  }
  /* the charter: a glowing frontier ring, the veil, drifting fog beyond
     (fog is static per rebuild in the slice — the drift is recorded) */
  const rr = reachRadiusOf(primeCount());
  charterFx = new Container();
  charterFx.eventMode = 'none';
  const veil = new Sprite(sceneTexture(veilSpr()));
  veil.anchor.set(0.5);
  veil.position.set(HOME_POS.x, HOME_POS.y);
  veil.width = rr * 4; veil.height = rr * 4;
  charterFx.addChild(veil);
  const FC = UCELL * 1.5;
  for (let fx = uniCell.ux * 2 - R * 2; fx <= uniCell.ux * 2 + R * 2; fx++) for (let fy = uniCell.uy * 2 - R * 2; fy <= uniCell.uy * 2 + R * 2; fy++) {
    const wx = fx * FC + FC * 0.5, wy = fy * FC + FC * 0.5;
    const dd = Math.hypot(wx - HOME_POS.x, wy - HOME_POS.y);
    if (dd < rr * 1.04) continue;
    const ramp = Math.min(Math.max((dd - rr) / (rr * 0.55), 0), 1);
    const n = (UNOISE as (x: number, y: number, o: number) => number)(wx / UCELL * 0.16, wy / UCELL * 0.16, 3);
    const a = Math.min(Math.max((n - 0.32) * 1.1, 0), 0.7) * ramp;
    if (a <= 0.03 && ramp <= 0) continue;
    const f = new Sprite(sceneTexture(fogBlobSpr()));
    f.anchor.set(0.5);
    f.position.set(wx, wy);
    f.width = FC * 1.9; f.height = FC * 1.9;
    f.alpha = a;
    f.cullable = true;
    charterFx.addChild(f);
    fogFx.push({ spr: f, wx, wy, ramp });   /* the drift re-samples the noise per tick */
  }
  const ring = new Graphics().circle(HOME_POS.x, HOME_POS.y, rr).stroke({ width: Math.max(rr * 0.0035, 1.2), color: 0x96beff, alpha: 0.5 });
  charterFx.addChild(ring);
  const cLab = createSceneText(
    'your charter — ' + currentRegionOf(primeCount()).name,
    SCENE_TEXT_STYLES.charter,
  );
  cLab.anchor.set(0.5, 1);
  cLab.position.set(HOME_POS.x, HOME_POS.y - rr - 4);
  charterFx.addChild(cLab);
  screenScaled.push({ obj: cLab, f: 1 });
  world.addChild(charterFx);
  /* the edge of the observable universe — the orange ring (main.js 3611) */
  const obs = new Sprite(sceneTexture(obsRingSpr()));
  obs.anchor.set(0.5);
  obs.width = OBS_R * 2.06; obs.height = OBS_R * 2.06;
  obs.eventMode = 'none';
  world.addChild(obs);
  applyUniverseGates();   /* gates live from the first frame, not the first zoom */
  if (abortRenderBeforeReceiptForSmoke()) return;
  recordRenderedScene(NAV_HOME);
}
function applyUniverseGates(): void {
  const zc = zCut();
  if (webLayer) webLayer.visible = cam.z > zc;   /* showWeb (main.js 3658) */
  if (charterFx) charterFx.visible = cam.z > zc * 0.7;
  for (const L of uniLabels) L.t.visible = L.gate === 0 ? (cam.z > zc && cam.z < 0.5) : (L.size * cam.z > L.gate);
}

function drawGalaxy(state: Extract<NavState, { mode: 'galaxy' }>): void {
  const galSeed = state.gal.seed;
  const _b0 = performance.now();
  clearWorld();
  const prof = galaxyProfile(galSeed) as Record<string, unknown>;
  /* THE HAZE — unresolved starlight matching the exact star-density math,
     owned by the browser-only art package. */
  const hazeSpr = new Sprite(sceneTexture(
    galaxyHaze(galSeed, prof) as HTMLCanvasElement,
    'galaxy-haze',
  ));
  hazeSpr.anchor.set(0.5);
  hazeSpr.scale.set((2 * GR) / 2048);
  hazeSpr.eventMode = 'none';
  world.addChild(hazeSpr);
  const w = galaxyCellWindow(-GR * 1.2, -GR * 1.2, GR * 1.2, GR * 1.2);
  const bR = baseR();
  const galaxyCells: Array<ReturnType<typeof provenGalaxyCell>> = [];
  for (let cx = w.cx0; cx <= w.cx1; cx++) for (let cy = w.cy0; cy <= w.cy1; cy++) {
    /* Materialize the old full ±1.2R window once. The second draw pass reuses
       it instead of repeating the 4,900-cell domain/cache traversal; cells
       beyond R still own the generated globular-cluster halo out to 1.7R. */
    galaxyCells.push(provenGalaxyCell(state.gal, prof, cx, cy));
  }
  /* deco pass UNDER the stars, Renderer sizes (main.js ~4131): nebulae ×2.3 ·
     planetary shells ×2.4 · remnants ×2.6 · open/glob star knots · rogue
     planets · failed brown dwarfs. Deco sprites are PICKABLE — the survey
     card speaks through describePick, the game's own card router. */
  const decoLayer = new Container();
  world.addChild(decoLayer);
  const decoTap = (dc: Record<string, unknown>) => (): void => {
    const d = describePick({ kind: 'deco', data: dc } as never);
    if (d) showSurvey(d as unknown as Descriptor);
  };
  for (const cell of galaxyCells) {
    for (const dc of cell.deco) {
      if (dc.k === 'h2' || dc.k === 'neb' || dc.k === 'mol' || dc.k === 'plan' || dc.k === 'rem') {
        const f = dc.k === 'rem' ? 1.3 : dc.k === 'plan' ? 1.2 : 1.15;
        const spr = new Sprite(sceneTexture(decoSprite(dc)));
        spr.anchor.set(0.5);
        const rr = (dc.rr as number) || 8;
        spr.position.set(dc.x, dc.y);
        spr.width = rr * 2 * f; spr.height = rr * 2 * f;
        spr.cullable = true;
        spr.eventMode = 'static';
        spr.cursor = 'pointer';
        spr.on('pointertap', decoTap(dc));
        decoLayer.addChild(spr);
      } else if ((dc.k === 'open' || dc.k === 'glob') && Array.isArray(dc.pts)) {
        /* star knots: loose young clusters / dense ancient globulars —
           starSprite points at the Renderer's sizes, additive like the source */
        const glob = dc.k === 'glob';
        const tex = sceneTexture(starSprite(glob ? '#f0dcb0' : '#cfe4ff', false));
        for (const pt of dc.pts as Array<[number, number, number]>) {
          const d2 = pt[2] * bR * (glob ? 5.5 : 6);
          const s2 = new Sprite(tex);
          s2.anchor.set(0.5);
          s2.blendMode = 'add';
          s2.position.set((dc.x as number) + pt[0], (dc.y as number) + pt[1]);
          s2.width = d2; s2.height = d2;
          s2.cullable = true;
          decoLayer.addChild(s2);
        }
      } else if (dc.k === 'rogue') {
        const s2 = new Sprite(sceneTexture(_rogueSpr()));
        s2.anchor.set(0.5); s2.position.set(dc.x, dc.y);
        s2.width = 2.1; s2.height = 2.1;
        s2.eventMode = 'static'; s2.cursor = 'pointer';
        s2.on('pointertap', decoTap(dc));
        decoLayer.addChild(s2);
      } else if (dc.k === 'fbd') {
        const s2 = new Sprite(sceneTexture(fbdSpr()));
        s2.anchor.set(0.5); s2.position.set(dc.x, dc.y);
        s2.width = 3.2; s2.height = 3.2;
        s2.eventMode = 'static'; s2.cursor = 'pointer';
        s2.on('pointertap', decoTap(dc));
        decoLayer.addChild(s2);
      }
    }
  }
  /* THE STARS — starSprite painters, additive, Renderer sizing D=s·baseR·8,
     spiked halo for the giants (s≥1.5), twinkle list for the bright (s>1.3) */
  for (const cell of galaxyCells) {
    for (const s of cell.stars) {
      const spr = new Sprite(sceneTexture(starSprite(s.c, s.s >= 1.5)));
      spr.anchor.set(0.5);
      spr.blendMode = 'add';
      const D = s.s * bR * 8;
      spr.width = D; spr.height = D;
      spr.position.set(s.x, s.y);
      spr.cullable = true;
      spr.eventMode = 'static';
      spr.cursor = 'pointer';
      spr.on('pointertap', () => {
        const star = { seed: s.seed, x: s.x, y: s.y };
        surveyCard(describePick({ kind: 'star', data: s } as never), {
          label: 'Enter system', run: () => descendSystem(star),
        });
      });
      world.addChild(spr);
      const entry = { spr, star: { seed: s.seed, x: s.x, y: s.y, c: s.c, s: s.s } };
      galStars.push(entry);
      if (s.s > 1.3) galTwinkle.push(entry);
      if ((s as { sol?: boolean }).sol) buildSolMark(s.x, s.y);
    }
  }
  /* the wormhole — one hides in a few galaxies; survey it, or fly in and be
     hurled somewhere unimaginably distant (main.js 3415: the jump is seeded
     from the galaxy, identical for every explorer, reach-clamped toward home) */
  const wh = galaxyWormhole(galSeed) as { x: number; y: number } | null;
  if (wh) {
    const ws = new Sprite(sceneTexture(_wormSpr()));
    ws.anchor.set(0.5);
    ws.position.set(wh.x, wh.y);
    ws.width = 30; ws.height = 30;
    ws.eventMode = 'static';
    ws.cursor = 'pointer';
    ws.on('pointertap', () => surveyCard(describePick({ kind: 'worm', data: wh } as never)));
    world.addChild(ws);
    galAnims.push({ spr: ws, kind: 'worm', seed: galSeed });
    wormPos = wh;
  }
  /* supernova aftermath — epoch-anchored: sites shift as COSMIC_EPOCH climbs
     (main.js 4214). Every death is a cloud; remnants keep their cores. */
  for (const site of supernovaSites(galSeed, currentEcologyEpoch())) {
    const ss = new Sprite(sceneTexture(snSiteSprite(site.seed)));
    ss.anchor.set(0.5);
    ss.position.set(site.x, site.y);
    ss.width = 48; ss.height = 48;
    ss.eventMode = 'static';
    ss.cursor = 'pointer';
    ss.on('pointertap', () => surveyCard(describePick({ kind: 'snova', data: site } as never)));
    world.addChild(ss);
    if (site.remnant === 'BH') {
      const bd = new Sprite(sceneTexture(_bhDiscSpr()));
      bd.anchor.set(0.5); bd.position.set(site.x, site.y);
      bd.width = 14; bd.height = 14; bd.eventMode = 'none';
      world.addChild(bd);
      galAnims.push({ spr: bd, kind: 'bhdisc', seed: site.seed });
    } else if (site.remnant === 'NS') {
      const beams = new Container(); beams.eventMode = 'none';
      beams.position.set(site.x, site.y);
      for (const rot of [0, Math.PI]) {
        const bm = new Sprite(sceneTexture(_beamSpr()));
        bm.anchor.set(0, 0.5); bm.position.set(0.9 * Math.cos(rot), 0.9 * Math.sin(rot));
        bm.width = 6.8; bm.height = 1.6; bm.rotation = rot; bm.alpha = 0.8;
        beams.addChild(bm);
      }
      world.addChild(beams);
      galAnims.push({ spr: beams, kind: 'nsbeam', seed: site.seed });
      const core = new Sprite(sceneTexture(_nsCoreSpr()));
      core.anchor.set(0.5); core.position.set(site.x, site.y);
      core.width = 3.2; core.height = 3.2; core.eventMode = 'none';
      world.addChild(core);
    }
    for (const b of site.births) {
      const ps = new Sprite(sceneTexture(_protoSpr()));
      ps.anchor.set(0.5); ps.position.set(b.x, b.y);
      ps.width = 6.8; ps.height = 6.8;
      ps.eventMode = 'static';
      ps.cursor = 'pointer';
      ps.on('pointertap', () => surveyCard(describePick({ kind: 'protostar', data: b } as never)));
      world.addChild(ps);
      galAnims.push({ spr: ps, kind: 'proto', seed: b.seed });
    }
  }
  /* the supermassive black hole — over every star layer: light stops here */
  bhDisc = new Sprite(sceneTexture(bhDiscSpr()));
  bhDisc.anchor.set(0.5);
  bhDisc.width = 60; bhDisc.height = 60;
  bhDisc.eventMode = 'none';
  world.addChild(bhDisc);
  lastZBucket = zBucket();
  updateFineLayer(true);
  lastGalaxyBuildMs = performance.now() - _b0;   /* the rebuild budget, logged by the smoke */
  if (abortRenderBeforeReceiptForSmoke()) return;
  recordRenderedScene(state);
}

function buildSolMark(x: number, y: number): void {
  /* 'Sun — our star' (main.js 4171): ring 9/z + italic label, LOD-gated */
  solMark = new Container();
  solMark.eventMode = 'none';
  solMark.position.set(x, y);
  const ring = new Graphics().circle(0, 0, 9).stroke({ width: 1.2, color: 0xffd9a0, alpha: 0.8 });
  const label = createSceneText('Sun — our star', SCENE_TEXT_STYLES.sun);
  label.anchor.set(0.5, 1);
  label.position.set(0, -14);
  solMark.addChild(ring); solMark.addChild(label);
  world.addChild(solMark);
  screenScaled.push({ obj: solMark, f: 1 });
}

function releaseFineLayer(): void {
  const previousLayer = fineLayer;
  const previousScope = fineTextureScope;
  const ownedResources = previousLayer !== null || previousScope !== null
    || retiredFineTextureOwners.size > 0;
  fineLayer = null;
  fineTextureScope = null;
  fineWin = null;
  fineStarTargets = [];
  retireFineTextureOwner(previousLayer, previousScope);
  releaseRetiredFineTextureOwners();
  if (ownedResources) pixiManagedResourceOwner.compact();
}

function retireFineTextureOwner(
  layer: Container | null,
  scope: SceneTextureScope<HTMLCanvasElement, Texture> | null,
): void {
  if (!layer && !scope) return;
  retiredFineTextureOwners.add(Object.freeze({ layer, scope }));
}

function releaseRetiredFineTextureOwners(): void {
  const failures: unknown[] = [];
  for (const owner of [...retiredFineTextureOwners]) {
    try {
      if (owner.layer && !owner.layer.destroyed) {
        owner.layer.removeFromParent();
        owner.layer.destroy({ children: true, context: true });
      }
      owner.scope?.dispose();
      retiredFineTextureOwners.delete(owner);
    } catch (error) { failures.push(error); }
  }
  if (failures.length) {
    throw new AggregateError(failures, 'retired fine texture owner failed to release');
  }
}

function updateFineLayer(force: boolean): void {
  /* fine star layer (main.js 4182): keep resolving stars the deeper you
     zoom — gate c.z > minWH/260, FCELL cells, viewport-windowed, clamped
     to the disc. Diveable, same as the game's picks. */
  if (nav.mode !== 'galaxy' || !nav.gal) return;
  const on = cam.z > minWH() / 260;
  if (!on) {
    releaseFineLayer();
    return;
  }
  releaseRetiredFineTextureOwners();
  const W = app.screen.width, H = app.screen.height;   /* logical CSS px — renderer.width/resolution DOUBLE-divided on DPR-3 phones (the off-center-scene bug the perf probe caught) */
  const x0 = cam.x - (W / 2) / cam.z, y0 = cam.y - (H / 2) / cam.z;
  const x1 = cam.x + (W / 2) / cam.z, y1 = cam.y + (H / 2) / cam.z;
  const win = {
    fx0: Math.max(Math.floor(x0 / FCELL), Math.floor(-GR / FCELL) - 1),
    fy0: Math.max(Math.floor(y0 / FCELL), Math.floor(-GR / FCELL) - 1),
    fx1: Math.min(Math.floor(x1 / FCELL), Math.floor(GR / FCELL) + 1),
    fy1: Math.min(Math.floor(y1 / FCELL), Math.floor(GR / FCELL) + 1),
  };
  if (!force && fineWin && win.fx0 === fineWin.fx0 && win.fy0 === fineWin.fy0 && win.fx1 === fineWin.fx1 && win.fy1 === fineWin.fy1) return;
  const previousLayer = fineLayer;
  const previousScope = fineTextureScope;
  const nextLayer = new Container();
  const nextScope = sceneTextureRegistry.createScope(`fine:${sceneTextureGeneration}`);
  const nextTargets: Array<{ spr: Sprite; star: StarNodeRef }> = [];
  const prof = galaxyProfile(nav.gal.seed) as Record<string, unknown>;
  const bR = baseR();
  try {
    for (let fx = win.fx0; fx <= win.fx1; fx++) for (let fy = win.fy0; fy <= win.fy1; fy++) {
      for (const s of galaxyFineCell(nav.gal, prof, fx, fy)) {
        const spr = new Sprite(nextScope.acquire(starSprite(s.c, false)));
        spr.anchor.set(0.5);
        spr.blendMode = 'add';
        const D = s.s * bR * 6.5;
        spr.width = D; spr.height = D;
        spr.position.set(s.x, s.y);
        spr.cullable = true;
        /* Fine stars obey the same survey-first card action as base stars. */
        spr.eventMode = 'static';
        spr.cursor = 'pointer';
        spr.on('pointertap', () => {
          const star = { seed: s.seed, x: s.x, y: s.y };
          surveyCard(describePick({ kind: 'star', data: s } as never), {
            label: 'Enter system', run: () => descendSystem(star),
          });
        });
        nextLayer.addChild(spr);
        nextTargets.push({ spr, star: { seed: s.seed, x: s.x, y: s.y, c: s.c, s: s.s } });
      }
    }
    /* Publish the complete successor before releasing the predecessor. A
       failed fine-window bake therefore leaves the last valid stars live. */
    const insertionIndex = previousLayer
      ? world.getChildIndex(previousLayer)
      : (bhDisc ? world.getChildIndex(bhDisc) : world.children.length);
    world.addChildAt(nextLayer, insertionIndex);
  } catch (error) {
    nextLayer.destroy({ children: true, context: true });
    try { nextScope.dispose(); }
    catch (releaseError) {
      throw new AggregateError([error, releaseError], 'fine scene build and cleanup failed');
    }
    throw error;
  }
  fineLayer = nextLayer;
  fineTextureScope = nextScope;
  fineStarTargets = nextTargets;
  fineWin = win;
  retireFineTextureOwner(previousLayer, previousScope);
  releaseRetiredFineTextureOwners();
  pixiManagedResourceOwner.compact();
}

function updateZoomDependent(): void {
  updateSurfacePlanetTextureDemand();
  /* runs on zoom-bucket change: star sizes track baseR (screen-constant
     until deep zoom, exactly the Renderer's curve), Sol/label gates, BH gate */
  const zb = zBucket();
  if (zb === lastZBucket) return;
  lastZBucket = zb;
  if (nav.mode === 'universe') { applyUniverseGates(); updateUniverseCtx(); }
  if (nav.mode === 'galaxy') {
    const bR = baseR();
    for (const st of galStars) { const D = st.star.s * bR * 8; st.spr.width = D; st.spr.height = D; }
    updateFineLayer(true);   /* fine sizes track baseR via the rebuild */
    if (solMark) solMark.visible = cam.z > minWH() / 900;
    if (bhDisc) bhDisc.visible = cam.z > minWH() / 700;
  }
  if (nav.mode === 'system') { rebuildSystemHD(); updateStarSurf(); }
}

function currentSurfacePlanetTextureIdentity(): SurfacePlanetTextureIdentity | null {
  if (nav.mode !== 'surface') return null;
  return {
    generation: surfacePlanetTextureGeneration,
    planetSeed: nav.planet.seed,
    planetOrdinal: nav.planet.ordinal,
  };
}

function updateSurfacePlanetTextureDemand(): void {
  const owner = surfacePlanetTextureOwner;
  if (!owner || nav.mode !== 'surface') return;
  owner.requestDemand(displayedPlanetTextureDemandPx(
    SURFACE_PLANET_DIAMETER_CSS_PX,
    camT.z,
    DPR,
  ));
}
function updateStarSurf(): void {
  /* universe-crispness (main.js 5127): a CLOSE star shows its boiling
     surface inside the corona — far views keep the pure gradient */
  if (!sysStar) return;
  const want = sysStar.starR * 2 * camT.z * DPR > 90;
  if (want && !starSurfSpr) {
    const lease = sceneTextureLease(
      _starSurf(sysStar.seed, sysStar.col, sysStar.kind),
      'star-surface',
    );
    starSurfTextureLease = lease;
    starSurfSpr = new Sprite(lease.texture);
    starSurfSpr.anchor.set(0.5);
    starSurfSpr.width = sysStar.starR * 2; starSurfSpr.height = sysStar.starR * 2;
    starSurfSpr.eventMode = 'none';
    world.addChildAt(starSurfSpr, 1);   /* over the corona, under everything else */
  } else if (!want && starSurfSpr) {
    world.removeChild(starSurfSpr); starSurfSpr.destroy(); starSurfSpr = null;
    starSurfTextureLease?.release();
    starSurfTextureLease = null;
    pixiManagedResourceOwner.compact();
  }
}

function drawSystem(state: Extract<NavState, { mode: 'system' }>): void {
  const starSeed = state.star.seed;
  clearWorld();
  const sys = systemScene(starSeed);
  const raw = systemFor(starSeed) as Record<string, unknown> & {
    binary?: { sep: number; r2: number; col2: string } | null;
    dwarfs?: Array<{ name?: string; orb: number; seed?: number }>;
  };
  /* the primary — each kind wearing its Renderer face (main.js ~5085) */
  if (sys.kind === 'BH') {
    const b = new Sprite(sceneTexture(_bhSpr()));
    b.anchor.set(0.5); b.width = 110; b.height = 110; b.eventMode = 'none';
    world.addChild(b);
  } else if (sys.kind === 'NS' || sys.kind === 'MAG') {
    /* rotating beams + white-hot core (MAG's field-line ellipses: recorded gap) */
    const beams = new Container(); beams.eventMode = 'none';
    for (const rot of [0, Math.PI]) {
      const bm = new Sprite(sceneTexture(_beamSpr()));
      bm.anchor.set(0, 0.5); bm.width = 90; bm.height = 9; bm.rotation = rot;
      beams.addChild(bm);
    }
    world.addChild(beams);
    orbiters.push({ c: beams, kind: 'beam', orb: 0 });
    const core = new Sprite(sceneTexture(_nsCoreSpr()));
    core.anchor.set(0.5); core.width = 18; core.height = 18; core.eventMode = 'none';
    world.addChild(core);
  } else {
    /* corona gradient, verbatim stops; PROTO keeps this fallback (recorded) */
    const col = sys.starCol || '#ffe9c4';
    const srad = Math.max(sys.starR, 8);
    const corona = new Sprite(sceneTexture(coronaSpr(col)));
    corona.anchor.set(0.5);
    corona.width = srad * 4.8; corona.height = srad * 4.8;   /* r = starR*2.4 */
    corona.eventMode = 'none';
    world.addChild(corona);
    sysStar = { seed: starSeed, col, kind: sys.kind, starR: srad };   /* _starSurf close-up gate */
    if (raw.binary) {
      const b2 = new Sprite(sceneTexture(coronaSpr(raw.binary.col2 || col)));
      b2.anchor.set(0.5);
      b2.width = raw.binary.r2 * 4.8; b2.height = raw.binary.r2 * 4.8;
      b2.eventMode = 'none';
      world.addChild(b2);
      orbiters.push({ c: b2, kind: 'rock', orb: raw.binary.sep, sp: 0.25, a0: 0, mul: 1 });
    }
  }
  /* asteroid belt + kuiper ring — real rock lumps (main.js ~5160) */
  for (const [beltKey, kindKey, szMul, spMul] of [['belt', 'rock', 2.6, 1], ['kuiper', 'ice', 2.4, 0.4]] as Array<[string, 'rock' | 'ice', number, number]>) {
    const belt = (sys as unknown as Record<string, unknown>)[beltKey] as { r: number; rocks: Array<{ a: number; rr: number; s: number; sp: number }> } | null;
    if (!belt) continue;
    const set = _rockSet(kindKey);
    for (const b of belt.rocks) {
      const spr = new Sprite(sceneTexture(set[((b.a * 997) | 0) & 7]!));
      spr.anchor.set(0.5);
      const sz = b.s * szMul;
      spr.width = sz; spr.height = sz;
      spr.rotation = b.a * 13;
      spr.eventMode = 'none';
      world.addChild(spr);
      orbiters.push({ c: spr, kind: 'rock', orb: b.rr, sp: b.sp * spMul, a0: b.a, mul: 1 });
    }
  }
  /* STAR CHARTS layer (chartsOn-gated, main.js 5072/5106): orbit rings, the
     habitable zone, the belt caption — the game's overlay, one toggle */
  chartLayer = new Container();
  chartLayer.eventMode = 'none';
  chartLayer.visible = save.chartsOn;
  world.addChild(chartLayer);
  const hz = sys.hz as [number, number] | null;
  if (hz) {
    const band = new Graphics().circle(0, 0, hz[1]).fill({ color: 0x50d282, alpha: 0.055 }).circle(0, 0, hz[0]).cut();
    chartLayer.addChild(band);
    const hzl = createSceneText('habitable zone', SCENE_TEXT_STYLES.habitableZone);
    hzl.anchor.set(0.5);
    hzl.position.set(0, -(hz[0] + hz[1]) / 2);
    chartLayer.addChild(hzl);
    screenScaled.push({ obj: hzl, f: 1 });
  }
  const beltR = (sys.belt as { r?: number } | null)?.r;
  if (beltR) {
    const bl = createSceneText('asteroid belt', SCENE_TEXT_STYLES.asteroidBelt);
    bl.anchor.set(0.5, 1);
    bl.position.set(0, -beltR - 2);
    chartLayer.addChild(bl);
    screenScaled.push({ obj: bl, f: 1 });
  }
  /* orbits & planets — Renderer angles/sizes: ang = orb·0.13 + t·0.05/(orb·0.012),
     pr = 6·sizeMul, sprite rotated so its baked light faces the star */
  for (const p of sys.planets) {
    chartLayer.addChild(new Graphics().circle(0, 0, p.orb).stroke({ width: 0.5, color: 0x2a3a55 }));
    const pr = 6 * ((p.P.sizeMul as number) || 1);
    const holder = new Container();
    const rg = ringGeom(p);
    if (p.ring && rg) {
      const back = ringHalf(p, rg, true);
      if (back) holder.addChild(back);
    }
    const planetTextureLease = sceneTextureLease(
      getPlanetSprite(p.P, Math.max(64, pr * 2 * camT.z * DPR)),
      'planet-texture',
    );
    const spr = new Sprite(planetTextureLease.texture);
    spr.anchor.set(0.5);
    spr.width = pr * 2; spr.height = pr * 2;
    holder.addChild(spr);
    /* day/night terminator, rotated toward the star each tick */
    const term = new Sprite(sceneTexture(terminatorSpr(sys.starCol || '#ffe9c4')));
    term.anchor.set(0.5);
    term.width = pr * 3; term.height = pr * 3;
    holder.addChild(term);
    if (p.ring && rg) {
      const front = ringHalf(p, rg, false);
      if (front) holder.addChild(front);
    }
    holder.eventMode = 'static';
    holder.cursor = 'pointer';
    holder.on('pointertap', () => surveyPlanet(p, state.star));   /* survey; LAND is the card's own act */
    world.addChild(holder);
    const ent: Orbiter = {
      c: holder, kind: 'planet', orb: p.orb, face: [spr, term], planetTextureLease,
    };
    /* the drifting upper cloud deck (main.js 5256): terran/ocean close-ups
       only, motion-gated, twin-sprite wrap so the edge never seams */
    if (p.P.type === 'terran' || p.P.type === 'ocean') {
      const cw = new Container();
      cw.eventMode = 'none';
      const ctex = sceneTexture(_cloudSpr(p.P), 'surface-cloud');
      const mkc = (): Sprite => { const s = new Sprite(ctex); s.anchor.set(0, 0.5); s.width = pr * 2; s.height = pr * 2; s.alpha = 0.45; cw.addChild(s); return s; };
      const ca = mkc(), cb = mkc();
      const cm = new Graphics().circle(0, 0, pr).fill(0xffffff);
      cw.addChild(cm); cw.mask = cm;
      cw.visible = false;
      holder.addChildAt(cw, holder.getChildIndex(term));   /* clouds UNDER the terminator (Renderer order — night shades them) */
      ent.cloud = { wrap: cw, a: ca, b: cb, pr };
    }
    orbiters.push(ent);
    planetTargets.push({ holder, planet: p });
    /* moons — typed lit spheres on Kepler-ish drifts (main.js ~5290) */
    const solM = (SOL_MOONS as Record<string, Array<{ t: number }>>)[String(p.P.seed)] || [];
    for (let m = 0; m < p.moons; m++) {
      const mr2 = mulberry32(hashInt(p.P.seed as number, m * 17 + 5, 91));
      const mt = solM[m] ? solM[m]!.t : Math.floor(mr2() * 4);
      const mrad = Math.max(0.5, pr * 0.108);
      const moonC = new Container();
      moonC.eventMode = 'none';
      const ms = new Sprite(sceneTexture(_moonSpr(mt | 0, mrad * 2.18 * camT.z * DPR > 34)));
      ms.anchor.set(0.5);
      ms.width = mrad * 2.18; ms.height = mrad * 2.18;
      moonC.addChild(ms);
      /* the moon's dark side turns away from the star (main.js 5313) */
      const mterm = new Sprite(sceneTexture(moonTermSpr()));
      mterm.anchor.set(0.5);
      mterm.width = mrad * 2; mterm.height = mrad * 2;
      moonC.addChild(mterm);
      holder.addChild(moonC);
      orbiters.push({ c: moonC, kind: 'moon', orb: 1.7 + m * 0.48, sp: 0.55, a0: m * 2.4, mul: pr, pOrb: p.orb, face: [mterm] });
    }
    const label = createSceneText(p.name, SCENE_TEXT_STYLES.planet);
    label.anchor.set(0.5, 0);
    label.eventMode = 'none';
    world.addChild(label);
    screenScaled.push({ obj: label, f: 1 });
    sysLabels.push({ t: label, getPos: (time) => { const a = planetAng(p.orb, time); return { x: Math.cos(a) * p.orb, y: Math.sin(a) * p.orb + pr }; } });
  }
  /* dwarf planets (main.js ~5335) */
  if (raw.dwarfs) for (const dw of raw.dwarfs) {
    const ds = 2.2;
    const spr = new Sprite(sceneTexture(_dwarfSpr((dw.orb | 0) % 3)));
    spr.anchor.set(0.5); spr.width = ds * 2.2; spr.height = ds * 2.2; spr.eventMode = 'none';
    world.addChild(spr);
    orbiters.push({ c: spr, kind: 'dwarf', orb: dw.orb });
  }
  /* comets on stretched orbits, tails blown away from the star (main.js 5375) */
  const comets = (raw as { comets?: Array<{ off: number; period: number; aMaj: number; ecc: number; tilt: number }> }).comets;
  if (comets) for (let ci = 0; ci < comets.length; ci++) {
    const cm = comets[ci]!;
    const tail = new Sprite(sceneTexture(cometTailSpr()));
    tail.anchor.set(0, 0.5);
    tail.eventMode = 'none';
    world.addChild(tail);
    const coma = new Sprite(sceneTexture(_comaSpr()));
    coma.anchor.set(0.5);
    coma.eventMode = 'none';
    world.addChild(coma);
    const label = createSceneText(
      'Comet ' + properName(hashInt(starSeed, 31 + ci, 17), 2),
      SCENE_TEXT_STYLES.comet,
    );
    label.anchor.set(0.5, 1);
    label.eventMode = 'none';
    world.addChild(label);
    screenScaled.push({ obj: label, f: 1 });
    sysComets.push({ coma, tail, label, cm });
  }
  /* a hyperbolic interstellar visitor streaking through (main.js 5357) */
  const v = (raw as { visitor?: { speed: number; off: number; ang: number; b: number } }).visitor;
  if (v) {
    const wrap = new Container();
    wrap.rotation = v.ang;
    wrap.eventMode = 'none';
    const trail = new Sprite(sceneTexture(_vtrailSpr()));
    trail.anchor.set(11 / 15, 0.5);
    trail.width = 15; trail.height = 1.6;
    wrap.addChild(trail);
    const body = new Sprite(sceneTexture(_visitorSpr()));
    body.anchor.set(0.5);
    body.width = 10; body.height = 3.8;
    wrap.addChild(body);
    world.addChild(wrap);
    const label = createSceneText('interstellar object', SCENE_TEXT_STYLES.visitor);
    label.anchor.set(0.5, 1);
    label.eventMode = 'none';
    world.addChild(label);
    screenScaled.push({ obj: label, f: 1 });
    visitorFx = { wrap, body, label, v };
  }
  lastZBucket = zBucket();
  if (abortRenderBeforeReceiptForSmoke()) return;
  recordRenderedScene(state);
  scheduleSystemPlanetTextureRefresh();
}
const planetAng = (orb: number, time: number): number => orb * 0.13 + time * 0.05 / (orb * 0.012);
interface RingGeo { tilt: number; hue: string; }
const _rgCache = new Map<number, RingGeo>();
function ringGeom(p: PlanetNode): RingGeo | null {
  /* seeded tilt + type hue (main.js 5219) — cached in a side map, never on P */
  if (!p.ring) return null;
  const seed = p.P.seed as number;
  let rg = _rgCache.get(seed);
  if (!rg) {
    const rr9 = mulberry32((seed ^ 0x1276) >>> 0);
    rg = {
      tilt: 0.30 + rr9() * 0.34,
      hue: (p.P.type === 'ice' || (p.P.type === 'gas' && rr9() < 0.4)) ? '188,212,232' : '224,206,166',
    };
    _rgCache.set(seed, rg);
    peakRingGeometryEntries = Math.max(peakRingGeometryEntries, _rgCache.size);
  }
  return rg;
}
function ringHalf(p: PlanetNode, rg: RingGeo, back: boolean): Container | null {
  /* the baked banded ring sprite, split back/front around the globe like the
     Renderer's clip rects (main.js 5228/5283); back half dimmed to 0.8 */
  const pr = 6 * ((p.P.sizeMul as number) || 1);
  const wrap = new Container();
  wrap.rotation = 0.45;
  wrap.scale.set(1, rg.tilt);
  const spr = new Sprite(sceneTexture(
    _ringSprite(p.P.seed as number, rg.hue),
    'ring-texture',
  ));
  spr.anchor.set(0.5);
  spr.width = pr * 4.2; spr.height = pr * 4.2;
  if (back) spr.alpha = 0.8;
  const mask = new Graphics().rect(-pr * 2.2, back ? -pr * 2.2 : 0, pr * 4.4, pr * 2.2).fill(0xffffff);
  wrap.addChild(spr); wrap.addChild(mask);
  spr.mask = mask;
  wrap.eventMode = 'none';
  return wrap;
}
function scheduleSystemPlanetTextureRefresh(): void {
  if (systemPlanetTextureRefreshTimer !== null) clearTimeout(systemPlanetTextureRefreshTimer);
  if (nav.mode !== 'system' || !nav.star) {
    systemPlanetTextureRefreshTimer = null;
    return;
  }
  const generation = sceneTextureGeneration;
  const starSeed = nav.star.seed;
  systemPlanetTextureRefreshTimer = setTimeout(() => {
    systemPlanetTextureRefreshTimer = null;
    if (nav.mode !== 'system' || nav.star.seed !== starSeed
      || sceneTextureGeneration !== generation) return;
    rebuildSystemHD(false);
  }, SURFACE_PLANET_TEXTURE_REFRESH_MS);
}
function rebuildSystemHD(scheduleRefresh = true): void {
  /* the focused world earns the HD master as you close in (main.js 5215) */
  if (nav.mode !== 'system' || !nav.star) return;
  const sys = systemScene(nav.star.seed);
  let releasedPredecessor = false;
  for (const o of orbiters) {
    if (o.kind !== 'planet' || !o.face || !o.planetTextureLease) continue;
    const p = sys.planets.find((q) => Math.abs(q.orb - o.orb) < 1e-9);
    if (!p) continue;
    const pr = 6 * ((p.P.sizeMul as number) || 1);
    const successor = sceneTextureLease(
      getPlanetSprite(p.P, Math.max(64, pr * 2 * camT.z * DPR)),
      'planet-texture',
    );
    const predecessor = o.planetTextureLease;
    if (successor.texture === predecessor.texture) {
      successor.release();
    } else {
      o.face[0]!.texture = successor.texture;
      o.planetTextureLease = successor;
      predecessor.release();
      releasedPredecessor = true;
    }
  }
  if (releasedPredecessor) pixiManagedResourceOwner.compact();
  if (scheduleRefresh) scheduleSystemPlanetTextureRefresh();
}

function buildCurrentSceneTransaction(
  preparedSurfaceRoster: CanonicalWorldRoster | null = null,
): void {
  try {
    if (nav.mode === 'universe') drawUniverse();
    else if (nav.mode === 'galaxy') drawGalaxy(nav);
    else if (nav.mode === 'system') drawSystem(nav);
    else if (nav.mode === 'surface' && nav.star && nav.planet) {
      const exact = planetNodeForProof(nav.star, nav.planet);
      if (exact) drawSurface(exact, nav, preparedSurfaceRoster); else {
        nav = NAV_HOME;
        document.body.classList.remove('surface-mode');
        clearPlanetside();
        document.documentElement.style.removeProperty('--planetside-top');
        drawUniverse();
      }   /* a stale seed never bricks boot */
    }
  } catch (sceneBuildError) {
    /* A failed painter/acquisition must not strand a partial scene or its
       leases. The prior receipt deliberately remains mismatched to `nav`, so
       no browser gate can mistake this empty rollback for a rendered scene. */
    try { clearWorld(); }
    catch (releaseError) {
      throw new AggregateError(
        [sceneBuildError, releaseError],
        'scene build and ownership rollback both failed',
      );
    }
    throw sceneBuildError;
  }
}

/* ---- navigation (every transition through the tested state machine) ---- */
function rerender(options: { preserveSurvey?: boolean; skipPersist?: boolean } = {}): void {
  tameGreetingAudioOwner?.syncRoute(currentTameGreetingRouteKey());
  /* A density-only rebuild replaces Pixi textures, not the player's selected
     object. Navigation transitions invalidate the card as before; monitor/
     DPR changes preserve its exact DOM, full-identity context, and action. */
  if (!options.preserveSurvey) {
    invalidateSurveyTravel();
    hideSurvey();
  }
  document.body.classList.toggle('surface-mode', nav.mode === 'surface');
  if (nav.mode !== 'surface') {
    clearPlanetside();
    document.documentElement.style.removeProperty('--planetside-top');
  }
  buildCurrentSceneTransaction();
  world.alpha = 0.25;   /* the mode fade (st.fade), eased back in the ticker */
  hudText();
  if (!options.skipPersist) void persistView();
}
/* descents EASE in: cam jumps wide, camT is the destination (the goTo feel) */
function descendGalaxy(g: { seed: number; x: number; y: number }): boolean {
  if (blockRouteChangeWhileProductAction()) return false;
  const proven = resolveCF1Galaxy(g);
  if (!proven.ok) return false;
  const galaxy = proven.galaxy;
  const r = enterGalaxy(nav, galaxy);
  if (!r.ok) return false;
  /* The saved Prime Signature radius gates intergalactic reach. It is not a
     drive/Charter gate, so preserve that distinction in the visible boundary. */
  if (searchTravel.navigationAuthorityFailure(r.state) === 'prime-reach') {
    camT.z = Math.min(camT.z, (0.55 * minWH() / Math.max(galaxy.size, 8)) * 0.97);
    toastPrimeReachBoundary();
    return false;
  }
  nav = r.state;
  savedRouteWriteHeld = false;
  gz0 = 0.42 * minWH() / GR;
  cam.x = 0; cam.y = 0; camT.x = 0; camT.y = 0;
  camT.z = gz0 * 1.05; cam.z = gz0 * 0.35;
  playWhoosh();   /* travel & planetfall breathe (main.js: the shipped sting) */
  rerender();
  return true;
}
function descendSystem(starCandidate: { seed: number; x: number; y: number }): boolean {
  if (blockRouteChangeWhileProductAction()) return false;
  if (nav.mode !== 'galaxy') return false;
  const proven = resolveCF1Star(nav.gal, starCandidate);
  if (!proven.ok) return false;
  const star = proven.star;
  const r = enterSystem(nav, star);
  if (!r.ok) return false;
  /* the Ascent gates star dives (main.js 3450): stage 0 = Sol only,
     1 = the Neighborhood ring, 2 = the whole home galaxy, 3 = everywhere.
     LOOKING stays free — only the dive is charted. */
  const authorityFailure = searchTravel.navigationAuthorityFailure(r.state);
  if (authorityFailure === 'prime-reach') {
    toastPrimeReachBoundary();
    return false;
  }
  if (authorityFailure === 'charter-reach') {
    const starZ = minWH() / 34;
    camT.z = Math.min(camT.z, starZ * 0.97);   /* park BELOW the dive trigger (the game's *0.97 precedent) */
    cam.z = Math.min(cam.z, starZ * 0.97);
    toastCharterBoundary(ascHintFor(ascStage()));
    return false;
  }
  nav = r.state;
  savedRouteWriteHeld = false;
  sz0 = 0.40 * minWH() / SYS_R;
  cam.x = 0; cam.y = 0; camT.x = 0; camT.y = 0;
  camT.z = sz0 * 1.05; cam.z = sz0 * 0.35;
  playWhoosh();
  rerender();
  return true;
}
/* THE GAME'S TRUE TWO-STEP (find-earth/land training steps depend on it):
   a tap SURVEYS — the card opens with its ACTION ROW (Land · + Add to Star
   Atlas · ⧉ share code); pressing LAND is its own act. */
function planetNodeForProof(star: ProvenStar, planet: ProvenPlanet): PlanetNode | null {
  if (!isProvenPlanetFor(planet, star)) return null;
  return systemScene(star.seed).planets.find((node) =>
    node.seed === planet.seed && node.ordinal === planet.ordinal) ?? null;
}
function orbitalMineralSurveyRows(
  star: ProvenStar,
  planet: ProvenPlanet,
): readonly SurveyPresentationRow[] {
  if (nav.mode !== 'system' || arc3EngineeringState === null || arc3EngineeringProtection !== null
    || getProvenStarKey(nav.star) !== getProvenStarKey(star)) {
    return EMPTY_SURVEY_PRESENTATION_ROWS;
  }
  const address = resolveCF1WorldAddress({
    galaxy: { seed: nav.gal.seed, x: nav.gal.x, y: nav.gal.y },
    star: { seed: star.seed, x: star.x, y: star.y },
    planet: { seed: planet.seed },
  });
  if (!address.ok
    || getProvenGalaxyKey(address.address.galaxy) !== getProvenGalaxyKey(nav.gal)
    || getProvenStarKey(address.address.star) !== getProvenStarKey(star)
    || getProvenPlanetKey(address.address.planet) !== getProvenPlanetKey(planet)) {
    return EMPTY_SURVEY_PRESENTATION_ROWS;
  }
  const row = projectOrbitalMineralSurveyRow({
    engineering: arc3EngineeringState,
    nav,
    address: address.address,
  });
  return row === null
    ? EMPTY_SURVEY_PRESENTATION_ROWS
    : Object.freeze([Object.freeze([row.key, row.value] as const)]);
}
function presentPlanetSurvey(
  p: PlanetNode,
  star: ProvenStar,
  supplied?: ProvenPlanet,
  preparedCaptureRoster: CanonicalWorldRoster | null = null,
): boolean {
  if ((nav.mode !== 'system' && nav.mode !== 'surface')
    || getProvenStarKey(nav.star) !== getProvenStarKey(star)) return false;
  const resolved = supplied
    ? (isProvenPlanetFor(supplied, star) ? { ok: true as const, planet: supplied } : { ok: false as const })
    : resolveCF1World(star, { seed: p.seed });
  if (!resolved.ok || resolved.planet.seed !== p.seed || resolved.planet.ordinal !== p.ordinal
    || !planetNodeForProof(star, resolved.planet)) return false;
  const sys = systemFor(star.seed);
  const d = planetDescriptor(p.P, sys, { name: p.name, orb: p.orb } as never) as Descriptor;
  const customName = customNames.get('p' + p.seed);
  if (customName) {
    d.title = customName;
    d.sub = (d.sub ? d.sub + ' · ' : '') + 'custom name';
  }
  cardCtx = {
    p,
    gal: nav.gal,
    star: nav.star,
    planet: resolved.planet,
  };
  showSurvey(
    d,
    buildCardActions(p),
    null,
    orbitalMineralSurveyRows(star, resolved.planet),
    preparedCaptureRoster,
  );
  return true;
}
function surveyPlanet(p: PlanetNode, star: ProvenStar, supplied?: ProvenPlanet): boolean {
  if (!presentPlanetSurvey(p, star, supplied)) return false;
  playSurveyPing();   /* the ACT of surveying answers back (main.js) */
  gameEvent('survey', { planetSeed: p.seed });
  return true;
}
function buildCardActions(p: PlanetNode): string {
  const charted = save && save.logMap.some(([id]) => id === 'p' + p.seed);
  const onThisSurface = nav.mode === 'surface' && !!cardCtx
    && getProvenPlanetKey(nav.planet) === getProvenPlanetKey(cardCtx.planet)
    && nav.planet.seed === p.seed && nav.planet.ordinal === p.ordinal;
  /* A veteran replay already has Earth charted. Keep the real Add action in
     the drill so the atlas-add step cannot spotlight a missing control;
     addToAtlas is idempotent and still emits the training event. */
  const trainingAdd = p.seed === 133 && trainingActive();
  return '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0 4px">' +
    (onThisSurface
      ? '<button data-act="leaveworld" style="background:rgba(202,162,79,0.14);color:#ffd9a0;border:1px solid #caa24f;border-radius:999px;padding:8px 16px;cursor:pointer;min-height:44px;font:12px system-ui">⬆ Leave world</button>'
      : '<button data-act="landcta" style="background:rgba(202,162,79,0.14);color:#ffd9a0;border:1px solid #caa24f;border-radius:999px;padding:8px 16px;cursor:pointer;min-height:44px;font:12px system-ui">⛳ Land</button>') +
    (charted && !trainingAdd
      ? '<span style="color:var(--dim);align-self:center;font-size:12px">★ charted</span>'
      : '<button data-act="add" style="background:#14233c;color:#cfe0f4;border:1px solid #2a3c5e;border-radius:9px;padding:8px 14px;cursor:pointer;min-height:44px;font:12px system-ui">' +
        (charted ? '★ Confirm in Star Atlas' : '+ Add to Star Atlas') + '</button>') +
    '<button data-act="share" style="background:#14233c;color:#cfe0f4;border:1px solid #2a3c5e;border-radius:9px;padding:8px 14px;cursor:pointer;min-height:44px;font:12px system-ui">⧉ share code</button>' +
    '</div>';
}
function refreshPlanetSurveyCard(): boolean {
  const context = cardCtx;
  if (context === null || lastCard === null || card.style.display === 'none') return false;
  showSurvey(
    lastCard,
    buildCardActions(context.p),
    null,
    orbitalMineralSurveyRows(context.star, context.planet),
  );
  return true;
}
function surveyAndLand(p: PlanetNode, star: ProvenStar): boolean {
  /* the api's one-call path (smoke compatibility): survey, then land */
  return surveyPlanet(p, star) && doLand();
}
function activeCardPlanetState(): Extract<NavState, { mode: 'surface' }> | null {
  if (!cardCtx || (nav.mode !== 'system' && nav.mode !== 'surface')
    || getProvenGalaxyKey(nav.gal) !== getProvenGalaxyKey(cardCtx.gal)
    || getProvenStarKey(nav.star) !== getProvenStarKey(cardCtx.star)
    || !isProvenPlanetFor(cardCtx.planet, nav.star)
    || !planetNodeForProof(nav.star, cardCtx.planet)) return null;
  if (nav.mode === 'surface') {
    return getProvenPlanetKey(nav.planet) === getProvenPlanetKey(cardCtx.planet) ? nav : null;
  }
  const landed = land(nav, cardCtx.planet);
  return landed.ok ? landed.state : null;
}
function activeCardPlanetWhere(): Record<string, unknown> | null {
  const state = activeCardPlanetState();
  return state ? navToView(state) : null;
}
function cardShareCode(): string | null {
  const where = activeCardPlanetWhere();
  /* A stale planet card must never silently encode the current system. The
     visible card and copied address are one atomic context. */
  return where ? encodeWhere(where as never, customNames.get('p' + cardCtx!.p.seed)) as string : null;
}
async function copyShareCode(code: string): Promise<boolean> {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
    await navigator.clipboard.writeText(code);
    toast('⧉ Share code copied', 'Paste it into any explorer’s search bar to guide them here.', true);
    return true;
  } catch {
    /* Never claim a copy that the browser denied. Put the exact code in a
       familiar editable surface and select it so keyboard/touch assistive
       copy remains one honest action away. */
    searchTravel.selectForManualCopy(code);
    toast('Copy unavailable', 'The share code is selected in Search. Use your browser’s Copy command.', true);
    return false;
  }
}
function doLand(): boolean {
  if (blockPlayerMutation('land')) return false;
  if (!cardCtx || nav.mode !== 'system') return false;
  const surface = activeCardPlanetState();
  if (!surface) return false;
  const p = cardCtx.p;
  nav = surface;
  savedRouteWriteHeld = false;
    const firstLand = !save.landed.includes(p.seed);
    if (firstLand) {
      save.landed.push(p.seed);   /* the game's `land` set */
      /* Credit banks forward only for a genuinely new landing. */
      bankLandfall(save.ascCh, save.ascProg, p.seed);
    }
    /* Reconcile separately from banking: an imported reach-backed chapter may
       already be complete even when this landing adds no new credit. The pure
       helper advances every consecutive canonical completion without making a
       repeated landfall into another reward. */
    const reconciliation = reconcileV2Chapters(save.ascCh, save.ascProg, ascStage());
    if (reconciliation && reconciliation.nextChapter !== save.ascCh) {
      const completed = reconciliation.completed;
      const first = completed[0];
      const last = completed[completed.length - 1];
      save.ascCh = reconciliation.nextChapter;
      toastCharterCompletion(completed.length === 1
        ? '★ ' + (first?.name || 'Charter chapter') + ' — complete'
        : `★ ${completed.length} Charter chapters — complete`,
        completed.length === 1
          ? (first?.note || 'This expedition’s established reach remains preserved.')
          : `${first?.name || 'The first chapter'} through ${last?.name || 'the final chapter'} are now recorded. This expedition’s established reach remains preserved.`);
    }
    /* Panels and Survey deliberately coexist outside Training. If Charters is
       already open, its rendered record must move with the saved ledger. */
    if (openPanelId() === 'ch') fillCharters();
    playWhoosh();   /* planetfall */
    buildCurrentSceneTransaction(); hudText(); void persistView();
    refreshPlanetSurveyCard();
    /* A repeated landing is not new progression. The one exception is the
       explicit veteran training replay: its lesson waits for the action,
       but still receives no second landfall credit. */
    if (firstLand || (p.seed === 133 && trainingActive() && trainingStepId() === 'land')) {
      gameEvent('landfall', { planetSeed: p.seed });
    }
    return true;
}
function addToAtlas(): void {
  if (blockPlayerMutation('atlas-add')) return;
  const where = activeCardPlanetWhere();
  if (!cardCtx || !save || !where) return;
  const p = cardCtx.p;
  const id = 'p' + p.seed;
  if (!save.logMap.some(([k]) => k === id)) {
    const d = card.querySelector('[data-sel=title]')?.textContent || p.name;
    const sub = card.querySelector('[data-sel=sub]')?.textContent || '';
    const entry = { id, title: d, sub, where, t: Date.now() };
    save.logMap.push([id, entry]);
    const route = activeCardPlanetState();
    if (route) atlasRouteStates.set(entry, route);
    void persistView();
    toast('★ Charted', d + ' joined your Star Atlas.');
  }
  gameEvent('atlas-add', { id });
  refreshPlanetSurveyCard();   /* refresh: the button becomes ★ charted */
}
card.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('[data-survey-close]')) {
    hideSurvey(true);
    return;
  }
  const act = (e.target as HTMLElement).closest('[data-act]');
  if (!act) return;
  const keyboard = document.activeElement === act;
  const a = (act as HTMLElement).dataset.act;
  if (a === 'travel') {
    const action = cardTravelAction;
    if (!action || card.style.display === 'none') return;
    cardTravelAction = null;
    (act as HTMLButtonElement).disabled = true;
    action.run();
    if (keyboard) app.canvas.focus();
  } else if (a === 'landcta') {
    doLand();
    if (keyboard) card.querySelector<HTMLElement>('[data-act="leaveworld"]')?.focus();
  }
  else if (a === 'leaveworld') {
    if (nav.mode !== 'surface' || !cardCtx
      || getProvenPlanetKey(nav.planet) !== getProvenPlanetKey(cardCtx.planet)
      || !activeCardPlanetWhere()) return;
    if (blockRouteChangeWhileProductAction()) return;
    hideSurvey();
    goUp();
    if (keyboard) app.canvas.focus();
  }
  else if (a === 'add') {
    addToAtlas();
    if (keyboard) (card.querySelector<HTMLElement>('[data-act="add"]') || surveyDockEl).focus();
  }
  else if (a === 'share') {
    const code = cardShareCode();
    if (code) void copyShareCode(code);
  }
});
const sideEl = document.createElement('div');
sideEl.id = 'planetside';
sideEl.className = 'glass';
sideEl.style.cssText = 'position:fixed;left:calc(var(--safe-left,0px) + 12px);bottom:calc(var(--safe-bottom,0px) + var(--dock-h) + var(--ctx-h) + 86px);' +
  'max-width:min(560px,calc(100vw - var(--safe-left,0px) - var(--safe-right,0px) - 24px));box-sizing:border-box;display:none;z-index:21;border-radius:12px;padding:8px 10px;' +
  'overflow-x:auto;white-space:nowrap;scrollbar-width:thin';
document.body.appendChild(sideEl);
let planetsideGeneration = 0;
let planetsideWorldKey: string | null = null;
const planetsideBindings = new SpeciesThumbLeaseGroup(8);
let planetsideStaleCompletionDrops = 0;
function releasePlanetsideThumbs(): void {
  planetsideBindings.clear();
}
function clearPlanetside(): void {
  planetsideGeneration++;
  releasePlanetsideThumbs();
  planetsideWorldKey = null;
  delete sideEl.dataset.rosterState;
  delete sideEl.dataset.previewCount;
  delete sideEl.dataset.fullRosterCount;
  delete sideEl.dataset.fullRosterFingerprint;
  delete sideEl.dataset.ecologyEpoch;
  sideEl.replaceChildren();
  sideEl.style.display = 'none';
  document.documentElement.style.removeProperty('--planetside-top');
}
function showPlanetsideRosterFailure(reason: string): void {
  planetsideGeneration++;
  releasePlanetsideThumbs();
  planetsideWorldKey = null;
  sideEl.dataset.rosterState = 'authority-error';
  delete sideEl.dataset.previewCount;
  delete sideEl.dataset.fullRosterCount;
  delete sideEl.dataset.fullRosterFingerprint;
  delete sideEl.dataset.ecologyEpoch;
  const heading = document.createElement('div');
  heading.className = 'planetside-heading';
  heading.textContent = 'PLANETSIDE — Biosphere unavailable';
  const detail = document.createElement('div');
  detail.textContent = 'Ecology records could not be source-verified.';
  detail.dataset.rosterError = reason;
  sideEl.replaceChildren(heading, detail);
  sideEl.style.display = 'block';
  syncPlanetsideLayout();
}
function syncPlanetsideLayout(): void {
  if (getComputedStyle(sideEl).display === 'none' || nav.mode !== 'surface') {
    document.documentElement.style.removeProperty('--planetside-top');
    syncSurfaceChromeBottom();
    return;
  }
  const r = sideEl.getBoundingClientRect();
  if (r.width > 0 && r.height > 0) document.documentElement.style.setProperty('--planetside-top', r.top.toFixed(2) + 'px');
  syncSurfaceChromeBottom();
}
new ResizeObserver(syncPlanetsideLayout).observe(sideEl);
addEventListener('resize', syncPlanetsideLayout, { passive: true });
/* CSS can hide Planetside while Training owns the same screen. A hidden
   surface owns no thumbnail resources; when that class clears, rebuild the
   still-current proven world rather than leaving released placeholders. */
new MutationObserver(() => {
  if (getComputedStyle(sideEl).display === 'none') {
    if (planetsideBindings.size) releasePlanetsideThumbs();
    return;
  }
  if (nav.mode === 'surface' && nav.star && nav.planet && !planetsideBindings.size) {
    fillPlanetside(nav);
  }
}).observe(document.body, { attributes: true, attributeFilter: ['class'] });
function planetsideMatchesFullRoster(roster: CanonicalWorldRoster): boolean {
  if (roster.view.total === 0) {
    return planetsideWorldKey === null && sideEl.style.display === 'none';
  }
  return sideEl.dataset.rosterState === 'ready'
    && planetsideWorldKey === roster.worldKey
    && sideEl.dataset.previewCount === String(roster.view.preview.length)
    && sideEl.dataset.fullRosterCount === String(roster.view.total)
    && sideEl.dataset.fullRosterFingerprint === roster.fullRosterFingerprint
    && sideEl.dataset.ecologyEpoch === String(roster.ecologyEpoch);
}
function fillPlanetside(
  state: Extract<NavState, { mode: 'surface' }>,
  preparedRoster: CanonicalWorldRoster | null = null,
): void {
  /* THE LIVING PLANETSIDE: MAIN-3's source-verified full ecology roster,
     bounded here—only here—to eight portrait chips. Capture and later world
     owners retain the complete canonical view. */
  let fullRoster = preparedRoster;
  if (fullRoster === null) {
    const addressResult = canonicalCF1WorldAddressFromNav(state);
    if (!addressResult.ok) {
      showPlanetsideRosterFailure(`address:${addressResult.reason}`);
      return;
    }
    const rosterResult = canonicalWorldRoster(addressResult.address, currentEcologyEpoch());
    if (!rosterResult.ok) {
      showPlanetsideRosterFailure(`${rosterResult.reason}:${rosterResult.message}`);
      return;
    }
    fullRoster = rosterResult.roster;
  } else if (fullRoster.worldKey !== getProvenPlanetKey(state.planet)) {
    showPlanetsideRosterFailure('prepared-roster-world-mismatch');
    return;
  }
  const roster = fullRoster.view.preview;
  if (!roster.length) {
    clearPlanetside();
    syncPlanetsideLayout();
    return;
  }
  planetsideGeneration++;
  const generation = planetsideGeneration;
  releasePlanetsideThumbs();
  const worldKey = fullRoster.worldKey;
  planetsideWorldKey = worldKey;
  sideEl.dataset.rosterState = 'ready';
  sideEl.dataset.previewCount = String(roster.length);
  sideEl.dataset.fullRosterCount = String(fullRoster.view.total);
  sideEl.dataset.fullRosterFingerprint = fullRoster.fullRosterFingerprint;
  sideEl.dataset.ecologyEpoch = String(fullRoster.ecologyEpoch);
  const heading = document.createElement('div');
  heading.className = 'planetside-heading';
  heading.textContent = 'PLANETSIDE — Biosphere';
  const fragment = document.createDocumentFragment();
  fragment.append(heading);
  const pending: Array<{
    readonly genome: Record<string, unknown>;
    readonly index: number;
    readonly chip: HTMLSpanElement;
    readonly image: HTMLImageElement;
  }> = [];
  roster.forEach((g, index) => {
    let nm = String((g as { _earthName?: string })._earthName || '');
    if (!nm) { try { nm = String((describeSpecies(g as never) as { name?: string }).name || ''); } catch { nm = 'specimen'; } }
    const chip = document.createElement('span');
    chip.dataset.sel = 'planetside-sp';
    chip.dataset.cid = `${worldKey}:${index}`;
    chip.className = 'planetside-species';
    const image = document.createElement('img');
    image.className = 'planetside-thumb';
    image.alt = '';
    image.width = 132;
    image.height = 132;
    const label = document.createElement('div');
    label.textContent = nm;
    chip.append(image, label);
    fragment.append(chip);
    pending.push({ genome: g as Record<string, unknown>, index, chip, image });
  });
  sideEl.replaceChildren(fragment);
  sideEl.style.display = 'block';
  /* Training's stylesheet can still win over the inline display. Do not own
     decoded images for a strip the player cannot see. */
  if (getComputedStyle(sideEl).display !== 'none') for (const item of pending) {
    planetsideBindings.add(bindSpeciesThumb(speciesArtLoader, {
      owner: `planetside:${generation}:${worldKey}:${item.index}`,
      image: item.image,
      genome: item.genome,
      isCurrent: () => planetsideGeneration === generation
        && planetsideWorldKey === worldKey
        && nav.mode === 'surface'
        && getProvenPlanetKey(nav.planet) === worldKey
        && item.chip.dataset.cid === `${worldKey}:${item.index}`,
      onStale: () => { planetsideStaleCompletionDrops++; },
    }));
  }
  syncPlanetsideLayout();
}

type CompendiumFixtureResult = { readonly installed: number; readonly generation: number };
function normalizeCompendiumFixture(rows: unknown): Array<[string, CodexRecord]> {
  if (!Array.isArray(rows) || rows.length > 1500) {
    throw new Error('Compendium fixture must be an array of at most 1,500 rows');
  }
  const ids = new Set<string>();
  return rows.map((candidate, index) => {
    if (!Array.isArray(candidate) || candidate.length !== 2 || typeof candidate[0] !== 'string'
      || !candidate[0] || !candidate[1] || typeof candidate[1] !== 'object'
      || Array.isArray(candidate[1])) {
      throw new Error(`invalid Compendium fixture row ${index}`);
    }
    const logicalId = candidate[0];
    if (ids.has(logicalId)) throw new Error(`duplicate Compendium fixture id: ${logicalId}`);
    ids.add(logicalId);
    const entry = candidate[1] as Record<string, unknown>;
    if (typeof entry.name !== 'string' || typeof entry.kind !== 'string'
      || typeof entry.realm !== 'string' || !entry.g || typeof entry.g !== 'object'
      || Array.isArray(entry.g)) {
      throw new Error(`invalid Compendium fixture record ${logicalId}`);
    }
    return [logicalId, entry as unknown as CodexRecord];
  });
}
async function installCompendiumFixture(rows: unknown): Promise<CompendiumFixtureResult> {
  compendiumFixtureRows = normalizeCompendiumFixture(rows);
  codexFilter = '';
  codexReturnState = null;
  if (openPanelId() === 'codex') fillCodex('');
  else {
    codexGeneration++;
    codexRows = Object.freeze([]);
  }
  return Object.freeze({ installed: compendiumFixtureRows.length, generation: codexGeneration });
}
async function resetCompendiumFixture(): Promise<CompendiumFixtureResult> {
  compendiumFixtureRows = null;
  codexFilter = '';
  codexReturnState = null;
  if (openPanelId() === 'codex') fillCodex('');
  else {
    codexGeneration++;
    codexRows = Object.freeze([]);
  }
  return Object.freeze({ installed: save.codex.length, generation: codexGeneration });
}
function imageSurfaceMetrics(scope: ParentNode, selector: string): {
  readonly imageCount: number;
  readonly naturalWidths: readonly number[];
  readonly naturalHeights: readonly number[];
  readonly thumbStates: readonly string[];
} {
  const images = [...scope.querySelectorAll<HTMLImageElement>(selector)];
  return Object.freeze({
    imageCount: images.length,
    naturalWidths: Object.freeze(images.map((image) => image.naturalWidth)),
    naturalHeights: Object.freeze(images.map((image) => image.naturalHeight)),
    thumbStates: Object.freeze(images.map((image) => image.dataset.thumbState ?? 'unbound')),
  });
}
function sceneResourceDiagnostics(): unknown {
  const managedTextures = (
    app.renderer as unknown as {
      texture?: {
        managedTextures?: ReadonlyArray<{ pixelWidth: number; pixelHeight: number } | null>;
      };
    }
  ).texture?.managedTextures ?? [];
  let managedTexturePixels = 0;
  let managedTextureCount = 0;
  for (const source of managedTextures) {
    if (!source) continue;
    const pixels = source.pixelWidth * source.pixelHeight;
    if (Number.isSafeInteger(pixels) && pixels > 0) {
      managedTextureCount++;
      managedTexturePixels += pixels;
    }
  }
  const sceneTextStyleUpdateListeners = Object.values(SCENE_TEXT_STYLES)
    .reduce((sum, style) => sum + style.listenerCount('update'), 0);
  const surfaceTextureAttachment = surfacePlanetTextureOwner?.snapshot() ?? null;
  return Object.freeze({
    schema: 'cf-v2-scene-resources/v2',
    documentToken: DOCUMENT_TOKEN,
    generation: sceneTextureGeneration,
    mode: nav.mode,
    registry: sceneTextureRegistry.snapshot(),
    managedResources: pixiManagedResourceOwner.snapshot(),
    fineLayerActive: fineLayer !== null,
    fineScopeActive: fineTextureScope !== null,
    retiredFineOwnerCount: retiredFineTextureOwners.size,
    surfaceTextureOwnerActive: surfacePlanetTextureOwner !== null,
    surfaceCurrentTierPx: surfaceTextureAttachment?.currentTierPx ?? 0,
    surfaceCurrentBackingWidth: surfaceTextureAttachment?.currentBackingWidth ?? 0,
    surfaceCurrentBackingHeight: surfaceTextureAttachment?.currentBackingHeight ?? 0,
    surfaceRequestedTierPx: surfaceTextureAttachment?.requestedTierPx ?? 0,
    surfaceRetiredLeaseCount: surfaceTextureAttachment?.retiredLeaseCount ?? 0,
    pendingSurfaceRefreshes: surfaceTextureAttachment?.pendingDemandPx == null ? 0 : 1,
    pendingSystemRefreshes: systemPlanetTextureRefreshTimer === null ? 0 : 1,
    pendingPersistenceWrites: activePersist === null ? 0 : 1,
    ringGeometryEntries: _rgCache.size,
    peakRingGeometryEntries,
    localCanvasCacheEntries: _coronaC.size + _termC.size,
    peakLocalCanvasCacheEntries,
    /* No product RenderTexture/generateTexture path exists in this build;
       the focused source-policy test makes this zero an asserted inventory. */
    productRenderTargets: 0,
    managedTextureCount,
    managedTextureClearedSlots: managedTextures.length - managedTextureCount,
    managedTexturePixels,
    sceneTextStyleUpdateListeners,
    persistedPagehideCount,
    persistedPageshowCount,
  });
}
function compendiumDiagnostics(): unknown {
  const panel = document.getElementById('codexpanel')!;
  const listRows = [...panel.querySelectorAll<HTMLElement>('[data-sel="codex-entry"][data-cid]')];
  const listImages = imageSurfaceMetrics(panel, '[data-sel="codex-entry"] img');
  const detailImage = panel.querySelector<HTMLImageElement>('[data-sel="detail-portrait"]');
  const planetsideRows = [...sideEl.querySelectorAll<HTMLElement>('[data-sel="planetside-sp"]')];
  const planetsideImages = imageSurfaceMetrics(sideEl, '[data-sel="planetside-sp"] img');
  const sourceCount = activeCodexSource().length;
  const filteredCount = filteredCodexCount();
  const windowSnapshot = codexList?.snapshot() ?? codexWindow;
  return Object.freeze({
    schema: 'cf-v2-compendium-diagnostics/v1',
    documentToken: DOCUMENT_TOKEN,
    generation: codexGeneration,
    panel: Object.freeze({
      open: openPanelId() === 'codex', mode: codexMode,
      sourceCount, filteredCount, query: codexFilter,
      renderCommits: codexRenderCommits,
      staleCompletionDrops: codexStaleCompletionDrops,
      closedCompletionCommits: codexClosedCompletionCommits,
    }),
    window: windowSnapshot,
    surfaces: Object.freeze({
      list: Object.freeze({
        ...listImages,
        logicalIds: Object.freeze(listRows.map((row) => row.dataset.cid!)),
      }),
      detail: Object.freeze({
        open: codexMode === 'detail', logicalId: codexDetailLogicalId,
        naturalWidth: detailImage?.naturalWidth ?? 0,
        naturalHeight: detailImage?.naturalHeight ?? 0,
      }),
      planetside: Object.freeze({
        visible: getComputedStyle(sideEl).display !== 'none',
        imageCount: planetsideImages.imageCount,
        logicalIds: Object.freeze(planetsideRows.map((row) => row.dataset.cid!)),
        naturalWidths: planetsideImages.naturalWidths,
        naturalHeights: planetsideImages.naturalHeights,
        thumbStates: planetsideImages.thumbStates,
      }),
    }),
    lazyArt: speciesArtLoader.diagnostics(),
    art: speciesArtLoader.artDiagnostics(),
  });
}
function drawSurface(
  p: PlanetNode,
  state: Extract<NavState, { mode: 'surface' }>,
  preparedRoster: CanonicalWorldRoster | null = null,
): void {
  if (p.seed !== state.planet.seed || p.ordinal !== state.planet.ordinal) return;
  /* surface mode, slice edition: the world fills the view as its painterly
     surface (full biome scenes are Phase 6); the survey card carries the
     roster — every species row is real Ecology output.
     FIT the globe to the viewport (phone catch: at z=1 the 420px master
     overfilled a 390px screen as blur; the globe should present itself) */
  document.body.classList.add('surface-mode');
  clearWorld();
  const R = SURFACE_PLANET_DIAMETER_CSS_PX / 2;
  const fitZ = Math.min(1, (minWH() * 0.78) / SURFACE_PLANET_DIAMETER_CSS_PX);
  const initialTextureDemandPx = displayedPlanetTextureDemandPx(
    SURFACE_PLANET_DIAMETER_CSS_PX,
    fitZ,
    DPR,
  );
  const textureLease = sceneTextureLease(
    getPlanetSprite(p.P, initialTextureDemandPx),
    'planet-texture',
  );
  const spr = new Sprite(textureLease.texture);
  spr.anchor.set(0.5);
  spr.width = SURFACE_PLANET_DIAMETER_CSS_PX;
  spr.height = SURFACE_PLANET_DIAMETER_CSS_PX;
  world.addChild(spr);
  surfacePlanetTextureOwner = new SurfacePlanetTextureAttachment({
    identity: {
      generation: surfacePlanetTextureGeneration,
      planetSeed: state.planet.seed,
      planetOrdinal: state.planet.ordinal,
    },
    target: spr,
    initialLease: textureLease,
    diameterCssPx: SURFACE_PLANET_DIAMETER_CSS_PX,
    resourceForDemand: (demandPx) => getPlanetSprite(p.P, demandPx),
    acquireLease: (canvas) => sceneTextureLease(canvas, 'planet-texture'),
    textureBackingSize: (texture) => ({
      width: texture.source?.pixelWidth ?? 0,
      height: texture.source?.pixelHeight ?? 0,
    }),
    currentIdentity: currentSurfacePlanetTextureIdentity,
    compact: () => { pixiManagedResourceOwner.compact(); },
  });
  surfacePlanetTextureOwner.scheduleRefresh(initialTextureDemandPx);
  if ((p.P.type === 'terran' || p.P.type === 'ocean') && motionOK()) {
    /* the drifting upper cloud deck (main.js 5256) — twin sprites wrap so
       the sliding edge never shows; drift rate scaled to the slice's fixed
       globe (the Renderer's rate is tuned to its 6px world masters) */
    const tex = sceneTexture(_cloudSpr(p.P), 'surface-cloud');
    const wrap = new Container();
    wrap.eventMode = 'none';
    const mk = (): Sprite => {
      const s = new Sprite(tex);
      s.anchor.set(0, 0.5);
      s.width = R * 2; s.height = R * 2;
      s.alpha = 0.45;
      wrap.addChild(s);
      return s;
    };
    const a = mk(), b = mk();
    const mask = new Graphics().circle(0, 0, R).fill(0xffffff);
    wrap.addChild(mask);
    wrap.mask = mask;
    world.addChild(wrap);
    surfClouds = { a, b, w: R * 2 };
  }
  cam.x = 0; cam.y = 0; camT.x = 0; camT.y = 0; camT.z = fitZ; cam.z = fitZ * 0.8;
  fillPlanetside(state, preparedRoster);
  if (abortRenderBeforeReceiptForSmoke()) return;
  recordRenderedScene(state);
}
function goUp(): void {
  if (blockRouteChangeWhileProductAction()) return;
  const wasGal = nav.gal, wasStar = nav.star;
  const r = ascend(nav);
  if (!r.ok) return;
  nav = r.state;
  playWhoosh();
  /* ascent camera: the game re-centers the outer view on what you left
     (main.js 3404/3474) — universe at the galaxy, galaxy at the star */
  if (nav.mode === 'universe' && wasGal) {
    cam.x = wasGal.x; cam.y = wasGal.y; camT.x = wasGal.x; camT.y = wasGal.y;
    camT.z = (0.55 * minWH() / (wasGal.size || 40)) * 0.8; cam.z = camT.z * 1.6;
  } else if (nav.mode === 'galaxy' && wasStar) {
    cam.x = wasStar.x; cam.y = wasStar.y; camT.x = wasStar.x; camT.y = wasStar.y;
    camT.z = (minWH() / 34) * 0.8; cam.z = camT.z * 1.4;
  } else if (nav.mode === 'system') {
    cam.x = 0; cam.y = 0; camT.x = 0; camT.y = 0;
    camT.z = sz0 * 1.05; cam.z = camT.z * 0.8;
  }
  rerender();
}

/* the game's ZOOM-DRIVEN transitions (checkTransitions, main.js 3380):
   dive by zooming into a thing, rise by zooming out past the mode floor.
   Wormhole travel + charter/Ascent gating: Phase 4+ (recorded). */
function checkTransitions(): void {
  if (productActionInFlight) return;
  /* transitions read camT — the INTENT — not the eased cam: a descent's
     ease-in starts below the ascend floor and would bounce straight back */
  const mw = minWH();
  if (nav.mode === 'universe') {
    let best: GalaxyNode | null = null, bd = 1e9;
    for (const g of uniNodes) {
      const d = Math.hypot(g.x - camT.x, g.y - camT.y);
      if (d < bd) { bd = d; best = g; }
    }
    if (best && best.size * camT.z > 0.55 * mw && bd * camT.z < 0.4 * mw) descendGalaxy(best);
  } else if (nav.mode === 'galaxy' && nav.gal) {
    if (camT.z < gz0 * 0.62) { goUp(); return; }
    /* flying into the wormhole hurls you somewhere unimaginably distant —
       destination seeded from the galaxy, identical for every explorer
       (main.js 3415; the charter reach clamp lands with progression) */
    if (wormPos && camT.z > mw / 60 && Math.hypot(wormPos.x - camT.x, wormPos.y - camT.y) * camT.z < 120) {
      const wj = mulberry32((nav.gal.seed ^ 0xC0FFEE) >>> 0);
      const a2 = wj() * TAU, d2 = OBS_R * (2 + wj() * 10);
      const r = ascend(nav);
      if (r.ok) {
        nav = r.state;
        /* the verbatim destination WITH the game's reach clamp (main.js 3424):
           the far mouth is a VIEW of far skies — their stars stay drive-gated */
        let wx = Math.cos(a2) * d2, wy = Math.sin(a2) * d2;
        const rr = reachRadiusOf(primeCount()) * 0.85, dh = Math.hypot(wx - HOME_POS.x, wy - HOME_POS.y);
        if (dh > rr) { wx = HOME_POS.x + (wx - HOME_POS.x) / dh * rr; wy = HOME_POS.y + (wy - HOME_POS.y) / dh * rr; }
        cam.x = camT.x = wx; cam.y = camT.y = wy;
        camT.z = 1.1; cam.z = 0.3;
        playWhoosh();
        rerender();
      }
      return;
    }
    const starZ = mw / 34;
    if (camT.z > starZ) {
      const prof = galaxyProfile(nav.gal.seed) as Record<string, unknown>;
      const ccx = Math.floor(camT.x / GCELL), ccy = Math.floor(camT.y / GCELL);
      let best: { seed: number; x: number; y: number } | null = null, bd = 1e9;
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        for (const s of provenGalaxyCell(nav.gal, prof, ccx + dx, ccy + dy).stars) {
          const d = Math.hypot(s.x - camT.x, s.y - camT.y);
          if (d < bd) { bd = d; best = s; }
        }
      }
      const fcx = Math.floor(camT.x / FCELL), fcy = Math.floor(camT.y / FCELL);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
        for (const s2 of galaxyFineCell(nav.gal, prof, fcx + dx, fcy + dy)) {
          const d2 = Math.hypot(s2.x - camT.x, s2.y - camT.y);
          if (d2 < bd) { bd = d2; best = s2; }
        }
      }
      if (best && bd * camT.z < 130) descendSystem(best);
      else { cam.z = Math.min(cam.z, starZ * 1.6); camT.z = Math.min(camT.z, starZ * 1.6); }
    }
  } else if (nav.mode === 'system') {
    if (camT.z < sz0 * 0.62) goUp();
  }
}
function zoomLimits(): [number, number] {
  /* main.js 3096 — per-mode bounds */
  const mw = minWH();
  if (nav.mode === 'universe') return [0.0024, 40];
  if (nav.mode === 'galaxy') return [gz0 * 0.5, mw / 2.5];
  if (nav.mode === 'system') return [sz0 * 0.5, mw / 3];
  /* the game's 6× cap assumes real ground tiles; the slice surface is a
     420px painterly globe — cap where IT stays crisp (found by the phone
     leg's pinch: at 6× the master smears). Phase 6's vista retunes this. */
  return [0.45, Math.max(0.9, (mw / 420) * 1.6)];
}

/* ---- keyboard exploration — the canvas is a named, focusable region.
   Arrow keys cycle the same rendered bodies that pointer handlers own;
   Enter opens the same survey card/action and +/- zoom around that target. */
interface KeyboardWorldTarget {
  key: string;
  label: string;
  priority: number;
  screen: () => { x: number; y: number };
  world: { x: number; y: number };
  activate: () => void;
}
let keyboardTargetKey: string | null = null;
let keyboardRing: HTMLElement | null = null;
let keyboardLive: HTMLElement | null = null;
let pointerFocusingCanvas = false;
function currentKeyboardTargets(): KeyboardWorldTarget[] {
  const targets: KeyboardWorldTarget[] = [];
  if (nav.mode === 'universe') {
    for (const galaxy of uniNodes) targets.push({
      key: `galaxy:${galaxy.seed}:${galaxy.x}:${galaxy.y}`,
      label: galaxy.home ? 'Milky Way — you are here' : galaxyName(galaxy.seed),
      priority: galaxy.home ? 0 : 1,
      world: { x: galaxy.x, y: galaxy.y },
      screen: () => world.toGlobal({ x: galaxy.x, y: galaxy.y }),
      activate: () => surveyCard(
        describePick({ kind: galaxy.quasar ? 'quasar' : galaxy.radio ? 'radio' : 'galaxy', data: galaxy } as never),
        { label: 'Enter galaxy', run: () => descendGalaxy(galaxy) },
      ),
    });
  } else if (nav.mode === 'galaxy') {
    const seen = new Set<string>();
    for (const [tier, entries] of [[1, galStars], [2, fineStarTargets]] as const) for (const entry of entries) {
      const star = entry.star;
      const key = `star:${star.seed}:${star.x}:${star.y}`;
      if (seen.has(key)) continue;
      seen.add(key);
      targets.push({
        key,
        label: star.seed === SOL_SEED ? 'Sun — our star' : starName(star.seed),
        priority: star.seed === SOL_SEED ? 0 : tier,
        world: { x: star.x, y: star.y },
        screen: () => world.toGlobal({ x: star.x, y: star.y }),
        activate: () => surveyCard(describePick({ kind: 'star', data: star } as never), {
          label: 'Enter system', run: () => descendSystem(star),
        }),
      });
    }
  } else if (nav.mode === 'system' && nav.star) {
    for (const target of planetTargets) targets.push({
      key: `planet:${nav.star.seed}:${target.planet.seed}:${target.planet.ordinal}`,
      label: target.planet.name,
      priority: target.planet.seed === 133 ? 0 : 1,
      world: { x: target.holder.position.x, y: target.holder.position.y },
      screen: () => target.holder.getGlobalPosition(),
      activate: () => nav.mode === 'system' && surveyPlanet(target.planet, nav.star),
    });
  }
  const visible = targets.filter((target) => {
    const point = target.screen();
    return point.x >= 12 && point.y >= 12 && point.x <= innerWidth - 12 && point.y <= innerHeight - 12;
  });
  return (visible.length ? visible : targets).sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    const ap = a.screen(), bp = b.screen();
    return ap.y - bp.y || ap.x - bp.x || a.key.localeCompare(b.key);
  });
}
function announceKeyboardTarget(target: KeyboardWorldTarget | null): void {
  if (!keyboardLive) return;
  keyboardLive.textContent = target
    ? `${target.label}. Press Enter to survey; plus or minus to zoom.`
    : 'World target released.';
}
function selectKeyboardTarget(step: number): void {
  const targets = currentKeyboardTargets();
  if (!targets.length) { keyboardTargetKey = null; announceKeyboardTarget(null); return; }
  const current = targets.findIndex((target) => target.key === keyboardTargetKey);
  const next = current < 0 ? (step < 0 ? targets.length - 1 : 0) : (current + step + targets.length) % targets.length;
  keyboardTargetKey = targets[next]!.key;
  announceKeyboardTarget(targets[next]!);
  renderKeyboardTarget();
}
function renderKeyboardTarget(): void {
  if (!keyboardRing || document.activeElement !== app.canvas || !keyboardTargetKey) {
    if (keyboardRing) keyboardRing.style.display = 'none';
    return;
  }
  const target = currentKeyboardTargets().find((candidate) => candidate.key === keyboardTargetKey);
  if (!target) { keyboardTargetKey = null; keyboardRing.style.display = 'none'; return; }
  const point = target.screen();
  keyboardRing.style.display = 'block';
  keyboardRing.style.left = point.x + 'px';
  keyboardRing.style.top = point.y + 'px';
  keyboardRing.querySelector('span')!.textContent = target.label;
}
function installKeyboardExploration(): void {
  app.canvas.tabIndex = 0;
  app.canvas.setAttribute('role', 'region');
  app.canvas.setAttribute('aria-label', 'Explore the generated universe');
  app.canvas.setAttribute('aria-describedby', 'cosmoshelp');
  const help = document.createElement('p');
  help.id = 'cosmoshelp'; help.className = 'sr-only';
  help.textContent = 'Arrow keys cycle visible galaxies, stars, or worlds. Enter surveys. Plus and minus zoom. Escape releases the target.';
  keyboardLive = document.createElement('div');
  keyboardLive.id = 'cosmoslive'; keyboardLive.className = 'sr-only';
  keyboardLive.setAttribute('aria-live', 'polite'); keyboardLive.setAttribute('aria-atomic', 'true');
  keyboardRing = document.createElement('div');
  keyboardRing.id = 'cosmosfocus'; keyboardRing.setAttribute('aria-hidden', 'true');
  keyboardRing.innerHTML = '<span></span>';
  document.body.append(help, keyboardLive, keyboardRing);
  app.canvas.addEventListener('pointerdown', () => {
    /* A pointer click focuses a canvas too, but must not secretly arm a
       keyboard target that consumes the player's next Escape. */
    pointerFocusingCanvas = true;
    keyboardTargetKey = null;
    renderKeyboardTarget();
    /* Browser focus is a later default action in the pointer/mouse sequence;
       a microtask can clear this flag before that action runs. */
    setTimeout(() => { pointerFocusingCanvas = false; }, 0);
  }, { capture: true });
  app.canvas.addEventListener('focus', () => {
    if (pointerFocusingCanvas) { pointerFocusingCanvas = false; renderKeyboardTarget(); return; }
    if (!keyboardTargetKey) selectKeyboardTarget(1); else renderKeyboardTarget();
  });
  app.canvas.addEventListener('blur', renderKeyboardTarget);
  app.canvas.addEventListener('keydown', (event) => {
    if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(event.key)) {
      event.preventDefault(); event.stopPropagation();
      selectKeyboardTarget(event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1);
      return;
    }
    const target = currentKeyboardTargets().find((candidate) => candidate.key === keyboardTargetKey);
    if ((event.key === 'Enter' || event.key === ' ') && target) {
      event.preventDefault(); event.stopPropagation(); target.activate(); keyboardTargetKey = null; renderKeyboardTarget();
      /* The keyboard survey outcome lands on the card's primary action, not
         the header Close control. The Close remains the safe fallback for a
         read-only descriptor with no deeper action. */
      (card.querySelector<HTMLElement>('[data-act="travel"]')
        || card.querySelector<HTMLElement>('[data-act="landcta"]')
        || card.querySelector<HTMLElement>('[data-act="leaveworld"]')
        || card.querySelector<HTMLElement>('[data-survey-close]'))?.focus();
      return;
    }
    if ((event.key === '+' || event.key === '=' || event.key === '-' || event.key === '_') && target) {
      event.preventDefault(); event.stopPropagation();
      if (blockRouteChangeWhileProductAction()) return;
      const [lo, hi] = zoomLimits();
      camT.x = target.world.x; camT.y = target.world.y;
      camT.z = Math.min(hi, Math.max(lo, camT.z * (event.key === '-' || event.key === '_' ? 0.82 : 1.22)));
      return;
    }
    if (event.key === 'Escape' && keyboardTargetKey) {
      event.preventDefault(); event.stopPropagation(); keyboardTargetKey = null; announceKeyboardTarget(null); renderKeyboardTarget();
    }
  });
}

/* ---- the save/reload leg — THE REAL PIPELINE ---- */
async function persistView(
  replacementOwner: ReplacementTransaction | null = null,
  intent: EcologyEpochCheckpointIntent = 'ordinary',
): Promise<boolean> {
  if (persistHold || trainingCheckpointWriteHeld || importWriteInFlight || replacementReloadPending
    || !f4RuntimeMayMutate() || (replacementTransaction && replacementTransaction !== replacementOwner)) return false;
  const write = async (): Promise<boolean> => {
    let epochStage: EcologyEpochStage | null = null;
    let durable = false;
    try {
      await settleF4Heartbeat();
      const runtime = f4Runtime;
      if (!f4RuntimeMayMutate(runtime)) return false;
      const staged = ecologyEpochAuthority.stage(ecologyActivePlayNow(), intent);
      if (staged.kind !== 'staged') {
        lastEcologyEdgeOutcome = `${intent}:${staged.kind}`;
        return false;
      }
      epochStage = staged.stage;
      /* Route + epoch are detached checkpoint fields. Neither may become live
         merely because a CAS was attempted; durable publication follows the
         exact committed stage below. */
      const candidate: SaveStateV2 = {
        ...save,
        savedView: savedRouteWriteHeld ? save.savedView : navToView(nav),
        EPOCH_BASE: epochStage.epoch,
      };
      if (smokeRejectNextPersist) {
        /* Browser evidence needs a deterministic storage-rejection outcome;
           this diagnostics-only latch enters the same pre-durable branch as
           an IndexedDB failure without changing ordinary repository behavior. */
        smokeRejectNextPersist = false;
        throw new Error('slice-smoke injected persistence rejection');
      }
      const outcome = await runtime.commit(candidate, Date.now());
      lastPersistenceOutcome = outcome.kind === 'committed'
        ? `committed:${outcome.revision}` : outcome.kind;
      if (outcome.kind === 'committed') {
        durable = true;
        const settled = ecologyEpochAuthority.commit(epochStage, outcome.revision);
        if (settled.kind === 'invalid-stage') {
          throw new Error('committed ecology checkpoint lost its exact stage token');
        }
        save.savedView = outcome.saved.canonicalState.savedView;
        save.EPOCH_BASE = outcome.saved.canonicalState.EPOCH_BASE;
        f4LastCheckpointAt = performance.now();
        if (settled.kind === 'published') publishCommittedEcologyEpoch(settled.publication);
        else lastEcologyEdgeOutcome = `steady:${settled.epoch}:revision:${settled.revision}`;
        return true;
      }
      ecologyEpochAuthority.reject(epochStage);
      epochStage = null;
      lastEcologyEdgeOutcome = `${intent}:pre-durable-${outcome.kind}`;
      const detail = outcome.kind === 'stale'
        ? `stale revision ${outcome.expectedRevision}/${outcome.actualRevision}`
        : `save authority ${outcome.kind}; reload required`;
      scheduleF4AuthorityConvergenceReload(runtime, detail);
      toast('Reload required', 'Another save authority won. This page is now read-only so no progress can be overwritten.', true);
      return false;
    } catch (error) {
      const runtime = f4Runtime;
      if (durable) {
        suppressEcologyProjection();
        if (runtime) scheduleF4AuthorityConvergenceReload(
          runtime,
          `ecology checkpoint committed; publication ${error instanceof Error ? error.message : String(error)}`,
        );
        return true;
      }
      if (epochStage !== null) ecologyEpochAuthority.reject(epochStage);
      lastEcologyEdgeOutcome = `${intent}:rejected`;
      if (!(error instanceof Error && error.message === 'slice-smoke injected persistence rejection')) {
        if (runtime) scheduleF4AuthorityConvergenceReload(
          runtime,
          `save attempt rejected (${error instanceof Error ? error.message : String(error)}); reload required`,
        );
      }
      return false;
    }
  };
  const prior = activePersist;
  const run = prior ? prior.catch(() => false).then(write) : write();
  activePersist = run;
  try { return await run; }
  finally {
    if (activePersist === run) {
      activePersist = null;
      const runtimeDiagnostics = f4Runtime?.diagnostics();
      if (ecologyEpochAuthority.projection().state === 'dirty' && f4PageVisible()
        && app.ticker?.started === true
        && runtimeDiagnostics?.visible === true
        && runtimeDiagnostics.answerable
        && runtimeDiagnostics.leaseOwned
        && !runtimeDiagnostics.staleBlocked) {
        const runtime = f4Runtime;
        try { refreshCommittedEcologyProjection(); }
        catch (error) {
          if (runtime) scheduleF4AuthorityConvergenceReload(
            runtime,
            `ecology projection refresh rejected (${error instanceof Error ? error.message : String(error)})`,
          );
        }
      }
    }
  }
}
let _persistT = 0;
let importWriteInFlight = false;
let activePersist: Promise<boolean> | null = null;
let productActionInFlight = false;
function requestEcologyEpochCheckpoint(): void {
  if (ecologyEdgeCheckpointInFlight !== null || activePersist || productActionInFlight
    || importWriteInFlight || replacementTransaction || replacementReloadPending
    || trainingCheckpointWriteHeld || !f4RuntimeMayMutate()) return;
  if (!ecologyEpochAuthority.autoCheckpointDue(ecologyActivePlayNow())) return;
  const run = persistView(null, 'ecology-edge');
  ecologyEdgeCheckpointInFlight = run;
  const clear = (): void => {
    if (ecologyEdgeCheckpointInFlight === run) ecologyEdgeCheckpointInFlight = null;
  };
  void run.then(clear, clear);
}
const productActionCoordinator = createProductActionCoordinator();
const smokeProductActionHold = createProductActionDiagnosticHold();
let smokeRejectNextArc3ActionStorage = false;
let smokeStaleNextArc3ActionAuthority = false;
let lastSmokeArc3ActionFaultWitness: Readonly<{
  schema: 'cf-v2-arc3-action-fault-witness/v1';
  operation: string;
  injection: 'storage-failure' | 'stale-authority' | 'publication-failure';
  phase: 'injecting' | 'settled' | 'injection-failed';
  beforeRevision: number;
  injectedRevision: number | null;
  outcome: string | null;
}> | null = null;
let smokeRejectNextPersist = false;
let smokeImportRaceRelease: (() => void) | null = null;

function syncCustomNameIndex(): void {
  customNames.clear();
  for (const [key, name] of save.customNames) customNames.set(key, name);
}

type Arc2InventoryActionOutcome = Readonly<{
  kind: 'committed' | 'unchanged' | 'unavailable' | 'refused';
  operation: Arc2InventoryOperation;
  instanceId: string;
  detail: string;
  state: Arc2LootStateV1 | null;
}>;

function applyArc2LegacyMirror(target: SaveStateV2, state: Arc2LootStateV1): void {
  const mirror = projectArc2LootLegacyMirror(state);
  target.items = mirror.items.map(([baseId, count]) => [baseId, count]);
  target.equip = { ...mirror.equip };
  target.equipAff = Object.fromEntries(Object.entries(mirror.equipAff).map(([slot, affix]) => [
    slot,
    { k: affix.k, v: affix.v, forId: affix.forId },
  ]));
}

function publishArc2ProductFields(target: SaveStateV2, committed: SaveStateV2): void {
  /* Arc 2 owns only these compatibility fields. Publishing them into the
     existing live object preserves route/Atlas identity sidecars and any
     disjoint UI mutation staged while IndexedDB was settling. */
  target.items = committed.items.map(([baseId, count]) => [baseId, count]);
  target.equip = { ...committed.equip };
  target.equipAff = Object.fromEntries(Object.entries(committed.equipAff).map(([slot, affix]) => [
    slot,
    { k: affix.k, v: affix.v, forId: affix.forId },
  ]));
  target.cargo = committed.cargo.map(([materialId, count]) => [materialId, count]);
}

async function commitArc2InventoryAction(
  operation: Arc2InventoryOperation,
  instanceId: string,
): Promise<Arc2InventoryActionOutcome> {
  const unavailable = (detail: string): Arc2InventoryActionOutcome => Object.freeze({
    kind: 'unavailable', operation, instanceId, detail, state: null,
  });
  const state = arc2LootState;
  const runtime = f4Runtime;
  if (typeof instanceId !== 'string' || instanceId.length < 1 || instanceId.length > 4_096) {
    return unavailable('invalid-instance');
  }
  if (state?.kind !== 'inventory') {
    return unavailable(state?.kind ?? arc2LootProtection ?? 'inventory-unavailable');
  }
  if (!f4RuntimeMayMutate(runtime) || activePersist || importWriteInFlight
    || replacementTransaction || replacementReloadPending || trainingCheckpointWriteHeld) {
    return unavailable('write-authority-unavailable');
  }
  const preflight = planArc2InventoryAction(state.inventory, operation, instanceId);
  if (preflight.kind !== 'ready') {
    const kind = preflight.kind === 'unchanged' ? 'unchanged' : 'refused';
    lastArc2LootOutcome = `${operation}-${preflight.detail}`;
    return Object.freeze({ kind, operation, instanceId, detail: preflight.detail, state: null });
  }
  const actionClaim = productActionCoordinator.tryClaim(`arc2.${operation}`);
  if (actionClaim === null) return unavailable('product-action-pending');
  const actionBarrier = actionClaim.barrier;
  productActionInFlight = true;
  activePersist = actionBarrier;
  let durable = false;
  try {
    await smokeProductActionHold.holdIfArmed(actionClaim.operation);
    await settleF4Heartbeat();
    if (!f4RuntimeMayMutate(runtime) || importWriteInFlight
      || replacementTransaction || replacementReloadPending || trainingCheckpointWriteHeld) {
      return unavailable('write-authority-changed');
    }
    const actionNow = Date.now();
    const outcome = await runtime.commitProduct({
      state: save,
      operation,
      codecNow: actionNow,
      derive: ({ draft, extensions, receiptOrdinal }) => {
        const current = readArc2Loot(extensions);
        if (current.kind !== 'loaded' || current.state.kind !== 'inventory') {
          throw new Error(`Arc 2 carrier became ${current.kind}`);
        }
        const planned = planArc2InventoryAction(current.state.inventory, operation, instanceId);
        if (planned.kind !== 'ready') throw new Error(`Arc 2 ${operation} became ${planned.detail}`);
        const legacyProjection = projectArc2LegacyAction(draft, operation, planned);
        if (legacyProjection.kind !== 'projected') {
          throw new Error(`Arc 2 ${operation} legacy projection refused: ${legacyProjection.detail}`);
        }
        const prepared = prepareArc2LootInventoryWrite({
          extensions,
          inventory: planned.state,
          stackableCounts: current.state.stackableCounts,
        });
        if (prepared.kind !== 'prepared') {
          throw new Error(`Arc 2 ${operation} carrier refused: ${prepared.reason}`);
        }
        return {
          state: draft,
          extensionWrites: [prepared.write],
          witness: `arc2:${operation}:${receiptOrdinal}:${instanceId}:${planned.state.revision}`,
        };
      },
    });
    lastArc2LootOutcome = `${operation}-${outcome.kind}`;
    if (outcome.kind !== 'committed') {
      if (outcome.kind === 'stale' || outcome.kind === 'duplicate-receipt'
        || outcome.kind === 'lost' || outcome.kind === 'lease-unavailable'
        || outcome.kind === 'protected') {
        scheduleF4AuthorityConvergenceReload(runtime, `Arc 2 ${operation} authority ${outcome.kind}`);
      }
      return Object.freeze({
        kind: 'refused', operation, instanceId, detail: outcome.kind, state: null,
      });
    }

    /* Durability is terminal. Any failure below converges from the committed
       bytes and remains a committed UI outcome—it can never invite a retry. */
    durable = true;
    f4LastCheckpointAt = performance.now();
    lastPersistenceOutcome = `arc2-${operation}-committed:${outcome.revision}`;
    try {
      const loaded = readArc2Loot(runtime.extensions);
      if (loaded.kind !== 'loaded') throw new Error('carrier-unreadable');
      if (!arc2LootLegacyMirrorMatches(loaded.state, outcome.state)) {
        throw new Error('carrier-legacy-projection-mismatch');
      }
      publishArc2ProductFields(save, outcome.state);
      arc2LootState = loaded.state;
      return Object.freeze({
        kind: 'committed', operation, instanceId,
        detail: `revision:${outcome.revision}`, state: arc2LootState,
      });
    } catch (error) {
      arc2LootState = null;
      const detail = error instanceof Error ? error.message : String(error);
      lastArc2LootOutcome = `${operation}-committed-publication-reload`;
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Arc 2 ${operation} committed at revision ${outcome.revision}; publication ${detail}`,
      );
      return Object.freeze({
        kind: 'committed', operation, instanceId,
        detail: `revision:${outcome.revision};publication-reload`, state: null,
      });
    }
  } catch (error) {
    lastArc2LootOutcome = `${operation}-rejected`;
    return Object.freeze({
      kind: 'refused', operation, instanceId,
      detail: error instanceof Error ? error.message : String(error),
      state: null,
    });
  } finally {
    productActionInFlight = false;
    actionClaim.settle(durable);
    if (activePersist === actionBarrier) activePersist = null;
  }
}

type Arc3AppActionOperation =
  | 'mine-world'
  | 'skim-star'
  | 'purchase-research'
  | 'fabricate-fixed';
type Arc3AppActionOutcome = Readonly<{
  kind: 'committed' | 'unavailable' | 'refused';
  operation: Arc3AppActionOperation;
  detail: string;
  result: unknown;
}>;
type Arc3DeriveContext = Readonly<{
  draft: SaveStateV2;
  extensions: V5Extensions;
  activePlayMs: number;
  receiptOrdinal: number;
  codecNow: number;
}>;
type Arc3CommittedVerification =
  | ReturnType<typeof verifyArc3CommittedAction>
  | ReturnType<typeof verifyArc3CommittedResearchAction>
  | ReturnType<typeof verifyArc3CommittedFixedFabricationAction>;
let smokeRejectNextArc3Publication = false;
function productActionFaultInjectionArmed(): boolean {
  return smokeRejectNextArc3ActionStorage
    || smokeStaleNextArc3ActionAuthority
    || smokeRejectNextArc3Publication
    || smokeRejectNextArc4ActionStorage
    || smokeStaleNextArc4ActionAuthority
    || smokeRejectNextArc4Publication;
}

async function commitArc3EngineeringAction(spec: Readonly<{
  operation: Arc3AppActionOperation;
  receiptKind: string;
  derive: (context: Arc3DeriveContext) => Arc3AppDerivationOutcome;
  verify: (context: Readonly<{
    extensions: V5Extensions;
    committed: SaveStateV2;
    planned: Arc3AppDerivation;
    codecNow: number;
  }>) => Arc3CommittedVerification;
  publish: (
    target: SaveStateV2,
    committed: SaveStateV2,
    verified: Exclude<Arc3CommittedVerification, { kind: 'mismatch' }>,
  ) => void;
}>): Promise<Arc3AppActionOutcome> {
  const unavailable = (detail: string): Arc3AppActionOutcome => Object.freeze({
    kind: 'unavailable', operation: spec.operation, detail, result: null,
  });
  const runtime = f4Runtime;
  if (arc3EngineeringState === null || arc3EngineeringProtection !== null) {
    return unavailable(arc3EngineeringProtection ?? 'engineering-unavailable');
  }
  if (!f4RuntimeMayMutate(runtime) || activePersist || importWriteInFlight
    || replacementTransaction || replacementReloadPending || trainingCheckpointWriteHeld) {
    return unavailable('write-authority-unavailable');
  }
  /* Claim before the first await. The controller's pending latch protects its
     own buttons; this main-owned owner also fences every persistence/product
     path while an already-running heartbeat settles. */
  const actionClaim = productActionCoordinator.tryClaim(`arc3.${spec.operation}`);
  if (actionClaim === null) return unavailable('product-action-pending');
  const actionBarrier = actionClaim.barrier;
  productActionInFlight = true;
  activePersist = actionBarrier;
  let durable = false;
  try {
    await smokeProductActionHold.holdIfArmed(actionClaim.operation);
    await settleF4Heartbeat();
    /* activePersist may now be a legitimate save queued behind our barrier,
       so ownership is represented by actionClaim/productActionInFlight—not
       by requiring activePersist to retain the barrier identity. */
    if (!f4RuntimeMayMutate(runtime) || importWriteInFlight
      || replacementTransaction || replacementReloadPending || trainingCheckpointWriteHeld) {
      return unavailable('write-authority-changed');
    }

    const codecNow = Date.now();
    const priorSessionRng = runtime.sessionRng;
    const plannedHolder: { value: Arc3AppDerivation | null } = { value: null };
    const faultInjection = smokeRejectNextArc3ActionStorage
      ? 'storage-failure'
      : smokeStaleNextArc3ActionAuthority
        ? 'stale-authority'
        : null;
    if (faultInjection === 'storage-failure') smokeRejectNextArc3ActionStorage = false;
    else if (faultInjection === 'stale-authority') smokeStaleNextArc3ActionAuthority = false;
    const faultBeforeRevision = runtime.revision;
    let injectedRevision: number | null = null;
    if (faultInjection !== null) {
      lastSmokeArc3ActionFaultWitness = Object.freeze({
        schema: 'cf-v2-arc3-action-fault-witness/v1',
        operation: actionClaim.operation,
        injection: faultInjection,
        phase: 'injecting',
        beforeRevision: faultBeforeRevision,
        injectedRevision,
        outcome: null,
      });
    }
    if (faultInjection === 'stale-authority') {
      const injected = await revisionRepo.mutate({
        expectedRevision: faultBeforeRevision,
        writes: [],
      });
      if (injected.kind !== 'committed') {
        lastSmokeArc3ActionFaultWitness = Object.freeze({
          schema: 'cf-v2-arc3-action-fault-witness/v1',
          operation: actionClaim.operation,
          injection: faultInjection,
          phase: 'injection-failed',
          beforeRevision: faultBeforeRevision,
          injectedRevision: null,
          outcome: injected.kind,
        });
        throw new Error(`slice-smoke Arc 3 stale injection became ${injected.kind}`);
      }
      injectedRevision = injected.revision;
    }
    let outcome: Awaited<ReturnType<F4RuntimeAuthority['commitAction']>>;
    if (faultInjection === 'storage-failure') smokeRejectArc3StorageBoundary = true;
    try {
      outcome = await runtime.commitAction({
        state: save,
        operation: actionClaim.operation,
        receiptKind: spec.receiptKind,
        codecNow,
        derive: ({ draft, extensions, activePlayMs, receiptOrdinal }) => {
          const derived = spec.derive({
            draft, extensions, activePlayMs, receiptOrdinal, codecNow,
          });
          if (derived.kind !== 'ready') throw new Error(derived.detail);
          plannedHolder.value = derived.derivation;
          return {
            state: derived.derivation.state,
            extensionWrites: derived.derivation.extensionWrites,
            witness: derived.derivation.witness,
          };
        },
      });
    } finally {
      if (faultInjection === 'storage-failure') smokeRejectArc3StorageBoundary = false;
    }
    if (faultInjection !== null) {
      lastSmokeArc3ActionFaultWitness = Object.freeze({
        schema: 'cf-v2-arc3-action-fault-witness/v1',
        operation: actionClaim.operation,
        injection: faultInjection,
        phase: 'settled',
        beforeRevision: faultBeforeRevision,
        injectedRevision,
        outcome: outcome.kind,
      });
    }
    lastArc3EngineeringOutcome = `${spec.operation}-${outcome.kind}`;
    if (outcome.kind !== 'committed') {
      if (outcome.kind === 'stale' || outcome.kind === 'duplicate-receipt'
        || outcome.kind === 'lost' || outcome.kind === 'lease-unavailable'
        || outcome.kind === 'protected') {
        scheduleF4AuthorityConvergenceReload(
          runtime,
          `Arc 3 ${spec.operation} authority ${outcome.kind}`,
        );
      }
      const detail = outcome.kind === 'rejected' ? outcome.message : outcome.kind;
      return Object.freeze({
        kind: 'refused', operation: spec.operation, detail, result: null,
      });
    }

    /* Durability is terminal. Any verification/publication failure converges
       from the committed carrier and never turns into a second action. */
    durable = true;
    f4LastCheckpointAt = performance.now();
    lastPersistenceOutcome = `arc3-${spec.operation}-committed:${outcome.revision}`;
    try {
      const committedPlan = plannedHolder.value;
      if (committedPlan === null) throw new Error('derivation-missing-after-commit');
      if (smokeRejectNextArc3Publication) {
        smokeRejectNextArc3Publication = false;
        lastSmokeArc3ActionFaultWitness = Object.freeze({
          schema: 'cf-v2-arc3-action-fault-witness/v1',
          operation: actionClaim.operation,
          injection: 'publication-failure',
          phase: 'settled',
          beforeRevision: faultBeforeRevision,
          injectedRevision: outcome.revision,
          outcome: 'committed-publication-reload',
        });
        throw new Error('slice-smoke injected Arc 3 publication rejection');
      }
      if (outcome.plan.receiptOrdinal !== committedPlan.receiptOrdinal
        || outcome.receipt.ordinal !== committedPlan.receiptOrdinal
        || outcome.receipt.witness !== committedPlan.witness) {
        throw new Error('receipt-plan-mismatch');
      }
      if (outcome.authority.sessionRng.seed !== priorSessionRng.seed
        || JSON.stringify(outcome.authority.sessionRng.draws) !== JSON.stringify(priorSessionRng.draws)
        || outcome.authority.sessionRng.ordinal !== priorSessionRng.ordinal + 1) {
        throw new Error('deterministic-action-rng-mismatch');
      }
      const verified = spec.verify({
        extensions: runtime.extensions,
        committed: outcome.state,
        planned: committedPlan,
        codecNow,
      });
      if (verified.kind !== 'verified') throw new Error(verified.detail);
      spec.publish(save, outcome.state, verified);
      arc3EngineeringState = verified.state;
      lastArc3ProjectionDiagnostics = verified.projection.diagnostics;
      return Object.freeze({
        kind: 'committed', operation: spec.operation,
        detail: `revision:${outcome.revision}`,
        result: committedPlan.result,
      });
    } catch (error) {
      arc3EngineeringState = null;
      const detail = error instanceof Error ? error.message : String(error);
      arc3EngineeringProtection = 'committed-publication-reload';
      lastArc3EngineeringOutcome = `${spec.operation}-committed-publication-reload`;
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Arc 3 ${spec.operation} committed at revision ${outcome.revision}; publication ${detail}`,
      );
      return Object.freeze({
        kind: 'committed', operation: spec.operation,
        detail: `revision:${outcome.revision};publication-reload`, result: null,
      });
    }
  } catch (error) {
    lastArc3EngineeringOutcome = `${spec.operation}-rejected`;
    return Object.freeze({
      kind: 'refused', operation: spec.operation,
      detail: error instanceof Error ? error.message : String(error), result: null,
    });
  } finally {
    productActionInFlight = false;
    actionClaim.settle(durable);
    if (activePersist === actionBarrier) activePersist = null;
  }
}

async function mineCurrentSurface(): Promise<Arc3AppActionOutcome> {
  const currentSurface = nav;
  if (currentSurface.mode !== 'surface') {
    return Object.freeze({
      kind: 'unavailable', operation: 'mine-world',
      detail: 'current-surface-required', result: null,
    });
  }
  return commitArc3EngineeringAction({
    operation: 'mine-world',
    receiptKind: 'arc3-mine-world',
    derive: ({ draft, extensions, activePlayMs, receiptOrdinal, codecNow }) =>
      deriveArc3MineAction({
        draft, extensions, currentSurface, activePlayMs, receiptOrdinal, codecNow,
      }),
    verify: ({ extensions, committed, planned, codecNow }) => verifyArc3CommittedAction({
      extensions,
      committed,
      expectedState: planned.nextEngineeringState,
      codecNow,
      minedTimestampIntent: planned.minedTimestampIntent,
    }),
    publish: (target, committed) => publishArc3MiningFields(target, committed),
  });
}

async function skimCurrentSystem(): Promise<Arc3AppActionOutcome> {
  const currentSystem = nav;
  if (currentSystem.mode !== 'system') {
    return Object.freeze({
      kind: 'unavailable', operation: 'skim-star',
      detail: 'current-system-required', result: null,
    });
  }
  return commitArc3EngineeringAction({
    operation: 'skim-star',
    receiptKind: 'arc3-skim-star',
    derive: ({ draft, extensions, activePlayMs, receiptOrdinal, codecNow }) =>
      deriveArc3SkimAction({
        draft, extensions, currentSystem, activePlayMs, receiptOrdinal, codecNow,
      }),
    verify: ({ extensions, committed, planned, codecNow }) => verifyArc3CommittedAction({
      extensions,
      committed,
      expectedState: planned.nextEngineeringState,
      codecNow,
      minedTimestampIntent: planned.minedTimestampIntent,
    }),
    publish: (target, committed) => publishArc3SkimFields(target, committed),
  });
}

async function purchaseEngineeringResearch(researchId: string): Promise<Arc3AppActionOutcome> {
  return commitArc3EngineeringAction({
    operation: 'purchase-research',
    receiptKind: 'arc3-purchase-research',
    derive: ({ draft, extensions, receiptOrdinal, codecNow }) =>
      deriveArc3ResearchAction({
        draft, extensions, researchId, receiptOrdinal, codecNow,
      }),
    verify: ({ extensions, committed, planned, codecNow }) =>
      verifyArc3CommittedResearchAction({
        extensions,
        committed,
        expectedOwnedState: planned.state,
        expectedState: planned.nextEngineeringState,
        codecNow,
        minedTimestampIntent: planned.minedTimestampIntent,
      }),
    publish: (target, committed) => publishArc3ResearchFields(target, committed),
  });
}

async function fabricateFixedEngineeringRecipe(baseId: string): Promise<Arc3AppActionOutcome> {
  return commitArc3EngineeringAction({
    operation: 'fabricate-fixed',
    receiptKind: 'arc3-fabricate-fixed',
    derive: ({ draft, extensions, activePlayMs, receiptOrdinal, codecNow }) =>
      deriveArc3FixedFabricationAction({
        draft, extensions, baseId, activePlayMs, receiptOrdinal, codecNow,
      }),
    verify: ({ extensions, committed, planned, codecNow }) => {
      if (planned.nextArc2State === null) {
        return Object.freeze({ kind: 'mismatch', detail: 'fixed-fabrication-arc2-plan-missing' });
      }
      return verifyArc3CommittedFixedFabricationAction({
        extensions,
        committed,
        expectedOwnedState: planned.state,
        expectedEngineeringState: planned.nextEngineeringState,
        expectedArc2State: planned.nextArc2State,
        codecNow,
        minedTimestampIntent: planned.minedTimestampIntent,
      });
    },
    publish: (target, committed, verified) => {
      if (!('arc2State' in verified)) throw new Error('fixed-fabrication-verification-kind-mismatch');
      /* Validate/render the exact carrier before publishing any live save or
         global carrier field. The controller is closed by the one-panel law,
         so this cannot expose an optimistic cross-panel state. */
      inventoryPanelController.setState(verified.arc2State);
      publishArc3FixedFabricationFields(target, committed);
      arc2LootState = verified.arc2State;
    },
  });
}

type Arc4CaptureActionOutcome = Readonly<{
  kind: 'committed' | 'unavailable' | 'refused';
  durability: 'none' | 'committed';
  convergence: 'none' | 'read-only-reload';
  verb: AcquisitionVerbV1 | null;
  detail: string;
  result: Readonly<{
    hit: boolean;
    speciesId: string;
    speciesName: string;
    kingdom: 'microbe' | 'flora' | 'fungi' | 'fauna';
    sourceOrdinal: number;
    tier: number;
    chance: number;
    worldKey: string;
    ecologyEpoch: number;
    fullRosterFingerprint: string;
    firstForSpecies: boolean;
    spent: 1;
    remainingAfter: number;
    ownedRowId: string | null;
    stardustReward: number;
    revision: number;
  }> | null;
}>;
let lastArc4CaptureResult: Arc4CaptureActionOutcome['result'] = null;

function isArc4CaptureVerb(value: unknown): value is AcquisitionVerbV1 {
  return value === 'tame' || value === 'scavenge' || value === 'sample';
}

/** Sole Arc 4 capture writer. Presentation supplies one opaque semantics
 * fence plus one verb, but never a candidate, snapshot, draw or successor;
 * the durable carrier and registered postcommit evidence remain the sole
 * outcome authority. Diagnostics with no supplied fence mint the same
 * current-surface fence synchronously before the first await. */
async function commitArc4CaptureAction(
  verbValue: unknown,
  presentationFenceValue?: string,
): Promise<Arc4CaptureActionOutcome> {
  const unavailable = (
    detail: string,
    verb: AcquisitionVerbV1 | null = isArc4CaptureVerb(verbValue) ? verbValue : null,
  ): Arc4CaptureActionOutcome => {
    lastArc4CaptureResult = null;
    lastArc4CaptureOutcome = `${verb ?? 'invalid'}-unavailable:${detail}`;
    return Object.freeze({
      kind: 'unavailable', durability: 'none', convergence: 'none',
      verb, detail, result: null,
    });
  };
  if (!isArc4CaptureVerb(verbValue)) return unavailable('invalid-verb', null);
  const verb = verbValue;
  const intendedSurface = nav;
  if (intendedSurface.mode !== 'surface') return unavailable('current-surface-required', verb);
  const runtime = f4Runtime;
  if (arc4OwnershipState?.mode !== 'current' || arc4OwnershipProtection !== null) {
    return unavailable(arc4OwnershipProtection ?? 'ownership-unavailable', verb);
  }
  const ownershipV2Parent = arc5OwnershipState;
  if (ownershipV2Parent?.mode !== 'current'
    || arc5OwnershipEvidence?.representationVersion !== ARC5_OWNERSHIP_MIGRATION_VERSION
    || arc5OwnershipProtection !== null) {
    return unavailable(`arc5:${arc5OwnershipProtection ?? 'ownership-v2-unavailable'}`, verb);
  }
  if (ecologyEpochBlocksActions()) return unavailable('ecology-epoch-pending', verb);
  if (!f4RuntimeMayMutate(runtime) || activePersist || importWriteInFlight
    || replacementTransaction || replacementReloadPending || trainingCheckpointWriteHeld) {
    return unavailable('write-authority-unavailable', verb);
  }
  const presentationFence = presentationFenceValue === undefined
    ? capturePresentationFenceForSurface(runtime, intendedSurface)
    : presentationFenceValue;
  if (presentationFence === null || !/^cpf1:[0-9a-f]{64}$/u.test(presentationFence)) {
    return unavailable('presentation-authority-unavailable', verb);
  }
  /* Shared ownership is acquired synchronously before heartbeat settlement.
     This fences Arc 2, Arc 3, autosave and every other capture attempt. */
  const actionClaim = productActionCoordinator.tryClaim(`arc4.capture.${verb}`);
  if (actionClaim === null) return unavailable('product-action-pending', verb);
  const actionBarrier = actionClaim.barrier;
  lastArc4CaptureResult = null;
  lastArc4CaptureOutcome = `${verb}-pending`;
  productActionInFlight = true;
  activePersist = actionBarrier;
  let durable = false;
  try {
    await smokeProductActionHold.holdIfArmed(actionClaim.operation);
    await settleF4Heartbeat();
    if (ecologyEpochBlocksActions()) return unavailable('ecology-epoch-changed', verb);
    if (!f4RuntimeMayMutate(runtime) || importWriteInFlight
      || replacementTransaction || replacementReloadPending || trainingCheckpointWriteHeld) {
      return unavailable('write-authority-changed', verb);
    }
    if (nav !== intendedSurface || nav.mode !== 'surface') {
      return unavailable('surface-authority-changed', verb);
    }
    const address = canonicalCF1WorldAddressFromNav(nav);
    if (!address.ok) return unavailable(`surface-address:${address.reason}`, verb);
    const rosterResult = canonicalWorldRoster(address.address, currentEcologyEpoch());
    if (!rosterResult.ok) {
      return unavailable(`world-roster:${rosterResult.reason}`, verb);
    }
    const faultInjection = smokeRejectNextArc4ActionStorage
      ? 'storage-failure'
      : smokeStaleNextArc4ActionAuthority
        ? 'stale-authority'
        : null;
    if (faultInjection === 'storage-failure') smokeRejectNextArc4ActionStorage = false;
    else if (faultInjection === 'stale-authority') smokeStaleNextArc4ActionAuthority = false;
    const faultBeforeRevision = runtime.revision;
    let injectedRevision: number | null = null;
    if (faultInjection !== null) {
      lastSmokeArc4ActionFaultWitness = Object.freeze({
        schema: 'cf-v2-arc4-action-fault-witness/v1',
        operation: actionClaim.operation,
        injection: faultInjection,
        phase: 'injecting',
        beforeRevision: faultBeforeRevision,
        injectedRevision,
        outcome: null,
      });
    }
    if (faultInjection === 'stale-authority') {
      const injected = await revisionRepo.mutate({
        expectedRevision: faultBeforeRevision,
        writes: [],
      });
      if (injected.kind !== 'committed') {
        lastSmokeArc4ActionFaultWitness = Object.freeze({
          schema: 'cf-v2-arc4-action-fault-witness/v1',
          operation: actionClaim.operation,
          injection: faultInjection,
          phase: 'injection-failed',
          beforeRevision: faultBeforeRevision,
          injectedRevision: null,
          outcome: injected.kind,
        });
        throw new Error(`slice-smoke Arc 4 stale injection became ${injected.kind}`);
      }
      injectedRevision = injected.revision;
    }
    let attempt: Awaited<ReturnType<typeof commitArc4CaptureAttemptV1>>;
    if (faultInjection === 'storage-failure') smokeRejectArc4StorageBoundary = true;
    try {
      attempt = await commitArc4CaptureAttemptV1({
        runtime,
        ownershipV2: ownershipV2Parent,
        state: save,
        nav,
        address: address.address,
        roster: rosterResult.roster,
        presentationFence,
        verb,
        codecNow: Date.now(),
      });
    } finally {
      if (faultInjection === 'storage-failure') smokeRejectArc4StorageBoundary = false;
    }
    if (faultInjection !== null) {
      lastSmokeArc4ActionFaultWitness = Object.freeze({
        schema: 'cf-v2-arc4-action-fault-witness/v1',
        operation: actionClaim.operation,
        injection: faultInjection,
        phase: 'settled',
        beforeRevision: faultBeforeRevision,
        injectedRevision,
        outcome: attempt.kind === 'refused'
          ? attempt.transaction?.kind ?? attempt.detail
          : attempt.kind,
      });
    }
    lastArc4CaptureOutcome = `${verb}-${attempt.kind}:${attempt.kind === 'refused'
      ? attempt.detail : attempt.convergence}`;
    if (attempt.kind === 'refused') {
      lastArc4CaptureResult = null;
      if (attempt.detail.startsWith('capacity:arc5-migration:')) {
        arc5OwnershipState = null;
        arc5OwnershipEvidence = null;
        arc5OwnershipProtection = attempt.detail;
        lastArc5BootstrapOutcome = 'capture-protected';
      }
      if (attempt.convergence === 'read-only-reload') {
        scheduleF4AuthorityConvergenceReload(
          runtime,
          `Arc 4 ${verb} authority ${attempt.detail}`,
        );
      }
      return Object.freeze({
        kind: 'refused', durability: 'none', convergence: attempt.convergence,
        verb, detail: attempt.detail, result: null,
      });
    }

    /* Durability is terminal. Everything below is verification/publication;
       any exception converges from the committed bytes and cannot reroll. */
    durable = true;
    f4LastCheckpointAt = performance.now();
    const transaction = attempt.transaction;
    lastPersistenceOutcome = `arc4-${verb}-committed:${transaction.revision}`;
    if (attempt.kind === 'committed-convergence') {
      lastArc4CaptureResult = null;
      arc4OwnershipState = null;
      arc4OwnershipProtection = 'committed-publication-reload';
      arc5OwnershipState = null;
      arc5OwnershipEvidence = null;
      arc5OwnershipProtection = 'committed-publication-reload';
      lastArc5BootstrapOutcome = 'committed-publication-reload';
      lastArc4CaptureOutcome = `${verb}-committed-publication-reload`;
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Arc 4 ${verb} committed at revision ${transaction.revision}; ${attempt.detail}`,
      );
      return Object.freeze({
        kind: 'committed', durability: 'committed', convergence: 'read-only-reload', verb,
        detail: `revision:${transaction.revision};publication-reload`, result: null,
      });
    }

    try {
      if (smokeRejectNextArc4Publication) {
        smokeRejectNextArc4Publication = false;
        lastSmokeArc4ActionFaultWitness = Object.freeze({
          schema: 'cf-v2-arc4-action-fault-witness/v1',
          operation: actionClaim.operation,
          injection: 'publication-failure',
          phase: 'settled',
          beforeRevision: faultBeforeRevision,
          injectedRevision: transaction.revision,
          outcome: 'committed-publication-reload',
        });
        throw new Error('slice-smoke injected Arc 4 publication rejection');
      }
      const verified = verifyArc4CommittedCaptureV1({
        runtimeExtensions: runtime.extensions,
        committed: attempt,
      });
      if (verified.kind !== 'verified') throw new Error(verified.detail);
      publishArc4CaptureFields(save, transaction.state);
      arc4OwnershipState = verified.ownership;
      arc4OwnershipProtection = null;
      arc5OwnershipState = verified.ownershipV2;
      arc5OwnershipEvidence = verified.ownershipV2Evidence;
      arc5OwnershipProtection = null;
      lastArc5BootstrapOutcome = 'capture-committed-published';
      syncCustomNameIndex();
      const result = Object.freeze({
        hit: verified.plan.hit,
        speciesId: verified.plan.candidate.identity.speciesId,
        speciesName: String(describeSpecies(
          verified.plan.candidate.identity.genome as never,
        ).name || 'Unknown species'),
        kingdom: verified.plan.candidate.identity.kingdom,
        sourceOrdinal: verified.plan.candidate.sourceOrdinal,
        tier: verified.plan.tier,
        chance: verified.plan.chance,
        worldKey: attempt.preflight.snapshot.worldKey,
        ecologyEpoch: attempt.preflight.snapshot.ecologyEpoch,
        fullRosterFingerprint: attempt.preflight.snapshot.fullRosterFingerprint,
        firstForSpecies: verified.plan.firstForSpecies,
        spent: verified.plan.spent,
        remainingAfter: verified.plan.remainingAfter,
        ownedRowId: verified.plan.ownedRowId,
        stardustReward: verified.stardustReward,
        revision: transaction.revision,
      });
      lastArc4CaptureResult = result;
      lastArc4CaptureOutcome = `${verb}-committed:${transaction.revision}`;
      return Object.freeze({
        kind: 'committed', durability: 'committed', convergence: 'none', verb,
        detail: `revision:${transaction.revision}`, result,
      });
    } catch (error) {
      lastArc4CaptureResult = null;
      const detail = error instanceof Error ? error.message : String(error);
      arc4OwnershipState = null;
      arc4OwnershipProtection = 'committed-publication-reload';
      arc5OwnershipState = null;
      arc5OwnershipEvidence = null;
      arc5OwnershipProtection = 'committed-publication-reload';
      lastArc5BootstrapOutcome = 'committed-publication-reload';
      lastArc4CaptureOutcome = `${verb}-committed-publication-reload`;
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Arc 4 ${verb} committed at revision ${transaction.revision}; publication ${detail}`,
      );
      return Object.freeze({
        kind: 'committed', durability: 'committed', convergence: 'read-only-reload', verb,
        detail: `revision:${transaction.revision};publication-reload`, result: null,
      });
    }
  } catch (error) {
    lastArc4CaptureOutcome = `${verb}-${durable ? 'committed-publication-reload' : 'rejected'}`;
    if (durable) {
      lastArc4CaptureResult = null;
      arc4OwnershipState = null;
      arc4OwnershipProtection = 'committed-publication-reload';
      arc5OwnershipState = null;
      arc5OwnershipEvidence = null;
      arc5OwnershipProtection = 'committed-publication-reload';
      lastArc5BootstrapOutcome = 'committed-publication-reload';
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Arc 4 ${verb} committed; publication ${error instanceof Error ? error.message : String(error)}`,
      );
      return Object.freeze({
        kind: 'committed', durability: 'committed', convergence: 'read-only-reload',
        verb, detail: 'committed;publication-reload', result: null,
      });
    }
    lastArc4CaptureResult = null;
    return Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'none', verb,
      detail: error instanceof Error ? error.message : String(error), result: null,
    });
  } finally {
    productActionInFlight = false;
    actionClaim.settle(durable);
    if (activePersist === actionBarrier) activePersist = null;
  }
}

function captureActivePlayCountdown(activePlayMs: number): string {
  const seconds = Math.max(0, Math.ceil(activePlayMs / 1_000));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

function captureRowDetail(
  row: CapturePresentationReadyV1['verbs'][CaptureCardVerb],
): string {
  if (row.reason === 'natural-pool-empty') {
    return row.verb === 'tame' ? 'No fauna live here to tame.'
      : row.verb === 'scavenge' ? 'No flora or fungi live here to scavenge.'
        : 'No microbes live here to sample.';
  }
  if (row.reason === 'completed-this-cycle') {
    return row.verb === 'tame'
      ? 'Every eligible fauna species has already been tamed on this world this cycle. No attempt was spent.'
      : row.verb === 'scavenge'
        ? 'Every eligible flora or fungi species has already been scavenged on this world this cycle. No attempt was spent.'
        : 'Every eligible microbe species has already been sampled on this world this cycle. No attempt was spent.';
  }
  if (row.reason === 'biosphere-yield-depleted') {
    return 'Worked Out — no Biosphere Yield remains this cycle. No roll or attempt was spent.';
  }
  if (row.status === 'unavailable') {
    return row.reason === 'legacy-biosphere-unresolved'
      ? 'Legacy biosphere evidence for this world is protected. Nothing was spent.'
      : row.reason === 'future-cycle-progress'
        ? 'This world carries newer capture-cycle evidence. Nothing was spent.'
        : row.reason === 'revision-exhausted'
          ? 'The ownership ledger has reached its revision limit. Nothing was spent.'
          : 'The ownership ledger has no safe room for every possible result. Nothing was spent.';
  }
  return row.verb === 'tame'
    ? `Randomly attempts one of ${row.eligiblePoolCount} eligible fauna from the full biosphere. Success adds one owned creature.`
    : row.verb === 'scavenge'
      ? `Randomly attempts one of ${row.eligiblePoolCount} eligible flora or fungi from the full biosphere. Success adds one specimen lot.`
      : `Randomly attempts one of ${row.eligiblePoolCount} eligible microbes from the full biosphere. Success adds one specimen lot.`;
}

function captureCardModelFromPresentation(
  presentation: CapturePresentationReadyV1,
  contextKey: string,
  previewCount: number,
  unavailableDetail: string | null,
): CaptureCardReadModelV1 {
  const until = presentation.biosphereYield.activePlayMsUntilNextCycle;
  const recoveryDetail = until === null
    ? 'The bounded active-play clock cannot schedule another recovery cycle.'
    : `Tame, Scavenge, and Sample share Biosphere Yield. Every attempt spends 1, hit or miss. Full recovery at the next 20-minute active-play cycle — ${captureActivePlayCountdown(until)} of active play remaining. Closing the game does not advance recovery.`;
  const rows = Object.freeze(CAPTURE_CARD_VERB_ORDER.map((verb): CaptureCardOpportunityReadModel => {
    const projected = presentation.verbs[verb];
    const status = unavailableDetail !== null ? 'unavailable'
      : projected.status === 'ready' ? 'ready'
        : projected.status === 'depleted' ? 'depleted'
          : projected.status === 'empty' || projected.status === 'completed' ? 'empty'
            : 'unavailable';
    return Object.freeze({
      verb,
      status,
      eligibleCount: projected.eligiblePoolCount,
      overallChance: status === 'ready' ? projected.chance!.arithmeticMean : null,
      chanceMin: status === 'ready' ? projected.chance!.minimum : null,
      chanceMax: status === 'ready' ? projected.chance!.maximum : null,
      detail: unavailableDetail ?? captureRowDetail(projected),
    });
  }));
  return Object.freeze({
    schema: CAPTURE_CARD_READ_MODEL_SCHEMA,
    contextKey,
    summary: `Showing ${previewCount} of ${presentation.fullRosterCount} life forms. Capture draws from all ${presentation.fullRosterCount}, not only this preview. Each action chooses uniformly from every eligible species for that action in the full biosphere.`,
    budget: Object.freeze({
      yield: presentation.biosphereYield.total,
      used: presentation.biosphereYield.used,
      remaining: presentation.biosphereYield.remaining,
      cycle: presentation.biosphereYield.cycle,
      recoveryRemainingActivePlayMs: until ?? 0,
      recoveryDetail,
    }),
    rows,
  });
}

function captureCardUnavailableModel(
  contextKey: string,
  previewCount: number,
  fullRosterCount: number,
  detail: string,
): CaptureCardReadModelV1 {
  return Object.freeze({
    schema: CAPTURE_CARD_READ_MODEL_SCHEMA,
    contextKey,
    summary: `Showing ${previewCount} of ${fullRosterCount} life forms. Capture uses the full biosphere, never only this preview.`,
    budget: null,
    rows: Object.freeze(CAPTURE_CARD_VERB_ORDER.map((verb) => Object.freeze({
      verb,
      status: 'unavailable' as const,
      eligibleCount: 0,
      overallChance: null,
      chanceMin: null,
      chanceMax: null,
      detail,
    }))),
  });
}

function capturePresentationFenceForSurface(
  runtime: F4RuntimeAuthority,
  surface: NavState,
): string | null {
  if (surface.mode !== 'surface' || ecologyEpochBlocksActions()) return null;
  const address = canonicalCF1WorldAddressFromNav(surface);
  if (!address.ok) return null;
  const rosterResult = canonicalWorldRoster(address.address, currentEcologyEpoch());
  if (!rosterResult.ok) return null;
  const roster = rosterResult.roster;
  const composed = composeAcquisitionSnapshotV1({
    nav: surface,
    address: address.address,
    roster,
    ecologyEpoch: roster.ecologyEpoch,
    fullRosterFingerprint: roster.fullRosterFingerprint,
    extensions: runtime.extensions,
  });
  if (composed.kind !== 'ready') return null;
  return capturePresentationFenceV1(composed.snapshot, {
    observedActivePlayMs: runtime.diagnostics().activePlayMs,
  });
}

function refreshCaptureCardState(preparedRoster: CanonicalWorldRoster | null = null): void {
  if (!surveyOwnsCurrentCaptureSurface() || nav.mode !== 'surface') {
    currentCapturePresentationFence = null;
    captureCardController.setState(null);
    return;
  }
  const runtime = f4Runtime;
  const address = canonicalCF1WorldAddressFromNav(nav);
  if (!address.ok) {
    currentCapturePresentationFence = null;
    captureCardController.setState(null);
    return;
  }
  let roster: CanonicalWorldRoster;
  if (preparedRoster !== null) {
    if (preparedRoster.worldKey !== address.address.key
      || preparedRoster.ecologyEpoch !== currentEcologyEpoch()) {
      currentCapturePresentationFence = null;
      captureCardController.setState(null);
      return;
    }
    roster = preparedRoster;
  } else {
    const rosterResult = canonicalWorldRoster(address.address, currentEcologyEpoch());
    if (!rosterResult.ok) {
      currentCapturePresentationFence = null;
      captureCardController.setState(null);
      return;
    }
    roster = rosterResult.roster;
  }
  if (!planetsideMatchesFullRoster(roster)) fillPlanetside(nav, roster);
  if (!planetsideMatchesFullRoster(roster)) {
    currentCapturePresentationFence = null;
    captureCardController.setState(captureCardUnavailableModel(
      `${roster.worldKey}|epoch:${roster.ecologyEpoch}|${roster.fullRosterFingerprint}`,
      roster.view.preview.length,
      roster.view.total,
      'The visible Biosphere preview did not align with capture authority. Nothing was spent.',
    ));
    return;
  }
  const fallbackKey = `${roster.worldKey}|epoch:${roster.ecologyEpoch}|${roster.fullRosterFingerprint}`;
  if (runtime === null) {
    currentCapturePresentationFence = null;
    captureCardController.setState(captureCardUnavailableModel(
      fallbackKey, roster.view.preview.length, roster.view.total,
      'Capture authority is unavailable. Nothing was spent.',
    ));
    return;
  }
  const composed = composeAcquisitionSnapshotV1({
    nav,
    address: address.address,
    roster,
    ecologyEpoch: roster.ecologyEpoch,
    fullRosterFingerprint: roster.fullRosterFingerprint,
    extensions: runtime.extensions,
  });
  if (composed.kind !== 'ready') {
    currentCapturePresentationFence = null;
    captureCardController.setState(captureCardUnavailableModel(
      fallbackKey, roster.view.preview.length, roster.view.total,
      'Capture authority for this world could not be verified. Nothing was spent.',
    ));
    return;
  }
  const observedActivePlayMs = runtime.diagnostics().activePlayMs;
  const observation = { observedActivePlayMs };
  const presentation = projectCapturePresentationV1(composed.snapshot, observation);
  const presentationFence = capturePresentationFenceV1(composed.snapshot, observation);
  if (presentation.kind !== 'ready' || presentationFence === null) {
    currentCapturePresentationFence = null;
    captureCardController.setState(captureCardUnavailableModel(
      fallbackKey, roster.view.preview.length, roster.view.total,
      'Capture timing authority could not be verified. Nothing was spent.',
    ));
    return;
  }
  const unavailableDetail = arc4OwnershipState?.mode !== 'current'
    || arc4OwnershipProtection !== null
    || arc5OwnershipState?.mode !== 'current'
    || arc5OwnershipEvidence?.representationVersion !== ARC5_OWNERSHIP_MIGRATION_VERSION
    || arc5OwnershipProtection !== null
    ? 'Capture is unavailable while this expedition save is protected. Nothing was spent.'
    : ecologyEpochBlocksActions()
      ? 'The living biosphere is settling a new ecology epoch. Nothing was spent.'
    : !f4RuntimeMayMutate(runtime) || activePersist || importWriteInFlight
      || replacementTransaction || replacementReloadPending || trainingCheckpointWriteHeld
      || productActionCoordinator.busy
      ? 'Another expedition action is settling or save authority is read-only. Nothing was spent.'
      : null;
  captureCardController.setState(captureCardModelFromPresentation(
    presentation,
    fallbackKey,
    roster.view.preview.length,
    unavailableDetail,
  ));
  currentCapturePresentationFence = unavailableDetail === null ? presentationFence : null;
}

type SurveyFocusIdentity = Readonly<{
  kind: 'capture' | 'action' | 'close';
  key: string;
}>;

function captureSurveyFocusIdentity(): SurveyFocusIdentity | null {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement) || !card.contains(active)) return null;
  const captureControl = active.closest<HTMLElement>('[data-focus-key]');
  const captureKey = captureControl?.dataset.focusKey;
  if (captureKey) return Object.freeze({ kind: 'capture', key: captureKey });
  const action = active.closest<HTMLElement>('[data-act]')?.dataset.act;
  if (action) return Object.freeze({ kind: 'action', key: action });
  if (active.closest('[data-survey-close]')) return Object.freeze({ kind: 'close', key: 'close' });
  return null;
}

function restoreSurveyFocusIdentity(identity: SurveyFocusIdentity | null): void {
  if (identity === null || card.style.display === 'none') return;
  let target: HTMLElement | null = null;
  if (identity.kind === 'capture') {
    target = [...card.querySelectorAll<HTMLElement>('[data-focus-key]')]
      .find((candidate) => candidate.dataset.focusKey === identity.key) ?? null;
  } else if (identity.kind === 'action') {
    target = [...card.querySelectorAll<HTMLElement>('[data-act]')]
      .find((candidate) => candidate.dataset.act === identity.key) ?? null;
  } else target = card.querySelector<HTMLElement>('[data-survey-close]');
  (target ?? card.querySelector<HTMLElement>('[data-survey-close]'))?.focus();
}

function canonicalCurrentSurfaceRoster(): CanonicalWorldRoster | null {
  if (nav.mode !== 'surface') return null;
  const address = canonicalCF1WorldAddressFromNav(nav);
  if (!address.ok) return null;
  const result = canonicalWorldRoster(address.address, currentEcologyEpoch());
  return result.ok ? result.roster : null;
}

function suppressEcologyProjection(
  refreshToken: EcologyEpochProjectionRefreshToken | null = null,
): void {
  const outcome = refreshToken === null
    ? ecologyEpochAuthority.suppressProjection()
    : ecologyEpochAuthority.failProjectionRefresh(refreshToken);
  if (outcome.kind === 'invalid-token') ecologyEpochAuthority.suppressProjection();
  currentCapturePresentationFence = null;
  captureCardController.setState(null);
  clearPlanetside();
  invalidateSurveyTravel();
  hideSurvey();
  lastCard = null;
  cardCtx = null;
  try { clearWorld(); } catch { /* the convergence reload owns final cleanup */ }
}

function refreshCommittedEcologyProjection(): void {
  const begun = ecologyEpochAuthority.beginProjectionRefresh();
  if (begun.kind === 'current') return;
  if (begun.kind !== 'started') {
    throw new Error(`ecology projection refresh is ${begun.kind}`);
  }
  const refreshToken = begun.token;
  try {
    const focusIdentity = captureSurveyFocusIdentity();
    const cardWasOpen = card.style.display !== 'none';
    const planetContext = cardWasOpen ? cardCtx : null;
    const surfaceRoster = canonicalCurrentSurfaceRoster();
    const priorSceneSerial = renderedSceneReceipt.serial;
    currentCapturePresentationFence = null;
    buildCurrentSceneTransaction(surfaceRoster);
    if (renderedSceneReceipt.serial !== priorSceneSerial + 1
      || renderedSceneReceipt.mode !== nav.mode
      || renderedSceneReceipt.ecologyEpoch !== currentEcologyEpoch()) {
      throw new Error('ecology scene did not publish exactly one current-epoch receipt');
    }
    if (cardWasOpen && planetContext !== null) {
      const prepared = nav.mode === 'surface'
        && getProvenPlanetKey(nav.planet) === getProvenPlanetKey(planetContext.planet)
        ? surfaceRoster : null;
      if (!presentPlanetSurvey(
        planetContext.p,
        planetContext.star,
        planetContext.planet,
        prepared,
      )) {
        invalidateSurveyTravel();
        hideSurvey();
        lastCard = null;
        cardCtx = null;
      }
      restoreSurveyFocusIdentity(focusIdentity);
    } else if (cardWasOpen) {
      /* Generic/decorative cards currently retain no source-proven selector.
         Closing is the only honest invalidation after their scene objects are
         replaced; a stale transient descriptor must not survive the edge. */
      invalidateSurveyTravel();
      hideSurvey();
      lastCard = null;
      cardCtx = null;
      if (focusIdentity !== null) app.canvas.focus();
    }
    if (card.style.display !== 'none'
      && card.dataset.ecologyEpoch !== String(currentEcologyEpoch())) {
      throw new Error('Survey retained a stale ecology epoch');
    }
    if (surfaceRoster !== null && !planetsideMatchesFullRoster(surfaceRoster)) {
      throw new Error('Planetside retained a stale ecology roster');
    }
    const completed = ecologyEpochAuthority.completeProjectionRefresh(refreshToken);
    if (completed.kind !== 'current') {
      throw new Error('ecology projection lost its exact refresh token');
    }
  } catch (error) {
    suppressEcologyProjection(refreshToken);
    throw error;
  }
}

function publishCommittedEcologyEpoch(publication: EcologyEpochPublication): void {
  const projection = ecologyEpochAuthority.projection();
  if (publication.epoch !== currentEcologyEpoch()
    || projection.publishedEpoch !== publication.epoch
    || projection.state !== 'dirty') {
    throw new Error('committed ecology publication did not enter the dirty projection lifecycle');
  }
  (globalThis as Record<string, unknown>).COSMIC_EPOCH = publication.epoch;
  lastEcologyEdgeOutcome = `committed:${publication.fromEpoch}->${publication.epoch}:revision:${publication.revision}`;
}

function captureOutcomeCopy(outcome: Arc4CaptureActionOutcome): CaptureCardActionOutcome {
  const verb = outcome.verb as CaptureCardVerb;
  if (outcome.kind === 'committed' && outcome.result !== null) {
    const result = outcome.result;
    const chance = formatCaptureChancePercentV1(result.chance);
    if (!result.hit) {
      return Object.freeze({
        schema: CAPTURE_CARD_OUTCOME_SCHEMA,
        kind: 'committed-miss', verb, convergence: 'none',
        title: `${result.speciesName} slipped away.`,
        detail: `${chance} odds. No page, creature, specimen, or Stardust was added. 1 Biosphere Yield spent; ${result.remainingAfter} remain.`,
      });
    }
    const past = verb === 'tame' ? 'Tamed' : verb === 'scavenge' ? 'Scavenged' : 'Sampled';
    const owned = verb === 'tame' ? 'one owned creature' : 'one specimen lot';
    const discovery = result.firstForSpecies
      ? `New Compendium page; ${owned}.`
      : `${owned[0]!.toUpperCase()}${owned.slice(1)} added. Its Compendium page and first-find reward were already earned.`;
    const reward = result.stardustReward > 0
      ? ` Rare Find: +${result.stardustReward} Stardust.` : '';
    return Object.freeze({
      schema: CAPTURE_CARD_OUTCOME_SCHEMA,
      kind: 'committed-hit', verb, convergence: 'none',
      title: `${past} ${result.firstForSpecies ? '' : 'another '}${result.speciesName}.`,
      detail: `${chance} odds. ${discovery}${reward} 1 Biosphere Yield spent; ${result.remainingAfter} remain.`,
    });
  }
  if (outcome.kind === 'committed') {
    return Object.freeze({
      schema: CAPTURE_CARD_OUTCOME_SCHEMA,
      kind: 'committed-unknown', verb, convergence: 'read-only-reload',
      title: 'Capture committed.',
      detail: 'The durable result is reloading for exact publication. Do not try again.',
    });
  }
  const detail = outcome.convergence === 'read-only-reload'
    ? 'Save authority changed. Nothing was published here; the expedition is reloading read-only and will not retry this attempt.'
    : outcome.detail === 'presentation:changed'
      ? 'Capture opportunities changed before the roll. Nothing was spent; the card now shows current odds and availability.'
      : outcome.detail.includes('depleted')
      ? 'Worked Out — no Biosphere Yield remains this cycle. No roll or attempt was spent.'
      : outcome.detail.includes('empty')
        ? 'No eligible species remain for this action this cycle. No attempt was spent.'
        : outcome.detail.includes('storage') || outcome.detail.includes('save')
          ? 'The expedition could not be saved. Nothing was spent.'
          : outcome.detail.includes('pending')
            ? 'Another expedition action is settling. Nothing was spent.'
            : 'Capture authority was unavailable. Nothing was spent.';
  return Object.freeze({
    schema: CAPTURE_CARD_OUTCOME_SCHEMA,
    kind: outcome.kind === 'refused' ? 'refused' : 'unavailable',
    verb,
    convergence: outcome.convergence,
    title: outcome.convergence === 'read-only-reload' ? 'Reload required.' : 'Capture unavailable.',
    detail,
  });
}

async function runCaptureCardAction(
  request: CaptureCardActionRequest,
  presentationFence: string | null,
): Promise<void> {
  let outcome: Arc4CaptureActionOutcome;
  try {
    outcome = presentationFence === null
      ? Object.freeze({
        kind: 'unavailable' as const,
        durability: 'none' as const,
        convergence: 'none' as const,
        verb: request.verb,
        detail: 'presentation-authority-unavailable',
        result: null,
      })
      : await commitArc4CaptureAction(request.verb, presentationFence);
  } catch (error) {
    outcome = Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'none', verb: request.verb,
      detail: error instanceof Error ? error.message : String(error), result: null,
    });
  }
  const copy = captureOutcomeCopy(outcome);
  try {
    captureCardController.settle(copy);
    /* Settle the exact pending verb before refreshing opportunity authority.
       A genuine ecology-context change may replace an IDLE receipt, but it
       must never strand a completed transaction behind the controller's
       deliberate pending-context guard. A converging document stays latched
       on its terminal copy until replacement. */
    if (copy.convergence === 'none') refreshCaptureCardState();
    if (outcome.kind === 'committed' && outcome.result !== null) {
      updateChips();
      if (openPanelId() === 'codex') fillCodex(codexFilter);
    }
    const greetingClaim: TameGreetingClaim | null = tameGreetingAudioOwner
      ?.claimCommittedTameGreeting(outcome, arc5OwnershipState) ?? null;
    toast(copy.title, copy.detail, true);
    if (greetingClaim !== null) {
      const counterpart = bindTameToastCounterpart(
        greetingClaim.eventKey,
        copy.title,
        copy.detail,
      );
      if (counterpart === null) {
        tameGreetingAudioOwner?.cancelTameAttempt('counterpart-unavailable');
      } else {
        void tameGreetingAudioOwner?.playClaimedTameGreeting(greetingClaim, counterpart);
      }
    }
  } catch (error) {
    tameGreetingAudioOwner?.cancelTameAttempt('presentation-fault');
    const detail = error instanceof Error ? error.message : String(error);
    if (outcome.durability === 'committed' && f4Runtime !== null) {
      lastArc4CaptureResult = null;
      arc4OwnershipState = null;
      arc4OwnershipProtection = 'committed-publication-reload';
      arc5OwnershipState = null;
      arc5OwnershipEvidence = null;
      arc5OwnershipProtection = 'committed-publication-reload';
      lastArc5BootstrapOutcome = 'committed-publication-reload';
      lastArc4CaptureOutcome = `${request.verb}-committed-publication-reload`;
      scheduleF4AuthorityConvergenceReload(
        f4Runtime,
        `Arc 4 ${request.verb} committed; capture presentation ${detail}`,
      );
      return;
    }
    captureCardController.setPending(null);
    toast('Capture presentation unavailable', 'Nothing was spent. Reopen Survey to try again.', true);
  }
}

function engineeringOutcomeConverges(outcome: Arc3AppActionOutcome): boolean {
  return outcome.detail.includes('publication-reload')
    || outcome.detail === 'stale'
    || outcome.detail === 'duplicate-receipt'
    || outcome.detail === 'lost'
    || outcome.detail === 'lease-unavailable'
    || outcome.detail === 'protected';
}

/** One main-owned single-flight coordinator serves every Engineering control.
 * The controller emits synchronously and retains no promise or durable fact;
 * this owner clears its latch only after a terminal non-converging outcome. */
async function runEngineeringPanelAction(request: EngineeringPanelActionRequest): Promise<void> {
  let outcome: Arc3AppActionOutcome;
  try {
    outcome = request.operation === 'mine'
      ? await mineCurrentSurface()
      : request.operation === 'skim'
        ? await skimCurrentSystem()
        : request.operation === 'research' && request.id !== undefined
          ? await purchaseEngineeringResearch(request.id)
          : request.operation === 'fabricate' && request.id !== undefined
            ? await fabricateFixedEngineeringRecipe(request.id)
            : Object.freeze({
              kind: 'unavailable',
              operation: request.operation === 'research' ? 'purchase-research' : 'fabricate-fixed',
              detail: 'engineering-action-id-missing',
              result: null,
            });
  } catch (error) {
    outcome = Object.freeze({
      kind: 'refused',
      operation: request.operation === 'mine' ? 'mine-world'
        : request.operation === 'skim' ? 'skim-star'
          : request.operation === 'research' ? 'purchase-research'
            : 'fabricate-fixed',
      detail: error instanceof Error ? error.message : String(error),
      result: null,
    });
  }

  if (engineeringPanelReleased) return;
  const converging = engineeringOutcomeConverges(outcome);
  /* Every settlement replaces the carrier/read-model snapshot. A converging
     authority outcome paints unavailable truth but intentionally retains the
     pending latch until the committed/stale document reloads. */
  refreshEngineeringPanelState();
  if (!converging) {
    /* A refusal may follow a fresh carrier preflight that invalidated the
       model painted before the press. Rebuild before unlocking for every
       ordinary settlement, not only after a successful commit. */
    engineeringPanelController.setPending(null);
  }
  if (outcome.kind === 'committed' && !converging) {
    updateChips();
    if (outcome.operation === 'purchase-research') refreshPlanetSurveyCard();
    if (openPanelId() === 'ch') fillCharters();
    toast('Engineering committed', 'The durable expedition record now reflects this action.', true);
  } else if (outcome.kind !== 'committed' && !converging) {
    toast('Engineering unavailable', outcome.detail, true);
  }
}

async function smokeCommitF4Outcome(): Promise<unknown> {
  /* Browser evidence only: exercise the real receipt-bearing F4 transaction
     without inventing an Arc product writer. The detached canonical draft is
     returned unchanged, while RNG, clock, receipt and revision still commit
     through the production lease-fenced owner exactly once. */
  const runtime = f4Runtime;
  if (!f4RuntimeMayMutate(runtime) || activePersist || importWriteInFlight
    || replacementTransaction || replacementReloadPending) {
    return Object.freeze({ schema: 'cf-v2-f4-smoke-outcome/v1', kind: 'unavailable' });
  }
  await settleF4Heartbeat();
  const before = runtime.diagnostics();
  const outcome = await runtime.commitOutcome({
    state: save,
    domain: 'diagnostics.slice-smoke.f4',
    receiptKind: 'slice-smoke-f4-outcome',
    codecNow: Date.now(),
    derive: ({ draft, value, receiptOrdinal }) => ({
      state: draft,
      witness: `slice-smoke-f4:${receiptOrdinal}:${value}`,
    }),
  });
  const after = runtime.diagnostics();
  if (outcome.kind === 'committed') {
    lastPersistenceOutcome = `outcome-committed:${outcome.revision}`;
    f4LastCheckpointAt = performance.now();
  }
  return Object.freeze({
    schema: 'cf-v2-f4-smoke-outcome/v1',
    kind: outcome.kind,
    beforeRevision: before.revision,
    afterRevision: after.revision,
    beforeOrdinal: before.sessionOrdinal,
    afterOrdinal: after.sessionOrdinal,
    ...(outcome.kind === 'committed' ? {
      revision: outcome.revision,
      plan: Object.freeze({
        domain: outcome.plan.domain,
        value: outcome.plan.value,
        receiptOrdinal: outcome.plan.receiptOrdinal,
      }),
      receipt: outcome.receipt,
      canonicalProduct: Object.freeze({
        explorerName: outcome.state.explorerName,
        essence: outcome.state.essence,
        landedCount: outcome.state.landed.length,
      }),
    } : {}),
  });
}
function smokeArmImportRace(staleRaw: string): boolean {
  /* Diagnostics-only ordering witness. The armed active persist commits its
     stale snapshot through the same lease-fenced revision boundary as play.
     A valid import started before release must await that revision, then CAS
     its replacement from the newly observed parent. */
  if (activePersist || importWriteInFlight || smokeImportRaceRelease || !f4RuntimeMayMutate()) return false;
  const imported = importSaveV2(staleRaw, REGISTRY, Date.now());
  if (!imported.ok) return false;
  let releaseGate: (() => void) | null = null;
  const gate = new Promise<void>((resolve) => { releaseGate = resolve; });
  const run = gate.then(async () => {
    const beforeRevision = f4Runtime!.revision;
    const outcome = await f4Runtime!.commit(imported.state, Date.now());
    lastSmokeImportRaceWitness = Object.freeze({
      beforeRevision,
      afterRevision: f4Runtime!.revision,
      outcome: outcome.kind,
    });
    return outcome.kind === 'committed';
  });
  activePersist = run;
  smokeImportRaceRelease = () => {
    const release = releaseGate;
    smokeImportRaceRelease = null;
    release?.();
  };
  void run.then(
    () => { if (activePersist === run) activePersist = null; },
    () => { if (activePersist === run) activePersist = null; },
  );
  return true;
}
function smokeReleaseImportRace(): boolean {
  const release = smokeImportRaceRelease;
  if (!release) return false;
  release();
  return true;
}
async function smokeStageStoredV4(raw: string | null, backup?: string): Promise<boolean> {
  /* Browser-gate fixture setup only. A v4 fixture must represent a genuinely
     pre-migration database; overwriting only the compatibility mirror under
     a live v5 schema is correctly classified as corruption. Quiesce this
     document, wipe every authoritative store, then stage the exact old bytes
     for the NEXT document's real migration path. */
  if ((raw !== null && typeof raw !== 'string') || activePersist || importWriteInFlight
    || replacementTransaction || replacementReloadPending) return false;
  stopF4Heartbeat();
  f4Runtime?.setAnswerable(false);
  await settleF4Heartbeat();
  await f4Runtime?.release();
  f4Runtime = null;
  persistHold = 'protected-payload';
  await persistenceBackend.clear(STORES);
  if (raw !== null) {
    await persistenceBackend.apply([
      { store: 'meta', key: 'save', value: raw },
      ...(backup === undefined ? [] : [{ store: 'meta' as const, key: 'save_bak', value: backup }]),
    ]);
  }
  return true;
}
function persistSoon(): void {
  /* slider-friendly: one export per drag, not one per input event (audit #5) */
  if (replacementReloadPending) return;
  clearTimeout(_persistT);
  _persistT = window.setTimeout(() => {
    /* The timeout id describes a pending debounce, not the last timeout that
       happened to run. Replacement rollback consults this sentinel before it
       decides whether a canceled settings write needs to be re-armed. */
    _persistT = 0;
    void persistView();
  }, 400);
}
let persistHold: false | 'transient-read' | 'protected-payload' = false;
let persistRetrying = false;
let smokeForceReadOnly = false;
let mutationBlockCount = 0;
let lastMutationBlockWitness: Readonly<{
  schema: 'cf-v2-read-only-boundary/v1'; action: string; count: number;
  hold: false | 'transient-read' | 'protected-payload'; leaseOwned: boolean;
  staleBlocked: boolean; seedBootstrapPending: boolean; bootRouteRepairPending: boolean;
  ownershipV2BootstrapPending: boolean;
}> | null = null;
const READ_ONLY_MUTATION_SELECTOR = [
  '#dockcharts', '#setsnd', '#setvol', '[data-pref]', '[data-motion]',
  '#setcharts', '#setglass', '#setrestart',
  '[data-act="landcta"]', '[data-act="add"]',
  '[data-capture-action]',
  '[data-sel="tutbtn"]', '[data-sel="tutskip"]',
].join(',');
function playerMutationsBlocked(): boolean {
  return smokeForceReadOnly || productActionInFlight || !f4RuntimeMayMutate();
}
function blockRouteChangeWhileProductAction(): boolean {
  if (!productActionInFlight) return false;
  toast(
    'Expedition action settling',
    'Stay on this location until its durable result settles. Survey Close remains available.',
  );
  return true;
}
function blockPlayerMutation(action: string): boolean {
  if (!playerMutationsBlocked()) return false;
  const runtime = f4Runtime?.diagnostics() ?? null;
  lastMutationBlockWitness = Object.freeze({
    schema: 'cf-v2-read-only-boundary/v1', action, count: ++mutationBlockCount,
    hold: persistHold, leaseOwned: runtime?.leaseOwned === true,
    staleBlocked: runtime?.staleBlocked === true,
    seedBootstrapPending: f4SeedBootstrapPending,
    bootRouteRepairPending,
    ownershipV2BootstrapPending: arc5OwnershipBootstrapPending,
  });
  toast('Read-only expedition', 'Inspection remains available, but this action cannot change the expedition until save authority is restored.', true);
  return true;
}
const guardReadOnlyMutationEvent = (event: Event): void => {
  const target = event.target instanceof Element
    ? event.target.closest<HTMLElement>(READ_ONLY_MUTATION_SELECTOR) : null;
  if (!target || !blockPlayerMutation(`${event.type}:${target.id || target.dataset.act || target.dataset.sel || target.tagName}`)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
};
document.addEventListener('click', guardReadOnlyMutationEvent, true);
document.addEventListener('input', guardReadOnlyMutationEvent, true);
document.addEventListener('change', guardReadOnlyMutationEvent, true);

type PreparedTrainingCandidate = Readonly<{
  raw: string;
  state: SaveStateV2;
  ingress: ImportRouteIngressV2;
  nav: NavState;
  atlasRoutes: WeakMap<Record<string, unknown>, NavState>;
}>;

function prepareTrainingCandidate(
  candidate: SaveStateV2,
  now: number,
  expectedEarthKey: string | null,
): PreparedTrainingCandidate | null {
  /* First import the candidate before its one real write. This gives route
     evidence the exact entry-object identities that a reload would see. */
  const firstRaw = exportSaveV2(candidate, now);
  const first = importSaveV2(firstRaw, REGISTRY, now);
  if (!first.ok) return null;
  const firstSavedRoute = resolveViewToNav(
    first.ingress.savedView === undefined ? null : first.ingress.savedView,
  );
  if (!firstSavedRoute.ok
    || navigationAuthorityFailureFor(
      first.state,
      firstSavedRoute.state,
      SHIP_LIVERY_SEED,
    ) !== null) return null;
  first.state.savedView = navToView(firstSavedRoute.state);

  /* Mirror boot's F2 boundary on the detached copy. Atlas history remains
     visible when source proof fails transiently; deterministic invalid rows
     lose only their action route. Reach is intentionally checked on click. */
  for (const [, entry] of first.state.logMap) {
    const rawWhere = first.ingress.atlasWhere.get(entry);
    if (rawWhere === null || rawWhere === undefined) {
      entry.where = null;
      continue;
    }
    const route = resolveViewToNav(rawWhere);
    if (route.ok && route.state.mode !== 'universe') entry.where = navToView(route.state);
    else if (route.ok || route.reason !== 'source-error') entry.where = null;
  }

  /* Export once more after field-local route repair, then bind runtime proof
     only to this final import's exact objects. These are the exact bytes the
     single repository transaction will commit. */
  const raw = exportSaveV2(first.state, now);
  const final = importSaveV2(raw, REGISTRY, now);
  if (!final.ok) return null;
  const savedRoute = resolveViewToNav(
    final.ingress.savedView === undefined ? null : final.ingress.savedView,
  );
  if (!savedRoute.ok
    || navigationAuthorityFailureFor(
      final.state,
      savedRoute.state,
      SHIP_LIVERY_SEED,
    ) !== null) return null;
  const atlasRoutes = new WeakMap<Record<string, unknown>, NavState>();
  let earthKey: string | null = null;
  for (const [id, entry] of final.state.logMap) {
    const rawWhere = final.ingress.atlasWhere.get(entry);
    if (rawWhere === null || rawWhere === undefined) continue;
    const route = resolveViewToNav(rawWhere);
    if (!route.ok || route.state.mode === 'universe') continue;
    atlasRoutes.set(entry, route.state);
    if (id === 'p133' && route.state.mode === 'surface') {
      earthKey = getProvenPlanetKey(route.state.planet);
    }
  }
  if (expectedEarthKey !== null && earthKey !== expectedEarthKey) return null;
  return Object.freeze({
    raw,
    state: final.state,
    ingress: final.ingress,
    nav: savedRoute.state,
    atlasRoutes,
  });
}

async function completeTraining(intent: TrainingEndIntent): Promise<TrainingEndResult> {
  const checkpoint = trainingSnapshotIngress;
  const operationId = `${DOCUMENT_TOKEN}:${++trainingRestoreOperationSerial}`;
  let sequence = 0;
  const phase = (stage: TrainingRestoreStage, error: string | null = null): void => {
    const witness: TrainingRestoreWitness = {
      schema: 'cf-v2-training-restore/v1', operationId, documentToken: DOCUMENT_TOKEN,
      intent, checkpointKind: checkpoint.kind, stage, sequence: ++sequence,
      tickerStarted: app.ticker?.started === true,
      performanceNow: performance.now(), error,
    };
    lastTrainingRestoreWitness = witness;
    try {
      const binding = (window as unknown as Record<string, unknown>).__cfTrainingRestoreWitness;
      if (typeof binding === 'function') (binding as (payload: string) => unknown)(JSON.stringify(witness));
    } catch { /* optional diagnostics are fail-closed in the browser harness */ }
  };
  phase('invoked');

  if (checkpoint.kind === 'legacy-or-unknown') {
    phase('validation-rejected', 'unknown-snapshot');
    return { kind: 'refused', reason: 'unknown-snapshot' };
  }
  if (!f4RuntimeMayMutate()) {
    phase('validation-rejected', 'protected-storage');
    return { kind: 'refused', reason: 'protected-storage' };
  }
  const replacement = claimReplacementTransaction('training-complete');
  if (!replacement) {
    phase('claim-rejected', 'busy');
    return { kind: 'refused', reason: 'busy' };
  }
  phase('claimed');

  let writeStarted = false;
  let durablyWritten = false;
  let durableOutcome: TrainingEndResult = { kind: 'completed' };
  try {
    const priorPersist = activePersist;
    if (priorPersist) {
      phase('waiting-active-persist');
      await priorPersist.catch(() => false);
      phase('active-persist-settled');
    } else phase('no-active-persist');
    await settleF4Heartbeat();

    phase('candidate-started');
    const now = Date.now();
    const epoch = currentEcologyEpoch();
    const liveView = savedRouteWriteHeld ? save.savedView : navToView(nav);
    const baseRaw = exportSaveV2({ ...save, EPOCH_BASE: epoch, savedView: liveView }, now);
    const base = importSaveV2(baseRaw, REGISTRY, now);
    if (!base.ok) throw new Error('detached Training candidate did not import');

    let candidate = base.state;
    let expectedEarthKey: string | null = null;
    let outcome: TrainingEndResult = { kind: 'completed' };
    let targetNav: NavState = nav;
    let legacyGearRestored = false;

    if (checkpoint.kind === 'current-view') {
      const restored = smokeRejectNextTrainingRouteResolution
        ? (smokeRejectNextTrainingRouteResolution = false,
            { ok: false as const, reason: 'source-error' as const })
        : resolveViewToNav(checkpoint.view);
      if (!restored.ok && restored.reason === 'source-error') {
        const retryNav = searchTravel.trainingSolSystemNav();
        if (!retryNav) throw new Error('Training retry route to Sol could not be proven');
        candidate.tutDone = false;
        /* `checkpoint.view` is deliberately only the bounded route-proof
           projection. The detached imported candidate retains the complete
           bounded one-key checkpoint, including legacy display metadata; a
           transient source failure must preserve those exact bytes. */
        candidate.tutSnapPending = base.state.tutSnapPending;
        candidate.savedView = navToView(retryNav);
        targetNav = retryNav;
        outcome = { kind: 'deferred', reason: 'source-error' };
        phase('source-deferred');
      } else {
        const authorized = restored.ok
          && navigationAuthorityFailureFor(candidate, restored.state, SHIP_LIVERY_SEED) === null;
        targetNav = authorized ? restored.state : NAV_HOME;
        candidate.savedView = authorized ? navToView(restored.state) : null;
        candidate.tutDone = true;
        candidate.tutSnapPending = null;
      }
    } else if (checkpoint.kind === 'legacy-v1') {
      const earth = smokeRejectNextTrainingRouteResolution
        ? (smokeRejectNextTrainingRouteResolution = false,
            { ok: false as const, reason: 'source-error' as const })
        : searchTravel.trainingEarthSurfaceNav();
      if (!earth.ok) {
        if (earth.reason !== 'source-error') throw new Error('legacy Earth route is unavailable');
        const retryNav = searchTravel.trainingSolSystemNav();
        if (!retryNav) throw new Error('Training retry route to Sol could not be proven');
        candidate.tutDone = false;
        candidate.tutSnapPending = checkpoint.snapshot;
        candidate.savedView = navToView(retryNav);
        targetNav = retryNav;
        outcome = { kind: 'deferred', reason: 'source-error' };
        phase('source-deferred');
      } else {
        expectedEarthKey = getProvenPlanetKey(earth.state.planet);
        const restored = buildLegacyTrainingRestoreCandidate({
          current: candidate,
          checkpoint: checkpoint.snapshot,
          registry: REGISTRY,
          now,
          epoch,
          canonicalEarthView: navToView(earth.state)!,
          completionView: navToView(targetNav),
        });
        if (!restored.ok || expectedEarthKey === null) {
          throw new Error('legacy Training checkpoint candidate was rejected');
        }
        candidate = restored.state;
        legacyGearRestored = true;
        if (navigationAuthorityFailureFor(candidate, targetNav, SHIP_LIVERY_SEED) !== null) {
          targetNav = NAV_HOME;
          candidate.savedView = null;
        }
        phase('earth-proven');
      }
    } else {
      candidate.tutDone = true;
      candidate.tutSnapPending = null;
      if (navigationAuthorityFailureFor(candidate, targetNav, SHIP_LIVERY_SEED) !== null) {
        targetNav = NAV_HOME;
      }
      candidate.savedView = navToView(targetNav);
    }
    candidate.EPOCH_BASE = epoch;

    const prepared = smokeRejectNextTrainingCandidateProof
      ? (smokeRejectNextTrainingCandidateProof = false, null)
      : prepareTrainingCandidate(candidate, now, expectedEarthKey);
    if (!prepared) {
      throw new Error('Training replacement candidate failed source proof');
    }
    /* A transient route-source deferral retains the checkpoint and outer
       expedition; it did not restore `it`/`eq`/`ea`, so it must retain the
       current exact-instance carrier too. */
    const preparedLoot = prepareTrainingArc2Restore(
      checkpoint.kind,
      legacyGearRestored,
      prepared.state,
      f4Runtime!.extensions,
    );
    if (preparedLoot !== null && preparedLoot.kind !== 'prepared') {
      throw new Error(`Training Arc 2 carrier refused: ${preparedLoot.reason}`);
    }
    const arc4Preparation = prepareTrainingArc4Restore(
      outcome.kind === 'deferred' ? 'source-deferred' : checkpoint.kind,
      legacyGearRestored,
      prepared.state,
      preparedLoot?.extensions ?? f4Runtime!.extensions,
    );
    if (arc4Preparation !== null && arc4Preparation.kind !== 'prepared') {
      throw new Error(`Training Arc 4 carrier refused: ${arc4Preparation.reason}`);
    }
    const preparedOwnership: PreparedTrainingArc4Restore | null = arc4Preparation;
    if (checkpoint.kind === 'legacy-v1' && legacyGearRestored
      && preparedOwnership === null) {
      throw new Error('Training Arc 4 carrier preparation disappeared');
    }
    const arc5Preparation = prepareTrainingArc5Restore({
      checkpointKind: outcome.kind === 'deferred' ? 'source-deferred' : checkpoint.kind,
      legacyFieldsRestored: legacyGearRestored,
      baseExtensions: preparedLoot?.extensions ?? f4Runtime!.extensions,
      arc4Preparation: preparedOwnership,
    });
    if (arc5Preparation.kind === 'protected') {
      arc5OwnershipState = null;
      arc5OwnershipEvidence = null;
      arc5OwnershipProtection = `training:${arc5Preparation.reason}`;
      lastArc5BootstrapOutcome = 'training-protected';
      throw new Error(`Training Arc 5 authority refused: ${arc5Preparation.reason}`);
    }
    phase('primary-write-started');
    writeStarted = true;
    let trainingCommittedState: SaveStateV2 | null = null;
    const write = (async (): Promise<boolean> => {
      if (smokeRejectNextTrainingCommit) {
        smokeRejectNextTrainingCommit = false;
        throw new Error('slice-smoke injected Training commit rejection');
      }
      const committed = await f4Runtime!.commit(
        prepared.state,
        now,
        preparedLoot === null && preparedOwnership === null
          && arc5Preparation.kind !== 'prepared'
          ? undefined
          : [
            ...(preparedLoot === null ? [] : [preparedLoot.write]),
            ...(preparedOwnership === null ? [] : preparedOwnership.writes),
            ...(arc5Preparation.kind === 'prepared' ? arc5Preparation.writes : []),
          ],
      );
      lastPersistenceOutcome = committed.kind === 'committed'
        ? `training-committed:${committed.revision}` : `training-${committed.kind}`;
      if (committed.kind !== 'committed') {
        if (committed.kind === 'stale') {
          persistHold = 'protected-payload';
          persistenceProtectedDetail = `stale revision ${committed.expectedRevision}/${committed.actualRevision}`;
        }
        throw new Error(`Training versioned commit refused: ${committed.kind}`);
      }
      trainingCommittedState = committed.saved.canonicalState;
      return true;
    })();
    activePersist = write;
    try { await write; }
    finally { if (activePersist === write) activePersist = null; }
    durablyWritten = true;
    durableOutcome = outcome;
    phase('primary-write-complete');

    /* Publish only after durability. All route proof is bound to the final
       import's exact objects; the global descriptor seam keeps its one Map. */
    if (smokeRejectNextTrainingPublish) {
      smokeRejectNextTrainingPublish = false;
      throw new Error('slice-smoke injected post-durable Training publication failure');
    }
    let restoredLoot: Arc2LootStateV1 | null = null;
    if (preparedLoot !== null) {
      restoredLoot = committedTrainingArc2State(
        prepared.state,
        preparedLoot,
        f4Runtime!.extensions,
      );
      if (!restoredLoot) {
        throw new Error('Training Arc 2 carrier did not converge with restored checkpoint gear');
      }
    }
    let restoredOwnership: OwnershipStateV1 | null = null;
    if (preparedOwnership !== null) {
      if (trainingCommittedState === null) {
        throw new Error('Training committed state disappeared before Arc 4 verification');
      }
      restoredOwnership = committedTrainingArc4State(
        trainingCommittedState,
        preparedOwnership,
        f4Runtime!.extensions,
      );
      if (restoredOwnership === null) {
        throw new Error('Training Arc 4 carrier did not converge with restored ownership');
      }
      publishArc4LegacyCompatibilityFields(prepared.state, trainingCommittedState);
    }
    let restoredOwnershipV2: OwnershipStateV2 | null = null;
    let restoredOwnershipV2Evidence: Arc5OwnershipMigrationEvidence | null = null;
    if (arc5Preparation.kind === 'prepared') {
      const committedOwnershipV2 = committedTrainingArc5State(
        arc5Preparation,
        f4Runtime!.extensions,
      );
      if (committedOwnershipV2 === null) {
        throw new Error('Training Arc 5 compact carrier did not converge with restored ownership');
      }
      restoredOwnershipV2 = committedOwnershipV2.state;
      restoredOwnershipV2Evidence = committedOwnershipV2.evidence;
    } else {
      const loadedOwnershipV2 = readArc5OwnershipMigration(
        f4Runtime!.extensions,
        SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      );
      if (arc5Preparation.state === null) {
        if (arc5Preparation.evidence !== null || loadedOwnershipV2.kind !== 'absent') {
          throw new Error('Training deferred Arc 5 authority did not remain absent');
        }
      } else {
        if (loadedOwnershipV2.kind !== 'loaded'
          || ownershipStateDigestV2(loadedOwnershipV2.state)
            !== ownershipStateDigestV2(arc5Preparation.state)
          || JSON.stringify(loadedOwnershipV2.evidence)
            !== JSON.stringify(arc5Preparation.evidence)) {
          throw new Error('Training preserved Arc 5 authority did not converge');
        }
        restoredOwnershipV2 = loadedOwnershipV2.state;
        restoredOwnershipV2Evidence = loadedOwnershipV2.evidence;
      }
    }
    save = prepared.state;
    if (restoredLoot) {
      arc2LootState = restoredLoot;
      arc2LootProtection = null;
      arc2LootBootstrapPending = false;
      inventoryPanelController.setState(arc2LootState);
    }
    if (restoredOwnership !== null) {
      arc4OwnershipState = restoredOwnership;
      arc4OwnershipProtection = restoredOwnership.mode === 'current'
        ? null : 'legacy-protected';
      arc4OwnershipBootstrapPending = false;
      lastArc4BootstrapOutcome = 'training-committed-published';
    }
    arc5OwnershipState = restoredOwnershipV2;
    arc5OwnershipEvidence = restoredOwnershipV2Evidence;
    arc5OwnershipBootstrapPrepared = null;
    arc5OwnershipBootstrapPending = false;
    if (restoredOwnershipV2 === null) {
      arc5OwnershipProtection = 'training-deferred:source-deferred';
      lastArc5BootstrapOutcome = 'training-deferred';
    } else {
      arc5OwnershipProtection = restoredOwnershipV2.mode === 'current'
        ? null : 'legacy-protected';
      lastArc5BootstrapOutcome = restoredOwnershipV2.mode === 'current'
        ? 'training-committed-published' : 'training-committed-protected';
    }
    importedRouteIngress = prepared.ingress;
    trainingSnapshotIngress = prepared.ingress.trainingSnapshot;
    trainingCheckpointWriteHeld = trainingSnapshotIngress.kind !== 'none';
    atlasRouteStates = prepared.atlasRoutes;
    nav = prepared.nav;
    savedRouteWriteHeld = false;
    syncCustomNameIndex();
    rerender({ skipPersist: true });
    phase('live-swap-complete');

    if (outcome.kind === 'deferred') {
      /* The durable incomplete candidate opens Welcome from proven Sol in a
         fresh document. Queue release so Training can tear down first. */
      setTimeout(() => {
        phase('reload-scheduled');
        scheduleReplacementReload(replacement);
      }, 0);
    } else {
      /* Completion resolves only after replacement ownership is released.
         Training's awaiting continuation tears down its inert/focus scope in
         the same microtask checkpoint, before any input task or restarted
         animation frame can observe a writable-but-still-owned app. */
      releaseReplacementTransaction(replacement, false);
      phase('released');
      setTimeout(flushPendingReleaseBulletin, 20);
    }
    return outcome;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (durablyWritten) {
      /* A publication/render exception after the one durable write cannot be
         reported as a retryable refusal: retrying would write twice. Converge
         from the committed primary in a fresh document instead. */
      arc4OwnershipState = null;
      arc4OwnershipProtection = 'committed-publication-reload';
      lastArc4BootstrapOutcome = 'committed-publication-reload';
      arc5OwnershipState = null;
      arc5OwnershipEvidence = null;
      arc5OwnershipProtection = 'committed-publication-reload';
      lastArc5BootstrapOutcome = 'committed-publication-reload';
      phase('reload-scheduled', message);
      setTimeout(() => scheduleReplacementReload(replacement), 0);
      return durableOutcome;
    }
    phase(writeStarted ? 'primary-write-rejected' : 'candidate-rejected', message);
    releaseReplacementTransaction(replacement);
    /* The final refusal witness is emitted after ownership release so the
       browser gate can prove a stopped outgoing ticker actually resumed. */
    phase('released', message);
    return { kind: 'refused', reason: 'write-failed' };
  }
}

const F4_FRESH_RACE_RELEASE_KEY = 'cf_slice_f4_fresh_race_release';
async function awaitSmokeFreshInitializationRaceGate(): Promise<void> {
  /* Optional native-browser ordering seam. Runtime.addBinding exists before
     module evaluation, so two genuinely empty documents can both finish the
     stable absence read before either enters the production initializer. */
  const binding = (window as unknown as Record<string, unknown>).__cfF4FreshInitRaceGate;
  if (typeof binding !== 'function') return;
  (binding as (payload: string) => unknown)(JSON.stringify({
    schema: 'cf-v2-f4-fresh-race/v1', documentToken: DOCUMENT_TOKEN, stage: 'initializer-ready',
  }));
  const deadline = performance.now() + 15_000;
  while (localStorage.getItem(F4_FRESH_RACE_RELEASE_KEY) !== 'release') {
    if (performance.now() >= deadline) throw new Error('F4 fresh initialization race gate timed out');
    await new Promise<void>((resolve) => setTimeout(resolve, 10));
  }
}

function bootRouteProjection(state: SaveStateV2): BootRouteProjection {
  return Object.freeze({
    savedView: state.savedView,
    atlas: Object.freeze(state.logMap.map(([id, entry]) =>
      Object.freeze([id, entry.where] as const))),
  });
}

async function loadSave(): Promise<void> {
  /* v5 is authoritative before any app state exists. A missing schema gets
     exactly one stored-v4 migration attempt; only a genuinely empty source
     may bootstrap a new v5 expedition. Corrupt/future current rows and a
     read-only recovery snapshot are playable evidence, never write
     authorization. Transient reads remain unknown until a full reload. */
  const now = Date.now();
  const fresh = importSaveV2('{}', REGISTRY, Date.now());
  if (!fresh.ok) throw new Error('fresh v2 save construction failed');
  let trulyFresh = false;
  let loadedExisting = false;
  let bootResolved = false;
  let initialRevision = 0;
  let initialExtensions: V5Extensions = EMPTY_V5_EXTENSIONS;
  let restoredAuthority: Parameters<typeof createF4RuntimeAuthority>[0]['restoredAuthority'] = null;
  let protectedReason: 'future-version' | 'invalid' | null = null;
  bootRouteRepairPending = false;
  arc2LootState = null;
  arc2LootBootstrapPending = false;
  arc2LootProtection = null;
  lastArc2LootOutcome = null;
  arc3EngineeringState = null;
  arc3EngineeringBootstrapPending = false;
  bootProductBootstrapCandidate = null;
  arc3EngineeringProtection = null;
  arc3AddressDiagnostics = null;
  arc3LegacyDiagnostics = null;
  lastArc3BootstrapOutcome = null;
  lastArc3EngineeringOutcome = null;
  lastArc3ProjectionDiagnostics = null;
  arc4OwnershipState = null;
  arc4OwnershipBootstrapPending = false;
  arc4OwnershipProtection = null;
  lastArc4BootstrapOutcome = null;
  lastArc4CaptureOutcome = null;
  arc5OwnershipState = null;
  arc5OwnershipEvidence = null;
  arc5OwnershipBootstrapPrepared = null;
  arc5OwnershipBootstrapPending = false;
  arc5OwnershipProtection = null;
  lastArc5BootstrapOutcome = null;
  currentCapturePresentationFence = null;
  lastArc4CaptureResult = null;

  const useProtectedFresh = (
    kind: Exclude<PersistenceBootKind, 'fresh-v5' | 'migrated-v4' | 'current-v5'>,
    reason: 'future-version' | 'invalid',
    detail: string,
  ): void => {
    persistenceBootKind = kind;
    persistenceProtectedDetail = detail;
    persistHold = kind === 'transient-protected' ? 'transient-read' : 'protected-payload';
    protectedReason = reason;
    save = fresh.state;
    importedRouteIngress = fresh.ingress;
    bootResolved = true;
  };
  const acceptCurrent = async (
    current: Extract<Awaited<ReturnType<typeof readRevisionedSaveV5WithRecovery>>, { kind: 'loaded' }>,
    kind: 'migrated-v4' | 'current-v5',
  ): Promise<void> => {
    save = current.state;
    importedRouteIngress = current.ingress;
    initialExtensions = current.extensions;
    loadedExisting = true;
    bootResolved = true;
    persistenceBootKind = kind;
    initialRevision = current.revision;
    const authority = readF4Authority(initialExtensions);
    f4AuthorityBootKind = authority.kind;
    if (authority.kind === 'loaded') restoredAuthority = authority.authority;
    else if (authority.kind === 'future-version' || authority.kind === 'corrupt') {
      persistHold = 'protected-payload';
      protectedReason = authority.kind === 'future-version' ? 'future-version' : 'invalid';
      persistenceBootKind = authority.kind === 'future-version'
        ? 'future-protected' : 'corrupt-protected';
      persistenceProtectedDetail = `F4 authority ${authority.kind}`;
    }
    if (!persistHold) {
      try { await repo.promoteLastKnownGood(current.legacyV4Raw); } catch { /* compatibility keepsake only */ }
    }
  };

  let current = await readRevisionedSaveV5WithRecovery(persistenceBackend, REGISTRY, now);
  let currentKind: 'migrated-v4' | 'current-v5' = 'current-v5';
  if (current.kind === 'not-migrated') {
    const migration = await migrateStoredV4ToV5(persistenceBackend, REGISTRY, now);
    if (migration.kind === 'fresh') {
      trulyFresh = true;
      persistenceBootKind = 'fresh-v5';
      persistHold = false;
      save = fresh.state;
      importedRouteIngress = fresh.ingress;
      bootResolved = true;
    } else if (migration.kind === 'migrated' || migration.kind === 'already-current') {
      currentKind = migration.kind === 'migrated' ? 'migrated-v4' : 'current-v5';
      current = await readRevisionedSaveV5WithRecovery(persistenceBackend, REGISTRY, now);
    } else if (migration.kind === 'protected') {
      useProtectedFresh(
        migration.reason === 'future-version' ? 'future-protected' : 'corrupt-protected',
        migration.reason === 'future-version' ? 'future-version' : 'invalid',
        `stored v4 source ${migration.reason}`,
      );
    } else if (migration.kind === 'storage-error') {
      useProtectedFresh('transient-protected', 'invalid', migration.message);
    } else {
      /* A competing migration may have completed. Re-read once; never retry
         the migration or infer that a still-missing schema means fresh. */
      current = await readRevisionedSaveV5WithRecovery(persistenceBackend, REGISTRY, now);
    }
  }

  if (!bootResolved) {
    if (current.kind === 'loaded') await acceptCurrent(current, currentKind);
    else if (current.kind === 'recovered-v4') {
      save = current.state;
      importedRouteIngress = current.ingress;
      initialExtensions = current.extensions;
      loadedExisting = true;
      f4AuthorityBootKind = 'absent';
      persistHold = 'protected-payload';
      protectedReason = 'invalid';
      persistenceBootKind = 'recovered-v4-protected';
      persistenceProtectedDetail = 'current v5 rows failed validation; pre-migration v4 snapshot loaded read-only';
      bootResolved = true;
    } else if (current.kind === 'future-version') {
      useProtectedFresh('future-protected', 'future-version', `future v5 ${current.scope}`);
    } else if (current.kind === 'corrupt') {
      useProtectedFresh('corrupt-protected', 'invalid', `corrupt v5 ${current.scope}`);
    } else if (current.kind === 'storage-error') {
      useProtectedFresh('transient-protected', 'invalid', current.message);
    } else if (current.kind === 'changed') {
      useProtectedFresh('transient-protected', 'invalid', 'save revision changed during the boot snapshot');
    } else if (current.kind === 'not-migrated') {
      useProtectedFresh('transient-protected', 'invalid', 'schema/source changed during migration');
    }
  }
  if (!bootResolved || importedRouteIngress === null) {
    throw new Error('v5 boot classifier did not produce a safe runtime state');
  }
  /* Prepare exactly the fresh state that the initializer stores before any
     derived live boot state is published. If another empty tab wins, accept
     one new stable coupled v5 snapshot and continue the SAME downstream boot
     derivation from its state/revision/extensions—not the losing local fresh
     object and not a corrupt/read-only placeholder. */
  if (trulyFresh && !persistHold) {
    save.tutDone = false;
    const freshSol = searchTravel.trainingSolSystemNav();
    if (freshSol) save.savedView = navToView(freshSol);
    await awaitSmokeFreshInitializationRaceGate();
    const initialized = await initializeFreshV5(
      persistenceBackend,
      { state: save, extensions: EMPTY_V5_EXTENSIONS },
      REGISTRY,
      now,
    );
    if (initialized.kind === 'initialized') {
      initialRevision = initialized.revision;
      initialExtensions = EMPTY_V5_EXTENSIONS;
      f4AuthorityBootKind = 'absent';
    } else if (initialized.kind === 'not-fresh') {
      let winner = await readRevisionedSaveV5WithRecovery(persistenceBackend, REGISTRY, now);
      if (winner.kind === 'changed') {
        winner = await readRevisionedSaveV5WithRecovery(persistenceBackend, REGISTRY, now);
      }
      if (winner.kind === 'loaded') {
        trulyFresh = false;
        persistenceProtectedDetail = null;
        protectedReason = null;
        await acceptCurrent(winner, 'current-v5');
      } else {
        useProtectedFresh(
          'transient-protected',
          'invalid',
          `fresh initialization winner was not stably readable (${winner.kind}); reload required`,
        );
      }
    } else {
      useProtectedFresh('transient-protected', 'invalid', initialized.message);
    }
  }
  const bootIngress = importedRouteIngress;
  const durableArc5BootLive = captureArc5BootLiveProjection(save);
  const durableBootSavedView = durableArc5BootLive.savedView;
  const durableBootAtlasRoutes = save.logMap.map(([, entry], index) => ({
    entry,
    where: durableArc5BootLive.atlas[index]![1],
  }));
  let arc5BootGateClassification: Arc5BootGateClassification = Object.freeze({
    kind: 'held', reason: 'classification-pending',
  });
  const durableBootRouteProjection = bootRouteProjection(save);

  customNames.clear();
  for (const [key, name] of save.customNames) customNames.set(key, name);
  /* A supported save is never rejected as a whole because its location is
     stale. Re-prove that one raw route from source; deterministic failure
     repairs only `view`, while a transient source failure holds its bytes. */
  const savedRoute = resolveViewToNav(
    bootIngress.savedView === undefined ? null : bootIngress.savedView,
  );
  let savedEngineeringRoute: NavState | null = null;
  if (savedRoute.ok && searchTravel.navigationAuthorityFailure(savedRoute.state) === null) {
    nav = savedRoute.state;
    savedEngineeringRoute = savedRoute.state;
    save.savedView = navToView(nav);
    savedRouteWriteHeld = false;
  } else {
    nav = NAV_HOME;
    savedRouteWriteHeld = !savedRoute.ok && savedRoute.reason === 'source-error';
    if (!savedRouteWriteHeld) save.savedView = null;
  }
  /* Atlas rows remain historical records even when a route cannot be proven.
     Only a non-home proven target becomes actionable; source-derived fields
     replace tolerant display aliases without changing ids or local ledgers. */
  const provenAtlasEngineeringRoutes: NavState[] = [];
  for (const [, entry] of save.logMap) {
    const rawWhere = bootIngress.atlasWhere.get(entry);
    if (rawWhere === null || rawWhere === undefined) {
      entry.where = null;
      continue;
    }
    const route = resolveViewToNav(rawWhere);
    if (route.ok && route.state.mode !== 'universe') {
      atlasRouteStates.set(entry, route.state);
      provenAtlasEngineeringRoutes.push(route.state);
      entry.where = navToView(route.state);
    } else if (route.ok || route.reason !== 'source-error') {
      entry.where = null;
    }
  }
  trainingSnapshotIngress = bootIngress.trainingSnapshot;
  /* A pending checkpoint is the durable pre-drill authority. Ordinary
     practice autosaves stay held so only the explicit restart write and the
     atomic completion transaction may replace it. Unknown shapes are also
     quarantined from the Training UI below. */
  const loadedUnfinishedWithoutSnapshot = loadedExisting
    && !save.tutDone
    && trainingSnapshotIngress.kind === 'none';
  trainingCheckpointWriteHeld = trainingSnapshotIngress.kind !== 'none'
    || loadedUnfinishedWithoutSnapshot;
  trainingBootRouteBlocked = false;
  trainingBootRuntimeOnlySeat = false;
  /* A truly EMPTY store is a NEW EXPEDITION — training runs, exactly like
     the game's new-run init (the absent-⇒-done default protects HELD saves,
     not fresh ones). Every runnable drill begins from a freshly source-proven
     Sol system, matching the legacy restart/resume contract. An unknown
     checkpoint is quarantined instead: ordinary Training actions would
     mutate live ledgers before completion could refuse, contradicting the
     promise that the unrecognized evidence remains untouched. */
  if (trulyFresh) save.tutDone = false;
  const recognizedPendingTraining = !save.tutDone
    && trainingSnapshotIngress.kind !== 'legacy-or-unknown';
  if (recognizedPendingTraining) {
    const solNav = searchTravel.trainingSolSystemNav();
    if (solNav) {
      nav = solNav;
      if (trulyFresh) {
        save.savedView = navToView(solNav);
        savedRouteWriteHeld = false;
      } else {
        /* Seat a resumed drill in Sol without making boot itself a partial
           Training transaction. The pending checkpoint (or loaded
           incomplete no-snapshot save) and outer route stay byte-exact until
           the one atomic completion write decides the durable view. */
        trainingBootRuntimeOnlySeat = true;
      }
    } else {
      trainingBootRouteBlocked = true;
      if (trainingSnapshotIngress.kind !== 'none') trainingCheckpointWriteHeld = true;
    }
  }
  /* A deterministic source check may canonicalize the durable saved route or
     Atlas projections. That repair is an explicit boot transaction intent,
     never a side effect of first render. It joins the already-owned F4/Arc 2/
     Arc 3 bootstrap CAS below, while source-error, protected, and Training's
     runtime-only seat retain their exact stored route bytes. */
  const bootRouteRepair = classifyBootRouteRepair({
    before: durableBootRouteProjection,
    after: bootRouteProjection(save),
    guards: {
      persistenceHeld: persistHold !== false,
      savedRouteWriteHeld,
      trainingCheckpointWriteHeld,
      trainingBootRouteBlocked,
      trainingBootRuntimeOnlySeat,
    },
  });
  bootRouteRepairPending = bootRouteRepair.pending;
  if (bootRouteRepair.changed && !bootRouteRepair.pending) {
    /* Other F4/product bootstrap work may still need its one owned CAS. Keep
       a held route repair out of that detached candidate as well as out of
       the render path; otherwise a false pending flag could hide a real
       Training/source-error/protected route write inside another bootstrap. */
    save.savedView = durableBootSavedView;
    for (const { entry, where } of durableBootAtlasRoutes) entry.where = where;
  }
  /* Arc 2 owns an independently versioned Inventory carrier. Seed it from
     the already-sanitized legacy item facts without truncating oversized
     saves or overwriting future/corrupt extension bytes. A prepared carrier
     joins the same first lease-fenced commit as a fresh F4 seed; until that
     commit lands, every player mutation stays unavailable. */
  if (!persistHold) {
    const loot = prepareArc2LootLegacyMigration({
      extensions: initialExtensions,
      legacy: save,
      capacity: MAX_GEAR_CAPACITY,
    });
    if (loot.kind === 'prepared') {
      initialExtensions = loot.extensions;
      arc2LootState = loot.state;
      applyArc2LegacyMirror(save, loot.state);
      arc2LootBootstrapPending = true;
    } else if (loot.kind === 'already-loaded') {
      arc2LootState = loot.state;
      /* A current Arc 2 carrier is the exact-instance authority. Portable-v5
         inputs can carry a stale legacy mirror, so repair only those three
         compatibility fields in the same first lease-fenced commit before
         any action or editable Inventory UI becomes available. */
      if (!arc2LootLegacyMirrorMatches(loot.state, save)) {
        applyArc2LegacyMirror(save, loot.state);
        arc2LootBootstrapPending = true;
      }
    } else {
      arc2LootProtection = `${loot.reason}${loot.version === undefined ? '' : `:${loot.version}`}`;
    }
  }
  /* Arc 3 owns full-address engineering progress. An absent carrier may use
     only the finite source-proven routes already assembled above: the live
     route, the independently successful saved route, and Atlas sidecars.
     Bare-seed collisions/misses protect Arc 3 alone. A prepared carrier (or
     a current carrier's repaired v4 mirror) joins the same first F4/Arc 2
     lease-fenced commit instead of creating a second bootstrap write. */
  if (!persistHold) {
    const priorProductCandidate = bootProductBootstrapCandidate;
    const prepared = prepareArc3AppBootstrap({
      extensions: initialExtensions,
      save,
      sources: {
        current: nav,
        saved: savedEngineeringRoute,
        atlas: provenAtlasEngineeringRoutes,
      },
    });
    arc3AddressDiagnostics = prepared.addressDiagnostics;
    arc3LegacyDiagnostics = prepared.legacyDiagnostics;
    if (prepared.kind === 'prepared' || prepared.kind === 'already-loaded') {
      try {
        const staged = stageArc3BootstrapLegacyProjection({
          source: priorProductCandidate ?? save,
          state: prepared.state,
          codecNow: now,
          intent: prepared.kind === 'prepared'
            ? 'legacy-bootstrap' : 'loaded-reconciliation',
        });
        lastArc3ProjectionDiagnostics = staged.projection.diagnostics;
        arc3EngineeringState = prepared.state;
        if (prepared.kind === 'prepared') {
          initialExtensions = prepared.extensions;
          bootProductBootstrapCandidate = staged.candidate;
          arc3EngineeringBootstrapPending = true;
          lastArc3BootstrapOutcome = 'prepared';
        } else if (staged.changed) {
          bootProductBootstrapCandidate = staged.candidate;
          arc3EngineeringBootstrapPending = true;
          lastArc3BootstrapOutcome = 'reconciliation-prepared';
        } else lastArc3BootstrapOutcome = 'already-aligned';
      } catch (error) {
        arc3EngineeringState = null;
        bootProductBootstrapCandidate = priorProductCandidate;
        arc3EngineeringProtection = `legacy-projection:${error instanceof Error ? error.message : String(error)}`;
        lastArc3BootstrapOutcome = 'projection-rejected';
      }
    } else {
      arc3EngineeringProtection = `${prepared.reason}:${prepared.detail}`;
      lastArc3BootstrapOutcome = 'protected';
    }
  }
  /* A legacy-v1 Training checkpoint still owns the Compendium fields from
     which ownership-v1 must be derived. Defer an absent carrier until the
     atomic Training completion restore; silently accepting any pre-existing
     Arc 4 carrier here would join two different ownership histories. */
  if (!persistHold) {
    const deferredForLegacyTraining = trainingSnapshotIngress.kind === 'legacy-v1'
      || trainingSnapshotIngress.kind === 'legacy-or-unknown';
    if (deferredForLegacyTraining) {
      const existing = readArc4Ownership(
        initialExtensions,
        SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      );
      if (existing.kind === 'absent') {
        arc4OwnershipProtection = `training-deferred:${trainingSnapshotIngress.kind}`;
        lastArc4BootstrapOutcome = 'training-deferred';
      } else {
        arc4OwnershipProtection = `training-carrier-anomaly:${existing.kind}`;
        lastArc4BootstrapOutcome = 'training-carrier-rejected';
      }
    } else {
      const priorProductCandidate = bootProductBootstrapCandidate;
      const prepared = prepareArc4AppBootstrap({
        extensions: initialExtensions,
        save: priorProductCandidate ?? save,
      });
      if (prepared.kind === 'prepared') {
        if (prepared.state.mode === 'legacy-protected') {
          initialExtensions = prepared.extensions;
          arc4OwnershipState = prepared.state;
          arc4OwnershipBootstrapPending = true;
          arc4OwnershipProtection = 'legacy-protected';
          lastArc4BootstrapOutcome = 'legacy-protected-prepared';
        } else {
          const staged = stageArc4BootstrapLegacyProjection({
            source: priorProductCandidate ?? save,
            state: prepared.state,
            registry: REGISTRY,
            codecNow: now,
          });
          if (staged.kind === 'staged') {
            initialExtensions = prepared.extensions;
            bootProductBootstrapCandidate = staged.candidate;
            arc4OwnershipState = prepared.state;
            arc4OwnershipBootstrapPending = true;
            lastArc4BootstrapOutcome = 'prepared';
          } else {
            arc4OwnershipProtection = `${staged.reason}:${staged.detail}`;
            lastArc4BootstrapOutcome = 'projection-rejected';
          }
        }
      } else if (prepared.kind === 'already-loaded') {
        if (prepared.state.mode !== 'current') {
          arc4OwnershipState = prepared.state;
          arc4OwnershipProtection = 'legacy-protected';
          lastArc4BootstrapOutcome = 'already-protected';
        } else if (arc4OwnershipLegacyMirrorMatches(
          prepared.state,
          priorProductCandidate ?? save,
        )) {
          arc4OwnershipState = prepared.state;
          lastArc4BootstrapOutcome = 'already-aligned';
        } else {
          const staged = stageArc4BootstrapLegacyProjection({
            source: priorProductCandidate ?? save,
            state: prepared.state,
            registry: REGISTRY,
            codecNow: now,
          });
          if (staged.kind === 'staged') {
            bootProductBootstrapCandidate = staged.candidate;
            arc4OwnershipState = prepared.state;
            arc4OwnershipBootstrapPending = true;
            lastArc4BootstrapOutcome = 'reconciliation-prepared';
          } else {
            arc4OwnershipProtection = `${staged.reason}:${staged.detail}`;
            lastArc4BootstrapOutcome = 'projection-rejected';
          }
        }
      } else {
        arc4OwnershipProtection = `${prepared.reason}${prepared.version === undefined
          ? '' : `:${prepared.version}`}`;
        lastArc4BootstrapOutcome = 'protected';
      }
    }
  }
  /* Arc 5's compact source-bound manifest and four fixed delta shards derive
     from the final Arc 4 carrier, never directly from the legacy mirror. They
     therefore stage after Arc 4 and join the same receipt-free F4/product CAS.
     Legacy Training owns the
     source fields and defers both authorities until its replacement write;
     any pre-existing Arc 5 carrier at that boundary is conflicting evidence,
     not an authority carrier set that boot may silently preserve or replace. */
  if (!persistHold) {
    const holdProtectedArc5Boot = (
      kind: 'future-protected' | 'corrupt-protected',
      detail: string,
    ): void => {
      /* Arc 4 and its compact Arc 5 carriers are one authority boundary.
         Never let an Arc 2/3/4 candidate hitchhike through the shared CAS
         while Arc 5's current/future bytes cannot be fixed-pointed. Drop
         every staged intent before runtime creation and retain the stored
         expedition read-only for explicit reload/recovery. */
      if (arc2LootBootstrapPending) {
        arc2LootState = null;
        arc2LootProtection = 'blocked-by-arc5-protection';
        lastArc2LootOutcome = 'bootstrap-blocked-by-arc5';
      }
      if (arc3EngineeringBootstrapPending) {
        arc3EngineeringState = null;
        arc3EngineeringProtection = 'blocked-by-arc5-protection';
        lastArc3BootstrapOutcome = 'blocked-by-arc5-protection';
      }
      if (arc4OwnershipBootstrapPending) {
        arc4OwnershipState = null;
        arc4OwnershipProtection = 'blocked-by-arc5-protection';
        lastArc4BootstrapOutcome = 'blocked-by-arc5-protection';
      }
      bootRouteRepairPending = false;
      arc2LootBootstrapPending = false;
      arc3EngineeringBootstrapPending = false;
      arc4OwnershipBootstrapPending = false;
      arc5OwnershipBootstrapPending = false;
      arc5OwnershipBootstrapPrepared = null;
      bootProductBootstrapCandidate = null;
      persistHold = 'protected-payload';
      persistenceBootKind = kind;
      protectedReason = kind === 'future-protected' ? 'future-version' : 'invalid';
      persistenceProtectedDetail = detail;
    };
    const deferredForLegacyTraining = trainingSnapshotIngress.kind === 'legacy-v1'
      || trainingSnapshotIngress.kind === 'legacy-or-unknown';
    if (deferredForLegacyTraining) {
      const existing = readArc5OwnershipMigration(
        initialExtensions,
        SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      );
      arc5BootGateClassification = classifyArc5TrainingBootGate(existing);
      if (existing.kind === 'absent') {
        arc5OwnershipProtection = `training-deferred:${trainingSnapshotIngress.kind}`;
        lastArc5BootstrapOutcome = 'training-deferred';
      } else {
        arc5OwnershipProtection = `training-carrier-anomaly:${existing.kind}`;
        lastArc5BootstrapOutcome = 'training-carrier-rejected';
        holdProtectedArc5Boot(
          existing.kind === 'future-version' ? 'future-protected' : 'corrupt-protected',
          `Arc 5 ownership authority ${arc5OwnershipProtection}`,
        );
      }
    } else {
      const prepared = prepareArc5OwnershipMigration({
        extensions: initialExtensions,
        resolver: SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      });
      arc5BootGateClassification = prepared;
      if (prepared.kind === 'prepared') {
        initialExtensions = prepared.extensions;
        arc5OwnershipState = prepared.state;
        arc5OwnershipEvidence = prepared.evidence;
        arc5OwnershipBootstrapPrepared = prepared;
        arc5OwnershipBootstrapPending = true;
        arc5OwnershipProtection = prepared.state.mode === 'current'
          ? null : 'legacy-protected';
        lastArc5BootstrapOutcome = prepared.state.mode === 'current'
          ? 'prepared' : 'legacy-protected-prepared';
      } else if (prepared.kind === 'already-loaded') {
        arc5OwnershipState = prepared.state;
        arc5OwnershipEvidence = prepared.evidence;
        arc5OwnershipBootstrapPrepared = null;
        arc5OwnershipProtection = prepared.state.mode === 'current'
          ? null : 'legacy-protected';
        lastArc5BootstrapOutcome = prepared.state.mode === 'current'
          ? 'already-aligned' : 'already-protected';
      } else {
        arc5OwnershipProtection = `${prepared.reason}${prepared.version === undefined
          ? '' : `:${prepared.version}`}`;
        lastArc5BootstrapOutcome = 'protected';
        holdProtectedArc5Boot(
          prepared.reason === 'source-future'
          || prepared.reason === 'target-future'
            ? 'future-protected' : 'corrupt-protected',
          `Arc 5 ownership authority ${arc5OwnershipProtection}`,
        );
      }
    }
  }
  /* A newly prepared or reconciled carrier is not player-visible authority
     until its product bootstrap transaction commits. Persisted aligned
     carriers remain safely inspectable even if F4 later enters read-only. */
  inventoryPanelController.setState(arc2LootBootstrapPending ? null : arc2LootState);
  const arc5BootGate = runArc5BootRuntimeGate({
    classification: arc5BootGateClassification,
    durable: durableArc5BootLive,
    staged: captureArc5BootLiveProjection(save),
    createRuntime: () => {
      const entropy = new Uint32Array(1);
      crypto.getRandomValues(entropy);
      return createF4RuntimeAuthority({
        backend: persistenceBackend,
        repository: revisionRepo,
        registry: REGISTRY,
        initialRevision,
        initialExtensions,
        restoredAuthority,
        freshSessionSeed: entropy[0]!,
        ownerId: F4_OWNER_ID,
        token: F4_TAB_TOKEN,
        leaseTtlMs: F4_LEASE_TTL_MS,
        now: () => performance.now(),
        visible: f4PageVisible(),
        answerable: false,
      });
    },
  });
  if (arc5BootGate.kind === 'protected') {
    applyArc5BootLiveProjection(save, arc5BootGate.live);
  } else {
    const runtime = arc5BootGate.runtime;
    f4Runtime = runtime;
    f4SeedBootstrapPending = f4AuthorityBootKind === 'absent';
    try {
      const leaseOutcome = f4PageVisible()
        ? await runtime.heartbeat() : { kind: 'lost' as const };
      /* A newly minted crypto seed becomes durable before any outcome API can
         roll from it. If this write fails, play remains protected; reload can
         never silently mint a different value after a failed player action. */
      if (leaseOutcome.kind === 'owned' && !await ensureF4RevisionCurrent(runtime)) {
        throw new Error(persistenceProtectedDetail || 'F4 revision verification failed');
      }
      if ((f4SeedBootstrapPending || bootRouteRepairPending
        || arc2LootBootstrapPending || arc3EngineeringBootstrapPending
        || arc4OwnershipBootstrapPending || arc5OwnershipBootstrapPending)
        && leaseOutcome.kind === 'owned') {
        if (!await ensureBootAuthorityCommit(runtime)) {
          throw new Error(persistenceProtectedDetail || 'F4/product authority bootstrap failed');
        }
      }
      f4LastCheckpointAt = performance.now();
      startF4Heartbeat();
    } catch (error) {
      await runtime.release().catch(() => undefined);
      f4Runtime = null;
      f4SeedBootstrapPending = false;
      bootRouteRepairPending = false;
      if (arc2LootBootstrapPending) {
        arc2LootState = null;
        inventoryPanelController.setState(null);
      }
      arc2LootBootstrapPending = false;
      arc2LootProtection ||= 'bootstrap-failed';
      if (arc3EngineeringBootstrapPending) arc3EngineeringState = null;
      arc3EngineeringBootstrapPending = false;
      if (arc4OwnershipBootstrapPending) arc4OwnershipState = null;
      arc4OwnershipBootstrapPending = false;
      if (arc5OwnershipBootstrapPending) {
        arc5OwnershipState = null;
        arc5OwnershipEvidence = null;
      }
      arc5OwnershipBootstrapPending = false;
      arc5OwnershipBootstrapPrepared = null;
      bootProductBootstrapCandidate = null;
      arc3EngineeringProtection ||= 'bootstrap-failed';
      arc4OwnershipProtection ||= 'bootstrap-failed';
      arc5OwnershipProtection ||= 'bootstrap-failed';
      if (lastArc5BootstrapOutcome === 'prepared'
        || lastArc5BootstrapOutcome === 'legacy-protected-prepared') {
        lastArc5BootstrapOutcome = 'rejected';
      }
      stopF4Heartbeat();
      persistHold = 'protected-payload';
      persistenceBootKind = 'transient-protected';
      persistenceProtectedDetail = error instanceof Error ? error.message : String(error);
      protectedReason = 'invalid';
    }
  }
  if (nav.mode === 'galaxy') { camT.z = gz0 * 1.05; cam.z = camT.z; }
  else if (nav.mode === 'system') { camT.z = sz0 * 1.05; cam.z = camT.z; }
  ecologyObservedActivePlayMs = f4Runtime?.diagnostics().activePlayMs ?? 0;
  ecologyEpochAuthority = createEcologyEpochEdgeAuthority({
    restoredEpoch: save.EPOCH_BASE,
    activePlayAtBootMs: ecologyObservedActivePlayMs,
  });
  lastEcologyEdgeOutcome = `boot:${currentEcologyEpoch()}`;
  (globalThis as Record<string, unknown>).COSMIC_EPOCH = currentEcologyEpoch();
  initAudio({ sndOn: () => save.sndOn, sfxVol: () => save.sfxVol });   /* the save's own audio settings */
  /* dock + chrome mirror the save from the first frame */
  chartsDockEl.classList.toggle('on', save.chartsOn);
  chartsDockEl.setAttribute('aria-pressed', String(save.chartsOn));
  applyDisplayPreferences();
  syncTopbarH();
  syncDockH();
  syncCtxH();
  if (persistHold === 'protected-payload') {
    setTimeout(() => toast(
      protectedReason === 'future-version' ? 'Update required' : 'Save protected',
      protectedReason === 'future-version'
        ? 'This expedition was written by a newer build. It will not be changed here.'
        : persistenceBootKind === 'recovered-v4-protected'
          ? 'A proven pre-migration snapshot opened read-only. Current v5 rows remain untouched until recovery is resolved.'
          : 'The stored expedition is incomplete or conflicted. It will not be overwritten.',
      true,
    ), 0);
  }
  if (trainingSnapshotIngress.kind === 'legacy-or-unknown') {
    trainingRecoveryLock = 'unknown-checkpoint';
  } else if (trainingBootRouteBlocked) {
    trainingRecoveryLock = 'route-unavailable';
  }
  initTraining({
    explorerName: () => save.explorerName,
    isDone: () => save.tutDone
      || trainingSnapshotIngress.kind === 'legacy-or-unknown'
      || trainingBootRouteBlocked,
    complete: completeTraining,
    closePanels,
  });
  if (trainingRecoveryLock) openTrainingRecoverySheet(trainingRecoveryLock);
}

/* ---- boot ---- */
(async () => {
  /* autoDensity keeps the DPR-scaled backing store at CSS viewport size.
     Without it a DPR-2 phone displayed a 780px canvas inside 390 CSS px,
     halving Pixi hit coordinates and moving the home galaxy offscreen.
     Hold the ticker until persistence, scene publication, and every input
     listener are wired: at 8K, even one premature full-canvas render can
     starve the async boot work that makes the document answerable. */
  emitBootPhase('app-init-start');
  await app.init({
    background: 0x05070d,
    width: densityPlan.viewportWidth, height: densityPlan.viewportHeight,
    antialias: true,
    resolution: DPR, autoDensity: true, autoStart: false,
  });
  emitBootPhase('app-init-complete');
  document.body.appendChild(app.canvas);
  installKeyboardExploration();
  /* THE BACKDROP (drawBackdrop, main.js 3560 — verbatim recipe): the seeded
     900-star field under a deep radial wash, rebuilt per viewport, screen-
     space behind the world. The flat black is gone at every mode. */
  const bgSpr = new Sprite();
  bgSpr.eventMode = 'none';
  app.stage.addChild(bgSpr);
  const bgStars: Array<{ x: number; y: number; s: number; o: number }> = [];
  { const r = mulberry32(5); for (let i = 0; i < 900; i++) bgStars.push({ x: r(), y: r(), s: r() * 1.1 + 0.2, o: r() * 0.5 + 0.15 }); }
  let _bgKey = '';
  let activeBackdropCanvas: HTMLCanvasElement | null = null;
  let backdropGeneration = 0;
  let backdropTransitionPeakPixels = 0;
  let backdropTransitionBudgetPixels = densityPlan.backingPixelCapPerCanvas * 2;
  const ownedBackdropPixels = (): number => app.canvas.width * app.canvas.height
    + (activeBackdropCanvas?.width ?? 0) * (activeBackdropCanvas?.height ?? 0);
  const releaseBackdrop = (): void => {
    const old = bgSpr.texture;
    const priorCanvas = activeBackdropCanvas;
    bgSpr.texture = Texture.EMPTY;
    activeBackdropCanvas = null;
    if (old && old !== Texture.EMPTY) old.destroy(true);
    if (priorCanvas) {
      priorCanvas.width = 1;
      priorCanvas.height = 1;
    }
  };
  const applyRendererDensity = (plan: RendererDensityPlan): void => {
    /* Own viewport resizing instead of Pixi's ResizePlugin. Two same-aspect
       ultra viewports can resolve to the same integer backing dimensions;
       CanvasSource then (correctly) reports "not resized" and skips its CSS
       and Texture.frame refresh even though the logical viewport changed.
       The backing store may stay put, but CSS, texture metadata and the
       screen/hit-test rectangle must still follow the exact CSS viewport. */
    app.renderer.resize(plan.viewportWidth, plan.viewportHeight, plan.dpr);
    app.renderer.view.texture.update();
    app.canvas.style.width = `${plan.viewportWidth}px`;
    app.canvas.style.height = `${plan.viewportHeight}px`;
    app.screen.width = plan.viewportWidth;
    app.screen.height = plan.viewportHeight;
  };
  const rebuildBackdrop = (): void => {
    const W = app.screen.width, H = app.screen.height;
    const k = W + '|' + H + '|' + DPR.toFixed(4);
    if (k === _bgKey || W < 2) return;
    _bgKey = k;
    /* Release the old full-viewport store before allocating its replacement.
       App + old backdrop + new backdrop would otherwise create a transient
       three-store peak even though the settled twin stores satisfy the
       selected aggregate budget. This all happens in one JS task, so the
       stage cannot render between detaching the old texture and installing
       the new one. */
    releaseBackdrop();
    const cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.round(W * DPR)); cv.height = Math.max(1, Math.round(H * DPR));
    /* Include any still-owned prior backdrop in the observed allocation
       peak. The expected value is app+new because releaseBackdrop ran first;
       moving allocation above release would make this exact witness red. */
    backdropTransitionPeakPixels = Math.max(
      backdropTransitionPeakPixels,
      ownedBackdropPixels() + cv.width * cv.height,
    );
    const g = cv.getContext('2d')!; g.scale(DPR, DPR);
    const bg = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.75);
    bg.addColorStop(0, '#0a0a1e'); bg.addColorStop(0.6, '#05050f'); bg.addColorStop(1, '#020208');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.fillStyle = '#aab4e0';
    for (const s of bgStars) { g.globalAlpha = s.o * 0.5; g.fillRect(s.x * W, s.y * H, s.s, s.s); }
    g.globalAlpha = 1;
    bgSpr.texture = Texture.from(cv);
    activeBackdropCanvas = cv;
    bgSpr.width = W; bgSpr.height = H;
    backdropGeneration++;
  };
  /* app.init is asynchronous. Re-read the viewport before allocating the
     first backing stores so a resize during renderer negotiation cannot
     leave the app on the stale pre-init density plan. */
  densityPlan = effectiveDensityPlan();
  DPR = densityPlan.dpr;
  applyRendererDensity(densityPlan);
  backdropTransitionPeakPixels = app.canvas.width * app.canvas.height;
  backdropTransitionBudgetPixels = densityPlan.backingPixelCapPerCanvas * 2;
  rebuildBackdrop();
  emitBootPhase('backdrop-complete');
  const syncRendererDensity = (): void => {
    const nextDensityPlan = effectiveDensityPlan();
    const next = nextDensityPlan.dpr;
    const densityChanged = next !== DPR
      || nextDensityPlan.backingPixelCapPerCanvas !== densityPlan.backingPixelCapPerCanvas
      || nextDensityPlan.viewportWidth !== densityPlan.viewportWidth
      || nextDensityPlan.viewportHeight !== densityPlan.viewportHeight;
    if (densityChanged) {
      const priorBudget = densityPlan.backingPixelCapPerCanvas * 2;
      backdropTransitionPeakPixels = ownedBackdropPixels();
      backdropTransitionBudgetPixels = Math.max(
        priorBudget, nextDensityPlan.backingPixelCapPerCanvas * 2,
      );
      /* Drop the old full-viewport backdrop before resizing the renderer.
         Across the ordinary/ultra threshold, resizing first would briefly
         combine a new-tier app canvas with the larger old-tier backdrop and
         exceed the newly selected simultaneous-owner budget. */
      releaseBackdrop();
      densityPlan = nextDensityPlan;
      DPR = next;
      applyRendererDensity(densityPlan);
      _bgKey = '';
      /* Texture-backed scene art was baked for the prior scale tier. Rebuild
         the current mode so a monitor/DPR transition upgrades the scene, not
         only the Pixi backing store and backdrop. */
      rerender({ preserveSurvey: true });
      /* Change both simultaneous full-viewport stores in one transaction.
         A deferred backdrop rebuild briefly retained the ordinary-tier
         canvas after the app had already advertised the ultra-tier cap. */
      rebuildBackdrop();
    } else {
      densityPlan = nextDensityPlan;
    }
  };
  addEventListener('resize', syncRendererDensity);
  visualViewport?.addEventListener('resize', syncRendererDensity);
  releaseRendererForReload = (reason, audio): ReloadReleaseWitness => {
    const view = app.canvas;
    const backdrop = activeBackdropCanvas;
    const before = (canvas: HTMLCanvasElement | null): ReloadCanvasRelease => ({
      beforeWidth: canvas?.width ?? 0,
      beforeHeight: canvas?.height ?? 0,
      afterWidth: canvas?.width ?? 0,
      afterHeight: canvas?.height ?? 0,
    });
    const appCanvas = before(view);
    const backdropCanvas = before(backdrop);
    let error: string | null = null;
    removeEventListener('resize', syncRendererDensity);
    visualViewport?.removeEventListener('resize', syncRendererDensity);
    closeCodexSurface();
    engineeringPanelReleased = true;
    engineeringPanelController.dispose();
    captureCardController.dispose();
    clearPlanetside();
    speciesArtLoader.dispose(`intentional replacement: ${reason}`);
    try { clearWorld(false); }
    catch (caught) { error = caught instanceof Error ? caught.message : String(caught); }
    try {
      app.destroy(
        { removeView: true, releaseGlobalResources: true },
        { children: true, texture: true, textureSource: true },
      );
    } catch (caught) {
      error = caught instanceof Error ? caught.message : String(caught);
    }
    /* Destroying the renderer/context owns GPU cleanup. Shrinking both
       captured canvases makes the CPU-side backing release an observable
       synchronous postcondition instead of a hope that GC runs before boot. */
    try { view.width = 1; view.height = 1; }
    catch (caught) { error ??= caught instanceof Error ? caught.message : String(caught); }
    if (backdrop) {
      try { backdrop.width = 1; backdrop.height = 1; }
      catch (caught) { error ??= caught instanceof Error ? caught.message : String(caught); }
    }
    appCanvas.afterWidth = view.width;
    appCanvas.afterHeight = view.height;
    backdropCanvas.afterWidth = backdrop?.width ?? 0;
    backdropCanvas.afterHeight = backdrop?.height ?? 0;
    activeBackdropCanvas = null;
    const releasedApp = app as unknown as { renderer: unknown; stage: unknown };
    const rendererReleased = releasedApp.renderer == null;
    const stageReleased = releasedApp.stage == null;
    const viewDetached = !view.isConnected;
    const complete = !error && rendererReleased && stageReleased && viewDetached
      && appCanvas.beforeWidth > 1 && appCanvas.beforeHeight > 1
      && backdropCanvas.beforeWidth > 1 && backdropCanvas.beforeHeight > 1
      && appCanvas.afterWidth <= 1 && appCanvas.afterHeight <= 1
      && backdropCanvas.afterWidth <= 1 && backdropCanvas.afterHeight <= 1;
    if (!complete && !error) error = 'Pixi/canvas release postcondition failed';
    return {
      schema: 'cf-v2-reload-release/v1', status: complete ? 'released' : 'release-failed',
      error, reason, documentToken: DOCUMENT_TOKEN, audio,
      rendererReleased, stageReleased, viewDetached, appCanvas, backdropCanvas,
    };
  };
  app.stage.addChild(world);
  /* Publish the browser-audit surface only after persistence has produced a
     complete SaveStateV2 and the first scene is rendered. Publishing it
     before this await let a slower CI browser call state() while `save` was
     still unassigned, turning a readiness race into a misleading app fault. */
  emitBootPhase('save-load-start');
  await loadSave();
  emitBootPhase('save-load-complete');
  rerender({ skipPersist: true });
  trainingBootRuntimeOnlySeat = false;
  emitBootPhase('scene-rendered');
  if (!trainingRecoveryLock) showUnseenV2Release();
  /* diagnostics handle for tools/slicesmoke.mjs — a WebGL canvas reads BLACK
     through 2D drawImage without preserveDrawingBuffer, so the smoke asks
     Pixi's extract (which re-renders) instead of scraping the canvas */
  (window as unknown as Record<string, unknown>).__CF_SLICE__ = {
    documentToken: DOCUMENT_TOKEN,   /* reload/import waits must reject the prior document's still-live handle */
    app, world, cam, camT,   /* camT drives the zoom-transition smoke leg */
    /* test API for tools/slicesmoke.mjs — drives the SAME functions the
       pointer handlers call; no parallel logic to drift */
    api: {
      state: () => ({
        mode: nav.mode, gal: nav.gal?.seed ?? null, star: nav.star?.seed ?? null,
        planet: nav.planet?.seed ?? null, planetOrdinal: nav.planet?.ordinal ?? null,
        navGalaxyKey: nav.mode === 'universe' ? null : getProvenGalaxyKey(nav.gal),
        navStarKey: nav.mode === 'system' || nav.mode === 'surface' ? getProvenStarKey(nav.star) : null,
        navWorldKey: nav.mode === 'surface' ? getProvenPlanetKey(nav.planet) : null,
        renderedScene: renderedSceneReceipt,
        galX: nav.gal?.x ?? null, galY: nav.gal?.y ?? null, galSize: nav.gal?.size ?? null,
        starX: nav.star?.x ?? null, starY: nav.star?.y ?? null,
        fine: !!fineLayer, solVisible: !!(solMark && solMark.visible),
        epoch: currentEcologyEpoch(),
        persistence: {
          schema: 'cf-v2-app-persistence/v1',
          ready: app.ticker?.started === true && tickerTicks >= 1,
          documentToken: DOCUMENT_TOKEN,
          bootKind: persistenceBootKind,
          hold: persistHold || null,
          protectedDetail: persistenceProtectedDetail,
          authorityBootKind: f4AuthorityBootKind,
          seedBootstrapPending: f4SeedBootstrapPending,
          bootRouteRepairPending,
          productBootstrapPending: arc2LootBootstrapPending,
          engineeringBootstrapPending: arc3EngineeringBootstrapPending,
          ownershipBootstrapPending: arc4OwnershipBootstrapPending,
          ownershipV2BootstrapPending: arc5OwnershipBootstrapPending,
          visibilityOverrideHidden: f4VisibilityOverrideHidden,
          lastOutcome: lastPersistenceOutcome,
          hideWitness: lastF4HideWitness,
          mutationBlocked: playerMutationsBlocked(),
          mutationBlockCount,
          mutationBlockWitness: lastMutationBlockWitness,
          importPhase: lastImportPhaseWitness,
          importRace: lastSmokeImportRaceWitness,
          runtime: f4Runtime?.diagnostics() ?? null,
          ecology: Object.freeze({
            ...ecologyEpochAuthority.diagnostics(ecologyActivePlayNow()),
            projectionDirty: ecologyEpochAuthority.projection().state === 'dirty',
            projectionSuppressed: ecologyEpochAuthority.projection().state === 'suppressed',
            checkpointInFlight: ecologyEdgeCheckpointInFlight !== null,
            lastOutcome: lastEcologyEdgeOutcome,
          }),
        },
        inventory: {
          stateKind: arc2LootState?.kind ?? 'unavailable',
          protection: arc2LootProtection,
          bootstrapPending: arc2LootBootstrapPending,
          lastOutcome: lastArc2LootOutcome,
          entries: arc2LootState?.kind === 'inventory' ? arc2LootState.inventory.entries.length : 0,
          equipped: arc2LootState?.kind === 'inventory' ? arc2LootState.inventory.equipped.length : 0,
          pending: arc2LootState?.kind === 'inventory' ? arc2LootState.inventory.pendingRewards.length : 0,
          revision: arc2LootState?.kind === 'inventory' ? arc2LootState.inventory.revision : null,
          entryIds: arc2LootState?.kind === 'inventory'
            ? arc2LootState.inventory.entries.map(({ instance }) => instance.instanceId) : [],
          equippedBindings: arc2LootState?.kind === 'inventory'
            ? arc2LootState.inventory.equipped.map((binding) => ({ ...binding })) : [],
          pendingIds: arc2LootState?.kind === 'inventory'
            ? arc2LootState.inventory.pendingRewards.map(({ instance }) => instance.instanceId) : [],
        },
        engineering: {
          schema: 'cf-v2-arc3-app-state/v1',
          stateKind: arc3EngineeringState === null ? 'unavailable' : 'loaded',
          protection: arc3EngineeringProtection,
          bootstrapPending: arc3EngineeringBootstrapPending,
          bootstrapCandidateReady: bootProductBootstrapCandidate !== null,
          bootstrapOutcome: lastArc3BootstrapOutcome,
          revision: arc3EngineeringState?.revision ?? null,
          worlds: arc3EngineeringState?.worlds.length ?? 0,
          stars: arc3EngineeringState?.stars.length ?? 0,
          research: arc3EngineeringState?.research.slice() ?? [],
          lastOutcome: lastArc3EngineeringOutcome,
          addressDiagnostics: arc3AddressDiagnostics,
          legacyDiagnostics: arc3LegacyDiagnostics,
          projectionDiagnostics: lastArc3ProjectionDiagnostics,
          actionCoordinator: {
            inFlight: productActionInFlight,
            owner: productActionCoordinator.diagnostics(),
            hold: smokeProductActionHold.diagnostics(),
            faultArmed: {
              storageFailure: smokeRejectNextArc3ActionStorage,
              staleAuthority: smokeStaleNextArc3ActionAuthority,
              publicationFailure: smokeRejectNextArc3Publication,
            },
            lastFault: lastSmokeArc3ActionFaultWitness,
          },
        },
        capture: {
          schema: 'cf-v2-arc4-app-state/v1',
          stateKind: arc4OwnershipState === null ? 'unavailable' : 'loaded',
          mode: arc4OwnershipState?.mode ?? null,
          protection: arc4OwnershipProtection,
          bootstrapPending: arc4OwnershipBootstrapPending,
          bootstrapCandidateReady: bootProductBootstrapCandidate !== null,
          bootstrapOutcome: lastArc4BootstrapOutcome,
          revision: arc4OwnershipState?.revision ?? null,
          catalogueSpecies: arc4OwnershipState?.catalogSpecies.length ?? 0,
          discoveries: arc4OwnershipState?.discoveries.length ?? 0,
          creatures: arc4OwnershipState?.creatures.length ?? 0,
          specimenLots: arc4OwnershipState?.specimenLots.length ?? 0,
          biospheres: arc4OwnershipState?.biosphereProgress.length ?? 0,
          lastOutcome: lastArc4CaptureOutcome,
          lastResult: lastArc4CaptureResult,
          card: captureCardController.diagnostics(),
          actionCoordinator: {
            inFlight: productActionInFlight,
            owner: productActionCoordinator.diagnostics(),
            hold: smokeProductActionHold.diagnostics(),
            faultArmed: {
              storageFailure: smokeRejectNextArc4ActionStorage,
              staleAuthority: smokeStaleNextArc4ActionAuthority,
              publicationFailure: smokeRejectNextArc4Publication,
            },
            lastFault: lastSmokeArc4ActionFaultWitness,
          },
        },
        ownershipV2: {
          schema: 'cf-v2-arc5-app-state/v2',
          stateKind: arc5OwnershipState === null ? 'unavailable' : 'loaded',
          mode: arc5OwnershipState?.mode ?? null,
          representationVersion: arc5OwnershipEvidence?.representationVersion ?? null,
          protection: arc5OwnershipProtection,
          bootstrapPending: arc5OwnershipBootstrapPending,
          bootstrapOutcome: lastArc5BootstrapOutcome,
          revision: arc5OwnershipState?.revision ?? null,
          sourceRevision: arc5OwnershipState === null
            ? null : ownershipSourceStateV1(arc5OwnershipState).revision,
          sourceDigest: arc5OwnershipEvidence?.sourceDigest ?? null,
          targetDigest: arc5OwnershipEvidence?.targetDigest ?? null,
          deltaDigest: arc5OwnershipEvidence?.representationVersion
            === ARC5_OWNERSHIP_MIGRATION_VERSION
            ? arc5OwnershipEvidence.deltaDigest : null,
          deltaRows: arc5OwnershipEvidence?.representationVersion
            === ARC5_OWNERSHIP_MIGRATION_VERSION
            ? arc5OwnershipEvidence.deltaRowCount : null,
          deltaShardCount: arc5OwnershipEvidence?.representationVersion
            === ARC5_OWNERSHIP_MIGRATION_VERSION
            ? arc5OwnershipEvidence.shardCount : null,
          deltaShardDigests: arc5OwnershipEvidence?.representationVersion
            === ARC5_OWNERSHIP_MIGRATION_VERSION
            ? arc5OwnershipEvidence.shardDigests : [],
          acquisitions: arc5OwnershipState?.acquisitions.length ?? 0,
          bredAcquisitions: arc5OwnershipState?.bredAcquisitions.length ?? 0,
          creatures: arc5OwnershipState?.creatures.length ?? 0,
          creatureTombstones: arc5OwnershipState?.creatureTombstones.length ?? 0,
          specimenLots: arc5OwnershipState?.specimenLots.length ?? 0,
          specimenTombstones: arc5OwnershipState?.specimenTombstones.length ?? 0,
          biospheres: arc5OwnershipState?.biosphereProgress.length ?? 0,
        },
        audio: tameGreetingAudioOwner?.diagnostics() ?? null,
        cardOpen: card.style.display !== 'none',
        cardTitle: card.querySelector('[data-sel=title]')?.textContent ?? null,
        stage: ascStage(), reach: reachRadiusOf(primeCount()),
        shipVisual: currentShipVisualState(),
        toastOn: toastEl.style.opacity === '1', toastText: toastEl.textContent || '', toastSerial: _toastSerial,
        galaxyBuildMs: lastGalaxyBuildMs,
        trail: appChrome.diagnostics().trail, ctx: appChrome.diagnostics().context,
        objective: appChrome.diagnostics().objective,
        chartsOn: save.chartsOn, chartsVisible: !!(chartLayer && chartLayer.visible),
        panelOpen: openPanelId(), codexCount: save.codex.length, seenGuide: save.seenGuide,
        rnSeen: save.rnSeen ?? null, releasePending: pendingReleaseBulletin?.version ?? null,
        tutActive: trainingActive(), tutStep: trainingStepId(), tutDone: save.tutDone,
        tutSnapshotPending: save.tutSnapPending,
        trainingCheckpointKind: trainingSnapshotIngress.kind,
        trainingCheckpointWriteHeld,
        trainingRecoveryMode: trainingRecoveryLock,
        trainingRestoreWitness: lastTrainingRestoreWitness,
        atlasCount: save.logMap.length,
        atlasTravelable: save.logMap.filter(([, entry]) => atlasRouteStates.has(entry)).length,
        savedRouteWriteHeld,
        sndOn: save.sndOn, voiceOn: save.voiceOn, sfxVol: save.sfxVol,
        motionMode: save.motionMode,
        fsMode: save.fsMode, toneMode: save.toneMode, fontMode: save.fontMode,
        glassA: getComputedStyle(document.documentElement).getPropertyValue('--glass-a').trim(),
        rendererDpr: app.renderer.resolution,
        eventResolution: app.renderer.events.resolution,
        backingPixelCapPerCanvas: densityPlan.backingPixelCapPerCanvas,
        viewportWidth: densityPlan.viewportWidth, viewportHeight: densityPlan.viewportHeight,
        backingWidth: app.canvas.width, backingHeight: app.canvas.height,
        backdropBackingWidth: activeBackdropCanvas?.width ?? 0,
        backdropBackingHeight: activeBackdropCanvas?.height ?? 0,
        backdropLogicalWidth: bgSpr.width, backdropLogicalHeight: bgSpr.height,
        backdropGeneration,
        backdropTransitionPeakPixels, backdropTransitionBudgetPixels,
        combinedBackingPixels: app.canvas.width * app.canvas.height
          + (activeBackdropCanvas?.width ?? 0) * (activeBackdropCanvas?.height ?? 0),
        sceneResources: sceneResourceDiagnostics(),
        keyboardTarget: keyboardTargetKey,
        tickerTicks,
        topbarH: appChrome.diagnostics().topbarH,
        save: {
          name: save.explorerName, essence: save.essence,
          landed: save.landed.slice(), customNames: save.customNames.map(([key, name]) => [key, name]),
          ascCh: save.ascCh, ascProg: { ...save.ascProg },
          items: save.items.map(([id, count]) => [id, count]),
          cargo: save.cargo.map(([id, count]) => [id, count]),
          cgx: save.cgx.map(([id, count]) => [id, count]),
          mineX: save.mineX.map(([seed, count]) => [seed, count]),
          mined: save.mined.map(([seed, timestamp]) => [seed, timestamp]),
          skimX: save.skimX.map(([seed, count]) => [seed, count]),
          stats: { ...save.stats }, journal: save.journal.map((entry) => ({ ...entry })),
          claimedSets: save.claimedSets.slice(), techOwned: save.techOwned.slice(),
          unlocked: save.unlocked.slice(),
          primeFill: Object.fromEntries(Object.entries(save.primeFill)
            .map(([key, value]) => [key, { ...value }])),
          frontierUnlocked: save.frontierUnlocked,
          chWeek: save.chWeek, chProg: { ...save.chProg },
          chacc: save.chacc.slice(), chDone: save.chDone.slice(),
          viewType: (save.savedView as { type?: string } | null)?.type ?? null,
          savedView: save.savedView,
        },
      }),
      compendiumDiagnostics,
      sceneResourceDiagnostics,
      shipyardDiagnostics,
      inventoryDiagnostics: () => inventoryPanelController.diagnostics(),
      __sceneEvidence: Object.freeze({
        beginObservationWindow: () => {
          peakRingGeometryEntries = _rgCache.size;
          peakLocalCanvasCacheEntries = _coronaC.size + _termC.size;
          return sceneTextureRegistry.beginObservationWindow();
        },
      }),
      __compendiumEvidence: Object.freeze({
        installFixture: installCompendiumFixture,
        resetFixture: resetCompendiumFixture,
        trimArtNow: (deviceClass: 'phone' | 'desktop') => speciesArtLoader.trimArtNow(deviceClass),
        failNextThumb: (message?: string) => speciesArtLoader.failNextThumb(message),
      }),
      importBlob,   /* Gate C's front door, drivable by the smoke */
      __smokeArmImportRace: smokeArmImportRace,
      __smokeReleaseImportRace: smokeReleaseImportRace,
      __smokeStageStoredV4: smokeStageStoredV4,
      __smokeRejectNextPersist: () => {
        if (smokeRejectNextPersist) return false;
        smokeRejectNextPersist = true;
        return true;
      },
      __smokePersistAfterDebounce: () => { persistSoon(); return true; },
      __smokePersistNow: persistView,
      __smokeCommitF4Outcome: smokeCommitF4Outcome,
      __smokeCaptureCurrentSurface: commitArc4CaptureAction,
      __smokeRejectNextArc4ActionStorage: () => {
        if (productActionCoordinator.busy || productActionFaultInjectionArmed()) return false;
        smokeRejectNextArc4ActionStorage = true;
        return true;
      },
      __smokeStaleNextArc4ActionAuthority: () => {
        if (productActionCoordinator.busy || productActionFaultInjectionArmed()) return false;
        smokeStaleNextArc4ActionAuthority = true;
        return true;
      },
      __smokeRejectNextArc4Publication: () => {
        if (productActionCoordinator.busy || productActionFaultInjectionArmed()) return false;
        smokeRejectNextArc4Publication = true;
        return true;
      },
      __smokeMineCurrentSurface: mineCurrentSurface,
      __smokeSkimCurrentSystem: skimCurrentSystem,
      __smokePurchaseEngineeringResearch: purchaseEngineeringResearch,
      __smokeFabricateFixedEngineeringRecipe: fabricateFixedEngineeringRecipe,
      __smokeArmProductActionHold: () => {
        if (productActionCoordinator.busy) return false;
        return smokeProductActionHold.arm();
      },
      __smokeReleaseProductActionHold: () => smokeProductActionHold.release(),
      __smokeArmArc3ActionHold: () => {
        if (productActionCoordinator.busy) return false;
        return smokeProductActionHold.arm();
      },
      __smokeReleaseArc3ActionHold: () => smokeProductActionHold.release(),
      __smokeRejectNextArc3ActionStorage: () => {
        if (productActionCoordinator.busy || productActionFaultInjectionArmed()) return false;
        smokeRejectNextArc3ActionStorage = true;
        return true;
      },
      __smokeStaleNextArc3ActionAuthority: () => {
        if (productActionCoordinator.busy || productActionFaultInjectionArmed()) return false;
        smokeStaleNextArc3ActionAuthority = true;
        return true;
      },
      __smokeRejectNextArc3Publication: () => {
        if (productActionCoordinator.busy || productActionFaultInjectionArmed()) return false;
        smokeRejectNextArc3Publication = true;
        return true;
      },
      __smokeShowF4: async () => {
        f4VisibilityOverrideHidden = false;
        await showF4();
        return f4Runtime?.diagnostics() ?? null;
      },
      __smokeRejectNextF4HideCheckpoint: () => {
        if (smokeRejectNextF4HideCheckpoint) return false;
        smokeRejectNextF4HideCheckpoint = true;
        return true;
      },
      __smokeCheckpointAndHideF4: checkpointAndHideF4,
      __smokeForceReadOnly: (force: boolean) => {
        smokeForceReadOnly = force === true;
        return playerMutationsBlocked();
      },
      __f3PersistenceBrowserProbe: runF3PersistenceBrowserEvidence,
      __smokeAbortNextRenderBeforeReceipt: () => {
        if (smokeAbortNextRenderBeforeReceipt) return false;
        smokeAbortNextRenderBeforeReceipt = true;
        return true;
      },
      __smokeRejectNextTrainingRouteResolution: () => {
        if (smokeRejectNextTrainingRouteResolution) return false;
        smokeRejectNextTrainingRouteResolution = true;
        return true;
      },
      __smokeRejectNextTrainingCandidateProof: () => {
        if (smokeRejectNextTrainingCandidateProof) return false;
        smokeRejectNextTrainingCandidateProof = true;
        return true;
      },
      __smokeRejectNextTrainingCommit: () => {
        if (smokeRejectNextTrainingCommit) return false;
        smokeRejectNextTrainingCommit = true;
        return true;
      },
      __smokeRejectNextTrainingPublish: () => {
        if (smokeRejectNextTrainingPublish) return false;
        smokeRejectNextTrainingPublish = true;
        return true;
      },
      __smokeStageHeldRouteAtHome: () => {
        /* A boot-time source error is deliberately nondeterministic and
           therefore cannot be a browser fixture. Stage its exact post-boot
           state from the current proven non-home route: runtime at Cosmos,
           raw route retained, and only that route field write-held. */
        if (nav.mode === 'universe' || savedRouteWriteHeld || trainingActive()
          || replacementTransaction || replacementReloadPending || importWriteInFlight || activePersist) return false;
        const heldView = navToView(nav);
        if (heldView === null) return false;
        save.savedView = heldView;
        nav = NAV_HOME;
        savedRouteWriteHeld = true;
        closePanels();
        hideSurvey();
        lastCard = null;
        cardCtx = null;
        cardTravelAction = null;
        surveyFocusReturn = null;
        rerender({ skipPersist: true });
        return true;
      },
      encodeHere: searchTravel.encodeHere,   /* the share-code round trip, drivable by the smoke */
      cardShareCode,
      showReleaseFixture: (version = '2.0.0-test') => {
        const fixture: V2ShippedRelease = {
          status: 'shipped', version, title: 'Browser fixture bulletin', date: 'Test only',
          sections: [{ category: 'Under the Hood', bullets: ['Positive-path fixture; not a release.'] }],
        };
        const history = getReleaseHistory({ includeDraft: true, shippedReleases: [fixture] });
        return showV2ReleaseBulletin(fixture, history);
      },
      fineStarTarget: () => {
        for (const target of fineStarTargets) {
          const point = world.toGlobal({ x: target.star.x, y: target.star.y });
          if (point.x < 0 || point.y < 0 || point.x > innerWidth || point.y > innerHeight) continue;
          if (document.elementFromPoint(point.x, point.y) !== app.canvas) continue;
          const bounds = target.spr.getBounds();
          return { ...target.star, screenX: point.x, screenY: point.y, width: bounds.width, height: bounds.height };
        }
        return null;
      },
      planetScreenTarget: (selector: unknown) => {
        if (nav.mode !== 'system' || !selector || typeof selector !== 'object' || Array.isArray(selector)) return null;
        const value = selector as Record<string, unknown>;
        if (!Number.isInteger(value.seed) || !Number.isInteger(value.ordinal)) return null;
        const target = planetTargets.find(({ planet }) =>
          planet.seed === value.seed && planet.ordinal === value.ordinal);
        if (!target) return null;
        const point = target.holder.getGlobalPosition();
        const bounds = target.holder.getBounds();
        return {
          seed: target.planet.seed,
          ordinal: target.planet.ordinal,
          screenX: point.x,
          screenY: point.y,
          width: bounds.width,
          height: bounds.height,
        };
      },
      fineStarProbe: () => {
        let visible = 0;
        let canvasHits = 0;
        const samples: Array<{ x: number; y: number; hit: string }> = [];
        for (const target of fineStarTargets) {
          const point = world.toGlobal({ x: target.star.x, y: target.star.y });
          if (point.x < 0 || point.y < 0 || point.x > innerWidth || point.y > innerHeight) continue;
          visible++;
          const hit = document.elementFromPoint(point.x, point.y);
          if (hit === app.canvas) canvasHits++;
          if (samples.length < 4) samples.push({
            x: point.x, y: point.y,
            hit: hit === app.canvas ? 'canvas' : (hit?.id || hit?.tagName.toLowerCase() || 'none'),
          });
        }
        return { total: fineStarTargets.length, visible, canvasHits, samples };
      },
      descendGalaxy,
      descendSystem,
      surveyOn: (selector: unknown) => {
        if (nav.mode !== 'system' || !selector || typeof selector !== 'object' || Array.isArray(selector)) return false;
        const value = selector as Record<string, unknown>;
        if (!Number.isInteger(value.seed) || !Number.isInteger(value.ordinal)) return false;
        const p = systemScene(nav.star.seed).planets.find((candidate) =>
          candidate.seed === value.seed && candidate.ordinal === value.ordinal);
        if (!p) return false;
        return surveyPlanet(p, nav.star);
      },
      landHere: doLand,
      landOn: (selector: unknown) => {
        if (nav.mode !== 'system' || !selector || typeof selector !== 'object' || Array.isArray(selector)) return false;
        const value = selector as Record<string, unknown>;
        if (!Number.isInteger(value.seed) || !Number.isInteger(value.ordinal)) return false;
        const p = systemScene(nav.star.seed).planets.find((candidate) =>
          candidate.seed === value.seed && candidate.ordinal === value.ordinal);
        if (!p) return false;
        return surveyAndLand(p, nav.star);
      },
    },
  };
  emitBootPhase('slice-published');
  /* the CMB band-pick (main.js ringPick): a tap on EMPTY space near the
     observable-universe ring — and only there — opens the origin card */
  app.stage.eventMode = 'static';
  app.stage.hitArea = app.screen;
  app.stage.on('pointertap', (e) => {
    if (e.target !== app.stage || nav.mode !== 'universe') return;
    const p = world.toLocal(e.global);
    if (Math.abs(Math.hypot(p.x, p.y) - OBS_R) * cam.z < 30) {
      surveyCard(describePick({ kind: 'cmb', data: {} } as never));
    }
  });

  let tickerTicks = 0;
  let firstTickPublished = false;
  app.ticker.add((tk) => {
    tickerTicks++;
    if (!firstTickPublished) {
      firstTickPublished = true;
      emitBootPhase('first-tick');
    }
    /* Reduced motion is a rendered-state policy, not just a CSS preference:
       navigation snaps, fades finish, and every ambient clock below receives
       t=0. Full/Auto keep the framerate-aware ease and living scene. */
    const animate = motionOK();
    const k = animate ? 1 - Math.pow(0.0025, tk.deltaMS / 1000) : 1;
    cam.x += (camT.x - cam.x) * k; cam.y += (camT.y - cam.y) * k; cam.z += (camT.z - cam.z) * k;
    world.position.set(app.screen.width / 2 - cam.x * cam.z, app.screen.height / 2 - cam.y * cam.z);
    world.scale.set(cam.z);
    if (world.alpha < 1) world.alpha = animate ? Math.min(1, world.alpha + tk.deltaMS / 400) : 1;
    const t = animate ? performance.now() * 0.001 : 0;
    /* The ticker may observe an active-play edge, but it never publishes one.
       One receipt-free lease/revision CAS owns the durable transition first;
       Reduced Motion changes only rendering and cannot enter this request. */
    requestEcologyEpochCheckpoint();
    /* galaxies turn on cosmic time — barely perceptible (main.js ~3742) */
    for (const gs of galaxySpins) gs.spr.rotation = gs.base + t * 0.0012;
    checkTransitions();
    updateZoomDependent();
    if (nav.mode === 'universe') {
      /* STREAM the universe: crossing a cell boundary rebuilds the window
         around the camera — pan far enough (or ride a wormhole) and new
         galaxies keep resolving */
      const ux = Math.floor(camT.x / UCELL), uy = Math.floor(camT.y / UCELL);
      if (!uniCell || ux !== uniCell.ux || uy !== uniCell.uy) buildCurrentSceneTransaction();
      /* blazars pulse — a jet aimed straight at you (main.js 3715) */
      for (const up of uniPulse) up.spr.alpha = 0.55 + 0.45 * Math.abs(Math.sin(t * 6 + up.seed % 10));
      /* drifting fog-of-war: the CLOUD PATTERN moves, the puffs stay put
         (main.js 3766 — noise phase drifts at 5/s) */
      if (charterFx && charterFx.visible && fogFx.length && animate) {
        const drift = t * 5;
        for (const F of fogFx) {
          const n = (UNOISE as (x: number, y: number, o: number) => number)((F.wx + drift) / UCELL * 0.16, (F.wy - drift * 0.4) / UCELL * 0.16, 3);
          F.spr.alpha = Math.min(Math.max((n - 0.32) * 1.1, 0), 0.7) * F.ramp;
        }
      }
    } else if (nav.mode === 'galaxy') {
      updateFineLayer(false);
      /* the bright stars breathe (main.js 4165) — stilled under reduced motion */
      for (const st of galTwinkle) st.spr.alpha = 0.82 + 0.18 * Math.sin(t * 2.4 + (st.star.seed % 97));
      if (bhDisc) { bhDisc.rotation = t * 0.3; bhDisc.scale.y = bhDisc.scale.x * 0.55; }
      /* wormhole lensing · remnant cores · newborn protostars (main.js 4109/4218) */
      for (const ga of galAnims) {
        if (ga.kind === 'worm') ga.spr.rotation = t * 1.2;
        else if (ga.kind === 'bhdisc') { ga.spr.rotation = t * 0.3; ga.spr.scale.y = ga.spr.scale.x * 0.5; }
        else if (ga.kind === 'nsbeam') ga.spr.rotation = t * 2.2;
        else if (ga.kind === 'proto') ga.spr.alpha = 0.7 + 0.3 * Math.sin(t * 3 + (ga.seed % 7));
      }
    } else if (nav.mode === 'system') {
      /* live orbits — planets on the Renderer's angle law, moons Kepler-ish,
         belt rocks on their own drifts, beams spinning */
      for (const o of orbiters) {
        if (o.kind === 'planet') {
          const a = planetAng(o.orb, t);
          o.c.position.set(Math.cos(a) * o.orb, Math.sin(a) * o.orb);
          if (o.face) { const aim = a + Math.PI + 2.522; o.face[0]!.rotation = aim; o.face[1]!.rotation = a; }
          if (o.cloud) {
            const vis = o.cloud.pr * cam.z > 22;   /* close-up gate; t=0 freezes the deck under Reduced */
            o.cloud.wrap.visible = vis;
            if (vis) {
              const co = (t * 1.6) % (o.cloud.pr * 2);
              o.cloud.a.position.x = -o.cloud.pr + co;
              o.cloud.b.position.x = -o.cloud.pr + co - o.cloud.pr * 2;
            }
          }
        } else if (o.kind === 'moon') {
          const ma = t * (0.55 / Math.pow(o.orb, 1.5)) + (o.a0 || 0);
          const mdist = (o.mul || 1) * o.orb;
          o.c.position.set(Math.cos(ma) * mdist, Math.sin(ma) * mdist * 0.4);
          if (o.face && o.pOrb) o.face[0]!.rotation = planetAng(o.pOrb, t);   /* dark limb away from the star */
        } else if (o.kind === 'rock') {
          const a = (o.a0 || 0) + t * (o.sp || 0);
          o.c.position.set(Math.cos(a) * o.orb, Math.sin(a) * o.orb);
        } else if (o.kind === 'dwarf') {
          const a = o.orb * 0.13 + t * 0.05 / (o.orb * 0.012);
          o.c.position.set(Math.cos(a) * o.orb, Math.sin(a) * o.orb);
        } else if (o.kind === 'beam') {
          o.c.rotation = t * 3;
        }
      }
      for (const L of sysLabels) { const p = L.getPos(t); L.t.position.set(p.x, p.y); }
      /* comets: eccentric orbits, tail always away from the star, coma and
         tail width zoom-compensated exactly as the Renderer does */
      for (const C of sysComets) {
        const cm = C.cm;
        const M = ((t + cm.off) / cm.period) * TAU;
        const a = cm.aMaj, e = cm.ecc;
        const ox = a * (Math.cos(M) - e), oy = a * Math.sqrt(1 - e * e) * Math.sin(M);
        const x = Math.cos(cm.tilt) * ox - Math.sin(cm.tilt) * oy;
        const y = Math.sin(cm.tilt) * ox + Math.cos(cm.tilt) * oy;
        const dist = Math.hypot(x, y) || 1;
        const tailLen = Math.max(0, (SYS_R * 0.55 - dist)) * 0.5 + 8;
        C.tail.position.set(x, y);
        C.tail.rotation = Math.atan2(y / dist, x / dist);
        C.tail.width = tailLen;
        C.tail.height = 2.2 / Math.max(0.2, cam.z);
        const cs = 6.8 / Math.max(0.2, Math.sqrt(cam.z));
        C.coma.position.set(x, y);
        C.coma.width = cs; C.coma.height = cs;
        C.label.position.set(x, y - 2);
        C.label.visible = cam.z > minWH() / 520;
      }
      if (visitorFx) {
        const v = visitorFx.v, L2 = SYS_R * 2.6;
        const sPos = ((t * v.speed + v.off) % L2) - L2 / 2;
        const dirx = Math.cos(v.ang), diry = Math.sin(v.ang);
        const vx = -diry * v.b + dirx * sPos, vy = dirx * v.b + diry * sPos;
        visitorFx.wrap.position.set(vx, vy);
        visitorFx.body.rotation = t * 0.35;   /* it tumbles */
        visitorFx.label.position.set(vx, vy - 4);
        visitorFx.label.visible = cam.z > minWH() / 650;
      }
    } else if (nav.mode === 'surface' && surfClouds) {
      const co = (t * 9) % surfClouds.w;
      surfClouds.a.position.x = -surfClouds.w / 2 + co;
      surfClouds.b.position.x = -surfClouds.w / 2 + co - surfClouds.w;
    }
    /* screen-constant labels/markers (the Renderer's 1/c.z font trick) */
    for (const ss of screenScaled) ss.obj.scale.set(ss.f / Math.max(cam.z, 1e-6));
    renderKeyboardTarget();
  });

  /* input: drag pan · wheel zoom (cursor-anchored) · pinch · right-click /
     Escape ascend — plus the zoom-driven dives above */
  const pointers = new Map<number, { x: number; y: number }>();
  let pinchD = 0;
  app.canvas.style.touchAction = 'none';
  app.canvas.addEventListener('pointerdown', (e) => {
    /* A transient IDB read failure may clear once a real player is present.
       A stored corrupt/future payload stays protected until explicit import;
       one click must never authorize overwriting that evidence. */
    if (persistHold === 'transient-read' && !persistRetrying) {
      persistRetrying = true;
      void readRevisionedSaveV5WithRecovery(persistenceBackend, REGISTRY, Date.now()).then((retryRead) => {
        if (persistHold !== 'transient-read') return;
        if (retryRead.kind === 'loaded' || retryRead.kind === 'not-migrated'
          || retryRead.kind === 'changed') {
          /* The first read failed before we knew whether storage was empty.
             Even a still-unmigrated result needs the full exact-source
             migration/fresh classifier. Never authorize this temporary
             in-memory state from a partial retry. */
          const replacement = claimReplacementTransaction('storage-retry');
          if (!replacement) {
            toast('Save replacement underway', 'The current expedition replacement will finish before storage recovery continues.');
            return;
          }
          scheduleReplacementReload(replacement);
          return;
        }
        if (retryRead.kind === 'future-version' || retryRead.kind === 'corrupt'
          || retryRead.kind === 'recovered-v4') {
          persistHold = 'protected-payload';
          const future = retryRead.kind === 'future-version';
          toast(future ? 'Update required' : 'Save protected',
            future
              ? 'This expedition was written by a newer build. It will not be changed here.'
              : 'Stored expedition evidence appeared after retry but did not prove writable. It remains unchanged.', true);
          return;
        }
        throw new Error('storage retry still unavailable');
      }).catch(() => {
        toast('Save unavailable', 'Storage is still unavailable. This expedition remains protected from overwrite.');
      }).finally(() => { persistRetrying = false; });
    }
    if (blockRouteChangeWhileProductAction()) {
      e.preventDefault();
      return;
    }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchD = Math.hypot(a!.x - b!.x, a!.y - b!.y);
    }
  });
  addEventListener('pointermove', (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    if (pointers.size === 1) {
      /* pan writes BOTH cam and target — immediate hand-feel; only zoom eases */
      cam.x -= (e.clientX - prev.x) / cam.z; cam.y -= (e.clientY - prev.y) / cam.z;
      camT.x = cam.x; camT.y = cam.y;
    }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      if (pinchD > 0) {
        const [lo, hi] = zoomLimits();
        camT.z = Math.min(hi, Math.max(lo, camT.z * (d / pinchD)));
      }
      pinchD = d;
    }
  });
  const lift = (e: PointerEvent): void => { pointers.delete(e.pointerId); pinchD = 0; };
  addEventListener('pointerup', lift);
  addEventListener('pointercancel', lift);
  app.canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (blockRouteChangeWhileProductAction()) return;
    const [lo, hi] = zoomLimits();
    const z2 = Math.min(hi, Math.max(lo, camT.z * (e.deltaY > 0 ? 0.88 : 1.14)));
    /* cursor-anchored: the world point under the cursor stays put */
    const cx = e.clientX - innerWidth / 2, cy = e.clientY - innerHeight / 2;
    const wx = camT.x + cx / camT.z, wy = camT.y + cy / camT.z;
    camT.x = wx - cx / z2; camT.y = wy - cy / z2;
    camT.z = z2;
  }, { passive: false });
  app.canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (card.style.display !== 'none') { closeVisibleSurveyAndAscend(false); return; }
    goUp();
  });
  addEventListener('keydown', (e) => {
    if (e.defaultPrevented) return;
    if (sheet.style.display !== 'none' && e.key === 'Tab') {
      const focusable = [...sheet.querySelectorAll<HTMLElement>('textarea,button,input:not([type="hidden"]),[tabindex]:not([tabindex="-1"])')]
        .filter((el) => !('disabled' in el && (el as HTMLButtonElement).disabled) && el.offsetParent !== null);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (first && last && (e.shiftKey ? document.activeElement === first : document.activeElement === last)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      }
      return;
    }
    if (e.key !== 'Escape') return;
    /* the Escape ORDER (the game's focus law): a focused search field
       yields first, then panels, then the survey card, then ascent */
    if (sheet.style.display !== 'none') {
      e.preventDefault();
      e.stopPropagation();
      closeImportSheet();
      return;
    }
    if (searchTravel.blurIfFocused()) return;
    if (openPanelId()) { closePanels(); return; }
    if (card.style.display !== 'none') {
      const restoreSurveyOpener = card.contains(document.activeElement)
        || captureCardController.diagnostics().pendingDisabledBodyFocusOwned;
      closeVisibleSurveyAndAscend(restoreSurveyOpener);
      return;
    }
    goUp();
  });
  emitBootPhase('wiring-complete');
  app.start();
  emitBootPhase('ticker-started');
  /* Runtime.addBinding installs this optional readiness seam before the
     document starts. Emit only after the complete slice, ticker, pointer,
     keyboard and persistence wiring above exists, allow the first animation
     frame, then cross one task boundary. This narrowly witnesses complete
     boot publication plus a serviced event-loop turn; later matrix actions
     remain the outcome/answerability proof. Ordinary play has no binding. */
  const emitBootReady = (): void => {
    requestAnimationFrame(() => {
      if (tickerTicks < 1) { emitBootReady(); return; }
      emitBootPhase('ready-scheduled');
      setTimeout(() => {
        /* This is the first point at which the rendered app has also serviced
           one event-loop turn with all input/persistence wiring present.
           Visibility and the tab lease were established earlier, but the
           active-play clock may not accrue until this answerability edge. */
        const runtime = f4Runtime;
        if (f4RuntimeMayAnswer(runtime)) runtime.setAnswerable(true);
        /* Real owners may queue during the initial surface render, but the
           heavy painter Worker cannot start until complete app wiring, one
           animation frame, and this serviced task boundary. */
        speciesArtLoader.activate();
        try {
          const binding = (window as unknown as Record<string, unknown>).__cfSliceReadyWitness;
          if (typeof binding !== 'function') return;
          const backdropBackingWidth = activeBackdropCanvas?.width ?? 0;
          const backdropBackingHeight = activeBackdropCanvas?.height ?? 0;
          const payload = JSON.stringify({
            schema: 'cf-v2-slice-ready/v1', status: 'ready', token: DOCUMENT_TOKEN,
            href: location.href, readyState: document.readyState,
            saveReady: !!save, viewConnected: app.canvas.isConnected,
            rendererReady: !!app.renderer && app.canvas.width > 1 && app.canvas.height > 1,
            stageReady: !!app.stage, tickerTicks,
            rendererDpr: app.renderer.resolution,
            backingPixelCapPerCanvas: densityPlan.backingPixelCapPerCanvas,
            viewportWidth: densityPlan.viewportWidth, viewportHeight: densityPlan.viewportHeight,
            backingWidth: app.canvas.width, backingHeight: app.canvas.height,
            backdropBackingWidth, backdropBackingHeight,
            combinedBackingPixels: app.canvas.width * app.canvas.height
              + backdropBackingWidth * backdropBackingHeight,
            performanceNow: performance.now(),
          });
          emitBootPhase('ready-emitted');
          (binding as (payload: string) => unknown)(payload);
        } catch { /* the evidence harness fails closed if its optional seam is broken */ }
      }, 0);
    });
  };
  if (document.readyState === 'complete') emitBootReady();
  else addEventListener('load', emitBootReady, { once: true });
})();
