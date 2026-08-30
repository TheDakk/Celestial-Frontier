import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

/*
 * Historical evidence deliberately owns its authority literals here. Importing
 * the live Compendium contract or budget would let a later repair relabel this
 * exact-source instrument stop instead of preserving what the run observed.
 */
const EVIDENCE = Object.freeze({
  file: 'ARC1C_COMPENDIUM_PR35_PLANETSIDE_SETTLEMENT_INSTRUMENT_FAILURE_20260830_3FB958F.json.gz',
  gzipBytes: 32_830,
  gzipSha256: 'ecb786c00f7261ce3306c73d512133ce3e2e74035cf83172e3fe8c735442a0dd',
  rawBytes: 512_184,
  rawSha256: 'bf18cff6d43fcf5d6bf1c128471630a338cefb34a4a04762a5d25699f80ce5e5',
  runId: '20260830-pr35-quiescent-3fb958f-compendium-certification',
  sourceCommit: '3fb958f859ff0ea28b4e8bb720adaea98ad3c001',
  sourceWorkingTreeSha256:
    'f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a',
  budgetSha256: 'c941bb1000e0056f661cf3994855a286d6667b3d5b80f5c770aab4d9e0543ef3',
  measurementAuthoritySha256:
    'dacf6ab03b35f65ebd76b3a28a0c2ef2868ea505740f2cbe614d399cef1dbe7a',
  outcomeContractSha256:
    'a2de8a5830a99678c487c9200519dd560bcf2497c1791e4d5dd6a5dd4b77e092',
  collectorSha256: '888b9dfdee9d973d17e1901eb26abf1a49015e6f21f0647f8d3043c3e052c964',
  producerAuthoritySha256:
    '0de7dc1a95ceeb35738d4cb17e7ccd464aab947848a9fe643e7c69355836bf13',
  browserCapabilitySha256:
    '6eed33ed9784f7c7774c4b1bf8d4e880986e31667324d9a1aa7b8dd62fe5a476',
});

const MEASUREMENT_INPUT_KEYS = Object.freeze([
  'fixtureSpec', 'fixtureRows', 'fixtureGenerator',
  'budgetSchema', 'outcomeContract', 'collector',
  'browserCdp', 'browserPath', 'workspaceLock',
  'package', 'packageLock', 'appPackage', 'baselineSaveFixtures',
  'speciesArtBuildGraph', 'outcomeInventory',
] as const);

const EXACT_INPUTS = Object.freeze({
  fixtureSpec: 'c5792c2c8605765b95170e8d954a157e60c9abfa37500ec93c5e1f81722f69f3',
  fixtureRows: 'daefba685c3e70febd94781d5b140659f741a181edc32154be57e631af361706',
  fixtureGenerator: 'a1b294f0b8b5958910fd873f49d226f80447ad77381cccfd0acb21c82dc7aece',
  budget: EVIDENCE.budgetSha256,
  budgetSchema: 'e8671d06e4533f565b695de416626cba0f509eb73e60aa0e3814bf5e53ce65e8',
  outcomeContract: EVIDENCE.outcomeContractSha256,
  collector: EVIDENCE.collectorSha256,
  browserCdp: '6da9e2efaaf7f91f9ad93c101368b847a7e77aeb015e83f7768fe11dd85147ce',
  browserPath: '733ab771f60bead83e8d2af4d95339248f7c9b16879903ea89b817677e4a6bc0',
  workspaceLock: 'e22a4c268ad0ce71a1c9160f45a2386c413c7fbcfc13f0cc457cf084ff0fd606',
  package: '87551923ad5af540270ecbbeef73b97bcf90d82ae66867e59a844f1815a98106',
  packageLock: 'ce2e1138aa77e214021a7b6104db4487fe79ec140bace17f44f47e88abb1d06f',
  appPackage: '11dde72861c2a687f5d238a412946956f1ecb4a4bec7adafa6096c9dcc04329d',
  baselineSaveFixtures:
    'a52bfbdc1c65a418eed07a1e7ba5ffd07b36caf5ce10e587c7d34a717deab2a7',
  speciesArtBuildGraph:
    '1e79e0b0adf302db88cac95f1cc9e8a5ad500dd6da0d5d104d1f5fb9957f3a91',
  outcomeInventory: 'bd4f8a9ef37538b09582c316837dae05b1bc682cf6cb5f6df0fee4a2621929b0',
});

const EXACT_BROWSER = Object.freeze({
  executable: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  product: 'Edg/152.0.4191.53',
  revision: '@4ee8983fdce2559a0ae8f8376934c5ed353035cd',
  user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/152.0.0.0 Safari/537.36 Edg/152.0.0.0',
  js_version: '15.2.23.6',
  protocol_version: '1.3',
});

