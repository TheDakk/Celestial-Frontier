export interface InventoryActionOffscreenPrior {
  ok: boolean;
  saved: number;
  styleAttribute: string | null;
  transform: string;
  transformPriority: string;
}

export interface InventoryActionOffscreenTarget {
  ok: boolean;
  rect: number[] | null;
  x: number | null;
  y: number | null;
  hit: string | null;
  fullyOutside: boolean;
}

export interface InventoryActionOffscreenSetup {
  ok: boolean;
  mutationApplied: boolean;
  mode: 'scroll' | 'translated' | null;
  why?: string;
  saved?: number;
  top?: number;
  translated?: boolean;
  appliedTransform?: string;
  appliedTransformPriority?: string;
  scrollTarget?: InventoryActionOffscreenTarget;
  target: InventoryActionOffscreenTarget | null;
}

export interface InventoryActionOffscreenRestoration {
  ok: boolean;
  why?: string;
  mutationApplied?: boolean;
  ownerStable?: boolean;
  scrollTop?: number;
  styleAttribute?: string | null;
  styleAttributeRestored?: boolean;
  transform?: string;
  transformPriority?: string;
  styleRestored?: boolean;
}

export function prepareInventoryActionOffscreen(
  button: unknown,
  card: unknown,
  prior: InventoryActionOffscreenPrior,
  viewport: { width: number; height: number },
  hitTest: (x: number, y: number) => unknown,
): InventoryActionOffscreenSetup;

export function restoreInventoryActionOffscreen(
  button: unknown,
  card: unknown,
  prior: InventoryActionOffscreenPrior,
  mutationApplied?: boolean,
): InventoryActionOffscreenRestoration;

export function buildInventoryActionOffscreenRestoreSource(
  prior: InventoryActionOffscreenPrior,
  mutationApplied: boolean,
): string;

export interface InventoryActionPendingChecks {
  readonly instrumentReady: boolean;
  readonly nativeActivation: boolean;
  readonly trustedReceipt: boolean;
  readonly receiptOperation: boolean;
  readonly receiptInstance: boolean;
  readonly pendingBaseline: boolean;
  readonly pendingObserved: boolean;
  readonly actionOwnerInFlight: boolean;
  readonly actionOwnerBusy: boolean;
  readonly actionOwnerOperation: boolean;
  readonly actionHoldPhase: boolean;
  readonly actionHoldOperation: boolean;
  readonly actionHoldSequence: boolean;
}

export interface InventoryActionPendingOutcome {
  readonly ok: boolean;
  readonly productPrerequisite: boolean;
  readonly pendingOwnerExact: boolean;
  readonly checks: InventoryActionPendingChecks;
  readonly realAction: unknown;
  readonly receipt: unknown;
  readonly actionState: unknown;
  readonly [key: string]: unknown;
}

export function inventoryActionPendingOutcome(input: {
  readonly preActionInstrumentControl: Readonly<{ ok?: boolean; [key: string]: unknown }> | null;
  readonly realAction: unknown;
  readonly receipt: unknown;
  readonly actionState: unknown;
  readonly expectedOperation: string;
  readonly expectedInstanceId: string;
  readonly expectedHoldOperation: string;
  readonly expectedHoldSequence: number;
}): InventoryActionPendingOutcome;

export interface InventoryActionSettlementExpected {
  readonly operation: string;
  readonly instanceId: string;
  readonly revision: number;
  readonly holdOperation: string;
  readonly holdSequence: number;
}

export interface InventoryActionSettlementOutcome {
  readonly schema: 'cf-v2-glass-inventory-action-settlement/v1';
  readonly terminal: boolean;
  readonly observationComplete: boolean;
  readonly ok: boolean;
  readonly action: unknown;
  readonly diagnostics: unknown;
  readonly inventory: unknown;
  readonly authority: unknown;
  readonly checks: Readonly<Record<string, boolean>>;
}

export function inventoryActionSettlementSnapshot(
  diagnostics: unknown,
  state: unknown,
  expected: InventoryActionSettlementExpected,
): InventoryActionSettlementOutcome;

export function buildInventoryActionSettlementSource(
  expected: InventoryActionSettlementExpected,
): string;

export function stopAfterRecordedProductOutcome(
  viewport: string,
  surface: string,
  code: string,
  element: string,
  outcome: Readonly<{ ok?: boolean }> | null,
  expected: string,
): void;

export function buildArc4AtomicGeometryEvidenceExpression(options?: {
  verb?: 'tame' | 'scavenge' | 'sample' | null;
  close?: boolean;
  forceHeartbeatRerender?: boolean;
}): string;

export function runInventoryOffscreenProbe<TProbe = unknown>(owners: {
  setup: () => InventoryActionOffscreenSetup | Promise<InventoryActionOffscreenSetup>;
  activate: () => TProbe | Promise<TProbe>;
  restore: (
    setup: InventoryActionOffscreenSetup | null,
    setupError: string | null,
  ) => InventoryActionOffscreenRestoration | Promise<InventoryActionOffscreenRestoration>;
}): Promise<{
  offscreenSetup: InventoryActionOffscreenSetup | null;
  offscreenProbe: TProbe | null;
  restored: InventoryActionOffscreenRestoration | null;
  setupError: string | null;
  probeError: string | null;
  restorationError: string | null;
  probeAttempted: boolean;
}>;
