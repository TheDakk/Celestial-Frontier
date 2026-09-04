import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
// @ts-expect-error The executable JavaScript domain contract intentionally has no declaration shim.
import { assessArc4ExhaustionRecovery } from '../tools/arc4-browser-contract.mjs';
// @ts-expect-error The executable JavaScript evidence contract intentionally has no declaration shim.
import { ARC4_RECOVERY_PERTAR_POLL_TIMING_SCHEMA, ARC4_RECOVERY_PERTAR_SURFACE_TIMEOUT_MS, assessArc4RecoveryInstrumentSeal, assessArc4RecoveryPertarPollTiming } from '../tools/arc4-recovery-contract.mjs';
import { runBoundedNodeMarker } from '../test-support/bounded-child.js';

const collectorPath = fileURLToPath(
  new URL('../tools/arc4recovery.mjs', import.meta.url),
);
const SELFTEST_CHILD_TIMEOUT_MS = 15_000;
const sliceCollectorPath = fileURLToPath(
  new URL('../tools/slicesmoke.mjs', import.meta.url),
);
const firstRealRunEvidencePath = fileURLToPath(new URL(
  '../../../audits/ARC4_RECOVERY_REALTIME_INSTRUMENT_FAILURE_20260826.json.gz',
  import.meta.url,
));
const final10OfflineOracleEvidencePath = fileURLToPath(new URL(
  '../../../audits/ARC4_RECOVERY_CURRENT_INPUT_INSTRUMENT_FAILURE_20260828_091420389.json.gz',
  import.meta.url,
));
const final11TemporalOracleEvidencePath = fileURLToPath(new URL(
  '../../../audits/ARC4_RECOVERY_CURRENT_INPUT_FAILURE_20260828_120206393.json.gz',
  import.meta.url,
));

const sha256 = (value: Uint8Array): string =>
  createHash('sha256').update(value).digest('hex');

