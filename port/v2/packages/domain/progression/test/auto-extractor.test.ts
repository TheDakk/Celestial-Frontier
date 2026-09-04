import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  AUTO_EXTRACTOR_CADENCE_MS,
  AUTO_EXTRACTOR_CURSOR_SCHEMA,
  AUTO_EXTRACTOR_MAX_LOADS,
  activateAutoExtractor,
  decodeAutoExtractorCursors,
  encodeAutoExtractorCursors,
  initializeAutoExtractorWorld,
  loadAutoExtractorCursors,
  migrateLegacyAutoExtractorCursors,
  settleAutoExtractorAtWorld,
} from '@cf/domain-progression';

const CADENCE = AUTO_EXTRACTOR_CADENCE_MS;

describe('@cf/domain-progression — D-CURSOR Auto-Extractor', () => {
  it('migrates absent legacy wall-clock anchors at current active play with zero retroactive grant', () => {
    const activePlayMs = 7_000_000;
    const ordinary = migrateLegacyAutoExtractorCursors([
      [424242, 1_700_000_000_000],
      [133, 1_600_000_000_000],
    ], activePlayMs);
    const clockWound = migrateLegacyAutoExtractorCursors([
      [424242, Number.MAX_SAFE_INTEGER],
      [133, -Number.MAX_SAFE_INTEGER],
    ], activePlayMs);
    expect(clockWound).toEqual(ordinary);
    expect(ordinary).toEqual({
      schema: AUTO_EXTRACTOR_CURSOR_SCHEMA,
      worlds: [
        { planetSeed: 133, collectedThroughActivePlayMs: activePlayMs },
        { planetSeed: 424242, collectedThroughActivePlayMs: activePlayMs },
      ],
    });
    expect(settleAutoExtractorAtWorld(ordinary, 133, activePlayMs)).toMatchObject({
      loads: 0, matured: 0, discarded: 0, capped: false,
    });
    expect(loadAutoExtractorCursors(undefined, [[133, 0]], activePlayMs)).toMatchObject({
      kind: 'migrated',
      state: { worlds: [{ planetSeed: 133, collectedThroughActivePlayMs: activePlayMs }] },
    });
    const encoded = encodeAutoExtractorCursors(ordinary);
    expect(loadAutoExtractorCursors(encoded, [[9, Number.MAX_SAFE_INTEGER]], activePlayMs))
      .toEqual(loadAutoExtractorCursors(encoded, [[10, -Number.MAX_SAFE_INTEGER]], activePlayMs));
  });

  it('grants one load per exact cadence and advances only the visited planet seed', () => {
    const initial = migrateLegacyAutoExtractorCursors([[134, 99], [133, 88]], 100);
    expect(settleAutoExtractorAtWorld(initial, 133, 100 + CADENCE - 1)).toMatchObject({
      planetSeed: 133, loads: 0, matured: 0,
    });
    const earth = settleAutoExtractorAtWorld(initial, 133, 100 + CADENCE);
    expect(earth).toMatchObject({ planetSeed: 133, loads: 1, matured: 1, discarded: 0, capped: false });
    expect(earth.state.worlds).toEqual([
      { planetSeed: 133, collectedThroughActivePlayMs: 100 + CADENCE },
      { planetSeed: 134, collectedThroughActivePlayMs: 100 },
    ]);
    expect(settleAutoExtractorAtWorld(earth.state, 133, 100 + CADENCE)).toMatchObject({
      loads: 0, matured: 0, discarded: 0,
    });
    expect(settleAutoExtractorAtWorld(earth.state, 134, 100 + CADENCE)).toMatchObject({
      loads: 1, matured: 1,
    });
  });

  it('consumes a capped backlog once while preserving only the incomplete cadence remainder', () => {
    const initial = migrateLegacyAutoExtractorCursors([[133, 0]], 0);
    const snapshot = (AUTO_EXTRACTOR_MAX_LOADS + 7) * CADENCE + 321;
    const capped = settleAutoExtractorAtWorld(initial, 133, snapshot);
    expect(capped).toMatchObject({
      loads: AUTO_EXTRACTOR_MAX_LOADS,
      matured: AUTO_EXTRACTOR_MAX_LOADS + 7,
      discarded: 7,
      capped: true,
    });
    expect(capped.state.worlds[0]?.collectedThroughActivePlayMs)
      .toBe((AUTO_EXTRACTOR_MAX_LOADS + 7) * CADENCE);
    expect(settleAutoExtractorAtWorld(capped.state, 133, snapshot)).toMatchObject({
      loads: 0, matured: 0, discarded: 0, capped: false,
    });
    expect(settleAutoExtractorAtWorld(capped.state, 133, snapshot + CADENCE - 321)).toMatchObject({
      loads: 1, matured: 1,
    });
  });

  it('registers a newly mined world now and refuses untracked or backward settlements', () => {
    const initial = migrateLegacyAutoExtractorCursors(null, 50);
    const registered = initializeAutoExtractorWorld(initial, 9, 1_000);
    expect(registered.worlds).toEqual([{ planetSeed: 9, collectedThroughActivePlayMs: 1_000 }]);
    expect(initializeAutoExtractorWorld(registered, 9, 1_000)).toEqual(registered);
    expect(() => settleAutoExtractorAtWorld(registered, 10, 1_000)).toThrow(/not tracked/);
    expect(() => settleAutoExtractorAtWorld(registered, 9, 999)).toThrow(/ahead/);
    const encoded = encodeAutoExtractorCursors(registered);
    expect(() => loadAutoExtractorCursors(encoded, [], 999)).toThrow(/ahead/);
  });

  it('reanchors every mined world when the rig is first built so unowned time grants nothing', () => {
    const migratedWhileUnowned = migrateLegacyAutoExtractorCursors([
      [133, Number.MIN_SAFE_INTEGER],
      [424242, Number.MAX_SAFE_INTEGER],
    ], 1_000);
    const buildSnapshot = 1_000 + 50 * CADENCE;
    const activated = activateAutoExtractor(migratedWhileUnowned, buildSnapshot);
    expect(activated.worlds).toEqual([
      { planetSeed: 133, collectedThroughActivePlayMs: buildSnapshot },
      { planetSeed: 424242, collectedThroughActivePlayMs: buildSnapshot },
    ]);
    expect(settleAutoExtractorAtWorld(activated, 133, buildSnapshot)).toMatchObject({
      loads: 0, matured: 0, discarded: 0,
    });
    expect(settleAutoExtractorAtWorld(activated, 133, buildSnapshot + CADENCE)).toMatchObject({
      loads: 1, matured: 1, discarded: 0,
    });
    expect(() => activateAutoExtractor(activated, buildSnapshot - 1)).toThrow(/ahead/);
  });

  it('has one finite strict canonical v1 JSON fixed point and rejects duplicate, noncanonical, future, and corrupt state', () => {
    const state = initializeAutoExtractorWorld(
      migrateLegacyAutoExtractorCursors([[20, 123]], 5_000),
      10,
      5_000,
    );
    const encoded = encodeAutoExtractorCursors(state);
    expect(encoded).toBe('{"schema":"cf-v2-auto-extractor-cursors/v1","worlds":[{"planetSeed":10,"collectedThroughActivePlayMs":5000},{"planetSeed":20,"collectedThroughActivePlayMs":5000}]}');
    const decoded = decodeAutoExtractorCursors(encoded);
    expect(encodeAutoExtractorCursors(decoded)).toBe(encoded);
    expect(Object.isFrozen(decoded)).toBe(true);
    expect(Object.isFrozen(decoded.worlds)).toBe(true);
    expect(Object.isFrozen(decoded.worlds[0])).toBe(true);

    const duplicate = JSON.parse(encoded) as { worlds: unknown[] };
    duplicate.worlds.splice(1, 0, duplicate.worlds[0]);
    expect(() => decodeAutoExtractorCursors(JSON.stringify(duplicate))).toThrow(/duplicate/);
    const unsorted = JSON.parse(encoded) as { worlds: unknown[] };
    unsorted.worlds.reverse();
    expect(() => decodeAutoExtractorCursors(JSON.stringify(unsorted))).toThrow(/canonical seed order/);
    const future = JSON.parse(encoded) as { schema: string };
    future.schema = 'cf-v2-auto-extractor-cursors/v2';
    expect(() => decodeAutoExtractorCursors(JSON.stringify(future))).toThrow(/unsupported/);
    const corrupt = JSON.parse(encoded) as Record<string, unknown>;
    corrupt.legacyWallClock = 123;
    expect(() => decodeAutoExtractorCursors(JSON.stringify(corrupt))).toThrow(/unknown or missing/);
    const fractional = JSON.parse(encoded) as { worlds: Array<{ collectedThroughActivePlayMs: number }> };
    fractional.worlds[0]!.collectedThroughActivePlayMs = 1.5;
    expect(() => decodeAutoExtractorCursors(JSON.stringify(fractional))).toThrow(/active-play/);
    expect(() => encodeAutoExtractorCursors({
      schema: AUTO_EXTRACTOR_CURSOR_SCHEMA,
      worlds: [{ planetSeed: 10, collectedThroughActivePlayMs: -0 }],
    })).toThrow(/canonical/);
    expect(() => decodeAutoExtractorCursors(` ${encoded}`)).toThrow(/not canonical/);
    expect(() => decodeAutoExtractorCursors('{')).toThrow(/malformed/);
    expect(() => migrateLegacyAutoExtractorCursors([[133, 1], [133, 2]], 0)).toThrow(/duplicate/);
  });

  it('contains no device clock, ambient monotonic clock, or entropy source', () => {
    const source = readFileSync(fileURLToPath(new URL('../src/auto-extractor.ts', import.meta.url)), 'utf8');
    const forbidden = [/Date\.now\s*\(/, /Math\.random\s*\(/, /\bperformance\b/];
    for (const pattern of forbidden) expect(source).not.toMatch(pattern);
    for (const pattern of forbidden) expect('Date.now(); Math.random(); performance.now()').toMatch(pattern);
  });
});
