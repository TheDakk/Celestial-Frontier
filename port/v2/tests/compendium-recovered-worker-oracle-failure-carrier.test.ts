import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

/*
 * Historical evidence deliberately owns every literal below. This replay does
 * not import the live Compendium budget or outcome evaluator: a later repair
 * must not be able to relabel or silently weaken this exact-source red.
 */
const EVIDENCE = Object.freeze({
  file: 'ARC1C_COMPENDIUM_PR35_RECOVERED_WORKER_ORACLE_FAILURE_20260830_D33ABDF.json.gz',
  gzipBytes: 451_743,
  gzipSha256: '4e714e115ca7f4b5d1d32ba118241ca8b78055596438a4dd22bbb1c1d471ffab',
  rawBytes: 10_813_681,
  rawSha256: 'e4eb2aba1079a1d42b1da5e7f97d236105917fd497035937b1f6855d63a4289e',
  runId: '20260830-pr35-first-install-d33abdfd5132-compendium-certification',
  sourceCommit: 'd33abdfd513236e72294b81e3bb46b1362f810e1',
  sourceWorkingTreeSha256:
    'f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a',
  capabilityAuthoritySha256:
    '35eb09daa39f211b8e9015f59b77a983b5870611322d673c47f7ff4f2b61e341',
  measurementAuthoritySha256:
    'e6aba53d75c17669f4bc8893770023c849d4ed23edb6be36eb938f4491e17e97',
  outcomeContractSha256:
    '2c751b866ca40fc8e4593dda82d19eb62ca4ff804caffc7531228128b480af21',
  collectorSha256: '2a74e941abbe701ca5c1d3952a7451ccd11ce3284d794f9e22aa0a79c0315237',
  budgetSha256: 'a48804b319e9b2dabda91ebaa6d947971d44abcd4e0a375ba8a3405002e5eac2',
  producerAuthoritySha256:
    '2ef58ea042d2d5ecb97715642efeac14e013dfb8b375406cfb47c090cf072e39',
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
      sha256: '85d018e14af75479b6d6b4ee27d2a51484f85c5acbde2a0f07cce462b067e881',
    },
    owner: {
      relativePath: 'assets/main-DLGn5scU.js',
      sha256: '5db21431a40fbd1c8d8676a382cf973bf7e2a0007d9701f5b4f7318317c82103',
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
      sha256: '81dca3977138d0973b52e85c0c82b6636674088546463edb136ec64640b78a14',
    },
  },
});

type CapShrinkEvidence = {
  beforeEntries: number;
  afterEntries: number;
  phoneLimit: number;
  afterDecodedBytes: number;
  phoneDecodedBytesLimit: number;
  beforeDeviceClass: string;
  afterDeviceClass: string;
  disposalsDelta: number;
  warmCyclesSealed: number;
  warmTerminalJobStarts: number;
  beforeJobStarts: number;
  warmTerminalDisposals: number;
  beforeDisposals: number;
  restoredDeviceClass: string;
};

type WarmPoint = {
  cacheEntries: number;
  decodedPixels: number;
  decodedBytes: number;
  encodedBytes: number;
  queuedJobs: number;
  activeJobs: number;
  leases: number;
  subscribers: number;
  portraitCacheEntries: number;
  portraitEncodedBytes: number;
};

type WorkerEvidence = {
  schema: string;
  state: string;
  importStarts: number;
  identity: { documentToken: string; lastProducerEpoch: number; lastWorkerInstanceId: number };
  lastEvent: {
    producerEpoch: number;
    workerInstanceId: number;
    jobId: number;
    kind: string;
    event: string;
  } | null;
  lastError: unknown;
  worker: {
    live: boolean;
    starts: number;
    ready: number;
    disposals: number;
    fatals: number;
    protocolErrors: number;
  };
  phases: {
    importStarts: number;
    importCompletes: number;
    thumbJobStarts: number;
    thumbRenderCompletes: number;
    thumbEncodeStarts: number;
    thumbEncodeCompletes: number;
    portraitJobStarts: number;
    portraitRenderCompletes: number;
    portraitEncodeStarts: number;
    portraitEncodeCompletes: number;
  };
  results: { count: number };
  errors: { capability: number; protocol: number; import: number; paint: number; encode: number };
};

type HistoricalOutcome = {
  id: string;
  profile: string;
  check: string;
  status: string;
  diagnosis: string;
  evidence: CapShrinkEvidence | { warm: WarmPoint[]; worker: WorkerEvidence };
};

