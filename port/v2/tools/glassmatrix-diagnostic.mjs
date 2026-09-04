#!/usr/bin/env node
/* Preserve one bounded, recoverable diagnosis when the terminal Glass report
   exists on the runner but the ordinary artifact service is unavailable.

   This is a projection only: it accepts a valid terminal PASS, product red,
   or instrument red and never substitutes for Glass or its named PASS
   verifier. Missing, running, malformed, or incorrectly bound evidence fails
   closed. */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { verifySliceRunEvidence } from './smokereport.mjs';
import {
  GLASS_MATRIX_VIEWPORTS,
  glassBrowserAuthorityErrors,
  glassTerminalEvidenceErrors,
  glassViewportInventory,
} from './glassmatrix-evidence-contract.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const evidenceDir = path.join(here, '..', 'apps', 'game', 'smoke');
const RUN_ID = /^[a-z0-9][a-z0-9-]{0,95}$/i;
const PROFILES = new Set(['develop', 'production']);
const MAX_CARRIER_BASE64_BYTES = 700_000;
const MAX_STEP_SUMMARY_BYTES = 900_000;
const MAX_DIAGNOSTIC_TEXT = 4_000;
const SOURCE_FIELDS = Object.freeze([
  'branch', 'commit', 'state', 'statusSha256', 'workingTreeSha256',
]);
const SUMMARY_FIELDS = Object.freeze([
  'counts', 'findingCount', 'instrumentFailureCount', 'viewportCount',
]);

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const exactJson = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const exactKeys = (value, fields) => value && typeof value === 'object'
  && !Array.isArray(value)
  && exactJson(Object.keys(value).sort(), [...fields].sort());

function requireRunId(value, label) {
  if (!RUN_ID.test(value || '')) throw new Error(`invalid ${label} run ID: ${JSON.stringify(value)}`);
  return value;
}

function requireProfile(value) {
  if (!PROFILES.has(value)) throw new Error(`invalid Slice assurance profile: ${JSON.stringify(value)}`);
  return value;
}

function glassReportRelative(runId) {
  return `apps/game/smoke/glassmatrix-${requireRunId(runId, 'Glass')}.json`;
}

function slicePredecessorDescriptor(verification) {
  return {
    schema: verification.report.schema,
    assuranceProfile: verification.assuranceProfile,
    runId: verification.report.run.id,
    reportPath: verification.artifacts.reportRelative,
    reportSha256: verification.reportSha256,
    rawLogPath: verification.report.rawLog.path,
    rawLogSha256: verification.report.rawLog.sha256,
    source: { ...verification.report.source },
  };
}

function redShapeErrors(report) {
  const errors = [];
  if (report.status === 'pass') {
    if (report.exit?.code !== 0) errors.push('Glass PASS exit code is not exactly zero');
  } else if (report.status === 'fail') {
    if (report.exit?.code !== 1) errors.push('Glass product-red exit code is not exactly one');
    if (!Array.isArray(report.findings) || report.findings.length === 0) {
      errors.push('Glass product red has no product finding');
    } else {
      const completedViewports = new Set(
        Array.isArray(report.viewportTimings)
          ? report.viewportTimings.map((row) => row?.label)
          : [],
      );
      if (report.findings.some((finding) => !finding || typeof finding !== 'object'
        || Array.isArray(finding)
        || typeof finding.viewport !== 'string' || finding.viewport.length === 0
        || typeof finding.surface !== 'string' || finding.surface.length === 0
        || typeof finding.code !== 'string' || finding.code.length === 0
        || !completedViewports.has(finding.viewport))) {
        errors.push('Glass product red has a malformed finding or one outside its completed viewport prefix');
      }
    }
    if (!Array.isArray(report.instrumentFailures) || report.instrumentFailures.length !== 0) {
      errors.push('Glass product red carries instrument failures');
    }
  } else if (report.status === 'instrument-fail') {
    if (report.exit?.code !== 2) errors.push('Glass instrument-red exit code is not exactly two');
    if (!Array.isArray(report.instrumentFailures) || report.instrumentFailures.length === 0) {
      errors.push('Glass instrument red has no instrument failure');
    } else if (report.instrumentFailures.some((failure) => (
      typeof failure !== 'string' || failure.trim().length === 0
    ))) {
      errors.push('Glass instrument red has a malformed instrument failure');
    }
  }
  return errors;
}

function partialTimingErrors(report, { requireNonEmpty = false } = {}) {
  const timings = report?.viewportTimings;
  if (!Array.isArray(timings)) return ['Glass viewport timings are not an array'];
  if (requireNonEmpty && timings.length === 0) {
    return ['Glass product red has no completed browser viewport timing'];
  }
  const planned = GLASS_MATRIX_VIEWPORTS.map(({ label }) => label);
  const observed = timings.map((row) => row?.label);
  if (observed.some((label, index) => label !== planned[index])) {
    return ['Glass red viewport timings are not an exact ordered matrix prefix'];
  }
  if (timings.some((row) => !row || !Number.isFinite(row.durationMs) || row.durationMs <= 0)) {
    return ['Glass red viewport timing row is malformed'];
  }
  return [];
}

