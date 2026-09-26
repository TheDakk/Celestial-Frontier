/* Outposts — D14 (Nick 2026-09-25: "yes"; audits/PROPOSALS_20260925/N4_PROJECTS.md, Option A). The pure domain: definitions, one cost
   table, site eligibility, stage staging, deed evaluation and the board projection. No clock, no Math.random, no I/O.

   An outpost is a finite three-stage build on a world you chose. A stage is all-or-nothing: it spends existing catalogue parts and
   Stardust exactly like a Fabricator craft, and some stages also need one DEED done after the stage opened (the weekly-Charter
   post-acceptance rule, so past play never counts). The finished outpost switches on one permanent effect scoped to its world or
   system, adds a portrait mark and one Museum exhibit. It pays no Stardust, adds no achievement and nothing to rank; it has no timers,
   no decay and no upkeep. Abandon refunds every built stage in full. */

export const OUTPOST_KINDS_V1 = Object.freeze(['relay', 'shelter', 'sanctuary'] as const);
export type OutpostKindV1 = (typeof OUTPOST_KINDS_V1)[number];

/** Rules (N4 §4): two under construction on their own slots, at most 24 outposts in total (the Museum gallery holds 60). */
export const OUTPOST_UNDER_CONSTRUCTION_MAX_V1 = 2;
export const OUTPOST_TOTAL_MAX_V1 = 24;
export const OUTPOST_SANCTUARY_RESIDENTS_MAX_V1 = 6;
/** Projects open once Starter Charter `st-comp` ("A working component") is honoured. */
export const OUTPOST_UNLOCK_CHARTER_V1 = 'st-comp' as const;
/** The Survey Relay needs Deep Scanners researched (the engineering research id). */
export const OUTPOST_RELAY_RESEARCH_V1 = 'scan1' as const;

export type OutpostDeedV1 =
  | Readonly<{ kind: 'system-landings'; count: number; text: string }>
  | Readonly<{ kind: 'land-here-again'; text: string }>
  | Readonly<{ kind: 'feed-companions'; count: number; text: string }>;
export interface OutpostStageCostV1 {
  /** Catalogue part/component ids (stackable) → quantity. */
  readonly items: Readonly<Record<string, number>>;
  readonly stardust: number;
  readonly deed: OutpostDeedV1 | null;
}
export interface OutpostDefinitionV1 {
  readonly kind: OutpostKindV1;
  readonly name: string;
  readonly icon: string;
  readonly site: string;
  readonly reward: string;
  readonly stages: readonly [OutpostStageCostV1, OutpostStageCostV1, OutpostStageCostV1];
}

const stage = (items: Record<string, number>, stardust = 0, deed: OutpostDeedV1 | null = null): OutpostStageCostV1 =>
  Object.freeze({ items: Object.freeze({ ...items }), stardust, deed: deed === null ? null : Object.freeze({ ...deed }) });

/** EVERY cost in one table. Claude's starting numbers — Codex's P0 replaces them (economy owner; N4 §5 P0). */
export const PROJECT_COSTS_V1: Readonly<Record<OutpostKindV1, OutpostDefinitionV1['stages']>> = Object.freeze({
  relay: Object.freeze([
    stage({ frame: 2, plate: 2 }),
    stage({ navcore: 1, lens: 2 }, 0, { kind: 'system-landings', count: 2, text: 'Land on 2 other worlds in this system' }),
    stage({ coil: 1, cell: 1 }, 20),
  ] as const),
  shelter: Object.freeze([
    stage({ hullseg: 2 }),
    stage({ cryocap: 1, servo: 1, cell: 1 }),
    stage({ fuelcell: 1 }, 25, { kind: 'land-here-again', text: 'Land on this world again' }),
  ] as const),
  sanctuary: Object.freeze([
    stage({ weave: 2, frame: 2 }),
    stage({ hullseg: 2, cryocap: 1 }),
    stage({ servo: 1, cryogel: 2 }, 30, { kind: 'feed-companions', count: 2, text: 'Feed your companions twice' }),
  ] as const),
});

