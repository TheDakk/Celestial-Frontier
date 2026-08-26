import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import {
  BASELINE_CALIBRATION_EVIDENCE_SCHEMA,
  BROKEN_BASELINE_EXPECTED_FAULTS, BUDGET_SCHEMA, CEILING_FIELDS,
  CANDIDATE_CALIBRATION_EVIDENCE_SCHEMA,
  COMPENDIUM_BROWSER_AUTHORITY_SCHEMA, COMPENDIUM_BROWSER_AUTHORITY_SCOPE,
  COMPENDIUM_MEASUREMENT_AUTHORITY_INPUT_KEYS,
  EXPECTED_OUTCOMES, OUTCOME_IDS, PROFILES, SAMPLE_METRIC_FIELDS,
  calibrationMetrics, candidateCalibrationEvidence,
  compendiumBrowserAuthorityMatches, compendiumBrowserCapabilityInventoryErrors,
  compendiumBudgetBrowserAuthority,
  compendiumMeasurementAuthority, evaluateProfile, validCompendiumBrowserAuthority,
  validateBudgetRecord,
} from '../tools/compendiummem-contract.mjs';
import {
  COMPENDIUM_FIXTURE_SPEC_PATH, buildBrokenBaselineProjection,
  buildCompendiumFixture, stableJson,
} from '../tools/compendiummem-fixture.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const v2Root = path.resolve(here, '..');
const budgetPath = path.join(here, '..', 'budgets', 'compendium-memory-v1.json');
const schemaPath = path.join(here, '..', 'budgets', 'compendium-memory-v1.schema.json');
const retainedLinuxReportPath = path.join(
  v2Root, '..', '..', 'audits', 'PR32_LINUX_MEMORY_REPORT_32441023665.json.gz',
);
const latestHostedFailureEvidence = Object.freeze({
  file: 'PR34_COMPENDIUM_GHA_32677088518_FAILURE.json.gz',
  runId: 'gha-32677088518-1-compendiummem',
  sourceCommit: '8fecd69a9f3c9a8073ec893bd9a45e693d99939a',
  budgetSha256: '208af9558317cae7748f01470dd50e608485d4a197212ecd04db823f7c15a424',
  measurementAuthoritySha256: 'cfc40f891e817c54c5b382cd5ef39ff606a0af27e1c142382c19da3d213edf0a',
  collectorSha256: '50c28928c7aac758c2b19d0a7c52de1d05f730d03e293b0d83fa324cdd300cf7',
  producerAuthoritySha256: '5a316197d9aca27967f4e930f43089d2bbe2b9e4a66a40c207ea59c809405d94',
  rawSha256: '544015e9e8e9e09e6ad6e13c5be40e7629f3e5884e55a147c503234a754f45da',
  gzipSha256: 'cc5ed778f402763f34ceb76785f080b56d61f6067033087b6fe1143a492a28c9',
});
const currentEvidence = [
  {
    runId: '20260826-phase4-candidate3',
    file: 'ARC1_COMPENDIUM_PHASE4_CANDIDATE3_20260826.json.gz',
    rawSha256: 'ae06ead7d67aa3c76da1c7b99dbef7f653da4780c8e21da758d7d1c71445849c',
    gzipSha256: '383a3b1e597f924bfc5107aaccabb7ccd19b7251121481c446ef92d36a2a0a36',
  },
  {
    runId: '20260826-phase4-candidate5',
    file: 'ARC1_COMPENDIUM_PHASE4_CANDIDATE5_20260826.json.gz',
    rawSha256: '9608f835b28c8fadf8899bb014375b7c6546c9c84b2586d3249f75a8a229aa51',
    gzipSha256: '43e3fef9003340a2ac111d63f3af5422d3af9e8fefb4a0ecaadf240a2830b97a',
  },
  {
    runId: '20260826-phase4-candidate6',
    file: 'ARC1_COMPENDIUM_PHASE4_CANDIDATE6_20260826.json.gz',
    rawSha256: '6a3e7d9b7d638a954620e7ba265a3d7787cc8b7f83954533fe215bc282a7931a',
    gzipSha256: '9e2bb5fbeea3665756e070bd0bc68cfe3383416228a4de99749be2b75b12febe',
  },
] as const;
const currentBaselineEvidence = Object.freeze({
  file: 'ARC1_COMPENDIUM_PHASE4_BASELINE1_SAMPLE_20260826.json.gz',
  rawSha256: '24076ba17f0407029e495f56c807ad35fb13c944a4c6bf8f566ec65f136eaec5',
  gzipSha256: 'faae83b7168bb12c9140f3c80be734990f840b3747559a7be690f7d60d15653c',
});
const historicalCertificationEvidence = Object.freeze({
  file: 'ARC1_COMPENDIUM_FOCUS_SETTLEMENT_CERTIFICATION_20260823.json.gz',
  runId: '20260823-pr33-focus-settlement-certification',
  sourceCommit: 'e8898bf3a12d094eefc99fe188a217d9e60058a0',
  budgetSha256: '28b958678fa2e95bb7b906cb10bd1a422dfe0b52867400e8722fbf6befddb15d',
  rawSha256: 'd1ea225b913c28a2b9110538d064e3df6609582dc94c875f62a622998ac55071',
  gzipSha256: '8e09255b616f9539a8dee5e180df00c8f03d211f3da7eac82529397a6f3b1966',
});
const supersededRowActivationCertificationEvidence = Object.freeze({
  file: 'PR34_COMPENDIUM_ROW_ACTIVATION_CERTIFICATION_20260823.json.gz',
  runId: '20260823-pr34-row-activation-certification',
  sourceCommit: '7de42c6bb02f4c7af26053fa7a4cf45f5fbdc777',
  budgetSha256: '208af9558317cae7748f01470dd50e608485d4a197212ecd04db823f7c15a424',
  rawSha256: 'ea31612f16c978d30a40d8b6465f89e4e6f10f23b35ae996919e5ed0c7656108',
  gzipSha256: '1c6c12faaf984716c31aecb8b1e5c11767ed998892c6bd4eba9f4edf23a0f1eb',
});
const supersededRenderStableCertificationEvidence = Object.freeze({
  file: 'PR34_COMPENDIUM_RENDER_STABLE_CERTIFICATION_20260823.json.gz',
  runId: '20260823-pr34-render-stable-row-certification',
  sourceCommit: 'd21ba26a7efe8a887cbc0887ac132e19787f4abb',
  budgetSha256: 'faa160b39accde00c34edb3005c938bd8bb4fb68a328bbd0a8c7f628c0a98d3d',
  rawSha256: '42753d5ef5df69d7d30db37ae80ee77ab498567e06e868c2967e01cc33d352c9',
  gzipSha256: 'a2ff5b009a187fabdbc71143dac1b33c4f5f609fbb3c3d81c750fb5857593be1',
});
const PROFILE_NAMES = ['phone', 'desktop'] as const;
const EXPECTED_MEASUREMENT_AUTHORITY =
  'cb5cd9f86ac99435028f98af800bc0d89de96bd7db88694214d832eed83fb15d';
const EXPECTED_COLLECTOR_AUTHORITY =
  '18e05ddf03551e7ec5d8352280ed5ad43fa6bf684f1ebecca1242890e02c3d88';
const HISTORICAL_MEASUREMENT_AUTHORITY =
  '6a961df806e460d6ed02600f5366485d09d0878efa0129960b683cc4037173c7';
const EXPECTED_PRODUCER_AUTHORITY =
  '587d3bdfab471370e625c71d1658e391067881fe824ce14ccfaf7200eb6e4d73';
type BrowserAuthority = {
  schema: string;
  scope: string;
  family: string;
  protocolVersion: string;
  capabilityContract: string;
  capabilityContractSha256: string;
};
const EXPECTED_BROWSER_AUTHORITY: BrowserAuthority = {
  schema: COMPENDIUM_BROWSER_AUTHORITY_SCHEMA,
  scope: COMPENDIUM_BROWSER_AUTHORITY_SCOPE,
  family: 'microsoft-edge',
  protocolVersion: '1.3',
  capabilityContract: 'cf-v2-compendium-cdp-capabilities/v1',
  capabilityContractSha256: '6eed33ed9784f7c7774c4b1bf8d4e880986e31667324d9a1aa7b8dd62fe5a476',
};
type LegacyBrowserAuthority = {
  schema: 'cf-v2-compendium-browser-authority/v1';
  scope: 'arc1a-compendium-memory-only';
  product: string;
  revision: string;
  jsVersion: string;
  protocolVersion: string;
};
const HISTORICAL_EDGE_101_BROWSER_AUTHORITY: LegacyBrowserAuthority = Object.freeze({
  schema: 'cf-v2-compendium-browser-authority/v1',
  scope: 'arc1a-compendium-memory-only',
  product: 'Edg/151.0.4129.101',
  revision: '@cc1d9f4080fd9140611a9600b8d1615db310105d',
  jsVersion: '15.1.23.9',
  protocolVersion: '1.3',
});
const HISTORICAL_EDGE_101_PRODUCER_AUTHORITY =
  '5a316197d9aca27967f4e930f43089d2bbe2b9e4a66a40c207ea59c809405d94';
const EXPECTED_CANDIDATE_RUNS = [
  '20260826-phase4-candidate3',
  '20260826-phase4-candidate5',
  '20260826-phase4-candidate6',
] as const;
const EXPECTED_BASELINE_RUN = '20260826-phase4-baseline1';

