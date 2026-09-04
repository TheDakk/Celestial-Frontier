import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const mainSource = readFileSync(
  fileURLToPath(new URL('../apps/game/src/main.ts', import.meta.url)),
  'utf8',
);

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

function replaceInSectionExact(
  source: string,
  startNeedle: string,
  endNeedle: string,
  needle: string,
  replacement: string,
): string {
  const owner = section(source, startNeedle, endNeedle);
  if (owner === '') throw new Error(`missing Atlas mutation-control section: ${startNeedle}`);
  if (occurrences(owner, needle) !== 1) {
    throw new Error(`Atlas mutation target is not unique in ${startNeedle}: ${needle}`);
  }
  return source.replace(owner, owner.replace(needle, replacement));
}

const FILL_START = 'function fillAtlas(): void {';
const FILL_END = "\ndocument.getElementById('atlaspanel')!.addEventListener";
const HANDLER_START = "document.getElementById('atlaspanel')!.addEventListener('click', async (event) => {";
const HANDLER_END = '\n});\n/* CHARTERS —';
const HOME_START = 'async function runArc9AtlasHomeChange(atlasId: string, desired: boolean): Promise<boolean> {';
const HOME_END = '\nasync function runArc9AtlasRemove(';
const REMOVE_START = 'async function runArc9AtlasRemove(atlasId: string): Promise<boolean> {';
const REMOVE_END = '\nasync function runArc9AtlasUndo(';
const UNDO_START = 'async function runArc9AtlasUndo(): Promise<boolean> {';
const UNDO_END = '\nasync function runArc9AtlasFavoriteChange(';
const FAVORITE_START = 'async function runArc9AtlasFavoriteChange(';
const FAVORITE_END = '\nfunction freshCurrentBioscanReady(';
const ADD_START = 'async function addToAtlas(): Promise<boolean> {';
const ADD_END = "\ncard.addEventListener('click'";

function atlasProjectionErrors(main: string): string[] {
  const errors: string[] = [];
  const panelImport = section(
    main,
    'import {\n  projectStarAtlasV1,',
    "} from './star-atlas-panel.js';",
  );
  for (const binding of [
    'renderStarAtlasV1,',
    'STAR_ATLAS_FILTERS_V1,',
    'STAR_ATLAS_VIEWS_V1,',
    'type StarAtlasFilterV1,',
    'type StarAtlasViewV1,',
  ]) if (!panelImport.includes(binding)) errors.push(`panel-import:${binding}`);

  const fill = section(main, FILL_START, FILL_END);
  if (!ordered(fill, [
    'const routeDestinations: Array<readonly [string, number, number]> = [];',
    'for (const [id, entry] of save.logMap) {',
    'const route = atlasRouteStates.get(entry);',
    'if (route?.gal !== null && route?.gal !== undefined) {',
    'routeDestinations.push(Object.freeze([id, route.gal.x, route.gal.y]));',
    'const identityCurrent = worldIdentityProtection === null',
    'const combat = f4Runtime === null',
    "const combatCurrent = combat?.kind === 'loaded';",
    'const projection = projectStarAtlasV1({',
    'state: save,',
    'view: arc9AtlasView,',
    'filter: arc9AtlasFilter,',
    'routeDestinations,',
    'landedWorldKeys: identityCurrent',
    '? worldIdentityState.records.filter((record) => record.landed).map((record) => record.key)',
    "conqueredWorldKeys: combatCurrent",
    '? combat.authority.conquests.map((record) => record.worldKey)',
    "currentGalaxy: nav.mode === 'universe' ? null",
    "fillPanel('atlas', renderStarAtlasV1(projection, {",
  ])) errors.push('exact-read-projection');
  if (occurrences(fill, 'atlasRouteStates.get(entry)') !== 1
    || occurrences(fill, 'projectStarAtlasV1({') !== 1
    || occurrences(fill, 'renderStarAtlasV1(projection, {') !== 1
    || fill.includes('entry.where') || fill.includes('save.landed')
    || fill.includes('save.conquered') || fill.includes('navToView(')) {
    errors.push('projection-authority-alias');
  }
  if (!fill.includes("      : [''],\n    conqueredWorldKeys:")
    || !fill.includes("      : [''],\n    currentGalaxy:")) {
    errors.push('uncurrent-authority-not-protected');
  }
  if (!fill.includes("let arc9AtlasView: StarAtlasViewV1 = 'list';")
    && !main.includes("let arc9AtlasView: StarAtlasViewV1 = 'list';")) {
    errors.push('list-default');
  }
  if (!main.includes("let arc9AtlasFilter: StarAtlasFilterV1 = 'all';")) {
    errors.push('all-filter-default');
  }
  return errors;
}

