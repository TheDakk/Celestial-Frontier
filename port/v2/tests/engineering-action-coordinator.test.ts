import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import {
  createProductActionCoordinator,
  createProductActionDiagnosticHold,
} from '../apps/game/src/product-action-coordinator.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const mainSource = fs.readFileSync(path.join(here, '../apps/game/src/main.ts'), 'utf8');

function sourceSection(source: string, startText: string, endText: string): string {
  const start = source.indexOf(startText);
  const end = source.indexOf(endText, start);
  return start >= 0 && end > start ? source.slice(start, end) : '';
}

function replaceInSourceSectionExact(
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

function actionOrderErrors(body: string, arc: 'Arc 2' | 'Arc 3' | 'Arc 4'): string[] {
  const errors: string[] = [];
  if (body.length === 0) {
    errors.push(`${arc} source section is missing`);
    return errors;
  }
  const claim = body.indexOf('const actionClaim = productActionCoordinator.tryClaim(');
  const barrier = body.indexOf('activePersist = actionBarrier;');
  const hold = body.indexOf('await smokeProductActionHold.holdIfArmed(actionClaim.operation);');
  const heartbeat = body.indexOf('await settleF4Heartbeat();');
  const commit = body.indexOf(arc === 'Arc 2'
    ? 'await runtime.commitProduct({'
    : arc === 'Arc 3'
      ? 'await runtime.commitAction({'
      : 'await commitArc4CaptureAttemptV1({');
  const settle = body.indexOf('actionClaim.settle(durable);');
  if (!(claim >= 0 && barrier > claim && hold > barrier && heartbeat > hold
    && commit > heartbeat && settle > commit)) {
    errors.push(`${arc} must claim/fence/hold synchronously before heartbeat and commit`);
  }
  const secondGuardStart = body.indexOf('if (!f4RuntimeMayMutate(runtime)', heartbeat);
  const secondGuardReturn = arc === 'Arc 4'
    ? "return unavailable('write-authority-changed', verb);"
    : "return unavailable('write-authority-changed');";
  const secondGuardEnd = body.indexOf(secondGuardReturn, secondGuardStart);
  const secondGuard = secondGuardStart >= 0 && secondGuardEnd > secondGuardStart
    ? body.slice(secondGuardStart, secondGuardEnd)
    : '';
  if (secondGuard.length === 0) {
    errors.push(`${arc} post-heartbeat authority guard is missing or unparseable`);
  } else if (secondGuard.includes('activePersist')) {
    errors.push(`${arc} post-heartbeat guard rejects persistence queued behind its own barrier`);
  }
  return errors;
}

function coordinatorContractErrors(source: string): string[] {
  const errors: string[] = [];
  const arc2 = sourceSection(
    source,
    'async function commitArc2InventoryAction(',
    '\ntype Arc3AppActionOperation =',
  );
  const arc3 = sourceSection(
    source,
    'async function commitArc3EngineeringAction(',
    '\nasync function mineCurrentSurface()',
  );
  const arc4 = sourceSection(
    source,
    'async function commitArc4CaptureAction(',
    '\nfunction arc6CombatOutcomeCopy(',
  );
  errors.push(
    ...actionOrderErrors(arc2, 'Arc 2'),
    ...actionOrderErrors(arc3, 'Arc 3'),
    ...actionOrderErrors(arc4, 'Arc 4'),
  );
  const arc2ReadOnly = arc2.indexOf(
    'if (smokeForceReadOnly || !f4RuntimeMayMutate(runtime) || activePersist || importWriteInFlight',
  );
  const arc2Preflight = arc2.indexOf('const preflight = planArc2InventoryAction(');
  if (!(arc2ReadOnly >= 0 && arc2Preflight > arc2ReadOnly)) {
    errors.push('Arc 2 must publish diagnostic read-only refusal before planning or claiming an action');
  }
  const heartbeatCycle = sourceSection(
    source,
    'const runF4HeartbeatCycle =',
    '\nconst heartbeatF4 =',
  );
  const checkpoint = sourceSection(
    heartbeatCycle,
    'if (checkpointDue',
    '\n  if (heartbeatOwned && openPanelId()',
  );
  if (!checkpoint.includes('!productActionInFlight')) {
    errors.push('Heartbeat checkpoint can wait on the product action that is waiting on that heartbeat');
  }
  if (!checkpoint.includes('!activePersist')) {
    errors.push('Heartbeat checkpoint can queue behind ordinary persistence waiting on that heartbeat');
  }
  if (!checkpoint.includes(
    'if (checkpointDue && !productActionInFlight && !activePersist) {',
  )) {
    errors.push('Heartbeat checkpoint gate does not exactly fence both persistence owners');
  }
  if (!checkpoint.includes(
    "await persistView(null, 'ordinary', F4_HEARTBEAT_CYCLE_CHECKPOINT_OWNER);",
  )) {
    errors.push('Heartbeat checkpoint lacks its private cycle-owner persistence token');
  }
  if (!source.includes('const productActionCoordinator = createProductActionCoordinator();')) {
    errors.push('Arc 2, Arc 3 and Arc 4 do not share one main-owned product coordinator');
  }
  return errors;
}

function readModelRefreshContractErrors(source: string): string[] {
  const errors: string[] = [];
  const refresh = sourceSection(
    source,
    'function refreshEngineeringPanelState(): void {',
    '\nfunction updateChips(): void {',
  );
  for (const [needle, label] of [
    ['!f4RuntimeMayMutate(runtime)', 'mutable current F4 authority'],
    ['readArc3Engineering(', 'fresh Arc 3 carrier'],
    ['readArc2Loot(runtime.extensions)', 'fresh Arc 2 carrier'],
    ['arc2LootLegacyMirrorMatches(arc2.state, save)', 'Arc 2 legacy mirror proof'],
    ['verifyArc3CommittedAction({', 'Arc 3 carrier/legacy proof'],
    ['engineering: verified.state', 'verified Arc 3 state publication'],
  ] as const) {
    if (!refresh.includes(needle)) errors.push(`Engineering refresh omits ${label}`);
  }
  const settlement = sourceSection(
    source,
    'async function runEngineeringPanelAction(',
    '\nasync function smokeCommitF4Outcome()',
  );
  const refreshAt = settlement.indexOf('refreshEngineeringPanelState();');
  const common = settlement.indexOf('if (!converging) {', refreshAt);
  const unlock = settlement.indexOf('engineeringPanelController.setPending(null);', common);
  const outcomeBranch = settlement.indexOf("if (outcome.kind === 'committed'", common);
  if (!(refreshAt >= 0 && common > refreshAt && unlock > common && outcomeBranch > unlock)) {
    errors.push('Every Engineering settlement must refresh, then only ordinary outcomes may unlock');
  }
  return errors;
}

function diagnosticFaultContractErrors(source: string): string[] {
  const errors: string[] = [];
  const arc3 = sourceSection(
    source,
    'async function commitArc3EngineeringAction(',
    '\nasync function mineCurrentSurface()',
  );
  const storageArm = arc3.indexOf('smokeRejectArc3StorageBoundary = true;');
  const commit = arc3.indexOf('await runtime.commitAction({');
  const storageClear = arc3.indexOf('smokeRejectArc3StorageBoundary = false;', commit);
  if (!(storageArm >= 0 && commit > storageArm && storageClear > commit)) {
    errors.push('Arc 3 storage fault does not wrap the real commitAction boundary once');
  }
  const staleBump = arc3.indexOf('const injected = await revisionRepo.mutate({');
  if (!(staleBump >= 0 && staleBump < commit && arc3.includes('writes: [],', staleBump))) {
    errors.push('Arc 3 stale fault does not advance only revision before the real commitAction');
  }
  const backendFault = sourceSection(
    source,
    'const persistenceBackend: StorageBackend = {',
    '\nconst repo = createSaveRepository(persistenceBackend);',
  );
  if (!backendFault.includes('if (smokeRejectArc3StorageBoundary)')
    || !backendFault.includes("Promise.reject(new Error('slice-smoke injected Arc 3 action storage failure'))")) {
    errors.push('Arc 3 storage fault bypasses the production backend compare-and-apply');
  }
  for (const hook of [
    '__smokeArmArc3ActionHold',
    '__smokeReleaseArc3ActionHold',
    '__smokeRejectNextArc3ActionStorage',
    '__smokeStaleNextArc3ActionAuthority',
    '__smokeRejectNextArc3Publication',
  ]) {
    if (!source.includes(hook)) errors.push(`Missing browser diagnostic hook ${hook}`);
  }
  if (!source.includes('owner: productActionCoordinator.diagnostics()')
    || !source.includes('hold: smokeProductActionHold.diagnostics()')
    || !source.includes('publicationFailure: smokeRejectNextArc3Publication')
    || !source.includes('lastFault: lastSmokeArc3ActionFaultWitness')) {
    errors.push('Product action diagnostics omit bounded owner/hold/fault witnesses');
  }
  const publicationFault = arc3.indexOf("injection: 'publication-failure'");
  const publicationThrow = arc3.indexOf("throw new Error('slice-smoke injected Arc 3 publication rejection');");
  if (!(publicationFault > commit && publicationThrow > publicationFault)
    || !arc3.slice(publicationFault, publicationThrow).includes('injectedRevision: outcome.revision')
    || !arc3.slice(publicationFault, publicationThrow).includes("outcome: 'committed-publication-reload'")) {
    errors.push('Arc 3 publication fault lacks an exact post-durable revision witness');
  }
  return errors;
}

function arc3ActionBindingErrors(source: string): string[] {
  const errors: string[] = [];
  const generic = sourceSection(
    source,
    'async function commitArc3EngineeringAction(',
    '\nasync function mineCurrentSurface()',
  );
  const commit = generic.indexOf('await runtime.commitAction({');
  const durable = generic.indexOf('durable = true;', commit);
  const checkpoint = generic.indexOf('const checkpoint = runtime.checkpointParent();', durable);
  const verify = generic.indexOf('const verified = spec.verify({', checkpoint);
  const publish = generic.indexOf('spec.publish(save, outcome.state, verified);', verify);
  if (!(commit >= 0 && durable > commit && checkpoint > durable
    && verify > checkpoint && publish > verify)) {
    errors.push('Arc 3 may publish only after one commitAction is durable and independently verified');
  }
  if (!generic.includes('runtime !== f4Runtime')
    || !generic.includes('runtime.revision !== outcome.revision')
    || !generic.includes('JSON.stringify(checkpoint) !== JSON.stringify(outcome.state)')
    || !generic.includes('JSON.stringify(outcome.state) !== JSON.stringify(outcome.saved.canonicalState)')) {
    errors.push('Arc 3 postcommit verifier omits its exact runtime checkpoint');
  }
  if (!generic.includes(
    'derive: ({ draft, extensions, activePlayMs, receiptOrdinal, canonicalizeState }) => {',
  )
    || !generic.includes('plannedHolder.value = Object.freeze({')
    || !generic.includes('state: canonicalizeState(derived.derivation.state),')
    || !generic.includes('state: derived.derivation.state,')) {
    errors.push('Arc 3 must retain a codec-canonical expected state while committing the raw derivation');
  }
  if ((source.match(/await runtime\.commitAction\(\{/g) ?? []).length !== 1) {
    errors.push('All four Arc 3 operations must share the sole commitAction call');
  }
  if (generic.includes('save = outcome.state') || generic.includes('save = committed')) {
    errors.push('Arc 3 publication must preserve the live SaveState/Atlas object identity');
  }
  for (const needle of [
    'outcome.plan.receiptOrdinal !== committedPlan.receiptOrdinal',
    'outcome.receipt.ordinal !== committedPlan.receiptOrdinal',
    'outcome.receipt.witness !== committedPlan.witness',
    'outcome.authority.sessionRng.seed !== priorSessionRng.seed',
    'outcome.authority.sessionRng.ordinal !== priorSessionRng.ordinal + 1',
  ]) {
    if (!generic.includes(needle)) errors.push('Arc 3 commit lacks one-receipt/no-domain-RNG verification');
  }

  const bindings = [
    {
      name: 'mine', start: 'async function mineCurrentSurface()', end: '\nasync function skimCurrentSystem()',
      needles: ['return commitArc3EngineeringAction({', "operation: 'mine-world'", 'deriveArc3MineAction({',
        'verifyArc3CommittedMineAction({', 'expectedOwnedState: planned.state',
        'expectedEngineeringState: planned.nextEngineeringState', 'expectedArc2State: planned.nextArc2State',
        'if (verified.arc2State !== null)', 'inventoryPanelController.setState(verified.arc2State);',
        'publishArc3MiningFields(target, committed);', 'arc2LootState = verified.arc2State;'],
    },
    {
      name: 'skim', start: 'async function skimCurrentSystem()', end: '\nasync function purchaseEngineeringResearch(',
      needles: ['return commitArc3EngineeringAction({', "operation: 'skim-star'", 'deriveArc3SkimAction({',
        'verifyArc3CommittedAction({', 'expectedState: planned.nextEngineeringState', 'publishArc3SkimFields(target, committed)'],
    },
    {
      name: 'research', start: 'async function purchaseEngineeringResearch(', end: '\nasync function fabricateFixedEngineeringRecipe(',
      needles: ['return commitArc3EngineeringAction({', "operation: 'purchase-research'", 'deriveArc3ResearchAction({',
        'verifyArc3CommittedResearchAction({', 'expectedOwnedState: planned.state',
        'expectedState: planned.nextEngineeringState', 'publishArc3ResearchFields(target, committed)'],
    },
    {
      name: 'fabrication', start: 'async function fabricateFixedEngineeringRecipe(', end: '\nfunction engineeringOutcomeConverges(',
      needles: ['return commitArc3EngineeringAction({', "operation: 'fabricate-fixed'", 'deriveArc3FixedFabricationAction({',
        'verifyArc3CommittedFixedFabricationAction({', 'expectedOwnedState: planned.state',
        'expectedEngineeringState: planned.nextEngineeringState', 'expectedArc2State: planned.nextArc2State',
        'inventoryPanelController.setState(verified.arc2State);',
        'publishArc3FixedFabricationFields(target, committed);', 'arc2LootState = verified.arc2State;'],
    },
  ] as const;
  for (const binding of bindings) {
    const body = sourceSection(source, binding.start, binding.end);
    if (binding.needles.some((needle) => !body.includes(needle))) {
      errors.push(`Arc 3 ${binding.name} binding omits its exact derive/verify/publish contract`);
    }
  }
  return [...new Set(errors)];
}

describe('shared Arc 2/Arc 3 product-action coordinator', () => {
  it('claims synchronously, rejects a competing Arc, and keeps persistence behind the exact barrier', async () => {
    const coordinator = createProductActionCoordinator();
    const claim = coordinator.tryClaim('arc3.mine-world');
    expect(claim).not.toBeNull();
    if (claim === null) return;
    expect(coordinator.diagnostics()).toMatchObject({
      busy: true,
      operation: 'arc3.mine-world',
    });
    expect(coordinator.tryClaim('arc2.equip')).toBeNull();

    const queuedPersist = vi.fn((durable: boolean) => `persist-after:${durable}`);
    const queued = claim.barrier.then(queuedPersist);
    await Promise.resolve();
    expect(queuedPersist).not.toHaveBeenCalled();

    claim.settle(true);
    await expect(queued).resolves.toBe('persist-after:true');
    expect(queuedPersist).toHaveBeenCalledOnce();
    expect(coordinator.diagnostics()).toMatchObject({ busy: false, operation: null });
    expect(coordinator.tryClaim('arc2.equip')).not.toBeNull();
  });

  it('settles a pre-durable refusal as false and refuses invalid or double settlement', async () => {
    const coordinator = createProductActionCoordinator();
    expect(() => coordinator.tryClaim('')).toThrow(/1 through 128/);
    const claim = coordinator.tryClaim('arc3.purchase-research');
    expect(claim).not.toBeNull();
    if (claim === null) return;
    claim.settle(false);
    await expect(claim.barrier).resolves.toBe(false);
    expect(() => claim.settle(false)).toThrow(/no longer active/);
  });

  it('holds the claimed operation without product input and releases exactly once', async () => {
    const coordinator = createProductActionCoordinator();
    const hold = createProductActionDiagnosticHold();
    expect(hold.arm()).toBe(true);
    expect(hold.diagnostics()).toMatchObject({ phase: 'armed', operation: null, sequence: 1 });
    const claim = coordinator.tryClaim('arc2.salvage');
    expect(claim).not.toBeNull();
    if (claim === null) return;
    const waiting = hold.holdIfArmed(claim.operation);
    expect(hold.diagnostics()).toMatchObject({ phase: 'holding', operation: 'arc2.salvage' });
    expect(coordinator.tryClaim('arc3.mine-world')).toBeNull();
    expect(coordinator.tryClaim('arc4.capture.tame')).toBeNull();
    expect(hold.release()).toBe(true);
    expect(hold.release()).toBe(false);
    expect(hold.diagnostics().phase).toBe('release-requested');
    await waiting;
    expect(hold.diagnostics()).toMatchObject({ phase: 'released', operation: 'arc2.salvage' });
    claim.settle(false);
  });

  it('dynamically fences Arc 2, Arc 3, and queued persistence behind an Arc 4 owner', async () => {
    const coordinator = createProductActionCoordinator();
    const hold = createProductActionDiagnosticHold();
    expect(hold.arm()).toBe(true);
    const claim = coordinator.tryClaim('arc4.capture.sample');
    expect(claim).not.toBeNull();
    if (claim === null) return;

    const held = hold.holdIfArmed(claim.operation);
    expect(hold.diagnostics()).toMatchObject({
      phase: 'holding', operation: 'arc4.capture.sample', sequence: 1,
    });
    expect(coordinator.tryClaim('arc2.equip')).toBeNull();
    expect(coordinator.tryClaim('arc3.mine-world')).toBeNull();
    const queuedPersist = vi.fn((durable: boolean) => durable);
    const queued = claim.barrier.then(queuedPersist);
    await Promise.resolve();
    expect(queuedPersist).not.toHaveBeenCalled();

    expect(hold.release()).toBe(true);
    await held;
    claim.settle(true);
    await expect(queued).resolves.toBe(true);
    expect(queuedPersist).toHaveBeenCalledOnce();
    expect(coordinator.diagnostics()).toMatchObject({ busy: false, operation: null });
  });

  it('binds all production paths, heartbeat deadlock protection, refresh, and diagnostic faults', () => {
    expect(coordinatorContractErrors(mainSource)).toEqual([]);
    expect(readModelRefreshContractErrors(mainSource)).toEqual([]);
    expect(diagnosticFaultContractErrors(mainSource)).toEqual([]);
    expect(arc3ActionBindingErrors(mainSource)).toEqual([]);
  });

  it('negative-controls Arc 2, Arc 3 and Arc 4 late claims independently', () => {
    const arc2Start = mainSource.indexOf('async function commitArc2InventoryAction(');
    const arc3Start = mainSource.indexOf('async function commitArc3EngineeringAction(');
    const arc4Start = mainSource.indexOf('async function commitArc4CaptureAction(');
    const lateArc2 = mainSource.slice(0, arc2Start)
      + mainSource.slice(arc2Start, arc3Start)
        .replace('  const actionClaim = productActionCoordinator.tryClaim(`arc2.${operation}`);', '  /* Arc 2 claim moved */')
        .replace('    await settleF4Heartbeat();', '    await settleF4Heartbeat();\n    const actionClaim = productActionCoordinator.tryClaim(`arc2.${operation}`);')
      + mainSource.slice(arc3Start);
    expect(lateArc2).not.toBe(mainSource);
    expect(coordinatorContractErrors(lateArc2)).toContain(
      'Arc 2 must claim/fence/hold synchronously before heartbeat and commit',
    );

    const lateArc3 = mainSource.slice(0, arc3Start)
      + mainSource.slice(arc3Start)
        .replace('  const actionClaim = productActionCoordinator.tryClaim(`arc3.${spec.operation}`);', '  /* Arc 3 claim moved */')
        .replace('    await settleF4Heartbeat();', '    await settleF4Heartbeat();\n    const actionClaim = productActionCoordinator.tryClaim(`arc3.${spec.operation}`);');
    expect(lateArc3).not.toBe(mainSource);
    expect(coordinatorContractErrors(lateArc3)).toContain(
      'Arc 3 must claim/fence/hold synchronously before heartbeat and commit',
    );

    const lateArc4 = mainSource.slice(0, arc4Start)
      + mainSource.slice(arc4Start)
        .replace('  const actionClaim = productActionCoordinator.tryClaim(`arc4.capture.${verb}`);', '  /* Arc 4 claim moved */')
        .replace('    await settleF4Heartbeat();', '    await settleF4Heartbeat();\n    const actionClaim = productActionCoordinator.tryClaim(`arc4.capture.${verb}`);');
    expect(lateArc4).not.toBe(mainSource);
    expect(coordinatorContractErrors(lateArc4)).toContain(
      'Arc 4 must claim/fence/hold synchronously before heartbeat and commit',
    );
  });

  it('negative-controls the Arc 2 diagnostic read-only refusal at its action authority seam', () => {
    const withoutReadOnlyRefusal = replaceInSourceSectionExact(
      mainSource,
      'async function commitArc2InventoryAction(',
      '\ntype Arc3AppActionOperation =',
      'if (smokeForceReadOnly || !f4RuntimeMayMutate(runtime) || activePersist || importWriteInFlight',
      'if (!f4RuntimeMayMutate(runtime) || activePersist || importWriteInFlight',
    );
    expect(coordinatorContractErrors(withoutReadOnlyRefusal)).toContain(
      'Arc 2 must publish diagnostic read-only refusal before planning or claiming an action',
    );
  });

  it('negative-controls heartbeat, queued-persist guard, fresh carrier, and refusal refresh independently', () => {
    const productActionDeadlock = replaceInSourceSectionExact(
      mainSource,
      'const runF4HeartbeatCycle =',
      '\nconst heartbeatF4 =',
      'if (checkpointDue && !productActionInFlight && !activePersist) {',
      'if (checkpointDue && !activePersist) {',
    );
    expect(coordinatorContractErrors(productActionDeadlock)).toContain(
      'Heartbeat checkpoint can wait on the product action that is waiting on that heartbeat',
    );

    const ordinaryPersistDeadlock = replaceInSourceSectionExact(
      mainSource,
      'const runF4HeartbeatCycle =',
      '\nconst heartbeatF4 =',
      'if (checkpointDue && !productActionInFlight && !activePersist) {',
      'if (checkpointDue && !productActionInFlight) {',
    );
    expect(coordinatorContractErrors(ordinaryPersistDeadlock)).toContain(
      'Heartbeat checkpoint can queue behind ordinary persistence waiting on that heartbeat',
    );

    const ownerlessHeartbeatCheckpoint = replaceInSourceSectionExact(
      mainSource,
      'const runF4HeartbeatCycle =',
      '\nconst heartbeatF4 =',
      "await persistView(null, 'ordinary', F4_HEARTBEAT_CYCLE_CHECKPOINT_OWNER);",
      'await persistView();',
    );
    expect(coordinatorContractErrors(ownerlessHeartbeatCheckpoint)).toContain(
      'Heartbeat checkpoint lacks its private cycle-owner persistence token',
    );

    const mistakenOwner = replaceInSourceSectionExact(
      mainSource,
      'async function commitArc2InventoryAction(',
      '\ntype Arc3AppActionOperation =',
      'if (!f4RuntimeMayMutate(runtime) || importWriteInFlight',
      'if (!f4RuntimeMayMutate(runtime) || activePersist || importWriteInFlight',
    );
    expect(mistakenOwner).not.toBe(mainSource);
    expect(coordinatorContractErrors(mistakenOwner)).toContain(
      'Arc 2 post-heartbeat guard rejects persistence queued behind its own barrier',
    );

    const mistakenArc4Owner = replaceInSourceSectionExact(
      mainSource,
      'async function commitArc4CaptureAction(',
      '\nfunction arc6CombatOutcomeCopy(',
      'if (!f4RuntimeMayMutate(runtime) || importWriteInFlight',
      'if (!f4RuntimeMayMutate(runtime) || activePersist || importWriteInFlight',
    );
    expect(coordinatorContractErrors(mistakenArc4Owner)).toContain(
      'Arc 4 post-heartbeat guard rejects persistence queued behind its own barrier',
    );

    const unparseableArc4Guard = replaceInSourceSectionExact(
      mainSource,
      'async function commitArc4CaptureAction(',
      '\nfunction arc6CombatOutcomeCopy(',
      "return unavailable('write-authority-changed', verb);",
      "return unavailable('authority-changed', verb);",
    );
    expect(coordinatorContractErrors(unparseableArc4Guard)).toContain(
      'Arc 4 post-heartbeat authority guard is missing or unparseable',
    );

    const missingArc4Section = mainSource.replace(
      'async function commitArc4CaptureAction(',
      'async function commitArc4CaptureActionRenamed(',
    );
    expect(missingArc4Section).not.toBe(mainSource);
    expect(coordinatorContractErrors(missingArc4Section)).toContain(
      'Arc 4 source section is missing',
    );

    const cachedCarrier = mainSource.replace(
      '    const engineering = readArc3Engineering(',
      '    const engineering = /* cached-only */ ({ kind: \'loaded\', state: arc3EngineeringState } as const); void (',
    );
    expect(cachedCarrier).not.toBe(mainSource);
    expect(readModelRefreshContractErrors(cachedCarrier)).toContain(
      'Engineering refresh omits fresh Arc 3 carrier',
    );

    const committedOnlyRefresh = mainSource.replace(
      '  if (!converging) {',
      "  if (outcome.kind === 'committed' && !converging) {",
    );
    expect(committedOnlyRefresh).not.toBe(mainSource);
    expect(readModelRefreshContractErrors(committedOnlyRefresh)).toContain(
      'Every Engineering settlement must refresh, then only ordinary outcomes may unlock',
    );
  });

  it('negative-controls storage and stale injection boundaries independently', () => {
    const bypassedStorage = mainSource.replace(
      '    if (smokeRejectArc3StorageBoundary) {',
      '    if (false) {',
    );
    expect(bypassedStorage).not.toBe(mainSource);
    expect(diagnosticFaultContractErrors(bypassedStorage)).toContain(
      'Arc 3 storage fault bypasses the production backend compare-and-apply',
    );

    const noStaleBump = replaceInSourceSectionExact(
      mainSource,
      'async function commitArc3EngineeringAction(',
      '\nasync function mineCurrentSurface()',
      '      const injected = await revisionRepo.mutate({',
      '      const injected = await Promise.resolve({ kind: \'committed\', revision: faultBeforeRevision }); void ({',
    );
    expect(noStaleBump).not.toBe(mainSource);
    expect(diagnosticFaultContractErrors(noStaleBump)).toContain(
      'Arc 3 stale fault does not advance only revision before the real commitAction',
    );
  });

  it('negative-controls action-specific verifier selection and post-durable publication', () => {
    const rawExpectedState = replaceInSourceSectionExact(
      mainSource,
      'async function commitArc3EngineeringAction(',
      '\nasync function mineCurrentSurface()',
      '            state: canonicalizeState(derived.derivation.state),',
      '            state: derived.derivation.state,',
    );
    expect(arc3ActionBindingErrors(rawExpectedState)).toContain(
      'Arc 3 must retain a codec-canonical expected state while committing the raw derivation',
    );

    const canonicalizedCommitCandidate = replaceInSourceSectionExact(
      mainSource,
      'async function commitArc3EngineeringAction(',
      '\nasync function mineCurrentSurface()',
      '            state: derived.derivation.state,',
      '            state: canonicalizeState(derived.derivation.state),',
    );
    expect(arc3ActionBindingErrors(canonicalizedCommitCandidate)).toContain(
      'Arc 3 must retain a codec-canonical expected state while committing the raw derivation',
    );

    const weakMineVerifier = replaceInSourceSectionExact(
      mainSource,
      'async function mineCurrentSurface()',
      '\nasync function skimCurrentSystem()',
      'verifyArc3CommittedMineAction({',
      'verifyArc3CommittedAction({',
    );
    expect(arc3ActionBindingErrors(weakMineVerifier)).toContain(
      'Arc 3 mine binding omits its exact derive/verify/publish contract',
    );

    const missingMineControllerPublication = replaceInSourceSectionExact(
      mainSource,
      'async function mineCurrentSurface()',
      '\nasync function skimCurrentSystem()',
      '        inventoryPanelController.setState(verified.arc2State);',
      '        /* verified Mine reward controller publication omitted */',
    );
    expect(arc3ActionBindingErrors(missingMineControllerPublication)).toContain(
      'Arc 3 mine binding omits its exact derive/verify/publish contract',
    );

    const missingMineCarrierPublication = replaceInSourceSectionExact(
      mainSource,
      'async function mineCurrentSurface()',
      '\nasync function skimCurrentSystem()',
      '      if (verified.arc2State !== null) arc2LootState = verified.arc2State;',
      '      /* verified Mine reward carrier publication omitted */',
    );
    expect(arc3ActionBindingErrors(missingMineCarrierPublication)).toContain(
      'Arc 3 mine binding omits its exact derive/verify/publish contract',
    );

    const wrongResearchVerifier = mainSource.replace(
      'verifyArc3CommittedResearchAction({',
      'verifyArc3CommittedAction({',
    );
    expect(wrongResearchVerifier).not.toBe(mainSource);
    expect(arc3ActionBindingErrors(wrongResearchVerifier)).toContain(
      'Arc 3 research binding omits its exact derive/verify/publish contract',
    );

    const missingDualPublication = mainSource.replace(
      '      arc2LootState = verified.arc2State;',
      '      /* Arc 2 live carrier publication omitted */',
    );
    expect(missingDualPublication).not.toBe(mainSource);
    expect(arc3ActionBindingErrors(missingDualPublication)).toContain(
      'Arc 3 fabrication binding omits its exact derive/verify/publish contract',
    );

    const optimistic = mainSource
      .replace('      spec.publish(save, outcome.state, verified);', '      /* publication moved */')
      .replace('    const outcome = await runtime.commitAction({',
        '    spec.publish(save, save, {} as never);\n    const outcome = await runtime.commitAction({');
    expect(optimistic).not.toBe(mainSource);
    expect(arc3ActionBindingErrors(optimistic)).toContain(
      'Arc 3 may publish only after one commitAction is durable and independently verified',
    );

    const unrelatedCheckpoint = replaceInSourceSectionExact(
      mainSource,
      'async function commitArc3EngineeringAction(',
      '\nasync function mineCurrentSurface()',
      '        || JSON.stringify(checkpoint) !== JSON.stringify(outcome.state)',
      '        || false /* mutation control trusts an unrelated checkpoint */',
    );
    expect(arc3ActionBindingErrors(unrelatedCheckpoint)).toContain(
      'Arc 3 postcommit verifier omits its exact runtime checkpoint',
    );
  });
});
