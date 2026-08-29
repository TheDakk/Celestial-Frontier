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

  const planet = section(main, 'function surveyPlanet(', '\nfunction buildCardActions(');
  if (!ordered(planet, [
    'if (!presentPlanetSurvey(p, star, supplied)) return false;',
    'const address = activeCardWorldAddress();',
    'if (address === null) return false;',
    'playSurveyPing();',
    "gameEvent('survey', { planetSeed: p.seed });",
    'void settleArc9Survey(address);',
  ]) || occurrences(planet, 'void settleArc9Survey(address);') !== 1) {
    errors.push('world-source-owner');
  }
  const surveyAndLand = section(
    main,
    'async function surveyAndLand(',
    '\nfunction activeCardPlanetState(',
  );
  if (!ordered(surveyAndLand, [
    'if (!surveyPlanet(p, star)) return false;',
    'const surveySettlement = productActionInFlight ? activePersist : null;',
    'if (surveySettlement !== null) await surveySettlement.catch(() => false);',
    'return doLand();',
  ])) errors.push('survey-before-land');

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

    const worldOwner = section(source, 'function surveyPlanet(', '\nfunction buildCardActions(');
    const forgedWorldOwner = replaceOnce(
      worldOwner,
      '  void settleArc9Survey(address);',
      '  void settleArc9Survey({ ...address } as never);',
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

  it('negative-controls skipped input surfaces and travel before settlement', () => {
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

    const rushedLanding = replaceOnce(
      source,
      '  if (surveySettlement !== null) await surveySettlement.catch(() => false);',
      '  /* mutation control skips Survey durability */',
    );
    expect(wiringErrors(rushedLanding)).toContain('survey-before-land');
  });
});
