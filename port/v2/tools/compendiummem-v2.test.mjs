import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { pathToFileURL } from 'node:url';
import { materialize } from './compendiummem-v2-materialize.mjs';
import { v1, policy, growthGuard, guardedCeilings, growthFindings } from './compendiummem-v2-guard.mjs';
import { claimPhase, phases, samplesFromReports } from './compendiummem-v2.mjs';
import { CEILING_FIELDS, SAMPLE_METRIC_FIELDS, compendiumMeasurementAuthority } from './compendiummem-contract.mjs';
import { buildCompendiumFixture } from './compendiummem-fixture.mjs';

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-v2-epoch-test-'));
materialize(directory);
const contract = await import(pathToFileURL(path.join(directory, 'contract.mjs')).href);
const fixture = buildCompendiumFixture();
const prior = JSON.parse(zlib.gunzipSync(fs.readFileSync(new URL('../../../audits/ARCHETYPE_REPAIRS_20260922/01-i5/certificate/report.json.gz', import.meta.url))));
// Synthetic control carriers derived from retained raw observations. These are
// test-only objects, never written as calibration samples or certifying evidence.
const reports = [1, 2, 3].map(i => ({ ...prior, runId: 'synthetic-epoch-control-' + i,
  endedAt: `2026-09-25T00:00:0${i}Z` }));
function budget(active = false) {
  const measurementAuthority = compendiumMeasurementAuthority(prior.inputs);
  const samples = active ? samplesFromReports(reports) : { phone: [], desktop: [] };
  for (const values of Object.values(samples)) for (const sample of values) sample.measurementAuthoritySha256 = measurementAuthority.sha256;
  return { schema: contract.BUDGET_SCHEMA, status: active ? 'active' : 'calibration-required',
    fixture: v1.fixture, requirements: v1.requirements, browserAuthority: v1.browserAuthority,
    measurementAuthority, producerAuthority: prior.budget.observedProducerAuthority, source: prior.source.begin,
    instrument: { commit: 'a'.repeat(40), sha256: 'b'.repeat(64) }, epoch: 'synthetic-control',
    growthGuard, calibration: { requiredIndependentRunsPerProfile: 3, samples }, ceilings: guardedCeilings() };
}
const validate = b => contract.validateBudgetRecord(b, fixture.rowsSha256);

