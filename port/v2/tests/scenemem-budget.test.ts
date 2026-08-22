import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import {
  evaluateSceneMemory,
  type SceneMemoryBudget,
  type SceneMemoryInput,
  type SceneMemoryProfileMeasurement,
  type SceneMemoryVerdict,
} from '../tools/scenemem-contract.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const v2Root = path.resolve(here, '..');
const budgetPath = path.join(v2Root, 'budgets', 'scene-memory-v2.json');
const auditRoot = path.resolve(v2Root, '..', '..', 'audits');
const SOURCE_COMMIT = 'a4de5007ffc9131b8bc952a0a4cb469d9139039e';
const SOURCE_WORKING_TREE = 'f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a';
const BUILD_SHA256 = '44eb670cc2160c39ff5c159f5f1aec1e68e5d6bae5d02e75bf0e2eec026ff81e';
const PROFILE_NAMES = ['phone', 'desktop'] as const;
const CANDIDATES = [
  {
    runId: 'arc1c-candidate-1',
    file: 'ARC1C_SCENEMEM_CALIBRATION_CANDIDATE1.json.gz',
    rawSha256: '045b43a26852449a810da3be36759c473f809994b3a68d4657af900875d4647b',
    gzipSha256: 'ada50b3cc3f3c143d06ffc42d8e8b0cf3379a57ee17bf2ba1faa7eb11ca3bda0',
  },
  {
    runId: 'arc1c-candidate-2',
    file: 'ARC1C_SCENEMEM_CALIBRATION_CANDIDATE2.json.gz',
    rawSha256: 'd4a51a4422fe4a3ae89223110676fe0f9a7939c8f8892792dd98c0e210e2d958',
    gzipSha256: '80a77eeb21d970add3529a4375738ea2aa9234c2eb8f479a931c56ab2ac43601',
  },
  {
    runId: 'arc1c-candidate-3',
    file: 'ARC1C_SCENEMEM_CALIBRATION_CANDIDATE3.json.gz',
    rawSha256: '4bf113e40fe6e94a4a127aba3256ecca2ab90cc9f7bd3564be00662a44238ff8',
    gzipSha256: '385d4622e669cc0849aced533da50869b01a6b11ef5d06e3e61afe5de910a593',
  },
] as const;

type ProfileName = typeof PROFILE_NAMES[number];
type BudgetRecord = {
  schema: string;
  authority: {
    browser: Record<string, string>;
    producer: Record<string, string>;
  };
  profiles: Record<ProfileName, SceneMemoryBudget>;
};
type CalibrationReport = {
  schema: string;
  runId: string;
  status: string;
  certification: string;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  lifecycle: { schema: string; status: string };
  policy: Record<string, number>;
  scope: {
    covered: string[];
    shipyardStatus: string;
    excluded: string[];
  };
  cleanup: Record<string, boolean>;
  source: {
    begin: Record<string, string>;
    end: Record<string, string>;
  };
  browser: Record<string, string>;
  inputs: Record<string, string | null>;
  build: { schema: string; files: unknown[]; sha256: string };
  fixture: { count: number; rowsSha256: string };
  contractInput: SceneMemoryInput;
  verdict: SceneMemoryVerdict;
  outcomes: Array<{ id: string; pass: boolean; message: string }>;
  findings: unknown[];
  fatalEvents: unknown[];
  profiles: Record<ProfileName, SceneMemoryProfileMeasurement & {
    targetId: string;
    documentToken: string;
    metrics: Record<keyof SceneMemoryBudget, number>;
  }>;
};

const EXPECTED_BROWSER_AUTHORITY = Object.freeze({
  product: 'Edg/151.0.4129.101',
  revision: '@cc1d9f4080fd9140611a9600b8d1615db310105d',
  jsVersion: '15.1.23.9',
  protocolVersion: '1.3',
});

