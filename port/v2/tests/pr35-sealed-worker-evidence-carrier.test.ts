import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

/*
 * These literals belong to immutable historical evidence. This carrier imports
 * neither a live browser evaluator nor a live budget: later instrument or
 * product repairs must never relabel the exact 941ba45 PASS/red chronology.
 */
const SOURCE = Object.freeze({
  commit: '941ba45a96e5baabadc255d53db86fa935cefe81',
  branch: 'openai/mac',
  state: 'committed',
  statusSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  workingTreeSha256: 'f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a',
});

const COMPENDIUM = Object.freeze({
  file: 'ARC1C_COMPENDIUM_PR35_SEALED_WORKER_PASS_20260830_941BA45.json.gz',
  gzipBytes: 452_127,
  gzipSha256: 'e6f2aa4dfcbf94830f3c0059a8e64239956ac0d2e0685c8e267a338faba2f6f8',
  rawBytes: 10_881_302,
  rawSha256: 'd4b2b2aa07f3b1f4a70903d4d8ae82abe1eaf755523a51d7ecc85d1e610c109b',
  runId: '20260830-pr35-sealed-worker-941ba45a96e5-compendium-certification',
});

const SLICE = Object.freeze({
  jsonFile: 'ARC4_SLICE_PR35_GUIDE_INSTRUMENT_AND_NAMED_CF1_PRODUCT_FAILURE_20260830_941BA45.json.gz',
  jsonGzipBytes: 40_180,
  jsonGzipSha256: 'c7b314352c65e5dd24120eb5982a78e87a899f488a78e3c205156a2e134eedad',
  jsonRawBytes: 522_130,
  jsonRawSha256: '65917019eeb8c74d258b89ab793ad13db2fc2619da1f21d7b0b2b6550e44c07d',
  logFile: 'ARC4_SLICE_PR35_GUIDE_INSTRUMENT_AND_NAMED_CF1_PRODUCT_FAILURE_20260830_941BA45.log.gz',
  logGzipBytes: 19_473,
  logGzipSha256: 'd5321f9ea85d949f32f6b688ddbc11b8638ae6e776a97feb6502b7ca392416f9',
  logRawBytes: 253_140,
  logRawSha256: 'c54bd170a95eedf884bf591dd4c17241a1460cfcde7dc3a79cfa32bcdc56113c',
  runId: '20260830115041916-36220-7ed2dd2ef398',
});

const EXACT_BROWSER = Object.freeze({
  executable: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  product: 'Edg/152.0.4191.53',
  revision: '@4ee8983fdce2559a0ae8f8376934c5ed353035cd',
  user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0',
  js_version: '15.2.23.6',
  protocol_version: '1.3',
});

const EXACT_INPUTS = Object.freeze({
  fixtureSpec: 'c5792c2c8605765b95170e8d954a157e60c9abfa37500ec93c5e1f81722f69f3',
  fixtureRows: 'daefba685c3e70febd94781d5b140659f741a181edc32154be57e631af361706',
  fixtureGenerator: 'a1b294f0b8b5958910fd873f49d226f80447ad77381cccfd0acb21c82dc7aece',
  budget: 'd0c39b95f90a46fe38d65cc742ef91436a4e414c558659656250c9cf813b0e17',
  budgetSchema: '9601a25a6193bc19b2b7ab09ff68a819bdc0e87241c041d90f0bfb1d9d02620f',
  outcomeContract: '9fc43fe4d29453ec4b546a53a2e62bc874499c67bae9f0f0f4c33e8063c41828',
  collector: '0af0f5884c0eec67cea7c6696c20a2c691c669fa93ee255fd1c54d17b56d5010',
  browserCdp: '6da9e2efaaf7f91f9ad93c101368b847a7e77aeb015e83f7768fe11dd85147ce',
  browserPath: '733ab771f60bead83e8d2af4d95339248f7c9b16879903ea89b817677e4a6bc0',
  workspaceLock: 'e22a4c268ad0ce71a1c9160f45a2386c413c7fbcfc13f0cc457cf084ff0fd606',
  package: 'cf6298a7a72720952ab8bfe7a2fdcf0dde2c135e537e1ce5190303c6a06aa3a7',
  packageLock: 'a2dcb380866a57618ae345c2559c1483dd781833f1a258d604a8254b7acf6a9f',
  appPackage: '11dde72861c2a687f5d238a412946956f1ecb4a4bec7adafa6096c9dcc04329d',
  baselineSaveFixtures: 'a52bfbdc1c65a418eed07a1e7ba5ffd07b36caf5ce10e587c7d34a717deab2a7',
  speciesArtBuildGraph: 'e591551391f3ed31a494c94d7e1f659633daa460f0571b973bc81cd6888a9c66',
  outcomeInventory: 'bd4f8a9ef37538b09582c316837dae05b1bc682cf6cb5f6df0fee4a2621929b0',
});

