/* The art agent's own finished maps, read where they lie, as a measure taken by hand: these tests run only when
   CF_PLANET_KITS names the folder of the kits, and are skipped otherwise. The gate names no such folder, so it reads
   nothing outside this repository and counts the same on every machine. */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { loneRuns, mendMap, type GlobeLayer } from '../src/index';
import { flicker } from './planet-support';

function kitsFolder(): string | undefined {
  const named = process.env['CF_PLANET_KITS'];
  return named !== undefined && named !== '' && existsSync(named) ? named : undefined;
}
const KITS = kitsFolder();
const has = (...path: string[]): boolean => KITS !== undefined && existsSync(join(KITS, ...path));

/** A kit's text grid as a layer: one character a pixel, `.` clear, then 1 to 9 and a to g. Each value is given a
 *  colour of its own, so every change of value shows. */
function textLayer(path: string): GlobeLayer {
  const rows = readFileSync(path, 'utf8').split('\n').filter((line) => line.length > 0);
  const [w, h] = [rows[0]!.length, rows.length];
  const values = new Uint8Array(w * h);
  rows.forEach((line, y) => { for (let x = 0; x < w; x++) values[y * w + x] = '.123456789abcdefg'.indexOf(line[x]!); });
  return { w, h, values, colours: Array.from({ length: 16 }, (_, i) => 0x0f0d0b * (i + 1)) };
}
/** A PNG of eight-bit red, green, blue and alpha, not interlaced, as a layer: each colour a value, a pixel under half
 *  alpha clear. */
function pngLayer(path: string): GlobeLayer {
  const file = readFileSync(path);
  const [w, h] = [file.readUInt32BE(16), file.readUInt32BE(20)];
  if (file[24] !== 8 || file[25] !== 6 || file[28] !== 0) throw new Error(`${path}: not an eight-bit RGBA picture`);
  const parts: Buffer[] = [];
  for (let at = 8; at < file.length;) {
    const length = file.readUInt32BE(at);
    if (file.toString('latin1', at + 4, at + 8) === 'IDAT') parts.push(file.subarray(at + 8, at + 8 + length));
    at += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(parts));
  const line = w * 4;
  const out = new Uint8Array(line * h);
  for (let y = 0; y < h; y++) {
    const filter = raw[y * (line + 1)]!;
    for (let x = 0; x < line; x++) {
      const a = x >= 4 ? out[y * line + x - 4]! : 0;
      const b = y > 0 ? out[(y - 1) * line + x]! : 0;
      const c = x >= 4 && y > 0 ? out[(y - 1) * line + x - 4]! : 0;
      const p = a + b - c;
      const paeth = Math.abs(p - a) <= Math.abs(p - b) && Math.abs(p - a) <= Math.abs(p - c) ? a : Math.abs(p - b) <= Math.abs(p - c) ? b : c;
      out[y * line + x] = (raw[y * (line + 1) + 1 + x]! + [0, a, b, (a + b) >> 1, paeth][filter]!) & 255;
    }
  }
  const colours: number[] = [];
  const values = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    if (out[i * 4 + 3]! < 128) continue;
    const rgb = (out[i * 4]! << 16) | (out[i * 4 + 1]! << 8) | out[i * 4 + 2]!;
    values[i] = (colours.includes(rgb) ? colours.indexOf(rgb) : colours.push(rgb) - 1) + 1;
  }
  return { w, h, values, colours };
}

const LEANS = [0, 14, -67] as const;
/** How often a globe flickers over a full turn at each of three leans, summed, and the share of pixel-steps that do,
 *  in percent, at the worst of them. */
function worst(surface: GlobeLayer, clouds: GlobeLayer | undefined, lag: number): { flickers: number; share: number } {
  const width = surface.w === 384 ? 129 : 65;
  let [flickers, share] = [0, 0];
  for (const tilt of LEANS) {
    const found = flicker(width, surface.w, surface.h, tilt, surface, clouds, lag);
    flickers += found.flickers;
    // The disc is about 0.785 of the square.
    share = Math.max(share, Math.round((found.flickers * 10_000) / (surface.w * width * width * 0.785)) / 100);
  }
  return { flickers, share };
}
const mended = (layer: GlobeLayer): { layer: GlobeLayer; rewritten: number } => {
  const values = layer.values.slice();
  return { rewritten: mendMap(values, layer.w, layer.h), layer: { ...layer, values } };
};
const tell = (line: string): void => console.log(line);

