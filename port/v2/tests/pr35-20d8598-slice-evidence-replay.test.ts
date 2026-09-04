import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

/*
 * This browser-free replay binds the immutable 20d Compendium PASS and
 * terminal-red Slice run. It preserves the observed six-scope failure
 * exactly and grants no successor authority to Glass or Recovery.
 */
const SOURCE_GIT = Object.freeze({
  commit: '20d8598913e1009e03538085e59a8b63ac7a6655',
  tree: '14d49ce60f84ca47daf831975f28491a7c8302e1',
  parent: 'aa88d916e5141d6f2f8e8969288064ffba0cfc85',
});

const SOURCE = Object.freeze({
  commit: SOURCE_GIT.commit,
  branch: 'openai/mac',
  state: 'committed',
  statusSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  workingTreeSha256: 'f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a',
});

const COMPENDIUM = Object.freeze({
  file: 'ARC1C_COMPENDIUM_PR35_ARC3_REPAIR_PASS_20260830_20D8598.json.gz',
  gzipBytes: 452_409,
  gzipSha256: '3a65d9d53f3efb4139357011db1dd96dc438b3b9632c95436d296e9b4263cd49',
  rawBytes: 10_870_954,
  rawSha256: '3edd72a72f471b9e702956f13d217c940ab989514be8bc86568af1f0fe19ffc0',
  runId: '20260830-pr35-arc3-20d8598913e1-compendium-certification',
});

const SLICE = Object.freeze({
  jsonFile: 'ARC4_SLICE_PR35_RESEARCH_FABRICATION_LANDING_PERTAR_RED_20260830_20D8598.json.gz',
  jsonGzipBytes: 317_389,
  jsonGzipSha256: '275913fda5c64eb382c7fce361ffa3e23aafe659f5d2fb7313050df9b3c5925e',
  jsonRawBytes: 2_365_817,
  jsonRawSha256: 'c7e10726de611e32b55978976dd7bea37334cf8cfc282e286700b887a076b889',
  logFile: 'ARC4_SLICE_PR35_RESEARCH_FABRICATION_LANDING_PERTAR_RED_20260830_20D8598.log.gz',
  logGzipBytes: 144_568,
  logGzipSha256: 'eef6c29cf568c0bb602b18b468f38227c0b5177f9a94b6faad8eb0bd95206585',
  logRawBytes: 971_878,
  logRawSha256: '4d83e68ddd21b6a164a7b5245e24e38cb5e418eb239cb2e9a00b29fd0c19f318',
  runId: '20260830-pr35-arc3-20d8598913e1-slice-certification',
});

const SLICE_SCOPES = Object.freeze([
  'arc-3-research-action',
  'arc-3-fixed-fabrication',
  'arc-0-landing-storage-refusal',
  'arc-0-landing-stale-convergence',
  'arc-0-landing-publication-convergence',
  'harness',
]);

const SLICE_MESSAGE_SHA256 = Object.freeze([
  'e181f67e0a01c3bbd81e59aeb29bc0b4457708fe8efcda68f6bcd73b90d5c600',
  '26d8320aef0fd3e185e5db064887a9b493081ead42005e34e1a8fd5cc8eeae4b',
  '469c23e0f560a5f89d496aa17a512de0285583745d16a12c373219bdf8691694',
  '267860c0c285d6e0b62121d09a65dddc3ed82be37e094faba35bd6b14bf1c51b',
  '473a21ef59c55825b74a7ffcb69f1f236d424036b0a1806669fb609b03b4707d',
  'd65f283bd8ed0c2290f99579deb19a5bb018fcabbb09128129ff95cfc3d38504',
]);

const SLICE_MESSAGE_PREFIXES = Object.freeze([
  'ARC 3 RESEARCH ACTION: native Enter did not commit Deep Scanners and restore semantic row focus',
  'ARC 3 FIXED FABRICATION: native Enter did not couple Plate into '
    + 'Arc2/Arc3/legacy/Charter or restore action focus',
  'ARC 0 LANDING STORAGE REFUSAL: one awaited landing changed durable/live product, '
    + 'retained its coordinator, or retried after storage rejection',
  'ARC 0 LANDING STALE CONVERGENCE: later-writer revision did not remain the sole '
    + 'durable change through held/released reload',
  'ARC 0 LANDING PUBLICATION CONVERGENCE: durable one-receipt landing/reward was '
    + 'published locally, retried, or lost across reload',
  'harness: Arc 5 legacy-carrier upgrade rehearsal exact Pertar capture card did not '
    + 'reach its exact Pertar surface/card/three-enabled-row outcome within 10000ms',
]);

