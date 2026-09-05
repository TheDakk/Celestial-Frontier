import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
// @ts-expect-error The executable browser evidence contract intentionally has no declaration shim.
import * as arc4Contract from '../tools/arc4-browser-contract.mjs';

const {
  ARC4_PERTAR_FIXTURE,
  ARC4_PERTAR_LEDGER_PREFIX_SELFTEST,
  ARC4_PERTAR_PROGRESSION_TAIL_SELFTEST,
  ARC4_PUBLICATION_PROGRESSION_SELFTEST,
} = arc4Contract;

type Assessment = Readonly<{
  ok: boolean;
  checks: Readonly<Record<string, boolean>>;
  reasons: readonly string[];
}>;

type PublicationAssessment = Assessment & Readonly<{
  convergenceReleaseDiagnostics: Assessment;
  publicationBoundary: Readonly<{
    beforeRevision: number;
    actionRevision: number;
    fixedPointRevision: number;
    beforeOrdinal: number;
    actionOrdinal: number;
    fixedPointOrdinal: number;
    actionDraws: Readonly<Record<string, number>>;
    fixedPointDraws: Readonly<Record<string, number>>;
  }>;
}>;

const sliceSource = readFileSync(
  fileURLToPath(new URL('../tools/slicesmoke.mjs', import.meta.url)),
  'utf8',
);

function section(source: string, start: string, end: string): string {
  expect(source.split(start)).toHaveLength(2);
  expect(source.split(end)).toHaveLength(2);
  const left = source.indexOf(start);
  const right = source.indexOf(end, left + start.length);
  expect(left).toBeGreaterThanOrEqual(0);
  expect(right).toBeGreaterThan(left);
  return source.slice(left, right);
}

const setupOwner = section(
  sliceSource,
  '  const assessArc4PertarFixtureSetup = ({ priorToken, sourceReady, sourceState,',
  '  const installArc4PertarFixture = async (label, raw = ARC4_PERTAR_RAW) => {',
);
const resetOwner = section(
  sliceSource,
  "  const arc4FirstFixture = await installArc4PertarFixture('Arc 4 Pertar seed-68 replacement');",
  '  const arc4TameAudioAssessment = classifyTameGreetingAudioEvidence(',
);
const tameVerdictOwner = section(
  sliceSource,
  '  const arc4TameAudioRehearsalChecks = {',
  '  const arc4FixtureSetupBundle = {',
);
const preconditionOwner = section(
  sliceSource,
  '  const arc4PreconditionBundle = {',
  '  const arc4HitHoldArmed = await evalIn(',
);
const sampleOwner = section(
  sliceSource,
  '  const arc4HitReleased = await evalIn(',
  '  const arc4StorageBeforeState = arc4HitState;',
);
const storageOwner = section(
  sliceSource,
  '  const arc4StorageBeforeState = arc4HitState;',
  "  const arc4StaleFaultKey = 'cf_slice_arc4_stale_fault_capture_v1';",
);
const pressOwner = section(
  sliceSource,
  '  const pressArc4Keyboard = async (verb) => {',
  '  const pressArc4SurveyDockKeyboard = async () => {',
);

function ordered(source: string, needles: readonly string[]): boolean {
  let cursor = -1;
  return needles.every((needle) => {
    const next = source.indexOf(needle, cursor + 1);
    if (next < 0) return false;
    cursor = next;
    return true;
  });
}

