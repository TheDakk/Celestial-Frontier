// Exact PNG encode of straight-alpha RGBA (8-bit, colour type 6, filter 0, one IDAT) over the platform's
// `CompressionStream('deflate')` — the card raster's bytes are then identical on every device that runs the same
// deflate; the decoded pixels are identical everywhere by construction (the parity law), which is what the tests seal.
const SIG = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
const CRC_TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b: Uint8Array): number => { let c = 0xffffffff; for (let i = 0; i < b.length; i++) c = CRC_TABLE[(c ^ b[i]!) & 255]! ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const be32 = (v: number): Uint8Array => new Uint8Array([(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255]);
const chunk = (type: string, data: Uint8Array): Uint8Array => { const t = new Uint8Array(4 + data.length); for (let i = 0; i < 4; i++) t[i] = type.charCodeAt(i); t.set(data, 4); const out = new Uint8Array(12 + data.length); out.set(be32(data.length), 0); out.set(t, 4); out.set(be32(crc32(t)), 8 + data.length); return out; };
async function deflate(raw: Uint8Array): Promise<Uint8Array> {
  const cs = new CompressionStream('deflate'); const w = cs.writable.getWriter(); void w.write(new Uint8Array(raw) as unknown as BufferSource).then(() => w.close());
  const chunks: Uint8Array[] = []; const r = cs.readable.getReader(); for (;;) { const { done, value } = await r.read(); if (done) break; chunks.push(value); }
  let n = 0; for (const c of chunks) n += c.length; const out = new Uint8Array(n); let o = 0; for (const c of chunks) { out.set(c, o); o += c.length; } return out;
}
export async function encodePng(rgba: Uint8Array, width: number, height: number): Promise<Uint8Array> {
  if (rgba.length !== width * height * 4 || !(width > 0 && height > 0)) throw new TypeError('png encode: size');
  const raw = new Uint8Array((width * 4 + 1) * height); for (let y = 0; y < height; y++) { raw[y * (width * 4 + 1)] = 0; raw.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), y * (width * 4 + 1) + 1); }
  const ihdr = new Uint8Array(13); ihdr.set(be32(width), 0); ihdr.set(be32(height), 4); ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const parts = [SIG, chunk('IHDR', ihdr), chunk('IDAT', await deflate(raw)), chunk('IEND', new Uint8Array(0))];
  let n = 0; for (const p of parts) n += p.length; const out = new Uint8Array(n); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; } return out;
}
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
export function base64(bytes: Uint8Array): string { let s = ''; for (let i = 0; i < bytes.length; i += 3) { const a = bytes[i]!, b = bytes[i + 1], c = bytes[i + 2]; const n = (a << 16) | ((b ?? 0) << 8) | (c ?? 0); s += B64[n >>> 18]! + B64[(n >>> 12) & 63]! + (b === undefined ? '=' : B64[(n >>> 6) & 63]!) + (c === undefined ? '=' : B64[n & 63]!); } return s; }
export const pngDataUrl = (png: Uint8Array): string => 'data:image/png;base64,' + base64(png);
