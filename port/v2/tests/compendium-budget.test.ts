import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BASELINE_CALIBRATION_EVIDENCE_SCHEMA,
  BROKEN_BASELINE_EXPECTED_FAULTS, BUDGET_SCHEMA, CEILING_FIELDS,
  CANDIDATE_CALIBRATION_EVIDENCE_SCHEMA,
  COMPENDIUM_BROWSER_AUTHORITY_SCHEMA, COMPENDIUM_BROWSER_AUTHORITY_SCOPE,
  COMPENDIUM_MEASUREMENT_AUTHORITY_INPUT_KEYS,
  EXPECTED_OUTCOMES, OUTCOME_IDS, PROFILES, SAMPLE_METRIC_FIELDS,
  compendiumBrowserAuthorityMatches, compendiumBudgetBrowserAuthority,
  compendiumMeasurementAuthority, validCompendiumBrowserAuthority, validateBudgetRecord,
} from '../tools/compendiummem-contract.mjs';
import {
  COMPENDIUM_FIXTURE_SPEC_PATH, buildBrokenBaselineProjection,
  buildCompendiumFixture, stableJson,
} from '../tools/compendiummem-fixture.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const v2Root = path.resolve(here, '..');
const budgetPath = path.join(here, '..', 'budgets', 'compendium-memory-v1.json');
const schemaPath = path.join(here, '..', 'budgets', 'compendium-memory-v1.schema.json');
const PROFILE_NAMES = ['phone', 'desktop'] as const;
const EXPECTED_MEASUREMENT_AUTHORITY =
  '2318f57bcadd83b2f540e3a2d1b8bea54ca6c88d1df8715318a341d4e2ae7cf2';
const EXPECTED_PRODUCER_AUTHORITY =
  'd32231773e4e06db4074111b49ebe2eca698d5004bd5af3fbd8d2867d765b900';
type BrowserAuthority = {
  schema: string;
  scope: string;
  product: string;
  revision: string;
  jsVersion: string;
  protocolVersion: string;
};
const EXPECTED_BROWSER_AUTHORITY: BrowserAuthority = {
  schema: COMPENDIUM_BROWSER_AUTHORITY_SCHEMA,
  scope: COMPENDIUM_BROWSER_AUTHORITY_SCOPE,
  product: 'Edg/151.0.4129.86',
  revision: '@083e754915c9ab93da1d8f7b9c860e4520273900',
  jsVersion: '15.1.23.7',
  protocolVersion: '1.3',
};
const EXPECTED_CANDIDATE_RUNS = [
  '20260820-arc1a-browser-identity-candidate24',
  '20260820-arc1a-browser-identity-candidate25',
  '20260820-arc1a-browser-identity-candidate26',
] as const;
const EXPECTED_BASELINE_RUN = '20260820-arc1a-browser-identity-baseline10';
const QUARANTINED_DIAGNOSTIC_CANDIDATE_RUNS = [
  '20260820-arc1a-browser-authority-candidate21',
  '20260820-arc1a-browser-authority-candidate22',
  '20260820-arc1a-browser-authority-candidate23',
] as const;
const QUARANTINED_DIAGNOSTIC_BASELINE_RUN =
  '20260820-arc1a-browser-authority-baseline9';

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

const EXPECTED_SAMPLE_OBJECT_SHA256: Record<ProfileName, {
  candidate: readonly string[]; baseline: string;
}> = {
  phone: {
    candidate: [
      'ea9c4bb1ea417a13b532c95947771c0f0bd0c307954c9612583fe7f7c929392e',
      'fa16efdb48aab60276f0ea7e1546462146860db02155394997da4745374edb30',
      'eac7be9d96cbf1d765c7b4e7aa6f8172d011aba79773183e401f3d2687ed66af',
    ],
    baseline: '4f6f8d9834bd7090df696238bd0c5dd1d2788872306cb48b6782af8aa9f93418',
  },
  desktop: {
    candidate: [
      'fea960dd3fc137c65054113199f07fcd31fbcd0cc78beda740d90f1e27e21a33',
      '7ce24012ec0d05efa665a53007491fc6c81c1deb4f39e04065868e46d22067c7',
      '82a20e918da1b0f96060fbcb716662f64ce4aac74b32e7f66d2efbf7ed025ad6',
    ],
    baseline: '01446d933c63276fe1a577698d61f90c4c286a7d008d870936bf206f3ccfb0e1',
  },
};

