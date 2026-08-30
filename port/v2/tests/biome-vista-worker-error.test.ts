import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import {
  biomeVistaWorkerResponseDispositionV1,
  biomeVistaWorkerResponseIdentityMatchesV1,
  containBiomeVistaWorkerErrorV1,
  type BiomeVistaWorkerResponseIdentityV1,
} from '../apps/game/src/biome-vista-worker-error.js';

const MAIN_SOURCE = readFileSync(fileURLToPath(
  new URL('../apps/game/src/main.ts', import.meta.url),
), 'utf8');

function productionWiringErrors(source: string): string[] {
  const required = [
    "from './biome-vista-worker-error.js'",
    'biomeVistaWorkerResponseIdentityMatchesV1,',
    "worker.addEventListener('error', (event) => {",
    'containBiomeVistaWorkerErrorV1(event, {',
    "noteFault: () => noteSurfaceVistaFault(event.message, 'biome vista worker error event'),",
    'finish: finishWorker,',
    'const disposition = biomeVistaWorkerResponseDispositionV1(stale(), identityMatches);',
    "else noteSurfaceVistaFault(null, 'biome vista worker response authority mismatch');",
    'surfaceVistaLastError = (raw.trim() || fallback).slice(0, 512);',
    'surfaceVistaLastError,',
    "noteSurfaceVistaFault(response.message, 'biome vista worker render failed');",
  ];
  return required.filter((token) => !source.includes(token));
}

function responseIdentityBindingErrors(source: string): string[] {
  const start = source.indexOf('function requestSurfaceVista(');
  const end = source.indexOf('\nfunction clearWorld(', start);
  const owner = start >= 0 && end > start ? source.slice(start, end) : '';
  const identityStart = owner.indexOf(
    'const identityMatches = biomeVistaWorkerResponseIdentityMatchesV1(response, {',
  );
  const identityEnd = owner.indexOf('\n    });', identityStart);
  const identity = identityStart >= 0 && identityEnd > identityStart
    ? owner.slice(identityStart, identityEnd)
    : '';
  const bindings = [
    'const identityMatches = biomeVistaWorkerResponseIdentityMatchesV1(response, {',
    'documentToken: DOCUMENT_TOKEN,',
    'generation: generation,',
    'worldKey: request.worldKey,',
    'environmentFingerprint: request.environmentFingerprint,',
    'profileSchema: request.profileSchema,',
    'profileDigest: request.profileDigest,',
  ];
  return bindings.filter((binding) => identity.split(binding).length - 1 !== 1);
}

describe('biome vista Worker error containment', () => {
  it('distinguishes stale work from a current response with mismatched authority', () => {
    expect(biomeVistaWorkerResponseDispositionV1(false, true)).toBe('current');
    expect(biomeVistaWorkerResponseDispositionV1(true, true)).toBe('stale');
    expect(biomeVistaWorkerResponseDispositionV1(true, false)).toBe('stale');
    expect(biomeVistaWorkerResponseDispositionV1(false, false)).toBe('fault');
  });

  it('binds a response to all six current-worker authority fields', () => {
    const expected: BiomeVistaWorkerResponseIdentityV1 = Object.freeze({
      documentToken: 'document-a',
      generation: 7,
      worldKey: 'cf1:999:90:-60:424242:133',
      environmentFingerprint: 'environment-a',
      profileSchema: 'cf-v2-biome-vista-profile/v1',
      profileDigest: 'digest-a',
    });
    expect(biomeVistaWorkerResponseIdentityMatchesV1(expected, expected)).toBe(true);

    for (const [field, mismatch] of [
      ['documentToken', 'document-b'],
      ['generation', 8],
      ['worldKey', 'cf1:999:90:-60:424242:134'],
      ['environmentFingerprint', 'environment-b'],
      ['profileSchema', 'cf-v2-biome-vista-profile/v2'],
      ['profileDigest', 'digest-b'],
    ] as const) {
      const observed = { ...expected, [field]: mismatch } as BiomeVistaWorkerResponseIdentityV1;
      expect(biomeVistaWorkerResponseIdentityMatchesV1(observed, expected), field).toBe(false);
    }
  });

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
      "noteFault: () => noteSurfaceVistaFault(event.message, 'biome vista worker error event'),",
      'finish: finishWorker,',
      'const disposition = biomeVistaWorkerResponseDispositionV1(stale(), identityMatches);',
      "else noteSurfaceVistaFault(null, 'biome vista worker response authority mismatch');",
      'surfaceVistaLastError = (raw.trim() || fallback).slice(0, 512);',
      'surfaceVistaLastError,',
      "noteSurfaceVistaFault(response.message, 'biome vista worker render failed');",
    ]) {
      expect(productionWiringErrors(MAIN_SOURCE.replace(token, '/* removed */')), token)
        .toContain(token);
    }
  });

  it('wires every response-identity field into the live Worker owner with scoped controls', () => {
    expect(responseIdentityBindingErrors(MAIN_SOURCE)).toEqual([]);
    for (const token of [
      'const identityMatches = biomeVistaWorkerResponseIdentityMatchesV1(response, {',
      'documentToken: DOCUMENT_TOKEN,',
      'generation: generation,',
      'worldKey: request.worldKey,',
      'environmentFingerprint: request.environmentFingerprint,',
      'profileSchema: request.profileSchema,',
      'profileDigest: request.profileDigest,',
    ]) {
      const start = MAIN_SOURCE.indexOf('function requestSurfaceVista(');
      const end = MAIN_SOURCE.indexOf('\nfunction clearWorld(', start);
      const owner = MAIN_SOURCE.slice(start, end);
      const mutated = MAIN_SOURCE.slice(0, start)
        + owner.replace(token, '/* removed by mutation control */')
        + MAIN_SOURCE.slice(end);
      expect(mutated, token).not.toBe(MAIN_SOURCE);
      expect(responseIdentityBindingErrors(mutated), token).toContain(token);
    }
  });
});
