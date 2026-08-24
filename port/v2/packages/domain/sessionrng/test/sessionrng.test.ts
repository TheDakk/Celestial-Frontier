import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import {
  createSessionRNG,
  planSessionRNGDraw,
  DOMAINS,
  LEGACY_OUTCOME_RNG_SITES,
  LEGACY_PRESENTATION_RNG_LINES,
} from '@cf/domain-sessionrng';

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
    const b = createSessionRNG(st.seed, st.draws, st.ordinal);
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
  it('pins all fourteen legacy outcome sites to distinct semantic domains', () => {
    expect(LEGACY_OUTCOME_RNG_SITES).toHaveLength(14);
    expect(Object.keys(DOMAINS)).toHaveLength(14);
    expect(new Set(Object.values(DOMAINS)).size).toBe(14);
    expect(LEGACY_OUTCOME_RNG_SITES.map(({ domain }) => domain).sort())
      .toEqual(Object.values(DOMAINS).sort());
    expect(new Set(LEGACY_OUTCOME_RNG_SITES.map(({ id }) => id)).size).toBe(14);
    for (const site of LEGACY_OUTCOME_RNG_SITES) {
      expect(site.owner.length).toBeGreaterThan(0);
      expect(site.purpose.length).toBeGreaterThan(0);
    }
  });
  it('accounts for every executable legacy Math.random call as outcome or presentation', () => {
    const rootMain = fileURLToPath(new URL('../../../../../../main.js', import.meta.url));
    const lines = readFileSync(rootMain, 'utf8').split(/\r?\n/);
    const observed: number[] = [];
    lines.forEach((line, index) => {
      const count = [...line.matchAll(/Math\.random\s*\(/g)].length;
      if (index + 1 === 29) return; // frozen architecture comment, not executable
      for (let occurrence = 0; occurrence < count; occurrence++) observed.push(index + 1);
    });
    const accounted = [
      ...LEGACY_OUTCOME_RNG_SITES.map(({ legacyLine }) => legacyLine),
      ...LEGACY_PRESENTATION_RNG_LINES,
    ].sort((a, b) => a - b);
    expect(observed).toEqual(accounted);
    expect(observed).toHaveLength(24);
    for (const site of LEGACY_OUTCOME_RNG_SITES) {
      const occurrences = observed.filter((line) => line === site.legacyLine).length;
      expect(site.occurrenceOnLine).toBeLessThanOrEqual(occurrences);
    }
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
    expect(() => createSessionRNG(1, {}, -1)).toThrow(/draw counter/);
    expect(() => createSessionRNG(1, {}, 0xFFFF_FFFF).roll('tryCapture')).toThrow(/ordinal is exhausted/);
  });
  it('plans one receipt-addressed draw without consuming the persisted source state', () => {
    const source = { seed: 123, draws: { tryCapture: 4 }, ordinal: 19 };
    const first = planSessionRNGDraw(source, 'tryCapture');
    const retry = planSessionRNGDraw(source, 'tryCapture');
    expect(first).toEqual(retry);
    expect(first.receiptOrdinal).toBe(19);
    expect(first.nextState).toEqual({ seed: 123, draws: { tryCapture: 5 }, ordinal: 20 });
    expect(source).toEqual({ seed: 123, draws: { tryCapture: 4 }, ordinal: 19 });
    const committedNext = planSessionRNGDraw(first.nextState, 'tryCapture');
    expect(committedNext.receiptOrdinal).toBe(20);
    expect(committedNext.value).not.toBe(first.value);
  });
});