const EXACT_BROWSER_AUTHORITY = Object.freeze({
  schema: 'cf-v2-compendium-browser-authority/v2',
  scope: 'arc1a-compendium-memory-only',
  family: 'microsoft-edge',
  protocolVersion: '1.3',
  capabilityContract: 'cf-v2-compendium-cdp-capabilities/v1',
  capabilityContractSha256: EVIDENCE.browserCapabilitySha256,
});

const EXACT_PRODUCER_AUTHORITY = Object.freeze({
  schema: 'cf-v2-compendium-producer-authority/v1',
  sha256: EVIDENCE.producerAuthoritySha256,
  inputs: {
    index: {
      relativePath: 'index.html',
      sha256: '184b73ee41aa91fd13ba681ca07caad99820621675a7db736084a4c7a24d0b9d',
    },
    owner: {
      relativePath: 'assets/main-CLGcJIQS.js',
      sha256: 'dd407ec15819851084d4df1aa36e6bc8f5c23650cd9d68c82ee756e564b90fda',
    },
    worker: {
      relativePath: 'assets/species-art.worker-szNwNYEk.js',
      sha256: 'cebbbb892d71828eef1b5d90e2c601f0f197ba01d080ceb9050ee1f252848cdf',
    },
    painter: {
      relativePath: 'assets/speciespainter-EmdmLeiA.js',
      sha256: '570cb72699a577bda85502be46b54bcbdec9ffa41df5702bd5cb865f4bf08eba',
    },
  },
});

type CommandLedgerEntry = {
  schema: string;
  profile: string;
  label: string;
  issuedAtMs: number;
  phaseDeadlineMs: number;
  commandDeadlineMs: number;
  timeoutMs: number;
  target: Record<string, unknown> & {
    method: string;
    status: string;
    completedAtMs: number;
    durationMs: number;
    timely: boolean;
    resultState: string;
  };
  heartbeat: {
    method: string;
    status: string;
    completedAtMs: number;
    durationMs: number;
    timely: boolean;
    product: string;
  };
};

type HistoricalReport = {
  schema: string;
  runId: string;
  status: string;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  lifecycle: { schema: string; status: string };
  policy: Record<string, number>;
  source: { begin: Record<string, string>; end: Record<string, string> };
  inputs: Record<string, string>;
  browser: Record<string, string>;
  budget: {
    status: string;
    path: string;
    sha256: string;
    browserAuthority: Record<string, string>;
    browserAuthorityMatch: boolean;
    producerAuthority: Record<string, unknown>;
    observedProducerAuthority: Record<string, unknown>;
    producerAuthorityMatch: boolean;
  };
  expectedOutcomes: string[];
  outcomes: unknown[];
  findings: string[];
  blockedOutcomes: string[];
  profiles: Record<string, {
    schema: string;
    profile: string;
    viewport: Record<string, number | boolean>;
    evidenceStatus: string;
    lastCompletedStage: string;
    failingStage: string;
    completedStages: string[];
    commandLedger: CommandLedgerEntry[];
    producerErrorWitness: unknown;
    filterTransitions: unknown[];
    reviewPacket: unknown[];
  }>;
  reviewPacket: unknown[];
  partialFailure: {
    schema: string;
    classification: string;
    profile: string;
    lastCompletedStage: string;
    failingStage: string;
    command: unknown;
  };
};

const here = path.dirname(fileURLToPath(import.meta.url));
const carrierPath = path.resolve(here, '..', '..', '..', 'audits', EVIDENCE.file);
const compressed = fs.readFileSync(carrierPath);
const raw = gunzipSync(compressed);
const report = JSON.parse(raw.toString('utf8')) as HistoricalReport;

function sha256(value: Buffer | string): string {
  return createHash('sha256').update(value).digest('hex');
}

