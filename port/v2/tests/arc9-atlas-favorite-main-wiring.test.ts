import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const mainSource = readFileSync(
  fileURLToPath(new URL('../apps/game/src/main.ts', import.meta.url)),
  'utf8',
);

const FAVORITE_START = 'async function runArc9AtlasFavoriteChange(';
const FAVORITE_END = '\nfunction freshCurrentBioscanReady(';

function occurrences(source: string, needle: string): number {
  return source.split(needle).length - 1;
}

function section(source: string, startNeedle: string, endNeedle: string): string {
  const start = source.indexOf(startNeedle);
  const end = source.indexOf(endNeedle, start + startNeedle.length);
  return start >= 0 && end > start ? source.slice(start, end) : '';
}

function ordered(owner: string, needles: readonly string[]): boolean {
  const positions = needles.map((needle) => owner.indexOf(needle));
  return positions.every((position, index) => (
    position >= 0 && (index === 0 || position > positions[index - 1]!)
  ));
}

function replaceInFavorite(
  source: string,
  needle: string,
  replacement: string,
): string {
  const owner = section(source, FAVORITE_START, FAVORITE_END);
  if (owner === '') throw new Error('missing Atlas Favorite owner');
  if (occurrences(owner, needle) !== 1) {
    throw new Error(`Atlas Favorite mutation target is not unique: ${needle}`);
  }
  return source.replace(owner, owner.replace(needle, replacement));
}

function favoriteActionErrors(main: string): string[] {
  const errors: string[] = [];
  const importBlock = section(
    main,
    'import {\n  commitArc9AtlasFavoriteV1,',
    "} from './arc9-atlas-favorite-action.js';",
  );
  for (const binding of [
    'operationForArc9AtlasFavoriteV1,',
    'publishArc9AtlasFavoriteFieldsV1,',
    'type Arc9AtlasFavoriteActionOutcomeV1,',
  ]) if (!importBlock.includes(binding)) errors.push(`favorite-import:${binding}`);

  const action = section(main, FAVORITE_START, FAVORITE_END);
  if (!ordered(action, [
    'if (arc9AtlasFavoritePendingId !== null || arc9AtlasRowPending !== null',
    '|| arc9AtlasUndoPending || smokeForceReadOnly',
    'operation = operationForArc9AtlasFavoriteV1(atlasId);',
    'const targetIndex = save.logMap.findIndex(([id]) => id === atlasId);',
    'const targetPair = targetIndex < 0 ? null : save.logMap[targetIndex] ?? null;',
    'const targetEntry = targetPair?.[1] ?? null;',
    'const actionClaim = productActionCoordinator.tryClaim(operation);',
    'clearArc9AtlasUndo();',
    'const priorFavorite = targetEntry.fav;',
    'const priorStats = save.stats;',
    'const priorUnlocked = save.unlocked;',
    'const priorRoute = atlasRouteStates.get(targetEntry);',
    'productActionInFlight = true;',
    'activePersist = actionBarrier;',
    'arc9AtlasFavoritePendingId = atlasId;',
    'await smokeProductActionHold.holdIfArmed(actionClaim.operation);',
    'await settleF4Heartbeat();',
    'save.logMap[targetIndex] !== targetPair',
    'targetPair[1] !== targetEntry || targetEntry.fav !== priorFavorite',
    'outcome = await commitArc9AtlasFavoriteV1({',
    'durable = true;',
    'const checkpoint = runtime.checkpointParent();',
    'publishArc9AtlasFavoriteFieldsV1(save, outcome);',
    'atlasRouteStates.get(targetEntry) !== priorRoute',
    'presentProgressionCeremony({',
    "...(outcome.curatorAdded ? ['curator'] : []),",
    '...outcome.addedAggregateAchievementIds,',
    'actionClaim.settle(durable);',
    'arc9AtlasFavoritePendingId = null;',
  ])) errors.push('favorite-fixed-point-order');

  for (const guard of [
    'smokeForceReadOnly',
    '!f4RuntimeMayMutate(runtime)',
    'importWriteInFlight',
    'replacementTransaction',
    'replacementReloadPending',
    'trainingCheckpointWriteHeld',
    'trainingActive()',
    'ecologyEpochBlocksActions()',
  ]) if (occurrences(action, guard) < 2) errors.push(`post-heartbeat-guard:${guard}`);

  const beforeCommit = section(action, FAVORITE_START, 'outcome = await commitArc9AtlasFavoriteV1({');
  if (beforeCommit.includes('targetEntry.fav =')
    || beforeCommit.includes('save.stats =')
    || beforeCommit.includes('save.unlocked =')) {
    errors.push('no-optimistic-publication');
  }
  if (occurrences(action, 'commitArc9AtlasFavoriteV1({') !== 1
    || occurrences(action, 'publishArc9AtlasFavoriteFieldsV1(save, outcome);') !== 1
    || occurrences(action, 'actionClaim.settle(durable);') !== 1
    || action.includes('persistView(')
    || action.includes('queueArc9ProgressionRefresh(')
    || action.includes('while (')
    || action.includes('setTimeout(')) {
    errors.push('one-cas-no-retry');
  }

  for (const fixedPoint of [
    'runtime.revision !== outcome.transaction.revision',
    'checkpointPair?.[0] !== outcome.atlasId',
    'checkpointPair[1].fav !== outcome.favoriteAfter',
    'checkpoint.stats.bestRank !== outcome.nextBestRankIndex',
    'JSON.stringify(checkpoint.unlocked) !== JSON.stringify(outcome.nextUnlockedIds)',
  ]) if (!action.includes(fixedPoint)) errors.push(`durable-fixed-point:${fixedPoint}`);

  if (occurrences(action, 'save.logMap[targetIndex] !== targetPair') < 2
    || occurrences(action, 'targetPair[1] !== targetEntry') < 2
    || !action.includes('atlasRouteStates.get(targetEntry) !== priorRoute')) {
    errors.push('exact-pair-route-identity');
  }

  const ceremony = section(
    action,
    '      presentProgressionCeremony({',
    '\n      });',
  );
  if (!ordered(ceremony, [
    'revision: outcome.transaction.revision,',
    "disposition: 'committed-publication',",
    'priorUnlockedIds: outcome.priorUnlockedIds,',
    'nextUnlockedIds: outcome.nextUnlockedIds,',
    'addedAchievementIds: [',
    "...(outcome.curatorAdded ? ['curator'] : []),",
    '...outcome.addedAggregateAchievementIds,',
    'priorBestRankIndex: outcome.priorBestRankIndex,',
    'nextBestRankIndex: outcome.nextBestRankIndex,',
  ])) errors.push('curator-and-aggregate-ceremony');

  const publicationFault = section(
    action,
    '    } catch (error) {\n      targetEntry.fav = priorFavorite;',
    '\n    }\n  } catch (error) {',
  );
  if (!ordered(publicationFault, [
    'targetEntry.fav = priorFavorite;',
    'save.stats = priorStats;',
    'save.unlocked = priorUnlocked;',
    "lastArc9AtlasFavoriteOutcome = 'committed-publication-reload';",
    'scheduleF4AuthorityConvergenceReload(',
  ])) errors.push('publication-fault-restores-source-view');

  return [...new Set(errors)];
}

