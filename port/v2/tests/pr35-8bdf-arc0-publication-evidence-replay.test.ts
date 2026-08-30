import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import {
  arc0LandingSurveyRouteIsExact,
  assessArc0LandingPublicationWithheld,
} from '../tools/slicesmoke-contract.mjs';

const SOURCE = Object.freeze({
  commit: '8bdf474e92467652729a6980f706ca3a2813682c',
  branch: 'openai/mac',
  state: 'committed',
  statusSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  workingTreeSha256: 'f0af1e1d86a1c7d87a6741fb76deb2ceb20d27ded2019e53949ede9d907c758a',
});

const CARRIERS = Object.freeze({
  compendium: Object.freeze({
    file: 'ARC1C_COMPENDIUM_PR35_ARC0_ORACLE_PASS_20260830_8BDF474.json.gz',
    gzipBytes: 450_176,
    gzipSha256: '802547558972a4c118df18fd2fe857c0ffabcbfcadb6f0cbc71cb31e25c435aa',
    rawBytes: 10_832_155,
    rawSha256: 'c2fa92014af534a96725c3fa81662ebc49d158e3441a972bee663b8d8b1da77a',
  }),
  slice: Object.freeze({
    file: 'ARC4_SLICE_PR35_ARC0_PUBLICATION_ORACLE_RED_20260830_8BDF474.json.gz',
    gzipBytes: 97_319,
    gzipSha256: 'd8fc5dbf6731c0e95aa5984cd945f1995d9ba25c0dc985cca2ffb59cbdb9305f',
    rawBytes: 726_598,
    rawSha256: 'b0df4530c52c99ee6bdd8e29af1af0b9ba207a45b36b9e6393f067a2540448f3',
  }),
  log: Object.freeze({
    file: 'ARC4_SLICE_PR35_ARC0_PUBLICATION_ORACLE_RED_20260830_8BDF474.log.gz',
    gzipBytes: 43_114,
    gzipSha256: 'b88600767390ef5d79f17134fda5d5093d1d2fb13121d9d869bc2127389c7a9c',
    rawBytes: 303_026,
    rawSha256: '46be64ce0506c0d761787acff8f7d4f02d1bd2e54085f9fce74f932691ed1c17',
  }),
});

const COMPENDIUM_REVIEW_PACKET = Object.freeze([
  Object.freeze({
    profile: 'phone', state: 'list',
    file: 'apps/game/smoke/compendiummem-20260830-pr35-arc3-8bdf474e9246-compendium-certification-phone-list.png',
    bytes: 718_126,
    sha256: '17311d46f4cbbf75c0d489cc80beccc52cb516fe32cb434279b84b0765e3ee26',
  }),
  Object.freeze({
    profile: 'phone', state: 'focus-pinned',
    file: 'apps/game/smoke/compendiummem-20260830-pr35-arc3-8bdf474e9246-compendium-certification-phone-focus-pinned.png',
    bytes: 647_200,
    sha256: '8a737f97d67296572299d446f9a0417544da9a06ddaa35281ea04a11a3340978',
  }),
  Object.freeze({
    profile: 'phone', state: 'detail',
    file: 'apps/game/smoke/compendiummem-20260830-pr35-arc3-8bdf474e9246-compendium-certification-phone-detail.png',
    bytes: 779_305,
    sha256: 'f945ccf1d81106067777688b44ec6e4782d5cdd689aa44dd7142329d72e7b693',
  }),
  Object.freeze({
    profile: 'desktop', state: 'list',
    file: 'apps/game/smoke/compendiummem-20260830-pr35-arc3-8bdf474e9246-compendium-certification-desktop-list.png',
    bytes: 620_296,
    sha256: '6fed609a3205c009ab0ab4cbe287af7b2314d2db6b6423069644ae188dacf9c7',
  }),
  Object.freeze({
    profile: 'desktop', state: 'focus-pinned',
    file: 'apps/game/smoke/compendiummem-20260830-pr35-arc3-8bdf474e9246-compendium-certification-desktop-focus-pinned.png',
    bytes: 609_176,
    sha256: '787d084512d4112dad77a3ddc091fe4d5c69cf5fe425818f2adf7ba02edd31b5',
  }),
  Object.freeze({
    profile: 'desktop', state: 'detail',
    file: 'apps/game/smoke/compendiummem-20260830-pr35-arc3-8bdf474e9246-compendium-certification-desktop-detail.png',
    bytes: 614_132,
    sha256: 'ede79803e3d2873503a8ea833260327f9264d663c3473e9822649f55ac2781da',
  }),
]);

