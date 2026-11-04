/** D55: the per-creature battery's roster. Everyday (dev/develop): every hand-listed archetype and at least one archetype of every
 * body family; library (CF_V2_LIBRARY_ROSTER=all): every archetype. (Profile wiring: tests/library-profile.test.ts.) */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BATTLE2_PARTS_FITS } from './battle2-archetypes.js';
import { CARD_ARCHETYPES } from './morph/card-archetypes.js';
import { LIBRARY_ROSTER, ROSTER_ARCHETYPES, rosterBudget, rosterNamesV1 } from './test-roster.fixtures.js';

const delivered = new Set((JSON.parse(readFileSync(new URL('../../../tools/morph/delivered-archetypes.json', import.meta.url), 'utf8')) as { rows: { earthName: string }[] }).rows.map((r) => r.earthName));
describe('D55 test roster', () => {
  it('everyday: every hand-listed archetype and every body family; library: every archetype', () => {
    const everyday = rosterNamesV1(false), all = rosterNamesV1(true);
    expect([...all].sort()).toEqual(CARD_ARCHETYPES.map((a) => a.earthName).sort());
    for (const a of CARD_ARCHETYPES) if (!delivered.has(a.earthName)) expect(everyday.has(a.earthName), a.earthName).toBe(true);
    const families = new Set(BATTLE2_PARTS_FITS.map((f) => f.bodyFamily)), covered = new Set(BATTLE2_PARTS_FITS.filter((f) => everyday.has(f.earthName)).map((f) => f.bodyFamily));
    expect([...covered].sort()).toEqual([...families].sort());
    if (delivered.size > families.size) expect(everyday.size).toBeLessThan(all.size); // the everyday gate is bounded
    expect(ROSTER_ARCHETYPES.length).toBe((LIBRARY_ROSTER ? all : everyday).size);
    expect(rosterBudget(300_000)).toBe(LIBRARY_ROSTER ? Math.ceil(300_000 * Math.max(1, all.size / everyday.size)) : 300_000);
  });
});