export const OUTPOST_DEFINITIONS_V1: readonly OutpostDefinitionV1[] = Object.freeze([
  Object.freeze({ kind: 'relay', name: 'Survey Relay', icon: '📡',
    site: 'Any world you have landed on; one per star system; needs Deep Scanners researched.',
    reward: 'Every world in this system shows its orbital mineral readout on the star\'s card, without a visit. No species or hidden presence is revealed, and no Survey credit is given.',
    stages: PROJECT_COSTS_V1.relay }),
  Object.freeze({ kind: 'shelter', name: 'Field Shelter', icon: '⛺',
    site: 'A landed fauna world you have not conquered.',
    reward: 'Discover Life on this world is hazard-free, like a settled world. It is not a conquest: no harvest, and conquest stays possible.',
    stages: PROJECT_COSTS_V1.shelter }),
  Object.freeze({ kind: 'sanctuary', name: 'Companion Sanctuary', icon: '🌿',
    site: 'A world you conquered.',
    reward: 'Choose up to 6 companions to appear on this world\'s card and in its Museum exhibit. Display only: no assignment, stats or bond.',
    stages: PROJECT_COSTS_V1.sanctuary }),
]);
export function outpostDefinitionV1(kind: OutpostKindV1): OutpostDefinitionV1 {
  const found = OUTPOST_DEFINITIONS_V1.find((d) => d.kind === kind);
  if (!found) throw new RangeError(`unknown outpost kind ${String(kind)}`);
  return found;
}
export const isOutpostKindV1 = (value: unknown): value is OutpostKindV1 => typeof value === 'string' && (OUTPOST_KINDS_V1 as readonly string[]).includes(value);

/* ---------- state ---------- */

export interface OutpostWorldV1 {
  readonly galaxySeed: number;
  readonly starSeed: number;
  readonly planetSeed: number;
  readonly name: string;
  /** Every planet seed of the site's star system (the Relay's deed and readout scope), sorted, unique. */
  readonly systemPlanetSeeds: readonly number[];
}
export interface OutpostBaselineV1 {
  /** stats.landings when the current stage opened. */
  readonly landings: number;
  /** Planet seeds of this system already landed on when the current stage opened. */
  readonly systemLanded: readonly number[];
  /** The companions' summed `fed` when the current stage opened. */
  readonly fed: number;
}
export interface OutpostSpentV1 { readonly stage: 1 | 2 | 3; readonly items: readonly (readonly [string, number])[]; readonly stardust: number }
export interface OutpostSiteV1 {
  readonly id: string;
  readonly kind: OutpostKindV1;
  readonly world: OutpostWorldV1;
  /** Stages built: 0..3; 3 = finished. */
  readonly built: 0 | 1 | 2 | 3;
  /** Active-play ms at which the CURRENT stage opened (the site's start, or the previous stage's build). */
  readonly openedAtMs: number;
  readonly baseline: OutpostBaselineV1;
  readonly finishedAtMs: number | null;
  readonly spent: readonly OutpostSpentV1[];
  /** Sanctuary residents (owned creature ids), display only. Always empty for other kinds. */
  readonly residents: readonly string[];
}
export interface OutpostProjectsStateV1 { readonly sites: readonly OutpostSiteV1[] }
export const EMPTY_OUTPOST_PROJECTS_V1: OutpostProjectsStateV1 = Object.freeze({ sites: Object.freeze([]) });

export const outpostSiteIdV1 = (kind: OutpostKindV1, planetSeed: number): string => `${kind}@${planetSeed >>> 0}`;

/* ---------- the facts a decision reads (supplied by the transaction from the save) ---------- */

export interface OutpostSaveFactsV1 {
  readonly honouredCharters: readonly string[];
  readonly research: readonly string[];
  readonly landed: readonly number[];
  readonly conquered: readonly number[];
  readonly landings: number;
  readonly fedTotal: number;
  readonly items: Readonly<Record<string, number>>;
  readonly stardust: number;
}
/** What the world card knows about the world the player is looking at (from the proven scene). */
export interface OutpostWorldContextV1 {
  readonly world: OutpostWorldV1;
  readonly hasFauna: boolean;
  /** The player is standing on this world (surface mode) — the Shelter's "land here again" deed is proven on site. */
  readonly standingHere: boolean;
}

