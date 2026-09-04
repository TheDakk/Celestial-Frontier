import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const mainSource = readFileSync(new URL('../apps/game/src/main.ts', import.meta.url), 'utf8');
const controllerSource = readFileSync(
  new URL('../apps/game/src/compendium-scout.ts', import.meta.url),
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
    'const compendiumScoutController = new CompendiumScoutController({',
    '\nfunction projectCurrentCompendiumAudition(',
  );
  const projection = section(
    main,
    'function projectCurrentCompendiumScout(',
    '\nfunction currentCompendiumDetailRow(',
  );
  const refresh = section(
    main,
    'function refreshCompendiumFeedState(): void {',
    '\nfunction disposeCodexList(',
  );
  const detail = section(main, 'function fillCodexDetail(', '\nfunction fillRecords(');
  const request = section(
    main,
    'function compendiumScoutRequestIsCurrent(',
    '\nfunction arc5ScoutWritesMatchFixedInventory(',
  );
  const commit = section(
    main,
    'async function commitCompendiumScoutAction(',
    '\nfunction compendiumScoutOutcomeCopy(',
  );
  const copy = section(
    main,
    'function compendiumScoutOutcomeCopy(',
    '\nasync function runCompendiumScoutAction(',
  );
  const presentation = section(
    main,
    'async function runCompendiumScoutAction(',
    '\ntype Arc4CaptureActionOutcome',
  );
  const selector = section(main, 'const READ_ONLY_MUTATION_SELECTOR = [', "\n].join(',');");
  const click = section(
    controller,
    '  readonly #onClick = (event: Event): void => {',
    '\n  #render(): void {',
  );

  for (const marker of [
    'COMPENDIUM_SCOUT_OUTCOME_SCHEMA,',
    'CompendiumScoutController,',
    'projectCompendiumScoutV1,',
    'type CompendiumScoutActionRequestV1,',
    'commitArc5ScoutActionV1,',
    'publishArc5ScoutCharterFieldsV1,',
    'type Arc5ScoutActionOutcomeV1,',
  ]) if (!main.includes(marker)) errors.push(`import:${marker}`);

  for (const marker of [
    'codexGeneration === surface.generation',
    "codexMode === 'detail'",
    'codexDetailLogicalId === surface.logicalId',
    "openPanelId() === 'codex'",
    'void runCompendiumScoutAction(request);',
  ]) if (!owner.includes(marker)) errors.push(`owner:${marker}`);

  for (const marker of [
    'generation,',
    'logicalId: String(row[0]),',
    'record: row[1],',
    'ownership: arc5OwnershipState,',
    'protected: arc5OwnershipProtection !== null || !f4RuntimeMayMutate(),',
    'fixture: compendiumFixtureRows !== null,',
  ]) if (!projection.includes(marker)) errors.push(`projection:${marker}`);

  if (detail.split('<section class="compendium-feed" data-arc5-scout-body').length - 1 !== 1) {
    errors.push('detail:exact-one-scout-mount');
  }
  for (const marker of [
    'const scoutModel = projectCurrentCompendiumScout(row, generation);',
    'scoutModel.surface.speciesId !== null',
    "scoutModel.availability !== 'non-fauna'",
    "scoutModel.availability !== 'fixture'",
    'compendiumScoutController.setState(scoutModel);',
    'compendiumScoutController.attach(',
  ]) if (!detail.includes(marker)) errors.push(`detail:${marker}`);

  for (const marker of [
    'const projectedScout = projectCurrentCompendiumScout(row, codexGeneration);',
    'compendiumScoutController.setState(projectedScout);',
    'compendiumScoutController.refresh();',
  ]) if (!refresh.includes(marker)) errors.push(`refresh:${marker}`);
  if (main.split('compendiumScoutController.detach();').length - 1 !== 3
    || main.split('compendiumScoutController.setState(null);').length - 1 !== 3
    || main.split('compendiumScoutController.dispose();').length - 1 !== 1) {
    errors.push('lifecycle:detach-state-dispose');
  }

  for (const marker of [
    'Object.isFrozen(request)',
    'Object.isFrozen(request.surface)',
    'codexGeneration !== request.surface.generation',
    'codexDetailLogicalId !== request.surface.logicalId',
    'model.contextKey !== request.contextKey',
    'model.surface.generation !== request.surface.generation',
    'model.surface.logicalId !== request.surface.logicalId',
    'model.surface.speciesId !== request.surface.speciesId',
    'model.surface.surfaceKey !== request.surface.surfaceKey',
    'model.ownershipRevision !== request.ownershipRevision',
    'model.ownershipDigest !== request.ownershipDigest',
    'model.scoutCreatureId !== request.scoutBefore',
    'parent.revision !== request.ownershipRevision',
    'ownershipStateDigestV2(parent) !== request.ownershipDigest',
    'parent.scoutCreatureId !== request.scoutBefore',
    'request.scoutAfter === null',
    'candidate.creatureId === request.scoutBefore',
    "target?.status === 'ready' && !target.current",
    'request.scoutAfter !== request.scoutBefore',
  ]) if (!request.includes(marker)) errors.push(`request:${marker}`);

  const ordered = [
    "productActionCoordinator.tryClaim('arc5.field-scout')",
    "lastArc5ScoutOutcome = 'pending';",
    'productActionInFlight = true;',
    'await smokeProductActionHold.holdIfArmed(actionClaim.operation);',
    'await settleF4Heartbeat();',
    'if (arc5OwnershipState !== parent || arc5OwnershipEvidence !== parentEvidence',
    'const attempt = await commitArc5ScoutActionV1({',
    'durable = true;',
    "if (attempt.kind === 'committed-convergence')",
    'const checkpoint = runtime.checkpointParent();',
    'const starterCharterChanged = attempt.starterCharter?.changed === true;',
    'const transactionStateChanged = JSON.stringify(attempt.transaction.state) !== saveBefore;',
    'if (runtime !== f4Runtime',
    "throw new Error('arc5-scout-fixed-point-mismatch');",
    'publishArc5ScoutCharterFieldsV1(sourceState, attempt.transaction.state);',
    'arc5OwnershipState = attempt.ownershipV2;',
    'arc5OwnershipEvidence = attempt.ownershipV2Evidence;',
    'lastArc5ScoutResult = result;',
    'actionClaim.settle(durable);',
    'if (durable) queueArc9ProgressionRefresh(actionClaim.operation);',
  ];
  let cursor = -1;
  for (const marker of ordered) {
    const at = commit.indexOf(marker, cursor + 1);
    if (at < 0) errors.push(`commit-order:${marker}`);
    else cursor = at;
  }
  const claim = commit.indexOf("productActionCoordinator.tryClaim('arc5.field-scout')");
  const firstAwait = commit.indexOf('await ');
  if (claim < 0 || firstAwait < 0 || claim > firstAwait) errors.push('claim-before-first-await');
  if (commit.split('commitArc5ScoutActionV1({').length - 1 !== 1
    || /\b(?:for|while)\s*\([^)]*\)[\s\S]{0,600}commitArc5ScoutActionV1\(/u.test(commit)) {
    errors.push('one-cas-no-retry');
  }
  for (const marker of [
    'smokeForceReadOnly',
    'f4RuntimeMayMutate(runtime)',
    'activePersist',
    'importWriteInFlight',
    'replacementTransaction',
    'replacementReloadPending',
    'trainingCheckpointWriteHeld',
  ]) if (!commit.includes(marker)) errors.push(`write-gate:${marker}`);

  for (const marker of [
    'attempt.ownershipWrites.length === ARC5_OWNERSHIP_EXTENSION_TARGETS.length',
    'write.segment === ARC5_OWNERSHIP_EXTENSION_TARGETS[index]!.segment',
    'write.namespace === ARC5_OWNERSHIP_EXTENSION_TARGETS[index]!.namespace',
  ]) if (!main.includes(marker)) errors.push(`fixed-point:${marker}`);
  for (const marker of [
    '!arc5ScoutWritesMatchFixedInventory(attempt)',
    'attempt.ownershipV2.revision !== parentRevision + 1',
    'ownershipStateDigestV1(ownershipSourceStateV1(attempt.ownershipV2))',
    'ownershipStateDigestV2(attempt.ownershipV2)',
    'settlement.preflight.parentRevision !== parentRevision',
    'settlement.preflight.parentDigest !== parentDigest',
    'settlement.preflight.scoutBefore !== request.scoutBefore',
    'settlement.preflight.scoutAfter !== request.scoutAfter',
    'attempt.ownershipV2.scoutCreatureId !== request.scoutAfter',
    "attempt.transaction.plan.operation !== 'field-scout'",
    "attempt.transaction.receipt.kind !== 'arc5-field-scout'",
    'JSON.stringify(checkpoint) !== JSON.stringify(attempt.transaction.state)',
    'JSON.stringify(attempt.transaction.saved.canonicalState)',
    'starterCharterChanged !== transactionStateChanged',
    '(request.scoutAfter === null) !== (attempt.starterCharter === null)',
    "attempt.starterCharter.event.kind !== 'scout-set'",
    'JSON.stringify(sourceState) !== saveBefore',
    'arc5ScoutCharterFieldsMatch(sourceState, attempt.transaction.state)',
    'JSON.stringify(attempt.ownershipV2.catalogSpecies)',
    'JSON.stringify(attempt.ownershipV2.acquisitions)',
    'JSON.stringify(attempt.ownershipV2.bredAcquisitions)',
    'JSON.stringify(attempt.ownershipV2.creatures)',
    'JSON.stringify(attempt.ownershipV2.creatureTombstones)',
    'JSON.stringify(attempt.ownershipV2.specimenLots)',
    'JSON.stringify(attempt.ownershipV2.specimenTombstones)',
    'JSON.stringify(attempt.ownershipV2.biosphereProgress)',
    'JSON.stringify(attempt.ownershipV2.legacyBioX)',
    'JSON.stringify(attempt.ownershipV2.legacyProtection)',
  ]) if (!commit.includes(marker)) errors.push(`fixed-point:${marker}`);
  if (commit.split('arc5OwnershipState = attempt.ownershipV2;').length - 1 !== 1
    || commit.split('arc5OwnershipEvidence = attempt.ownershipV2Evidence;').length - 1 !== 1
    || commit.split('publishArc5ScoutCharterFieldsV1(sourceState, attempt.transaction.state);').length - 1 !== 1) {
    errors.push('verified-publication-only');
  }
  if (!commit.includes('if (starterCharterChanged) {\n        publishArc5ScoutCharterFieldsV1(')
    || commit.split('restoreScoutCharterPublication();').length - 1 !== 2) {
    errors.push('charter-publication-gate-or-rollback');
  }
  for (const marker of [
    'scheduleF4AuthorityConvergenceReload(',
    'protectArc5ScoutAfterDurability(',
  ]) if (!commit.includes(marker)) errors.push(`convergence:${marker}`);

  for (const marker of [
    "title: stoodDown ? 'Field Scout stood down.' : 'Field Scout named.'",
    "title: 'Field Scout saved — reload required.'",
    'The saved Field Scout remains unchanged.',
  ]) if (!copy.includes(marker)) errors.push(`copy:${marker}`);
  for (const marker of [
    'compendiumScoutController.settle(copy);',
    "if (copy.convergence === 'none') refreshCompendiumFeedState();",
    'protectArc5ScoutAfterDurability(',
    'scheduleF4AuthorityConvergenceReload(',
  ]) if (!presentation.includes(marker)) errors.push(`presentation:${marker}`);
  if (!selector.includes("'[data-arc5-scout-confirm]'")) errors.push('read-only-selector');
  if (!main.includes('lastArc5ScoutOutcome = null;')
    || !main.includes('lastArc5ScoutResult = null;')
    || !main.includes('controller: compendiumScoutController.diagnostics(),')) {
    errors.push('reset-or-diagnostics');
  }

  const pending = section(controller, '  #paintStatus(): void {', '\n  #status(): HTMLElement | null {');
  if (pending.split('The saved Scout remains unchanged until commit.').length - 1 !== 2) {
    errors.push('non-optimistic-pending-copy');
  }
  if (!click.includes('this.#pending = request;')
    || click.indexOf('this.#render();') > click.indexOf('this.#onAction?.(request);')) {
    errors.push('pending-before-dispatch');
  }
  return errors;
}

