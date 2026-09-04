import { afterEach, describe, expect, it } from 'vitest';
// @ts-expect-error Executable JavaScript evidence contract intentionally has no declaration shim.
import { advanceStoredV4StageOwnerStability, assessStoredV4StageInvocation, buildStoredV4StageInvocationExpression, classifyStoredV4StageOwnerObservation, storedV4StageContinuationDecision } from '../tools/slicesmoke-contract.mjs';

const TOKEN = 'document-owner-1';

interface StageStabilityStep {
  status: 'pending' | 'ready';
  candidateToken: string | null;
  readyToken: string | null;
  assessment: { status: string; reasons: string[] };
}

function ownerObservation(overrides: Record<string, unknown> = {}) {
  return {
    schema: 'cf-v2-stored-v4-stage-owner/v1', documentToken: TOKEN,
    readyState: 'complete', slicePresent: true, apiPresent: true,
    stageHookPresent: true, persistenceReady: true,
    persistenceHold: null, mutationBlocked: false,
    convergenceReloadScheduled: false, ...overrides,
  };
}

function installOwner(hook: (raw: string | null, backup?: string) => unknown, overrides: Record<string, unknown> = {}) {
  let persistenceHold = overrides.persistenceHold ?? null;
  let mutationBlocked = overrides.mutationBlocked ?? persistenceHold === 'protected-payload';
  Object.defineProperty(globalThis, 'document', {
    configurable: true, value: { readyState: overrides.readyState ?? 'complete' },
  });
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { __CF_SLICE__: {
      documentToken: overrides.documentToken ?? TOKEN,
      api: {
        state: () => ({ persistence: {
          ready: overrides.persistenceReady ?? true,
          hold: persistenceHold,
          mutationBlocked,
          convergenceReloadScheduled: overrides.convergenceReloadScheduled ?? false,
        } }),
        __smokeStageStoredV4: async (raw: string | null, backup?: string) => {
          const result = await hook(raw, backup);
          if (result === true) {
            persistenceHold = 'protected-payload';
            mutationBlocked = true;
          }
          return result;
        },
      },
    } },
  });
}

async function invoke(
  raw: string | null = '{"v":4}', backup?: string, token = TOKEN,
  allowedHolds: unknown[] = [null, 'protected-payload'],
) {
  return await Function(`return ${buildStoredV4StageInvocationExpression(raw, backup, token, allowedHolds)}`)();
}

async function invokeExpression(expression: string) {
  return await Function(`return ${expression}`)();
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'window');
  Reflect.deleteProperty(globalThis, 'document');
});

