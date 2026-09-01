import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

/*
 * Browser-free replay of PR #35's immutable eighth hosted attempt. The
 * carriers remain terminal-red evidence: later harness repairs must never
 * rewrite this run into Slice, Glass, Recovery, product, or merge authority.
 */
const HOSTED = Object.freeze({
  prNumber: 35,
  githubRunId: 33_560_546_382,
  attempt: 1,
  exactHead: 'c0ad51a1a63f7f649493122ab8d7d5e8588f6a9d',
  exactBase: '7a9f4c1370dd84292388d718c38ff34214f6203b',
  exactHeadTree: '7b1d851c2ed92ecaaaf26aec8c178a0c145c74aa',
  syntheticMerge: 'f03a68d75dd03512d2dc994febc9bb18e5b52d9c',
  syntheticTree: '7b1d851c2ed92ecaaaf26aec8c178a0c145c74aa',
  authorizationJobId: 100_031_692_379,
  batteryJobId: 100_031_723_808,
});

const SOURCE = Object.freeze({
  commit: HOSTED.syntheticMerge,
  branch: 'detached',
  state: 'committed',
  statusSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  workingTreeSha256: 'f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a',
});

const COMPENDIUM = Object.freeze({
  file: 'ARC1A_COMPENDIUM_PR35_FEED_AUDIO_ROUTE_PHONE_LANDING_PREDECESSOR_PASS_20260901_F03A68D.json.gz',
  gzipBytes: 487_306,
  gzipSha256: '61ae809dd92be87770c90c953ac8b40fcc400d6e4cdea9a3f0dd05179dbf96bf',
  rawBytes: 12_846_608,
  rawSha256: 'e072796cbf082c4f4c44734924f5b8836cb1162b5854cc08540abd334c6fd040',
  runId: 'gha-33560546382-1-compendiummem',
  durationMs: 2_334_319,
});

const SLICE = Object.freeze({
  jsonFile: 'ARC4_SLICE_PR35_FEED_AUDIO_ROUTE_PHONE_LANDING_RED_20260901_F03A68D.json.gz',
  jsonGzipBytes: 84_367,
  jsonGzipSha256: '81a1858f8ac32a9f8ff3d0873163cdb0c13f4a9fe85216386f6c35582ea1e17e',
  jsonRawBytes: 800_679,
  jsonRawSha256: 'd34b160ed34ab9452ced8deeb509947f409831bc037dbb00c80233743d74c492',
  logFile: 'ARC4_SLICE_PR35_FEED_AUDIO_ROUTE_PHONE_LANDING_RED_20260901_F03A68D.log.gz',
  logGzipBytes: 39_079,
  logGzipSha256: 'cec392ef4c80c02639726a3cac24f9669df8889a6f57edc018cf3d8a9a67efcd',
  logRawBytes: 343_139,
  logRawSha256: '3b352cc9cc28270cdbd81781eed832d8176f9b6960c05982b3ff5d4de730e58c',
  runId: 'gha-33560546382-1-slice',
  durationMs: 1_017_899,
});

const PHONE_FAILURE =
  'harness: phone Earth landing did not reach its phone outcome within 6000ms (last null)';

type SourceSignature = typeof SOURCE;
type CompendiumReport = {
  schema: string;
  runId: string;
  status: string;
  durationMs: number;
  lifecycle: Record<string, string>;
  policy: Record<string, number>;
  source: { begin: SourceSignature; end: SourceSignature };
  expectedOutcomes: string[];
  outcomes: Array<{ id: string; profile: string; status: string }>;
  findings: string[];
  blockedOutcomes: string[];
  partialFailure: unknown;
};

