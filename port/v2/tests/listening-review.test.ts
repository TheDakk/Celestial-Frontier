/** L1 Listening page (D15 / N5). OUTCOMES: the roster is truthful (each creature voices its own archetype through its ONE voice card), the
 * page plays byte-for-byte the cue the battle stage plays for that creature, real presses produce exactly the copied text, ratings survive a
 * reload on the device, untrusted presses never play, and the default boot path never loads the page. */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { createCreatureVoiceHook } from '../apps/game/src/soundkit/creature-voices.js';
import { originalSourceLibraryV1 } from '../apps/game/src/soundkit/original-voices.js';
import { creatureVoiceCardV1 } from '../apps/game/src/soundkit/voice-identity.js';
import { CREATURE_CUES } from '../apps/game/src/soundkit/cues.js';
import { ambiencePlanV1, bedJobV1, runJobV1 } from '../apps/game/src/soundkit/ambience.js';
import { renderCombatCueV1 } from '../apps/game/src/soundkit/original-combat.js';
import { musicJobV1, musicPieceV1 } from '../apps/game/src/soundkit/music.js';
import {
  LISTENING_ROSTER_V1, LISTENING_STORAGE_KEY, formatListeningResultsV1, listeningCueV1, listeningExtraItemsV1, listeningExtraRequestV1, listeningItemsV1, listeningRequestV1, mountListeningReviewV1,
  type ListeningAudioPortV1,
} from '../apps/game/src/listening-review.js';

const { JSDOM } = createRequire(import.meta.url)('jsdom') as { JSDOM: new (html: string, o?: { url?: string }) => { window: Window & typeof globalThis & { close(): void } } };
const SOURCES = originalSourceLibraryV1().sources; // the player path's library (D15 Stages 1–2)
const memoryStorage = (): Storage => { const m = new Map<string, string>(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => { m.set(k, String(v)); }, removeItem: (k) => { m.delete(k); }, clear: () => m.clear(), key: (i) => [...m.keys()][i] ?? null, get length() { return m.size; } } as Storage; };

