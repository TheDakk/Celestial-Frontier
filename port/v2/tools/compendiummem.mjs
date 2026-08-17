/* Arc 1A Compendium memory/resource gate.

   One workspace lock, one Chromium launch, zero automatic retries. The gate
   owns a deterministic 1,500-row fixture, drives native DOM/keyboard/scroll
   outcomes over raw CDP, samples product diagnostics plus browser heap/DOM
   counters, and replaces any prior report with a current RUNNING record
   before the build/browser attempt. Numeric certification remains disabled
   until the v2-owned budget contains measured phone/desktop ceilings.

   Usage:
     node tools/compendiummem.mjs
     node tools/compendiummem.mjs --calibrate
     node tools/compendiummem.mjs --calibrate-baseline=/absolute/clean/3844701-worktree
     node tools/compendiummem.mjs --verify-run=<run-id>
     node tools/compendiummem.mjs --selftest
*/
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { openChromiumCdp } from './browsercdp.mjs';
import {
  BASELINE_OBSERVATION_TIMEOUT_MS, BROKEN_BASELINE_PORTRAIT_CACHE_CAPS,
  BROKEN_BASELINE_THUMB_CACHE_CAP, BROKEN_BASELINE_THUMB_OBSERVER_SCHEMA,
  CANDIDATE_BROWSER_LABEL, CANDIDATE_COMMAND_SCHEMA, CANDIDATE_TRANSPORT_TIMEOUT_MS,
  COMMAND_TIMEOUT_MS, EXPECTED_OUTCOMES,
  FILTER_TRANSITION_SCHEMA, PARTIAL_FAILURE_SCHEMA, PARTIAL_PROFILE_SCHEMA,
  PRODUCER_ERROR_ARM_MESSAGE, PRODUCER_ERROR_ARM_SENTINEL,
  PRODUCER_ERROR_WITNESS_SCHEMA,
  RAW_CDP_COMMAND_SCHEMA,
  REPORT_INPUT_KEYS, REPORT_SCHEMA, REQUIRED_WARM_CYCLES,
  brokenBaselineCacheMetrics, brokenBaselineFailureEvidence, brokenBaselineFaults,
  calibrationMetrics, candidateNativeKeyDispatches,
  compendiumCdpOptions, compendiumProfileEmulationOptions,
  compendiumRawSnapshotExpression,
  evaluateCandidateExpression, evaluateProfile, installBrokenBaselineThumbObserver,
  producerErrorColdProof, producerErrorStages,
  sha256, sameSourceIdentity,
  isCandidateObservationError, waitForCandidateValue,
  phaseObservationAccepted, remainingCommandTimeoutMs, validateBudgetRecord, verifyTerminalReport,
  validBrokenBaselineThumbObservation, validCompendiumRawSnapshotExpression,
  validFilterInputObservation, validFilterTargetObservation, validFilterTelemetrySnapshot,
  validFilterTransitionObservation,
  validProducerErrorPreArmObservation, validProducerErrorWorkObservation,
} from './compendiummem-contract.mjs';
import {
  COMPENDIUM_FIXTURE_SPEC_PATH, buildBrokenBaselineProjection,
  buildCompendiumFixture, stableJson,
} from './compendiummem-fixture.mjs';
import { acquireWorkspaceLock } from './workspacelock.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const v2Root = path.resolve(here, '..');
const repoRoot = path.resolve(v2Root, '..', '..');
const appDir = path.join(v2Root, 'apps', 'game');
const distDir = path.join(appDir, 'dist');
const outputDir = path.join(appDir, 'smoke');
const reportPath = path.join(outputDir, 'compendiummem-report.json');
const baselineReportPath = path.join(outputDir, 'compendiummem-baseline-report.json');
const budgetPath = path.join(v2Root, 'budgets', 'compendium-memory-v1.json');
const budgetSchemaPath = path.join(v2Root, 'budgets', 'compendium-memory-v1.schema.json');
const baselineSavePath = path.join(v2Root, '..', 'baseline-v1.8.9', 'save-fixtures.json');
const packagePath = path.join(v2Root, 'package.json');
const lockPath = path.join(v2Root, 'package-lock.json');
const appPackagePath = path.join(appDir, 'package.json');
const contractPath = fileURLToPath(new URL('./compendiummem-contract.mjs', import.meta.url));
const fixtureToolPath = fileURLToPath(new URL('./compendiummem-fixture.mjs', import.meta.url));
const collectorPath = fileURLToPath(import.meta.url);
const SELFTEST_FLAG = '--selftest';
const BROKEN_BASELINE_COMMIT = '38447019517147319bd08c598202d097ee866874';
const STORES = Object.freeze([
  'meta', 'player', 'creatures', 'catalog', 'inventory', 'settings', 'journal', 'assetcache',
]);
const PROFILES = Object.freeze({
  phone: Object.freeze({ width: 390, height: 844, dpr: 3, mobile: true }),
  desktop: Object.freeze({ width: 1280, height: 800, dpr: 1, mobile: false }),
});

function assert(condition, message) { if (!condition) throw new Error(message); }
function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function hashFile(file) { return sha256(fs.readFileSync(file)); }
function atomicWriteJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${crypto.randomBytes(5).toString('hex')}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2) + '\n');
  fs.renameSync(temporary, file);
}
function git(cwd, args, { raw = false } = {}) {
  try {
    return execFileSync('git', args, {
      cwd, encoding: raw ? null : 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (error) {
    const detail = Buffer.isBuffer(error?.stderr)
      ? error.stderr.toString('utf8').trim() : String(error?.stderr || '').trim();
    throw new Error(`required git ${args.join(' ')} failed${detail ? `: ${detail}` : ''}`);
  }
}
function sourceSnapshot(root) {
  const status = git(root, ['status', '--porcelain=v1', '-z', '--untracked-files=all'], { raw: true });
  const diff = git(root, ['diff', '--binary', '--no-ext-diff', 'HEAD', '--'], { raw: true });
  const untrackedRaw = git(root, ['ls-files', '--others', '--exclude-standard', '-z'], { raw: true });
  const untracked = untrackedRaw.toString('utf8').split('\0').filter(Boolean).sort();
  const digest = crypto.createHash('sha256');
  digest.update('tracked-diff\0').update(diff).update('\0untracked\0');
  const prefix = root.endsWith(path.sep) ? root : root + path.sep;
  for (const relative of untracked) {
    const absolute = path.resolve(root, relative);
    assert(absolute.startsWith(prefix), `unsafe untracked source path: ${relative}`);
    const stat = fs.lstatSync(absolute);
    digest.update(relative).update('\0');
    if (stat.isFile()) digest.update('file\0').update(fs.readFileSync(absolute));
    else if (stat.isSymbolicLink()) digest.update('symlink\0').update(fs.readlinkSync(absolute));
    else throw new Error(`untracked source is not a file or symlink: ${relative}`);
    digest.update('\0');
  }
  return {
    dirty: status.length > 0,
    statusSha256: sha256(status),
    workingTreeSha256: digest.digest('hex'),
  };
}
function sourceIdentity(root = repoRoot, { checkCiEnvironment = root === repoRoot } = {}) {
  const resolvedRoot = fs.realpathSync(root);
  const top = String(git(resolvedRoot, ['rev-parse', '--show-toplevel'])).trim();
  assert(fs.realpathSync(top) === resolvedRoot, `git root mismatch: expected ${resolvedRoot}, got ${top}`);
  const snapshot = sourceSnapshot(resolvedRoot);
  const commit = String(git(resolvedRoot, ['rev-parse', 'HEAD'])).trim();
  assert(/^[a-f0-9]{40}$/.test(commit), `git HEAD is not one full 40-hex commit: ${commit || '<empty>'}`);
  if (checkCiEnvironment && process.env.GITHUB_SHA !== undefined) {
    assert(process.env.GITHUB_SHA === commit,
      `GITHUB_SHA ${process.env.GITHUB_SHA} does not match checked-out HEAD ${commit}`);
  }
  const branchName = String(git(resolvedRoot, ['rev-parse', '--abbrev-ref', 'HEAD'])).trim();
  const branch = branchName === 'HEAD' ? 'detached' : branchName;
  assert(branch.length > 0, 'git branch identity is empty');
  return {
    commit, branch, state: snapshot.dirty ? 'dirty-diagnostic' : 'committed',
    statusSha256: snapshot.statusSha256, workingTreeSha256: snapshot.workingTreeSha256,
  };
}
function unavailableSourceIdentity(reason) {
  const digest = sha256(String(reason || 'git source unavailable'));
  return {
    commit: null, branch: 'unavailable', state: 'unavailable',
    statusSha256: digest, workingTreeSha256: digest,
  };
}
function calibrationPathFor(runId, kind = 'candidate') {
  return path.join(outputDir, `compendiummem-${kind}-sample-${runId}.json`);
}
function unavailableInputs(reason) {
  return Object.fromEntries(REPORT_INPUT_KEYS.map((key) =>
    [key, sha256(`${key}\0${String(reason || 'input unavailable')}`)]));
}
function verifyReviewArtifact(item) {
  try {
    const rootPrefix = v2Root.endsWith(path.sep) ? v2Root : v2Root + path.sep;
    const absolute = path.resolve(v2Root, item.file);
    if (!absolute.startsWith(rootPrefix)) return false;
    const stat = fs.lstatSync(absolute);
    if (!stat.isFile() || stat.isSymbolicLink()) return false;
    const bytes = fs.readFileSync(absolute);
    return bytes.length === item.bytes && sha256(bytes) === item.sha256
      && bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'));
  } catch { return false; }
}
function exactInputs(fixture) {
  const inputs = {
    fixtureSpec: hashFile(COMPENDIUM_FIXTURE_SPEC_PATH),
    fixtureRows: fixture.rowsSha256,
    fixtureGenerator: hashFile(fixtureToolPath),
    budget: hashFile(budgetPath),
    budgetSchema: hashFile(budgetSchemaPath),
    outcomeContract: hashFile(contractPath),
    collector: hashFile(collectorPath),
    package: hashFile(packagePath),
    packageLock: hashFile(lockPath),
    appPackage: hashFile(appPackagePath),
    baselineSaveFixtures: hashFile(baselineSavePath),
    outcomeInventory: sha256(stableJson(EXPECTED_OUTCOMES)),
  };
  return Object.freeze(inputs);
}
function reportRunId() {
  const explicit = process.env.CF_COMPENDIUMMEM_RUN_ID;
  if (explicit !== undefined) {
    assert(/^[a-z0-9][a-z0-9-]{0,95}$/i.test(explicit), 'CF_COMPENDIUMMEM_RUN_ID is invalid');
    return explicit;
  }
  return `${new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 17)}-${process.pid}-${crypto.randomBytes(5).toString('hex')}`;
}
function makeRunningReport({ runId, startedAt, source, inputs, budget }) {
  return {
    schema: REPORT_SCHEMA, status: 'running', runId,
    startedAt: startedAt.toISOString(), endedAt: null, durationMs: null,
    policy: {
      attemptCount: 1, automaticRetries: 0, commandTimeoutMs: COMMAND_TIMEOUT_MS,
      targetTimeoutMs: COMMAND_TIMEOUT_MS, heartbeatTimeoutMs: COMMAND_TIMEOUT_MS,
      transportTimeoutMs: CANDIDATE_TRANSPORT_TIMEOUT_MS,
    },
    source: { begin: source, end: source }, inputs,
    browser: null,
    budget: { status: budget.status, path: 'budgets/compendium-memory-v1.json', sha256: inputs.budget },
    expectedOutcomes: [...EXPECTED_OUTCOMES], outcomes: [], findings: [], profiles: {},
    reviewPacket: [], partialFailure: null, blockedOutcomes: [],
  };
}
function calibrationCeilings() {
  const ceiling = {
    rationale: 'Calibration-only unbounded evaluator; never a certifying budget.',
    mountedRowsMax: Number.MAX_SAFE_INTEGER, heapUsedBytesMax: Number.MAX_SAFE_INTEGER,
    documentsMax: Number.MAX_SAFE_INTEGER, nodesMax: Number.MAX_SAFE_INTEGER,
    jsEventListenersMax: Number.MAX_SAFE_INTEGER, liveCacheEntriesMax: Number.MAX_SAFE_INTEGER,
    liveDecodedPixelsMax: Number.MAX_SAFE_INTEGER, liveDecodedBytesMax: Number.MAX_SAFE_INTEGER,
    liveEncodedBytesMax: Number.MAX_SAFE_INTEGER, queuedJobsPeakMax: Number.MAX_SAFE_INTEGER,
    activeJobsPeakMax: Number.MAX_SAFE_INTEGER, liveLeasesMax: Number.MAX_SAFE_INTEGER,
    liveSubscribersMax: Number.MAX_SAFE_INTEGER,
    livePortraitCacheEntriesMax: Number.MAX_SAFE_INTEGER,
    livePortraitEncodedBytesMax: Number.MAX_SAFE_INTEGER,
    warmHeapRangeBytesMax: Number.MAX_SAFE_INTEGER,
    warmDecodedBytesRangeMax: Number.MAX_SAFE_INTEGER,
    warmEncodedBytesRangeMax: Number.MAX_SAFE_INTEGER,
  };
  return { status: 'active', ceilings: { phone: { ...ceiling }, desktop: { ...ceiling } } };
}
function sampleBrowser(browser) {
  return {
    executable: browser.executable, product: browser.product, revision: browser.revision,
    userAgent: browser.user_agent, jsVersion: browser.js_version,
    protocolVersion: browser.protocol_version,
  };
}

function serveDist(servedDist = distDir) {
  const root = fs.realpathSync(servedDist);
  const rootPrefix = root.endsWith(path.sep) ? root : root + path.sep;
  const mime = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
    '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
  };
  const server = http.createServer((request, response) => {
    const url = new URL(request.url || '/', 'http://127.0.0.1');
    if (url.pathname === '/__compendiummem_seed__.html') {
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      response.end('<!doctype html><meta charset="utf-8"><title>Compendium evidence seed</title>');
      return;
    }
    let pathname;
    try { pathname = decodeURIComponent(url.pathname); }
    catch { response.writeHead(400); response.end(); return; }
    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const file = path.resolve(root, relative);
    if (file !== root && !file.startsWith(rootPrefix)) { response.writeHead(403); response.end(); return; }
    try {
      const stat = fs.lstatSync(file);
      if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('not a regular file');
      response.writeHead(200, {
        'content-type': mime[path.extname(file)] || 'application/octet-stream',
        'cache-control': 'no-store',
      });
      response.end(fs.readFileSync(file));
    } catch { response.writeHead(404); response.end(); }
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      assert(address && typeof address === 'object', 'static server did not publish a TCP address');
      resolve({
        server, origin: `http://127.0.0.1:${address.port}`,
        close: () => new Promise((done) => server.close(() => done())),
      });
    });
  });
}

/* Single owner of candidate Runtime.evaluate observation policy. The real
   collector and the browser-free controls both consume these exact wrappers. */