const EXPECTED_PRODUCER_AUTHORITY = Object.freeze({
  collector: 'c0c626d1b8a4bc577161debf477f97cfa9c8be4d735fecaaa16124afcae2e957',
  browserCdp: '6da9e2efaaf7f91f9ad93c101368b847a7e77aeb015e83f7768fe11dd85147ce',
  browserPath: '733ab771f60bead83e8d2af4d95339248f7c9b16879903ea89b817677e4a6bc0',
  workspaceLock: 'e22a4c268ad0ce71a1c9160f45a2386c413c7fbcfc13f0cc457cf084ff0fd606',
  fixtureGenerator: 'a1b294f0b8b5958910fd873f49d226f80447ad77381cccfd0acb21c82dc7aece',
  verdictContract: '8019a0f0bf938aa59f45bb6dfaaf56adb77b08073f9d4fa24c2d0592f5bf623d',
  fixtureSpec: 'c5792c2c8605765b95170e8d954a157e60c9abfa37500ec93c5e1f81722f69f3',
  fixtureRows: 'daefba685c3e70febd94781d5b140659f741a181edc32154be57e631af361706',
  baselineSaveFixtures: 'a52bfbdc1c65a418eed07a1e7ba5ffd07b36caf5ce10e587c7d34a717deab2a7',
  package: '6bad342bf5503275608ebae5c0e730658c82d608cd58f4c1d62a4457f85d673f',
  packageLock: 'a6b7eb9f9439d7c76d7cf0ee154ef6221e9ad73226c7a5f0e893feaf4231a110',
  appPackage: 'd935051fd788aa303363adf84a51bc1b030ae05f488a0058585322465d9b7135',
  buildDist: BUILD_SHA256,
  gameHtml: 'dd4b69852e309d7eab44df07dab37ee01b1d157b3948de805f6b1092b2edb538',
  gameMain: 'e493beec8251b013b19c3191a400df74c872a2b75adc9e57eb87f9c9b97062aa',
  shipVisualState: '9bfd27d3d6a75779d3372dfb6386e8e98ef22d92a33b0346819225024c70d762',
  shipyardPreview: 'a3aac0c541a8f824a3625778e89468b5b03653dd29820c3b024fa45a7c753e85',
  planetTextureAttachment: '00e4b63f28cf6fc01c3285eaa6f6e840154eda669e4bf7334aec660d2822857a',
  planetTextureDemand: 'a537aacde361e88b692887e6d2fa67674296d828aa0d297673dc34b147322055',
  sceneTextureOwner: 'db7af3f23c3b7d652df37cb54f1082eea177380aefd4f86bc16365a6adbed709',
  pixiManagedResourceOwner: '2d9eaeb667f5a4a763e25bd8e168b721494dda49c252e2411031a258d2653708',
  pixiBatchTextureArray: '95ea401f9f05a933f17c9a327b94109bfcc46b0a21cc59789a66537a5b62deb3',
  sceneText: '7ea78c599fed72ab1ba65991270b72d642f6ec2f9768f63ad64d280ce9147731',
});

const SELECTED_PROFILES = Object.freeze({
  phone: Object.freeze({
    heapUsedBytesMax: 10485760,
    embedderHeapUsedBytesMax: 4194304,
    backingStorageBytesMax: 3145728,
    heapAggregateBytesMax: 16777216,
    warmHeapAggregateRangeBytesMax: 524288,
    warmHeapSlopeBytesPerCycleMax: 131072,
    documentsMax: 3.5,
    nodesMax: 704,
    jsEventListenersMax: 80,
    peakActiveLeaseCountMax: 84.5,
    peakLiveTextureCountMax: 74.5,
    peakLiveCanvasBytesMax: 30288705,
    managedTextureCountMax: 48,
    managedTexturePixelsMax: 6553600,
    localCanvasCacheEntriesMax: 0.5,
    peakLocalCanvasCacheEntriesMax: 2.5,
    productRenderTargetsMax: 0.5,
    ringCacheEntriesMax: 0.5,
    peakRingGeometryEntriesMax: 2.5,
    targetElapsedMsMax: 250,
    heartbeatElapsedMsMax: 100,
  }),
  desktop: Object.freeze({
    heapUsedBytesMax: 10485760,
    embedderHeapUsedBytesMax: 4194304,
    backingStorageBytesMax: 3145728,
    heapAggregateBytesMax: 16777216,
    warmHeapAggregateRangeBytesMax: 524288,
    warmHeapSlopeBytesPerCycleMax: 131072,
    documentsMax: 3.5,
    nodesMax: 704,
    jsEventListenersMax: 80,
    peakActiveLeaseCountMax: 81.5,
    peakLiveTextureCountMax: 72.5,
    peakLiveCanvasBytesMax: 30255937,
    managedTextureCountMax: 48,
    managedTexturePixelsMax: 6291456,
    localCanvasCacheEntriesMax: 0.5,
    peakLocalCanvasCacheEntriesMax: 2.5,
    productRenderTargetsMax: 0.5,
    ringCacheEntriesMax: 0.5,
    peakRingGeometryEntriesMax: 2.5,
    targetElapsedMsMax: 250,
    heartbeatElapsedMsMax: 100,
  }),
}) satisfies Readonly<Record<ProfileName, SceneMemoryBudget>>;