export const outpostsOpenV1 = (facts: Pick<OutpostSaveFactsV1, 'honouredCharters'>): boolean => facts.honouredCharters.includes(OUTPOST_UNLOCK_CHARTER_V1);
export const underConstructionV1 = (state: OutpostProjectsStateV1): readonly OutpostSiteV1[] => state.sites.filter((s) => s.built < 3);

export type OutpostStartRefusalV1 =
  | 'locked' | 'slots-full' | 'total-full' | 'already-here' | 'relay-in-system' | 'needs-deep-scanners' | 'not-landed' | 'no-fauna'
  | 'conquered' | 'not-conquered' | 'world-invalid';
const refusalText: Readonly<Record<OutpostStartRefusalV1, string>> = Object.freeze({
  locked: 'Projects open after the Starter Charter "A working component".',
  'slots-full': `Two outposts are already under construction. Finish or abandon one first.`,
  'total-full': `You have built ${OUTPOST_TOTAL_MAX_V1} outposts, the most an expedition can hold.`,
  'already-here': 'This world already has one.',
  'relay-in-system': 'This star system already has a Survey Relay.',
  'needs-deep-scanners': 'Needs Deep Scanners researched.',
  'not-landed': 'Land on this world first.',
  'no-fauna': 'Needs a world with fauna.',
  conquered: 'Not on a world you conquered; build a Companion Sanctuary there instead.',
  'not-conquered': 'Needs a world you conquered.',
  'world-invalid': 'This world could not be verified.',
});
export const outpostRefusalTextV1 = (reason: OutpostStartRefusalV1): string => refusalText[reason];

function validWorld(world: OutpostWorldV1): boolean {
  const seed = (v: unknown) => Number.isSafeInteger(v) && (v as number) >= 0 && (v as number) <= 0xffffffff;
  return seed(world.galaxySeed) && seed(world.starSeed) && seed(world.planetSeed) && typeof world.name === 'string'
    && world.name.length > 0 && world.name.length <= 64 && Array.isArray(world.systemPlanetSeeds) && world.systemPlanetSeeds.length <= 64
    && world.systemPlanetSeeds.every(seed) && world.systemPlanetSeeds.includes(world.planetSeed)
    && new Set(world.systemPlanetSeeds).size === world.systemPlanetSeeds.length;
}

/** Can a site of `kind` be started on this world now? Null = yes. Order: global gates first, then the kind's site rule. */
export function outpostStartRefusalV1(state: OutpostProjectsStateV1, facts: OutpostSaveFactsV1, kind: OutpostKindV1, context: OutpostWorldContextV1): OutpostStartRefusalV1 | null {
  if (!validWorld(context.world)) return 'world-invalid';
  if (!outpostsOpenV1(facts)) return 'locked';
  const planet = context.world.planetSeed;
  if (state.sites.some((s) => s.kind === kind && s.world.planetSeed === planet)) return 'already-here';
  if (underConstructionV1(state).length >= OUTPOST_UNDER_CONSTRUCTION_MAX_V1) return 'slots-full';
  if (state.sites.length >= OUTPOST_TOTAL_MAX_V1) return 'total-full';
  const conquered = facts.conquered.includes(planet), landed = facts.landed.includes(planet);
  if (kind === 'relay') {
    if (!facts.research.includes(OUTPOST_RELAY_RESEARCH_V1)) return 'needs-deep-scanners';
    if (!landed) return 'not-landed';
    if (state.sites.some((s) => s.kind === 'relay' && s.world.starSeed === context.world.starSeed)) return 'relay-in-system';
  } else if (kind === 'shelter') {
    if (!landed) return 'not-landed';
    if (conquered) return 'conquered';
    if (!context.hasFauna) return 'no-fauna';
  } else if (!conquered) return 'not-conquered';
  return null;
}

