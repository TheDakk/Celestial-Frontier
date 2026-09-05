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
  if (occurrences(text, needle) !== 1) throw new Error(`mutation target is not unique: ${needle}`);
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
    'import {\n  ARC9_SHARE_FOLLOW_OPERATION_V1,',
    "} from './arc9-sharing-action.js';",
  );
  if (!importBlock.includes('ARC9_SHARE_SEND_OPERATION_V1,')
    || !importBlock.includes('commitArc9SharingActionV1,')
    || !importBlock.includes('publishArc9SharingFieldsV1,')
    || !importBlock.includes('type Arc9SharingActionOutcomeV1,')) {
    errors.push('sharing-import');
  }

  const follow = section(
    main,
    'async function commitArc9FollowedSearchRoute(',
    '\nconst searchTravel =',
  );
  if (!ordered(follow, [
    'const actionClaim = productActionCoordinator.tryClaim(ARC9_SHARE_FOLLOW_OPERATION_V1);',
    'const priorStats = save.stats;',
    'const priorUnlocked = save.unlocked;',
    'const priorGalSeen = save.galSeen;',
    'const priorSavedView = save.savedView;',
    'await smokeProductActionHold.holdIfArmed(actionClaim.operation);',
    'await settleF4Heartbeat();',
    'navigationAuthorityFailureFor(save, plan.target, SHIP_LIVERY_SEED) !== null',
    'outcome = await commitArc9SharingActionV1({',
    'durable = true;',
    'const checkpoint = runtime.checkpointParent();',
    'outcome.arrival === null',
    'checkpoint.stats.bestRank !== outcome.arrival.nextBestRank',
    'JSON.stringify(checkpoint.galSeen) !== JSON.stringify(outcome.arrival.nextGalSeen)',
    'publishArc9SharingFieldsV1(save, outcome);',
    'publishAcceptedSearchNavigation(plan, true);',
    'actionClaim.settle(durable);',
  ])) errors.push('follow-order');
  if (occurrences(follow, 'commitArc9SharingActionV1({') !== 1
    || occurrences(follow, "actionKind: 'follow',") !== 1
    || occurrences(follow, 'code: plan.followedCode,') !== 1
    || occurrences(follow, 'publishArc9SharingFieldsV1(save, outcome);') !== 1
    || occurrences(follow, 'publishAcceptedSearchNavigation(plan, true);') !== 1
    || follow.includes('save.stats.jumps++')
    || follow.includes('persistView(')) errors.push('follow-owner');
  if (occurrences(follow, 'outcome.arrival === null') !== 1
    || occurrences(follow, 'checkpoint.stats.bestRank !== outcome.arrival.nextBestRank') !== 1
    || occurrences(follow,
      'JSON.stringify(checkpoint.galSeen) !== JSON.stringify(outcome.arrival.nextGalSeen)') !== 1) {
    errors.push('follow-arrival-checkpoint');
  }
  if (occurrences(follow, 'save.stats = priorStats;') !== 2
    || occurrences(follow, 'save.unlocked = priorUnlocked;') !== 2
    || occurrences(follow, 'save.galSeen = priorGalSeen;') !== 2
    || occurrences(follow, 'save.savedView = priorSavedView;') !== 2) {
    errors.push('follow-rollback');
  }
  if (follow.includes('queueArc9ProgressionRefresh(')
    || follow.includes('commitArc9TravelSettlementV1(')) {
    errors.push('follow-second-progression');
  }

  const send = section(
    main,
    'async function commitArc9ShareSend(',
    '\nlet lastArc0LandingOutcome:',
  );
  if (!ordered(send, [
    'const actionClaim = productActionCoordinator.tryClaim(ARC9_SHARE_SEND_OPERATION_V1);',
    'await smokeProductActionHold.holdIfArmed(actionClaim.operation);',
    'await settleF4Heartbeat();',
    'outcome = await commitArc9SharingActionV1({',
    'durable = true;',
    'const checkpoint = runtime.checkpointParent();',
    'publishArc9SharingFieldsV1(save, outcome);',
    'void copyShareCode(code);',
    'actionClaim.settle(durable);',
    'if (durable) queueArc9ProgressionRefresh(actionClaim.operation);',
  ])) errors.push('send-order');
  if (occurrences(send, 'commitArc9SharingActionV1({') !== 1
    || occurrences(send, "actionKind: 'send',") !== 1
    || occurrences(send, 'acceptedSavedView: null,') !== 1
    || occurrences(send, 'publishArc9SharingFieldsV1(save, outcome);') !== 1
    || occurrences(send, 'void copyShareCode(code);') !== 1
    || send.includes('await copyShareCode(code)')
    || send.includes('save.stats.shares++')
    || send.includes('persistView(')) errors.push('send-owner');

  const searchCommit = section(main, '  commitNavigation:', '\n  onPrimeReachBlocked:');
  if (!ordered(searchCommit, [
    'return commitSearchTravelSequence({',
    'commitRoute: async (nameCommitted) => {',
    'if (followedCode !== null) {',
    'if (arc9TravelInspectionOnly()) {',
    'publishAcceptedSearchNavigation(plan, true);',
    "lastArc9ShareFollowOutcome = 'inspection-only:no-follow-credit';",
    'const committed = await commitArc9FollowedSearchRoute(plan);',
    'return Object.freeze({ committed, progressionJoined: committed });',
    'const committed = await commitArc9AcceptedSearchRoute(plan);',
    'queueUnjoinedNameProgression: () => {',
  ])
    || occurrences(searchCommit, 'commitSearchTravelSequence({') !== 1
    || occurrences(searchCommit, 'if (followedCode !== null) {') !== 1
    || occurrences(searchCommit, 'const committed = await commitArc9FollowedSearchRoute(plan);') !== 1
    || occurrences(searchCommit, 'const committed = await commitArc9AcceptedSearchRoute(plan);') !== 1
    || occurrences(searchCommit,
      'return Object.freeze({ committed, progressionJoined: committed });') !== 1
    || occurrences(searchCommit, 'progressionJoined: false') !== 2) {
    errors.push('accepted-follow-only');
  }
  const shareHandler = section(main, "else if (a === 'share') {", '\n  }\n});');
  if (!shareHandler.includes('const code = cardShareCode();')
    || !shareHandler.includes('if (code) await commitArc9ShareSend(code);')
    || shareHandler.includes('copyShareCode(')) errors.push('native-share-owner');
  const readOnly = section(
    main,
    'const READ_ONLY_MUTATION_SELECTOR = [',
    "\n].join(',');",
  );
  if (!readOnly.includes("'[data-act=\"share\"]',")) errors.push('read-only-share');
  return [...new Set(errors)];
}

