import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it, vi } from 'vitest';
import {
  createGlassDiagnosticProjection,
  projectGlassDiagnostic,
  renderGlassDiagnosticSummary,
  validateGlassDiagnosticReport,
} from '../tools/glassmatrix-diagnostic.mjs';
// @ts-expect-error The executable Glass evidence contract intentionally has no declaration shim.
import * as glassEvidenceContract from '../tools/glassmatrix-evidence-contract.mjs';

const {
  GLASS_ARC4_CAPTURE_CHECK_KEYS,
  GLASS_ARC4_CAPTURE_OUTCOME_CODES,
  GLASS_MATRIX_VIEWPORTS,
  GLASS_NEGATIVE_CONTROLS,
  glassViewportInventory,
} = glassEvidenceContract;

const GLASS_RUN = 'gha-123-1-glass';
const SLICE_RUN = 'gha-123-1-slice';
const SOURCE = Object.freeze({
  commit: 'a'.repeat(40),
  branch: 'detached',
  state: 'committed',
  statusSha256: 'b'.repeat(64),
  workingTreeSha256: 'c'.repeat(64),
});
const SLICE = Object.freeze({
  schema: 'cf-v2-slice-smoke-ci/v2',
  assuranceProfile: 'develop',
  runId: SLICE_RUN,
  reportPath: `apps/game/smoke/slice-smoke-${SLICE_RUN}.json`,
  reportSha256: 'd'.repeat(64),
  rawLogPath: `apps/game/smoke/slice-smoke-${SLICE_RUN}.log`,
  rawLogSha256: 'e'.repeat(64),
  source: SOURCE,
});

const arc4Outcomes = () => GLASS_MATRIX_VIEWPORTS.flatMap(({ label }: { label: string }) => (
  GLASS_ARC4_CAPTURE_OUTCOME_CODES.map((code: string) => ({
    viewport: label,
    surface: 'survey-capture',
    code,
    ok: true,
    checks: Object.fromEntries(GLASS_ARC4_CAPTURE_CHECK_KEYS[code]
      .map((key: string) => [key, true])),
    reasons: [],
  }))
));

function passReport(): Record<string, any> {
  const outcomes = arc4Outcomes();
  return {
    schema: 'cf-v2-glassmatrix/v1',
    status: 'pass',
    terminal: true,
    scope: 'full-certifying',
    certifying: true,
    exit: { code: 0 },
    startedAt: '2026-09-03T00:00:00.000Z',
    endedAt: '2026-09-03T00:00:01.000Z',
    durationMs: 1000,
    run: {
      id: GLASS_RUN,
      artifactPath: `apps/game/smoke/glassmatrix-${GLASS_RUN}.json`,
    },
    source: { ...SOURCE },
    sourceEnd: { ...SOURCE },
    sourceChange: { detected: false, ending: null },
    predecessors: { slice: structuredClone(SLICE) },
    browser: {
      executable: '/usr/bin/google-chrome',
      product: 'Chrome/151.0.0.0',
      revision: '@revision',
      user_agent: 'Mozilla/5.0 Chrome/151.0.0.0',
      js_version: '15.1.0',
      protocol_version: '1.3',
      consistentAcrossViewports: true,
    },
    viewportInventory: glassViewportInventory(),
    viewportTimings: GLASS_MATRIX_VIEWPORTS.map(
      ({ label }: { label: string }, index: number) => ({
      label,
      durationMs: 100 + index,
      }),
    ),
    arc4CaptureOutcomeInventory: {
      plannedOutcomeCodes: [...GLASS_ARC4_CAPTURE_OUTCOME_CODES],
      complete: true,
      expectedCount: outcomes.length,
      observedCount: outcomes.length,
      omitted: [],
      outcomes,
    },
    controlSummary: {
      selftestRan: true,
      negativeControls: [...GLASS_NEGATIVE_CONTROLS].sort(),
      plannedNegativeControls: [...GLASS_NEGATIVE_CONTROLS],
      blockedNegativeControls: [],
      omittedNegativeControls: [],
      automaticRetries: 0,
    },
    summary: {
      viewportCount: GLASS_MATRIX_VIEWPORTS.length,
      findingCount: 0,
      instrumentFailureCount: 0,
      counts: {},
    },
    findings: [],
    reloadEvidence: [],
    instrumentFailures: [],
  };
}

