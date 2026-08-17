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
  'cf-v2-compendium-browser-authority/v1';
export const COMPENDIUM_BROWSER_AUTHORITY_SCOPE: 'arc1a-compendium-memory-only';
export const CANDIDATE_CDP_TIMEOUT_SCHEMA: string;
export const CANDIDATE_COMMAND_SCHEMA: string;
export const PLAIN_EVALUATE_COMMAND_SCHEMA: string;
export const RAW_CDP_COMMAND_SCHEMA: string;
export const PARTIAL_FAILURE_SCHEMA: string;
export const PARTIAL_PROFILE_SCHEMA: string;
export const FILTER_TRANSITION_SCHEMA: string;
export const PRODUCER_ERROR_WITNESS_SCHEMA:
  'cf-v2-compendium-producer-error-witness/v1';
export const PRODUCER_ERROR_ARM_MESSAGE: 'compendiummem injected producer error';
export const PRODUCER_ERROR_ARM_SENTINEL: 'cf-v2-compendium-producer-error-armed/v1';
export const REQUIRED_WARM_CYCLES: number;
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
  schema: 'cf-v2-compendium-browser-authority/v1';
  scope: 'arc1a-compendium-memory-only';
  product: string;
  revision: string;
  jsVersion: string;
  protocolVersion: string;
}>;
export function sha256(value: string | NodeJS.ArrayBufferView): string;
export function compendiumBrowserAuthority(browser: unknown): CompendiumBrowserAuthority | null;
export function validCompendiumBrowserAuthority(authority: unknown):
  authority is CompendiumBrowserAuthority;
export function compendiumBrowserAuthorityMatches(browser: unknown,
  authority: unknown): boolean;
export function compendiumBudgetBrowserAuthority(record: unknown):
  CompendiumBrowserAuthority | null;
export function compendiumRawSnapshotExpression(): string;
export function validCompendiumRawSnapshotExpression(source: unknown): boolean;
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
  brokenBaselineProjectionRowsSha256?: string | null): {
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