const here = path.dirname(fileURLToPath(import.meta.url));
const auditsRoot = path.resolve(here, '..', '..', '..', 'audits');
const sha256 = (value: Buffer | string): string => (
  createHash('sha256').update(value).digest('hex')
);
const load = (authority: typeof CARRIERS[keyof typeof CARRIERS]) => {
  const compressed = fs.readFileSync(path.join(auditsRoot, authority.file));
  const raw = gunzipSync(compressed);
  return { authority, compressed, raw };
};
const compendiumCarrier = load(CARRIERS.compendium);
const sliceCarrier = load(CARRIERS.slice);
const logCarrier = load(CARRIERS.log);
const compendium = JSON.parse(compendiumCarrier.raw.toString('utf8'));
const slice = JSON.parse(sliceCarrier.raw.toString('utf8'));
const sliceLog = logCarrier.raw.toString('utf8');
const findingMessage = slice.findings[0].message as string;
const findingPayload = JSON.parse(findingMessage.slice(findingMessage.indexOf('{')));

const liveProduct = (state: Record<string, any>) => ({
  mode: state?.mode ?? null,
  gal: state?.gal ?? null,
  galX: state?.galX ?? null,
  galY: state?.galY ?? null,
  star: state?.star ?? null,
  starX: state?.starX ?? null,
  starY: state?.starY ?? null,
  planet: state?.planet ?? null,
  planetOrdinal: state?.planetOrdinal ?? null,
  navGalaxyKey: state?.navGalaxyKey ?? null,
  navStarKey: state?.navStarKey ?? null,
  navWorldKey: state?.navWorldKey ?? null,
  save: structuredClone(state?.save ?? null),
});

