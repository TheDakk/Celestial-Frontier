import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
// @ts-expect-error The executable browser evidence contract intentionally has no declaration shim.
import { assessF4ReplacementOutcome } from '../tools/slicesmoke-contract.mjs';

/*
 * These literals bind immutable historical evidence. The replay imports no
 * browser driver and must not promote this terminal Slice red into successor
 * Glass or Recovery authority after later instrument repairs.
 */
const SOURCE = Object.freeze({
  commit: 'ae2a0023da3a90a98e548452113395149847aee5',
  branch: 'openai/mac',
  state: 'committed',
  statusSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  workingTreeSha256: 'f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a',
});

const COMPENDIUM = Object.freeze({
  file: 'ARC1C_COMPENDIUM_PR35_GUIDE_CF1_REPAIR_PASS_20260830_AE2A002.json.gz',
  gzipBytes: 451_761,
  gzipSha256: 'c41e40c0f7da7829d894f762fe4dee94b1d4a5dd663c07211e76f3700cc56d0f',
  rawBytes: 10_869_876,
  rawSha256: '864efc28836ca5aaff9ea3efa286169f4fd49f49e6811e68375fb5837f72098d',
  runId: '20260830-pr35-guide-cf1-ae2a0023da3a-compendium-certification',
});

const SLICE = Object.freeze({
  jsonFile: 'ARC4_SLICE_PR35_POST_REPAIR_INSTRUMENT_DRIFT_20260830_AE2A002.json.gz',
  jsonGzipBytes: 78_146,
  jsonGzipSha256: 'f2749443714acbfebcfd12a0527502b1156a67560eaec068f751ddcde665f045',
  jsonRawBytes: 905_230,
  jsonRawSha256: '585b006d26970ef9f9e4d2cd954f6f8791df935594535dd3b1dde0b51312412c',
  logFile: 'ARC4_SLICE_PR35_POST_REPAIR_INSTRUMENT_DRIFT_20260830_AE2A002.log.gz',
  logGzipBytes: 37_399,
  logGzipSha256: '9d57cded083613decc33233db185d0c53d6c6bf1ae7d65f2b74209705cfbc699',
  logRawBytes: 420_442,
  logRawSha256: '73fd34e7c3126ad57b15b794e26e1b8f36ef2848dd523ebb4c55ee101b043262',
  runId: '20260830132231723-50968-0e9bd00aee77',
});

const SLICE_SCOPES = Object.freeze([
  'guide-compendium-copy-control-failed',
  'guide-audio-ownership-control-failed',
  'guide-charter-copy-control-failed',
  'guide-charter-polarity-control-failed',
  'atlas-authorization-setup',
  'atlas-authorization',
  'f4-replacement-outcome',
  'arc-2-inventory-reload-atlas',
]);

const SLICE_SCREENSHOTS = Object.freeze([
  ['earth', 588_419, '5f4ec53f7a90bc3102932ef78bcd7bbaf8491e99e3e6c3e6b4512d68f139fc48'],
  ['galaxy', 576_150, '3846ef383a86440f65daf6c7dfc015b70152b1bd0b981f2d2e621b95c5344b5b'],
  ['guide', 322_542, '3c313d84a35c1acc0db20812b9a71afc32262c215a0d05e271a65470184d1048'],
  ['settings', 290_409, '72f55e9c8e9567f5df948a9c5e0ce062cdefbc28363251b2db2a2441cdd8aee8'],
  ['sol', 227_295, '33bc01c677715964169d567301cd41f74d993c342a0d43d9c2658599f6d04815'],
  ['solmark', 381_007, '0d8dd87f58f3fc0168ae86fa2e4836e4343cd8038c4f09a7aaeb21cca242abfd'],
  ['universe', 378_436, 'cb144552b98fe65cde0de56a98c2d9265cf5aac57a9dc15b6e7f896d96889572'],
].map(([logicalName, bytes, sha256]) => ({
  name: `slice-${SLICE.runId}-${logicalName}.png`,
  logicalName,
  path: `apps/game/smoke/slice-${SLICE.runId}-${logicalName}.png`,
  bytes,
  sha256,
})));

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
  groups: Array<{ scope: string }>;
  rawLog: Record<string, unknown>;
  childOutput: Record<string, unknown>;
  screenshots: Array<Record<string, unknown>>;
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

