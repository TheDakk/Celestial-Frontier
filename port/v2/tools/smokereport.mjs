/* smokereport.mjs — CI-facing evidence wrapper for slicesmoke.mjs.

   The gameplay harness remains the authority and runs exactly once. This
   wrapper captures its complete output, writes a machine-readable report and
   a raw log even on failure, and prints only the first scoped diagnostic plus
   a related-count summary. It never retries a red run.

   Usage:
     node tools/smokereport.mjs
     node tools/smokereport.mjs --verify-run=<immutable-run-id> */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { findChromiumBrowser } from './browserpath.mjs';
import { acquireWorkspaceLock, workspaceLockChildEnvironment } from './workspacelock.mjs';
import {
  assessInventoryActionActivation,
  assessInventoryDetailClose,
  assessInventoryPanelClose,
  assessInventoryReloadDurability,
  assessInventoryRowActivation,
  assessInventoryRowReachability,
  assessInventoryStagePrefix,
  assessTrainingBusyRefusalPrecondition,
  classifyCompendiumDetailReceipt,
  classifyCompendiumDetailSettlement,
  classifyForegroundServiceTurnReceipt,
  classifyPlanetsideSettlement,
  planetsidePhaseRemainingMs,
  planetsideRuntimeTimeoutDecision,
  SLICE_SCREENSHOT_LOGICAL_NAMES,
  trainingBindingReceiptBeforeDeadline,
} from './slicesmoke-contract.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const v2Root = path.resolve(here, '..');
const repoRoot = path.resolve(v2Root, '..', '..');
const outputRoot = path.join(v2Root, 'apps', 'game', 'smoke');
const currentReportPath = path.join(outputRoot, 'slice-smoke-report.json');
const currentLogPath = path.join(outputRoot, 'slice-smoke.log');
const RUN_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,95}$/i;
const SCREENSHOT_MANIFEST_FIELDS = Object.freeze([
  'bytes', 'logicalName', 'name', 'path', 'sha256',
]);
const BROWSER_PROVENANCE_FIELDS = Object.freeze([
  'executable', 'resolutionError', 'version',
]);
const CHROMIUM_COMMAND_VERSION = /^(?:Microsoft Edge|Google Chrome(?: for Testing)?|Chromium) [1-9]\d*(?:\.\d+){1,3}(?=$| )/;
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const ARC4_LEDGER_PREFIX = 'SLICE SMOKE ARC 4 LEDGER: ';
const ARC4_LEDGER_STAGES = Object.freeze([
  'precondition',
  'pending-no-optimism',
  'hit',
  'storage-refusal',
  'stale-convergence',
  'miss',
  'burn-down',
  'disabled-suppression',
  'publication-convergence',
]);
const ARC4_LEDGER = Object.freeze({
  schema: 'cf-v2-slice-arc4-ledger/v1',
  stages: ARC4_LEDGER_STAGES,
  burnSteps: 14,
  recoveryClaimed: false,
  ok: true,
});
const ARC4_LEDGER_LINE = ARC4_LEDGER_PREFIX + JSON.stringify(ARC4_LEDGER);
const ARC4_PASS_MARKER = 'SLICE SMOKE ARC 4: PASS — Pertar seed-68 native hidden Sample hit and counter-1 Tame miss · held no-optimism · exact raw v5/18 Arc 4 namespaces + independent source-bound compact Arc 5 V2 manifest/four fixed delta shards/source-delta-target fixed point/all-five successor/v1→v2 boot upgrade/aligned V2 zero-write/F4/receipt authority · storage/stale/publication convergence · finite Worked Out disabled suppression; 20-minute next-cycle recovery is not claimed by this browser run.';