describe('L1 listening review', () => {
  it('the roster is truthful: 13 creatures, one per voice archetype, each voiced through its own card with a source set; 143 items in a fixed order', () => {
    const items = listeningItemsV1();
    expect(items).toHaveLength(LISTENING_ROSTER_V1.length * CREATURE_CUES.length); expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
    expect(items.slice(0, 2).map((i) => i.id)).toEqual(['quadruped.call', 'quadruped.alert']);
    for (const r of LISTENING_ROSTER_V1) {
      const item = items.find((i) => i.earthName === r.earthName)!, card = creatureVoiceCardV1(item.genome);
      expect(card.ok, r.earthName).toBe(true); if (!card.ok) continue;
      expect(card.card.archetype, r.earthName).toBe(r.archetype); expect(SOURCES[card.card.archetype], r.archetype).toBeDefined();
    }
    expect(listeningItemsV1().map((i) => i.id)).toEqual(items.map((i) => i.id)); // deterministic
  });
  it('the page plays byte for byte what the battle stage plays for that creature (one voice per creature)', () => {
    for (const id of ['quadruped.call', 'fish.hurt', 'brachyuran.victory']) {
      const item = listeningItemsV1().find((i) => i.id === id)!, card = creatureVoiceCardV1(item.genome);
      const hook = createCreatureVoiceHook({ sources: SOURCES, seed: 99, sides: { left: { record: null, genome: item.genome, seed: 1, label: 'L', card }, right: { record: null, genome: null, seed: 2, label: 'R' } } });
      const stage = hook({ cueId: `creature:${item.cue}`, source: 'left', atMs: 0 } as never)!, page = listeningCueV1(item, SOURCES);
      expect(page.sampleRate).toBe(stage.sampleRate); expect(Buffer.from(page.samples.buffer).equals(Buffer.from(stage.samples.buffer)), id).toBe(true);
    }
    // control: two different creatures' calls differ
    const [a, b] = ['quadruped.call', 'primate.call'].map((id) => listeningCueV1(listeningItemsV1().find((i) => i.id === id)!, SOURCES));
    expect(Buffer.from(a!.samples.buffer).equals(Buffer.from(b!.samples.buffer))).toBe(false);
  });
  it('each request is one the owner\'s pilot path admits (cf-pilot- key and groups, decorative, bounded duration, non-creature category)', () => {
    const item = listeningItemsV1()[0]!, req = listeningRequestV1(item, listeningCueV1(item, SOURCES));
    expect(req.key.startsWith('cf-pilot-')).toBe(true); expect(req.cooldownGroup.startsWith('cf-pilot-')).toBe(true); expect(req.concurrencyGroup.startsWith('cf-pilot-')).toBe(true);
    expect(req.meaning.kind).toBe('decorative'); expect(['music', 'ambience', 'ui', 'combat-gameplay']).toContain(req.category);
    expect(Number.isSafeInteger(req.maxDurationMs) && req.maxDurationMs! >= 1 && req.maxDurationMs! <= 120_000).toBe(true);
  });
  it('OUTCOME: real presses (play, rate, note, copy) produce exactly the copied text; ratings survive a remount on this device', async () => {
    const dom = new JSDOM('<!doctype html><body></body>'), storage = memoryStorage(); const played: string[] = []; let copied = '';
    const port: ListeningAudioPortV1 = { arm: () => true, play: async (r) => { played.push(r.key); return { kind: 'started' }; }, stop: () => {} };
    const opts = { doc: dom.window.document, port, commit: 'c0ffee', ua: 'iPhone test', storage, readPackDigest: async () => 'digest-1', copyText: async (t: string) => { copied = t; }, sources: SOURCES, trusted: () => true };
    const page = mountListeningReviewV1(opts), row = (id: string) => page.root.querySelector(`[data-listen-item="${id}"]`)!;
    (row('quadruped.call').querySelector('[data-listen-play]') as HTMLButtonElement).click();
    (row('quadruped.call').querySelector('[data-listen-rate="keep"]') as HTMLButtonElement).click();
    (row('fish.hurt').querySelector('[data-listen-rate="cut"]') as HTMLButtonElement).click();
    const note = row('fish.hurt').querySelector('input') as HTMLInputElement; note.value = 'too  harsh   on speaker'; note.dispatchEvent(new dom.window.Event('change'));
    (page.root.querySelector('[data-listen-copy]') as HTMLButtonElement).click(); for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0));
    expect(played).toEqual(['cf-pilot-listen-quadruped-call']);
    expect(copied).toBe([
      'Celestial Frontier — L1 listening review (D15, original sources: voices, combat, ambience, music)', 'commit: c0ffee', 'pack: digest-1', 'device: iPhone test',
      'order: iPhone speaker first, then headphones', 'rated: 2 of 217 (keep 1 · redo 0 · cut 1)', 'quadruped.call | keep', 'fish.hurt | cut | too harsh on speaker',
    ].join('\n'));
    expect(JSON.parse(storage.getItem(LISTENING_STORAGE_KEY)!).ratings['fish.hurt']).toEqual({ rating: 'cut', note: 'too  harsh   on speaker' });
    page.dispose();
    const again = mountListeningReviewV1(opts); expect(again.ratings()).toEqual({ 'quadruped.call': { rating: 'keep', note: '' }, 'fish.hurt': { rating: 'cut', note: 'too  harsh   on speaker' } });
    expect(await again.resultsText()).toBe(copied); again.dispose(); dom.window.close();
  });
  it('CONTROLS: an untrusted (synthetic) press never plays; Sound off never plays; a rating change changes the copied text; no digest reads "unavailable"', async () => {
    const dom = new JSDOM('<!doctype html><body></body>'); const played: string[] = [];
    const port = (armed: boolean): ListeningAudioPortV1 => ({ arm: () => armed, play: async (r) => { played.push(r.key); return { kind: 'started' }; }, stop: () => {} });
    const base = { doc: dom.window.document, commit: 'c', ua: 'u', storage: null, readPackDigest: async () => { throw new Error('offline'); }, sources: SOURCES };
    const untrusted = mountListeningReviewV1({ ...base, port: port(true) }); // default trust = event.isTrusted (false for a synthetic click)
    (untrusted.root.querySelector('[data-listen-play]') as HTMLButtonElement).click(); untrusted.dispose();
    const muted = mountListeningReviewV1({ ...base, port: port(false), trusted: () => true });
    (muted.root.querySelector('[data-listen-play]') as HTMLButtonElement).click();
    expect(played).toEqual([]); expect(muted.root.querySelector('[data-listen-status]')!.textContent).toContain('Sound is off');
    const before = await muted.resultsText(); expect(before).toContain('pack: unavailable');
    (muted.root.querySelector('[data-listen-item="quadruped.alert"] [data-listen-rate="redo"]') as HTMLButtonElement).click();
    expect(await muted.resultsText()).not.toBe(before); muted.dispose(); dom.window.close();
    expect(formatListeningResultsV1({ commit: 'c', packDigest: 'p', ua: 'u', ratings: {} })).toContain('rated: 0 of 217');
  });
  it('D15 Stages 2–3: every combat cue, ambience family, weather layer and music piece is on the page and plays EXACTLY what the game plays (control: another item gives other bytes)', () => {
    const extra = listeningExtraItemsV1();
    expect(extra).toHaveLength(49 + 10 + 4 + 11);
    const captured = (req: ReturnType<typeof listeningExtraRequestV1>): Float32Array[] => { const out: Float32Array[] = [];
      req.create({ currentTime: 0, createBuffer: (c: number, n: number) => { const bufs = Array.from({ length: c }, () => new Float32Array(n)); return { copyToChannel: (s: Float32Array, ch: number) => { bufs[ch]!.set(s); out[ch] = bufs[ch]!; } }; },
        createBufferSource: () => ({ buffer: null, connect() {}, start() {}, stop() {}, disconnect() {} }), createGain: () => ({ gain: { setValueAtTime() {} }, connect() {}, disconnect() {} }) } as never, { voiceId: 'x' } as never); return out; };
    const same = (a: Float32Array, b: Float32Array) => a.length === b.length && Buffer.from(a.buffer, a.byteOffset, a.byteLength).equals(Buffer.from(b.buffer, b.byteOffset, b.byteLength));
    const hit = extra.find((i) => i.id === 'combat.battle:hitstop-thump')!, req = listeningExtraRequestV1(hit);
    expect(req.key.startsWith('cf-pilot-listen-')).toBe(true); expect(req.meaning).toEqual({ kind: 'decorative' });
    expect(same(captured(req)[0]!, renderCombatCueV1('battle:hitstop-thump', 7, { amount: 25 }).samples)).toBe(true);
    const bed = extra.find((i) => i.id === 'bed.coast')!, game = runJobV1(bedJobV1(ambiencePlanV1('opensea')))!, got = captured(listeningExtraRequestV1(bed));
    expect(same(got[0]!, game.left) && same(got[1]!, game.right)).toBe(true);
    const music = extra.find((i) => i.id === 'music.sting-victory')!; expect(same(captured(listeningExtraRequestV1(music))[0]!, runJobV1(musicJobV1(musicPieceV1('sting-victory'))))).toBe(true);
    expect(same(captured(listeningExtraRequestV1(extra.find((i) => i.id === 'music.sting-defeat')!))[0]!, runJobV1(musicJobV1(musicPieceV1('sting-victory'))))).toBe(false);
  }, 300_000);
});