type ProfileName = typeof PROFILE_NAMES[number];
type CalibrationSample = {
  runId: string;
  commit: string;
  inputDigest: string;
  measurementAuthoritySha256: string;
  producerAuthoritySha256?: string;
  browser: {
    product: string;
    revision: string;
    jsVersion: string;
    protocolVersion: string;
  };
  metrics: Record<string, number>;
  evidence: { schema: string };
  observedFaults?: string[];
};
type ProfileCeiling = { rationale: string; [field: string]: string | number };
type ActiveBudgetRecord = {
  status: string;
  browserAuthority: BrowserAuthority;
  measurementAuthority: { sha256: string };
  producerAuthority: { sha256: string };
  calibration: {
    requiredIndependentRunsPerProfile: number;
    selectionRule: string;
    samples: Record<ProfileName, CalibrationSample[]>;
  };
  pairedBrokenBaseline: {
    status: string;
    commit: string;
    collectorCommit: string | null;
    samples: Record<ProfileName, CalibrationSample[]>;
  };
  ceilings: Record<ProfileName, ProfileCeiling> | null;
};
type RetainedLinuxOutcome = {
  id: string;
  status: string;
  diagnosis?: string;
  evidence?: {
    warmHeapAggregateRange?: number;
    observed?: { portraitEncodedBytesMax?: number };
  };
};
type RetainedLinuxReport = {
  schema: string;
  runId: string;
  status: string;
  source: {
    begin: Record<string, string>;
    end: Record<string, string>;
  };
  inputs: Record<string, string>;
  browser: Record<string, string>;
  budget: {
    status: string;
    path: string;
    sha256: string;
    browserAuthority: BrowserAuthority;
    browserAuthorityMatch: boolean;
    producerAuthority: Record<string, unknown>;
    observedProducerAuthority: Record<string, unknown>;
    producerAuthorityMatch: boolean;
  };
  policy: Record<string, number>;
  lifecycle: { schema: string; status: string };
  outcomes: RetainedLinuxOutcome[];
  findings: string[];
  profiles: Record<ProfileName, Parameters<typeof evaluateProfile>[0]>;
  partialFailure: null;
  blockedOutcomes: string[];
};

const EXPECTED_SAMPLE_OBJECT_SHA256: Record<ProfileName, {
  candidate: readonly string[]; baseline: string;
}> = {
  phone: {
    candidate: [
      '03885d5df3618fa4c84e69c740b64e74d1bb80abb71d50e719b8b1d523f20354',
      'a531e25965d349fcfd289b21b310a27dfaf2c936511fa40989ecb12f7829fb24',
      'e9873249f91b6c3d4872796e58974a652996bfed16727a42c8a861015ee92861',
    ],
    baseline: '21b6b72e9679c2362922f2495878fd42ecfd8dd95e2d69de9849cc125fe95426',
  },
  desktop: {
    candidate: [
      'bd83077bdd6e5e3141b7047440f9216846438ef99a85940be6e10d0f84383bbe',
      '17489ed5c50f111829c9a7fb6ec2713715aeb0a2666ba7e4a8b9afe7a0e97e55',
      '2861984ea7f29067dd0daf997bdc434c5195e333fab974a4a3f09065466b221b',
    ],
    baseline: '49447f67ea294379cbdf5a85a704d87354cca2201a4ab29c49aa663a7aa31b8d',
  },
};

const EXPECTED_CEILINGS: Record<ProfileName, Record<string, number>> = {
  phone: {
    mountedRowsMax: 16,
    heapUsedBytesMax: 10_485_760,
    documentsMax: 2.5,
    nodesMax: 960,
    embedderHeapUsedBytesMax: 4_194_304,
    backingStorageBytesMax: 4_194_304,
    heapAggregateBytesMax: 16_777_216,
    jsEventListenersMax: 96,
    liveCacheEntriesMax: 96.5,
    liveDecodedPixelsMax: 1_672_705,
    liveDecodedBytesMax: 6_690_817,
    liveEncodedBytesMax: 2_621_440,
    queuedJobsPeakMax: 24,
    activeJobsPeakMax: 1.5,
    liveLeasesMax: 24,
    liveSubscribersMax: 0.5,
    livePortraitCacheEntriesMax: 1.5,
    livePortraitEncodedBytesMax: 262_144,
    warmHeapAggregateRangeBytesMax: 262_144,
    warmEncodedBytesRangeMax: 0.5,
  },
  desktop: {
    mountedRowsMax: 16,
    heapUsedBytesMax: 14_680_064,
    documentsMax: 2.5,
    nodesMax: 960,
    embedderHeapUsedBytesMax: 4_194_304,
    backingStorageBytesMax: 6_291_456,
    heapAggregateBytesMax: 20_971_520,
    jsEventListenersMax: 96,
    liveCacheEntriesMax: 256.5,
    liveDecodedPixelsMax: 4_460_545,
    liveDecodedBytesMax: 17_842_177,
    liveEncodedBytesMax: 6_815_744,
    queuedJobsPeakMax: 24,
    activeJobsPeakMax: 1.5,
    liveLeasesMax: 24,
    liveSubscribersMax: 0.5,
    livePortraitCacheEntriesMax: 1.5,
    livePortraitEncodedBytesMax: 262_144,
    warmHeapAggregateRangeBytesMax: 524_288,
    warmEncodedBytesRangeMax: 0.5,
  },
};

const RETAINED_LINUX_COMPATIBILITY = Object.freeze({
  runId: '32441023665',
  reportRunId: 'gha-32441023665-1-compendiummem',
  reportSha256: 'a486fe8eb96e9f00cbd3df486079deaa4e9e0987bed01ae870bf2201cbd47e36',
  gzipSha256: 'a3b67e70881b725266a0fb669f027b51141967a4ff2193e011ed3b1d124a0916',
  originalBudgetSha256: '546d3a817073e42910b496895734ae2a01bb4c633af2780ecde1b1ef6570b292',
  source: Object.freeze({
    commit: 'ff38629db5dfb3936c8d0926cfee125f905e2a7b',
    branch: 'detached',
    state: 'committed',
    statusSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    workingTreeSha256: 'f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a',
  }),
  phone: Object.freeze({
    warmHeapAggregateRangeBytes: 97_320,
    livePortraitEncodedBytes: 220_530,
  }),
  desktop: Object.freeze({
    livePortraitEncodedBytes: 220_530,
  }),
});
const RETAINED_LINUX_BROWSER_AUTHORITY: LegacyBrowserAuthority = Object.freeze({
  schema: 'cf-v2-compendium-browser-authority/v1',
  scope: COMPENDIUM_BROWSER_AUTHORITY_SCOPE,
  product: 'Edg/151.0.4129.86',
  revision: '@083e754915c9ab93da1d8f7b9c860e4520273900',
  jsVersion: '15.1.23.7',
  protocolVersion: '1.3',
});
const RETAINED_LINUX_PRODUCER_AUTHORITY =
  'd32231773e4e06db4074111b49ebe2eca698d5004bd5af3fbd8d2867d765b900';
const RETAINED_LINUX_COLLECTOR_AUTHORITY =
  '0c7ec3ba5b41f7ee0766c6986a27e75b3c22c00009419fbf540d4de280d6315b';
const RETAINED_LINUX_MEASUREMENT_AUTHORITY =
  '23aacc2cda6b46ae022c7cfaac70929fb2cd1f310fa846208bd5b2486c2c5b92';

function sampleObjectSha256(sample: CalibrationSample): string {
  return createHash('sha256').update(JSON.stringify(sample)).digest('hex');
}