function sha256(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function assertRunId(runId) {
  if (!RUN_ID_PATTERN.test(runId || '')) throw new Error(`invalid slice-smoke run ID: ${JSON.stringify(runId)}`);
  return runId;
}
function runArtifactPaths(runId, directory = outputRoot) {
  assertRunId(runId);
  return {
    report: path.join(directory, `slice-smoke-${runId}.json`),
    log: path.join(directory, `slice-smoke-${runId}.log`),
    reportRelative: `apps/game/smoke/slice-smoke-${runId}.json`,
    logRelative: `apps/game/smoke/slice-smoke-${runId}.log`,
  };
}
function atomicWriteFile(targetPath, bytes) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  const temporary = path.join(path.dirname(targetPath), `.${path.basename(targetPath)}.${process.pid}.${crypto.randomBytes(6).toString('hex')}.tmp`);
  try {
    fs.writeFileSync(temporary, bytes, { flag: 'wx' });
    fs.renameSync(temporary, targetPath);
  } finally {
    try { fs.unlinkSync(temporary); } catch { /* rename or prior cleanup already removed it */ }
  }
}
function atomicCreateFile(targetPath, bytes) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  const temporary = path.join(path.dirname(targetPath), `.${path.basename(targetPath)}.${process.pid}.${crypto.randomBytes(6).toString('hex')}.tmp`);
  try {
    fs.writeFileSync(temporary, bytes, { flag: 'wx' });
    fs.linkSync(temporary, targetPath);
  } finally {
    try { fs.unlinkSync(temporary); } catch { /* link/create failure cleanup */ }
  }
}
function atomicWriteJson(targetPath, value) {
  atomicWriteFile(targetPath, JSON.stringify(value, null, 2) + '\n');
}
function sameExactSource(left, right) {
  return !!left && !!right && left.commit === right.commit && left.branch === right.branch
    && left.state === right.state && left.statusSha256 === right.statusSha256
    && left.workingTreeSha256 === right.workingTreeSha256;
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
  const observedRoot = fs.realpathSync(
    String(gitCommand(['rev-parse', '--show-toplevel'])).trim(),
  );
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
  if (/^harness:/i.test(message)) return 'harness';
  const prefix = message.match(/^([A-Z][A-Z0-9 /_-]{1,48})(?::| —)/);
  if (prefix) return prefix[1].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (/CONTROL FAILED/i.test(message)) return 'instrument-control';
  if (/browser|CDP|timed out|timeout|\blisten\b|EPERM|EADDRINUSE/i.test(message)) return 'harness';
  return 'core-flow';
}
function failureDeclaration(line) {
  const match = line.match(/^SLICE SMOKE: FAIL — (\d+) (finding|findings)$/)
    || line.match(/^SLICE SMOKE: FAIL \((\d+) (finding|findings)\)$/);
  if (!match) return null;
  return { count: Number(match[1]), noun: match[2] };
}
function parseFailureEvidence(output, status) {
  const lines = output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  /* Only bullets owned by the harness's explicit failure block are product
     findings. Vite also prints generic `- Using dynamic import…` advice;
     treating those lines as the failure once hid a later `listen EPERM`. */
  const markerIndexes = lines.flatMap((line, index) => /^SLICE SMOKE: FAIL\b/.test(line) ? [index] : []);
  const detailIndexes = lines.flatMap((line, index) => line === 'SLICE SMOKE: FAILURE DETAILS' ? [index] : []);
  const detailIndex = detailIndexes[0] ?? -1;
  const bullets = detailIndex >= 0
    ? lines.slice(detailIndex + 1).filter((line) => /^- /.test(line)).map((line) => line.slice(2))
    : [];
  const diagnostics = [];
  if (markerIndexes.length === 0 && detailIndexes.length !== 0) {
    diagnostics.push(`harness: SLICE SMOKE FAILURE DETAILS has no failure declaration (${detailIndexes.length} blocks)`);
  }
  if (markerIndexes.length) {
    if (markerIndexes.length !== 1) {
      diagnostics.push(`harness: expected one SLICE SMOKE failure declaration, observed ${markerIndexes.length}`);
    }
    if (detailIndexes.length !== 1) {
      diagnostics.push(`harness: expected one SLICE SMOKE FAILURE DETAILS block, observed ${detailIndexes.length}`);
    }
    for (const markerIndex of markerIndexes) {
      const declaration = lines[markerIndex];
      const parsed = failureDeclaration(declaration);
      if (!parsed) {
        diagnostics.push(`harness: malformed SLICE SMOKE failure declaration ${JSON.stringify(declaration)}`);
        continue;
      }
      const declaredCount = parsed.count;
      if (!Number.isSafeInteger(declaredCount) || declaredCount < 1) {
        diagnostics.push(`harness: invalid SLICE SMOKE declared finding count ${JSON.stringify(declaredCount)}`);
      } else {
        if (parsed.noun !== (declaredCount === 1 ? 'finding' : 'findings')) {
          diagnostics.push(`harness: SLICE SMOKE declared finding grammar drifted for count ${declaredCount}`);
        }
        if (declaredCount !== bullets.length) {
          diagnostics.push(`harness: SLICE SMOKE declared ${declaredCount} findings but FAILURE DETAILS contains ${bullets.length} bullets`);
        }
      }
    }
    if (status === 0) {
      diagnostics.push('harness: slice smoke exited 0 while declaring failure');
    }
  }
  if (status === 0 && markerIndexes.length === 0 && detailIndexes.length === 0) {
    return { findings: [], diagnostics, declaredCount: null, bulletCount: 0 };
  }
  if (bullets.length) {
    const firstDeclaration = markerIndexes.length === 1
      ? failureDeclaration(lines[markerIndexes[0]]) : null;
    return {
      findings: bullets,
      diagnostics,
      declaredCount: firstDeclaration?.count ?? null,
      bulletCount: bullets.length,
    };
  }
  const fatal = lines.find((line) => /^(?:Error|TypeError|ReferenceError|SyntaxError|RangeError):/.test(line));
  if (fatal) return { findings: [fatal], diagnostics, declaredCount: null, bulletCount: 0 };
  const useful = lines.find((line) => !/^(?:at |Node\.js |\[plugin |\(!\)|Some chunks|Using dynamic import|Use build\.|Adjust chunk)/i.test(line));
  return {
    findings: [useful || `slice smoke exited ${String(status)}`],
    diagnostics,
    declaredCount: null,
    bulletCount: 0,
  };
}

function assessArc4SuccessEvidence(stdout, stderr = '') {
  const stdoutLines = String(stdout).split(/\r?\n/);
  const stderrLines = String(stderr).split(/\r?\n/);
  const lines = [...stdoutLines, ...stderrLines];
  const ledgerLines = lines.filter((line) => line.startsWith('SLICE SMOKE ARC 4 LEDGER:'));
  const passMarkers = lines.filter((line) => line.startsWith('SLICE SMOKE ARC 4: PASS'));
  const reasons = [];
  let ledger = null;

  if (ledgerLines.length !== 1) {
    reasons.push(`expected exactly one Arc 4 ledger line, observed ${ledgerLines.length}`);
  } else {
    const line = ledgerLines[0];
    if (!line.startsWith(ARC4_LEDGER_PREFIX)) {
      reasons.push('Arc 4 ledger prefix/spacing is not canonical');
    } else {
      const payload = line.slice(ARC4_LEDGER_PREFIX.length);
      let parsed = false;
      try { ledger = JSON.parse(payload); parsed = true; }
      catch { reasons.push('Arc 4 ledger payload is not valid JSON'); }
      if (parsed) {
        const isRecord = ledger !== null && typeof ledger === 'object' && !Array.isArray(ledger);
        const keys = isRecord ? Object.keys(ledger) : [];
        const expectedKeys = Object.keys(ARC4_LEDGER);
        if (!isRecord) reasons.push('Arc 4 ledger payload is not an object');
        if (JSON.stringify(keys) !== JSON.stringify(expectedKeys)) {
          reasons.push(`Arc 4 ledger keys/order drifted: ${JSON.stringify(keys)}`);
        }
        if (ledger?.schema !== ARC4_LEDGER.schema) {
          reasons.push(`Arc 4 ledger schema drifted: ${JSON.stringify(ledger?.schema)}`);
        }
        if (JSON.stringify(ledger?.stages) !== JSON.stringify(ARC4_LEDGER_STAGES)) {
          reasons.push(`Arc 4 ledger stages/order drifted: ${JSON.stringify(ledger?.stages)}`);
        }
        if (ledger?.burnSteps !== ARC4_LEDGER.burnSteps) {
          reasons.push(`Arc 4 ledger burnSteps drifted: ${JSON.stringify(ledger?.burnSteps)}`);
        }
        if (ledger?.recoveryClaimed !== false) {
          reasons.push(`Arc 4 ledger claimed browser recovery: ${JSON.stringify(ledger?.recoveryClaimed)}`);
        }
        if (ledger?.ok !== true) {
          reasons.push(`Arc 4 ledger ok drifted: ${JSON.stringify(ledger?.ok)}`);
        }
        if (JSON.stringify(ledger) !== payload || line !== ARC4_LEDGER_LINE) {
          reasons.push('Arc 4 ledger JSON bytes are not canonical');
        }
      }
    }
    if (!stdoutLines.includes(line)) reasons.push('Arc 4 ledger line was not emitted on stdout');
  }
  if (passMarkers.length !== 1) {
    reasons.push(`expected exactly one Arc 4 PASS marker, observed ${passMarkers.length}`);
  } else if (passMarkers[0] !== ARC4_PASS_MARKER) {
    reasons.push(`Arc 4 PASS marker drifted: ${JSON.stringify(passMarkers[0])}`);
  }
  if (passMarkers.length === 1 && !stdoutLines.includes(passMarkers[0])) {
    reasons.push('Arc 4 PASS marker was not emitted on stdout');
  }

  return {
    ok: reasons.length === 0,
    ledger,
    ledgerLineCount: ledgerLines.length,
    passMarkerCount: passMarkers.length,
    reasons,
  };
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

function exactObjectFields(value, expected) {
  return !!value && typeof value === 'object' && !Array.isArray(value)
    && JSON.stringify(Object.keys(value).sort()) === JSON.stringify(expected);
}
function passBrowserProvenanceErrors(browser) {
  const errors = [];
  if (!exactObjectFields(browser, BROWSER_PROVENANCE_FIELDS)) {
    return ['PASS browser provenance is missing fields, has extra fields, or is not an object'];
  }
  const executable = browser.executable;
  if (typeof executable !== 'string' || executable.length === 0 || executable.length > 4096
    || executable.trim() !== executable || /[\0\r\n]/.test(executable)
    || !path.isAbsolute(executable) || path.normalize(executable) !== executable) {
    errors.push('PASS browser executable provenance is not one safe absolute canonical path');
  }
  if (typeof browser.version !== 'string' || browser.version.length > 256
    || browser.version.trim() !== browser.version || !/^[\x20-\x7e]+$/.test(browser.version)
    || !CHROMIUM_COMMAND_VERSION.test(browser.version)) {
    errors.push('PASS browser version provenance is not one complete Chromium-family product/version');
  }
  if (browser.resolutionError !== null) {
    errors.push('PASS browser provenance carries a resolution error');
  }
  return errors;
}
function structurallyValidPng(bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length < 45
    || !bytes.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) return false;
  let offset = PNG_SIGNATURE.length;
  let chunkIndex = 0;
  let sawHeader = false;
  let sawImageData = false;
  let sawEnd = false;
  while (offset < bytes.length) {
    if (offset + 12 > bytes.length) return false;
    const length = bytes.readUInt32BE(offset);
    const typeStart = offset + 4;
    const dataStart = typeStart + 4;
    const next = dataStart + length + 4;
    if (next > bytes.length) return false;
    const type = bytes.subarray(typeStart, dataStart).toString('ascii');
    if (!/^[A-Za-z]{4}$/.test(type)) return false;
    if (chunkIndex === 0) {
      if (type !== 'IHDR' || length !== 13) return false;
      const width = bytes.readUInt32BE(dataStart);
      const height = bytes.readUInt32BE(dataStart + 4);
      const compression = bytes[dataStart + 10];
      const filter = bytes[dataStart + 11];
      const interlace = bytes[dataStart + 12];
      if (width === 0 || height === 0 || compression !== 0 || filter !== 0
        || (interlace !== 0 && interlace !== 1)) return false;
      sawHeader = true;
    } else if (type === 'IHDR') return false;
    if (type === 'IDAT') sawImageData = true;
    if (type === 'IEND') {
      if (length !== 0 || next !== bytes.length) return false;
      sawEnd = true;
    }
    offset = next;
    chunkIndex++;
  }
  return sawHeader && sawImageData && sawEnd;
}
function passScreenshotEvidenceErrors(listed, actual, runId, directory) {
  const errors = [];
  const expectedNames = SLICE_SCREENSHOT_LOGICAL_NAMES
    .map((logicalName) => `slice-${runId}-${logicalName}.png`);
  const listedLogicalNames = listed.map((row) => row?.logicalName);
  const actualLogicalNames = actual.map((row) => row?.logicalName);
  if (listed.length !== SLICE_SCREENSHOT_LOGICAL_NAMES.length
    || JSON.stringify(listedLogicalNames) !== JSON.stringify(SLICE_SCREENSHOT_LOGICAL_NAMES)) {
    errors.push('PASS screenshot manifest is not the exact ordered ten-surface inventory');
  }
  if (actual.length !== SLICE_SCREENSHOT_LOGICAL_NAMES.length
    || JSON.stringify(actualLogicalNames) !== JSON.stringify(SLICE_SCREENSHOT_LOGICAL_NAMES)) {
    errors.push('PASS screenshot carriers are not the exact ordered ten-surface current-run inventory');
  }
  for (let index = 0; index < SLICE_SCREENSHOT_LOGICAL_NAMES.length; index++) {
    const logicalName = SLICE_SCREENSHOT_LOGICAL_NAMES[index];
    const expectedName = expectedNames[index];
    const expectedPath = `apps/game/smoke/${expectedName}`;
    const row = listed[index];
    if (!exactObjectFields(row, SCREENSHOT_MANIFEST_FIELDS)) {
      errors.push(`PASS screenshot ${logicalName} manifest fields are missing, extra, or malformed`);
      continue;
    }
    if (row.logicalName !== logicalName || row.name !== expectedName || row.path !== expectedPath) {
      errors.push(`PASS screenshot ${logicalName} is not bound to its exact logical name/current run/safe path`);
    }
    if (!Number.isSafeInteger(row.bytes) || row.bytes <= 0
      || typeof row.sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(row.sha256)) {
      errors.push(`PASS screenshot ${logicalName} byte/hash binding is malformed`);
    }
    const carrier = path.join(directory, expectedName);
    try {
      const stat = fs.lstatSync(carrier);
      if (!stat.isFile() || stat.isSymbolicLink()) {
        errors.push(`PASS screenshot ${logicalName} carrier is not one safe regular file`);
        continue;
      }
      const bytes = fs.readFileSync(carrier);
      if (!structurallyValidPng(bytes)) {
        errors.push(`PASS screenshot ${logicalName} carrier is not a structurally valid PNG`);
      }
      if (row.bytes !== bytes.length || row.sha256 !== sha256(bytes)) {
        errors.push(`PASS screenshot ${logicalName} is not byte-for-byte SHA-256 bound`);
      }
    } catch (error) {
      errors.push(`PASS screenshot ${logicalName} carrier is missing or unreadable: ${error.message}`);
    }
  }
  return errors;
}

function rawLogPrefix(runId, startedAtValue) {
  return [
    '# Celestial Frontier v2 slice smoke raw output',
    `# run ${runId}`,
    `# started ${startedAtValue}`,
    '# command node tools/slicesmoke.mjs',
    '',
    '[stdout]',
    '',
  ].join('\n');
}
function decodeBoundRawLog(logBytes, report, runId) {
  const errors = [];
  const prefix = Buffer.from(rawLogPrefix(runId, report?.startedAt));
  const separator = Buffer.from('\n[stderr]\n');
  const stdoutBytes = report?.childOutput?.stdoutBytes;
  const stderrBytes = report?.childOutput?.stderrBytes;
  if (!Number.isSafeInteger(stdoutBytes) || stdoutBytes < 0
    || !Number.isSafeInteger(stderrBytes) || stderrBytes < 0) {
    return { ok: false, errors: ['child stdout/stderr byte binding is malformed'], stdout: '', stderr: '' };
  }
  const separatorAt = prefix.length + stdoutBytes;
  const expectedLength = separatorAt + separator.length + stderrBytes;
  if (logBytes.length !== expectedLength || !logBytes.subarray(0, prefix.length).equals(prefix)
    || !logBytes.subarray(separatorAt, separatorAt + separator.length).equals(separator)) {
    errors.push('raw log framing does not match the exact run/start/child byte binding');
  }
  const stdoutBuffer = logBytes.subarray(prefix.length, separatorAt);
  const stderrBuffer = logBytes.subarray(separatorAt + separator.length);
  if (report?.childOutput?.stdoutSha256 !== sha256(stdoutBuffer)) errors.push('child stdout SHA-256 mismatch');
  if (report?.childOutput?.stderrSha256 !== sha256(stderrBuffer)) errors.push('child stderr SHA-256 mismatch');
  return { ok: errors.length === 0, errors,
    stdout: stdoutBuffer.toString('utf8'), stderr: stderrBuffer.toString('utf8') };
}

function sliceRunEvidenceErrors(report, {
  runId, directory = outputRoot, expectedSource = null, requirePass = false,
  requireCommitted = false,
} = {}) {
  const errors = [];
  let artifacts;
  try { artifacts = runArtifactPaths(runId, directory); }
  catch (error) { return [error.message]; }
  const terminalStatuses = new Set(['pass', 'fail', 'instrument-fail']);
  if (!report || typeof report !== 'object' || Array.isArray(report)) return ['report is not an object'];
  if (report.schema !== 'cf-v2-slice-smoke-ci/v1') errors.push(`schema drifted: ${JSON.stringify(report.schema)}`);
  if (report.terminal !== true || !terminalStatuses.has(report.status)) {
    errors.push(`run is not terminal: ${JSON.stringify({ terminal: report.terminal, status: report.status })}`);
  }
  if (requirePass && report.status !== 'pass') errors.push(`Slice predecessor is not PASS: ${JSON.stringify(report.status)}`);
  if (report.run?.id !== runId) errors.push(`run ID mismatch: expected ${runId}, observed ${JSON.stringify(report.run?.id)}`);
  if (report.run?.artifactPath !== artifacts.reportRelative) {
    errors.push(`immutable report path mismatch: ${JSON.stringify(report.run?.artifactPath)}`);
  }
  if (report.run?.screenshotPattern !== `apps/game/smoke/slice-${runId}-*.png`) {
    errors.push(`screenshot pattern mismatch: ${JSON.stringify(report.run?.screenshotPattern)}`);
  }
  const startMs = Date.parse(report.startedAt);
  const endMs = Date.parse(report.endedAt);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs
    || report.durationMs !== endMs - startMs) errors.push('terminal timestamps/duration are malformed or unbound');
  if (!Number.isInteger(report.exit?.code)) errors.push('terminal exit code is absent');
  if (report.status === 'pass' && (report.exit?.code !== 0 || report.exit?.childCode !== 0)) {
    errors.push(`PASS exit binding drifted: ${JSON.stringify(report.exit)}`);
  }
  if (report.status !== 'pass' && report.exit?.code === 0) errors.push('non-PASS report carries exit code 0');
  if (!report.source || !report.sourceEnd || !sameExactSource(report.source, report.sourceEnd)
    || report.sourceChange?.detected !== false) {
    errors.push('begin/end source identity is missing, changed, or contradictory');
  }
  if (expectedSource && !sameExactSource(report.source, expectedSource)) {
    errors.push(`report source does not match current source: report=${JSON.stringify(report.source)} current=${JSON.stringify(expectedSource)}`);
  }
  if (requireCommitted && report.source?.state !== 'committed') {
    errors.push(`source is not clean committed: ${JSON.stringify(report.source?.state)}`);
  }
  if (report.certifying !== (report.status === 'pass' && report.source?.state === 'committed')) {
    errors.push(`certifying flag contradicts PASS/clean source: ${JSON.stringify(report.certifying)}`);
  }
  if (report.retryPolicy?.automaticRetries !== 0) errors.push('automatic retry count is not exactly zero');
  if (report.rawLog?.path !== artifacts.logRelative) {
    errors.push(`immutable raw-log path mismatch: ${JSON.stringify(report.rawLog?.path)}`);
  }
  if (!fs.existsSync(artifacts.log)) {
    errors.push(`immutable raw log is missing: ${artifacts.logRelative}`);
  } else {
    const logBytes = fs.readFileSync(artifacts.log);
    if (report.rawLog?.bytes !== logBytes.length) errors.push('raw-log byte count mismatch');
    if (report.rawLog?.sha256 !== sha256(logBytes)) errors.push('raw-log SHA-256 mismatch');
    const decoded = decodeBoundRawLog(logBytes, report, runId);
    errors.push(...decoded.errors);
    if (decoded.ok && report.status === 'pass') {
      const passMarkers = decoded.stdout.split(/\r?\n/).filter((line) => /^SLICE SMOKE: PASS\b/.test(line));
      const replayedFailure = parseFailureEvidence(
        [decoded.stdout, decoded.stderr].join('\n'), report.exit?.childCode,
      );
      const replayedArc4 = assessArc4SuccessEvidence(decoded.stdout, decoded.stderr);
      if (passMarkers.length !== 1) errors.push(`expected exactly one overall Slice PASS marker, observed ${passMarkers.length}`);
      if (report.childOutput?.overallPassMarkerCount !== passMarkers.length) {
        errors.push('overall Slice PASS marker count is not bound to raw stdout');
      }
      if (replayedFailure.findings.length || replayedFailure.diagnostics.length) {
        errors.push('raw child output replays as failure/contradiction despite report PASS');
      }
      if (!replayedArc4.ok
        || JSON.stringify(report.arc4SuccessEvidence?.ledger) !== JSON.stringify(replayedArc4.ledger)
        || report.arc4SuccessEvidence?.ledgerLineCount !== replayedArc4.ledgerLineCount
        || report.arc4SuccessEvidence?.passMarkerCount !== replayedArc4.passMarkerCount) {
        errors.push('raw child output does not replay to the report Arc 4 PASS evidence');
      }
    }
  }
  if (report.status === 'pass') {
    errors.push(...passBrowserProvenanceErrors(report.browser));
  }
  if (!Array.isArray(report.screenshots)) {
    errors.push('screenshot manifest is not an array');
  }
  const listedScreenshots = Array.isArray(report.screenshots) ? report.screenshots : [];
  let actualScreenshots = [];
  try { actualScreenshots = screenshots(runId, directory); }
  catch (error) { errors.push(`current-run screenshot carriers could not be read safely: ${error.message}`); }
  if (JSON.stringify(listedScreenshots) !== JSON.stringify(actualScreenshots)) {
    errors.push('screenshot manifest does not exactly match the immutable run-ID files');
  }
  if (report.status === 'pass') {
    errors.push(...passScreenshotEvidenceErrors(
      listedScreenshots, actualScreenshots, runId, directory,
    ));
  }
  if (report.status === 'pass' && report.arc4SuccessEvidence?.ok !== true) {
    errors.push('PASS report lacks exact Arc 4 success evidence');
  }
  return errors;
}

export function verifySliceRunEvidence(runId, {
  directory = outputRoot, expectedSource = null, requirePass = false, requireCommitted = false,
} = {}) {
  let artifacts;
  try { artifacts = runArtifactPaths(runId, directory); }
  catch (error) { return { ok: false, errors: [error.message], report: null, reportSha256: null, artifacts: null }; }
  if (!fs.existsSync(artifacts.report)) {
    return { ok: false, errors: [`immutable Slice report is missing: ${artifacts.reportRelative}`], report: null, reportSha256: null, artifacts };
  }
  const reportBytes = fs.readFileSync(artifacts.report);
  let report;
  try { report = JSON.parse(reportBytes.toString('utf8')); }
  catch (error) {
    return { ok: false, errors: [`immutable Slice report is invalid JSON: ${error.message}`], report: null, reportSha256: sha256(reportBytes), artifacts };
  }
  const errors = sliceRunEvidenceErrors(report, {
    runId, directory, expectedSource, requirePass, requireCommitted,
  });
  return {
    ok: errors.length === 0, errors, report, reportSha256: sha256(reportBytes), artifacts,
  };
}

function runningSliceReport({ runId, source, startedAt, artifacts }) {
  return {
    schema: 'cf-v2-slice-smoke-ci/v1',
    status: 'running',
    terminal: false,
    certifying: false,
    exit: null,
    startedAt: startedAt.toISOString(),
    endedAt: null,
    durationMs: null,
    run: {
      id: runId,
      artifactPath: artifacts.reportRelative,
      screenshotPattern: `apps/game/smoke/slice-${runId}-*.png`,
      provenance: 'Only artifacts bearing this cryptographically unique child-run ID are attributed to this execution.',
    },
    source,
    sourceEnd: null,
    sourceChange: { detected: null, ending: null },
    retryPolicy: {
      automaticRetries: 0,
      reason: 'A red or interrupted run remains non-certifying; the child is invoked exactly once.',
    },
    rawLog: null,
    screenshots: [],
  };
}

