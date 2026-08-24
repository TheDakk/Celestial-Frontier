/* @cf/domain-sessionrng — SessionRNG, reviewer delta §2.1 (a GATE B deliverable;
   NEW code, deliberately not a lift).

   THE PROBLEM IT SOLVES: §16.2 makes the UNIVERSE reproducible; nothing makes
   a PLAYER OUTCOME reproducible. Fourteen outcome call sites in v1.8.9
   draw from bare Math.random(), so no test can pin a capture and no bug
   report can be replayed. They map to thirteen semantic counters (manual and
   bulk feeding intentionally share one). Two named RNG classes result:
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
  bulkFeedOutcome: 'care.feed',
  feedOutcome: 'care.feed',
  healOutcome: 'care.heal',
  breedOutcome: 'care.breed',
  hazardFlavor: 'hazard.flavor',
  trainingSpecimenSeed: 'training.specimen-seed',
  trainingSpecimenVariation: 'training.specimen-variation',
  trainingDuelSeed: 'training.duel-seed',
});

export type LegacyRngClassification = 'outcome' | 'presentation';
export type LegacyOutcomeRngDomain = (typeof DOMAINS)[keyof typeof DOMAINS];

interface LegacyRngSiteBase {
  readonly id: string;
  readonly legacyLine: number;
  readonly occurrenceOnLine: number;
  readonly owner: string;
  readonly purpose: string;
  /** Exact trimmed physical source line. Any source drift reopens the audit. */
  readonly sourceLine: string;
}

export interface LegacyOutcomeRngSite extends LegacyRngSiteBase {
  readonly classification: 'outcome';
  readonly domain: LegacyOutcomeRngDomain;
}

export interface LegacyPresentationRngSite extends LegacyRngSiteBase {
  readonly classification: 'presentation';
  readonly domain: null;
}

export type LegacyRngSite = LegacyOutcomeRngSite | LegacyPresentationRngSite;

function freezeLegacySites(sites: LegacyRngSite[]): readonly LegacyRngSite[] {
  for (const site of sites) Object.freeze(site);
  return Object.freeze(sites);
}

/** All and only the 24 executable `Math.random()` call sites in frozen
 * v1.8.9. `legacyLine` + one-based `occurrenceOnLine` is the stable physical
 * address; `sourceLine` makes even same-address source drift fail closed.
 * Presentation calls are recorded but have no SessionRNG domain, so audio/FX
 * scheduling can never perturb a player-outcome counter. This is migration
 * evidence, not permission to retain bare RNG. */
