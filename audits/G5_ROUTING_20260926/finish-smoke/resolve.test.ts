// Finish-smoke helper (not a gate): picks a procedural fauna genome (derived from the veteran_rich fixture's first fauna entry) that
// the REAL resolver (paintedArtV2) draws with the core `Crab` painting under BOTH name sets the game uses: the Compendium card
// registry (CARD_ARCHETYPES) and the finisher's fit registry (BATTLE2_PARTS_FITS, which also holds the four library crabs).
// Output: crab-genome.json. Run: port/v2/node_modules/.bin/vitest run --root audits/G5_ROUTING_20260926/finish-smoke resolve.test.ts
import { test, expect } from 'vitest';
import fs from 'node:fs';
import { proceduralFamilyV1 } from '../../../port/v2/apps/game/src/morph/painted-stand-in.ts';
import { paintedArtV2, PAINTED_TRAITS, TRAIT_SKIN, TRAIT_SIZE, TRAIT_TAIL } from '../../../port/v2/apps/game/src/morph/painted-variants.ts';
import { BATTLE2_PARTS_FITS } from '../../../port/v2/apps/game/src/battle2-archetypes.ts';
import { CARD_ARCHETYPES } from '../../../port/v2/apps/game/src/morph/card-archetypes.ts';
test('pick a Crab-drawn genome', () => {
  const fits = new Set((BATTLE2_PARTS_FITS as any[]).map((a) => a.earthName)), cards = new Set((CARD_ARCHETYPES as any[]).map((a) => a.earthName));
  const fx = JSON.parse(fs.readFileSync(new URL('../../../port/baseline-v1.8.9/save-fixtures.json', import.meta.url), 'utf8')).inputs.veteran_rich;
  const base = fx.codex[0].g, t = (PAINTED_TRAITS as any).Crab, skin = TRAIT_SKIN.indexOf(t.skin), size = TRAIT_SIZE.indexOf(t.size), tail = TRAIT_TAIL.indexOf(t.tail);
  let picked: any = null;
  search: for (let seed = 7000; seed < 7040; seed++) for (let body = 0; body < 16; body++) for (let limbs = 0; limbs < 8; limbs++) for (let loco = 0; loco < 20; loco++) for (const habitat of [13, 0, 3, 6]) {
    const g = { ...base, seed, body, limbs, skin, size, tail, loco, habitat };
    const c = paintedArtV2(g, cards), f = paintedArtV2(g, fits); if (c?.earthName !== 'Crab' || f?.earthName !== 'Crab') continue;
    picked = { family: proceduralFamilyV1(g), card: c, fit: f, g }; break search; }
  fs.writeFileSync(new URL('./crab-genome.json', import.meta.url), JSON.stringify(picked, null, 1) + '\n');
  console.log(JSON.stringify(picked && { family: picked.family, card: picked.card, fit: picked.fit, seed: picked.g.seed }));
  expect(picked).not.toBeNull();
});
