import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { hdGenesFor } from '@cf/domain-strays';

/* hdGenesFor's two `_earthArt` branches were cut from strays.verbatim.js (task m3a-6b). In the
   current game `_earthArt` is a free global nothing defines, so those branches never changed a
   result. This pins the cut itself: even if someone installs an `_earthArt` global that returns
   a recipe, an Earth-named or Earth-blended genome gets the same genes as without it. */
interface Row { genome: Record<string, unknown> }
const fixture = JSON.parse(
  readFileSync(new URL('../../../../fixtures/current/strays.json', import.meta.url), 'utf8'),
) as { earthNamed: Row[]; blends: Row[] };

const scope = globalThis as Record<string, unknown>;
afterEach(() => { delete scope._earthArt; });

describe('@cf/domain-strays — hdGenesFor no longer reads _earthArt', () => {
  it('an installed _earthArt does not change the genes of Earth-named or blended genomes', () => {
    const genomes = [...fixture.earthNamed.slice(0, 4), ...fixture.blends.slice(0, 4)].map((row) => row.genome);
    expect(genomes.filter((g) => g._earthName)).toHaveLength(4);
    expect(genomes.filter((g) => g._earthBlend)).toHaveLength(4);
    const without = genomes.map((g) => hdGenesFor(structuredClone(g)));
    let lookups = 0;
    scope._earthArt = () => {
      lookups++;
      return { airb: true, aqua: true, base: [1, 2, 3], stripes: 1, mottle: 1 };
    };
    const withLookup = genomes.map((g) => hdGenesFor(structuredClone(g)));
    expect(lookups).toBe(0);
    expect(withLookup).toEqual(without);
  });
});
