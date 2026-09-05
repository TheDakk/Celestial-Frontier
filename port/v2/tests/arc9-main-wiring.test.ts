import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const mainSource = fs.readFileSync(path.join(here, '../apps/game/src/main.ts'), 'utf8');

function section(source: string, startText: string, endText: string): string {
  const start = source.indexOf(startText);
  const end = source.indexOf(endText, start);
  return start >= 0 && end > start ? source.slice(start, end) : '';
}

function replaceExact(source: string, needle: string, replacement: string): string {
  if (source.split(needle).length !== 2) throw new Error(`Arc 9 mutation target is not exact: ${needle}`);
  return source.replace(needle, replacement);
}

function replaceInSectionExact(
  source: string,
  startText: string,
  endText: string,
  needle: string,
  replacement: string,
): string {
  const body = section(source, startText, endText);
  if (body.length === 0 || body.split(needle).length !== 2) {
    throw new Error(`Arc 9 section mutation target is not exact: ${startText} :: ${needle}`);
  }
  return source.replace(body, body.replace(needle, replacement));
}

function arc9MainErrors(source: string): string[] {
  const errors: string[] = [];
  for (const [needle, label] of [
    ["from './arc9-progression-action.js';", 'progression action import'],
    ["from './progression-ceremony.js';", 'progression ceremony import'],
    ["from './records-rank-model.js';", 'Records model import'],
    ["from './records-rank-panel.js';", 'Records panel import'],
  ] as const) if (!source.includes(needle)) errors.push(`missing ${label}`);

  const records = section(source, 'function fillRecords(): void {', '\n/* THE STAR ATLAS');
  if (!records.includes('projectArc9RecordsRankReadModelV1(save)')
    || !records.includes('renderArc9RecordsRankPanelV1(rankProjection.model)')) {
    errors.push('Records does not render the exact Arc 9 model');
  }
  if (records.includes('commitArc9ProgressionRefreshV1(')) {
    errors.push('opening Records mutates progression');
  }

  const queue = section(source, 'function queueArc9ProgressionRefresh(', '\nasync function runArc9ProgressionRefresh(');
  if (!queue.includes('operation === ARC9_PROGRESSION_REFRESH_OPERATION_V1')) {
    errors.push('progression refresh can recursively queue itself');
  }
  if (!queue.includes('queueMicrotask(') || !queue.includes('arc9ProgressionRefreshQueued')) {
    errors.push('progression follow-up lacks one bounded coalesced queue');
  }

  const run = section(source, 'async function runArc9ProgressionRefresh(', '\nlet smokeRejectNextArc3ActionStorage');
  const claim = run.indexOf('productActionCoordinator.tryClaim(ARC9_PROGRESSION_REFRESH_OPERATION_V1)');
  const hold = run.indexOf('await smokeProductActionHold.holdIfArmed(actionClaim.operation);');
  const heartbeat = run.indexOf('await settleF4Heartbeat();');
  const commit = run.indexOf('await commitArc9ProgressionRefreshV1({');
  const durable = run.indexOf('durable = true;', commit);
  const publishUnlocked = run.indexOf('save.unlocked = outcome.transaction.state.unlocked.slice();', durable);
  const publishBest = run.indexOf('bestRank: committedBestRank,', publishUnlocked);
  const refreshChrome = run.indexOf('updateChips();', publishBest);
  const ceremony = run.indexOf('presentProgressionCeremony({', refreshChrome);
  const settle = run.indexOf('actionClaim.settle(durable);', ceremony);
  if (!(claim >= 0 && hold > claim && heartbeat > hold && commit > heartbeat
    && durable > commit && publishUnlocked > durable && publishBest > publishUnlocked
    && refreshChrome > publishBest && ceremony > refreshChrome && settle > ceremony)) {
    errors.push('progression claim/heartbeat/commit/verify/publication order is broken');
  }
  const ceremonyPublication = section(
    run,
    '      presentProgressionCeremony({',
    '\n      });',
  );
  if (!ceremonyPublication.includes("disposition: reason === 'boot-catch-up'")
    || !ceremonyPublication.includes("? 'boot-catch-up'")
    || !ceremonyPublication.includes('priorBestRankIndex: outcome.priorBestRankIndex')
    || !ceremonyPublication.includes('nextBestRankIndex: outcome.nextBestRankIndex')
    || !source.includes('function presentProgressionCeremony(')
    || !source.includes('function toastRankPromotion(rankName: string): void {')) {
    errors.push('durable named-rank promotion ceremony is missing or can fire on boot');
  }
  const postHeartbeatGuard = section(
    run.slice(heartbeat),
    'if (!f4RuntimeMayMutate(runtime)',
    ') {\n      lastArc9ProgressionOutcome',
  );
  for (const holdNeedle of [
    'replacementTransaction', 'replacementReloadPending', 'trainingCheckpointWriteHeld',
    'trainingActive()', 'ecologyEpochBlocksActions()',
  ]) if (!postHeartbeatGuard.includes(holdNeedle)) errors.push(`post-heartbeat guard omits ${holdNeedle}`);
  if (run.includes('save = outcome.transaction.state')) {
    errors.push('progression replaces disjoint live state');
  }
  if (!run.includes("outcome.kind === 'committed-convergence'")
    || !run.includes('scheduleF4AuthorityConvergenceReload(')) {
    errors.push('durable ambiguity does not converge read-only');
  }

  const captureRefresh = section(
    source,
    'function refreshOpenCaptureSurfaceAfterArc9Progression(',
    '\n/** Every receipt-bearing product owner settles before this follow-up can',
  );
  for (const guard of [
    'runtime !== f4Runtime', '!f4RuntimeMayAnswer(runtime)',
    'replacementTransaction', 'replacementReloadPending',
    'trainingCheckpointWriteHeld', 'trainingActive()', 'ecologyEpochBlocksActions()',
    'productActionInFlight', 'activePersist', 'productActionCoordinator.busy',
    "card.style.display === 'none'", '!surveyOwnsCurrentCaptureSurface()',
  ]) {
    if (!captureRefresh.includes(guard)) {
      errors.push(`post-progression Capture refresh omits ${guard}`);
    }
  }
  if (!captureRefresh.includes('refreshCaptureCardState();')
    || !captureRefresh.includes('currentCapturePresentationFence = null;')
    || !captureRefresh.includes('scheduleF4AuthorityConvergenceReload(')) {
    errors.push('post-progression Capture refresh does not fail closed');
  }
  const releaseProduct = run.lastIndexOf('productActionInFlight = false;');
  const settleProduct = run.indexOf('actionClaim.settle(durable);', releaseProduct);
  const clearPersist = run.indexOf(
    'if (activePersist === actionBarrier) activePersist = null;',
    settleProduct,
  );
  const refreshCapture = run.indexOf(
    'refreshOpenCaptureSurfaceAfterArc9Progression(runtime);',
    clearPersist,
  );
  if (!(releaseProduct >= 0 && settleProduct > releaseProduct
    && clearPersist > settleProduct && refreshCapture > clearPersist)) {
    errors.push('progression release does not precede guarded Capture republish');
  }
  if (!run.includes(
    '    if (activePersist === actionBarrier) activePersist = null;\n'
      + '    refreshOpenCaptureSurfaceAfterArc9Progression(runtime);',
  )) {
    errors.push('post-release Capture republish is narrowed by operation reason');
  }

  const explorerNameAction = section(
    source,
    'async function runArc9ExplorerNameChange(rawName: string): Promise<void> {',
    '\nasync function runArc9FrontierEndingChoice(requestedEndingId: string): Promise<void> {',
  );
  const frontierEndingAction = section(
    source,
    'async function runArc9FrontierEndingChoice(requestedEndingId: string): Promise<void> {',
    '\nasync function runArc9NameplateChoice(requestedChoiceIndex: number): Promise<void> {',
  );
  const starterCharterAction = section(
    source,
    'async function runStarterCharterAccept(id: StarterCharterIdV1): Promise<void> {',
    '\nasync function runArc9BinderSetClaim(setId: Arc9BinderClaimableSetIdV1): Promise<void> {',
  );
  const binderAction = section(
    source,
    'async function runArc9BinderSetClaim(setId: Arc9BinderClaimableSetIdV1): Promise<void> {',
    '\nfunction arc9TravelInspectionOnly(): boolean {',
  );
  const surveyAction = section(
    source,
    'async function settleArc9Survey(address: Arc9SurveyAddressV1): Promise<boolean> {',
    '\nasync function runArc9ExplorerNameChange(rawName: string): Promise<void> {',
  );
  const directTravelAction = section(
    source,
    'async function settleArc9DirectTravel(',
    '\nasync function runArc9AtlasFavoriteChange(',
  );
  const atlasFavoriteAction = section(
    source,
    'async function runArc9AtlasFavoriteChange(',
    '\nfunction freshCurrentBioscanReady(',
  );
  const bioscanAction = section(
    source,
    'async function runArc9Bioscan(',
    '\nasync function settleArc9Survey(',
  );
  const followAction = section(
    source,
    'async function commitArc9FollowedSearchRoute(',
    '\nconst searchTravel =',
  );
  const worldNameAction = section(
    source,
    'async function commitArc0WorldNameForSearch(',
    '\nfunction publishAcceptedSearchNavigation(',
  );
  /* Starter Charter, Binder, Bioscan/Survey, Travel, Atlas Favorite, and accepted
     Follow atomically include their event joins, aggregate refresh, and rank
     fixed point in the same receipt. World name is the composite predecessor
     of Search Travel/Follow: its adapter queues a catch-up only after a joined
     successor refuses. Adding the ordinary owner-finally queue to any of these
     creates a second receipt or starves that successor. Explorer self-rename
     and Frontier ending choice change no rank input and are also excluded. */
  for (const [label, owner] of [
    ['world-name composite predecessor', worldNameAction],
    ['Starter Charter', starterCharterAction],
    ['Binder', binderAction],
    ['Bioscan', bioscanAction],
    ['Survey', surveyAction],
    ['direct Travel', directTravelAction],
    ['Atlas Favorite', atlasFavoriteAction],
    ['accepted Follow', followAction],
    ['Frontier ending', frontierEndingAction],
  ] as const) {
    if (owner.length === 0) errors.push(`${label} progression-exempt action is missing`);
    else if (owner.includes('queueArc9ProgressionRefresh(')) {
      errors.push(`${label} queues a second progression refresh`);
    }
  }
  const landingAction = section(source, 'async function doLand(', '\nlet lastArc0AtlasOutcome:');
  const landingFollowUp = /actionClaim\.settle\(durable\);\n\s+if \(durable && durableResult === 'landed'\) \{\n\s+queueArc9ProgressionRefresh\(actionClaim\.operation\);\n\s+\}/u;
  if (!landingFollowUp.test(landingAction)
    || landingAction.split('queueArc9ProgressionRefresh(').length !== 2
    || landingAction.split('actionClaim.settle(durable);').length !== 2) {
    errors.push('landing progression catch-up is not restricted to one durable landed result');
  }
  const progressionOwnerSource = source
    .replace(landingAction, '')
    .replace(explorerNameAction, '')
    .replace(frontierEndingAction, '')
    .replace(starterCharterAction, '')
    .replace(binderAction, '')
    .replace(bioscanAction, '')
    .replace(surveyAction, '')
    .replace(directTravelAction, '')
    .replace(atlasFavoriteAction, '')
    .replace(followAction, '')
    .replace(worldNameAction, '');
  const settleMatches = [...progressionOwnerSource.matchAll(
    /actionClaim\.settle\(durable\);\n\s+if \(durable\) queueArc9ProgressionRefresh\(actionClaim\.operation\);/gu,
  )].length;
  const rawSettles = [...progressionOwnerSource.matchAll(/actionClaim\.settle\(durable\);/gu)].length;
  if (settleMatches !== rawSettles || rawSettles + 1 < 10) {
    errors.push('one or more durable product owners do not schedule progression catch-up');
  }

  const boot = section(source, 'initTraining({', '\n}\n\n/* ---- boot ---- */');
  if (!(boot.indexOf('initTraining({') >= 0
    && boot.indexOf("await runArc9ProgressionRefresh('boot-catch-up');") > boot.indexOf('initTraining({')
    && boot.includes('!trainingRecoveryLock')
    && boot.includes('!trainingCheckpointWriteHeld')
    && boot.includes('!trainingActive()'))) {
    errors.push('boot catch-up is missing or can mutate Training');
  }

  const landingPublish = section(source, 'function publishArc0LandingFields(', '\nasync function doLand(');
  if (!landingPublish.includes(
    'if (facts.achievement !== null || facts.starterCharters.changed) {\n'
      + '    save.unlocked = committed.unlocked.slice();\n'
      + '  }',
  )) {
    errors.push('verified Earth landing achievement is not published');
  }
  const naming = section(source, 'async function commitArc0WorldNameForSearch(', '\nconst searchTravel =');
  const namingCommitted = naming.indexOf("if (attempt.kind === 'committed-convergence')");
  const namingUnlocked = naming.indexOf('save.unlocked = attempt.transaction.state.unlocked.slice();');
  if (!(namingCommitted >= 0 && namingUnlocked > namingCommitted)) {
    errors.push('verified naming achievement is not published after commit');
  }

  const chips = section(source, 'function updateChips(): void {', '\nfunction hudText(): void {');
  if (!chips.includes('projectArc9RecordsRankReadModelV1(save)')
    || !chips.includes('nameplateHue: rankProjection.model.rank.nameplateHue')
    || !chips.includes('nameplateIridescent: rankProjection.model.rank.nameplateIridescent')) {
    errors.push('durable rank/nameplate projection is absent from chrome');
  }
  return errors;
}