function atlasDispatchErrors(main: string): string[] {
  const errors: string[] = [];
  const handler = section(main, HANDLER_START, HANDLER_END);
  if (!ordered(handler, [
    "event.target.closest<HTMLButtonElement>('[data-atlas-view]')",
    'STAR_ATLAS_VIEWS_V1.includes(value as StarAtlasViewV1)',
    'arc9AtlasView = value as StarAtlasViewV1;',
    "event.target.closest<HTMLButtonElement>('[data-atlas-filter]')",
    'STAR_ATLAS_FILTERS_V1.includes(value as StarAtlasFilterV1)',
    'arc9AtlasFilter = value as StarAtlasFilterV1;',
    "event.target.closest<HTMLButtonElement>('[data-atlas-undo]')",
    'void runArc9AtlasUndo();',
    "event.target.closest<HTMLButtonElement>('[data-atlas-favorite]')",
    'void runArc9AtlasFavoriteChange(atlasId, !hit[1].fav);',
    "event.target.closest<HTMLButtonElement>('[data-atlas-home]')",
    'void runArc9AtlasHomeChange(atlasId, save.homeId !== atlasId);',
    "event.target.closest<HTMLButtonElement>('[data-atlas-remove]')",
    'void runArc9AtlasRemove(atlasId);',
    "'[data-atlas-travel],[data-atlas-travel-home]',",
    'const route = atlasRouteStates.get(hit[1]);',
    'const moved = await searchTravel.jumpToProvenNav(route);',
  ])) errors.push('semantic-control-dispatch');
  for (const dispatch of [
    'void runArc9AtlasUndo();',
    'void runArc9AtlasHomeChange(atlasId, save.homeId !== atlasId);',
    'void runArc9AtlasRemove(atlasId);',
  ]) if (occurrences(handler, dispatch) !== 1) errors.push(`dispatch-once:${dispatch}`);
  if (handler.includes('.where') || handler.includes('[data-aid]')
    || handler.includes('[data-lvw]') || handler.includes('[data-filt]')) {
    errors.push('compatibility-dispatch-alias');
  }

  const readOnly = section(
    main,
    'const READ_ONLY_MUTATION_SELECTOR = [',
    "\n].join(',');",
  );
  for (const selector of [
    "'[data-atlas-favorite]'",
    "'[data-atlas-home]'",
    "'[data-atlas-remove]'",
    "'[data-atlas-undo]'",
  ]) if (!readOnly.includes(selector)) errors.push(`read-only:${selector}`);
  return errors;
}

