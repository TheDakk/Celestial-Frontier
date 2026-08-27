import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
// @ts-expect-error The executable JavaScript evidence contract intentionally has no declaration shim.
import { ARC4_PERTAR_FIXTURE, assessArc4TameGreetingStartObservation } from '../tools/arc4-browser-contract.mjs';

const sliceSource = readFileSync(
  fileURLToPath(new URL('../tools/slicesmoke.mjs', import.meta.url)),
  'utf8',
);
const contractSource = readFileSync(
  fileURLToPath(new URL('../tools/arc4-browser-contract.mjs', import.meta.url)),
  'utf8',
);

type Assessment = Readonly<{
  ok: boolean;
  checks: Readonly<Record<string, boolean>>;
  reasons: readonly string[];
}>;
type Field = readonly [label: string, target: string];
type OrderRule = Readonly<{ label: string; first: string; second: string }>;

const occurrences = (source: string, target: string): number => (
  source.split(target).length - 1
);

function section(source: string, start: string, end: string): string {
  expect(occurrences(source, start), `unique owner start: ${start}`).toBe(1);
  expect(occurrences(source, end), `unique owner end: ${end}`).toBe(1);
  const left = source.indexOf(start);
  const right = source.indexOf(end, left + start.length);
  expect(left).toBeGreaterThanOrEqual(0);
  expect(right).toBeGreaterThan(left);
  const owner = source.slice(left, right);
  expect(owner.trim().length).toBeGreaterThan(0);
  return owner;
}

function fieldErrors(owner: string, fields: readonly Field[]): string[] {
  return fields.flatMap(([label, target]) => {
    const count = occurrences(owner, target);
    return count === 1 ? [] : [`${label}: expected one owner field, got ${count}`];
  });
}

function orderErrors(owner: string, rules: readonly OrderRule[]): string[] {
  return rules.flatMap(({ label, first, second }) => {
    const firstCount = occurrences(owner, first);
    const secondCount = occurrences(owner, second);
    if (firstCount !== 1 || secondCount !== 1) {
      return [`${label}: non-unique order fields (${firstCount}, ${secondCount})`];
    }
    return owner.indexOf(first) < owner.indexOf(second) ? [] : [`${label}: reversed`];
  });
}

function replaceUnique(owner: string, target: string, replacement: string): string {
  expect(occurrences(owner, target)).toBe(1);
  expect(owner).not.toContain(replacement);
  const mutant = owner.replace(target, replacement);
  expect(mutant).not.toBe(owner);
  expect(occurrences(mutant, target)).toBe(0);
  expect(mutant).toContain(replacement);
  return mutant;
}

function swapUnique(owner: string, first: string, second: string, index: number): string {
  expect(occurrences(owner, first)).toBe(1);
  expect(occurrences(owner, second)).toBe(1);
  const marker = `__ARC4_TAME_START_ORDER_${index}__`;
  expect(owner).not.toContain(marker);
  return owner.replace(first, marker).replace(second, first).replace(marker, second);
}