const BUDGET_FIELDS = Object.keys(SELECTED_PROFILES.phone) as Array<keyof SceneMemoryBudget>;
const ZERO_POINT_FIELDS: Readonly<Partial<Record<keyof SceneMemoryBudget, string>>> = Object.freeze({
  localCanvasCacheEntriesMax: 'localCanvasCacheEntries',
  productRenderTargetsMax: 'productRenderTargets',
  ringCacheEntriesMax: 'ringCacheEntries',
});

const sha256 = (value: Uint8Array): string =>
  createHash('sha256').update(value).digest('hex');

const budget = JSON.parse(fs.readFileSync(budgetPath, 'utf8')) as BudgetRecord;
const evidence = CANDIDATES.map((candidate) => {
  const compressed = fs.readFileSync(path.join(auditRoot, candidate.file));
  const raw = gunzipSync(compressed);
  return {
    candidate,
    compressed,
    raw,
    report: JSON.parse(raw.toString('utf8')) as CalibrationReport,
  };
});
const reports = evidence.map(({ report }) => report);

const authorityProjection = (
  record: Readonly<Record<string, string | null>>,
  authority: Readonly<Record<string, string>>,
): Record<string, string | null> => Object.fromEntries(
  Object.keys(authority).map((field) => [field, record[field] ?? null]),
);

const metric = (
  report: CalibrationReport,
  profile: ProfileName,
  field: keyof SceneMemoryBudget,
): number => {
  const value = report.profiles[profile].metrics[field];
  if (typeof value !== 'number') throw new Error(`missing ${profile}.${field} calibration metric`);
  return value;
};

const slope = (values: readonly number[]): number => {
  const xMean = (values.length - 1) / 2;
  const yMean = values.reduce((sum, value) => sum + value, 0) / values.length;
  let numerator = 0;
  let denominator = 0;
  for (let index = 0; index < values.length; index++) {
    const xDelta = index - xMean;
    numerator += xDelta * (values[index]! - yMean);
    denominator += xDelta * xDelta;
  }
  return numerator / denominator;
};

const metricSummary = (
  measurement: SceneMemoryProfileMeasurement,
): Record<keyof SceneMemoryBudget, number> => {
  const points = [measurement.precondition, ...measurement.cycles, measurement.bfcache];
  const warmAggregates = measurement.cycles.map((point) => point.heap.usedSize
    + point.heap.embedderHeapUsedSize + point.heap.backingStorageSize);
  const warmSlope = Math.max(0, ...[
    measurement.cycles.map((point) => point.heap.usedSize),
    measurement.cycles.map((point) => point.heap.embedderHeapUsedSize),
    measurement.cycles.map((point) => point.heap.backingStorageSize),
    warmAggregates,
  ].map(slope));
  const max = (select: (point: typeof points[number]) => number): number =>
    Math.max(...points.map(select));
  return {
    heapUsedBytesMax: max((point) => point.heap.usedSize),
    embedderHeapUsedBytesMax: max((point) => point.heap.embedderHeapUsedSize),
    backingStorageBytesMax: max((point) => point.heap.backingStorageSize),
    heapAggregateBytesMax: max((point) => point.heap.usedSize
      + point.heap.embedderHeapUsedSize + point.heap.backingStorageSize),
    warmHeapAggregateRangeBytesMax: Math.max(...warmAggregates) - Math.min(...warmAggregates),
    warmHeapSlopeBytesPerCycleMax: warmSlope,
    documentsMax: max((point) => point.dom.documents),
    nodesMax: max((point) => point.dom.nodes),
    jsEventListenersMax: max((point) => point.dom.jsEventListeners),
    peakActiveLeaseCountMax: max((point) => point.registry.peakActiveLeaseCount),
    peakLiveTextureCountMax: max((point) => point.registry.peakLiveTextureCount),
    peakLiveCanvasBytesMax: max((point) => point.registry.peakLiveCanvasBytes),
    managedTextureCountMax: max((point) => point.managedTextureCount),
    managedTexturePixelsMax: max((point) => point.managedTexturePixels),
    localCanvasCacheEntriesMax: max((point) => point.localCanvasCacheEntries),
    peakLocalCanvasCacheEntriesMax: max((point) => point.peakLocalCanvasCacheEntries),
    productRenderTargetsMax: max((point) => point.productRenderTargets),
    ringCacheEntriesMax: max((point) => point.ringCacheEntries),
    peakRingGeometryEntriesMax: max((point) => point.peakRingGeometryEntries),
    targetElapsedMsMax: max((point) => point.answerability.target.elapsedMs),
    heartbeatElapsedMsMax: max((point) => point.answerability.heartbeat.elapsedMs),
  };
};