function atlasActionErrors(main: string): string[] {
  const errors: string[] = [];
  const actionImport = section(
    main,
    'import {\n  commitArc9AtlasHomeV1,',
    "} from './arc9-atlas-row-actions.js';",
  );
  for (const binding of [
    'commitArc9AtlasRemoveV1,', 'commitArc9AtlasUndoV1,',
    'operationForArc9AtlasHomeV1,', 'operationForArc9AtlasRemoveV1,',
    'operationForArc9AtlasUndoV1,', 'publishArc9AtlasHomeFieldsV1,',
    'publishArc9AtlasRemoveFieldsV1,', 'publishArc9AtlasUndoFieldsV1,',
    'type Arc9AtlasDeleteReceiptV1,',
  ]) if (!actionImport.includes(binding)) errors.push(`action-import:${binding}`);

  const home = section(main, HOME_START, HOME_END);
  if (!ordered(home, [
    'const targetPair = targetIndex < 0 ? null : save.logMap[targetIndex] ?? null;',
    'const targetEntry = targetPair[1];',
    'const priorHomeId = save.homeId;',
    'const priorRoute = atlasRouteStates.get(targetEntry);',
    'const actionClaim = productActionCoordinator.tryClaim(operation);',
    'clearArc9AtlasUndo();',
    'await smokeProductActionHold.holdIfArmed(actionClaim.operation);',
    'await settleF4Heartbeat();',
    'save.logMap[targetIndex] !== targetPair || targetPair[1] !== targetEntry',
    'const outcome = await commitArc9AtlasHomeV1({',
    'durable = true;',
    'const checkpoint = runtime.checkpointParent();',
    'publishArc9AtlasHomeFieldsV1(save, outcome);',
    'if (save.logMap[targetIndex] !== targetPair\n'
      + '        || targetPair[1] !== targetEntry\n'
      + '        || atlasRouteStates.get(targetEntry) !== priorRoute)',
    'actionClaim.settle(durable);',
  ])) errors.push('home-fixed-point-order');
  const homeBeforeCommit = section(home, HOME_START, 'const outcome = await commitArc9AtlasHomeV1({');
  if (homeBeforeCommit.includes('save.homeId =')
    || occurrences(home, 'commitArc9AtlasHomeV1({') !== 1
    || occurrences(home, 'publishArc9AtlasHomeFieldsV1(save, outcome);') !== 1) {
    errors.push('home-one-cas-no-optimism');
  }

  const remove = section(main, REMOVE_START, REMOVE_END);
  if (!ordered(remove, [
    'const targetPair = targetIndex < 0 ? null : save.logMap[targetIndex] ?? null;',
    'const targetEntry = targetPair[1];',
    'const priorRows = save.logMap.slice();',
    'const priorRoutes = priorRows.map(([, entry]) => atlasRouteStates.get(entry));',
    'const retainedRoute = atlasRouteStates.get(targetEntry) ?? null;',
    'const actionClaim = productActionCoordinator.tryClaim(operation);',
    'clearArc9AtlasUndo();',
    'await smokeProductActionHold.holdIfArmed(actionClaim.operation);',
    'await settleF4Heartbeat();',
    'priorRows.some((pair, index) => save.logMap[index] !== pair)',
    'const outcome = await commitArc9AtlasRemoveV1({',
    'durable = true;',
    'const checkpoint = runtime.checkpointParent();',
    'publishArc9AtlasRemoveFieldsV1(save, outcome);',
    'const survivors = priorRows.filter((_, index) => index !== targetIndex);',
    'survivors.some((pair, index) => save.logMap[index] !== pair)',
    'retainedAtlasRouteMatches(targetPair, retainedRoute)',
    'receipt: outcome.undoReceipt,',
    'pair: targetPair,',
    'route: retainedRoute,',
    'expiresAt: performance.now() + 8_000,',
    'arc9AtlasUndo = undo;',
    'actionClaim.settle(durable);',
  ])) errors.push('remove-fixed-point-order');
  const removeBeforeCommit = section(
    remove,
    REMOVE_START,
    'const outcome = await commitArc9AtlasRemoveV1({',
  );
  if (removeBeforeCommit.includes('save.logMap.splice(')
    || removeBeforeCommit.includes('save.logMap =')
    || occurrences(remove, 'commitArc9AtlasRemoveV1({') !== 1
    || occurrences(remove, 'publishArc9AtlasRemoveFieldsV1(save, outcome);') !== 1) {
    errors.push('remove-one-cas-no-optimism');
  }

  const undo = section(main, UNDO_START, UNDO_END);
  if (!main.includes('route: NavState | null;')
    || !main.includes('return route === null ? current === undefined : current === route;')) {
    errors.push('route-or-absence-receipt');
  }
  if (!ordered(undo, [
    'const undo = liveArc9AtlasUndo();',
    'operation = operationForArc9AtlasUndoV1(undo.receipt);',
    'const actionClaim = productActionCoordinator.tryClaim(operation);',
    'const sourceStateJson = JSON.stringify(save);',
    'await smokeProductActionHold.holdIfArmed(actionClaim.operation);',
    'await settleF4Heartbeat();',
    'arc9AtlasUndo !== undo || performance.now() >= undo.expiresAt',
    '!retainedAtlasRouteMatches(undo.pair, undo.route)',
    'JSON.stringify(save) !== sourceStateJson',
    'const outcome = await commitArc9AtlasUndoV1({',
    'deleteReceipt: undo.receipt,',
    'durable = true;',
    'const checkpoint = runtime.checkpointParent();',
    'JSON.stringify(checkpointPair) !== outcome.plan.removedPairJson\n'
      + '        || !retainedAtlasRouteMatches(undo.pair, undo.route)',
    'publishArc9AtlasUndoFieldsV1(save, outcome, undo.pair);',
    'if (save.logMap[outcome.plan.targetIndex] !== undo.pair\n'
      + '        || !retainedAtlasRouteMatches(undo.pair, undo.route))',
    "throw new Error('Atlas Undo did not restore the exact route-owning pair');\n"
      + '      }\n      clearArc9AtlasUndo();',
    'actionClaim.settle(durable);',
  ])) errors.push('undo-fixed-point-order');
  const undoBeforeCommit = section(
    undo,
    UNDO_START,
    'const outcome = await commitArc9AtlasUndoV1({',
  );
  if (undoBeforeCommit.includes('save.logMap.splice(')
    || undoBeforeCommit.includes('save.logMap =')
    || occurrences(undo, 'commitArc9AtlasUndoV1({') !== 1
    || occurrences(undo, 'publishArc9AtlasUndoFieldsV1(save, outcome, undo.pair);') !== 1) {
    errors.push('undo-one-cas-no-optimism');
  }
  return errors;
}