export function createCandidateCollectorObservations({
  send, profile, now, pause, onStageStarted, onStageCompleted, onCommand,
}) {
  assert(typeof send === 'function' && typeof now === 'function'
    && typeof pause === 'function' && typeof onStageStarted === 'function'
    && typeof onStageCompleted === 'function' && typeof onCommand === 'function',
  'candidate collector observation dependencies are invalid');
  const evaluate = async (
    sessionId, expression, label, { awaitPromise = true, timeoutMs } = {},
  ) => {
    onStageStarted(label);
    const effectiveTimeoutMs = timeoutMs ?? CANDIDATE_TRANSPORT_TIMEOUT_MS;
    try {
      const value = await evaluateCandidateExpression({
        send, sessionId, expression, profile, label, awaitPromise,
        timeoutMs: effectiveTimeoutMs, now,
      });
      onStageCompleted(label);
      return value;
    } catch (error) {
      if (error?.compendiumCommand) onCommand(error.compendiumCommand);
      throw error;
    }
  };
  const runWait = async (
    sessionId, label, expression, {
      timeoutMs = 20000, acceptValue = Boolean, onObservation = () => {},
    } = {},
  ) => {
    const phaseDeadlineMs = now() + timeoutMs;
    onStageStarted(label);
    let terminalCommand = null;
    const value = await waitForCandidateValue({
      send, sessionId, expression, profile, label, phaseDeadlineMs,
      now, sleep: pause,
      onCommand: (command) => { terminalCommand = command; onCommand(command); },
      acceptValue, onObservation,
    });
    onStageCompleted(label);
    return Object.freeze({ value, command: terminalCommand });
  };
  const waitValue = async (...args) => (await runWait(...args)).value;
  const answerability = async (sessionId, expected) => {
    assert(typeof expected === 'string' && expected,
      'candidate answerability token is invalid');
    const label = `answerability ${expected}`;
    const expression = `new Promise(resolve=>requestAnimationFrame(()=>setTimeout(()=>resolve(${JSON.stringify(expected)}),0)))`;
    const { value, command } = await runWait(
      sessionId, label, expression, { timeoutMs: COMMAND_TIMEOUT_MS },
    );
    assert(command, `${profile} ${label}: answerability command evidence is missing`);
    return Object.freeze({
      target: Object.freeze({
        ok: value === expected, ms: command.target.durationMs, value, expected,
      }),
      heartbeat: Object.freeze({
        ok: command.heartbeat.status === 'fulfilled' && command.heartbeat.timely === true
          && typeof command.heartbeat.product === 'string' && !!command.heartbeat.product,
        ms: command.heartbeat.durationMs,
        product: command.heartbeat.product ?? null,
      }),
    });
  };
  const sendStage = async (
    label, method, params = {}, sessionId, options = {},
  ) => {
    assert(typeof label === 'string' && label && typeof method === 'string' && method,
      'candidate raw-CDP stage identity is invalid');
    onStageStarted(label);
    const timeoutMs = options.timeoutMs ?? CANDIDATE_TRANSPORT_TIMEOUT_MS;
    const issuedAtMs = now('issued');
    try {
      const result = await send(method, params, sessionId, options);
      onStageCompleted(label);
      return result;
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : String(cause);
      const completedAtMs = now(method);
      const command = Object.freeze({
        schema: RAW_CDP_COMMAND_SCHEMA, profile, label, method, timeoutMs,
        issuedAtMs, completedAtMs, durationMs: completedAtMs - issuedAtMs,
        status: 'rejected', error: detail,
      });
      onCommand(command);
      const error = new Error(
        `${profile} ${label}: ${method} failed under the ${timeoutMs}ms transport cap (${detail})`,
        { cause },
      );
      error.compendiumCommand = command;
      throw error;
    }
  };
  return Object.freeze({ evaluate, waitValue, answerability, sendStage });
}

/* One callback owns both the full partial-failure ledger and the sealed
   producer-phase subset. The browser-free controls exercise this exact
   factory, and collectProfile passes its return value straight to the shared
   candidate-observation owner. */
export function createCandidateCommandRecorder({
  commandLedger, producerErrorCandidateLabels, getProducerErrorWitness,
}) {
  assert(Array.isArray(commandLedger)
    && producerErrorCandidateLabels instanceof Set
    && typeof getProducerErrorWitness === 'function',
  'candidate command recorder dependencies are invalid');
  return (command) => {
    commandLedger.push(command);
    const witness = getProducerErrorWitness();
    if (witness !== null && command?.schema === CANDIDATE_COMMAND_SCHEMA
      && producerErrorCandidateLabels.has(command.label)) {
      assert(Array.isArray(witness.commands),
        'producer-error command carrier is missing');
      witness.commands.push(command);
    }
  };
}

/* The production evidence hook intentionally returns void. Keep that product
   API honest and make the collector expression itself return a by-value
   sentinel so Runtime.evaluate can distinguish a completed arm from a missing
   result. The factory is the single source consumed by both the real call site
   and the browser-free controls. */
export function candidateArmProducerErrorExpression() {
  return `(()=>{const evidence=window.__CF_SLICE__?.api?.__compendiumEvidence;
    if(!evidence||typeof evidence.failNextThumb!=='function')throw new Error('Compendium evidence failNextThumb hook unavailable');
    evidence.failNextThumb(${JSON.stringify(PRODUCER_ERROR_ARM_MESSAGE)});
    return ${JSON.stringify(PRODUCER_ERROR_ARM_SENTINEL)}})()`;
}

export function validCandidateArmProducerErrorExpression(source) {
  if (typeof source !== 'string' || source !== candidateArmProducerErrorExpression()) return false;
  try { new Function(`"use strict"; return (${source});`); }
  catch { return false; }
  return true;
}

export async function armCandidateProducerError({ sessionId, evaluate }) {
  assert(typeof sessionId === 'string' && sessionId && typeof evaluate === 'function',
    'candidate producer-error arm dependencies are invalid');
  const expression = candidateArmProducerErrorExpression();
  assert(validCandidateArmProducerErrorExpression(expression),
    'candidate producer-error arm expression is invalid');
  const result = await evaluate(sessionId, expression, 'arm producer error');
  assert(result === PRODUCER_ERROR_ARM_SENTINEL,
    `candidate producer-error arm sentinel mismatch: ${String(result)}`);
  return result;
}

function candidateProducerErrorArtProjection() {
  return `art:{cacheLimit:a.limits.cacheEntries,cachedKeyCount:a.keys.cached.length,live:{cacheEntries:a.live.cacheEntries,
      queuedJobs:a.live.queuedJobs,activeJobs:a.live.activeJobs,leases:a.live.leases,
      subscribers:a.live.subscribers},totals:{leaseAcquires:a.totals.leaseAcquires,
      releases:a.totals.releases,jobStarts:a.totals.jobStarts,
      jobCompletes:a.totals.jobCompletes,jobCancels:a.totals.jobCancels,
      jobErrors:a.totals.jobErrors,disposals:a.totals.disposals}}`;
}

export function candidateProducerErrorPreArmExpression() {
  return `(()=>{const d=window.__CF_SLICE__?.api?.compendiumDiagnostics?.(),a=d?.art;
    if(!d||!a)throw new Error('producer-error pre-arm diagnostics unavailable');
    const list=[...document.querySelectorAll('#codexpanel [data-sel="codex-entry"] img')];
    const ps=[...document.querySelectorAll('#planetside [data-sel="planetside-sp"] img')];
    const keys=ps.map(img=>img.dataset.visualKey||'').filter(Boolean);
    const cachedKeys=[...a.keys.cached].sort();
    const readyCount=ps.filter(img=>img.dataset.thumbState==='ready'&&img.naturalWidth===132&&img.naturalHeight===132).length;
    const observation={ready:false,panelMode:d.panel.mode,sourceCount:d.panel.sourceCount,
      listImageCount:list.length,planetsideVisible:d.surfaces.planetside.visible,
      planetsideImageCount:ps.length,planetsideReadyCount:readyCount,
      planetsideDistinctVisualKeys:new Set(keys).size,cachedKeys,
      ${candidateProducerErrorArtProjection()}};
    observation.ready=observation.panelMode==='closed'&&observation.sourceCount===1500
      &&observation.listImageCount===0&&observation.planetsideVisible
      &&observation.planetsideImageCount>0&&observation.planetsideImageCount<=8
      &&observation.planetsideReadyCount===observation.planetsideImageCount
      &&observation.planetsideDistinctVisualKeys===observation.planetsideImageCount
      &&observation.art.live.queuedJobs===0&&observation.art.live.activeJobs===0
      &&observation.art.live.leases===observation.planetsideImageCount
      &&observation.art.live.subscribers===0;
    return observation})()`;
}

export function candidateProducerErrorWorkExpression() {
  return `(()=>{const d=window.__CF_SLICE__?.api?.compendiumDiagnostics?.(),a=d?.art;
    if(!d||!a)throw new Error('producer-error work diagnostics unavailable');
    const cached=new Set(a.keys.cached);
    const rows=[...document.querySelectorAll('#codexpanel [data-sel="codex-entry"][data-cid]')]
      .map(row=>{const img=row.querySelector('img'),state=img?.dataset.thumbState||'placeholder';
        return {logicalId:row.dataset.cid||'',index:Number(row.dataset.ci),
          visualKey:img?.dataset.visualKey||null,thumbState:state,
          naturalWidth:img?.naturalWidth||0,naturalHeight:img?.naturalHeight||0,
          complete:img?.complete===true,
          cached:!!img?.dataset.visualKey&&cached.has(img.dataset.visualKey)}});
    const states={placeholder:0,ready:0,error:0,released:0,other:0};
    for(const row of rows){if(Object.hasOwn(states,row.thumbState))states[row.thumbState]++;else states.other++}
    const logicalIds=rows.map(row=>row.logicalId).filter(Boolean);
    const visualKeys=rows.map(row=>row.visualKey).filter(Boolean);
    const observation={ready:false,panelMode:d.panel.mode,sourceCount:d.panel.sourceCount,
      generation:d.generation,mountedRowCount:rows.length,
      mountedDistinctLogicalIds:new Set(logicalIds).size,
      mountedDistinctVisualKeys:new Set(visualKeys).size,stateCounts:states,rows,
      ${candidateProducerErrorArtProjection()}};
    observation.ready=observation.panelMode==='list'&&observation.sourceCount===1500
      &&rows.length>0&&observation.art.live.queuedJobs===0&&observation.art.live.activeJobs===0
      &&logicalIds.length===rows.length
      &&visualKeys.length===rows.length&&new Set(logicalIds).size===rows.length
      &&new Set(visualKeys).size===rows.length&&rows.every((row,index)=>row.index===index
        &&(row.thumbState!=='ready'||row.complete));
    return observation})()`;
}

export function validCandidateProducerErrorExpression(source, kind) {
  const expected = kind === 'pre-arm' ? candidateProducerErrorPreArmExpression()
    : kind === 'work' ? candidateProducerErrorWorkExpression() : null;
  if (expected === null || source !== expected) return false;
  try { new Function(`"use strict"; return (${source});`); }
  catch { return false; }
  return true;
}

export function candidateFilterInputExpression({ expectedPanelMode, expectedValue, phase }) {
  assert(['focus', 'selection', 'cleared', 'exact-input'].includes(phase),
    'candidate filter input phase is invalid');
  const valueClause = phase === 'focus' ? 'true'
    : `value===${JSON.stringify(expectedValue)}`;
  const selectionClause = phase === 'selection'
    ? 'selectionStart===0&&selectionEnd===value.length'
    : phase === 'cleared'
      ? 'selectionStart===0&&selectionEnd===0'
      : phase === 'exact-input'
        ? 'selectionStart===value.length&&selectionEnd===value.length'
        : 'true';
  return `(()=>{const e=document.querySelector('#searchbox'),p=document.querySelector('#codexpanel');
    const hidden=!p||p.getAttribute('aria-hidden')==='true'||p.style.display==='none';
    const panelMode=!p?'missing':hidden?'closed':p.querySelector('[data-sel="codex-scroll"]')?'list':
      p.querySelector('[data-sel="detail-portrait"]')?'detail':'open-unknown';
    const value=typeof e?.value==='string'?e.value:'';
    const selectionStart=Number.isSafeInteger(e?.selectionStart)?e.selectionStart:null;
    const selectionEnd=Number.isSafeInteger(e?.selectionEnd)?e.selectionEnd:null;
    const focused=!!e&&document.activeElement===e;
    return {ready:focused&&panelMode===${JSON.stringify(expectedPanelMode)}&&${valueClause}&&${selectionClause},
      focused,value,selectionStart,selectionEnd,panelMode}})()`;
}

export function validCandidateFilterInputExpression(
  source, { expectedPanelMode, expectedValue, phase },
) {
  if (typeof source !== 'string' || !['focus', 'selection', 'cleared', 'exact-input'].includes(phase)
    || !['list', 'closed'].includes(expectedPanelMode)
    || (phase !== 'focus' && typeof expectedValue !== 'string')
    || source.includes('compendiumDiagnostics')) return false;
  const common = [
    '#searchbox', '#codexpanel', 'aria-hidden', '[data-sel="codex-scroll"]',
    '[data-sel="detail-portrait"]', 'document.activeElement===e',
    'selectionStart', 'selectionEnd', 'panelMode', 'ready:',
    `panelMode===${JSON.stringify(expectedPanelMode)}`,
  ];
  const phaseTokens = phase === 'focus' ? ['focused&&panelMode===']
    : phase === 'selection'
      ? [`value===${JSON.stringify(expectedValue)}`,
        'selectionStart===0&&selectionEnd===value.length']
      : phase === 'cleared'
        ? [`value===${JSON.stringify(expectedValue)}`,
          'selectionStart===0&&selectionEnd===0']
        : [`value===${JSON.stringify(expectedValue)}`,
          'selectionStart===value.length&&selectionEnd===value.length'];
  if (common.concat(phaseTokens).some((token) => !source.includes(token))) return false;
  try { new Function(`"use strict"; return (${source});`); }
  catch { return false; }
  return true;
}

export function candidateFilterTelemetryExpression() {
  return `(()=>{const d=window.__CF_SLICE__?.api?.compendiumDiagnostics?.(),a=d?.art;
    return d&&a?{generation:d.generation,art:{live:a.live,totals:a.totals}}:null})()`;
}

export function validCandidateFilterTelemetryExpression(source) {
  if (typeof source !== 'string' || [
    'window.__CF_SLICE__?.api?.compendiumDiagnostics?.()',
    'generation:d.generation', 'live:a.live', 'totals:a.totals', 'return d&&a?',
  ].some((token) => !source.includes(token))) return false;
  try { new Function(`"use strict"; return (${source});`); }
  catch { return false; }
  return true;
}

/* Native search replacement is evidence, not setup convenience. The hidden
   branch uses Search's real outside-boundary pointer close; the visible branch
   uses a bounded focus-only setup followed by native keys; empty clear uses
   the ordinary dock/rail reopen because closed empty Enter is intentionally
   inert. High-frequency input polling reads only Search and a small panel DOM
   carrier; exact generation/art snapshots are paired, one-shot observations.
   Every focus/select/clear/exact-input row and accepted outcome remains in the witness. */
