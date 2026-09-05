import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(
  path.join(here, '..', 'apps', 'game', 'src', 'main.ts'),
  'utf8',
);
const html = fs.readFileSync(
  path.join(here, '..', 'apps', 'game', 'index.html'),
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

function cssRule(text: string, selector: string): string {
  const start = text.indexOf(selector);
  const end = text.indexOf('}', start + selector.length);
  return start >= 0 && end > start ? text.slice(start, end + 1) : '';
}

function replaceOnce(text: string, needle: string, replacement: string): string {
  if (occurrences(text, needle) !== 1) {
    throw new Error(`Atlas Favorite mutation target is not unique: ${needle}`);
  }
  return text.replace(needle, replacement);
}

function ordered(owner: string, needles: readonly string[]): boolean {
  const positions = needles.map((needle) => owner.indexOf(needle));
  return positions.every((position, index) => (
    position >= 0 && (index === 0 || position > positions[index - 1]!)
  ));
}

function wiringErrors(main: string, documentHtml: string): string[] {
  const errors: string[] = [];
  const importBlock = section(
    main,
    'import {\n  commitArc9AtlasFavoriteV1,',
    "} from './arc9-atlas-favorite-action.js';",
  );
  for (const imported of [
    'operationForArc9AtlasFavoriteV1,',
    'publishArc9AtlasFavoriteFieldsV1,',
    'type Arc9AtlasFavoriteActionOutcomeV1,',
  ]) if (!importBlock.includes(imported)) errors.push(`favorite-import:${imported}`);

  const atlas = section(
    main,
    'let arc9AtlasFavoritePendingId: string | null = null;',
    '\n/* CHARTERS —',
  );
  const render = section(atlas, 'function fillAtlas(): void {', "\ndocument.getElementById('atlaspanel')!");
  const handler = section(
    atlas,
    "document.getElementById('atlaspanel')!.addEventListener('click', async (e) => {",
    '\n});',
  );
  const favoriteBranch = section(
    handler,
    "  const favoriteButton = e.target.closest<HTMLButtonElement>('[data-atlas-favorite]');",
    "  const travelButton = e.target.closest<HTMLButtonElement>('[data-atlas-travel]');",
  );
  const travelStart = handler.indexOf(
    "  const travelButton = e.target.closest<HTMLButtonElement>('[data-atlas-travel]');",
  );
  const travelBranch = travelStart >= 0 ? handler.slice(travelStart) : '';

  if (!ordered(render, [
    'const travelable = atlasRouteStates.has(e as Record<string, unknown>);',
    'const favorite = e.fav === true;',
    'const favoriteUnavailable = arc9AtlasFavoritePendingId !== null',
    'return `<div class="centry atlas-entry"',
    "'<div class=\"atlas-entry-actions\">'",
    '`<button type="button" data-atlas-travel=',
    '`<button type="button" data-atlas-favorite=',
    "+ '</div></div>';",
  ])
    || occurrences(render, 'data-atlas-travel=') !== 1
    || occurrences(render, 'data-atlas-favorite=') !== 1
    || render.includes('return `<button type="button" class="centry"')
    || render.includes('<button type="button" class="atlas-entry-actions">')) {
    errors.push('split-sibling-controls');
  }
  if (!render.includes('data-atlas-travel="${esc(id)}" aria-label="Travel to ${esc(String(e.title || id))}"${travelable ? \'\' : \' disabled aria-disabled="true"\'}')
    || !render.includes('data-atlas-favorite="${esc(id)}" aria-pressed="${favorite}" aria-label="${favoriteLabel}: ${esc(String(e.title || id))}"${favoriteUnavailable ? \' disabled aria-disabled="true"\' : \'\'}')
    || !render.includes("const favoriteLabel = favorite ? 'Remove Favorite' : 'Mark Favorite';")) {
    errors.push('control-accessibility-state');
  }
  const favoriteAvailability = section(
    render,
    'const favoriteUnavailable =',
    ';\n        const favoriteLabel',
  );
  if (favoriteAvailability.includes('travelable')
    || favoriteAvailability.includes('atlasRouteStates')
    || !favoriteAvailability.includes('smokeForceReadOnly')
    || !favoriteAvailability.includes('trainingCheckpointWriteHeld')
    || !favoriteAvailability.includes('trainingActive()')) {
    errors.push('favorite-route-independent-availability');
  }
  if (!ordered(handler, [
    "e.target.closest<HTMLButtonElement>('[data-atlas-favorite]')",
    'void runArc9AtlasFavoriteChange(atlasId, !hit[1].fav);',
    "e.target.closest<HTMLButtonElement>('[data-atlas-travel]')",
    'const route = atlasRouteStates.get(hit[1] as Record<string, unknown>);',
    'const moved = await searchTravel.jumpToProvenNav(route);',
  ])
    || favoriteBranch.includes('atlasRouteStates')
    || favoriteBranch.includes('jumpToProvenNav')
    || favoriteBranch.includes('closePanels()')
    || handler.includes("closest('[data-aid]')")) {
    errors.push('favorite-route-independent-handler');
  }
  if (!travelBranch.includes('if (!route) return;')
    || !travelBranch.includes('if (!moved) return;')
    || !travelBranch.includes('closePanels();')) {
    errors.push('travel-control-owner');
  }

  const action = section(
    main,
    'async function runArc9AtlasFavoriteChange(',
    '\nfunction freshCurrentBioscanReady(',
  );
  if (!ordered(action, [
    'if (arc9AtlasFavoritePendingId !== null || smokeForceReadOnly',
    'operation = operationForArc9AtlasFavoriteV1(atlasId);',
    'const targetIndex = save.logMap.findIndex(([id]) => id === atlasId);',
    'const targetEntry = targetPair?.[1] ?? null;',
    'const actionClaim = productActionCoordinator.tryClaim(operation);',
  ])) errors.push('exact-operation-and-target');
  if (!ordered(action, [
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
    'actionClaim.settle(durable);',
    'arc9AtlasFavoritePendingId = null;',
  ])) errors.push('favorite-action-order');
  const focusRestore = section(
    action,
    "    if (openPanelId() === 'atlas') {\n      fillAtlas();",
    '\n    }\n  } finally',
  ) || section(
    action,
    "    if (openPanelId() === 'atlas') {\n      fillAtlas();",
    '\n    }\n  }',
  );
  if (!focusRestore.includes('fillAtlas();') || focusRestore.includes('.focus(')
    || !render.includes('capturePanelRefillFocus(')
    || !render.includes('restoreFocus();')) errors.push('focus-restoration');

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

  for (const checkpointField of [
    'runtime.revision !== outcome.transaction.revision',
    'checkpointPair?.[0] !== outcome.atlasId',
    'checkpointPair[1].fav !== outcome.favoriteAfter',
    'checkpoint.stats.bestRank !== outcome.nextBestRankIndex',
    'JSON.stringify(checkpoint.unlocked) !== JSON.stringify(outcome.nextUnlockedIds)',
  ]) if (!action.includes(checkpointField)) errors.push(`checkpoint:${checkpointField}`);

  const beforeCommit = section(
    action,
    'async function runArc9AtlasFavoriteChange(',
    'outcome = await commitArc9AtlasFavoriteV1({',
  );
  if (beforeCommit.includes('targetEntry.fav =')
    || beforeCommit.includes('save.unlocked =')
    || beforeCommit.includes('save.stats =')) errors.push('optimistic-publication');
  if (occurrences(action, 'commitArc9AtlasFavoriteV1({') !== 1
    || occurrences(action, 'publishArc9AtlasFavoriteFieldsV1(save, outcome);') !== 1
    || occurrences(action, 'actionClaim.settle(durable);') !== 1
    || action.includes('persistView(')
    || action.includes('queueArc9ProgressionRefresh(')
    || action.includes('while (')
    || action.includes('setTimeout(')) {
    errors.push('one-cas-no-retry-owner');
  }
  if (!action.includes('save.logMap[targetIndex] !== targetPair')
    || occurrences(action, 'targetPair[1] !== targetEntry') < 2
    || !action.includes('atlasRouteStates.get(targetEntry) !== priorRoute')) {
    errors.push('in-place-route-identity');
  }

  const readOnly = section(
    main,
    'const READ_ONLY_MUTATION_SELECTOR = [',
    "\n].join(',');",
  );
  if (!readOnly.includes("'[data-atlas-favorite]',")) errors.push('read-only-capture');

  const controlRule = cssRule(
    documentHtml,
    '#atlaspanel .atlas-entry-actions > button {',
  );
  if (!controlRule.includes('min-width: 44px;')
    || !controlRule.includes('min-height: 44px;')) errors.push('forty-four-pixel-controls');
  const pressedRule = cssRule(
    documentHtml,
    '#atlaspanel .atlas-entry-actions > button[aria-pressed="true"] {',
  );
  if (!pressedRule.includes('color: #ffd56a;')
    || !pressedRule.includes('border-color: #caa24f;')) errors.push('pressed-visual-state');
  return [...new Set(errors)];
}

describe('Arc 9 Atlas Favorite Main and HTML wiring', () => {
  it('owns split accessible controls and a route-independent Favorite action', () => {
    expect(wiringErrors(source, html)).toEqual([]);
  });

  it('negative-controls nested/row-wide travel and route-coupled Favorite behavior', () => {
    const nested = replaceOnce(
      source,
      "          + '<div class=\"atlas-entry-actions\">'",
      "          + '<button type=\"button\" class=\"atlas-entry-actions\">'",
    );
    expect(wiringErrors(nested, html)).toContain('split-sibling-controls');

    const rowWide = replaceOnce(
      source,
      "  const favoriteButton = e.target.closest<HTMLButtonElement>('[data-atlas-favorite]');",
      "  const row = e.target.closest('[data-aid]');\n  const favoriteButton = e.target.closest<HTMLButtonElement>('[data-atlas-favorite]');",
    );
    expect(wiringErrors(rowWide, html)).toContain('favorite-route-independent-handler');

    const routeCoupled = replaceOnce(
      source,
      '        const favoriteUnavailable = arc9AtlasFavoritePendingId !== null',
      '        const favoriteUnavailable = !travelable || arc9AtlasFavoritePendingId !== null',
    );
    expect(wiringErrors(routeCoupled, html)).toContain(
      'favorite-route-independent-availability',
    );

    const routeGateInFavorite = replaceOnce(
      source,
      '    void runArc9AtlasFavoriteChange(atlasId, !hit[1].fav);',
      '    if (!atlasRouteStates.has(hit[1])) return;\n    void runArc9AtlasFavoriteChange(atlasId, !hit[1].fav);',
    );
    expect(wiringErrors(routeGateInFavorite, html)).toContain(
      'favorite-route-independent-handler',
    );
  });

  it('negative-controls accessibility, 44px geometry, and read-only/Training fences', () => {
    const noPressed = replaceOnce(
      source,
      'data-atlas-favorite="${esc(id)}" aria-pressed="${favorite}"',
      'data-atlas-favorite="${esc(id)}"',
    );
    expect(wiringErrors(noPressed, html)).toContain('control-accessibility-state');

    const controlRule = cssRule(html, '#atlaspanel .atlas-entry-actions > button {');
    const shortRule = replaceOnce(controlRule, 'min-height: 44px;', 'min-height: 40px;');
    expect(wiringErrors(source, html.replace(controlRule, shortRule))).toContain(
      'forty-four-pixel-controls',
    );

    const writable = replaceOnce(
      source,
      "  '[data-atlas-favorite]',",
      '  /* negative control omits Atlas Favorite from read-only capture */',
    );
    expect(wiringErrors(writable, html)).toContain('read-only-capture');

    const action = section(
      source,
      'async function runArc9AtlasFavoriteChange(',
      '\nfunction freshCurrentBioscanReady(',
    );
    const oneTrainingFence = replaceOnce(
      action,
      '      || trainingCheckpointWriteHeld || trainingActive() || ecologyEpochBlocksActions()',
      '      || ecologyEpochBlocksActions()',
    );
    expect(wiringErrors(source.replace(action, oneTrainingFence), html)).toContain(
      'post-heartbeat-guard:trainingCheckpointWriteHeld',
    );
  });

  it('negative-controls heartbeat ordering, one-CAS settlement, exact checkpoint, and focus', () => {
    const action = section(
      source,
      'async function runArc9AtlasFavoriteChange(',
      '\nfunction freshCurrentBioscanReady(',
    );
    const withoutHeartbeatAction = replaceOnce(
      action,
      '    await settleF4Heartbeat();',
      '    /* negative control skips the authority heartbeat */',
    );
    const withoutHeartbeat = source.replace(action, withoutHeartbeatAction);
    expect(wiringErrors(withoutHeartbeat, html)).toContain('favorite-action-order');

    const forgedOperation = replaceOnce(
      action,
      'operation = operationForArc9AtlasFavoriteV1(atlasId);',
      "operation = 'arc9-atlas-favorite:forged';",
    );
    expect(wiringErrors(source.replace(action, forgedOperation), html)).toContain(
      'exact-operation-and-target',
    );

    const optimistic = replaceOnce(
      action,
      '    outcome = await commitArc9AtlasFavoriteV1({',
      '    targetEntry.fav = desired;\n    outcome = await commitArc9AtlasFavoriteV1({',
    );
    expect(wiringErrors(source.replace(action, optimistic), html)).toContain(
      'optimistic-publication',
    );

    const extraPersist = replaceOnce(
      action,
      '      publishArc9AtlasFavoriteFieldsV1(save, outcome);',
      '      publishArc9AtlasFavoriteFieldsV1(save, outcome);\n      void persistView();',
    );
    expect(wiringErrors(source.replace(action, extraPersist), html)).toContain(
      'one-cas-no-retry-owner',
    );

    const commitBlock = [
      '    outcome = await commitArc9AtlasFavoriteV1({',
      '      runtime,',
      '      state: save,',
      '      atlasId,',
      '      desired,',
      '      codecNow: Date.now(),',
      '    });',
    ].join('\n');
    const secondCas = replaceOnce(
      action,
      commitBlock,
      `${commitBlock}\n    void commitArc9AtlasFavoriteV1({ runtime, state: save, atlasId, desired, codecNow: Date.now() });`,
    );
    expect(wiringErrors(source.replace(action, secondCas), html)).toContain(
      'one-cas-no-retry-owner',
    );

    const checkpointBlind = replaceOnce(
      action,
      '        || checkpointPair[1].fav !== outcome.favoriteAfter',
      '        /* negative control omits exact Favorite checkpoint */',
    );
    expect(wiringErrors(source.replace(action, checkpointBlind), html)).toContain(
      'checkpoint:checkpointPair[1].fav !== outcome.favoriteAfter',
    );

    const weakMapBlind = replaceOnce(
      action,
      '        || atlasRouteStates.get(targetEntry) !== priorRoute) {',
      ') {',
    );
    expect(wiringErrors(source.replace(action, weakMapBlind), html)).toContain(
      'in-place-route-identity',
    );

    const noFocus = replaceOnce(
      action,
      "    if (openPanelId() === 'atlas') {\n      fillAtlas();",
      "    if (openPanelId() === 'atlas') {\n      fillAtlas();\n      document.body.focus();",
    );
    expect(wiringErrors(source.replace(action, noFocus), html)).toContain('focus-restoration');
  });
});