export const LEGACY_RNG_SITES: readonly LegacyRngSite[] = freezeLegacySites([
  { id: 'contact-success', classification: 'outcome', domain: DOMAINS.contactSuccess, legacyLine: 10720, occurrenceOnLine: 1, owner: 'attemptContact', purpose: 'contact attempt succeeds', sourceLine: `if(Math.random()<Math.min(0.98, 0.7+_equipBonus('contact')/100)){` },
  { id: 'descent-success', classification: 'outcome', domain: DOMAINS.descentSuccess, legacyLine: 10982, occurrenceOnLine: 1, owner: '_descRoll', purpose: 'descent decision', sourceLine: 'if(Math.random()*100 < d.pct){' },
  { id: 'descent-damage', classification: 'outcome', domain: DOMAINS.descentDamage, legacyLine: 10992, occurrenceOnLine: 1, owner: '_descRoll', purpose: 'descent damage amount', sourceLine: 'let dmg=d.lo+Math.floor(Math.random()*(d.hi-d.lo+1));' },
  { id: 'survey-hazard', classification: 'outcome', domain: DOMAINS.surveyHazard, legacyLine: 11837, occurrenceOnLine: 1, owner: 'bioscan', purpose: 'bioscan hazard decision', sourceLine: 'if(dz.pct>0 && Math.random()<dz.pct){' },
  { id: 'capture-candidate', classification: 'outcome', domain: DOMAINS.captureCandidate, legacyLine: 12415, occurrenceOnLine: 1, owner: 'tryCapture', purpose: 'capture target selection', sourceLine: 'const g=pool[(Math.random()*pool.length)|0];' },
  { id: 'capture-success', classification: 'outcome', domain: DOMAINS.captureSuccess, legacyLine: 12420, occurrenceOnLine: 1, owner: 'tryCapture', purpose: 'capture succeeds', sourceLine: 'if(Math.random()<ch){' },
  { id: 'bulk-feed-outcome', classification: 'outcome', domain: DOMAINS.bulkFeedOutcome, legacyLine: 16592, occurrenceOnLine: 1, owner: 'bulk feed', purpose: 'bulk-feed meal outcome', sourceLine: 'const r2=feedPair(base, fl[0], Math.random());' },
  { id: 'heal-outcome', classification: 'outcome', domain: DOMAINS.healOutcome, legacyLine: 16688, occurrenceOnLine: 1, owner: 'heal', purpose: 'flora-heal outcome', sourceLine: 'const r=healExplorer(other, (_tutRig&&_tutRig.heal!=null)?_tutRig.heal:(!tutDone?0.95:Math.random()));' },
  { id: 'breed-outcome', classification: 'outcome', domain: DOMAINS.breedOutcome, legacyLine: 16704, occurrenceOnLine: 1, owner: 'breed', purpose: 'breeding outcome', sourceLine: 'const r=breedPair(_pickBase, other, (_tutRig&&_tutRig.breed!=null)?_tutRig.breed:(!tutDone?-1:Math.random()));' },
  { id: 'feed-outcome', classification: 'outcome', domain: DOMAINS.feedOutcome, legacyLine: 16725, occurrenceOnLine: 1, owner: 'feed', purpose: 'manual-feed meal outcome', sourceLine: 'const r=feedPair(_pickBase, other, (_tutRig&&_tutRig.feed!=null)?_tutRig.feed:(!tutDone?0.99:Math.random()));' },
  { id: 'hazard-flavor', classification: 'outcome', domain: DOMAINS.hazardFlavor, legacyLine: 16800, occurrenceOnLine: 1, owner: 'hazardFlavor', purpose: 'hazard flavor selection', sourceLine: 'const env=arr[Math.floor(Math.random()*arr.length)];' },
  { id: 'training-specimen-seed', classification: 'outcome', domain: DOMAINS.trainingSpecimenSeed, legacyLine: 23306, occurrenceOnLine: 1, owner: '_tutGrant', purpose: 'training specimen seed', sourceLine: 'do{ g=makeGenome((Math.random()*0xFFFFFFFF)>>>0, kingdom, 0.3+Math.random()*0.35); }' },
  { id: 'training-specimen-variation', classification: 'outcome', domain: DOMAINS.trainingSpecimenVariation, legacyLine: 23306, occurrenceOnLine: 2, owner: '_tutGrant', purpose: 'training specimen variation', sourceLine: 'do{ g=makeGenome((Math.random()*0xFFFFFFFF)>>>0, kingdom, 0.3+Math.random()*0.35); }' },
  { id: 'training-duel-seed', classification: 'outcome', domain: DOMAINS.trainingDuelSeed, legacyLine: 23321, occurrenceOnLine: 1, owner: '_tutDuel', purpose: 'training rival seed', sourceLine: `const rg=makeGenome((Math.random()*0xFFFFFFFF)>>>0, 'fauna', 0.5);` },

  { id: 'voice-noise', classification: 'presentation', domain: null, legacyLine: 13690, occurrenceOnLine: 1, owner: 'playVoice', purpose: 'voice noise buffer', sourceLine: 'for(let i=0;i<n;i++){ const w=Math.random()*2-1; last=(last+w*0.22)/1.22; ch[i]=last*(1-i/n); }' },
  { id: 'whoosh-noise', classification: 'presentation', domain: null, legacyLine: 13783, occurrenceOnLine: 1, owner: 'playWhoosh', purpose: 'whoosh noise buffer', sourceLine: 'for(let i=0;i<ch.length;i++) ch[i]=Math.random()*2-1;' },
  { id: 'fx-burst-angle', classification: 'presentation', domain: null, legacyLine: 16098, occurrenceOnLine: 1, owner: 'fxBurst', purpose: 'particle angle', sourceLine: 'const a=Math.random()*Math.PI*2, v=70+Math.random()*240, s=4+Math.random()*6;' },
  { id: 'fx-burst-velocity', classification: 'presentation', domain: null, legacyLine: 16098, occurrenceOnLine: 2, owner: 'fxBurst', purpose: 'particle velocity', sourceLine: 'const a=Math.random()*Math.PI*2, v=70+Math.random()*240, s=4+Math.random()*6;' },
  { id: 'fx-burst-size', classification: 'presentation', domain: null, legacyLine: 16098, occurrenceOnLine: 3, owner: 'fxBurst', purpose: 'particle size', sourceLine: 'const a=Math.random()*Math.PI*2, v=70+Math.random()*240, s=4+Math.random()*6;' },
  { id: 'fx-burst-shape', classification: 'presentation', domain: null, legacyLine: 16102, occurrenceOnLine: 1, owner: 'fxBurst', purpose: 'particle shape', sourceLine: `if(Math.random()<0.4) p.style.borderRadius='50%';` },
  { id: 'fx-burst-rotation', classification: 'presentation', domain: null, legacyLine: 16105, occurrenceOnLine: 1, owner: 'fxBurst', purpose: 'particle rotation', sourceLine: `p.style.setProperty('--rot',((Math.random()*720-360)|0)+'deg');` },
  { id: 'fx-burst-duration', classification: 'presentation', domain: null, legacyLine: 16106, occurrenceOnLine: 1, owner: 'fxBurst', purpose: 'particle duration', sourceLine: `p.style.setProperty('--t',(0.7+Math.random()*0.7).toFixed(2)+'s');` },
  { id: 'hit-noise', classification: 'presentation', domain: null, legacyLine: 16153, occurrenceOnLine: 1, owner: 'playHit', purpose: 'impact noise buffer', sourceLine: 'for(let i=0;i<n;i++) ch[i]=(Math.random()*2-1)*(1-i/n);' },
  { id: 'ambience-noise', classification: 'presentation', domain: null, legacyLine: 16219, occurrenceOnLine: 1, owner: 'ambienceStart', purpose: 'ambient noise buffer', sourceLine: 'for(let i=0;i<n;i++){ const w=Math.random()*2-1; last=(last+w*0.14)/1.14; ch[i]=last*3.2; }' },
]);

export const LEGACY_OUTCOME_RNG_SITES: readonly LegacyOutcomeRngSite[] = Object.freeze(
  LEGACY_RNG_SITES.filter((site): site is LegacyOutcomeRngSite => site.classification === 'outcome'),
);

export const LEGACY_PRESENTATION_RNG_SITES: readonly LegacyPresentationRngSite[] = Object.freeze(
  LEGACY_RNG_SITES.filter((site): site is LegacyPresentationRngSite => site.classification === 'presentation'),
);

/** Compatibility view for older audit consumers. Prefer the exact sites. */
export const LEGACY_PRESENTATION_RNG_LINES: readonly number[] = Object.freeze(
  LEGACY_PRESENTATION_RNG_SITES.map(({ legacyLine }) => legacyLine),
);