export async function driveCandidateFilterTransition({
  sessionId, entryMode, query, expectedCount, platform,
  click, key, sendStage, evaluate, waitValue, onTransitionStarted,
}) {
  assert(typeof sessionId === 'string' && sessionId
    && ['visible', 'hidden', 'reopen'].includes(entryMode)
    && typeof query === 'string'
    && Number.isSafeInteger(expectedCount) && expectedCount >= 0
    && (entryMode !== 'hidden' || query.length > 0)
    && (entryMode !== 'reopen' || (query === '' && expectedCount === 1500))
    && typeof platform === 'string' && platform
    && typeof click === 'function' && typeof key === 'function'
    && typeof sendStage === 'function' && typeof evaluate === 'function'
    && typeof waitValue === 'function'
    && typeof onTransitionStarted === 'function',
  'candidate native filter transition dependencies are invalid');
  const name = query || '<clear>';
  const expectedPanelMode = entryMode === 'visible' ? 'list' : 'closed';
  const transition = {
    schema: FILTER_TRANSITION_SCHEMA,
    entryMode,
    expectedQuery: query,
    expectedFilteredCount: expectedCount,
    entryTarget: entryMode === 'visible'
      ? null : { observationCount: 0, falsyObservations: [], accepted: null },
    reopenTarget: entryMode === 'reopen'
      ? { observationCount: 0, falsyObservations: [], accepted: null } : null,
    focus: { observationCount: 0, falsyObservations: [], accepted: null },
    beforeShortcut: null,
    selection: { observationCount: 0, falsyObservations: [], accepted: null },
    cleared: { observationCount: 0, falsyObservations: [], accepted: null },
    afterClear: null,
    exactInput: { observationCount: 0, falsyObservations: [], accepted: null },
    inputTelemetry: null,
    baselineGeneration: null,
    observationCount: 0,
    falsyObservations: [],
    settled: null,
    generationDelta: null,
  };
  onTransitionStarted(transition);
  const observeInput = async (label, expectedValue, phase, group) => {
    const expressionOptions = { expectedPanelMode, expectedValue, phase };
    const expression = candidateFilterInputExpression(expressionOptions);
    assert(validCandidateFilterInputExpression(expression, expressionOptions),
      `filter ${name}: ${phase} expression was invalid`);
    const accepted = (observation) => {
      if (observation?.ready !== true || observation.focused !== true
        || observation.panelMode !== expectedPanelMode) return false;
      if (phase === 'focus') return true;
      if (observation.value !== expectedValue) return false;
      if (phase === 'selection') {
        return observation.selectionStart === 0
          && observation.selectionEnd === observation.value.length;
      }
      if (phase === 'cleared') {
        return observation.selectionStart === 0 && observation.selectionEnd === 0;
      }
      return observation.selectionStart === observation.value.length
        && observation.selectionEnd === observation.value.length;
    };
    return await waitValue(sessionId, label, expression, {
      acceptValue: accepted,
      onObservation: (observation) => {
        assert(validFilterInputObservation(observation),
          `filter ${name}: ${phase} observation shape was invalid`);
        group.observationCount++;
        if (!accepted(observation)) group.falsyObservations.push(observation);
      },
    });
  };
  const observeTelemetry = async (label, expectedGeneration = null) => await waitValue(
    sessionId, label, (() => {
      const expression = candidateFilterTelemetryExpression();
      assert(validCandidateFilterTelemetryExpression(expression),
        `filter ${name}: telemetry expression was invalid`);
      return expression;
    })(), {
      acceptValue: (observation) => {
        assert(validFilterTelemetrySnapshot(observation),
          `filter ${name}: ${label} shape was invalid`);
        assert(expectedGeneration === null || observation.generation === expectedGeneration,
          `filter ${name}: generation advanced during native input replacement`);
        return true;
      },
    },
  );
  if (entryMode === 'visible') {
    await evaluate(sessionId, `(()=>{
      const e=document.querySelector('#searchbox'),p=document.querySelector('#codexpanel');
      const hidden=!p||p.getAttribute('aria-hidden')==='true'||p.style.display==='none';
      const panelMode=!hidden&&p.querySelector('[data-sel="codex-scroll"]')?'list':
        hidden?'closed':'not-list';
      if(!e||panelMode!=='list')throw new Error('visible Compendium list/search unavailable');
      e.focus();if(document.activeElement!==e)throw new Error('visible Search focus failed');
      return {focused:true,panelMode}})()`,
    `focus visible filter ${name}`);
  } else {
    await click(sessionId, '#searchbox', `search ${name}`, {
      targetWitness: transition.entryTarget,
    });
  }
  const focused = await observeInput(
    `filter ${name} input focus`, null, 'focus', transition.focus,
  );
  transition.focus.accepted = focused;
  transition.beforeShortcut = await observeTelemetry(`filter ${name} before shortcut telemetry`);
  const modifier = platform === 'darwin' ? 4 : 2;
  await key(sessionId, 'a', 'KeyA', modifier, `filter ${name} select-all`, ['selectAll']);
  const selection = await observeInput(
    `filter ${name} full selection`, focused.value, 'selection', transition.selection,
  );
  transition.selection.accepted = selection;
  await key(sessionId, 'Backspace', 'Backspace', 0, `filter ${name} delete`);
  const cleared = await observeInput(
    `filter ${name} input cleared`, '', 'cleared', transition.cleared,
  );
  transition.cleared.accepted = cleared;
  transition.afterClear = await observeTelemetry(
    `filter ${name} cleared telemetry`, transition.beforeShortcut.generation,
  );
  if (query) {
    await sendStage(`insert filter ${name}`, 'Input.insertText', { text: query }, sessionId);
  }
  const exactInput = await observeInput(
    `filter ${name} exact input`, query, 'exact-input', transition.exactInput,
  );
  transition.exactInput.accepted = exactInput;
  const inputTelemetry = await observeTelemetry(
    `filter ${name} exact input telemetry`, transition.afterClear.generation,
  );
  transition.inputTelemetry = inputTelemetry;
  transition.baselineGeneration = inputTelemetry.generation;
  if (entryMode === 'reopen') {
    await click(sessionId, '#dockcodex, #railcodex', 'ordinary Compendium reopen', {
      targetWitness: transition.reopenTarget,
    });
  } else {
    await key(sessionId, 'Enter', 'Enter', 0, `filter ${name} submit`);
  }
  const settled = await waitValue(sessionId, `filter ${name}`, `(()=>{
    const d=window.__CF_SLICE__.api.compendiumDiagnostics(),a=d.art;
    return {ready:d.panel.mode==='list'&&d.panel.query===${JSON.stringify(query)}
        &&d.panel.filteredCount===${expectedCount},mode:d.panel.mode,query:d.panel.query,
      filteredCount:d.panel.filteredCount,sourceCount:d.panel.sourceCount,
      generation:d.generation,art:a?{live:a.live,totals:a.totals}:null}})()`, {
    acceptValue: (observation) => observation?.ready === true,
    onObservation: (observation) => {
      assert(validFilterTransitionObservation(observation),
        `filter ${name}: product transition observation shape was invalid`);
      transition.observationCount++;
      if (observation.ready === false) transition.falsyObservations.push(observation);
    },
  });
  transition.settled = settled;
  transition.generationDelta = settled.generation - transition.baselineGeneration;
  return transition;
}

/* Heap collection is part of the measurement contract, not a best-effort
   prelude. Keep this sequence shared with the browser-free control so a
   failed GC cannot be swallowed and followed by incomparable heap evidence. */
export async function collectCandidateSnapshot({
  sessionId, label, rawSnapshotExpression, evaluate, sendStage,
}) {
  assert(typeof sessionId === 'string' && sessionId && typeof label === 'string' && label
    && typeof rawSnapshotExpression === 'string' && rawSnapshotExpression
    && typeof evaluate === 'function' && typeof sendStage === 'function',
  'candidate snapshot dependencies are invalid');
  await sendStage(`${label} garbage collection`, 'HeapProfiler.collectGarbage', {}, sessionId);
  await evaluate(sessionId,
    `new Promise(resolve=>requestAnimationFrame(()=>resolve(true)))`,
    `${label} animation task`);
  const observed = await evaluate(
    sessionId, rawSnapshotExpression, `${label} product/DOM snapshot`,
  );
  const heap = await sendStage(`${label} heap usage`, 'Runtime.getHeapUsage', {}, sessionId);
  const dom = await sendStage(`${label} DOM counters`, 'Memory.getDOMCounters', {}, sessionId);
  return { diagnostics: observed.diagnostics, heap, dom, raw: observed.raw };
}

