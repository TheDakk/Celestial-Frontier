import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync, execFileSync } from 'node:child_process';
import { acquireToolchainLock, LOCK_DIRECTORY } from '../../tools/with-toolchain-lock.mjs';
import { acquireWorkspaceLock, WORKSPACE_LOCK_PATH } from '../../port/v2/tools/workspacelock.mjs';

const audit = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(audit, '../..');
const reportPath = path.join(audit, 'static-results.json');
const sha = data => createHash('sha256').update(data).digest('hex');
const readRecord = relative => {
  const data = fs.readFileSync(path.join(root, relative));
  return { path: relative, bytes: data.length, sha256: sha(data) };
};
const outputRecord = absolute => readRecord(path.relative(root, absolute));
const report = { schema: 'cf-creature-kinematics-static/v1', status: 'RUNNING', certification: false,
  startedAt: new Date().toISOString(), finishedAt: null, sourceCommit: null,
  node: { executable: process.execPath, version: process.version },
  scope: 'One fail-stop static chain; no focused-test rerun, browser, profile, or universal-animation admission.',
  startupReceipt: 'audits/TOOLCHAIN_STARTUP_20260908_CIVET/manifest.json',
  sources: [], steps: [], outputs: [], cleanupErrors: [], pending: null,
  locks: { foreground: LOCK_DIRECTORY, checkout: WORKSPACE_LOCK_PATH, released: false } };