const collectorOwner = section(
  sliceSource,
  '  const collectArc4TameGreetingStart = async (timeoutMs = 10_000) => {',
  '  /* One abandoned pagehide release may retain its fenced lease until the',
);
const rehearsalOwner = section(
  sliceSource,
  "  /* Arc 7/8's one player-live greeting is rehearsed on its own fresh Pertar",
  '  const arc4TameAudioAfterRaw = await evalIn(ARC4_DURABLE_READ_EXPRESSION);',
);
const startContractOwner = section(
  contractSource,
  'export const assessArc4TameGreetingStartObservation = (observation) => {',
  'const tameGreetingFreshFixtureIsolated = (freshFixture, reloaded) => {',
);
const resultProjectionOwner = section(
  contractSource,
  'const tameGreetingResultProjection = (result) => ({',
  '/** Bounded post-release observation verdict.',
);
const contractSelftestOwner = section(
  contractSource,
  'const tameGreetingBeforeRawSelftest = structuredClone(beforeRawSelftest);',
  'const nonzeroActivePlaySelftest = 9_000;',
);
const genericResultOwner = section(
  contractSource,
  'const exactAppCaptureResult = (',
  'const settledUiOutcome = (ui, expectedKind, verb) => (',
);
const genericResultFixtureOwner = section(
  contractSource,
  'const hitResultSelftest = {',
  'const sampleInteraction = {',
);
const genericResultControlOwner = section(
  contractSource,
  'const negativeHitGlobalRevisionResultSelftest = structuredClone(',
  'const hitAddressMutationSelftest = (mutate, target = \'progress\') => {',
);
const tameAudioContractOwner = section(
  contractSource,
  'const tameGreetingFreshFixtureIsolated = (freshFixture, reloaded) => {',
  'export const assessArc4PublicationConvergence = ({',
);
const tameAudioVirginOwner = section(
  contractSource,
  'const tameGreetingAudioVirgin = (observation) => {',
  'const tameGreetingVoiceOwnerExact = (observation, eventKey, creatureId) => {',
);
const sliceTameAudioVirginOwner = section(
  sliceSource,
  '  const arc4TameGreetingAudioVirgin = (observation) => {',
  '  const arc4ReloadedSurfaceObservationExact = ({ state, ui } = {}, expectedUsed) => (',
);
const tameAudioMutationOwner = section(
  contractSource,
  'const tameGreetingAudioMutationSelftests = Object.freeze({',
  'const tameGreetingCompletedBeforeFirstReadSelftest = structuredClone(',
);
const sliceHitRevisionControlOwner = section(
  sliceSource,
  '  const arc4HitOuterRevisionControlState = structuredClone(arc4HitState);',
  '  const arc4HitV4MaxGenControl = assessArc4CommittedHit({',
);
const sliceMissRevisionControlOwner = section(
  sliceSource,
  '  const arc4MissMissingOwnershipRevisionControlState = structuredClone(',
  '  /* Burn down only the remaining finite budget through Main\'s registered',
);
const sliceBurnRevisionControlOwner = section(
  sliceSource,
  '    const outcomeRevisionControl = structuredClone(outcome);',
  '    const baselineChecks = Object.values(assessment?.checks ?? {});',
);
const sliceTameAudioMutationOwner = section(
  sliceSource,
  '  const arc4TameAudioControls = {',
  '  const arc4TameAudioRehearsalChecks = {',
);

const COLLECTOR_FIELDS = [
  ['unchanged bound', 'const collectArc4TameGreetingStart = async (timeoutMs = 10_000) => {'],
  ['one immutable deadline', 'const deadline = Date.now() + timeoutMs;'],
  ['initial retained envelope', 'let retained = {'],
  ['raw observation', 'const observation = await evalIn('],
  ['Node classifier', 'const assessment = assessArc4TameGreetingStartObservation(observation);'],
  ['poll envelope replacement', 'ok: assessment.ok === true,'],
  ['poll checks retention', 'checks: assessment.checks,'],
  ['poll observation retention', 'observation,'],
  ['green return', 'if (retained.ok) return retained;'],
  ['timeout return', '    return retained;\n  };'],
] as const satisfies readonly Field[];

const COLLECTOR_ORDER = [
  {
    label: 'deadline -> poll',
    first: 'const deadline = Date.now() + timeoutMs;',
    second: 'while (Date.now() < deadline) {',
  },
  {
    label: 'observation -> classifier',
    first: 'const observation = await evalIn(',
    second: 'const assessment = assessArc4TameGreetingStartObservation(observation);',
  },
  {
    label: 'classifier -> retained envelope',
    first: 'const assessment = assessArc4TameGreetingStartObservation(observation);',
    second: 'ok: assessment.ok === true,',
  },
  {
    label: 'green return -> next poll',
    first: 'if (retained.ok) return retained;',
    second: 'await sleep(50);',
  },
] as const satisfies readonly OrderRule[];

const RELEASE_FAIL_CALL =
  "failSliceWithoutCascade('ARC 4 TAME GREETING AUDIO RELEASE:";
const START_FAIL_CALL =
  "failSliceWithoutCascade('ARC 4 TAME GREETING AUDIO START:";
const START_CONTROL_FAIL_CALL =
  "failSliceWithoutCascade('ARC 4 TAME GREETING AUDIO START CONTROLS:";
const COLLECTOR_CALL =
  'const arc4TameAudioStartedCollection = await collectArc4TameGreetingStart(10_000);';

