#!/usr/bin/env node
/* Arc 1C scene Canvas/Pixi memory plateau probe.

   This is deliberately standalone. It reuses the repository's owned raw-CDP
   launcher, browser resolver, workspace lock, deterministic Compendium fixture,
   and static-server conventions without changing Arc 1A's hashed collector.

   Assumptions kept explicit:
   - "phone" is the existing evidence profile: 390x844, DPR 3, mobile/touch.
   - "desktop" is 1280x800, DPR 1.
   - four unmeasured warm-up cycles fill the exact route's intentional caches;
     four following cycles must reproduce its settled inventory and peaks.
   - Chromium exposes no portable true GPU-byte counter. Product-owned decoded
     pixels and Pixi managed TextureSource pixels are therefore named proxies.
   - The route ends with the implemented static Shipyard. Its visible opener,
     exact visual-state projection, single preview, owned close, and zero-retain
     settlement are product outcomes rather than collector shortcuts.
   - --calibrate records non-certifying observations. A normal run requires an
     exact, tracked --budget and delegates every semantic verdict to the
     browser-free scenemem contract; this collector has no parallel pass logic.

   Usage:
     node tools/scenemem.mjs --calibrate [--allow-dirty]
     node tools/scenemem.mjs --budget=/absolute/path/to/tracked-budget.json
     node tools/scenemem.mjs --verify-run=<run-id> [--budget=/same/file.json]

   One process owns one build, one browser launch, two profiles, no retry, and a
   RUNNING -> terminal report at apps/game/smoke/scenemem-report.json.
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
  COMPENDIUM_FIXTURE_SPEC_PATH,
  buildCompendiumFixture,
  stableJson,
} from './compendiummem-fixture.mjs';
import {
  evaluateSceneMemory,
  SCENE_MEMORY_CYCLE_COUNT,
  SCENE_MEMORY_ROUTES,
} from './scenemem-contract.mjs';
import { acquireWorkspaceLock } from './workspacelock.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const v2Root = path.resolve(here, '..');
const repoRoot = path.resolve(v2Root, '..', '..');
const appDir = path.join(v2Root, 'apps', 'game');
const distDir = path.join(appDir, 'dist');
const outputDir = path.join(appDir, 'smoke');
const reportPath = path.join(outputDir, 'scenemem-report.json');
const baselineSavePath = path.join(v2Root, '..', 'baseline-v1.8.9', 'save-fixtures.json');
const collectorPath = fileURLToPath(import.meta.url);
const browserCdpPath = fileURLToPath(new URL('./browsercdp.mjs', import.meta.url));
const browserPathPath = fileURLToPath(new URL('./browserpath.mjs', import.meta.url));
const workspaceLockPath = fileURLToPath(new URL('./workspacelock.mjs', import.meta.url));
const fixtureToolPath = fileURLToPath(new URL('./compendiummem-fixture.mjs', import.meta.url));
const contractPath = fileURLToPath(new URL('./scenemem-contract.mjs', import.meta.url));
const packagePath = path.join(v2Root, 'package.json');
const packageLockPath = path.join(v2Root, 'package-lock.json');
const appPackagePath = path.join(appDir, 'package.json');
const gameHtmlPath = path.join(appDir, 'index.html');
const gameMainPath = path.join(appDir, 'src', 'main.ts');
const shipVisualStatePath = path.join(v2Root, 'packages', 'scene', 'src', 'ship-visual-state.ts');
const shipyardPreviewPath = path.join(appDir, 'src', 'shipyard-preview.ts');
const planetTextureAttachmentPath = path.join(appDir, 'src', 'planet-texture-attachment.ts');
const planetTextureDemandPath = path.join(appDir, 'src', 'planet-texture-demand.ts');
const sceneTextureOwnerPath = path.join(appDir, 'src', 'scene-texture-owner.ts');
const pixiManagedResourceOwnerPath = path.join(appDir, 'src', 'pixi-managed-resource-owner.ts');
const pixiBatchTextureArrayPath = path.join(appDir, 'src', 'pixi-batch-texture-array.ts');
const sceneTextPath = path.join(appDir, 'src', 'scene-text.ts');

const REPORT_SCHEMA = 'cf-v2-scene-memory-report/v2';
const LIFECYCLE_SCHEMA = 'cf-v2-scene-memory-report-lifecycle/v1';
const BUDGET_SCHEMA = 'cf-v2-scene-memory-budget/v4';
export const SCENE_MEMORY_BROWSER_AUTHORITY_SCHEMA =
  'cf-v2-scene-memory-browser-authority/v2';
export const SCENE_MEMORY_BROWSER_AUTHORITY_SCOPE = 'arc1c-scene-memory-only';
export const SCENE_MEMORY_BROWSER_FAMILY = 'microsoft-edge';
export const SCENE_MEMORY_BROWSER_PROTOCOL_VERSION = '1.3';
export const SCENE_MEMORY_BROWSER_CAPABILITY_CONTRACT =
  'cf-v2-scene-memory-cdp-capabilities/v2';
export const SCENE_MEMORY_BROWSER_PROFILE_CONTRACT =
  'cf-v2-scene-memory-browser-profiles/v1';
export const SCENE_MEMORY_SHIPYARD_OPEN_OBSERVATION_SCHEMA =
  'cf-v2-scene-memory-shipyard-open-observation/v1';
const SCENE_MEMORY_PROTECTED_ARC3_REASON =
  'Engineering details and actions are unavailable while this expedition’s Engineering record is protected.';
const WARMUP_CYCLES = 4;
const WARM_CYCLES = SCENE_MEMORY_CYCLE_COUNT;
const OUTCOME_COUNT = 44;
const COMMAND_TIMEOUT_MS = 5_000;
const ANSWERABILITY_TIMEOUT_MS = 2_000;
const ROUTE_TIMEOUT_MS = 20_000;
const ART_TIMEOUT_MS = 30_000;
const SERVER_CLOSE_TIMEOUT_MS = 2_000;
const STORES = Object.freeze([
  'meta', 'player', 'creatures', 'catalog', 'inventory', 'settings', 'journal', 'assetcache',
]);
const PROFILES = Object.freeze({
  phone: Object.freeze({ width: 390, height: 844, dpr: 3, mobile: true }),
  desktop: Object.freeze({ width: 1280, height: 800, dpr: 1, mobile: false }),
});
const HOME_GALAXY = Object.freeze({ seed: 999, x: 90, y: -60 });
const SOL_STAR = Object.freeze({ seed: 424242, x: 560, y: 170 });
const EARTH = Object.freeze({ seed: 133, ordinal: 2 });
const SURFACE_VISTA_CACHE_ENTRIES_MAX = 1;
const SURFACE_VISTA_CACHE_PIXELS_MAX = 960 * 430;
const RELOAD_RELEASE_BINDING = '__cfReloadReleaseWitness';
const SURFACE_VISTA_RELOAD_CLEANUP_BINDING = '__cfSceneMemoryVistaCacheCleanup';
const BUDGET_FIELDS = Object.freeze([
  'heapUsedBytesMax', 'embedderHeapUsedBytesMax', 'backingStorageBytesMax',
  'heapAggregateBytesMax', 'warmHeapAggregateRangeBytesMax',
  'warmHeapSlopeBytesPerCycleMax',
  'documentsMax', 'nodesMax', 'jsEventListenersMax',
  'peakActiveLeaseCountMax', 'peakLiveTextureCountMax', 'peakLiveCanvasBytesMax',
  'managedTextureCountMax', 'managedTexturePixelsMax', 'localCanvasCacheEntriesMax',
  'peakLocalCanvasCacheEntriesMax', 'productRenderTargetsMax',
  'ringCacheEntriesMax', 'peakRingGeometryEntriesMax',
  'surfaceVistaCacheEntriesMax', 'surfaceVistaCachePixelsMax',
  'targetElapsedMsMax', 'heartbeatElapsedMsMax',
]);
export const SCENE_MEMORY_REQUIRED_CDP_DOMAINS = Object.freeze([
  'Browser', 'Emulation', 'HeapProfiler', 'Log', 'Memory', 'Page', 'Runtime', 'Target',
]);
export const SCENE_MEMORY_REQUIRED_CDP_METHODS = Object.freeze([
  'Browser.getVersion',
  'Emulation.setDeviceMetricsOverride',
  'Emulation.setTouchEmulationEnabled',
  'HeapProfiler.collectGarbage',
  'HeapProfiler.enable',
  'Log.enable',
  'Memory.getDOMCounters',
  'Page.enable',
  'Page.getNavigationHistory',
  'Page.navigate',
  'Page.navigateToHistoryEntry',
  'Runtime.enable',
  'Runtime.addBinding',
  'Runtime.evaluate',
  'Runtime.getHeapUsage',
  'Target.attachToTarget',
  'Target.closeTarget',
  'Target.createBrowserContext',
  'Target.createTarget',
  'Target.disposeBrowserContext',
]);
const BROWSER_AUTHORITY_FIELDS = Object.freeze([
  'schema', 'scope', 'family', 'protocolVersion',
  'capabilityContract', 'capabilityContractSha256',
  'profileContract', 'profileContractSha256',
]);
const BROWSER_PROVENANCE_FIELDS = Object.freeze([
  'executable', 'product', 'revision', 'userAgent', 'jsVersion', 'protocolVersion',
]);
const PRODUCER_AUTHORITY_FIELDS = Object.freeze([
  'collector', 'browserCdp', 'browserPath', 'workspaceLock', 'fixtureGenerator',
  'verdictContract', 'fixtureSpec', 'fixtureRows', 'baselineSaveFixtures',
  'package', 'packageLock', 'appPackage', 'buildDist', 'gameHtml', 'gameMain',
  'shipVisualState', 'shipyardPreview', 'planetTextureAttachment', 'planetTextureDemand',
  'sceneTextureOwner',
  'pixiManagedResourceOwner', 'pixiBatchTextureArray', 'sceneText',
]);

class ProductFailure extends Error {
  constructor(message, evidence = null) {
    super(message);
    this.name = 'ProductFailure';
    this.evidence = evidence;
  }
}

function fail(message) { throw new Error(message); }
function assert(condition, message) { if (!condition) fail(message); }
function productAssert(condition, message, evidence = null) {
  if (!condition) throw new ProductFailure(message, evidence);
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const hashFile = (file) => sha256(fs.readFileSync(file));
const portable = (value) => value.split(path.sep).join('/');
const same = (left, right) => stableJson(left) === stableJson(right);
export function sceneMemoryCollectorCommandTimeoutMs(timeoutMs = COMMAND_TIMEOUT_MS) {
  assert(Number.isInteger(timeoutMs) && timeoutMs > 0,
    'SceneMemory collector command timeout must be a positive integer');
  return Math.min(timeoutMs, COMMAND_TIMEOUT_MS);
}
const absoluteExecutable = (value) => typeof value === 'string' && value.length > 0
  && (value.startsWith('/') || /^[A-Za-z]:[\\/]/.test(value));
const EDGE_PRODUCT = /^Edg\/(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/;
export const SCENE_MEMORY_BROWSER_CAPABILITY_CONTRACT_SHA256 = sha256(stableJson({
  requiredDomains: SCENE_MEMORY_REQUIRED_CDP_DOMAINS,
  requiredMethods: SCENE_MEMORY_REQUIRED_CDP_METHODS,
}));
export const SCENE_MEMORY_BROWSER_PROFILE_CONTRACT_SHA256 = sha256(stableJson(PROFILES));
const EXPECTED_BROWSER_AUTHORITY = Object.freeze({
  schema: SCENE_MEMORY_BROWSER_AUTHORITY_SCHEMA,
  scope: SCENE_MEMORY_BROWSER_AUTHORITY_SCOPE,
  family: SCENE_MEMORY_BROWSER_FAMILY,
  protocolVersion: SCENE_MEMORY_BROWSER_PROTOCOL_VERSION,
  capabilityContract: SCENE_MEMORY_BROWSER_CAPABILITY_CONTRACT,
  capabilityContractSha256: SCENE_MEMORY_BROWSER_CAPABILITY_CONTRACT_SHA256,
  profileContract: SCENE_MEMORY_BROWSER_PROFILE_CONTRACT,
  profileContractSha256: SCENE_MEMORY_BROWSER_PROFILE_CONTRACT_SHA256,
});

export function sceneMemoryVeteranRaw() {
  const saveFixture = structuredClone(readJson(baselineSavePath).inputs.veteran_rich);
  saveFixture.view = null;
  return JSON.stringify(saveFixture);
}

export function terminalOutcomeInventoryErrors(
  outcomes, canonicalOutcomes = null, expectedCount = OUTCOME_COUNT,
) {
  const errors = [];
  if (!Number.isSafeInteger(expectedCount) || expectedCount <= 0) {
    errors.push('terminal outcome inventory expected count is invalid');
  } else if (!Array.isArray(outcomes) || outcomes.length !== expectedCount
    || outcomes.some((outcome) => outcome?.pass !== true)) {
    errors.push(`terminal outcome inventory is not exactly ${expectedCount} green outcomes`);
  }
  if (canonicalOutcomes !== null && !same(outcomes, canonicalOutcomes)) {
    errors.push('terminal outcome inventory differs from the imported contract replay');
  }
  return errors;
}

export function terminalPassEvidenceErrors(fatalEvents, findings) {
  const errors = [];
  if (!same(fatalEvents, [])) errors.push('terminal fatal-event inventory must be an exact empty array');
  if (!same(findings, [])) errors.push('terminal finding inventory must be an exact empty array');
  return errors;
}

export function terminalSourceAuthorityErrors(begin, end, current) {
  const errors = [];
  if (begin?.state !== 'committed' || end?.state !== 'committed' || current?.state !== 'committed') {
    errors.push('terminal source authority must be committed and clean');
  }
  if (!same(begin, end) || !same(end, current)) {
    errors.push('source identity is stale or changed');
  }
  return errors;
}

function atomicWriteJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${crypto.randomBytes(5).toString('hex')}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' });
  fs.renameSync(temporary, file);
}

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

function sourceIdentity() {
  const top = fs.realpathSync(String(git(['rev-parse', '--show-toplevel'])).trim());
  assert(top === fs.realpathSync(repoRoot), `git root mismatch: ${top}`);
  const status = git(['status', '--porcelain=v1', '-z', '--untracked-files=all'], { raw: true });
  const diff = git(['diff', '--binary', '--no-ext-diff', 'HEAD', '--'], { raw: true });
  const untrackedRaw = git(['ls-files', '--others', '--exclude-standard', '-z'], { raw: true });
  const untracked = untrackedRaw.toString('utf8').split('\0').filter(Boolean).sort();
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
    else throw new Error(`untracked source is not a file or symlink: ${relative}`);
    digest.update('\0');
  }
  const commit = String(git(['rev-parse', 'HEAD'])).trim();
  assert(/^[a-f0-9]{40}$/.test(commit), 'git HEAD is not one full commit');
  if (process.env.GITHUB_SHA !== undefined) {
    assert(process.env.GITHUB_SHA === commit,
      `GITHUB_SHA ${process.env.GITHUB_SHA} does not match HEAD ${commit}`);
  }
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
      else if (stat.isFile() && !stat.isSymbolicLink()) {
        files.push({
          path: portable(path.relative(distDir, absolute)),
          bytes: stat.size,
          sha256: hashFile(absolute),
        });
      } else throw new Error(`dist contains unsupported entry: ${absolute}`);
    }
  };
  visit(distDir);
  assert(files.some((item) => item.path === 'index.html'), 'Vite build did not produce index.html');
  return Object.freeze({
    schema: 'cf-v2-scene-memory-build/v1', files,
    sha256: sha256(stableJson(files)),
  });
}

function exactInputs(fixture, budgetFile = null, buildSha256 = null) {
  assert(buildSha256 === null || /^[a-f0-9]{64}$/.test(buildSha256),
    'scene-memory build authority must be one SHA-256 digest');
  return Object.freeze({
    collector: hashFile(collectorPath),
    browserCdp: hashFile(browserCdpPath),
    browserPath: hashFile(browserPathPath),
    workspaceLock: hashFile(workspaceLockPath),
    fixtureGenerator: hashFile(fixtureToolPath),
    verdictContract: hashFile(contractPath),
    fixtureSpec: hashFile(COMPENDIUM_FIXTURE_SPEC_PATH),
    fixtureRows: fixture.rowsSha256,
    baselineSaveFixtures: hashFile(baselineSavePath),
    package: hashFile(packagePath),
    packageLock: hashFile(packageLockPath),
    appPackage: hashFile(appPackagePath),
    buildDist: buildSha256,
    gameHtml: hashFile(gameHtmlPath),
    gameMain: hashFile(gameMainPath),
    shipVisualState: hashFile(shipVisualStatePath),
    shipyardPreview: hashFile(shipyardPreviewPath),
    planetTextureAttachment: hashFile(planetTextureAttachmentPath),
    planetTextureDemand: hashFile(planetTextureDemandPath),
    sceneTextureOwner: hashFile(sceneTextureOwnerPath),
    pixiManagedResourceOwner: hashFile(pixiManagedResourceOwnerPath),
    pixiBatchTextureArray: hashFile(pixiBatchTextureArrayPath),
    sceneText: hashFile(sceneTextPath),
    budget: budgetFile ? hashFile(budgetFile) : null,
  });
}

function runId() {
  const explicit = process.env.CF_SCENEMEM_RUN_ID;
  if (explicit !== undefined) {
    assert(/^[a-z0-9][a-z0-9-]{0,95}$/i.test(explicit), 'CF_SCENEMEM_RUN_ID is invalid');
    return explicit;
  }
  return `${new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 17)}-${process.pid}-${crypto.randomBytes(5).toString('hex')}`;
}

function parseArgs(argv) {
  const options = {
    allowDirty: false, calibrate: false, budgetFile: null, verifyRun: null,
  };
  for (const arg of argv) {
    if (arg === '--allow-dirty') options.allowDirty = true;
    else if (arg === '--calibrate') options.calibrate = true;
    else if (arg.startsWith('--budget=')) options.budgetFile = path.resolve(arg.slice(9));
    else if (arg.startsWith('--verify-run=')) options.verifyRun = arg.slice(13);
    else fail(`unknown argument: ${arg}`);
  }
  assert(!(options.calibrate && options.budgetFile), '--calibrate and --budget are mutually exclusive');
  if (options.verifyRun !== null) {
    assert(/^[a-z0-9][a-z0-9-]{0,95}$/i.test(options.verifyRun), '--verify-run ID is invalid');
    assert(!options.allowDirty && !options.calibrate,
      '--verify-run accepts only an optional matching --budget');
  }
  return Object.freeze(options);
}

export function validSceneMemoryBrowserAuthority(authority) {
  return authority !== null && typeof authority === 'object' && !Array.isArray(authority)
    && same(Object.keys(authority).sort(), [...BROWSER_AUTHORITY_FIELDS].sort())
    && same(authority, EXPECTED_BROWSER_AUTHORITY);
}

function validBrowserProvenance(browser) {
  return browser !== null && typeof browser === 'object' && !Array.isArray(browser)
    && BROWSER_PROVENANCE_FIELDS.every((field) =>
      typeof browser[field] === 'string' && browser[field].length > 0)
    && absoluteExecutable(browser.executable);
}

/** Version-tolerant Arc 1C browser authority. Exact executable, Edge build,
 * revision, user agent and JavaScript version remain mandatory report
 * provenance, while only family/protocol/capability/profile compatibility
 * binds the reusable ruler. */
