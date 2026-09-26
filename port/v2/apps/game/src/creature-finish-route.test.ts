/** G5 routing (audits/G5_ROUTING_20260926/README.md). Outcomes on REAL fits, each with a control: the card kernel reproduces the
 * shipped card masters byte for byte; a real fit routed through Codex's engine and back out of the store yields the individual's
 * card master (an identity finish reproduces the shipped card exactly); phones never construct a model; lookups never infer; and
 * the card source draws a retained finished master only when it belongs to the drawn painting. */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { speciesVisualKey } from '@cf/art/species-identity';
import { creatureOriginalKey, type AiCreatureInputV1, type AiCreatureOriginalStoreV1, type AiCreatureOriginalV1 } from './creature-originals.js';
import type { CreatureFinishInferV1 } from './creature-finish-engine.js';
import { boxDownscaleV1, cardDimsV1, cardEligibleV1, createCreatureFinishRouteV1, finishTierV1, type FinishFitBytesV1 } from './creature-finish-route.js';
import { LocalModelSha256V1 } from './local-model-sha256.js';
import { decodePng } from './morph/png-decode.js';
import { CARD_ARCHETYPES } from './morph/card-archetypes.js';
import { PaintedCardSource, type FinishedCardMasterV1, type PaintedCardAssets } from './morph/painted-card-source.js';
import { BATTLE2_PARTS_FITS } from './battle2-archetypes.js';