const REHEARSAL_FIELDS = [
  ['release result', 'const arc4TameAudioReleased = await evalIn('],
  ['release exact-true guard', 'if (arc4TameAudioReleased !== true) {'],
  ['release fail call', RELEASE_FAIL_CALL],
  ['collector call', COLLECTOR_CALL],
  ['collector red guard', 'if (arc4TameAudioStartedCollection.ok !== true) {'],
  ['collector fail call', START_FAIL_CALL],
  ['retained observation', 'const arc4TameAudioStarted = arc4TameAudioStartedCollection.observation;'],
  ['green source for live controls', 'positive: assessArc4TameGreetingStartObservation(arc4TameAudioStarted),'],
  ['result mismatch live control', 'resultMismatch: arc4TameAudioStartMutation((observation) => {'],
  ['global mismatch live control', 'globalMismatch: arc4TameAudioStartMutation((observation) => {'],
  ['ownership-stale live control', 'ownershipStale: arc4TameAudioStartMutation((observation) => {'],
  ['runtime-rejection live control', 'runtimeRejection: arc4TameAudioStartMutation((observation) => {'],
  ['completed-before-first-read control', 'completedBeforeFirstRead: assessArc4TameGreetingStartObservation('],
  ['live-control fail call', START_CONTROL_FAIL_CALL],
] as const satisfies readonly Field[];

const REHEARSAL_ORDER = [
  {
    label: 'release -> actual fail call',
    first: 'const arc4TameAudioReleased = await evalIn(',
    second: RELEASE_FAIL_CALL,
  },
  {
    label: 'release fail call -> collector',
    first: RELEASE_FAIL_CALL,
    second: COLLECTOR_CALL,
  },
  {
    label: 'collector -> actual start fail call',
    first: COLLECTOR_CALL,
    second: START_FAIL_CALL,
  },
  {
    label: 'start fail call -> retained observation use',
    first: START_FAIL_CALL,
    second: 'const arc4TameAudioStarted = arc4TameAudioStartedCollection.observation;',
  },
  {
    label: 'live controls -> actual control fail call',
    first: 'const arc4TameAudioStartControlsIsolated =',
    second: START_CONTROL_FAIL_CALL,
  },
] as const satisfies readonly OrderRule[];

const START_CONTRACT_FIELDS = [
  ['result clause', 'result: exactKeys(result, ['],
  ['global clause', 'global: Number.isSafeInteger(observation?.globalRevision)'],
  ['ownership clause', 'ownership: Number.isSafeInteger(observation?.captureRevision)'],
  ['claim clause', 'claim: tameGreetingAudioShape(observation)'],
  ['counterpart clause', 'counterpart: counter(observation?.toast?.serial)'],
  ['runtime clause', 'runtime: tameGreetingRuntimeStartExact(observation),'],
  ['toast clause', 'toast: observation?.answerable === true'],
  ['global equality', 'result?.revision === observation.globalRevision'],
  ['capture ownership equality', 'result?.ownershipRevision === observation.captureRevision'],
  ['live ownership equality', 'result?.ownershipRevision === observation.ownershipRevision'],
] as const satisfies readonly Field[];

const GENERIC_RESULT_FIELDS = [
  ['exact result schema', '&& exactKeys(result, ['],
  ['global result key', "'stardustReward', 'revision', 'ownershipRevision',"],
  ['global transaction binding', 'result?.revision === committedRevision'],
  ['ownership successor binding',
    'result?.ownershipRevision === committedOwnershipRevision'],
  ['live Arc 4 binding', 'capture?.revision === committedOwnershipRevision'],
  ['live Arc 5 binding', 'ownershipV2?.revision === committedOwnershipRevision'],
] as const satisfies readonly Field[];

const GENERIC_FIXTURE_FIELDS = [
  ['hit ownership revision',
    'ownershipRevision: hitRawSelftest.captureRevision,'],
  ['miss ownership revision',
    'ownershipRevision: missRawSelftest.captureRevision,'],
] as const satisfies readonly Field[];

const GENERIC_CONTROL_FIELDS = [
  ['global revision control',
    'const negativeHitGlobalRevisionResultSelftest = structuredClone('],
  ['missing ownership control',
    'const negativeHitMissingOwnershipRevisionResultSelftest = structuredClone('],
  ['missing ownership deletion',
    '.afterState.capture.lastResult.ownershipRevision;'],
  ['wrong ownership control',
    'const negativeHitWrongOwnershipRevisionResultSelftest = structuredClone('],
  ['wrong ownership mutation',
    '.afterState.capture.lastResult.ownershipRevision += 1;'],
] as const satisfies readonly Field[];

