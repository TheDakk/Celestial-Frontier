/* D15 Stage 0: the shipped pack's AUDIO section and its 12 MiB cap (N5_AUDIO.md "a build gate with a one-byte-over control"). The gate
   runs in the PWA build's writeBundle over the exact shipped inventory (runtime assets + battle2 files), beside the 128 MiB pack gate. */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SHIPPED_AUDIO_BYTE_LIMIT, __pwaBuildTestOnly } from '../apps/game/pwa-build.js';

const { shippedAudioSection } = __pwaBuildTestOnly;

describe('shipped audio section (12 MiB cap)', () => {
  it('the cap is exactly 12 MiB', () => { expect(SHIPPED_AUDIO_BYTE_LIMIT).toBe(12 * 1024 * 1024); });
  it('exactly at the cap passes; ONE byte over is refused by name', () => {
    const at = shippedAudioSection([{ path: 'assets/a.opus', bytes: SHIPPED_AUDIO_BYTE_LIMIT - 10 }, { path: 'assets/b.m4a', bytes: 10 }]);
    expect(at).toMatchObject({ schema: 'cf-pwa-audio-section/v1', bytes: SHIPPED_AUDIO_BYTE_LIMIT, limitBytes: SHIPPED_AUDIO_BYTE_LIMIT });
    expect(() => shippedAudioSection([{ path: 'assets/a.opus', bytes: SHIPPED_AUDIO_BYTE_LIMIT - 10 }, { path: 'assets/b.m4a', bytes: 11 }])).toThrow(/shipped audio exceeds 12 MiB/u);
  });
  it('only audio counts: a 100 MiB script is not audio; audio extensions are case-insensitive and cover the codecs we may ship', () => {
    const s = shippedAudioSection([{ path: 'assets/index.js', bytes: 100 * 1024 * 1024 }, { path: 'battle2/x.png', bytes: 5 }, { path: 'a/B.OPUS', bytes: 3 }, { path: 'a/c.wav', bytes: 4 }, { path: 'a/d.aac', bytes: 5 }]);
    expect(s.bytes).toBe(12); expect(s.files.map((f) => f.path)).toEqual(['a/B.OPUS', 'a/c.wav', 'a/d.aac']);
    // control: the same 100 MiB named as audio is refused
    expect(() => shippedAudioSection([{ path: 'assets/index.ogg', bytes: 100 * 1024 * 1024 }])).toThrow(/exceeds 12 MiB/u);
  });
  it('an invalid audio byte count is refused', () => {
    for (const bad of [-1, 1.5, Number.NaN]) expect(() => shippedAudioSection([{ path: 'a.opus', bytes: bad }])).toThrow(/invalid audio byte count/u);
  });
  it('the build calls the gate over the SAME inventory as the 128 MiB pack gate (source check; negative-controlled by deleting the call)', () => {
    const src = readFileSync(new URL('../apps/game/pwa-build.ts', import.meta.url), 'utf8');
    const call = "shippedAudioSection([...writtenFiles, ...battle2Files.map((file) => ({ path: file.path, bytes: file.bytes }))]);";
    expect(src.split(call).length - 1).toBe(1);
    // G3: the pack gate's inventory goes through shippedPackByteInputsV1 (runtime + battle2; the on-demand art library is outside the pack)
    const packGate = src.indexOf('assertShippedPackBytes(shippedPackByteInputsV1({ runtime: writtenAssetByteCounts, battle2: battle2Files.map((file) => file.bytes)'), audioGate = src.indexOf(call);
    expect(packGate).toBeGreaterThan(0); expect(audioGate).toBeGreaterThan(packGate); expect(audioGate - packGate).toBeLessThan(400); // beside it, in writeBundle
    // negative control run by hand (2026-09-25): deleting the call from pwa-build.ts fails this test
  });
});
