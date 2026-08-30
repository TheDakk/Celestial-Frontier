export const REPORT_SCHEMA: string;
export const BUDGET_SCHEMA: string;
export const DIAGNOSTICS_SCHEMA: string;
export const ART_DIAGNOSTICS_SCHEMA: string;
export const PROFILES: readonly string[];
export const COMMAND_TIMEOUT_MS: number;
export const CANDIDATE_TRANSPORT_TIMEOUT_MS: number;
export const BASELINE_OBSERVATION_TIMEOUT_MS: number;
export const CANDIDATE_BROWSER_LABEL: string;
export const COMPENDIUM_BROWSER_AUTHORITY_SCHEMA:
  'cf-v2-compendium-browser-authority/v2';
export const COMPENDIUM_BROWSER_AUTHORITY_SCOPE: 'arc1a-compendium-memory-only';
export const COMPENDIUM_BROWSER_FAMILY: 'microsoft-edge';
export const COMPENDIUM_BROWSER_CAPABILITY_CONTRACT:
  'cf-v2-compendium-cdp-capabilities/v1';
export const COMPENDIUM_BROWSER_PROTOCOL_VERSION: '1.3';
export const COMPENDIUM_BROWSER_REQUIRED_CDP_METHODS: readonly string[];
export const COMPENDIUM_BROWSER_BEST_EFFORT_CDP_METHODS: readonly string[];
export const COMPENDIUM_BROWSER_CAPABILITY_CONTRACT_SHA256: string;
export const COMPENDIUM_BROWSER_HISTORICAL_CAPABILITY_CONTRACT_SHA256S:
  readonly string[];
export const COMPENDIUM_MEASUREMENT_AUTHORITY_SCHEMA:
  'cf-v2-compendium-measurement-authority/v1';
export const COMPENDIUM_MEASUREMENT_AUTHORITY_INPUT_KEYS: readonly string[];
export const COMPENDIUM_PRODUCER_AUTHORITY_SCHEMA:
  'cf-v2-compendium-producer-authority/v1';
export const COMPENDIUM_PRODUCER_AUTHORITY_INPUT_KEYS: readonly string[];
export const COMPENDIUM_FIXED_RULER_AUTHORITY_SCHEMA:
  'cf-v2-compendium-fixed-ruler-authority/v1';
export const COMPENDIUM_FIXED_RULER_CALIBRATION_STATUS: 'sealed-exact-input';
export const COMPENDIUM_FIXED_RULER_CEILING_SCOPE: 'numeric-ceilings-only';
export const COMPENDIUM_CURRENT_CERTIFICATION_REQUIREMENT:
  'fresh-exact-producer-required';
export const CANDIDATE_CALIBRATION_EVIDENCE_SCHEMA:
  'cf-v2-compendium-candidate-calibration-evidence/v1';
export const BASELINE_CALIBRATION_EVIDENCE_SCHEMA:
  'cf-v2-compendium-broken-baseline-calibration-evidence/v1';
export const CANDIDATE_CDP_TIMEOUT_SCHEMA: string;
export const CANDIDATE_COMMAND_SCHEMA: string;
export const PLAIN_EVALUATE_COMMAND_SCHEMA: string;
export const RAW_CDP_COMMAND_SCHEMA: string;
export const PARTIAL_FAILURE_SCHEMA: string;
export const PARTIAL_PROFILE_SCHEMA: 'cf-v2-compendium-partial-profile/v6';
export const FILTER_TRANSITION_SCHEMA: string;
export const PRODUCER_ERROR_WITNESS_SCHEMA:
  'cf-v2-compendium-producer-error-witness/v1';
export const PRODUCER_ERROR_ARM_MESSAGE: 'compendiummem injected producer error';
export const PRODUCER_ERROR_ARM_SENTINEL: 'cf-v2-compendium-producer-error-armed/v1';
export const THUMB_SETTLEMENT_OBSERVATION_SCHEMA:
  'cf-v2-compendium-thumb-settlement-observation/v1';
export const THUMB_SETTLEMENT_RECEIPT_SCHEMA:
  'cf-v2-compendium-thumb-settlement-receipt/v1';
