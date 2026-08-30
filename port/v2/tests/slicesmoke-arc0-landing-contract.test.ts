import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  arc0LandingCoordinatorIsIdle,
  arc0LandingSurveyRouteIsExact,
  assessArc0LandingAwaitBoundary,
  assessArc0LandingPublicationWithheld,
} from '../tools/slicesmoke-contract.mjs';

const sliceSource = readFileSync(
  new URL('../tools/slicesmoke.mjs', import.meta.url),
  'utf8',
);

type Marker = readonly [label: string, target: string];
type OrderRule = Readonly<{ label: string; first: string; second: string }>;

const occurrences = (source: string, target: string): number => (
  source.split(target).length - 1
);

function section(source: string, start: string, end: string): string {
  expect(occurrences(source, start), `unique section start: ${start}`).toBe(1);
  expect(occurrences(source, end), `unique section end: ${end}`).toBe(1);
  const left = source.indexOf(start);
  const right = source.indexOf(end, left + start.length);
  expect(left).toBeGreaterThanOrEqual(0);
  expect(right).toBeGreaterThan(left);
  return source.slice(left, right);
}

function markerErrors(owner: string, markers: readonly Marker[]): string[] {
  return markers.flatMap(([label, target]) => {
    const count = occurrences(owner, target);
    return count === 1 ? [] : [`${label}: expected one marker, got ${count}`];
  });
}

function orderErrors(owner: string, rules: readonly OrderRule[]): string[] {
  return rules.flatMap(({ label, first, second }) => {
    const firstCount = occurrences(owner, first);
    const secondCount = occurrences(owner, second);
    if (firstCount !== 1 || secondCount !== 1) {
      return [`${label}: non-unique order markers (${firstCount}, ${secondCount})`];
    }
    return owner.indexOf(first) < owner.indexOf(second) ? [] : [`${label}: reversed`];
  });
}

function proveEachMarkerRequired(owner: string, markers: readonly Marker[]): void {
  expect(markerErrors(owner, markers)).toEqual([]);
  markers.forEach(([label, target], index) => {
    const replacement = `__ARC0_LANDING_MARKER_${index}__`;
    expect(owner).not.toContain(replacement);
    const mutant = owner.replace(target, replacement);
    expect(mutant, label).not.toBe(owner);
    expect(markerErrors(mutant, markers), label)
      .toContain(`${label}: expected one marker, got 0`);
  });
}

function swapUnique(owner: string, first: string, second: string, index: number): string {
  expect(occurrences(owner, first)).toBe(1);
  expect(occurrences(owner, second)).toBe(1);
  const marker = `__ARC0_LANDING_ORDER_${index}__`;
  expect(owner).not.toContain(marker);
  return owner.replace(first, marker).replace(second, first).replace(marker, second);
}

function proveEachOrderRequired(owner: string, rules: readonly OrderRule[]): void {
  expect(orderErrors(owner, rules)).toEqual([]);
  rules.forEach((rule, index) => {
    const mutant = swapUnique(owner, rule.first, rule.second, index);
    expect(orderErrors(mutant, [rule]), rule.label).toEqual([`${rule.label}: reversed`]);
  });
}

const faultFixtureOwner = section(
  sliceSource,
  'const ARC0_LANDING_FAULT_RAW = (() => {',
  'const ARC4_PERTAR_SOURCE_SAVE = JSON.parse(ARC4_PERTAR_RAW);',
);
const evidenceOwner = section(
  sliceSource,
  '  /* ARC 0 LANDING FAULT EVIDENCE BEGIN.',
  '  /* ARC 0 LANDING FAULT EVIDENCE END. */',
);
const collectorOwner = section(
  evidenceOwner,
  '  const collectArc0LandingFaultEvidence = async ({',
  '  const arc0LandingIsolatedControl =',
);
const sourceExactOwner = section(
  evidenceOwner,
  '  const arc0LandingSourceExact = (fixture) => {',
  '  const arc0LandingConvergenceHeld = (state) => (',
);
const surveyContractOwner = section(
  evidenceOwner,
  '  const arc0LandingSurveyReceiptPattern = /^arc9sv1:[0-9a-f]{64}$/u;',
  '  const arc0LandingConvergenceHeld = (state) => (',
);
const surveySetupOwner = section(
  evidenceOwner,
  '  const assessArc0LandingSurveySetup = (evidence) => {',
  '  const arc0LandingSurveyBaselineExact = (evidence) => (',
);
const reloadFixedPointOwner = section(
  evidenceOwner,
  '  const arc0LandingReloadFixedPoint = (evidence, route) => {',
  '  const arc0LandingConvergenceWitnessExact = (evidence, scenario, raw, detail) => {',
);
const convergenceWitnessOwner = section(
  evidenceOwner,
  '  const arc0LandingConvergenceWitnessExact = (evidence, scenario, raw, detail) => {',
  '  const arc0LandingFaultExact = (evidence, injection, outcome) => {',
);
const storageAssessmentOwner = section(
  evidenceOwner,
  '  const assessArc0LandingStorageRefusal = (evidence) => {',
  '  const assessArc0LandingStaleConvergence = (evidence) => {',
);
const staleAssessmentOwner = section(
  evidenceOwner,
  '  const assessArc0LandingStaleConvergence = (evidence) => {',
  '  const assessArc0LandingPublicationConvergence = (evidence) => {',
);
const publicationAssessmentOwner = section(
  evidenceOwner,
  '  const assessArc0LandingPublicationConvergence = (evidence) => {',
  '  const collectArc0LandingFaultEvidence = async ({',
);
const publicationProductOwner = section(
  evidenceOwner,
  '  const arc0LandingPublicationProductExact = (evidence) => {',
  '  const arc0LandingOneAwaitedActionExact = (evidence) => (',
);
const storageScenarioOwner = section(
  evidenceOwner,
  '  const arc0LandingStorageEvidence = await collectArc0LandingFaultEvidence({',
  '  const arc0LandingStaleEvidence = await collectArc0LandingFaultEvidence({',
);
const staleScenarioOwner = section(
  evidenceOwner,
  '  const arc0LandingStaleEvidence = await collectArc0LandingFaultEvidence({',
  '  const arc0LandingPublicationEvidence = await collectArc0LandingFaultEvidence({',
);
const publicationScenarioOwner = section(
  sliceSource,
  '  const arc0LandingPublicationEvidence = await collectArc0LandingFaultEvidence({',
  '  /* ARC 0 LANDING FAULT EVIDENCE END. */',
);

const PERTAR_GALAXY_KEY = 'CF1|g:999@90,-60';
const PERTAR_STAR_KEY = `${PERTAR_GALAXY_KEY}|s:1347060996@414.31,168.49`;
const PERTAR_PAYLOAD = Object.freeze({
  t: 'p',
  g: Object.freeze([90, -60, 78, 0, 0.62, 0.5, 999, 1]),
  s: Object.freeze([414.31, 168.49, 1_347_060_996]),
  p: 546_621_068,
});
const encodeCf1 = (payload: unknown): string => (
  `CF1-${Buffer.from(JSON.stringify(payload)).toString('base64url')}`
);
const exactPertarSurveyRouteEvidence = () => ({
  state: {
    mode: 'system',
    gal: 999,
    galX: 90,
    galY: -60,
    star: 1_347_060_996,
    starX: 414.31,
    starY: 168.49,
    planet: null,
    planetOrdinal: null,
    navGalaxyKey: PERTAR_GALAXY_KEY,
    navStarKey: PERTAR_STAR_KEY,
    navWorldKey: null,
    cardOpen: true,
    cardTitle: 'Pertar',
    epoch: 0,
    renderedScene: {
      serial: 7,
      mode: 'system',
      ecologyEpoch: 0,
      galaxyKey: PERTAR_GALAXY_KEY,
      starKey: PERTAR_STAR_KEY,
      worldKey: null,
    },
  },
  cardCode: encodeCf1(PERTAR_PAYLOAD),
  target: {
    seed: 546_621_068,
    ordinal: 3,
    screenX: 433.36161745314564,
    screenY: 294.0991033542126,
    width: 30.497786755310813,
    height: 30.497786755310813,
  },
});

