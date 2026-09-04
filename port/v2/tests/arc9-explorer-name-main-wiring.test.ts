import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const mainSource = fs.readFileSync(path.join(here, '../apps/game/src/main.ts'), 'utf8');
const actionSource = fs.readFileSync(
  path.join(here, '../apps/game/src/arc9-explorer-name-action.ts'),
  'utf8',
);
const settingsSource = fs.readFileSync(
  path.join(here, '../apps/game/src/explorer-name-settings.ts'),
  'utf8',
);

function section(source: string, startText: string, endText: string): string {
  const start = source.indexOf(startText);
  const end = source.indexOf(endText, start);
  return start >= 0 && end > start ? source.slice(start, end) : '';
}

function replaceInSectionExact(
  source: string,
  startText: string,
  endText: string,
  needle: string,
  replacement: string,
): string {
  const start = source.indexOf(startText);
  const end = source.indexOf(endText, start);
  if (start < 0 || end <= start) throw new Error(`source section is missing: ${startText}`);
  const body = source.slice(start, end);
  if (body.split(needle).length !== 2) {
    throw new Error(`source section must contain exactly one mutation target: ${needle}`);
  }
  return source.slice(0, start) + body.replace(needle, replacement) + source.slice(end);
}

const SETTINGS_START = 'function fillSettings(): void {';
const SETTINGS_END = '\n/* ---- GUIDE + RELEASE HISTORY';
const ACTION_START = 'async function runArc9ExplorerNameChange(rawName: string): Promise<void> {';
const ACTION_END = '\nasync function runArc9FrontierEndingChoice(requestedEndingId: string): Promise<void> {';

