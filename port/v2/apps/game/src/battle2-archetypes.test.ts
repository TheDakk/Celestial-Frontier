/** OUTCOME: every painted archetype can be loaded by the SHIPPED arena — each file the battle2 wiring asks for (record,
 * binding, keyed cut-out, parts manifest, atlas, painter master via the record's source, and the painted masks) exists in
 * `public/battle2/` at the exact path the wiring resolves against the recipe URL. A path bug (an absolute record source, a
 * mask set outside its fit) fails here, not in a playtest. */
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from './battle2/parts-rig.fixtures.js';
import { BATTLE2_PARTS_FITS } from './battle2-archetypes.js';
import { BATTLE2_ASSETS, auditAssetPath } from './battle2-wiring.js';
import { CARD_ARCHETYPES } from './morph/card-archetypes.js';
import { repoRelativeSource } from '../../../tools/creature-animation/record-source.mjs';
const SERVED = new URL('port/v2/apps/game/public/battle2/audits/ARENA_EFFECTS_V42_PROOF_20260912/', REPO_ROOT); // the recipe's directory, as served
const served = (rel: string): URL => new URL(rel, SERVED);
describe('the shipped arena carries every painted archetype', () => {
  it('the arena fit list IS the card list (same archetypes, same order)', () => {
    expect(BATTLE2_ASSETS.partsFits).toBe(BATTLE2_PARTS_FITS);
    expect(BATTLE2_PARTS_FITS.map((f) => f.earthName)).toEqual(CARD_ARCHETYPES.map((a) => a.earthName));
    expect(BATTLE2_PARTS_FITS.length).toBeGreaterThanOrEqual(17);
  });
  it('every file the wiring fetches exists at its served path, and the painted masks ship where they are bound', () => {
    const missing: string[] = []; let masks = 0;
    for (const fit of BATTLE2_PARTS_FITS) {
      const need = (rel: string) => { if (!existsSync(served(rel))) missing.push(`${fit.earthName}: ${rel}`); };
      for (const f of ['record.json', 'binding.json', 'parts/keyed.png', 'parts/manifest.json']) need(fit.dir + f);
      if (!existsSync(served(fit.dir + 'record.json'))) continue;
      const record = JSON.parse(readFileSync(served(fit.dir + 'record.json'), 'utf8')) as { source: string; recipeHash: string }, manifest = JSON.parse(readFileSync(served(fit.dir + 'parts/manifest.json'), 'utf8')) as { creatureId: string };
      need(fit.dir + 'parts/atlas/' + manifest.creatureId + '.png'); need(auditAssetPath(repoRelativeSource(record.source)));
      const mdir = fit.markingsDir ?? fit.dir;
      if (existsSync(served(mdir + 'markings.json'))) { const mj = JSON.parse(readFileSync(served(mdir + 'markings.json'), 'utf8')) as { recordRecipeHash: string; patterns: Record<string, { file: string }> };
        expect(mj.recordRecipeHash, fit.earthName + ': masks sealed for another record').toBe(record.recipeHash);
        for (const v of Object.values(mj.patterns)) { need(mdir + v.file); masks++; } }
    }
    expect(missing).toEqual([]);
    expect(masks).toBeGreaterThanOrEqual(18); // crab + Civet + Salmon × 6 — the Salmon's masks live outside its fit and must still ship
  });
  it('the negative control: an absolute record source only resolves through the shared resolver', () => {
    const abs = '/Users/someone/Projects/celestial-frontier-openai-mac/audits/X/master.png';
    expect(() => auditAssetPath(abs)).toThrow(/not under audits/);
    expect(auditAssetPath(repoRelativeSource(abs))).toBe('../X/master.png');
    expect(() => repoRelativeSource('/etc/passwd')).toThrow(/outside a Celestial Frontier worktree/);
  });
});