const COMPENDIUM_REVIEW_PACKET = Object.freeze([
  Object.freeze({
    profile: 'phone',
    state: 'list',
    file: `apps/game/smoke/compendiummem-${COMPENDIUM.runId}-phone-list.png`,
    bytes: 718_126,
    sha256: '17311d46f4cbbf75c0d489cc80beccc52cb516fe32cb434279b84b0765e3ee26',
  }),
  Object.freeze({
    profile: 'phone',
    state: 'focus-pinned',
    file: `apps/game/smoke/compendiummem-${COMPENDIUM.runId}-phone-focus-pinned.png`,
    bytes: 647_200,
    sha256: '8a737f97d67296572299d446f9a0417544da9a06ddaa35281ea04a11a3340978',
  }),
  Object.freeze({
    profile: 'phone',
    state: 'detail',
    file: `apps/game/smoke/compendiummem-${COMPENDIUM.runId}-phone-detail.png`,
    bytes: 779_305,
    sha256: 'f945ccf1d81106067777688b44ec6e4782d5cdd689aa44dd7142329d72e7b693',
  }),
  Object.freeze({
    profile: 'desktop',
    state: 'list',
    file: `apps/game/smoke/compendiummem-${COMPENDIUM.runId}-desktop-list.png`,
    bytes: 620_296,
    sha256: '6fed609a3205c009ab0ab4cbe287af7b2314d2db6b6423069644ae188dacf9c7',
  }),
  Object.freeze({
    profile: 'desktop',
    state: 'focus-pinned',
    file: `apps/game/smoke/compendiummem-${COMPENDIUM.runId}-desktop-focus-pinned.png`,
    bytes: 609_176,
    sha256: '787d084512d4112dad77a3ddc091fe4d5c69cf5fe425818f2adf7ba02edd31b5',
  }),
  Object.freeze({
    profile: 'desktop',
    state: 'detail',
    file: `apps/game/smoke/compendiummem-${COMPENDIUM.runId}-desktop-detail.png`,
    bytes: 614_132,
    sha256: 'ede79803e3d2873503a8ea833260327f9264d663c3473e9822649f55ac2781da',
  }),
]);

