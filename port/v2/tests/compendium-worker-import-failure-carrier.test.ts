import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

/*
 * Historical evidence deliberately owns every literal below. Importing the
 * live Compendium budget or contract could let a later repair reinterpret this
 * exact-source instrument stop instead of replaying what the run observed.
 */
const EVIDENCE = Object.freeze({
  file: 'ARC1C_COMPENDIUM_PR35_WORKER_IMPORT_INSTRUMENT_FAILURE_20260830_830E601.json.gz',
  gzipBytes: 7_357,
  gzipSha256: '90d61baeee297041a2afc7bf776fb504c5ac803140cf0613785859714c5f2aa9',
  rawBytes: 54_172,
  rawSha256: 'ef3cec79cf181323705d8a9eff82d9bb8023275590a23a0589515248e626d6b5',
  runId: '20260830-pr35-visualkey-v2-830e601b8f16-compendium-certification',
  sourceCommit: '830e601b8f16092d6f9193ecde329cfefd279bcd',
  sourceWorkingTreeSha256:
    'f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a',
  capabilityAuthoritySha256:
    '35eb09daa39f211b8e9015f59b77a983b5870611322d673c47f7ff4f2b61e341',
  measurementAuthoritySha256:
    '87d6782ad7d4ceaed3222eef8d2740dfe964db6d02b628fa2c3e125eaea6d06d',
  outcomeContractSha256:
    'abedc70f6ffcd3130445f4a5e1681ba7a2607210fbb9e6f3522ac8a7ab752138',
  collectorSha256: 'b75f426541982bc431c01f127c3410a1030ef0fd51f849e1833d492313025f4e',
  budgetSha256: '7efe9fa86075e33518020d41e7cc48bf9b2bc75ecb7ed9c0e074bd84c4d74200',
  producerAuthoritySha256:
    '0de7dc1a95ceeb35738d4cb17e7ccd464aab947848a9fe643e7c69355836bf13',
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

type SettlementImage = {
  index: number;
  logicalId: string;
  visualKeyLength: number;
  leasedIndex: number;
  cachedIndex: number | null;
  thumbState: string;
  srcPresent: boolean;
  complete: boolean;
  naturalWidth: number;
  naturalHeight: number;
};

type SettlementObservation = {
  schema: string;
  surface: string;
  expectedCount: number | null;
  receiptToken: string;
  ready: boolean;
  reasons: string[];
  ownership: {
    selector: string;
    rawImageCount: number;
    rawLogicalIds: string[];
    diagnosticImageCount: number;
    diagnosticLogicalIds: string[];
  };
  diagnostic: { panelMode: string; filteredCount: number; visible: boolean; thumbStates: string[] };
  images: SettlementImage[];
  art: Record<string, unknown>;
  lazyArt: {
    available: boolean;
    schema: string;
    state: string;
    importStarts: number;
    identity: Record<string, unknown>;
    lastEvent: Record<string, unknown>;
    phases: Record<string, number>;
    results: Record<string, number>;
    errors: Record<string, number>;
  };
  worker: Record<string, unknown>;
  broker: Record<string, unknown>;
  page: {
    targetId: string;
    sessionId: string;
    documentToken: string;
    visibilityState: string;
    hidden: boolean;
    focused: boolean;
  };
};

type HistoricalReport = {
  schema: string;
  runId: string;
  status: string;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  lifecycle: Record<string, string>;
  policy: Record<string, number>;
  source: { begin: Record<string, string>; end: Record<string, string> };
  inputs: Record<string, string>;
  browser: Record<string, string>;
  budget: Record<string, unknown>;
  expectedOutcomes: string[];
  outcomes: unknown[];
  findings: string[];
  blockedOutcomes: string[];
  reviewPacket: unknown[];
  profiles: Record<string, {
    schema: string;
    profile: string;
    viewport: Record<string, number | boolean>;
    evidenceStatus: string;
    lastCompletedStage: string;
    failingStage: string;
    commandLedger: Array<Record<string, unknown>>;
    thumbnailSettlementHistory: unknown[];
    thumbnailSettlements: unknown[];
    activeThumbnailSettlement: {
      schema: string;
      label: string;
      attempt: number;
      expected: Record<string, unknown>;
      lastObservation: SettlementObservation;
      lastDecision: Record<string, unknown>;
      lastCommand: Record<string, unknown>;
      timing: Record<string, number>;
    };
    producerErrorWitness: unknown;
    filterTransitions: unknown[];
    reviewPacket: unknown[];
    pageAuthorities: Record<string, Record<string, string>>;
  }>;
  partialFailure: {
    schema: string;
    classification: string;
    profile: string;
    lastCompletedStage: string;
    failingStage: string;
    command: unknown;
    diagnosis: string;
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

const findingPrefix =
  'instrument: phone veteran-earth-planetside thumb settlement: phase timed out after on-time falsy observations (';

function terminalObservation(): SettlementObservation {
  const finding = report.findings[0] ?? '';
  if (!finding.startsWith(findingPrefix) || !finding.endsWith(')')) {
    throw new Error('historical finding does not contain the exact structured terminal observation');
  }
  return JSON.parse(finding.slice(findingPrefix.length, -1)) as SettlementObservation;
}

describe('exact-source PR #35 Compendium worker-import instrument stop', () => {
  it('binds the immutable compressed and raw carrier bytes', () => {
    expect(compressed.byteLength).toBe(EVIDENCE.gzipBytes);
    expect(sha256(compressed)).toBe(EVIDENCE.gzipSha256);
    expect(raw.byteLength).toBe(EVIDENCE.rawBytes);
    expect(sha256(raw)).toBe(EVIDENCE.rawSha256);
  });

  it('binds exact source, one-attempt lifecycle, browser, and historical authorities', () => {
    expect(report).toMatchObject({
      schema: 'cf-v2-compendium-memory-report/v1',
      runId: EVIDENCE.runId,
      status: 'instrument-fail',
      startedAt: '2026-08-30T08:14:50.937Z',
      endedAt: '2026-08-30T08:15:24.154Z',
      durationMs: 33_217,
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
    expect(report.browser).toEqual(EXACT_BROWSER);
    expect(report.budget).toEqual({
      status: 'active',
      path: 'budgets/compendium-memory-v1.json',
      sha256: EVIDENCE.budgetSha256,
      browserAuthority: {
        schema: 'cf-v2-compendium-browser-authority/v2',
        scope: 'arc1a-compendium-memory-only',
        family: 'microsoft-edge',
        protocolVersion: '1.3',
        capabilityContract: 'cf-v2-compendium-cdp-capabilities/v1',
        capabilityContractSha256: EVIDENCE.capabilityAuthoritySha256,
      },
      browserAuthorityMatch: true,
      producerAuthority: EXACT_PRODUCER_AUTHORITY,
      observedProducerAuthority: EXACT_PRODUCER_AUTHORITY,
      producerAuthorityMatch: true,
    });
  });

  it('retains zero outcomes, all 78 blocked, and no desktop or successor evidence', () => {
    expect(report.expectedOutcomes).toHaveLength(78);
    expect(new Set(report.expectedOutcomes).size).toBe(78);
    expect(report.expectedOutcomes.filter((id) => id.startsWith('phone/'))).toHaveLength(39);
    expect(report.expectedOutcomes.filter((id) => id.startsWith('desktop/'))).toHaveLength(39);
    expect(sha256(JSON.stringify(report.expectedOutcomes))).toBe(EXACT_INPUTS.outcomeInventory);
    expect(report.outcomes).toEqual([]);
    expect(report.blockedOutcomes).toEqual(report.expectedOutcomes);
    expect(report.reviewPacket).toEqual([]);
    expect(Object.keys(report.profiles)).toEqual(['phone']);
    expect(report.profiles.desktop).toBeUndefined();

    const phone = report.profiles.phone!;
    expect(phone).toMatchObject({
      schema: 'cf-v2-compendium-partial-profile/v6',
      profile: 'phone',
      viewport: { width: 390, height: 844, dpr: 3, mobile: true },
      evidenceStatus: 'partial-non-certifying',
      lastCompletedStage: 'veteran Earth foreground cleanup',
      failingStage: 'veteran-earth-planetside thumb settlement',
      producerErrorWitness: null,
      filterTransitions: [],
      reviewPacket: [],
      thumbnailSettlementHistory: [],
      thumbnailSettlements: [],
    });
    expect(phone.commandLedger).toHaveLength(13);
    expect(report.partialFailure).toMatchObject({
      schema: 'cf-v2-compendium-partial-failure/v1',
      classification: 'instrument',
      profile: 'phone',
      lastCompletedStage: 'veteran Earth foreground cleanup',
      failingStage: 'veteran-earth-planetside thumb settlement',
      command: null,
    });
    expect(report.findings).toHaveLength(1);
    expect(report.partialFailure.diagnosis).toBe(report.findings[0]!.slice('instrument: '.length));
  });

  it('binds eight leased long keys and the terminal worker-import failure', () => {
    const phone = report.profiles.phone!;
    const active = phone.activeThumbnailSettlement;
    const observation = active.lastObservation;
    expect(terminalObservation()).toEqual(observation);
    expect(active).toMatchObject({
      schema: 'cf-v2-compendium-thumb-settlement-active/v1',
      label: 'veteran-earth-planetside',
      attempt: 1,
      expected: {
        surface: 'planetside',
        expectedCount: null,
        receiptToken: 'phone-compendium-thumb-veteran-earth-planetside-1',
      },
      lastDecision: {
        status: 'pending',
        reasons: expect.arrayContaining([
          'raw visual keys absent from broker cache inventory',
          'lazy-art state "error"',
        ]),
      },
      lastCommand: {
        schema: 'cf-v2-compendium-candidate-command/v1',
        profile: 'phone',
        label: 'veteran-earth-planetside thumb settlement',
        target: { method: 'Runtime.evaluate', status: 'fulfilled', timely: true, resultState: 'value' },
        heartbeat: {
          method: 'Browser.getVersion',
          status: 'fulfilled',
          timely: true,
          product: EXACT_BROWSER.product,
        },
      },
    });
    expect(observation).toMatchObject({
      schema: 'cf-v2-compendium-thumb-settlement-observation/v2',
      surface: 'planetside',
      expectedCount: null,
      receiptToken: 'phone-compendium-thumb-veteran-earth-planetside-1',
      ready: false,
      ownership: {
        selector: '#planetside [data-sel="planetside-sp"] img',
        rawImageCount: 8,
        diagnosticImageCount: 8,
      },
      diagnostic: {
        panelMode: 'closed',
        filteredCount: 3,
        visible: true,
        thumbStates: Array(8).fill('error'),
      },
      art: { available: true, queuedJobs: 0, activeJobs: 0 },
      lazyArt: {
        available: true,
        state: 'error',
        importStarts: 1,
        phases: {
          importStarts: 1,
          importCompletes: 0,
          thumbJobStarts: 0,
          thumbRenderCompletes: 0,
          thumbEncodeStarts: 0,
          thumbEncodeCompletes: 0,
        },
        results: { count: 0 },
        errors: { capability: 0, protocol: 0, import: 1, paint: 0, encode: 0 },
        lastEvent: { producerEpoch: 1, workerInstanceId: 1, jobId: 1, kind: 'thumb132', event: 'error:import' },
      },
      worker: {
        available: true,
        live: false,
        starts: 1,
        ready: 1,
        disposals: 1,
        fatals: 1,
        protocolErrors: 0,
      },
      broker: {
        available: true,
        cacheEntries: 0,
        leases: 8,
        subscribers: 0,
        queuedJobs: 0,
        activeJobs: 0,
        leasedKeyCount: 8,
        cachedKeyCount: 0,
        leasedDistinctKeyCount: 8,
        cachedDistinctKeyCount: 0,
      },
      page: { visibilityState: 'visible', hidden: false, focused: true },
    });

    expect(observation.images).toHaveLength(8);
    expect(observation.images.map((image) => image.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(observation.images.map((image) => image.visualKeyLength))
      .toEqual([768, 773, 767, 766, 770, 779, 766, 776]);
    expect(observation.images.map((image) => image.leasedIndex))
      .toEqual([5, 2, 1, 6, 7, 0, 4, 3]);
    expect([...observation.images.map((image) => image.leasedIndex)].sort((a, b) => a - b))
      .toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(observation.images.every((image) =>
      image.cachedIndex === null
      && image.thumbState === 'error'
      && image.srcPresent === false
      && image.complete === true
      && image.naturalWidth === 0
      && image.naturalHeight === 0)).toBe(true);
    expect(new Set(observation.images.map((image) => image.logicalId)).size).toBe(8);
    expect(observation.ownership.rawLogicalIds)
      .toEqual(observation.images.map((image) => image.logicalId));
    expect(observation.ownership.diagnosticLogicalIds)
      .toEqual(observation.images.map((image) => image.logicalId));
    expect(phone.pageAuthorities.main).toEqual({
      targetId: observation.page.targetId,
      sessionId: observation.page.sessionId,
      documentToken: observation.page.documentToken,
    });
    expect(phone.pageAuthorities.lazy).not.toEqual(phone.pageAuthorities.main);
  });
});