describe('Arc 5 player-live Field Scout wiring', () => {
  it('connects one verified real-fauna Compendium surface to the exact owner', () => {
    expect(contractErrors(mainSource)).toEqual([]);
  });

  it('negative-controls surface, coordinator, heartbeat, fixed point, and non-optimism', () => {
    expect(contractErrors(replaceExact(
      mainSource,
      "productActionCoordinator.tryClaim('arc5.field-scout')",
      "productActionCoordinator.tryClaim('arc5.scout-uncoordinated')",
    ))).toContain("commit-order:productActionCoordinator.tryClaim('arc5.field-scout')");
    expect(contractErrors(replaceExact(
      mainSource,
      "const model = projectCurrentCompendiumScout(row, request.surface.generation);\n"
        + "  if (model === null || model.availability !== 'ready'\n"
        + '    || model.contextKey !== request.contextKey',
      "const model = projectCurrentCompendiumScout(row, request.surface.generation);\n"
        + "  if (model === null || model.availability !== 'ready'\n"
        + '    || false /* removed Scout context fence */',
    ))).toContain('request:model.contextKey !== request.contextKey');
    expect(contractErrors(replaceExact(
      mainSource,
      "  lastArc5ScoutOutcome = 'pending';\n"
        + '  productActionInFlight = true;\n'
        + '  activePersist = actionBarrier;\n'
        + '  let durable = false;\n'
        + '  try {\n'
        + '    await smokeProductActionHold.holdIfArmed(actionClaim.operation);\n'
        + '    await settleF4Heartbeat();',
      "  lastArc5ScoutOutcome = 'pending';\n"
        + '  productActionInFlight = true;\n'
        + '  activePersist = actionBarrier;\n'
        + '  let durable = false;\n'
        + '  try {\n'
        + '    await smokeProductActionHold.holdIfArmed(actionClaim.operation);',
    ))).toContain('commit-order:await settleF4Heartbeat();');
    expect(contractErrors(replaceExact(
      mainSource,
      '|| !arc5ScoutWritesMatchFixedInventory(attempt)',
      '|| false /* removed exact-five proof */',
    ))).toContain('fixed-point:!arc5ScoutWritesMatchFixedInventory(attempt)');
    expect(contractErrors(replaceExact(
      mainSource,
      'starterCharterChanged !== transactionStateChanged',
      'transactionStateChanged /* obsolete always-unchanged-save verifier */',
    ))).toContain('fixed-point:starterCharterChanged !== transactionStateChanged');
    expect(contractErrors(replaceExact(
      mainSource,
      'JSON.stringify(attempt.ownershipV2.creatures)\n          !== JSON.stringify(parent.creatures)',
      'false /* removed unchanged-creatures proof */',
    ))).toContain('fixed-point:JSON.stringify(attempt.ownershipV2.creatures)');
    expect(contractErrors(replaceExact(
      mainSource,
      '    try {\n'
        + '      const settlement = attempt.settlement;\n'
        + '      const checkpoint = runtime.checkpointParent();',
      '    try {\n'
        + '      arc5OwnershipState = attempt.ownershipV2;\n'
        + '      const settlement = attempt.settlement;\n'
        + '      const checkpoint = runtime.checkpointParent();',
    ))).toContain('verified-publication-only');
    expect(contractErrors(replaceExact(
      mainSource,
      '        publishArc5ScoutCharterFieldsV1(sourceState, attempt.transaction.state);',
      '        /* same-CAS Starter Charter publication omitted */',
    ))).toContain('verified-publication-only');
    expect(contractErrors(replaceExact(
      mainSource,
      "  '[data-arc5-scout-confirm]',\n",
      '',
    ))).toContain('read-only-selector');
    expect(contractErrors(replaceExact(
      mainSource,
      "    lastArc5ScoutOutcome = 'rejected';\n"
        + '    return Object.freeze({\n'
        + "      kind: 'refused', durability: 'none', convergence: 'none',\n"
        + '      detail: error instanceof Error ? error.message : String(error), result: null,\n'
        + '    });\n'
        + '  } finally {\n'
        + '    productActionInFlight = false;\n'
        + '    actionClaim.settle(durable);\n'
        + '    if (durable) queueArc9ProgressionRefresh(actionClaim.operation);',
      "    lastArc5ScoutOutcome = 'rejected';\n"
        + '    return Object.freeze({\n'
        + "      kind: 'refused', durability: 'none', convergence: 'none',\n"
        + '      detail: error instanceof Error ? error.message : String(error), result: null,\n'
        + '    });\n'
        + '  } finally {\n'
        + '    productActionInFlight = false;\n'
        + '    actionClaim.settle(durable);',
    ))).toContain(
      'commit-order:if (durable) queueArc9ProgressionRefresh(actionClaim.operation);',
    );
    expect(contractErrors(mainSource, replaceExact(
      controllerSource,
      "        : 'Naming Field Scout… The saved Scout remains unchanged until commit.';",
      "        : 'Naming Field Scout… The new Scout is already active.';",
    ))).toContain('non-optimistic-pending-copy');
  });

  it('allows Back and Close after capture without consulting stale DOM again', () => {
    const commit = section(
      mainSource,
      'async function commitCompendiumScoutAction(',
      '\nfunction compendiumScoutOutcomeCopy(',
    );
    const afterHeartbeat = commit.slice(commit.indexOf('await settleF4Heartbeat();'));
    expect(afterHeartbeat).not.toContain('compendiumScoutRequestIsCurrent(request, parent)');
    expect(afterHeartbeat).not.toContain("openPanelId() !== 'codex'");
    expect(mainSource).toContain('compendiumScoutController.detach();');
    expect(controllerSource).toContain('this.#mount = null;');
  });
});
