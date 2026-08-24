import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  F3_PERSISTENCE_BROWSER_PROBE_STAGE_ORDER,
  f3PersistenceProbeDatabaseName,
  runF3PersistenceBrowserProbe,
} from '../apps/game/src/f3-persistence-browser-probe.js';
import type { ContentRegistry } from '@cf/persistence';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(
  path.join(here, '..', 'apps', 'game', 'src', 'f3-persistence-browser-probe.ts'),
  'utf8',
);

describe('F3 real-browser persistence probe contract', () => {
  it('derives only bounded, explicitly disposable database names', () => {
    expect(f3PersistenceProbeDatabaseName('cf-f3-probe-session_20260824'))
      .toBe('cf-f3-probe-session_20260824-persistence');
    expect(f3PersistenceProbeDatabaseName(`cf-f3-probe-${'a'.repeat(48)}`).length).toBeLessThanOrEqual(80);

    for (const unsafe of [
      '',
      'cf-v2-slice',
      'cf-f3-probe-',
      'cf-f3-probe-UPPER',
      'cf-f3-probe-has space',
      'cf-f3-probe-../escape',
      `cf-f3-probe-${'a'.repeat(49)}`,
    ]) {
      expect(() => f3PersistenceProbeDatabaseName(unsafe), unsafe).toThrow('F3 probe prefix');
    }
  });

  it('is inert on import and publishes one immutable terminal stage order', () => {
    expect(F3_PERSISTENCE_BROWSER_PROBE_STAGE_ORDER).toEqual([
      'legacy-v1-created',
      'repository-v2-upgrade',
      'v4-to-v5-migration',
      'two-backend-cas',
      'checked-transaction-rollback',
      'external-v3-versionchange',
      'cleanup-delete',
    ]);
    expect(Object.isFrozen(F3_PERSISTENCE_BROWSER_PROBE_STAGE_ORDER)).toBe(true);
    expect(typeof runF3PersistenceBrowserProbe).toBe('function');
    expect(source.match(/export async function runF3PersistenceBrowserProbe\s*\(/g)).toHaveLength(1);
    expect(source).not.toMatch(/^\s*(?:void\s+|await\s+)?runF3PersistenceBrowserProbe\s*\(/m);
  });

  it('uses production persistence seams and contains both positive and negative browser controls', () => {
    expect(source).toContain('createIndexedDBBackend(databaseName)');
    expect(source).toContain('createRevisionedRepository(backendA)');
    expect(source).toContain('migrateStoredV4ToV5(backendA, input.registry, input.now)');
    expect(source).toContain('readSaveV5(backendA, input.registry, input.now)');
    expect(source).toContain('backendB.compareAndApply(');
    expect(source).toContain('factory.open(databaseName, 1)');
    expect(source).toContain('upgradeExternally(factory, databaseName, 3, timeoutMs)');
    expect(source).toContain('factory.deleteDatabase(databaseName)');
    expect(source).not.toContain('createMemoryBackend');
    expect(source).not.toMatch(/(?:globalThis|window)\.indexedDB\s*=(?!=)/);
    expect(source).not.toMatch(/fake[-_ ]?indexeddb/i);
  });

  it('fails closed outside a real browser instead of manufacturing IndexedDB evidence in Node', async () => {
    if (typeof window !== 'undefined' && typeof globalThis.indexedDB !== 'undefined') return;
    await expect(runF3PersistenceBrowserProbe({
      dbPrefix: 'cf-f3-probe-node-control',
      legacyV4Raw: '{}',
      registry: {} as ContentRegistry,
      now: 0,
      timeoutMs: 250,
    })).rejects.toThrow('real browser IndexedDB context');
  });
});