let foreground;
let releaseCheckout;
const immutable = [
  'port/v2/tools/creature-animation/kinematics.ts',
  'port/v2/tests/creature-animation-kinematics.test.ts',
  'audits/CIVET_PAINTED_PARTS_20260908/kinematics-tests.json',
  'port/v2/tsconfig.json', 'port/v2/apps/game/tsconfig.json', 'port/v2/apps/game/tsconfig.worker.json',
  'port/v2/package.json', 'port/v2/package-lock.json', 'package.json', 'package-lock.json',
  'main.js', 'tools/validate.js', 'tools/build.js', 'tools/baseline.json',
  'tools/with-toolchain-lock.mjs', 'port/v2/tools/workspacelock.mjs',
  'audits/CIVET_PAINTED_PARTS_20260908/static-runner.mjs',
];
function requireUnchanged() {
  for (const before of report.sources) assert.deepEqual(readRecord(before.path), before, `source changed: ${before.path}`);
}
function step(id, command, args) {
  requireUnchanged();
  const logPath = path.join(audit, `${id}.log`);
  const fd = fs.openSync(logPath, 'wx');
  const entry = { id, command, args, cwd: root, startedAt: new Date().toISOString(), finishedAt: null,
    status: 'RUNNING', exitCode: null, signal: null, log: null };
  report.pending = id;
  report.steps.push(entry);
  let result;
  try { result = spawnSync(command, args, { cwd: root, stdio: ['ignore', fd, fd], timeout: 180000, killSignal: 'SIGTERM' }); }
  finally { fs.closeSync(fd); }
  entry.finishedAt = new Date().toISOString();
  entry.exitCode = result.status;
  entry.signal = result.signal;
  entry.log = outputRecord(logPath);
  entry.status = result.status === 0 && !result.error && result.signal === null ? 'PASS' : 'FAIL';
  if (result.error) entry.error = String(result.error.stack || result.error);
  if (entry.status !== 'PASS') throw new Error(`${id} stopped: exit=${result.status} signal=${result.signal} error=${result.error?.message || 'none'}`);
  requireUnchanged();
  report.pending = null;
  console.log(`${id}: PASS (${entry.log.bytes} log bytes)`);
}
try {
  assert.equal(process.argv.length, 2, 'no arguments accepted');
  assert(!fs.existsSync(reportPath), 'exclusive result already exists');
  assert.equal(process.platform, 'darwin');
  assert.equal(fs.realpathSync(process.cwd()), '/Users/nick/Projects/celestial-frontier-openai-mac');
  assert.equal(fs.realpathSync(root), fs.realpathSync(process.cwd()));
  assert.equal(execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: root, encoding: 'utf8' }).trim(), root);
  assert.equal(execFileSync('git', ['branch', '--show-current'], { cwd: root, encoding: 'utf8' }).trim(), 'openai/mac');
  report.sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  foreground = acquireToolchainLock('painted parts generic core static chain');
  releaseCheckout = acquireWorkspaceLock('painted parts generic core static chain');
  report.sources = immutable.map(readRecord);
  const receipt = JSON.parse(fs.readFileSync(path.join(audit, 'kinematics-tests.json'), 'utf8'));
  assert.equal(receipt.status, 'PASS');
  assert.equal(receipt.results.testsPassed, 15);
  assert.equal(receipt.results.testsTotal, 15);
  for (const source of receipt.sources) assert.deepEqual(readRecord(source.path), source, 'focused-test frozen source changed');
  report.priorFocusedTestReceipt = { ...outputRecord(path.join(audit, 'kinematics-tests.json')),
    receiptKind: receipt.receiptKind, testsPassed: 15, rerun: false,
    qualification: 'Transcribed from original tool output; raw log absent, source hashes recorded afterward on frozen files.' };
  const config = JSON.parse(fs.readFileSync(path.join(root, 'port/v2/tsconfig.json'), 'utf8'));
  assert(config.include.includes('tests/**/*.ts'));
  assert.equal(config.compilerOptions.strict, true);
  assert.equal(config.compilerOptions.noUncheckedIndexedAccess, true);
  assert.equal(config.compilerOptions.exactOptionalPropertyTypes, true);
  const test = fs.readFileSync(path.join(root, 'port/v2/tests/creature-animation-kinematics.test.ts'), 'utf8');
  assert.equal(test.split("from '../tools/creature-animation/kinematics.js'").length - 1, 1);
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'port/v2/package.json'), 'utf8'));
  assert.equal(packageJson.scripts.typecheck, 'tsc --noEmit && tsc --noEmit -p apps/game/tsconfig.json && tsc --noEmit -p apps/game/tsconfig.worker.json');
  report.kinematicsCoverage = { explicitExtraRun: false, strict: true, noUncheckedIndexedAccess: true,
    exactOptionalPropertyTypes: true, includedTestGlob: 'tests/**/*.ts',
    importer: 'port/v2/tests/creature-animation-kinematics.test.ts',
    importSpecifier: '../tools/creature-animation/kinematics.js',
    resolution: 'Bundler module resolution resolves the local .js import to existing kinematics.ts, so the included focused test brings the core into the root strict program.' };
  report.legacyHtmlBefore = readRecord('celestial-frontier.html');
  step('typecheck', '/opt/homebrew/bin/npm', ['--prefix', 'port/v2', 'run', 'typecheck']);
  step('validate', process.execPath, ['tools/validate.js']);
  report.legacyHtmlAfter = readRecord('celestial-frontier.html');
  report.legacyHtmlByteIdentical = report.legacyHtmlBefore.sha256 === report.legacyHtmlAfter.sha256;
  for (const relative of ['celestial-frontier.html', 'tools/probe-build.html', 'tools/current.json']) report.outputs.push(readRecord(relative));
  requireUnchanged();
  report.status = 'PASS';
} catch (error) {
  report.status = 'FAIL';
  report.error = String(error.stack || error);
  process.exitCode = 1;
} finally {
  try { releaseCheckout?.(); } catch (error) { report.cleanupErrors.push(`checkout: ${error.stack || error}`); }
  try { foreground?.release(); } catch (error) { report.cleanupErrors.push(`foreground: ${error.stack || error}`); }
  report.locks.released = !report.cleanupErrors.length && Boolean(foreground && releaseCheckout);
  if (report.cleanupErrors.length) { report.status = 'FAIL'; process.exitCode = 1; }
  report.finishedAt = new Date().toISOString();
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
  console.log(JSON.stringify({ status: report.status, report: path.relative(root, reportPath),
    steps: report.steps.map(s => ({ id: s.id, status: s.status, exitCode: s.exitCode })),
    pending: report.pending, cleanupErrors: report.cleanupErrors, locksReleased: report.locks.released }));
}
