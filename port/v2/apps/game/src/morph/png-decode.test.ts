import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { FITS, REPO_ROOT, type FitName } from '../battle2/parts-rig.fixtures.js';
import { decodePng } from './png-decode.js';
const require = createRequire(import.meta.url);
const { PNG } = createRequire(require.resolve('free-tex-packer-core'))('pngjs') as { PNG: { sync: { read(b: Buffer): { width: number; height: number; data: Uint8Array }; write(p: unknown): Buffer }; new (o: { width: number; height: number; colorType?: number }): { data: Buffer } } };
const sha = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');
describe('exact JS PNG decode — straight alpha, byte-identical to pngjs', () => {
  for (const name of Object.keys(FITS) as FitName[]) it(`${name}: atlas and keyed cut-out decode byte-identical`, async () => {
    const manifest = JSON.parse(readFileSync(new URL(FITS[name] + 'parts/manifest.json', REPO_ROOT), 'utf8')) as { creatureId: string };
    for (const rel of [FITS[name] + 'parts/atlas/' + manifest.creatureId + '.png', FITS[name] + 'parts/keyed.png']) {
      const bytes = new Uint8Array(readFileSync(new URL(rel, REPO_ROOT))); const ref = PNG.sync.read(Buffer.from(bytes)); const got = await decodePng(bytes);
      expect([got.width, got.height]).toEqual([ref.width, ref.height]); expect(sha(got.rgba)).toBe(sha(new Uint8Array(ref.data)));
    }
  });
  it('a synthetic translucent image decodes exactly (straight alpha kept); NEGATIVE CONTROLS: a flipped byte fails its crc, a truncated file is refused, a non-PNG is refused', async () => {
    const img = new PNG({ width: 3, height: 2 }); for (let i = 0; i < 6; i++) { img.data[i * 4] = i * 40; img.data[i * 4 + 1] = 255 - i * 40; img.data[i * 4 + 2] = 7; img.data[i * 4 + 3] = i * 51; } // alpha 0..255: a canvas round trip would destroy these
    const bytes = new Uint8Array(PNG.sync.write(img)); const got = await decodePng(bytes); expect(got.colorType).toBe(6); expect([...got.rgba.slice(0, 8)]).toEqual([0, 255, 7, 0, 40, 215, 7, 51]);
    const bad = new Uint8Array(bytes); bad[40] = (bad[40] ?? 0) ^ 0x10; await expect(decodePng(bad)).rejects.toThrow(/crc|filter|inflate|size/);
    await expect(decodePng(bytes.subarray(0, bytes.length - 10))).rejects.toThrow(/truncated|IEND/);
    await expect(decodePng(new Uint8Array([1, 2, 3]))).rejects.toThrow(/signature/);
  });
});