const EXPECTED_CEILINGS: Record<ProfileName, Record<string, number>> = {
  phone: {
    mountedRowsMax: 16,
    heapUsedBytesMax: 8_388_608,
    documentsMax: 2.5,
    nodesMax: 640,
    embedderHeapUsedBytesMax: 4_194_304,
    backingStorageBytesMax: 4_194_304,
    heapAggregateBytesMax: 14_680_064,
    jsEventListenersMax: 80,
    liveCacheEntriesMax: 96.5,
    liveDecodedPixelsMax: 1_672_705,
    liveDecodedBytesMax: 6_690_817,
    liveEncodedBytesMax: 2_621_440,
    queuedJobsPeakMax: 24,
    activeJobsPeakMax: 1.5,
    liveLeasesMax: 24,
    liveSubscribersMax: 0.5,
    livePortraitCacheEntriesMax: 1.5,
    livePortraitEncodedBytesMax: 196_608,
    warmHeapAggregateRangeBytesMax: 65_536,
    warmEncodedBytesRangeMax: 0.5,
  },
  desktop: {
    mountedRowsMax: 16,
    heapUsedBytesMax: 12_582_912,
    documentsMax: 2.5,
    nodesMax: 640,
    embedderHeapUsedBytesMax: 4_194_304,
    backingStorageBytesMax: 6_291_456,
    heapAggregateBytesMax: 18_874_368,
    jsEventListenersMax: 80,
    liveCacheEntriesMax: 256.5,
    liveDecodedPixelsMax: 4_460_545,
    liveDecodedBytesMax: 17_842_177,
    liveEncodedBytesMax: 6_815_744,
    queuedJobsPeakMax: 24,
    activeJobsPeakMax: 1.5,
    liveLeasesMax: 24,
    liveSubscribersMax: 0.5,
    livePortraitCacheEntriesMax: 1.5,
    livePortraitEncodedBytesMax: 196_608,
    warmHeapAggregateRangeBytesMax: 524_288,
    warmEncodedBytesRangeMax: 0.5,
  },
};

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

