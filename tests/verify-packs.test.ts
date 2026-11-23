import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { REPO_ROOT } from '../tools/tracked-files.mjs';
import { verifyPacks } from '../tools/verify-packs.mjs';

const TEXT = 'part catalogue text\n';
const made: string[] = [];
afterEach(() => { for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true }); });

/** A temporary manifest naming one pack of TEXT, and a packs folder holding `onDisk` under that name (or nothing). */
function setup(onDisk: string | null, manifestText?: string): { manifestPath: string; packsDir: string } {
  const dir = mkdtempSync(join(tmpdir(), 'verify-packs-'));
  made.push(dir);
  const packsDir = join(dir, 'art-packs');
  mkdirSync(packsDir);
  const entry = { name: 'quadruped', kind: 'parts', file: 'quadruped-v1.txt', bytes: Buffer.byteLength(TEXT), sha256: createHash('sha256').update(TEXT).digest('hex') };
  const manifestPath = join(dir, 'manifest.json');
  writeFileSync(manifestPath, manifestText ?? JSON.stringify({ format: 1, packs: [entry] }));
  if (onDisk !== null) writeFileSync(join(packsDir, entry.file), onDisk);
  return { manifestPath, packsDir };
}
function run(at: { manifestPath: string; packsDir: string }): { status: number | null; stdout: string; stderr: string } {
  const r = spawnSync(process.execPath, ['tools/verify-packs.mjs', '--manifest', at.manifestPath, '--packs', at.packsDir], { cwd: REPO_ROOT, encoding: 'utf8' });
  return { status: r.status, stdout: r.stdout, stderr: r.stderr };
}

describe('verify-packs', () => {
  it('exits 0 when a present pack matches its manifest entry', () => {
    const r = run(setup(TEXT));
    expect(r).toMatchObject({ status: 0, stderr: '' });
    expect(r.stdout).toBe('pack quadruped: ok\nverify-packs: ok\n');
  });

  it('exits 1 when a present pack does not match', () => {
    const changed = run(setup(TEXT.replace('part', 'pact')));
    expect(changed.status).toBe(1);
    expect(changed.stderr).toBe('pack quadruped: quadruped-v1.txt is present with the wrong hash\n');
    expect(changed.stdout).toBe('');
    const longer = run(setup(TEXT + '\n'));
    expect(longer.status).toBe(1);
    expect(longer.stderr).toBe('pack quadruped: quadruped-v1.txt is present with the wrong size\n');
  });

  it('an absent pack is reported as stand-ins, not an error', () => {
    const r = run(setup(null));
    expect(r).toMatchObject({ status: 0, stderr: '' });
    expect(r.stdout).toBe('pack quadruped: absent, the stand-ins are used\nverify-packs: ok\n');
  });

  it('exits 1 on a manifest it cannot read', () => {
    expect(run(setup(TEXT, '{ "format": 2, "packs": [] }'))).toMatchObject({ status: 1, stderr: 'pack manifest: unknown format\n' });
    expect(run(setup(TEXT, 'not json')).status).toBe(1);
  });

  it('lists the present packs that are right, for the build to copy', async () => {
    expect((await verifyPacks(setup(TEXT))).present.map((p) => p.file)).toEqual(['quadruped-v1.txt']);
    expect((await verifyPacks(setup(null))).present).toEqual([]);
    expect((await verifyPacks(setup('other'))).present).toEqual([]);
  });
});