describe('Arc 1C scene-memory active budget', () => {
  it('locks the selected v2 budget to one exact browser, producer, and ceiling tuple', () => {
    expect(budget).toEqual({
      schema: 'cf-v2-scene-memory-budget/v2',
      authority: {
        browser: EXPECTED_BROWSER_AUTHORITY,
        producer: EXPECTED_PRODUCER_AUTHORITY,
      },
      profiles: SELECTED_PROFILES,
    });
    expect(Object.keys(budget.profiles.phone)).toEqual(BUDGET_FIELDS);
    expect(Object.keys(budget.profiles.desktop)).toEqual(BUDGET_FIELDS);
  });

  it('binds and independently recomputes all three retained clean candidates', () => {
    expect(reports.map((report) => report.runId)).toEqual(
      CANDIDATES.map(({ runId }) => runId),
    );

    for (const { candidate, compressed, raw, report } of evidence) {
      expect(sha256(compressed), `${candidate.runId} gzip`).toBe(candidate.gzipSha256);
      expect(sha256(raw), `${candidate.runId} raw`).toBe(candidate.rawSha256);
      expect(report.schema).toBe('cf-v2-scene-memory-report/v2');
      expect(report.status).toBe('calibration');
      expect(report.certification).toBe('calibration-only-not-certified');
      expect(report.lifecycle).toEqual({
        schema: 'cf-v2-scene-memory-report-lifecycle/v1',
        status: 'complete',
      });
      expect(report.policy).toEqual({
        attemptCount: 1,
        automaticRetries: 0,
        warmupCycles: 4,
        measuredWarmCycles: 4,
        commandTimeoutMs: 5000,
        targetTimeoutMs: 2000,
        heartbeatTimeoutMs: 2000,
      });
      expect(report.scope).toEqual({
        covered: ['universe', 'galaxy', 'galaxy-fine', 'system', 'surface', 'compendium', 'shipyard'],
        shipyardStatus: 'implemented-static',
        excluded: ['Shipyard build writers', 'audio lifecycle', 'true GPU bytes'],
      });
      expect(report.cleanup).toEqual({ browser: true, server: true, workspaceLock: true });
      expect(report.source.begin).toEqual(report.source.end);
      expect(report.source.begin).toMatchObject({
        commit: SOURCE_COMMIT,
        branch: 'openai/mac',
        state: 'committed',
        statusSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        workingTreeSha256: SOURCE_WORKING_TREE,
      });
      expect(report.fixture).toEqual({
        count: 1500,
        rowsSha256: EXPECTED_PRODUCER_AUTHORITY.fixtureRows,
      });
      expect(report.build.schema).toBe('cf-v2-scene-memory-build/v1');
      expect(report.build.files.length).toBeGreaterThan(0);
      expect(report.build.sha256).toBe(BUILD_SHA256);
      expect(report.inputs.budget).toBeNull();
      expect(Object.keys(report.inputs).sort()).toEqual(
        [...Object.keys(EXPECTED_PRODUCER_AUTHORITY), 'budget'].sort(),
      );
      expect(authorityProjection(report.inputs, EXPECTED_PRODUCER_AUTHORITY)).toEqual(
        EXPECTED_PRODUCER_AUTHORITY,
      );
      expect(authorityProjection(report.browser, EXPECTED_BROWSER_AUTHORITY)).toEqual(
        EXPECTED_BROWSER_AUTHORITY,
      );
      expect(report.outcomes).toHaveLength(42);
      expect(report.outcomes.every((outcome) => outcome.pass)).toBe(true);
      expect(report.findings).toEqual([]);
      expect(report.fatalEvents).toEqual([]);
      expect(report.contractInput.schema).toBe('cf-v2-scene-memory-input/v3');
      const recomputed = evaluateSceneMemory(report.contractInput);
      expect(recomputed).toEqual(report.verdict);
      expect(recomputed.status).toBe('pass');
      expect(recomputed.outcomes).toEqual(report.outcomes);
      for (const profile of PROFILE_NAMES) {
        expect(metricSummary(report.profiles[profile])).toEqual(report.profiles[profile].metrics);
      }
    }

    expect(new Set(reports.map((report) => report.startedAt)).size).toBe(3);
    expect(new Set(reports.map((report) => report.source.begin.workingTreeSha256))).toEqual(
      new Set([SOURCE_WORKING_TREE]),
    );
    expect(new Set(reports.map((report) => report.build.sha256))).toEqual(new Set([BUILD_SHA256]));
    for (const profile of PROFILE_NAMES) {
      expect(new Set(reports.map((report) => report.profiles[profile].targetId)).size).toBe(3);
      expect(new Set(reports.map((report) => report.profiles[profile].documentToken)).size).toBe(3);
    }
  });

  it('replays every candidate green with strict headroom over every observed metric', () => {
    for (const report of reports) {
      const replay = evaluateSceneMemory({
        ...report.contractInput,
        budgets: budget.profiles,
      });
      expect(replay.status, report.runId).toBe('pass');
      expect(replay.outcomes).toHaveLength(42);
      expect(replay.outcomes.every((outcome) => outcome.pass)).toBe(true);
    }

    for (const profile of PROFILE_NAMES) {
      for (const field of BUDGET_FIELDS) {
        const observed = Math.max(...reports.map((report) => metric(report, profile, field)));
        expect(budget.profiles[profile][field], `${profile}.${field}`).toBeGreaterThan(observed);
      }
    }
  });

  it('negative control: rejects every just-below positive observed ceiling independently', () => {
    for (const profile of PROFILE_NAMES) {
      for (const field of BUDGET_FIELDS) {
        const report = reports.reduce((largest, candidate) => (
          metric(candidate, profile, field) > metric(largest, profile, field)
            ? candidate : largest
        ));
        const observed = metric(report, profile, field);
        if (observed === 0) continue;
        const justBelow = observed > 1 ? observed - 0.5 : observed / 2;
        const replay = evaluateSceneMemory({
          ...report.contractInput,
          budgets: {
            ...budget.profiles,
            [profile]: { ...budget.profiles[profile], [field]: justBelow },
          },
        });
        expect(replay.status, `${profile}.${field}`).toBe('fail');
        expect(replay.outcomes.some((outcome) => !outcome.pass), `${profile}.${field}`).toBe(true);
      }
    }
  });

  it('negative control: rejects the next integer for every calibrated zero field', () => {
    for (const profile of PROFILE_NAMES) {
      const observedZeroFields = BUDGET_FIELDS.filter((field) =>
        reports.every((report) => metric(report, profile, field) === 0));
      expect(observedZeroFields).toEqual(Object.keys(ZERO_POINT_FIELDS));

      for (const field of observedZeroFields) {
        const pointField = ZERO_POINT_FIELDS[field];
        if (!pointField) throw new Error(`missing point mutation for ${field}`);
        expect(budget.profiles[profile][field]).toBe(0.5);
        const input = structuredClone(reports[0]!.contractInput);
        const firstCycle = input.profiles[profile].cycles[0] as unknown as Record<string, number>;
        firstCycle[pointField] = 1;
        const replay = evaluateSceneMemory({ ...input, budgets: budget.profiles });
        expect(replay.status, `${profile}.${field}`).toBe('fail');
      }
    }
  });

  it('negative control: stale browser or producer authority cannot masquerade as calibration', () => {
    const report = reports[0]!;
    const staleProducer = { ...report.inputs, shipyardPreview: '0'.repeat(64) };
    const staleBrowser = { ...report.browser, revision: '@stale' };
    expect(authorityProjection(staleProducer, EXPECTED_PRODUCER_AUTHORITY)).not.toEqual(
      EXPECTED_PRODUCER_AUTHORITY,
    );
    expect(authorityProjection(staleBrowser, EXPECTED_BROWSER_AUTHORITY)).not.toEqual(
      EXPECTED_BROWSER_AUTHORITY,
    );
    expect(authorityProjection(report.inputs, EXPECTED_PRODUCER_AUTHORITY)).toEqual(
      EXPECTED_PRODUCER_AUTHORITY,
    );
    expect(authorityProjection(report.browser, EXPECTED_BROWSER_AUTHORITY)).toEqual(
      EXPECTED_BROWSER_AUTHORITY,
    );
  });
});
