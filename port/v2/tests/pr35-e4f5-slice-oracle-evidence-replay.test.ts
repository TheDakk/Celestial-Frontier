import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

/*
 * These literals bind the immutable e4f5 browser campaign. This replay is
 * browser-free and must never promote the terminal Slice red into Glass or
 * Recovery authority after the Slice instrument is repaired.
 */
const SOURCE = Object.freeze({
  commit: 'e4f5af4bf628ee2f0b2485077e46dc0ff86b2b0c',
  branch: 'openai/mac',
  state: 'committed',
  statusSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  workingTreeSha256: 'f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a',
});

const COMPENDIUM = Object.freeze({
  file: 'ARC1C_COMPENDIUM_PR35_SLICE_ORACLE_REPAIR_PASS_20260830_E4F5AF4.json.gz',
  gzipBytes: 521_190,
  gzipSha256: '62836b0c47307b77a4656fa82075a7eabb7c18332288272b6eab4e1256e0de61',
  rawBytes: 10_798_329,
  rawSha256: '23f93aaf9af016ffd9c6aeaf137539041a63e10ad339495f1837442e73a2a7ca',
  runId: '20260830-pr35-slice-oracle-e4f5af4bf628-compendium-certification',
});

const SLICE = Object.freeze({
  jsonFile: 'ARC4_SLICE_PR35_REPLACEMENT_ENGINEERING_SURVEY_RED_20260830_E4F5AF4.json.gz',
  jsonGzipBytes: 106_663,
  jsonGzipSha256: '405ba09fb441dee907a2a03fa116acd54acfcccd821b10d919e02419f083c3c1',
  jsonRawBytes: 784_482,
  jsonRawSha256: '4d588a0e6e49fee7b85f662ff26266ef009bff09bdb9d316cd75b1531c5f3ca3',
  logFile: 'ARC4_SLICE_PR35_REPLACEMENT_ENGINEERING_SURVEY_RED_20260830_E4F5AF4.log.gz',
  logGzipBytes: 43_745,
  logGzipSha256: 'f84f5d14529b4b8e1476d7d1f14a8715cda3dd9d0ba75241a076d2b0088acc7a',
  logRawBytes: 323_366,
  logRawSha256: 'f3fb5deaf0a87b7be832345a8256bea872307fa2c91ea23b0783e0217303861a',
  runId: '20260830-pr35-slice-oracle-e4f5af4bf628-slice-certification',
});

const SLICE_SCOPES = Object.freeze([
  'f4-replacement-outcome',
  'arc-3-mine-action',
  'arc-3-mine-action-controls-failed',
  'harness',
]);

const SLICE_MESSAGE_SHA256 = Object.freeze([
  'ca57a2af5bae455d07b63f0826ba8b5cfb47423e25b6662682733acbdc78ef47',
  '5af97e52b8f515b59b54e62611b422f012f38667c95e67a84d926cbe9a208395',
  'a674c0fa5b4695ae272993d45e4f5a42d070e125a67c17c281e566e12f33b445',
  'ed255b27ff9351e579bc9b18a0818a6cf2390c47ac31a99f06577c53029e79a8',
]);

const F4_REASONS = Object.freeze([
  'replacement boundary',
  'boot revision and RNG',
  'unrelated replacement state',
  'durable outcome parity',
]);

const ENGINEERING_PRESERVATION_REASON =
  'unrelated durable Engineering rows/extensions preserved';

