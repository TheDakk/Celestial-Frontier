import { describe, it, expect, beforeAll } from 'vitest';
import { NAV_HOME, enterGalaxy, enterSystem, land, ascend, navToView, homeUniverse, systemScene, HOME_GAL_SEED, SOL_SEED, type NavState } from '@cf/scene';
import { installCaptureHooks } from '@cf/domain-descriptors';

beforeAll(() => installCaptureHooks());

describe('@cf/scene — zoom-mode state machine (Gate D navigation core)', () => {
  it('the full descent and return: universe → galaxy → system → surface → back up', () => {
    const gal = { seed: 999, x: 90, y: -60 };
    const star = { seed: 424242, x: 560, y: 170 };
    const planet = { seed: 133 };
    let s: NavState = NAV_HOME;
    const g1 = enterGalaxy(s, gal); expect(g1.ok).toBe(true); s = (g1 as { ok: true; state: NavState }).state;
    const s1 = enterSystem(s, star); expect(s1.ok).toBe(true); s = (s1 as { ok: true; state: NavState }).state;
    const l1 = land(s, planet); expect(l1.ok).toBe(true); s = (l1 as { ok: true; state: NavState }).state;
    expect(s.mode).toBe('surface');
    /* the return ladder clears context as it goes — a stale star/planet can
       never leak into the next descent (the st.star-null crash class) */
    s = (ascend(s) as { ok: true; state: NavState }).state;
    expect(s.mode).toBe('system'); expect(s.planet).toBeNull();
    s = (ascend(s) as { ok: true; state: NavState }).state;
    expect(s.mode).toBe('galaxy'); expect(s.star).toBeNull();
    s = (ascend(s) as { ok: true; state: NavState }).state;
    expect(s.mode).toBe('universe'); expect(s.gal).toBeNull();
    expect(ascend(s).ok).toBe(false);
  });
  it('illegal jumps are rejected, not absorbed', () => {
    expect(enterSystem(NAV_HOME, { seed: 1, x: 0, y: 0 }).ok).toBe(false);
    expect(land(NAV_HOME, { seed: 1 }).ok).toBe(false);
    expect(enterGalaxy(NAV_HOME, { seed: NaN, x: 0, y: 0 }).ok).toBe(false);
  });
  it('navToView emits the save-view shape (the _sanitizeView contract)', () => {
    const gal = { seed: 999, x: 90, y: -60, size: 14.5, sp: 4, tilt: 0.62, rot: 1.13, home: true };
    let s = (enterGalaxy(NAV_HOME, gal) as { ok: true; state: NavState }).state;
    s = (enterSystem(s, { seed: 424242, x: 560, y: 170 }) as { ok: true; state: NavState }).state;
    s = (land(s, { seed: 133 }) as { ok: true; state: NavState }).state;
    const v = navToView(s)!;
    expect(v.type).toBe('planet');
    expect((v.gal as { seed: number }).seed).toBe(999);
    expect((v.star as { seed: number }).seed).toBe(424242);
    expect(v.pseed).toBe(133);
  });
  it('★ viewToNav round-trips through the REAL _sanitizeView (the save pipeline contract)', async () => {
    const { viewToNav } = await import('@cf/scene');
    const { _sanitizeView } = await import('@cf/domain-strays');
    const gal = { seed: 999, x: 90, y: -60, size: 14.5, sp: 4, tilt: 0.62, rot: 1.13, home: true };
    let s = (enterGalaxy(NAV_HOME, gal) as { ok: true; state: NavState }).state;
    s = (enterSystem(s, { seed: 424242, x: 560, y: 170 }) as { ok: true; state: NavState }).state;
    s = (land(s, { seed: 133 }) as { ok: true; state: NavState }).state;
    /* surface → view → sanitize → nav: mode and every seed survive */
    const back = viewToNav(_sanitizeView(navToView(s)));
    expect(back.mode).toBe('surface');
    expect(back.gal!.seed).toBe(999);
    expect(back.star!.seed).toBe(424242);
    expect(back.planet!.seed).toBe(133);
    /* system (no planet) and galaxy tiers round-trip too */
    const sys = (ascend(s) as { ok: true; state: NavState }).state;
    expect(viewToNav(_sanitizeView(navToView(sys))).mode).toBe('system');
    const galOnly = (ascend(sys) as { ok: true; state: NavState }).state;
    expect(viewToNav(_sanitizeView(navToView(galOnly))).mode).toBe('galaxy');
  });
  it('viewToNav DEGRADES toward home instead of inventing context', async () => {
    const { viewToNav, NAV_HOME: HOME } = await import('@cf/scene');
    expect(viewToNav(null)).toBe(HOME);
    expect(viewToNav({})).toBe(HOME);
    /* a planet view with no star cannot be a surface — it is a galaxy view */
    expect(viewToNav({ type: 'planet', gal: { seed: 7, x: 0, y: 0 }, pseed: 3 }).mode).toBe('galaxy');
    /* a star view with a garbage star seed is a galaxy view */
    expect(viewToNav({ type: 'star', gal: { seed: 7, x: 0, y: 0 }, star: { seed: NaN, x: 0, y: 0 } }).mode).toBe('galaxy');
    /* no gal at all — universe, whatever the type claims */
    expect(viewToNav({ type: 'planet', star: { seed: 1, x: 0, y: 0 }, pseed: 3 }).mode).toBe('universe');
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
});

describe('@cf/scene — galaxy composition (the Renderer cell convention, verified)', () => {
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
       canonical completion at the pure eligibility seam. The app also
       requires a newly banked real landfall before it changes ascCh. */
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
    expect(earth.type).toBe('terran');
    expect(s.planets[5]!.ring, 'Saturn wears its ring').toBe(true);
    /* orbit order is the render ladder — strictly increasing */
    for (let i = 1; i < s.planets.length; i++) expect(s.planets[i]!.orb).toBeGreaterThan(s.planets[i - 1]!.orb);
  });
  it('a procedural system is deterministic and orbit-sorted', () => {
    const a = systemScene(31337), b = systemScene(31337);
    expect(JSON.stringify(a.planets.map((p) => [p.seed, p.orb]))).toBe(JSON.stringify(b.planets.map((p) => [p.seed, p.orb])));
    for (let i = 1; i < a.planets.length; i++) expect(a.planets[i]!.orb).toBeGreaterThanOrEqual(a.planets[i - 1]!.orb);
  });
  it('the P objects are the MEMOIZED originals — composition must not clone or mutate them (the systemSol lesson)', () => {
    const s1 = systemScene(1);
    const s2 = systemScene(1);
    for (let i = 0; i < s1.planets.length; i++) expect(s1.planets[i]!.P).toBe(s2.planets[i]!.P);
  });
});
