/** OUTCOME: every painted archetype can be loaded by the SHIPPED arena — each file the battle2 wiring asks for (record,
 * binding, alpha-only cut-out, parts manifest, atlas, painter master via the record's source, and the painted masks) exists in
 * `public/battle2/` at the exact path the wiring resolves against the recipe URL. A path bug (an absolute record source, a
 * mask set outside its fit) fails here, not in a playtest. */
import { existsSync, readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from './battle2/parts-rig.fixtures.js';
import { BATTLE2_PARTS_FITS } from './battle2-archetypes.js';
import { BATTLE2_ASSETS, auditAssetPath } from './battle2-wiring.js';
import { CARD_ARCHETYPES } from './morph/card-archetypes.js';
import { repoRelativeSource } from '../../../tools/creature-animation/record-source.mjs';
import { CARD_ARCHETYPES as BUILD_LIST, SHIPPED_ROOT, generatedSources } from '../../../tools/morph/build-card-masters.mjs';
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
      for (const f of ['record.json', 'binding.json', 'parts/alpha.png', 'parts/manifest.json']) need(fit.dir + f);
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
  it('each shipped alpha-only cut-out carries EXACTLY its keyed cut-out\'s alpha (RGB zero), and the manifest names the source it was derived from', () => {
    // the arena reads only the alpha (rig alpha + alpha box); the colour comes from the atlas. Compare every alpha byte.
    const alphaOf = (bytes: Buffer) => { const p = PNG.sync.read(bytes), a = new Uint8Array(p.width * p.height); let rgb = 0; for (let i = 0; i < a.length; i++) { a[i] = p.data[i * 4 + 3]!; rgb |= p.data[i * 4]! | p.data[i * 4 + 1]! | p.data[i * 4 + 2]!; } return { w: p.width, h: p.height, a, rgb }; };
    const firstDiff = (x: Uint8Array, y: Uint8Array) => { if (x.length !== y.length) return -2; for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return i; return -1; };
    const shipped = JSON.parse(readFileSync(served('../../MANIFEST.json'), 'utf8')) as { files: { path: string; derivedFrom?: { path: string; sha256: string } }[] };
    let checked = 0, control = -1;
    for (const fit of BATTLE2_PARTS_FITS) {
      const source = readFileSync(new URL(fit.dir.replace(/^\.\.\//, 'audits/') + 'parts/keyed.png', REPO_ROOT)), cut = alphaOf(readFileSync(served(fit.dir + 'parts/alpha.png'))), want = alphaOf(source);
      expect([cut.w, cut.h], fit.earthName).toEqual([want.w, want.h]);
      expect(firstDiff(cut.a, want.a), fit.earthName + ': first differing alpha byte').toBe(-1);
      expect(cut.rgb, fit.earthName + ': RGB must be zero').toBe(0);
      expect(existsSync(served(fit.dir + 'parts/keyed.png')), fit.earthName + ': the full keyed cut-out no longer ships').toBe(false);
      const entry = shipped.files.find((f) => f.path === fit.dir.replace(/^\.\.\//, 'audits/') + 'parts/alpha.png');
      expect(entry?.derivedFrom?.path, fit.earthName).toBe(fit.dir.replace(/^\.\.\//, 'audits/') + 'parts/keyed.png');
      if (control < 0) { const bad = cut.a.slice(); bad[bad.length >> 1] ^= 1; control = firstDiff(bad, want.a); } // mutation control: one flipped bit is found
      checked++;
    }
    expect(checked).toBe(BATTLE2_PARTS_FITS.length);
    expect(control).toBeGreaterThanOrEqual(0);
  });
  it('the negative control: an absolute record source only resolves through the shared resolver', () => {
    const abs = '/Users/someone/Projects/celestial-frontier-openai-mac/audits/X/master.png';
    expect(() => auditAssetPath(abs)).toThrow(/not under audits/);
    expect(auditAssetPath(repoRelativeSource(abs))).toBe('../X/master.png');
    expect(() => repoRelativeSource('/etc/passwd')).toThrow(/outside a Celestial Frontier worktree/);
  });
  it('NO DRIFT: the three generated files are exactly what the builder generates from its one list, and every shipped mirror names its fit and seals its record (review 2026-09-24: nothing tied them together)', () => {
    const markingsFilesOf = (a: { key: string }) => { const dir = new URL(SHIPPED_ROOT + a.key + '/', REPO_ROOT), mj = new URL('markings.json', dir);
      if (!existsSync(mj)) return []; const j = JSON.parse(readFileSync(mj, 'utf8')) as { patterns: Record<string, { file?: string }> }; return ['markings.json', ...Object.values(j.patterns).map((v) => v.file!).filter(Boolean)]; };
    const gen = generatedSources(BUILD_LIST, markingsFilesOf), src = (f: string) => readFileSync(new URL('port/v2/apps/game/src/' + f, REPO_ROOT), 'utf8');
    expect(src('morph/card-archetypes.ts')).toBe(gen.registry); expect(src('painted-cards.assets.ts')).toBe(gen.assets); expect(src('battle2-archetypes.ts')).toBe(gen.arena);
    for (const a of BUILD_LIST) { const mirror = JSON.parse(readFileSync(new URL(SHIPPED_ROOT + a.key + '/SOURCE.json', REPO_ROOT), 'utf8')) as { fitDir: string; recordRecipeHash: string; markingsDir?: string };
      expect(mirror.fitDir, a.earthName).toBe(a.dir); expect(mirror.markingsDir ?? null, a.earthName).toBe(a.markings ?? null);
      const fit = JSON.parse(readFileSync(new URL(a.dir + 'record.json', REPO_ROOT), 'utf8')) as { recipeHash: string }, shipped = JSON.parse(readFileSync(new URL(SHIPPED_ROOT + a.key + '/record.json', REPO_ROOT), 'utf8')) as { recipeHash: string };
      expect(mirror.recordRecipeHash, a.earthName).toBe(fit.recipeHash); expect(shipped.recipeHash, a.earthName + ' shipped record').toBe(fit.recipeHash);
      const arenaFit = BATTLE2_PARTS_FITS.find((f) => f.earthName === a.earthName)!, served = JSON.parse(readFileSync(served_(arenaFit.dir + 'record.json'), 'utf8')) as { recipeHash: string };
      expect(served.recipeHash, a.earthName + ' arena record').toBe(fit.recipeHash); }
    // mutation control: a hand edit to a generated file is caught
    expect(src('battle2-archetypes.ts').replace("'Python'", "'Pythn'")).not.toBe(gen.arena);
  });
});
const served_ = (rel: string): URL => new URL(rel, SERVED);
