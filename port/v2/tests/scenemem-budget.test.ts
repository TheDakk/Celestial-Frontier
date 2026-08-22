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
const budgetPath = path.join(v2Root, 'budgets', 'scene-memory-v1.json');
const auditRoot = path.resolve(v2Root, '..', '..', 'audits');
const SOURCE_COMMIT = '79c605f9c7ab8b63ad082d852c38d66ad6bb11af';
const PROFILE_NAMES = ['phone', 'desktop'] as const;
const CANDIDATES = [
  {
    runId: '20260821-arc1b-calibration-candidate1',
    file: 'ARC1B_SCENEMEM_CALIBRATION_CANDIDATE1.json.gz',
    rawSha256: '4c910d4969e4874f5c3ba63fc030888cecbfb6cf4fd4d6794ddb36def5142a56',
    gzipSha256: '45dea923ad3b7d1cc07df3349f2268430ad673046a18f086dc754d0cb30553ec',
  },
  {
    runId: '20260821-arc1b-calibration-candidate2',
    file: 'ARC1B_SCENEMEM_CALIBRATION_CANDIDATE2.json.gz',
    rawSha256: '0e4d9d6c302cd34a6b6004c00c8442aecc542fc51758ac966803697b82e0b20f',
    gzipSha256: '754509a8e56dc9ca81f3ff864a3e6da68cb20bb3f94c6f7d0c2dbc4e5939bc30',
  },
  {
    runId: '20260821-arc1b-calibration-candidate3',
    file: 'ARC1B_SCENEMEM_CALIBRATION_CANDIDATE3.json.gz',
    rawSha256: '93b7c10854ec950dc8d5b5ea33a4308762c79014e506a30023d301f6308c0e2c',
    gzipSha256: '9cc49cd08cfe61c132284134c451f88dd69d634f9b4cc0409bfadb92396f0b4c',
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
  budget?: { schema: string; path: string; sha256: string };
  lifecycle: { status: string };
  cleanup: Record<string, boolean>;
  source: {
    begin: { commit: string; state: string; workingTreeSha256: string };
    end: { commit: string; state: string; workingTreeSha256: string };
  };
  browser: Record<string, string>;
  inputs: Record<string, string | null>;
  build: { sha256: string };
  contractInput: SceneMemoryInput;
  verdict: SceneMemoryVerdict;
  outcomes: Array<{ id: string; pass: boolean }>;
  findings: unknown[];
  fatalEvents: unknown[];
  profiles: Record<ProfileName, SceneMemoryProfileMeasurement & {
    metrics: Record<string, number>;
  }>;
};

const sha256 = (value: Uint8Array): string =>
  createHash('sha256').update(value).digest('hex');

const budget = JSON.parse(fs.readFileSync(budgetPath, 'utf8')) as BudgetRecord;
const reports = CANDIDATES.map((candidate) => {
  const compressed = fs.readFileSync(path.join(auditRoot, candidate.file));
  expect(sha256(compressed)).toBe(candidate.gzipSha256);
  const raw = gunzipSync(compressed);
  expect(sha256(raw)).toBe(candidate.rawSha256);
  return JSON.parse(raw.toString('utf8')) as CalibrationReport;
});

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

describe('scene-memory active budget', () => {
  it('binds three clean independent candidates to one exact authority', () => {
    expect(budget.schema).toBe('cf-v2-scene-memory-budget/v1');
    expect(Object.keys(budget)).toEqual(['schema', 'authority', 'profiles']);
    expect(reports.map((report) => report.runId)).toEqual(CANDIDATES.map(({ runId }) => runId));

    for (const report of reports) {
      expect(report.schema).toBe('cf-v2-scene-memory-report/v1');
      expect(report.status).toBe('calibration');
      expect(report.certification).toBe('calibration-only-not-certified');
      expect(report.lifecycle.status).toBe('complete');
      expect(report.cleanup).toEqual({ browser: true, server: true, workspaceLock: true });
      expect(report.source.begin).toEqual(report.source.end);
      expect(report.source.begin.commit).toBe(SOURCE_COMMIT);
      expect(report.source.begin.state).toBe('committed');
      expect(report.inputs.budget).toBeNull();
      expect(report.outcomes).toHaveLength(40);
      expect(report.outcomes.every((outcome) => outcome.pass)).toBe(true);
      expect(report.findings).toEqual([]);
      expect(report.fatalEvents).toEqual([]);
      expect(Object.fromEntries(Object.keys(budget.authority.producer).map((field) => [
        field, report.inputs[field],
      ]))).toEqual(budget.authority.producer);
      expect(Object.fromEntries(Object.keys(budget.authority.browser).map((field) => [
        field, report.browser[field],
      ]))).toEqual(budget.authority.browser);
      for (const profile of PROFILE_NAMES) {
        expect(metricSummary(report.profiles[profile])).toEqual(report.profiles[profile].metrics);
      }
      expect(evaluateSceneMemory(report.contractInput)).toEqual(report.verdict);
    }

    expect(new Set(reports.map((report) => report.source.begin.workingTreeSha256)).size).toBe(1);
    expect(new Set(reports.map((report) => report.build.sha256)).size).toBe(1);
  });

  it('replays the retained exact-budget local certification', () => {
    const compressed = fs.readFileSync(path.join(
      auditRoot, 'ARC1B_SCENEMEM_LOCAL_CERTIFICATION.json.gz',
    ));
    expect(sha256(compressed)).toBe(
      '430ff07d46adf9ba060949a41f59632ddc2691fcbc9d1da330b5f9564178bb44',
    );
    const raw = gunzipSync(compressed);
    expect(sha256(raw)).toBe(
      'c487731dea7e7813b094cb1c080f04239e30c8c74e8be9322ae7de684a786d17',
    );
    const report = JSON.parse(raw.toString('utf8')) as CalibrationReport;
    expect(report.runId).toBe('20260821-arc1b-local-certification');
    expect(report.status).toBe('pass');
    expect(report.certification).toBe('contract-budget');
    expect(report.source.begin).toEqual(report.source.end);
    expect(report.source.begin.commit).toBe('e244c9e2342c6abd79ca4efcd3d26eb46d3d8910');
    expect(report.source.begin.state).toBe('committed');
    expect(report.budget).toEqual({
      schema: 'cf-v2-scene-memory-budget/v1',
      path: '/Users/nick/Projects/celestial-frontier-openai-mac/port/v2/budgets/scene-memory-v1.json',
      sha256: '78a9e81a121d2598b8d83bbbd0c8311e503470dcd88083f959fc82c181ee5afb',
    });
    expect(report.inputs.budget).toBe(report.budget?.sha256);
    expect(report.cleanup).toEqual({ browser: true, server: true, workspaceLock: true });
    expect(report.lifecycle.status).toBe('complete');
    expect(report.outcomes).toHaveLength(40);
    expect(report.outcomes.every((outcome) => outcome.pass)).toBe(true);
    expect(report.findings).toEqual([]);
    expect(report.fatalEvents).toEqual([]);
    for (const profile of PROFILE_NAMES) {
      expect(metricSummary(report.profiles[profile])).toEqual(report.profiles[profile].metrics);
    }
    expect(evaluateSceneMemory(report.contractInput)).toEqual(report.verdict);
  });

  it('replays every candidate green with strict headroom over every observed metric', () => {
    for (const report of reports) {
      const replay = evaluateSceneMemory({
        ...report.contractInput,
        budgets: budget.profiles,
      });
      expect(replay.status, report.runId).toBe('pass');
      expect(replay.outcomes).toHaveLength(40);
    }

    for (const profile of PROFILE_NAMES) {
      for (const field of Object.keys(budget.profiles[profile]) as Array<keyof SceneMemoryBudget>) {
        const observed = Math.max(...reports.map((report) => metric(report, profile, field)));
        expect(budget.profiles[profile][field], `${profile}.${field}`).toBeGreaterThan(observed);
      }
    }
  });

  it('rejects every just-below positive observed ceiling independently', () => {
    for (const profile of PROFILE_NAMES) {
      for (const field of Object.keys(budget.profiles[profile]) as Array<keyof SceneMemoryBudget>) {
        const report = reports.reduce((largest, candidate) => (
          metric(candidate, profile, field) > metric(largest, profile, field)
            ? candidate : largest
        ));
        const observed = metric(report, profile, field);
        if (observed === 0) {
          expect(budget.profiles[profile][field], `${profile}.${field}`).toBe(0.5);
          continue;
        }
        const justBelow = observed > 1 ? observed - 0.5 : observed / 2;
        const replay = evaluateSceneMemory({
          ...report.contractInput,
          budgets: {
            ...budget.profiles,
            [profile]: { ...budget.profiles[profile], [field]: justBelow },
          },
        });
        expect(replay.status, `${profile}.${field}`).toBe('fail');
      }
    }
  });

  it('rejects the next integer for every calibrated zero field', () => {
    const zeroMutations = {
      localCanvasCacheEntriesMax: 'localCanvasCacheEntries',
      productRenderTargetsMax: 'productRenderTargets',
      ringCacheEntriesMax: 'ringCacheEntries',
    } as const;
    for (const profile of PROFILE_NAMES) {
      for (const [field, pointField] of Object.entries(zeroMutations) as Array<[
        keyof typeof zeroMutations, typeof zeroMutations[keyof typeof zeroMutations],
      ]>) {
        expect(budget.profiles[profile][field]).toBe(0.5);
        const input = structuredClone(reports[0]!.contractInput);
        input.profiles[profile].cycles[0]![pointField] = 1;
        const replay = evaluateSceneMemory({ ...input, budgets: budget.profiles });
        expect(replay.status, `${profile}.${field}`).toBe('fail');
      }
    }
  });

  it('binds the selected heap plateau to every retained four-cycle diagnostic window', () => {
    const compressed = fs.readFileSync(path.join(
      auditRoot, 'ARC1B_SCENEMEM_FINAL_DIAGNOSTIC12.json.gz',
    ));
    expect(sha256(compressed)).toBe(
      '8292a49d6d3ee845b4d16269a3a72e0f68b677564b9eca9d2a9a85b3c6ed5b6f',
    );
    const raw = gunzipSync(compressed);
    expect(sha256(raw)).toBe(
      'f470bdcdf91c936bd1d29ffebd1ae8cca24e7dd495237c9606f4499c31dba02a',
    );
    const diagnostic = JSON.parse(raw.toString('utf8')) as CalibrationReport;
    const observed: Record<ProfileName, { range: number; slope: number }> = {
      phone: { range: 0, slope: 0 },
      desktop: { range: 0, slope: 0 },
    };
    for (const profile of PROFILE_NAMES) {
      const cycles = diagnostic.profiles[profile].cycles;
      expect(cycles).toHaveLength(12);
      for (let start = 0; start <= cycles.length - 4; start++) {
        const window = cycles.slice(start, start + 4);
        const components = [
          window.map((point) => point.heap.usedSize),
          window.map((point) => point.heap.embedderHeapUsedSize),
          window.map((point) => point.heap.backingStorageSize),
          window.map((point) => point.heap.usedSize
            + point.heap.embedderHeapUsedSize + point.heap.backingStorageSize),
        ];
        const aggregates = components[3]!;
        observed[profile].range = Math.max(observed[profile].range,
          Math.max(...aggregates) - Math.min(...aggregates));
        observed[profile].slope = Math.max(observed[profile].slope, 0, ...components.map(slope));
      }
      expect(observed[profile].range).toBeLessThanOrEqual(
        budget.profiles[profile].warmHeapAggregateRangeBytesMax,
      );
      expect(observed[profile].slope).toBeLessThanOrEqual(
        budget.profiles[profile].warmHeapSlopeBytesPerCycleMax,
      );
    }
    expect(observed).toEqual({
      phone: { range: 206748, slope: 69798 },
      desktop: { range: 223368, slope: 70049.2 },
    });
    expect(observed.phone.slope).toBeGreaterThan(65536);
    expect(observed.desktop.slope).toBeGreaterThan(65536);
  });
});
