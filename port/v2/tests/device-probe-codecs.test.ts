/** H1 codec decode check (D15 Stage 0). The page logic against a fake AudioContext for every outcome, a corrupted-sample control that must
 * report failure (never success) even when the decoder would accept it, and the real page's Run → Copy text. */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { CODEC_PROBE_SAMPLES_V1 } from '../apps/game/src/device-probe-codec-samples.js';
import { formatCodecProbeV1, mountDeviceProbeV1, runCodecProbeV1, type DecodedBufferLike, type ProbeAudioContextLike } from '../apps/game/src/device-probe.js';
import { sha256Hex } from '../apps/game/src/soundkit/derive.js';

const { JSDOM } = createRequire(import.meta.url)('jsdom') as { JSDOM: new (html: string) => { window: Window & { close(): void } } };
const tone = (ms = 120, sampleRate = 48_000, amp = 0.5): DecodedBufferLike => {
  const n = Math.round((ms / 1000) * sampleRate), data = new Float32Array(n); for (let i = 0; i < n; i++) data[i] = amp * Math.sin((2 * Math.PI * 440 * i) / sampleRate);
  return { length: n, duration: n / sampleRate, sampleRate, numberOfChannels: 1, getChannelData: () => data };
};
const ctxWith = (decode: (bytes: Uint8Array) => Promise<DecodedBufferLike>): (() => ProbeAudioContextLike) => () => ({ sampleRate: 48_000, decodeAudioData: (b) => decode(new Uint8Array(b)) });
const isOpus = (b: Uint8Array) => CODEC_PROBE_SAMPLES_V1.some((s) => s.codec === 'opus' && sha256Hex(b) === s.sha256);

describe('H1 codec decode check', () => {
  it('the embedded samples are the recorded bytes (SHA-256 and length), two codecs across five containers', () => {
    expect(CODEC_PROBE_SAMPLES_V1.map((s) => s.id)).toEqual(['opus-ogg', 'opus-webm', 'opus-caf', 'aac-m4a', 'aac-adts']);
    for (const s of CODEC_PROBE_SAMPLES_V1) { const b = Buffer.from(s.base64, 'base64'); expect(b.length, s.id).toBe(s.bytes); expect(sha256Hex(new Uint8Array(b)), s.id).toBe(s.sha256); }
  });
  it('every sample decodes → PASS, recommendation opus', async () => {
    const r = await runCodecProbeV1({ createContext: ctxWith(async () => tone()), ua: 'test-ua', canPlayType: () => 'maybe' });
    expect(r.rows.map((x) => x.status)).toEqual(['pass', 'pass', 'pass', 'pass', 'pass']); expect(r.recommendation).toBe('opus'); expect(r.contextSampleRate).toBe(48_000);
  });
  it('Opus rejected by the decoder → UNSUPPORTED, AAC passes → recommendation aac', async () => {
    const r = await runCodecProbeV1({ createContext: ctxWith(async (b) => { if (isOpus(b)) throw Object.assign(new Error('Unable to decode audio data'), { name: 'EncodingError' }); return tone(120, 44_100); }), ua: 'ua' });
    expect(r.rows.filter((x) => x.codec === 'opus').every((x) => x.status === 'unsupported')).toBe(true);
    expect(r.rows.filter((x) => x.codec === 'aac').every((x) => x.status === 'pass')).toBe(true); expect(r.recommendation).toBe('aac');
  });
  it('no AudioContext → every row UNSUPPORTED, recommendation none', async () => {
    const r = await runCodecProbeV1({ createContext: () => { throw new TypeError('AudioContext is not a constructor'); }, ua: 'ua' });
    expect(r.rows.every((x) => x.status === 'unsupported' && /no AudioContext/.test(x.reason))).toBe(true); expect(r.recommendation).toBe('none');
  });
  it('a decode that resolves to silence or the wrong length is a FAIL, not a pass', async () => {
    const silent = await runCodecProbeV1({ createContext: ctxWith(async () => tone(120, 48_000, 0)), ua: 'ua' });
    expect(silent.rows.every((x) => x.status === 'fail')).toBe(true); expect(silent.recommendation).toBe('none');
    const long = await runCodecProbeV1({ createContext: ctxWith(async () => tone(2_000)), ua: 'ua' }); expect(long.rows.every((x) => x.status === 'fail')).toBe(true);
  });
  it('CONTROL — a corrupted embedded sample reports FAILURE even though this decoder would accept anything', async () => {
    const corrupt = CODEC_PROBE_SAMPLES_V1.map((s, i) => (i === 0 ? { ...s, base64: (s.base64[0] === 'A' ? 'B' : 'A') + s.base64.slice(1) } : s));
    const r = await runCodecProbeV1({ createContext: ctxWith(async () => tone()), ua: 'ua', samples: corrupt });
    expect(r.rows[0]).toMatchObject({ id: 'opus-ogg', status: 'fail', reason: expect.stringContaining('SHA-256') });
    expect(r.rows.slice(1).every((x) => x.status === 'pass')).toBe(true);
  });
  it('the page: Run then Copy produce exactly the formatted report', async () => {
    const dom = new JSDOM('<!doctype html><body></body>'); let copied = '';
    const page = mountDeviceProbeV1({ doc: dom.window.document, commit: 'abc123', ua: 'iPhone test', createContext: ctxWith(async (b) => { if (isOpus(b)) throw new Error('no'); return tone(120, 44_100); }), copyText: async (t) => { copied = t; } });
    const report = await page.run(); (page.root.querySelector('[data-probe-copy]') as HTMLButtonElement).click(); await new Promise((r) => setTimeout(r, 0));
    expect(copied).toBe(formatCodecProbeV1(report, { commit: 'abc123' }));
    expect(copied).toContain('recommendation: aac'); expect(copied).toContain('device: iPhone test'); expect(copied.split('\n').filter((l) => / \| (pass|fail|unsupported) \| /.test(l))).toHaveLength(5);
    page.dispose(); dom.window.close();
  });
});

/** The default boot path never loads the probe: main.ts reaches it ONLY through a dynamic import inside the `deviceProbe=1` flag. */
function probeImportIsFlagGated(main: string): boolean {
  if (/^\s*import\s[^;]*from\s+['"]\.\/device-probe(?:-codec-samples)?\.js['"]/mu.test(main)) return false; // a static import runs on every boot
  const refs = [...main.matchAll(/import\(\s*['"]\.\/device-probe\.js['"]\s*\)/gu)];
  if (refs.length !== 1) return false;
  const gate = main.indexOf("if (new URLSearchParams(location.search).get('deviceProbe') === '1') {"), at = refs[0]!.index!;
  return gate >= 0 && at > gate && !main.slice(gate, at).includes('\n}'); // inside the flag's block, before it closes
}
describe('the probe stays off the default path', () => {
  it('main.ts imports the probe only dynamically inside its flag; control: a static import or an ungated dynamic import is caught', () => {
    const main = readFileSync(new URL('../apps/game/src/main.ts', import.meta.url), 'utf8');
    expect(probeImportIsFlagGated(main)).toBe(true);
    expect(probeImportIsFlagGated("import { mountDeviceProbeV1 } from './device-probe.js';\n" + main)).toBe(false);
    expect(probeImportIsFlagGated(main.replace("if (new URLSearchParams(location.search).get('deviceProbe') === '1') {", 'if (true) {'))).toBe(false);
  });
});