function runSelftest() {
  const sourceCommit = 'a'.repeat(40);
  const fixtureGit = (args, { raw = false } = {}) => {
    const key = args.join(' ');
    const outputs = new Map([
      ['rev-parse --show-toplevel', repoRoot],
      ['status --porcelain=v1 -z --untracked-files=all', ''],
      ['diff --binary --no-ext-diff HEAD --', ''],
      ['ls-files --others --exclude-standard -z', ''],
      ['rev-parse HEAD', sourceCommit],
      ['rev-parse --abbrev-ref HEAD', 'openai/source-selftest'],
    ]);
    if (!outputs.has(key)) throw new Error(`unexpected source selftest git command: ${key}`);
    const value = outputs.get(key);
    return raw ? Buffer.from(value) : `${value}\n`;
  };
  const exactIdentity = sourceIdentity({
    gitCommand: fixtureGit, environment: { GITHUB_SHA: sourceCommit },
  });
  let wrongHostedShaRejected = false;
  try {
    sourceIdentity({ gitCommand: fixtureGit, environment: { GITHUB_SHA: 'f'.repeat(40) } });
  } catch (error) {
    wrongHostedShaRejected = String(error?.message || error).includes('GITHUB_SHA does not match git HEAD');
  }
  const invalidHostedShasRejected = ['', 'not-a-full-commit'].every((hostedSha) => {
    try {
      sourceIdentity({ gitCommand: fixtureGit, environment: { GITHUB_SHA: hostedSha } });
      return false;
    } catch (error) {
      return String(error?.message || error).includes('GITHUB_SHA does not match git HEAD');
    }
  });
  let requiredGitFailureRejected = false;
  try {
    sourceIdentity({
      gitCommand: (args, options) => {
        if (args[0] === 'status') throw new Error('injected required Git failure');
        return fixtureGit(args, options);
      },
      environment: { GITHUB_SHA: sourceCommit },
    });
  } catch (error) {
    requiredGitFailureRejected = String(error?.message || error).includes('injected required Git failure');
  }
  let strictGitHelperRejected = false;
  try { git(['smokereport-selftest-unsupported-command']); }
  catch (error) {
    strictGitHelperRejected = String(error?.message || error)
      .includes('required git smokereport-selftest-unsupported-command failed');
  }
  if (exactIdentity.commit !== sourceCommit
    || exactIdentity.branch !== 'openai/source-selftest'
    || exactIdentity.state !== 'committed'
    || !wrongHostedShaRejected || !invalidHostedShasRejected
    || !requiredGitFailureRejected || !strictGitHelperRejected) {
    throw new Error(`SELFTEST fail-closed source identity controls drifted: ${JSON.stringify({
      exactIdentity, wrongHostedShaRejected, invalidHostedShasRejected,
      requiredGitFailureRejected, strictGitHelperRejected,
    })}`);
  }
  const injected = [
    'SLICE SMOKE: FAIL — 3 findings',
    'SLICE SMOKE: FAILURE TITLES',
    '  1. PHONE',
    '  2. PHONE',
    '  3. harness',
    'SLICE SMOKE: FAILURE DETAILS',
    '  - PHONE: primary rendered outcome',
    '  - PHONE: related rendered outcome',
    '  - harness: injected browser timeout',
  ].join('\n');
  const parsedInjected = parseFailureEvidence(injected, 1);
  const findings = parsedInjected.findings;
  if (findings.length !== 3) throw new Error(`SELFTEST finding extraction drifted: ${JSON.stringify(findings)}`);
  if (parsedInjected.diagnostics.length !== 0
    || parsedInjected.declaredCount !== 3 || parsedInjected.bulletCount !== 3) {
    throw new Error(`SELFTEST matching failure count was refused: ${JSON.stringify(parsedInjected)}`);
  }
  const groups = groupFindings(findings);
  if (groups.length !== 2 || groups[0].scope !== 'phone' || groups[0].related.length !== 1
    || groups[1].scope !== 'harness') {
    throw new Error(`SELFTEST scoped cascade grouping drifted: ${JSON.stringify(groups)}`);
  }
  const contradictorySuccess = parseFailureEvidence(injected, 0);
  if (contradictorySuccess.findings.length !== 3
    || !contradictorySuccess.diagnostics.includes('harness: slice smoke exited 0 while declaring failure')) {
    throw new Error(`SELFTEST successful exit trusted contradictory failure text: ${JSON.stringify(contradictorySuccess)}`);
  }
  for (const [name, declared] of [['under-count', 2], ['over-count', 4]]) {
    const mutant = parseFailureEvidence(injected.replace('3 findings', `${declared} findings`), 1);
    if (mutant.findings.length !== 3
      || !mutant.diagnostics.some((diagnosis) => diagnosis.includes(`declared ${declared} findings`)
        && diagnosis.includes('contains 3 bullets'))) {
      throw new Error(`SELFTEST ${name} failure-count mutant stayed green: ${JSON.stringify(mutant)}`);
    }
  }
  const infrastructure = [
    '- Using dynamic import() to code-split the application',
    'Error: listen EPERM: operation not permitted 127.0.0.1',
  ].join('\n');
  const infrastructureFindings = parseFailureEvidence(infrastructure, 1).findings;
  if (infrastructureFindings.length !== 1 || !/listen EPERM/.test(infrastructureFindings[0])
    || scopeOf(infrastructureFindings[0]) !== 'harness') {
    throw new Error(`SELFTEST infrastructure failure was hidden by build advice: ${JSON.stringify(infrastructureFindings)}`);
  }
  const scopeControls = [
    ['prefixed-arc4-product', 'ARC 4 SAMPLE HIT: browser CDP timed out after timeout', 'arc-4-sample-hit'],
    ['literal-harness-priority', 'harness: ARC 4 SAMPLE HIT', 'harness'],
    ['unprefixed-infrastructure', 'browser CDP timed out after timeout', 'harness'],
  ];
  const scopeDrift = scopeControls.flatMap(([name, message, expected]) => {
    const actual = scopeOf(message);
    return actual === expected ? [] : [{ name, message, expected, actual }];
  });
  if (scopeDrift.length) {
    throw new Error(`SELFTEST finding scope priority controls drifted: ${JSON.stringify(scopeDrift)}`);
  }
  const source = {
    commit: 'a'.repeat(40), branch: 'openai/test',
    statusSha256: 'b'.repeat(64), workingTreeSha256: 'c'.repeat(64),
  };
  if (!sameSource(source, { ...source })
    || sameSource(source, { ...source, workingTreeSha256: 'd'.repeat(64) })) {
    throw new Error('SELFTEST source-identity change control drifted');
  }
  const inventoryInstanceId = 'gear1|thermal|exact';
  const inventoryVisibleRow = Object.freeze({
    instanceId: inventoryInstanceId, present: true, connected: true,
    tag: 'BUTTON', disabled: false, ariaDisabled: null,
    panelId: 'inventorypanel', panelOwnsRow: true, scrollRequested: true,
    before: Object.freeze({ x: 180, y: 220, scrollTop: 0, hitOwned: true }),
    after: Object.freeze({ x: 180, y: 220, width: 240, height: 52, scrollTop: 0, hitOwned: true }),
    clip: Object.freeze({ left: 40, top: 80, right: 320, bottom: 500 }),
    viewport: Object.freeze({ width: 1280, height: 800 }),
  });
  const inventoryScrolledRow = Object.freeze({
    ...inventoryVisibleRow,
    before: Object.freeze({ x: 180, y: 751, scrollTop: 0, hitOwned: false }),
    after: Object.freeze({ x: 180, y: 300, width: 240, height: 164, scrollTop: 451, hitOwned: true }),
  });
  const inventoryRowControls = [
    ['already-visible', inventoryVisibleRow, true, []],
    ['final6-offscreen-then-scrolled', inventoryScrolledRow, true, []],
    ['absent', null, false, ['reachability observation absent']],
    ['wrong-instance', { ...inventoryVisibleRow, instanceId: 'gear1|foreign' }, false, ['exact row identity']],
    ['disconnected', { ...inventoryVisibleRow, connected: false }, false, ['connected row']],
    ['non-button', { ...inventoryVisibleRow, tag: 'DIV' }, false, ['actionable row']],
    ['disabled', { ...inventoryVisibleRow, disabled: true }, false, ['actionable row']],
    ['aria-disabled', { ...inventoryVisibleRow, ariaDisabled: 'true' }, false, ['actionable row']],
    ['wrong-scroll-owner', { ...inventoryVisibleRow, panelId: 'shipyardpanel' }, false, ['Inventory scroll owner']],
    ['foreign-scroll-owner', { ...inventoryVisibleRow, panelOwnsRow: false }, false, ['Inventory scroll owner']],
    ['no-reveal-request', { ...inventoryVisibleRow, scrollRequested: false }, false, ['real row reveal request']],
    ['missing-before-hit', { ...inventoryVisibleRow,
      before: { x: 180, y: 220, scrollTop: 0 } }, false, ['pre-reveal observation']],
    ['missing-after', { ...inventoryVisibleRow, after: null }, false, ['post-reveal observation']],
    ['zero-width-row', { ...inventoryVisibleRow,
      after: { ...inventoryVisibleRow.after, width: 0 } }, false, ['44px row geometry']],
    ['short-row', { ...inventoryVisibleRow,
      after: { ...inventoryVisibleRow.after, height: 43 } }, false, ['44px row geometry']],
    ['wrong-hit-owner', { ...inventoryVisibleRow,
      after: { ...inventoryVisibleRow.after, hitOwned: false } }, false, ['centre hit ownership']],
    ['right-edge-outside', { ...inventoryVisibleRow,
      after: { ...inventoryVisibleRow.after, x: inventoryVisibleRow.clip.right } }, false,
    ['centre inside visible scrollport']],
    ['left-edge-outside', { ...inventoryVisibleRow,
      after: { ...inventoryVisibleRow.after, x: inventoryVisibleRow.clip.left - 1 } }, false,
    ['centre inside visible scrollport']],
    ['top-edge-outside', { ...inventoryVisibleRow,
      after: { ...inventoryVisibleRow.after, y: inventoryVisibleRow.clip.top - 1 } }, false,
    ['centre inside visible scrollport']],
    ['viewport-bottom-outside', { ...inventoryVisibleRow,
      clip: { ...inventoryVisibleRow.clip, bottom: 900 },
      after: { ...inventoryVisibleRow.after, y: 800 } }, false, ['centre inside visible scrollport']],
    ['offscreen-no-movement', { ...inventoryScrolledRow,
      after: { ...inventoryScrolledRow.after, scrollTop: inventoryScrolledRow.before.scrollTop } },
    false, ['offscreen row reveal movement']],
    ['missing-scrollport', { ...inventoryVisibleRow, clip: null }, false, ['scrollport geometry']],
    ['malformed-viewport', { ...inventoryVisibleRow,
      viewport: { width: 0, height: 800 } }, false, ['scrollport geometry']],
  ];
  const inventoryRowDrift = inventoryRowControls.flatMap(([name, observation, expectedOk, expectedReasons]) => {
    const actual = assessInventoryRowReachability(observation, inventoryInstanceId);
    return actual.ok === expectedOk && JSON.stringify(actual.reasons) === JSON.stringify(expectedReasons)
      ? [] : [{ name, expectedOk, expectedReasons, actual }];
  });
  let invalidInventoryInstanceRejected = false;
  try { assessInventoryRowReachability(inventoryVisibleRow, ''); }
  catch (error) { invalidInventoryInstanceRejected = error instanceof TypeError; }
  if (!invalidInventoryInstanceRejected) {
    inventoryRowDrift.push({ name: 'missing-exact-instance', expected: 'TypeError' });
  }
  if (inventoryRowDrift.length) {
    throw new Error(`SELFTEST Inventory row reachability controls drifted: ${JSON.stringify(inventoryRowDrift)}`);
  }
  const inventoryRowActivation = Object.freeze({
    point: inventoryScrolledRow.after,
    pointer: Object.freeze({
      instanceId: inventoryInstanceId, tag: 'BUTTON', trusted: true,
      pointerType: 'mouse', x: inventoryScrolledRow.after.x, y: inventoryScrolledRow.after.y,
    }),
  });
  const inventoryRowActivationControls = [
    ['green', inventoryRowActivation, true, []],
    ['missing-receipt', { ...inventoryRowActivation, pointer: null }, false, ['trusted row pointer']],
    ['wrong-instance', { ...inventoryRowActivation,
      pointer: { ...inventoryRowActivation.pointer, instanceId: 'gear1|foreign' } }, false,
    ['trusted row pointer']],
    ['wrong-tag', { ...inventoryRowActivation,
      pointer: { ...inventoryRowActivation.pointer, tag: 'SPAN' } }, false, ['trusted row pointer']],
    ['untrusted', { ...inventoryRowActivation,
      pointer: { ...inventoryRowActivation.pointer, trusted: false } }, false, ['trusted row pointer']],
    ['touch', { ...inventoryRowActivation,
      pointer: { ...inventoryRowActivation.pointer, pointerType: 'touch' } }, false, ['trusted row pointer']],
    ['coordinate-drift', { ...inventoryRowActivation,
      pointer: { ...inventoryRowActivation.pointer, y: inventoryRowActivation.pointer.y + 2 } }, false,
    ['row point/receipt binding']],
  ];
  const inventoryRowActivationDrift = inventoryRowActivationControls.flatMap(([
    name, observation, expectedOk, expectedReasons,
  ]) => {
    const actual = assessInventoryRowActivation(observation, inventoryInstanceId);
    return actual.ok === expectedOk && JSON.stringify(actual.reasons) === JSON.stringify(expectedReasons)
      ? [] : [{ name, expectedOk, expectedReasons, actual }];
  });
  if (inventoryRowActivationDrift.length) {
    throw new Error(`SELFTEST Inventory row activation controls drifted: ${JSON.stringify(inventoryRowActivationDrift)}`);
  }
  const inventoryActionActivation = Object.freeze({
    point: Object.freeze({ ok: true, x: 180, y: 300, height: 44 }),
    interaction: Object.freeze({
      pressCount: 1, operation: 'equip', instanceId: inventoryInstanceId,
      tag: 'BUTTON', trusted: true, pointerType: 'mouse', x: 180, y: 300,
    }),
  });
  const inventoryActionActivationControls = [
    ['green', inventoryActionActivation, true, []],
    ['point-red', { ...inventoryActionActivation,
      point: { ...inventoryActionActivation.point, ok: false } }, false, ['action target point']],
    ['short-target', { ...inventoryActionActivation,
      point: { ...inventoryActionActivation.point, height: 43 } }, false, ['action target point']],
    ['missing-receipt', { ...inventoryActionActivation, interaction: null }, false,
    ['trusted action pointer']],
    ['double-press', { ...inventoryActionActivation,
      interaction: { ...inventoryActionActivation.interaction, pressCount: 2 } }, false,
    ['trusted action pointer']],
    ['wrong-operation', { ...inventoryActionActivation,
      interaction: { ...inventoryActionActivation.interaction, operation: 'unequip' } }, false,
    ['trusted action pointer']],
    ['wrong-instance', { ...inventoryActionActivation,
      interaction: { ...inventoryActionActivation.interaction, instanceId: 'gear1|foreign' } }, false,
    ['trusted action pointer']],
    ['wrong-tag', { ...inventoryActionActivation,
      interaction: { ...inventoryActionActivation.interaction, tag: 'SPAN' } }, false,
    ['trusted action pointer']],
    ['untrusted', { ...inventoryActionActivation,
      interaction: { ...inventoryActionActivation.interaction, trusted: false } }, false,
    ['trusted action pointer']],
    ['touch', { ...inventoryActionActivation,
      interaction: { ...inventoryActionActivation.interaction, pointerType: 'touch' } }, false,
    ['trusted action pointer']],
    ['coordinate-drift', { ...inventoryActionActivation,
      interaction: { ...inventoryActionActivation.interaction, x: 182 } }, false,
    ['action point/receipt binding']],
  ];
  const inventoryActionActivationDrift = inventoryActionActivationControls.flatMap(([
    name, observation, expectedOk, expectedReasons,
  ]) => {
    const actual = assessInventoryActionActivation(observation, inventoryInstanceId);
    return actual.ok === expectedOk && JSON.stringify(actual.reasons) === JSON.stringify(expectedReasons)
      ? [] : [{ name, expectedOk, expectedReasons, actual }];
  });
  if (inventoryActionActivationDrift.length) {
    throw new Error(`SELFTEST Inventory action activation controls drifted: ${JSON.stringify(inventoryActionActivationDrift)}`);
  }
  const inventoryDetailClose = Object.freeze({
    point: Object.freeze({
      ok: true, x: 620, y: 90, width: 44, height: 44, tag: 'BUTTON', owner: 'inventory-sheet',
    }),
    pointer: Object.freeze({
      x: 620, y: 90, tag: 'BUTTON', closeOwner: 'inventory-sheet', trusted: true, pointerType: 'mouse',
    }),
    closed: Object.freeze({
      sheetPresent: true, open: false, hidden: true, ariaHidden: 'true', bodyChildren: 0,
      focusInstanceId: inventoryInstanceId, panelPresent: true, panelDisplay: 'block',
      panelAriaHidden: 'false', panelOpen: 'inventory', openerPresent: true,
      inventoryExpanded: 'true', panelInert: false,
      diagnostics: Object.freeze({
        activeCount: 0, retainedCount: 0, pendingWork: 0, selectedInstanceId: null,
      }),
    }),
  });
  const inventoryDetailCloseControls = [
    ['green', inventoryDetailClose, true, []],
    ['point-red', { ...inventoryDetailClose,
      point: { ...inventoryDetailClose.point, ok: false } }, false, ['Close target point']],
    ['narrow-target', { ...inventoryDetailClose,
      point: { ...inventoryDetailClose.point, width: 43 } }, false, ['Close target point']],
    ['missing-width', { ...inventoryDetailClose,
      point: { ...inventoryDetailClose.point, width: undefined } }, false, ['Close target point']],
    ['short-target', { ...inventoryDetailClose,
      point: { ...inventoryDetailClose.point, height: 43 } }, false, ['Close target point']],
    ['wrong-point-tag', { ...inventoryDetailClose,
      point: { ...inventoryDetailClose.point, tag: 'DIV' } }, false, ['Close target point']],
    ['wrong-owner', { ...inventoryDetailClose,
      point: { ...inventoryDetailClose.point, owner: 'foreign-sheet' } }, false, ['Close target point']],
    ['missing-receipt', { ...inventoryDetailClose, pointer: null }, false, ['trusted Close pointer']],
    ['wrong-receipt-tag', { ...inventoryDetailClose,
      pointer: { ...inventoryDetailClose.pointer, tag: 'SPAN' } }, false, ['trusted Close pointer']],
    ['wrong-receipt-owner', { ...inventoryDetailClose,
      pointer: { ...inventoryDetailClose.pointer, closeOwner: 'foreign-sheet' } }, false,
    ['trusted Close pointer']],
    ['untrusted', { ...inventoryDetailClose,
      pointer: { ...inventoryDetailClose.pointer, trusted: false } }, false, ['trusted Close pointer']],
    ['touch', { ...inventoryDetailClose,
      pointer: { ...inventoryDetailClose.pointer, pointerType: 'touch' } }, false, ['trusted Close pointer']],
    ['coordinate-drift', { ...inventoryDetailClose,
      pointer: { ...inventoryDetailClose.pointer, x: 622 } }, false, ['Close point/receipt binding']],
    ['retained-open', { ...inventoryDetailClose,
      closed: { ...inventoryDetailClose.closed, open: true } }, false, ['closed focus/zero ownership']],
    ['missing-sheet', { ...inventoryDetailClose,
      closed: { ...inventoryDetailClose.closed, sheetPresent: false } }, false,
    ['closed focus/zero ownership']],
    ['visible-sheet', { ...inventoryDetailClose,
      closed: { ...inventoryDetailClose.closed, hidden: false } }, false,
    ['closed focus/zero ownership']],
    ['aria-visible-sheet', { ...inventoryDetailClose,
      closed: { ...inventoryDetailClose.closed, ariaHidden: 'false' } }, false,
    ['closed focus/zero ownership']],
    ['wrong-focus', { ...inventoryDetailClose,
      closed: { ...inventoryDetailClose.closed, focusInstanceId: 'gear1|foreign' } }, false,
    ['closed focus/zero ownership']],
    ['retained-body', { ...inventoryDetailClose,
      closed: { ...inventoryDetailClose.closed, bodyChildren: 1 } }, false,
    ['closed focus/zero ownership']],
    ['missing-panel-inert', { ...inventoryDetailClose,
      closed: { ...inventoryDetailClose.closed, panelInert: undefined } }, false,
    ['closed focus/zero ownership']],
    ['missing-panel', { ...inventoryDetailClose,
      closed: { ...inventoryDetailClose.closed, panelPresent: false } }, false,
    ['closed focus/zero ownership']],
    ['hidden-panel', { ...inventoryDetailClose,
      closed: { ...inventoryDetailClose.closed, panelDisplay: 'none' } }, false,
    ['closed focus/zero ownership']],
    ['aria-hidden-panel', { ...inventoryDetailClose,
      closed: { ...inventoryDetailClose.closed, panelAriaHidden: 'true' } }, false,
    ['closed focus/zero ownership']],
    ['closed-panel-state', { ...inventoryDetailClose,
      closed: { ...inventoryDetailClose.closed, panelOpen: null } }, false,
    ['closed focus/zero ownership']],
    ['missing-panel-opener', { ...inventoryDetailClose,
      closed: { ...inventoryDetailClose.closed, openerPresent: false } }, false,
    ['closed focus/zero ownership']],
    ['collapsed-panel-opener', { ...inventoryDetailClose,
      closed: { ...inventoryDetailClose.closed, inventoryExpanded: 'false' } }, false,
    ['closed focus/zero ownership']],
    ['retained-panel-inert', { ...inventoryDetailClose,
      closed: { ...inventoryDetailClose.closed, panelInert: true } }, false,
    ['closed focus/zero ownership']],
    ['active-owner', { ...inventoryDetailClose,
      closed: { ...inventoryDetailClose.closed,
        diagnostics: { ...inventoryDetailClose.closed.diagnostics, activeCount: 1 } } }, false,
    ['closed focus/zero ownership']],
    ['retained-owner', { ...inventoryDetailClose,
      closed: { ...inventoryDetailClose.closed,
        diagnostics: { ...inventoryDetailClose.closed.diagnostics, retainedCount: 1 } } }, false,
    ['closed focus/zero ownership']],
    ['pending-work', { ...inventoryDetailClose,
      closed: { ...inventoryDetailClose.closed,
        diagnostics: { ...inventoryDetailClose.closed.diagnostics, pendingWork: 1 } } }, false,
    ['closed focus/zero ownership']],
    ['selected-owner', { ...inventoryDetailClose,
      closed: { ...inventoryDetailClose.closed,
        diagnostics: { ...inventoryDetailClose.closed.diagnostics,
          selectedInstanceId: inventoryInstanceId } } }, false,
    ['closed focus/zero ownership']],
  ];
  const inventoryDetailCloseDrift = inventoryDetailCloseControls.flatMap(([
    name, observation, expectedOk, expectedReasons,
  ]) => {
    const actual = assessInventoryDetailClose(observation, inventoryInstanceId);
    return actual.ok === expectedOk && JSON.stringify(actual.reasons) === JSON.stringify(expectedReasons)
      ? [] : [{ name, expectedOk, expectedReasons, actual }];
  });
  if (inventoryDetailCloseDrift.length) {
    throw new Error(`SELFTEST Inventory detail Close controls drifted: ${JSON.stringify(inventoryDetailCloseDrift)}`);
  }
  const inventoryReloadInstanceId = 'gear1|thermal';
  const inventoryReloadRevision = 8;
  const predecessorReceipt = Object.freeze({
    ordinal: 4, kind: 'f4-smoke', witness: 'f4:smoke:4:predecessor',
  });
  const equipReceipt = Object.freeze({
    ordinal: 5, kind: 'arc2-equip',
    witness: `arc2:equip:5:${inventoryReloadInstanceId}:${inventoryReloadRevision}`,
  });
  const receiptKeys = Object.freeze(['receipt:4', 'receipt:5']);
  const receiptRows = Object.freeze([predecessorReceipt, equipReceipt]);
  const receiptRawRows = Object.freeze(receiptRows.map((row) => JSON.stringify(row)));
  const committedAuthority = Object.freeze({
    activePlayMs: 1200,
    sessionRng: Object.freeze({ seed: 0xC0FFEE, ordinal: 6, draws: Object.freeze({ capture: 2 }) }),
  });
  /* Receipt-free checkpoints may legitimately advance these non-RNG fields
     before the new document is sampled. The green witness deliberately
     differs so an accidental full-authority equality check is selftest-red. */
  const reloadedAuthority = Object.freeze({
    ...committedAuthority, activePlayMs: 1300,
    sessionRng: Object.freeze({ seed: 0xC0FFEE, ordinal: 6, draws: Object.freeze({ capture: 2 }) }),
  });
  const inventoryReloadDurability = Object.freeze({
    committed: Object.freeze({
      authorityVersion: 1, authorityJson: JSON.stringify(committedAuthority), authority: committedAuthority,
      receiptKeys: Object.freeze([...receiptKeys]), receiptRawRows: Object.freeze([...receiptRawRows]),
      receiptRows: Object.freeze(receiptRows.map((row) => Object.freeze({ ...row }))),
    }),
    reloaded: Object.freeze({
      authorityVersion: 1, authorityJson: JSON.stringify(reloadedAuthority), authority: reloadedAuthority,
      receiptKeys: Object.freeze([...receiptKeys]), receiptRawRows: Object.freeze([...receiptRawRows]),
      receiptRows: Object.freeze(receiptRows.map((row) => Object.freeze({ ...row }))),
    }),
    committedRuntime: Object.freeze({
      sessionSeed: 0xC0FFEE, sessionOrdinal: 6, sessionDraws: Object.freeze({ capture: 2 }),
      revision: 11, commits: 7, documentToken: 'runtime-committed',
      lease: Object.freeze({ owner: 'runtime-committed-owner' }),
    }),
    reloadedRuntime: Object.freeze({
      sessionSeed: 0xC0FFEE, sessionOrdinal: 6, sessionDraws: Object.freeze({ capture: 2 }),
      revision: 12, commits: 8, documentToken: 'runtime-reloaded',
      lease: Object.freeze({ owner: 'runtime-reloaded-owner' }),
    }),
  });
  const mutateReloadDurability = (mutate) => {
    const observation = structuredClone(inventoryReloadDurability);
    mutate(observation);
    return observation;
  };
  const mutateReloadRngCoherently = (mutate) => mutateReloadDurability((observation) => {
    mutate(observation.reloaded.authority.sessionRng);
    observation.reloaded.authorityJson = JSON.stringify(observation.reloaded.authority);
    observation.reloadedRuntime.sessionSeed = observation.reloaded.authority.sessionRng.seed;
    observation.reloadedRuntime.sessionOrdinal = observation.reloaded.authority.sessionRng.ordinal;
    observation.reloadedRuntime.sessionDraws = structuredClone(observation.reloaded.authority.sessionRng.draws);
  });
  const inventoryReloadDurabilityControls = [
    ['green-with-volatile-authority-fields', inventoryReloadDurability, true, []],
    ['missing-predecessor', mutateReloadDurability((observation) => {
      observation.reloaded.receiptKeys.splice(0, 1);
      observation.reloaded.receiptRawRows.splice(0, 1);
      observation.reloaded.receiptRows.splice(0, 1);
    }), false, ['durable receipt/F4 authority reload']],
    ['predecessor-key-drift', mutateReloadDurability((observation) => {
      observation.reloaded.receiptKeys[0] = 'receipt:40';
    }), false, ['durable receipt/F4 authority reload']],
    ['predecessor-byte-drift', mutateReloadDurability((observation) => {
      observation.reloaded.receiptRawRows[0] += ' ';
    }), false, ['durable receipt/F4 authority reload']],
    ['predecessor-semantic-drift', mutateReloadDurability((observation) => {
      observation.reloaded.receiptRows[0].witness = 'mutated-predecessor-semantics';
    }), false, ['durable receipt/F4 authority reload']],
    ['null-predecessor', mutateReloadDurability((observation) => {
      observation.reloaded.receiptRows[0] = null;
    }), false, ['durable receipt/F4 authority reload']],
    ['duplicate-key', mutateReloadDurability((observation) => {
      observation.reloaded.receiptKeys[0] = observation.reloaded.receiptKeys[1];
    }), false, ['durable receipt/F4 authority reload']],
    ['equip-witness-drift', mutateReloadDurability((observation) => {
      observation.reloaded.receiptRows[1].witness = 'mutated-equip-witness';
    }), false, ['durable receipt/F4 authority reload']],
    ['authority-raw-drift', mutateReloadDurability((observation) => {
      observation.reloaded.authorityJson += ' ';
    }), false, ['durable receipt/F4 authority reload']],
    ['authority-seed-drift', mutateReloadRngCoherently((rng) => {
      rng.seed = (rng.seed ^ 1) >>> 0;
    }), false, ['durable receipt/F4 authority reload']],
    ['authority-ordinal-drift', mutateReloadRngCoherently((rng) => {
      rng.ordinal += 1;
    }), false, ['durable receipt/F4 authority reload']],
    ['authority-draw-drift', mutateReloadRngCoherently((rng) => {
      rng.draws.capture += 1;
    }), false, ['durable receipt/F4 authority reload']],
    ['runtime-drift', mutateReloadDurability((observation) => {
      observation.reloadedRuntime.sessionOrdinal += 1;
    }), false, ['durable receipt/F4 authority reload']],
    ['missing-draw-map', mutateReloadDurability((observation) => {
      observation.reloaded.authority.sessionRng.draws = null;
      observation.reloaded.authorityJson = JSON.stringify(observation.reloaded.authority);
      observation.reloadedRuntime.sessionDraws = null;
    }), false, ['durable receipt/F4 authority reload']],
  ];
  const inventoryReloadDurabilityDrift = inventoryReloadDurabilityControls.flatMap(([
    name, observation, expectedOk, expectedReasons,
  ]) => {
    const actual = assessInventoryReloadDurability(
      observation, inventoryReloadInstanceId, inventoryReloadRevision,
    );
    return actual.ok === expectedOk && JSON.stringify(actual.reasons) === JSON.stringify(expectedReasons)
      ? [] : [{ name, expectedOk, expectedReasons, actual }];
  });
  if (inventoryReloadDurabilityDrift.length) {
    throw new Error(`SELFTEST Inventory reload durability controls drifted: ${JSON.stringify(inventoryReloadDurabilityDrift)}`);
  }
  const inventoryPanelClose = Object.freeze({
    point: Object.freeze({
      ok: true, owner: 'inventory', tag: 'BUTTON', x: 1224, y: 61, width: 44, height: 44,
    }),
    pointer: Object.freeze({
      tag: 'BUTTON', panelCloseOwner: 'inventory', trusted: true, pointerType: 'mouse', x: 1224, y: 61,
    }),
    settled: Object.freeze({
      panelPresent: true, display: 'none', ariaHidden: 'true', openerPresent: true,
      panelOpen: null, inventoryExpanded: 'false', focusId: 'railinventory',
      diagnostics: Object.freeze({
        activeCount: 0, retainedCount: 0, pendingWork: 0, selectedInstanceId: null,
      }),
    }),
  });
  const inventoryPanelCloseControls = [
    ['green', inventoryPanelClose, true, []],
    ['absent', null, false,
      ['panel Close target point', 'trusted panel Close pointer', 'closed panel/focus/zero ownership']],
    ['point-red', { ...inventoryPanelClose,
      point: { ...inventoryPanelClose.point, ok: false } }, false, ['panel Close target point']],
    ['wrong-point-owner', { ...inventoryPanelClose,
      point: { ...inventoryPanelClose.point, owner: 'atlas' } }, false, ['panel Close target point']],
    ['wrong-point-tag', { ...inventoryPanelClose,
      point: { ...inventoryPanelClose.point, tag: 'DIV' } }, false, ['panel Close target point']],
    ['narrow-point', { ...inventoryPanelClose,
      point: { ...inventoryPanelClose.point, width: 43 } }, false, ['panel Close target point']],
    ['short-point', { ...inventoryPanelClose,
      point: { ...inventoryPanelClose.point, height: 43 } }, false, ['panel Close target point']],
    ['missing-receipt', { ...inventoryPanelClose, pointer: null }, false, ['trusted panel Close pointer']],
    ['wrong-receipt-tag', { ...inventoryPanelClose,
      pointer: { ...inventoryPanelClose.pointer, tag: 'SPAN' } }, false, ['trusted panel Close pointer']],
    ['wrong-receipt-owner', { ...inventoryPanelClose,
      pointer: { ...inventoryPanelClose.pointer, panelCloseOwner: 'atlas' } }, false,
    ['trusted panel Close pointer']],
    ['untrusted', { ...inventoryPanelClose,
      pointer: { ...inventoryPanelClose.pointer, trusted: false } }, false, ['trusted panel Close pointer']],
    ['touch', { ...inventoryPanelClose,
      pointer: { ...inventoryPanelClose.pointer, pointerType: 'touch' } }, false,
    ['trusted panel Close pointer']],
    ['coordinate-drift', { ...inventoryPanelClose,
      pointer: { ...inventoryPanelClose.pointer, x: 1226 } }, false,
    ['panel Close point/receipt binding']],
    ['missing-panel', { ...inventoryPanelClose,
      settled: { ...inventoryPanelClose.settled, panelPresent: false } }, false,
    ['closed panel/focus/zero ownership']],
    ['visible-panel', { ...inventoryPanelClose,
      settled: { ...inventoryPanelClose.settled, display: 'block' } }, false,
    ['closed panel/focus/zero ownership']],
    ['aria-visible-panel', { ...inventoryPanelClose,
      settled: { ...inventoryPanelClose.settled, ariaHidden: 'false' } }, false,
    ['closed panel/focus/zero ownership']],
    ['missing-opener', { ...inventoryPanelClose,
      settled: { ...inventoryPanelClose.settled, openerPresent: false } }, false,
    ['closed panel/focus/zero ownership']],
    ['retained-panel-open', { ...inventoryPanelClose,
      settled: { ...inventoryPanelClose.settled, panelOpen: 'inventory' } }, false,
    ['closed panel/focus/zero ownership']],
    ['retained-expanded', { ...inventoryPanelClose,
      settled: { ...inventoryPanelClose.settled, inventoryExpanded: 'true' } }, false,
    ['closed panel/focus/zero ownership']],
    ['wrong-focus', { ...inventoryPanelClose,
      settled: { ...inventoryPanelClose.settled, focusId: 'railatlas' } }, false,
    ['closed panel/focus/zero ownership']],
    ['active-owner', { ...inventoryPanelClose,
      settled: { ...inventoryPanelClose.settled,
        diagnostics: { ...inventoryPanelClose.settled.diagnostics, activeCount: 1 } } }, false,
    ['closed panel/focus/zero ownership']],
    ['retained-owner', { ...inventoryPanelClose,
      settled: { ...inventoryPanelClose.settled,
        diagnostics: { ...inventoryPanelClose.settled.diagnostics, retainedCount: 1 } } }, false,
    ['closed panel/focus/zero ownership']],
    ['pending-work', { ...inventoryPanelClose,
      settled: { ...inventoryPanelClose.settled,
        diagnostics: { ...inventoryPanelClose.settled.diagnostics, pendingWork: 1 } } }, false,
    ['closed panel/focus/zero ownership']],
    ['selected-owner', { ...inventoryPanelClose,
      settled: { ...inventoryPanelClose.settled,
        diagnostics: { ...inventoryPanelClose.settled.diagnostics,
          selectedInstanceId: inventoryInstanceId } } }, false,
    ['closed panel/focus/zero ownership']],
  ];
  const inventoryPanelCloseDrift = inventoryPanelCloseControls.flatMap(([
    name, observation, expectedOk, expectedReasons,
  ]) => {
    const actual = assessInventoryPanelClose(observation);
    return actual.ok === expectedOk && JSON.stringify(actual.reasons) === JSON.stringify(expectedReasons)
      ? [] : [{ name, expectedOk, expectedReasons, actual }];
  });
  if (inventoryPanelCloseDrift.length) {
    throw new Error(`SELFTEST Inventory panel Close controls drifted: ${JSON.stringify(inventoryPanelCloseDrift)}`);
  }
  const inventoryStageGreen = Object.freeze({
    panelOpened: true, rowReachable: true, surfaceGreen: true,
    actionPointGreen: true, actionSettled: true, actionGreen: true, actionClosed: true,
  });
  const inventoryStageRequirements = {
    surface: [
      ['panelOpened', 'Inventory panel open'],
      ['rowReachable', 'exact row reachable'],
    ],
    action: [
      ['panelOpened', 'Inventory panel open'],
      ['rowReachable', 'exact row reachable'],
      ['surfaceGreen', 'surface outcome green'],
    ],
    'action-controls': [
      ['panelOpened', 'Inventory panel open'],
      ['rowReachable', 'exact row reachable'],
      ['surfaceGreen', 'surface outcome green'],
      ['actionPointGreen', 'action target reachable'],
      ['actionSettled', 'action commit settled'],
      ['actionGreen', 'action outcome green'],
    ],
    reload: [
      ['panelOpened', 'Inventory panel open'],
      ['rowReachable', 'exact row reachable'],
      ['surfaceGreen', 'surface outcome green'],
      ['actionPointGreen', 'action target reachable'],
      ['actionSettled', 'action commit settled'],
      ['actionGreen', 'action outcome green'],
      ['actionClosed', 'committed detail closed'],
    ],
  };
  const inventoryStageControls = Object.entries(inventoryStageRequirements).flatMap(([
    stage, requirements,
  ]) => [
    [`${stage}-green`, stage, inventoryStageGreen, true, []],
    ...requirements.map(([key, diagnosis]) => [
      `${stage}-${key}-red`, stage, { ...inventoryStageGreen, [key]: false }, false, [diagnosis],
    ]),
  ]);
  inventoryStageControls.push(
    ['reload-root-red-does-not-pass', 'reload', {
      ...inventoryStageGreen, rowReachable: false, surfaceGreen: false,
      actionPointGreen: false, actionSettled: false, actionGreen: false, actionClosed: false,
    }, false, ['exact row reachable', 'surface outcome green', 'action target reachable',
      'action commit settled', 'action outcome green', 'committed detail closed']],
  );
  const inventoryStageDrift = inventoryStageControls.flatMap(([
    name, stage, evidence, expectedOk, expectedReasons,
  ]) => {
    const actual = assessInventoryStagePrefix(stage, evidence);
    return actual.ok === expectedOk && JSON.stringify(actual.reasons) === JSON.stringify(expectedReasons)
      ? [] : [{ name, stage, expectedOk, expectedReasons, actual }];
  });
  let invalidInventoryStageRejected = false;
  try { assessInventoryStagePrefix('unknown', inventoryStageGreen); }
  catch (error) { invalidInventoryStageRejected = error instanceof TypeError; }
  if (!invalidInventoryStageRejected) {
    inventoryStageDrift.push({ name: 'unknown-stage', expected: 'TypeError' });
  }
  if (inventoryStageDrift.length) {
    throw new Error(`SELFTEST Inventory causal-prefix controls drifted: ${JSON.stringify(inventoryStageDrift)}`);
  }
  const canonicalArc4Output = [ARC4_LEDGER_LINE, ARC4_PASS_MARKER].join('\n');
  const canonicalArc4 = assessArc4SuccessEvidence(canonicalArc4Output);
  if (!canonicalArc4.ok || canonicalArc4.ledgerLineCount !== 1
    || canonicalArc4.passMarkerCount !== 1
    || JSON.stringify(canonicalArc4.ledger) !== JSON.stringify(ARC4_LEDGER)) {
    throw new Error(`SELFTEST canonical Arc 4 evidence was refused: ${JSON.stringify(canonicalArc4)}`);
  }
  const arc4LedgerLine = (ledger) => ARC4_LEDGER_PREFIX + JSON.stringify(ledger);
  const reorderedStages = [...ARC4_LEDGER_STAGES];
  [reorderedStages[0], reorderedStages[1]] = [reorderedStages[1], reorderedStages[0]];
  const arc4Mutants = [
    ['missing-ledger', ARC4_PASS_MARKER, 'ledger line'],
    ['duplicate-ledger', [ARC4_LEDGER_LINE, ARC4_LEDGER_LINE, ARC4_PASS_MARKER].join('\n'), 'ledger line'],
    ['primitive-ledger', [ARC4_LEDGER_PREFIX + 'null', ARC4_PASS_MARKER].join('\n'), 'not an object'],
    ['extra-key', [arc4LedgerLine({ ...ARC4_LEDGER, extra: true }), ARC4_PASS_MARKER].join('\n'), 'keys/order'],
    ['key-order', [arc4LedgerLine({ stages: ARC4_LEDGER_STAGES, schema: ARC4_LEDGER.schema,
      burnSteps: 14, recoveryClaimed: false, ok: true }), ARC4_PASS_MARKER].join('\n'), 'keys/order'],
    ['stage-order', [arc4LedgerLine({ ...ARC4_LEDGER, stages: reorderedStages }), ARC4_PASS_MARKER].join('\n'), 'stages/order'],
    ['wrong-count', [arc4LedgerLine({ ...ARC4_LEDGER, burnSteps: 13 }), ARC4_PASS_MARKER].join('\n'), 'burnSteps'],
    ['claimed-recovery', [arc4LedgerLine({ ...ARC4_LEDGER, recoveryClaimed: true }), ARC4_PASS_MARKER].join('\n'), 'claimed browser recovery'],
    ['false-ok', [arc4LedgerLine({ ...ARC4_LEDGER, ok: false }), ARC4_PASS_MARKER].join('\n'), 'ledger ok'],
    ['missing-pass', ARC4_LEDGER_LINE, 'PASS marker'],
    ['duplicate-pass', [ARC4_LEDGER_LINE, ARC4_PASS_MARKER, ARC4_PASS_MARKER].join('\n'), 'PASS marker'],
    ['drifted-pass', [ARC4_LEDGER_LINE, ARC4_PASS_MARKER.replace('Pertar', 'Earth')].join('\n'), 'PASS marker drifted'],
  ];
  const arc4MutantDrift = arc4Mutants.flatMap(([name, output, diagnosis]) => {
    const actual = assessArc4SuccessEvidence(output);
    return !actual.ok && actual.reasons.some((reason) => reason.includes(diagnosis))
      ? [] : [{ name, diagnosis, actual }];
  });
  if (arc4MutantDrift.length) {
    throw new Error(`SELFTEST Arc 4 evidence mutants stayed green: ${JSON.stringify(arc4MutantDrift)}`);
  }
  const stderrOnlyArc4 = assessArc4SuccessEvidence('', canonicalArc4Output);
  if (stderrOnlyArc4.ok
    || !stderrOnlyArc4.reasons.includes('Arc 4 ledger line was not emitted on stdout')
    || !stderrOnlyArc4.reasons.includes('Arc 4 PASS marker was not emitted on stdout')) {
    throw new Error(`SELFTEST stderr-only Arc 4 evidence stayed green: ${JSON.stringify(stderrOnlyArc4)}`);
  }
  const foregroundExpected = Object.freeze({
    targetId: 'lazy-primary', documentToken: 'document-current', serviceToken: 'service-current',
  });
  const foregroundReady = Object.freeze({
    targetId: foregroundExpected.targetId,
    documentToken: foregroundExpected.documentToken,
    visibilityState: 'visible', hidden: false, focused: true,
    service: Object.freeze({
      token: foregroundExpected.serviceToken, visibilityChanges: 0, focusLosses: 0,
      armVisibilityState: 'visible', armHidden: false, armFocused: true,
      raf: true, rafVisibilityState: 'visible', rafHidden: false, rafFocused: true,
      laterTask: true, laterVisibilityState: 'visible', laterHidden: false, laterFocused: true,
    }),
  });
  const foregroundControls = [
    ['ready', foregroundReady, 'ready', null, 999],
    ['wrong-target', { ...foregroundReady, targetId: 'lazy-foreign' }, 'error', 'target identity'],
    ['stale-document', { ...foregroundReady, documentToken: 'document-stale' }, 'error', 'document identity'],
    ['hidden-page', { ...foregroundReady, visibilityState: 'hidden', hidden: true }, 'error', 'page visibility'],
    ['unfocused-page', { ...foregroundReady, focused: false }, 'error', 'page unfocused'],
    ['stale-service', { ...foregroundReady, service: { ...foregroundReady.service, token: 'service-stale' } }, 'error', 'service identity'],
    ['hidden-arm', { ...foregroundReady, service: { ...foregroundReady.service,
      armVisibilityState: 'hidden', armHidden: true } }, 'error', 'arm visibility'],
    ['unfocused-arm', { ...foregroundReady, service: { ...foregroundReady.service,
      armFocused: false } }, 'error', 'arm unfocused'],
    ['visibility-transition', { ...foregroundReady, service: { ...foregroundReady.service,
      visibilityChanges: 1 } }, 'error', 'visibility changed'],
    ['focus-transition', { ...foregroundReady, service: { ...foregroundReady.service,
      focusLosses: 1 } }, 'error', 'focus lost'],
    ['missing-rendering-opportunity', { ...foregroundReady, service: { ...foregroundReady.service,
      raf: false, rafVisibilityState: null, rafHidden: null, rafFocused: null,
      laterTask: false, laterVisibilityState: null, laterHidden: null, laterFocused: null } },
    'pending', 'rendering opportunity pending'],
    ['missing-later-task', { ...foregroundReady, service: { ...foregroundReady.service,
      laterTask: false, laterVisibilityState: null, laterHidden: null, laterFocused: null } },
    'pending', 'later task pending'],
    ['reversed-service-order', { ...foregroundReady, service: { ...foregroundReady.service,
      raf: false, rafVisibilityState: null, rafHidden: null, rafFocused: null } },
    'error', 'service phase order'],
    ['exact-deadline', foregroundReady, 'error', 'at/after deadline', 1000],
    ['just-late', foregroundReady, 'error', 'at/after deadline', 1000.001],
  ];
  const foregroundDrift = foregroundControls.flatMap(([
    name, observation, expectedStatus, diagnosis, receivedAtMs = 999,
  ]) => {
    const actual = classifyForegroundServiceTurnReceipt(
      observation, foregroundExpected, 1000, receivedAtMs,
    );
    const diagnosed = diagnosis === null
      ? actual.reasons.length === 0
      : actual.reasons.some((reason) => reason.includes(diagnosis));
    return actual.status === expectedStatus && diagnosed
      ? [] : [{ name, expectedStatus, diagnosis, actual }];
  });
  if (foregroundDrift.length) {
    throw new Error(`SELFTEST foreground service controls drifted: ${JSON.stringify(foregroundDrift)}`);
  }
  const trainingExpected = Object.freeze({
    documentToken: 'training-document-current', primaryRaw: '{"training":"exact"}',
  });
  const trainingReady = Object.freeze({
    documentToken: trainingExpected.documentToken, primaryRaw: trainingExpected.primaryRaw,
    state: Object.freeze({
      tutActive: true, tutDone: false, tutStep: 'welcome', trainingCheckpointKind: 'legacy-v1',
      trainingCheckpointWriteHeld: true, tutSnapshotPending: Object.freeze({ view: Object.freeze({}) }),
      mode: 'system', gal: 999, star: 424242, planet: null,
      navGalaxyKey: 'galaxy-current', navStarKey: 'star-current', navWorldKey: null,
      renderedScene: Object.freeze({
        mode: 'system', serial: 1, galaxyKey: 'galaxy-current', starKey: 'star-current', worldKey: null,
      }),
    }),
    card: true, trainingBody: true,
    button: Object.freeze({ present: true, connected: true, disabled: false, visible: true }),
    buttonOwnedByCard: true,
    status: Object.freeze({ present: true, hidden: true }), statusOwnedByCard: true, tickerStarted: true,
  });
  const trainingControls = [
    ['ready', trainingReady, true, []],
    ['absent-observation', null, false, ['precondition observation absent']],
    ['state-absent', { ...trainingReady, state: null }, false, ['Training state absent']],
    ['stale-document', { ...trainingReady, documentToken: 'training-document-stale' }, false, ['document identity']],
    ['wrong-primary', { ...trainingReady, primaryRaw: '{"training":"stale"}' }, false, ['primary bytes']],
    ['inactive-state', { ...trainingReady, state: { ...trainingReady.state, tutActive: false } }, false, ['Training is not runnable at welcome']],
    ['completed-state', { ...trainingReady, state: { ...trainingReady.state, tutDone: true } }, false, ['Training is not runnable at welcome']],
    ['wrong-step', { ...trainingReady, state: { ...trainingReady.state, tutStep: 'atlas-open' } }, false, ['Training is not runnable at welcome']],
    ['wrong-checkpoint', { ...trainingReady, state: { ...trainingReady.state, trainingCheckpointKind: 'none' } }, false, ['legacy checkpoint ownership']],
    ['checkpoint-not-held', { ...trainingReady, state: { ...trainingReady.state, trainingCheckpointWriteHeld: false } }, false, ['legacy checkpoint ownership']],
    ['checkpoint-payload-absent', { ...trainingReady, state: { ...trainingReady.state, tutSnapshotPending: null } }, false, ['legacy checkpoint ownership']],
    ['checkpoint-payload-array', { ...trainingReady, state: { ...trainingReady.state, tutSnapshotPending: [] } }, false, ['legacy checkpoint ownership']],
    ['wrong-mode', { ...trainingReady, state: { ...trainingReady.state, mode: 'galaxy' } }, false, ['Training route']],
    ['wrong-galaxy', { ...trainingReady, state: { ...trainingReady.state, gal: 998 } }, false, ['Training route']],
    ['wrong-route', { ...trainingReady, state: { ...trainingReady.state, star: 7 } }, false, ['Training route']],
    ['unexpected-planet', { ...trainingReady, state: { ...trainingReady.state, planet: 133 } }, false, ['Training route']],
    ['missing-galaxy-key', { ...trainingReady, state: { ...trainingReady.state, navGalaxyKey: null,
      renderedScene: { ...trainingReady.state.renderedScene, galaxyKey: null } } }, false, ['Training route']],
    ['missing-star-key', { ...trainingReady, state: { ...trainingReady.state, navStarKey: null,
      renderedScene: { ...trainingReady.state.renderedScene, starKey: null } } }, false, ['Training route']],
    ['unexpected-world-key', { ...trainingReady, state: { ...trainingReady.state,
      navWorldKey: 'world-foreign' } }, false, ['Training route']],
    ['render-absent', { ...trainingReady, state: { ...trainingReady.state, renderedScene: null } }, false, ['rendered Training route']],
    ['render-mode-drift', { ...trainingReady, state: { ...trainingReady.state,
      renderedScene: { ...trainingReady.state.renderedScene, mode: 'galaxy' } } }, false, ['rendered Training route']],
    ['render-drift', { ...trainingReady, state: { ...trainingReady.state,
      renderedScene: { ...trainingReady.state.renderedScene, serial: 0 } } }, false, ['rendered Training route']],
    ['render-galaxy-key-drift', { ...trainingReady, state: { ...trainingReady.state,
      renderedScene: { ...trainingReady.state.renderedScene, galaxyKey: 'galaxy-foreign' } } }, false, ['rendered Training route']],
    ['render-star-key-drift', { ...trainingReady, state: { ...trainingReady.state,
      renderedScene: { ...trainingReady.state.renderedScene, starKey: 'star-foreign' } } }, false, ['rendered Training route']],
    ['render-world-key-drift', { ...trainingReady, state: { ...trainingReady.state,
      renderedScene: { ...trainingReady.state.renderedScene, worldKey: 'world-foreign' } } }, false, ['rendered Training route']],
    ['missing-card', { ...trainingReady, card: false }, false, ['Training card']],
    ['missing-training-body', { ...trainingReady, trainingBody: false }, false, ['Training card']],
    ['missing-button', { ...trainingReady, button: { ...trainingReady.button, present: false } }, false, ['runnable Skip action']],
    ['disconnected-button', { ...trainingReady, button: { ...trainingReady.button, connected: false } }, false, ['runnable Skip action']],
    ['disabled-button', { ...trainingReady, button: { ...trainingReady.button, disabled: true } }, false, ['runnable Skip action']],
    ['hidden-button', { ...trainingReady, button: { ...trainingReady.button, visible: false } }, false, ['runnable Skip action']],
    ['button-parent-escape', { ...trainingReady, buttonOwnedByCard: false }, false, ['runnable Skip action']],
    ['missing-status', { ...trainingReady, status: { ...trainingReady.status, present: false } }, false, ['idle Training status']],
    ['non-idle-status', { ...trainingReady, status: { ...trainingReady.status, hidden: false } }, false, ['idle Training status']],
    ['status-parent-escape', { ...trainingReady, statusOwnedByCard: false }, false, ['idle Training status']],
    ['stopped-ticker', { ...trainingReady, tickerStarted: false }, false, ['outgoing ticker']],
  ];
  const trainingDrift = trainingControls.flatMap(([name, observation, expectedOk, expectedReasons]) => {
    const actual = assessTrainingBusyRefusalPrecondition(observation, trainingExpected);
    return actual.ok === expectedOk && JSON.stringify(actual.reasons) === JSON.stringify(expectedReasons)
      ? [] : [{ name, expectedOk, expectedReasons, actual }];
  });
  for (const [name, expected] of [
    ['missing-expected-authority', null],
    ['missing-expected-document', { ...trainingExpected, documentToken: '' }],
    ['missing-expected-primary', { ...trainingExpected, primaryRaw: '' }],
  ]) {
    let rejected = false;
    try { assessTrainingBusyRefusalPrecondition(trainingReady, expected); }
    catch (error) { rejected = error instanceof TypeError; }
    if (!rejected) trainingDrift.push({ name, expected: 'TypeError' });
  }
  if (trainingDrift.length) {
    throw new Error(`SELFTEST Training busy-refusal precondition controls drifted: ${JSON.stringify(trainingDrift)}`);
  }
  const trainingBindingControls = [
    ['complete-before', [{}, {}], 999, true],
    ['incomplete-before', [{}], 999, false],
    ['complete-exact-boundary', [{}, {}], 1000, false],
    ['complete-just-late', [{}, {}], 1000.001, false],
  ];
  const trainingBindingDrift = trainingBindingControls.flatMap(([name, entries, receivedAt, expected]) => {
    const actual = trainingBindingReceiptBeforeDeadline(entries, 2, 1000, receivedAt);
    return actual === expected ? [] : [{ name, expected, actual }];
  });
  let invalidTrainingBindingRejected = false;
  try { trainingBindingReceiptBeforeDeadline([], 0, 1000, 999); }
  catch (error) { invalidTrainingBindingRejected = error instanceof TypeError; }
  if (!invalidTrainingBindingRejected) {
    trainingBindingDrift.push({ name: 'invalid-count', expected: 'TypeError' });
  }
  if (trainingBindingDrift.length) {
    throw new Error(`SELFTEST Training binding receipt controls drifted: ${JSON.stringify(trainingBindingDrift)}`);
  }
  const readyImage = Object.freeze({
    state: 'ready', hasSrc: true, complete: true, naturalWidth: 132, naturalHeight: 132,
  });
  const settled = {
    on: true, n: 3, images: [readyImage, readyImage, readyImage],
    art: { live: { queuedJobs: 0, activeJobs: 0 } },
  };
  const settlementControls = [
    ['settled', settled, 'ready', null],
    ['missing-src', { ...settled, images: settled.images.map((image) => ({ ...image, hasSrc: false })) }, 'error', 'ready without src'],
    ['decode-pending', { ...settled, images: settled.images.map((image) => ({ ...image, complete: false })) }, 'pending', 'decode pending'],
    ['wrong-size', { ...settled, images: settled.images.map((image) => ({ ...image, naturalWidth: 440, naturalHeight: 440 })) }, 'error', 'dimensions 440x440'],
    ['placeholder', { ...settled, images: settled.images.map((image) => ({ ...image, state: 'placeholder' })) }, 'pending', 'placeholder'],
    ['producer-error', { ...settled, images: settled.images.map((image) => ({ ...image, state: 'error' })) }, 'error', 'producer error'],
    ['queued-work', { ...settled, art: { live: { queuedJobs: 1, activeJobs: 0 } } }, 'pending', 'queuedJobs 1'],
    ['active-work', { ...settled, art: { live: { queuedJobs: 0, activeJobs: 1 } } }, 'pending', 'activeJobs 1'],
    ['missing-art-diagnostics', { ...settled, art: null }, 'pending', 'art diagnostics absent'],
    ['short-roster', { ...settled, n: 2, images: settled.images.slice(0, 2) }, 'pending', 'roster count 2'],
    ['image-count-mismatch', { ...settled, images: settled.images.slice(0, 2) }, 'pending', 'image count 2'],
  ];
  const settlementDrift = settlementControls.flatMap(([name, observation, expected, diagnosis]) => {
    const actual = classifyPlanetsideSettlement(observation);
    const diagnosed = diagnosis === null
      ? actual.reasons.length === 0
      : actual.reasons.some((reason) => reason.includes(diagnosis));
    return actual.status === expected && diagnosed ? [] : [{ name, expected, diagnosis, actual }];
  });
  if (settlementDrift.length) {
    throw new Error(`SELFTEST Planetside semantic settlement controls drifted: ${JSON.stringify(settlementDrift)}`);
  }
  const detailExpected = Object.freeze({
    documentToken: 'document-current', preEnterGeneration: 41, logicalId: 'detail-current',
  });
  const detailReady = Object.freeze({
    documentToken: detailExpected.documentToken, generation: detailExpected.preEnterGeneration + 1,
    panelMode: 'detail', detailPresent: true, logicalId: detailExpected.logicalId,
    image: Object.freeze({
      present: true, connected: true, state: 'ready', hasSrc: true, srcLength: 5001,
      complete: true, naturalWidth: 440, naturalHeight: 440,
    }),
  });
  const detailControls = [
    ['ready', detailReady, 'ready', []],
    ['placeholder', { ...detailReady, image: { ...detailReady.image,
      state: 'placeholder' } }, 'pending', ['detail portrait placeholder']],
    ['ready-no-src', { ...detailReady, image: { ...detailReady.image,
      hasSrc: false } }, 'error', ['detail portrait ready without src']],
    ['ready-short-src', { ...detailReady, image: { ...detailReady.image,
      srcLength: 5000 } }, 'error', ['detail portrait src length 5000']],
    ['decode-pending', { ...detailReady, image: { ...detailReady.image,
      complete: false } }, 'pending', ['detail portrait decode pending']],
    ['wrong-dimensions', { ...detailReady, image: { ...detailReady.image,
      naturalWidth: 132 } }, 'error', ['detail portrait dimensions 132x440']],
    ['producer-error', { ...detailReady, image: { ...detailReady.image,
      state: 'error' } }, 'error', ['detail portrait producer error']],
    ['closed-detail', { ...detailReady, panelMode: 'closed', detailPresent: false },
      'error', ['detail surface "closed"/false']],
    ['wrong-document', { ...detailReady, documentToken: 'document-stale' },
      'error', ['document identity "document-stale"']],
    ['stale-generation', { ...detailReady, generation: detailExpected.preEnterGeneration },
      'error', ['Compendium generation 41']],
    ['stale-owner', { ...detailReady, logicalId: 'detail-stale' },
      'error', ['logical owner "detail-stale"']],
    ['disconnected-owner', { ...detailReady, image: { ...detailReady.image,
      connected: false } }, 'error', ['detail image disconnected']],
  ];
  const detailDrift = detailControls.flatMap(([name, observation, expectedStatus, expectedReasons]) => {
    const actual = classifyCompendiumDetailSettlement(observation, detailExpected);
    return actual.status === expectedStatus
      && JSON.stringify(actual.reasons) === JSON.stringify(expectedReasons)
      ? [] : [{ name, expectedStatus, expectedReasons, actual }];
  });
  const detailBeforeDeadline = classifyCompendiumDetailReceipt(detailReady, detailExpected, 1000, 999.999);
  const detailAtDeadline = classifyCompendiumDetailReceipt(detailReady, detailExpected, 1000, 1000);
  const detailJustLate = classifyCompendiumDetailReceipt(detailReady, detailExpected, 1000, 1000.001);
  if (detailBeforeDeadline.status !== 'ready' || detailBeforeDeadline.reasons.length !== 0
    || detailAtDeadline.status !== 'error'
    || JSON.stringify(detailAtDeadline.reasons) !== JSON.stringify([
      'detail observation received at/after deadline (1000 >= 1000)',
    ])
    || detailJustLate.status !== 'error'
    || JSON.stringify(detailJustLate.reasons) !== JSON.stringify([
      'detail observation received at/after deadline (1000.001 >= 1000)',
    ])) {
    detailDrift.push({
      name: 'strict-deadline-receipt', detailBeforeDeadline, detailAtDeadline, detailJustLate,
    });
  }
  if (detailDrift.length) {
    throw new Error(`SELFTEST Compendium detail settlement controls drifted: ${JSON.stringify(detailDrift)}`);
  }
  const phaseDeadline = 1000.75;
  const labelledTimeoutDecision = planetsideRuntimeTimeoutDecision(
    new Error('slice smoke: timed out waiting for Runtime.evaluate'),
    30000,
  );
  if (planetsidePhaseRemainingMs(phaseDeadline, 250.25) !== 750
    || planetsidePhaseRemainingMs(phaseDeadline, 1000.75) !== 0
    || planetsidePhaseRemainingMs(phaseDeadline, 1001) !== 0
    || labelledTimeoutDecision?.status !== 'pending'
    || labelledTimeoutDecision.reasons[0] !== 'phase deadline expired during target observation (30000ms)'
    || planetsideRuntimeTimeoutDecision(
      new Error('slice smoke: timed out waiting for Page.navigate'), 30000,
    ) !== null
    || planetsideRuntimeTimeoutDecision(
      new Error('slice smoke: timed out waiting for Runtime.evaluate after retry'), 30000,
    ) !== null) {
    throw new Error('SELFTEST Planetside monotonic deadline/labelled-timeout controls drifted');
  }
  const selftestPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64',
  );
  if (!structurallyValidPng(selftestPng)) {
    throw new Error('SELFTEST canonical PNG fixture is malformed');
  }
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-smoke-report-selftest-'));
  try {
    fs.writeFileSync(path.join(tempRoot, 'slice-stale-unrelated.png'), 'stale');
    fs.writeFileSync(path.join(tempRoot, 'slice-selftest-run-current.png'), selftestPng);
    const selected = screenshots('selftest-run', tempRoot);
    if (selected.length !== 1 || selected[0].name !== 'slice-selftest-run-current.png'
      || selected[0].sha256 !== sha256(selftestPng)) {
      throw new Error(`SELFTEST stale screenshot entered run evidence: ${JSON.stringify(selected)}`);
    }
    const evidenceRunId = 'evidence-selftest';
    const artifacts = runArtifactPaths(evidenceRunId, tempRoot);
    for (const logicalName of SLICE_SCREENSHOT_LOGICAL_NAMES) {
      fs.writeFileSync(path.join(tempRoot, `slice-${evidenceRunId}-${logicalName}.png`), selftestPng);
    }
    const canonicalScreenshots = screenshots(evidenceRunId, tempRoot);
    const evidenceSource = {
      commit: 'a'.repeat(40), branch: 'openai/test', state: 'committed',
      statusSha256: 'b'.repeat(64), workingTreeSha256: 'c'.repeat(64),
    };
    const evidenceStartedAt = '2026-08-27T00:00:00.000Z';
    const evidenceStdout = `${ARC4_LEDGER_LINE}\n${ARC4_PASS_MARKER}\nSLICE SMOKE: PASS — selftest\n`;
    const evidenceStderr = '';
    const evidenceLog = rawLogPrefix(evidenceRunId, evidenceStartedAt)
      + evidenceStdout + '\n[stderr]\n' + evidenceStderr;
    fs.writeFileSync(artifacts.log, evidenceLog, { flag: 'wx' });
    const canonicalEvidence = {
      schema: 'cf-v2-slice-smoke-ci/v1', status: 'pass', terminal: true, certifying: true,
      exit: { code: 0, childCode: 0, signal: null, spawnError: null },
      startedAt: evidenceStartedAt, endedAt: '2026-08-27T00:00:01.000Z', durationMs: 1000,
      run: { id: evidenceRunId, artifactPath: artifacts.reportRelative,
        screenshotPattern: `apps/game/smoke/slice-${evidenceRunId}-*.png` },
      source: evidenceSource, sourceEnd: { ...evidenceSource },
      sourceChange: { detected: false, ending: null },
      browser: {
        executable: path.resolve('/selftest/chromium'),
        version: 'Chromium 999.0.0.1',
        resolutionError: null,
      },
      retryPolicy: { automaticRetries: 0 },
      childOutput: {
        stdoutBytes: Buffer.byteLength(evidenceStdout), stdoutSha256: sha256(evidenceStdout),
        stderrBytes: 0, stderrSha256: sha256(''), overallPassMarkerCount: 1,
      },
      rawLog: { path: artifacts.logRelative, bytes: Buffer.byteLength(evidenceLog), sha256: sha256(evidenceLog) },
      screenshots: canonicalScreenshots, arc4SuccessEvidence: {
        ok: true, ledger: ARC4_LEDGER, ledgerLineCount: 1, passMarkerCount: 1,
      },
    };
    fs.writeFileSync(artifacts.report, JSON.stringify(canonicalEvidence) + '\n', { flag: 'wx' });
    const reservedBytes = fs.readFileSync(artifacts.report);
    let reusedRunIdRefused = false;
    try { atomicCreateFile(artifacts.report, 'replacement must not land\n'); }
    catch { reusedRunIdRefused = true; }
    if (!reusedRunIdRefused || !fs.readFileSync(artifacts.report).equals(reservedBytes)) {
      throw new Error('SELFTEST reused Slice run ID overwrote its immutable artifact');
    }
    const verified = verifySliceRunEvidence(evidenceRunId, {
      directory: tempRoot, expectedSource: evidenceSource, requirePass: true, requireCommitted: true,
    });
    /* The mutable current pointer is deliberately not authority. A stale
       PASS there must neither shadow nor certify the selected immutable run. */
    fs.writeFileSync(path.join(tempRoot, 'slice-smoke-report.json'), JSON.stringify({
      ...canonicalEvidence, run: { ...canonicalEvidence.run, id: 'stale-pass' },
    }));
    const staleAliasIgnored = verifySliceRunEvidence(evidenceRunId, {
      directory: tempRoot, expectedSource: evidenceSource, requirePass: true, requireCommitted: true,
    });
    const interrupted = sliceRunEvidenceErrors({
      ...canonicalEvidence, status: 'running', terminal: false, certifying: false, exit: null,
    }, { runId: evidenceRunId, directory: tempRoot, expectedSource: evidenceSource, requirePass: true });
    const dirtySource = { ...evidenceSource, state: 'dirty-diagnostic' };
    const dirty = sliceRunEvidenceErrors({
      ...canonicalEvidence, certifying: false, source: dirtySource, sourceEnd: dirtySource,
    }, { runId: evidenceRunId, directory: tempRoot, expectedSource: dirtySource, requirePass: true, requireCommitted: true });
    const wrongId = sliceRunEvidenceErrors({
      ...canonicalEvidence, run: { ...canonicalEvidence.run, id: 'foreign-run' },
    }, { runId: evidenceRunId, directory: tempRoot, expectedSource: evidenceSource });
    const wrongSource = sliceRunEvidenceErrors(canonicalEvidence, {
      runId: evidenceRunId, directory: tempRoot,
      expectedSource: { ...evidenceSource, workingTreeSha256: 'd'.repeat(64) },
    });
    const evidenceOptions = {
      runId: evidenceRunId, directory: tempRoot,
      expectedSource: evidenceSource, requirePass: true, requireCommitted: true,
    };
    const missingBrowser = sliceRunEvidenceErrors({
      ...canonicalEvidence, browser: null,
    }, evidenceOptions);
    const malformedBrowser = sliceRunEvidenceErrors({
      ...canonicalEvidence,
      browser: {
        executable: 'relative/browser', version: 'Firefox 999.0',
        resolutionError: 'injected resolver failure',
      },
    }, evidenceOptions);
    const holdingRoot = path.join(tempRoot, 'held-screenshots');
    fs.mkdirSync(holdingRoot);
    for (const row of canonicalScreenshots) {
      fs.renameSync(path.join(tempRoot, row.name), path.join(holdingRoot, row.name));
    }
    const emptyScreenshots = sliceRunEvidenceErrors({
      ...canonicalEvidence, screenshots: [],
    }, evidenceOptions);
    for (const row of canonicalScreenshots) {
      fs.renameSync(path.join(holdingRoot, row.name), path.join(tempRoot, row.name));
    }
    const missingRow = canonicalScreenshots[0];
    fs.renameSync(path.join(tempRoot, missingRow.name), path.join(holdingRoot, missingRow.name));
    const partialScreenshots = screenshots(evidenceRunId, tempRoot);
    const diagnosticRed = sliceRunEvidenceErrors({
      ...canonicalEvidence,
      status: 'fail', certifying: false,
      exit: { ...canonicalEvidence.exit, code: 1, childCode: 1 },
      browser: null, screenshots: partialScreenshots,
    }, {
      runId: evidenceRunId, directory: tempRoot, expectedSource: evidenceSource,
    });
    const missingScreenshot = sliceRunEvidenceErrors({
      ...canonicalEvidence, screenshots: partialScreenshots,
    }, evidenceOptions);
    fs.renameSync(path.join(holdingRoot, missingRow.name), path.join(tempRoot, missingRow.name));
    const extraName = `slice-${evidenceRunId}-extra.png`;
    fs.writeFileSync(path.join(tempRoot, extraName), selftestPng);
    const extraScreenshot = sliceRunEvidenceErrors({
      ...canonicalEvidence, screenshots: screenshots(evidenceRunId, tempRoot),
    }, evidenceOptions);
    fs.unlinkSync(path.join(tempRoot, extraName));
    const mutatedScreenshot = (changes) => canonicalScreenshots.map((row, index) => (
      index === 0 ? { ...row, ...changes } : { ...row }
    ));
    const wrongRunCarrier = path.join(tempRoot, 'slice-foreign-run-codex.png');
    fs.renameSync(path.join(tempRoot, missingRow.name), wrongRunCarrier);
    const wrongRunScreenshot = sliceRunEvidenceErrors({
      ...canonicalEvidence, screenshots: screenshots(evidenceRunId, tempRoot),
    }, evidenceOptions);
    fs.renameSync(wrongRunCarrier, path.join(tempRoot, missingRow.name));
    const unsafePathScreenshot = sliceRunEvidenceErrors({
      ...canonicalEvidence,
      screenshots: mutatedScreenshot({ path: '../outside/slice-evidence-selftest-codex.png' }),
    }, evidenceOptions);
    const wrongHashScreenshot = sliceRunEvidenceErrors({
      ...canonicalEvidence,
      screenshots: mutatedScreenshot({ sha256: 'd'.repeat(64) }),
    }, evidenceOptions);
    fs.writeFileSync(path.join(tempRoot, missingRow.name), 'not a PNG');
    const malformedPngScreenshot = sliceRunEvidenceErrors({
      ...canonicalEvidence, screenshots: screenshots(evidenceRunId, tempRoot),
    }, evidenceOptions);
    fs.writeFileSync(path.join(tempRoot, missingRow.name), selftestPng);
    const originalLog = fs.readFileSync(artifacts.log);
    fs.writeFileSync(artifacts.log, 'mismatched log bytes\n');
    const mismatchedLog = verifySliceRunEvidence(evidenceRunId, { directory: tempRoot });
    fs.writeFileSync(artifacts.log, originalLog);
    const forgedStdout = 'SLICE SMOKE: PASS — forged without Arc 4 evidence\n';
    const forgedLog = rawLogPrefix(evidenceRunId, evidenceStartedAt)
      + forgedStdout + '\n[stderr]\n';
    fs.writeFileSync(artifacts.log, forgedLog);
    const forgedReport = {
      ...canonicalEvidence,
      childOutput: {
        stdoutBytes: Buffer.byteLength(forgedStdout), stdoutSha256: sha256(forgedStdout),
        stderrBytes: 0, stderrSha256: sha256(''), overallPassMarkerCount: 1,
      },
      rawLog: { path: artifacts.logRelative, bytes: Buffer.byteLength(forgedLog), sha256: sha256(forgedLog) },
    };
    fs.writeFileSync(artifacts.report, JSON.stringify(forgedReport) + '\n');
    const forgedPass = verifySliceRunEvidence(evidenceRunId, { directory: tempRoot });
    fs.writeFileSync(artifacts.log, originalLog);
    fs.writeFileSync(artifacts.report, JSON.stringify(canonicalEvidence) + '\n');
    const missing = verifySliceRunEvidence('missing-selftest', { directory: tempRoot });
    const includes = (rows, fragment) => rows.some((error) => error.includes(fragment));
    if (!verified.ok || !staleAliasIgnored.ok
      || !includes(interrupted, 'not terminal')
      || !includes(interrupted, 'not PASS')
      || !includes(dirty, 'not clean committed')
      || !includes(wrongId, 'run ID mismatch')
      || !includes(wrongSource, 'does not match current source')
      || !includes(missingBrowser, 'browser provenance')
      || !includes(malformedBrowser, 'browser executable provenance')
      || !includes(malformedBrowser, 'browser version provenance')
      || !includes(malformedBrowser, 'browser provenance carries a resolution error')
      || !includes(emptyScreenshots, 'exact ordered ten-surface')
      || diagnosticRed.length !== 0
      || !includes(missingScreenshot, 'exact ordered ten-surface')
      || !includes(extraScreenshot, 'exact ordered ten-surface')
      || !includes(wrongRunScreenshot, 'exact ordered ten-surface current-run inventory')
      || !includes(unsafePathScreenshot, 'exact logical name/current run/safe path')
      || !includes(wrongHashScreenshot, 'byte-for-byte SHA-256 bound')
      || !includes(malformedPngScreenshot, 'structurally valid PNG')
      || mismatchedLog.ok || !includes(mismatchedLog.errors, 'raw-log')
      || forgedPass.ok || !includes(forgedPass.errors, 'Arc 4 PASS')
      || missing.ok || !includes(missing.errors, 'missing')) {
      throw new Error(`SELFTEST immutable evidence controls drifted: ${JSON.stringify({
        verified, staleAliasIgnored, interrupted, dirty, wrongId, wrongSource,
        missingBrowser, malformedBrowser, emptyScreenshots, diagnosticRed, missingScreenshot,
        extraScreenshot, wrongRunScreenshot, unsafePathScreenshot, wrongHashScreenshot,
        malformedPngScreenshot, mismatchedLog, forgedPass, missing,
      })}`);
    }
  } finally {
    const tempPrefix = os.tmpdir().endsWith(path.sep) ? os.tmpdir() : os.tmpdir() + path.sep;
    if (!tempRoot.startsWith(tempPrefix)) throw new Error(`refusing unsafe selftest cleanup: ${tempRoot}`);
    fs.rmSync(tempRoot, { recursive: true });
  }
  console.log('SLICE SMOKE REPORT SELFTEST: PASS');
  console.log('  three injected findings retained; two PHONE findings grouped; harness separated');
  console.log('  failure declarations: exact bullet counts accepted; under/over-count and successful-exit contradictions rejected');
  console.log('  Arc 4 success: one canonical ordered ledger + one exact PASS marker accepted; missing/duplicate/key/stage/count/recovery/ok/marker mutants rejected');
  console.log('  source provenance: physical repository + actual full HEAD accepted; required Git failure and empty/malformed/wrong hosted SHA rejected');
  console.log('  source-identity change: mixed-source evidence rejected');
  console.log('  screenshot provenance: injected stale PNG excluded from the exact run manifest');
  console.log('  PASS browser provenance: exact resolved Chromium-family executable/version tuple accepted; missing/malformed/error tuples rejected');
  console.log('  PASS screenshots: exact ten current-run safe PNG carriers accepted; empty/missing/extra/wrong-run/path/hash/malformed mutations rejected');
  console.log('  red evidence: partial screenshots and absent browser provenance remain valid diagnostic carriers');
  console.log('  immutable evidence: selected per-run report/log accepted; stale current PASS, interruption, dirty source, wrong run/source, missing artifact, and log mismatch rejected');
  console.log('  finding scopes: literal harness wins; explicit Arc 4 product prefix survives browser/CDP/timeout payload; unprefixed infrastructure falls back to harness');
  console.log('  infrastructure fatal: retained ahead of generic bundler advice');
  console.log('  Inventory reach/action/Close/reload: visible + Final6-shaped scrolled positives accepted; identity, geometry, owner, pointer, parent-panel survival, receipt bytes/semantics, stable F4 RNG and every causal-prefix bit rejected independently');
  console.log('  foreground service: exact target/document/token, continuous visible focused rAF→later-task authority, exact/late receipt rejection');
  console.log('  D-TRAIN busy refusal: exact fixture/document/card action required; setup/parent drift and exact/late binding receipts rejected');
  console.log('  Planetside settlement: ready+132px+drained accepted; roster/image/decode/art/live-work controls rejected');
  console.log('  Compendium detail: exact document/generation/logical owner plus connected ready+src+decoded 440px accepted; isolated pending/terminal mutations and exact/late deadlines classified');
  console.log('  Planetside phase: monotonic remainder clipped; labelled Runtime.evaluate timeout converted exactly');
  console.log('  retry policy remains zero by construction (one child invocation in the wrapper)');
}