describe('Arc 4 real-time recovery certificate instrument', () => {
  it('rejects exact-deadline and late Pertar poll completions', () => {
    const timing = (completedAtMonotonicMs: number) => ({
      schema: ARC4_RECOVERY_PERTAR_POLL_TIMING_SCHEMA,
      windowStartedAtMonotonicMs: 0,
      deadlineAtMonotonicMs: ARC4_RECOVERY_PERTAR_SURFACE_TIMEOUT_MS,
      requestedAtMonotonicMs: 1_000,
      completedAtMonotonicMs,
      remainingMs: ARC4_RECOVERY_PERTAR_SURFACE_TIMEOUT_MS - 1_000,
    });
    expect(assessArc4RecoveryPertarPollTiming(timing(
      ARC4_RECOVERY_PERTAR_SURFACE_TIMEOUT_MS - 1,
    )).ok).toBe(true);
    expect(assessArc4RecoveryPertarPollTiming(timing(
      ARC4_RECOVERY_PERTAR_SURFACE_TIMEOUT_MS,
    )).checks.completionBeforeDeadline).toBe(false);
    expect(assessArc4RecoveryPertarPollTiming(timing(
      ARC4_RECOVERY_PERTAR_SURFACE_TIMEOUT_MS + 1,
    )).checks.completionBeforeDeadline).toBe(false);
  });

  it('runs the sealed Slice disabled-suppression producer selftest', () => {
    const result = runBoundedNodeMarker([
      sliceCollectorPath, '--disabled-suppression-selftest',
    ], 'SLICE DISABLED SUPPRESSION SELFTEST: PASS', SELFTEST_CHILD_TIMEOUT_MS);
    expect(result.kind, result.diagnostic).toBe('pass');
  }, 20_000);

  it('pins phase-specific Pertar surfaces and UI-then-state chronology', () => {
    const collector = readFileSync(collectorPath, 'utf8');
    const uiThenState = "uiCapture=capture('ui',()=>${ARC4_CAPTURE_UI_EXPRESSION}),\n          stateCapture=capture('state',()=>S?.api?.state?.()??null),";
    const stateThenUi = "stateCapture=capture('state',()=>S?.api?.state?.()??null),\n          uiCapture=capture('ui',()=>${ARC4_CAPTURE_UI_EXPRESSION}),";
    const baseline = assessArc4RecoveryInstrumentSeal(collector, []);
    expect(baseline.ok).toBe(true);
    expect(baseline.checks.pertarReadyUiThenState).toBe(true);
    expect(baseline.checks.pertarCaptureWitnessDerived).toBe(true);
    expect(baseline.checks.pertarCaptureWitnessEnforced).toBe(true);
    expect(baseline.checks.pertarPhaseReceiptsRetained).toBe(true);
    expect(baseline.checks.pertarFailureEvidenceMerged).toBe(true);
    expect(baseline.checks.pertarPhaseReceiptsReplayed).toBe(true);
    expect(baseline.checks.pertarDedicatedCollectors).toBe(true);
    expect(baseline.checks.pertarDedicatedSourceDigest).toBe(true);
    expect(baseline.checks.pertarAbsoluteDeadline).toBe(true);
    expect(baseline.checks.pertarPhasePredicates).toBe(true);
    expect(baseline.checks.pertarAssessmentSourceDigest).toBe(true);
    expect(baseline.checks.pertarPhaseFailureClassified).toBe(true);
    expect(baseline.checks.pertarPhaseRuntimeOrder).toBe(true);
    expect(baseline.checks.pertarPhaseRuntimeTuple).toBe(true);
    expect(baseline.checks.pertarOfflineUnavailablePhaseBound).toBe(true);
    expect(baseline.checks.pertarActiveExhaustedPhaseBound).toBe(true);
    expect(baseline.checks.pertarPhaseSourceBoundaries).toBe(true);
    expect(baseline.checks.pertarPhaseSourceDigest).toBe(true);
    expect(baseline.checks.collectorProductionSourceDigest).toBe(true);
    expect(baseline.checks.collectorSourceDigest).toBe(true);

    const expectOnlySealRed = (mutant: string, expected: string): void => {
      expect(mutant).not.toBe(collector);
      const result = assessArc4RecoveryInstrumentSeal(mutant, []);
      expect(result.ok).toBe(false);
      expect(Object.entries(result.checks).filter(([name, value]) =>
        value !== true && (name === expected || ![
          'pertarAssessmentSourceDigest',
          'pertarDedicatedSourceDigest',
          'pertarPhaseSourceDigest',
          'collectorProductionSourceDigest',
          'collectorSourceDigest',
        ].includes(name))))
        .toEqual([[expected, false]]);
    };

    const reversed = collector.replace(uiThenState, stateThenUi);
    expectOnlySealRed(reversed, 'pertarReadyUiThenState');
    expectOnlySealRed(collector.replace(
      "'read Pertar capture surface', remainingMs);",
      "'read Pertar capture surface', COMMAND_TIMEOUT_MS);",
    ), 'pertarAbsoluteDeadline');

    const offlinePhaseCall = "const offlineSurface = await waitForPertarSurface(send, sessionId, {\n      phase: 'exhausted-offline', expectedDocumentToken: reopenedDocumentToken,\n    });";
    const activePhaseCall = "const reactivatedSurface = await waitForPertarSurface(send, sessionId, {\n      phase: 'exhausted-visible', expectedDocumentToken: reopenedDocumentToken,\n    });";
    expectOnlySealRed(collector.replace(
      offlinePhaseCall,
      offlinePhaseCall.replace("phase: 'exhausted-offline'", "phase: 'exhausted-visible'"),
    ), 'pertarOfflineUnavailablePhaseBound');
    expectOnlySealRed(collector.replace(
      activePhaseCall,
      activePhaseCall.replace("phase: 'exhausted-visible'", "phase: 'exhausted-offline'"),
    ), 'pertarActiveExhaustedPhaseBound');
    expectOnlySealRed(collector.replace(
      offlinePhaseCall,
      `/* ${offlinePhaseCall} */\n    ${offlinePhaseCall.replace(
        "phase: 'exhausted-offline'", "phase: 'exhausted-visible'",
      )}`,
    ), 'pertarPhaseSourceDigest');
    expectOnlySealRed(collector.replace(
      "    await evaluate(send, sessionId,\n      'window.__CF_SLICE__.api.__smokeRunF4Heartbeat()',\n      'refresh reactivated exhausted presentation');\n",
      '',
    ), 'pertarActiveExhaustedPhaseBound');
    expectOnlySealRed(collector.replace(
      'const offlineState = offlineSurface.state;\n    const offlineUi = offlineSurface.ui;',
      'const offlineState = offlineSurface.ui;\n    const offlineUi = offlineSurface.ui;',
    ), 'pertarOfflineUnavailablePhaseBound');
    expectOnlySealRed(collector.replace(
      'arc4IneligibleExhaustedCaptureRows(rows)',
      'arc4ExhaustedCaptureRows(rows)',
    ), 'pertarPhasePredicates');
    expectOnlySealRed(collector.replace(
      "phase === 'exhausted-visible'\n          ? arc4ExhaustedCaptureRows(rows)\n          : phase === 'exhausted-offline'",
      "phase === 'exhausted-offline'\n          ? arc4ExhaustedCaptureRows(rows)\n          : phase === 'exhausted-visible'",
    ), 'pertarPhasePredicates');
    expectOnlySealRed(collector.replace(
      'last === null || lastError !== null || !last.assessment.instrumentOk',
      'last === null || !last.assessment.instrumentOk',
    ), 'pertarPhaseFailureClassified');
    const pertarTerminalCondition =
      'if (last === null || lastError !== null || !last.assessment.instrumentOk) {';
    expectOnlySealRed(collector.replace(
      pertarTerminalCondition,
      `// ${pertarTerminalCondition}\n  ${pertarTerminalCondition.replace(
        ' || lastError !== null', '',
      )}`,
    ), 'pertarDedicatedSourceDigest');
    const pertarDedicatedStartNeedle =
      'function pertarRuntimeCaptureEvidence(surface, expectedDocumentToken) {';
    const pertarDedicatedEndNeedle =
      '\n\nasync function activateSurveyDock(send, sessionId) {';
    const pertarDedicatedStart = collector.indexOf(pertarDedicatedStartNeedle);
    const pertarDedicatedEnd = collector.indexOf(
      pertarDedicatedEndNeedle, pertarDedicatedStart,
    );
    expect(pertarDedicatedStart).toBeGreaterThanOrEqual(0);
    expect(pertarDedicatedEnd).toBeGreaterThan(pertarDedicatedStart);
    const pertarDedicatedSource = collector.slice(
      pertarDedicatedStart, pertarDedicatedEnd,
    );
    const deadPertarDedicatedCopy = `if (false) {\n${pertarDedicatedSource}\n\n`
      + 'async function activateSurveyDock(send, sessionId) {}\n}\n\n';
    let duplicatePertarDedicatedSource = collector.slice(0, pertarDedicatedStart)
      + deadPertarDedicatedCopy + collector.slice(pertarDedicatedStart);
    const operativePertarConditionIndex = duplicatePertarDedicatedSource.lastIndexOf(
      pertarTerminalCondition,
    );
    expect(operativePertarConditionIndex).toBeGreaterThan(pertarDedicatedStart);
    duplicatePertarDedicatedSource = duplicatePertarDedicatedSource.slice(
      0, operativePertarConditionIndex,
    ) + pertarTerminalCondition.replace(' || lastError !== null', '')
      + duplicatePertarDedicatedSource.slice(
        operativePertarConditionIndex + pertarTerminalCondition.length,
      );
    const duplicatePertarDedicatedSeal = assessArc4RecoveryInstrumentSeal(
      duplicatePertarDedicatedSource, [],
    );
    expect(duplicatePertarDedicatedSeal.ok).toBe(false);
    expect(duplicatePertarDedicatedSeal.checks.collectorSourceDigest).toBe(false);
    expect(duplicatePertarDedicatedSeal.checks.collectorProductionSourceDigest).toBe(false);
    expect(duplicatePertarDedicatedSeal.checks.pertarDedicatedCollectors).toBe(false);
    expect(duplicatePertarDedicatedSeal.checks.pertarDedicatedSourceDigest).toBe(true);
    expect(duplicatePertarDedicatedSeal.checks.pertarPhaseFailureClassified).toBe(true);
    expect(Object.entries(duplicatePertarDedicatedSeal.checks)
      .filter(([, value]) => value !== true).map(([name]) => name).sort())
      .toEqual([
        'collectorSourceDigest', 'collectorProductionSourceDigest',
        'pertarDedicatedCollectors',
      ].sort());
    const pertarDedicatedOwnerEndNeedle = '\nfunction browserSample(browser) {';
    const pertarDedicatedOwnerEnd = collector.indexOf(
      pertarDedicatedOwnerEndNeedle, pertarDedicatedEnd,
    );
    expect(pertarDedicatedOwnerEnd).toBeGreaterThan(pertarDedicatedEnd);
    const deadWrappedPertarDedicated = collector.slice(0, pertarDedicatedStart)
      + 'if (false) {\n'
      + collector.slice(pertarDedicatedStart, pertarDedicatedOwnerEnd)
      + '\n}\n'
      + collector.slice(pertarDedicatedOwnerEnd);
    expectOnlySealRed(
      deadWrappedPertarDedicated, 'collectorProductionSourceDigest',
    );
    const pertarPhaseStartNeedle = "    currentStage = 'offline-reopened';";
    const pertarPhaseAfterNeedle = '    const samples = [];';
    const pertarPhaseStart = collector.indexOf(pertarPhaseStartNeedle);
    const pertarPhaseAfter = collector.indexOf(
      pertarPhaseAfterNeedle, pertarPhaseStart,
    );
    expect(pertarPhaseStart).toBeGreaterThanOrEqual(0);
    expect(pertarPhaseAfter).toBeGreaterThan(pertarPhaseStart);
    const commentShadowedPertarPhase = collector.slice(0, pertarPhaseStart)
      + '    /*\n'
      + collector.slice(pertarPhaseStart, pertarPhaseAfter)
      + '    */\n'
      + collector.slice(pertarPhaseAfter);
    expectOnlySealRed(
      commentShadowedPertarPhase, 'collectorProductionSourceDigest',
    );
    const verificationOwnerNeedle = '\nfunction verifyRecoveryRun(options) {';
    const reboundPertarDedicated = collector.replace(
      verificationOwnerNeedle,
      "\nassessPertarSurfaceObservation = () => ({ instrumentOk: true, productOk: true });"
        + "\nwaitForPertarSurface = async () => ({ state: {}, ui: {} });"
        + verificationOwnerNeedle,
    );
    expectOnlySealRed(
      reboundPertarDedicated, 'collectorSourceDigest',
    );
    expectOnlySealRed(collector.replace(
      '} catch (error) { lastError = error; }\n    await sleep(50);\n  }\n  if (last === null || lastError !== null',
      '} catch (error) { lastError = null; }\n    await sleep(50);\n  }\n  if (last === null || lastError !== null',
    ), 'pertarPhaseFailureClassified');
    expectOnlySealRed(collector.replace(
      'last = Object.freeze({ surface, assessment });\n      lastError = null;',
      'last = Object.freeze({ surface, assessment });',
    ), 'pertarPhaseFailureClassified');
    expectOnlySealRed(collector.replace(
      'throw new ProductFailure(`${label} product state timed out`, last.assessment);',
      'throw new InstrumentFailure(`${label} product state timed out`, last.assessment);',
    ), 'pertarPhaseFailureClassified');
    expectOnlySealRed(collector.replace(
      'runtimeOrder: runtimeCapture.receipt.observed.runtimeNondecreasing === true,',
      'runtimeOrder: true,',
    ), 'pertarPhaseRuntimeOrder');
    expectOnlySealRed(collector.replace(
      'runtimeTuple: Number.isSafeInteger(runtime?.revision) && runtime.revision >= 0',
      'runtimeTuple: true || Number.isSafeInteger(runtime?.revision) && runtime.revision >= 0',
    ), 'pertarPhaseRuntimeTuple');
    expectOnlySealRed(collector.replace(
      'runtime.revision === uiRuntime.revision',
      'true',
    ), 'pertarAssessmentSourceDigest');
    const exhaustedRetainedReceipt =
      "pertarSurface: retainPertarSurfaceEvidence(\n        exhaustedSurface, 'exhausted-visible', fixtureToken,";
    const offlineRetainedReceipt =
      "pertarSurface: retainPertarSurfaceEvidence(\n        offlineSurface, 'exhausted-offline', reopenedDocumentToken,";
    expectOnlySealRed(
      collector.replace(exhaustedRetainedReceipt, 'pertarSurface: null,'),
      'pertarPhaseReceiptsRetained',
    );
    expectOnlySealRed(collector.replace(
      offlineRetainedReceipt,
      offlineRetainedReceipt.replace(
        "'exhausted-offline'", "'exhausted-visible'",
      ),
    ), 'pertarPhaseReceiptsRetained');
    expectOnlySealRed(collector.replace(
      offlineRetainedReceipt,
      offlineRetainedReceipt.replace('reopenedDocumentToken', 'fixtureToken'),
    ), 'pertarPhaseReceiptsRetained');
    expectOnlySealRed(collector.replace(
      '        replayedPertarSurfaces,',
      '        replayedPertarSurfaces: {},',
    ), 'pertarPhaseReceiptsReplayed');
    expectOnlySealRed(collector.replace(
      "    retainStageEvidence('active-observation', { reactivatedPertarSurface });\n",
      '',
    ), 'pertarPhaseReceiptsRetained');
    expectOnlySealRed(collector.replace(
      "updateRecoveryStage(report.stages, idValue, 'running', evidence);",
      'updateRecoveryStage(report.stages, idValue, null, evidence);',
    ), 'pertarFailureEvidenceMerged');
    expectOnlySealRed(collector.replace(
      "if (['not-run', 'running'].includes(\n      report.stages.find((stage) => stage.id === currentStage)?.status,\n    )) {",
      "if (report.stages.find((stage) => stage.id === currentStage)?.status === 'not-run') {",
    ), 'pertarFailureEvidenceMerged');
  });

  it('keeps its real-time, closure, authority, transition and report controls mutation-sensitive', () => {
    const result = runBoundedNodeMarker(
      [collectorPath, '--selftest'],
      'ARC 4 RECOVERY SELFTEST: PASS',
      SELFTEST_CHILD_TIMEOUT_MS,
    );
    expect(result.kind, result.diagnostic).toBe('pass');

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
  }, 20_000);

  it('pins the exact Final10 offline-unavailable oracle diagnosis', () => {
    const compressed = readFileSync(final10OfflineOracleEvidencePath);
    expect(sha256(compressed)).toBe(
      'c038e5dc37bbedd230afb954e7b576b85a65970bdafbc0ee158f185b07244358',
    );
    const raw = gunzipSync(compressed);
    expect(sha256(raw)).toBe(
      '9642a7dfad56df1695693ef2f2cafaf0c0fb4628d8401cc8bcdf839f31a429ce',
    );
    const report = JSON.parse(raw.toString('utf8')) as {
      status: string;
      policy: { attemptCount: number; automaticRetries: number };
      source: { begin: { commit: string }; end: { commit: string } };
      stages: Array<{ id: string; status: string; evidence: unknown }>;
      firstFailure: { stage: string; message: string };
      cleanup: Record<string, boolean>;
    };
    expect(report).toMatchObject({
      status: 'instrument-fail',
      policy: { attemptCount: 1, automaticRetries: 0 },
      source: {
        begin: { commit: '4405fb2b4ba7ef6898eb334330d7ef4300b5266c' },
        end: { commit: '4405fb2b4ba7ef6898eb334330d7ef4300b5266c' },
      },
      firstFailure: { stage: 'offline-reopened' },
      cleanup: {
        browser: true, server: true,
        browserContext: true, workspaceLock: true,
      },
    });
    for (const id of [
      'fixture', 'burn-down', 'exhausted', 'close-checkpoint', 'offline-closed',
    ]) {
      expect(report.stages.find((stage) => stage.id === id)?.status).toBe('pass');
    }
    expect(report.stages.find((stage) => stage.id === 'offline-reopened')?.status)
      .toBe('fail');
    for (const id of ['active-observation', 'boundary-crossed', 'recovered']) {
      expect(report.stages.find((stage) => stage.id === id)?.status).toBe('not-run');
    }
    expect(report.firstFailure.message).toContain('"status":"unavailable"');
    expect(report.firstFailure.message).toContain(
      'cf-v2-arc4-recovery-runtime-capture-witness/v1',
    );
  });

  it('retains Final11 as a failure while its immutable bundle replays green', () => {
    const compressed = readFileSync(final11TemporalOracleEvidencePath);
    expect(sha256(compressed)).toBe(
      'cb44985eb4894e34d518f521df8506c7b4aec452afcc8a2351f52eb5dd9b698a',
    );
    const raw = gunzipSync(compressed);
    expect(sha256(raw)).toBe(
      'fa035d12a50a55b7e51ebca9de565c59b0f02d5941d1a19ccd4d5f65ae8febcb',
    );
    const report = JSON.parse(raw.toString('utf8')) as {
      status: string;
      runId: string;
      policy: { attemptCount: number; automaticRetries: number };
      source: { begin: { commit: string }; end: { commit: string } };
      stages: Array<{ id: string; status: string }>;
      firstFailure: { stage: string; message: string };
      domainAssessment: {
        ok: boolean;
        checks: Record<string, boolean>;
      };
      recoveryBundle: Parameters<typeof assessArc4ExhaustionRecovery>[0];
      cleanup: Record<string, boolean>;
    };
    expect(report).toMatchObject({
      status: 'fail',
      runId: '20260828-phase4-final11-1ca67156e27d-recovery',
      policy: { attemptCount: 1, automaticRetries: 0 },
      source: {
        begin: { commit: '1ca67156e27d6bd58a324e33b0e6b752adf568bc' },
        end: { commit: '1ca67156e27d6bd58a324e33b0e6b752adf568bc' },
      },
      firstFailure: {
        stage: 'recovered',
        message: 'Arc 4 exhaustion/recovery domain assessment is red',
      },
      cleanup: {
        browser: true, server: true,
        browserContext: true, workspaceLock: true,
      },
    });
    expect(report.domainAssessment.ok).toBe(false);
    expect(Object.entries(report.domainAssessment.checks)
      .filter(([, value]) => value !== true).map(([name]) => name))
      .toEqual(['activePlayProjection', 'closeCheckpoint']);
    expect(report.stages.find(({ id }) => id === 'recovered')?.status)
      .toBe('fail');
    expect(report.stages.find(({ id }) => id === 'cleanup')?.status)
      .toBe('pass');

    const replay = assessArc4ExhaustionRecovery(report.recoveryBundle, {
      allowLegacyArc5Diagnostics: true,
    });
    expect(replay.ok).toBe(true);
    expect(Object.values(replay.checks).every((value) => value === true))
      .toBe(true);

    const defaultReplay = assessArc4ExhaustionRecovery(report.recoveryBundle);
    expect(Object.entries(defaultReplay.checks)
      .filter(([, value]) => value !== true).map(([name]) => name))
      .toEqual(['exhaustedLive', 'ownershipV2Live', 'uiComplete']);

    const diagnosticOwners = [
      'exhaustedState', 'exhaustedUi', 'closedState',
      'offlineState', 'offlineUi', 'recoveredState', 'recoveredUi',
    ] as const;
    const diagnosticSnapshots = (bundle: typeof report.recoveryBundle) => [
      ...diagnosticOwners.map((owner) => bundle[owner]),
      bundle.suppressed.beforeState,
      bundle.suppressed.afterState,
    ];
    const currentArc5DiagnosticSubtrees = () => ({
      feed: {
        lastOutcome: null,
        lastResult: null,
        controller: {
          schema: 'cf-v2-compendium-feed-diagnostics/v1',
          attachedMountCount: 0, retainedDomCount: 0, pendingWork: 0,
          convergenceLatched: false, delegatedListenerCount: 2,
          actionControlCount: 0, radioControlCount: 0,
          surfaceKey: null, contextKey: null, selectedCreatureId: null,
          selectedFoodLotId: null, lastRequest: null, lastOutcome: null,
        },
        actionCoordinator: {
          inFlight: false,
          owner: {
            schema: 'cf-v2-product-action-coordinator-diagnostics/v1',
            busy: false, operation: null,
          },
          hold: {
            schema: 'cf-v2-product-action-hold-diagnostics/v1',
            phase: 'idle', operation: null, sequence: 0,
          },
          faultArmed: {
            storageFailure: false, staleAuthority: false, publicationFailure: false,
          },
          lastFault: null,
        },
      },
      breed: {
        lastOutcome: null,
        lastResult: null,
        controller: {
          schema: 'cf-v2-compendium-breed-diagnostics/v1',
          attachedMountCount: 0, retainedDomCount: 0, pendingWork: 0,
          convergenceLatched: false, delegatedListenerCount: 2,
          renderedParentControlCount: 0, selectedPrimaryId: null,
          selectedMateId: null, primaryPage: 0, matePage: 0,
          surfaceKey: null, contextKey: null, lastRequest: null, lastOutcome: null,
        },
      },
      rename: {
        lastOutcome: null,
        lastResult: null,
        controller: {
          schema: 'cf-v2-compendium-rename-diagnostics/v1',
          attachedMountCount: 0, retainedDomCount: 0, pendingWork: 0,
          convergenceLatched: false, delegatedListenerCount: 3,
          creatureControlCount: 0, surfaceKey: null, contextKey: null,
          selectedCreatureId: null, currentPage: 0,
          lastRequest: null, lastOutcome: null,
        },
      },
      scout: {
        lastOutcome: null,
        lastResult: null,
        controller: {
          schema: 'cf-v2-compendium-scout-diagnostics/v1',
          attachedMountCount: 0, retainedDomCount: 0, pendingWork: 0,
          convergenceLatched: false, delegatedListenerCount: 2,
          creatureControlCount: 0, surfaceKey: null, contextKey: null,
          selectedCreatureId: null, currentPage: 0,
          lastRequest: null, lastOutcome: null,
        },
      },
    });
    const currentDiagnostics = structuredClone(report.recoveryBundle);
    for (const snapshot of diagnosticSnapshots(currentDiagnostics)) {
      Object.assign(snapshot.ownershipV2, {
        schema: 'cf-v2-arc5-app-state/v3',
        ...currentArc5DiagnosticSubtrees(),
      });
    }
    const currentReplay = assessArc4ExhaustionRecovery(currentDiagnostics);
    expect(currentReplay.ok, currentReplay.reasons.join(', ')).toBe(true);

    const arc5DiagnosticSubtrees = ['feed', 'breed', 'rename', 'scout'] as const;
    const arc5DiagnosticControls = ['wrong', 'missing', 'extra'] as const;
    for (const subtree of arc5DiagnosticSubtrees) {
      for (const control of arc5DiagnosticControls) {
        const mutant = structuredClone(currentDiagnostics);
        for (const snapshot of diagnosticSnapshots(mutant)) {
          const diagnostic = snapshot.ownershipV2[subtree];
          if (control === 'wrong') {
            diagnostic.controller.schema = 'cf-v2-selftest-wrong-diagnostics/v1';
          } else if (control === 'missing') {
            delete diagnostic.lastResult;
          } else {
            diagnostic.selftestExtra = true;
          }
        }
        expect(mutant, `${subtree}:${control}`).not.toEqual(currentDiagnostics);
        const replayed = assessArc4ExhaustionRecovery(mutant);
        expect(replayed.ok, `${subtree}:${control}`).toBe(false);
        expect(Object.entries(replayed.checks)
          .filter(([, value]) => value !== true).map(([name]) => name),
        `${subtree}:${control}`).toEqual([
          'exhaustedLive', 'ownershipV2Live', 'uiComplete',
        ]);
      }
    }

    const legacyWithExtraFeed = structuredClone(report.recoveryBundle);
    for (const snapshot of diagnosticSnapshots(legacyWithExtraFeed)) {
      snapshot.ownershipV2.feed = {};
    }
    const legacyExtraReplay = assessArc4ExhaustionRecovery(legacyWithExtraFeed, {
      allowLegacyArc5Diagnostics: true,
    });
    expect(Object.entries(legacyExtraReplay.checks)
      .filter(([, value]) => value !== true).map(([name]) => name))
      .toEqual(['exhaustedLive', 'ownershipV2Live', 'uiComplete']);

    const malformedCurrentFeed = structuredClone(currentDiagnostics);
    for (const snapshot of diagnosticSnapshots(malformedCurrentFeed)) {
      snapshot.ownershipV2.feed = {};
    }
    const malformedCurrentReplay = assessArc4ExhaustionRecovery(malformedCurrentFeed);
    expect(Object.entries(malformedCurrentReplay.checks)
      .filter(([, value]) => value !== true).map(([name]) => name))
      .toEqual(['exhaustedLive', 'ownershipV2Live', 'uiComplete']);
  });
});
