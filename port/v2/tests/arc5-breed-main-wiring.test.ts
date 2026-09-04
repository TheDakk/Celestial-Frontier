import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const mainSource = readFileSync(new URL('../apps/game/src/main.ts', import.meta.url), 'utf8');
const controllerSource = readFileSync(
  new URL('../apps/game/src/compendium-breed.ts', import.meta.url),
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

function replaceInSectionExact(
  source: string,
  start: string,
  end: string,
  needle: string,
  replacement: string,
): string {
  const body = section(source, start, end);
  if (body.length === 0 || body.split(needle).length - 1 !== 1) {
    throw new Error(`Expected one bounded mutation target: ${needle}`);
  }
  return source.replace(body, body.replace(needle, replacement));
}

function contractErrors(main: string, controller = controllerSource): string[] {
  const errors: string[] = [];
  const owner = section(
    main,
    'const compendiumBreedController = new CompendiumBreedController({',
    '\nfunction projectCurrentCompendiumFeed(',
  );
  const projection = section(
    main,
    'function projectCurrentCompendiumBreed(',
    '\nfunction currentCompendiumDetailRow(',
  );
  const detail = section(main, 'function fillCodexDetail(', '\nfunction fillRecords(');
  const commit = section(
    main,
    'async function commitCompendiumBreedAction(',
    '\nfunction compendiumBreedOutcomeCopy(',
  );
  const copy = section(
    main,
    'function compendiumBreedOutcomeCopy(',
    '\nasync function runCompendiumBreedAction(',
  );
  const presentation = section(
    main,
    'async function runCompendiumBreedAction(',
    '\ntype Arc4CaptureActionOutcome',
  );
  const selector = section(main, 'const READ_ONLY_MUTATION_SELECTOR = [', "\n].join(',');");
  const controllerClick = section(
    controller,
    '  readonly #onClick = (event: Event): void => {',
    '\n  #render(): void {',
  );

  if (!owner.includes('onAction: (request) => {')
    || owner.split('void runCompendiumBreedAction(request);').length - 1 !== 1) {
    errors.push('controller-action-owner');
  }
  for (const marker of [
    'activePlayMs: f4Runtime?.diagnostics().activePlayMs ?? 0,',
    'earnedStardust: save.stats.essenceEarned ?? 0,',
    'protected: arc5OwnershipProtection !== null || !f4RuntimeMayMutate(),',
  ]) if (!projection.includes(marker)) errors.push(`projection:${marker}`);
  if (!detail.includes('data-arc5-breed-body')
    || !detail.includes('compendiumBreedController.attach(')
    || !detail.includes("breedModel.availability !== 'non-fauna'")
    || !detail.includes("breedModel.availability !== 'fixture'")) {
    errors.push('real-fauna-detail-mount');
  }
  if (!selector.includes("'[data-arc5-breed-confirm]'")) errors.push('read-only-selector');

  const pending = controllerClick.indexOf('this.#pending = request;');
  const render = controllerClick.indexOf('this.#render();', pending);
  const dispatch = controllerClick.indexOf('this.#onAction?.(request);');
  if (!(pending >= 0 && render > pending && dispatch > render)) {
    errors.push('pending-painted-before-dispatch');
  }
  for (const marker of [
    'No child or Recovery is shown until the save commits.',
    'Both parents remain yours.',
    'Recovery blocks Breed, combat, and dispatch.',
    'companionBreedOddsV1(left.tier, right.tier, state.earnedStardustBonus)',
    'rows.slice(start, start + COMPENDIUM_BREED_PARENT_PAGE_SIZE_V1)',
    "input.dataset.sameParent = String(sameParent);",
  ]) if (!controller.includes(marker)) errors.push(`controller-contract:${marker}`);

  const claim = commit.indexOf("productActionCoordinator.tryClaim('arc5.companion-breed')");
  const firstAwait = commit.indexOf('await ');
  if (claim < 0 || firstAwait < 0 || claim > firstAwait) errors.push('claim-before-first-await');
  const currentRequest = commit.indexOf('compendiumBreedRequestIsCurrent(request, parent)');
  if (currentRequest < 0 || currentRequest > claim) errors.push('current-request-before-claim');
  for (const marker of [
    'const runtime = f4Runtime;',
    'const parent = arc5OwnershipState;',
    'const parentEvidence = arc5OwnershipEvidence;',
    'const parentRevision = parent.revision;',
    'const parentDigest = ownershipStateDigestV2(parent);',
    'const sourceState = save;',
    'const priorBreedPublication = Object.freeze({',
    'const xpFirstsBefore = JSON.stringify(sourceState.xpFirsts);',
    'const xpFirstsBindingBefore = JSON.stringify(sourceState.xpFirstsBinding ?? null);',
  ]) if (!commit.includes(marker) || commit.indexOf(marker) > firstAwait) {
    errors.push(`captured-before-await:${marker}`);
  }
  if (commit.split('commitArc5BreedActionV1({').length - 1 !== 1) {
    errors.push('one-breed-attempt');
  }
  if (!commit.includes('arc5BreedWritesMatchFixedInventory(attempt)')
    || !main.includes('attempt.ownershipWrites.length === ARC5_OWNERSHIP_EXTENSION_TARGETS.length')
    || !main.includes('write.segment === ARC5_OWNERSHIP_EXTENSION_TARGETS[index]!.segment')
    || !main.includes('write.namespace === ARC5_OWNERSHIP_EXTENSION_TARGETS[index]!.namespace')) {
    errors.push('exact-five-carriers');
  }
  for (const marker of [
    'scenario.preflight.parentCreatureIds[0] !== leftId',
    'scenario.preflight.parentCreatureIds[1] !== rightId',
    'scenario.preflight.parentSpeciesIds[0] !== scenario.parentsBefore[0].speciesId',
    'scenario.preflight.parentSpeciesIds[1] !== scenario.parentsBefore[1].speciesId',
    'scenario.preflight.earnedStardustBonus !== request.earnedStardustBonus',
    'scenario.preflight.odds !== request.odds',
    'runtime !== f4Runtime',
    'save !== sourceState',
    'runtime.revision !== attempt.transaction.revision',
    'JSON.stringify(checkpoint) !== JSON.stringify(attempt.transaction.state)',
    'JSON.stringify(attempt.transaction.state)',
    'JSON.stringify(attempt.transaction.saved.canonicalState)',
    'sourceState.ascCh !== charterAscChBefore',
    'JSON.stringify(sourceState.ascProg) !== charterProgressBefore',
    'JSON.stringify(sourceState.xpFirsts) !== xpFirstsBefore',
    'JSON.stringify(sourceState.xpFirstsBinding ?? null) !== xpFirstsBindingBefore',
    "attempt.transaction.state.ascProg['c3-breed'] !== charterBredBefore + 1",
    "attempt.charterBredBanked && scenario.result !== 'success'",
    "leftAfter?.assignment?.kind !== 'recovery'",
    "rightAfter?.assignment?.kind !== 'recovery'",
    'attempt.childXpAwarded !== scenario.childXpAwarded',
    'attempt.speciesPairXpKey !== scenario.speciesPairXpKey',
    'attempt.speciesPairFirstXpAwarded !== scenario.speciesPairFirst',
    'childAfter.xp !== scenario.childXpAwarded',
    'publishArc5BreedSaveFieldsV1(sourceState, attempt.transaction.state);',
    "throw new Error('arc5-breed-save-publication-mismatch');",
    'restoreBreedPublication();',
    'arc5OwnershipState = attempt.ownershipV2;',
    'arc5OwnershipEvidence = attempt.ownershipV2Evidence;',
    'lastArc5BreedResult = result;',
  ]) if (!commit.includes(marker)) errors.push(`verified-publication:${marker}`);
  const fixedPointFailure = commit.indexOf("throw new Error('arc5-breed-fixed-point-mismatch');");
  const charterPublish = commit.indexOf('publishArc5BreedSaveFieldsV1(sourceState, attempt.transaction.state);');
  const publicationProof = commit.indexOf("throw new Error('arc5-breed-save-publication-mismatch');", charterPublish);
  const ownershipPublish = commit.indexOf('arc5OwnershipState = attempt.ownershipV2;');
  if (commit.split('arc5OwnershipState = attempt.ownershipV2;').length - 1 !== 1
    || commit.split('publishArc5BreedSaveFieldsV1(sourceState, attempt.transaction.state);').length - 1 !== 1
    || fixedPointFailure < 0 || charterPublish < fixedPointFailure
    || publicationProof < charterPublish || ownershipPublish < publicationProof) {
    errors.push('verified-publication:arc5OwnershipState = attempt.ownershipV2;');
  }
  if (commit.split('restoreBreedPublication();').length - 1 !== 2) {
    errors.push('breed-save-publication-rollback');
  }
  if (/\b(?:for|while)\s*\([^)]*\)[\s\S]{0,600}commitArc5BreedActionV1\(/u.test(commit)) {
    errors.push('breed-retry-loop');
  }
  if (!commit.includes("if (attempt.convergence === 'read-only-reload')")
    || !commit.includes('scheduleF4AuthorityConvergenceReload(')
    || !commit.includes('protectArc5BreedAfterDurability(')) {
    errors.push('read-only-convergence');
  }

  if (!copy.includes("if (outcome.kind === 'committed' && outcome.convergence === 'none'")
    || !copy.includes("outcome.result.result === 'success'")
    || !copy.includes("kind: 'committed-success'")
    || !copy.includes("kind: 'committed-failure'")
    || !copy.includes("kind: 'committed-convergence'")
    || !copy.includes('The child gained ${outcome.result.childXpAwarded} XP')
    || !copy.includes('one-time +5 XP for this exact species pairing')
    || !copy.includes('This attempt made no draw and added no Recovery or child.')) {
    errors.push('committed-only-outcome-copy');
  }
  const settle = presentation.indexOf('compendiumBreedController.settle(copy);');
  const refresh = presentation.indexOf('refreshCompendiumFeedState();');
  if (!(settle >= 0 && refresh > settle)) errors.push('settle-before-refresh');
  if (!main.includes('compendiumBreedController.detach();')
    || !main.includes('compendiumBreedController.setState(null);')
    || !main.includes('compendiumBreedController.dispose();')) {
    errors.push('controller-lifecycle');
  }
  if (!main.includes("heartbeatOwned && openPanelId() === 'codex' && codexMode === 'detail'")
    || !main.includes('compendiumBreedController.setState(projectedBreed);')) {
    errors.push('active-play-recovery-refresh');
  }
  return errors;
}

describe('player-live Compendium Breed + Recovery wiring', () => {
  it('owns one exact nonoptimistic attempt through verified durable publication', () => {
    expect(contractErrors(mainSource)).toEqual([]);
  });

  it('rejects optimistic, stale, duplicate, unbounded, and unverified wiring mutants', () => {
    const mutants: Array<[string, string, string, string?]> = [
      [
        'claim removed',
        mainSource.replace(
          "productActionCoordinator.tryClaim('arc5.companion-breed')",
          "productActionCoordinator.peek('arc5.companion-breed')",
        ),
        'claim-before-first-await',
      ],
      [
        'current request recheck removed',
        mainSource.replace('compendiumBreedRequestIsCurrent(request, parent)', 'true'),
        'current-request-before-claim',
      ],
      [
        'second attempt',
        mainSource.replace(
          'const attempt = await commitArc5BreedActionV1({',
          'void commitArc5BreedActionV1({ ...({} as never) });\n'
            + '    const attempt = await commitArc5BreedActionV1({',
        ),
        'one-breed-attempt',
      ],
      [
        'carrier verification removed',
        mainSource.replace('arc5BreedWritesMatchFixedInventory(attempt)', 'true'),
        'exact-five-carriers',
      ],
      [
        'publication before verification',
        mainSource.replace(
          'const scenario = attempt.settlement.scenario;',
          'arc5OwnershipState = attempt.ownershipV2;\n      const scenario = attempt.settlement.scenario;',
        ),
        'verified-publication:arc5OwnershipState = attempt.ownershipV2;',
      ],
      [
        'Charter publication before verification',
        mainSource.replace(
          'const scenario = attempt.settlement.scenario;',
          'publishArc5BreedSaveFieldsV1(sourceState, attempt.transaction.state);\n'
            + '      const scenario = attempt.settlement.scenario;',
        ),
        'verified-publication:arc5OwnershipState = attempt.ownershipV2;',
      ],
      [
        'XP-first live-state guard removed',
        mainSource.replace(
          'JSON.stringify(sourceState.xpFirsts) !== xpFirstsBefore',
          'false',
        ),
        'verified-publication:JSON.stringify(sourceState.xpFirsts) !== xpFirstsBefore',
      ],
      [
        'child XP fixed point removed',
        mainSource.replace(
          'attempt.childXpAwarded !== scenario.childXpAwarded',
          'false',
        ),
        'verified-publication:attempt.childXpAwarded !== scenario.childXpAwarded',
      ],
      [
        'runtime checkpoint proof removed',
        replaceInSectionExact(
          mainSource,
          'async function commitCompendiumBreedAction(',
          '\nfunction compendiumBreedOutcomeCopy(',
          'JSON.stringify(checkpoint) !== JSON.stringify(attempt.transaction.state)',
          'false',
        ),
        'verified-publication:JSON.stringify(checkpoint) !== JSON.stringify(attempt.transaction.state)',
      ],
      [
        'post-publication proof removed',
        mainSource.replace(
          "throw new Error('arc5-breed-save-publication-mismatch');",
          '/* mutation control accepts partial XP publication */',
        ),
        "verified-publication:throw new Error('arc5-breed-save-publication-mismatch');",
      ],
      [
        'post-publication rollback removed',
        mainSource.replace(
          '    } catch (error) {\n      restoreBreedPublication();\n      const detail = error instanceof Error ? error.message : String(error);',
          '    } catch (error) {\n      const detail = error instanceof Error ? error.message : String(error);',
        ),
        'breed-save-publication-rollback',
      ],
      [
        'pending render removed',
        controllerSource.replace('    this.#render();\n    this.#focusStatus();', '    this.#focusStatus();'),
        'pending-painted-before-dispatch',
        'controller',
      ],
      [
        'unbounded mate rows',
        controllerSource.replace(
          'rows.slice(start, start + COMPENDIUM_BREED_PARENT_PAGE_SIZE_V1)',
          'rows.slice(start)',
        ),
        'controller-contract:rows.slice(start, start + COMPENDIUM_BREED_PARENT_PAGE_SIZE_V1)',
        'controller',
      ],
      [
        'optimistic success copy',
        mainSource.replace(
          "function compendiumBreedOutcomeCopy(\n  request: CompendiumBreedActionRequestV1,\n  outcome: Arc5BreedCommitOutcome,\n): CompendiumBreedActionOutcomeV1 {\n  if (outcome.kind === 'committed' && outcome.convergence === 'none'",
          "function compendiumBreedOutcomeCopy(\n  request: CompendiumBreedActionRequestV1,\n  outcome: Arc5BreedCommitOutcome,\n): CompendiumBreedActionOutcomeV1 {\n  if (outcome.kind !== 'refused'",
        ),
        'committed-only-outcome-copy',
      ],
      [
        'settle after refresh',
        replaceExact(
          mainSource,
          '    compendiumBreedController.settle(copy);\n    if (copy.convergence === \'none\') refreshCompendiumFeedState();',
          '    if (copy.convergence === \'none\') refreshCompendiumFeedState();\n'
            + '    compendiumBreedController.settle(copy);',
        ),
        'settle-before-refresh',
      ],
    ];
    for (const [name, source, expected, target] of mutants) {
      const errors = target === 'controller'
        ? contractErrors(mainSource, source)
        : contractErrors(source);
      expect(errors, name).toContain(expected);
    }
  });
});