async function collectProfile({
  profile, viewport, fixture, browser, origin, veteranRaw, runId, candidateSpeciesChunk,
}) {
  const send = browser.send;
  const contexts = new Set();
  const sessions = new Set();
  const reviewPacket = [];
  const commandLedger = [];
  const filterTransitions = [];
  let producerErrorWitness = null;
  const errorStages = producerErrorStages(profile);
  const producerErrorCandidateLabels = new Set([
    errorStages.preArm, errorStages.openTarget, errorStages.publication,
    errorStages.answerability, errorStages.closeTarget,
    errorStages.recoveryOpenTarget, errorStages.recovery,
  ]);
  const recordCommand = createCandidateCommandRecorder({
    commandLedger, producerErrorCandidateLabels,
    getProducerErrorWitness: () => producerErrorWitness,
  });
  const completedStages = [];
  let currentStage = 'profile initialization';
  let lastCompletedStage = null;
  const completeStage = (label) => {
    lastCompletedStage = label;
    currentStage = label;
    completedStages.push(label);
  };
  const disposeAll = async () => {
    for (const sessionId of sessions) {
      try { await send('Target.detachFromTarget', { sessionId }); } catch { /* browser cleanup owns the rest */ }
    }
    for (const browserContextId of contexts) {
      try { await send('Target.disposeBrowserContext', { browserContextId }); } catch { /* close() remains authoritative */ }
    }
  };
  const { evaluate, waitValue, answerability, sendStage } = createCandidateCollectorObservations({
    send, profile, now: () => performance.now(), pause: sleep,
    onStageStarted: (label) => { currentStage = label; },
    onStageCompleted: completeStage,
    onCommand: recordCommand,
  });
  const createTarget = async () => {
    const context = await sendStage(
      'create browser context', 'Target.createBrowserContext',
    );
    contexts.add(context.browserContextId);
    const target = await sendStage('create page target', 'Target.createTarget', {
      url: 'about:blank', browserContextId: context.browserContextId,
    });
    const attached = await sendStage('attach page target', 'Target.attachToTarget', {
      targetId: target.targetId, flatten: true,
    });
    sessions.add(attached.sessionId);
    await sendStage('enable Runtime domain', 'Runtime.enable', {}, attached.sessionId);
    await sendStage('enable Page domain', 'Page.enable', {}, attached.sessionId);
    await sendStage('enable HeapProfiler domain', 'HeapProfiler.enable', {}, attached.sessionId);
    const emulation = compendiumProfileEmulationOptions(profile, viewport);
    await sendStage('set initial device metrics', 'Emulation.setDeviceMetricsOverride',
      emulation.deviceMetrics, attached.sessionId);
    await sendStage('set initial touch emulation', 'Emulation.setTouchEmulationEnabled',
      emulation.touch, attached.sessionId);
    return { browserContextId: context.browserContextId, targetId: target.targetId, sessionId: attached.sessionId };
  };
  const navigate = async (sessionId, url, label) => {
    await sendStage(`${label} navigation`, 'Page.navigate', { url }, sessionId);
    return await waitValue(sessionId, `${label} readiness`, `(()=>{
      const S=window.__CF_SLICE__; return S&&S.api&&typeof S.api.compendiumDiagnostics==='function'
        &&S.api.__compendiumEvidence&&typeof S.documentToken==='string'?S.documentToken:null;
    })()`, { timeoutMs: 20000 });
  };
  const seedSave = async (sessionId) => {
    await sendStage('seed document navigation', 'Page.navigate', {
      url: `${origin}/__compendiummem_seed__.html`,
    }, sessionId);
    await waitValue(sessionId, 'seed document', `document.readyState==='complete'?'ready':null`);
    const expression = `(async()=>{const stores=${JSON.stringify(STORES)},raw=${JSON.stringify(veteranRaw)};
      const db=await new Promise((resolve,reject)=>{const q=indexedDB.open('cf-v2-slice',1);
        q.onupgradeneeded=()=>{for(const s of stores)if(!q.result.objectStoreNames.contains(s))q.result.createObjectStore(s)};
        q.onerror=()=>reject(q.error);q.onblocked=()=>reject(new Error('seed IDB blocked'));q.onsuccess=()=>resolve(q.result)});
      await new Promise((resolve,reject)=>{const tx=db.transaction('meta','readwrite');tx.objectStore('meta').put(raw,'save');
        tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('seed IDB aborted'))});
      db.close();return {bytes:new TextEncoder().encode(raw).byteLength};})()`;
    const seeded = await evaluate(sessionId, expression, 'seed save');
    assert(seeded?.bytes === Buffer.byteLength(veteranRaw), `${profile}: seeded save byte count drifted`);
  };
  const rawSnapshotExpression = compendiumRawSnapshotExpression();
  assert(validCompendiumRawSnapshotExpression(rawSnapshotExpression),
    `${profile}: Compendium raw snapshot expression is syntactically or structurally invalid`);
  const snapshot = async (sessionId, label) => await collectCandidateSnapshot({
    sessionId, label, rawSnapshotExpression, evaluate, sendStage,
  });
  const captureReview = async (sessionId, state) => {
    const captured = await sendStage(`screenshot ${state}`, 'Page.captureScreenshot', {
      format: 'png', fromSurface: true, captureBeyondViewport: false,
    }, sessionId);
    currentStage = `review ${state}`;
    assert(typeof captured?.data === 'string' && captured.data.length > 0,
      `${profile} ${state}: browser returned an empty review screenshot`);
    const bytes = Buffer.from(captured.data, 'base64');
    assert(bytes.length > 0, `${profile} ${state}: decoded review screenshot is empty`);
    const filename = `compendiummem-${runId}-${profile}-${state}.png`;
    const file = path.join(outputDir, filename);
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(file, bytes, { flag: 'wx' });
    reviewPacket.push({
      profile, state, file: path.relative(v2Root, file).split(path.sep).join('/'), bytes: bytes.length,
      sha256: sha256(bytes),
    });
    completeStage(`review ${state}`);
  };
  const waitListReady = (sessionId, expectedCount = null) => waitValue(sessionId, 'list thumb settlement', `(()=>{
    const d=window.__CF_SLICE__.api.compendiumDiagnostics(),s=d.surfaces.list.thumbStates;
    return d.panel.mode==='list'${expectedCount === null ? '' : `&&d.panel.filteredCount===${expectedCount}`}
      &&s.length>0&&s.every(x=>x==='ready')&&d.art&&d.art.live.queuedJobs===0&&d.art.live.activeJobs===0?d:null;
  })()`, { timeoutMs: 30000 });
  const waitPlanetsideReady = (sessionId) => waitValue(sessionId, 'Planetside thumb settlement', `(()=>{
    const d=window.__CF_SLICE__.api.compendiumDiagnostics(),s=d.surfaces.planetside.thumbStates;
    return d.surfaces.planetside.visible&&s.length>0&&s.every(x=>x==='ready')
      &&d.art&&d.art.live.queuedJobs===0&&d.art.live.activeJobs===0?d:null;
  })()`, { timeoutMs: 30000 });
  const elementPoint = async (
    sessionId, selector, label, { targetWitness = null } = {},
  ) => await waitValue(sessionId, `${label} target`, `(()=>{
    const e=[...document.querySelectorAll(${JSON.stringify(selector)})].find(x=>{const r=x.getBoundingClientRect(),s=getComputedStyle(x);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'});
    if(!e)return {ready:false,x:null,y:null};const r=e.getBoundingClientRect();
    return {ready:true,x:(r.left+r.right)/2,y:(r.top+r.bottom)/2};})()`, {
    acceptValue: (observation) => observation?.ready === true,
    onObservation: (observation) => {
      assert(validFilterTargetObservation(observation),
        `${profile} ${label}: click-target observation shape was invalid`);
      if (targetWitness !== null) {
        targetWitness.observationCount++;
        if (observation.ready === false) targetWitness.falsyObservations.push(observation);
      }
    },
  });
  const click = async (sessionId, selector, label, { targetWitness = null } = {}) => {
    assert(targetWitness === null || (Number.isSafeInteger(targetWitness.observationCount)
      && Array.isArray(targetWitness.falsyObservations) && targetWitness.accepted === null),
    `${profile} ${label}: click-target witness carrier was invalid`);
    const point = await elementPoint(sessionId, selector, label, { targetWitness });
    if (targetWitness !== null) targetWitness.accepted = point;
    await sendStage(`${label} mouse press`, 'Input.dispatchMouseEvent', {
      type: 'mousePressed', x: point.x, y: point.y, button: 'left', clickCount: 1,
    }, sessionId);
    await sendStage(`${label} mouse release`, 'Input.dispatchMouseEvent', {
      type: 'mouseReleased', x: point.x, y: point.y, button: 'left', clickCount: 1,
    }, sessionId);
  };
  const rowPoint = async (sessionId, logicalId) => await waitValue(sessionId, `row ${logicalId}`, `(()=>{
    const e=[...document.querySelectorAll('#codexpanel [data-cid]')].find(x=>x.dataset.cid===${JSON.stringify(logicalId)});
    const s=document.querySelector('[data-sel="codex-scroll"]');if(!e||!s)return null;
    const r=e.getBoundingClientRect(),sr=s.getBoundingClientRect();
    const left=Math.max(r.left,sr.left,0),right=Math.min(r.right,sr.right,innerWidth);
    const top=Math.max(r.top,sr.top,0),bottom=Math.min(r.bottom,sr.bottom,innerHeight);
    return right>left&&bottom>top?{x:(left+right)/2,y:(top+bottom)/2}:null})()`);
  const clickRow = async (sessionId, logicalId) => {
    const point = await rowPoint(sessionId, logicalId);
    await sendStage(`row ${logicalId} mouse press`, 'Input.dispatchMouseEvent', {
      type: 'mousePressed', x: point.x, y: point.y, button: 'left', clickCount: 1,
    }, sessionId);
    await sendStage(`row ${logicalId} mouse release`, 'Input.dispatchMouseEvent', {
      type: 'mouseReleased', x: point.x, y: point.y, button: 'left', clickCount: 1,
    }, sessionId);
  };
  const key = async (
    sessionId, keyName, code, modifiers = 0, labelPrefix = '', commands = [],
  ) => {
    const label = labelPrefix ? `${labelPrefix} key ${keyName}` : `key ${keyName}`;
    const [down, up] = candidateNativeKeyDispatches(keyName, code, modifiers, commands);
    await sendStage(`${label} down`, 'Input.dispatchKeyEvent', down, sessionId);
    await sendStage(`${label} up`, 'Input.dispatchKeyEvent', up, sessionId);
  };
  const search = async (sessionId, entryMode, query, expectedCount) =>
    await driveCandidateFilterTransition({
      sessionId, entryMode, query, expectedCount, platform: process.platform,
      click, key, sendStage, evaluate, waitValue,
      onTransitionStarted: (transition) => filterTransitions.push(transition),
    });
  const scrollerPoint = (sessionId) => waitValue(sessionId, 'Compendium scroller', `(()=>{const e=document.querySelector('[data-sel="codex-scroll"]');
    if(!e)return null;const r=e.getBoundingClientRect();return r.width>0&&r.height>0?{x:(r.left+r.right)/2,y:(r.top+r.bottom)/2}:null})()`);
  const scrollToIndex = async (sessionId, wanted, { settle = true } = {}) => {
    const point = await scrollerPoint(sessionId);
    for (let step = 0; step < 50; step++) {
      const windowState = await evaluate(sessionId, `window.__CF_SLICE__.api.compendiumDiagnostics().window`, 'scroll window');
      const logicalId = fixture.rows[wanted]?.[0];
      const visibility = await evaluate(sessionId, `(()=>{const row=[...document.querySelectorAll('#codexpanel [data-cid]')]
        .find(x=>x.dataset.cid===${JSON.stringify(logicalId)});const s=document.querySelector('[data-sel="codex-scroll"]');
        if(!row||!s)return {intersects:false,direction:null};const r=row.getBoundingClientRect(),sr=s.getBoundingClientRect();
        const top=Math.max(sr.top,0),bottom=Math.min(sr.bottom,innerHeight);
        return {intersects:r.bottom>top+0.5&&r.top<bottom-0.5,
          direction:r.top>=bottom-0.5?1:r.bottom<=top+0.5?-1:0}})()`,
      `scroll visibility ${wanted}`);
      if (wanted >= windowState.start && wanted < windowState.end && visibility.intersects) {
        if (settle) {
          await waitListReady(sessionId);
          const settled = await evaluate(sessionId, `(()=>{const row=[...document.querySelectorAll('#codexpanel [data-cid]')]
            .find(x=>x.dataset.cid===${JSON.stringify(logicalId)});const s=document.querySelector('[data-sel="codex-scroll"]');
            if(!row||!s)return false;const r=row.getBoundingClientRect(),sr=s.getBoundingClientRect();
            return r.bottom>Math.max(sr.top,0)+0.5&&r.top<Math.min(sr.bottom,innerHeight)-0.5})()`,
          `settled scroll visibility ${wanted}`);
          if (!settled) continue;
        }
        return;
      }
      const midpoint = (windowState.start + windowState.end) / 2;
      const distance = wanted - midpoint;
      const indexDirection = distance === 0
        ? (wanted < windowState.start ? -1 : 1) : Math.sign(distance);
      const direction = visibility.direction || indexDirection;
      const deltaY = direction * Math.max(120, Math.min(6000, Math.max(1, Math.abs(distance)) * 58));
      await sendStage(`scroll toward row ${wanted}`, 'Input.dispatchMouseEvent', {
        type: 'mouseWheel', x: point.x, y: point.y, deltaX: 0, deltaY,
      }, sessionId);
      await sleep(30);
    }
    throw new Error(`${profile}: native scroll did not reach logical index ${wanted}`);
  };
  const scrollAnchor = async (sessionId, label, selectedId) => evaluate(sessionId, `(()=>{
    const scroller=document.querySelector('[data-sel="codex-scroll"]');if(!scroller)return null;
    const sr=scroller.getBoundingClientRect();
    const rows=[...scroller.querySelectorAll('[data-sel="codex-entry"][data-cid]')]
      .map(row=>{const r=row.getBoundingClientRect();return {logicalId:row.dataset.cid||'',index:Number(row.dataset.ci),top:r.top,bottom:r.bottom}})
      .sort((a,b)=>a.top-b.top);
    const anchor=rows.find(row=>row.bottom>sr.top+0.5&&row.top<sr.bottom-0.5);if(!anchor)return null;
    const selected=rows.find(row=>row.logicalId===${JSON.stringify(selectedId)});
    const w=window.__CF_SLICE__.api.compendiumDiagnostics().window;
    const selectedIndex=selected?.index;
    return {logicalId:anchor.logicalId,offsetPx:anchor.top-sr.top,scrollTop:scroller.scrollTop,
      window:{start:w.start,end:w.end,beforePx:w.beforePx,afterPx:w.afterPx},
      selectedLogicalId:selected?.logicalId||null,selectedIndex:Number.isFinite(selectedIndex)?selectedIndex:null,
      selectedMounted:!!selected,selectedIntersects:!!selected&&selected.bottom>sr.top+0.5&&selected.top<sr.bottom-0.5,
      selectedInWindow:Number.isFinite(selectedIndex)&&selectedIndex>=w.start&&selectedIndex<w.end,
      selectedPinned:Array.isArray(w.pinnedLogicalIds)&&w.pinnedLogicalIds.includes(${JSON.stringify(selectedId)}),
      activeLogicalId:document.activeElement?.closest?.('[data-cid]')?.dataset.cid||null}})()`, label);
  const openCompendium = async (sessionId) => {
    const mode = await evaluate(sessionId, `window.__CF_SLICE__.api.compendiumDiagnostics().panel.mode`, 'panel mode');
    if (mode !== 'closed') await click(sessionId, '#codexpanel [data-pnx="codex"]', 'close existing Compendium');
    await click(sessionId, '#dockcodex,#railcodex', 'open Compendium');
    await waitValue(sessionId, 'Compendium open', `(()=>{const d=window.__CF_SLICE__.api.compendiumDiagnostics();return d.panel.mode==='list'&&d.panel.sourceCount===1500?d:null})()`);
  };
  const closeCompendium = async (sessionId) => {
    const mode = await evaluate(sessionId, `window.__CF_SLICE__.api.compendiumDiagnostics().panel.mode`, 'close panel mode');
    if (mode !== 'closed') await click(sessionId, '#codexpanel [data-pnx="codex"]', 'close Compendium');
    await waitValue(sessionId, 'Compendium closed', `window.__CF_SLICE__.api.compendiumDiagnostics().panel.mode==='closed'?'closed':null`);
  };
  const emptyObservationGroup = () => ({
    observationCount: 0, falsyObservations: [], accepted: null,
  });
  const observeProducerErrorGroup = async (
    sessionId, label, expression, group, validator,
  ) => {
    const accepted = await waitValue(sessionId, label, expression, {
      timeoutMs: 30000,
      acceptValue: (observation) => observation?.ready === true,
      onObservation: (observation) => {
        assert(validator(observation),
          `${profile} ${label}: producer-error observation shape was invalid`);
        group.observationCount++;
        if (observation.ready === false) group.falsyObservations.push(observation);
      },
    });
    group.accepted = accepted;
    return accepted;
  };
  try {
    /* Independent fresh document: no saved surface may legitimately request
       species art before the lazy-import sentinel is sampled. */
    const lazyTarget = await createTarget();
    await navigate(lazyTarget.sessionId, `${origin}/`, 'fresh lazy-control boot');
    const lazyBoot = await snapshot(lazyTarget.sessionId, 'fresh lazy-control');
    const lazySpeciesResources = await evaluate(lazyTarget.sessionId, `(()=>{const suffix=${JSON.stringify(`/${candidateSpeciesChunk.relativePath}`)};
      return performance.getEntriesByType('resource').map(entry=>entry.name)
        .filter(name=>{try{return new URL(name,location.href).pathname.endsWith(suffix)}catch{return false}})})()`,
    'fresh species-art resource absence');

    const mainTarget = await createTarget();
    const sessionId = mainTarget.sessionId;
    await seedSave(sessionId);
    await navigate(sessionId, `${origin}/`, 'veteran Earth boot');
    await waitPlanetsideReady(sessionId);
    const initial = await snapshot(sessionId, 'main initial');
    await evaluate(sessionId, `window.__CF_SLICE__.api.__compendiumEvidence.trimArtNow(${JSON.stringify(profile)})`, 'set device class');
    const installed = await evaluate(sessionId,
      `window.__CF_SLICE__.api.__compendiumEvidence.installFixture(${JSON.stringify(fixture.rows)})`,
      'install exact fixture');
    currentStage = 'validate exact fixture';
    assert(installed?.installed === 1500, `${profile}: fixture hook installed ${String(installed?.installed)} rows`);
    completeStage('validate exact fixture');

    const targets = {
      first: fixture.rows[0][0], middle: fixture.rows[750][0], last: fixture.rows[1499][0],
      filter: fixture.filterBeacon, detail: fixture.rows[777][0], pinned: fixture.rows[0][0],
    };

    /* The one-shot producer failure is exercised before any Compendium owner
       exists. Planetside is the only art owner, so a stable first open whose
       distinct mounted keys exceed the pre-arm cache cardinality must queue a
       cold job. Holding that window fixed keeps the exact failed identity in
       the DOM; close/reopen then retries that same identity without scrolling. */
    producerErrorWitness = {
      schema: PRODUCER_ERROR_WITNESS_SCHEMA,
      preArm: emptyObservationGroup(),
      armSentinel: null,
      openTarget: emptyObservationGroup(),
      publication: emptyObservationGroup(),
      answerability: null,
      closeTarget: emptyObservationGroup(),
      recoveryOpenTarget: emptyObservationGroup(),
      recovery: emptyObservationGroup(),
      commands: [],
    };
    const preArmExpression = candidateProducerErrorPreArmExpression();
    assert(validCandidateProducerErrorExpression(preArmExpression, 'pre-arm'),
      `${profile}: producer-error pre-arm expression is invalid`);
    await observeProducerErrorGroup(
      sessionId, errorStages.preArm, preArmExpression,
      producerErrorWitness.preArm, validProducerErrorPreArmObservation,
    );
    producerErrorWitness.armSentinel = await armCandidateProducerError({ sessionId, evaluate });
    await click(sessionId, '#dockcodex,#railcodex', 'producer error open', {
      targetWitness: producerErrorWitness.openTarget,
    });
    const workExpression = candidateProducerErrorWorkExpression();
    assert(validCandidateProducerErrorExpression(workExpression, 'work'),
      `${profile}: producer-error work expression is invalid`);
    await observeProducerErrorGroup(
      sessionId, errorStages.publication, workExpression,
      producerErrorWitness.publication, validProducerErrorWorkObservation,
    );
    currentStage = errorStages.coldProof;
    assert(producerErrorColdProof(producerErrorWitness, profile),
      `${profile}: stable first open did not prove a mounted cold fixture key`);
    completeStage(errorStages.coldProof);
    producerErrorWitness.answerability = await answerability(sessionId, `${profile}-error`);
    await click(sessionId, '#codexpanel [data-pnx="codex"]', 'producer error close', {
      targetWitness: producerErrorWitness.closeTarget,
    });
    await click(sessionId, '#dockcodex,#railcodex', 'producer error recovery open', {
      targetWitness: producerErrorWitness.recoveryOpenTarget,
    });
    await observeProducerErrorGroup(
      sessionId, errorStages.recovery, workExpression,
      producerErrorWitness.recovery, validProducerErrorWorkObservation,
    );
    const first = await snapshot(sessionId, 'first rows');
    await captureReview(sessionId, 'list');
    const resizeBase = first;
    const resizeTo = async (height, label, predicate) => {
      await sendStage(`${label} device metrics`, 'Emulation.setDeviceMetricsOverride', {
        width: viewport.width, height, deviceScaleFactor: viewport.dpr, mobile: viewport.mobile,
      }, sessionId);
      await evaluate(sessionId, `new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))`,
        `${label} layout settlement`);
      await waitValue(sessionId, `${label} viewport/window`, `(()=>{const d=window.__CF_SLICE__.api.compendiumDiagnostics();
        return window.innerHeight===${height}&&(${predicate})?d:null})()`);
      await waitListReady(sessionId, 1500);
      return await snapshot(sessionId, label);
    };
    const contractedHeight = Math.max(480, viewport.height - 180);
    const resizeContracted = await resizeTo(contractedHeight, 'contracted viewport',
      `document.querySelector('[data-sel="codex-scroll"]')?.clientHeight<${resizeBase.raw.scrollerHeight}
        &&d.window.end<${resizeBase.diagnostics.window.end}`);
    const expandedHeight = viewport.height + 240;
    const resizeExpanded = await resizeTo(expandedHeight, 'expanded viewport',
      `document.querySelector('[data-sel="codex-scroll"]')?.clientHeight>${resizeContracted.raw.scrollerHeight}
        &&d.window.end>${resizeContracted.diagnostics.window.end}
        &&d.window.mountedRowCount>${resizeContracted.raw.mountedRowCount}`);
    const resizeRestored = await resizeTo(viewport.height, 'restored viewport',
      `document.querySelector('[data-sel="codex-scroll"]')?.clientHeight>${resizeContracted.raw.scrollerHeight}
        &&d.window.end>${resizeContracted.diagnostics.window.end}`);
    for (let tabs = 0; tabs < 4; tabs++) {
      const active = await evaluate(sessionId,
        `document.activeElement?.closest?.('[data-cid]')?.dataset.cid||null`,
        'keyboard traversal entry');
      if (active === targets.first) break;
      await key(sessionId, 'Tab', 'Tab');
    }
    assert(await evaluate(sessionId,
      `document.activeElement?.closest?.('[data-cid]')?.dataset.cid===${JSON.stringify(targets.first)}`,
      'keyboard traversal first row'), `${profile}: native Tab did not enter the first logical row`);
    const traversalInitialEnd = resizeRestored.diagnostics.window.end;
    const keyboardSamples = [];
    const readKeyboardSample = (logicalIndex) => evaluate(sessionId, `(()=>{const d=window.__CF_SLICE__.api.compendiumDiagnostics();
      const row=document.activeElement?.closest?.('[data-cid]');return {expectedIndex:${logicalIndex},
        expectedLogicalId:${JSON.stringify(fixture.rows[Math.min(logicalIndex, fixture.count - 1)][0])},
        actualIndex:Number(row?.dataset.ci),actualLogicalId:row?.dataset.cid||null,
        mounted:d.window.mountedLogicalIds.includes(row?.dataset.cid||''),mountedRowCount:d.window.mountedRowCount,
        windowStart:d.window.start,windowEnd:d.window.end}})()`, `keyboard traversal row ${logicalIndex}`);
    keyboardSamples.push(await readKeyboardSample(0));
    const traversalSteps = Math.min(48, Math.max(30, traversalInitialEnd + 4));
    for (let logicalIndex = 1; logicalIndex <= traversalSteps; logicalIndex++) {
      await key(sessionId, 'Tab', 'Tab');
      await evaluate(sessionId,
        `new Promise(resolve=>requestAnimationFrame(()=>resolve(true)))`,
        `keyboard traversal settle ${logicalIndex}`);
      keyboardSamples.push(await readKeyboardSample(logicalIndex));
    }
    const keyboardTraversal = {
      initialWindowEnd: traversalInitialEnd, samples: keyboardSamples,
      crossedWindowBoundary: keyboardSamples.some((sample) =>
        sample.actualIndex >= traversalInitialEnd && sample.windowStart > 0),
    };
    const reviewFocus = await evaluate(sessionId, `(()=>{const row=document.activeElement?.closest?.('[data-cid]');
      const scroller=document.querySelector('[data-sel="codex-scroll"]');if(!row||!scroller)return null;
      const r=row.getBoundingClientRect(),s=scroller.getBoundingClientRect(),style=getComputedStyle(row);
      return {logicalId:row.dataset.cid||null,intersects:r.bottom>s.top+0.5&&r.top<s.bottom-0.5,
        outlineWidth:parseFloat(style.outlineWidth)||0,outlineOffset:parseFloat(style.outlineOffset)||0}})()`,
    'visible native focus review');
    assert(reviewFocus?.intersects === true && reviewFocus.outlineWidth >= 3
      && reviewFocus.outlineOffset <= -reviewFocus.outlineWidth,
    `${profile}: review screenshot row focus/ring was not visibly contained`);
    keyboardTraversal.reviewFocus = reviewFocus;
    await captureReview(sessionId, 'focus-pinned');
    await closeCompendium(sessionId);
    await openCompendium(sessionId);
    await waitListReady(sessionId, 1500);
    const identity = await evaluate(sessionId, `(()=>{const ids=${JSON.stringify(fixture.sameSeedPair)};
      const key=id=>[...document.querySelectorAll('#codexpanel [data-cid]')].find(e=>e.dataset.cid===id)?.querySelector('img')?.dataset.visualKey||null;
      return {alphaKey:key(ids[0]),betaKey:key(ids[1])}})()`, 'complete identity keys');
    const firstProbe = await answerability(sessionId, `${profile}-first`);

    /* Ordinary native filter replacement retains the two sentinel rows long
       enough for the new generation to acquire before the old releases. */
    const dedupeBefore = await evaluate(sessionId,
      `window.__CF_SLICE__.api.compendiumDiagnostics().art.totals.dedupeHits`, 'pre-dedupe total');
    await search(sessionId, 'visible', 'Same Seed Sentinel', 2);
    await waitListReady(sessionId, 2);
    const dedupeAfter = await evaluate(sessionId,
      `window.__CF_SLICE__.api.compendiumDiagnostics().art.totals.dedupeHits`, 'post-dedupe total');

    /* Deliberate fast native churn invalidates queued work. Correct code may
       cancel it before any stale callback, so certification requires cancels
       and zero wrong-generation commits—not a positive stale callback count. */
    await closeCompendium(sessionId);
    await openCompendium(sessionId);
    const churnBefore = await evaluate(sessionId,
      `window.__CF_SLICE__.api.compendiumDiagnostics().art.totals.jobCancels`, 'pre-churn cancel total');
    const churnPoint = await scrollerPoint(sessionId);
    for (let index = 0; index < 8; index++) {
      await sendStage(`churn wheel ${index + 1}`, 'Input.dispatchMouseEvent', {
        type: 'mouseWheel', x: churnPoint.x, y: churnPoint.y,
        deltaX: 0, deltaY: 5500,
      }, sessionId);
    }
    await closeCompendium(sessionId);
    await waitPlanetsideReady(sessionId);
    const churnAfter = await evaluate(sessionId,
      `window.__CF_SLICE__.api.compendiumDiagnostics().art.totals.jobCancels`, 'post-churn cancel total');
    await openCompendium(sessionId);
    await waitListReady(sessionId, 1500);

    await scrollToIndex(sessionId, 750);
    const middle = await snapshot(sessionId, 'middle rows');
    await scrollToIndex(sessionId, 1499);
    const last = await snapshot(sessionId, 'last rows');

    await search(sessionId, 'hidden', 'Compendium Filter Beacon', 1);
    await waitListReady(sessionId, 1);
    const filtered = await snapshot(sessionId, 'filtered row');
    await search(sessionId, 'reopen', '', 1500);
    await waitListReady(sessionId, 1500);
    await scrollToIndex(sessionId, 777);
    await clickRow(sessionId, targets.detail);
    await waitValue(sessionId, '440 detail', `(()=>{const d=window.__CF_SLICE__.api.compendiumDiagnostics();
      return d.panel.mode==='detail'&&d.surfaces.detail.logicalId===${JSON.stringify(targets.detail)}
        &&d.surfaces.detail.naturalWidth===440&&d.surfaces.detail.naturalHeight===440?d:null})()`, { timeoutMs: 30000 });
    const detail = await snapshot(sessionId, 'detail');
    await captureReview(sessionId, 'detail');
    await click(sessionId, '#codexpanel [data-pnx="codex"]', 'detail Close');
    await waitValue(sessionId, 'detail Close cleanup', `(()=>{const d=window.__CF_SLICE__.api.compendiumDiagnostics(),img=document.querySelector('#codexpanel [data-sel="detail-portrait"]');
      return d.panel.mode==='closed'&&(!img||(!img.getAttribute('src')&&img.naturalWidth===0&&img.naturalHeight===0))?d:null})()`);
    const detailClosed = await snapshot(sessionId, 'detail Close');
    /* Re-enter through the native filter/detail path so Back focus is an
       independent outcome rather than inferred from the Close lifecycle. */
    await openCompendium(sessionId);
    await waitListReady(sessionId, 1500);
    await scrollToIndex(sessionId, 777);
    const backAnchorBefore = await scrollAnchor(sessionId, 'pre-detail Back anchor', targets.detail);
    assert(backAnchorBefore?.logicalId, `${profile}: deep-list Back anchor was not observable`);
    await clickRow(sessionId, targets.detail);
    await waitValue(sessionId, 'second 440 detail', `(()=>{const d=window.__CF_SLICE__.api.compendiumDiagnostics();
      return d.panel.mode==='detail'&&d.surfaces.detail.logicalId===${JSON.stringify(targets.detail)}
        &&d.surfaces.detail.naturalWidth===440&&d.surfaces.detail.naturalHeight===440?d:null})()`, { timeoutMs: 30000 });
    await click(sessionId, '#codexback', 'Back');
    await waitValue(sessionId, 'Back focus', `(()=>{const d=window.__CF_SLICE__.api.compendiumDiagnostics(),a=document.activeElement?.closest?.('[data-cid]');
      return d.panel.mode==='list'&&a?.dataset.cid===${JSON.stringify(targets.detail)}?d:null})()`);
    await waitListReady(sessionId, 1500);
    const back = await snapshot(sessionId, 'Back');
    const backAnchorAfter = await scrollAnchor(sessionId, 'post-Back settled anchor', targets.detail);
    await evaluate(sessionId, `new Promise(resolve=>requestAnimationFrame(()=>setTimeout(()=>resolve(true),0)))`,
      'second post-Back layout settlement');
    await waitListReady(sessionId, 1500);
    const backAnchorSettled = await scrollAnchor(
      sessionId, 'second post-Back settled anchor', targets.detail,
    );

    await closeCompendium(sessionId);
    await openCompendium(sessionId);
    await waitListReady(sessionId, 1500);
    for (let tabs = 0; tabs < 4; tabs++) {
      const active = await evaluate(sessionId, `document.activeElement?.closest?.('[data-cid]')?.dataset.cid||null`, 'focus entry');
      if (active === targets.pinned) break;
      await key(sessionId, 'Tab', 'Tab');
    }
    assert(await evaluate(sessionId,
      `document.activeElement?.closest?.('[data-cid]')?.dataset.cid===${JSON.stringify(targets.pinned)}`,
      'first-row focus'), `${profile}: native Tab did not focus the first logical row`);
    await scrollToIndex(sessionId, 750);
    const focusPinned = await snapshot(sessionId, 'focused off-window row');

    /* Capture deterministic lifetime high-water marks before the intentional
       cross-device cap-shrink control changes the product limit class. */
    const profilePeakArt = await evaluate(sessionId,
      `window.__CF_SLICE__.api.compendiumDiagnostics().art`, 'profile job high-water diagnostics');
    const jobPeaks = {
      deviceClass: profilePeakArt.deviceClass,
      queuedJobsPeak: profilePeakArt.totals.maxQueuedJobs,
      activeJobsPeak: profilePeakArt.totals.maxActiveJobs,
      queuedJobsLimit: profilePeakArt.limits.queuedJobs,
      activeJobsLimit: profilePeakArt.limits.activeJobs,
    };

    await evaluate(sessionId,
      `window.__CF_SLICE__.api.__compendiumEvidence.trimArtNow('desktop')`, 'raise to desktop cap');
    for (const index of [0, 180, 360, 540, 720, 900, 1080, 1260, 1499]) {
      await scrollToIndex(sessionId, index);
    }
    const capBefore = await evaluate(sessionId,
      `window.__CF_SLICE__.api.compendiumDiagnostics().art`, 'pre-shrink diagnostics');
    const capAfter = await evaluate(sessionId,
      `window.__CF_SLICE__.api.__compendiumEvidence.trimArtNow('phone')`, 'phone cap shrink');
    const capShrink = {
      beforeEntries: capBefore.live.cacheEntries, afterEntries: capAfter.live.cacheEntries,
      phoneLimit: capAfter.limits.cacheEntries, afterDecodedBytes: capAfter.live.decodedBytes,
      phoneDecodedBytesLimit: capAfter.limits.decodedBytes,
      beforeDeviceClass: capBefore.deviceClass, afterDeviceClass: capAfter.deviceClass,
      disposalsDelta: capAfter.totals.disposals - capBefore.totals.disposals,
    };
    const capRestored = await evaluate(sessionId,
      `window.__CF_SLICE__.api.__compendiumEvidence.trimArtNow(${JSON.stringify(profile)})`,
      'restore profile device class');
    capShrink.restoredDeviceClass = capRestored.deviceClass;

    /* Reopen from the dock so final Close focus provenance belongs to the
       dock/rail opener rather than the earlier global search control. */
    await closeCompendium(sessionId);
    await openCompendium(sessionId);
    await waitListReady(sessionId, 1500);
    const closeBefore = await evaluate(sessionId, `(()=>{const a=window.__CF_SLICE__.api.compendiumDiagnostics().art;
      return {leases:a.live.leases,releases:a.totals.releases}})()`, 'pre-close ownership');
    await closeCompendium(sessionId);
    await waitPlanetsideReady(sessionId);
    const closeAfter = await evaluate(sessionId, `(()=>{const a=window.__CF_SLICE__.api.compendiumDiagnostics().art;
      return {leases:a.live.leases,releases:a.totals.releases}})()`, 'post-close ownership');
    const closed = await snapshot(sessionId, 'closed cleanup');
    const planetside = await snapshot(sessionId, 'Planetside');

    /* Lifecycle control for the shipped hidden-image leak class. This is not
       a reachability shortcut: the real Earth roster is already visible and
       measured above. The production Training CSS hides the retained strip;
       its MutationObserver must release leases and DOM decode sources, then
       reacquire the same roster when the class clears. */
    const lifecycleBefore = await evaluate(sessionId, `(()=>({
      hadTraining:document.body.classList.contains('training'),
      ids:[...document.querySelectorAll('#planetside [data-cid]')].map(e=>e.dataset.cid)
    }))()`, 'Planetside lifecycle precondition');
    assert(lifecycleBefore.hadTraining === false,
      `${profile}: Planetside lifecycle control cannot borrow an existing training class`);
    await evaluate(sessionId, `(()=>{document.body.classList.add('training');return true})()`,
      'hide Planetside lifecycle control');
    const hiddenPlanetside = await waitValue(sessionId, 'hidden Planetside release', `(()=>{const d=window.__CF_SLICE__.api.compendiumDiagnostics();
      const images=[...document.querySelectorAll('#planetside [data-sel="planetside-sp"] img')].map(img=>({
        logicalId:img.closest('[data-cid]')?.dataset.cid||'',srcPresent:!!img.getAttribute('src'),
        visualKeyPresent:!!img.dataset.visualKey,thumbState:img.dataset.thumbState||'unbound'}));
      return getComputedStyle(document.getElementById('planetside')).display==='none'&&d.art.live.leases===0
        &&images.length>0&&images.every(i=>!i.srcPresent&&!i.visualKeyPresent&&i.thumbState==='released')
        ?{computedHidden:true,liveLeases:d.art.live.leases,images}:null})()`);
    await evaluate(sessionId, `(()=>{document.body.classList.remove('training');return true})()`,
      'reveal Planetside lifecycle control');
    await waitPlanetsideReady(sessionId);
    const revealedPlanetside = await evaluate(sessionId, `(()=>{const d=window.__CF_SLICE__.api.compendiumDiagnostics();return {
      liveLeases:d.art.live.leases,logicalIds:d.surfaces.planetside.logicalIds,
      images:[...document.querySelectorAll('#planetside [data-sel="planetside-sp"] img')].map(img=>({
        logicalId:img.closest('[data-cid]')?.dataset.cid||'',naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight}))}})()`,
      'revealed Planetside reacquisition');
    assert(stableJson(revealedPlanetside.logicalIds) === stableJson(lifecycleBefore.ids),
      `${profile}: Planetside lifecycle reveal changed the logical roster`);

    const warm = [];
    for (let cycle = 0; cycle < REQUIRED_WARM_CYCLES; cycle++) {
      await openCompendium(sessionId);
      await waitListReady(sessionId, 1500);
      await scrollToIndex(sessionId, 750);
      await scrollToIndex(sessionId, 1499);
      await closeCompendium(sessionId);
      await waitPlanetsideReady(sessionId);
      warm.push(await snapshot(sessionId, `warm cycle ${cycle + 1}`));
    }
    const lastProbe = await answerability(sessionId, `${profile}-last`);
    const lazyEnd = await snapshot(lazyTarget.sessionId, 'final lazy-control');
    const lazySpeciesResourcesEnd = await evaluate(lazyTarget.sessionId, `(()=>{const suffix=${JSON.stringify(`/${candidateSpeciesChunk.relativePath}`)};
      return performance.getEntriesByType('resource').map(entry=>entry.name)
        .filter(name=>{try{return new URL(name,location.href).pathname.endsWith(suffix)}catch{return false}})})()`,
    'final species-art resource absence');
    return {
      profile, viewport, reviewPacket,
      lazySpeciesResource: {
        path: candidateSpeciesChunk.relativePath,
        sha256: candidateSpeciesChunk.sha256,
        matches: lazySpeciesResources,
        endMatches: lazySpeciesResourcesEnd,
      },
      fixture: {
        count: fixture.count, uniqueLogicalIds: new Set(fixture.rows.map(([id]) => id)).size,
        uniqueCompleteGenomes: new Set(fixture.rows.map(([, entry]) => stableJson(entry.g))).size,
        rowsSha256: fixture.rowsSha256,
        sameSeedShared: fixture.rows[0][1].g.seed === fixture.rows[1][1].g.seed,
        sameSeedCompleteDistinct: stableJson(fixture.rows[0][1].g) !== stableJson(fixture.rows[1][1].g),
      },
      documentTokens: {
        lazy: lazyBoot.diagnostics.documentToken, lazyEnd: lazyEnd.diagnostics.documentToken,
        main: initial.diagnostics.documentToken,
      },
      targets, identity,
      phases: {
        dedupe: { before: dedupeBefore, after: dedupeAfter, dedupeHitsDelta: dedupeAfter - dedupeBefore },
        churn: { before: churnBefore, after: churnAfter, jobCancelsDelta: churnAfter - churnBefore },
        backNavigation: {
          before: backAnchorBefore, after: backAnchorAfter, afterSettled: backAnchorSettled,
        },
        viewportResize: {
          base: resizeBase, expanded: resizeExpanded,
          contracted: resizeContracted, restored: resizeRestored,
        },
        keyboardTraversal,
        jobPeaks,
        producerErrorWitness,
        filterTransitions,
        close: {
          beforeLeases: closeBefore.leases, afterLeases: closeAfter.leases,
          releasesDelta: closeAfter.releases - closeBefore.releases,
        },
        planetsideLifecycle: { hidden: hiddenPlanetside, revealed: revealedPlanetside },
      },
      points: { lazyBoot, lazyEnd, initial, first, middle, last, filtered, detail, detailClosed, back,
        focusPinned, closed, planetside, warm, capShrink },
      answerability: [firstProbe, lastProbe],
    };
  } catch (caught) {
    const error = caught instanceof Error ? caught : new Error(String(caught));
    const command = isCandidateObservationError(error)
      ? error.command : error.compendiumCommand || null;
    const classification = isCandidateObservationError(error)
      ? error.classification : 'instrument';
    const partialProfile = {
      schema: PARTIAL_PROFILE_SCHEMA,
      profile,
      viewport,
      evidenceStatus: 'partial-non-certifying',
      lastCompletedStage,
      failingStage: currentStage,
      completedStages: [...completedStages],
      commandLedger: [...commandLedger],
      producerErrorWitness,
      filterTransitions,
      reviewPacket: [...reviewPacket],
    };
    error.compendiumPartialEvidence = {
      partialFailure: {
        schema: PARTIAL_FAILURE_SCHEMA,
        classification,
        profile,
        lastCompletedStage,
        failingStage: currentStage,
        command,
      },
      profile: partialProfile,
      reviewPacket: [...reviewPacket],
    };
    throw error;
  } finally {
    await disposeAll();
  }
}

