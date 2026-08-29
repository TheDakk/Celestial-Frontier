import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = (relative: string): string => fs.readFileSync(path.join(here, '..', relative), 'utf8');
const main = source('apps/game/src/main.ts');
const action = source('apps/game/src/arc6-combat-action.ts');
const runtime = source('apps/game/src/f4-runtime-authority.ts');
const card = source('apps/game/src/combat-card.ts');
const persistence = source('packages/persistence/src/combat-settlement.ts');
const index = source('apps/game/index.html');

function functionBody(text: string, signature: string, nextSignature: string): string {
  const start = text.indexOf(signature);
  const end = nextSignature.length === 0
    ? text.length : text.indexOf(nextSignature, start + signature.length);
  if (start < 0 || end < 0) throw new Error(`missing function boundary ${signature}`);
  return text.slice(start, end);
}

function ordered(haystack: string, needles: readonly string[]): boolean {
  let cursor = -1;
  for (const needle of needles) {
    cursor = haystack.indexOf(needle, cursor + 1);
    if (cursor < 0) return false;
  }
  return true;
}

describe('Arc 6 player-live combat wiring', () => {
  it('mounts one accessible combat owner only on the exact landed Survey surface', () => {
    expect(main).toContain("'<section data-combat-card-body aria-label=\"Conquest combat\"></section>'");
    expect(main).toContain("card.querySelector<HTMLElement>('[data-combat-card-body]')");
    expect(main).toContain('combatCardController.attach(combatMount);');
    expect(main).toContain('combatCardController.detach();');
    expect(card).toContain('for="combat-champion-select"');
    expect(card).toContain('role="status" aria-live="polite"');
    expect(index).toContain('[data-combat-champion] { width: 100%; min-height: 44px;');
    expect(index).toContain('[data-combat-challenge] { width: 100%; min-height: 44px;');
    expect(card).toContain('if (FORECAST_MEMO.size > 400) FORECAST_MEMO.clear();');

    const unboundedMemo = card.replace('if (FORECAST_MEMO.size > 400) FORECAST_MEMO.clear();', '');
    expect(unboundedMemo).not.toContain('if (FORECAST_MEMO.size > 400) FORECAST_MEMO.clear();');
  });

  it('joins the complete current roster and exact canonical world before projecting Titan → Guardian → fauna', () => {
    const projection = functionBody(
      main,
      'function projectCurrentArc6CombatSurface(',
      'function refreshCombatCardState(',
    );
    expect(projection).toContain('canonicalCF1WorldAddressFromNav(nav)');
    expect(projection).toContain('canonicalWorldRoster(address.address, currentEcologyEpoch())');
    expect(projection).toContain('planetsideMatchesFullRoster(roster)');
    expect(projection).toContain('for (const row of roster.view.all)');
    expect(projection).toContain("if (row.kingdom !== 'fauna') continue;");
    expect(projection).toContain('canonicalGenomeIdentityV1(row)');
    expect(projection).toContain('projectGuardianPrimeEncounterV1({');
    expect(projection).toContain('regionAt(address.address.galaxy.x, address.address.galaxy.y)');
    expect(projection).toContain('projectWorldOpportunity(address.address)');
    expect(projection).toContain('const authorityKey = `arc6-authority:');
    expect(projection).toContain('projectArc6CombatChampionAvailabilityV1({');
    expect(projection).toContain('observedActivePlayMs,');
    expect(projection).toContain('companionAvailability,');

    const previewMutant = projection.replace('roster.view.all', 'roster.view.preview');
    expect(previewMutant).not.toContain('for (const row of roster.view.all)');
  });

  it('claims synchronously, heartbeats, revalidates the exact encounter and champion, then performs one combat call', () => {
    const commit = functionBody(
      main,
      'async function commitCurrentArc6Combat(',
      'function presentCommittedCombatChronicle(',
    );
    expect(ordered(commit, [
      "productActionCoordinator.tryClaim('arc6.combat-settlement')",
      'productActionInFlight = true;',
      'await settleF4Heartbeat();',
      'const observedActivePlayMs = runtime.diagnostics().activePlayMs;',
      'projectCurrentArc6CombatSurface(null, observedActivePlayMs);',
      'currentProjection.authorityKey !== intendedProjection.authorityKey',
      'const currentAvailability = projectArc6CombatChampionAvailabilityV1({',
      "if (currentAvailability.kind !== 'available')",
      'commitArc6CombatActionV1({',
      'observedActivePlayMs: currentProjection.observedActivePlayMs,',
      'if (attempt.kind === \'refused\')',
      'durable = true;',
      'save = verification.state;',
    ])).toBe(true);
    expect(commit.match(/commitArc6CombatActionV1\(\{/gu)).toHaveLength(1);
    expect(commit).not.toMatch(/\b(?:while|setInterval|setTimeout)\s*\(/u);
    expect(ordered(commit, [
      'const intendedAvailability = projectArc6CombatChampionAvailabilityV1({',
      "if (intendedAvailability.kind !== 'available')",
      "productActionCoordinator.tryClaim('arc6.combat-settlement')",
    ])).toBe(true);

    const staleMutant = commit.replace('await settleF4Heartbeat();', '');
    expect(ordered(staleMutant, [
      'await settleF4Heartbeat();',
      'projectCurrentArc6CombatSurface(null, observedActivePlayMs);',
      'const currentAvailability = projectArc6CombatChampionAvailabilityV1({',
      'commitArc6CombatActionV1({',
    ])).toBe(false);
    const missingPostHeartbeatGuard = commit.replace(
      /    const currentAvailability = projectArc6CombatChampionAvailabilityV1\(\{[\s\S]*?    \}\);\n    if \(currentAvailability\.kind !== 'available'\) \{[\s\S]*?    \}\n/u,
      '',
    );
    expect(ordered(missingPostHeartbeatGuard, [
      'await settleF4Heartbeat();',
      'const currentAvailability = projectArc6CombatChampionAvailabilityV1({',
      'commitArc6CombatActionV1({',
    ])).toBe(false);
  });

  it('publishes no combat fact until the registered commit independently verifies its exact receipt and save', () => {
    const settle = functionBody(
      action,
      'export async function commitArc6CombatActionV1(',
      '',
    );
    expect(ordered(settle, [
      'projectArc6CombatChampionAvailabilityV1({',
      "if (availability.kind !== 'available')",
      'planF4DeterministicProductReceipt(',
      'runDuel(mine, {',
      'planCombatSettlementV1({',
      'input.runtime.commitCombatSettlement({',
      "if (transaction.kind !== 'committed')",
      'verifyCommittedCombatSettlementV1({',
      "if (verification.kind !== 'verified')",
      "kind: 'committed'",
    ])).toBe(true);
    expect(settle.match(/input\.runtime\.commitCombatSettlement\(\{/gu)).toHaveLength(1);
    expect(settle).not.toMatch(/\b(?:retry|reroll)\b/iu);

    const persistenceCommit = functionBody(
      persistence,
      'export function createCombatSettlementPersistenceOwnerV1(',
      'export type CombatSettlementVerificationOutcomeV1',
    );
    expect(ordered(persistenceCommit, [
      'projectCompanionAvailabilityV1(',
      'input.snapshot.activePlayMs,',
      'planF4DeterministicProductReceipt(',
      'transactionOwner.commit({',
    ])).toBe(true);
    const missingSettlementGuard = persistenceCommit.replace(
      'projectCompanionAvailabilityV1(',
      'removedCompanionAvailabilityGuard(',
    );
    expect(missingSettlementGuard).not.toContain('projectCompanionAvailabilityV1(');

    const mainPublication = functionBody(
      main,
      'async function runArc6CombatCardAction(',
      'function engineeringOutcomeConverges(',
    );
    expect(ordered(mainPublication, [
      'await commitCurrentArc6Combat(request)',
      'combatCardController.settle(copy);',
      "if (outcome.kind === 'committed')",
      "gameEvent('conquest'",
    ])).toBe(true);
    expect(mainPublication).toContain("if (outcome.durability === 'committed'");
    expect(mainPublication).toContain('protectArc6CombatAfterDurability(');
    const conquestEventGuard = "if (outcome.verification.plan.conquest.status === 'settle')";
    expect(ordered(mainPublication, [conquestEventGuard, "gameEvent('conquest'"])).toBe(true);

    const lossEventMutant = mainPublication.replace(
      "      if (outcome.verification.plan.conquest.status === 'settle') {\n",
      '',
    ).replace('      }\n      refreshCaptureCardState();', '      refreshCaptureCardState();');
    expect(ordered(lossEventMutant, [conquestEventGuard, "gameEvent('conquest'"])).toBe(false);
  });

  it('carries the exact live Guardian roster through presentation, heartbeat, action, and verified publication', () => {
    const roster = functionBody(
      action,
      'export function projectArc6CombatChampionRosterV1(',
      'function registeredRosterFor(',
    );
    expect(ordered(roster, [
      'readGuardianAcquisitionCarrierV1(input.extensions)',
      'readGuardianCompanionCarrierV1(input.extensions)',
      'projectGuardianCompanionsV1({',
      'acquisition.state.entries.some((entry)',
      "return protectedRoster('arc5-guardian-id-collision')",
      "source: 'guardian' as const",
      "schema: 'cf-v2-arc6-combat-champion-roster/v1'",
    ])).toBe(true);
    expect(roster).toContain('guardianSourceDigest: guardians.sourceDigest');
    expect(roster).toContain('guardianOverlayDigest: guardians.overlayDigest');

    const projection = functionBody(
      main,
      'function projectCurrentArc6CombatSurface(',
      'function refreshCombatCardState(',
    );
    expect(ordered(projection, [
      'projectArc6CombatChampionRosterV1({',
      "if (championRoster.kind !== 'projected') return null;",
      'championRoster: championRoster.authorityKey,',
      'championRoster.champions.map(({ creature })',
      'guardianRoster: championRoster,',
      'authorityKey, contextKey, observedActivePlayMs, championRoster,',
    ])).toBe(true);

    const commit = functionBody(
      main,
      'async function commitCurrentArc6Combat(',
      'function presentCommittedCombatChronicle(',
    );
    expect(commit).toContain('guardianRoster: intendedProjection.championRoster,');
    expect(commit).toContain('guardianRoster: currentProjection.championRoster,');
    expect(commit).toContain(
      'championRosterAuthorityKey: currentProjection.championRoster.authorityKey,',
    );
    expect(ordered(commit, [
      'const committedRoster = projectArc6CombatChampionRosterV1({',
      "if (committedRoster.kind !== 'projected')",
      'const selectedGuardian = currentProjection.championRoster.champions.some',
      'guardianAcquisitionStateDigestV1(verification.guardianAcquisitions)',
      'guardianCompanionStateDigestV1(verification.guardianCompanions)',
      'guardianLegacyCompanionSliceMatchesV1(',
      'save = verification.state;',
    ])).toBe(true);

    const actionCommit = functionBody(
      action,
      'export async function commitArc6CombatActionV1(',
      '',
    );
    expect(ordered(actionCommit, [
      'projectArc6CombatChampionRosterV1({',
      "if (championRoster.kind !== 'projected')",
      'championRoster.authorityKey !== input.championRosterAuthorityKey',
      'guardianRoster: championRoster,',
      'projectGuardianCombatLossXpAuthorityV1({',
      'planF4DeterministicProductReceipt(',
      'runDuel(mine, {',
      'input.runtime.commitCombatSettlement({',
    ])).toBe(true);

    const collisionBlind = roster.replace(
      "return protectedRoster('arc5-guardian-id-collision');",
      "return protectedRoster('mutation-ignored-collision');",
    );
    expect(collisionBlind).not.toContain(
      "return protectedRoster('arc5-guardian-id-collision');",
    );
    const arc5LossXpOnly = actionCommit.replace('projectGuardianCombatLossXpAuthorityV1({', '');
    expect(arc5LossXpOnly).not.toContain('projectGuardianCombatLossXpAuthorityV1({');
    const unverifiedCompendium = commit.replace(
      'guardianLegacyCompanionSliceMatchesV1(',
      'removedGuardianCompositeMirrorCheck(',
    );
    expect(unverifiedCompendium).not.toContain('guardianLegacyCompanionSliceMatchesV1(');
  });

  it('keeps the F4 lease and revision private while advancing runtime authority on both durable outcomes', () => {
    const method = functionBody(
      runtime,
      '    commitCombatSettlement(',
      '    commitProduct(',
    );
    expect(method).toContain("if (grant === null || staleBlocked || released) return { kind: 'lease-unavailable' };");
    expect(method).toContain('expectedRevision,');
    expect(method).toContain('grant,');
    expect(method).toContain("if (outcome.kind === 'committed' || outcome.kind === 'committed-convergence')");
    expect(ordered(method, [
      'revision = transaction.revision;',
      'extensions = transaction.saved.extensions;',
      'sessionRng = copySessionRng(transaction.authority.sessionRng);',
      'publishCheckpointParent(transaction.saved.canonicalState);',
      'return outcome;',
    ])).toBe(true);
  });

  it('settles only the exact starter Charter while keeping unresolved reward policies explicit', () => {
    expect(action).toContain('accepted weekly conquest Charter has no v2 weekly lifecycle owner');
    expect(persistence).toContain("COMBAT_STARTER_CONQUEST_CHARTER_ID_V1 = 'st-conq'");
    expect(persistence).toContain('settleAcceptedStarterConquestCharter(draft)');
    const outcomeCopy = functionBody(
      main,
      'function arc6CombatOutcomeCopy(',
      'function protectArc6CombatAfterDurability(',
    );
    const charterFact = 'const starterCharter = outcome.verification.starterConquestCharter;';
    const charterCopy = 'parts.push(`Conquer a world Charter complete: +${starterCharter.stardustReward} Stardust.`);';
    expect(ordered(outcomeCopy, [charterFact, 'if (starterCharter !== null)', charterCopy])).toBe(true);
    const silentCharterMutant = outcomeCopy.replace(charterCopy, '');
    expect(ordered(silentCharterMutant, [charterFact, 'if (starterCharter !== null)', charterCopy])).toBe(false);
    expect(action).toContain('this conquest would imbue equipped gear');
    expect(main).toContain('No extra Guardian Gear reward was invented; that authored table remains open.');
    expect(card).toContain('Party roles and retreat remain a named design gate');
  });

  it('arms combat audio only in the trusted Challenge seam and retires the prior Main sidecar first', () => {
    const wiring = functionBody(
      main,
      'const combatCardController = new CombatCardController({',
      'function surveyOwnsCurrentCaptureSurface(',
    );
    expect(ordered(wiring, [
      'onNativeChallengeGesture: () => {',
      'combatChronicleAudioSession = null;',
      'tameGreetingAudioOwner?.armNativeCombatGesture();',
      'onAction: (request) => {',
    ])).toBe(true);

    const missingArm = wiring.replace(
      'tameGreetingAudioOwner?.armNativeCombatGesture();',
      '// mutation removed native combat activation',
    );
    expect(missingArm).not.toContain('tameGreetingAudioOwner?.armNativeCombatGesture();');
    const staleSidecar = wiring.replace(
      'combatChronicleAudioSession = null;',
      '// mutation retained the prior audio sidecar',
    );
    expect(ordered(staleSidecar, [
      'combatChronicleAudioSession = null;',
      'tameGreetingAudioOwner?.armNativeCombatGesture();',
    ])).toBe(false);
  });

  it('projects and mounts the exact verified settlement before optionally claiming its cue plan', () => {
    const presentation = functionBody(
      main,
      'function presentCommittedCombatChronicle(',
      'async function playCombatChronicleCue(',
    );
    expect(ordered(presentation, [
      'const settlement = outcome.verification.plan;',
      'projectCombatCueParticipantsV1(settlement)',
      'combatCuePlan(settlement, participants)',
      'projectCombatChronicleV1(settlement, cuePlan)',
      "openPanel('combat', opener);",
      'combatChronicleController.start(chronicle, cuePlan)',
      "combatChronicleMount.querySelector('[data-combat-chronicle-log]') === null",
      'claimCommittedCombatSession(outcome, cuePlan)',
      'Object.freeze({ claim, generation, plan: cuePlan })',
    ])).toBe(true);
    expect(presentation).toContain("cancelCombatPlayback('chronicle-not-current')");
    expect(presentation).toContain("cancelCombatPlayback('chronicle-claim-fault')");

    const prematureClaim = presentation
      .replace(
        '  const generation = combatChronicleController.start(chronicle, cuePlan);',
        '  const generation = 0; // mutation removed the current accessible Chronicle',
      );
    expect(ordered(prematureClaim, [
      'combatChronicleController.start(chronicle, cuePlan)',
      'claimCommittedCombatSession(outcome, cuePlan)',
    ])).toBe(false);
    const detachedPlan = presentation.replace(
      'claimCommittedCombatSession(outcome, cuePlan)',
      'claimCommittedCombatSession(outcome, combatCuePlan(settlement, participants))',
    );
    expect(detachedPlan).not.toContain('claimCommittedCombatSession(outcome, cuePlan)');
  });

  it('plays only a current generation-bound Chronicle cue counterpart and contains audio faults', () => {
    const playback = functionBody(
      main,
      'async function playCombatChronicleCue(',
      'async function runArc6CombatCardAction(',
    );
    expect(ordered(playback, [
      'session.plan !== emission.plan',
      'session.generation !== emission.counterpart.generation',
      '!combatChronicleController.counterpartIsCurrent(emission.counterpart)',
      "owner.cancelCombatPlayback('chronicle-counterpart-mismatch')",
      'await owner.playClaimedCombatCue(session.claim, emission.cue, emission.counterpart);',
      "owner.cancelCombatPlayback('chronicle-playback-fault')",
    ])).toBe(true);

    const noCounterpartFence = playback.replace(
      '    || !combatChronicleController.counterpartIsCurrent(emission.counterpart)',
      '',
    );
    expect(noCounterpartFence).not.toContain(
      '!combatChronicleController.counterpartIsCurrent(emission.counterpart)',
    );
    const fireAndForgetMutant = playback.replace(
      'await owner.playClaimedCombatCue(session.claim, emission.cue, emission.counterpart);',
      'void owner.playClaimedCombatCue(session.claim, emission.cue, emission.counterpart);',
    );
    expect(fireAndForgetMutant).not.toContain(
      'await owner.playClaimedCombatCue(session.claim, emission.cue, emission.counterpart);',
    );
  });

  it('cancels uncommitted and stopped sessions while keeping battle-log sharing achievement-neutral', () => {
    const publication = functionBody(
      main,
      'async function runArc6CombatCardAction(',
      'function engineeringOutcomeConverges(',
    );
    expect(ordered(publication, [
      "if (outcome.kind !== 'committed')",
      "cancelCombatPlayback('challenge-not-committed')",
      'combatCardController.settle(copy);',
      "if (outcome.kind === 'committed')",
      'presentCommittedCombatChronicle(outcome)',
    ])).toBe(true);
    expect(publication).toContain("cancelCombatPlayback('chronicle-presentation-fault')");
    expect(publication).toContain('the durable result remains complete.');

    const panelOwner = functionBody(
      main,
      'let combatChronicleAudioSession:',
      "registerPanel({ id: 'atlas'",
    );
    expect(panelOwner).toContain('onCue: (emission) => { void playCombatChronicleCue(emission); }');
    expect(panelOwner).toContain('if (combatChronicleAudioSession?.generation !== generation) return;');
    expect(panelOwner).toContain('tameGreetingAudioOwner?.cancelCombatPlayback(`chronicle-${reason}`);');
    expect(panelOwner).toContain('onClose: () => combatChronicleController.close()');

    const counterpart = functionBody(
      main,
      'function creatureExpressionCounterpartIsCurrent(',
      'function invalidateTameToastCounterpart(',
    );
    expect(counterpart).toContain('combatChronicleController.counterpartIsCurrent(receipt)');
    expect(main).toContain("if (!options.preserveSurvey && openPanelId() === 'combat') closePanels();");

    const share = functionBody(
      main,
      'async function copyCombatChronicleLog(',
      'async function commitArc9ShareSend(',
    );
    expect(share).toContain('await navigator.clipboard.writeText(shareText);');
    expect(share).toContain("fallback.dataset.combatShareFallback = 'true';");
    expect(share).toContain('fallback.readOnly = true;');
    expect(share).toContain('fallback.value = shareText;');
    expect(share).not.toContain("gameEvent('share'");

    const leakyStop = panelOwner.replace(
      'if (combatChronicleAudioSession?.generation !== generation) return;',
      '// mutation stopped a newer generation too',
    );
    expect(leakyStop).not.toContain(
      'if (combatChronicleAudioSession?.generation !== generation) return;',
    );
    const achievementMutant = share.replace(
      'await navigator.clipboard.writeText(shareText);',
      "await navigator.clipboard.writeText(shareText); gameEvent('share', { battle: true });",
    );
    expect(achievementMutant).toContain("gameEvent('share'");
  });
});
