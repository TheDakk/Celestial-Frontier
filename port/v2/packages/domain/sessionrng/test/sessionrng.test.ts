import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import {
  createSessionRNG,
  planSessionRNGDraw,
  DOMAINS,
  LEGACY_RNG_SITES,
  LEGACY_OUTCOME_RNG_SITES,
  LEGACY_PRESENTATION_RNG_SITES,
  LEGACY_PRESENTATION_RNG_LINES,
  type LegacyRngSite,
} from '@cf/domain-sessionrng';

interface ObservedRandomSite {
  readonly legacyLine: number;
  readonly occurrenceOnLine: number;
  readonly sourceLine: string;
}

type LexFrame =
  | { kind: 'code'; templateBraceDepth: number | null }
  | { kind: 'single' | 'double' | 'template' | 'line-comment' | 'block-comment' };

/** Mask non-executable text without changing offsets/newlines. Template text
 * is masked while `${...}` substitutions are scanned as ordinary code. */
function maskCommentsAndStrings(source: string): string {
  /* split('') preserves UTF-16 offsets; spread would collapse non-BMP pairs
     and desynchronize the mask in this emoji-bearing legacy source. */
  const masked = source.split('');
  const frames: LexFrame[] = [{ kind: 'code', templateBraceDepth: null }];
  const hide = (index: number): void => {
    if (masked[index] !== '\n' && masked[index] !== '\r') masked[index] = ' ';
  };
  for (let index = 0; index < source.length; index++) {
    const frame = frames[frames.length - 1]!;
    const char = source[index]!;
    const next = source[index + 1];
    if (frame.kind === 'line-comment') {
      if (char === '\n' || char === '\r') frames.pop();
      else hide(index);
      continue;
    }
    if (frame.kind === 'block-comment') {
      hide(index);
      if (char === '*' && next === '/') {
        hide(index + 1);
        index++;
        frames.pop();
      }
      continue;
    }
    if (frame.kind === 'single' || frame.kind === 'double') {
      hide(index);
      if (char === '\\') {
        if (next !== undefined) hide(++index);
      } else if ((frame.kind === 'single' && char === "'") || (frame.kind === 'double' && char === '"')) {
        frames.pop();
      }
      continue;
    }
    if (frame.kind === 'template') {
      hide(index);
      if (char === '\\') {
        if (next !== undefined) hide(++index);
      } else if (char === '`') {
        frames.pop();
      } else if (char === '$' && next === '{') {
        hide(++index);
        frames.push({ kind: 'code', templateBraceDepth: 1 });
      }
      continue;
    }
    if (frame.kind !== 'code') throw new Error(`unhandled lexical frame ${frame.kind}`);

    if (char === '/' && next === '/') {
      hide(index); hide(++index);
      frames.push({ kind: 'line-comment' });
    } else if (char === '/' && next === '*') {
      hide(index); hide(++index);
      frames.push({ kind: 'block-comment' });
    } else if (char === "'") {
      hide(index);
      frames.push({ kind: 'single' });
    } else if (char === '"') {
      hide(index);
      frames.push({ kind: 'double' });
    } else if (char === '`') {
      hide(index);
      frames.push({ kind: 'template' });
    } else if (frame.templateBraceDepth !== null && char === '{') {
      frame.templateBraceDepth++;
    } else if (frame.templateBraceDepth !== null && char === '}') {
      frame.templateBraceDepth--;
      if (frame.templateBraceDepth === 0) {
        hide(index);
        frames.pop();
      }
    }
  }
  return masked.join('');
}

/** Lexical census: only bare executable `Math.random(` tokens survive the
 * masking pass; comments, quoted strings and template text cannot inflate it. */
