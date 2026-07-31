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
});