const EXACT_PRODUCER_AUTHORITY = Object.freeze({
  schema: 'cf-v2-compendium-producer-authority/v2',
  sha256: '0889c46e9007273da5c0d5de875e611b147ad5ed8b4280730783131d315c5ddb',
  inputs: {
    index: {
      relativePath: 'index.html',
      sha256: '720060efe570bb9c6a802eaad8ea94751b6f38bd35059487e07c36e0afbbc180',
    },
    owner: {
      relativePath: 'assets/main-C1fiHxKc.js',
      sha256: '7b9bf1843eae0f914a43049bc618524314361a585c1b845cfcedf10e9c069319',
    },
    worker: {
      relativePath: 'assets/species-art.worker-DnnSDKMy.js',
      sha256: '25519cabdf0963bdc722b591855e7c7fdaaecbead63fdfa2d499bf35382f7172',
    },
    painter: {
      relativePath: 'assets/species-art.worker-DnnSDKMy.js',
      sha256: '25519cabdf0963bdc722b591855e7c7fdaaecbead63fdfa2d499bf35382f7172',
    },
    serviceWorker: {
      relativePath: 'service-worker.js',
      sha256: '7227773d0df1c688af2ff48eca58e4c0d9b65b8b7b6046eb3f45cc8da1262d8b',
    },
  },
});

const COMPENDIUM_REVIEW_PACKET = Object.freeze([
  {
    profile: 'phone', state: 'list',
    file: `apps/game/smoke/compendiummem-${COMPENDIUM.runId}-phone-list.png`,
    bytes: 718_126,
    sha256: '17311d46f4cbbf75c0d489cc80beccc52cb516fe32cb434279b84b0765e3ee26',
  },
  {
    profile: 'phone', state: 'focus-pinned',
    file: `apps/game/smoke/compendiummem-${COMPENDIUM.runId}-phone-focus-pinned.png`,
    bytes: 647_200,
    sha256: '8a737f97d67296572299d446f9a0417544da9a06ddaa35281ea04a11a3340978',
  },
  {
    profile: 'phone', state: 'detail',
    file: `apps/game/smoke/compendiummem-${COMPENDIUM.runId}-phone-detail.png`,
    bytes: 779_305,
    sha256: 'f945ccf1d81106067777688b44ec6e4782d5cdd689aa44dd7142329d72e7b693',
  },
  {
    profile: 'desktop', state: 'list',
    file: `apps/game/smoke/compendiummem-${COMPENDIUM.runId}-desktop-list.png`,
    bytes: 620_296,
    sha256: '6fed609a3205c009ab0ab4cbe287af7b2314d2db6b6423069644ae188dacf9c7',
  },
  {
    profile: 'desktop', state: 'focus-pinned',
    file: `apps/game/smoke/compendiummem-${COMPENDIUM.runId}-desktop-focus-pinned.png`,
    bytes: 609_176,
    sha256: '787d084512d4112dad77a3ddc091fe4d5c69cf5fe425818f2adf7ba02edd31b5',
  },
  {
    profile: 'desktop', state: 'detail',
    file: `apps/game/smoke/compendiummem-${COMPENDIUM.runId}-desktop-detail.png`,
    bytes: 614_132,
    sha256: 'ede79803e3d2873503a8ea833260327f9264d663c3473e9822649f55ac2781da',
  },
]);

