/* arc4recovery.mjs — dedicated real-time Arc 4 recovery certificate.

   The ordinary Slice remains a bounded functional smoke and explicitly does
   not claim recovery. This one-attempt collector creates the same Pertar
   authority, exhausts it through the registered capture writer, checkpoints
   and truly closes that target, then observes one newly loaded target for a
   full real 20-minute active-play cycle. No wall clock, browser virtual-time
   policy, product clock, RNG or durable authority is advanced by the tool.

   Usage:
     node tools/arc4recovery.mjs --slice-run=<id> --glass-run=<id>
     node tools/arc4recovery.mjs --verify-run=<id> --slice-run=<id> --glass-run=<id>
     node tools/arc4recovery.mjs --selftest
*/
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { openChromiumCdp } from './browsercdp.mjs';
import { acquireWorkspaceLock } from './workspacelock.mjs';
import { verifySliceRunEvidence } from './smokereport.mjs';
import {
  GLASS_ARC4_CAPTURE_CHECK_KEYS,
  GLASS_ARC4_CAPTURE_OUTCOME_CODES,
  GLASS_MATRIX_REPORT_SCHEMA,
  GLASS_MATRIX_VIEWPORTS,
  GLASS_NEGATIVE_CONTROLS,
  glassShipyardKeyboardHeartbeatSelftestInventory,
  glassTerminalEvidenceErrors,
  glassViewportInventory,
} from './glassmatrix-evidence-contract.mjs';
import {
  ARC4_ACTIVE_PLAY_CYCLE_MS,
  ARC4_CAPTURE_UI_EXPRESSION,
  ARC4_DURABLE_READ_EXPRESSION,
  ARC4_PERTAR_FIXTURE,
  ARC4_RECOVERY_CLOSED_INTERVAL_MIN_MS,
  ARC4_RECOVERY_CLOSURE_EVIDENCE_SCHEMA,
  arc4ExhaustedCaptureRows,
  arc4IneligibleExhaustedCaptureRows,
  assessArc4DisabledSuppressionEvidence,
  assessArc4DisabledTargetEvidence,
  assessArc4BurnStep,
  assessArc4CapturePrecondition,
  assessArc4Exhaustion,
  assessArc4ExhaustionRecovery,
  projectArc4CaptureUiFacts,
} from './arc4-browser-contract.mjs';
import {
  ARC4_RECOVERY_ACTIVE_OBSERVATION_MS,
  ARC4_RECOVERY_BOUNDARY_SERVICE_GAP_MAX_MS,
  ARC4_RECOVERY_CLOCK_GAP_MAX_MS,
  ARC4_RECOVERY_INPUT_SCHEMA,
  ARC4_RECOVERY_LIFECYCLE_SCHEMA,
  ARC4_RECOVERY_MIN_BOUNDARY_WAIT_MS,
  ARC4_RECOVERY_OBSERVATION_SCHEMA,
  ARC4_RECOVERY_OBSERVER_SCHEMA,
  ARC4_RECOVERY_PERTAR_POLL_TIMING_SCHEMA,
  ARC4_RECOVERY_PERTAR_SURFACE_EVIDENCE_SCHEMA,
  ARC4_RECOVERY_PERTAR_SURFACE_TIMEOUT_MS,
  ARC4_RECOVERY_PRECONDITION_CHECK_KEYS,
  ARC4_RECOVERY_REGULAR_SERVICE_GAP_MAX_MS,
  ARC4_RECOVERY_REPORT_SCHEMA,
  ARC4_RECOVERY_RUNTIME_CAPTURE_WITNESS_SCHEMA,
  ARC4_RECOVERY_SERVICE_SCHEMA,
  ARC4_RECOVERY_SERVICE_TURN_MAX_MS,
  ARC4_RECOVERY_STAGE_ORDER,
  ARC4_RECOVERY_TOTAL_CLOCK_PARITY_MAX_MS,
  ARC4_RECOVERY_UI_TRANSITION_LATENCY_MAX_MS,
  assessArc4RecoveryPertarPollTiming,
  assessArc4RecoveryRuntimeCaptureWitness,
  assessArc4RecoveryInstrumentSeal,
  assessOrdinarySliceRecoverySeal,
  evaluateArc4RecoveryObservation,
  projectArc4RecoveryRuntimeCaptureSnapshot,
  projectArc4RecoveryObservationAuthority,
  terminalArc4RecoveryReportErrors,
} from './arc4-recovery-contract.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const v2Root = path.resolve(here, '..');
const repoRoot = path.resolve(v2Root, '..', '..');
const appDir = path.join(v2Root, 'apps', 'game');
const distDir = path.join(appDir, 'dist');
const outputRoot = path.join(appDir, 'smoke');
const currentReportPath = path.join(outputRoot, 'arc4-recovery-report.json');
const baselineSavePath = path.join(
  v2Root, '..', 'baseline-v1.8.9', 'save-fixtures.json',
);
const collectorPath = fileURLToPath(import.meta.url);
const ordinarySlicePath = path.join(here, 'slicesmoke.mjs');
const contractPath = path.join(here, 'arc4-recovery-contract.mjs');
const glassEvidenceContractPath = path.join(here, 'glassmatrix-evidence-contract.mjs');
const browserCdpPath = path.join(here, 'browsercdp.mjs');
const browserPathPath = path.join(here, 'browserpath.mjs');
const workspaceLockPath = path.join(here, 'workspacelock.mjs');
const packagePath = path.join(v2Root, 'package.json');
const packageLockPath = path.join(v2Root, 'package-lock.json');
const appPackagePath = path.join(appDir, 'package.json');
const gameMainPath = path.join(appDir, 'src', 'main.ts');

const COMMAND_TIMEOUT_MS = 30_000;
const BOOT_TIMEOUT_MS = 20_000;
const OFFLINE_MIN_MS = ARC4_RECOVERY_CLOSED_INTERVAL_MIN_MS;
const REGULAR_SAMPLE_MS = 5_000;
const BOUNDARY_SAMPLE_MS = 250;
const BOUNDARY_NEAR_MS = 20_000;
const ACTIVE_OBSERVATION_MS = ARC4_RECOVERY_ACTIVE_OBSERVATION_MS;
const codeUnitCompare = (left, right) => left < right ? -1 : left > right ? 1 : 0;
const glassSelftestChecks = (code) => Object.fromEntries(
  (GLASS_ARC4_CAPTURE_CHECK_KEYS[code] || []).map((key) => [key, true]),
);

const POLICY = Object.freeze({
  attemptCount: 1,
  automaticRetries: 0,
  activeObservationRequiredMs: ACTIVE_OBSERVATION_MS,
  regularServiceGapMaxMs: ARC4_RECOVERY_REGULAR_SERVICE_GAP_MAX_MS,
  boundaryServiceGapMaxMs: ARC4_RECOVERY_BOUNDARY_SERVICE_GAP_MAX_MS,
  activeClockGapMaxMs: ARC4_RECOVERY_CLOCK_GAP_MAX_MS,
  serviceTurnMaxMs: ARC4_RECOVERY_SERVICE_TURN_MAX_MS,
  totalClockParityMaxMs: ARC4_RECOVERY_TOTAL_CLOCK_PARITY_MAX_MS,
  minimumBoundaryWaitMs: ARC4_RECOVERY_MIN_BOUNDARY_WAIT_MS,
  uiTransitionLatencyMaxMs: ARC4_RECOVERY_UI_TRANSITION_LATENCY_MAX_MS,
});

const SEED_PRELOAD_SOURCE = `(()=>{const native=globalThis.crypto.getRandomValues.bind(globalThis.crypto),
  witness={schema:'cf-v2-arc4-recovery-seed-fixture/v1',seed:68,seedCalls:0,nativeFallbackCalls:0};
  Object.defineProperty(globalThis.crypto,'getRandomValues',{configurable:true,value:(value)=>{
    if(value instanceof Uint32Array&&value.length===1&&witness.seedCalls===0){witness.seedCalls++;
      value[0]=witness.seed;return value}witness.nativeFallbackCalls++;return native(value)}});
  globalThis.__cfArc4RecoverySeedFixture=witness})()`;

const LIFECYCLE_OBSERVER_SOURCE = `(()=>{const S=window.__CF_SLICE__,state=S?.api?.state?.(),
  runtime=state?.persistence?.runtime,token=S?.documentToken??null;
  if(window.__cfArc4RecoveryObserver)return {installed:false,reason:'already-installed'};
  const observer={schema:'${ARC4_RECOVERY_OBSERVER_SCHEMA}',documentToken:token,
    armedAtPerformanceNow:performance.now(),events:[],serviceTurns:0,
    initial:{visibilityState:document.visibilityState,hidden:document.hidden,
      focused:document.hasFocus(),answerable:runtime?.answerable===true,
      accruing:runtime?.accruing===true,leaseOwned:runtime?.leaseOwned===true},final:null};
  const note=(kind)=>observer.events.push({kind,performanceNow:performance.now(),
    visibilityState:document.visibilityState,hidden:document.hidden,focused:document.hasFocus()});
  addEventListener('blur',()=>note('blur'),{capture:true});
  addEventListener('pagehide',()=>note('pagehide'),{capture:true});
  addEventListener('freeze',()=>note('freeze'),{capture:true});
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState!=='visible'||document.hidden)note('visibility-loss')},{capture:true});
  window.__cfArc4RecoveryObserver=observer;return JSON.parse(JSON.stringify(observer))})()`;

const REOPEN_DOCUMENT_CLOCK_SOURCE = `(()=>{globalThis.__cfArc4RecoveryDocumentClock={
  schema:'cf-v2-arc4-recovery-document-clock/v1',
  startedAtPerformanceMs:Math.trunc(performance.now())};
  globalThis.__cfF4StartHidden=()=>true})()`;

const serviceTurnExpression = (sequence) => `(async()=>{const observer=window.__cfArc4RecoveryObserver,
  S=window.__CF_SLICE__,capture=()=>{const state=S?.api?.state?.(),runtime=state?.persistence?.runtime,
    mount=document.querySelector('#survey [data-capture-card-body]'),budgetNode=mount?.querySelector('[data-capture-budget]'),
    budget=budgetNode?{yield:Number(budgetNode.getAttribute('data-yield')),
      used:Number(budgetNode.getAttribute('data-used')),remaining:Number(budgetNode.getAttribute('data-remaining')),
      cycle:Number(budgetNode.getAttribute('data-cycle'))}:null,
    rows=[...mount?.querySelectorAll?.('[data-capture-row]')??[]].map((row)=>{const button=row.querySelector('button[data-capture-action]');
      return {verb:row.getAttribute('data-capture-row'),status:row.getAttribute('data-status'),
        modelEnabled:button?.getAttribute('data-model-enabled')??null,disabled:button?.disabled??null,
        ariaDisabled:button?.getAttribute('aria-disabled')??null}});
    return {sequence:${sequence},documentToken:S?.documentToken??null,
      visibilityState:document.visibilityState,hidden:document.hidden,focused:document.hasFocus(),
      performanceNow:performance.now(),tickerTicks:state?.tickerTicks??null,runtime:runtime??null,
      capture:{budget,rows}}};
  if(!observer)throw new Error('Arc 4 recovery observer is not armed');const before=capture();
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('two-rAF service timeout')),2000);
    requestAnimationFrame(()=>requestAnimationFrame(()=>setTimeout(()=>{clearTimeout(timer);resolve()},0)))});
  const after=capture();observer.serviceTurns+=1;return {before,after}})()`;

const FINAL_OBSERVER_EXPRESSION = `(()=>{const observer=window.__cfArc4RecoveryObserver,
  state=window.__CF_SLICE__?.api?.state?.(),runtime=state?.persistence?.runtime;
  if(!observer)return null;observer.final={visibilityState:document.visibilityState,
    hidden:document.hidden,focused:document.hasFocus(),answerable:runtime?.answerable===true,
    accruing:runtime?.accruing===true,leaseOwned:runtime?.leaseOwned===true,
    performanceNow:performance.now()};return JSON.parse(JSON.stringify(observer))})()`;

const PAGE_EVIDENCE_SOURCES = Object.freeze([
  ARC4_CAPTURE_UI_EXPRESSION,
  ARC4_DURABLE_READ_EXPRESSION,
  SEED_PRELOAD_SOURCE,
  REOPEN_DOCUMENT_CLOCK_SOURCE,
  LIFECYCLE_OBSERVER_SOURCE,
  serviceTurnExpression(0),
  FINAL_OBSERVER_EXPRESSION,
]);

function fail(message) { throw new Error(message); }
function assert(condition, message) { if (!condition) fail(message); }
function instrumentAssert(condition, message, evidence = null) {
  if (!condition) throw new InstrumentFailure(message, evidence);
}
function productAssert(condition, message, evidence = null) {
  if (!condition) throw new ProductFailure(message, evidence);
}
class InstrumentFailure extends Error {
  constructor(message, evidence = null) {
    super(message); this.name = 'InstrumentFailure'; this.evidence = evidence;
  }
}
class ProductFailure extends Error {
  constructor(message, evidence = null) {
    super(message); this.name = 'ProductFailure'; this.evidence = evidence;
  }
}
function classifyRecoveryFailure(error) {
  if (error instanceof ProductFailure) {
    return Object.freeze({
      status: 'fail', exitCode: 1, evidence: error.evidence,
    });
  }
  return Object.freeze({
    status: 'instrument-fail', exitCode: 2,
    evidence: error instanceof InstrumentFailure ? error.evidence : null,
  });
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const nowMonotonicMs = () => Math.trunc(performance.now());
const portable = (value) => value.split(path.sep).join('/');
const stableJson = (value) => {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(
    (key) => `${JSON.stringify(key)}:${stableJson(value[key])}`,
  ).join(',')}}`;
  return JSON.stringify(value);
};
const same = (left, right) => stableJson(left) === stableJson(right);
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const hashFile = (file) => sha256(fs.readFileSync(file));

function atomicWriteJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${crypto.randomBytes(5).toString('hex')}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' });
  fs.renameSync(temporary, file);
}
function atomicCreateJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${crypto.randomBytes(5).toString('hex')}.tmp`;
  try {
    fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' });
    fs.linkSync(temporary, file);
  } finally {
    try { fs.unlinkSync(temporary); } catch { /* link/create failure cleanup */ }
  }
}
function evidenceRunId(value, kind) {
  assert(/^[a-z0-9][a-z0-9-]{0,95}$/i.test(value || ''),
    `${kind} run ID is invalid`);
  return value;
}
function recoveryArtifactPaths(id, directory = outputRoot) {
  evidenceRunId(id, 'Arc 4 recovery');
  return {
    report: path.join(directory, `arc4-recovery-${id}.json`),
    reportRelative: `apps/game/smoke/arc4-recovery-${id}.json`,
  };
}
function slicePredecessorDescriptor(verification) {
  return Object.freeze({
    schema: verification.report.schema,
    assuranceProfile: verification.assuranceProfile,
    runId: verification.report.run.id,
    reportPath: verification.artifacts.reportRelative,
    reportSha256: verification.reportSha256,
    rawLogPath: verification.report.rawLog.path,
    rawLogSha256: verification.report.rawLog.sha256,
    source: Object.freeze({ ...verification.report.source }),
  });
}

function verifyGlassPredecessor(runIdValue, { currentSource, slice, directory = outputRoot }) {
  const glassRunId = evidenceRunId(runIdValue, 'Glass');
  const reportRelative = `apps/game/smoke/glassmatrix-${glassRunId}.json`;
  const reportFile = path.join(directory, `glassmatrix-${glassRunId}.json`);
  if (!fs.existsSync(reportFile)) return Object.freeze({
    ok: false, errors: [`immutable Glass report is missing: ${reportRelative}`],
    report: null, reportSha256: null, descriptor: null,
  });
  const bytes = fs.readFileSync(reportFile);
  let report;
  try { report = JSON.parse(bytes.toString('utf8')); }
  catch (error) {
    return Object.freeze({ ok: false, errors: [`immutable Glass report is invalid JSON: ${error.message}`],
      report: null, reportSha256: sha256(bytes), descriptor: null });
  }
  const errors = glassTerminalEvidenceErrors(report, {
    runId: glassRunId,
    reportPath: reportRelative,
    expectedSource: currentSource,
    expectedSlice: slice,
    requirePass: true,
  });
  const descriptor = Object.freeze({
    schema: report?.schema ?? null,
    runId: glassRunId,
    reportPath: reportRelative,
    reportSha256: sha256(bytes),
    source: report?.source ? Object.freeze({ ...report.source }) : null,
    slicePredecessor: report?.predecessors?.slice
      ? Object.freeze({ ...report.predecessors.slice,
        source: Object.freeze({ ...report.predecessors.slice.source }) }) : null,
  });
  return Object.freeze({ ok: errors.length === 0, errors, report,
    reportSha256: descriptor.reportSha256, descriptor });
}

function resolvePredecessors({ sliceRunId, glassRunId }, currentSource) {
  evidenceRunId(sliceRunId, 'Slice');
  const sliceVerification = verifySliceRunEvidence(sliceRunId, {
    expectedSource: currentSource, requirePass: true, requireCommitted: true,
    expectedAssuranceProfile: 'production', allowLegacyV1: false,
  });
  assert(sliceVerification.ok,
    `selected Slice predecessor failed verification: ${sliceVerification.errors.join('; ')}`);
  const slice = slicePredecessorDescriptor(sliceVerification);
  const glassVerification = verifyGlassPredecessor(glassRunId, { currentSource, slice });
  assert(glassVerification.ok,
    `selected Glass predecessor failed verification: ${glassVerification.errors.join('; ')}`);
  return Object.freeze({ slice, glass: glassVerification.descriptor });
}

function git(args, { raw = false } = {}) {
  try {
    return execFileSync('git', args, {
      cwd: repoRoot, encoding: raw ? null : 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024,
    });
  } catch (error) {
    const detail = Buffer.isBuffer(error?.stderr)
      ? error.stderr.toString('utf8').trim() : String(error?.stderr || '').trim();
    throw new Error(`required git ${args.join(' ')} failed${detail ? `: ${detail}` : ''}`);
  }
}

function sourceIdentity() {
  const top = fs.realpathSync(String(git(['rev-parse', '--show-toplevel'])).trim());
  assert(top === fs.realpathSync(repoRoot), `git root mismatch: ${top}`);
  const status = git(['status', '--porcelain=v1', '-z', '--untracked-files=all'], { raw: true });
  const diff = git(['diff', '--binary', '--no-ext-diff', 'HEAD', '--'], { raw: true });
  const untracked = git(['ls-files', '--others', '--exclude-standard', '-z'], { raw: true })
    .toString('utf8').split('\0').filter(Boolean).sort();
  const digest = crypto.createHash('sha256');
  digest.update('tracked-diff\0').update(diff).update('\0untracked\0');
  const prefix = repoRoot.endsWith(path.sep) ? repoRoot : `${repoRoot}${path.sep}`;
  for (const relative of untracked) {
    const absolute = path.resolve(repoRoot, relative);
    assert(absolute.startsWith(prefix), `unsafe untracked source path: ${relative}`);
    const stat = fs.lstatSync(absolute);
    digest.update(relative).update('\0');
    if (stat.isFile()) digest.update('file\0').update(fs.readFileSync(absolute));
    else if (stat.isSymbolicLink()) digest.update('symlink\0').update(fs.readlinkSync(absolute));
    else fail(`untracked source is not a file or symlink: ${relative}`);
    digest.update('\0');
  }
  const commit = String(git(['rev-parse', 'HEAD'])).trim();
  assert(/^[a-f0-9]{40}$/.test(commit), 'git HEAD is not one full commit');
  const branchName = String(git(['rev-parse', '--abbrev-ref', 'HEAD'])).trim();
  return Object.freeze({
    commit, branch: branchName === 'HEAD' ? 'detached' : branchName,
    state: status.length ? 'dirty-diagnostic' : 'committed',
    statusSha256: sha256(status), workingTreeSha256: digest.digest('hex'),
  });
}

function distIdentity() {
  const files = [];
  const visit = (directory) => {
    for (const name of fs.readdirSync(directory).sort()) {
      const absolute = path.join(directory, name);
      const stat = fs.lstatSync(absolute);
      if (stat.isDirectory()) visit(absolute);
      else if (stat.isFile() && !stat.isSymbolicLink()) files.push({
        path: portable(path.relative(distDir, absolute)), bytes: stat.size,
        sha256: hashFile(absolute),
      });
      else fail(`dist contains unsupported entry: ${absolute}`);
    }
  };
  visit(distDir);
  assert(files.some((entry) => entry.path === 'index.html'),
    'Vite build did not produce index.html');
  return Object.freeze({
    schema: 'cf-v2-arc4-recovery-build/v1', files,
    sha256: sha256(stableJson(files)),
  });
}

function inputIdentity(buildSha256 = null, predecessors = null) {
  return Object.freeze({
    collector: hashFile(collectorPath),
    recoveryContract: hashFile(contractPath),
    glassEvidenceContract: hashFile(glassEvidenceContractPath),
    arc4Contract: hashFile(path.join(here, 'arc4-browser-contract.mjs')),
    ordinarySlice: hashFile(ordinarySlicePath),
    browserCdp: hashFile(browserCdpPath),
    browserPath: hashFile(browserPathPath),
    workspaceLock: hashFile(workspaceLockPath),
    baselineSaveFixtures: hashFile(baselineSavePath),
    package: hashFile(packagePath), packageLock: hashFile(packageLockPath),
    appPackage: hashFile(appPackagePath), gameMain: hashFile(gameMainPath),
    buildDist: buildSha256,
    predecessorChain: predecessors ? sha256(stableJson(predecessors)) : null,
  });
}

function runId() {
  const explicit = process.env.CF_V2_ARC4_RECOVERY_RUN_ID;
  if (explicit !== undefined) {
    assert(/^[a-z0-9][a-z0-9-]{0,95}$/i.test(explicit),
      'CF_V2_ARC4_RECOVERY_RUN_ID is invalid');
    return explicit;
  }
  return `${new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 17)}-${process.pid}-${crypto.randomBytes(5).toString('hex')}`;
}

function buildPertarRaw() {
  const fixtures = JSON.parse(fs.readFileSync(baselineSavePath, 'utf8')).inputs;
  const save = structuredClone(fixtures.veteran_rich);
  const systemIds = new Set(['jumpdrive', 'array', 'igdrive', 'autoext', 'cscoop']);
  const contactIds = new Set(['earpiece', 'diplobeacon', 'prismpendant', 'rl-mind', 'rl-star']);
  const replaced = new Set([...systemIds, ...contactIds]);
  save.me = 'Arc 4 Real-Time Recovery Fixture';
  save.essence = 100; save.essenceEarned = 100;
  save.items = [
    ...save.items.filter(([id]) => !replaced.has(id)),
    ['jumpdrive', 1], ['earpiece', 1], ['diplobeacon', 1],
  ];
  const retainedEquip = Object.fromEntries(Object.entries(save.eq ?? {})
    .filter(([, id]) => !replaced.has(id)));
  save.eq = { ...retainedEquip, ears: 'earpiece', necklace: 'diplobeacon' };
  save.ea = Object.fromEntries(Object.entries(save.ea ?? {})
    .filter(([slot]) => Object.prototype.hasOwnProperty.call(retainedEquip, slot)));
  save.codex = []; save.names = []; save.bx = []; save.scout = null;
  save.conq = []; save.minedw = []; save.mx = []; save.skx = []; save.log = [];
  save.land = [ARC4_PERTAR_FIXTURE.planet.seed];
  save.epoch = ARC4_PERTAR_FIXTURE.ecologyEpoch;
  save.tut = 1; delete save.tsnap;
  save.view = {
    type: 'star',
    gal: {
      x: ARC4_PERTAR_FIXTURE.galaxy.x, y: ARC4_PERTAR_FIXTURE.galaxy.y,
      size: 78, sp: 0, tilt: 0.62, rot: 0.5,
      seed: ARC4_PERTAR_FIXTURE.galaxy.seed,
      home: true, quasar: false, dwarf: false,
    },
    star: {
      x: ARC4_PERTAR_FIXTURE.publicStar.x,
      y: ARC4_PERTAR_FIXTURE.publicStar.y,
      seed: ARC4_PERTAR_FIXTURE.publicStar.seed,
    },
  };
  assert(same(save.items, [
    ['plate', 3], ['lens', 1], ['cell', 2], ['headlamp', 1],
    ['jumpdrive', 1], ['earpiece', 1], ['diplobeacon', 1],
  ]), 'Pertar recovery fixture item closure drifted');
  assert(same(save.eq, {
    helmet: 'headlamp', ears: 'earpiece', necklace: 'diplobeacon',
  }), 'Pertar recovery fixture equipment closure drifted');
  assert(same(save.ea, {
    helmet: { k: 'strike', v: 0.05, forId: 'headlamp' },
  }), 'Pertar recovery fixture affix closure drifted');
  assert(same(save.skx, []) && save.asc === 2,
    'Pertar recovery fixture route/legacy closure drifted');
  return JSON.stringify(save);
}

function closeHttpServer(server, timeoutMs = 5_000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      try { server.closeAllConnections(); } catch {}
      reject(new Error(`static server exceeded ${timeoutMs}ms close deadline`));
    }, timeoutMs);
    server.close((error) => {
      clearTimeout(timer);
      if (error) reject(error); else resolve();
    });
  });
}

function serveDist() {
  const root = fs.realpathSync(distDir);
  const prefix = root.endsWith(path.sep) ? root : `${root}${path.sep}`;
  const mime = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
    '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
  };
  const server = http.createServer((request, response) => {
    const url = new URL(request.url || '/', 'http://127.0.0.1');
    if (url.pathname === '/favicon.ico') {
      response.writeHead(204, { 'cache-control': 'public, max-age=86400' });
      response.end(); return;
    }
    let pathname;
    try { pathname = decodeURIComponent(url.pathname); }
    catch { response.writeHead(400); response.end(); return; }
    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const file = path.resolve(root, relative);
    if (file !== root && !file.startsWith(prefix)) {
      response.writeHead(403); response.end(); return;
    }
    try {
      const stat = fs.lstatSync(file);
      if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('not a file');
      response.writeHead(200, {
        'content-type': mime[path.extname(file)] || 'application/octet-stream',
        'cache-control': 'private, max-age=0, must-revalidate',
      });
      response.end(fs.readFileSync(file));
    } catch { response.writeHead(404); response.end(); }
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      assert(address && typeof address === 'object', 'static server has no address');
      resolve(Object.freeze({
        server, origin: `http://127.0.0.1:${address.port}`,
        close: () => closeHttpServer(server),
      }));
    });
  });
}

async function evaluate(send, sessionId, expression, label, timeoutMs = COMMAND_TIMEOUT_MS) {
  const result = await send('Runtime.evaluate', {
    expression, awaitPromise: true, returnByValue: true, userGesture: true,
  }, sessionId, { timeoutMs });
  if (result?.exceptionDetails) {
    const detail = result.exceptionDetails.exception?.description
      || result.exceptionDetails.text || 'unknown exception';
    throw new Error(`${label}: ${detail}`);
  }
  return result?.result?.value;
}

async function waitForValue(work, label, timeoutMs = BOOT_TIMEOUT_MS) {
  const deadline = performance.now() + timeoutMs;
  let last = null;
  let lastError = null;
  while (performance.now() < deadline) {
    try {
      last = await work(); lastError = null;
      if (last) return last;
    } catch (error) { lastError = error; }
    await sleep(50);
  }
  throw new Error(`${label} timed out${lastError ? ` (${lastError.message})` : ''}; last=${JSON.stringify(last)}`);
}

async function configureTarget(send, targetId, sessionId) {
  for (const method of ['Runtime.enable', 'Page.enable', 'Log.enable']) {
    await send(method, {}, sessionId);
  }
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390, height: 844, deviceScaleFactor: 2, mobile: true,
  }, sessionId);
  await send('Emulation.setTouchEmulationEnabled', {
    enabled: true, maxTouchPoints: 5,
  }, sessionId);
  await send('Target.activateTarget', { targetId });
  await send('Emulation.setFocusEmulationEnabled', { enabled: true }, sessionId);
}

async function waitForSlice(send, sessionId, previousToken = null) {
  return waitForValue(async () => evaluate(
    send, sessionId,
    `(()=>{const S=window.__CF_SLICE__;return S?.documentToken&&S.documentToken!==${JSON.stringify(previousToken)}?S.documentToken:null})()`,
    'read Slice token', 5_000,
  ), 'Slice publication');
}

async function waitForWritable(send, sessionId, expectedToken) {
  return waitForValue(async () => evaluate(send, sessionId,
    `(()=>{const S=window.__CF_SLICE__,state=S?.api?.state?.(),p=state?.persistence,r=p?.runtime;
      return S?.documentToken===${JSON.stringify(expectedToken)}&&p?.ready===true&&p?.hold===null
        &&p?.mutationBlocked===false&&state?.sceneResources?.pendingPersistenceWrites===0
        &&r?.visible===true&&r?.answerable===true&&r?.leaseOwned===true&&r?.accruing===true
        ?state:null})()`, 'read writable Slice state'), 'writable Slice authority');
}