export const THUMB_SETTLEMENT_ACTIVE_SCHEMA:
  'cf-v2-compendium-thumb-settlement-active/v1';
export const THUMB_SETTLEMENT_RECEIPT_TIMEOUT_MS: 30000;
export const FOREGROUND_SERVICE_OBSERVATION_SCHEMA:
  'cf-v2-compendium-foreground-service-observation/v1';
export const FOREGROUND_SERVICE_RECEIPT_SCHEMA:
  'cf-v2-compendium-foreground-service-receipt/v1';
export const FOREGROUND_SERVICE_RECEIPT_LABELS: readonly [
  'fresh lazy-control', 'veteran Earth', 'final lazy-control',
];
export const FOREGROUND_SERVICE_RECEIPT_TIMEOUT_MS: 5000;
export const MAX_THUMB_SETTLEMENT_IMAGES: 64;
export const MAX_THUMB_SETTLEMENT_FILTER_COUNT: 1000000;
export const MAX_THUMB_SETTLEMENT_REASONS: 384;
export const REQUIRED_WARM_CYCLES: number;
export const REQUIRED_QUIESCENT_UNLEASED_THUMB_ENTRIES: 17;
export type CompendiumThumbSettlementReceiptPlanEntry = Readonly<{
  label: string;
  surface: 'list' | 'planetside';
  expectedCount: number | null;
}>;
export const THUMB_SETTLEMENT_RECEIPT_PLAN:
  readonly CompendiumThumbSettlementReceiptPlanEntry[];
export const MAX_THUMB_SETTLEMENT_RECEIPT_HISTORY: number;
export const MAX_PARTIAL_COMMAND_LEDGER_ENTRIES: 2048;
export const MAX_PARTIAL_COMMAND_LEDGER_BYTES: 2097152;
export const OUTCOME_IDS: readonly string[];
export const EXPECTED_OUTCOMES: readonly string[];
export const REPORT_INPUT_KEYS: readonly string[];
export const REVIEW_PACKET_STATES: readonly string[];
export const BROKEN_BASELINE_EXPECTED_FAULTS: readonly string[];
export const BROKEN_BASELINE_THUMB_OBSERVER_SCHEMA:
  'cf-v2-compendium-broken-thumb-observer/v1';
export const BROKEN_BASELINE_THUMB_CACHE_CAP: 600;
export const BROKEN_BASELINE_PORTRAIT_CACHE_CAPS: Readonly<{
  phone: 96; desktop: 256;
}>;
export const COMPENDIUM_RAW_SNAPSHOT_REQUIRED_TOKENS: readonly string[];
export const CEILING_FIELDS: readonly string[];
export const SAMPLE_METRIC_FIELDS: readonly string[];
export type CompendiumBrowserAuthority = Readonly<{
  schema: 'cf-v2-compendium-browser-authority/v2';
  scope: 'arc1a-compendium-memory-only';
  family: 'microsoft-edge';
  protocolVersion: '1.3';
  capabilityContract: 'cf-v2-compendium-cdp-capabilities/v1';
  capabilityContractSha256: string;
}>;
export type CompendiumMeasurementAuthority = Readonly<{
  schema: 'cf-v2-compendium-measurement-authority/v1';
  sha256: string;
  inputs: Readonly<Record<string, string>>;
}>;
export type CompendiumProducerAuthority = Readonly<{
  schema: 'cf-v2-compendium-producer-authority/v1';
  sha256: string;
  inputs: Readonly<Record<'index' | 'owner' | 'worker' | 'painter', Readonly<{
    relativePath: string; sha256: string;
  }>>>;
}>;
export type CompendiumFixedRulerAuthority = Readonly<{
  schema: 'cf-v2-compendium-fixed-ruler-authority/v1';
  calibrationStatus: 'sealed-exact-input';
  ceilingScope: 'numeric-ceilings-only';
  measurementAuthoritySha256: string;
  producerAuthoritySha256: string;
  currentCertification: 'fresh-exact-producer-required';
}>;
export function sha256(value: string | NodeJS.ArrayBufferView): string;
export function compendiumMeasurementAuthority(inputs: unknown):
  CompendiumMeasurementAuthority | null;
