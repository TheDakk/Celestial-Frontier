import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

/*
 * Historical evidence owns every literal in this replay. It intentionally
 * imports neither the live Compendium budget nor its evaluator: future repair
 * code must not be able to relabel this exact-source product stop.
 */
const EVIDENCE = Object.freeze({
  file: 'ARC1C_COMPENDIUM_PR35_EXECUTION_LATE_PAINTER_IMPORT_PRODUCT_FAILURE_20260830_DC6004C.json.gz',
  gzipBytes: 6_127,
  gzipSha256: '2e65494085d46cf4b68b62d3df58884b22b9d5a5c9ad1378c018a73c036f6b53',
  rawBytes: 38_665,
  rawSha256: 'c48e48a5385799bdf4535bf97b7bacf545b24182998978067b68c9bb08f27a38',
  runId: '20260830-pr35-execution-late-dc6004cf4426-compendium-certification',
  sourceCommit: 'dc6004cf4426df72bea141ac77b0be927f36886c',
  sourceWorkingTreeSha256:
    'f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a',
  capabilityAuthoritySha256:
    '35eb09daa39f211b8e9015f59b77a983b5870611322d673c47f7ff4f2b61e341',
  measurementAuthoritySha256:
    'fc54f822dc7f93481fbb1402b7c7940bc9a618b836112fd5514e8130de9f29ed',
  outcomeContractSha256:
    'f756bc7557613dd6c61ecb35acd9de752d54a7d0e51a52e192f361dca3f4ab29',
  collectorSha256: '2a74e941abbe701ca5c1d3952a7451ccd11ce3284d794f9e22aa0a79c0315237',
  budgetSha256: '1e2b751f66be8902d9e09a90f2e2510c518d69b2c5309ac40b7965263c6210af',
  producerAuthoritySha256:
    '06ddfc4853c2f20e95f5433485a852e2cd72afe5a10d128cf1486313d924aabf',
  errorMessage:
    'Failed to fetch dynamically imported module: http://127.0.0.1:61368/assets/speciespainter-DJWZf0vw.js',
  errorMessageSha256:
    '90440d44f6d316cd1f3cfc45d816162f1267eef27eddcddcb413e5cd854e2a08',
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
  budgetSchema: '9601a25a6193bc19b2b7ab09ff68a819bdc0e87241c041d90f0bfb1d9d02620f',
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
  schema: 'cf-v2-compendium-producer-authority/v2',
  sha256: EVIDENCE.producerAuthoritySha256,
  inputs: {
    index: {
      relativePath: 'index.html',
      sha256: '4ae1f01cf82354a8812393ba9b2e95f869bcdde996cfa7bd7ed05d568b330fc7',
    },
    owner: {
      relativePath: 'assets/main-cigCGYPq.js',
      sha256: '26418744ec36102969f681b7ad0905ad864de78c72ddcf9d81d41a4537dd0fd1',
    },
    worker: {
      relativePath: 'assets/species-art.worker-Cy4x5RO-.js',
      sha256: '901c40143b09d43241fb311a877c422df6fb5d997350cf0da91220ef8a973c1e',
    },
    painter: {
      relativePath: 'assets/speciespainter-DJWZf0vw.js',
      sha256: 'de44ec89c54ab8e8d168e369bfdada554a08a9af4fd02f2ca777b7430d2b6686',
    },
    serviceWorker: {
      relativePath: 'service-worker.js',
      sha256: 'a837e771b08c8a3b48c5d4331366cf243d9dcbd538057237273f63e9bf580d2a',
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

type WorkerErrorReceipt = {
  producerEpoch: number;
  workerInstanceId: number;
  jobId: number | null;
  kind: string | null;
  stage: string;
  code: string;
  message: string;
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
    identity: { documentToken: string; lastProducerEpoch: number; lastWorkerInstanceId: number };
    lastEvent: Record<string, unknown>;
    lastError: WorkerErrorReceipt | null;
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

type HistoricalProfile = {
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
  profiles: Record<string, HistoricalProfile>;
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

describe('exact-source PR #35 execution-late Compendium painter-import product stop', () => {
  it('binds the immutable compressed and raw carrier bytes', () => {
    expect(compressed.byteLength).toBe(EVIDENCE.gzipBytes);
    expect(sha256(compressed)).toBe(EVIDENCE.gzipSha256);
    expect(raw.byteLength).toBe(EVIDENCE.rawBytes);
    expect(sha256(raw)).toBe(EVIDENCE.rawSha256);
  });

  it('binds the exact signed source, once-only lifecycle, and clean browser authorities', () => {
    expect(report).toMatchObject({
      schema: 'cf-v2-compendium-memory-report/v1',
      runId: EVIDENCE.runId,
      status: 'product-fail',
      startedAt: '2026-08-30T10:27:50.274Z',
      endedAt: '2026-08-30T10:27:53.386Z',
      durationMs: 3_112,
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

  it('stops at phone Planetside with zero outcomes, all 78 blocked, and no successor evidence', () => {
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
    expect(phone.commandLedger).toHaveLength(14);
    expect(report.partialFailure).toEqual({
      schema: 'cf-v2-compendium-partial-failure/v1',
      classification: 'product-fail',
      profile: 'phone',
      lastCompletedStage: 'veteran Earth foreground cleanup',
      failingStage: 'veteran-earth-planetside thumb settlement',
      command: null,
      diagnosis: 'phone veteran-earth-planetside: thumbnail producer reached a terminal error',
    });
    expect(report.findings).toEqual([
      'product: phone veteran-earth-planetside: thumbnail producer reached a terminal error',
    ]);
    expect(report.partialFailure.diagnosis).toBe(report.findings[0]!.slice('product: '.length));
    expect(raw.toString('utf8')).not.toContain(`${EVIDENCE.runId}.png`);
  });

  it('binds all eight terminal error rows and their complete trusted v2 receipt', () => {
    const phone = report.profiles.phone!;
    const active = phone.activeThumbnailSettlement;
    const observation = active.lastObservation;
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
        status: 'product-error',
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
      schema: 'cf-v2-compendium-thumb-settlement-observation/v3',
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
      art: {
        available: true,
        schema: 'cf-v2-species-art-diagnostics/v1',
        queuedJobs: 0,
        activeJobs: 0,
      },
      lazyArt: {
        available: true,
        schema: 'cf-v2-species-art-worker-diagnostics/v2',
        state: 'error',
        importStarts: 1,
        identity: { lastProducerEpoch: 1, lastWorkerInstanceId: 1 },
        lastEvent: {
          producerEpoch: 1,
          workerInstanceId: 1,
          jobId: 1,
          kind: 'thumb132',
          event: 'error:import',
        },
        lastError: {
          producerEpoch: 1,
          workerInstanceId: 1,
          jobId: 1,
          kind: 'thumb132',
          stage: 'import',
          code: 'painter-import',
          message: EVIDENCE.errorMessage,
        },
        phases: {
          importStarts: 1,
          importCompletes: 0,
          thumbJobStarts: 0,
          thumbRenderCompletes: 0,
          thumbEncodeStarts: 0,
          thumbEncodeCompletes: 0,
          portraitJobStarts: 0,
          portraitRenderCompletes: 0,
          portraitEncodeStarts: 0,
          portraitEncodeCompletes: 0,
        },
        results: {
          count: 0,
          maxImportDurationMs: 0,
          maxRenderDurationMs: 0,
          maxEncodeDurationMs: 0,
        },
        errors: { capability: 0, protocol: 0, import: 1, paint: 0, encode: 0 },
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

    const receipt = observation.lazyArt.lastError;
    expect(receipt).not.toBeNull();
    expect(receipt!.message).toHaveLength(101);
    expect(sha256(receipt!.message)).toBe(EVIDENCE.errorMessageSha256);
    expect(observation.reasons.at(-1)).toBe(
      'lazy-art witness epoch=1;worker=1;phases=1,0,0,0,0,0,0,0,0,0;'
      + 'results=0,0,0,0;errors=0,0,1,0,0;last=1,1,1,thumb132,error:import;'
      + 'lastError=1,1,1,thumb132,import,painter-import,message=101,'
      + EVIDENCE.errorMessageSha256,
    );
    expect(active.lastDecision).toEqual({ status: 'product-error', reasons: observation.reasons });
    expect(observation.lazyArt.identity.documentToken).toBe(observation.page.documentToken);
    expect(phone.pageAuthorities.main).toEqual({
      targetId: observation.page.targetId,
      sessionId: observation.page.sessionId,
      documentToken: observation.page.documentToken,
    });
    expect(phone.pageAuthorities.lazy).not.toEqual(phone.pageAuthorities.main);
  });
});