describe.skipIf(KITS === undefined)('the art agent\'s finished maps (run by hand: skipped unless CF_PLANET_KITS names the kits\' folder)', () => {
  for (const size of ['384', '192'] as const) {
    it.skipIf(!has('gas', 'world-wrap', `map-${size}.txt`))(`gas, ${size} wide: reports its one-pixel runs and its flicker, and after mendMap has neither`, () => {
      const map = textLayer(join(KITS!, 'gas', 'world-wrap', `map-${size}.txt`));
      expect([map.w, map.h]).toEqual(size === '384' ? [384, 128] : [192, 64]);
      expect(Math.min(...map.values)).toBeGreaterThan(0);
      const before = worst(map, undefined, 0);
      const fixed = mended(map);
      const after = worst(fixed.layer, undefined, 0);
      tell(`gas map ${map.w} by ${map.h}: ${loneRuns(map.values, map.w, map.h)} one-pixel runs, flicker ${before.flickers} (${before.share}% of pixel-steps at worst); mendMap rewrote ${fixed.rewritten} pixels of ${map.w * map.h}; after: ${loneRuns(fixed.layer.values, map.w, map.h)} runs, flicker ${after.flickers}`);
      expect(loneRuns(fixed.layer.values, map.w, map.h)).toBe(0);
      expect(after.flickers).toBe(0);
      // A pixel that joins the lone pixel beside it leaves neither alone, so fewer are rewritten than stood alone.
      expect(fixed.rewritten).toBeLessThanOrEqual(loneRuns(map.values, map.w, map.h));
    });
  }
  for (const size of ['384x128', '192x64'] as const) {
    it.skipIf(!has('terran', 'world', `surface-${size}.png`) || !has('terran', 'world', `clouds-${size}.png`))(`terran, ${size}: reports the same of its surface and its clouds, and after mendMap neither flickers, the clouds riding or drifting`, () => {
      const surface = pngLayer(join(KITS!, 'terran', 'world', `surface-${size}.png`));
      const clouds = pngLayer(join(KITS!, 'terran', 'world', `clouds-${size}.png`));
      expect(`${surface.w}x${surface.h} ${clouds.w}x${clouds.h}`).toBe(`${size} ${size}`);
      expect(Math.min(...surface.values)).toBeGreaterThan(0);
      const before = [worst(surface, undefined, 0), worst(surface, clouds, 0), worst(surface, clouds, 8)];
      const [land, sky] = [mended(surface), mended(clouds)];
      const after = [worst(land.layer, undefined, 0), worst(land.layer, sky.layer, 0), worst(land.layer, sky.layer, 8), worst(land.layer, sky.layer, 2)];
      tell(`terran surface ${size}: ${loneRuns(surface.values, surface.w, surface.h)} one-pixel runs, flicker ${before[0]!.flickers} (${before[0]!.share}%); mendMap rewrote ${land.rewritten} pixels; after: flicker ${after[0]!.flickers}`);
      tell(`terran clouds ${size}: ${loneRuns(clouds.values, clouds.w, clouds.h)} one-pixel runs; over the surface, riding: flicker ${before[1]!.flickers} (${before[1]!.share}%), drifting: ${before[2]!.flickers} (${before[2]!.share}%); mendMap rewrote ${sky.rewritten} pixels; after: flicker ${after[1]!.flickers} riding, ${after[2]!.flickers} and ${after[3]!.flickers} drifting`);
      for (const layer of [land.layer, sky.layer]) expect(loneRuns(layer.values, layer.w, layer.h)).toBe(0);
      expect(after.map((found) => found.flickers)).toEqual([0, 0, 0, 0]);
    });
  }
});
