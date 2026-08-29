import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const mainSource = fs.readFileSync(path.join(here, '../apps/game/src/main.ts'), 'utf8');
const indexSource = fs.readFileSync(path.join(here, '../apps/game/index.html'), 'utf8');

function section(source: string, startText: string, endText: string): string {
  const start = source.indexOf(startText);
  const end = source.indexOf(endText, start);
  return start >= 0 && end > start ? source.slice(start, end) : '';
}

function inOrder(body: string, needles: readonly string[]): boolean {
  let cursor = -1;
  for (const needle of needles) {
    cursor = body.indexOf(needle, cursor + 1);
    if (cursor < 0) return false;
  }
  return true;
}

function count(body: string, needle: string): number {
  return body.split(needle).length - 1;
}

function replaceInSectionExact(
  source: string,
  startText: string,
  endText: string,
  needle: string,
  replacement: string,
): string {
  const body = section(source, startText, endText);
  if (body.length === 0 || count(body, needle) !== 1) {
    throw new Error(`bounded collection mutation target is not exact: ${startText} :: ${needle}`);
  }
  return source.replace(body, body.replace(needle, replacement));
}

function wiringErrors(main: string, index: string): string[] {
  const errors: string[] = [];
  const controls = section(
    main,
    'function boundedCollectionActionsWritable()',
    '\nfunction fillRecords()',
  );
  const records = section(main, 'function fillRecords()', '\nfunction frontierEndingPanelStatus()');
  const charters = section(main, 'function fillCharters()', '\nregisterPanel({ id: \'ch\'');
  const charterDelegation = section(
    main,
    "document.getElementById('chpanel')!.addEventListener('click'",
    '\nconst primeCodexOpener',
  );
  const binderDelegation = section(
    main,
    "document.getElementById('recpanel')!.addEventListener('click'",
    '\nconst inventoryPanelController',
  );
  const convergence = section(
    main,
    'function boundedCollectionRefusalNeedsReload(',
    '\nasync function runStarterCharterAccept(',
  );
  const starter = section(
    main,
    'async function runStarterCharterAccept(',
    '\nasync function runArc9BinderSetClaim(',
  );
  const binder = section(
    main,
    'async function runArc9BinderSetClaim(',
    '\nfunction arc9TravelInspectionOnly(',
  );
  const styles = section(
    index,
    '/* Starter Charters and Binder Sets reuse native buttons',
    '/* Prime is a bounded read projection',
  );

  if (!main.includes("from './starter-charters.js';")
    || !main.includes("from './binder-sets.js';")) {
    errors.push('canonical Starter Charter or Binder owner import is missing');
  }
  if (!inOrder(charters, [
    'projectStarterCharterBoardV1(save)',
    "starterProjection.kind === 'projected'",
    'renderStarterCharterBoardV1(starterProjection.board)',
    'data-starter-charter-board-protected',
    "'[data-starter-charter-accept]'",
    'starterProjection.board.acceptedCount >= starterProjection.board.cap',
  ])) errors.push('Charters does not append and protect the exact Starter board');
  if (!inOrder(records, [
    'projectArc9RecordsRankReadModelV1(save)',
    'projectArc9BinderReadModelV1(save)',
    'renderArc9BinderPanelV1(binderProjection.model)',
    'data-arc9-binder-protected',
    "'[data-binder-claim]'",
  ])) errors.push('Records does not append and protect the exact Binder projection');
  if (!controls.includes('&& !trainingCheckpointWriteHeld && !trainingActive()')
    || !controls.includes('activePersist === null && !importWriteInFlight')
    || !controls.includes('replacementTransaction === null && !replacementReloadPending')
    || !controls.includes('button.disabled = !writable;')
    || !controls.includes("button.setAttribute('aria-disabled', 'true');")
    || !controls.includes("root.setAttribute('aria-busy', String(pending));")) {
    errors.push('projected controls do not expose the shared write/Training lock');
  }
  if (!charterDelegation.includes('STARTER_CHARTER_IDS_V1.find(')
    || !charterDelegation.includes('button.dataset.starterCharterAccept')
    || !charterDelegation.includes('button === null || button.disabled')
    || !charterDelegation.includes('void runStarterCharterAccept(id)')) {
    errors.push('Starter Accept delegation does not validate the exact canonical id');
  }
  if (!binderDelegation.includes('ARC9_BINDER_CLAIMABLE_SET_IDS_V1.find(')
    || !binderDelegation.includes('button.dataset.binderClaim')
    || !binderDelegation.includes('button === null || button.disabled')
    || !binderDelegation.includes('void runArc9BinderSetClaim(setId)')) {
    errors.push('Binder Claim delegation does not validate the exact canonical id');
  }
  if (!main.includes("'[data-starter-charter-accept]',")
    || !main.includes("'[data-binder-claim]',")) {
    errors.push('document read-only boundary omits a bounded collection action');
  }

  for (const kind of [
    'stale', 'revision-exhausted', 'duplicate-receipt', 'lost',
    'lease-unavailable', 'protected', 'storage-error',
  ]) {
    if (!convergence.includes(`kind === '${kind}'`)) {
      errors.push(`bounded collection convergence omits ${kind}`);
    }
  }

  if (count(starter, 'commitStarterCharterAcceptV1({') !== 1
    || count(starter, 'productActionCoordinator.tryClaim(operation)') !== 1
    || count(starter, 'await settleF4Heartbeat();') !== 1
    || count(starter, 'presentProgressionCeremony({') !== 1
    || starter.includes('queueArc9ProgressionRefresh(')
    || starter.includes('.commitAction(')) {
    errors.push('Starter Accept is not one F4 action/receipt with one ceremony');
  }
  if (count(starter, 'trainingCheckpointWriteHeld') < 2
    || count(starter, 'trainingActive()') < 2
    || !inOrder(starter, [
      'const operation = operationForStarterCharterAcceptV1(id);',
      'productActionCoordinator.tryClaim(operation)',
      'starterCharterAcceptPendingId = id;',
      'await smokeProductActionHold.holdIfArmed(actionClaim.operation);',
      'await settleF4Heartbeat();',
      'JSON.stringify(sourceState) !== sourceAuthorityJson',
      'starterCharterAcceptPendingId !== id',
      'writeAttempted = true;',
      'outcome = await commitStarterCharterAcceptV1({',
    ])) errors.push('Starter Accept does not recheck exact authority after the heartbeat');
  if (!starter.includes("projection.kind !== 'projected'")
    || !starter.includes("row === undefined || row.status !== 'available'")
    || !starter.includes('projection.board.acceptedCount >= projection.board.cap')) {
    errors.push('Starter Accept can escape protected, locked, or cap state');
  }
  if (!inOrder(starter, [
    "if (outcome.kind === 'committed-convergence')",
    'const checkpoint = runtime.checkpointParent();',
    'publishStarterCharterAcceptFieldsV1(sourceState, outcome);',
    'inventoryPanelController.setState(arc2LootState);',
    'updateChips();',
    "if (openPanelId() === 'ch') fillCharters();",
    "if (openPanelId() === 'rec') fillRecords();",
    'presentProgressionCeremony({',
  ]) || !starter.includes('JSON.stringify(checkpoint.chacc)')
    || !starter.includes('JSON.stringify(checkpoint.equipAff)')
    || !starter.includes('JSON.stringify(checkpoint.unlocked)')) {
    errors.push('Starter committed publication is not exact or fully refreshed');
  }
  if (!starter.includes('Accepted and completed')
    || !starter.includes('Reward: ${reward}.')
    || !starter.includes("toast('Charter accepted'")) {
    errors.push('Starter accepted/completed/reward status copy is missing');
  }
  if (!starter.includes('if (durable || writeAttempted)')
    || !starter.includes('restoreLiveParent();')
    || !starter.includes('scheduleF4AuthorityConvergenceReload(')
    || !starter.includes('actionClaim.settle(durable);')) {
    errors.push('Starter ambiguity or durable presentation failure can invite retry');
  }

  if (count(binder, 'commitArc9BinderSetClaimV1({') !== 1
    || count(binder, 'productActionCoordinator.tryClaim(operation)') !== 1
    || count(binder, 'await settleF4Heartbeat();') !== 1
    || count(binder, 'presentProgressionCeremony({') !== 1
    || binder.includes('queueArc9ProgressionRefresh(')
    || binder.includes('.commitAction(')) {
    errors.push('Binder Claim is not one F4 action/receipt with one ceremony');
  }
  if (count(binder, 'trainingCheckpointWriteHeld') < 2
    || count(binder, 'trainingActive()') < 2
    || !inOrder(binder, [
      'const operation = operationForArc9BinderSetClaimV1(setId);',
      'productActionCoordinator.tryClaim(operation)',
      'arc9BinderClaimPendingId = setId;',
      'await smokeProductActionHold.holdIfArmed(actionClaim.operation);',
      'await settleF4Heartbeat();',
      'JSON.stringify(sourceState) !== sourceAuthorityJson',
      'arc9BinderClaimPendingId !== setId',
      'writeAttempted = true;',
      'outcome = await commitArc9BinderSetClaimV1({',
    ])) errors.push('Binder Claim does not recheck exact authority after the heartbeat');
  if (!binder.includes("projection.kind !== 'projected'")
    || !binder.includes('row === undefined || row.claimed || !row.complete')) {
    errors.push('Binder Claim can escape protected, claimed, or incomplete state');
  }
  if (!inOrder(binder, [
    "if (outcome.kind === 'committed-convergence')",
    'const checkpoint = runtime.checkpointParent();',
    'publishArc9BinderSetClaimFieldsV1(sourceState, outcome);',
    'updateChips();',
    "if (openPanelId() === 'rec') fillRecords();",
    'presentProgressionCeremony({',
  ]) || !binder.includes('JSON.stringify(checkpoint.claimedSets)')
    || !binder.includes('JSON.stringify(checkpoint.stats)')
    || !binder.includes('JSON.stringify(checkpoint.unlocked)')) {
    errors.push('Binder committed publication is not exact or fully refreshed');
  }
  if (!binder.includes('Reward: +${outcome.facts.stardust} Stardust.')
    || !binder.includes("toast('Binder Set claimed'")) {
    errors.push('Binder one-time reward status copy is missing');
  }
  if (!binder.includes('if (durable || writeAttempted)')
    || !binder.includes('restoreLiveParent();')
    || !binder.includes('scheduleF4AuthorityConvergenceReload(')
    || !binder.includes('actionClaim.settle(durable);')) {
    errors.push('Binder ambiguity or durable presentation failure can invite retry');
  }

  if (!styles.includes('#chpanel button[data-starter-charter-accept], #recpanel button[data-binder-claim]')
    || !styles.includes('min-height: 44px')
    || !styles.includes('.starter-charter-status, .binder-action-status')
    || !styles.includes('.binder-grid')) {
    errors.push('bounded collection controls lack their accessible responsive CSS');
  }
  return errors;
}

