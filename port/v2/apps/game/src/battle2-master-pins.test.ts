/** C13 (2026-09-25) — the build-generated master pins and their runtime byte preflight. OUTCOMES, both directions:
 * the generator reproduces the checked-in module byte for byte from the retained inputs and refuses a tampered master, malformed
 * or duplicate pins and non-canonical paths; authority is identity (clones, JSON copies and look-alikes refuse before a single
 * record field is read); the preflight admits the genuine SERVED bytes of every archetype and refuses each tampered input at its
 * own check, with a genuine control before and after the negatives. The wiring order (no decode/cache/master fetch before a
 * refused preflight) is proven in battle2-wiring.test.ts. */
import { servedArt } from './art-library.fixtures.js';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from './battle2/parts-rig.fixtures.js';
import { BATTLE2_PARTS_FITS } from './battle2-archetypes.js';
import * as PinModule from './battle2-master-pins.generated.js';
import { getBattle2MasterPin, isBattle2MasterPin } from './battle2-master-pins.generated.js';
import { Battle2PinRefusal, gunzipTransportBytes, preflightBattle2PinnedBytesV1, type Battle2PinnedBytesV1 } from './battle2-master-pin-admission.js';
import { repoPathOfAsset } from './battle2-wiring.js';
import { CARD_ARCHETYPES } from '../../../tools/morph/build-card-masters.mjs';
import { PINS_MODULE, admitAndPinArchetype, buildBattle2MasterPins, renderBattle2MasterPinsModule, validatePins } from '../../../tools/morph/battle2-master-pins.mjs';
import { canonicalRepoPath } from '../../../tools/morph/battle2-pin-contract.mjs';
import { repoRelativeSource } from '../../../tools/creature-animation/record-source.mjs';
import { hashBytes } from '../../../tools/creature-animation/quadruped-template.mjs';

const ROOT = fileURLToPath(REPO_ROOT);
const SERVED = new URL('port/v2/apps/game/public/battle2/audits/ARENA_EFFECTS_V42_PROOF_20260912/', REPO_ROOT);
const served = (assetPath: string): Uint8Array => new Uint8Array(readFileSync(servedArt(assetPath)));
const servedJson = <T,>(assetPath: string): T => JSON.parse(readFileSync(servedArt(assetPath), 'utf8')) as T;

/** The genuine served bytes of one fit, exactly as the wiring fetches them. */
async function servedInput(fit: (typeof BATTLE2_PARTS_FITS)[number]): Promise<Battle2PinnedBytesV1> {
  const manifest = servedJson<{ creatureId: string }>(fit.dir + 'parts/manifest.json'), record = servedJson<unknown>(fit.dir + 'record.json');
  const alphaAsset = fit.dir + 'parts/alpha.png', atlasAsset = fit.dir + 'parts/atlas/' + manifest.creatureId + '.png';
  return { pin: getBattle2MasterPin(manifest.creatureId), creatureId: manifest.creatureId, record, alphaPath: repoPathOfAsset(alphaAsset), alpha: served(alphaAsset),
    bindingBytes: await gunzipTransportBytes(served(fit.dir + 'binding.json.gz')), atlasPath: repoPathOfAsset(atlasAsset), atlas: served(atlasAsset) };
}
const refusalOf = async (input: Battle2PinnedBytesV1): Promise<string> => { try { await preflightBattle2PinnedBytesV1(input); return 'admitted'; } catch (e) { return e instanceof Battle2PinRefusal ? e.code : `other: ${String(e)}`; } };
const flip = (bytes: Uint8Array, at = bytes.length >> 1): Uint8Array => { const out = bytes.slice(); out[at] = out[at]! ^ 0x01; return out; };

