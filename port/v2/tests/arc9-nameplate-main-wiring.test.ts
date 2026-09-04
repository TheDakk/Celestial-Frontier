import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const mainSource = fs.readFileSync(path.join(here, '../apps/game/src/main.ts'), 'utf8');
const actionSource = fs.readFileSync(
  path.join(here, '../apps/game/src/arc9-nameplate-action.ts'),
  'utf8',
);
const settingsSource = fs.readFileSync(
  path.join(here, '../apps/game/src/nameplate-settings.ts'),
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
const ACTION_START = 'async function runArc9NameplateChoice(requestedChoiceIndex: number): Promise<void> {';
const ACTION_END = '\n/** Every receipt-bearing product owner settles before this follow-up can';

function nameplateMainErrors(source: string): string[] {
  const errors: string[] = [];
  for (const [needle, label] of [
    ["from './arc9-nameplate-action.js';", 'action import'],
    ["from './nameplate-settings.js';", 'Settings projection import'],
  ] as const) if (!source.includes(needle)) errors.push(`missing ${label}`);

  const settings = section(source, SETTINGS_START, SETTINGS_END);
  const project = settings.indexOf('projectArc9NameplateSettingsV1(save)');
  const render = settings.indexOf(
    'renderArc9NameplateSettingV1(nameplateSettings, arc9NameplateChoicePending)',
    project,
  );
  const projectedGuard = settings.indexOf("if (nameplateSettings.kind === 'projected')", render);
  const listener = settings.indexOf("nameplateControl.addEventListener('change'", projectedGuard);
  const capture = settings.indexOf('const requestedChoiceIndex = Number(nameplateControl.value);', listener);
  const restore = settings.indexOf(
    'nameplateControl.value = String(nameplateSettings.model.selectedChoiceIndex);',
    capture,
  );
  const disable = settings.indexOf('nameplateControl.disabled = true;', restore);
  const run = settings.indexOf('void runArc9NameplateChoice(requestedChoiceIndex);', disable);
  if (!(project >= 0 && render > project && projectedGuard > render && listener > projectedGuard
    && capture > listener && restore > capture && disable > restore && run > disable)) {
    errors.push('Settings does not restore the durable choice before its one action');
  }
  if (settings.includes('save.nameHue =')) {
    errors.push('Settings publishes the tentative native choice optimistically');
  }

  const action = section(source, ACTION_START, ACTION_END);
  const claim = action.indexOf(
    'productActionCoordinator.tryClaim(ARC9_NAMEPLATE_CHOICE_OPERATION_V1)',
  );
  const pending = action.indexOf('arc9NameplateChoicePending = true;', claim);
  const hold = action.indexOf('await smokeProductActionHold.holdIfArmed(actionClaim.operation);', pending);
  const heartbeat = action.indexOf('await settleF4Heartbeat();', hold);
  const postHeartbeat = action.indexOf('if (!f4RuntimeMayMutate(runtime)', heartbeat);
  const commit = action.indexOf('await commitArc9NameplateChoiceV1({', postHeartbeat);
  const durable = action.indexOf('durable = true;', commit);
  const checkpoint = action.indexOf('const checkpoint = runtime.checkpointParent();', durable);
  const publish = action.indexOf('save.nameHue = outcome.choiceIndex;', checkpoint);
  const chrome = action.indexOf('updateChips();', publish);
  const settle = action.indexOf('actionClaim.settle(durable);', chrome);
  if (!(claim >= 0 && pending > claim && hold > pending && heartbeat > hold
    && postHeartbeat > heartbeat && commit > postHeartbeat && durable > commit
    && checkpoint > durable && publish > checkpoint && chrome > publish && settle > chrome)) {
    errors.push('nameplate claim/heartbeat/commit/verify/publication order is broken');
  }
  const postHeartbeatGuard = action.slice(postHeartbeat, commit);
  for (const needle of [
    'runtime', 'importWriteInFlight', 'replacementTransaction', 'replacementReloadPending',
    'trainingCheckpointWriteHeld', 'ecologyEpochBlocksActions()',
  ]) if (!postHeartbeatGuard.includes(needle)) errors.push(`post-heartbeat guard omits ${needle}`);
  if ((action.match(/commitArc9NameplateChoiceV1\(/gu) ?? []).length !== 1
    || /\b(?:while|for)\s*\(/u.test(action)
    || action.includes('setTimeout(')) {
    errors.push('nameplate action is retried or invoked more than once');
  }
  if (action.includes('save = outcome.transaction.state')) {
    errors.push('nameplate action replaces disjoint live state');
  }
  if (!action.includes("outcome.kind === 'committed-convergence'")
    || !action.includes('scheduleF4AuthorityConvergenceReload(')) {
    errors.push('durable nameplate ambiguity does not converge read-only');
  }
  if (!action.includes('save.nameHue = priorLiveChoice;')) {
    errors.push('failed postcommit publication does not restore the prior live choice');
  }
  if (!action.includes('actionClaim.settle(durable);\n    if (durable) queueArc9ProgressionRefresh(actionClaim.operation);')) {
    errors.push('nameplate receipt does not settle before progression catch-up');
  }

  const readOnly = section(
    source,
    'const READ_ONLY_MUTATION_SELECTOR = [',
    '\n].join(\',\');',
  );
  if (!readOnly.includes("'[data-arc9-nameplate-choice]'")) {
    errors.push('read-only authority omits the nameplate control');
  }
  return errors;
}

describe('Arc 9 saved nameplate Main wiring', () => {
  it('keeps Settings nonoptimistic and publishes AppChrome only after one verified receipt', () => {
    expect(nameplateMainErrors(mainSource)).toEqual([]);
    for (const source of [actionSource, settingsSource]) {
      expect(source).not.toMatch(/\b(?:document|window|localStorage|sessionStorage)\b/u);
      expect(source).not.toContain('Math.random(');
      expect(source).not.toContain('Date.now(');
    }
  });

  it('mutation-controls native rollback, heartbeat, fixed-point publication, and read-only blocking', () => {
    expect(nameplateMainErrors(replaceInSectionExact(
      mainSource,
      SETTINGS_START,
      SETTINGS_END,
      '      nameplateControl.value = String(nameplateSettings.model.selectedChoiceIndex);',
      '      // mutation control leaves the tentative native value painted',
    ))).toContain('Settings does not restore the durable choice before its one action');

    expect(nameplateMainErrors(replaceInSectionExact(
      mainSource,
      ACTION_START,
      ACTION_END,
      '    await settleF4Heartbeat();',
      '    // mutation control omits the authority heartbeat',
    ))).toContain('nameplate claim/heartbeat/commit/verify/publication order is broken');

    expect(nameplateMainErrors(replaceInSectionExact(
      mainSource,
      ACTION_START,
      ACTION_END,
      '      save.nameHue = outcome.choiceIndex;',
      '      // mutation control omits verified publication',
    ))).toContain('nameplate claim/heartbeat/commit/verify/publication order is broken');

    expect(nameplateMainErrors(replaceInSectionExact(
      mainSource,
      ACTION_START,
      ACTION_END,
      '      updateChips();',
      '      // mutation control leaves AppChrome stale',
    ))).toContain('nameplate claim/heartbeat/commit/verify/publication order is broken');

    expect(nameplateMainErrors(mainSource.replace(
      "  '[data-arc9-nameplate-choice]',\n",
      '',
    ))).toContain('read-only authority omits the nameplate control');
  });
});