describe('Slice Arc 0 Landing fault evidence contract', () => {
  it('classifies refused, wrong-document and never-settled actions before generic harness handling', () => {
    const exact = {
      actualAccepted: true,
      expectedAccepted: true,
      actionDocumentToken: 'document:pertar',
      expectedDocumentToken: 'document:pertar',
      waitError: null,
    };
    expect(assessArc0LandingAwaitBoundary(exact)).toEqual({ ok: true, reasons: [] });
    const controls = {
      refused: assessArc0LandingAwaitBoundary({ ...exact, actualAccepted: false }),
      wrongDocument: assessArc0LandingAwaitBoundary({
        ...exact, actionDocumentToken: 'document:other',
      }),
      neverSettled: assessArc0LandingAwaitBoundary({
        ...exact, waitError: 'exact settlement timed out with retained state',
      }),
      wrongAcceptedRefusal: assessArc0LandingAwaitBoundary({
        ...exact, expectedAccepted: false,
      }),
    };
    expect(controls.refused).toEqual({
      ok: false, reasons: ['accepted false !== true'],
    });
    expect(controls.wrongDocument).toEqual({
      ok: false, reasons: ['action document token drifted'],
    });
    expect(controls.neverSettled).toEqual({
      ok: false,
      reasons: ['expected stage did not settle: exact settlement timed out with retained state'],
    });
    expect(controls.wrongAcceptedRefusal).toEqual({
      ok: false, reasons: ['accepted true !== false'],
    });
  });

  it('evaluates every absolute post-Survey Pertar route/card/share field browser-free', () => {
    const exact = exactPertarSurveyRouteEvidence();
    expect(arc0LandingSurveyRouteIsExact(exact)).toBe(true);
    const mutateState = (change: (state: any) => void) => {
      const control = structuredClone(exact);
      change(control.state);
      return arc0LandingSurveyRouteIsExact(control);
    };
    const mutatePayload = (change: (payload: any) => void) => {
      const control = structuredClone(exact);
      const payload = structuredClone(PERTAR_PAYLOAD);
      change(payload);
      control.cardCode = encodeCf1(payload);
      return arc0LandingSurveyRouteIsExact(control);
    };
    expect({
      mode: mutateState((state) => { state.mode = 'surface'; }),
      galaxySeed: mutateState((state) => { state.gal += 1; }),
      galaxyX: mutateState((state) => { state.galX += 1; }),
      galaxyY: mutateState((state) => { state.galY += 1; }),
      starSeed: mutateState((state) => { state.star += 1; }),
      starX: mutateState((state) => { state.starX += 1; }),
      starY: mutateState((state) => { state.starY += 1; }),
      planet: mutateState((state) => { state.planet = 546_621_068; }),
      planetOrdinal: mutateState((state) => { state.planetOrdinal = 3; }),
      galaxyKey: mutateState((state) => { state.navGalaxyKey += ':control'; }),
      starKey: mutateState((state) => { state.navStarKey += ':control'; }),
      worldKey: mutateState((state) => { state.navWorldKey = 'control'; }),
      cardClosed: mutateState((state) => { state.cardOpen = false; }),
      cardTitle: mutateState((state) => { state.cardTitle = 'Not Pertar'; }),
      stateEpoch: mutateState((state) => { state.epoch += 1; }),
      renderedSerial: mutateState((state) => { state.renderedScene.serial = 0; }),
      renderedMode: mutateState((state) => { state.renderedScene.mode = 'surface'; }),
      renderedEpoch: mutateState((state) => { state.renderedScene.ecologyEpoch += 1; }),
      renderedGalaxy: mutateState((state) => { state.renderedScene.galaxyKey += ':control'; }),
      renderedStar: mutateState((state) => { state.renderedScene.starKey += ':control'; }),
      renderedWorld: mutateState((state) => { state.renderedScene.worldKey = 'control'; }),
      renderedExtra: mutateState((state) => { state.renderedScene.extra = true; }),
      invalidCode: arc0LandingSurveyRouteIsExact({ ...exact, cardCode: 'not-cf1' }),
      nonCanonicalCode: arc0LandingSurveyRouteIsExact({
        ...exact, cardCode: `${exact.cardCode}!`,
      }),
      payloadType: mutatePayload((payload) => { payload.t = 's'; }),
      payloadGalaxyX: mutatePayload((payload) => { payload.g[0] += 1; }),
      payloadGalaxyY: mutatePayload((payload) => { payload.g[1] += 1; }),
      payloadGalaxySize: mutatePayload((payload) => { payload.g[2] += 1; }),
      payloadGalaxySp: mutatePayload((payload) => { payload.g[3] += 1; }),
      payloadGalaxyTilt: mutatePayload((payload) => { payload.g[4] += 1; }),
      payloadGalaxyRot: mutatePayload((payload) => { payload.g[5] += 1; }),
      payloadGalaxySeed: mutatePayload((payload) => { payload.g[6] += 1; }),
      payloadGalaxyFlags: mutatePayload((payload) => { payload.g[7] += 1; }),
      payloadGalaxyLength: mutatePayload((payload) => { payload.g.push(0); }),
      payloadStarX: mutatePayload((payload) => { payload.s[0] += 1; }),
      payloadStarY: mutatePayload((payload) => { payload.s[1] += 1; }),
      payloadStarSeed: mutatePayload((payload) => { payload.s[2] += 1; }),
      payloadStarLength: mutatePayload((payload) => { payload.s.push(0); }),
      payloadPlanet: mutatePayload((payload) => { payload.p += 1; }),
      payloadExtra: mutatePayload((payload) => { payload.extra = true; }),
      targetSeed: arc0LandingSurveyRouteIsExact({
        ...exact, target: { ...exact.target, seed: exact.target.seed + 1 },
      }),
      targetOrdinal: arc0LandingSurveyRouteIsExact({
        ...exact, target: { ...exact.target, ordinal: exact.target.ordinal + 1 },
      }),
      targetScreenX: arc0LandingSurveyRouteIsExact({
        ...exact, target: { ...exact.target, screenX: Number.NaN },
      }),
      targetScreenY: arc0LandingSurveyRouteIsExact({
        ...exact, target: { ...exact.target, screenY: Number.POSITIVE_INFINITY },
      }),
      targetWidth: arc0LandingSurveyRouteIsExact({
        ...exact, target: { ...exact.target, width: 0 },
      }),
      targetHeight: arc0LandingSurveyRouteIsExact({
        ...exact, target: { ...exact.target, height: -1 },
      }),
      targetExtra: arc0LandingSurveyRouteIsExact({
        ...exact, target: { ...exact.target, extra: true },
      }),
    }).toEqual(Object.fromEntries([
      'mode', 'galaxySeed', 'galaxyX', 'galaxyY', 'starSeed', 'starX', 'starY',
      'planet', 'planetOrdinal', 'galaxyKey', 'starKey', 'worldKey', 'cardClosed',
      'cardTitle', 'stateEpoch', 'renderedSerial', 'renderedMode', 'renderedEpoch',
      'renderedGalaxy', 'renderedStar', 'renderedWorld', 'renderedExtra', 'invalidCode',
      'nonCanonicalCode', 'payloadType', 'payloadGalaxyX', 'payloadGalaxyY',
      'payloadGalaxySize', 'payloadGalaxySp', 'payloadGalaxyTilt', 'payloadGalaxyRot',
      'payloadGalaxySeed', 'payloadGalaxyFlags', 'payloadGalaxyLength', 'payloadStarX',
      'payloadStarY', 'payloadStarSeed', 'payloadStarLength', 'payloadPlanet',
      'payloadExtra', 'targetSeed', 'targetOrdinal', 'targetScreenX', 'targetScreenY',
      'targetWidth', 'targetHeight', 'targetExtra',
    ].map((key) => [key, false])));
  });

  it('admits an exact post-Survey held publication and rejects product or route drift locally', () => {
    const beforeProduct = {
      mode: 'system',
      gal: 31337,
      galX: 4,
      galY: -2,
      star: 4242,
      starX: 1,
      starY: 3,
      planet: null,
      planetOrdinal: null,
      navGalaxyKey: 'g:pertar',
      navStarKey: 'g:pertar|s:pertar',
      navWorldKey: null,
      save: { landed: [], cargo: [['ferrite', 2]], stats: { landings: 0 } },
    };
    const route = exactPertarSurveyRouteEvidence();
    const exact = {
      beforeProduct,
      heldProduct: structuredClone(beforeProduct),
      heldState: route.state,
      cardCode: route.cardCode,
      target: route.target,
    };
    expect(assessArc0LandingPublicationWithheld(exact)).toEqual({
      ok: true, reasons: [],
    });

    const productMutations: Record<string, (product: any) => void> = {
      mode: (product) => { product.mode = 'surface'; },
      gal: (product) => { product.gal += 1; },
      galX: (product) => { product.galX += 1; },
      galY: (product) => { product.galY += 1; },
      star: (product) => { product.star += 1; },
      starX: (product) => { product.starX += 1; },
      starY: (product) => { product.starY += 1; },
      planet: (product) => { product.planet = 546_621_068; },
      planetOrdinal: (product) => { product.planetOrdinal = 3; },
      navGalaxyKey: (product) => { product.navGalaxyKey += ':control'; },
      navStarKey: (product) => { product.navStarKey += ':control'; },
      navWorldKey: (product) => { product.navWorldKey = 'control'; },
      save: (product) => { product.save.stats.landings += 1; },
    };
    expect(Object.fromEntries(Object.entries(productMutations).map(([name, mutate]) => {
      const heldProduct = structuredClone(beforeProduct);
      mutate(heldProduct);
      return [name, assessArc0LandingPublicationWithheld({ ...exact, heldProduct })];
    }))).toEqual(Object.fromEntries(Object.keys(productMutations).map((name) => [name, {
      ok: false,
      reasons: ['old document live product changed before replacement'],
    }])));

    const optimisticProduct = structuredClone(beforeProduct);
    optimisticProduct.save.stats.landings = 1;
    expect(assessArc0LandingPublicationWithheld({
      ...exact,
      heldProduct: optimisticProduct,
    })).toEqual({
      ok: false,
      reasons: ['old document live product changed before replacement'],
    });
    expect(assessArc0LandingPublicationWithheld({
      ...exact,
      heldState: { ...route.state, cardOpen: false },
    })).toEqual({
      ok: false,
      reasons: ['old document did not retain its exact post-Survey route/card/share/target'],
    });
    expect(assessArc0LandingPublicationWithheld({
      ...exact,
      cardCode: 'CF1-not-a-valid-card',
    })).toEqual({
      ok: false,
      reasons: ['old document did not retain its exact post-Survey route/card/share/target'],
    });
    expect(assessArc0LandingPublicationWithheld({
      ...exact,
      target: { ...route.target, ordinal: route.target.ordinal + 1 },
    })).toEqual({
      ok: false,
      reasons: ['old document did not retain its exact post-Survey route/card/share/target'],
    });
    expect(assessArc0LandingPublicationWithheld({
      beforeProduct: undefined,
      heldProduct: undefined,
      heldState: route.state,
      cardCode: route.cardCode,
      target: route.target,
    })).toEqual({
      ok: false,
      reasons: ['old document live product evidence was incomplete'],
    });
  });

  it('rejects incomplete fault latches and any non-idle product hold', () => {
    const exact = {
      landing: {
        schema: 'cf-v2-arc0-landing-app-state/v1',
        actionCoordinator: {
          inFlight: false,
          owner: {
            schema: 'cf-v2-product-action-coordinator-diagnostics/v1',
            busy: false,
            operation: null,
          },
          hold: {
            schema: 'cf-v2-product-action-hold-diagnostics/v1',
            phase: 'idle',
            operation: null,
            sequence: 0,
          },
          faultArmed: {
            storageFailure: false,
            staleAuthority: false,
            publicationFailure: false,
          },
          lastFault: null,
        },
      },
    };
    expect(arc0LandingCoordinatorIsIdle(exact, { clearFault: true })).toBe(true);
    const mutate = (change: (coordinator: any) => void) => {
      const control = structuredClone(exact);
      change(control.landing.actionCoordinator);
      return arc0LandingCoordinatorIsIdle(control, { clearFault: true });
    };
    expect({
      missingFaultKey: mutate((coordinator) => {
        delete coordinator.faultArmed.storageFailure;
      }),
      renamedFaultKey: mutate((coordinator) => {
        delete coordinator.faultArmed.storageFailure;
        coordinator.faultArmed.storageFailureRenamed = false;
      }),
      extraFalseFaultKey: mutate((coordinator) => {
        coordinator.faultArmed.unexpectedFault = false;
      }),
      armedFault: mutate((coordinator) => {
        coordinator.faultArmed.storageFailure = true;
      }),
      missingHold: mutate((coordinator) => { delete coordinator.hold; }),
      wrongHoldSchema: mutate((coordinator) => {
        coordinator.hold.schema = 'cf-v2-product-action-hold-diagnostics/control';
      }),
      heldPhase: mutate((coordinator) => { coordinator.hold.phase = 'holding'; }),
      retainedOperation: mutate((coordinator) => {
        coordinator.hold.operation = 'arc0.landing-control';
      }),
      advancedSequence: mutate((coordinator) => { coordinator.hold.sequence = 1; }),
      extraHoldField: mutate((coordinator) => { coordinator.hold.extra = false; }),
      extraCoordinatorField: mutate((coordinator) => { coordinator.extra = false; }),
    }).toEqual({
      missingFaultKey: false,
      renamedFaultKey: false,
      extraFalseFaultKey: false,
      armedFault: false,
      missingHold: false,
      wrongHoldSchema: false,
      heldPhase: false,
      retainedOperation: false,
      advancedSequence: false,
      extraHoldField: false,
      extraCoordinatorField: false,
    });
    const retainedFault = structuredClone(exact);
    (retainedFault.landing.actionCoordinator as any).lastFault = { phase: 'settled' };
    expect(arc0LandingCoordinatorIsIdle(retainedFault)).toBe(true);
    expect(arc0LandingCoordinatorIsIdle(retainedFault, { clearFault: true })).toBe(false);
  });

  it('starts every fault from one exact source-proven unlanded fixture', () => {
    proveEachMarkerRequired(faultFixtureOwner, [
      ['Pertar source clone', 'const save = JSON.parse(ARC4_PERTAR_RAW);'],
      ['fault-fixture identity', "save.me = 'Arc 0 Landing Fault Browser Fixture';"],
      ['bounded landed-array input', 'save.land = Array.isArray(save.land)'],
      ['Pertar removal', '.filter((seed) => seed !== ARC4_PERTAR_FIXTURE.planet.seed)'],
      ['serialized replacement', 'return JSON.stringify(save);'],
    ]);
    proveEachMarkerRequired(sourceExactOwner, [
      ['source heartbeat stopped', 'fixture?.heartbeat?.stopped === true'],
      ['source heartbeat settled', 'fixture?.heartbeat?.cycleSettled === true'],
      ['source heartbeat token', 'fixture?.heartbeat?.documentToken === fixture?.token'],
      ['source writable token', 'fixture?.sourceReady?.token === fixture?.token'],
      ['exact live source route', 'arc4PertarSourceRouteExact(state)'],
      ['exact saved source route', 'arc4PertarSavedStarRouteExact(state)'],
      ['live unlanded product', '!state?.save?.landed?.includes(ARC4_PERTAR_FIXTURE.planet.seed)'],
      ['legacy unlanded product', '!raw?.legacy?.land?.includes(ARC4_PERTAR_FIXTURE.planet.seed)'],
      ['split unlanded product', '!raw?.catalogRow?.data?.land?.includes(ARC4_PERTAR_FIXTURE.planet.seed)'],
      ['Pertar absent from source legacy Survey ledger', '!raw?.legacy?.surveyed?.includes(ARC4_PERTAR_FIXTURE.worldKey)'],
      ['Pertar absent from source split Survey ledger', '!raw?.catalogRow?.data?.surveyed?.includes(ARC4_PERTAR_FIXTURE.worldKey)'],
      ['source Survey ledger mirror parity', 'canonicalJson(raw?.legacy?.surveyed)\n        === canonicalJson(raw?.catalogRow?.data?.surveyed)'],
      ['source receipt arrays aligned', 'arc0LandingReceiptArraysAligned(raw)'],
      ['zero landing receipts', 'arc0LandingReceipts(raw).length === 0'],
      ['zero Survey receipts', 'arc0LandingSurveyReceipts(raw).length === 0'],
      ['source requires clear fault', '&& arc0LandingSurveyReceipts(raw).length === 0\n      && arc0LandingCoordinatorIdle(state, { clearFault: true });'],
    ]);
  });

  it('proves one durable Survey and its exact current Pertar publication before Landing', () => {
    proveEachMarkerRequired(surveyContractOwner, [
      ['Survey receipt hash schema', 'const arc0LandingSurveyReceiptPattern = /^arc9sv1:[0-9a-f]{64}$/u;'],
      ['exact Pertar Survey witness authority', "'arc9sv1:21678a94072ba2e5d0df32cdde8454d265cf0edac9310acf98576d2696244ece';"],
      ['Survey receipt kind', ".filter(({ row }) => row?.kind === 'arc9-survey-v1');"],
      ['shared exact post-Survey route', 'arc0LandingSurveyRouteIsExact({ state, cardCode, target })'],
      ['one receipt delta', 'after.length === before.length + 1'],
      ['pre-receipt arrays aligned', 'arc0LandingReceiptArraysAligned(beforeRaw)'],
      ['post-receipt arrays aligned', 'arc0LandingReceiptArraysAligned(afterRaw)'],
      ['prior receipt bytes retained', 'before.every(({ key, raw }) => afterByKey.get(key) === raw)'],
      ['receipt key identity', 'receipt?.key === `receipt:${receipt?.row?.ordinal}`'],
      ['receipt raw identity', 'receipt?.raw === JSON.stringify(receipt?.row)'],
      ['pre-action receipt ordinal', 'receipt?.row?.ordinal === beforeRaw?.authority?.sessionRng?.ordinal'],
      ['Survey witness digest', "arc0LandingSurveyReceiptPattern.test(receipt?.row?.witness ?? '')"],
      ['exact Pertar Survey witness', 'receipt?.row?.witness === ARC0_PERTAR_SURVEY_RECEIPT_WITNESS'],
      ['Survey world identity append', 'canonicalJson(after.surveyed)\n        === canonicalJson([...before.surveyed, ARC4_PERTAR_FIXTURE.worldKey])'],
      ['Survey identity absent before', '!before.surveyed.includes(ARC4_PERTAR_FIXTURE.worldKey)'],
      ['Survey identity appended exactly once', 'after.surveyed.filter((key) => key === ARC4_PERTAR_FIXTURE.worldKey).length === 1'],
      ['Ocean absent before', "!before.ptypes.includes('ocean')"],
      ['exact Ocean append', "canonicalJson(after.ptypes) === canonicalJson([...before.ptypes, 'ocean'])"],
      ['Ocean appended exactly once', "after.ptypes.filter((planetType) => planetType === 'ocean').length === 1"],
      ['star classes unchanged', 'canonicalJson(after.starKinds) === canonicalJson(before.starKinds)'],
      ['exact retained rank', 'before.bestRank === 3 && after.bestRank === 3'],
      ['achievements unchanged', 'canonicalJson(after.unlocked) === canonicalJson(before.unlocked)'],
      ['legacy/split surveyed parity', 'canonicalJson(legacy?.surveyed) === canonicalJson(catalog?.surveyed)'],
      ['legacy/split type parity', 'canonicalJson(legacy?.ptypes) === canonicalJson(catalog?.ptypes)'],
      ['live Survey count', 'state?.save?.stats?.surveys === legacy?.surveyed?.length'],
      ['live best rank', 'state?.save?.stats?.bestRank === legacy?.br'],
      ['live achievements', 'canonicalJson(state?.save?.unlocked) === canonicalJson(legacy?.ach)'],
      ['named Survey outcome', 'state?.persistence?.lastOutcome === `arc9-survey-committed:${raw?.revision}`'],
      ['one runtime commit', 'runtime?.commits === sourceFixture?.state?.persistence?.runtime?.commits + 1'],
      ['idle Survey coordinator', '&& state?.landing?.lastOutcome === null\n        && arc0LandingCoordinatorIdle(state, { clearFault: true })'],
      ['exact coordinator contract', 'arc0LandingCoordinatorIsIdle(state, options)'],
    ]);
    proveEachMarkerRequired(surveySetupOwner, [
      ['source-proven prerequisite', 'source: arc0LandingSourceExact(sourceFixture),'],
      ['explicit Survey accepted', 'explicitSurvey: evidence?.surveyAction?.accepted === true'],
      ['Survey action token', 'evidence?.surveyAction?.documentToken === sourceFixture?.token'],
      ['awaited Survey revision', 'awaitedSettlement: evidence?.surveySettledState?.persistence?.runtime?.revision'],
      ['awaited Survey outcome', '=== `arc9-survey-committed:${afterRaw?.revision}`'],
      ['same document baseline', 'evidence?.surveyedReady?.token === sourceFixture?.token'],
      ['one global revision', 'afterRaw?.revision === beforeRaw?.revision + 1'],
      ['one authority ordinal', 'afterAuthority?.ordinal === beforeAuthority?.ordinal + 1'],
      ['one exact Survey receipt', 'oneSurveyReceipt: arc0LandingSurveyReceiptDeltaExact(beforeRaw, afterRaw),'],
      ['durable Survey delta', 'durableSurveyDelta: arc0LandingSurveyDeltaExact(beforeRaw, afterRaw),'],
      ['current Survey route', 'currentRoute: arc0LandingSurveyRouteExact('],
      ['current Survey publication', 'currentLivePublication: arc0LandingSurveyLivePublicationExact('],
      ['still unlanded', 'landingStillUnlanded: !fixture?.state?.save?.landed?.includes('],
      ['no Landing receipt', 'arc0LandingReceipts(afterRaw).length === 0'],
      ['saved source route', 'arc4PertarSavedStarRouteExact(fixture?.state)'],
    ]);
  });

  it('collects one awaited action across a held and explicitly released convergence reload', () => {
    const markers = [
      ['fresh source fixture', 'const sourceFixture = await installArc0LandingFaultFixture(label);'],
      ['expected Survey revision', 'const expectedSurveyRevision = sourceFixture.raw.revision + 1;'],
      ['explicit awaited Survey', 'const accepted=await S.api.surveyOn(${JSON.stringify(ARC4_PERTAR_FIXTURE.planet)});'],
      ['Survey settlement wait', 'surveySettledState = await waitDesktopValue(`${label} Survey settlement`'],
      ['exact current Survey card', "&&s.planet===null&&s.planetOrdinal===null&&s.cardOpen===true&&s.cardTitle==='Pertar'"],
      ['named Survey outcome wait', "&&s.persistence?.lastOutcome==='arc9-survey-committed:${expectedSurveyRevision}'"],
      ['Survey writable wait', '`${label} post-Survey writable authority`,'],
      ['same-document writable check', 'previousToken: sourceFixture.priorToken'],
      ['post-Survey durable sample', 'raw=await (${ARC4_DURABLE_READ_EXPRESSION});return {state:S.api.state(),raw,'],
      ['post-Survey card sample', 'raw=await (${ARC4_DURABLE_READ_EXPRESSION});return {state:S.api.state(),raw,\n        cardCode:S.api.cardShareCode(),target:S.api.planetScreenTarget('],
      ['post-Survey baseline fixture', '...sourceFixture, state: surveyBaseline.state, raw: surveyBaseline.raw,'],
      ['Survey setup assessment', 'const surveyAssessment = assessArc0LandingSurveySetup(surveyEvidence);'],
      ['pre-Survey baseline control', 'preSurveyBaselineControl.fixture = structuredClone('],
      ['receipt control', "(row) => row?.kind === 'arc9-survey-v1',"],
      ['valid-hash witness control', "row.witness = `arc9sv1:${'0'.repeat(64)}`;"],
      ['witness raw-row realignment', 'surveyWitnessControl.fixture.raw.receiptRawRows[surveyReceiptIndex]\n        = JSON.stringify(row);'],
      ['witness mutation applied', 'surveyWitnessControlMutated = row.witness !== ARC0_PERTAR_SURVEY_RECEIPT_WITNESS'],
      ['route control', "surveyRouteControl.fixture.state.cardTitle = 'Not Pertar';"],
      ['live-publication control', 'surveyPublicationControl.fixture.state.save.stats.surveys += 1;'],
      ['coordinator control factory', 'const surveyCoordinatorControl = (mutate) => {'],
      ['missing fault-key control', 'const surveyFaultMissingControl = surveyCoordinatorControl((coordinator) => {'],
      ['wrong fault-key control', 'coordinator.faultArmed.storageFailureRenamed = false;'],
      ['extra fault-key control', 'coordinator.faultArmed.unexpectedFault = false;'],
      ['armed fault control', 'coordinator.faultArmed.storageFailure = true;'],
      ['hold schema control', "coordinator.hold.schema = 'cf-v2-product-action-hold-diagnostics/control';"],
      ['hold phase control', "coordinator.hold.phase = 'armed';"],
      ['hold operation control', "coordinator.hold.operation = 'arc0.landing-control';"],
      ['hold sequence control', 'coordinator.hold.sequence = 1;'],
      ['pre-Survey rejection', 'preSurveyBaseline: assessArc0LandingSurveySetup(preSurveyBaselineControl),'],
      ['receipt isolated red', "arc0LandingSurveyIsolatedControl(surveyControls.receipt, 'oneSurveyReceipt')"],
      ['valid-hash witness isolated red', "arc0LandingSurveyIsolatedControl(surveyControls.witness, 'oneSurveyReceipt')"],
      ['route isolated red', "arc0LandingSurveyIsolatedControl(surveyControls.route, 'currentRoute')"],
      ['publication isolated red', "surveyControls.publication, 'currentLivePublication',"],
      ['missing fault-key isolated red', "surveyControls.faultMissing, 'currentLivePublication',"],
      ['wrong fault-key isolated red', "surveyControls.faultWrongKey, 'currentLivePublication',"],
      ['extra fault-key isolated red', "surveyControls.faultExtra, 'currentLivePublication',"],
      ['armed fault isolated red', "surveyControls.faultArmed, 'currentLivePublication',"],
      ['hold schema isolated red', "surveyControls.holdSchema, 'currentLivePublication',"],
      ['hold phase isolated red', "surveyControls.holdPhase, 'currentLivePublication',"],
      ['hold operation isolated red', "surveyControls.holdOperation, 'currentLivePublication',"],
      ['hold sequence isolated red', "surveyControls.holdSequence, 'currentLivePublication',"],
      ['Survey causal fail-stop', "failSliceWithoutCascade('ARC 0 LANDING SURVEY SETUP: explicit Survey did not settle as one current-route receipt before Landing faults were armed:"],
      ['old document token', 'const beforeToken = fixture.token;'],
      ['event ledger mark', 'const convergenceMark = events.length;'],
      ['convergence hold arm', "'window.__CF_SLICE__.api.__smokeArmF4ConvergenceReloadHold()'"],
      ['one exact fault arm', 'const faultArmed = await evalIn(`window.__CF_SLICE__.api.${faultHook}()`);'],
      ['one awaited current-card Landing', 'const accepted=await S.api.landHere();'],
      ['held phase wait', "s?.persistence?.convergenceReloadHold?.phase==='holding'"],
      ['settled owner wait', "s?.landing?.actionCoordinator?.inFlight===false"],
      ['exact fault wait', 'fault?.injection===${JSON.stringify(injection)}&&fault?.outcome===${JSON.stringify(faultOutcome)}'],
      ['atomic held route/card sample', '?{state:s,cardCode:S.api.cardShareCode(),target:S.api.planetScreenTarget('],
      ['held state extracted before release', 'const heldState = heldObservation.state;'],
      ['held card code extracted before release', 'const heldCardCode = heldObservation.cardCode;'],
      ['held target extracted before release', 'const heldTarget = heldObservation.target;'],
      ['held durable read', 'const heldRaw = await evalIn(ARC4_DURABLE_READ_EXPRESSION);'],
      ['single release', "'window.__CF_SLICE__.api.__smokeReleaseF4ConvergenceReload()'"],
      ['new document wait', 'await waitForSlice(sess, `${label} replacement`, { previousToken: beforeToken });'],
      ['new writable authority', 'previousToken: beforeToken,'],
      ['reloaded heartbeat quiescence', "'window.__CF_SLICE__.api.__smokeQuiesceF4Heartbeat()'"],
      ['reloaded state', "const reloadedState = await evalIn('window.__CF_SLICE__.api.state()');"],
      ['reloaded durable read', 'const reloadedRaw = await evalIn(ARC4_DURABLE_READ_EXPRESSION);'],
      ['one convergence witness source', 'f4ConvergenceWitnessesSince(sess, convergenceMark)'],
      ['retained action token', 'accepted: action?.accepted, actionDocumentToken: action?.documentToken,'],
      ['scenario-specific acceptance', 'expectedAccepted: accepted,\n    };'],
      ['receipt control alignment precondition', 'const surveyReceiptControlAligned = arc0LandingReceiptArraysAligned('],
      ['receipt control splice guard', 'surveyReceiptControl.fixture.raw.receiptRows.splice(surveyReceiptIndex, 1);'],
      ['Survey delta control factory', 'const surveyDeltaControl = (mutate) => {'],
      ['control legacy bytes rewritten', 'control.fixture.raw.legacyRaw = JSON.stringify(control.fixture.raw.legacy);'],
      ['control catalog bytes rewritten', 'control.fixture.raw.catalogRaw = JSON.stringify(control.fixture.raw.catalogRow);'],
      ['control player bytes rewritten', 'control.fixture.raw.playerRaw = JSON.stringify(control.fixture.raw.playerRow);'],
      ['Ocean legacy mutant', "raw.legacy.ptypes[raw.legacy.ptypes.length - 1] = 'control-ocean';"],
      ['Ocean split mutant', "raw.catalogRow.data.ptypes[raw.catalogRow.data.ptypes.length - 1]\n        = 'control-ocean';"],
      ['rank durable mutant', 'raw.legacy.br = 4;'],
      ['rank live mutant', 'state.save.stats.bestRank = 4;'],
      ['achievement durable mutant', "raw.legacy.ach.push('arc0-survey-control');"],
      ['achievement live mutant', "state.save.unlocked.push('arc0-survey-control');"],
      ['Ocean control assessment', 'ptype: assessArc0LandingSurveySetup(surveyPtypeControl),'],
      ['rank control assessment', 'rank: assessArc0LandingSurveySetup(surveyRankControl),'],
      ['achievement control assessment', 'unlocked: assessArc0LandingSurveySetup(surveyUnlockedControl),'],
      ['Ocean isolated red', "surveyControls.ptype, 'durableSurveyDelta',"],
      ['rank isolated red', "surveyControls.rank, 'durableSurveyDelta',"],
      ['achievement isolated red', "surveyControls.unlocked, 'durableSurveyDelta',"],
      ['Survey action boundary classifier', 'const surveyActionBoundary = assessArc0LandingAwaitBoundary({'],
      ['Survey rejection named fail-stop', 'explicit Survey was refused or changed document before its settlement wait:'],
      ['Survey settlement named fail-stop', 'accepted Survey did not reach its exact current-route settlement:'],
      ['Survey writable named fail-stop', 'settled Survey did not reacquire exact writable authority:'],
      ['Landing action boundary classifier', 'const actionBoundary = assessArc0LandingAwaitBoundary({'],
      ['Landing held named fail-stop', 'one awaited Landing did not reach its exact held coordinator/fault settlement:'],
      ['Landing replacement named fail-stop', 'released Landing convergence did not reach its exact replacement authority:'],
      ['source prerequisite check', 'const sourcePrerequisite = arc0LandingSourceExact(sourceFixture);'],
      ['source prerequisite fail-stop', 'source fixture was not exact before Survey; no product action was issued:'],
      ['retained source fault control', "sourceRetainedFaultControl.state.landing.actionCoordinator.lastFault = {"],
      ['retained source fault rejection', 'const sourceRetainedFaultRejected = !arc0LandingSourceExact('],
      ['retained source fault fail-stop', 'retained source fault control did not reject before Survey; no product action was issued:'],
      ['positive Survey fail-stop', 'explicit Survey positive baseline was not exact; controls and Landing faults were not issued:'],
      ['hold arm fail-stop', 'convergence hold did not arm; fault and Landing were not issued:'],
      ['fault arm fail-stop', 'scenario fault did not arm; Landing was not issued:'],
      ['Survey invocation named fail-stop', 'exact Survey invocation failed before its settlement wait:'],
      ['Landing invocation named fail-stop', 'exact Landing invocation failed before held settlement:'],
    ] as const satisfies readonly Marker[];
    const marker = (label: string): string => {
      const row = markers.find(([candidate]) => candidate === label);
      expect(row, `known order marker: ${label}`).toBeDefined();
      return row![1];
    };
    const order = [
      { label: 'fixture before Survey', first: marker('fresh source fixture'), second: marker('explicit awaited Survey') },
      { label: 'source proof before Survey', first: marker('source prerequisite check'), second: marker('explicit awaited Survey') },
      { label: 'source retained-fault rejection before Survey', first: marker('retained source fault rejection'), second: marker('explicit awaited Survey') },
      { label: 'Survey before settlement wait', first: marker('explicit awaited Survey'), second: marker('Survey settlement wait') },
      { label: 'settlement before writable', first: marker('Survey settlement wait'), second: marker('Survey writable wait') },
      { label: 'writable before baseline sample', first: marker('Survey writable wait'), second: marker('post-Survey durable sample') },
      { label: 'baseline before assessment', first: marker('post-Survey durable sample'), second: marker('Survey setup assessment') },
      { label: 'positive Survey fail-stop before controls', first: marker('positive Survey fail-stop'), second: marker('pre-Survey baseline control') },
      { label: 'assessment before controls', first: marker('Survey setup assessment'), second: marker('pre-Survey baseline control') },
      { label: 'controls before causal boundary', first: marker('publication isolated red'), second: marker('Survey causal fail-stop') },
      { label: 'Survey boundary before hold', first: marker('Survey causal fail-stop'), second: marker('convergence hold arm') },
      { label: 'hold before fault', first: marker('convergence hold arm'), second: marker('one exact fault arm') },
      { label: 'hold proof before fault', first: marker('hold arm fail-stop'), second: marker('one exact fault arm') },
      { label: 'fault before action', first: marker('one exact fault arm'), second: marker('one awaited current-card Landing') },
      { label: 'fault proof before action', first: marker('fault arm fail-stop'), second: marker('one awaited current-card Landing') },
      { label: 'action before held wait', first: marker('one awaited current-card Landing'), second: marker('held phase wait') },
      { label: 'held wait before durable read', first: marker('held phase wait'), second: marker('held durable read') },
      { label: 'held read before release', first: marker('held durable read'), second: marker('single release') },
      { label: 'release before replacement', first: marker('single release'), second: marker('new document wait') },
      { label: 'replacement before writable', first: marker('new document wait'), second: marker('new writable authority') },
      { label: 'writable before quiescence', first: marker('new writable authority'), second: marker('reloaded heartbeat quiescence') },
      { label: 'quiescence before reloaded read', first: marker('reloaded heartbeat quiescence'), second: marker('reloaded durable read') },
      { label: 'reloaded read before witness query', first: marker('reloaded durable read'), second: marker('one convergence witness source') },
      { label: 'receipt alignment before control splice', first: marker('receipt control alignment precondition'), second: marker('receipt control splice guard') },
      { label: 'delta factory before Ocean mutant', first: marker('Survey delta control factory'), second: marker('Ocean legacy mutant') },
      { label: 'Ocean mutant before assessment', first: marker('Ocean legacy mutant'), second: marker('Ocean control assessment') },
      { label: 'rank mutant before assessment', first: marker('rank durable mutant'), second: marker('rank control assessment') },
      { label: 'achievement mutant before assessment', first: marker('achievement durable mutant'), second: marker('achievement control assessment') },
    ] as const satisfies readonly OrderRule[];
    proveEachMarkerRequired(collectorOwner, markers);
    proveEachOrderRequired(collectorOwner, order);
    expect(occurrences(collectorOwner, '.surveyOn(')).toBe(1);
    expect(occurrences(collectorOwner, '.landHere(')).toBe(1);
    expect(collectorOwner).not.toContain('.landOn(');
  });

  it('binds storage rejection to no durable or local product and no retry', () => {
    proveEachMarkerRequired(storageAssessmentOwner, [
      ['post-Survey baseline', 'fixture: arc0LandingSurveyBaselineExact(evidence),'],
      ['scenario acceptance', 'oneAwaitedAction: arc0LandingOneAwaitedActionExact(evidence),'],
      ['storage fault', "arc0LandingFaultExact(evidence, 'storage-failure', 'storage-error')"],
      ['no injected revision', 'injectedRevision === null'],
      ['held revision stable', 'heldRaw?.revision === beforeRaw?.revision'],
      ['reloaded revision stable', 'evidence?.reloadedRaw?.revision === beforeRaw?.revision'],
      ['held durable rows stable', 'arc0LandingRowsAndReceiptsExact(beforeRaw, heldRaw)'],
      ['reloaded durable rows stable', 'arc0LandingRowsAndReceiptsExact(heldRaw, evidence?.reloadedRaw)'],
      ['local publication withheld', ')) === canonicalJson(arc0LandingLiveProduct(evidence?.heldState))'],
      ['coordinator released', 'coordinatorReleased: arc0LandingCoordinatorIdle(evidence?.heldState)'],
      ['convergence held', 'convergenceHeld: arc0LandingConvergenceHeld(evidence?.heldState)'],
      ['convergence released', "arc0LandingConvergenceWitnessExact(evidence, 'storage', beforeRaw, detail)"],
      ['source reload fixed point', "reloadFixedPoint: arc0LandingReloadFixedPoint(evidence, 'source')"],
      ['zero postreload receipts', 'arc0LandingReceipts(evidence?.reloadedRaw).length === 0'],
      ['no landing reward retry', '=== evidence?.fixture?.state?.save?.stats?.landings'],
    ]);
    proveEachMarkerRequired(storageScenarioOwner, [
      ['storage scenario label', "label: 'Arc 0 Landing storage-failure replacement'"],
      ['storage finding label', "findingLabel: 'ARC 0 LANDING STORAGE REFUSAL'"],
      ['storage hook', "faultHook: '__smokeRejectNextArc0LandingStorage'"],
      ['storage expected outcome', "injection: 'storage-failure', faultOutcome: 'storage-error', accepted: false"],
      ['revision mutation', 'arc0LandingStorageRevisionControl.heldRaw.revision += 1;'],
      ['coordinator mutation', 'actionCoordinator.owner.busy = true;'],
      ['revision isolated red', "arc0LandingStorageControls.revision, 'revisionStable'"],
      ['coordinator isolated red', "arc0LandingStorageControls.coordinator, 'coordinatorReleased'"],
      ['causal fail-stop', "failSliceWithoutCascade('ARC 0 LANDING STORAGE REFUSAL:"],
    ]);
    expect(storageScenarioOwner).not.toContain("fails.push('ARC 0 LANDING STORAGE REFUSAL:");
  });

  it('binds stale refusal to the later writer alone and a source-route fixed point', () => {
    proveEachMarkerRequired(staleAssessmentOwner, [
      ['post-Survey baseline', 'fixture: arc0LandingSurveyBaselineExact(evidence),'],
      ['scenario acceptance', 'oneAwaitedAction: arc0LandingOneAwaitedActionExact(evidence),'],
      ['stale fault', "arc0LandingFaultExact(evidence, 'stale-authority', 'stale')"],
      ['injected later revision', 'fault?.injectedRevision === beforeRaw?.revision + 1'],
      ['only one later revision', 'heldRaw?.revision === beforeRaw?.revision + 1'],
      ['later revision serialization', 'heldRaw?.revisionRaw === String(heldRaw.revision)'],
      ['later writer changed no product row', 'arc0LandingRowsAndReceiptsExact(beforeRaw, heldRaw)'],
      ['no action receipt', 'arc0LandingReceipts(heldRaw).length === 0'],
      ['no live action publication', '=== canonicalJson(arc0LandingLiveProduct(evidence?.heldState))'],
      ['coordinator released', 'coordinatorReleased: arc0LandingCoordinatorIdle(evidence?.heldState)'],
      ['convergence held', 'convergenceHeld: arc0LandingConvergenceHeld(evidence?.heldState)'],
      ['stale release witness', "arc0LandingConvergenceWitnessExact(evidence, 'stale', beforeRaw, detail)"],
      ['source reload', "arc0LandingReloadFixedPoint(evidence, 'source')"],
      ['held/reload fixed point', 'arc0LandingSnapshotExact(heldRaw, evidence?.reloadedRaw)'],
      ['no second revision', 'evidence?.reloadedRaw?.revision === beforeRaw?.revision + 1'],
      ['no postreload receipt', 'arc0LandingReceipts(evidence?.reloadedRaw).length === 0'],
      ['no reward retry', '=== evidence?.fixture?.state?.save?.stats?.landings'],
    ]);
    proveEachMarkerRequired(staleScenarioOwner, [
      ['stale scenario label', "label: 'Arc 0 Landing stale-authority replacement'"],
      ['stale finding label', "findingLabel: 'ARC 0 LANDING STALE CONVERGENCE'"],
      ['stale hook', "faultHook: '__smokeStaleNextArc0LandingAuthority'"],
      ['stale expected outcome', "injection: 'stale-authority', faultOutcome: 'stale', accepted: false"],
      ['held later-writer mutation', "arc0LandingStaleWriterControl.heldRaw.catalogRaw += '\\n';"],
      ['reloaded later-writer mutation', "arc0LandingStaleWriterControl.reloadedRaw.catalogRaw += '\\n';"],
      ['token mutation', 'arc0LandingStaleTokenControl.reloadedReady.token = arc0LandingStaleTokenControl.beforeToken;'],
      ['later-writer isolated red', "arc0LandingStaleControls.laterWriter, 'laterWriterOnly'"],
      ['reload isolated red', "arc0LandingStaleControls.token, 'reloadFixedPoint'"],
      ['causal fail-stop', "failSliceWithoutCascade('ARC 0 LANDING STALE CONVERGENCE:"],
    ]);
    expect(staleScenarioOwner).not.toContain("fails.push('ARC 0 LANDING STALE CONVERGENCE:");
  });

  it('binds postcommit publication failure to one durable landing and reward', () => {
    proveEachMarkerRequired(publicationProductOwner, [
      ['complete live saves', 'if (!beforeState?.save || !reloadedState?.save) return false;'],
      ['zero source receipts', 'beforeReceipts.length === 0'],
      ['one committed receipt', 'committedReceipts.length === 1'],
      ['one post-Survey prefix receipt', 'arc0LandingSurveyReceipts(beforeRaw).length === 1'],
      ['full prefix append-only', 'arc0LandingReceiptDeltaExact(beforeRaw, committedRaw, receipt?.key)'],
      ['landing raw row identity', 'receipt?.raw === JSON.stringify(receipt?.row)'],
      ['bounded pre-action ordinal', 'Number.isSafeInteger(beforeAuthorityOrdinal)'],
      ['receipt key binds pre-action ordinal', 'receipt?.key === `receipt:${beforeAuthorityOrdinal}`'],
      ['landing receipt kind', "receipt?.row?.kind === 'arc0-land'"],
      ['receipt row binds pre-action ordinal', 'receipt?.row?.ordinal === beforeAuthorityOrdinal'],
      ['witness facts bind pre-action ordinal', 'facts?.receiptOrdinal === beforeAuthorityOrdinal'],
      ['receipt witness schema', "facts?.schema === 'cf-v2-arc0-landing-witness/v1'"],
      ['exact world key', 'facts?.worldKey === ARC4_PERTAR_FIXTURE.worldKey'],
      ['exact planet seed', 'facts?.planetSeed === ARC4_PERTAR_FIXTURE.planet.seed'],
      ['exact planet ordinal', 'facts?.planetOrdinal === ARC4_PERTAR_FIXTURE.planet.ordinal'],
      ['first permanent landing', "facts?.landing === 'first' && facts?.permanentLanding === true"],
      ['nontraining source', 'facts?.training === false && facts?.landingKnownBefore === false'],
      ['identity and mirror landed', 'facts?.identityLandedAfter === true'],
      ['reloaded landed field', 'reloadedState.save.landed.includes(ARC4_PERTAR_FIXTURE.planet.seed)'],
      ['reward witness', "sample?.kind === 'reward'"],
      ['two field samples', 'Array.isArray(sample.materials) && sample.materials.length === 2'],
      ['bounded material quantities', 'material?.quantity === 1'],
      ['material successor amounts', 'new Map(actualCargo).get(material.id) === material.quantityAfter'],
      ['positive Stardust', 'sample.stardust > 0'],
      ['reloaded essence', 'reloadedState?.save?.essence === sample.essenceAfter'],
      ['reloaded earned total', 'reloadedState?.save?.stats?.essenceEarned === sample.essenceEarnedAfter'],
      ['reloaded landing total', 'reloadedState?.save?.stats?.landings === sample.landingsAfter'],
      ['single Stardust delta', 'reloadedState.save.essence === beforeState.save.essence + sample.stardust'],
      ['single landing delta', 'reloadedState.save.stats.landings === beforeState.save.stats.landings + 1'],
      ['exact cargo successor', 'canonicalJson(actualCargo) === canonicalJson(expectedCargo)'],
      ['legacy cargo mirror', 'canonicalJson(committedRaw?.legacy?.cargo)'],
      ['split cargo mirror', 'canonicalJson(committedRaw?.inventoryRow?.data?.cargo)'],
      ['legacy essence mirror', 'committedRaw?.legacy?.essence === sample.essenceAfter'],
      ['legacy earned mirror', 'committedRaw?.legacy?.essenceEarned === sample.essenceEarnedAfter'],
      ['legacy landing mirror', 'committedRaw?.legacy?.landings === sample.landingsAfter'],
      ['split essence mirror', 'committedRaw?.playerRow?.data?.essence === sample.essenceAfter'],
      ['split earned mirror', 'committedRaw?.playerRow?.data?.essenceEarned === sample.essenceEarnedAfter'],
      ['split landing mirror', 'committedRaw?.playerRow?.data?.landings === sample.landingsAfter'],
    ]);
    proveEachMarkerRequired(publicationAssessmentOwner, [
      ['post-Survey baseline', 'fixture: arc0LandingSurveyBaselineExact(evidence),'],
      ['scenario acceptance', 'oneAwaitedAction: arc0LandingOneAwaitedActionExact(evidence),'],
      ['publication fault', "evidence, 'publication-failure', 'committed-publication-reload'"],
      ['fault revision', 'fault?.injectedRevision === committedRaw?.revision'],
      ['one global revision', 'committedRaw?.revision === beforeRaw?.revision + 1'],
      ['revision serialization', 'committedRaw?.revisionRaw === String(committedRaw.revision)'],
      ['session seed held', 'committedAuthority?.seed === beforeAuthority?.seed'],
      ['one session ordinal', 'committedAuthority?.ordinal === beforeAuthority?.ordinal + 1'],
      ['session draws held', 'canonicalJson(committedAuthority?.draws) === canonicalJson(beforeAuthority?.draws)'],
      ['landing/reward witness', 'durableLandingReward: arc0LandingPublicationProductExact(evidence)'],
      ['legacy surface route', 'arc4PertarLegacyRouteExact(committedRaw, arc4PertarSavedPlanetView)'],
      ['split surface route', 'arc4PertarSplitRouteExact(committedRaw, arc4PertarSavedPlanetView)'],
      ['legacy landed field', 'committedRaw?.legacy?.land?.includes(ARC4_PERTAR_FIXTURE.planet.seed)'],
      ['split landed field', 'committedRaw?.catalogRow?.data?.land?.includes(ARC4_PERTAR_FIXTURE.planet.seed)'],
      ['world identity changed', 'canonicalJson(arc0LandingWorldIdentityBytes(beforeRaw))'],
      ['world identity reload parity', 'canonicalJson(arc0LandingWorldIdentityBytes(evidence?.reloadedRaw))'],
      ['browser-free publication assessor', 'localPublicationWithheld: assessArc0LandingPublicationWithheld({'],
      ['pre-action product', 'beforeProduct: arc0LandingLiveProduct(evidence?.fixture?.state)'],
      ['old document product', 'heldProduct: arc0LandingLiveProduct(evidence?.heldState)'],
      ['held state route input', 'heldState: evidence?.heldState'],
      ['held card-code input', 'cardCode: evidence?.heldCardCode'],
      ['held target input', 'target: evidence?.heldTarget'],
      ['coordinator released', 'coordinatorReleased: arc0LandingCoordinatorIdle(evidence?.heldState)'],
      ['convergence held', 'convergenceHeld: arc0LandingConvergenceHeld(evidence?.heldState)'],
      ['publication release witness', "evidence, 'publication', committedRaw, detail"],
      ['surface reload', "arc0LandingReloadFixedPoint(evidence, 'surface')"],
      ['committed/reload fixed point', 'arc0LandingSnapshotExact(committedRaw, evidence?.reloadedRaw)'],
      ['one landing receipt after reload', 'arc0LandingReceipts(evidence?.reloadedRaw).length === 1'],
      ['no second authority draw', '=== committedAuthority?.ordinal'],
    ]);
    proveEachMarkerRequired(publicationScenarioOwner, [
      ['publication scenario label', "label: 'Arc 0 Landing postcommit-publication replacement'"],
      ['publication finding label', "findingLabel: 'ARC 0 LANDING PUBLICATION CONVERGENCE'"],
      ['publication hook', "faultHook: '__smokeRejectNextArc0LandingPublication'"],
      ['publication expected outcome', "injection: 'publication-failure', faultOutcome: 'committed-publication-reload'"],
      ['durable success return', 'accepted: true,'],
      ['positive evidence fail-stop', 'if (!arc0LandingPublicationAssessment.ok) {\n    failSliceWithoutCascade(\'ARC 0 LANDING PUBLICATION CONVERGENCE: positive held publication evidence was not exact; controls were not constructed: \''],
      ['old-state optimism mutation', 'arc0LandingPublicationOptimismControl.heldState.save = structuredClone('],
      ['post-Survey route control', 'arc0LandingPublicationRouteControl.heldState.cardOpen = false;'],
      ['held card-code control', "arc0LandingPublicationCardCodeControl.heldCardCode = 'CF1-not-a-valid-card';"],
      ['held target control', 'arc0LandingPublicationTargetControl.heldTarget.ordinal += 1;'],
      ['both durable snapshots mutated', 'for (const raw of [arc0LandingPublicationWitnessControl.heldRaw,'],
      ['field-sample witness mutation', 'witness.sample.stardust += 1;'],
      ['prefix control pair', 'for (const raw of [arc0LandingPublicationPrefixControl.heldRaw,'],
      ['prefix alignment precondition', 'if (!arc0LandingReceiptArraysAligned(raw) || surveyReceiptIndexes.length !== 1) {'],
      ['prefix byte mutation', "raw.receiptRows[surveyReceiptIndex].witness += ':prefix-control';"],
      ['prefix bytes realigned', 'raw.receiptRawRows[surveyReceiptIndex] = JSON.stringify('],
      ['ordinal control pair', 'for (const raw of [arc0LandingPublicationOrdinalControl.heldRaw,'],
      ['forged successor ordinal', '= arc0LandingPublicationEvidence.fixture.raw.authority.sessionRng.ordinal + 1;'],
      ['ordinal alignment precondition', 'if (!arc0LandingReceiptArraysAligned(raw) || landingReceiptIndexes.length !== 1) {'],
      ['row ordinal mutation', 'receiptRow.ordinal = arc0LandingPublicationForgedOrdinal;'],
      ['facts ordinal mutation', 'facts.receiptOrdinal = arc0LandingPublicationForgedOrdinal;'],
      ['key ordinal mutation', 'raw.receiptKeys[landingReceiptIndex]'],
      ['ordinal bytes realigned', 'raw.receiptKeys[landingReceiptIndex]\n      = `receipt:${arc0LandingPublicationForgedOrdinal}`;\n    raw.receiptRawRows[landingReceiptIndex] = JSON.stringify(receiptRow);'],
      ['reload revision mutation', 'arc0LandingPublicationReloadControl.reloadedRaw.revision += 1;'],
      ['prefix control assessment', 'prefix: assessArc0LandingPublicationConvergence('],
      ['ordinal control assessment', 'ordinal: assessArc0LandingPublicationConvergence('],
      ['prefix control prepared', 'if (!arc0LandingPublicationPrefixControlPrepared'],
      ['ordinal control prepared', '|| !arc0LandingPublicationOrdinalControlPrepared'],
      ['optimism isolated red', "arc0LandingPublicationControls.optimism, 'localPublicationWithheld'"],
      ['route isolated red', "arc0LandingPublicationControls.route, 'localPublicationWithheld'"],
      ['card-code isolated red', "arc0LandingPublicationControls.cardCode, 'localPublicationWithheld'"],
      ['target isolated red', "arc0LandingPublicationControls.target, 'localPublicationWithheld'"],
      ['witness isolated red', "arc0LandingPublicationControls.witness, 'durableLandingReward'"],
      ['prefix isolated red', "arc0LandingPublicationControls.prefix, 'durableLandingReward'"],
      ['ordinal isolated red', "arc0LandingPublicationControls.ordinal, 'durableLandingReward'"],
      ['reload isolated red', "arc0LandingPublicationControls.reload, 'reloadFixedPoint'"],
      ['causal fail-stop', "failSliceWithoutCascade('ARC 0 LANDING PUBLICATION CONVERGENCE: durable one-receipt landing/reward was published locally, retried, or lost across reload:"],
    ]);
    expect(publicationScenarioOwner).not.toContain(
      "fails.push('ARC 0 LANDING PUBLICATION CONVERGENCE:",
    );
  });

  it('binds the shared fault, coordinator, and convergence witnesses', () => {
    proveEachMarkerRequired(evidenceOwner, [
      ['operation digest', "const arc0LandingOperationPattern = /^arc0[.]land:[0-9a-f]{64}$/u;"],
      ['fault witness schema', "fault?.schema === 'cf-v2-arc0-landing-fault-witness/v1'"],
      ['fault operation', 'arc0LandingOperationPattern.test(fault?.operation ?? \'\')'],
      ['fault injection', 'fault?.injection === injection'],
      ['settled fault phase', "fault?.phase === 'settled'"],
      ['before revision witness', 'fault?.beforeRevision === evidence?.fixture?.raw?.revision'],
      ['fault outcome', 'fault?.outcome === outcome'],
      ['exact shared coordinator contract', 'arc0LandingCoordinatorIsIdle(state, options)'],
      ['hold mutation fence', "state?.persistence?.hold === 'transient-read'"],
      ['held mutation blocked', 'state?.persistence?.mutationBlocked === true'],
      ['held reload scheduled', 'state?.persistence?.convergenceReloadScheduled === true'],
      ['held reload phase', "state?.persistence?.convergenceReloadHold?.phase === 'holding'"],
      ['held runtime unanswerable', 'state?.persistence?.runtime?.answerable === false'],
      ['new document token', 'evidence?.reloadedReady?.token !== evidence?.beforeToken'],
      ['reloaded heartbeat settled', 'evidence?.reloadedHeartbeat?.cycleSettled === true'],
      ['reloaded heartbeat token', 'evidence?.reloadedHeartbeat?.documentToken === evidence?.reloadedReady?.token'],
      ['clean current-v5 boot', "state?.persistence?.bootKind === 'current-v5'"],
      ['zero reload commits', 'state?.persistence?.runtime?.commits === 0'],
      ['surface saved route', 'arc4PertarSavedPlanetRouteExact(state)'],
      ['source saved route', ': arc4PertarSourceRouteExact(state) && arc4PertarSavedStarRouteExact(state);'],
      ['one release witness', 'evidence?.convergenceWitnessCount === 1'],
      ['convergence witness schema', "witness?.schema === 'cf-v2-f4-authority-convergence/v1'"],
      ['released witness status', "witness?.status === 'released'"],
      ['exact release detail', 'witness?.detail === detail'],
      ['old document witness', 'witness?.documentToken === evidence?.beforeToken'],
      ['stale lifecycle', "const beforeLifecycle = scenario === 'stale'"],
      ['released lifecycle', 'afterRuntime?.leaseOwned === false && afterRuntime?.leaseHeartbeat === null'],
      ['one awaited action token', 'evidence?.actionDocumentToken === evidence?.beforeToken'],
    ]);
    proveEachMarkerRequired(reloadFixedPointOwner, [
      ['reloaded heartbeat stopped', 'state?.persistence?.heartbeatRunning === false'],
      ['reloaded lease owned', 'state?.persistence?.runtime?.leaseOwned === true'],
      ['reloaded authority current', 'state?.persistence?.runtime?.staleBlocked === false'],
      ['reloaded answerable', 'state?.persistence?.runtime?.answerable === true'],
      ['reloaded accrual live', 'state?.persistence?.runtime?.accruing === true'],
      ['clean reload landing outcome', 'state?.landing?.lastOutcome === null'],
    ]);
    proveEachMarkerRequired(convergenceWitnessOwner, [
      ['authority revision tuple', 'runtime?.revision === raw?.revision'],
      ['authority seed tuple', 'runtime?.sessionSeed === authority?.seed'],
      ['authority ordinal tuple', 'runtime?.sessionOrdinal === authority?.ordinal'],
      ['authority draw tuple', 'canonicalJson(runtime?.sessionDraws) === canonicalJson(authority?.draws)'],
    ]);
  });

  it('awaits every asynchronous landOn and landHere call before observing state', () => {
    const callPattern = /\b(?:[A-Za-z_$][\w$]*[.])+(?:landOn|landHere)\(/gu;
    const calls = [...sliceSource.matchAll(callPattern)];
    expect(calls.length).toBeGreaterThanOrEqual(10);
    const unawaited = (source: string) => [...source.matchAll(callPattern)]
      .filter((match) => source.slice(Math.max(0, match.index - 6), match.index) !== 'await ');
    expect(unawaited(sliceSource)).toEqual([]);
    calls.forEach((call, index) => {
      expect(sliceSource.slice(call.index - 6, call.index)).toBe('await ');
      const mutant = `${sliceSource.slice(0, call.index - 6)}${sliceSource.slice(call.index)}`;
      expect(unawaited(mutant), `unawaited landing mutation ${index}`).toHaveLength(1);
    });
  });
});
