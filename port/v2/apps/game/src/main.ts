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

   Field Training currently has 15 lesson IDs; a fuller hands-on curriculum remains
   on the V2 program roadmap. Atlas charting/favorites and rarity stings are live.
   Static deterministic Canvas species portraits and the preserved 43-biome landing vistas are live;
   retained Pixi actors, meshes, and portrait animation remain later work. */
import { Application, BatchTextureArray, Container, Graphics, Sprite, Texture, Text, TextStyle, cleanHash, extensions, CullerPlugin } from 'pixi.js';
import {
  galSpriteFor, decoSprite, getPlanetSprite, starSprite,
  _rockSet, _ringSprite, _starSurf, _moonSpr, _dwarfSpr,
  _rogueSpr, _beamSpr, _nsCoreSpr, _bhSpr, _cloudSpr,
  _wormSpr, snSiteSprite, _bhDiscSpr, _protoSpr,
  _quasarSpr, _visitorSpr, _comaSpr, _vtrailSpr,
  galaxyHaze,
} from '@cf/art';
import {
  combatCuePlan, initAudio, playRaritySting, playWhoosh, playSurveyPing,
  projectCombatCueParticipantsV1, applySfxGain,
} from '@cf/audio';
import type { AudioContextLike, AudioCounterpartReceipt } from '@cf/audio';
import {
  registerPanel, fillPanel, openPanel, closePanels, openPanelId,
  createPanelOpenController,
} from './panels.js';
import { capturePanelRefillFocus } from './panel-refill-focus.js';
import {
  CompendiumVirtualList,
  type CompendiumVirtualRow,
  type CompendiumReturnState,
  type CompendiumWindowSnapshot,
} from './compendium.js';
import {
  COMPENDIUM_FEED_OUTCOME_SCHEMA,
  CompendiumFeedController,
  projectCompendiumFeedV1,
  type CompendiumFeedActionOutcomeV1,
  type CompendiumFeedActionRequestV1,
  type CompendiumFeedReadModelV1,
  type CompendiumFeedSurfaceReceiptV1,
} from './compendium-feed.js';
import {
  COMPENDIUM_EXPLORER_MEAL_OUTCOME_SCHEMA_V1,
  CompendiumExplorerMealController,
  projectCompendiumExplorerMealV1,
  type CompendiumExplorerMealModelV1,
  type CompendiumExplorerMealOutcomeV1,
  type CompendiumExplorerMealRequestV1,
  type CompendiumExplorerMealSurfaceV1,
} from './compendium-explorer-meal.js';
import {
  commitArc5ExplorerMealActionV1,
  publishArc5ExplorerMealAchievementFields,
  type Arc5ExplorerMealActionOutcomeV1,
} from './explorer-meal-action.js';
import {
  CompendiumAuditionController,
  projectCompendiumAuditionV1,
  type CompendiumAuditionActionRequestV1,
  type CompendiumAuditionReadModelV1,
  type CompendiumAuditionSurfaceReceiptV1,
} from './compendium-audition.js';
import {
  COMPENDIUM_BREED_OUTCOME_SCHEMA,
  CompendiumBreedController,
  projectCompendiumBreedV1,
  type CompendiumBreedActionOutcomeV1,
  type CompendiumBreedActionRequestV1,
  type CompendiumBreedReadModelV1,
  type CompendiumBreedSurfaceReceiptV1,
} from './compendium-breed.js';
import {
  COMPENDIUM_RENAME_OUTCOME_SCHEMA,
  CompendiumRenameController,
  projectCompendiumRenameV1,
  type CompendiumRenameActionOutcomeV1,
  type CompendiumRenameActionRequestV1,
  type CompendiumRenameReadModelV1,
  type CompendiumRenameSurfaceReceiptV1,
} from './compendium-rename.js';
import {
  COMPENDIUM_SCOUT_OUTCOME_SCHEMA,
  CompendiumScoutController,
  projectCompendiumScoutV1,
  type CompendiumScoutActionOutcomeV1,
  type CompendiumScoutActionRequestV1,
  type CompendiumScoutReadModelV1,
  type CompendiumScoutSurfaceReceiptV1,
} from './compendium-scout.js';
import {
  projectCompendiumCreatureProgressionV1,
  type CompendiumCreatureProgressionV1,
} from './compendium-creature-progression.js';
import { CompendiumCreatureProgressionSurfaceV1 } from './compendium-creature-progression-surface.js';
import {
  bindSpeciesThumb,
  SpeciesArtLoader,
  SpeciesThumbLeaseGroup,
  type Portrait440,
  type SpeciesThumbBinding,
} from './species-art-loader.js';
import {
  initTraining, gameEvent, trainingActive, trainingStepId, refreshTrainingScope,
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
import {
  canonicalWorldRoster,
  isCanonicalWorldRoster,
  type CanonicalWorldRoster,
} from './world-roster.js';
import {
  createCurrentWorldDistantEcologyPlaybackV1,
  isCurrentWorldDistantEcologyPlaybackV1,
  type CurrentWorldDistantEcologyPlaybackV1,
  type CurrentWorldEcologyVisualReceiptV1,
} from './biome-ecology-audio.js';
import {
  ApproachEcologyController,
  projectApproachEcologyAudioV1,
  type ApproachEcologyReadModelV1,
  type ApproachEcologySurfaceReceiptV1,
} from './approach-ecology-audio.js';
import {
  biomeVistaMountLayoutV1,
  buildBiomeVistaRenderRequestV1,
} from './biome-vista-surface.js';
import { projectDescentApproachV1 } from './descent-policy.js';
import { projectLandingCardPresentationV1 } from './landing-card.js';
import {
  mountAndCommitBiomeVistaV1,
  mountCachedBiomeVistaV1,
} from './biome-vista-cache.js';
import {
  resolveVisualEffectPolicyV1,
  type VisualEffectPolicyV1,
} from './visual-effect-policy.js';
import {
  resolveCameraShakePolicyV1,
  type CameraShakePolicyV1,
} from './camera-shake-policy.js';
import type { VisualPolicyDeviceTierV1 } from './visual-policy-contract.js';
import { selectFogParticleCandidatesV1 } from './fog-particle-selection.js';
import {
  BIOME_VISTA_WORKER_REQUEST_SCHEMA,
  validBiomeVistaWorkerRenderMessageV1,
  validBiomeVistaWorkerResponseV1,
  type BiomeVistaWorkerRenderMessageV1,
  type BiomeVistaWorkerResponseV1,
} from './biome-vista-protocol.js';
import {
  biomeVistaWorkerResponseDispositionV1,
  biomeVistaWorkerResponseIdentityMatchesV1,
  containBiomeVistaWorkerErrorV1,
} from './biome-vista-worker-error.js';
import {
  polishGalaxyCanvasV1,
  polishSystemCanvasV1,
} from '@cf/art/surface-polish';
import type {
  GuideCategoryId, GuideCategoryView, GuideTopicId, GuideTopicView,
} from './guide-content.js';
import type { ReleaseNoteView, V2ShippedRelease } from './release-content.js';
import {
  V2_CURRENT_RELEASE_VERSION,
  V2_DEVELOPMENT_VERSION,
} from './release-identity.js';
import { projectDisplayRarity } from './rarity-presentation.js';
import {
  commitSearchTravelSequence,
  createSearchTravelController,
  navigationAuthorityFailureFor,
  type SearchTravelCommitPlan,
} from './search-travel.js';
import { createAppChromeController } from './app-chrome.js';
import {
  mountPwaUpdateControl,
  type PwaUpdateControl,
} from './pwa-update.js';
import { coordinatePwaReload } from './pwa-reload.js';
import { createFrameCoalescer } from './frame-coalescer.js';
import {
  NAV_HOME, enterGalaxy, enterSystem, land, ascend, navToView, resolveViewToNav,
  canonicalCF1WorldAddressFromNav, canonicalCF1WorldAtlasId,
  resolveCF1WorldAtlasId, CF1_WORLD_ATLAS_ID_PREFIX,
  resolveCF1Galaxy, resolveCF1Star, resolveCF1World,
  resolveCF1StarAddress, resolveCF1WorldAddress,
  isProvenPlanetFor, getProvenGalaxyKey, getProvenStarKey, getProvenPlanetKey,
  universeGalaxies, provenGalaxyCell, galaxyFineCell, galaxyCellWindow, systemScene,
  reachRadiusOf, currentRegionOf, ascHintFor, primeReachHint,
  reconcileV2Chapters, currentV2Objective, projectV2Charter,
  shipVisualStateOf,
  GR, GCELL, type NavState, type GalaxyNode, type PlanetNode,
  type ProvenGalaxy, type ProvenStar, type ProvenPlanet,
  type CanonicalCF1StarAddress, type CanonicalCF1WorldAddress,
  type ShipVisualState,
} from '@cf/scene';
import {
  SCENE_ENGINEERING_ADDRESS_RESOLVER, projectWorldOpportunity,
  type EngineeringStateV2, type WorldOpportunitySnapshot,
} from '@cf/domain-opportunity';
import {
  SCENE_OWNERSHIP_ADDRESS_RESOLVER,
  canonicalGenomeIdentityV1,
  capturePresentationFenceV1,
  formatCaptureChancePercentV1,
  ownershipSourceStateV1,
  ownershipStateDigestV1,
  ownershipStateDigestV2,
  projectCapturePresentationV1,
  sha256Hex,
  type AcquisitionVerbV1,
  type CapturePresentationReadyV1,
  type OwnershipStateV1,
  type OwnershipStateV2,
} from '@cf/domain-acquisition';
import { companionBreedOddsV1 } from '@cf/domain-acquisition/breed-internal';
import { guardianAcquisitionStateDigestV1 } from '@cf/domain-acquisition/guardian-acquisition-internal';
import { guardianCompanionStateDigestV1 } from '@cf/domain-acquisition/guardian-companion-internal';
import { galaxyProfile, systemFor, FCELL, galaxyWormhole, supernovaSites, galaxiesInCell, UNOISE } from '@cf/domain-worldgen';
import { SYS_R, UCELL, OBS_R, HOME_POS, SOL_SEED } from '@cf/domain-worldconfig';
import { galaxyName, starName, properName } from '@cf/domain-naming';
import { mulberry32, hashInt, TAU } from '@cf/domain-rand';
import {
  installCaptureHooks, planetDescriptor, describePickWithState,
  SOL_MOONS, galaxyStats, fmtBig,
  type Descriptor, type DescriptorPick,
} from '@cf/domain-descriptors';
import { cleanName, encodeWhere, regionAt } from '@cf/domain-strays';
import { describeSpecies } from '@cf/domain-genome';
import {
  PRIME_SIGNATURE_IDS_V1,
  battleStats,
  projectGuardianPrimeEncounterV1,
  STAT_NAMES,
  STAT_HUES,
  type GuardianPrimeEncounterV1,
} from '@cf/domain-combatcore';
import {
  STORES, F3_ACTIVE_PLAY_LEASE_KEY, F3_MAX_REVISION,
  createSaveRepository, createIndexedDBBackend,
  createRevisionedRepository, initializeFreshV5, migrateStoredV4ToV5,
  prepareV5Replacement, readF4Authority, readRevisionedSaveV5WithRecovery,
  arc4GuardianLegacyOwnershipMirrorMatchesV1,
  guardianLegacyCompanionSliceMatchesV1,
  stageGuardianLegacyCompanionSliceV1,
  readArc4Ownership,
  ARC4_OWNERSHIP_EXTENSION_TARGETS,
  ARC5_OWNERSHIP_MIGRATION_VERSION,
  ARC5_OWNERSHIP_EXTENSION_TARGETS,
  committedArc5OwnershipState,
  prepareArc5OwnershipMigration, readArc5OwnershipMigration,
  arc2LootLegacyMirrorMatches, prepareArc2LootLegacyMigration,
  prepareArc2LootInventoryWrite, projectArc2LootLegacyMirror,
  encodeArc2LootCarrier, readArc2EngineeringLoadout, readArc2Loot, readArc3Engineering,
  readCombatSettlementAuthorityV1,
  loadDescentWaveOffAuthorityV1,
  canonicalWorldLandingCount, createEmptyWorldIdentityState,
  encodeWorldIdentityExtensionWrites, hasCanonicalWorldLanded,
  prepareWorldIdentityBootstrap, readWorldIdentity,
  worldIdentityName,
  importSaveV2, exportSaveV2,
  type SaveStateV2, type ContentRegistry, type Arc2LootStateV1,
  type Arc5OwnershipMigrationEvidence,
  type PreparedArc5OwnershipMigrationV2,
  type ImportRouteIngressV2, type ImportTrainingSnapshotIngressV2,
  type StorageBackend, type V5Extensions,
  type CanonicalWorldIdentityStateV1,
} from '@cf/persistence';
import {
  MAX_GEAR_CAPACITY, projectEngineeringCapabilities,
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
  commitArc0LandingAction,
  operationForArc0Landing,
  projectArc0DescentWeatherV1,
  type Arc0LandingWitnessFacts,
} from './arc0-landing-action.js';
import {
  commitArc0AtlasAction,
  operationForArc0Atlas,
  type Arc0AtlasAlreadyDurableObservation,
  type Arc0AtlasWitnessFacts,
} from './arc0-atlas-action.js';
import {
  commitArc0WorldNameAction,
  operationForArc0WorldName,
} from './arc0-world-name-action.js';
import { projectCheckpointState } from './checkpoint-state.js';
import {
  EngineeringPanelController,
  type EngineeringPanelActionRequest,
} from './engineering-panel.js';
import {
  createProductActionCoordinator,
  createProductActionDiagnosticHold,
} from './product-action-coordinator.js';
import {
  createTravelPresentationOwner,
  type TravelPresentationRequest,
} from './travel-presentation.js';
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
  verifyArc3CommittedMineAction,
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
  commitArc5FeedActionV1,
  type Arc5FeedActionOutcomeV1,
} from './arc5-feed-action.js';
import {
  commitArc5BreedActionV1,
  publishArc5BreedSaveFieldsV1,
  type Arc5BreedActionOutcomeV1,
} from './arc5-breed-action.js';
import {
  commitArc5RenameActionV1,
  publishArc5RenameAchievementFields,
  type Arc5RenameActionOutcomeV1,
} from './arc5-rename-action.js';
import {
  commitArc5ScoutActionV1,
  publishArc5ScoutCharterFieldsV1,
  type Arc5ScoutActionOutcomeV1,
} from './arc5-scout-action.js';
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
  type FeedExpressionClaim,
  type CombatAudioSessionClaim,
} from './tame-greeting-audio.js';
import {
  createF4RuntimeAuthority,
  type F4RuntimeAuthority,
} from './f4-runtime-authority.js';
import {
  arc6CombatOpenPolicyReasonV1,
  commitArc6CombatActionV1,
  projectArc6CombatChampionAvailabilityV1,
  projectArc6CombatChampionRosterV1,
  type Arc6CombatActionOutcomeV1,
  type Arc6CombatChampionRosterV1,
} from './arc6-combat-action.js';
import {
  COMBAT_CARD_OUTCOME_SCHEMA,
  CombatCardController,
  projectCombatCardReadModelV1,
  type CombatCardActionOutcomeV1,
  type CombatCardActionRequestV1,
} from './combat-card.js';
import {
  CombatChronicleController,
  projectCombatChronicleV1,
  type CombatChronicleCueEmissionV1,
} from './combat-chronicle.js';
import {
  ARC9_PROGRESSION_REFRESH_OPERATION_V1,
  commitArc9ProgressionRefreshV1,
  type Arc9ProgressionRefreshActionOutcomeV1,
} from './arc9-progression-action.js';
import {
  planProgressionCeremonyV1,
  type AchievementCeremonyNotificationV1,
  type ProgressionCeremonyInputV1,
  type RankPromotionCeremonyV1,
} from './progression-ceremony.js';
import {
  ARC9_NAMEPLATE_CHOICE_OPERATION_V1,
  commitArc9NameplateChoiceV1,
  type Arc9NameplateChoiceActionOutcomeV1,
} from './arc9-nameplate-action.js';
import {
  ARC9_FRONTIER_ENDING_OPERATION_V1,
  commitArc9FrontierEndingChoiceV1,
  type Arc9FrontierEndingActionOutcomeV1,
} from './arc9-frontier-ending-action.js';
import {
  projectPrimeCodexV1,
  renderPrimeCodexPanelV1,
} from './prime-codex-panel.js';
import {
  STARTER_CHARTER_IDS_V1,
  commitStarterCharterAcceptV1,
  operationForStarterCharterAcceptV1,
  projectStarterCharterBoardV1,
  publishStarterCharterAcceptFieldsV1,
  renderStarterCharterBoardV1,
  type StarterCharterAcceptActionOutcomeV1,
  type StarterCharterIdV1,
} from './starter-charters.js';
import {
  ARC9_BINDER_CLAIMABLE_SET_IDS_V1,
  commitArc9BinderSetClaimV1,
  operationForArc9BinderSetClaimV1,
  projectArc9BinderReadModelV1,
  publishArc9BinderSetClaimFieldsV1,
  renderArc9BinderPanelV1,
  type Arc9BinderClaimableSetIdV1,
  type Arc9BinderSetClaimActionOutcomeV1,
} from './binder-sets.js';
import { projectArc9ParagonFinderV1 } from './paragon-finder.js';
import {
  ARC9_EXPLORER_NAME_OPERATION_V1,
  commitArc9ExplorerNameChangeV1,
  prepareArc9ExplorerNameChangeV1,
  type Arc9ExplorerNameActionOutcomeV1,
} from './arc9-explorer-name-action.js';
import {
  ARC9_SHARE_FOLLOW_OPERATION_V1,
  ARC9_SHARE_SEND_OPERATION_V1,
  commitArc9SharingActionV1,
  publishArc9SharingFieldsV1,
  type Arc9SharingActionOutcomeV1,
} from './arc9-sharing-action.js';
import {
  commitArc9SurveySettlementV1,
  deriveArc9SurveyFactV1,
  operationForArc9SurveyV1,
  prepareArc9SurveySettlementV1,
  publishArc9SurveyFieldsV1,
  type Arc9SurveyActionOutcomeV1,
  type Arc9SurveyAddressV1,
} from './arc9-survey-action.js';
import {
  commitBioscanActionV1,
  projectBioscanActionV1,
  publishBioscanActionV1,
  type BioscanActionProjectionV1,
} from './bioscan-action.js';
import { runSurveyLandHandoffV1 } from './survey-land-handoff.js';
import {
  commitArc9AtlasFavoriteV1,
  operationForArc9AtlasFavoriteV1,
  publishArc9AtlasFavoriteFieldsV1,
  type Arc9AtlasFavoriteActionOutcomeV1,
} from './arc9-atlas-favorite-action.js';
import {
  commitArc9AtlasHomeV1,
  commitArc9AtlasRemoveV1,
  commitArc9AtlasUndoV1,
  operationForArc9AtlasHomeV1,
  operationForArc9AtlasRemoveV1,
  operationForArc9AtlasUndoV1,
  publishArc9AtlasHomeFieldsV1,
  publishArc9AtlasRemoveFieldsV1,
  publishArc9AtlasUndoFieldsV1,
  type Arc9AtlasDeleteReceiptV1,
} from './arc9-atlas-row-actions.js';
import {
  projectStarAtlasV1,
  renderStarAtlasV1,
  STAR_ATLAS_FILTERS_V1,
  STAR_ATLAS_VIEWS_V1,
  type StarAtlasFilterV1,
  type StarAtlasViewV1,
} from './star-atlas-panel.js';
import {
  commitArc9GalaxyArrivalRouteV1,
  commitArc9TravelSettlementV1,
  operationForArc9TravelV1,
  publishArc9TravelFieldsV1,
  type Arc9TravelActionKindV1,
  type Arc9TravelActionOutcomeV1,
} from './arc9-travel-action.js';
import { projectArc9RecordsRankReadModelV1 } from './records-rank-model.js';
import { renderArc9RecordsRankPanelV1 } from './records-rank-panel.js';
import {
  projectExpeditionChronicleV1,
  renderExpeditionChronicleV1,
} from './expedition-chronicle.js';
import {
  projectArc9NameplateSettingsV1,
  renderArc9NameplateSettingV1,
} from './nameplate-settings.js';
import {
  assessArc9ExplorerNameDraftV1,
  projectArc9ExplorerNameSettingsV1,
  renderArc9ExplorerNameSettingV1,
} from './explorer-name-settings.js';
import {
  f4AuthorityConvergenceWitnessErrors,
  latchF4AuthorityConvergenceReload,
} from './f4-convergence-latch.js';
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
/* Keep one exact SceneMemory route's 9 Compendium + 8 Planetside thumbs warm.
   Repainting the same bounded set on every navigation grows V8's worker/task
   churn even after every cache, lease and DOM owner has been released. */
const QUIESCENT_SPECIES_ART_CACHE = Object.freeze({ retainRecentThumbEntries: 17 });
const F4_LEASE_TTL_MS = 10_000;
const F4_HEARTBEAT_MS = F4_LEASE_TTL_MS / 2;
const F4_CHECKPOINT_MS = 30_000;
const F4_OWNER_ID = 'celestial-frontier-game-tab';
const F4_START_HIDDEN_FOR_SMOKE = __CF_EVIDENCE_BUILD__
  && typeof (window as unknown as Record<string, unknown>).__cfF4StartHidden === 'function';
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
let arc4OwnershipBootstrapVerification: 'full-composite' | 'guardian-slice' | null = null;
let arc4OwnershipProtection: string | null = null;
let lastArc4BootstrapOutcome: string | null = null;
let lastArc4CaptureOutcome: string | null = null;
let arc5OwnershipState: OwnershipStateV2 | null = null;
let arc5OwnershipEvidence: Arc5OwnershipMigrationEvidence | null = null;
let arc5OwnershipBootstrapPrepared: PreparedArc5OwnershipMigrationV2 | null = null;
let arc5OwnershipBootstrapPending = false;
let arc5OwnershipProtection: string | null = null;
let lastArc5BootstrapOutcome: string | null = null;
let lastArc5FeedOutcome: string | null = null;
type Arc5FeedResult = Readonly<{
  creatureId: string;
  foodLotId: string;
  fedBefore: number;
  fedAfter: number;
  foodQuantityBefore: number;
  foodQuantityAfter: number;
  lotTombstoned: boolean;
  receiptOrdinal: number;
  revision: number;
  ownershipRevision: number;
}>;
let lastArc5FeedResult: Arc5FeedResult | null = null;
let lastArc5ExplorerMealOutcome: string | null = null;
type Arc5ExplorerMealResult = Readonly<{
  poisoned: boolean;
  hpBefore: number;
  hpAfter: number;
  hpMaxBefore: number;
  hpMaxAfter: number;
  nourishedStat: 'vit' | 'fer' | 'res' | 'agi' | 'ins';
  statIncrease: number;
  foodLotId: string;
  foodQuantityBefore: number;
  foodQuantityAfter: number;
  receiptOrdinal: number;
  revision: number;
  ownershipRevision: number;
}>;
let lastArc5ExplorerMealResult: Arc5ExplorerMealResult | null = null;
let lastArc5BreedOutcome: string | null = null;
type Arc5BreedResult = Readonly<{
  result: 'success' | 'failure';
  parentCreatureIds: readonly [string, string];
  childCreatureId: string | null;
  odds: number;
  recoveryDurationMs: number;
  recoveryReadyAtActivePlayMs: number;
  charterBredBanked: boolean;
  childXpAwarded: 0 | 2 | 7;
  speciesPairXpKey: string;
  speciesPairFirstXpAwarded: boolean;
  xpFirstsTotalCount: number;
  receiptOrdinal: number;
  revision: number;
  ownershipRevision: number;
}>;
let lastArc5BreedResult: Arc5BreedResult | null = null;
let lastArc5RenameOutcome: string | null = null;
type Arc5RenameResult = Readonly<{
  creatureId: string;
  nicknameBefore: string | null;
  nicknameAfter: string;
  receiptOrdinal: number;
  revision: number;
  ownershipRevision: number;
}>;
let lastArc5RenameResult: Arc5RenameResult | null = null;
let lastArc5ScoutOutcome: string | null = null;
type Arc5ScoutResult = Readonly<{
  scoutBefore: string | null;
  scoutAfter: string | null;
  receiptOrdinal: number;
  revision: number;
  ownershipRevision: number;
}>;
let lastArc5ScoutResult: Arc5ScoutResult | null = null;
let worldIdentityState: CanonicalWorldIdentityStateV1 = createEmptyWorldIdentityState();
let worldIdentityBootstrapPending = false;
let worldIdentityProtection: string | null = null;
let smokeRejectNextArc0LandingStorage = false;
let smokeStaleNextArc0LandingAuthority = false;
let smokeRejectNextArc0LandingPublication = false;
let lastSmokeArc0LandingFaultWitness: Readonly<{
  schema: 'cf-v2-arc0-landing-fault-witness/v1';
  operation: string;
  injection: 'storage-failure' | 'stale-authority' | 'publication-failure';
  phase: 'injecting' | 'settled' | 'injection-failed';
  beforeRevision: number;
  injectedRevision: number | null;
  outcome: string | null;
}> | null = null;
let currentCapturePresentationFence: string | null = null;
let tameGreetingAudioOwner: TameGreetingAudioOwner | null = null;
let smokeRejectNextArc4ActionStorage = false;
let smokeStaleNextArc4ActionAuthority = false;
let smokeRejectNextArc4Publication = false;
let smokeRejectNextArc5FeedStorage = false;
let smokeStaleNextArc5FeedAuthority = false;
let smokeRejectNextArc5FeedPublication = false;
let lastSmokeArc5FeedFaultWitness: Readonly<{
  schema: 'cf-v2-arc5-feed-fault-witness/v1';
  injection: 'storage-failure' | 'stale-authority' | 'publication-failure';
  phase: 'injecting' | 'settled' | 'injection-failed';
  beforeRevision: number;
  injectedRevision: number | null;
  outcome: string | null;
}> | null = null;
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
let f4AuthorityProtectionRenderError: string | null = null;
let smokeRejectNextF4HideCheckpoint = false;
let smokeRejectNextF4HeartbeatStorage = false;
let smokeRejectNextF4RevisionVerification = false;
let smokeF4LeaseReadCount = 0;
let smokeF4RevisionReadCount = 0;
/* Even an unarmed evidence hold is async. Keep that same await boundary in
   ordinary play without constructing any armable gate or retained latch. */
const inactiveEvidenceHold: ReturnType<typeof createProductActionDiagnosticHold> = Object.freeze({
  arm: () => false,
  async holdIfArmed(_operation: string): Promise<void> {},
  release: () => false,
  diagnostics: () => Object.freeze({
    schema: 'cf-v2-product-action-hold-diagnostics/v1' as const,
    phase: 'idle' as const, operation: null, sequence: 0,
  }),
});
const smokeF4ConvergenceReloadHold = __CF_EVIDENCE_BUILD__
  ? createProductActionDiagnosticHold() : inactiveEvidenceHold;
let lastF4HeartbeatStorageFault: Readonly<{
  schema: 'cf-v2-f4-heartbeat-storage-fault/v1';
  context: string;
  operation: 'acquire' | 'renew';
  message: string;
  leaseReadCount: number;
}> | null = null;
let lastF4RevisionVerificationFault: Readonly<{
  schema: 'cf-v2-f4-revision-verification-fault/v1';
  message: string;
  revisionReadCount: number;
}> | null = null;
let lastF4HideWitness: Readonly<{
  schema: 'cf-v2-f4-hide/v1'; checkpoint: 'committed' | 'skipped' | 'rejected';
  checkpointError: string | null; visibilityAttempted: boolean;
  visibilityOutcome: string | null; visibilityError: string | null;
}> | null = null;
function scheduleF4AuthorityConvergenceReload(runtime: F4RuntimeAuthority, detail: string): void {
  clearArc9AtlasUndo();
  persistHold = 'transient-read';
  persistenceProtectedDetail = detail;
  runtime.setAnswerable(false);
  tameGreetingAudioOwner?.setAnswerable(false);
  stopF4Heartbeat();
  const scheduleReload = (): void => {
    setTimeout(() => { void (async () => {
      await smokeF4ConvergenceReloadHold.holdIfArmed('f4-authority-convergence');
      const before = Object.freeze({
        hold: persistHold || null,
        mutationBlocked: playerMutationsBlocked(),
        heartbeatRunning: f4HeartbeatTimer !== 0,
        leaseReadCount: smokeF4LeaseReadCount,
        revisionReadCount: smokeF4RevisionReadCount,
        runtime: runtime.diagnostics(),
        audio: tameGreetingAudioOwner?.diagnostics() ?? null,
      });
      const errors = f4AuthorityConvergenceWitnessErrors(
        f4AuthorityProtectionRenderError,
      );
      const audioOwner = tameGreetingAudioOwner;
      try { await audioOwner?.dispose(); }
      catch (error) { errors.push(error instanceof Error ? error.message : String(error)); }
      try { await runtime.release(); }
      catch (error) { errors.push(error instanceof Error ? error.message : String(error)); }
      if (f4Runtime === runtime) f4Runtime = null;
      const afterAudio = audioOwner?.diagnostics() ?? null;
      const witness = Object.freeze({
        schema: 'cf-v2-f4-authority-convergence/v1' as const,
        status: errors.length === 0 && tameGreetingAudioReleasedForReload(afterAudio)
          ? 'released' as const : 'release-failed' as const,
        errors: Object.freeze(errors),
        detail,
        documentToken: DOCUMENT_TOKEN,
        before,
        after: Object.freeze({
          heartbeatRunning: f4HeartbeatTimer !== 0,
          leaseReadCount: smokeF4LeaseReadCount,
          revisionReadCount: smokeF4RevisionReadCount,
          runtime: runtime.diagnostics(),
          audio: afterAudio,
        }),
      });
      try {
        const binding = __CF_EVIDENCE_BUILD__
          ? (window as unknown as Record<string, unknown>).__cfF4AuthorityConvergenceWitness : undefined;
        if (typeof binding === 'function') {
          (binding as (payload: string) => unknown)(JSON.stringify(witness));
        }
      } catch { /* optional diagnostics must never strand convergence */ }
      location.reload();
    })(); }, 0);
  };
  latchF4AuthorityConvergenceReload({
    alreadyScheduled: f4AuthorityReloadScheduled,
    latch: () => { f4AuthorityReloadScheduled = true; },
    schedule: scheduleReload,
    /* Authority protection is a presentation transition too. An already-open
       Shipyard must discard its verified Engineering model immediately instead
       of leaving stale action controls painted until the convergence reload. */
    repaint: () => {
      if (openPanelId() === 'shipyard') refreshEngineeringPanelState();
      if (openPanelId() === 'codex' && codexMode === 'detail') {
        refreshCompendiumFeedState();
      }
    },
    onRepaintError: (error) => {
      f4AuthorityProtectionRenderError ??=
        error instanceof Error ? error.message : String(error);
    },
  });
}
type F4HeartbeatStorageError = Extract<
  Awaited<ReturnType<F4RuntimeAuthority['heartbeat']>>,
  { readonly kind: 'storage-error' }
>;
function handleF4HeartbeatStorageError(
  runtime: F4RuntimeAuthority,
  outcome: F4HeartbeatStorageError,
  context: string,
): void {
  /* A failed acquire/renew leaves the durable lease unknowable. The runtime
     has already revoked its local grant; the app must likewise stop every
     answerable/player-mutation surface and converge through a reload instead
     of letting the periodic timer silently reacquire in this document. */
  lastF4HeartbeatStorageFault = Object.freeze({
    schema: 'cf-v2-f4-heartbeat-storage-fault/v1',
    context,
    operation: outcome.operation,
    message: outcome.message,
    leaseReadCount: smokeF4LeaseReadCount,
  });
  persistenceBootKind = 'transient-protected';
  scheduleF4AuthorityConvergenceReload(
    runtime,
    `${context}: lease ${outcome.operation} storage failure (${outcome.message})`,
  );
}
async function ensureF4RevisionCurrent(runtime: F4RuntimeAuthority): Promise<boolean> {
  try {
    smokeF4RevisionReadCount += 1;
    if (__CF_EVIDENCE_BUILD__ && smokeRejectNextF4RevisionVerification) {
      smokeRejectNextF4RevisionVerification = false;
      throw new Error('slice-smoke injected F4 revision verification failure');
    }
    const durableRevision = await revisionRepo.revision();
    if (durableRevision === runtime.revision) return true;
    scheduleF4AuthorityConvergenceReload(
      runtime,
      `lease acquisition observed revision ${runtime.revision}/${durableRevision}; reloading stable authority`,
    );
    return false;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    lastF4RevisionVerificationFault = Object.freeze({
      schema: 'cf-v2-f4-revision-verification-fault/v1',
      message,
      revisionReadCount: smokeF4RevisionReadCount,
    });
    persistenceBootKind = 'transient-protected';
    scheduleF4AuthorityConvergenceReload(
      runtime,
      `revision verification failed (${message})`,
    );
    return false;
  }
}
async function ensureBootAuthorityCommit(runtime: F4RuntimeAuthority): Promise<boolean> {
  if (!arc5OwnershipBootstrapPending
    && !f4SeedBootstrapPending && !bootRouteRepairPending
    && !arc2LootBootstrapPending && !arc3EngineeringBootstrapPending
    && !arc4OwnershipBootstrapPending && !worldIdentityBootstrapPending) return true;
  if (runtime !== f4Runtime || !runtime.diagnostics().leaseOwned) return false;
  if (bootAuthorityCommitInFlight) return bootAuthorityCommitInFlight;
  const productBootstrapWasPending = arc2LootBootstrapPending;
  const engineeringBootstrapWasPending = arc3EngineeringBootstrapPending;
  const ownershipBootstrapWasPending = arc4OwnershipBootstrapPending;
  const ownershipStateAtCommit = arc4OwnershipState;
  const ownershipBootstrapVerificationAtCommit = arc4OwnershipBootstrapVerification;
  const ownershipV2BootstrapWasPending = arc5OwnershipBootstrapPending;
  const ownershipV2StateAtCommit = arc5OwnershipState;
  const ownershipV2PreparedAtCommit = arc5OwnershipBootstrapPrepared;
  const worldIdentityBootstrapWasPending = worldIdentityBootstrapPending;
  const worldIdentityStateAtCommit = worldIdentityState;
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
        const rejector = __CF_EVIDENCE_BUILD__
          ? (window as unknown as Record<string, unknown>).__cfRejectArc2ProductBootstrap : undefined;
        if (typeof rejector === 'function' && (rejector as (payload: string) => unknown)(JSON.stringify({
          schema: 'cf-v2-arc2-bootstrap-control/v1',
          documentToken: DOCUMENT_TOKEN,
          stateKind: arc2LootState?.kind ?? null,
        })) === true) {
          throw new Error('slice-smoke injected Arc 2 product bootstrap rejection');
        }
      }
      if (engineeringBootstrapWasPending) {
        const rejector = __CF_EVIDENCE_BUILD__
          ? (window as unknown as Record<string, unknown>).__cfRejectArc3EngineeringBootstrap : undefined;
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
          const legacyMirrorConverged = ownershipBootstrapVerificationAtCommit === 'guardian-slice'
            ? guardianLegacyCompanionSliceMatchesV1(
              seeded.saved.extensions,
              seeded.saved.canonicalState,
            )
            : ownershipBootstrapVerificationAtCommit === 'full-composite'
              && arc4GuardianLegacyOwnershipMirrorMatchesV1(
                loaded.state,
                seeded.saved.extensions,
                seeded.saved.canonicalState,
              );
          if (!legacyMirrorConverged) {
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
      if (worldIdentityBootstrapWasPending) {
        const loaded = readWorldIdentity(seeded.saved.extensions);
        const expectedWrites = encodeWorldIdentityExtensionWrites(worldIdentityStateAtCommit);
        if (loaded.kind !== 'loaded') {
          throw new Error('canonical world identity carrier did not converge');
        }
        const loadedWrites = encodeWorldIdentityExtensionWrites(loaded.state);
        if (loadedWrites.some((write, index) => (
          write.carrier.json !== expectedWrites[index]!.carrier.json
        ))) {
          throw new Error('canonical world identity carrier did not converge');
        }
        worldIdentityState = loaded.state;
        worldIdentityProtection = null;
      }
      bootProductBootstrapCandidate = null;
      f4SeedBootstrapPending = false;
      bootRouteRepairPending = false;
      arc2LootBootstrapPending = false;
      arc3EngineeringBootstrapPending = false;
      arc4OwnershipBootstrapPending = false;
      arc4OwnershipBootstrapVerification = null;
      arc5OwnershipBootstrapPending = false;
      arc5OwnershipBootstrapPrepared = null;
      worldIdentityBootstrapPending = false;
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
      arc4OwnershipBootstrapVerification = null;
      arc5OwnershipBootstrapPending = false;
      arc5OwnershipBootstrapPrepared = null;
      worldIdentityBootstrapPending = false;
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
      if (worldIdentityBootstrapWasPending) {
        worldIdentityState = createEmptyWorldIdentityState();
        worldIdentityProtection = durable
          ? 'committed-publication-reload' : 'bootstrap-failed';
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
    || arc4OwnershipBootstrapPending || worldIdentityBootstrapPending
    || worldIdentityProtection !== null) return false;
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
type F4HeartbeatCycleReason =
  | 'smoke-quiesced'
  | 'runtime-unavailable'
  | 'persistence-held'
  | 'page-hidden'
  | 'persist-in-flight'
  | 'import-in-flight'
  | 'replacement-in-flight'
  | 'runtime-heartbeat-in-flight'
  | 'lease-held-by-other'
  | 'lease-lost'
  | 'revision-refused'
  | 'bootstrap-refused'
  | 'storage-error';
type F4HeartbeatCycleReceipt = Readonly<{
  schema: 'cf-v2-f4-heartbeat-cycle-receipt/v1';
  documentToken: string;
  cycle: 'completed' | 'skipped' | 'failed';
  reason: F4HeartbeatCycleReason | null;
  refresh: Readonly<{
    shipyard: 'completed' | 'panel-closed' | 'product-action-in-flight' | 'not-reached';
    compendium: 'completed' | 'panel-closed' | 'not-detail'
      | 'product-action-in-flight' | 'not-reached';
    capture: 'completed' | 'card-hidden' | 'surface-not-owned'
      | 'product-action-in-flight' | 'not-reached';
  }>;
}>;
const F4_HEARTBEAT_REFRESH_NOT_REACHED = Object.freeze({
  shipyard: 'not-reached' as const,
  compendium: 'not-reached' as const,
  capture: 'not-reached' as const,
});
function f4HeartbeatCycleReceipt(
  cycle: F4HeartbeatCycleReceipt['cycle'],
  reason: F4HeartbeatCycleReason | null,
  refresh: F4HeartbeatCycleReceipt['refresh'] = F4_HEARTBEAT_REFRESH_NOT_REACHED,
): F4HeartbeatCycleReceipt {
  return Object.freeze({
    schema: 'cf-v2-f4-heartbeat-cycle-receipt/v1' as const,
    documentToken: DOCUMENT_TOKEN,
    cycle,
    reason,
    refresh: Object.freeze({ ...refresh }),
  });
}
let f4HeartbeatCycleInFlight: Promise<F4HeartbeatCycleReceipt> | null = null;
let f4HeartbeatSmokeQuiesced = false;
const F4_HEARTBEAT_CYCLE_CHECKPOINT_OWNER = Symbol('f4-heartbeat-cycle-checkpoint-owner');
const F4_LIFECYCLE_CHECKPOINT_OWNER = Symbol('f4-lifecycle-checkpoint-owner');
const runF4HeartbeatCycle = async (): Promise<F4HeartbeatCycleReceipt> => {
  if (!f4Runtime) return f4HeartbeatCycleReceipt('skipped', 'runtime-unavailable');
  if (persistHold) return f4HeartbeatCycleReceipt('skipped', 'persistence-held');
  if (!f4PageVisible()) return f4HeartbeatCycleReceipt('skipped', 'page-hidden');
  if (activePersist) return f4HeartbeatCycleReceipt('skipped', 'persist-in-flight');
  if (importWriteInFlight) return f4HeartbeatCycleReceipt('skipped', 'import-in-flight');
  if (replacementTransaction) return f4HeartbeatCycleReceipt('skipped', 'replacement-in-flight');
  if (f4HeartbeatInFlight) {
    await f4HeartbeatInFlight;
    return f4HeartbeatCycleReceipt('skipped', 'runtime-heartbeat-in-flight');
  }
  let heartbeatOwned = false;
  let heartbeatKind: 'owned' | 'held-by-other' | 'storage-error' | 'lost' | null = null;
  let checkpointDue = false;
  const runtime = f4Runtime;
  const run = runtime.heartbeat().then((outcome) => {
    heartbeatKind = outcome.kind;
    if (outcome.kind === 'storage-error') {
      handleF4HeartbeatStorageError(runtime, outcome, 'periodic F4 heartbeat');
      return;
    }
    heartbeatOwned = outcome.kind === 'owned';
    checkpointDue = outcome.kind === 'owned'
      && performance.now() - f4LastCheckpointAt >= F4_CHECKPOINT_MS;
  });
  f4HeartbeatInFlight = run;
  try { await run; }
  finally { if (f4HeartbeatInFlight === run) f4HeartbeatInFlight = null; }
  if (!heartbeatOwned) {
    if (heartbeatKind === 'storage-error') {
      return f4HeartbeatCycleReceipt('failed', 'storage-error');
    }
    return f4HeartbeatCycleReceipt(
      'skipped',
      heartbeatKind === 'held-by-other' ? 'lease-held-by-other' : 'lease-lost',
    );
  }
  if (heartbeatOwned) {
    if (!await ensureF4RevisionCurrent(runtime)) {
      return f4HeartbeatCycleReceipt('skipped', 'revision-refused');
    }
    if ((f4SeedBootstrapPending || bootRouteRepairPending
      || arc2LootBootstrapPending || arc3EngineeringBootstrapPending
      || arc4OwnershipBootstrapPending || arc5OwnershipBootstrapPending
      || worldIdentityBootstrapPending)
      && !await ensureBootAuthorityCommit(runtime)) {
      return f4HeartbeatCycleReceipt('skipped', 'bootstrap-refused');
    }
    if (f4RuntimeMayAnswer(runtime)) {
      runtime.setAnswerable(app.ticker?.started === true);
      tameGreetingAudioOwner?.setAnswerable(runtime.diagnostics().answerable);
    }
  }
  /* A receipt-bearing product action or ordinary checkpoint may already own
     activePersist while awaiting this complete heartbeat cycle. Never queue
     this cycle's checkpoint behind that barrier. The only self-owned persist
     receives the private token which prevents it from awaiting its own tail. */
  if (checkpointDue && !productActionInFlight && !activePersist) {
    await persistView(null, 'ordinary', F4_HEARTBEAT_CYCLE_CHECKPOINT_OWNER);
  }
  let shipyardRefresh: F4HeartbeatCycleReceipt['refresh']['shipyard'] =
    openPanelId() !== 'shipyard' ? 'panel-closed' : 'product-action-in-flight';
  if (heartbeatOwned && openPanelId() === 'shipyard' && !productActionInFlight) {
    refreshEngineeringPanelState();
    shipyardRefresh = 'completed';
  }
  let compendiumRefresh: F4HeartbeatCycleReceipt['refresh']['compendium'] =
    openPanelId() !== 'codex' ? 'panel-closed'
      : codexMode !== 'detail' ? 'not-detail' : 'product-action-in-flight';
  if (heartbeatOwned && openPanelId() === 'codex' && codexMode === 'detail'
    && !productActionInFlight) {
    refreshCompendiumFeedState();
    compendiumRefresh = 'completed';
  }
  let captureRefresh: F4HeartbeatCycleReceipt['refresh']['capture'] =
    card.style.display === 'none' ? 'card-hidden'
      : 'product-action-in-flight';
  if (heartbeatOwned && card.style.display !== 'none'
    && surveyOwnsCurrentCaptureSurface() && !productActionInFlight) {
    refreshCaptureCardState();
    refreshCombatCardState();
    captureRefresh = 'completed';
  } else if (card.style.display !== 'none' && !productActionInFlight) {
    captureRefresh = 'surface-not-owned';
  }
  return f4HeartbeatCycleReceipt('completed', null, {
    shipyard: shipyardRefresh,
    compendium: compendiumRefresh,
    capture: captureRefresh,
  });
};
const heartbeatF4 = (): Promise<F4HeartbeatCycleReceipt> => {
  if (f4HeartbeatSmokeQuiesced) {
    return Promise.resolve(f4HeartbeatCycleReceipt('skipped', 'smoke-quiesced'));
  }
  if (f4HeartbeatCycleInFlight) return f4HeartbeatCycleInFlight;
  const run = runF4HeartbeatCycle();
  const tracked = run.finally(() => {
    if (f4HeartbeatCycleInFlight === tracked) f4HeartbeatCycleInFlight = null;
  });
  f4HeartbeatCycleInFlight = tracked;
  return tracked;
};
const settleF4Heartbeat = async (): Promise<void> => {
  const cycle = f4HeartbeatCycleInFlight;
  if (cycle) await cycle;
};
const startF4Heartbeat = (): void => {
  if (f4HeartbeatSmokeQuiesced || !f4Runtime || persistHold
    || !f4PageVisible() || f4HeartbeatTimer !== 0) return;
  f4HeartbeatTimer = window.setInterval(() => { void heartbeatF4(); }, F4_HEARTBEAT_MS);
};
const quiesceF4HeartbeatForSmoke = async (): Promise<Readonly<{
  schema: 'cf-v2-f4-heartbeat-quiescence/v1';
  documentToken: string;
  wasRunning: boolean;
  stopped: boolean;
  cycleSettled: boolean;
}>> => {
  const wasRunning = f4HeartbeatTimer !== 0;
  f4HeartbeatSmokeQuiesced = true;
  stopF4Heartbeat();
  while (f4HeartbeatCycleInFlight) await f4HeartbeatCycleInFlight;
  return Object.freeze({
    schema: 'cf-v2-f4-heartbeat-quiescence/v1',
    documentToken: DOCUMENT_TOKEN,
    wasRunning,
    stopped: f4HeartbeatTimer === 0,
    cycleSettled: f4HeartbeatCycleInFlight === null,
  });
};
const resumeF4HeartbeatForSmoke = (): Readonly<{
  schema: 'cf-v2-f4-heartbeat-resume/v1';
  documentToken: string;
  running: boolean;
}> => {
  f4HeartbeatSmokeQuiesced = false;
  startF4Heartbeat();
  return Object.freeze({
    schema: 'cf-v2-f4-heartbeat-resume/v1',
    documentToken: DOCUMENT_TOKEN,
    running: f4HeartbeatTimer !== 0,
  });
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
      if (__CF_EVIDENCE_BUILD__ && smokeRejectNextF4HideCheckpoint) {
        smokeRejectNextF4HideCheckpoint = false;
        throw new Error('slice-smoke injected F4 hide checkpoint rejection');
      }
      await settleF4Heartbeat();
      checkpoint = await persistView(
        null,
        'ordinary',
        null,
        F4_LIFECYCLE_CHECKPOINT_OWNER,
      ) ? 'committed' : 'skipped';
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
  if (!runtime || persistHold || !f4PageVisible()) return;
  const outcome = await runtime.setVisible(true);
  if (outcome.kind === 'storage-error') {
    handleF4HeartbeatStorageError(runtime, outcome, 'visible F4 heartbeat');
    return;
  }
  if (outcome.kind === 'owned') {
    if (!await ensureF4RevisionCurrent(runtime)) return;
    if ((f4SeedBootstrapPending || bootRouteRepairPending
      || arc2LootBootstrapPending || arc3EngineeringBootstrapPending
      || arc4OwnershipBootstrapPending || arc5OwnershipBootstrapPending
      || worldIdentityBootstrapPending)
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
  travelPresentationOwner.cancel();
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
type ReplacementReloadReason = 'training-restart' | 'training-complete' | 'training-recovery' | 'save-import' | 'storage-retry' | 'pwa-update';
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
  if (!__CF_EVIDENCE_BUILD__) return;
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
      const binding = __CF_EVIDENCE_BUILD__
        ? (window as unknown as Record<string, unknown>).__cfReloadReleaseWitness : undefined;
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
let pwaUpdateControl: PwaUpdateControl | null = null;
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
let smokeRejectArc0LandingStorageBoundary = false;
let smokeRejectArc3StorageBoundary = false;
let smokeRejectArc4StorageBoundary = false;
let smokeRejectArc5FeedStorageBoundary = false;
/* Browser-gate one-shot storage faults still cross the production revision
   repository and exact product-action owner. Only the armed action-scoped
   compare-and-apply is rejected; ordinary play delegates byte-for-byte. */
const persistenceBackend: StorageBackend = __CF_EVIDENCE_BUILD__ ? {
  get: (store, key) => {
    if (store === 'meta' && key === F3_ACTIVE_PLAY_LEASE_KEY) {
      smokeF4LeaseReadCount++;
      if (smokeRejectNextF4HeartbeatStorage) {
        smokeRejectNextF4HeartbeatStorage = false;
        return Promise.reject(new Error('slice-smoke injected F4 heartbeat lease storage failure'));
      }
    }
    return indexedDBPersistenceBackend.get(store, key);
  },
  apply: (operations) => indexedDBPersistenceBackend.apply(operations),
  compareAndApply: (checks, operations, clearStores) => {
    if (smokeRejectArc0LandingStorageBoundary) {
      smokeRejectArc0LandingStorageBoundary = false;
      return Promise.reject(new Error('slice-smoke injected Arc 0 landing storage failure'));
    }
    if (smokeRejectArc3StorageBoundary) {
      smokeRejectArc3StorageBoundary = false;
      return Promise.reject(new Error('slice-smoke injected Arc 3 action storage failure'));
    }
    if (smokeRejectArc4StorageBoundary) {
      smokeRejectArc4StorageBoundary = false;
      return Promise.reject(new Error('slice-smoke injected Arc 4 capture storage failure'));
    }
    if (smokeRejectArc5FeedStorageBoundary) {
      smokeRejectArc5FeedStorageBoundary = false;
      return Promise.reject(new Error('slice-smoke injected Arc 5 Feed storage failure'));
    }
    return indexedDBPersistenceBackend.compareAndApply(checks, operations, clearStores);
  },
  keys: (store) => indexedDBPersistenceBackend.keys(store),
  clear: (stores) => indexedDBPersistenceBackend.clear(stores),
} : indexedDBPersistenceBackend;
const repo = createSaveRepository(persistenceBackend);
const revisionRepo = createRevisionedRepository(persistenceBackend);
const EMPTY_V5_EXTENSIONS: V5Extensions = Object.freeze({});
type PersistenceBootKind =
  | 'fresh-v5' | 'migrated-v4' | 'current-v5'
  | 'recovered-v4-protected' | 'future-protected'
  | 'corrupt-protected' | 'revision-exhausted-protected' | 'transient-protected';
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
  if (!__CF_EVIDENCE_BUILD__) return false;
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
type ReadyBioscanProjectionV1 = Extract<BioscanActionProjectionV1, { readonly kind: 'ready' }>;
type BioscanCardStateV1 =
  | Readonly<{ kind: 'nonliving'; worldKey: string }>
  | Readonly<{ kind: 'recorded'; worldKey: string }>
  | Readonly<{ kind: 'unavailable'; worldKey: string; detail: string }>
  | Readonly<{
    kind: 'ready';
    worldKey: string;
    address: CanonicalCF1WorldAddress;
    roster: CanonicalWorldRoster;
    opportunity: WorldOpportunitySnapshot;
    engineering: EngineeringStateV2;
    capabilities: ReturnType<typeof projectEngineeringCapabilities>;
    ownershipV2: OwnershipStateV2;
    projection: ReadyBioscanProjectionV1;
  }>;
let currentBioscanCardState: BioscanCardStateV1 | null = null;
interface CardTravelAction { label: 'Enter galaxy' | 'Enter system'; run: () => void; }
let cardTravelAction: CardTravelAction | null = null;
interface Arc6CombatSurfaceProjection {
  readonly authorityKey: string;
  readonly contextKey: string;
  readonly observedActivePlayMs: number;
  readonly championRoster: Arc6CombatChampionRosterV1;
  readonly encounter: GuardianPrimeEncounterV1;
  readonly opportunity: WorldOpportunitySnapshot;
  readonly roster: CanonicalWorldRoster;
}
let currentArc6CombatProjection: Arc6CombatSurfaceProjection | null = null;
let currentArc6ChampionId: string | null = null;
let lastArc6CombatOutcome: string | null = null;
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
const combatCardController = new CombatCardController({
  root: card,
  onNativeChallengeGesture: () => {
    /* The new trusted gesture supersedes any older Chronicle-audio session.
       Clear Main's stale sidecar before the owner consumes that old session;
       the old visual Chronicle may finish silently while durability settles. */
    combatChronicleAudioSession = null;
    tameGreetingAudioOwner?.armNativeCombatGesture();
  },
  onAction: (request) => {
    if (request.kind === 'select') {
      currentArc6ChampionId = request.championId;
      refreshCombatCardState();
      return;
    }
    void runArc6CombatCardAction(request);
  },
});
interface ApproachEcologyPresentation {
  readonly model: ApproachEcologyReadModelV1;
  readonly roster: CanonicalWorldRoster | null;
}
let approachEcologyGeneration = 0;
let approachEcologyRoster: CanonicalWorldRoster | null = null;
let approachEcologySurfaceKey: string | null = null;
let approachEcologyOwnsPlayback = false;
function approachEcologySurfaceIsCurrent(
  surface: ApproachEcologySurfaceReceiptV1,
): boolean {
  const roster = approachEcologyRoster;
  const address = activeCardWorldAddress();
  return roster !== null
    && surface.surface === 'approach'
    && surface.surfaceKey === approachEcologySurfaceKey
    && surface.generation > 0
    && nav.mode === 'system'
    && openPanelId() === null
    && cardCtx !== null
    && card.style.display === 'block'
    && getComputedStyle(card).display !== 'none'
    && getComputedStyle(card).visibility !== 'hidden'
    && card.getAttribute('aria-hidden') === 'false'
    && card.dataset.ecologyEpoch === String(currentEcologyEpoch())
    && getProvenGalaxyKey(nav.gal) === getProvenGalaxyKey(cardCtx.gal)
    && getProvenStarKey(nav.star) === getProvenStarKey(cardCtx.star)
    && address !== null
    && address.key === roster.worldKey
    && surface.worldKey === roster.worldKey
    && surface.environmentFingerprint === roster.environmentFingerprint
    && surface.biosphereKey === roster.biosphereKey
    && surface.ecologyEpoch === roster.ecologyEpoch
    && roster.ecologyEpoch === currentEcologyEpoch();
}
const approachEcologyController = new ApproachEcologyController({
  root: card,
  isCurrent: approachEcologySurfaceIsCurrent,
  onNativeListenGesture: () => {
    tameGreetingAudioOwner?.armNativeDistantEcologyGesture();
  },
  onListen: (playback, counterpart) => {
    void runApproachEcologyListen(playback, counterpart);
  },
});
function releaseApproachEcology(reason: string): void {
  if (approachEcologyOwnsPlayback) {
    tameGreetingAudioOwner?.cancelDistantEcology(reason);
  }
  approachEcologyOwnsPlayback = false;
  approachEcologyRoster = null;
  approachEcologySurfaceKey = null;
  approachEcologyController.detach();
}
async function runApproachEcologyListen(
  playback: CurrentWorldDistantEcologyPlaybackV1,
  counterpart: AudioCounterpartReceipt,
): Promise<void> {
  const owner = tameGreetingAudioOwner;
  if (owner === null || !approachEcologyController.counterpartIsCurrent(counterpart)) {
    owner?.cancelDistantEcology('approach-counterpart-unavailable');
    approachEcologyController.settle(playback, Object.freeze({
      kind: 'silent', reason: 'counterpart-unavailable',
    }));
    return;
  }
  const claim = owner.claimCurrentWorldDistantEcology(playback);
  if (claim === null) {
    approachEcologyController.settle(playback, Object.freeze({
      kind: 'silent', reason: owner.diagnostics().lastDisposition,
    }));
    return;
  }
  approachEcologyOwnsPlayback = true;
  const result = await owner.playClaimedDistantEcology(claim, counterpart);
  if (result.kind === 'silent') approachEcologyOwnsPlayback = false;
  approachEcologyController.settle(playback, result);
}
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
  approachEcology: ApproachEcologyPresentation | null = null,
): void {
  releaseApproachEcology('survey-replaced');
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
  const shownWorld = isPlanet ? activeCardWorldAddress() : null;
  const landedPlanet = shownWorld !== null
    && d.planetSeed === shownWorld.planet.seed
    && hasCanonicalWorldLanded(worldIdentityState, shownWorld);
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
  const combatHtml = ownsCurrentSurface
    ? '<section data-combat-card-body aria-label="Conquest combat"></section>'
    : '';
  const approachEcologyHtml = approachEcology !== null
    ? '<section data-approach-ecology-body aria-label="Orbital biosphere signal"></section>'
    : '';
  card.innerHTML =
    '<div class="survey-head">' +
    `<div><h2 data-sel="title">${esc(d.title)}</h2>` +
    `<div data-sel="sub">${esc(d.sub)}${d.badge ? ` · <b data-sel="badge">${esc(d.badge)}</b>` : ''}</div></div>` +
    '<button type="button" class="surface-close" data-survey-close aria-label="Close Survey card">✕</button></div>' +
    travelHtml +
    (actionsHtml || '') +   /* the card's ACTION ROW (Land · +Atlas · share) — buttons are trusted markup, never save text */
    approachEcologyHtml + combatHtml + captureHtml + rarity + rows.map(([k, v, cls]) =>
      `<div data-row="${esc(k)}" data-cls="${esc(cls || '')}" class="survey-row"><span>${esc(k)}</span><br>${esc(v)}</div>`).join('');
  const captureMount = card.querySelector<HTMLElement>('[data-capture-card-body]');
  if (captureMount === null) captureCardController.detach();
  else {
    captureCardController.attach(captureMount);
    if (!productActionInFlight) refreshCaptureCardState(preparedCaptureRoster);
  }
  const combatMount = card.querySelector<HTMLElement>('[data-combat-card-body]');
  if (combatMount === null) {
    combatCardController.detach();
    currentArc6CombatProjection = null;
  } else {
    combatCardController.attach(combatMount);
    if (!productActionInFlight) refreshCombatCardState(preparedCaptureRoster);
  }
  const approachEcologyMount = card.querySelector<HTMLElement>('[data-approach-ecology-body]');
  if (approachEcologyMount !== null && approachEcology !== null) {
    approachEcologyRoster = approachEcology.roster;
    approachEcologySurfaceKey = approachEcology.model.surface.surfaceKey;
    approachEcologyController.setState(approachEcology.model);
  } else approachEcologyController.setState(null);
  card.style.display = 'block';
  card.dataset.ecologyEpoch = String(currentEcologyEpoch());
  card.setAttribute('aria-hidden', 'false');
  document.body.classList.add('card-open');
  syncSurfaceChromeBottom();
  surveyDockEl.classList.add('on');
  surveyDockEl.setAttribute('aria-expanded', 'true');
  if (approachEcologyMount !== null && approachEcology !== null) {
    approachEcologyController.attach(approachEcologyMount);
  }
  approachEcologyController.refresh();
  refreshTrainingScope();
}
function hideSurvey(restoreFocus = false): void {
  releaseApproachEcology('survey-hidden');
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
function discardSurveyPresentation(reason: string): void {
  /* Hidden is not ownership. Once navigation invalidates the selected scene,
     release every controller/model and its detached DOM immediately. A same-
     system Surface ↔ orbit transition deliberately retains its source-proven
     planet card so the existing dock reconstruction contract still works. */
  releaseApproachEcology(reason);
  approachEcologyController.setState(null);
  captureCardController.detach();
  captureCardController.setState(null);
  combatCardController.detach();
  combatCardController.setState(null);
  currentCapturePresentationFence = null;
  currentBioscanCardState = null;
  currentArc6CombatProjection = null;
  currentArc6ChampionId = null;
  lastCard = null;
  cardCtx = null;
  cardTravelAction = null;
  surveyFocusReturn = null;
  card.replaceChildren();
  delete card.dataset.ecologyEpoch;
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

/* ---- the Field Training recovery sheet: a nonclosable modal shown only while
   an unrecognized checkpoint or an unverifiable Sol route locks exploration.
   v2 starts every explorer fresh (Nick, 2026-09-05): there is no player-facing
   save import, so reload/update is the only exit. The evidence-build importBlob
   below survives solely as the Slice/Glass replacement driver. ---- */
const sheet = document.createElement('div');
sheet.id = 'importsheet';   /* id retained: text-scale CSS, MODAL_SEL and the Training boundary list key on it */
sheet.setAttribute('role', 'dialog');
sheet.setAttribute('aria-modal', 'true');
sheet.setAttribute('aria-label', 'Field Training recovery');
sheet.style.cssText = 'position:fixed;inset:0;padding:calc(var(--safe-top,0px) + 16px) calc(var(--safe-right,0px) + 16px) calc(var(--safe-bottom,0px) + 16px) calc(var(--safe-left,0px) + 16px);' +
  'box-sizing:border-box;align-items:center;justify-content:center;overflow:hidden;background:rgba(4,6,12,0.7);display:none;z-index:40';
sheet.innerHTML =
  '<div style="position:relative;width:min(520px,100%);box-sizing:border-box;max-height:100%;overflow:auto;' +
  'background:rgba(10,16,30,0.97);border:1px solid #2a3c5e;border-radius:12px;padding:18px;color:#cfe0f4;font:13px/1.5 system-ui,sans-serif">' +
  '<h2 style="font-size:15px;margin:0 0 4px">Field Training recovery</h2>' +
  '<span data-sel="recovery-copy" style="color:var(--dim)"></span>' +
  '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">' +
  '<button id="importretry" type="button" style="background:#14233c;color:#cfe0f4;border:1px solid #2a3c5e;border-radius:8px;padding:8px 14px;cursor:pointer;min-height:44px">Reload to retry</button>' +
  '</div></div>';
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
function configureRecoverySheet(): void {
  const title = sheet.querySelector<HTMLElement>('h2')!;
  const copy = sheet.querySelector<HTMLElement>('[data-sel="recovery-copy"]')!;
  const lock: TrainingRecoveryLock = trainingRecoveryLock ?? 'route-unavailable';
  sheet.dataset.mode = lock;
  title.textContent = lock === 'unknown-checkpoint'
    ? 'Field Training checkpoint protected'
    : 'Field Training route unavailable';
  copy.textContent = lock === 'unknown-checkpoint'
    ? 'This checkpoint is not recognized by this build. Exploration is locked so no change can appear saved while its bytes remain protected. Update and reload.'
    : 'Field Training could not verify its route to Sol. Exploration is locked so practice cannot become unsaved session-only progress. Reload to retry.';
  sheet.setAttribute('aria-label', title.textContent);
}
/* ---- THE DOCK: eight live controls, every press proven by an EFFECT (the
   simrun-dom law — a dead button never ships). charts/sound flip the REAL
   save fields and persist through exportSaveV2. ---- */
function openRecoverySheet(): void {
  closePanels();
  configureRecoverySheet();
  if (sheet.style.display !== 'none') {
    enforceImportBackgroundInert();
    refocusRecoverySheet();
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
  refocusRecoverySheet();
}
/* The recovery sheet is never dismissable: Escape and any outside focus return
   to its single action, and only its reload leaves this document. */
function refocusRecoverySheet(): void {
  sheet.querySelector<HTMLElement>('#importretry')?.focus();
}
function openTrainingRecoverySheet(reason: TrainingRecoveryLock): void {
  trainingRecoveryLock = reason;
  openRecoverySheet();
}
document.addEventListener('focusin', (event) => {
  if (sheet.style.display === 'none' || sheet.contains(event.target as Node)) return;
  refocusRecoverySheet();
}, true);
surveyDockEl.addEventListener('click', () => {
  /* Re-show a retained card. A fresh replacement document deliberately has
     none, so its native dock activation may source-prove and present the
     current rendered surface without replaying a Survey action. */
  if (cardCtx && !activeCardPlanetWhere()) {
    hideSurvey();
    discardSurveyPresentation('survey-route-stale');
    return;
  }
  const staleCaptureMount = card.querySelector<HTMLElement>('[data-capture-card-body]');
  if (staleCaptureMount !== null && !surveyOwnsCurrentCaptureSurface()) {
    captureCardController.detach();
    staleCaptureMount.remove();
  }
  if (staleCaptureMount !== null && surveyOwnsCurrentCaptureSurface()
    && !productActionInFlight) refreshCaptureCardState();
  const staleCombatMount = card.querySelector<HTMLElement>('[data-combat-card-body]');
  if (staleCombatMount !== null && !surveyOwnsCurrentCaptureSurface()) {
    combatCardController.detach();
    currentArc6CombatProjection = null;
    staleCombatMount.remove();
  }
  if (staleCombatMount !== null && surveyOwnsCurrentCaptureSurface()
    && !productActionInFlight) refreshCombatCardState();
  if (card.style.display === 'none' && !card.innerHTML
    && reconstructCurrentSurfaceSurvey()) return;
  if (card.style.display === 'none' && card.innerHTML && cardCtx) {
    const context = cardCtx;
    /* A retained planet card may have crossed Surface/System since it was
       painted. Re-prove and rebuild it without replaying the Survey action. */
    if (presentPlanetSurvey(context.p, context.star, context.planet)) {
      /* Rebuilding may infer the still-focused canvas as an opener. The
         explicit dock activation owns the final return lineage. */
      surveyFocusReturn = surveyDockEl;
      return;
    }
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
let activeVisualEffectPolicy: VisualEffectPolicyV1 | null = null;
let activeCameraShakePolicy: CameraShakePolicyV1 | null = null;
const activeCameraShakes = new Set<Animation>();
function visualPolicyDeviceTier(): VisualPolicyDeviceTierV1 {
  if (TOUCH_DPR) return 'low';
  return devicePixelRatio <= 1.25 ? 'medium' : 'high';
}
function refreshVisualPolicies(): void {
  const deviceTier = visualPolicyDeviceTier();
  const motion = motionOK() ? 'full' as const : 'reduced' as const;
  activeVisualEffectPolicy = resolveVisualEffectPolicyV1({
    effectsOn: save.fxOn, motion, deviceTier,
  });
  activeCameraShakePolicy = resolveCameraShakePolicyV1({
    effectsOn: save.fxOn, shakeOn: save.shakeOn, motion, deviceTier,
  });
  if (activeCameraShakePolicy.shake.mode === 'off') {
    for (const animation of activeCameraShakes) {
      try { animation.cancel(); } catch { /* preference changes stay fail-soft */ }
    }
    activeCameraShakes.clear();
  }
}
function currentVisualEffectPolicy(): VisualEffectPolicyV1 {
  const deviceTier = visualPolicyDeviceTier();
  const motion = motionOK() ? 'full' as const : 'reduced' as const;
  if (activeVisualEffectPolicy === null
    || activeVisualEffectPolicy.input.effectsOn !== save.fxOn
    || activeVisualEffectPolicy.input.motion !== motion
    || activeVisualEffectPolicy.input.deviceTier !== deviceTier) refreshVisualPolicies();
  return activeVisualEffectPolicy!;
}
const travelPresentationOwner = createTravelPresentationOwner({
  document,
  now: () => performance.now(),
  currentVisualEffectPolicy,
  viewport: () => ({ width: innerWidth, height: innerHeight, dpr: DPR }),
});
const searchTravelPresentationIntents = new WeakMap<
  SearchTravelCommitPlan,
  Omit<TravelPresentationRequest, 'engineeringState' | 'capabilities'>
>();
function captureSearchTravelPresentationIntent(plan: SearchTravelCommitPlan): void {
  try {
    const origin = nav.mode === 'universe' ? camT : nav.gal;
    const destination = plan.target.gal;
    const destinationKey = plan.focusAddress?.key
      ?? (plan.target.mode === 'system' || plan.target.mode === 'surface'
        ? getProvenStarKey(plan.target.star) : getProvenGalaxyKey(destination));
    if (destinationKey === null) return;
    searchTravelPresentationIntents.set(plan, Object.freeze({
      distance: Math.hypot(destination.x - origin.x, destination.y - origin.y),
      destinationKey,
    }));
  } catch { /* a visual intent can never reject or delay route authority */ }
}
function startSearchTravelPresentation(plan: SearchTravelCommitPlan): void {
  const intent = searchTravelPresentationIntents.get(plan);
  searchTravelPresentationIntents.delete(plan);
  if (intent === undefined || arc3EngineeringState === null) return;
  try {
    const runtime = f4Runtime;
    if (runtime === null) return;
    const loadout = readArc2EngineeringLoadout(runtime.extensions);
    if (loadout.kind !== 'loaded') return;
    const presentation = travelPresentationOwner.start({
      ...intent,
      engineeringState: arc3EngineeringState,
      capabilities: projectEngineeringCapabilities(loadout.loadout),
    });
    if (presentation?.longBurn) {
      toast('Long burn', 'Deep-space distance stretches this lane. Research a faster drive at the Shipyard to cut the crossing.');
    }
  } catch { /* durability and navigation already published; presentation is fail-soft */ }
}
function currentCameraShakePolicy(): CameraShakePolicyV1 {
  const effectPolicy = currentVisualEffectPolicy();
  if (activeCameraShakePolicy === null
    || activeCameraShakePolicy.input.effectsOn !== effectPolicy.input.effectsOn
    || activeCameraShakePolicy.input.shakeOn !== save.shakeOn
    || activeCameraShakePolicy.input.motion !== effectPolicy.input.motion
    || activeCameraShakePolicy.input.deviceTier !== effectPolicy.input.deviceTier) refreshVisualPolicies();
  return activeCameraShakePolicy!;
}
function rerenderVisualPolicyScene(): void {
  if (renderedSceneReceipt.serial > 0) {
    rerender({ preserveSurvey: true, skipPersist: true });
  }
}
function triggerCameraShake(): void {
  const policy = currentCameraShakePolicy();
  if (policy.shake.mode === 'off'
    || activeCameraShakes.size >= policy.shake.maximumConcurrentImpulses
    || typeof app.canvas.animate !== 'function') return;
  const amplitude = policy.shake.mode === 'subtle' ? 1.5 : 3;
  let animation: Animation;
  try {
    animation = app.canvas.animate([
      { transform: 'translate(0, 0)' },
      { transform: `translate(${-amplitude}px, ${amplitude * 0.5}px)` },
      { transform: `translate(${amplitude}px, ${-amplitude * 0.35}px)` },
      { transform: `translate(${-amplitude * 0.45}px, ${amplitude * 0.2}px)` },
      { transform: 'translate(0, 0)' },
    ], {
      duration: policy.shake.mode === 'subtle' ? 160 : 220,
      easing: 'cubic-bezier(.2,.7,.2,1)',
    });
  } catch { return; }
  activeCameraShakes.add(animation);
  const release = (): void => { activeCameraShakes.delete(animation); };
  void animation.finished.then(release, release);
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
  refreshVisualPolicies();
  applyGlass();
  syncTopbarH(); syncDockH(); syncCtxH(); syncHintH(); syncSurfaceChromeBottom();
}
reducedMotionQuery.addEventListener('change', () => {
  if (save?.motionMode === -1) {
    applyDisplayPreferences();
    rerenderVisualPolicyScene();
  }
});
function fillSettings(): void {
  if (!save) return;   /* a click before boot finishes must not throw */
  const nameplateSettings = projectArc9NameplateSettingsV1(save);
  const explorerNameSettings = projectArc9ExplorerNameSettingsV1(save);
  fillPanel('set',
    '<h3>Settings</h3>' +
    `<div class="row"><label>Sound</label><button id="setsnd" aria-label="Sound" aria-pressed="${save.sndOn}" class="${save.sndOn ? 'on' : ''}" data-sel="set-sound">${save.sndOn ? 'On' : 'Off'}</button></div>` +
    `<div class="row"><label>Volume</label><input id="setvol" data-sel="set-vol" aria-label="Sound volume" type="range" min="0" max="100" value="${Math.round(save.sfxVol * 100)}"></div>` +
    `<div class="row"><label>Creature voices</label><button id="setvoice" aria-label="Creature voices" aria-pressed="${save.voiceOn}" class="${save.voiceOn ? 'on' : ''}" data-sel="set-voice">${save.voiceOn ? 'On' : 'Off'}</button></div>` +
    renderArc9ExplorerNameSettingV1(
      explorerNameSettings,
      arc9ExplorerNameEditing,
      arc9ExplorerNamePending,
    ) +
    renderArc9NameplateSettingV1(nameplateSettings, arc9NameplateChoicePending) +
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
    `<div class="row"><label>Visual effects</label><button id="setfx" data-sel="set-effects" aria-label="Visual effects" aria-pressed="${save.fxOn}" class="${save.fxOn ? 'on' : ''}">${save.fxOn ? 'On' : 'Off'}</button></div>` +
    `<div class="row"><label>Screen shake</label><button id="setshake" data-sel="set-shake" aria-label="Screen shake" aria-pressed="${save.shakeOn}" class="${save.shakeOn ? 'on' : ''}">${save.shakeOn ? 'On' : 'Off'}</button></div>` +
    `<div class="row"><label>Motion</label><span class="seg" role="group" aria-label="Motion">` +
    [[-1, 'Auto'], [0, 'Full'], [1, 'Reduced']].map(([v, t]) =>
      `<button data-motion="${v}" aria-pressed="${save.motionMode === v}" class="${save.motionMode === v ? 'on' : ''}">${t}</button>`).join('') +
    '</span></div>' +
    `<div class="row"><label>Panel tint</label><input id="setglass" aria-label="Panel tint" type="range" min="82" max="98" value="${Math.round(Math.max(save.glassTint, 0.82) * 100)}"></div>` +
    `<div class="row"><label>Field Training</label><button id="setrestart" data-sel="set-restart">Restart</button></div>`);
  const el = document.getElementById('setpanel')!;
  const refillAndFocus = (selector: string): void => {
    fillSettings();
    el.querySelector<HTMLElement>(selector)?.focus();
  };
  if (explorerNameSettings.kind === 'projected') {
    const openNameEditor = el.querySelector<HTMLButtonElement>(
      '[data-arc9-explorer-name-open]',
    )!;
    openNameEditor.addEventListener('click', () => {
      if (arc9ExplorerNamePending) return;
      arc9ExplorerNameEditing = true;
      fillSettings();
      const input = el.querySelector<HTMLInputElement>('[data-arc9-explorer-name-input]');
      input?.focus();
      input?.select();
    });
    if (arc9ExplorerNameEditing) {
      const editor = el.querySelector<HTMLFormElement>('[data-arc9-explorer-name-editor]')!;
      const input = editor.querySelector<HTMLInputElement>('[data-arc9-explorer-name-input]')!;
      const saveName = editor.querySelector<HTMLButtonElement>('[data-arc9-explorer-name-save]')!;
      const cancel = editor.querySelector<HTMLButtonElement>('[data-arc9-explorer-name-cancel]')!;
      const help = editor.querySelector<HTMLElement>('[data-arc9-explorer-name-help]')!;
      const refreshDraft = (): ReturnType<typeof assessArc9ExplorerNameDraftV1> => {
        const assessment = assessArc9ExplorerNameDraftV1(
          explorerNameSettings.model.explorerName,
          input.value,
        );
        saveName.disabled = arc9ExplorerNamePending || !assessment.saveable;
        saveName.setAttribute('aria-disabled', String(saveName.disabled));
        help.textContent = assessment.reason === 'cleaned-empty'
          ? 'Those characters cannot ride in a name. Try letters, numbers, or an emoji.'
          : assessment.reason === 'unchanged'
            ? 'Enter a different name. Unsafe punctuation is removed; 24 characters maximum.'
            : `Ready to save “${assessment.cleanedName}”.`;
        return assessment;
      };
      input.addEventListener('input', () => { refreshDraft(); });
      cancel.addEventListener('click', () => {
        if (arc9ExplorerNamePending) return;
        arc9ExplorerNameEditing = false;
        refillAndFocus('[data-arc9-explorer-name-open]');
      });
      editor.addEventListener('submit', (event) => {
        event.preventDefault();
        if (arc9ExplorerNamePending) return;
        const assessment = refreshDraft();
        if (!assessment.saveable) {
          input.focus();
          return;
        }
        const rawName = input.value;
        /* Restore the durable name in the same task. The Settings summary
           and AppChrome publish only after the receipt independently proves. */
        input.value = explorerNameSettings.model.explorerName;
        input.disabled = true;
        input.setAttribute('aria-disabled', 'true');
        saveName.disabled = true;
        saveName.setAttribute('aria-disabled', 'true');
        cancel.disabled = true;
        cancel.setAttribute('aria-disabled', 'true');
        editor.setAttribute('aria-busy', 'true');
        void runArc9ExplorerNameChange(rawName);
      });
    }
  }
  if (nameplateSettings.kind === 'projected') {
    const nameplateControl = el.querySelector<HTMLSelectElement>('[data-arc9-nameplate-choice]')!;
    nameplateControl.addEventListener('change', () => {
      const requestedChoiceIndex = Number(nameplateControl.value);
      /* A native select paints its tentative option before `change`. Restore
         the durable value in the same task; AppChrome and Settings publish
         the new choice only after the product receipt independently verifies. */
      nameplateControl.value = String(nameplateSettings.model.selectedChoiceIndex);
      nameplateControl.disabled = true;
      nameplateControl.setAttribute('aria-disabled', 'true');
      nameplateControl.closest<HTMLElement>('[data-arc9-nameplate-setting]')
        ?.setAttribute('aria-busy', 'true');
      void runArc9NameplateChoice(requestedChoiceIndex);
    });
  }
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
  el.querySelector('#setfx')!.addEventListener('click', () => {
    save.fxOn = !save.fxOn;
    refreshVisualPolicies();
    rerenderVisualPolicyScene();
    refillAndFocus('#setfx'); void persistView();
  });
  el.querySelector('#setshake')!.addEventListener('click', () => {
    save.shakeOn = !save.shakeOn;
    refreshVisualPolicies();
    refillAndFocus('#setshake'); void persistView();
  });
  for (const b of el.querySelectorAll('[data-motion]')) b.addEventListener('click', () => {
    save.motionMode = +(b as HTMLElement).dataset.motion!;
    applyDisplayPreferences();
    rerenderVisualPolicyScene();
    refillAndFocus(`[data-motion="${save.motionMode}"]`); void persistView();
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
  el.querySelector('#setglass')!.addEventListener('input', (e) => {
    save.glassTint = (+(e.target as HTMLInputElement).value) / 100;
    applyGlass(); persistSoon();
  });
  /* Settings refills replace their row DOM. The PWA owner keeps its event
     subscriptions and is simply reseated, so update/rollback state survives
     a preference change without becoming permanent floating game chrome. */
  if (pwaUpdateControl) el.append(pwaUpdateControl.element);
}

/* ---- GUIDE + RELEASE HISTORY — one source-addressed continuation of the
   mature v1 manual, not a second seven-topic manual. All 43 authored IDs and
   the 56-release archive remain synchronized to v1.8.9; current capability
   copy replaces any legacy promise whose mechanic is not yet live in v2.
   Both authored archives are lazy: a player who never opens Guide must not
   retain hundreds of kilobytes of dormant copy for the whole expedition. ---- */
type GuideContentModule = typeof import('./guide-content.js');
type ReleaseContentModule = typeof import('./release-content.js');
let guideContentModule: GuideContentModule | null = null;
let guideContentPromise: Promise<GuideContentModule> | null = null;
let guideCatalogue: readonly GuideCategoryView[] | null = null;
let releaseContentModule: ReleaseContentModule | null = null;
let releaseContentPromise: Promise<ReleaseContentModule> | null = null;
let guideViewRequest = 0;

function loadGuideContent(): Promise<GuideContentModule> {
  if (guideContentModule !== null) return Promise.resolve(guideContentModule);
  guideContentPromise ??= import('./guide-content.js').then((module) => {
    guideContentModule = module;
    guideCatalogue = module.getGuideCatalogue();
    return module;
  }, (error: unknown) => {
    guideContentPromise = null;
    throw error;
  });
  return guideContentPromise;
}
function loadReleaseContent(): Promise<ReleaseContentModule> {
  if (releaseContentModule !== null) return Promise.resolve(releaseContentModule);
  releaseContentPromise ??= import('./release-content.js').then((module) => {
    releaseContentModule = module;
    return module;
  }, (error: unknown) => {
    releaseContentPromise = null;
    throw error;
  });
  return releaseContentPromise;
}
function guideBodyEl(): HTMLElement | null {
  return document.querySelector('#guidepanel [data-sel="guide-body"]');
}
function guideCategoryOf(
  catalogue: readonly GuideCategoryView[],
  id: GuideTopicId,
): GuideCategoryView | undefined {
  return catalogue.find((category) => category.topics.some((topic) => topic.id === id));
}
function guideLoadingBody(body: HTMLElement): void {
  body.innerHTML = '<div class="empty" data-guide-loading>Opening the expedition archive…</div>';
}
function guideLoadFailure(body: HTMLElement): void {
  body.innerHTML = '<div class="empty" role="alert">The Guide archive could not be opened. Close Guide and try again; your expedition is unchanged.</div>';
}
function requestGuideContent(
  render: (module: GuideContentModule, catalogue: readonly GuideCategoryView[]) => void,
): void {
  const body = guideBodyEl();
  if (body === null) return;
  const request = ++guideViewRequest;
  const publish = (module: GuideContentModule): void => {
    if (request !== guideViewRequest || guideBodyEl() !== body || openPanelId() !== 'guide') return;
    const catalogue = guideCatalogue ?? module.getGuideCatalogue();
    guideCatalogue = catalogue;
    document.querySelector<HTMLInputElement>('#guidepanel #guidesearch')?.removeAttribute('disabled');
    render(module, catalogue);
  };
  if (guideContentModule !== null) {
    const module = guideContentModule;
    /* openPanel() invokes onOpen before it exposes the panel. Defer cached
       publication by one microtask so the same visibility fence used by the
       cold import also holds when Guide is reopened from memory. */
    queueMicrotask(() => publish(module));
    return;
  }
  guideLoadingBody(body);
  void loadGuideContent().then(publish, () => {
    if (request === guideViewRequest && guideBodyEl() === body && openPanelId() === 'guide') {
      guideLoadFailure(body);
    }
  });
}
function requestReleaseContent(render: (module: ReleaseContentModule) => void): void {
  const body = guideBodyEl();
  if (body === null) return;
  const request = ++guideViewRequest;
  const publish = (module: ReleaseContentModule): void => {
    if (request !== guideViewRequest || guideBodyEl() !== body || openPanelId() !== 'guide') return;
    render(module);
  };
  if (releaseContentModule !== null) {
    const module = releaseContentModule;
    queueMicrotask(() => publish(module));
    return;
  }
  guideLoadingBody(body);
  void loadReleaseContent().then(publish, () => {
    if (request === guideViewRequest && guideBodyEl() === body && openPanelId() === 'guide') {
      guideLoadFailure(body);
    }
  });
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
  requestGuideContent((_module, catalogue) => {
    const body = guideBodyEl(); if (!body) return;
    body.innerHTML = catalogue.map((category) =>
      `<button class="guide-item guide-category" data-guide-category="${category.id}"><span class="guide-icon">${category.icon}</span>` +
      `<span><b>${esc(category.title)}</b><small>${esc(category.blurb)} · ${category.topics.length} topics</small></span><span aria-hidden="true">›</span></button>`).join('');
    body.scrollTop = 0;
    if (focusResult) focusGuide('[data-guide-category]');
  });
}
function renderGuideCategory(id: GuideCategoryId, focusResult = false): void {
  requestGuideContent((_module, catalogue) => {
    const category = catalogue.find((candidate) => candidate.id === id);
    const body = guideBodyEl(); if (!category || !body) return;
    body.innerHTML = `<button class="guide-back" data-guide-home>‹ All topics</button>` +
      category.topics.map((topic) => guideTopicRow(topic, category.icon)).join('');
    body.scrollTop = 0;
    if (focusResult) focusGuide('[data-guide-home]');
  });
}
function renderGuideTopic(id: GuideTopicId, focusResult = false): void {
  requestGuideContent((module, catalogue) => {
    const topic = module.getGuideTopic(id);
    const category = guideCategoryOf(catalogue, id);
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
  });
}
function renderGuideSearch(query: string): void {
  if (query.trim().length < 2) { renderGuideMenu(); return; }
  requestGuideContent((module, catalogue) => {
    const body = guideBodyEl(); if (!body) return;
    const hits = module.searchGuide(query);
    body.innerHTML = hits.length
      ? hits.map((topic) => guideTopicRow(topic, guideCategoryOf(catalogue, topic.id)?.icon || '•')).join('')
      : `<div class="empty">Nothing matches “${esc(query.trim())}”. Try “landing”, “save”, “breeding”, or “stardust”.</div>`;
    body.scrollTop = 0;
  });
}
function renderReleaseHistory(focusResult = false): void {
  requestReleaseContent((module) => {
    const body = guideBodyEl(); if (!body) return;
    const releases = module.getReleaseHistory({ includeDraft: true });
    body.innerHTML = '<button class="guide-back" data-guide-home>‹ Guide</button>' +
      '<div class="guide-release-intro"><b>Expedition bulletins</b><br>' +
      `v${esc(V2_DEVELOPMENT_VERSION)} names this development playtest but cannot trigger a production update popup. The complete v1 history below remains immutable.</div>` +
      releases.map((release, index) => `<button class="guide-item" data-release-index="${index}">` +
        `<span class="guide-icon">${release.status === 'draft' ? '🧪' : '✦'}</span><span><b>${release.version ? 'v' + esc(release.version) + ' · ' : ''}${esc(release.title)}</b>` +
        `<small>${release.status === 'draft' ? 'UNRELEASED DEVELOPMENT' : esc(release.date) + (release.status === 'shipped' ? ' · v2 release' : ' · legacy release')}</small></span><span aria-hidden="true">›</span></button>`).join('');
    body.scrollTop = 0;
    if (focusResult) focusGuide('[data-guide-home]');
  });
}
function renderReleaseView(
  index: number,
  focusResult: boolean,
  releases: readonly ReleaseNoteView[],
): void {
  const release = releases[index];
  const body = guideBodyEl(); if (!release || !body) return;
  body.innerHTML = '<button class="guide-back" data-guide-releases>‹ All bulletins</button>' +
    `<article class="guide-topic"><h4 tabindex="-1" data-guide-heading>${release.version ? 'v' + esc(release.version) + ' · ' : ''}${esc(release.title)}</h4>` +
    `<div class="guide-status" data-guide-status="${release.status}">${release.status === 'draft' ? `v${esc(V2_DEVELOPMENT_VERSION)} DEVELOPMENT · not a production release` : esc(release.date) + (release.status === 'shipped' ? ' · v2 release' : ' · legacy v1 history')}</div>` +
    release.sections.map((section) => `<h5>${section.heading}</h5><ul>${section.bullets.map((bullet) => `<li>${bullet}</li>`).join('')}</ul>`).join('') + '</article>';
  body.scrollTop = 0;
  if (focusResult) focusGuide('[data-guide-releases]');
}
function renderRelease(
  index: number,
  focusResult = false,
  releases?: readonly ReleaseNoteView[],
): void {
  if (releases !== undefined) {
    guideViewRequest++;
    renderReleaseView(index, focusResult, releases);
    return;
  }
  requestReleaseContent((module) => {
    renderReleaseView(index, focusResult, module.getReleaseHistory({ includeDraft: true }));
  });
}
function shippedReleaseView(release: V2ShippedRelease): ReleaseNoteView {
  return Object.freeze({
    channel: 'v2',
    status: 'shipped',
    version: release.version,
    title: release.title,
    date: release.date,
    sections: Object.freeze(release.sections.map((section) => Object.freeze({
      heading: section.category,
      bullets: Object.freeze(section.bullets.slice()),
    }))),
  });
}
let pendingReleaseBulletin: V2ShippedRelease | null = null;
function showV2ReleaseBulletin(
  current: V2ShippedRelease,
  history: readonly ReleaseNoteView[] = Object.freeze([shippedReleaseView(current)]),
): boolean {
  if (save.rnSeen === current.version) return false;
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
  if (V2_CURRENT_RELEASE_VERSION === null) return false;
  void loadReleaseContent().then((module) => {
    const current = module.getCurrentV2Release(V2_CURRENT_RELEASE_VERSION);
    if (current !== undefined) showV2ReleaseBulletin(current);
  }, () => {
    toast('Release bulletin unavailable', 'Your expedition is unchanged. Open Guide to try the archive again.');
  });
  return true;
}
function flushPendingReleaseBulletin(): void {
  const current = pendingReleaseBulletin;
  if (!current || trainingActive()) return;
  showV2ReleaseBulletin(current);
}
function fillGuide(): void {
  if (!save) return;
  fillPanel('guide',
    '<h3>Guide to the Universe</h3>' +
    guideBuildIdentity() +
    '<div class="guide-tools"><input id="guidesearch" type="search" autocomplete="off" aria-label="Search the Guide" placeholder="Search 41 Guide topics" disabled>' +
    '<button data-guide-releases>Release history</button></div>' +
    '<div class="sub guide-scope">The mature manual, adapted to what is actually live in this v2 development build. Unported active systems stay visible and honestly marked; intentionally dormant topics remain recorded but hidden.</div>' +
    '<div class="guide-body" data-sel="guide-body"><div class="empty" data-guide-loading>Opening the expedition archive…</div></div>');
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
const compendiumFeedController = new CompendiumFeedController({
  root: document.getElementById('codexpanel')!,
  isCurrent: (surface: CompendiumFeedSurfaceReceiptV1) => (
    codexGeneration === surface.generation
    && codexMode === 'detail'
    && codexDetailLogicalId === surface.logicalId
    && openPanelId() === 'codex'
  ),
  onNativeFeedGesture: () => {
    invalidateCompendiumFeedStatusCounterpart();
    tameGreetingAudioOwner?.armNativeFeedGesture();
  },
  onAction: (request) => {
    void runCompendiumFeedAction(request);
  },
});
const compendiumExplorerMealController = new CompendiumExplorerMealController({
  root: document.getElementById('codexpanel')!,
  isCurrent: (surface: CompendiumExplorerMealSurfaceV1) => (
    codexGeneration === surface.generation
    && codexMode === 'detail'
    && codexDetailLogicalId === surface.logicalId
    && openPanelId() === 'codex'
  ),
  onAction: (request) => { void runCompendiumExplorerMealAction(request); },
});
const compendiumAuditionController = new CompendiumAuditionController({
  root: document.getElementById('codexpanel')!,
  isCurrent: (surface: CompendiumAuditionSurfaceReceiptV1) => (
    codexGeneration === surface.generation
    && codexMode === 'detail'
    && codexDetailLogicalId === surface.logicalId
    && openPanelId() === 'codex'
  ),
  onNativeAuditionGesture: () => {
    releaseCompendiumAudition('audition-replaced');
    tameGreetingAudioOwner?.armNativeCompendiumAuditionGesture();
  },
  onAudition: (request, counterpart) => {
    void runCompendiumAudition(request, counterpart);
  },
});
const compendiumBreedController = new CompendiumBreedController({
  root: document.getElementById('codexpanel')!,
  isCurrent: (surface: CompendiumBreedSurfaceReceiptV1) => (
    codexGeneration === surface.generation
    && codexMode === 'detail'
    && codexDetailLogicalId === surface.logicalId
    && openPanelId() === 'codex'
  ),
  onAction: (request) => {
    void runCompendiumBreedAction(request);
  },
});
const compendiumRenameController = new CompendiumRenameController({
  root: document.getElementById('codexpanel')!,
  isCurrent: (surface: CompendiumRenameSurfaceReceiptV1) => (
    codexGeneration === surface.generation
    && codexMode === 'detail'
    && codexDetailLogicalId === surface.logicalId
    && openPanelId() === 'codex'
  ),
  onAction: (request) => {
    void runCompendiumRenameAction(request);
  },
});
const compendiumScoutController = new CompendiumScoutController({
  root: document.getElementById('codexpanel')!,
  isCurrent: (surface: CompendiumScoutSurfaceReceiptV1) => (
    codexGeneration === surface.generation
    && codexMode === 'detail'
    && codexDetailLogicalId === surface.logicalId
    && openPanelId() === 'codex'
  ),
  onAction: (request) => {
    void runCompendiumScoutAction(request);
  },
});

const compendiumCreatureProgressionSurface = new CompendiumCreatureProgressionSurfaceV1({
  isCurrent: () => codexMode === 'detail' && openPanelId() === 'codex',
  project: (pageIndex) => {
    const row = currentCompendiumDetailRow();
    return row === null ? null : projectCurrentCompendiumCreatureProgression(row, pageIndex);
  },
});

function projectCurrentCompendiumAudition(
  row: readonly [string, CodexRecord],
  generation: number,
): CompendiumAuditionReadModelV1 | null {
  try {
    return projectCompendiumAuditionV1({
      generation,
      logicalId: String(row[0]),
      record: row[1],
      ownership: arc5OwnershipState,
      fixture: compendiumFixtureRows !== null,
    });
  } catch {
    return null;
  }
}

function projectCurrentCompendiumFeed(
  row: readonly [string, CodexRecord],
  generation: number,
): CompendiumFeedReadModelV1 | null {
  try {
    return projectCompendiumFeedV1({
      generation,
      logicalId: String(row[0]),
      record: row[1],
      ownership: arc5OwnershipState,
      protected: arc5OwnershipProtection !== null || !f4RuntimeMayMutate(),
      fixture: compendiumFixtureRows !== null,
    });
  } catch {
    return null;
  }
}

function projectCurrentCompendiumCreatureProgression(
  row: readonly [string, CodexRecord],
  pageIndex = 0,
): CompendiumCreatureProgressionV1 | null {
  try {
    return projectCompendiumCreatureProgressionV1({
      logicalId: String(row[0]),
      record: row[1],
      ownership: arc5OwnershipState,
      protected: arc5OwnershipProtection !== null,
      fixture: compendiumFixtureRows !== null,
      observedActivePlayMs: f4Runtime?.diagnostics().activePlayMs ?? 0,
      pageIndex,
    });
  } catch {
    return null;
  }
}

function projectCurrentCompendiumExplorerMeal(
  row: readonly [string, CodexRecord],
  generation: number,
): CompendiumExplorerMealModelV1 | null {
  try {
    const runtime = f4Runtime;
    if (runtime === null || arc3EngineeringState === null) return null;
    const loadout = readArc2EngineeringLoadout(runtime.extensions);
    if (loadout.kind !== 'loaded') return null;
    return projectCompendiumExplorerMealV1({
      generation,
      logicalId: String(row[0]),
      record: row[1],
      ownership: arc5OwnershipState,
      engineering: arc3EngineeringState,
      capabilities: projectEngineeringCapabilities(loadout.loadout),
      state: save,
      protected: arc5OwnershipProtection !== null || arc3EngineeringProtection !== null
        || !f4RuntimeMayMutate(runtime),
      fixture: compendiumFixtureRows !== null,
    });
  } catch {
    return null;
  }
}

function projectCurrentCompendiumBreed(
  row: readonly [string, CodexRecord],
  generation: number,
): CompendiumBreedReadModelV1 | null {
  try {
    return projectCompendiumBreedV1({
      generation,
      logicalId: String(row[0]),
      record: row[1],
      ownership: arc5OwnershipState,
      protected: arc5OwnershipProtection !== null || !f4RuntimeMayMutate(),
      fixture: compendiumFixtureRows !== null,
      activePlayMs: f4Runtime?.diagnostics().activePlayMs ?? 0,
      earnedStardust: save.stats.essenceEarned ?? 0,
    });
  } catch {
    return null;
  }
}

function projectCurrentCompendiumRename(
  row: readonly [string, CodexRecord],
  generation: number,
): CompendiumRenameReadModelV1 | null {
  try {
    return projectCompendiumRenameV1({
      generation,
      logicalId: String(row[0]),
      record: row[1],
      ownership: arc5OwnershipState,
      protected: arc5OwnershipProtection !== null || !f4RuntimeMayMutate(),
      fixture: compendiumFixtureRows !== null,
    });
  } catch {
    return null;
  }
}

function projectCurrentCompendiumScout(
  row: readonly [string, CodexRecord],
  generation: number,
): CompendiumScoutReadModelV1 | null {
  try {
    return projectCompendiumScoutV1({
      generation,
      logicalId: String(row[0]),
      record: row[1],
      ownership: arc5OwnershipState,
      protected: arc5OwnershipProtection !== null || !f4RuntimeMayMutate(),
      fixture: compendiumFixtureRows !== null,
    });
  } catch {
    return null;
  }
}

function currentCompendiumDetailRow(): [string, CodexRecord] | null {
  if (codexMode !== 'detail' || codexDetailLogicalId === null) return null;
  return activeCodexSource().find(([logicalId]) => String(logicalId) === codexDetailLogicalId)
    ?? null;
}

function refreshCompendiumFeedState(): void {
  const row = currentCompendiumDetailRow();
  if (row === null || openPanelId() !== 'codex') {
    compendiumAuditionController.refresh();
    compendiumFeedController.refresh();
    compendiumExplorerMealController.refresh();
    compendiumBreedController.refresh();
    compendiumRenameController.refresh();
    compendiumScoutController.refresh();
    return;
  }
  releaseCompendiumAudition('ownership-refreshed');
  const projectedAudition = projectCurrentCompendiumAudition(row, codexGeneration);
  const projectedFeed = projectCurrentCompendiumFeed(row, codexGeneration);
  const projectedExplorerMeal = projectCurrentCompendiumExplorerMeal(row, codexGeneration);
  const projectedBreed = projectCurrentCompendiumBreed(row, codexGeneration);
  const projectedRename = projectCurrentCompendiumRename(row, codexGeneration);
  const projectedScout = projectCurrentCompendiumScout(row, codexGeneration);
  compendiumCreatureProgressionSurface.refresh();
  compendiumAuditionController.setState(projectedAudition);
  compendiumFeedController.setState(projectedFeed);
  compendiumExplorerMealController.setState(projectedExplorerMeal);
  compendiumBreedController.setState(projectedBreed);
  compendiumRenameController.setState(projectedRename);
  compendiumScoutController.setState(projectedScout);
  compendiumAuditionController.refresh();
  compendiumFeedController.refresh();
  compendiumExplorerMealController.refresh();
  compendiumBreedController.refresh();
  compendiumRenameController.refresh();
  compendiumScoutController.refresh();
}

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
  releaseCompendiumAudition('detail-closed');
  releaseCompendiumFeedExpression('detail-closed');
  compendiumAuditionController.detach();
  compendiumAuditionController.setState(null);
  compendiumFeedController.detach();
  compendiumFeedController.setState(null);
  compendiumExplorerMealController.detach();
  compendiumExplorerMealController.setState(null);
  compendiumBreedController.detach();
  compendiumBreedController.setState(null);
  compendiumRenameController.detach();
  compendiumRenameController.setState(null);
  compendiumScoutController.detach();
  compendiumScoutController.setState(null);
  compendiumCreatureProgressionSurface.detach();
  disposeCodexList();
  cancelCodexDetailArt();
  /* Detail uses the approved 440px portrait path rather than a thumbnail
     lease. Closing still relinquishes its retained DOM decode immediately;
     the art cache remains under the package's own byte budget. */
  for (const image of document.querySelectorAll<HTMLImageElement>('#codexpanel img')) {
    image.removeAttribute('src');
  }
  speciesArtLoader.releaseUnownedCachedArt(QUIESCENT_SPECIES_ART_CACHE);
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
  copy.innerHTML = `<b>${esc(e.name)}</b> <span class="sub">· ${esc(e.kind)}${rarityView ? ` · <span class="rarity-badge" data-sel="codex-row-rarity" style="color:${esc(rarityView.hex)}">${esc(rarityView.name)}</span>` : ''}${e.hybrid ? ' · hybrid' : ''}</span>` +
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
  releaseCompendiumAudition('detail-replaced');
  releaseCompendiumFeedExpression('detail-replaced');
  compendiumAuditionController.detach();
  compendiumAuditionController.setState(null);
  compendiumFeedController.detach();
  compendiumFeedController.setState(null);
  compendiumExplorerMealController.detach();
  compendiumExplorerMealController.setState(null);
  compendiumBreedController.detach();
  compendiumBreedController.setState(null);
  compendiumRenameController.detach();
  compendiumRenameController.setState(null);
  compendiumScoutController.detach();
  compendiumScoutController.setState(null);
  compendiumCreatureProgressionSurface.detach();
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
  releaseCompendiumAudition('detail-replaced');
  releaseCompendiumFeedExpression('detail-replaced');
  compendiumAuditionController.detach();
  compendiumAuditionController.setState(null);
  compendiumFeedController.detach();
  compendiumFeedController.setState(null);
  compendiumExplorerMealController.detach();
  compendiumExplorerMealController.setState(null);
  compendiumBreedController.detach();
  compendiumBreedController.setState(null);
  compendiumRenameController.detach();
  compendiumRenameController.setState(null);
  compendiumScoutController.detach();
  compendiumScoutController.setState(null);
  compendiumCreatureProgressionSurface.detach();
  const generation = ++codexGeneration;
  codexMode = 'detail';
  codexDetailLogicalId = String(row[0]);
  document.getElementById('codexpanel')!.classList.remove('codex-list-mode');
  const e = row[1];
  const rarityView = projectDisplayRarity(e.tier);
  const auditionModel = projectCurrentCompendiumAudition(row, generation);
  const feedModel = projectCurrentCompendiumFeed(row, generation);
  const explorerMealModel = projectCurrentCompendiumExplorerMeal(row, generation);
  const breedModel = projectCurrentCompendiumBreed(row, generation);
  const renameModel = projectCurrentCompendiumRename(row, generation);
  const scoutModel = projectCurrentCompendiumScout(row, generation);
  const showAudition = auditionModel !== null
    && auditionModel.availability !== 'non-fauna'
    && auditionModel.availability !== 'fixture';
  const showFeed = feedModel !== null
    && feedModel.availability !== 'non-fauna'
    && feedModel.availability !== 'fixture';
  const showExplorerMeal = explorerMealModel !== null
    && explorerMealModel.availability !== 'non-flora'
    && explorerMealModel.availability !== 'fixture';
  const showBreed = breedModel !== null
    && breedModel.availability !== 'non-fauna'
    && breedModel.availability !== 'fixture';
  const showRename = renameModel !== null
    && renameModel.availability !== 'non-fauna'
    && renameModel.availability !== 'fixture';
  const showScout = scoutModel !== null
    && scoutModel.surface.speciesId !== null
    && scoutModel.availability !== 'non-fauna'
    && scoutModel.availability !== 'fixture';
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
      (rarityView ? ` <span class="rarity-badge" data-sel="detail-grade" style="border:1px solid ${esc(rarityView.hex)};color:${esc(rarityView.hex)};border-radius:999px;padding:1px 9px;font-size:11px">${esc(rarityView.name)}</span>` : '') +
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
  fillPanel('codex', `<h3><button id="codexback" style="background:none;border:0;color:#9fdcff;cursor:pointer;font:13px var(--ui);padding:8px;min-height:44px">‹ Compendium</button></h3><div data-sel="codex-detail">${body}${showAudition ? '<section class="compendium-feed" data-arc7-audition-body aria-label="Creature call audition"></section>' : ''}${showRename ? '<section class="compendium-feed" data-arc5-rename-body aria-label="Rename companion"></section>' : ''}${showScout ? '<section class="compendium-feed" data-arc5-scout-body aria-label="Field Scout"></section>' : ''}${showFeed ? '<section class="compendium-feed" data-arc5-feed-body aria-label="Feed companion"></section>' : ''}${showExplorerMeal ? '<section class="compendium-feed" data-arc5-explorer-meal-body aria-label="Eat flora"></section>' : ''}${showBreed ? '<section class="compendium-feed" data-arc5-breed-body aria-label="Breed companions"></section>' : ''}</div>`);
  compendiumCreatureProgressionSurface.attach(
    document.querySelector<HTMLElement>('#codexpanel [data-sel="codex-detail"]')!,
  );
  if (showAudition) {
    compendiumAuditionController.setState(auditionModel);
    compendiumAuditionController.attach(
      document.querySelector<HTMLElement>('#codexpanel [data-arc7-audition-body]')!,
    );
  }
  if (showRename) {
    compendiumRenameController.setState(renameModel);
    compendiumRenameController.attach(
      document.querySelector<HTMLElement>('#codexpanel [data-arc5-rename-body]')!,
    );
  }
  if (showScout) {
    compendiumScoutController.setState(scoutModel);
    compendiumScoutController.attach(
      document.querySelector<HTMLElement>('#codexpanel [data-arc5-scout-body]')!,
    );
  }
  if (showFeed) {
    compendiumFeedController.setState(feedModel);
    compendiumFeedController.attach(
      document.querySelector<HTMLElement>('#codexpanel [data-arc5-feed-body]')!,
    );
  }
  if (showExplorerMeal) {
    compendiumExplorerMealController.setState(explorerMealModel);
    compendiumExplorerMealController.attach(
      document.querySelector<HTMLElement>('#codexpanel [data-arc5-explorer-meal-body]')!,
    );
  }
  if (showBreed) {
    compendiumBreedController.setState(breedModel);
    compendiumBreedController.attach(
      document.querySelector<HTMLElement>('#codexpanel [data-arc5-breed-body]')!,
    );
  }
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
function boundedCollectionActionsWritable(): boolean {
  return !smokeForceReadOnly && f4RuntimeMayMutate()
    && activePersist === null && !importWriteInFlight
    && replacementTransaction === null && !replacementReloadPending
    && !trainingCheckpointWriteHeld && !trainingActive()
    && !ecologyEpochBlocksActions();
}
function starterCharterPanelStatus(): string | null {
  if (starterCharterAcceptPendingId !== null) return 'Saving this Starter Charter acceptance…';
  return lastStarterCharterAcceptStatus;
}
function binderClaimPanelStatus(): string | null {
  if (arc9BinderClaimPendingId !== null) return 'Saving this Binder Set claim…';
  return lastArc9BinderClaimStatus;
}
function syncBoundedCollectionButtons(
  root: HTMLElement,
  selector: '[data-starter-charter-accept]' | '[data-binder-claim]',
  pending: boolean,
  unavailable = false,
): void {
  const writable = boundedCollectionActionsWritable() && !pending && !unavailable;
  root.setAttribute('aria-busy', String(pending));
  for (const button of root.querySelectorAll<HTMLButtonElement>(selector)) {
    button.disabled = !writable;
    if (writable) button.removeAttribute('aria-disabled');
    else button.setAttribute('aria-disabled', 'true');
  }
}
function fillRecords(): void {
  if (!save) return;
  const restoreFocus = capturePanelRefillFocus(document.getElementById('recpanel')!, ['data-binder-claim']);
  const st = save.stats || {};
  const rankProjection = projectArc9RecordsRankReadModelV1(save);
  const rank = rankProjection.kind === 'projected'
    ? renderArc9RecordsRankPanelV1(rankProjection.model)
    : '<section class="records-rank" data-arc9-records-protected>'
      + '<h3>Explorer Rank &amp; Achievements</h3>'
      + '<div class="empty">These records are protected because their saved authority could not be verified. Nothing was changed.</div></section>';
  const binderProjection = projectArc9BinderReadModelV1(save);
  const binder = binderProjection.kind === 'projected'
    ? renderArc9BinderPanelV1(binderProjection.model)
    : '<section class="records-binder" data-arc9-binder-protected>'
      + '<h3>🗂 Binder</h3>'
      + '<div class="empty">The Binder is protected because its saved authority could not be verified. Nothing was changed.</div></section>';
  const binderStatus = binderClaimPanelStatus();
  let chronicle = '<section class="expedition-chronicle" data-expedition-chronicle-protected>'
    + '<h3>Expedition Chronicle &amp; Museum</h3>'
    + '<div class="empty">History is protected because its current durable authorities could not be verified. Nothing was changed.</div></section>';
  if (f4Runtime !== null && arc5OwnershipState?.mode === 'current') {
    const combat = readCombatSettlementAuthorityV1(f4Runtime.extensions);
    if (combat.kind === 'loaded') {
      const projected = projectExpeditionChronicleV1({
        save,
        ownership: ownershipSourceStateV1(arc5OwnershipState),
        combat: combat.authority,
      });
      if (projected.kind === 'projected') {
        chronicle = renderExpeditionChronicleV1(projected.model);
      }
    }
  }
  const counts: Array<[string, number]> = [
    ['galaxies seen', save.galSeen.length], ['systems charted', save.sysSeen.length],
    ['worlds landed', canonicalWorldLandingCount(worldIdentityState)], ['world types met', save.ptypesSeen.length],
    ['star kinds met', save.starKindsSeen.length], ['species catalogued', save.codex.length],
    ['surveys', save.surveyedSet.length],
  ];
  fillPanel('rec',
    '<h3>Expedition Records</h3>' +
    counts.map(([k, v]) => `<div class="row" style="min-height:26px"><label>${esc(k)}</label><span style="color:#7ec8f0">${v}</span></div>`).join('') +
    (st.essenceEarned ? `<div class="row" style="min-height:26px"><label>stardust earned</label><span style="color:#ffd9a0">✦ ${st.essenceEarned}</span></div>` : '') +
    rank +
    binder +
    (binderStatus === null ? ''
      : `<p class="binder-action-status" role="status" aria-live="polite" aria-atomic="true">${esc(binderStatus)}</p>`) +
    chronicle);
  syncBoundedCollectionButtons(
    document.getElementById('recpanel')!,
    '[data-binder-claim]',
    arc9BinderClaimPendingId !== null,
  );
  restoreFocus();
}
function frontierEndingPanelStatus(): string | null {
  if (arc9FrontierEndingPending) return 'Saving your Frontier legacy…';
  if (lastArc9FrontierEndingOutcome?.startsWith('committed:')) {
    return 'Your Frontier legacy is durably saved.';
  }
  if (lastArc9FrontierEndingOutcome?.startsWith('current:')) {
    return 'That Frontier legacy is already saved.';
  }
  if (lastArc9FrontierEndingOutcome?.startsWith('refused:')) {
    return 'Nothing changed. The ending choice is unavailable under the current expedition authority.';
  }
  return null;
}
function fillPrimeCodex(): void {
  if (!save) return;
  const writable = !smokeForceReadOnly && f4RuntimeMayMutate()
    && activePersist === null && !importWriteInFlight
    && replacementTransaction === null && !replacementReloadPending
    && !trainingCheckpointWriteHeld && !trainingActive()
    && !ecologyEpochBlocksActions();
  fillPanel('prime', renderPrimeCodexPanelV1(projectPrimeCodexV1(save), {
    pending: arc9FrontierEndingPending,
    writable,
    status: frontierEndingPanelStatus(),
  }));
}
/* THE STAR ATLAS ('log' in the game): every charted place, tap to TRAVEL
   (jumpToView — the same charter gates as everything else) */
let arc9AtlasView: StarAtlasViewV1 = 'list';
let arc9AtlasClusterId: string | null = null;
let arc9AtlasFilter: StarAtlasFilterV1 = 'all';
let arc9AtlasFavoritePendingId: string | null = null;
let arc9AtlasRowPending: Readonly<{
  kind: 'home' | 'remove';
  atlasId: string;
}> | null = null;
let arc9AtlasUndoPending = false;
let lastArc9AtlasRowStatus: string | null = null;
type Arc9AtlasUndoStateV1 = Readonly<{
  receipt: Arc9AtlasDeleteReceiptV1;
  pair: SaveStateV2['logMap'][number];
  route: NavState | null;
  title: string;
  expiresAt: number;
}>;
let arc9AtlasUndo: Arc9AtlasUndoStateV1 | null = null;

function retainedAtlasRouteMatches(
  pair: SaveStateV2['logMap'][number],
  route: NavState | null,
): boolean {
  const current = atlasRouteStates.get(pair[1]);
  return route === null ? current === undefined : current === route;
}

function clearArc9AtlasUndo(): void {
  arc9AtlasUndo = null;
}

function liveArc9AtlasUndo(): Arc9AtlasUndoStateV1 | null {
  const undo = arc9AtlasUndo;
  if (undo === null) return null;
  if (performance.now() >= undo.expiresAt
    || !retainedAtlasRouteMatches(undo.pair, undo.route)) {
    clearArc9AtlasUndo();
    return null;
  }
  return undo;
}

function atlasMutationsAvailable(): boolean {
  return !arc9AtlasUndoPending && !smokeForceReadOnly && f4RuntimeMayMutate()
    && activePersist === null && !importWriteInFlight
    && replacementTransaction === null && !replacementReloadPending
    && !trainingCheckpointWriteHeld && !trainingActive()
    && !ecologyEpochBlocksActions();
}
function fillAtlas(): void {
  if (!save) return;
  const panel = document.getElementById('atlaspanel')!;
  const restoreFocus = capturePanelRefillFocus(panel, [
    'data-atlas-view', 'data-atlas-filter', 'data-atlas-travel-home',
    'data-atlas-undo', 'data-atlas-travel', 'data-atlas-favorite',
    'data-atlas-home', 'data-atlas-remove',
    'data-atlas-cluster', 'data-atlas-cluster-back',
  ]);
  const routeDestinations: Array<readonly [string, number, number]> = [];
  for (const [id, entry] of save.logMap) {
    const route = atlasRouteStates.get(entry);
    if (route?.gal !== null && route?.gal !== undefined) {
      routeDestinations.push(Object.freeze([id, route.gal.x, route.gal.y]));
    }
  }
  const identityCurrent = worldIdentityProtection === null
    && !worldIdentityBootstrapPending;
  const combat = f4Runtime === null
    ? null : readCombatSettlementAuthorityV1(f4Runtime.extensions);
  const combatCurrent = combat?.kind === 'loaded';
  const projection = projectStarAtlasV1({
    state: save,
    view: arc9AtlasView,
    filter: arc9AtlasFilter,
    routeDestinations,
    landedWorldKeys: identityCurrent
      ? worldIdentityState.records.filter((record) => record.landed).map((record) => record.key)
      : [''],
    conqueredWorldKeys: combatCurrent
      ? combat.authority.conquests.map((record) => record.worldKey)
      : [''],
    currentGalaxy: nav.mode === 'universe' ? null : Object.freeze({
      x: nav.gal.x,
      y: nav.gal.y,
    }),
  });
  const undo = liveArc9AtlasUndo();
  fillPanel('atlas', renderStarAtlasV1(projection, {
    clusterId: arc9AtlasClusterId,
    mutationsAvailable: atlasMutationsAvailable(),
    pending: arc9AtlasFavoritePendingId === null
      ? arc9AtlasRowPending
      : Object.freeze({ kind: 'favorite' as const, atlasId: arc9AtlasFavoritePendingId }),
    undo: undo === null ? null : Object.freeze({
      atlasId: undo.receipt.atlasId,
      title: undo.title,
    }),
    status: lastArc9AtlasRowStatus,
  }));
  restoreFocus();
}
document.getElementById('atlaspanel')!.addEventListener('click', async (event) => {
  if (!save || !(event.target instanceof Element)) return;
  const viewButton = event.target.closest<HTMLButtonElement>('[data-atlas-view]');
  if (viewButton !== null) {
    const value = viewButton.dataset.atlasView;
    if (value !== undefined && STAR_ATLAS_VIEWS_V1.includes(value as StarAtlasViewV1)) {
      arc9AtlasClusterId = null;
      arc9AtlasView = value as StarAtlasViewV1;
      fillAtlas();
    }
    return;
  }
  const filterButton = event.target.closest<HTMLButtonElement>('[data-atlas-filter]');
  if (filterButton !== null) {
    const value = filterButton.dataset.atlasFilter;
    if (value !== undefined && STAR_ATLAS_FILTERS_V1.includes(value as StarAtlasFilterV1)) {
      arc9AtlasClusterId = null;
      arc9AtlasFilter = value as StarAtlasFilterV1;
      fillAtlas();
    }
    return;
  }
  const clusterButton = event.target.closest<HTMLButtonElement>('[data-atlas-cluster]');
  if (clusterButton !== null) {
    arc9AtlasClusterId = clusterButton.dataset.atlasCluster ?? null;
    fillAtlas();
    document.getElementById('atlaspanel')?.querySelector<HTMLButtonElement>(
      '[data-atlas-cluster-back]',
    )?.focus();
    return;
  }
  const clusterBack = event.target.closest<HTMLButtonElement>('[data-atlas-cluster-back]');
  if (clusterBack !== null) {
    const priorCluster = arc9AtlasClusterId;
    arc9AtlasClusterId = null;
    fillAtlas();
    const panel = document.getElementById('atlaspanel');
    const origin = Array.from(panel?.querySelectorAll<HTMLButtonElement>(
      '[data-atlas-cluster]',
    ) ?? []).find((button) => button.dataset.atlasCluster === priorCluster);
    (origin ?? panel?.querySelector<HTMLButtonElement>('[data-atlas-view="chart"]')
      ?? panel?.querySelector<HTMLButtonElement>('[data-pnx]'))?.focus();
    return;
  }
  const undoButton = event.target.closest<HTMLButtonElement>('[data-atlas-undo]');
  if (undoButton !== null) {
    void runArc9AtlasUndo();
    return;
  }
  const favoriteButton = event.target.closest<HTMLButtonElement>('[data-atlas-favorite]');
  if (favoriteButton !== null) {
    const atlasId = favoriteButton.dataset.atlasFavorite;
    const hit = atlasId === undefined
      ? undefined : save.logMap.find(([id]) => id === atlasId);
    if (atlasId === undefined || hit === undefined || typeof hit[1].fav !== 'boolean') return;
    void runArc9AtlasFavoriteChange(atlasId, !hit[1].fav);
    return;
  }
  const homeButton = event.target.closest<HTMLButtonElement>('[data-atlas-home]');
  if (homeButton !== null) {
    const atlasId = homeButton.dataset.atlasHome;
    if (atlasId !== undefined) void runArc9AtlasHomeChange(atlasId, save.homeId !== atlasId);
    return;
  }
  const removeButton = event.target.closest<HTMLButtonElement>('[data-atlas-remove]');
  if (removeButton !== null) {
    const atlasId = removeButton.dataset.atlasRemove;
    if (atlasId !== undefined) void runArc9AtlasRemove(atlasId);
    return;
  }
  const travelButton = event.target.closest<HTMLButtonElement>(
    '[data-atlas-travel],[data-atlas-travel-home]',
  );
  if (travelButton === null) return;
  const atlasId = travelButton.dataset.atlasTravel
    ?? travelButton.dataset.atlasTravelHome;
  const hit = atlasId === undefined
    ? undefined : save.logMap.find(([id]) => id === atlasId);
  if (hit === undefined) return;
  const route = atlasRouteStates.get(hit[1]);
  if (!route) return;
  const keyboard = document.activeElement === travelButton;
  const moved = await searchTravel.jumpToProvenNav(route);
  if (!moved) return;
  closePanels();
  if (keyboard) app.canvas.focus();
});
/* CHARTERS — current-slice projection over canonical saved chapter data.
   The pure projection keeps legacy progress/reach intact while presenting
   only real v2 actions; never render the unported canonical copy directly. */
function fillCharters(): void {
  if (!save) return;
  const restoreFocus = capturePanelRefillFocus(document.getElementById('chpanel')!, ['data-starter-charter-accept']);
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
  const starterProjection = projectStarterCharterBoardV1(save);
  const starter = starterProjection.kind === 'projected'
    ? renderStarterCharterBoardV1(starterProjection.board)
    : '<section data-starter-charter-board-protected><h3>Starter Charters</h3>'
      + '<div class="empty">Starter Charters are protected because their saved authority could not be verified. Nothing was changed.</div></section>';
  const starterStatus = starterCharterPanelStatus();
  fillPanel('ch', '<h3>Charters — Current Expedition</h3>' + chapter + starter
    + (starterStatus === null ? ''
      : `<p class="starter-charter-status" role="status" aria-live="polite" aria-atomic="true">${esc(starterStatus)}</p>`));
  syncBoundedCollectionButtons(
    document.getElementById('chpanel')!,
    '[data-starter-charter-accept]',
    starterCharterAcceptPendingId !== null,
    starterProjection.kind !== 'projected'
      || starterProjection.board.acceptedCount >= starterProjection.board.cap,
  );
  restoreFocus();
}
registerPanel({ id: 'ch', el: document.getElementById('chpanel')!, btns: [document.getElementById('dockcharters'), document.getElementById('railcharters')], onOpen: fillCharters });
document.getElementById('chpanel')!.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest<HTMLButtonElement>('[data-starter-charter-accept]');
  if (button === null || button.disabled) return;
  const id = STARTER_CHARTER_IDS_V1.find(
    (candidate): candidate is StarterCharterIdV1 => candidate === button.dataset.starterCharterAccept,
  );
  if (id !== undefined) void runStarterCharterAccept(id);
});
const primeCodexOpener = appChrome.primeCodexOpener();
registerPanel({
  id: 'prime',
  el: document.getElementById('primepanel')!,
  btns: [primeCodexOpener],
  onOpen: fillPrimeCodex,
});
document.getElementById('primepanel')!.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest<HTMLButtonElement>('[data-frontier-ending-id]');
  if (button?.dataset.frontierEndingId === undefined) return;
  void runArc9FrontierEndingChoice(button.dataset.frontierEndingId);
});
const combatChroniclePanel = document.getElementById('combatpanel')!;
const combatChronicleMount = combatChroniclePanel.querySelector<HTMLElement>(
  '[data-combat-chronicle-body]',
)!;
let combatChronicleAudioSession: Readonly<{
  readonly claim: CombatAudioSessionClaim;
  readonly generation: number;
  readonly plan: CombatChronicleCueEmissionV1['plan'];
}> | null = null;
const combatChronicleController = new CombatChronicleController({
  root: combatChroniclePanel,
  onCue: (emission) => { void playCombatChronicleCue(emission); },
  onShare: (shareText) => { void copyCombatChronicleLog(shareText); },
  onStopVoices: (reason, generation) => {
    if (combatChronicleAudioSession?.generation !== generation) return;
    combatChronicleAudioSession = null;
    tameGreetingAudioOwner?.cancelCombatPlayback(`chronicle-${reason}`);
  },
});
combatChronicleController.attach(combatChronicleMount);
registerPanel({
  id: 'combat',
  el: combatChroniclePanel,
  onClose: () => combatChronicleController.close(),
});
registerPanel({ id: 'atlas', el: document.getElementById('atlaspanel')!, btns: [document.getElementById('dockatlas'), document.getElementById('railatlas')], onOpen: () => { fillAtlas(); gameEvent('atlas-open', { open: true }); } });
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
  gameEvent('panel-open', { id: 'codex', open: true });
}, onClose: closeCodexSurface });
registerPanel({ id: 'rec', el: document.getElementById('recpanel')!, btns: [document.getElementById('dockrecords'), document.getElementById('railrecords')], onOpen: () => {
  fillRecords();
  gameEvent('panel-open', { id: 'rec', open: true });
} });
document.getElementById('recpanel')!.addEventListener('click', async (event) => {
  if (!(event.target instanceof Element)) return;
  const paragonButton = event.target.closest<HTMLButtonElement>('[data-binder-paragon]');
  if (paragonButton !== null) {
    const index = Number(paragonButton.dataset.binderParagon);
    if (!Number.isInteger(index) || index < 0 || index >= 50) return;
    if (!save || compendiumFixtureRows !== null) return;
    const binder = projectArc9BinderReadModelV1(save);
    if (binder.kind !== 'projected') {
      fillRecords();
      return;
    }
    const slot = binder.model.paragon.slots[index];
    if (slot === undefined || slot.index !== index) return;
    if (slot.found) {
      const sourceIndex = activeCodexSource().findIndex(
        ([logicalId, record]) => String(logicalId) === slot.codexId && record.id === slot.codexId,
      );
      if (sourceIndex < 0) {
        fillRecords();
        return;
      }
      codexOpenController.present('', paragonButton);
      fillCodexDetail(sourceIndex);
      return;
    }
    const finder = projectArc9ParagonFinderV1(index);
    if (finder.kind !== 'located') {
      toast(
        'Paragon route unavailable',
        'This fixed Paragon site could not be regenerated safely. Your current route is unchanged.',
        true,
      );
      return;
    }
    const keyboard = document.activeElement === paragonButton;
    const moved = await searchTravel.jumpToCanonicalAddress(finder.address);
    if (!moved) return;
    closePanels();
    if (keyboard) app.canvas.focus({ preventScroll: true });
    return;
  }
  const button = event.target.closest<HTMLButtonElement>('[data-binder-claim]');
  if (button === null || button.disabled) return;
  const setId = ARC9_BINDER_CLAIMABLE_SET_IDS_V1.find(
    (candidate): candidate is Arc9BinderClaimableSetIdV1 => candidate === button.dataset.binderClaim,
  );
  if (setId !== undefined) void runArc9BinderSetClaim(setId);
});
const inventoryPanelController = new InventoryPanelController({
  panel: document.getElementById('inventorypanel')!,
  sheet: document.getElementById('inventorysheet')!,
  openers: [document.getElementById('dockinventory'), document.getElementById('railinventory')],
  onAction: ({ operation, instanceId }) => commitArc2InventoryAction(operation, instanceId),
  requiresSalvageConfirmation: () => save.salvageConfirm,
  deferWhileClosed: true,
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
    gameEvent('panel-open', { id: 'shipyard', open: true });
  },
});
function shipyardDiagnostics(): unknown {
  const diagnostics = engineeringPanelController.diagnostics();
  const panelOpen = openPanelId() === 'shipyard';
  return Object.freeze({
    schema: 'cf-v2-shipyard-diagnostics/v1',
    status: panelOpen ? 'open' : 'closed',
    stateKey: panelOpen ? diagnostics.previewStateKey : null,
    activePreviewCount: diagnostics.activePreviewCount,
    retainedPreviewCount: diagnostics.retainedPreviewCount,
    pendingPreviewWork: diagnostics.pendingWork,
    engineering: diagnostics,
  });
}
/* codex list rows open the detail card (delegated — rows refill often) */
document.getElementById('codexpanel')!.addEventListener('click', (e) => {
  const row = (e.target as HTMLElement).closest('[data-ci]');
  if (row) fillCodexDetail(+(row as HTMLElement).dataset.ci!);
});

/* ---- THE SEARCH BAR (the goldens' top-right slot): a marked CF1 string is
   exact route input, never tolerant display data. All three route tiers are
   regenerated and proven before the common authorization/commit seam. */
type SearchWorldNameCommit = 'committed' | 'committed-reload' | 'refused';
let lastArc0WorldNameOutcome: string | null = null;
let namedSearchPersistenceHeld = false;
let namedSearchPersistenceDeferred = false;
function reserveNamedSearchPersistence(): (() => void) | null {
  if (namedSearchPersistenceHeld) return null;
  namedSearchPersistenceHeld = true;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    namedSearchPersistenceHeld = false;
    if (namedSearchPersistenceDeferred) {
      namedSearchPersistenceDeferred = false;
      persistSoon();
    }
  };
}
async function commitArc0WorldNameForSearch(
  surface: Extract<NavState, { mode: 'surface' }>,
  address: CanonicalCF1WorldAddress,
  name: string,
): Promise<SearchWorldNameCommit> {
  const runtime = f4Runtime;
  if (!f4RuntimeMayMutate(runtime) || activePersist || importWriteInFlight
    || replacementTransaction || replacementReloadPending
    || trainingCheckpointWriteHeld) return 'refused';
  const operation = operationForArc0WorldName(address);
  const actionClaim = productActionCoordinator.tryClaim(operation);
  if (actionClaim === null) return 'refused';
  const actionBarrier = actionClaim.barrier;
  const priorUnlocked = save.unlocked;
  const priorBestRank = save.stats.bestRank ?? 0;
  productActionInFlight = true;
  activePersist = actionBarrier;
  let durable = false;
  try {
    await smokeProductActionHold.holdIfArmed(actionClaim.operation);
    await settleF4Heartbeat();
    if (!f4RuntimeMayMutate(runtime) || importWriteInFlight
      || replacementTransaction || replacementReloadPending
      || trainingCheckpointWriteHeld) {
      lastArc0WorldNameOutcome = 'write-authority-changed';
      return 'refused';
    }
    const attempt = await commitArc0WorldNameAction({
      runtime,
      state: save,
      surface,
      address,
      name,
      codecNow: Date.now(),
    });
    lastArc0WorldNameOutcome = `${attempt.kind}:${'detail' in attempt
      ? attempt.detail : attempt.transaction.revision}`;
    if (attempt.kind === 'refused') {
      if (attempt.convergence === 'read-only-reload') {
        scheduleF4AuthorityConvergenceReload(runtime, `Arc 0 world name ${attempt.detail}`);
      } else if (attempt.detail === 'world-identity:capacity'
        || attempt.detail === 'legacy-custom-names:capacity') {
        toast('World record full', 'This named route was not applied; your current expedition remains unchanged.', true);
      } else if (attempt.detail === 'legacy-custom-names:collision'
        || attempt.detail === 'legacy-custom-names:invalid'
        || attempt.detail === 'world-identity:projection-mismatch') {
        toast('World name protected', 'This named route was not applied because its saved identity record could not be updated safely.', true);
      } else if (attempt.detail.startsWith('achievement:')) {
        toast('Records protected', 'This world name was not applied because its achievement record cannot be extended safely.', true);
      }
      return 'refused';
    }

    durable = true;
    f4LastCheckpointAt = performance.now();
    lastPersistenceOutcome = `arc0-world-name-committed:${attempt.transaction.revision}`;
    if (attempt.kind === 'committed-convergence') {
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Arc 0 world name committed at revision ${attempt.transaction.revision}; ${attempt.detail}`,
      );
      return 'committed-reload';
    }

    try {
      save.customNames = attempt.transaction.state.customNames.map(([key, value]) => [key, value]);
      save.unlocked = attempt.transaction.state.unlocked.slice();
      syncCustomNameIndex();
      worldIdentityState = attempt.verification.worldIdentity.state;
      worldIdentityProtection = null;
      const achievement = attempt.verification.facts.achievement;
      presentProgressionCeremony({
        revision: attempt.transaction.revision,
        disposition: 'committed-publication',
        priorUnlockedIds: priorUnlocked,
        nextUnlockedIds: attempt.transaction.state.unlocked,
        addedAchievementIds: achievement.added ? [achievement.id] : [],
        priorBestRankIndex: priorBestRank,
        nextBestRankIndex: attempt.transaction.state.stats.bestRank ?? 0,
      });
      return 'committed';
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      worldIdentityProtection = 'committed-publication-reload';
      lastArc0WorldNameOutcome = 'committed-publication-reload';
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Arc 0 world name committed at revision ${attempt.transaction.revision}; publication ${detail}`,
      );
      return 'committed-reload';
    }
  } catch (error) {
    lastArc0WorldNameOutcome = durable
      ? 'committed-publication-reload'
      : `rejected:${error instanceof Error ? error.message : String(error)}`;
    scheduleF4AuthorityConvergenceReload(runtime, `Arc 0 world name ${lastArc0WorldNameOutcome}`);
    return durable ? 'committed-reload' : 'refused';
  } finally {
    productActionInFlight = false;
    actionClaim.settle(durable);
    /* A named CF1 route immediately joins this committed name to its Follow
       (or direct Travel) receipt. The search adapter schedules the bounded
       catch-up only if that action refuses or cannot join progression.
       Queueing here runs the
       microtask before the awaiting adapter can resume, lets the catch-up
       claim the shared coordinator, and self-refuses the valid route. */
    if (activePersist === actionBarrier) activePersist = null;
  }
}

function publishAcceptedSearchNavigation(
  plan: SearchTravelCommitPlan,
  skipPersist: boolean,
): void {
  const { target, committedNav, focusPlanet } = plan;
  nav = committedNav;
  savedRouteWriteHeld = false;
  if (nav.mode === 'galaxy') { gz0 = 0.42 * minWH() / GR; camT.z = gz0 * 1.05; }
  else { sz0 = 0.40 * minWH() / SYS_R; camT.z = sz0 * 1.05; }
  cam.z = camT.z * 0.7; cam.x = camT.x = 0; cam.y = camT.y = 0;
  playWhoosh();
  rerender(skipPersist ? { skipPersist: true } : undefined);
  if (focusPlanet && target.mode === 'surface') {
    surveyPlanet(focusPlanet, target.star, target.planet);
  }
  startSearchTravelPresentation(plan);
}

function galaxyNavForAcceptedSearchRoute(
  committedNav: SearchTravelCommitPlan['committedNav'],
): Extract<NavState, { mode: 'galaxy' }> | null {
  if (committedNav.mode === 'galaxy') return committedNav;
  const lifted = ascend(committedNav);
  return lifted.ok && lifted.state.mode === 'galaxy' ? lifted.state : null;
}

async function commitArc9AcceptedSearchRoute(
  plan: SearchTravelCommitPlan,
): Promise<boolean> {
  const galaxyNav = galaxyNavForAcceptedSearchRoute(plan.committedNav);
  const acceptedSavedView = navToView(plan.committedNav);
  if (galaxyNav === null || acceptedSavedView === null) {
    lastArc9TravelOutcome = 'refused:accepted-route-unproven';
    return false;
  }
  if (arc9TravelInspectionOnly()) {
    try {
      publishAcceptedSearchNavigation(plan, true);
      lastArc9TravelOutcome = 'inspection-only:accepted-route';
      return true;
    } catch (error) {
      lastArc9TravelOutcome = `inspection-fault:${error instanceof Error ? error.message : String(error)}`;
      return false;
    }
  }
  if (arc9TravelWriteTemporarilyBlocked()) {
    lastArc9TravelOutcome = 'unavailable:write-authority';
    return false;
  }
  const sourceNav = nav;
  return settleArc9DirectTravel(
    'galaxy-arrival',
    galaxyNav,
    sourceNav,
    () => publishAcceptedSearchNavigation(plan, true),
    acceptedSavedView,
    () => navigationAuthorityFailureFor(save, plan.target, SHIP_LIVERY_SEED) === null,
  );
}

/** Search has already decoded, source-proved, and reach-authorized this CF1
 * route. Recheck that authority after the heartbeat, then join its accepted
 * saved route, galaxy arrival, legacy Follow counter, travel achievements,
 * aggregate rank, and wayfarer event in one receipt/CAS. Renderer publication
 * remains inside the same product-action hold. */
async function commitArc9FollowedSearchRoute(
  plan: SearchTravelCommitPlan,
): Promise<boolean> {
  if (plan.followedCode === null) return false;
  const acceptedSavedView = navToView(plan.committedNav);
  const runtime = f4Runtime;
  if (acceptedSavedView === null || !f4RuntimeMayMutate(runtime) || activePersist
    || importWriteInFlight || replacementTransaction || replacementReloadPending
    || trainingCheckpointWriteHeld || trainingActive() || ecologyEpochBlocksActions()) {
    lastArc9ShareFollowOutcome = 'unavailable:write-authority';
    return false;
  }
  const actionClaim = productActionCoordinator.tryClaim(ARC9_SHARE_FOLLOW_OPERATION_V1);
  if (actionClaim === null) {
    lastArc9ShareFollowOutcome = 'unavailable:product-action-pending';
    return false;
  }
  const actionBarrier = actionClaim.barrier;
  const priorStats = save.stats;
  const priorUnlocked = save.unlocked;
  const priorGalSeen = save.galSeen;
  const priorSavedView = save.savedView;
  productActionInFlight = true;
  activePersist = actionBarrier;
  let durable = false;
  let outcome: Arc9SharingActionOutcomeV1 | null = null;
  try {
    await smokeProductActionHold.holdIfArmed(actionClaim.operation);
    await settleF4Heartbeat();
    if (!f4RuntimeMayMutate(runtime) || importWriteInFlight
      || replacementTransaction || replacementReloadPending
      || trainingCheckpointWriteHeld || trainingActive() || ecologyEpochBlocksActions()
      || navigationAuthorityFailureFor(save, plan.target, SHIP_LIVERY_SEED) !== null) {
      lastArc9ShareFollowOutcome = 'refused:authority-changed';
      return false;
    }
    outcome = await commitArc9SharingActionV1({
      runtime,
      state: save,
      actionKind: 'follow',
      code: plan.followedCode,
      acceptedSavedView,
      codecNow: Date.now(),
    });
    if (outcome.kind === 'refused') {
      lastArc9ShareFollowOutcome = `refused:${outcome.detail}`;
      if (outcome.convergence === 'read-only-reload') {
        scheduleF4AuthorityConvergenceReload(
          runtime,
          `Arc 9 CF1 Follow authority ${outcome.detail}`,
        );
      }
      return false;
    }

    durable = true;
    f4LastCheckpointAt = performance.now();
    if (outcome.kind === 'committed-convergence') {
      lastArc9ShareFollowOutcome = `committed-convergence:${outcome.detail}`;
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Arc 9 CF1 Follow committed; ${outcome.detail}`,
      );
      return true;
    }
    try {
      const checkpoint = runtime.checkpointParent();
      if (runtime !== f4Runtime
        || runtime.revision !== outcome.transaction.revision
        || checkpoint === null
        || checkpoint.stats.jumps !== outcome.counterAfter
        || outcome.arrival === null
        || checkpoint.stats.bestRank !== outcome.arrival.nextBestRank
        || JSON.stringify(checkpoint.galSeen) !== JSON.stringify(outcome.arrival.nextGalSeen)
        || JSON.stringify(checkpoint.unlocked) !== JSON.stringify(outcome.nextUnlockedIds)
        || JSON.stringify(checkpoint.savedView)
          !== JSON.stringify(outcome.route.acceptedSavedView)) {
        throw new Error('CF1 Follow runtime did not retain its exact durable checkpoint');
      }
      publishArc9SharingFieldsV1(save, outcome);
      lastPersistenceOutcome = `arc9-share-follow-committed:${outcome.transaction.revision}`;
      lastArc9ShareFollowOutcome = `committed:${outcome.counterBefore}->${outcome.counterAfter}`;
      updateChips();
      if (openPanelId() === 'rec') fillRecords();
      publishAcceptedSearchNavigation(plan, true);
      presentProgressionCeremony({
        revision: outcome.transaction.revision,
        disposition: 'committed-publication',
        priorUnlockedIds: outcome.priorUnlockedIds,
        nextUnlockedIds: outcome.nextUnlockedIds,
        addedAchievementIds: [
          ...(outcome.achievementAdded ? [outcome.achievementId] : []),
          ...outcome.arrival.addedEventAchievementIds,
          ...outcome.arrival.addedAggregateAchievementIds,
        ],
        priorBestRankIndex: outcome.arrival.sourceBestRank,
        nextBestRankIndex: outcome.arrival.nextBestRank,
      });
      return true;
    } catch (error) {
      save.stats = priorStats;
      save.unlocked = priorUnlocked;
      save.galSeen = priorGalSeen;
      save.savedView = priorSavedView;
      lastArc9ShareFollowOutcome = 'committed-publication-reload';
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Arc 9 CF1 Follow committed; publication ${error instanceof Error ? error.message : String(error)}`,
      );
      return true;
    }
  } catch (error) {
    lastArc9ShareFollowOutcome = `${durable ? 'committed-' : ''}fault`;
    if (durable) {
      save.stats = priorStats;
      save.unlocked = priorUnlocked;
      save.galSeen = priorGalSeen;
      save.savedView = priorSavedView;
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Arc 9 CF1 Follow committed; presentation ${error instanceof Error ? error.message : String(error)}`,
      );
      return true;
    }
    return false;
  } finally {
    productActionInFlight = false;
    actionClaim.settle(durable);
    if (activePersist === actionBarrier) activePersist = null;
  }
}
const searchTravel = createSearchTravelController({
  search: document.getElementById('searchbox') as HTMLInputElement,
  currentNav: () => nav,
  currentSave: () => save || null,
  shipLiverySeed: () => SHIP_LIVERY_SEED,
  currentPlanetName: (address) => worldIdentityName(worldIdentityState, address),
  routeChangeBlocked: () => blockRouteChangeWhileProductAction(),
  mutationsBlocked: () => playerMutationsBlocked(),
  planetNodeForProof,
  commitNavigation: async (plan) => {
    /* Capture intent-time distance before any name/route durability await.
       The visual owner starts only after the accepted route publishes. */
    captureSearchTravelPresentationIntent(plan);
    const { target, focusPlanet, focusAddress, customPlanetName, followedCode } = plan;
    const namedWorld = target.mode === 'surface' && focusPlanet && focusAddress && customPlanetName
      ? focusAddress : null;
    return commitSearchTravelSequence({
      commitName: namedWorld && customPlanetName && target.mode === 'surface'
        ? () => commitArc0WorldNameForSearch(target, namedWorld, customPlanetName)
        : null,
      commitRoute: async (nameCommitted) => {
        if (followedCode !== null) {
          if (arc9TravelInspectionOnly()) {
            try {
              publishAcceptedSearchNavigation(plan, true);
              lastArc9ShareFollowOutcome = 'inspection-only:no-follow-credit';
              return Object.freeze({ committed: true, progressionJoined: false });
            } catch {
              return Object.freeze({ committed: nameCommitted, progressionJoined: false });
            }
          }
          const committed = await commitArc9FollowedSearchRoute(plan);
          return Object.freeze({ committed, progressionJoined: committed });
        }
        const inspectionOnly = arc9TravelInspectionOnly();
        const committed = await commitArc9AcceptedSearchRoute(plan);
        return Object.freeze({
          committed,
          progressionJoined: committed && !inspectionOnly,
        });
      },
      queueUnjoinedNameProgression: () => {
        if (namedWorld !== null) {
          queueArc9ProgressionRefresh(operationForArc0WorldName(namedWorld));
        }
      },
      reserveInterposedPersistence: reserveNamedSearchPersistence,
    });
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
sheet.querySelector('#importretry')!.addEventListener('click', () => {
  const replacement = claimReplacementTransaction('training-recovery');
  if (replacement) scheduleReplacementReload(replacement);
});
/* Evidence-build replacement driver only. Slice and Glass call it through
   __CF_SLICE__.api to prove the whole-save replacement/reload chain; no
   player control reaches it since the save-import door was removed. */
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
      const binding = __CF_EVIDENCE_BUILD__
        ? (window as unknown as Record<string, unknown>).__cfImportPhaseWitness : undefined;
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
    } else {
      try {
        const renewal = await runtime.heartbeat();
        if (renewal.kind === 'storage-error') {
          handleF4HeartbeatStorageError(runtime, renewal, 'failed-import F4 heartbeat');
        }
      } catch (renewalError) {
        persistHold = 'protected-payload';
        persistenceBootKind = 'transient-protected';
        persistenceProtectedDetail = `failed-import F4 heartbeat rejected (${renewalError instanceof Error
          ? renewalError.message : String(renewalError)})`;
        runtime.setAnswerable(false);
        tameGreetingAudioOwner?.setAnswerable(false);
        stopF4Heartbeat();
      }
    }
    releaseReplacementTransaction(replacement);
    return 'Storage refused the write (private mode?).';
  }
  phase('release-started');
  scheduleReplacementReload(replacement, (witness) => {
    phase('release-complete', witness.error);
  });
  return null;
}

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
let compendiumFeedStatusCounterpart: Readonly<{
  receipt: AudioCounterpartReceipt;
  outcome: CompendiumFeedActionOutcomeV1;
  result: Arc5FeedResult;
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
    && toastEl.getAttribute('aria-hidden') !== 'true'
    && toastEl.getAttribute('aria-atomic') === 'true'
    && toastEl.style.opacity === '1'
    && title?.textContent === registered.title
    && toastDetailText() === registered.detail;
}
function compendiumFeedStatusCounterpartIsCurrent(
  receipt: AudioCounterpartReceipt,
): boolean {
  const registered = compendiumFeedStatusCounterpart;
  const status = document.querySelector<HTMLElement>(
    '#codexpanel [data-arc5-feed-status]',
  );
  const diagnostics = compendiumFeedController.diagnostics();
  const ownership = arc5OwnershipState;
  const creature = ownership?.mode === 'current'
    ? ownership.creatures.find((row) => row.creatureId === registered?.result.creatureId)
    : null;
  return registered !== null
    && registered.receipt.counterpartKey === receipt.counterpartKey
    && registered.receipt.eventKey === receipt.eventKey
    && registered.receipt.generation === receipt.generation
    && receipt.generation === registered.outcome.request.surface.generation
    && registered.outcome.kind === 'committed'
    && registered.outcome.convergence === 'none'
    && diagnostics.pendingWork === 0
    && diagnostics.lastOutcome === registered.outcome
    && diagnostics.surfaceKey === registered.outcome.request.surface.surfaceKey
    && codexGeneration === registered.outcome.request.surface.generation
    && codexMode === 'detail'
    && codexDetailLogicalId === registered.outcome.request.surface.logicalId
    && openPanelId() === 'codex'
    && ownership?.mode === 'current'
    && ownership.revision === registered.result.ownershipRevision
    && creature?.fed === registered.result.fedAfter
    && status !== null
    && status.isConnected
    && !status.hidden
    && status.closest('[hidden],[inert]') === null
    && status.getAttribute('role') === 'status'
    && status.getAttribute('aria-live') === 'polite'
    && status.getAttribute('aria-atomic') === 'true'
    && status.dataset.kind === 'committed'
    && status.dataset.convergence === 'none'
    && status.textContent === `${registered.outcome.title} ${registered.outcome.detail}`;
}
function creatureExpressionCounterpartIsCurrent(receipt: AudioCounterpartReceipt): boolean {
  return tameToastCounterpartIsCurrent(receipt)
    || compendiumFeedStatusCounterpartIsCurrent(receipt)
    || compendiumAuditionController.counterpartIsCurrent(receipt)
    || approachEcologyController.counterpartIsCurrent(receipt)
    || planetsideEcologyCounterpartIsCurrent(receipt)
    || combatChronicleController.counterpartIsCurrent(receipt);
}
function invalidateTameToastCounterpart(): void {
  if (tameToastCounterpart === null) return;
  tameToastCounterpart = null;
  tameGreetingAudioOwner?.counterpartLost();
}
function invalidateCompendiumFeedStatusCounterpart(): void {
  if (compendiumFeedStatusCounterpart === null) return;
  compendiumFeedStatusCounterpart = null;
  tameGreetingAudioOwner?.counterpartLost();
}
function releaseCompendiumFeedExpression(reason: string): void {
  invalidateCompendiumFeedStatusCounterpart();
  tameGreetingAudioOwner?.cancelFeedAttempt(reason);
}
function releaseCompendiumAudition(reason: string): void {
  tameGreetingAudioOwner?.cancelCompendiumAudition(reason);
}
async function runCompendiumAudition(
  request: CompendiumAuditionActionRequestV1,
  counterpart: AudioCounterpartReceipt,
): Promise<void> {
  const owner = tameGreetingAudioOwner;
  if (owner === null || !compendiumAuditionController.counterpartIsCurrent(counterpart)) {
    owner?.cancelCompendiumAudition('counterpart-unavailable');
    compendiumAuditionController.settle(request, Object.freeze({
      kind: 'silent', reason: 'counterpart-unavailable',
    }));
    return;
  }
  const claim = owner.claimCompendiumAudition(request, arc5OwnershipState);
  if (claim === null) {
    compendiumAuditionController.settle(request, Object.freeze({
      kind: 'silent', reason: owner.diagnostics().lastDisposition,
    }));
    return;
  }
  const result = await owner.playClaimedCompendiumAudition(claim, counterpart);
  compendiumAuditionController.settle(request, result);
}
function showToast(title: string, msg: string, assertive: boolean): void {
  invalidateTameToastCounterpart();
  /* A prior Feed may have used this visible carrier in AT-excluded mode.
     Restore the complete accessible status contract before changing text so
     Tame and ordinary toasts announce exactly their newly painted content. */
  toastEl.setAttribute('role', 'status');
  toastEl.setAttribute('aria-live', assertive ? 'assertive' : 'polite');
  toastEl.removeAttribute('aria-hidden');
  toastEl.innerHTML = `<b data-sel="toast-title">${esc(title)}</b><br>${esc(msg)}`;   /* every sink escapes (audit #6) */
  _toastSerial++;
  toastEl.style.opacity = '1';
  clearTimeout(_toastHide);
  _toastHide = window.setTimeout(() => {
    invalidateTameToastCounterpart();
    toastEl.style.opacity = '0';
  }, 3600);
}
function showCompendiumFeedVisualToast(title: string, msg: string): void {
  invalidateTameToastCounterpart();
  /* Feed's inline polite role=status is its sole accessible result. Configure
     this supplemental visible carrier as presentation-only before mutating
     text, preventing the same result from becoming a second announcement. */
  toastEl.setAttribute('role', 'presentation');
  toastEl.setAttribute('aria-live', 'off');
  toastEl.setAttribute('aria-hidden', 'true');
  toastEl.innerHTML = `<b data-sel="toast-title">${esc(title)}</b><br>${esc(msg)}`;
  _toastT = performance.now();
  _toastSerial++;
  toastEl.style.opacity = '1';
  clearTimeout(_toastHide);
  _toastHide = window.setTimeout(() => { toastEl.style.opacity = '0'; }, 3600);
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
function toastRankPromotion(rankName: string): void {
  _toastT = performance.now();
  showToast(
    `Rank Up — ${rankName}`,
    'Your expedition record speaks for itself, explorer.',
    false,
  );
}
function toastAchievementNotification(notification: AchievementCeremonyNotificationV1): void {
  _toastT = performance.now();
  showToast(notification.title, notification.detail, false);
}

type QueuedProgressionCeremony =
  | AchievementCeremonyNotificationV1
  | RankPromotionCeremonyV1;
const progressionCeremonyQueue: QueuedProgressionCeremony[] = [];
let progressionCeremonyTimer = 0;
let highestProgressionCeremonyRevision = -1;
let progressionCeremonyDrainCallbacks = 0;
let progressionCeremonyInFlightDeferrals = 0;
let progressionCeremonyDeliveries = 0;
let progressionCeremonyLastDeliveredKey: string | null = null;
function progressionCeremonyKey(ceremony: QueuedProgressionCeremony): string {
  return ceremony.kind === 'achievement'
    ? `achievement:${ceremony.achievementId}`
    : `rank-promotion:${ceremony.rankIndex}`;
}
function advanceProgressionCeremonyDiagnosticCounter(value: number): number {
  return value < Number.MAX_SAFE_INTEGER ? value + 1 : value;
}
function progressionCeremonyDiagnostics(): Readonly<Record<string, unknown>> {
  return Object.freeze({
    schema: 'cf-v2-progression-ceremony-diagnostics/v1',
    queueKeys: Object.freeze(progressionCeremonyQueue.map(progressionCeremonyKey)),
    timerPending: progressionCeremonyTimer !== 0,
    drainCallbacks: progressionCeremonyDrainCallbacks,
    inFlightDeferrals: progressionCeremonyInFlightDeferrals,
    deliveries: progressionCeremonyDeliveries,
    lastDeliveredKey: progressionCeremonyLastDeliveredKey,
  });
}

/** V2 has no legacy Fx singleton. Reproduce its rank-up gold palette/count
 * semantic through the current effects/motion/device policy, as a bounded
 * pointer-transparent DOM overlay that self-releases after one presentation. */
function playRankPromotionGoldFx(ceremony: RankPromotionCeremonyV1): void {
  const policy = currentVisualEffectPolicy();
  const count = Math.min(
    ceremony.goldBurst.maximumParticleCount,
    policy.particles.maximumCount,
  );
  if (count <= 0) return;
  const anchor = appChrome.rankCeremonyAnchor();
  if (anchor === null) return;

  const root = document.createElement('div');
  root.dataset.progressionCeremonyFx = 'rank-gold';
  root.setAttribute('aria-hidden', 'true');
  Object.assign(root.style, {
    position: 'fixed',
    inset: '0',
    pointerEvents: 'none',
    overflow: 'hidden',
    zIndex: '90',
  });
  const originX = anchor.x;
  const originY = anchor.y;
  const animated = policy.particles.mode === 'animated';
  for (let index = 0; index < count; index++) {
    const spark = document.createElement('i');
    const size = 3 + (index % 3);
    const angle = (index / count) * TAU - Math.PI / 2;
    const distance = 28 + (index % 5) * 7;
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    const color = ceremony.goldBurst.colors[index % ceremony.goldBurst.colors.length]!;
    Object.assign(spark.style, {
      position: 'absolute',
      left: `${originX - size / 2}px`,
      top: `${originY - size / 2}px`,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      background: color,
      boxShadow: `0 0 ${size * 2}px ${color}`,
      opacity: animated ? '0' : '0.82',
      transform: animated
        ? 'translate(0, 0) scale(.45)'
        : `translate(${x * 0.62}px, ${y * 0.62}px)`,
    });
    root.append(spark);
    if (animated && typeof spark.animate === 'function') {
      try {
        spark.animate([
          { opacity: 0, transform: 'translate(0, 0) scale(.45)' },
          { opacity: 1, offset: 0.18, transform: `translate(${x * 0.18}px, ${y * 0.18}px) scale(1)` },
          { opacity: 0, transform: `translate(${x}px, ${y}px) scale(.7)` },
        ], {
          duration: 760 + (index % 4) * 55,
          easing: 'cubic-bezier(.2,.7,.2,1)',
          fill: 'forwards',
        });
      } catch {
        spark.style.opacity = '0.82';
        spark.style.transform = `translate(${x * 0.62}px, ${y * 0.62}px)`;
      }
    }
  }
  document.body.append(root);
  window.setTimeout(() => root.remove(), animated ? 1_050 : 900);
}

function scheduleProgressionCeremonyDrain(delay = 0): void {
  if (progressionCeremonyTimer !== 0) return;
  progressionCeremonyTimer = window.setTimeout(() => {
    progressionCeremonyTimer = 0;
    progressionCeremonyDrainCallbacks = advanceProgressionCeremonyDiagnosticCounter(
      progressionCeremonyDrainCallbacks,
    );
    if (replacementReloadPending) {
      progressionCeremonyQueue.length = 0;
      return;
    }
    /* A prior action's queued achievement/rank must not interrupt the newer
       receipt-bearing action that currently owns product state. Keep the
       ceremony intact and resume draining after that owner settles. */
    if (productActionInFlight) {
      progressionCeremonyInFlightDeferrals = advanceProgressionCeremonyDiagnosticCounter(
        progressionCeremonyInFlightDeferrals,
      );
      scheduleProgressionCeremonyDrain(200);
      return;
    }
    if (toastEl.style.opacity === '1') {
      scheduleProgressionCeremonyDrain(200);
      return;
    }
    const ceremony = progressionCeremonyQueue.shift();
    if (ceremony === undefined) return;
    progressionCeremonyDeliveries = advanceProgressionCeremonyDiagnosticCounter(
      progressionCeremonyDeliveries,
    );
    progressionCeremonyLastDeliveredKey = progressionCeremonyKey(ceremony);
    if (ceremony.kind === 'achievement') toastAchievementNotification(ceremony);
    else toastRankPromotion(ceremony.rankName);
    try { playRaritySting(ceremony.stingTier); }
    catch { /* a ceremony remains visually complete without Web Audio */ }
    if (ceremony.kind === 'rank-promotion') {
      try { playRankPromotionGoldFx(ceremony); }
      catch { /* effects are supplemental to the durable rank and toast */ }
    }
    scheduleProgressionCeremonyDrain(3_650);
  }, delay);
}

/** The sole Main delivery seam. Revisions only advance under the shared
 * product-action owner, so retaining the highest seen revision makes a
 * repeated/out-of-order result silent in constant space. The pure planner
 * independently suppresses boot, already-durable, convergence and refusal. */
function presentProgressionCeremony(
  input: ProgressionCeremonyInputV1 & Readonly<{ revision: number }>,
): void {
  if (!Number.isSafeInteger(input.revision) || input.revision < 0
    || input.revision <= highestProgressionCeremonyRevision) return;
  highestProgressionCeremonyRevision = input.revision;
  const plan = planProgressionCeremonyV1({
    disposition: input.disposition,
    priorUnlockedIds: input.priorUnlockedIds,
    nextUnlockedIds: input.nextUnlockedIds,
    addedAchievementIds: input.addedAchievementIds,
    priorBestRankIndex: input.priorBestRankIndex,
    nextBestRankIndex: input.nextBestRankIndex,
  });
  if (plan.kind !== 'present') return;
  progressionCeremonyQueue.push(...plan.achievements);
  if (plan.rankPromotion !== null) progressionCeremonyQueue.push(plan.rankPromotion);
  scheduleProgressionCeremonyDrain();
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
function bindCompendiumFeedStatusCounterpart(
  claim: FeedExpressionClaim,
  outcome: CompendiumFeedActionOutcomeV1,
  result: Arc5FeedResult,
): AudioCounterpartReceipt | null {
  if (outcome.kind !== 'committed' || outcome.convergence !== 'none'
    || outcome.request.surface.generation < 1) return null;
  const receipt = Object.freeze({
    counterpartKey: `feed-status:${result.revision}:${result.receiptOrdinal}`,
    eventKey: claim.eventKey,
    generation: outcome.request.surface.generation,
  });
  compendiumFeedStatusCounterpart = Object.freeze({ receipt, outcome, result });
  if (compendiumFeedStatusCounterpartIsCurrent(receipt)) return receipt;
  compendiumFeedStatusCounterpart = null;
  return null;
}
function currentTameGreetingRouteKey(): string | null {
  if (nav.mode === 'universe') return 'cf-route:universe';
  if (nav.mode === 'galaxy') return `cf-route:galaxy:${getProvenGalaxyKey(nav.gal)}`;
  if (nav.mode === 'system') {
    return `cf-route:system:${getProvenGalaxyKey(nav.gal)}:${getProvenStarKey(nav.star)}`;
  }
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
  verifyCounterpart: creatureExpressionCounterpartIsCurrent,
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
  const ship = currentShipVisualState();
  const publishUnavailable = (reason: string): void => engineeringPanelController.setView(
    Object.freeze({ ship, engineering: null, reason }),
  );
  if (arc3EngineeringProtection !== null) {
    publishUnavailable(
      'Engineering details and actions are unavailable while this expedition’s Engineering record is protected.',
    );
    return;
  }
  if (!f4RuntimeMayMutate(runtime)) {
    publishUnavailable(
      'Engineering details and actions are unavailable while expedition storage is read-only.',
    );
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
      publishUnavailable(
        'Engineering details and actions are unavailable because their saved authority could not be verified.',
      );
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
      publishUnavailable(
        'Engineering details and actions are unavailable because their saved authority could not be verified.',
      );
      return;
    }
    arc3EngineeringState = verified.state;
    lastArc3ProjectionDiagnostics = verified.projection.diagnostics;
    const panelModel = projectEngineeringPanelReadModel({
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
    });
    engineeringPanelController.setView(Object.freeze({
      ship,
      engineering: panelModel,
      reason: null,
    }));
  } catch {
    /* A presentation projection never repairs or launders authority. The
       durable action seam will independently report the exact refusal. */
    publishUnavailable(
      'Engineering details and actions are unavailable because their saved authority could not be verified.',
    );
  }
}

function updateChips(): void {
  const stage = ascStage();
  const objective = currentV2Objective(save.ascCh, save.ascProg, stage);
  const projection = projectV2Charter(save.ascCh, save.ascProg, stage);
  const rankProjection = projectArc9RecordsRankReadModelV1(save);
  appChrome.renderStatus({
    explorerName: save.explorerName,
    essence: save.essence,
    landedWorlds: canonicalWorldLandingCount(worldIdentityState),
    hp: save.hp,
    hpMax: save.HP_MAX,
    primeCount: primeCount(),
    rank: rankProjection.kind === 'projected' ? Object.freeze({
      name: rankProjection.model.rank.name,
      nameplateHue: rankProjection.model.rank.nameplateHue,
      nameplateIridescent: rankProjection.model.rank.nameplateIridescent,
    }) : null,
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
  return (_fbdC = polishSystemCanvasV1(cv));
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
  const finished = polishSystemCanvasV1(cv);
  _coronaC.set(col, finished);
  peakLocalCanvasCacheEntries = Math.max(
    peakLocalCanvasCacheEntries,
    _coronaC.size + _termC.size,
  );
  return finished;
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
  return (_webC = polishGalaxyCanvasV1(cv));
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
  return (_fogBC = polishGalaxyCanvasV1(cv));
}
let _veilC: HTMLCanvasElement | null = null;
function veilSpr(): HTMLCanvasElement {   /* the beyond-charter veil (main.js 3760), proportional bake */
  if (_veilC) return _veilC;
  const S = 512, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d')!, C = S / 2;
  const gr = g.createRadialGradient(C, C, C * (0.97 / 2.0), C, C, C);
  gr.addColorStop(0, 'rgba(5,7,16,0)'); gr.addColorStop(0.5, 'rgba(5,7,16,0.2)'); gr.addColorStop(1, 'rgba(4,5,12,0.36)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  /* This is a reach-denial mask, not decorative art. Preserve its exact dark
     opacity ladder so polish can never make inaccessible space look open. */
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
  return (_obsC = polishGalaxyCanvasV1(cv));
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
  return (_radioC = polishGalaxyCanvasV1(cv));
}
let _tailC: HTMLCanvasElement | null = null;
function cometTailSpr(): HTMLCanvasElement {   /* the tail gradient (main.js 5388), baked as a strip */
  if (_tailC) return _tailC;
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 8;
  const g = cv.getContext('2d')!;
  const gr = g.createLinearGradient(0, 0, 64, 0);
  gr.addColorStop(0, 'rgba(200,230,255,0.8)'); gr.addColorStop(1, 'transparent');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 8);
  return (_tailC = polishSystemCanvasV1(cv));
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
function canonicalStarAddressForSurvey(star: StarNodeRef): CanonicalCF1StarAddress | null {
  if (nav.mode !== 'galaxy') return null;
  const expectedGalaxyKey = getProvenGalaxyKey(nav.gal);
  if (expectedGalaxyKey === null) return null;
  const resolved = resolveCF1StarAddress({ galaxy: nav.gal, star });
  return resolved.ok
    && getProvenGalaxyKey(resolved.address.galaxy) === expectedGalaxyKey
    ? resolved.address : null;
}
function surveyStar(star: StarNodeRef): boolean {
  const address = canonicalStarAddressForSurvey(star);
  if (address === null) return false;
  const descriptor = describePick({ kind: 'star', data: star } as never);
  if (!descriptor) return false;
  const travelStar = { seed: star.seed, x: star.x, y: star.y };
  surveyCard(descriptor, {
    label: 'Enter system', run: () => descendSystem(travelStar),
  });
  /* Survey presentation is immediate; its progression record is one separate
     source-rederived F4 settlement and never trusts descriptor metadata. */
  void settleArc9Survey(address);
  return true;
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
let surfaceVistaWorker: Worker | null = null;
let surfaceVistaDeadline: ReturnType<typeof setTimeout> | null = null;
let surfaceVistaSprite: Sprite | null = null;
let surfaceVistaGeneration = 0;
let surfaceVistaWorldKey: string | null = null;
let surfaceVistaEnvironmentFingerprint: string | null = null;
let surfaceVistaWorkerStarts = 0;
let surfaceVistaResults = 0;
let surfaceVistaCacheHits = 0;
let surfaceVistaStaleDrops = 0;
let surfaceVistaFaults = 0;
let surfaceVistaLastBiome: string | null = null;
let surfaceVistaLastError: string | null = null;
const surfaceVistaCanvasCache = new Map<string, HTMLCanvasElement>();
const SURFACE_VISTA_DEADLINE_MS = 12_000;
function noteSurfaceVistaFault(error: unknown, fallback: string): void {
  const raw = error instanceof Error ? error.message : typeof error === 'string' ? error : fallback;
  surfaceVistaFaults++;
  surfaceVistaLastError = (raw.trim() || fallback).slice(0, 512);
}
const surfaceVistaCacheOwner = Object.freeze({
  cache: surfaceVistaCanvasCache,
  mount: mountSurfaceVistaCanvas,
  dispose: (canvas: HTMLCanvasElement): void => {
    canvas.width = 1;
    canvas.height = 1;
  },
});
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

function releaseSurfaceVistaOwner(): void {
  surfaceVistaGeneration++;
  surfaceVistaWorldKey = null;
  surfaceVistaEnvironmentFingerprint = null;
  if (surfaceVistaDeadline !== null) {
    clearTimeout(surfaceVistaDeadline);
    surfaceVistaDeadline = null;
  }
  if (surfaceVistaWorker) {
    surfaceVistaWorker.terminate();
    surfaceVistaWorker = null;
  }
  if (surfaceVistaSprite) {
    surfaceVistaSprite.texture = Texture.EMPTY;
    surfaceVistaSprite.removeFromParent();
    surfaceVistaSprite.destroy({ children: true });
    surfaceVistaSprite = null;
  }
}

function releaseSurfaceVistaCache(): void {
  for (const canvas of surfaceVistaCanvasCache.values()) {
    canvas.width = 1;
    canvas.height = 1;
  }
  surfaceVistaCanvasCache.clear();
}

function mountSurfaceVistaCanvas(canvas: HTMLCanvasElement): void {
  if (nav.mode !== 'surface') return;
  if (surfaceVistaSprite) {
    surfaceVistaSprite.texture = Texture.EMPTY;
    surfaceVistaSprite.removeFromParent();
    surfaceVistaSprite.destroy({ children: true });
  }
  const sprite = new Sprite(sceneTexture(canvas));
  sprite.eventMode = 'none';
  sprite.anchor.set(0.5);
  const layout = biomeVistaMountLayoutV1(
    app.screen.width,
    app.screen.height,
    canvas.width,
    canvas.height,
  );
  sprite.scale.set(layout.scale);
  sprite.position.set(layout.centerX, layout.centerY);
  const worldIndex = app.stage.children.indexOf(world);
  app.stage.addChildAt(sprite, worldIndex < 0 ? app.stage.children.length : worldIndex);
  surfaceVistaSprite = sprite;
}

function requestSurfaceVista(
  planet: PlanetNode,
  state: Extract<NavState, { mode: 'surface' }>,
  roster: CanonicalWorldRoster | null,
): void {
  if (!roster || typeof Worker !== 'function') return;
  const provenWorldKey = getProvenPlanetKey(state.planet);
  if (provenWorldKey === null || roster.worldKey !== provenWorldKey
    || roster.starSeed !== state.star.seed) {
    noteSurfaceVistaFault(null, 'biome vista roster identity mismatch');
    return;
  }
  let request: ReturnType<typeof buildBiomeVistaRenderRequestV1>;
  try {
    request = buildBiomeVistaRenderRequestV1(
      planet,
      state.star.seed,
      provenWorldKey,
      systemFor(state.star.seed) as Record<string, unknown>,
      roster,
    );
  } catch (error) {
    noteSurfaceVistaFault(error, 'biome vista request construction failed');
    return;
  }
  const cacheKey = `vista-v1|${request.environmentFingerprint}|${roster.fullRosterFingerprint}|${request.scene}|${request.biomeKey}`;
  const cachedOutcome = mountCachedBiomeVistaV1(surfaceVistaCacheOwner, cacheKey);
  if (cachedOutcome !== 'miss') {
    if (cachedOutcome === 'fault') {
      noteSurfaceVistaFault(null, 'biome vista cache mount failed');
    }
    else {
      surfaceVistaCacheHits++;
      surfaceVistaLastBiome = request.biomeKey;
    }
    return;
  }

  const generation = surfaceVistaGeneration;
  let worker: Worker;
  try {
    worker = new Worker(
      new URL('./biome-vista.worker.ts', import.meta.url),
      { type: 'module', name: 'cf-biome-vista' },
    );
  } catch (error) {
    /* Module-worker/CSP support is an enhancement boundary: the already
       painted globe remains a complete usable surface when construction is
       unavailable. */
    noteSurfaceVistaFault(error, 'biome vista worker construction failed');
    return;
  }
  surfaceVistaWorker = worker;
  surfaceVistaWorldKey = request.worldKey;
  surfaceVistaEnvironmentFingerprint = request.environmentFingerprint;
  surfaceVistaWorkerStarts++;
  const stale = (): boolean => surfaceVistaWorker !== worker
    || surfaceVistaGeneration !== generation
    || surfaceVistaWorldKey !== request.worldKey
    || surfaceVistaEnvironmentFingerprint !== request.environmentFingerprint
    || nav.mode !== 'surface'
    || nav.star.seed !== roster.starSeed
    || getProvenPlanetKey(nav.planet) !== request.worldKey
    || nav.planet.seed !== planet.seed
    || nav.planet.ordinal !== planet.ordinal;
  const finishWorker = (): void => {
    worker.terminate();
    if (surfaceVistaWorker === worker) {
      surfaceVistaWorker = null;
      if (surfaceVistaDeadline !== null) {
        clearTimeout(surfaceVistaDeadline);
        surfaceVistaDeadline = null;
      }
    }
  };
  worker.addEventListener('error', (event) => {
    containBiomeVistaWorkerErrorV1(event, {
      stale,
      noteFault: () => noteSurfaceVistaFault(event.message, 'biome vista worker error event'),
      finish: finishWorker,
    });
  }, { once: true });
  worker.addEventListener('messageerror', () => {
    if (!stale()) {
      noteSurfaceVistaFault(null, 'biome vista worker message could not be deserialized');
    }
    finishWorker();
  }, { once: true });
  worker.addEventListener('message', (event: MessageEvent<unknown>) => {
    const raw = event.data as { bitmap?: { close?: unknown } } | null;
    if (!validBiomeVistaWorkerResponseV1(event.data)) {
      try {
        if (typeof raw?.bitmap?.close === 'function') raw.bitmap.close();
      } catch { /* malformed worker data stays fail-soft */ }
      if (!stale()) noteSurfaceVistaFault(null, 'biome vista worker response violated protocol');
      finishWorker();
      return;
    }
    const response: BiomeVistaWorkerResponseV1 = event.data;
    const identityMatches = biomeVistaWorkerResponseIdentityMatchesV1(response, {
      documentToken: DOCUMENT_TOKEN,
      generation: generation,
      worldKey: request.worldKey,
      environmentFingerprint: request.environmentFingerprint,
      profileSchema: request.profileSchema,
      profileDigest: request.profileDigest,
    });
    const disposition = biomeVistaWorkerResponseDispositionV1(stale(), identityMatches);
    if (disposition !== 'current') {
      if (response.type === 'result') {
        try { response.bitmap.close(); } catch { /* transferable cleanup is fail-soft */ }
      }
      if (disposition === 'stale') surfaceVistaStaleDrops++;
      else noteSurfaceVistaFault(null, 'biome vista worker response authority mismatch');
      finishWorker();
      return;
    }
    if (response.type === 'error') {
      noteSurfaceVistaFault(response.message, 'biome vista worker render failed');
      finishWorker();
      return;
    }
    if (response.scene !== request.scene || response.biomeKey !== request.biomeKey) {
      try { response.bitmap.close(); } catch { /* transferable cleanup is fail-soft */ }
      noteSurfaceVistaFault(null, 'biome vista worker response identity mismatch');
      finishWorker();
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = response.width;
    canvas.height = response.height;
    try {
      const context = canvas.getContext('2d');
      if (!context) throw new Error('biome vista copy context unavailable');
      context.drawImage(response.bitmap, 0, 0);
    } catch (error) {
      try { response.bitmap.close(); } catch { /* transferable cleanup is fail-soft */ }
      canvas.width = 1;
      canvas.height = 1;
      noteSurfaceVistaFault(error, 'biome vista bitmap copy failed');
      finishWorker();
      return;
    }
    try { response.bitmap.close(); } catch { /* transferable cleanup is fail-soft */ }
    if (stale()) {
      canvas.width = 1;
      canvas.height = 1;
      surfaceVistaStaleDrops++;
      finishWorker();
      return;
    }
    if (mountAndCommitBiomeVistaV1(surfaceVistaCacheOwner, cacheKey, canvas) === 'fault') {
      noteSurfaceVistaFault(null, 'biome vista cache commit failed');
      finishWorker();
      return;
    }
    surfaceVistaResults++;
    surfaceVistaLastBiome = response.biomeKey;
    finishWorker();
  });
  surfaceVistaDeadline = setTimeout(() => {
    if (!stale()) noteSurfaceVistaFault(null, 'biome vista worker deadline exceeded');
    finishWorker();
  }, SURFACE_VISTA_DEADLINE_MS);
  const message = Object.freeze({
    schema: BIOME_VISTA_WORKER_REQUEST_SCHEMA,
    type: 'render' as const,
    documentToken: DOCUMENT_TOKEN,
    generation,
    request,
  }) satisfies BiomeVistaWorkerRenderMessageV1;
  if (!validBiomeVistaWorkerRenderMessageV1(message)) {
    noteSurfaceVistaFault(null, 'biome vista product request violated worker protocol');
    finishWorker();
    return;
  }
  try {
    worker.postMessage(message);
  } catch (error) {
    if (!stale()) noteSurfaceVistaFault(error, 'biome vista worker postMessage failed');
    finishWorker();
  }
}

function clearWorld(openNextScope = true): void {
  /* Destroy display objects first, then the scene owner's unique CanvasSource
     set. The painter caches may retain bounded CPU canvases for deterministic
     reuse, but Pixi must not keep their evicted GPU sources reachable. */
  const previousSurfacePlanetTextureOwner = releaseSurfacePlanetTextureOwner();
  releaseSurfaceVistaOwner();
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
  const effectPolicy = currentVisualEffectPolicy();
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
  const fogCandidates: Array<{ wx: number; wy: number; ramp: number; alpha: number }> = [];
  for (let fx = uniCell.ux * 2 - R * 2; fx <= uniCell.ux * 2 + R * 2; fx++) for (let fy = uniCell.uy * 2 - R * 2; fy <= uniCell.uy * 2 + R * 2; fy++) {
    if (effectPolicy.particles.maximumCount === 0) continue;
    const wx = fx * FC + FC * 0.5, wy = fy * FC + FC * 0.5;
    const dd = Math.hypot(wx - HOME_POS.x, wy - HOME_POS.y);
    if (dd < rr * 1.04) continue;
    const ramp = Math.min(Math.max((dd - rr) / (rr * 0.55), 0), 1);
    const n = (UNOISE as (x: number, y: number, o: number) => number)(wx / UCELL * 0.16, wy / UCELL * 0.16, 3);
    const a = Math.min(Math.max((n - 0.32) * 1.1, 0), 0.7) * ramp;
    if (a <= 0.03) continue;
    fogCandidates.push({ wx, wy, ramp, alpha: a });
  }
  for (const candidate of selectFogParticleCandidatesV1(
    fogCandidates,
    effectPolicy.particles.maximumCount,
    camT.x,
    camT.y,
  )) {
    const f = new Sprite(sceneTexture(fogBlobSpr()));
    f.anchor.set(0.5);
    f.position.set(candidate.wx, candidate.wy);
    f.width = FC * 1.9; f.height = FC * 1.9;
    f.alpha = candidate.alpha;
    f.cullable = true;
    charterFx.addChild(f);
    fogFx.push({
      spr: f, wx: candidate.wx, wy: candidate.wy, ramp: candidate.ramp,
    });   /* the drift re-samples the noise per tick */
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
      spr.on('pointertap', () => { surveyStar(s); });
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
        spr.on('pointertap', () => { surveyStar(s); });
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
  if (!options.preserveSurvey && openPanelId() === 'combat') closePanels();
  tameGreetingAudioOwner?.syncRoute(currentTameGreetingRouteKey());
  /* A density-only rebuild replaces Pixi textures, not the player's selected
     object. Navigation transitions invalidate the card as before; monitor/
     DPR changes preserve its exact DOM, full-identity context, and action. */
  if (!options.preserveSurvey) {
    const discardSurvey = cardCtx === null || activeCardPlanetWhere() === null;
    invalidateSurveyTravel();
    hideSurvey();
    if (discardSurvey) discardSurveyPresentation('survey-navigation-invalidated');
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
function resolveGalaxyDescent(
  g: { seed: number; x: number; y: number },
): Extract<NavState, { mode: 'galaxy' }> | null {
  const proven = resolveCF1Galaxy(g);
  if (!proven.ok) return null;
  const galaxy = proven.galaxy;
  const r = enterGalaxy(nav, galaxy);
  if (!r.ok) return null;
  /* The saved Prime Signature radius gates intergalactic reach. It is not a
     drive/Charter gate, so preserve that distinction in the visible boundary. */
  if (searchTravel.navigationAuthorityFailure(r.state) === 'prime-reach') {
    camT.z = Math.min(camT.z, (0.55 * minWH() / Math.max(galaxy.size, 8)) * 0.97);
    toastPrimeReachBoundary();
    return null;
  }
  return r.state;
}
function publishGalaxyDescent(
  accepted: Extract<NavState, { mode: 'galaxy' }>,
  skipPersist: boolean,
): void {
  nav = accepted;
  savedRouteWriteHeld = false;
  gz0 = 0.42 * minWH() / GR;
  cam.x = 0; cam.y = 0; camT.x = 0; camT.y = 0;
  camT.z = gz0 * 1.05; cam.z = gz0 * 0.35;
  playWhoosh();   /* travel & planetfall breathe (main.js: the shipped sting) */
  rerender(skipPersist ? { skipPersist: true } : undefined);
}
/** Browser evidence needs a synchronous scene-composition front door. It is
 * deliberately navigation-only: product play uses the durable owner below. */
function descendGalaxyForEvidence(g: { seed: number; x: number; y: number }): boolean {
  if (blockRouteChangeWhileProductAction()) return false;
  const accepted = resolveGalaxyDescent(g);
  if (accepted === null) return false;
  publishGalaxyDescent(accepted, true);
  return true;
}
let automaticGalaxyArrivalLatch: string | null = null;
function descendGalaxy(
  g: { seed: number; x: number; y: number },
  source: 'explicit' | 'zoom' = 'explicit',
): boolean {
  if (blockRouteChangeWhileProductAction()) return false;
  const sourceNav = nav;
  const accepted = resolveGalaxyDescent(g);
  if (accepted === null) return false;
  const galaxyKey = getProvenGalaxyKey(accepted.gal);
  if (galaxyKey === null) return false;
  if (source === 'zoom' && automaticGalaxyArrivalLatch === galaxyKey) return false;
  if (arc9TravelInspectionOnly()) {
    publishGalaxyDescent(accepted, true);
    return true;
  }
  if (arc9TravelWriteTemporarilyBlocked()) return false;
  /* The async owner executes synchronously through its ownership claim. A
     caller-side preflight is only advisory: claim the one-shot latch from
     the owner's accepted callback, after coordinator + persistence ownership
     and before its first await. A refused intent therefore remains retryable. */
  let ownerAccepted = false;
  void settleArc9DirectTravel(
    'galaxy-arrival',
    accepted,
    sourceNav,
    () => publishGalaxyDescent(accepted, true),
    undefined,
    undefined,
    () => {
      ownerAccepted = true;
      if (source === 'zoom') automaticGalaxyArrivalLatch = galaxyKey;
    },
  );
  return ownerAccepted;
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
function canonicalRosterForBioscanCard(
  address: CanonicalCF1WorldAddress,
  prepared: CanonicalWorldRoster | null,
): CanonicalWorldRoster | null {
  if (prepared !== null
    && isCanonicalWorldRoster(prepared)
    && prepared.worldKey === address.key
    && prepared.ecologyEpoch === currentEcologyEpoch()) return prepared;
  const result = canonicalWorldRoster(address, currentEcologyEpoch());
  return result.ok ? result.roster : null;
}
function projectCurrentBioscanCardState(
  address: CanonicalCF1WorldAddress,
  roster: CanonicalWorldRoster | null,
  ownedActionBarrier: Promise<boolean> | null = null,
): BioscanCardStateV1 {
  let facts: ReturnType<typeof deriveArc9SurveyFactV1>;
  try { facts = deriveArc9SurveyFactV1(address); }
  catch { return Object.freeze({ kind: 'unavailable', worldKey: address.key, detail: 'source-unproven' }); }
  if (facts.target !== 'world' || !facts.living) {
    return Object.freeze({ kind: 'nonliving', worldKey: address.key });
  }
  const survey = prepareArc9SurveySettlementV1(save, address);
  if (survey.kind === 'current') {
    return Object.freeze({ kind: 'recorded', worldKey: address.key });
  }
  if (survey.kind !== 'ready') {
    return Object.freeze({ kind: 'unavailable', worldKey: address.key, detail: `survey:${survey.reason}` });
  }
  const runtime = f4Runtime;
  const ownershipV2 = arc5OwnershipState;
  if (roster === null || roster.worldKey !== address.key
    || roster.ecologyEpoch !== currentEcologyEpoch()) {
    return Object.freeze({ kind: 'unavailable', worldKey: address.key, detail: 'roster-unavailable' });
  }
  if (runtime === null || ownershipV2?.mode !== 'current'
    || arc5OwnershipEvidence?.representationVersion !== ARC5_OWNERSHIP_MIGRATION_VERSION
    || arc5OwnershipProtection !== null || arc3EngineeringState === null
    || arc3EngineeringProtection !== null || !f4RuntimeMayMutate(runtime)
    || activePersist !== ownedActionBarrier || importWriteInFlight || replacementTransaction
    || replacementReloadPending || trainingCheckpointWriteHeld || trainingActive()
    || ecologyEpochBlocksActions()) {
    return Object.freeze({ kind: 'unavailable', worldKey: address.key, detail: 'write-authority-unavailable' });
  }
  try {
    const loadout = readArc2EngineeringLoadout(runtime.extensions);
    const combat = readCombatSettlementAuthorityV1(runtime.extensions);
    if (loadout.kind !== 'loaded' || combat.kind !== 'loaded') {
      return Object.freeze({ kind: 'unavailable', worldKey: address.key, detail: 'authority-unavailable' });
    }
    const engineering = arc3EngineeringState;
    const capabilities = projectEngineeringCapabilities(loadout.loadout);
    const opportunity = projectWorldOpportunity(address);
    const projection = projectBioscanActionV1({
      ownershipV2,
      engineering,
      capabilities,
      state: save,
      address,
      roster,
      opportunity,
      settled: combat.authority.conquests.some(({ worldKey }) => worldKey === address.key),
    });
    if (projection.kind !== 'ready') {
      return Object.freeze({
        kind: projection.detail === 'already-recorded' ? 'recorded' : 'unavailable',
        worldKey: address.key,
        ...(projection.detail === 'already-recorded' ? {} : { detail: projection.detail }),
      }) as BioscanCardStateV1;
    }
    return Object.freeze({
      kind: 'ready', worldKey: address.key, address, roster, opportunity,
      engineering, capabilities, ownershipV2, projection,
    });
  } catch {
    return Object.freeze({ kind: 'unavailable', worldKey: address.key, detail: 'projection-failed' });
  }
}
function bioscanCardActionHtml(state: BioscanCardStateV1): string {
  if (state.kind === 'nonliving') return '';
  if (state.kind === 'recorded') {
    return '<span data-bioscan-status="recorded" role="status" style="color:#7fe6a0;align-self:center;font-size:12px">🔬 Life recorded</span>';
  }
  if (state.kind === 'unavailable') {
    return '<button type="button" data-act="bioscan" disabled title="Discover Life is unavailable until expedition save authority is ready" style="background:#14233c;color:var(--dim);border:1px solid #2a3c5e;border-radius:9px;padding:8px 14px;min-height:44px;font:12px system-ui">🔬 Discover Life unavailable</button>';
  }
  const probability = Math.round(state.projection.hazard.probability * 100);
  const damage = state.projection.hazard.finalDamage;
  const warning = probability > 0 ? ` · ⚠ ${probability}% danger` : ' · safe';
  const title = probability > 0
    ? `Hostile wildlife may cause ${damage} field damage. Your Field Scout intercepts it when assigned.`
    : 'Record this living world. Capture remains a separate action.';
  return `<button type="button" data-act="bioscan" data-bioscan-world="${esc(state.worldKey)}" data-bioscan-probability="${probability}" data-bioscan-damage="${damage}" title="${esc(title)}" style="background:rgba(127,230,160,0.14);color:#b9f0c8;border:1px solid rgba(127,230,160,0.55);border-radius:9px;padding:8px 14px;cursor:pointer;min-height:44px;font:12px system-ui">🔬 Discover Life${warning}</button>`;
}
type LandingCardStateV1 =
  | Readonly<{
    readonly kind: 'ready';
    readonly worldKey: string;
    readonly label: string;
    readonly title: string;
    readonly disclosure: string;
    readonly successPercent: number;
    readonly damageMin: number;
    readonly damageMax: number;
  }>
  | Readonly<{ readonly kind: 'unavailable' }>;
function projectCurrentLandingCardState(
  address: CanonicalCF1WorldAddress,
): LandingCardStateV1 {
  const runtime = f4Runtime;
  if (runtime === null || worldIdentityProtection !== null) {
    return Object.freeze({ kind: 'unavailable' });
  }
  try {
    const loadout = readArc2EngineeringLoadout(runtime.extensions);
    const waveOffs = loadDescentWaveOffAuthorityV1({
      extensions: runtime.extensions,
      legacyWaveOffs: save.waveOffs,
    });
    if (loadout.kind !== 'loaded' || waveOffs.kind !== 'loaded') {
      return Object.freeze({ kind: 'unavailable' });
    }
    const opportunity = projectWorldOpportunity(address);
    const policy = projectDescentApproachV1({
      address,
      opportunity,
      capabilities: loadout.capabilities,
      waveOffs: waveOffs.state,
      stormActive: projectArc0DescentWeatherV1(address, opportunity) !== null,
      trainingActive: trainingActive(),
      alreadyLanded: hasCanonicalWorldLanded(worldIdentityState, address),
    });
    const presentation = projectLandingCardPresentationV1(policy, save.hp);
    return Object.freeze({
      kind: 'ready',
      worldKey: presentation.worldKey,
      label: presentation.label,
      title: presentation.title,
      disclosure: presentation.disclosure,
      successPercent: presentation.successPercent,
      damageMin: presentation.damageMin,
      damageMax: presentation.damageMax,
    });
  } catch {
    return Object.freeze({ kind: 'unavailable' });
  }
}
function landingCardActionHtml(state: LandingCardStateV1): string {
  if (state.kind === 'unavailable') {
    return '<button type="button" data-act="landcta" disabled title="Landing is unavailable until expedition authority is ready" style="background:rgba(202,162,79,0.08);color:var(--dim);border:1px solid rgba(202,162,79,0.35);border-radius:999px;padding:8px 16px;min-height:44px;font:12px system-ui">⛳ Landing unavailable</button>';
  }
  return `<span style="display:flex;flex-direction:column;align-items:flex-start;gap:4px;max-width:100%"><button type="button" data-act="landcta" data-landing-world="${esc(state.worldKey)}" data-landing-success="${state.successPercent}" data-landing-damage-min="${state.damageMin}" data-landing-damage-max="${state.damageMax}" title="${esc(state.title)}" aria-label="${esc(state.label)}" aria-describedby="landing-approach-disclosure" style="background:rgba(202,162,79,0.14);color:#ffd9a0;border:1px solid #caa24f;border-radius:999px;padding:8px 16px;cursor:pointer;min-height:44px;font:12px system-ui">${esc(state.label)}</button><span id="landing-approach-disclosure" data-landing-disclosure style="max-width:32ch;color:var(--text);font:12px/1.4 system-ui">${esc(state.disclosure)}</span></span>`;
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
  cardCtx = {
    p,
    gal: nav.gal,
    star: nav.star,
    planet: resolved.planet,
  };
  const address = activeCardWorldAddress();
  if (address === null) {
    cardCtx = null;
    return false;
  }
  const customName = worldIdentityName(worldIdentityState, address);
  if (customName) {
    d.title = customName;
    d.sub = (d.sub ? d.sub + ' · ' : '') + 'custom name';
  }
  const roster = canonicalRosterForBioscanCard(address, preparedCaptureRoster);
  currentBioscanCardState = projectCurrentBioscanCardState(address, roster);
  let approachEcology: ApproachEcologyPresentation | null = null;
  if (nav.mode === 'system') {
    const model = projectApproachEcologyAudioV1({
      generation: ++approachEcologyGeneration,
      ecologyEpoch: currentEcologyEpoch(),
      roster,
    });
    approachEcology = Object.freeze({ model, roster });
  }
  showSurvey(
    d,
    buildCardActions(p, currentBioscanCardState),
    null,
    orbitalMineralSurveyRows(star, resolved.planet),
    roster,
    approachEcology,
  );
  return true;
}
function startPlanetSurvey(
  p: PlanetNode,
  star: ProvenStar,
  supplied?: ProvenPlanet,
): Promise<boolean> | null {
  if (!presentPlanetSurvey(p, star, supplied)) return null;
  const address = activeCardWorldAddress();
  if (address === null) return null;
  playSurveyPing();   /* the ACT of surveying answers back (main.js) */
  gameEvent('survey', { planetSeed: p.seed });
  try {
    const facts = deriveArc9SurveyFactV1(address);
    if (facts.target === 'world' && facts.living) {
      /* Looking at a living world is deliberately write-free. Its existing
         Survey record now belongs to the explicit Discover Life bioscan. */
      return Promise.resolve(true);
    }
  } catch { return Promise.resolve(false); }
  return settleArc9Survey(address);
}
function surveyPlanet(p: PlanetNode, star: ProvenStar, supplied?: ProvenPlanet): boolean {
  const settlement = startPlanetSurvey(p, star, supplied);
  if (settlement === null) return false;
  void settlement;
  return true;
}
function buildCardActions(p: PlanetNode, bioscanState: BioscanCardStateV1): string {
  const address = activeCardWorldAddress();
  const charted = address !== null && atlasEntryForWorld(address) !== null;
  const landingState = address === null
    ? Object.freeze({ kind: 'unavailable' as const })
    : projectCurrentLandingCardState(address);
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
      : landingCardActionHtml(landingState)) +
    (charted && !trainingAdd
      ? '<span style="color:var(--dim);align-self:center;font-size:12px">★ charted</span>'
      : '<button data-act="add" style="background:#14233c;color:#cfe0f4;border:1px solid #2a3c5e;border-radius:9px;padding:8px 14px;cursor:pointer;min-height:44px;font:12px system-ui">' +
        (charted ? '★ Confirm in Star Atlas' : '+ Add to Star Atlas') + '</button>') +
    bioscanCardActionHtml(bioscanState) +
    '<button data-act="share" style="background:#14233c;color:#cfe0f4;border:1px solid #2a3c5e;border-radius:9px;padding:8px 14px;cursor:pointer;min-height:44px;font:12px system-ui">⧉ share code</button>' +
    '</div>';
}
function refreshPlanetSurveyCard(): boolean {
  const context = cardCtx;
  if (context === null || lastCard === null || card.style.display === 'none') return false;
  return presentPlanetSurvey(context.p, context.star, context.planet);
}
async function surveyAndLand(p: PlanetNode, star: ProvenStar): Promise<boolean> {
  /* The API's one-call path can follow a synchronous route change whose
     ordinary checkpoint is still settling. The tested handoff drains that
     barrier, then Survey's replacement barrier, and requires that exact
     Survey settlement before Landing without retrying either product action. */
  return runSurveyLandHandoffV1({
    waitForCurrentBarrier: waitForActivePersist,
    startSurvey: () => startPlanetSurvey(p, star),
    land: doLand,
  });
}
async function routeTrainingForSmoke(selector: unknown): Promise<boolean> {
  /* A restored Training checkpoint intentionally rejects Arc 9 Survey writes.
     This diagnostic-only route proves the current-system target, presents its
     write-free card, then immediately delegates to doLand's rechecked
     training-route-only owner. Keep this sequence synchronous: no product
     settlement or persistence may occur between presentation and Landing. */
  if (!trainingCheckpointWriteHeld || !trainingActive() || nav.mode !== 'system'
    || playerMutationsBlocked() || !selector || typeof selector !== 'object'
    || Array.isArray(selector)) return false;
  const value = selector as Record<string, unknown>;
  if (!Number.isInteger(value.seed) || !Number.isInteger(value.ordinal)) return false;
  const p = systemScene(nav.star.seed).planets.find((candidate) =>
    candidate.seed === value.seed && candidate.ordinal === value.ordinal);
  if (!p || !presentPlanetSurvey(p, nav.star)) return false;
  return doLand();
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
function canonicalWorldAddressForNav(state: NavState): CanonicalCF1WorldAddress | null {
  if (state.mode !== 'surface') return null;
  const resolved = canonicalCF1WorldAddressFromNav(state);
  return resolved.ok ? resolved.address : null;
}
function atlasRouteIdentityMatches(id: string, state: NavState): boolean {
  if (!id.startsWith(CF1_WORLD_ATLAS_ID_PREFIX)) return true;
  const idAddress = resolveCF1WorldAtlasId(id);
  const routeAddress = canonicalWorldAddressForNav(state);
  return idAddress.ok && routeAddress !== null
    && idAddress.address.key === routeAddress.key;
}
function activeCardWorldAddress(): CanonicalCF1WorldAddress | null {
  const state = activeCardPlanetState();
  return state === null ? null : canonicalWorldAddressForNav(state);
}
function atlasEntryForWorld(
  address: CanonicalCF1WorldAddress,
): readonly [string, Record<string, unknown>] | null {
  for (const row of save.logMap) {
    const route = atlasRouteStates.get(row[1]);
    const candidate = route === undefined ? null : canonicalWorldAddressForNav(route);
    if (candidate?.key === address.key) return row;
  }
  return null;
}
function cardShareCode(): string | null {
  const where = activeCardPlanetWhere();
  const address = activeCardWorldAddress();
  /* A stale planet card must never silently encode the current system. The
     visible card and copied address are one atomic context. */
  return where && address
    ? encodeWhere(where as never, worldIdentityName(worldIdentityState, address) ?? undefined) as string
    : null;
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

async function copyCombatChronicleLog(shareText: string): Promise<boolean> {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
    await navigator.clipboard.writeText(shareText);
    toast('⚔ Battle log copied', 'Your completed Combat Chronicle is ready to share.', true);
    return true;
  } catch {
    const prior = combatChronicleMount.querySelector<HTMLTextAreaElement>(
      '[data-combat-share-fallback]',
    );
    combatChronicleMount.querySelector('[data-combat-share-fallback-label]')?.remove();
    prior?.remove();
    const label = document.createElement('label');
    label.dataset.combatShareFallbackLabel = 'true';
    label.htmlFor = 'combat-share-fallback';
    label.textContent = 'Battle log text';
    const fallback = document.createElement('textarea');
    fallback.id = 'combat-share-fallback';
    fallback.dataset.combatShareFallback = 'true';
    fallback.readOnly = true;
    fallback.rows = 8;
    fallback.value = shareText;
    combatChronicleMount.append(label, fallback);
    fallback.focus();
    fallback.select();
    toast('Copy unavailable', 'The exact battle log is selected in the Chronicle. Use your browser’s Copy command.', true);
    return false;
  }
}

/** The mature action counts preparation/presentation of a valid world code,
 * not success of either clipboard API. Durability therefore settles first;
 * the existing copy/fallback presenter runs afterward and its boolean cannot
 * change the committed counter or achievement. */
async function commitArc9ShareSend(code: string): Promise<boolean> {
  const runtime = f4Runtime;
  if (!f4RuntimeMayMutate(runtime) || activePersist || importWriteInFlight
    || replacementTransaction || replacementReloadPending || trainingCheckpointWriteHeld
    || trainingActive() || ecologyEpochBlocksActions()) {
    lastArc9ShareSendOutcome = 'unavailable:write-authority';
    return false;
  }
  const actionClaim = productActionCoordinator.tryClaim(ARC9_SHARE_SEND_OPERATION_V1);
  if (actionClaim === null) {
    lastArc9ShareSendOutcome = 'unavailable:product-action-pending';
    return false;
  }
  const actionBarrier = actionClaim.barrier;
  const priorStats = save.stats;
  const priorUnlocked = save.unlocked;
  productActionInFlight = true;
  activePersist = actionBarrier;
  let durable = false;
  let outcome: Arc9SharingActionOutcomeV1 | null = null;
  try {
    await smokeProductActionHold.holdIfArmed(actionClaim.operation);
    await settleF4Heartbeat();
    if (!f4RuntimeMayMutate(runtime) || importWriteInFlight
      || replacementTransaction || replacementReloadPending || trainingCheckpointWriteHeld
      || trainingActive() || ecologyEpochBlocksActions()) {
      lastArc9ShareSendOutcome = 'refused:authority-changed';
      return false;
    }
    outcome = await commitArc9SharingActionV1({
      runtime,
      state: save,
      actionKind: 'send',
      code,
      acceptedSavedView: null,
      codecNow: Date.now(),
    });
    if (outcome.kind === 'refused') {
      lastArc9ShareSendOutcome = `refused:${outcome.detail}`;
      if (outcome.convergence === 'read-only-reload') {
        scheduleF4AuthorityConvergenceReload(
          runtime,
          `Arc 9 CF1 Share authority ${outcome.detail}`,
        );
      } else {
        toast('Share unavailable', 'This world code could not be recorded safely. Nothing was copied.');
      }
      return false;
    }

    durable = true;
    f4LastCheckpointAt = performance.now();
    if (outcome.kind === 'committed-convergence') {
      lastArc9ShareSendOutcome = `committed-convergence:${outcome.detail}`;
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Arc 9 CF1 Share committed; ${outcome.detail}`,
      );
      return true;
    }
    try {
      const checkpoint = runtime.checkpointParent();
      if (runtime !== f4Runtime
        || runtime.revision !== outcome.transaction.revision
        || checkpoint === null
        || checkpoint.stats.shares !== outcome.counterAfter
        || JSON.stringify(checkpoint.unlocked) !== JSON.stringify(outcome.nextUnlockedIds)) {
        throw new Error('CF1 Share runtime did not retain its exact durable checkpoint');
      }
      publishArc9SharingFieldsV1(save, outcome);
      lastPersistenceOutcome = `arc9-share-send-committed:${outcome.transaction.revision}`;
      lastArc9ShareSendOutcome = `committed:${outcome.counterBefore}->${outcome.counterAfter}`;
      updateChips();
      if (openPanelId() === 'rec') fillRecords();
      void copyShareCode(code);
      presentProgressionCeremony({
        revision: outcome.transaction.revision,
        disposition: 'committed-publication',
        priorUnlockedIds: outcome.priorUnlockedIds,
        nextUnlockedIds: outcome.nextUnlockedIds,
        addedAchievementIds: outcome.achievementAdded ? [outcome.achievementId] : [],
        priorBestRankIndex: priorStats.bestRank ?? 0,
        nextBestRankIndex: outcome.transaction.state.stats.bestRank ?? 0,
      });
      return true;
    } catch (error) {
      save.stats = priorStats;
      save.unlocked = priorUnlocked;
      lastArc9ShareSendOutcome = 'committed-publication-reload';
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Arc 9 CF1 Share committed; publication ${error instanceof Error ? error.message : String(error)}`,
      );
      return true;
    }
  } catch (error) {
    lastArc9ShareSendOutcome = `${durable ? 'committed-' : ''}fault`;
    if (durable) {
      save.stats = priorStats;
      save.unlocked = priorUnlocked;
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Arc 9 CF1 Share committed; presentation ${error instanceof Error ? error.message : String(error)}`,
      );
      return true;
    }
    return false;
  } finally {
    productActionInFlight = false;
    actionClaim.settle(durable);
    if (durable) queueArc9ProgressionRefresh(actionClaim.operation);
    if (activePersist === actionBarrier) activePersist = null;
  }
}
let lastArc0LandingOutcome: string | null = null;
function publishArc0LandingFields(
  committed: SaveStateV2,
  facts: Arc0LandingWitnessFacts,
): void {
  save.waveOffs = committed.waveOffs.map(([seed, count]) => [seed, count]);
  if (facts.descent.kind === 'wave-off') {
    save.hp = committed.hp;
    return;
  }
  save.savedView = structuredClone(committed.savedView);
  if (facts.permanentLanding) {
    save.landed = committed.landed.slice();
    save.ascCh = committed.ascCh;
    save.ascProg = { ...committed.ascProg };
  }
  if (facts.starterCharters.changed) {
    save.chacc = committed.chacc.slice();
    save.chDone = committed.chDone.slice();
    save.chProg = { ...committed.chProg };
    save.items = committed.items.map(([baseId, count]) => [baseId, count]);
    save.equip = { ...committed.equip };
    save.equipAff = Object.fromEntries(Object.entries(committed.equipAff).map(([slot, affix]) => [
      slot, { ...affix },
    ]));
  }
  if (facts.achievement !== null || facts.starterCharters.changed) {
    save.unlocked = committed.unlocked.slice();
  }
  if (facts.sample?.kind === 'reward' || facts.starterCharters.changed) {
    save.cargo = committed.cargo.map(([materialId, count]) => [materialId, count]);
    save.essence = committed.essence;
    save.stats = { ...committed.stats };
  }
}
async function doLand(): Promise<boolean> {
  if (blockPlayerMutation('land')) {
    lastArc0LandingOutcome = 'blocked:read-only';
    return false;
  }
  if (!cardCtx || nav.mode !== 'system') {
    lastArc0LandingOutcome = 'rejected:route-or-card-unavailable';
    return false;
  }
  const surface = activeCardPlanetState();
  if (!surface) {
    lastArc0LandingOutcome = 'rejected:surface-unavailable';
    return false;
  }
  const address = canonicalWorldAddressForNav(surface);
  if (address === null) {
    lastArc0LandingOutcome = 'rejected:world-address-unproven';
    return false;
  }
  const p = cardCtx.p;
  const training = trainingActive();

  /* A restored Training checkpoint deliberately holds all ordinary writes.
     Its practice route remains live-only and is settled by the existing
     Finish/Skip replacement transaction; no product field may hitchhike. */
  if (trainingCheckpointWriteHeld) {
    if (!training) {
      lastArc0LandingOutcome = 'training-write-held';
      return false;
    }
    nav = surface;
    savedRouteWriteHeld = false;
    playWhoosh();
    buildCurrentSceneTransaction(); triggerCameraShake(); hudText();
    refreshPlanetSurveyCard();
    if (p.seed === 133 && trainingStepId() === 'land') {
      gameEvent('landfall', { planetSeed: p.seed });
    }
    lastArc0LandingOutcome = 'training-route-only';
    return true;
  }

  const runtime = f4Runtime;
  if (!f4RuntimeMayMutate(runtime) || activePersist || importWriteInFlight
    || replacementTransaction || replacementReloadPending) {
    lastArc0LandingOutcome = !f4RuntimeMayMutate(runtime)
      ? 'rejected:write-authority-unavailable'
      : activePersist
        ? 'rejected:action-settlement-pending'
        : importWriteInFlight
          ? 'rejected:import-pending'
          : replacementTransaction
            ? 'rejected:replacement-pending'
            : 'rejected:replacement-reload-pending';
    return false;
  }
  let opportunity: ReturnType<typeof projectWorldOpportunity>;
  try { opportunity = projectWorldOpportunity(address); }
  catch {
    lastArc0LandingOutcome = 'opportunity-unavailable';
    return false;
  }
  const operation = operationForArc0Landing(address);
  const actionClaim = productActionCoordinator.tryClaim(operation);
  if (actionClaim === null) {
    lastArc0LandingOutcome = 'rejected:action-coordinator-busy';
    return false;
  }
  const actionBarrier = actionClaim.barrier;
  const priorLandingPublication = Object.freeze({
    hp: save.hp,
    waveOffs: save.waveOffs,
    savedView: save.savedView,
    landed: save.landed,
    ascCh: save.ascCh,
    ascProg: save.ascProg,
    chacc: save.chacc,
    chDone: save.chDone,
    chProg: save.chProg,
    cargo: save.cargo,
    essence: save.essence,
    stats: save.stats,
    items: save.items,
    equip: save.equip,
    equipAff: save.equipAff,
    unlocked: save.unlocked,
    arc2LootState,
    worldIdentityState,
    worldIdentityProtection,
    nav,
    savedRouteWriteHeld,
    starterStatus: lastStarterCharterAcceptStatus,
  });
  const restoreLandingPublication = (): void => {
    save.hp = priorLandingPublication.hp;
    save.waveOffs = priorLandingPublication.waveOffs;
    save.savedView = priorLandingPublication.savedView;
    save.landed = priorLandingPublication.landed;
    save.ascCh = priorLandingPublication.ascCh;
    save.ascProg = priorLandingPublication.ascProg;
    save.chacc = priorLandingPublication.chacc;
    save.chDone = priorLandingPublication.chDone;
    save.chProg = priorLandingPublication.chProg;
    save.cargo = priorLandingPublication.cargo;
    save.essence = priorLandingPublication.essence;
    save.stats = priorLandingPublication.stats;
    save.items = priorLandingPublication.items;
    save.equip = priorLandingPublication.equip;
    save.equipAff = priorLandingPublication.equipAff;
    save.unlocked = priorLandingPublication.unlocked;
    arc2LootState = priorLandingPublication.arc2LootState;
    worldIdentityState = priorLandingPublication.worldIdentityState;
    worldIdentityProtection = priorLandingPublication.worldIdentityProtection;
    nav = priorLandingPublication.nav;
    savedRouteWriteHeld = priorLandingPublication.savedRouteWriteHeld;
    lastStarterCharterAcceptStatus = priorLandingPublication.starterStatus;
    try { inventoryPanelController.setState(arc2LootState); }
    catch { /* the replacement document owns recovery */ }
  };
  productActionInFlight = true;
  activePersist = actionBarrier;
  let durable = false;
  let durableResult: 'landed' | 'wave-off' | 'unknown' = 'unknown';
  try {
    await smokeProductActionHold.holdIfArmed(actionClaim.operation);
    await settleF4Heartbeat();
    if (!f4RuntimeMayMutate(runtime) || importWriteInFlight
      || replacementTransaction || replacementReloadPending || trainingCheckpointWriteHeld) {
      lastArc0LandingOutcome = 'write-authority-changed';
      return false;
    }
    const priorUnlocked = save.unlocked;
    const priorBestRank = save.stats.bestRank ?? 0;
    const faultInjection = !__CF_EVIDENCE_BUILD__ ? null : smokeRejectNextArc0LandingStorage
      ? 'storage-failure'
      : smokeStaleNextArc0LandingAuthority
        ? 'stale-authority'
        : null;
    if (faultInjection === 'storage-failure') smokeRejectNextArc0LandingStorage = false;
    else if (faultInjection === 'stale-authority') smokeStaleNextArc0LandingAuthority = false;
    const faultBeforeRevision = runtime.revision;
    let injectedRevision: number | null = null;
    if (faultInjection !== null) {
      lastSmokeArc0LandingFaultWitness = Object.freeze({
        schema: 'cf-v2-arc0-landing-fault-witness/v1',
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
        lastSmokeArc0LandingFaultWitness = Object.freeze({
          schema: 'cf-v2-arc0-landing-fault-witness/v1',
          operation: actionClaim.operation,
          injection: faultInjection,
          phase: 'injection-failed',
          beforeRevision: faultBeforeRevision,
          injectedRevision: null,
          outcome: injected.kind,
        });
        throw new Error(`slice-smoke Arc 0 landing stale injection became ${injected.kind}`);
      }
      injectedRevision = injected.revision;
    }
    let attempt: Awaited<ReturnType<typeof commitArc0LandingAction>>;
    if (faultInjection === 'storage-failure') smokeRejectArc0LandingStorageBoundary = true;
    try {
      attempt = await commitArc0LandingAction({
        runtime,
        state: save,
        surface,
        address,
        opportunity,
        training,
        codecNow: Date.now(),
      });
    } finally {
      if (faultInjection === 'storage-failure') smokeRejectArc0LandingStorageBoundary = false;
    }
    if (faultInjection !== null) {
      lastSmokeArc0LandingFaultWitness = Object.freeze({
        schema: 'cf-v2-arc0-landing-fault-witness/v1',
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
    lastArc0LandingOutcome = `${attempt.kind}:${'detail' in attempt ? attempt.detail : attempt.transaction.revision}`;
    if (attempt.kind === 'refused') {
      if (attempt.convergence === 'read-only-reload') {
        scheduleF4AuthorityConvergenceReload(runtime, `Arc 0 landing ${attempt.detail}`);
      } else if (attempt.detail === 'world-identity:capacity') {
        toast('World record full', 'Landing was not applied; your current expedition remains unchanged.', true);
      } else if (attempt.detail.startsWith('field-sample:')) {
        toast('Landing reward full', 'Landing was not applied because its field samples cannot fit safely.', true);
      } else if (attempt.detail.startsWith('achievement:')) {
        toast('Records protected', 'Landing was not applied because its achievement record cannot be extended safely.', true);
      }
      return false;
    }

    durable = true;
    durableResult = attempt.kind === 'committed'
      ? attempt.witness.facts.descent.kind : attempt.result;
    f4LastCheckpointAt = performance.now();
    lastPersistenceOutcome = `arc0-land-committed:${attempt.transaction.revision}`;
    if (attempt.kind === 'committed-convergence') {
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Arc 0 landing committed at revision ${attempt.transaction.revision}; ${attempt.detail}`,
      );
      return attempt.result === 'landed';
    }

    try {
      if (__CF_EVIDENCE_BUILD__ && smokeRejectNextArc0LandingPublication) {
        smokeRejectNextArc0LandingPublication = false;
        lastSmokeArc0LandingFaultWitness = Object.freeze({
          schema: 'cf-v2-arc0-landing-fault-witness/v1',
          operation: actionClaim.operation,
          injection: 'publication-failure',
          phase: 'settled',
          beforeRevision: faultBeforeRevision,
          injectedRevision: attempt.transaction.revision,
          outcome: 'committed-publication-reload',
        });
        throw new Error('slice-smoke injected Arc 0 landing publication rejection');
      }
      const checkpoint = runtime.checkpointParent();
      if (runtime !== f4Runtime
        || runtime.revision !== attempt.transaction.revision
        || checkpoint === null
        || JSON.stringify(checkpoint) !== JSON.stringify(attempt.transaction.state)) {
        throw new Error('Arc 0 landing runtime did not retain its exact durable checkpoint');
      }
      const facts = attempt.witness.facts;
      let committedLandingLootState = arc2LootState;
      if (facts.descent.kind === 'landed') {
        const loaded = readArc2Loot(runtime.extensions);
        if (loaded.kind !== 'loaded'
          || loaded.state.kind !== 'inventory'
          || attempt.arc2LootState === null
          || JSON.stringify(encodeArc2LootCarrier(loaded.state))
            !== JSON.stringify(encodeArc2LootCarrier(attempt.arc2LootState))
          || !arc2LootLegacyMirrorMatches(loaded.state, attempt.transaction.state)) {
          throw new Error('Arc 0 landing Arc 2 carrier did not retain its exact durable fixed point');
        }
        committedLandingLootState = loaded.state;
      }
      publishArc0LandingFields(attempt.transaction.state, facts);
      if (facts.descent.kind === 'wave-off') {
        const learnedChance = Math.min(100, facts.descent.policy.successPercent + 20);
        toast(
          '⚠ Descent wave-off',
          `Approach aborted safely — ${facts.descent.damage} damage, ${facts.descent.hpAfter} HP remains. Exact-world approach data raises the next attempt to ${learnedChance}%.`,
          true,
        );
        triggerCameraShake();
        hudText();
        updateChips();
        refreshPlanetSurveyCard();
        return false;
      }
      if (facts.starterCharters.changed) {
        arc2LootState = committedLandingLootState;
        inventoryPanelController.setState(arc2LootState);
        if (facts.starterCharters.completions.length > 0) {
          const titles = facts.starterCharters.completions.map(({ title }) => title).join(', ');
          const rewards = facts.starterCharters.completions.map((completion) =>
            `+${completion.stardust} Stardust`
            + (completion.gearId === null ? '' : ` + ${completion.gearId} starter gear`)).join(' · ');
          lastStarterCharterAcceptStatus = `Completed ${titles}. Reward: ${rewards}.`;
        } else if (facts.starterCharters.progressIds.length > 0) {
          lastStarterCharterAcceptStatus = 'Starter Charter progress was durably recorded on this landfall.';
        }
      }
      worldIdentityState = attempt.verification.worldIdentity.state;
      worldIdentityProtection = null;
      nav = surface;
      savedRouteWriteHeld = false;

      if (facts.sample?.kind === 'reward') {
        const samples = facts.sample.materials.map(({ id, quantity }) => `${quantity}× ${id}`).join(' · ');
        toast(
          '⛳ Ground Survey',
          `Boots on the ground — field samples: ${samples} · +${facts.sample.stardust} Stardust. This world’s census and veins are yours to read.`,
          true,
        );
      }
      if (facts.charter.ascChBefore !== null && facts.charter.ascChAfter !== null
        && facts.charter.ascChAfter !== facts.charter.ascChBefore) {
        const reconciliation = reconcileV2Chapters(
          facts.charter.ascChBefore,
          { ...attempt.transaction.state.ascProg },
          facts.charter.stage ?? undefined,
        );
        const completed = reconciliation?.completed ?? [];
        const first = completed[0];
        const last = completed[completed.length - 1];
        toastCharterCompletion(completed.length === 1
          ? '★ ' + (first?.name || 'Charter chapter') + ' — complete'
          : `★ ${completed.length} Charter chapters — complete`,
        completed.length === 1
          ? (first?.note || 'This expedition’s established reach remains preserved.')
          : `${first?.name || 'The first chapter'} through ${last?.name || 'the final chapter'} are now recorded. This expedition’s established reach remains preserved.`);
      }

      if (facts.starterCharters.completions.length > 0) {
        const titles = facts.starterCharters.completions.map(({ title }) => title).join(', ');
        const rewards = facts.starterCharters.completions.map((completion) =>
          `+${completion.stardust} Stardust`
          + (completion.gearId === null ? '' : ` + ${completion.gearId} starter gear`)).join(' · ');
        toastCharterCompletion(
          facts.starterCharters.completions.length === 1
            ? `★ ${titles} — Starter Charter complete`
            : `★ ${facts.starterCharters.completions.length} Starter Charters — complete`,
          `${titles} · Reward: ${rewards}.`,
        );
      }

      if (openPanelId() === 'ch') fillCharters();
      if (openPanelId() === 'rec') fillRecords();
      if (openPanelId() === 'shipyard') refreshEngineeringPanelState();
      playWhoosh();
      buildCurrentSceneTransaction(); triggerCameraShake(); hudText(); updateChips();
      refreshPlanetSurveyCard();
      if ((facts.permanentLanding && facts.landing === 'first')
        || (p.seed === 133 && training && trainingStepId() === 'land')) {
        gameEvent('landfall', { planetSeed: p.seed });
      }
      const landingAchievementIds = [...new Set([
        ...facts.starterCharters.addedAchievementIds,
        ...(facts.achievement?.added ? [facts.achievement.id] : []),
      ])];
      presentProgressionCeremony({
        revision: attempt.transaction.revision,
        disposition: training ? 'training-sandbox' : 'committed-publication',
        priorUnlockedIds: priorUnlocked,
        nextUnlockedIds: attempt.transaction.state.unlocked,
        addedAchievementIds: landingAchievementIds,
        priorBestRankIndex: priorBestRank,
        nextBestRankIndex: attempt.transaction.state.stats.bestRank ?? 0,
      });
      return true;
    } catch (error) {
      restoreLandingPublication();
      const detail = error instanceof Error ? error.message : String(error);
      worldIdentityProtection = 'committed-publication-reload';
      lastArc0LandingOutcome = 'committed-publication-reload';
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Arc 0 landing committed at revision ${attempt.transaction.revision}; publication ${detail}`,
      );
      return durableResult === 'landed';
    }
  } catch (error) {
    if (durable) restoreLandingPublication();
    lastArc0LandingOutcome = durable
      ? 'committed-publication-reload'
      : `rejected:${error instanceof Error ? error.message : String(error)}`;
    scheduleF4AuthorityConvergenceReload(runtime, `Arc 0 landing ${lastArc0LandingOutcome}`);
    return durable && durableResult === 'landed';
  } finally {
    productActionInFlight = false;
    actionClaim.settle(durable);
    if (durable && durableResult === 'landed') {
      queueArc9ProgressionRefresh(actionClaim.operation);
    }
    if (activePersist === actionBarrier) activePersist = null;
  }
}
let lastArc0AtlasOutcome: string | null = null;
function publishArc0AtlasFields(
  committed: SaveStateV2,
  facts: Arc0AtlasWitnessFacts,
  surface: Extract<NavState, { mode: 'surface' }>,
): void {
  /* F4 returns detached row objects, so rebuild the WeakMap sidecar against
     those exact published objects. Unchanged legacy rows retain only routes
     that were already source-proven; the new canonical row receives the
     exact registered surface used by the transaction. */
  const priorRoutes = new Map<string, NavState>();
  for (const [id, entry] of save.logMap) {
    const route = atlasRouteStates.get(entry);
    if (route !== undefined) priorRoutes.set(id, route);
  }
  const nextRoutes = new WeakMap<Record<string, unknown>, NavState>();
  const nextRows: SaveStateV2['logMap'] = committed.logMap.map(([id, committedEntry]) => {
    const entry = structuredClone(committedEntry) as Record<string, unknown>;
    const route = id === facts.atlas.id ? surface : priorRoutes.get(id);
    if (route !== undefined && atlasRouteIdentityMatches(id, route)) {
      nextRoutes.set(entry, route);
    }
    return [id, entry];
  });
  save.logMap = nextRows;
  save.homeId = committed.homeId;
  atlasRouteStates = nextRoutes;
}
function rebindArc0AtlasObservedRoute(
  observation: Arc0AtlasAlreadyDurableObservation,
  surface: Extract<NavState, { mode: 'surface' }>,
): boolean {
  const address = canonicalWorldAddressForNav(surface);
  if (observation.scope !== 'exact-detached-f4-parent'
    || !observation.identityRecordPresent
    || address === null
    || observation.worldKey !== address.key
    || observation.atlasId !== canonicalCF1WorldAtlasId(address)
    || !atlasRouteIdentityMatches(observation.atlasId, surface)) return false;
  const row = save.logMap.find(([id]) => id === observation.atlasId);
  if (row === undefined) return false;
  atlasRouteStates.set(row[1], surface);
  return true;
}
async function addToAtlas(): Promise<boolean> {
  if (blockPlayerMutation('atlas-add')) return false;
  if (!cardCtx || !save) return false;
  const surface = activeCardPlanetState();
  const address = surface === null ? null : canonicalWorldAddressForNav(surface);
  if (surface === null || address === null) return false;
  const p = cardCtx.p;

  /* A restored Training checkpoint owns its whole eventual replacement.
     Preserve the lesson's live route/event contract without allowing Atlas
     or identity product fields to hitchhike into an ordinary checkpoint. */
  if (trainingCheckpointWriteHeld) {
    if (!trainingActive()) {
      lastArc0AtlasOutcome = 'training-write-held';
      return false;
    }
    gameEvent('atlas-add', { id: 'p' + p.seed });
    refreshPlanetSurveyCard();
    lastArc0AtlasOutcome = 'training-route-only';
    return true;
  }

  const runtime = f4Runtime;
  if (!f4RuntimeMayMutate(runtime) || activePersist || importWriteInFlight
    || replacementTransaction || replacementReloadPending) return false;
  const title = cleanName(
    worldIdentityName(worldIdentityState, address)
      || card.querySelector('[data-sel=title]')?.textContent || p.name,
    60,
  );
  const sub = cleanName(card.querySelector('[data-sel=sub]')?.textContent || '', 120);
  if (!title) {
    lastArc0AtlasOutcome = 'input-title-empty';
    return false;
  }
  const operation = operationForArc0Atlas(address);
  const actionClaim = productActionCoordinator.tryClaim(operation);
  if (actionClaim === null) return false;
  clearArc9AtlasUndo();
  const actionBarrier = actionClaim.barrier;
  productActionInFlight = true;
  activePersist = actionBarrier;
  let durable = false;
  try {
    await smokeProductActionHold.holdIfArmed(actionClaim.operation);
    await settleF4Heartbeat();
    if (!f4RuntimeMayMutate(runtime) || importWriteInFlight
      || replacementTransaction || replacementReloadPending || trainingCheckpointWriteHeld) {
      lastArc0AtlasOutcome = 'write-authority-changed';
      return false;
    }
    const attempt = await commitArc0AtlasAction({
      runtime,
      state: save,
      surface,
      address,
      title,
      sub,
      displayTimestamp: Date.now(),
      codecNow: Date.now(),
    });
    lastArc0AtlasOutcome = `${attempt.kind}:${'detail' in attempt
      ? attempt.detail : 'transaction' in attempt ? attempt.transaction.kind : 'observed'}`;
    if (attempt.kind === 'refused') {
      if (attempt.convergence === 'read-only-reload') {
        scheduleF4AuthorityConvergenceReload(runtime, `Arc 0 Atlas ${attempt.detail}`);
      } else if (attempt.detail === 'world-identity:capacity') {
        toast('World record full', 'Atlas entry was not applied; your current expedition remains unchanged.', true);
      } else if (attempt.detail === 'atlas:capacity' || attempt.detail === 'atlas:collision'
        || attempt.detail === 'atlas:source-invalid') {
        toast('Atlas record protected', 'This chart was not applied because its saved Atlas record could not be updated safely.', true);
      }
      return false;
    }
    if (attempt.kind === 'already-durable') {
      if (!rebindArc0AtlasObservedRoute(attempt.observation, surface)) {
        lastArc0AtlasOutcome = 'already-durable-route-reload';
        scheduleF4AuthorityConvergenceReload(
          runtime,
          'Arc 0 Atlas row is durable but its exact route sidecar could not be rebound',
        );
        return true;
      }
      lastArc0AtlasOutcome = 'already-durable-route-rebound';
      gameEvent('atlas-add', { id: 'p' + p.seed });
      refreshPlanetSurveyCard();
      if (openPanelId() === 'atlas') fillAtlas();
      return true;
    }

    durable = true;
    f4LastCheckpointAt = performance.now();
    lastPersistenceOutcome = `arc0-atlas-committed:${attempt.transaction.revision}`;
    if (attempt.kind === 'committed-convergence') {
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Arc 0 Atlas committed at revision ${attempt.transaction.revision}; ${attempt.detail}`,
      );
      return true;
    }

    try {
      const facts = attempt.witness.facts;
      publishArc0AtlasFields(attempt.transaction.state, facts, surface);
      worldIdentityState = attempt.verification.worldIdentity.state;
      worldIdentityProtection = null;
      if (facts.atlas.status === 'added') {
        toast('★ Charted', facts.atlas.title + ' joined your Star Atlas.');
      }
      /* Training's legacy lesson contract observes the seed mirror, while
         the durable row is keyed by complete canonical world identity. */
      gameEvent('atlas-add', { id: 'p' + p.seed });
      refreshPlanetSurveyCard();
      if (openPanelId() === 'atlas') fillAtlas();
      return true;
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      worldIdentityProtection = 'committed-publication-reload';
      lastArc0AtlasOutcome = 'committed-publication-reload';
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Arc 0 Atlas committed at revision ${attempt.transaction.revision}; publication ${detail}`,
      );
      return true;
    }
  } catch (error) {
    lastArc0AtlasOutcome = durable
      ? 'committed-publication-reload'
      : `rejected:${error instanceof Error ? error.message : String(error)}`;
    scheduleF4AuthorityConvergenceReload(runtime, `Arc 0 Atlas ${lastArc0AtlasOutcome}`);
    return durable;
  } finally {
    productActionInFlight = false;
    actionClaim.settle(durable);
    if (durable) queueArc9ProgressionRefresh(actionClaim.operation);
    if (activePersist === actionBarrier) activePersist = null;
  }
}
card.addEventListener('click', async (e) => {
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
    if (blockRouteChangeWhileProductAction()) return;
    cardTravelAction = null;
    (act as HTMLButtonElement).disabled = true;
    action.run();
    if (keyboard) app.canvas.focus();
  } else if (a === 'landcta') {
    const landed = await doLand();
    if (landed && keyboard) card.querySelector<HTMLElement>('[data-act="leaveworld"]')?.focus();
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
    const charted = await addToAtlas();
    if (charted && keyboard) (card.querySelector<HTMLElement>('[data-act="add"]') || surveyDockEl).focus();
  }
  else if (a === 'bioscan') {
    const recorded = await runArc9Bioscan();
    if (recorded && keyboard) {
      (card.querySelector<HTMLElement>('[data-act="bioscan"]')
        || card.querySelector<HTMLElement>('[data-act="landcta"], [data-act="leaveworld"]')
        || surveyDockEl).focus();
    }
  }
  else if (a === 'share') {
    const code = cardShareCode();
    if (code) await commitArc9ShareSend(code);
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
let planetsideAudioRoster: CanonicalWorldRoster | null = null;
let planetsideEcologyCounterpart: Readonly<{
  readonly playback: CurrentWorldDistantEcologyPlaybackV1;
  readonly text: string;
}> | null = null;
const planetsideBindings = new SpeciesThumbLeaseGroup(8);
let planetsideStaleCompletionDrops = 0;
function releasePlanetsideThumbs(): void {
  planetsideBindings.clear();
}
function releasePlanetsideEcology(reason: string): void {
  planetsideEcologyCounterpart = null;
  tameGreetingAudioOwner?.cancelDistantEcology(reason);
  const status = sideEl.querySelector<HTMLElement>('[data-arc7-ecology-status]');
  if (status) {
    status.hidden = true;
    status.textContent = '';
    delete status.dataset.worldKey;
    delete status.dataset.generation;
  }
}
function currentPlanetsideEcologyVisualReceipt(): CurrentWorldEcologyVisualReceiptV1 | null {
  const roster = planetsideAudioRoster;
  const heading = sideEl.querySelector<HTMLElement>('[data-arc7-ecology-heading]');
  const listen = sideEl.querySelector<HTMLButtonElement>('[data-arc7-ecology-listen]');
  if (roster === null || roster.biosphereKey === 'none' || planetsideGeneration < 1
    || nav.mode !== 'surface' || getProvenPlanetKey(nav.planet) !== roster.worldKey
    || openPanelId() !== null
    || planetsideWorldKey !== roster.worldKey
    || sideEl.dataset.rosterState !== 'ready'
    || sideEl.dataset.fullRosterFingerprint !== roster.fullRosterFingerprint
    || sideEl.dataset.ecologyEpoch !== String(roster.ecologyEpoch)
    || sideEl.style.display !== 'block' || getComputedStyle(sideEl).display === 'none'
    || sideEl.closest('[hidden],[inert]') !== null
    || heading?.textContent !== 'PLANETSIDE — Biosphere'
    || !heading.isConnected || listen === null || !listen.isConnected || listen.disabled) return null;
  return Object.freeze({
    generation: planetsideGeneration,
    worldKey: roster.worldKey,
    environmentFingerprint: roster.environmentFingerprint,
    biosphereKey: roster.biosphereKey,
    granularity: 'biosphere',
    visible: true,
  });
}
function planetsideEcologyCounterpartIsCurrent(
  receipt: AudioCounterpartReceipt,
): boolean {
  const registered = planetsideEcologyCounterpart;
  const status = sideEl.querySelector<HTMLElement>('[data-arc7-ecology-status]');
  const visual = currentPlanetsideEcologyVisualReceipt();
  return registered !== null && isCurrentWorldDistantEcologyPlaybackV1(registered.playback)
    && receipt.counterpartKey === registered.playback.counterpart.counterpartKey
    && receipt.eventKey === registered.playback.counterpart.eventKey
    && receipt.generation === registered.playback.counterpart.generation
    && registered.playback.plan.granularity === 'biosphere'
    && registered.playback.plan.kingdom === null
    && registered.playback.plan.familyKey === null
    && registered.playback.plan.identityKey === null
    && registered.playback.plan.route === 'ambience'
    && visual !== null
    && visual.generation === registered.playback.generation
    && visual.worldKey === registered.playback.worldKey
    && status !== null && status.isConnected && !status.hidden
    && status.closest('[hidden],[inert]') === null
    && status.matches('[role="status"][aria-live="polite"][aria-atomic="true"]')
    && status.dataset.worldKey === registered.playback.worldKey
    && status.dataset.generation === String(registered.playback.generation)
    && status.textContent === registered.text;
}
function clearPlanetside(): void {
  releasePlanetsideEcology('planetside-cleared');
  planetsideGeneration++;
  releasePlanetsideThumbs();
  speciesArtLoader.releaseUnownedCachedArt(QUIESCENT_SPECIES_ART_CACHE);
  planetsideWorldKey = null;
  planetsideAudioRoster = null;
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
  releasePlanetsideEcology('roster-failed');
  planetsideGeneration++;
  releasePlanetsideThumbs();
  speciesArtLoader.releaseUnownedCachedArt(QUIESCENT_SPECIES_ART_CACHE);
  planetsideWorldKey = null;
  planetsideAudioRoster = null;
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
    releasePlanetsideEcology('planetside-hidden');
    if (planetsideBindings.size) {
      releasePlanetsideThumbs();
      speciesArtLoader.releaseUnownedCachedArt(QUIESCENT_SPECIES_ART_CACHE);
    }
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
): CanonicalWorldRoster | null {
  /* THE LIVING PLANETSIDE: MAIN-3's source-verified full ecology roster,
     bounded here—only here—to eight portrait chips. Capture and later world
     owners retain the complete canonical view. */
  let fullRoster = preparedRoster;
  if (fullRoster === null) {
    const addressResult = canonicalCF1WorldAddressFromNav(state);
    if (!addressResult.ok) {
      showPlanetsideRosterFailure(`address:${addressResult.reason}`);
      return null;
    }
    const rosterResult = canonicalWorldRoster(addressResult.address, currentEcologyEpoch());
    if (!rosterResult.ok) {
      showPlanetsideRosterFailure(`${rosterResult.reason}:${rosterResult.message}`);
      return null;
    }
    fullRoster = rosterResult.roster;
  } else if (fullRoster.worldKey !== getProvenPlanetKey(state.planet)) {
    showPlanetsideRosterFailure('prepared-roster-world-mismatch');
    return null;
  }
  const roster = fullRoster.view.preview;
  if (!roster.length) {
    clearPlanetside();
    syncPlanetsideLayout();
    return fullRoster;
  }
  releasePlanetsideEcology('roster-replaced');
  planetsideGeneration++;
  const generation = planetsideGeneration;
  releasePlanetsideThumbs();
  const worldKey = fullRoster.worldKey;
  planetsideWorldKey = worldKey;
  planetsideAudioRoster = fullRoster;
  sideEl.dataset.rosterState = 'ready';
  sideEl.dataset.previewCount = String(roster.length);
  sideEl.dataset.fullRosterCount = String(fullRoster.view.total);
  sideEl.dataset.fullRosterFingerprint = fullRoster.fullRosterFingerprint;
  sideEl.dataset.ecologyEpoch = String(fullRoster.ecologyEpoch);
  const heading = document.createElement('div');
  heading.className = 'planetside-heading';
  heading.dataset.arc7EcologyHeading = 'true';
  heading.textContent = 'PLANETSIDE — Biosphere';
  const ecologyControls = document.createElement('div');
  ecologyControls.className = 'planetside-ecology-audio';
  const listen = document.createElement('button');
  listen.type = 'button';
  listen.dataset.arc7EcologyListen = 'true';
  listen.style.minHeight = '44px';
  listen.textContent = 'Listen to biosphere';
  const ecologyStatus = document.createElement('span');
  ecologyStatus.dataset.arc7EcologyStatus = 'true';
  ecologyStatus.setAttribute('role', 'status');
  ecologyStatus.setAttribute('aria-live', 'polite');
  ecologyStatus.setAttribute('aria-atomic', 'true');
  ecologyStatus.hidden = true;
  ecologyControls.append(listen, ecologyStatus);
  const fragment = document.createDocumentFragment();
  fragment.append(heading, ecologyControls);
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
  return fullRoster;
}

function showPlanetsideEcologyUnavailable(reason: string): void {
  planetsideEcologyCounterpart = null;
  const status = sideEl.querySelector<HTMLElement>('[data-arc7-ecology-status]');
  if (!status) return;
  status.hidden = false;
  status.textContent = `Distant biosphere audio unavailable: ${reason.slice(0, 96)}.`;
  delete status.dataset.worldKey;
  delete status.dataset.generation;
}

sideEl.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof Element)
    || target.closest('[data-arc7-ecology-listen]') === null
    || !event.isTrusted) return;
  const visual = currentPlanetsideEcologyVisualReceipt();
  const roster = planetsideAudioRoster;
  if (visual === null || roster === null) return;
  releasePlanetsideEcology('listen-replaced');

  let playback: CurrentWorldDistantEcologyPlaybackV1;
  try {
    /* This pure plan call is intentionally below the exact visible receipt.
       Rendering, navigation, roster fill and filtering have no playback path. */
    playback = createCurrentWorldDistantEcologyPlaybackV1(roster, visual);
  } catch {
    showPlanetsideEcologyUnavailable('visual evidence changed');
    return;
  }
  const status = sideEl.querySelector<HTMLElement>('[data-arc7-ecology-status]');
  if (!status) return;
  const text = 'Distant living-biosphere signal — generic ecology only.';
  status.hidden = false;
  status.textContent = text;
  status.dataset.worldKey = playback.worldKey;
  status.dataset.generation = String(playback.generation);
  planetsideEcologyCounterpart = Object.freeze({ playback, text });
  if (!planetsideEcologyCounterpartIsCurrent(playback.counterpart)) {
    releasePlanetsideEcology('counterpart-unavailable');
    showPlanetsideEcologyUnavailable('counterpart unavailable');
    return;
  }

  const owner = tameGreetingAudioOwner;
  if (owner === null || !owner.armNativeDistantEcologyGesture()) {
    showPlanetsideEcologyUnavailable('sound is off or the surface is unavailable');
    return;
  }
  const claim = owner.claimCurrentWorldDistantEcology(playback);
  if (claim === null) {
    showPlanetsideEcologyUnavailable(owner.diagnostics().lastDisposition);
    return;
  }
  void owner.playClaimedDistantEcology(claim, playback.counterpart).then((result) => {
    if (result.kind === 'silent') showPlanetsideEcologyUnavailable(result.reason);
  });
});

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
    surfaceVistaGeneration,
    surfaceVistaEnvironmentFingerprint,
    surfaceVistaWorkerActive: surfaceVistaWorker !== null,
    surfaceVistaMounted: surfaceVistaSprite !== null,
    surfaceVistaCacheEntries: surfaceVistaCanvasCache.size,
    surfaceVistaCachePixels: [...surfaceVistaCanvasCache.values()]
      .reduce((sum, canvas) => sum + canvas.width * canvas.height, 0),
    surfaceVistaWorkerStarts,
    surfaceVistaResults,
    surfaceVistaCacheHits,
    surfaceVistaStaleDrops,
    surfaceVistaFaults,
    surfaceVistaLastBiome,
    surfaceVistaLastError,
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
    feed: compendiumFeedController.diagnostics(),
    explorerMeal: compendiumExplorerMealController.diagnostics(),
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
  /* Surface mode keeps the painterly globe as its usable interaction owner
     while the deterministic 960x430 biome vista renders behind it. The globe
     remains the fail-soft fallback if the optional worker cannot answer; the
     survey card carries the roster — every species row is real Ecology output.
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
  const currentSurfaceRoster = fillPlanetside(state, preparedRoster);
  if (abortRenderBeforeReceiptForSmoke()) return;
  recordRenderedScene(state);
  requestSurfaceVista(p, state, currentSurfaceRoster);
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

function publishWormholeTraversal(
  sourceGalaxy: Extract<NavState, { mode: 'galaxy' }>,
  skipPersist: boolean,
): void {
  const wj = mulberry32((sourceGalaxy.gal.seed ^ 0xC0FFEE) >>> 0);
  const a2 = wj() * TAU;
  const d2 = OBS_R * (2 + wj() * 10);
  const lifted = ascend(sourceGalaxy);
  if (!lifted.ok || lifted.state.mode !== 'universe') {
    throw new Error('Wormhole source no longer ascends to Cosmos');
  }
  nav = lifted.state;
  savedRouteWriteHeld = false;
  /* The verbatim destination WITH the game's reach clamp (main.js 3424):
     the far mouth is a VIEW of far skies — their stars stay drive-gated. */
  let wx = Math.cos(a2) * d2;
  let wy = Math.sin(a2) * d2;
  const rr = reachRadiusOf(primeCount()) * 0.85;
  const dh = Math.hypot(wx - HOME_POS.x, wy - HOME_POS.y);
  if (dh > rr) {
    wx = HOME_POS.x + (wx - HOME_POS.x) / dh * rr;
    wy = HOME_POS.y + (wy - HOME_POS.y) / dh * rr;
  }
  cam.x = camT.x = wx;
  cam.y = camT.y = wy;
  camT.z = 1.1;
  cam.z = 0.3;
  playWhoosh();
  rerender(skipPersist ? { skipPersist: true } : undefined);
}

let automaticWormholeTraversalLatch: string | null = null;
function beginWormholeTraversal(
  sourceGalaxy: Extract<NavState, { mode: 'galaxy' }>,
  automaticGalaxyKey?: string,
): boolean {
  if (arc9TravelInspectionOnly()) {
    publishWormholeTraversal(sourceGalaxy, true);
    return true;
  }
  if (arc9TravelWriteTemporarilyBlocked()) return false;
  let ownerAccepted = false;
  void settleArc9DirectTravel(
    'wormhole-traversal',
    sourceGalaxy,
    sourceGalaxy,
    () => publishWormholeTraversal(sourceGalaxy, true),
    undefined,
    undefined,
    () => {
      ownerAccepted = true;
      if (automaticGalaxyKey !== undefined) {
        automaticWormholeTraversalLatch = automaticGalaxyKey;
      }
    },
  );
  return ownerAccepted;
}

/* the game's ZOOM-DRIVEN transitions (checkTransitions, main.js 3380):
   dive by zooming into a thing, rise by zooming out past the mode floor.
   Wormhole travel + charter/Ascent gating: Phase 4+ (recorded). */
function checkTransitions(): void {
  if (productActionInFlight) return;
  if (nav.mode !== 'universe') automaticGalaxyArrivalLatch = null;
  if (nav.mode !== 'galaxy') automaticWormholeTraversalLatch = null;
  /* transitions read camT — the INTENT — not the eased cam: a descent's
     ease-in starts below the ascend floor and would bounce straight back */
  const mw = minWH();
  if (nav.mode === 'universe') {
    let best: GalaxyNode | null = null, bd = 1e9;
    for (const g of uniNodes) {
      const d = Math.hypot(g.x - camT.x, g.y - camT.y);
      if (d < bd) { bd = d; best = g; }
    }
    if (best && best.size * camT.z > 0.55 * mw && bd * camT.z < 0.4 * mw) {
      descendGalaxy(best, 'zoom');
    } else automaticGalaxyArrivalLatch = null;
  } else if (nav.mode === 'galaxy' && nav.gal) {
    if (camT.z < gz0 * 0.62) { goUp(); return; }
    /* flying into the wormhole hurls you somewhere unimaginably distant —
       destination seeded from the galaxy, identical for every explorer
       (main.js 3415; the charter reach clamp lands with progression) */
    if (wormPos && camT.z > mw / 60 && Math.hypot(wormPos.x - camT.x, wormPos.y - camT.y) * camT.z < 120) {
      const galaxyKey = getProvenGalaxyKey(nav.gal);
      if (galaxyKey !== null && automaticWormholeTraversalLatch !== galaxyKey) {
        /* Only the mutable owner's synchronous claim callback consumes the
           latch. Inspection and either preflight refusal leave intent live. */
        beginWormholeTraversal(nav, galaxyKey);
      }
      return;
    }
    automaticWormholeTraversalLatch = null;
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
  /* The game's 6× cap assumes interactive ground tiles. This surface keeps a
     420px painterly globe as the interaction owner while its biome vista is a
     presentation backdrop, so cap where the globe stays crisp (the phone
     pinch proved that the master smears at 6×). */
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
        activate: () => { surveyStar(star); },
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
      [
        card.querySelector<HTMLElement>('[data-act="travel"]'),
        card.querySelector<HTMLElement>('[data-act="landcta"]'),
        card.querySelector<HTMLElement>('[data-act="leaveworld"]'),
        card.querySelector<HTMLElement>('[data-survey-close]'),
      ].find((target) => target !== null && !target.closest('[inert]'))?.focus();
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
  heartbeatCycleOwner: typeof F4_HEARTBEAT_CYCLE_CHECKPOINT_OWNER | null = null,
  lifecycleCheckpointOwner: typeof F4_LIFECYCLE_CHECKPOINT_OWNER | null = null,
): Promise<boolean> {
  const admitted = (): boolean => {
    if (namedSearchPersistenceHeld && replacementOwner === null
      && intent === 'ordinary' && heartbeatCycleOwner === null
      && lifecycleCheckpointOwner !== F4_LIFECYCLE_CHECKPOINT_OWNER) {
      /* An ordinary checkpoint (including a settings debounce) that fires while
         an accepted custom name is settling must
         not become the activePersist tail that self-refuses its immediately
         submitted route. The route transaction persists the joined successor;
         re-arm one ordinary checkpoint afterward for any unrelated live field. */
      namedSearchPersistenceDeferred = true;
      return false;
    }
    if (persistHold || trainingCheckpointWriteHeld || importWriteInFlight || replacementReloadPending
      || !f4RuntimeMayMutate() || (replacementTransaction && replacementTransaction !== replacementOwner)
      || (replacementOwner !== null && replacementTransaction !== replacementOwner)) return false;
    return true;
  };
  if (!admitted()) return false;
  const write = async (): Promise<boolean> => {
    let epochStage: EcologyEpochStage | null = null;
    let durable = false;
    try {
      // A queued predecessor may have handed authority to Import or Training.
      if (!admitted()) return false;
      if (heartbeatCycleOwner !== F4_HEARTBEAT_CYCLE_CHECKPOINT_OWNER) {
        await settleF4Heartbeat();
      }
      // No candidate/stage may be built from admission that predates an await.
      if (!admitted()) return false;
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
      const checkpointParent = runtime.checkpointParent();
      if (checkpointParent === null) {
        throw new Error('receipt-free checkpoint has no exact durable parent');
      }
      const projection = projectCheckpointState({
        durable: checkpointParent,
        live: save,
        savedView: savedRouteWriteHeld ? save.savedView : navToView(nav),
        epoch: epochStage.epoch,
        trainingReplacement: replacementOwner !== null,
      });
      if (projection.kind !== 'projected') {
        throw new Error(`receipt-free checkpoint projection refused (${projection.detail})`);
      }
      const candidate = projection.state;
      if (__CF_EVIDENCE_BUILD__ && smokeRejectNextPersist) {
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
      if (!(__CF_EVIDENCE_BUILD__ && error instanceof Error && error.message === 'slice-smoke injected persistence rejection')) {
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
async function waitForActivePersist(): Promise<void> {
  const pending = activePersist;
  if (pending !== null) await pending.catch(() => false);
}
let productActionInFlight = false;
let smokeTransientPersistRelease: (() => void) | null = null;
let smokeTransientPersistRun: Promise<boolean> | null = null;
function smokeArmTransientPersistHold(): boolean {
  /* Diagnostics-only transient-writer seam. Unlike the import race it never
     writes IndexedDB, advances revision/receipts, or mutates product state. */
  if (activePersist !== null || _persistT !== 0 || productActionInFlight || importWriteInFlight
    || replacementTransaction !== null || replacementReloadPending
    || smokeTransientPersistRelease !== null || smokeTransientPersistRun !== null) return false;
  let releaseGate: (() => void) | null = null;
  const run = new Promise<boolean>((resolve) => {
    releaseGate = () => resolve(false);
  });
  activePersist = run;
  smokeTransientPersistRun = run;
  smokeTransientPersistRelease = () => {
    const release = releaseGate;
    smokeTransientPersistRelease = null;
    release?.();
  };
  return true;
}
async function smokeReleaseTransientPersistHold(): Promise<boolean> {
  const release = smokeTransientPersistRelease;
  const run = smokeTransientPersistRun;
  if (release === null || run === null) return false;
  release();
  await run;
  if (activePersist === run) activePersist = null;
  if (smokeTransientPersistRun === run) smokeTransientPersistRun = null;
  return true;
}
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
let settingsPersistenceSmokeQuiesced = false;
let settingsPersistenceSmokeTickerWasRunning = false;
let settingsPersistenceSmokeAnswerableWas = false;
function settingsPersistenceSmokeDiagnostics(): Readonly<{
  schema: 'cf-v2-settings-persistence-diagnostics/v1';
  documentToken: string;
  settingsProbeQuiesced: boolean;
  tickerRunning: boolean;
  heartbeatRunning: boolean;
  ecologyCheckpointInFlight: boolean;
  answerable: boolean;
  pendingPersistenceWrites: 0 | 1;
  pendingDebounceWrites: 0 | 1;
  mutationBlocked: boolean;
  leaseOwned: boolean;
  revision: number | null;
  commits: number | null;
  lastOutcome: string | null;
}> {
  const runtime = f4Runtime?.diagnostics() ?? null;
  return Object.freeze({
    schema: 'cf-v2-settings-persistence-diagnostics/v1',
    documentToken: DOCUMENT_TOKEN,
    settingsProbeQuiesced: settingsPersistenceSmokeQuiesced,
    tickerRunning: app.ticker?.started === true,
    heartbeatRunning: f4HeartbeatTimer !== 0,
    ecologyCheckpointInFlight: ecologyEdgeCheckpointInFlight !== null,
    answerable: runtime?.answerable === true,
    pendingPersistenceWrites: activePersist === null ? 0 : 1,
    pendingDebounceWrites: _persistT === 0 ? 0 : 1,
    mutationBlocked: playerMutationsBlocked(),
    leaseOwned: runtime?.leaseOwned === true,
    revision: runtime?.revision ?? null,
    commits: runtime?.commits ?? null,
    lastOutcome: lastPersistenceOutcome,
  });
}
async function smokeQuiesceSettingsPersistence(): Promise<Readonly<{
  schema: 'cf-v2-settings-persistence-quiescence/v1';
  acquired: boolean;
  tickerWasRunning: boolean;
  answerableWas: boolean;
  heartbeat: Awaited<ReturnType<typeof quiesceF4HeartbeatForSmoke>> | null;
  diagnostics: ReturnType<typeof settingsPersistenceSmokeDiagnostics>;
}>> {
  if (settingsPersistenceSmokeQuiesced) return Object.freeze({
    schema: 'cf-v2-settings-persistence-quiescence/v1',
    acquired: false,
    tickerWasRunning: settingsPersistenceSmokeTickerWasRunning,
    answerableWas: settingsPersistenceSmokeAnswerableWas,
    heartbeat: null,
    diagnostics: settingsPersistenceSmokeDiagnostics(),
  });
  settingsPersistenceSmokeQuiesced = true;
  settingsPersistenceSmokeTickerWasRunning = app.ticker?.started === true;
  settingsPersistenceSmokeAnswerableWas = f4Runtime?.diagnostics().answerable === true;
  if (settingsPersistenceSmokeTickerWasRunning) app.stop();
  f4Runtime?.setAnswerable(false);
  tameGreetingAudioOwner?.setAnswerable(false);
  try {
    const heartbeat = await quiesceF4HeartbeatForSmoke();
    /* An already-started heartbeat may cross its last await after the ticker
       stops. Reassert the deterministic probe boundary after joining it. */
    f4Runtime?.setAnswerable(false);
    tameGreetingAudioOwner?.setAnswerable(false);
    const ecologyCheckpoint = ecologyEdgeCheckpointInFlight;
    if (ecologyCheckpoint) await ecologyCheckpoint.catch(() => false);
    /* A prior slider event is not this probe's action. Let its real debounce
       settle before minting the baseline instead of canceling or replacing it. */
    if (_persistT !== 0) {
      await new Promise<void>((resolve) => { window.setTimeout(resolve, 450); });
    }
    await waitForActivePersist();
    return Object.freeze({
      schema: 'cf-v2-settings-persistence-quiescence/v1',
      acquired: true,
      tickerWasRunning: settingsPersistenceSmokeTickerWasRunning,
      answerableWas: settingsPersistenceSmokeAnswerableWas,
      heartbeat,
      diagnostics: settingsPersistenceSmokeDiagnostics(),
    });
  } catch (error) {
    smokeResumeSettingsPersistence();
    throw error;
  }
}
function smokeResumeSettingsPersistence(): Readonly<{
  schema: 'cf-v2-settings-persistence-resume/v1';
  resumed: boolean;
  answerableWas: boolean;
  heartbeat: ReturnType<typeof resumeF4HeartbeatForSmoke> | null;
  diagnostics: ReturnType<typeof settingsPersistenceSmokeDiagnostics>;
}> {
  if (!settingsPersistenceSmokeQuiesced) return Object.freeze({
    schema: 'cf-v2-settings-persistence-resume/v1',
    resumed: false,
    answerableWas: settingsPersistenceSmokeAnswerableWas,
    heartbeat: null,
    diagnostics: settingsPersistenceSmokeDiagnostics(),
  });
  const restartTicker = settingsPersistenceSmokeTickerWasRunning;
  const restoreAnswerable = settingsPersistenceSmokeAnswerableWas;
  settingsPersistenceSmokeTickerWasRunning = false;
  settingsPersistenceSmokeAnswerableWas = false;
  settingsPersistenceSmokeQuiesced = false;
  if (restartTicker && app.ticker && !app.ticker.started) app.start();
  const heartbeat = resumeF4HeartbeatForSmoke();
  const runtime = f4Runtime;
  const answerable = restoreAnswerable && f4RuntimeMayAnswer(runtime)
    && app.ticker?.started === true;
  runtime?.setAnswerable(answerable);
  tameGreetingAudioOwner?.setAnswerable(answerable);
  return Object.freeze({
    schema: 'cf-v2-settings-persistence-resume/v1',
    resumed: true,
    answerableWas: restoreAnswerable,
    heartbeat,
    diagnostics: settingsPersistenceSmokeDiagnostics(),
  });
}
const productActionCoordinator = createProductActionCoordinator();
const smokeProductActionHold = __CF_EVIDENCE_BUILD__
  ? createProductActionDiagnosticHold() : inactiveEvidenceHold;
let arc9ProgressionRefreshQueued = false;
let lastArc9ProgressionOutcome: string | null = null;
let arc9ExplorerNameEditing = false;
let arc9ExplorerNamePending = false;
let lastArc9ExplorerNameOutcome: string | null = null;
let arc9NameplateChoicePending = false;
let lastArc9NameplateOutcome: string | null = null;
let arc9FrontierEndingPending = false;
let lastArc9FrontierEndingOutcome: string | null = null;
let starterCharterAcceptPendingId: StarterCharterIdV1 | null = null;
let lastStarterCharterAcceptOutcome: string | null = null;
let lastStarterCharterAcceptStatus: string | null = null;
let arc9BinderClaimPendingId: Arc9BinderClaimableSetIdV1 | null = null;
let lastArc9BinderClaimOutcome: string | null = null;
let lastArc9BinderClaimStatus: string | null = null;
let lastArc9ShareSendOutcome: string | null = null;
let lastArc9ShareFollowOutcome: string | null = null;
let lastArc9SurveyOutcome: string | null = null;
let lastArc9BioscanOutcome: string | null = null;
type Arc9BioscanResultV1 = Readonly<{
  worldKey: string;
  target: 'clear' | 'explorer' | 'scout';
  probability: number;
  damage: number;
  hpBefore: number;
  hpAfter: number;
  scoutId: string | null;
  scoutHurtAfter: number | null;
  receiptOrdinal: number;
  revision: number;
  ownershipRevision: number;
}>;
let lastArc9BioscanResult: Arc9BioscanResultV1 | null = null;
let lastArc9AtlasFavoriteOutcome: string | null = null;
let lastArc9TravelOutcome: string | null = null;

type BoundedCollectionRefusalV1 =
  | Extract<StarterCharterAcceptActionOutcomeV1, { readonly kind: 'refused' }>
  | Extract<Arc9BinderSetClaimActionOutcomeV1, { readonly kind: 'refused' }>;

function boundedCollectionRefusalNeedsReload(outcome: BoundedCollectionRefusalV1): boolean {
  const kind = outcome.transaction?.kind ?? outcome.detail;
  return kind === 'stale' || kind === 'revision-exhausted'
    || kind === 'duplicate-receipt' || kind === 'lost'
    || kind === 'lease-unavailable' || kind === 'protected'
    || kind === 'storage-error';
}

async function runStarterCharterAccept(id: StarterCharterIdV1): Promise<void> {
  const runtime = f4Runtime;
  if (starterCharterAcceptPendingId !== null || smokeForceReadOnly
    || !f4RuntimeMayMutate(runtime) || activePersist || importWriteInFlight
    || replacementTransaction || replacementReloadPending
    || trainingCheckpointWriteHeld || trainingActive() || ecologyEpochBlocksActions()) {
    lastStarterCharterAcceptOutcome = 'unavailable:write-authority';
    lastStarterCharterAcceptStatus = 'Starter Charter acceptance is unavailable until the current save operation settles.';
    if (openPanelId() === 'ch') fillCharters();
    toast('Charter acceptance unavailable', 'Finish the current expedition save, then try again.');
    return;
  }
  const projection = projectStarterCharterBoardV1(save);
  if (projection.kind !== 'projected') {
    lastStarterCharterAcceptOutcome = `refused:protected:${projection.reason}`;
    lastStarterCharterAcceptStatus = 'Starter Charters are protected because their saved authority could not be verified. Nothing changed.';
    if (openPanelId() === 'ch') fillCharters();
    toast('Starter Charters protected', 'Nothing changed. Reload after restoring save authority.', true);
    return;
  }
  if (save.chacc.includes(id) || save.chDone.includes(id)) {
    lastStarterCharterAcceptOutcome = `current:${id}`;
    lastStarterCharterAcceptStatus = 'That Starter Charter is already accepted or complete.';
    if (openPanelId() === 'ch') fillCharters();
    return;
  }
  const row = projection.board.rows.find(({ definition }) => definition.id === id);
  if (row === undefined || row.status !== 'available'
    || projection.board.acceptedCount >= projection.board.cap) {
    lastStarterCharterAcceptOutcome = `refused:locked:${id}`;
    lastStarterCharterAcceptStatus = 'That Starter Charter is locked or unavailable. Nothing changed.';
    if (openPanelId() === 'ch') fillCharters();
    toast('Charter unavailable', row?.lockedReason ?? 'Three accepted Charters is the exact active cap.');
    return;
  }
  const operation = operationForStarterCharterAcceptV1(id);
  const actionClaim = productActionCoordinator.tryClaim(operation);
  if (actionClaim === null) {
    lastStarterCharterAcceptOutcome = 'unavailable:product-action-pending';
    lastStarterCharterAcceptStatus = 'Another expedition action is still settling. Nothing changed.';
    if (openPanelId() === 'ch') fillCharters();
    toast('Charter acceptance unavailable', 'Another expedition action is still settling.');
    return;
  }
  const actionBarrier = actionClaim.barrier;
  const sourceState = save;
  const sourceAuthorityJson = JSON.stringify(sourceState);
  const prior = Object.freeze({
    chacc: sourceState.chacc,
    chDone: sourceState.chDone,
    chProg: sourceState.chProg,
    essence: sourceState.essence,
    stats: sourceState.stats,
    items: sourceState.items,
    equip: sourceState.equip,
    equipAff: sourceState.equipAff,
    unlocked: sourceState.unlocked,
    arc2LootState,
  });
  const restoreLiveParent = (): void => {
    if (save !== sourceState) return;
    sourceState.chacc = prior.chacc;
    sourceState.chDone = prior.chDone;
    sourceState.chProg = prior.chProg;
    sourceState.essence = prior.essence;
    sourceState.stats = prior.stats;
    sourceState.items = prior.items;
    sourceState.equip = prior.equip;
    sourceState.equipAff = prior.equipAff;
    sourceState.unlocked = prior.unlocked;
    arc2LootState = prior.arc2LootState;
    try { inventoryPanelController.setState(arc2LootState); }
    catch { /* the replacement document owns recovery */ }
  };
  productActionInFlight = true;
  activePersist = actionBarrier;
  starterCharterAcceptPendingId = id;
  lastStarterCharterAcceptOutcome = 'pending';
  lastStarterCharterAcceptStatus = null;
  if (openPanelId() === 'ch') fillCharters();
  let durable = false;
  let convergence = false;
  let writeAttempted = false;
  let outcome: StarterCharterAcceptActionOutcomeV1 | null = null;
  try {
    await smokeProductActionHold.holdIfArmed(actionClaim.operation);
    await settleF4Heartbeat();
    if (smokeForceReadOnly || !f4RuntimeMayMutate(runtime)
      || importWriteInFlight || replacementTransaction || replacementReloadPending
      || trainingCheckpointWriteHeld || trainingActive() || ecologyEpochBlocksActions()
      || save !== sourceState || JSON.stringify(sourceState) !== sourceAuthorityJson
      || starterCharterAcceptPendingId !== id) {
      lastStarterCharterAcceptOutcome = 'refused:authority-changed';
      lastStarterCharterAcceptStatus = 'Save authority changed before acceptance. Nothing changed.';
      return;
    }
    writeAttempted = true;
    outcome = await commitStarterCharterAcceptV1({
      authority: runtime,
      state: sourceState,
      id,
      codecNow: Date.now(),
    });
    if (outcome.kind === 'current') {
      lastStarterCharterAcceptOutcome = `current:${outcome.id}`;
      lastStarterCharterAcceptStatus = 'That Starter Charter is already durably accepted or complete.';
      toast('Charter unchanged', 'That Starter Charter is already accepted or complete.');
      return;
    }
    if (outcome.kind === 'refused') {
      lastStarterCharterAcceptOutcome = `refused:${outcome.detail}`;
      if (boundedCollectionRefusalNeedsReload(outcome)) {
        convergence = true;
        lastStarterCharterAcceptStatus = 'Save authority changed. This expedition is reloading read-only; the acceptance will not be retried.';
        scheduleF4AuthorityConvergenceReload(
          runtime,
          `Starter Charter acceptance authority ${outcome.detail}`,
        );
      } else {
        lastStarterCharterAcceptStatus = 'That Starter Charter is locked or unavailable. Nothing changed.';
        toast('Charter unavailable', 'Nothing changed. Reopen Charters after the current expedition state advances.');
      }
      return;
    }

    durable = true;
    f4LastCheckpointAt = performance.now();
    lastPersistenceOutcome = `starter-charter-accept-committed:${outcome.transaction.revision}`;
    if (outcome.kind === 'committed-convergence') {
      convergence = true;
      lastStarterCharterAcceptOutcome = `committed-convergence:${outcome.detail}`;
      lastStarterCharterAcceptStatus = 'The acceptance committed, and the expedition is reloading its exact durable result. It will not be retried.';
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Starter Charter acceptance committed; ${outcome.detail}`,
      );
      return;
    }

    try {
      const checkpoint = runtime.checkpointParent();
      const successor = outcome.facts.successor;
      if (runtime !== f4Runtime || save !== sourceState
        || runtime.revision !== outcome.transaction.revision
        || checkpoint === null
        || JSON.stringify(checkpoint.chacc) !== JSON.stringify(successor.chacc)
        || JSON.stringify(checkpoint.chDone) !== JSON.stringify(successor.chDone)
        || JSON.stringify(checkpoint.chProg) !== JSON.stringify(successor.chProg)
        || checkpoint.essence !== successor.essence
        || JSON.stringify(checkpoint.stats) !== JSON.stringify(successor.stats)
        || JSON.stringify(checkpoint.items) !== JSON.stringify(successor.items)
        || JSON.stringify(checkpoint.equip) !== JSON.stringify(successor.equip)
        || JSON.stringify(checkpoint.equipAff) !== JSON.stringify(successor.equipAff)
        || JSON.stringify(checkpoint.unlocked) !== JSON.stringify(successor.unlocked)) {
        throw new Error('Starter Charter runtime did not retain its exact durable fixed point');
      }
      let nextArc2LootState = arc2LootState;
      if (outcome.facts.stage.extensionWrites.length > 0) {
        const loaded = readArc2Loot(runtime.extensions);
        if (loaded.kind !== 'loaded'
          || loaded.state.kind !== 'inventory'
          || outcome.arc2LootState === null
          || JSON.stringify(encodeArc2LootCarrier(loaded.state))
            !== JSON.stringify(encodeArc2LootCarrier(outcome.arc2LootState))
          || !arc2LootLegacyMirrorMatches(loaded.state, outcome.state)) {
          throw new Error('Starter Charter gear carrier did not retain its exact durable fixed point');
        }
        nextArc2LootState = loaded.state;
      } else if (outcome.arc2LootState !== null) {
        throw new Error('Starter Charter exposed an unexpected exact gear successor');
      }
      publishStarterCharterAcceptFieldsV1(sourceState, outcome);
      arc2LootState = nextArc2LootState;
      inventoryPanelController.setState(arc2LootState);
      updateChips();
      if (openPanelId() === 'ch') fillCharters();
      if (openPanelId() === 'rec') fillRecords();
      const completions = outcome.facts.stage.completions;
      if (completions.length > 0) {
        const reward = completions.map((completion) => `+${completion.stardust} Stardust`
          + (completion.gearId === null ? '' : ` + ${completion.gearId} starter gear`)).join(' · ');
        const titles = completions.map(({ title }) => title).join(', ');
        lastStarterCharterAcceptStatus = `Accepted and completed ${titles}. Reward: ${reward}.`;
        toast('✓ Charter accepted and completed', `${titles} · ${reward}`, true);
      } else {
        lastStarterCharterAcceptStatus = `Accepted ${row.definition.title}. Its durable progress is now active.`;
        toast('Charter accepted', `${row.definition.title} is now active.`, true);
      }
      lastStarterCharterAcceptOutcome = `committed:${id}:${outcome.facts.receiptOrdinal}`;
      presentProgressionCeremony({
        revision: outcome.transaction.revision,
        disposition: 'committed-publication',
        priorUnlockedIds: outcome.facts.stage.priorUnlockedIds,
        nextUnlockedIds: outcome.facts.stage.nextUnlockedIds,
        addedAchievementIds: outcome.facts.stage.addedAchievementIds,
        priorBestRankIndex: outcome.facts.stage.priorBestRankIndex,
        nextBestRankIndex: outcome.facts.stage.nextBestRankIndex,
      });
    } catch (error) {
      restoreLiveParent();
      convergence = true;
      lastStarterCharterAcceptOutcome = 'committed-publication-reload';
      lastStarterCharterAcceptStatus = 'The acceptance committed, but its presentation could not be verified. Reloading the exact durable result without retry.';
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Starter Charter acceptance committed; publication ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  } catch (error) {
    if (durable) restoreLiveParent();
    lastStarterCharterAcceptOutcome = `${durable ? 'committed-' : ''}fault`;
    if (durable || writeAttempted) {
      convergence = true;
      lastStarterCharterAcceptStatus = 'The acceptance result became ambiguous. Reloading read-only without retry.';
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Starter Charter acceptance ${lastStarterCharterAcceptOutcome}: ${error instanceof Error ? error.message : String(error)}`,
      );
    } else {
      lastStarterCharterAcceptStatus = 'Starter Charter acceptance was unavailable. Nothing changed.';
      toast('Charter acceptance unavailable', 'Nothing changed. Try again after save authority settles.');
    }
  } finally {
    starterCharterAcceptPendingId = null;
    productActionInFlight = false;
    actionClaim.settle(durable);
    if (activePersist === actionBarrier) activePersist = null;
    if (!convergence && openPanelId() === 'ch') {
      try { fillCharters(); }
      catch (error) {
        if (durable) {
          restoreLiveParent();
          scheduleF4AuthorityConvergenceReload(
            runtime,
            `Starter Charter acceptance committed; Charters refresh ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    }
  }
}

async function runArc9BinderSetClaim(setId: Arc9BinderClaimableSetIdV1): Promise<void> {
  const runtime = f4Runtime;
  if (arc9BinderClaimPendingId !== null || smokeForceReadOnly
    || !f4RuntimeMayMutate(runtime) || activePersist || importWriteInFlight
    || replacementTransaction || replacementReloadPending
    || trainingCheckpointWriteHeld || trainingActive() || ecologyEpochBlocksActions()) {
    lastArc9BinderClaimOutcome = 'unavailable:write-authority';
    lastArc9BinderClaimStatus = 'Binder Set claiming is unavailable until the current save operation settles.';
    if (openPanelId() === 'rec') fillRecords();
    toast('Binder claim unavailable', 'Finish the current expedition save, then try again.');
    return;
  }
  const projection = projectArc9BinderReadModelV1(save);
  if (projection.kind !== 'projected') {
    lastArc9BinderClaimOutcome = `refused:protected:${projection.reason}`;
    lastArc9BinderClaimStatus = 'The Binder is protected because its saved authority could not be verified. Nothing changed.';
    if (openPanelId() === 'rec') fillRecords();
    toast('Binder protected', 'Nothing changed. Reload after restoring save authority.', true);
    return;
  }
  const row = projection.model.sets.find(({ id }) => id === setId);
  if (row === undefined || row.claimed || !row.complete) {
    lastArc9BinderClaimOutcome = row?.claimed ? `current:${setId}` : `refused:locked:${setId}`;
    lastArc9BinderClaimStatus = row?.claimed
      ? 'That Binder Set reward is already claimed.'
      : 'That Binder Set is incomplete or unavailable. Nothing changed.';
    if (openPanelId() === 'rec') fillRecords();
    return;
  }
  const operation = operationForArc9BinderSetClaimV1(setId);
  const actionClaim = productActionCoordinator.tryClaim(operation);
  if (actionClaim === null) {
    lastArc9BinderClaimOutcome = 'unavailable:product-action-pending';
    lastArc9BinderClaimStatus = 'Another expedition action is still settling. Nothing changed.';
    if (openPanelId() === 'rec') fillRecords();
    toast('Binder claim unavailable', 'Another expedition action is still settling.');
    return;
  }
  const actionBarrier = actionClaim.barrier;
  const sourceState = save;
  const sourceAuthorityJson = JSON.stringify(sourceState);
  const prior = Object.freeze({
    claimedSets: sourceState.claimedSets,
    essence: sourceState.essence,
    stats: sourceState.stats,
    unlocked: sourceState.unlocked,
  });
  const restoreLiveParent = (): void => {
    if (save !== sourceState) return;
    sourceState.claimedSets = prior.claimedSets;
    sourceState.essence = prior.essence;
    sourceState.stats = prior.stats;
    sourceState.unlocked = prior.unlocked;
  };
  productActionInFlight = true;
  activePersist = actionBarrier;
  arc9BinderClaimPendingId = setId;
  lastArc9BinderClaimOutcome = 'pending';
  lastArc9BinderClaimStatus = null;
  if (openPanelId() === 'rec') fillRecords();
  let durable = false;
  let convergence = false;
  let writeAttempted = false;
  let outcome: Arc9BinderSetClaimActionOutcomeV1 | null = null;
  try {
    await smokeProductActionHold.holdIfArmed(actionClaim.operation);
    await settleF4Heartbeat();
    if (smokeForceReadOnly || !f4RuntimeMayMutate(runtime)
      || importWriteInFlight || replacementTransaction || replacementReloadPending
      || trainingCheckpointWriteHeld || trainingActive() || ecologyEpochBlocksActions()
      || save !== sourceState || JSON.stringify(sourceState) !== sourceAuthorityJson
      || arc9BinderClaimPendingId !== setId) {
      lastArc9BinderClaimOutcome = 'refused:authority-changed';
      lastArc9BinderClaimStatus = 'Save authority changed before the claim. Nothing changed.';
      return;
    }
    writeAttempted = true;
    outcome = await commitArc9BinderSetClaimV1({
      authority: runtime,
      state: sourceState,
      setId,
      codecNow: Date.now(),
    });
    if (outcome.kind === 'current') {
      lastArc9BinderClaimOutcome = `current:${outcome.setId}`;
      lastArc9BinderClaimStatus = 'That Binder Set reward is already durably claimed.';
      toast('Binder Set unchanged', 'That one-time reward is already claimed.');
      return;
    }
    if (outcome.kind === 'refused') {
      lastArc9BinderClaimOutcome = `refused:${outcome.detail}`;
      if (boundedCollectionRefusalNeedsReload(outcome)) {
        convergence = true;
        lastArc9BinderClaimStatus = 'Save authority changed. This expedition is reloading read-only; the claim will not be retried.';
        scheduleF4AuthorityConvergenceReload(
          runtime,
          `Arc 9 Binder claim authority ${outcome.detail}`,
        );
      } else {
        lastArc9BinderClaimStatus = 'That Binder Set is incomplete or unavailable. Nothing changed.';
        toast('Binder Set unavailable', 'Nothing changed. Complete the exact set before claiming its reward.');
      }
      return;
    }

    durable = true;
    f4LastCheckpointAt = performance.now();
    lastPersistenceOutcome = `arc9-binder-claim-committed:${outcome.transaction.revision}`;
    if (outcome.kind === 'committed-convergence') {
      convergence = true;
      lastArc9BinderClaimOutcome = `committed-convergence:${outcome.detail}`;
      lastArc9BinderClaimStatus = 'The claim committed, and the expedition is reloading its exact durable result. It will not be retried.';
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Arc 9 Binder claim committed; ${outcome.detail}`,
      );
      return;
    }

    try {
      const checkpoint = runtime.checkpointParent();
      if (runtime !== f4Runtime || save !== sourceState
        || runtime.revision !== outcome.transaction.revision
        || checkpoint === null
        || JSON.stringify(checkpoint.claimedSets) !== JSON.stringify(outcome.state.claimedSets)
        || checkpoint.essence !== outcome.state.essence
        || JSON.stringify(checkpoint.stats) !== JSON.stringify(outcome.state.stats)
        || JSON.stringify(checkpoint.unlocked) !== JSON.stringify(outcome.state.unlocked)) {
        throw new Error('Binder runtime did not retain its exact durable fixed point');
      }
      publishArc9BinderSetClaimFieldsV1(sourceState, outcome);
      updateChips();
      if (openPanelId() === 'rec') fillRecords();
      lastArc9BinderClaimOutcome = `committed:${setId}:${outcome.facts.receiptOrdinal}`;
      lastArc9BinderClaimStatus = `Claimed ${row.name}. Reward: +${outcome.facts.stardust} Stardust.`;
      toast('Binder Set claimed', `${row.name} · +${outcome.facts.stardust} Stardust`, true);
      presentProgressionCeremony({
        revision: outcome.transaction.revision,
        disposition: 'committed-publication',
        priorUnlockedIds: outcome.facts.priorUnlockedIds,
        nextUnlockedIds: outcome.facts.nextUnlockedIds,
        addedAchievementIds: outcome.facts.addedAchievementIds,
        priorBestRankIndex: outcome.facts.priorBestRankIndex,
        nextBestRankIndex: outcome.facts.nextBestRankIndex,
      });
    } catch (error) {
      restoreLiveParent();
      convergence = true;
      lastArc9BinderClaimOutcome = 'committed-publication-reload';
      lastArc9BinderClaimStatus = 'The claim committed, but its presentation could not be verified. Reloading the exact durable result without retry.';
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Arc 9 Binder claim committed; publication ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  } catch (error) {
    if (durable) restoreLiveParent();
    lastArc9BinderClaimOutcome = `${durable ? 'committed-' : ''}fault`;
    if (durable || writeAttempted) {
      convergence = true;
      lastArc9BinderClaimStatus = 'The claim result became ambiguous. Reloading read-only without retry.';
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Arc 9 Binder claim ${lastArc9BinderClaimOutcome}: ${error instanceof Error ? error.message : String(error)}`,
      );
    } else {
      lastArc9BinderClaimStatus = 'Binder Set claiming was unavailable. Nothing changed.';
      toast('Binder claim unavailable', 'Nothing changed. Try again after save authority settles.');
    }
  } finally {
    arc9BinderClaimPendingId = null;
    productActionInFlight = false;
    actionClaim.settle(durable);
    if (activePersist === actionBarrier) activePersist = null;
    if (!convergence && openPanelId() === 'rec') {
      try { fillRecords(); }
      catch (error) {
        if (durable) {
          restoreLiveParent();
          scheduleF4AuthorityConvergenceReload(
            runtime,
            `Arc 9 Binder claim committed; Records refresh ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    }
  }
}

function arc9TravelInspectionOnly(): boolean {
  return smokeForceReadOnly || !f4RuntimeMayMutate()
    || trainingCheckpointWriteHeld || trainingActive();
}

function arc9TravelWriteTemporarilyBlocked(): boolean {
  return activePersist !== null || importWriteInFlight
    || replacementTransaction !== null || replacementReloadPending
    || ecologyEpochBlocksActions();
}

async function settleArc9DirectTravel(
  actionKind: Arc9TravelActionKindV1,
  galaxyNav: Extract<NavState, { mode: 'galaxy' }>,
  sourceNav: NavState,
  publishNavigation: () => void,
  acceptedSavedView?: Readonly<Record<string, unknown>>,
  authorityStillValid: () => boolean = () => true,
  onAttemptClaimed: () => void = () => {},
): Promise<boolean> {
  const runtime = f4Runtime;
  if (smokeForceReadOnly || !f4RuntimeMayMutate(runtime)
    || arc9TravelWriteTemporarilyBlocked()
    || trainingCheckpointWriteHeld || trainingActive()) {
    lastArc9TravelOutcome = 'unavailable:write-authority';
    return false;
  }
  let operation: string;
  try { operation = operationForArc9TravelV1(actionKind, galaxyNav); }
  catch {
    lastArc9TravelOutcome = 'refused:source-unproven';
    return false;
  }
  const actionClaim = productActionCoordinator.tryClaim(operation);
  if (actionClaim === null) {
    lastArc9TravelOutcome = 'unavailable:product-action-pending';
    return false;
  }
  const actionBarrier = actionClaim.barrier;
  const priorGalSeen = save.galSeen;
  const priorStats = save.stats;
  const priorUnlocked = save.unlocked;
  const priorSavedView = save.savedView;
  productActionInFlight = true;
  activePersist = actionBarrier;
  let durable = false;
  let outcome: Arc9TravelActionOutcomeV1 | null = null;
  try {
    onAttemptClaimed();
    await smokeProductActionHold.holdIfArmed(actionClaim.operation);
    await settleF4Heartbeat();
    if (smokeForceReadOnly || !f4RuntimeMayMutate(runtime)
      || importWriteInFlight || replacementTransaction || replacementReloadPending
      || trainingCheckpointWriteHeld || trainingActive() || ecologyEpochBlocksActions()
      || nav !== sourceNav || !authorityStillValid()) {
      lastArc9TravelOutcome = 'refused:authority-changed';
      return false;
    }
    outcome = acceptedSavedView === undefined
      ? await commitArc9TravelSettlementV1({
        runtime,
        state: save,
        actionKind,
        galaxyNav,
        codecNow: Date.now(),
      })
      : await commitArc9GalaxyArrivalRouteV1({
        runtime,
        state: save,
        galaxyNav,
        acceptedSavedView,
        codecNow: Date.now(),
      });
    if (outcome.kind === 'refused') {
      lastArc9TravelOutcome = `refused:${outcome.detail}`;
      if (outcome.convergence === 'read-only-reload') {
        scheduleF4AuthorityConvergenceReload(
          runtime,
          `Arc 9 Travel authority ${outcome.detail}`,
        );
      } else if (outcome.detail.includes('capacity')) {
        toast(
          'Travel record protected',
          'This arrival could not be recorded safely; your current route remains unchanged.',
          true,
        );
      }
      return false;
    }
    if (outcome.kind === 'current') {
      try {
        publishNavigation();
        lastArc9TravelOutcome = `current:${outcome.facts.actionKind}`;
        return true;
      } catch (error) {
        lastArc9TravelOutcome = `presentation-fault:${error instanceof Error ? error.message : String(error)}`;
        return false;
      }
    }

    durable = true;
    f4LastCheckpointAt = performance.now();
    lastPersistenceOutcome = `arc9-travel-committed:${outcome.transaction.revision}`;
    if (outcome.kind === 'committed-convergence') {
      lastArc9TravelOutcome = `committed-convergence:${outcome.detail}`;
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Arc 9 Travel committed; ${outcome.detail}`,
      );
      return true;
    }

    try {
      const checkpoint = runtime.checkpointParent();
      if (runtime !== f4Runtime
        || runtime.revision !== outcome.transaction.revision
        || checkpoint === null
        || JSON.stringify(checkpoint.galSeen) !== JSON.stringify(outcome.successor.galSeen)
        || checkpoint.stats.bestRank !== outcome.successor.bestRank
        || JSON.stringify(checkpoint.unlocked) !== JSON.stringify(outcome.successor.unlocked)
        || JSON.stringify(checkpoint.savedView) !== JSON.stringify(outcome.successor.savedView)) {
        throw new Error('Travel runtime did not retain its exact durable fixed point');
      }
      publishArc9TravelFieldsV1(save, outcome);
      publishNavigation();
      const additions = [
        ...outcome.addedEventAchievementIds,
        ...outcome.addedAggregateAchievementIds,
      ];
      lastArc9TravelOutcome = `committed:${outcome.facts.actionKind}:${additions.join(',') || 'route'}`;
      updateChips();
      if (openPanelId() === 'rec') fillRecords();
      presentProgressionCeremony({
        revision: outcome.transaction.revision,
        disposition: 'committed-publication',
        priorUnlockedIds: outcome.source.unlocked,
        nextUnlockedIds: outcome.successor.unlocked,
        addedAchievementIds: additions,
        priorBestRankIndex: outcome.source.bestRank,
        nextBestRankIndex: outcome.successor.bestRank,
      });
      return true;
    } catch (error) {
      save.galSeen = priorGalSeen;
      save.stats = priorStats;
      save.unlocked = priorUnlocked;
      save.savedView = priorSavedView;
      lastArc9TravelOutcome = 'committed-publication-reload';
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Arc 9 Travel committed; publication ${error instanceof Error ? error.message : String(error)}`,
      );
      return true;
    }
  } catch (error) {
    if (durable) {
      save.galSeen = priorGalSeen;
      save.stats = priorStats;
      save.unlocked = priorUnlocked;
      save.savedView = priorSavedView;
    }
    lastArc9TravelOutcome = `${durable ? 'committed-' : ''}fault`;
    if (durable) {
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Arc 9 Travel ${lastArc9TravelOutcome}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    return durable;
  } finally {
    productActionInFlight = false;
    actionClaim.settle(durable);
    if (activePersist === actionBarrier) activePersist = null;
  }
}

function arc9AtlasRowActionBlocked(): boolean {
  return arc9AtlasFavoritePendingId !== null || arc9AtlasRowPending !== null
    || arc9AtlasUndoPending || smokeForceReadOnly || !f4RuntimeMayMutate()
    || activePersist !== null || importWriteInFlight
    || replacementTransaction !== null || replacementReloadPending
    || trainingCheckpointWriteHeld || trainingActive() || ecologyEpochBlocksActions();
}

function atlasRowRefusalNeedsReload(
  outcome: Readonly<{ convergence: 'none' | 'read-only-reload' }>,
): boolean {
  return outcome.convergence === 'read-only-reload';
}

async function runArc9AtlasHomeChange(atlasId: string, desired: boolean): Promise<boolean> {
  const runtime = f4Runtime;
  if (arc9AtlasRowActionBlocked() || runtime === null) {
    lastArc9AtlasRowStatus = 'Home is unavailable until the current expedition action settles.';
    if (openPanelId() === 'atlas') fillAtlas();
    return false;
  }
  let operation: string;
  try { operation = operationForArc9AtlasHomeV1(atlasId); }
  catch {
    lastArc9AtlasRowStatus = 'That Atlas row is not a valid Home target.';
    return false;
  }
  const targetIndex = save.logMap.findIndex(([id]) => id === atlasId);
  const targetPair = targetIndex < 0 ? null : save.logMap[targetIndex] ?? null;
  if (targetPair === null) return false;
  const targetEntry = targetPair[1];
  const priorHomeId = save.homeId;
  const priorRoute = atlasRouteStates.get(targetEntry);
  const actionClaim = productActionCoordinator.tryClaim(operation);
  if (actionClaim === null) {
    lastArc9AtlasRowStatus = 'Another expedition action is still settling.';
    if (openPanelId() === 'atlas') fillAtlas();
    return false;
  }
  clearArc9AtlasUndo();
  const actionBarrier = actionClaim.barrier;
  productActionInFlight = true;
  activePersist = actionBarrier;
  arc9AtlasRowPending = Object.freeze({ kind: 'home', atlasId });
  lastArc9AtlasRowStatus = null;
  if (openPanelId() === 'atlas') fillAtlas();
  let durable = false;
  let convergence = false;
  try {
    await smokeProductActionHold.holdIfArmed(actionClaim.operation);
    await settleF4Heartbeat();
    if (smokeForceReadOnly || !f4RuntimeMayMutate(runtime)
      || importWriteInFlight || replacementTransaction || replacementReloadPending
      || trainingCheckpointWriteHeld || trainingActive() || ecologyEpochBlocksActions()
      || save.logMap[targetIndex] !== targetPair || targetPair[1] !== targetEntry
      || atlasRouteStates.get(targetEntry) !== priorRoute
      || save.homeId !== priorHomeId) {
      lastArc9AtlasRowStatus = 'Atlas authority changed before Home could settle. Nothing changed.';
      return false;
    }
    const outcome = await commitArc9AtlasHomeV1({
      runtime,
      state: save,
      atlasId,
      desired,
      codecNow: Date.now(),
    });
    if (outcome.kind === 'refused') {
      lastArc9AtlasRowStatus = 'Home was refused because the exact Atlas authority could not be proved.';
      if (atlasRowRefusalNeedsReload(outcome)) {
        convergence = true;
        scheduleF4AuthorityConvergenceReload(runtime, 'Arc 9 Atlas Home ' + outcome.detail);
      }
      return false;
    }
    if (outcome.kind === 'current') {
      lastArc9AtlasRowStatus = desired
        ? 'That exact place is already Home.'
        : 'That exact place is already not Home.';
      return true;
    }
    durable = true;
    f4LastCheckpointAt = performance.now();
    lastPersistenceOutcome = 'arc9-atlas-home-committed:' + outcome.transaction.revision;
    if (outcome.kind === 'committed-convergence') {
      convergence = true;
      lastArc9AtlasRowStatus = 'Home committed; reloading its exact durable result without retry.';
      scheduleF4AuthorityConvergenceReload(runtime, 'Arc 9 Atlas Home ' + outcome.detail);
      return true;
    }
    try {
      const checkpoint = runtime.checkpointParent();
      if (runtime !== f4Runtime || runtime.revision !== outcome.transaction.revision
        || checkpoint === null || checkpoint.homeId !== outcome.plan.homeIdAfter
        || JSON.stringify(checkpoint.logMap) !== JSON.stringify(outcome.transaction.state.logMap)) {
        throw new Error('Atlas Home runtime did not retain its exact durable fixed point');
      }
      publishArc9AtlasHomeFieldsV1(save, outcome);
      if (save.logMap[targetIndex] !== targetPair
        || targetPair[1] !== targetEntry
        || atlasRouteStates.get(targetEntry) !== priorRoute) {
        throw new Error('Atlas Home publication replaced its exact route-owning row');
      }
      lastArc9AtlasRowStatus = desired
        ? 'Home now points to ' + String(targetEntry.title || atlasId) + '.'
        : 'Home has been cleared.';
      toast(desired ? '⌂ Atlas Home set' : 'Atlas Home cleared', lastArc9AtlasRowStatus, true);
      return true;
    } catch (error) {
      save.homeId = priorHomeId;
      convergence = true;
      lastArc9AtlasRowStatus = 'Home committed, but presentation could not be verified. Reloading without retry.';
      scheduleF4AuthorityConvergenceReload(
        runtime,
        'Arc 9 Atlas Home publication ' + (error instanceof Error ? error.message : String(error)),
      );
      return true;
    }
  } catch (error) {
    if (durable) save.homeId = priorHomeId;
    lastArc9AtlasRowStatus = durable
      ? 'Home became ambiguous after commit. Reloading without retry.'
      : 'Home could not be changed. Nothing changed.';
    if (durable) {
      convergence = true;
      scheduleF4AuthorityConvergenceReload(
        runtime,
        'Arc 9 Atlas Home fault ' + (error instanceof Error ? error.message : String(error)),
      );
    }
    return durable;
  } finally {
    productActionInFlight = false;
    actionClaim.settle(durable);
    arc9AtlasRowPending = null;
    if (activePersist === actionBarrier) activePersist = null;
    if (!convergence && openPanelId() === 'atlas') fillAtlas();
  }
}

async function runArc9AtlasRemove(atlasId: string): Promise<boolean> {
  const runtime = f4Runtime;
  if (arc9AtlasRowActionBlocked() || runtime === null) {
    lastArc9AtlasRowStatus = 'Remove is unavailable until the current expedition action settles.';
    if (openPanelId() === 'atlas') fillAtlas();
    return false;
  }
  let operation: string;
  try { operation = operationForArc9AtlasRemoveV1(atlasId); }
  catch {
    lastArc9AtlasRowStatus = 'That Atlas row is not a valid removal target.';
    return false;
  }
  const targetIndex = save.logMap.findIndex(([id]) => id === atlasId);
  const targetPair = targetIndex < 0 ? null : save.logMap[targetIndex] ?? null;
  if (targetPair === null) return false;
  const targetEntry = targetPair[1];
  const title = String(targetEntry.title || atlasId);
  const priorHomeId = save.homeId;
  const priorRows = save.logMap.slice();
  const priorRoutes = priorRows.map(([, entry]) => atlasRouteStates.get(entry));
  const retainedRoute = atlasRouteStates.get(targetEntry) ?? null;
  const actionClaim = productActionCoordinator.tryClaim(operation);
  if (actionClaim === null) {
    lastArc9AtlasRowStatus = 'Another expedition action is still settling.';
    if (openPanelId() === 'atlas') fillAtlas();
    return false;
  }
  clearArc9AtlasUndo();
  const actionBarrier = actionClaim.barrier;
  productActionInFlight = true;
  activePersist = actionBarrier;
  arc9AtlasRowPending = Object.freeze({ kind: 'remove', atlasId });
  lastArc9AtlasRowStatus = null;
  if (openPanelId() === 'atlas') fillAtlas();
  let durable = false;
  let convergence = false;
  let published = false;
  try {
    await smokeProductActionHold.holdIfArmed(actionClaim.operation);
    await settleF4Heartbeat();
    if (smokeForceReadOnly || !f4RuntimeMayMutate(runtime)
      || importWriteInFlight || replacementTransaction || replacementReloadPending
      || trainingCheckpointWriteHeld || trainingActive() || ecologyEpochBlocksActions()
      || save.logMap.length !== priorRows.length
      || priorRows.some((pair, index) => save.logMap[index] !== pair)
      || priorRows.some(([, entry], index) => atlasRouteStates.get(entry) !== priorRoutes[index])
      || save.homeId !== priorHomeId) {
      lastArc9AtlasRowStatus = 'Atlas authority changed before Remove could settle. Nothing changed.';
      return false;
    }
    const outcome = await commitArc9AtlasRemoveV1({
      runtime,
      state: save,
      atlasId,
      codecNow: Date.now(),
    });
    if (outcome.kind === 'refused') {
      lastArc9AtlasRowStatus = 'Remove was refused because the exact Atlas authority could not be proved.';
      if (atlasRowRefusalNeedsReload(outcome)) {
        convergence = true;
        scheduleF4AuthorityConvergenceReload(runtime, 'Arc 9 Atlas Remove ' + outcome.detail);
      }
      return false;
    }
    durable = true;
    f4LastCheckpointAt = performance.now();
    lastPersistenceOutcome = 'arc9-atlas-remove-committed:' + outcome.transaction.revision;
    if (outcome.kind === 'committed-convergence') {
      convergence = true;
      lastArc9AtlasRowStatus = 'Remove committed; reloading its exact durable result without retry.';
      scheduleF4AuthorityConvergenceReload(runtime, 'Arc 9 Atlas Remove ' + outcome.detail);
      return true;
    }
    try {
      const checkpoint = runtime.checkpointParent();
      if (runtime !== f4Runtime || runtime.revision !== outcome.transaction.revision
        || checkpoint === null || checkpoint.homeId !== outcome.plan.homeIdAfter
        || JSON.stringify(checkpoint.logMap) !== JSON.stringify(outcome.transaction.state.logMap)) {
        throw new Error('Atlas Remove runtime did not retain its exact durable fixed point');
      }
      publishArc9AtlasRemoveFieldsV1(save, outcome);
      published = true;
      const survivors = priorRows.filter((_, index) => index !== targetIndex);
      if (save.logMap.length !== survivors.length
        || survivors.some((pair, index) => save.logMap[index] !== pair)
        || survivors.some(([, entry], index) => atlasRouteStates.get(entry) !== priorRoutes[
          index < targetIndex ? index : index + 1
        ])) {
        throw new Error('Atlas Remove publication replaced a surviving route-owning row');
      }
      if (retainedAtlasRouteMatches(targetPair, retainedRoute)) {
        const undo = Object.freeze({
          receipt: outcome.undoReceipt,
          pair: targetPair,
          route: retainedRoute,
          title,
          expiresAt: performance.now() + 8_000,
        });
        arc9AtlasUndo = undo;
        window.setTimeout(() => {
          if (arc9AtlasUndo === undo && performance.now() >= undo.expiresAt) {
            clearArc9AtlasUndo();
            if (openPanelId() === 'atlas') fillAtlas();
          }
        }, 8_050);
        lastArc9AtlasRowStatus = 'Removed ' + title + '. Undo is available for eight seconds.';
      } else {
        lastArc9AtlasRowStatus = 'Removed ' + title + '.';
      }
      toast('Atlas entry removed', lastArc9AtlasRowStatus, true);
      return true;
    } catch (error) {
      if (published && !save.logMap.includes(targetPair)) {
        save.logMap.splice(targetIndex, 0, targetPair);
      }
      save.homeId = priorHomeId;
      clearArc9AtlasUndo();
      convergence = true;
      lastArc9AtlasRowStatus = 'Remove committed, but presentation could not be verified. Reloading without retry.';
      scheduleF4AuthorityConvergenceReload(
        runtime,
        'Arc 9 Atlas Remove publication ' + (error instanceof Error ? error.message : String(error)),
      );
      return true;
    }
  } catch (error) {
    clearArc9AtlasUndo();
    lastArc9AtlasRowStatus = durable
      ? 'Remove became ambiguous after commit. Reloading without retry.'
      : 'Remove could not be completed. Nothing changed.';
    if (durable) {
      convergence = true;
      scheduleF4AuthorityConvergenceReload(
        runtime,
        'Arc 9 Atlas Remove fault ' + (error instanceof Error ? error.message : String(error)),
      );
    }
    return durable;
  } finally {
    productActionInFlight = false;
    actionClaim.settle(durable);
    arc9AtlasRowPending = null;
    if (activePersist === actionBarrier) activePersist = null;
    if (!convergence && openPanelId() === 'atlas') fillAtlas();
  }
}

async function runArc9AtlasUndo(): Promise<boolean> {
  const runtime = f4Runtime;
  const undo = liveArc9AtlasUndo();
  if (undo === null) {
    lastArc9AtlasRowStatus = 'That removal can no longer be undone.';
    if (openPanelId() === 'atlas') fillAtlas();
    return false;
  }
  if (arc9AtlasRowActionBlocked() || runtime === null) {
    lastArc9AtlasRowStatus = 'Undo is unavailable until the current expedition action settles.';
    if (openPanelId() === 'atlas') fillAtlas();
    return false;
  }
  let operation: string;
  try { operation = operationForArc9AtlasUndoV1(undo.receipt); }
  catch {
    clearArc9AtlasUndo();
    lastArc9AtlasRowStatus = 'That Undo receipt is no longer valid.';
    if (openPanelId() === 'atlas') fillAtlas();
    return false;
  }
  const actionClaim = productActionCoordinator.tryClaim(operation);
  if (actionClaim === null) {
    lastArc9AtlasRowStatus = 'Another expedition action is still settling.';
    if (openPanelId() === 'atlas') fillAtlas();
    return false;
  }
  const sourceStateJson = JSON.stringify(save);
  const actionBarrier = actionClaim.barrier;
  productActionInFlight = true;
  activePersist = actionBarrier;
  arc9AtlasUndoPending = true;
  lastArc9AtlasRowStatus = null;
  if (openPanelId() === 'atlas') fillAtlas();
  let durable = false;
  let convergence = false;
  let published = false;
  try {
    await smokeProductActionHold.holdIfArmed(actionClaim.operation);
    await settleF4Heartbeat();
    if (smokeForceReadOnly || !f4RuntimeMayMutate(runtime)
      || importWriteInFlight || replacementTransaction || replacementReloadPending
      || trainingCheckpointWriteHeld || trainingActive() || ecologyEpochBlocksActions()
      || arc9AtlasUndo !== undo || performance.now() >= undo.expiresAt
      || !retainedAtlasRouteMatches(undo.pair, undo.route)
      || JSON.stringify(save) !== sourceStateJson) {
      clearArc9AtlasUndo();
      lastArc9AtlasRowStatus = 'Atlas authority changed before Undo could settle. Nothing changed.';
      return false;
    }
    const outcome = await commitArc9AtlasUndoV1({
      runtime,
      state: save,
      deleteReceipt: undo.receipt,
      codecNow: Date.now(),
    });
    if (outcome.kind === 'refused') {
      clearArc9AtlasUndo();
      lastArc9AtlasRowStatus = 'Undo was refused because the exact removal successor could not be proved.';
      if (atlasRowRefusalNeedsReload(outcome)) {
        convergence = true;
        scheduleF4AuthorityConvergenceReload(runtime, 'Arc 9 Atlas Undo ' + outcome.detail);
      }
      return false;
    }
    durable = true;
    f4LastCheckpointAt = performance.now();
    lastPersistenceOutcome = 'arc9-atlas-undo-committed:' + outcome.transaction.revision;
    if (outcome.kind === 'committed-convergence') {
      clearArc9AtlasUndo();
      convergence = true;
      lastArc9AtlasRowStatus = 'Undo committed; reloading its exact durable result without retry.';
      scheduleF4AuthorityConvergenceReload(runtime, 'Arc 9 Atlas Undo ' + outcome.detail);
      return true;
    }
    try {
      const checkpoint = runtime.checkpointParent();
      const checkpointPair = checkpoint?.logMap[outcome.plan.targetIndex];
      if (runtime !== f4Runtime || runtime.revision !== outcome.transaction.revision
        || checkpoint === null || checkpoint.homeId !== outcome.plan.homeIdAfter
        || checkpointPair?.[0] !== outcome.plan.atlasId
        || JSON.stringify(checkpointPair) !== outcome.plan.removedPairJson
        || !retainedAtlasRouteMatches(undo.pair, undo.route)) {
        throw new Error('Atlas Undo runtime did not retain its exact durable fixed point');
      }
      publishArc9AtlasUndoFieldsV1(save, outcome, undo.pair);
      published = true;
      if (save.logMap[outcome.plan.targetIndex] !== undo.pair
        || !retainedAtlasRouteMatches(undo.pair, undo.route)) {
        throw new Error('Atlas Undo did not restore the exact route-owning pair');
      }
      clearArc9AtlasUndo();
      lastArc9AtlasRowStatus = 'Restored ' + undo.title + ' to its original Atlas position.';
      toast('Atlas removal undone', lastArc9AtlasRowStatus, true);
      return true;
    } catch (error) {
      if (published && save.logMap[outcome.plan.targetIndex] === undo.pair) {
        save.logMap.splice(outcome.plan.targetIndex, 1);
        save.homeId = outcome.plan.homeIdBefore;
      }
      clearArc9AtlasUndo();
      convergence = true;
      lastArc9AtlasRowStatus = 'Undo committed, but presentation could not be verified. Reloading without retry.';
      scheduleF4AuthorityConvergenceReload(
        runtime,
        'Arc 9 Atlas Undo publication ' + (error instanceof Error ? error.message : String(error)),
      );
      return true;
    }
  } catch (error) {
    clearArc9AtlasUndo();
    lastArc9AtlasRowStatus = durable
      ? 'Undo became ambiguous after commit. Reloading without retry.'
      : 'Undo could not be completed. Nothing changed.';
    if (durable) {
      convergence = true;
      scheduleF4AuthorityConvergenceReload(
        runtime,
        'Arc 9 Atlas Undo fault ' + (error instanceof Error ? error.message : String(error)),
      );
    }
    return durable;
  } finally {
    productActionInFlight = false;
    actionClaim.settle(durable);
    arc9AtlasUndoPending = false;
    if (activePersist === actionBarrier) activePersist = null;
    if (!convergence && openPanelId() === 'atlas') fillAtlas();
  }
}

async function runArc9AtlasFavoriteChange(
  atlasId: string,
  desired: boolean,
): Promise<boolean> {
  const runtime = f4Runtime;
  if (arc9AtlasFavoritePendingId !== null || arc9AtlasRowPending !== null
    || arc9AtlasUndoPending || smokeForceReadOnly
    || !f4RuntimeMayMutate(runtime) || activePersist || importWriteInFlight
    || replacementTransaction || replacementReloadPending
    || trainingCheckpointWriteHeld || trainingActive() || ecologyEpochBlocksActions()) {
    lastArc9AtlasFavoriteOutcome = 'unavailable:write-authority';
    return false;
  }
  let operation: string;
  try { operation = operationForArc9AtlasFavoriteV1(atlasId); }
  catch {
    lastArc9AtlasFavoriteOutcome = 'refused:atlas-id-shape';
    return false;
  }
  const targetIndex = save.logMap.findIndex(([id]) => id === atlasId);
  const targetPair = targetIndex < 0 ? null : save.logMap[targetIndex] ?? null;
  const targetEntry = targetPair?.[1] ?? null;
  if (targetEntry === null || typeof targetEntry.fav !== 'boolean') {
    lastArc9AtlasFavoriteOutcome = 'refused:atlas-target-missing';
    return false;
  }
  const actionClaim = productActionCoordinator.tryClaim(operation);
  if (actionClaim === null) {
    lastArc9AtlasFavoriteOutcome = 'unavailable:product-action-pending';
    return false;
  }
  clearArc9AtlasUndo();
  const actionBarrier = actionClaim.barrier;
  const priorFavorite = targetEntry.fav;
  const priorStats = save.stats;
  const priorUnlocked = save.unlocked;
  const priorRoute = atlasRouteStates.get(targetEntry);
  productActionInFlight = true;
  activePersist = actionBarrier;
  arc9AtlasFavoritePendingId = atlasId;
  if (openPanelId() === 'atlas') fillAtlas();
  let durable = false;
  let outcome: Arc9AtlasFavoriteActionOutcomeV1 | null = null;
  try {
    await smokeProductActionHold.holdIfArmed(actionClaim.operation);
    await settleF4Heartbeat();
    if (smokeForceReadOnly || !f4RuntimeMayMutate(runtime)
      || importWriteInFlight || replacementTransaction || replacementReloadPending
      || trainingCheckpointWriteHeld || trainingActive() || ecologyEpochBlocksActions()
      || save.logMap[targetIndex] !== targetPair
      || targetPair[1] !== targetEntry || targetEntry.fav !== priorFavorite) {
      lastArc9AtlasFavoriteOutcome = 'refused:authority-changed';
      return false;
    }
    outcome = await commitArc9AtlasFavoriteV1({
      runtime,
      state: save,
      atlasId,
      desired,
      codecNow: Date.now(),
    });
    if (outcome.kind === 'refused') {
      lastArc9AtlasFavoriteOutcome = `refused:${outcome.detail}`;
      if (outcome.convergence === 'read-only-reload') {
        scheduleF4AuthorityConvergenceReload(
          runtime,
          `Arc 9 Atlas Favorite authority ${outcome.detail}`,
        );
      } else if (outcome.detail.includes('capacity')) {
        toast(
          'Atlas record protected',
          'This Favorite could not be changed safely; your current Atlas remains unchanged.',
          true,
        );
      }
      return false;
    }
    if (outcome.kind === 'current') {
      lastArc9AtlasFavoriteOutcome = `current:${outcome.favorite}`;
      return true;
    }

    durable = true;
    f4LastCheckpointAt = performance.now();
    lastPersistenceOutcome = `arc9-atlas-favorite-committed:${outcome.transaction.revision}`;
    if (outcome.kind === 'committed-convergence') {
      lastArc9AtlasFavoriteOutcome = `committed-convergence:${outcome.detail}`;
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Arc 9 Atlas Favorite committed; ${outcome.detail}`,
      );
      return true;
    }

    try {
      const checkpoint = runtime.checkpointParent();
      const checkpointPair = checkpoint?.logMap[outcome.targetIndex];
      if (runtime !== f4Runtime
        || runtime.revision !== outcome.transaction.revision
        || checkpoint === null
        || checkpointPair?.[0] !== outcome.atlasId
        || checkpointPair[1].fav !== outcome.favoriteAfter
        || checkpoint.stats.bestRank !== outcome.nextBestRankIndex
        || JSON.stringify(checkpoint.unlocked) !== JSON.stringify(outcome.nextUnlockedIds)) {
        throw new Error('Atlas Favorite runtime did not retain its exact durable fixed point');
      }
      publishArc9AtlasFavoriteFieldsV1(save, outcome);
      if (save.logMap[targetIndex] !== targetPair
        || targetPair[1] !== targetEntry
        || atlasRouteStates.get(targetEntry) !== priorRoute) {
        throw new Error('Atlas Favorite publication replaced its route-owning row');
      }
      lastArc9AtlasFavoriteOutcome = `committed:${priorFavorite}->${outcome.favoriteAfter}`;
      updateChips();
      if (openPanelId() === 'rec') fillRecords();
      toast(
        outcome.favoriteAfter ? '★ Atlas Favorite' : '☆ Favorite removed',
        outcome.favoriteAfter
          ? 'This exact charted place is now marked as a Favorite.'
          : 'This place remains charted and travel-ready without its Favorite mark.',
        true,
      );
      presentProgressionCeremony({
        revision: outcome.transaction.revision,
        disposition: 'committed-publication',
        priorUnlockedIds: outcome.priorUnlockedIds,
        nextUnlockedIds: outcome.nextUnlockedIds,
        addedAchievementIds: [
          ...(outcome.curatorAdded ? ['curator'] : []),
          ...outcome.addedAggregateAchievementIds,
        ],
        priorBestRankIndex: outcome.priorBestRankIndex,
        nextBestRankIndex: outcome.nextBestRankIndex,
      });
      return true;
    } catch (error) {
      targetEntry.fav = priorFavorite;
      save.stats = priorStats;
      save.unlocked = priorUnlocked;
      lastArc9AtlasFavoriteOutcome = 'committed-publication-reload';
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Arc 9 Atlas Favorite committed; publication ${error instanceof Error ? error.message : String(error)}`,
      );
      return true;
    }
  } catch (error) {
    if (durable) {
      targetEntry.fav = priorFavorite;
      save.stats = priorStats;
      save.unlocked = priorUnlocked;
    }
    lastArc9AtlasFavoriteOutcome = `${durable ? 'committed-' : ''}fault`;
    scheduleF4AuthorityConvergenceReload(
      runtime,
      `Arc 9 Atlas Favorite ${lastArc9AtlasFavoriteOutcome}: ${error instanceof Error ? error.message : String(error)}`,
    );
    return durable;
  } finally {
    productActionInFlight = false;
    actionClaim.settle(durable);
    arc9AtlasFavoritePendingId = null;
    if (activePersist === actionBarrier) activePersist = null;
    if (openPanelId() === 'atlas') {
      fillAtlas();
    }
  }
}

function freshCurrentBioscanReady(
  ownedActionBarrier: Promise<boolean> | null = null,
): Extract<BioscanCardStateV1, { readonly kind: 'ready' }> | null {
  const address = activeCardWorldAddress();
  if (address === null) return null;
  const retained = currentBioscanCardState?.kind === 'ready'
    && currentBioscanCardState.worldKey === address.key
    && currentBioscanCardState.roster.ecologyEpoch === currentEcologyEpoch()
    ? currentBioscanCardState.roster : null;
  const roster = canonicalRosterForBioscanCard(address, retained);
  const projection = projectCurrentBioscanCardState(address, roster, ownedActionBarrier);
  return projection.kind === 'ready' ? projection : null;
}

function protectArc9BioscanAfterDurability(
  runtime: F4RuntimeAuthority,
  detail: string,
): void {
  lastArc9BioscanResult = null;
  lastArc9BioscanOutcome = 'committed-publication-reload';
  lastArc9SurveyOutcome = 'committed:bioscan-publication-reload';
  arc5OwnershipState = null;
  arc5OwnershipEvidence = null;
  arc5OwnershipProtection = 'committed-publication-reload';
  lastArc5BootstrapOutcome = 'bioscan-committed-publication-reload';
  scheduleF4AuthorityConvergenceReload(runtime, detail);
}

/** The one player-live living-world Survey writer. Card inspection and Land
 * remain write-free; this explicit action owns one Survey record, one hazard
 * draw, and any Scout/explorer consequence in the same F4 transaction. */
async function runArc9Bioscan(): Promise<boolean> {
  if (blockPlayerMutation('bioscan')) return false;
  const runtime = f4Runtime;
  const initial = freshCurrentBioscanReady();
  if (initial === null || !f4RuntimeMayMutate(runtime)) {
    lastArc9BioscanResult = null;
    lastArc9BioscanOutcome = 'unavailable:presentation-or-write-authority';
    toast(
      'Discover Life unavailable',
      'Keep this living world open until expedition save authority is ready.',
    );
    refreshPlanetSurveyCard();
    return false;
  }
  const operation = initial.projection.survey.operation;
  const actionClaim = productActionCoordinator.tryClaim(operation);
  if (actionClaim === null) {
    lastArc9BioscanOutcome = 'unavailable:product-action-pending';
    return false;
  }
  const actionBarrier = actionClaim.barrier;
  const sourceState = save;
  const sourceStateJson = JSON.stringify(sourceState);
  const parentOwnership = initial.ownershipV2;
  const parentEvidence = arc5OwnershipEvidence;
  const parentOwnershipDigest = ownershipStateDigestV2(parentOwnership);
  const parentOwnershipRevision = parentOwnership.revision;
  const intent = Object.freeze({
    worldKey: initial.worldKey,
    ecologyEpoch: initial.roster.ecologyEpoch,
    rosterFingerprint: initial.roster.fullRosterFingerprint,
    operation,
    capabilityFingerprint: initial.capabilities.fingerprint,
    hazard: JSON.stringify(initial.projection.hazard),
  });
  const priorPublication = Object.freeze({
    surveyedSet: save.surveyedSet,
    ptypesSeen: save.ptypesSeen,
    starKindsSeen: save.starKindsSeen,
    codex: save.codex,
    hp: save.hp,
    stats: save.stats,
    unlocked: save.unlocked,
    chacc: save.chacc,
    chDone: save.chDone,
    chProg: save.chProg,
    essence: save.essence,
    items: save.items,
    equip: save.equip,
    equipAff: save.equipAff,
    arc2LootState,
    starterStatus: lastStarterCharterAcceptStatus,
    ownershipState: arc5OwnershipState,
    ownershipEvidence: arc5OwnershipEvidence,
    ownershipProtection: arc5OwnershipProtection,
    ownershipBootstrapOutcome: lastArc5BootstrapOutcome,
  });
  lastArc9BioscanResult = null;
  lastArc9BioscanOutcome = 'pending';
  productActionInFlight = true;
  activePersist = actionBarrier;
  let durable = false;
  const restorePublication = (): void => {
    sourceState.surveyedSet = priorPublication.surveyedSet;
    sourceState.ptypesSeen = priorPublication.ptypesSeen;
    sourceState.starKindsSeen = priorPublication.starKindsSeen;
    sourceState.codex = priorPublication.codex;
    sourceState.hp = priorPublication.hp;
    sourceState.stats = priorPublication.stats;
    sourceState.unlocked = priorPublication.unlocked;
    sourceState.chacc = priorPublication.chacc;
    sourceState.chDone = priorPublication.chDone;
    sourceState.chProg = priorPublication.chProg;
    sourceState.essence = priorPublication.essence;
    sourceState.items = priorPublication.items;
    sourceState.equip = priorPublication.equip;
    sourceState.equipAff = priorPublication.equipAff;
    arc2LootState = priorPublication.arc2LootState;
    lastStarterCharterAcceptStatus = priorPublication.starterStatus;
    arc5OwnershipState = priorPublication.ownershipState;
    arc5OwnershipEvidence = priorPublication.ownershipEvidence;
    arc5OwnershipProtection = priorPublication.ownershipProtection;
    lastArc5BootstrapOutcome = priorPublication.ownershipBootstrapOutcome;
    try { inventoryPanelController.setState(arc2LootState); }
    catch { /* the replacement document owns recovery */ }
  };
  try {
    await smokeProductActionHold.holdIfArmed(actionClaim.operation);
    await settleF4Heartbeat();
    const fresh = freshCurrentBioscanReady(actionBarrier);
    if (!f4RuntimeMayMutate(runtime) || importWriteInFlight
      || replacementTransaction || replacementReloadPending
      || trainingCheckpointWriteHeld || trainingActive() || ecologyEpochBlocksActions()
      || save !== sourceState || JSON.stringify(sourceState) !== sourceStateJson
      || fresh === null || fresh.worldKey !== intent.worldKey
      || fresh.roster.ecologyEpoch !== intent.ecologyEpoch
      || fresh.roster.fullRosterFingerprint !== intent.rosterFingerprint
      || fresh.projection.survey.operation !== intent.operation
      || fresh.capabilities.fingerprint !== intent.capabilityFingerprint
      || JSON.stringify(fresh.projection.hazard) !== intent.hazard
      || fresh.ownershipV2 !== parentOwnership
      || arc5OwnershipEvidence !== parentEvidence
      || ownershipStateDigestV2(fresh.ownershipV2) !== parentOwnershipDigest) {
      lastArc9BioscanOutcome = 'refused:authority-changed';
      return false;
    }
    const attempt = await commitBioscanActionV1({
      runtime,
      ownershipV2: fresh.ownershipV2,
      engineering: fresh.engineering,
      capabilities: fresh.capabilities,
      state: sourceState,
      address: fresh.address,
      roster: fresh.roster,
      opportunity: fresh.opportunity,
      settled: fresh.projection.hazard.safeReason === 'settled',
      codecNow: Date.now(),
    });
    if (attempt.kind === 'refused') {
      lastArc9BioscanOutcome = `refused:${attempt.detail}`;
      if (attempt.convergence === 'read-only-reload') {
        scheduleF4AuthorityConvergenceReload(runtime, `Arc 9 Bioscan authority ${attempt.detail}`);
      } else if (attempt.detail.includes('capacity')) {
        toast(
          'Life record full',
          'This bioscan could not be added safely; your expedition remains unchanged.',
          true,
        );
      }
      return false;
    }

    durable = true;
    f4LastCheckpointAt = performance.now();
    lastPersistenceOutcome = `arc9-bioscan-committed:${attempt.transaction.revision}`;
    if (attempt.kind === 'committed-convergence') {
      protectArc9BioscanAfterDurability(
        runtime,
        `Arc 9 Bioscan committed at revision ${attempt.transaction.revision}; ${attempt.detail}`,
      );
      return true;
    }

    try {
      const checkpoint = runtime.checkpointParent();
      const loadedOwnership = readArc5OwnershipMigration(
        runtime.extensions,
        SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      );
      const paragonAdded = attempt.paragon.kind === 'added';
      const scoutChanged = attempt.settlement.successor !== null;
      const ownershipChanged = paragonAdded || scoutChanged;
      const starterGearChanged = attempt.starterCharter.completions.some(
        ({ gearId }) => gearId !== null,
      );
      let committedBioscanLootState = arc2LootState;
      if (starterGearChanged) {
        const loadedLoot = readArc2Loot(runtime.extensions);
        if (loadedLoot.kind !== 'loaded'
          || loadedLoot.state.kind !== 'inventory'
          || attempt.arc2LootState === null
          || JSON.stringify(encodeArc2LootCarrier(loadedLoot.state))
            !== JSON.stringify(encodeArc2LootCarrier(attempt.arc2LootState))
          || !arc2LootLegacyMirrorMatches(loadedLoot.state, attempt.state)) {
          throw new Error('Arc 9 Bioscan Starter Charter gear did not retain its exact durable fixed point');
        }
        committedBioscanLootState = loadedLoot.state;
      }
      const expectedOwnershipTargets = paragonAdded
        ? [...ARC4_OWNERSHIP_EXTENSION_TARGETS, ...ARC5_OWNERSHIP_EXTENSION_TARGETS]
        : scoutChanged ? ARC5_OWNERSHIP_EXTENSION_TARGETS : [];
      const writesMatch = ownershipChanged
        ? attempt.ownershipWrites.length === expectedOwnershipTargets.length
          && attempt.ownershipWrites.every((write, index) => (
            write.segment === expectedOwnershipTargets[index]!.segment
            && write.namespace === expectedOwnershipTargets[index]!.namespace
          ))
        : attempt.ownershipWrites.length === 0;
      if (runtime !== f4Runtime
        || runtime.revision !== attempt.transaction.revision
        || checkpoint === null || JSON.stringify(checkpoint) !== JSON.stringify(attempt.state)
        || save !== sourceState || JSON.stringify(sourceState) !== sourceStateJson
        || attempt.settlement.preflight.parentRevision !== parentOwnershipRevision
        || attempt.settlement.preflight.parentDigest !== parentOwnershipDigest
        || attempt.ownershipV2.revision !== parentOwnershipRevision + (ownershipChanged ? 1 : 0)
        || !writesMatch
        || loadedOwnership.kind !== 'loaded'
        || ownershipStateDigestV2(loadedOwnership.state)
          !== ownershipStateDigestV2(attempt.ownershipV2)
        || (!paragonAdded && ownershipStateDigestV2(attempt.ownershipV2)
          !== ownershipStateDigestV2(attempt.settlement.successor ?? parentOwnership))
        || (ownershipChanged
          ? attempt.ownershipV2Evidence?.representationVersion
            !== ARC5_OWNERSHIP_MIGRATION_VERSION
          : attempt.ownershipV2Evidence !== null)) {
        throw new Error('arc9-bioscan-fixed-point-mismatch');
      }
      publishBioscanActionV1(sourceState, attempt);
      if (attempt.starterCharter.changed) {
        arc2LootState = committedBioscanLootState;
        inventoryPanelController.setState(arc2LootState);
        const completions = attempt.starterCharter.completions;
        if (completions.length > 0) {
          const titles = completions.map(({ title }) => title).join(', ');
          const rewards = completions.map((completion) => `+${completion.stardust} Stardust`
            + (completion.gearId === null ? '' : ` + ${completion.gearId} starter gear`)).join(' · ');
          lastStarterCharterAcceptStatus = `Completed ${titles}. Reward: ${rewards}.`;
        }
      }
      if (ownershipChanged) {
        arc5OwnershipState = attempt.ownershipV2;
        arc5OwnershipEvidence = attempt.ownershipV2Evidence;
        arc5OwnershipProtection = null;
        lastArc5BootstrapOutcome = 'bioscan-committed-published';
      }
      const target = attempt.settlement.target;
      lastArc9BioscanResult = Object.freeze({
        worldKey: fresh.worldKey,
        target,
        probability: attempt.hazard.probability,
        damage: attempt.settlement.damage,
        hpBefore: attempt.publication.hpBefore,
        hpAfter: attempt.publication.hpAfter,
        scoutId: attempt.settlement.scoutAfter?.creatureId ?? null,
        scoutHurtAfter: attempt.settlement.scoutAfter?.hurt ?? null,
        receiptOrdinal: attempt.settlement.receiptEvidence.ordinal,
        revision: attempt.transaction.revision,
        ownershipRevision: attempt.ownershipV2.revision,
      });
      lastArc9BioscanOutcome = `committed:${target}:${attempt.transaction.revision}`;
      lastArc9SurveyOutcome = 'committed:bioscan:world';
    } catch (error) {
      restorePublication();
      protectArc9BioscanAfterDurability(
        runtime,
        `Arc 9 Bioscan committed at revision ${attempt.transaction.revision}; publication ${error instanceof Error ? error.message : String(error)}`,
      );
      return true;
    }

    try {
      hudText();
      updateChips();
      if (attempt.settlement.successor !== null || attempt.paragon.kind === 'added') {
        refreshCompendiumFeedState();
      }
      if (attempt.starterCharter.changed && openPanelId() === 'ch') fillCharters();
      if (openPanelId() === 'rec') fillRecords();
      if (attempt.starterCharter.changed && openPanelId() === 'shipyard') refreshEngineeringPanelState();
      gameEvent('bioscan', { worldKey: fresh.worldKey });
      if (attempt.settlement.hostile) triggerCameraShake();
      const additions = [
        ...attempt.survey.addedEventAchievementIds,
        ...attempt.survey.addedAggregateAchievementIds,
        ...attempt.achievementIdsAdded,
        ...attempt.postHazardAggregateAchievementIdsAdded,
        ...attempt.starterCharter.addedAchievementIds,
      ];
      presentProgressionCeremony({
        revision: attempt.transaction.revision,
        disposition: 'committed-publication',
        priorUnlockedIds: attempt.survey.source.unlocked,
        nextUnlockedIds: attempt.state.unlocked,
        addedAchievementIds: additions,
        priorBestRankIndex: attempt.survey.source.bestRank,
        nextBestRankIndex: attempt.state.stats.bestRank ?? 0,
      });
      if (attempt.starterCharter.completions.length > 0) {
        const completions = attempt.starterCharter.completions;
        const titles = completions.map(({ title }) => title).join(', ');
        const rewards = completions.map((completion) => `+${completion.stardust} Stardust`
          + (completion.gearId === null ? '' : ` + ${completion.gearId} starter gear`)).join(' · ');
        toastCharterCompletion(
          completions.length === 1
            ? `★ ${titles} — Starter Charter complete`
            : `★ ${completions.length} Starter Charters — complete`,
          `${titles} · Reward: ${rewards}.`,
        );
      }
      if (attempt.paragon.kind === 'added' && attempt.paragon.codexId !== null) {
        const paragonEntry = attempt.state.codex.find(
          ([id]) => id === attempt.paragon.codexId,
        )?.[1];
        if (paragonEntry !== undefined) {
          toast(
            '🏲 Paragon discovered',
            `${paragonEntry.name} has joined the Fifty-Paragon record.`,
            true,
          );
          if (typeof paragonEntry.tier === 'number') playRaritySting(paragonEntry.tier);
        }
      }
      if (attempt.settlement.target === 'explorer') {
        toast(
          '⚠ Hostile life encountered',
          `Field exposure cost ${attempt.settlement.damage} HP. Explorer health: ${attempt.publication.hpAfter}.`,
          true,
        );
      } else if (attempt.settlement.target === 'scout') {
        const scoutName = attempt.settlement.scoutAfter?.nickname || 'Field Scout';
        toast(
          '🛡️ Scout intercepted the threat',
          `${scoutName} protected you and is now at ${Math.round((attempt.settlement.scoutAfter?.hurt ?? 0) * 100)}% injury.`,
          true,
        );
      } else {
        toast(
          '🔬 Life recorded',
          `${fresh.roster.view.all.length} life signatures entered in Records. Capture remains a separate action.`,
          true,
        );
      }
    } catch { /* durable publication remains authoritative if presentation fails */ }
    return true;
  } catch (error) {
    if (durable) {
      restorePublication();
      protectArc9BioscanAfterDurability(
        runtime,
        `Arc 9 Bioscan committed; publication ${error instanceof Error ? error.message : String(error)}`,
      );
      return true;
    }
    lastArc9BioscanResult = null;
    lastArc9BioscanOutcome = `fault:${error instanceof Error ? error.message : String(error)}`;
    scheduleF4AuthorityConvergenceReload(runtime, `Arc 9 Bioscan ${lastArc9BioscanOutcome}`);
    return false;
  } finally {
    productActionInFlight = false;
    actionClaim.settle(durable);
    /* Bioscan's Survey successor already contains the Arc 9 aggregate fixed
       point; a second progression receipt would violate the one-CAS law. */
    if (activePersist === actionBarrier) activePersist = null;
    if (!f4AuthorityReloadScheduled) {
      try { refreshPlanetSurveyCard(); }
      catch { /* the next card-open reconstructs the durable projection */ }
    }
  }
}

async function settleArc9Survey(address: Arc9SurveyAddressV1): Promise<boolean> {
  const runtime = f4Runtime;
  if (smokeForceReadOnly || !f4RuntimeMayMutate(runtime) || activePersist
    || importWriteInFlight || replacementTransaction || replacementReloadPending
    || trainingCheckpointWriteHeld || trainingActive() || ecologyEpochBlocksActions()) {
    lastArc9SurveyOutcome = 'unavailable:write-authority';
    return false;
  }
  let operation: string;
  try { operation = operationForArc9SurveyV1(address); }
  catch {
    lastArc9SurveyOutcome = 'refused:source-unproven';
    return false;
  }
  const actionClaim = productActionCoordinator.tryClaim(operation);
  if (actionClaim === null) {
    lastArc9SurveyOutcome = 'unavailable:product-action-pending';
    return false;
  }
  const actionBarrier = actionClaim.barrier;
  const priorSurveyedSet = save.surveyedSet;
  const priorPtypesSeen = save.ptypesSeen;
  const priorStarKindsSeen = save.starKindsSeen;
  const priorStats = save.stats;
  const priorUnlocked = save.unlocked;
  productActionInFlight = true;
  activePersist = actionBarrier;
  let durable = false;
  let outcome: Arc9SurveyActionOutcomeV1 | null = null;
  try {
    await smokeProductActionHold.holdIfArmed(actionClaim.operation);
    await settleF4Heartbeat();
    if (smokeForceReadOnly || !f4RuntimeMayMutate(runtime) || importWriteInFlight
      || replacementTransaction || replacementReloadPending
      || trainingCheckpointWriteHeld || trainingActive() || ecologyEpochBlocksActions()) {
      lastArc9SurveyOutcome = 'refused:authority-changed';
      return false;
    }
    outcome = await commitArc9SurveySettlementV1({
      runtime,
      state: save,
      address,
      codecNow: Date.now(),
    });
    if (outcome.kind === 'refused') {
      lastArc9SurveyOutcome = `refused:${outcome.detail}`;
      if (outcome.convergence === 'read-only-reload') {
        scheduleF4AuthorityConvergenceReload(
          runtime,
          `Arc 9 Survey authority ${outcome.detail}`,
        );
      } else if (outcome.detail.includes('capacity')) {
        toast(
          'Survey record full',
          'This observation could not be added safely; your current expedition remains unchanged.',
          true,
        );
      } else if (outcome.detail.includes('achievement:')
        || outcome.detail.includes('progression:')) {
        toast(
          'Records protected',
          'This observation was not recorded because its achievement ledger cannot be extended safely.',
          true,
        );
      }
      return false;
    }
    if (outcome.kind === 'current') {
      lastArc9SurveyOutcome = `current:${outcome.facts.target}`;
      return true;
    }

    durable = true;
    f4LastCheckpointAt = performance.now();
    lastPersistenceOutcome = `arc9-survey-committed:${outcome.transaction.revision}`;
    if (outcome.kind === 'committed-convergence') {
      lastArc9SurveyOutcome = `committed-convergence:${outcome.detail}`;
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Arc 9 Survey committed; ${outcome.detail} (${outcome.mismatch.join(',')})`,
      );
      return true;
    }

    try {
      const checkpoint = runtime.checkpointParent();
      if (runtime !== f4Runtime
        || runtime.revision !== outcome.transaction.revision
        || checkpoint === null
        || JSON.stringify(checkpoint.surveyedSet)
          !== JSON.stringify(outcome.successor.surveyedSet)
        || JSON.stringify(checkpoint.ptypesSeen)
          !== JSON.stringify(outcome.successor.ptypesSeen)
        || JSON.stringify(checkpoint.starKindsSeen)
          !== JSON.stringify(outcome.successor.starKindsSeen)
        || checkpoint.stats.surveys !== outcome.successor.surveys
        || checkpoint.stats.bestRank !== outcome.successor.bestRank
        || JSON.stringify(checkpoint.unlocked) !== JSON.stringify(outcome.successor.unlocked)) {
        throw new Error('Survey runtime did not retain its exact durable fixed point');
      }
      publishArc9SurveyFieldsV1(save, outcome);
      const additions = [
        ...outcome.addedEventAchievementIds,
        ...outcome.addedAggregateAchievementIds,
      ];
      lastArc9SurveyOutcome = `committed:${outcome.facts.target}:${additions.join(',') || 'records'}`;
      updateChips();
      if (openPanelId() === 'rec') fillRecords();
      presentProgressionCeremony({
        revision: outcome.transaction.revision,
        disposition: 'committed-publication',
        priorUnlockedIds: outcome.source.unlocked,
        nextUnlockedIds: outcome.successor.unlocked,
        addedAchievementIds: additions,
        priorBestRankIndex: outcome.source.bestRank,
        nextBestRankIndex: outcome.successor.bestRank,
      });
      return true;
    } catch (error) {
      save.surveyedSet = priorSurveyedSet;
      save.ptypesSeen = priorPtypesSeen;
      save.starKindsSeen = priorStarKindsSeen;
      save.stats = priorStats;
      save.unlocked = priorUnlocked;
      lastArc9SurveyOutcome = 'committed-publication-reload';
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Arc 9 Survey committed; publication ${error instanceof Error ? error.message : String(error)}`,
      );
      return true;
    }
  } catch (error) {
    if (durable) {
      save.surveyedSet = priorSurveyedSet;
      save.ptypesSeen = priorPtypesSeen;
      save.starKindsSeen = priorStarKindsSeen;
      save.stats = priorStats;
      save.unlocked = priorUnlocked;
    }
    lastArc9SurveyOutcome = `${durable ? 'committed-' : ''}fault`;
    scheduleF4AuthorityConvergenceReload(
      runtime,
      `Arc 9 Survey ${lastArc9SurveyOutcome}: ${error instanceof Error ? error.message : String(error)}`,
    );
    return durable;
  } finally {
    productActionInFlight = false;
    actionClaim.settle(durable);
    /* The Survey receipt already contains the Arc 9 aggregate fixed point;
       queuing a second progression receipt would violate its one-CAS law. */
    if (activePersist === actionBarrier) activePersist = null;
  }
}

async function runArc9ExplorerNameChange(rawName: string): Promise<void> {
  const runtime = f4Runtime;
  const priorLiveName = save.explorerName;
  const preflight = prepareArc9ExplorerNameChangeV1(save, rawName);
  if (preflight.kind === 'noop') {
    lastArc9ExplorerNameOutcome = `noop:${preflight.reason}`;
    if (openPanelId() === 'set') {
      fillSettings();
      document.querySelector<HTMLElement>('#setpanel [data-arc9-explorer-name-input]')?.focus();
    }
    toast(
      'Explorer name unchanged',
      preflight.reason === 'cleaned-empty'
        ? 'Those characters cannot ride in a name. Try letters, numbers, or an emoji.'
        : 'Enter a different explorer name.',
    );
    return;
  }
  if (preflight.kind === 'protected') {
    lastArc9ExplorerNameOutcome = `refused:preflight:${preflight.reason}`;
    if (openPanelId() === 'set') fillSettings();
    toast('Explorer name unavailable', 'Reload after restoring save authority.');
    return;
  }
  if (!f4RuntimeMayMutate(runtime) || activePersist || importWriteInFlight
    || replacementTransaction || replacementReloadPending || trainingCheckpointWriteHeld
    || ecologyEpochBlocksActions()) {
    lastArc9ExplorerNameOutcome = 'unavailable:write-authority';
    if (openPanelId() === 'set') fillSettings();
    toast('Explorer name unavailable', 'Finish the current save operation, then try again.');
    return;
  }
  const actionClaim = productActionCoordinator.tryClaim(ARC9_EXPLORER_NAME_OPERATION_V1);
  if (actionClaim === null) {
    lastArc9ExplorerNameOutcome = 'unavailable:product-action-pending';
    if (openPanelId() === 'set') fillSettings();
    toast('Explorer name unavailable', 'Another expedition action is still settling.');
    return;
  }
  const actionBarrier = actionClaim.barrier;
  productActionInFlight = true;
  activePersist = actionBarrier;
  arc9ExplorerNamePending = true;
  lastArc9ExplorerNameOutcome = 'pending';
  let durable = false;
  let convergence = false;
  let outcome: Arc9ExplorerNameActionOutcomeV1 | null = null;
  try {
    await smokeProductActionHold.holdIfArmed(actionClaim.operation);
    await settleF4Heartbeat();
    if (!f4RuntimeMayMutate(runtime) || importWriteInFlight
      || replacementTransaction || replacementReloadPending || trainingCheckpointWriteHeld
      || ecologyEpochBlocksActions()) {
      lastArc9ExplorerNameOutcome = 'refused:authority-changed';
      return;
    }
    outcome = await commitArc9ExplorerNameChangeV1({
      runtime,
      state: save,
      rawName,
      codecNow: Date.now(),
    });
    if (outcome.kind === 'noop') {
      lastArc9ExplorerNameOutcome = `noop:${outcome.reason}`;
      toast('Explorer name unchanged', 'Enter a different explorer name.');
      return;
    }
    if (outcome.kind === 'refused') {
      lastArc9ExplorerNameOutcome = `refused:${outcome.detail}`;
      if (outcome.convergence === 'read-only-reload') {
        convergence = true;
        scheduleF4AuthorityConvergenceReload(
          runtime,
          `Arc 9 explorer-name authority ${outcome.detail}`,
        );
      } else {
        toast('Explorer name unavailable', 'Nothing changed. Enter a valid name and try again.');
      }
      return;
    }

    durable = true;
    f4LastCheckpointAt = performance.now();
    if (outcome.kind === 'committed-convergence') {
      convergence = true;
      lastArc9ExplorerNameOutcome = `committed-convergence:${outcome.detail}`;
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Arc 9 explorer name committed; ${outcome.detail}`,
      );
      return;
    }
    try {
      const checkpoint = runtime.checkpointParent();
      if (runtime !== f4Runtime
        || runtime.revision !== outcome.transaction.revision
        || checkpoint === null
        || checkpoint.explorerName !== outcome.explorerName
        || outcome.transaction.state.explorerName !== outcome.explorerName) {
        throw new Error('explorer-name runtime did not retain its exact durable checkpoint');
      }
      save.explorerName = outcome.explorerName;
      arc9ExplorerNameEditing = false;
      lastPersistenceOutcome = `arc9-explorer-name-committed:${outcome.transaction.revision}`;
      lastArc9ExplorerNameOutcome = `committed:${outcome.previousName}->${outcome.explorerName}`;
      updateChips();
      toast(
        `Welcome, ${outcome.explorerName}`,
        'Your expedition record and future shares now carry this name.',
      );
    } catch (error) {
      save.explorerName = priorLiveName;
      convergence = true;
      lastArc9ExplorerNameOutcome = 'committed-publication-reload';
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Arc 9 explorer name committed; publication ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  } catch (error) {
    lastArc9ExplorerNameOutcome = `${durable ? 'committed-' : ''}fault`;
    if (durable) {
      save.explorerName = priorLiveName;
      convergence = true;
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Arc 9 explorer name committed; presentation ${error instanceof Error ? error.message : String(error)}`,
      );
    } else {
      toast('Explorer name unavailable', 'Nothing changed. Try again after save authority settles.');
    }
  } finally {
    arc9ExplorerNamePending = false;
    productActionInFlight = false;
    actionClaim.settle(durable);
    if (activePersist === actionBarrier) activePersist = null;
    if (!convergence && openPanelId() === 'set') {
      try {
        fillSettings();
        document.querySelector<HTMLElement>(arc9ExplorerNameEditing
          ? '#setpanel [data-arc9-explorer-name-input]'
          : '#setpanel [data-arc9-explorer-name-open]')?.focus();
      } catch (error) {
        if (durable) {
          save.explorerName = priorLiveName;
          try { updateChips(); } catch { /* the replacement document owns recovery */ }
          scheduleF4AuthorityConvergenceReload(
            runtime,
            `Arc 9 explorer name committed; Settings publication ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    }
  }
}

async function runArc9FrontierEndingChoice(requestedEndingId: string): Promise<void> {
  const runtime = f4Runtime;
  const priorLiveEnding = save.frontierEnding;
  if (smokeForceReadOnly || !f4RuntimeMayMutate(runtime) || activePersist || importWriteInFlight
    || replacementTransaction || replacementReloadPending || trainingCheckpointWriteHeld
    || trainingActive() || ecologyEpochBlocksActions()) {
    lastArc9FrontierEndingOutcome = 'unavailable:write-authority';
    if (openPanelId() === 'prime') fillPrimeCodex();
    toast('Frontier ending unavailable', 'Finish the current expedition save, then choose your legacy again.');
    return;
  }
  const actionClaim = productActionCoordinator.tryClaim(ARC9_FRONTIER_ENDING_OPERATION_V1);
  if (actionClaim === null) {
    lastArc9FrontierEndingOutcome = 'unavailable:product-action-pending';
    if (openPanelId() === 'prime') fillPrimeCodex();
    toast('Frontier ending unavailable', 'Another expedition action is still settling.');
    return;
  }
  const actionBarrier = actionClaim.barrier;
  productActionInFlight = true;
  activePersist = actionBarrier;
  arc9FrontierEndingPending = true;
  lastArc9FrontierEndingOutcome = 'pending';
  let durable = false;
  let convergence = false;
  let outcome: Arc9FrontierEndingActionOutcomeV1 | null = null;
  try {
    if (openPanelId() === 'prime') fillPrimeCodex();
    await smokeProductActionHold.holdIfArmed(actionClaim.operation);
    await settleF4Heartbeat();
    if (smokeForceReadOnly || !f4RuntimeMayMutate(runtime) || importWriteInFlight
      || replacementTransaction || replacementReloadPending || trainingCheckpointWriteHeld
      || trainingActive() || ecologyEpochBlocksActions()) {
      lastArc9FrontierEndingOutcome = 'refused:authority-changed';
      return;
    }
    outcome = await commitArc9FrontierEndingChoiceV1({
      runtime,
      state: save,
      requestedEndingId,
      codecNow: Date.now(),
    });
    if (outcome.kind === 'current') {
      lastArc9FrontierEndingOutcome = `current:${outcome.endingId}`;
      toast('Frontier legacy unchanged', 'That ending is already your durable Frontier legacy.');
      return;
    }
    if (outcome.kind === 'refused') {
      lastArc9FrontierEndingOutcome = `refused:${outcome.detail}`;
      if (outcome.convergence === 'read-only-reload') {
        convergence = true;
        scheduleF4AuthorityConvergenceReload(
          runtime,
          `Arc 9 Frontier ending authority ${outcome.detail}`,
        );
      } else {
        const message = outcome.detail === 'preflight:balance-locked'
          ? 'Balance requires 3 conquered worlds, the Electric Signature, and 40 catalogued species.'
          : outcome.detail === 'preflight:frontier-locked'
            ? 'Complete all nine Prime Codex Signatures before choosing a Frontier ending.'
            : outcome.detail === 'preflight:ending-already-chosen'
              ? 'Your existing Frontier legacy is protected and cannot be overwritten.'
              : 'This saved Prime or ending record is protected, so nothing was changed.';
        toast('Frontier ending unavailable', message);
      }
      return;
    }

    durable = true;
    f4LastCheckpointAt = performance.now();
    if (outcome.kind === 'committed-convergence') {
      convergence = true;
      lastArc9FrontierEndingOutcome = `committed-convergence:${outcome.detail}`;
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Arc 9 Frontier ending committed; ${outcome.detail}`,
      );
      return;
    }
    try {
      const checkpoint = runtime.checkpointParent();
      const frontier = outcome.projection.frontier;
      if (runtime !== f4Runtime
        || runtime.revision !== outcome.transaction.revision
        || checkpoint === null
        || checkpoint.frontierEnding !== outcome.endingId
        || outcome.transaction.state.frontierEnding !== outcome.endingId
        || frontier.kind !== 'chosen'
        || frontier.ending.id !== outcome.endingId) {
        throw new Error('Frontier ending runtime did not retain its exact durable checkpoint');
      }
      save.frontierEnding = outcome.endingId;
      lastPersistenceOutcome = `arc9-frontier-ending-committed:${outcome.transaction.revision}`;
      lastArc9FrontierEndingOutcome = `committed:${outcome.endingId}`;
      toast(
        frontier.ending.title,
        'Your legacy is saved. The infinite galaxy remains open for exploration.',
      );
    } catch (error) {
      save.frontierEnding = priorLiveEnding;
      convergence = true;
      lastArc9FrontierEndingOutcome = 'committed-publication-reload';
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Arc 9 Frontier ending committed; publication ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  } catch (error) {
    lastArc9FrontierEndingOutcome = `${durable ? 'committed-' : ''}fault`;
    if (durable) {
      save.frontierEnding = priorLiveEnding;
      convergence = true;
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Arc 9 Frontier ending committed; presentation ${error instanceof Error ? error.message : String(error)}`,
      );
    } else {
      toast('Frontier ending unavailable', 'Nothing changed. Choose your legacy again after save authority settles.');
    }
  } finally {
    arc9FrontierEndingPending = false;
    productActionInFlight = false;
    actionClaim.settle(durable);
    if (activePersist === actionBarrier) activePersist = null;
    if (!convergence && openPanelId() === 'prime') {
      try { fillPrimeCodex(); }
      catch (error) {
        if (durable) {
          save.frontierEnding = priorLiveEnding;
          scheduleF4AuthorityConvergenceReload(
            runtime,
            `Arc 9 Frontier ending committed; Prime Codex publication ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    }
  }
}

async function runArc9NameplateChoice(requestedChoiceIndex: number): Promise<void> {
  const runtime = f4Runtime;
  const priorLiveChoice = save.nameHue;
  if (!f4RuntimeMayMutate(runtime) || activePersist || importWriteInFlight
    || replacementTransaction || replacementReloadPending || trainingCheckpointWriteHeld
    || ecologyEpochBlocksActions()) {
    lastArc9NameplateOutcome = 'unavailable:write-authority';
    if (openPanelId() === 'set') fillSettings();
    toast('Nameplate unavailable', 'Finish the current save operation, then choose an earned color again.');
    return;
  }
  const actionClaim = productActionCoordinator.tryClaim(ARC9_NAMEPLATE_CHOICE_OPERATION_V1);
  if (actionClaim === null) {
    lastArc9NameplateOutcome = 'unavailable:product-action-pending';
    if (openPanelId() === 'set') fillSettings();
    toast('Nameplate unavailable', 'Another expedition action is still settling.');
    return;
  }
  const actionBarrier = actionClaim.barrier;
  productActionInFlight = true;
  activePersist = actionBarrier;
  arc9NameplateChoicePending = true;
  lastArc9NameplateOutcome = 'pending';
  let durable = false;
  let convergence = false;
  let outcome: Arc9NameplateChoiceActionOutcomeV1 | null = null;
  try {
    await smokeProductActionHold.holdIfArmed(actionClaim.operation);
    await settleF4Heartbeat();
    if (!f4RuntimeMayMutate(runtime) || importWriteInFlight
      || replacementTransaction || replacementReloadPending || trainingCheckpointWriteHeld
      || ecologyEpochBlocksActions()) {
      lastArc9NameplateOutcome = 'refused:authority-changed';
      return;
    }
    outcome = await commitArc9NameplateChoiceV1({
      runtime,
      state: save,
      requestedChoiceIndex,
      codecNow: Date.now(),
    });
    if (outcome.kind === 'current') {
      lastArc9NameplateOutcome = `current:${outcome.choiceIndex}`;
      toast('Nameplate unchanged', 'That earned nameplate choice is already active.');
      return;
    }
    if (outcome.kind === 'refused') {
      lastArc9NameplateOutcome = `refused:${outcome.detail}`;
      if (outcome.convergence === 'read-only-reload') {
        convergence = true;
        scheduleF4AuthorityConvergenceReload(
          runtime,
          `Arc 9 nameplate authority ${outcome.detail}`,
        );
      } else {
        toast(
          'Nameplate unavailable',
          outcome.detail === 'preflight:choice-locked'
            ? 'That color has not been earned yet.'
            : 'Only Auto or an earned rank color can be selected.',
        );
      }
      return;
    }

    durable = true;
    f4LastCheckpointAt = performance.now();
    if (outcome.kind === 'committed-convergence') {
      convergence = true;
      lastArc9NameplateOutcome = `committed-convergence:${outcome.detail}`;
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Arc 9 nameplate committed; ${outcome.detail}`,
      );
      return;
    }
    try {
      const checkpoint = runtime.checkpointParent();
      if (runtime !== f4Runtime
        || runtime.revision !== outcome.transaction.revision
        || checkpoint === null
        || checkpoint.nameHue !== outcome.choiceIndex
        || outcome.transaction.state.nameHue !== outcome.choiceIndex) {
        throw new Error('nameplate runtime did not retain its exact durable checkpoint');
      }
      save.nameHue = outcome.choiceIndex;
      lastPersistenceOutcome = `arc9-nameplate-committed:${outcome.transaction.revision}`;
      lastArc9NameplateOutcome = `committed:${outcome.priorChoiceIndex}->${outcome.choiceIndex}`;
      updateChips();
      toast(
        'Nameplate updated',
        outcome.choiceIndex < 0
          ? 'Your nameplate now follows your current rank.'
          : `${outcome.nameplate.iridescent ? 'Iridescent foil' : 'Earned rank color'} applied.`,
      );
    } catch (error) {
      save.nameHue = priorLiveChoice;
      convergence = true;
      lastArc9NameplateOutcome = 'committed-publication-reload';
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Arc 9 nameplate committed; publication ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  } catch (error) {
    lastArc9NameplateOutcome = `${durable ? 'committed-' : ''}fault`;
    if (durable) {
      save.nameHue = priorLiveChoice;
      convergence = true;
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Arc 9 nameplate committed; presentation ${error instanceof Error ? error.message : String(error)}`,
      );
    } else {
      toast('Nameplate unavailable', 'Nothing changed. Choose an earned color again.');
    }
  } finally {
    arc9NameplateChoicePending = false;
    productActionInFlight = false;
    actionClaim.settle(durable);
    if (durable) queueArc9ProgressionRefresh(actionClaim.operation);
    if (activePersist === actionBarrier) activePersist = null;
    if (!convergence && openPanelId() === 'set') {
      try {
        fillSettings();
        document.querySelector<HTMLElement>('#setpanel [data-arc9-nameplate-choice]')?.focus();
      } catch (error) {
        if (durable) {
          save.nameHue = priorLiveChoice;
          try { updateChips(); } catch { /* the replacement document owns recovery */ }
          scheduleF4AuthorityConvergenceReload(
            runtime,
            `Arc 9 nameplate committed; Settings publication ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    }
  }
}

/** A capture can queue this aggregate follow-up before its awaiting UI
 * continuation repaints. The follow-up then legitimately makes that repaint
 * read-only while it owns the shared coordinator. Once the follow-up has
 * fully released, republish only the still-current open Capture surface so
 * its native actions do not remain stale-disabled until a later heartbeat. */
function refreshOpenCaptureSurfaceAfterArc9Progression(
  runtime: F4RuntimeAuthority,
): void {
  if (runtime !== f4Runtime || !f4RuntimeMayAnswer(runtime)
    || replacementTransaction || replacementReloadPending
    || trainingCheckpointWriteHeld || trainingActive() || ecologyEpochBlocksActions()
    || productActionInFlight || activePersist || productActionCoordinator.busy
    || card.style.display === 'none' || !surveyOwnsCurrentCaptureSurface()) return;
  try {
    refreshCaptureCardState();
  } catch (error) {
    currentCapturePresentationFence = null;
    scheduleF4AuthorityConvergenceReload(
      runtime,
      `Arc 9 progression settled; capture publication ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/** Every receipt-bearing product owner settles before this follow-up can
 * claim the shared coordinator. The refresh itself is excluded, so a rank
 * write cannot recursively schedule another transaction. One queue entry is
 * coalesced per task; a refused/stale attempt never retries. */
function queueArc9ProgressionRefresh(operation: string): void {
  if (operation === ARC9_PROGRESSION_REFRESH_OPERATION_V1
    || arc9ProgressionRefreshQueued || replacementReloadPending) return;
  arc9ProgressionRefreshQueued = true;
  queueMicrotask(() => {
    arc9ProgressionRefreshQueued = false;
    void runArc9ProgressionRefresh(`after:${operation}`);
  });
}

async function runArc9ProgressionRefresh(reason: string): Promise<void> {
  const runtime = f4Runtime;
  if (!f4RuntimeMayMutate(runtime) || activePersist || importWriteInFlight
    || replacementTransaction || replacementReloadPending || trainingCheckpointWriteHeld
    || trainingActive() || ecologyEpochBlocksActions()) {
    lastArc9ProgressionOutcome = `${reason}:deferred`;
    return;
  }
  const actionClaim = productActionCoordinator.tryClaim(ARC9_PROGRESSION_REFRESH_OPERATION_V1);
  if (actionClaim === null) {
    lastArc9ProgressionOutcome = `${reason}:coordinator-busy`;
    return;
  }
  const actionBarrier = actionClaim.barrier;
  productActionInFlight = true;
  activePersist = actionBarrier;
  let durable = false;
  let outcome: Arc9ProgressionRefreshActionOutcomeV1 | null = null;
  try {
    await smokeProductActionHold.holdIfArmed(actionClaim.operation);
    await settleF4Heartbeat();
    if (!f4RuntimeMayMutate(runtime) || importWriteInFlight
      || replacementTransaction || replacementReloadPending || trainingCheckpointWriteHeld
      || trainingActive() || ecologyEpochBlocksActions()) {
      lastArc9ProgressionOutcome = `${reason}:authority-changed`;
      return;
    }
    const priorUnlocked = save.unlocked;
    outcome = await commitArc9ProgressionRefreshV1({
      runtime,
      state: save,
      codecNow: Date.now(),
    });
    if (outcome.kind === 'current') {
      lastArc9ProgressionOutcome = `${reason}:current`;
      if (openPanelId() === 'rec') fillRecords();
      return;
    }
    if (outcome.kind === 'refused') {
      lastArc9ProgressionOutcome = `${reason}:refused:${outcome.detail}`;
      if (outcome.convergence === 'read-only-reload') {
        scheduleF4AuthorityConvergenceReload(
          runtime,
          `Arc 9 progression authority ${outcome.detail}`,
        );
      }
      return;
    }

    durable = true;
    f4LastCheckpointAt = performance.now();
    if (outcome.kind === 'committed-convergence') {
      lastArc9ProgressionOutcome = `${reason}:committed-convergence:${outcome.detail}`;
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Arc 9 progression committed; ${outcome.detail}`,
      );
      return;
    }
    try {
      if (runtime !== f4Runtime
        || runtime.revision !== outcome.transaction.revision
        || runtime.checkpointParent() === null) {
        throw new Error('progression runtime did not retain its exact durable checkpoint');
      }
      /* Arc 9 owns only the canonical achievement-order carrier and the
         permanent best-rank mirror. Disjoint state stays in its existing
         live object so UI sidecars and other owners are never replaced. */
      const committedBestRank = outcome.transaction.state.stats.bestRank;
      if (typeof committedBestRank !== 'number' || !Number.isSafeInteger(committedBestRank)
        || committedBestRank < 0 || committedBestRank > 9) {
        throw new Error('progression best-rank mirror was not canonical');
      }
      save.unlocked = outcome.transaction.state.unlocked.slice();
      save.stats = {
        ...save.stats,
        bestRank: committedBestRank,
      };
      lastPersistenceOutcome = `arc9-progression-committed:${outcome.transaction.revision}`;
      lastArc9ProgressionOutcome = `${reason}:committed:${outcome.transaction.revision}`
        + `:achievements:${outcome.addedAchievementIds.length}`
        + `:rank:${outcome.priorBestRankIndex}->${outcome.nextBestRankIndex}`;
      updateChips();
      if (openPanelId() === 'rec') fillRecords();
      /* Boot establishes the presentation baseline, matching the mature
         game's no-fanfare first render. Later refreshes publish only the
         exact durable aggregate append and best-rank transition they own. */
      presentProgressionCeremony({
        revision: outcome.transaction.revision,
        disposition: reason === 'boot-catch-up'
          ? 'boot-catch-up'
          : 'committed-publication',
        priorUnlockedIds: priorUnlocked,
        nextUnlockedIds: outcome.transaction.state.unlocked,
        addedAchievementIds: outcome.addedAchievementIds,
        priorBestRankIndex: outcome.priorBestRankIndex,
        nextBestRankIndex: outcome.nextBestRankIndex,
      });
    } catch (error) {
      lastArc9ProgressionOutcome = `${reason}:committed-publication-reload`;
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Arc 9 progression committed; publication ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  } catch (error) {
    lastArc9ProgressionOutcome = `${reason}:${durable ? 'committed-' : ''}fault`;
    if (durable) {
      scheduleF4AuthorityConvergenceReload(
        runtime,
        `Arc 9 progression committed; presentation ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  } finally {
    productActionInFlight = false;
    actionClaim.settle(durable);
    if (durable) queueArc9ProgressionRefresh(actionClaim.operation);
    if (activePersist === actionBarrier) activePersist = null;
    refreshOpenCaptureSurfaceAfterArc9Progression(runtime);
  }
}
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
  if (smokeForceReadOnly || !f4RuntimeMayMutate(runtime) || activePersist || importWriteInFlight
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
      if (outcome.kind === 'stale' || outcome.kind === 'revision-exhausted'
        || outcome.kind === 'duplicate-receipt'
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
    if (durable) queueArc9ProgressionRefresh(actionClaim.operation);
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
  | ReturnType<typeof verifyArc3CommittedMineAction>
  | ReturnType<typeof verifyArc3CommittedResearchAction>
  | ReturnType<typeof verifyArc3CommittedFixedFabricationAction>;
let smokeRejectNextArc3Publication = false;
function productActionFaultInjectionArmed(): boolean {
  return smokeRejectNextArc0LandingStorage
    || smokeStaleNextArc0LandingAuthority
    || smokeRejectNextArc0LandingPublication
    || smokeRejectNextArc3ActionStorage
    || smokeStaleNextArc3ActionAuthority
    || smokeRejectNextArc3Publication
    || smokeRejectNextArc4ActionStorage
    || smokeStaleNextArc4ActionAuthority
    || smokeRejectNextArc4Publication
    || smokeRejectNextArc5FeedStorage
    || smokeStaleNextArc5FeedAuthority
    || smokeRejectNextArc5FeedPublication;
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
    const faultInjection = !__CF_EVIDENCE_BUILD__ ? null : smokeRejectNextArc3ActionStorage
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
        derive: ({ draft, extensions, activePlayMs, receiptOrdinal, canonicalizeState }) => {
          const derived = spec.derive({
            draft, extensions, activePlayMs, receiptOrdinal, codecNow,
          });
          if (derived.kind !== 'ready') throw new Error(derived.detail);
          /* The transaction must commit the raw domain derivation so the
             persistence owner remains the sole codec authority. Retained
             postcommit expectations use that owner's exact registry/clock
             canonicalizer, or an unrelated veteran timestamp floor can make
             a valid durable successor look forged. */
          plannedHolder.value = Object.freeze({
            ...derived.derivation,
            state: canonicalizeState(derived.derivation.state),
          });
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
      if (outcome.kind === 'stale' || outcome.kind === 'revision-exhausted'
        || outcome.kind === 'duplicate-receipt'
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
      const checkpoint = runtime.checkpointParent();
      if (runtime !== f4Runtime
        || runtime.revision !== outcome.revision
        || checkpoint === null
        || JSON.stringify(checkpoint) !== JSON.stringify(outcome.state)
        || JSON.stringify(outcome.state) !== JSON.stringify(outcome.saved.canonicalState)) {
        throw new Error('Arc 3 runtime did not retain its exact durable checkpoint');
      }
      if (__CF_EVIDENCE_BUILD__ && smokeRejectNextArc3Publication) {
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
      if (committedPlan.starterCharter?.changed === true) {
        presentProgressionCeremony({
          revision: outcome.revision,
          disposition: 'committed-publication',
          priorUnlockedIds: committedPlan.starterCharter.priorUnlockedIds,
          nextUnlockedIds: committedPlan.starterCharter.nextUnlockedIds,
          addedAchievementIds: committedPlan.starterCharter.addedAchievementIds,
          priorBestRankIndex: committedPlan.starterCharter.priorBestRankIndex,
          nextBestRankIndex: committedPlan.starterCharter.nextBestRankIndex,
        });
      }
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
    if (durable) queueArc9ProgressionRefresh(actionClaim.operation);
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
    verify: ({ extensions, committed, planned, codecNow }) => verifyArc3CommittedMineAction({
      extensions,
      committed,
      expectedOwnedState: planned.state,
      expectedEngineeringState: planned.nextEngineeringState,
      expectedArc2State: planned.nextArc2State,
      codecNow,
      minedTimestampIntent: planned.minedTimestampIntent,
    }),
    publish: (target, committed, verified) => {
      if (!('arc2State' in verified)) {
        throw new Error('mine-verification-kind-mismatch');
      }
      if (verified.arc2State !== null) {
        /* Validate/render the exact optional Charter gear carrier before any
           live save or global carrier publication. */
        inventoryPanelController.setState(verified.arc2State);
      }
      publishArc3MiningFields(target, committed);
      if (verified.arc2State !== null) arc2LootState = verified.arc2State;
    },
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

type Arc5FeedCommitOutcome = Readonly<{
  kind: 'committed' | 'unavailable' | 'refused';
  durability: 'none' | 'committed';
  convergence: 'none' | 'read-only-reload';
  detail: string;
  result: Arc5FeedResult | null;
}>;

function compendiumFeedRequestIsCurrent(
  request: CompendiumFeedActionRequestV1,
  parent: OwnershipStateV2,
): boolean {
  if (!Object.isFrozen(request)
    || codexGeneration !== request.surface.generation
    || codexMode !== 'detail'
    || codexDetailLogicalId !== request.surface.logicalId
    || openPanelId() !== 'codex') return false;
  const row = currentCompendiumDetailRow();
  if (row === null) return false;
  const model = projectCurrentCompendiumFeed(row, request.surface.generation);
  if (model === null || model.availability !== 'ready'
    || model.contextKey !== request.contextKey
    || model.surface.surfaceKey !== request.surface.surfaceKey
    || model.ownershipRevision !== request.ownershipRevision
    || model.ownershipDigest !== request.ownershipDigest
    || parent.revision !== request.ownershipRevision
    || ownershipStateDigestV2(parent) !== request.ownershipDigest) return false;
  const creature = model.creatures.find((candidate) => candidate.creatureId === request.creatureId);
  const flora = model.floraLots.find((candidate) => candidate.foodLotId === request.foodLotId);
  return creature?.status === 'ready'
    && creature.fedBefore === request.fedBefore
    && creature.fedAfter === request.fedAfter
    && flora?.quantityBefore === request.foodQuantityBefore
    && flora.quantityAfter === request.foodQuantityAfter;
}

function arc5FeedWritesMatchFixedInventory(
  attempt: Extract<Arc5FeedActionOutcomeV1, { readonly kind: 'committed' }>,
): boolean {
  return attempt.ownershipWrites.length === ARC5_OWNERSHIP_EXTENSION_TARGETS.length
    && attempt.ownershipWrites.every((write, index) => (
      write.segment === ARC5_OWNERSHIP_EXTENSION_TARGETS[index]!.segment
      && write.namespace === ARC5_OWNERSHIP_EXTENSION_TARGETS[index]!.namespace
    ));
}

function protectArc5FeedAfterDurability(runtime: F4RuntimeAuthority, detail: string): void {
  lastArc5FeedResult = null;
  arc5OwnershipState = null;
  arc5OwnershipEvidence = null;
  arc5OwnershipProtection = 'committed-publication-reload';
  lastArc5BootstrapOutcome = 'feed-committed-publication-reload';
  lastArc5FeedOutcome = 'committed-publication-reload';
  scheduleF4AuthorityConvergenceReload(runtime, detail);
}

/** Sole player-live Feed writer. The controller supplies one owner-minted
 * exact-instance request. Main claims shared product authority synchronously,
 * permits Back/Close while the durable attempt continues, never retries, and
 * publishes only the verified Arc 5 compact ownership fixed point. */
async function commitCompendiumFeedAction(
  request: CompendiumFeedActionRequestV1,
): Promise<Arc5FeedCommitOutcome> {
  const unavailable = (detail: string): Arc5FeedCommitOutcome => {
    lastArc5FeedResult = null;
    lastArc5FeedOutcome = `unavailable:${detail}`;
    return Object.freeze({
      kind: 'unavailable', durability: 'none', convergence: 'none', detail, result: null,
    });
  };
  const runtime = f4Runtime;
  const parent = arc5OwnershipState;
  const parentEvidence = arc5OwnershipEvidence;
  if (parent?.mode !== 'current' || parentEvidence?.representationVersion
    !== ARC5_OWNERSHIP_MIGRATION_VERSION || arc5OwnershipProtection !== null) {
    return unavailable(arc5OwnershipProtection ?? 'ownership-unavailable');
  }
  if (!f4RuntimeMayMutate(runtime) || activePersist || importWriteInFlight
    || replacementTransaction || replacementReloadPending || trainingCheckpointWriteHeld) {
    return unavailable('write-authority-unavailable');
  }
  if (!compendiumFeedRequestIsCurrent(request, parent)) {
    return unavailable('presentation-authority-unavailable');
  }
  const parentRevision = parent.revision;
  const parentDigest = ownershipStateDigestV2(parent);
  const parentSourceDigest = ownershipStateDigestV1(ownershipSourceStateV1(parent));

  /* This is deliberately before the first await. It fences Arc 2, Arc 3,
     Arc 4, ordinary persistence, and another Feed press in this document. */
  const actionClaim = productActionCoordinator.tryClaim('arc5.companion-feed');
  if (actionClaim === null) return unavailable('product-action-pending');
  const actionBarrier = actionClaim.barrier;
  lastArc5FeedResult = null;
  lastArc5FeedOutcome = 'pending';
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
    /* Closing or replacing the Compendium is allowed here. Product authority
       remains the captured exact parent rather than a stale DOM surface. */
    if (arc5OwnershipState !== parent || arc5OwnershipEvidence !== parentEvidence
      || arc5OwnershipProtection !== null || parent.revision !== parentRevision
      || ownershipStateDigestV2(parent) !== parentDigest) {
      return unavailable('ownership-authority-changed');
    }

    const faultInjection = !__CF_EVIDENCE_BUILD__ ? null : smokeRejectNextArc5FeedStorage
      ? 'storage-failure'
      : smokeStaleNextArc5FeedAuthority ? 'stale-authority' : null;
    if (faultInjection === 'storage-failure') smokeRejectNextArc5FeedStorage = false;
    else if (faultInjection === 'stale-authority') smokeStaleNextArc5FeedAuthority = false;
    const faultBeforeRevision = runtime.revision;
    let injectedRevision: number | null = null;
    if (faultInjection !== null) {
      lastSmokeArc5FeedFaultWitness = Object.freeze({
        schema: 'cf-v2-arc5-feed-fault-witness/v1',
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
        lastSmokeArc5FeedFaultWitness = Object.freeze({
          schema: 'cf-v2-arc5-feed-fault-witness/v1',
          injection: faultInjection,
          phase: 'injection-failed',
          beforeRevision: faultBeforeRevision,
          injectedRevision: null,
          outcome: injected.kind,
        });
        throw new Error(`slice-smoke Arc 5 Feed stale injection became ${injected.kind}`);
      }
      injectedRevision = injected.revision;
    }

    let attempt: Arc5FeedActionOutcomeV1;
    if (faultInjection === 'storage-failure') smokeRejectArc5FeedStorageBoundary = true;
    try {
      attempt = await commitArc5FeedActionV1({
        runtime,
        ownershipV2: parent,
        state: save,
        creatureId: request.creatureId,
        foodLotId: request.foodLotId,
        codecNow: Date.now(),
      });
    } finally {
      if (faultInjection === 'storage-failure') smokeRejectArc5FeedStorageBoundary = false;
    }
    if (faultInjection !== null) {
      lastSmokeArc5FeedFaultWitness = Object.freeze({
        schema: 'cf-v2-arc5-feed-fault-witness/v1',
        injection: faultInjection,
        phase: 'settled',
        beforeRevision: faultBeforeRevision,
        injectedRevision,
        outcome: attempt.kind === 'refused'
          ? attempt.transaction?.kind ?? attempt.detail
          : attempt.kind,
      });
    }
    lastArc5FeedOutcome = `${attempt.kind}:${attempt.kind === 'refused'
      ? attempt.detail : attempt.convergence}`;
    if (attempt.kind === 'refused') {
      if (attempt.convergence === 'read-only-reload') {
        scheduleF4AuthorityConvergenceReload(
          runtime,
          `Arc 5 Feed authority ${attempt.detail}`,
        );
      }
      return Object.freeze({
        kind: 'refused', durability: 'none', convergence: attempt.convergence,
        detail: attempt.detail, result: null,
      });
    }

    /* Durability is terminal. Every branch below either publishes the exact
       five-carrier fixed point or converges through read-only reload. */
    durable = true;
    f4LastCheckpointAt = performance.now();
    lastPersistenceOutcome = `arc5-feed-committed:${attempt.transaction.revision}`;
    if (attempt.kind === 'committed-convergence') {
      protectArc5FeedAfterDurability(
        runtime,
        `Arc 5 Feed committed at revision ${attempt.transaction.revision}; ${attempt.detail}`,
      );
      return Object.freeze({
        kind: 'committed', durability: 'committed', convergence: 'read-only-reload',
        detail: `revision:${attempt.transaction.revision};publication-reload`, result: null,
      });
    }

    try {
      if (__CF_EVIDENCE_BUILD__ && smokeRejectNextArc5FeedPublication) {
        smokeRejectNextArc5FeedPublication = false;
        lastSmokeArc5FeedFaultWitness = Object.freeze({
          schema: 'cf-v2-arc5-feed-fault-witness/v1',
          injection: 'publication-failure',
          phase: 'settled',
          beforeRevision: faultBeforeRevision,
          injectedRevision: attempt.transaction.revision,
          outcome: 'committed-publication-reload',
        });
        throw new Error('slice-smoke injected Arc 5 Feed publication rejection');
      }
      const settlement = attempt.settlement;
      if (!arc5FeedWritesMatchFixedInventory(attempt)
        || attempt.ownershipV2Evidence.representationVersion
          !== ARC5_OWNERSHIP_MIGRATION_VERSION
        || attempt.ownershipV2.revision !== parentRevision + 1
        || ownershipStateDigestV1(ownershipSourceStateV1(attempt.ownershipV2))
          !== parentSourceDigest
        || ownershipStateDigestV2(attempt.ownershipV2)
          !== ownershipStateDigestV2(settlement.successor)
        || settlement.preflight.parentRevision !== parentRevision
        || settlement.preflight.parentDigest !== parentDigest
        || settlement.creatureBefore.creatureId !== request.creatureId
        || settlement.creatureAfter.creatureId !== request.creatureId
        || (settlement.creatureBefore.fed ?? 0) !== request.fedBefore
        || settlement.creatureAfter.fed !== request.fedAfter
        || settlement.foodBefore.lotId !== request.foodLotId
        || settlement.foodBefore.quantity !== request.foodQuantityBefore
        || (settlement.foodAfter?.quantity ?? 0) !== request.foodQuantityAfter
        || (settlement.foodAfter === null) !== (request.foodQuantityAfter === 0)
        || (settlement.foodTombstone !== null) !== (request.foodQuantityAfter === 0)
        || (settlement.foodTombstone !== null
          && settlement.foodTombstone.lotId !== request.foodLotId)) {
        throw new Error('arc5-feed-fixed-point-mismatch');
      }
      arc5OwnershipState = attempt.ownershipV2;
      arc5OwnershipEvidence = attempt.ownershipV2Evidence;
      arc5OwnershipProtection = null;
      lastArc5BootstrapOutcome = 'feed-committed-published';
      const result = Object.freeze({
        creatureId: request.creatureId,
        foodLotId: request.foodLotId,
        fedBefore: request.fedBefore,
        fedAfter: request.fedAfter,
        foodQuantityBefore: request.foodQuantityBefore,
        foodQuantityAfter: request.foodQuantityAfter,
        lotTombstoned: settlement.foodAfter === null,
        receiptOrdinal: settlement.receiptEvidence.ordinal,
        revision: attempt.transaction.revision,
        ownershipRevision: attempt.ownershipV2.revision,
      });
      lastArc5FeedResult = result;
      lastArc5FeedOutcome = `committed:${attempt.transaction.revision}`;
      return Object.freeze({
        kind: 'committed', durability: 'committed', convergence: 'none',
        detail: `revision:${attempt.transaction.revision}`, result,
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      protectArc5FeedAfterDurability(
        runtime,
        `Arc 5 Feed committed at revision ${attempt.transaction.revision}; publication ${detail}`,
      );
      return Object.freeze({
        kind: 'committed', durability: 'committed', convergence: 'read-only-reload',
        detail: `revision:${attempt.transaction.revision};publication-reload`, result: null,
      });
    }
  } catch (error) {
    if (durable) {
      protectArc5FeedAfterDurability(
        runtime,
        `Arc 5 Feed committed; publication ${error instanceof Error ? error.message : String(error)}`,
      );
      return Object.freeze({
        kind: 'committed', durability: 'committed', convergence: 'read-only-reload',
        detail: 'committed;publication-reload', result: null,
      });
    }
    lastArc5FeedResult = null;
    lastArc5FeedOutcome = 'rejected';
    return Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: error instanceof Error ? error.message : String(error), result: null,
    });
  } finally {
    productActionInFlight = false;
    actionClaim.settle(durable);
    if (durable) queueArc9ProgressionRefresh(actionClaim.operation);
    if (activePersist === actionBarrier) activePersist = null;
  }
}

function compendiumFeedOutcomeCopy(
  request: CompendiumFeedActionRequestV1,
  outcome: Arc5FeedCommitOutcome,
): CompendiumFeedActionOutcomeV1 {
  if (outcome.kind === 'committed' && outcome.convergence === 'none'
    && outcome.result !== null) {
    const remaining = outcome.result.foodQuantityAfter;
    return Object.freeze({
      schema: COMPENDIUM_FEED_OUTCOME_SCHEMA,
      kind: 'committed', convergence: 'none', request,
      title: 'Meal complete.',
      detail: `Meals ${outcome.result.fedBefore} → ${outcome.result.fedAfter}. Used 1 flora; ${remaining === 0
        ? 'the exact lot is now empty.' : `${remaining} remain in that lot.`}`,
    });
  }
  if (outcome.durability === 'committed') {
    return Object.freeze({
      schema: COMPENDIUM_FEED_OUTCOME_SCHEMA,
      kind: 'committed-convergence', convergence: 'read-only-reload', request,
      title: 'Meal saved — reload required.',
      detail: 'The meal is durable, but this tab could not verify its live copy. Reloading cannot feed twice.',
    });
  }
  const pending = outcome.detail.includes('pending');
  const storage = outcome.detail.includes('storage') || outcome.detail.includes('save');
  return Object.freeze({
    schema: COMPENDIUM_FEED_OUTCOME_SCHEMA,
    kind: 'refused', convergence: outcome.convergence, request,
    title: outcome.convergence === 'read-only-reload' ? 'Reload required.' : 'Nothing was used.',
    detail: pending
      ? 'Another expedition action is settling. Meals and flora are unchanged.'
      : storage
        ? 'The expedition could not be saved. Meals and flora are unchanged.'
        : 'Feed authority changed before durability. Meals and flora are unchanged.',
  });
}

async function runCompendiumFeedAction(request: CompendiumFeedActionRequestV1): Promise<void> {
  let outcome: Arc5FeedCommitOutcome;
  try { outcome = await commitCompendiumFeedAction(request); }
  catch (error) {
    outcome = Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: error instanceof Error ? error.message : String(error), result: null,
    });
  }
  const copy = compendiumFeedOutcomeCopy(request, outcome);
  try {
    compendiumFeedController.settle(copy);
    if (copy.convergence === 'none') refreshCompendiumFeedState();
    updateChips();
    showCompendiumFeedVisualToast(copy.title, copy.detail);
    const feedClaim: FeedExpressionClaim | null = tameGreetingAudioOwner
      ?.claimCommittedFeedExpression(outcome, arc5OwnershipState) ?? null;
    if (feedClaim !== null && outcome.result !== null) {
      const counterpart = bindCompendiumFeedStatusCounterpart(
        feedClaim,
        copy,
        outcome.result,
      );
      if (counterpart === null) {
        tameGreetingAudioOwner?.cancelFeedAttempt('counterpart-unavailable');
      } else {
        void tameGreetingAudioOwner?.playClaimedFeedExpression(feedClaim, counterpart);
      }
    }
  } catch (error) {
    releaseCompendiumFeedExpression('presentation-fault');
    const detail = error instanceof Error ? error.message : String(error);
    if (outcome.durability === 'committed' && f4Runtime !== null) {
      protectArc5FeedAfterDurability(
        f4Runtime,
        `Arc 5 Feed committed; presentation ${detail}`,
      );
      return;
    }
    if (f4Runtime !== null) {
      scheduleF4AuthorityConvergenceReload(
        f4Runtime,
        `Arc 5 Feed presentation rejected before durability (${detail})`,
      );
    }
  }
}

type Arc5ExplorerMealCommitOutcome = Readonly<{
  kind: 'committed' | 'unavailable' | 'refused';
  durability: 'none' | 'committed';
  convergence: 'none' | 'read-only-reload';
  detail: string;
  result: Arc5ExplorerMealResult | null;
}>;

function compendiumExplorerMealRequestIsCurrent(
  request: CompendiumExplorerMealRequestV1,
  parent: OwnershipStateV2,
): boolean {
  if (!Object.isFrozen(request) || !Object.isFrozen(request.surface)
    || codexGeneration !== request.surface.generation
    || codexMode !== 'detail'
    || codexDetailLogicalId !== request.surface.logicalId
    || openPanelId() !== 'codex') return false;
  const row = currentCompendiumDetailRow();
  if (row === null) return false;
  const model = projectCurrentCompendiumExplorerMeal(row, request.surface.generation);
  if (model === null || model.availability !== 'ready'
    || model.contextKey !== request.contextKey
    || model.surface.surfaceKey !== request.surface.surfaceKey
    || model.surface.speciesId !== request.surface.speciesId
    || model.ownershipRevision !== request.ownershipRevision
    || model.ownershipDigest !== request.ownershipDigest
    || parent.revision !== request.ownershipRevision
    || ownershipStateDigestV2(parent) !== request.ownershipDigest) return false;
  const lot = model.lots.find((candidate) => candidate.foodLotId === request.foodLotId);
  return lot?.quantityBefore === request.foodQuantityBefore
    && lot.quantityAfter === request.foodQuantityAfter
    && lot.healAmount === request.healAmount
    && lot.poisonChance === request.poisonChance
    && lot.nourishedStat === request.nourishedStat
    && lot.nourishment === request.nourishment
    && lot.statIncrease === request.statIncrease;
}

function arc5ExplorerMealWritesMatchFixedInventory(
  attempt: Extract<Arc5ExplorerMealActionOutcomeV1, { readonly kind: 'committed' }>,
): boolean {
  return attempt.ownershipWrites.length === ARC5_OWNERSHIP_EXTENSION_TARGETS.length
    && attempt.ownershipWrites.every((write, index) => (
      write.segment === ARC5_OWNERSHIP_EXTENSION_TARGETS[index]!.segment
      && write.namespace === ARC5_OWNERSHIP_EXTENSION_TARGETS[index]!.namespace
    ));
}

function protectArc5ExplorerMealAfterDurability(
  runtime: F4RuntimeAuthority,
  detail: string,
): void {
  lastArc5ExplorerMealResult = null;
  arc5OwnershipState = null;
  arc5OwnershipEvidence = null;
  arc5OwnershipProtection = 'committed-publication-reload';
  lastArc5BootstrapOutcome = 'explorer-meal-committed-publication-reload';
  lastArc5ExplorerMealOutcome = 'committed-publication-reload';
  scheduleF4AuthorityConvergenceReload(runtime, detail);
}

/** Sole player-live explorer meal writer. One exact Flora lot, physiology
 * snapshot, registered loadout and registered research state are captured
 * before the shared claim. The domain action rebinds both carriers inside
 * its one F4 draw/CAS before consuming the lot. */
async function commitCompendiumExplorerMealAction(
  request: CompendiumExplorerMealRequestV1,
): Promise<Arc5ExplorerMealCommitOutcome> {
  const unavailable = (detail: string): Arc5ExplorerMealCommitOutcome => {
    lastArc5ExplorerMealResult = null;
    lastArc5ExplorerMealOutcome = `unavailable:${detail}`;
    return Object.freeze({
      kind: 'unavailable', durability: 'none', convergence: 'none', detail, result: null,
    });
  };
  const runtime = f4Runtime;
  const parent = arc5OwnershipState;
  const parentEvidence = arc5OwnershipEvidence;
  const engineering = arc3EngineeringState;
  if (parent?.mode !== 'current' || parentEvidence?.representationVersion
    !== ARC5_OWNERSHIP_MIGRATION_VERSION || arc5OwnershipProtection !== null) {
    return unavailable(arc5OwnershipProtection ?? 'ownership-unavailable');
  }
  if (engineering === null || arc3EngineeringProtection !== null) {
    return unavailable(arc3EngineeringProtection ?? 'research-unavailable');
  }
  if (!f4RuntimeMayMutate(runtime) || activePersist || importWriteInFlight
    || replacementTransaction || replacementReloadPending || trainingCheckpointWriteHeld) {
    return unavailable('write-authority-unavailable');
  }
  const loadout = readArc2EngineeringLoadout(runtime.extensions);
  if (loadout.kind !== 'loaded') return unavailable(`loadout-${loadout.kind}`);
  const capabilities = projectEngineeringCapabilities(loadout.loadout);
  if (!compendiumExplorerMealRequestIsCurrent(request, parent)) {
    return unavailable('presentation-authority-unavailable');
  }
  const parentRevision = parent.revision;
  const parentDigest = ownershipStateDigestV2(parent);
  const parentSourceDigest = ownershipStateDigestV1(ownershipSourceStateV1(parent));
  const sourceState = save;
  const saveBefore = JSON.stringify(sourceState);
  const priorHp = sourceState.hp;
  const priorHpMax = sourceState.HP_MAX;
  const priorStats = sourceState.pstats;
  const priorUnlocked = sourceState.unlocked;
  const priorBestRankIndex = sourceState.stats.bestRank ?? 0;

  const actionClaim = productActionCoordinator.tryClaim('arc5.explorer-meal');
  if (actionClaim === null) return unavailable('product-action-pending');
  const actionBarrier = actionClaim.barrier;
  lastArc5ExplorerMealResult = null;
  lastArc5ExplorerMealOutcome = 'pending';
  productActionInFlight = true;
  activePersist = actionBarrier;
  let durable = false;
  try {
    await smokeProductActionHold.holdIfArmed(actionClaim.operation);
    await settleF4Heartbeat();
    const currentLoadout = readArc2EngineeringLoadout(runtime.extensions);
    if (!f4RuntimeMayMutate(runtime) || importWriteInFlight
      || replacementTransaction || replacementReloadPending || trainingCheckpointWriteHeld
      || save !== sourceState || JSON.stringify(sourceState) !== saveBefore) {
      return unavailable('write-authority-changed');
    }
    if (arc5OwnershipState !== parent || arc5OwnershipEvidence !== parentEvidence
      || arc5OwnershipProtection !== null || parent.revision !== parentRevision
      || ownershipStateDigestV2(parent) !== parentDigest
      || arc3EngineeringState !== engineering || arc3EngineeringProtection !== null
      || currentLoadout.kind !== 'loaded'
      || projectEngineeringCapabilities(currentLoadout.loadout).fingerprint
        !== capabilities.fingerprint) {
      return unavailable('product-authority-changed');
    }

    const attempt = await commitArc5ExplorerMealActionV1({
      runtime,
      ownershipV2: parent,
      engineering,
      capabilities,
      state: sourceState,
      foodLotId: request.foodLotId,
      codecNow: Date.now(),
    });
    lastArc5ExplorerMealOutcome = `${attempt.kind}:${attempt.kind === 'refused'
      ? attempt.detail : attempt.convergence}`;
    if (attempt.kind === 'refused') {
      if (attempt.convergence === 'read-only-reload') {
        scheduleF4AuthorityConvergenceReload(runtime, `Arc 5 Explorer Meal authority ${attempt.detail}`);
      }
      return Object.freeze({
        kind: 'refused', durability: 'none', convergence: attempt.convergence,
        detail: attempt.detail, result: null,
      });
    }

    durable = true;
    f4LastCheckpointAt = performance.now();
    lastPersistenceOutcome = `arc5-explorer-meal-committed:${attempt.transaction.revision}`;
    if (attempt.kind === 'committed-convergence') {
      protectArc5ExplorerMealAfterDurability(
        runtime,
        `Arc 5 Explorer Meal committed at revision ${attempt.transaction.revision}; ${attempt.detail}`,
      );
      return Object.freeze({
        kind: 'committed', durability: 'committed', convergence: 'read-only-reload',
        detail: `revision:${attempt.transaction.revision};publication-reload`, result: null,
      });
    }

    try {
      const settlement = attempt.settlement;
      const checkpoint = runtime.checkpointParent();
      if (runtime !== f4Runtime
        || runtime.revision !== attempt.transaction.revision
        || checkpoint === null
        || JSON.stringify(checkpoint) !== JSON.stringify(attempt.state)
        || !arc5ExplorerMealWritesMatchFixedInventory(attempt)
        || attempt.ownershipV2Evidence.representationVersion
          !== ARC5_OWNERSHIP_MIGRATION_VERSION
        || attempt.ownershipV2.revision !== parentRevision + 1
        || ownershipStateDigestV1(ownershipSourceStateV1(attempt.ownershipV2))
          !== parentSourceDigest
        || ownershipStateDigestV2(attempt.ownershipV2)
          !== ownershipStateDigestV2(settlement.successor)
        || settlement.preflight.parentRevision !== parentRevision
        || settlement.preflight.parentDigest !== parentDigest
        || settlement.preflight.foodLotId !== request.foodLotId
        || settlement.preflight.foodQuantityBefore !== request.foodQuantityBefore
        || settlement.preflight.foodQuantityAfter !== request.foodQuantityAfter
        || settlement.foodBefore.lotId !== request.foodLotId
        || settlement.foodBefore.quantity !== request.foodQuantityBefore
        || (settlement.foodAfter !== null
          && (settlement.foodAfter.lotId !== request.foodLotId
            || settlement.foodAfter.quantity !== request.foodQuantityAfter))
        || (settlement.foodTombstone !== null
          && settlement.foodTombstone.lotId !== request.foodLotId)
        || settlement.consequence.healAmount !== request.healAmount
        || settlement.preflight.poisonChance !== request.poisonChance
        || settlement.consequence.nourishedStat !== request.nourishedStat
        || settlement.consequence.nourishment !== request.nourishment
        || settlement.consequence.statIncrease !== request.statIncrease
        || settlement.consequence.hpBefore !== priorHp
        || settlement.consequence.hpMaxBefore !== priorHpMax
        || JSON.stringify(settlement.consequence.statsBefore) !== JSON.stringify(priorStats)
        || attempt.state.hp !== settlement.consequence.hpAfter
        || attempt.state.HP_MAX !== settlement.consequence.hpMaxAfter
        || JSON.stringify(attempt.state.pstats)
          !== JSON.stringify(settlement.consequence.statsAfter)
        || JSON.stringify(attempt.state.stats) !== JSON.stringify(sourceState.stats)
        || JSON.stringify(sourceState.unlocked) !== JSON.stringify(priorUnlocked)
        || (settlement.foodAfter?.quantity ?? 0) !== request.foodQuantityAfter
        || (settlement.foodAfter === null) !== (request.foodQuantityAfter === 0)
        || (settlement.foodTombstone !== null) !== (request.foodQuantityAfter === 0)
        || save !== sourceState || JSON.stringify(sourceState) !== saveBefore) {
        throw new Error('arc5-explorer-meal-fixed-point-mismatch');
      }
      publishArc5ExplorerMealAchievementFields(
        sourceState,
        attempt.state,
        attempt.achievementIdsAdded,
      );
      sourceState.hp = attempt.state.hp;
      sourceState.HP_MAX = attempt.state.HP_MAX;
      sourceState.pstats = attempt.state.pstats;
      arc5OwnershipState = attempt.ownershipV2;
      arc5OwnershipEvidence = attempt.ownershipV2Evidence;
      arc5OwnershipProtection = null;
      lastArc5BootstrapOutcome = 'explorer-meal-committed-published';
      const result: Arc5ExplorerMealResult = Object.freeze({
        poisoned: settlement.consequence.poisoned,
        hpBefore: settlement.consequence.hpBefore,
        hpAfter: settlement.consequence.hpAfter,
        hpMaxBefore: settlement.consequence.hpMaxBefore,
        hpMaxAfter: settlement.consequence.hpMaxAfter,
        nourishedStat: settlement.consequence.nourishedStat,
        statIncrease: settlement.consequence.statIncrease,
        foodLotId: request.foodLotId,
        foodQuantityBefore: request.foodQuantityBefore,
        foodQuantityAfter: request.foodQuantityAfter,
        receiptOrdinal: settlement.receiptEvidence.ordinal,
        revision: attempt.transaction.revision,
        ownershipRevision: attempt.ownershipV2.revision,
      });
      lastArc5ExplorerMealResult = result;
      lastArc5ExplorerMealOutcome = `committed:${attempt.transaction.revision}`;
      presentProgressionCeremony({
        revision: attempt.transaction.revision,
        disposition: 'committed-publication',
        priorUnlockedIds: priorUnlocked,
        nextUnlockedIds: attempt.state.unlocked,
        addedAchievementIds: attempt.achievementIdsAdded,
        priorBestRankIndex,
        nextBestRankIndex: attempt.state.stats.bestRank ?? 0,
      });
      return Object.freeze({
        kind: 'committed', durability: 'committed', convergence: 'none',
        detail: `revision:${attempt.transaction.revision}`, result,
      });
    } catch (error) {
      sourceState.hp = priorHp;
      sourceState.HP_MAX = priorHpMax;
      sourceState.pstats = priorStats;
      sourceState.unlocked = priorUnlocked;
      const detail = error instanceof Error ? error.message : String(error);
      protectArc5ExplorerMealAfterDurability(
        runtime,
        `Arc 5 Explorer Meal committed at revision ${attempt.transaction.revision}; publication ${detail}`,
      );
      return Object.freeze({
        kind: 'committed', durability: 'committed', convergence: 'read-only-reload',
        detail: `revision:${attempt.transaction.revision};publication-reload`, result: null,
      });
    }
  } catch (error) {
    if (durable) {
      sourceState.hp = priorHp;
      sourceState.HP_MAX = priorHpMax;
      sourceState.pstats = priorStats;
      sourceState.unlocked = priorUnlocked;
      protectArc5ExplorerMealAfterDurability(
        runtime,
        `Arc 5 Explorer Meal committed; publication ${error instanceof Error ? error.message : String(error)}`,
      );
      return Object.freeze({
        kind: 'committed', durability: 'committed', convergence: 'read-only-reload',
        detail: 'committed;publication-reload', result: null,
      });
    }
    lastArc5ExplorerMealResult = null;
    lastArc5ExplorerMealOutcome = 'rejected';
    return Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: error instanceof Error ? error.message : String(error), result: null,
    });
  } finally {
    productActionInFlight = false;
    actionClaim.settle(durable);
    if (durable) queueArc9ProgressionRefresh(actionClaim.operation);
    if (activePersist === actionBarrier) activePersist = null;
  }
}

function compendiumExplorerMealOutcomeCopy(
  request: CompendiumExplorerMealRequestV1,
  outcome: Arc5ExplorerMealCommitOutcome,
): CompendiumExplorerMealOutcomeV1 {
  if (outcome.kind === 'committed' && outcome.convergence === 'none'
    && outcome.result !== null) {
    const result = outcome.result;
    return Object.freeze({
      schema: COMPENDIUM_EXPLORER_MEAL_OUTCOME_SCHEMA_V1,
      kind: 'committed', convergence: 'none', request,
      title: result.poisoned ? 'Flora consumed — toxic reaction.' : 'Flora meal complete.',
      detail: result.poisoned
        ? `HP ${result.hpBefore} → ${result.hpAfter}. The explorer survived and the exact specimen was consumed.`
        : `HP ${result.hpBefore} → ${result.hpAfter}; ${result.nourishedStat.toUpperCase()} +${result.statIncrease}. The exact specimen was consumed.`,
    });
  }
  if (outcome.durability === 'committed') {
    return Object.freeze({
      schema: COMPENDIUM_EXPLORER_MEAL_OUTCOME_SCHEMA_V1,
      kind: 'committed-convergence', convergence: 'read-only-reload', request,
      title: 'Meal saved — reload required.',
      detail: 'The meal is durable, but this tab could not verify its live copy. Reloading cannot consume it twice.',
    });
  }
  return Object.freeze({
    schema: COMPENDIUM_EXPLORER_MEAL_OUTCOME_SCHEMA_V1,
    kind: 'refused', convergence: outcome.convergence, request,
    title: outcome.convergence === 'read-only-reload' ? 'Reload required.' : 'Nothing was eaten.',
    detail: outcome.detail.includes('pending')
      ? 'Another expedition action is settling. Explorer health and Flora are unchanged.'
      : outcome.detail.includes('storage') || outcome.detail.includes('save')
        ? 'The expedition could not be saved. Explorer health and Flora are unchanged.'
      : 'Meal authority changed before durability. Explorer health and Flora are unchanged.',
  });
}

async function runCompendiumExplorerMealAction(
  request: CompendiumExplorerMealRequestV1,
): Promise<void> {
  let outcome: Arc5ExplorerMealCommitOutcome;
  try { outcome = await commitCompendiumExplorerMealAction(request); }
  catch (error) {
    outcome = Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: error instanceof Error ? error.message : String(error), result: null,
    });
  }
  const copy = compendiumExplorerMealOutcomeCopy(request, outcome);
  try {
    compendiumExplorerMealController.settle(copy);
    if (copy.convergence === 'none') refreshCompendiumFeedState();
    hudText();
    updateChips();
    showCompendiumFeedVisualToast(copy.title, copy.detail);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    if (outcome.durability === 'committed' && f4Runtime !== null) {
      protectArc5ExplorerMealAfterDurability(
        f4Runtime,
        `Arc 5 Explorer Meal committed; presentation ${detail}`,
      );
      return;
    }
    if (f4Runtime !== null) {
      scheduleF4AuthorityConvergenceReload(
        f4Runtime,
        `Arc 5 Explorer Meal presentation rejected before durability (${detail})`,
      );
    }
  }
}

type Arc5BreedCommitOutcome = Readonly<{
  kind: 'committed' | 'unavailable' | 'refused';
  durability: 'none' | 'committed';
  convergence: 'none' | 'read-only-reload';
  detail: string;
  result: Arc5BreedResult | null;
}>;

function compendiumBreedRequestIsCurrent(
  request: CompendiumBreedActionRequestV1,
  parent: OwnershipStateV2,
): boolean {
  if (!Object.isFrozen(request) || !Object.isFrozen(request.parentCreatureIds)
    || codexGeneration !== request.surface.generation
    || codexMode !== 'detail'
    || codexDetailLogicalId !== request.surface.logicalId
    || openPanelId() !== 'codex') return false;
  const row = currentCompendiumDetailRow();
  if (row === null) return false;
  const model = projectCurrentCompendiumBreed(row, request.surface.generation);
  if (model === null || model.availability !== 'ready'
    || model.contextKey !== request.contextKey
    || model.surface.surfaceKey !== request.surface.surfaceKey
    || model.ownershipRevision !== request.ownershipRevision
    || model.ownershipDigest !== request.ownershipDigest
    || model.earnedStardustBonus !== request.earnedStardustBonus
    || parent.revision !== request.ownershipRevision
    || ownershipStateDigestV2(parent) !== request.ownershipDigest
    || request.parentCreatureIds[0] === request.parentCreatureIds[1]) return false;
  const left = model.primaryParents.find(
    (candidate) => candidate.creatureId === request.parentCreatureIds[0],
  );
  const right = model.mateParents.find(
    (candidate) => candidate.creatureId === request.parentCreatureIds[1],
  );
  return left?.status === 'ready' && right?.status === 'ready'
    && request.odds === companionBreedOddsV1(
      left.tier,
      right.tier,
      request.earnedStardustBonus,
    );
}

function arc5BreedWritesMatchFixedInventory(
  attempt: Extract<Arc5BreedActionOutcomeV1, { readonly kind: 'committed' }>,
): boolean {
  return attempt.ownershipWrites.length === ARC5_OWNERSHIP_EXTENSION_TARGETS.length
    && attempt.ownershipWrites.every((write, index) => (
      write.segment === ARC5_OWNERSHIP_EXTENSION_TARGETS[index]!.segment
      && write.namespace === ARC5_OWNERSHIP_EXTENSION_TARGETS[index]!.namespace
    ));
}

function protectArc5BreedAfterDurability(runtime: F4RuntimeAuthority, detail: string): void {
  lastArc5BreedResult = null;
  arc5OwnershipState = null;
  arc5OwnershipEvidence = null;
  arc5OwnershipProtection = 'committed-publication-reload';
  lastArc5BootstrapOutcome = 'breed-committed-publication-reload';
  lastArc5BreedOutcome = 'committed-publication-reload';
  scheduleF4AuthorityConvergenceReload(runtime, detail);
}

/** Sole player-live normal Breed writer. It consumes the controller's exact
 * two-parent request, claims shared product authority before the first await,
 * attempts one pre-draw-certified CAS, and publishes only the verified
 * exact-five ownership fixed point. */
async function commitCompendiumBreedAction(
  request: CompendiumBreedActionRequestV1,
): Promise<Arc5BreedCommitOutcome> {
  const unavailable = (detail: string): Arc5BreedCommitOutcome => {
    lastArc5BreedResult = null;
    lastArc5BreedOutcome = `unavailable:${detail}`;
    return Object.freeze({
      kind: 'unavailable', durability: 'none', convergence: 'none', detail, result: null,
    });
  };
  const runtime = f4Runtime;
  const parent = arc5OwnershipState;
  const parentEvidence = arc5OwnershipEvidence;
  if (parent?.mode !== 'current' || parentEvidence?.representationVersion
    !== ARC5_OWNERSHIP_MIGRATION_VERSION || arc5OwnershipProtection !== null) {
    return unavailable(arc5OwnershipProtection ?? 'ownership-unavailable');
  }
  if (!f4RuntimeMayMutate(runtime) || activePersist || importWriteInFlight
    || replacementTransaction || replacementReloadPending || trainingCheckpointWriteHeld) {
    return unavailable('write-authority-unavailable');
  }
  if (!compendiumBreedRequestIsCurrent(request, parent)) {
    return unavailable('presentation-authority-unavailable');
  }
  const parentRevision = parent.revision;
  const parentDigest = ownershipStateDigestV2(parent);
  const parentSourceDigest = ownershipStateDigestV1(ownershipSourceStateV1(parent));
  const sourceState = save;
  const priorBreedPublication = Object.freeze({
    ascCh: sourceState.ascCh,
    ascProg: sourceState.ascProg,
    unlocked: sourceState.unlocked,
    xpFirsts: sourceState.xpFirsts,
    hasXpFirstsBinding: Object.prototype.hasOwnProperty.call(sourceState, 'xpFirstsBinding'),
    xpFirstsBinding: sourceState.xpFirstsBinding,
  });
  const restoreBreedPublication = (): void => {
    if (save !== sourceState) return;
    sourceState.ascCh = priorBreedPublication.ascCh;
    sourceState.ascProg = priorBreedPublication.ascProg;
    sourceState.unlocked = priorBreedPublication.unlocked;
    sourceState.xpFirsts = priorBreedPublication.xpFirsts;
    if (priorBreedPublication.hasXpFirstsBinding) {
      Object.defineProperty(sourceState, 'xpFirstsBinding', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: priorBreedPublication.xpFirstsBinding,
      });
    } else {
      delete sourceState.xpFirstsBinding;
    }
  };
  const charterAscChBefore = sourceState.ascCh;
  const charterProgressBefore = JSON.stringify(sourceState.ascProg);
  const charterBredBefore = sourceState.ascProg['c3-breed'] ?? 0;
  const xpFirstsBefore = JSON.stringify(sourceState.xpFirsts);
  const xpFirstsBindingBefore = JSON.stringify(sourceState.xpFirstsBinding ?? null);

  const actionClaim = productActionCoordinator.tryClaim('arc5.companion-breed');
  if (actionClaim === null) return unavailable('product-action-pending');
  const actionBarrier = actionClaim.barrier;
  lastArc5BreedResult = null;
  lastArc5BreedOutcome = 'pending';
  productActionInFlight = true;
  activePersist = actionBarrier;
  let durable = false;
  try {
    await smokeProductActionHold.holdIfArmed(actionClaim.operation);
    await settleF4Heartbeat();
    if (!f4RuntimeMayMutate(runtime) || importWriteInFlight
      || replacementTransaction || replacementReloadPending || trainingCheckpointWriteHeld
      || save !== sourceState) {
      return unavailable('write-authority-changed');
    }
    /* Back/Close remains safe while settling; exact captured ownership, not
       the possibly removed DOM, is the post-await authority. */
    if (arc5OwnershipState !== parent || arc5OwnershipEvidence !== parentEvidence
      || arc5OwnershipProtection !== null || parent.revision !== parentRevision
      || ownershipStateDigestV2(parent) !== parentDigest) {
      return unavailable('ownership-authority-changed');
    }
    const progressionUnlockedBefore = save.unlocked;
    const progressionBestRankBefore = save.stats.bestRank ?? 0;

    const attempt = await commitArc5BreedActionV1({
      runtime,
      ownershipV2: parent,
      state: sourceState,
      parentCreatureIds: request.parentCreatureIds,
      codecNow: Date.now(),
    });
    lastArc5BreedOutcome = `${attempt.kind}:${attempt.kind === 'refused'
      ? attempt.detail : attempt.convergence}`;
    if (attempt.kind === 'refused') {
      if (attempt.convergence === 'read-only-reload') {
        scheduleF4AuthorityConvergenceReload(
          runtime,
          `Arc 5 Breed authority ${attempt.detail}`,
        );
      }
      return Object.freeze({
        kind: 'refused', durability: 'none', convergence: attempt.convergence,
        detail: attempt.detail, result: null,
      });
    }

    durable = true;
    f4LastCheckpointAt = performance.now();
    lastPersistenceOutcome = `arc5-breed-committed:${attempt.transaction.revision}`;
    if (attempt.kind === 'committed-convergence') {
      protectArc5BreedAfterDurability(
        runtime,
        `Arc 5 Breed committed at revision ${attempt.transaction.revision}; ${attempt.detail}`,
      );
      return Object.freeze({
        kind: 'committed', durability: 'committed', convergence: 'read-only-reload',
        detail: `revision:${attempt.transaction.revision};publication-reload`, result: null,
      });
    }

    try {
      const scenario = attempt.settlement.scenario;
      const checkpoint = runtime.checkpointParent();
      const [leftId, rightId] = request.parentCreatureIds;
      const leftAfter = attempt.ownershipV2.creatures.find((row) => row.creatureId === leftId);
      const rightAfter = attempt.ownershipV2.creatures.find((row) => row.creatureId === rightId);
      const childId = scenario.child?.creatureId ?? null;
      const childAfter = childId === null ? null : attempt.ownershipV2.creatures.find(
        (row) => row.creatureId === childId,
      ) ?? null;
      if (runtime !== f4Runtime
        || save !== sourceState
        || runtime.revision !== attempt.transaction.revision
        || checkpoint === null
        || JSON.stringify(checkpoint) !== JSON.stringify(attempt.transaction.state)
        || JSON.stringify(attempt.transaction.state)
          !== JSON.stringify(attempt.transaction.saved.canonicalState)
        || !arc5BreedWritesMatchFixedInventory(attempt)
        || attempt.ownershipV2Evidence.representationVersion
          !== ARC5_OWNERSHIP_MIGRATION_VERSION
        || attempt.ownershipV2.revision !== parentRevision + 1
        || ownershipStateDigestV1(ownershipSourceStateV1(attempt.ownershipV2))
          !== parentSourceDigest
        || ownershipStateDigestV2(attempt.ownershipV2)
          !== ownershipStateDigestV2(scenario.successor)
        || scenario.preflight.parentRevision !== parentRevision
        || scenario.preflight.parentDigest !== parentDigest
        || scenario.preflight.parentCreatureIds[0] !== leftId
        || scenario.preflight.parentCreatureIds[1] !== rightId
        || scenario.preflight.parentSpeciesIds[0] !== scenario.parentsBefore[0].speciesId
        || scenario.preflight.parentSpeciesIds[1] !== scenario.parentsBefore[1].speciesId
        || scenario.preflight.earnedStardustBonus !== request.earnedStardustBonus
        || scenario.preflight.odds !== request.odds
        || scenario.parentsBefore[0].creatureId !== leftId
        || scenario.parentsBefore[1].creatureId !== rightId
        || scenario.parentsAfter[0].creatureId !== leftId
        || scenario.parentsAfter[1].creatureId !== rightId
        || sourceState.ascCh !== charterAscChBefore
        || JSON.stringify(sourceState.ascProg) !== charterProgressBefore
        || JSON.stringify(sourceState.xpFirsts) !== xpFirstsBefore
        || JSON.stringify(sourceState.xpFirstsBinding ?? null) !== xpFirstsBindingBefore
        || (attempt.charterBredBanked
          ? attempt.transaction.state.ascProg['c3-breed'] !== charterBredBefore + 1
          : (attempt.transaction.state.ascProg['c3-breed'] ?? 0) !== charterBredBefore)
        || (attempt.charterBredBanked && scenario.result !== 'success')
        || leftAfter?.assignment?.kind !== 'recovery'
        || rightAfter?.assignment?.kind !== 'recovery'
        || leftAfter.assignment.readyAtActivePlayMs !== scenario.recoveryReadyAtActivePlayMs
        || rightAfter.assignment.readyAtActivePlayMs !== scenario.recoveryReadyAtActivePlayMs
        || (scenario.result === 'success') !== (childId !== null)
        || (scenario.result === 'success') !== (childAfter !== null)
        || attempt.childXpAwarded !== scenario.childXpAwarded
        || attempt.speciesPairXpKey !== scenario.speciesPairXpKey
        || attempt.speciesPairFirstXpAwarded !== scenario.speciesPairFirst
        || (childAfter === null
          ? scenario.childXpAwarded !== 0
          : childAfter.xp !== scenario.childXpAwarded)
        || (scenario.result === 'failure' && (
          scenario.acquisition !== null
          || attempt.ownershipV2.creatures.length !== parent.creatures.length
        ))) {
        throw new Error('arc5-breed-fixed-point-mismatch');
      }
      publishArc5BreedSaveFieldsV1(sourceState, attempt.transaction.state);
      const committedHasXpFirstsBinding = Object.prototype.hasOwnProperty.call(
        attempt.transaction.state,
        'xpFirstsBinding',
      );
      if (sourceState.ascCh !== attempt.transaction.state.ascCh
        || JSON.stringify(sourceState.ascProg) !== JSON.stringify(attempt.transaction.state.ascProg)
        || JSON.stringify(sourceState.unlocked) !== JSON.stringify(attempt.transaction.state.unlocked)
        || JSON.stringify(sourceState.xpFirsts) !== JSON.stringify(attempt.transaction.state.xpFirsts)
        || Object.prototype.hasOwnProperty.call(sourceState, 'xpFirstsBinding')
          !== committedHasXpFirstsBinding
        || JSON.stringify(sourceState.xpFirstsBinding ?? null)
          !== JSON.stringify(attempt.transaction.state.xpFirstsBinding ?? null)) {
        throw new Error('arc5-breed-save-publication-mismatch');
      }
      arc5OwnershipState = attempt.ownershipV2;
      arc5OwnershipEvidence = attempt.ownershipV2Evidence;
      arc5OwnershipProtection = null;
      lastArc5BootstrapOutcome = 'breed-committed-published';
      const result: Arc5BreedResult = Object.freeze({
        result: scenario.result,
        parentCreatureIds: request.parentCreatureIds,
        childCreatureId: childId,
        odds: request.odds,
        recoveryDurationMs: scenario.recoveryDurationMs,
        recoveryReadyAtActivePlayMs: scenario.recoveryReadyAtActivePlayMs,
        charterBredBanked: attempt.charterBredBanked,
        childXpAwarded: attempt.childXpAwarded,
        speciesPairXpKey: attempt.speciesPairXpKey,
        speciesPairFirstXpAwarded: attempt.speciesPairFirstXpAwarded,
        xpFirstsTotalCount: attempt.xpFirstsTotalCount,
        receiptOrdinal: scenario.receiptEvidence.ordinal,
        revision: attempt.transaction.revision,
        ownershipRevision: attempt.ownershipV2.revision,
      });
      lastArc5BreedResult = result;
      lastArc5BreedOutcome = `committed:${scenario.result}:${attempt.transaction.revision}`;
      if (attempt.charterBredBanked) {
        toast(
          '📜 Charter progress',
          'Breed a hybrid bloodline · 1 / 1 — recorded with the saved offspring.',
          true,
        );
      }
      if (openPanelId() === 'ch') fillCharters();
      presentProgressionCeremony({
        revision: attempt.transaction.revision,
        disposition: 'committed-publication',
        priorUnlockedIds: progressionUnlockedBefore,
        nextUnlockedIds: attempt.transaction.state.unlocked,
        addedAchievementIds: attempt.bredLegendAchievementAdded ? ['bredlegend'] : [],
        priorBestRankIndex: progressionBestRankBefore,
        nextBestRankIndex: attempt.transaction.state.stats.bestRank ?? 0,
      });
      return Object.freeze({
        kind: 'committed', durability: 'committed', convergence: 'none',
        detail: `revision:${attempt.transaction.revision}`, result,
      });
    } catch (error) {
      restoreBreedPublication();
      const detail = error instanceof Error ? error.message : String(error);
      protectArc5BreedAfterDurability(
        runtime,
        `Arc 5 Breed committed at revision ${attempt.transaction.revision}; publication ${detail}`,
      );
      return Object.freeze({
        kind: 'committed', durability: 'committed', convergence: 'read-only-reload',
        detail: `revision:${attempt.transaction.revision};publication-reload`, result: null,
      });
    }
  } catch (error) {
    if (durable) {
      restoreBreedPublication();
      protectArc5BreedAfterDurability(
        runtime,
        `Arc 5 Breed committed; publication ${error instanceof Error ? error.message : String(error)}`,
      );
      return Object.freeze({
        kind: 'committed', durability: 'committed', convergence: 'read-only-reload',
        detail: 'committed;publication-reload', result: null,
      });
    }
    lastArc5BreedResult = null;
    lastArc5BreedOutcome = 'rejected';
    return Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: error instanceof Error ? error.message : String(error), result: null,
    });
  } finally {
    productActionInFlight = false;
    actionClaim.settle(durable);
    if (durable) queueArc9ProgressionRefresh(actionClaim.operation);
    if (activePersist === actionBarrier) activePersist = null;
  }
}

function compendiumBreedOutcomeCopy(
  request: CompendiumBreedActionRequestV1,
  outcome: Arc5BreedCommitOutcome,
): CompendiumBreedActionOutcomeV1 {
  if (outcome.kind === 'committed' && outcome.convergence === 'none'
    && outcome.result !== null) {
    const minutes = outcome.result.recoveryDurationMs / 60_000;
    if (outcome.result.result === 'success') {
      const pairBonus = outcome.result.speciesPairFirstXpAwarded
        ? ' That includes the one-time +5 XP for this exact species pairing.'
        : ' This species pairing has already paid its one-time lineage bonus.';
      return Object.freeze({
        schema: COMPENDIUM_BREED_OUTCOME_SCHEMA,
        kind: 'committed-success', convergence: 'none', request,
        title: 'New bloodline secured.',
        detail: `The child gained ${outcome.result.childXpAwarded} XP and all three companions are saved.${pairBonus} Both parents remain yours and enter ${minutes} active-play minutes of Recovery.`,
      });
    }
    return Object.freeze({
      schema: COMPENDIUM_BREED_OUTCOME_SCHEMA,
      kind: 'committed-failure', convergence: 'none', request,
      title: 'Pairing did not take.',
      detail: `No child was created. Both parents remain safe and enter ${minutes} active-play minutes of Recovery.`,
    });
  }
  if (outcome.durability === 'committed') {
    return Object.freeze({
      schema: COMPENDIUM_BREED_OUTCOME_SCHEMA,
      kind: 'committed-convergence', convergence: 'read-only-reload', request,
      title: 'Breeding saved — reload required.',
      detail: 'The result is durable, but this tab could not verify its live copy. Reloading cannot breed twice.',
    });
  }
  const pending = outcome.detail.includes('pending');
  const storage = outcome.detail.includes('storage') || outcome.detail.includes('save');
  return Object.freeze({
    schema: COMPENDIUM_BREED_OUTCOME_SCHEMA,
    kind: 'refused', convergence: outcome.convergence, request,
    title: outcome.convergence === 'read-only-reload' ? 'Reload required.' : 'No breeding attempt made.',
    detail: pending
      ? 'Another expedition action is settling. This attempt made no draw and added no Recovery or child.'
      : storage
        ? 'The expedition could not be saved. This attempt made no draw and added no Recovery or child.'
        : 'Breed authority or eligibility changed before durability. This attempt made no draw and added no Recovery or child.',
  });
}

async function runCompendiumBreedAction(request: CompendiumBreedActionRequestV1): Promise<void> {
  let outcome: Arc5BreedCommitOutcome;
  try { outcome = await commitCompendiumBreedAction(request); }
  catch (error) {
    outcome = Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: error instanceof Error ? error.message : String(error), result: null,
    });
  }
  const copy = compendiumBreedOutcomeCopy(request, outcome);
  try {
    compendiumBreedController.settle(copy);
    if (copy.convergence === 'none') refreshCompendiumFeedState();
    updateChips();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    if (outcome.durability === 'committed' && f4Runtime !== null) {
      protectArc5BreedAfterDurability(
        f4Runtime,
        `Arc 5 Breed committed; presentation ${detail}`,
      );
      return;
    }
    if (f4Runtime !== null) {
      scheduleF4AuthorityConvergenceReload(
        f4Runtime,
        `Arc 5 Breed presentation rejected before durability (${detail})`,
      );
    }
  }
}

type Arc5RenameCommitOutcome = Readonly<{
  kind: 'committed' | 'unavailable' | 'refused';
  durability: 'none' | 'committed';
  convergence: 'none' | 'read-only-reload';
  detail: string;
  result: Arc5RenameResult | null;
}>;

function compendiumRenameRequestIsCurrent(
  request: CompendiumRenameActionRequestV1,
  parent: OwnershipStateV2,
): boolean {
  if (!Object.isFrozen(request)
    || codexGeneration !== request.surface.generation
    || codexMode !== 'detail'
    || codexDetailLogicalId !== request.surface.logicalId
    || openPanelId() !== 'codex') return false;
  const row = currentCompendiumDetailRow();
  if (row === null) return false;
  const model = projectCurrentCompendiumRename(row, request.surface.generation);
  if (model === null || model.availability !== 'ready'
    || model.contextKey !== request.contextKey
    || model.surface.surfaceKey !== request.surface.surfaceKey
    || model.ownershipRevision !== request.ownershipRevision
    || model.ownershipDigest !== request.ownershipDigest
    || parent.revision !== request.ownershipRevision
    || ownershipStateDigestV2(parent) !== request.ownershipDigest
    || cleanName(request.rawName, 24) !== request.nicknameAfter
    || request.nicknameAfter.length === 0) return false;
  const creature = model.creatures.find((candidate) => candidate.creatureId === request.creatureId);
  return creature?.status === 'ready'
    && creature.nickname === request.nicknameBefore
    && creature.nickname !== request.nicknameAfter;
}

function arc5RenameWritesMatchFixedInventory(
  attempt: Extract<Arc5RenameActionOutcomeV1, { readonly kind: 'committed' }>,
): boolean {
  return attempt.ownershipWrites.length === ARC5_OWNERSHIP_EXTENSION_TARGETS.length
    && attempt.ownershipWrites.every((write, index) => (
      write.segment === ARC5_OWNERSHIP_EXTENSION_TARGETS[index]!.segment
      && write.namespace === ARC5_OWNERSHIP_EXTENSION_TARGETS[index]!.namespace
    ));
}

function protectArc5RenameAfterDurability(runtime: F4RuntimeAuthority, detail: string): void {
  lastArc5RenameResult = null;
  arc5OwnershipState = null;
  arc5OwnershipEvidence = null;
  arc5OwnershipProtection = 'committed-publication-reload';
  lastArc5BootstrapOutcome = 'rename-committed-publication-reload';
  lastArc5RenameOutcome = 'committed-publication-reload';
  scheduleF4AuthorityConvergenceReload(runtime, detail);
}

/** Sole player-live companion nickname writer. Identity-only rename shares
 * the global product coordinator, then publishes only the verified exact-five
 * +1 ownership fixed point. Back and Close may safely remove the DOM while
 * this exact captured parent settles. */
async function commitCompendiumRenameAction(
  request: CompendiumRenameActionRequestV1,
): Promise<Arc5RenameCommitOutcome> {
  const unavailable = (detail: string): Arc5RenameCommitOutcome => {
    lastArc5RenameResult = null;
    lastArc5RenameOutcome = `unavailable:${detail}`;
    return Object.freeze({
      kind: 'unavailable', durability: 'none', convergence: 'none', detail, result: null,
    });
  };
  const runtime = f4Runtime;
  const parent = arc5OwnershipState;
  const parentEvidence = arc5OwnershipEvidence;
  if (parent?.mode !== 'current' || parentEvidence?.representationVersion
    !== ARC5_OWNERSHIP_MIGRATION_VERSION || arc5OwnershipProtection !== null) {
    return unavailable(arc5OwnershipProtection ?? 'ownership-unavailable');
  }
  if (!f4RuntimeMayMutate(runtime) || activePersist || importWriteInFlight
    || replacementTransaction || replacementReloadPending || trainingCheckpointWriteHeld) {
    return unavailable('write-authority-unavailable');
  }
  if (!compendiumRenameRequestIsCurrent(request, parent)) {
    return unavailable('presentation-authority-unavailable');
  }
  const parentRevision = parent.revision;
  const parentDigest = ownershipStateDigestV2(parent);
  const parentSourceDigest = ownershipStateDigestV1(ownershipSourceStateV1(parent));
  const unlockedBefore = save.unlocked.slice();
  const creatureBefore = parent.creatures.find((row) => row.creatureId === request.creatureId);
  if (creatureBefore === undefined || creatureBefore.nickname !== request.nicknameBefore) {
    return unavailable('creature-authority-unavailable');
  }

  const actionClaim = productActionCoordinator.tryClaim('arc5.companion-rename');
  if (actionClaim === null) return unavailable('product-action-pending');
  const actionBarrier = actionClaim.barrier;
  lastArc5RenameResult = null;
  lastArc5RenameOutcome = 'pending';
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
    if (arc5OwnershipState !== parent || arc5OwnershipEvidence !== parentEvidence
      || arc5OwnershipProtection !== null || parent.revision !== parentRevision
      || ownershipStateDigestV2(parent) !== parentDigest) {
      return unavailable('ownership-authority-changed');
    }
    const progressionBestRankBefore = save.stats.bestRank ?? 0;

    const attempt = await commitArc5RenameActionV1({
      runtime,
      ownershipV2: parent,
      state: save,
      creatureId: request.creatureId,
      rawName: request.rawName,
      codecNow: Date.now(),
    });
    lastArc5RenameOutcome = `${attempt.kind}:${attempt.kind === 'refused'
      ? attempt.detail : attempt.convergence}`;
    if (attempt.kind === 'refused') {
      if (attempt.convergence === 'read-only-reload') {
        scheduleF4AuthorityConvergenceReload(
          runtime,
          `Arc 5 Rename authority ${attempt.detail}`,
        );
      }
      return Object.freeze({
        kind: 'refused', durability: 'none', convergence: attempt.convergence,
        detail: attempt.detail, result: null,
      });
    }

    durable = true;
    f4LastCheckpointAt = performance.now();
    lastPersistenceOutcome = `arc5-rename-committed:${attempt.transaction.revision}`;
    if (attempt.kind === 'committed-convergence') {
      protectArc5RenameAfterDurability(
        runtime,
        `Arc 5 Rename committed at revision ${attempt.transaction.revision}; ${attempt.detail}`,
      );
      return Object.freeze({
        kind: 'committed', durability: 'committed', convergence: 'read-only-reload',
        detail: `revision:${attempt.transaction.revision};publication-reload`, result: null,
      });
    }

    try {
      const settlement = attempt.settlement;
      const creatureAfter = attempt.ownershipV2.creatures.find(
        (row) => row.creatureId === request.creatureId,
      );
      const otherParents = parent.creatures.filter((row) => row.creatureId !== request.creatureId);
      const otherSuccessors = attempt.ownershipV2.creatures.filter(
        (row) => row.creatureId !== request.creatureId,
      );
      if (!arc5RenameWritesMatchFixedInventory(attempt)
        || attempt.ownershipV2Evidence.representationVersion
          !== ARC5_OWNERSHIP_MIGRATION_VERSION
        || attempt.ownershipV2.revision !== parentRevision + 1
        || ownershipStateDigestV1(ownershipSourceStateV1(attempt.ownershipV2))
          !== parentSourceDigest
        || ownershipStateDigestV2(attempt.ownershipV2)
          !== ownershipStateDigestV2(settlement.successor)
        || settlement.preflight.parentRevision !== parentRevision
        || settlement.preflight.parentDigest !== parentDigest
        || settlement.preflight.creatureId !== request.creatureId
        || settlement.preflight.nicknameBefore !== request.nicknameBefore
        || settlement.preflight.nicknameAfter !== request.nicknameAfter
        || settlement.creatureBefore.creatureId !== request.creatureId
        || settlement.creatureBefore.nickname !== request.nicknameBefore
        || settlement.creatureAfter.creatureId !== request.creatureId
        || settlement.creatureAfter.nickname !== request.nicknameAfter
        || creatureAfter === undefined
        || JSON.stringify(creatureAfter) !== JSON.stringify(settlement.creatureAfter)
        || JSON.stringify(otherSuccessors) !== JSON.stringify(otherParents)
        || JSON.stringify(attempt.ownershipV2.catalogSpecies)
          !== JSON.stringify(parent.catalogSpecies)
        || JSON.stringify(attempt.ownershipV2.bredAcquisitions)
          !== JSON.stringify(parent.bredAcquisitions)
        || JSON.stringify(attempt.ownershipV2.creatureTombstones)
          !== JSON.stringify(parent.creatureTombstones)
        || JSON.stringify(attempt.ownershipV2.specimenLots)
          !== JSON.stringify(parent.specimenLots)
        || JSON.stringify(attempt.ownershipV2.specimenTombstones)
          !== JSON.stringify(parent.specimenTombstones)
        || attempt.transaction.state.unlocked.filter((id) => id === 'namer').length !== 1
        || JSON.stringify(save.unlocked) !== JSON.stringify(unlockedBefore)) {
        throw new Error('arc5-rename-fixed-point-mismatch');
      }
      publishArc5RenameAchievementFields(save, attempt.transaction.state);
      arc5OwnershipState = attempt.ownershipV2;
      arc5OwnershipEvidence = attempt.ownershipV2Evidence;
      arc5OwnershipProtection = null;
      lastArc5BootstrapOutcome = 'rename-committed-published';
      const result: Arc5RenameResult = Object.freeze({
        creatureId: request.creatureId,
        nicknameBefore: request.nicknameBefore,
        nicknameAfter: request.nicknameAfter,
        receiptOrdinal: settlement.receiptEvidence.ordinal,
        revision: attempt.transaction.revision,
        ownershipRevision: attempt.ownershipV2.revision,
      });
      lastArc5RenameResult = result;
      lastArc5RenameOutcome = `committed:${attempt.transaction.revision}`;
      presentProgressionCeremony({
        revision: attempt.transaction.revision,
        disposition: 'committed-publication',
        priorUnlockedIds: unlockedBefore,
        nextUnlockedIds: attempt.transaction.state.unlocked,
        addedAchievementIds: attempt.namerAchievementAdded ? ['namer'] : [],
        priorBestRankIndex: progressionBestRankBefore,
        nextBestRankIndex: attempt.transaction.state.stats.bestRank ?? 0,
      });
      return Object.freeze({
        kind: 'committed', durability: 'committed', convergence: 'none',
        detail: `revision:${attempt.transaction.revision}`, result,
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      protectArc5RenameAfterDurability(
        runtime,
        `Arc 5 Rename committed at revision ${attempt.transaction.revision}; publication ${detail}`,
      );
      return Object.freeze({
        kind: 'committed', durability: 'committed', convergence: 'read-only-reload',
        detail: `revision:${attempt.transaction.revision};publication-reload`, result: null,
      });
    }
  } catch (error) {
    if (durable) {
      protectArc5RenameAfterDurability(
        runtime,
        `Arc 5 Rename committed; publication ${error instanceof Error ? error.message : String(error)}`,
      );
      return Object.freeze({
        kind: 'committed', durability: 'committed', convergence: 'read-only-reload',
        detail: 'committed;publication-reload', result: null,
      });
    }
    lastArc5RenameResult = null;
    lastArc5RenameOutcome = 'rejected';
    return Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: error instanceof Error ? error.message : String(error), result: null,
    });
  } finally {
    productActionInFlight = false;
    actionClaim.settle(durable);
    if (durable) queueArc9ProgressionRefresh(actionClaim.operation);
    if (activePersist === actionBarrier) activePersist = null;
  }
}

function compendiumRenameOutcomeCopy(
  request: CompendiumRenameActionRequestV1,
  outcome: Arc5RenameCommitOutcome,
): CompendiumRenameActionOutcomeV1 {
  if (outcome.kind === 'committed' && outcome.convergence === 'none'
    && outcome.result !== null) {
    return Object.freeze({
      schema: COMPENDIUM_RENAME_OUTCOME_SCHEMA,
      kind: 'committed', convergence: 'none', request,
      title: 'Renamed.',
      detail: `${outcome.result.nicknameAfter} is now this exact companion’s durable name. Species, lineage, traits, and its same-species twins are unchanged.`,
    });
  }
  if (outcome.durability === 'committed') {
    return Object.freeze({
      schema: COMPENDIUM_RENAME_OUTCOME_SCHEMA,
      kind: 'committed-convergence', convergence: 'read-only-reload', request,
      title: 'Rename saved — reload required.',
      detail: 'The name is durable, but this tab could not verify its live copy. Reloading cannot rename twice.',
    });
  }
  const pending = outcome.detail.includes('pending');
  const storage = outcome.detail.includes('storage') || outcome.detail.includes('save');
  return Object.freeze({
    schema: COMPENDIUM_RENAME_OUTCOME_SCHEMA,
    kind: 'refused', convergence: outcome.convergence, request,
    title: outcome.convergence === 'read-only-reload' ? 'Reload required.' : 'Name unchanged.',
    detail: pending
      ? 'Another expedition action is settling. The current name remains unchanged.'
      : storage
        ? 'The expedition could not be saved. The current name remains unchanged.'
        : 'Rename authority changed before durability. The current name remains unchanged.',
  });
}

async function runCompendiumRenameAction(request: CompendiumRenameActionRequestV1): Promise<void> {
  let outcome: Arc5RenameCommitOutcome;
  try { outcome = await commitCompendiumRenameAction(request); }
  catch (error) {
    outcome = Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: error instanceof Error ? error.message : String(error), result: null,
    });
  }
  const copy = compendiumRenameOutcomeCopy(request, outcome);
  try {
    compendiumRenameController.settle(copy);
    if (copy.convergence === 'none') refreshCompendiumFeedState();
    updateChips();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    if (outcome.durability === 'committed' && f4Runtime !== null) {
      protectArc5RenameAfterDurability(
        f4Runtime,
        `Arc 5 Rename committed; presentation ${detail}`,
      );
      return;
    }
    if (f4Runtime !== null) {
      scheduleF4AuthorityConvergenceReload(
        f4Runtime,
        `Arc 5 Rename presentation rejected before durability (${detail})`,
      );
    }
  }
}

type Arc5ScoutCommitOutcome = Readonly<{
  kind: 'committed' | 'unavailable' | 'refused';
  durability: 'none' | 'committed';
  convergence: 'none' | 'read-only-reload';
  detail: string;
  result: Arc5ScoutResult | null;
}>;

function compendiumScoutRequestIsCurrent(
  request: CompendiumScoutActionRequestV1,
  parent: OwnershipStateV2,
): boolean {
  if (!Object.isFrozen(request) || !Object.isFrozen(request.surface)
    || codexGeneration !== request.surface.generation
    || codexMode !== 'detail'
    || codexDetailLogicalId !== request.surface.logicalId
    || openPanelId() !== 'codex') return false;
  const row = currentCompendiumDetailRow();
  if (row === null) return false;
  const model = projectCurrentCompendiumScout(row, request.surface.generation);
  if (model === null || model.availability !== 'ready'
    || model.contextKey !== request.contextKey
    || model.surface.generation !== request.surface.generation
    || model.surface.logicalId !== request.surface.logicalId
    || model.surface.speciesId !== request.surface.speciesId
    || model.surface.surfaceKey !== request.surface.surfaceKey
    || model.ownershipRevision !== request.ownershipRevision
    || model.ownershipDigest !== request.ownershipDigest
    || model.scoutCreatureId !== request.scoutBefore
    || parent.revision !== request.ownershipRevision
    || ownershipStateDigestV2(parent) !== request.ownershipDigest
    || parent.scoutCreatureId !== request.scoutBefore) return false;
  if (request.scoutAfter === null) {
    return request.scoutBefore !== null && model.creatures.some((candidate) => (
      candidate.creatureId === request.scoutBefore
      && candidate.current
      && candidate.status === 'ready'
    ));
  }
  const target = model.creatures.find(
    (candidate) => candidate.creatureId === request.scoutAfter,
  );
  return target?.status === 'ready' && !target.current
    && request.scoutAfter !== request.scoutBefore;
}

function arc5ScoutWritesMatchFixedInventory(
  attempt: Extract<Arc5ScoutActionOutcomeV1, { readonly kind: 'committed' }>,
): boolean {
  return attempt.ownershipWrites.length === ARC5_OWNERSHIP_EXTENSION_TARGETS.length
    && attempt.ownershipWrites.every((write, index) => (
      write.segment === ARC5_OWNERSHIP_EXTENSION_TARGETS[index]!.segment
      && write.namespace === ARC5_OWNERSHIP_EXTENSION_TARGETS[index]!.namespace
    ));
}

function arc5ScoutCharterFieldsMatch(
  left: SaveStateV2,
  right: SaveStateV2,
): boolean {
  return JSON.stringify(left.chacc) === JSON.stringify(right.chacc)
    && JSON.stringify(left.chDone) === JSON.stringify(right.chDone)
    && JSON.stringify(left.chProg) === JSON.stringify(right.chProg)
    && left.essence === right.essence
    && JSON.stringify(left.stats) === JSON.stringify(right.stats)
    && JSON.stringify(left.items) === JSON.stringify(right.items)
    && JSON.stringify(left.equip) === JSON.stringify(right.equip)
    && JSON.stringify(left.equipAff) === JSON.stringify(right.equipAff)
    && JSON.stringify(left.unlocked) === JSON.stringify(right.unlocked);
}

function protectArc5ScoutAfterDurability(runtime: F4RuntimeAuthority, detail: string): void {
  lastArc5ScoutResult = null;
  arc5OwnershipState = null;
  arc5OwnershipEvidence = null;
  arc5OwnershipProtection = 'committed-publication-reload';
  lastArc5BootstrapOutcome = 'scout-committed-publication-reload';
  lastArc5ScoutOutcome = 'committed-publication-reload';
  scheduleF4AuthorityConvergenceReload(runtime, detail);
}

/** Sole player-live Field Scout writer. The verified Compendium request is
 * captured before the shared claim; Back/Close may then release its DOM while
 * one no-retry exact-five CAS settles against that immutable parent. */
async function commitCompendiumScoutAction(
  request: CompendiumScoutActionRequestV1,
): Promise<Arc5ScoutCommitOutcome> {
  const unavailable = (detail: string): Arc5ScoutCommitOutcome => {
    lastArc5ScoutResult = null;
    lastArc5ScoutOutcome = `unavailable:${detail}`;
    return Object.freeze({
      kind: 'unavailable', durability: 'none', convergence: 'none', detail, result: null,
    });
  };
  const runtime = f4Runtime;
  const parent = arc5OwnershipState;
  const parentEvidence = arc5OwnershipEvidence;
  if (parent?.mode !== 'current' || parentEvidence?.representationVersion
    !== ARC5_OWNERSHIP_MIGRATION_VERSION || arc5OwnershipProtection !== null) {
    return unavailable(arc5OwnershipProtection ?? 'ownership-unavailable');
  }
  if (smokeForceReadOnly || !f4RuntimeMayMutate(runtime) || activePersist
    || importWriteInFlight || replacementTransaction || replacementReloadPending
    || trainingCheckpointWriteHeld) {
    return unavailable('write-authority-unavailable');
  }
  if (!compendiumScoutRequestIsCurrent(request, parent)) {
    return unavailable('presentation-authority-unavailable');
  }
  const parentRevision = parent.revision;
  const parentDigest = ownershipStateDigestV2(parent);
  const parentSourceDigest = ownershipStateDigestV1(ownershipSourceStateV1(parent));
  const sourceState = save;
  const saveBefore = JSON.stringify(sourceState);
  const priorScoutCharterPublication = Object.freeze({
    chacc: sourceState.chacc,
    chDone: sourceState.chDone,
    chProg: sourceState.chProg,
    essence: sourceState.essence,
    stats: sourceState.stats,
    items: sourceState.items,
    equip: sourceState.equip,
    equipAff: sourceState.equipAff,
    unlocked: sourceState.unlocked,
    starterStatus: lastStarterCharterAcceptStatus,
  });
  const restoreScoutCharterPublication = (): void => {
    if (save !== sourceState) return;
    sourceState.chacc = priorScoutCharterPublication.chacc;
    sourceState.chDone = priorScoutCharterPublication.chDone;
    sourceState.chProg = priorScoutCharterPublication.chProg;
    sourceState.essence = priorScoutCharterPublication.essence;
    sourceState.stats = priorScoutCharterPublication.stats;
    sourceState.items = priorScoutCharterPublication.items;
    sourceState.equip = priorScoutCharterPublication.equip;
    sourceState.equipAff = priorScoutCharterPublication.equipAff;
    sourceState.unlocked = priorScoutCharterPublication.unlocked;
    lastStarterCharterAcceptStatus = priorScoutCharterPublication.starterStatus;
  };

  const actionClaim = productActionCoordinator.tryClaim('arc5.field-scout');
  if (actionClaim === null) return unavailable('product-action-pending');
  const actionBarrier = actionClaim.barrier;
  lastArc5ScoutResult = null;
  lastArc5ScoutOutcome = 'pending';
  productActionInFlight = true;
  activePersist = actionBarrier;
  let durable = false;
  try {
    await smokeProductActionHold.holdIfArmed(actionClaim.operation);
    await settleF4Heartbeat();
    if (smokeForceReadOnly || !f4RuntimeMayMutate(runtime) || importWriteInFlight
      || replacementTransaction || replacementReloadPending || trainingCheckpointWriteHeld
      || save !== sourceState || JSON.stringify(sourceState) !== saveBefore) {
      return unavailable('write-authority-changed');
    }
    if (arc5OwnershipState !== parent || arc5OwnershipEvidence !== parentEvidence
      || arc5OwnershipProtection !== null || parent.revision !== parentRevision
      || ownershipStateDigestV2(parent) !== parentDigest
      || parent.scoutCreatureId !== request.scoutBefore) {
      return unavailable('ownership-authority-changed');
    }

    const attempt = await commitArc5ScoutActionV1({
      runtime,
      ownershipV2: parent,
      state: sourceState,
      scoutCreatureId: request.scoutAfter,
      codecNow: Date.now(),
    });
    lastArc5ScoutOutcome = `${attempt.kind}:${attempt.kind === 'refused'
      ? attempt.detail : attempt.convergence}`;
    if (attempt.kind === 'refused') {
      if (attempt.convergence === 'read-only-reload') {
        scheduleF4AuthorityConvergenceReload(
          runtime,
          `Arc 5 Field Scout authority ${attempt.detail}`,
        );
      }
      return Object.freeze({
        kind: 'refused', durability: 'none', convergence: attempt.convergence,
        detail: attempt.detail, result: null,
      });
    }

    durable = true;
    f4LastCheckpointAt = performance.now();
    lastPersistenceOutcome = `arc5-scout-committed:${attempt.transaction.revision}`;
    if (attempt.kind === 'committed-convergence') {
      protectArc5ScoutAfterDurability(
        runtime,
        `Arc 5 Field Scout committed at revision ${attempt.transaction.revision}; ${attempt.detail}`,
      );
      return Object.freeze({
        kind: 'committed', durability: 'committed', convergence: 'read-only-reload',
        detail: `revision:${attempt.transaction.revision};publication-reload`, result: null,
      });
    }

    try {
      const settlement = attempt.settlement;
      const checkpoint = runtime.checkpointParent();
      const starterCharterChanged = attempt.starterCharter?.changed === true;
      const transactionStateChanged = JSON.stringify(attempt.transaction.state) !== saveBefore;
      if (runtime !== f4Runtime
        || runtime.revision !== attempt.transaction.revision
        || checkpoint === null
        || JSON.stringify(checkpoint) !== JSON.stringify(attempt.transaction.state)
        || !arc5ScoutWritesMatchFixedInventory(attempt)
        || attempt.ownershipV2Evidence.representationVersion
          !== ARC5_OWNERSHIP_MIGRATION_VERSION
        || attempt.ownershipV2.revision !== parentRevision + 1
        || ownershipStateDigestV1(ownershipSourceStateV1(attempt.ownershipV2))
          !== parentSourceDigest
        || ownershipStateDigestV2(attempt.ownershipV2)
          !== ownershipStateDigestV2(settlement.successor)
        || settlement.preflight.parentRevision !== parentRevision
        || settlement.preflight.parentDigest !== parentDigest
        || settlement.preflight.scoutBefore !== request.scoutBefore
        || settlement.preflight.scoutAfter !== request.scoutAfter
        || settlement.successor.scoutCreatureId !== request.scoutAfter
        || attempt.ownershipV2.scoutCreatureId !== request.scoutAfter
        || attempt.transaction.plan.operation !== 'field-scout'
        || attempt.transaction.plan.receiptOrdinal !== settlement.receiptEvidence.ordinal
        || attempt.transaction.receipt.ordinal !== settlement.receiptEvidence.ordinal
        || attempt.transaction.receipt.kind !== 'arc5-field-scout'
        || JSON.stringify(attempt.transaction.state)
          !== JSON.stringify(attempt.transaction.saved.canonicalState)
        || starterCharterChanged !== transactionStateChanged
        || (request.scoutAfter === null) !== (attempt.starterCharter === null)
        || (attempt.starterCharter !== null && (
          attempt.starterCharter.event.kind !== 'scout-set'
          || attempt.starterCharter.event.scoutId !== request.scoutAfter
        ))
        || save !== sourceState
        || JSON.stringify(sourceState) !== saveBefore
        || attempt.ownershipV2.mode !== parent.mode
        || JSON.stringify(attempt.ownershipV2.catalogSpecies)
          !== JSON.stringify(parent.catalogSpecies)
        || JSON.stringify(attempt.ownershipV2.acquisitions)
          !== JSON.stringify(parent.acquisitions)
        || JSON.stringify(attempt.ownershipV2.bredAcquisitions)
          !== JSON.stringify(parent.bredAcquisitions)
        || JSON.stringify(attempt.ownershipV2.creatures)
          !== JSON.stringify(parent.creatures)
        || JSON.stringify(attempt.ownershipV2.creatureTombstones)
          !== JSON.stringify(parent.creatureTombstones)
        || JSON.stringify(attempt.ownershipV2.specimenLots)
          !== JSON.stringify(parent.specimenLots)
        || JSON.stringify(attempt.ownershipV2.specimenTombstones)
          !== JSON.stringify(parent.specimenTombstones)
        || JSON.stringify(attempt.ownershipV2.biosphereProgress)
          !== JSON.stringify(parent.biosphereProgress)
        || JSON.stringify(attempt.ownershipV2.legacyBioX)
          !== JSON.stringify(parent.legacyBioX)
        || JSON.stringify(attempt.ownershipV2.legacyProtection)
          !== JSON.stringify(parent.legacyProtection)) {
        throw new Error('arc5-scout-fixed-point-mismatch');
      }
      if (starterCharterChanged) {
        publishArc5ScoutCharterFieldsV1(sourceState, attempt.transaction.state);
        if (!arc5ScoutCharterFieldsMatch(sourceState, attempt.transaction.state)) {
          throw new Error('arc5-scout-charter-publication-mismatch');
        }
      }
      arc5OwnershipState = attempt.ownershipV2;
      arc5OwnershipEvidence = attempt.ownershipV2Evidence;
      arc5OwnershipProtection = null;
      lastArc5BootstrapOutcome = 'scout-committed-published';
      const result: Arc5ScoutResult = Object.freeze({
        scoutBefore: request.scoutBefore,
        scoutAfter: request.scoutAfter,
        receiptOrdinal: settlement.receiptEvidence.ordinal,
        revision: attempt.transaction.revision,
        ownershipRevision: attempt.ownershipV2.revision,
      });
      lastArc5ScoutResult = result;
      lastArc5ScoutOutcome = `committed:${attempt.transaction.revision}`;
      if (starterCharterChanged && attempt.starterCharter !== null) {
        const completions = attempt.starterCharter.completions;
        lastStarterCharterAcceptStatus = completions.length > 0
          ? `Completed ${completions.map(({ title }) => title).join(', ')} through Field Scout duty.`
          : 'Starter Charter progress was durably recorded through Field Scout duty.';
        presentProgressionCeremony({
          revision: attempt.transaction.revision,
          disposition: 'committed-publication',
          priorUnlockedIds: attempt.starterCharter.priorUnlockedIds,
          nextUnlockedIds: attempt.starterCharter.nextUnlockedIds,
          addedAchievementIds: attempt.starterCharter.addedAchievementIds,
          priorBestRankIndex: attempt.starterCharter.priorBestRankIndex,
          nextBestRankIndex: attempt.starterCharter.nextBestRankIndex,
        });
      }
      return Object.freeze({
        kind: 'committed', durability: 'committed', convergence: 'none',
        detail: `revision:${attempt.transaction.revision}`, result,
      });
    } catch (error) {
      restoreScoutCharterPublication();
      const detail = error instanceof Error ? error.message : String(error);
      protectArc5ScoutAfterDurability(
        runtime,
        `Arc 5 Field Scout committed at revision ${attempt.transaction.revision}; publication ${detail}`,
      );
      return Object.freeze({
        kind: 'committed', durability: 'committed', convergence: 'read-only-reload',
        detail: `revision:${attempt.transaction.revision};publication-reload`, result: null,
      });
    }
  } catch (error) {
    if (durable) {
      restoreScoutCharterPublication();
      protectArc5ScoutAfterDurability(
        runtime,
        `Arc 5 Field Scout committed; publication ${error instanceof Error ? error.message : String(error)}`,
      );
      return Object.freeze({
        kind: 'committed', durability: 'committed', convergence: 'read-only-reload',
        detail: 'committed;publication-reload', result: null,
      });
    }
    lastArc5ScoutResult = null;
    lastArc5ScoutOutcome = 'rejected';
    return Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: error instanceof Error ? error.message : String(error), result: null,
    });
  } finally {
    productActionInFlight = false;
    actionClaim.settle(durable);
    if (durable) queueArc9ProgressionRefresh(actionClaim.operation);
    if (activePersist === actionBarrier) activePersist = null;
  }
}

function compendiumScoutOutcomeCopy(
  request: CompendiumScoutActionRequestV1,
  outcome: Arc5ScoutCommitOutcome,
): CompendiumScoutActionOutcomeV1 {
  if (outcome.kind === 'committed' && outcome.convergence === 'none'
    && outcome.result !== null) {
    const stoodDown = outcome.result.scoutAfter === null;
    return Object.freeze({
      schema: COMPENDIUM_SCOUT_OUTCOME_SCHEMA,
      kind: 'committed', convergence: 'none', request,
      title: stoodDown ? 'Field Scout stood down.' : 'Field Scout named.',
      detail: stoodDown
        ? 'The expedition role is now durably open. Every companion and all of their traits remain unchanged.'
        : 'This exact companion now durably holds the expedition role. Every other companion and trait remains unchanged.',
    });
  }
  if (outcome.durability === 'committed') {
    return Object.freeze({
      schema: COMPENDIUM_SCOUT_OUTCOME_SCHEMA,
      kind: 'committed-convergence', convergence: 'read-only-reload', request,
      title: 'Field Scout saved — reload required.',
      detail: 'The role is durable, but this tab could not verify its live copy. Reloading cannot assign it twice.',
    });
  }
  const pending = outcome.detail.includes('pending');
  const storage = outcome.detail.includes('storage') || outcome.detail.includes('save');
  return Object.freeze({
    schema: COMPENDIUM_SCOUT_OUTCOME_SCHEMA,
    kind: 'refused', convergence: outcome.convergence, request,
    title: outcome.convergence === 'read-only-reload' ? 'Reload required.' : 'Field Scout unchanged.',
    detail: pending
      ? 'Another expedition action is settling. The saved Field Scout remains unchanged.'
      : storage
        ? 'The expedition could not be saved. The saved Field Scout remains unchanged.'
        : 'Field Scout authority changed before durability. The saved role remains unchanged.',
  });
}

async function runCompendiumScoutAction(request: CompendiumScoutActionRequestV1): Promise<void> {
  let outcome: Arc5ScoutCommitOutcome;
  try { outcome = await commitCompendiumScoutAction(request); }
  catch (error) {
    outcome = Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: error instanceof Error ? error.message : String(error), result: null,
    });
  }
  const copy = compendiumScoutOutcomeCopy(request, outcome);
  try {
    compendiumScoutController.settle(copy);
    if (copy.convergence === 'none') refreshCompendiumFeedState();
    updateChips();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    if (outcome.durability === 'committed' && f4Runtime !== null) {
      protectArc5ScoutAfterDurability(
        f4Runtime,
        `Arc 5 Field Scout committed; presentation ${detail}`,
      );
      return;
    }
    if (f4Runtime !== null) {
      scheduleF4AuthorityConvergenceReload(
        f4Runtime,
        `Arc 5 Field Scout presentation rejected before durability (${detail})`,
      );
    }
  }
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
    charterBioscanBanked: boolean;
    scoutCreatureId: string | null;
    scoutXpBefore: number | null;
    scoutXpAfter: number | null;
    scoutXpAward: 0 | 2;
    revision: number;
    ownershipRevision: number;
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
  const ownershipV1Parent = arc4OwnershipState;
  if (ownershipV1Parent?.mode !== 'current' || arc4OwnershipProtection !== null) {
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
    const faultInjection = !__CF_EVIDENCE_BUILD__ ? null : smokeRejectNextArc4ActionStorage
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
      if (__CF_EVIDENCE_BUILD__ && smokeRejectNextArc4Publication) {
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
      if (verified.ownership.revision !== ownershipV1Parent.revision + 1) {
        throw new Error('arc4-ownership-parent-revision-mismatch');
      }
      if (verified.ownershipV2.revision !== ownershipV2Parent.revision + 1) {
        throw new Error('arc5-ownership-parent-revision-mismatch');
      }
      if (ownershipStateDigestV1(verified.ownership)
        !== ownershipStateDigestV1(ownershipSourceStateV1(verified.ownershipV2))) {
        throw new Error('arc4-arc5-ownership-source-mismatch');
      }
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
        charterBioscanBanked: verified.charterBioscanBanked,
        scoutCreatureId: verified.scoutXp.scoutCreatureId,
        scoutXpBefore: verified.scoutXp.xpBefore,
        scoutXpAfter: verified.scoutXp.xpAfter,
        scoutXpAward: verified.scoutXp.xpAward,
        revision: transaction.revision,
        ownershipRevision: verified.ownershipV2.revision,
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
    if (durable) queueArc9ProgressionRefresh(actionClaim.operation);
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

function projectCurrentArc6CombatSurface(
  preparedRoster: CanonicalWorldRoster | null = null,
  observedActivePlayMs = f4Runtime?.diagnostics().activePlayMs ?? 0,
): Arc6CombatSurfaceProjection | null {
  if (!surveyOwnsCurrentCaptureSurface() || nav.mode !== 'surface'
    || lastCard === null || typeof lastCard.ptype !== 'string') return null;
  const address = canonicalCF1WorldAddressFromNav(nav);
  if (!address.ok || lastCard.planetSeed !== address.address.planet.seed) return null;
  let roster: CanonicalWorldRoster;
  if (preparedRoster !== null) {
    if (preparedRoster.worldKey !== address.address.key
      || preparedRoster.ecologyEpoch !== currentEcologyEpoch()) return null;
    roster = preparedRoster;
  } else {
    const rosterResult = canonicalWorldRoster(address.address, currentEcologyEpoch());
    if (!rosterResult.ok) return null;
    roster = rosterResult.roster;
  }
  if (!planetsideMatchesFullRoster(roster)) return null;
  const faunaRoster: Array<{
    speciesId: string;
    genome: never;
  }> = [];
  try {
    for (const row of roster.view.all) {
      if (row.kingdom !== 'fauna') continue;
      const identity = canonicalGenomeIdentityV1(row);
      faunaRoster.push({ speciesId: identity.speciesId, genome: row as never });
    }
    const claimedSignatureIds = PRIME_SIGNATURE_IDS_V1.filter((id) => (
      save.primeFill[id] !== undefined
    ));
    const conquered = save.conquered.some(([planetSeed]) => (
      Number(planetSeed) === address.address.planet.seed
    ));
    const encounter = projectGuardianPrimeEncounterV1({
      world: address.address,
      descriptor: Object.freeze({ worldType: lastCard.ptype }),
      regionIndex: regionAt(address.address.galaxy.x, address.address.galaxy.y),
      faunaRoster: Object.freeze(faunaRoster),
      claimedSignatureIds,
      conquered,
    });
    if (encounter === null) return null;
    const opportunity = projectWorldOpportunity(address.address);
    const ownership = arc5OwnershipState;
    const runtime = f4Runtime;
    if (ownership?.mode !== 'current' || runtime === null) return null;
    const championRoster = projectArc6CombatChampionRosterV1({
      ownershipV2: ownership,
      extensions: runtime.extensions,
    });
    if (championRoster.kind !== 'projected') return null;
    const authorityKey = `arc6-authority:${sha256Hex(JSON.stringify({
      encounter: encounter.witness,
      roster: roster.fullRosterFingerprint,
      ecologyEpoch: roster.ecologyEpoch,
      championRoster: championRoster.authorityKey,
      hp: save.hp,
      hpMax: save.HP_MAX,
      equip: save.equip,
      chacc: save.chacc,
    }))}`;
    const companionAvailability = championRoster.champions.map(({ creature }) => {
      const availability = projectArc6CombatChampionAvailabilityV1({
        ownershipV2: ownership,
        guardianRoster: championRoster,
        championId: creature.creatureId,
        observedActivePlayMs,
      });
      return Object.freeze([
        creature.creatureId,
        availability.kind,
        availability.kind === 'available' ? null : availability.reason,
      ] as const);
    });
    const contextKey = `arc6:${sha256Hex(JSON.stringify({
      authorityKey,
      observedActivePlayMs,
      companionAvailability,
    }))}`;
    return Object.freeze({
      authorityKey, contextKey, observedActivePlayMs, championRoster,
      encounter, opportunity, roster,
    });
  } catch {
    return null;
  }
}

function refreshCombatCardState(
  preparedRoster: CanonicalWorldRoster | null = null,
): void {
  const runtime = f4Runtime;
  const observedActivePlayMs = runtime?.diagnostics().activePlayMs ?? 0;
  const projection = projectCurrentArc6CombatSurface(preparedRoster, observedActivePlayMs);
  const ownership = arc5OwnershipState;
  if (projection === null || ownership?.mode !== 'current') {
    currentArc6CombatProjection = null;
    combatCardController.setState(null);
    return;
  }
  const policyReason = arc6CombatOpenPolicyReasonV1(save, projection.opportunity);
  const unavailableReason = arc5OwnershipEvidence?.representationVersion
      !== ARC5_OWNERSHIP_MIGRATION_VERSION
    || arc5OwnershipProtection !== null
    ? 'Combat is unavailable while creature ownership is protected.'
    : ecologyEpochBlocksActions()
      ? 'The living biosphere is settling a new ecology epoch. No duel was started.'
      : !f4RuntimeMayMutate(runtime) || activePersist || importWriteInFlight
        || replacementTransaction || replacementReloadPending || trainingCheckpointWriteHeld
        || productActionCoordinator.busy
        ? 'Another expedition action is settling or save authority is read-only.'
        : policyReason !== null
          ? `Combat is preserved but cannot settle yet: ${policyReason}. No duel was started.`
          : null;
  const model = projectCombatCardReadModelV1({
    contextKey: projection.contextKey,
    encounter: projection.encounter,
    state: save,
    ownershipV2: ownership,
    championRoster: projection.championRoster,
    observedActivePlayMs: projection.observedActivePlayMs,
    selectedChampionId: currentArc6ChampionId,
    unavailableReason,
  });
  if (model === null) {
    currentArc6CombatProjection = null;
    combatCardController.setState(null);
    return;
  }
  currentArc6CombatProjection = projection;
  currentArc6ChampionId = model.selectedChampionId;
  combatCardController.setState(model);
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
  kind: 'capture' | 'approach-ecology' | 'action' | 'close';
  key: string;
}>;

function captureSurveyFocusIdentity(): SurveyFocusIdentity | null {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement) || !card.contains(active)) return null;
  const captureControl = active.closest<HTMLElement>('[data-focus-key]');
  const captureKey = captureControl?.dataset.focusKey;
  if (captureKey) return Object.freeze({ kind: 'capture', key: captureKey });
  if (active.closest('[data-arc8-approach-ecology-listen]')) {
    return Object.freeze({ kind: 'approach-ecology', key: 'listen' });
  }
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
  } else if (identity.kind === 'approach-ecology') {
    target = card.querySelector<HTMLElement>('[data-arc8-approach-ecology-listen]');
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
  clearPlanetside();
  invalidateSurveyTravel();
  hideSurvey();
  discardSurveyPresentation('ecology-projection-suppressed');
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
        discardSurveyPresentation('ecology-survey-rebuild-refused');
      }
      restoreSurveyFocusIdentity(focusIdentity);
    } else if (cardWasOpen) {
      /* Generic/decorative cards currently retain no source-proven selector.
         Closing is the only honest invalidation after their scene objects are
         replaced; a stale transient descriptor must not survive the edge. */
      invalidateSurveyTravel();
      hideSurvey();
      discardSurveyPresentation('ecology-generic-survey-invalidated');
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
    const charter = result.charterBioscanBanked
      ? ' Charter: first life discovery on this alien world banked.' : '';
    const scoutXpApplied = result.scoutXpBefore === null || result.scoutXpAfter === null
      ? 0 : result.scoutXpAfter - result.scoutXpBefore;
    const scout = result.scoutXpAward === 2
      ? scoutXpApplied > 0
        ? ` Field Scout learned +${scoutXpApplied} XP.`
        : ' Field Scout is already at maximum level.'
      : '';
    return Object.freeze({
      schema: CAPTURE_CARD_OUTCOME_SCHEMA,
      kind: 'committed-hit', verb, convergence: 'none',
      title: `${past} ${result.firstForSpecies ? '' : 'another '}${result.speciesName}.`,
      detail: `${chance} odds. ${discovery}${reward}${charter}${scout} 1 Biosphere Yield spent; ${result.remainingAfter} remain.`,
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
      if (openPanelId() === 'ch') fillCharters();
      if (outcome.result.charterBioscanBanked) {
        gameEvent('bioscan', { worldKey: outcome.result.worldKey });
      }
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

function arc6CombatOutcomeCopy(outcome: Arc6CombatActionOutcomeV1): CombatCardActionOutcomeV1 {
  if (outcome.kind === 'committed') {
    const plan = outcome.verification.plan;
    const parts: string[] = [
      `Durable receipt ${plan.receipt.ordinal} verified at revision ${outcome.verification.revision}.`,
    ];
    if (plan.conquest.status === 'settle') parts.push('World conquered.');
    if (plan.rewards.stardust.status === 'award') {
      parts.push(`+${plan.rewards.stardust.amount} Stardust.`);
    }
    const starterCharter = outcome.verification.starterConquestCharter;
    if (starterCharter !== null) {
      parts.push(`Conquer a world Charter complete: +${starterCharter.stardustReward} Stardust.`);
    }
    if (plan.xp.status === 'award') parts.push(`Champion gained ${plan.xp.amount} XP.`);
    else if (plan.xp.status === 'loss-target' && plan.xp.totalDelta > 0) {
      parts.push(`Champion learned ${plan.xp.totalDelta} XP from the defeat.`);
    }
    if (plan.injury.status === 'set-hurt') {
      parts.push(plan.injury.reason === 'bred-crawl-home'
        ? 'The bred champion crawled home Critical.'
        : 'The champion returned wounded.');
    } else if (plan.injury.status === 'remove-creature') {
      parts.push('The champion was permanently lost.');
    } else if (plan.injury.status === 'damage-player') {
      parts.push(`You lost ${plan.injury.damage} HP and remain at ${plan.injury.hpAfter}.`);
    }
    if (plan.guardianCapture.status === 'ownership-writer-required') {
      parts.push(`${plan.guardianCapture.source} captured with battlefield modifiers stripped.`);
    }
    if (plan.primeClaim.status === 'claim') {
      parts.push(`${plan.primeClaim.title} joined the Prime Codex.`);
    }
    if (plan.rewards.guardianAuthoredReward.status === 'unsupported-open') {
      parts.push('No extra Guardian Gear reward was invented; that authored table remains open.');
    }
    const kind = plan.outcome === 'champion-win' ? 'verified-win'
      : plan.outcome === 'defender-win' ? 'verified-loss' : 'verified-draw';
    return Object.freeze({
      schema: COMBAT_CARD_OUTCOME_SCHEMA,
      kind,
      convergence: 'none',
      title: plan.outcome === 'champion-win'
        ? `${plan.champion.name} prevailed.`
        : plan.outcome === 'defender-win'
          ? `${plan.encounter.defender.name} prevailed.`
          : 'The duel ended without a victor.',
      detail: parts.join(' '),
    });
  }
  if (outcome.kind === 'committed-convergence') {
    return Object.freeze({
      schema: COMBAT_CARD_OUTCOME_SCHEMA,
      kind: 'committed-unknown',
      convergence: 'read-only-reload',
      title: 'Combat committed.',
      detail: 'The durable result is reloading for exact publication. Do not challenge again.',
    });
  }
  return Object.freeze({
    schema: COMBAT_CARD_OUTCOME_SCHEMA,
    kind: 'refused',
    convergence: outcome.convergence,
    title: outcome.convergence === 'read-only-reload' ? 'Reload required.' : 'Challenge unavailable.',
    detail: outcome.convergence === 'read-only-reload'
      ? 'Combat authority changed or storage became ambiguous. No result was published and the duel will not retry.'
      : `${outcome.detail}. No duel was committed.`,
  });
}

function protectArc6CombatAfterDurability(
  runtime: F4RuntimeAuthority,
  detail: string,
): void {
  currentArc6CombatProjection = null;
  arc5OwnershipState = null;
  arc5OwnershipEvidence = null;
  arc5OwnershipProtection = 'combat-committed-publication-reload';
  lastArc5BootstrapOutcome = 'combat-committed-publication-reload';
  lastArc6CombatOutcome = 'committed-publication-reload';
  scheduleF4AuthorityConvergenceReload(runtime, detail);
}

async function commitCurrentArc6Combat(
  request: Extract<CombatCardActionRequestV1, { readonly kind: 'challenge' }>,
): Promise<Arc6CombatActionOutcomeV1> {
  const refused = (
    detail: string,
    convergence: 'none' | 'read-only-reload' = 'none',
  ): Extract<Arc6CombatActionOutcomeV1, { readonly kind: 'refused' }> => Object.freeze({
    kind: 'refused', durability: 'none', convergence, detail, transaction: null,
  });
  const runtime = f4Runtime;
  const intendedSurface = nav;
  const intendedProjection = currentArc6CombatProjection;
  const parent = arc5OwnershipState;
  const parentEvidence = arc5OwnershipEvidence;
  if (intendedSurface.mode !== 'surface' || intendedProjection === null) {
    return refused('surface-presentation-authority-unavailable');
  }
  if (parent?.mode !== 'current'
    || parentEvidence?.representationVersion !== ARC5_OWNERSHIP_MIGRATION_VERSION
    || arc5OwnershipProtection !== null) {
    return refused(`ownership:${arc5OwnershipProtection ?? 'unavailable'}`);
  }
  if (request.championId !== currentArc6ChampionId) return refused('champion-selection-changed');
  const intendedAvailability = projectArc6CombatChampionAvailabilityV1({
    ownershipV2: parent,
    guardianRoster: intendedProjection.championRoster,
    championId: request.championId,
    observedActivePlayMs: intendedProjection.observedActivePlayMs,
  });
  if (intendedAvailability.kind !== 'available') {
    return refused(`champion:${intendedAvailability.reason}`);
  }
  if (!f4RuntimeMayMutate(runtime) || activePersist || importWriteInFlight
    || replacementTransaction || replacementReloadPending || trainingCheckpointWriteHeld
    || ecologyEpochBlocksActions()) return refused('write-authority-unavailable');
  const parentDigest = ownershipStateDigestV2(parent);
  const actionClaim = productActionCoordinator.tryClaim('arc6.combat-settlement');
  if (actionClaim === null) return refused('product-action-pending');
  const actionBarrier = actionClaim.barrier;
  productActionInFlight = true;
  activePersist = actionBarrier;
  lastArc6CombatOutcome = 'pending';
  let durable = false;
  let attempt: Arc6CombatActionOutcomeV1 | null = null;
  try {
    await smokeProductActionHold.holdIfArmed(actionClaim.operation);
    await settleF4Heartbeat();
    if (!f4RuntimeMayMutate(runtime) || importWriteInFlight
      || replacementTransaction || replacementReloadPending || trainingCheckpointWriteHeld
      || ecologyEpochBlocksActions()) return refused('write-authority-changed');
    if (nav !== intendedSurface || nav.mode !== 'surface'
      || arc5OwnershipState !== parent || arc5OwnershipEvidence !== parentEvidence
      || ownershipStateDigestV2(parent) !== parentDigest) {
      return refused('surface-or-ownership-authority-changed');
    }
    const observedActivePlayMs = runtime.diagnostics().activePlayMs;
    const currentProjection = projectCurrentArc6CombatSurface(null, observedActivePlayMs);
    if (currentProjection === null
      || currentProjection.authorityKey !== intendedProjection.authorityKey
      || currentProjection.observedActivePlayMs !== observedActivePlayMs
      || currentProjection.encounter.witness !== intendedProjection.encounter.witness
      || currentProjection.opportunity.key !== intendedProjection.opportunity.key) {
      return refused('combat-presentation-authority-changed');
    }
    const currentAvailability = projectArc6CombatChampionAvailabilityV1({
      ownershipV2: parent,
      guardianRoster: currentProjection.championRoster,
      championId: request.championId,
      observedActivePlayMs: currentProjection.observedActivePlayMs,
    });
    if (currentAvailability.kind !== 'available') {
      return refused(`champion:${currentAvailability.reason}`);
    }
    const progressionUnlockedBefore = save.unlocked;
    const progressionBestRankBefore = save.stats.bestRank ?? 0;
    attempt = await commitArc6CombatActionV1({
      runtime,
      state: save,
      extensions: runtime.extensions,
      encounter: currentProjection.encounter,
      opportunity: currentProjection.opportunity,
      ownershipV2: parent,
      championId: request.championId,
      championRosterAuthorityKey: currentProjection.championRoster.authorityKey,
      observedActivePlayMs: currentProjection.observedActivePlayMs,
      codecNow: Date.now(),
    });
    lastArc6CombatOutcome = `${attempt.kind}:${attempt.kind === 'refused'
      ? attempt.detail : attempt.convergence}`;
    if (attempt.kind === 'refused') {
      if (attempt.convergence === 'read-only-reload') {
        scheduleF4AuthorityConvergenceReload(runtime, `Arc 6 combat authority ${attempt.detail}`);
      }
      return attempt;
    }
    durable = true;
    f4LastCheckpointAt = performance.now();
    if (attempt.kind === 'committed-convergence') {
      protectArc6CombatAfterDurability(
        runtime,
        `Arc 6 combat committed at revision ${attempt.transaction.transaction.revision}; ${attempt.detail}`,
      );
      return attempt;
    }
    try {
      const verification = attempt.verification;
      if (runtime.revision !== verification.revision
        || runtime.checkpointParent() === null) {
        throw new Error('combat runtime did not publish its exact durable checkpoint');
      }
      const loadedOwnership = readArc5OwnershipMigration(
        runtime.extensions,
        SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      );
      if (loadedOwnership.kind !== 'loaded') {
        throw new Error(`combat ownership carrier reopened ${loadedOwnership.kind}`);
      }
      const expectedOwnership = verification.ownershipV2 ?? parent;
      if (ownershipStateDigestV2(loadedOwnership.state)
        !== ownershipStateDigestV2(expectedOwnership)) {
        throw new Error('combat ownership fixed point mismatch');
      }
      const committedRoster = projectArc6CombatChampionRosterV1({
        ownershipV2: loadedOwnership.state,
        extensions: runtime.extensions,
      });
      if (committedRoster.kind !== 'projected') {
        throw new Error(`combat Guardian roster reopened ${committedRoster.reason}`);
      }
      const selectedGuardian = currentProjection.championRoster.champions.some((row) => (
        row.source === 'guardian' && row.creature.creatureId === request.championId
      ));
      if (selectedGuardian && (verification.guardianAcquisitions === null
        || verification.guardianCompanions === null)) {
        throw new Error('Guardian champion settlement omitted its verified carrier successors');
      }
      if (verification.guardianAcquisitions !== null
        && committedRoster.guardianSourceDigest
          !== guardianAcquisitionStateDigestV1(verification.guardianAcquisitions)) {
        throw new Error('Guardian acquisition fixed point mismatch');
      }
      if (verification.guardianCompanions !== null
        && committedRoster.guardianOverlayDigest
          !== guardianCompanionStateDigestV1(verification.guardianCompanions)) {
        throw new Error('Guardian companion fixed point mismatch');
      }
      if (verification.guardianAcquisitions !== null
        || verification.guardianCompanions !== null) {
        if (!guardianLegacyCompanionSliceMatchesV1(
          runtime.extensions,
          verification.state,
        )) {
          throw new Error('Guardian composite Compendium fixed point mismatch');
        }
      }
      save = verification.state;
      if (verification.guardianAcquisitions !== null
        || verification.guardianCompanions !== null) syncCustomNameIndex();
      arc5OwnershipState = loadedOwnership.state;
      arc5OwnershipEvidence = loadedOwnership.evidence;
      arc5OwnershipProtection = null;
      lastArc5BootstrapOutcome = 'combat-committed-published';
      currentArc6CombatProjection = null;
      lastPersistenceOutcome = `arc6-combat-committed:${verification.revision}`;
      lastArc6CombatOutcome = `committed:${verification.revision}:${verification.plan.outcome}`;
      const directAchievementIds = verification.state.unlocked
        .slice(progressionUnlockedBefore.length)
        .filter((id) => id === 'settle1' || id === 'brink');
      presentProgressionCeremony({
        revision: verification.revision,
        disposition: 'committed-publication',
        priorUnlockedIds: progressionUnlockedBefore,
        nextUnlockedIds: verification.state.unlocked,
        addedAchievementIds: directAchievementIds,
        priorBestRankIndex: progressionBestRankBefore,
        nextBestRankIndex: verification.state.stats.bestRank ?? 0,
      });
      return attempt;
    } catch (error) {
      protectArc6CombatAfterDurability(
        runtime,
        `Arc 6 combat committed; publication ${error instanceof Error ? error.message : String(error)}`,
      );
      return Object.freeze({
        kind: 'committed-convergence', durability: 'committed', convergence: 'read-only-reload',
        detail: 'committed-publication-fixed-point-mismatch', transaction: attempt.transaction,
      });
    }
  } catch (error) {
    if (durable && attempt !== null && attempt.kind !== 'refused') {
      protectArc6CombatAfterDurability(
        runtime,
        `Arc 6 combat committed; presentation ${error instanceof Error ? error.message : String(error)}`,
      );
      return Object.freeze({
        kind: 'committed-convergence', durability: 'committed', convergence: 'read-only-reload',
        detail: 'committed-presentation-fault', transaction: attempt.transaction,
      });
    }
    return refused(error instanceof Error ? error.message : String(error));
  } finally {
    productActionInFlight = false;
    actionClaim.settle(durable);
    if (durable) queueArc9ProgressionRefresh(actionClaim.operation);
    if (activePersist === actionBarrier) activePersist = null;
  }
}

function presentCommittedCombatChronicle(
  outcome: Extract<Arc6CombatActionOutcomeV1, { readonly kind: 'committed' }>,
): void {
  const settlement = outcome.verification.plan;
  const participants = projectCombatCueParticipantsV1(settlement);
  const cuePlan = combatCuePlan(settlement, participants);
  const chronicle = projectCombatChronicleV1(settlement, cuePlan);
  const opener = card.querySelector<HTMLElement>('[data-combat-challenge]');
  openPanel('combat', opener);
  if (openPanelId() !== 'combat') {
    throw new Error('Combat Chronicle panel did not open');
  }
  const generation = combatChronicleController.start(chronicle, cuePlan);
  combatChronicleAudioSession = null;
  if (openPanelId() !== 'combat'
    || combatChronicleMount.querySelector('[data-combat-chronicle-log]') === null) {
    tameGreetingAudioOwner?.cancelCombatPlayback('chronicle-not-current');
    throw new Error('Combat Chronicle did not retain its current presentation');
  }
  try {
    const claim = tameGreetingAudioOwner?.claimCommittedCombatSession(outcome, cuePlan) ?? null;
    if (claim !== null) {
      combatChronicleAudioSession = Object.freeze({ claim, generation, plan: cuePlan });
    }
  } catch {
    /* Combat sound is optional presentation. A verified durable settlement
       and its accessible Chronicle remain complete if audio cannot claim. */
    tameGreetingAudioOwner?.cancelCombatPlayback('chronicle-claim-fault');
  }
}

async function playCombatChronicleCue(
  emission: CombatChronicleCueEmissionV1,
): Promise<void> {
  const session = combatChronicleAudioSession;
  const owner = tameGreetingAudioOwner;
  if (session === null || owner === null) return;
  if (session.plan !== emission.plan
    || session.generation !== emission.counterpart.generation
    || !combatChronicleController.counterpartIsCurrent(emission.counterpart)) {
    combatChronicleAudioSession = null;
    owner.cancelCombatPlayback('chronicle-counterpart-mismatch');
    return;
  }
  try {
    await owner.playClaimedCombatCue(session.claim, emission.cue, emission.counterpart);
  } catch {
    if (combatChronicleAudioSession === session) combatChronicleAudioSession = null;
    owner.cancelCombatPlayback('chronicle-playback-fault');
  }
}

async function runArc6CombatCardAction(request: CombatCardActionRequestV1): Promise<void> {
  if (request.kind !== 'challenge') return;
  let outcome: Arc6CombatActionOutcomeV1;
  try { outcome = await commitCurrentArc6Combat(request); }
  catch (error) {
    outcome = Object.freeze({
      kind: 'refused', durability: 'none', convergence: 'none',
      detail: error instanceof Error ? error.message : String(error), transaction: null,
    });
  }
  const copy = arc6CombatOutcomeCopy(outcome);
  let chroniclePresentationError: string | null = null;
  if (outcome.kind !== 'committed') {
    tameGreetingAudioOwner?.cancelCombatPlayback('challenge-not-committed');
  }
  try {
    combatCardController.settle(copy);
    if (outcome.kind === 'committed') {
      updateChips();
      if (openPanelId() === 'codex') fillCodex(codexFilter);
      if (openPanelId() === 'ch') fillCharters();
      if (outcome.verification.plan.conquest.status === 'settle') {
        gameEvent('conquest', {
          worldKey: outcome.verification.plan.encounter.identity.world.key,
          defenderKind: outcome.verification.plan.encounter.defender.kind,
          outcome: outcome.verification.plan.outcome,
        });
      }
      try { presentCommittedCombatChronicle(outcome); }
      catch (error) {
        chroniclePresentationError = error instanceof Error ? error.message : String(error);
        combatChronicleAudioSession = null;
        tameGreetingAudioOwner?.cancelCombatPlayback('chronicle-presentation-fault');
        if (openPanelId() === 'combat') closePanels();
      }
      refreshCaptureCardState();
    }
    toast(
      copy.title,
      chroniclePresentationError === null
        ? copy.detail
        : `${copy.detail} Combat Chronicle presentation was unavailable; the durable result remains complete.`,
      true,
    );
  } catch (error) {
    if (outcome.durability === 'committed' && f4Runtime !== null) {
      protectArc6CombatAfterDurability(
        f4Runtime,
        `Arc 6 combat committed; result presentation ${error instanceof Error ? error.message : String(error)}`,
      );
      return;
    }
    combatCardController.clearPending();
    toast('Challenge presentation unavailable', 'No duel was committed. Reopen Survey to try again.', true);
  }
}

function engineeringOutcomeConverges(outcome: Arc3AppActionOutcome): boolean {
  return outcome.detail.includes('publication-reload')
    || outcome.detail === 'stale'
    || outcome.detail === 'revision-exhausted'
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
async function smokeDrainFixturePersist(): Promise<boolean> {
  /* Browser-gate setup only. Remove the unstarted navigation debounce, join
     the exact already-started tail, then commit one ordinary checkpoint so a
     deliberately held writer can be armed from a proven quiescent baseline. */
  clearTimeout(_persistT); _persistT = 0;
  const pendingPersist = activePersist;
  if (pendingPersist) {
    try { await pendingPersist; } catch { /* the follow-up commit proves authority */ }
  }
  if (activePersist || importWriteInFlight || replacementTransaction
    || replacementReloadPending || f4AuthorityReloadScheduled) return false;
  const committed = await persistView();
  return committed && activePersist === null && _persistT === 0;
}
async function smokeStageStoredV4(raw: string | null, backup?: string): Promise<boolean> {
  /* Browser-gate fixture setup only. A v4 fixture must represent a genuinely
     pre-migration database; overwriting only the compatibility mirror under
     a live v5 schema is correctly classified as corruption. Quiesce this
     document, wipe every authoritative store, then stage the exact old bytes
     for the NEXT document's real migration path. */
  if ((raw !== null && typeof raw !== 'string')
    || (backup !== undefined && typeof backup !== 'string')
    || (raw === null && backup !== undefined) || importWriteInFlight
    || replacementTransaction || replacementReloadPending
    || f4AuthorityReloadScheduled) return false;
  /* Navigation can leave one already-started persist in flight immediately
     before a browser fixture transition. Cancel an unstarted debounce, make
     new mutations impossible, and join that exact write before clearing the
     isolated store. Returning false here made the Slice gate reload its prior
     expedition and then misreport route/Atlas product failures. */
  clearTimeout(_persistT); _persistT = 0;
  stopF4Heartbeat();
  f4Runtime?.setAnswerable(false);
  persistHold = 'protected-payload';
  await settleF4Heartbeat();
  const pendingPersist = activePersist;
  if (pendingPersist) {
    try { await pendingPersist; } catch { /* settlement, not success, owns this boundary */ }
  }
  if (activePersist || importWriteInFlight || replacementTransaction
    || replacementReloadPending || f4AuthorityReloadScheduled) return false;
  await f4Runtime?.release();
  f4Runtime = null;
  /* Clear every current authority and stage the legacy fixture in one IDB
     transaction. A two-transaction clear-then-write exposed an empty database
     to sibling documents and could destroy the fixture if the write failed. */
  const staged = await persistenceBackend.compareAndApply(
    [],
    raw === null ? [] : [
      { store: 'meta', key: 'save', value: raw },
      ...(backup === undefined ? [] : [{ store: 'meta' as const, key: 'save_bak', value: backup }]),
    ],
    STORES,
  );
  return staged;
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
function pwaReloadConflict(): string | null {
  if (productActionInFlight) return 'product-action';
  if (importWriteInFlight) return 'import-write';
  if (trainingCheckpointWriteHeld || trainingActive() || trainingRecoveryLock !== null) return 'training';
  if (f4AuthorityReloadScheduled || replacementReloadPending || ecologyEpochBlocksActions()) {
    return 'authority-convergence';
  }
  if (!f4RuntimeMayMutate()) return 'save-authority';
  return null;
}
async function reloadForPwaUpdate(): Promise<void> {
  const outcome = await coordinatePwaReload<ReplacementTransaction>({
    conflict: pwaReloadConflict,
    claim: () => claimReplacementTransaction('pwa-update'),
    activePersist: () => activePersist,
    checkpointRequired: (claim) => claim.persistWasScheduled,
    checkpoint: (claim) => persistView(claim),
    release: (claim) => { releaseReplacementTransaction(claim); },
    schedule: (claim) => { scheduleReplacementReload(claim); },
  });
  if (outcome.kind === 'scheduled') return;
  if (outcome.stage === 'preflight') {
    const detail = outcome.detail === 'product-action'
      ? 'Finish the current expedition action before changing builds.'
      : outcome.detail === 'import-write'
        ? 'Finish bringing the expedition before changing builds.'
        : outcome.detail === 'training'
          ? 'Finish or recover Field Training before changing builds.'
          : 'The current save authority is already converging or protected. Let its reload finish before changing builds.';
    toast('Reload held safely', detail);
    return;
  }
  if (outcome.stage === 'claim') {
    toast('Reload already underway', 'Finish the current expedition replacement before changing builds.');
    return;
  }
  toast(
    'Save not yet durable',
    'The build was not changed. Your pending settings save was restored; try Reload when ready again after storage settles.',
    true,
  );
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
  '#dockcharts', '#setsnd', '#setvol', '#setvoice', '[data-pref]', '[data-motion]',
  '#setcharts', '#setfx', '#setshake', '#setglass', '#setrestart',
  '[data-arc9-nameplate-choice]',
  '[data-frontier-ending-id]',
  '[data-starter-charter-accept]',
  '[data-binder-claim]',
  '[data-arc9-explorer-name-save]',
  '[data-atlas-favorite]', '[data-atlas-home]', '[data-atlas-remove]', '[data-atlas-undo]',
  '[data-act="landcta"]', '[data-act="add"]', '[data-act="bioscan"]', '[data-act="share"]',
  '[data-capture-action]',
  '[data-arc5-feed-confirm]',
  '[data-arc5-explorer-meal-confirm]',
  '[data-arc5-breed-confirm]',
  '[data-arc5-rename-confirm]',
  '[data-arc5-scout-confirm]',
  '[data-sel="tutbtn"]', '[data-sel="tutskip"]',
].join(',');
type MutationBlockCopy = Readonly<{ title: string; detail: string }>;
function mutationBlockCopy(productActionPending: boolean): MutationBlockCopy {
  return productActionPending
    ? Object.freeze({
      title: 'Expedition action settling',
      detail: 'Stay on this location until its durable result settles. Survey Close remains available.',
    })
    : Object.freeze({
      title: 'Read-only expedition',
      detail: 'Inspection remains available, but this action cannot change the expedition until save authority is restored.',
    });
}
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
  const copy = mutationBlockCopy(productActionInFlight);
  lastMutationBlockWitness = Object.freeze({
    schema: 'cf-v2-read-only-boundary/v1', action, count: ++mutationBlockCount,
    hold: persistHold, leaseOwned: runtime?.leaseOwned === true,
    staleBlocked: runtime?.staleBlocked === true,
    seedBootstrapPending: f4SeedBootstrapPending,
    bootRouteRepairPending,
    ownershipV2BootstrapPending: arc5OwnershipBootstrapPending,
  });
  toast(copy.title, copy.detail, true);
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
  for (const [id, entry] of first.state.logMap) {
    const rawWhere = first.ingress.atlasWhere.get(entry);
    if (rawWhere === null || rawWhere === undefined) {
      entry.where = null;
      continue;
    }
    const route = resolveViewToNav(rawWhere);
    if (route.ok && route.state.mode !== 'universe'
      && atlasRouteIdentityMatches(id, route.state)) entry.where = navToView(route.state);
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
    if (!atlasRouteIdentityMatches(id, route.state)) continue;
    atlasRoutes.set(entry, route.state);
    if (route.state.mode === 'surface') {
      const routeKey = getProvenPlanetKey(route.state.planet);
      if ((expectedEarthKey !== null && routeKey === expectedEarthKey)
        || (expectedEarthKey === null && id === 'p133')) earthKey = routeKey;
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
      const binding = __CF_EVIDENCE_BUILD__
        ? (window as unknown as Record<string, unknown>).__cfTrainingRestoreWitness : undefined;
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
      const restored = __CF_EVIDENCE_BUILD__ && smokeRejectNextTrainingRouteResolution
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
      const earth = __CF_EVIDENCE_BUILD__ && smokeRejectNextTrainingRouteResolution
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
        const earthAddress = canonicalWorldAddressForNav(earth.state);
        if (earthAddress === null) {
          throw new Error('legacy Training Earth address could not be proven');
        }
        const restored = buildLegacyTrainingRestoreCandidate({
          current: candidate,
          checkpoint: checkpoint.snapshot,
          registry: REGISTRY,
          now,
          epoch,
          canonicalEarthView: navToView(earth.state)!,
          canonicalEarthAtlasId: canonicalCF1WorldAtlasId(earthAddress),
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

    const prepared = __CF_EVIDENCE_BUILD__ && smokeRejectNextTrainingCandidateProof
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
    const durableWorldIdentity = readWorldIdentity(f4Runtime!.extensions);
    if (durableWorldIdentity.kind !== 'loaded') {
      throw new Error(`Training canonical world identity refused: ${durableWorldIdentity.kind}`);
    }
    const worldIdentityWrites = encodeWorldIdentityExtensionWrites(durableWorldIdentity.state);
    phase('primary-write-started');
    writeStarted = true;
    let trainingCommittedState: SaveStateV2 | null = null;
    const write = (async (): Promise<boolean> => {
      if (__CF_EVIDENCE_BUILD__ && smokeRejectNextTrainingCommit) {
        smokeRejectNextTrainingCommit = false;
        throw new Error('slice-smoke injected Training commit rejection');
      }
      const committed = await f4Runtime!.commit(
        prepared.state,
        now,
        [
          ...(preparedLoot === null ? [] : [preparedLoot.write]),
          ...(preparedOwnership === null ? [] : preparedOwnership.writes),
          ...(arc5Preparation.kind === 'prepared' ? arc5Preparation.writes : []),
          ...worldIdentityWrites,
        ],
      );
      lastPersistenceOutcome = committed.kind === 'committed'
        ? `training-committed:${committed.revision}` : `training-${committed.kind}`;
      if (committed.kind !== 'committed') {
        if (committed.kind === 'stale') {
          persistHold = 'protected-payload';
          persistenceProtectedDetail = `stale revision ${committed.expectedRevision}/${committed.actualRevision}`;
        } else if (committed.kind === 'revision-exhausted') {
          persistHold = 'protected-payload';
          persistenceBootKind = 'revision-exhausted-protected';
          persistenceProtectedDetail = `F3 revision ${committed.revision} is exhausted`;
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
    if (__CF_EVIDENCE_BUILD__ && smokeRejectNextTrainingPublish) {
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
    const restoredWorldIdentity = readWorldIdentity(f4Runtime!.extensions);
    if (restoredWorldIdentity.kind !== 'loaded') {
      throw new Error('Training canonical world identity carrier did not converge');
    }
    const restoredWorldIdentityWrites = encodeWorldIdentityExtensionWrites(restoredWorldIdentity.state);
    if (restoredWorldIdentityWrites.some((write, index) => (
      write.segment !== worldIdentityWrites[index]!.segment
      || write.namespace !== worldIdentityWrites[index]!.namespace
      || write.carrier.version !== worldIdentityWrites[index]!.carrier.version
      || write.carrier.json !== worldIdentityWrites[index]!.carrier.json
    ))) {
      throw new Error('Training canonical world identity carrier was not preserved exactly');
    }
    save = prepared.state;
    worldIdentityState = restoredWorldIdentity.state;
    worldIdentityBootstrapPending = false;
    worldIdentityProtection = null;
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
    clearArc9AtlasUndo();
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
      worldIdentityState = createEmptyWorldIdentityState();
      worldIdentityProtection = 'committed-publication-reload';
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
  if (!__CF_EVIDENCE_BUILD__) return;
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
  arc4OwnershipBootstrapVerification = null;
  arc4OwnershipProtection = null;
  lastArc4BootstrapOutcome = null;
  lastArc4CaptureOutcome = null;
  arc5OwnershipState = null;
  arc5OwnershipEvidence = null;
  arc5OwnershipBootstrapPrepared = null;
  arc5OwnershipBootstrapPending = false;
  arc5OwnershipProtection = null;
  lastArc5BootstrapOutcome = null;
  lastArc5FeedOutcome = null;
  lastArc5FeedResult = null;
  lastArc5ExplorerMealOutcome = null;
  lastArc5ExplorerMealResult = null;
  lastArc5BreedOutcome = null;
  lastArc5BreedResult = null;
  lastArc5RenameOutcome = null;
  lastArc5RenameResult = null;
  lastArc5ScoutOutcome = null;
  lastArc5ScoutResult = null;
  lastSmokeArc5FeedFaultWitness = null;
  smokeRejectNextArc5FeedStorage = false;
  smokeStaleNextArc5FeedAuthority = false;
  smokeRejectNextArc5FeedPublication = false;
  smokeRejectArc5FeedStorageBoundary = false;
  worldIdentityState = createEmptyWorldIdentityState();
  worldIdentityBootstrapPending = false;
  worldIdentityProtection = null;
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
    if (!persistHold && initialRevision === F3_MAX_REVISION) {
      persistHold = 'protected-payload';
      protectedReason = 'invalid';
      persistenceBootKind = 'revision-exhausted-protected';
      persistenceProtectedDetail = `F3 revision ${initialRevision} is exhausted`;
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
  for (const [id, entry] of save.logMap) {
    const rawWhere = bootIngress.atlasWhere.get(entry);
    if (rawWhere === null || rawWhere === undefined) {
      entry.where = null;
      continue;
    }
    const route = resolveViewToNav(rawWhere);
    if (route.ok && route.state.mode !== 'universe'
      && atlasRouteIdentityMatches(id, route.state)) {
      atlasRouteStates.set(entry, route.state);
      provenAtlasEngineeringRoutes.push(route.state);
      entry.where = navToView(route.state);
    } else if (route.ok || route.reason !== 'source-error') {
      entry.where = null;
    }
  }
  trainingSnapshotIngress = bootIngress.trainingSnapshot;
  /* Current world history is source-bound before any UI or Training seat can
     use it. Only complete routes proven above may seed an absent carrier;
     the old leaf-seed land/name fields remain compatibility mirrors. */
  if (!persistHold) {
    const knownWorlds: CanonicalCF1WorldAddress[] = [];
    for (const route of [savedEngineeringRoute, ...provenAtlasEngineeringRoutes]) {
      if (route === null) continue;
      const address = canonicalWorldAddressForNav(route);
      if (address !== null) knownWorlds.push(address);
    }
    const prepared = prepareWorldIdentityBootstrap({
      extensions: initialExtensions,
      legacy: save,
      addresses: knownWorlds,
    });
    if (prepared.kind === 'prepared') {
      worldIdentityState = prepared.state;
      initialExtensions = prepared.extensions;
      worldIdentityBootstrapPending = true;
    } else if (prepared.kind === 'already-loaded') {
      worldIdentityState = prepared.state;
    } else {
      worldIdentityProtection = `${prepared.reason}${prepared.version === undefined
        ? '' : `:${prepared.version}`}`;
      persistHold = 'protected-payload';
      protectedReason = prepared.reason === 'target-future' ? 'future-version' : 'invalid';
      persistenceBootKind = prepared.reason === 'target-future'
        ? 'future-protected' : 'corrupt-protected';
      persistenceProtectedDetail = `canonical world identity ${worldIdentityProtection}`;
    }
  }
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
      /* Read Arc 5 before any Arc 4 compatibility repair. A current compact
         carrier owns every later Feed/Breed/Rename/Scout/combat delta while
         its Arc 4 source remains immutable; full Arc 4 projection would
         therefore erase legitimate companion history. */
      const arc5BeforeArc4 = readArc5OwnershipMigration(
        initialExtensions,
        SCENE_OWNERSHIP_ADDRESS_RESOLVER,
      );
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
            extensions: prepared.extensions,
            registry: REGISTRY,
            codecNow: now,
          });
          if (staged.kind === 'staged') {
            initialExtensions = prepared.extensions;
            bootProductBootstrapCandidate = staged.candidate;
            arc4OwnershipState = prepared.state;
            arc4OwnershipBootstrapPending = true;
            arc4OwnershipBootstrapVerification = 'full-composite';
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
        } else if (arc5BeforeArc4.kind === 'loaded') {
          const staged = stageGuardianLegacyCompanionSliceV1({
            source: priorProductCandidate ?? save,
            ownership: arc5BeforeArc4.state,
            extensions: initialExtensions,
          });
          if (staged.kind === 'staged') {
            arc4OwnershipState = prepared.state;
            if (staged.changed) {
              bootProductBootstrapCandidate = staged.candidate;
              arc4OwnershipBootstrapPending = true;
              arc4OwnershipBootstrapVerification = 'guardian-slice';
              lastArc4BootstrapOutcome = 'guardian-reconciliation-prepared';
            } else {
              lastArc4BootstrapOutcome = 'already-aligned';
            }
          } else {
            arc4OwnershipProtection = `${staged.reason}${staged.version === undefined
              ? '' : `:${staged.version}`}`;
            lastArc4BootstrapOutcome = 'projection-rejected';
          }
        } else if (arc4GuardianLegacyOwnershipMirrorMatchesV1(
          prepared.state,
          initialExtensions,
          priorProductCandidate ?? save,
        )) {
          arc4OwnershipState = prepared.state;
          lastArc4BootstrapOutcome = 'already-aligned';
        } else {
          const staged = stageArc4BootstrapLegacyProjection({
            source: priorProductCandidate ?? save,
            state: prepared.state,
            extensions: initialExtensions,
            registry: REGISTRY,
            codecNow: now,
          });
          if (staged.kind === 'staged') {
            bootProductBootstrapCandidate = staged.candidate;
            arc4OwnershipState = prepared.state;
            arc4OwnershipBootstrapPending = true;
            arc4OwnershipBootstrapVerification = 'full-composite';
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
      arc4OwnershipBootstrapVerification = null;
      arc5OwnershipBootstrapPending = false;
      arc5OwnershipBootstrapPrepared = null;
      if (worldIdentityBootstrapPending) {
        worldIdentityState = createEmptyWorldIdentityState();
        worldIdentityProtection = 'blocked-by-arc5-protection';
      }
      worldIdentityBootstrapPending = false;
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
        initialState: save,
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
      if (leaseOutcome.kind === 'storage-error') {
        throw new Error(`boot F4 lease ${leaseOutcome.operation} storage failure (${leaseOutcome.message})`);
      }
      /* A newly minted crypto seed becomes durable before any outcome API can
         roll from it. If this write fails, play remains protected; reload can
         never silently mint a different value after a failed player action. */
      if (leaseOutcome.kind === 'owned' && !await ensureF4RevisionCurrent(runtime)) {
        throw new Error(persistenceProtectedDetail || 'F4 revision verification failed');
      }
      if ((f4SeedBootstrapPending || bootRouteRepairPending
        || arc2LootBootstrapPending || arc3EngineeringBootstrapPending
        || arc4OwnershipBootstrapPending || arc5OwnershipBootstrapPending
        || worldIdentityBootstrapPending)
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
      arc4OwnershipBootstrapVerification = null;
      if (arc5OwnershipBootstrapPending) {
        arc5OwnershipState = null;
        arc5OwnershipEvidence = null;
      }
      arc5OwnershipBootstrapPending = false;
      arc5OwnershipBootstrapPrepared = null;
      if (worldIdentityBootstrapPending) worldIdentityState = createEmptyWorldIdentityState();
      worldIdentityBootstrapPending = false;
      worldIdentityProtection ||= 'bootstrap-failed';
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
        : persistenceBootKind === 'revision-exhausted-protected'
          ? 'This expedition reached its durable revision limit. It remains readable, but no further progress can be written.'
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
  /* Aggregate achievements and permanent best-rank are derived from the
     exact durable expedition once per boot. New/active Training remains a
     sandbox and cannot receive this catch-up. `current` consumes no receipt;
     a needed refresh uses the same single-flight F4 path as live actions. */
  if (!trainingRecoveryLock && !trainingCheckpointWriteHeld && !trainingActive()) {
    await runArc9ProgressionRefresh('boot-catch-up');
  }
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
  const rendererDensitySync = createFrameCoalescer(
    (callback) => requestAnimationFrame(callback),
    (handle) => cancelAnimationFrame(handle),
    () => {
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
           only the Pixi backing store and backdrop. Density-only work must not
           mint persistence intent. */
        rerender({ preserveSurvey: true, skipPersist: true });
        /* Change both simultaneous full-viewport stores in one transaction.
           A deferred backdrop rebuild briefly retained the ordinary-tier
           canvas after the app had already advertised the ultra-tier cap. */
        rebuildBackdrop();
      } else {
        densityPlan = nextDensityPlan;
      }
    },
  );
  const syncRendererDensity = (): void => { rendererDensitySync.request(); };
  addEventListener('resize', syncRendererDensity);
  visualViewport?.addEventListener('resize', syncRendererDensity);
    releaseRendererForReload = (reason, audio): ReloadReleaseWitness => {
    releaseSurfaceVistaOwner();
    releaseSurfaceVistaCache();
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
    rendererDensitySync.cancel();
    closeCodexSurface();
    approachEcologyController.dispose();
    compendiumAuditionController.dispose();
    compendiumFeedController.dispose();
    compendiumExplorerMealController.dispose();
    compendiumBreedController.dispose();
    compendiumRenameController.dispose();
    compendiumScoutController.dispose();
    travelPresentationOwner.dispose();
    engineeringPanelReleased = true;
    engineeringPanelController.dispose();
    captureCardController.dispose();
    pwaUpdateControl?.dispose();
    pwaUpdateControl = null;
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
  if (__CF_EVIDENCE_BUILD__) {
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
          heartbeatStorageFault: lastF4HeartbeatStorageFault,
          revisionVerificationFault: lastF4RevisionVerificationFault,
          heartbeatRunning: f4HeartbeatTimer !== 0,
          convergenceReloadScheduled: f4AuthorityReloadScheduled,
          convergenceReloadHold: smokeF4ConvergenceReloadHold.diagnostics(),
          leaseReadCount: smokeF4LeaseReadCount,
          revisionReadCount: smokeF4RevisionReadCount,
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
        landing: {
          schema: 'cf-v2-arc0-landing-app-state/v1',
          lastOutcome: lastArc0LandingOutcome,
          surveyOutcome: lastArc9SurveyOutcome,
          actionCoordinator: {
            inFlight: productActionInFlight,
            owner: productActionCoordinator.diagnostics(),
            hold: smokeProductActionHold.diagnostics(),
            faultArmed: {
              storageFailure: smokeRejectNextArc0LandingStorage,
              staleAuthority: smokeStaleNextArc0LandingAuthority,
              publicationFailure: smokeRejectNextArc0LandingPublication,
            },
            lastFault: lastSmokeArc0LandingFaultWitness,
          },
        },
        bioscan: {
          schema: 'cf-v2-arc9-bioscan-app-state/v1',
          lastOutcome: lastArc9BioscanOutcome,
          lastResult: lastArc9BioscanResult,
          card: currentBioscanCardState === null ? null : {
            kind: currentBioscanCardState.kind,
            worldKey: currentBioscanCardState.worldKey,
            ...(currentBioscanCardState.kind === 'ready' ? {
              ecologyEpoch: currentBioscanCardState.roster.ecologyEpoch,
              rosterFingerprint: currentBioscanCardState.roster.fullRosterFingerprint,
              operation: currentBioscanCardState.projection.survey.operation,
              probability: currentBioscanCardState.projection.hazard.probability,
              damage: currentBioscanCardState.projection.hazard.finalDamage,
            } : {}),
          },
        },
        atlas: {
          schema: 'cf-v2-arc0-atlas-app-state/v1',
          lastOutcome: lastArc0AtlasOutcome,
          rows: save.logMap.length,
          travelable: save.logMap.filter(([, entry]) => atlasRouteStates.has(entry)).length,
        },
        worldNaming: {
          schema: 'cf-v2-arc0-world-name-app-state/v1',
          lastOutcome: lastArc0WorldNameOutcome,
          canonicalRecords: worldIdentityState.records.length,
          legacyRows: save.customNames.length,
        },
        sharing: {
          schema: 'cf-v2-arc9-sharing-app-state/v1',
          followOutcome: lastArc9ShareFollowOutcome,
        },
        travel: {
          schema: 'cf-v2-arc9-travel-app-state/v1',
          lastOutcome: lastArc9TravelOutcome,
          automaticGalaxyArrivalLatch,
          automaticWormholeTraversalLatch,
          transientPersistHoldArmed: smokeTransientPersistRelease !== null,
          temporarilyBlocked: arc9TravelWriteTemporarilyBlocked(),
          universeCell: uniCell === null ? null : { ...uniCell },
          homeGalaxyStreamed: uniNodes.some((galaxy) => galaxy.home === true),
          actionCoordinator: {
            inFlight: productActionInFlight,
            owner: productActionCoordinator.diagnostics(),
          },
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
          schema: 'cf-v2-arc5-app-state/v3',
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
          feed: Object.freeze({
            lastOutcome: lastArc5FeedOutcome,
            lastResult: lastArc5FeedResult,
            controller: compendiumFeedController.diagnostics(),
            actionCoordinator: Object.freeze({
              inFlight: productActionInFlight,
              owner: productActionCoordinator.diagnostics(),
              hold: smokeProductActionHold.diagnostics(),
              faultArmed: Object.freeze({
                storageFailure: smokeRejectNextArc5FeedStorage,
                staleAuthority: smokeStaleNextArc5FeedAuthority,
                publicationFailure: smokeRejectNextArc5FeedPublication,
              }),
              lastFault: lastSmokeArc5FeedFaultWitness,
            }),
          }),
          explorerMeal: Object.freeze({
            lastOutcome: lastArc5ExplorerMealOutcome,
            lastResult: lastArc5ExplorerMealResult,
            controller: compendiumExplorerMealController.diagnostics(),
          }),
          breed: Object.freeze({
            lastOutcome: lastArc5BreedOutcome,
            lastResult: lastArc5BreedResult,
            controller: compendiumBreedController.diagnostics(),
          }),
          rename: Object.freeze({
            lastOutcome: lastArc5RenameOutcome,
            lastResult: lastArc5RenameResult,
            controller: compendiumRenameController.diagnostics(),
          }),
          scout: Object.freeze({
            lastOutcome: lastArc5ScoutOutcome,
            lastResult: lastArc5ScoutResult,
            controller: compendiumScoutController.diagnostics(),
          }),
        },
        audio: tameGreetingAudioOwner?.diagnostics() ?? null,
        cardOpen: card.style.display !== 'none',
        cardTitle: card.querySelector('[data-sel=title]')?.textContent ?? null,
        stage: ascStage(), reach: reachRadiusOf(primeCount()),
        shipVisual: currentShipVisualState(),
        toastOn: toastEl.style.opacity === '1', toastText: toastEl.textContent || '', toastSerial: _toastSerial,
        progressionCeremony: progressionCeremonyDiagnostics(),
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
        fxOn: save.fxOn, shakeOn: save.shakeOn,
        visualEffectPolicy: currentVisualEffectPolicy(),
        cameraShakePolicy: currentCameraShakePolicy(),
        activeCameraShakes: activeCameraShakes.size,
        motionMode: save.motionMode,
        fsMode: save.fsMode, toneMode: save.toneMode, fontMode: save.fontMode,
        glassTint: save.glassTint,
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
          frontierEnding: save.frontierEnding,
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
      importBlob,   /* evidence-build replacement driver for Slice/Glass; the player door is gone (2026-09-05) */
      __smokeArmImportRace: smokeArmImportRace,
      __smokeReleaseImportRace: smokeReleaseImportRace,
      __smokeDrainFixturePersist: smokeDrainFixturePersist,
      __smokeArmTransientPersistHold: smokeArmTransientPersistHold,
      __smokeReleaseTransientPersistHold: smokeReleaseTransientPersistHold,
      __smokeStageStoredV4: smokeStageStoredV4,
      __smokeRejectNextPersist: () => {
        if (smokeRejectNextPersist) return false;
        smokeRejectNextPersist = true;
        return true;
      },
      __smokePersistAfterDebounce: () => { persistSoon(); return true; },
      __smokePersistNow: persistView,
      __smokeSettingsPersistenceDiagnostics: settingsPersistenceSmokeDiagnostics,
      __smokeQuiesceSettingsPersistence: smokeQuiesceSettingsPersistence,
      __smokeResumeSettingsPersistence: smokeResumeSettingsPersistence,
      __smokeCommitF4Outcome: smokeCommitF4Outcome,
      __smokeRejectNextArc0LandingStorage: () => {
        if (productActionCoordinator.busy || productActionFaultInjectionArmed()) return false;
        smokeRejectNextArc0LandingStorage = true;
        return true;
      },
      __smokeStaleNextArc0LandingAuthority: () => {
        if (productActionCoordinator.busy || productActionFaultInjectionArmed()) return false;
        smokeStaleNextArc0LandingAuthority = true;
        return true;
      },
      __smokeRejectNextArc0LandingPublication: () => {
        if (productActionCoordinator.busy || productActionFaultInjectionArmed()) return false;
        smokeRejectNextArc0LandingPublication = true;
        return true;
      },
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
      __smokeRejectNextArc5FeedStorage: () => {
        if (productActionCoordinator.busy || productActionFaultInjectionArmed()) return false;
        smokeRejectNextArc5FeedStorage = true;
        return true;
      },
      __smokeStaleNextArc5FeedAuthority: () => {
        if (productActionCoordinator.busy || productActionFaultInjectionArmed()) return false;
        smokeStaleNextArc5FeedAuthority = true;
        return true;
      },
      __smokeRejectNextArc5FeedPublication: () => {
        if (productActionCoordinator.busy || productActionFaultInjectionArmed()) return false;
        smokeRejectNextArc5FeedPublication = true;
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
      __smokeArmF4HeartbeatStorageFailure: () => {
        if (smokeRejectNextF4HeartbeatStorage || f4AuthorityReloadScheduled
          || f4HeartbeatInFlight !== null || f4HeartbeatCycleInFlight !== null) return false;
        smokeRejectNextF4HeartbeatStorage = true;
        return true;
      },
      __smokeArmF4RevisionVerificationFailure: () => {
        if (smokeRejectNextF4RevisionVerification || f4AuthorityReloadScheduled
          || f4HeartbeatInFlight !== null || f4HeartbeatCycleInFlight !== null) return false;
        smokeRejectNextF4RevisionVerification = true;
        return true;
      },
      __smokeRunF4Heartbeat: heartbeatF4,
      __smokeQuiesceF4Heartbeat: quiesceF4HeartbeatForSmoke,
      __smokeResumeF4Heartbeat: resumeF4HeartbeatForSmoke,
      __smokeArmF4ConvergenceReloadHold: () => {
        if (f4AuthorityReloadScheduled) return false;
        return smokeF4ConvergenceReloadHold.arm();
      },
      __smokeReleaseF4ConvergenceReload: () => smokeF4ConvergenceReloadHold.release(),
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
        return showV2ReleaseBulletin(fixture);
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
      descendGalaxy: descendGalaxyForEvidence,
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
      __smokeRouteTrainingTo: routeTrainingForSmoke,
      landHere: doLand,
      landOn: async (selector: unknown) => {
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
  }
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
    const effectPolicy = currentVisualEffectPolicy();
    travelPresentationOwner.tick(performance.now());
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
      for (const up of uniPulse) {
        up.spr.alpha = effectPolicy.bloom.mode === 'animated'
          ? 0.55 + 0.45 * Math.abs(Math.sin(t * 6 + up.seed % 10))
          : effectPolicy.bloom.mode === 'static' ? 0.82 : 1;
      }
      /* drifting fog-of-war: the CLOUD PATTERN moves, the puffs stay put
         (main.js 3766 — noise phase drifts at 5/s) */
      if (charterFx && charterFx.visible && fogFx.length
        && effectPolicy.particles.mode === 'animated') {
        const drift = t * 5;
        for (const F of fogFx) {
          const n = (UNOISE as (x: number, y: number, o: number) => number)((F.wx + drift) / UCELL * 0.16, (F.wy - drift * 0.4) / UCELL * 0.16, 3);
          F.spr.alpha = Math.min(Math.max((n - 0.32) * 1.1, 0), 0.7) * F.ramp;
        }
      }
    } else if (nav.mode === 'galaxy') {
      updateFineLayer(false);
      /* the bright stars breathe (main.js 4165) — stilled under reduced motion */
      for (const st of galTwinkle) {
        st.spr.alpha = effectPolicy.bloom.mode === 'animated'
          ? 0.82 + 0.18 * Math.sin(t * 2.4 + (st.star.seed % 97))
          : effectPolicy.bloom.mode === 'static' ? 0.9 : 1;
      }
      if (bhDisc) { bhDisc.rotation = t * 0.3; bhDisc.scale.y = bhDisc.scale.x * 0.55; }
      /* wormhole lensing · remnant cores · newborn protostars (main.js 4109/4218) */
      for (const ga of galAnims) {
        if (ga.kind === 'worm') ga.spr.rotation = t * 1.2;
        else if (ga.kind === 'bhdisc') { ga.spr.rotation = t * 0.3; ga.spr.scale.y = ga.spr.scale.x * 0.5; }
        else if (ga.kind === 'nsbeam') ga.spr.rotation = t * 2.2;
        else if (ga.kind === 'proto') {
          ga.spr.alpha = effectPolicy.bloom.mode === 'animated'
            ? 0.7 + 0.3 * Math.sin(t * 3 + (ga.seed % 7))
            : effectPolicy.bloom.mode === 'static' ? 0.85 : 1;
        }
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
      refocusRecoverySheet();
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
  if (document.querySelector('meta[name="cf-pwa-enabled"][content="true"]')) {
    pwaUpdateControl = mountPwaUpdateControl({
      document,
      navigator,
      mount: document.getElementById('setpanel')!,
      placement: 'settings',
      reload: () => {
        /* Update/rollback reload is a player gesture, but it still crosses
           the same exclusive release boundary as every other intentional
           replacement. Never overlap two renderers or bypass audio/F4/Canvas
           cleanup merely because the new build is already cached. */
        void reloadForPwaUpdate();
      },
    });
    void pwaUpdateControl.ready;
  }
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
          const binding = __CF_EVIDENCE_BUILD__
            ? (window as unknown as Record<string, unknown>).__cfSliceReadyWitness : undefined;
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
