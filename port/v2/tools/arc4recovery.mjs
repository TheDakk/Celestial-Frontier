/* arc4recovery.mjs — dedicated real-time Arc 4 recovery certificate.

   The ordinary Slice remains a bounded functional smoke and explicitly does
   not claim recovery. This one-attempt collector creates the same Pertar
   authority, exhausts it through the registered capture writer, checkpoints
   and truly closes that target, then observes one newly loaded target for a
   full real 20-minute active-play cycle. No wall clock, browser virtual-time
   policy, product clock, RNG or durable authority is advanced by the tool.

   Usage:
     node tools/arc4recovery.mjs
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
import {
  ARC4_ACTIVE_PLAY_CYCLE_MS,
  ARC4_CAPTURE_UI_EXPRESSION,
  ARC4_DURABLE_READ_EXPRESSION,
  ARC4_PERTAR_FIXTURE,
  ARC4_RECOVERY_CLOSED_INTERVAL_MIN_MS,
  ARC4_RECOVERY_CLOSURE_EVIDENCE_SCHEMA,
  assessArc4BurnStep,
  assessArc4CapturePrecondition,
  assessArc4Exhaustion,
  assessArc4ExhaustionRecovery,
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
  ARC4_RECOVERY_REGULAR_SERVICE_GAP_MAX_MS,
  ARC4_RECOVERY_REPORT_SCHEMA,
  ARC4_RECOVERY_SERVICE_SCHEMA,
  ARC4_RECOVERY_SERVICE_TURN_MAX_MS,
  ARC4_RECOVERY_STAGE_ORDER,
  ARC4_RECOVERY_TOTAL_CLOCK_PARITY_MAX_MS,
  ARC4_RECOVERY_UI_TRANSITION_LATENCY_MAX_MS,
  assessArc4RecoveryInstrumentSeal,
  assessOrdinarySliceRecoverySeal,
  evaluateArc4RecoveryObservation,
  projectArc4RecoveryObservationAuthority,
  terminalArc4RecoveryReportErrors,
} from './arc4-recovery-contract.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const v2Root = path.resolve(here, '..');
const repoRoot = path.resolve(v2Root, '..', '..');
const appDir = path.join(v2Root, 'apps', 'game');
const distDir = path.join(appDir, 'dist');
const outputRoot = path.join(appDir, 'smoke');
const reportPath = path.join(outputRoot, 'arc4-recovery-report.json');
const baselineSavePath = path.join(
  v2Root, '..', 'baseline-v1.8.9', 'save-fixtures.json',
);
const collectorPath = fileURLToPath(import.meta.url);
const ordinarySlicePath = path.join(here, 'slicesmoke.mjs');
const contractPath = path.join(here, 'arc4-recovery-contract.mjs');
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
function productAssert(condition, message, evidence = null) {
  if (!condition) throw new ProductFailure(message, evidence);
}
class ProductFailure extends Error {
  constructor(message, evidence = null) {
    super(message); this.name = 'ProductFailure'; this.evidence = evidence;
  }
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

function inputIdentity(buildSha256 = null) {
  return Object.freeze({
    collector: hashFile(collectorPath),
    recoveryContract: hashFile(contractPath),
    arc4Contract: hashFile(path.join(here, 'arc4-browser-contract.mjs')),
    ordinarySlice: hashFile(ordinarySlicePath),
    browserCdp: hashFile(browserCdpPath),
    browserPath: hashFile(browserPathPath),
    workspaceLock: hashFile(workspaceLockPath),
    baselineSaveFixtures: hashFile(baselineSavePath),
    package: hashFile(packagePath), packageLock: hashFile(packageLockPath),
    appPackage: hashFile(appPackagePath), gameMain: hashFile(gameMainPath),
    buildDist: buildSha256,
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

function arc4ExhaustedUiRows(rows) {
  return Array.isArray(rows) && rows.length === 3
    && new Set(rows.map((row) => row?.verb)).size === 3
    && rows.every((row) => ['tame', 'scavenge', 'sample'].includes(row?.verb))
    && rows.some((row) => row?.status === 'depleted')
    && rows.every((row) => ['empty', 'depleted'].includes(row?.status)
      && row?.button?.modelEnabled === 'false' && row?.button?.disabled === true
      && row?.button?.ariaDisabled === 'true');
}

async function waitForPertarSurface(send, sessionId, { exhausted = false } = {}) {
  const label = exhausted ? 'exhausted Pertar surface' : 'ready Pertar surface';
  let lastDiagnostic = null;
  try {
    return await waitForValue(async () => {
      const observed = await evaluate(send, sessionId,
        `(()=>{const S=window.__CF_SLICE__,state=S?.api?.state?.(),ui=${ARC4_CAPTURE_UI_EXPRESSION};
          const route=state?.mode==='surface'&&state?.gal===${ARC4_PERTAR_FIXTURE.galaxy.seed}
            &&state?.star===${ARC4_PERTAR_FIXTURE.publicStar.seed}
            &&state?.planet===${ARC4_PERTAR_FIXTURE.planet.seed}
            &&state?.planetOrdinal===${ARC4_PERTAR_FIXTURE.planet.ordinal}
            &&state?.navWorldKey===${JSON.stringify(ARC4_PERTAR_FIXTURE.worldKey)};
          const budget=ui?.budget,rows=ui?.rows??[],presentation=${exhausted
            ? `budget?.used===${ARC4_PERTAR_FIXTURE.biosphereYield}&&budget?.remaining===0
              &&(${arc4ExhaustedUiRows.toString()})(rows)`
            : `budget?.used===0&&budget?.remaining===${ARC4_PERTAR_FIXTURE.biosphereYield}
              &&rows.length===3&&rows.every((row)=>row.status==='ready'&&row.button?.disabled===false)`};
          const matched=route&&ui?.cardOpen===true&&ui?.cardTitle==='Pertar'&&presentation;
          const diagnostic={route,cardOpen:ui?.cardOpen??null,cardTitle:ui?.cardTitle??null,
            budget:budget?{yield:budget.yield,used:budget.used,remaining:budget.remaining,
              cycle:budget.cycle}:null,
            rows:rows.map((row)=>({verb:row?.verb??null,status:row?.status??null,
              modelEnabled:row?.button?.modelEnabled??null,disabled:row?.button?.disabled??null,
              ariaDisabled:row?.button?.ariaDisabled??null}))};
          return {matched,state:matched?state:null,ui:matched?ui:null,diagnostic}})()`,
      'read Pertar capture surface');
      lastDiagnostic = observed?.diagnostic ?? null;
      return observed?.matched === true ? { state: observed.state, ui: observed.ui } : null;
    }, label);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`${detail}; observed=${JSON.stringify(lastDiagnostic)}`);
  }
}

async function activateSurveyDock(send, sessionId) {
  const target = await evaluate(send, sessionId, `(()=>{const button=document.getElementById('docksurvey');
    button?.scrollIntoView({block:'center',inline:'center'});button?.focus();const r=button?.getBoundingClientRect(),
    x=r?(r.left+r.right)/2:NaN,y=r?(r.top+r.bottom)/2:NaN,hit=r?document.elementFromPoint(x,y):null;
    return {ok:button?.tagName==='BUTTON'&&!!r&&r.width>=44&&r.height>=44&&!!hit&&(hit===button||button.contains(hit)),x,y}})()`,
  'locate Survey dock');
  productAssert(target?.ok === true, 'reopened Survey dock is not a 44px owned target', target);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: target.x, y: target.y });
  await send('Input.dispatchMouseEvent', {
    type: 'mousePressed', x: target.x, y: target.y, button: 'left', clickCount: 1,
  });
  await send('Input.dispatchMouseEvent', {
    type: 'mouseReleased', x: target.x, y: target.y, button: 'left', clickCount: 1,
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

async function collectSuppression(send, sessionId, exhaustedRaw, exhaustedState) {
  await evaluate(send, sessionId, `(()=>{window.__cfArc4RecoverySuppressionAbort?.abort();
    const controller=new AbortController();window.__cfArc4RecoverySuppressionAbort=controller;
    const trace={pointer:[],clicks:[]},row=(event)=>{const target=event.target instanceof Element
      ?event.target.closest('button[data-capture-action="tame"]'):null;
      return target?{trusted:event.isTrusted===true,pointerType:event.pointerType||null}:null};
    document.addEventListener('pointerdown',(event)=>{const value=row(event);if(value)trace.pointer.push(value)},
      {capture:true,signal:controller.signal});
    document.addEventListener('click',(event)=>{const value=row(event);if(value)trace.clicks.push(value)},
      {capture:true,signal:controller.signal});window.__cfArc4RecoverySuppressionTrace=trace;return true})()`,
  'arm disabled suppression trace');
  const target = await evaluate(send, sessionId, `(()=>{const button=document.querySelector(
    '#survey button[data-capture-action="tame"]'),r=button?.getBoundingClientRect(),
    x=r?(r.left+r.right)/2:NaN,y=r?(r.top+r.bottom)/2:NaN,hit=r?document.elementFromPoint(x,y):null;
    return {ok:button?.tagName==='BUTTON'&&!!r&&r.width>=44&&r.height>=44
      &&!!hit&&(hit===button||button.contains(hit)),x,y,width:r?.width??0,height:r?.height??0,
      disabled:button?.disabled??null,modelEnabled:button?.getAttribute('data-model-enabled')??null}})()`,
  'locate disabled Tame control');
  productAssert(target?.ok === true && target.disabled === true
    && target.modelEnabled === 'false', 'exhausted Tame control is not truly disabled', target);
  const beforeRaw = await evaluate(send, sessionId, ARC4_DURABLE_READ_EXPRESSION,
    'read suppression before authority');
  const beforeState = await evaluate(send, sessionId, 'window.__CF_SLICE__.api.state()',
    'read suppression before state');
  productAssert(same(beforeRaw, exhaustedRaw),
    'durable authority moved before disabled suppression', { exhaustedRaw, beforeRaw });
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: target.x, y: target.y });
  await send('Input.dispatchMouseEvent', {
    type: 'mousePressed', x: target.x, y: target.y, button: 'left', clickCount: 1,
  });
  await send('Input.dispatchMouseEvent', {
    type: 'mouseReleased', x: target.x, y: target.y, button: 'left', clickCount: 1,
  });
  await sleep(200);
  const afterRaw = await evaluate(send, sessionId, ARC4_DURABLE_READ_EXPRESSION,
    'read suppression after authority');
  const afterState = await evaluate(send, sessionId, 'window.__CF_SLICE__.api.state()',
    'read suppression after state');
  const trace = await evaluate(send, sessionId, `(()=>{const trace=window.__cfArc4RecoverySuppressionTrace??null;
    window.__cfArc4RecoverySuppressionAbort?.abort();delete window.__cfArc4RecoverySuppressionAbort;
    delete window.__cfArc4RecoverySuppressionTrace;return trace})()`, 'read suppression trace');
  return Object.freeze({
    verb: 'tame',
    point: {
      height: target.height, width: target.width,
      disabled: target.disabled, modelEnabled: target.modelEnabled,
    },
    pointer: trace?.pointer?.[0] ?? null,
    clickCount: trace?.clicks?.length ?? -1,
    beforeRaw, afterRaw, beforeState, afterState,
  });
}

function initialStages() {
  return ARC4_RECOVERY_STAGE_ORDER.map((id) => ({ id, status: 'not-run', evidence: null }));
}
function unavailableSource(reason) {
  const digest = sha256(String(reason));
  return Object.freeze({
    commit: null, branch: 'unavailable', state: 'unavailable',
    statusSha256: digest, workingTreeSha256: digest,
  });
}
function runningReport(id, startedAt) {
  const source = unavailableSource('source not captured');
  return {
    schema: ARC4_RECOVERY_REPORT_SCHEMA, status: 'running', runId: id,
    lifecycle: { schema: ARC4_RECOVERY_LIFECYCLE_SCHEMA, status: 'pending' },
    startedAt: startedAt.toISOString(), endedAt: null, durationMs: null,
    policy: POLICY, source: { begin: source, end: source }, inputs: {},
    build: null, browser: null, origin: null,
    stages: initialStages(), firstFailure: null,
    recoveryBundle: null, observationInput: null,
    domainAssessment: null, observationVerdict: null,
    ordinarySliceSeal: null, instrumentSeal: null,
    fatalEvents: [], findings: [],
    cleanup: { browser: false, server: false, browserContext: false, workspaceLock: false },
  };
}

async function runCertificate() {
  const id = runId();
  const startedAt = new Date();
  let report = runningReport(id, startedAt);
  atomicWriteJson(reportPath, report);
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
      cleanup: { ...cleanup },
    };
    atomicWriteJson(reportPath, report);
  };
  const markStage = (idValue, status, evidence = null) => {
    const index = ARC4_RECOVERY_STAGE_ORDER.indexOf(idValue);
    assert(index >= 0, `unknown Arc 4 recovery stage ${idValue}`);
    report.stages = report.stages.map((stage, stageIndex) => stageIndex === index
      ? { id: idValue, status, evidence } : stage);
    if (status === 'fail' && report.firstFailure === null) {
      report.firstFailure = { stage: idValue, message: String(evidence?.message || evidence) };
    }
    persistRunning();
  };
  const passStage = (idValue, evidence = null) => markStage(idValue, 'pass', evidence);
  try {
    releaseLock = acquireWorkspaceLock('v2 Arc 4 real-time recovery certificate');
    sourceBegin = sourceIdentity(); sourceEnd = sourceBegin;
    ordinarySliceSeal = assessOrdinarySliceRecoverySeal(
      fs.readFileSync(ordinarySlicePath, 'utf8'),
    );
    instrumentSeal = assessArc4RecoveryInstrumentSeal(
      fs.readFileSync(collectorPath, 'utf8'), PAGE_EVIDENCE_SOURCES,
    );
    report = {
      ...report, source: { begin: sourceBegin, end: sourceBegin },
      inputs: inputIdentity(), ordinarySliceSeal, instrumentSeal,
    };
    persistRunning();
    assert(sourceBegin.state === 'committed',
      'Arc 4 recovery certification requires committed clean source');
    assert(ordinarySliceSeal.ok, 'ordinary Slice recovery non-claim seal is red');
    assert(instrumentSeal.ok, 'Arc 4 recovery no-forged-time instrument seal is red');
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    execFileSync(npm, ['run', 'build'], { cwd: appDir, stdio: 'inherit' });
    build = distIdentity();
    report = { ...report, build, inputs: inputIdentity(build.sha256) };
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
    const surface = await waitForPertarSurface(send, sessionId);
    const preRaw = await evaluate(send, sessionId, ARC4_DURABLE_READ_EXPRESSION,
      'read Pertar precondition authority');
    const precondition = assessArc4CapturePrecondition({
      raw: preRaw, state: surface.state, ui: surface.ui,
      routeError: null, authorityReady: true,
    });
    productAssert(precondition.ok, 'Pertar recovery precondition is red', precondition);
    passStage('fixture', {
      documentToken: fixtureToken, seedWitness, precondition,
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
    const exhaustedSurface = await waitForPertarSurface(send, sessionId, { exhausted: true });
    const exhaustedRaw = await evaluate(send, sessionId, ARC4_DURABLE_READ_EXPRESSION,
      'read exhausted authority');
    const exhaustedState = await evaluate(send, sessionId,
      'window.__CF_SLICE__.api.state()', 'read exhausted state');
    const exhaustedUi = await evaluate(send, sessionId, ARC4_CAPTURE_UI_EXPRESSION,
      'read exhausted UI');
    const suppressed = await collectSuppression(
      send, sessionId, exhaustedRaw, exhaustedState,
    );
    const exhaustion = assessArc4Exhaustion({
      exhaustedRaw, exhaustedState, exhaustedUi, suppressed,
    });
    productAssert(exhaustion.ok, 'Arc 4 exhaustion presentation is red', exhaustion);
    passStage('exhausted', { assessment: exhaustion, suppressed });

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
          })).sort((left, right) => left.targetId.localeCompare(right.targetId)),
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
    await waitForPertarSurface(send, sessionId, { exhausted: true });
    const offlineRaw = await evaluate(send, sessionId, ARC4_DURABLE_READ_EXPRESSION,
      'read offline-reopened authority');
    const offlineState = await evaluate(send, sessionId,
      'window.__CF_SLICE__.api.state()', 'read offline-reopened state');
    const offlineUi = await evaluate(send, sessionId, ARC4_CAPTURE_UI_EXPRESSION,
      'read offline-reopened UI');
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
    const evidence = error instanceof ProductFailure ? error.evidence : null;
    findings.push(error.message);
    if (evidence !== null) findings.push(`evidence: ${JSON.stringify(evidence)}`);
    if (report.stages.find((stage) => stage.id === currentStage)?.status === 'not-run') {
      markStage(currentStage, 'fail', { message: error.message, evidence });
    }
    provisionalStatus = error instanceof ProductFailure ? 'fail' : 'instrument-fail';
    provisionalExitCode = error instanceof ProductFailure ? 1 : 2;
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
    lifecycle: {
      schema: ARC4_RECOVERY_LIFECYCLE_SCHEMA,
      status: cleanupFailures.length ? 'failed' : 'complete',
    },
    endedAt: endedAt.toISOString(),
    durationMs: endedAt.getTime() - startedAt.getTime(),
    source: { begin: sourceBegin, end: sourceEnd }, build,
    recoveryBundle, observationInput, domainAssessment, observationVerdict,
    ordinarySliceSeal, instrumentSeal,
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
      const replayedOrdinarySeal = assessOrdinarySliceRecoverySeal(
        fs.readFileSync(ordinarySlicePath, 'utf8'),
      );
      const replayedInstrumentSeal = assessArc4RecoveryInstrumentSeal(
        fs.readFileSync(collectorPath, 'utf8'), PAGE_EVIDENCE_SOURCES,
      );
      const currentBuild = distIdentity();
      const currentInputs = inputIdentity(currentBuild.sha256);
      const verificationErrors = terminalArc4RecoveryReportErrors(terminal, {
        expectedRunId: id, currentSource: sourceIdentity(),
        replayedDomainAssessment, replayedObservationVerdict,
        replayedAuthorityBinding, currentBuild, currentInputs,
        ordinarySliceSeal: replayedOrdinarySeal,
        instrumentSeal: replayedInstrumentSeal,
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
  atomicWriteJson(reportPath, terminal);
  if (terminal.status === 'pass') {
    console.log(`ARC 4 RECOVERY: PASS — ${id}`);
    console.log(`  real active observation: ${terminal.observationVerdict.metrics.browserElapsedMs}ms`);
    console.log(`  report: ${reportPath}`);
  } else {
    console.error(`ARC 4 RECOVERY: ${terminal.status.toUpperCase()} — ${id}`);
    console.error(`  first failure: ${JSON.stringify(terminal.firstFailure)}`);
    for (const finding of terminal.findings) console.error(`  ${finding}`);
    console.error(`  report: ${reportPath}`);
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
function syntheticRuntime(activePlayMs, revision) {
  return {
    visible: true, answerable: true, leaseOwned: true, accruing: true,
    activePlayMs, revision, sessionSeed: 68, sessionOrdinal: 16,
    sessionDraws: { 'capture.candidate': 16, 'capture.success': 16 },
  };
}
function syntheticCaptureFacts(recovered = false) {
  return {
    budget: {
      yield: ARC4_PERTAR_FIXTURE.biosphereYield,
      used: recovered ? 0 : ARC4_PERTAR_FIXTURE.biosphereYield,
      remaining: recovered ? ARC4_PERTAR_FIXTURE.biosphereYield : 0,
      cycle: recovered ? 1 : 0,
    },
    rows: ['tame', 'scavenge', 'sample'].map((verb) => ({
      verb, status: recovered ? 'ready' : verb === 'tame' ? 'empty' : 'depleted',
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
  const state = (documentToken, activePlayMs) => ({
    persistence: {
      documentToken, runtime: syntheticRuntime(activePlayMs, 56),
    },
  });
  const ui = (recovered, activePlayMs) => {
    const facts = syntheticCaptureFacts(recovered);
    return {
      budget: facts.budget,
      rows: facts.rows.map(({ verb, status, ...button }) => ({
        verb, status, button,
      })),
      persistence: { runtime: syntheticRuntime(activePlayMs, 56) },
    };
  };
  const raw = (activePlayMs) => ({
    authority: { activePlayMs, sessionRng: structuredClone(rng) },
  });
  const recoveryBundle = {
    exhaustedRaw: raw(10_000),
    exhaustedState: state(closedToken, 10_000),
    exhaustedUi: ui(false, 10_000),
    closedRaw: raw(10_020),
    closedState: state(closedToken, 10_020),
    closure: {
      closedDocumentToken: closedToken, reopenedDocumentToken: token,
    },
    offlineRaw: raw(10_020),
    offlineState: state(token, startActive),
    offlineUi: ui(false, startActive),
    recoveredRaw: raw(lastActive),
    recoveredState: state(token, lastActive),
    recoveredUi: ui(true, lastActive),
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
  const { input, recoveryBundle } = syntheticRecoveryFixture();
  const mixedExhaustedFacts = input.authorityBinding.exhaustedCaptureFacts;
  assert(same(mixedExhaustedFacts.rows.map(({ verb, status }) => ({ verb, status })), [
    { verb: 'tame', status: 'empty' },
    { verb: 'scavenge', status: 'depleted' },
    { verb: 'sample', status: 'depleted' },
  ]), 'synthetic recovery baseline does not reproduce the real mixed exhausted surface');
  const mixedExhaustedUiRows = mixedExhaustedFacts.rows.map(({
    verb, status, modelEnabled, disabled, ariaDisabled,
  }) => ({ verb, status, button: { modelEnabled, disabled, ariaDisabled } }));
  assert(arc4ExhaustedUiRows(mixedExhaustedUiRows),
    'real mixed empty/depleted exhausted surface was rejected by the browser poll');
  const noDepletedUiRows = structuredClone(mixedExhaustedUiRows);
  for (const row of noDepletedUiRows) row.status = 'empty';
  assert(!arc4ExhaustedUiRows(noDepletedUiRows),
    'all-empty exhausted surface mutation stayed green');
  const earlyReadyUiRows = structuredClone(mixedExhaustedUiRows);
  Object.assign(earlyReadyUiRows[2], {
    status: 'ready',
    button: { modelEnabled: 'true', disabled: false, ariaDisabled: 'false' },
  });
  assert(!arc4ExhaustedUiRows(earlyReadyUiRows),
    'partially ready exhausted surface mutation stayed green');
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
  const collectorSource = fs.readFileSync(collectorPath, 'utf8');
  const instrumentSeal = assessArc4RecoveryInstrumentSeal(
    collectorSource, PAGE_EVIDENCE_SOURCES,
  );
  assert(instrumentSeal.ok,
    `recovery instrument seal is red: ${JSON.stringify(instrumentSeal)}`);
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
  const domainAssessment = { ok: true, checks: { synthetic: true }, reasons: [] };
  const replayedAuthorityBinding = projectArc4RecoveryObservationAuthority(
    recoveryBundle,
  );
  const stages = ARC4_RECOVERY_STAGE_ORDER.map((idValue) => ({
    id: idValue, status: 'pass', evidence: null,
  }));
  const terminal = {
    schema: ARC4_RECOVERY_REPORT_SCHEMA, status: 'pass', runId: 'selftest-run',
    lifecycle: { schema: ARC4_RECOVERY_LIFECYCLE_SCHEMA, status: 'complete' },
    policy: POLICY, cleanup: {
      browser: true, server: true, browserContext: true, workspaceLock: true,
    },
    source: { begin: source, end: source }, build: currentBuild,
    inputs: currentInputs, browser: input.browser,
    recoveryBundle, observationInput: input, domainAssessment,
    observationVerdict: baseline, ordinarySliceSeal: ordinarySeal,
    instrumentSeal, stages, firstFailure: null, fatalEvents: [], findings: [],
  };
  const terminalReplay = {
    expectedRunId: 'selftest-run', currentSource: source,
    replayedDomainAssessment: domainAssessment,
    replayedObservationVerdict: baseline, replayedAuthorityBinding,
    currentBuild, currentInputs, ordinarySliceSeal: ordinarySeal, instrumentSeal,
  };
  const reportErrors = terminalArc4RecoveryReportErrors(
    terminal, terminalReplay,
  );
  assert(same(reportErrors, []),
    `terminal recovery report baseline is red: ${reportErrors.join(', ')}`);
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

  const temporaryRoot = fs.mkdtempSync(path.join(
    fs.realpathSync(process.env.TMPDIR || '/tmp'), `cf-arc4-recovery-selftest-${process.pid}-`,
  ));
  try {
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
  console.log('ARC 4 RECOVERY SELFTEST: PASS — fixed real 20-minute duration, target service, focus/visibility, boundary, stale PASS, zero retry, and no-forged-time controls are mutation-sensitive');
}

function parseArgs(argv) {
  if (argv.length === 0) return Object.freeze({ selftest: false });
  if (argv.length === 1 && argv[0] === '--selftest') {
    return Object.freeze({ selftest: true });
  }
  fail('usage: node tools/arc4recovery.mjs [--selftest]');
}

if (process.argv[1] && path.resolve(process.argv[1]) === collectorPath) {
  let options;
  try { options = parseArgs(process.argv.slice(2)); }
  catch (error) { console.error(error.message); process.exitCode = 2; }
  if (options) {
    if (options.selftest) {
      try { runSelftest(); }
      catch (error) { console.error(`ARC 4 RECOVERY SELFTEST: FAIL — ${error.message}`); process.exitCode = 1; }
    } else {
      const exitCode = await runCertificate();
      process.exitCode = exitCode;
    }
  }
}
