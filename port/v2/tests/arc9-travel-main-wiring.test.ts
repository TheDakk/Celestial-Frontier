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
    throw new Error(`Arc 9 Travel mutation target is not unique: ${needle}`);
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
  const importBlock = section(
    main,
    'import {\n  commitArc9GalaxyArrivalRouteV1,',
    "} from './arc9-travel-action.js';",
  );
  for (const imported of [
    'commitArc9TravelSettlementV1,',
    'operationForArc9TravelV1,',
    'publishArc9TravelFieldsV1,',
    'type Arc9TravelActionKindV1,',
    'type Arc9TravelActionOutcomeV1,',
  ]) if (!importBlock.includes(imported)) errors.push(`travel-import:${imported}`);

  const inspection = section(
    main,
    'function arc9TravelInspectionOnly(): boolean {',
    '\nfunction arc9TravelWriteTemporarilyBlocked(): boolean {',
  );
  for (const fence of [
    'smokeForceReadOnly',
    '!f4RuntimeMayMutate()',
    'trainingCheckpointWriteHeld',
    'trainingActive()',
  ]) if (!inspection.includes(fence)) errors.push(`inspection-fence:${fence}`);
  for (const transient of [
    'activePersist',
    'importWriteInFlight',
    'replacementTransaction',
    'replacementReloadPending',
    'ecologyEpochBlocksActions()',
  ]) if (inspection.includes(transient)) errors.push(`inspection-is-not-transient:${transient}`);

  const transient = section(
    main,
    'function arc9TravelWriteTemporarilyBlocked(): boolean {',
    '\nasync function settleArc9DirectTravel(',
  );
  for (const fence of [
    'activePersist !== null',
    'importWriteInFlight',
    'replacementTransaction !== null',
    'replacementReloadPending',
    'ecologyEpochBlocksActions()',
  ]) if (!transient.includes(fence)) errors.push(`transient-fence:${fence}`);

  const owner = section(
    main,
    'async function settleArc9DirectTravel(',
    '\nasync function runArc9AtlasFavoriteChange(',
  );
  if (!ordered(owner, [
    'if (smokeForceReadOnly || !f4RuntimeMayMutate(runtime)',
    'operation = operationForArc9TravelV1(actionKind, galaxyNav);',
    'const actionClaim = productActionCoordinator.tryClaim(operation);',
    'const priorGalSeen = save.galSeen;',
    'const priorStats = save.stats;',
    'const priorUnlocked = save.unlocked;',
    'const priorSavedView = save.savedView;',
    'productActionInFlight = true;',
    'activePersist = actionBarrier;',
    'await smokeProductActionHold.holdIfArmed(actionClaim.operation);',
    'await settleF4Heartbeat();',
    'nav !== sourceNav || !authorityStillValid()',
    'outcome = acceptedSavedView === undefined',
    '? await commitArc9TravelSettlementV1({',
    ': await commitArc9GalaxyArrivalRouteV1({',
    "if (outcome.kind === 'current') {",
    'publishNavigation();',
    'durable = true;',
    'const checkpoint = runtime.checkpointParent();',
    'publishArc9TravelFieldsV1(save, outcome);',
    'actionClaim.settle(durable);',
  ])) errors.push('travel-owner-order');
  for (const fence of [
    'smokeForceReadOnly',
    '!f4RuntimeMayMutate(runtime)',
    'trainingCheckpointWriteHeld',
    'trainingActive()',
  ]) if (occurrences(owner, fence) < 2) errors.push(`post-heartbeat-fence:${fence}`);
  if (!owner.includes('arc9TravelWriteTemporarilyBlocked()')) {
    errors.push('pre-heartbeat-transient-fence');
  }
  for (const fence of [
    'importWriteInFlight',
    'replacementTransaction',
    'replacementReloadPending',
    'ecologyEpochBlocksActions()',
  ]) if (!owner.includes(fence)) errors.push(`post-heartbeat-fence:${fence}`);
  for (const checkpoint of [
    'runtime.revision !== outcome.transaction.revision',
    'JSON.stringify(checkpoint.galSeen) !== JSON.stringify(outcome.successor.galSeen)',
    'checkpoint.stats.bestRank !== outcome.successor.bestRank',
    'JSON.stringify(checkpoint.unlocked) !== JSON.stringify(outcome.successor.unlocked)',
    'JSON.stringify(checkpoint.savedView) !== JSON.stringify(outcome.successor.savedView)',
  ]) if (!owner.includes(checkpoint)) errors.push(`travel-checkpoint:${checkpoint}`);
  const beforeCommit = section(
    owner,
    'async function settleArc9DirectTravel(',
    'outcome = acceptedSavedView === undefined',
  );
  for (const optimistic of [
    'save.galSeen =',
    'save.stats =',
    'save.unlocked =',
    'save.savedView =',
    'publishNavigation();',
  ]) if (beforeCommit.includes(optimistic)) errors.push(`optimistic-travel:${optimistic}`);
  if (occurrences(owner, 'commitArc9TravelSettlementV1({') !== 1
    || occurrences(owner, 'commitArc9GalaxyArrivalRouteV1({') !== 1
    || occurrences(owner, 'publishArc9TravelFieldsV1(save, outcome);') !== 1
    || occurrences(owner, 'publishNavigation();') !== 2
    || owner.lastIndexOf('publishNavigation();')
      <= owner.indexOf('publishArc9TravelFieldsV1(save, outcome);')
    || occurrences(owner, 'actionClaim.settle(durable);') !== 1
    || !owner.includes('outcome = acceptedSavedView === undefined\n      ? await')
    || owner.includes('persistView(')
    || owner.includes('queueArc9ProgressionRefresh(')
    || owner.includes('while (')
    || owner.includes('setTimeout(')) {
    errors.push('one-cas-no-refresh');
  }

  const descent = section(
    main,
    'function resolveGalaxyDescent(',
    '\nfunction descendSystem(',
  );
  const evidence = section(
    descent,
    'function descendGalaxyForEvidence(',
    '\nlet automaticGalaxyArrivalLatch:',
  );
  if (!ordered(evidence, [
    'if (blockRouteChangeWhileProductAction()) return false;',
    'const accepted = resolveGalaxyDescent(g);',
    'if (accepted === null) return false;',
    'publishGalaxyDescent(accepted, true);',
    'return true;',
  ])
    || main.includes('async function descendGalaxyForEvidence(')
    || evidence.includes('settleArc9DirectTravel(')
    || evidence.includes('persistView(')) errors.push('synchronous-evidence-descent');
  const productionDescentStart = descent.indexOf('function descendGalaxy(');
  const productionDescent = productionDescentStart >= 0
    ? descent.slice(productionDescentStart) : '';
  if (!ordered(productionDescent, [
    'const sourceNav = nav;',
    'const accepted = resolveGalaxyDescent(g);',
    'const galaxyKey = getProvenGalaxyKey(accepted.gal);',
    "if (source === 'zoom') {",
    'if (automaticGalaxyArrivalLatch === galaxyKey) return false;',
    'automaticGalaxyArrivalLatch = galaxyKey;',
    'if (arc9TravelInspectionOnly()) {',
    'publishGalaxyDescent(accepted, true);',
    'if (arc9TravelWriteTemporarilyBlocked()) return false;',
    'void settleArc9DirectTravel(',
    "'galaxy-arrival',",
  ])
    || !productionDescent.includes(
      "  void settleArc9DirectTravel(\n"
        + "    'galaxy-arrival',\n"
        + '    accepted,\n'
        + '    sourceNav,\n'
        + '    () => publishGalaxyDescent(accepted, true),\n'
        + '  );',
    )
    || occurrences(productionDescent, 'settleArc9DirectTravel(') !== 1
    || productionDescent.includes('persistView(')) errors.push('production-galaxy-owner');
  if (occurrences(main, '{ label: \'Enter galaxy\', run: () => descendGalaxy(g) },') !== 1
    || occurrences(main, '{ label: \'Enter galaxy\', run: () => descendGalaxy(galaxy) },') !== 1
    || occurrences(main, "descendGalaxy(best, 'zoom');") !== 1) {
    errors.push('galaxy-input-coverage');
  }
  if (occurrences(main, 'descendGalaxy: descendGalaxyForEvidence,') !== 1
    || main.includes('descendGalaxy: descendGalaxy,')) errors.push('evidence-api-shim');

  const wormPublisher = section(
    main,
    'function publishWormholeTraversal(',
    '\nfunction beginWormholeTraversal(',
  );
  if (!ordered(wormPublisher, [
    'const lifted = ascend(sourceGalaxy);',
    "if (!lifted.ok || lifted.state.mode !== 'universe')",
    'nav = lifted.state;',
    'savedRouteWriteHeld = false;',
    'rerender(skipPersist ? { skipPersist: true } : undefined);',
  ])) errors.push('worm-publication');
  const wormOwner = section(
    main,
    'function beginWormholeTraversal(',
    '\nlet automaticWormholeTraversalLatch:',
  );
  if (!ordered(wormOwner, [
    'if (arc9TravelInspectionOnly()) {',
    'publishWormholeTraversal(sourceGalaxy, true);',
    'if (arc9TravelWriteTemporarilyBlocked()) return false;',
    'void settleArc9DirectTravel(',
    "'wormhole-traversal',",
    '() => publishWormholeTraversal(sourceGalaxy, true),',
  ])
    || !wormOwner.includes("    'wormhole-traversal',\n    sourceGalaxy,\n    sourceGalaxy,")
    || occurrences(wormOwner, 'settleArc9DirectTravel(') !== 1
    || wormOwner.includes('persistView(')) errors.push('production-worm-owner');

  const transitions = section(
    main,
    'function checkTransitions(): void {',
    '\nfunction zoomLimits(): [number, number] {',
  );
  if (!ordered(transitions, [
    'if (productActionInFlight) return;',
    "if (nav.mode !== 'universe') automaticGalaxyArrivalLatch = null;",
    "if (nav.mode !== 'galaxy') automaticWormholeTraversalLatch = null;",
    "descendGalaxy(best, 'zoom');",
    '} else automaticGalaxyArrivalLatch = null;',
    'if (galaxyKey !== null && automaticWormholeTraversalLatch !== galaxyKey) {',
    'automaticWormholeTraversalLatch = galaxyKey;',
    'beginWormholeTraversal(nav);',
  ])) errors.push('automatic-travel-latches');
  if (!transitions.includes(
    '        automaticWormholeTraversalLatch = galaxyKey;\n'
      + '        beginWormholeTraversal(nav);\n'
      + '      }\n'
      + '      return;\n'
      + '    }\n'
      + '    automaticWormholeTraversalLatch = null;',
  )) errors.push('automatic-travel-latches');
  if (occurrences(transitions, "descendGalaxy(best, 'zoom');") !== 1
    || occurrences(transitions, 'beginWormholeTraversal(nav);') !== 1) {
    errors.push('automatic-travel-cardinality');
  }
  return [...new Set(errors)];
}