function findCandidateSpeciesChunk(candidateDist) {
  const files = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) {
        throw new Error(`candidate build contains an unsupported symlink: ${file}`);
      }
      if (entry.isDirectory()) visit(file);
      else if (entry.isFile() && entry.name.endsWith('.js')) files.push(file);
    }
  };
  visit(candidateDist);
  const semantic = files.filter((file) => {
    const source = fs.readFileSync(file, 'utf8');
    return source.includes('cf-v2-species-art-diagnostics/v1')
      && source.includes('provisional-candidate')
      && source.includes('leaseThumb') && source.includes('speciesArtDiagnostics');
  });
  assert(semantic.length === 1,
    `candidate build must expose one semantically identifiable species-art executable; found ${semantic.length}`);
  const relativePath = path.relative(candidateDist, semantic[0]).split(path.sep).join('/');
  assert(relativePath && !relativePath.startsWith('../') && !path.posix.isAbsolute(relativePath),
    `candidate species-art path escaped the build: ${relativePath}`);
  return Object.freeze({ relativePath, sha256: hashFile(semantic[0]) });
}

function findBrokenBaselineSpeciesChunk(baselineDist) {
  const files = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (entry.isFile() && entry.name.endsWith('.js')) files.push(file);
    }
  };
  visit(baselineDist);
  const named = files.filter((file) => /speciesart/i.test(path.basename(file)));
  const semantic = files.filter((file) => {
    const source = fs.readFileSync(file, 'utf8');
    return source.includes('speciesThumb') && source.includes('speciesPortrait');
  });
  const candidates = named.length === 1 ? named : semantic;
  assert(candidates.length === 1,
    `broken baseline build must expose one identifiable species-art chunk; found ${candidates.length}`);
  return path.basename(candidates[0]);
}