export function sceneMemoryBrowserAuthority(browser) {
  if (!validBrowserProvenance(browser)
    || !EDGE_PRODUCT.test(browser.product)
    || browser.protocolVersion !== SCENE_MEMORY_BROWSER_PROTOCOL_VERSION) return null;
  return EXPECTED_BROWSER_AUTHORITY;
}

export function sceneMemoryBrowserAuthorityMatches(browser, authority) {
  const observed = sceneMemoryBrowserAuthority(browser);
  return observed !== null && validSceneMemoryBrowserAuthority(authority)
    && same(observed, authority);
}

export function sceneMemoryBrowserCapabilityInventoryErrors({
  collectorSource, browserCdpSource,
} = {}) {
  if (typeof collectorSource !== 'string' || typeof browserCdpSource !== 'string') {
    return ['SceneMemory browser capability inventory sources are unavailable'];
  }
  const domains = SCENE_MEMORY_REQUIRED_CDP_DOMAINS.join('|');
  const directMethodPattern = new RegExp(`send\\(\\s*["']((${domains})\\.[A-Za-z]+)["']`, 'g');
  const enableBlock = /for \(const method of \[([\s\S]*?)\]\) \{/.exec(collectorSource)?.[1] ?? '';
  const enableMethodPattern = new RegExp(`["']((${domains})\\.[A-Za-z]+)["']`, 'g');
  const actualMethods = [...new Set(
    [
      ...[...collectorSource.matchAll(directMethodPattern)].map((match) => match[1]),
      ...[...enableBlock.matchAll(enableMethodPattern)].map((match) => match[1]),
    ],
  )].sort();
  const expectedMethods = [...SCENE_MEMORY_REQUIRED_CDP_METHODS].sort();
  const errors = [];
  if (!same(actualMethods, expectedMethods)) {
    const missing = expectedMethods.filter((method) => !actualMethods.includes(method));
    const extra = actualMethods.filter((method) => !expectedMethods.includes(method));
    if (missing.length) errors.push(`SceneMemory collector capability inventory is missing ${missing.join(', ')}`);
    if (extra.length) errors.push(`SceneMemory collector capability inventory has unsealed ${extra.join(', ')}`);
  }
  const actualDomains = [...new Set(actualMethods.map((method) => method.split('.')[0]))].sort();
  const expectedDomains = [...SCENE_MEMORY_REQUIRED_CDP_DOMAINS].sort();
  if (!same(actualDomains, expectedDomains)) {
    errors.push('SceneMemory collector CDP domain inventory does not match its authority');
  }
  if (!/const version = await send\(["']Browser\.getVersion["']\);/.test(browserCdpSource)) {
    errors.push('SceneMemory browser transport lacks Browser.getVersion provenance');
  }
  return errors;
}

export function validateSceneMemoryBudget(record) {
  const errors = [];
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return { ok: false, errors: ['budget must be an object'] };
  }
  if (record.schema !== BUDGET_SCHEMA) errors.push(`budget schema must be ${BUDGET_SCHEMA}`);
  if (!same(Object.keys(record).sort(), ['authority', 'profiles', 'schema'])) {
    errors.push('budget keys must be exactly schema, authority, and profiles');
  }
  const browserAuthority = record.authority?.browser;
  const producerAuthority = record.authority?.producer;
  if (!same(Object.keys(record.authority || {}).sort(), ['browser', 'producer'])) {
    errors.push('budget authority must be exactly browser and producer');
  }
  if (!validSceneMemoryBrowserAuthority(browserAuthority)) {
    errors.push('budget browser authority must contain the exact Edge-family capability/profile contract');
  }
  if (!same(Object.keys(producerAuthority || {}).sort(), [...PRODUCER_AUTHORITY_FIELDS].sort())
    || PRODUCER_AUTHORITY_FIELDS.some((field) => !/^[a-f0-9]{64}$/.test(
      producerAuthority?.[field] || '',
    ))) {
    errors.push('budget producer authority must contain the exact SHA-256 producer tuple');
  }
  if (!record.profiles || typeof record.profiles !== 'object') errors.push('budget profiles are missing');
  for (const profile of Object.keys(PROFILES)) {
    const ceiling = record.profiles?.[profile];
    if (!ceiling || typeof ceiling !== 'object') {
      errors.push(`budget profile ${profile} is missing`);
      continue;
    }
    for (const field of BUDGET_FIELDS) {
      if (!Number.isFinite(ceiling[field]) || ceiling[field] < 0) {
        errors.push(`budget profiles.${profile}.${field} must be a nonnegative finite number`);
      }
    }
    const keys = Object.keys(ceiling).sort();
    if (!same(keys, [...BUDGET_FIELDS].sort())) {
      errors.push(`budget profiles.${profile} must contain only the contract fields`);
    }
    if (ceiling.surfaceVistaCacheEntriesMax !== SURFACE_VISTA_CACHE_ENTRIES_MAX
      || ceiling.surfaceVistaCachePixelsMax !== SURFACE_VISTA_CACHE_PIXELS_MAX) {
      errors.push(`budget profiles.${profile} surface vista must remain exactly ${SURFACE_VISTA_CACHE_ENTRIES_MAX} entry / ${SURFACE_VISTA_CACHE_PIXELS_MAX} pixels`);
    }
  }
  if (!same(Object.keys(record.profiles || {}).sort(), Object.keys(PROFILES).sort())) {
    errors.push('budget profiles must be exactly phone and desktop');
  }
  return { ok: errors.length === 0, errors };
}

function producerAuthority(inputs) {
  return Object.freeze(Object.fromEntries(
    PRODUCER_AUTHORITY_FIELDS.map((field) => [field, inputs[field]]),
  ));
}

export function reportBrowserAuthorityErrors(browser, expectedBrowserAuthority) {
  if (!browser || typeof browser !== 'object' || Array.isArray(browser)) {
    return ['terminal report browser authority is missing'];
  }
  if (!validBrowserProvenance(browser)) {
    return ['terminal report browser authority is incomplete'];
  }
  if (!EDGE_PRODUCT.test(browser.product)) {
    return ['terminal report browser family is not Microsoft Edge'];
  }
  if (browser.protocolVersion !== SCENE_MEMORY_BROWSER_PROTOCOL_VERSION) {
    return ['terminal report browser protocol does not match the SceneMemory contract'];
  }
  return sceneMemoryBrowserAuthorityMatches(browser, expectedBrowserAuthority) ? []
    : ['terminal report browser authority does not match the budget'];
}

function assertBudgetBinding(record, inputs, browser) {
  assert(same(record.authority.producer, producerAuthority(inputs)),
    'scene-memory budget producer authority does not match this collector/input set');
  const browserErrors = reportBrowserAuthorityErrors(browser, record.authority.browser);
  assert(browserErrors.length === 0, browserErrors.join('; '));
}

function assertBudgetAuthority(file) {
  const absolute = fs.realpathSync(file);
  const prefix = repoRoot.endsWith(path.sep) ? repoRoot : `${repoRoot}${path.sep}`;
  assert(absolute.startsWith(prefix), 'certifying scene-memory budget must be inside the repository');
  const relative = portable(path.relative(repoRoot, absolute));
  git(['ls-files', '--error-unmatch', '--', relative]);
  return absolute;
}

function closeStaticServer(server, timeoutMs = SERVER_CLOSE_TIMEOUT_MS) {
  assert(server && typeof server.close === 'function'
    && typeof server.closeAllConnections === 'function', 'static server cleanup target is invalid');
  return new Promise((resolve, reject) => {
    const started = performance.now();
    const deadline = started + timeoutMs;
    let settled = false;
    let timer = null;
    const finish = (error = null) => {
      if (settled) return;
      const late = performance.now() >= deadline;
      settled = true;
      if (timer !== null) clearTimeout(timer);
      if (!error && !late) { resolve(); return; }
      let failure = error || new Error(`static server exceeded ${timeoutMs}ms close deadline`);
      try { server.closeAllConnections(); }
      catch (forceError) {
        failure = new Error(`${failure.message}; forced connection cleanup failed: ${forceError.message}`);
      }
      reject(failure);
    };
    timer = setTimeout(() => finish(), timeoutMs);
    try { server.close((error) => finish(error || null)); }
    catch (error) { finish(error); }
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
    if (url.pathname === '/__scenemem_seed__.html') {
      response.writeHead(200, {
        'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store',
      });
      response.end('<!doctype html><meta charset="utf-8"><title>Scene memory seed</title>');
      return;
    }
    if (url.pathname === '/favicon.ico') {
      response.writeHead(204, { 'cache-control': 'public, max-age=86400' });
      response.end();
      return;
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
      if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('not a regular file');
      response.writeHead(200, {
        'content-type': mime[path.extname(file)] || 'application/octet-stream',
        /* The real persisted-page witness needs an eligible application
           document. Revalidation is fine; `no-store` would make that browser
           lifecycle claim platform/version dependent. */
        'cache-control': 'private, max-age=0, must-revalidate',
      });
      response.end(fs.readFileSync(file));
    } catch { response.writeHead(404); response.end(); }
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      assert(address && typeof address === 'object', 'static server has no TCP address');
      resolve(Object.freeze({
        server, origin: `http://127.0.0.1:${address.port}`,
        close: () => closeStaticServer(server),
      }));
    });
  });
}

