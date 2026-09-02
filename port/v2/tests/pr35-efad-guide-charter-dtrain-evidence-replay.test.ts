import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

/* Immutable replay of PR #35's ninth hosted attempt. These carriers preserve
 * the terminal-red efad/778d run; successor repairs cannot turn it into Slice,
 * Glass, Recovery, product, or merge authority. */
const HOSTED = Object.freeze({
  prNumber: 35,
  githubRunId: 33_572_309_149,
  attempt: 1,
  exactHead: 'efad4b44c86ad89cbed39c18a39e2bbc9370caaf',
  exactBase: '7a9f4c1370dd84292388d718c38ff34214f6203b',
  exactHeadTree: '89116f64dafd0cf26fe210597da1c079edefcd76',
  syntheticMerge: '778d3cf58937476a65c550e875b946290c0967b4',
  syntheticTree: '89116f64dafd0cf26fe210597da1c079edefcd76',
  authorizationJobId: 100_068_700_331,
  batteryJobId: 100_068_719_363,
  artifactId: 9_827_040_606,
  artifactBytes: 9_780_335,
  artifactDigest: 'sha256:869d8ee0780f3f4fcbe3d1a3b17b353426e4f900ec5c1f146576c169224f1c9a',
});

const SOURCE = Object.freeze({
  commit: HOSTED.syntheticMerge,
  branch: 'detached',
  state: 'committed',
  statusSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  workingTreeSha256: 'f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a',
});

const COMPENDIUM = Object.freeze({
  file: 'ARC1A_COMPENDIUM_PR35_GUIDE_CHARTER_DTRAIN_PREDECESSOR_PASS_20260901_778D3CF.json.gz',
  gzipBytes: 487_306,
  gzipSha256: '50665da8a9cce2c6bb71316c0e32f36acdc8c8a8b02aeba9a2795b60ae7a39c6',
  rawBytes: 12_813_345,
  rawSha256: '1104d93a0f3f1bc094fa844715193a37f34ea6b429d0236bdbb1d9737069d186',
  runId: 'gha-33572309149-1-compendiummem',
  durationMs: 2_324_739,
});

const SLICE = Object.freeze({
  jsonFile: 'ARC4_SLICE_PR35_GUIDE_CHARTER_DTRAIN_RED_20260901_778D3CF.json.gz',
  jsonGzipBytes: 14_617,
  jsonGzipSha256: '759664be81dc7b7368141314b108c431dbd4981f95537dd1a9e8013030255a38',
  jsonRawBytes: 70_840,
  jsonRawSha256: '5e3e544c5089966ff416192575821b3b6259eb32a516d521b187a9e9cf7518ba',
  logFile: 'ARC4_SLICE_PR35_GUIDE_CHARTER_DTRAIN_RED_20260901_778D3CF.log.gz',
  logGzipBytes: 8_745,
  logGzipSha256: '7402b44e95275213f7f1040298958d5b9ceaae80f41f259908d59c118989802f',
  logRawBytes: 32_907,
  logRawSha256: '4d036dcc44c51db6c755fc65e31f1721cdfd32c5fea65519a1d5c4bc11375cc3',
  runId: 'gha-33572309149-1-slice',
  durationMs: 1_345_522,
});

const FINDINGS = Object.freeze([
  Object.freeze({
    index: 0, scope: 'harness',
    messageSha256: 'feb07eaa26a0c1a5fff8429403bbd3b270506e14357cfc718e98e10e4ed7b052',
  }),
  Object.freeze({
    index: 1, scope: 'saturated-charter-recovery',
    messageSha256: 'b71270517133e3249db231c30f8e820312d2a510ac5d6e575afa0c2fd45fae34',
  }),
  Object.freeze({
    index: 2, scope: 'd-train-full-finish',
    messageSha256: '9f813e8275974d0bb303605f69c158c56899852e5da07797488c885d6c3b9e8d',
  }),
]);

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