describe('Arc 9 CF1 Share/Follow Main durability wiring', () => {
  it('joins only native Share and accepted CF1 Follow to their exact F4 owners', () => {
    expect(wiringErrors(source)).toEqual([]);
  });

  it('negative-controls the send owner and clipboard-independent ordering', () => {
    const wrongKind = replaceOnce(source, "      actionKind: 'send',", "      actionKind: 'follow',");
    expect(wiringErrors(wrongKind)).toContain('send-owner');

    const withoutCopy = replaceOnce(
      source,
      '      void copyShareCode(code);',
      '      /* negative control omitted prepared-code presentation */',
    );
    expect(wiringErrors(withoutCopy)).toContain('send-order');
    expect(wiringErrors(withoutCopy)).toContain('send-owner');

    const send = section(
      source,
      'async function commitArc9ShareSend(',
      '\nlet lastArc0LandingOutcome:',
    );
    const copiedFirstOwner = replaceOnce(
      send,
      '      publishArc9SharingFieldsV1(save, outcome);',
      '      void copyShareCode(code);\n      publishArc9SharingFieldsV1(save, outcome);',
    );
    const copiedFirst = source.replace(send, copiedFirstOwner);
    expect(wiringErrors(copiedFirst)).toContain('send-order');
    expect(wiringErrors(copiedFirst)).toContain('send-owner');
  });

  it('negative-controls accepted-route provenance and receipt-owned navigation', () => {
    const withoutAcceptedBranch = replaceOnce(
      source,
      '    if (followedCode !== null) {',
      '    if (false) { /* negative control followed code ignored */',
    );
    expect(wiringErrors(withoutAcceptedBranch)).toContain('accepted-follow-only');

    const follow = section(
      source,
      'async function commitArc9FollowedSearchRoute(',
      '\nconst searchTravel =',
    );
    const optimisticFollow = replaceOnce(
      follow,
      '      publishAcceptedSearchNavigation(plan, true);',
      '      publishAcceptedSearchNavigation(plan, false);',
    );
    const optimisticRoute = source.replace(follow, optimisticFollow);
    expect(wiringErrors(optimisticRoute)).toContain('follow-order');
    expect(wiringErrors(optimisticRoute)).toContain('follow-owner');

    const wrongFollowKind = replaceOnce(
      source,
      "      actionKind: 'follow',",
      "      actionKind: 'send',",
    );
    expect(wiringErrors(wrongFollowKind)).toContain('follow-owner');

    const searchCommit = section(source, '  commitNavigation:', '\n  onPrimeReachBlocked:');
    const creditedInspectionOwner = replaceOnce(
      searchCommit,
      "        lastArc9ShareFollowOutcome = 'inspection-only:no-follow-credit';",
      "        lastArc9ShareFollowOutcome = 'inspection-only:credited';",
    );
    expect(wiringErrors(source.replace(searchCommit, creditedInspectionOwner)))
      .toContain('accepted-follow-only');

    const followWithoutJoinedProgression = replaceOnce(
      searchCommit,
      '          return Object.freeze({ committed, progressionJoined: committed });',
      '          return Object.freeze({ committed, progressionJoined: false });',
    );
    expect(wiringErrors(source.replace(searchCommit, followWithoutJoinedProgression)))
      .toContain('accepted-follow-only');
  });

  it('negative-controls arrival checkpoint, rollback, and second-receipt regression', () => {
    const follow = section(
      source,
      'async function commitArc9FollowedSearchRoute(',
      '\nconst searchTravel =',
    );
    const withoutLedgerCheckpoint = replaceOnce(
      follow,
      '        || JSON.stringify(checkpoint.galSeen) !== JSON.stringify(outcome.arrival.nextGalSeen)',
      '        /* negative control omitted durable galaxy ledger */',
    );
    expect(wiringErrors(source.replace(follow, withoutLedgerCheckpoint)))
      .toContain('follow-arrival-checkpoint');

    const withoutOneLedgerRollback = follow.replace(
      '      save.galSeen = priorGalSeen;',
      '      /* negative control omitted galaxy rollback */',
    );
    expect(wiringErrors(source.replace(follow, withoutOneLedgerRollback)))
      .toContain('follow-rollback');

    const secondProgression = replaceOnce(
      follow,
      '    actionClaim.settle(durable);',
      '    actionClaim.settle(durable);\n    if (durable) queueArc9ProgressionRefresh(actionClaim.operation);',
    );
    expect(wiringErrors(source.replace(follow, secondProgression)))
      .toContain('follow-second-progression');
  });

  it('negative-controls read-only capture and direct native clipboard bypasses', () => {
    const writableShare = replaceOnce(
      source,
      "  '[data-act=\"landcta\"]', '[data-act=\"add\"]', '[data-act=\"bioscan\"]', '[data-act=\"share\"]',",
      "  '[data-act=\"landcta\"]', '[data-act=\"add\"]', '[data-act=\"bioscan\"]',",
    );
    expect(wiringErrors(writableShare)).toContain('read-only-share');

    const directCopy = replaceOnce(
      source,
      '    if (code) await commitArc9ShareSend(code);',
      '    if (code) void copyShareCode(code);',
    );
    expect(wiringErrors(directCopy)).toContain('native-share-owner');
  });
});
