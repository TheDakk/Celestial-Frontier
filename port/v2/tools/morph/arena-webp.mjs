// D30 (Dakk, 2026-10-02, audits/MAILBOX/DECISIONS.md): painted battle arenas ship as HIGH-QUALITY WebP runtime copies inside the
// offline pack, at the native canvas, so every biome works offline from install; the PNG masters and PNG runtimes stay in the repo
// untouched. This module is the ONE encoder and the ONE decoded-pixel check for those copies:
// - FAR (opaque scene): lossy WebP, RGB only (every source alpha must be 255; the decoder restores 255).
// - MID / NEAR (keyed terrain): lossy RGB with LOSSLESS alpha (alphaQuality 100). The decoded alpha must equal the PNG runtime's
//   alpha byte for byte, or the encode is refused. Before encoding, the RGB under fully transparent pixels (magenta key colour in the
//   runtime PNGs) is replaced by a deterministic bleed of the nearest visible colours (`bleedTransparentRgb`), so 4:2:0 chroma
//   and block prediction cannot drag the invisible magenta into the visible edge. Visible pixels (alpha > 0) are never touched.
// The copy is written next to its PNG runtime (`<name>.webp`). Metrics are measured on what the stage shows: premultiplied
// (over-black) RGB for keyed plates, RGB for FAR; PSNR over visible pixels and 8×8-block luma SSIM (mean and worst block).
// CLI (from port/v2): node tools/morph/arena-webp.mjs [--quality=88] [--receipt=audits/ARENA_WEBP_D30_20261002/receipt.json] [--dry]
//   Encodes every plate of every set in ARENA_WEBP_SOURCES (the accepted temperate set + every C132 candidate inventory row) and
//   writes the receipt. --dry measures without writing .webp files.
import fs from 'node:fs'; import path from 'node:path'; import { createHash } from 'node:crypto'; import { createRequire } from 'node:module'; import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
/** The repo's sharp (the same route the painted-creature tools use: through free-tex-packer-core). */
export const sharp = createRequire(require.resolve('free-tex-packer-core'))('sharp');
export const ARENA_WEBP_OPTIONS = Object.freeze({ quality: 88, alphaQuality: 100, effort: 6, smartSubsample: true, bleedRadius: 24 });
export const ARENA_WEBP_RECEIPT_SCHEMA = 'cf.arena-webp-receipt/v1';
const sha = (b) => createHash('sha256').update(b).digest('hex');

/** `<dir>/<name>.png` → `<dir>/<name>.webp` (the runtime copy sits next to its PNG). */
export function webpPathFor(pngRel) { if (!/\.png$/.test(pngRel)) throw Error(`arena webp: ${pngRel} is not a .png runtime`); return pngRel.replace(/\.png$/, '.webp'); }

/** Straight RGBA of any image sharp decodes (PNG or WebP), with alpha. */
export async function decodeRgba(bytes) {
  const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.channels !== 4) throw Error('arena webp: decode did not yield RGBA');
  return { width: info.width, height: info.height, rgba: new Uint8Array(data.buffer, data.byteOffset, data.length) };
}

/** A copy of `rgba` whose fully transparent pixels within `radius` (Chebyshev) of a visible pixel carry the mean colour of their already
 * filled 8-neighbours, ring by ring (multi-source BFS, fixed scan order: deterministic). Visible pixels are unchanged; pixels beyond the
 * radius keep their RGB (libwebp flattens whole transparent blocks itself). Alpha is never changed. */
export function bleedTransparentRgb(rgba, width, height, radius = ARENA_WEBP_OPTIONS.bleedRadius) {
  const out = new Uint8Array(rgba), n = width * height, filled = new Uint8Array(n);
  let frontier = [];
  for (let p = 0; p < n; p++) if (rgba[p * 4 + 3] !== 0) filled[p] = 1;
  for (let p = 0; p < n; p++) if (filled[p]) { const x = p % width, y = (p - x) / width; let edge = false;
    for (let dy = -1; dy <= 1 && !edge; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < width && yy < height && !filled[yy * width + xx]) { edge = true; break; } }
    if (edge) frontier.push(p); }
  for (let ring = 0; ring < radius && frontier.length; ring++) {
    const next = [], seen = new Set();
    for (const p of frontier) { const x = p % width, y = (p - x) / width;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= width || yy >= height) continue; const q = yy * width + xx; if (!filled[q] && !seen.has(q)) { seen.add(q); next.push(q); } } }
    next.sort((a, b) => a - b);
    const colours = next.map((q) => { const x = q % width, y = (q - x) / width; let r = 0, g = 0, b = 0, c = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= width || yy >= height) continue; const s = yy * width + xx; if (filled[s]) { r += out[s * 4]; g += out[s * 4 + 1]; b += out[s * 4 + 2]; c++; } }
      return [Math.round(r / c), Math.round(g / c), Math.round(b / c)]; });
    next.forEach((q, i) => { out[q * 4] = colours[i][0]; out[q * 4 + 1] = colours[i][1]; out[q * 4 + 2] = colours[i][2]; filled[q] = 1; });
    frontier = next;
  }
  return out;
}

