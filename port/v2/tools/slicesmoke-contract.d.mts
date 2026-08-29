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