const baselineOf = (facts: OutpostSaveFactsV1, world: OutpostWorldV1): OutpostBaselineV1 => Object.freeze({
  landings: facts.landings,
  systemLanded: Object.freeze(world.systemPlanetSeeds.filter((seed) => facts.landed.includes(seed)).sort((a, b) => a - b)),
  fed: facts.fedTotal,
});

export type OutpostDeedProgressV1 = Readonly<{ text: string; done: number; need: number; met: boolean }>;
/** A stage's deed, counted only since the stage opened. Null = the stage has no deed. */
export function outpostDeedProgressV1(site: OutpostSiteV1, deed: OutpostDeedV1 | null, facts: OutpostSaveFactsV1, context: Pick<OutpostWorldContextV1, 'standingHere'> | null): OutpostDeedProgressV1 | null {
  if (deed === null) return null;
  if (deed.kind === 'system-landings') {
    const done = site.world.systemPlanetSeeds.filter((seed) => seed !== site.world.planetSeed && facts.landed.includes(seed) && !site.baseline.systemLanded.includes(seed)).length;
    return Object.freeze({ text: deed.text, done: Math.min(done, deed.count), need: deed.count, met: done >= deed.count });
  }
  if (deed.kind === 'feed-companions') {
    const done = Math.max(0, facts.fedTotal - site.baseline.fed);
    return Object.freeze({ text: deed.text, done: Math.min(done, deed.count), need: deed.count, met: done >= deed.count });
  }
  const landedAgain = facts.landings > site.baseline.landings && context?.standingHere === true;
  return Object.freeze({ text: deed.text, done: landedAgain ? 1 : 0, need: 1, met: landedAgain });
}

export type OutpostStageRefusalV1 = 'no-site' | 'finished' | 'missing-items' | 'missing-stardust' | 'deed-unmet';
export interface OutpostStageQuoteV1 {
  readonly stage: 1 | 2 | 3;
  readonly cost: OutpostStageCostV1;
  readonly missingItems: readonly Readonly<{ id: string; need: number; have: number }>[];
  readonly missingStardust: number;
  readonly deed: OutpostDeedProgressV1 | null;
  readonly refusal: OutpostStageRefusalV1 | null;
}
export function quoteOutpostStageV1(site: OutpostSiteV1, facts: OutpostSaveFactsV1, context: Pick<OutpostWorldContextV1, 'standingHere'> | null): OutpostStageQuoteV1 | null {
  if (site.built >= 3) return null;
  const n = (site.built + 1) as 1 | 2 | 3, cost = PROJECT_COSTS_V1[site.kind][n - 1]!;
  const missingItems = Object.entries(cost.items).flatMap(([id, need]) => {
    const have = facts.items[id] ?? 0;
    return have < need ? [Object.freeze({ id, need, have })] : [];
  });
  const missingStardust = Math.max(0, cost.stardust - facts.stardust);
  const deed = outpostDeedProgressV1(site, cost.deed, facts, context);
  const refusal: OutpostStageRefusalV1 | null = missingItems.length ? 'missing-items' : missingStardust > 0 ? 'missing-stardust' : deed && !deed.met ? 'deed-unmet' : null;
  return Object.freeze({ stage: n, cost, missingItems: Object.freeze(missingItems), missingStardust, deed, refusal });
}

/* ---------- transitions (pure; the transaction applies the item/Stardust deltas they report) ---------- */

export type OutpostTransitionV1 =
  | Readonly<{ kind: 'ok'; state: OutpostProjectsStateV1; itemDeltas: Readonly<Record<string, number>>; stardustDelta: number; site: OutpostSiteV1 | null }>
  | Readonly<{ kind: 'refused'; reason: string }>;
const ok = (state: OutpostProjectsStateV1, site: OutpostSiteV1 | null, itemDeltas: Record<string, number> = {}, stardustDelta = 0): OutpostTransitionV1 =>
  Object.freeze({ kind: 'ok', state: Object.freeze({ sites: Object.freeze([...state.sites]) }), itemDeltas: Object.freeze(itemDeltas), stardustDelta, site });
const refuse = (reason: string): OutpostTransitionV1 => Object.freeze({ kind: 'refused', reason });
const sortSites = (sites: OutpostSiteV1[]): OutpostSiteV1[] => sites.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