function brokenBaselineInputs(baselineRoot, baselineDist, fixture, projection,
  currentSource, baselineSource) {
  const baselineV2 = path.join(baselineRoot, 'port', 'v2');
  const speciesChunk = findBrokenBaselineSpeciesChunk(baselineDist);
  return {
    schema: 'cf-v2-compendium-broken-baseline-input/v1',
    collectorCommit: currentSource.commit,
    collectorWorkingTreeSha256: currentSource.workingTreeSha256,
    baselineCommit: baselineSource.commit,
    baselineWorkingTreeSha256: baselineSource.workingTreeSha256,
    fixtureRowsSha256: fixture.rowsSha256,
    baselineProjectionSchema: projection.schema,
    baselineProjectionCount: projection.count,
    baselineProjectionRowsSha256: projection.rowsSha256,
    baselineProjectionRekeys: projection.rekeys,
    fixtureGeneratorSha256: hashFile(fixtureToolPath),
    collectorSha256: hashFile(collectorPath),
    contractSha256: hashFile(contractPath),
    baselinePackageLockSha256: hashFile(path.join(baselineV2, 'package-lock.json')),
    baselineIndexSha256: hashFile(path.join(baselineRoot, 'port', 'v2', 'apps', 'game', 'index.html')),
    speciesChunk,
    speciesChunkSha256: hashFile(path.join(baselineDist, 'assets', speciesChunk)),
    thumbObserverSchema: BROKEN_BASELINE_THUMB_OBSERVER_SCHEMA,
    thumbCacheCap: BROKEN_BASELINE_THUMB_CACHE_CAP,
    portraitCacheCaps: BROKEN_BASELINE_PORTRAIT_CACHE_CAPS,
  };
}

