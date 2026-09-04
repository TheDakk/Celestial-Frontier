// Viewport-matrix LAYOUT gate (v1.5.2c, Nick's device-pass mandate).
// jsdom runs logic but performs NO layout — the ✕-bleed, z-order and
// training-overlap bugs were invisible to the whole battery by
// construction. This gate drives the REAL game in an owned Chromium-family
// browser over raw CDP across phone/tablet/desktop
// viewports and asserts the layout laws on every major surface:
//   ✕ CORNER LAW   — the close sits inside its card corner, tappable,
//                    never overlapping header text
//   Z-ORDER LAW    — probing an open panel's pixels hits the panel,
//                    never a chip/pill underneath
//   NO SIDE-SCROLL — the page body never scrolls horizontally
//   NO CLIPPED TEXT— headers don't truncate against their box
// Screenshots land in tools/uisheets/ as proof sheets per viewport.
// Runs ON TOP of the beta round, with the battery. Exit 1 on any FAIL.
//
// Usage: node tools/uilayout.js [--shots]
'use strict';
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const root = path.join(__dirname, '..');
const repoRoot = fs.realpathSync(root);
const _urlArg = process.argv.find((a) => a.startsWith('--url='));
const GAME = _urlArg ? _urlArg.slice(6) : 'file:///' + path.join(root, 'celestial-frontier.html').replace(/\\/g, '/');
const _vpArg = process.argv.find((a) => a.startsWith('--vp='));
const SHOTS = process.argv.includes('--shots');
const SHEET_DIR = path.join(__dirname, 'uisheets');
const REPORT_SCHEMA = 'celestial-frontier/uilayout-report@3';
const BASELINE_REPORT_PATH = path.join(root, 'port', 'baseline-v1.8.9', 'uilayout-report.json');
const REPORT_PATH = process.env.CF_UILAYOUT_REPORT
  ? path.resolve(process.env.CF_UILAYOUT_REPORT) : path.join(__dirname, 'uilayout-report.json');
const RUN_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const CHROMIUM_PRODUCT_PATTERN = /^(?:Chrome|Chromium|Edg|HeadlessChrome)\/[1-9]\d*(?:\.\d+){3}$/u;
const RUN_ID = process.env.CF_UILAYOUT_RUN_ID
  || `local-${Date.now()}-${process.pid}-${crypto.randomBytes(5).toString('hex')}`;
const REPORT_ARTIFACT_PATH = artifactPathFor(RUN_ID, REPORT_PATH);
const STARTED_AT_MS = Date.now();
const CERTIFYING_REQUEST = !_vpArg && !_urlArg;
const RUN_POLICY = Object.freeze({ attemptCount: 1, automaticRetries: 0 });
const ROOT_LAYOUT_CDP_COMMAND_TIMEOUT_MS = 30_000;
const ROOT_LAYOUT_CDP_SOCKET_TIMEOUT_MS = 15_000;
const ROOT_LAYOUT_CDP_STARTUP_TIMEOUT_MS = 45_000;
const ROOT_LAYOUT_CDP_SHUTDOWN_TIMEOUT_MS = 5_000;
let REPORT_BROWSER = null;
let REPORT_SOURCE_BEGIN = null;
let REPORT_SOURCE_END = null;
let REPORT_ARTIFACT_RESERVED = false;
let REPORT_POINTER_OWNED = false;
let REPORT_LIFECYCLE = { browserClosed: false, workspaceLockHeldThroughReportWrite: false };

const VIEWPORTS = [
  { id: 'iphone-se',   w: 375,  h: 667,  mobile: true,  dpr: 2 },
  { id: 'iphone',      w: 393,  h: 852,  mobile: true,  dpr: 3 },
  { id: 'iphone-max',  w: 430,  h: 932,  mobile: true,  dpr: 3 },
  { id: 'android',     w: 412,  h: 915,  mobile: true,  dpr: 2.6 },
  { id: 'ipad-port',   w: 768,  h: 1024, mobile: true,  dpr: 2 },
  /* ROUND 7 CF1802-02: the external harness found NO spotlight ring at all at
     744x1133 on training step 5, where every phone and desktop profile rendered
     one — a width neither of our gates covered. It sits just under the 900px
     dock breakpoint, so the dock layout applies but the tablet band's sheet
     widths do not: exactly the seam a bug hides in. */
  { id: 'ipad-mini',   w: 744,  h: 1133, mobile: true,  dpr: 2 },
  { id: 'ipad-land',   w: 1024, h: 768,  mobile: true,  dpr: 2 },
  { id: 'laptop',      w: 1366, h: 768,  mobile: false, dpr: 1 },
  { id: 'desktop',     w: 1920, h: 1080, mobile: false, dpr: 1 },
  { id: 'wide',        w: 2560, h: 1440, mobile: false, dpr: 1 },
];
// Each surface: open() drives the UI; panel = the element whose layout we judge.
const SURFACES = [
  { id: 'charters',  btn: 'chbtn',    panel: 'chpanel' },
  { id: 'compendium',btn: 'codexbtn', panel: 'codex' },
  { id: 'atlas',     btn: 'logbtn',   panel: 'log' },
  { id: 'records',   btn: 'recbtn',   panel: 'records' },
  { id: 'sheet',     btn: 'rank',     panel: 'sheetcard' },
  { id: 'shipyard',  btn: 'cargobtn', panel: 'yardcard' },
  { id: 'settings',  btn: 'setbtn',   panel: 'setpanel' },
  { id: 'tray',      btn: 'bell',     panel: 'tray' },
];

let send = null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function evalIn(sess, expr) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sess);
  if (r.exceptionDetails) throw new Error('page eval: ' + JSON.stringify(r.exceptionDetails.exception && r.exceptionDetails.exception.description || r.exceptionDetails.text).slice(0, 300));
  return r.result && r.result.value;
}

function atomicWriteJson(file, value) {
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true });
  const temp = path.join(dir, `.${path.basename(file)}.${process.pid}.${crypto.randomBytes(5).toString('hex')}.tmp`);
  try {
    fs.writeFileSync(temp, JSON.stringify(value, null, 1));
    fs.renameSync(temp, file);
  } finally {
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
  }
}

function atomicCreateFile(targetPath, bytes) {
  const dir = path.dirname(targetPath);
  fs.mkdirSync(dir, { recursive: true });
  const temporary = path.join(dir, `.${path.basename(targetPath)}.${process.pid}.${crypto.randomBytes(5).toString('hex')}.tmp`);
  try {
    fs.writeFileSync(temporary, bytes, { flag: 'wx' });
    fs.linkSync(temporary, targetPath);
  } finally {
    try { fs.unlinkSync(temporary); } catch { /* link/create failure cleanup */ }
  }
}

function atomicCreateJson(file, value) {
  atomicCreateFile(file, JSON.stringify(value, null, 1));
}

function artifactPathFor(runId, reportPath = REPORT_PATH) {
  if (typeof runId !== 'string' || !RUN_ID_PATTERN.test(runId)) {
    throw new Error(`layout report run id is invalid: ${JSON.stringify(runId)}`);
  }
  return path.join(path.dirname(reportPath), `uilayout-${runId}.json`);
}

function portablePath(file) {
  const absolute = path.resolve(file);
  const prefix = repoRoot.endsWith(path.sep) ? repoRoot : repoRoot + path.sep;
  return absolute.startsWith(prefix)
    ? path.relative(repoRoot, absolute).split(path.sep).join('/')
    : absolute.split(path.sep).join('/');
}

function portableAbsolutePath(file) {
  return path.resolve(file).split(path.sep).join('/');
}

