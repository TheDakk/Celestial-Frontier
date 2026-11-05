/** Exact float-output pins per CPU architecture (FINISH 2026-11-04, hosted run 2 on PR #46).
 *
 * Node 26's V8 Math (sin, cos, tan, atan, atan2, pow, exp, log, asin, acos, …) returns a different last ulp on x64 than on arm64 for
 * roughly 1 % of inputs (measured with the same v26.13.0 under Rosetta, and reproduced exactly by the hosted Linux x64 runner:
 * audits/FINISH_20261104/x64-libm.md). World generation is unaffected (the root 50-probe fingerprint matches on x64); only tests that
 * pin the BYTES of presentation floats (poses, timelines, stage frames) are architecture-bound.
 *
 * So such a pin holds per architecture, and nothing is loosened: on arm64 (where every original pin was captured) the ORIGINAL exact
 * assertion runs unchanged; on another architecture the output's sha256 must equal that architecture's pin, recorded from the same
 * tree whose arm64 output equals the original pin. An architecture with no pin file entry fails loudly. Capture
 * (CF_CAPTURE_ARCH_PINS=1) is refused on arm64 and only ever adds a non-arm64 pin. */
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { afterAll, expect } from 'vitest';

const sha = (v: unknown): string => createHash('sha256').update(typeof v === 'string' ? v : JSON.stringify(v)).digest('hex');

export interface ArchPins {
  /** arm64: the original assertion. Elsewhere: sha256(actual) equals this architecture's pin for `key`. */
  check(key: string, actual: unknown, arm64: () => void): void;
  /** negative control for a pinned key: arm64 runs `arm64`; elsewhere sha256(actual) must DIFFER from the pin for `key`. */
  differs(key: string, actual: unknown, arm64: () => void): void;
}

export function archPins(pinFile: URL, arch: string = process.arch): ArchPins {
  const capture = process.env.CF_CAPTURE_ARCH_PINS === '1';
  if (capture && arch === 'arm64') throw new Error('arch pins: arm64 holds the original captures; capture only adds a non-arm64 pin');
  const all: Record<string, Record<string, string>> = fs.existsSync(pinFile) ? JSON.parse(fs.readFileSync(pinFile, 'utf8')) : {};
  const mine = all[arch] ?? {}, seen: Record<string, string> = {};
  if (capture) afterAll(() => { all[arch] = { ...mine, ...seen }; fs.writeFileSync(pinFile, JSON.stringify(all, null, 1) + '\n'); });
  const pinOf = (key: string): string => {
    const pin = mine[key];
    if (typeof pin !== 'string') throw new Error(`arch pins: no ${arch} pin for "${key}" in ${pinFile.pathname} (capture it on ${arch} with CF_CAPTURE_ARCH_PINS=1)`);
    return pin;
  };
  return {
    check(key, actual, arm64) {
      if (arch === 'arm64') { arm64(); return; }
      if (capture) { seen[key] = sha(actual); return; }
      expect(sha(actual), `${arch} pin ${key}`).toBe(pinOf(key));
    },
    differs(key, actual, arm64) {
      if (arch === 'arm64') { arm64(); return; }
      if (capture) return;
      expect(sha(actual), `${arch} negative control ${key}`).not.toBe(pinOf(key));
    },
  };
}
