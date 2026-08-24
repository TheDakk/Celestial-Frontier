/* @cf/domain-sessionrng — SessionRNG, reviewer delta §2.1 (a GATE B deliverable;
   NEW code, deliberately not a lift).

   THE PROBLEM IT SOLVES: §16.2 makes the UNIVERSE reproducible; nothing makes
   a PLAYER OUTCOME reproducible. Fourteen outcome rolls in v1.8.9
   draw from bare Math.random(), so no test can pin a capture and no bug
   report can be replayed. Two named domains result:
     WorldRNG   — the existing @cf/domain-rand: seeded, pure, universe-shaping.
     SessionRNG — THIS: seeded once per session from a STORED value (in the
                  save + the diagnostics export), so outcomes stay
                  unpredictable to the player and replayable to a test.

   DESIGN — counter-per-domain, not one shared stream:
   every roll is addressable as (sessionSeed, domain, n). Two properties fall
   out, and both are load-bearing:
   1. REPLAYABLE: a bug report carrying the state can re-derive the exact roll.
   2. ORDER-ISOLATED across domains: UI order varies run to run (a player may
      open the picker before or after a capture attempt); with per-domain
      counters, interleaving NEVER shifts another domain's sequence. A single
      shared stream would make every outcome depend on global UI history —
      unreplayable in practice.

   ⚠ SEED CREATION IS THE CALLER'S JOB (app layer, once per session, e.g.
   crypto.getRandomValues). This module contains no entropy source — the
   no-DOM/no-Math.random lint applies here with zero exceptions. */
import { mulberry32, hashInt } from '@cf/domain-rand';

/** Serializable state: store in the save and in the diagnostics export. */
export interface SessionRNGState {
  seed: number;                      /* the session seed, set once */
  draws: Record<string, number>;     /* per-domain draw counters */
  ordinal: number;                   /* save-lifetime exact-once receipt key */
}

export interface PlannedSessionRNGDraw {
  readonly domain: string;
  readonly value: number;
  /** Receipt ordinal consumed only if `nextState` commits with the outcome. */
  readonly receiptOrdinal: number;
  readonly nextState: SessionRNGState;
}

export interface SessionRNG {
  /** Uniform [0,1) roll in a named domain; advances only that domain. */
  roll(domain: string): number;
  /** Peek what the nth roll of a domain is/was without advancing anything. */
  at(domain: string, n: number): number;
  /** Snapshot for the save / diagnostics export (deep copy). */
  state(): SessionRNGState;
}

/* FNV-1a-32 over the domain name — stable, dependency-free domain addressing */
function domainHash(domain: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < domain.length; i++) { h ^= domain.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

const UINT32_MAX = 0xFFFF_FFFF;
function checkedDomain(domain: string): string {
  if (typeof domain !== 'string' || domain.length === 0 || domain.length > 64
    || /[\u0000-\u001f\u007f]/.test(domain)) {
    throw new RangeError('SessionRNG domain must be 1–64 printable characters');
  }
  return domain;
}
function checkedCounter(value: unknown, domain: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0 || (value as number) > UINT32_MAX) {
    throw new RangeError(`SessionRNG draw counter for ${JSON.stringify(domain)} must be a uint32`);
  }
  return value as number;
}

/** Create (or RESUME, by passing a stored state's draws) a session stream. */
export function createSessionRNG(seed: number, draws?: Record<string, number>, ordinal = 0): SessionRNG {
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > UINT32_MAX) {
    throw new RangeError('SessionRNG seed must be a uint32');
  }
  const s = seed >>> 0;
  let nextOrdinal = checkedCounter(ordinal, 'ordinal');
  /* A Map is intentional. A plain object makes valid-looking domains such as
     `toString` and `__proto__` read inherited values instead of counter zero,
     and a hostile persisted state can therefore poison or freeze a stream. */
  const counters = new Map<string, number>();
  if (draws !== undefined) {
    if (!draws || typeof draws !== 'object' || Array.isArray(draws)) {
      throw new TypeError('SessionRNG draws must be an object');
    }
    for (const [domain, count] of Object.entries(draws)) {
      counters.set(checkedDomain(domain), checkedCounter(count, domain));
    }
  }
  const value = (domain: string, n: number): number =>
    mulberry32(hashInt(s, domainHash(domain), n) >>> 0)();
  return {
    roll(domain: string): number {
      const key = checkedDomain(domain);
      const n = counters.get(key) ?? 0;
      if (n === UINT32_MAX) throw new RangeError(`SessionRNG draw counter for ${JSON.stringify(key)} is exhausted`);
      if (nextOrdinal === UINT32_MAX) throw new RangeError('SessionRNG save-lifetime ordinal is exhausted');
      counters.set(key, n + 1);
      nextOrdinal++;
      return value(key, n);
    },
    at(domain: string, n: number): number {
      const key = checkedDomain(domain);
      return value(key, checkedCounter(n, key));
    },
    state(): SessionRNGState { return { seed: s, draws: Object.fromEntries(counters), ordinal: nextOrdinal }; },
  };
}

/** Plan one outcome without mutating the supplied persisted state. The app
 * writes `nextState` and a receipt keyed by `receiptOrdinal` in the same F3
 * transaction as the product mutation; on write failure it discards the plan
 * and the exact roll remains available. */