async function collectBrokenBaselineProfile({
  profile, viewport, fixture, browser, origin, veteranRaw, speciesChunk,
}) {
  const send = browser.send;
  let browserContextId = null;
  let sessionId = null;
  const evaluate = async (expression, label, {
    timeoutMs = BASELINE_OBSERVATION_TIMEOUT_MS,
  } = {}) => {
    const result = await send('Runtime.evaluate', {
      expression, returnByValue: true, awaitPromise: true,
    }, sessionId, { timeoutMs });
    if (result.exceptionDetails) {
      const detail = result.exceptionDetails.exception?.description
        || result.exceptionDetails.text || 'unknown exception';
      throw new Error(`${profile} broken baseline ${label}: page evaluation threw (${detail})`);
    }
    return result.result.value;
  };
  const waitValue = async (label, expression, timeoutMs = 180000) => {
    const deadline = performance.now() + timeoutMs;
    let last = null;
    while (performance.now() < deadline) {
      const commandTimeoutMs = remainingCommandTimeoutMs(
        deadline, performance.now(), BASELINE_OBSERVATION_TIMEOUT_MS,
      );
      if (commandTimeoutMs === null) break;
      last = await evaluate(expression, label, { timeoutMs: commandTimeoutMs });
      const completedAt = performance.now();
      if (phaseObservationAccepted(deadline, completedAt, last)) return last;
      const sleepMs = remainingCommandTimeoutMs(deadline, completedAt, 50);
      if (sleepMs === null) break;
      await sleep(sleepMs);
    }
    throw new Error(`${profile} broken baseline ${label}: timed out (${JSON.stringify(last)})`);
  };
  const click = async (selector, label) => {
    const point = await waitValue(`${label} target`, `(()=>{const e=[...document.querySelectorAll(${JSON.stringify(selector)})]
      .find(x=>{const r=x.getBoundingClientRect(),s=getComputedStyle(x);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'});
      if(!e)return null;const r=e.getBoundingClientRect();return {x:(r.left+r.right)/2,y:(r.top+r.bottom)/2}})()`);
    await send('Input.dispatchMouseEvent', {
      type: 'mousePressed', x: point.x, y: point.y, button: 'left', clickCount: 1,
    }, sessionId, { timeoutMs: BASELINE_OBSERVATION_TIMEOUT_MS });
    await send('Input.dispatchMouseEvent', {
      type: 'mouseReleased', x: point.x, y: point.y, button: 'left', clickCount: 1,
    }, sessionId, { timeoutMs: BASELINE_OBSERVATION_TIMEOUT_MS });
  };
  const snapshot = async (label) => {
    try {
      await send('HeapProfiler.collectGarbage', {}, sessionId,
        { timeoutMs: BASELINE_OBSERVATION_TIMEOUT_MS });
    } catch { /* Runtime heap remains mandatory */ }
    await evaluate(`new Promise(resolve=>requestAnimationFrame(()=>resolve(true)))`, `${label} animation task`);
    const raw = await evaluate(`(()=>{const rows=[...document.querySelectorAll('#codexpanel [data-sel="codex-entry"]')];
      const imgs=rows.map(row=>row.querySelector('img')).filter(Boolean);
      const sourceInstances=imgs.map(img=>img.getAttribute('src')||'');
      const sources=[...new Set(sourceInstances.filter(Boolean))];
      const portraitCacheCap=${BROKEN_BASELINE_PORTRAIT_CACHE_CAPS[profile]};
      const thumbCacheDomSources=sourceInstances.filter((src,index)=>src
        &&imgs[index]?.naturalWidth===132&&imgs[index]?.naturalHeight===132);
      const portraitCacheSources=sourceInstances.filter((src,index)=>src
        &&imgs[index]?.naturalWidth===440&&imgs[index]?.naturalHeight===440).slice(-portraitCacheCap);
      const thumb=window.__CF_COMPENDIUM_BASELINE_THUMBS__;
      return {mountedRows:rows.length,imageCount:imgs.length,naturalWidths:imgs.map(img=>img.naturalWidth),
        naturalHeights:imgs.map(img=>img.naturalHeight),distinctSources:sources.length,
        sourceInstanceCount:sourceInstances.filter(Boolean).length,
        dataImageCount:sourceInstances.filter(src=>src.startsWith('data:image/')).length,
        distinctSourceEncodedBytes:sources.reduce((n,src)=>n+new TextEncoder().encode(src).byteLength,0),
        sourceInstanceEncodedBytes:sourceInstances.reduce((n,src)=>n+new TextEncoder().encode(src).byteLength,0),
        referencedPixels:imgs.reduce((n,img)=>n+img.naturalWidth*img.naturalHeight,0),
        thumbRenderCompletions:thumb?.initialListCompletions||0,
        modeledThumbCacheEntries:thumb?.initialListCacheEncodedByteLengths?.length||0,
        thumbCacheEncodedBytes:(thumb?.initialListCacheEncodedByteLengths||[]).reduce((n,value)=>n+value,0),
        thumbObserverTotalExact132Completions:thumb?.totalExact132Completions||0,
        thumbObserverPreOwnerExact132Completions:thumb?.preOwnerExact132Completions,
        thumbObserverErrors:thumb?.observerErrors,
        thumbObserverDescriptorPreserved:thumb?.descriptorPreserved===true,
        thumbObserverStableQuietMs:thumb?.initialListStableQuietMs,
        renderStartThumbCacheEntries:thumbCacheDomSources.length,
        renderStartThumbCacheEncodedBytes:thumbCacheDomSources.reduce(
          (n,src)=>n+new TextEncoder().encode(src).byteLength,0),
        modeledPortraitCacheEntries:portraitCacheSources.length,
        modeledPortraitCacheEncodedBytes:portraitCacheSources.reduce((n,src)=>n+new TextEncoder().encode(src).byteLength,0)}})()`, `${label} raw DOM`);
    const heap = await send('Runtime.getHeapUsage', {}, sessionId,
      { timeoutMs: BASELINE_OBSERVATION_TIMEOUT_MS });
    const dom = await send('Memory.getDOMCounters', {}, sessionId,
      { timeoutMs: BASELINE_OBSERVATION_TIMEOUT_MS });
    return { raw, heap, dom };
  };
  try {
    const context = await send('Target.createBrowserContext');
    browserContextId = context.browserContextId;
    const target = await send('Target.createTarget', { url: 'about:blank', browserContextId });
    const attached = await send('Target.attachToTarget', { targetId: target.targetId, flatten: true });
    sessionId = attached.sessionId;
    await send('Runtime.enable', {}, sessionId);
    await send('Page.enable', {}, sessionId);
    await send('HeapProfiler.enable', {}, sessionId);
    const emulation = compendiumProfileEmulationOptions(profile, viewport);
    await send('Emulation.setDeviceMetricsOverride', emulation.deviceMetrics, sessionId);
    await send('Emulation.setTouchEmulationEnabled', emulation.touch, sessionId);
    await send('Page.navigate', { url: `${origin}/__compendiummem_seed__.html` }, sessionId);
    await waitValue('seed document', `document.readyState==='complete'?'ready':null`, 20000);
    const seeded = await evaluate(`(async()=>{const stores=${JSON.stringify(STORES)},raw=${JSON.stringify(veteranRaw)};
      const db=await new Promise((resolve,reject)=>{const q=indexedDB.open('cf-v2-slice',1);
        q.onupgradeneeded=()=>{for(const s of stores)if(!q.result.objectStoreNames.contains(s))q.result.createObjectStore(s)};
        q.onerror=()=>reject(q.error);q.onblocked=()=>reject(new Error('seed IDB blocked'));q.onsuccess=()=>resolve(q.result)});
      await new Promise((resolve,reject)=>{const tx=db.transaction('meta','readwrite');tx.objectStore('meta').put(raw,'save');
        tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('seed IDB aborted'))});
      db.close();return new TextEncoder().encode(raw).byteLength})()`, 'seed 1,500-row save');
    assert(seeded === Buffer.byteLength(veteranRaw), `${profile}: broken-baseline save byte count drifted`);
    const observerSource = `(${installBrokenBaselineThumbObserver.toString()})(
      window,HTMLCanvasElement,TextEncoder,performance,
      ${JSON.stringify(BROKEN_BASELINE_THUMB_OBSERVER_SCHEMA)},${BROKEN_BASELINE_THUMB_CACHE_CAP});`;
    const observerInstall = await send('Page.addScriptToEvaluateOnNewDocument', {
      source: observerSource,
    }, sessionId, { timeoutMs: BASELINE_OBSERVATION_TIMEOUT_MS });
    assert(typeof observerInstall?.identifier === 'string' && observerInstall.identifier,
      `${profile}: pre-document broken-baseline thumb observer was not registered`);
    await send('Page.navigate', { url: `${origin}/` }, sessionId);
    await waitValue('app readiness', `(()=>{const s=window.__CF_SLICE__?.api?.state?.();return s?.codexCount===1500?s:null})()`, 30000);

    /* The exact pre-Arc1A build owns a boot idle callback that imports the
       species chunk without any consumer. Observe the actual resource before
       opening Compendium; do not infer this fault from source prose. */
    const eagerResource = await waitValue('idle eager species import', `(()=>performance.getEntriesByType('resource')
      .map(entry=>entry.name).find(name=>name.endsWith('/${speciesChunk}'))||null)()`, 15000);
    const preOwnerThumbObservation = await waitValue('stable pre-owner thumb observation',
      `(()=>{const state=window.__CF_COMPENDIUM_BASELINE_THUMBS__;
        return state?.schema===${JSON.stringify(BROKEN_BASELINE_THUMB_OBSERVER_SCHEMA)}
          &&state.descriptorPreserved===true&&state.observerErrors===0
          &&performance.now()-state.lastCompletionAt>=1000
          ?{total:state.totalExact132Completions,quietMs:performance.now()-state.lastCompletionAt}:null})()`,
    30000);
    const thumbPhase = await evaluate(`(()=>{const state=window.__CF_COMPENDIUM_BASELINE_THUMBS__;
      if(!state||state.phase!=='pre-owner')return null;
      state.preOwnerExact132Completions=state.totalExact132Completions;
      state.initialListCompletions=0;state.initialListCacheEncodedByteLengths.length=0;
      state.phase='initial-list';state.lastCompletionAt=performance.now();
      return {phase:state.phase,preOwnerExact132Completions:state.preOwnerExact132Completions}})()`,
    'begin initial-list thumb observation');
    assert(thumbPhase?.phase === 'initial-list'
      && thumbPhase.preOwnerExact132Completions === preOwnerThumbObservation.total,
    `${profile}: initial-list thumb observer phase did not preserve the raw pre-owner count`);
    await click('#dockcodex,#railcodex', 'open Compendium');
    await waitValue('1,500 full list portraits', `(()=>{const rows=[...document.querySelectorAll('#codexpanel [data-sel="codex-entry"]')],imgs=rows.map(r=>r.querySelector('img')).filter(Boolean);
      return rows.length===1500&&imgs.length===1500&&imgs.every(img=>img.complete&&img.naturalWidth>0)?true:null})()`);
    await waitValue('stable initial-list thumb completions',
      `(()=>{const state=window.__CF_COMPENDIUM_BASELINE_THUMBS__;
        return state?.initialListCompletions>=1500
          &&performance.now()-state.lastCompletionAt>=1000
          ?{initialListCompletions:state.initialListCompletions,
            cacheEntries:state.initialListCacheEncodedByteLengths?.length,
            cacheEncodedBytes:(state.initialListCacheEncodedByteLengths||[]).reduce((n,value)=>n+value,0),
            totalExact132Completions:state.totalExact132Completions,
            observerErrors:state.observerErrors,descriptorPreserved:state.descriptorPreserved,
            quietMs:performance.now()-state.lastCompletionAt}:null})()`);
    const sealedThumbObservation = await evaluate(`(()=>{const state=window.__CF_COMPENDIUM_BASELINE_THUMBS__;
      if(state.phase!=='initial-list')return null;
      state.initialListStableQuietMs=performance.now()-state.lastCompletionAt;
      state.phase='post-initial-list';
      return {preOwnerExact132Completions:state.preOwnerExact132Completions,
        initialListCompletions:state.initialListCompletions,
        cacheEntries:state.initialListCacheEncodedByteLengths.length,
        cacheEncodedBytes:state.initialListCacheEncodedByteLengths.reduce((n,value)=>n+value,0),
        totalExact132Completions:state.totalExact132Completions,
        observerErrors:state.observerErrors,descriptorPreserved:state.descriptorPreserved,
        quietMs:state.initialListStableQuietMs}})()`,
    'seal initial-list thumb observation');
    assert(validBrokenBaselineThumbObservation(sealedThumbObservation),
      `${profile}: stable initial-list thumb completion/cache observation was not exact`);
    const list = await snapshot('full list');
    await click('#codexpanel [data-sel="codex-entry"]', 'open detail');
    await waitValue('detail 440 portrait', `(()=>{const img=document.querySelector('#codexpanel [data-sel="detail-portrait"]');
      return img?.complete&&img.naturalWidth===440&&img.naturalHeight===440?true:null})()`, 30000);
    const detail = await snapshot('detail');
    await click('#codexpanel [data-pnx="codex"]', 'close detail');
    const warm = [];
    for (let cycle = 0; cycle < REQUIRED_WARM_CYCLES; cycle++) {
      await click('#dockcodex,#railcodex', `warm open ${cycle + 1}`);
      await waitValue(`warm list ${cycle + 1}`, `(()=>{const rows=[...document.querySelectorAll('#codexpanel [data-sel="codex-entry"]')],imgs=rows.map(r=>r.querySelector('img')).filter(Boolean);
        return rows.length===1500&&imgs.length===1500&&imgs.every(img=>img.complete&&img.naturalWidth>0)?true:null})()`);
      warm.push(await snapshot(`warm ${cycle + 1}`));
      await click('#codexpanel [data-pnx="codex"]', `warm close ${cycle + 1}`);
    }
    const faults = brokenBaselineFaults({
      profile, list: list.raw, eagerResource, speciesChunk,
    });
    const cacheMetrics = brokenBaselineCacheMetrics(
      profile, list.raw, warm.map((point) => point.raw),
    );
    assert(cacheMetrics,
      `${profile}: exact broken-baseline thumb/portrait cache observation was incomplete`);
    const points = [list, detail, ...warm];
    const tail = warm.slice(-3);
    const maximum = (read) => Math.max(...points.map(read));
    const metricRange = (read) => Math.max(...tail.map(read)) - Math.min(...tail.map(read));
    const metrics = {
      mountedRows: maximum((point) => point.raw.mountedRows),
      heapUsedBytes: maximum((point) => point.heap.usedSize),
      documents: maximum((point) => point.dom.documents),
      nodes: maximum((point) => point.dom.nodes),
      jsEventListeners: maximum((point) => point.dom.jsEventListeners),
      liveCacheEntries: cacheMetrics.liveCacheEntries,
      /* Cache fields bind the exact source caps and the initial list's actual
         completion order. The 1,500 full-size DOM source instances, distinct
         resource bytes, and per-element referenced pixels stay in raw evidence
         and are deliberately not mislabeled as private cache residency. */
      liveDecodedPixels: cacheMetrics.liveDecodedPixels,
      liveDecodedBytes: cacheMetrics.liveDecodedBytes,
      liveEncodedBytes: cacheMetrics.liveEncodedBytes,
      /* The pinned build predates the lease/job scheduler entirely. Its eager
         synchronous 440px importer therefore has no queued/active job peaks. */
      queuedJobsPeak: cacheMetrics.queuedJobsPeak,
      activeJobsPeak: cacheMetrics.activeJobsPeak,
      liveLeases: cacheMetrics.liveLeases,
      liveSubscribers: cacheMetrics.liveSubscribers,
      livePortraitCacheEntries: cacheMetrics.livePortraitCacheEntries,
      livePortraitEncodedBytes: cacheMetrics.livePortraitEncodedBytes,
      warmHeapRangeBytes: metricRange((point) => point.heap.usedSize),
      warmDecodedBytesRange: cacheMetrics.warmDecodedBytesRange,
      warmEncodedBytesRange: cacheMetrics.warmEncodedBytesRange,
    };
    return {
      profile, viewport, metrics, observedFaults: faults,
      evidence: {
        eagerResource, speciesChunk, list: list.raw, detail: detail.raw,
        metricCarriers: {
          liveCacheEntries: 'max-initial-observed-and-warm-render-start-speciesThumbCache-entries',
          liveDecodedPixels: 'max-cache-entries-times-132x132-thumb-assets',
          liveDecodedBytes: 'modeled-thumb-decoded-pixels-times-four',
          liveEncodedBytes: 'max-initial-final-600-observed-and-warm-render-start-thumb-data-url-utf8-bytes',
          liveLeases: 'zero-no-lease-api-exists-at-3844701',
          liveSubscribers: 'zero-no-lease-subscriber-api-exists-at-3844701',
          warmDecodedBytesRange: 'last-three-render-start-132-cache-hit-count-times-132x132x4',
          warmEncodedBytesRange: 'last-three-render-start-132-cache-hit-data-url-utf8-byte-range',
          domReferencedPixels: 'per-element-natural-width-times-height-not-resident-memory',
          domDistinctSourceEncodedBytes: 'unique-full-portrait-dom-data-url-utf8-bytes',
        },
        thumbCacheModel: {
          source: 'exact-3844701-speciesThumbCache-successful-onload-insertion-order',
          point: 'initial-list-after-1500-observed-132x132-toDataURL-completions',
          observerInstalledBeforeAppModule: true,
          observerSchema: BROKEN_BASELINE_THUMB_OBSERVER_SCHEMA,
          preOwnerExact132Completions: preOwnerThumbObservation.total,
          totalExact132CompletionsAtInitialSeal: sealedThumbObservation.totalExact132Completions,
          stableQuietMs: sealedThumbObservation.quietMs,
          cap: BROKEN_BASELINE_THUMB_CACHE_CAP,
          entries: list.raw.modeledThumbCacheEntries,
          encodedBytes: list.raw.thumbCacheEncodedBytes,
          encodedByteBasis: 'utf8-data-url',
          warmRenderStart: warm.map((point) => ({
            entries: point.raw.renderStartThumbCacheEntries,
            encodedBytes: point.raw.renderStartThumbCacheEncodedBytes,
          })),
        },
        portraitCacheModel: {
          source: 'exact-3844701-private-lru-and-sequential-list-call-order',
          point: 'initial-list-after-sequential-1500-calls',
          cap: BROKEN_BASELINE_PORTRAIT_CACHE_CAPS[profile],
          initialListEntries: list.raw.modeledPortraitCacheEntries,
          initialListEncodedBytes: list.raw.modeledPortraitCacheEncodedBytes,
          encodedByteBasis: 'utf8-data-url',
        },
      },
    };
  } finally {
    if (sessionId) {
      try { await send('Target.detachFromTarget', { sessionId }); } catch { /* browser close remains authoritative */ }
    }
    if (browserContextId) {
      try { await send('Target.disposeBrowserContext', { browserContextId }); } catch { /* browser close remains authoritative */ }
    }
  }
}