function storageRunnerContractPasses(storage: string, press: string): boolean {
  return press.includes('const dispatched = armed === true && target.ok === true')
    && press.includes('&& target.focus === true;')
    && press.includes("if (dispatched) await keyIn('Enter', 'Enter');")
    && press.includes('return { armed, target, dispatched };')
    && storage.includes("captureArc4StoragePhase('pre-arm')")
    && storage.includes("captureArc4StoragePhase('post-arm')")
    && storage.includes("captureArc4StoragePhase('post-press')")
    && storage.includes("captureArc4StoragePhase('deadline')")
    && storage.includes("arc4StorageTargetReady?.verb === 'tame'")
    && storage.includes('arc4StorageTargetReady?.focus === true')
    && storage.includes('arc4StoragePreArmCoordinator?.owner?.busy === false')
    && storage.includes('arc4StoragePreArm.state?.capture?.card?.pendingWork === 0')
    && storage.includes("failSliceWithoutCascade('ARC 4 STORAGE PRECONDITION: native Tame")
    && storage.includes('arc4StorageArmed === true')
    && storage.includes('arc4StoragePostArmCoordinator?.faultArmed?.storageFailure === true')
    && storage.includes("failSliceWithoutCascade('ARC 4 STORAGE PRECONDITION: storage-failure hook")
    && storage.includes('arc4StoragePress.dispatched !== true')
    && storage.includes("failSliceWithoutCascade('ARC 4 STORAGE ACTION:")
    && storage.includes('arc4StorageWaitError = String(cause?.message || cause);')
    && storage.includes('waitError: arc4StorageWaitError,')
    && storage.includes('captureErrors: arc4StorageCaptureErrors,')
    && storage.includes('snapshots: { preArm: arc4StoragePreArm, postArm: arc4StoragePostArm,')
    && storage.includes('postPress: arc4StoragePostPress, deadline: arc4StorageDeadline },')
    && !storage.includes('waitError: null, captureErrors: []')
    && ordered(storage, [
      "captureArc4StoragePhase('pre-arm')",
      'if (!Object.values(arc4StoragePreArmChecks).every(Boolean)) {',
      "failSliceWithoutCascade('ARC 4 STORAGE PRECONDITION: native Tame",
      'window.__CF_SLICE__.api.__smokeRejectNextArc4ActionStorage()',
      "captureArc4StoragePhase('post-arm')",
      'if (!Object.values(arc4StorageArmChecks).every(Boolean)) {',
      "failSliceWithoutCascade('ARC 4 STORAGE PRECONDITION: storage-failure hook",
      "const arc4StoragePress = await pressArc4Keyboard('tame');",
      "captureArc4StoragePhase('post-press')",
      'if (arc4StoragePress.armed !== true',
      "failSliceWithoutCascade('ARC 4 STORAGE ACTION:",
      "await waitDesktopValue('Arc 4 storage refusal'",
      'arc4StorageWaitError = String(cause?.message || cause);',
      "captureArc4StoragePhase('deadline')",
      'if (arc4StorageTerminalFailure !== null) {',
      'failSliceWithoutCascade(arc4StorageTerminalFailure);',
      'const arc4StorageFaultControlState = structuredClone(arc4StorageState);',
      "failSliceWithoutCascade('ARC 4 STORAGE REFUSAL CONTROLS:",
    ]);
}

