import { describe, it, expect, beforeAll } from 'vitest';
import {
  NAV_HOME,
  ascend,
  enterGalaxy,
  enterSystem,
  galaxyFineCell,
  galaxyScene,
  homeUniverse,
  universeGalaxies,
  land,
  navFromCanonicalCF1Address,
  navToView,
  provenGalaxyCell,
  resolveCF1GalaxyAddress,
  resolveCF1Star,
  resolveCF1StarAddress,
  resolveCF1WorldAddress,
  resolveViewToNav,
  systemScene,
  HOME_GAL_SEED,
  SOL_SEED,
  type CanonicalCF1WorldAddress,
  type NavResult,
  type NavState,
  type ProvenGalaxy,
  type ProvenPlanet,
  type ProvenStar,
} from '@cf/scene';
import { installCaptureHooks } from '@cf/domain-descriptors';

beforeAll(() => installCaptureHooks());

const HOME_WORLD_CANDIDATE = {
  galaxy: { seed: 999, x: 90, y: -60 },
  star: { seed: 424242, x: 560, y: 170 },
  planet: { seed: 133 },
};

function homeWorldAddress(): CanonicalCF1WorldAddress {
  const result = resolveCF1WorldAddress(HOME_WORLD_CANDIDATE);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error('home world proof failed: ' + result.reason);
  return result.address;
}

function stateOf<T extends NavState>(result: NavResult<T>): T {
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error('navigation failed: ' + result.reason);
  return result.state;
}