describe('historical PR #35 Compendium Planetside settlement instrument stop', () => {
  it('binds the exact immutable compressed and raw carrier bytes', () => {
    expect(compressed.byteLength).toBe(EVIDENCE.gzipBytes);
    expect(sha256(compressed)).toBe(EVIDENCE.gzipSha256);
    expect(raw.byteLength).toBe(EVIDENCE.rawBytes);
    expect(sha256(raw)).toBe(EVIDENCE.rawSha256);
  });

  it('binds the exact source, run policy, browser, and then-current authorities', () => {
    expect(report).toMatchObject({
      schema: 'cf-v2-compendium-memory-report/v1',
      runId: EVIDENCE.runId,
      status: 'instrument-fail',
      startedAt: '2026-08-30T04:51:50.330Z',
      endedAt: '2026-08-30T04:52:23.276Z',
      durationMs: 32_946,
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
    const exactSource = {
      commit: EVIDENCE.sourceCommit,
      branch: 'openai/mac',
      state: 'committed',
      statusSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      workingTreeSha256: EVIDENCE.sourceWorkingTreeSha256,
    };
    expect(report.source.begin).toEqual(exactSource);
    expect(report.source.end).toEqual(exactSource);

    expect(report.inputs).toEqual(EXACT_INPUTS);
    const measurementInputs = Object.fromEntries(MEASUREMENT_INPUT_KEYS.map((key) =>
      [key, report.inputs[key]],
    ));
    expect(sha256(JSON.stringify(measurementInputs)))
      .toBe(EVIDENCE.measurementAuthoritySha256);
    expect(report.inputs.collector).toBe(EVIDENCE.collectorSha256);
    expect(report.inputs.outcomeContract).toBe(EVIDENCE.outcomeContractSha256);

    expect(report.browser).toEqual(EXACT_BROWSER);
    expect(report.browser.product).toMatch(/^Edg\/\d+\.\d+\.\d+\.\d+$/);
    expect(report.browser.protocol_version).toBe(EXACT_BROWSER_AUTHORITY.protocolVersion);
    expect(report.budget).toEqual({
      status: 'active',
      path: 'budgets/compendium-memory-v1.json',
      sha256: EVIDENCE.budgetSha256,
      browserAuthority: EXACT_BROWSER_AUTHORITY,
      browserAuthorityMatch: true,
      producerAuthority: EXACT_PRODUCER_AUTHORITY,
      observedProducerAuthority: EXACT_PRODUCER_AUTHORITY,
      producerAuthorityMatch: true,
    });
  });

  it('preserves 78 blocked outcomes and the terminal null-blind settlement diagnosis', () => {
    expect(report.expectedOutcomes).toHaveLength(78);
    expect(new Set(report.expectedOutcomes).size).toBe(78);
    expect(report.expectedOutcomes.filter((id) => id.startsWith('phone/'))).toHaveLength(39);
    expect(report.expectedOutcomes.filter((id) => id.startsWith('desktop/'))).toHaveLength(39);
    expect(sha256(JSON.stringify(report.expectedOutcomes))).toBe(EXACT_INPUTS.outcomeInventory);
    expect(report.blockedOutcomes).toEqual(report.expectedOutcomes);
    expect(report.blockedOutcomes).toHaveLength(78);
    expect(report.outcomes).toEqual([]);
    expect(report.reviewPacket).toEqual([]);

    expect(Object.keys(report.profiles)).toEqual(['phone']);
    const phone = report.profiles.phone!;
    expect(phone).toMatchObject({
      schema: 'cf-v2-compendium-partial-profile/v5',
      profile: 'phone',
      viewport: { width: 390, height: 844, dpr: 3, mobile: true },
      evidenceStatus: 'partial-non-certifying',
      lastCompletedStage: 'veteran Earth boot readiness',
      failingStage: 'Planetside thumb settlement',
      producerErrorWitness: null,
      filterTransitions: [],
      reviewPacket: [],
    });
    expect(report.profiles.desktop).toBeUndefined();
    expect(phone.commandLedger).toHaveLength(585);

    const settlement = phone.commandLedger.filter((entry) =>
      entry.label === 'Planetside thumb settlement');
    expect(settlement).toHaveLength(577);
    expect(settlement.every((entry) =>
      entry.schema === 'cf-v2-compendium-candidate-command/v1'
      && entry.profile === 'phone'
      && entry.target.method === 'Runtime.evaluate'
      && entry.target.status === 'fulfilled'
      && entry.target.timely === true
      && entry.target.resultState === 'value'
      && entry.target.completedAtMs < entry.commandDeadlineMs
      && entry.target.completedAtMs < entry.phaseDeadlineMs)).toBe(true);
    expect(settlement.every((entry) =>
      entry.heartbeat.method === 'Browser.getVersion'
      && entry.heartbeat.status === 'fulfilled'
      && entry.heartbeat.timely === true
      && entry.heartbeat.product === EXACT_BROWSER.product
      && entry.heartbeat.durationMs < report.policy.heartbeatTimeoutMs!
      && entry.heartbeat.completedAtMs < entry.phaseDeadlineMs)).toBe(true);

    expect(report.partialFailure).toEqual({
      schema: 'cf-v2-compendium-partial-failure/v1',
      classification: 'instrument',
      profile: 'phone',
      lastCompletedStage: 'veteran Earth boot readiness',
      failingStage: 'Planetside thumb settlement',
      command: null,
    });
    expect(report.findings).toEqual([
      'instrument: phone Planetside thumb settlement: phase timed out after on-time falsy observations (null)',
    ]);

    const retainedTargetKeys = [
      'completedAtMs', 'durationMs', 'method', 'resultState', 'status', 'timely',
    ];
    expect(settlement.every((entry) =>
      JSON.stringify(Object.keys(entry.target).sort()) === JSON.stringify(retainedTargetKeys)
      && !Object.hasOwn(entry.target, 'value')
      && !Object.hasOwn(entry.target, 'observation'))).toBe(true);
    expect(Object.hasOwn(phone, 'lastObservation')).toBe(false);
    expect(Object.hasOwn(phone, 'settlementObservation')).toBe(false);
  });
});