describe('Starter Charter and Binder Main wiring', () => {
  it('projects both canonical boards and settles exact one-receipt actions without optimism', () => {
    expect(wiringErrors(mainSource, indexSource)).toEqual([]);
  });

  it('negative-controls heartbeat, exact publication, id validation, and accessible actions', () => {
    expect(wiringErrors(replaceInSectionExact(
      mainSource,
      'async function runStarterCharterAccept(',
      '\nasync function runArc9BinderSetClaim(',
      '    await settleF4Heartbeat();',
      '    // mutation control skips the full heartbeat',
    ), indexSource)).toContain('Starter Accept is not one F4 action/receipt with one ceremony');

    expect(wiringErrors(replaceInSectionExact(
      mainSource,
      'async function runStarterCharterAccept(',
      '\nasync function runArc9BinderSetClaim(',
      '      publishStarterCharterAcceptFieldsV1(sourceState, outcome);',
      '      // mutation control publishes nothing',
    ), indexSource)).toContain('Starter committed publication is not exact or fully refreshed');

    expect(wiringErrors(replaceInSectionExact(
      mainSource,
      'async function runArc9BinderSetClaim(',
      '\nfunction arc9TravelInspectionOnly(',
      '      publishArc9BinderSetClaimFieldsV1(sourceState, outcome);',
      '      // mutation control publishes nothing',
    ), indexSource)).toContain('Binder committed publication is not exact or fully refreshed');

    expect(wiringErrors(replaceInSectionExact(
      mainSource,
      "document.getElementById('chpanel')!.addEventListener('click'",
      '\nconst primeCodexOpener',
      'STARTER_CHARTER_IDS_V1.find(',
      '([button.dataset.starterCharterAccept] as StarterCharterIdV1[]).find(',
    ), indexSource)).toContain('Starter Accept delegation does not validate the exact canonical id');

    expect(wiringErrors(mainSource, indexSource.replace(
      'min-width: 72px; min-height: 44px;',
      'min-width: 72px; min-height: 20px;',
    ))).toContain('bounded collection controls lack their accessible responsive CSS');

    expect(wiringErrors(replaceInSectionExact(
      mainSource,
      'function boundedCollectionActionsWritable()',
      '\nfunction fillRecords()',
      '    && !trainingCheckpointWriteHeld && !trainingActive()',
      '    && trainingCheckpointWriteHeld && !trainingActive()',
    ), indexSource)).toContain('projected controls do not expose the shared write/Training lock');
  });
});