describe('@cf/scene — zoom-mode state machine (Gate D navigation core)', () => {
  it('the full descent and return: universe → galaxy → system → surface → back up', () => {
    const address = homeWorldAddress();
    let s: NavState = NAV_HOME;
    expect(Object.isFrozen(NAV_HOME)).toBe(true);
    s = stateOf(enterGalaxy(s, address.galaxy));
    expect(Object.isFrozen(s)).toBe(true);
    s = stateOf(enterSystem(s, address.star));
    expect(Object.isFrozen(s)).toBe(true);
    s = stateOf(land(s, address.planet));
    expect(Object.isFrozen(s)).toBe(true);
    expect(s.mode).toBe('surface');
    s = stateOf(ascend(s));
    expect(s.mode).toBe('system'); expect(s.planet).toBeNull();
    s = stateOf(ascend(s));
    expect(s.mode).toBe('galaxy'); expect(s.star).toBeNull();
    s = stateOf(ascend(s));
    expect(s.mode).toBe('universe'); expect(s.gal).toBeNull();
    expect(ascend(s)).toEqual({ ok: false, reason: 'already-at-universe' });
  });

  it('rejects wrong origins, raw lookalikes, structural clones, and unregistered NavState copies', () => {
    const address = homeWorldAddress();
    expect(enterSystem(NAV_HOME, address.star)).toEqual({
      ok: false, reason: 'enter-system-from-non-galaxy',
    });
    expect(land(NAV_HOME, address.planet)).toEqual({
      ok: false, reason: 'land-from-non-system',
    });

    const rawGalaxy = {
      seed: 999, x: 90, y: -60, size: 78, sp: 0, tilt: 0.62, rot: 0.5,
      home: true, quasar: false, dwarf: false, parentCell: { x: 0, y: -1 },
    };
    /* Compile control: public fields alone cannot satisfy the private brand. */
    // @ts-expect-error raw generated-looking data is not ProvenGalaxy
    const rawResult = enterGalaxy(NAV_HOME, rawGalaxy);
    expect(rawResult).toEqual({ ok: false, reason: 'unproven-galaxy' });

    const clonedGalaxy = { ...address.galaxy };
    expect(enterGalaxy(NAV_HOME, clonedGalaxy as ProvenGalaxy)).toEqual({
      ok: false, reason: 'unproven-galaxy',
    });

    const galaxyState = stateOf(enterGalaxy(NAV_HOME, address.galaxy));
    const clonedStar = { ...address.star };
    expect(enterSystem(galaxyState, clonedStar as ProvenStar)).toEqual({
      ok: false, reason: 'unproven-star',
    });
    const systemState = stateOf(enterSystem(galaxyState, address.star));
    const clonedPlanet = { ...address.planet };
    expect(land(systemState, clonedPlanet as ProvenPlanet)).toEqual({
      ok: false, reason: 'unproven-planet',
    });
    // @ts-expect-error externally constructed state lacks the private NavState brand
    const rawState: NavState = { mode: 'galaxy', gal: address.galaxy, star: null, planet: null };
    expect(ascend(rawState)).toEqual({ ok: false, reason: 'unproven-nav-state' });
    expect(() => navToView({ ...galaxyState } as NavState)).toThrow(
      'navToView requires a proven NavState',
    );
  });

  it('accepts independently re-proven equivalent parents but rejects cross-hierarchy children', () => {
    const world = homeWorldAddress();
    const galaxyAgain = resolveCF1GalaxyAddress({ galaxy: HOME_WORLD_CANDIDATE.galaxy });
    expect(galaxyAgain.ok).toBe(true);
    if (!galaxyAgain.ok) throw new Error(galaxyAgain.reason);
    const equivalentGalaxyState = stateOf(enterGalaxy(NAV_HOME, galaxyAgain.address.galaxy));
    expect(enterSystem(equivalentGalaxyState, world.star).ok).toBe(true);

    const starAgain = resolveCF1StarAddress({
      galaxy: HOME_WORLD_CANDIDATE.galaxy,
      star: HOME_WORLD_CANDIDATE.star,
    });
    expect(starAgain.ok).toBe(true);
    if (!starAgain.ok) throw new Error(starAgain.reason);
    const equivalentStarState = stateOf(enterSystem(
      stateOf(enterGalaxy(NAV_HOME, world.galaxy)),
      starAgain.address.star,
    ));
    expect(land(equivalentStarState, world.planet).ok).toBe(true);

    const otherGalaxyNode = homeUniverse(2).find((galaxy) => galaxy.seed !== HOME_GAL_SEED);
    expect(otherGalaxyNode).toBeDefined();
    const otherGalaxy = resolveCF1GalaxyAddress({ galaxy: otherGalaxyNode });
    expect(otherGalaxy.ok).toBe(true);
    if (!otherGalaxy.ok) throw new Error(otherGalaxy.reason);
    const foreignGalaxyState = stateOf(enterGalaxy(NAV_HOME, otherGalaxy.address.galaxy));
    expect(enterSystem(foreignGalaxyState, world.star)).toEqual({
      ok: false, reason: 'star-parent-mismatch',
    });

    const otherStarNode = galaxyScene(HOME_GAL_SEED).stars.find((star) => star.seed !== SOL_SEED);
    expect(otherStarNode).toBeDefined();
    const otherStar = resolveCF1Star(world.galaxy, otherStarNode);
    expect(otherStar.ok).toBe(true);
    if (!otherStar.ok) throw new Error(otherStar.reason);
    const foreignStarState = stateOf(enterSystem(
      stateOf(enterGalaxy(NAV_HOME, world.galaxy)),
      otherStar.star,
    ));
    expect(land(foreignStarState, world.planet)).toEqual({
      ok: false, reason: 'planet-parent-mismatch',
    });
  });

  it('builds navigation only from registered canonical address wrappers', () => {
    const galaxy = resolveCF1GalaxyAddress({ galaxy: HOME_WORLD_CANDIDATE.galaxy });
    const star = resolveCF1StarAddress({
      galaxy: HOME_WORLD_CANDIDATE.galaxy,
      star: HOME_WORLD_CANDIDATE.star,
    });
    const world = resolveCF1WorldAddress(HOME_WORLD_CANDIDATE);
    expect(galaxy.ok && navFromCanonicalCF1Address(galaxy.address).ok).toBe(true);
    expect(star.ok && navFromCanonicalCF1Address(star.address).ok).toBe(true);
    expect(world.ok && navFromCanonicalCF1Address(world.address).ok).toBe(true);
    if (!world.ok) throw new Error(world.reason);
    expect(navFromCanonicalCF1Address({ ...world.address })).toEqual({
      ok: false, reason: 'unproven-address',
    });
  });

  it('emits only the exact legacy slim keys and source-reproves every round-trip tier', () => {
    const world = homeWorldAddress();
    const surface = stateOf(navFromCanonicalCF1Address(world));
    expect(surface.mode).toBe('surface');
    const view = navToView(surface)!;
    expect(Object.keys(view)).toEqual(['type', 'gal', 'star', 'pseed']);
    expect(Object.keys(view.gal as Record<string, unknown>)).toEqual([
      'x', 'y', 'size', 'sp', 'tilt', 'rot', 'seed', 'home', 'quasar', 'dwarf',
    ]);
    expect(Object.keys(view.star as Record<string, unknown>)).toEqual(['x', 'y', 'seed']);
    expect(JSON.stringify(view)).not.toMatch(/parentCell|ordinal|layer|CF1\|/);

    const surfaceBack = resolveViewToNav(view);
    expect(surfaceBack.ok).toBe(true);
    if (!surfaceBack.ok) throw new Error(surfaceBack.reason);
    expect(surfaceBack.state.mode).toBe('surface');
    expect(surfaceBack.state.planet?.seed).toBe(133);
    expect(surfaceBack.state.planet && 'ordinal' in surfaceBack.state.planet
      ? surfaceBack.state.planet.ordinal : null).toBe(2);

    const system = stateOf(ascend(surface));
    const systemBack = resolveViewToNav(navToView(system));
    expect(systemBack.ok && systemBack.state.mode).toBe('system');
    const galaxy = stateOf(ascend(system));
    const galaxyBack = resolveViewToNav(navToView(galaxy));
    expect(galaxyBack.ok && galaxyBack.state.mode).toBe('galaxy');
  });

  it('maps null to the one home state and rejects malformed tiers without coercion or downgrade', () => {
    const home = resolveViewToNav(null);
    expect(home.ok).toBe(true);
    if (!home.ok) throw new Error(home.reason);
    expect(home.state).toBe(NAV_HOME);
    expect(resolveViewToNav(undefined)).toEqual({ ok: false, reason: 'malformed-view' });
    expect(resolveViewToNav({})).toEqual({ ok: false, reason: 'malformed-view' });

    const validView = navToView(stateOf(navFromCanonicalCF1Address(homeWorldAddress())))!;
    const gal = validView.gal;
    const star = validView.star;
    expect(resolveViewToNav({ type: 'planet', gal, pseed: 133 })).toEqual({
      ok: false, reason: 'malformed-view',
    });
    expect(resolveViewToNav({ type: 'star', gal, star: {} })).toEqual({
      ok: false, reason: 'malformed-address',
    });
    expect(resolveViewToNav({ type: 'galaxy', gal: { ...(gal as object), seed: '999' } })).toEqual({
      ok: false, reason: 'malformed-address',
    });
    expect(resolveViewToNav({ type: 'planet', gal, star, pseed: '133' })).toEqual({
      ok: false, reason: 'malformed-address',
    });
    expect(resolveViewToNav({ type: 'galaxy', gal, star })).toEqual({
      ok: false, reason: 'malformed-view',
    });
    expect(resolveViewToNav({ type: 'star', gal, star, pseed: 133 })).toEqual({
      ok: false, reason: 'malformed-view',
    });
    expect(resolveViewToNav({ type: 'planet', gal, star })).toEqual({
      ok: false, reason: 'malformed-view',
    });
  });
});

