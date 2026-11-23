import { describe, expect, it } from 'vitest';
import { PACK_MAX_BYTES, checkPackBytes } from '../src/packs/manifest';
import { parseManifest } from '../src/packs';
import type { PackEntry } from '../src/packs/manifest';
import { sha256Hex } from '../src/packs/sha256';
import shipped from '../../../packs/manifest.json' with { type: 'json' };

const bytes = Uint8Array.from('part catalogue text\n', (ch) => ch.charCodeAt(0));
const entry: PackEntry = { name: 'quadruped', kind: 'parts', file: 'quadruped-v1.txt', bytes: bytes.length, sha256: sha256Hex(bytes) };
const manifestOf = (...packs: unknown[]): unknown => ({ format: 1, packs });

describe('pack manifest', () => {
  it('a well-formed manifest is read as it stands', () => {
    const second = { ...entry, name: 'interface', kind: 'interface', file: 'interface-v1.txt' };
    expect(parseManifest(manifestOf(entry, second))).toEqual({ format: 1, packs: [entry, second] });
    expect(parseManifest(manifestOf())).toEqual({ format: 1, packs: [] });
    expect(parseManifest(manifestOf({ ...entry, bytes: 1 })).packs[0]!.bytes).toBe(1);
    expect(parseManifest(manifestOf({ ...entry, bytes: PACK_MAX_BYTES })).packs[0]!.bytes).toBe(15_728_640);
  });

  it('the manifest on this branch is well formed', () => {
    expect(() => parseManifest(shipped)).not.toThrow();
  });

  it('a manifest with a repeated name, a bad hash or a pack over 15 MB is refused', () => {
    expect(() => parseManifest(manifestOf(entry, { ...entry, file: 'other.txt' }))).toThrow(/repeated name quadruped/);
    expect(() => parseManifest(manifestOf({ ...entry, sha256: entry.sha256.slice(1) }))).toThrow(/hash/);
    expect(() => parseManifest(manifestOf({ ...entry, sha256: entry.sha256.toUpperCase() }))).toThrow(/hash/);
    expect(() => parseManifest(manifestOf({ ...entry, sha256: 'g' + entry.sha256.slice(1) }))).toThrow(/hash/);
    expect(() => parseManifest(manifestOf({ ...entry, bytes: PACK_MAX_BYTES + 1 }))).toThrow(/size/);
    expect(() => parseManifest(manifestOf({ ...entry, bytes: 0 }))).toThrow(/size/);
    expect(() => parseManifest(manifestOf({ ...entry, bytes: 10.5 }))).toThrow(/size/);
  });

  it('an unknown format or a malformed entry is refused', () => {
    expect(() => parseManifest({ format: 2, packs: [] })).toThrow(/format/);
    expect(() => parseManifest({ packs: [] })).toThrow(/format/);
    expect(() => parseManifest(null)).toThrow(/format/);
    expect(() => parseManifest({ format: 1 })).toThrow(/packs/);
    expect(() => parseManifest(manifestOf('quadruped'))).toThrow(/pack 0/);
    expect(() => parseManifest(manifestOf({ ...entry, name: '' }))).toThrow(/name/);
    expect(() => parseManifest(manifestOf({ ...entry, kind: 'sounds' }))).toThrow(/kind/);
  });

  it('a pack file is a plain file name, never a path', () => {
    for (const file of ['../quadruped-v1.txt', 'sub/quadruped-v1.txt', '/quadruped-v1.txt', '.hidden', '', 'a\\b.txt', 'a b.txt']) {
      expect(() => parseManifest(manifestOf({ ...entry, file })), file).toThrow(/file/);
    }
  });

  it('bytes with the listed hash and size pass; one changed byte is wrong-hash; a different length is wrong-size', () => {
    expect(checkPackBytes(entry, bytes)).toEqual({ ok: true });
    const changed = bytes.slice();
    changed[3] = changed[3]! ^ 1;
    expect(checkPackBytes(entry, changed)).toEqual({ ok: false, reason: 'wrong-hash' });
    expect(checkPackBytes(entry, bytes.subarray(1))).toEqual({ ok: false, reason: 'wrong-size' });
    const longer = new Uint8Array(bytes.length + 1);
    longer.set(bytes);
    expect(checkPackBytes(entry, longer)).toEqual({ ok: false, reason: 'wrong-size' });
  });
});