describe('the generator (build time)', () => {
  it('regenerates the checked-in module byte for byte from the retained inputs (drift), twice', async () => {
    const onDisk = readFileSync(path.join(ROOT, PINS_MODULE), 'utf8');
    const a = await buildBattle2MasterPins(CARD_ARCHETYPES), b = await buildBattle2MasterPins(CARD_ARCHETYPES);
    expect(a.source).toBe(b.source);
    expect(a.source, 're-run `node tools/morph/battle2-master-pins.mjs` (or build-shipped-battle2.mjs) after changing the archetype list').toBe(onDisk);
    expect(a.pins).toHaveLength(CARD_ARCHETYPES.length);
  }, 60_000);
  it('every fighting archetype has exactly one pin, and its served alpha/binding/atlas bytes are the pinned ones', async () => {
    for (const fit of BATTLE2_PARTS_FITS) expect(await refusalOf(await servedInput(fit)), fit.earthName).toBe('admitted');
  }, 60_000);
  it('refuses a tampered retained master (full byte admission gates the pin) — and a genuine copy pins identically (control)', async () => {
    const civet = CARD_ARCHETYPES.find((a) => a.earthName === 'Civet')!, record = JSON.parse(readFileSync(path.join(ROOT, civet.dir, 'record.json'), 'utf8'));
    const master = repoRelativeSource(record.source), man = JSON.parse(readFileSync(path.join(ROOT, civet.dir, 'parts/manifest.json'), 'utf8'));
    const files = [master, civet.dir + 'record.json', civet.dir + 'binding.json', civet.dir + 'parts/keyed.png', civet.dir + 'parts/manifest.json', civet.dir + 'parts/atlas/' + man.creatureId + '.png'];
    const tmp = mkdtempSync(path.join(tmpdir(), 'c13-pin-'));
    try {
      for (const f of files) { mkdirSync(path.dirname(path.join(tmp, f)), { recursive: true }); copyFileSync(path.join(ROOT, f), path.join(tmp, f)); }
      const genuine = await admitAndPinArchetype(civet, tmp);
      expect(genuine).toEqual(getBattle2MasterPin(man.creatureId));
      const bytes = readFileSync(path.join(tmp, master)); bytes[bytes.length - 20] = bytes[bytes.length - 20]! ^ 0x01; writeFileSync(path.join(tmp, master), bytes);
      await expect(admitAndPinArchetype(civet, tmp)).rejects.toThrow(/cut-out hash/);
      copyFileSync(path.join(ROOT, master), path.join(tmp, master));
      const atlas = path.join(tmp, civet.dir + 'parts/atlas/' + man.creatureId + '.png'), ab = readFileSync(atlas); ab[ab.length - 20] = ab[ab.length - 20]! ^ 0x01; writeFileSync(atlas, ab);
      await expect(admitAndPinArchetype(civet, tmp)).rejects.toThrow(/atlas hash/);
    } finally { rmSync(tmp, { recursive: true, force: true }); }
  }, 60_000);
  it('refuses duplicate ids, malformed hashes/dimensions/fields, non-canonical paths and an empty table (a valid table passes)', () => {
    const good = { ...getBattle2MasterPin('civet')! };
    expect(() => validatePins([good])).not.toThrow();
    expect(renderBattle2MasterPinsModule([good])).toContain("creatureId: 'civet'");
    expect(() => validatePins([good, { ...good }])).toThrow(/duplicate creatureId/);
    expect(() => validatePins([])).toThrow(/empty/);
    expect(() => validatePins([{ ...good, atlasSha256: 'ABC' }])).toThrow(/malformed atlasSha256/);
    expect(() => validatePins([{ ...good, alphaWidth: 0 }])).toThrow(/malformed alphaWidth/);
    expect(() => validatePins([{ ...good, extra: 1 }])).toThrow(/fields must be exactly/);
    expect(() => validatePins([{ ...good, admittedBy: 'asserted' }])).toThrow(/admittedBy/);
    for (const bad of ['audits/a/../b.png', 'audits\\a.png', '/audits/a.png', './audits/a.png', 'audits//a.png', 'https://x/a.png', 'audits/a.png?x', 'audits/a.png#x', 'audits/%2e%2e/a.png'])
      expect(() => validatePins([{ ...good, masterPath: bad }]), bad).toThrow(/non-canonical masterPath/);
  });
  it('canonicalRepoPath is exact: accepts a plain repo path, refuses every other spelling (no resolving, no decoding)', () => {
    expect(canonicalRepoPath('audits/X/fit-01/parts/alpha.png')).toBe('audits/X/fit-01/parts/alpha.png');
    for (const bad of ['', '/a', 'a/', 'a//b', 'a/./b', 'a/../b', '..', '.', 'a\\b', 'file:a', 'a?b', 'a#b', 'a%2Fb', 'a\u0000b', 'a\nb', 42, null]) expect(canonicalRepoPath(bad), JSON.stringify(bad)).toBeNull();
  });
});

describe('authority is identity (runtime)', () => {
  it('the module exports lookup + identity validation only — no table, Map, register or factory', () => {
    expect(Object.keys(PinModule).sort()).toEqual(['BATTLE2_MASTER_PINS_SCHEMA', 'getBattle2MasterPin', 'isBattle2MasterPin']);
  });
  it('a genuine pin is frozen and recognised; spread, JSON, structuredClone, prototype-derived and hand-built look-alikes are not', () => {
    const pin = getBattle2MasterPin('civet')!;
    expect(isBattle2MasterPin(pin)).toBe(true); expect(Object.isFrozen(pin)).toBe(true);
    expect(() => { (pin as { masterSha256: string }).masterSha256 = '0'.repeat(64); }).toThrow(TypeError);
    for (const fake of [{ ...pin }, JSON.parse(JSON.stringify(pin)), structuredClone(pin), Object.create(pin), Object.freeze({ ...pin }), null, undefined, 'civet'])
      expect(isBattle2MasterPin(fake)).toBe(false);
    expect(getBattle2MasterPin('no-such-creature')).toBeUndefined();
    expect(getBattle2MasterPin(undefined as unknown as string)).toBeUndefined();
  });
});

