import { describe, it, expect } from 'vitest';
import { createSaveRepository, createMemoryBackend, STORES } from '@cf/persistence';

describe('@cf/persistence — repository + the CF-RR-002 recovery semantics', () => {
  it('write / readPrimary round-trips', async () => {
    const repo = createSaveRepository(createMemoryBackend());
    await repo.write('{"epoch":3}');
    expect(await repo.readPrimary()).toBe('{"epoch":3}');
  });
  it('backup is promoted ONLY explicitly (after a proven load), never at write time', async () => {
    const be = createMemoryBackend();
    const repo = createSaveRepository(be);
    await repo.write('v1');
    /* corrupt the primary before any promotion — nothing to recover */
    await repo.write('###corrupt###');
    expect(await repo.recover()).toBeUndefined();
    /* now a payload proves it loads and is promoted; corruption recovers */
    await repo.write('v2');
    await repo.promoteLastKnownGood('v2');
    await repo.write('###corrupt###');
    expect(await repo.recover()).toBe('v2');
    expect(await repo.readPrimary()).toBe('v2');
  });
  it('recover on a genuinely fresh store is a no-op (no phantom resurrection)', async () => {
    const repo = createSaveRepository(createMemoryBackend());
    expect(await repo.recover()).toBeUndefined();
  });
  it('★ THE RESET LAW: primary AND backup die together — a reset must not resurrect via the backup', async () => {
    /* ⚠ REWRITTEN after its own negative control PASSED while the defect was
       live (2026-07-31): asserting recover()===undefined right after reset is
       VACUOUS — recover() short-circuits on the missing primary and never
       looks at the backup, so a surviving backup was invisible to it. The
       REAL resurrection scenario is: reset → NEW expedition writes → that
       write corrupts → recovery must NOT dig up the pre-reset save. Assert
       through that path — the scenario CF-RR-002's reset law exists for. */
    const repo = createSaveRepository(createMemoryBackend());
    await repo.write('real progress');
    await repo.promoteLastKnownGood('real progress');
    await repo.reset();
    expect(await repo.readPrimary()).toBeUndefined();
    await repo.write('###corrupt new expedition###');
    expect(await repo.recover(), 'a pre-reset save resurrected through recovery').toBeUndefined();
    expect(await repo.readPrimary()).toBe('###corrupt new expedition###');
  });
  it('apply() is atomic: a staged batch lands whole', async () => {
    const be = createMemoryBackend();
    await be.apply([
      { store: 'player', key: 'a', value: '1' },
      { store: 'player', key: 'b', value: '2' },
      { store: 'settings', key: 'vol', value: '0.8' },
    ]);
    expect(await be.keys('player')).toEqual(['a', 'b']);
    expect(await be.get('settings', 'vol')).toBe('0.8');
  });
  it('the §19.3 store set is complete, incl. the disposable asset cache', () => {
    expect([...STORES]).toEqual(['meta', 'player', 'creatures', 'catalog', 'inventory', 'settings', 'journal', 'assetcache']);
  });
});
