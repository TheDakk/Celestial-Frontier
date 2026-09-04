import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

/* Historical evidence owns every literal in this file. The retained report
 * remains a terminal product-red under its old stale witness; this test binds
 * the evidence that justified repairing the collector without relabeling it. */
const EVIDENCE = Object.freeze({
  file: 'ARC1A_COMPENDIUM_PR35_HOSTED_BACK_ACTION_WITNESS_INSTRUMENT_RED_20260831_4CCAE86.json.gz',
  gzipBytes: 566_480,
  gzipSha256: '075ba73e3a9209b89c7892192c671e20e47bfb663fd4a41569c66218270d6f0d',
  rawBytes: 12_775_383,
  rawSha256: '0a8a840ce2f410e467640bf6813b95114d16da673cb9660ea1d65a1cc245f862',
  runId: 'gha-33437596315-1-compendiummem',
  sourceCommit: '4ccae861ab2f43f4269edfeefa51fd2e4985a875',
  workingTreeSha256: 'f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a',
  budgetSha256: '80a2b8b39d400419a5527f9737a92ea2e0c54916ba8c3966411e607fd950fd79',
  collectorSha256: '0af0f5884c0eec67cea7c6696c20a2c691c669fa93ee255fd1c54d17b56d5010',
  outcomeContractSha256: '9fc43fe4d29453ec4b546a53a2e62bc874499c67bae9f0f0f4c33e8063c41828',
  measurementAuthoritySha256: '5c408472b808f09e9f31133905635f08b7ef3588fad151f5f68e2a67ff68b1d0',
  producerAuthoritySha256: 'af74148c97a41a421592baee801611787f065c60a64bf6da38985bf00bdd79c7',
});

type Anchor = {
  logicalId: string;
  offsetPx: number;
  scrollTop: number;
  window: { start: number; end: number; beforePx: number; afterPx: number };
  selectedLogicalId: string | null;
  selectedIndex: number | null;
  selectedMounted: boolean;
  selectedIntersects: boolean;
  selectedInWindow: boolean;
  selectedPinned: boolean;
  activeLogicalId: string | null;
};

type BackNavigation = {
  before: Anchor;
  after: Anchor;
  afterSettled: Anchor;
};

type ThumbSettlement = {
  label: string;
  attempt: number;
  observation: {
    ready: boolean;
    ownership: { rawLogicalIds: string[] };
  };
};

type Profile = {
  pageAuthorities: { main: { targetId: string; sessionId: string; documentToken: string } };
  phases: {
    backNavigation: BackNavigation;
    thumbnailSettlementHistory: ThumbSettlement[];
  };
};

type Outcome = {
  id: string;
  profile: string;
  check: string;
  status: 'pass' | 'fail';
  diagnosis: string | null;
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
    sha256: string;
    browserAuthorityMatch: boolean;
    producerAuthority: { sha256: string };
    observedProducerAuthority: { sha256: string };
    producerAuthorityMatch: boolean;
  };
  expectedOutcomes: string[];
  outcomes: Outcome[];
  findings: string[];
  blockedOutcomes: string[];
  profiles: { phone: Profile; desktop: Profile };
  reviewPacket: unknown[];
};

const here = path.dirname(fileURLToPath(import.meta.url));
const carrierPath = path.resolve(here, '..', '..', '..', 'audits', EVIDENCE.file);
const compressed = fs.readFileSync(carrierPath);
const raw = gunzipSync(compressed);
const report = JSON.parse(raw.toString('utf8')) as HistoricalReport;

function sha256(value: Buffer | string): string {
  return createHash('sha256').update(value).digest('hex');
}

