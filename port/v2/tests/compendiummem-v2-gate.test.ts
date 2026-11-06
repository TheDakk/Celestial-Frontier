/** D57: the Compendium step of the develop/production browser chain verifies the ACTIVE v2 I5 certificate against the exact
 * built bytes. Outcomes: an honest observation is admitted and its record verifies; every way the certificate, the budget's
 * authorities, the source, the build or the run can differ is refused BY NAME (both directions: each mutation turns a passing
 * verification red, and restoring it turns it green again). */
import { describe, expect, it } from 'vitest';
import { COMPENDIUM_V2_GATE_SCHEMA, compendiumV2GateFindings, compendiumV2GateRecord, verifyCompendiumV2GateRecord } from '../tools/compendiummem-v2-gate.mjs';

const observed = () => ({
  build: { schema: 'cf-v2-dist/v1', sha256: 'b'.repeat(64), fileCount: 120, sourceSha256: 's'.repeat(64) },
  compendium: {
    certificate: { ok: true, errors: [], epoch: 'i5-v2-79c2abbe129e', source: '79c2abbe'.padEnd(40, '0') },
    measurement: { sha256: 'm'.repeat(64) }, producer: { index: 'i'.repeat(64), worker: 'w'.repeat(64) },
    measurementBudgetMatches: true, measurementBudgetMismatches: [], producerBudgetMatches: true, producerBudgetMismatches: [],
  },
});
const source = { commit: 'c'.repeat(40), branch: 'detached', state: 'committed', statusSha256: 'x', workingTreeSha256: 'y' };
const EPOCH = 'audits/C588_I5_EPOCH_20261104/epoch';
const honest = () => compendiumV2GateRecord({ runId: 'run-1', source, observed: observed(), epochDirectory: EPOCH });
const verify = (record: unknown, o = observed(), s: unknown = source, e = EPOCH, id = 'run-1') => verifyCompendiumV2GateRecord(record, id, { source: s, observed: o, epochDirectory: e });

describe('D57 v2 certificate gate', () => {
  it('admits a build whose certificate and budget authorities all match, and its own record verifies', () => {
    const r = honest();
    expect(r).toMatchObject({ schema: COMPENDIUM_V2_GATE_SCHEMA, runId: 'run-1', status: 'pass', findings: [], epochDirectory: EPOCH });
    expect(verify(r)).toEqual({ ok: true, errors: [] });
  });
  it('refuses a build the certificate does not cover, by name, for each authority', () => {
    const certRefused = observed(); certRefused.compendium.certificate = { ok: false, errors: ['Certificate byte mismatch: execution.json'], epoch: null, source: null } as never;
    expect(compendiumV2GateFindings(certRefused)).toEqual(['active v2 certificate refused: Certificate byte mismatch: execution.json']);
    const producer = observed(); producer.compendium.producerBudgetMatches = false; producer.compendium.producerBudgetMismatches = ['index'] as never;
    expect(compendiumV2GateFindings(producer)).toEqual(['producer authority differs from the active budget: index']);
    const measurement = observed(); measurement.compendium.measurementBudgetMatches = false;
    expect(compendiumV2GateFindings(measurement)[0]).toMatch(/^measurement authority differs/);
    expect(compendiumV2GateFindings({})).toEqual(['no Compendium authorities were observed']);
    for (const o of [certRefused, producer, measurement]) expect(compendiumV2GateRecord({ runId: 'r', source, observed: o, epochDirectory: EPOCH }).status).toBe('fail');
  });
  it('named verification refuses every mutated record or changed world, and each control restores green', () => {
    const cases: [string, () => ReturnType<typeof verify>, RegExp][] = [
      ['wrong run id', () => verify(honest(), observed(), source, EPOCH, 'run-2'), /run id run-1 is not run-2/],
      ['a FAIL record', () => verify({ ...honest(), status: 'fail' }), /not a terminal PASS/],
      ['findings smuggled in', () => verify({ ...honest(), findings: ['x'] }), /not a terminal PASS/],
      ['v1 report shape', () => verify({ ...honest(), schema: 'cf-v2-compendium-memory/v1' }), /not a v2 certificate gate record/],
      ['different source', () => verify(honest(), observed(), { ...source, commit: 'd'.repeat(40) }), /source identity differs/],
      ['another certificate selected', () => verify(honest(), observed(), source, 'audits/C502_I5_EPOCH_20261020/epoch'), /different certificate is selected/],
      ['rebuilt different bytes', () => { const o = observed(); o.build.sha256 = 'e'.repeat(64); return verify(honest(), o); }, /built bytes differ/],
      ['producer changed', () => { const o = observed(); o.compendium.producer.index = 'j'.repeat(64); return verify(honest(), o); }, /producer authority differs from the admitted/],
      ['measurement changed', () => { const o = observed(); o.compendium.measurement.sha256 = 'n'.repeat(64); return verify(honest(), o); }, /measurement authority differs from the admitted/],
      ['certificate no longer verifies', () => { const o = observed(); o.compendium.certificate = { ok: false, errors: ['gone'], epoch: null, source: null } as never; return verify(honest(), o); }, /now: active v2 certificate refused: gone/],
    ];
    for (const [name, run, why] of cases) { const r = run(); expect(r.ok, name).toBe(false); expect(r.errors.join(' | '), name).toMatch(why); }
    expect(verify(honest()).ok).toBe(true); // control: the unmutated record over the unchanged world
  });
});
