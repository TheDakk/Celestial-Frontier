import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BASELINE_CALIBRATION_EVIDENCE_SCHEMA,
  BROKEN_BASELINE_EXPECTED_FAULTS, BUDGET_SCHEMA, CEILING_FIELDS,
  CANDIDATE_CALIBRATION_EVIDENCE_SCHEMA,
  COMPENDIUM_MEASUREMENT_AUTHORITY_INPUT_KEYS,
  EXPECTED_OUTCOMES, OUTCOME_IDS, PROFILES, SAMPLE_METRIC_FIELDS,
  validateBudgetRecord,
} from '../tools/compendiummem-contract.mjs';
import {
  buildBrokenBaselineProjection, buildCompendiumFixture,
} from '../tools/compendiummem-fixture.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const budgetPath = path.join(here, '..', 'budgets', 'compendium-memory-v1.json');
const schemaPath = path.join(here, '..', 'budgets', 'compendium-memory-v1.schema.json');
const PROFILE_NAMES = ['phone', 'desktop'] as const;
const EXPECTED_MEASUREMENT_AUTHORITY =
  'f9710bdfaac255d7df7e8c29f251c8387041abe99a0178667b7b3430110a0409';
const EXPECTED_PRODUCER_AUTHORITY =
  '1c8200d7a5ab71341be0f808c242f250b529a3ead4c8cf551cbdf99bebd405c2';
const EXPECTED_CANDIDATE_RUNS = [
  '20260820-arc1a-serviced-turn-candidate5',
  '20260820-arc1a-serviced-turn-candidate6',
  '20260820-arc1a-serviced-turn-candidate7',
] as const;
const EXPECTED_BASELINE_RUN = '20260820-arc1a-serviced-turn-baseline4';

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
      'ffc82dd71a4ea277eb70290230398f09d430c6c17d284ac9516886c1c423ac1a',
      '04536c8dda692b5a4b0a25b4f231e06418b2b334e122aa561330b40cf62a4112',
      'c5b86b45ecf639fbe69a27444babe7367b77bb88c1b5d56e66ba2bc132d7dc0f',
    ],
    baseline: 'c14f27047c0f38c4d37ecd63a2e970be8d6c6d90bde0dc5856c659cc9af3d106',
  },
  desktop: {
    candidate: [
      '9e0de5c646ec6a35b2115c6f650f9b901f124c8aa1f5d463ec439128e29ab83c',
      'ab238eeb73d4f05402f5131acaac3480752f1d5ccb41b03324ebae572ac2f45d',
      '60081c396514f61b899787883f859fbb99f5b4476aee3b0aadcc733467a552fe',
    ],
    baseline: '1fcccb6ec958ecd5091abcf06f67c9a8177c67ce37a45628ec9a30966e65743a',
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

function authorityKey(sample: CalibrationSample): string {
  const { product, revision, jsVersion, protocolVersion } = sample.browser;
  return [product, revision, jsVersion, protocolVersion].join('\0');
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

  it('owns a strict v2 record and schema bound to the sealed 1,500-row input', () => {
    expect(schema.$schema).toBe('https://json-schema.org/draft/2020-12/schema');
    expect(schema.additionalProperties).toBe(false);
    expect(budget.schema).toBe(BUDGET_SCHEMA);
    expect(validateBudgetRecord(budget, fixture.rowsSha256, baselineProjection.rowsSha256))
      .toEqual({ ok: true, errors: [] });
    expect((budget.pairedBrokenBaseline as { projectionRowsSha256: string }).projectionRowsSha256)
      .toBe(baselineProjection.rowsSha256);
  });

  it('keeps strict metric and ceiling schema keys identical to the semantic contract', () => {
    type StrictObjectDefinition = {
      required: string[]; properties: Record<string, unknown>; additionalProperties: boolean;
    };
    const definitions = schema.$defs as {
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
      expect(activeBudget.measurementAuthority.sha256).toBe(EXPECTED_MEASUREMENT_AUTHORITY);
      expect(activeBudget.producerAuthority.sha256).toBe(EXPECTED_PRODUCER_AUTHORITY);
      expect(activeBudget.ceilings).toBeNull();
      for (const profile of PROFILE_NAMES) {
        expect(activeBudget.calibration.samples[profile]).toEqual([]);
        expect(activeBudget.pairedBrokenBaseline.samples[profile]).toEqual([]);
      }
      expect(activeBudget.pairedBrokenBaseline.status).toBe('measurement-required');
      expect(activeBudget.pairedBrokenBaseline.collectorCommit).toBeNull();
      return;
    }
    expect(activeBudget.status).toBe('active');
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
    expect(activeBudget.calibration.selectionRule).toContain('Edg/151.0.4129.86');
    expect(activeBudget.calibration.selectionRule).toContain('raw capsule');
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

  it('rejects a paired baseline from another Arc-local Edge build authority', () => {
    if (activeBudget.status === 'calibration-required') {
      expect(activeBudget.pairedBrokenBaseline.samples.phone).toEqual([]);
      return;
    }
    const wrong = structuredClone(activeBudget);
    wrong.pairedBrokenBaseline.samples.phone[0]!.browser.jsVersion = '15.1.23.8';
    expect(validateBudgetRecord(
      wrong, fixture.rowsSha256, baselineProjection.rowsSha256,
    ).errors.join('\n')).toMatch(/baseline browser does not match the Arc 1A calibration authority/);
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