function explorerNameMainErrors(source: string): string[] {
  const errors: string[] = [];
  for (const [needle, label] of [
    ["from './arc9-explorer-name-action.js';", 'action import'],
    ["from './explorer-name-settings.js';", 'Settings projection import'],
  ] as const) if (!source.includes(needle)) errors.push(`missing ${label}`);

  const settings = section(source, SETTINGS_START, SETTINGS_END);
  const project = settings.indexOf('projectArc9ExplorerNameSettingsV1(save)');
  const render = settings.indexOf('renderArc9ExplorerNameSettingV1(', project);
  const guard = settings.indexOf("if (explorerNameSettings.kind === 'projected')", render);
  const opener = settings.indexOf("openNameEditor.addEventListener('click'", guard);
  const submit = settings.indexOf("editor.addEventListener('submit'", opener);
  const assessment = settings.indexOf('const assessment = refreshDraft();', submit);
  const capture = settings.indexOf('const rawName = input.value;', assessment);
  const restore = settings.indexOf(
    'input.value = explorerNameSettings.model.explorerName;',
    capture,
  );
  const disable = settings.indexOf('input.disabled = true;', restore);
  const run = settings.indexOf('void runArc9ExplorerNameChange(rawName);', disable);
  if (!(project >= 0 && render > project && guard > render && opener > guard
    && submit > opener && assessment > submit && capture > assessment
    && restore > capture && disable > restore && run > disable)) {
    errors.push('Settings does not restore the durable name before its one action');
  }
  if (settings.includes('save.explorerName =')) {
    errors.push('Settings publishes a tentative explorer name optimistically');
  }

  const action = section(source, ACTION_START, ACTION_END);
  const preflight = action.indexOf('prepareArc9ExplorerNameChangeV1(save, rawName)');
  const noWriteNoop = action.indexOf("if (preflight.kind === 'noop')", preflight);
  const claim = action.indexOf(
    'productActionCoordinator.tryClaim(ARC9_EXPLORER_NAME_OPERATION_V1)',
    noWriteNoop,
  );
  const pending = action.indexOf('arc9ExplorerNamePending = true;', claim);
  const hold = action.indexOf('await smokeProductActionHold.holdIfArmed(actionClaim.operation);', pending);
  const heartbeat = action.indexOf('await settleF4Heartbeat();', hold);
  const postHeartbeat = action.indexOf('if (!f4RuntimeMayMutate(runtime)', heartbeat);
  const commit = action.indexOf('await commitArc9ExplorerNameChangeV1({', postHeartbeat);
  const durable = action.indexOf('durable = true;', commit);
  const checkpoint = action.indexOf('const checkpoint = runtime.checkpointParent();', durable);
  const publish = action.indexOf('save.explorerName = outcome.explorerName;', checkpoint);
  const chrome = action.indexOf('updateChips();', publish);
  const settle = action.indexOf('actionClaim.settle(durable);', chrome);
  if (!(preflight >= 0 && noWriteNoop > preflight && claim > noWriteNoop
    && pending > claim && hold > pending && heartbeat > hold
    && postHeartbeat > heartbeat && commit > postHeartbeat && durable > commit
    && checkpoint > durable && publish > checkpoint && chrome > publish && settle > chrome)) {
    errors.push('explorer-name preflight/claim/heartbeat/commit/verify/publication order is broken');
  }
  const postHeartbeatGuard = action.slice(postHeartbeat, commit);
  for (const needle of [
    'runtime', 'importWriteInFlight', 'replacementTransaction', 'replacementReloadPending',
    'trainingCheckpointWriteHeld', 'ecologyEpochBlocksActions()',
  ]) if (!postHeartbeatGuard.includes(needle)) errors.push(`post-heartbeat guard omits ${needle}`);
  if ((action.match(/commitArc9ExplorerNameChangeV1\(/gu) ?? []).length !== 1
    || /\b(?:while|for)\s*\(/u.test(action)
    || action.includes('setTimeout(')) {
    errors.push('explorer-name action is retried or invoked more than once');
  }
  if (!action.includes("preflight.kind === 'noop'")
    || claim < 0 || claim < noWriteNoop) {
    errors.push('cleaned-empty or unchanged name can consume a product claim');
  }
  if (!action.includes("outcome.kind === 'committed-convergence'")
    || !action.includes('scheduleF4AuthorityConvergenceReload(')) {
    errors.push('durable explorer-name ambiguity does not converge read-only');
  }
  if (!action.includes('save.explorerName = priorLiveName;')) {
    errors.push('failed postcommit publication does not restore the prior live name');
  }
  if (action.includes('save = outcome.transaction.state')) {
    errors.push('explorer-name action replaces disjoint live state');
  }
  if (/\b(?:namer|unlocked|gameEvent|queueArc9ProgressionRefresh)\b/u.test(action)) {
    errors.push('explorer self-rename owns a discovery achievement side effect');
  }

  const readOnly = section(
    source,
    'const READ_ONLY_MUTATION_SELECTOR = [',
    '\n].join(\',\');',
  );
  if (!readOnly.includes("'[data-arc9-explorer-name-save]'")) {
    errors.push('read-only authority omits explorer-name Save');
  }
  return errors;
}

describe('Arc 9 explorer self-rename Main wiring', () => {
  it('keeps Settings/AppChrome nonoptimistic and publishes only after one verified receipt', () => {
    expect(explorerNameMainErrors(mainSource)).toEqual([]);
    expect(actionSource).not.toMatch(/\b(?:document|window|localStorage|sessionStorage)\b/u);
    expect(actionSource).not.toContain('Math.random(');
    expect(actionSource).not.toContain('Date.now(');
    expect(actionSource).not.toContain('prepareArc9EventAchievementJoinV1');
    expect(actionSource).not.toMatch(/\b(?:gameEvent|publishArc5RenameAchievementFields)\s*\(/u);
    expect(actionSource).not.toMatch(/(?:state|draft|target|successorState)\.unlocked\s*=/u);
    expect(settingsSource).not.toMatch(/\b(?:document|window|localStorage|sessionStorage)\b/u);
  });

  it('mutation-controls native rollback, heartbeat, durable publication, and achievement isolation', () => {
    expect(explorerNameMainErrors(replaceInSectionExact(
      mainSource,
      SETTINGS_START,
      SETTINGS_END,
      '        input.value = explorerNameSettings.model.explorerName;',
      '        // mutation control leaves the tentative native value painted',
    ))).toContain('Settings does not restore the durable name before its one action');

    expect(explorerNameMainErrors(replaceInSectionExact(
      mainSource,
      ACTION_START,
      ACTION_END,
      '    await settleF4Heartbeat();',
      '    // mutation control omits the authority heartbeat',
    ))).toContain('explorer-name preflight/claim/heartbeat/commit/verify/publication order is broken');

    expect(explorerNameMainErrors(replaceInSectionExact(
      mainSource,
      ACTION_START,
      ACTION_END,
      '      save.explorerName = outcome.explorerName;',
      '      // mutation control omits verified publication',
    ))).toContain('explorer-name preflight/claim/heartbeat/commit/verify/publication order is broken');

    expect(explorerNameMainErrors(replaceInSectionExact(
      mainSource,
      ACTION_START,
      ACTION_END,
      '    actionClaim.settle(durable);',
      '    actionClaim.settle(durable);\n    queueArc9ProgressionRefresh(actionClaim.operation);',
    ))).toContain('explorer self-rename owns a discovery achievement side effect');

    expect(explorerNameMainErrors(mainSource.replace(
      "  '[data-arc9-explorer-name-save]',\n",
      '',
    ))).toContain('read-only authority omits explorer-name Save');
  });
});