const SLICE_SCREENSHOTS = Object.freeze([
  ['earth', 588_364, '4d3b4fbfcf32a4312d53a82d71938cc37426b42f2acaefba486fd2030ee56da0'],
  ['galaxy', 576_220, '804d9cc3025eb27963708a363875c498ee27a9ed472c07f906ebcfeb75434c8b'],
  ['guide', 294_892, 'c0eef136185627cc39448d4b872807d947e0bb3605c6c2b9ff7b7528e60bca5b'],
  ['settings', 290_540, '689bf3d685c91179d84e01d03cb53976f8d4f541be4cbf8fd60acbd330a6081a'],
  ['sol', 227_540, 'acfd55d7d4e88c886ec98c57e241da8f52f5fd556cad3d6ef7fcb6d9dd0992c5'],
  ['universe', 362_689, 'ca13afd64c08b4528f380124c01de0947d5ee6e408a59de492289fa6a6b136e2'],
].map(([logicalName, bytes, sha256]) => ({
  name: `slice-${SLICE.runId}-${logicalName}.png`,
  logicalName,
  path: `apps/game/smoke/slice-${SLICE.runId}-${logicalName}.png`,
  bytes,
  sha256,
})));

const HARNESS_TIMEOUT =
  'harness: valid CF1 keyboard focus handoff did not reach its browser outcome within 6000ms (last null)';

type SourceSignature = typeof SOURCE;
type CompendiumReport = {
  schema: string;
  runId: string;
  status: string;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  lifecycle: Record<string, string>;
  policy: Record<string, number>;
  source: { begin: SourceSignature; end: SourceSignature };
  inputs: Record<string, string>;
  browser: Record<string, string>;
  budget: Record<string, unknown>;
  expectedOutcomes: string[];
  outcomes: Array<{ id: string; profile: string; status: string }>;
  findings: string[];
  blockedOutcomes: string[];
  reviewPacket: Array<Record<string, unknown>>;
  partialFailure: unknown;
};

