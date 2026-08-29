import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const mainSource = fs.readFileSync(path.join(here, '../apps/game/src/main.ts'), 'utf8');
const indexSource = fs.readFileSync(path.join(here, '../apps/game/index.html'), 'utf8');
const actionSource = fs.readFileSync(
  path.join(here, '../apps/game/src/arc9-frontier-ending-action.ts'),
  'utf8',
);
const panelSource = fs.readFileSync(
  path.join(here, '../apps/game/src/prime-codex-panel.ts'),
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

const ACTION_START = 'async function runArc9FrontierEndingChoice(requestedEndingId: string): Promise<void> {';
const ACTION_END = '\nasync function runArc9NameplateChoice(requestedChoiceIndex: number): Promise<void> {';

function frontierEndingMainErrors(source: string): string[] {
  const errors: string[] = [];
  for (const [needle, label] of [
    ["from './arc9-frontier-ending-action.js';", 'action import'],
    ["from './prime-codex-panel.js';", 'panel import'],
    ["id: 'prime',", 'panel registration'],
    ["const primeCodexOpener = appChrome.primeCodexOpener();", 'Prime opener port'],
    ["primeCodexOpener.addEventListener('click', () => togglePanel('prime'));", 'Prime opener'],
    ["event.target.closest<HTMLButtonElement>('[data-frontier-ending-id]')", 'ending delegation'],
  ] as const) if (!source.includes(needle)) errors.push(`missing ${label}`);

  const fill = section(source, 'function fillPrimeCodex(): void {', "\n/* THE STAR ATLAS");
  const project = fill.indexOf('projectPrimeCodexV1(save)');
  const render = fill.indexOf('renderPrimeCodexPanelV1(', 0);
  const fillPanel = fill.indexOf("fillPanel('prime'", 0);
  if (!(render >= 0 && fillPanel >= 0 && project > render)) {
    errors.push('Prime panel does not render one canonical save projection');
  }

  const action = section(source, ACTION_START, ACTION_END);
  const claim = action.indexOf(
    'productActionCoordinator.tryClaim(ARC9_FRONTIER_ENDING_OPERATION_V1)',
  );
  const pending = action.indexOf('arc9FrontierEndingPending = true;', claim);
  const hold = action.indexOf('await smokeProductActionHold.holdIfArmed(actionClaim.operation);', pending);
  const heartbeat = action.indexOf('await settleF4Heartbeat();', hold);
  const postHeartbeat = action.indexOf(
    'if (smokeForceReadOnly || !f4RuntimeMayMutate(runtime)',
    heartbeat,
  );
  const commit = action.indexOf('await commitArc9FrontierEndingChoiceV1({', postHeartbeat);
  const durable = action.indexOf('durable = true;', commit);
  const checkpoint = action.indexOf('const checkpoint = runtime.checkpointParent();', durable);
  const publish = action.indexOf('save.frontierEnding = outcome.endingId;', checkpoint);
  const settle = action.indexOf('actionClaim.settle(durable);', publish);
  if (!(claim >= 0 && pending > claim && hold > pending && heartbeat > hold
    && postHeartbeat > heartbeat && commit > postHeartbeat && durable > commit
    && checkpoint > durable && publish > checkpoint && settle > publish)) {
    errors.push('ending claim/heartbeat/commit/verify/publication order is broken');
  }
  const postHeartbeatGuard = action.slice(postHeartbeat, commit);
  for (const needle of [
    'runtime', 'importWriteInFlight', 'replacementTransaction', 'replacementReloadPending',
    'trainingCheckpointWriteHeld', 'trainingActive()', 'ecologyEpochBlocksActions()',
  ]) if (!postHeartbeatGuard.includes(needle)) errors.push(`post-heartbeat guard omits ${needle}`);
  if ((action.match(/commitArc9FrontierEndingChoiceV1\(/gu) ?? []).length !== 1
    || /\b(?:while|for)\s*\(/u.test(action)
    || action.includes('setTimeout(')) {
    errors.push('Frontier ending action is retried or invoked more than once');
  }
  if (action.includes('queueArc9ProgressionRefresh(')
    || action.includes('save = outcome.transaction.state')) {
    errors.push('Frontier ending action owns a disjoint progression or whole-save publication');
  }
  if (!action.includes("outcome.kind === 'committed-convergence'")
    || !action.includes('scheduleF4AuthorityConvergenceReload(')) {
    errors.push('durable ending ambiguity does not converge read-only');
  }
  if (!action.includes('save.frontierEnding = priorLiveEnding;')) {
    errors.push('failed postcommit ending publication does not restore prior live authority');
  }

  const readOnly = section(
    source,
    'const READ_ONLY_MUTATION_SELECTOR = [',
    '\n].join(\',\');',
  );
  if (!readOnly.includes("'[data-frontier-ending-id]'")) {
    errors.push('read-only authority omits Frontier ending choices');
  }
  return errors;
}

function primeMarkupErrors(source: string): string[] {
  const errors: string[] = [];
  if (!source.includes('<button id="primechip" class="glass pill" type="button"')) {
    errors.push('Prime chip is not a native button');
  }
  if (!source.includes('<aside id="primepanel" class="glass panel" aria-label="Prime Codex"></aside>')) {
    errors.push('Prime panel region is missing');
  }
  const primeRule = section(source, '#primechip {', '\n    #primechip.on');
  if (!primeRule.includes('pointer-events: auto') || !primeRule.includes('min-height: 44px')) {
    errors.push('Prime chip is not pointer-enabled with a touch-size floor');
  }
  if (!source.includes('#primepanel button.frontier-ending-choice')) {
    errors.push('Frontier ending native-button styling is missing');
  }
  return errors;
}

describe('Arc 9 Prime Codex and Frontier ending Main wiring', () => {
  it('keeps the projection clickable and publishes only after one verified receipt', () => {
    expect(frontierEndingMainErrors(mainSource)).toEqual([]);
    expect(primeMarkupErrors(indexSource)).toEqual([]);
    for (const source of [actionSource, panelSource]) {
      expect(source).not.toMatch(/\b(?:document|window|localStorage|sessionStorage)\b/u);
      expect(source).not.toContain('Math.random(');
      expect(source).not.toContain('Date.now(');
    }
    expect(actionSource).not.toMatch(/\b(?:gameEvent|queueArc9ProgressionRefresh)\s*\(/u);
    expect(actionSource).not.toMatch(/(?:state|draft|successorState)\.(?:essence|items|cargo|unlocked)\s*=/u);
  });

  it('mutation-controls heartbeat, durable publication, native opener, and read-only blocking', () => {
    expect(frontierEndingMainErrors(replaceInSectionExact(
      mainSource,
      ACTION_START,
      ACTION_END,
      '    await settleF4Heartbeat();',
      '    // mutation control omits the authority heartbeat',
    ))).toContain('ending claim/heartbeat/commit/verify/publication order is broken');

    expect(frontierEndingMainErrors(replaceInSectionExact(
      mainSource,
      ACTION_START,
      ACTION_END,
      '      save.frontierEnding = outcome.endingId;',
      '      // mutation control omits verified publication',
    ))).toContain('ending claim/heartbeat/commit/verify/publication order is broken');

    expect(frontierEndingMainErrors(mainSource.replace(
      "  '[data-frontier-ending-id]',\n",
      '',
    ))).toContain('read-only authority omits Frontier ending choices');

    expect(primeMarkupErrors(indexSource.replace(
      '<button id="primechip" class="glass pill" type="button" aria-label="Open Prime Codex"></button>',
      '<span id="primechip" class="glass pill"></span>',
    ))).toContain('Prime chip is not a native button');
  });
});
