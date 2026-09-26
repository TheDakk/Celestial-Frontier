/** G3 build contract (audits/G3_ART_DELIVERY_20260926): the on-demand art library never enters the 128 MiB shipped pack, and the build
 * admits the library only when its whole inventory matches its manifest and the bundled pin names that manifest. */
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { __pwaBuildTestOnly, shippedPackByteInputsV1 } from '../apps/game/pwa-build.js';
import { verifyArtLibraryFiles } from '../apps/game/pwa-art-library.js';
import { ART_LIBRARY_MANIFEST_PIN } from '../apps/game/src/art-library.generated.js';

const sha = (b: Buffer | string) => createHash('sha256').update(b).digest('hex');
const dirs: string[] = []; afterEach(() => { for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true }); });
function site(files: Record<string, string>, manifestFiles = files): string {
  const root = mkdtempSync(join(tmpdir(), 'cf-art-lib-')); dirs.push(root);
  for (const [p, body] of Object.entries(files)) { mkdirSync(join(root, p, '..'), { recursive: true }); writeFileSync(join(root, p), body); }
  mkdirSync(join(root, 'library'), { recursive: true });
  writeFileSync(join(root, 'library/art-library.json'), JSON.stringify({ schema: 'cf-art-library/v1', files: Object.entries(manifestFiles).map(([p, b]) => ({ path: p, bytes: Buffer.byteLength(b), sha256: sha(b) })) }));
  return root;
}

describe('G3: the art library is outside the pack', () => {
  it('growing the library never changes the pack total; moving the same bytes INTO the pinned battle2 files does (control)', () => {
    const runtime = [1_000_000, 2_000_000], battle2 = [3_000_000];
    const total = (inputs: number[]) => __pwaBuildTestOnly.assertShippedPackBytes(inputs, 10_000);
    const small = total(shippedPackByteInputsV1({ runtime, battle2, library: 0 })), huge = total(shippedPackByteInputsV1({ runtime, battle2, library: 5 * 1024 ** 3 }));
    expect(huge).toBe(small); // a 5 GiB library costs the pack nothing
    expect(total(shippedPackByteInputsV1({ runtime, battle2: [...battle2, 40_000_000], library: 0 }))).toBe(small + 40_000_000);
    // and the cap still fires for the pack itself, one byte over
    expect(() => total(shippedPackByteInputsV1({ runtime: [134_217_728 - 10_000], battle2: [1], library: 0 }))).toThrow(/exceeds 128 MiB/u);
  });
  it('the build admits exactly the manifest\'s inventory: an unlisted file, a changed byte, or a missing file each refuse', () => {
    const files = { 'library/cards/wolf/card.json': '{"w":1}', 'library/battle2/audits/X/atlas.png': 'atlas' };
    const pin = verifyArtLibraryFiles(site(files))!;
    expect(pin.files).toBe(2); expect(pin.libraryBytes).toBe(Buffer.byteLength('{"w":1}') + 5); expect(pin.sha256).toMatch(/^[a-f0-9]{64}$/u);
    expect(() => verifyArtLibraryFiles(site({ ...files, 'library/cards/extra.png': 'x' }, files))).toThrow(/inventory differs/u);
    const changed = site(files); writeFileSync(join(changed, 'library/cards/wolf/card.json'), '{"w":2}');
    expect(() => verifyArtLibraryFiles(changed)).toThrow(/bytes differ from pin/u);
    expect(() => verifyArtLibraryFiles(site({ 'library/cards/wolf/card.json': '{"w":1}' }, files))).toThrow(/inventory differs/u);
  });
  it('the real shipped library matches its manifest, and the bundled pin names those exact manifest bytes', () => {
    const pub = new URL('../apps/game/public/', import.meta.url).pathname, pin = verifyArtLibraryFiles(pub)!;
    expect(pin.sha256).toBe(ART_LIBRARY_MANIFEST_PIN.sha256); expect(pin.bytes).toBe(ART_LIBRARY_MANIFEST_PIN.bytes); expect(pin.files).toBe(ART_LIBRARY_MANIFEST_PIN.files);
    expect(sha(readFileSync(join(pub, ART_LIBRARY_MANIFEST_PIN.path)))).toBe(ART_LIBRARY_MANIFEST_PIN.sha256);
  });
});
