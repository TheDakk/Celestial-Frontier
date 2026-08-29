import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const mainSource = readFileSync(new URL('../apps/game/src/main.ts', import.meta.url), 'utf8');
const controllerSource = readFileSync(
  new URL('../apps/game/src/compendium-rename.ts', import.meta.url),
  'utf8',
);

function section(source: string, start: string, end: string): string {
  const at = source.indexOf(start);
  const stop = at < 0 ? -1 : source.indexOf(end, at + start.length);
  return at < 0 || stop < 0 ? '' : source.slice(at, stop);
}

function replaceExact(source: string, needle: string, replacement: string): string {
  const count = source.split(needle).length - 1;
  if (count !== 1) throw new Error(`Expected one mutation target, found ${count}: ${needle}`);
  return source.replace(needle, replacement);
}

function contractErrors(main: string, controller = controllerSource): string[] {
  const errors: string[] = [];
  const owner = section(
    main,
    'const compendiumRenameController = new CompendiumRenameController({',
    '\nfunction projectCurrentCompendiumFeed(',
  );
  const projection = section(
    main,
    'function projectCurrentCompendiumRename(',
    '\nfunction currentCompendiumDetailRow(',
  );
  const detail = section(main, 'function fillCodexDetail(', '\nfunction fillRecords(');
  const request = section(
    main,
    'function compendiumRenameRequestIsCurrent(',
    '\nfunction arc5RenameWritesMatchFixedInventory(',
  );
  const commit = section(
    main,
    'async function commitCompendiumRenameAction(',
    '\nfunction compendiumRenameOutcomeCopy(',
  );
  const copy = section(
    main,
    'function compendiumRenameOutcomeCopy(',
    '\nasync function runCompendiumRenameAction(',
  );
  const presentation = section(
    main,
    'async function runCompendiumRenameAction(',
    '\ntype Arc4CaptureActionOutcome',
  );
  const selector = section(main, 'const READ_ONLY_MUTATION_SELECTOR = [', "\n].join(',');");
  const click = section(
    controller,
    '  readonly #onClick = (event: Event): void => {',
    '\n  #render(): void {',
  );

  if (!main.includes('publishArc5RenameAchievementFields,')) {
    errors.push('achievement-publisher-import');
  }

  if (!owner.includes('onAction: (request) => {')
    || owner.split('void runCompendiumRenameAction(request);').length - 1 !== 1) {
    errors.push('controller-action-owner');
  }
  for (const marker of [
    'ownership: arc5OwnershipState,',
    'protected: arc5OwnershipProtection !== null || !f4RuntimeMayMutate(),',
    'fixture: compendiumFixtureRows !== null,',
  ]) if (!projection.includes(marker)) errors.push(`projection:${marker}`);

  for (const marker of [
    'data-arc5-rename-body',
    'compendiumRenameController.setState(renameModel);',
    'compendiumRenameController.attach(',
  ]) if (!detail.includes(marker)) errors.push(`detail:${marker}`);
  if (!main.includes('compendiumRenameController.detach();')
    || !main.includes('compendiumRenameController.setState(null);')
    || !main.includes('compendiumRenameController.dispose();')) errors.push('lifecycle-closure');

  for (const marker of [
    'Object.isFrozen(request)',
    "codexMode !== 'detail'",
    "openPanelId() !== 'codex'",
    'model.contextKey !== request.contextKey',
    'model.ownershipRevision !== request.ownershipRevision',
    'ownershipStateDigestV2(parent) !== request.ownershipDigest',
    'cleanName(request.rawName, 24) !== request.nicknameAfter',
    "creature?.status === 'ready'",
    'creature.nickname === request.nicknameBefore',
  ]) if (!request.includes(marker)) errors.push(`request:${marker}`);

  const ordered = [
    "productActionCoordinator.tryClaim('arc5.companion-rename')",
    "lastArc5RenameOutcome = 'pending';",
    'productActionInFlight = true;',
    'await smokeProductActionHold.holdIfArmed(actionClaim.operation);',
    'await settleF4Heartbeat();',
    'if (arc5OwnershipState !== parent || arc5OwnershipEvidence !== parentEvidence',
    'const attempt = await commitArc5RenameActionV1({',
    'durable = true;',
    'if (attempt.kind === \'committed-convergence\')',
    'if (!arc5RenameWritesMatchFixedInventory(attempt)',
    'publishArc5RenameAchievementFields(save, attempt.transaction.state);',
    'arc5OwnershipState = attempt.ownershipV2;',
    'lastArc5RenameResult = result;',
    'actionClaim.settle(durable);',
  ];
  let cursor = -1;
  for (const marker of ordered) {
    const at = commit.indexOf(marker, cursor + 1);
    if (at < 0) errors.push(`commit:${marker}`);
    else cursor = at;
  }
  for (const marker of [
    'JSON.stringify(otherSuccessors) !== JSON.stringify(otherParents)',
    'JSON.stringify(attempt.ownershipV2.catalogSpecies)',
    'JSON.stringify(attempt.ownershipV2.bredAcquisitions)',
    'JSON.stringify(attempt.ownershipV2.creatureTombstones)',
    'JSON.stringify(attempt.ownershipV2.specimenLots)',
    'JSON.stringify(attempt.ownershipV2.specimenTombstones)',
    "attempt.transaction.state.unlocked.filter((id) => id === 'namer').length !== 1",
    'JSON.stringify(save.unlocked) !== JSON.stringify(unlockedBefore)',
    'scheduleF4AuthorityConvergenceReload(',
    'trainingCheckpointWriteHeld',
  ]) if (!commit.includes(marker)) errors.push(`commit-fence:${marker}`);

  if (!copy.includes("title: 'Renamed.'")
    || !copy.includes('Species, lineage, traits, and its same-species twins are unchanged.')
    || !copy.includes("title: 'Rename saved — reload required.'")
    || !copy.includes('The current name remains unchanged.')) errors.push('terminal-copy');
  for (const marker of [
    'compendiumRenameController.settle(copy);',
    "if (copy.convergence === 'none') refreshCompendiumFeedState();",
    'protectArc5RenameAfterDurability(',
    'scheduleF4AuthorityConvergenceReload(',
  ]) if (!presentation.includes(marker)) errors.push(`presentation:${marker}`);
  if (!selector.includes("'[data-arc5-rename-confirm]'")) errors.push('read-only-selector');

  const pending = section(controller, '  #paintStatus(): void {', '\n  #normalizeSelection(): void {');
  if (!pending.includes('The current name remains shown until the save commits.')) {
    errors.push('non-optimistic-pending-copy');
  }
  if (!click.includes('this.#pending = request;')
    || click.indexOf('this.#render();') > click.indexOf('this.#onAction?.(request);')) {
    errors.push('pending-before-dispatch');
  }
  if (!controller.includes('input.maxLength = ARC5_COMPANION_NAME_MAX_V1;')
    || !controller.includes('cleanName(this.#rawName, ARC5_COMPANION_NAME_MAX_V1)')
    || !controller.includes('COMPENDIUM_RENAME_PAGE_SIZE_V1 = 24')) {
    errors.push('normalization-or-bound');
  }
  return errors;
}

