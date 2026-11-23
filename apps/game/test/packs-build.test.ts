import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { sha256Hex } from '../src/packs/sha256';
import { packsForBuild } from '../vite.config';

const TEXT = 'interface sheet text\n';
const made: string[] = [];
afterEach(() => { for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true }); });

function places(onDisk: string | null): { manifestPath: string; packsDir: string } {
  const dir = mkdtempSync(join(tmpdir(), 'packs-build-'));
  made.push(dir);
  const packsDir = join(dir, 'art-packs');
  mkdirSync(packsDir);
  const bytes = new TextEncoder().encode(TEXT);
  const manifestPath = join(dir, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify({ format: 1, packs: [{ name: 'interface', kind: 'interface', file: 'interface-v1.txt', bytes: bytes.length, sha256: sha256Hex(bytes) }] }));
  if (onDisk !== null) writeFileSync(join(packsDir, 'interface-v1.txt'), onDisk);
  return { manifestPath, packsDir };
}

describe('art packs in a build', () => {
  it('the build fails when a present pack does not match', async () => {
    await expect(packsForBuild(places(TEXT.replace('sheet', 'sheep')))).rejects.toThrow(/art packs refused:\npack interface: interface-v1.txt is present with the wrong hash/);
    await expect(packsForBuild(places(TEXT + TEXT))).rejects.toThrow(/wrong size/);
  });

  it('a present pack that matches is shipped; an absent one is left to the stand-ins', async () => {
    expect((await packsForBuild(places(TEXT))).map((p) => p.file)).toEqual(['interface-v1.txt']);
    expect(await packsForBuild(places(null))).toEqual([]);
  });

  it('the build fails when the manifest cannot be read', async () => {
    const at = places(TEXT);
    writeFileSync(at.manifestPath, '{ "format": 7, "packs": [] }');
    await expect(packsForBuild(at)).rejects.toThrow(/unknown format/);
  });
});
