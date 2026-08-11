import { describe, it, expect } from 'vitest';
import { createSessionRNG, DOMAINS } from '@cf/domain-sessionrng';

describe('@cf/domain-sessionrng — the reviewer §2.1 contract, as tests', () => {
  it('REPLAYABLE: same seed → identical sequences per domain', () => {
    const a = createSessionRNG(12345), b = createSessionRNG(12345);
    for (let i = 0; i < 50; i++) expect(a.roll('tryCapture')).toBe(b.roll('tryCapture'));
  });
  it('ORDER-ISOLATED: interleaving other domains never shifts a domain\'s sequence', () => {
    const clean = createSessionRNG(777);
    const noisy = createSessionRNG(777);
    const cleanSeq = Array.from({ length: 20 }, () => clean.roll('tryCapture'));
    const noisySeq: number[] = [];
    for (let i = 0; i < 20; i++) {
      noisy.roll('openPicker'); noisy.roll('hazardFlavor');   /* UI noise between captures */
      noisySeq.push(noisy.roll('tryCapture'));
      noisy.roll('_descRoll');
    }
    expect(noisySeq).toEqual(cleanSeq);
  });
  it('RESUMABLE: state round-trips through JSON and continues exactly', () => {
    const a = createSessionRNG(999);
    for (let i = 0; i < 7; i++) a.roll('attemptContact');
    a.roll('tryCapture');
    const st = JSON.parse(JSON.stringify(a.state())) as ReturnType<typeof a.state>;
    const b = createSessionRNG(st.seed, st.draws);
    for (let i = 0; i < 10; i++) expect(b.roll('attemptContact')).toBe(a.roll('attemptContact'));
  });
  it('ADDRESSABLE: at(domain, n) reproduces the nth roll without advancing', () => {
    const a = createSessionRNG(31337);
    const rolls = Array.from({ length: 5 }, () => a.roll('_tutDuel'));
    rolls.forEach((v, n) => expect(a.at('_tutDuel', n)).toBe(v));
    expect(a.state().draws['_tutDuel']).toBe(5);   /* at() advanced nothing */
  });
  it('UNPREDICTABLE-ish to the player: different seeds and domains decorrelate (sanity)', () => {
    const a = createSessionRNG(1), b = createSessionRNG(2);
    const av = Array.from({ length: 100 }, () => a.roll('x'));
    const bv = Array.from({ length: 100 }, () => b.roll('x'));
    expect(av).not.toEqual(bv);
    /* rough uniformity: mean within a loose band */
    const mean = av.reduce((s, v) => s + v, 0) / av.length;
    expect(mean).toBeGreaterThan(0.35); expect(mean).toBeLessThan(0.65);
  });
  it('the eleven call sites have their domain vocabulary', () => {
    expect(Object.keys(DOMAINS).length).toBeGreaterThanOrEqual(7);
  });
  it('hostile persisted property names are ordinary isolated counters, not prototype reads', () => {
    /* Negative control for the old plain-object implementation: `toString`
       read Object.prototype.toString and `__proto__` invoked its setter, so
       neither stream advanced through a numeric counter. */
    const restored = JSON.parse('{"toString":2,"__proto__":3}') as Record<string, number>;
    const rng = createSessionRNG(42, restored);
    const toStringRoll = rng.roll('toString');
    const protoRoll = rng.roll('__proto__');
    expect(toStringRoll).toBe(rng.at('toString', 2));
    expect(protoRoll).toBe(rng.at('__proto__', 3));
    const state = rng.state().draws;
    expect(state.toString).toBe(3);
    expect(Object.hasOwn(state, '__proto__')).toBe(true);
    expect(state.__proto__).toBe(4);
  });
  it('malformed saved seeds/counters and exhausted streams fail closed', () => {
    expect(() => createSessionRNG(-1)).toThrow(/seed must be a uint32/);
    expect(() => createSessionRNG(1, { tryCapture: -1 })).toThrow(/draw counter/);
    expect(() => createSessionRNG(1, { tryCapture: 1.5 })).toThrow(/draw counter/);
    expect(() => createSessionRNG(1, { tryCapture: Number.NaN })).toThrow(/draw counter/);
    const exhausted = createSessionRNG(1, { tryCapture: 0xFFFF_FFFF });
    expect(() => exhausted.roll('tryCapture')).toThrow(/exhausted/);
    expect(() => exhausted.at('tryCapture', -1)).toThrow(/draw counter/);
  });
});
