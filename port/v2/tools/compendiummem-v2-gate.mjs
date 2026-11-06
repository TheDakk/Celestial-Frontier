/* D57 (Dakk 2026-11-04): the develop/production browser chain's Compendium step verifies the ACTIVE v2 I5 certificate.
   Certification moved to v2 epochs on 2026-09-25 (`compendiummem-v2.mjs`: three calibrations + one certification on the exact
   product bytes, selected by `budgets/compendium-memory-active.json`). The v1 standalone collector compared every build with
   the retired v1 budget, so it was INSTRUMENT-FAIL on any current head (2026-11-04, 1171945d15). `compendium-certificate.mjs`
   builds the evidence bundle ONCE, derives the live measurement + producer authorities, and requires the active certificate,
   the active budget's measurement authority and its producer authority to all match those exact built bytes. No browser is
   used and no number is re-measured: the certificate IS the measurement of these bytes. The v1 collector remains runnable
   as history (`npm run compendiummem`). Pure functions here; the CLI is compendium-certificate.mjs. */
import { stableJson } from './compendiummem-fixture.mjs';

export const COMPENDIUM_V2_GATE_SCHEMA = 'cf-v2-compendium-certificate-gate/v1';

/** Every reason the observed authorities do not admit this build ([] = admitted). */
export function compendiumV2GateFindings(observed) {
  const c = observed?.compendium, out = [];
  if (!c) return ['no Compendium authorities were observed'];
  if (c.certificate?.ok !== true) out.push('active v2 certificate refused: ' + (c.certificate?.errors ?? ['unknown']).join('; '));
  if (c.measurementBudgetMatches !== true) out.push('measurement authority differs from the active budget: ' + (c.measurementBudgetMismatches ?? []).join(', '));
  if (c.producerBudgetMatches !== true) out.push('producer authority differs from the active budget: ' + (c.producerBudgetMismatches ?? []).join(', '));
  return out;
}

/** The terminal run record written to the Compendium report path. */
export function compendiumV2GateRecord({ runId, source, observed, epochDirectory }) {
  const findings = compendiumV2GateFindings(observed);
  return {
    schema: COMPENDIUM_V2_GATE_SCHEMA, runId, status: findings.length === 0 ? 'pass' : 'fail', findings, source,
    build: observed?.build ?? null, epochDirectory,
    certificate: observed?.compendium?.certificate ?? null,
    measurement: observed?.compendium?.measurement ?? null,
    producer: observed?.compendium?.producer ?? null,
  };
}

/** Named verification: the record is this run's PASS, for this exact source, and the CURRENT built bytes are still the ones it
 * admitted under the currently selected certificate (re-derived, never trusted from the record). */
export function verifyCompendiumV2GateRecord(record, expectedRunId, { source, observed, epochDirectory }) {
  const errors = [];
  if (record?.schema !== COMPENDIUM_V2_GATE_SCHEMA) errors.push('not a v2 certificate gate record');
  if (record?.runId !== expectedRunId) errors.push(`run id ${record?.runId} is not ${expectedRunId}`);
  if (record?.status !== 'pass' || !Array.isArray(record?.findings) || record.findings.length !== 0) errors.push('record is not a terminal PASS');
  if (stableJson(record?.source) !== stableJson(source)) errors.push('source identity differs from the checked-out source');
  if (record?.epochDirectory !== epochDirectory) errors.push('a different certificate is selected now');
  if (stableJson(record?.build) !== stableJson(observed?.build)) errors.push('built bytes differ from the admitted build');
  if (stableJson(record?.producer) !== stableJson(observed?.compendium?.producer)) errors.push('producer authority differs from the admitted one');
  if (stableJson(record?.measurement) !== stableJson(observed?.compendium?.measurement)) errors.push('measurement authority differs from the admitted one');
  for (const f of compendiumV2GateFindings(observed)) errors.push('now: ' + f);
  return { ok: errors.length === 0, errors };
}