function isNormalizedPortableAbsolutePath(file) {
  if (typeof file !== 'string' || file.length === 0 || file.includes('\\')) return false;
  const windowsDrivePath = /^[A-Za-z]:\//u.test(file);
  const pathApi = windowsDrivePath ? path.win32 : path.posix;
  const native = windowsDrivePath ? file.replace(/\//g, '\\') : file;
  return pathApi.isAbsolute(native)
    && pathApi.normalize(native).split(pathApi.sep).join('/') === file;
}

function sha256(bytes) { return crypto.createHash('sha256').update(bytes).digest('hex'); }

function git(args, { raw = false } = {}) {
  try {
    return execFileSync('git', args, {
      cwd: repoRoot, encoding: raw ? null : 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (error) {
    const detail = Buffer.isBuffer(error?.stderr)
      ? error.stderr.toString('utf8').trim() : String(error?.stderr || '').trim();
    throw new Error(`required git ${args.join(' ')} failed${detail ? `: ${detail}` : ''}`);
  }
}

function sourceBytes(value, label) {
  if (Buffer.isBuffer(value)) return value;
  if (typeof value === 'string') return Buffer.from(value);
  throw new Error(`required git ${label} returned non-byte output`);
}

function sourceSnapshot({ gitCommand = git, sourceRoot = repoRoot } = {}) {
  const status = sourceBytes(
    gitCommand(['status', '--porcelain=v1', '-z', '--untracked-files=all'], { raw: true }),
    'status',
  );
  const diff = sourceBytes(
    gitCommand(['diff', '--binary', '--no-ext-diff', 'HEAD', '--'], { raw: true }),
    'diff',
  );
  const untracked = sourceBytes(
    gitCommand(['ls-files', '--others', '--exclude-standard', '-z'], { raw: true }),
    'ls-files',
  ).toString('utf8').split('\0').filter(Boolean).sort();
  const digest = crypto.createHash('sha256');
  digest.update('tracked-diff\0').update(diff).update('\0untracked\0');
  const rootPrefix = sourceRoot.endsWith(path.sep) ? sourceRoot : sourceRoot + path.sep;
  for (const relative of untracked) {
    const absolute = path.resolve(sourceRoot, relative);
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

function sourceIdentity({
  gitCommand = git, environment = process.env, expectedRepoRoot = repoRoot,
} = {}) {
  const expectedRoot = fs.realpathSync(expectedRepoRoot);
  const observedRoot = fs.realpathSync(String(gitCommand(['rev-parse', '--show-toplevel'])).trim());
  if (observedRoot !== expectedRoot) {
    throw new Error(`git root mismatch: expected ${expectedRoot}, observed ${observedRoot}`);
  }
  const snapshot = sourceSnapshot({ gitCommand, sourceRoot: expectedRoot });
  const commit = String(gitCommand(['rev-parse', 'HEAD'])).trim();
  if (!/^[0-9a-f]{40}$/.test(commit)) {
    throw new Error(`git HEAD is not one full commit: ${JSON.stringify(commit)}`);
  }
  if (environment.GITHUB_SHA !== undefined && environment.GITHUB_SHA !== commit) {
    throw new Error(`GITHUB_SHA does not match git HEAD: expected ${commit}, observed ${environment.GITHUB_SHA}`);
  }
  const branchName = String(gitCommand(['rev-parse', '--abbrev-ref', 'HEAD'])).trim();
  if (!branchName) throw new Error('git branch identity is empty');
  return {
    commit,
    branch: branchName === 'HEAD' ? 'detached' : branchName,
    state: snapshot.dirty ? 'dirty-diagnostic' : 'committed',
    statusSha256: snapshot.statusSha256,
    workingTreeSha256: snapshot.workingTreeSha256,
  };
}

function sameSource(left, right) {
  return !!left && !!right && left.commit === right.commit && left.branch === right.branch
    && left.state === right.state && left.statusSha256 === right.statusSha256
    && left.workingTreeSha256 === right.workingTreeSha256;
}

function reportFor(status, {
  browser = null,
  results = [],
  failure = null,
  sourceBegin = REPORT_SOURCE_BEGIN,
  sourceEnd = REPORT_SOURCE_END,
  lifecycle = REPORT_LIFECYCLE,
  artifactPath = REPORT_ARTIFACT_PATH,
  certifyingRequest = CERTIFYING_REQUEST,
} = {}) {
  const completedAtMs = status === 'running' ? null : Date.now();
  const failed = results.filter((result) => result.ok === false).length;
  const requested = VIEWPORTS.filter((viewport) => !_vpArg
    || _vpArg.slice(5).split(',').includes(viewport.id));
  const completedViewports = new Set(results.filter((result) => result.vp !== 'instrument')
    .map((result) => result.vp)).size;
  const currentResults = status === 'running' || status === 'instrument-fail'
    ? [{ vp: 'instrument', surf: 'launcher', name: failure?.message || 'layout run is incomplete', ok: false,
      detail: failure?.detail || `run ${RUN_ID} has no terminal product verdict` }]
    : results;
  const terminalCleanupComplete = status !== 'running'
    && lifecycle?.browserClosed === true && lifecycle?.workspaceLockHeldThroughReportWrite === true;
  const certifying = !!certifyingRequest && terminalCleanupComplete
    && sourceBegin?.state === 'committed' && sourceEnd?.state === 'committed'
    && sameSource(sourceBegin, sourceEnd);
  return {
    schema: REPORT_SCHEMA,
    status,
    run: {
      id: RUN_ID,
      startedAt: new Date(STARTED_AT_MS).toISOString(),
      completedAt: completedAtMs === null ? null : new Date(completedAtMs).toISOString(),
      durationMs: completedAtMs === null ? null : completedAtMs - STARTED_AT_MS,
      artifactPath: portablePath(artifactPath),
    },
    scope: certifyingRequest ? 'full-certifying' : 'targeted-diagnostic',
    certifying,
    target: { url: GAME, viewportIds: requested.map((viewport) => viewport.id), shots: SHOTS },
    policy: { ...RUN_POLICY },
    source: { begin: sourceBegin, end: sourceEnd },
    lifecycle: { ...lifecycle },
    browser,
    summary: {
      checks: currentResults.length,
      passed: currentResults.filter((result) => result.ok === true).length,
      failed: status === 'running' || status === 'instrument-fail' ? 1 : failed,
      completedViewports,
      requestedViewports: requested.length,
    },
    failure,
    results: currentResults,
  };
}

function reserveReport(options) {
  const running = reportFor('running', options);
  atomicCreateJson(REPORT_ARTIFACT_PATH, running);
  REPORT_ARTIFACT_RESERVED = true;
  REPORT_POINTER_OWNED = true;
  atomicWriteJson(REPORT_PATH, running);
  return running;
}

function writeTerminalReport(status, options) {
  if (!REPORT_ARTIFACT_RESERVED) throw new Error('layout immutable run artifact was not reserved');
  const terminal = reportFor(status, options);
  atomicWriteJson(REPORT_ARTIFACT_PATH, terminal);
  atomicWriteJson(REPORT_PATH, terminal);
  return terminal;
}

function acquireRootLayoutWorkspaceLock(acquireLock) {
  if (typeof acquireLock !== 'function') throw new Error('root UI layout workspace-lock owner is invalid');
  return acquireLock('root UI layout build and browser gate');
}

function openRootLayoutCdp(openCdp) {
  if (typeof openCdp !== 'function') throw new Error('root UI layout CDP opener is invalid');
  return openCdp({
    label: 'root UI layout gate',
    userDataPrefix: 'cf-uilayout',
    commandTimeoutMs: ROOT_LAYOUT_CDP_COMMAND_TIMEOUT_MS,
    webSocketOpenTimeoutMs: ROOT_LAYOUT_CDP_SOCKET_TIMEOUT_MS,
    startupTimeoutMs: ROOT_LAYOUT_CDP_STARTUP_TIMEOUT_MS,
    shutdownTimeoutMs: ROOT_LAYOUT_CDP_SHUTDOWN_TIMEOUT_MS,
  });
}

function resultKey(result) { return `${result.vp}\u0000${result.surf}\u0000${result.name}`; }

function expectedFullResultKeys() {
  const baseline = JSON.parse(fs.readFileSync(BASELINE_REPORT_PATH, 'utf8'));
  if (!Array.isArray(baseline.results) || baseline.results.length === 0) {
    throw new Error('sealed layout baseline has no result inventory');
  }
  const keys = baseline.results.map(resultKey);
  if (new Set(keys).size !== keys.length) {
    throw new Error('sealed layout baseline result inventory contains duplicate keys');
  }
  return keys.sort();
}

function assertPassCoverage(report) {
  const expectedViewportIds = VIEWPORTS.map((viewport) => viewport.id);
  if (JSON.stringify(report.target.viewportIds) !== JSON.stringify(expectedViewportIds)) {
    throw new Error(`certifying layout PASS viewport inventory drifted: ${JSON.stringify(report.target.viewportIds)}`);
  }
  const actual = report.results.map(resultKey).sort();
  const expected = expectedFullResultKeys();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index])) {
    const actualSet = new Set(actual);
    const expectedSet = new Set(expected);
    const missing = expected.filter((key) => !actualSet.has(key)).slice(0, 3);
    const extra = actual.filter((key) => !expectedSet.has(key)).slice(0, 3);
    throw new Error(`layout PASS result inventory drifted: ${actual.length}/${expected.length}`
      + `${missing.length ? `; missing ${missing.join(' · ')}` : ''}`
      + `${extra.length ? `; extra ${extra.join(' · ')}` : ''}`);
  }
}

function finalizeInstrumentFailure(error, {
  file = null, setExitCode = true, print = true, reportOptions = {},
} = {}) {
  const detail = error.stack || error.message;
  const failed = reportFor('instrument-fail', {
    browser: REPORT_BROWSER,
    failure: { message: error.message, detail, exitCode: 2 },
    ...reportOptions,
  });
  try {
    if (file) atomicWriteJson(file, failed);
    else if (REPORT_ARTIFACT_RESERVED) {
      atomicWriteJson(REPORT_ARTIFACT_PATH, failed);
      if (REPORT_POINTER_OWNED) atomicWriteJson(REPORT_PATH, failed);
    }
  }
  catch (reportError) { if (print) console.error(`layout report write failed: ${reportError.message}`); }
  if (print) console.error(detail);
  if (setExitCode) process.exitCode = 2;
  return failed;
}

function exactObjectFields(value, fields) {
  return !!value && typeof value === 'object' && !Array.isArray(value)
    && JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...fields].sort());
}

function sourceEvidenceComplete(source) {
  const fields = ['branch', 'commit', 'state', 'statusSha256', 'workingTreeSha256'];
  return exactObjectFields(source, fields)
    && /^[0-9a-f]{40}$/.test(source.commit)
    && typeof source.branch === 'string' && source.branch.length > 0
    && ['committed', 'dirty-diagnostic'].includes(source.state)
    && /^[0-9a-f]{64}$/.test(source.statusSha256)
    && /^[0-9a-f]{64}$/.test(source.workingTreeSha256);
}

function readRegularFile(file, label) {
  const stat = fs.lstatSync(file);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`${label} is not a regular non-symlink file`);
  return fs.readFileSync(file);
}

