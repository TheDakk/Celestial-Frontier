/* smokereport.mjs — CI-facing evidence wrapper for slicesmoke.mjs.

   The gameplay harness remains the authority and runs exactly once. This
   wrapper captures its complete output, writes a machine-readable report and
   a raw log even on failure, and prints only the first scoped diagnostic plus
   a related-count summary. It never retries a red run.

   Usage: node tools/smokereport.mjs */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { findChromiumBrowser } from './browserpath.mjs';
import { acquireWorkspaceLock, workspaceLockChildEnvironment } from './workspacelock.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const v2Root = path.resolve(here, '..');
const repoRoot = path.resolve(v2Root, '..', '..');
const outputRoot = path.join(v2Root, 'apps', 'game', 'smoke');
const reportPath = path.join(outputRoot, 'slice-smoke-report.json');
const logPath = path.join(outputRoot, 'slice-smoke.log');
const startedAt = new Date();

function sha256(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function git(args) {
  try {
    return execFileSync('git', args, {
      cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch { return null; }
}
function gitRaw(args) {
  try {
    return execFileSync('git', args, {
      cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch { return null; }
}
function sourceSnapshot() {
  const status = gitRaw(['status', '--porcelain=v1', '-z', '--untracked-files=all']) || '';
  const diff = gitRaw(['diff', '--binary', '--no-ext-diff', 'HEAD', '--']) || '';
  const untracked = (gitRaw(['ls-files', '--others', '--exclude-standard', '-z']) || '')
    .split('\0').filter(Boolean).sort();
  const digest = crypto.createHash('sha256');
  digest.update('tracked-diff\0').update(diff).update('\0untracked\0');
  const rootPrefix = repoRoot.endsWith(path.sep) ? repoRoot : repoRoot + path.sep;
  for (const relative of untracked) {
    const absolute = path.resolve(repoRoot, relative);
    if (!absolute.startsWith(rootPrefix)) throw new Error(`unsafe untracked source path: ${relative}`);
    const stat = fs.lstatSync(absolute);
    digest.update(relative).update('\0');
    if (stat.isSymbolicLink()) digest.update('symlink\0').update(fs.readlinkSync(absolute));
    else if (stat.isFile()) digest.update('file\0').update(fs.readFileSync(absolute));
    else throw new Error(`untracked source is not a file or symlink: ${relative}`);
    digest.update('\0');
  }
  return {
    dirty: status.length > 0,
    statusSha256: sha256(status),
    workingTreeSha256: digest.digest('hex'),
  };
}
function sourceIdentity() {
  const snapshot = sourceSnapshot();
  return {
    commit: process.env.GITHUB_SHA || git(['rev-parse', 'HEAD']),
    branch: process.env.GITHUB_HEAD_REF || process.env.GITHUB_REF_NAME
      || git(['branch', '--show-current']) || 'detached',
    state: snapshot.dirty ? 'dirty-diagnostic' : 'committed',
    statusSha256: snapshot.statusSha256,
    workingTreeSha256: snapshot.workingTreeSha256,
  };
}
function sameSource(left, right) {
  return left.commit === right.commit && left.branch === right.branch
    && left.statusSha256 === right.statusSha256
    && left.workingTreeSha256 === right.workingTreeSha256;
}
function commandVersion(executable) {
  try {
    return execFileSync(executable, ['--version'], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 10000,
    }).trim();
  } catch { return null; }
}
function scopeOf(message) {
  if (/^harness:|browser|CDP|timed out|timeout|\blisten\b|EPERM|EADDRINUSE/i.test(message)) return 'harness';
  const prefix = message.match(/^([A-Z][A-Z0-9 /_-]{1,48})(?::| —)/);
  if (prefix) return prefix[1].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (/CONTROL FAILED/i.test(message)) return 'instrument-control';
  return 'core-flow';
}
function parseFindings(stderr, status) {
  if (status === 0) return [];
  const lines = stderr.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  /* Only bullets owned by the harness's explicit failure block are product
     findings. Vite also prints generic `- Using dynamic import…` advice;
     treating those lines as the failure once hid a later `listen EPERM`. */
  const marker = lines.findIndex((line) => /^SLICE SMOKE: FAIL\b/.test(line));
  const bullets = marker >= 0
    ? lines.slice(marker + 1).filter((line) => /^- /.test(line)).map((line) => line.slice(2))
    : [];
  if (bullets.length) return bullets;
  const fatal = lines.find((line) => /^(?:Error|TypeError|ReferenceError|SyntaxError|RangeError):/.test(line));
  if (fatal) return [fatal];
  const useful = lines.find((line) => !/^(?:at |Node\.js |\[plugin |\(!\)|Some chunks|Using dynamic import|Use build\.|Adjust chunk)/i.test(line));
  return [useful || `slice smoke exited ${String(status)}`];
}
function groupFindings(findings) {
  const groups = new Map();
  for (const message of findings) {
    const scope = scopeOf(message);
    if (!groups.has(scope)) groups.set(scope, { scope, primary: message, related: [] });
    else groups.get(scope).related.push(message);
  }
  return [...groups.values()];
}
function screenshots(runId, directory = outputRoot) {
  if (!/^[a-z0-9][a-z0-9-]{0,95}$/i.test(runId)) throw new Error(`invalid screenshot run ID: ${JSON.stringify(runId)}`);
  if (!fs.existsSync(directory)) return [];
  const prefix = `slice-${runId}-`;
  return fs.readdirSync(directory).sort().flatMap((name) => {
    if (!name.startsWith(prefix) || path.extname(name).toLowerCase() !== '.png') return [];
    const bytes = fs.readFileSync(path.join(directory, name));
    return [{
      name,
      logicalName: name.slice(prefix.length, -4),
      path: `apps/game/smoke/${name}`,
      bytes: bytes.length,
      sha256: sha256(bytes),
    }];
  });
}

function runSelftest() {
  const injected = [
    'SLICE SMOKE: FAIL',
    '  - PHONE: primary rendered outcome',
    '  - PHONE: related rendered outcome',
    '  - harness: injected browser timeout',
  ].join('\n');
  const findings = parseFindings(injected, 1);
  if (findings.length !== 3) throw new Error(`SELFTEST finding extraction drifted: ${JSON.stringify(findings)}`);
  const groups = groupFindings(findings);
  if (groups.length !== 2 || groups[0].scope !== 'phone' || groups[0].related.length !== 1
    || groups[1].scope !== 'harness') {
    throw new Error(`SELFTEST scoped cascade grouping drifted: ${JSON.stringify(groups)}`);
  }
  if (parseFindings(injected, 0).length !== 0) throw new Error('SELFTEST passing status retained failure text');
  const infrastructure = [
    '- Using dynamic import() to code-split the application',
    'Error: listen EPERM: operation not permitted 127.0.0.1',
  ].join('\n');
  const infrastructureFindings = parseFindings(infrastructure, 1);
  if (infrastructureFindings.length !== 1 || !/listen EPERM/.test(infrastructureFindings[0])
    || scopeOf(infrastructureFindings[0]) !== 'harness') {
    throw new Error(`SELFTEST infrastructure failure was hidden by build advice: ${JSON.stringify(infrastructureFindings)}`);
  }
  const source = {
    commit: 'a'.repeat(40), branch: 'openai/test',
    statusSha256: 'b'.repeat(64), workingTreeSha256: 'c'.repeat(64),
  };
  if (!sameSource(source, { ...source })
    || sameSource(source, { ...source, workingTreeSha256: 'd'.repeat(64) })) {
    throw new Error('SELFTEST source-identity change control drifted');
  }
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-smoke-report-selftest-'));
  try {
    fs.writeFileSync(path.join(tempRoot, 'slice-stale-unrelated.png'), 'stale');
    fs.writeFileSync(path.join(tempRoot, 'slice-selftest-run-current.png'), 'current');
    const selected = screenshots('selftest-run', tempRoot);
    if (selected.length !== 1 || selected[0].name !== 'slice-selftest-run-current.png'
      || selected[0].sha256 !== sha256('current')) {
      throw new Error(`SELFTEST stale screenshot entered run evidence: ${JSON.stringify(selected)}`);
    }
  } finally {
    const tempPrefix = os.tmpdir().endsWith(path.sep) ? os.tmpdir() : os.tmpdir() + path.sep;
    if (!tempRoot.startsWith(tempPrefix)) throw new Error(`refusing unsafe selftest cleanup: ${tempRoot}`);
    fs.rmSync(tempRoot, { recursive: true });
  }
  console.log('SLICE SMOKE REPORT SELFTEST: PASS');
  console.log('  three injected findings retained; two PHONE findings grouped; harness separated');
  console.log('  source-identity change: mixed-source evidence rejected');
  console.log('  screenshot provenance: injected stale PNG excluded from the exact run manifest');
  console.log('  infrastructure fatal: retained ahead of generic bundler advice');
  console.log('  retry policy remains zero by construction (one child invocation in the wrapper)');
}

if (process.argv.length === 3 && process.argv[2] === '--selftest') {
  runSelftest();
  process.exit(0);
}
if (process.argv.length !== 2) {
  console.error('usage: node tools/smokereport.mjs [--selftest]');
  process.exit(2);
}

fs.mkdirSync(outputRoot, { recursive: true });
const runId = [
  startedAt.toISOString().replace(/[^0-9]/g, '').slice(0, 17),
  String(process.pid),
  crypto.randomBytes(6).toString('hex'),
].join('-');
const releaseWorkspaceLock = acquireWorkspaceLock('v2 structured slice smoke and evidence report');
let browserExecutable = null;
let browserResolutionError = null;
try { browserExecutable = findChromiumBrowser(); }
catch (error) { browserResolutionError = error.message; }

const runSource = sourceIdentity();
const run = spawnSync(process.execPath, [path.join(here, 'slicesmoke.mjs')], {
  cwd: v2Root,
  encoding: 'utf8',
  env: {
    ...workspaceLockChildEnvironment(releaseWorkspaceLock),
    CF_V2_SLICE_SMOKE_RUN_ID: runId,
  },
  maxBuffer: 32 * 1024 * 1024,
});
const stdout = run.stdout || '';
const stderr = run.stderr || '';
const combinedLog = [
  '# Celestial Frontier v2 slice smoke raw output',
  `# started ${startedAt.toISOString()}`,
  `# command ${process.execPath} tools/slicesmoke.mjs`,
  '',
  '[stdout]',
  stdout,
  '[stderr]',
  stderr,
].join('\n');
fs.writeFileSync(logPath, combinedLog);

const childStatus = Number.isInteger(run.status) ? run.status : 1;
let status = childStatus;
const findings = parseFindings(stderr, childStatus);
if (run.error) findings.unshift(`harness: slice-smoke child process failed (${run.error.message})`);
else if (run.signal) findings.unshift(`harness: slice-smoke child process ended on signal ${run.signal}`);
const endingSource = sourceIdentity();
const sourceChanged = !sameSource(runSource, endingSource);
if (sourceChanged) {
  status = 1;
  findings.unshift('harness: source identity changed during slice smoke; mixed-source evidence refused');
}
const groups = groupFindings(findings);
const endedAt = new Date();
const report = {
  schema: 'cf-v2-slice-smoke-ci/v1',
  status: status === 0 ? 'pass' : 'fail',
  exit: {
    code: status, childCode: run.status, signal: run.signal || null,
    spawnError: run.error?.message || null,
  },
  startedAt: startedAt.toISOString(),
  endedAt: endedAt.toISOString(),
  durationMs: endedAt.getTime() - startedAt.getTime(),
  run: {
    id: runId,
    screenshotPattern: `apps/game/smoke/slice-${runId}-*.png`,
    provenance: 'Only PNGs bearing this cryptographically unique child-run ID are attributed to this execution.',
  },
  source: runSource,
  sourceChange: { detected: sourceChanged, ending: sourceChanged ? endingSource : null },
  browser: {
    executable: browserExecutable,
    version: browserExecutable ? commandVersion(browserExecutable) : null,
    resolutionError: browserResolutionError,
  },
  retryPolicy: {
    automaticRetries: 0,
    reason: 'A red run remains red; diagnose the first scoped outcome rather than retrying it away.',
  },
  summary: { findingCount: findings.length, scopeCount: groups.length },
  groups,
  findings: findings.map((message, index) => ({ index, scope: scopeOf(message), message })),
  rawLog: {
    path: 'apps/game/smoke/slice-smoke.log',
    bytes: Buffer.byteLength(combinedLog),
    sha256: sha256(combinedLog),
  },
  screenshots: screenshots(runId),
};
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
releaseWorkspaceLock();

if (status === 0) {
  const summary = stdout.split(/\r?\n/).filter((line) => /^SLICE SMOKE: PASS/.test(line)).at(-1)
    || 'SLICE SMOKE: PASS';
  console.log(summary);
  console.log('structured evidence: apps/game/smoke/slice-smoke-report.json');
  process.exit(0);
}

console.error('SLICE SMOKE: FAIL — one execution, no automatic retry');
if (groups.length) {
  const first = groups[0];
  console.error(`  [${first.scope}] ${first.primary}`);
  const related = findings.length - 1;
  if (related) console.error(`  ${related} related finding${related === 1 ? '' : 's'} retained in structured evidence`);
}
console.error('  raw log: apps/game/smoke/slice-smoke.log');
console.error('  report: apps/game/smoke/slice-smoke-report.json');
process.exit(status);