export function compendiumProducerAuthority(inputs: unknown):
  CompendiumProducerAuthority | null;
export function validCompendiumFixedRulerAuthority(authority: unknown):
  authority is CompendiumFixedRulerAuthority;
export function compendiumCalibrationEvaluatorBudget(
  producerAuthority: CompendiumProducerAuthority,
): Readonly<Record<string, unknown>> | null;
export function candidateCalibrationEvidence(measurement: unknown,
  options?: { runId?: string }): Readonly<Record<string, unknown>> | null;
export function brokenBaselineCalibrationEvidence(options?: {
  runId?: string;
  profile?: 'phone' | 'desktop';
  list?: unknown;
  detail?: unknown;
  warm?: readonly unknown[];
  eagerResource?: unknown;
  speciesChunk?: unknown;
}): Readonly<Record<string, unknown>> | null;
export function reduceCalibrationEvidence(evidence: unknown): {
  metrics: Record<string, number>;
  observedFaults: string[] | null;
} | null;
export function compendiumBrowserAuthority(browser: unknown): CompendiumBrowserAuthority | null;
export function compendiumBrowserCapabilityInventoryErrors(sources: {
  collectorSource: string;
  browserCdpSource: string;
}): string[];
export function validCompendiumBrowserAuthority(authority: unknown):
  authority is CompendiumBrowserAuthority;
export function compendiumBrowserAuthorityMatches(browser: unknown,
  authority: unknown): boolean;
export function compendiumBudgetBrowserAuthority(record: unknown):
  CompendiumBrowserAuthority | null;
export function compendiumRawSnapshotExpression(): string;
export function validCompendiumRawSnapshotExpression(source: unknown): boolean;
export function installBrokenBaselineInitialListArm(
  globalObject: unknown,
  ElementConstructor: unknown,
  clock: { now(): number },
  schema: string,
  selector: string,
  expectedPreOwnerExact132Completions: number,
): Readonly<{
  phase: string;
  stableTotal: number;
  expectedPreOwnerExact132Completions: number;
  quietMs: number;
}> | null;
export function sealBrokenBaselineInitialListObservation(
  globalObject: unknown,
  clock: { now(): number },
  schema: string,
  cacheCap: number,
  requiredCompletions: number,
): Readonly<Record<string, number | boolean | null>> | null;
export function validTransportTimeoutPolicy(policy: {
  candidateTransportTimeoutMs: number;
  candidateTargetTimeoutMs: number;
  baselineTransportTimeoutMs: number;
  baselineObservationTimeoutMs: number;
}): boolean;
export function compendiumCdpOptions(kind: 'candidate' | 'baseline',
  options: Readonly<Record<string, unknown>>): Readonly<Record<string, unknown> & {
    commandTimeoutMs: number;
  }>;