function verifyReport(file, expectedRunId, {
  expectedSource = null,
  expectedArtifactPath = file,
  requireCertifying = false,
} = {}) {
  if (typeof expectedRunId !== 'string' || !RUN_ID_PATTERN.test(expectedRunId)) {
    throw new Error(`layout report expected run id is invalid: ${JSON.stringify(expectedRunId)}`);
  }
  const report = JSON.parse(readRegularFile(file, 'layout report').toString('utf8'));
  if (report.schema !== REPORT_SCHEMA) throw new Error(`layout report schema drifted: ${String(report.schema)}`);
  if (report.run?.id !== expectedRunId) throw new Error(`layout report run id mismatch: ${String(report.run?.id)}`);
  if (report.run?.artifactPath !== portablePath(expectedArtifactPath)) {
    throw new Error(`layout report immutable artifact binding drifted: ${String(report.run?.artifactPath)}`);
  }
  if (!['pass', 'fail', 'instrument-fail'].includes(report.status)) {
    throw new Error(`layout report is not terminal: ${String(report.status)}`);
  }
  const validDate = (value) => typeof value === 'string' && Number.isFinite(Date.parse(value));
  if (!validDate(report.run?.startedAt) || !validDate(report.run?.completedAt)
    || !Number.isInteger(report.run?.durationMs) || report.run.durationMs < 0) {
    throw new Error('layout report has incomplete run timing');
  }
  if (!exactObjectFields(report.policy, ['attemptCount', 'automaticRetries'])
    || report.policy.attemptCount !== 1 || report.policy.automaticRetries !== 0) {
    throw new Error('layout report one-attempt/no-retry policy drifted');
  }
  if (!exactObjectFields(report.lifecycle, ['browserClosed', 'workspaceLockHeldThroughReportWrite'])
    || report.lifecycle.browserClosed !== true
    || report.lifecycle.workspaceLockHeldThroughReportWrite !== true) {
    throw new Error('layout report terminal cleanup/workspace-lock lifecycle is incomplete');
  }
  if (!exactObjectFields(report.source, ['begin', 'end'])
    || !sourceEvidenceComplete(report.source.begin) || !sourceEvidenceComplete(report.source.end)) {
    throw new Error('layout report source provenance is incomplete');
  }
  if (!sameSource(report.source.begin, report.source.end)) {
    throw new Error('layout report mixed source identities during the run');
  }
  if (expectedSource && (!sameSource(report.source.begin, expectedSource)
    || !sameSource(report.source.end, expectedSource))) {
    throw new Error('layout report source does not match the current checkout');
  }
  if (!['full-certifying', 'targeted-diagnostic'].includes(report.scope)
    || typeof report.certifying !== 'boolean') {
    throw new Error('layout report certification scope is malformed');
  }
  const knownViewportIds = new Set(VIEWPORTS.map((viewport) => viewport.id));
  const targetIds = report.target?.viewportIds;
  if (typeof report.target?.url !== 'string' || !report.target.url
    || typeof report.target?.shots !== 'boolean'
    || !Array.isArray(targetIds) || targetIds.length === 0
    || new Set(targetIds).size !== targetIds.length
    || targetIds.some((id) => !knownViewportIds.has(id))) {
    throw new Error('layout report has an invalid target viewport inventory');
  }
  if (!Array.isArray(report.results) || report.results.length === 0
    || report.results.some((result) => typeof result?.vp !== 'string'
      || typeof result?.surf !== 'string' || typeof result?.name !== 'string'
      || typeof result?.ok !== 'boolean' || typeof result?.detail !== 'string')) {
    throw new Error('layout report has malformed or empty results');
  }
  const passed = report.results.filter((result) => result.ok).length;
  const failed = report.results.length - passed;
  const completedIds = new Set(report.results
    .filter((result) => result.vp !== 'instrument').map((result) => result.vp));
  const summary = report.summary;
  if (!summary || summary.checks !== report.results.length || summary.passed !== passed
    || summary.failed !== failed || summary.completedViewports !== completedIds.size
    || summary.requestedViewports !== targetIds.length
    || [...completedIds].some((id) => !targetIds.includes(id))) {
    throw new Error('layout report summary/count provenance is inconsistent');
  }
  const completeBrowser = report.browser && Number.isInteger(report.browser.pid) && report.browser.pid > 0
    && ['executable', 'product', 'revision', 'user_agent', 'js_version', 'protocol_version']
      .every((key) => typeof report.browser[key] === 'string' && report.browser[key].length > 0)
    && isNormalizedPortableAbsolutePath(report.browser.executable)
    && CHROMIUM_PRODUCT_PATTERN.test(report.browser.product)
    && report.browser.protocol_version === '1.3';
  const expectedViewportIds = VIEWPORTS.map((viewport) => viewport.id);
  const certifyingEvidence = report.scope === 'full-certifying'
    && report.source.begin.state === 'committed' && report.source.end.state === 'committed'
    && report.target.url === 'file:///' + path.join(root, 'celestial-frontier.html').replace(/\\/g, '/')
    && JSON.stringify(targetIds) === JSON.stringify(expectedViewportIds);
  if (report.certifying !== certifyingEvidence) {
    throw new Error('layout report certification declaration is inconsistent with target/source provenance');
  }
  if (requireCertifying && !report.certifying) {
    throw new Error('named layout verification requires the exact clean committed 10-viewport certifying run');
  }
  if (report.status === 'pass') {
    if (report.failure !== null || !completeBrowser || failed !== 0
      || completedIds.size !== targetIds.length || targetIds.some((id) => !completedIds.has(id))) {
      throw new Error('layout PASS report is incomplete or contains a failing outcome');
    }
    if (report.scope === 'full-certifying' || requireCertifying) assertPassCoverage(report);
  } else if (failed === 0) {
    throw new Error('layout red report lacks a failing outcome');
  } else if (report.status === 'fail' && !completeBrowser) {
    throw new Error('layout product-fail report lacks launched-browser provenance');
  }
  return report;
}

function verifyNamedRun(expectedRunId, {
  reportPath = REPORT_PATH,
  expectedSource = sourceIdentity(),
} = {}) {
  const immutablePath = artifactPathFor(expectedRunId, reportPath);
  const report = verifyReport(immutablePath, expectedRunId, {
    expectedSource,
    expectedArtifactPath: immutablePath,
    requireCertifying: true,
  });
  const immutableBytes = readRegularFile(immutablePath, 'immutable layout run artifact');
  const pointerBytes = readRegularFile(reportPath, 'current layout report pointer');
  if (!immutableBytes.equals(pointerBytes)) {
    throw new Error('current layout report pointer is stale or differs from the selected immutable run artifact');
  }
  verifyReport(reportPath, expectedRunId, {
    expectedSource,
    expectedArtifactPath: immutablePath,
    requireCertifying: true,
  });
  return report;
}

