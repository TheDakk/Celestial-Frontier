/* A guard for tests that prove a gameplay function takes its clock and random source only from its
   caller: inside it, Math.random, Date.now, performance.now and `new Date` each throw. */
import { vi } from 'vitest';

/** Run `fn` with every ambient clock and random source replaced by one that throws. */
export function withoutAmbientSources<T>(fn: () => T): T {
  const RealDate = globalThis.Date;
  const refuse = (name: string) => () => { throw new Error(`ambient ${name} was read`); };
  const spies = [
    vi.spyOn(Math, 'random').mockImplementation(refuse('Math.random')),
    vi.spyOn(RealDate, 'now').mockImplementation(refuse('Date.now')),
    vi.spyOn(performance, 'now').mockImplementation(refuse('performance.now')),
  ];
  globalThis.Date = new Proxy(RealDate, { construct: refuse('new Date') }) as DateConstructor;
  try {
    return fn();
  } finally {
    globalThis.Date = RealDate;
    for (const spy of spies) spy.mockRestore();
  }
}

/** Each ambient read, for proving the guard: every one must throw inside `withoutAmbientSources`. */
export const AMBIENT_READS: readonly (() => unknown)[] = [() => Math.random(), () => Date.now(), () => performance.now(), () => new Date()];
