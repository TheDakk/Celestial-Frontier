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
