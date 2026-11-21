/* Second fixture source: tools/baseline.json — the 50-probe determinism
   fingerprint captured from v1.0 and held ever since. Where golden-seeds.json
   gives volume on sampled generators, baseline.json gives BREADTH: names,
   constants, descriptors, codecs.

   Values in the fingerprint are SANITIZED (tools/probe.js san(): numbers
   rounded to 1e-9, object keys sorted) and then JSON round-tripped. So parity
   here is: san(ours) deep-equals stored — compared via canon() JSON strings.
   ⚠ The recipes in each test MUST mirror tools/probe.js exactly; they are part
   of the fixture contract, same rule as the golden generator wrappers. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEFAULT_BASELINE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'fixtures', 'v1', 'baseline.json');

/** The fixture's `fingerprint` object; errors name the file when it is missing, truncated or has no fingerprint. */
export function loadBaseline(p: string = DEFAULT_BASELINE): Record<string, unknown> {
  let raw: { fingerprint?: unknown } | null;
  try {
    raw = JSON.parse(fs.readFileSync(p, 'utf8')) as { fingerprint?: unknown } | null;
  } catch (e) {
    throw new Error('cannot load fixture ' + path.basename(p) + ': ' + (e as Error).message);
  }
  if (!raw || typeof raw.fingerprint !== 'object' || raw.fingerprint === null) {
    throw new Error('fixture ' + path.basename(p) + ' has no fingerprint');
  }
  return raw.fingerprint as Record<string, unknown>;
}

let _fp: Record<string, unknown> | null = null;
function fp(): Record<string, unknown> {
  if (!_fp) _fp = loadBaseline();
  return _fp;
}
/** The stored form: a JSON string of the sanitized value (probe.js stringifies). */
export function probeRaw(name: string): string {
  const v = fp()[name];
  if (v === undefined) throw new Error('baseline.json has no probe ' + name);
  return v as string;
}
/** The stored value, parsed back to a live structure. */
export function probeParsed(name: string): unknown { return JSON.parse(probeRaw(name)); }
