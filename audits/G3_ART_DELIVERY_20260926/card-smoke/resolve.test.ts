// Card-smoke helper (not a gate): picks procedural fauna genomes (derived from the veteran_rich fixture's first fauna entry) that the
// REAL card resolver (paintedArtV2 over the card registry) draws with a LIBRARY painting, and reports each one's CORE fallback (the same
// resolver over the core set only — what painted-card-source.ts draws when the library is refused). Output: seeded-genomes.json.
// Run: port/v2/node_modules/.bin/vitest run --root audits/G3_ART_DELIVERY_20260926/card-smoke resolve.test.ts
import { test, expect } from 'vitest';
import fs from 'node:fs';
import { proceduralFamilyV1 } from '../../../port/v2/apps/game/src/morph/painted-stand-in.ts';
import { paintedArtV2, PAINTED_TRAITS, TRAIT_SKIN, TRAIT_SIZE, TRAIT_TAIL } from '../../../port/v2/apps/game/src/morph/painted-variants.ts';
import { BATTLE2_PARTS_FITS } from '../../../port/v2/apps/game/src/battle2-archetypes.ts';
import { CARD_ARCHETYPES } from '../../../port/v2/apps/game/src/morph/card-archetypes.ts';
test('pick library-drawn genomes', () => {
  const lib = new Set((BATTLE2_PARTS_FITS as any[]).filter((a) => a.library).map((a) => a.earthName));
  const names = new Set((CARD_ARCHETYPES as any[]).map((a) => a.earthName));
  const core = new Set([...names].filter((n) => !lib.has(n)));
  const fx = JSON.parse(fs.readFileSync(new URL('../../../port/baseline-v1.8.9/save-fixtures.json', import.meta.url), 'utf8')).inputs.veteran_rich;
  const base = fx.codex[0].g, targets = ['Wolf', 'Cougar', 'Pike', 'Racer', 'Civet'], picked: any[] = [];
  for (const [ti, target] of targets.entries()) {
    const t = (PAINTED_TRAITS as any)[target], skin = TRAIT_SKIN.indexOf(t.skin), size = TRAIT_SIZE.indexOf(t.size), tail = TRAIT_TAIL.indexOf(t.tail);
    search: for (let seed = 5000 + 100 * ti; seed < 5040 + 100 * ti; seed++) for (let body = 0; body < 16; body++) for (let limbs = 0; limbs < 8; limbs++) for (let loco = 0; loco < 20; loco++) for (const habitat of [13, 0, 3, 6]) {
      const g = { ...base, seed, body, limbs, skin, size, tail, loco, habitat };
      const s = paintedArtV2(g, names); if (!s || s.earthName !== target) continue;
      const f = paintedArtV2(g, core); if (!f) continue;
      picked.push({ target, library: lib.has(target), family: proceduralFamilyV1(g), art: s, coreFallback: f.earthName, g }); break search; }
  }
  const rows = fx.codex.map((c: any) => ({ seed: c.g.seed, art: paintedArtV2(c.g, names) }));
  const out = { library: [...lib].filter((n) => names.has(n)), core: [...core], fixtureRows: rows, picked };
  fs.writeFileSync(new URL('./seeded-genomes.json', import.meta.url), JSON.stringify(out, null, 1) + '\n');
  console.log(JSON.stringify(picked.map((p) => [p.target, p.family, p.art.kind, p.coreFallback, p.g.seed, p.g.body, p.g.limbs])));
  expect(picked.length).toBe(targets.length);
});