export function sceneMemoryBfcacheAwayResponse(pathname) {
  if (pathname !== '/__scenemem_bfcache_away__.html') {
    return Object.freeze({ status: 404, headers: Object.freeze({}), body: '' });
  }
  return Object.freeze({
    status: 200,
    headers: Object.freeze({
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    }),
    body: '<!doctype html><meta charset="utf-8"><link rel="icon" href="data:,"><title>Scene memory away</title><script>globalThis.__CF_SCENEMEM_AWAY__=true<\/script>',
  });
}

function serveBfcacheAwayPage() {
  const server = http.createServer((request, response) => {
    const url = new URL(request.url || '/', 'http://127.0.0.1');
    const projected = sceneMemoryBfcacheAwayResponse(url.pathname);
    response.writeHead(projected.status, projected.headers);
    response.end(projected.body);
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      assert(address && typeof address === 'object', 'bfcache away server has no TCP address');
      resolve(Object.freeze({
        origin: `http://127.0.0.1:${address.port}`,
        close: () => closeStaticServer(server),
      }));
    });
  });
}

function evaluationValue(response, label) {
  if (response?.exceptionDetails) {
    const description = response.exceptionDetails.exception?.description
      || response.exceptionDetails.text || 'unknown exception';
    throw new ProductFailure(`${label}: browser expression threw (${description})`, response.exceptionDetails);
  }
  const result = response?.result;
  if (!result || !Object.prototype.hasOwnProperty.call(result, 'value')) {
    throw new Error(`${label}: Runtime.evaluate returned no by-value result`);
  }
  return result.value;
}

function makeCollector(send, profile) {
  const evaluate = async (sessionId, expression, label, timeoutMs = COMMAND_TIMEOUT_MS) => {
    const response = await send('Runtime.evaluate', {
      expression, awaitPromise: true, returnByValue: true,
    }, sessionId, { timeoutMs: sceneMemoryCollectorCommandTimeoutMs(timeoutMs) });
    return evaluationValue(response, `${profile} ${label}`);
  };
  const waitValue = async (
    sessionId, label, expression, accept = Boolean, timeoutMs = ROUTE_TIMEOUT_MS,
    diagnose = null, terminalFailure = null,
  ) => {
    const deadline = performance.now() + timeoutMs;
    let last = null;
    let observations = 0;
    while (performance.now() < deadline) {
      const remaining = Math.max(1, Math.floor(deadline - performance.now()));
      last = await evaluate(sessionId, expression, label, Math.min(COMMAND_TIMEOUT_MS, remaining));
      observations++;
      if (typeof terminalFailure === 'function' && terminalFailure(last)) {
        throw new ProductFailure(`${profile} ${label}: product reported a terminal fault`, {
          observations,
          last,
          ...(typeof diagnose === 'function' ? { reasons: diagnose(last) } : {}),
        });
      }
      if (accept(last)) return last;
      await sleep(Math.min(50, Math.max(1, deadline - performance.now())));
    }
    throw new ProductFailure(
      `${profile} ${label}: product did not settle inside ${timeoutMs}ms`,
      {
        observations,
        last,
        ...(typeof diagnose === 'function' ? { reasons: diagnose(last) } : {}),
      },
    );
  };
  return Object.freeze({ evaluate, waitValue });
}

export function sceneMemoryShipyardOpenSettlementReasons(value) {
  const diagnostics = value?.diagnostics;
  const panelDiagnostics = diagnostics?.engineering;
  const arc3 = value?.arc3;
  const presentation = value?.presentation;
  const stateKeyReady = typeof value?.shipVisualStateKey === 'string'
    && value.shipVisualStateKey.length > 0;
  const checks = Object.freeze({
    observationSchema: value?.schema === SCENE_MEMORY_SHIPYARD_OPEN_OBSERVATION_SCHEMA,
    panelOpen: value?.panelOpen === 'shipyard',
    arc3StateKind: arc3?.stateKind === 'unavailable',
    arc3Protection: arc3?.protection === 'legacy-refused:legacy-seed-missing',
    arc3BootstrapPending: arc3?.bootstrapPending === false,
    arc3BootstrapCandidateReady: arc3?.bootstrapCandidateReady === false,
    presentationState: presentation?.state === 'unavailable',
    presentationUnavailableReason:
      presentation?.unavailableReason === SCENE_MEMORY_PROTECTED_ARC3_REASON,
    presentationActionControlCount: presentation?.actionControlCount === 0,
    presentationDiagnosticsActionControlCount:
      presentation?.diagnosticsActionControlCount === 0,
    shipVisualStateKey: stateKeyReady,
    domPreviewCount: value?.domPreviewCount === 1,
    stateKeyAgreement: !stateKeyReady
      || (value?.domStateKey === value.shipVisualStateKey
        && diagnostics?.stateKey === value.shipVisualStateKey),
    diagnosticsSchema: diagnostics?.schema === 'cf-v2-shipyard-diagnostics/v1',
    diagnosticsStatus: diagnostics?.status === 'open',
    diagnosticsActivePreviewCount: diagnostics?.activePreviewCount === 1,
    diagnosticsRetainedPreviewCount: diagnostics?.retainedPreviewCount === 0,
    diagnosticsPendingPreviewWork: diagnostics?.pendingPreviewWork === 0,
    panelDiagnosticsSchema:
      panelDiagnostics?.schema === 'cf-v2-engineering-panel-diagnostics/v1',
    panelDiagnosticsActiveCount: panelDiagnostics?.activeCount === 1,
    panelDiagnosticsPendingWork: panelDiagnostics?.pendingWork === 0,
    panelDiagnosticsActionControlCount: panelDiagnostics?.actionControlCount === 0,
    panelDiagnosticsActivePreviewCount: panelDiagnostics?.activePreviewCount === 1,
    panelDiagnosticsPreviewStateKey: !stateKeyReady
      || panelDiagnostics?.previewStateKey === value.shipVisualStateKey,
    panelDiagnosticsRetainedPreviewCount: panelDiagnostics?.retainedPreviewCount === 0,
    panelDiagnosticsFaultCount: panelDiagnostics?.faultCount === 0,
  });
  return Object.freeze(
    Object.entries(checks).filter(([, ok]) => !ok).map(([reason]) => reason),
  );
}

function routeStateExpression() {
  return `(()=>{const S=window.__CF_SLICE__,s=S.api.state(),r=S.api.sceneResourceDiagnostics();return {
    documentToken:S.documentToken,mode:s.mode,gal:s.gal,star:s.star,planet:s.planet,
    planetOrdinal:s.planetOrdinal,tickerTicks:s.tickerTicks,renderedScene:s.renderedScene,
    panel:s.panelOpen,sceneMode:r.mode,generation:r.generation,worldChildren:S.world.children.length,
    fineLayer:r.fineLayerActive,fineScope:r.fineScopeActive,pendingSurface:r.pendingSurfaceRefreshes,
    pendingSystem:r.pendingSystemRefreshes,pendingPersistence:r.pendingPersistenceWrites,
    retiredFine:r.retiredFineOwnerCount,registry:r.registry,
    surfaceVistaWorkerActive:r.surfaceVistaWorkerActive,
    surfaceVistaMounted:r.surfaceVistaMounted,
    surfaceVistaCacheEntries:r.surfaceVistaCacheEntries,
    surfaceVistaCachePixels:r.surfaceVistaCachePixels}})()`;
}

function surfaceVistaState(scene) {
  return Object.freeze({
    surfaceVistaWorkerActive: scene.surfaceVistaWorkerActive,
    surfaceVistaMounted: scene.surfaceVistaMounted,
    surfaceVistaCacheEntries: scene.surfaceVistaCacheEntries,
    surfaceVistaCachePixels: scene.surfaceVistaCachePixels,
  });
}

export function sceneMemorySurfaceVistaFaultReasons(value) {
  const faults = value?.surfaceVistaFaults;
  if (!Number.isInteger(faults) || faults < 0) {
    return Object.freeze(['surface vista fault diagnostics are missing or invalid']);
  }
  if (faults === 0) {
    if (value?.surfaceVistaLastError !== null) {
      return Object.freeze(['surface vista fault diagnostics are inconsistent']);
    }
    return Object.freeze([]);
  }
  const detail = typeof value.surfaceVistaLastError === 'string'
    && value.surfaceVistaLastError.length > 0
    ? value.surfaceVistaLastError
    : 'cause unavailable';
  return Object.freeze([`surface vista fault (${faults}): ${detail}`]);
}

async function postRenderAnswerability(send, sessionId, profile, token) {
  const expression = `new Promise(resolve=>{const S=window.__CF_SLICE__,before=S.api.state().tickerTicks,
    documentTokenBefore=S.documentToken;
    S.app.ticker.addOnce(()=>setTimeout(()=>{const after=S.api.state().tickerTicks;
      resolve({before,after,started:S.app.ticker.started===true,
        documentTokenBefore,documentTokenAfter:S.documentToken})},0),undefined,-50)})`;
  const targetStarted = performance.now();
  const targetPromise = send('Runtime.evaluate', {
    expression, awaitPromise: true, returnByValue: true,
  }, sessionId, { timeoutMs: ANSWERABILITY_TIMEOUT_MS }).then(
    (response) => ({ status: 'fulfilled', durationMs: performance.now() - targetStarted, response }),
    (error) => ({ status: 'rejected', durationMs: performance.now() - targetStarted, error: error.message }),
  );
  const heartbeatStarted = performance.now();
  const heartbeatPromise = send('Browser.getVersion', {}, undefined, {
    timeoutMs: ANSWERABILITY_TIMEOUT_MS,
  }).then(
    (value) => ({ status: 'fulfilled', durationMs: performance.now() - heartbeatStarted, value }),
    (error) => ({ status: 'rejected', durationMs: performance.now() - heartbeatStarted, error: error.message }),
  );
  const [target, heartbeat] = await Promise.all([targetPromise, heartbeatPromise]);
  const heartbeatOk = heartbeat.status === 'fulfilled'
    && typeof heartbeat.value?.product === 'string' && heartbeat.value.product.length > 0
    && heartbeat.durationMs < ANSWERABILITY_TIMEOUT_MS;
  if (!heartbeatOk) {
    throw new Error(`${profile} ${token}: browser-process heartbeat failed`, { cause: heartbeat });
  }
  if (target.status !== 'fulfilled') {
    throw new ProductFailure(
      `${profile} ${token}: target was unanswerable while browser heartbeat remained timely`,
      { target, heartbeat },
    );
  }
  const value = evaluationValue(target.response, `${profile} ${token} answerability`);
  productAssert(value?.started === true
    && Number.isSafeInteger(value?.before) && Number.isSafeInteger(value?.after)
    && value.after > value.before,
  `${profile} ${token}: target did not service a later advancing Pixi ticker turn`,
  { value, target, heartbeat });
  return Object.freeze({
    token, target: { ok: true, durationMs: target.durationMs, value },
    heartbeat: { ok: true, durationMs: heartbeat.durationMs, product: heartbeat.value.product,
      protocolVersion: heartbeat.value.protocolVersion },
  });
}

async function collectSnapshot({ send, sessionId, collector, profile, label }) {
  const answerability = await postRenderAnswerability(send, sessionId, profile, label);
  await send('HeapProfiler.collectGarbage', {}, sessionId, { timeoutMs: COMMAND_TIMEOUT_MS });
  const heap = await send('Runtime.getHeapUsage', {}, sessionId, { timeoutMs: COMMAND_TIMEOUT_MS });
  const raw = await collector.evaluate(sessionId, `(()=>{const S=window.__CF_SLICE__,s=S.api.state(),
    scene=S.api.sceneResourceDiagnostics(),c=S.api.compendiumDiagnostics(),
    y=S.api.shipyardDiagnostics();return {
      state:{mode:s.mode,gal:s.gal,star:s.star,planet:s.planet,planetOrdinal:s.planetOrdinal,
        tickerTicks:s.tickerTicks,renderedScene:s.renderedScene,panelOpen:s.panelOpen},
      scene,compendium:{panel:c.panel,surfaces:c.surfaces,artLive:c.art?.live??null,
        artLimits:c.art?.limits??null,lazyArt:c.lazyArt??null},shipyard:y}})()`, `${label} resource snapshot`);
  const dom = await send('Memory.getDOMCounters', {}, sessionId, { timeoutMs: COMMAND_TIMEOUT_MS });
  const heapAggregateBytes = Number(heap.usedSize || 0)
    + Number(heap.embedderHeapUsedSize || 0) + Number(heap.backingStorageSize || 0);
  return Object.freeze({ label, answerability, heap, heapAggregateBytes, dom, raw });
}

