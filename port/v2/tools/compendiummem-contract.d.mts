export const REPORT_SCHEMA: string;
export const BUDGET_SCHEMA: string;
export const DIAGNOSTICS_SCHEMA: string;
export const ART_DIAGNOSTICS_SCHEMA: string;
export const PROFILES: readonly string[];
export const COMMAND_TIMEOUT_MS: number;
export const CANDIDATE_TRANSPORT_TIMEOUT_MS: number;
export const BASELINE_OBSERVATION_TIMEOUT_MS: number;
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
export function sha256(value: string | NodeJS.ArrayBufferView): string;
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
  }): { ok: boolean; errors: string[] };
export function calibrationMetrics(measurement: unknown): Record<string, number>;