function rawBrowserForAuthority(authority: BrowserAuthority): Record<string, string> {
  return {
    executable: '/isolated/microsoft-edge',
    product: authority.product,
    revision: authority.revision,
    userAgent: 'host-specific user agent',
    jsVersion: authority.jsVersion,
    protocolVersion: authority.protocolVersion,
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
      'schema', 'scope', 'product', 'revision', 'jsVersion', 'protocolVersion',
    ].sort());
    expect(Object.keys(definitions.browserAuthority.properties).sort()).toEqual([
      'schema', 'scope', 'product', 'revision', 'jsVersion', 'protocolVersion',
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

  it('activates only the exact Arc-local Edge build authority and paired samples', () => {
    if (activeBudget.status === 'calibration-required') {
      expect(activeBudget.browserAuthority).toEqual(EXPECTED_BROWSER_AUTHORITY);
      expect(activeBudget.measurementAuthority.sha256).toBe(EXPECTED_MEASUREMENT_AUTHORITY);
      expect(activeBudget.producerAuthority.sha256).toBe(EXPECTED_PRODUCER_AUTHORITY);
      expect(activeBudget.ceilings).toBeNull();
      for (const profile of PROFILE_NAMES) {
        expect(activeBudget.calibration.samples[profile]).toEqual([]);
        expect(activeBudget.pairedBrokenBaseline.samples[profile]).toEqual([]);
      }
      expect(activeBudget.pairedBrokenBaseline.status).toBe('measurement-required');
      expect(activeBudget.pairedBrokenBaseline.collectorCommit).toBeNull();
      expect(activeBudget.calibration.selectionRule).toContain('Edg/151.0.4129.86');
      expect(activeBudget.calibration.selectionRule).toContain('Edg/151.0.4129.93');
      expect(activeBudget.calibration.selectionRule)
        .toContain('20260820-arc1a-terminal-lifecycle-candidate20');
      for (const runId of QUARANTINED_DIAGNOSTIC_CANDIDATE_RUNS) {
        expect(activeBudget.calibration.selectionRule).toContain(runId);
      }
      expect(activeBudget.calibration.selectionRule)
        .toContain(QUARANTINED_DIAGNOSTIC_BASELINE_RUN);
      expect(activeBudget.calibration.selectionRule)
        .toContain('individually clean diagnostic history only');
      expect(activeBudget.calibration.selectionRule).toContain('path/UA contract');
      expect(activeBudget.calibration.selectionRule)
        .toContain('cannot cross the corrected contract authority boundary');
      expect(activeBudget.calibration.selectionRule).toContain(EXPECTED_BASELINE_RUN);
      for (const runId of EXPECTED_CANDIDATE_RUNS) {
        expect(activeBudget.calibration.selectionRule).toContain(runId);
      }
      expect(activeBudget.calibration.selectionRule).toContain('exactly once');
      expect(activeBudget.calibration.selectionRule).toContain('zero retries');
      expect(activeBudget.calibration.selectionRule).toContain('raw-capsule');
      expect(activeBudget.calibration.selectionRule).toContain('strictly above');
      expect(activeBudget.calibration.selectionRule).toContain('rational headroom');
      expect(activeBudget.calibration.selectionRule).toContain(EXPECTED_PRODUCER_AUTHORITY);
      expect(activeBudget.calibration.selectionRule)
        .toContain('does not re-pin the Gate-A/global browser');
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
    expect(new Set(everySample.map(authorityKey))).toEqual(new Set([
      [
        'Edg/151.0.4129.86',
        '@083e754915c9ab93da1d8f7b9c860e4520273900',
        '15.1.23.7',
        '1.3',
      ].join('\0'),
    ]));
    expect(everySample.every((sample) =>
      compendiumBrowserAuthorityMatches(sample.browser, activeBudget.browserAuthority))).toBe(true);
    expect(activeBudget.calibration.selectionRule).toContain('Edg/151.0.4129.86');
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

  it('requires one explicit exact browser authority even before samples exist', () => {
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
      const drifted = structuredClone(activeBudget) as unknown as ActiveBudgetRecord & {
        calibration: { samples: Record<ProfileName, Array<{
          browser: Record<string, string>;
        }>> };
      };
      drifted.calibration.samples.phone = [{
        browser: rawBrowserForAuthority(EXPECTED_BROWSER_AUTHORITY),
      }] as never;
      drifted.browserAuthority[field] = `${drifted.browserAuthority[field]}-other` as never;
      expect(drifted.browserAuthority, `${field} drift must leave the checked-in pin`)
        .not.toEqual(EXPECTED_BROWSER_AUTHORITY);
      const errors = validateBudgetRecord(
        drifted, fixture.rowsSha256, baselineProjection.rowsSha256,
      ).errors.join('\n');
      expect(errors, `${field} authority drift`).toMatch(
        field === 'schema' || field === 'scope'
          ? /budget browser authority is invalid/
          : /candidate calibration browser does not match/,
      );
    }

    expect(compendiumBrowserAuthorityMatches({
      executable: '/isolated/mislabeled-edge-151.0.4129.86',
      product: 'Edg/151.0.4129.93',
      revision: '@4a822b1bb7a8566144cff23f6c09a2ab162665f9',
      user_agent: 'candidate20 host provenance',
      js_version: '15.1.23.7',
      protocol_version: '1.3',
    }, activeBudget.browserAuthority), 'candidate20 self-updated .93 must remain invalid')
      .toBe(false);
  });

  it('rejects every candidate and baseline raw browser that differs from the explicit pin', () => {
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
      const matchingSample = { browser: { ...rawBrowser } };
      if (collection === 'candidate') matching.calibration.samples.phone = [matchingSample];
      else matching.pairedBrokenBaseline.samples.phone = [matchingSample];
      expect(validateBudgetRecord(
        matching, fixture.rowsSha256, baselineProjection.rowsSha256,
      ).errors.join('\n'), `${collection} matching authority control`)
        .not.toMatch(mismatchPattern);

      for (const field of ['product', 'revision', 'jsVersion', 'protocolVersion'] as const) {
        const wrong = structuredClone(activeBudget) as unknown as MutableRecord;
        const sample = { browser: { ...rawBrowser, [field]: `${rawBrowser[field]}-other` } };
        if (collection === 'candidate') wrong.calibration.samples.phone = [sample];
        else wrong.pairedBrokenBaseline.samples.phone = [sample];
        expect(validateBudgetRecord(
          wrong, fixture.rowsSha256, baselineProjection.rowsSha256,
        ).errors.join('\n'), `${collection} ${field} mismatch`).toMatch(mismatchPattern);
      }
    }
  });

  it('accepts fresh per-run browser paths and host UAs without weakening build identity', () => {
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
        ...rawBrowserForAuthority(EXPECTED_BROWSER_AUTHORITY),
        executable: `/private/tmp/cf-edge-fresh-${run}/Microsoft Edge`,
        userAgent: `host provenance ${run}`,
      },
    });
    const freshPaths = structuredClone(activeBudget) as unknown as MutableRecord;
    freshPaths.calibration.samples.phone = [sample(1), sample(2), sample(3)];
    const sharedIdentityPattern = /do not share one exact .*browser-authority identity/;
    const freshErrors = validateBudgetRecord(
      freshPaths, fixture.rowsSha256, baselineProjection.rowsSha256,
    ).errors.join('\n');
    expect(freshErrors).not.toMatch(sharedIdentityPattern);
    expect(new Set(freshPaths.calibration.samples.phone
      .map((entry) => entry.browser?.executable))).toHaveLength(3);
    expect(new Set(freshPaths.calibration.samples.phone
      .map((entry) => entry.browser?.userAgent))).toHaveLength(3);

    for (const field of ['product', 'revision', 'jsVersion', 'protocolVersion'] as const) {
      const drifted = structuredClone(freshPaths);
      drifted.calibration.samples.phone[1]!.browser![field]
        = `${drifted.calibration.samples.phone[1]!.browser![field]}-other`;
      const driftErrors = validateBudgetRecord(
        drifted, fixture.rowsSha256, baselineProjection.rowsSha256,
      ).errors.join('\n');
      expect(driftErrors, `${field} shared identity drift`).toMatch(sharedIdentityPattern);
      expect(driftErrors, `${field} explicit authority drift`)
        .toMatch(/candidate calibration browser does not match/);
    }

    const missingBrowser = structuredClone(freshPaths);
    delete missingBrowser.calibration.samples.phone[1]!.browser;
    const missingErrors = validateBudgetRecord(
      missingBrowser, fixture.rowsSha256, baselineProjection.rowsSha256,
    ).errors.join('\n');
    expect(missingErrors).toMatch(/browser provenance is incomplete/);
    expect(missingErrors).toMatch(sharedIdentityPattern);
    expect(missingErrors).toMatch(/candidate calibration browser does not match/);
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