async function waitForIneligibleAligned(send, sessionId, expectedToken) {
  return waitForValue(async () => evaluate(send, sessionId,
    `(()=>{const S=window.__CF_SLICE__,state=S?.api?.state?.(),p=state?.persistence,r=p?.runtime;
      return S?.documentToken===${JSON.stringify(expectedToken)}&&p?.ready===true&&p?.hold===null
        &&state?.sceneResources?.pendingPersistenceWrites===0
        &&state?.ownershipV2?.bootstrapOutcome==='already-aligned'
        &&r?.visible===false&&r?.answerable===false&&r?.leaseOwned===false&&r?.accruing===false
        ?state:null})()`, 'read ineligible aligned Slice state'),
  'ineligible aligned Slice authority');
}

function pertarRuntimeCaptureEvidence(surface, expectedDocumentToken) {
  const receipt = assessArc4RecoveryRuntimeCaptureWitness({
    witness: surface?.runtimeCaptureWitness,
    state: surface?.state,
    ui: surface?.ui,
    expectedDocumentToken,
  });
  return Object.freeze({
    witness: surface?.runtimeCaptureWitness ?? null,
    snapshots: Object.freeze({
      ui: projectArc4RecoveryRuntimeCaptureSnapshot(surface?.ui),
      state: projectArc4RecoveryRuntimeCaptureSnapshot(surface?.state),
    }),
    receipt,
  });
}

function assessPertarSurfaceObservation(surface, {
  phase, expectedDocumentToken,
} = {}) {
  const state = surface?.state;
  const ui = surface?.ui;
  const runtime = state?.persistence?.runtime;
  const uiRuntime = ui?.persistence?.runtime;
  const rows = Array.isArray(ui?.rows) ? ui.rows : [];
  const facts = projectArc4CaptureUiFacts(ui);
  const runtimeCapture = pertarRuntimeCaptureEvidence(
    surface, expectedDocumentToken,
  );
  const instrumentReasons = runtimeCapture.receipt.ok ? []
    : Object.entries(runtimeCapture.receipt.checks)
      .filter(([, value]) => value !== true).map(([name]) => name);
  const productChecks = {
    route: state?.mode === 'surface'
      && state?.gal === ARC4_PERTAR_FIXTURE.galaxy.seed
      && state?.star === ARC4_PERTAR_FIXTURE.publicStar.seed
      && state?.planet === ARC4_PERTAR_FIXTURE.planet.seed
      && state?.planetOrdinal === ARC4_PERTAR_FIXTURE.planet.ordinal
      && state?.navWorldKey === ARC4_PERTAR_FIXTURE.worldKey,
    card: ui?.cardOpen === true && ui?.cardTitle === 'Pertar',
    settled: state?.sceneResources?.pendingPersistenceWrites === 0
      && ui?.diagnostics?.pendingWork === 0,
    runtimeOrder: runtimeCapture.receipt.observed.runtimeNondecreasing === true,
    runtimeTuple: Number.isSafeInteger(runtime?.revision) && runtime.revision >= 0
      && Number.isSafeInteger(uiRuntime?.revision) && uiRuntime.revision >= 0
      && Number.isSafeInteger(runtime.sessionSeed) && runtime.sessionSeed >= 0
      && Number.isSafeInteger(uiRuntime.sessionSeed) && uiRuntime.sessionSeed >= 0
      && Number.isSafeInteger(runtime.sessionOrdinal) && runtime.sessionOrdinal >= 0
      && Number.isSafeInteger(uiRuntime.sessionOrdinal) && uiRuntime.sessionOrdinal >= 0
      && runtime.sessionDraws !== null && typeof runtime.sessionDraws === 'object'
      && !Array.isArray(runtime.sessionDraws)
      && uiRuntime.sessionDraws !== null && typeof uiRuntime.sessionDraws === 'object'
      && !Array.isArray(uiRuntime.sessionDraws)
      && Object.values(runtime.sessionDraws).every((value) =>
        Number.isSafeInteger(value) && value >= 0)
      && Object.values(uiRuntime.sessionDraws).every((value) =>
        Number.isSafeInteger(value) && value >= 0)
      && runtime.revision === uiRuntime.revision
      && runtime.sessionSeed === uiRuntime.sessionSeed
      && runtime.sessionOrdinal === uiRuntime.sessionOrdinal
      && same(runtime.sessionDraws, uiRuntime?.sessionDraws),
    presentation: phase === 'ready-visible'
      ? facts.budget.yield === ARC4_PERTAR_FIXTURE.biosphereYield
        && facts.budget.used === 0
        && facts.budget.remaining === ARC4_PERTAR_FIXTURE.biosphereYield
        && facts.budget.cycle === 0
        && rows.length === 3
        && new Set(rows.map((row) => row?.verb)).size === 3
        && rows.every((row) => ['tame', 'scavenge', 'sample'].includes(row?.verb)
          && row?.status === 'ready'
          && row?.button?.modelEnabled === 'true'
          && row?.button?.disabled === false
          && row?.button?.ariaDisabled === 'false')
      : facts.budget.yield === ARC4_PERTAR_FIXTURE.biosphereYield
        && facts.budget.used === ARC4_PERTAR_FIXTURE.biosphereYield
        && facts.budget.remaining === 0
        && facts.budget.cycle === 0
        && (phase === 'exhausted-visible'
          ? arc4ExhaustedCaptureRows(rows)
          : phase === 'exhausted-offline'
            && arc4IneligibleExhaustedCaptureRows(rows)
            && rows.every((row) => /save authority is read-only/i.test(row?.detail ?? ''))),
    runtime: phase === 'exhausted-offline'
      ? runtime?.visible === false && runtime?.answerable === false
        && runtime?.leaseOwned === false && runtime?.accruing === false
        && uiRuntime?.visible === false && uiRuntime?.answerable === false
        && uiRuntime?.leaseOwned === false && uiRuntime?.accruing === false
      : runtime?.visible === true && runtime?.answerable === true
        && runtime?.leaseOwned === true && runtime?.accruing === true
        && uiRuntime?.visible === true && uiRuntime?.answerable === true
        && uiRuntime?.leaseOwned === true && uiRuntime?.accruing === true,
  };
  const productReasons = Object.entries(productChecks)
    .filter(([, value]) => value !== true).map(([name]) => name);
  return Object.freeze({
    instrumentOk: instrumentReasons.length === 0,
    productOk: productReasons.length === 0,
    instrumentReasons: Object.freeze(instrumentReasons),
    productReasons: Object.freeze(productReasons),
    facts, runtimeCapture,
    diagnostic: Object.freeze({
      phase, expectedDocumentToken,
      documentToken: surface?.runtimeCaptureWitness?.documentToken ?? null,
      route: Object.freeze({
        mode: state?.mode ?? null, gal: state?.gal ?? null,
        star: state?.star ?? null, planet: state?.planet ?? null,
        planetOrdinal: state?.planetOrdinal ?? null,
        worldKey: state?.navWorldKey ?? null,
      }),
      cardOpen: ui?.cardOpen ?? null,
      cardTitle: ui?.cardTitle ?? null,
      facts,
      rowDetails: Object.freeze(rows.map((row) => Object.freeze({
        verb: row?.verb ?? null, detail: row?.detail ?? null,
      }))),
      runtime: Object.freeze({
        state: runtime ? Object.freeze({
          visible: runtime.visible ?? null,
          answerable: runtime.answerable ?? null,
          leaseOwned: runtime.leaseOwned ?? null,
          accruing: runtime.accruing ?? null,
          activePlayMs: runtime.activePlayMs ?? null,
          revision: runtime.revision ?? null,
        }) : null,
        ui: uiRuntime ? Object.freeze({
          visible: uiRuntime.visible ?? null,
          answerable: uiRuntime.answerable ?? null,
          leaseOwned: uiRuntime.leaseOwned ?? null,
          accruing: uiRuntime.accruing ?? null,
          activePlayMs: uiRuntime.activePlayMs ?? null,
          revision: uiRuntime.revision ?? null,
        }) : null,
      }),
      pendingWork: ui?.diagnostics?.pendingWork ?? null,
      pendingPersistenceWrites:
        state?.sceneResources?.pendingPersistenceWrites ?? null,
      heartbeatRunning: state?.persistence?.heartbeatRunning ?? null,
    }),
  });
}

async function waitForPertarSurface(send, sessionId, {
  phase = 'ready-visible', expectedDocumentToken,
} = {}) {
  const validPhases = ['ready-visible', 'exhausted-visible', 'exhausted-offline'];
  if (!validPhases.includes(phase) || typeof expectedDocumentToken !== 'string'
    || expectedDocumentToken.length === 0) {
    throw new InstrumentFailure('invalid Pertar surface observation request', {
      phase, expectedDocumentToken,
    });
  }
  const label = `${phase} Pertar surface`;
  const windowStartedAtMonotonicMs = nowMonotonicMs();
  const deadline = windowStartedAtMonotonicMs
    + ARC4_RECOVERY_PERTAR_SURFACE_TIMEOUT_MS;
  let last = null;
  let lastError = null;
  while (nowMonotonicMs() < deadline) {
    try {
      const requestedAtMonotonicMs = nowMonotonicMs();
      const remainingMs = deadline - requestedAtMonotonicMs;
      if (remainingMs <= 0) break;
      const surface = await evaluate(send, sessionId,
        `(()=>{const S=window.__CF_SLICE__,captures=[],capture=(kind,read)=>{
          const ordinal=captures.length,documentTokenBefore=S?.documentToken??null,
            startedAtPerformanceMs=globalThis.performance.now(),value=read(),
            endedAtPerformanceMs=globalThis.performance.now(),
            documentTokenAfter=S?.documentToken??null,p=value?.persistence??null,
            r=p?.runtime??null,receipt={kind,ordinal,documentTokenBefore,documentTokenAfter,
              snapshotDocumentToken:p?.documentToken??null,startedAtPerformanceMs,
              endedAtPerformanceMs,runtime:r?{activePlayMs:r.activePlayMs??null,
                revision:r.revision??null,sessionSeed:r.sessionSeed??null,
                sessionOrdinal:r.sessionOrdinal??null,sessionDraws:r.sessionDraws??null}:null};
          captures.push(receipt);return {value,receipt}},
          uiCapture=capture('ui',()=>${ARC4_CAPTURE_UI_EXPRESSION}),
          stateCapture=capture('state',()=>S?.api?.state?.()??null),
          ui=uiCapture.value,state=stateCapture.value,
          runtimeCaptureWitness={schema:${JSON.stringify(ARC4_RECOVERY_RUNTIME_CAPTURE_WITNESS_SCHEMA)},
            documentToken:S?.documentToken??null,captures};
          return {state,ui,runtimeCaptureWitness}})()`,
      'read Pertar capture surface', remainingMs);
      const completedAtMonotonicMs = nowMonotonicMs();
      const pollTiming = Object.freeze({
        schema: ARC4_RECOVERY_PERTAR_POLL_TIMING_SCHEMA,
        windowStartedAtMonotonicMs, deadlineAtMonotonicMs: deadline,
        requestedAtMonotonicMs, completedAtMonotonicMs, remainingMs,
      });
      const timingAssessment = assessArc4RecoveryPertarPollTiming(pollTiming);
      if (!timingAssessment.ok) {
        throw new InstrumentFailure(`${label} completed outside its absolute deadline`, {
          pollTiming, timingAssessment,
        });
      }
      const assessment = assessPertarSurfaceObservation(surface, {
        phase, expectedDocumentToken,
      });
      last = Object.freeze({ surface, assessment });
      lastError = null;
      if (assessment.instrumentOk && assessment.productOk) {
        return Object.freeze({
          ...surface,
          pollTiming,
          runtimeCapture: assessment.runtimeCapture,
          surfaceAssessment: assessment,
        });
      }
    } catch (error) { lastError = error; }
    await sleep(50);
  }
  if (last === null || lastError !== null || !last.assessment.instrumentOk) {
    throw new InstrumentFailure(`${label} instrument evidence timed out`, {
      lastError: lastError instanceof Error ? lastError.message : lastError,
      assessment: last?.assessment ?? null,
    });
  }
  throw new ProductFailure(`${label} product state timed out`, last.assessment);
}

async function activateSurveyDock(send, sessionId) {
  const target = await evaluate(send, sessionId, `(()=>{const button=document.getElementById('docksurvey');
    button?.scrollIntoView({block:'center',inline:'center'});button?.focus();const r=button?.getBoundingClientRect(),
    x=r?(r.left+r.right)/2:NaN,y=r?(r.top+r.bottom)/2:NaN,hit=r?document.elementFromPoint(x,y):null;
    return {ok:button?.tagName==='BUTTON'&&!!r&&r.width>=44&&r.height>=44&&!!hit&&(hit===button||button.contains(hit)),x,y}})()`,
  'locate Survey dock');
  productAssert(target?.ok === true, 'reopened Survey dock is not a 44px owned target', target);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: target.x, y: target.y }, sessionId);
  await send('Input.dispatchMouseEvent', {
    type: 'mousePressed', x: target.x, y: target.y, button: 'left', clickCount: 1,
  }, sessionId);
  await send('Input.dispatchMouseEvent', {
    type: 'mouseReleased', x: target.x, y: target.y, button: 'left', clickCount: 1,
  }, sessionId);
}

function retainPertarSurfaceEvidence(surface, phase, expectedDocumentToken) {
  const assessment = surface?.surfaceAssessment
    ?? assessPertarSurfaceObservation(surface, { phase, expectedDocumentToken });
  const runtimeCapture = surface?.runtimeCapture
    ?? pertarRuntimeCaptureEvidence(surface, expectedDocumentToken);
  return Object.freeze({
    schema: ARC4_RECOVERY_PERTAR_SURFACE_EVIDENCE_SCHEMA,
    phase, expectedDocumentToken,
    state: surface?.state ?? null,
    ui: surface?.ui ?? null,
    pollTiming: surface?.pollTiming ?? null,
    runtimeCaptureWitness: surface?.runtimeCaptureWitness ?? null,
    runtimeCapture,
    assessment,
  });
}

function replayPertarSurfaceEvidence(evidence) {
  const surface = Object.freeze({
    state: evidence?.state ?? null,
    ui: evidence?.ui ?? null,
    runtimeCaptureWitness: evidence?.runtimeCaptureWitness ?? null,
  });
  const phase = evidence?.phase;
  const expectedDocumentToken = evidence?.expectedDocumentToken;
  return Object.freeze({
    runtimeCapture: pertarRuntimeCaptureEvidence(surface, expectedDocumentToken),
    assessment: assessPertarSurfaceObservation(surface, {
      phase, expectedDocumentToken,
    }),
  });
}

function replayPertarStageSurfaces(stages) {
  const evidenceFor = (id, key) => stages.find(
    (stage) => stage?.id === id,
  )?.evidence?.[key];
  return Object.freeze({
    exhausted: replayPertarSurfaceEvidence(
      evidenceFor('exhausted', 'pertarSurface'),
    ),
    offlineReopened: replayPertarSurfaceEvidence(
      evidenceFor('offline-reopened', 'pertarSurface'),
    ),
    reactivated: replayPertarSurfaceEvidence(
      evidenceFor('active-observation', 'reactivatedPertarSurface'),
    ),
  });
}

function browserSample(browser) {
  return Object.freeze({
    executable: browser.executable, product: browser.product,
    revision: browser.revision, userAgent: browser.user_agent,
    jsVersion: browser.js_version, protocolVersion: browser.protocol_version,
  });
}
function rootVersionSample(version) {
  return Object.freeze({
    product: version.product, revision: version.revision,
    protocolVersion: version.protocolVersion,
  });
}

async function collectServiceTurn({ send, sessionId, targetId, index }) {
  const nodeStartedAtMonotonicMs = nowMonotonicMs();
  await send('Target.activateTarget', { targetId });
  await send('Emulation.setFocusEmulationEnabled', { enabled: true }, sessionId);
  const browserBefore = rootVersionSample(await send('Browser.getVersion'));
  const target = await evaluate(
    send, sessionId, serviceTurnExpression(index), `service turn ${index}`,
  );
  const browserAfter = rootVersionSample(await send('Browser.getVersion'));
  const nodeEndedAtMonotonicMs = nowMonotonicMs();
  return Object.freeze({
    schema: ARC4_RECOVERY_SERVICE_SCHEMA, index,
    nodeStartedAtMonotonicMs, nodeEndedAtMonotonicMs,
    browserBefore, browserAfter, target,
  });
}

async function prepareDisabledSuppressionTarget(send, sessionId) {
  return evaluate(send, sessionId, `(async()=>{
      window.__cfArc4RecoverySuppressionAbort?.abort();
      delete window.__cfArc4RecoverySuppressionAbort;
      delete window.__cfArc4RecoverySuppressionTrace;
      delete window.__cfArc4RecoverySuppressionPreparation;
      const requestedVerb='tame',selector='#survey button[data-capture-action="tame"]',
        survey=document.querySelector('#survey'),matches=[...document.querySelectorAll(selector)],
        button=matches.length===1?matches[0]:null,card=survey,
        controller=new AbortController(),
        documentTokenBefore=window.__CF_SLICE__?.documentToken??null,
        priorScroll=survey?{left:survey.scrollLeft,top:survey.scrollTop}:null;
      const record={survey,button,card,documentTokenBefore,priorScroll};
      window.__cfArc4RecoverySuppressionAbort=controller;
      window.__cfArc4RecoverySuppressionPreparation=record;
      const sample=()=>{const currentSurvey=document.querySelector('#survey'),
        currentMatches=[...document.querySelectorAll(selector)],currentButton=currentMatches.length===1
          ?currentMatches[0]:null,S=window.__CF_SLICE__,r=button?.getBoundingClientRect()??null,
        cr=card?.getBoundingClientRect()??null,x=r?(r.left+r.right)/2:NaN,
        y=r?(r.top+r.bottom)/2:NaN,hit=Number.isFinite(x)&&Number.isFinite(y)
          ?document.elementFromPoint(x,y):null;
        return {documentToken:S?.documentToken??null,sameButton:currentButton===button,
          sameSurvey:currentSurvey===survey,connected:button?.isConnected===true
            &&survey?.isConnected===true,button:{tag:button?.tagName??null,
              verb:button?.getAttribute('data-capture-action')??null,
              disabled:button?.disabled??null,
              modelEnabled:button?.getAttribute('data-model-enabled')??null,
              ariaDisabled:button?.getAttribute('aria-disabled')??null,
              rect:r?{left:r.left,top:r.top,right:r.right,bottom:r.bottom,
                width:r.width,height:r.height}:null},
          cardRect:cr?{left:cr.left,top:cr.top,right:cr.right,bottom:cr.bottom,
            width:cr.width,height:cr.height}:null,
          viewport:{width:innerWidth,height:innerHeight},scroll:survey?{left:survey.scrollLeft,
            top:survey.scrollTop,clientWidth:survey.clientWidth,clientHeight:survey.clientHeight,
            scrollWidth:survey.scrollWidth,scrollHeight:survey.scrollHeight}:null,
          point:{x:Number.isFinite(x)?x:null,y:Number.isFinite(y)?y:null,
            hitTag:hit?.tagName??null,hitVerb:hit instanceof Element
              ?hit.closest('button[data-capture-action]')?.getAttribute('data-capture-action')??null:null,
            owned:!!hit&&!!button&&(hit===button||button.contains(hit))}}};
      record.sample=sample;
      const initial=sample();
      button?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});
      const settle=()=>new Promise((resolve)=>requestAnimationFrame(()=>setTimeout(
        ()=>requestAnimationFrame(()=>setTimeout(resolve,0)),0)));
      await settle();
      const first=sample();
      await settle();
      const second=sample();
      return {schema:'cf-v2-arc4-disabled-target/v1',selectorCount:matches.length,
        documentTokenBefore,documentTokenAfter:window.__CF_SLICE__?.documentToken??null,
        requestedVerb,priorScroll,initial,first,second}})()`,
  'prepare stable disabled Tame target');
}

async function collectSuppression(send, sessionId) {
  const requestedVerb = 'tame';
  let exhaustedRaw = null;
  let exhaustedState = null;
  let exhaustedUi = null;
  let target = null;
  let trace = null;
  let beforeRaw = null;
  let beforeState = null;
  let afterRaw = null;
  let afterState = null;
  let targetAssessment = null;
  let collectionError = null;
  let heartbeat = Object.freeze({ quiesced: null, resumed: null });
  let restoration = Object.freeze({
    attempted: false, complete: false, documentToken: null, before: null, after: null,
    abortSignalAborted: false,
    globalsAbsent: Object.freeze({ abort: false, trace: false, preparation: false }),
  });
  const dispatch = {
    requested: false, inputDispatched: false, documentToken: null, x: null, y: null,
  };
  try {
    const quiesced = await evaluate(send, sessionId,
      'window.__CF_SLICE__.api.__smokeQuiesceF4Heartbeat()',
      'quiesce F4 heartbeat for disabled suppression');
    heartbeat = Object.freeze({ quiesced, resumed: null });
    exhaustedRaw = await evaluate(send, sessionId, ARC4_DURABLE_READ_EXPRESSION,
      'read synchronized exhausted authority');
    exhaustedState = await evaluate(send, sessionId, 'window.__CF_SLICE__.api.state()',
      'read synchronized exhausted state');
    exhaustedUi = await evaluate(send, sessionId, ARC4_CAPTURE_UI_EXPRESSION,
      'read synchronized exhausted UI');
    target = await prepareDisabledSuppressionTarget(send, sessionId);
    targetAssessment = assessArc4DisabledTargetEvidence(target);
    if (targetAssessment.instrumentOk && targetAssessment.productOk) {
      beforeRaw = await evaluate(send, sessionId, ARC4_DURABLE_READ_EXPRESSION,
        'read suppression before authority');
      beforeState = await evaluate(send, sessionId, 'window.__CF_SLICE__.api.state()',
        'read suppression before state');
    }
    if (targetAssessment.instrumentOk && targetAssessment.productOk
      && same(beforeRaw, exhaustedRaw)) {
      await evaluate(send, sessionId, `(()=>{const record=window.__cfArc4RecoverySuppressionPreparation,
      button=record?.button,controller=window.__cfArc4RecoverySuppressionAbort??null,
      trace={pointer:[],clicks:[]},
      row=(event)=>{const eventButton=event.target instanceof Element
        ?event.target.closest('button[data-capture-action]'):null;
        if(eventButton!==button)return null;return {verb:eventButton.getAttribute('data-capture-action'),
          trusted:event.isTrusted===true,pointerType:event.pointerType||null,
          clientX:Number.isFinite(event.clientX)?event.clientX:null,
          clientY:Number.isFinite(event.clientY)?event.clientY:null,
          documentToken:window.__CF_SLICE__?.documentToken??null}};
      if(!(controller instanceof AbortController)||controller.signal.aborted)throw new Error(
        'disabled suppression AbortController ownership is red');
      document.addEventListener('pointerdown',(event)=>{const value=row(event);if(value)trace.pointer.push(value)},
        {capture:true,signal:controller.signal});
      document.addEventListener('click',(event)=>{const value=row(event);if(value)trace.clicks.push(value)},
        {capture:true,signal:controller.signal});
      window.__cfArc4RecoverySuppressionTrace=trace;return true})()`,
      'arm stable disabled suppression trace');
      const armedSample = await evaluate(send, sessionId,
        'window.__cfArc4RecoverySuppressionPreparation?.sample?.()??null',
        'revalidate armed disabled suppression target');
      target = Object.freeze({ ...target, second: armedSample });
      targetAssessment = assessArc4DisabledTargetEvidence(target);
      if (targetAssessment.instrumentOk && targetAssessment.productOk) {
        dispatch.requested = true;
        dispatch.documentToken = target.documentTokenAfter;
        dispatch.x = target.second.point.x;
        dispatch.y = target.second.point.y;
        await send('Input.dispatchMouseEvent', {
          type: 'mouseMoved', x: dispatch.x, y: dispatch.y,
        }, sessionId);
        await send('Input.dispatchMouseEvent', {
          type: 'mousePressed', x: dispatch.x, y: dispatch.y, button: 'left', clickCount: 1,
        }, sessionId);
        await send('Input.dispatchMouseEvent', {
          type: 'mouseReleased', x: dispatch.x, y: dispatch.y, button: 'left', clickCount: 1,
        }, sessionId);
        dispatch.inputDispatched = true;
        await sleep(200);
      }
    }
  } catch (error) {
    collectionError = error;
  } finally {
    try {
      const cleanup = await evaluate(send, sessionId, `(async()=>{
        const record=window.__cfArc4RecoverySuppressionPreparation??null,
          captured=window.__cfArc4RecoverySuppressionTrace??null,
          controller=window.__cfArc4RecoverySuppressionAbort??null,
          survey=record?.survey??null,before=record?.priorScroll??null,
          attempted=record!==null;
        controller?.abort();
        if(attempted&&survey&&before){survey.scrollLeft=before.left;survey.scrollTop=before.top}
        await new Promise((resolve)=>requestAnimationFrame(()=>setTimeout(
          ()=>requestAnimationFrame(()=>setTimeout(resolve,0)),0)));
        const after=survey?{left:survey.scrollLeft,top:survey.scrollTop}:null,
          documentToken=window.__CF_SLICE__?.documentToken??null,
          scrollComplete=before===null?survey===null&&after===null:
            survey?.isConnected===true&&after?.left===before.left&&after?.top===before.top,
          complete=attempted&&scrollComplete;
        delete window.__cfArc4RecoverySuppressionAbort;
        delete window.__cfArc4RecoverySuppressionTrace;
        delete window.__cfArc4RecoverySuppressionPreparation;
        const abortSignalAborted=controller?.signal?.aborted===true,
          globalsAbsent={
            abort:!('__cfArc4RecoverySuppressionAbort' in window),
            trace:!('__cfArc4RecoverySuppressionTrace' in window),
            preparation:!('__cfArc4RecoverySuppressionPreparation' in window)};
        return {trace:captured,restoration:{attempted,complete,documentToken,before,after,
          abortSignalAborted,globalsAbsent}}})()`,
      'restore Survey after disabled suppression');
      trace = cleanup?.trace ?? null;
      restoration = cleanup?.restoration ?? restoration;
    } catch (cleanupError) {
      if (!collectionError) collectionError = cleanupError;
      else collectionError = new Error(`${collectionError.message}; cleanup: ${cleanupError.message}`);
    }
    try {
      const resumed = await evaluate(send, sessionId,
        'window.__CF_SLICE__.api.__smokeResumeF4Heartbeat()',
        'resume F4 heartbeat after disabled suppression');
      heartbeat = Object.freeze({ ...heartbeat, resumed });
    } catch (resumeError) {
      if (!collectionError) collectionError = resumeError;
      else collectionError = new Error(`${collectionError.message}; heartbeat: ${
        resumeError instanceof Error ? resumeError.message : String(resumeError)}`);
    }
  }
  if (dispatch.inputDispatched && collectionError === null) {
    try {
      afterRaw = await evaluate(send, sessionId, ARC4_DURABLE_READ_EXPRESSION,
        'read suppression after cleanup authority');
      afterState = await evaluate(send, sessionId, 'window.__CF_SLICE__.api.state()',
        'read suppression after cleanup state');
    } catch (outcomeError) {
      collectionError = outcomeError;
    }
  }
  const suppressed = Object.freeze({
    schema: 'cf-v2-arc4-disabled-suppression/v1', verb: requestedVerb,
    target, trace, dispatch: Object.freeze({ ...dispatch }), heartbeat,
    beforeRaw, afterRaw, beforeState, afterState, restoration,
  });
  const finalTargetAssessment = targetAssessment ?? assessArc4DisabledTargetEvidence(target);
  const assessment = assessArc4DisabledSuppressionEvidence(
    suppressed, { exhaustedRaw, exhaustedState },
  );
  const cleanupChecks = Object.freeze({
    restorationShape: assessment.instrumentChecks.restorationShape === true,
    restorationComplete: assessment.instrumentChecks.restorationComplete === true,
  });
  const cleanupIntegrity = Object.values(cleanupChecks).every((value) => value === true);
  assertDisabledSuppressionVerdicts({
    collectionError, suppressed, finalTargetAssessment, assessment,
    cleanupIntegrity, cleanupChecks, exhaustedRaw, beforeRaw,
  });
  return Object.freeze({ suppressed, exhaustedRaw, exhaustedState, exhaustedUi });
}