function contractPoint(snapshot) {
  const scene = snapshot.raw.scene;
  const shipyard = snapshot.raw.shipyard;
  return Object.freeze({
    documentToken: scene.documentToken,
    sceneGeneration: scene.generation,
    registry: scene.registry,
    managedResources: scene.managedResources,
    managedTextureCount: scene.managedTextureCount,
    managedTexturePixels: scene.managedTexturePixels,
    managedTextureClearedSlots: scene.managedTextureClearedSlots,
    sceneTextStyleUpdateListeners: scene.sceneTextStyleUpdateListeners,
    localCanvasCacheEntries: scene.localCanvasCacheEntries,
    peakLocalCanvasCacheEntries: scene.peakLocalCanvasCacheEntries,
    productRenderTargets: scene.productRenderTargets,
    retiredFineOwnerCount: scene.retiredFineOwnerCount,
    shipyardDiagnosticsSchema: shipyard.schema,
    shipyardPreviewStatus: shipyard.status,
    shipyardPreviewStateKey: shipyard.stateKey,
    shipyardPreviewActiveCount: shipyard.activePreviewCount,
    shipyardPreviewRetainedCount: shipyard.retainedPreviewCount,
    shipyardPreviewPendingWork: shipyard.pendingPreviewWork,
    pending: scene.pendingSurfaceRefreshes + scene.pendingSystemRefreshes
      + scene.pendingPersistenceWrites
      + Number(scene.surfaceVistaWorkerActive) + Number(scene.surfaceVistaMounted)
      + scene.retiredFineOwnerCount + shipyard.activePreviewCount
      + shipyard.retainedPreviewCount + shipyard.pendingPreviewWork,
    ringCacheEntries: scene.ringGeometryEntries,
    peakRingGeometryEntries: scene.peakRingGeometryEntries,
    ...surfaceVistaState(scene),
    answerability: {
      target: { ok: snapshot.answerability.target.ok,
        elapsedMs: snapshot.answerability.target.durationMs,
        laterTicker: snapshot.answerability.target.value.after
          > snapshot.answerability.target.value.before,
        tickerBefore: snapshot.answerability.target.value.before,
        tickerAfter: snapshot.answerability.target.value.after,
        documentTokenBefore: snapshot.answerability.target.value.documentTokenBefore,
        documentTokenAfter: snapshot.answerability.target.value.documentTokenAfter },
      heartbeat: { ok: snapshot.answerability.heartbeat.ok,
        elapsedMs: snapshot.answerability.heartbeat.durationMs,
        independent: true,
        product: snapshot.answerability.heartbeat.product,
        protocolVersion: snapshot.answerability.heartbeat.protocolVersion },
    },
    heap: {
      usedSize: snapshot.heap.usedSize,
      embedderHeapUsedSize: snapshot.heap.embedderHeapUsedSize,
      backingStorageSize: snapshot.heap.backingStorageSize,
    },
    dom: {
      documents: snapshot.dom.documents,
      nodes: snapshot.dom.nodes,
      jsEventListeners: snapshot.dom.jsEventListeners,
    },
  });
}

async function seedSave({ send, collector, sessionId, origin, veteranRaw, profile }) {
  await send('Page.navigate', { url: `${origin}/__scenemem_seed__.html` }, sessionId, {
    timeoutMs: COMMAND_TIMEOUT_MS,
  });
  await collector.waitValue(sessionId, 'seed document ready',
    `document.readyState==='complete'?'ready':null`, Boolean, ROUTE_TIMEOUT_MS);
  const expression = `(async()=>{const stores=${JSON.stringify(STORES)},raw=${JSON.stringify(veteranRaw)};
    const db=await new Promise((resolve,reject)=>{const q=indexedDB.open('cf-v2-slice',1);
      q.onupgradeneeded=()=>{for(const name of stores)if(!q.result.objectStoreNames.contains(name))q.result.createObjectStore(name)};
      q.onerror=()=>reject(q.error);q.onblocked=()=>reject(new Error('seed IDB blocked'));
      q.onsuccess=()=>resolve(q.result)});
    await new Promise((resolve,reject)=>{const tx=db.transaction('meta','readwrite');
      tx.objectStore('meta').put(raw,'save');tx.oncomplete=resolve;
      tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('seed IDB aborted'))});
    db.close();return new TextEncoder().encode(raw).byteLength})()`;
  const bytes = await collector.evaluate(sessionId, expression, 'seed veteran save');
  assert(bytes === Buffer.byteLength(veteranRaw), `${profile}: seeded save byte count drifted`);
}

async function navigateGame({ send, collector, sessionId, origin, profile }) {
  await send('Page.navigate', { url: `${origin}/` }, sessionId, { timeoutMs: COMMAND_TIMEOUT_MS });
  return await collector.waitValue(sessionId, 'game readiness', `(()=>{const S=window.__CF_SLICE__;
    if(!S||!S.api||typeof S.api.sceneResourceDiagnostics!=='function'
      ||typeof S.api.compendiumDiagnostics!=='function'
      ||typeof S.api.shipyardDiagnostics!=='function'||!S.api.__sceneEvidence)return null;
    const s=S.api.state(),r=S.api.sceneResourceDiagnostics(),y=S.api.shipyardDiagnostics();
    return s.mode==='universe'
      &&r.schema==='cf-v2-scene-resources/v2'&&r.registry?.schema==='cf-v2-scene-textures/v2'
      &&y.schema==='cf-v2-shipyard-diagnostics/v1'&&y.status==='closed'
      &&y.stateKey===null&&y.activePreviewCount===0&&y.retainedPreviewCount===0
      &&y.pendingPreviewWork===0
      &&document.querySelectorAll('#shipyardpanel [data-cf-shipyard-preview="v1"]').length===0
      ?{documentToken:S.documentToken,state:s,resources:r,shipyard:y}:null})()`, Boolean, ROUTE_TIMEOUT_MS);
}

function exactMode(mode, expected = {}) {
  return (value) => value?.mode === mode && value?.sceneMode === mode
    && Object.entries(expected).every(([key, wanted]) => value[key] === wanted);
}

async function clickVisible(collector, sessionId, selector, label) {
  return await collector.evaluate(sessionId, `(()=>{const items=[...document.querySelectorAll(${JSON.stringify(selector)})];
    const el=items.find(node=>{const r=node.getBoundingClientRect(),s=getComputedStyle(node);
      return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'});if(!el)return false;
    el.click();return true})()`, label);
}