const TAME_RELOAD_FIELDS = [
  ['fresh result eviction', 'freshFixture.observation?.result === null'],
  ['reload result eviction', 'reloaded?.result === null'],
] as const satisfies readonly Field[];

const TAME_RELOAD_MUTATION_FIELDS = [
  ['reload retained-result control', 'reloadRetainedResult: Object.freeze({'],
  ['reload retained-result mutation',
    'bundle.reloaded.result = structuredClone(bundle.started.result);'],
  ['fresh retained-result control',
    'freshFixtureRetainedResult: Object.freeze({'],
  ['fresh retained-result mutation',
    'bundle.freshFixture.observation.result = structuredClone('],
] as const satisfies readonly Field[];

const SLICE_HIT_OWNERSHIP_CONTROL_FIELDS = [
  ['missing ownership control state',
    'const arc4HitMissingOwnershipRevisionControlState = structuredClone('],
  ['missing ownership deletion',
    '.capture.lastResult.ownershipRevision;'],
  ['wrong ownership control state',
    'const arc4HitWrongOwnershipRevisionControlState = structuredClone('],
  ['wrong ownership mutation',
    '.capture.lastResult.ownershipRevision += 1;'],
] as const satisfies readonly Field[];

const SLICE_MISS_OWNERSHIP_CONTROL_FIELDS = [
  ['missing ownership control state',
    'const arc4MissMissingOwnershipRevisionControlState = structuredClone('],
  ['missing ownership deletion',
    '.capture.lastResult.ownershipRevision;'],
  ['missing ownership assessment',
    'const arc4MissMissingOwnershipRevisionControl = assessArc4CommittedMiss({'],
  ['wrong ownership control state',
    'const arc4MissWrongOwnershipRevisionControlState = structuredClone('],
  ['wrong ownership mutation',
    '.capture.lastResult.ownershipRevision += 1;'],
  ['wrong ownership assessment',
    'const arc4MissWrongOwnershipRevisionControl = assessArc4CommittedMiss({'],
  ['missing ownership isolation',
    "arc4MissMissingOwnershipRevisionControl, 'appResult',"],
  ['wrong ownership isolation',
    "arc4MissWrongOwnershipRevisionControl, 'appResult',"],
] as const satisfies readonly Field[];

const SLICE_BURN_OWNERSHIP_CONTROL_FIELDS = [
  ['missing ownership outcome',
    'const outcomeMissingOwnershipRevisionControl = structuredClone(outcome);'],
  ['missing ownership state',
    'const outcomeMissingOwnershipRevisionControlState = structuredClone('],
  ['missing outcome deletion',
    'delete outcomeMissingOwnershipRevisionControl.result.ownershipRevision;'],
  ['missing state deletion',
    '.capture.lastResult.ownershipRevision;'],
  ['wrong ownership outcome',
    'const outcomeWrongOwnershipRevisionControl = structuredClone(outcome);'],
  ['wrong ownership state',
    'const outcomeWrongOwnershipRevisionControlState = structuredClone('],
  ['wrong outcome mutation',
    'outcomeWrongOwnershipRevisionControl.result.ownershipRevision += 1;'],
  ['wrong state mutation',
    '.capture.lastResult.ownershipRevision += 1;'],
  ['missing ownership control entry',
    'outcomeMissingOwnershipRevision: {'],
  ['missing coherent state input',
    'afterState: outcomeMissingOwnershipRevisionControlState,'],
  ['wrong ownership control entry',
    'outcomeWrongOwnershipRevision: {'],
  ['wrong coherent state input',
    'afterState: outcomeWrongOwnershipRevisionControlState,'],
] as const satisfies readonly Field[];

const SLICE_TAME_RELOAD_MUTATION_FIELDS = [
  ['reload retained-result control', 'reloadRetainedResult: {'],
  ['reload retained-result mutation',
    'next.reloaded.result = structuredClone(next.started.result);'],
  ['fresh retained-result control', 'freshFixtureRetainedResult: {'],
  ['fresh retained-result mutation',
    'next.freshFixture.observation.result = structuredClone('],
  ['expanded control cardinality',
    'Object.keys(arc4TameAudioControls).length === 19'],
] as const satisfies readonly Field[];