describe('Arc 9 Atlas Favorite live action owner', () => {
  it('owns one exact receipt/CAS with pair identity and canonical Curator publication', () => {
    expect(favoriteActionErrors(mainSource)).toEqual([]);
  });

  it('negative-controls the exact operation, row-pair identity, and route sidecar', () => {
    const forgedOperation = replaceInFavorite(
      mainSource,
      'operation = operationForArc9AtlasFavoriteV1(atlasId);',
      "operation = 'arc9-atlas-favorite:forged';",
    );
    const clonedPair = replaceInFavorite(
      mainSource,
      'const targetPair = targetIndex < 0 ? null : save.logMap[targetIndex] ?? null;',
      'const targetPair = targetIndex < 0 ? null : structuredClone(save.logMap[targetIndex]) ?? null;',
    );
    const routeBlind = replaceInFavorite(
      mainSource,
      '        || atlasRouteStates.get(targetEntry) !== priorRoute) {',
      ') {',
    );
    expect(favoriteActionErrors(forgedOperation)).toContain('favorite-fixed-point-order');
    expect(favoriteActionErrors(clonedPair)).toContain('favorite-fixed-point-order');
    expect(favoriteActionErrors(routeBlind)).toContain('exact-pair-route-identity');
  });

  it('negative-controls optimistic publication, duplicate CAS, and durable fixed point', () => {
    const optimistic = replaceInFavorite(
      mainSource,
      '    outcome = await commitArc9AtlasFavoriteV1({',
      '    targetEntry.fav = desired;\n    outcome = await commitArc9AtlasFavoriteV1({',
    );
    const duplicateCas = replaceInFavorite(
      mainSource,
      '    outcome = await commitArc9AtlasFavoriteV1({',
      '    void commitArc9AtlasFavoriteV1({ runtime, state: save, atlasId, desired, codecNow: Date.now() });\n'
        + '    outcome = await commitArc9AtlasFavoriteV1({',
    );
    const checkpointBlind = replaceInFavorite(
      mainSource,
      '        || checkpointPair[1].fav !== outcome.favoriteAfter',
      '        /* negative control omits exact Favorite state */',
    );
    expect(favoriteActionErrors(optimistic)).toContain('no-optimistic-publication');
    expect(favoriteActionErrors(duplicateCas)).toContain('one-cas-no-retry');
    expect(favoriteActionErrors(checkpointBlind)).toContain(
      'durable-fixed-point:checkpointPair[1].fav !== outcome.favoriteAfter',
    );
  });

  it('negative-controls Curator/aggregate ceremony and postcommit rollback', () => {
    const curatorBlind = replaceInFavorite(
      mainSource,
      "          ...(outcome.curatorAdded ? ['curator'] : []),",
      '          /* negative control drops the exact Curator transition */',
    );
    const aggregateBlind = replaceInFavorite(
      mainSource,
      '          ...outcome.addedAggregateAchievementIds,',
      '          /* negative control drops aggregate achievements */',
    );
    const rollbackBlind = replaceInFavorite(
      mainSource,
      '      targetEntry.fav = priorFavorite;\n'
        + '      save.stats = priorStats;\n'
        + '      save.unlocked = priorUnlocked;\n'
        + "      lastArc9AtlasFavoriteOutcome = 'committed-publication-reload';",
      '      targetEntry.fav = priorFavorite;\n'
        + '      /* negative control keeps the optimistically published stats */\n'
        + '      save.unlocked = priorUnlocked;\n'
        + "      lastArc9AtlasFavoriteOutcome = 'committed-publication-reload';",
    );
    expect(favoriteActionErrors(curatorBlind)).toContain('curator-and-aggregate-ceremony');
    expect(favoriteActionErrors(aggregateBlind)).toContain('curator-and-aggregate-ceremony');
    expect(favoriteActionErrors(rollbackBlind)).toContain('publication-fault-restores-source-view');
  });
});