type SliceFinding = { index: number; scope: string; message: string };
type SliceGroup = { scope: string; primary: string; related: string[] };
type SliceReport = {
  schema: string;
  run: Record<string, string>;
  status: string;
  terminal: boolean;
  certifying: boolean;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  source: SourceSignature;
  sourceEnd: SourceSignature;
  sourceChange: { detected: boolean; ending: unknown };
  browser: Record<string, unknown>;
  retryPolicy: Record<string, unknown>;
  exit: Record<string, unknown>;
  summary: { findingCount: number; scopeCount: number };
  failureEvidence: Record<string, unknown>;
  findings: SliceFinding[];
  groups: SliceGroup[];
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

const compendiumCarrier = loadCarrier(COMPENDIUM.file);
const sliceJsonCarrier = loadCarrier(SLICE.jsonFile);
const sliceLogCarrier = loadCarrier(SLICE.logFile);
const compendiumReport = JSON.parse(compendiumCarrier.raw.toString('utf8')) as CompendiumReport;
const sliceReport = JSON.parse(sliceJsonCarrier.raw.toString('utf8')) as SliceReport;
const sliceLog = sliceLogCarrier.raw.toString('utf8');

describe('exact-source PR #35 sealed-worker PASS and terminal Slice composite red', () => {
  it('binds all three immutable gzip carriers and their raw payloads', () => {
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

  it('binds the Compendium PASS to the exact clean source, one attempt, Edge, and authorities', () => {
    expect(compendiumReport).toMatchObject({
      schema: 'cf-v2-compendium-memory-report/v1',
      runId: COMPENDIUM.runId,
      status: 'pass',
      startedAt: '2026-08-30T11:48:23.731Z',
      endedAt: '2026-08-30T11:49:29.462Z',
      durationMs: 65_731,
      lifecycle: { schema: 'cf-v2-compendium-report-lifecycle/v1', status: 'complete' },
      policy: {
        attemptCount: 1,
        automaticRetries: 0,
        commandTimeoutMs: 2_000,
        targetTimeoutMs: 2_000,
        heartbeatTimeoutMs: 2_000,
        transportTimeoutMs: 5_000,
      },
    });
    expect(compendiumReport.source).toEqual({ begin: SOURCE, end: SOURCE });
    expect(compendiumReport.browser).toEqual(EXACT_BROWSER);
    expect(compendiumReport.inputs).toEqual(EXACT_INPUTS);
    expect(compendiumReport.budget).toMatchObject({
      status: 'active',
      path: 'budgets/compendium-memory-v1.json',
      sha256: EXACT_INPUTS.budget,
      browserAuthority: {
        schema: 'cf-v2-compendium-browser-authority/v2',
        scope: 'arc1a-compendium-memory-only',
        family: 'microsoft-edge',
        protocolVersion: '1.3',
        capabilityContract: 'cf-v2-compendium-cdp-capabilities/v1',
        capabilityContractSha256: '35eb09daa39f211b8e9015f59b77a983b5870611322d673c47f7ff4f2b61e341',
      },
      browserAuthorityMatch: true,
      producerAuthority: EXACT_PRODUCER_AUTHORITY,
      observedProducerAuthority: EXACT_PRODUCER_AUTHORITY,
      producerAuthorityMatch: true,
    });
  });

  it('binds all 78 passing Compendium outcomes and the six review PNG receipts', () => {
    expect(compendiumReport.expectedOutcomes).toHaveLength(78);
    expect(new Set(compendiumReport.expectedOutcomes).size).toBe(78);
    expect(compendiumReport.expectedOutcomes.filter((id) => id.startsWith('phone/'))).toHaveLength(39);
    expect(compendiumReport.expectedOutcomes.filter((id) => id.startsWith('desktop/'))).toHaveLength(39);
    expect(sha256(JSON.stringify(compendiumReport.expectedOutcomes)))
      .toBe(EXACT_INPUTS.outcomeInventory);
    expect(compendiumReport.outcomes).toHaveLength(78);
    expect(new Set(compendiumReport.outcomes.map(({ id }) => id)).size).toBe(78);
    expect(compendiumReport.outcomes.map(({ id }) => id)).toEqual(compendiumReport.expectedOutcomes);
    expect(compendiumReport.outcomes.every(({ status }) => status === 'pass')).toBe(true);
    expect(compendiumReport.outcomes.filter(({ profile }) => profile === 'phone')).toHaveLength(39);
    expect(compendiumReport.outcomes.filter(({ profile }) => profile === 'desktop')).toHaveLength(39);
    expect(compendiumReport.findings).toEqual([]);
    expect(compendiumReport.blockedOutcomes).toEqual([]);
    expect(compendiumReport.partialFailure).toBeNull();
    expect(compendiumReport.reviewPacket).toEqual(COMPENDIUM_REVIEW_PACKET);
  });

  it('binds the subsequent Slice red to the same clean source and once/no-retry Edge run', () => {
    expect(sliceReport).toMatchObject({
      schema: 'cf-v2-slice-smoke-ci/v1',
      run: {
        id: SLICE.runId,
        artifactPath: `apps/game/smoke/slice-smoke-${SLICE.runId}.json`,
        screenshotPattern: `apps/game/smoke/slice-${SLICE.runId}-*.png`,
        provenance: 'Only artifacts bearing this cryptographically unique child-run ID are attributed to this execution.',
      },
      status: 'fail',
      terminal: true,
      certifying: false,
      startedAt: '2026-08-30T11:50:41.916Z',
      endedAt: '2026-08-30T11:51:45.022Z',
      durationMs: 63_106,
      sourceChange: { detected: false, ending: null },
      browser: {
        executable: EXACT_BROWSER.executable,
        version: 'Microsoft Edge 152.0.4191.53',
        resolutionError: null,
      },
      retryPolicy: {
        automaticRetries: 0,
        reason: 'A red run remains red; diagnose the first scoped outcome rather than retrying it away.',
      },
      exit: { code: 1, childCode: 1, signal: null, spawnError: null },
    });
    expect(sliceReport.source).toEqual(SOURCE);
    expect(sliceReport.sourceEnd).toEqual(SOURCE);
    expect(Date.parse(sliceReport.startedAt)).toBeGreaterThan(Date.parse(compendiumReport.endedAt));
  });

  it('seals 62 Guide-family findings plus the independent CF1 harness timeout across 42 scopes', () => {
    expect(sliceReport.summary).toEqual({ findingCount: 63, scopeCount: 42 });
    expect(sliceReport.failureEvidence).toEqual({
      declaredCount: 63,
      bulletCount: 63,
      diagnostics: [],
    });
    expect(sliceReport.findings).toHaveLength(63);
    expect(sliceReport.findings.map(({ index }) => index)).toEqual(
      Array.from({ length: 63 }, (_, index) => index),
    );

    const guideFamily = sliceReport.findings.slice(0, 62);
    const harness = sliceReport.findings.slice(62);
    expect(guideFamily).toHaveLength(62);
    expect(guideFamily.every(({ scope, message }) =>
      scope !== 'harness' && message.startsWith('GUIDE'))).toBe(true);
    expect(harness).toEqual([{ index: 62, scope: 'harness', message: HARNESS_TIMEOUT }]);

    expect(sliceReport.groups).toHaveLength(42);
    expect(new Set(sliceReport.groups.map(({ scope }) => scope)).size).toBe(42);
    expect(new Set(sliceReport.findings.map(({ scope }) => scope))).toEqual(
      new Set(sliceReport.groups.map(({ scope }) => scope)),
    );
    expect(sliceReport.groups.at(-1)).toEqual({
      scope: 'harness',
      primary: HARNESS_TIMEOUT,
      related: [],
    });
  });

  it('binds six Slice screenshots, the exact raw log, and no successor evidence in Slice artifacts', () => {
    expect(sliceReport.screenshots).toEqual(SLICE_SCREENSHOTS);
    expect(sliceReport.rawLog).toEqual({
      path: `apps/game/smoke/slice-smoke-${SLICE.runId}.log`,
      bytes: SLICE.logRawBytes,
      sha256: SLICE.logRawSha256,
    });
    expect(sliceReport.childOutput).toEqual({
      stdoutBytes: 2_995,
      stdoutSha256: '615e7c64d54fc68783a2f69ac0204ad4ff7a64159ee98ab68de1cd9a0c0dfbf9',
      stderrBytes: 249_964,
      stderrSha256: '6419462c7a06d7f01aa67e5adf0bb10071c08cee52f793fac4c7f745194809b4',
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
    expect(sliceLog).toContain('SLICE SMOKE: FAIL — 63 findings');
    expect(sliceLog).toContain(`  - ${HARNESS_TIMEOUT}`);
    expect(sliceLog).not.toContain('GLASS MATRIX: PASS');
    expect(sliceLog).not.toContain('RECOVERY: PASS');
    expect(Object.hasOwn(sliceReport, 'successEvidence')).toBe(false);
    expect(Object.hasOwn(sliceReport, 'glass')).toBe(false);
    expect(Object.hasOwn(sliceReport, 'recovery')).toBe(false);
  });
});