const TAME_CONTEXT_MUTATION_FIELDS = [
  ['diagnostic context-state control', 'diagnosticReadContextState: Object.freeze({'],
  ['diagnostic context-state mutation',
    "bundle.diagnosticRead.audio.runtime.contextState = 'suspended';"],
  ['reload context-created control', 'reloadCreatedContext: Object.freeze({'],
  ['reload context-created mutation',
    'bundle.reloaded.audio.runtime.contextGeneration = 1;'],
] as const satisfies readonly Field[];

const SLICE_TAME_CONTEXT_MUTATION_FIELDS = [
  ['diagnostic context-state control', 'diagnosticReadContextState: {'],
  ['diagnostic context-state mutation',
    "next.diagnosticRead.audio.runtime.contextState = 'suspended';"],
  ['reload context-created control', 'reloadCreatedContext: {'],
  ['reload context-created mutation',
    'next.reloaded.audio.runtime.contextGeneration = 1;'],
] as const satisfies readonly Field[];

function expectOnlyChecksRed(assessment: Assessment, expected: readonly string[]): void {
  expect(assessment.ok).toBe(false);
  expect(Object.entries(assessment.checks)
    .filter(([, value]) => value !== true)
    .map(([name]) => name)).toEqual(expected);
}

function activeObservation(): Record<string, any> {
  const expected = ARC4_PERTAR_FIXTURE.actions.tameGreetingHit;
  const toastSerial = 11;
  const voiceId = 'voice:creature-expression:collector-selftest';
  return {
    documentToken: 'tame-start-collector-document',
    globalRevision: 31,
    captureRevision: 1,
    ownershipRevision: 1,
    answerable: true,
    cardOpen: true,
    result: {
      hit: true,
      speciesId: expected.speciesId,
      speciesName: expected.speciesName,
      kingdom: 'fauna',
      sourceOrdinal: expected.sourceOrdinal,
      tier: expected.tier,
      chance: expected.chance,
      worldKey: ARC4_PERTAR_FIXTURE.worldKey,
      ecologyEpoch: ARC4_PERTAR_FIXTURE.ecologyEpoch,
      fullRosterFingerprint: ARC4_PERTAR_FIXTURE.fullRosterFingerprint,
      firstForSpecies: expected.firstForSpecies,
      spent: expected.spent,
      remainingAfter: expected.remainingAfter,
      ownedRowId: 'creature-v1:collector-selftest',
      stardustReward: expected.stardustReward,
      revision: 31,
      ownershipRevision: 1,
    },
    audio: {
      schema: 'cf-v2-tame-greeting-audio/v1',
      disposed: false,
      armed: 0,
      claimedEvents: 1,
      activeVoiceId: voiceId,
      lastEventKey: 'arc4:taming-succeeded:discovery-v1:collector-selftest',
      lastDisposition: 'voice-started',
      counterpart: {
        key: `capture-toast:${toastSerial}`,
        generation: toastSerial,
        status: 'live',
      },
      runtime: {
        state: 'running',
        contextState: 'running',
        contextGeneration: 1,
        muted: false,
        nodes: { active: 15, peak: 15 },
        voices: {
          active: 1,
          peak: 1,
          ids: [voiceId],
          started: 1,
          completed: 0,
          stopped: 0,
          stolen: 0,
          cooldownRejects: 0,
          concurrencyRejects: 0,
        },
        creatureEmitters: { active: 1, peak: 1 },
        faults: { total: 0 },
      },
    },
    toast: {
      visible: true,
      serial: toastSerial,
      role: 'status',
      live: 'assertive',
      atomic: 'true',
      title: `Tamed ${expected.speciesName}.`,
      detail: `${expected.chance * 100}% odds. New Compendium page; one owned creature. 1 Biosphere Yield spent; ${expected.remainingAfter} remain.`,
    },
  };
}