describe('PR #35 hosted Compendium stale Back-witness carrier', () => {
  it('binds the immutable compressed and raw report bytes', () => {
    expect(compressed.byteLength).toBe(EVIDENCE.gzipBytes);
    expect(sha256(compressed)).toBe(EVIDENCE.gzipSha256);
    expect(raw.byteLength).toBe(EVIDENCE.rawBytes);
    expect(sha256(raw)).toBe(EVIDENCE.rawSha256);
  });

  it('binds the exact run, clean synthetic merge, browser, and old authorities', () => {
    expect(report).toMatchObject({
      schema: 'cf-v2-compendium-memory-report/v1',
      runId: EVIDENCE.runId,
      status: 'fail',
      startedAt: '2026-08-31T20:51:54.654Z',
      endedAt: '2026-08-31T21:20:59.140Z',
      durationMs: 1_744_486,
      lifecycle: { schema: 'cf-v2-compendium-report-lifecycle/v1', status: 'complete' },
      policy: {
        attemptCount: 1,
        automaticRetries: 0,
        commandTimeoutMs: 2_000,
        targetTimeoutMs: 2_000,
        heartbeatTimeoutMs: 2_000,
        transportTimeoutMs: 5_000,
      },
      browser: {
        product: 'Edg/151.0.4129.101',
        revision: '@cc1d9f4080fd9140611a9600b8d1615db310105d',
        js_version: '15.1.23.9',
        protocol_version: '1.3',
      },
    });
    const exactSource = {
      commit: EVIDENCE.sourceCommit,
      branch: 'detached',
      state: 'committed',
      statusSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      workingTreeSha256: EVIDENCE.workingTreeSha256,
    };
    expect(report.source.begin).toEqual(exactSource);
    expect(report.source.end).toEqual(exactSource);
    expect(report.inputs).toMatchObject({
      budget: EVIDENCE.budgetSha256,
      collector: EVIDENCE.collectorSha256,
      outcomeContract: EVIDENCE.outcomeContractSha256,
    });
    const measurementInputs = Object.fromEntries(Object.entries(report.inputs)
      .filter(([key]) => key !== 'budget'));
    expect(sha256(JSON.stringify(measurementInputs)))
      .toBe(EVIDENCE.measurementAuthoritySha256);
    expect(report.budget).toMatchObject({
      sha256: EVIDENCE.budgetSha256,
      browserAuthorityMatch: true,
      producerAuthority: { sha256: EVIDENCE.producerAuthoritySha256 },
      observedProducerAuthority: { sha256: EVIDENCE.producerAuthoritySha256 },
      producerAuthorityMatch: true,
    });
  });

  it('preserves the exact 77-pass/one-fail terminal result without relabeling it', () => {
    expect(report.expectedOutcomes).toHaveLength(78);
    expect(new Set(report.expectedOutcomes).size).toBe(78);
    expect(report.outcomes).toHaveLength(78);
    expect(report.outcomes.filter((outcome) => outcome.status === 'pass')).toHaveLength(77);
    const failures = report.outcomes.filter((outcome) => outcome.status === 'fail');
    expect(failures).toEqual([{
      id: 'desktop/back-restores-focus',
      profile: 'desktop',
      check: 'back-restores-focus',
      status: 'fail',
      diagnosis: 'desktop: Back did not restore the selected deep row and logical top-anchor/offset after two settlements',
      evidence: expect.any(Object),
    }]);
    expect(report.findings).toEqual([failures[0]!.diagnosis]);
    expect(report.blockedOutcomes).toEqual([]);
    expect(report.reviewPacket).toHaveLength(6);
  });

  it('proves the old desktop ruler sampled before three legitimate activation settlements', () => {
    const navigation = report.profiles.desktop.phases.backNavigation;
    expect(Object.keys(navigation).sort()).toEqual(['after', 'afterSettled', 'before']);
    expect(navigation.before).toMatchObject({
      logicalId: 'cmem-0773', offsetPx: -34,
      window: { start: 770, end: 782 },
      selectedLogicalId: 'cmem-0777-filter-beacon', selectedIndex: 777,
      selectedMounted: true, selectedIntersects: true,
    });
    expect(navigation.after).toMatchObject({
      logicalId: 'cmem-0773', offsetPx: -92,
      window: { start: 771, end: 783 },
      selectedLogicalId: 'cmem-0777-filter-beacon', selectedIndex: 777,
      selectedMounted: true, selectedIntersects: true, selectedPinned: true,
      activeLogicalId: 'cmem-0777-filter-beacon',
    });
    expect(navigation.afterSettled).toEqual(navigation.after);
    expect(Math.abs(navigation.before.offsetPx - navigation.after.offsetPx)).toBe(58);

    const attempts = report.profiles.desktop.phases.thumbnailSettlementHistory
      .filter((entry) => entry.label === 'detail-back-row-activation-list');
    expect(attempts.map((entry) => entry.attempt)).toEqual([1, 2, 3]);
    expect(attempts.every((entry) => entry.observation.ready)).toBe(true);
    expect(attempts[0]!.observation.ownership.rawLogicalIds).toEqual([
      'cmem-0775', 'cmem-0776', 'cmem-0777-filter-beacon', 'cmem-0778',
      'cmem-0779', 'cmem-0780', 'cmem-0781', 'cmem-0782',
      'cmem-0783', 'cmem-0784', 'cmem-0785', 'cmem-0786',
    ]);
    const stableIds = [
      'cmem-0771', 'cmem-0772', 'cmem-0773', 'cmem-0774',
      'cmem-0775', 'cmem-0776', 'cmem-0777-filter-beacon', 'cmem-0778',
      'cmem-0779', 'cmem-0780', 'cmem-0781', 'cmem-0782',
    ];
    expect(attempts[1]!.observation.ownership.rawLogicalIds).toEqual(stableIds);
    expect(attempts[2]!.observation.ownership.rawLogicalIds).toEqual(stableIds);
    expect(navigation).not.toHaveProperty('actionWitness');
  });

  it('keeps the phone control green while absolute virtual pixels legitimately rebase', () => {
    const navigation = report.profiles.phone.phases.backNavigation;
    expect(navigation.before).toMatchObject({ logicalId: 'cmem-0776', offsetPx: -9 });
    expect(navigation.after).toMatchObject({
      logicalId: 'cmem-0776', offsetPx: -9,
      selectedPinned: true, activeLogicalId: 'cmem-0777-filter-beacon',
    });
    expect(navigation.afterSettled).toEqual(navigation.after);
    expect(navigation.before.scrollTop).not.toBe(navigation.after.scrollTop);
    expect(report.outcomes.find((outcome) => outcome.id === 'phone/back-restores-focus'))
      .toMatchObject({ status: 'pass', diagnosis: null });
  });
});