const SLICE_SCREENSHOTS = Object.freeze([
  Object.freeze({
    logicalName: 'earth',
    path: `apps/game/smoke/slice-${SLICE.runId}-earth.png`,
    bytes: 588_469,
    sha256: 'c97dae6e3f5f44626ae78edda65b95c69741de7456a7697524fe7b311a0cbd65',
  }),
  Object.freeze({
    logicalName: 'galaxy',
    path: `apps/game/smoke/slice-${SLICE.runId}-galaxy.png`,
    bytes: 576_034,
    sha256: 'b8d2e1ce9545b967207b96a2d3c28b8679e730827d5ebf13daa20ed294495f65',
  }),
  Object.freeze({
    logicalName: 'guide',
    path: `apps/game/smoke/slice-${SLICE.runId}-guide.png`,
    bytes: 322_612,
    sha256: 'c703d9f9b853faf0d3d477fbe84e056406903ed2640aa4a6e7445c08a8a0bbd2',
  }),
  Object.freeze({
    logicalName: 'settings',
    path: `apps/game/smoke/slice-${SLICE.runId}-settings.png`,
    bytes: 290_419,
    sha256: 'e80c30be3ea01719a25c458b50e7424bd706bd86e55d84a4983abb4f798524d7',
  }),
  Object.freeze({
    logicalName: 'sol',
    path: `apps/game/smoke/slice-${SLICE.runId}-sol.png`,
    bytes: 226_662,
    sha256: '2109e2ef32097ef83377ec5818f3c147780aa65f82c2118e087330ea48e36657',
  }),
  Object.freeze({
    logicalName: 'solmark',
    path: `apps/game/smoke/slice-${SLICE.runId}-solmark.png`,
    bytes: 381_007,
    sha256: '0d8dd87f58f3fc0168ae86fa2e4836e4343cd8038c4f09a7aaeb21cca242abfd',
  }),
  Object.freeze({
    logicalName: 'universe',
    path: `apps/game/smoke/slice-${SLICE.runId}-universe.png`,
    bytes: 362_713,
    sha256: '50247ca7a3d63e39706946e3ec4c0609acdb503f66c3e5e9b21998b621cf5209',
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
  browser: Record<string, string>;
  expectedOutcomes: string[];
  outcomes: Array<{ id: string; profile: string; status: string }>;
  findings: string[];
  blockedOutcomes: string[];
  partialFailure: unknown;
  reviewPacket: Array<Record<string, unknown>>;
};

type SliceFinding = { index: number; scope: string; message: string };
type SliceReport = {
  schema: string;
  run: Record<string, string>;
  status: string;
  terminal: boolean;
  certifying: boolean;
  durationMs: number;
  browser: Record<string, unknown>;
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

const compendiumCarrier = loadCarrier(COMPENDIUM.file);
const sliceJsonCarrier = loadCarrier(SLICE.jsonFile);
const sliceLogCarrier = loadCarrier(SLICE.logFile);
const compendiumReport = JSON.parse(compendiumCarrier.raw.toString('utf8')) as CompendiumReport;
const sliceReport = JSON.parse(sliceJsonCarrier.raw.toString('utf8')) as SliceReport;
const sliceLog = sliceLogCarrier.raw.toString('utf8');

describe('exact-source 20d Compendium PASS and terminal Slice evidence replay', () => {
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

  it('binds the signed commit/tree/parent tuple and exact-source 78/78 Compendium PASS', () => {
    expect(SOURCE_GIT).toEqual({
      commit: '20d8598913e1009e03538085e59a8b63ac7a6655',
      tree: '14d49ce60f84ca47daf831975f28491a7c8302e1',
      parent: 'aa88d916e5141d6f2f8e8969288064ffba0cfc85',
    });
    expect(compendiumReport).toMatchObject({
      schema: 'cf-v2-compendium-memory-report/v1',
      runId: COMPENDIUM.runId,
      status: 'pass',
      durationMs: 63_431,
      lifecycle: { schema: 'cf-v2-compendium-report-lifecycle/v1', status: 'complete' },
      policy: { attemptCount: 1, automaticRetries: 0 },
      browser: {
        executable: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
        product: 'Edg/152.0.4191.53',
        revision: '@4ee8983fdce2559a0ae8f8376934c5ed353035cd',
        user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
          + 'AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/152.0.0.0 '
          + 'Safari/537.36 Edg/152.0.0.0',
        js_version: '15.2.23.6',
        protocol_version: '1.3',
      },
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
    expect(compendiumReport.reviewPacket).toEqual(COMPENDIUM_REVIEW_PACKET);
  });

  it('binds one terminal six-scope Slice red without retry or reinterpretation', () => {
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
      durationMs: 120_493,
      browser: {
        executable: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
        version: 'Microsoft Edge 152.0.4191.53',
        resolutionError: null,
      },
      sourceChange: { detected: false, ending: null },
      retryPolicy: { automaticRetries: 0 },
      exit: { code: 1, childCode: 1, signal: null, spawnError: null },
      summary: { findingCount: 6, scopeCount: 6 },
      failureEvidence: { declaredCount: 6, bulletCount: 6, diagnostics: [] },
    });
    expect(sliceReport.source).toEqual(SOURCE);
    expect(sliceReport.sourceEnd).toEqual(SOURCE);
    expect(sliceReport.findings.map(({ index }) => index)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(sliceReport.findings.map(({ scope }) => scope)).toEqual(SLICE_SCOPES);
    expect(sliceReport.findings.map(({ message }) => sha256(message))).toEqual(
      SLICE_MESSAGE_SHA256,
    );
    expect(sliceReport.findings.map(({ message }, index) =>
      message.startsWith(SLICE_MESSAGE_PREFIXES[index] ?? ''))).toEqual(
      [true, true, true, true, true, true],
    );
    expect(sliceReport.groups).toHaveLength(6);
    expect(sliceReport.groups.map(({ scope }) => scope)).toEqual(SLICE_SCOPES);
    expect(sliceReport.groups.map(({ primary }) => primary)).toEqual(
      sliceReport.findings.map(({ message }) => message),
    );
    expect(sliceReport.groups.every(({ related }) => related.length === 0)).toBe(true);
    expect(sliceReport.screenshots.map(({ logicalName, path, bytes, sha256 }) => ({
      logicalName,
      path,
      bytes,
      sha256,
    }))).toEqual(SLICE_SCREENSHOTS);
  });

  it('binds raw-log parity and denies Glass or Recovery successor authority', () => {
    expect(sliceReport.rawLog).toEqual({
      path: `apps/game/smoke/slice-smoke-${SLICE.runId}.log`,
      bytes: SLICE.logRawBytes,
      sha256: SLICE.logRawSha256,
    });
    expect(sliceReport.childOutput).toEqual({
      stdoutBytes: 2_995,
      stdoutSha256: '6f64ae3637a3ccd45983c3a426b2f6a30947a69d5888d06cfbda27b251318f02',
      stderrBytes: 968_687,
      stderrSha256: '25b8e784ddedb85f69a95f405a18812f256b1f90ce1f424b7b1fb70fa4f51f5d',
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
    expect(sliceLog).toContain('SLICE SMOKE: FAIL — 6 findings');
    expect(sliceLog).toContain('1. ARC 3 RESEARCH ACTION');
    expect(sliceLog).toContain('2. ARC 3 FIXED FABRICATION');
    expect(sliceLog).toContain('3. ARC 0 LANDING STORAGE REFUSAL');
    expect(sliceLog).toContain('4. ARC 0 LANDING STALE CONVERGENCE');
    expect(sliceLog).toContain('5. ARC 0 LANDING PUBLICATION CONVERGENCE');
    expect(sliceLog).toContain('6. harness');
    expect(sliceLog).not.toContain('SLICE SMOKE: PASS');
    expect(sliceLog).not.toContain('GLASS MATRIX: PASS');
    expect(sliceLog).not.toContain('RECOVERY: PASS');
    expect(Object.hasOwn(sliceReport, 'successEvidence')).toBe(false);
    expect(Object.hasOwn(sliceReport, 'glass')).toBe(false);
    expect(Object.hasOwn(sliceReport, 'recovery')).toBe(false);

    const successors = fs.readdirSync(auditsRoot).filter((name) =>
      name.includes('20D8598') && /(?:GLASS|RECOVERY)/u.test(name));
    expect(successors).toEqual([]);
  });
});