const REPO = new URL('../../../../../', import.meta.url);
const read = (p: string) => new Uint8Array(readFileSync(new URL(p, REPO)));
const hash = (b: Uint8Array) => new LocalModelSha256V1().update(b).digestHex();
const fitDir = (name: string) => 'audits/' + BATTLE2_PARTS_FITS.find((f) => f.earthName === name)!.dir.replace(/^\.\.\//, '');
const cardDir = (name: string) => CARD_ARCHETYPES.find((a) => a.earthName === name)!.dir;
const fitBytes = (name: string): FinishFitBytesV1 => { const d = fitDir(name), record = JSON.parse(readFileSync(new URL(d + 'record.json', REPO), 'utf8'));
  return { record, masterPng: read(record.source), labelsPng: read(d + 'labels.png'), binding: read(d + 'binding.json') }; };
function memoryStore() { const rows = new Map<string, AiCreatureOriginalV1>(); const find = async (i: AiCreatureInputV1) => rows.get(creatureOriginalKey(i)) ?? null;
  const store: AiCreatureOriginalStoreV1 = { find, read: find, close() {}, async retain(i, blob, receipt) { const key = creatureOriginalKey(i); if (rows.has(key)) throw Error('immutable');
    const row = { key, blob, receipt, sha256: hash(new Uint8Array(await blob.arrayBuffer())) }; rows.set(key, row); return row; } };
  return { store, rows }; }
const identity: CreatureFinishInferV1 = async (s) => ({ rgba: s.rgba.slice(), labels: s.labels.slice(), binding: s.binding.slice() });
const crab = (seed = 5) => ({ _earthName: 'Crab', kingdom: 'fauna', seed, color: 12, accent: 3, size: 0, head: 0, tail: 1, pattern: 0 });
const identityOf = (g: Readonly<Record<string, unknown>>) => ({ visualKey: speciesVisualKey(g as Record<string, unknown>), seed: Number(g.seed) >>> 0 });

describe('G5 routing', () => {
  it('tier: only a desktop-class device with the full probe capability finishes on the device', () => {
    expect(finishTierV1({ supported: true }, 'desktop')).toBe('desktop');
    expect(finishTierV1({ supported: false }, 'desktop')).toBe('phone'); expect(finishTierV1({ supported: true }, 'phone')).toBe('phone'); expect(finishTierV1(null, 'desktop')).toBe('phone');
  });
  it('CARD KERNEL: the box kernel over (master RGB + keyed alpha) reproduces the shipped card master byte for byte; card-eligible = the master\'s own alpha is the keyed alpha (control: the opaque keyed Civet is not)', async () => {
    for (const name of ['Crab', 'Salmon', 'Wolf', 'Civet']) {
      const d = fitDir(name), record = JSON.parse(readFileSync(new URL(d + 'record.json', REPO), 'utf8')), master = await decodePng(read(record.source)), keyed = await decodePng(read(d + 'parts/keyed.png'));
      const withKeyed = new Uint8Array(master.rgba); for (let i = 3; i < withKeyed.length; i += 4) withKeyed[i] = keyed.rgba[i]!;
      const dims = cardDimsV1(master.width, master.height), shipped = await decodePng(read(cardDir(name) + 'card/master-512.png'));
      expect([shipped.width, shipped.height], name).toEqual([dims.width, dims.height]);
      expect(Buffer.from(boxDownscaleV1(withKeyed, master.width, master.height, dims.width, dims.height)).equals(Buffer.from(shipped.rgba)), name).toBe(true);
      expect(cardEligibleV1(master.rgba, keyed.rgba), name).toBe(name !== 'Civet');
    }
  }, 120_000);
  it('END TO END on the real Crab fit: lookup never infers; a desktop enqueue retains once; the retained identity finish comes back as exactly the shipped card master; a second creature is its own finish', async () => {
    const m = memoryStore(); let creates = 0, calls = 0;
    const route = createCreatureFinishRouteV1({ tier: 'desktop', store: m.store, modelHash: 'b'.repeat(64), identityOf,
      fitFor: async (g) => (g._earthName === 'Crab' ? fitBytes('Crab') : null), createInfer: async () => { creates++; return async (s) => { calls++; return identity(s); }; } });
    expect(await route.lookup(crab())).toBeNull(); expect(creates).toBe(0); // a miss reads the store only
    expect(await route.enqueue(crab())).toBe('retained'); expect(calls).toBe(1);
    const f = await route.lookup(crab()); expect(f).not.toBeNull();
    const shipped = await decodePng(read(cardDir('Crab') + 'card/master-512.png'));
    expect([f!.width, f!.height]).toEqual([shipped.width, shipped.height]); expect(Buffer.from(f!.rgba).equals(Buffer.from(shipped.rgba))).toBe(true);
    expect(f!.recordRecipeHash).toBe(fitBytes('Crab').record.recipeHash);
    expect(await route.enqueue(crab())).toBe('retained'); expect(calls).toBe(1); // cached, not re-inferred
    expect(await route.enqueue(crab(6))).toBe('retained'); expect(calls).toBe(2); expect(m.rows.size).toBe(2); // another creature, another finish
    expect(await route.enqueue({ _earthName: 'Nope', kingdom: 'fauna', seed: 1 })).toBe('no-source'); expect(await route.lookup({ _earthName: 'Nope', kingdom: 'fauna', seed: 1 })).toBeNull();
    route.close();
  }, 180_000);
  it('PHONE: never constructs a model and never enqueues, but reads an original a desktop retained in the same store', async () => {
    const m = memoryStore(), fitFor = async (g: Readonly<Record<string, unknown>>) => (g._earthName === 'Crab' ? fitBytes('Crab') : null);
    const desktop = createCreatureFinishRouteV1({ tier: 'desktop', store: m.store, modelHash: 'b'.repeat(64), identityOf, fitFor, createInfer: async () => identity });
    expect(await desktop.enqueue(crab())).toBe('retained');
    let creates = 0; const phone = createCreatureFinishRouteV1({ tier: 'phone', store: m.store, modelHash: 'b'.repeat(64), identityOf, fitFor, createInfer: async () => { creates++; throw Error('phone model'); } });
    expect(await phone.enqueue(crab())).toBe('not-desktop'); expect(await phone.lookup(crab())).not.toBeNull(); expect(await phone.lookup(crab(7))).toBeNull(); expect(creates).toBe(0);
  }, 180_000);
  it('CARD HOOK: a finished master of the drawn painting changes the card (and is tagged); null or another painting\'s finish leaves it byte-identical (controls)', async () => {
    const assets: PaintedCardAssets = { json: async (p) => JSON.parse(readFileSync(new URL(p, REPO), 'utf8')), bytes: async (p) => read(p) };
    const registry = CARD_ARCHETYPES.filter((a) => a.earthName === 'Crab'), now = () => Promise.resolve();
    const shipped = await decodePng(read(cardDir('Crab') + 'card/master-512.png')), recipe = JSON.parse(readFileSync(new URL(cardDir('Crab') + 'record.json', REPO), 'utf8')).recipeHash as string;
    const altered = new Uint8Array(shipped.rgba); for (let i = 0; i < altered.length; i += 4) if (altered[i + 3]) { altered[i] = 255 - altered[i]!; altered[i + 1] = 255 - altered[i + 1]!; }
    const finished = (f: FinishedCardMasterV1 | null) => new PaintedCardSource({ assets, registry, yieldToHost: now, finished: async () => f });
    const plain = await new PaintedCardSource({ assets, registry, yieldToHost: now }).card(crab(), 'portrait')!;
    const own = await finished({ sha256: 'f'.repeat(64), recordRecipeHash: recipe, width: shipped.width, height: shipped.height, rgba: altered }).card(crab(), 'portrait')!;
    const none = await finished(null).card(crab(), 'portrait')!, other = await finished({ sha256: 'e'.repeat(64), recordRecipeHash: '0'.repeat(64), width: shipped.width, height: shipped.height, rgba: altered }).card(crab(), 'portrait')!;
    expect(own.url).not.toBe(plain.url); expect(own.finishedSha256).toBe('f'.repeat(64));
    expect(none.url).toBe(plain.url); expect(none.finishedSha256).toBeUndefined();
    expect(other.url).toBe(plain.url); expect(other.finishedSha256).toBeUndefined();
    expect(own.key).toBe(plain.key); // the lease key stays the species visual key (ownership reports stay truthful)
  }, 180_000);
});