describe('Arc 9 atomic Travel Main wiring', () => {
  it('joins production galaxy and worm routes to one guarded F4 owner while retaining inspection', () => {
    expect(wiringErrors(source)).toEqual([]);
  });

  it('negative-controls read-only/Training inspection and post-heartbeat authority', () => {
    const noTrainingInspection = replaceOnce(
      source,
      '    || trainingCheckpointWriteHeld || trainingActive();',
      ';',
    );
    expect(wiringErrors(noTrainingInspection)).toContain(
      'inspection-fence:trainingCheckpointWriteHeld',
    );

    const owner = section(
      source,
      'async function settleArc9DirectTravel(',
      '\nasync function runArc9AtlasFavoriteChange(',
    );
    const oneTrainingFence = replaceOnce(
      owner,
      '      || trainingCheckpointWriteHeld || trainingActive() || ecologyEpochBlocksActions()',
      '      || ecologyEpochBlocksActions()',
    );
    expect(wiringErrors(source.replace(owner, oneTrainingFence))).toContain(
      'post-heartbeat-fence:trainingCheckpointWriteHeld',
    );

    const noNavRecheck = replaceOnce(
      owner,
      '      || nav !== sourceNav || !authorityStillValid()) {',
      ') {',
    );
    expect(wiringErrors(source.replace(owner, noNavRecheck))).toContain('travel-owner-order');
  });

  it('negative-controls one-CAS publication without optimism, retry, or a second refresh', () => {
    const owner = section(
      source,
      'async function settleArc9DirectTravel(',
      '\nasync function runArc9AtlasFavoriteChange(',
    );
    const optimistic = replaceOnce(
      owner,
      '    outcome = acceptedSavedView === undefined',
      '    publishNavigation();\n    outcome = acceptedSavedView === undefined',
    );
    expect(wiringErrors(source.replace(owner, optimistic))).toContain(
      'optimistic-travel:publishNavigation();',
    );

    const secondRefresh = replaceOnce(
      owner,
      '    actionClaim.settle(durable);',
      '    actionClaim.settle(durable);\n    if (durable) queueArc9ProgressionRefresh(actionClaim.operation);',
    );
    expect(wiringErrors(source.replace(owner, secondRefresh))).toContain('one-cas-no-refresh');

    const checkpointBlind = replaceOnce(
      owner,
      '        || JSON.stringify(checkpoint.savedView) !== JSON.stringify(outcome.successor.savedView)) {',
      ') {',
    );
    expect(wiringErrors(source.replace(owner, checkpointBlind))).toContain(
      'travel-checkpoint:JSON.stringify(checkpoint.savedView) !== JSON.stringify(outcome.successor.savedView)',
    );
  });

  it('negative-controls production bypasses and preserves the synchronous evidence shim', () => {
    const descent = section(
      source,
      'function resolveGalaxyDescent(',
      '\nfunction descendSystem(',
    );
    const productionStart = descent.indexOf('function descendGalaxy(');
    const production = productionStart >= 0 ? descent.slice(productionStart) : '';
    const directBypass = replaceOnce(
      production,
      "  void settleArc9DirectTravel(\n    'galaxy-arrival',\n    accepted,\n    sourceNav,\n    () => publishGalaxyDescent(accepted, true),\n  );",
      '  publishGalaxyDescent(accepted, true);',
    );
    expect(wiringErrors(source.replace(production, directBypass))).toContain(
      'production-galaxy-owner',
    );

    const wrongDiagnostic = replaceOnce(
      source,
      '      descendGalaxy: descendGalaxyForEvidence,',
      '      descendGalaxy,',
    );
    expect(wiringErrors(wrongDiagnostic)).toContain('evidence-api-shim');

    const asyncDiagnostic = replaceOnce(
      source,
      'function descendGalaxyForEvidence(g:',
      'async function descendGalaxyForEvidence(g:',
    );
    expect(wiringErrors(asyncDiagnostic)).toContain('synchronous-evidence-descent');
  });

  it('negative-controls automatic galaxy/worm retry latches', () => {
    const transitions = section(
      source,
      'function checkTransitions(): void {',
      '\nfunction zoomLimits(): [number, number] {',
    );
    const wormRetry = replaceOnce(
      transitions,
      '      if (galaxyKey !== null && automaticWormholeTraversalLatch !== galaxyKey) {',
      '      if (galaxyKey !== null) {',
    );
    expect(wiringErrors(source.replace(transitions, wormRetry))).toContain(
      'automatic-travel-latches',
    );

    const latchAfterAttempt = replaceOnce(
      transitions,
      '        automaticWormholeTraversalLatch = galaxyKey;\n        beginWormholeTraversal(nav);',
      '        beginWormholeTraversal(nav);\n        automaticWormholeTraversalLatch = galaxyKey;',
    );
    expect(wiringErrors(source.replace(transitions, latchAfterAttempt))).toContain(
      'automatic-travel-latches',
    );

    const descent = section(
      source,
      'function resolveGalaxyDescent(',
      '\nfunction descendSystem(',
    );
    const zoomRetry = replaceOnce(
      descent,
      '    if (automaticGalaxyArrivalLatch === galaxyKey) return false;',
      '    /* negative control retries the same zoom arrival */',
    );
    expect(wiringErrors(source.replace(descent, zoomRetry))).toContain(
      'production-galaxy-owner',
    );
  });
});