async function driveCycle({ collector, sessionId, profile }) {
  const stages = [];
  const sceneObjectsByRoute = {};
  const visitedRoutes = [];
  const inventory = {
    routes: visitedRoutes,
    shipyard: null,
    sceneObjectsByRoute,
    fine: { requested: false, layer: false, scope: false },
    surface: { mode: false, owner: false, scope: false },
  };
  const observe = async (label, accept, timeout = ROUTE_TIMEOUT_MS) => {
    const state = await collector.waitValue(
      sessionId, label, routeStateExpression(), accept, timeout,
    );
    stages.push({ label, state });
    return state;
  };
  const universe = await observe('route universe start', (value) => exactMode('universe')(value)
    && value.retiredFine === 0 && value.pendingSurface === 0 && value.pendingSystem === 0
    && value.pendingPersistence === 0
    && value.surfaceVistaWorkerActive === false && value.surfaceVistaMounted === false
    && ((value.surfaceVistaCacheEntries === 0 && value.surfaceVistaCachePixels === 0)
      || (value.surfaceVistaCacheEntries === SURFACE_VISTA_CACHE_ENTRIES_MAX
        && value.surfaceVistaCachePixels > 0
        && value.surfaceVistaCachePixels <= SURFACE_VISTA_CACHE_PIXELS_MAX))
    && value.registry?.activeScopeCount === 1 && value.registry?.coherent === true);
  sceneObjectsByRoute.universe = universe.worldChildren;
  visitedRoutes.push('universe');
  const galaxyAccepted = await collector.evaluate(sessionId,
    `window.__CF_SLICE__.api.descendGalaxy(${JSON.stringify(HOME_GALAXY)})`,
    'descend home galaxy');
  productAssert(galaxyAccepted === true, `${profile}: home galaxy descent was rejected`);
  const galaxy = await observe('route galaxy 999', exactMode('galaxy', { gal: 999 }));
  sceneObjectsByRoute.galaxy = galaxy.worldChildren;
  visitedRoutes.push('galaxy');

  const fineRequest = await collector.evaluate(sessionId, `(()=>{const S=window.__CF_SLICE__,z=Math.min(innerWidth,innerHeight)/100;
    if(S.api.state().mode!=='galaxy')return false;S.cam.x=S.camT.x=0;S.cam.y=S.camT.y=0;
    S.cam.z=S.camT.z=z;return true})()`, 'request galaxy fine layer');
  const fine = await collector.waitValue(sessionId, 'route galaxy fine 999', `(()=>{const S=window.__CF_SLICE__,s=S.api.state(),
    r=S.api.sceneResourceDiagnostics(),p=S.api.fineStarProbe();return s.mode==='galaxy'&&s.gal===999
      &&r.fineLayerActive===true&&r.fineScopeActive===true&&r.registry.coherent===true
      &&p.total>0?{mode:s.mode,gal:s.gal,sceneMode:r.mode,worldChildren:S.world.children.length,
        fineTotal:p.total,fineLayer:r.fineLayerActive,fineScope:r.fineScopeActive}:null})()`,
  Boolean, ART_TIMEOUT_MS);
  stages.push({ label: 'route galaxy fine 999', state: fine });
  sceneObjectsByRoute['galaxy-fine'] = fine.fineTotal;
  visitedRoutes.push('galaxy-fine');
  inventory.fine = { requested: fineRequest === true, layer: fine.fineLayer, scope: fine.fineScope };

  const systemAccepted = await collector.evaluate(sessionId,
    `window.__CF_SLICE__.api.descendSystem(${JSON.stringify(SOL_STAR)})`, 'descend Sol');
  productAssert(systemAccepted === true, `${profile}: Sol descent was rejected`);
  const system = await observe('route Sol 424242', (value) => exactMode('system', {
    gal: 999, star: 424242,
  })(value) && value.pendingSystem === 0 && value.retiredFine === 0
    && value.registry?.coherent === true, ART_TIMEOUT_MS);
  sceneObjectsByRoute.system = system.worldChildren;
  visitedRoutes.push('system');

  /* Capture a rejected product and its bounded state witness in the same
     browser task. A convergence reload scheduled by the product cannot erase
     the actionable reason between two separate CDP evaluations. */
  const landAttempt = await collector.evaluate(sessionId, `(async () => {
    const api = window.__CF_SLICE__?.api;
    const accepted = await api.landOn(${JSON.stringify(EARTH)});
    const state = api?.state?.() ?? null;
    return {
      accepted,
      evidence: state === null ? null : {
        route: {
          mode: state.mode ?? null,
          gal: state.gal ?? null,
          star: state.star ?? null,
          planet: state.planet ?? null,
          planetOrdinal: state.planetOrdinal ?? null,
        },
        persistence: state.persistence == null ? null : {
          protectedDetail: state.persistence.protectedDetail ?? null,
          convergenceReloadScheduled: state.persistence.convergenceReloadScheduled ?? null,
          mutationBlockWitness: state.persistence.mutationBlockWitness ?? null,
          runtime: state.persistence.runtime ?? null,
        },
        landing: state.landing ?? null,
      },
    };
  })()`, 'land on Earth with rejection evidence');
  productAssert(landAttempt?.accepted === true,
    `${profile}: Earth planetfall was rejected`, landAttempt?.evidence ?? landAttempt);
  productAssert(landAttempt?.evidence?.route?.mode === 'surface'
    && landAttempt?.evidence?.persistence?.convergenceReloadScheduled === false,
  `${profile}: Earth landing scheduled convergence before surface observation`, landAttempt?.evidence);
  const surfaceRoute = await observe('route Earth 133 settled', (value) => exactMode('surface', {
    gal: 999, star: 424242, planet: 133, planetOrdinal: 2,
  })(value) && value?.panel === null, ART_TIMEOUT_MS);
  const expectedTierPx = profile === 'phone' ? 768 : 1024;
  const expectedRendererDpr = profile === 'phone' ? 2 : 1;
  const surfaceDemand = await collector.evaluate(sessionId, `(()=>{const S=window.__CF_SLICE__,s=S.api.state(),
    r=S.api.sceneResourceDiagnostics(),z=${profile === 'phone' ? 1 : 2.3};if(s.mode!=='surface')return null;
    S.cam.z=S.camT.z=z;return {requested:true,z,beforeTicker:s.tickerTicks,
      documentToken:S.documentToken,sceneGeneration:r.generation}})()`, 'request surface HD tier');
  productAssert(surfaceDemand?.requested === true,
    `${profile}: surface HD demand was not applied`, surfaceDemand);
  const surface = await collector.waitValue(sessionId, 'surface texture settlement',
    `(()=>{const S=window.__CF_SLICE__,s=S.api.state(),r=S.api.sceneResourceDiagnostics(),settled=r.mode==='surface'
      &&S.documentToken===${JSON.stringify(surfaceDemand.documentToken)}
      &&r.generation===${surfaceDemand.sceneGeneration}&&s.tickerTicks>${surfaceDemand.beforeTicker}
      &&s.rendererDpr===${expectedRendererDpr}
      &&r.pendingSurfaceRefreshes===0&&r.pendingSystemRefreshes===0
      &&r.retiredFineOwnerCount===0
      &&r.surfaceTextureOwnerActive===true
      &&r.surfaceVistaWorkerActive===false&&r.surfaceVistaMounted===true
      &&r.surfaceVistaCacheEntries===${SURFACE_VISTA_CACHE_ENTRIES_MAX}
      &&r.surfaceVistaCachePixels>0
      &&r.surfaceVistaCachePixels<=${SURFACE_VISTA_CACHE_PIXELS_MAX}
      &&r.surfaceCurrentTierPx===${expectedTierPx}&&r.surfaceRequestedTierPx===0
      &&r.surfaceCurrentBackingWidth===${expectedTierPx}
      &&r.surfaceCurrentBackingHeight===${expectedTierPx}
      &&r.registry.coherent===true;return {...r,rendererDpr:s.rendererDpr,settled}})()`,
  (value) => value?.settled === true, ART_TIMEOUT_MS,
  sceneMemorySurfaceVistaFaultReasons,
  (value) => sceneMemorySurfaceVistaFaultReasons(value).length > 0);
  sceneObjectsByRoute.surface = surfaceRoute.worldChildren;
  visitedRoutes.push('surface');
  inventory.surface = {
    mode: surface.mode === 'surface', owner: surface.surfaceTextureOwnerActive === true,
    scope: surface.registry.activeScopes.some((scope) => scope.closed === false && scope.leaseCount > 0),
    ...surfaceVistaState(surface),
  };

  productAssert(await clickVisible(collector, sessionId, '#dockcodex,#railcodex',
    'open Compendium') === true, `${profile}: no visible Compendium opener`);
  const list = await collector.waitValue(sessionId, 'Compendium list settlement', `(()=>{const d=window.__CF_SLICE__.api.compendiumDiagnostics(),
    states=d.surfaces.list.thumbStates,imgs=[...document.querySelectorAll('#codexpanel [data-sel="codex-entry"] img')];
    return d.panel.mode==='list'&&d.panel.sourceCount===1500&&d.panel.filteredCount===1500
      &&states.length>0&&imgs.length===states.length&&states.every(x=>x==='ready')
      &&imgs.every(img=>!!img.getAttribute('src')&&img.complete===true
        &&img.naturalWidth===132&&img.naturalHeight===132)
      &&d.art?.live?.queuedJobs===0&&d.art?.live?.activeJobs===0?d:null})()`,
  Boolean, ART_TIMEOUT_MS);
  stages.push({ label: 'compendium:list', state: { sourceCount: list.panel.sourceCount,
    mounted: list.surfaces.list.imageCount } });
  sceneObjectsByRoute.compendium = list.surfaces.list.imageCount;
  visitedRoutes.push('compendium');

  productAssert(await clickVisible(collector, sessionId, '#codexpanel [data-pnx="codex"]',
    'close Compendium') === true, `${profile}: no visible Compendium close control`);
  const closed = await collector.waitValue(sessionId, 'Compendium close settlement', `(()=>{const d=window.__CF_SLICE__.api.compendiumDiagnostics(),
    imgs=[...document.querySelectorAll('#planetside [data-sel="planetside-sp"] img')],s=d.surfaces.planetside;
    return d.panel.mode==='closed'&&s.visible&&imgs.length===s.thumbStates.length
      &&(imgs.length===0||s.thumbStates.every(x=>x==='ready'))
      &&imgs.every(img=>!!img.getAttribute('src')&&img.complete===true
        &&img.naturalWidth===132&&img.naturalHeight===132)
      &&d.art?.live?.queuedJobs===0&&d.art?.live?.activeJobs===0?d:null})()`,
  Boolean, ART_TIMEOUT_MS);
  stages.push({ label: 'compendium:closed', state: {
    planetsideImages: closed.surfaces.planetside.imageCount,
  } });

  if (profile === 'desktop') {
    const surveyWasOpen = await collector.evaluate(
      sessionId, 'window.__CF_SLICE__.api.state().cardOpen', 'Shipyard desktop Survey composition',
    );
    if (surveyWasOpen) {
      productAssert(await clickVisible(
        collector, sessionId, '#docksurvey', 'yield Survey to desktop Shipyard rail',
      ) === true, `${profile}: Survey could not yield the right rail`);
      await collector.waitValue(
        sessionId,
        'desktop Shipyard rail settlement',
        "window.__CF_SLICE__.api.state().cardOpen===false?'ready':null",
        Boolean,
        ROUTE_TIMEOUT_MS,
      );
    }
  }
  const openerDriven = await clickVisible(
    collector, sessionId, '#dockshipyard,#railshipyard', 'open Shipyard',
  );
  productAssert(openerDriven === true, `${profile}: no visible Shipyard opener`);
  const shipyardOpen = await collector.waitValue(
    sessionId,
    'Shipyard open settlement',
    `(()=>{const S=window.__CF_SLICE__,s=S.api.state(),d=S.api.shipyardDiagnostics(),v=s.shipVisual,
      e=s.engineering,de=d?.engineering,
      nodes=[...document.querySelectorAll('#shipyardpanel [data-cf-shipyard-preview="v1"]')],
      unavailable=document.querySelector('#shipyardpanel [data-engineering-state]'),
      actionControlCount=document.querySelectorAll('#shipyardpanel [data-engineering-action]').length,
      domStateKey=nodes[0]?.getAttribute('data-state-key')??null;
      return {schema:${JSON.stringify(SCENE_MEMORY_SHIPYARD_OPEN_OBSERVATION_SCHEMA)},
        panelOpen:s.panelOpen??null,
        shipVisualStateKey:v?.stateKey??null,domPreviewCount:nodes.length,domStateKey,
        arc3:{stateKind:e?.stateKind??null,protection:e?.protection??null,
          bootstrapPending:e?.bootstrapPending??null,
          bootstrapCandidateReady:e?.bootstrapCandidateReady??null},
        presentation:{state:unavailable?.getAttribute('data-engineering-state')??null,
          unavailableReason:unavailable?.getAttribute('data-engineering-unavailable')??null,
          actionControlCount,diagnosticsActionControlCount:de?.actionControlCount??null},
        diagnostics:d?{schema:d.schema??null,status:d.status??null,stateKey:d.stateKey??null,
          activePreviewCount:d.activePreviewCount??null,
          retainedPreviewCount:d.retainedPreviewCount??null,
          pendingPreviewWork:d.pendingPreviewWork??null,
          engineering:de?{schema:de.schema??null,activeCount:de.activeCount??null,
            pendingWork:de.pendingWork??null,actionControlCount:de.actionControlCount??null,
            activePreviewCount:de.activePreviewCount??null,
            previewStateKey:de.previewStateKey??null,
            retainedPreviewCount:de.retainedPreviewCount??null,
            faultCount:de.faultCount??null}:null}:null};})()`,
    (value) => sceneMemoryShipyardOpenSettlementReasons(value).length === 0,
    ART_TIMEOUT_MS,
    sceneMemoryShipyardOpenSettlementReasons,
  );
  stages.push({ label: 'shipyard:open', state: shipyardOpen });
  sceneObjectsByRoute.shipyard = shipyardOpen.domPreviewCount;
  visitedRoutes.push('shipyard');

  const closeDriven = await clickVisible(
    collector, sessionId, '#shipyardpanel [data-pnx="shipyard"]', 'close Shipyard',
  );
  productAssert(closeDriven === true, `${profile}: no visible Shipyard close control`);
  const shipyardClosed = await collector.waitValue(
    sessionId,
    'Shipyard close settlement',
    `(()=>{const S=window.__CF_SLICE__,s=S.api.state(),d=S.api.shipyardDiagnostics(),
      nodes=[...document.querySelectorAll('#shipyardpanel [data-cf-shipyard-preview="v1"]')];
      return s.panelOpen===null&&d.schema==='cf-v2-shipyard-diagnostics/v1'
        &&d.status==='closed'&&d.stateKey===null&&d.activePreviewCount===0
        &&nodes.length===0&&d.retainedPreviewCount===0&&d.pendingPreviewWork===0
        ?{activePreviewCount:nodes.length,retainedPreviewCount:d.retainedPreviewCount,
          pendingPreviewWork:d.pendingPreviewWork}:null})()`,
    Boolean,
    ART_TIMEOUT_MS,
  );
  stages.push({ label: 'shipyard:closed', state: shipyardClosed });
  inventory.shipyard = Object.freeze({
    status: 'implemented-static', openerDriven, closeDriven,
    stateKey: shipyardOpen.diagnostics.stateKey,
    stateMatch: shipyardOpen.diagnostics.stateKey === shipyardOpen.shipVisualStateKey
      && shipyardOpen.domStateKey === shipyardOpen.shipVisualStateKey,
    openPreviewCount: shipyardOpen.domPreviewCount,
    openRetainedPreviewCount: shipyardOpen.diagnostics.retainedPreviewCount,
    openPendingPreviewWork: shipyardOpen.diagnostics.pendingPreviewWork,
    closedPreviewCount: shipyardClosed.activePreviewCount,
    closedRetainedPreviewCount: shipyardClosed.retainedPreviewCount,
    closedPendingPreviewWork: shipyardClosed.pendingPreviewWork,
  });

  const ascend = async (from, to, accept) => {
    const result = await collector.evaluate(sessionId, `(()=>{const S=window.__CF_SLICE__,before=S.api.state().mode;
      const event=new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:innerWidth/2,clientY:innerHeight/2});
      S.app.canvas.dispatchEvent(event);return {before,after:S.api.state().mode,defaultPrevented:event.defaultPrevented}})()`,
    `ascend ${from} to ${to}`);
    productAssert(result?.before === from && result?.defaultPrevented === true,
      `${profile}: ${from} ascent did not pass through the canvas handler`, result);
    await observe(`route ascend ${to}`, accept);
  };
  await ascend('surface', 'system', (value) => exactMode('system', {
    gal: 999, star: 424242,
  })(value) && value.surfaceVistaWorkerActive === false
    && value.surfaceVistaMounted === false
    && value.surfaceVistaCacheEntries === SURFACE_VISTA_CACHE_ENTRIES_MAX
    && value.surfaceVistaCachePixels > 0
    && value.surfaceVistaCachePixels <= SURFACE_VISTA_CACHE_PIXELS_MAX);
  await ascend('system', 'galaxy', exactMode('galaxy', { gal: 999 }));
  await ascend('galaxy', 'universe', exactMode('universe'));
  await collector.waitValue(sessionId, 'universe resource settlement', `(()=>{const S=window.__CF_SLICE__,r=S.api.sceneResourceDiagnostics(),c=S.api.compendiumDiagnostics(),y=S.api.shipyardDiagnostics();
    return r.mode==='universe'&&r.registry.coherent===true&&r.fineScopeActive===false
      &&r.surfaceTextureOwnerActive===false&&r.pendingSurfaceRefreshes===0
      &&r.pendingSystemRefreshes===0&&r.pendingPersistenceWrites===0
      &&r.retiredFineOwnerCount===0
      &&r.surfaceVistaWorkerActive===false&&r.surfaceVistaMounted===false
      &&r.surfaceVistaCacheEntries===${SURFACE_VISTA_CACHE_ENTRIES_MAX}
      &&r.surfaceVistaCachePixels>0
      &&r.surfaceVistaCachePixels<=${SURFACE_VISTA_CACHE_PIXELS_MAX}
      &&r.registry.activeScopeCount===1&&r.ringGeometryEntries===0&&c.panel.mode==='closed'
      &&c.art?.live?.queuedJobs===0&&c.art?.live?.activeJobs===0
      &&y.status==='closed'&&y.stateKey===null&&y.activePreviewCount===0
      &&y.retainedPreviewCount===0&&y.pendingPreviewWork===0
      &&document.querySelectorAll('#shipyardpanel [data-cf-shipyard-preview="v1"]').length===0
      &&c.art?.live?.leases===0&&c.art?.live?.subscribers===0?{r,c,y}:null})()`,
  Boolean, ART_TIMEOUT_MS);
  productAssert(same(visitedRoutes, SCENE_MEMORY_ROUTES),
    `${profile}: observed route inventory drifted`, visitedRoutes);
  return Object.freeze({
    stages: Object.freeze(stages),
    surfaceVistaObservation: surface,
    inventory: Object.freeze({ ...inventory, routes: Object.freeze([...visitedRoutes]),
      sceneObjectsByRoute: Object.freeze({ ...sceneObjectsByRoute }) }),
  });
}

function routeInventory(stages) {
  return Object.freeze(stages.map((stage) => {
    if (stage.label === 'compendium:list' || stage.label === 'compendium:closed'
      || stage.label === 'shipyard:open' || stage.label === 'shipyard:closed') return stage.label;
    if (stage.label === 'route galaxy fine 999') return 'galaxy-fine:999';
    const state = stage.state;
    if (state.mode === 'galaxy') return `galaxy:${state.gal}`;
    if (state.mode === 'system') return `system:${state.star}`;
    if (state.mode === 'surface') return `surface:${state.planet}`;
    return state.mode;
  }));
}

