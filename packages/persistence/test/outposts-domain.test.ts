/** D14 Outposts P1 — the pure domain. Every rule is proven in both directions (the allowed case and its refusal). */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  EMPTY_OUTPOST_PROJECTS_V1, OUTPOST_TOTAL_MAX_V1, PROJECT_COSTS_V1, abandonOutpostV1, buildOutpostStageV1, finishedRelayStarSeedsV1,
  finishedShelterPlanetSeedsV1, outpostStartRefusalV1, projectOutpostBoardV1, projectOutpostWorldOfferV1, quoteOutpostStageV1,
  sanctuaryOnV1, setSanctuaryResidentsV1, startOutpostV1, type OutpostProjectsStateV1, type OutpostSaveFactsV1, type OutpostWorldContextV1,
} from '../src/outposts.js';

const world = (planetSeed: number, starSeed = 70, systemPlanetSeeds = [11, 12, 13, 14]): OutpostWorldContextV1['world'] =>
  ({ galaxySeed: 999, starSeed, planetSeed, name: `World ${planetSeed}`, systemPlanetSeeds: [...new Set([...systemPlanetSeeds, planetSeed])] });
const ctx = (planetSeed: number, over: Partial<OutpostWorldContextV1> = {}, starSeed = 70): OutpostWorldContextV1 =>
  ({ world: world(planetSeed, starSeed), hasFauna: true, standingHere: false, ...over });
const RICH: Record<string, number> = { frame: 20, plate: 20, navcore: 5, lens: 10, coil: 5, cell: 10, hullseg: 10, cryocap: 5, servo: 5, fuelcell: 5, weave: 5, cryogel: 5 };
const facts = (over: Partial<OutpostSaveFactsV1> = {}): OutpostSaveFactsV1 => ({
  honouredCharters: ['st-comp'], research: ['scan1'], landed: [11], conquered: [], landings: 10, fedTotal: 0, items: RICH, stardust: 200, ...over });
const must = <T extends { kind: string }>(t: T): Extract<T, { kind: 'ok' }> => { if (t.kind !== 'ok') throw new Error(JSON.stringify(t)); return t as Extract<T, { kind: 'ok' }>; };

