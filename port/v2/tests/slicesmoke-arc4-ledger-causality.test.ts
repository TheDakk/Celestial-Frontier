import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
// @ts-expect-error The executable browser evidence contract intentionally has no declaration shim.
import * as arc4Contract from '../tools/arc4-browser-contract.mjs';

const {
  ARC4_PERTAR_FIXTURE,
  ARC4_PERTAR_LEDGER_PREFIX_SELFTEST,
  ARC4_PERTAR_PROGRESSION_TAIL_SELFTEST,
} = arc4Contract;

type Assessment = Readonly<{
  ok: boolean;
  checks: Readonly<Record<string, boolean>>;
  reasons: readonly string[];
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
function runnerContractPasses(owners: {
  setup: string;
  reset: string;
  tame: string;
  precondition: string;
  sample: string;
}): boolean {
  const setupCalls = owners.setup.match(/assessArc4PertarLedgerPrefix\(\{/gu) ?? [];
  return setupCalls.length === 2
    && owners.setup.includes("phase: 'source-ready'")
    && owners.setup.includes("phase: 'action-ready'")
    && owners.setup.includes('sourceAuthorityPrefix: sourceLedgerPrefix.ok === true')
    && owners.setup.includes('actionAuthorityPrefix: actionLedgerPrefix.ok === true')
    && owners.setup.includes('=== wrongOrdinal?.rawBefore?.revision + 2')
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
    && owners.sample.includes("failSliceWithoutCascade('ARC 4 SAMPLE HIT:");
}

const currentOwners = Object.freeze({
  setup: setupOwner,
  reset: resetOwner,
  tame: tameVerdictOwner,
  precondition: preconditionOwner,
  sample: sampleOwner,
});

describe('Slice Arc 4 composed ledger and causal-stop contract', () => {
  it('seals the real Pertar setup prefix and first-Sample progression successor', () => {
    const prefix = ARC4_PERTAR_LEDGER_PREFIX_SELFTEST as Readonly<{
      sourceReady: Assessment;
      actionReady: Assessment;
      controls: Readonly<Record<string, Assessment>>;
    }>;
    const progression = ARC4_PERTAR_PROGRESSION_TAIL_SELFTEST as Readonly<{
      positive: Assessment;
      controls: Readonly<Record<string, Assessment>>;
    }>;

    expect(ARC4_PERTAR_FIXTURE.sourceReadySessionOrdinal).toBe(1);
    expect(ARC4_PERTAR_FIXTURE.actionReadySessionOrdinal).toBe(3);
    expect(ARC4_PERTAR_FIXTURE.actionReadyReceiptKinds).toEqual([
      'arc9-progression-refresh-v1', 'arc9-survey-v1', 'arc0-land',
    ]);
    expect(ARC4_PERTAR_FIXTURE.actions.firstHit.progressionTail).toMatchObject({
      receiptKind: 'arc9-progression-refresh-v1',
      addedAchievementIds: ['rare', 'legend'],
      priorBestRankIndex: 3,
      nextBestRankIndex: 3,
    });
    expect(prefix.sourceReady.ok).toBe(true);
    expect(prefix.actionReady.ok).toBe(true);
    expect(Object.keys(prefix.controls)).toEqual([
      'staleEmptyLedger', 'missingReceipt', 'extraReceipt', 'reorderedReceipts',
      'bootWitness', 'surveyWitness', 'landingWitness', 'authorityOrdinal',
      'runtimeOrdinal',
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

  it('makes the browser runner consume those shared contracts and stop before storage on red', () => {
    expect(runnerContractPasses(currentOwners)).toBe(true);
  });

  it('rejects omission of the progression tail, stale empty-ledger logic, and noncausal failure collection', () => {
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
  });
});