describe('exact-source ae2 Compendium PASS and terminal Slice red evidence replay', () => {
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

  it('binds the named Compendium run to an exact-source 78/78 PASS', () => {
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

  it('binds the exact eight-scope Slice red and denies Glass/Recovery authority', () => {
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
    expect(sliceReport.summary).toEqual({ findingCount: 8, scopeCount: 8 });
    expect(sliceReport.failureEvidence).toEqual({
      declaredCount: 8,
      bulletCount: 8,
      diagnostics: [],
    });
    expect(sliceReport.findings.map(({ index }) => index)).toEqual(
      Array.from({ length: 8 }, (_, index) => index),
    );
    expect(sliceReport.findings.map(({ scope }) => scope)).toEqual(SLICE_SCOPES);
    expect(sliceReport.groups.map(({ scope }) => scope)).toEqual(SLICE_SCOPES);
    expect(sliceReport.screenshots).toEqual(SLICE_SCREENSHOTS);
    expect(sliceReport.rawLog).toEqual({
      path: `apps/game/smoke/slice-smoke-${SLICE.runId}.log`,
      bytes: SLICE.logRawBytes,
      sha256: SLICE.logRawSha256,
    });
    expect(sliceReport.childOutput).toEqual({
      stdoutBytes: 2_995,
      stdoutSha256: '755abbe669a741c7b071dd1af76faaba2556f0c299b0c58b27af5a18e6c764c5',
      stderrBytes: 417_266,
      stderrSha256: 'c5aaaae32aa9c222e229b48096987cd0db6f80b73729a2844cf5edec4ff8daf7',
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

    const glassAuthorized = sliceReport.status === 'pass'
      && sliceReport.terminal === true && sliceReport.certifying === true;
    const recoveryAuthorized = glassAuthorized
      && Object.hasOwn(sliceReport, 'glass') && Object.hasOwn(sliceReport, 'successEvidence');
    expect({ glassAuthorized, recoveryAuthorized }).toEqual({
      glassAuthorized: false,
      recoveryAuthorized: false,
    });
    expect(Object.hasOwn(sliceReport, 'successEvidence')).toBe(false);
    expect(Object.hasOwn(sliceReport, 'glass')).toBe(false);
    expect(Object.hasOwn(sliceReport, 'recovery')).toBe(false);
    expect(sliceLog).toContain(`# run ${SLICE.runId}`);
    expect(sliceLog).toContain('SLICE SMOKE: FAIL — 8 findings');
    expect(sliceLog).not.toContain('GLASS MATRIX: PASS');
    expect(sliceLog).not.toContain('RECOVERY: PASS');
  });

  it('replays the retained F4 bundle as red with an Arc 9 receipt before Smoke', () => {
    const payload = findingPayload(sliceReport, 'f4-replacement-outcome');
    const bundle = payload.bundle;

    expect(payload.f4StageStarted).toBe(true);
    expect(payload.f4TraceArmed).toBe(true);
    expect(payload.assessment).toEqual({
      ok: false,
      reasons: [
        'atomic replacement reset',
        'real outcome receipt',
        'durable outcome parity',
      ],
    });
    expect(bundle.staged).toMatchObject({
      revision: 7,
      ordinal: 1,
      receiptKeys: ['receipt:0'],
      receiptRows: [{
        ordinal: 0,
        kind: 'slice-smoke-old-expedition',
        witness: 'old-expedition:0',
      }],
    });

    // This historical v1 trace did not carry the later v2 replacement fields.
    // Replay it exactly; never synthesize those absent fields to turn old red green.
    expect(Object.hasOwn(bundle, 'replacement')).toBe(false);
    expect(Object.hasOwn(bundle, 'expectation')).toBe(false);
    expect(bundle.reset.trace).toEqual({
      schema: 'cf-v2-f4-replacement-native/v1',
      clearCalls: 1,
      store: 'receipts',
      mode: 'readwrite',
      stores: [
        'catalog', 'creatures', 'inventory', 'journal',
        'meta', 'player', 'receipts', 'settings',
      ],
      nativeRequest: true,
    });
    expect(bundle.reset.raw).toMatchObject({
      revision: 10,
      ordinal: 1,
      receiptKeys: ['receipt:0'],
      receiptRows: [{
        ordinal: 0,
        kind: 'arc9-progression-refresh-v1',
        witness: 'arc9p1:a8f5961bf107300e280aa9cda8160e051e02ab691c80cda40eaf87642d4f62c9',
      }],
    });
    expect(bundle.reset.state.persistence).toMatchObject({
      lastOutcome: 'arc9-progression-committed:10',
      runtime: { revision: 10, sessionOrdinal: 1, commits: 2 },
    });
    expect(bundle.outcome).toMatchObject({
      schema: 'cf-v2-f4-smoke-outcome/v1',
      kind: 'committed',
      beforeRevision: 10,
      afterRevision: 11,
      beforeOrdinal: 1,
      afterOrdinal: 2,
      revision: 11,
      plan: { receiptOrdinal: 1 },
      receipt: {
        ordinal: 1,
        kind: 'slice-smoke-f4-outcome',
        witness: 'slice-smoke-f4:1:0.5714448266662657',
      },
    });
    expect(bundle.after.raw).toMatchObject({
      revision: 11,
      ordinal: 2,
      draws: { 'diagnostics.slice-smoke.f4': 1 },
      receiptKeys: ['receipt:0', 'receipt:1'],
      receiptRows: [
        {
          ordinal: 0,
          kind: 'arc9-progression-refresh-v1',
          witness: 'arc9p1:a8f5961bf107300e280aa9cda8160e051e02ab691c80cda40eaf87642d4f62c9',
        },
        {
          ordinal: 1,
          kind: 'slice-smoke-f4-outcome',
          witness: 'slice-smoke-f4:1:0.5714448266662657',
        },
      ],
    });
    expect(bundle.after.state.persistence).toMatchObject({
      lastOutcome: 'outcome-committed:11',
      runtime: { revision: 11, sessionOrdinal: 2, commits: 3 },
    });
    expect(bundle.productStable).toBe(true);

    const oldEmptyLedgerAssumption = bundle.reset.raw.receiptRows.length === 0
      && bundle.outcome.beforeOrdinal === 0;
    expect(oldEmptyLedgerAssumption).toBe(false);

    const currentReplay = assessF4ReplacementOutcome(bundle);
    expect(currentReplay.ok).toBe(false);
    expect(currentReplay.reasons).toEqual(expect.arrayContaining([
      'fixture authority',
      'native atomic clear',
      'replacement boundary',
      'branch selection',
    ]));
  });
});