export function startOutpostV1(state: OutpostProjectsStateV1, facts: OutpostSaveFactsV1, kind: OutpostKindV1, context: OutpostWorldContextV1, activePlayMs: number): OutpostTransitionV1 {
  if (!isOutpostKindV1(kind)) return refuse('kind-invalid');
  if (!Number.isSafeInteger(activePlayMs) || activePlayMs < 0) return refuse('clock-invalid');
  const refusal = outpostStartRefusalV1(state, facts, kind, context);
  if (refusal !== null) return refuse(refusal);
  const world = Object.freeze({ ...context.world, systemPlanetSeeds: Object.freeze([...context.world.systemPlanetSeeds].sort((a, b) => a - b)) });
  const site: OutpostSiteV1 = Object.freeze({ id: outpostSiteIdV1(kind, world.planetSeed), kind, world, built: 0, openedAtMs: activePlayMs,
    baseline: baselineOf(facts, world), finishedAtMs: null, spent: Object.freeze([]), residents: Object.freeze([]) });
  return ok({ sites: sortSites([...state.sites, site]) }, site);
}

export function buildOutpostStageV1(state: OutpostProjectsStateV1, facts: OutpostSaveFactsV1, siteId: string, context: Pick<OutpostWorldContextV1, 'standingHere'> | null, activePlayMs: number): OutpostTransitionV1 {
  if (!Number.isSafeInteger(activePlayMs) || activePlayMs < 0) return refuse('clock-invalid');
  const site = state.sites.find((s) => s.id === siteId);
  if (!site) return refuse('no-site');
  const quote = quoteOutpostStageV1(site, facts, context);
  if (quote === null) return refuse('finished');
  if (quote.refusal !== null) return refuse(quote.refusal);
  const itemDeltas: Record<string, number> = {};
  for (const [id, q] of Object.entries(quote.cost.items)) itemDeltas[id] = -q;
  const built = quote.stage;
  const next: OutpostSiteV1 = Object.freeze({ ...site, built, openedAtMs: activePlayMs, baseline: baselineOf(facts, site.world),
    finishedAtMs: built === 3 ? activePlayMs : null,
    spent: Object.freeze([...site.spent, Object.freeze({ stage: built, items: Object.freeze(Object.entries(quote.cost.items).sort(([a], [b]) => (a < b ? -1 : 1)).map(([id, q]) => Object.freeze([id, q] as const))), stardust: quote.cost.stardust })]) });
  return ok({ sites: sortSites(state.sites.map((s) => (s.id === siteId ? next : s))) }, next, itemDeltas, -quote.cost.stardust);
}

/** Abandon refunds EVERY built stage in full (parts and Stardust); nothing was paid out, so nothing can be farmed. */
export function abandonOutpostV1(state: OutpostProjectsStateV1, siteId: string): OutpostTransitionV1 {
  const site = state.sites.find((s) => s.id === siteId);
  if (!site) return refuse('no-site');
  const itemDeltas: Record<string, number> = {}; let stardust = 0;
  for (const row of site.spent) { stardust += row.stardust; for (const [id, q] of row.items) itemDeltas[id] = (itemDeltas[id] ?? 0) + q; }
  return ok({ sites: state.sites.filter((s) => s.id !== siteId) }, null, itemDeltas, stardust);
}

/** The Sanctuary's residents: owned creature ids, at most six, unique; only on a finished Sanctuary. */
export function setSanctuaryResidentsV1(state: OutpostProjectsStateV1, siteId: string, residents: readonly string[], ownedIds: readonly string[]): OutpostTransitionV1 {
  const site = state.sites.find((s) => s.id === siteId);
  if (!site) return refuse('no-site');
  if (site.kind !== 'sanctuary' || site.built < 3) return refuse('not-a-finished-sanctuary');
  if (!Array.isArray(residents) || residents.length > OUTPOST_SANCTUARY_RESIDENTS_MAX_V1 || new Set(residents).size !== residents.length) return refuse('residents-invalid');
  if (residents.some((id) => typeof id !== 'string' || !ownedIds.includes(id))) return refuse('resident-not-owned');
  const next = Object.freeze({ ...site, residents: Object.freeze([...residents]) });
  return ok({ sites: state.sites.map((s) => (s.id === siteId ? next : s)) }, next);
}