type SliceFinding = { index: number; scope: string; message: string };
type SliceReport = {
  schema: string;
  run: Record<string, string>;
  assuranceProfile: string;
  status: string;
  terminal: boolean;
  certifying: boolean;
  durationMs: number;
  source: SourceSignature;
  sourceEnd: SourceSignature;
  sourceChange: { detected: boolean; ending: unknown };
  retryPolicy: Record<string, unknown>;
  exit: Record<string, unknown>;
  summary: { findingCount: number; scopeCount: number };
  failureEvidence: Record<string, unknown>;
  findings: SliceFinding[];
  groups: Array<{ scope: string; primary: string; related: string[] }>;
  rawLog: Record<string, unknown>;
  childOutput: Record<string, unknown>;
  arc4SuccessEvidence: Record<string, unknown>;
  screenshots: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

type Carrier = { compressed: Buffer; raw: Buffer };

const here = path.dirname(fileURLToPath(import.meta.url));
const auditsRoot = path.resolve(here, '..', '..', '..', 'audits');

function loadCarrier(file: string): Carrier {
  const compressed = fs.readFileSync(path.join(auditsRoot, file));
  return { compressed, raw: gunzipSync(compressed) };
}

function sha256(value: Buffer | string): string {
  return createHash('sha256').update(value).digest('hex');
}

function finding(report: SliceReport, scope: string): SliceFinding {
  const matches = report.findings.filter((entry) => entry.scope === scope);
  expect(matches, `one exact ${scope} finding`).toHaveLength(1);
  const [entry] = matches;
  if (!entry) throw new Error(`missing exact ${scope} finding`);
  return entry;
}

function findingPayload(entry: SliceFinding): Record<string, any> {
  const start = entry.message.indexOf('{');
  expect(start, `${entry.scope} JSON payload`).toBeGreaterThanOrEqual(0);
  return JSON.parse(entry.message.slice(start)) as Record<string, any>;
}

const compendiumCarrier = loadCarrier(COMPENDIUM.file);
const sliceJsonCarrier = loadCarrier(SLICE.jsonFile);
const sliceLogCarrier = loadCarrier(SLICE.logFile);
const compendiumReport = JSON.parse(compendiumCarrier.raw.toString('utf8')) as CompendiumReport;
const sliceReport = JSON.parse(sliceJsonCarrier.raw.toString('utf8')) as SliceReport;
const sliceLog = sliceLogCarrier.raw.toString('utf8');

describe('PR #35 c0ad/f03 hosted Feed-audio and phone-landing evidence replay', () => {
  it('binds all three deterministic gzip carriers and their raw payloads', () => {
    const artifacts = [
      {
        carrier: compendiumCarrier,
        gzipBytes: COMPENDIUM.gzipBytes,
        gzipSha256: COMPENDIUM.gzipSha256,
        rawBytes: COMPENDIUM.rawBytes,
        rawSha256: COMPENDIUM.rawSha256,
      },
      {
        carrier: sliceJsonCarrier,
        gzipBytes: SLICE.jsonGzipBytes,
        gzipSha256: SLICE.jsonGzipSha256,
        rawBytes: SLICE.jsonRawBytes,
        rawSha256: SLICE.jsonRawSha256,
      },
      {
        carrier: sliceLogCarrier,
        gzipBytes: SLICE.logGzipBytes,
        gzipSha256: SLICE.logGzipSha256,
        rawBytes: SLICE.logRawBytes,
        rawSha256: SLICE.logRawSha256,
      },
    ];

    for (const artifact of artifacts) {
      expect(artifact.carrier.compressed.byteLength).toBe(artifact.gzipBytes);
      expect(sha256(artifact.carrier.compressed)).toBe(artifact.gzipSha256);
      expect(artifact.carrier.raw.byteLength).toBe(artifact.rawBytes);
      expect(sha256(artifact.carrier.raw)).toBe(artifact.rawSha256);
    }
  });

  it('binds the authorized head/base and byte-equivalent synthetic merge identity', () => {
    expect(HOSTED).toEqual({
      prNumber: 35,
      githubRunId: 33_560_546_382,
      attempt: 1,
      exactHead: 'c0ad51a1a63f7f649493122ab8d7d5e8588f6a9d',
      exactBase: '7a9f4c1370dd84292388d718c38ff34214f6203b',
      exactHeadTree: '7b1d851c2ed92ecaaaf26aec8c178a0c145c74aa',
      syntheticMerge: 'f03a68d75dd03512d2dc994febc9bb18e5b52d9c',
      syntheticTree: '7b1d851c2ed92ecaaaf26aec8c178a0c145c74aa',
      authorizationJobId: 100_031_692_379,
      batteryJobId: 100_031_723_808,
    });
    expect(HOSTED.syntheticTree).toBe(HOSTED.exactHeadTree);
    expect(compendiumReport.source).toEqual({ begin: SOURCE, end: SOURCE });
    expect(sliceReport.source).toEqual(SOURCE);
    expect(sliceReport.sourceEnd).toEqual(SOURCE);
  });

  it('retains the named Compendium predecessor as one exact-source 78/78 PASS', () => {
    expect(compendiumReport).toMatchObject({
      schema: 'cf-v2-compendium-memory-report/v1',
      runId: COMPENDIUM.runId,
      status: 'pass',
      durationMs: COMPENDIUM.durationMs,
      lifecycle: { schema: 'cf-v2-compendium-report-lifecycle/v1', status: 'complete' },
      policy: { attemptCount: 1, automaticRetries: 0 },
    });
    expect(compendiumReport.expectedOutcomes).toHaveLength(78);
    expect(new Set(compendiumReport.expectedOutcomes).size).toBe(78);
    expect(compendiumReport.outcomes).toHaveLength(78);
    expect(compendiumReport.outcomes.map(({ id }) => id)).toEqual(
      compendiumReport.expectedOutcomes,
    );
    expect(compendiumReport.outcomes.every(({ status }) => status === 'pass')).toBe(true);
    expect(compendiumReport.outcomes.filter(({ profile }) => profile === 'phone')).toHaveLength(39);
    expect(compendiumReport.outcomes.filter(({ profile }) => profile === 'desktop')).toHaveLength(39);
    expect(compendiumReport.findings).toEqual([]);
    expect(compendiumReport.blockedOutcomes).toEqual([]);
    expect(compendiumReport.partialFailure).toBeNull();
  });

  it('retains exactly two independent Slice scopes and no successor authority', () => {
    expect(sliceReport).toMatchObject({
      schema: 'cf-v2-slice-smoke-ci/v2',
      run: {
        id: SLICE.runId,
        artifactPath: `apps/game/smoke/slice-smoke-${SLICE.runId}.json`,
        screenshotPattern: `apps/game/smoke/slice-${SLICE.runId}-*.png`,
      },
      assuranceProfile: 'develop',
      status: 'fail',
      terminal: true,
      certifying: false,
      durationMs: SLICE.durationMs,
      sourceChange: { detected: false, ending: null },
      retryPolicy: { automaticRetries: 0 },
      exit: { code: 1, childCode: 1, signal: null, spawnError: null },
      summary: { findingCount: 2, scopeCount: 2 },
      failureEvidence: { declaredCount: 2, bulletCount: 2, diagnostics: [] },
    });
    expect(sliceReport.findings.map(({ index, scope }) => ({ index, scope }))).toEqual([
      { index: 0, scope: 'arc-5-feed-commit' },
      { index: 1, scope: 'harness' },
    ]);
    expect(sliceReport.groups.map(({ scope, related }) => ({ scope, related }))).toEqual([
      { scope: 'arc-5-feed-commit', related: [] },
      { scope: 'harness', related: [] },
    ]);

    const glassAuthorized = sliceReport.status === 'pass'
      && sliceReport.terminal === true && sliceReport.certifying === true;
    expect(glassAuthorized).toBe(false);
    expect(Object.hasOwn(sliceReport, 'successEvidence')).toBe(false);
    expect(Object.hasOwn(sliceReport, 'glass')).toBe(false);
    expect(Object.hasOwn(sliceReport, 'recovery')).toBe(false);
  });

  it('retains Settings success evidence before the later Feed finding', () => {
    const settingsScreenshots = sliceReport.screenshots.filter(
      (entry) => entry.logicalName === 'settings',
    );
    expect(settingsScreenshots).toEqual([{
      name: `slice-${SLICE.runId}-settings.png`,
      logicalName: 'settings',
      path: `apps/game/smoke/slice-${SLICE.runId}-settings.png`,
      bytes: 292_059,
      sha256: 'b4cc2b160c93c5b07f21e792e80e9ab47a96d8f1536f112f5fbda58791297ed0',
    }]);
    expect(sliceReport.findings.some(({ scope }) => /settings/iu.test(scope))).toBe(false);
    expect(sliceReport.findings[0]?.scope).toBe('arc-5-feed-commit');
  });

  it('preserves the durable Feed winner and isolates the red to final live WebAudio reachability', () => {
    const feedFinding = finding(sliceReport, 'arc-5-feed-commit');
    expect(feedFinding.message).toHaveLength(338_962);
    const payload = findingPayload(feedFinding);
    const bundle = payload.bundle;

    expect(payload).toMatchObject({
      released: true,
      fixture: {
        logicalId: 's3650976095',
        sourceIndex: 0,
        fedBefore: 0,
        fedAfter: 1,
        foodQuantityBefore: 1,
        foodQuantityAfter: 0,
        postFeedAvailability: 'no-flora',
      },
      assessment: { ok: false, reasons: ['one post-settlement acknowledgement'] },
      controls: [],
      controlsIsolated: false,
      committedAudioRoute: [],
      twoDocumentAssessment: {
        ok: null, reasons: [], blockedBy: 'committed Feed baseline',
      },
      twoDocumentControl: {
        ok: null, reasons: [], blockedBy: 'two-document Feed baseline',
      },
      twoDocumentControlIsolated: false,
    });

    expect(bundle.before).toMatchObject({
      globalRevision: 107,
      ownershipRevision: 16,
      sourceRevision: 16,
      receiptCount: 20,
      sessionOrdinal: 20,
      creatureFed: 0,
      foodQuantity: 1,
      lotTombstoned: false,
    });
    expect(bundle.after).toMatchObject({
      globalRevision: 108,
      ownershipRevision: 17,
      sourceRevision: 16,
      receiptCount: 21,
      sessionOrdinal: 21,
      creatureFed: 1,
      foodQuantity: 0,
      lotTombstoned: true,
      tombstoneSnapshotQuantity: 1,
      receiptOrdinal: 20,
      receiptKind: 'arc5-companion-feed',
      runtime: { revision: 108, sessionOrdinal: 21, commits: 1, staleWrites: 0 },
    });
    expect(bundle.after.lotDisposition).toMatchObject({
      ordinal: 20,
      actionKind: 'companion-feed',
    });
    expect(bundle.settled).toMatchObject({
      result: {
        fedBefore: 0,
        fedAfter: 1,
        foodQuantityBefore: 1,
        foodQuantityAfter: 0,
        lotTombstoned: true,
        receiptOrdinal: 20,
        revision: 108,
        ownershipRevision: 17,
      },
      controller: {
        pendingWork: 0,
        lastOutcome: {
          schema: 'cf-v2-compendium-feed-outcome/v1',
          kind: 'committed',
          convergence: 'none',
          title: 'Meal complete.',
          detail: 'Meals 0 → 1. Used 1 flora; the exact lot is now empty.',
        },
      },
      lastOutcome: 'committed:108',
      toastSerial: 1,
      toastText: 'Meal complete.Meals 0 → 1. Used 1 flora; the exact lot is now empty.',
    });
    expect(bundle.reopened).toMatchObject({
      logicalId: 's3650976095',
      fed: 1,
      foodQuantity: 0,
      pendingWork: 0,
      feedState: 'no-flora',
      confirmPresent: false,
      allRadiosDisabled: true,
      backEnabled: true,
      closeEnabled: true,
    });
    expect(bundle.reloaded).toMatchObject({
      globalRevision: 108,
      ownershipRevision: 17,
      sourceRevision: 16,
      receiptCount: 21,
      sessionOrdinal: 21,
      creatureFed: 1,
      foodQuantity: 0,
      lotTombstoned: true,
      tombstoneSnapshotQuantity: 1,
      fed: 1,
      pendingWork: 0,
      feedState: 'no-flora',
      runtime: { revision: 108, sessionOrdinal: 21, staleWrites: 0 },
    });
    expect(bundle.heartbeat).toMatchObject({
      quiesced: { wasRunning: true, stopped: true, cycleSettled: true },
      resumed: { running: true },
    });

    expect(bundle.audioCreates).toBe(1);
    expect(bundle.audioStarts).toEqual([{
      startReturned: true,
      sourceConnected: true,
      contextState: 'running',
      pendingWork: 0,
      lastOutcome: 'committed:108',
      toastSerial: 1,
    }]);
    expect(bundle.audioGraph).toMatchObject({
      schema: 'cf-v2-feed-audio-graph/v1',
      sourceCandidateCount: 1,
      destinationCandidateCount: 1,
    });
    const source = bundle.audioGraph.nodes.find(
      (node: Record<string, unknown>) => node.nodeId === bundle.audioGraph.sourceNodeId,
    );
    const destination = bundle.audioGraph.nodes.find(
      (node: Record<string, unknown>) => node.nodeId === bundle.audioGraph.destinationNodeId,
    );
    expect(source).toMatchObject({ nodeType: 'Oscillator' });
    expect(destination).toMatchObject({ nodeType: 'AudioDestination' });
    expect(source.contextId).toBe(destination.contextId);
    expect(bundle.audioGraph.edges.filter(
      (edge: Record<string, unknown>) => edge.sourceId === bundle.audioGraph.sourceNodeId,
    )).toEqual([]);
  });

  it('retains the separate phone landing last-null harness failure exactly', () => {
    const phoneFinding = finding(sliceReport, 'harness');
    expect(phoneFinding).toEqual({ index: 1, scope: 'harness', message: PHONE_FAILURE });
    expect(phoneFinding.message).not.toContain('{');
    expect(sliceReport.screenshots.some((entry) => entry.logicalName === 'phone')).toBe(true);
    expect(sliceReport.groups[1]).toEqual({
      scope: 'harness',
      primary: PHONE_FAILURE,
      related: [],
    });
  });

  it('cross-binds the retained raw log and keeps the run terminal red', () => {
    expect(sliceReport.rawLog).toEqual({
      path: `apps/game/smoke/slice-smoke-${SLICE.runId}.log`,
      bytes: SLICE.logRawBytes,
      sha256: SLICE.logRawSha256,
    });
    expect(sliceReport.childOutput).toEqual({
      stdoutBytes: 3_025,
      stdoutSha256: '63bfb0f1dfc054d95ab31f7a8a8d327e56e805b3681296638150ae91342680fc',
      stderrBytes: 339_900,
      stderrSha256: '5b5eea5381a1c44b47275845d0d74fed8c4bbadb58d0d48a5b3be68d1b880c05',
      overallPassMarkerCount: 0,
    });
    expect(sliceReport.arc4SuccessEvidence).toEqual({
      required: false,
      ok: null,
      ledger: null,
      ledgerLineCount: 0,
      passMarkerCount: 0,
      reasons: [],
    });
    expect(sliceLog).toContain(`# run ${SLICE.runId}`);
    expect(sliceLog).toContain('# assurance-profile develop');
    expect(sliceLog).toContain('SLICE SMOKE: FAIL — 2 findings');
    expect(sliceLog).toContain('1. ARC 5 FEED COMMIT');
    expect(sliceLog).toContain('2. harness');
    expect(sliceLog).toContain(PHONE_FAILURE);
    expect(sliceLog).not.toContain('SLICE SMOKE: OVERALL PASS');
    expect(sliceLog).not.toContain('GLASS MATRIX: PASS');
    expect(sliceLog).not.toContain('RECOVERY: PASS');
  });
});