describe('Arc 9 Main/Records integration', () => {
  it('keeps aggregate refresh receipt-bearing, nonoptimistic, Training-safe, and player-visible', () => {
    expect(arc9MainErrors(mainSource)).toEqual([]);
  });

  it('negative-controls recursion, post-heartbeat Training, Capture republish, publication, and Records-open mutation', () => {
    expect(arc9MainErrors(replaceExact(
      mainSource,
      'operation === ARC9_PROGRESSION_REFRESH_OPERATION_V1',
      'operation === "some-other-operation"',
    ))).toContain('progression refresh can recursively queue itself');

    expect(arc9MainErrors(replaceExact(
      mainSource,
      '      || trainingActive() || ecologyEpochBlocksActions()) {\n      lastArc9ProgressionOutcome = `${reason}:authority-changed`;',
      '      || ecologyEpochBlocksActions()) {\n      lastArc9ProgressionOutcome = `${reason}:authority-changed`;',
    ))).toContain('post-heartbeat guard omits trainingActive()');

    expect(arc9MainErrors(replaceExact(
      mainSource,
      '      save.unlocked = outcome.transaction.state.unlocked.slice();',
      '      // mutation control omits unlocked publication',
    ))).toContain('progression claim/heartbeat/commit/verify/publication order is broken');

    expect(arc9MainErrors(replaceInSectionExact(
      mainSource,
      'function refreshOpenCaptureSurfaceAfterArc9Progression(',
      '\n/** Every receipt-bearing product owner settles before this follow-up can',
      ' || productActionCoordinator.busy',
      '',
    ))).toContain('post-progression Capture refresh omits productActionCoordinator.busy');

    expect(arc9MainErrors(replaceInSectionExact(
      mainSource,
      'function refreshOpenCaptureSurfaceAfterArc9Progression(',
      '\n/** Every receipt-bearing product owner settles before this follow-up can',
      ' || replacementTransaction || replacementReloadPending',
      ' || replacementTransaction',
    ))).toContain('post-progression Capture refresh omits replacementReloadPending');

    expect(arc9MainErrors(replaceInSectionExact(
      mainSource,
      'async function runArc9ProgressionRefresh(',
      '\nlet smokeRejectNextArc3ActionStorage',
      '    if (activePersist === actionBarrier) activePersist = null;\n'
        + '    refreshOpenCaptureSurfaceAfterArc9Progression(runtime);',
      '    refreshOpenCaptureSurfaceAfterArc9Progression(runtime);\n'
        + '    if (activePersist === actionBarrier) activePersist = null;',
    ))).toContain('progression release does not precede guarded Capture republish');

    expect(arc9MainErrors(replaceInSectionExact(
      mainSource,
      'async function runArc9ProgressionRefresh(',
      '\nlet smokeRejectNextArc3ActionStorage',
      '    refreshOpenCaptureSurfaceAfterArc9Progression(runtime);',
      "    if (reason.startsWith('after:arc4.capture.')) {\n"
        + '      refreshOpenCaptureSurfaceAfterArc9Progression(runtime);\n'
        + '    }',
    ))).toContain('post-release Capture republish is narrowed by operation reason');

    expect(arc9MainErrors(replaceInSectionExact(
      mainSource,
      'function refreshOpenCaptureSurfaceAfterArc9Progression(',
      '\n/** Every receipt-bearing product owner settles before this follow-up can',
      '    scheduleF4AuthorityConvergenceReload(',
      '    void String(error);\n    void (',
    ))).toContain('post-progression Capture refresh does not fail closed');

    expect(arc9MainErrors(replaceExact(
      mainSource,
      "        disposition: reason === 'boot-catch-up'\n          ? 'boot-catch-up'\n          : 'committed-publication',",
      "        disposition: 'committed-publication',",
    ))).toContain('durable named-rank promotion ceremony is missing or can fire on boot');

    expect(arc9MainErrors(replaceExact(
      mainSource,
      '  const rankProjection = projectArc9RecordsRankReadModelV1(save);\n  const rank =',
      '  void commitArc9ProgressionRefreshV1({} as never);\n  const rankProjection = projectArc9RecordsRankReadModelV1(save);\n  const rank =',
    ))).toContain('opening Records mutates progression');

    expect(arc9MainErrors(replaceInSectionExact(
      mainSource,
      'async function commitArc9FollowedSearchRoute(',
      '\nconst searchTravel =',
      '    actionClaim.settle(durable);',
      '    actionClaim.settle(durable);\n    if (durable) queueArc9ProgressionRefresh(actionClaim.operation);',
    ))).toContain('accepted Follow queues a second progression refresh');

    expect(arc9MainErrors(replaceInSectionExact(
      mainSource,
      'async function commitArc0WorldNameForSearch(',
      '\nfunction publishAcceptedSearchNavigation(',
      '    actionClaim.settle(durable);',
      '    actionClaim.settle(durable);\n    if (durable) queueArc9ProgressionRefresh(actionClaim.operation);',
    ))).toContain('world-name composite predecessor queues a second progression refresh');

    expect(arc9MainErrors(replaceInSectionExact(
      mainSource,
      'async function runArc9AtlasFavoriteChange(',
      '\nfunction freshCurrentBioscanReady(',
      '    actionClaim.settle(durable);',
      '    actionClaim.settle(durable);\n    if (durable) queueArc9ProgressionRefresh(actionClaim.operation);',
    ))).toContain('Atlas Favorite queues a second progression refresh');

    expect(arc9MainErrors(replaceInSectionExact(
      mainSource,
      'async function runStarterCharterAccept(id: StarterCharterIdV1): Promise<void> {',
      '\nasync function runArc9BinderSetClaim(setId: Arc9BinderClaimableSetIdV1): Promise<void> {',
      '    actionClaim.settle(durable);',
      '    actionClaim.settle(durable);\n    if (durable) queueArc9ProgressionRefresh(actionClaim.operation);',
    ))).toContain('Starter Charter queues a second progression refresh');

    expect(arc9MainErrors(replaceInSectionExact(
      mainSource,
      'async function runArc9BinderSetClaim(setId: Arc9BinderClaimableSetIdV1): Promise<void> {',
      '\nfunction arc9TravelInspectionOnly(): boolean {',
      '    actionClaim.settle(durable);',
      '    actionClaim.settle(durable);\n    if (durable) queueArc9ProgressionRefresh(actionClaim.operation);',
    ))).toContain('Binder queues a second progression refresh');

    expect(arc9MainErrors(replaceInSectionExact(
      mainSource,
      'async function runArc9FrontierEndingChoice(requestedEndingId: string): Promise<void> {',
      '\nasync function runArc9NameplateChoice(requestedChoiceIndex: number): Promise<void> {',
      '    actionClaim.settle(durable);',
      '    actionClaim.settle(durable);\n    if (durable) queueArc9ProgressionRefresh(actionClaim.operation);',
    ))).toContain('Frontier ending queues a second progression refresh');

    for (const replacement of [
      'if (durable) {',
      "if (durable && durableResult === 'wave-off') {",
      "if (durableResult === 'landed') {",
    ]) {
      expect(arc9MainErrors(replaceInSectionExact(
        mainSource, 'async function doLand(', '\nlet lastArc0AtlasOutcome:',
        "if (durable && durableResult === 'landed') {", replacement,
      ))).toContain('landing progression catch-up is not restricted to one durable landed result');
    }
    expect(arc9MainErrors(replaceInSectionExact(
      mainSource, 'async function doLand(', '\nlet lastArc0AtlasOutcome:',
      '      queueArc9ProgressionRefresh(actionClaim.operation);',
      '      // mutation omits the landed successor refresh',
    ))).toContain('landing progression catch-up is not restricted to one durable landed result');

    expect(arc9MainErrors(replaceInSectionExact(
      mainSource,
      'function publishArc0LandingFields(',
      '\nasync function doLand(',
      'if (facts.achievement !== null || facts.starterCharters.changed) {',
      'if (facts.starterCharters.changed) {',
    ))).toContain('verified Earth landing achievement is not published');
  });
});