async function collectBfcache({ send, collector, sessionId, profile, documentToken }) {
  const before = await collector.evaluate(sessionId, `(()=>{const S=window.__CF_SLICE__,r=S.api.sceneResourceDiagnostics();return {
    documentToken:S.documentToken,pagehide:r.persistedPagehideCount,pageshow:r.persistedPageshowCount}})()`,
  'bfcache precondition');
  productAssert(before.documentToken === documentToken,
    `${profile}: bfcache precondition document token drifted`, before);
  const history = await send('Page.getNavigationHistory', {}, sessionId, {
    timeoutMs: COMMAND_TIMEOUT_MS,
  });
  const gameEntryId = history.entries?.[history.currentIndex]?.id;
  assert(Number.isInteger(gameEntryId), `${profile}: current game history entry is absent`);
  const away = await serveBfcacheAwayPage();
  try {
    await send('Page.navigate', {
      url: `${away.origin}/__scenemem_bfcache_away__.html`,
    }, sessionId, { timeoutMs: COMMAND_TIMEOUT_MS });
    await collector.waitValue(sessionId, 'away-page readiness',
      `globalThis.__CF_SCENEMEM_AWAY__===true?'away':null`, Boolean, ROUTE_TIMEOUT_MS);
    await send('Page.navigateToHistoryEntry', { entryId: gameEntryId }, sessionId, {
      timeoutMs: COMMAND_TIMEOUT_MS,
    });
  } finally {
    await away.close();
  }
  const deadline = performance.now() + ROUTE_TIMEOUT_MS;
  let resumed = null;
  let lastError = null;
  while (performance.now() < deadline) {
    try {
      resumed = await collector.evaluate(sessionId, `(()=>{const S=window.__CF_SLICE__;if(!S?.api)return null;
        const r=S.api.sceneResourceDiagnostics();return {documentToken:S.documentToken,
          pagehide:r.persistedPagehideCount,pageshow:r.persistedPageshowCount,
          appAlive:!!S.app,rendererAlive:!!S.app?.renderer,stageAlive:!!S.app?.stage}})()`,
      'bfcache resume readiness');
      if (resumed?.documentToken && resumed.documentToken !== documentToken) {
        throw new ProductFailure(`${profile}: history return reloaded instead of restoring bfcache`, resumed);
      }
      if (resumed?.documentToken === documentToken && resumed.pagehide > before.pagehide
        && resumed.pageshow > before.pageshow) break;
    } catch (error) {
      if (error instanceof ProductFailure && error.message.includes('reloaded instead')) throw error;
      lastError = error.message;
    }
    await sleep(50);
  }
  productAssert(resumed?.documentToken === documentToken && resumed.pagehide > before.pagehide
    && resumed.pageshow > before.pageshow,
  `${profile}: persisted pagehide/pageshow did not complete`, { before, resumed, lastError });
  const snapshot = await collectSnapshot({
    send, sessionId, collector, profile, label: `${profile}-bfcache`,
  });
  const point = contractPoint(snapshot);
  return Object.freeze({
    snapshot,
    point: Object.freeze({
      ...point,
      pagehidePersisted: resumed.pagehide === before.pagehide + 1,
      pageshowPersisted: resumed.pageshow === before.pageshow + 1,
      resumed: true,
      appAlive: resumed.appAlive,
      rendererAlive: resumed.rendererAlive,
      stageAlive: resumed.stageAlive,
      documentTokenBefore: documentToken,
      documentTokenAfter: resumed.documentToken,
    }),
  });
}

function bindingPayloadsSince(events, mark, sessionId, name) {
  return events.slice(mark)
    .filter((event) => event.sessionId === sessionId
      && event.method === 'Runtime.bindingCalled' && event.params?.name === name)
    .map((event) => {
      try { return JSON.parse(event.params.payload); }
      catch { return { schema: 'invalid-json', payload: event.params?.payload ?? null }; }
    });
}

async function collectReloadCleanup({
  collector, sessionId, profile, documentToken, veteranRaw, bindingEvents,
}) {
  const precondition = await collector.evaluate(sessionId, `(()=>{const S=window.__CF_SLICE__;
    return {documentToken:S.documentToken,...(${surfaceVistaState.toString()})(S.api.sceneResourceDiagnostics())}})()`,
  'surface vista reload precondition');
  productAssert(precondition?.documentToken === documentToken
    && precondition.surfaceVistaWorkerActive === false
    && precondition.surfaceVistaMounted === false
    && precondition.surfaceVistaCacheEntries === SURFACE_VISTA_CACHE_ENTRIES_MAX
    && precondition.surfaceVistaCachePixels > 0
    && precondition.surfaceVistaCachePixels <= SURFACE_VISTA_CACHE_PIXELS_MAX,
  `${profile}: surface vista reload precondition was not a settled exercised cache`, precondition);
  const mark = bindingEvents.length;
  const armed = await collector.evaluate(sessionId, `(()=>{const S=window.__CF_SLICE__,
    binding=globalThis[${JSON.stringify(SURFACE_VISTA_RELOAD_CLEANUP_BINDING)}],
    nativeClear=Map.prototype.clear,
    state=()=>{const r=S.api.sceneResourceDiagnostics();return {
      surfaceVistaWorkerActive:r.surfaceVistaWorkerActive,
      surfaceVistaMounted:r.surfaceVistaMounted,
      surfaceVistaCacheEntries:r.surfaceVistaCacheEntries,
      surfaceVistaCachePixels:r.surfaceVistaCachePixels}};
    if(typeof binding!=='function'||nativeClear.__cfSceneMemoryVistaCleanup===true)return {armed:false};
    let emitted=false;
    const wrapped=function(){let before=null,after=null;
      try{before=state()}catch{}const result=nativeClear.call(this);try{after=state()}catch{}
      if(!emitted&&before?.surfaceVistaCacheEntries>0&&after?.surfaceVistaCacheEntries===0){
        emitted=true;Map.prototype.clear=nativeClear;
        binding(JSON.stringify({schema:'cf-v2-scene-memory-vista-cache-transition/v1',
          documentToken:S.documentToken,before,after}));}
      return result};
    Object.defineProperty(wrapped,'__cfSceneMemoryVistaCleanup',{value:true});
    Map.prototype.clear=wrapped;return {armed:true,initial:state()}})()`,
  'arm surface vista reload cleanup binding');
  productAssert(armed?.armed === true && same(armed.initial, surfaceVistaState(precondition)),
    `${profile}: surface vista reload cleanup binding did not arm`, armed);
  const importOutcome = await collector.evaluate(sessionId,
    `window.__CF_SLICE__.api.importBlob(${JSON.stringify(veteranRaw)},'scenemem-reload-cleanup')`,
    'request intentional replacement reload');
  productAssert(importOutcome === null,
    `${profile}: intentional replacement import was rejected`, importOutcome);

  const deadline = performance.now() + ART_TIMEOUT_MS;
  let replacement = null;
  let lastError = null;
  while (performance.now() < deadline) {
    try {
      replacement = await collector.evaluate(sessionId, `(()=>{const S=window.__CF_SLICE__;
        if(!S?.api||S.documentToken===${JSON.stringify(documentToken)})return null;
        const s=S.api.state(),r=S.api.sceneResourceDiagnostics();return s.tickerTicks>0
          &&r.pendingSurfaceRefreshes===0&&r.pendingSystemRefreshes===0
          &&r.pendingPersistenceWrites===0?{documentToken:S.documentToken,
            surfaceVistaWorkerActive:r.surfaceVistaWorkerActive,
            surfaceVistaMounted:r.surfaceVistaMounted,
            surfaceVistaCacheEntries:r.surfaceVistaCacheEntries,
            surfaceVistaCachePixels:r.surfaceVistaCachePixels}:null})()`,
      'replacement document readiness');
    } catch (error) { lastError = error.message; }
    const transitions = bindingPayloadsSince(
      bindingEvents, mark, sessionId, SURFACE_VISTA_RELOAD_CLEANUP_BINDING,
    );
    const releases = bindingPayloadsSince(
      bindingEvents, mark, sessionId, RELOAD_RELEASE_BINDING,
    );
    if (replacement && transitions.length >= 1 && releases.length >= 1) break;
    await sleep(50);
  }
  const transitions = bindingPayloadsSince(
    bindingEvents, mark, sessionId, SURFACE_VISTA_RELOAD_CLEANUP_BINDING,
  );
  const releases = bindingPayloadsSince(bindingEvents, mark, sessionId, RELOAD_RELEASE_BINDING);
  productAssert(replacement && transitions.length === 1 && releases.length === 1,
    `${profile}: reload cleanup did not yield one cache transition, one release, and one replacement`,
    { replacement, transitions, releases, lastError });
  const release = releases[0];
  return Object.freeze({
    schema: 'cf-v2-scene-memory-reload-cleanup/v1',
    documentTokenBefore: documentToken,
    documentTokenAfter: replacement.documentToken,
    release: Object.freeze({
      schema: release.schema, status: release.status, error: release.error,
      reason: release.reason, documentToken: release.documentToken,
      rendererReleased: release.rendererReleased, stageReleased: release.stageReleased,
      viewDetached: release.viewDetached,
    }),
    cacheTransition: Object.freeze(transitions[0]),
    replacement: Object.freeze(replacement),
  });
}

function leastSquaresSlope(values) {
  assert(Array.isArray(values) && values.length === WARM_CYCLES
    && values.every((value) => Number.isFinite(value) && value >= 0),
  'heap slope requires four nonnegative measured samples');
  const xMean = (values.length - 1) / 2;
  const yMean = values.reduce((sum, value) => sum + value, 0) / values.length;
  let numerator = 0;
  let denominator = 0;
  for (let index = 0; index < values.length; index++) {
    const xDelta = index - xMean;
    numerator += xDelta * (values[index] - yMean);
    denominator += xDelta * xDelta;
  }
  assert(denominator > 0, 'heap slope denominator is empty');
  return numerator / denominator;
}

function metricSummary(measurement) {
  const points = [measurement.precondition, ...measurement.cycles, measurement.bfcache].filter(Boolean);
  const warmAggregates = measurement.cycles.map((point) => point.heap.usedSize
    + point.heap.embedderHeapUsedSize + point.heap.backingStorageSize);
  const warmHeapSlope = Math.max(0, ...[
    measurement.cycles.map((point) => point.heap.usedSize),
    measurement.cycles.map((point) => point.heap.embedderHeapUsedSize),
    measurement.cycles.map((point) => point.heap.backingStorageSize),
    warmAggregates,
  ].map(leastSquaresSlope));
  const max = (select) => Math.max(...points.map(select));
  return Object.freeze({
    heapUsedBytesMax: max((point) => point.heap.usedSize),
    embedderHeapUsedBytesMax: max((point) => point.heap.embedderHeapUsedSize),
    backingStorageBytesMax: max((point) => point.heap.backingStorageSize),
    heapAggregateBytesMax: max((point) => point.heap.usedSize
      + point.heap.embedderHeapUsedSize + point.heap.backingStorageSize),
    warmHeapAggregateRangeBytesMax: Math.max(...warmAggregates) - Math.min(...warmAggregates),
    warmHeapSlopeBytesPerCycleMax: warmHeapSlope,
    documentsMax: max((point) => point.dom.documents),
    nodesMax: max((point) => point.dom.nodes),
    jsEventListenersMax: max((point) => point.dom.jsEventListeners),
    peakActiveLeaseCountMax: max((point) => point.registry.peakActiveLeaseCount),
    peakLiveTextureCountMax: max((point) => point.registry.peakLiveTextureCount),
    peakLiveCanvasBytesMax: max((point) => point.registry.peakLiveCanvasBytes),
    managedTextureCountMax: max((point) => point.managedTextureCount),
    managedTexturePixelsMax: max((point) => point.managedTexturePixels),
    localCanvasCacheEntriesMax: max((point) => point.localCanvasCacheEntries),
    peakLocalCanvasCacheEntriesMax: max((point) => point.peakLocalCanvasCacheEntries),
    productRenderTargetsMax: max((point) => point.productRenderTargets),
    ringCacheEntriesMax: max((point) => point.ringCacheEntries),
    peakRingGeometryEntriesMax: max((point) => point.peakRingGeometryEntries),
    surfaceVistaCacheEntriesMax: max((point) => point.surfaceVistaCacheEntries),
    surfaceVistaCachePixelsMax: max((point) => point.surfaceVistaCachePixels),
    targetElapsedMsMax: max((point) => point.answerability.target.elapsedMs),
    heartbeatElapsedMsMax: max((point) => point.answerability.heartbeat.elapsedMs),
  });
}

function calibrationBudget(metrics) {
  return Object.freeze(Object.fromEntries(BUDGET_FIELDS.map((field) => {
    const observed = metrics[field];
    assert(Number.isFinite(observed) && observed >= 0,
      `calibration metric ${field} is absent or invalid`);
    const ceiling = Math.ceil(observed)
      + (field === 'targetElapsedMsMax' || field === 'heartbeatElapsedMsMax' ? 1 : 0);
    return [field, ceiling];
  })));
}

