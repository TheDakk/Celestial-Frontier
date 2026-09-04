import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';

// @ts-expect-error The executable JavaScript evidence contract intentionally has no declaration shim.
import { arc3ActionLivePublicationParity, arc3ActionUnrelatedEvidencePreserved, v5ToolRowsComplete } from '../tools/engineering-browser-contract.mjs';

/*
 * This browser-free replay binds the immutable 4a82 Slice red that exposed
 * one legitimate st-mine Charter settlement being misclassified as unrelated
 * Engineering damage. It grants no successor authority to Glass or Recovery.
 */
const SOURCE = Object.freeze({
  commit: '4a82d9b82521ea9bd1ac5e7c0754a473bcadd997',
  branch: 'openai/mac',
  state: 'committed',
  statusSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  workingTreeSha256: 'f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a',
});

const COMPENDIUM = Object.freeze({
  file: 'ARC1C_COMPENDIUM_PR35_F4_ORACLE_PASS_20260830_4A82D9B.json.gz',
  gzipBytes: 522_115,
  gzipSha256: '61b3eae4153668e670ae598dd8239a6f746154d3612f60fd56942706df00f2e4',
  rawBytes: 10_834_839,
  rawSha256: '8ba9115c844d411c260b8a931ce24561746da6fe8878488a34235c0a5c721bff',
  runId: '20260830-pr35-f4-oracle-4a82d9b82521-compendium-certification',
});

const SLICE = Object.freeze({
  jsonFile: 'ARC4_SLICE_PR35_MINE_CHARTER_ORACLE_RED_20260830_4A82D9B.json.gz',
  jsonGzipBytes: 82_153,
  jsonGzipSha256: 'c544c705b1e5095457876d7b4b025660105325199ab1220270b9057da549d0d3',
  jsonRawBytes: 632_179,
  jsonRawSha256: '8a2b7308cd28b81035e386ea705791c8f19521581b834b23a7714e11c254b285',
  logFile: 'ARC4_SLICE_PR35_MINE_CHARTER_ORACLE_RED_20260830_4A82D9B.log.gz',
  logGzipBytes: 37_544,
  logGzipSha256: '5504f772d9ef6f7ce36c023fb3695bcc59aff99748273f601674137433091b16',
  logRawBytes: 260_179,
  logRawSha256: '502a0d2e2eb5032d5f6ab1fd45cb05c99ff46e341de65a141e19d154c536ec20',
  runId: '20260830152819879-75689-abf2a37ffd4d',
});

const SCOPES = Object.freeze([
  'arc-3-mine-action',
  'arc-3-mine-action-controls-failed',
  'harness',
]);

const MESSAGE_SHA256 = Object.freeze([
  '54a800711f3b07a59206cca501c5078354399457622694ebbd9c348785932c50',
  'a674c0fa5b4695ae272993d45e4f5a42d070e125a67c17c281e566e12f33b445',
  'ed255b27ff9351e579bc9b18a0818a6cf2390c47ac31a99f06577c53029e79a8',
]);

type Evidence = Record<string, any>;
type Finding = { index: number; scope: string; message: string };
type CompendiumReport = {
  schema: string;
  runId: string;
  status: string;
  durationMs: number;
  lifecycle: Record<string, string>;
  policy: Record<string, number>;
  source: { begin: typeof SOURCE; end: typeof SOURCE };
  expectedOutcomes: string[];
  outcomes: Array<{ id: string; profile: string; status: string }>;
  findings: string[];
  blockedOutcomes: string[];
  partialFailure: unknown;
  browser: Record<string, string>;
};
type SliceReport = {
  schema: string;
  run: Record<string, string>;
  status: string;
  terminal: boolean;
  certifying: boolean;
  source: typeof SOURCE;
  sourceEnd: typeof SOURCE;
  sourceChange: { detected: boolean; ending: unknown };
  retryPolicy: Record<string, unknown>;
  exit: Record<string, unknown>;
  summary: { findingCount: number; scopeCount: number };
  failureEvidence: Record<string, unknown>;
  findings: Finding[];
  groups: Array<{ scope: string; primary: string; related: string[] }>;
  rawLog: Record<string, unknown>;
  childOutput: Record<string, unknown>;
  arc4SuccessEvidence: Record<string, unknown>;
  [key: string]: unknown;
};

type Carrier = { compressed: Buffer; raw: Buffer };

