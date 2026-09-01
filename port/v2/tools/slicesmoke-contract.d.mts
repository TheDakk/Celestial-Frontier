export const SLICE_SCREENSHOT_LOGICAL_NAMES: readonly [
  'codex',
  'earth',
  'galaxy',
  'guide',
  'phone',
  'settings',
  'sol',
  'solmark',
  'training',
  'universe',
];

export function sliceScreenshotInventoryLine(): string;

export interface SliceContractAssessment {
  readonly ok: boolean;
  readonly reasons: readonly string[];
}

export function assessF4ReadyAuthority(input?: Readonly<{
  readonly state?: unknown;
  readonly raw?: unknown;
  readonly token?: unknown;
  readonly previousToken?: string | null;
  readonly expectedToken?: string | null;
  readonly allowFresh?: boolean;
  readonly allowMigrated?: boolean;
}>): SliceContractAssessment;

export function assessArc0LandingAwaitBoundary(input?: Readonly<{
  readonly actualAccepted?: unknown;
  readonly expectedAccepted?: unknown;
  readonly actionDocumentToken?: unknown;
  readonly expectedDocumentToken?: unknown;
  readonly waitError?: unknown;
}>): SliceContractAssessment;

export function assessArc0LandingPublicationWithheld(input?: Readonly<{
  readonly beforeProduct?: unknown;
  readonly heldProduct?: unknown;
  readonly heldState?: unknown;
  readonly cardCode?: unknown;
  readonly target?: unknown;
}>): SliceContractAssessment;

export function arc0LandingSurveyRouteIsExact(input?: Readonly<{
  readonly state?: unknown;
  readonly cardCode?: unknown;
  readonly target?: unknown;
}>): boolean;

export function arc0LandingCoordinatorIsIdle(
  state: unknown,
  options?: Readonly<{ readonly clearFault?: boolean }>,
): boolean;

export interface EarlyCoreFlowActionFixedPointAssessment {
  readonly status: 'ready' | 'pending';
  readonly reasons: readonly string[];
}

export function buildEarlyCoreFlowActionSurfaceExpression(actionExpression: string): string;

export function assessEarlyCoreFlowActionFixedPoint(
  observation: unknown,
  expected: Readonly<{
    readonly documentToken: string;
    readonly renderedSerial: number;
    readonly surveyTarget: 'star' | 'world';
    readonly route: Readonly<{
      readonly mode: 'galaxy' | 'system';
      readonly gal: number;
      readonly galX: number;
      readonly galY: number;
      readonly star: number | null;
      readonly starX: number | null;
      readonly starY: number | null;
      readonly planet: number | null;
      readonly planetOrdinal: number | null;
      readonly navGalaxyKey: string;
      readonly navStarKey: string | null;
      readonly navWorldKey: string | null;
      readonly epoch: number;
    }>;
    readonly presentation?: Readonly<{
      readonly cardOpen: true;
      readonly cardTitle: string;
      readonly actionOk: true;
      readonly actionLabel: string;
    }> | null;
    readonly settlement?: 'commit' | 'current' | 'either';
  }>,
): EarlyCoreFlowActionFixedPointAssessment;

export function assessF4ActionCommitSequence(input?: Readonly<{
  readonly beforeAuthority?: unknown;
  readonly afterAuthority?: unknown;
  readonly state?: unknown;
  readonly expectedKinds?: readonly string[];
  readonly expectedPersistenceLastOutcome?: string;
}>): SliceContractAssessment;

export interface Arc9ShareSendSettlementExpectation {
  readonly counterBefore: number;
  readonly counterAfter: number;
  readonly priorUnlockedIds: readonly string[];
  readonly nextUnlockedIds: readonly string[];
  readonly priorBestRankIndex: number;
  readonly nextBestRankIndex: number;
  readonly shareAchievementAdded: boolean;
  readonly share5AchievementAdded: boolean;
  readonly progressionTailRequired: boolean;
  readonly expectedKinds: readonly string[];
  readonly persistencePrefix: 'arc9-share-send-committed:' | 'arc9-progression-committed:';
}

export function arc9ShareSendSettlementExpectation(
  beforeAuthority: unknown,
): Arc9ShareSendSettlementExpectation;