function assertDisabledSuppressionVerdicts({
  collectionError, suppressed, finalTargetAssessment, assessment,
  cleanupIntegrity, cleanupChecks, exhaustedRaw, beforeRaw,
}) {
  instrumentAssert(collectionError === null,
    collectionError?.message || 'disabled suppression collection is red',
    { suppressed, targetAssessment: finalTargetAssessment, assessment });
  instrumentAssert(finalTargetAssessment.instrumentOk,
    'disabled Tame target instrument evidence is red',
    { suppressed, targetAssessment: finalTargetAssessment });
  instrumentAssert(cleanupIntegrity,
    'disabled suppression cleanup integrity is red',
    { suppressed, cleanupChecks, assessment });
  productAssert(finalTargetAssessment.productOk,
    'disabled Tame target product evidence is red',
    { suppressed, targetAssessment: finalTargetAssessment });
  instrumentAssert(assessment.instrumentOk, 'disabled suppression instrument evidence is red',
    { suppressed, assessment });
  productAssert(same(beforeRaw, exhaustedRaw),
    'durable authority moved before disabled suppression',
    { suppressed, exhaustedRaw, beforeRaw });
  productAssert(assessment.productOk, 'disabled suppression product evidence is red',
    { suppressed, assessment });
}

function initialStages() {
  return ARC4_RECOVERY_STAGE_ORDER.map((id) => ({ id, status: 'not-run', evidence: null }));
}
function mergeRecoveryStageEvidence(prior, next) {
  if (prior && typeof prior === 'object' && !Array.isArray(prior)
    && next && typeof next === 'object' && !Array.isArray(next)) {
    return Object.freeze({ ...prior, ...next });
  }
  return next ?? prior ?? null;
}
function updateRecoveryStage(stages, id, status, evidence) {
  const index = ARC4_RECOVERY_STAGE_ORDER.indexOf(id);
  assert(index >= 0, `unknown Arc 4 recovery stage ${id}`);
  return stages.map((stage, stageIndex) => stageIndex === index ? {
    id, status: status ?? stage.status,
    evidence: mergeRecoveryStageEvidence(stage.evidence, evidence),
  } : stage);
}
function unavailableSource(reason) {
  const digest = sha256(String(reason));
  return Object.freeze({
    commit: null, branch: 'unavailable', state: 'unavailable',
    statusSha256: digest, workingTreeSha256: digest,
  });
}
function runningReport(id, startedAt, predecessorSelection) {
  const source = unavailableSource('source not captured');
  const artifacts = recoveryArtifactPaths(id);
  return {
    schema: ARC4_RECOVERY_REPORT_SCHEMA, status: 'running', runId: id,
    terminal: false,
    artifact: { path: artifacts.reportRelative,
      provenance: 'The unique run artifact is authority; the fixed-name report is a mutable current pointer only.' },
    lifecycle: { schema: ARC4_RECOVERY_LIFECYCLE_SCHEMA, status: 'pending' },
    startedAt: startedAt.toISOString(), endedAt: null, durationMs: null,
    policy: POLICY, source: { begin: source, end: source }, inputs: {},
    build: null, browser: null, origin: null,
    stages: initialStages(), firstFailure: null,
    recoveryBundle: null, observationInput: null,
    domainAssessment: null, observationVerdict: null,
    ordinarySliceSeal: null, instrumentSeal: null,
    predecessorSelection: { ...predecessorSelection }, predecessors: null,
    fatalEvents: [], findings: [],
    cleanup: { browser: false, server: false, browserContext: false, workspaceLock: false },
  };
}

async function runCertificate(options) {
  const id = runId();
  const startedAt = new Date();
  const artifacts = recoveryArtifactPaths(id);
  let report = runningReport(id, startedAt, options);
  atomicWriteJson(currentReportPath, report);
  atomicCreateJson(artifacts.report, report);
  let releaseLock = null;
  let server = null;
  let browser = null;
  let browserContextId = null;
  let targetId = null;
  let sessionId = null;
  let sourceBegin = unavailableSource('source capture pending');
  let sourceEnd = sourceBegin;
  let build = null;
  let ordinarySliceSeal = null;
  let instrumentSeal = null;
  let predecessors = null;
  let recoveryBundle = null;
  let observationInput = null;
  let domainAssessment = null;
  let observationVerdict = null;
  const fatalEvents = [];
  const findings = [];
  const cleanup = { browser: false, server: false, browserContext: false, workspaceLock: false };
  let currentStage = 'fixture';
  let provisionalStatus = 'instrument-fail';
  let provisionalExitCode = 2;
  const targetDestroyedEvents = [];
  const persistRunning = () => {
    report = {
      ...report, source: { begin: sourceBegin, end: sourceEnd },
      build, browser: report.browser, stages: report.stages,
      recoveryBundle, observationInput, domainAssessment, observationVerdict,
      ordinarySliceSeal, instrumentSeal, fatalEvents: [...fatalEvents], findings: [...findings],
      predecessors,
      cleanup: { ...cleanup },
    };
    atomicWriteJson(artifacts.report, report);
    atomicWriteJson(currentReportPath, report);
  };
  const markStage = (idValue, status, evidence = null) => {
    report.stages = updateRecoveryStage(report.stages, idValue, status, evidence);
    if (status === 'fail' && report.firstFailure === null) {
      report.firstFailure = { stage: idValue, message: String(evidence?.message || evidence) };
    }
    persistRunning();
  };
  const passStage = (idValue, evidence = null) => markStage(idValue, 'pass', evidence);
  const retainStageEvidence = (idValue, evidence) => {
    report.stages = updateRecoveryStage(report.stages, idValue, 'running', evidence);
    persistRunning();
  };
  try {
    releaseLock = acquireWorkspaceLock('v2 Arc 4 real-time recovery certificate');
    sourceBegin = sourceIdentity(); sourceEnd = sourceBegin;
    assert(sourceBegin.state === 'committed',
      'Arc 4 recovery certification requires committed clean source');
    predecessors = resolvePredecessors(options, sourceBegin);
    ordinarySliceSeal = assessOrdinarySliceRecoverySeal(
      fs.readFileSync(ordinarySlicePath, 'utf8'),
    );
    instrumentSeal = assessArc4RecoveryInstrumentSeal(
      fs.readFileSync(collectorPath, 'utf8'), PAGE_EVIDENCE_SOURCES,
    );
    report = {
      ...report, source: { begin: sourceBegin, end: sourceBegin },
      inputs: inputIdentity(null, predecessors), ordinarySliceSeal, instrumentSeal,
      predecessors,
    };
    persistRunning();
    assert(ordinarySliceSeal.ok, 'ordinary Slice recovery non-claim seal is red');
    assert(instrumentSeal.ok, 'Arc 4 recovery no-forged-time instrument seal is red');
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    execFileSync(npm, ['run', 'build'], { cwd: appDir, stdio: 'inherit' });
    build = distIdentity();
    report = { ...report, build, inputs: inputIdentity(build.sha256, predecessors) };
    persistRunning();
    server = await serveDist();
    report = { ...report, origin: server.origin };
    persistRunning();
    browser = await openChromiumCdp({
      label: 'Arc 4 real-time recovery certificate',
      userDataPrefix: 'cf-arc4-recovery', commandTimeoutMs: COMMAND_TIMEOUT_MS,
      startupTimeoutMs: 45_000, webSocketOpenTimeoutMs: 15_000,
      shutdownTimeoutMs: 5_000,
      onEvent: (message) => {
        if (message.method === 'Target.targetDestroyed') {
          targetDestroyedEvents.push({
            method: message.method,
            targetId: message.params?.targetId ?? null,
            receivedAtMonotonicMs: nowMonotonicMs(),
          });
        }
        const fatal = message.method === 'Runtime.exceptionThrown'
          || message.method === 'Inspector.targetCrashed'
          || message.method === 'Target.targetCrashed'
          || (message.method === 'Runtime.consoleAPICalled'
            && message.params?.type === 'error')
          || (message.method === 'Log.entryAdded'
            && message.params?.entry?.level === 'error');
        if (fatal) fatalEvents.push({
          method: message.method, sessionId: message.sessionId ?? null,
          params: message.params ?? null,
        });
      },
    });
    const send = browser.send;
    report = { ...report, browser: browserSample(browser.browser) };
    persistRunning();
    await send('Target.setDiscoverTargets', { discover: true });
    browserContextId = (await send('Target.createBrowserContext')).browserContextId;
    const initialTarget = await send('Target.createTarget', {
      url: 'about:blank', browserContextId,
    });
    targetId = initialTarget.targetId;
    sessionId = (await send('Target.attachToTarget', {
      targetId, flatten: true,
    })).sessionId;
    await configureTarget(send, targetId, sessionId);
    await send('Page.navigate', { url: server.origin }, sessionId);
    const initialToken = await waitForSlice(send, sessionId);
    await waitForWritable(send, sessionId, initialToken);
    const preload = await send('Page.addScriptToEvaluateOnNewDocument', {
      source: SEED_PRELOAD_SOURCE,
    }, sessionId);
    productAssert(typeof preload?.identifier === 'string',
      'bounded seed preload did not install', preload);
    const pertarRaw = buildPertarRaw();
    try {
      await evaluate(send, sessionId,
        `window.__CF_SLICE__.api.importBlob(${JSON.stringify(pertarRaw)})`,
        'import Pertar recovery fixture');
    } catch { /* successful replacement destroys this execution context */ }
    const fixtureToken = await waitForSlice(send, sessionId, initialToken);
    const sourceState = await waitForWritable(send, sessionId, fixtureToken);
    await send('Page.removeScriptToEvaluateOnNewDocument', {
      identifier: preload.identifier,
    }, sessionId);
    const seedWitness = await evaluate(send, sessionId,
      'globalThis.__cfArc4RecoverySeedFixture??null', 'read seed witness');
    productAssert(seedWitness?.schema === 'cf-v2-arc4-recovery-seed-fixture/v1'
      && seedWitness.seed === ARC4_PERTAR_FIXTURE.sessionSeed
      && seedWitness.seedCalls === 1 && seedWitness.nativeFallbackCalls === 0,
    'Pertar recovery fixture did not own exactly one seed read', seedWitness);
    const landing = await evaluate(send, sessionId,
      `window.__CF_SLICE__.api.landOn(${JSON.stringify(ARC4_PERTAR_FIXTURE.planet)})`,
      'land on Pertar');
    productAssert(landing === true, 'Pertar recovery fixture landing was rejected', landing);
    await waitForWritable(send, sessionId, fixtureToken);
    const preRaw = await evaluate(send, sessionId, ARC4_DURABLE_READ_EXPRESSION,
      'read Pertar precondition authority');
    const surface = await waitForPertarSurface(send, sessionId, {
      phase: 'ready-visible', expectedDocumentToken: fixtureToken,
    });
    const runtimeCaptureEvidence = surface.runtimeCapture;
    instrumentAssert(runtimeCaptureEvidence.receipt.ok,
      'Pertar recovery runtime capture receipt is red', runtimeCaptureEvidence);
    const preconditionInput = Object.freeze({
      raw: preRaw, state: surface.state, ui: surface.ui,
      routeError: null, authorityReady: true,
    });
    const precondition = assessArc4CapturePrecondition(preconditionInput);
    productAssert(precondition.ok, 'Pertar recovery precondition is red', {
      runtimeCapture: runtimeCaptureEvidence, preconditionInput, precondition,
    });
    passStage('fixture', {
      documentToken: fixtureToken, seedWitness, preconditionInput, precondition,
      runtimeCapture: runtimeCaptureEvidence,
      sourceRoute: {
        mode: sourceState.mode, star: sourceState.star,
        savedView: sourceState.save?.savedView ?? null,
      },
    });

    currentStage = 'burn-down';
    let burnRaw = preRaw;
    const burnLedger = [];
    for (let expectedUsed = 1;
      expectedUsed <= ARC4_PERTAR_FIXTURE.biosphereYield; expectedUsed++) {
      const beforeUi = await waitForValue(async () => evaluate(send, sessionId,
        `(()=>{const ui=${ARC4_CAPTURE_UI_EXPRESSION};return ui?.budget?.used===${expectedUsed - 1}
          &&ui?.diagnostics?.pendingWork===0?ui:null})()`,
      `read burn UI ${expectedUsed - 1}`), `burn UI ${expectedUsed - 1}`);
      const ready = beforeUi.rows.find((row) => row?.status === 'ready'
        && row?.button?.modelEnabled === 'true');
      productAssert(ready && ['tame', 'scavenge', 'sample'].includes(ready.verb),
        `no authoritative capture verb at used=${expectedUsed - 1}`, beforeUi);
      const before = burnRaw;
      const action = await evaluate(send, sessionId,
        `window.__CF_SLICE__.api.__smokeCaptureCurrentSurface(${JSON.stringify(ready.verb)})`,
        `capture burn ${expectedUsed}`);
      const afterState = await waitForValue(async () => evaluate(send, sessionId,
        `(()=>{const state=window.__CF_SLICE__.api.state(),c=state?.capture?.actionCoordinator;
          return c?.inFlight===false&&c?.owner?.busy===false&&state?.capture?.card?.pendingWork===0
            &&state?.capture?.revision===${expectedUsed}?state:null})()`,
      `read burn state ${expectedUsed}`), `burn settlement ${expectedUsed}`);
      const after = await evaluate(send, sessionId, ARC4_DURABLE_READ_EXPRESSION,
        `read burn authority ${expectedUsed}`);
      const assessment = assessArc4BurnStep({
        before, after, beforeUi, outcome: action,
        verb: ready.verb, expectedUsed, afterState,
      });
      productAssert(assessment.ok, `capture burn ${expectedUsed} is red`, assessment);
      burnLedger.push({
        expectedUsed, verb: ready.verb, revision: after.revision,
        ordinal: after.authority?.sessionRng?.ordinal,
        receiptCount: after.receiptKeys?.length, hit: action?.result?.hit,
        assessment,
      });
      burnRaw = after;
    }
    passStage('burn-down', {
      steps: burnLedger.length, ledger: burnLedger,
    });

    currentStage = 'exhausted';
    const exhaustedSurface = await waitForPertarSurface(send, sessionId, {
      phase: 'exhausted-visible', expectedDocumentToken: fixtureToken,
    });
    const synchronizedExhaustion = await collectSuppression(send, sessionId);
    const {
      suppressed, exhaustedRaw, exhaustedState, exhaustedUi,
    } = synchronizedExhaustion;
    const exhaustion = assessArc4Exhaustion({
      exhaustedRaw, exhaustedState, exhaustedUi, suppressed,
    });
    productAssert(same(exhaustedSurface.surfaceAssessment.facts,
      projectArc4CaptureUiFacts(exhaustedUi)),
    'synchronized exhausted UI disagreed with the settled visible surface', {
      settledSurface: exhaustedSurface.surfaceAssessment,
      synchronizedFacts: projectArc4CaptureUiFacts(exhaustedUi),
    });
    productAssert(exhaustion.ok, 'Arc 4 exhaustion presentation is red', exhaustion);
    passStage('exhausted', {
      assessment: exhaustion, suppressed,
      pertarSurface: retainPertarSurfaceEvidence(
        exhaustedSurface, 'exhausted-visible', fixtureToken,
      ),
    });

    currentStage = 'close-checkpoint';
    const checkpointStartedAtMonotonicMs = nowMonotonicMs();
    const checkpoint = await evaluate(send, sessionId,
      'window.__CF_SLICE__.api.__smokeCheckpointAndHideF4()',
      'checkpoint and freeze active authority');
    const checkpointCompletedAtMonotonicMs = nowMonotonicMs();
    void checkpoint;
    const closedRaw = await evaluate(send, sessionId, ARC4_DURABLE_READ_EXPRESSION,
      'read close-checkpoint authority');
    const closedState = await evaluate(send, sessionId,
      'window.__CF_SLICE__.api.state()', 'read close-checkpoint state');
    const closedRuntime = closedState?.persistence?.runtime;
    productAssert(closedRuntime?.visible === false
      && closedRuntime?.answerable === false && closedRuntime?.leaseOwned === false
      && closedRuntime?.accruing === false,
    'close checkpoint did not synchronously freeze foreground authority', closedState?.persistence);
    passStage('close-checkpoint', {
      checkpointStartedAtMonotonicMs, checkpointCompletedAtMonotonicMs,
      hideWitness: closedState?.persistence?.hideWitness ?? null,
      activePlayMs: closedRaw?.authority?.activePlayMs,
    });

    currentStage = 'offline-closed';
    const closedTargetId = targetId;
    const closedDocumentToken = closedState?.persistence?.documentToken;
    const closeRequestedAtMonotonicMs = nowMonotonicMs();
    const closeResult = await send('Target.closeTarget', { targetId: closedTargetId });
    const closeConfirmedAtMonotonicMs = nowMonotonicMs();
    productAssert(closeResult?.success === true,
      'CDP did not confirm target closure', closeResult);
    targetId = null; sessionId = null;
    const closedFacts = await waitForValue(async () => {
      const targets = await send('Target.getTargets');
      const absent = !targets.targetInfos.some((entry) => entry.targetId === closedTargetId);
      const targetDestroyedEvent = targetDestroyedEvents.find(
        (entry) => entry.targetId === closedTargetId,
      );
      return absent && targetDestroyedEvent
        ? {
          absent, destroyed: true, targetDestroyedEvent,
          postCloseInventoryObservedAtMonotonicMs: nowMonotonicMs(),
          postCloseTargetInventory: targets.targetInfos.map((entry) => ({
            targetId: entry.targetId, type: entry.type ?? null,
            url: entry.url ?? null, attached: entry.attached ?? null,
            browserContextId: entry.browserContextId ?? null,
          })).sort((left, right) => codeUnitCompare(left.targetId, right.targetId)),
        } : null;
    }, 'closed target destruction', 5_000);
    passStage('offline-closed', {
      closedTargetId, closeAccepted: true,
      targetDestroyedObserved: closedFacts.destroyed,
      closedTargetAbsent: closedFacts.absent,
      targetDestroyedEvent: closedFacts.targetDestroyedEvent,
      postCloseInventoryObservedAtMonotonicMs:
        closedFacts.postCloseInventoryObservedAtMonotonicMs,
      postCloseTargetInventory: closedFacts.postCloseTargetInventory,
      closeRequestedAtMonotonicMs, closeConfirmedAtMonotonicMs,
    });
    await sleep(OFFLINE_MIN_MS);

    currentStage = 'offline-reopened';
    const reopenedTarget = await send('Target.createTarget', {
      url: 'about:blank', browserContextId,
    });
    targetId = reopenedTarget.targetId;
    const reopenedAtMonotonicMs = nowMonotonicMs();
    sessionId = (await send('Target.attachToTarget', {
      targetId, flatten: true,
    })).sessionId;
    await configureTarget(send, targetId, sessionId);
    const reopenedClockScript = await send('Page.addScriptToEvaluateOnNewDocument', {
      source: REOPEN_DOCUMENT_CLOCK_SOURCE,
    }, sessionId);
    productAssert(typeof reopenedClockScript?.identifier === 'string',
      'reopened document clock preload did not install', reopenedClockScript);
    await send('Page.navigate', { url: server.origin }, sessionId);
    const reopenedDocumentToken = await waitForSlice(send, sessionId);
    await waitForIneligibleAligned(send, sessionId, reopenedDocumentToken);
    await send('Page.removeScriptToEvaluateOnNewDocument', {
      identifier: reopenedClockScript.identifier,
    }, sessionId);
    productAssert(reopenedDocumentToken !== closedDocumentToken,
      'offline reopen reused the closed document token', {
        closedDocumentToken, reopenedDocumentToken,
    });
    await activateSurveyDock(send, sessionId);
    const offlineRaw = await evaluate(send, sessionId, ARC4_DURABLE_READ_EXPRESSION,
      'read offline-reopened authority');
    const offlineSurface = await waitForPertarSurface(send, sessionId, {
      phase: 'exhausted-offline', expectedDocumentToken: reopenedDocumentToken,
    });
    const offlineState = offlineSurface.state;
    const offlineUi = offlineSurface.ui;
    const offlineDocumentClock = await evaluate(send, sessionId,
      `(()=>{const clock=globalThis.__cfArc4RecoveryDocumentClock;return {
        schema:clock?.schema??null,
        startedAtPerformanceMs:clock?.startedAtPerformanceMs??null,
        observedAtPerformanceMs:Math.trunc(performance.now())}})()`,
      'read reopened document clock');
    const offlineObservedAtMonotonicMs = nowMonotonicMs();
    const offlineElapsedMs = offlineObservedAtMonotonicMs
      - closeConfirmedAtMonotonicMs;
    const closure = {
      schema: ARC4_RECOVERY_CLOSURE_EVIDENCE_SCHEMA,
      closedTargetId, reopenedTargetId: targetId,
      closedDocumentToken, reopenedDocumentToken,
      closeAccepted: true,
      targetDestroyedObserved: closedFacts.destroyed,
      closedTargetAbsent: closedFacts.absent,
      targetDestroyedEvent: closedFacts.targetDestroyedEvent,
      postCloseInventoryObservedAtMonotonicMs:
        closedFacts.postCloseInventoryObservedAtMonotonicMs,
      postCloseTargetInventory: closedFacts.postCloseTargetInventory,
      checkpointStartedAtMonotonicMs, checkpointCompletedAtMonotonicMs,
      closeRequestedAtMonotonicMs, closeConfirmedAtMonotonicMs,
      reopenedAtMonotonicMs, offlineObservedAtMonotonicMs,
      reopenedDocumentStartedAtPerformanceMs:
        offlineDocumentClock?.startedAtPerformanceMs ?? null,
      offlineObservedAtDocumentPerformanceMs:
        offlineDocumentClock?.observedAtPerformanceMs ?? null,
    };
    const reopenedDocumentElapsedMs = closure.offlineObservedAtDocumentPerformanceMs
      - closure.reopenedDocumentStartedAtPerformanceMs;
    const offlineStateActivePlayMs = offlineState?.persistence?.runtime?.activePlayMs;
    const offlineUiActivePlayMs = offlineUi?.persistence?.runtime?.activePlayMs;
    productAssert(offlineElapsedMs >= 1_000
      && offlineDocumentClock?.schema
        === 'cf-v2-arc4-recovery-document-clock/v1'
      && Number.isSafeInteger(reopenedDocumentElapsedMs)
      && reopenedDocumentElapsedMs >= 0
      && offlineRaw?.authority?.activePlayMs === closedRaw?.authority?.activePlayMs
      && offlineStateActivePlayMs === offlineRaw?.authority?.activePlayMs
      && offlineUiActivePlayMs === offlineRaw?.authority?.activePlayMs
      && offlineState?.persistence?.runtime?.visible === false
      && offlineState?.persistence?.runtime?.answerable === false
      && offlineState?.persistence?.runtime?.leaseOwned === false
      && offlineState?.persistence?.runtime?.accruing === false
      && offlineUi?.persistence?.runtime?.visible === false
      && offlineUi?.persistence?.runtime?.answerable === false
      && offlineUi?.persistence?.runtime?.leaseOwned === false
      && offlineUi?.persistence?.runtime?.accruing === false
      && offlineUi?.budget?.used === ARC4_PERTAR_FIXTURE.biosphereYield
      && offlineUi?.budget?.remaining === 0
      && arc4IneligibleExhaustedCaptureRows(offlineUi?.rows)
      && offlineState?.ownershipV2?.bootstrapOutcome === 'already-aligned',
    'true offline closure advanced or rewrote exhausted authority', {
      closure, offlineElapsedMs, closedActivePlayMs: closedRaw?.authority?.activePlayMs,
      offlineActivePlayMs: offlineRaw?.authority?.activePlayMs,
      budget: offlineUi?.budget, ownershipV2: offlineState?.ownershipV2,
    });
    passStage('offline-reopened', {
      closure, offlineElapsedMs,
      activePlayMs: offlineRaw?.authority?.activePlayMs,
      liveActivePlayMs: {
        state: offlineStateActivePlayMs, ui: offlineUiActivePlayMs,
        requiredDurableActivePlayMs: offlineRaw?.authority?.activePlayMs,
        eligibleDuringProof: false,
      },
      budget: offlineUi?.budget,
      pertarSurface: retainPertarSurfaceEvidence(
        offlineSurface, 'exhausted-offline', reopenedDocumentToken,
      ),
    });

    currentStage = 'active-observation';
    const shownRuntime = await evaluate(send, sessionId,
      'window.__CF_SLICE__.api.__smokeShowF4()',
      'activate reopened F4 authority after offline proof');
    productAssert(shownRuntime?.visible === true
      && shownRuntime?.answerable === true
      && shownRuntime?.leaseOwned === true
      && shownRuntime?.accruing === true,
    'reopened F4 authority did not become eligible after offline proof', shownRuntime);
    await waitForWritable(send, sessionId, reopenedDocumentToken);
    await send('Target.activateTarget', { targetId });
    await send('Emulation.setFocusEmulationEnabled', { enabled: true }, sessionId);
    await evaluate(send, sessionId,
      'window.__CF_SLICE__.api.__smokeRunF4Heartbeat()',
      'refresh reactivated exhausted presentation');
    const reactivatedSurface = await waitForPertarSurface(send, sessionId, {
      phase: 'exhausted-visible', expectedDocumentToken: reopenedDocumentToken,
    });
    productAssert(same(reactivatedSurface.surfaceAssessment.facts,
      projectArc4CaptureUiFacts(exhaustedUi)),
    'reactivated exhausted surface did not restore its active presentation', {
      reactivatedSurface: reactivatedSurface.surfaceAssessment,
      exhaustedFacts: projectArc4CaptureUiFacts(exhaustedUi),
    });
    const reactivatedPertarSurface = retainPertarSurfaceEvidence(
      reactivatedSurface, 'exhausted-visible', reopenedDocumentToken,
    );
    retainStageEvidence('active-observation', { reactivatedPertarSurface });
    const armedObserver = await evaluate(
      send, sessionId, LIFECYCLE_OBSERVER_SOURCE, 'arm lifecycle observer',
    );
    productAssert(armedObserver?.initial?.visibilityState === 'visible'
      && armedObserver.initial.hidden === false
      && armedObserver.initial.focused === true
      && armedObserver.initial.answerable === true
      && armedObserver.initial.accruing === true
      && armedObserver.initial.leaseOwned === true,
    'active observation did not arm on an eligible target', armedObserver);
    const samples = [];
    samples.push(await collectServiceTurn({
      send, sessionId, targetId, index: samples.length,
    }));
    const observationStartedAt = samples[0].nodeStartedAtMonotonicMs;
    const startActivePlayMs = samples[0].target.before.runtime.activePlayMs;
    const boundaryActivePlayMs = (Math.floor(
      startActivePlayMs / ARC4_ACTIVE_PLAY_CYCLE_MS,
    ) + 1) * ARC4_ACTIVE_PLAY_CYCLE_MS;
    while (nowMonotonicMs() - observationStartedAt < ACTIVE_OBSERVATION_MS) {
      const latestActivePlayMs = samples.at(-1).target.after.runtime.activePlayMs;
      const remainingToBoundary = boundaryActivePlayMs - latestActivePlayMs;
      const remainingToDuration = ACTIVE_OBSERVATION_MS
        - (nowMonotonicMs() - observationStartedAt);
      const cadence = remainingToBoundary > 0
        && remainingToBoundary <= BOUNDARY_NEAR_MS
        ? BOUNDARY_SAMPLE_MS : REGULAR_SAMPLE_MS;
      await sleep(Math.max(1, Math.min(cadence, remainingToDuration)));
      samples.push(await collectServiceTurn({
        send, sessionId, targetId, index: samples.length,
      }));
      report = {
        ...report,
        observationInput: {
          schema: ARC4_RECOVERY_INPUT_SCHEMA, policy: POLICY,
          browser: report.browser,
          authorityBinding: null,
          observation: {
            schema: ARC4_RECOVERY_OBSERVATION_SCHEMA,
            documentToken: reopenedDocumentToken,
            startedAtMonotonicMs: observationStartedAt,
            endedAtMonotonicMs: samples.at(-1).nodeEndedAtMonotonicMs,
            boundary: null, observer: armedObserver, samples,
          },
        },
      };
      if (samples.length % 12 === 0) persistRunning();
    }

    const persisted = await evaluate(send, sessionId,
      'window.__CF_SLICE__.api.__smokePersistNow()',
      'persist recovered active authority');
    productAssert(persisted === true,
      'recovered active authority did not checkpoint', persisted);
    let recoveredRaw = null;
    let recoveredState = null;
    let recoveredUi = null;
    const recoveredDeadline = performance.now() + 10_000;
    while (performance.now() < recoveredDeadline) {
      await sleep(250);
      samples.push(await collectServiceTurn({
        send, sessionId, targetId, index: samples.length,
      }));
      recoveredRaw = await evaluate(send, sessionId, ARC4_DURABLE_READ_EXPRESSION,
        'read recovered authority');
      recoveredState = await evaluate(send, sessionId,
        'window.__CF_SLICE__.api.state()', 'read recovered state');
      recoveredUi = await evaluate(send, sessionId, ARC4_CAPTURE_UI_EXPRESSION,
        'read recovered UI');
      const recoveredRows = recoveredUi?.rows ?? [];
      if (recoveredRaw?.authority?.activePlayMs >= boundaryActivePlayMs
        && recoveredUi?.budget?.cycle
          === Math.floor(startActivePlayMs / ARC4_ACTIVE_PLAY_CYCLE_MS) + 1
        && recoveredUi?.budget?.used === 0
        && recoveredUi?.budget?.remaining === ARC4_PERTAR_FIXTURE.biosphereYield
        && recoveredRows.length === 3
        && new Set(recoveredRows.map((row) => row?.verb)).size === 3
        && ['tame', 'scavenge', 'sample'].every((verb) =>
          recoveredRows.some((row) => row?.verb === verb))
        && recoveredRows.every((row) => row.status === 'ready'
          && row.button?.modelEnabled === 'true'
          && row.button?.disabled === false
          && row.button?.ariaDisabled === 'false')) break;
    }
    const observer = await evaluate(
      send, sessionId, FINAL_OBSERVER_EXPRESSION, 'read lifecycle observer',
    );
    const firstAtOrAfterBoundary = samples.findIndex((sample) => (
      sample.target.after.runtime.activePlayMs >= boundaryActivePlayMs
    ));
    recoveryBundle = {
      exhaustedRaw, exhaustedState, exhaustedUi, suppressed,
      closedRaw, closedState, closure,
      offlineRaw, offlineState, offlineUi, offlineElapsedMs,
      recoveredRaw, recoveredState, recoveredUi,
    };
    domainAssessment = assessArc4ExhaustionRecovery(recoveryBundle);
    const authorityBinding = projectArc4RecoveryObservationAuthority(
      recoveryBundle,
    );
    observationInput = {
      schema: ARC4_RECOVERY_INPUT_SCHEMA, policy: POLICY,
      browser: report.browser,
      authorityBinding,
      observation: {
        schema: ARC4_RECOVERY_OBSERVATION_SCHEMA,
        documentToken: reopenedDocumentToken,
        startedAtMonotonicMs: observationStartedAt,
        endedAtMonotonicMs: samples.at(-1).nodeEndedAtMonotonicMs,
        boundary: {
          activePlayMs: boundaryActivePlayMs,
          beforeSampleIndex: firstAtOrAfterBoundary - 1,
          afterSampleIndex: firstAtOrAfterBoundary,
        },
        observer, samples,
      },
    };
    observationVerdict = evaluateArc4RecoveryObservation(observationInput);
    productAssert(observationVerdict.status === 'pass',
      'real-time active observation is red', observationVerdict);
    passStage('active-observation', {
      metrics: observationVerdict.metrics,
      serviceOutcomeIds: observationVerdict.outcomes.map(({ id: outcomeId }) => outcomeId),
      reactivatedPertarSurface,
    });
    currentStage = 'boundary-crossed';
    const boundaryOutcome = observationVerdict.outcomes.find(
      ({ id: outcomeId }) => outcomeId === 'exact-next-boundary',
    );
    productAssert(boundaryOutcome?.pass === true,
      'exact next-cycle boundary was not bracketed', boundaryOutcome);
    passStage('boundary-crossed', {
      boundary: observationInput.observation.boundary,
      metrics: observationVerdict.metrics,
    });

    currentStage = 'recovered';
    productAssert(domainAssessment.ok,
      'Arc 4 exhaustion/recovery domain assessment is red', domainAssessment);
    productAssert(fatalEvents.length === 0,
      'browser emitted fatal/error evidence', fatalEvents);
    passStage('recovered', {
      assessment: domainAssessment,
      activePlayMs: recoveredRaw?.authority?.activePlayMs,
      rng: recoveredRaw?.authority?.sessionRng ?? null,
      receiptCount: recoveredRaw?.receiptKeys?.length ?? null,
      budget: recoveredUi?.budget ?? null,
    });
    provisionalStatus = 'pass'; provisionalExitCode = 0;
  } catch (error) {
    const classification = classifyRecoveryFailure(error);
    const evidence = classification.evidence;
    findings.push(error.message);
    if (evidence !== null) findings.push(`evidence: ${JSON.stringify(evidence)}`);
    if (['not-run', 'running'].includes(
      report.stages.find((stage) => stage.id === currentStage)?.status,
    )) {
      markStage(currentStage, 'fail', { message: error.message, evidence });
    }
    provisionalStatus = classification.status;
    provisionalExitCode = classification.exitCode;
  }

  const cleanupFailures = [];
  if (browser && targetId) {
    try {
      const closed = await browser.send('Target.closeTarget', { targetId });
      if (closed?.success !== true) cleanupFailures.push('Target.closeTarget did not confirm success');
    } catch (error) { cleanupFailures.push(`target cleanup: ${error.message}`); }
    targetId = null; sessionId = null;
  }
  if (browser && browserContextId) {
    try {
      await browser.send('Target.disposeBrowserContext', { browserContextId });
      cleanup.browserContext = true;
    } catch (error) { cleanupFailures.push(`browser-context cleanup: ${error.message}`); }
    browserContextId = null;
  } else cleanup.browserContext = true;
  if (browser) {
    try { await browser.close(); cleanup.browser = true; }
    catch (error) { cleanupFailures.push(`browser cleanup: ${error.message}`); }
    browser = null;
  } else cleanup.browser = true;
  if (server) {
    try { await server.close(); cleanup.server = true; }
    catch (error) { cleanupFailures.push(`server cleanup: ${error.message}`); }
    server = null;
  } else cleanup.server = true;
  if (releaseLock) {
    try { releaseLock(); cleanup.workspaceLock = true; }
    catch (error) { cleanupFailures.push(`workspace-lock cleanup: ${error.message}`); }
    releaseLock = null;
  } else cleanup.workspaceLock = true;
  if (cleanupFailures.length) {
    findings.push(...cleanupFailures);
    provisionalStatus = 'instrument-fail'; provisionalExitCode = 2;
    markStage('cleanup', 'fail', {
      message: cleanupFailures[0], findings: cleanupFailures,
    });
  } else passStage('cleanup', { allOwnedResourcesReleased: true });

  try { sourceEnd = sourceIdentity(); }
  catch (error) {
    findings.push(`terminal source identity: ${error.message}`);
    provisionalStatus = 'instrument-fail'; provisionalExitCode = 2;
  }
  if (!same(sourceBegin, sourceEnd)) {
    findings.push('source identity changed during the Arc 4 recovery attempt');
    provisionalStatus = 'instrument-fail'; provisionalExitCode = 2;
  }
  const endedAt = new Date();
  let terminal = {
    ...report, status: provisionalStatus,
    terminal: true,
    lifecycle: {
      schema: ARC4_RECOVERY_LIFECYCLE_SCHEMA,
      status: cleanupFailures.length ? 'failed' : 'complete',
    },
    endedAt: endedAt.toISOString(),
    durationMs: endedAt.getTime() - startedAt.getTime(),
    source: { begin: sourceBegin, end: sourceEnd }, build,
    recoveryBundle, observationInput, domainAssessment, observationVerdict,
    ordinarySliceSeal, instrumentSeal,
    predecessors,
    fatalEvents: [...fatalEvents], findings: [...findings], cleanup: { ...cleanup },
  };
  if (provisionalStatus === 'pass') {
    try {
      const replayedDomainAssessment = assessArc4ExhaustionRecovery(
        terminal.recoveryBundle,
      );
      const replayedObservationVerdict = evaluateArc4RecoveryObservation(
        terminal.observationInput,
      );
      const replayedAuthorityBinding = projectArc4RecoveryObservationAuthority(
        terminal.recoveryBundle,
      );
      const fixtureEvidence = terminal.stages.find(
        (stage) => stage?.id === 'fixture',
      )?.evidence;
      const replayedFixturePrecondition = assessArc4CapturePrecondition(
        fixtureEvidence?.preconditionInput,
      );
      const replayedPertarSurfaces = replayPertarStageSurfaces(terminal.stages);
      const replayedOrdinarySeal = assessOrdinarySliceRecoverySeal(
        fs.readFileSync(ordinarySlicePath, 'utf8'),
      );
      const replayedInstrumentSeal = assessArc4RecoveryInstrumentSeal(
        fs.readFileSync(collectorPath, 'utf8'), PAGE_EVIDENCE_SOURCES,
      );
      const currentSource = sourceIdentity();
      const currentPredecessors = resolvePredecessors(options, currentSource);
      const currentBuild = distIdentity();
      const currentInputs = inputIdentity(currentBuild.sha256, currentPredecessors);
      const verificationErrors = terminalArc4RecoveryReportErrors(terminal, {
        expectedRunId: id, currentSource,
        replayedDomainAssessment, replayedObservationVerdict,
        replayedAuthorityBinding, replayedFixturePrecondition,
        replayedPertarSurfaces,
        currentBuild, currentInputs,
        ordinarySliceSeal: replayedOrdinarySeal,
        instrumentSeal: replayedInstrumentSeal,
        expectedPredecessors: currentPredecessors,
        expectedArtifactPath: artifacts.reportRelative,
      });
      if (verificationErrors.length) {
        provisionalStatus = 'instrument-fail'; provisionalExitCode = 2;
        terminal = {
          ...terminal, status: provisionalStatus,
          findings: [...terminal.findings, ...verificationErrors.map(
            (message) => `terminal verification: ${message}`,
          )],
        };
      }
    } catch (error) {
      provisionalStatus = 'instrument-fail'; provisionalExitCode = 2;
      terminal = {
        ...terminal, status: provisionalStatus,
        findings: [...terminal.findings,
          `terminal verification exception: ${error.message}`],
      };
    }
  }
  atomicWriteJson(artifacts.report, terminal);
  atomicWriteJson(currentReportPath, terminal);
  if (terminal.status === 'pass') {
    console.log(`ARC 4 RECOVERY: PASS — ${id}`);
    console.log(`  real active observation: ${terminal.observationVerdict.metrics.browserElapsedMs}ms`);
    console.log(`  immutable report: ${artifacts.reportRelative}`);
    console.log('  current report pointer: apps/game/smoke/arc4-recovery-report.json');
  } else {
    console.error(`ARC 4 RECOVERY: ${terminal.status.toUpperCase()} — ${id}`);
    console.error(`  first failure: ${JSON.stringify(terminal.firstFailure)}`);
    for (const finding of terminal.findings) console.error(`  ${finding}`);
    console.error(`  immutable report: ${artifacts.reportRelative}`);
  }
  return provisionalExitCode;
}

