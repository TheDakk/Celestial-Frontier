import { describe, expect, it } from 'vitest';
import { parseStrictCF1Code } from '@cf/scene';

const GALAXY = 'CF1-eyJ0IjoiZyIsImciOls5MCwtNjAsNzgsMCwwLjYyLDAuNSw5OTksMV19';
const STAR = 'CF1-eyJ0IjoicyIsImciOls5MCwtNjAsNzgsMCwwLjYyLDAuNSw5OTksMV0sInMiOls1NjAsMTcwLDQyNDI0Ml19';
const EARTH = 'CF1-eyJ0IjoicCIsImciOls5MCwtNjAsNzgsMCwwLjYyLDAuNSw5OTksMV0sInMiOls1NjAsMTcwLDQyNDI0Ml0sInAiOjEzM30';
const FORGED_SOL = 'CF1-eyJ0IjoicyIsImciOls5MCwtNjAsNzgsMCwwLjYyLDAuNSw5OTksMV0sInMiOls1NjAuMDEsMTcwLDQyNDI0Ml19';

function codeOfBytes(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return 'CF1-' + btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function codeOf(value: unknown): string {
  return codeOfBytes(new TextEncoder().encode(JSON.stringify(value)));
}

function galaxyWithInvalidUtf8Name(): Uint8Array {
  const before = new TextEncoder().encode('{"t":"g","g":[90,-60,78,0,0.62,0.5,999,1],"n":"');
  const after = new TextEncoder().encode('"}');
  const bytes = new Uint8Array(before.length + 1 + after.length);
  bytes.set(before);
  bytes[before.length] = 0x80; // isolated continuation byte
  bytes.set(after, before.length + 1);
  return bytes;
}

describe('@cf/scene — strict public CF1 code parsing', () => {
  it('keeps all three exact hierarchy tiers distinct', () => {
    expect(parseStrictCF1Code(GALAXY)).toEqual({
      kind: 'valid', tier: 'galaxy', name: null,
      candidate: { galaxy: { seed: 999, x: 90, y: -60 } },
    });
    expect(parseStrictCF1Code(STAR)).toEqual({
      kind: 'valid', tier: 'star', name: null,
      candidate: {
        galaxy: { seed: 999, x: 90, y: -60 },
        star: { seed: 424242, x: 560, y: 170 },
      },
    });
    expect(parseStrictCF1Code(EARTH)).toEqual({
      kind: 'valid', tier: 'planet', name: null,
      candidate: {
        galaxy: { seed: 999, x: 90, y: -60 },
        star: { seed: 424242, x: 560, y: 170 },
        planet: { seed: 133 },
      },
    });
  });

  it('separates exact raw shape from generator provenance', () => {
    const parsed = parseStrictCF1Code(FORGED_SOL);
    expect(parsed).toMatchObject({ kind: 'valid', tier: 'star' });
    if (parsed.kind !== 'valid' || parsed.tier !== 'star') throw new Error('expected raw star candidate');
    expect(parsed.candidate.star.x).toBe(560.01);
    /* The canonical resolver, not this byte parser, owns the later source
       rejection. This positive control prevents a parser-only "fix" from
       masquerading as hierarchy proof. */
  });

  it('treats malformed marked input as an invalid code, never text search', () => {
    expect(parseStrictCF1Code('ordinary Compendium words')).toEqual({ kind: 'not-code' });
    for (const malformed of [
      'CF1-not-base64',
      codeOf(null),
      codeOf({ t: 'g', g: [90, -60, 78, 0, 0.62, 0.5, '999', 1] }),
      codeOf({ t: 's', g: [90, -60, 78, 0, 0.62, 0.5, 999, 1], s: [560.001, 170, 424242] }),
      codeOf({ t: 'p', g: [90, -60, 78, 0, 0.62, 0.5, 999, 1], s: [560, 170, 424242] }),
      codeOf({ t: 'g', g: [90, -60, 78, 0, 0.62, 0.5, 999, 1], s: [560, 170, 424242] }),
      codeOf({ t: 'g', g: [90, -60, 78, 0, 0.62, 0.5, 999, 1], extra: true }),
      'CF1-' + 'a'.repeat(8192),
    ]) expect(parseStrictCF1Code(malformed), malformed.slice(0, 50)).toEqual({ kind: 'invalid' });
  });

  it('bounds input before scanning for a CF1 marker', () => {
    let scanned = false;
    const oversized = {
      length: 8193,
      indexOf: () => {
        scanned = true;
        return -1;
      },
    } as unknown as string;
    expect(parseStrictCF1Code(oversized)).toEqual({ kind: 'invalid' });
    expect(scanned).toBe(false);
    expect(parseStrictCF1Code('x'.repeat(8193))).toEqual({ kind: 'invalid' });
  });

  it('rejects malformed UTF-8 instead of accepting replacement-decoded JSON', () => {
    const bytes = galaxyWithInvalidUtf8Name();
    const replacementDecoded = JSON.parse(new TextDecoder().decode(bytes)) as { n: string };
    expect(replacementDecoded.n).toBe('\ufffd');
    expect(parseStrictCF1Code(codeOfBytes(bytes))).toEqual({ kind: 'invalid' });
  });

  it('preserves a bounded optional name for post-proof cleaning', () => {
    const named = codeOf({
      t: 'p', g: [90, -60, 78, 0, 0.62, 0.5, 999, 1],
      s: [560, 170, 424242], p: 133, n: 'Blue Home',
    });
    expect(parseStrictCF1Code(named)).toMatchObject({ kind: 'valid', tier: 'planet', name: 'Blue Home' });
    expect(parseStrictCF1Code(codeOf({
      t: 'g', g: [90, -60, 78, 0, 0.62, 0.5, 999, 1], n: 'x'.repeat(25),
    }))).toEqual({ kind: 'invalid' });
  });
});