export function assessArc9ShareSendSettlement(input?: Readonly<{
  readonly beforeAuthority?: unknown;
  readonly afterAuthority?: unknown;
  readonly state?: unknown;
}>): SliceContractAssessment;

export function advanceF4ActionSequenceStability(
  consecutiveExactSamples: number,
  assessment: SliceContractAssessment,
): Readonly<{
  readonly status: 'pending' | 'ready';
  readonly consecutiveExactSamples: number;
}>;

export type Arc2InventorySuccessorBoundary = Readonly<{
  readonly kind: 'ready' | 'blocked';
  readonly canEnterMutableArc3: boolean;
  readonly reasons: readonly string[];
}>;

export function assessArc2InventorySuccessorBoundary(observation: Readonly<{
  readonly fixtureGreen?: boolean;
  readonly findingCountBefore?: number;
  readonly findingCountAfter?: number;
}> | null | undefined): Arc2InventorySuccessorBoundary;

export function assessInventoryOperationActivation(
  observation: unknown,
  expectedOperation: 'equip' | 'unequip' | 'salvage' | 'pending-claim',
  expectedInstanceId: string,
  expectedPressCount?: number,
): SliceContractAssessment;

export function assessArc2InventoryPendingWindow(observation: unknown): SliceContractAssessment;
export function assessArc2InventoryPreDurableRefusal(observation: unknown): SliceContractAssessment;
export function assessArc2InventoryOperationOutcome(observation: unknown): SliceContractAssessment;
export function selectArc5FeedFixtureBurnVerb(
  captureState: unknown,
  rows: readonly unknown[],
): 'tame' | 'scavenge' | 'sample' | null;
export type CompendiumFeedSuccessorAvailability =
  | 'ready'
  | 'no-eligible-companion'
  | 'no-flora';
export function compendiumFeedSuccessorAvailability(input: Readonly<{
  readonly readyCompanionCountBefore: number;
  readonly selectedCompanionReadyAfter: boolean;
  readonly floraLotCountBefore: number;
  readonly selectedFloraLotPresentAfter: boolean;
}>): CompendiumFeedSuccessorAvailability;
export function compendiumFeedDetailPresentationPasses(
  observation: unknown,
  expectedAvailability: CompendiumFeedSuccessorAvailability,
): boolean;
export function buildCompendiumFeedChoiceSettlementExpression(
  prefix: Readonly<Record<string, unknown>>,
  selector: string,
  feedUiExpression: string,
): string;
export type CompendiumFeedChoiceKind = 'creature' | 'flora';
export interface CompendiumFeedChoiceExpectation {
  readonly kind: CompendiumFeedChoiceKind;
  readonly expectedId: string;
  readonly expectedPriorId: string | null;
  readonly documentToken: string;
  readonly generation: number;
  readonly logicalId: string;
  readonly surfaceKey: string;
  readonly contextKey: string;
}
export interface CompendiumFeedChoiceDocumentWitness {
  readonly token: string;
  readonly generation: number;
  readonly logicalId: string;
  readonly surfaceKey: string;
  readonly contextKey: string;
}
export interface CompendiumFeedChoiceControllerWitness {
  readonly attachedMountCount: number;
  readonly delegatedListenerCount: number;
  readonly pendingWork: number;
  readonly convergenceLatched: boolean;
  readonly feedState: string;
  readonly surfaceKey: string;
  readonly contextKey: string;
}
export interface CompendiumFeedChoiceRadioWitness {
  readonly radioId: string;
  readonly radioNodeToken: string;
  readonly radioConnected: boolean;
  readonly radioDisabled: boolean;
  readonly radioChecked: boolean;
  readonly radioChoice: CompendiumFeedChoiceKind;
  readonly radioCreatureId: string | null;
  readonly radioFoodLotId: string | null;
}
interface CompendiumFeedChoiceReceiptBaseWitness {
  readonly trusted: boolean;
  readonly radioId: string;
  readonly radioNodeToken: string;
  readonly choice: CompendiumFeedChoiceKind;
  readonly choiceId: string;
  readonly document: Readonly<CompendiumFeedChoiceDocumentWitness>;
  readonly serial: number;
}
export type CompendiumFeedChoiceReceiptWitness =
  | (CompendiumFeedChoiceReceiptBaseWitness & Readonly<{
    readonly type: 'pointerdown' | 'click';
    readonly x: number;
    readonly y: number;
    readonly pointerType?: string;
    readonly button?: number;
  }>)
  | (CompendiumFeedChoiceReceiptBaseWitness & Readonly<{
    readonly type: 'input' | 'change';
    readonly x?: never;
    readonly y?: never;
    readonly pointerType?: never;
    readonly button?: never;
  }>);
