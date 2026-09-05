import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const mainSource = fs.readFileSync(path.join(here, '../apps/game/src/main.ts'), 'utf8');
const bioscanActionSource = fs.readFileSync(
  path.join(here, '../apps/game/src/bioscan-action.ts'), 'utf8',
);
const captureActionSource = fs.readFileSync(
  path.join(here, '../apps/game/src/arc4-capture-action.ts'), 'utf8',
);
const captureCapacitySource = fs.readFileSync(
  path.join(here, '../apps/game/src/arc4-capture-capacity.ts'), 'utf8',
);

function section(source: string, startText: string, endText: string): string {
  const start = source.indexOf(startText);
  const end = source.indexOf(endText, start);
  return start >= 0 && end > start ? source.slice(start, end) : '';
}

function inOrder(source: string, needles: readonly string[]): boolean {
  let cursor = -1;
  for (const needle of needles) {
    cursor = source.indexOf(needle, cursor + 1);
    if (cursor < 0) return false;
  }
  return true;
}

function errors(source: string): string[] {
  const result: string[] = [];
  for (const symbol of [
    'commitBioscanActionV1,', 'projectBioscanActionV1,', 'publishBioscanActionV1,',
  ]) if (!source.includes(symbol)) result.push(`missing ${symbol}`);

  const present = section(source, 'function presentPlanetSurvey(', '\nfunction startPlanetSurvey(');
  if (!inOrder(present, [
    'const roster = canonicalRosterForBioscanCard(address, preparedCaptureRoster);',
    'currentBioscanCardState = projectCurrentBioscanCardState(address, roster);',
    'buildCardActions(p, currentBioscanCardState)',
  ]) || /commitBioscanActionV1|settleArc9Survey|commitOutcome|persistView/u.test(present)) {
    result.push('living card presentation is not a read-only Bioscan projection');
  }

  const start = section(source, 'function startPlanetSurvey(', '\nfunction buildCardActions(');
  if (!inOrder(start, [
    'const facts = deriveArc9SurveyFactV1(address);',
    "if (facts.target === 'world' && facts.living)",
    'return Promise.resolve(true);',
    'return settleArc9Survey(address);',
  ])) result.push('living inspection does not defer its Survey write to Discover Life');

  const cardActions = section(source, 'function buildCardActions(', '\nfunction refreshPlanetSurveyCard(');
  const cardClick = section(source, "card.addEventListener('click'", '\nconst sideEl =');
  if (!cardActions.includes('bioscanCardActionHtml(bioscanState)')
    || !cardClick.includes("else if (a === 'bioscan')")
    || !cardClick.includes('await runArc9Bioscan();')) {
    result.push('Discover Life control is not connected to the one action owner');
  }

  const action = section(source, 'async function runArc9Bioscan()', '\nasync function settleArc9Survey(');
  if (!inOrder(action, [
    "productActionCoordinator.tryClaim(operation)",
    'await smokeProductActionHold.holdIfArmed(actionClaim.operation);',
    'await settleF4Heartbeat();',
    'const fresh = freshCurrentBioscanReady(actionBarrier);',
    'await commitBioscanActionV1({',
    'durable = true;',
    'const checkpoint = runtime.checkpointParent();',
    "const paragonAdded = attempt.paragon.kind === 'added';",
    'const starterGearChanged = attempt.starterCharter.completions.some(',
    'const loadedLoot = readArc2Loot(runtime.extensions);',
    'const expectedOwnershipTargets = paragonAdded',
    '? [...ARC4_OWNERSHIP_EXTENSION_TARGETS, ...ARC5_OWNERSHIP_EXTENSION_TARGETS]',
    'publishBioscanActionV1(sourceState, attempt);',
    'inventoryPanelController.setState(arc2LootState);',
    'if (ownershipChanged) {',
    "lastArc9BioscanOutcome = `committed:${target}:${attempt.transaction.revision}`;",
    "gameEvent('bioscan', { worldKey: fresh.worldKey });",
    '...attempt.achievementIdsAdded,',
    '...attempt.postHazardAggregateAchievementIdsAdded,',
    '...attempt.starterCharter.addedAchievementIds,',
    'presentProgressionCeremony({',
    'nextUnlockedIds: attempt.state.unlocked,',
    'nextBestRankIndex: attempt.state.stats.bestRank ?? 0,',
    'toastCharterCompletion(',
    "if (attempt.paragon.kind === 'added' && attempt.paragon.codexId !== null)",
    "'🏲 Paragon discovered'",
    'actionClaim.settle(durable);',
    'if (activePersist === actionBarrier) activePersist = null;',
  ]) || action.includes('queueArc9ProgressionRefresh(')
    || (action.match(/commitBioscanActionV1\(/gu)?.length ?? 0) !== 1) {
    result.push('Bioscan is not one rechecked F4 commit and fixed-point publication');
  }
  if (!source.includes("'[data-act=\"bioscan\"]'")
    || !source.includes("schema: 'cf-v2-arc9-bioscan-app-state/v1'")) {
    result.push('Bioscan read-only guard or diagnostics are missing');
  }
  if (!action.includes('codex: save.codex,')
    || !action.includes('sourceState.codex = priorPublication.codex;')
    || !action.includes('attempt.ownershipV2.revision !== parentOwnershipRevision + (ownershipChanged ? 1 : 0)')
    || !action.includes('attempt.settlement.successor !== null || attempt.paragon.kind === \'added\'')) {
    result.push('Paragon Bioscan does not protect Codex rollback or publish the combined ownership successor');
  }
  return result;
}

describe('found Paragon Binder inspection wiring', () => {
  const start = '  if (paragonButton !== null) {';
  const end = '\n  const button = event.target.closest<HTMLButtonElement>(\'[data-binder-claim]\');';
  const owner = section(mainSource, start, end);
  const run = async (source = owner, options: {
    found?: boolean; codex?: [string, object][]; fixtureRows?: unknown;
    projected?: boolean; index?: number; slotIndex?: number; moved?: boolean;
    keyboard?: boolean; located?: boolean;
  } = {}) => {
    const calls: unknown[][] = [];
    const paragonButton = { dataset: { binderParagon: String(options.index ?? 0) } };
    const save = { codex: options.codex ?? [['paragon-exact-extra', { id: 'paragon-exact-extra' }],
      ['paragon-exact', { id: 'paragon-exact' }]] };
    const before = JSON.stringify(save);
    const address = Object.freeze({ key: 'exact-missing-Paragon-site' });
    const env = {
      paragonButton, save, compendiumFixtureRows: options.fixtureRows ?? null,
      projectArc9BinderReadModelV1: (sourceSave: unknown) => {
        expect(sourceSave).toBe(save);
        calls.push(['project']);
        return options.projected === false ? { kind: 'protected' } : { kind: 'projected',
          model: { paragon: { slots: [{ index: options.slotIndex ?? 0,
            found: options.found ?? true, codexId: 'paragon-exact' }] } } };
      },
      activeCodexSource: () => { calls.push(['source']); return save.codex; },
      fillRecords: () => calls.push(['records']),
      codexOpenController: { present: (filter: string, opener: unknown) => {
        expect(opener).toBe(paragonButton); calls.push(['present', filter]);
      } },
      fillCodexDetail: (index: number) => calls.push(['detail', index]),
      projectArc9ParagonFinderV1: (index: number) => {
        calls.push(['finder', index]);
        return options.located === false ? { kind: 'unavailable' } : { kind: 'located', address };
      },
      toast: () => calls.push(['toast']),
      document: { activeElement: options.keyboard === false ? null : paragonButton },
      searchTravel: { jumpToCanonicalAddress: async (target: unknown) => {
        expect(target).toBe(address); calls.push(['travel']); return options.moved ?? true;
      } },
      closePanels: () => calls.push(['close']),
      app: { canvas: { focus: (options: unknown) => calls.push(['focus', options]) } },
    };
    await new Function('env', `const {${Object.keys(env).join(',')}}=env;
      return (async()=>{${source}})();`)(env);
    expect(JSON.stringify(save)).toBe(before);
    return calls;
  };

  it('opens the exact found record through the existing panel/detail owners without reaching travel', async () => {
    expect(mainSource.split(start)).toHaveLength(2);
    expect(mainSource.split(end)).toHaveLength(2);
    const inspected = [['project'], ['source'], ['present', ''], ['detail', 1]];
    expect(await run()).toEqual(inspected);
    expect(await run(owner, { keyboard: false })).toEqual(inspected);
    expect(await run(owner, { codex: [['paragon-exact-extra', {}]] }))
      .toEqual([['project'], ['source'], ['records']]);
    expect(await run(owner, { codex: [['paragon-exact', { id: 'different-record' }]] }))
      .toEqual([['project'], ['source'], ['records']]);
    expect(await run(owner, { projected: false })).toEqual([['project'], ['records']]);
    expect(await run(owner, { slotIndex: 1 })).toEqual([['project']]);
    expect(await run(owner, { fixtureRows: [] })).toEqual([]);
    for (const index of [-1, 0.5, 50]) expect(await run(owner, { index })).toEqual([]);
    expect(owner.split('if (slot.found) {')).toHaveLength(2);
    expect(await run(owner.replace('if (slot.found) {', 'if (false && slot.found) {')))
      .not.toEqual(inspected);
    const earlyReturn = '      fillCodexDetail(sourceIndex);\n      return;';
    expect(owner.split(earlyReturn)).toHaveLength(2);
    expect(await run(owner.replace(earlyReturn, '      fillCodexDetail(sourceIndex);')))
      .not.toEqual(inspected);
    expect(await run()).toEqual(inspected);
    const detail = section(mainSource, 'function fillCodexDetail(', '\nfunction boundedCollectionActionsWritable(');
    expect(detail).toContain("back.addEventListener('click', () => fillCodex(codexFilter, codexReturnState));");
    expect(detail).toContain('back.focus();');
  });

  it('keeps missing-slot travel, failed-route preservation, and keyboard viewport focus with their existing owners', async () => {
    expect(await run(owner, { found: false })).toEqual([
      ['project'], ['finder', 0], ['travel'], ['close'], ['focus', { preventScroll: true }],
    ]);
    expect(await run(owner, { found: false, keyboard: false })).toEqual([
      ['project'], ['finder', 0], ['travel'], ['close'],
    ]);
    expect(await run(owner, { found: false, moved: false })).toEqual([
      ['project'], ['finder', 0], ['travel'],
    ]);
    expect(await run(owner, { found: false, located: false })).toEqual([
      ['project'], ['finder', 0], ['toast'],
    ]);
  });
});

describe('living-world Bioscan Main wiring', () => {
  it('keeps inspection read-only and connects one explicit durable Discover Life action', () => {
    expect(errors(mainSource)).toEqual([]);
  });

  it('keeps accepted st-scan on explicit Discover Life instead of Capture or Chapter 2 c2-scan', () => {
    expect(bioscanActionSource.match(/event: \{ kind: 'bioscan', address: captured\.address \}/gu))
      .toHaveLength(1);
    expect(bioscanActionSource).toContain('stageStarterCharterActionV1({');
    expect(captureActionSource).not.toContain("kind: 'bioscan'");
    expect(captureActionSource).not.toContain('stageStarterCharterActionV1({');
    expect(captureCapacitySource).not.toContain("kind: 'bioscan'");
    expect(captureCapacitySource).not.toContain("'st-scan'");
  });

  it('negative-controls publication and the living-world write boundary', () => {
    expect(errors(mainSource.replace(
      '      publishBioscanActionV1(sourceState, attempt);',
      '      void attempt.state;',
    ))).toContain('Bioscan is not one rechecked F4 commit and fixed-point publication');
    expect(errors(mainSource.replace(
      '      return Promise.resolve(true);',
      '      return settleArc9Survey(address);',
    ))).toContain('living inspection does not defer its Survey write to Discover Life');
    expect(errors(mainSource.replace(
      '        ...attempt.achievementIdsAdded,',
      '        // hostile survivor event omitted',
    ))).toContain('Bioscan is not one rechecked F4 commit and fixed-point publication');
    expect(errors(mainSource.replace(
      '        ...attempt.postHazardAggregateAchievementIdsAdded,',
      '        // post-hazard aggregate refresh omitted',
    ))).toContain('Bioscan is not one rechecked F4 commit and fixed-point publication');
    expect(errors(mainSource.replace(
      '        ...attempt.starterCharter.addedAchievementIds,',
      '        // accepted Starter Charter progression omitted',
    ))).toContain('Bioscan is not one rechecked F4 commit and fixed-point publication');
    expect(errors(mainSource.replace(
      '        const loadedLoot = readArc2Loot(runtime.extensions);',
      '        const loadedLoot = { kind: \'absent\' as const };',
    ))).toContain('Bioscan is not one rechecked F4 commit and fixed-point publication');
    expect(errors(mainSource.replace(
      '    codex: save.codex,',
      '    // Codex rollback parent omitted',
    ))).toContain('Paragon Bioscan does not protect Codex rollback or publish the combined ownership successor');
    expect(errors(mainSource.replace(
      '? [...ARC4_OWNERSHIP_EXTENSION_TARGETS, ...ARC5_OWNERSHIP_EXTENSION_TARGETS]',
      '? ARC5_OWNERSHIP_EXTENSION_TARGETS',
    ))).toContain('Bioscan is not one rechecked F4 commit and fixed-point publication');
    expect(errors(mainSource.replace(
      '        nextBestRankIndex: attempt.state.stats.bestRank ?? 0,',
      '        nextBestRankIndex: attempt.survey.successor.bestRank,',
    ))).toContain('Bioscan is not one rechecked F4 commit and fixed-point publication');
  });
});