/** Visible-pixel fidelity of `b` against the reference `a` (same size, straight RGBA): premultiplied RGB (keyed) or RGB (opaque). */
export function plateMetrics(a, b) {
  if (a.width !== b.width || a.height !== b.height) throw Error('arena webp: metric sizes differ');
  const { width: W, height: H } = a, A = a.rgba, B = b.rgba;
  const pm = (d, i, c) => (d[i + c] * d[i + 3]) / 255;
  let se = 0, count = 0, maxAbs = 0;
  for (let i = 0; i < A.length; i += 4) { if (A[i + 3] === 0 && B[i + 3] === 0) continue; count++;
    for (let c = 0; c < 3; c++) { const e = pm(A, i, c) - pm(B, i, c); se += e * e; if (Math.abs(e) > maxAbs) maxAbs = Math.abs(e); } }
  const mse = count ? se / (count * 3) : 0, psnr = mse === 0 ? Infinity : 10 * Math.log10((255 * 255) / mse);
  const C1 = (0.01 * 255) ** 2, C2 = (0.03 * 255) ** 2, Y = (d, i) => 0.299 * pm(d, i, 0) + 0.587 * pm(d, i, 1) + 0.114 * pm(d, i, 2);
  let sum = 0, blocks = 0, min = 1;
  for (let by = 0; by + 8 <= H; by += 8) for (let bx = 0; bx + 8 <= W; bx += 8) {
    let vis = false, ma = 0, mb = 0; const ya = new Float64Array(64), yb = new Float64Array(64);
    for (let k = 0; k < 64; k++) { const i = ((by + (k >> 3)) * W + bx + (k & 7)) * 4; if (A[i + 3] || B[i + 3]) vis = true; ya[k] = Y(A, i); yb[k] = Y(B, i); ma += ya[k]; mb += yb[k]; }
    if (!vis) continue; ma /= 64; mb /= 64; let va = 0, vb = 0, cov = 0;
    for (let k = 0; k < 64; k++) { va += (ya[k] - ma) ** 2; vb += (yb[k] - mb) ** 2; cov += (ya[k] - ma) * (yb[k] - mb); }
    va /= 63; vb /= 63; cov /= 63;
    const s = ((2 * ma * mb + C1) * (2 * cov + C2)) / ((ma * ma + mb * mb + C1) * (va + vb + C2)); sum += s; blocks++; if (s < min) min = s;
  }
  return { visiblePixels: count, psnr: +psnr.toFixed(3), maxAbs: +maxAbs.toFixed(2), ssim: blocks ? +(sum / blocks).toFixed(5) : 1, ssimMinBlock: +min.toFixed(5) };
}

/** Alpha bytes that differ between two same-size straight RGBA images (0 = byte-identical alpha). */
export function alphaDifferences(a, b) {
  if (a.width !== b.width || a.height !== b.height) return Infinity;
  let d = 0; for (let i = 3; i < a.rgba.length; i += 4) if (a.rgba[i] !== b.rgba[i]) d++; return d;
}

/** Encode one runtime plate. `role` 'far' | 'mid' | 'near'. Returns the WebP bytes and the decoded-pixel receipt; throws when FAR is not
 * opaque or a keyed plate's decoded alpha differs from the PNG's by one byte. `alphaQuality` is exposed only for the negative control. */
export async function encodeArenaPlate(pngBytes, role, { quality = ARENA_WEBP_OPTIONS.quality, alphaQuality = ARENA_WEBP_OPTIONS.alphaQuality, effort = ARENA_WEBP_OPTIONS.effort, bleedRadius = ARENA_WEBP_OPTIONS.bleedRadius } = {}) {
  const src = await decodeRgba(pngBytes), { width, height } = src; let webp;
  if (role === 'far') {
    for (let i = 3; i < src.rgba.length; i += 4) if (src.rgba[i] !== 255) throw Error(`arena webp: FAR is not opaque (pixel ${(i - 3) / 4} alpha ${src.rgba[i]})`);
    webp = await sharp(Buffer.from(src.rgba), { raw: { width, height, channels: 4 } }).removeAlpha().webp({ quality, effort, smartSubsample: true }).toBuffer();
  } else if (role === 'mid' || role === 'near') {
    const bled = bleedTransparentRgb(src.rgba, width, height, bleedRadius);
    webp = await sharp(Buffer.from(bled), { raw: { width, height, channels: 4 } }).webp({ quality, alphaQuality, effort, smartSubsample: true }).toBuffer();
  } else throw Error(`arena webp: unknown plate role ${role}`);
  const dec = await decodeRgba(webp), alphaDiff = alphaDifferences(src, dec);
  if (alphaDiff !== 0) throw Error(`arena webp: ${role} decoded alpha differs from the PNG runtime at ${alphaDiff} pixels (alpha must be lossless)`);
  return { webp: new Uint8Array(webp), decoded: dec, receipt: { role, width, height, bytes: webp.length, sha256: sha(webp), alphaIdentical: true, ...plateMetrics(src, dec) } };
}

