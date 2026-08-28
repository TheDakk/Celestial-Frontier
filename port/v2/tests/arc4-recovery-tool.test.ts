import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
// @ts-expect-error The executable JavaScript evidence contract intentionally has no declaration shim.
import { assessArc4RecoveryInstrumentSeal } from '../tools/arc4-recovery-contract.mjs';

const collectorPath = fileURLToPath(
  new URL('../tools/arc4recovery.mjs', import.meta.url),
);
const sliceCollectorPath = fileURLToPath(
  new URL('../tools/slicesmoke.mjs', import.meta.url),
);
const firstRealRunEvidencePath = fileURLToPath(new URL(
  '../../../audits/ARC4_RECOVERY_REALTIME_INSTRUMENT_FAILURE_20260826.json.gz',
  import.meta.url,
));

const sha256 = (value: Uint8Array): string =>
  createHash('sha256').update(value).digest('hex');

describe('Arc 4 real-time recovery certificate instrument', () => {
  it('runs the sealed Slice disabled-suppression producer selftest', () => {
    const output = execFileSync(process.execPath, [
      sliceCollectorPath, '--disabled-suppression-selftest',
    ], { encoding: 'utf8' });
    expect(output).toContain('SLICE DISABLED SUPPRESSION SELFTEST: PASS');
  });

  it('pins the ready-surface runtime snapshots to UI then state chronology', () => {
    const collector = readFileSync(collectorPath, 'utf8');
    const uiThenState = "uiCapture=capture('ui',()=>${ARC4_CAPTURE_UI_EXPRESSION}),\n          stateCapture=capture('state',()=>S?.api?.state?.()??null),";
    const stateThenUi = "stateCapture=capture('state',()=>S?.api?.state?.()??null),\n          uiCapture=capture('ui',()=>${ARC4_CAPTURE_UI_EXPRESSION}),";
    const baseline = assessArc4RecoveryInstrumentSeal(collector, []);
    expect(baseline.ok).toBe(true);
    expect(baseline.checks.pertarReadyUiThenState).toBe(true);
    expect(baseline.checks.pertarCaptureWitnessDerived).toBe(true);
    expect(baseline.checks.pertarCaptureWitnessEnforced).toBe(true);

    const reversed = collector.replace(uiThenState, stateThenUi);
    expect(reversed).not.toBe(collector);
    const mutation = assessArc4RecoveryInstrumentSeal(reversed, []);
    expect(mutation.ok).toBe(false);
    expect(Object.entries(mutation.checks).filter(([, value]) => value !== true))
      .toEqual([['pertarReadyUiThenState', false]]);
  });

  it('keeps its real-time, closure, authority, transition and report controls mutation-sensitive', () => {
    const output = execFileSync(process.execPath, [collectorPath, '--selftest'], {
      encoding: 'utf8',
    });
    expect(output).toContain('ARC 4 RECOVERY SELFTEST: PASS');

    const compressed = readFileSync(firstRealRunEvidencePath);
    expect(sha256(compressed)).toBe(
      '1dba5bba9c88a8dac085af2c3021cd2da869b9a617f350c62d07a2bba4974d11',
    );
    const raw = gunzipSync(compressed);
    expect(sha256(raw)).toBe(
      'a153a339e12ef36654a3c5b11786cfb5576aa66cb434b056a06b01753cf6b4af',
    );
    const report = JSON.parse(raw.toString('utf8')) as {
      schema: string;
      status: string;
      runId: string;
      lifecycle: { schema: string; status: string };
      policy: { attemptCount: number; automaticRetries: number };
      source: {
        begin: Record<string, unknown>;
        end: Record<string, unknown>;
      };
      stages: Array<{ id: string; status: string; evidence: unknown }>;
      firstFailure: { stage: string; message: string };
      findings: string[];
      cleanup: Record<string, boolean>;
      recoveryClaimed?: unknown;
    };
    expect(report).toMatchObject({
      schema: 'cf-v2-arc4-recovery-report/v1',
      status: 'instrument-fail',
      runId: '20260826024124548-13172-6286d5212e',
      lifecycle: {
        schema: 'cf-v2-arc4-recovery-report-lifecycle/v1',
        status: 'complete',
      },
      policy: { attemptCount: 1, automaticRetries: 0 },
      source: {
        begin: {
          commit: '35a22b130a65f936769dfcfe88b150f44b4295d9',
          branch: 'openai/mac',
          state: 'committed',
          statusSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          workingTreeSha256: 'f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a',
        },
      },
      firstFailure: {
        stage: 'exhausted',
        message: 'exhausted Pertar surface timed out; last=null',
      },
      findings: ['exhausted Pertar surface timed out; last=null'],
      cleanup: {
        browser: true,
        server: true,
        browserContext: true,
        workspaceLock: true,
      },
    });
    expect(report.source.end).toEqual(report.source.begin);
    expect(report.stages.find(({ id }) => id === 'exhausted')).toEqual({
      id: 'exhausted',
      status: 'fail',
      evidence: {
        message: 'exhausted Pertar surface timed out; last=null',
        evidence: null,
      },
    });
    expect(report.stages.find(({ id }) => id === 'active-observation'))
      .toEqual({ id: 'active-observation', status: 'not-run', evidence: null });
    expect(report.stages.find(({ id }) => id === 'recovered'))
      .toEqual({ id: 'recovered', status: 'not-run', evidence: null });
    expect(report.stages.find(({ id }) => id === 'cleanup')).toEqual({
      id: 'cleanup',
      status: 'pass',
      evidence: { allOwnedResourcesReleased: true },
    });
    expect(report).not.toHaveProperty('recoveryClaimed');
  });
});