type HistoricalProfile = {
  phases: { resourceOrder: string[] };
  points: {
    postCapRestored: {
      diagnostics: {
        documentToken: string;
        art: {
          deviceClass: string;
          live: WarmPoint;
          totals: {
            jobStarts: number;
            jobCompletes: number;
            jobErrors: number;
            disposals: number;
            thumbCanvasRenders: number;
            fullPortraitRendersForThumb: number;
            fullPortraitDecodesForThumb: number;
          };
        };
        lazyArt: WorkerEvidence;
      };
    };
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
  outcomes: HistoricalOutcome[];
  findings: string[];
  blockedOutcomes: string[];
  reviewPacket: Array<Record<string, unknown>>;
  profiles: Record<'phone' | 'desktop', HistoricalProfile>;
};

const here = path.dirname(fileURLToPath(import.meta.url));
const carrierPath = path.resolve(here, '..', '..', '..', 'audits', EVIDENCE.file);
const compressed = fs.readFileSync(carrierPath);
const raw = gunzipSync(compressed);
const report = JSON.parse(raw.toString('utf8')) as HistoricalReport;

function sha256(value: Buffer | string): string {
  return createHash('sha256').update(value).digest('hex');
}

function failed(check: string, profile: string): HistoricalOutcome {
  const outcome = report.outcomes.find((candidate) =>
    candidate.check === check && candidate.profile === profile && candidate.status === 'fail');
  if (!outcome) throw new Error(`missing exact historical ${profile}/${check} failure`);
  return outcome;
}

function capEvidence(profile: string): CapShrinkEvidence {
  return failed('cap-shrink', profile).evidence as CapShrinkEvidence;
}

function settledEvidence(profile: string): { warm: WarmPoint[]; worker: WorkerEvidence } {
  return failed('settled-jobs', profile).evidence as { warm: WarmPoint[]; worker: WorkerEvidence };
}

describe('exact-source PR #35 recovered-worker outcome-oracle failure', () => {
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
      status: 'fail',
      startedAt: '2026-08-30T09:20:05.180Z',
      endedAt: '2026-08-30T09:21:10.904Z',
      durationMs: 65_724,
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

  it('retains the complete 78-outcome ledger with exactly the four stored reds', () => {
    expect(report.expectedOutcomes).toHaveLength(78);
    expect(new Set(report.expectedOutcomes).size).toBe(78);
    expect(report.outcomes).toHaveLength(78);
    expect(report.outcomes.filter((outcome) => outcome.status === 'pass')).toHaveLength(74);
    const reds = report.outcomes.filter((outcome) => outcome.status === 'fail');
    expect(reds.map((outcome) => outcome.id)).toEqual([
      'phone/cap-shrink',
      'phone/settled-jobs',
      'desktop/cap-shrink',
      'desktop/settled-jobs',
    ]);
    expect(report.findings).toEqual(reds.map((outcome) => outcome.diagnosis));
    expect(report.blockedOutcomes).toEqual([]);
    expect(sha256(JSON.stringify(report.expectedOutcomes))).toBe(EXACT_INPUTS.outcomeInventory);
  });

  it.each([
    ['phone', 1_054, 784, 'phone', 819_338, 61, 1_056, 1_015],
    ['desktop', 1_044, 773, 'desktop', 823_250, 62, 1_046, 1_004],
  ] as const)('binds healthy %s cap-shrink measurements despite the stored red',
    (profile, beforeJobStarts, beforeDisposals, restoredDeviceClass,
      encodedBytes, workerCount, lastJobId, postCapDisposals) => {
      const evidence = capEvidence(profile);
      expect(evidence).toEqual({
        beforeEntries: 256,
        afterEntries: 96,
        phoneLimit: 96,
        afterDecodedBytes: 6_690_816,
        phoneDecodedBytesLimit: 6_690_816,
        beforeDeviceClass: 'desktop',
        afterDeviceClass: 'phone',
        disposalsDelta: 160,
        warmCyclesSealed: 4,
        warmTerminalJobStarts: profile === 'phone' ? 726 : 716,
        beforeJobStarts,
        warmTerminalDisposals: profile === 'phone' ? 690 : 677,
        beforeDisposals,
        restoredDeviceClass,
      });
      expect(evidence.afterEntries).toBeLessThan(evidence.beforeEntries);
      expect(evidence.afterEntries).toBe(evidence.phoneLimit);
      expect(evidence.afterDecodedBytes).toBeLessThanOrEqual(evidence.phoneDecodedBytesLimit);
      expect(evidence.disposalsDelta).toBe(evidence.beforeEntries - evidence.afterEntries);
      expect(evidence.beforeJobStarts).toBeGreaterThan(evidence.warmTerminalJobStarts);
      expect(evidence.beforeDisposals).toBeGreaterThan(evidence.warmTerminalDisposals);

      const historicalProfile = report.profiles[profile];
      expect(historicalProfile.phases.resourceOrder).toEqual([
        'warm-precondition', 'warm-1', 'warm-2', 'warm-3', 'warm-4',
        'cap-before', 'cap-after', 'profile-restored', 'post-cap-restored',
      ]);
      const postCap = historicalProfile.points.postCapRestored.diagnostics;
      expect(postCap.art).toMatchObject({
        deviceClass: restoredDeviceClass,
        live: {
          cacheEntries: 25,
          decodedPixels: 435_600,
          decodedBytes: 1_742_400,
          encodedBytes,
          queuedJobs: 0,
          activeJobs: 0,
          leases: 8,
          subscribers: 0,
          portraitCacheEntries: 0,
          portraitEncodedBytes: 0,
        },
        totals: {
          jobStarts: beforeJobStarts,
          jobCompletes: beforeJobStarts - 1,
          jobErrors: 1,
          disposals: postCapDisposals,
          thumbCanvasRenders: beforeJobStarts - 1,
          fullPortraitRendersForThumb: 0,
          fullPortraitDecodesForThumb: 0,
        },
      });
      const worker = postCap.lazyArt;
      expect(worker).toMatchObject({
        schema: 'cf-v2-species-art-worker-diagnostics/v2',
        state: 'ready',
        importStarts: workerCount,
        lastEvent: {
          producerEpoch: workerCount,
          workerInstanceId: workerCount,
          jobId: lastJobId,
          kind: 'thumb132',
          event: 'result',
        },
        lastError: null,
        worker: {
          live: false,
          starts: workerCount,
          ready: workerCount,
          disposals: workerCount,
          fatals: 0,
          protocolErrors: 0,
        },
        errors: { capability: 0, protocol: 0, import: 0, paint: 1, encode: 0 },
      });
      expect(worker.identity.documentToken).toBe(postCap.documentToken);
      expect(worker.identity.lastProducerEpoch).toBe(workerCount);
      expect(worker.identity.lastWorkerInstanceId).toBe(workerCount);
      expect(worker.phases.importStarts).toBe(workerCount);
      expect(worker.phases.importCompletes).toBe(workerCount);
      expect(worker.phases.thumbJobStarts).toBe(beforeJobStarts);
      expect(worker.phases.thumbJobStarts)
        .toBe(worker.phases.thumbRenderCompletes + worker.errors.paint);
      expect(worker.phases.thumbRenderCompletes).toBe(worker.phases.thumbEncodeStarts);
      expect(worker.phases.thumbEncodeStarts).toBe(worker.phases.thumbEncodeCompletes);
      expect(worker.phases.portraitJobStarts).toBe(2);
      expect(worker.phases.portraitJobStarts).toBe(worker.phases.portraitRenderCompletes);
      expect(worker.phases.portraitRenderCompletes).toBe(worker.phases.portraitEncodeStarts);
      expect(worker.phases.portraitEncodeStarts).toBe(worker.phases.portraitEncodeCompletes);
      expect(worker.results.count).toBe(
        worker.phases.thumbEncodeCompletes + worker.phases.portraitEncodeCompletes,
      );
    });

  it.each([
    ['phone', 806_710, 41, 726, 728],
    ['desktop', 804_770, 42, 716, 718],
  ] as const)('binds the recovered %s worker receipt that contradicted the stored red',
    (profile, encodedBytes, workerCount, thumbJobs, lastJobId) => {
      const { warm, worker } = settledEvidence(profile);
      expect(warm).toHaveLength(4);
      expect(warm).toEqual(Array.from({ length: 4 }, () => ({
        cacheEntries: 25,
        decodedPixels: 435_600,
        decodedBytes: 1_742_400,
        encodedBytes,
        queuedJobs: 0,
        activeJobs: 0,
        leases: 8,
        subscribers: 0,
        portraitCacheEntries: 0,
        portraitEncodedBytes: 0,
      })));

      expect(worker).toMatchObject({
        schema: 'cf-v2-species-art-worker-diagnostics/v2',
        state: 'ready',
        importStarts: workerCount,
        lastEvent: { jobId: lastJobId, kind: 'thumb132', event: 'result' },
        lastError: null,
        worker: {
          live: false,
          starts: workerCount,
          ready: workerCount,
          disposals: workerCount,
          fatals: 0,
          protocolErrors: 0,
        },
        errors: { capability: 0, protocol: 0, import: 0, paint: 1, encode: 0 },
      });
      expect(worker.identity.lastProducerEpoch).toBe(workerCount);
      expect(worker.identity.lastWorkerInstanceId).toBe(workerCount);
      expect(worker.lastEvent).not.toBeNull();
      expect(worker.lastEvent!.producerEpoch).toBe(worker.identity.lastProducerEpoch);
      expect(worker.lastEvent!.workerInstanceId).toBe(worker.identity.lastWorkerInstanceId);
      expect(worker.phases.importStarts).toBe(worker.phases.importCompletes);
      expect(worker.phases.importStarts).toBe(worker.importStarts);
      expect(worker.phases.thumbJobStarts).toBe(thumbJobs);
      expect(worker.phases.thumbJobStarts)
        .toBe(worker.phases.thumbRenderCompletes + worker.errors.paint);
      expect(worker.phases.thumbRenderCompletes).toBe(worker.phases.thumbEncodeStarts);
      expect(worker.phases.thumbEncodeStarts).toBe(worker.phases.thumbEncodeCompletes);
      expect(worker.phases.portraitJobStarts).toBe(2);
      expect(worker.phases.portraitJobStarts).toBe(worker.phases.portraitRenderCompletes);
      expect(worker.phases.portraitRenderCompletes).toBe(worker.phases.portraitEncodeStarts);
      expect(worker.phases.portraitEncodeStarts).toBe(worker.phases.portraitEncodeCompletes);
      expect(worker.results.count).toBe(
        worker.phases.thumbEncodeCompletes + worker.phases.portraitEncodeCompletes,
      );
      expect(worker.lastError).toBeNull();
      expect(worker.lastEvent!.event).toBe('result');
    });

  it('binds all six run-owned review images without copying them into the audit', () => {
    expect(report.reviewPacket).toEqual([
      {
        profile: 'phone', state: 'list',
        file: `apps/game/smoke/compendiummem-${EVIDENCE.runId}-phone-list.png`,
        bytes: 718_126,
        sha256: '17311d46f4cbbf75c0d489cc80beccc52cb516fe32cb434279b84b0765e3ee26',
      },
      {
        profile: 'phone', state: 'focus-pinned',
        file: `apps/game/smoke/compendiummem-${EVIDENCE.runId}-phone-focus-pinned.png`,
        bytes: 647_200,
        sha256: '8a737f97d67296572299d446f9a0417544da9a06ddaa35281ea04a11a3340978',
      },
      {
        profile: 'phone', state: 'detail',
        file: `apps/game/smoke/compendiummem-${EVIDENCE.runId}-phone-detail.png`,
        bytes: 779_305,
        sha256: 'f945ccf1d81106067777688b44ec6e4782d5cdd689aa44dd7142329d72e7b693',
      },
      {
        profile: 'desktop', state: 'list',
        file: `apps/game/smoke/compendiummem-${EVIDENCE.runId}-desktop-list.png`,
        bytes: 620_296,
        sha256: '6fed609a3205c009ab0ab4cbe287af7b2314d2db6b6423069644ae188dacf9c7',
      },
      {
        profile: 'desktop', state: 'focus-pinned',
        file: `apps/game/smoke/compendiummem-${EVIDENCE.runId}-desktop-focus-pinned.png`,
        bytes: 609_176,
        sha256: '787d084512d4112dad77a3ddc091fe4d5c69cf5fe425818f2adf7ba02edd31b5',
      },
      {
        profile: 'desktop', state: 'detail',
        file: `apps/game/smoke/compendiummem-${EVIDENCE.runId}-desktop-detail.png`,
        bytes: 614_132,
        sha256: 'ede79803e3d2873503a8ea833260327f9264d663c3473e9822649f55ac2781da',
      },
    ]);
  });
});