function fileSha256(file: string): string {
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function currentMeasurementAuthority(fixtureRowsSha256: string) {
  return compendiumMeasurementAuthority({
    fixtureSpec: fileSha256(COMPENDIUM_FIXTURE_SPEC_PATH),
    fixtureRows: fixtureRowsSha256,
    fixtureGenerator: fileSha256(path.join(v2Root, 'tools', 'compendiummem-fixture.mjs')),
    budgetSchema: fileSha256(schemaPath),
    outcomeContract: fileSha256(path.join(v2Root, 'tools', 'compendiummem-contract.mjs')),
    collector: fileSha256(path.join(v2Root, 'tools', 'compendiummem.mjs')),
    browserCdp: fileSha256(path.join(v2Root, 'tools', 'browsercdp.mjs')),
    browserPath: fileSha256(path.join(v2Root, 'tools', 'browserpath.mjs')),
    workspaceLock: fileSha256(path.join(v2Root, 'tools', 'workspacelock.mjs')),
    package: fileSha256(path.join(v2Root, 'package.json')),
    packageLock: fileSha256(path.join(v2Root, 'package-lock.json')),
    appPackage: fileSha256(path.join(v2Root, 'apps', 'game', 'package.json')),
    baselineSaveFixtures: fileSha256(path.join(
      v2Root, '..', 'baseline-v1.8.9', 'save-fixtures.json',
    )),
    speciesArtBuildGraph: fileSha256(path.join(v2Root, 'tools', 'speciesart-build.mjs')),
    outcomeInventory: createHash('sha256').update(stableJson(EXPECTED_OUTCOMES)).digest('hex'),
  });
}

function authorityKey(sample: CalibrationSample): string {
  const { product, revision, jsVersion, protocolVersion } = sample.browser;
  return [product, revision, jsVersion, protocolVersion].join('\0');
}

function rawBrowserForAuthority(
  authority: BrowserAuthority,
  provenance: Partial<Record<'product' | 'revision' | 'jsVersion' | 'protocolVersion', string>> = {},
): Record<string, string> {
  return {
    executable: '/isolated/microsoft-edge',
    product: provenance.product ?? 'Edg/151.0.4129.101',
    revision: provenance.revision ?? '@cc1d9f4080fd9140611a9600b8d1615db310105d',
    userAgent: 'host-specific user agent',
    jsVersion: provenance.jsVersion ?? '15.1.23.9',
    protocolVersion: provenance.protocolVersion ?? authority.protocolVersion,
  };
}

function strictHeadroomFailures(record: ActiveBudgetRecord): string[] {
  if (!record.ceilings) return ['ceilings'];
  const failures: string[] = [];
  for (const profile of PROFILE_NAMES) {
    for (const [index, ceilingField] of CEILING_FIELDS.entries()) {
      const sampleField = SAMPLE_METRIC_FIELDS[index];
      if (!sampleField) throw new Error(`missing sample metric for ${ceilingField}`);
      const measuredMax = Math.max(...record.calibration.samples[profile]
        .map((sample) => sample.metrics[sampleField] ?? Number.POSITIVE_INFINITY));
      const ceiling = record.ceilings[profile][ceilingField];
      if (typeof ceiling !== 'number' || !(ceiling > measuredMax)) {
        failures.push(`${profile}.${ceilingField}`);
      }
    }
  }
  return failures;
}

describe('Arc 1A Compendium budget authority', () => {
  const fixture = buildCompendiumFixture();
  const baselineProjection = buildBrokenBaselineProjection(fixture);
  const budget = JSON.parse(fs.readFileSync(budgetPath, 'utf8')) as Record<string, unknown>;
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8')) as Record<string, unknown>;
  const activeBudget = budget as unknown as ActiveBudgetRecord;
  const liveMeasurementAuthority = currentMeasurementAuthority(fixture.rowsSha256);

  it('owns a strict v2 record and schema bound to the sealed 1,500-row input', () => {
    expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
    expect(schema.additionalProperties).toBe(false);
    expect(budget.schema).toBe(BUDGET_SCHEMA);
    expect(budget.browserAuthority).toEqual(EXPECTED_BROWSER_AUTHORITY);
    expect(compendiumBudgetBrowserAuthority(budget)).toEqual(EXPECTED_BROWSER_AUTHORITY);
    expect(liveMeasurementAuthority?.sha256).toBe(EXPECTED_MEASUREMENT_AUTHORITY);
    expect(budget.measurementAuthority).toEqual(liveMeasurementAuthority);
    expect(validateBudgetRecord(
      budget, fixture.rowsSha256, baselineProjection.rowsSha256, liveMeasurementAuthority,
    ))
      .toEqual({ ok: true, errors: [] });
    expect((budget.pairedBrokenBaseline as { projectionRowsSha256: string }).projectionRowsSha256)
      .toBe(baselineProjection.rowsSha256);
  });

  it('retains the exact hosted render-boundary failure and its passive-poll diagnosis', () => {
    const compressed = fs.readFileSync(path.join(
      v2Root, '..', '..', 'audits', latestHostedFailureEvidence.file,
    ));
    expect(createHash('sha256').update(compressed).digest('hex'))
      .toBe(latestHostedFailureEvidence.gzipSha256);
    const raw = gunzipSync(compressed);
    expect(createHash('sha256').update(raw).digest('hex'))
      .toBe(latestHostedFailureEvidence.rawSha256);
    const report = JSON.parse(raw.toString('utf8')) as {
      schema: string; runId: string; status: string;
      lifecycle: { schema: string; status: string };
      source: { begin: Record<string, string>; end: Record<string, string> };
      inputs: Record<string, string>;
      browser: Record<string, string>;
      budget: {
        sha256: string; browserAuthorityMatch: boolean; producerAuthorityMatch: boolean;
        producerAuthority: { sha256: string }; observedProducerAuthority: unknown;
      };
      outcomes: unknown[]; findings: string[]; blockedOutcomes: string[];
      partialFailure: {
        classification: string; profile: string; lastCompletedStage: string;
        failingStage: string; command: Record<string, any>;
      };
      profiles: Record<string, {
        completedStages: string[]; commandLedger: Array<Record<string, any>>;
      }>;
    };
    expect(report).toMatchObject({
      schema: 'cf-v2-compendium-memory-report/v1',
      runId: latestHostedFailureEvidence.runId,
      status: 'product-unanswerable',
      lifecycle: { schema: 'cf-v2-compendium-report-lifecycle/v1', status: 'complete' },
    });
    expect(report.source.begin).toEqual(report.source.end);
    expect(report.source.begin).toMatchObject({
      commit: latestHostedFailureEvidence.sourceCommit,
      branch: 'detached', state: 'committed',
      statusSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    });
    expect(report.inputs.budget).toBe(latestHostedFailureEvidence.budgetSha256);
    expect(report.inputs.collector).toBe(latestHostedFailureEvidence.collectorSha256);
    expect(compendiumMeasurementAuthority(report.inputs)?.sha256)
      .toBe(latestHostedFailureEvidence.measurementAuthoritySha256);
    expect(report.browser).toMatchObject({
      product: HISTORICAL_EDGE_101_BROWSER_AUTHORITY.product,
      revision: HISTORICAL_EDGE_101_BROWSER_AUTHORITY.revision,
      js_version: HISTORICAL_EDGE_101_BROWSER_AUTHORITY.jsVersion,
      protocol_version: HISTORICAL_EDGE_101_BROWSER_AUTHORITY.protocolVersion,
    });
    expect(report.budget).toMatchObject({
      sha256: latestHostedFailureEvidence.budgetSha256,
      browserAuthorityMatch: true, producerAuthorityMatch: true,
      producerAuthority: { sha256: latestHostedFailureEvidence.producerAuthoritySha256 },
    });
    expect(report.budget.observedProducerAuthority).toEqual(report.budget.producerAuthority);
    expect(report.outcomes).toEqual([]);
    expect(report.blockedOutcomes).toEqual(EXPECTED_OUTCOMES);
    expect(report.findings).toEqual([
      'product: desktop row cmem-0777-filter-beacon: target Runtime.evaluate missed the 51ms deadline while the root heartbeat remained timely',
    ]);
    expect(report.partialFailure).toMatchObject({
      classification: 'product-unanswerable', profile: 'desktop',
      lastCompletedStage: 'pre-detail Back anchor',
      failingStage: 'row cmem-0777-filter-beacon',
      command: {
        label: 'row cmem-0777-filter-beacon', timeoutMs: 51,
        target: { status: 'rejected', timely: false },
        heartbeat: { status: 'fulfilled', timely: true },
      },
    });
    const desktop = report.profiles.desktop!;
    expect(desktop.completedStages).toContain('row cmem-0777-filter-beacon activation receipt');
    expect(desktop.completedStages).toContain('440 detail');
    expect(desktop.completedStages).toContain('settled scroll visibility 777');
    const failedPhaseDeadline = report.partialFailure.command.phaseDeadlineMs;
    const passivePhase = desktop.commandLedger.filter((command) =>
      command.label === 'row cmem-0777-filter-beacon'
      && command.phaseDeadlineMs === failedPhaseDeadline);
    expect(passivePhase).toHaveLength(112);
    expect(passivePhase.slice(0, -1).every((command) =>
      command.target.status === 'fulfilled' && command.target.timely === true)).toBe(true);
    expect(passivePhase.at(-1)).toEqual(report.partialFailure.command);
    expect(report.partialFailure.command.target.durationMs).toBeCloseTo(51.791665, 5);
    expect(report.partialFailure.command.heartbeat.durationMs).toBeCloseTo(2.386498, 5);
  });

  it('keeps strict metric and ceiling schema keys identical to the semantic contract', () => {
    type StrictObjectDefinition = {
      required: string[]; properties: Record<string, unknown>; additionalProperties: boolean;
    };
    const definitions = schema.$defs as {
      browserAuthority: StrictObjectDefinition;
      metrics: StrictObjectDefinition; ceiling: StrictObjectDefinition;
      candidateSample: StrictObjectDefinition; baselineSample: StrictObjectDefinition;
    };
    const measurementAuthority = (schema.properties as {
      measurementAuthority: { properties: { inputs: StrictObjectDefinition } };
    }).measurementAuthority;
    expect(measurementAuthority.properties.inputs.additionalProperties).toBe(false);
    expect([...measurementAuthority.properties.inputs.required].sort())
      .toEqual([...COMPENDIUM_MEASUREMENT_AUTHORITY_INPUT_KEYS].sort());
    expect(Object.keys(measurementAuthority.properties.inputs.properties).sort())
      .toEqual([...COMPENDIUM_MEASUREMENT_AUTHORITY_INPUT_KEYS].sort());
    expect(definitions.browserAuthority.additionalProperties).toBe(false);
    expect([...definitions.browserAuthority.required].sort()).toEqual([
      'schema', 'scope', 'family', 'protocolVersion', 'capabilityContract',
      'capabilityContractSha256',
    ].sort());
    expect(Object.keys(definitions.browserAuthority.properties).sort()).toEqual([
      'schema', 'scope', 'family', 'protocolVersion', 'capabilityContract',
      'capabilityContractSha256',
    ].sort());
    expect(definitions.metrics.additionalProperties).toBe(false);
    expect([...definitions.metrics.required].sort()).toEqual([...SAMPLE_METRIC_FIELDS].sort());
    expect(Object.keys(definitions.metrics.properties).sort()).toEqual([...SAMPLE_METRIC_FIELDS].sort());
    expect(definitions.ceiling.additionalProperties).toBe(false);
    expect([...definitions.ceiling.required].sort()).toEqual(['rationale', ...CEILING_FIELDS].sort());
    expect(Object.keys(definitions.ceiling.properties).sort()).toEqual(['rationale', ...CEILING_FIELDS].sort());
    expect(definitions.candidateSample.additionalProperties).toBe(false);
    expect(definitions.candidateSample.required).toContain('producerAuthoritySha256');
    expect(definitions.candidateSample.required).toContain('evidence');
    expect(Object.keys(definitions.candidateSample.properties)).not.toContain('observedFaults');
    expect(definitions.baselineSample.additionalProperties).toBe(false);
    expect(definitions.baselineSample.required).toContain('observedFaults');
    expect(definitions.baselineSample.required).toContain('evidence');
    expect(Object.keys(definitions.baselineSample.properties))
      .not.toContain('producerAuthoritySha256');
    expect([...(schema.$defs as { brokenFault: { enum: string[] } }).brokenFault.enum].sort())
      .toEqual([...BROKEN_BASELINE_EXPECTED_FAULTS].sort());
    expect([...(budget.pairedBrokenBaseline as { expectedFaults: string[] }).expectedFaults].sort())
      .toEqual([...BROKEN_BASELINE_EXPECTED_FAULTS].sort());
  });

  it('seals the exact CDP capability inventory used by the version-tolerant ruler', () => {
    const collectorSource = fs.readFileSync(
      path.join(v2Root, 'tools', 'compendiummem.mjs'), 'utf8',
    );
    const browserCdpSource = fs.readFileSync(
      path.join(v2Root, 'tools', 'browsercdp.mjs'), 'utf8',
    );
    expect(compendiumBrowserCapabilityInventoryErrors({
      collectorSource, browserCdpSource,
    })).toEqual([]);
    for (const method of [
      'Emulation.setDeviceMetricsOverride', 'HeapProfiler.collectGarbage',
      'Input.dispatchMouseEvent', 'Memory.getDOMCounters', 'Page.captureScreenshot',
      'Runtime.getHeapUsage', 'Target.createBrowserContext',
    ]) {
      const mutated = collectorSource.replaceAll(`'${method}'`, `'Removed.${method}'`);
      expect(mutated, `${method} mutation must change source`).not.toBe(collectorSource);
      expect(compendiumBrowserCapabilityInventoryErrors({
        collectorSource: mutated, browserCdpSource,
      }).join('\n'), method).toContain(`missing ${method}`);
    }
    expect(compendiumBrowserCapabilityInventoryErrors({
      collectorSource: `${collectorSource}\nconst injected = 'Runtime.compileScript';`,
      browserCdpSource,
    }).join('\n')).toContain('unsealed Runtime.compileScript');
    expect(compendiumBrowserCapabilityInventoryErrors({
      collectorSource,
      browserCdpSource: browserCdpSource.replaceAll('Browser.getVersion', 'Browser.getVersionRemoved'),
    }).join('\n')).toContain('lacks Browser.getVersion provenance');
  });

  it('activates only the version-tolerant Arc-local Edge compatibility authority and samples', () => {
    if (activeBudget.status === 'calibration-required') {
      expect(activeBudget.browserAuthority).toEqual(EXPECTED_BROWSER_AUTHORITY);
      expect(activeBudget.measurementAuthority.sha256).toBe(EXPECTED_MEASUREMENT_AUTHORITY);
      expect(activeBudget.producerAuthority.sha256).toBe(EXPECTED_PRODUCER_AUTHORITY);
      expect(activeBudget.ceilings).toBeNull();
      expect(activeBudget.calibration.requiredIndependentRunsPerProfile).toBe(3);
      for (const profile of PROFILE_NAMES) {
        expect(activeBudget.calibration.samples[profile]).toEqual([]);
        expect(activeBudget.pairedBrokenBaseline.samples[profile]).toEqual([]);
      }
      expect(activeBudget.pairedBrokenBaseline.status).toBe('measurement-required');
      expect(activeBudget.pairedBrokenBaseline.commit)
        .toBe('38447019517147319bd08c598202d097ee866874');
      expect(activeBudget.pairedBrokenBaseline.collectorCommit).toBeNull();
      expect(activeBudget.calibration.selectionRule).toContain('version-tolerant');
      expect(activeBudget.calibration.selectionRule).toContain('provenance only');
      expect(activeBudget.calibration.selectionRule).toContain('do not trigger recalibration');
      expect(activeBudget.calibration.selectionRule).toContain(HISTORICAL_MEASUREMENT_AUTHORITY);
      expect(activeBudget.calibration.selectionRule).toContain('historical');
      expect(activeBudget.calibration.selectionRule).toContain('All earlier samples');
      expect(activeBudget.calibration.selectionRule).toContain('32677088518');
      expect(activeBudget.calibration.selectionRule)
        .toContain(latestHostedFailureEvidence.rawSha256);
      expect(activeBudget.calibration.selectionRule).toContain('113 passive observations');
      expect(activeBudget.calibration.selectionRule).toContain('double-render settlement');
      expect(activeBudget.calibration.selectionRule).toContain(EXPECTED_COLLECTOR_AUTHORITY);
      expect(activeBudget.calibration.selectionRule).toContain(EXPECTED_MEASUREMENT_AUTHORITY);
      expect(activeBudget.calibration.selectionRule).toContain('one attempt');
      expect(activeBudget.calibration.selectionRule).toContain('zero retries');
      expect(activeBudget.calibration.selectionRule).toContain('strict measured headroom');
      expect(activeBudget.calibration.selectionRule)
        .toContain('does not re-pin Gate A');
      expect((budget.measurementAuthority as {
        inputs: { collector: string };
      }).inputs.collector).toBe(EXPECTED_COLLECTOR_AUTHORITY);
      return;
    }
    expect(activeBudget.status).toBe('active');
    expect(activeBudget.browserAuthority).toEqual(EXPECTED_BROWSER_AUTHORITY);
    expect(activeBudget.ceilings).not.toBeNull();
    expect(activeBudget.measurementAuthority.sha256).toBe(EXPECTED_MEASUREMENT_AUTHORITY);
    expect(activeBudget.producerAuthority.sha256).toBe(EXPECTED_PRODUCER_AUTHORITY);
    const candidateRuns = activeBudget.calibration.samples.phone.map((sample) => sample.runId);
    expect(candidateRuns).toEqual(EXPECTED_CANDIDATE_RUNS);
    for (const profile of PROFILE_NAMES) {
      expect(activeBudget.calibration.samples[profile].map((sample) => sample.runId))
        .toEqual(candidateRuns);
      expect(new Set(activeBudget.calibration.samples[profile]
        .map((sample) => sample.commit)).size).toBe(1);
      expect(new Set(activeBudget.calibration.samples[profile]
        .map((sample) => sample.inputDigest)).size).toBe(1);
      expect(new Set(activeBudget.calibration.samples[profile]
        .map((sample) => sample.measurementAuthoritySha256))).toEqual(new Set([
        (budget.measurementAuthority as { sha256: string }).sha256,
      ]));
      expect(new Set(activeBudget.calibration.samples[profile]
        .map((sample) => sample.producerAuthoritySha256))).toEqual(new Set([
        activeBudget.producerAuthority.sha256,
      ]));
      expect(new Set(activeBudget.calibration.samples[profile]
        .map((sample) => sample.evidence.schema))).toEqual(new Set([
        CANDIDATE_CALIBRATION_EVIDENCE_SCHEMA,
      ]));
      expect(activeBudget.pairedBrokenBaseline.samples[profile]).toHaveLength(1);
      expect(activeBudget.pairedBrokenBaseline.samples[profile][0]
        ?.measurementAuthoritySha256)
        .toBe((budget.measurementAuthority as { sha256: string }).sha256);
      expect(activeBudget.pairedBrokenBaseline.samples[profile][0]?.evidence.schema)
        .toBe(BASELINE_CALIBRATION_EVIDENCE_SCHEMA);
    }
    expect(activeBudget.pairedBrokenBaseline.status).toBe('measured');
    expect(activeBudget.pairedBrokenBaseline.commit)
      .toBe('38447019517147319bd08c598202d097ee866874');
    expect(activeBudget.pairedBrokenBaseline.collectorCommit)
      .toBe(activeBudget.calibration.samples.phone[0]?.commit);
    expect(activeBudget.pairedBrokenBaseline.samples.phone[0]?.runId)
      .toBe(EXPECTED_BASELINE_RUN);
    expect(activeBudget.pairedBrokenBaseline.samples.desktop[0]?.runId)
      .toBe(EXPECTED_BASELINE_RUN);

    const everySample = PROFILE_NAMES.flatMap((profile) => [
      ...activeBudget.calibration.samples[profile],
      ...activeBudget.pairedBrokenBaseline.samples[profile],
    ]);
    expect(everySample.every((sample) =>
      compendiumBrowserAuthorityMatches(sample.browser, activeBudget.browserAuthority))).toBe(true);
    for (const samples of [
      activeBudget.calibration.samples,
      activeBudget.pairedBrokenBaseline.samples,
    ]) {
      const byRun = new Map<string, Set<string>>();
      for (const profile of PROFILE_NAMES) {
        for (const sample of samples[profile]) {
          if (!byRun.has(sample.runId)) byRun.set(sample.runId, new Set());
          byRun.get(sample.runId)!.add(authorityKey(sample));
        }
      }
      expect([...byRun.values()].every((keys) => keys.size === 1)).toBe(true);
    }
    expect(activeBudget.calibration.selectionRule).toContain('version-tolerant');
    expect(activeBudget.calibration.selectionRule).toContain('raw-capsule');
    expect(activeBudget.calibration.selectionRule).toContain('strictly above');
    expect(activeBudget.calibration.selectionRule).toContain('rational headroom');
    expect(activeBudget.calibration.selectionRule).toContain(EXPECTED_PRODUCER_AUTHORITY);
    expect(activeBudget.calibration.selectionRule)
      .toContain('does not re-pin the Gate-A/global browser');
  });

  it('pins the exact sealed raw sample objects selected from all four local runs', () => {
    if (activeBudget.status === 'calibration-required') {
      for (const profile of PROFILE_NAMES) {
        expect(activeBudget.calibration.samples[profile]).toEqual([]);
        expect(activeBudget.pairedBrokenBaseline.samples[profile]).toEqual([]);
      }
      return;
    }
    for (const profile of PROFILE_NAMES) {
      expect(activeBudget.calibration.samples[profile].map(sampleObjectSha256))
        .toEqual(EXPECTED_SAMPLE_OBJECT_SHA256[profile].candidate);
      expect(activeBudget.pairedBrokenBaseline.samples[profile].map(sampleObjectSha256))
        .toEqual([EXPECTED_SAMPLE_OBJECT_SHA256[profile].baseline]);
      expect(activeBudget.pairedBrokenBaseline.samples[profile][0]?.observedFaults)
        .toEqual(BROKEN_BASELINE_EXPECTED_FAULTS);
    }
  });

  it('re-derives every selected current-product sample from durable raw evidence', () => {
    if (activeBudget.status === 'calibration-required') return;
    for (const evidence of currentEvidence) {
      const compressed = fs.readFileSync(path.join(v2Root, '..', '..', 'audits', evidence.file));
      expect(createHash('sha256').update(compressed).digest('hex')).toBe(evidence.gzipSha256);
      const raw = gunzipSync(compressed);
      expect(createHash('sha256').update(raw).digest('hex')).toBe(evidence.rawSha256);
      const report = JSON.parse(raw.toString('utf8')) as {
        schema: string; runId: string; status: string; startedAt: string; endedAt: string;
        lifecycle: { status: string }; source: { begin: Record<string, string>; end: Record<string, string> };
        inputs: Record<string, string>; browser: Record<string, string>;
        budget: { producerAuthority: unknown; observedProducerAuthority: unknown; producerAuthorityMatch: boolean; browserAuthorityMatch: boolean };
        outcomes: Array<{ status: string }>; findings: string[];
        profiles: Record<ProfileName, Parameters<typeof calibrationMetrics>[0]>;
      };
      expect(report).toMatchObject({
        schema: 'cf-v2-compendium-memory-report/v1',
        runId: evidence.runId,
        status: 'calibration',
        lifecycle: { status: 'complete' },
        findings: [],
      });
      expect(report.source.begin).toEqual(report.source.end);
      expect(report.source.begin.state).toBe('committed');
      expect(report.budget.producerAuthorityMatch).toBe(true);
      expect(report.budget.browserAuthorityMatch).toBe(true);
      expect(report.budget.producerAuthority).toEqual(budget.producerAuthority);
      expect(report.budget.observedProducerAuthority).toEqual(budget.producerAuthority);
      expect(report.outcomes).toHaveLength(78);
      expect(report.outcomes.every((outcome) => outcome.status === 'pass')).toBe(true);
      const inputDigest = createHash('sha256').update(stableJson(report.inputs)).digest('hex');
      for (const profile of PROFILE_NAMES) {
        const selected = activeBudget.calibration.samples[profile]
          .find((sample) => sample.runId === evidence.runId);
        expect(selected).toBeDefined();
        const { measuredAt, ...selectedWithoutMeasuredAt } = selected as CalibrationSample & {
          measuredAt: string;
        };
        expect(Date.parse(measuredAt)).toBeGreaterThanOrEqual(Date.parse(report.startedAt));
        expect(Date.parse(measuredAt)).toBeLessThanOrEqual(Date.parse(report.endedAt));
        expect(selectedWithoutMeasuredAt).toEqual({
          runId: evidence.runId,
          commit: report.source.begin.commit,
          workingTreeDigest: report.source.begin.workingTreeSha256,
          inputDigest,
          measurementAuthoritySha256: EXPECTED_MEASUREMENT_AUTHORITY,
          producerAuthoritySha256: EXPECTED_PRODUCER_AUTHORITY,
          sourceState: report.source.begin.state,
          sourceChanged: false,
          fixtureRowsSha256: fixture.rowsSha256,
          browser: {
            executable: report.browser.executable,
            product: report.browser.product,
            revision: report.browser.revision,
            userAgent: report.browser.user_agent,
            jsVersion: report.browser.js_version,
            protocolVersion: report.browser.protocol_version,
          },
          metrics: calibrationMetrics(report.profiles[profile]),
          evidence: candidateCalibrationEvidence(report.profiles[profile], { runId: evidence.runId }),
        });
      }
    }

    const baselineCompressed = fs.readFileSync(path.join(
      v2Root, '..', '..', 'audits', currentBaselineEvidence.file,
    ));
    expect(createHash('sha256').update(baselineCompressed).digest('hex'))
      .toBe(currentBaselineEvidence.gzipSha256);
    const baselineRaw = gunzipSync(baselineCompressed);
    expect(createHash('sha256').update(baselineRaw).digest('hex'))
      .toBe(currentBaselineEvidence.rawSha256);
    const baselineCarrier = JSON.parse(baselineRaw.toString('utf8')) as {
      runId: string; samples: Record<ProfileName, CalibrationSample>;
    };
    expect(baselineCarrier.runId).toBe(EXPECTED_BASELINE_RUN);
    for (const profile of PROFILE_NAMES) {
      expect(baselineCarrier.samples[profile])
        .toEqual(activeBudget.pairedBrokenBaseline.samples[profile][0]);
    }
  });

  it('retains the superseded exact-budget certificate without rebinding it', () => {
    if (activeBudget.status === 'calibration-required') return;
    const compressed = fs.readFileSync(path.join(
      v2Root, '..', '..', 'audits', historicalCertificationEvidence.file,
    ));
    expect(createHash('sha256').update(compressed).digest('hex'))
      .toBe(historicalCertificationEvidence.gzipSha256);
    const raw = gunzipSync(compressed);
    expect(createHash('sha256').update(raw).digest('hex'))
      .toBe(historicalCertificationEvidence.rawSha256);
    const report = JSON.parse(raw.toString('utf8')) as RetainedLinuxReport & {
      expectedOutcomes: string[];
    };
    expect(report).toMatchObject({
      schema: 'cf-v2-compendium-memory-report/v1',
      runId: historicalCertificationEvidence.runId,
      status: 'pass',
      lifecycle: { schema: 'cf-v2-compendium-report-lifecycle/v1', status: 'complete' },
      findings: [],
      partialFailure: null,
      blockedOutcomes: [],
    });
    expect(report.source.begin).toEqual(report.source.end);
    expect(report.source.begin).toMatchObject({
      commit: historicalCertificationEvidence.sourceCommit,
      state: 'committed',
      statusSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    });
    expect(report.inputs.budget).toBe(historicalCertificationEvidence.budgetSha256);
    expect(fileSha256(budgetPath)).not.toBe(historicalCertificationEvidence.budgetSha256);
    expect(report.budget).toMatchObject({
      status: 'active',
      sha256: historicalCertificationEvidence.budgetSha256,
      browserAuthority: HISTORICAL_EDGE_101_BROWSER_AUTHORITY,
      browserAuthorityMatch: true,
      producerAuthorityMatch: true,
    });
    expect(report.budget.producerAuthority).toMatchObject({
      sha256: HISTORICAL_EDGE_101_PRODUCER_AUTHORITY,
    });
    expect(report.budget.observedProducerAuthority).toEqual(report.budget.producerAuthority);
    expect(report.budget.producerAuthority).not.toEqual(budget.producerAuthority);
    expect(report.browser).toMatchObject({
      product: HISTORICAL_EDGE_101_BROWSER_AUTHORITY.product,
      revision: HISTORICAL_EDGE_101_BROWSER_AUTHORITY.revision,
      js_version: HISTORICAL_EDGE_101_BROWSER_AUTHORITY.jsVersion,
      protocol_version: HISTORICAL_EDGE_101_BROWSER_AUTHORITY.protocolVersion,
    });
    expect(report.expectedOutcomes).toEqual(EXPECTED_OUTCOMES);
    expect(report.outcomes.map((outcome) => outcome.id)).toEqual(EXPECTED_OUTCOMES);
    expect(report.outcomes).toHaveLength(78);
    expect(report.outcomes.every((outcome) => outcome.status === 'pass')).toBe(true);
  });

  it('retains the superseded row-activation certificate without rebinding it', () => {
    if (activeBudget.status === 'calibration-required') return;
    const compressed = fs.readFileSync(path.join(
      v2Root, '..', '..', 'audits', supersededRowActivationCertificationEvidence.file,
    ));
    expect(createHash('sha256').update(compressed).digest('hex'))
      .toBe(supersededRowActivationCertificationEvidence.gzipSha256);
    const raw = gunzipSync(compressed);
    expect(createHash('sha256').update(raw).digest('hex'))
      .toBe(supersededRowActivationCertificationEvidence.rawSha256);
    const report = JSON.parse(raw.toString('utf8')) as RetainedLinuxReport & {
      expectedOutcomes: string[];
    };
    expect(report).toMatchObject({
      schema: 'cf-v2-compendium-memory-report/v1',
      runId: supersededRowActivationCertificationEvidence.runId,
      status: 'pass',
      lifecycle: { schema: 'cf-v2-compendium-report-lifecycle/v1', status: 'complete' },
      findings: [],
      partialFailure: null,
      blockedOutcomes: [],
    });
    expect(report.source.begin).toEqual(report.source.end);
    expect(report.source.begin).toMatchObject({
      commit: supersededRowActivationCertificationEvidence.sourceCommit,
      state: 'committed',
      statusSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    });
    expect(report.inputs.budget).toBe(supersededRowActivationCertificationEvidence.budgetSha256);
    expect(fileSha256(budgetPath)).not.toBe(
      supersededRowActivationCertificationEvidence.budgetSha256,
    );
    expect(report.budget).toMatchObject({
      status: 'active',
      sha256: supersededRowActivationCertificationEvidence.budgetSha256,
      browserAuthority: HISTORICAL_EDGE_101_BROWSER_AUTHORITY,
      browserAuthorityMatch: true,
      producerAuthorityMatch: true,
    });
    expect(report.budget.producerAuthority).toMatchObject({
      sha256: HISTORICAL_EDGE_101_PRODUCER_AUTHORITY,
    });
    expect(report.budget.observedProducerAuthority).toEqual(report.budget.producerAuthority);
    expect(report.budget.producerAuthority).not.toEqual(budget.producerAuthority);
    expect(report.browser).toMatchObject({
      product: HISTORICAL_EDGE_101_BROWSER_AUTHORITY.product,
      revision: HISTORICAL_EDGE_101_BROWSER_AUTHORITY.revision,
      js_version: HISTORICAL_EDGE_101_BROWSER_AUTHORITY.jsVersion,
      protocol_version: HISTORICAL_EDGE_101_BROWSER_AUTHORITY.protocolVersion,
    });
    expect(report.expectedOutcomes).toEqual(EXPECTED_OUTCOMES);
    expect(report.outcomes.map((outcome) => outcome.id)).toEqual(EXPECTED_OUTCOMES);
    expect(report.outcomes).toHaveLength(78);
    expect(report.outcomes.every((outcome) => outcome.status === 'pass')).toBe(true);
  });

  it('retains the superseded render-stable certificate without rebinding it', () => {
    if (activeBudget.status === 'calibration-required') return;
    const compressed = fs.readFileSync(path.join(
      v2Root, '..', '..', 'audits', supersededRenderStableCertificationEvidence.file,
    ));
    expect(createHash('sha256').update(compressed).digest('hex'))
      .toBe(supersededRenderStableCertificationEvidence.gzipSha256);
    const raw = gunzipSync(compressed);
    expect(createHash('sha256').update(raw).digest('hex'))
      .toBe(supersededRenderStableCertificationEvidence.rawSha256);
    const report = JSON.parse(raw.toString('utf8')) as RetainedLinuxReport & {
      expectedOutcomes: string[];
    };
    expect(report).toMatchObject({
      schema: 'cf-v2-compendium-memory-report/v1',
      runId: supersededRenderStableCertificationEvidence.runId,
      status: 'pass',
      lifecycle: { schema: 'cf-v2-compendium-report-lifecycle/v1', status: 'complete' },
      findings: [],
      partialFailure: null,
      blockedOutcomes: [],
    });
    expect(report.source.begin).toEqual(report.source.end);
    expect(report.source.begin).toMatchObject({
      commit: supersededRenderStableCertificationEvidence.sourceCommit,
      state: 'committed',
      statusSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    });
    expect(report.inputs.budget).toBe(supersededRenderStableCertificationEvidence.budgetSha256);
    expect(fileSha256(budgetPath)).not.toBe(
      supersededRenderStableCertificationEvidence.budgetSha256,
    );
    expect(report.budget).toMatchObject({
      status: 'active',
      sha256: supersededRenderStableCertificationEvidence.budgetSha256,
      browserAuthority: HISTORICAL_EDGE_101_BROWSER_AUTHORITY,
      browserAuthorityMatch: true,
      producerAuthorityMatch: true,
    });
    expect(report.budget.producerAuthority).toMatchObject({
      sha256: HISTORICAL_EDGE_101_PRODUCER_AUTHORITY,
    });
    expect(report.budget.observedProducerAuthority).toEqual(report.budget.producerAuthority);
    expect(report.budget.producerAuthority).not.toEqual(budget.producerAuthority);
    expect(report.browser).toMatchObject({
      product: HISTORICAL_EDGE_101_BROWSER_AUTHORITY.product,
      revision: HISTORICAL_EDGE_101_BROWSER_AUTHORITY.revision,
      js_version: HISTORICAL_EDGE_101_BROWSER_AUTHORITY.jsVersion,
      protocol_version: HISTORICAL_EDGE_101_BROWSER_AUTHORITY.protocolVersion,
    });
    expect(report.expectedOutcomes).toEqual(EXPECTED_OUTCOMES);
    expect(report.outcomes.map((outcome) => outcome.id)).toEqual(EXPECTED_OUTCOMES);
    expect(report.outcomes).toHaveLength(78);
    expect(report.outcomes.every((outcome) => outcome.status === 'pass')).toBe(true);
  });

  it('keeps every active ceiling strictly above its samples and below the broken shape', () => {
    if (activeBudget.status === 'calibration-required') {
      expect(activeBudget.ceilings).toBeNull();
      return;
    }
    expect(strictHeadroomFailures(activeBudget)).toEqual([]);
    const baselineBreaches: Record<ProfileName, string[]> = {
      phone: [
        'mountedRowsMax', 'heapUsedBytesMax', 'nodesMax',
        'embedderHeapUsedBytesMax', 'backingStorageBytesMax', 'heapAggregateBytesMax',
        'liveCacheEntriesMax', 'liveDecodedPixelsMax', 'liveDecodedBytesMax',
        'liveEncodedBytesMax', 'livePortraitCacheEntriesMax',
        'livePortraitEncodedBytesMax', 'warmHeapAggregateRangeBytesMax',
        'warmEncodedBytesRangeMax',
      ],
      desktop: [
        'mountedRowsMax', 'nodesMax', 'embedderHeapUsedBytesMax',
        'backingStorageBytesMax', 'heapAggregateBytesMax', 'liveCacheEntriesMax',
        'liveDecodedPixelsMax', 'liveDecodedBytesMax', 'liveEncodedBytesMax',
        'livePortraitCacheEntriesMax', 'livePortraitEncodedBytesMax',
        'warmHeapAggregateRangeBytesMax', 'warmEncodedBytesRangeMax',
      ],
    };
    for (const profile of PROFILE_NAMES) {
      const baseline = activeBudget.pairedBrokenBaseline.samples[profile][0];
      const ceiling = activeBudget.ceilings?.[profile];
      expect(baseline).toBeDefined();
      expect(ceiling).toBeDefined();
      const breached = CEILING_FIELDS.filter((ceilingField, index) => {
        const sampleField = SAMPLE_METRIC_FIELDS[index];
        if (!sampleField || !baseline || !ceiling) return false;
        return baseline.metrics[sampleField]! > Number(ceiling[ceilingField]);
      });
      expect(breached).toEqual(baselineBreaches[profile]);
      expect(Object.fromEntries(CEILING_FIELDS.map((field) => [field, ceiling?.[field]])))
        .toEqual(EXPECTED_CEILINGS[profile]);
    }

    for (const profile of PROFILE_NAMES) {
      for (const [index, ceilingField] of CEILING_FIELDS.entries()) {
        const sampleField = SAMPLE_METRIC_FIELDS[index]!;
        const equality = structuredClone(activeBudget);
        const measuredMax = Math.max(...equality.calibration.samples[profile]
          .map((sample) => sample.metrics[sampleField]!));
        equality.ceilings![profile][ceilingField] = measuredMax;
        expect(strictHeadroomFailures(equality)).toContain(`${profile}.${ceilingField}`);
        expect(validateBudgetRecord(
          equality, fixture.rowsSha256, baselineProjection.rowsSha256,
        ).errors.join('\n')).toContain(
          `active ${profile}.${ceilingField} must be strictly above measured ${sampleField} max`,
        );
      }
    }
  });

  it('uses strict sentinels below the next reachable capped resource state', () => {
    if (activeBudget.status === 'calibration-required') {
      expect(activeBudget.ceilings).toBeNull();
      return;
    }
    const phone = activeBudget.ceilings!.phone;
    const desktop = activeBudget.ceilings!.desktop;
    expect(phone.liveCacheEntriesMax).toBe(96.5);
    expect(desktop.liveCacheEntriesMax).toBe(256.5);
    for (const profile of PROFILE_NAMES) {
      const ceiling = activeBudget.ceilings![profile];
      const samples = activeBudget.calibration.samples[profile];
      expect(ceiling.documentsMax).toBe(2.5);
      expect(ceiling.activeJobsPeakMax).toBe(1.5);
      expect(ceiling.liveSubscribersMax).toBe(0.5);
      expect(ceiling.livePortraitCacheEntriesMax).toBe(1.5);
      expect(ceiling.warmEncodedBytesRangeMax).toBe(0.5);
      expect(ceiling.liveDecodedPixelsMax).toBe(
        Math.max(...samples.map((sample) => sample.metrics.liveDecodedPixels!)) + 1,
      );
      expect(ceiling.liveDecodedBytesMax).toBe(
        Math.max(...samples.map((sample) => sample.metrics.liveDecodedBytes!)) + 1,
      );
    }
  });

  it('binds the retained Linux variance without surrendering paired-baseline discrimination', () => {
    if (activeBudget.status === 'calibration-required') {
      expect(activeBudget.ceilings).toBeNull();
      return;
    }
    expect(activeBudget.calibration.selectionRule).toContain(RETAINED_LINUX_COMPATIBILITY.runId);
    expect(activeBudget.calibration.selectionRule)
      .toContain(RETAINED_LINUX_COMPATIBILITY.reportSha256);

    const compressedReport = fs.readFileSync(retainedLinuxReportPath);
    expect(createHash('sha256').update(compressedReport).digest('hex'))
      .toBe(RETAINED_LINUX_COMPATIBILITY.gzipSha256);
    const rawReport = gunzipSync(compressedReport);
    expect(createHash('sha256').update(rawReport).digest('hex'))
      .toBe(RETAINED_LINUX_COMPATIBILITY.reportSha256);
    const retainedReport = JSON.parse(rawReport.toString('utf8')) as RetainedLinuxReport;

    expect(retainedReport.schema).toBe('cf-v2-compendium-memory-report/v1');
    expect(retainedReport.runId).toBe(RETAINED_LINUX_COMPATIBILITY.reportRunId);
    expect(retainedReport.status).toBe('fail');
    expect(retainedReport.source.begin).toEqual(RETAINED_LINUX_COMPATIBILITY.source);
    expect(retainedReport.source.end).toEqual(RETAINED_LINUX_COMPATIBILITY.source);
    expect(retainedReport.inputs.budget)
      .toBe(RETAINED_LINUX_COMPATIBILITY.originalBudgetSha256);
    expect(retainedReport.inputs.fixtureRows).toBe(fixture.rowsSha256);
    expect(retainedReport.inputs.collector).toBe(RETAINED_LINUX_COLLECTOR_AUTHORITY);
    expect(compendiumMeasurementAuthority(retainedReport.inputs)?.sha256)
      .toBe(RETAINED_LINUX_MEASUREMENT_AUTHORITY);
    expect(retainedReport.browser).toEqual({
      executable: '/opt/microsoft/msedge/microsoft-edge',
      product: RETAINED_LINUX_BROWSER_AUTHORITY.product,
      revision: RETAINED_LINUX_BROWSER_AUTHORITY.revision,
      user_agent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0',
      js_version: RETAINED_LINUX_BROWSER_AUTHORITY.jsVersion,
      protocol_version: RETAINED_LINUX_BROWSER_AUTHORITY.protocolVersion,
    });
    expect(retainedReport.budget).toMatchObject({
      status: 'active',
      path: 'budgets/compendium-memory-v1.json',
      sha256: RETAINED_LINUX_COMPATIBILITY.originalBudgetSha256,
      browserAuthority: RETAINED_LINUX_BROWSER_AUTHORITY,
      browserAuthorityMatch: true,
      producerAuthorityMatch: true,
    });
    expect(retainedReport.budget.producerAuthority).toMatchObject({
      sha256: RETAINED_LINUX_PRODUCER_AUTHORITY,
    });
    expect(retainedReport.budget.observedProducerAuthority).toEqual(
      retainedReport.budget.producerAuthority,
    );
    expect(retainedReport.budget.producerAuthority).not.toEqual(budget.producerAuthority);
    expect(retainedReport.policy).toEqual({
      attemptCount: 1,
      automaticRetries: 0,
      commandTimeoutMs: 2_000,
      targetTimeoutMs: 2_000,
      heartbeatTimeoutMs: 2_000,
      transportTimeoutMs: 5_000,
    });
    expect(retainedReport.lifecycle)
      .toEqual({ schema: 'cf-v2-compendium-report-lifecycle/v1', status: 'complete' });
    expect(retainedReport.partialFailure).toBeNull();
    expect(retainedReport.blockedOutcomes).toEqual([]);
    expect(retainedReport.outcomes.map((outcome) => outcome.id)).toEqual(EXPECTED_OUTCOMES);
    expect(retainedReport.outcomes.filter((outcome) => outcome.status === 'pass')).toHaveLength(75);
    const originalFailures = retainedReport.outcomes
      .filter((outcome) => outcome.status === 'fail');
    expect(originalFailures.map((outcome) => outcome.id)).toEqual([
      'phone/warm-plateau', 'phone/byte-ceiling', 'desktop/byte-ceiling',
    ]);
    expect(originalFailures.map((outcome) => outcome.diagnosis)).toEqual(retainedReport.findings);
    const originalFailureById = new Map(originalFailures.map((outcome) => [outcome.id, outcome]));
    expect(originalFailureById.get('phone/warm-plateau')?.evidence?.warmHeapAggregateRange)
      .toBe(RETAINED_LINUX_COMPATIBILITY.phone.warmHeapAggregateRangeBytes);
    expect(originalFailureById.get('phone/byte-ceiling')?.evidence?.observed
      ?.portraitEncodedBytesMax)
      .toBe(RETAINED_LINUX_COMPATIBILITY.phone.livePortraitEncodedBytes);
    expect(originalFailureById.get('desktop/byte-ceiling')?.evidence?.observed
      ?.portraitEncodedBytesMax)
      .toBe(RETAINED_LINUX_COMPATIBILITY.desktop.livePortraitEncodedBytes);

    const replay = (record: ActiveBudgetRecord) => {
      const historicalRecord = structuredClone(record);
      historicalRecord.producerAuthority = retainedReport.budget.producerAuthority as {
        sha256: string;
      };
      return PROFILE_NAMES.flatMap((profile) =>
        evaluateProfile(retainedReport.profiles[profile], historicalRecord, fixture));
    };
    const repairedOutcomes = replay(activeBudget);
    expect(repairedOutcomes.map((outcome) => outcome.id)).toEqual(EXPECTED_OUTCOMES);
    expect(repairedOutcomes.filter((outcome) => outcome.status === 'pass')).toHaveLength(78);
    expect(repairedOutcomes.filter((outcome) => outcome.status === 'fail')).toEqual([]);

    const observations = [
      {
        profile: 'phone' as const,
        ceilingField: 'warmHeapAggregateRangeBytesMax',
        sampleField: 'warmHeapAggregateRangeBytes',
        observed: RETAINED_LINUX_COMPATIBILITY.phone.warmHeapAggregateRangeBytes,
        expectedHeadroom: 164_824,
        expectedFailure: 'phone/warm-plateau',
      },
      {
        profile: 'phone' as const,
        ceilingField: 'livePortraitEncodedBytesMax',
        sampleField: 'livePortraitEncodedBytes',
        observed: RETAINED_LINUX_COMPATIBILITY.phone.livePortraitEncodedBytes,
        expectedHeadroom: 41_614,
        expectedFailure: 'phone/byte-ceiling',
      },
      {
        profile: 'desktop' as const,
        ceilingField: 'livePortraitEncodedBytesMax',
        sampleField: 'livePortraitEncodedBytes',
        observed: RETAINED_LINUX_COMPATIBILITY.desktop.livePortraitEncodedBytes,
        expectedHeadroom: 41_614,
        expectedFailure: 'desktop/byte-ceiling',
      },
    ];
    for (const observation of observations) {
      const ceiling = Number(activeBudget.ceilings![observation.profile][observation.ceilingField]);
      const baseline = activeBudget.pairedBrokenBaseline.samples[observation.profile][0];
      const admitted = (value: number) => Number.isSafeInteger(value) && value <= ceiling;
      expect(ceiling).toBe(262_144);
      expect(admitted(observation.observed)).toBe(true);
      expect(admitted(ceiling)).toBe(true);
      expect(admitted(ceiling + 1)).toBe(false);
      expect(ceiling - observation.observed).toBe(observation.expectedHeadroom);
      expect(baseline?.metrics[observation.sampleField]).toBeGreaterThan(ceiling);

      const justBelow = structuredClone(activeBudget);
      justBelow.ceilings![observation.profile][observation.ceilingField]
        = observation.observed - 1;
      expect(replay(justBelow).filter((outcome) => outcome.status === 'fail')
        .map((outcome) => outcome.id)).toEqual([observation.expectedFailure]);
    }
  });

  it('requires one explicit version-tolerant Edge compatibility authority', () => {
    expect(validCompendiumBrowserAuthority(activeBudget.browserAuthority)).toBe(true);
    expect(activeBudget.browserAuthority).toEqual(EXPECTED_BROWSER_AUTHORITY);

    const missing = structuredClone(activeBudget) as unknown as {
      browserAuthority?: BrowserAuthority;
    };
    delete missing.browserAuthority;
    expect(validateBudgetRecord(
      missing, fixture.rowsSha256, baselineProjection.rowsSha256,
    ).errors.join('\n')).toMatch(/budget browser authority is invalid/);

    const extra = structuredClone(activeBudget) as unknown as {
      browserAuthority: BrowserAuthority & { decoy?: string };
    };
    extra.browserAuthority.decoy = 'not authority';
    expect(validateBudgetRecord(
      extra, fixture.rowsSha256, baselineProjection.rowsSha256,
    ).errors.join('\n')).toMatch(/budget browser authority is invalid/);

    for (const field of Object.keys(EXPECTED_BROWSER_AUTHORITY) as Array<
      keyof typeof EXPECTED_BROWSER_AUTHORITY
    >) {
      const missingField = structuredClone(activeBudget) as unknown as {
        browserAuthority: Partial<BrowserAuthority>;
      };
      delete missingField.browserAuthority[field];
      expect(validateBudgetRecord(
        missingField, fixture.rowsSha256, baselineProjection.rowsSha256,
      ).errors.join('\n'), `missing browserAuthority.${field}`)
        .toMatch(/budget browser authority is invalid/);
    }

    for (const field of Object.keys(EXPECTED_BROWSER_AUTHORITY) as Array<
      keyof typeof EXPECTED_BROWSER_AUTHORITY
    >) {
      const drifted = structuredClone(activeBudget);
      drifted.browserAuthority[field] = `${drifted.browserAuthority[field]}-other` as never;
      expect(drifted.browserAuthority, `${field} drift must leave the checked-in policy`)
        .not.toEqual(EXPECTED_BROWSER_AUTHORITY);
      const errors = validateBudgetRecord(
        drifted, fixture.rowsSha256, baselineProjection.rowsSha256,
      ).errors.join('\n');
      expect(errors, `${field} authority drift`).toMatch(/budget browser authority is invalid/);
    }

    for (const product of [
      'Edg/151.0.4129.93', 'Edg/151.0.4129.101',
      'Edg/151.0.4129.107', 'Edg/999.8.7.6',
    ]) {
      expect(compendiumBrowserAuthorityMatches({
        product, revision: `@${product}`, js_version: `js-${product}`,
        protocol_version: '1.3',
      }, activeBudget.browserAuthority), `${product} should satisfy the same policy`).toBe(true);
    }
    for (const browser of [
      { product: 'Chrome/151.0.4129.107', revision: '@chrome', js_version: '15.1.23.9', protocol_version: '1.3' },
      { product: 'Edg/151.0.4129', revision: '@short', js_version: '15.1.23.9', protocol_version: '1.3' },
      { product: 'Edg/151.0.4129.107', revision: '', js_version: '15.1.23.9', protocol_version: '1.3' },
      { product: 'Edg/151.0.4129.107', revision: '@edge', js_version: '', protocol_version: '1.3' },
      { product: 'Edg/151.0.4129.107', revision: '@edge', js_version: '15.1.23.9', protocol_version: '1.2' },
    ]) {
      expect(compendiumBrowserAuthorityMatches(browser, activeBudget.browserAuthority)).toBe(false);
    }
  });

  it('accepts Edge build drift but rejects browser-family and protocol drift', () => {
    type BrowserOnlySample = { browser: Record<string, string> };
    type MutableRecord = {
      calibration: { samples: Record<ProfileName, BrowserOnlySample[]> };
      pairedBrokenBaseline: { samples: Record<ProfileName, BrowserOnlySample[]> };
    };
    const rawBrowser = rawBrowserForAuthority(EXPECTED_BROWSER_AUTHORITY);
    for (const [collection, mismatchPattern] of [
      ['candidate', /candidate calibration browser does not match/],
      ['baseline', /paired broken-baseline browser does not match/],
    ] as const) {
      const matching = structuredClone(activeBudget) as unknown as MutableRecord;
      const matchingSample = { runId: 'same-run', browser: { ...rawBrowser } };
      if (collection === 'candidate') {
        matching.calibration.samples.phone = [matchingSample];
        matching.calibration.samples.desktop = [structuredClone(matchingSample)];
      } else {
        matching.pairedBrokenBaseline.samples.phone = [matchingSample];
        matching.pairedBrokenBaseline.samples.desktop = [structuredClone(matchingSample)];
      }
      expect(validateBudgetRecord(
        matching, fixture.rowsSha256, baselineProjection.rowsSha256,
      ).errors.join('\n'), `${collection} matching authority control`)
        .not.toMatch(mismatchPattern);

      for (const [field, value, rejected] of [
        ['product', 'Edg/777.6.5.4', false],
        ['revision', '@different-edge-revision', false],
        ['jsVersion', '99.8.7.6', false],
        ['product', 'Chrome/151.0.4129.107', true],
        ['protocolVersion', '1.2', true],
      ] as const) {
        const wrong = structuredClone(activeBudget) as unknown as MutableRecord;
        const sample = { runId: 'drift-run', browser: { ...rawBrowser, [field]: value } };
        if (collection === 'candidate') {
          wrong.calibration.samples.phone = [sample];
          wrong.calibration.samples.desktop = [structuredClone(sample)];
        } else {
          wrong.pairedBrokenBaseline.samples.phone = [sample];
          wrong.pairedBrokenBaseline.samples.desktop = [structuredClone(sample)];
        }
        const errors = validateBudgetRecord(
          wrong, fixture.rowsSha256, baselineProjection.rowsSha256,
        ).errors.join('\n');
        if (rejected) expect(errors, `${collection} ${field} incompatibility`).toMatch(mismatchPattern);
        else expect(errors, `${collection} ${field} diagnostic drift`).not.toMatch(mismatchPattern);
      }
    }
  });

  it('allows builds and host provenance to vary across runs but binds each run across profiles', () => {
    type IdentitySample = {
      runId: string;
      commit: string;
      workingTreeDigest: string;
      inputDigest: string;
      fixtureRowsSha256: string;
      measuredAt: string;
      browser?: Record<string, string>;
    };
    type MutableRecord = {
      calibration: { samples: Record<ProfileName, IdentitySample[]> };
    };
    const sample = (run: number): IdentitySample => ({
      runId: `fresh-path-${run}`,
      commit: 'a'.repeat(40),
      workingTreeDigest: 'b'.repeat(64),
      inputDigest: 'c'.repeat(64),
      fixtureRowsSha256: fixture.rowsSha256,
      measuredAt: `2026-08-20T16:00:0${run}.000Z`,
      browser: {
        ...rawBrowserForAuthority(EXPECTED_BROWSER_AUTHORITY, {
          product: `Edg/151.0.4129.${100 + run}`,
          revision: `@edge-revision-${run}`,
          jsVersion: `15.1.23.${run}`,
        }),
        executable: `/private/tmp/cf-edge-fresh-${run}/Microsoft Edge`,
        userAgent: `host provenance ${run}`,
      },
    });
    const freshPaths = structuredClone(activeBudget) as unknown as MutableRecord;
    freshPaths.calibration.samples.phone = [sample(1), sample(2), sample(3)];
    freshPaths.calibration.samples.desktop = [sample(1), sample(2), sample(3)];
    const pairedProvenancePattern = /does not bind one exact browser provenance tuple across profiles/;
    const freshErrors = validateBudgetRecord(
      freshPaths, fixture.rowsSha256, baselineProjection.rowsSha256,
    ).errors.join('\n');
    expect(freshErrors).not.toMatch(pairedProvenancePattern);
    expect(new Set(freshPaths.calibration.samples.phone
      .map((entry) => entry.browser?.executable))).toHaveLength(3);
    expect(new Set(freshPaths.calibration.samples.phone
      .map((entry) => entry.browser?.userAgent))).toHaveLength(3);

    for (const field of [
      'executable', 'product', 'revision', 'userAgent', 'jsVersion', 'protocolVersion',
    ] as const) {
      const drifted = structuredClone(freshPaths);
      drifted.calibration.samples.phone[1]!.browser![field]
        = `${drifted.calibration.samples.phone[1]!.browser![field]}-other`;
      const driftErrors = validateBudgetRecord(
        drifted, fixture.rowsSha256, baselineProjection.rowsSha256,
      ).errors.join('\n');
      expect(driftErrors, `${field} same-run provenance drift`).toMatch(pairedProvenancePattern);
    }

    const timestampDrift = structuredClone(freshPaths);
    timestampDrift.calibration.samples.phone[1]!.measuredAt = '2026-08-20T17:00:00.000Z';
    expect(validateBudgetRecord(
      timestampDrift, fixture.rowsSha256, baselineProjection.rowsSha256,
    ).errors.join('\n')).toMatch(/does not bind one exact measurement timestamp across profiles/);

    const missingBrowser = structuredClone(freshPaths);
    delete missingBrowser.calibration.samples.phone[1]!.browser;
    const missingErrors = validateBudgetRecord(
      missingBrowser, fixture.rowsSha256, baselineProjection.rowsSha256,
    ).errors.join('\n');
    expect(missingErrors).toMatch(/browser provenance is incomplete/);
    expect(missingErrors).toMatch(pairedProvenancePattern);
    expect(missingErrors).toMatch(/candidate calibration browser does not match/);

    for (const executable of ['', 'relative/microsoft-edge', '../microsoft-edge']) {
      const relativePath = structuredClone(freshPaths);
      relativePath.calibration.samples.phone[0]!.browser!.executable = executable;
      relativePath.calibration.samples.desktop[0]!.browser!.executable = executable;
      expect(validateBudgetRecord(
        relativePath, fixture.rowsSha256, baselineProjection.rowsSha256,
      ).errors.join('\n'), executable).toMatch(/browser provenance is incomplete/);
    }
  });

  it('pins a complete, unique profile/outcome inventory', () => {
    expect(OUTCOME_IDS.length).toBeGreaterThan(30);
    expect(new Set(OUTCOME_IDS).size).toBe(OUTCOME_IDS.length);
    expect(EXPECTED_OUTCOMES).toEqual(PROFILES.flatMap((profile) =>
      OUTCOME_IDS.map((id) => `${profile}/${id}`)));
    expect(new Set(EXPECTED_OUTCOMES).size).toBe(EXPECTED_OUTCOMES.length);
  });

  it('rejects invented active ceilings without measured samples and rationale', () => {
    const forged = structuredClone(budget) as Record<string, unknown> & {
      status: string;
      calibration: { samples: { phone: unknown[]; desktop: unknown[] } };
      ceilings: Record<string, unknown>;
    };
    forged.status = 'active';
    forged.calibration.samples.phone = [];
    forged.calibration.samples.desktop = [];
    forged.ceilings = {
      phone: { rationale: '', mountedRowsMax: 1 },
      desktop: { rationale: '', mountedRowsMax: 1 },
    };
    const result = validateBudgetRecord(forged, fixture.rowsSha256, baselineProjection.rowsSha256);
    expect(result.ok).toBe(false);
    expect(result.errors.join('\n')).toMatch(/three phone calibration samples/);
    expect(result.errors.join('\n')).toMatch(/rationale/);
    expect(result.errors.join('\n')).toMatch(/heapUsedBytesMax/);
  });

  it('rejects a fixture digest from any other generator output', () => {
    const wrong = structuredClone(budget) as Record<string, unknown> & {
      fixture: { rowsSha256: string };
    };
    wrong.fixture.rowsSha256 = '0'.repeat(64);
    expect(validateBudgetRecord(wrong, fixture.rowsSha256, baselineProjection.rowsSha256).errors.join('\n'))
      .toMatch(/does not match the current deterministic input/);
  });

  it('rejects a broken-baseline projection digest from another adapter input', () => {
    const wrong = structuredClone(budget) as Record<string, unknown> & {
      pairedBrokenBaseline: { projectionRowsSha256: string };
    };
    wrong.pairedBrokenBaseline.projectionRowsSha256 = '0'.repeat(64);
    expect(validateBudgetRecord(
      wrong, fixture.rowsSha256, baselineProjection.rowsSha256,
    ).errors.join('\n')).toMatch(/projection digest does not match/);
  });
});