function runnerContractPasses(owners: {
  setup: string;
  reset: string;
  tame: string;
  precondition: string;
  sample: string;
  storage: string;
  press: string;
}): boolean {
  const setupCalls = owners.setup.match(/assessArc4PertarLedgerPrefix\(\{/gu) ?? [];
  return setupCalls.length === 2
    && owners.setup.includes("phase: 'source-ready'")
    && owners.setup.includes("phase: 'action-ready'")
    && owners.setup.includes('sourceAuthorityPrefix: sourceLedgerPrefix.ok === true')
    && owners.setup.includes('actionAuthorityPrefix: actionLedgerPrefix.ok === true')
    && owners.setup.includes('=== wrongOrdinal?.rawBefore?.revision + 1')
    && owners.reset.includes('const arc4TameAudioResetLedger = assessArc4PertarLedgerPrefix({')
    && owners.reset.includes("phase: 'action-ready'")
    && owners.reset.includes('actionReadyLedger: arc4TameAudioResetLedger.ok === true')
    && owners.reset.includes('state: arc4FirstFixture.surface.state,')
    && owners.reset.includes("failSliceWithoutCascade('ARC 4 TAME GREETING AUDIO RESET:")
    && !owners.reset.includes('virginRngAndReceipts')
    && owners.tame.includes("failSliceWithoutCascade('ARC 4 TAME GREETING AUDIO:")
    && owners.precondition.includes("failSliceWithoutCascade('ARC 4 PRECONDITION:")
    && owners.sample.includes('const arc4HitCaptureRevision = arc4PreRaw.revision + 1;')
    && owners.sample.includes('const arc4HitFinalRevision = arc4PreRaw.revision + 2;')
    && owners.sample.includes('const arc4HitFinalOrdinal = arc4PreRaw.authority.sessionRng.ordinal + 2;')
    && owners.sample.includes('arc9-progression-committed:')
    && owners.sample.includes('requireProgressionTail: true,')
    && owners.sample.includes("failSliceWithoutCascade('ARC 4 SAMPLE HIT:")
    && storageRunnerContractPasses(owners.storage, owners.press);
}

const currentOwners = Object.freeze({
  setup: setupOwner,
  reset: resetOwner,
  tame: tameVerdictOwner,
  precondition: preconditionOwner,
  sample: sampleOwner,
  storage: storageOwner,
  press: pressOwner,
});

describe('Slice Arc 4 composed ledger and causal-stop contract', () => {
  it('seals the real Pertar setup prefix and first-Sample progression successor', () => {
    const prefix = ARC4_PERTAR_LEDGER_PREFIX_SELFTEST as Readonly<{
      sourceReady: Assessment;
      actionReady: Assessment;
      actionReadyTameVariant: Assessment;
      controls: Readonly<Record<string, Assessment>>;
    }>;
    const progression = ARC4_PERTAR_PROGRESSION_TAIL_SELFTEST as Readonly<{
      positive: Assessment;
      controls: Readonly<Record<string, Assessment>>;
    }>;

    expect(ARC4_PERTAR_FIXTURE.sourceReadySessionOrdinal).toBe(1);
    expect(ARC4_PERTAR_FIXTURE.actionReadySessionOrdinal).toBe(2);
    expect(ARC4_PERTAR_FIXTURE.actionReadyReceiptKinds).toEqual([
      'arc9-progression-refresh-v1', 'arc0-land',
    ]);
    expect(ARC4_PERTAR_FIXTURE.actions.firstHit.progressionTail).toMatchObject({
      receiptKind: 'arc9-progression-refresh-v1',
      addedAchievementIds: ['rare', 'legend'],
      priorBestRankIndex: 3,
      nextBestRankIndex: 3,
    });
    expect(prefix.sourceReady.ok).toBe(true);
    expect(prefix.actionReady.ok).toBe(true);
    expect(prefix.actionReadyTameVariant.ok).toBe(true);
    expect(Object.keys(prefix.controls)).toEqual([
      'staleEmptyLedger', 'missingReceipt', 'extraReceipt', 'reorderedReceipts',
      'bootWitness', 'unexpectedSurveyReceipt', 'landingWitness', 'landingStateSuccessorSeal',
      'authorityOrdinal', 'runtimeOrdinal',
    ]);
    expect(Object.values(prefix.controls).every((control) => control.ok === false)).toBe(true);
    expect(progression.positive.ok).toBe(true);
    expect(Object.keys(progression.controls)).toEqual([
      'missingTail', 'extraTail', 'wrongTailWitness', 'wrongAchievementDelta',
      'wrongFinalSpan', 'resultBoundToFinal', 'ownershipAdvancedTwice',
      'progressionConsumedDraw',
    ]);
    expect(Object.values(progression.controls)
      .every((control) => control.ok === false)).toBe(true);
  });

  it('binds publication evidence to Capture R+1 and the progression fixed point to R+2', () => {
    const publication = ARC4_PUBLICATION_PROGRESSION_SELFTEST as Readonly<{
      positive: PublicationAssessment;
      controls: Readonly<Record<string, Readonly<{
        expected: readonly string[];
        nestedExpected: readonly string[] | null;
        result: PublicationAssessment;
      }>>>;
    }>;

    expect(publication.positive.ok).toBe(true);
    expect(publication.positive.publicationBoundary).toEqual({
      beforeRevision: 11,
      actionRevision: 12,
      fixedPointRevision: 13,
      beforeOrdinal: 2,
      actionOrdinal: 3,
      fixedPointOrdinal: 4,
      actionDraws: { 'capture.candidate': 1, 'capture.success': 1 },
      fixedPointDraws: { 'capture.candidate': 1, 'capture.success': 1 },
    });
    expect(Object.keys(publication.controls)).toEqual([
      'captureOnlyEndpoint',
      'missingProgressionTail',
      'wrongProgressionWitness',
      'wrongAchievementDelta',
      'wrongFinalSpan',
      'faultBoundToFixedPoint',
      'detailBoundToFixedPoint',
      'witnessBoundToFixedPoint',
      'reloadStateCommitCount',
      'reloadUiCommitCount',
      'reloadStateOutcome',
      'reloadUiOutcome',
      'reloadUnlocked',
      'reloadBestRank',
      'reloadUiBootKind',
      'reloadStateBootKind',
      'reloadUiPending',
      'reloadStatePending',
    ]);
    for (const [name, control] of Object.entries(publication.controls)) {
      const failed = Object.entries(control.result.checks)
        .filter(([, value]) => value !== true)
        .map(([check]) => check);
      const nestedFailed = Object.entries(
        control.result.convergenceReleaseDiagnostics.checks,
      ).filter(([, value]) => value !== true).map(([check]) => check);
      expect(control.result.ok, name).toBe(false);
      expect(failed, name).toEqual(control.expected);
      if (control.nestedExpected !== null) {
        expect(nestedFailed, name).toEqual(control.nestedExpected);
      }
    }
  });

  it('makes the browser runner consume those shared contracts and stop before storage on red', () => {
    expect(runnerContractPasses(currentOwners)).toBe(true);
  });

  it('rejects omission of the progression tail, stale empty-ledger logic, and noncausal failure collection', () => {
    const currentSpan = '=== wrongOrdinal?.rawBefore?.revision + 1';
    expect(setupOwner.split(currentSpan)).toHaveLength(2);
    const obsoleteSurveyWrite = setupOwner.replace(
      currentSpan, '=== wrongOrdinal?.rawBefore?.revision + 2',
    );
    expect(runnerContractPasses({
      ...currentOwners, setup: obsoleteSurveyWrite,
    })).toBe(false);
    expect(runnerContractPasses(currentOwners)).toBe(true);
    expect(runnerContractPasses({
      ...currentOwners,
      sample: sampleOwner.replace(
        'requireProgressionTail: true,',
        'requireProgressionTail: false,',
      ),
    })).toBe(false);
    expect(runnerContractPasses({
      ...currentOwners,
      reset: resetOwner.replace(
        'actionReadyLedger: arc4TameAudioResetLedger.ok === true',
        'virginRngAndReceipts: true',
      ),
    })).toBe(false);
    expect(runnerContractPasses({
      ...currentOwners,
      sample: sampleOwner.replace(
        "failSliceWithoutCascade('ARC 4 SAMPLE HIT:",
        "fails.push('ARC 4 SAMPLE HIT:",
      ),
    })).toBe(false);
    for (const phase of ['pre-arm', 'post-arm', 'post-press', 'deadline']) {
      expect(runnerContractPasses({
        ...currentOwners,
        storage: storageOwner.replace(
          `captureArc4StoragePhase('${phase}')`,
          `captureArc4StoragePhase('missing-${phase}')`,
        ),
      }), phase).toBe(false);
    }
    expect(runnerContractPasses({
      ...currentOwners,
      storage: storageOwner.replace(
        "failSliceWithoutCascade('ARC 4 STORAGE PRECONDITION: native Tame",
        "fails.push('ARC 4 STORAGE PRECONDITION: native Tame",
      ),
    })).toBe(false);
    expect(runnerContractPasses({
      ...currentOwners,
      storage: storageOwner.replace(
        "failSliceWithoutCascade('ARC 4 STORAGE PRECONDITION: storage-failure hook",
        "fails.push('ARC 4 STORAGE PRECONDITION: storage-failure hook",
      ),
    })).toBe(false);
    expect(runnerContractPasses({
      ...currentOwners,
      storage: storageOwner.replace(
        "failSliceWithoutCascade('ARC 4 STORAGE ACTION:",
        "fails.push('ARC 4 STORAGE ACTION:",
      ),
    })).toBe(false);
    expect(runnerContractPasses({
      ...currentOwners,
      storage: storageOwner.replace(
        'failSliceWithoutCascade(arc4StorageTerminalFailure);',
        'fails.push(arc4StorageTerminalFailure);',
      ),
    })).toBe(false);
    const hookLine = 'const arc4StorageArmed = await evalIn(`window.__CF_SLICE__.api.__smokeRejectNextArc4ActionStorage()`);';
    const pressLine = "const arc4StoragePress = await pressArc4Keyboard('tame');";
    const swappedStorage = storageOwner.replace(hookLine, '__ARC4_STORAGE_HOOK__')
      .replace(pressLine, hookLine)
      .replace('__ARC4_STORAGE_HOOK__', pressLine);
    expect(runnerContractPasses({
      ...currentOwners, storage: swappedStorage,
    })).toBe(false);
    const preArmPhaseLine = "const arc4StoragePreArm = await captureArc4StoragePhase('pre-arm');";
    const postArmPhaseLine = "const arc4StoragePostArm = await captureArc4StoragePhase('post-arm');";
    const swappedPhaseStorage = storageOwner
      .replace(preArmPhaseLine, '__ARC4_STORAGE_PRE_ARM__')
      .replace(postArmPhaseLine, preArmPhaseLine)
      .replace('__ARC4_STORAGE_PRE_ARM__', postArmPhaseLine);
    expect(runnerContractPasses({
      ...currentOwners, storage: swappedPhaseStorage,
    })).toBe(false);
    expect(runnerContractPasses({
      ...currentOwners,
      storage: storageOwner.replace(
        'postPress: arc4StoragePostPress, deadline: arc4StorageDeadline },',
        'postPress: null, deadline: null },',
      ),
    })).toBe(false);
    expect(runnerContractPasses({
      ...currentOwners,
      press: pressOwner.replace(
        'const dispatched = armed === true && target.ok === true\n      && target.focus === true;',
        'const dispatched = armed && target.ok;',
      ),
    })).toBe(false);
    expect(runnerContractPasses({
      ...currentOwners,
      storage: storageOwner
        .replace('waitError: arc4StorageWaitError,', 'waitError: null,')
        .replace('captureErrors: arc4StorageCaptureErrors,', 'captureErrors: [],'),
    })).toBe(false);
  });
});