export function validProfileEmulationOptions(profile: 'phone' | 'desktop', viewport: {
  width: number; height: number; dpr: number; mobile: boolean;
}, options: unknown): boolean;
export function compendiumProfileEmulationOptions(profile: 'phone' | 'desktop', viewport: {
  width: number; height: number; dpr: number; mobile: boolean;
}): Readonly<{
  deviceMetrics: Readonly<{
    width: number; height: number; deviceScaleFactor: number; mobile: boolean;
  }>;
  touch: Readonly<{ enabled: false } | { enabled: true; maxTouchPoints: 5 }>;
}>;
export type CompendiumThumbSettlementSurface = 'list' | 'planetside';
export type CompendiumThumbSettlementExpected = Readonly<{
  surface: CompendiumThumbSettlementSurface;
  expectedCount: number | null;
  receiptToken: string;
  targetId: string;
  sessionId: string;
  documentToken: string;
}>;
export type CompendiumThumbSettlementObservation = Readonly<{
  schema: 'cf-v2-compendium-thumb-settlement-observation/v1';
  surface: CompendiumThumbSettlementSurface;
  expectedCount: number | null;
  receiptToken: string;
  ready: boolean;
  reasons: readonly string[];
  ownership: Readonly<{
    selector: string;
    rawImageCount: number;
    rawLogicalIds: readonly (string | null)[];
    diagnosticImageCount: number;
    diagnosticLogicalIds: readonly (string | null)[];
  }>;
  diagnostic: Readonly<{
    panelMode: string;
    filteredCount: number;
    visible: boolean;
    thumbStates: readonly string[];
  }>;
  images: readonly Readonly<{
    index: number;
    logicalId: string | null;
    visualKey: string | null;
    thumbState: string | null;
    srcPresent: boolean;
    complete: boolean;
    naturalWidth: number;
    naturalHeight: number;
  }>[];
  art: Readonly<{
    available: boolean;
    schema: string | null;
    queuedJobs: number | null;
    activeJobs: number | null;
  }>;
  lazyArt: Readonly<{
    available: boolean;
    schema: string | null;
    state: string | null;
    importStarts: number | null;
    identity: Readonly<{
      documentToken: string;
      lastProducerEpoch: number;
      lastWorkerInstanceId: number;
    }> | null;
    lastEvent: Readonly<{
      producerEpoch: number;
      workerInstanceId: number;
      jobId: number;
      kind: string;
      event: string;
    }> | null;
    phases: Readonly<{
      importStarts: number;
      importCompletes: number;
      thumbJobStarts: number;
      thumbRenderCompletes: number;
      thumbEncodeStarts: number;
      thumbEncodeCompletes: number;
      portraitJobStarts: number;
      portraitRenderCompletes: number;
      portraitEncodeStarts: number;
      portraitEncodeCompletes: number;
    }> | null;
    results: Readonly<{
      count: number;
      maxImportDurationMs: number;
      maxRenderDurationMs: number;
      maxEncodeDurationMs: number;
    }> | null;
    errors: Readonly<{
      capability: number;
      protocol: number;
      import: number;
      paint: number;
      encode: number;
    }> | null;
  }>;
  worker: Readonly<{
    available: boolean;
    live: boolean | null;
    starts: number | null;
    ready: number | null;
    disposals: number | null;
    fatals: number | null;
    protocolErrors: number | null;
  }>;
  broker: Readonly<{
    available: boolean;
    cacheEntries: number | null;
    leases: number | null;
    subscribers: number | null;
    queuedJobs: number | null;
    activeJobs: number | null;
  }>;
  page: Readonly<{
    targetId: string;
    sessionId: string;
    documentToken: string;
    visibilityState: string;
    hidden: boolean;
    focused: boolean;
  }>;
}>;
export type CompendiumCandidateCommandSettlement = Readonly<{
  method: 'Runtime.evaluate' | 'Browser.getVersion';
  status: 'fulfilled' | 'rejected';
  completedAtMs: number;
  durationMs: number;
  timely: boolean;
  resultState?: 'value' | 'page-exception' | 'missing-value';
  product?: string | null;
  error?: string;
  timeout?: Readonly<{ schema: string; method: string; timeoutMs: number }> | null;
}>;
export type CompendiumCandidateCommandEvidence = Readonly<{
  schema: string;
  profile: 'phone' | 'desktop';
  label: string;
  issuedAtMs: number;
  phaseDeadlineMs: number;
  commandDeadlineMs: number;
  timeoutMs: number;
  target: CompendiumCandidateCommandSettlement;
  heartbeat: CompendiumCandidateCommandSettlement;
}>;
export type CompendiumThumbSettlementReceiptTiming = Readonly<{
  issuedAtMs: number;
  deadlineMs: number;
  receivedAtMs: number;
  timeoutMs: 30000;
}>;
export type CompendiumThumbSettlementReceipt = Readonly<{
  schema: 'cf-v2-compendium-thumb-settlement-receipt/v1';
  label: string;
  attempt: number;
  expected: CompendiumThumbSettlementExpected;
  observation: CompendiumThumbSettlementObservation;
  command: CompendiumCandidateCommandEvidence;
  timing: CompendiumThumbSettlementReceiptTiming;
}>;
export type CompendiumActiveThumbSettlement = Readonly<{
  schema: 'cf-v2-compendium-thumb-settlement-active/v1';
  label: string;
  attempt: number;
  expected: CompendiumThumbSettlementExpected;
  lastObservation: unknown;
  lastDecision: CompendiumObservationDecision | null;
  lastCommand: CompendiumCandidateCommandEvidence | null;
  timing: Readonly<{
    issuedAtMs: number;
    deadlineMs: number;
    receivedAtMs: number | null;
    timeoutMs: 30000;
  }>;
}>;
export type CompendiumPartialProfileV6 = Readonly<{
  schema: 'cf-v2-compendium-partial-profile/v6';
  profile: 'phone' | 'desktop';
  viewport: Readonly<Record<string, unknown>>;
  evidenceStatus: 'partial-non-certifying';
  lastCompletedStage: string | null;
  failingStage: string;
  completedStages: readonly string[];
  commandLedger: readonly unknown[];
  producerErrorWitness: unknown;
  filterTransitions: readonly unknown[];
  reviewPacket: readonly unknown[];
  diagnosis: string;
  pageAuthorities: Readonly<{
    lazy: Readonly<{ targetId: string; sessionId: string; documentToken: string }> | null;
    main: Readonly<{ targetId: string; sessionId: string; documentToken: string }> | null;
  }>;
  thumbnailSettlements: readonly CompendiumThumbSettlementReceipt[];
  thumbnailSettlementHistory: readonly CompendiumThumbSettlementReceipt[];
  activeThumbnailSettlement: CompendiumActiveThumbSettlement | null;
}>;
export type CompendiumPartialFailure = Readonly<{
  schema: string;
  classification: 'product-unanswerable' | 'instrument';
  profile: 'phone' | 'desktop' | null;
  lastCompletedStage: string | null;
  failingStage: string;
  command: unknown;
  diagnosis: string;
}>;
export type CompendiumThumbSettlementReceiptValidationOptions = Readonly<{
  profile: 'phone' | 'desktop';
  pageAuthority: Readonly<{
    targetId: string; sessionId: string; documentToken: string;
  }>;
  browserProduct: string;
  planIndex: number;
  allowReadyReceiptFailure?: boolean;
}>;
export type CompendiumForegroundServiceExpected = Readonly<{
  targetId: string;
  sessionId: string;
  documentToken: string;
  serviceToken: string;
}>;
export type CompendiumForegroundServicePhase = Readonly<{
  observed: boolean;
  sequence: number | null;
  visibilityState: string | null;
  hidden: boolean | null;
  focused: boolean | null;
}>;
export type CompendiumForegroundServiceObservation = Readonly<{
  schema: 'cf-v2-compendium-foreground-service-observation/v1';
  targetId: string;
  sessionId: string;
  documentToken: string;
  visibilityState: string;
  hidden: boolean;
  focused: boolean;
  service: Readonly<{
    token: string;
    visibilityChanges: number;
    focusLosses: number;
    arm: CompendiumForegroundServicePhase;
    raf: CompendiumForegroundServicePhase;
    laterTask: CompendiumForegroundServicePhase;
  }>;
}>;
export type CompendiumForegroundServiceReceipt = Readonly<{
  schema: 'cf-v2-compendium-foreground-service-receipt/v1';
  label: 'fresh lazy-control' | 'veteran Earth' | 'final lazy-control';
  expected: CompendiumForegroundServiceExpected;
  observation: CompendiumForegroundServiceObservation;
  timing: Readonly<{
    issuedAtMs: number;
    deadlineMs: number;
    receivedAtMs: number;
    timeoutMs: 5000;
  }>;
  cleanup: Readonly<{ cleanupPresent: false; servicePresent: false }>;
}>;
export type CompendiumObservationDecision = Readonly<{
  status: 'ready' | 'pending' | 'error';
  reasons: readonly string[];
}>;
export function compendiumThumbSettlementReceiptToken(
  profile: 'phone' | 'desktop', label: string, attempt: number,
): string;
export function classifyCompendiumThumbSettlement(observation: unknown,
  expected: CompendiumThumbSettlementExpected): CompendiumObservationDecision;