export function validateGlassDiagnosticReport(report, {
  glassRunId,
  expectedSource,
  expectedSlice,
} = {}) {
  const runId = requireRunId(glassRunId, 'Glass');
  const requirePass = report?.status === 'pass';
  const errors = glassTerminalEvidenceErrors(report, {
    runId,
    reportPath: glassReportRelative(runId),
    expectedSource,
    expectedSlice,
    requirePass,
  });
  if (report?.scope !== 'full-certifying') {
    errors.push(`Glass diagnostic source is not full-matrix evidence: ${JSON.stringify(report?.scope)}`);
  }
  if (report?.source?.state !== 'committed') {
    errors.push(`Glass diagnostic source is not clean committed: ${JSON.stringify(report?.source?.state)}`);
  }
  if (!exactKeys(report?.source, SOURCE_FIELDS)
    || !exactKeys(report?.sourceEnd, SOURCE_FIELDS)) {
    errors.push('Glass diagnostic source carriers do not have the exact canonical fields');
  }
  if (!exactKeys(report?.summary, SUMMARY_FIELDS)) {
    errors.push('Glass diagnostic summary does not have the exact canonical fields');
  }
  if (!exactJson(report?.viewportInventory, glassViewportInventory())) {
    errors.push('Glass diagnostic viewport inventory is not the exact ordered 12-row matrix');
  }
  if (report?.summary?.viewportCount !== GLASS_MATRIX_VIEWPORTS.length) {
    errors.push('Glass diagnostic summary does not bind the full 12-viewport plan');
  }
  if (!requirePass) {
    errors.push(...partialTimingErrors(report, { requireNonEmpty: report?.status === 'fail' }));
  }
  if (report?.status === 'fail') errors.push(...glassBrowserAuthorityErrors(report));
  errors.push(...redShapeErrors(report || {}));
  if (errors.length) throw new Error(errors.join('; '));
  return report;
}

function boundedDiagnostic(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? null);
  return text.length <= MAX_DIAGNOSTIC_TEXT
    ? text
    : `${text.slice(0, MAX_DIAGNOSTIC_TEXT)}…[truncated]`;
}

export function createGlassDiagnosticProjection(reportBytes, report) {
  if (!Buffer.isBuffer(reportBytes) || reportBytes.length === 0) {
    throw new Error('Glass diagnostic report bytes are empty');
  }
  const compressed = gzipSync(reportBytes, { level: 9, mtime: 0 });
  const carrierBase64 = compressed.toString('base64');
  if (Buffer.byteLength(carrierBase64) > MAX_CARRIER_BASE64_BYTES) {
    throw new Error(`Glass diagnostic carrier exceeds ${MAX_CARRIER_BASE64_BYTES} base64 bytes`);
  }
  const firstRed = report.status === 'fail'
    ? report.findings[0]
    : report.status === 'instrument-fail' ? report.instrumentFailures[0] : null;
  const timings = report.viewportTimings.map(({ label, durationMs }) => ({ label, durationMs }));
  return Object.freeze({
    schema: 'cf-v2-glassmatrix-diagnostic-projection/v1',
    runId: report.run.id,
    status: report.status,
    exitCode: report.exit.code,
    source: { ...report.source },
    slice: { ...report.predecessors.slice },
    summary: { ...report.summary },
    firstRed: boundedDiagnostic(firstRed),
    viewportTimings: timings,
    lastCompletedViewport: timings.at(-1)?.label ?? null,
    report: {
      path: report.run.artifactPath,
      bytes: reportBytes.length,
      sha256: sha256(reportBytes),
    },
    gzip: {
      bytes: compressed.length,
      sha256: sha256(compressed),
      encoding: 'gzip+base64',
      base64: carrierBase64,
    },
  });
}

function markdownCode(value) {
  return String(value).replaceAll('`', '\\u0060');
}

export function renderGlassDiagnosticSummary(projection) {
  const compact = {
    schema: projection.schema,
    runId: projection.runId,
    status: projection.status,
    exitCode: projection.exitCode,
    source: projection.source,
    slice: projection.slice,
    summary: projection.summary,
    firstRed: projection.firstRed,
    viewportTimings: projection.viewportTimings,
    lastCompletedViewport: projection.lastCompletedViewport,
    report: projection.report,
    gzip: {
      bytes: projection.gzip.bytes,
      sha256: projection.gzip.sha256,
      encoding: projection.gzip.encoding,
    },
  };
  const rendered = [
    '## Exact Glass terminal diagnostic',
    '',
    'This diagnostic is recoverability evidence only; it does not replace the mandatory Glass result or named verifier.',
    '',
    '```json',
    markdownCode(JSON.stringify(compact)),
    '```',
    '',
    '<details><summary>Exact deterministic gzip/base64 Glass report carrier</summary>',
    '',
    '```text',
    projection.gzip.base64,
    '```',
    '',
    '</details>',
    '',
  ].join('\n');
  const renderedBytes = Buffer.byteLength(rendered, 'utf8');
  if (renderedBytes > MAX_STEP_SUMMARY_BYTES) {
    throw new Error(`Glass diagnostic step summary exceeds ${MAX_STEP_SUMMARY_BYTES} bytes`);
  }
  return rendered;
}

