/* One explicit epoch: prepare an unchanged external product checkout, collect
   three independent samples, activate only below the fixed guard, certify once.
   Usage: node tools/compendiummem-v2.mjs --source=/clean/detached/root
          --head=<full-sha> --out=/new/absolute/evidence-directory */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';
import { materialize } from './compendiummem-v2-materialize.mjs';
import { policy, v1, v1Bytes, growthGuard, guardedCeilings } from './compendiummem-v2-guard.mjs';
import { buildCompendiumFixture, stableJson } from './compendiummem-fixture.mjs';
import { sha256, calibrationMetrics, candidateCalibrationEvidence } from './compendiummem-contract.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const instrumentRoot = path.resolve(here, '../../..');
const git = (root, args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const write = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
const assert = (value, message) => { if (!value) throw new Error(message); };
export const phases = Object.freeze(['calibration-1', 'calibration-2', 'calibration-3', 'certification']);
export function claimPhase(ledger, phase) {
  assert(ledger.steps.every(step => step.exitCode === 0), 'prior phase unfinished or refused; retry forbidden');
  assert(phases[ledger.steps.length] === phase, 'phase repeated, skipped or out of order');
  ledger.steps.push({ phase, exitCode: null });
}
export function samplesFromReports(reports) {
  return Object.fromEntries(['phone', 'desktop'].map(profile => [profile, reports.map(report => ({
    runId: report.runId, commit: report.source.begin.commit,
    workingTreeDigest: report.source.begin.workingTreeSha256,
    inputDigest: sha256(stableJson(report.inputs)),
    measurementAuthoritySha256: null, // Caller assigns independently derived epoch authority.
    producerAuthoritySha256: report.budget.observedProducerAuthority.sha256,
    sourceState: report.source.begin.state, sourceChanged: false,
    fixtureRowsSha256: report.inputs.fixtureRows, measuredAt: report.endedAt,
    browser: { executable: report.browser.executable, product: report.browser.product,
      revision: report.browser.revision, userAgent: report.browser.user_agent,
      jsVersion: report.browser.js_version, protocolVersion: report.browser.protocol_version },
    metrics: calibrationMetrics(report.profiles[profile]),
    evidence: candidateCalibrationEvidence(report.profiles[profile], { runId: report.runId }),
  }))]));
}
export async function runEpoch({ source, head, out }) {
  assert(path.isAbsolute(source) && path.isAbsolute(out), 'absolute source/output required');
  source = fs.realpathSync(source);
  assert(source.startsWith('/private/tmp/') && source !== instrumentRoot, 'epoch requires its isolated temporary checkout');
  assert(/^[a-f0-9]{40}$/.test(head), 'full expected product head required');
  assert(git(source, ['rev-parse', '--show-toplevel']) === source && git(source, ['rev-parse', 'HEAD']) === head, 'product checkout identity mismatch');
  assert(git(source, ['status', '--porcelain=v1', '--untracked-files=all']) === '', 'product source is dirty');
  assert(git(source, ['log', '-1', '--format=%G?']) === 'G', 'product head must have a good signature');
  const instrumentCommit = git(instrumentRoot, ['rev-parse', 'HEAD']);
  assert(git(instrumentRoot, ['log', '-1', '--format=%G?']) === 'G', 'instrument head must be signed');
  const instrumentPaths = git(instrumentRoot, ['ls-files', 'port/v2/tools', 'port/v2/budgets']).split('\n');
  function instrumentIdentity() {
    assert(git(instrumentRoot, ['diff', 'HEAD', '--', ...instrumentPaths]) === '', 'instrument has uncommitted changes');
    const hashes = Object.fromEntries(instrumentPaths.map(file => [file, sha256(fs.readFileSync(path.join(instrumentRoot, file)))]));
    return { commit: instrumentCommit, sha256: sha256(JSON.stringify(hashes)), hashes };
  }
  const instrument = instrumentIdentity();
  fs.mkdirSync(out); // Exclusive epoch: an existing directory is never resumed or retried.
  const generated = path.join(out, 'instrument');
  const manifest = materialize(generated);
  write(path.join(out, 'instrument-authority.json'), { ...instrument, manifest });
  const v2 = path.join(source, 'port/v2'), smoke = path.join(v2, 'apps/game/smoke');
  fs.mkdirSync(smoke, { recursive: true });
  const budgetPath = path.join(smoke, 'compendium-memory-v2.json');
  assert(!fs.existsSync(budgetPath), 'epoch budget already exists; retry forbidden');
  const epoch = 'i5-v2-' + head.slice(0, 12);
  const ledger = { epoch, head, source, instrument: { commit: instrument.commit, sha256: instrument.sha256 },
    v1Sha256: policy.v1Sha256, automaticRetries: 0, steps: [], commands: [] };
  const saveLedger = () => write(path.join(out, 'execution.json'), ledger);
  saveLedger();
  const env = { ...process.env, CF_COMPENDIUM_V2_SOURCE: source,
    CF_BROWSER: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge' };
  process.env.CF_COMPENDIUM_V2_SOURCE = source;
  function run(name, executable, args, cwd = v2, extra = {}) {
    const log = fs.openSync(path.join(out, name + '.log'), 'wx');
    const began = new Date().toISOString(), start = performance.now();
    const result = spawnSync(executable, args, { cwd, env: { ...env, ...extra }, stdio: ['ignore', log, log] });
    fs.closeSync(log);
    const exitCode = result.status ?? 2;
    ledger.commands.push({ name, executable, args, startedAt: began, durationMs: performance.now() - start, exitCode, error: result.error?.message ?? null });
    saveLedger(); console.log(name + ': ' + exitCode);
    return exitCode;
  }
  const invariant = () => {
    assert(git(source, ['rev-parse', 'HEAD']) === head && git(source, ['status', '--porcelain=v1', '--untracked-files=all']) === '', 'product source changed');
    assert(instrumentIdentity().sha256 === instrument.sha256, 'instrument changed during epoch');
    assert(sha256(fs.readFileSync(path.join(source, 'port/v2/budgets/compendium-memory-v1.json'))) === policy.v1Sha256, 'target v1 history differs');
    for (const [file, digest] of Object.entries(manifest.generated)) assert(sha256(fs.readFileSync(path.join(generated, file))) === digest, 'generated instrument changed');
  };
  try {
    invariant();
    assert(run('prepare-build', 'npx', ['vite', 'build', '--mode', 'evidence'], path.join(v2, 'apps/game')) === 0, 'preparation build refused');
    write(budgetPath, {});
    const collector = await import(pathToFileURL(path.join(generated, 'collector.mjs')).href);
    const contract = await import(pathToFileURL(path.join(generated, 'contract.mjs')).href);
    const fixture = buildCompendiumFixture();
    const measurementAuthority = contract.compendiumMeasurementAuthority(collector.exactInputs(fixture));
    const budget = { schema: contract.BUDGET_SCHEMA, status: 'calibration-required', fixture: v1.fixture,
      requirements: v1.requirements, browserAuthority: v1.browserAuthority, measurementAuthority,
      producerAuthority: collector.candidateProducerAuthorityFromDist().authority,
      source: collector.sourceIdentity(), instrument: ledger.instrument, epoch, growthGuard,
      calibration: { requiredIndependentRunsPerProfile: 3, samples: { phone: [], desktop: [] } }, ceilings: guardedCeilings() };
    let validation = contract.validateBudgetRecord(budget, fixture.rowsSha256, null, measurementAuthority, budget.producerAuthority);
    assert(validation.ok, validation.errors.join('; '));
    write(budgetPath, budget); write(path.join(out, 'calibration-budget.json'), budget);
    assert(run('edge-preflight', 'node', [path.join(here, 'compendiummem-browser-preflight.mjs')]) === 0, 'Edge preflight refused');
    const preflight = fs.readFileSync(path.join(out, 'edge-preflight.log'), 'utf8').split('\n').find(line => line.startsWith('{"browser":'));
    assert(preflight, 'Edge preflight provenance missing');
    const exactBrowser = JSON.parse(preflight).browser;
    const reports = [];
    for (const phase of phases) {
      invariant();
      if (phase === 'certification') {
        budget.calibration.samples = samplesFromReports(reports);
        for (const samples of Object.values(budget.calibration.samples)) for (const sample of samples) sample.measurementAuthoritySha256 = measurementAuthority.sha256;
        budget.status = 'active';
        validation = contract.validateBudgetRecord(budget, fixture.rowsSha256, null, measurementAuthority, budget.producerAuthority);
        assert(validation.ok, 'activation refused: ' + validation.errors.join('; '));
        write(budgetPath, budget); write(path.join(out, 'compendium-memory-v2.json'), budget);
      }
      claimPhase(ledger, phase); saveLedger();
      const runId = epoch + '-' + phase;
      const exitCode = run(phase, 'node', [path.join(generated, 'collector.mjs'), ...(phase === 'certification' ? [] : ['--calibrate'])], v2, { CF_COMPENDIUMMEM_RUN_ID: runId });
      ledger.steps.at(-1).runId = runId; ledger.steps.at(-1).exitCode = exitCode; saveLedger();
      const reportPath = path.join(smoke, 'compendiummem-report.json');
      if (fs.existsSync(reportPath)) {
        fs.copyFileSync(reportPath, path.join(out, phase + '-report.json'));
        for (const file of fs.readdirSync(smoke).filter(file => file.includes(runId))) fs.copyFileSync(path.join(smoke, file), path.join(out, file));
      }
      invariant();
      const verify = run(phase + '-verify', 'node', [path.join(generated, 'collector.mjs'), '--verify-run=' + runId]);
      ledger.steps.at(-1).verificationExitCode = verify;
      if (verify !== 0) ledger.steps.at(-1).exitCode = verify;
      saveLedger();
      assert(exitCode === 0 && verify === 0, phase + ' refused; epoch stops without retry');
      const report = JSON.parse(fs.readFileSync(reportPath));
      assert(stableJson(report.browser) === stableJson(exactBrowser), 'exact Edge provenance changed within epoch');
      reports.push(report);
    }
    ledger.status = 'certified';
  } catch (error) {
    ledger.status = 'stopped'; ledger.finding = error.message;
    throw error;
  } finally {
    ledger.finalSource = { head: git(source, ['rev-parse', 'HEAD']), status: git(source, ['status', '--porcelain=v1', '--untracked-files=all']) };
    ledger.v1Unchanged = sha256(fs.readFileSync(new URL('../budgets/compendium-memory-v1.json', import.meta.url))) === sha256(v1Bytes);
    saveLedger();
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = Object.fromEntries(process.argv.slice(2).map(arg => {
    const match = /^--(source|head|out)=(.+)$/.exec(arg);
    if (!match) throw new Error('usage: compendiummem-v2.mjs --source=<root> --head=<sha> --out=<new-directory>');
    return [match[1], match[2]];
  }));
  runEpoch(args).catch(error => { console.error(error.message); process.exitCode = 2; });
}