function syntheticBrowser() {
  return Object.freeze({
    executable: '/selftest/browser', product: 'HeadlessChrome/150.0.0.0',
    revision: '@selftest', userAgent: 'selftest browser', jsVersion: '15.0',
    protocolVersion: '1.3',
  });
}
function syntheticRuntime(activePlayMs, revision, { eligible = true } = {}) {
  return {
    visible: eligible, answerable: eligible, leaseOwned: eligible, accruing: eligible,
    activePlayMs, revision, sessionSeed: 68, sessionOrdinal: 16,
    sessionDraws: { 'capture.candidate': 16, 'capture.success': 16 },
  };
}
function syntheticRuntimeCaptureProjection(runtime) {
  return {
    activePlayMs: runtime.activePlayMs,
    revision: runtime.revision,
    sessionSeed: runtime.sessionSeed,
    sessionOrdinal: runtime.sessionOrdinal,
    sessionDraws: runtime.sessionDraws,
  };
}
function syntheticPertarPollTiming(completedAtMonotonicMs = 19_999) {
  return {
    schema: ARC4_RECOVERY_PERTAR_POLL_TIMING_SCHEMA,
    windowStartedAtMonotonicMs: 0,
    deadlineAtMonotonicMs: ARC4_RECOVERY_PERTAR_SURFACE_TIMEOUT_MS,
    requestedAtMonotonicMs: 1_000,
    completedAtMonotonicMs,
    remainingMs: ARC4_RECOVERY_PERTAR_SURFACE_TIMEOUT_MS - 1_000,
  };
}
function syntheticRuntimeCaptureWitness({
  documentToken, uiRuntime, stateRuntime, order = ['ui', 'state'],
} = {}) {
  const runtimeByKind = { ui: uiRuntime, state: stateRuntime };
  return {
    schema: ARC4_RECOVERY_RUNTIME_CAPTURE_WITNESS_SCHEMA,
    documentToken,
    captures: order.map((kind, ordinal) => ({
      kind, ordinal,
      documentTokenBefore: documentToken,
      documentTokenAfter: documentToken,
      snapshotDocumentToken: documentToken,
      startedAtPerformanceMs: 100 + ordinal * 2,
      endedAtPerformanceMs: 101 + ordinal * 2,
      runtime: syntheticRuntimeCaptureProjection(runtimeByKind[kind]),
    })),
  };
}
function syntheticCaptureFacts(recovered = false, { ineligible = false } = {}) {
  return {
    budget: {
      yield: ARC4_PERTAR_FIXTURE.biosphereYield,
      used: recovered ? 0 : ARC4_PERTAR_FIXTURE.biosphereYield,
      remaining: recovered ? ARC4_PERTAR_FIXTURE.biosphereYield : 0,
      cycle: recovered ? 1 : 0,
    },
    rows: ['tame', 'scavenge', 'sample'].map((verb) => ({
      verb, status: recovered ? 'ready'
        : ineligible ? 'unavailable' : verb === 'tame' ? 'empty' : 'depleted',
      modelEnabled: recovered ? 'true' : 'false',
      disabled: !recovered, ariaDisabled: recovered ? 'false' : 'true',
    })),
  };
}
function syntheticRecoveryFixture() {
  const browser = syntheticBrowser();
  const token = 'selftest-reopened-document-token';
  const closedToken = 'selftest-closed-document-token';
  const samples = [];
  const startActive = 20_000;
  const boundary = ARC4_ACTIVE_PLAY_CYCLE_MS;
  const recoveryAt = boundary + 5_000;
  let at = 0;
  while (at < ACTIVE_OBSERVATION_MS) {
    const active = startActive + at;
    const remaining = boundary - active;
    const step = remaining > 0 && remaining <= BOUNDARY_NEAR_MS
      ? BOUNDARY_SAMPLE_MS : REGULAR_SAMPLE_MS;
    const after = at + 20;
    const index = samples.length;
    const root = {
      product: browser.product, revision: browser.revision,
      protocolVersion: browser.protocolVersion,
    };
    const revision = 16 + Math.floor(at / 30_000);
    samples.push({
      schema: ARC4_RECOVERY_SERVICE_SCHEMA, index,
      nodeStartedAtMonotonicMs: at, nodeEndedAtMonotonicMs: after,
      browserBefore: root, browserAfter: root,
      target: {
        before: {
          sequence: index, documentToken: token,
          visibilityState: 'visible', hidden: false, focused: true,
          performanceNow: at, tickerTicks: index * 2,
          runtime: syntheticRuntime(startActive + at, revision),
          capture: syntheticCaptureFacts(startActive + at >= recoveryAt),
        },
        after: {
          sequence: index, documentToken: token,
          visibilityState: 'visible', hidden: false, focused: true,
          performanceNow: after, tickerTicks: index * 2 + 1,
          runtime: syntheticRuntime(startActive + after, revision),
          capture: syntheticCaptureFacts(startActive + after >= recoveryAt),
        },
      },
    });
    at += Math.max(1, Math.min(step, ACTIVE_OBSERVATION_MS - at));
  }
  const index = samples.length;
  const root = {
    product: browser.product, revision: browser.revision,
    protocolVersion: browser.protocolVersion,
  };
  samples.push({
    schema: ARC4_RECOVERY_SERVICE_SCHEMA, index,
    nodeStartedAtMonotonicMs: ACTIVE_OBSERVATION_MS,
    nodeEndedAtMonotonicMs: ACTIVE_OBSERVATION_MS + 20,
    browserBefore: root, browserAfter: root,
    target: {
      before: {
        sequence: index, documentToken: token,
        visibilityState: 'visible', hidden: false, focused: true,
        performanceNow: ACTIVE_OBSERVATION_MS, tickerTicks: index * 2,
        runtime: syntheticRuntime(startActive + ACTIVE_OBSERVATION_MS, 56),
        capture: syntheticCaptureFacts(true),
      },
      after: {
        sequence: index, documentToken: token,
        visibilityState: 'visible', hidden: false, focused: true,
        performanceNow: ACTIVE_OBSERVATION_MS + 20, tickerTicks: index * 2 + 1,
        runtime: syntheticRuntime(startActive + ACTIVE_OBSERVATION_MS + 20, 56),
        capture: syntheticCaptureFacts(true),
      },
    },
  });
  const crossing = samples.findIndex((sample) => (
    sample.target.after.runtime.activePlayMs >= boundary
  ));
  const lastActive = samples.at(-1).target.after.runtime.activePlayMs;
  const rng = {
    seed: 68, ordinal: 16,
    draws: { 'capture.candidate': 16, 'capture.success': 16 },
  };
  const state = (documentToken, activePlayMs, eligible = true) => ({
    mode: 'surface', gal: ARC4_PERTAR_FIXTURE.galaxy.seed,
    star: ARC4_PERTAR_FIXTURE.publicStar.seed,
    planet: ARC4_PERTAR_FIXTURE.planet.seed,
    planetOrdinal: ARC4_PERTAR_FIXTURE.planet.ordinal,
    navWorldKey: ARC4_PERTAR_FIXTURE.worldKey,
    sceneResources: { pendingPersistenceWrites: 0 },
    persistence: {
      documentToken, runtime: syntheticRuntime(activePlayMs, 56, { eligible }),
    },
  });
  const ui = (documentToken, recovered, activePlayMs, {
    eligible = true, ineligible = false,
  } = {}) => {
    const facts = syntheticCaptureFacts(recovered, { ineligible });
    return {
      budget: facts.budget,
      rows: facts.rows.map(({ verb, status, ...button }) => ({
        verb, status,
        detail: ineligible ? 'Capture unavailable while save authority is read-only.'
          : status === 'depleted' ? 'Worked Out — no Biosphere Yield remains this cycle.'
            : status === 'empty' ? 'No eligible candidate.' : 'Ready to capture.',
        button,
      })),
      cardOpen: true, cardTitle: 'Pertar', diagnostics: { pendingWork: 0 },
      persistence: {
        documentToken, runtime: syntheticRuntime(activePlayMs, 56, { eligible }),
      },
    };
  };
  const raw = (activePlayMs) => ({
    authority: { activePlayMs, sessionRng: structuredClone(rng) },
  });
  const recoveryBundle = {
    exhaustedRaw: raw(10_000),
    exhaustedState: state(closedToken, 10_005),
    exhaustedUi: ui(closedToken, false, 10_010),
    closedRaw: raw(10_020),
    closedState: state(closedToken, 10_020),
    closure: {
      closedDocumentToken: closedToken, reopenedDocumentToken: token,
    },
    offlineRaw: raw(10_020),
    offlineState: state(token, startActive, false),
    offlineUi: ui(token, false, startActive, { eligible: false, ineligible: true }),
    recoveredRaw: raw(lastActive),
    recoveredState: state(token, lastActive),
    recoveredUi: ui(token, true, lastActive),
  };
  const input = {
    schema: ARC4_RECOVERY_INPUT_SCHEMA, policy: POLICY, browser,
    authorityBinding: projectArc4RecoveryObservationAuthority(recoveryBundle),
    observation: {
      schema: ARC4_RECOVERY_OBSERVATION_SCHEMA, documentToken: token,
      startedAtMonotonicMs: samples[0].nodeStartedAtMonotonicMs,
      endedAtMonotonicMs: samples.at(-1).nodeEndedAtMonotonicMs,
      boundary: {
        activePlayMs: boundary,
        beforeSampleIndex: crossing - 1, afterSampleIndex: crossing,
      },
      observer: {
        schema: ARC4_RECOVERY_OBSERVER_SCHEMA, documentToken: token,
        initial: {
          visibilityState: 'visible', hidden: false, focused: true,
          answerable: true, accruing: true, leaseOwned: true,
        },
        events: [], serviceTurns: samples.length,
        final: {
          visibilityState: 'visible', hidden: false, focused: true,
          answerable: true, accruing: true, leaseOwned: true,
        },
      },
      samples,
    },
  };
  return { input, recoveryBundle };
}

