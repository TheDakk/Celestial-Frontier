/* @cf/domain-sessionrng — SessionRNG, reviewer delta §2.1 (a GATE B deliverable;
   NEW code, deliberately not a lift).

   THE PROBLEM IT SOLVES: §16.2 makes the UNIVERSE reproducible; nothing makes
   a PLAYER OUTCOME reproducible. Eleven outcome rolls in v1.8.9 (tryCapture,
   openPicker, _descRoll, attemptContact, hazardFlavor, _tutGrant, _tutDuel, …)
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

/** Create (or RESUME, by passing a stored state's draws) a session stream. */
export function createSessionRNG(seed: number, draws?: Record<string, number>): SessionRNG {
  const s = seed >>> 0;
  const counters: Record<string, number> = { ...(draws || {}) };
  const value = (domain: string, n: number): number =>
    mulberry32(hashInt(s, domainHash(domain), n) >>> 0)();
  return {
    roll(domain: string): number {
      const n = counters[domain] || 0;
      counters[domain] = n + 1;
      return value(domain, n);
    },
    at(domain: string, n: number): number { return value(domain, n); },
    state(): SessionRNGState { return { seed: s, draws: { ...counters } }; },
  };
}

/** The eleven v1.8.9 Math.random() call sites, as named domains — the Phase 2+
    wiring replaces each bare call with sessionRng.roll(DOMAINS.x). Named here
    so the wiring and the tests share one vocabulary. */
export const DOMAINS = Object.freeze({
  tryCapture: 'tryCapture',
  openPicker: 'openPicker',
  descRoll: '_descRoll',
  attemptContact: 'attemptContact',
  hazardFlavor: 'hazardFlavor',
  tutGrant: '_tutGrant',
  tutDuel: '_tutDuel',
});
