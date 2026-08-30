import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(
  path.join(here, '..', 'apps', 'game', 'src', 'main.ts'),
  'utf8',
);

function occurrences(text: string, needle: string): number {
  return text.split(needle).length - 1;
}

function section(text: string, startNeedle: string, endNeedle: string): string {
  const start = text.indexOf(startNeedle);
  const end = text.indexOf(endNeedle, start + startNeedle.length);
  return start >= 0 && end > start ? text.slice(start, end) : '';
}

function replaceOnce(text: string, needle: string, replacement: string): string {
  if (occurrences(text, needle) !== 1) {
    throw new Error(`Survey mutation target is not unique: ${needle}`);
  }
  return text.replace(needle, replacement);
}

function ordered(owner: string, needles: readonly string[]): boolean {
  const positions = needles.map((needle) => owner.indexOf(needle));
  return positions.every((position, index) => (
    position >= 0 && (index === 0 || position > positions[index - 1]!)
  ));
}

function wiringErrors(main: string): string[] {
  const errors: string[] = [];
  const surveyImport = section(
    main,
    'import {\n  commitArc9SurveySettlementV1,',
    "} from './arc9-survey-action.js';",
  );
  for (const imported of [
    'operationForArc9SurveyV1,',
    'publishArc9SurveyFieldsV1,',
    'type Arc9SurveyActionOutcomeV1,',
    'type Arc9SurveyAddressV1,',
  ]) if (!surveyImport.includes(imported)) errors.push(`survey-import:${imported}`);
  if (!main.includes("import { runSurveyLandHandoffV1 } from './survey-land-handoff.js';")) {
    errors.push('survey-land-handoff-import');
  }
  if (!main.includes('resolveCF1StarAddress, resolveCF1WorldAddress,')) {
    errors.push('star-address-resolver-import');
  }
  if (!main.includes('type CanonicalCF1StarAddress, type CanonicalCF1WorldAddress,')) {
    errors.push('star-address-type-import');
  }

  const star = section(
    main,
    'function canonicalStarAddressForSurvey(',
    '\nlet galStars:',
  );
  if (!ordered(star, [
    "if (nav.mode !== 'galaxy') return null;",
    'const expectedGalaxyKey = getProvenGalaxyKey(nav.gal);',
    'const resolved = resolveCF1StarAddress({ galaxy: nav.gal, star });',
    'getProvenGalaxyKey(resolved.address.galaxy) === expectedGalaxyKey',
    'const descriptor = describePick({ kind: \'star\', data: star } as never);',
    'surveyCard(descriptor, {',
    'void settleArc9Survey(address);',
  ]) || occurrences(star, 'resolveCF1StarAddress(') !== 1
    || occurrences(star, 'void settleArc9Survey(address);') !== 1) {
    errors.push('star-source-owner');
  }

  const planetStart = section(main, 'function startPlanetSurvey(', '\nfunction surveyPlanet(');
  if (!ordered(planetStart, [
    'if (!presentPlanetSurvey(p, star, supplied)) return null;',
    'const address = activeCardWorldAddress();',
    'if (address === null) return null;',
    'playSurveyPing();',
    "gameEvent('survey', { planetSeed: p.seed });",
    'return settleArc9Survey(address);',
  ]) || occurrences(planetStart, 'settleArc9Survey(address)') !== 1) {
    errors.push('world-source-owner');
  }
  const planet = section(main, 'function surveyPlanet(', '\nfunction buildCardActions(');
  if (!ordered(planet, [
    'const settlement = startPlanetSurvey(p, star, supplied);',
    'if (settlement === null) return false;',
    'void settlement;',
    'return true;',
  ]) || occurrences(planet, 'startPlanetSurvey(p, star, supplied)') !== 1
    || planet.includes('settleArc9Survey(')
    || planet.includes('playSurveyPing(')
    || planet.includes("gameEvent('survey',")) {
    errors.push('world-source-owner');
  }
  const surveyAndLand = section(
    main,
    'async function surveyAndLand(',
    '\nfunction activeCardPlanetState(',
  );
  if (!ordered(surveyAndLand, [
    'return runSurveyLandHandoffV1({',
    'waitForCurrentBarrier: waitForActivePersist,',
    'startSurvey: () => startPlanetSurvey(p, star),',
    'land: doLand,',
  ])
    || occurrences(surveyAndLand, 'runSurveyLandHandoffV1({') !== 1
    || !main.includes('async function waitForActivePersist(): Promise<void> {')
    || !main.includes('const pending = activePersist;')
    || !main.includes('if (pending !== null) await pending.catch(() => false);')) {
    errors.push('survey-before-land');
  }

  if (occurrences(main, 'surveyStar(s);') !== 2
    || occurrences(main, 'surveyStar(star);') !== 1
    || occurrences(main, "surveyCard(describePick({ kind: 'star'") !== 0
    || occurrences(main, "surveyCard(describePick({kind:'star'") !== 0) {
    errors.push('star-surface-coverage');
  }

  const action = section(
    main,
    'async function settleArc9Survey(',
    '\nasync function runArc9ExplorerNameChange(',
  );
  if (!ordered(action, [
    'const actionClaim = productActionCoordinator.tryClaim(operation);',
    'await smokeProductActionHold.holdIfArmed(actionClaim.operation);',
    'await settleF4Heartbeat();',
    'outcome = await commitArc9SurveySettlementV1({',
    'durable = true;',
    'const checkpoint = runtime.checkpointParent();',
    'publishArc9SurveyFieldsV1(save, outcome);',
    'updateChips();',
    'actionClaim.settle(durable);',
  ])) errors.push('settlement-order');
  for (const guard of [
    'smokeForceReadOnly',
    'trainingCheckpointWriteHeld',
    'trainingActive()',
    'ecologyEpochBlocksActions()',
  ]) if (occurrences(action, guard) < 2) errors.push(`settlement-guard:${guard}`);
  for (const durableField of [
    'checkpoint.surveyedSet',
    'checkpoint.ptypesSeen',
    'checkpoint.starKindsSeen',
    'checkpoint.stats.surveys',
    'checkpoint.stats.bestRank',
    'checkpoint.unlocked',
  ]) if (!action.includes(durableField)) errors.push(`checkpoint-field:${durableField}`);
  if (occurrences(action, 'commitArc9SurveySettlementV1({') !== 1
    || occurrences(action, 'publishArc9SurveyFieldsV1(save, outcome);') !== 1
    || occurrences(action, 'actionClaim.settle(durable);') !== 1
    || action.includes('queueArc9ProgressionRefresh(')
    || action.includes('persistView(')) {
    errors.push('one-cas-fixed-point-owner');
  }

  const travel = section(main, "if (a === 'travel') {", "\n  } else if (a === 'landcta') {");
  if (!ordered(travel, [
    "if (!action || card.style.display === 'none') return;",
    'if (blockRouteChangeWhileProductAction()) return;',
    'cardTravelAction = null;',
    '(act as HTMLButtonElement).disabled = true;',
    'action.run();',
  ])) errors.push('travel-settlement-fence');
  return [...new Set(errors)];
}

