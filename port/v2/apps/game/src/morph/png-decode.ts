// Exact PNG decode to STRAIGHT-alpha RGBA in plain JS (morph step 4): the paint-skin loader forbids round-tripping a
// translucent atlas through canvas ImageData (premultiplied alpha corrupts translucent texels), so a per-individual
// remap needs the atlas pixels exactly as encoded. 8-bit RGBA / RGB / grey / grey+alpha, non-interlaced; anything
// else is refused by name. Inflate is the platform's `DecompressionStream('deflate')` (zlib-wrapped, as PNG requires).
const SIG = [137, 80, 78, 71, 13, 10, 26, 10];
const CRC_TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b: Uint8Array, from: number, to: number): number => { let c = 0xffffffff; for (let i = from; i < to; i++) c = CRC_TABLE[(c ^ b[i]!) & 255]! ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const u32 = (b: Uint8Array, i: number): number => ((b[i]! << 24) | (b[i + 1]! << 16) | (b[i + 2]! << 8) | b[i + 3]!) >>> 0;
export interface DecodedPng { readonly width: number; readonly height: number; readonly rgba: Uint8Array; readonly colorType: number; }
async function inflate(zlib: Uint8Array): Promise<Uint8Array> {
  const ds = new DecompressionStream('deflate'); const w = ds.writable.getWriter(); void w.write(new Uint8Array(zlib) as unknown as BufferSource).then(() => w.close());
  const chunks: Uint8Array[] = []; const r = ds.readable.getReader(); for (;;) { const { done, value } = await r.read(); if (done) break; chunks.push(value); }
  let n = 0; for (const c of chunks) n += c.length; const out = new Uint8Array(n); let o = 0; for (const c of chunks) { out.set(c, o); o += c.length; } return out;
}
export async function decodePng(bytes: Uint8Array): Promise<DecodedPng> {
  if (bytes.length < 8 || SIG.some((v, i) => bytes[i] !== v)) throw new TypeError('png: not a PNG signature');
  let p = 8, width = 0, height = 0, depth = 0, colorType = 0, interlace = 0, seenIHDR = false, seenIEND = false; const idat: Uint8Array[] = [];
  while (p + 8 <= bytes.length && !seenIEND) {
    const len = u32(bytes, p), type = String.fromCharCode(bytes[p + 4]!, bytes[p + 5]!, bytes[p + 6]!, bytes[p + 7]!); const dataStart = p + 8, dataEnd = dataStart + len;
    if (dataEnd + 4 > bytes.length) throw new RangeError('png: truncated chunk ' + type);
    if (crc32(bytes, p + 4, dataEnd) !== u32(bytes, dataEnd)) throw new RangeError('png: crc mismatch in ' + type);
    if (type === 'IHDR') { width = u32(bytes, dataStart); height = u32(bytes, dataStart + 4); depth = bytes[dataStart + 8]!; colorType = bytes[dataStart + 9]!; interlace = bytes[dataStart + 12]!; seenIHDR = true; }
    else if (type === 'IDAT') idat.push(bytes.subarray(dataStart, dataEnd));
    else if (type === 'IEND') seenIEND = true;
    else if (type === 'PLTE') throw new TypeError('png: palette images are not atlases');
    p = dataEnd + 4;
  }
  if (!seenIHDR || !seenIEND) throw new RangeError('png: missing IHDR/IEND');
  if (depth !== 8) throw new TypeError('png: only 8-bit channels (got ' + depth + ')'); if (interlace !== 0) throw new TypeError('png: interlaced images are refused');
  const channels = ({ 0: 1, 2: 3, 4: 2, 6: 4 } as Record<number, number>)[colorType]; if (!channels) throw new TypeError('png: unsupported colour type ' + colorType);
  if (!(width > 0 && height > 0 && width <= 8192 && height <= 8192)) throw new RangeError('png: size');
  let n = 0; for (const c of idat) n += c.length; const z = new Uint8Array(n); let o = 0; for (const c of idat) { z.set(c, o); o += c.length; }
  const raw = await inflate(z); const stride = width * channels; if (raw.length !== (stride + 1) * height) throw new RangeError('png: inflated size ' + raw.length + ' ≠ ' + (stride + 1) * height);
  const px = new Uint8Array(stride * height); const bpp = channels;
  for (let y = 0; y < height; y++) { const f = raw[y * (stride + 1)]!, src = y * (stride + 1) + 1, dst = y * stride, prev = (y - 1) * stride;
    for (let x = 0; x < stride; x++) { const a = x >= bpp ? px[dst + x - bpp]! : 0, b = y > 0 ? px[prev + x]! : 0, c = x >= bpp && y > 0 ? px[prev + x - bpp]! : 0; const v = raw[src + x]!; let out: number;
      switch (f) { case 0: out = v; break; case 1: out = v + a; break; case 2: out = v + b; break; case 3: out = v + ((a + b) >> 1); break;
        case 4: { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); out = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); break; }
        default: throw new RangeError('png: filter ' + f + ' on row ' + y); }
      px[dst + x] = out & 255; } }
  if (channels === 4) return Object.freeze({ width, height, rgba: px, colorType });
  const rgba = new Uint8Array(width * height * 4);
  for (let i = 0; i < width * height; i++) { const s = i * channels, d = i * 4; if (channels === 3) { rgba[d] = px[s]!; rgba[d + 1] = px[s + 1]!; rgba[d + 2] = px[s + 2]!; rgba[d + 3] = 255; } else if (channels === 2) { rgba[d] = rgba[d + 1] = rgba[d + 2] = px[s]!; rgba[d + 3] = px[s + 1]!; } else { rgba[d] = rgba[d + 1] = rgba[d + 2] = px[s]!; rgba[d + 3] = 255; } }
  return Object.freeze({ width, height, rgba, colorType });
}
