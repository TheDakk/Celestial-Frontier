import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const mainSource = fs.readFileSync(path.join(here, '../apps/game/src/main.ts'), 'utf8');
const sliceSmokeSource = fs.readFileSync(path.join(here, '../tools/slicesmoke.mjs'), 'utf8');

function section(source: string, startText: string, endText: string): string {
  const start = source.indexOf(startText);
  const end = source.indexOf(endText, start);
  return start >= 0 && end > start ? source.slice(start, end) : '';
}

function replaceExact(source: string, needle: string, replacement: string): string {
  if (source.split(needle).length !== 2) {
    throw new Error(`progression ceremony mutation target is not exact: ${needle}`);
  }
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
    throw new Error(`progression ceremony section target is not exact: ${startText} :: ${needle}`);
  }
  return source.replace(body, body.replace(needle, replacement));
}

function inOrder(body: string, needles: readonly string[]): boolean {
  let cursor = -1;
  for (const needle of needles) {
    cursor = body.indexOf(needle, cursor + 1);
    if (cursor < 0) return false;
  }
  return true;
}

function exactCallCount(body: string): number {
  return [...body.matchAll(/presentProgressionCeremony\(\{/gu)].length;
}

function saturatedCharterCeremonySmokeErrors(source: string): string[] {
  const errors: string[] = [];
  const heldBoundary = section(
    source,
    '    const ceremonyRaceArmed = expectedChapter === 3',
    '\n    let outcome;',
  );
  if (!inOrder(heldBoundary, [
    'window.__CF_SLICE__.api.__smokeArmProductActionHold()',
    'await touchNav(settledLandAction.x, settledLandAction.y);',
    'held Land ceremony boundary',
    "toast.style.opacity='0'",
    'guarded Share ceremony callback',
    'p?.drainCallbacks>b.drainCallbacks',
    'p?.inFlightDeferrals>b.inFlightDeferrals',
    'p?.deliveries===b.deliveries',
    'JSON.stringify(p?.queueKeys)===JSON.stringify(b.queueKeys)',
    'window.__CF_SLICE__.api.__smokeReleaseProductActionHold()',
  ])) {
    errors.push('held Land boundary does not witness a real deferred callback with its queue intact');
  }
  const resumedBoundary = section(
    source,
    "    if (expectedChapter === 3) {\n      const progressionBeforeResume = outcome.progressionCeremony;",
    '\n    const revisionTopologyControl = structuredClone(landAuthority);',
  );
  if (!inOrder(resumedBoundary, [
    "progressionBeforeResume?.queueKeys?.[0] !== 'achievement:share'",
    "?.filter((key) => key === 'achievement:share').length !== 1",
    'progressionBeforeResume?.deliveries !== beforeLand.progressionCeremony.deliveries',
    "toast.style.opacity='0'",
    'resumed Share ceremony delivery',
    'p?.deliveries===b.deliveries+1',
    "p?.lastDeliveredKey==='achievement:share'",
    'JSON.stringify(p.queueKeys)===JSON.stringify(b.queueKeys.slice(1))',
    's.toastOn===true',
    's.toastSerial===${outcome.toastSerial + 1}',
    '/Achievement · Signal Sent/i.test(s.toastText)',
    '/Share a discovery code/i.test(s.toastText)',
    'const postCeremonyAuthority = await readNavPhF4AuthoritySnapshot();',
    'durableProjection: charterDurableProjection(delivered)',
    'resumedShareCeremony?.postCeremonyAuthority?.token !== landAuthority.token',
    'resumedShareCeremony?.postCeremonyAuthority?.raw?.revision !== landAuthority.raw.revision',
    'resumedShareCeremony?.postCeremonyAuthority?.raw?.receiptKeys',
    'resumedShareCeremony?.postCeremonyAuthority?.raw?.receiptRows',
    'resumedShareCeremony?.durableProjection !== charterDurableProjection(outcome)',
    'the preserved Share ceremony did not resume exactly once after Land settled',
    'return;',
  ])) {
    errors.push('settled Land boundary does not prove exactly one preserved Share delivery resumes');
  }
  return errors;
}

function ceremonyWiringErrors(source: string): string[] {
  const errors: string[] = [];
  if (!source.includes("from './progression-ceremony.js';")) {
    errors.push('pure ceremony coordinator import is missing');
  }
  const presenter = section(
    source,
    'function toastAchievementNotification(',
    '\n/* A blocked reach action',
  );
  if (!inOrder(presenter, [
    'input.revision <= highestProgressionCeremonyRevision',
    'highestProgressionCeremonyRevision = input.revision;',
    'const plan = planProgressionCeremonyV1({',
    "if (plan.kind !== 'present') return;",
    'progressionCeremonyQueue.push(...plan.achievements);',
    'scheduleProgressionCeremonyDrain();',
  ])) errors.push('sole delivery seam lacks replay guard or pure-plan ordering');
  if (!presenter.includes("if (ceremony.kind === 'achievement') toastAchievementNotification(ceremony);")
    || !presenter.includes('else toastRankPromotion(ceremony.rankName);')
    || !presenter.includes('playRaritySting(ceremony.stingTier);')) {
    errors.push('achievement/rank toast and semantic sting delivery is incomplete');
  }
  const inFlightDeferral = section(
    presenter,
    '    if (productActionInFlight) {',
    "\n    if (toastEl.style.opacity === '1') {",
  );
  const drainScheduler = section(
    presenter,
    'function scheduleProgressionCeremonyDrain(delay = 0): void {',
    '\n/** The sole Main delivery seam.',
  );
  if (!drainScheduler.includes(`progressionCeremonyTimer = window.setTimeout(() => {
    progressionCeremonyTimer = 0;
    progressionCeremonyDrainCallbacks = advanceProgressionCeremonyDiagnosticCounter(`)
    || !inOrder(drainScheduler, [
    'progressionCeremonyTimer = 0;',
    'progressionCeremonyDrainCallbacks = advanceProgressionCeremonyDiagnosticCounter(',
    'if (replacementReloadPending) {',
    'if (productActionInFlight) {',
    'progressionCeremonyInFlightDeferrals = advanceProgressionCeremonyDiagnosticCounter(',
    'scheduleProgressionCeremonyDrain(200);',
    "if (toastEl.style.opacity === '1') {",
    'const ceremony = progressionCeremonyQueue.shift();',
    'progressionCeremonyDeliveries = advanceProgressionCeremonyDiagnosticCounter(',
    'progressionCeremonyLastDeliveredKey = progressionCeremonyKey(ceremony);',
  ]) || !inFlightDeferral.includes('scheduleProgressionCeremonyDrain(200);')
    || !inFlightDeferral.includes('return;')
    || inFlightDeferral.includes('progressionCeremonyQueue.length = 0;')
    || inFlightDeferral.includes('progressionCeremonyQueue.shift()')) {
    errors.push('in-flight product action does not defer the intact ceremony queue before delivery');
  }
  if (!presenter.includes("schema: 'cf-v2-progression-ceremony-diagnostics/v1'")
    || !presenter.includes('queueKeys: Object.freeze(progressionCeremonyQueue.map(progressionCeremonyKey))')
    || !source.includes('progressionCeremony: progressionCeremonyDiagnostics(),')) {
    errors.push('ceremony deferral/delivery diagnostics are not exposed through the one live state seam');
  }
  if (!presenter.includes("if (ceremony.kind === 'rank-promotion')")
    || !presenter.includes('playRankPromotionGoldFx(ceremony);')
    || !presenter.includes('ceremony.goldBurst.maximumParticleCount')
    || !presenter.includes('policy.particles.maximumCount')
    || !presenter.includes('const anchor = appChrome.rankCeremonyAnchor();')
    || presenter.includes("getElementById('playerchip')")) {
    errors.push('rank gold FX is missing or bypasses the current visual budget');
  }
  if (!presenter.includes('if (replacementReloadPending) {')
    || !presenter.includes('progressionCeremonyQueue.length = 0;')) {
    errors.push('replacement convergence does not silence queued ceremony work');
  }
  if (presenter.includes('commitAction(') || presenter.includes('save.unlocked =')) {
    errors.push('presentation coordinator mutates progression');
  }

  const owners = {
    worldName: section(
      source,
      'async function commitArc0WorldNameForSearch(',
      '\nasync function commitArc9FollowedSearchRoute(',
    ),
    follow: section(
      source,
      'async function commitArc9FollowedSearchRoute(',
      '\nconst searchTravel =',
    ),
    share: section(
      source,
      'async function commitArc9ShareSend(',
      '\nlet lastArc0LandingOutcome',
    ),
    landing: section(source, 'async function doLand()', '\nlet lastArc0AtlasOutcome'),
    travel: section(
      source,
      'async function settleArc9DirectTravel(',
      '\nasync function runArc9AtlasFavoriteChange(',
    ),
    favorite: section(
      source,
      'async function runArc9AtlasFavoriteChange(',
      '\nasync function settleArc9Survey(',
    ),
    survey: section(
      source,
      'async function settleArc9Survey(',
      '\nasync function runArc9ExplorerNameChange(',
    ),
    starter: section(
      source,
      'async function runStarterCharterAccept(',
      '\nasync function runArc9BinderSetClaim(',
    ),
    binder: section(
      source,
      'async function runArc9BinderSetClaim(',
      '\nfunction arc9TravelInspectionOnly(',
    ),
    aggregate: section(
      source,
      'async function runArc9ProgressionRefresh(',
      '\nlet smokeRejectNextArc3ActionStorage',
    ),
    engineering: section(
      source,
      'async function commitArc3EngineeringAction(',
      '\nasync function mineCurrentSurface()',
    ),
    breed: section(
      source,
      'async function commitCompendiumBreedAction(',
      '\nfunction compendiumBreedOutcomeCopy(',
    ),
    rename: section(
      source,
      'async function commitCompendiumRenameAction(',
      '\nfunction compendiumRenameOutcomeCopy(',
    ),
    scout: section(
      source,
      'async function commitCompendiumScoutAction(',
      '\nfunction compendiumScoutOutcomeCopy(',
    ),
    combat: section(
      source,
      'async function commitCurrentArc6Combat(',
      '\nfunction presentCommittedCombatChronicle(',
    ),
  };
  for (const [label, owner] of Object.entries(owners)) {
    if (owner.length === 0 || exactCallCount(owner) !== 1) {
      errors.push(`${label} does not have exactly one postcommit ceremony publication`);
    }
  }
  if ([...source.matchAll(/presentProgressionCeremony\(/gu)].length
    !== Object.keys(owners).length + 1) {
    errors.push('ceremony delivery is missing an owner or has a duplicate owner');
  }

  if (!inOrder(owners.worldName, [
    "if (attempt.kind === 'committed-convergence')",
    'save.unlocked = attempt.transaction.state.unlocked.slice();',
    'worldIdentityProtection = null;',
    'presentProgressionCeremony({',
  ]) || !owners.worldName.includes('addedAchievementIds: achievement.added ? [achievement.id] : []')) {
    errors.push('world-name ceremony is not bound to its verified event append');
  }
  if (!inOrder(owners.follow, [
    "if (outcome.kind === 'committed-convergence')",
    'publishArc9SharingFieldsV1(save, outcome);',
    'publishAcceptedSearchNavigation(plan, true);',
    'presentProgressionCeremony({',
  ]) || owners.follow.includes('queueArc9ProgressionRefresh(')) {
    errors.push('Follow ceremony is not atomic or queues duplicate progression');
  }
  if (!inOrder(owners.share, [
    "if (outcome.kind === 'committed-convergence')",
    'publishArc9SharingFieldsV1(save, outcome);',
    'void copyShareCode(code);',
    'presentProgressionCeremony({',
  ]) || !owners.share.includes('outcome.achievementAdded ? [outcome.achievementId] : []')) {
    errors.push('Share ceremony is not bound to the first committed Share append');
  }
  if (!inOrder(owners.landing, [
    "if (attempt.kind === 'committed-convergence')",
    'publishArc0LandingFields(attempt.transaction.state, facts);',
    'worldIdentityProtection = null;',
    'presentProgressionCeremony({',
  ]) || !owners.landing.includes("disposition: training ? 'training-sandbox' : 'committed-publication'")
    || !owners.landing.includes('...facts.starterCharters.addedAchievementIds')
    || !owners.landing.includes('...(facts.achievement?.added ? [facts.achievement.id] : [])')
    || !owners.landing.includes('addedAchievementIds: landingAchievementIds')) {
    errors.push('Landing ceremony can escape Training or is not post-publication');
  }
  if (!inOrder(owners.travel, [
    "if (outcome.kind === 'committed-convergence')",
    'publishArc9TravelFieldsV1(save, outcome);',
    'presentProgressionCeremony({',
  ]) || owners.travel.includes('queueArc9ProgressionRefresh(')
    || !owners.travel.includes('...outcome.addedEventAchievementIds')
    || !owners.travel.includes('...outcome.addedAggregateAchievementIds')) {
    errors.push('direct Travel ceremony is not its one-receipt fixed point');
  }
  if (!inOrder(owners.favorite, [
    "if (outcome.kind === 'committed-convergence')",
    'publishArc9AtlasFavoriteFieldsV1(save, outcome);',
    'presentProgressionCeremony({',
  ]) || owners.favorite.includes('queueArc9ProgressionRefresh(')
    || !owners.favorite.includes("...(outcome.curatorAdded ? ['curator'] : [])")) {
    errors.push('Atlas Favorite ceremony is not its one-receipt fixed point');
  }
  if (!inOrder(owners.survey, [
    "if (outcome.kind === 'committed-convergence')",
    'publishArc9SurveyFieldsV1(save, outcome);',
    'presentProgressionCeremony({',
  ]) || owners.survey.includes('queueArc9ProgressionRefresh(')
    || !owners.survey.includes('...outcome.addedEventAchievementIds')
    || !owners.survey.includes('...outcome.addedAggregateAchievementIds')) {
    errors.push('Survey ceremony is not its one-receipt fixed point');
  }
  if (!inOrder(owners.starter, [
    "if (outcome.kind === 'committed-convergence')",
    'publishStarterCharterAcceptFieldsV1(sourceState, outcome);',
    'inventoryPanelController.setState(arc2LootState);',
    'updateChips();',
    'presentProgressionCeremony({',
  ]) || owners.starter.includes('queueArc9ProgressionRefresh(')
    || !owners.starter.includes('priorUnlockedIds: outcome.facts.stage.priorUnlockedIds')
    || !owners.starter.includes('addedAchievementIds: outcome.facts.stage.addedAchievementIds')) {
    errors.push('Starter Charter ceremony is not its one-receipt fixed point');
  }
  if (!inOrder(owners.binder, [
    "if (outcome.kind === 'committed-convergence')",
    'publishArc9BinderSetClaimFieldsV1(sourceState, outcome);',
    'updateChips();',
    'presentProgressionCeremony({',
  ]) || owners.binder.includes('queueArc9ProgressionRefresh(')
    || !owners.binder.includes('priorUnlockedIds: outcome.facts.priorUnlockedIds')
    || !owners.binder.includes('addedAchievementIds: outcome.facts.addedAchievementIds')) {
    errors.push('Binder ceremony is not its one-receipt fixed point');
  }
  if (!inOrder(owners.aggregate, [
    "if (outcome.kind === 'committed-convergence')",
    'save.unlocked = outcome.transaction.state.unlocked.slice();',
    'presentProgressionCeremony({',
  ]) || !owners.aggregate.includes("disposition: reason === 'boot-catch-up'")
    || !owners.aggregate.includes("? 'boot-catch-up'")) {
    errors.push('aggregate ceremony is not post-publication and boot-silent');
  }
  if (!inOrder(owners.engineering, [
    'durable = true;',
    'spec.publish(save, outcome.state, verified);',
    'arc3EngineeringState = verified.state;',
    'lastArc3ProjectionDiagnostics = verified.projection.diagnostics;',
    'if (committedPlan.starterCharter?.changed === true) {',
    'presentProgressionCeremony({',
  ]) || !owners.engineering.includes('priorUnlockedIds: committedPlan.starterCharter.priorUnlockedIds')
    || !owners.engineering.includes('addedAchievementIds: committedPlan.starterCharter.addedAchievementIds')
    || !owners.engineering.includes('priorBestRankIndex: committedPlan.starterCharter.priorBestRankIndex')
    || !owners.engineering.includes('nextBestRankIndex: committedPlan.starterCharter.nextBestRankIndex')) {
    errors.push('Engineering Starter Charter ceremony is not its verified same-CAS publication');
  }
  if (!inOrder(owners.breed, [
    "if (attempt.kind === 'committed-convergence')",
    'publishArc5BreedSaveFieldsV1(sourceState, attempt.transaction.state);',
    'presentProgressionCeremony({',
  ]) || !owners.breed.includes("attempt.bredLegendAchievementAdded ? ['bredlegend'] : []")) {
    errors.push('Breed ceremony is not bound to the committed bredlegend append');
  }
  if (!inOrder(owners.rename, [
    "if (attempt.kind === 'committed-convergence')",
    'publishArc5RenameAchievementFields(save, attempt.transaction.state);',
    'presentProgressionCeremony({',
  ]) || !owners.rename.includes("attempt.namerAchievementAdded ? ['namer'] : []")) {
    errors.push('Rename ceremony is not bound to the committed namer append');
  }
  if (!inOrder(owners.scout, [
    "if (attempt.kind === 'committed-convergence')",
    'publishArc5ScoutCharterFieldsV1(sourceState, attempt.transaction.state);',
    'arc5OwnershipState = attempt.ownershipV2;',
    'if (starterCharterChanged && attempt.starterCharter !== null) {',
    'presentProgressionCeremony({',
  ]) || !owners.scout.includes('priorUnlockedIds: attempt.starterCharter.priorUnlockedIds')
    || !owners.scout.includes('addedAchievementIds: attempt.starterCharter.addedAchievementIds')
    || !owners.scout.includes('priorBestRankIndex: attempt.starterCharter.priorBestRankIndex')
    || !owners.scout.includes('nextBestRankIndex: attempt.starterCharter.nextBestRankIndex')) {
    errors.push('Scout Starter Charter ceremony is not its verified same-CAS publication');
  }
  if (!inOrder(owners.combat, [
    "if (attempt.kind === 'committed-convergence')",
    'save = verification.state;',
    'const directAchievementIds = verification.state.unlocked',
    'presentProgressionCeremony({',
  ]) || !owners.combat.includes("id === 'settle1' || id === 'brink'")) {
    errors.push('Combat ceremony is not bound to its exact direct achievement tail');
  }

  return errors;
}

describe('postcommit achievement and rank ceremony Main wiring', () => {
  it('has one replay-safe delivery seam and every current exact durable owner', () => {
    expect(ceremonyWiringErrors(mainSource)).toEqual([]);
  });

  it('negative-controls replay, boot/Training silence, audio/FX, publication, and atomic owners', () => {
    const inFlightGuard = `    if (productActionInFlight) {
      progressionCeremonyInFlightDeferrals = advanceProgressionCeremonyDiagnosticCounter(
        progressionCeremonyInFlightDeferrals,
      );
      scheduleProgressionCeremonyDrain(200);
      return;
    }
`;
    expect(ceremonyWiringErrors(replaceExact(
      mainSource,
      inFlightGuard,
      '',
    ))).toContain('in-flight product action does not defer the intact ceremony queue before delivery');

    const guardMovedAfterShift = replaceExact(
      replaceExact(mainSource, inFlightGuard, ''),
      '    const ceremony = progressionCeremonyQueue.shift();',
      `    const ceremony = progressionCeremonyQueue.shift();
${inFlightGuard}`,
    );
    expect(ceremonyWiringErrors(guardMovedAfterShift)).toContain(
      'in-flight product action does not defer the intact ceremony queue before delivery',
    );

    expect(ceremonyWiringErrors(replaceExact(
      mainSource,
      '      scheduleProgressionCeremonyDrain(200);\n      return;\n    }\n    if (toastEl.style.opacity',
      '      progressionCeremonyQueue.length = 0;\n      return;\n    }\n    if (toastEl.style.opacity',
    ))).toContain('in-flight product action does not defer the intact ceremony queue before delivery');

    expect(ceremonyWiringErrors(replaceExact(
      mainSource,
      '    progressionCeremonyTimer = 0;\n',
      '',
    ))).toContain('in-flight product action does not defer the intact ceremony queue before delivery');

    expect(ceremonyWiringErrors(replaceExact(
      mainSource,
      '        progressionCeremony: progressionCeremonyDiagnostics(),\n',
      '',
    ))).toContain('ceremony deferral/delivery diagnostics are not exposed through the one live state seam');

    expect(ceremonyWiringErrors(replaceExact(
      mainSource,
      '    || input.revision <= highestProgressionCeremonyRevision) return;',
      '    || false) return;',
    ))).toContain('sole delivery seam lacks replay guard or pure-plan ordering');

    expect(ceremonyWiringErrors(replaceExact(
      mainSource,
      'try { playRaritySting(ceremony.stingTier); }',
      'try { playRaritySting(1); }',
    ))).toContain('achievement/rank toast and semantic sting delivery is incomplete');

    expect(ceremonyWiringErrors(replaceExact(
      mainSource,
      'try { playRankPromotionGoldFx(ceremony); }',
      'try { /* mutation control omits gold FX */ }',
    ))).toContain('rank gold FX is missing or bypasses the current visual budget');

    expect(ceremonyWiringErrors(replaceExact(
      mainSource,
      'const anchor = appChrome.rankCeremonyAnchor();',
      'const anchor = null;',
    ))).toContain('rank gold FX is missing or bypasses the current visual budget');

    expect(ceremonyWiringErrors(replaceInSectionExact(
      mainSource,
      'async function runArc9ProgressionRefresh(',
      '\nlet smokeRejectNextArc3ActionStorage',
      "        disposition: reason === 'boot-catch-up'\n          ? 'boot-catch-up'\n          : 'committed-publication',",
      "        disposition: 'committed-publication',",
    ))).toContain('aggregate ceremony is not post-publication and boot-silent');

    expect(ceremonyWiringErrors(replaceInSectionExact(
      mainSource,
      'async function doLand()',
      '\nlet lastArc0AtlasOutcome',
      "disposition: training ? 'training-sandbox' : 'committed-publication'",
      "disposition: 'committed-publication'",
    ))).toContain('Landing ceremony can escape Training or is not post-publication');

    expect(ceremonyWiringErrors(replaceInSectionExact(
      mainSource,
      'async function settleArc9Survey(',
      '\nasync function runArc9ExplorerNameChange(',
      '    actionClaim.settle(durable);',
      '    actionClaim.settle(durable);\n    if (durable) queueArc9ProgressionRefresh(actionClaim.operation);',
    ))).toContain('Survey ceremony is not its one-receipt fixed point');

    expect(ceremonyWiringErrors(replaceInSectionExact(
      mainSource,
      'async function commitCompendiumRenameAction(',
      '\nfunction compendiumRenameOutcomeCopy(',
      '      publishArc5RenameAchievementFields(save, attempt.transaction.state);',
      '      // mutation control omits live achievement publication',
    ))).toContain('Rename ceremony is not bound to the committed namer append');

    expect(ceremonyWiringErrors(replaceInSectionExact(
      mainSource,
      'async function runStarterCharterAccept(',
      '\nasync function runArc9BinderSetClaim(',
      '      publishStarterCharterAcceptFieldsV1(sourceState, outcome);',
      '      // mutation control omits Starter Charter publication',
    ))).toContain('Starter Charter ceremony is not its one-receipt fixed point');

    expect(ceremonyWiringErrors(replaceInSectionExact(
      mainSource,
      'async function runArc9BinderSetClaim(',
      '\nfunction arc9TravelInspectionOnly(',
      '      publishArc9BinderSetClaimFieldsV1(sourceState, outcome);',
      '      // mutation control omits Binder publication',
    ))).toContain('Binder ceremony is not its one-receipt fixed point');

    expect(ceremonyWiringErrors(replaceInSectionExact(
      mainSource,
      'async function commitArc3EngineeringAction(',
      '\nasync function mineCurrentSurface()',
      '      if (committedPlan.starterCharter?.changed === true) {',
      '      if (false) { // mutation control suppresses same-CAS Starter ceremony',
    ))).toContain('Engineering Starter Charter ceremony is not its verified same-CAS publication');

    expect(ceremonyWiringErrors(replaceInSectionExact(
      mainSource,
      'async function commitCompendiumScoutAction(',
      '\nfunction compendiumScoutOutcomeCopy(',
      '        publishArc5ScoutCharterFieldsV1(sourceState, attempt.transaction.state);',
      '        // mutation control omits Scout Starter Charter publication',
    ))).toContain('Scout Starter Charter ceremony is not its verified same-CAS publication');
  });

  it('proves the saturated-Charter race defers and then resumes one exact Share ceremony', () => {
    expect(saturatedCharterCeremonySmokeErrors(sliceSmokeSource)).toEqual([]);

    expect(saturatedCharterCeremonySmokeErrors(replaceExact(
      sliceSmokeSource,
      'p?.inFlightDeferrals>b.inFlightDeferrals',
      'true',
    ))).toContain(
      'held Land boundary does not witness a real deferred callback with its queue intact',
    );

    expect(saturatedCharterCeremonySmokeErrors(replaceExact(
      sliceSmokeSource,
      'p?.deliveries===b.deliveries+1',
      'p?.deliveries>=b.deliveries',
    ))).toContain(
      'settled Land boundary does not prove exactly one preserved Share delivery resumes',
    );

    expect(saturatedCharterCeremonySmokeErrors(replaceExact(
      sliceSmokeSource,
      "p?.lastDeliveredKey==='achievement:share'",
      'Boolean(p?.lastDeliveredKey)',
    ))).toContain(
      'settled Land boundary does not prove exactly one preserved Share delivery resumes',
    );

    expect(saturatedCharterCeremonySmokeErrors(replaceExact(
      sliceSmokeSource,
      'JSON.stringify(p.queueKeys)===JSON.stringify(b.queueKeys.slice(1))',
      "!p.queueKeys.includes('achievement:share')",
    ))).toContain(
      'settled Land boundary does not prove exactly one preserved Share delivery resumes',
    );

    expect(saturatedCharterCeremonySmokeErrors(replaceExact(
      sliceSmokeSource,
      '&&s.toastOn===true&&s.toastSerial',
      '&&s.toastSerial',
    ))).toContain(
      'settled Land boundary does not prove exactly one preserved Share delivery resumes',
    );

    expect(saturatedCharterCeremonySmokeErrors(replaceExact(
      sliceSmokeSource,
      'const postCeremonyAuthority = await readNavPhF4AuthoritySnapshot();',
      'const postCeremonyAuthority = landAuthority;',
    ))).toContain(
      'settled Land boundary does not prove exactly one preserved Share delivery resumes',
    );
  });
});
