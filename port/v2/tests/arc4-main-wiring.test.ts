import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ARC4_OWNERSHIP_EXTENSION_TARGETS } from '@cf/persistence';

const here = path.dirname(fileURLToPath(import.meta.url));
const mainSource = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');
const indexSource = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'index.html'), 'utf8');

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

function bootErrors(source: string): string[] {
  const errors: string[] = [];
  const ensure = section(
    source,
    'async function ensureBootAuthorityCommit(',
    '\nfunction f4RuntimeMayMutate(',
  );
  if (ensure.length === 0) {
    errors.push('boot-source-section');
    return errors;
  }
  const earlyEntryEnd = ensure.indexOf('return true;');
  const earlyEntry = earlyEntryEnd >= 0 ? ensure.slice(0, earlyEntryEnd) : '';
  if (earlyEntry.length === 0
    || !earlyEntry.includes('&& !arc4OwnershipBootstrapPending)')) {
    errors.push('boot-pending-entry');
  }
  if ((ensure.match(/runtime\.commit\(/g) ?? []).length !== 1) errors.push('boot-single-cas');
  const durable = ensure.indexOf('durable = true;');
  const arc3Publish = ensure.indexOf('publishArc3LegacyCompatibilityFields(');
  const arc4Publish = ensure.indexOf('publishArc4LegacyCompatibilityFields(');
  if (!(durable >= 0 && arc3Publish > durable && arc4Publish > durable)) {
    errors.push('boot-postcommit-publication');
  }
  for (const needle of [
    'const productCandidate = bootProductBootstrapCandidate;',
    'ownershipBootstrapWasPending && ownershipStateAtCommit?.mode === \'current\'',
    'arc4OwnershipBootstrapPending = false;',
    'bootProductBootstrapCandidate = null;',
    'arc4OwnershipState = null;',
  ]) {
    if (!ensure.includes(needle)) errors.push('boot-shared-authority');
  }

  const mayMutate = section(source, 'function f4RuntimeMayMutate(', '\nfunction f4RuntimeMayAnswer(');
  if (mayMutate.length === 0
    || !mayMutate.includes('|| arc4OwnershipBootstrapPending')) errors.push('boot-mutation-gate');
  const heartbeat = section(source, 'const heartbeatF4 =', '\nconst settleF4Heartbeat =');
  const show = section(source, 'const showF4 =', "\naddEventListener('pagehide'");
  if (heartbeat.length === 0 || show.length === 0
    || !heartbeat.includes('|| arc4OwnershipBootstrapPending')
    || !show.includes('|| arc4OwnershipBootstrapPending')) errors.push('boot-lifecycle-gates');

  const load = section(source, 'async function loadSave(', '\n/* ---- boot ---- */');
  if (load.length === 0) errors.push('boot-load-section');
  const arc3 = load.indexOf('const prepared = prepareArc3AppBootstrap({');
  const arc4 = load.indexOf('const deferredForLegacyTraining =');
  if (!(arc3 >= 0 && arc4 > arc3)) errors.push('boot-product-order');
  if ((load.match(/const priorProductCandidate = bootProductBootstrapCandidate;/g) ?? []).length < 2
    || (load.match(/source: priorProductCandidate \?\? save/g) ?? []).length < 3) {
    errors.push('boot-candidate-composition');
  }
  for (const needle of [
    "trainingSnapshotIngress.kind === 'legacy-v1'",
    "trainingSnapshotIngress.kind === 'legacy-or-unknown'",
    'readArc4Ownership(',
    "arc4OwnershipProtection = `training-carrier-anomaly:${existing.kind}`;",
    'const prepared = prepareArc4AppBootstrap({',
    'const staged = stageArc4BootstrapLegacyProjection({',
    "lastArc4BootstrapOutcome = 'reconciliation-prepared';",
  ]) {
    if (!load.includes(needle)) errors.push('boot-classification');
  }
  if (!source.includes('ownershipBootstrapPending: arc4OwnershipBootstrapPending,')) {
    errors.push('boot-diagnostics');
  }
  return [...new Set(errors)];
}

function trainingErrors(source: string): string[] {
  const errors: string[] = [];
  const body = section(source, 'async function completeTraining(', '\nconst F4_FRESH_RACE_RELEASE_KEY');
  if (body.length === 0) {
    errors.push('training-source-section');
    return errors;
  }
  const prepare = body.indexOf('const arc4Preparation = prepareTrainingArc4Restore(');
  const commit = body.indexOf('const committed = await f4Runtime!.commit(');
  const committedState = body.indexOf(
    'trainingCommittedState = committed.saved.canonicalState;',
    commit,
  );
  const durable = body.indexOf('durablyWritten = true;', commit);
  const verify = body.indexOf('restoredOwnership = committedTrainingArc4State(', durable);
  const publish = body.indexOf('publishArc4LegacyCompatibilityFields(', verify);
  if (!(prepare >= 0 && commit > prepare && durable > commit && verify > durable && publish > verify)) {
    errors.push('training-durable-order');
  }
  if ((body.match(/f4Runtime!\.commit\(/g) ?? []).length !== 1) errors.push('training-single-cas');
  if (!body.includes("outcome.kind === 'deferred' ? 'source-deferred' : checkpoint.kind")) {
    errors.push('training-source-deferral');
  }
  if (ARC4_OWNERSHIP_EXTENSION_TARGETS.length !== 18
    || !body.includes('preparedLoot === null && preparedOwnership === null')
    || !body.includes('...(preparedLoot === null ? [] : [preparedLoot.write]),')
    || !body.includes('...(preparedOwnership === null ? [] : preparedOwnership.writes),')) {
    errors.push('training-extension-write-composition');
  }
  if (!(committedState > commit && committedState < durable)) {
    errors.push('training-committed-canonical-state');
  }
  const verifierEnd = body.indexOf('\n      );', verify);
  const verifierCall = verify >= 0 && verifierEnd > verify
    ? body.slice(verify, verifierEnd)
    : '';
  if (verifierCall.length === 0
    || !verifierCall.includes('committedTrainingArc4State(\n        trainingCommittedState,')
    || !verifierCall.includes('\n        preparedOwnership,')
    || !verifierCall.includes('\n        f4Runtime!.extensions,')) {
    errors.push('training-verifier-committed-state');
  }
  if (!body.includes("arc4OwnershipProtection = restoredOwnership.mode === 'current'")) {
    errors.push('training-publication-state');
  }
  return errors;
}

function captureErrors(source: string): string[] {
  const errors: string[] = [];
  const body = section(
    source,
    'async function commitArc4CaptureAction(',
    '\nfunction captureActivePlayCountdown(',
  );
  if (body.length === 0) {
    errors.push('capture-source-section');
    return errors;
  }
  const claim = body.indexOf('const actionClaim = productActionCoordinator.tryClaim(');
  const hold = body.indexOf('await smokeProductActionHold.holdIfArmed(actionClaim.operation);');
  const heartbeat = body.indexOf('await settleF4Heartbeat();');
  const revalidate = body.indexOf("if (nav !== intendedSurface || nav.mode !== 'surface')");
  const roster = body.indexOf('const rosterResult = canonicalWorldRoster(');
  const presentationFence = body.indexOf('const presentationFence = presentationFenceValue === undefined');
  const commit = body.indexOf('attempt = await commitArc4CaptureAttemptV1({');
  const durable = body.indexOf('durable = true;', commit);
  const verify = body.indexOf('const verified = verifyArc4CommittedCaptureV1({', durable);
  const publish = body.indexOf('publishArc4CaptureFields(save, transaction.state);', verify);
  const settle = body.indexOf('actionClaim.settle(durable);', publish);
  if (!(presentationFence >= 0 && claim > presentationFence
    && hold > claim && heartbeat > hold && revalidate > heartbeat
    && roster > revalidate && commit > roster && durable > commit
    && verify > durable && publish > verify && settle > publish)) {
    errors.push('capture-authority-order');
  }
  if ((body.match(/commitArc4CaptureAttemptV1\(/g) ?? []).length !== 1) {
    errors.push('capture-single-writer');
  }
  if (!body.includes('const intendedSurface = nav;')
    || !body.includes("if (nav !== intendedSurface || nav.mode !== 'surface')")
    || !body.includes('const address = canonicalCF1WorldAddressFromNav(nav);')) {
    errors.push('capture-surface-input');
  }
  if (!body.includes(
    'const rosterResult = canonicalWorldRoster(address.address, currentEcologyEpoch());',
  )) {
    errors.push('capture-ecology-input');
  }
  const helperEnd = body.indexOf('\n    });', commit);
  const helperCall = commit >= 0 && helperEnd > commit
    ? body.slice(commit, helperEnd)
    : '';
  const helperArguments = [
    '      runtime,',
    '      state: save,',
    '      nav,',
    '      address: address.address,',
    '      roster: rosterResult.roster,',
    '      presentationFence,',
    '      verb,',
    '      codecNow: Date.now(),',
  ];
  let priorArgument = -1;
  for (const argument of helperArguments) {
    const argumentAt = helperCall.indexOf(argument, priorArgument + 1);
    if (argumentAt <= priorArgument) {
      errors.push('capture-helper-inputs');
      break;
    }
    priorArgument = argumentAt;
  }
  if (helperCall.length === 0 || body.includes('view.preview')) {
    errors.push('capture-helper-inputs');
  }
  if (!body.includes('capturePresentationFenceForSurface(runtime, intendedSurface)')
    || !body.includes("!/^cpf1:[0-9a-f]{64}$/u.test(presentationFence)")) {
    errors.push('capture-presentation-fence');
  }
  if (!source.includes("value === 'tame' || value === 'scavenge' || value === 'sample'")) {
    errors.push('capture-terminal-mapping');
  }
  for (const needle of [
    'trainingCheckpointWriteHeld',
    "attempt.kind === 'committed-convergence'",
    "arc4OwnershipProtection = 'committed-publication-reload';",
    'scheduleF4AuthorityConvergenceReload(',
  ]) {
    if (!body.includes(needle)) errors.push('capture-terminal-mapping');
  }
  if (body.includes('toast(') || body.includes('gameEvent(')) errors.push('capture-player-presentation');
  if (!source.includes('__smokeCaptureCurrentSurface: commitArc4CaptureAction,')) {
    errors.push('capture-diagnostic-hook');
  }
  if (!source.includes("schema: 'cf-v2-arc4-app-state/v1'")) errors.push('capture-diagnostics');
  return [...new Set(errors)];
}

function capturePresentationErrors(source: string, cssSource = indexSource): string[] {
  const errors: string[] = [];
  const controller = section(
    source,
    'const captureCardController = new CaptureCardController({',
    '\nfunction surveyOwnsCurrentCaptureSurface(',
  );
  const setPending = controller.indexOf('captureCardController.setPending(request);');
  const captureFence = controller.indexOf('const presentationFence = currentCapturePresentationFence;');
  const run = controller.indexOf('void runCaptureCardAction(request, presentationFence);');
  if (!(captureFence >= 0 && setPending > captureFence && run > setPending)) {
    errors.push('capture-pending-before-async');
  }

  const owner = section(
    source,
    'function surveyOwnsCurrentCaptureSurface(',
    '\nfunction reconstructCurrentSurfaceSurvey(',
  );
  for (const needle of [
    "nav.mode === 'surface' && cardCtx !== null",
    'getProvenGalaxyKey(nav.gal) === getProvenGalaxyKey(cardCtx.gal)',
    'getProvenStarKey(nav.star) === getProvenStarKey(cardCtx.star)',
    'getProvenPlanetKey(nav.planet) === getProvenPlanetKey(cardCtx.planet)',
    '&& !trainingActive()',
  ]) {
    if (!owner.includes(needle)) errors.push('capture-current-surface-owner');
  }
  const survey = section(source, 'function showSurvey(', '\nfunction hideSurvey(');
  if (!survey.includes("'<section data-capture-card-body aria-label=\"Biosphere capture\"></section>'")
    || !survey.includes('captureCardController.attach(captureMount);')
    || !survey.includes('captureCardController.detach();')) {
    errors.push('capture-survey-mount');
  }

  const refresh = section(
    source,
    'function refreshCaptureCardState(',
    '\nfunction captureOutcomeCopy(',
  );
  const compose = section(
    refresh,
    'const composed = composeAcquisitionSnapshotV1({',
    '\n  if (composed.kind !==',
  );
  for (const needle of [
    'const rosterResult = canonicalWorldRoster(address.address, currentEcologyEpoch());',
    'if (!planetsideMatchesFullRoster(roster)) fillPlanetside(nav, roster);',
    'if (!planetsideMatchesFullRoster(roster)) {',
    'const fallbackKey = `${roster.worldKey}|epoch:${roster.ecologyEpoch}|${roster.fullRosterFingerprint}`;',
    'const observedActivePlayMs = runtime.diagnostics().activePlayMs;',
    'const observation = { observedActivePlayMs };',
    'const presentation = projectCapturePresentationV1(composed.snapshot, observation);',
    'const presentationFence = capturePresentationFenceV1(composed.snapshot, observation);',
    'currentCapturePresentationFence = unavailableDetail === null ? presentationFence : null;',
    'captureCardModelFromPresentation(\n    presentation,\n    fallbackKey,',
  ]) {
    if (!refresh.includes(needle)) errors.push('capture-full-authority-model');
  }
  for (const needle of [
    '    nav,',
    '    address: address.address,',
    '    roster,',
    '    ecologyEpoch: roster.ecologyEpoch,',
    '    fullRosterFingerprint: roster.fullRosterFingerprint,',
    '    extensions: runtime.extensions,',
  ]) {
    if (!compose.includes(needle)) errors.push('capture-full-authority-model');
  }
  if (compose.includes('view.preview')) errors.push('capture-full-authority-model');

  const runner = section(
    source,
    'async function runCaptureCardAction(',
    '\nfunction engineeringOutcomeConverges(',
  );
  const commit = runner.indexOf('await commitArc4CaptureAction(request.verb, presentationFence);');
  const copy = runner.indexOf('const copy = captureOutcomeCopy(outcome);');
  const settle = runner.indexOf('captureCardController.settle(copy);');
  const refreshAfter = runner.indexOf("if (copy.convergence === 'none') refreshCaptureCardState();");
  if (!(commit >= 0 && copy > commit && settle > copy && refreshAfter > settle)
    || runner.slice(0, settle).includes('refreshCaptureCardState();')) {
    errors.push('capture-settle-before-refresh');
  }
  if (!runner.includes('presentationFence === null')
    || !runner.includes("detail: 'presentation-authority-unavailable'")) {
    errors.push('capture-presentation-fence');
  }
  if (!runner.includes("outcome.durability === 'committed'")
    || !runner.includes("arc4OwnershipProtection = 'committed-publication-reload';")
    || !runner.includes('scheduleF4AuthorityConvergenceReload(')) {
    errors.push('capture-presentation-convergence');
  }

  if (!source.includes("'[data-capture-action]',")) errors.push('capture-read-only-selector');
  if (!source.includes("if (blockRouteChangeWhileProductAction()) return false;")
    || !source.includes('if (productActionInFlight) return;')
    || !source.includes('if (blockRouteChangeWhileProductAction()) return;\n    const [lo, hi] = zoomLimits();')) {
    errors.push('capture-navigation-fence');
  }
  if (!source.includes('|| captureCardController.diagnostics().pendingDisabledBodyFocusOwned;')) {
    errors.push('capture-close-focus-lineage');
  }
  if (!source.includes("surveyOwnsCurrentCaptureSurface() && !productActionInFlight) {\n    refreshCaptureCardState();")) {
    errors.push('capture-active-play-refresh');
  }
  if (!source.includes('if (productActionCoordinator.busy || productActionFaultInjectionArmed()) return false;')
    || (source.match(/if \(productActionCoordinator\.busy \|\| productActionFaultInjectionArmed\(\)\) return false;/g) ?? []).length !== 6
    || !source.includes('lastFault: lastSmokeArc4ActionFaultWitness,')
    || !source.includes('card: captureCardController.diagnostics(),')
    || !source.includes('lastResult: lastArc4CaptureResult,')) {
    errors.push('capture-fault-and-ui-diagnostics');
  }
  const writer = section(
    source,
    'async function commitArc4CaptureAction(',
    '\nfunction captureActivePlayCountdown(',
  );
  const staleFault = writer.indexOf("if (faultInjection === 'stale-authority')");
  const staleFaultEnd = writer.indexOf('    let attempt:', staleFault);
  const staleFaultBody = staleFault >= 0 && staleFaultEnd > staleFault
    ? writer.slice(staleFault, staleFaultEnd) : '';
  const writerCall = writer.indexOf('attempt = await commitArc4CaptureAttemptV1({');
  const durableBoundary = writer.indexOf('durable = true;');
  const publicationFault = writer.indexOf('if (smokeRejectNextArc4Publication)');
  const publicationFaultEnd = writer.indexOf('      const verified =', publicationFault);
  const publicationFaultBody = publicationFault >= 0 && publicationFaultEnd > publicationFault
    ? writer.slice(publicationFault, publicationFaultEnd) : '';
  if (!source.includes("if (smokeRejectArc4StorageBoundary) {")
    || !source.includes("return Promise.reject(new Error('slice-smoke injected Arc 4 capture storage failure'));")
    || !(staleFault >= 0 && writerCall > staleFault)
    || !staleFaultBody.includes('const injected = await revisionRepo.mutate({')
    || !staleFaultBody.includes('expectedRevision: faultBeforeRevision,')
    || !staleFaultBody.includes('writes: [],')
    || !(durableBoundary >= 0 && publicationFault > durableBoundary)
    || !publicationFaultBody.includes('smokeRejectNextArc4Publication = false;')
    || !publicationFaultBody.includes("injection: 'publication-failure',")
    || !publicationFaultBody.includes("outcome: 'committed-publication-reload',")
    || !publicationFaultBody.includes("throw new Error('slice-smoke injected Arc 4 publication rejection');")) {
    errors.push('capture-fault-boundaries');
  }
  const unavailableEnd = writer.indexOf('  if (!isArc4CaptureVerb(verbValue))');
  const unavailable = unavailableEnd >= 0 ? writer.slice(0, unavailableEnd) : '';
  const refusedStart = writer.indexOf("if (attempt.kind === 'refused')");
  const refusedEnd = writer.indexOf('\n    /* Durability is terminal.', refusedStart);
  const refused = refusedStart >= 0 && refusedEnd > refusedStart
    ? writer.slice(refusedStart, refusedEnd) : '';
  if (!unavailable.includes('lastArc4CaptureResult = null;')
    || !unavailable.includes("lastArc4CaptureOutcome = `${verb ?? 'invalid'}-unavailable:${detail}`;")
    || !writer.includes("lastArc4CaptureOutcome = `${verb}-pending`;")
    || !refused.includes('lastArc4CaptureResult = null;')) {
    errors.push('capture-result-coherence');
  }

  const captureCss = section(cssSource, '    [data-capture-card-body] {', '\n    /* On a landed phone');
  if (captureCss.length === 0
    || !captureCss.includes('.capture-card-action {')
    || !captureCss.includes('min-height: 44px;')
    || !captureCss.includes('.capture-card-action:focus-visible')
    || !captureCss.includes('.capture-card-action:disabled')
    || !captureCss.includes('@media (max-width: 390px)')) {
    errors.push('capture-accessible-css');
  }
  return [...new Set(errors)];
}

function captureReconstructionErrors(source: string): string[] {
  const errors: string[] = [];
  const reconstruction = section(
    source,
    'function reconstructCurrentSurfaceSurvey()',
    '\ntype SurveyPresentationRow =',
  );
  const dock = section(
    source,
    "surveyDockEl.addEventListener('click', () => {",
    "\nchartsDockEl.addEventListener('click',",
  );
  const presenter = section(
    source,
    'function presentPlanetSurvey(',
    '\nfunction surveyPlanet(',
  );
  const surveyAction = section(
    source,
    'function surveyPlanet(',
    '\nfunction buildCardActions(',
  );
  if (reconstruction.length === 0 || dock.length === 0
    || presenter.length === 0 || surveyAction.length === 0) {
    errors.push('capture-reconstruction-source-section');
    return errors;
  }
  if ((source.match(/reconstructCurrentSurfaceSurvey\(\)/gu) ?? []).length !== 2
    || !dock.includes("if (card.style.display === 'none' && !card.innerHTML\n    && reconstructCurrentSurfaceSurvey()) return;")) {
    errors.push('capture-reconstruction-dock-only');
  }
  for (const needle of [
    "if (nav.mode !== 'surface' || trainingActive()) return false;",
    'const address = canonicalCF1WorldAddressFromNav(nav);',
    'renderedSceneReceipt.serial <= 0',
    "renderedSceneReceipt.mode !== 'surface'",
    'renderedSceneReceipt.ecologyEpoch !== currentEcologyEpoch()',
    'renderedSceneReceipt.galaxyKey !== getProvenGalaxyKey(nav.gal)',
    'renderedSceneReceipt.starKey !== getProvenStarKey(nav.star)',
    'renderedSceneReceipt.worldKey !== address.address.key',
  ]) {
    if (!reconstruction.includes(needle)) errors.push('capture-reconstruction-route-proof');
  }
  for (const needle of [
    'const planet = planetNodeForProof(nav.star, nav.planet);',
    'planet.seed !== address.address.planet.seed',
    'planet.ordinal !== address.address.planet.ordinal',
  ]) {
    if (!reconstruction.includes(needle)) errors.push('capture-reconstruction-planet-proof');
  }
  const present = reconstruction.indexOf('!presentPlanetSurvey(planet, nav.star, nav.planet)');
  const focus = reconstruction.indexOf('surveyFocusReturn = surveyDockEl;');
  if (!(present >= 0 && focus > present)) errors.push('capture-reconstruction-focus-lineage');

  const retainedStart = dock.indexOf(
    "if (card.style.display === 'none' && card.innerHTML && cardCtx) {",
  );
  const retainedEnd = dock.indexOf(
    "\n  if (card.style.display === 'none' && card.innerHTML) {",
    retainedStart,
  );
  const retained = retainedStart >= 0 && retainedEnd > retainedStart
    ? dock.slice(retainedStart, retainedEnd)
    : '';
  const retainedPresent = retained.indexOf(
    'if (presentPlanetSurvey(context.p, context.star, context.planet)) {',
  );
  const retainedFocus = retained.indexOf('surveyFocusReturn = surveyDockEl;', retainedPresent);
  const retainedReturn = retained.indexOf('return;', retainedFocus);
  if (!(retainedPresent >= 0 && retainedFocus > retainedPresent && retainedReturn > retainedFocus)) {
    errors.push('capture-retained-dock-focus-lineage');
  }

  const presentationOnly = `${reconstruction}\n${presenter}`;
  for (const forbidden of [
    'persistView(',
    "gameEvent('survey'",
    'playSurveyPing(',
    'playWhoosh(',
    'commitArc4CaptureAction(',
    'commitArc4CaptureAttemptV1(',
    '.nextDraw(',
    'lastArc4CaptureResult',
    'lastArc4CaptureOutcome',
  ]) {
    if (presentationOnly.includes(forbidden)) errors.push('capture-reconstruction-side-effects');
  }

  const presentCall = surveyAction.indexOf('if (!presentPlanetSurvey(p, star, supplied)) return false;');
  const audio = surveyAction.indexOf('playSurveyPing();');
  const event = surveyAction.indexOf("gameEvent('survey', { planetSeed: p.seed });");
  if (!(presentCall >= 0 && audio > presentCall && event > audio)) {
    errors.push('capture-normal-survey-effects');
  }
  return [...new Set(errors)];
}

function surfaceSurveyExitErrors(source: string): string[] {
  const errors: string[] = [];
  const hide = section(
    source,
    'function hideSurvey(',
    '\nfunction closeVisibleSurveyAndAscend(',
  );
  const closeAndAscend = section(
    source,
    'function closeVisibleSurveyAndAscend(',
    '\nfunction invalidateSurveyTravel(',
  );
  const contextMenu = section(
    source,
    "app.canvas.addEventListener('contextmenu', (e) => {",
    "\n  addEventListener('keydown', (e) => {",
  );
  const keyboard = section(
    source,
    "  addEventListener('keydown', (e) => {\n    if (e.defaultPrevented) return;",
    "\n  emitBootPhase('wiring-complete');",
  );
  const goUp = section(
    source,
    'function goUp(): void {',
    "\n\n/* the game's ZOOM-DRIVEN",
  );
  const pendingFence = section(
    source,
    'function blockRouteChangeWhileProductAction(): boolean {',
    '\nfunction blockPlayerMutation(',
  );
  const closeControl = section(
    source,
    "card.addEventListener('click', (e) => {",
    '\n  const act =',
  );
  if ([hide, closeAndAscend, contextMenu, keyboard, goUp, pendingFence, closeControl]
    .some((body) => body.length === 0)) {
    errors.push('surface-exit-source-section');
    return errors;
  }

  const hideCall = '  hideSurvey(restoreFocus);';
  const surfaceAscent = "  if (nav.mode === 'surface') goUp();";
  const hideAt = closeAndAscend.indexOf(hideCall);
  const ascentAt = closeAndAscend.indexOf(surfaceAscent);
  if ((closeAndAscend.match(/hideSurvey\(restoreFocus\);/gu) ?? []).length !== 1
    || (closeAndAscend.match(/if \(nav\.mode === 'surface'\) goUp\(\);/gu) ?? []).length !== 1
    || !(hideAt >= 0 && ascentAt > hideAt)
    || closeAndAscend.includes('persistView(')
    || closeAndAscend.includes('rerender(')) {
    errors.push('surface-exit-close-ascent-order');
  }

  const hideDisplay = hide.indexOf("card.style.display = 'none';");
  const focusGuard = hide.indexOf('if (restoreFocus && surveyFocusReturn?.isConnected)');
  const focusTarget = hide.indexOf('const target = surveyFocusReturn;', focusGuard);
  const clearLineage = hide.indexOf('surveyFocusReturn = null;', focusTarget);
  const queueFocus = hide.indexOf('queueMicrotask(() => target.focus());', clearLineage);
  if (!(hideDisplay >= 0 && focusGuard > hideDisplay && focusTarget > focusGuard
    && clearLineage > focusTarget && queueFocus > clearLineage)) {
    errors.push('surface-exit-focus-order');
  }
  if (hide.includes('goUp(')
    || hide.includes('ascend(')
    || hide.includes('rerender(')
    || hide.includes('persistView(')) {
    errors.push('surface-exit-hide-only');
  }

  const contextPrevent = contextMenu.indexOf('e.preventDefault();');
  const contextVisible = contextMenu.indexOf(
    "if (card.style.display !== 'none') { closeVisibleSurveyAndAscend(false); return; }",
  );
  const contextFallback = contextMenu.indexOf('\n    goUp();', contextVisible);
  if (!(contextPrevent >= 0 && contextVisible > contextPrevent && contextFallback > contextVisible)
    || (contextMenu.match(/closeVisibleSurveyAndAscend\(false\);/gu) ?? []).length !== 1
    || (contextMenu.match(/\n    goUp\(\);/gu) ?? []).length !== 1) {
    errors.push('surface-exit-contextmenu');
  }

  const cardBranch = section(
    keyboard,
    "    if (card.style.display !== 'none') {",
    '\n    goUp();',
  );
  const restoreStart = cardBranch.indexOf('const restoreSurveyOpener = card.contains(document.activeElement)');
  const pendingFocus = cardBranch.indexOf(
    '|| captureCardController.diagnostics().pendingDisabledBodyFocusOwned;',
    restoreStart,
  );
  const escapeClose = cardBranch.indexOf(
    'closeVisibleSurveyAndAscend(restoreSurveyOpener);',
    pendingFocus,
  );
  const escapeReturn = cardBranch.indexOf('return;', escapeClose);
  if (!(restoreStart >= 0 && pendingFocus > restoreStart
    && escapeClose > pendingFocus && escapeReturn > escapeClose)) {
    errors.push('surface-exit-escape-focus-lineage');
  }
  if ((cardBranch.match(/closeVisibleSurveyAndAscend\(restoreSurveyOpener\);/gu) ?? []).length !== 1
    || cardBranch.includes('hideSurvey(')
    || cardBranch.includes('persistView(')
    || cardBranch.includes('rerender(')) {
    errors.push('surface-exit-escape');
  }

  const guardAt = goUp.indexOf('if (blockRouteChangeWhileProductAction()) return;');
  const ascendAt = goUp.indexOf('const r = ascend(nav);');
  const rerenderAt = goUp.indexOf('rerender();');
  if (!(guardAt >= 0 && ascendAt > guardAt && rerenderAt > ascendAt)
    || (goUp.match(/blockRouteChangeWhileProductAction\(\)/gu) ?? []).length !== 1
    || (goUp.match(/rerender\(\);/gu) ?? []).length !== 1) {
    errors.push('surface-exit-pending-fence');
  }
  if (!pendingFence.includes('if (!productActionInFlight) return false;')
    || !pendingFence.includes('return true;')
    || pendingFence.includes('ascend(')
    || pendingFence.includes('rerender(')
    || pendingFence.includes('persistView(')) {
    errors.push('surface-exit-pending-fence');
  }

  const closeHide = closeControl.indexOf('hideSurvey(true);');
  const closeReturn = closeControl.indexOf('return;', closeHide);
  if (!(closeHide >= 0 && closeReturn > closeHide)
    || closeControl.includes('goUp(')
    || closeControl.includes('rerender(')
    || closeControl.includes('persistView(')
    || closeControl.includes('blockPlayerMutation(')
    || closeControl.includes('blockRouteChangeWhileProductAction(')) {
    errors.push('surface-exit-close-control');
  }
  return [...new Set(errors)];
}

type SurfaceSurveyExitAction = 'escape' | 'contextmenu' | 'close-control';

function runSurfaceSurveyExitFromSource(
  source: string,
  action: SurfaceSurveyExitAction,
  pending = false,
) {
  const hide = section(
    source,
    'function hideSurvey(',
    '\nfunction closeVisibleSurveyAndAscend(',
  );
  const closeAndAscend = section(
    source,
    'function closeVisibleSurveyAndAscend(',
    '\nfunction invalidateSurveyTravel(',
  );
  const goUp = section(
    source,
    'function goUp(): void {',
    "\n\n/* the game's ZOOM-DRIVEN",
  );
  const pendingFence = section(
    source,
    'function blockRouteChangeWhileProductAction(): boolean {',
    '\nfunction blockPlayerMutation(',
  );
  if ([hide, closeAndAscend, goUp, pendingFence].some((body) => body.length === 0)) {
    throw new Error('surface Survey exit source is missing');
  }
  const hideJs = hide.replace(
    'function hideSurvey(restoreFocus = false): void {',
    'function hideSurvey(restoreFocus = false) {',
  );
  const closeJs = closeAndAscend.replace(
    'function closeVisibleSurveyAndAscend(restoreFocus: boolean): void {',
    'function closeVisibleSurveyAndAscend(restoreFocus) {',
  );
  const goUpJs = goUp.replace('function goUp(): void {', 'function goUp() {');
  const pendingFenceJs = pendingFence.replace(
    'function blockRouteChangeWhileProductAction(): boolean {',
    'function blockRouteChangeWhileProductAction() {',
  );
  if (hideJs === hide || closeJs === closeAndAscend
    || goUpJs === goUp || pendingFenceJs === pendingFence) {
    throw new Error('surface Survey exit signature was not transformed');
  }
  const evaluator = new Function(
    'action',
    'pending',
    `const trace = [];
     const microtasks = [];
     let focus = action === 'contextmenu' ? 'canvas' : 'survey-action';
     let renders = 0;
     let writeAttempts = 0;
     const style = { value: 'block' };
     Object.defineProperty(style, 'display', {
       get() { return this.value; },
       set(value) { this.value = value; if (value === 'none') trace.push('hide'); },
     });
     const card = { style, setAttribute() {} };
     const document = { body: { classList: { remove() {} } } };
     const surveyDockEl = { classList: { remove() {} }, setAttribute() {} };
     const canvas = {
       isConnected: true,
       focus() { focus = 'canvas'; trace.push('focus:canvas'); },
     };
     let surveyFocusReturn = canvas;
     const queueMicrotask = (callback) => { trace.push('focus-queued'); microtasks.push(callback); };
     const syncSurfaceChromeBottom = () => {};
     let productActionInFlight = pending;
     const toast = () => { trace.push('blocked'); };
     let nav = {
       mode: 'surface',
       gal: { x: 90, y: -60, size: 40 },
       star: { x: 2, y: 3 },
       planet: { seed: 68, ordinal: 13 },
     };
     const cam = { x: 0, y: 0, z: 1 };
     const camT = { x: 0, y: 0, z: 1 };
     const minWH = () => 800;
     const sz0 = 0.5;
     const ascend = (state) => {
       trace.push('ascend');
       return {
         ok: true,
         state: { mode: 'system', gal: state.gal, star: state.star, planet: null },
       };
     };
     const playWhoosh = () => { trace.push('whoosh'); };
     const rerender = () => { trace.push('rerender'); renders += 1; writeAttempts += 1; };
     ${hideJs}
     ${closeJs}
     ${pendingFenceJs}
     ${goUpJs}
     if (action === 'close-control') hideSurvey(true);
     else closeVisibleSurveyAndAscend(action === 'escape');
     for (const callback of microtasks) callback();
     return {
       mode: nav.mode,
       cardOpen: card.style.display !== 'none',
       focus,
       renders,
       writeAttempts,
       trace,
     };`,
  ) as (action: SurfaceSurveyExitAction, pending: boolean) => Readonly<{
    mode: string;
    cardOpen: boolean;
    focus: string;
    renders: number;
    writeAttempts: number;
    trace: readonly string[];
  }>;
  return evaluator(action, pending);
}

type ReconstructionRunOptions = Readonly<{
  mode?: 'universe' | 'system' | 'surface';
  training?: boolean;
  addressOk?: boolean;
  receiptSerial?: number;
  receiptMode?: 'universe' | 'galaxy' | 'system' | 'surface';
  receiptEcologyEpoch?: number;
  currentEcologyEpoch?: number;
  receiptGalaxyKey?: string | null;
  receiptStarKey?: string | null;
  receiptWorldKey?: string | null;
  proof?: Readonly<{ seed: number; ordinal: number }> | null;
  addressSeed?: number;
  addressOrdinal?: number;
  presentResult?: boolean;
}>;

function runReconstructionFromSource(source: string, options: ReconstructionRunOptions = {}) {
  const reconstruction = section(
    source,
    'function reconstructCurrentSurfaceSurvey()',
    '\ntype SurveyPresentationRow =',
  );
  if (reconstruction.length === 0) throw new Error('reconstruction source is missing');
  const galaxy = Object.freeze({ proofKey: 'galaxy:proof' });
  const star = Object.freeze({ proofKey: 'star:proof' });
  const planet = Object.freeze({ proofKey: 'world:proof', seed: 68, ordinal: 13 });
  const nav = Object.freeze({ mode: options.mode ?? 'surface', gal: galaxy, star, planet });
  const trace = {
    canonical: 0, proof: 0, present: 0, persist: 0, event: 0,
    audio: 0, whoosh: 0, writer: 0, draw: 0, presentArgs: null as unknown[] | null,
  };
  const evaluator = new Function(
    'nav', 'trainingActive', 'canonicalCF1WorldAddressFromNav',
    'renderedSceneReceipt', 'currentEcologyEpoch', 'getProvenGalaxyKey', 'getProvenStarKey',
    'planetNodeForProof', 'presentPlanetSurvey', 'surveyDockEl', 'trace',
    'persistView', 'gameEvent', 'playSurveyPing', 'playWhoosh',
    'commitArc4CaptureAction', 'f4Runtime',
    `let surveyFocusReturn = null;
     let lastArc4CaptureResult = null;
     ${reconstruction}
     const result = reconstructCurrentSurfaceSurvey();
     return { result, surveyFocusReturn, lastArc4CaptureResult };`,
  ) as (...args: unknown[]) => {
    result: boolean;
    surveyFocusReturn: unknown;
    lastArc4CaptureResult: unknown;
  };
  const surveyDockEl = Object.freeze({ id: 'docksurvey' });
  const result = evaluator(
    nav,
    () => options.training ?? false,
    () => {
      trace.canonical += 1;
      return options.addressOk === false
        ? Object.freeze({ ok: false })
        : Object.freeze({
          ok: true,
          address: Object.freeze({
            key: 'world:proof',
            planet: Object.freeze({
              seed: options.addressSeed ?? 68,
              ordinal: options.addressOrdinal ?? 13,
            }),
          }),
        });
    },
    Object.freeze({
      serial: options.receiptSerial ?? 1,
      mode: options.receiptMode ?? 'surface',
      ecologyEpoch: options.receiptEcologyEpoch ?? 7,
      galaxyKey: options.receiptGalaxyKey === undefined ? 'galaxy:proof' : options.receiptGalaxyKey,
      starKey: options.receiptStarKey === undefined ? 'star:proof' : options.receiptStarKey,
      worldKey: options.receiptWorldKey === undefined ? 'world:proof' : options.receiptWorldKey,
    }),
    () => options.currentEcologyEpoch ?? 7,
    (value: unknown) => (value as { proofKey?: string }).proofKey ?? null,
    (value: unknown) => (value as { proofKey?: string }).proofKey ?? null,
    () => {
      trace.proof += 1;
      return options.proof === undefined ? Object.freeze({ seed: 68, ordinal: 13 }) : options.proof;
    },
    (...args: unknown[]) => {
      trace.present += 1;
      trace.presentArgs = args;
      return options.presentResult ?? true;
    },
    surveyDockEl,
    trace,
    () => { trace.persist += 1; },
    () => { trace.event += 1; },
    () => { trace.audio += 1; },
    () => { trace.whoosh += 1; },
    () => { trace.writer += 1; },
    Object.freeze({ nextDraw: () => { trace.draw += 1; } }),
  );
  return { ...result, surveyDockEl, trace };
}

function runNormalSurveyFromSource(source: string, presentationAccepted: boolean) {
  const surveyAction = section(
    source,
    'function surveyPlanet(',
    '\nfunction buildCardActions(',
  );
  if (surveyAction.length === 0) throw new Error('normal Survey source is missing');
  const javascript = surveyAction.replace(
    /^function surveyPlanet\([^)]*\): boolean \{/u,
    'function surveyPlanet(p, star, supplied) {',
  );
  if (javascript === surveyAction) throw new Error('normal Survey signature was not transformed');
  const trace = { present: 0, audio: 0, events: [] as unknown[] };
  const evaluator = new Function(
    'presentPlanetSurvey', 'playSurveyPing', 'gameEvent',
    `${javascript}; return surveyPlanet({ seed: 68 }, { key: 'star' }, { key: 'planet' });`,
  ) as (...args: unknown[]) => boolean;
  const result = evaluator(
    () => { trace.present += 1; return presentationAccepted; },
    () => { trace.audio += 1; },
    (...args: unknown[]) => { trace.events.push(args); },
  );
  return { result, trace };
}

describe('Arc 4 main authority wiring', () => {
  it('coalesces boot and Training authority and keeps presentation outside the writer', () => {
    expect(ARC4_OWNERSHIP_EXTENSION_TARGETS).toHaveLength(18);
    expect(bootErrors(mainSource)).toEqual([]);
    expect(trainingErrors(mainSource)).toEqual([]);
    expect(captureErrors(mainSource)).toEqual([]);
    expect(capturePresentationErrors(mainSource)).toEqual([]);
    expect(captureReconstructionErrors(mainSource)).toEqual([]);
    expect(surfaceSurveyExitErrors(mainSource)).toEqual([]);
  });

  it('closes and lifts a visible surface Survey exactly once while pending actions only close', () => {
    const escape = runSurfaceSurveyExitFromSource(mainSource, 'escape');
    expect(escape).toEqual({
      mode: 'system',
      cardOpen: false,
      focus: 'canvas',
      renders: 1,
      writeAttempts: 1,
      trace: ['hide', 'focus-queued', 'ascend', 'whoosh', 'rerender', 'focus:canvas'],
    });
    const contextMenu = runSurfaceSurveyExitFromSource(mainSource, 'contextmenu');
    expect(contextMenu).toEqual({
      mode: 'system',
      cardOpen: false,
      focus: 'canvas',
      renders: 1,
      writeAttempts: 1,
      trace: ['hide', 'ascend', 'whoosh', 'rerender'],
    });

    const pendingEscape = runSurfaceSurveyExitFromSource(mainSource, 'escape', true);
    expect(pendingEscape).toEqual({
      mode: 'surface',
      cardOpen: false,
      focus: 'canvas',
      renders: 0,
      writeAttempts: 0,
      trace: ['hide', 'focus-queued', 'blocked', 'focus:canvas'],
    });
    const pendingContextMenu = runSurfaceSurveyExitFromSource(mainSource, 'contextmenu', true);
    expect(pendingContextMenu).toEqual({
      mode: 'surface',
      cardOpen: false,
      focus: 'canvas',
      renders: 0,
      writeAttempts: 0,
      trace: ['hide', 'blocked'],
    });
    const pendingClose = runSurfaceSurveyExitFromSource(mainSource, 'close-control', true);
    expect(pendingClose).toEqual({
      mode: 'surface',
      cardOpen: false,
      focus: 'canvas',
      renders: 0,
      writeAttempts: 0,
      trace: ['hide', 'focus-queued', 'focus:canvas'],
    });

    const missingAscent = replaceInSectionExact(
      mainSource,
      'function closeVisibleSurveyAndAscend(',
      '\nfunction invalidateSurveyTravel(',
      "  if (nav.mode === 'surface') goUp();",
      '  /* historical surface lift omitted */',
    );
    expect(surfaceSurveyExitErrors(missingAscent))
      .toContain('surface-exit-close-ascent-order');
    expect(runSurfaceSurveyExitFromSource(missingAscent, 'escape').mode).toBe('surface');

    const ascentBeforeClose = replaceInSectionExact(
      mainSource,
      'function closeVisibleSurveyAndAscend(',
      '\nfunction invalidateSurveyTravel(',
      "  hideSurvey(restoreFocus);\n  if (nav.mode === 'surface') goUp();",
      "  if (nav.mode === 'surface') goUp();\n  hideSurvey(restoreFocus);",
    );
    expect(surfaceSurveyExitErrors(ascentBeforeClose))
      .toContain('surface-exit-close-ascent-order');
    expect(runSurfaceSurveyExitFromSource(ascentBeforeClose, 'escape').trace)
      .toEqual(['ascend', 'whoosh', 'rerender', 'hide', 'focus-queued', 'focus:canvas']);

    const unfencedPendingExit = replaceInSectionExact(
      mainSource,
      'function goUp(): void {',
      "\n\n/* the game's ZOOM-DRIVEN",
      '  if (blockRouteChangeWhileProductAction()) return;',
      '  /* pending product-action fence omitted */',
    );
    expect(surfaceSurveyExitErrors(unfencedPendingExit))
      .toContain('surface-exit-pending-fence');
    const leakedPendingExit = runSurfaceSurveyExitFromSource(unfencedPendingExit, 'escape', true);
    expect(leakedPendingExit).toMatchObject({
      mode: 'system', renders: 1, writeAttempts: 1,
    });

    const contextOnlyCloses = replaceInSectionExact(
      mainSource,
      "app.canvas.addEventListener('contextmenu', (e) => {",
      "\n  addEventListener('keydown', (e) => {",
      'closeVisibleSurveyAndAscend(false);',
      'hideSurvey(false);',
    );
    expect(surfaceSurveyExitErrors(contextOnlyCloses)).toContain('surface-exit-contextmenu');

    const escapeOnlyCloses = replaceInSectionExact(
      mainSource,
      "  addEventListener('keydown', (e) => {\n    if (e.defaultPrevented) return;",
      "\n  emitBootPhase('wiring-complete');",
      'closeVisibleSurveyAndAscend(restoreSurveyOpener);',
      'hideSurvey(restoreSurveyOpener);',
    );
    expect(surfaceSurveyExitErrors(escapeOnlyCloses)).toContain('surface-exit-escape');

    const lostPendingFocus = replaceInSectionExact(
      mainSource,
      "  addEventListener('keydown', (e) => {\n    if (e.defaultPrevented) return;",
      "\n  emitBootPhase('wiring-complete');",
      '        || captureCardController.diagnostics().pendingDisabledBodyFocusOwned;',
      '        || false;',
    );
    expect(surfaceSurveyExitErrors(lostPendingFocus))
      .toContain('surface-exit-escape-focus-lineage');

    const queuedBeforeLineageClear = replaceInSectionExact(
      mainSource,
      'function hideSurvey(',
      '\nfunction closeVisibleSurveyAndAscend(',
      '    surveyFocusReturn = null;\n    queueMicrotask(() => target.focus());',
      '    queueMicrotask(() => target.focus());\n    surveyFocusReturn = null;',
    );
    expect(surfaceSurveyExitErrors(queuedBeforeLineageClear))
      .toContain('surface-exit-focus-order');

    const writingHide = replaceInSectionExact(
      mainSource,
      'function hideSurvey(',
      '\nfunction closeVisibleSurveyAndAscend(',
      "  card.style.display = 'none';",
      "  card.style.display = 'none';\n  void persistView();",
    );
    expect(surfaceSurveyExitErrors(writingHide)).toContain('surface-exit-hide-only');

    const closeControlAscends = replaceInSectionExact(
      mainSource,
      "card.addEventListener('click', (e) => {",
      '\n  const act =',
      '    hideSurvey(true);',
      '    hideSurvey(true);\n    goUp();',
    );
    expect(surfaceSurveyExitErrors(closeControlAscends))
      .toContain('surface-exit-close-control');
  });

  it('negative-controls boot entry/mutation pending and parser section anchors', () => {
    const missingBootEntryPending = replaceInSectionExact(
      mainSource,
      'async function ensureBootAuthorityCommit(',
      '\nfunction f4RuntimeMayMutate(',
      '    && !arc4OwnershipBootstrapPending) return true;',
      '    && true) return true;',
    );
    expect(bootErrors(missingBootEntryPending)).toContain('boot-pending-entry');

    const ungatedBoot = replaceInSectionExact(
      mainSource,
      'function f4RuntimeMayMutate(',
      '\nfunction f4RuntimeMayAnswer(',
      '    || arc4OwnershipBootstrapPending) return false;',
      '    ) return false;',
    );
    expect(bootErrors(ungatedBoot)).toContain('boot-mutation-gate');

    const missingBootSection = mainSource.replace(
      'async function ensureBootAuthorityCommit(',
      'async function ensureBootAuthorityCommitRenamed(',
    );
    expect(missingBootSection).not.toBe(mainSource);
    expect(bootErrors(missingBootSection)).toContain('boot-source-section');
  });

  it('negative-controls exact Training Arc 2 + 18 writes and committed verifier state', () => {
    const trainingWithoutArc2 = replaceInSectionExact(
      mainSource,
      'async function completeTraining(',
      '\nconst F4_FRESH_RACE_RELEASE_KEY',
      '            ...(preparedLoot === null ? [] : [preparedLoot.write]),',
      '            /* Arc 2 write omitted */',
    );
    expect(trainingErrors(trainingWithoutArc2)).toContain('training-extension-write-composition');

    const trainingWithoutOwnership = replaceInSectionExact(
      mainSource,
      'async function completeTraining(',
      '\nconst F4_FRESH_RACE_RELEASE_KEY',
      '            ...(preparedOwnership === null ? [] : preparedOwnership.writes),',
      '            /* Arc 4 writes omitted */',
    );
    expect(trainingErrors(trainingWithoutOwnership)).toContain('training-extension-write-composition');

    const truncatedOwnershipWrites = replaceInSectionExact(
      mainSource,
      'async function completeTraining(',
      '\nconst F4_FRESH_RACE_RELEASE_KEY',
      '...(preparedOwnership === null ? [] : preparedOwnership.writes)',
      '...(preparedOwnership === null ? [] : preparedOwnership.writes.slice(0, 17))',
    );
    expect(trainingErrors(truncatedOwnershipWrites))
      .toContain('training-extension-write-composition');

    const preparedInsteadOfCommitted = replaceInSectionExact(
      mainSource,
      'async function completeTraining(',
      '\nconst F4_FRESH_RACE_RELEASE_KEY',
      'trainingCommittedState = committed.saved.canonicalState;',
      'trainingCommittedState = prepared.state;',
    );
    expect(trainingErrors(preparedInsteadOfCommitted))
      .toContain('training-committed-canonical-state');

    const wrongVerifierState = replaceInSectionExact(
      mainSource,
      'async function completeTraining(',
      '\nconst F4_FRESH_RACE_RELEASE_KEY',
      'committedTrainingArc4State(\n        trainingCommittedState,',
      'committedTrainingArc4State(\n        prepared.state,',
    );
    expect(trainingErrors(wrongVerifierState)).toContain('training-verifier-committed-state');

    const missingTrainingSection = mainSource.replace(
      'async function completeTraining(',
      'async function completeTrainingRenamed(',
    );
    expect(missingTrainingSection).not.toBe(mainSource);
    expect(trainingErrors(missingTrainingSection)).toContain('training-source-section');
  });

  it('negative-controls capture claim order and every exact production input', () => {

    const lateClaim = mainSource.replace(
      '  const actionClaim = productActionCoordinator.tryClaim(`arc4.capture.${verb}`);',
      '  /* Arc 4 claim moved after heartbeat */',
    );
    expect(lateClaim).not.toBe(mainSource);
    expect(captureErrors(lateClaim)).toContain('capture-authority-order');

    const inputMutants = [
      ['action', 'const intendedSurface = nav;', 'const intendedSurface = NAV_HOME;', 'capture-surface-input'],
      [
        'action',
        'const address = canonicalCF1WorldAddressFromNav(nav);',
        'const address = canonicalCF1WorldAddressFromNav(intendedSurface);',
        'capture-surface-input',
      ],
      [
        'action',
        'const rosterResult = canonicalWorldRoster(address.address, currentEcologyEpoch());',
        'const rosterResult = canonicalWorldRoster(address.address, currentEcologyEpoch() + 1);',
        'capture-ecology-input',
      ],
      ['helper', '      runtime,', '      runtime: {} as never,', 'capture-helper-inputs'],
      ['helper', '      state: save,', '      state: structuredClone(save),', 'capture-helper-inputs'],
      ['helper', '      nav,', '      nav: intendedSurface,', 'capture-helper-inputs'],
      ['helper', '      address: address.address,', '      address: nav,', 'capture-helper-inputs'],
      ['helper', '      roster: rosterResult.roster,', '      roster: rosterResult.roster.view.preview,', 'capture-helper-inputs'],
      ['helper', '      presentationFence,', "      presentationFence: 'cpf1:' + '0'.repeat(64),", 'capture-helper-inputs'],
      ['helper', '      verb,', "      verb: 'tame',", 'capture-helper-inputs'],
      ['helper', '      codecNow: Date.now(),', '      codecNow: 0,', 'capture-helper-inputs'],
    ] as const;
    for (const [scope, needle, replacement, expected] of inputMutants) {
      const mutant = replaceInSectionExact(
        mainSource,
        scope === 'helper'
          ? 'attempt = await commitArc4CaptureAttemptV1({'
          : 'async function commitArc4CaptureAction(',
        scope === 'helper'
          ? '\n    lastArc4CaptureOutcome ='
          : '\nfunction captureActivePlayCountdown(',
        needle,
        replacement,
      );
      expect(captureErrors(mutant), needle).toContain(expected);
    }

    const missingHelper = replaceInSectionExact(
      mainSource,
      'async function commitArc4CaptureAction(',
      '\nfunction captureActivePlayCountdown(',
      'attempt = await commitArc4CaptureAttemptV1({',
      'attempt = await commitArc4CaptureAttemptV2({',
    );
    expect(captureErrors(missingHelper)).toContain('capture-single-writer');

    const missingCaptureSection = mainSource.replace(
      'async function commitArc4CaptureAction(',
      'async function commitArc4CaptureActionRenamed(',
    );
    expect(missingCaptureSection).not.toBe(mainSource);
    expect(captureErrors(missingCaptureSection)).toContain('capture-source-section');
  });

  it('negative-controls player presentation authority, settlement, fencing and CSS', () => {
    const missingPending = mainSource.replace(
      '    captureCardController.setPending(request);',
      '    /* pending latch omitted */',
    );
    expect(missingPending).not.toBe(mainSource);
    expect(capturePresentationErrors(missingPending)).toContain('capture-pending-before-async');

    const freshFenceAtClick = mainSource.replace(
      '    const presentationFence = currentCapturePresentationFence;',
      '    const presentationFence = capturePresentationFenceForSurface(f4Runtime!, nav);',
    );
    expect(freshFenceAtClick).not.toBe(mainSource);
    expect(capturePresentationErrors(freshFenceAtClick))
      .toContain('capture-pending-before-async');

    const missingPreDrawFence = mainSource.replace(
      '        presentationFence,',
      "        presentationFence: 'cpf1:' + '0'.repeat(64),",
    );
    expect(missingPreDrawFence).not.toBe(mainSource);
    expect(captureErrors(missingPreDrawFence)).toContain('capture-helper-inputs');

    const unstableContext = mainSource.replace(
      'captureCardModelFromPresentation(\n    presentation,\n    fallbackKey,',
      'captureCardModelFromPresentation(\n    presentation,\n    presentation.snapshotFingerprint,',
    );
    expect(unstableContext).not.toBe(mainSource);
    expect(capturePresentationErrors(unstableContext)).toContain('capture-full-authority-model');

    const missingSettlement = mainSource.replace(
      '    captureCardController.settle(copy);',
      '    /* exact pending settlement omitted */',
    );
    expect(missingSettlement).not.toBe(mainSource);
    expect(capturePresentationErrors(missingSettlement)).toContain('capture-settle-before-refresh');

    const staleVisiblePreview = mainSource.replace(
      '  if (!planetsideMatchesFullRoster(roster)) fillPlanetside(nav, roster);',
      '  /* visible preview left on the prior ecology identity */',
    );
    expect(staleVisiblePreview).not.toBe(mainSource);
    expect(capturePresentationErrors(staleVisiblePreview)).toContain('capture-full-authority-model');

    const rngBoundContext = mainSource.replace(
      '  currentCapturePresentationFence = unavailableDetail === null ? presentationFence : null;',
      '  currentCapturePresentationFence = composed.snapshot.fingerprint;',
    );
    expect(rngBoundContext).not.toBe(mainSource);
    expect(capturePresentationErrors(rngBoundContext)).toContain('capture-full-authority-model');

    const unfencedCapture = mainSource.replace(
      "  '[data-capture-action]',",
      "  '[data-capture-action-omitted]',",
    );
    expect(unfencedCapture).not.toBe(mainSource);
    expect(capturePresentationErrors(unfencedCapture)).toContain('capture-read-only-selector');

    const lostBodyLineage = mainSource.replace(
      '        || captureCardController.diagnostics().pendingDisabledBodyFocusOwned;',
      '        || false;',
    );
    expect(lostBodyLineage).not.toBe(mainSource);
    expect(capturePresentationErrors(lostBodyLineage)).toContain('capture-close-focus-lineage');

    const independentlyArmedFault = mainSource.replace(
      'if (productActionCoordinator.busy || productActionFaultInjectionArmed()) return false;',
      'if (productActionCoordinator.busy || smokeRejectNextArc4ActionStorage) return false;',
    );
    expect(independentlyArmedFault).not.toBe(mainSource);
    expect(capturePresentationErrors(independentlyArmedFault))
      .toContain('capture-fault-and-ui-diagnostics');

    const staleResult = mainSource.replace(
      "    if (attempt.kind === 'refused') {\n      lastArc4CaptureResult = null;",
      "    if (attempt.kind === 'refused') {\n      /* prior hit result retained */",
    );
    expect(staleResult).not.toBe(mainSource);
    expect(capturePresentationErrors(staleResult)).toContain('capture-result-coherence');

    const staleUnavailableResult = mainSource.replace(
      '    lastArc4CaptureResult = null;\n    lastArc4CaptureOutcome = `${verb ?? \'invalid\'}-unavailable:${detail}`;',
      '    /* prior result retained on unavailable */\n    lastArc4CaptureOutcome = `${verb ?? \'invalid\'}-unavailable:${detail}`;',
    );
    expect(staleUnavailableResult).not.toBe(mainSource);
    expect(capturePresentationErrors(staleUnavailableResult))
      .toContain('capture-result-coherence');

    const staleWithoutRevisionBump = replaceInSectionExact(
      mainSource,
      'async function commitArc4CaptureAction(',
      '\nfunction captureActivePlayCountdown(',
      '      const injected = await revisionRepo.mutate({',
      '      const injected = await Promise.resolve({ kind: \'committed\', revision: faultBeforeRevision });',
    );
    expect(staleWithoutRevisionBump).not.toBe(mainSource);
    expect(capturePresentationErrors(staleWithoutRevisionBump))
      .toContain('capture-fault-boundaries');

    const storageBypass = mainSource.replace(
      '    if (smokeRejectArc4StorageBoundary) {',
      '    if (false) {',
    );
    expect(storageBypass).not.toBe(mainSource);
    expect(capturePresentationErrors(storageBypass)).toContain('capture-fault-boundaries');

    const publicationWithoutThrow = replaceInSectionExact(
      mainSource,
      'async function commitArc4CaptureAction(',
      '\nfunction captureActivePlayCountdown(',
      "        throw new Error('slice-smoke injected Arc 4 publication rejection');",
      '        /* publication injection failed open */',
    );
    expect(publicationWithoutThrow).not.toBe(mainSource);
    expect(capturePresentationErrors(publicationWithoutThrow))
      .toContain('capture-fault-boundaries');

    const earlyPublicationFault = replaceInSectionExact(
      mainSource,
      'async function commitArc4CaptureAction(',
      '\nfunction captureActivePlayCountdown(',
      '    durable = true;',
      "    if (smokeRejectNextArc4Publication) { /* injected before durability */ }\n    durable = true;",
    );
    expect(earlyPublicationFault).not.toBe(mainSource);
    expect(capturePresentationErrors(earlyPublicationFault)).toContain('capture-fault-boundaries');

    const undersizedCss = indexSource.replace(
      '      min-width: 88px; min-height: 44px;',
      '      min-width: 88px; min-height: 20px;',
    );
    expect(undersizedCss).not.toBe(indexSource);
    expect(capturePresentationErrors(mainSource, undersizedCss)).toContain('capture-accessible-css');
  });

  it('reconstructs a missing card only from the exact proven rendered surface', () => {
    const accepted = runReconstructionFromSource(mainSource);
    expect(accepted.result).toBe(true);
    expect(accepted.surveyFocusReturn).toBe(accepted.surveyDockEl);
    expect(accepted.trace).toMatchObject({
      canonical: 1,
      proof: 1,
      present: 1,
      persist: 0,
      event: 0,
      audio: 0,
      whoosh: 0,
      writer: 0,
      draw: 0,
    });
    expect(accepted.trace.presentArgs).toEqual([
      { seed: 68, ordinal: 13 },
      { proofKey: 'star:proof' },
      { proofKey: 'world:proof', seed: 68, ordinal: 13 },
    ]);
    expect(accepted.lastArc4CaptureResult).toBeNull();

    for (const mode of ['universe', 'system'] as const) {
      const wrongRoute = runReconstructionFromSource(mainSource, { mode });
      expect(wrongRoute.result, mode).toBe(false);
      expect(wrongRoute.surveyFocusReturn, mode).toBeNull();
      expect(wrongRoute.trace, mode).toMatchObject({ canonical: 0, proof: 0, present: 0 });
    }
    const unproven = runReconstructionFromSource(mainSource, { addressOk: false });
    expect(unproven.result).toBe(false);
    expect(unproven.trace).toMatchObject({ canonical: 1, proof: 0, present: 0 });

    for (const options of [
      { receiptSerial: 0 },
      { receiptMode: 'system' as const },
      { receiptEcologyEpoch: 6 },
      { receiptGalaxyKey: 'other-galaxy' },
      { receiptStarKey: 'other-star' },
      { receiptWorldKey: 'other-world' },
    ]) {
      const staleRender = runReconstructionFromSource(mainSource, options);
      expect(staleRender.result, JSON.stringify(options)).toBe(false);
      expect(staleRender.trace, JSON.stringify(options)).toMatchObject({ proof: 0, present: 0 });
    }

    const missingProof = runReconstructionFromSource(mainSource, { proof: null });
    expect(missingProof.result).toBe(false);
    expect(missingProof.trace).toMatchObject({ proof: 1, present: 0 });
    const wrongSeed = runReconstructionFromSource(mainSource, {
      proof: { seed: 69, ordinal: 13 },
    });
    expect(wrongSeed.result).toBe(false);
    expect(wrongSeed.trace.present).toBe(0);
    const wrongOrdinal = runReconstructionFromSource(mainSource, {
      proof: { seed: 68, ordinal: 12 },
    });
    expect(wrongOrdinal.result).toBe(false);
    expect(wrongOrdinal.trace.present).toBe(0);
  });

  it('negative-controls dock reachability, route/receipt proof, focus and forbidden effects', () => {
    const missingReconstruction = replaceInSectionExact(
      mainSource,
      "surveyDockEl.addEventListener('click', () => {",
      "\nchartsDockEl.addEventListener('click',",
      "  if (card.style.display === 'none' && !card.innerHTML\n    && reconstructCurrentSurfaceSurvey()) return;",
      '  /* missing-card reconstruction omitted */',
    );
    expect(captureReconstructionErrors(missingReconstruction))
      .toContain('capture-reconstruction-dock-only');

    const earlyRetainedFocus = replaceInSectionExact(
      mainSource,
      "surveyDockEl.addEventListener('click', () => {",
      "\nchartsDockEl.addEventListener('click',",
      "    if (presentPlanetSurvey(context.p, context.star, context.planet)) {\n" +
        "      /* Rebuilding may infer the still-focused canvas as an opener. The\n" +
        "         explicit dock activation owns the final return lineage. */\n" +
        "      surveyFocusReturn = surveyDockEl;\n" +
        "      return;\n" +
        "    }",
      "    surveyFocusReturn = surveyDockEl;\n" +
        "    if (presentPlanetSurvey(context.p, context.star, context.planet)) return;",
    );
    expect(captureReconstructionErrors(earlyRetainedFocus))
      .toContain('capture-retained-dock-focus-lineage');

    const missingRetainedFocus = replaceInSectionExact(
      mainSource,
      "surveyDockEl.addEventListener('click', () => {",
      "\nchartsDockEl.addEventListener('click',",
      "      surveyFocusReturn = surveyDockEl;\n      return;",
      '      return;',
    );
    expect(captureReconstructionErrors(missingRetainedFocus))
      .toContain('capture-retained-dock-focus-lineage');

    const wrongRouteGuard = replaceInSectionExact(
      mainSource,
      'function reconstructCurrentSurfaceSurvey()',
      '\ntype SurveyPresentationRow =',
      "  if (nav.mode !== 'surface' || trainingActive()) return false;",
      "  if (nav.mode === 'universe' || trainingActive()) return false;",
    );
    expect(captureReconstructionErrors(wrongRouteGuard))
      .toContain('capture-reconstruction-route-proof');
    expect(runReconstructionFromSource(wrongRouteGuard, { mode: 'system' }).result).toBe(true);

    const removedReceiptProof = replaceInSectionExact(
      mainSource,
      'function reconstructCurrentSurfaceSurvey()',
      '\ntype SurveyPresentationRow =',
      '    || renderedSceneReceipt.worldKey !== address.address.key) return false;',
      '    || false) return false;',
    );
    expect(captureReconstructionErrors(removedReceiptProof))
      .toContain('capture-reconstruction-route-proof');
    expect(runReconstructionFromSource(removedReceiptProof, {
      receiptWorldKey: 'stale-world',
    }).result).toBe(true);

    const removedEpochProof = replaceInSectionExact(
      mainSource,
      'function reconstructCurrentSurfaceSurvey()',
      '\ntype SurveyPresentationRow =',
      '    || renderedSceneReceipt.ecologyEpoch !== currentEcologyEpoch()',
      '    || false',
    );
    expect(captureReconstructionErrors(removedEpochProof))
      .toContain('capture-reconstruction-route-proof');
    expect(runReconstructionFromSource(removedEpochProof, {
      receiptEcologyEpoch: 6,
      currentEcologyEpoch: 7,
    }).result).toBe(true);

    const removedPlanetProof = replaceInSectionExact(
      mainSource,
      'function reconstructCurrentSurfaceSurvey()',
      '\ntype SurveyPresentationRow =',
      '  const planet = planetNodeForProof(nav.star, nav.planet);',
      '  const planet = nav.planet;',
    );
    expect(captureReconstructionErrors(removedPlanetProof))
      .toContain('capture-reconstruction-planet-proof');
    const proofBypass = runReconstructionFromSource(removedPlanetProof, { proof: null });
    expect(proofBypass.result).toBe(true);
    expect(proofBypass.trace).toMatchObject({ proof: 0, present: 1 });

    const lostFocusLineage = replaceInSectionExact(
      mainSource,
      'function reconstructCurrentSurfaceSurvey()',
      '\ntype SurveyPresentationRow =',
      '  surveyFocusReturn = surveyDockEl;',
      '  /* Survey opener lineage omitted */',
    );
    expect(captureReconstructionErrors(lostFocusLineage))
      .toContain('capture-reconstruction-focus-lineage');
    const focusBypass = runReconstructionFromSource(lostFocusLineage);
    expect(focusBypass.result).toBe(true);
    expect(focusBypass.surveyFocusReturn).toBeNull();

    const sideEffects = [
      ['void persistView();', 'persist'],
      ["gameEvent('survey', { planetSeed: planet.seed });", 'event'],
      ['playSurveyPing();', 'audio'],
      ['playWhoosh();', 'whoosh'],
      ["void commitArc4CaptureAction('sample');", 'writer'],
      ['void f4Runtime.nextDraw();', 'draw'],
    ] as const;
    for (const [statement, counter] of sideEffects) {
      const mutant = replaceInSectionExact(
        mainSource,
        'function reconstructCurrentSurfaceSurvey()',
        '\ntype SurveyPresentationRow =',
        '  surveyFocusReturn = surveyDockEl;',
        `  ${statement}\n  surveyFocusReturn = surveyDockEl;`,
      );
      expect(captureReconstructionErrors(mutant), statement)
        .toContain('capture-reconstruction-side-effects');
      const run = runReconstructionFromSource(mutant);
      expect(run.result, statement).toBe(true);
      expect(run.trace[counter], statement).toBe(1);
    }
    const receiptMutation = replaceInSectionExact(
      mainSource,
      'function reconstructCurrentSurfaceSurvey()',
      '\ntype SurveyPresentationRow =',
      '  surveyFocusReturn = surveyDockEl;',
      '  lastArc4CaptureResult = {};\n  surveyFocusReturn = surveyDockEl;',
    );
    expect(captureReconstructionErrors(receiptMutation))
      .toContain('capture-reconstruction-side-effects');
    expect(runReconstructionFromSource(receiptMutation).lastArc4CaptureResult).toEqual({});
  });

  it('keeps normal planet Survey as the sole audio and survey-event owner', () => {
    const accepted = runNormalSurveyFromSource(mainSource, true);
    expect(accepted.result).toBe(true);
    expect(accepted.trace).toEqual({
      present: 1,
      audio: 1,
      events: [['survey', { planetSeed: 68 }]],
    });
    const rejected = runNormalSurveyFromSource(mainSource, false);
    expect(rejected.result).toBe(false);
    expect(rejected.trace).toEqual({ present: 1, audio: 0, events: [] });

    const missingAudio = replaceInSectionExact(
      mainSource,
      'function surveyPlanet(',
      '\nfunction buildCardActions(',
      '  playSurveyPing();   /* the ACT of surveying answers back (main.js) */',
      '  /* Survey audio omitted */',
    );
    expect(captureReconstructionErrors(missingAudio)).toContain('capture-normal-survey-effects');
    expect(runNormalSurveyFromSource(missingAudio, true).trace.audio).toBe(0);

    const missingEvent = replaceInSectionExact(
      mainSource,
      'function surveyPlanet(',
      '\nfunction buildCardActions(',
      "  gameEvent('survey', { planetSeed: p.seed });",
      '  /* Survey event omitted */',
    );
    expect(captureReconstructionErrors(missingEvent)).toContain('capture-normal-survey-effects');
    expect(runNormalSurveyFromSource(missingEvent, true).trace.events).toEqual([]);
  });
});
