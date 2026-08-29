import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { containBiomeVistaWorkerErrorV1 } from '../apps/game/src/biome-vista-worker-error.js';

const MAIN_SOURCE = readFileSync(fileURLToPath(
  new URL('../apps/game/src/main.ts', import.meta.url),
), 'utf8');

function productionWiringErrors(source: string): string[] {
  const required = [
    "from './biome-vista-worker-error.js'",
    "worker.addEventListener('error', (event) => {",
    'containBiomeVistaWorkerErrorV1(event, {',
    'noteFault: () => { surfaceVistaFaults++; },',
    'finish: finishWorker,',
  ];
  return required.filter((token) => !source.includes(token));
}

describe('biome vista Worker error containment', () => {
  it('prevents the uncaught default, records one current fault, and always finishes', () => {
    const event = new Event('error', { cancelable: true });
    const noteFault = vi.fn();
    const finish = vi.fn();

    containBiomeVistaWorkerErrorV1(event, {
      stale: () => false,
      noteFault,
      finish,
    });

    expect(event.defaultPrevented).toBe(true);
    expect(noteFault).toHaveBeenCalledOnce();
    expect(finish).toHaveBeenCalledOnce();
  });

  it('suppresses stale fault accounting but still contains and finishes the event', () => {
    const event = new Event('error', { cancelable: true });
    const noteFault = vi.fn();
    const finish = vi.fn();

    containBiomeVistaWorkerErrorV1(event, {
      stale: () => true,
      noteFault,
      finish,
    });

    expect(event.defaultPrevented).toBe(true);
    expect(noteFault).not.toHaveBeenCalled();
    expect(finish).toHaveBeenCalledOnce();
  });

  it('finishes even when fault bookkeeping throws', () => {
    const event = new Event('error', { cancelable: true });
    const finish = vi.fn();

    expect(() => containBiomeVistaWorkerErrorV1(event, {
      stale: () => false,
      noteFault: () => { throw new Error('diagnostics unavailable'); },
      finish,
    })).toThrow('diagnostics unavailable');
    expect(event.defaultPrevented).toBe(true);
    expect(finish).toHaveBeenCalledOnce();
  });

  it('wires the contained outcome into the live Worker owner and negative-controls each edge', () => {
    expect(productionWiringErrors(MAIN_SOURCE)).toEqual([]);
    for (const token of [
      "worker.addEventListener('error', (event) => {",
      'containBiomeVistaWorkerErrorV1(event, {',
      'noteFault: () => { surfaceVistaFaults++; },',
      'finish: finishWorker,',
    ]) {
      expect(productionWiringErrors(MAIN_SOURCE.replace(token, '/* removed */')), token)
        .toContain(token);
    }
  });
});