/* ---------- the D30 source list and the receipt ---------- */
export const ARENA_INVENTORY = 'audits/C132_ARENAS_20261001/complete-candidate-inventory.json';
export const ARENA_TEMPERATE_SOURCE = Object.freeze({ id: 'earth-temperate-v1', far: 'audits/ARENA_EFFECTS_V42_PROOF_20260912/arena-far.png', mid: 'audits/ARENA_V1_ACCEPTANCE_20260912/arena-mid-despilled.png', near: 'audits/ARENA_EFFECTS_V42_PROOF_20260912/keyed/arena-near.png' });
/** Every plate set's PNG runtime triplet: the accepted temperate set (its MID = the approved despilled copy) and every C132 inventory row
 * (PNG runtimes from its `d29/delivery.pending.json`, left untouched as the PNG candidate record). */
export function arenaWebpSources(R) {
  const inv = JSON.parse(fs.readFileSync(path.join(R, ARENA_INVENTORY), 'utf8')), out = [ARENA_TEMPERATE_SOURCE];
  for (const row of inv.rows) { const m = JSON.parse(fs.readFileSync(path.join(R, row.manifest), 'utf8'));
    out.push(Object.freeze({ id: row.id, far: m.plates.far.runtime, mid: m.plates.mid.runtime, near: m.plates.near.runtime })); }
  return out;
}

export async function encodeArenaSets(R, { quality = ARENA_WEBP_OPTIONS.quality, write = true, log = () => {} } = {}) {
  const sets = [];
  for (const s of arenaWebpSources(R)) { const plates = {};
    for (const role of ['far', 'mid', 'near']) { const src = s[role], png = fs.readFileSync(path.join(R, src)), { webp, receipt } = await encodeArenaPlate(png, role, { quality });
      const again = await encodeArenaPlate(png, role, { quality }); if (again.receipt.sha256 !== receipt.sha256) throw Error(`arena webp: ${src} encodes non-deterministically`);
      const out = webpPathFor(src); if (write) fs.writeFileSync(path.join(R, out), webp);
      plates[role] = { source: src, sourceSha256: sha(png), sourceBytes: png.length, webp: out, ...receipt }; }
    const row = { id: s.id, pngBytes: plates.far.sourceBytes + plates.mid.sourceBytes + plates.near.sourceBytes, webpBytes: plates.far.bytes + plates.mid.bytes + plates.near.bytes, plates };
    log(`${s.id}: ${(row.pngBytes / 1048576).toFixed(2)} MiB PNG -> ${(row.webpBytes / 1048576).toFixed(3)} MiB WebP; SSIM far ${plates.far.ssim} mid ${plates.mid.ssim} near ${plates.near.ssim}`);
    sets.push(row); }
  return { schema: ARENA_WEBP_RECEIPT_SCHEMA, decision: 'D30 (Dakk, 2026-10-02): arenas ship as high-quality WebP runtime copies in the offline pack; PNG masters stay in the repo',
    encoder: { tool: 'port/v2/tools/morph/arena-webp.mjs', sharp: sharp.versions.sharp, libwebp: sharp.versions.webp, quality, alphaQuality: ARENA_WEBP_OPTIONS.alphaQuality, effort: ARENA_WEBP_OPTIONS.effort, smartSubsample: true, farChannels: 'RGB (opaque)', keyedAlpha: 'lossless (alphaQuality 100), decoded alpha byte-identical to the PNG runtime', bleedRadius: ARENA_WEBP_OPTIONS.bleedRadius, deterministic: 'each plate encoded twice in-run, identical bytes' },
    metrics: 'PSNR (dB) and 8x8-block luma SSIM over visible pixels, premultiplied over black for keyed plates; reference = the PNG runtime',
    totals: { sets: sets.length, pngBytes: sets.reduce((n, s) => n + s.pngBytes, 0), webpBytes: sets.reduce((n, s) => n + s.webpBytes, 0) }, sets };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const R = path.resolve(import.meta.dirname, '../../../..'), arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
  const quality = Number(arg('quality', ARENA_WEBP_OPTIONS.quality)), dry = process.argv.includes('--dry'), receiptPath = arg('receipt', 'audits/ARENA_WEBP_D30_20261002/receipt.json');
  const receipt = await encodeArenaSets(R, { quality, write: !dry, log: (s) => console.error(s) });
  if (!dry) { fs.mkdirSync(path.dirname(path.join(R, receiptPath)), { recursive: true }); fs.writeFileSync(path.join(R, receiptPath), JSON.stringify(receipt, null, 1) + '\n'); }
  const all = receipt.sets.flatMap((s) => Object.values(s.plates));
  console.log(JSON.stringify({ quality, dry, sets: receipt.totals.sets, pngMiB: +(receipt.totals.pngBytes / 1048576).toFixed(2), webpMiB: +(receipt.totals.webpBytes / 1048576).toFixed(2),
    ssimMin: Math.min(...all.map((p) => p.ssim)), ssimMinBlock: Math.min(...all.map((p) => p.ssimMinBlock)), psnrMin: Math.min(...all.map((p) => p.psnr)) }));
}
