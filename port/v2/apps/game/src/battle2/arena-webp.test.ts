/** D30 (Dakk, 2026-10-02): the painted arenas ship as high-quality WebP runtime copies inside the offline pack; the PNG masters and PNG
 * runtimes stay in the repo. Outcomes: every registered set's runtime plates ARE WebP (extension and bytes), each pinned to the PNG it was
 * encoded from; a keyed plate's decoded alpha equals its PNG's alpha byte for byte and FAR stays opaque; the receipt binds every shipped
 * byte and its measured fidelity; and the encoder REFUSES a lossy-alpha encode (negative control). */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { decodePng } from '../morph/png-decode.js';
import { ARENA_SETS } from './arena-registry.js';
import { alphaDifferences, decodeRgba, encodeArenaPlate, plateMetrics, ARENA_WEBP_OPTIONS } from '../../../../tools/morph/arena-webp.mjs';
import { ARENA_RUNTIME_FORMATS, checkArenaDelivery } from '../../../../tools/morph/arena-sets.mjs';
import { validateArenaDelivery } from './arena-delivery.js';

const REPO = new URL('../../../../../../', import.meta.url), REPO_PATH = decodeURIComponent(REPO.pathname);
const bytes = (rel: string): Uint8Array => new Uint8Array(readFileSync(new URL(rel, REPO)));
const json = <T>(rel: string): T => JSON.parse(readFileSync(new URL(rel, REPO), 'utf8')) as T;
const sha = (b: Uint8Array): string => createHash('sha256').update(b).digest('hex');
type Plate = { runtime: string; runtimeSha256: string; runtimeSource?: { path: string; sha256: string } };
type ReceiptPlate = { source: string; sourceSha256: string; webp: string; bytes: number; sha256: string; alphaIdentical: boolean; psnr: number; ssim: number; ssimMinBlock: number };
const RECEIPT = json<{ schema: string; encoder: { quality: number; alphaQuality: number }; sets: { id: string; plates: Record<'far' | 'mid' | 'near', ReceiptPlate> }[] }>('audits/ARENA_WEBP_D30_20261002/receipt.json');
const WEBP = ARENA_RUNTIME_FORMATS.find((f) => f.ext === '.webp')!;

describe('D30: every registered arena runs on WebP runtime copies of its PNG runtimes', () => {
  it('the receipt covers every registered set with the chosen encoder settings (lossless alpha)', () => {
    expect(RECEIPT.schema).toBe('cf.arena-webp-receipt/v1');
    expect(RECEIPT.encoder.alphaQuality).toBe(100);
    expect(RECEIPT.encoder.quality).toBe(ARENA_WEBP_OPTIONS.quality);
    const ids = new Set(RECEIPT.sets.map((s) => s.id));
    for (const row of ARENA_SETS) expect(ids.has(row.id), row.id).toBe(true);
  });
  for (const row of ARENA_SETS) it(`${row.id}: WebP runtimes bound to their PNG sources; keyed alpha byte-identical; FAR opaque; fidelity as receipted`, async () => {
    const manifest = json<{ plates: Record<'far' | 'mid' | 'near', Plate> }>(row.delivery), receipt = RECEIPT.sets.find((s) => s.id === row.id)!;
    for (const role of ['far', 'mid', 'near'] as const) {
      const p = manifest.plates[role], runtime = bytes(p.runtime), r = receipt.plates[role];
      expect(p.runtime, `${row.id} ${role}`).toBe(row[role]);
      expect(p.runtime.endsWith('.webp') && WEBP.sniff(runtime), `${row.id} ${role}: ${p.runtime} is WebP`).toBe(true);
      // the receipt is the shipped bytes; the manifest's source is the receipt's PNG, at its pinned hash
      expect([sha(runtime), runtime.length]).toEqual([r.sha256, r.bytes]); expect(r.webp).toBe(p.runtime);
      expect(p.runtimeSource).toEqual({ path: r.source, sha256: r.sourceSha256 }); expect(sha(bytes(r.source))).toBe(r.sourceSha256);
      expect(r.alphaIdentical).toBe(true); expect(r.ssim, `${row.id} ${role} SSIM`).toBeGreaterThanOrEqual(0.97); expect(r.psnr, `${row.id} ${role} PSNR`).toBeGreaterThanOrEqual(30);
      const dec = await decodeRgba(runtime), src = await decodePng(bytes(r.source));
      expect([dec.width, dec.height]).toEqual([src.width, src.height]);
      if (role === 'far') { let translucent = 0; for (let i = 3; i < dec.rgba.length; i += 4) if (dec.rgba[i] !== 255) translucent++; expect(translucent).toBe(0); }
      else expect(alphaDifferences({ ...src, rgba: new Uint8Array(src.rgba) }, dec), `${row.id} ${role}: decoded alpha = PNG alpha`).toBe(0);
    }
  }, 60_000);
  it('the temperate fallback set: measured fidelity (re-computed here) equals the receipt', async () => {
    const t = RECEIPT.sets.find((s) => s.id === 'earth-temperate-v1')!;
    for (const role of ['far', 'mid', 'near'] as const) {
      const r = t.plates[role], src = await decodePng(bytes(r.source)), m = plateMetrics({ ...src, rgba: new Uint8Array(src.rgba) }, await decodeRgba(bytes(r.webp)));
      expect([m.psnr, m.ssim, m.ssimMinBlock]).toEqual([r.psnr, r.ssim, r.ssimMinBlock]);
    }
    expect(t.plates.mid.source).toBe('audits/ARENA_V1_ACCEPTANCE_20260912/arena-mid-despilled.png'); // encoded from the approved despilled MID
  }, 60_000);
});