describe('stored-v4 stage lifecycle contract', () => {
  it('classifies only the exact ready owner surface as ready', () => {
    expect(classifyStoredV4StageOwnerObservation(ownerObservation())).toEqual({ status: 'ready', reasons: [] });
    expect(classifyStoredV4StageOwnerObservation(null).status).toBe('pending');
    expect(classifyStoredV4StageOwnerObservation(ownerObservation({ readyState: 'loading' })).status).toBe('pending');
    expect(classifyStoredV4StageOwnerObservation(ownerObservation({ stageHookPresent: false })).status).toBe('pending');
    expect(classifyStoredV4StageOwnerObservation(ownerObservation({ persistenceReady: false })).status).toBe('pending');
    expect(classifyStoredV4StageOwnerObservation(ownerObservation({ convergenceReloadScheduled: null })).status).toBe('pending');
    expect(classifyStoredV4StageOwnerObservation(ownerObservation({ convergenceReloadScheduled: true }))).toEqual({
      status: 'pending', reasons: ['convergence reload scheduled'],
    });
    expect(classifyStoredV4StageOwnerObservation(ownerObservation({
      persistenceHold: 'transient-read', mutationBlocked: true,
    })).status).toBe('pending');
    expect(classifyStoredV4StageOwnerObservation(ownerObservation({
      persistenceHold: 'protected-payload', mutationBlocked: true,
    }), [null]).status).toBe('pending');
    expect(classifyStoredV4StageOwnerObservation(ownerObservation({
      persistenceHold: 'protected-payload', mutationBlocked: true,
    }), ['protected-payload'])).toEqual({ status: 'ready', reasons: [] });
    expect(classifyStoredV4StageOwnerObservation(ownerObservation({
      persistenceHold: 'protected-payload', mutationBlocked: false,
    })).status).toBe('pending');
    expect(classifyStoredV4StageOwnerObservation(ownerObservation({
      persistenceHold: null, mutationBlocked: true,
    }))).toEqual({ status: 'pending', reasons: ['writable hold authority'] });
  });

  it('accepts one matching-owner invocation with exact raw and backup', async () => {
    const calls: unknown[][] = [];
    installOwner((...args) => { calls.push(args); return true; });
    const receipt = await invoke('{"v":4}', '{"v":4,"backup":true}');
    expect(calls).toEqual([['{"v":4}', '{"v":4,"backup":true}']]);
    expect(assessStoredV4StageInvocation(receipt, TOKEN)).toEqual({ status: 'accepted', reasons: [] });
  });

  it('leaves a missing, delayed, converging, or pre-invocation replacement owner unclaimed', async () => {
    let calls = 0;
    installOwner(() => { calls++; return true; }, { persistenceReady: false });
    expect(assessStoredV4StageInvocation(await invoke(), TOKEN).status).toBe('unclaimed');
    installOwner(() => { calls++; return true; }, { readyState: 'loading' });
    expect(assessStoredV4StageInvocation(await invoke(), TOKEN).status).toBe('unclaimed');
    installOwner(() => { calls++; return true; }, { convergenceReloadScheduled: true });
    expect(assessStoredV4StageInvocation(await invoke(), TOKEN).status).toBe('unclaimed');
    installOwner(() => { calls++; return true; }, { documentToken: 'replacement-owner' });
    expect(assessStoredV4StageInvocation(await invoke(), TOKEN).status).toBe('unclaimed');
    installOwner(() => { calls++; return true; }, {
      persistenceHold: 'transient-read', mutationBlocked: true,
    });
    expect(assessStoredV4StageInvocation(await invoke(), TOKEN).status).toBe('unclaimed');
    installOwner(() => { calls++; return true; }, {
      persistenceHold: 'protected-payload', mutationBlocked: true,
    });
    const wrongHold = await invoke('{"v":4}', undefined, TOKEN, [null]);
    expect(assessStoredV4StageInvocation(wrongHold, TOKEN, [null]).status).toBe('unclaimed');
    installOwner(() => { calls++; return true; }, {
      persistenceHold: null, mutationBlocked: true,
    });
    const blockedWithoutHold = await invoke('{"v":4}', undefined, TOKEN, [null]);
    expect(assessStoredV4StageInvocation(blockedWithoutHold, TOKEN, [null])).toMatchObject({
      status: 'unclaimed', reasons: ['writable hold authority'],
    });
    installOwner(() => { calls++; return true; }, {
      persistenceHold: null, mutationBlocked: false,
    });
    const writableUnderProtectedPolicy = await invoke(
      '{"v":4}', undefined, TOKEN, ['protected-payload'],
    );
    expect(assessStoredV4StageInvocation(
      writableUnderProtectedPolicy, TOKEN, ['protected-payload'],
    ).status).toBe('unclaimed');
    installOwner(() => { calls++; return true; }, {
      persistenceHold: 'protected-payload', mutationBlocked: false,
    });
    const falseProtectedAuthority = await invoke(
      '{"v":4}', undefined, TOKEN, ['protected-payload'],
    );
    expect(assessStoredV4StageInvocation(
      falseProtectedAuthority, TOKEN, ['protected-payload'],
    )).toMatchObject({ status: 'unclaimed', reasons: ['protected hold authority'] });
    Object.defineProperty(globalThis, 'window', { configurable: true, value: {} });
    expect(assessStoredV4StageInvocation(await invoke(), TOKEN).status).toBe('unclaimed');
    expect(calls).toBe(0);
  });

  it('rejects replacement during one asynchronous settlement without retrying', async () => {
    let calls = 0;
    let release!: () => void;
    installOwner(async () => { calls++; await new Promise<void>((resolve) => { release = resolve; }); return true; });
    const pending = invoke();
    await Promise.resolve();
    installOwner(() => true, { documentToken: 'replacement-owner' });
    release();
    const receipt = await pending;
    expect(calls).toBe(1);
    expect(assessStoredV4StageInvocation(receipt, TOKEN)).toEqual({
      status: 'rejected', reasons: ['settlement owner'],
    });
  });

  it('rejects one false or throwing hook result', async () => {
    installOwner(() => false, { persistenceHold: 'protected-payload', mutationBlocked: true });
    expect(assessStoredV4StageInvocation(await invoke(), TOKEN)).toEqual({
      status: 'rejected', reasons: ['hook rejected'],
    });
    installOwner(() => { throw new Error('stage exploded'); }, {
      persistenceHold: 'protected-payload', mutationBlocked: true,
    });
    expect(assessStoredV4StageInvocation(await invoke(), TOKEN)).toEqual({
      status: 'rejected', reasons: ['hook rejected', 'hook threw'],
    });
  });

  it('turns wrong-token, API-guard, and delayed-publication bypass mutants red', async () => {
    let calls = 0;
    installOwner(() => { calls++; return true; }, { documentToken: 'replacement-owner' });
    const wrongTokenMutant = buildStoredV4StageInvocationExpression('{"v":4}', undefined, TOKEN)
      .replace('before.documentToken===expectedToken&&', '');
    expect(wrongTokenMutant).not.toBe(buildStoredV4StageInvocationExpression('{"v":4}', undefined, TOKEN));
    const wrongTokenReceipt = await invokeExpression(wrongTokenMutant);
    expect(calls).toBe(1);
    expect(assessStoredV4StageInvocation(wrongTokenReceipt, TOKEN)).toEqual({
      status: 'rejected', reasons: ['invocation owner', 'settlement owner'],
    });

    installOwner(() => { calls++; return true; }, { readyState: 'loading' });
    const delayedPublicationMutant = buildStoredV4StageInvocationExpression('{"v":4}', undefined, TOKEN)
      .replace("before.readyState==='complete'&&", '');
    const delayedReceipt = await invokeExpression(delayedPublicationMutant);
    expect(calls).toBe(2);
    expect(assessStoredV4StageInvocation(delayedReceipt, TOKEN)).toEqual({
      status: 'rejected', reasons: ['invocation owner', 'settlement owner'],
    });

    Object.defineProperty(globalThis, 'document', {
      configurable: true, value: { readyState: 'complete' },
    });
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { __CF_SLICE__: {
        documentToken: TOKEN,
        api: { state: () => ({ persistence: {
          ready: true, hold: null, mutationBlocked: false, convergenceReloadScheduled: false,
        } }) },
      } },
    });
    const apiGuardMutant = buildStoredV4StageInvocationExpression('{"v":4}', undefined, TOKEN)
      .replace('before.stageHookPresent===true&&', '');
    const apiGuardReceipt = await invokeExpression(apiGuardMutant);
    expect(assessStoredV4StageInvocation(apiGuardReceipt, TOKEN)).toEqual({
      status: 'rejected',
      reasons: ['invocation owner', 'settlement owner', 'hook rejected', 'hook threw'],
    });
    expect(calls).toBe(2);
  });

  it('executes the missing-owner → stable replacement → unclaimed → accepted driver sequence', async () => {
    let candidate: string | null = null;
    const missing = ownerObservation({
      documentToken: null, slicePresent: false, apiPresent: false,
      stageHookPresent: false, persistenceReady: false, persistenceHold: 'missing',
      mutationBlocked: null, convergenceReloadScheduled: null,
    });
    const successorA = ownerObservation({ documentToken: 'successor-a' });
    const successorB = ownerObservation({ documentToken: 'successor-b' });
    for (const observation of [missing, successorA, successorA]) {
      const step: StageStabilityStep = advanceStoredV4StageOwnerStability(
        candidate, observation, [null],
      );
      candidate = step.candidateToken;
      if (observation !== successorA || step.status !== 'ready') {
        expect(step.readyToken).toBeNull();
      }
    }
    expect(advanceStoredV4StageOwnerStability('successor-a', successorA, [null])).toMatchObject({
      status: 'ready', readyToken: 'successor-a',
    });

    let calls = 0;
    installOwner(() => { calls++; return true; }, { documentToken: 'successor-b' });
    const unclaimed = await invoke('{"v":4}', undefined, 'successor-a', [null]);
    const unclaimedAssessment = assessStoredV4StageInvocation(unclaimed, 'successor-a', [null]);
    expect(calls).toBe(0);
    expect(storedV4StageContinuationDecision(unclaimedAssessment)).toEqual({
      kind: 'rebind', reason: 'zero-call',
    });

    candidate = null;
    let rebound: StageStabilityStep = advanceStoredV4StageOwnerStability(
      candidate, successorB, [null],
    );
    candidate = rebound.candidateToken;
    expect(rebound.readyToken).toBeNull();
    rebound = advanceStoredV4StageOwnerStability(candidate, successorB, [null]);
    expect(rebound.readyToken).toBe('successor-b');
    const accepted = await invoke('{"v":4}', undefined, 'successor-b', [null]);
    const acceptedAssessment = assessStoredV4StageInvocation(accepted, 'successor-b', [null]);
    expect(calls).toBe(1);
    expect(storedV4StageContinuationDecision(acceptedAssessment)).toEqual({
      kind: 'accept', reason: 'exact-receipt',
    });
    expect(storedV4StageContinuationDecision({ status: 'rejected' })).toEqual({
      kind: 'stop', reason: 'rejected',
    });
    expect(storedV4StageContinuationDecision(null, 'context destroyed')).toEqual({
      kind: 'stop', reason: 'ambiguous-dispatch',
    });
  });

  it('resets a candidate across a non-ready turn and restarts on a different token', () => {
    const successorA = ownerObservation({ documentToken: 'successor-a' });
    const successorB = ownerObservation({ documentToken: 'successor-b' });
    const loadingA = ownerObservation({ documentToken: 'successor-a', readyState: 'loading' });
    const firstA = advanceStoredV4StageOwnerStability(null, successorA, [null]);
    expect(firstA).toMatchObject({
      status: 'pending', candidateToken: 'successor-a', readyToken: null,
    });
    const reset = advanceStoredV4StageOwnerStability(firstA.candidateToken, loadingA, [null]);
    expect(reset).toMatchObject({ status: 'pending', candidateToken: null, readyToken: null });
    expect(advanceStoredV4StageOwnerStability(reset.candidateToken, successorA, [null])).toMatchObject({
      status: 'pending', candidateToken: 'successor-a', readyToken: null,
    });
    const switched = advanceStoredV4StageOwnerStability('successor-a', successorB, [null]);
    expect(switched).toMatchObject({
      status: 'pending', candidateToken: 'successor-b', readyToken: null,
    });
    expect(advanceStoredV4StageOwnerStability(switched.candidateToken, successorB, [null])).toMatchObject({
      status: 'ready', candidateToken: 'successor-b', readyToken: 'successor-b',
    });
  });

  it('validates raw, backup, expected token, and exact receipt identity', async () => {
    expect(() => buildStoredV4StageInvocationExpression(4, undefined, TOKEN)).toThrow(/raw/);
    expect(() => buildStoredV4StageInvocationExpression('{}', 4, TOKEN)).toThrow(/backup/);
    expect(() => buildStoredV4StageInvocationExpression(null, '{}', TOKEN)).toThrow(/backup requires/);
    expect(() => buildStoredV4StageInvocationExpression('{}', undefined, '')).toThrow(/expected token/);
    expect(() => buildStoredV4StageInvocationExpression('{}', undefined, TOKEN, [])).toThrow(/allowed holds/);
    expect(() => buildStoredV4StageInvocationExpression('{}', undefined, TOKEN, ['transient-read'])).toThrow(/allowed holds/);
    expect(() => assessStoredV4StageInvocation({}, '')).toThrow(/expected token/);
    expect(() => storedV4StageContinuationDecision(null, 4)).toThrow(/dispatch error/);
    installOwner(() => true);
    const receipt = await invoke();
    expect(assessStoredV4StageInvocation({ ...receipt, extra: true }, TOKEN).status).toBe('invalid');
    expect(assessStoredV4StageInvocation(receipt, 'wrong-token').status).toBe('invalid');
    expect(assessStoredV4StageInvocation({ ...receipt, hookCalls: 2 }, TOKEN).status).toBe('invalid');
  });
});