const here = path.dirname(fileURLToPath(import.meta.url));
const auditsRoot = path.resolve(here, '..', '..', '..', 'audits');

function loadCarrier(file: string): Carrier {
  const compressed = fs.readFileSync(path.join(auditsRoot, file));
  return { compressed, raw: gunzipSync(compressed) };
}

const compendiumCarrier = loadCarrier(COMPENDIUM.file);
const sliceJsonCarrier = loadCarrier(SLICE.jsonFile);
const sliceLogCarrier = loadCarrier(SLICE.logFile);
const compendiumReport = JSON.parse(compendiumCarrier.raw.toString('utf8')) as CompendiumReport;
const report = JSON.parse(sliceJsonCarrier.raw.toString('utf8')) as SliceReport;
const sliceLog = sliceLogCarrier.raw.toString('utf8');

function sha256(value: Buffer | string): string {
  return createHash('sha256').update(value).digest('hex');
}

function findingPayload(scope: string): Record<string, any> {
  const matches = report.findings.filter((finding) => finding.scope === scope);
  expect(matches, `one exact ${scope} finding`).toHaveLength(1);
  const [finding] = matches;
  if (!finding) throw new Error(`missing exact ${scope} finding`);
  const start = finding.message.indexOf('{');
  expect(start, `${scope} JSON payload`).toBeGreaterThanOrEqual(0);
  return JSON.parse(finding.message.slice(start)) as Record<string, any>;
}

function synchronizedPlayerMutant(
  accepted: Evidence,
  field: string,
  replacement: unknown,
): Evidence {
  const mutant = structuredClone(accepted) as Evidence;
  mutant.legacy[field] = structuredClone(replacement);
  mutant.playerRow.data[field] = structuredClone(replacement);
  mutant.legacyRaw = JSON.stringify(mutant.legacy);
  mutant.playerRaw = JSON.stringify(mutant.playerRow);
  return mutant;
}

function withoutSynchronizedPlayerFields(evidence: Evidence, fields: readonly string[]): Evidence {
  const mutant = structuredClone(evidence) as Evidence;
  for (const field of fields) {
    delete mutant.legacy[field];
    delete mutant.playerRow.data[field];
  }
  mutant.legacyRaw = JSON.stringify(mutant.legacy);
  mutant.playerRaw = JSON.stringify(mutant.playerRow);
  return mutant;
}