export function projectGlassDiagnostic({
  glassRunId,
  sliceRunId,
  profile,
  directory = evidenceDir,
  summaryPath = process.env.GITHUB_STEP_SUMMARY,
  verifySlice = verifySliceRunEvidence,
} = {}) {
  const exactGlassRunId = requireRunId(glassRunId, 'Glass');
  const exactSliceRunId = requireRunId(sliceRunId, 'Slice');
  const exactProfile = requireProfile(profile);
  if (typeof summaryPath !== 'string' || summaryPath.length === 0) {
    throw new Error('GITHUB_STEP_SUMMARY is unavailable');
  }
  const sliceVerification = verifySlice(exactSliceRunId, {
    directory,
    requirePass: true,
    requireCommitted: true,
    expectedAssuranceProfile: exactProfile,
    allowLegacyV1: false,
  });
  if (!sliceVerification?.ok) {
    throw new Error(`selected Slice predecessor failed verification: ${(sliceVerification?.errors || ['unknown failure']).join('; ')}`);
  }
  const expectedSlice = slicePredecessorDescriptor(sliceVerification);
  const reportPath = path.join(directory, `glassmatrix-${exactGlassRunId}.json`);
  let reportBytes;
  try { reportBytes = fs.readFileSync(reportPath); }
  catch (error) { throw new Error(`immutable Glass report is unavailable: ${error.message}`); }
  let report;
  try { report = JSON.parse(reportBytes.toString('utf8')); }
  catch (error) { throw new Error(`immutable Glass report is invalid JSON: ${error.message}`); }
  validateGlassDiagnosticReport(report, {
    glassRunId: exactGlassRunId,
    expectedSource: sliceVerification.report.source,
    expectedSlice,
  });
  const projection = createGlassDiagnosticProjection(reportBytes, report);
  const rendered = renderGlassDiagnosticSummary(projection);
  const existingBytes = fs.existsSync(summaryPath) ? fs.statSync(summaryPath).size : 0;
  if (existingBytes + Buffer.byteLength(rendered, 'utf8') > MAX_STEP_SUMMARY_BYTES) {
    throw new Error(`Glass diagnostic step summary would exceed ${MAX_STEP_SUMMARY_BYTES} bytes`);
  }
  fs.appendFileSync(summaryPath, rendered, 'utf8');
  return projection;
}

function workflowCommandText(value) {
  return String(value).replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');
}

function cliArguments(args) {
  const values = new Map();
  for (const arg of args) {
    const match = /^--(glass-run|slice-run|profile)=(.+)$/.exec(arg);
    if (!match || values.has(match[1])) throw new Error('usage: node tools/glassmatrix-diagnostic.mjs --glass-run=<id> --slice-run=<id> --profile=develop|production');
    values.set(match[1], match[2]);
  }
  if (values.size !== 3) throw new Error('usage: node tools/glassmatrix-diagnostic.mjs --glass-run=<id> --slice-run=<id> --profile=develop|production');
  return { glassRunId: values.get('glass-run'), sliceRunId: values.get('slice-run'), profile: values.get('profile') };
}

function runCli() {
  try {
    const projection = projectGlassDiagnostic(cliArguments(process.argv.slice(2)));
    const detail = workflowCommandText(JSON.stringify({
      runId: projection.runId,
      status: projection.status,
      exitCode: projection.exitCode,
      firstRed: projection.firstRed,
      lastCompletedViewport: projection.lastCompletedViewport,
      reportSha256: projection.report.sha256,
      gzipSha256: projection.gzip.sha256,
    }));
    const command = projection.status === 'pass' ? 'notice' : 'error';
    console.log(`::${command} title=Exact Glass terminal diagnostic::${detail}`);
    console.log(`GLASS DIAGNOSTIC PROJECTION: PASS — ${projection.runId} (${projection.status})`);
    return 0;
  } catch (error) {
    const detail = workflowCommandText(error?.stack || error);
    console.error(`::error title=Glass diagnostic projection failed::${detail}`);
    console.error('GLASS DIAGNOSTIC PROJECTION: FAIL');
    console.error('- ' + (error?.stack || error));
    return 1;
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) process.exitCode = runCli();