function atlasLifecycleErrors(main: string): string[] {
  const errors: string[] = [];
  const live = section(main, 'function liveArc9AtlasUndo()', '\nfunction atlasMutationsAvailable()');
  if (!live.includes('performance.now() >= undo.expiresAt')
    || !live.includes('!retainedAtlasRouteMatches(undo.pair, undo.route)')
    || !live.includes('clearArc9AtlasUndo();')) errors.push('undo-live-expiry');

  for (const [label, start, end] of [
    ['home', HOME_START, HOME_END],
    ['remove', REMOVE_START, REMOVE_END],
    ['favorite', FAVORITE_START, FAVORITE_END],
    ['add', ADD_START, ADD_END],
  ] as const) {
    const owner = section(main, start, end);
    const claim = owner.indexOf('const actionClaim = productActionCoordinator.tryClaim(operation);');
    const clear = owner.indexOf('clearArc9AtlasUndo();', claim);
    const commit = owner.indexOf('commitArc', claim);
    if (!(claim >= 0 && clear > claim && commit > clear)) errors.push(`next-mutation:${label}`);
  }

  const replacement = 'atlasRouteStates = prepared.atlasRoutes;';
  const replaceAt = main.indexOf(replacement);
  const replacementPrelude = replaceAt < 0 ? '' : main.slice(Math.max(0, replaceAt - 240), replaceAt);
  if (!replacementPrelude.includes('clearArc9AtlasUndo();')) {
    errors.push('live-route-replacement-clears-undo');
  }
  const convergence = section(
    main,
    'function scheduleF4AuthorityConvergenceReload(',
    '\nfunction scheduleReplacementReload(',
  );
  if (!convergence.includes('clearArc9AtlasUndo();')) {
    errors.push('convergence-clears-undo');
  }
  const remove = section(main, REMOVE_START, REMOVE_END);
  if (!remove.includes('window.setTimeout(() => {')
    || !remove.includes('if (arc9AtlasUndo === undo && performance.now() >= undo.expiresAt)')
    || !remove.includes('}, 8_050);')) errors.push('bounded-undo-window');
  return errors;
}

function wiringErrors(main: string): string[] {
  return [...new Set([
    ...atlasProjectionErrors(main),
    ...atlasDispatchErrors(main),
    ...atlasActionErrors(main),
    ...atlasLifecycleErrors(main),
  ])];
}