describe('exact-source 4a82 Mine Charter oracle evidence replay', () => {
  it('binds all carriers plus the exact Compendium PASS and terminal Slice run', () => {
    const artifacts = [
      {
        carrier: compendiumCarrier,
        gzipBytes: COMPENDIUM.gzipBytes,
        gzipSha256: COMPENDIUM.gzipSha256,
        rawBytes: COMPENDIUM.rawBytes,
        rawSha256: COMPENDIUM.rawSha256,
      },
      {
        carrier: sliceJsonCarrier,
        gzipBytes: SLICE.jsonGzipBytes,
        gzipSha256: SLICE.jsonGzipSha256,
        rawBytes: SLICE.jsonRawBytes,
        rawSha256: SLICE.jsonRawSha256,
      },
      {
        carrier: sliceLogCarrier,
        gzipBytes: SLICE.logGzipBytes,
        gzipSha256: SLICE.logGzipSha256,
        rawBytes: SLICE.logRawBytes,
        rawSha256: SLICE.logRawSha256,
      },
    ];

    for (const artifact of artifacts) {
      expect(artifact.carrier.compressed.byteLength).toBe(artifact.gzipBytes);
      expect(sha256(artifact.carrier.compressed)).toBe(artifact.gzipSha256);
      expect(artifact.carrier.raw.byteLength).toBe(artifact.rawBytes);
      expect(sha256(artifact.carrier.raw)).toBe(artifact.rawSha256);
    }

    expect(compendiumReport).toMatchObject({
      schema: 'cf-v2-compendium-memory-report/v1',
      runId: COMPENDIUM.runId,
      status: 'pass',
      durationMs: 64_895,
      lifecycle: { schema: 'cf-v2-compendium-report-lifecycle/v1', status: 'complete' },
      policy: { attemptCount: 1, automaticRetries: 0 },
      browser: { product: 'Edg/152.0.4191.53', protocol_version: '1.3' },
    });
    expect(compendiumReport.source).toEqual({ begin: SOURCE, end: SOURCE });
    expect(compendiumReport.expectedOutcomes).toHaveLength(78);
    expect(new Set(compendiumReport.expectedOutcomes).size).toBe(78);
    expect(compendiumReport.outcomes).toHaveLength(78);
    expect(compendiumReport.outcomes.map(({ id }) => id)).toEqual(
      compendiumReport.expectedOutcomes,
    );
    expect(compendiumReport.outcomes.every(({ status }) => status === 'pass')).toBe(true);
    expect(compendiumReport.outcomes.filter(({ profile }) => profile === 'phone')).toHaveLength(39);
    expect(compendiumReport.outcomes.filter(({ profile }) => profile === 'desktop')).toHaveLength(39);
    expect(compendiumReport.findings).toEqual([]);
    expect(compendiumReport.blockedOutcomes).toEqual([]);
    expect(compendiumReport.partialFailure).toBeNull();

    expect(report).toMatchObject({
      schema: 'cf-v2-slice-smoke-ci/v1',
      run: {
        id: SLICE.runId,
        artifactPath: `apps/game/smoke/slice-smoke-${SLICE.runId}.json`,
        screenshotPattern: `apps/game/smoke/slice-${SLICE.runId}-*.png`,
      },
      status: 'fail',
      terminal: true,
      certifying: false,
      sourceChange: { detected: false, ending: null },
      retryPolicy: { automaticRetries: 0 },
      exit: { code: 1, childCode: 1, signal: null, spawnError: null },
      summary: { findingCount: 3, scopeCount: 3 },
      failureEvidence: { declaredCount: 3, bulletCount: 3, diagnostics: [] },
    });
    expect(report.source).toEqual(SOURCE);
    expect(report.sourceEnd).toEqual(SOURCE);
    expect(report.findings.map(({ index }) => index)).toEqual([0, 1, 2]);
    expect(report.findings.map(({ scope }) => scope)).toEqual(SCOPES);
    expect(report.findings.map(({ message }) => sha256(message))).toEqual(MESSAGE_SHA256);
    expect(report.groups.map(({ scope }) => scope)).toEqual(SCOPES);
    expect(report.groups.map(({ primary }) => primary)).toEqual(
      report.findings.map(({ message }) => message),
    );
    expect(report.groups.every(({ related }) => related.length === 0)).toBe(true);
  });

  it('extracts the exact arc-3-mine-action evidence bundle from the first red scope', () => {
    const payload = findingPayload('arc-3-mine-action');
    expect(payload).toMatchObject({
      mineReleased: true,
      assessment: {
        ok: false,
        reasons: ['unrelated durable Engineering rows/extensions preserved'],
        checks: { unrelatedDurablePreserved: false },
      },
      bundle: {
        operation: 'mine-world',
        before: { revision: 66 },
        after: { revision: 67 },
      },
    });
    expect(v5ToolRowsComplete(payload.bundle.before)).toBe(true);
    expect(v5ToolRowsComplete(payload.bundle.after)).toBe(true);
  });

  it('accepts only the exact synchronized st-mine Charter settlement', () => {
    const { before, after, beforeState, afterState, operation } = findingPayload(
      'arc-3-mine-action',
    ).bundle as {
      before: Evidence;
      after: Evidence;
      beforeState: Evidence;
      afterState: Evidence;
      operation: string;
    };

    expect(operation).toBe('mine-world');
    expect({
      before: {
        chs: before.legacy.chs,
        chp: before.legacy.chp,
        chacc: before.legacy.chacc,
        charters: before.legacy.charters,
        essence: before.legacy.essence,
        essenceEarned: before.legacy.essenceEarned,
      },
      after: {
        chs: after.legacy.chs,
        chp: after.legacy.chp,
        chacc: after.legacy.chacc,
        charters: after.legacy.charters,
        essence: after.legacy.essence,
        essenceEarned: after.legacy.essenceEarned,
      },
    }).toEqual({
      before: {
        chs: ['st-land'],
        chp: { 'st-mine': 2 },
        chacc: ['st-mine'],
        charters: 2,
        essence: 5_000,
        essenceEarned: 9_000,
      },
      after: {
        chs: ['st-land', 'st-mine'],
        chp: { 'st-mine': 1 },
        chacc: [],
        charters: 3,
        essence: 5_015,
        essenceEarned: 9_015,
      },
    });
    expect(arc3ActionUnrelatedEvidencePreserved(before, after, operation)).toBe(true);

    const isolatedMutants = [
      ['chs', ['st-land']],
      ['chp', { 'st-mine': 2 }],
      ['chacc', ['st-mine']],
      ['charters', 4],
      ['essence', 5_014],
      ['essenceEarned', 9_014],
    ] as const;

    for (const [field, replacement] of isolatedMutants) {
      const mutant = synchronizedPlayerMutant(after, field, replacement);
      expect(v5ToolRowsComplete(mutant), `${field} mutant remains structurally complete`).toBe(true);
      expect(
        arc3ActionUnrelatedEvidencePreserved(before, mutant, operation),
        `${field} mutant must not broaden the accepted Charter settlement`,
      ).toBe(false);
    }

    const malformedPredecessorPairs = [
      {
        label: 'unknown completed starter',
        before: synchronizedPlayerMutant(before, 'chs', ['st-land', 'unknown-starter']),
        after: synchronizedPlayerMutant(after, 'chs', ['st-land', 'unknown-starter', 'st-mine']),
      },
      {
        label: 'accepted bound',
        before: synchronizedPlayerMutant(
          before, 'chacc', ['st-mine', ...Array.from({ length: 50 }, (_, index) => `wk-${index}`)],
        ),
        after: synchronizedPlayerMutant(
          after, 'chacc', Array.from({ length: 50 }, (_, index) => `wk-${index}`),
        ),
      },
      {
        label: 'accepted id length',
        before: synchronizedPlayerMutant(before, 'chacc', ['st-mine', 'x'.repeat(25)]),
        after: synchronizedPlayerMutant(after, 'chacc', ['x'.repeat(25)]),
      },
      {
        label: 'accepted-completed overlap',
        before: synchronizedPlayerMutant(before, 'chacc', ['st-mine', 'st-land']),
        after: synchronizedPlayerMutant(after, 'chacc', ['st-land']),
      },
      ...[
        { 'st-mine': 2, '': 1 },
        { 'st-mine': 2, ['x'.repeat(24)]: 1 },
        { 'st-mine': 2, bad: -1 },
        { 'st-mine': 2, bad: 1_000 },
        { 'st-mine': 2, bad: 1.5 },
      ].map((progress, index) => ({
        label: `progress shape ${index}`,
        before: synchronizedPlayerMutant(before, 'chp', progress),
        after: synchronizedPlayerMutant(after, 'chp', { ...progress, 'st-mine': 1 }),
      })),
      {
        label: 'required Charter fields',
        before: withoutSynchronizedPlayerFields(
          before, ['chs', 'chp', 'chacc', 'charters', 'essence', 'essenceEarned'],
        ),
        after: withoutSynchronizedPlayerFields(
          after, ['chs', 'chp', 'chacc', 'charters', 'essence', 'essenceEarned'],
        ),
      },
    ];

    for (const pair of malformedPredecessorPairs) {
      expect(v5ToolRowsComplete(pair.before), `${pair.label} predecessor remains structural`).toBe(true);
      expect(v5ToolRowsComplete(pair.after), `${pair.label} successor remains structural`).toBe(true);
      expect(
        arc3ActionUnrelatedEvidencePreserved(pair.before, pair.after, operation),
        `${pair.label} must not fabricate a product-valid Mine transaction`,
      ).toBe(false);
    }

    expect(arc3ActionLivePublicationParity(after, afterState)).toBe(true);
    const livePublicationMutations: Array<readonly [string, (save: Evidence) => void]> = [
      ['chDone', (save: Evidence) => { save.chDone = structuredClone(beforeState.save.chDone); }],
      ['chProg', (save: Evidence) => { save.chProg = structuredClone(beforeState.save.chProg); }],
      ['chacc', (save: Evidence) => { save.chacc = structuredClone(beforeState.save.chacc); }],
      ['essence', (save: Evidence) => { save.essence = beforeState.save.essence; }],
      ['unlocked', (save: Evidence) => {
        save.unlocked = [...save.unlocked, 'arc3-live-publication-control'];
      }],
    ];
    const requiredLiveStatFields = [
      'landings', 'charters', 'breeds', 'breedwins', 'feeds', 'feedfails',
      'harvests', 'essenceEarned', 'guardians', 'paragons', 'bestRank', 'mines',
      'crafts', 'minedout', 'skims', 'cosmics', 'shares', 'jumps', 'anomalies',
      'events', 'duels', 'duelwins', 'hybrids', 'best', 'maxGen', 'surveys',
    ];
    for (const field of [...requiredLiveStatFields, 'scanhits', 'arrivals']) {
      livePublicationMutations.push([`stats.${field}`, (save: Evidence) => {
        save.stats[field] = Number(save.stats[field] ?? 0) + 1;
      }]);
    }
    for (const field of requiredLiveStatFields) {
      livePublicationMutations.push([`stats.${field} presence`, (save: Evidence) => {
        delete save.stats[field];
      }]);
    }
    for (const [label, mutate] of livePublicationMutations) {
      const mutant = structuredClone(afterState) as Evidence;
      mutate(mutant.save);
      expect(
        arc3ActionLivePublicationParity(after, mutant),
        `${label} live-only publication drift must be red`,
      ).toBe(false);
    }
    const unrelatedLiveState = structuredClone(afterState) as Evidence;
    unrelatedLiveState.save.name = 'unrelated live presentation control';
    expect(arc3ActionLivePublicationParity(after, unrelatedLiveState)).toBe(true);

    const explicitZeroScanhits = structuredClone(afterState) as Evidence;
    explicitZeroScanhits.save.stats.scanhits = 0;
    expect(arc3ActionLivePublicationParity(after, explicitZeroScanhits)).toBe(true);
    delete explicitZeroScanhits.save.stats.scanhits;
    expect(arc3ActionLivePublicationParity(after, explicitZeroScanhits)).toBe(true);

    const arrivalsEvidence = structuredClone(after) as Evidence;
    arrivalsEvidence.legacy.ever.arrivals = arrivalsEvidence.legacy.sysv.length;
    const arrivalsState = structuredClone(afterState) as Evidence;
    arrivalsState.save.stats.arrivals = arrivalsEvidence.legacy.sysv.length;
    expect(arc3ActionLivePublicationParity(arrivalsEvidence, arrivalsState)).toBe(true);
    arrivalsState.save.stats.arrivals += 1;
    expect(arc3ActionLivePublicationParity(arrivalsEvidence, arrivalsState)).toBe(false);

    const duplicateSurveyLedger = structuredClone(after) as Evidence;
    duplicateSurveyLedger.legacy.surveyed.push(duplicateSurveyLedger.legacy.surveyed[0]);
    expect(arc3ActionLivePublicationParity(duplicateSurveyLedger, afterState)).toBe(false);
  });

  it('denies Glass and Recovery successor authority to the terminal Slice red', () => {
    expect(report.rawLog).toEqual({
      path: `apps/game/smoke/slice-smoke-${SLICE.runId}.log`,
      bytes: SLICE.logRawBytes,
      sha256: SLICE.logRawSha256,
    });
    expect(report.childOutput).toEqual({
      stdoutBytes: 2_995,
      stdoutSha256: '8ad3a88adb65e57900cb0b7f1b244009be48494391dbc048e04d770e9017cedf',
      stderrBytes: 257_003,
      stderrSha256: '5c545ac7b030ee18f233c4503fbb164e12c0174519f1c77f4f4069bc9bbf62d3',
      overallPassMarkerCount: 0,
    });
    expect(report.arc4SuccessEvidence).toEqual({
      required: false,
      ok: null,
      ledger: null,
      ledgerLineCount: 0,
      passMarkerCount: 0,
      reasons: [],
    });
    expect(sliceLog).toContain(`# run ${SLICE.runId}`);
    expect(sliceLog).toContain('SLICE SMOKE: FAIL — 3 findings');
    expect(sliceLog).toContain('1. ARC 3 MINE ACTION');
    expect(sliceLog).toContain('2. ARC 3 MINE ACTION CONTROLS FAILED');
    expect(sliceLog).toContain('3. harness');
    expect(sliceLog).not.toContain('SLICE SMOKE: PASS');
    expect(sliceLog).not.toContain('GLASS MATRIX: PASS');
    expect(sliceLog).not.toContain('RECOVERY: PASS');
    expect(Object.hasOwn(report, 'successEvidence')).toBe(false);
    expect(Object.hasOwn(report, 'glass')).toBe(false);
    expect(Object.hasOwn(report, 'recovery')).toBe(false);

    const successors = fs.readdirSync(auditsRoot).filter((name) =>
      name.includes('4A82D9B') && /(?:GLASS|RECOVERY)/u.test(name));
    expect(successors).toEqual([]);
  });
});