test('valid empty epoch and three independent, raw-reducible controls admit; v1 never changes', () => {
  assert.equal(policy.v1Sha256, 'c109b5845b12862bbd8fa069b6f8e394b48d9d8568d8537f20565b63c5d907fc');
  assert.deepEqual(validate(budget()), { ok: true, errors: [] });
  assert.deepEqual(validate(budget(true)), { ok: true, errors: [] });
});
for (const profile of ['phone', 'desktop']) for (const [index, field] of CEILING_FIELDS.entries()) {
  test(`growth guard ${profile}.${field}: unchanged passes, excess/NaN and ceiling-equal sample refuse`, () => {
    const ceilings = guardedCeilings();
    assert.deepEqual(growthFindings(ceilings), []);
    ceilings[profile][field] += 1;
    assert.ok(growthFindings(ceilings).some(e => e.includes(`${profile}.${field}`)));
    ceilings[profile][field] = NaN;
    assert.ok(growthFindings(ceilings).some(e => e.includes(`${profile}.${field}`)));
    const samples = { phone: [], desktop: [] };
    const metrics = Object.fromEntries(SAMPLE_METRIC_FIELDS.map((name, i) => [name, guardedCeilings()[profile][CEILING_FIELDS[i]] / 2]));
    samples[profile].push({ metrics });
    assert.deepEqual(growthFindings(guardedCeilings(), samples), []);
    metrics[SAMPLE_METRIC_FIELDS[index]] = guardedCeilings()[profile][field];
    assert.ok(growthFindings(guardedCeilings(), samples).some(e => e.includes(`${profile}.${field}`)));
  });
}
for (const [name, mutate] of [
  ['historical ruler hash', b => { b.growthGuard.v1Sha256 = '0'.repeat(64); }],
  ['allowance increase', b => { b.growthGuard.allowance.phone.heapUsedBytesMax++; }],
  ['ceiling absorption', b => { b.ceilings.phone.heapUsedBytesMax++; }],
  ['source substitution', b => { b.source.commit = '0'.repeat(40); }],
  ['missing sample', b => { b.calibration.samples.phone.pop(); }],
  ['repeated run', b => { b.calibration.samples.phone[1] = b.calibration.samples.phone[0]; }],
  ['metric forgery', b => { b.calibration.samples.phone[0].metrics.heapUsedBytes++; }],
  ['producer substitution', b => { b.calibration.samples.phone[0].producerAuthoritySha256 = '0'.repeat(64); }],
  ['measurement substitution', b => { b.calibration.samples.phone[0].measurementAuthoritySha256 = '0'.repeat(64); }],
  ['browser substitution', b => { b.calibration.samples.phone[0].browser.product = 'Chrome/153.0.0.0'; }],
]) test(`activation rejects ${name}`, () => {
  const b = structuredClone(budget(true)); mutate(b); assert.equal(validate(b).ok, false);
});
test('calibration uses guarded finite limits, never the legacy unbounded evaluator', () => {
  const b = budget();
  assert.deepEqual(contract.compendiumCalibrationEvaluatorBudget(b.producerAuthority).ceilings, guardedCeilings());
});
test('the native outcome evaluator itself reports growth as failure during calibration', () => {
  const b = budget();
  const evaluation = contract.compendiumCalibrationEvaluatorBudget(b.producerAuthority);
  const green = contract.evaluateProfile(prior.profiles.phone, evaluation, fixture);
  assert.ok(green.every(outcome => outcome.status === 'pass'));
  const red = structuredClone(prior.profiles.phone);
  // Change an actual raw sample, not the reported outcome or derived metrics.
  const mutateHeap = value => {
    if (!value || typeof value !== 'object') return;
    if (value.heap && Object.hasOwn(value.heap, 'usedSize')) value.heap.usedSize = v1.ceilings.phone.heapUsedBytesMax + 1;
    for (const child of Object.values(value)) mutateHeap(child);
  };
  mutateHeap(red);
  const outcomes = contract.evaluateProfile(red, evaluation, fixture);
  assert.ok(outcomes.some(outcome => outcome.status === 'fail' && /heap/i.test(outcome.diagnosis)));
});
test('native collection and outcome evaluation retain the sealed v1 code', () => {
  const original = fs.readFileSync(new URL('./compendiummem.mjs', import.meta.url), 'utf8');
  const generated = fs.readFileSync(path.join(directory, 'collector.mjs'), 'utf8');
  const slice = text => text.slice(text.indexOf('async function collectProfile('), text.indexOf('function findBrokenBaselineSpeciesChunk('));
  assert.equal(slice(generated), slice(original));
  const old = fs.readFileSync(new URL('./compendiummem-contract.mjs', import.meta.url), 'utf8');
  const next = fs.readFileSync(path.join(directory, 'contract.mjs'), 'utf8');
  const evaluation = text => text.slice(text.indexOf('export function evaluateProfile('), text.indexOf('function validateReportBudgetAuthority('));
  assert.ok(evaluation(old).length > 1000);
  assert.equal(evaluation(next), evaluation(old));
});
test('phase ledger admits exactly three independent calibration attempts and one certificate', () => {
  const ledger = { steps: [] };
  for (const phase of phases) { claimPhase(ledger, phase); ledger.steps.at(-1).exitCode = 0; }
  assert.throws(() => claimPhase(ledger, 'certification'), /repeated/);
  assert.throws(() => claimPhase({ steps: [] }, 'certification'), /skipped/);
});
test('a running or failed phase can neither retry nor continue', () => {
  for (const exitCode of [null, 1, 2]) {
    const ledger = { steps: [{ phase: 'calibration-1', exitCode }] };
    assert.throws(() => claimPhase(ledger, 'calibration-1'), /retry forbidden/);
    assert.throws(() => claimPhase(ledger, 'calibration-2'), /retry forbidden/);
  }
});
test.after(() => fs.rmSync(directory, { recursive: true }));