export function validCompendiumThumbSettlementObservation(observation: unknown,
  expected: CompendiumThumbSettlementExpected): observation is CompendiumThumbSettlementObservation;
export function validCompendiumThumbSettlementReceipt(receipt: unknown,
  options: CompendiumThumbSettlementReceiptValidationOptions):
  receipt is CompendiumThumbSettlementReceipt;
export function validCompendiumActiveThumbSettlement(active: unknown,
  options: CompendiumThumbSettlementReceiptValidationOptions):
  active is CompendiumActiveThumbSettlement;
export function validCompendiumForegroundServiceObservation(observation: unknown):
  observation is CompendiumForegroundServiceObservation;
export function classifyCompendiumForegroundServiceTurn(observation: unknown,
  expected: CompendiumForegroundServiceExpected): CompendiumObservationDecision;
export function classifyCompendiumForegroundServiceTurnReceipt(observation: unknown,
  expected: CompendiumForegroundServiceExpected, deadlineMs: number,
  receivedAtMs: number): CompendiumObservationDecision;
export function validCompendiumForegroundServiceReceipt(receipt: unknown,
  expectedLabel?: CompendiumForegroundServiceReceipt['label'] | null):
  receipt is CompendiumForegroundServiceReceipt;
export function remainingCommandTimeoutMs(deadlineMs: number, nowMs: number,
  transportTimeoutMs: number): number | null;
