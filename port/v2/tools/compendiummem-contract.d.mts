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
export const CEILING_FIELDS: readonly string[];
export const SAMPLE_METRIC_FIELDS: readonly string[];
export function sha256(value: string | NodeJS.ArrayBufferView): string;
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
export function remainingCommandTimeoutMs(deadlineMs: number, nowMs: number,
  transportTimeoutMs: number): number | null;
export function phaseObservationAccepted(deadlineMs: number, completedAtMs: number,
  value: unknown): boolean;
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
