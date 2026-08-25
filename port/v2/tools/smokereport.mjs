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
import {
  assessTrainingBusyRefusalPrecondition,
  classifyCompendiumDetailReceipt,
  classifyCompendiumDetailSettlement,
  classifyForegroundServiceTurnReceipt,
  classifyPlanetsideSettlement,
  planetsidePhaseRemainingMs,
  planetsideRuntimeTimeoutDecision,
  trainingBindingReceiptBeforeDeadline,
} from './slicesmoke-contract.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const v2Root = path.resolve(here, '..');
const repoRoot = path.resolve(v2Root, '..', '..');
const outputRoot = path.join(v2Root, 'apps', 'game', 'smoke');
const reportPath = path.join(outputRoot, 'slice-smoke-report.json');
const logPath = path.join(outputRoot, 'slice-smoke.log');
const startedAt = new Date();

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
const ARC4_PASS_MARKER = 'SLICE SMOKE ARC 4: PASS — Pertar seed-68 native hidden Sample hit and counter-1 Tame miss · held no-optimism · exact raw v5/18-namespace/F4/receipt authority · storage/stale/publication convergence · finite Worked Out disabled suppression; 20-minute next-cycle recovery is not claimed by this browser run.';

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

function runSelftest() {
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
  console.log('  failure declarations: exact bullet counts accepted; under/over-count and successful-exit contradictions rejected');
  console.log('  Arc 4 success: one canonical ordered ledger + one exact PASS marker accepted; missing/duplicate/key/stage/count/recovery/ok/marker mutants rejected');
  console.log('  source-identity change: mixed-source evidence rejected');
  console.log('  screenshot provenance: injected stale PNG excluded from the exact run manifest');
  console.log('  finding scopes: literal harness wins; explicit Arc 4 product prefix survives browser/CDP/timeout payload; unprefixed infrastructure falls back to harness');
  console.log('  infrastructure fatal: retained ahead of generic bundler advice');
  console.log('  foreground service: exact target/document/token, continuous visible focused rAF→later-task authority, exact/late receipt rejection');
  console.log('  D-TRAIN busy refusal: exact fixture/document/card action required; setup/parent drift and exact/late binding receipts rejected');
  console.log('  Planetside settlement: ready+132px+drained accepted; roster/image/decode/art/live-work controls rejected');
  console.log('  Compendium detail: exact document/generation/logical owner plus connected ready+src+decoded 440px accepted; isolated pending/terminal mutations and exact/late deadlines classified');
  console.log('  Planetside phase: monotonic remainder clipped; labelled Runtime.evaluate timeout converted exactly');
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
const failureEvidence = parseFailureEvidence([stdout, stderr].join('\n'), childStatus);
const findings = [...failureEvidence.findings];
if (failureEvidence.diagnostics.length) {
  status = 1;
  findings.unshift(...failureEvidence.diagnostics);
}
const arc4SuccessEvidence = assessArc4SuccessEvidence(stdout, stderr);
if (childStatus === 0 && !arc4SuccessEvidence.ok) {
  status = 1;
  findings.unshift(...arc4SuccessEvidence.reasons.map((reason) => `harness: ${reason}`));
}
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