export function phaseObservationAccepted(deadlineMs: number, completedAtMs: number,
  value: unknown): boolean;
export class CandidateObservationError extends Error {
  classification: 'product-unanswerable' | 'instrument';
  command: unknown;
  constructor(classification: 'product-unanswerable' | 'instrument', message: string,
    command?: unknown, options?: ErrorOptions);
}
export function isCandidateObservationError(error: unknown): error is CandidateObservationError;
export function evaluateCandidateExpression(options: {
  send(method: string, params?: Record<string, unknown>, sessionId?: string,
    options?: { timeoutMs?: number }): Promise<unknown>;
  sessionId: string;
  expression: string;
  profile: 'phone' | 'desktop';
  label: string;
  awaitPromise?: boolean;
  timeoutMs?: number;
  now(role?: string): number;
}): Promise<unknown>;
export function observeCandidateValue(options: {
  send(method: string, params?: Record<string, unknown>, sessionId?: string,
    options?: { timeoutMs?: number }): Promise<unknown>;
  sessionId: string;
  expression: string;
  profile: 'phone' | 'desktop';
  label: string;
  phaseDeadlineMs: number;
  now(role?: string): number;
}): Promise<Readonly<{ value: unknown; command: unknown }>>;
export function waitForCandidateValue(options: {
  send(method: string, params?: Record<string, unknown>, sessionId?: string,
    options?: { timeoutMs?: number }): Promise<unknown>;
  sessionId: string;
  expression: string;
  profile: 'phone' | 'desktop';
  label: string;
  phaseDeadlineMs: number;
  now(role?: string): number;
  sleep(ms: number): Promise<void>;
  onCommand(command: unknown): void;
  acceptValue?(value: unknown): boolean;
  onObservation?(value: unknown, command: unknown): void;
}): Promise<unknown>;
export function candidateNativeKeyDispatches(
  keyName: string, code: string, modifiers?: number, commands?: readonly string[],
): readonly [
  Readonly<{
    type: 'rawKeyDown'; key: string; code: string;
    windowsVirtualKeyCode: number; nativeVirtualKeyCode: number; modifiers: number;
    commands?: readonly string[];
  }>,
  Readonly<{
    type: 'keyUp'; key: string; code: string;
    windowsVirtualKeyCode: number; nativeVirtualKeyCode: number; modifiers: number;
  }>,
];
export function validProducerErrorPreArmObservation(observation: unknown): boolean;
export function validProducerErrorWorkObservation(observation: unknown): boolean;
export function validProducerErrorWitness(witness: unknown, profile: 'phone' | 'desktop',
  options?: { allowPending?: boolean }): boolean;
