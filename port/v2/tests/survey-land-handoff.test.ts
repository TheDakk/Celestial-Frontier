import { describe, expect, it } from 'vitest';

import {
  runSurveyLandHandoffV1,
  type SurveyLandHandoffV1,
} from '../apps/game/src/survey-land-handoff.js';

function deferred(): Readonly<{
  promise: Promise<void>;
  resolve: () => void;
}> {
  let resolvePromise!: () => void;
  const promise = new Promise<void>((resolve) => { resolvePromise = resolve; });
  return Object.freeze({ promise, resolve: resolvePromise });
}

function deferredResult<T>(): Readonly<{
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}> {
  let resolvePromise!: (value: T) => void;
  let rejectPromise!: (reason: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });
  return Object.freeze({ promise, resolve: resolvePromise, reject: rejectPromise });
}

describe('Survey → Landing persistence handoff', () => {
  it('settles the route barrier, Survey, its new barrier, then Landing exactly once', async () => {
    const routeBarrier = deferred();
    const surveyBarrier = deferred();
    const surveySettlement = deferredResult<boolean>();
    const surveyStarted = deferred();
    let currentBarrier = routeBarrier.promise;
    let surveyCalls = 0;
    let landCalls = 0;
    const events: string[] = [];
    const pending = runSurveyLandHandoffV1({
      waitForCurrentBarrier: () => {
        events.push(currentBarrier === routeBarrier.promise ? 'route-barrier' : 'survey-barrier');
        return currentBarrier;
      },
      startSurvey: () => {
        events.push('survey');
        surveyCalls++;
        currentBarrier = surveyBarrier.promise;
        surveyStarted.resolve();
        return surveySettlement.promise;
      },
      land: async () => {
        events.push('land');
        landCalls++;
        return true;
      },
    });

    expect(surveyCalls).toBe(0);
    expect(landCalls).toBe(0);
    routeBarrier.resolve();
    await surveyStarted.promise;
    expect(surveyCalls).toBe(1);
    expect(landCalls).toBe(0);
    expect(events).toEqual(['route-barrier', 'survey', 'survey-barrier']);
    surveySettlement.resolve(true);
    await Promise.resolve();
    expect(landCalls).toBe(0);
    surveyBarrier.resolve();
    await expect(pending).resolves.toBe(true);
    expect(surveyCalls).toBe(1);
    expect(landCalls).toBe(1);
    expect(events).toEqual(['route-barrier', 'survey', 'survey-barrier', 'land']);
  });

  it('stops after a synchronous Survey start refusal and never retries or lands', async () => {
    let waits = 0;
    let surveys = 0;
    let lands = 0;
    await expect(runSurveyLandHandoffV1({
      waitForCurrentBarrier: async () => { waits++; },
      startSurvey: () => { surveys++; return null; },
      land: async () => { lands++; return true; },
    })).resolves.toBe(false);
    expect({ waits, surveys, lands }).toEqual({ waits: 1, surveys: 1, lands: 0 });
  });

  it('drains the Survey barrier but refuses Landing when that exact settlement later returns false', async () => {
    const surveyBarrier = deferred();
    const surveySettlement = deferredResult<boolean>();
    const surveyStarted = deferred();
    let waits = 0;
    let surveys = 0;
    let lands = 0;
    const pending = runSurveyLandHandoffV1({
      waitForCurrentBarrier: () => {
        waits++;
        return waits === 1 ? Promise.resolve() : surveyBarrier.promise;
      },
      startSurvey: () => {
        surveys++;
        surveyStarted.resolve();
        return surveySettlement.promise;
      },
      land: async () => { lands++; return true; },
    });

    await surveyStarted.promise;
    expect({ waits, surveys, lands }).toEqual({ waits: 2, surveys: 1, lands: 0 });
    surveyBarrier.resolve();
    await Promise.resolve();
    expect(lands).toBe(0);
    surveySettlement.resolve(false);
    await expect(pending).resolves.toBe(false);
    expect({ waits, surveys, lands }).toEqual({ waits: 2, surveys: 1, lands: 0 });
  });

  it('allows an exact current/idempotent Survey result to continue to Landing', async () => {
    let waits = 0;
    let surveys = 0;
    let lands = 0;
    await expect(runSurveyLandHandoffV1({
      waitForCurrentBarrier: async () => { waits++; },
      startSurvey: () => { surveys++; return Promise.resolve(true); },
      land: async () => { lands++; return true; },
    })).resolves.toBe(true);
    expect({ waits, surveys, lands }).toEqual({ waits: 2, surveys: 1, lands: 1 });
  });

  it('observes a rejected Survey immediately while still draining its held barrier', async () => {
    const surveyBarrier = deferred();
    const surveySettlement = deferredResult<boolean>();
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown): void => { unhandled.push(reason); };
    process.on('unhandledRejection', onUnhandled);
    try {
      let waits = 0;
      let lands = 0;
      const pending = runSurveyLandHandoffV1({
        waitForCurrentBarrier: () => {
          waits++;
          return waits === 1 ? Promise.resolve() : surveyBarrier.promise;
        },
        startSurvey: () => surveySettlement.promise,
        land: async () => { lands++; return true; },
      });
      const failure = new Error('survey settlement rejected');
      surveySettlement.reject(failure);
      await new Promise<void>((resolve) => { setTimeout(resolve, 0); });
      expect(unhandled).toEqual([]);
      expect({ waits, lands }).toEqual({ waits: 2, lands: 0 });
      surveyBarrier.resolve();
      await expect(pending).rejects.toBe(failure);
      expect(lands).toBe(0);
    } finally {
      process.off('unhandledRejection', onUnhandled);
    }
  });

  it('has independent red controls for either omitted barrier and every retry', async () => {
    type Runner = (input: SurveyLandHandoffV1) => Promise<boolean>;
    const trace = async (runner: Runner, settlement = true): Promise<string[]> => {
      const events: string[] = [];
      await runner({
        waitForCurrentBarrier: async () => { events.push('wait'); },
        startSurvey: () => {
          events.push('survey');
          return Promise.resolve().then(() => {
            events.push('settlement');
            return settlement;
          });
        },
        land: async () => { events.push('land'); return true; },
      });
      return events;
    };
    const expected = ['wait', 'survey', 'wait', 'settlement', 'land'];
    await expect(trace(runSurveyLandHandoffV1)).resolves.toEqual(expected);
    const mutants: readonly Runner[] = Object.freeze([
      async (input) => {
        const settlement = input.startSurvey();
        if (settlement === null) return false;
        await input.waitForCurrentBarrier();
        if (!await settlement) return false;
        return input.land();
      },
      async (input) => {
        await input.waitForCurrentBarrier();
        const settlement = input.startSurvey();
        if (settlement === null || !await settlement) return false;
        return input.land();
      },
      async (input) => {
        await input.waitForCurrentBarrier();
        const first = input.startSurvey();
        const settlement = input.startSurvey();
        if (first === null || settlement === null) return false;
        await input.waitForCurrentBarrier();
        if (!await settlement) return false;
        return input.land();
      },
      async (input) => {
        await input.waitForCurrentBarrier();
        const settlement = input.startSurvey();
        if (settlement === null) return false;
        await input.waitForCurrentBarrier();
        if (!await settlement) return false;
        await input.land();
        return input.land();
      },
    ]);
    for (const mutant of mutants) {
      await expect(trace(mutant)).resolves.not.toEqual(expected);
    }

    const ignoresDurableRefusal: Runner = async (input) => {
      await input.waitForCurrentBarrier();
      const settlement = input.startSurvey();
      if (settlement === null) return false;
      await input.waitForCurrentBarrier();
      void settlement;
      return input.land();
    };
    await expect(trace(runSurveyLandHandoffV1, false)).resolves.toEqual([
      'wait', 'survey', 'wait', 'settlement',
    ]);
    await expect(trace(ignoresDurableRefusal, false)).resolves.toEqual([
      'wait', 'survey', 'wait', 'settlement', 'land',
    ]);
  });
});
