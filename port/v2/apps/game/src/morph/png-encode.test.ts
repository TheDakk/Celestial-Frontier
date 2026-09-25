import { describe, expect, it } from 'vitest';
import { decodePng } from './png-decode.js';
import { base64, encodePng, pngDataUrl } from './png-encode.js';
describe('exact PNG encode', () => {
  it('round-trips straight-alpha RGBA exactly through our decoder; the data URL prefix and base64 are standard', async () => {
    const w = 7, h = 5, rgba = new Uint8Array(w * h * 4); for (let i = 0; i < rgba.length; i++) rgba[i] = (i * 37 + 11) & 255;
    const png = await encodePng(rgba, w, h); const back = await decodePng(png);
    expect([back.width, back.height]).toEqual([w, h]); expect(Buffer.from(back.rgba).equals(Buffer.from(rgba))).toBe(true);
    expect(base64(new Uint8Array([77, 97, 110]))).toBe('TWFu'); expect(base64(new Uint8Array([77, 97]))).toBe('TWE='); expect(base64(new Uint8Array([77]))).toBe('TQ==');
    expect(pngDataUrl(png).startsWith('data:image/png;base64,iVBORw0KGgo')).toBe(true);
    expect(Buffer.from(pngDataUrl(png).slice('data:image/png;base64,'.length), 'base64').equals(Buffer.from(png))).toBe(true);
    await expect(encodePng(rgba, 3, 3)).rejects.toThrow(/size/);
  });
});