/* ---------- read models ---------- */

export interface OutpostBoardRowV1 {
  readonly site: OutpostSiteV1;
  readonly definition: OutpostDefinitionV1;
  readonly status: 'building' | 'finished';
  readonly next: OutpostStageQuoteV1 | null;
}
export interface OutpostBoardV1 {
  readonly open: boolean;
  readonly building: readonly OutpostBoardRowV1[];
  readonly finished: readonly OutpostBoardRowV1[];
  readonly slots: Readonly<{ used: number; max: number }>;
  readonly total: Readonly<{ used: number; max: number }>;
}
export function projectOutpostBoardV1(state: OutpostProjectsStateV1, facts: OutpostSaveFactsV1, standingOn: number | null): OutpostBoardV1 {
  const rows = state.sites.map((site): OutpostBoardRowV1 => Object.freeze({ site, definition: outpostDefinitionV1(site.kind),
    status: site.built >= 3 ? 'finished' : 'building',
    next: quoteOutpostStageV1(site, facts, { standingHere: standingOn !== null && standingOn === site.world.planetSeed }) }));
  return Object.freeze({ open: outpostsOpenV1(facts), building: Object.freeze(rows.filter((r) => r.status === 'building')),
    finished: Object.freeze(rows.filter((r) => r.status === 'finished')),
    slots: Object.freeze({ used: underConstructionV1(state).length, max: OUTPOST_UNDER_CONSTRUCTION_MAX_V1 }),
    total: Object.freeze({ used: state.sites.length, max: OUTPOST_TOTAL_MAX_V1 }) });
}

/** What the world card offers for this world: existing sites here, and every kind that could start here (with its refusal). */
export interface OutpostWorldOfferV1 {
  readonly open: boolean;
  readonly here: readonly OutpostBoardRowV1[];
  readonly startable: readonly Readonly<{ definition: OutpostDefinitionV1; refusal: OutpostStartRefusalV1 | null }>[];
}
export function projectOutpostWorldOfferV1(state: OutpostProjectsStateV1, facts: OutpostSaveFactsV1, context: OutpostWorldContextV1): OutpostWorldOfferV1 {
  const board = projectOutpostBoardV1(state, facts, context.standingHere ? context.world.planetSeed : null);
  const here = [...board.building, ...board.finished].filter((r) => r.site.world.planetSeed === context.world.planetSeed);
  const startable = OUTPOST_DEFINITIONS_V1.filter((d) => !here.some((r) => r.site.kind === d.kind))
    .map((definition) => Object.freeze({ definition, refusal: outpostStartRefusalV1(state, facts, definition.kind, context) }));
  return Object.freeze({ open: board.open, here: Object.freeze(here), startable: Object.freeze(startable) });
}

/* ---------- consumers (P5) ---------- */

/** Star seeds whose system has a FINISHED Survey Relay. */
export const finishedRelayStarSeedsV1 = (state: OutpostProjectsStateV1): readonly number[] =>
  Object.freeze([...new Set(state.sites.filter((s) => s.kind === 'relay' && s.built >= 3).map((s) => s.world.starSeed))].sort((a, b) => a - b));
/** Planet seeds with a FINISHED Field Shelter (the bioscan hazard's `shelter` safe reason). */
export const finishedShelterPlanetSeedsV1 = (state: OutpostProjectsStateV1): readonly number[] =>
  Object.freeze(state.sites.filter((s) => s.kind === 'shelter' && s.built >= 3).map((s) => s.world.planetSeed).sort((a, b) => a - b));
/** The finished Sanctuary on a planet, if any. */
export const sanctuaryOnV1 = (state: OutpostProjectsStateV1, planetSeed: number): OutpostSiteV1 | null =>
  state.sites.find((s) => s.kind === 'sanctuary' && s.built >= 3 && s.world.planetSeed === planetSeed) ?? null;
