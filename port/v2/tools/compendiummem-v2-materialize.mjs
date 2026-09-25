/* Produce a separately hashed v2 instrument without editing v1's sealed files.
   Exact, counted edits affect epoch authority only. The native collector and
   all 78 behavioral outcomes remain byte-identical to the v1 implementation. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { sha256 } from './compendiummem-contract.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
function once(source, before, after) {
  if (source.split(before).length !== 2) throw new Error(`v2 materialization expected one match: ${before.slice(0, 90)}`);
  return source.replace(before, after);
}
function section(source, start, end, replacement) {
  const begin = source.indexOf(start), finish = source.indexOf(end, begin);
  if (begin < 0 || finish < 0 || source.indexOf(start, begin + 1) !== -1) throw new Error('v2 section boundaries drifted');
  return source.slice(0, begin) + replacement + source.slice(finish);
}
const validator = `export function validateBudgetRecord(record, fixtureRowsSha256 = null,
  _historicalProjection = null, expectedMeasurementAuthority = null, expectedProducerAuthority = null) {
  const errors = [];
  if (!isObject(record)) return { ok: false, errors: ['v2 budget missing'] };
  exactKeys(record, ['schema','status','fixture','requirements','browserAuthority','measurementAuthority',
    'producerAuthority','source','instrument','epoch','growthGuard','calibration','ceilings'], 'v2 budget', errors);
  if (record.schema !== BUDGET_SCHEMA || !['calibration-required','active'].includes(record.status)) errors.push('invalid v2 schema/status');
  if (!sameJson(record.fixture, historicalV1.fixture) || (fixtureRowsSha256 && record.fixture?.rowsSha256 !== fixtureRowsSha256)) errors.push('fixture drift');
  if (!sameJson(record.requirements, historicalV1.requirements)) errors.push('requirements drift');
  if (!sameJson(record.browserAuthority, historicalV1.browserAuthority)) errors.push('browser policy drift');
  if (!validMeasurementAuthority(record.measurementAuthority) || (expectedMeasurementAuthority && !sameJson(record.measurementAuthority, expectedMeasurementAuthority))) errors.push('measurement authority mismatch');
  if (!validProducerAuthority(record.producerAuthority) || (expectedProducerAuthority && !sameJson(record.producerAuthority, expectedProducerAuthority))) errors.push('producer authority mismatch');
  if (!validCommittedSourceIdentity(record.source)) errors.push('epoch source must be clean committed');
  if (!isObject(record.instrument) || !/^[a-f0-9]{40}$/.test(record.instrument.commit ?? '') || !/^[a-f0-9]{64}$/.test(record.instrument.sha256 ?? '')) errors.push('instrument identity missing');
  if (!/^[a-z0-9][a-z0-9-]{0,70}$/.test(record.epoch ?? '')) errors.push('invalid epoch ID');
  if (!sameJson(record.growthGuard, authorizedGrowthGuard)) errors.push('growth guard authority drift');
  if (!sameJson(record.ceilings, guardedCeilings())) errors.push('epoch ceilings must retain the predeclared v1 limits');
  errors.push(...growthFindings(record.ceilings));
  const c = record.calibration;
  if (!isObject(c)) return { ok: false, errors: [...errors, 'calibration missing'] };
  exactKeys(c, ['requiredIndependentRunsPerProfile','samples'], 'calibration', errors);
  if (c.requiredIndependentRunsPerProfile !== 3 || !isObject(c.samples)) return { ok: false, errors: [...errors, 'three independent runs required'] };
  exactKeys(c.samples, PROFILES, 'samples', errors);
  for (const profile of PROFILES) {
    const samples = c.samples[profile];
    const count = record.status === 'active' ? 3 : 0;
    if (!Array.isArray(samples) || samples.length !== count) { errors.push(profile + ': wrong independent sample count'); continue; }
    samples.forEach((sample, index) => {
      validateCalibrationSample(sample, profile, index, errors);
      if (sample.commit !== record.source?.commit || sample.workingTreeDigest !== record.source?.workingTreeSha256
        || sample.measurementAuthoritySha256 !== record.measurementAuthority?.sha256
        || sample.producerAuthoritySha256 !== record.producerAuthority?.sha256
        || sample.fixtureRowsSha256 !== record.fixture?.rowsSha256) errors.push(profile + ': sample authority mismatch');
      if (!compendiumBrowserAuthorityMatches(sample.browser, record.browserAuthority)) errors.push(profile + ': sample browser mismatch');
    });
    enforceIndependentRuns(samples, profile, errors);
  }
  if (record.status === 'active') {
    errors.push(...growthFindings(record.ceilings, c.samples));
    enforceSharedSampleIdentity(PROFILES.flatMap(p => c.samples[p] ?? []), 'v2 epoch', errors);
    enforceSameRunBrowserProvenance(c.samples, 'v2 epoch', errors);
    if (!sameJson(c.samples.phone?.map(s => s.runId), c.samples.desktop?.map(s => s.runId))) errors.push('profile run IDs differ');
  }
  return { ok: errors.length === 0, errors };
}

`;

export function materialize(directory) {
  fs.mkdirSync(directory, { recursive: true });
  const collectorOriginal = fs.readFileSync(path.join(here, 'compendiummem.mjs'), 'utf8');
  const contractOriginal = fs.readFileSync(path.join(here, 'compendiummem-contract.mjs'), 'utf8');
  let contract = contractOriginal;
  contract = once(contract, "import crypto from 'node:crypto';", `import crypto from 'node:crypto';\nimport { v1 as historicalV1, growthGuard as authorizedGrowthGuard, guardedCeilings, growthFindings } from ${JSON.stringify(pathToFileURL(path.join(here, 'compendiummem-v2-guard.mjs')).href)};`);
  contract = once(contract, "export const REPORT_SCHEMA = 'cf-v2-compendium-memory-report/v1';", "export const REPORT_SCHEMA = 'cf-v2-compendium-memory-report/v2';");
  contract = once(contract, "export const BUDGET_SCHEMA = 'cf-v2-compendium-memory-budget/v1';", "export const BUDGET_SCHEMA = 'cf-v2-compendium-memory-budget/v2';");
  contract = section(contract, 'export function compendiumCalibrationEvaluatorBudget(', 'function validateCalibrationSample(', `export function compendiumCalibrationEvaluatorBudget(producerAuthority) {
  if (!validProducerAuthority(producerAuthority)) return null;
  return { status: 'active', producerAuthority, ceilings: guardedCeilings() };
}

`);
  // The next export after budget validation is identified from the sealed source.
  const validatorStart = contract.indexOf('export function validateBudgetRecord(');
  const nextExport = contract.indexOf('\nexport ', validatorStart + 1);
  if (nextExport < 0) throw new Error('budget validator boundary missing');
  // Retain intervening private functions after the validator's balanced body.
  const marker = '\n  return { ok: errors.length === 0, errors };\n}';
  const validatorEnd = contract.indexOf(marker, validatorStart) + marker.length;
  if (validatorEnd < validatorStart || validatorEnd > nextExport) throw new Error('budget validator ending drift');
  contract = contract.slice(0, validatorStart) + validator + contract.slice(validatorEnd);
  contract = once(contract, "budget.path !== 'budgets/compendium-memory-v1.json'", "budget.path !== 'apps/game/smoke/compendium-memory-v2.json'");
  let collector = collectorOriginal;
  collector = section(collector, 'async function runBrokenBaselineCalibration(', 'async function runGate(', '');
  collector = section(collector, '  const baselineArg = process.argv.slice(2)', '  const calibrate = process.argv.length', '');
  collector = section(collector, '  if (process.argv.length === 3 && process.argv[2] === SELFTEST_FLAG)', '  const verifyArg = process.argv.slice(2)', '');
  // All shared dependencies resolve to the signed instrument, never the target's tooling.
  collector = collector.replace(/(['"])\.\/([^'"\n]+\.mjs)\1/g, (_match, _quote, name) => JSON.stringify(name === 'compendiummem-contract.mjs'
    ? './contract.mjs' : pathToFileURL(path.join(here, name)).href));
  collector = once(collector, "const v2Root = path.resolve(here, '..');", "const v2Root = path.join(fs.realpathSync(process.env.CF_COMPENDIUM_V2_SOURCE), 'port', 'v2');");
  collector = once(collector, "const budgetPath = path.join(v2Root, 'budgets', 'compendium-memory-v1.json');", "const budgetPath = path.join(outputDir, 'compendium-memory-v2.json');");
  collector = once(collector, "const budgetSchemaPath = path.join(v2Root, 'budgets', 'compendium-memory-v1.schema.json');", `const budgetSchemaPath = ${JSON.stringify(path.join(here, '..', 'budgets', 'compendium-memory-v2-policy.json'))};`);
  collector = once(collector, "path: 'budgets/compendium-memory-v1.json'", "path: 'apps/game/smoke/compendium-memory-v2.json'");
  collector = once(collector, "schema: 'cf-v2-compendium-memory-calibration-sample/v1'", "schema: 'cf-v2-compendium-memory-calibration-sample/v2'");
  collector = once(collector, 'allowCalibration: false, verifyArtifact: verifyReviewArtifact,', 'allowCalibration: budget.status === \'calibration-required\', verifyArtifact: verifyReviewArtifact,');
  collector = once(collector, "return report.status === 'pass' ? 0 : 1;", "return ['pass', 'calibration'].includes(report.status) ? 0 : 1;");
  collector = once(collector, 'three independent runs/profile plus the paired 3844701 baseline are required', 'three fresh independent runs/profile under the immutable v1 growth guard are required');
  collector += '\nexport { exactInputs, sourceIdentity, candidateProducerAuthorityFromDist };\n';
  const outputs = { 'collector.mjs': collector, 'contract.mjs': contract };
  for (const [name, bytes] of Object.entries(outputs)) fs.writeFileSync(path.join(directory, name), bytes);
  const manifest = { originals: { collector: sha256(collectorOriginal), contract: sha256(contractOriginal) },
    generated: Object.fromEntries(Object.entries(outputs).map(([name, bytes]) => [name, sha256(bytes)])) };
  fs.writeFileSync(path.join(directory, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}