describe('PR #35 efad/778d hosted Guide, Charter, and D-TRAIN evidence replay', () => {
  it('binds all three deterministic gzip carriers and their raw payloads', () => {
    for (const artifact of [
      { carrier: compendiumCarrier, gzipBytes: COMPENDIUM.gzipBytes,
        gzipSha256: COMPENDIUM.gzipSha256, rawBytes: COMPENDIUM.rawBytes,
        rawSha256: COMPENDIUM.rawSha256 },
      { carrier: sliceJsonCarrier, gzipBytes: SLICE.jsonGzipBytes,
        gzipSha256: SLICE.jsonGzipSha256, rawBytes: SLICE.jsonRawBytes,
        rawSha256: SLICE.jsonRawSha256 },
      { carrier: sliceLogCarrier, gzipBytes: SLICE.logGzipBytes,
        gzipSha256: SLICE.logGzipSha256, rawBytes: SLICE.logRawBytes,
        rawSha256: SLICE.logRawSha256 },
    ]) {
      expect(artifact.carrier.compressed.byteLength).toBe(artifact.gzipBytes);
      expect(sha256(artifact.carrier.compressed)).toBe(artifact.gzipSha256);
      expect(artifact.carrier.raw.byteLength).toBe(artifact.rawBytes);
      expect(sha256(artifact.carrier.raw)).toBe(artifact.rawSha256);
    }
  });

  it('binds the authorized head/base, artifact, and byte-equivalent synthetic source', () => {
    expect(HOSTED.syntheticTree).toBe(HOSTED.exactHeadTree);
    expect(HOSTED).toMatchObject({
      prNumber: 35, githubRunId: 33_572_309_149, attempt: 1,
      artifactId: 9_827_040_606, artifactBytes: 9_780_335,
    });
    expect(compendiumReport.source).toEqual({ begin: SOURCE, end: SOURCE });
    expect(sliceReport.source).toEqual(SOURCE);
    expect(sliceReport.sourceEnd).toEqual(SOURCE);
  });

  it('retains the named Compendium predecessor as one exact-source 78/78 PASS', () => {
    expect(compendiumReport).toMatchObject({
      schema: 'cf-v2-compendium-memory-report/v1', runId: COMPENDIUM.runId,
      status: 'pass', durationMs: COMPENDIUM.durationMs,
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

  it('retains exactly three ordered Slice scopes and denies successor authority', () => {
    expect(sliceReport).toMatchObject({
      schema: 'cf-v2-slice-smoke-ci/v2',
      run: { id: SLICE.runId },
      assuranceProfile: 'develop', status: 'fail', terminal: true, certifying: false,
      durationMs: SLICE.durationMs,
      sourceChange: { detected: false, ending: null },
      retryPolicy: { automaticRetries: 0 },
      exit: { code: 1, childCode: 1, signal: null, spawnError: null },
      summary: { findingCount: 3, scopeCount: 3 },
      failureEvidence: { declaredCount: 3, bulletCount: 3, diagnostics: [] },
    });
    expect(sliceReport.findings.map(({ index, scope, message }) => ({
      index, scope, messageSha256: sha256(message),
    }))).toEqual(FINDINGS);
    expect(sliceReport.groups).toEqual(sliceReport.findings.map((entry) => ({
      scope: entry.scope, primary: entry.message, related: [],
    })));
    expect(sliceReport.screenshots).toHaveLength(10);
    expect(new Set(sliceReport.screenshots.map((entry) => entry.logicalName))).toEqual(new Set([
      'codex', 'earth', 'galaxy', 'guide', 'phone',
      'settings', 'sol', 'solmark', 'training', 'universe',
    ]));
    expect(Object.hasOwn(sliceReport, 'successEvidence')).toBe(false);
    expect(Object.hasOwn(sliceReport, 'glass')).toBe(false);
    expect(Object.hasOwn(sliceReport, 'recovery')).toBe(false);
  });

  it('preserves the Guide tail as healthy content stopped below its actual bottom', () => {
    const payload = findingPayload(finding(sliceReport, 'harness'));
    expect(payload).toEqual({
      ok: false, overflowY: 'auto', advanced: false, visible: false,
      scrollTop: 20_000, maxScroll: 25_829, scrollHeight: 26_476, clientHeight: 647,
      text: '🌐 DEVELOPMENT PUBLISHING STAYS PARKED: The owner-authorized, labelled PR battery can build, browser-check, and archive an exact-commit v2.0 preview package with full Guide identity, origin refusal, and byte inventory; it does not publish. The separate branch-site workflow remains manually parked, and production remains the v1.8.9 main-branch site.',
    });
    expect(payload.scrollTop).toBeLessThan(payload.maxScroll);
  });

  it('preserves the Charter serial race that let Share interrupt Landing', () => {
    const payload = findingPayload(finding(sliceReport, 'saturated-charter-recovery'));
    expect(payload).toEqual({
      beforeSerial: 1,
      toastOn: true,
      toastSerial: 3,
      toastText: '★ 3 Charter chapters — completeChapter 1 — Off the Rock through Chapter 3 — Beyond the Rim are now recorded. This expedition’s established reach remains preserved.',
    });
    expect(payload.toastSerial).not.toBe(payload.beforeSerial + 1);
  });

  it('preserves D-TRAIN release success followed by one not-yet-converged bulletin field', () => {
    const payload = findingPayload(finding(sliceReport, 'd-train-full-finish'));
    expect(payload).toMatchObject({
      dtrainFinishNativeArmed: true,
      dtrainFinishArmed: true,
      mixed: {
        skip: true, disabled: true, busy: 'true', released: true,
        before: { stage: 'waiting-active-persist' },
        after: { stage: 'waiting-active-persist' },
      },
      done: {
        mode: 'surface', gal: 999, star: 424242, planet: 133, planetOrdinal: 2,
        rnSeen: '1.8.9', releasePending: '2.0.0-test', panelOpen: null,
        tutActive: false, tutDone: true, trainingCheckpointWriteHeld: false,
        trainingRestoreWitness: { stage: 'released' },
        keyboardTarget: 'planet:424242:133:2',
      },
      raw: { rn: '1.8.9' },
      witness: { ok: true, reasons: [] },
      rawAssessment: { ok: false, reasons: ['outer.rn'] },
      routeAssessment: { ok: true, reasons: [] },
    });
    expect(payload.mixed.before).toEqual(payload.mixed.after);
    expect(payload.witness.entries.map((entry: Record<string, unknown>) => entry.stage)).toEqual([
      'invoked', 'claimed', 'waiting-active-persist', 'active-persist-settled',
      'candidate-started', 'earth-proven', 'primary-write-started',
      'primary-write-complete', 'live-swap-complete', 'released',
    ]);
    const actual = structuredClone(payload.rawAssessment.outer.actual);
    const expected = structuredClone(payload.rawAssessment.outer.expected);
    expect([actual.rn, expected.rn]).toEqual(['1.8.9', '2.0.0-test']);
    delete actual.rn;
    delete expected.rn;
    expect(actual).toEqual(expected);
  });

  it('cross-binds the raw log and keeps the run terminal red', () => {
    expect(sliceReport.rawLog).toEqual({
      path: `apps/game/smoke/slice-smoke-${SLICE.runId}.log`,
      bytes: SLICE.logRawBytes,
      sha256: SLICE.logRawSha256,
    });
    expect(sliceReport.childOutput).toEqual({
      stdoutBytes: 3_025,
      stdoutSha256: '2294cde457e3f6dee85e646d9a4023b7f68f021f60112fec3b75e8684593d876',
      stderrBytes: 29_668,
      stderrSha256: 'c7a2aafe3c11f77fdab90265dccc7d48ef0761dd48af07e27b5d6edcf9ccb056',
      overallPassMarkerCount: 0,
    });
    expect(sliceReport.arc4SuccessEvidence).toEqual({
      required: false, ok: null, ledger: null, ledgerLineCount: 0,
      passMarkerCount: 0, reasons: [],
    });
    for (const entry of sliceReport.findings) expect(sliceLog).toContain(entry.message);
    expect(sliceLog).toContain(`# run ${SLICE.runId}`);
    expect(sliceLog).toContain('# assurance-profile develop');
    expect(sliceLog).toContain('SLICE SMOKE: FAIL — 3 findings');
    expect(sliceLog).not.toContain('SLICE SMOKE: OVERALL PASS');
    expect(sliceLog).not.toContain('GLASS MATRIX: PASS');
    expect(sliceLog).not.toContain('RECOVERY: PASS');
  });
});
