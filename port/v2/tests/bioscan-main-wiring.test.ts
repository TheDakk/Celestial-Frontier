import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const mainSource = fs.readFileSync(path.join(here, '../apps/game/src/main.ts'), 'utf8');
const bioscanActionSource = fs.readFileSync(
  path.join(here, '../apps/game/src/bioscan-action.ts'), 'utf8',
);
const captureActionSource = fs.readFileSync(
  path.join(here, '../apps/game/src/arc4-capture-action.ts'), 'utf8',
);
const captureCapacitySource = fs.readFileSync(
  path.join(here, '../apps/game/src/arc4-capture-capacity.ts'), 'utf8',
);

function section(source: string, startText: string, endText: string): string {
  const start = source.indexOf(startText);
  const end = source.indexOf(endText, start);
  return start >= 0 && end > start ? source.slice(start, end) : '';
}

function inOrder(source: string, needles: readonly string[]): boolean {
  let cursor = -1;
  for (const needle of needles) {
    cursor = source.indexOf(needle, cursor + 1);
    if (cursor < 0) return false;
  }
  return true;
}

function errors(source: string): string[] {
  const result: string[] = [];
  for (const symbol of [
    'commitBioscanActionV1,', 'projectBioscanActionV1,', 'publishBioscanActionV1,',
  ]) if (!source.includes(symbol)) result.push(`missing ${symbol}`);

  const present = section(source, 'function presentPlanetSurvey(', '\nfunction startPlanetSurvey(');
  if (!inOrder(present, [
    'const roster = canonicalRosterForBioscanCard(address, preparedCaptureRoster);',
    'currentBioscanCardState = projectCurrentBioscanCardState(address, roster);',
    'buildCardActions(p, currentBioscanCardState)',
  ]) || /commitBioscanActionV1|settleArc9Survey|commitOutcome|persistView/u.test(present)) {
    result.push('living card presentation is not a read-only Bioscan projection');
  }

  const start = section(source, 'function startPlanetSurvey(', '\nfunction buildCardActions(');
  if (!inOrder(start, [
    'const facts = deriveArc9SurveyFactV1(address);',
    "if (facts.target === 'world' && facts.living)",
    'return Promise.resolve(true);',
    'return settleArc9Survey(address);',
  ])) result.push('living inspection does not defer its Survey write to Discover Life');

  const cardActions = section(source, 'function buildCardActions(', '\nfunction refreshPlanetSurveyCard(');
  const cardClick = section(source, "card.addEventListener('click'", '\nconst sideEl =');
  if (!cardActions.includes('bioscanCardActionHtml(bioscanState)')
    || !cardClick.includes("else if (a === 'bioscan')")
    || !cardClick.includes('await runArc9Bioscan();')) {
    result.push('Discover Life control is not connected to the one action owner');
  }

  const action = section(source, 'async function runArc9Bioscan()', '\nasync function settleArc9Survey(');
  if (!inOrder(action, [
    "productActionCoordinator.tryClaim(operation)",
    'await smokeProductActionHold.holdIfArmed(actionClaim.operation);',
    'await settleF4Heartbeat();',
    'const fresh = freshCurrentBioscanReady(actionBarrier);',
    'await commitBioscanActionV1({',
    'durable = true;',
    'const checkpoint = runtime.checkpointParent();',
    'const starterGearChanged = attempt.starterCharter.completions.some(',
    'const loadedLoot = readArc2Loot(runtime.extensions);',
    'publishBioscanActionV1(sourceState, attempt);',
    'inventoryPanelController.setState(arc2LootState);',
    "lastArc9BioscanOutcome = `committed:${target}:${attempt.transaction.revision}`;",
    "gameEvent('bioscan', { worldKey: fresh.worldKey });",
    '...attempt.achievementIdsAdded,',
    '...attempt.postHazardAggregateAchievementIdsAdded,',
    '...attempt.starterCharter.addedAchievementIds,',
    'presentProgressionCeremony({',
    'nextUnlockedIds: attempt.state.unlocked,',
    'nextBestRankIndex: attempt.state.stats.bestRank ?? 0,',
    'toastCharterCompletion(',
    'actionClaim.settle(durable);',
    'if (activePersist === actionBarrier) activePersist = null;',
  ]) || action.includes('queueArc9ProgressionRefresh(')
    || (action.match(/commitBioscanActionV1\(/gu)?.length ?? 0) !== 1) {
    result.push('Bioscan is not one rechecked F4 commit and fixed-point publication');
  }
  if (!source.includes("'[data-act=\"bioscan\"]'")
    || !source.includes("schema: 'cf-v2-arc9-bioscan-app-state/v1'")) {
    result.push('Bioscan read-only guard or diagnostics are missing');
  }
  return result;
}

describe('living-world Bioscan Main wiring', () => {
  it('keeps inspection read-only and connects one explicit durable Discover Life action', () => {
    expect(errors(mainSource)).toEqual([]);
  });

  it('keeps accepted st-scan on explicit Discover Life instead of Capture or Chapter 2 c2-scan', () => {
    expect(bioscanActionSource.match(/event: \{ kind: 'bioscan', address: captured\.address \}/gu))
      .toHaveLength(1);
    expect(bioscanActionSource).toContain('stageStarterCharterActionV1({');
    expect(captureActionSource).not.toContain("kind: 'bioscan'");
    expect(captureActionSource).not.toContain('stageStarterCharterActionV1({');
    expect(captureCapacitySource).not.toContain("kind: 'bioscan'");
    expect(captureCapacitySource).not.toContain("'st-scan'");
  });

  it('negative-controls publication and the living-world write boundary', () => {
    expect(errors(mainSource.replace(
      '      publishBioscanActionV1(sourceState, attempt);',
      '      void attempt.state;',
    ))).toContain('Bioscan is not one rechecked F4 commit and fixed-point publication');
    expect(errors(mainSource.replace(
      '      return Promise.resolve(true);',
      '      return settleArc9Survey(address);',
    ))).toContain('living inspection does not defer its Survey write to Discover Life');
    expect(errors(mainSource.replace(
      '        ...attempt.achievementIdsAdded,',
      '        // hostile survivor event omitted',
    ))).toContain('Bioscan is not one rechecked F4 commit and fixed-point publication');
    expect(errors(mainSource.replace(
      '        ...attempt.postHazardAggregateAchievementIdsAdded,',
      '        // post-hazard aggregate refresh omitted',
    ))).toContain('Bioscan is not one rechecked F4 commit and fixed-point publication');
    expect(errors(mainSource.replace(
      '        ...attempt.starterCharter.addedAchievementIds,',
      '        // accepted Starter Charter progression omitted',
    ))).toContain('Bioscan is not one rechecked F4 commit and fixed-point publication');
    expect(errors(mainSource.replace(
      '        const loadedLoot = readArc2Loot(runtime.extensions);',
      '        const loadedLoot = { kind: \'absent\' as const };',
    ))).toContain('Bioscan is not one rechecked F4 commit and fixed-point publication');
    expect(errors(mainSource.replace(
      '        nextBestRankIndex: attempt.state.stats.bestRank ?? 0,',
      '        nextBestRankIndex: attempt.survey.successor.bestRank,',
    ))).toContain('Bioscan is not one rechecked F4 commit and fixed-point publication');
  });
});