describe('Arc 5 player-live companion rename wiring', () => {
  it('connects exact-instance Compendium rename to one durable coordinated writer', () => {
    expect(contractErrors(mainSource)).toEqual([]);
  });

  it('negative-controls coordinator, fixed point, non-optimism, and read-only protection', () => {
    expect(contractErrors(replaceExact(
      mainSource,
      "productActionCoordinator.tryClaim('arc5.companion-rename')",
      "productActionCoordinator.tryClaim('arc5.rename-uncoordinated')",
    ))).toContain("commit:productActionCoordinator.tryClaim('arc5.companion-rename')");
    expect(contractErrors(replaceExact(
      mainSource,
      'JSON.stringify(otherSuccessors) !== JSON.stringify(otherParents)',
      'false /* removed twin fixed point */',
    ))).toContain('commit-fence:JSON.stringify(otherSuccessors) !== JSON.stringify(otherParents)');
    expect(contractErrors(mainSource, replaceExact(
      controllerSource,
      'The current name remains shown until the save commits.',
      'The new name is already live.',
    ))).toContain('non-optimistic-pending-copy');
    expect(contractErrors(replaceExact(
      mainSource,
      "  '[data-arc5-rename-confirm]',\n",
      '',
    ))).toContain('read-only-selector');
    expect(contractErrors(replaceExact(
      mainSource,
      '      publishArc5RenameAchievementFields(save, attempt.transaction.state);\n',
      '',
    ))).toContain(
      'commit:publishArc5RenameAchievementFields(save, attempt.transaction.state);',
    );
  });

  it('keeps Back/Close safe by settling captured ownership instead of requiring retained DOM', () => {
    const commit = section(
      mainSource,
      'async function commitCompendiumRenameAction(',
      '\nfunction compendiumRenameOutcomeCopy(',
    );
    const afterHeartbeat = commit.slice(commit.indexOf('await settleF4Heartbeat();'));
    expect(afterHeartbeat).not.toContain('compendiumRenameRequestIsCurrent(request, parent)');
    expect(afterHeartbeat).not.toContain("openPanelId() !== 'codex'");
    expect(mainSource).toContain('compendiumRenameController.detach();');
    expect(controllerSource).toContain('this.#mount = null;');
  });
});