describe('Arc 9 canonical Survey Main wiring', () => {
  it('joins all three real star surfaces and the real world Survey to one fixed-point F4 owner', () => {
    expect(wiringErrors(source)).toEqual([]);
  });

  it('negative-controls canonical hierarchy provenance for star and world events', () => {
    const starOwner = section(
      source,
      'function canonicalStarAddressForSurvey(',
      '\nlet galStars:',
    );
    const forgedStarOwner = replaceOnce(
      starOwner,
      '  void settleArc9Survey(address);',
      '  void settleArc9Survey(star as never);',
    );
    expect(wiringErrors(source.replace(starOwner, forgedStarOwner))).toContain('star-source-owner');

    const wrongParent = replaceOnce(
      source,
      '  const resolved = resolveCF1StarAddress({ galaxy: nav.gal, star });',
      '  const resolved = resolveCF1StarAddress({ galaxy: NAV_HOME, star });',
    );
    expect(wiringErrors(wrongParent)).toContain('star-source-owner');

    const worldOwner = section(source, 'function startPlanetSurvey(', '\nfunction surveyPlanet(');
    const forgedWorldOwner = replaceOnce(
      worldOwner,
      '  return settleArc9Survey(address);',
      '  return settleArc9Survey({ ...address } as never);',
    );
    expect(wiringErrors(source.replace(worldOwner, forgedWorldOwner))).toContain('world-source-owner');
  });

  it('negative-controls the one-CAS fixed point and post-heartbeat sandbox fence', () => {
    const withoutPublish = replaceOnce(
      source,
      '      publishArc9SurveyFieldsV1(save, outcome);',
      '      /* mutation control omits verified publication */',
    );
    expect(wiringErrors(withoutPublish)).toContain('settlement-order');
    expect(wiringErrors(withoutPublish)).toContain('one-cas-fixed-point-owner');

    const secondReceipt = replaceOnce(
      source,
      '    actionClaim.settle(durable);\n    /* The Survey receipt',
      '    actionClaim.settle(durable);\n    if (durable) queueArc9ProgressionRefresh(actionClaim.operation);\n    /* The Survey receipt',
    );
    expect(wiringErrors(secondReceipt)).toContain('one-cas-fixed-point-owner');

    const action = section(
      source,
      'async function settleArc9Survey(',
      '\nasync function runArc9ExplorerNameChange(',
    );
    const oneTrainingGuard = replaceOnce(
      action,
      '      || trainingCheckpointWriteHeld || trainingActive() || ecologyEpochBlocksActions()) {',
      '      || ecologyEpochBlocksActions()) {',
    );
    expect(wiringErrors(source.replace(action, oneTrainingGuard))).toContain(
      'settlement-guard:trainingCheckpointWriteHeld',
    );
  });

  it('negative-controls skipped input surfaces, travel, and tested handoff delegation', () => {
    const skippedFineStar = source.replace(
      "        spr.on('pointertap', () => { surveyStar(s); });",
      "        spr.on('pointertap', () => { surveyCard(s); });",
    );
    expect(wiringErrors(skippedFineStar)).toContain('star-surface-coverage');

    const unfencedTravel = replaceOnce(
      source,
      '    if (blockRouteChangeWhileProductAction()) return;\n    cardTravelAction = null;',
      '    cardTravelAction = null;',
    );
    expect(wiringErrors(unfencedTravel)).toContain('travel-settlement-fence');

    const surveyAndLand = section(
      source,
      'async function surveyAndLand(',
      '\nfunction activeCardPlanetState(',
    );
    const skippedRouteBarrier = replaceOnce(
      surveyAndLand,
      '    waitForCurrentBarrier: waitForActivePersist,',
      '    /* mutation control omits the route/Survey barrier owner */',
    );
    expect(wiringErrors(source.replace(surveyAndLand, skippedRouteBarrier)))
      .toContain('survey-before-land');
    const skippedSurvey = replaceOnce(
      surveyAndLand,
      '    startSurvey: () => startPlanetSurvey(p, star),',
      '    startSurvey: () => Promise.resolve(true),',
    );
    expect(wiringErrors(source.replace(surveyAndLand, skippedSurvey)))
      .toContain('survey-before-land');
    const skippedLanding = replaceOnce(
      surveyAndLand,
      '    land: doLand,',
      '    land: async () => true,',
    );
    expect(wiringErrors(source.replace(surveyAndLand, skippedLanding)))
      .toContain('survey-before-land');

    const retriedSurvey = replaceOnce(
      surveyAndLand,
      '    startSurvey: () => startPlanetSurvey(p, star),',
      '    startSurvey: () => {\n' +
        '      void startPlanetSurvey(p, star);\n' +
        '      return startPlanetSurvey(p, star);\n' +
        '    },',
    );
    expect(wiringErrors(source.replace(surveyAndLand, retriedSurvey)))
      .toContain('survey-before-land');
  });
});