/** The default boot path never loads the page: main.ts reaches it ONLY through a dynamic import inside the built-package audioReview flag. */
function listeningImportIsFlagGated(main: string): boolean {
  if (/^\s*import\s[^;]*from\s+['"]\.\/listening-review\.js['"]/mu.test(main)) return false;
  const refs = [...main.matchAll(/import\(\s*['"]\.\/listening-review\.js['"]\s*\)/gu)]; if (refs.length !== 1) return false;
  const gate = main.indexOf("if (!import.meta.env.DEV && new URLSearchParams(location.search).get('audioReview') === '1') {"), at = refs[0]!.index!;
  return gate >= 0 && at > gate && !main.slice(gate, at).includes('\n}');
}
describe('the Listening page stays off the default path', () => {
  it('main.ts imports it only dynamically inside its flag; control: a static import or an ungated dynamic import is caught', () => {
    const main = readFileSync(new URL('../apps/game/src/main.ts', import.meta.url), 'utf8');
    expect(listeningImportIsFlagGated(main)).toBe(true);
    expect(listeningImportIsFlagGated("import { mountListeningReviewV1 } from './listening-review.js';\n" + main)).toBe(false);
    expect(listeningImportIsFlagGated(main.replace("if (!import.meta.env.DEV && new URLSearchParams(location.search).get('audioReview') === '1') {", 'if (true) {'))).toBe(false);
  });
});