function productRedReport() {
  const report = passReport();
  const finding = {
    viewport: 'primary-phone',
    surface: 'survey-capture',
    code: 'TARGET_BELOW_MINIMUM',
    element: '[data-capture-action="sample"]',
    actual: { height: 43 },
    expected: 'height >= 44',
  };
  report.status = 'fail';
  report.certifying = false;
  report.exit = { code: 1 };
  report.viewportTimings = report.viewportTimings.slice(0, 3);
  report.findings = [finding];
  report.summary.findingCount = 1;
  report.summary.counts = { TARGET_BELOW_MINIMUM: 1 };
  return report;
}

function instrumentRedReport() {
  const report = passReport();
  report.status = 'instrument-fail';
  report.certifying = false;
  report.exit = { code: 2 };
  report.viewportTimings = report.viewportTimings.slice(0, 2);
  report.instrumentFailures = ['compact-phone: heartbeat evidence was incomplete'];
  report.summary.instrumentFailureCount = 1;
  return report;
}

const validation = {
  glassRunId: GLASS_RUN,
  expectedSource: SOURCE,
  expectedSlice: SLICE,
};

function sliceVerification() {
  return {
    ok: true,
    errors: [],
    assuranceProfile: 'develop',
    reportSha256: SLICE.reportSha256,
    artifacts: { reportRelative: SLICE.reportPath },
    report: {
      schema: SLICE.schema,
      run: { id: SLICE_RUN },
      rawLog: { path: SLICE.rawLogPath, sha256: SLICE.rawLogSha256 },
      source: { ...SOURCE },
    },
  };
}