describe('the preflight refuses each tampered input at its own check (genuine control before and after)', () => {
  const salmon = BATTLE2_PARTS_FITS.find((f) => f.earthName === 'Salmon')!, civet = BATTLE2_PARTS_FITS.find((f) => f.earthName === 'Civet')!;
  it('negatives', async () => {
    const g = await servedInput(salmon), other = await servedInput(civet);
    expect(await refusalOf(g)).toBe('admitted');
    const admitted = await preflightBattle2PinnedBytesV1(g);
    expect(admitted.binding).toEqual(JSON.parse(gunzipSync(served(salmon.dir + 'binding.json.gz')).toString('utf8')));
    // 1. identity: a clone pin refuses BEFORE any record field is read (a counting proxy proves it)
    let reads = 0; const watched = new Proxy(g.record as object, { get: (t, k, r) => { reads++; return Reflect.get(t, k, r); } });
    expect(await refusalOf({ ...g, record: watched, pin: { ...(g.pin as object) } })).toBe('untrusted-pin-authority'); expect(reads).toBe(0);
    expect(await refusalOf({ ...g, pin: JSON.parse(JSON.stringify(g.pin)) })).toBe('untrusted-pin-authority');
    expect(await refusalOf({ ...g, pin: undefined })).toBe('untrusted-pin-authority');
    expect(await refusalOf({ ...g, pin: other.pin })).toBe('pin-creature-mismatch'); // another creature's genuine pin
    expect(await refusalOf({ ...g, pin: other.pin, creatureId: other.creatureId })).toBe('record-mismatch'); // …even when the caller renames it
    // 2. the record
    const r = structuredClone(g.record) as { landmarks: Record<string, number[]>; recipeHash: string; source: string };
    const firstJoint = Object.keys(r.landmarks)[0]!; r.landmarks[firstJoint] = [r.landmarks[firstJoint]![0]! + 1e-6, r.landmarks[firstJoint]![1]!];
    expect(await refusalOf({ ...g, record: r })).toBe('record-mismatch');
    expect(await refusalOf({ ...g, record: { ...(g.record as object), source: 'audits/OTHER/master.png' } })).toBe('record-mismatch');
    // 4. paths and alpha
    expect(await refusalOf({ ...g, alphaPath: g.alphaPath.replace('/parts/', '/parts/../parts/') })).toBe('path-mismatch');
    expect(await refusalOf({ ...g, alphaPath: g.alphaPath.replace(/\//g, '\\') })).toBe('path-mismatch');
    expect(await refusalOf({ ...g, atlasPath: other.atlasPath })).toBe('path-mismatch');
    expect(await refusalOf({ ...g, alpha: flip(g.alpha) })).toBe('alpha-mismatch');
    expect(await refusalOf({ ...g, alpha: other.alpha })).toBe('alpha-mismatch');
    // 5. binding (exact decompressed bytes — the .gz transport itself is not what is pinned) and atlas
    expect(await refusalOf({ ...g, bindingBytes: served(salmon.dir + 'binding.json.gz') })).toBe('binding-mismatch');
    expect(await refusalOf({ ...g, bindingBytes: new TextEncoder().encode(JSON.stringify(JSON.parse(new TextDecoder().decode(g.bindingBytes)))) })).toBe('binding-mismatch'); // a reserialisation
    expect(await refusalOf({ ...g, bindingBytes: flip(g.bindingBytes) })).toBe('binding-mismatch');
    expect(await refusalOf({ ...g, atlas: flip(g.atlas) })).toBe('atlas-mismatch');
    // genuine control AFTER the negatives
    expect(await refusalOf(await servedInput(salmon))).toBe('admitted');
  }, 60_000);
  it('gunzipTransportBytes decompresses a .gz body and passes an already-decoded body through unchanged', async () => {
    // compared by hash: never a deep equality over multi-MB typed arrays (PROCESS trap)
    const gz = served(civet.dir + 'binding.json.gz'), raw = new Uint8Array(gunzipSync(gz)), out = await gunzipTransportBytes(gz);
    expect(out.length).toBe(raw.length); expect(await hashBytes(out)).toBe(await hashBytes(raw));
    expect(await gunzipTransportBytes(raw)).toBe(raw);
  }, 60_000);
});
