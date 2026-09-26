/** Generator + drift check for card-tint.generated.ts (CARD = STAGE). The decision is the card's own production measurement: for each role, the
 * mean saturation of the card master's pixels whose label has that role, against LOW_CHROMA_ROLE — exactly what cardCompositeV1 measured
 * before the table existed. Regenerate with CF_REGENERATE_CARD_TINT=1. */
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from '../battle2/parts-rig.fixtures.js';
import { compileBodyCard, type MotionGenomeFields, type ResolvedAnatomyRecord } from '../motion/body-card.js';
import { CARD_ARCHETYPES } from './card-archetypes.js';
import { cardRolesV1, type CardReceiptV1 } from './morph-card.js';
import { LOW_CHROMA_ROLE, meanSaturation, type PaletteFrame } from './morph-palette.js';
import { archetypeGenomeV1 } from './morph-params.js';
import { decodePng } from './png-decode.js';

const read = (p: string) => readFileSync(new URL(p, REPO_ROOT));
const TABLE = new URL('./card-tint.generated.ts', import.meta.url);
export async function measuredCardTintV1(): Promise<Record<string, { base?: boolean; accent?: boolean }>> {
  const out: Record<string, { base?: boolean; accent?: boolean }> = {};
  for (const a of CARD_ARCHETYPES) {
    const record = JSON.parse(read(a.dir + 'record.json').toString('utf8')) as ResolvedAnatomyRecord & { recipeHash: string }, receipt = JSON.parse(read(a.dir + 'card/card.json').toString('utf8')) as CardReceiptV1;
    const m = await decodePng(new Uint8Array(read(a.dir + 'card/master-512.png'))), l = await decodePng(new Uint8Array(read(a.dir + 'card/labels-512.png')));
    const card = compileBodyCard(record, archetypeGenomeV1(record as never) as MotionGenomeFields), roles = cardRolesV1(receipt, card), entry: { base?: boolean; accent?: boolean } = {};
    for (const role of ['base', 'accent'] as const) {
      const frames: PaletteFrame[] = [{ x: 0, y: 0, width: m.width, height: m.height, role }], pick = (px: number) => roles.get(l.rgba[px * 4]!) === role;
      let any = false; for (let px = 0; px < m.width * m.height && !any; px++) if (pick(px) && m.rgba[px * 4 + 3]) any = true;
      if (any) entry[role] = meanSaturation(m.rgba, m.width, frames, role, pick) < LOW_CHROMA_ROLE;
    }
    out[record.recipeHash] = entry;
  }
  return out;
}
const render = (t: Record<string, { base?: boolean; accent?: boolean }>) => readFileSync(TABLE, 'utf8').replace(/Object\.freeze\(\{[\s\S]*\}\);\n$/, 'Object.freeze({\n'
  + Object.keys(t).sort().map((k) => `  '${k}': Object.freeze(${JSON.stringify(t[k]).replace(/"(\w+)":/g, '$1: ')}),\n`).join('') + '});\n');

describe('card tint table (CARD = STAGE: one decision per archetype and role)', () => {
  it('the checked-in table equals the card master measurement for every archetype', async () => {
    const t = await measuredCardTintV1(), text = render(t);
    if (process.env.CF_REGENERATE_CARD_TINT === '1') writeFileSync(TABLE, text);
    expect(readFileSync(TABLE, 'utf8')).toBe(text);
    expect(Object.keys(t)).toHaveLength(CARD_ARCHETYPES.length);
  }, 300_000);
});

describe('the STAGE remap obeys the table (outcome)', () => {
  it('the Gull\'s accent is TINTED on its real atlas, as on its card; control: the same atlas without a table entry is not', async () => {
    const { paletteFramesV1 } = await import('./morph-individual.js'); const { remapAtlasPaletteV1, TINT_SATURATION } = await import('./morph-palette.js');
    const { morphParamsV1 } = await import('./morph-params.js'); const { CARD_TINT_V1 } = await import('./card-tint.generated.js');
    const a = CARD_ARCHETYPES.find((x) => x.earthName === 'Gull')!, fitDir = (JSON.parse(read(a.dir + 'SOURCE.json').toString('utf8')) as { fitDir: string }).fitDir;
    const record = JSON.parse(read(a.dir + 'record.json').toString('utf8')) as ResolvedAnatomyRecord & { recipeHash: string };
    expect(CARD_TINT_V1[record.recipeHash]?.accent).toBe(true); // the card's decision
    const binding = JSON.parse(read(fitDir + 'binding.json').toString('utf8')), manifest = JSON.parse(read(fitDir + 'parts/manifest.json').toString('utf8')) as { creatureId: string };
    const atlas = await decodePng(new Uint8Array(read(fitDir + 'parts/atlas/' + manifest.creatureId + '.png')));
    const own = archetypeGenomeV1(record as never), card = compileBodyCard(record, own as MotionGenomeFields), frames = paletteFramesV1(binding, card);
    const params = Array.from({ length: 24 }, (_, g) => morphParamsV1({ ...(own as object), accent: g }, record.recipeHash, own as never)).find((p) => p.accent.hue !== null)!;
    expect(params.accent.hue).not.toBeNull();
    const accentSat = (px: Uint8Array) => meanSaturation(px, atlas.width, frames, 'accent');
    const withTable = remapAtlasPaletteV1(atlas.rgba, atlas.width, atlas.height, frames, params);
    const without = remapAtlasPaletteV1(atlas.rgba, atlas.width, atlas.height, frames, { ...params, archetype: 'no-table-entry' }); // falls back to measuring the atlas (0.183 → rotate)
    expect(accentSat(withTable)).toBeGreaterThanOrEqual(TINT_SATURATION * 0.95);
    expect(accentSat(without)).toBeLessThan(TINT_SATURATION * 0.95);
  }, 120_000);
});