function scanExecutableMathRandom(source: string): readonly ObservedRandomSite[] {
  const executable = maskCommentsAndStrings(source);
  const starts = [...executable.matchAll(/\bMath\s*\.\s*random\s*\(/g)].map(({ index }) => index);
  const sourceLines = source.split(/\r?\n/);
  const occurrences = new Map<number, number>();
  return starts.map((start) => {
    const legacyLine = executable.slice(0, start).split('\n').length;
    const occurrenceOnLine = (occurrences.get(legacyLine) ?? 0) + 1;
    occurrences.set(legacyLine, occurrenceOnLine);
    return {
      legacyLine,
      occurrenceOnLine,
      sourceLine: (sourceLines[legacyLine - 1] ?? '').trim(),
    };
  });
}

function siteKey(site: Pick<ObservedRandomSite, 'legacyLine' | 'occurrenceOnLine'>): string {
  return `${site.legacyLine}:${site.occurrenceOnLine}`;
}

/** One fail-closed audit used by the positive proof and every mutation
 * control below. Returning all findings keeps a stale inventory diagnosable. */
function auditLegacyInventory(source: string, sites: readonly LegacyRngSite[]): readonly string[] {
  const issues: string[] = [];
  const observed = scanExecutableMathRandom(source);
  const observedByKey = new Map(observed.map((site) => [siteKey(site), site]));
  const ids = new Set<string>();
  const accounted = new Set<string>();
  let outcomes = 0;
  let presentations = 0;

  if (observed.length !== 24) issues.push(`expected 24 executable calls, observed ${observed.length}`);
  for (const site of sites) {
    if (ids.has(site.id)) issues.push(`duplicate id ${site.id}`);
    ids.add(site.id);
    const key = siteKey(site);
    if (accounted.has(key)) issues.push(`duplicate site ${key}`);
    accounted.add(key);
    const actual = observedByKey.get(key);
    if (!actual) issues.push(`missing physical site ${key} (${site.id})`);
    else if (actual.sourceLine !== site.sourceLine) issues.push(`changed source ${key} (${site.id})`);

    if (site.classification === 'outcome') {
      outcomes++;
      if (!Object.values(DOMAINS).includes(site.domain)) issues.push(`unknown outcome domain ${site.id}`);
    } else {
      presentations++;
      const presentationDomain: unknown = site.domain;
      if (presentationDomain !== null) issues.push(`presentation domain leak ${site.id}`);
    }
  }
  for (const actual of observed) {
    const key = siteKey(actual);
    if (!accounted.has(key)) issues.push(`unaccounted executable site ${key}`);
  }
  if (outcomes !== 14) issues.push(`expected 14 outcome sites, inventoried ${outcomes}`);
  if (presentations !== 10) issues.push(`expected 10 presentation sites, inventoried ${presentations}`);
  return issues;
}

const rootMain = fileURLToPath(new URL('../../../../../../main.js', import.meta.url));
const legacySource = readFileSync(rootMain, 'utf8');

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
  it('pins all fourteen outcome sites and their exact owners/addresses', () => {
    expect(LEGACY_OUTCOME_RNG_SITES).toHaveLength(14);
    expect(LEGACY_OUTCOME_RNG_SITES.map(({ id, owner, legacyLine, occurrenceOnLine, domain }) =>
      [id, owner, legacyLine, occurrenceOnLine, domain])).toEqual([
      ['contact-success', 'attemptContact', 10720, 1, 'contact.success'],
      ['descent-success', '_descRoll', 10982, 1, 'descent.success'],
      ['descent-damage', '_descRoll', 10992, 1, 'descent.damage'],
      ['survey-hazard', 'bioscan', 11837, 1, 'survey.hazard'],
      ['capture-candidate', 'tryCapture', 12415, 1, 'capture.candidate'],
      ['capture-success', 'tryCapture', 12420, 1, 'capture.success'],
      ['bulk-feed-outcome', 'bulk feed', 16592, 1, 'care.feed'],
      ['heal-outcome', 'heal', 16688, 1, 'care.heal'],
      ['breed-outcome', 'breed', 16704, 1, 'care.breed'],
      ['feed-outcome', 'feed', 16725, 1, 'care.feed'],
      ['hazard-flavor', 'hazardFlavor', 16800, 1, 'hazard.flavor'],
      ['training-specimen-seed', '_tutGrant', 23306, 1, 'training.specimen-seed'],
      ['training-specimen-variation', '_tutGrant', 23306, 2, 'training.specimen-variation'],
      ['training-duel-seed', '_tutDuel', 23321, 1, 'training.duel-seed'],
    ]);
  });

  it('pins all ten presentation-only audio/FX sites outside outcome counters', () => {
    expect(LEGACY_PRESENTATION_RNG_SITES.map(({ id, owner, legacyLine, occurrenceOnLine, domain }) =>
      [id, owner, legacyLine, occurrenceOnLine, domain])).toEqual([
      ['voice-noise', 'playVoice', 13690, 1, null],
      ['whoosh-noise', 'playWhoosh', 13783, 1, null],
      ['fx-burst-angle', 'fxBurst', 16098, 1, null],
      ['fx-burst-velocity', 'fxBurst', 16098, 2, null],
      ['fx-burst-size', 'fxBurst', 16098, 3, null],
      ['fx-burst-shape', 'fxBurst', 16102, 1, null],
      ['fx-burst-rotation', 'fxBurst', 16105, 1, null],
      ['fx-burst-duration', 'fxBurst', 16106, 1, null],
      ['hit-noise', 'playHit', 16153, 1, null],
      ['ambience-noise', 'ambienceStart', 16219, 1, null],
    ]);
    expect(LEGACY_PRESENTATION_RNG_LINES).toEqual(LEGACY_PRESENTATION_RNG_SITES.map(({ legacyLine }) => legacyLine));
  });

  it('shares manual and bulk feeding intentionally while isolating every other outcome domain', () => {
    expect(Object.keys(DOMAINS)).toHaveLength(14);
    expect(new Set(Object.values(DOMAINS)).size).toBe(13);
    const grouped = new Map<string, string[]>();
    for (const { id, domain } of LEGACY_OUTCOME_RNG_SITES) {
      const ids = grouped.get(domain) ?? [];
      ids.push(id);
      grouped.set(domain, ids);
    }
    expect(grouped.get(DOMAINS.feedOutcome)).toEqual(['bulk-feed-outcome', 'feed-outcome']);
    expect([...grouped.entries()].filter(([domain]) => domain !== DOMAINS.feedOutcome)
      .every(([, ids]) => ids.length === 1)).toBe(true);
    expect(grouped.size).toBe(13);
  });

  it('lexically ignores comments/string/template text but counts executable substitutions', () => {
    const synthetic = [
      'Math.random();',
      '"Math.random()";',
      "'Math.random()';",
      '// Math.random();',
      '/* Math.random(); */',
      'const text = `Math.random()`;',
      'const executable = `value=${Math.random()}`;',
    ].join('\n');
    expect(scanExecutableMathRandom(synthetic).map(siteKey)).toEqual(['1:1', '7:1']);
  });

  it('accounts for all and only 24 executable calls with exact source/address identity', () => {
    expect(auditLegacyInventory(legacySource, LEGACY_RNG_SITES)).toEqual([]);
    expect(LEGACY_RNG_SITES).toHaveLength(24);
    expect(Object.isFrozen(LEGACY_RNG_SITES)).toBe(true);
    expect(LEGACY_RNG_SITES.every((site) => Object.isFrozen(site))).toBe(true);
    expect(new Set(LEGACY_RNG_SITES.map(({ id }) => id)).size).toBe(24);
    expect(new Set(LEGACY_RNG_SITES.map(siteKey)).size).toBe(24);
    expect(LEGACY_RNG_SITES.every(({ sourceLine }) => sourceLine.includes('Math.random()'))).toBe(true);
  });

  it('negative-controls missing, duplicate, reclassified, changed-source/site and stale-11 inventories', () => {
    const missing = LEGACY_RNG_SITES.filter(({ id }) => id !== 'capture-success');
    expect(auditLegacyInventory(legacySource, missing).join('\n')).toMatch(/unaccounted executable site 12420:1/);

    const duplicate = [...LEGACY_RNG_SITES, LEGACY_RNG_SITES[0]!];
    expect(auditLegacyInventory(legacySource, duplicate).join('\n')).toMatch(/duplicate id contact-success/);
    expect(auditLegacyInventory(legacySource, duplicate).join('\n')).toMatch(/duplicate site 10720:1/);

    const reclassified = LEGACY_RNG_SITES.map((site) => site.id === 'contact-success'
      ? { ...site, classification: 'presentation' as const, domain: null }
      : site) as readonly LegacyRngSite[];
    expect(auditLegacyInventory(legacySource, reclassified).join('\n')).toMatch(/expected 14 outcome sites, inventoried 13/);
    expect(auditLegacyInventory(legacySource, reclassified).join('\n')).toMatch(/expected 10 presentation sites, inventoried 11/);

    const changedSource = legacySource.replace("_equipBonus('contact')/100", "_equipBonus('contact')/101");
    expect(auditLegacyInventory(changedSource, LEGACY_RNG_SITES).join('\n')).toMatch(/changed source 10720:1/);

    const changedSite = LEGACY_RNG_SITES.map((site) => site.id === 'training-specimen-variation'
      ? { ...site, occurrenceOnLine: 3 }
      : site) as readonly LegacyRngSite[];
    expect(auditLegacyInventory(legacySource, changedSite).join('\n')).toMatch(/missing physical site 23306:3/);
    expect(auditLegacyInventory(legacySource, changedSite).join('\n')).toMatch(/unaccounted executable site 23306:2/);

    const staleEleven = LEGACY_RNG_SITES.filter((site) =>
      site.classification === 'presentation' || LEGACY_OUTCOME_RNG_SITES.indexOf(site) < 11);
    expect(auditLegacyInventory(legacySource, staleEleven).join('\n')).toMatch(/expected 14 outcome sites, inventoried 11/);
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