describe('exact-source 8bdf Compendium PASS and Arc 0 publication-oracle red replay', () => {
  it('binds all three gzip carriers and their immutable raw payloads', () => {
    for (const carrier of [compendiumCarrier, sliceCarrier, logCarrier]) {
      expect(carrier.compressed).toHaveLength(carrier.authority.gzipBytes);
      expect(sha256(carrier.compressed)).toBe(carrier.authority.gzipSha256);
      expect(carrier.raw).toHaveLength(carrier.authority.rawBytes);
      expect(sha256(carrier.raw)).toBe(carrier.authority.rawSha256);
    }
  });

  it('preserves the one-attempt 78/78 Compendium predecessor', () => {
    expect(compendium).toMatchObject({
      schema: 'cf-v2-compendium-memory-report/v1',
      runId: '20260830-pr35-arc3-8bdf474e9246-compendium-certification',
      status: 'pass',
      durationMs: 64_108,
      lifecycle: { status: 'complete' },
      policy: { attemptCount: 1, automaticRetries: 0 },
      source: { begin: SOURCE, end: SOURCE },
      browser: { product: 'Edg/152.0.4191.53', protocol_version: '1.3' },
    });
    expect(compendium.expectedOutcomes).toHaveLength(78);
    expect(new Set(compendium.expectedOutcomes).size).toBe(78);
    expect(compendium.outcomes).toHaveLength(78);
    expect(compendium.outcomes.map(({ id }: { id: string }) => id))
      .toEqual(compendium.expectedOutcomes);
    expect(compendium.outcomes.every(({ status }: { status: string }) => status === 'pass'))
      .toBe(true);
    expect(compendium.outcomes.filter(({ profile }: { profile: string }) => profile === 'phone'))
      .toHaveLength(39);
    expect(compendium.outcomes.filter(({ profile }: { profile: string }) => profile === 'desktop'))
      .toHaveLength(39);
    expect(compendium.findings).toEqual([]);
    expect(compendium.blockedOutcomes).toEqual([]);
    expect(compendium.partialFailure).toBeNull();
    expect(compendium.reviewPacket).toEqual(COMPENDIUM_REVIEW_PACKET);
  });

  it('preserves one terminal Slice scope with no retry or successor authority', () => {
    expect(slice).toMatchObject({
      schema: 'cf-v2-slice-smoke-ci/v1',
      run: { id: '20260830-pr35-arc3-8bdf474e9246-slice-certification' },
      status: 'fail',
      terminal: true,
      certifying: false,
      durationMs: 111_490,
      source: SOURCE,
      sourceEnd: SOURCE,
      sourceChange: { detected: false, ending: null },
      retryPolicy: { automaticRetries: 0 },
      exit: { code: 1, childCode: 1, signal: null, spawnError: null },
      summary: { findingCount: 1, scopeCount: 1 },
      failureEvidence: { declaredCount: 1, bulletCount: 1, diagnostics: [] },
      rawLog: {
        bytes: CARRIERS.log.rawBytes,
        sha256: CARRIERS.log.rawSha256,
      },
      childOutput: { overallPassMarkerCount: 0 },
    });
    expect(slice.findings).toHaveLength(1);
    expect(slice.findings[0].scope).toBe('arc-0-landing-publication-convergence');
    expect(sha256(findingMessage)).toBe(
      '3afc039bbea2652dad258c30507c2209ae808bb14b7d7c75cdcfcd43311a5026',
    );
    expect(slice.groups).toEqual([{
      scope: 'arc-0-landing-publication-convergence',
      primary: findingMessage,
      related: [],
    }]);
    expect(slice.arc4SuccessEvidence).toEqual({
      required: false,
      ok: null,
      ledger: null,
      ledgerLineCount: 0,
      passMarkerCount: 0,
      reasons: [],
    });
    expect(sliceLog).toContain('# run 20260830-pr35-arc3-8bdf474e9246-slice-certification');
    expect(sliceLog).toContain('SLICE SMOKE: FAIL — 1 finding');
    expect(sliceLog).not.toContain('SLICE SMOKE: PASS');
    expect(sliceLog).not.toContain('GLASS MATRIX: PASS');
    expect(sliceLog).not.toContain('RECOVERY: PASS');
    expect(Object.hasOwn(slice, 'successEvidence')).toBe(false);
    expect(Object.hasOwn(slice, 'glass')).toBe(false);
    expect(Object.hasOwn(slice, 'recovery')).toBe(false);
    expect(fs.readdirSync(auditsRoot).filter((name) =>
      name.includes('8BDF474') && /(?:GLASS|RECOVERY)/u.test(name))).toEqual([]);
  });

  it('replays the false-negative diagnosis and binds the historical held-share evidence limit', () => {
    const { assessment, evidence } = findingPayload;
    expect(assessment.checks).toEqual({
      fixture: true,
      oneAwaitedAction: true,
      faultWitness: true,
      oneAtomicCommit: true,
      durableLandingReward: true,
      durableRoute: true,
      durableWorldIdentity: true,
      localPublicationWithheld: false,
      coordinatorReleased: true,
      convergenceHeld: true,
      convergenceReleased: true,
      reloadFixedPoint: true,
      noRetryOrDoubleReward: true,
    });
    const beforeProduct = liveProduct(evidence.fixture.state);
    const heldProduct = liveProduct(evidence.heldState);
    const beforeBytes = JSON.stringify(beforeProduct);
    expect(JSON.stringify(heldProduct)).toBe(beforeBytes);
    expect(Buffer.byteLength(beforeBytes)).toBe(1_876);
    expect(sha256(beforeBytes)).toBe(
      'e353f175bdea46856ef7b6c9e1bc554a50870fa054dc7a687a293bb761ce9e78',
    );
    expect(evidence.fixture.state).toMatchObject({ cardOpen: true, cardTitle: 'Pertar' });
    expect(evidence.heldState).toMatchObject({ cardOpen: true, cardTitle: 'Pertar' });

    /* The immutable runner sampled cardCode/target after Survey, then sampled
       heldState alone after Landing. Preserve that limit explicitly: this
       report proves the held product/state contradiction, but it cannot be
       promoted into retrospective held share/target evidence. */
    expect(Object.hasOwn(evidence, 'heldCardCode')).toBe(false);
    expect(Object.hasOwn(evidence, 'heldTarget')).toBe(false);
    const historicalSurveyRouteEvidence = {
      state: evidence.heldState,
      cardCode: evidence.surveyCardCode,
      target: evidence.surveyTarget,
    };
    expect(arc0LandingSurveyRouteIsExact(historicalSurveyRouteEvidence)).toBe(true);
    expect(assessArc0LandingPublicationWithheld({
      beforeProduct,
      heldProduct,
      heldState: historicalSurveyRouteEvidence.state,
      cardCode: historicalSurveyRouteEvidence.cardCode,
      target: historicalSurveyRouteEvidence.target,
    })).toEqual({ ok: true, reasons: [] });
  });
});