describe('@cf/scene — universe composition from the ported domain', () => {
  it('★ the home view contains the home galaxy (seed 999) — the anchor the whole slice descends from', () => {
    const nodes = homeUniverse(2);
    expect(nodes.length).toBeGreaterThan(0);
    const home = nodes.find((n) => n.seed === HOME_GAL_SEED);
    expect(home, 'home galaxy missing from its own cells').toBeDefined();
    expect(home!.home).toBe(true);
  });
  it('composition is deterministic (two calls, identical nodes)', () => {
    expect(JSON.stringify(homeUniverse(1))).toBe(JSON.stringify(homeUniverse(1)));
  });
  it('copies and freezes nested collision bridges instead of aliasing the generator cache', () => {
    const sourceBridge = { x2: 12, y2: -7 };
    const sourceGalaxy = {
      seed: 7, x: 1, y: 2, size: 30, sp: 0, tilt: 0.4, rot: 0.2,
      bridge: sourceBridge,
    };
    const source = (): readonly Record<string, unknown>[] => [sourceGalaxy];
    const first = universeGalaxies(0, 0, 0, source)[0]!;
    expect(first.bridge).toEqual(sourceBridge);
    expect(first.bridge).not.toBe(sourceBridge);
    expect(Object.isFrozen(first.bridge)).toBe(true);
    expect(() => { (first.bridge as { x2: number }).x2 = 99; }).toThrow();
    expect(sourceBridge).toEqual({ x2: 12, y2: -7 });
    expect(universeGalaxies(0, 0, 0, source)[0]!.bridge).toEqual({ x2: 12, y2: -7 });
  });
});