async function main() {
  let releaseWorkspaceLock = null;
  let browser = null;
  let primaryError = null;
  const cleanupErrors = [];
  const results = [];
  try {
    const { acquireWorkspaceLock } = await import('../port/v2/tools/workspacelock.mjs');
    releaseWorkspaceLock = acquireRootLayoutWorkspaceLock(acquireWorkspaceLock);
    REPORT_SOURCE_BEGIN = sourceIdentity();
    reserveReport({
      failure: { message: 'layout run has not completed', detail: `run ${RUN_ID}` },
    });
    if (SHOTS && !fs.existsSync(SHEET_DIR)) fs.mkdirSync(SHEET_DIR);
    const { openChromiumCdp } = await import('../port/v2/tools/browsercdp.mjs');
    /* This gate is the battery's FIRST real browser launch, so it pays the
       whole Linux runner cold start. Run 31758515194 first proved that the
       prior 24-second bound could expire before DevToolsActivePort. Run
       32375329693 job 96445227534 then reached the same pre-endpoint phase at
       the caller's 30-second bound. Keep the accepted process allowance local:
       one 45-second absolute startup envelope with a 15-second socket phase
       cap inside it. Generic launcher, command, product, and shutdown bounds
       remain unchanged; there is no warmup, relaunch, fallback, or retry. */
    browser = await openRootLayoutCdp(openChromiumCdp);
    REPORT_BROWSER = { ...browser.browser, pid: browser.pid };
    send = browser.send;

  const check = (vp, surf, name, ok, detail) => {
    results.push({ vp: vp.id, surf, name, ok, detail: detail || '' });
    if (!ok) console.log('FAIL  [' + vp.id + '] ' + surf + ' — ' + name + (detail ? '  (' + detail + ')' : ''));
  };

  for (const vp of VIEWPORTS.filter((v) => !_vpArg || _vpArg.slice(5).split(',').includes(v.id))) {
    const t = await send('Target.createTarget', { url: 'about:blank' });
    const at = await send('Target.attachToTarget', { targetId: t.targetId, flatten: true });
    const sess = at.sessionId;
    await send('Runtime.enable', {}, sess);
    await send('Page.enable', {}, sess);
    await send('Emulation.setDeviceMetricsOverride', { width: vp.w, height: vp.h, deviceScaleFactor: vp.dpr, mobile: vp.mobile }, sess);
    if (vp.mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }, sess);
    // every viewport gets a FRESH expedition: clear storage BEFORE the game
    // script ever runs (a post-boot clear races the live game's save flush,
    // which resurrects the old expedition for the next viewport)
    await send('Page.addScriptToEvaluateOnNewDocument', { source: 'try{localStorage.clear()}catch(_){}' }, sess);
    await send('Page.navigate', { url: GAME }, sess);
    await sleep(2500);
    const coarse = await evalIn(sess, `matchMedia('(pointer:coarse)').matches`);
    if (vp.mobile) check(vp, 'boot', 'coarse-pointer emulation active', !!coarse, 'pnx touch sizing rules ' + (coarse ? 'apply' : 'DO NOT apply'));
    const booted = await evalIn(sess, `(async()=>{
      const click=(el)=>{ if(!el) return false; for(const t of ['pointerdown','pointerup','click']) el.dispatchEvent(new MouseEvent(t,{bubbles:true,cancelable:true,view:window})); return true; };
      const vis=(el)=>el&&el.style.display!=='none'&&el.offsetParent!==null||el&&getComputedStyle(el).display!=='none';
      const until=async(f,ms)=>{ const t0=Date.now(); while(Date.now()-t0<ms){ try{ if(f()) return true; }catch(_){} await new Promise(r=>setTimeout(r,120)); } return false; };
      /* the FRESH-EXPEDITION sequence: name → bulletin → training. Handle
         each gate as it appears, in order, with patience for cold boots. */
      if(await until(()=>vis(document.getElementById('namebox')),12000)){
        const inp=document.getElementById('namein');
        if(inp){ inp.value='Layout Gate'; inp.dispatchEvent(new Event('input',{bubbles:true})); }
        await new Promise(r=>setTimeout(r,150));
        click(document.getElementById('nameok'));
        await until(()=>!vis(document.getElementById('namebox')),4000);
      }
      for(let a=0;a<4 && !vis(document.getElementById('tutbox'));a++){
        if(document.getElementById('relok')) click(document.getElementById('relok'));
        await until(()=>vis(document.getElementById('tutbox')),5000);
      }
      if(!vis(document.getElementById('tutbox'))) return false;   /* training never began — a half-boot is a FAIL, not a pass */
      click(document.getElementById('tut-skip'));
      await until(()=>document.getElementById('tut-skip-yes'),3000);
      click(document.getElementById('tut-skip-yes'));
      await until(()=>!vis(document.getElementById('tutbox')),5000);
      /* POSITIVE completion proof — the save itself must say training is
         done; absence of the tutbox alone proved nothing (the half-boot
         lesson: two viewports passed vacuously and every law after lied).
         The save is debounced — wait for the flush before judging. */
      const saved=await until(()=>/"tut":(true|1)/.test(localStorage.getItem('cfcc_save_v2')||''),8000);
      const sv=localStorage.getItem('cfcc_save_v2')||'';
      return { ok: !vis(document.getElementById('tutbox')) && !vis(document.getElementById('namebox')) && saved,
        tb: vis(document.getElementById('tutbox')), nb: vis(document.getElementById('namebox')), saved, svLen: sv.length,
        tutAt: sv.indexOf('tut'), tutCtx: sv.indexOf('tut')>=0 ? sv.slice(Math.max(0,sv.indexOf('tut')-12), sv.indexOf('tut')+28) : '(no tut key at all)' };
    })()`);
    check(vp, 'boot', 'boots and training skips', !!(booted && booted.ok), booted && !booted.ok ? JSON.stringify(booted) : '');
    if (!booted || !booted.ok) {
      try {
        if (!fs.existsSync(SHEET_DIR)) fs.mkdirSync(SHEET_DIR);
        const shot = await send('Page.captureScreenshot', { format: 'png' }, sess);
        fs.writeFileSync(path.join(SHEET_DIR, 'BOOT-FAIL-' + vp.id + '.png'), Buffer.from(shot.data, 'base64'));
      } catch (_) {}
      await send('Target.closeTarget', { targetId: t.targetId }); continue;
    }

    /* THE OVERLAY-EATER HUNT (Nick's field report: Charters dead + a stuck
       HP tooltip): every rail button's own pixels must belong to it —
       probed cold, then after the bell tray opens/closes, then after the
       search box is used and left. An invisible right-anchored layer
       (tray, searchres) that eats clicks fails here by name. */
    for (const phase of ['cold', 'after-tray', 'after-search']) {
      const rh = await evalIn(sess, `(async()=>{
        const click=(el)=>{ if(!el) return false; for(const t of ['pointerdown','pointerup','click']) el.dispatchEvent(new MouseEvent(t,{bubbles:true,cancelable:true,view:window})); return true; };
        const S=(ms)=>new Promise(r=>setTimeout(r,ms));
        if(${JSON.stringify(phase)}==='after-tray'){ click(document.getElementById('bell')); await S(250); click(document.getElementById('bell')); await S(250); }
        if(${JSON.stringify(phase)}==='after-search'){
          const si=document.getElementById('search')||document.querySelector('#searchwrap input');
          if(si){ si.focus(); si.value='xy'; si.dispatchEvent(new Event('input',{bubbles:true})); await S(300);
                  si.value=''; si.dispatchEvent(new Event('input',{bubbles:true}));
                  si.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})); si.blur(); await S(300); }
        }
        const out={};
        for(const id of ['chbtn','codexbtn','logbtn','recbtn','bell','cargobtn']){
          const b=document.getElementById(id);
          if(!b || getComputedStyle(b).display==='none'){ out[id]='(hidden)'; continue; }
          const r=b.getBoundingClientRect(), hit=document.elementFromPoint((r.left+r.right)/2,(r.top+r.bottom)/2);
          out[id]=(hit&&(hit===b||b.contains(hit)||hit.contains(b)))?'ok':((hit&&(hit.id||hit.className||hit.tagName))||'null')+'';
        }
        return out;
      })()`);
      for (const id in rh) {
        if (rh[id] !== 'ok' && rh[id] !== '(hidden)') check(vp, 'rail-' + phase, id + ' pixels belong to it', false, 'eaten by ' + rh[id]);
      }
      check(vp, 'rail-' + phase, 'rail buttons all reachable', Object.values(rh).every((v) => v === 'ok' || v === '(hidden)'));
    // ===== v1.7.20 (round-5 law): ASSERT THE MEASURED OUTCOME OF A CSS FIX =====
    // Five rounds, five fixes that were correct code in a place it could not run.
    // Two were stylesheet-placement failures that no assertion covered. These
    // read the COMPUTED box in a real browser, so a dead rule can never pass.
    if (phase === 'cold') {
      const tt = await evalIn(sess, `(()=>{
        const out={coarse:matchMedia('(pointer:coarse)').matches, w:innerWidth};
        for(const id of ['bell','setbtn','helpbtn','recbtn','hpheart']){
          const e=document.getElementById(id);
          if(!e){ out[id]=null; continue; }
          const r=e.getBoundingClientRect(); out[id]=[Math.round(r.width),Math.round(r.height)];
        }
        const ni=document.getElementById('namein'), si=document.getElementById('searchin');
        out.namein=ni?getComputedStyle(ni).fontSize:null;
        out.searchin=si?getComputedStyle(si).fontSize:null;
        return out;
      })()`);
      if (tt && tt.coarse && tt.w >= 901) {
        for (const id of ['bell', 'setbtn', 'helpbtn', 'recbtn', 'hpheart']) {
          const box = tt[id];
          if (!box) continue;
          check(vp, 'touch', id + ' measures 44x44 on a coarse pointer',
            box[0] >= 44 && box[1] >= 44, box.join('x'));
        }
        /* CF1720-03's general form (their words): when a fix changes a SIZE,
           assert that nothing ELSE changed size. A 44px hit area must not be
           bought with permanent viewport — the v1.7.20 box cost ~26px of topbar
           on every device (88→115 on an iPhone). */
        const th = await evalIn(sess, `(()=>{ const t=document.getElementById('topbar'); return t?Math.round(t.getBoundingClientRect().height):null; })()`);
        check(vp, 'touch', 'the 44px hit areas cost NO extra topbar height', th !== null && th <= 112, 'topbar ' + th + 'px');
        check(vp, 'touch', 'name + search inputs hold the 16px iOS floor',
          parseFloat(tt.namein) >= 16 && parseFloat(tt.searchin) >= 16, tt.namein + ' / ' + tt.searchin);
      } else if (tt && tt.hpheart) {
        check(vp, 'touch', 'heal control measures 44x44 everywhere',
          tt.hpheart[0] >= 44 && tt.hpheart[1] >= 44, tt.hpheart.join('x'));
      }
    }
    }
    for (const s of SURFACES) {
      const r = await evalIn(sess, `(async()=>{
        const click=(el)=>{ if(!el) return false; for(const t of ['pointerdown','pointerup','click']) el.dispatchEvent(new MouseEvent(t,{bubbles:true,cancelable:true,view:window})); return true; };
        const until=async(f,ms)=>{ const t0=Date.now(); while(Date.now()-t0<ms){ try{ if(f()) return true; }catch(_){} await new Promise(r=>setTimeout(r,120)); } return false; };
        const R=(el)=>{ const b=el.getBoundingClientRect(); return {l:b.left,t:b.top,r:b.right,b:b.bottom,w:b.width,h:b.height}; };
        const sect=(a,b)=>Math.max(0,Math.min(a.r,b.r)-Math.max(a.l,b.l))*Math.max(0,Math.min(a.b,b.b)-Math.max(a.t,b.t));
        const out={open:false, xIn:null, xOverText:null, xHit:null, zTop:null, sideScroll:null, clipped:[]};
        const btn=document.getElementById(${JSON.stringify(s.btn)});
        if(!btn) return out;
        click(btn);
        const panel=()=>document.getElementById(${JSON.stringify(s.panel)});
        out.open=await until(()=>{ const p=panel(); return p&&getComputedStyle(p).display!=='none'&&p.getBoundingClientRect().width>10; },4000);
        if(!out.open) return out;
        await new Promise(r=>setTimeout(r,220));   /* let layout settle before measuring */
        const p=panel(), pr=R(p);
        /* ✕ corner law */
        const x=p.querySelector('[data-pnx]')||p.querySelector('.vxc')||(p.closest('div')&&p.parentElement.querySelector('[data-pnx]'));
        if(x){
          const xr=R(x);
          out.xr=xr; out.pr=pr; out.xTag=(x.className||'')+'#'+(x.dataset&&x.dataset.pnx||'');
          /* the LAW is upper-right WITH AIR — not merely "inside": a ✕
             auto-placed into a grid's bottom row passed the old check
             (Nick's sheet screenshot). Corner region = top 70px, right 70px. */
          out.xIn = xr.l>=pr.l-2 && xr.r<=pr.r+2 && xr.t>=pr.t-2 && xr.t<=pr.t+70 && xr.r>=pr.r-70;
          out.xOverText=0;
          /* measure GLYPHS, not boxes: floated ✕ makes text wrap around it,
             so a header's border-box may intersect while its text is clear —
             range client-rects follow the actual rendered lines */
          for(const h of p.querySelectorAll('.ehead,.chead,.shead,h3,.tt,.gh,.vh')){
            if(h.contains(x)||x.contains(h)) continue;
            try{
              const rg=document.createRange(); rg.selectNodeContents(h);
              for(const cr of rg.getClientRects()){
                if(cr.width<2) continue;
                if(sect(xr,{l:cr.left,t:cr.top,r:cr.right,b:cr.bottom})>30){ out.xOverText+=1; break; }
              }
            }catch(_){ }
          }
          try{ x.scrollIntoView({block:'nearest'}); }catch(_){ }
          const xr2=R(x), cx=(xr2.l+xr2.r)/2, cy=(xr2.t+xr2.b)/2;
          const hit=document.elementFromPoint(cx,cy);
          out.xHit = !!(hit && (hit===x||x.contains(hit)||hit.contains(x)));
          if(!out.xHit) out.xHitBy=(hit?(hit.id||hit.className||hit.tagName):'null@'+Math.round(cx)+','+Math.round(cy))+'';
        }
        /* z-order law: the open panel's top corners belong to the panel */
        out.zTop=true;
        /* sample the top corners AND the left/right edge columns — chips
           overlap panel EDGES rows below the top (Nick's screenshot) */
        const zpts=[[pr.l+6,pr.t+6],[pr.r-6,pr.t+6],[(pr.l+pr.r)/2,pr.t+4]];
        for(const dy of [40,80,130,190]){ if(pr.t+dy<pr.b-6){ zpts.push([pr.l+6,pr.t+dy],[pr.r-6,pr.t+dy]); } }
        for(const pt of zpts){
          if(pt[0]<0||pt[1]<0||pt[0]>innerWidth||pt[1]>innerHeight) continue;
          const e=document.elementFromPoint(pt[0],pt[1]);
          if(e && !p.contains(e) && !e.contains(p)){ out.zTop=false; out.zHit=(e.id||e.className||e.tagName)+''; break; }
        }
        /* no sideways scroll */
        out.sideScroll=(document.scrollingElement.scrollWidth>innerWidth+2);
        /* clipped headers */
        for(const h of p.querySelectorAll('.ehead,.chead,.shead,h3')){
          if(h.scrollWidth>h.clientWidth+3) out.clipped.push((h.textContent||'').slice(0,30));
        }
        click(btn);   /* fold it back */
        return out;
      })()`);
      if (!r || !r.open) { check(vp, s.id, 'opens', false, 'panel never became visible'); continue; }
      check(vp, s.id, 'opens', true);
      if (r.xIn !== null) {
        check(vp, s.id, '✕ sits inside the corner', !!r.xIn, r.xIn ? '' : 'x=' + JSON.stringify(r.xr) + ' panel=' + JSON.stringify(r.pr) + ' ' + r.xTag);
        check(vp, s.id, '✕ clear of header text', r.xOverText === 0, r.xOverText ? r.xOverText + ' header(s) under it' : '');
        check(vp, s.id, '✕ is hittable (top of stack)', !!r.xHit, r.xHit ? '' : 'hit by ' + (r.xHitBy || '?'));
      }
      check(vp, s.id, 'panel is top of stack (z-order law)', !!r.zTop, r.zHit ? 'covered by ' + r.zHit : '');
      check(vp, s.id, 'no horizontal page scroll', !r.sideScroll);
      check(vp, s.id, 'no clipped headers', r.clipped.length === 0, r.clipped.join('|'));
      if (SHOTS) {
        try {
          await evalIn(sess, `(()=>{ const b=document.getElementById(${JSON.stringify(s.btn)}); for(const t of ['pointerdown','pointerup','click']) b.dispatchEvent(new MouseEvent(t,{bubbles:true,cancelable:true,view:window})); })()`);
          await sleep(250);
          const shot = await send('Page.captureScreenshot', { format: 'png' }, sess);
          fs.writeFileSync(path.join(SHEET_DIR, vp.id + '-' + s.id + '.png'), Buffer.from(shot.data, 'base64'));
          await evalIn(sess, `(()=>{ const b=document.getElementById(${JSON.stringify(s.btn)}); for(const t of ['pointerdown','pointerup','click']) b.dispatchEvent(new MouseEvent(t,{bubbles:true,cancelable:true,view:window})); })()`);
        } catch (_) {}
      }
    }
    /* ---- the training stack: is the lesson's target actually REACHABLE? ---- */
    const stack = await evalIn(sess, `(()=>{
      const out={};
      const panel=document.getElementById('panel'), log=document.getElementById('log'),
            codex=document.getElementById('codex'), logbtn=document.getElementById('logbtn'),
            cdxbtn=document.getElementById('codexbtn');
      /* stand the page up the way the lesson does: training on, Earth's survey
         card open. Content is representative so the card has real height. */
      document.body.classList.add('training');
      /* the lesson card is what publishes --tut-bot/--tut-cap (see _tutSpot):
         without it every surface below lays out against a 150px fallback and
         the geometry under test is fiction */
      const tb=document.getElementById('tutbox');
      tb.innerHTML='<div class="tt"><span>Field Training</span><span>5 / 21</span></div>'+
        '<div class="tx">Earth is charted. Open the <b>Star Atlas</b> from the dock.</div>'+
        '<div class="tbtns"><button type="button">Skip training</button></div>';
      tb.style.display='block';
      const _cr=tb.getBoundingClientRect();
      document.documentElement.style.setProperty('--tut-bot', Math.round(_cr.bottom+10)+'px');
      document.documentElement.style.setProperty('--tut-cap', Math.max(140, Math.round(innerHeight-_cr.bottom-24))+'px');
      panel.style.left='16px';   /* where placePanel parks it (surface mode / clamped min) */
      panel.innerHTML='<div class="head">Earth</div>'+'<div style="padding:14px">'+'row<br>'.repeat(40)+'</div>';
      panel.style.display='block';
      const mid=(r)=>[Math.round((r.left+r.right)/2), Math.round((r.top+r.bottom)/2)];
      const hit=(el)=>{ const r=el.getBoundingClientRect();
        if(r.width<1||r.height<1) return {ok:false, why:'zero-size'};
        const p=mid(r);
        if(p[0]<0||p[1]<0||p[0]>innerWidth||p[1]>innerHeight) return {ok:false, why:'offscreen'};
        const e=document.elementFromPoint(p[0],p[1]);
        return {ok: !!(e && (el===e || el.contains(e) || e.contains(el))),
                by: e?((e.id||e.className||e.tagName)+''):'(nothing)'};
      };
      /* ROUND 8 CF1805-01: a CENTRE-POINT hit says the board won the stack. It
         cannot say whether the board ate the LESSON CARD, which is what actually
         stranded the player. Sample a 63-point grid the way the external round
         did, so our number is directly comparable to theirs. */
      const reach=(el)=>{ const r=el.getBoundingClientRect();
        if(r.width<1||r.height<1) return {pct:0, by:'zero-size'};
        let ok=0, tot=0; const by={};
        for(let i=1;i<=9;i++) for(let j=1;j<=7;j++){
          const x=Math.round(r.left+r.width*i/10), y=Math.round(r.top+r.height*j/8);
          if(x<0||y<0||x>innerWidth||y>innerHeight) continue;
          tot++;
          const e=document.elementFromPoint(x,y);
          if(e && (el===e||el.contains(e)||e.contains(el))) ok++;
          else { const k=e?((e.id||e.className||e.tagName)+''):'(nothing)'; by[k]=(by[k]||0)+1; }
        }
        const top=Object.entries(by).sort((a,b)=>b[1]-a[1])[0];
        return {pct: tot?Math.round(ok/tot*100):0, ok:ok, tot:tot, by: top?(top[0]+' '+top[1]+'/'+tot):''};
      };
      /* STEP 5 — "open the Star Atlas". The dock chip must be tappable with the
         survey card standing. This is Nick's screenshot: the chip half-buried. */
      out.dockAtlas=hit(logbtn);
      out.dockCodex=hit(cdxbtn);
      /* …and once the Atlas is open and carries the lesson's mark, the board —
         not the survey card — must be what a finger lands on. */
      log.style.display='block'; log.classList.add('tutpri');
      out.atlasOpen=hit(log);
      out.cardVsAtlas=reach(tb);
      log.classList.remove('tutpri'); log.style.display='none';
      /* STEP 7/8 — the Compendium, the step Nick got stuck on outright */
      codex.style.display='block'; codex.classList.add('tutpri');
      out.codexOpen=hit(codex);
      out.cardVsCodex=reach(tb);
      codex.classList.remove('tutpri'); codex.style.display='none';
      /* the other two raisable surfaces in TUT_PRI_SURF. They are measured not
         because a lesson points at them today but so that the NEXT surface added
         to that list cannot inherit the raise without the geometry. */
      const chp=document.getElementById('chpanel'), rec=document.getElementById('records');
      if(chp){ chp.style.display='block'; chp.classList.add('tutpri');
        out.cardVsCharters=reach(tb);
        chp.classList.remove('tutpri'); chp.style.display='none'; }
      if(rec){ rec.style.display='block'; rec.classList.add('tutpri');
        out.cardVsRecords=reach(tb);
        rec.classList.remove('tutpri'); rec.style.display='none'; }
      /* THE DODGE PASS — and the reason it exists. Measured with the card pinned
         at the TOP (above), a bottom-anchored board and the card never share a
         band on a tablet, so the Compendium case the external round actually
         reported came back CLEAN. Their iPad mini card had dodged to the BOTTOM
         (the opposite-half rule), which is exactly where the boards live under
         @media (max-width:900px). Re-publish the vars the way _tutSpot does for a
         dodged card — dialogs rise ABOVE it — and re-measure all four. */
      tb.classList.add('dodge');
      {
        const _r1=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--row1-h'))||58;
        const _cr2=tb.getBoundingClientRect(), _top=Math.round(_r1+12);
        document.documentElement.style.setProperty('--tut-bot', _top+'px');
        document.documentElement.style.setProperty('--tut-cap', Math.max(140, Math.round(_cr2.top-_top-12))+'px');
      }
      for(const [k,el2] of [['Atlas',log],['Codex',codex],['Charters',chp],['Records',rec]]){
        if(!el2) continue;
        el2.style.display='block'; el2.classList.add('tutpri');
        out['dodge'+k]=reach(tb);
        el2.classList.remove('tutpri'); el2.style.display='none';
      }
      tb.classList.remove('dodge');
      /* ROUND 9 CF1806-02 — THE ASSERTION THE CARD-ONLY PASS COULD NOT MAKE.
         The pass above proves a raised board does not bury the LESSON CARD. It says
         nothing about everything BELOW the board — and CF1806-02 was exactly that: the
         v1.8.6 rule released the bottom anchor (those boards are pinned bottom:142px
         precisely to clear the dock) and reserved only 24px, so on the two shortest phones
         a raised board covered ALL SIX dock controls, 63/63 blocked. The card was fine.
         The right assertion is the general one: at any training state, every control the
         player may legitimately press is the topmost element at its own coordinates. */
      /* ⚠ RESTORE THE CARD-AT-TOP PUBLICATION FIRST. The dodge pass above left
         --tut-bot at row1-h+12 (~53px), which parks the board high on the screen where
         it cannot reach the dock at all — and the check then passed on a build already
         proven broken. The dangerous geometry is the card at the TOP, because the board
         hangs DOWNWARD from it toward the dock. This is the same trap as the dodge pass
         itself, one level down: the state you forgot to set is the state the bug lives in. */
      tb.style.display='block';
      {
        const _cr3=tb.getBoundingClientRect();
        document.documentElement.style.setProperty('--tut-bot', Math.round(_cr3.bottom+10)+'px');
        document.documentElement.style.setProperty('--tut-cap', Math.max(140, Math.round(innerHeight-_cr3.bottom-24))+'px');
      }
      const DOCK=['codexbtn','logbtn','cargobtn','chbtn','setbtn','helpbtn'];
      for(const [k,el2] of [['Atlas',log],['Codex',codex],['Charters',chp],['Records',rec]]){
        if(!el2) continue;
        /* ⚠ THE BOARD MUST HAVE CONTENT. An EMPTY board collapses under the
           min-height:0 the fix itself sets, never reaches the dock, and the check
           passes on a build that is broken — measured: this returned clean on the
           shipped v1.8.6 that the external round had already proven defective.
           A real board at these steps is populated (the Charters board at step 20
           carries the Ascent box plus the slate), so fill it the way the probe
           already fills #panel above. */
        const _keep=el2.innerHTML;
        el2.innerHTML='<div style="padding:14px">'+'row<br>'.repeat(60)+'</div>';
        el2.style.display='block'; el2.classList.add('tutpri');
        const blocked=[];
        for(const id of DOCK){
          const b=document.getElementById(id);
          if(!b) continue;
          const r=b.getBoundingClientRect();
          if(r.width<1||r.height<1) continue;          /* legitimately hidden — not a finding */
          const h=hit(b);
          if(!h.ok) blocked.push(id+'<-'+(h.by||h.why));
        }
        if(k==='Charters'){
          const br=el2.getBoundingClientRect();
          const cs=getComputedStyle(document.documentElement);
          out.dockDiag={
            vpH:innerHeight,
            tutBot:cs.getPropertyValue('--tut-bot').trim(),
            tutCap:cs.getPropertyValue('--tut-cap').trim(),
            board:[Math.round(br.top),Math.round(br.bottom),Math.round(br.height)],
            maxH:getComputedStyle(el2).maxHeight,
            btns:DOCK.map(id=>{ const b=document.getElementById(id); if(!b) return id+':none';
              const r=b.getBoundingClientRect();
              return id+':'+Math.round(r.top)+'-'+Math.round(r.bottom)+'('+Math.round(r.width)+'x'+Math.round(r.height)+')'; })
          };
        }
        out['dockClear'+k]={blocked:blocked, n:blocked.length};
        el2.classList.remove('tutpri'); el2.style.display='none'; el2.innerHTML=_keep;
      }
      /* external battery v1.8.2 (P2): "the training card blocks Settings › Audio"
         — measured, as they measured it, by whether the tab can actually be hit
         while a lesson is on screen. */
      const sp=document.getElementById('setpanel');
      if(sp){
        sp.style.display='block';
        const tab=sp.querySelector('[data-stab="a"]')
          || [...sp.querySelectorAll('*')].find(e=>/^audio$/i.test((e.textContent||'').trim()) && e.children.length===0);
        out.audioTab = tab ? hit(tab) : {ok:false, why:'no audio tab found'};
        out.settingsPanel = hit(sp);
        sp.style.display='none';
      }
      /* STEP 6 — the LAND press: with a board still open, the survey card must
         win, or fixing step 5 simply moves the breakage to step 6. */
      log.style.display='block'; panel.classList.add('tutpri');
      out.landCard=hit(panel);
      panel.classList.remove('tutpri'); log.style.display='none';
      panel.style.display='none'; document.body.classList.remove('training');
      tb.style.display='none'; tb.innerHTML='';
      document.documentElement.style.removeProperty('--tut-bot');
      document.documentElement.style.removeProperty('--tut-cap');
      return out;
    })()`);
    if (stack) {
      check(vp, 'training', 'step 5: the Atlas dock chip is tappable behind the survey card',
        !!(stack.dockAtlas && stack.dockAtlas.ok), 'covered by ' + (stack.dockAtlas && (stack.dockAtlas.by || stack.dockAtlas.why)));
      check(vp, 'training', 'step 7: the Compendium dock chip is tappable behind the survey card',
        !!(stack.dockCodex && stack.dockCodex.ok), 'covered by ' + (stack.dockCodex && (stack.dockCodex.by || stack.dockCodex.why)));
      check(vp, 'training', 'step 5: the OPEN Atlas outranks the survey card',
        !!(stack.atlasOpen && stack.atlasOpen.ok), 'covered by ' + (stack.atlasOpen && (stack.atlasOpen.by || stack.atlasOpen.why)));
      check(vp, 'training', 'step 8: the OPEN Compendium outranks the survey card',
        !!(stack.codexOpen && stack.codexOpen.ok), 'covered by ' + (stack.codexOpen && (stack.codexOpen.by || stack.codexOpen.why)));
      /* ROUND 8 CF1805-01 — the assertion the four checks above could not make.
         Raising the lesson's own surface to z58 put it over the lesson CARD at
         z50: on iPad mini step 8 the card measured 0% reachable, 63/63 blocked
         by #codex, and the fleet's stalls at that step went 8 → 29. The card is
         where the instruction and the Skip button live, so a buried card is a
         dead end, not a cosmetic overlap. */
      for (const [k, lbl] of [['cardVsAtlas', 'Atlas'], ['cardVsCodex', 'Compendium'],
                              ['cardVsCharters', 'Charters'], ['cardVsRecords', 'Records'],
                              ['dodgeAtlas', 'Atlas (card dodged)'], ['dodgeCodex', 'Compendium (card dodged)'],
                              ['dodgeCharters', 'Charters (card dodged)'], ['dodgeRecords', 'Records (card dodged)']]) {
        const m = stack[k];
        if (!m) continue;
        check(vp, 'training', 'CF1805-01: the lesson card survives a raised ' + lbl,
          m.pct >= 90, m.pct + '% reachable (' + m.ok + '/' + m.tot + ')' + (m.by ? ' — blocked by ' + m.by : ''));
      }
      /* ROUND 9 CF1806-02 — the dock must survive a raised board. Steps 5 (#log),
         8 (#codex) and 20 (#chpanel) all raise one, so this is the normal path.
         ⚠ SCOPED TO <=900px ON PURPOSE — that is the exact breakpoint at which the
         bottom dock exists and those four boards are pinned to clear it. Above it the
         same ids are RAIL buttons with different layout, and a raised board overlapping
         them is a DIFFERENT question with a different answer. Measured: laptop/desktop
         report 2 buried on v1.8.5 as well, i.e. PRE-EXISTING and not this fix's doing —
         it is filed in the roadmap rather than folded in here, because a gate that
         conflates two defects behind one name teaches nobody anything. */
      if (process.argv.includes('--diag') && stack.dockDiag) console.log('DIAG [' + vp.id + '] ' + JSON.stringify(stack.dockDiag));
      if (vp.w <= 900) {
        for (const [k, lbl] of [['dockClearAtlas', 'Atlas'], ['dockClearCodex', 'Compendium'],
                                ['dockClearCharters', 'Charters'], ['dockClearRecords', 'Records']]) {
          const m = stack[k];
          if (!m) continue;
          check(vp, 'training', 'CF1806-02: the dock survives a raised ' + lbl,
            m.n === 0, m.n + ' control(s) buried — ' + m.blocked.join(' · '));
        }
      }
      check(vp, 'training', 'battery P2: Settings › Audio is clickable during a lesson',
        !!(stack.audioTab && stack.audioTab.ok), 'blocked by ' + (stack.audioTab && (stack.audioTab.by || stack.audioTab.why)));
      check(vp, 'training', 'step 6: the survey card still outranks an open board for the LAND press',
        !!(stack.landCard && stack.landCard.ok), 'covered by ' + (stack.landCard && (stack.landCard.by || stack.landCard.why)));
    } else {
      check(vp, 'training', 'training stack probe ran', false, 'probe returned nothing');
    }

    await send('Target.closeTarget', { targetId: t.targetId });
  }

  } catch (error) {
    primaryError = error;
  } finally {
    if (browser) {
      try {
        await browser.close();
        browser = null;
        REPORT_LIFECYCLE.browserClosed = true;
      } catch (error) {
        cleanupErrors.push(`browser cleanup failed: ${error.stack || error.message}`);
      }
    } else {
      REPORT_LIFECYCLE.browserClosed = true;
    }
    if (REPORT_SOURCE_BEGIN) {
      try { REPORT_SOURCE_END = sourceIdentity(); }
      catch (error) { cleanupErrors.push(`ending source identity failed: ${error.stack || error.message}`); }
    }
  }
  if (REPORT_SOURCE_BEGIN && REPORT_SOURCE_END && !sameSource(REPORT_SOURCE_BEGIN, REPORT_SOURCE_END)) {
    cleanupErrors.push('source identity changed during the layout run');
  }
  if (primaryError || cleanupErrors.length) {
    const pieces = [];
    if (primaryError) pieces.push(primaryError.stack || primaryError.message);
    pieces.push(...cleanupErrors);
    let reportFinalized = false;
    if (REPORT_ARTIFACT_RESERVED && releaseWorkspaceLock) {
      REPORT_LIFECYCLE.workspaceLockHeldThroughReportWrite = true;
      try {
        writeTerminalReport('instrument-fail', {
          browser: REPORT_BROWSER,
          failure: { message: primaryError?.message || cleanupErrors[0], detail: pieces.join('\n'), exitCode: 2 },
        });
        reportFinalized = true;
      } catch (error) {
        pieces.push(`instrument-fail report write failed: ${error.stack || error.message}`);
      }
    }
    if (releaseWorkspaceLock) {
      try {
        releaseWorkspaceLock();
        releaseWorkspaceLock = null;
      } catch (error) {
        pieces.push(`workspace-lock release failed: ${error.stack || error.message}`);
      }
    }
    const runError = new Error(pieces.join('\n'));
    runError.layoutReportFinalized = reportFinalized;
    throw runError;
  }

  const fails = results.filter((result) => !result.ok);
  const byVp = {};
  for (const result of results) {
    byVp[result.vp] = byVp[result.vp] || { pass: 0, fail: 0 };
    byVp[result.vp][result.ok ? 'pass' : 'fail']++;
  }
  const requestedViewportCount = VIEWPORTS.filter((viewport) => !_vpArg
    || _vpArg.slice(5).split(',').includes(viewport.id)).length;
  REPORT_LIFECYCLE.workspaceLockHeldThroughReportWrite = !!releaseWorkspaceLock;
  let terminal;
  try {
    terminal = writeTerminalReport(fails.length ? 'fail' : 'pass', {
      browser: REPORT_BROWSER,
      results,
    });
    verifyReport(REPORT_ARTIFACT_PATH, RUN_ID, {
      expectedSource: REPORT_SOURCE_END,
      expectedArtifactPath: REPORT_ARTIFACT_PATH,
      requireCertifying: false,
    });
  } catch (error) {
    let reportFinalized = false;
    try {
      writeTerminalReport('instrument-fail', {
        browser: REPORT_BROWSER,
        failure: { message: error.message, detail: error.stack || error.message, exitCode: 2 },
      });
      reportFinalized = true;
    } catch { /* the original evidence-write failure remains authoritative */ }
    if (releaseWorkspaceLock) {
      try { releaseWorkspaceLock(); } catch { /* surfaced by the original terminalization failure */ }
      releaseWorkspaceLock = null;
    }
    error.layoutReportFinalized = reportFinalized;
    throw error;
  }
  try {
    releaseWorkspaceLock();
    releaseWorkspaceLock = null;
  } catch (error) {
    try {
      writeTerminalReport('instrument-fail', {
        browser: REPORT_BROWSER,
        failure: { message: error.message, detail: error.stack || error.message, exitCode: 2 },
      });
      error.layoutReportFinalized = true;
    } catch { /* release failure remains red even if the report rewrite also fails */ }
    throw error;
  }
  console.log('\n=== UI LAYOUT GATE ===');
  for (const viewportId in byVp) {
    console.log('  ' + viewportId.padEnd(11) + ' ' + byVp[viewportId].pass + ' pass'
      + (byVp[viewportId].fail ? '  ' + byVp[viewportId].fail + ' FAIL' : ''));
  }
  console.log(fails.length ? 'GATE: FAIL (' + fails.length + ')'
    : 'GATE: PASS (' + results.length + ' checks, ' + requestedViewportCount + ' viewports)');
  if (!terminal.certifying) {
    console.log('LAYOUT EVIDENCE: DIAGNOSTIC ONLY — targeted/custom-URL or dirty source cannot certify the sealed 10-viewport gate');
  }
  process.exitCode = fails.length ? 1 : 0;
}

