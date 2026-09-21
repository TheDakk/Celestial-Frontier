import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { FITS, REPO_ROOT, repoJson, type FitRecord } from '../battle2/parts-rig.fixtures.js';
import type { CreaturePartsBindingV1 } from '../creature-rig.js';
import { MARKING_STRENGTH, MASKED_PATTERNS, PATTERN_NAMES, applyMarkingV1, emissiveV1, markingNameV1, maskAlphaOf, masterMaskToAtlasV1, scaleMaskV1 } from './morph-markings.js';
import { morphParamsV1 } from './morph-params.js';
const require = createRequire(import.meta.url);
const { PNG } = createRequire(require.resolve('free-tex-packer-core'))('pngjs') as { PNG: { sync: { read(b: Buffer): { width: number; height: number; data: Uint8Array } } } };
const sha = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');
const crab = () => { const dir = FITS.crab, record = repoJson<FitRecord>(dir + 'record.json'), binding = repoJson<CreaturePartsBindingV1>(dir + 'binding.json'), manifest = repoJson<{ creatureId: string }>(dir + 'parts/manifest.json'), markings = repoJson<{ patterns: Record<string, { file: string }> }>(dir + 'markings.json');
  const atlas = PNG.sync.read(readFileSync(new URL(dir + 'parts/atlas/' + manifest.creatureId + '.png', REPO_ROOT))); return { dir, record, binding, markings, atlas }; };
describe('M3/M4 — painted markings', () => {
  it('pattern names follow v1 FA_PATTERN; plain and iridescent have no mask; iridescent or lumin is emissive', () => {
    expect([...PATTERN_NAMES]).toEqual(['plain', 'striped', 'spotted', 'banded', 'mottled', 'iridescent', 'marbled', 'eye-spotted']);
    for (let i = 0; i < 8; i++) { const p = morphParamsV1({ pattern: i }, 'x'); expect(markingNameV1(p)).toBe(MASKED_PATTERNS.has(PATTERN_NAMES[i]!) ? PATTERN_NAMES[i] : null); expect(emissiveV1(p)).toBe(i === 5); }
    expect(emissiveV1(morphParamsV1({ pattern: 1, lumin: true }, 'x'))).toBe(true); expect(markingNameV1(morphParamsV1({}, 'x'))).toBeNull();
  });
  it('every crab mask maps from master space into the atlas through the binding\'s parts: nonzero, never where the atlas is clear (alpha conservation), deterministic', () => {
    const f = crab();
    for (const [name, m] of Object.entries(f.markings.patterns)) { const png = PNG.sync.read(readFileSync(new URL(f.dir + m.file, REPO_ROOT))); const master = maskAlphaOf(new Uint8Array(png.data), png.width, png.height);
      const atlas = masterMaskToAtlasV1(master, f.binding, f.record.geometry.width, f.record.geometry.height, new Uint8Array(f.atlas.data)); expect([atlas.width, atlas.height]).toEqual([f.binding.atlasSize.width, f.binding.atlasSize.height]);
      let nz = 0, outside = 0; for (let i = 0; i < atlas.alpha.length; i++) if (atlas.alpha[i]) { nz++; if (!f.atlas.data[i * 4 + 3]) outside++; }
      expect(nz, name).toBeGreaterThan(200); expect(outside, name).toBe(0);
      expect(sha(masterMaskToAtlasV1(master, f.binding, f.record.geometry.width, f.record.geometry.height, new Uint8Array(f.atlas.data)).alpha)).toBe(sha(atlas.alpha)); }
    expect(() => masterMaskToAtlasV1({ alpha: new Uint8Array(4), width: 2, height: 2 }, f.binding, 880, 880, new Uint8Array(f.atlas.data))).toThrow(/master space/);
  });
  it('the blend changes only masked, opaque pixels; alpha untouched; an emissive marking is brighter than a plain one; strength scales the change', () => {
    const f = crab(); const png = PNG.sync.read(readFileSync(new URL(f.dir + f.markings.patterns['striped']!.file, REPO_ROOT))); const mask = masterMaskToAtlasV1(maskAlphaOf(new Uint8Array(png.data), png.width, png.height), f.binding, 880, 880, new Uint8Array(f.atlas.data));
    const base = new Uint8Array(f.atlas.data), W = f.atlas.width, H = f.atlas.height; const accent = morphParamsV1({ seed: 2, accent: 4 }, 'x').accent;
    const a = new Uint8Array(base); const changed = applyMarkingV1(a, W, H, mask, accent, false); expect(changed).toBeGreaterThan(200);
    let outsideMask = 0, alphaDiff = 0, lumA = 0, lumE = 0; const e = new Uint8Array(base); applyMarkingV1(e, W, H, mask, accent, true);
    for (let i = 0; i < W * H; i++) { const j = i * 4; if (base[j + 3] !== a[j + 3]) alphaDiff++; if (!mask.alpha[i] && (base[j] !== a[j] || base[j + 1] !== a[j + 1] || base[j + 2] !== a[j + 2])) outsideMask++; if (mask.alpha[i]) { lumA += a[j]! + a[j + 1]! + a[j + 2]!; lumE += e[j]! + e[j + 1]! + e[j + 2]!; } }
    expect(alphaDiff).toBe(0); expect(outsideMask).toBe(0); expect(lumE).toBeGreaterThan(lumA);
    const half = new Uint8Array(base); applyMarkingV1(half, W, H, mask, accent, false, MARKING_STRENGTH / 2); let dFull = 0, dHalf = 0; for (let i = 0; i < W * H * 4; i++) { dFull += Math.abs(a[i]! - base[i]!); dHalf += Math.abs(half[i]! - base[i]!); } expect(dHalf).toBeLessThan(dFull);
    const s = scaleMaskV1(mask, 100, 30); expect([s.width, s.height]).toEqual([100, 30]); expect(s.alpha.some((v) => v > 0)).toBe(true);
  });
});
