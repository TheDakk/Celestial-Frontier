/* The app's home-screen icon, made at build time as PNG bytes: the code branch holds no image file.

   The drawing is a stand-in written here. When the interface sheet carries an `app` drawing, its rows and
   colours take the place of ART and INK and nothing else changes. */
import { deflateSync } from 'node:zlib';

/** One letter per art pixel, 16 by 16. */
const ART = [
  '................',
  '.......y........',
  '.......y....w...',
  '...bbbbybbb.....',
  '..b...yyy..b....',
  '.b....yyy...b...',
  '.b...yyyyy..b...',
  '.yyyyyy.yyyyyy..',
  '.b...yyyyy..b...',
  '.b....yyy...b...',
  '..b...yyy..b....',
  '...bbbbybbb.....',
  '.......y........',
  '.......y........',
  '................',
  '................',
] as const;
const INK: Readonly<Record<string, readonly [number, number, number]>> = {
  '.': [0x05, 0x07, 0x0d], y: [0xff, 0xf0, 0xa8], b: [0x76, 0xcc, 0xe8], w: [0xf5, 0xfb, 0xff],
};
export const ICON_GROUND = '#05070d';

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function chunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  out.set([...type].map((ch) => ch.charCodeAt(0)), 4);
  out.set(data, 8);
  let crc = 0xffffffff;
  for (const byte of out.subarray(4, 8 + data.length)) crc = CRC_TABLE[(crc ^ byte) & 0xff]! ^ (crc >>> 8);
  view.setUint32(8 + data.length, (crc ^ 0xffffffff) >>> 0);
  return out;
}

/** A square PNG `size` pixels wide: the drawing in whole steps of `step` pixels, centred on the ground colour.
 *  A maskable icon takes a smaller step, so the drawing stays inside the part every device shows. */
export function appIconPng(size: number, step: number): Uint8Array {
  const art = ART.length * step;
  const inset = (size - art) >> 1;
  if (!Number.isInteger(size) || !Number.isInteger(step) || step < 1 || inset < 0) throw new Error(`the app icon does not fit ${size} pixels at step ${step}`);
  const rows = new Uint8Array(size * (1 + size * 3));
  for (let y = 0; y < size; y++) {
    const line = ART[Math.floor((y - inset) / step)];
    for (let x = 0; x < size; x++) {
      const ink = INK[line?.[Math.floor((x - inset) / step)] ?? '.']!;
      rows.set(ink, y * (1 + size * 3) + 1 + x * 3);
    }
  }
  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);
  view.setUint32(0, size);
  view.setUint32(4, size);
  header.set([8, 2, 0, 0, 0], 8); // eight bits a channel, red green blue
  const parts = [Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a), chunk('IHDR', header), chunk('IDAT', deflateSync(rows)), chunk('IEND', new Uint8Array(0))];
  const png = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let at = 0;
  for (const part of parts) { png.set(part, at); at += part.length; }
  return png;
}