describe('@cf/scene — galaxy composition (the Renderer cell convention, verified)', () => {
  it('keeps coarse and fine app streaming behind a proven galaxy parent', async () => {
    const home = resolveCF1GalaxyAddress({ galaxy: HOME_WORLD_CANDIDATE.galaxy });
    expect(home.ok).toBe(true);
    if (!home.ok) throw new Error(home.reason);
    const { galaxyProfile, FCELL } = await import('@cf/domain-worldgen');
    const prof = galaxyProfile(home.address.galaxy.seed) as Record<string, unknown>;
    const coarse = provenGalaxyCell(home.address.galaxy, prof, 13, 4);
    expect(coarse.stars.some((star) => star.seed === SOL_SEED)).toBe(true);
    const fine = galaxyFineCell(
      home.address.galaxy,
      prof,
      Math.floor(-27.46 / FCELL),
      Math.floor(-26.2 / FCELL),
    );
    expect(fine.some((star) => star.seed === 581174295)).toBe(true);
    expect(() => provenGalaxyCell({ ...home.address.galaxy } as ProvenGalaxy, prof, 13, 4))
      .toThrow(/ProvenGalaxy/);
    expect(() => galaxyFineCell({ ...home.address.galaxy } as ProvenGalaxy, prof, 0, 0))
      .toThrow(/ProvenGalaxy/);
  });
  it('★ the home galaxy has a real star field, and the black hole KEEPS its void', async () => {
    const { galaxyScene, GR } = await import('@cf/scene');
    const g = galaxyScene(999);
    expect(g.stars.length).toBeGreaterThan(500);
    for (const s of g.stars) {
      const rad = Math.hypot(s.x, s.y);
      /* the rad<GR gate is on the CELL CENTER; stars scatter within their
         42px cell, so the disc edge is soft by up to a cell diagonal —
         source truth, first asserted too strictly */
      expect(rad, 'star outside the soft disc edge').toBeLessThan(GR + 42);
      expect(rad, 'star inside the supermassive black hole void — the astronomy that fooled the first scan').toBeGreaterThanOrEqual(34);
    }
    /* deterministic: the field is the same universe every time */
    const h = g.stars.reduce((a, s) => (a * 31 + s.seed) >>> 0, 0);
    expect(g.stars.length).toBe(galaxyScene(999).stars.length);
    expect(galaxyScene(999).stars.reduce((a, s) => (a * 31 + s.seed) >>> 0, 0)).toBe(h);
  });
  it('the viewport window clamps to the halo exactly as the Renderer does', async () => {
    const { galaxyCellWindow, HALO_CELLS, GCELL } = await import('@cf/scene');
    const w = galaxyCellWindow(-1e9, -1e9, 1e9, 1e9);
    expect(w).toEqual({ cx0: -HALO_CELLS - 1, cy0: -HALO_CELLS - 1, cx1: HALO_CELLS + 1, cy1: HALO_CELLS + 1 });
    const t = galaxyCellWindow(0, 0, GCELL * 2 + 1, GCELL - 1);
    expect(t).toEqual({ cx0: 0, cy0: 0, cx1: 2, cy1: 0 });
  });
});