export function runSelftest() {
  const justBeforeDeadline = assessArc4RecoveryPertarPollTiming(
    syntheticPertarPollTiming(ARC4_RECOVERY_PERTAR_SURFACE_TIMEOUT_MS - 1),
  );
  const exactDeadline = assessArc4RecoveryPertarPollTiming(
    syntheticPertarPollTiming(ARC4_RECOVERY_PERTAR_SURFACE_TIMEOUT_MS),
  );
  const lateDeadline = assessArc4RecoveryPertarPollTiming(
    syntheticPertarPollTiming(ARC4_RECOVERY_PERTAR_SURFACE_TIMEOUT_MS + 1),
  );
  assert(justBeforeDeadline.ok === true,
    'just-before-deadline Pertar completion was rejected');
  assert(exactDeadline.ok === false
    && exactDeadline.checks.completionBeforeDeadline === false,
  'exact-deadline Pertar completion stayed timing-green');
  assert(lateDeadline.ok === false
    && lateDeadline.checks.completionBeforeDeadline === false,
  'late Pertar completion stayed timing-green');
  const failureEvidence = Object.freeze({ selftest: 'failure-evidence' });
  instrumentAssert(true, 'true instrument assertion threw');
  productAssert(true, 'true product assertion threw');
  let classifiedInstrument = null;
  try {
    instrumentAssert(false, 'synthetic instrument red', failureEvidence);
  } catch (error) {
    classifiedInstrument = classifyRecoveryFailure(error);
  }
  assert(same(classifiedInstrument, {
    status: 'instrument-fail', exitCode: 2, evidence: failureEvidence,
  }), 'instrument assertion/classification did not preserve instrument evidence');
  let classifiedProduct = null;
  try {
    productAssert(false, 'synthetic product red', failureEvidence);
  } catch (error) {
    classifiedProduct = classifyRecoveryFailure(error);
  }
  assert(same(classifiedProduct, {
    status: 'fail', exitCode: 1, evidence: failureEvidence,
  }), 'product assertion/classification did not preserve product evidence');
  assert(same(classifyRecoveryFailure(new Error('synthetic generic red')), {
    status: 'instrument-fail', exitCode: 2, evidence: null,
  }), 'generic failure was not classified fail-closed as instrument evidence');
  const productRedDocumentToken = 'selftest-disabled-target-product-red';
  const productRedMissingSample = Object.freeze({
    documentToken: productRedDocumentToken,
    sameButton: true, sameSurvey: true, connected: false,
    button: {
      tag: null, verb: null, disabled: null, modelEnabled: null,
      ariaDisabled: null, rect: null,
    },
    cardRect: null,
    viewport: { width: 390, height: 844 },
    scroll: null,
    point: { x: null, y: null, hitTag: null, hitVerb: null, owned: false },
  });
  const productRedTarget = Object.freeze({
    schema: 'cf-v2-arc4-disabled-target/v1',
    selectorCount: 0,
    documentTokenBefore: productRedDocumentToken,
    documentTokenAfter: productRedDocumentToken,
    requestedVerb: 'tame',
    priorScroll: null,
    initial: structuredClone(productRedMissingSample),
    first: structuredClone(productRedMissingSample),
    second: structuredClone(productRedMissingSample),
  });
  const productRedSuppressed = Object.freeze({
    schema: 'cf-v2-arc4-disabled-suppression/v1',
    verb: 'tame',
    target: productRedTarget,
    dispatch: {
      requested: false, inputDispatched: false,
      documentToken: null, x: null, y: null,
    },
    trace: { pointer: [], clicks: [] },
    heartbeat: { quiesced: null, resumed: null },
    restoration: {
      attempted: true, complete: true,
      documentToken: productRedDocumentToken,
      before: null, after: null, abortSignalAborted: true,
      globalsAbsent: { abort: true, trace: true, preparation: true },
    },
    beforeRaw: null, afterRaw: null, beforeState: null, afterState: null,
  });
  const productRedTargetAssessment = assessArc4DisabledTargetEvidence(productRedTarget);
  const productRedSuppressionAssessment = assessArc4DisabledSuppressionEvidence(
    productRedSuppressed,
  );
  const productRedCleanupChecks = Object.freeze({
    restorationShape:
      productRedSuppressionAssessment.instrumentChecks.restorationShape === true,
    restorationComplete:
      productRedSuppressionAssessment.instrumentChecks.restorationComplete === true,
  });
  let classifiedProductRedTarget = null;
  try {
    assertDisabledSuppressionVerdicts({
      collectionError: null,
      suppressed: productRedSuppressed,
      finalTargetAssessment: productRedTargetAssessment,
      assessment: productRedSuppressionAssessment,
      cleanupIntegrity: Object.values(productRedCleanupChecks).every(Boolean),
      cleanupChecks: productRedCleanupChecks,
      exhaustedRaw: Object.freeze({ selftest: 'exhausted-authority' }),
      beforeRaw: null,
    });
  } catch (error) {
    classifiedProductRedTarget = classifyRecoveryFailure(error);
  }
  assert(productRedTargetAssessment.instrumentOk === true
    && productRedTargetAssessment.productOk === false
    && productRedSuppressionAssessment.instrumentOk === false
    && classifiedProductRedTarget?.status === 'fail'
    && classifiedProductRedTarget?.exitCode === 1
    && classifiedProductRedTarget?.evidence?.targetAssessment?.productOk === false,
  'coherent missing disabled target did not retain end-to-end product classification');
  const classifySuppressionVerdicts = ({
    cleanupIntegrity = true,
    assessmentInstrumentOk = true,
    collectionError = null,
    targetProductOk = false,
  } = {}) => {
    const suppressed = Object.freeze({ selftest: 'concurrent-suppression-reds' });
    const finalTargetAssessment = Object.freeze({
      instrumentOk: true, productOk: targetProductOk,
    });
    const assessment = Object.freeze({
      instrumentOk: assessmentInstrumentOk, productOk: false,
    });
    const cleanupChecks = Object.freeze({
      restorationShape: true, restorationComplete: cleanupIntegrity,
    });
    const exhaustedRaw = Object.freeze({ selftest: 'unchanged-authority' });
    try {
      assertDisabledSuppressionVerdicts({
        collectionError, suppressed, finalTargetAssessment, assessment,
        cleanupIntegrity, cleanupChecks, exhaustedRaw,
        beforeRaw: structuredClone(exhaustedRaw),
      });
    } catch (error) {
      return classifyRecoveryFailure(error);
    }
    return null;
  };
  const productOnlySuppressionRed = classifySuppressionVerdicts();
  assert(productOnlySuppressionRed?.status === 'fail'
    && productOnlySuppressionRed?.exitCode === 1
    && productOnlySuppressionRed?.evidence?.targetAssessment?.productOk === false,
  'cleanup-green disabled target red did not retain product classification');
  const concurrentCleanupSuppressionRed = classifySuppressionVerdicts({
    cleanupIntegrity: false,
  });
  assert(concurrentCleanupSuppressionRed?.status === 'instrument-fail'
    && concurrentCleanupSuppressionRed?.exitCode === 2
    && concurrentCleanupSuppressionRed?.evidence?.cleanupChecks?.restorationComplete === false,
  'cleanup instrument red was hidden by the concurrent disabled-target product red');
  const greenTargetAssessmentSuppressionRed = classifySuppressionVerdicts({
    assessmentInstrumentOk: false, targetProductOk: true,
  });
  assert(greenTargetAssessmentSuppressionRed?.status === 'instrument-fail'
    && greenTargetAssessmentSuppressionRed?.exitCode === 2
    && greenTargetAssessmentSuppressionRed?.evidence?.assessment?.instrumentOk === false,
  'green-target suppression assessment instrument red lost instrument classification');
  const concurrentCollectionSuppressionRed = classifySuppressionVerdicts({
    collectionError: new Error('synthetic suppression collection red'),
  });
  assert(concurrentCollectionSuppressionRed?.status === 'instrument-fail'
    && concurrentCollectionSuppressionRed?.exitCode === 2
    && concurrentCollectionSuppressionRed?.evidence?.assessment?.productOk === false,
  'suppression collection instrument red was hidden by the concurrent product red');

  const { input, recoveryBundle } = syntheticRecoveryFixture();
  const runtimeCaptureToken = recoveryBundle.closure.closedDocumentToken;
  const uiRuntime = syntheticRuntime(20_000, 7);
  const stateRuntime = syntheticRuntime(20_001, 7);
  const runtimeCaptureState = {
    persistence: { documentToken: runtimeCaptureToken, runtime: stateRuntime },
  };
  const runtimeCaptureUi = {
    persistence: { documentToken: runtimeCaptureToken, runtime: uiRuntime },
  };
  const assessRuntimeCapture = (witness, state = runtimeCaptureState,
    ui = runtimeCaptureUi, expectedDocumentToken = runtimeCaptureToken) => (
    assessArc4RecoveryRuntimeCaptureWitness({
      witness, state, ui, expectedDocumentToken,
    })
  );
  const trustedRuntimeCapture = syntheticRuntimeCaptureWitness({
    documentToken: runtimeCaptureToken, uiRuntime, stateRuntime,
  });
  const trustedRuntimeReceipt = assessRuntimeCapture(trustedRuntimeCapture);
  assert(trustedRuntimeReceipt.ok
    && trustedRuntimeReceipt.observed.runtimeNondecreasing === true,
  `trusted UI→state runtime receipt is red: ${JSON.stringify(trustedRuntimeReceipt)}`);

  const phaseSurface = ({ eligible, unavailable }) => {
    const stateRuntime = syntheticRuntime(20_001, 7, { eligible });
    const uiRuntime = syntheticRuntime(20_000, 7, { eligible });
    const flatFacts = syntheticCaptureFacts(false, { ineligible: unavailable });
    const rows = flatFacts.rows.map(({ verb, status, ...button }) => ({
      verb, status,
      detail: unavailable ? 'Capture unavailable while save authority is read-only.'
        : status === 'depleted' ? 'No biosphere yield remains.' : 'No candidate found.',
      button,
    }));
    const state = {
      mode: 'surface', gal: ARC4_PERTAR_FIXTURE.galaxy.seed,
      star: ARC4_PERTAR_FIXTURE.publicStar.seed,
      planet: ARC4_PERTAR_FIXTURE.planet.seed,
      planetOrdinal: ARC4_PERTAR_FIXTURE.planet.ordinal,
      navWorldKey: ARC4_PERTAR_FIXTURE.worldKey,
      sceneResources: { pendingPersistenceWrites: 0 },
      persistence: { documentToken: runtimeCaptureToken, runtime: stateRuntime },
    };
    const ui = {
      cardOpen: true, cardTitle: 'Pertar', budget: flatFacts.budget, rows,
      diagnostics: { pendingWork: 0 },
      persistence: { documentToken: runtimeCaptureToken, runtime: uiRuntime },
    };
    return {
      state, ui,
      runtimeCaptureWitness: syntheticRuntimeCaptureWitness({
        documentToken: runtimeCaptureToken,
        uiRuntime, stateRuntime,
      }),
    };
  };
  const activePhaseSurface = phaseSurface({ eligible: true, unavailable: false });
  const offlinePhaseSurface = phaseSurface({ eligible: false, unavailable: true });
  assert(assessPertarSurfaceObservation(activePhaseSurface, {
    phase: 'exhausted-visible', expectedDocumentToken: runtimeCaptureToken,
  }).productOk,
  'active exhausted Pertar phase baseline is red');
  assert(assessPertarSurfaceObservation(offlinePhaseSurface, {
    phase: 'exhausted-offline', expectedDocumentToken: runtimeCaptureToken,
  }).productOk,
  'offline unavailable Pertar phase baseline is red');
  const backwardPhaseSurface = structuredClone(activePhaseSurface);
  backwardPhaseSurface.state.persistence.runtime.activePlayMs = 19_999;
  backwardPhaseSurface.runtimeCaptureWitness.captures[1].runtime.activePlayMs = 19_999;
  const backwardPhaseAssessment = assessPertarSurfaceObservation(
    backwardPhaseSurface, {
      phase: 'exhausted-visible', expectedDocumentToken: runtimeCaptureToken,
    },
  );
  assert(backwardPhaseAssessment.instrumentOk
    && !backwardPhaseAssessment.productOk
    && same(backwardPhaseAssessment.productReasons, ['runtimeOrder']),
  'trusted backward Pertar runtime did not fail only the product order check');
  const divergentRevisionSurface = structuredClone(activePhaseSurface);
  divergentRevisionSurface.ui.persistence.runtime.revision += 1;
  divergentRevisionSurface.runtimeCaptureWitness.captures[0].runtime.revision += 1;
  const divergentRevisionAssessment = assessPertarSurfaceObservation(
    divergentRevisionSurface, {
      phase: 'exhausted-visible', expectedDocumentToken: runtimeCaptureToken,
    },
  );
  assert(divergentRevisionAssessment.instrumentOk
    && !divergentRevisionAssessment.productOk
    && same(divergentRevisionAssessment.productReasons, ['runtimeTuple']),
  'trusted divergent Pertar revision did not fail only the product tuple check');
  const divergentRngSurface = structuredClone(activePhaseSurface);
  divergentRngSurface.ui.persistence.runtime.sessionOrdinal += 1;
  divergentRngSurface.runtimeCaptureWitness.captures[0].runtime.sessionOrdinal += 1;
  const divergentRngAssessment = assessPertarSurfaceObservation(
    divergentRngSurface, {
      phase: 'exhausted-visible', expectedDocumentToken: runtimeCaptureToken,
    },
  );
  assert(divergentRngAssessment.instrumentOk
    && !divergentRngAssessment.productOk
    && same(divergentRngAssessment.productReasons, ['runtimeTuple']),
  'trusted divergent Pertar RNG did not fail only the product tuple check');
  const missingRngSurface = structuredClone(activePhaseSurface);
  for (const runtimeValue of [
    missingRngSurface.state.persistence.runtime,
    missingRngSurface.ui.persistence.runtime,
  ]) {
    delete runtimeValue.sessionSeed;
    delete runtimeValue.sessionOrdinal;
    delete runtimeValue.sessionDraws;
  }
  for (const capture of missingRngSurface.runtimeCaptureWitness.captures) {
    capture.runtime.sessionSeed = null;
    capture.runtime.sessionOrdinal = null;
    capture.runtime.sessionDraws = null;
  }
  const missingRngAssessment = assessPertarSurfaceObservation(
    missingRngSurface, {
      phase: 'exhausted-visible', expectedDocumentToken: runtimeCaptureToken,
    },
  );
  assert(missingRngAssessment.instrumentOk
    && !missingRngAssessment.productOk
    && same(missingRngAssessment.productReasons, ['runtimeTuple']),
  'trusted missing Pertar RNG did not fail only the product tuple check');
  const offlineRowMutation = structuredClone(offlinePhaseSurface);
  Object.assign(offlineRowMutation.ui.rows[0], {
    status: 'ready', button: {
      modelEnabled: 'true', disabled: false, ariaDisabled: 'false',
    },
  });
  assert(!assessPertarSurfaceObservation(offlineRowMutation, {
    phase: 'exhausted-offline', expectedDocumentToken: runtimeCaptureToken,
  }).productOk,
  'ready offline capture-row mutation stayed green');
  const offlineStateRuntimeMutation = structuredClone(offlinePhaseSurface);
  offlineStateRuntimeMutation.state.persistence.runtime.visible = true;
  assert(!assessPertarSurfaceObservation(offlineStateRuntimeMutation, {
    phase: 'exhausted-offline', expectedDocumentToken: runtimeCaptureToken,
  }).productOk,
  'eligible offline state-runtime mutation stayed green');
  const offlineUiRuntimeMutation = structuredClone(offlinePhaseSurface);
  offlineUiRuntimeMutation.ui.persistence.runtime.answerable = true;
  assert(!assessPertarSurfaceObservation(offlineUiRuntimeMutation, {
    phase: 'exhausted-offline', expectedDocumentToken: runtimeCaptureToken,
  }).productOk,
  'eligible offline UI-runtime mutation stayed green');
  assert(!assessPertarSurfaceObservation(offlinePhaseSurface, {
    phase: 'exhausted-visible', expectedDocumentToken: runtimeCaptureToken,
  }).productOk,
  'unavailable offline presentation was accepted as active exhaustion');

  const swappedRuntimeCapture = syntheticRuntimeCaptureWitness({
    documentToken: runtimeCaptureToken, uiRuntime, stateRuntime,
    order: ['state', 'ui'],
  });
  const swappedRuntimeReceipt = assessRuntimeCapture(swappedRuntimeCapture);
  assert(swappedRuntimeReceipt.ok === false
    && swappedRuntimeReceipt.checks.uiThenState === false,
  'distinct-value state→UI runtime receipt stayed green');

  const equalRuntime = syntheticRuntime(20_000, 7);
  const equalState = {
    persistence: { documentToken: runtimeCaptureToken, runtime: equalRuntime },
  };
  const equalUi = structuredClone(equalState);
  const swappedEqualRuntimeReceipt = assessRuntimeCapture(
    syntheticRuntimeCaptureWitness({
      documentToken: runtimeCaptureToken,
      uiRuntime: equalRuntime,
      stateRuntime: equalRuntime,
      order: ['state', 'ui'],
    }), equalState, equalUi,
  );
  assert(swappedEqualRuntimeReceipt.ok === false
    && swappedEqualRuntimeReceipt.checks.uiThenState === false,
  'equal-value state→UI runtime receipt stayed green');

  const missingOrdinal = structuredClone(trustedRuntimeCapture);
  delete missingOrdinal.captures[1].ordinal;
  assert(assessRuntimeCapture(missingOrdinal).ok === false,
    'missing runtime-capture ordinal stayed green');
  const duplicateOrdinal = structuredClone(trustedRuntimeCapture);
  duplicateOrdinal.captures[1].ordinal = 0;
  assert(assessRuntimeCapture(duplicateOrdinal).ok === false,
    'duplicate runtime-capture ordinal stayed green');
  const projectionMismatch = structuredClone(trustedRuntimeCapture);
  projectionMismatch.captures[0].runtime.revision += 1;
  const projectionMismatchReceipt = assessRuntimeCapture(projectionMismatch);
  assert(projectionMismatchReceipt.ok === false
    && Object.entries(projectionMismatchReceipt.checks).every(([name, value]) => (
      name === 'exactProjection' ? value === false : value === true
    )), 'runtime-capture projection mismatch did not fail only exactProjection');
  const backwardReceiptClock = structuredClone(trustedRuntimeCapture);
  backwardReceiptClock.captures[1].startedAtPerformanceMs
    = backwardReceiptClock.captures[0].endedAtPerformanceMs - 1;
  assert(assessRuntimeCapture(backwardReceiptClock).checks.monotonicReceipt === false,
    'nonmonotonic runtime-capture timestamp stayed green');
  const wrongDocument = structuredClone(trustedRuntimeCapture);
  wrongDocument.captures[1].documentTokenAfter = 'wrong-document-token';
  assert(assessRuntimeCapture(wrongDocument).checks.documentToken === false,
    'wrong runtime-capture document token stayed green');
  const wrongSnapshotDocumentState = structuredClone(runtimeCaptureState);
  const wrongSnapshotDocumentUi = structuredClone(runtimeCaptureUi);
  wrongSnapshotDocumentState.persistence.documentToken = 'wrong-document-token';
  wrongSnapshotDocumentUi.persistence.documentToken = 'wrong-document-token';
  const wrongSnapshotDocumentReceipt = assessRuntimeCapture(
    trustedRuntimeCapture,
    wrongSnapshotDocumentState,
    wrongSnapshotDocumentUi,
  );
  assert(wrongSnapshotDocumentReceipt.ok === false
    && Object.entries(wrongSnapshotDocumentReceipt.checks).every(([name, value]) => (
      name === 'documentToken' ? value === false : value === true
    )), 'coherently wrong snapshot document tokens did not fail only documentToken');

  const backwardStateRuntime = syntheticRuntime(19_999, 7);
  const trustedBackwardState = {
    persistence: {
      documentToken: runtimeCaptureToken, runtime: backwardStateRuntime,
    },
  };
  const trustedBackwardReceipt = assessRuntimeCapture(
    syntheticRuntimeCaptureWitness({
      documentToken: runtimeCaptureToken,
      uiRuntime,
      stateRuntime: backwardStateRuntime,
    }), trustedBackwardState, runtimeCaptureUi,
  );
  assert(trustedBackwardReceipt.ok
    && trustedBackwardReceipt.observed.runtimeNondecreasing === false,
  'trusted backward product runtime was misclassified as a malformed receipt');
  const trustedBackwardEvidence = {
    runtimeCapture: {
      witness: syntheticRuntimeCaptureWitness({
        documentToken: runtimeCaptureToken,
        uiRuntime,
        stateRuntime: backwardStateRuntime,
      }),
      snapshots: {
        ui: projectArc4RecoveryRuntimeCaptureSnapshot(runtimeCaptureUi),
        state: projectArc4RecoveryRuntimeCaptureSnapshot(trustedBackwardState),
      },
      receipt: trustedBackwardReceipt,
    },
    preconditionInput: {
      raw: { synthetic: true }, state: trustedBackwardState,
      ui: runtimeCaptureUi, routeError: null, authorityReady: true,
    },
    precondition: {
      ok: false, checks: { runtimeCaptureOrder: false },
      reasons: ['Arc 4 capture precondition runtimeCaptureOrder'],
    },
  };
  let trustedBackwardClassification = null;
  try {
    productAssert(false, 'Pertar recovery precondition is red', trustedBackwardEvidence);
  } catch (error) {
    trustedBackwardClassification = classifyRecoveryFailure(error);
  }
  assert(trustedBackwardClassification?.status === 'fail'
    && trustedBackwardClassification?.exitCode === 1
    && same(trustedBackwardClassification?.evidence, trustedBackwardEvidence),
  'trusted backward runtime did not retain product-red classification/evidence');
  const malformedRuntimeEvidence = {
    witness: swappedRuntimeCapture,
    snapshots: {
      ui: projectArc4RecoveryRuntimeCaptureSnapshot(runtimeCaptureUi),
      state: projectArc4RecoveryRuntimeCaptureSnapshot(runtimeCaptureState),
    },
    receipt: swappedRuntimeReceipt,
  };
  let malformedRuntimeClassification = null;
  try {
    instrumentAssert(swappedRuntimeReceipt.ok,
      'Pertar recovery runtime capture receipt is red', malformedRuntimeEvidence);
  } catch (error) {
    malformedRuntimeClassification = classifyRecoveryFailure(error);
  }
  assert(malformedRuntimeClassification?.status === 'instrument-fail'
    && malformedRuntimeClassification?.exitCode === 2
    && same(malformedRuntimeClassification?.evidence, malformedRuntimeEvidence),
  'malformed runtime receipt did not retain instrument-red classification/evidence');
  const mixedExhaustedFacts = input.authorityBinding.exhaustedCaptureFacts;
  assert(same(mixedExhaustedFacts.rows.map(({ verb, status }) => ({ verb, status })), [
    { verb: 'tame', status: 'empty' },
    { verb: 'scavenge', status: 'depleted' },
    { verb: 'sample', status: 'depleted' },
  ]), 'synthetic recovery baseline does not reproduce the real mixed exhausted surface');
  const mixedExhaustedUiRows = mixedExhaustedFacts.rows.map(({
    verb, status, modelEnabled, disabled, ariaDisabled,
  }) => ({ verb, status, button: { modelEnabled, disabled, ariaDisabled } }));
  assert(arc4ExhaustedCaptureRows(mixedExhaustedUiRows),
    'real mixed empty/depleted exhausted surface was rejected by the browser poll');
  const noDepletedUiRows = structuredClone(mixedExhaustedUiRows);
  for (const row of noDepletedUiRows) row.status = 'empty';
  assert(!arc4ExhaustedCaptureRows(noDepletedUiRows),
    'all-empty exhausted surface mutation stayed green');
  const earlyReadyUiRows = structuredClone(mixedExhaustedUiRows);
  Object.assign(earlyReadyUiRows[2], {
    status: 'ready',
    button: { modelEnabled: 'true', disabled: false, ariaDisabled: 'false' },
  });
  assert(!arc4ExhaustedCaptureRows(earlyReadyUiRows),
    'partially ready exhausted surface mutation stayed green');
  const offlineUnavailableFacts = input.authorityBinding.offlineCaptureFacts;
  assert(arc4IneligibleExhaustedCaptureRows(offlineUnavailableFacts.rows)
    && !arc4ExhaustedCaptureRows(offlineUnavailableFacts.rows),
  'offline unavailable presentation was not isolated from active exhaustion');
  assert(!arc4IneligibleExhaustedCaptureRows(mixedExhaustedFacts.rows),
    'active exhausted presentation was accepted as read-only unavailable');
  const hybridExhaustedRows = structuredClone(mixedExhaustedUiRows);
  Object.assign(hybridExhaustedRows[0], {
    modelEnabled: 'false', disabled: true, ariaDisabled: 'true',
  });
  Object.assign(hybridExhaustedRows[0].button, {
    modelEnabled: 'true', disabled: false, ariaDisabled: 'false',
  });
  assert(!arc4ExhaustedCaptureRows(hybridExhaustedRows),
    'forged flat exhaustion fields overrode a live enabled button');
  const hybridUnavailableRows = structuredClone(offlineUnavailableFacts.rows);
  hybridUnavailableRows[0].button = {
    modelEnabled: 'true', disabled: false, ariaDisabled: 'false',
  };
  assert(!arc4IneligibleExhaustedCaptureRows(hybridUnavailableRows),
    'forged flat unavailable fields overrode a live enabled button');
  const baseline = evaluateArc4RecoveryObservation(input);
  assert(baseline.status === 'pass',
    `recovery observation baseline is red: ${JSON.stringify(baseline.failures)}`);
  const mutations = {
    retry: (next) => { next.policy.automaticRetries = 1; },
    browser: (next) => { delete next.browser.revision; },
    focus: (next) => { next.observation.samples[5].target.after.focused = false; },
    lifecycle: (next) => { next.observation.observer.events.push({ kind: 'blur' }); },
    finalEligibility: (next) => {
      next.observation.observer.final.answerable = false;
    },
    cadence: (next) => {
      for (let index = 20; index < next.observation.samples.length; index++) {
        next.observation.samples[index].nodeStartedAtMonotonicMs += 7_000;
        next.observation.samples[index].nodeEndedAtMonotonicMs += 7_000;
      }
      next.observation.endedAtMonotonicMs += 7_000;
    },
    clock: (next) => {
      next.observation.samples.at(-1).target.after.performanceNow += 2_000;
    },
    activeJumpStall: (next) => {
      for (const sample of next.observation.samples) {
        for (const phase of ['before', 'after']) {
          const point = sample.target[phase];
          if (point.performanceNow >= 100_000
            && point.performanceNow < 700_000) {
            point.runtime.activePlayMs = 720_000;
          }
        }
      }
    },
    boundary: (next) => { next.observation.boundary.afterSampleIndex += 1; },
    boundaryGap: (next) => {
      const crossing = next.observation.boundary.afterSampleIndex;
      for (let index = crossing; index < next.observation.samples.length; index++) {
        const sample = next.observation.samples[index];
        sample.nodeStartedAtMonotonicMs += 1_250;
        sample.nodeEndedAtMonotonicMs += 1_250;
        sample.target.before.performanceNow += 1_250;
        sample.target.after.performanceNow += 1_250;
        sample.target.before.runtime.activePlayMs += 1_250;
        sample.target.after.runtime.activePlayMs += 1_250;
      }
      next.observation.endedAtMonotonicMs += 1_250;
      next.authorityBinding.recoveredDurableActivePlayMs += 1_250;
      next.authorityBinding.recoveredRuntimeActivePlayMs += 1_250;
    },
    duration: (next) => {
      next.observation.endedAtMonotonicMs
        = next.observation.startedAtMonotonicMs + ACTIVE_OBSERVATION_MS - 1;
    },
    longFinalTurn: (next) => {
      const final = next.observation.samples.at(-1);
      final.nodeEndedAtMonotonicMs += 4_000;
      final.target.after.performanceNow += 4_000;
      final.target.after.runtime.activePlayMs += 4_000;
      next.observation.endedAtMonotonicMs += 4_000;
      next.authorityBinding.recoveredDurableActivePlayMs += 4_000;
      next.authorityBinding.recoveredRuntimeActivePlayMs += 4_000;
    },
    gapOrder: (next) => {
      next.observation.samples[10].nodeStartedAtMonotonicMs -= 5_100;
      next.observation.samples[10].nodeEndedAtMonotonicMs -= 5_100;
    },
    gapParity: (next) => {
      for (let index = 10; index < next.observation.samples.length; index++) {
        next.observation.samples[index].nodeStartedAtMonotonicMs += 1_500;
        next.observation.samples[index].nodeEndedAtMonotonicMs += 1_500;
      }
      next.observation.endedAtMonotonicMs += 1_500;
    },
    nearBoundary: (next) => {
      const offset = 1_130_000;
      for (const sample of next.observation.samples) {
        sample.target.before.runtime.activePlayMs += offset;
        sample.target.after.runtime.activePlayMs += offset;
      }
      next.authorityBinding.offlineRuntimeActivePlayMs += offset;
      next.authorityBinding.recoveredDurableActivePlayMs += offset;
      next.authorityBinding.recoveredRuntimeActivePlayMs += offset;
    },
    unrelatedToken: (next) => {
      next.authorityBinding.reopenedDocumentToken = 'unrelated-document-token';
    },
    offlineUsesActivePresentation: (next) => {
      next.authorityBinding.offlineCaptureFacts = structuredClone(
        next.authorityBinding.exhaustedCaptureFacts,
      );
    },
    activeStartsUnavailable: (next) => {
      next.observation.samples[0].target.before.capture = structuredClone(
        next.authorityBinding.offlineCaptureFacts,
      );
    },
    earlyUiRecovery: (next) => {
      next.observation.samples[5].target.after.capture = syntheticCaptureFacts(true);
    },
    delayedUiRecovery: (next) => {
      for (const sample of next.observation.samples) {
        for (const phase of ['before', 'after']) {
          const point = sample.target[phase];
          if (point.runtime.activePlayMs
            <= ARC4_ACTIVE_PLAY_CYCLE_MS
              + ARC4_RECOVERY_UI_TRANSITION_LATENCY_MAX_MS) {
            point.capture = syntheticCaptureFacts(false);
          }
        }
      }
    },
    noUiRecovery: (next) => {
      for (const sample of next.observation.samples) {
        sample.target.before.capture = syntheticCaptureFacts(false);
        sample.target.after.capture = syntheticCaptureFacts(false);
      }
    },
    oneRowDepleted: (next) => {
      const facts = next.observation.samples.at(-1).target.after.capture;
      Object.assign(facts.rows[2], {
        status: 'depleted', modelEnabled: 'false',
        disabled: true, ariaDisabled: 'true',
      });
    },
    preBoundaryShapeDrift: (next) => {
      next.observation.samples[5].target.after.capture.rows[2].status = 'empty';
    },
    closedRng: (next) => { next.authorityBinding.closedSessionRng.ordinal += 1; },
    offlineRng: (next) => { next.authorityBinding.offlineSessionRng.ordinal += 1; },
    sampleRng: (next) => {
      next.observation.samples[10].target.after.runtime.sessionOrdinal += 1;
    },
  };
  const expectedFailure = {
    retry: ['zero-retry-policy'],
    browser: [
      'browser-provenance', 'service-inventory', 'turn-timing',
      'service-cadence', 'real-time-duration', 'active-clock-continuity',
      'exact-next-boundary',
    ],
    focus: [
      'service-inventory', 'turn-timing', 'service-cadence',
      'real-time-duration', 'active-clock-continuity', 'exact-next-boundary',
    ],
    lifecycle: ['sticky-lifecycle'],
    finalEligibility: ['sticky-lifecycle'],
    cadence: [
      'service-cadence', 'real-time-duration', 'active-clock-continuity',
      'exact-next-boundary',
    ],
    clock: [
      'turn-timing', 'service-cadence', 'active-clock-continuity',
      'exact-next-boundary',
    ],
    activeJumpStall: ['active-clock-continuity', 'exact-next-boundary'],
    boundary: ['exact-next-boundary'],
    boundaryGap: ['exact-next-boundary'],
    duration: [
      'real-time-duration', 'active-clock-continuity', 'exact-next-boundary',
    ],
    longFinalTurn: ['turn-timing', 'service-cadence'],
    gapOrder: ['service-cadence'],
    gapParity: ['service-cadence'],
    nearBoundary: [
      'recovery-window', 'capture-recovery-transition', 'exact-next-boundary',
    ],
    unrelatedToken: [
      'domain-observation-binding', 'recovery-window',
      'capture-recovery-transition', 'session-rng-fixed-point',
    ],
    offlineUsesActivePresentation: ['offline-ineligible-presentation'],
    activeStartsUnavailable: ['capture-recovery-transition'],
    earlyUiRecovery: ['capture-recovery-transition'],
    delayedUiRecovery: ['capture-recovery-transition'],
    noUiRecovery: ['capture-recovery-transition'],
    oneRowDepleted: ['capture-recovery-transition'],
    preBoundaryShapeDrift: ['capture-recovery-transition'],
    closedRng: ['session-rng-fixed-point'],
    offlineRng: ['session-rng-fixed-point'],
    sampleRng: [
      'service-inventory', 'turn-timing', 'service-cadence',
      'real-time-duration', 'active-clock-continuity',
      'session-rng-fixed-point', 'exact-next-boundary',
    ],
  };
  for (const [name, mutate] of Object.entries(mutations)) {
    const next = structuredClone(input); mutate(next);
    const result = evaluateArc4RecoveryObservation(next);
    const actualFailureIds = result.failures.map(({ id: outcomeId }) => outcomeId);
    assert(result.status === 'fail'
      && same(actualFailureIds, expectedFailure[name]),
    `recovery observation mutation stayed green (${name}): ${JSON.stringify(result)}`);
  }

  const ordinarySource = fs.readFileSync(ordinarySlicePath, 'utf8');
  const ordinarySeal = assessOrdinarySliceRecoverySeal(ordinarySource);
  assert(ordinarySeal.ok, `ordinary Slice seal is red: ${JSON.stringify(ordinarySeal)}`);
  const falseClaim = ordinarySource.replace(
    'recoveryClaimed: false,', 'recoveryClaimed: true,',
  );
  assert(!assessOrdinarySliceRecoverySeal(falseClaim).ok,
    'ordinary Slice positive recovery mutation stayed green');
  const developLedgerForgedAsProduction = ordinarySource.replace(
    '"assuranceProfile":"develop"', '"assuranceProfile":"production"',
  );
  assert(developLedgerForgedAsProduction !== ordinarySource
    && !assessOrdinarySliceRecoverySeal(developLedgerForgedAsProduction).ok,
  'ordinary Slice develop-ledger profile mutation stayed green');
  const productionLedgerForgedAsDevelop = ordinarySource.replace(
    '"assuranceProfile":"production"', '"assuranceProfile":"develop"',
  );
  assert(productionLedgerForgedAsDevelop !== ordinarySource
    && !assessOrdinarySliceRecoverySeal(productionLedgerForgedAsDevelop).ok,
  'ordinary Slice production-ledger profile mutation stayed green');
  const profileSelectorReversed = ordinarySource.replace(
    '? ARC4_SLICE_DEVELOP_LEDGER_EXPECTED_JSON\n  : ARC4_SLICE_PRODUCTION_LEDGER_EXPECTED_JSON;',
    '? ARC4_SLICE_PRODUCTION_LEDGER_EXPECTED_JSON\n  : ARC4_SLICE_DEVELOP_LEDGER_EXPECTED_JSON;',
  );
  assert(profileSelectorReversed !== ordinarySource
    && !assessOrdinarySliceRecoverySeal(profileSelectorReversed).ok,
  'ordinary Slice profile-selector mutation stayed green');
  const publicationGuardRemoved = ordinarySource.replace(
    "if (SLICE_ASSURANCE_PROFILE === 'production') {",
    "if (SLICE_ASSURANCE_PROFILE === 'develop') {",
  );
  assert(publicationGuardRemoved !== ordinarySource
    && !assessOrdinarySliceRecoverySeal(publicationGuardRemoved).ok,
  'ordinary Slice production-only publication guard mutation stayed green');
  const publicationHookRemoved = ordinarySource.replace(
    '__smokeRejectNextArc4Publication()', '__smokeRejectNextArc4PublicationMissing()',
  );
  assert(publicationHookRemoved !== ordinarySource
    && !assessOrdinarySliceRecoverySeal(publicationHookRemoved).ok,
  'ordinary Slice publication-fault-hook mutation stayed green');
  const nonClaimMarkerDrift = ordinarySource.replace(
    '20-minute next-cycle recovery is not claimed by this browser run.',
    '20-minute next-cycle recovery was not evaluated by this browser run.',
  );
  assert(nonClaimMarkerDrift !== ordinarySource
    && !assessOrdinarySliceRecoverySeal(nonClaimMarkerDrift).ok,
  'ordinary Slice recovery non-claim marker mutation stayed green');
  const collectorSource = fs.readFileSync(collectorPath, 'utf8');
  const instrumentSeal = assessArc4RecoveryInstrumentSeal(
    collectorSource, PAGE_EVIDENCE_SOURCES,
  );
  assert(instrumentSeal.ok,
    `recovery instrument seal is red: ${JSON.stringify(instrumentSeal)}`);
  const assertInstrumentSealOnly = (mutant, expectedCheck, label) => {
    const expectedChecks = Array.isArray(expectedCheck)
      ? expectedCheck : [expectedCheck];
    assert(mutant !== collectorSource, `${label} mutation did not bind production`);
    const outcome = assessArc4RecoveryInstrumentSeal(mutant, PAGE_EVIDENCE_SOURCES);
    assert(outcome.ok === false
      && expectedChecks.every((name) => outcome.checks[name] === false)
      && Object.entries(outcome.checks).every(([name, value]) => (
        [
          'suppressionSourceDigest',
          'pertarAssessmentSourceDigest',
          'pertarDedicatedSourceDigest',
          'pertarPhaseSourceDigest',
          'collectorProductionSourceDigest',
          'collectorSourceDigest',
        ].includes(name)
          ? true : expectedChecks.includes(name) ? value === false : value === true
      )), `${label} did not fail only ${expectedChecks.join('/')}: ${JSON.stringify(outcome)}`);
  };
  assertInstrumentSealOnly(
    collectorSource.replace(
      'target = await prepareDisabledSuppressionTarget(send, sessionId);',
      'target = await prepareDisabledSuppressionTarget(send, sessionId, true);',
    ),
    'suppressionDedicatedPreparation', 'bypassed dedicated suppression preparation',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'window.__CF_SLICE__.api.__smokeQuiesceF4Heartbeat()',
      'window.__CF_SLICE__.api.__smokeRunF4Heartbeat()',
    ),
    'suppressionHeartbeatQuiescence', 'bypassed suppression heartbeat quiescence',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'window.__CF_SLICE__.api.__smokeResumeF4Heartbeat()',
      'window.__CF_SLICE__.api.__smokeRunF4Heartbeat()',
    ),
    'suppressionHeartbeatQuiescence', 'bypassed suppression heartbeat restoration',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'target, trace, dispatch: Object.freeze({ ...dispatch }), heartbeat,',
      'target, trace, dispatch: Object.freeze({ ...dispatch }), heartbeat: null,',
    ),
    'suppressionHeartbeatQuiescence', 'forged suppression heartbeat evidence',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      "'read synchronized exhausted UI'",
      "'read unsynchronized exhausted UI'",
    ),
    'suppressionHeartbeatQuiescence', 'discarded synchronized exhaustion UI receipt',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'return Object.freeze({ suppressed, exhaustedRaw, exhaustedState, exhaustedUi });',
      'return Object.freeze({ suppressed, exhaustedRaw, exhaustedState, exhaustedUi: null });',
    ),
    'suppressionHeartbeatQuiescence', 'discarded synchronized exhaustion bundle',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      "selector='#survey button[data-capture-action=\"tame\"]'",
      "selector='#survey button[data-capture-action=\"tame\"]:not([hidden])'",
    ),
    'suppressionExactOwner', 'broadened suppression target owner',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      "button?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});",
      "button?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'auto'});",
    ),
    ['suppressionNativeScroll', 'suppressionPreparationOrder'],
    'noncanonical suppression reveal',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'await settle();\n      const second=sample();',
      'await Promise.resolve();\n      const second=sample();',
    ),
    ['suppressionSettledSamples', 'suppressionPreparationOrder'],
    'unsettled second suppression sample',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      "button?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});\n      const settle=()=>new Promise((resolve)=>requestAnimationFrame(()=>setTimeout(\n        ()=>requestAnimationFrame(()=>setTimeout(resolve,0)),0)));\n      await settle();\n      const first=sample();\n      await settle();\n      const second=sample();",
      "const settle=()=>new Promise((resolve)=>requestAnimationFrame(()=>setTimeout(\n        ()=>requestAnimationFrame(()=>setTimeout(resolve,0)),0)));\n      await settle();\n      const first=sample();\n      await settle();\n      const second=sample();\n      button?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});",
    ),
    'suppressionPreparationOrder', 'moved suppression reveal after settled samples',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      "button?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});",
      "if (false) {\n        button?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});\n      }",
    ),
    'suppressionPreparationOrder', 'dead-branched suppression reveal',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      "button?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});",
      "if (Boolean(0)) {\n        button?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});\n      }",
    ),
    'suppressionPreparationOrder', 'dynamically dead-branched suppression reveal',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      "button?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});",
      "if (!true) {\n        button?.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});\n      }",
    ),
    'suppressionSourceDigest', 'nonliteral dead-branched suppression reveal',
  );
  assertInstrumentSealOnly(
    collectorSource.replace('hitTag:hit?.tagName??null,', 'hitTag:null,'),
    'suppressionEvidenceInventory', 'discarded suppression hit owner evidence',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'dispatch.x = target.second.point.x;', 'dispatch.x = 0;',
    ),
    'suppressionDispatchBinding', 'unbound suppression dispatch coordinate',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      "await send('Input.dispatchMouseEvent', {\n          type: 'mouseMoved', x: dispatch.x, y: dispatch.y,\n        }, sessionId);",
      "await send('Input.dispatchMouseEvent', {\n          type: 'mouseMoved', x: dispatch.x, y: dispatch.y,\n        });",
    ),
    'suppressionDispatchBinding', 'unbound suppression CDP session',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'target = Object.freeze({ ...target, second: armedSample });\n      targetAssessment = assessArc4DisabledTargetEvidence(target);',
      'void armedSample;',
    ),
    'suppressionSettledSamples', 'discarded armed target revalidation',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'clientX:Number.isFinite(event.clientX)?event.clientX:null,',
      'clientX:null,',
    ),
    'suppressionTraceInventory', 'discarded suppression pointer coordinate',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'delete window.__cfArc4RecoverySuppressionAbort;\n        delete window.__cfArc4RecoverySuppressionTrace;\n        delete window.__cfArc4RecoverySuppressionPreparation;',
      'delete window.__cfArc4RecoverySuppressionAbort;\n        delete window.__cfArc4RecoverySuppressionTrace;',
    ),
    'suppressionCleanupReceipt', 'leaked suppression preparation record',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'await new Promise((resolve)=>requestAnimationFrame(()=>setTimeout(\n          ()=>requestAnimationFrame(()=>setTimeout(resolve,0)),0)));\n        const after=survey?{left:survey.scrollLeft,top:survey.scrollTop}:null,',
      'await Promise.resolve();\n        const after=survey?{left:survey.scrollLeft,top:survey.scrollTop}:null,',
    ),
    'suppressionCleanupOrder', 'unsettled suppression scroll restoration',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'await new Promise((resolve)=>requestAnimationFrame(()=>setTimeout(\n          ()=>requestAnimationFrame(()=>setTimeout(resolve,0)),0)));\n        const after=survey?{left:survey.scrollLeft,top:survey.scrollTop}:null,',
      'if (Boolean(0)) {\n          await new Promise((resolve)=>requestAnimationFrame(()=>setTimeout(\n            ()=>requestAnimationFrame(()=>setTimeout(resolve,0)),0)));\n        }\n        const after=survey?{left:survey.scrollLeft,top:survey.scrollTop}:null,',
    ),
    'suppressionCleanupOrder', 'dynamically dead-branched cleanup settlement',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'if(attempted&&survey&&before){survey.scrollLeft=before.left;survey.scrollTop=before.top}\n        await new Promise((resolve)=>requestAnimationFrame(()=>setTimeout(\n          ()=>requestAnimationFrame(()=>setTimeout(resolve,0)),0)));',
      'await new Promise((resolve)=>requestAnimationFrame(()=>setTimeout(\n          ()=>requestAnimationFrame(()=>setTimeout(resolve,0)),0)));\n        if(attempted&&survey&&before){survey.scrollLeft=before.left;survey.scrollTop=before.top}',
    ),
    'suppressionCleanupOrder', 'moved scroll restoration after cleanup settlement',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'if(attempted&&survey&&before){survey.scrollLeft=before.left;survey.scrollTop=before.top}',
      'if (false) {\n        if(attempted&&survey&&before){survey.scrollLeft=before.left;survey.scrollTop=before.top}\n        }',
    ),
    'suppressionCleanupOrder', 'dead-branched scroll restoration',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'attempted=record!==null;', 'attempted=!!survey&&!!before;',
    ),
    'suppressionCleanupReceipt', 'collapsed cleanup attempt into scroll availability',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'controller?.abort();',
      'if (false) {\n          controller?.abort();\n        }',
    ),
    'suppressionCleanupReceipt', 'dead-branched suppression abort',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'delete window.__cfArc4RecoverySuppressionAbort;\n        delete window.__cfArc4RecoverySuppressionTrace;\n        delete window.__cfArc4RecoverySuppressionPreparation;',
      'if (false) {\n          delete window.__cfArc4RecoverySuppressionAbort;\n          delete window.__cfArc4RecoverySuppressionTrace;\n          delete window.__cfArc4RecoverySuppressionPreparation;\n        }',
    ),
    'suppressionCleanupReceipt', 'dead-branched suppression global release',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'scrollComplete=before===null?survey===null&&after===null:',
      'scrollComplete=before!==null&&survey!==null&&after!==null&&',
    ),
    'suppressionCleanupReceipt', 'removed coherent no-scroll cleanup outcome',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'const abortSignalAborted=controller?.signal?.aborted===true,',
      'const abortSignalAborted=true,',
    ),
    'suppressionCleanupReceipt', 'forged suppression abort receipt',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      "abort:!('__cfArc4RecoverySuppressionAbort' in window),",
      'abort:true,',
    ),
    'suppressionCleanupReceipt', 'forged suppression global-absence receipt',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'if (dispatch.inputDispatched && collectionError === null) {',
      'if (true) {',
    ),
    'suppressionFinallyCleanup', 'unbound post-cleanup outcome read',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      "instrumentAssert(finalTargetAssessment.instrumentOk,\n    'disabled Tame target instrument evidence is red',\n    { suppressed, targetAssessment: finalTargetAssessment });\n  instrumentAssert(cleanupIntegrity,\n    'disabled suppression cleanup integrity is red',\n    { suppressed, cleanupChecks, assessment });\n  productAssert(finalTargetAssessment.productOk,\n    'disabled Tame target product evidence is red',\n    { suppressed, targetAssessment: finalTargetAssessment });",
      "instrumentAssert(cleanupIntegrity,\n    'disabled suppression cleanup integrity is red',\n    { suppressed, cleanupChecks, assessment });\n  productAssert(finalTargetAssessment.productOk,\n    'disabled Tame target product evidence is red',\n    { suppressed, targetAssessment: finalTargetAssessment });\n  instrumentAssert(finalTargetAssessment.instrumentOk,\n    'disabled Tame target instrument evidence is red',\n    { suppressed, targetAssessment: finalTargetAssessment });",
    ),
    ['suppressionTargetVerdictOrder', 'suppressionInstrumentVerdictOrder'],
    'moved target instrument verdict after product verdict',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'instrumentAssert(finalTargetAssessment.instrumentOk,',
      'if (false) {\n    instrumentAssert(finalTargetAssessment.instrumentOk,',
    ).replace(
      "{ suppressed, targetAssessment: finalTargetAssessment });\n  instrumentAssert(cleanupIntegrity,",
      "{ suppressed, targetAssessment: finalTargetAssessment });\n  }\n  instrumentAssert(cleanupIntegrity,",
    ),
    'suppressionTargetVerdictOrder', 'dead-branched target instrument verdict',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'instrumentAssert(finalTargetAssessment.instrumentOk,',
      'if (Boolean(0)) {\n    instrumentAssert(finalTargetAssessment.instrumentOk,',
    ).replace(
      "{ suppressed, targetAssessment: finalTargetAssessment });\n  instrumentAssert(cleanupIntegrity,",
      "{ suppressed, targetAssessment: finalTargetAssessment });\n  }\n  instrumentAssert(cleanupIntegrity,",
    ),
    'suppressionTargetVerdictOrder', 'dynamically dead-branched target instrument verdict',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'instrumentAssert(finalTargetAssessment.instrumentOk,',
      'if (1 === 0) {\n    instrumentAssert(finalTargetAssessment.instrumentOk,',
    ).replace(
      "{ suppressed, targetAssessment: finalTargetAssessment });\n  instrumentAssert(cleanupIntegrity,",
      "{ suppressed, targetAssessment: finalTargetAssessment });\n  }\n  instrumentAssert(cleanupIntegrity,",
    ),
    'suppressionSourceDigest', 'nonliteral dead-branched target instrument verdict',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      "instrumentAssert(cleanupIntegrity,\n    'disabled suppression cleanup integrity is red',\n    { suppressed, cleanupChecks, assessment });\n  productAssert(finalTargetAssessment.productOk,\n    'disabled Tame target product evidence is red',\n    { suppressed, targetAssessment: finalTargetAssessment });",
      "productAssert(finalTargetAssessment.productOk,\n    'disabled Tame target product evidence is red',\n    { suppressed, targetAssessment: finalTargetAssessment });\n  instrumentAssert(cleanupIntegrity,\n    'disabled suppression cleanup integrity is red',\n    { suppressed, cleanupChecks, assessment });",
    ),
    ['suppressionCleanupVerdictOrder', 'suppressionInstrumentVerdictOrder'],
    'moved cleanup instrument verdict after product verdict',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'instrumentAssert(cleanupIntegrity,',
      'if (false) {\n    instrumentAssert(cleanupIntegrity,',
    ).replace(
      "{ suppressed, cleanupChecks, assessment });\n  productAssert(finalTargetAssessment.productOk,",
      "{ suppressed, cleanupChecks, assessment });\n  }\n  productAssert(finalTargetAssessment.productOk,",
    ),
    'suppressionCleanupVerdictOrder', 'dead-branched cleanup integrity verdict',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      "productAssert(finalTargetAssessment.productOk,\n    'disabled Tame target product evidence is red',\n    { suppressed, targetAssessment: finalTargetAssessment });\n  instrumentAssert(assessment.instrumentOk, 'disabled suppression instrument evidence is red',\n    { suppressed, assessment });",
      "instrumentAssert(assessment.instrumentOk, 'disabled suppression instrument evidence is red',\n    { suppressed, assessment });\n  productAssert(finalTargetAssessment.productOk,\n    'disabled Tame target product evidence is red',\n    { suppressed, targetAssessment: finalTargetAssessment });",
    ),
    'suppressionInstrumentVerdictOrder',
    'moved full suppression instrument verdict before coherent target product verdict',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'instrumentAssert(assessment.instrumentOk, \'disabled suppression instrument evidence is red\',',
      'instrumentAssert(true, \'disabled suppression instrument evidence is red\',',
    ),
    ['suppressionAssessmentEnforced', 'suppressionInstrumentVerdictOrder'],
    'bypassed suppression assessment',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      "instrumentAssert(collectionError === null,\n    collectionError?.message || 'disabled suppression collection is red',\n    { suppressed, targetAssessment: finalTargetAssessment, assessment });\n  instrumentAssert(finalTargetAssessment.instrumentOk,",
      "instrumentAssert(finalTargetAssessment.instrumentOk,",
    ).replace(
      "productAssert(finalTargetAssessment.productOk,\n    'disabled Tame target product evidence is red',\n    { suppressed, targetAssessment: finalTargetAssessment });",
      "productAssert(finalTargetAssessment.productOk,\n    'disabled Tame target product evidence is red',\n    { suppressed, targetAssessment: finalTargetAssessment });\n  instrumentAssert(collectionError === null,\n    collectionError?.message || 'disabled suppression collection is red',\n    { suppressed, targetAssessment: finalTargetAssessment, assessment });",
    ),
    'suppressionInstrumentVerdictOrder',
    'moved collection-error instrument verdict after product verdict',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      "instrumentAssert(assessment.instrumentOk, 'disabled suppression instrument evidence is red',\n    { suppressed, assessment });\n  productAssert(same(beforeRaw, exhaustedRaw),",
      "productAssert(same(beforeRaw, exhaustedRaw),",
    ).replace(
      "productAssert(assessment.productOk, 'disabled suppression product evidence is red',\n    { suppressed, assessment });",
      "productAssert(assessment.productOk, 'disabled suppression product evidence is red',\n    { suppressed, assessment });\n  instrumentAssert(assessment.instrumentOk, 'disabled suppression instrument evidence is red',\n    { suppressed, assessment });",
    ),
    'suppressionInstrumentVerdictOrder',
    'moved final suppression instrument verdict after product verdicts',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'async function collectSuppression(send, sessionId) {',
      'async function collectSuppression(send, sessionId) {\n  void target?.ok;',
    ),
    'suppressionNoCollapsedOracle', 'restored collapsed suppression oracle',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'async function collectSuppression(send, sessionId) {',
      'async function collectSuppression(send, sessionId) {\n  if (Boolean(1)) return null;',
    ),
    'suppressionNoEarlyReturn', 'inserted executable suppression early return',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'async function collectSuppression(send, sessionId) {',
      'async function collectSuppression(send, sessionId) {\n  return null;',
    ),
    'suppressionNoEarlyReturn', 'inserted direct suppression early return',
  );
  const overrideFlag = '--dur' + 'ation';
  assert(!assessArc4RecoveryInstrumentSeal(
    `${collectorSource}\n${overrideFlag}`, PAGE_EVIDENCE_SOURCES,
  ).ok, 'duration override mutation stayed green');
  const virtualMethod = 'Emulation.setVirtual' + 'TimePolicy';
  assert(!assessArc4RecoveryInstrumentSeal(
    `${collectorSource}\n${virtualMethod}`, PAGE_EVIDENCE_SOURCES,
  ).ok, 'virtual-time mutation stayed green');
  assert(!assessArc4RecoveryInstrumentSeal(
    collectorSource, [...PAGE_EVIDENCE_SOURCES, 'authority.activePlayMs += 1200000'],
  ).ok, 'active-play writer mutation stayed green');
  const assertPageClockOverrideRed = (pageSource, label) => {
    const mutatedPageSources = [...PAGE_EVIDENCE_SOURCES];
    mutatedPageSources[0] = `${mutatedPageSources[0]}\n${pageSource}`;
    const outcome = assessArc4RecoveryInstrumentSeal(
      collectorSource, mutatedPageSources,
    );
    assert(outcome.ok === false
      && Object.entries(outcome.checks).every(([name, value]) => (
        name === 'noPageClockOverride' ? value === false : value === true
      )), `${label} did not fail only noPageClockOverride: ${JSON.stringify(outcome)}`);
  };
  assertPageClockOverrideRed(
    'performance.now = () => 0', 'direct page performance clock override',
  );
  assertPageClockOverrideRed(
    "globalThis.performance['now'] &&= () => 0",
    'compound bracket page performance clock override',
  );
  assertPageClockOverrideRed(
    "globalThis['performance'].now = () => 0",
    'bracket-root page performance clock override',
  );
  assertPageClockOverrideRed(
    "Reflect.defineProperty(globalThis.performance,'now',{value:()=>0})",
    'Reflect page performance clock override',
  );
  assertPageClockOverrideRed(
    "Object['defineProperty'](Date,'now',{value:()=>0})",
    'bracketed Object page date clock override',
  );
  assertPageClockOverrideRed(
    'globalThis.performance = {now:()=>0}',
    'whole page performance clock replacement',
  );
  assertPageClockOverrideRed(
    "Object.defineProperty(globalThis,'performance',{value:{now:()=>0}})",
    'whole page performance descriptor replacement',
  );
  assertPageClockOverrideRed(
    "Reflect.set(globalThis,'performance',{now:()=>0})",
    'whole page performance Reflect replacement',
  );
  assertPageClockOverrideRed(
    'const clock=globalThis.performance;clock.now=()=>0',
    'aliased page performance clock replacement',
  );
  assertPageClockOverrideRed(
    'Object.defineProperty(globalThis.performance,`now`,{value:()=>0})',
    'template-literal page clock descriptor replacement',
  );
  assertPageClockOverrideRed(
    'Reflect.set(globalThis,`performance`,{now:()=>0})',
    'template-literal whole page clock replacement',
  );
  assertPageClockOverrideRed(
    'Object.assign(globalThis.performance,{now(){return 0}})',
    'page clock Object.assign method replacement',
  );
  assertPageClockOverrideRed(
    'const now=()=>0;Object.assign(globalThis.performance,{now})',
    'page clock Object.assign shorthand replacement',
  );
  assertPageClockOverrideRed(
    "const key='now';Object.assign(globalThis.performance,{[key]:()=>0})",
    'page clock Object.assign dynamic-computed replacement',
  );
  assertPageClockOverrideRed(
    'Object.setPrototypeOf(globalThis.performance,{now(){return 0}})',
    'page clock prototype replacement',
  );
  assertPageClockOverrideRed(
    'globalThis.performance.__proto__={now(){return 0}}',
    'page clock legacy prototype replacement',
  );
  assertPageClockOverrideRed(
    "globalThis.performance.__defineGetter__('now',()=>0)",
    'page clock legacy getter replacement',
  );
  assertPageClockOverrideRed(
    "const key='now';Object.defineProperty(globalThis.performance,key,{value:()=>0})",
    'page clock dynamic descriptor replacement',
  );
  assertPageClockOverrideRed(
    "const set=Reflect.set;set(globalThis.performance,'now',()=>0)",
    'page clock aliased Reflect replacement',
  );
  assertPageClockOverrideRed(
    "const {set}=Reflect;set(globalThis.performance,'now',()=>0)",
    'page clock destructured Reflect replacement',
  );
  assertPageClockOverrideRed(
    "const {assign}=Object,key='now';assign(globalThis.performance,{[key]:()=>0})",
    'page clock destructured Object replacement',
  );
  assertPageClockOverrideRed(
    "const key='now';globalThis.performance[key]=()=>0",
    'page clock dynamic-computed direct replacement',
  );
  assertPageClockOverrideRed(
    'class globalThis{static get crypto(){return window.crypto}static get performance(){return {now(){return 0}}}}',
    'page globalThis lexical-class shadow',
  );
  assertPageClockOverrideRed(
    'function performance(){return {now(){return 0}}}',
    'page performance function-declaration shadow',
  );
  assertPageClockOverrideRed(
    'const {root:globalThis}={root:{performance:{now:()=>0}}}',
    'page globalThis destructured-binding shadow',
  );
  assertPageClockOverrideRed(
    'for(var [globalThis] of [[{crypto:window.crypto,performance:{now(){return 0}}}]]){}',
    'page globalThis for-of destructured-binding shadow',
  );
  assertPageClockOverrideRed(
    'globalThis.globalThis={performance:{now:()=>0}}',
    'page globalThis binding replacement',
  );
  assertPageClockOverrideRed(
    'window.globalThis={performance:{now:()=>0}}',
    'page window globalThis binding replacement',
  );
  assertPageClockOverrideRed(
    '({now:globalThis.performance.now}={now:()=>0})',
    'page clock object-destructuring replacement',
  );
  assertPageClockOverrideRed(
    '[globalThis.performance.now]=[()=>0]',
    'page clock array-destructuring replacement',
  );
  assertPageClockOverrideRed(
    'for(globalThis.performance.now of [()=>0])break',
    'page clock for-of replacement',
  );
  const productionBoundary = '\nfunction syntheticBrowser()';
  assert(!assessArc4RecoveryInstrumentSeal(
    collectorSource.replace(
      productionBoundary,
      '\nauthority["activePlayMs"] += 1200000;' + productionBoundary,
    ), PAGE_EVIDENCE_SOURCES,
  ).ok, 'unlisted production active-play writer mutation stayed green');
  assert(!assessArc4RecoveryInstrumentSeal(
    collectorSource.replace(
      productionBoundary,
      '\nruntime.activePlayMs *= 2;' + productionBoundary,
    ), PAGE_EVIDENCE_SOURCES,
  ).ok, 'unlisted production multiplier writer mutation stayed green');
  assert(!assessArc4RecoveryInstrumentSeal(
    collectorSource.replace(
      productionBoundary,
      '\nperformance.now = () => 1200000;' + productionBoundary,
    ), PAGE_EVIDENCE_SOURCES,
  ).ok, 'unlisted production clock override mutation stayed green');
  assert(!assessArc4RecoveryInstrumentSeal(
    collectorSource.replace(
      productionBoundary,
      '\nglobalThis.performance = {now:()=>1200000};' + productionBoundary,
    ), PAGE_EVIDENCE_SOURCES,
  ).ok, 'unlisted whole production clock override mutation stayed green');
  assert(!assessArc4RecoveryInstrumentSeal(
    collectorSource.replace(
      productionBoundary,
      "\nconst clock=globalThis.performance;Reflect.set(clock,'now',()=>1200000);"
        + productionBoundary,
    ), PAGE_EVIDENCE_SOURCES,
  ).ok, 'unlisted aliased production clock override mutation stayed green');
  const pertarUiThenState = "uiCapture=capture('ui',()=>${ARC4_CAPTURE_UI_EXPRESSION}),\n          stateCapture=capture('state',()=>S?.api?.state?.()??null),";
  const pertarStateThenUi = "stateCapture=capture('state',()=>S?.api?.state?.()??null),\n          uiCapture=capture('ui',()=>${ARC4_CAPTURE_UI_EXPRESSION}),";
  const reversedPertarCapture = collectorSource.replace(
    pertarUiThenState, pertarStateThenUi,
  );
  assertInstrumentSealOnly(
    reversedPertarCapture, 'pertarReadyUiThenState',
    'reversed Pertar UI/state capture order',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      "'read Pertar capture surface', remainingMs);",
      "'read Pertar capture surface', COMMAND_TIMEOUT_MS);",
    ),
    'pertarAbsoluteDeadline', 'unclipped Pertar Runtime.evaluate deadline',
  );
  const offlinePhaseCall = "const offlineSurface = await waitForPertarSurface(send, sessionId, {\n      phase: 'exhausted-offline', expectedDocumentToken: reopenedDocumentToken,\n    });";
  const activePhaseCall = "const reactivatedSurface = await waitForPertarSurface(send, sessionId, {\n      phase: 'exhausted-visible', expectedDocumentToken: reopenedDocumentToken,\n    });";
  assertInstrumentSealOnly(
    collectorSource.replace(
      offlinePhaseCall,
      offlinePhaseCall.replace("phase: 'exhausted-offline'", "phase: 'exhausted-visible'"),
    ),
    'pertarOfflineUnavailablePhaseBound', 'conflated offline unavailable phase',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      activePhaseCall,
      activePhaseCall.replace("phase: 'exhausted-visible'", "phase: 'exhausted-offline'"),
    ),
    'pertarActiveExhaustedPhaseBound', 'conflated reactivated exhausted phase',
  );
  const commentShadowedOfflinePhase = collectorSource.replace(
    offlinePhaseCall,
    `/* ${offlinePhaseCall} */\n    ${offlinePhaseCall.replace(
      "phase: 'exhausted-offline'", "phase: 'exhausted-visible'",
    )}`,
  );
  assertInstrumentSealOnly(
    commentShadowedOfflinePhase, 'pertarPhaseSourceDigest',
    'comment-shadowed offline unavailable phase',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      "    await evaluate(send, sessionId,\n      'window.__CF_SLICE__.api.__smokeRunF4Heartbeat()',\n      'refresh reactivated exhausted presentation');\n",
      '',
    ),
    'pertarActiveExhaustedPhaseBound', 'removed reactivated presentation refresh',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'const offlineState = offlineSurface.state;\n    const offlineUi = offlineSurface.ui;',
      'const offlineState = offlineSurface.ui;\n    const offlineUi = offlineSurface.ui;',
    ),
    'pertarOfflineUnavailablePhaseBound', 'unbound offline state surface',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'arc4IneligibleExhaustedCaptureRows(rows)',
      'arc4ExhaustedCaptureRows(rows)',
    ),
    'pertarPhasePredicates', 'conflated offline and active predicates',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      "phase === 'exhausted-visible'\n          ? arc4ExhaustedCaptureRows(rows)\n          : phase === 'exhausted-offline'",
      "phase === 'exhausted-offline'\n          ? arc4ExhaustedCaptureRows(rows)\n          : phase === 'exhausted-visible'",
    ),
    'pertarPhasePredicates', 'swapped Pertar phase predicate labels',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'last === null || lastError !== null || !last.assessment.instrumentOk',
      'last === null || !last.assessment.instrumentOk',
    ),
    'pertarPhaseFailureClassified', 'ignored terminal Pertar sampler error',
  );
  const pertarTerminalCondition =
    'if (last === null || lastError !== null || !last.assessment.instrumentOk) {';
  const commentShadowedPertarWait = collectorSource.replace(
    pertarTerminalCondition,
    `// ${pertarTerminalCondition}\n  ${pertarTerminalCondition.replace(
      ' || lastError !== null', '',
    )}`,
  );
  assertInstrumentSealOnly(
    commentShadowedPertarWait, 'pertarDedicatedSourceDigest',
    'comment-shadowed terminal Pertar sampler error',
  );
  const pertarDedicatedStartNeedle =
    'function pertarRuntimeCaptureEvidence(surface, expectedDocumentToken) {';
  const pertarDedicatedEndNeedle =
    '\n\nasync function activateSurveyDock(send, sessionId) {';
  const pertarDedicatedStart = collectorSource.indexOf(pertarDedicatedStartNeedle);
  const pertarDedicatedEnd = collectorSource.indexOf(
    pertarDedicatedEndNeedle, pertarDedicatedStart,
  );
  assert(pertarDedicatedStart >= 0 && pertarDedicatedEnd > pertarDedicatedStart,
    'Pertar dedicated source section is empty');
  const pertarDedicatedSource = collectorSource.slice(
    pertarDedicatedStart, pertarDedicatedEnd,
  );
  const deadPertarDedicatedCopy = `if (false) {\n${pertarDedicatedSource}\n\n`
    + 'async function activateSurveyDock(send, sessionId) {}\n}\n\n';
  let duplicatePertarDedicatedSource = collectorSource.slice(0, pertarDedicatedStart)
    + deadPertarDedicatedCopy + collectorSource.slice(pertarDedicatedStart);
  const operativePertarConditionIndex = duplicatePertarDedicatedSource.lastIndexOf(
    pertarTerminalCondition,
  );
  assert(operativePertarConditionIndex > pertarDedicatedStart,
    'operative Pertar terminal condition is not uniquely addressable');
  duplicatePertarDedicatedSource = duplicatePertarDedicatedSource.slice(
    0, operativePertarConditionIndex,
  ) + pertarTerminalCondition.replace(' || lastError !== null', '')
    + duplicatePertarDedicatedSource.slice(
      operativePertarConditionIndex + pertarTerminalCondition.length,
    );
  const duplicatePertarDedicatedSeal = assessArc4RecoveryInstrumentSeal(
    duplicatePertarDedicatedSource, PAGE_EVIDENCE_SOURCES,
  );
  assert(duplicatePertarDedicatedSeal.ok === false
    && duplicatePertarDedicatedSeal.checks.collectorSourceDigest === false
    && duplicatePertarDedicatedSeal.checks.collectorProductionSourceDigest === false
    && duplicatePertarDedicatedSeal.checks.pertarDedicatedCollectors === false
    && duplicatePertarDedicatedSeal.checks.pertarDedicatedSourceDigest === true
    && duplicatePertarDedicatedSeal.checks.pertarPhaseFailureClassified === true
    && Object.entries(duplicatePertarDedicatedSeal.checks).every(([name, value]) => (
      [
        'collectorSourceDigest', 'collectorProductionSourceDigest',
        'pertarDedicatedCollectors',
      ].includes(name)
        ? value === false : value === true
    )), 'dead-copy Pertar extraction boundary did not fail only source digests/unique ownership');
  const pertarDedicatedOwnerEndNeedle = '\nfunction browserSample(browser) {';
  const pertarDedicatedOwnerEnd = collectorSource.indexOf(
    pertarDedicatedOwnerEndNeedle, pertarDedicatedEnd,
  );
  assert(pertarDedicatedOwnerEnd > pertarDedicatedEnd,
    'Pertar dedicated owner boundary is empty');
  assertInstrumentSealOnly(
    collectorSource.slice(0, pertarDedicatedStart)
      + 'if (false) {\n'
      + collectorSource.slice(pertarDedicatedStart, pertarDedicatedOwnerEnd)
      + '\n}\n'
      + collectorSource.slice(pertarDedicatedOwnerEnd),
    'collectorProductionSourceDigest',
    'dead-branched sole Pertar dedicated collector',
  );
  const pertarPhaseStartNeedle = "    currentStage = 'offline-reopened';";
  const pertarPhaseAfterNeedle = '    const samples = [];';
  const pertarPhaseStart = collectorSource.indexOf(pertarPhaseStartNeedle);
  const pertarPhaseAfter = collectorSource.indexOf(
    pertarPhaseAfterNeedle, pertarPhaseStart,
  );
  assert(pertarPhaseStart >= 0 && pertarPhaseAfter > pertarPhaseStart,
    'Pertar phase owner boundary is empty');
  assertInstrumentSealOnly(
    collectorSource.slice(0, pertarPhaseStart)
      + '    /*\n'
      + collectorSource.slice(pertarPhaseStart, pertarPhaseAfter)
      + '    */\n'
      + collectorSource.slice(pertarPhaseAfter),
    'collectorProductionSourceDigest',
    'comment-shadowed sole Pertar phase collector',
  );
  const verificationOwnerNeedle = '\nfunction verifyRecoveryRun(options) {';
  assertInstrumentSealOnly(
    collectorSource.replace(
      verificationOwnerNeedle,
      "\nassessPertarSurfaceObservation = () => ({ instrumentOk: true, productOk: true });"
        + "\nwaitForPertarSurface = async () => ({ state: {}, ui: {} });"
        + verificationOwnerNeedle,
    ),
    'collectorSourceDigest',
    'post-boundary rebound Pertar dedicated collector',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      '} catch (error) { lastError = error; }\n    await sleep(50);\n  }\n  if (last === null || lastError !== null',
      '} catch (error) { lastError = null; }\n    await sleep(50);\n  }\n  if (last === null || lastError !== null',
    ),
    'pertarPhaseFailureClassified', 'discarded Pertar sampler error',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'last = Object.freeze({ surface, assessment });\n      lastError = null;',
      'last = Object.freeze({ surface, assessment });',
    ),
    'pertarPhaseFailureClassified', 'kept stale Pertar sampler error sticky',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'throw new ProductFailure(`${label} product state timed out`, last.assessment);',
      'throw new InstrumentFailure(`${label} product state timed out`, last.assessment);',
    ),
    'pertarPhaseFailureClassified', 'instrument-classified Pertar product timeout',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'runtimeOrder: runtimeCapture.receipt.observed.runtimeNondecreasing === true,',
      'runtimeOrder: true,',
    ),
    'pertarPhaseRuntimeOrder', 'bypassed Pertar runtime-order verdict',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'runtimeTuple: Number.isSafeInteger(runtime?.revision) && runtime.revision >= 0',
      'runtimeTuple: true || Number.isSafeInteger(runtime?.revision) && runtime.revision >= 0',
    ),
    'pertarPhaseRuntimeTuple', 'bypassed Pertar runtime-tuple verdict',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'runtime.revision === uiRuntime.revision',
      'true',
    ),
    'pertarAssessmentSourceDigest', 'removed Pertar runtime revision equality',
  );
  assertInstrumentSealOnly(
    collectorSource.replace('const ordinal=captures.length', 'const ordinal=0'),
    'pertarCaptureWitnessDerived', 'constant Pertar capture ordinal',
  );
  const forgedPertarTimestamps = collectorSource.replace(
    'startedAtPerformanceMs=globalThis.performance.now(),value=read(),\n            endedAtPerformanceMs=globalThis.performance.now(),',
    'startedAtPerformanceMs=0,value=read(),\n            endedAtPerformanceMs=0,',
  );
  assertInstrumentSealOnly(
    forgedPertarTimestamps,
    ['pertarCaptureTimestampDerived', 'noPertarClockShadow'],
    'forged Pertar timestamps',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'startedAtPerformanceMs=globalThis.performance.now(),value=read(),\n            endedAtPerformanceMs=globalThis.performance.now(),',
      'startedAtPerformanceMs=Math.trunc(globalThis.performance.now()),value=read(),\n            endedAtPerformanceMs=Math.trunc(globalThis.performance.now()),',
    ),
    'pertarCaptureTimestampDerived', 'shadowable Pertar timestamp wrapper',
  );
  const shadowedPertarPerformance = collectorSource.replace(
    '`(()=>{const S=window.__CF_SLICE__,captures=[]',
    '`(()=>{const S=window.__CF_SLICE__;const performance={now:()=>0};const captures=[]',
  );
  assertInstrumentSealOnly(
    shadowedPertarPerformance,
    ['noProductionClockOverride', 'noPertarClockShadow'],
    'shadowed Pertar performance clock',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      '`(()=>{const S=window.__CF_SLICE__,captures=[]',
      '`(()=>{const S=window.__CF_SLICE__;globalThis={performance:{now:()=>0}};const captures=[]',
    ),
    ['noProductionClockOverride', 'noPertarClockShadow'],
    'assigned Pertar global clock shadow',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      '`(()=>{const S=window.__CF_SLICE__,captures=[]',
      '`(()=>{const S=window.__CF_SLICE__;globalThis&&={performance:{now:()=>0}};const captures=[]',
    ),
    ['noProductionClockOverride', 'noPertarClockShadow'],
    'compound-assigned Pertar global clock shadow',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      '`(()=>{const S=window.__CF_SLICE__,captures=[],capture=(kind,read)=>{',
      '`(()=>{const S=window.__CF_SLICE__,captures=[];const {root:globalThis}={root:{performance:{now:()=>0}}};const capture=(kind,read)=>{',
    ),
    ['noProductionClockOverride', 'noPertarClockShadow'],
    'destructuring-shadowed Pertar global clock',
  );
  const parameterShadowedPertarClock = collectorSource.replace(
    '`(()=>{const S=window.__CF_SLICE__,captures=[]',
    '`((globalThis)=>{const S=window.__CF_SLICE__,captures=[]',
  ).replace(
    'return {state,ui,runtimeCaptureWitness}})()`',
    'return {state,ui,runtimeCaptureWitness}})({performance:{now:()=>0}})`',
  );
  assertInstrumentSealOnly(
    parameterShadowedPertarClock,
    ['pertarSamplerBoundary', 'noPertarClockShadow'],
    'parameter-shadowed Pertar global clock',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'documentTokenAfter=S?.documentToken??null,p=value?.persistence??null,\n            r=p?.runtime??null,receipt={kind,ordinal,documentTokenBefore,documentTokenAfter,\n              snapshotDocumentToken:p?.documentToken??null,startedAtPerformanceMs,',
      'documentTokenAfter=documentTokenBefore,p=value?.persistence??null,\n            r=p?.runtime??null,receipt={kind,ordinal,documentTokenBefore,documentTokenAfter,\n              snapshotDocumentToken:documentTokenBefore,startedAtPerformanceMs,',
    ),
    'pertarCaptureTokenDerived', 'copied Pertar capture document tokens',
  );
  const unboundPertarState = collectorSource.replace(
    pertarUiThenState,
    "preState=S?.api?.state?.()??null,\n          uiCapture=capture('ui',()=>${ARC4_CAPTURE_UI_EXPRESSION}),\n          stateCapture=capture('state',()=>S?.api?.state?.()??null),",
  ).replace(
    'ui=uiCapture.value,state=stateCapture.value,',
    'ui=uiCapture.value,state=preState,',
  );
  assertInstrumentSealOnly(
    unboundPertarState, 'pertarCaptureValueBound',
    'unreceipted pre-UI Pertar state',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'state: projectArc4RecoveryRuntimeCaptureSnapshot(surface?.state),',
      'state: projectArc4RecoveryRuntimeCaptureSnapshot(surface?.ui),',
    ),
    'pertarCaptureEvidenceBound', 'unbound Pertar state evidence',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'const receipt = assessArc4RecoveryRuntimeCaptureWitness({\n    witness: surface?.runtimeCaptureWitness,',
      'const receipt = assessArc4RecoveryRuntimeCaptureWitness({\n    witness: { bogus: true },',
    ),
    'pertarCaptureWitnessEnforced', 'unbound Pertar witness assessor input',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'return Object.freeze({\n    witness: surface?.runtimeCaptureWitness ?? null,',
      'return Object.freeze({\n    witness: { bogus: true },',
    ),
    'pertarCaptureEvidenceBound', 'unbound Pertar capture witness evidence',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      '    receipt,\n  });\n}',
      '    receipt: { ok: true },\n  });\n}',
    ),
    'pertarCaptureEvidenceBound', 'unbound Pertar capture receipt evidence',
  );
  const bypassedPertarWitness = collectorSource.replace(
    'instrumentAssert(runtimeCaptureEvidence.receipt.ok,',
    'instrumentAssert(true,',
  );
  assertInstrumentSealOnly(
    bypassedPertarWitness, 'pertarCaptureWitnessEnforced',
    'bypassed Pertar witness enforcement',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      "    retainStageEvidence('active-observation', { reactivatedPertarSurface });\n",
      '',
    ),
    'pertarPhaseReceiptsRetained', 'unpersisted pre-observation reactivated receipt',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      "updateRecoveryStage(report.stages, idValue, 'running', evidence);",
      'updateRecoveryStage(report.stages, idValue, null, evidence);',
    ),
    'pertarFailureEvidenceMerged', 'reactivated receipt left not-run while observing',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      "if (['not-run', 'running'].includes(\n      report.stages.find((stage) => stage.id === currentStage)?.status,\n    )) {",
      "if (report.stages.find((stage) => stage.id === currentStage)?.status === 'not-run') {",
    ),
    'pertarFailureEvidenceMerged', 'running-stage failure skipped terminal red merge',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'raw: preRaw, state: surface.state, ui: surface.ui,\n      routeError: null, authorityReady: true,',
      'raw: preRaw, state: surface.ui, ui: surface.ui,\n      routeError: null, authorityReady: true,',
    ),
    'pertarPreconditionInputBound', 'unbound Pertar precondition state input',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      "productAssert(precondition.ok, 'Pertar recovery precondition is red', {",
      "instrumentAssert(precondition.ok, 'Pertar recovery precondition is red', {",
    ),
    'pertarPreconditionProductClassified',
    'instrument-classified Pertar product precondition',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      "productAssert(precondition.ok, 'Pertar recovery precondition is red', {\n      runtimeCapture: runtimeCaptureEvidence, preconditionInput, precondition,\n    });",
      "productAssert(precondition.ok, 'Pertar recovery precondition is red', { bogus: true });",
    ),
    'pertarPreconditionProductClassified',
    'unbound Pertar product-precondition evidence',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      "documentToken: fixtureToken, seedWitness, preconditionInput, precondition,\n      runtimeCapture: runtimeCaptureEvidence,",
      "documentToken: fixtureToken, seedWitness, preconditionInput, precondition: { ok: true },\n      runtimeCapture: runtimeCaptureEvidence,",
    ),
    'pertarFixtureEvidenceBound', 'forged Pertar fixture-stage precondition',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'if (!condition) throw new InstrumentFailure(message, evidence);',
      'if (!condition) throw new Error(message);',
    ),
    'typedFailureAssertions', 'untyped instrument assertion',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'const classification = classifyRecoveryFailure(error);',
      "const classification = { status: 'fail', exitCode: 1, evidence: null };",
    ),
    'failureClassificationPath', 'bypassed failure classifier',
  );
  assertInstrumentSealOnly(
    collectorSource.replace(
      'const replayedFixturePrecondition = assessArc4CapturePrecondition(\n        fixtureEvidence?.preconditionInput,',
      'const replayedFixturePrecondition = fixtureEvidence?.preconditionInput && { ok: true, checks: {}, reasons: [] };\n      void (',
    ),
    'fixturePreconditionVerifierBound', 'bypassed terminal precondition replay',
  );

  const source = {
    commit: 'a'.repeat(40), branch: 'openai/mac', state: 'committed',
    statusSha256: 'b'.repeat(64), workingTreeSha256: 'c'.repeat(64),
  };
  const currentBuild = {
    schema: 'cf-v2-arc4-recovery-build/v1',
    files: [{ path: 'index.html', bytes: 123, sha256: 'd'.repeat(64) }],
    sha256: 'e'.repeat(64),
  };
  const currentInputs = {
    collector: 'f'.repeat(64), buildDist: currentBuild.sha256,
  };
  const slicePredecessor = {
    schema: 'cf-v2-slice-smoke-ci/v2', assuranceProfile: 'production',
    runId: 'slice-selftest',
    reportPath: 'apps/game/smoke/slice-smoke-slice-selftest.json',
    reportSha256: '1'.repeat(64),
    rawLogPath: 'apps/game/smoke/slice-smoke-slice-selftest.log',
    rawLogSha256: '2'.repeat(64), source: { ...source },
  };
  const predecessors = {
    slice: slicePredecessor,
    glass: {
      schema: GLASS_MATRIX_REPORT_SCHEMA, runId: 'glass-selftest',
      reportPath: 'apps/game/smoke/glassmatrix-glass-selftest.json',
      reportSha256: '3'.repeat(64), source: { ...source },
      slicePredecessor: structuredClone(slicePredecessor),
    },
  };
  const domainAssessment = { ok: true, checks: { synthetic: true }, reasons: [] };
  const replayedAuthorityBinding = projectArc4RecoveryObservationAuthority(
    recoveryBundle,
  );
  const terminalRuntimeCaptureEvidence = {
    witness: structuredClone(trustedRuntimeCapture),
    snapshots: {
      ui: projectArc4RecoveryRuntimeCaptureSnapshot(runtimeCaptureUi),
      state: projectArc4RecoveryRuntimeCaptureSnapshot(runtimeCaptureState),
    },
    receipt: structuredClone(trustedRuntimeReceipt),
  };
  const terminalFixturePrecondition = {
    ok: true,
    checks: Object.fromEntries(
      ARC4_RECOVERY_PRECONDITION_CHECK_KEYS.map((key) => [key, true]),
    ),
    reasons: [],
  };
  const retainedSyntheticSurface = ({ state, ui, phase, documentToken }) => {
    const surface = {
      state, ui, pollTiming: syntheticPertarPollTiming(),
      runtimeCaptureWitness: syntheticRuntimeCaptureWitness({
        documentToken,
        uiRuntime: ui.persistence.runtime,
        stateRuntime: state.persistence.runtime,
      }),
    };
    const assessment = assessPertarSurfaceObservation(surface, {
      phase, expectedDocumentToken: documentToken,
    });
    assert(assessment.instrumentOk && assessment.productOk,
      `synthetic retained ${phase} surface is red: ${JSON.stringify(assessment)}`);
    return retainPertarSurfaceEvidence({
      ...surface, runtimeCapture: assessment.runtimeCapture,
      surfaceAssessment: assessment,
    }, phase, documentToken);
  };
  const exhaustedRetainedState = structuredClone(recoveryBundle.exhaustedState);
  exhaustedRetainedState.persistence.runtime = syntheticRuntime(10_003, 55);
  const exhaustedRetainedUi = structuredClone(recoveryBundle.exhaustedUi);
  exhaustedRetainedUi.persistence.runtime = syntheticRuntime(10_002, 55);
  const exhaustedPertarSurface = retainedSyntheticSurface({
    state: exhaustedRetainedState,
    ui: exhaustedRetainedUi,
    phase: 'exhausted-visible', documentToken: runtimeCaptureToken,
  });
  const offlinePertarSurface = retainedSyntheticSurface({
    state: recoveryBundle.offlineState,
    ui: recoveryBundle.offlineUi,
    phase: 'exhausted-offline',
    documentToken: recoveryBundle.closure.reopenedDocumentToken,
  });
  const reactivatedState = structuredClone(recoveryBundle.offlineState);
  reactivatedState.persistence.runtime = syntheticRuntime(20_000, 16);
  const reactivatedUi = structuredClone(recoveryBundle.exhaustedUi);
  reactivatedUi.persistence.documentToken = recoveryBundle.closure.reopenedDocumentToken;
  reactivatedUi.persistence.runtime = syntheticRuntime(19_999, 16);
  const reactivatedPertarSurface = retainedSyntheticSurface({
    state: reactivatedState, ui: reactivatedUi,
    phase: 'exhausted-visible',
    documentToken: recoveryBundle.closure.reopenedDocumentToken,
  });
  const retainedRunningStages = updateRecoveryStage(
    initialStages(), 'active-observation', 'running', { reactivatedPertarSurface },
  );
  const retainedRunningActiveStage = retainedRunningStages.find(
    (stage) => stage.id === 'active-observation',
  );
  assert(retainedRunningActiveStage.status === 'running'
    && same(retainedRunningActiveStage.evidence.reactivatedPertarSurface,
      reactivatedPertarSurface),
  'pre-observation running stage did not durably retain reactivated Pertar evidence');
  const retainedFailedStages = updateRecoveryStage(
    retainedRunningStages, 'active-observation', 'fail', {
      message: 'selftest post-reactivation failure',
      evidence: { selftest: true },
    },
  );
  const retainedFailedActiveStage = retainedFailedStages.find(
    (stage) => stage.id === 'active-observation',
  );
  assert(retainedFailedActiveStage.status === 'fail'
    && same(retainedFailedActiveStage.evidence.reactivatedPertarSurface,
      reactivatedPertarSurface)
    && retainedFailedActiveStage.evidence.message
      === 'selftest post-reactivation failure',
  'post-reactivation failure discarded retained Pertar evidence or stayed non-red');
  const stages = ARC4_RECOVERY_STAGE_ORDER.map((idValue) => ({
    id: idValue, status: 'pass', evidence: idValue === 'fixture' ? {
      documentToken: runtimeCaptureToken,
      runtimeCapture: terminalRuntimeCaptureEvidence,
      preconditionInput: {
        raw: { synthetic: true },
        state: runtimeCaptureState,
        ui: runtimeCaptureUi,
        routeError: null,
        authorityReady: true,
      },
      precondition: terminalFixturePrecondition,
    } : idValue === 'exhausted' ? {
      pertarSurface: exhaustedPertarSurface,
    } : idValue === 'offline-reopened' ? {
      pertarSurface: offlinePertarSurface,
    } : idValue === 'active-observation' ? {
      reactivatedPertarSurface,
    } : null,
  }));
  const terminal = {
    schema: ARC4_RECOVERY_REPORT_SCHEMA, status: 'pass', runId: 'selftest-run',
    terminal: true,
    artifact: { path: 'apps/game/smoke/arc4-recovery-selftest-run.json' },
    startedAt: '2026-08-27T00:00:00.000Z', endedAt: '2026-08-27T00:00:01.000Z', durationMs: 1000,
    lifecycle: { schema: ARC4_RECOVERY_LIFECYCLE_SCHEMA, status: 'complete' },
    policy: POLICY, cleanup: {
      browser: true, server: true, browserContext: true, workspaceLock: true,
    },
    source: { begin: source, end: source }, build: currentBuild,
    inputs: currentInputs, browser: input.browser,
    predecessorSelection: { sliceRunId: 'slice-selftest', glassRunId: 'glass-selftest' },
    recoveryBundle, observationInput: input, domainAssessment,
    observationVerdict: baseline, ordinarySliceSeal: ordinarySeal,
    instrumentSeal, predecessors, stages, firstFailure: null, fatalEvents: [], findings: [],
  };
  const terminalReplay = {
    expectedRunId: 'selftest-run', currentSource: source,
    replayedDomainAssessment: domainAssessment,
    replayedObservationVerdict: baseline, replayedAuthorityBinding,
    replayedFixturePrecondition: terminalFixturePrecondition,
    replayedPertarSurfaces: replayPertarStageSurfaces(stages),
    currentBuild, currentInputs, ordinarySliceSeal: ordinarySeal, instrumentSeal,
    expectedPredecessors: predecessors,
    expectedArtifactPath: 'apps/game/smoke/arc4-recovery-selftest-run.json',
  };
  const reportErrors = terminalArc4RecoveryReportErrors(
    terminal, terminalReplay,
  );
  assert(same(reportErrors, []),
    `terminal recovery report baseline is red: ${reportErrors.join(', ')}`);
  const errorsWithFreshPertarReplay = (candidate) => (
    terminalArc4RecoveryReportErrors(candidate, {
      ...terminalReplay,
      replayedPertarSurfaces: replayPertarStageSurfaces(candidate.stages),
    })
  );
  const missingExhaustedPertarReceipt = structuredClone(terminal);
  delete missingExhaustedPertarReceipt.stages.find(
    (stage) => stage.id === 'exhausted',
  ).evidence.pertarSurface;
  assert(errorsWithFreshPertarReplay(missingExhaustedPertarReceipt).includes(
    'exhausted Pertar surface receipt replay',
  ), 'missing exhausted Pertar receipt stayed terminal-verifier green');
  const swappedPertarPhaseReceipts = structuredClone(terminal);
  const swappedOfflineStage = swappedPertarPhaseReceipts.stages.find(
    (stage) => stage.id === 'offline-reopened',
  );
  const swappedActiveStage = swappedPertarPhaseReceipts.stages.find(
    (stage) => stage.id === 'active-observation',
  );
  const originalOfflinePertarSurface = swappedOfflineStage.evidence.pertarSurface;
  swappedOfflineStage.evidence.pertarSurface =
    swappedActiveStage.evidence.reactivatedPertarSurface;
  swappedActiveStage.evidence.reactivatedPertarSurface = originalOfflinePertarSurface;
  const swappedPertarErrors = errorsWithFreshPertarReplay(swappedPertarPhaseReceipts);
  assert(swappedPertarErrors.includes('offline-reopened Pertar surface receipt replay')
    && swappedPertarErrors.includes('reactivated Pertar surface receipt replay'),
  'swapped offline/reactivated Pertar receipts stayed terminal-verifier green');
  const retokenedOfflinePertarReceipt = structuredClone(terminal);
  const retokenedOfflineEvidence = retokenedOfflinePertarReceipt.stages.find(
    (stage) => stage.id === 'offline-reopened',
  ).evidence.pertarSurface;
  const unrelatedOfflineToken = 'selftest-unrelated-offline-document';
  retokenedOfflineEvidence.expectedDocumentToken = unrelatedOfflineToken;
  retokenedOfflineEvidence.state.persistence.documentToken = unrelatedOfflineToken;
  retokenedOfflineEvidence.ui.persistence.documentToken = unrelatedOfflineToken;
  retokenedOfflineEvidence.runtimeCaptureWitness.documentToken = unrelatedOfflineToken;
  retokenedOfflineEvidence.runtimeCaptureWitness.captures.forEach((capture) => {
    capture.documentTokenBefore = unrelatedOfflineToken;
    capture.documentTokenAfter = unrelatedOfflineToken;
    capture.snapshotDocumentToken = unrelatedOfflineToken;
  });
  const retokenedOfflineReplay = replayPertarSurfaceEvidence(
    retokenedOfflineEvidence,
  );
  retokenedOfflineEvidence.runtimeCapture = retokenedOfflineReplay.runtimeCapture;
  retokenedOfflineEvidence.assessment = retokenedOfflineReplay.assessment;
  assert(retokenedOfflineReplay.assessment.instrumentOk
    && retokenedOfflineReplay.assessment.productOk,
  'coherently retokened offline Pertar receipt did not remain internally green');
  assert(errorsWithFreshPertarReplay(retokenedOfflinePertarReceipt).includes(
    'offline-reopened Pertar surface receipt replay',
  ), 'coherently retokened offline Pertar receipt escaped cross-stage binding');
  const forgedPertarReceipt = structuredClone(terminal);
  forgedPertarReceipt.stages.find(
    (stage) => stage.id === 'offline-reopened',
  ).evidence.pertarSurface.runtimeCaptureWitness.captures.reverse();
  assert(errorsWithFreshPertarReplay(forgedPertarReceipt).includes(
    'offline-reopened Pertar surface receipt replay',
  ), 'forged offline Pertar chronology stayed terminal-verifier green');
  const independentPertarMutations = {
    route: (next) => {
      next.state.planet += 1;
    },
    card: (next) => {
      next.ui.cardTitle = 'Forged Pertar';
    },
    runtime: (next) => {
      next.state.persistence.runtime.visible = false;
      next.ui.persistence.runtime.visible = false;
    },
    pending: (next) => {
      next.state.sceneResources.pendingPersistenceWrites = 1;
      next.ui.diagnostics.pendingWork = 1;
    },
  };
  for (const [name, mutate] of Object.entries(independentPertarMutations)) {
    const mutant = structuredClone(terminal);
    const mutantEvidence = mutant.stages.find(
      (stage) => stage.id === 'exhausted',
    ).evidence.pertarSurface;
    mutate(mutantEvidence);
    const freshReplay = replayPertarSurfaceEvidence(mutantEvidence);
    mutantEvidence.runtimeCapture = freshReplay.runtimeCapture;
    mutantEvidence.assessment = freshReplay.assessment;
    assert(errorsWithFreshPertarReplay(mutant).includes(
      'exhausted Pertar surface receipt replay',
    ), `coherently replayed retained Pertar ${name} stayed verifier-green`);
  }
  const coherentReactivatedRuntimeMutation = (name, mutate) => {
    const mutant = structuredClone(terminal);
    const mutantEvidence = mutant.stages.find(
      (stage) => stage.id === 'active-observation',
    ).evidence.reactivatedPertarSurface;
    mutate(mutantEvidence.state.persistence.runtime,
      mutantEvidence.ui.persistence.runtime);
    mutantEvidence.runtimeCaptureWitness = syntheticRuntimeCaptureWitness({
      documentToken: mutantEvidence.expectedDocumentToken,
      uiRuntime: mutantEvidence.ui.persistence.runtime,
      stateRuntime: mutantEvidence.state.persistence.runtime,
    });
    const freshReplay = replayPertarSurfaceEvidence(mutantEvidence);
    mutantEvidence.runtimeCapture = freshReplay.runtimeCapture;
    mutantEvidence.assessment = freshReplay.assessment;
    assert(freshReplay.assessment.instrumentOk
      && freshReplay.assessment.productOk,
    `coherent reactivated Pertar ${name} mutant was internally assessment-red`);
    assert(errorsWithFreshPertarReplay(mutant).includes(
      'reactivated Pertar surface receipt replay',
    ), `internally green reactivated Pertar ${name} mutant escaped causal binding`);
  };
  coherentReactivatedRuntimeMutation('retiming', (stateRuntime, uiRuntime) => {
    stateRuntime.activePlayMs = 20_001;
    uiRuntime.activePlayMs = 20_001;
  });
  coherentReactivatedRuntimeMutation('revision', (stateRuntime, uiRuntime) => {
    stateRuntime.revision = 18;
    uiRuntime.revision = 18;
  });
  coherentReactivatedRuntimeMutation('cycle', (stateRuntime, uiRuntime) => {
    stateRuntime.activePlayMs = ARC4_ACTIVE_PLAY_CYCLE_MS;
    uiRuntime.activePlayMs = ARC4_ACTIVE_PLAY_CYCLE_MS;
  });
  const earlyPass = structuredClone(terminal);
  earlyPass.cleanup.browser = false;
  earlyPass.lifecycle.status = 'pending';
  assert(terminalArc4RecoveryReportErrors(
    earlyPass, terminalReplay,
  ).includes('terminal cleanup'), 'pre-cleanup PASS mutation stayed green');
  const retried = structuredClone(terminal);
  retried.policy.automaticRetries = 1;
  assert(terminalArc4RecoveryReportErrors(
    retried, terminalReplay,
  ).includes('zero-retry policy'), 'terminal retry mutation stayed green');
  const missingStage = structuredClone(terminal);
  missingStage.stages[4] = structuredClone(missingStage.stages[3]);
  assert(terminalArc4RecoveryReportErrors(
    missingStage, terminalReplay,
  ).includes('stage ledger'), 'count-consistent missing stage stayed green');
  const missingFixtureCapture = structuredClone(terminal);
  missingFixtureCapture.stages[0].evidence = null;
  assert(terminalArc4RecoveryReportErrors(
    missingFixtureCapture, terminalReplay,
  ).includes('fixture runtime-capture evidence replay'),
  'missing fixture runtime-capture evidence stayed green');
  const omittedFixturePreconditionCheck = structuredClone(terminal);
  delete omittedFixturePreconditionCheck.stages[0].evidence.precondition.checks.actionsIdle;
  assert(terminalArc4RecoveryReportErrors(
    omittedFixturePreconditionCheck, terminalReplay,
  ).includes('fixture product-precondition replay'),
  'omitted fixture product-precondition check stayed green');
  const forgedFixturePreconditionInput = structuredClone(terminal);
  forgedFixturePreconditionInput.stages[0].evidence.preconditionInput.state = null;
  const replayedForgedFixturePrecondition = structuredClone(
    terminalFixturePrecondition,
  );
  replayedForgedFixturePrecondition.ok = false;
  replayedForgedFixturePrecondition.checks.captured = false;
  replayedForgedFixturePrecondition.reasons = [
    'Arc 4 capture precondition captured',
  ];
  assert(terminalArc4RecoveryReportErrors(forgedFixturePreconditionInput, {
    ...terminalReplay,
    replayedFixturePrecondition: replayedForgedFixturePrecondition,
  }).includes('fixture product-precondition replay'),
  'forged fixture product-precondition input stayed green');
  const forgedFixtureCapture = structuredClone(terminal);
  forgedFixtureCapture.stages[0].evidence.runtimeCapture.witness.captures.reverse();
  assert(terminalArc4RecoveryReportErrors(
    forgedFixtureCapture, terminalReplay,
  ).includes('fixture runtime-capture evidence replay'),
  'forged fixture runtime-capture chronology stayed green');
  const divergentHealthyFixtureCapture = structuredClone(terminal);
  const divergentRuntimeCapture = divergentHealthyFixtureCapture.stages[0]
    .evidence.runtimeCapture;
  divergentRuntimeCapture.witness.captures.forEach((capture) => {
    capture.runtime.activePlayMs += 100;
  });
  divergentRuntimeCapture.snapshots.ui.persistence.runtime.activePlayMs += 100;
  divergentRuntimeCapture.snapshots.state.persistence.runtime.activePlayMs += 100;
  divergentRuntimeCapture.receipt = assessArc4RecoveryRuntimeCaptureWitness({
    witness: divergentRuntimeCapture.witness,
    state: divergentRuntimeCapture.snapshots.state,
    ui: divergentRuntimeCapture.snapshots.ui,
    expectedDocumentToken: runtimeCaptureToken,
  });
  assert(divergentRuntimeCapture.receipt.ok === true
    && divergentRuntimeCapture.receipt.observed.runtimeNondecreasing === true,
  'divergent healthy runtime-capture mutant did not remain internally coherent');
  assert(terminalArc4RecoveryReportErrors(
    divergentHealthyFixtureCapture, terminalReplay,
  ).includes('fixture runtime-capture evidence replay'),
  'runtime-capture snapshots diverged from product-precondition inputs without detection');
  const divergentDocumentFixtureCapture = structuredClone(terminal);
  const divergentDocumentEvidence = divergentDocumentFixtureCapture.stages[0].evidence;
  divergentDocumentEvidence.preconditionInput.ui.persistence.documentToken =
    'unrelated-product-document';
  divergentDocumentEvidence.preconditionInput.state.persistence.documentToken =
    'unrelated-product-document';
  divergentDocumentEvidence.runtimeCapture.snapshots.ui.persistence.documentToken =
    'unrelated-product-document';
  divergentDocumentEvidence.runtimeCapture.snapshots.state.persistence.documentToken =
    'unrelated-product-document';
  divergentDocumentEvidence.runtimeCapture.receipt =
    assessArc4RecoveryRuntimeCaptureWitness({
      witness: divergentDocumentEvidence.runtimeCapture.witness,
      state: divergentDocumentEvidence.runtimeCapture.snapshots.state,
      ui: divergentDocumentEvidence.runtimeCapture.snapshots.ui,
      expectedDocumentToken: runtimeCaptureToken,
    });
  assert(divergentDocumentEvidence.runtimeCapture.receipt.ok === false
    && divergentDocumentEvidence.runtimeCapture.receipt.checks.documentToken === false,
  'cross-document product snapshots did not turn the runtime receipt red');
  assert(terminalArc4RecoveryReportErrors(
    divergentDocumentFixtureCapture, terminalReplay,
  ).includes('fixture runtime-capture evidence replay'),
  'cross-document product snapshots stayed terminal-verifier green');
  const coherentlyRetokenedFixture = structuredClone(terminal);
  const retokenedFixtureEvidence = coherentlyRetokenedFixture.stages[0].evidence;
  const unrelatedFixtureToken = 'unrelated-fixture-document';
  retokenedFixtureEvidence.documentToken = unrelatedFixtureToken;
  retokenedFixtureEvidence.runtimeCapture.witness.documentToken =
    unrelatedFixtureToken;
  retokenedFixtureEvidence.runtimeCapture.witness.captures.forEach((capture) => {
    capture.documentTokenBefore = unrelatedFixtureToken;
    capture.documentTokenAfter = unrelatedFixtureToken;
    capture.snapshotDocumentToken = unrelatedFixtureToken;
  });
  retokenedFixtureEvidence.preconditionInput.ui.persistence.documentToken =
    unrelatedFixtureToken;
  retokenedFixtureEvidence.preconditionInput.state.persistence.documentToken =
    unrelatedFixtureToken;
  retokenedFixtureEvidence.runtimeCapture.snapshots.ui.persistence.documentToken =
    unrelatedFixtureToken;
  retokenedFixtureEvidence.runtimeCapture.snapshots.state.persistence.documentToken =
    unrelatedFixtureToken;
  retokenedFixtureEvidence.runtimeCapture.receipt =
    assessArc4RecoveryRuntimeCaptureWitness({
      witness: retokenedFixtureEvidence.runtimeCapture.witness,
      state: retokenedFixtureEvidence.runtimeCapture.snapshots.state,
      ui: retokenedFixtureEvidence.runtimeCapture.snapshots.ui,
      expectedDocumentToken: unrelatedFixtureToken,
    });
  assert(retokenedFixtureEvidence.runtimeCapture.receipt.ok === true,
    'coherently retokened fixture did not remain internally green');
  assert(terminalArc4RecoveryReportErrors(
    coherentlyRetokenedFixture, terminalReplay,
  ).includes('fixture-to-recovery document chain'),
  'coherently retokened fixture detached from Recovery bundle without detection');
  const backwardFixtureCapture = structuredClone(terminal);
  const backwardFixtureRuntime = syntheticRuntime(19_999, 7);
  backwardFixtureCapture.stages[0].evidence.runtimeCapture.witness =
    syntheticRuntimeCaptureWitness({
      documentToken: runtimeCaptureToken,
      uiRuntime,
      stateRuntime: backwardFixtureRuntime,
    });
  backwardFixtureCapture.stages[0].evidence.runtimeCapture.snapshots.state =
    projectArc4RecoveryRuntimeCaptureSnapshot({
      persistence: {
        documentToken: runtimeCaptureToken, runtime: backwardFixtureRuntime,
      },
    });
  backwardFixtureCapture.stages[0].evidence.runtimeCapture.receipt =
    assessArc4RecoveryRuntimeCaptureWitness({
      witness: backwardFixtureCapture.stages[0].evidence.runtimeCapture.witness,
      state: backwardFixtureCapture.stages[0].evidence.runtimeCapture.snapshots.state,
      ui: backwardFixtureCapture.stages[0].evidence.runtimeCapture.snapshots.ui,
      expectedDocumentToken: runtimeCaptureToken,
    });
  assert(backwardFixtureCapture.stages[0].evidence.runtimeCapture.receipt.ok === true
    && backwardFixtureCapture.stages[0].evidence.runtimeCapture.receipt.observed
      .runtimeNondecreasing === false,
  'trusted-backward terminal mutant did not retain a valid receipt');
  assert(terminalArc4RecoveryReportErrors(
    backwardFixtureCapture, terminalReplay,
  ).includes('fixture runtime-capture evidence replay'),
  'trusted-backward terminal PASS mutation stayed green');
  const policyUnbound = structuredClone(terminal);
  policyUnbound.observationInput.policy = {
    ...policyUnbound.observationInput.policy,
    regularServiceGapMaxMs:
      policyUnbound.observationInput.policy.regularServiceGapMaxMs - 1,
  };
  assert(terminalArc4RecoveryReportErrors(
    policyUnbound, terminalReplay,
  ).includes('report-observation policy binding'),
  'report/observation policy split mutation stayed green');
  const browserUnbound = structuredClone(terminal);
  browserUnbound.observationInput.browser = {
    ...browserUnbound.observationInput.browser, revision: '@unrelated',
  };
  assert(terminalArc4RecoveryReportErrors(
    browserUnbound, terminalReplay,
  ).includes('report-observation browser binding'),
  'report/observation browser split mutation stayed green');
  const unrelatedBundle = structuredClone(terminal);
  unrelatedBundle.recoveryBundle.closure.reopenedDocumentToken
    = 'unrelated-bundle-document-token';
  const unrelatedProjection = projectArc4RecoveryObservationAuthority(
    unrelatedBundle.recoveryBundle,
  );
  assert(terminalArc4RecoveryReportErrors(unrelatedBundle, {
    ...terminalReplay,
    replayedAuthorityBinding: unrelatedProjection,
  }).includes('domain-observation authority binding replay'),
  'unrelated recovery bundle mutation stayed green');
  const staleBuild = structuredClone(terminal);
  staleBuild.build.sha256 = '0'.repeat(64);
  assert(terminalArc4RecoveryReportErrors(
    staleBuild, terminalReplay,
  ).includes('build byte authority'), 'stale build mutation stayed green');
  const staleInputs = structuredClone(terminal);
  staleInputs.inputs.collector = '0'.repeat(64);
  assert(terminalArc4RecoveryReportErrors(
    staleInputs, terminalReplay,
  ).includes('input byte authority'), 'stale input mutation stayed green');
  const missingPredecessors = structuredClone(terminal);
  missingPredecessors.predecessors = null;
  assert(terminalArc4RecoveryReportErrors(
    missingPredecessors, terminalReplay,
  ).includes('exact Slice/Glass predecessor chain'),
  'missing Slice/Glass predecessors stayed green');
  const wrongPredecessor = structuredClone(terminal);
  wrongPredecessor.predecessors.slice.reportSha256 = '4'.repeat(64);
  assert(terminalArc4RecoveryReportErrors(
    wrongPredecessor, terminalReplay,
  ).includes('exact Slice/Glass predecessor chain'),
  'wrong Slice predecessor hash stayed green');
  const developPredecessor = structuredClone(terminal);
  developPredecessor.predecessors.slice.assuranceProfile = 'develop';
  developPredecessor.predecessors.glass.slicePredecessor.assuranceProfile = 'develop';
  assert(terminalArc4RecoveryReportErrors(
    developPredecessor, terminalReplay,
  ).includes('exact Slice/Glass predecessor chain'),
  'coherently forged develop Slice/Glass recovery chain stayed green');
  const mismatchedNestedPredecessor = structuredClone(terminal);
  mismatchedNestedPredecessor.predecessors.glass.slicePredecessor.reportSha256 = '5'.repeat(64);
  const nestedErrors = terminalArc4RecoveryReportErrors(
    mismatchedNestedPredecessor, terminalReplay,
  );
  assert(nestedErrors.includes('exact Slice/Glass predecessor chain')
    && nestedErrors.includes('Glass-to-Slice nested predecessor binding'),
  'mismatched Glass→Slice nested binding stayed green');
  const wrongSelection = structuredClone(terminal);
  wrongSelection.predecessorSelection.glassRunId = 'targeted-or-foreign-glass';
  assert(terminalArc4RecoveryReportErrors(
    wrongSelection, terminalReplay,
  ).includes('requested-to-resolved predecessor binding'),
  'wrong requested Glass predecessor stayed green');

  const temporaryRoot = fs.mkdtempSync(path.join(
    fs.realpathSync(process.env.TMPDIR || '/tmp'), `cf-arc4-recovery-selftest-${process.pid}-`,
  ));
  try {
    const immutableRecovery = path.join(temporaryRoot, 'arc4-recovery-immutable-selftest.json');
    atomicCreateJson(immutableRecovery, { status: 'running', runId: 'immutable-selftest' });
    const immutableBefore = fs.readFileSync(immutableRecovery);
    let immutableRefused = false;
    try { atomicCreateJson(immutableRecovery, { status: 'pass', runId: 'immutable-selftest' }); }
    catch { immutableRefused = true; }
    assert(immutableRefused && fs.readFileSync(immutableRecovery).equals(immutableBefore),
      'reused recovery run ID overwrote its immutable artifact');

    const glassRunId = 'glass-chain-selftest';
    const glassFile = path.join(temporaryRoot, `glassmatrix-${glassRunId}.json`);
    const glassOutcomes = GLASS_MATRIX_VIEWPORTS.flatMap(({ label }) => (
      GLASS_ARC4_CAPTURE_OUTCOME_CODES.map((code) => ({
        viewport: label, surface: 'survey-capture', code, ok: true,
        checks: glassSelftestChecks(code), reasons: [], diagnostics: null,
      }))
    ));
    const glassBaseline = {
      schema: GLASS_MATRIX_REPORT_SCHEMA, status: 'pass', terminal: true,
      scope: 'full-certifying', certifying: true,
      startedAt: '2026-08-27T00:00:00.000Z', endedAt: '2026-08-27T00:00:01.000Z', durationMs: 1000,
      run: { id: glassRunId, artifactPath: `apps/game/smoke/glassmatrix-${glassRunId}.json` },
      exit: { code: 0 }, source, sourceEnd: { ...source },
      sourceChange: { detected: false, ending: null },
      predecessors: { slice: slicePredecessor },
      browser: {
        executable: '/selftest/chrome', product: 'Edg/999.0.0.1',
        revision: '@selftest-chromium-revision',
        user_agent: 'Mozilla/5.0 HeadlessChrome/999.0.0.0 Edg/999.0.0.0',
        js_version: '99.0.0.1', protocol_version: '1.3',
        consistentAcrossViewports: true,
      },
      viewportInventory: glassViewportInventory(),
      viewportTimings: GLASS_MATRIX_VIEWPORTS.map(({ label }) => ({ label, durationMs: 1 })),
      summary: { viewportCount: GLASS_MATRIX_VIEWPORTS.length,
        findingCount: 0, instrumentFailureCount: 0, counts: {} },
      findings: [], instrumentFailures: [],
      arc4CaptureOutcomeInventory: {
        plannedOutcomeCodes: [...GLASS_ARC4_CAPTURE_OUTCOME_CODES], complete: true,
        expectedCount: glassOutcomes.length, observedCount: glassOutcomes.length,
        omitted: [], outcomes: glassOutcomes,
      },
      shipyardKeyboardHeartbeatInventory:
        glassShipyardKeyboardHeartbeatSelftestInventory(),
      controlSummary: {
        selftestRan: true,
        negativeControls: [...GLASS_NEGATIVE_CONTROLS].sort(codeUnitCompare),
        plannedNegativeControls: [...GLASS_NEGATIVE_CONTROLS],
        automaticRetries: 0, omittedNegativeControls: [], blockedNegativeControls: [],
      },
    };
    const assessGlass = (value) => {
      atomicWriteJson(glassFile, value);
      return verifyGlassPredecessor(glassRunId, {
        currentSource: source, slice: slicePredecessor, directory: temporaryRoot,
      });
    };
    assert(assessGlass(glassBaseline).ok, 'exact full Glass predecessor baseline is red');
    const glassControls = [
      ['stale-pass', { ...glassBaseline, run: { ...glassBaseline.run, id: 'stale-pass' } }, 'run ID mismatch'],
      ['targeted', { ...glassBaseline, scope: 'targeted-diagnostic', certifying: false }, 'targeted/non-full'],
      ['dirty-source', { ...glassBaseline, source: { ...source, state: 'dirty-diagnostic' },
        sourceEnd: { ...source, state: 'dirty-diagnostic' } }, 'not clean committed'],
      ['missing-slice', { ...glassBaseline, predecessors: null }, 'Slice predecessor'],
      ['legacy-slice', { ...glassBaseline,
        predecessors: { slice: { ...slicePredecessor,
          schema: 'cf-v2-slice-smoke-ci/v1', assuranceProfile: undefined } } },
      'not current profile-bound v2 evidence'],
      ['missing-slice-profile', { ...glassBaseline,
        predecessors: { slice: { ...slicePredecessor, assuranceProfile: undefined } } },
      'not current profile-bound v2 evidence'],
      ['develop-slice', { ...glassBaseline,
        predecessors: { slice: { ...slicePredecessor, assuranceProfile: 'develop' } } },
      'Slice predecessor'],
      ['mismatched-slice', { ...glassBaseline,
        predecessors: { slice: { ...slicePredecessor, reportSha256: '9'.repeat(64) } } }, 'Slice predecessor'],
      ['fake-viewport', { ...glassBaseline,
        viewportInventory: glassBaseline.viewportInventory.map((row, index) => index === 0
          ? { ...row, label: 'fake-phone' } : row) }, 'exact ordered 12-row matrix'],
      ['malformed-timing', { ...glassBaseline,
        viewportTimings: glassBaseline.viewportTimings.map((row, index) => index === 0
          ? { ...row, durationMs: 0 } : row) }, 'timing inventory is malformed'],
      ['legacy-schema-downgrade', { ...glassBaseline, schema: 'cf-v2-glassmatrix/v1' },
      'current Glass PASS schema is required'],
      ['missing-shipyard-heartbeat', { ...glassBaseline,
        shipyardKeyboardHeartbeatInventory: undefined },
      'Shipyard keyboard heartbeat inventory'],
      ['forged-shipyard-toggle', (() => {
        const value = structuredClone(glassBaseline);
        value.shipyardKeyboardHeartbeatInventory.outcomes[0].afterOpen = true;
        return value;
      })(), 'Shipyard keyboard heartbeat outcome'],
      ['forged-shipyard-semantic-lineage', (() => {
        const value = structuredClone(glassBaseline);
        value.shipyardKeyboardHeartbeatInventory.outcomes[0]
          .heartbeat.after.current.accessibleName = 'Forged mining';
        return value;
      })(), 'Shipyard keyboard heartbeat outcome'],
      ['empty-outcomes', { ...glassBaseline,
        arc4CaptureOutcomeInventory: { ...glassBaseline.arc4CaptureOutcomeInventory, outcomes: [] } },
      'outcome inventory is empty'],
      ['vacuous-outcome', { ...glassBaseline,
        arc4CaptureOutcomeInventory: { ...glassBaseline.arc4CaptureOutcomeInventory,
          outcomes: glassBaseline.arc4CaptureOutcomeInventory.outcomes.map((row, index) => index === 0
            ? { ...row, checks: {} } : row) } }, 'outcome inventory is empty'],
      ['wrong-outcome-check-key', { ...glassBaseline,
        arc4CaptureOutcomeInventory: { ...glassBaseline.arc4CaptureOutcomeInventory,
          outcomes: glassBaseline.arc4CaptureOutcomeInventory.outcomes.map((row, index) => {
            if (index !== 0) return row;
            const checks = { ...row.checks, captureObserved: true };
            delete checks.captured;
            return { ...row, checks };
          }) } },
      'outcome inventory is empty'],
      ['missing-outcome-check-key', { ...glassBaseline,
        arc4CaptureOutcomeInventory: { ...glassBaseline.arc4CaptureOutcomeInventory,
          outcomes: glassBaseline.arc4CaptureOutcomeInventory.outcomes.map((row, index) => {
            if (index !== 0) return row;
            const checks = { ...row.checks };
            delete checks.captured;
            return { ...row, checks };
          }) } }, 'outcome inventory is empty'],
      ['extra-outcome-check-key', { ...glassBaseline,
        arc4CaptureOutcomeInventory: { ...glassBaseline.arc4CaptureOutcomeInventory,
          outcomes: glassBaseline.arc4CaptureOutcomeInventory.outcomes.map((row, index) => index === 0
            ? { ...row, checks: { ...row.checks, independentReplay: true } } : row) } },
      'outcome inventory is empty'],
      ['wrong-browser-family', { ...glassBaseline,
        browser: { ...glassBaseline.browser, product: 'Firefox/999.0.0.1' } },
      'version-tolerant Chrome/Edge'],
      ['wrong-browser-protocol', { ...glassBaseline,
        browser: { ...glassBaseline.browser, protocol_version: '1.2' } },
      'version-tolerant Chrome/Edge'],
      ['missing-browser-provenance', { ...glassBaseline,
        browser: Object.fromEntries(Object.entries(glassBaseline.browser)
          .filter(([key]) => key !== 'revision')) },
      'version-tolerant Chrome/Edge'],
      ['omitted-control', { ...glassBaseline,
        controlSummary: { ...glassBaseline.controlSummary,
          negativeControls: glassBaseline.controlSummary.negativeControls.slice(1) } },
      'planned-vs-executed negative-control ledger'],
      ['summary-contradiction', { ...glassBaseline,
        findings: [{ viewport: 'small-phone', surface: 'selftest', code: 'INJECTED' }] },
      'summary/findings/instrument-failures'],
    ];
    for (const [name, mutant, diagnosis] of glassControls) {
      const outcome = assessGlass(mutant);
      assert(!outcome.ok && outcome.errors.some((error) => error.includes(diagnosis)),
        `${name} Glass predecessor mutation stayed green: ${outcome.errors.join(', ')}`);
    }
    const missingGlass = verifyGlassPredecessor('glass-missing-selftest', {
      currentSource: source, slice: slicePredecessor, directory: temporaryRoot,
    });
    assert(!missingGlass.ok && missingGlass.errors.some((error) => error.includes('missing')),
      'missing Glass predecessor stayed green');

    const file = path.join(temporaryRoot, 'report.json');
    atomicWriteJson(file, { ...terminal, runId: 'stale-pass' });
    atomicWriteJson(file, {
      ...terminal, status: 'running', runId: 'current-run',
      lifecycle: { schema: ARC4_RECOVERY_LIFECYCLE_SCHEMA, status: 'pending' },
    });
    assert(JSON.parse(fs.readFileSync(file, 'utf8')).status === 'running',
      'current running record did not replace stale PASS before work');
    atomicWriteJson(file, {
      ...terminal, status: 'instrument-fail', runId: 'current-run',
      firstFailure: { stage: 'fixture', message: 'injected early exit' },
    });
    const red = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert(red.status === 'instrument-fail' && red.runId === 'current-run',
      'injected early exit left stale/running evidence');
  } finally { fs.rmSync(temporaryRoot, { recursive: true }); }
  console.log('ARC 4 RECOVERY SELFTEST: PASS — fixed real 20-minute duration, trusted UI→state capture chronology, target service, focus/visibility, boundary, stale PASS, zero retry, and no-forged-time controls are mutation-sensitive');
}

