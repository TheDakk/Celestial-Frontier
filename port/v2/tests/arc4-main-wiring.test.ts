import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ARC4_OWNERSHIP_EXTENSION_TARGETS } from '@cf/persistence';

const here = path.dirname(fileURLToPath(import.meta.url));
const mainSource = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'src', 'main.ts'), 'utf8');

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
    '\nfunction engineeringOutcomeConverges(',
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
  const commit = body.indexOf('const attempt = await commitArc4CaptureAttemptV1({');
  const durable = body.indexOf('durable = true;', commit);
  const verify = body.indexOf('const verified = verifyArc4CommittedCaptureV1({', durable);
  const publish = body.indexOf('publishArc4CaptureFields(save, transaction.state);', verify);
  const settle = body.indexOf('actionClaim.settle(durable);', publish);
  if (!(claim >= 0 && hold > claim && heartbeat > hold && revalidate > heartbeat
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
    'const rosterResult = canonicalWorldRoster(address.address, epochClock.current());',
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

describe('Arc 4 main authority wiring', () => {
  it('coalesces boot and Training authority and keeps the writer headless', () => {
    expect(ARC4_OWNERSHIP_EXTENSION_TARGETS).toHaveLength(18);
    expect(bootErrors(mainSource)).toEqual([]);
    expect(trainingErrors(mainSource)).toEqual([]);
    expect(captureErrors(mainSource)).toEqual([]);
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
        'const rosterResult = canonicalWorldRoster(address.address, epochClock.current());',
        'const rosterResult = canonicalWorldRoster(address.address, epochClock.current() + 1);',
        'capture-ecology-input',
      ],
      ['helper', '      runtime,', '      runtime: {} as never,', 'capture-helper-inputs'],
      ['helper', '      state: save,', '      state: structuredClone(save),', 'capture-helper-inputs'],
      ['helper', '      nav,', '      nav: intendedSurface,', 'capture-helper-inputs'],
      ['helper', '      address: address.address,', '      address: nav,', 'capture-helper-inputs'],
      ['helper', '      roster: rosterResult.roster,', '      roster: rosterResult.roster.view.preview,', 'capture-helper-inputs'],
      ['helper', '      verb,', "      verb: 'tame',", 'capture-helper-inputs'],
      ['helper', '      codecNow: Date.now(),', '      codecNow: 0,', 'capture-helper-inputs'],
    ] as const;
    for (const [scope, needle, replacement, expected] of inputMutants) {
      const mutant = replaceInSectionExact(
        mainSource,
        scope === 'helper'
          ? 'const attempt = await commitArc4CaptureAttemptV1({'
          : 'async function commitArc4CaptureAction(',
        scope === 'helper'
          ? '\n    lastArc4CaptureOutcome ='
          : '\nfunction engineeringOutcomeConverges(',
        needle,
        replacement,
      );
      expect(captureErrors(mutant), needle).toContain(expected);
    }

    const missingHelper = replaceInSectionExact(
      mainSource,
      'async function commitArc4CaptureAction(',
      '\nfunction engineeringOutcomeConverges(',
      'const attempt = await commitArc4CaptureAttemptV1({',
      'const attempt = await commitArc4CaptureAttemptV2({',
    );
    expect(captureErrors(missingHelper)).toContain('capture-single-writer');

    const missingCaptureSection = mainSource.replace(
      'async function commitArc4CaptureAction(',
      'async function commitArc4CaptureActionRenamed(',
    );
    expect(missingCaptureSection).not.toBe(mainSource);
    expect(captureErrors(missingCaptureSection)).toContain('capture-source-section');
  });
});
