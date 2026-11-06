export const COMPENDIUM_V2_GATE_SCHEMA: 'cf-v2-compendium-certificate-gate/v1';
export function compendiumV2GateFindings(observed: unknown): string[];
export interface CompendiumV2GateRecord {
  schema: string; runId: string; status: 'pass' | 'fail'; findings: string[]; source: unknown; build: unknown;
  epochDirectory: string; certificate: unknown; measurement: unknown; producer: unknown;
}
export function compendiumV2GateRecord(input: { runId: string; source: unknown; observed: unknown; epochDirectory: string }): CompendiumV2GateRecord;
export function verifyCompendiumV2GateRecord(record: unknown, expectedRunId: string, world: { source: unknown; observed: unknown; epochDirectory: string }): { ok: boolean; errors: string[] };