function verifyRecoveryRun(options) {
  const id = evidenceRunId(options.verifyRunId, 'Arc 4 recovery');
  const artifacts = recoveryArtifactPaths(id);
  assert(fs.existsSync(artifacts.report),
    `immutable Arc 4 recovery report is missing: ${artifacts.reportRelative}`);
  const bytes = fs.readFileSync(artifacts.report);
  let report;
  try { report = JSON.parse(bytes.toString('utf8')); }
  catch (error) { fail(`immutable Arc 4 recovery report is invalid JSON: ${error.message}`); }
  const currentSource = sourceIdentity();
  assert(currentSource.state === 'committed',
    'Arc 4 recovery verification requires committed clean source');
  const predecessors = resolvePredecessors(options, currentSource);
  const replayedDomainAssessment = assessArc4ExhaustionRecovery(
    report.recoveryBundle,
  );
  const replayedObservationVerdict = evaluateArc4RecoveryObservation(
    report.observationInput,
  );
  const replayedAuthorityBinding = projectArc4RecoveryObservationAuthority(
    report.recoveryBundle,
  );
  const fixtureEvidence = report.stages.find(
    (stage) => stage?.id === 'fixture',
  )?.evidence;
  const replayedFixturePrecondition = assessArc4CapturePrecondition(
    fixtureEvidence?.preconditionInput,
  );
  const replayedPertarSurfaces = replayPertarStageSurfaces(report.stages);
  const ordinarySliceSeal = assessOrdinarySliceRecoverySeal(
    fs.readFileSync(ordinarySlicePath, 'utf8'),
  );
  const instrumentSeal = assessArc4RecoveryInstrumentSeal(
    fs.readFileSync(collectorPath, 'utf8'), PAGE_EVIDENCE_SOURCES,
  );
  const currentBuild = distIdentity();
  const currentInputs = inputIdentity(currentBuild.sha256, predecessors);
  const errors = terminalArc4RecoveryReportErrors(report, {
    expectedRunId: id, currentSource,
    replayedDomainAssessment, replayedObservationVerdict,
    replayedAuthorityBinding, replayedFixturePrecondition,
    replayedPertarSurfaces,
    currentBuild, currentInputs,
    ordinarySliceSeal, instrumentSeal,
    expectedPredecessors: predecessors,
    expectedArtifactPath: artifacts.reportRelative,
  });
  if (errors.length) fail(`Arc 4 recovery verification failed: ${errors.join('; ')}`);
  console.log(`ARC 4 RECOVERY VERIFY: PASS — ${id}`);
  console.log(`  report sha256: ${sha256(bytes)}`);
  console.log(`  Slice predecessor: ${predecessors.slice.runId} ${predecessors.slice.reportSha256}`);
  console.log(`  Glass predecessor: ${predecessors.glass.runId} ${predecessors.glass.reportSha256}`);
}