describe('D30: the pending C132 candidates have WebP delivery manifests that pass the mechanical contract (not registered: acceptance is Dakk\'s)', () => {
  const INVENTORY = json<{ rows: { id: string; manifest: string }[] }>('audits/C132_ARENAS_20261001/complete-candidate-inventory.json').rows;
  const registered = new Set(ARENA_SETS.map((s) => s.id)), pending = INVENTORY.filter((r) => !registered.has(r.id));
  it('36 pending sets, each with a sibling delivery.webp.pending.json; none registered', () => {
    expect(pending).toHaveLength(36); expect(registered.size + pending.length).toBe(45);
  });
  for (const row of pending) it(`${row.id}: the generator admits its WebP manifest; the decoded WebP runtimes pass validateArenaDelivery (key share, alpha, ground line)`, async () => {
    const rel = row.manifest.replace(/delivery\.pending\.json$/, 'delivery.webp.pending.json'), m = json<{ recipe: string; acceptance: string; plates: Record<'far' | 'mid' | 'near', Plate> }>(rel);
    const set = checkArenaDelivery(REPO_PATH, rel, m);
    expect([set.far, set.mid, set.near].every((p) => p.endsWith('.webp'))).toBe(true);
    expect((json<{ qualityAccepted: boolean }>(m.acceptance)).qualityAccepted, 'still pending').toBe(false);
    const v = validateArenaDelivery({ recipe: json(m.recipe), plates: { far: await decodeRgba(bytes(set.far)), mid: await decodeRgba(bytes(set.mid)), near: await decodeRgba(bytes(set.near)) } });
    expect(v.failures).toEqual([]);
  }, 60_000);
});

describe('D30 encoder negative controls', () => {
  /** A keyed test plate with soft (non-binary) alpha edges and painted noise: a lossy alpha encode cannot keep it byte-identical. */
  const synthetic = (): Uint8Array => { const W = 192, H = 128, px = new Uint8Array(W * H * 4); let s = 7;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; s = (Math.imul(s, 1103515245) + 12345) >>> 0;
      const edge = 64 + 18 * Math.sin(x / 9), a = y < edge - 6 ? 0 : y > edge + 6 ? 255 : Math.round(((y - edge + 6) / 12) * 255);
      px[i] = a ? 70 + (s & 63) : 255; px[i + 1] = a ? 90 + ((s >> 6) & 31) : 0; px[i + 2] = a ? 60 : 255; px[i + 3] = a; }
    return px; };
  const pngOf = async (rgba: Uint8Array, width: number, height: number): Promise<Uint8Array> => {
    const { sharp } = await import('../../../../tools/morph/arena-webp.mjs') as unknown as { sharp: (b: Buffer, o: object) => { png(): { toBuffer(): Promise<Buffer> } } };
    return new Uint8Array(await sharp(Buffer.from(rgba), { raw: { width, height, channels: 4 } }).png().toBuffer()); };
  it('control: the D30 settings keep the alpha byte-identical', async () => {
    const out = await encodeArenaPlate(await pngOf(synthetic(), 192, 128), 'mid');
    expect(out.receipt.alphaIdentical).toBe(true);
  });
  it('a lossy-alpha encode (alphaQuality 50) is refused by the alpha check', async () => {
    await expect(encodeArenaPlate(await pngOf(synthetic(), 192, 128), 'near', { alphaQuality: 50 })).rejects.toThrow(/near decoded alpha differs from the PNG runtime at \d+ pixels/);
  });
  it('a FAR with any transparency is refused (FAR is the opaque scene)', async () => {
    await expect(encodeArenaPlate(await pngOf(synthetic(), 192, 128), 'far')).rejects.toThrow(/FAR is not opaque/);
  });
});