type SourceSignature = typeof SOURCE;
type CompendiumReport = {
  schema: string;
  runId: string;
  status: string;
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
  status: string;
  terminal: boolean;
  certifying: boolean;
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

function findingPayload(report: SliceReport, scope: string): Record<string, any> {
  const matches = report.findings.filter((finding) => finding.scope === scope);
  expect(matches, `one exact ${scope} finding`).toHaveLength(1);
  const [finding] = matches;
  if (!finding) throw new Error(`missing exact ${scope} finding`);
  const start = finding.message.indexOf('{');
  expect(start, `${scope} JSON payload`).toBeGreaterThanOrEqual(0);
  return JSON.parse(finding.message.slice(start)) as Record<string, any>;
}

const compendiumCarrier = loadCarrier(COMPENDIUM.file);
const sliceJsonCarrier = loadCarrier(SLICE.jsonFile);
const sliceLogCarrier = loadCarrier(SLICE.logFile);
const compendiumReport = JSON.parse(compendiumCarrier.raw.toString('utf8')) as CompendiumReport;
const sliceReport = JSON.parse(sliceJsonCarrier.raw.toString('utf8')) as SliceReport;
const sliceLog = sliceLogCarrier.raw.toString('utf8');

describe('exact-source e4f5 Compendium PASS and terminal Slice evidence replay', () => {
  it('binds all three preserved gzip carriers and their raw payloads', () => {
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

  it('binds the named Compendium run to one exact-source 78/78 PASS', () => {
    expect(compendiumReport).toMatchObject({
      schema: 'cf-v2-compendium-memory-report/v1',
      runId: COMPENDIUM.runId,
      status: 'pass',
      lifecycle: { schema: 'cf-v2-compendium-report-lifecycle/v1', status: 'complete' },
      policy: { attemptCount: 1, automaticRetries: 0 },
    });
    expect(compendiumReport.source).toEqual({ begin: SOURCE, end: SOURCE });
    expect(compendiumReport.expectedOutcomes).toHaveLength(78);
    expect(new Set(compendiumReport.expectedOutcomes).size).toBe(78);
    expect(compendiumReport.outcomes).toHaveLength(78);
    expect(compendiumReport.outcomes.map(({ id }) => id)).toEqual(compendiumReport.expectedOutcomes);
    expect(compendiumReport.outcomes.every(({ status }) => status === 'pass')).toBe(true);
    expect(compendiumReport.outcomes.filter(({ profile }) => profile === 'phone')).toHaveLength(39);
    expect(compendiumReport.outcomes.filter(({ profile }) => profile === 'desktop')).toHaveLength(39);
    expect(compendiumReport.findings).toEqual([]);
    expect(compendiumReport.blockedOutcomes).toEqual([]);
    expect(compendiumReport.partialFailure).toBeNull();
  });

  it('binds one terminal four-scope Slice FAIL with unchanged exact source and zero retry', () => {
    expect(sliceReport).toMatchObject({
      schema: 'cf-v2-slice-smoke-ci/v1',
      run: {
        id: SLICE.runId,
        artifactPath: `apps/game/smoke/slice-smoke-${SLICE.runId}.json`,
        screenshotPattern: `apps/game/smoke/slice-${SLICE.runId}-*.png`,
      },
      status: 'fail',
      terminal: true,
      certifying: false,
      sourceChange: { detected: false, ending: null },
      retryPolicy: { automaticRetries: 0 },
      exit: { code: 1, childCode: 1, signal: null, spawnError: null },
    });
    expect(sliceReport.source).toEqual(SOURCE);
    expect(sliceReport.sourceEnd).toEqual(SOURCE);
    expect(sliceReport.summary).toEqual({ findingCount: 4, scopeCount: 4 });
    expect(sliceReport.failureEvidence).toEqual({
      declaredCount: 4,
      bulletCount: 4,
      diagnostics: [],
    });
    expect(sliceReport.findings.map(({ index }) => index)).toEqual([0, 1, 2, 3]);
    expect(sliceReport.findings.map(({ scope }) => scope)).toEqual(SLICE_SCOPES);
    expect(sliceReport.findings.map(({ message }) => sha256(message))).toEqual(
      SLICE_MESSAGE_SHA256,
    );
    expect(sliceReport.groups).toHaveLength(4);
    expect(sliceReport.groups.map(({ scope }) => scope)).toEqual(SLICE_SCOPES);
    expect(sliceReport.groups.map(({ primary }) => primary)).toEqual(
      sliceReport.findings.map(({ message }) => message),
    );
    expect(sliceReport.groups.every(({ related }) => related.length === 0)).toBe(true);
  });

  it('replays the ordered F4 and derivative Engineering reasons without reinterpretation', () => {
    const f4Payload = findingPayload(sliceReport, 'f4-replacement-outcome');
    expect(f4Payload).toMatchObject({
      f4StageStarted: true,
      f4TraceArmed: true,
      assessment: { ok: false, reasons: F4_REASONS },
      bundle: {
        replacement: {
          schema: 'cf-v2-f4-replacement-native/v2',
          clearCalls: 1,
          nativeRequest: true,
          putRequestsNative: true,
          playerSchema: 5,
          carrierVersion: null,
          replacementSeed: null,
          replacementOrdinal: null,
          replacementDraws: null,
        },
      },
    });

    const minePayload = findingPayload(sliceReport, 'arc-3-mine-action');
    expect(minePayload).toMatchObject({
      mineReleased: true,
      assessment: { ok: false, reasons: [ENGINEERING_PRESERVATION_REASON] },
    });

    const controlsPayload = findingPayload(sliceReport, 'arc-3-mine-action-controls-failed');
    expect(Object.keys(controlsPayload.mineActionControls)).toEqual([
      'double',
      'revision',
      'receipt',
      'carrier',
      'keyMismatch',
      'hierarchyAddress',
      'duplicate',
      'missingCooldown',
      'arc2Preservation',
      'charter',
    ]);
    expect(Object.values(controlsPayload.mineActionControls).every((control: any) =>
      control.ok === false && control.reasons[0] === ENGINEERING_PRESERVATION_REASON)).toBe(true);

    expect(sliceReport.findings[3]?.message).toBe(
      'harness: Arc 3 biome Survey pre-purchase route did not reach its browser outcome within 6000ms '
      + '(last {"mode":"system","gal":999,"star":424242,"starX":560,"starY":170,'
      + '"planet":null,"planetOrdinal":null,"navGalaxyKey":"CF1|g:999@90,-60",'
      + '"navStarKey":"CF1|g:999@90,-60|s:424242@560,170","navWorldKey":null,'
      + '"cardOpen":false,"cardTitle":null,"cardCode":null,"planetTarget":null,'
      + '"renderedScene":{"serial":2,"mode":"system","ecologyEpoch":12,'
      + '"galaxyKey":"CF1|g:999@90,-60","starKey":"CF1|g:999@90,-60|s:424242@560,170",'
      + '"worldKey":null},"pendingPersistenceWrites":0,"rowCount":0,"rows":[],'
      + '"sensitiveCount":0,"mineActionCount":0})',
    );
  });

  it('binds the raw Slice output and denies any e4f5 Glass or Recovery successor', () => {
    expect(sliceReport.rawLog).toEqual({
      path: `apps/game/smoke/slice-smoke-${SLICE.runId}.log`,
      bytes: SLICE.logRawBytes,
      sha256: SLICE.logRawSha256,
    });
    expect(sliceReport.childOutput).toEqual({
      stdoutBytes: 2_995,
      stdoutSha256: '10f9056059e78593ea13b7d31bf65ebdc1fabaae5bf62ac436958375b193e4d6',
      stderrBytes: 320_167,
      stderrSha256: '3214105732e9cc6f1e3d402bba7402f8027c56dd0d8e04a2764f486e17480657',
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
    expect(sliceLog).toContain('SLICE SMOKE: FAIL — 4 findings');
    expect(sliceLog).not.toContain('GLASS MATRIX: PASS');
    expect(sliceLog).not.toContain('RECOVERY: PASS');
    expect(Object.hasOwn(sliceReport, 'successEvidence')).toBe(false);
    expect(Object.hasOwn(sliceReport, 'glass')).toBe(false);
    expect(Object.hasOwn(sliceReport, 'recovery')).toBe(false);

    const e4f5Successors = fs.readdirSync(auditsRoot).filter((name) =>
      name.includes('E4F5AF4') && /(?:GLASS|RECOVERY)/u.test(name));
    expect(e4f5Successors).toEqual([]);
  });
});
