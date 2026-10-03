/* The authorized September 25 epoch has ZERO growth allowance. Historical
   calibration bytes remain a ruler, never samples for the new producer. */
import fs from 'node:fs';
import { CEILING_FIELDS, SAMPLE_METRIC_FIELDS, sha256 } from './compendiummem-contract.mjs';

export const policy = JSON.parse(fs.readFileSync(new URL('../budgets/compendium-memory-v2-policy.json', import.meta.url)));
export const v1Bytes = fs.readFileSync(new URL('../budgets/compendium-memory-v1.json', import.meta.url));
export const v1 = JSON.parse(v1Bytes);
if (sha256(v1Bytes) !== policy.v1Sha256) throw new Error('immutable v1 ruler changed');
for (const profile of ['phone', 'desktop']) {
  if (JSON.stringify(Object.keys(policy.allowance[profile]).sort()) !== JSON.stringify([...CEILING_FIELDS].sort())
    || Object.values(policy.allowance[profile]).some(value => value !== 0)) {
    throw new Error('this epoch authorizes zero allowance for every v1 counter');
  }
}
export const growthGuard = Object.freeze({ v1Sha256: policy.v1Sha256, allowance: policy.allowance });
export function guardedCeilings() {
  return Object.fromEntries(['phone', 'desktop'].map(profile => [profile, {
    rationale: policy.selectionRule,
    ...Object.fromEntries(CEILING_FIELDS.map(field => [field, v1.ceilings[profile][field] + policy.allowance[profile][field]])),
  }]));
}
export function growthFindings(ceilings, samples = { phone: [], desktop: [] }) {
  const errors = [];
  for (const profile of ['phone', 'desktop']) {
    for (const [index, field] of CEILING_FIELDS.entries()) {
      const ceiling = ceilings?.[profile]?.[field];
      const limit = v1.ceilings[profile][field] + policy.allowance[profile][field];
      if (!Number.isFinite(ceiling) || ceiling <= 0 || ceiling > limit) errors.push(`${profile}.${field}: exceeds fixed v1 growth allowance or is invalid`);
      for (const sample of samples[profile] ?? []) {
        const observed = sample.metrics?.[SAMPLE_METRIC_FIELDS[index]];
        if (!Number.isFinite(observed) || observed < 0 || observed >= ceiling) errors.push(`${profile}.${field}: regression or missing strict calibration headroom`);
      }
    }
  }
  return errors;
}