export function producerErrorColdProof(witness: unknown, profile: 'phone' | 'desktop'): boolean;
export function producerErrorContained(witness: unknown, profile: 'phone' | 'desktop'): boolean;
export function producerErrorRecoverable(witness: unknown, profile: 'phone' | 'desktop'): boolean;
export function producerErrorStages(profile: 'phone' | 'desktop'): Readonly<{
  preArm: 'producer error pre-arm baseline';
  arm: 'arm producer error';
  openTarget: 'producer error open target';
  openPress: 'producer error open mouse press';
  openRelease: 'producer error open mouse release';
  publication: 'producer error publication';
  coldProof: 'producer error cold-key proof';
  answerability: `answerability ${'phone' | 'desktop'}-error`;
  closeTarget: 'producer error close target';
  closePress: 'producer error close mouse press';
  closeRelease: 'producer error close mouse release';
  recoveryOpenTarget: 'producer error recovery open target';
  recoveryOpenPress: 'producer error recovery open mouse press';
  recoveryOpenRelease: 'producer error recovery open mouse release';
  recovery: 'producer error recovery';
  sequence: readonly string[];
}>;
export function validFilterInputObservation(observation: unknown): boolean;
export function validFilterTargetObservation(observation: unknown): boolean;
export function validFilterTelemetrySnapshot(snapshot: unknown): boolean;
export function validFilterTransitionObservation(observation: unknown): boolean;
export function validFilterTransitionWitness(witness: unknown,
  options?: { allowPending?: boolean }): boolean;
export function validCandidateCommandEvidence(command: unknown,
  options?: { requireProductTimeout?: boolean }): boolean;
export function installBrokenBaselineThumbObserver(
  globalObject: Record<string, unknown>,
  CanvasConstructor: { prototype: Record<string, unknown> },
  TextEncoderConstructor: typeof TextEncoder,
  clock: { now(): number },
  schema: string,
  cacheCap: number,
): Record<string, unknown>;
export function validBrokenBaselineThumbObservation(observation: unknown): boolean;
export function brokenBaselineFaults(observation: {
  profile: 'phone' | 'desktop'; list: unknown; eagerResource: unknown; speciesChunk: unknown;
}): string[];
export function brokenBaselineCacheMetrics(profile: 'phone' | 'desktop', list: unknown,
  warm: readonly unknown[]): Readonly<{
  liveCacheEntries: number;
  liveDecodedPixels: number;
  liveDecodedBytes: number;
  liveEncodedBytes: number;
  queuedJobsPeak: 0;
  activeJobsPeak: 0;
  liveLeases: 0;
  liveSubscribers: 0;
  livePortraitCacheEntries: number;
  livePortraitEncodedBytes: number;
  warmDecodedBytesRange: number;
  warmEncodedBytesRange: number;
}> | null;
export function brokenBaselineFailureEvidence(measurements: unknown): Readonly<{
  evidenceStatus: 'partial-diagnostic-not-budget-samples';
  profiles: Readonly<Record<string, unknown>>;
}>;
export function validateBudgetRecord(record: unknown, fixtureRowsSha256?: string | null,
  brokenBaselineProjectionRowsSha256?: string | null,
  expectedMeasurementAuthority?: CompendiumMeasurementAuthority | null,
  expectedProducerAuthority?: CompendiumProducerAuthority | null): {
  ok: boolean; errors: string[];
};
export function evaluateProfile(measurement: unknown, budget: unknown, fixture: unknown): Array<{
  id: string; profile: string; check: string; status: 'pass' | 'fail';
  diagnosis: string | null; evidence: unknown;
}>;
export function sameSourceIdentity(left: unknown, right: unknown): boolean;
export function verifyTerminalReport(report: unknown, expectedRunId: string,
  options?: {
    allowCalibration?: boolean;
    verifyArtifact?: ((item: unknown) => boolean) | null;
    budgetRecord?: unknown;
    expectedBudgetSha256?: string | null;
    fixture?: unknown;
    expectedInputs?: unknown;
    expectedSourceIdentity?: unknown;
  }): { ok: boolean; errors: string[] };
export function calibrationMetrics(measurement: unknown): Record<string, number>;