async function runBrokenBaselineCalibration(baselineRootArgument) {
  const releaseLock = acquireWorkspaceLock('v2 Compendium paired broken-baseline evidence');
  const startedAt = new Date();
  const runId = reportRunId();
  const placeholderSource = unavailableSourceIdentity('baseline preflight not started');
  atomicWriteJson(baselineReportPath, {
    schema: 'cf-v2-compendium-broken-baseline-report/v1', status: 'running', runId,
    startedAt: startedAt.toISOString(), endedAt: null,
    policy: {
      attemptCount: 1, automaticRetries: 0,
      observationTimeoutMs: BASELINE_OBSERVATION_TIMEOUT_MS,
    },
    collectorSource: { begin: placeholderSource, end: placeholderSource },
    baselineSource: { begin: placeholderSource, end: placeholderSource },
    findings: [], profiles: {},
  });
  let browser = null;
  let server = null;
  let collectorBegin = placeholderSource;
  let baselineBegin = placeholderSource;
  let baselineRoot = null;
  let inputs = null;
  let inputDigest = null;
  const measurements = [];
  try {
    collectorBegin = sourceIdentity();
    assert(collectorBegin.state === 'committed',
      'broken-baseline collection requires the current collector tree to be clean and committed');
    baselineRoot = fs.realpathSync(path.resolve(baselineRootArgument));
    assert(baselineRoot !== fs.realpathSync(repoRoot),
      'broken baseline must be an isolated detached worktree, not the active source worktree');
    baselineBegin = sourceIdentity(baselineRoot, { checkCiEnvironment: false });
    assert(baselineBegin.state === 'committed', 'broken-baseline worktree must be clean');
    assert(baselineBegin.commit === BROKEN_BASELINE_COMMIT,
      `broken-baseline worktree must be exact ${BROKEN_BASELINE_COMMIT}; got ${baselineBegin.commit}`);
    const fixture = buildCompendiumFixture();
    const projection = buildBrokenBaselineProjection(fixture);
    const budget = readJson(budgetPath);
    const budgetValidation = validateBudgetRecord(
      budget, fixture.rowsSha256, projection.rowsSha256,
    );
    assert(budgetValidation.ok, `budget record invalid: ${budgetValidation.errors.join('; ')}`);
    assert(budget.pairedBrokenBaseline.commit === BROKEN_BASELINE_COMMIT,
      'budget baseline commit does not match the executable adapter commit');
    const baselineV2 = path.join(baselineRoot, 'port', 'v2');
    const baselineApp = path.join(baselineV2, 'apps', 'game');
    const baselineDist = path.join(baselineApp, 'dist');
    const vite = path.join(baselineV2, 'node_modules', '.bin', process.platform === 'win32' ? 'vite.cmd' : 'vite');
    assert(fs.existsSync(vite),
      `baseline dependencies are missing; run npm ci in ${baselineV2} before collection`);
    execFileSync(vite, ['build'], { cwd: baselineApp, stdio: 'inherit' });
    inputs = brokenBaselineInputs(
      baselineRoot, baselineDist, fixture, projection, collectorBegin, baselineBegin,
    );
    inputDigest = sha256(stableJson(inputs));
    server = await serveDist(baselineDist);
    browser = await openChromiumCdp(compendiumCdpOptions('baseline', {
      label: 'Compendium exact-3844701 broken-baseline gate',
      userDataPrefix: 'cf-compendiummem-baseline', startupTimeoutMs: 15000,
    }));
    const saveFixtures = readJson(baselineSavePath);
    const rawSave = structuredClone(saveFixtures.inputs.veteran_rich);
    rawSave.codex = projection.codex;
    const veteranRaw = JSON.stringify(rawSave);
    for (const [profile, viewport] of Object.entries(PROFILES)) {
      measurements.push(await collectBrokenBaselineProfile({
        profile, viewport, fixture, browser, origin: server.origin, veteranRaw,
        speciesChunk: inputs.speciesChunk,
      }));
    }
    const expectedFaults = [...budget.pairedBrokenBaseline.expectedFaults].sort();
    for (const measurement of measurements) {
      assert(stableJson([...measurement.observedFaults].sort()) === stableJson(expectedFaults),
        `${measurement.profile} broken baseline did not exhibit every sealed fault; observed ${measurement.observedFaults.join(', ')}`);
    }
    const collectorEnd = sourceIdentity();
    const baselineEnd = sourceIdentity(baselineRoot, { checkCiEnvironment: false });
    assert(sameSourceIdentity(collectorBegin, collectorEnd),
      'collector source changed during broken-baseline measurement');
    assert(sameSourceIdentity(baselineBegin, baselineEnd),
      '3844701 worktree changed during broken-baseline measurement');
    const endedAt = new Date();
    const browserSample = sampleBrowser(browser.browser);
    const samples = Object.fromEntries(measurements.map((measurement) => [measurement.profile, {
      runId, commit: baselineBegin.commit, workingTreeDigest: baselineBegin.workingTreeSha256,
      inputDigest, sourceState: baselineBegin.state, sourceChanged: false,
      fixtureRowsSha256: fixture.rowsSha256, measuredAt: endedAt.toISOString(),
      browser: browserSample, metrics: measurement.metrics,
      observedFaults: measurement.observedFaults,
    }]));
    const samplePath = calibrationPathFor(runId, 'baseline');
    const report = {
      schema: 'cf-v2-compendium-broken-baseline-report/v1', status: 'measured', runId,
      startedAt: startedAt.toISOString(), endedAt: endedAt.toISOString(),
      durationMs: endedAt.getTime() - startedAt.getTime(),
      policy: {
        attemptCount: 1, automaticRetries: 0,
        observationTimeoutMs: BASELINE_OBSERVATION_TIMEOUT_MS,
      },
      collectorSource: { begin: collectorBegin, end: collectorEnd },
      baselineSource: { begin: baselineBegin, end: baselineEnd },
      inputs, inputDigest, browser: browser.browser,
      findings: [], profiles: Object.fromEntries(measurements.map((m) => [m.profile, m])),
      samplePath: path.relative(repoRoot, samplePath),
    };
    atomicWriteJson(samplePath, {
      schema: 'cf-v2-compendium-memory-baseline-sample/v1',
      status: 'paired-broken-baseline-observation-not-a-budget', runId,
      budgetAuthority: {
        collectorCommit: collectorBegin.commit,
        projectionRowsSha256: projection.rowsSha256,
      },
      collectorSource: report.collectorSource, baselineSource: report.baselineSource,
      inputs, inputDigest, browser: browser.browser,
      fixture: {
        schema: fixture.schema, generator: fixture.generator,
        count: fixture.count, rowsSha256: fixture.rowsSha256,
      }, baselineProjection: {
        schema: projection.schema, sourceRowsSha256: projection.sourceRowsSha256,
        count: projection.count, uniqueSeeds: projection.uniqueSeeds,
        rowsSha256: projection.rowsSha256, rekeys: projection.rekeys,
      }, samples,
    });
    atomicWriteJson(baselineReportPath, report);
    console.log(`COMPENDIUM BROKEN BASELINE: MEASURED — ${runId}`);
    console.log(`  exact ${BROKEN_BASELINE_COMMIT} samples: ${samplePath}`);
    return 0;
  } catch (error) {
    const endedAt = new Date();
    const partialEvidence = brokenBaselineFailureEvidence(measurements);
    const report = {
      schema: 'cf-v2-compendium-broken-baseline-report/v1', status: 'instrument-fail', runId,
      startedAt: startedAt.toISOString(), endedAt: endedAt.toISOString(),
      durationMs: endedAt.getTime() - startedAt.getTime(),
      policy: {
        attemptCount: 1, automaticRetries: 0,
        observationTimeoutMs: BASELINE_OBSERVATION_TIMEOUT_MS,
      },
      collectorSource: { begin: collectorBegin, end: collectorBegin },
      baselineSource: { begin: baselineBegin, end: baselineBegin },
      inputs, inputDigest, browser: browser?.browser || null,
      evidenceStatus: partialEvidence.evidenceStatus,
      findings: [`instrument: ${error.message}`],
      profiles: partialEvidence.profiles,
    };
    atomicWriteJson(baselineReportPath, report);
    console.error(`COMPENDIUM BROKEN BASELINE: INSTRUMENT-FAIL — ${runId}`);
    console.error(`  ${error.message}`);
    return 2;
  } finally {
    try { if (browser) await browser.close(); } finally {
      try { if (server) await server.close(); } finally { releaseLock(); }
    }
  }
}

async function runGate({ calibrate }) {
  const releaseLock = acquireWorkspaceLock('v2 Compendium memory/resource evidence');
  const startedAt = new Date();
  const runId = reportRunId();
  let sourceBegin = unavailableSourceIdentity('source identity not read yet');
  let sourceRead = false;
  let inputs = unavailableInputs('preflight not started');
  let budget = { status: 'unavailable' };
  let fixture = null;
  let inputDigest = null;
  let running = makeRunningReport({ runId, startedAt, source: sourceBegin, inputs, budget });
  atomicWriteJson(reportPath, running);
  let browser = null;
  let server = null;
  const measurements = [];
  let gateStage = 'preflight';
  try {
    gateStage = 'fixture and input provenance';
    fixture = buildCompendiumFixture();
    const projection = buildBrokenBaselineProjection(fixture);
    inputs = exactInputs(fixture);
    inputDigest = sha256(stableJson(inputs));
    budget = readJson(budgetPath);
    sourceBegin = sourceIdentity();
    sourceRead = true;
    running = makeRunningReport({ runId, startedAt, source: sourceBegin, inputs, budget });
    atomicWriteJson(reportPath, running);
    if (sourceBegin.state !== 'committed') {
      throw new Error('Compendium evidence requires a clean committed source tree before build/browser launch');
    }
    const budgetValidation = validateBudgetRecord(
      budget, fixture.rowsSha256, projection.rowsSha256,
    );
    if (!budgetValidation.ok) {
      throw new Error(`budget record invalid: ${budgetValidation.errors.join('; ')}`);
    }
    if (!calibrate && budget.status !== 'active') {
      throw new Error('numeric Compendium budget is calibration-required; certification refuses to launch a browser');
    }
    gateStage = 'candidate build';
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    execFileSync(npm, ['exec', 'vite', 'build'], { cwd: appDir, stdio: 'inherit' });
    const candidateSpeciesChunk = findCandidateSpeciesChunk(distDir);
    gateStage = 'candidate server and browser launch';
    server = await serveDist();
    browser = await openChromiumCdp(compendiumCdpOptions('candidate', {
      label: CANDIDATE_BROWSER_LABEL, userDataPrefix: 'cf-compendiummem',
      startupTimeoutMs: 15000,
    }));
    const saveFixtures = readJson(baselineSavePath);
    const veteranRaw = JSON.stringify(saveFixtures.inputs.veteran_rich);
    for (const [profile, viewport] of Object.entries(PROFILES)) {
      gateStage = `${profile} profile collection`;
      measurements.push(await collectProfile({
        profile, viewport, fixture, browser, origin: server.origin, veteranRaw, runId,
        candidateSpeciesChunk,
      }));
    }
    gateStage = 'sealed outcome evaluation';
    const evaluatorBudget = calibrate ? calibrationCeilings() : budget;
    const outcomes = measurements.flatMap((measurement) =>
      evaluateProfile(measurement, evaluatorBudget, fixture));
    const failed = outcomes.filter((outcome) => outcome.status === 'fail');
    const sourceEnd = sourceIdentity();
    if (!sameSourceIdentity(sourceBegin, sourceEnd)) {
      throw new Error('source identity changed during the build/browser run; mixed-source evidence refused');
    }
    const endedAt = new Date();
    const status = failed.length ? 'fail' : calibrate ? 'calibration' : 'pass';
    const report = {
      ...running, status, endedAt: endedAt.toISOString(),
      durationMs: endedAt.getTime() - startedAt.getTime(),
      source: { begin: sourceBegin, end: sourceEnd }, browser: browser.browser,
      outcomes, findings: failed.map((outcome) => outcome.diagnosis),
      profiles: Object.fromEntries(measurements.map((measurement) => [measurement.profile, measurement])),
      reviewPacket: measurements.flatMap((measurement) => measurement.reviewPacket),
      partialFailure: null, blockedOutcomes: [],
    };
    atomicWriteJson(reportPath, report);
    const verification = verifyTerminalReport(report, runId, {
      allowCalibration: calibrate, verifyArtifact: verifyReviewArtifact,
    });
    if (!verification.ok) throw new Error(`terminal report verification failed: ${verification.errors.join('; ')}`);
    if (calibrate && !failed.length) {
      const calibrationPath = calibrationPathFor(runId);
      const browserSample = sampleBrowser(browser.browser);
      const samples = Object.fromEntries(measurements.map((measurement) => [measurement.profile, {
        runId, commit: sourceBegin.commit, workingTreeDigest: sourceBegin.workingTreeSha256,
        inputDigest, sourceState: sourceBegin.state, sourceChanged: false,
        fixtureRowsSha256: fixture.rowsSha256,
        measuredAt: endedAt.toISOString(), browser: browserSample,
        metrics: calibrationMetrics(measurement),
      }]));
      atomicWriteJson(calibrationPath, {
        schema: 'cf-v2-compendium-memory-calibration-sample/v1',
        status: 'candidate-observation-not-a-budget', runId,
        source: { begin: sourceBegin, end: sourceEnd }, inputs, inputDigest,
        browser: browser.browser, fixture: {
          schema: fixture.schema, generator: fixture.generator,
          count: fixture.count, rowsSha256: fixture.rowsSha256,
        }, samples,
      });
      console.log(`  candidate measurements: ${calibrationPath}`);
    }
    console.log(`COMPENDIUM MEMORY: ${status.toUpperCase()} — ${runId}`);
    if (failed.length) {
      for (const finding of failed.slice(0, 8)) console.error(`  - ${finding.diagnosis}`);
      if (failed.length > 8) console.error(`  - ${failed.length - 8} more outcome(s); see ${reportPath}`);
    } else if (calibrate) {
      console.log('  no PASS was emitted; three independent runs/profile plus the paired 3844701 baseline are required');
    }
    return status === 'pass' || status === 'calibration' ? 0 : 1;
  } catch (caught) {
    const error = caught instanceof Error ? caught : new Error(String(caught));
    const endedAt = new Date();
    let sourceEnd = sourceBegin;
    if (sourceRead) {
      try { sourceEnd = sourceIdentity(); }
      catch (sourceError) {
        sourceEnd = unavailableSourceIdentity(sourceError.message);
      }
    }
    const partial = error.compendiumPartialEvidence || null;
    const classification = partial?.partialFailure?.classification === 'product-unanswerable'
      ? 'product-unanswerable' : 'instrument';
    const status = classification === 'product-unanswerable'
      ? 'product-unanswerable' : 'instrument-fail';
    const partialFailure = partial?.partialFailure || {
      schema: PARTIAL_FAILURE_SCHEMA,
      classification: 'instrument',
      profile: null,
      lastCompletedStage: null,
      failingStage: gateStage,
      command: null,
    };
    const profiles = Object.fromEntries(measurements.map((measurement) =>
      [measurement.profile, measurement]));
    if (partial?.profile) profiles[partial.profile.profile] = partial.profile;
    const reviewPacket = [
      ...measurements.flatMap((measurement) => measurement.reviewPacket),
      ...(partial?.reviewPacket || []),
    ];
    const report = {
      ...running, status, endedAt: endedAt.toISOString(),
      durationMs: endedAt.getTime() - startedAt.getTime(),
      source: { begin: sourceBegin, end: sourceEnd }, browser: browser?.browser || null,
      outcomes: [], findings: [`${classification === 'product-unanswerable' ? 'product' : 'instrument'}: ${error.message}`],
      profiles, reviewPacket, partialFailure, blockedOutcomes: [...EXPECTED_OUTCOMES],
    };
    atomicWriteJson(reportPath, report);
    console.error(`COMPENDIUM MEMORY: ${status.toUpperCase()} — ${runId}`);
    console.error(`  ${error.message}`);
    return status === 'product-unanswerable' ? 1 : 2;
  } finally {
    try { if (browser) await browser.close(); } finally {
      try { if (server) await server.close(); } finally { releaseLock(); }
    }
  }
}

async function main() {
  if (process.argv.length === 3 && process.argv[2] === SELFTEST_FLAG) {
    const { runCompendiumMemSelftest } = await import('./compendiummem-selftest.mjs');
    await runCompendiumMemSelftest();
    return 0;
  }
  const verifyArg = process.argv.slice(2).find((arg) => arg.startsWith('--verify-run='));
  if (verifyArg && process.argv.length === 3) {
    const expectedRunId = verifyArg.slice('--verify-run='.length);
    assert(/^[a-z0-9][a-z0-9-]{0,95}$/i.test(expectedRunId), 'verify run ID is invalid');
    const report = readJson(reportPath);
    const verification = verifyTerminalReport(report, expectedRunId, {
      allowCalibration: false, verifyArtifact: verifyReviewArtifact,
    });
    if (!verification.ok) {
      for (const error of verification.errors) console.error(`COMPENDIUM MEMORY VERIFY: ${error}`);
      return 2;
    }
    console.log(`COMPENDIUM MEMORY VERIFY: ${report.status.toUpperCase()} — ${expectedRunId}`);
    return report.status === 'pass' ? 0 : 1;
  }
  const baselineArg = process.argv.slice(2)
    .find((arg) => arg.startsWith('--calibrate-baseline='));
  if (baselineArg && process.argv.length === 3) {
    const baselineRoot = baselineArg.slice('--calibrate-baseline='.length);
    assert(path.isAbsolute(baselineRoot), '--calibrate-baseline requires an absolute isolated worktree path');
    return await runBrokenBaselineCalibration(baselineRoot);
  }
  const calibrate = process.argv.length === 3 && process.argv[2] === '--calibrate';
  if (process.argv.length !== (calibrate ? 3 : 2)) {
    console.error('usage: node tools/compendiummem.mjs [--calibrate|--calibrate-baseline=/absolute/clean/3844701-worktree|--selftest|--verify-run=<run-id>]');
    return 2;
  }
  return await runGate({ calibrate });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  void main().then(
    (exitCode) => { process.exitCode = exitCode; },
    (error) => { console.error(`COMPENDIUM MEMORY: ${error.message}`); process.exitCode = 2; },
  );
}