describe('mature Star Atlas Main wiring', () => {
  it('projects exact current authorities and dispatches every semantic Atlas control', () => {
    expect(wiringErrors(mainSource)).toEqual([]);
  });

  it('negative-controls route, world-identity, and combat authority aliases', () => {
    const routeAlias = replaceInSectionExact(
      mainSource,
      FILL_START,
      FILL_END,
      '    const route = atlasRouteStates.get(entry);',
      '    const route = entry.where as NavState;',
    );
    const landedSeedAlias = replaceInSectionExact(
      mainSource,
      FILL_START,
      FILL_END,
      '? worldIdentityState.records.filter((record) => record.landed).map((record) => record.key)',
      '? save.landed.map((seed) => String(seed))',
    );
    const conquestAlias = replaceInSectionExact(
      mainSource,
      FILL_START,
      FILL_END,
      '? combat.authority.conquests.map((record) => record.worldKey)',
      '? save.conquered.map(([seed]) => String(seed))',
    );
    expect(wiringErrors(routeAlias)).toContain('exact-read-projection');
    expect(wiringErrors(routeAlias)).toContain('projection-authority-alias');
    expect(wiringErrors(landedSeedAlias)).toContain('exact-read-projection');
    expect(wiringErrors(landedSeedAlias)).toContain('projection-authority-alias');
    expect(wiringErrors(conquestAlias)).toContain('exact-read-projection');
    expect(wiringErrors(conquestAlias)).toContain('projection-authority-alias');
  });

  it('negative-controls semantic action dispatch and read-only capture', () => {
    const lostUndo = replaceInSectionExact(
      mainSource,
      HANDLER_START,
      HANDLER_END,
      '    void runArc9AtlasUndo();',
      '    fillAtlas();',
    );
    const wrongHome = replaceInSectionExact(
      mainSource,
      HANDLER_START,
      HANDLER_END,
      'if (atlasId !== undefined) void runArc9AtlasHomeChange(atlasId, save.homeId !== atlasId);',
      'if (atlasId !== undefined) void runArc9AtlasRemove(atlasId);',
    );
    const lostCapture = mainSource.replace(
      "'[data-atlas-favorite]', '[data-atlas-home]', '[data-atlas-remove]', '[data-atlas-undo]'",
      "'[data-atlas-favorite]', '[data-atlas-home]', '[data-atlas-undo]'",
    );
    expect(lostCapture).not.toBe(mainSource);
    expect(wiringErrors(lostUndo)).toContain('semantic-control-dispatch');
    expect(wiringErrors(lostUndo)).toContain('dispatch-once:void runArc9AtlasUndo();');
    expect(wiringErrors(wrongHome)).toContain('semantic-control-dispatch');
    expect(wiringErrors(lostCapture)).toContain("read-only:'[data-atlas-remove]'");
  });

  it('negative-controls exact pair/route identity and one-level Undo lifecycle', () => {
    const clonedPair = replaceInSectionExact(
      mainSource,
      UNDO_START,
      UNDO_END,
      '      publishArc9AtlasUndoFieldsV1(save, outcome, undo.pair);',
      '      publishArc9AtlasUndoFieldsV1(save, outcome, structuredClone(undo.pair));',
    );
    const routeAbsenceAccepted = mainSource.replace(
      'return route === null ? current === undefined : current === route;',
      'return route === null ? true : current === route;',
    );
    const favoriteKeepsStaleUndo = replaceInSectionExact(
      mainSource,
      FAVORITE_START,
      FAVORITE_END,
      '  clearArc9AtlasUndo();',
      '  /* mutation control leaves the previous delete receipt live */',
    );
    expect(wiringErrors(clonedPair)).toContain('undo-fixed-point-order');
    expect(wiringErrors(clonedPair)).toContain('undo-one-cas-no-optimism');
    expect(wiringErrors(routeAbsenceAccepted)).toContain('route-or-absence-receipt');
    expect(wiringErrors(favoriteKeepsStaleUndo)).toContain('next-mutation:favorite');
  });
});