export interface CompendiumFeedChoiceActivationWitness {
  readonly kind: CompendiumFeedChoiceKind;
  readonly expectedId: string;
  readonly expectedPriorId: string | null;
  readonly document: Readonly<CompendiumFeedChoiceDocumentWitness>;
  readonly prepared: Readonly<CompendiumFeedChoiceRadioWitness & {
    readonly selectorCount: number;
    readonly radioIdMatchCount: number;
    readonly labelOwnerCount: number;
    readonly labelFor: string;
    readonly labelConnected: boolean;
    readonly labelContainsRadio: boolean;
    readonly labelWidth: number;
    readonly labelHeight: number;
    readonly labelVisible: boolean;
    readonly labelNodeToken: string;
    readonly x: number;
    readonly y: number;
    readonly labelHitOwner: boolean;
    readonly radioHitOwner: boolean;
    readonly controller: Readonly<CompendiumFeedChoiceControllerWitness>;
  }>;
  readonly dispatch: Readonly<CompendiumFeedChoiceRadioWitness & {
    readonly kind: 'cdp-mouse';
    readonly button: 'left';
    readonly clickCount: number;
    readonly x: number;
    readonly y: number;
    readonly targetX: number;
    readonly targetY: number;
    readonly document: Readonly<CompendiumFeedChoiceDocumentWitness>;
    readonly selectorCount: number;
    readonly radioIdMatchCount: number;
    readonly labelOwnerCount: number;
    readonly labelFor: string;
    readonly labelConnected: boolean;
    readonly labelContainsRadio: boolean;
    readonly labelNodeToken: string;
    readonly labelWidth: number;
    readonly labelHeight: number;
    readonly labelVisible: boolean;
    readonly labelHitOwner: boolean;
    readonly radioHitOwner: boolean;
  }>;
  readonly receipt: Readonly<{
    readonly pointerdowns: readonly Readonly<CompendiumFeedChoiceReceiptWitness>[];
    readonly clicks: readonly Readonly<CompendiumFeedChoiceReceiptWitness>[];
    readonly inputs: readonly Readonly<CompendiumFeedChoiceReceiptWitness>[];
    readonly changes: readonly Readonly<CompendiumFeedChoiceReceiptWitness>[];
  }>;
  readonly settled: Readonly<CompendiumFeedChoiceRadioWitness & {
    readonly selectorCount: number;
    readonly radioIdMatchCount: number;
    readonly labelOwnerCount: number;
    readonly labelFor: string;
    readonly labelConnected: boolean;
    readonly labelContainsRadio: boolean;
    readonly labelNodeToken: string;
    /** Must identify the current radio; replacement is not required. */
    readonly radioNodeToken: string;
    readonly ui: Readonly<{
      readonly document: Readonly<CompendiumFeedChoiceDocumentWitness>;
      readonly controller: Readonly<CompendiumFeedChoiceControllerWitness>;
      readonly selectedCreatureId: string | null;
      readonly selectedFoodLotId: string | null;
    }>;
  }>;
}
export function assessCompendiumFeedChoiceActivation(
  observation: Readonly<CompendiumFeedChoiceActivationWitness>,
  expected: Readonly<CompendiumFeedChoiceExpectation>,
): SliceContractAssessment;
export interface CompendiumFeedPreviewAuthorityWitness {
  readonly revision: number;
  readonly sourceDigest: string;
  readonly targetDigest: string;
}
export interface CompendiumFeedPreviewExpectation {
  readonly documentToken: string;
  readonly generation: number;
  readonly logicalId: string;
  readonly surfaceKey: string;
  readonly contextKey: string;
  readonly authority: Readonly<CompendiumFeedPreviewAuthorityWitness>;
  readonly creatureId: string;
  readonly foodLotId: string;
  readonly fedBefore: number;
  readonly fedAfter: number;
  readonly foodQuantityBefore: number;
  readonly foodQuantityAfter: number;
  readonly baseline: Readonly<{
    readonly actionCoordinator: Readonly<CompendiumFeedPreviewActionCoordinatorWitness>;
    readonly lastOutcome: unknown;
    readonly result: unknown;
  }>;
}
export interface CompendiumFeedPreviewControllerWitness
  extends CompendiumFeedChoiceControllerWitness {
  readonly selectedCreatureId: string | null;
  readonly selectedFoodLotId: string | null;
}
export interface CompendiumFeedPreviewDomWitness {
  readonly selectedCreatureId: string | null;
  readonly selectedFoodLotId: string | null;
  readonly summaryCount: number;
  readonly summary: string;
  readonly confirmPresent: boolean;
  readonly confirmDisabled: boolean | null;
}
export interface CompendiumFeedPreviewActionCoordinatorWitness {
  readonly inFlight: boolean;
  readonly owner: Readonly<{
    readonly busy: boolean;
    readonly operation: string | null;
  }>;
  readonly hold: Readonly<{
    readonly phase: 'idle' | 'armed' | 'holding' | 'release-requested' | 'released';
    readonly operation: string | null;
    readonly sequence: number;
  }>;
}
export interface CompendiumFeedPreviewObservation {
  readonly document: Readonly<CompendiumFeedChoiceDocumentWitness>;
  readonly authority: Readonly<CompendiumFeedPreviewAuthorityWitness>;
  readonly controller: Readonly<CompendiumFeedPreviewControllerWitness>;
  readonly dom: Readonly<CompendiumFeedPreviewDomWitness>;
  readonly actionCoordinator: Readonly<CompendiumFeedPreviewActionCoordinatorWitness>;
  readonly lastOutcome: unknown;
  readonly result: unknown;
}
export interface CompendiumFeedPreviewAssessment extends SliceContractAssessment {
  readonly observation: Readonly<CompendiumFeedPreviewObservation>;
}
export function assessCompendiumFeedPreview(
  observation: Readonly<CompendiumFeedPreviewObservation>,
  expected: Readonly<CompendiumFeedPreviewExpectation>,
): CompendiumFeedPreviewAssessment;
export function assessCompendiumFeedPendingWindow(observation: unknown): SliceContractAssessment;
export function assessCompendiumFeedCommittedOutcome(observation: unknown): SliceContractAssessment;
export interface CompendiumFeedWebAudioGraph {
  schema: 'cf-v2-feed-audio-graph/v1';
  sourceNodeId: string | null;
  destinationNodeId: string | null;
  sourceCandidateCount: number;
  destinationCandidateCount: number;
  nodeTypeInventory: Array<[string, number]>;
  nodes: Array<{ nodeId: string; contextId: string; nodeType: string }>;
  edges: Array<{ contextId: string; sourceId: string; destinationId: string }>;
}
export function projectCompendiumFeedWebAudioGraph(input: {
  events: readonly unknown[];
  sessionId: string;
  enableMark: number;
  sourceMark: number;
}): CompendiumFeedWebAudioGraph;
export function compendiumFeedWebAudioRouteNodeIds(
  graph: CompendiumFeedWebAudioGraph,
): string[];
export function compendiumFeedWebAudioEndpointFailureIsInstrument(
  observation: unknown,
): boolean;
export function assessCompendiumFeedAudioAcknowledgement(observation: unknown): SliceContractAssessment;
export function assessCompendiumFeedTwoDocumentStaleOutcome(
  observation: unknown,
): SliceContractAssessment;
export function assessInventoryOperationSequenceDurability(
  observation: unknown,
  expectedOperations: readonly Readonly<{
    operation: 'equip' | 'unequip' | 'salvage' | 'pending-claim';
    instanceId: string;
    receiptOrdinal: number;
    inventoryRevision: number;
  }>[],
): SliceContractAssessment;