async function collectProfile({
  send, origin, fixture, veteranRaw, profile, viewport, fatalEvents, sessionProfiles,
  bindingEvents, onProgress,
}) {
  const measurement = {
    schema: 'cf-v2-scene-memory-profile/v1', profile, viewport,
    targetId: null, documentToken: null, initial: null, warmup: null, precondition: null,
    initialVista: null, firstSurfaceVista: null, surfaceVistaObservations: [],
    warmupInventory: null, measured: [], cycles: [], bfcache: null, bfcacheSnapshot: null,
    reloadCleanup: null, routeInventories: [], metrics: null,
  };
  let browserContextId = null;
  let targetId = null;
  let sessionId = null;
  let primaryError = null;
  try {
    const context = await send('Target.createBrowserContext');
    browserContextId = context.browserContextId;
    const target = await send('Target.createTarget', {
      url: 'about:blank', browserContextId,
    });
    targetId = target.targetId;
    measurement.targetId = targetId;
    const attached = await send('Target.attachToTarget', { targetId, flatten: true });
    sessionId = attached.sessionId;
    sessionProfiles.set(sessionId, profile);
    for (const method of ['Runtime.enable', 'Page.enable', 'HeapProfiler.enable', 'Log.enable']) {
      await send(method, {}, sessionId, { timeoutMs: COMMAND_TIMEOUT_MS });
    }
    await send('Runtime.addBinding', { name: RELOAD_RELEASE_BINDING }, sessionId, {
      timeoutMs: COMMAND_TIMEOUT_MS,
    });
    await send('Runtime.addBinding', {
      name: SURFACE_VISTA_RELOAD_CLEANUP_BINDING,
    }, sessionId, { timeoutMs: COMMAND_TIMEOUT_MS });
    await send('Emulation.setDeviceMetricsOverride', {
      width: viewport.width, height: viewport.height,
      deviceScaleFactor: viewport.dpr, mobile: viewport.mobile,
    }, sessionId, { timeoutMs: COMMAND_TIMEOUT_MS });
    await send('Emulation.setTouchEmulationEnabled', profile === 'phone'
      ? { enabled: true, maxTouchPoints: 5 } : { enabled: false },
    sessionId, { timeoutMs: COMMAND_TIMEOUT_MS });
    const collector = makeCollector(send, profile);
    await seedSave({ send, collector, sessionId, origin, veteranRaw, profile });
    const boot = await navigateGame({ send, collector, sessionId, origin, profile });
    measurement.documentToken = boot.documentToken;
    const installed = await collector.evaluate(sessionId,
      `window.__CF_SLICE__.api.__compendiumEvidence.installFixture(${JSON.stringify(fixture.rows)})`,
      'install exact Compendium fixture');
    productAssert(installed?.installed === fixture.count,
      `${profile}: fixture installed ${String(installed?.installed)} of ${fixture.count}`, installed);
    measurement.initial = await collectSnapshot({
      send, sessionId, collector, profile, label: `${profile}-initial`,
    });
    measurement.initialVista = surfaceVistaState(measurement.initial.raw.scene);
    onProgress(measurement);

    for (let index = 0; index < WARMUP_CYCLES; index++) {
      const warmupRoute = await driveCycle({ collector, sessionId, profile });
      measurement.warmupInventory = warmupRoute.inventory;
      measurement.surfaceVistaObservations.push(warmupRoute.surfaceVistaObservation);
      if (index === 0) {
        measurement.firstSurfaceVista = surfaceVistaState(warmupRoute.surfaceVistaObservation);
      }
      measurement.routeInventories.push(routeInventory(warmupRoute.stages));
      measurement.warmup = await collectSnapshot({
        send, sessionId, collector, profile, label: `${profile}-warmup-${index + 1}`,
      });
      onProgress(measurement);
    }
    measurement.precondition = contractPoint(measurement.warmup);
    productAssert(measurement.precondition.registry.observationWindow === 0,
      `${profile}: warmup changed the registry observation window`, measurement.precondition.registry);
    onProgress(measurement);

    for (let index = 0; index < WARM_CYCLES; index++) {
      await collector.evaluate(sessionId,
        `window.__CF_SLICE__.api.__sceneEvidence.beginObservationWindow()`,
        `begin measured observation window ${index + 1}`);
      const driven = await driveCycle({ collector, sessionId, profile });
      measurement.surfaceVistaObservations.push(driven.surfaceVistaObservation);
      measurement.routeInventories.push(routeInventory(driven.stages));
      const snapshot = await collectSnapshot({
        send, sessionId, collector, profile, label: `${profile}-warm-${index + 1}`,
      });
      measurement.measured.push(snapshot);
      measurement.cycles.push(Object.freeze({
        cycle: index + 1,
        inventory: driven.inventory,
        ...contractPoint(snapshot),
      }));
      onProgress(measurement);
    }
    const bfcacheEvidence = await collectBfcache({
      send, collector, sessionId, profile, documentToken: measurement.documentToken,
    });
    measurement.bfcache = bfcacheEvidence.point;
    measurement.bfcacheSnapshot = bfcacheEvidence.snapshot;
    onProgress(measurement);
    measurement.reloadCleanup = await collectReloadCleanup({
      collector, sessionId, profile, documentToken: measurement.documentToken,
      veteranRaw, bindingEvents,
    });
    onProgress(measurement);
    measurement.metrics = metricSummary(measurement);
    const profileFatals = fatalEvents.filter((event) => event.profile === profile);
    productAssert(profileFatals.length === 0,
      `${profile}: browser reported fatal/console-error events`, profileFatals);
    return measurement;
  } catch (error) {
    primaryError = error;
    throw error;
  } finally {
    const cleanup = [];
    if (targetId) {
      try {
        const closed = await send('Target.closeTarget', { targetId }, undefined, {
          timeoutMs: COMMAND_TIMEOUT_MS,
        });
        if (closed?.success !== true) cleanup.push('Target.closeTarget did not confirm success');
      } catch (error) { cleanup.push(`Target.closeTarget: ${error.message}`); }
    }
    if (browserContextId) {
      try {
        await send('Target.disposeBrowserContext', { browserContextId }, undefined, {
          timeoutMs: COMMAND_TIMEOUT_MS,
        });
      } catch (error) { cleanup.push(`Target.disposeBrowserContext: ${error.message}`); }
    }
    if (sessionId) sessionProfiles.delete(sessionId);
    if (cleanup.length) {
      const error = new Error(`${profile} target cleanup failed: ${cleanup.join('; ')}`);
      if (primaryError) error.cause = primaryError;
      throw error;
    }
  }
}

function browserSample(browser) {
  return Object.freeze({
    executable: browser.executable, product: browser.product, revision: browser.revision,
    userAgent: browser.user_agent, jsVersion: browser.js_version,
    protocolVersion: browser.protocol_version,
  });
}

function makeRunningReport({ id, startedAt, source, inputs, mode, budgetFile }) {
  return {
    schema: REPORT_SCHEMA, status: 'running', runId: id,
    lifecycle: { schema: LIFECYCLE_SCHEMA, status: 'pending' },
    startedAt: startedAt.toISOString(), endedAt: null, durationMs: null,
    policy: {
      attemptCount: 1, automaticRetries: 0, warmupCycles: WARMUP_CYCLES,
      measuredWarmCycles: WARM_CYCLES, commandTimeoutMs: COMMAND_TIMEOUT_MS,
      targetTimeoutMs: ANSWERABILITY_TIMEOUT_MS,
      heartbeatTimeoutMs: ANSWERABILITY_TIMEOUT_MS,
    },
    scope: {
      covered: [...SCENE_MEMORY_ROUTES],
      shipyardStatus: 'implemented-static',
      excluded: ['Shipyard build writers', 'audio lifecycle', 'true GPU bytes'],
    },
    certification: mode,
    source: { begin: source, end: source }, inputs,
    build: null, browser: null,
    fixture: { count: 1500, rowsSha256: inputs.fixtureRows },
    budget: budgetFile ? { schema: BUDGET_SCHEMA, path: portable(budgetFile), sha256: inputs.budget }
      : { schema: null, path: null, sha256: null },
    profiles: {}, contractInput: null, verdict: null, outcomes: [], findings: [], fatalEvents: [],
    cleanup: { browser: false, server: false, workspaceLock: false },
  };
}

function terminalReport(running, {
  status, startedAt, sourceEnd, build, browser, profiles, outcomes, findings,
  contractInput, verdict, fatalEvents, cleanup, lifecycleStatus,
}) {
  const endedAt = new Date();
  return {
    ...running, status,
    lifecycle: { schema: LIFECYCLE_SCHEMA, status: lifecycleStatus },
    endedAt: endedAt.toISOString(), durationMs: endedAt.getTime() - startedAt.getTime(),
    source: { begin: running.source.begin, end: sourceEnd }, build,
    browser, profiles, contractInput, verdict, outcomes, findings, fatalEvents, cleanup,
  };
}

function unavailableSource(reason) {
  const digest = sha256(String(reason));
  return Object.freeze({
    commit: null, branch: 'unavailable', state: 'unavailable',
    statusSha256: digest, workingTreeSha256: digest,
  });
}

export async function sceneMemoryCollectProfilesOnce(collect) {
  assert(typeof collect === 'function', 'SceneMemory profile collector must be a function');
  const measurements = {};
  for (const [profile, viewport] of Object.entries(PROFILES)) {
    measurements[profile] = await collect(profile, viewport);
  }
  return Object.freeze(measurements);
}

async function runGate(options) {
  const releaseLock = acquireWorkspaceLock('v2 Arc 1C scene memory/resource evidence');
  let lockOwned = true;
  let server = null;
  let browser = null;
  const cleanup = { browser: false, server: false, workspaceLock: false };
  const cleanupFailures = [];
  const id = runId();
  const startedAt = new Date();
  let sourceBegin = unavailableSource('source identity not captured');
  let inputs = {};
  let build = null;
  let budget = null;
  let authoritativeBudgetFile = null;
  let fixture = null;
  const profiles = {};
  let contractInput = null;
  let verdict = null;
  let outcomes = [];
  let findings = [];
  const fatalEvents = [];
  const bindingEvents = [];
  let running = makeRunningReport({
    id, startedAt, source: sourceBegin, inputs: { fixtureRows: null },
    mode: options.calibrate ? 'calibration-only-not-certified'
      : options.budgetFile ? 'contract-budget' : 'missing-budget-not-certified',
    budgetFile: null,
  });
  atomicWriteJson(reportPath, running);
  let provisionalStatus = 'instrument-fail';
  let provisionalExitCode = 2;
  try {
    assert(options.calibrate || options.budgetFile,
      'normal scene-memory runs require --budget; use --calibrate for non-certifying evidence');
    fixture = buildCompendiumFixture();
    if (options.budgetFile) {
      authoritativeBudgetFile = assertBudgetAuthority(options.budgetFile);
      budget = readJson(authoritativeBudgetFile);
      const validation = validateSceneMemoryBudget(budget);
      assert(validation.ok, `scene memory budget invalid: ${validation.errors.join('; ')}`);
      /* The imported contract is also the only semantic validator for a
         budget. Empty measurements intentionally yield a red verdict but
         must not throw when the budget shape is authoritative. */
      evaluateSceneMemory({
        schema: 'cf-v2-scene-memory-input/v4',
        profiles: { phone: { cycles: [], bfcache: null }, desktop: { cycles: [], bfcache: null } },
        budgets: budget.profiles,
      });
    }
    inputs = exactInputs(fixture, authoritativeBudgetFile);
    sourceBegin = sourceIdentity();
    running = makeRunningReport({
      id, startedAt, source: sourceBegin, inputs,
      mode: options.calibrate ? 'calibration-only-not-certified' : 'contract-budget',
      budgetFile: authoritativeBudgetFile,
    });
    atomicWriteJson(reportPath, running);
    assert(options.allowDirty || sourceBegin.state === 'committed',
      'scene memory evidence requires committed clean source (use --allow-dirty for diagnostic work only)');

    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    execFileSync(npm, ['run', 'build'], { cwd: appDir, stdio: 'inherit' });
    build = distIdentity();
    inputs = exactInputs(fixture, authoritativeBudgetFile, build.sha256);
    running = { ...running, inputs, build };
    atomicWriteJson(reportPath, running);
    server = await serveDist();
    const sessionProfiles = new Map();
    browser = await openChromiumCdp({
      label: 'Arc 1C scene memory/resource gate', userDataPrefix: 'cf-scenemem',
      commandTimeoutMs: COMMAND_TIMEOUT_MS, startupTimeoutMs: 45_000,
      webSocketOpenTimeoutMs: 15_000, shutdownTimeoutMs: 2_000,
      onEvent: (message) => {
        if (message.method === 'Runtime.bindingCalled'
          && (message.params?.name === RELOAD_RELEASE_BINDING
            || message.params?.name === SURFACE_VISTA_RELOAD_CLEANUP_BINDING)) {
          bindingEvents.push(message);
        }
        const fatal = message.method === 'Runtime.exceptionThrown'
          || message.method === 'Inspector.targetCrashed'
          || message.method === 'Target.targetCrashed'
          || message.method === 'Page.backForwardCacheNotUsed'
          || (message.method === 'Runtime.consoleAPICalled' && message.params?.type === 'error')
          || (message.method === 'Log.entryAdded' && message.params?.entry?.level === 'error');
        if (fatal) fatalEvents.push({
          profile: sessionProfiles.get(message.sessionId) || 'unassigned',
          method: message.method, params: message.params || null,
        });
      },
    });
    const launchedBrowser = browserSample(browser.browser);
    running = { ...running, browser: launchedBrowser };
    atomicWriteJson(reportPath, running);
    if (budget) assertBudgetBinding(budget, inputs, launchedBrowser);

    const veteranRaw = sceneMemoryVeteranRaw();
    await sceneMemoryCollectProfilesOnce(async (profile, viewport) => {
      const measurement = await collectProfile({
        send: browser.send, origin: server.origin,
        fixture, veteranRaw, profile, viewport, fatalEvents, sessionProfiles,
        bindingEvents,
        onProgress: (partial) => {
          profiles[profile] = partial;
          running = { ...running, profiles: { ...profiles }, fatalEvents: [...fatalEvents] };
          atomicWriteJson(reportPath, running);
        },
      });
      profiles[profile] = measurement;
      running = {
        ...running, profiles: { ...profiles },
        fatalEvents: [...fatalEvents],
      };
      atomicWriteJson(reportPath, running);
      return measurement;
    });
    const contractBudgets = budget?.profiles ?? Object.fromEntries(
      Object.entries(profiles).map(([profile, measurement]) => [
        profile, calibrationBudget(measurement.metrics),
      ]),
    );
    contractInput = {
      schema: 'cf-v2-scene-memory-input/v4',
      profiles: Object.fromEntries(Object.entries(profiles).map(([profile, measurement]) => [
        profile, {
          initialVista: measurement.initialVista,
          firstSurfaceVista: measurement.firstSurfaceVista,
          precondition: measurement.precondition,
          cycles: measurement.cycles,
          bfcache: measurement.bfcache,
          reloadCleanup: measurement.reloadCleanup,
        },
      ])),
      budgets: contractBudgets,
    };
    productAssert(fatalEvents.length === 0,
      'browser reported fatal/error lifecycle events', fatalEvents);
    verdict = evaluateSceneMemory(contractInput);
    outcomes = [...verdict.outcomes];
    findings = verdict.failures.map((outcome) => `${outcome.id}: ${outcome.message}`);
    if (options.calibrate) {
      provisionalStatus = verdict.status === 'pass' ? 'calibration' : 'fail';
      provisionalExitCode = verdict.status === 'pass' ? 0 : 1;
    } else {
      provisionalStatus = verdict.status;
      provisionalExitCode = verdict.status === 'pass' ? 0 : 1;
      if (verdict.status === 'pass' && sourceBegin.state !== 'committed') {
        provisionalStatus = 'diagnostic';
        findings.push('contract was green, but dirty source cannot certify PASS');
      }
    }
    running = { ...running, contractInput, verdict, outcomes: [...outcomes] };
    atomicWriteJson(reportPath, running);
  } catch (error) {
    findings.push(error.message);
    if (error instanceof ProductFailure) {
      if (error.evidence !== null) findings.push(`product evidence: ${JSON.stringify(error.evidence)}`);
      provisionalStatus = 'fail';
      provisionalExitCode = 1;
    } else {
      provisionalStatus = 'instrument-fail';
      provisionalExitCode = 2;
    }
  }

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
  if (lockOwned) {
    try { releaseLock(); cleanup.workspaceLock = true; lockOwned = false; }
    catch (error) { cleanupFailures.push(`workspace lock cleanup: ${error.message}`); }
  }
  if (cleanupFailures.length) {
    findings.push(...cleanupFailures);
    provisionalStatus = 'instrument-fail';
    provisionalExitCode = 2;
  }
  let sourceEnd = unavailableSource('terminal source identity unavailable');
  try { sourceEnd = sourceIdentity(); }
  catch (error) {
    findings.push(`terminal source identity: ${error.message}`);
    provisionalStatus = 'instrument-fail';
    provisionalExitCode = 2;
  }
  if (!same(sourceBegin, sourceEnd)) {
    findings.push('source identity changed during the scene memory attempt');
    provisionalStatus = 'instrument-fail';
    provisionalExitCode = 2;
  }
  const finalReport = terminalReport(running, {
    status: provisionalStatus, startedAt, sourceEnd, build,
    browser: running.browser, profiles, outcomes, findings,
    contractInput, verdict, fatalEvents, cleanup,
    lifecycleStatus: cleanupFailures.length ? 'failed' : 'complete',
  });
  atomicWriteJson(reportPath, finalReport);
  if (provisionalStatus === 'pass') {
    console.log(`SCENE MEMORY: PASS — ${id}`);
    console.log(`  certification: ${finalReport.certification}`);
    console.log(`  report: ${reportPath}`);
  } else if (provisionalStatus === 'calibration') {
    console.log(`SCENE MEMORY: CALIBRATION ONLY — ${id}`);
    console.log(`  no PASS was certified; supply a checked-in --budget for the contract verdict`);
    console.log(`  report: ${reportPath}`);
  } else {
    console.error(`SCENE MEMORY: ${provisionalStatus.toUpperCase()} — ${id}`);
    for (const finding of findings) console.error(`  ${finding}`);
    console.error(`  report: ${reportPath}`);
  }
  return provisionalExitCode;
}