async function selftest() {
  const tempRoot = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'cf-uilayout-selftest-'));
  try {
    let callerOpenCount = 0;
    let callerOptions = null;
    const callerSentinel = Object.freeze({ kind: 'root-layout-cdp-caller-selftest' });
    const callerResult = await openRootLayoutCdp((options) => {
      callerOpenCount++;
      callerOptions = options;
      return callerSentinel;
    });
    if (callerResult !== callerSentinel || callerOpenCount !== 1) {
      throw new Error(`SELFTEST root layout caller opened ${callerOpenCount} times or lost its result`);
    }
    if (callerOptions?.label !== 'root UI layout gate'
      || callerOptions.userDataPrefix !== 'cf-uilayout'
      || callerOptions.commandTimeoutMs !== ROOT_LAYOUT_CDP_COMMAND_TIMEOUT_MS
      || callerOptions.webSocketOpenTimeoutMs !== ROOT_LAYOUT_CDP_SOCKET_TIMEOUT_MS
      || callerOptions.startupTimeoutMs !== ROOT_LAYOUT_CDP_STARTUP_TIMEOUT_MS
      || callerOptions.shutdownTimeoutMs !== ROOT_LAYOUT_CDP_SHUTDOWN_TIMEOUT_MS) {
      throw new Error(`SELFTEST root layout caller options drifted: ${JSON.stringify(callerOptions)}`);
    }
    const callerOptionKeys = Object.keys(callerOptions).sort();
    const expectedCallerOptionKeys = [
      'commandTimeoutMs', 'label', 'shutdownTimeoutMs', 'startupTimeoutMs',
      'userDataPrefix', 'webSocketOpenTimeoutMs',
    ];
    if (JSON.stringify(callerOptionKeys) !== JSON.stringify(expectedCallerOptionKeys)) {
      throw new Error(`SELFTEST root layout caller exposed unowned options: ${callerOptionKeys.join(', ')}`);
    }
    let lockAcquireCount = 0;
    let lockLabel = null;
    let lockReleaseCount = 0;
    const releaseSentinel = acquireRootLayoutWorkspaceLock((label) => {
      lockAcquireCount++;
      lockLabel = label;
      return () => { lockReleaseCount++; };
    });
    releaseSentinel();
    if (lockAcquireCount !== 1 || lockReleaseCount !== 1
      || lockLabel !== 'root UI layout build and browser gate') {
      throw new Error(`SELFTEST workspace-lock ownership drifted: ${JSON.stringify({ lockAcquireCount, lockReleaseCount, lockLabel })}`);
    }
    const report = path.join(tempRoot, 'report.json');
    atomicWriteJson(report, { schema: REPORT_SCHEMA, status: 'pass', run: { id: 'stale-pass' },
      summary: { failed: 0, completedViewports: 10, requestedViewports: 10 }, failure: null,
      results: [{ vp: 'stale', surf: 'stale', name: 'stale pass', ok: true, detail: '' }] });
    const markerBrowser = process.platform === 'win32'
      ? process.execPath : path.join(tempRoot, 'marker-browser');
    if (process.platform !== 'win32') {
      fs.writeFileSync(markerBrowser, '#!/bin/sh\nprintf "UILAYOUT_SELFTEST_EARLY_EXIT\\n" >&2\nexit 73\n');
      fs.chmodSync(markerBrowser, 0o755);
    }
    const childEnv = { ...process.env, CF_BROWSER: markerBrowser, CF_UILAYOUT_REPORT: report,
      CF_UILAYOUT_RUN_ID: 'selftest-current-run' };
    const profileNames = () => fs.readdirSync(fs.realpathSync(os.tmpdir()))
      .filter((name) => /^cf-uilayout-\d+-[0-9a-f]{16}$/.test(name)).sort();
    const profilesBefore = profileNames();
    let rejected = null;
    const started = Date.now();
    try {
      execFileSync(process.execPath, [__filename], {
        cwd: root, env: childEnv, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 6000,
      });
    } catch (error) { rejected = error; }
    if (!rejected) throw new Error('SELFTEST early-exit browser was accepted');
    if (rejected.status !== 2) throw new Error(`SELFTEST wrong instrument exit: ${String(rejected.status)}`);
    const diagnostic = `${rejected.stdout || ''}\n${rejected.stderr || ''}`;
    const seatbeltRefused = process.platform === 'darwin' && process.env.CODEX_SANDBOX === 'seatbelt';
    const expectedDiagnostic = seatbeltRefused
      ? /refusing macOS Chromium inside the Codex Seatbelt sandbox/
      : process.platform === 'win32'
      ? /browser CDP did not start[\s\S]*exit=[1-9]/
      : /exit=73[\s\S]*UILAYOUT_SELFTEST_EARLY_EXIT/;
    if (!expectedDiagnostic.test(diagnostic)) {
      throw new Error(`SELFTEST lost exit/stderr diagnosis: ${diagnostic.slice(-1200)}`);
    }
    if (Date.now() - started >= 6000) throw new Error('SELFTEST early exit waited through the outer timeout');
    const currentArtifact = artifactPathFor('selftest-current-run', report);
    const current = verifyReport(currentArtifact, 'selftest-current-run', {
      expectedArtifactPath: currentArtifact,
    });
    if (current.status !== 'instrument-fail' || current.failure?.exitCode !== 2
      || !current.results.some((result) => result.ok === false)) {
      throw new Error('SELFTEST current red report did not replace the stale PASS');
    }
    if (!readRegularFile(currentArtifact, 'selftest immutable report')
      .equals(readRegularFile(report, 'selftest current report pointer'))) {
      throw new Error('SELFTEST current pointer differs from the immutable instrument-fail report');
    }
    let staleAccepted = false;
    try {
      verifyReport(currentArtifact, 'stale-pass', { expectedArtifactPath: currentArtifact });
      staleAccepted = true;
    } catch (_) { /* expected */ }
    if (staleAccepted) throw new Error('SELFTEST freshness accepted the prior run id');
    const malformedCurrent = JSON.parse(JSON.stringify(current));
    malformedCurrent.status = 'pass';
    malformedCurrent.failure = null;
    malformedCurrent.results = [{ vp: 'iphone', surf: 'fake', name: 'truncated pass', ok: true, detail: '' }];
    malformedCurrent.summary = { failed: 0 };
    malformedCurrent.browser = null;
    atomicWriteJson(currentArtifact, malformedCurrent);
    let malformedAccepted = false;
    try {
      verifyReport(currentArtifact, 'selftest-current-run', { expectedArtifactPath: currentArtifact });
      malformedAccepted = true;
    } catch (_) { /* expected */ }
    if (malformedAccepted) throw new Error('SELFTEST accepted a truncated current-id PASS report');
    atomicWriteJson(currentArtifact, current);
    atomicWriteJson(report, current);

    const sealedResults = JSON.parse(fs.readFileSync(BASELINE_REPORT_PATH, 'utf8')).results;
    const sourceFixture = Object.freeze({
      commit: 'a'.repeat(40), branch: 'openai/selftest', state: 'committed',
      statusSha256: 'b'.repeat(64), workingTreeSha256: 'c'.repeat(64),
    });
    const namedPointer = path.join(tempRoot, 'named-pointer.json');
    const namedArtifact = artifactPathFor(RUN_ID, namedPointer);
    const completePass = reportFor('pass', {
      browser: { executable: portableAbsolutePath(path.join(tempRoot, 'browser')), product: 'Chromium/150.0.0.0', revision: 'selftest',
        user_agent: 'selftest', js_version: 'selftest', protocol_version: '1.3', pid: 123 },
      results: sealedResults,
      sourceBegin: sourceFixture,
      sourceEnd: sourceFixture,
      lifecycle: { browserClosed: true, workspaceLockHeldThroughReportWrite: true },
      artifactPath: namedArtifact,
      certifyingRequest: true,
    });
    const writeNamedFixture = (value) => {
      atomicWriteJson(namedArtifact, value);
      atomicWriteJson(namedPointer, value);
    };
    const namedRejected = (value, expectedSource = sourceFixture) => {
      writeNamedFixture(value);
      try {
        verifyNamedRun(RUN_ID, { reportPath: namedPointer, expectedSource });
        return false;
      } catch { return true; }
    };
    writeNamedFixture(completePass);
    verifyNamedRun(RUN_ID, { reportPath: namedPointer, expectedSource: sourceFixture });

    const portableWindowsBrowser = JSON.parse(JSON.stringify(completePass));
    portableWindowsBrowser.browser.executable = 'C:/Program Files/Microsoft/Edge/Application/msedge.exe';
    writeNamedFixture(portableWindowsBrowser);
    verifyNamedRun(RUN_ID, { reportPath: namedPointer, expectedSource: sourceFixture });
    const nativeWindowsBrowser = JSON.parse(JSON.stringify(completePass));
    nativeWindowsBrowser.browser.executable = 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe';
    if (!namedRejected(nativeWindowsBrowser)) {
      throw new Error('SELFTEST named verifier accepted a non-portable Windows executable path');
    }
    const unresolvedWindowsBrowser = JSON.parse(JSON.stringify(completePass));
    unresolvedWindowsBrowser.browser.executable = 'C:/Program Files/Microsoft/../Edge/Application/msedge.exe';
    if (!namedRejected(unresolvedWindowsBrowser)) {
      throw new Error('SELFTEST named verifier accepted an unresolved Windows executable path');
    }

    const wrongBrowserFamily = JSON.parse(JSON.stringify(completePass));
    wrongBrowserFamily.browser.product = 'Firefox/150.0.0.0';
    if (!namedRejected(wrongBrowserFamily)) {
      throw new Error('SELFTEST named verifier accepted non-Chromium browser provenance');
    }
    const wrongBrowserProtocol = JSON.parse(JSON.stringify(completePass));
    wrongBrowserProtocol.browser.protocol_version = '1.4';
    if (!namedRejected(wrongBrowserProtocol)) {
      throw new Error('SELFTEST named verifier accepted non-CDP-1.3 browser provenance');
    }

    let reusedAccepted = false;
    try { atomicCreateFile(namedArtifact, 'replacement must not land'); reusedAccepted = true; }
    catch (_) { /* expected */ }
    if (reusedAccepted) throw new Error('SELFTEST reused immutable layout run id was accepted');

    const missingOutcome = JSON.parse(JSON.stringify(completePass));
    missingOutcome.results.pop();
    missingOutcome.summary.checks = missingOutcome.results.length;
    missingOutcome.summary.passed = missingOutcome.results.length;
    missingOutcome.summary.failed = 0;
    missingOutcome.summary.completedViewports = new Set(
      missingOutcome.results.map((result) => result.vp),
    ).size;
    if (!namedRejected(missingOutcome)) {
      throw new Error('SELFTEST accepted a count-consistent PASS missing one sealed outcome');
    }

    const targeted = JSON.parse(JSON.stringify(completePass));
    targeted.scope = 'targeted-diagnostic';
    targeted.certifying = false;
    targeted.target.viewportIds = [VIEWPORTS[0].id];
    targeted.results = targeted.results.filter((result) => result.vp === VIEWPORTS[0].id);
    targeted.summary = {
      checks: targeted.results.length,
      passed: targeted.results.length,
      failed: 0,
      completedViewports: 1,
      requestedViewports: 1,
    };
    if (!namedRejected(targeted)) {
      throw new Error('SELFTEST named verifier certified a targeted one-viewport PASS');
    }

    const dirtySource = { ...sourceFixture, state: 'dirty-diagnostic' };
    const dirty = JSON.parse(JSON.stringify(completePass));
    dirty.source = { begin: dirtySource, end: dirtySource };
    dirty.certifying = false;
    if (!namedRejected(dirty, dirtySource)) {
      throw new Error('SELFTEST named verifier certified dirty source');
    }

    const mixed = JSON.parse(JSON.stringify(completePass));
    mixed.source.end.workingTreeSha256 = 'd'.repeat(64);
    mixed.certifying = false;
    if (!namedRejected(mixed)) throw new Error('SELFTEST named verifier accepted mixed source');

    const wrongCurrentSource = { ...sourceFixture, workingTreeSha256: 'e'.repeat(64) };
    if (!namedRejected(completePass, wrongCurrentSource)) {
      throw new Error('SELFTEST named verifier accepted an artifact from another current source');
    }

    const retryPolicy = JSON.parse(JSON.stringify(completePass));
    retryPolicy.policy.automaticRetries = 1;
    if (!namedRejected(retryPolicy)) throw new Error('SELFTEST named verifier accepted retry policy drift');

    writeNamedFixture(completePass);
    const stalePointer = JSON.parse(JSON.stringify(completePass));
    stalePointer.run.id = 'stale-pointer';
    atomicWriteJson(namedPointer, stalePointer);
    let stalePointerAccepted = false;
    try {
      verifyNamedRun(RUN_ID, { reportPath: namedPointer, expectedSource: sourceFixture });
      stalePointerAccepted = true;
    } catch (_) { /* expected */ }
    if (stalePointerAccepted) throw new Error('SELFTEST named verifier accepted a stale current pointer');

    writeNamedFixture(completePass);
    const profilesAfter = profileNames();
    const leaked = profilesAfter.filter((name) => !profilesBefore.includes(name));
    if (leaked.length) throw new Error(`SELFTEST owned profile leaked: ${leaked.join(', ')}`);
    const provenanceFixture = { executable: '/selftest/browser', product: 'Selftest/1',
      revision: 'selftest', user_agent: 'selftest', js_version: 'selftest',
      protocol_version: 'selftest', pid: 123 };
    const priorReportBrowser = REPORT_BROWSER;
    REPORT_BROWSER = provenanceFixture;
    finalizeInstrumentFailure(new Error('injected post-launch failure'), {
      file: report, setExitCode: false, print: false,
      reportOptions: {
        sourceBegin: sourceFixture,
        sourceEnd: sourceFixture,
        lifecycle: { browserClosed: true, workspaceLockHeldThroughReportWrite: true },
        artifactPath: report,
        certifyingRequest: true,
      },
    });
    REPORT_BROWSER = priorReportBrowser;
    const redWithProvenance = verifyReport(report, RUN_ID, {
      expectedSource: sourceFixture,
      expectedArtifactPath: report,
    });
    if (redWithProvenance.status !== 'instrument-fail'
      || redWithProvenance.browser?.product !== provenanceFixture.product
      || redWithProvenance.browser?.pid !== provenanceFixture.pid) {
      throw new Error('SELFTEST real instrument finalizer lost launched-browser provenance');
    }
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
  console.log('UI LAYOUT LAUNCHER SELFTEST: PASS');
  console.log('  one workspace lock and one root-layout CDP call own the complete one-attempt lifecycle');
  console.log('  exact 45s startup / 15s socket / 30s command / 5s shutdown bounds retained');
  console.log('  stale PASS replaced by current immutable instrument-fail report and matching pointer');
  console.log(process.platform === 'darwin' && process.env.CODEX_SANDBOX === 'seatbelt'
    ? '  macOS Seatbelt refusal retained before spawn'
    : `  early executable exit retained before startup bound${process.platform === 'win32' ? '' : ' (73 + stderr marker)'}`);
  console.log('  mismatched run id rejected; owned browser profile cleaned');
  console.log('  current-id truncated PASS report rejected');
  console.log('  exact 10/787 certifying inventory required; targeted and count-consistent partial PASS rejected');
  console.log('  immutable run-ID reuse, stale pointer, dirty/mixed/wrong source, and retry-policy drift rejected');
  console.log('  post-launch instrument failure retains browser provenance');
}

if (process.argv.includes('--selftest')) {
  selftest().catch((error) => { console.error(error.stack || error.message); process.exitCode = 1; });
} else if (process.argv.some((arg) => arg.startsWith('--verify-run='))) {
  try {
    const verifyArgs = process.argv.filter((arg) => arg.startsWith('--verify-run='));
    if (verifyArgs.length !== 1 || process.argv.length !== 3) {
      throw new Error('usage: node tools/uilayout.js --verify-run=<exact-run-id>');
    }
    const expected = verifyArgs[0].slice('--verify-run='.length);
    const report = verifyNamedRun(expected);
    console.log(`UI LAYOUT REPORT VERIFIED — ${report.status} · run ${expected}`);
    process.exitCode = report.status === 'pass' ? 0 : report.status === 'fail' ? 1 : 2;
  } catch (error) { console.error(error.stack || error.message); process.exitCode = 2; }
} else {
  main().catch((error) => {
    if (error.layoutReportFinalized) {
      console.error(error.stack || error.message);
      process.exitCode = 2;
    } else finalizeInstrumentFailure(error);
  });
}