function parseArgs(argv) {
  if (argv.length === 1 && argv[0] === '--selftest') {
    return Object.freeze({ selftest: true });
  }
  const sliceArgs = argv.filter((arg) => arg.startsWith('--slice-run='));
  const glassArgs = argv.filter((arg) => arg.startsWith('--glass-run='));
  const verifyArgs = argv.filter((arg) => arg.startsWith('--verify-run='));
  const recognized = argv.every((arg) => arg.startsWith('--slice-run=')
    || arg.startsWith('--glass-run=') || arg.startsWith('--verify-run='));
  if (recognized && sliceArgs.length === 1 && glassArgs.length === 1
    && verifyArgs.length <= 1 && argv.length === 2 + verifyArgs.length) {
    return Object.freeze({
      selftest: false,
      sliceRunId: evidenceRunId(sliceArgs[0].slice('--slice-run='.length), 'Slice'),
      glassRunId: evidenceRunId(glassArgs[0].slice('--glass-run='.length), 'Glass'),
      verifyRunId: verifyArgs.length
        ? evidenceRunId(verifyArgs[0].slice('--verify-run='.length), 'Arc 4 recovery') : null,
    });
  }
  fail('usage: node tools/arc4recovery.mjs [--selftest | --slice-run=<Slice-run-id> --glass-run=<Glass-run-id> [--verify-run=<Recovery-run-id>]]');
}

if (process.argv[1] && path.resolve(process.argv[1]) === collectorPath) {
  let options;
  try { options = parseArgs(process.argv.slice(2)); }
  catch (error) { console.error(error.message); process.exitCode = 2; }
  if (options) {
    if (options.selftest) {
      try { runSelftest(); }
      catch (error) { console.error(`ARC 4 RECOVERY SELFTEST: FAIL — ${error.message}`); process.exitCode = 1; }
    } else if (options.verifyRunId) {
      try { verifyRecoveryRun(options); }
      catch (error) { console.error(`ARC 4 RECOVERY VERIFY: FAIL — ${error.message}`); process.exitCode = 2; }
    } else {
      const exitCode = await runCertificate(options);
      process.exitCode = exitCode;
    }
  }
}