function surfaceInventoryFromObservation(observation) {
  return {
    mode: observation?.mode === 'surface',
    owner: observation?.surfaceTextureOwnerActive === true,
    scope: Array.isArray(observation?.registry?.activeScopes)
      && observation.registry.activeScopes.some(
        (scope) => scope?.closed === false && scope?.leaseCount > 0,
      ),
    ...surfaceVistaState(observation || {}),
  };
}

export function sceneMemoryProfileRawBindingErrors(measurement) {
  const errors = [];
  try {
    if (!measurement?.initial || !same(
      measurement.initialVista,
      surfaceVistaState(measurement.initial.raw?.scene || {}),
    )) errors.push('initial vista evidence is detached from its raw snapshot');
    if (!measurement?.warmup || !same(
      measurement.precondition,
      contractPoint(measurement.warmup),
    )) errors.push('precondition is detached from its raw warmup snapshot');
    if (!Array.isArray(measurement?.surfaceVistaObservations)
      || measurement.surfaceVistaObservations.length !== WARMUP_CYCLES + WARM_CYCLES) {
      errors.push('surface vista observation inventory is incomplete');
    } else {
      if (!same(
        measurement.firstSurfaceVista,
        surfaceVistaState(measurement.surfaceVistaObservations[0]),
      )) errors.push('first surface vista evidence is detached from its raw observation');
      for (const [index, observation] of measurement.surfaceVistaObservations.entries()) {
        const inventory = surfaceInventoryFromObservation(observation);
        if (inventory.mode !== true || inventory.owner !== true || inventory.scope !== true
          || !same(surfaceVistaState(observation), measurement.firstSurfaceVista)) {
          errors.push(`surface vista observation ${index + 1} drifted from the exercised surface`);
        }
      }
      for (let index = 0; index < WARM_CYCLES; index++) {
        const surface = measurement.cycles?.[index]?.inventory?.surface;
        const observation = measurement.surfaceVistaObservations[WARMUP_CYCLES + index];
        if (!same(surface, surfaceInventoryFromObservation(observation))) {
          errors.push(`cycle ${index + 1} surface vista evidence is detached from its raw observation`);
        }
      }
    }
    if (!Array.isArray(measurement?.measured) || measurement.measured.length !== WARM_CYCLES
      || !Array.isArray(measurement?.cycles) || measurement.cycles.length !== WARM_CYCLES) {
      errors.push('measured snapshot inventory is incomplete');
    } else {
      for (let index = 0; index < WARM_CYCLES; index++) {
        const { cycle, inventory, ...point } = measurement.cycles[index];
        void cycle;
        void inventory;
        if (!same(point, contractPoint(measurement.measured[index]))) {
          errors.push(`cycle ${index + 1} is detached from its raw snapshot`);
        }
      }
    }
    if (!measurement?.bfcacheSnapshot || !measurement?.bfcache) {
      errors.push('bfcache raw snapshot is absent');
    } else {
      const {
        pagehidePersisted, pageshowPersisted, resumed, appAlive, rendererAlive, stageAlive,
        documentTokenBefore, documentTokenAfter, ...point
      } = measurement.bfcache;
      void pagehidePersisted;
      void pageshowPersisted;
      void resumed;
      void appAlive;
      void rendererAlive;
      void stageAlive;
      void documentTokenBefore;
      void documentTokenAfter;
      if (!same(point, contractPoint(measurement.bfcacheSnapshot))) {
        errors.push('bfcache point is detached from its raw snapshot');
      }
    }
  } catch (error) {
    errors.push(`raw profile binding could not be re-derived (${error instanceof Error
      ? error.message : String(error)})`);
  }
  return errors;
}

export function terminalProfileEvidenceErrors(profiles, surfaceVistaRequired = false) {
  const errors = [];
  const profileKeys = Object.keys(profiles || {}).sort();
  if (!same(profileKeys, Object.keys(PROFILES).sort())) {
    errors.push('phone/desktop profile inventory is incomplete');
  }
  for (const profile of Object.keys(PROFILES)) {
    const measurement = profiles?.[profile];
    if (!measurement || measurement.profile !== profile
      || !same(measurement.viewport, PROFILES[profile])
      || !measurement.precondition
      || !Array.isArray(measurement.measured) || measurement.measured.length !== WARM_CYCLES
      || !Array.isArray(measurement.cycles) || measurement.cycles.length !== WARM_CYCLES
      || !measurement.bfcache
      || !Array.isArray(measurement.routeInventories)
      || measurement.routeInventories.length !== WARMUP_CYCLES + WARM_CYCLES) {
      errors.push(`${profile} terminal profile evidence is incomplete, mismatched, or red`);
    }
    if (surfaceVistaRequired) {
      if (!measurement?.initialVista || !measurement?.firstSurfaceVista
        || !measurement?.reloadCleanup || !measurement?.bfcacheSnapshot
        || !Array.isArray(measurement?.surfaceVistaObservations)
        || measurement.surfaceVistaObservations.length !== WARMUP_CYCLES + WARM_CYCLES) {
        errors.push(`${profile} surface vista evidence is incomplete`);
      } else {
        errors.push(...sceneMemoryProfileRawBindingErrors(measurement)
          .map((error) => `${profile} ${error}`));
      }
    }
  }
  return errors;
}

function verifyReport(report, expectedRunId, options) {
  const errors = [];
  const surfaceVistaRequired = report?.contractInput?.schema === 'cf-v2-scene-memory-input/v4';
  let authoritativeBudgetFile = null;
  if (report?.schema !== REPORT_SCHEMA) errors.push(`schema must be ${REPORT_SCHEMA}`);
  if (report?.runId !== expectedRunId) errors.push('report runId does not match --verify-run');
  if (report?.status !== 'pass') errors.push(`report status is ${String(report?.status)}, not pass`);
  if (report?.lifecycle?.schema !== LIFECYCLE_SCHEMA
    || report?.lifecycle?.status !== 'complete') errors.push('report lifecycle is not complete');
  if (report?.policy?.attemptCount !== 1 || report?.policy?.automaticRetries !== 0
    || report?.policy?.warmupCycles !== WARMUP_CYCLES
    || report?.policy?.measuredWarmCycles !== WARM_CYCLES) {
    errors.push('one-attempt/warm-cycle policy drifted');
  }
  if (!same(report?.cleanup, { browser: true, server: true, workspaceLock: true })) {
    errors.push('terminal cleanup is incomplete');
  }
  errors.push(...terminalProfileEvidenceErrors(report?.profiles, surfaceVistaRequired));
  errors.push(...terminalOutcomeInventoryErrors(
    report?.outcomes, null, surfaceVistaRequired ? OUTCOME_COUNT : 42,
  ));
  errors.push(...terminalPassEvidenceErrors(report?.fatalEvents, report?.findings));
  if (report?.certification !== 'contract-budget') {
    errors.push('report certification must be contract-budget');
  }
  if (!surfaceVistaRequired) {
    errors.push('terminal certification requires the current surface-vista input contract');
  }
  if (!options.budgetFile) errors.push('verification requires the same tracked --budget');
  else {
    try {
      authoritativeBudgetFile = assertBudgetAuthority(options.budgetFile);
      const currentBudget = readJson(authoritativeBudgetFile);
      const validation = validateSceneMemoryBudget(currentBudget);
      if (!validation.ok) errors.push(...validation.errors);
      const expectedReportBudget = {
        schema: BUDGET_SCHEMA,
        path: portable(authoritativeBudgetFile),
        sha256: hashFile(authoritativeBudgetFile),
      };
      if (!same(report?.budget, expectedReportBudget)) {
        errors.push('report budget authority path/schema/hash drifted');
      }
      if (!same(report?.contractInput?.budgets, currentBudget.profiles)) {
        errors.push('contract input budget differs from the supplied authority');
      }
    } catch (error) { errors.push(`budget authority failed: ${error.message}`); }
  }
  try {
    if (!report?.contractInput || !report?.verdict) errors.push('contract input/verdict is absent');
    else {
      const expectedProfiles = Object.fromEntries(Object.entries(report.profiles || {})
        .map(([profile, measurement]) => [profile, {
          ...(surfaceVistaRequired ? {
            initialVista: measurement.initialVista,
            firstSurfaceVista: measurement.firstSurfaceVista,
          } : {}),
          precondition: measurement.precondition,
          cycles: measurement.cycles,
          bfcache: measurement.bfcache,
          ...(surfaceVistaRequired ? { reloadCleanup: measurement.reloadCleanup } : {}),
        }]));
      if (!same(report.contractInput.profiles, expectedProfiles)) {
        errors.push('contract input is detached from the collected profile evidence');
      }
      const recomputed = evaluateSceneMemory(report.contractInput);
      if (!same(recomputed, report.verdict) || recomputed.status !== 'pass') {
        errors.push('imported contract verdict is stale or red');
      }
      errors.push(...terminalOutcomeInventoryErrors(
        report.outcomes, recomputed.outcomes, surfaceVistaRequired ? OUTCOME_COUNT : 42,
      ));
    }
  } catch (error) { errors.push(`contract replay failed: ${error.message}`); }
  try {
    const fixture = buildCompendiumFixture();
    const currentBuild = distIdentity();
    if (!same(report?.build, currentBuild)) errors.push('built product graph authority drifted');
    const inputs = exactInputs(fixture, authoritativeBudgetFile, currentBuild.sha256);
    if (!same(report?.inputs, inputs)) errors.push('collector/fixture/dependency input authority drifted');
    if (authoritativeBudgetFile) {
      assertBudgetBinding(readJson(authoritativeBudgetFile), inputs, report.browser);
    }
    const currentSource = sourceIdentity();
    errors.push(...terminalSourceAuthorityErrors(
      report?.source?.begin,
      report?.source?.end,
      currentSource,
    ));
  } catch (error) { errors.push(`current authority check failed: ${error.message}`); }
  return { ok: errors.length === 0, errors };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.verifyRun !== null) {
    let report;
    try { report = readJson(reportPath); }
    catch (error) {
      console.error(`SCENE MEMORY VERIFY: FAIL — cannot read ${reportPath} (${error.message})`);
      return 2;
    }
    const verified = verifyReport(report, options.verifyRun, options);
    if (!verified.ok) {
      console.error(`SCENE MEMORY VERIFY: FAIL — ${options.verifyRun}`);
      for (const error of verified.errors) console.error(`  ${error}`);
      return 1;
    }
    console.log(`SCENE MEMORY VERIFY: PASS — ${options.verifyRun}`);
    return 0;
  }
  return await runGate(options);
}

if (process.argv[1] && path.resolve(process.argv[1]) === collectorPath) {
  process.exitCode = await main();
}

export { verifyReport };
