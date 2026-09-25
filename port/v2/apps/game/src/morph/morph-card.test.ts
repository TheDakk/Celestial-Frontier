import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { FITS, REPO_ROOT, repoJson, type FitName, type FitRecord } from '../battle2/parts-rig.fixtures.js';
import { compileBodyCard } from '../motion/body-card.js';
import { alphaBoxV1, cardCompositeV1, padForProportionV1, renderCardIndividualV1, type CardMasterV1, type CardReceiptV1 } from './morph-card.js';
import { morphParamsV1 } from './morph-params.js';
const require = createRequire(import.meta.url);
const { PNG } = createRequire(require.resolve('free-tex-packer-core'))('pngjs') as { PNG: { sync: { read(b: Buffer): { width: number; height: number; data: Uint8Array } } } };
const sha = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');
const load = (name: FitName) => { const dir = FITS[name]; const m = PNG.sync.read(readFileSync(new URL(dir + 'card/master-512.png', REPO_ROOT))), l = PNG.sync.read(readFileSync(new URL(dir + 'card/labels-512.png', REPO_ROOT)));
  const receipt = repoJson<CardReceiptV1 & { recordRecipeHash: string }>(dir + 'card/card.json'), record = repoJson<FitRecord>(dir + 'record.json');
  return { master: { width: m.width, height: m.height, master: new Uint8Array(m.data), labels: new Uint8Array(l.data) } as CardMasterV1, receipt, card: compileBodyCard(record, record.genome), recipe: receipt.recordRecipeHash }; };
const alphaBox = (rgba: Uint8Array, s: number) => { let x0 = s, y0 = s, x1 = -1, y1 = -1; for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) if (rgba[(y * s + x) * 4 + 3]! > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } return { x0, y0, x1, y1 }; };
describe('the individual on the card — Pixi-free raster over the sealed card master', () => {
  it('a grown tail is NEVER clipped by the card (2026-09-24, the stand-in sheet): with head 1.2× / tail 1.35× the padded composite\'s alpha box stays clear of its canvas edge on every archetype, where the unpadded composite touches it; identity is untouched', () => {
    let clippedBefore = 0;
    for (const name of Object.keys(FITS) as FitName[]) { const f = load(name), params = morphParamsV1({ head: 7, tail: 6 }, f.recipe);
      const padded = padForProportionV1({ ...f, params, size: 132 }), W = padded.master.width, H = padded.master.height, b = alphaBoxV1(cardCompositeV1(padded), W, H);
      expect(b.x0 > 0 && b.y0 > 0 && b.x1 < W - 1 && b.y1 < H - 1, `${name}: ${JSON.stringify(b)} in ${W}×${H}`).toBe(true);
      const raw = alphaBoxV1(cardCompositeV1({ ...f, params }), f.master.width, f.master.height); if (raw.x0 <= 0 || raw.y0 <= 0 || raw.x1 >= f.master.width - 1 || raw.y1 >= f.master.height - 1) clippedBefore++;
      const idInput = { ...f, params: morphParamsV1({}, f.recipe), size: 132 }; expect(padForProportionV1(idInput)).toBe(idInput); // identity: no pad, same bytes
    }
    expect(clippedBefore).toBeGreaterThan(0); // control: without the pad at least one archetype runs off its canvas
  });
  for (const name of Object.keys(FITS) as FitName[]) it(`${name}: identity raster is deterministic; a colour morph keeps the alpha plane; a head/tail morph changes the silhouette; 132 and 440 both render`, () => {
    const f = load(name); const id = renderCardIndividualV1({ ...f, params: morphParamsV1({}, f.recipe), size: 132 });
    expect(sha(renderCardIndividualV1({ ...f, params: morphParamsV1({}, f.recipe), size: 132 }))).toBe(sha(id));
    const col = renderCardIndividualV1({ ...f, params: morphParamsV1({ seed: 3, color: 1, accent: 4 }, f.recipe), size: 132 });
    let alphaDiff = 0, rgbDiff = 0; for (let i = 0; i < id.length; i += 4) { if (id[i + 3] !== col[i + 3]) alphaDiff++; if (id[i] !== col[i] || id[i + 1] !== col[i + 1] || id[i + 2] !== col[i + 2]) rgbDiff++; }
    expect(alphaDiff).toBe(0); expect(rgbDiff).toBeGreaterThan(500);
    const big = renderCardIndividualV1({ ...f, params: morphParamsV1({ head: 7, tail: 6 }, f.recipe), size: 132 }); expect(sha(big)).not.toBe(sha(id));
    expect(renderCardIndividualV1({ ...f, params: morphParamsV1({ seed: 9, color: 6, head: 7 }, f.recipe), size: 440 }).length).toBe(440 * 440 * 4);
    const box = alphaBox(id, 132); expect(box.x1 - box.x0).toBeGreaterThan(80); expect(box.y1 - box.y0).toBeGreaterThan(30); // the creature fills the card, not a corner
  });
  it('Civet head 1.2× / tail 1.35× in master space: the composite\'s alpha box grows taller (the head grows up about the neck pivot) and wider (the tail grows out); identity composite is the card master byte for byte', () => {
    const f = load('civet'); const id = cardCompositeV1({ ...f, params: morphParamsV1({}, f.recipe) }), big = cardCompositeV1({ ...f, params: morphParamsV1({ head: 7, tail: 6 }, f.recipe) });
    expect(sha(id)).toBe(sha(f.master.master));
    const a = alphaBoxV1(id, f.master.width, f.master.height), b = alphaBoxV1(big, f.master.width, f.master.height);
    expect(b.y0).toBeLessThan(a.y0); expect(b.x1 - b.x0).toBeGreaterThan(a.x1 - a.x0); // (the tail hangs down-back in the painting: scaled 1.35 it reaches below the paws, so the box bottom is not the paw line)
    // the NEAR legs are untouched (in front of everything, as in the rig): every pixel labelled as a near leg part is byte-identical between identity and morph; a far leg may be covered by the enlarged far tail, as it would be on the stage
    const legLabels = new Set(f.receipt.labels.filter((l) => l.layer === 'near' && f.card.parts.find((p) => p.joint === l.joint)?.group === 'legs').map((l) => l.label)); expect(legLabels.size).toBeGreaterThan(0);
    let legPixels = 0, legDiff = 0; for (let i = 0; i < f.master.width * f.master.height; i++) if (legLabels.has(f.master.labels[i * 4]!)) { legPixels++; for (let c = 0; c < 4; c++) if (id[i * 4 + c] !== big[i * 4 + c]) { legDiff++; break; } }
    expect(legPixels).toBeGreaterThan(1000); expect(legDiff / legPixels).toBeLessThan(0.05); // measured 302 px of ~24k: where the enlarged head/tail parts (later in the binding's draw order, as on the stage) overlap a near leg
  });
});