describe('Slice Arc 4 Tame greeting post-release collector', () => {
  it('owns one bounded retained collector and fail-fast release sequence', () => {
    expect(fieldErrors(collectorOwner, COLLECTOR_FIELDS)).toEqual([]);
    expect(orderErrors(collectorOwner, COLLECTOR_ORDER)).toEqual([]);
    expect(fieldErrors(rehearsalOwner, REHEARSAL_FIELDS)).toEqual([]);
    expect(orderErrors(rehearsalOwner, REHEARSAL_ORDER)).toEqual([]);
  });

  it('makes every unique collector and release field deletion red', () => {
    for (const [index, [label, target]] of COLLECTOR_FIELDS.entries()) {
      const marker = `__ARC4_TAME_COLLECTOR_FIELD_${index}__`;
      const mutant = replaceUnique(collectorOwner, target, marker);
      expect(fieldErrors(mutant, COLLECTOR_FIELDS), label).toContain(
        `${label}: expected one owner field, got 0`,
      );
    }
    for (const [index, [label, target]] of REHEARSAL_FIELDS.entries()) {
      const marker = `__ARC4_TAME_REHEARSAL_FIELD_${index}__`;
      const mutant = replaceUnique(rehearsalOwner, target, marker);
      expect(fieldErrors(mutant, REHEARSAL_FIELDS), label).toContain(
        `${label}: expected one owner field, got 0`,
      );
    }
  });

  it('rejects moving the actual release/start/control fail calls past dependent work', () => {
    for (const [index, rule] of REHEARSAL_ORDER.entries()) {
      const mutant = swapUnique(rehearsalOwner, rule.first, rule.second, index);
      expect(orderErrors(mutant, REHEARSAL_ORDER), rule.label).toContain(
        `${rule.label}: reversed`,
      );
    }
  });

  it('rejects a collector that classifies before observation or drops the timeout envelope', () => {
    const reversed = swapUnique(
      collectorOwner,
      COLLECTOR_ORDER[1].first,
      COLLECTOR_ORDER[1].second,
      90,
    );
    expect(orderErrors(reversed, COLLECTOR_ORDER)).toContain(
      'observation -> classifier: reversed',
    );
    const droppedTimeout = replaceUnique(
      collectorOwner,
      '    return retained;\n  };',
      '    return null;\n  };',
    );
    expect(fieldErrors(droppedTimeout, COLLECTOR_FIELDS)).toContain(
      'timeout return: expected one owner field, got 0',
    );
  });

  it('binds exact global and ownership counters in both projection and live contract', () => {
    expect(fieldErrors(startContractOwner, START_CONTRACT_FIELDS)).toEqual([]);
    expect(occurrences(resultProjectionOwner, 'revision: result?.revision ?? null,')).toBe(1);
    expect(occurrences(resultProjectionOwner,
      'ownershipRevision: result?.ownershipRevision ?? null,')).toBe(1);
    expect(occurrences(contractSource, 'revision: afterRaw?.revision,')).toBe(1);
    expect(occurrences(contractSource,
      'ownershipRevision: afterRaw?.captureRevision,')).toBe(1);
    expect(contractSelftestOwner).toContain('tameGreetingBeforeRawSelftest.revision = 23;');
    expect(contractSelftestOwner).toContain('revision: 24, ordinal: 1,');
    expect(contractSelftestOwner).toContain(
      'revision: tameGreetingAfterRawSelftest.revision,',
    );
    expect(contractSelftestOwner).toContain(
      'ownershipRevision: tameGreetingAfterRawSelftest.captureRevision,',
    );
  });

  it('binds the generic Arc 4 result to independent global and live ownership counters', () => {
    expect(fieldErrors(genericResultOwner, GENERIC_RESULT_FIELDS)).toEqual([]);
    expect(fieldErrors(genericResultFixtureOwner, GENERIC_FIXTURE_FIELDS)).toEqual([]);
    expect(fieldErrors(genericResultControlOwner, GENERIC_CONTROL_FIELDS)).toEqual([]);
    expect(fieldErrors(
      sliceHitRevisionControlOwner,
      SLICE_HIT_OWNERSHIP_CONTROL_FIELDS,
    )).toEqual([]);
    expect(fieldErrors(
      sliceMissRevisionControlOwner,
      SLICE_MISS_OWNERSHIP_CONTROL_FIELDS,
    )).toEqual([]);
    expect(fieldErrors(
      sliceBurnRevisionControlOwner,
      SLICE_BURN_OWNERSHIP_CONTROL_FIELDS,
    )).toEqual([]);
    expect(contractSource).toContain('hitMissingOwnershipRevisionResult: Object.freeze({');
    expect(contractSource).toContain('hitWrongOwnershipRevisionResult: Object.freeze({');
    expect(sliceSource).toContain(
      "arc4HitMissingOwnershipRevisionControl, 'appResult',",
    );
    expect(sliceSource).toContain(
      "arc4HitWrongOwnershipRevisionControl, 'appResult',",
    );
    expect(sliceSource).toContain(
      "arc4MissMissingOwnershipRevisionControl, 'appResult',",
    );
    expect(sliceSource).toContain(
      "arc4MissWrongOwnershipRevisionControl, 'appResult',",
    );

    const owners = [
      [genericResultOwner, GENERIC_RESULT_FIELDS],
      [genericResultFixtureOwner, GENERIC_FIXTURE_FIELDS],
      [genericResultControlOwner, GENERIC_CONTROL_FIELDS],
      [sliceHitRevisionControlOwner, SLICE_HIT_OWNERSHIP_CONTROL_FIELDS],
      [sliceMissRevisionControlOwner, SLICE_MISS_OWNERSHIP_CONTROL_FIELDS],
      [sliceBurnRevisionControlOwner, SLICE_BURN_OWNERSHIP_CONTROL_FIELDS],
    ] as const;
    let marker = 0;
    for (const [owner, fields] of owners) {
      for (const [label, target] of fields) {
        const mutant = replaceUnique(owner, target, `__ARC4_RESULT_FIELD_${marker++}__`);
        expect(fieldErrors(mutant, fields), label).toContain(
          `${label}: expected one owner field, got 0`,
        );
      }
    }
  });

  it('requires transient result eviction after reload and in the fresh fixture', () => {
    expect(fieldErrors(tameAudioContractOwner, TAME_RELOAD_FIELDS)).toEqual([]);
    expect(fieldErrors(
      tameAudioMutationOwner,
      TAME_RELOAD_MUTATION_FIELDS,
    )).toEqual([]);
    expect(fieldErrors(
      sliceTameAudioMutationOwner,
      SLICE_TAME_RELOAD_MUTATION_FIELDS,
    )).toEqual([]);

    const owners = [
      [tameAudioContractOwner, TAME_RELOAD_FIELDS],
      [tameAudioMutationOwner, TAME_RELOAD_MUTATION_FIELDS],
      [sliceTameAudioMutationOwner, SLICE_TAME_RELOAD_MUTATION_FIELDS],
    ] as const;
    let marker = 0;
    for (const [owner, fields] of owners) {
      for (const [label, target] of fields) {
        const mutant = replaceUnique(owner, target, `__ARC4_RELOAD_FIELD_${marker++}__`);
        expect(fieldErrors(mutant, fields), label).toContain(
          `${label}: expected one owner field, got 0`,
        );
      }
    }
  });

  it('treats an unmuted blocked policy as contextless and independently controls context creation', () => {
    expect(tameAudioVirginOwner).toContain('tameGreetingAudioShape(observation)');
    expect(tameAudioVirginOwner).not.toContain('runtime.muted === true');
    expect(sliceTameAudioVirginOwner).toContain("typeof runtime?.muted === 'boolean'");
    expect(sliceTameAudioVirginOwner).not.toContain('runtime?.muted === true');
    expect(contractSelftestOwner).toContain(
      "muted: false, nodesActive: 0, nodesPeak: 0,",
    );
    expect(sliceSource).toContain('&&observation?.result===null');
    expect(fieldErrors(
      tameAudioMutationOwner,
      TAME_CONTEXT_MUTATION_FIELDS,
    )).toEqual([]);
    expect(fieldErrors(
      sliceTameAudioMutationOwner,
      SLICE_TAME_CONTEXT_MUTATION_FIELDS,
    )).toEqual([]);

    const owners = [
      [tameAudioMutationOwner, TAME_CONTEXT_MUTATION_FIELDS],
      [sliceTameAudioMutationOwner, SLICE_TAME_CONTEXT_MUTATION_FIELDS],
    ] as const;
    let marker = 0;
    for (const [owner, fields] of owners) {
      for (const [label, target] of fields) {
        const mutant = replaceUnique(owner, target, `__ARC4_CONTEXT_FIELD_${marker++}__`);
        expect(fieldErrors(mutant, fields), label).toContain(
          `${label}: expected one owner field, got 0`,
        );
      }
    }
  });

  it('accepts one exact active start and one exact natural completion before first read', () => {
    const active = activeObservation();
    const activeAssessment = assessArc4TameGreetingStartObservation(active) as Assessment;
    expect(activeAssessment.ok).toBe(true);
    expect(Object.keys(activeAssessment.checks)).toEqual([
      'result', 'global', 'ownership', 'claim', 'counterpart', 'runtime', 'toast',
    ]);
    expect(Object.values(activeAssessment.checks).every((value) => value === true)).toBe(true);

    const completed = structuredClone(active);
    completed.audio.activeVoiceId = null;
    completed.audio.runtime.voices.active = 0;
    completed.audio.runtime.voices.ids = [];
    completed.audio.runtime.voices.completed = 1;
    completed.audio.runtime.creatureEmitters.active = 0;
    expect(completed).not.toEqual(active);
    const completedAssessment = assessArc4TameGreetingStartObservation(completed) as Assessment;
    expect(completedAssessment.ok).toBe(true);
    expect(Object.values(completedAssessment.checks).every((value) => value === true)).toBe(true);
  });

  it('isolates live result/global/ownership/claim/counterpart/runtime/toast controls', () => {
    const positive = activeObservation();
    expect(assessArc4TameGreetingStartObservation(positive).ok).toBe(true);
    const controls: readonly Readonly<{
      label: string;
      expected: readonly string[];
      mutate: (observation: Record<string, any>) => void;
    }>[] = [
      { label: 'result mismatch', expected: ['result'], mutate: (row) => { row.result.tier += 1; } },
      { label: 'wrong global', expected: ['global'], mutate: (row) => { row.result.revision += 1; } },
      { label: 'ownership stale', expected: ['ownership'], mutate: (row) => { row.result.ownershipRevision += 1; } },
      { label: 'claim rejection', expected: ['claim'], mutate: (row) => { row.audio.lastDisposition = 'runtime-rejected:mutated'; } },
      { label: 'counterpart mismatch', expected: ['counterpart'], mutate: (row) => { row.audio.counterpart.key = 'capture-toast:mutated'; } },
      { label: 'runtime rejection', expected: ['runtime'], mutate: (row) => { row.audio.runtime.voices.cooldownRejects = 1; } },
      { label: 'toast drift', expected: ['toast'], mutate: (row) => { row.toast.live = 'polite'; } },
      {
        label: 'swapped counters', expected: ['global', 'ownership'], mutate: (row) => {
          const global = row.result.revision;
          row.result.revision = row.result.ownershipRevision;
          row.result.ownershipRevision = global;
        },
      },
      {
        label: 'equalized counters', expected: ['ownership'], mutate: (row) => {
          row.result.ownershipRevision = row.result.revision;
        },
      },
    ];
    for (const control of controls) {
      const mutant = structuredClone(positive);
      control.mutate(mutant);
      expect(mutant, control.label).not.toEqual(positive);
      expect(assessArc4TameGreetingStartObservation(positive).ok, control.label).toBe(true);
      expectOnlyChecksRed(
        assessArc4TameGreetingStartObservation(mutant) as Assessment,
        control.expected,
      );
    }
  });

  it('keeps one-start and peak ownership strict after natural completion', () => {
    const completed = activeObservation();
    completed.audio.activeVoiceId = null;
    completed.audio.runtime.voices.active = 0;
    completed.audio.runtime.voices.ids = [];
    completed.audio.runtime.voices.completed = 1;
    completed.audio.runtime.creatureEmitters.active = 0;
    expect(assessArc4TameGreetingStartObservation(completed).ok).toBe(true);
    const controls = [
      (row: Record<string, any>): void => { row.audio.runtime.voices.started = 2; },
      (row: Record<string, any>): void => { row.audio.runtime.voices.peak = 2; },
      (row: Record<string, any>): void => { row.audio.runtime.creatureEmitters.peak = 2; },
      (row: Record<string, any>): void => { row.audio.runtime.voices.completed = 0; },
      (row: Record<string, any>): void => { row.audio.runtime.voices.stopped = 1; },
    ];
    for (const mutate of controls) {
      const mutant = structuredClone(completed);
      mutate(mutant);
      expectOnlyChecksRed(
        assessArc4TameGreetingStartObservation(mutant) as Assessment,
        ['runtime'],
      );
    }
  });
});