describe('@cf/scene — the charter & Ascent gates (pure, main.js 21959/22791/22814)', () => {
  it('the stage ladder: the built system IS the key', async () => {
    const { ascStageOf } = await import('@cf/scene');
    expect(ascStageOf([], 0)).toBe(0);
    expect(ascStageOf([['jumpdrive', 1]], 0)).toBe(1);
    expect(ascStageOf([['array', 1]], 0)).toBe(2);
    expect(ascStageOf([['igdrive', 1]], 0)).toBe(3);
    expect(ascStageOf([['array', 1], ['igdrive', 1]], 0)).toBe(3);   /* highest wins */
    expect(ascStageOf([], 3)).toBe(3);   /* all chapters done = free */
  });
  it('★ stage 0 is SOL ONLY; stage 1 the Neighborhood ring; foreign stars wait for the IG drive', async () => {
    const { ascAllowsStar, ascHintFor, primeReachHint } = await import('@cf/scene');
    const { SOL_POS } = await import('@cf/domain-worldconfig');
    const { ASC_RING_R } = await import('@cf/domain-strays');
    const sol = { x: SOL_POS.x, y: SOL_POS.y, seed: 424242 };
    const near = { x: SOL_POS.x + (ASC_RING_R as number) * 0.9, y: SOL_POS.y, seed: 7 };
    const far = { x: SOL_POS.x + (ASC_RING_R as number) * 1.1, y: SOL_POS.y, seed: 8 };
    expect(ascAllowsStar(0, 999, sol)).toBe(true);
    expect(ascAllowsStar(0, 999, near)).toBe(false);
    expect(ascAllowsStar(1, 999, near)).toBe(true);
    expect(ascAllowsStar(1, 999, far)).toBe(false);
    expect(ascAllowsStar(2, 999, far)).toBe(true);
    expect(ascAllowsStar(2, 1000, sol)).toBe(false);   /* foreign galaxy */
    expect(ascAllowsStar(3, 1000, sol)).toBe(true);
    /* A star/drive gate and an imported galaxy-radius gate are distinct
       facts. Both name the current-slice boundary without directing a fresh
       player to absent mining/fabrication/Shipyard systems, but the radius
       copy must not pretend the player can collect or write Signatures. */
    const safeCharterCopy = (hint: string): boolean =>
      /Charter system/i.test(hint)
        && !/prime signature radius|shipyard|\bbuild\b|mine|fabricat/i.test(hint);
    const safeCharterHint = (stage: number): boolean => safeCharterCopy(ascHintFor(stage));
    const safePrimeRadiusHint = (hint: string): boolean =>
      /Your saved Prime Signature radius ends here/i.test(hint)
        && /Prime Signature radius expansion is not available in this development slice/i.test(hint)
        && !/collect|earn|award|write|next Charter system|shipyard|\bbuild\b|mine|fabricat/i.test(hint);
    expect(safeCharterHint(0)).toBe(true);
    expect(safeCharterHint(1)).toBe(true);
    expect(safeCharterHint(2)).toBe(true);
    expect(safeCharterHint(3)).toBe(true);
    expect(safePrimeRadiusHint(primeReachHint())).toBe(true);
    /* Negative control: the legacy exhortation must fail the same outcome
       check, proving the check is about the player-visible words. */
    const legacyHint = 'Sol is your charter for now — build the ⚡ Jump Drive at the 🛠 Shipyard.';
    expect(safeCharterCopy(legacyHint)).toBe(false);
    expect(safePrimeRadiusHint(
      'Your saved Prime Signature radius ends here. Collect Prime Signatures to expand it.',
    )).toBe(false);
    expect(safePrimeRadiusHint(
      'Your saved reach is preserved. The next Charter system is not available in this development slice.',
    )).toBe(false);
  });
  it('★ landfall BANKING: credit lands in every chapter from the current on (the review catch)', async () => {
    const {
      ASC_CHAPTERS_DATA, ascStageOf, bankLandfall, canAdvanceV2Chapter, chapterGoalsDone,
      currentObjective, currentV2Objective, projectV2Charter,
    } = await import('@cf/scene');
    const prog: Record<string, number> = {};
    /* a Sol landing at chapter 0 banks c1-land only */
    expect(bankLandfall(0, prog, 133)).toBe(true);
    expect(prog['c1-land']).toBe(1);
    expect(prog['c2-land']).toBeUndefined();
    /* a NON-Sol landing at chapter 0 banks the FUTURE chapter's goal silently */
    expect(bankLandfall(0, prog, 99999)).toBe(true);
    expect(prog['c2-land']).toBe(1);
    expect(prog['c1-land']).toBe(1);   /* sol goal untouched */
    /* capped at n — no overshoot */
    bankLandfall(0, prog, 134); bankLandfall(0, prog, 135);
    expect(prog['c1-land']).toBe(2);
    expect(bankLandfall(0, { 'c1-land': 2, 'c2-land': 3 }, 131)).toBe(false);
    /* Canonical legacy order is preserved for imported progression/parity,
       even though the live v2 chip must not render that next legacy goal. */
    expect(ASC_CHAPTERS_DATA[0]!.goals.map((goal) => goal.id)).toEqual([
      'c1-land', 'c1-mine', 'c1-part', 'c1-comp', 'c1-jump',
    ]);
    expect(ASC_CHAPTERS_DATA[0]!.intro).toContain('Mine the dead worlds');
    const o = currentObjective(0, prog)!;
    expect(o.text).toMatch(/Mine Sol/);   /* c1-land done → next goal */
    expect(currentObjective(0, {})!.text).toBe('Make planetfall on 2 worlds of Sol');
    expect(currentObjective(3, {})).toBeNull();   /* Ascent complete */
    expect(chapterGoalsDone(0, { 'c1-land': 2, 'c1-mine': 8, 'c1-part': 4, 'c1-comp': 2, 'c1-jump': 1 })).toBe(true);
    expect(chapterGoalsDone(0, { 'c1-land': 2 })).toBe(false);

    /* The player-facing projection is a different contract: only outcomes
       v2 can write are allowed through. This is the fresh-save state. */
    const fresh: Record<string, number> = {};
    const first = projectV2Charter(0, fresh, ascStageOf([], 0))!;
    const visibleCopy = (view: typeof first): string =>
      [view.name, view.intro, view.note, ...view.goals.map((goal) => goal.t)].join(' ');
    const honestProjection = (view: typeof first): boolean =>
      view.goals.every((goal) => goal.ev === 'landfall')
        && !/mine|fabricat|shipyard|build the/i.test(visibleCopy(view));
    expect(first.state).toBe('actionable');
    expect(first.goals.map((goal) => goal.id)).toEqual(['c1-land']);
    expect(currentV2Objective(0, fresh, ascStageOf([], 0))).toMatchObject({
      text: 'Make planetfall on 2 worlds of Sol', have: 0, need: 2,
    });
    expect(honestProjection(first)).toBe(true);
    /* Negative control: the same outcome check must reject a legacy mining
       goal if one is accidentally appended to the view. */
    const legacyMine = ASC_CHAPTERS_DATA[0]!.goals.find((goal) => goal.id === 'c1-mine')!;
    expect(honestProjection({ ...first, goals: [...first.goals, legacyMine] })).toBe(false);

    /* Two real Sol landfalls complete the only fresh-save visible milestone.
       They must stop at the boundary rather than forging a mining/fabrication
       completion, a Shipyard instruction, or an unearned reach stage. */
    expect(bankLandfall(0, fresh, 133)).toBe(true);
    expect(bankLandfall(0, fresh, 134)).toBe(true);
    const boundary = projectV2Charter(0, fresh, ascStageOf([], 0))!;
    expect(boundary.state).toBe('boundary');
    expect(boundary.goals.map((goal) => goal.id)).toEqual(['c1-land']);
    expect(honestProjection(boundary)).toBe(true);
    expect(currentV2Objective(0, fresh, ascStageOf([], 0))).toBeNull();
    expect(chapterGoalsDone(0, fresh)).toBe(false);
    expect(canAdvanceV2Chapter(0, fresh, ascStageOf([], 0))).toBe(false);
    /* Positive control: a genuinely complete imported canonical chapter can
       still advance; the projection has not weakened or rewritten save data. */
    const importedComplete = {
      ...fresh, 'c1-mine': 8, 'c1-part': 4, 'c1-comp': 2, 'c1-jump': 1,
    };
    /* A malformed completion record does not manufacture its missing drive:
       it cannot advance into Chapter 2 or advertise a non-Sol landfall. */
    const unpoweredCompleteStage = ascStageOf([], 0);
    expect(unpoweredCompleteStage).toBe(0);
    expect(projectV2Charter(0, importedComplete, unpoweredCompleteStage)!.state).toBe('boundary');
    expect(canAdvanceV2Chapter(0, importedComplete, unpoweredCompleteStage)).toBe(false);
    /* Positive control: genuine imported drive state still recognizes the
       canonical completion at the pure eligibility seam. Reconciliation may
       acknowledge it on a successful Land action without new goal credit. */
    const poweredCompleteStage = ascStageOf([['jumpdrive', 1]], 0);
    expect(canAdvanceV2Chapter(0, importedComplete, poweredCompleteStage)).toBe(true);
    expect(projectV2Charter(0, importedComplete, poweredCompleteStage)!.state).toBe('complete');
    const saturatedSolRecord = { ...importedComplete };
    expect(bankLandfall(0, saturatedSolRecord, 133)).toBe(false);
    /* An ascCh alone is never reach. The safe default hides the Chapter 2
       non-Sol goal; actual saved Jump Drive stage makes it visible. */
    const malformedChapterTwoStage = ascStageOf([], 1);
    expect(malformedChapterTwoStage).toBe(0);
    expect(projectV2Charter(1, {}, malformedChapterTwoStage)!.goals).toEqual([]);
    expect(currentV2Objective(1, {}, malformedChapterTwoStage)).toBeNull();
    expect(projectV2Charter(1, {})!.goals).toEqual([]);
    expect(projectV2Charter(1, {}, poweredCompleteStage)!.goals.map((goal) => goal.id)).toEqual(['c2-land']);
    expect(projectV2Charter(2, {}, ascStageOf([['igdrive', 1]], 2))!.goals).toEqual([]);
  });
  it('Charter data is deeply immutable and malformed chapter indexes fail closed', async () => {
    const { ASC_CHAPTERS_DATA, ASC_CHAPTER_COUNT, bankLandfall, projectV2Charter } =
      await import('@cf/scene');
    const complete = {
      'c1-land': 2, 'c1-mine': 8, 'c1-part': 4, 'c1-comp': 2, 'c1-jump': 1,
      'c2-land': 3,
    };
    const invalidChapters = [-1, -1_000_000, 0.5, Number.NaN, Number.POSITIVE_INFINITY,
      ASC_CHAPTER_COUNT, ASC_CHAPTER_COUNT + 1];
    for (const invalid of invalidChapters) {
      const prog = { ...complete };
      const before = JSON.stringify(prog);
      expect(bankLandfall(invalid, prog, 133), `invalid ascCh ${String(invalid)}`).toBe(false);
      expect(JSON.stringify(prog), `invalid ascCh ${String(invalid)} mutated progress`).toBe(before);
      if (invalid !== ASC_CHAPTER_COUNT) expect(projectV2Charter(invalid, prog, 3)).toBeNull();
    }

    expect(Object.isFrozen(ASC_CHAPTERS_DATA)).toBe(true);
    for (const chapter of ASC_CHAPTERS_DATA) {
      expect(Object.isFrozen(chapter), chapter.id).toBe(true);
      expect(Object.isFrozen(chapter.goals), `${chapter.id} goals`).toBe(true);
      for (const goal of chapter.goals) expect(Object.isFrozen(goal), goal.id).toBe(true);
      const projection = projectV2Charter(
        Number(chapter.id.slice(2)) - 1, complete, 3,
      );
      for (const goal of projection?.goals ?? []) {
        expect(Object.isFrozen(goal), `projected ${goal.id}`).toBe(true);
      }
    }

    /* Negative control: Object.freeze on only the outer array does not satisfy
       the same recursive ownership contract. */
    const shallow = Object.freeze([{ goals: [{ id: 'mutable' }] }]);
    const recursivelyFrozen = (chapters: readonly { goals: readonly object[] }[]): boolean =>
      Object.isFrozen(chapters)
        && chapters.every((chapter) => Object.isFrozen(chapter)
          && Object.isFrozen(chapter.goals)
          && chapter.goals.every(Object.isFrozen));
    expect(recursivelyFrozen(shallow)).toBe(false);
    expect(recursivelyFrozen(ASC_CHAPTERS_DATA)).toBe(true);

    if (false) {
      // @ts-expect-error Canonical chapter fields are compile-time readonly too.
      ASC_CHAPTERS_DATA[0]!.name = 'mutated';
      // @ts-expect-error Canonical goal arrays are compile-time readonly too.
      ASC_CHAPTERS_DATA[0]!.goals.push(ASC_CHAPTERS_DATA[0]!.goals[0]!);
      // @ts-expect-error Canonical goal fields are compile-time readonly too.
      ASC_CHAPTERS_DATA[0]!.goals[0]!.n = 999;
    }
  });
  it('reconciles every consecutive, reach-backed imported Charter completion', async () => {
    const { reconcileV2Chapters } = await import('@cf/scene');
    const c1 = {
      'c1-land': 2, 'c1-mine': 8, 'c1-part': 4, 'c1-comp': 2, 'c1-jump': 1,
    };
    const c2 = {
      ...c1, 'c2-land': 3, 'c2-scan': 2, 'c2-conq': 1, 'c2-array': 1,
    };
    const all = {
      ...c2, 'c3-breed': 1, 'c3-gear': 2, 'c3-mine': 20, 'c3-ig': 1,
    };

    expect(reconcileV2Chapters(0, c1, 0)).toMatchObject({ nextChapter: 0, completed: [] });
    expect(reconcileV2Chapters(0, c1, 1)).toMatchObject({
      nextChapter: 1, completed: [{ id: 'ch1' }],
    });
    expect(reconcileV2Chapters(0, all, 3)).toMatchObject({
      nextChapter: 3, completed: [{ id: 'ch1' }, { id: 'ch2' }, { id: 'ch3' }],
    });
    expect(reconcileV2Chapters(0, all, 1)).toMatchObject({
      nextChapter: 1, completed: [{ id: 'ch1' }],
    });
    expect(reconcileV2Chapters(0, all, 2)).toMatchObject({
      nextChapter: 2, completed: [{ id: 'ch1' }, { id: 'ch2' }],
    });
    expect(reconcileV2Chapters(0, c1, 3)).toMatchObject({
      nextChapter: 1, completed: [{ id: 'ch1' }],
    });
    expect(reconcileV2Chapters(1, c2, 3)).toMatchObject({
      nextChapter: 2, completed: [{ id: 'ch2' }],
    });
    expect(reconcileV2Chapters(3, all, 3)).toMatchObject({ nextChapter: 3, completed: [] });
    for (const invalid of [-1, 0.5, Number.NaN, Number.POSITIVE_INFINITY, 4]) {
      expect(reconcileV2Chapters(invalid, all, 3), String(invalid)).toBeNull();
    }
  });
  it('reach grows by REGIONS as prime signatures land; home is always within reach', async () => {
    const { reachRadiusOf, withinReachOf, currentRegionOf } = await import('@cf/scene');
    const { REGIONS } = await import('@cf/domain-strays');
    const rows = REGIONS as Array<{ sigs: number; r: number; name: string }>;
    expect(reachRadiusOf(0)).toBe(rows[0]!.r);
    expect(reachRadiusOf(rows[rows.length - 1]!.sigs)).toBe(rows[rows.length - 1]!.r);
    for (let i = 1; i < rows.length; i++) expect(reachRadiusOf(rows[i]!.sigs)).toBeGreaterThan(reachRadiusOf(rows[i - 1]!.sigs));
    expect(withinReachOf(0, 90, -60)).toBe(true);   /* the Milky Way is home */
    expect(currentRegionOf(0).name).toBe(rows[0]!.name);
  });
});