export function planSessionRNGDraw(state: SessionRNGState, domain: string): PlannedSessionRNGDraw {
  if (!state || typeof state !== 'object') throw new TypeError('SessionRNG state is required');
  const rng = createSessionRNG(state.seed, state.draws, state.ordinal);
  const receiptOrdinal = checkedCounter(state.ordinal, 'ordinal');
  const value = rng.roll(domain);
  return Object.freeze({
    domain: checkedDomain(domain),
    value,
    receiptOrdinal,
    nextState: Object.freeze(rng.state()),
  });
}

/** One semantic counter per legacy gameplay/outcome roll. Presentation-only
 * noise is deliberately excluded: reordering particles or audio must not move
 * a player outcome. */
export const DOMAINS = Object.freeze({
  contactSuccess: 'contact.success',
  descentSuccess: 'descent.success',
  descentDamage: 'descent.damage',
  surveyHazard: 'survey.hazard',
  captureCandidate: 'capture.candidate',
  captureSuccess: 'capture.success',
  bulkFeedOutcome: 'care.bulk-feed',
  healOutcome: 'care.heal',
  breedOutcome: 'care.breed',
  feedOutcome: 'care.feed',
  hazardFlavor: 'hazard.flavor',
  trainingSpecimenSeed: 'training.specimen-seed',
  trainingSpecimenVariation: 'training.specimen-variation',
  trainingDuelSeed: 'training.duel-seed',
});

export interface LegacyOutcomeRngSite {
  readonly id: string;
  readonly domain: (typeof DOMAINS)[keyof typeof DOMAINS];
  readonly legacyLine: number;
  readonly occurrenceOnLine: number;
  readonly owner: string;
  readonly purpose: string;
}

/** Exact executable gameplay/outcome inventory in the frozen v1.8.9 source.
 * `occurrenceOnLine` is one-based and distinguishes the two Training draws on
 * line 23306. It is evidence for migration, not a license to retain bare RNG. */
export const LEGACY_OUTCOME_RNG_SITES: readonly LegacyOutcomeRngSite[] = Object.freeze([
  { id: 'contact-success', domain: DOMAINS.contactSuccess, legacyLine: 10720, occurrenceOnLine: 1, owner: 'contact', purpose: 'contact attempt succeeds' },
  { id: 'descent-success', domain: DOMAINS.descentSuccess, legacyLine: 10982, occurrenceOnLine: 1, owner: 'descent', purpose: 'descent succeeds' },
  { id: 'descent-damage', domain: DOMAINS.descentDamage, legacyLine: 10992, occurrenceOnLine: 1, owner: 'descent', purpose: 'descent damage amount' },
  { id: 'survey-hazard', domain: DOMAINS.surveyHazard, legacyLine: 11837, occurrenceOnLine: 1, owner: 'survey', purpose: 'survey hazard occurs' },
  { id: 'capture-candidate', domain: DOMAINS.captureCandidate, legacyLine: 12415, occurrenceOnLine: 1, owner: 'capture', purpose: 'capture candidate selection' },
  { id: 'capture-success', domain: DOMAINS.captureSuccess, legacyLine: 12420, occurrenceOnLine: 1, owner: 'capture', purpose: 'capture succeeds' },
  { id: 'bulk-feed-outcome', domain: DOMAINS.bulkFeedOutcome, legacyLine: 16592, occurrenceOnLine: 1, owner: 'care', purpose: 'bulk feed outcome' },
  { id: 'heal-outcome', domain: DOMAINS.healOutcome, legacyLine: 16688, occurrenceOnLine: 1, owner: 'care', purpose: 'heal outcome' },
  { id: 'breed-outcome', domain: DOMAINS.breedOutcome, legacyLine: 16704, occurrenceOnLine: 1, owner: 'care', purpose: 'breed outcome' },
  { id: 'feed-outcome', domain: DOMAINS.feedOutcome, legacyLine: 16725, occurrenceOnLine: 1, owner: 'care', purpose: 'feed outcome' },
  { id: 'hazard-flavor', domain: DOMAINS.hazardFlavor, legacyLine: 16800, occurrenceOnLine: 1, owner: 'hazard', purpose: 'hazard flavor selection' },
  { id: 'training-specimen-seed', domain: DOMAINS.trainingSpecimenSeed, legacyLine: 23306, occurrenceOnLine: 1, owner: 'training', purpose: 'training specimen seed' },
  { id: 'training-specimen-variation', domain: DOMAINS.trainingSpecimenVariation, legacyLine: 23306, occurrenceOnLine: 2, owner: 'training', purpose: 'training specimen variation' },
  { id: 'training-duel-seed', domain: DOMAINS.trainingDuelSeed, legacyLine: 23321, occurrenceOnLine: 1, owner: 'training', purpose: 'training duel seed' },
]);

/** Exact presentation-only Math.random inventory in v1.8.9. The repeated line
 * numbers intentionally preserve multiple executable calls on one line. */
export const LEGACY_PRESENTATION_RNG_LINES: readonly number[] = Object.freeze([
  13690,
  13783,
  16098, 16098, 16098,
  16102,
  16105,
  16106,
  16153,
  16219,
]);
