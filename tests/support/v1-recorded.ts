/* Recorded answers from the v1 game file, for the tests that once read that file live.
   tools/record-v1-fixtures.mjs writes them to fixtures/v1/recorded/<name>.json; each file is named
   after the test it serves. Loading is strict: a missing or malformed file, a missing field or an
   empty case list throws, so a test can never pass against a fixture that is not there. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type RecordedV1Kind = 'outputs' | 'hash' | 'needles';

export interface RecordedV1Fixture {
  /** outputs: v1 function results; hash: SHA-256 and byte length of v1 text; needles: string presence. */
  kind: RecordedV1Kind;
  /** The v1 file the answers were taken from, with its hash. */
  source: string;
  cases: unknown[];
}

const KINDS: readonly string[] = ['outputs', 'hash', 'needles'];
const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DEFAULT_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'fixtures', 'v1', 'recorded');

function invalid(fx: Record<string, unknown>): string | null {
  if (typeof fx.kind !== 'string' || !KINDS.includes(fx.kind)) return 'kind must be one of outputs, hash, needles';
  if (typeof fx.source !== 'string' || fx.source.length === 0) return 'source must be a non-empty string';
  if (!Array.isArray(fx.cases)) return 'cases must be an array';
  return null;
}

export function loadRecorded(name: string, dir: string = DEFAULT_DIR): RecordedV1Fixture {
  const fail = (reason: string): Error => new Error(`cannot load recorded v1 fixture ${name}: ${reason}`);
  if (!NAME.test(name)) throw fail('a fixture name is lower-case words joined by hyphens');
  let fx: unknown;
  try {
    fx = JSON.parse(fs.readFileSync(path.join(dir, `${name}.json`), 'utf8'));
  } catch (e) {
    throw fail((e as NodeJS.ErrnoException).code === 'ENOENT' ? 'file not found' : (e as Error).message);
  }
  if (typeof fx !== 'object' || fx === null || Array.isArray(fx)) throw fail('the file is not a JSON object');
  const reason = invalid(fx as Record<string, unknown>);
  if (reason !== null) throw fail(reason);
  const fixture = fx as RecordedV1Fixture;
  if (fixture.cases.length === 0) throw new Error(`recorded v1 fixture ${name} has no cases`);
  return fixture;
}