describe('@cf/scene — system composition (the Gate D descent target)', () => {
  it('★ Sol: eight planets Mercury→Neptune in orbit order, Earth seed 133, gas giants ringed/mooned', () => {
    const s = systemScene(SOL_SEED);
    expect(s.sol).toBe(true);
    expect(s.planets.map((p) => p.name)).toEqual(['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']);
    const earth = s.planets[2]!;
    expect(earth.seed).toBe(133);
    expect(earth.ordinal).toBe(2);
    expect(earth.type).toBe('terran');
    expect(s.planets[5]!.ring, 'Saturn wears its ring').toBe(true);
    /* orbit order is the render ladder — strictly increasing */
    for (let i = 1; i < s.planets.length; i++) expect(s.planets[i]!.orb).toBeGreaterThan(s.planets[i - 1]!.orb);
  });
  it('a procedural system is deterministic and orbit-sorted', () => {
    const a = systemScene(31337), b = systemScene(31337);
    expect(JSON.stringify(a.planets.map((p) => [p.seed, p.orb, p.ordinal]))).toBe(JSON.stringify(b.planets.map((p) => [p.seed, p.orb, p.ordinal])));
    for (let i = 1; i < a.planets.length; i++) expect(a.planets[i]!.orb).toBeGreaterThanOrEqual(a.planets[i - 1]!.orb);
  });
  it('★ preserves source ordinals when presentation orbit order differs', () => {
    const s = systemScene(77, () => ({
      planets: [
        { name: 'Outer', orb: 220, P: { seed: 9001, type: 'rocky' } },
        { name: 'Inner', orb: 60, P: { seed: 9002, type: 'rocky' } },
        { name: 'Middle', orb: 140, P: { seed: 9003, type: 'rocky' } },
      ],
    }));
    expect(s.planets.map((planet) => [planet.seed, planet.ordinal])).toEqual([
      [9002, 1], [9003, 2], [9001, 0],
    ]);
    /* Negative control: display position is deliberately not identity. */
    expect(s.planets.map((planet, renderIndex) => planet.ordinal === renderIndex)).toEqual([
      false, false, false,
    ]);
  });
  it('the P objects are the MEMOIZED originals — composition must not clone or mutate them (the systemSol lesson)', () => {
    const s1 = systemScene(1);
    const s2 = systemScene(1);
    for (let i = 0; i < s1.planets.length; i++) expect(s1.planets[i]!.P).toBe(s2.planets[i]!.P);
  });
});