describe('Glass terminal diagnostic projection', () => {
  it('accepts deeply valid full PASS, product-red, and instrument-red reports', () => {
    for (const report of [passReport(), productRedReport(), instrumentRedReport()]) {
      expect(validateGlassDiagnosticReport(report, validation)).toBe(report);
    }
  });

  it('builds one deterministic, hash-bound and recoverable gzip/base64 carrier', () => {
    const report = productRedReport();
    const bytes = Buffer.from(`${JSON.stringify(report, null, 2)}\n`);
    const first = createGlassDiagnosticProjection(bytes, report);
    const second = createGlassDiagnosticProjection(bytes, report);
    expect(first).toEqual(second);
    expect(gunzipSync(Buffer.from(first.gzip.base64, 'base64'))).toEqual(bytes);
    expect(first.report.sha256).toBe(crypto.createHash('sha256').update(bytes).digest('hex'));
    expect(first.lastCompletedViewport).toBe('primary-phone');
    expect(first.firstRed).toContain('TARGET_BELOW_MINIMUM');
    const markdown = renderGlassDiagnosticSummary(first);
    expect(markdown).toContain('does not replace the mandatory Glass result');
    expect(markdown).toContain(first.gzip.base64);
    expect(markdown).toContain(first.gzip.sha256);
    expect(() => renderGlassDiagnosticSummary({
      ...first,
      source: { ...first.source, padding: 'x'.repeat(1_000_000) },
    })).toThrow(/step summary exceeds 900000 bytes/);
  });

  it('reads only the exact immutable report, verifies Slice, and appends the summary', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-glass-diagnostic-'));
    try {
      const report = instrumentRedReport();
      fs.writeFileSync(
        path.join(directory, `glassmatrix-${GLASS_RUN}.json`),
        `${JSON.stringify(report, null, 2)}\n`,
      );
      fs.writeFileSync(path.join(directory, 'glassmatrix-report.json'), '{"status":"pass"}\n');
      const summaryPath = path.join(directory, 'summary.md');
      const verifySlice = vi.fn(() => sliceVerification());
      const projection = projectGlassDiagnostic({
        glassRunId: GLASS_RUN,
        sliceRunId: SLICE_RUN,
        profile: 'develop',
        directory,
        summaryPath,
        verifySlice,
      });
      expect(projection.status).toBe('instrument-fail');
      expect(verifySlice).toHaveBeenCalledWith(SLICE_RUN, {
        directory,
        requirePass: true,
        requireCommitted: true,
        expectedAssuranceProfile: 'develop',
        allowLegacyV1: false,
      });
      expect(fs.readFileSync(summaryPath, 'utf8')).toContain(projection.gzip.base64);
      fs.writeFileSync(summaryPath, 'x'.repeat(899_999));
      expect(() => projectGlassDiagnostic({
        glassRunId: GLASS_RUN,
        sliceRunId: SLICE_RUN,
        profile: 'develop',
        directory,
        summaryPath,
        verifySlice,
      })).toThrow(/step summary would exceed 900000 bytes/);
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });

  it('fails closed on running, malformed, missing, or wrongly bound evidence', () => {
    const running = productRedReport();
    running.status = 'running';
    running.terminal = false;
    running.exit = null;
    expect(() => validateGlassDiagnosticReport(running, validation)).toThrow(/not terminal/);

    const wrongRun = productRedReport();
    wrongRun.run.id = 'gha-wrong-glass';
    expect(() => validateGlassDiagnosticReport(wrongRun, validation)).toThrow(/run ID mismatch/);

    const wrongSource = productRedReport();
    wrongSource.source = { ...SOURCE, commit: 'f'.repeat(40) };
    wrongSource.sourceEnd = { ...wrongSource.source };
    expect(() => validateGlassDiagnosticReport(wrongSource, validation)).toThrow(/source does not match/);

    const wrongSlice = productRedReport();
    wrongSlice.predecessors.slice.runId = 'gha-wrong-slice';
    expect(() => validateGlassDiagnosticReport(wrongSlice, validation)).toThrow(/Slice predecessor descriptor/);

    const productWithoutBrowser = productRedReport();
    productWithoutBrowser.browser = null;
    expect(() => validateGlassDiagnosticReport(productWithoutBrowser, validation))
      .toThrow(/browser authority is not a complete/);

    const productWithoutTiming = productRedReport();
    productWithoutTiming.viewportTimings = [];
    expect(() => validateGlassDiagnosticReport(productWithoutTiming, validation))
      .toThrow(/no completed browser viewport timing/);

    const productFromFutureViewport = productRedReport();
    productFromFutureViewport.findings[0].viewport = 'desktop-8k';
    expect(() => validateGlassDiagnosticReport(productFromFutureViewport, validation))
      .toThrow(/outside its completed viewport prefix/);

    const malformedProductFinding = productRedReport();
    malformedProductFinding.findings[0].surface = '';
    expect(() => validateGlassDiagnosticReport(malformedProductFinding, validation))
      .toThrow(/malformed finding/);

    const earlyInstrument = instrumentRedReport();
    earlyInstrument.browser = null;
    earlyInstrument.viewportTimings = [];
    expect(validateGlassDiagnosticReport(earlyInstrument, validation)).toBe(earlyInstrument);

    const malformedInstrument = instrumentRedReport();
    malformedInstrument.instrumentFailures = [null];
    expect(() => validateGlassDiagnosticReport(malformedInstrument, validation))
      .toThrow(/malformed instrument failure/);

    const extraSourceField = productRedReport();
    extraSourceField.source.padding = 'not canonical';
    extraSourceField.sourceEnd.padding = 'not canonical';
    expect(() => validateGlassDiagnosticReport(extraSourceField, validation))
      .toThrow(/source carriers do not have the exact canonical fields/);

    const extraSummaryField = productRedReport();
    extraSummaryField.summary.padding = 'not canonical';
    expect(() => validateGlassDiagnosticReport(extraSummaryField, validation))
      .toThrow(/summary does not have the exact canonical fields/);

    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-glass-diagnostic-red-'));
    try {
      const options = {
        glassRunId: GLASS_RUN,
        sliceRunId: SLICE_RUN,
        profile: 'develop',
        directory,
        summaryPath: path.join(directory, 'summary.md'),
        verifySlice: () => sliceVerification(),
      };
      expect(() => projectGlassDiagnostic(options)).toThrow(/immutable Glass report is unavailable/);
      fs.writeFileSync(path.join(directory, `glassmatrix-${GLASS_RUN}.json`), '{broken\n');
      expect(() => projectGlassDiagnostic(options)).toThrow(/invalid JSON/);
      expect(() => projectGlassDiagnostic({
        ...options,
        verifySlice: () => ({ ok: false, errors: ['Slice mutation'] }),
      })).toThrow(/Slice mutation/);
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });
});