describe('outposts domain (P1)', () => {
  it('projects stay closed before "A working component"; the unlock opens them', () => {
    expect(outpostStartRefusalV1(EMPTY_OUTPOST_PROJECTS_V1, facts({ honouredCharters: [] }), 'relay', ctx(11))).toBe('locked');
    expect(outpostStartRefusalV1(EMPTY_OUTPOST_PROJECTS_V1, facts(), 'relay', ctx(11))).toBeNull();
    expect(projectOutpostBoardV1(EMPTY_OUTPOST_PROJECTS_V1, facts({ honouredCharters: [] }), null).open).toBe(false);
  });
  it('site rules per kind, each with its refusal', () => {
    const s = EMPTY_OUTPOST_PROJECTS_V1;
    expect(outpostStartRefusalV1(s, facts({ research: [] }), 'relay', ctx(11))).toBe('needs-deep-scanners');
    expect(outpostStartRefusalV1(s, facts(), 'relay', ctx(12))).toBe('not-landed');
    expect(outpostStartRefusalV1(s, facts(), 'shelter', ctx(11))).toBeNull();
    expect(outpostStartRefusalV1(s, facts(), 'shelter', ctx(11, { hasFauna: false }))).toBe('no-fauna');
    expect(outpostStartRefusalV1(s, facts({ conquered: [11] }), 'shelter', ctx(11))).toBe('conquered');
    expect(outpostStartRefusalV1(s, facts(), 'sanctuary', ctx(11))).toBe('not-conquered');
    expect(outpostStartRefusalV1(s, facts({ conquered: [11] }), 'sanctuary', ctx(11))).toBeNull();
    expect(outpostStartRefusalV1(s, facts(), 'relay', { ...ctx(11), world: { ...world(11), systemPlanetSeeds: [12] } })).toBe('world-invalid');
  });
  it('one relay per star system; one of each kind per world; two under construction; 24 in total', () => {
    let s = must(startOutpostV1(EMPTY_OUTPOST_PROJECTS_V1, facts({ landed: [11, 12] }), 'relay', ctx(11), 5)).state;
    expect(outpostStartRefusalV1(s, facts({ landed: [11, 12] }), 'relay', ctx(12))).toBe('relay-in-system');
    expect(outpostStartRefusalV1(s, facts({ landed: [11, 12] }), 'relay', ctx(11))).toBe('already-here');
    s = must(startOutpostV1(s, facts({ landed: [11, 12] }), 'shelter', ctx(12), 6)).state;
    expect(outpostStartRefusalV1(s, facts({ landed: [11, 12, 13] }), 'shelter', ctx(13))).toBe('slots-full');
    const done = (i: number) => ({ ...s.sites[0]!, id: `shelter@${1000 + i}`, kind: 'shelter' as const, built: 3 as const, world: world(1000 + i, 5000 + i, []) });
    const full: OutpostProjectsStateV1 = { sites: Array.from({ length: OUTPOST_TOTAL_MAX_V1 }, (_, i) => done(i)) };
    expect(outpostStartRefusalV1(full, facts({ landed: [13] }), 'shelter', ctx(13))).toBe('total-full');
    expect(outpostStartRefusalV1({ sites: full.sites.slice(1) }, facts({ landed: [13] }), 'shelter', ctx(13))).toBeNull();
  });
  it('a stage is all-or-nothing: missing parts or Stardust refuse and change nothing; the exact bill is reported', () => {
    const s = must(startOutpostV1(EMPTY_OUTPOST_PROJECTS_V1, facts(), 'relay', ctx(11), 5)).state;
    expect(buildOutpostStageV1(s, facts({ items: { ...RICH, frame: 1 } }), 'relay@11', null, 6)).toEqual({ kind: 'refused', reason: 'missing-items' });
    const built = must(buildOutpostStageV1(s, facts(), 'relay@11', null, 6));
    expect(built.itemDeltas).toEqual({ frame: -2, plate: -2 }); expect(built.stardustDelta).toBe(-0); expect(built.site!.built).toBe(1);
    const two = must(buildOutpostStageV1(built.state, facts({ landed: [11, 12, 13] }), 'relay@11', null, 7)).state;
    expect(buildOutpostStageV1(two, facts({ stardust: 19 }), 'relay@11', null, 8)).toEqual({ kind: 'refused', reason: 'missing-stardust' });
    const three = must(buildOutpostStageV1(two, facts(), 'relay@11', null, 8));
    expect(three.stardustDelta).toBe(-PROJECT_COSTS_V1.relay[2]!.stardust); expect(three.site!.finishedAtMs).toBe(8);
    expect(buildOutpostStageV1(three.state, facts(), 'relay@11', null, 9)).toEqual({ kind: 'refused', reason: 'finished' });
  });
  it('a deed counts ONLY after its stage opened (past landings, meals and visits never count)', () => {
    let s = must(startOutpostV1(EMPTY_OUTPOST_PROJECTS_V1, facts({ landed: [11, 12] }), 'relay', ctx(11), 5)).state;
    s = must(buildOutpostStageV1(s, facts({ landed: [11, 12] }), 'relay@11', null, 6)).state; // 12 was landed BEFORE stage 2 opened
    expect(buildOutpostStageV1(s, facts({ landed: [11, 12, 13] }), 'relay@11', null, 7)).toEqual({ kind: 'refused', reason: 'deed-unmet' });
    expect(quoteOutpostStageV1(s.sites[0]!, facts({ landed: [11, 12, 13] }), null)!.deed).toMatchObject({ done: 1, need: 2, met: false });
    expect(must(buildOutpostStageV1(s, facts({ landed: [11, 12, 13, 14] }), 'relay@11', null, 7)).site!.built).toBe(2);
    let h = must(startOutpostV1(EMPTY_OUTPOST_PROJECTS_V1, facts(), 'shelter', ctx(11), 5)).state;
    h = must(buildOutpostStageV1(h, facts(), 'shelter@11', null, 6)).state;
    h = must(buildOutpostStageV1(h, facts({ landings: 10 }), 'shelter@11', null, 7)).state;
    expect(buildOutpostStageV1(h, facts({ landings: 10 }), 'shelter@11', { standingHere: true }, 8)).toEqual({ kind: 'refused', reason: 'deed-unmet' });
    expect(buildOutpostStageV1(h, facts({ landings: 11 }), 'shelter@11', { standingHere: false }, 8)).toEqual({ kind: 'refused', reason: 'deed-unmet' });
    expect(must(buildOutpostStageV1(h, facts({ landings: 11 }), 'shelter@11', { standingHere: true }, 8)).site!.built).toBe(3);
    let c = must(startOutpostV1(EMPTY_OUTPOST_PROJECTS_V1, facts({ conquered: [11], fedTotal: 40 }), 'sanctuary', ctx(11), 5)).state;
    c = must(buildOutpostStageV1(c, facts({ conquered: [11], fedTotal: 40 }), 'sanctuary@11', null, 6)).state;
    c = must(buildOutpostStageV1(c, facts({ conquered: [11], fedTotal: 40 }), 'sanctuary@11', null, 7)).state;
    expect(buildOutpostStageV1(c, facts({ fedTotal: 41 }), 'sanctuary@11', null, 8)).toEqual({ kind: 'refused', reason: 'deed-unmet' });
    expect(must(buildOutpostStageV1(c, facts({ fedTotal: 42 }), 'sanctuary@11', null, 8)).site!.built).toBe(3);
  });
  it('abandon refunds every built stage in full; the site is gone; no payout exists to farm', () => {
    let s = must(startOutpostV1(EMPTY_OUTPOST_PROJECTS_V1, facts(), 'relay', ctx(11), 5)).state;
    s = must(buildOutpostStageV1(s, facts(), 'relay@11', null, 6)).state;
    s = must(buildOutpostStageV1(s, facts({ landed: [11, 12, 13] }), 'relay@11', null, 7)).state;
    const out = must(abandonOutpostV1(s, 'relay@11'));
    expect(out.itemDeltas).toEqual({ frame: 2, plate: 2, navcore: 1, lens: 2 }); expect(out.stardustDelta).toBe(0); expect(out.state.sites).toEqual([]);
    expect(abandonOutpostV1(out.state, 'relay@11')).toEqual({ kind: 'refused', reason: 'no-site' });
  });
  it('sanctuary residents: only on a finished sanctuary, owned, unique, at most six', () => {
    const fin = { sites: [{ ...must(startOutpostV1(EMPTY_OUTPOST_PROJECTS_V1, facts({ conquered: [11] }), 'sanctuary', ctx(11), 5)).site!, built: 3 as const }] };
    const owned = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    expect(must(setSanctuaryResidentsV1(fin, 'sanctuary@11', ['a', 'b'], owned)).site!.residents).toEqual(['a', 'b']);
    expect(setSanctuaryResidentsV1(fin, 'sanctuary@11', owned, owned)).toEqual({ kind: 'refused', reason: 'residents-invalid' });
    expect(setSanctuaryResidentsV1(fin, 'sanctuary@11', ['zz'], owned)).toEqual({ kind: 'refused', reason: 'resident-not-owned' });
    expect(setSanctuaryResidentsV1({ sites: [{ ...fin.sites[0]!, built: 2 }] }, 'sanctuary@11', ['a'], owned)).toEqual({ kind: 'refused', reason: 'not-a-finished-sanctuary' });
    expect(sanctuaryOnV1(fin, 11)?.id).toBe('sanctuary@11'); expect(sanctuaryOnV1(fin, 12)).toBeNull();
  });
  it('consumers read only FINISHED outposts; the world offer lists what can start here', () => {
    let s = must(startOutpostV1(EMPTY_OUTPOST_PROJECTS_V1, facts(), 'relay', ctx(11), 5)).state;
    expect(finishedRelayStarSeedsV1(s)).toEqual([]);
    s = { sites: [{ ...s.sites[0]!, built: 3 }] };
    expect(finishedRelayStarSeedsV1(s)).toEqual([70]); expect(finishedShelterPlanetSeedsV1(s)).toEqual([]);
    const offer = projectOutpostWorldOfferV1(s, facts(), ctx(11));
    expect(offer.here.map((r) => r.site.kind)).toEqual(['relay']);
    expect(offer.startable.map((r) => [r.definition.kind, r.refusal])).toEqual([['shelter', null], ['sanctuary', 'not-conquered']]);
  });
  it('is pure: the same inputs give the same state; no clock or randomness is read', () => {
    const a = startOutpostV1(EMPTY_OUTPOST_PROJECTS_V1, facts(), 'relay', ctx(11), 5), b = startOutpostV1(EMPTY_OUTPOST_PROJECTS_V1, facts(), 'relay', ctx(11), 5);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    const src = readFileSync(new URL('../src/outposts.ts', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    expect(src).toMatch(/export function startOutpostV1/); // the scan reads real code, not an empty string
    expect(src).not.toMatch(/Date\.now|Math\.random|performance\.now/);
  });
});