function generatedRunId(startTime) {
  return [
    startTime.toISOString().replace(/[^0-9]/g, '').slice(0, 17),
    String(process.pid),
    crypto.randomBytes(6).toString('hex'),
  ].join('-');
}

function runSliceSmoke() {
  const startedAt = new Date();
  const runId = assertRunId(process.env.CF_V2_SLICE_SMOKE_RUN_ID || generatedRunId(startedAt));
  const artifacts = runArtifactPaths(runId);
  fs.mkdirSync(outputRoot, { recursive: true });
  const releaseWorkspaceLock = acquireWorkspaceLock('v2 structured slice smoke and evidence report');
  let runSource = null;
  let terminalWritten = false;
  let artifactReserved = false;
  try {
    runSource = sourceIdentity();
    const sentinel = runningSliceReport({ runId, source: runSource, startedAt, artifacts });
    /* The per-run path is reserved without replacement. Reusing a run ID is
       refused, while the mutable current pointer is replaced atomically with
       a non-PASS sentinel before the only child invocation can start. */
    atomicWriteJson(currentReportPath, sentinel);
    if (fs.existsSync(artifacts.log) || screenshots(runId).length) {
      throw new Error(`refusing reused Slice run ID with pre-existing carriers: ${runId}`);
    }
    atomicCreateFile(artifacts.report, JSON.stringify(sentinel, null, 2) + '\n');
    artifactReserved = true;

    let browserExecutable = null;
    let browserVersion = null;
    let browserResolutionError = null;
    try {
      browserExecutable = findChromiumBrowser();
      browserVersion = commandVersion(browserExecutable);
    }
    catch (error) { browserResolutionError = error.message; }

    const childEnvironment = workspaceLockChildEnvironment(releaseWorkspaceLock);
    if (browserExecutable) childEnvironment.CF_BROWSER = browserExecutable;
    const run = spawnSync(process.execPath, [path.join(here, 'slicesmoke.mjs')], {
      cwd: v2Root,
      encoding: 'utf8',
      env: {
        ...childEnvironment,
        CF_V2_SLICE_SMOKE_RUN_ID: runId,
      },
      maxBuffer: 32 * 1024 * 1024,
    });
    const stdout = run.stdout || '';
    const stderr = run.stderr || '';
    const combinedLog = rawLogPrefix(runId, startedAt.toISOString())
      + stdout + '\n[stderr]\n' + stderr;
    atomicCreateFile(artifacts.log, combinedLog);
    atomicWriteFile(currentLogPath, combinedLog);

    const childStatus = Number.isInteger(run.status) ? run.status : 1;
    let exitCode = childStatus;
    const failureEvidence = parseFailureEvidence([stdout, stderr].join('\n'), childStatus);
    const findings = [...failureEvidence.findings];
    if (failureEvidence.diagnostics.length) {
      exitCode = 1;
      findings.unshift(...failureEvidence.diagnostics);
    }
    const arc4SuccessEvidence = assessArc4SuccessEvidence(stdout, stderr);
    const overallPassMarkers = stdout.split(/\r?\n/).filter((line) => /^SLICE SMOKE: PASS\b/.test(line));
    if (childStatus === 0 && overallPassMarkers.length !== 1) {
      exitCode = 1;
      findings.unshift(`harness: expected exactly one overall Slice PASS marker, observed ${overallPassMarkers.length}`);
    }
    if (childStatus === 0 && !arc4SuccessEvidence.ok) {
      exitCode = 1;
      findings.unshift(...arc4SuccessEvidence.reasons.map((reason) => `harness: ${reason}`));
    }
    if (run.error) findings.unshift(`harness: slice-smoke child process failed (${run.error.message})`);
    else if (run.signal) findings.unshift(`harness: slice-smoke child process ended on signal ${run.signal}`);
    const endingSource = sourceIdentity();
    const sourceChanged = !sameSource(runSource, endingSource);
    if (sourceChanged) {
      exitCode = 1;
      findings.unshift('harness: source identity changed during slice smoke; mixed-source evidence refused');
    }
    const groups = groupFindings(findings);
    const endedAt = new Date();
    const reportStatus = exitCode === 0 ? 'pass' : (run.error || run.signal ? 'instrument-fail' : 'fail');
    const report = {
      schema: 'cf-v2-slice-smoke-ci/v1',
      status: reportStatus,
      terminal: true,
      certifying: reportStatus === 'pass' && runSource.state === 'committed',
      exit: {
        code: exitCode === 0 ? 0 : (reportStatus === 'instrument-fail' ? 2 : exitCode),
        childCode: run.status, signal: run.signal || null,
        spawnError: run.error?.message || null,
      },
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
      durationMs: endedAt.getTime() - startedAt.getTime(),
      run: {
        id: runId,
        artifactPath: artifacts.reportRelative,
        screenshotPattern: `apps/game/smoke/slice-${runId}-*.png`,
        provenance: 'Only artifacts bearing this cryptographically unique child-run ID are attributed to this execution.',
      },
      source: runSource,
      sourceEnd: endingSource,
      sourceChange: { detected: sourceChanged, ending: sourceChanged ? endingSource : null },
      browser: {
        executable: browserExecutable,
        version: browserVersion,
        resolutionError: browserResolutionError,
      },
      childOutput: {
        stdoutBytes: Buffer.byteLength(stdout), stdoutSha256: sha256(stdout),
        stderrBytes: Buffer.byteLength(stderr), stderrSha256: sha256(stderr),
        overallPassMarkerCount: overallPassMarkers.length,
      },
      retryPolicy: {
        automaticRetries: 0,
        reason: 'A red run remains red; diagnose the first scoped outcome rather than retrying it away.',
      },
      failureEvidence: {
        declaredCount: failureEvidence.declaredCount,
        bulletCount: failureEvidence.bulletCount,
        diagnostics: failureEvidence.diagnostics,
      },
      arc4SuccessEvidence: {
        required: childStatus === 0,
        ok: childStatus === 0 ? arc4SuccessEvidence.ok : null,
        ledger: childStatus === 0 ? arc4SuccessEvidence.ledger : null,
        ledgerLineCount: arc4SuccessEvidence.ledgerLineCount,
        passMarkerCount: arc4SuccessEvidence.passMarkerCount,
        reasons: childStatus === 0 ? arc4SuccessEvidence.reasons : [],
      },
      summary: { findingCount: findings.length, scopeCount: groups.length },
      groups,
      findings: findings.map((message, index) => ({ index, scope: scopeOf(message), message })),
      rawLog: {
        path: artifacts.logRelative,
        bytes: Buffer.byteLength(combinedLog),
        sha256: sha256(combinedLog),
      },
      screenshots: screenshots(runId),
    };
    const prepublicationErrors = sliceRunEvidenceErrors(report, {
      runId, expectedSource: endingSource, requirePass: reportStatus === 'pass',
      requireCommitted: reportStatus === 'pass',
    });
    if (prepublicationErrors.length) {
      throw new Error(`terminal Slice evidence failed before publication: ${prepublicationErrors.join('; ')}`);
    }
    atomicWriteJson(artifacts.report, report);
    atomicWriteJson(currentReportPath, report);
    const verification = verifySliceRunEvidence(runId, { expectedSource: endingSource });
    if (!verification.ok) throw new Error(`terminal Slice evidence failed its named verifier: ${verification.errors.join('; ')}`);
    terminalWritten = true;

    if (reportStatus === 'pass') {
      const summary = stdout.split(/\r?\n/).filter((line) => /^SLICE SMOKE: PASS/.test(line)).at(-1)
        || 'SLICE SMOKE: PASS';
      console.log(summary);
      console.log(`slice run ID: ${runId}`);
      console.log(`immutable evidence: ${artifacts.reportRelative}`);
      console.log('current evidence pointer: apps/game/smoke/slice-smoke-report.json');
      return 0;
    }

    console.error('SLICE SMOKE: FAIL — one execution, no automatic retry');
    if (groups.length) {
      const first = groups[0];
      console.error(`  [${first.scope}] ${first.primary}`);
      const related = findings.length - 1;
      if (related) console.error(`  ${related} related finding${related === 1 ? '' : 's'} retained in structured evidence`);
    }
    console.error(`  raw log: ${artifacts.logRelative}`);
    console.error(`  report: ${artifacts.reportRelative}`);
    return report.exit.code;
  } catch (error) {
    /* If execution reached the child boundary, the already-published running
       sentinel is non-PASS even under abrupt interruption. For ordinary
       exceptions, replace it with terminal red evidence when possible. */
    if (artifactReserved && runSource && fs.existsSync(artifacts.report) && !terminalWritten) {
      const endedAt = new Date();
      const endingSource = sourceIdentity();
      let rawLog = null;
      if (!fs.existsSync(artifacts.log)) {
        const text = `# Celestial Frontier v2 slice smoke wrapper failure\n# run ${runId}\n${String(error?.stack || error)}\n`;
        atomicCreateFile(artifacts.log, text);
        atomicWriteFile(currentLogPath, text);
      }
      const bytes = fs.readFileSync(artifacts.log);
      rawLog = { path: artifacts.logRelative, bytes: bytes.length, sha256: sha256(bytes) };
      const sourceChanged = !sameSource(runSource, endingSource);
      const failure = {
        ...runningSliceReport({ runId, source: runSource, startedAt, artifacts }),
        status: 'instrument-fail', terminal: true, certifying: false,
        exit: { code: 2, childCode: null, signal: null, spawnError: String(error?.message || error) },
        endedAt: endedAt.toISOString(), durationMs: endedAt.getTime() - startedAt.getTime(),
        sourceEnd: endingSource,
        sourceChange: { detected: sourceChanged, ending: sourceChanged ? endingSource : null },
        summary: { findingCount: 1, scopeCount: 1 },
        groups: [{ scope: 'harness', primary: String(error?.message || error), related: [] }],
        findings: [{ index: 0, scope: 'harness', message: String(error?.stack || error) }],
        rawLog, screenshots: screenshots(runId),
      };
      atomicWriteJson(artifacts.report, failure);
      atomicWriteJson(currentReportPath, failure);
    }
    console.error('SLICE SMOKE WRAPPER INSTRUMENT FAILURE');
    console.error('- ' + String(error?.stack || error));
    return 2;
  } finally {
    releaseWorkspaceLock();
  }
}

function runCli() {
  const args = process.argv.slice(2);
  if (args.length === 1 && args[0] === '--selftest') {
    runSelftest();
    return 0;
  }
  const verifyArg = args.find((arg) => arg.startsWith('--verify-run='));
  if (args.length === 1 && verifyArg) {
    const runId = assertRunId(verifyArg.slice('--verify-run='.length));
    const verification = verifySliceRunEvidence(runId, {
      expectedSource: sourceIdentity(), requirePass: true, requireCommitted: true,
    });
    if (!verification.ok) {
      console.error(`SLICE SMOKE VERIFY: FAIL — ${runId}`);
      for (const error of verification.errors) console.error('- ' + error);
      return 2;
    }
    console.log(`SLICE SMOKE VERIFY: PASS — ${runId}`);
    console.log(`report sha256: ${verification.reportSha256}`);
    console.log(`source: ${verification.report.source.commit} ${verification.report.source.branch}`);
    return 0;
  }
  if (args.length !== 0) {
    console.error('usage: node tools/smokereport.mjs [--selftest | --verify-run=<immutable-run-id>]');
    return 2;
  }
  return runSliceSmoke();
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) process.exitCode = runCli();
