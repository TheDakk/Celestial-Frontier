/* THE SPECIES AUDIT (Phase 5's scale gate, the game's "1010 rendered clean"
   ported): every Earth-catalog name + a procedural spread through the
   VERBATIM hdart engine — counted, failures named, contact sheets baked.
   Driven headless by tools/speciesaudit.mjs; also runnable by hand. */
import {
  renderSpeciesPortraitCanvas,
  speciesPortrait,
  verbatimSpeciesPortraitForAudit,
  CLIPPED,
} from '@cf/art/species';
import { _EARTH_NAMES } from '@cf/domain-descriptors';
import { makeGenome } from '@cf/domain-genome';
import { crossGenome } from '@cf/domain-genetics';
import { hashInt } from '@cf/domain-rand';
import { resolveOverride } from '@cf/art/species-compat';

const log = document.getElementById('log')!;
const say = (t: string): void => { log.textContent = t; };
/* FULL-SIZE EXPORT MODE (?full=1): stream every portrait at the engine's
   NATIVE resolution through a pull-buffer for the driver to write to disk
   (Nick's system-check deliverable — no downscales, no re-encodes). */
const FULL = location.search.includes('full');
interface FullItem { k: string; name: string; url: string }
const fullQ: FullItem[] = [];
(window as unknown as Record<string, unknown>).__CF_FULL__ = { q: fullQ, done: false };
async function pushFull(k: string, name: string, url: string | null): Promise<void> {
  if (!FULL || !url) return;
  fullQ.push({ k, name, url });
  while (fullQ.length > 12) await new Promise((r) => setTimeout(r, 80));   /* let the driver drain */
}
interface SheetSpec { key: string; cells: Array<{ name: string; url: string | null }> }

/* HYBRID OUTCOME MODE (?hybrid=1): prove the set-qualified production contract
   with real crosses. Seven Platinum-reviewed fauna lineages use their modern
   named whole-form owner; every other fauna lineage retains the compatibility
   renderer, while flora/fungi/microbe use their exact named owner. A stripped
   child must take a different procedural outcome, and final data URLs catch
   cache collisions between full genomes. */
async function hybridBlendAudit(): Promise<void> {
  type K = 'fauna' | 'flora' | 'fungi' | 'microbe';
  type G = Record<string, unknown>;
  const cross = (a: G, b: G): G => crossGenome(a as never, b as never) as unknown as G;
  const named = (seed: number, kingdom: K, name: string): G => ({
    ...makeGenome(seed >>> 0, kingdom, 1) as unknown as G,
    _earthName: name,
  });
  const alien = (seed: number, kingdom: K, heat: number): G =>
    makeGenome(seed >>> 0, kingdom, heat) as unknown as G;
  const stripLineage = (genome: G): G => {
    const stripped = { ...genome };
    delete stripped._earthName;
    delete stripped._earthBlend;
    delete stripped._earthBlendKingdom;
    delete stripped._anchorVal;
    delete stripped._src;
    return stripped;
  };
  /* Keep two independent audit channels. `rawRoute` proves which historical
     painter owns the genome and retains a raw owned-vs-verbatim negative
     control. `freshRoute` applies the production finishing pass without
     entering the portrait cache, so cache parity compares polished pixels to
     polished pixels instead of passing merely because the global grade exists. */
  const rawRoute = (genome: G): { owner: 'owned' | 'verbatim'; pixels: string } => {
    const owned = resolveOverride(genome as never);
    return owned === null
      ? { owner: 'verbatim', pixels: verbatimSpeciesPortraitForAudit(genome) }
      : { owner: 'owned', pixels: owned };
  };
  const freshRoute = (genome: G): { owner: 'owned' | 'verbatim'; pixels: string } => {
    const raw = rawRoute(genome);
    const pixels = renderSpeciesPortraitCanvas(genome).toDataURL();
    return { owner: raw.owner, pixels };
  };
  const routeLabel = (genome: G, owner: 'owned' | 'verbatim'): string =>
    typeof genome._earthName === 'string' ? `named-${owner}`
      : typeof genome._earthBlend === 'string' ? `lineage-${owner}`
        : `procedural-${owner}`;
  const reviewedFaunaLineages = new Set([
    'Fruit Bat', 'Eagle', 'Wolf', 'Elephant', 'Chameleon', 'Dragonfly', 'Octopus',
  ]);
  const expectedLineageRoute = (owner: K, name: string): 'lineage-owned' | 'lineage-verbatim' =>
    owner !== 'fauna' || reviewedFaunaLineages.has(name) ? 'lineage-owned' : 'lineage-verbatim';

  let proceduralBase: G | null = null;
  let procedural = '';
  let proceduralOwnedRaw = '';
  let proceduralVerbatim = '';
  for (let i = 0; i < 32; i++) {
    const candidate = alien(hashInt(0xB1E7D, i, 9) >>> 0, 'fauna', 1);
    const raw = rawRoute(candidate);
    const fallback = verbatimSpeciesPortraitForAudit(candidate);
    if (raw.owner === 'owned' && raw.pixels !== fallback) {
      proceduralBase = candidate;
      procedural = speciesPortrait(candidate);
      proceduralOwnedRaw = raw.pixels;
      proceduralVerbatim = fallback;
      break;
    }
  }
  if (!proceduralBase) {
    (window as unknown as Record<string, unknown>).__CF_HYBRID__ = {
      done: true, pass: false, errors: ['negative control could not find a procedural override route'],
    };
    return;
  }

  const focusSpecs: Array<{ id: string; kingdom: K; name: string; seed: number }> = [
    { id: 'fauna-wolf', kingdom: 'fauna', name: 'Wolf', seed: 0xEA7101 },
    { id: 'flora-apple', kingdom: 'flora', name: 'Apple', seed: 0xEA7201 },
    { id: 'fungi-oyster-mushroom', kingdom: 'fungi', name: 'Oyster Mushroom', seed: 0xEA7301 },
    { id: 'microbe-amoeba', kingdom: 'microbe', name: 'Amoeba', seed: 0xEA7401 },
    { id: 'flora-vanilla-orchid', kingdom: 'flora', name: 'Vanilla Orchid', seed: 0xEA7501 },
  ];
  const stageIds = ['pure-earth', 'earth-earth-0.90', 'earth-alien-0.73', 'next-alien-0.46', 'floor-0.22'];
  const anchorTargets = [1, 0.9, 0.73, 0.46, 0.22];
  const focusLineages = focusSpecs.map((spec, specIndex) => {
    const earth = named(spec.seed, spec.kingdom, spec.name);
    const earthMate = named(spec.seed + 1, spec.kingdom, spec.name);
    const alien1 = alien(0xA11000 + specIndex * 0x100 + 1, spec.kingdom, 1);
    const alien2 = alien(0xA11000 + specIndex * 0x100 + 2, spec.kingdom, 2);
    const alien3 = alien(0xA11000 + specIndex * 0x100 + 3, spec.kingdom, 3);
    const earthEarth = cross(earth, earthMate);
    const earthAlien = cross(earth, alien1);
    const nextAlien = cross(earthAlien, alien2);
    const floor = cross(nextAlien, alien3);
    const genomes = [earth, earthEarth, earthAlien, nextAlien, floor];
    const pixels: string[] = [];
    const stages = genomes.map((genome, stageIndex) => {
      const fresh = freshRoute(genome);
      const production = speciesPortrait(genome);
      const repeated = speciesPortrait(genome);
      const expectedOwner = stageIndex === 0 || expectedLineageRoute(spec.kingdom, spec.name) === 'lineage-owned'
        ? 'owned' : 'verbatim';
      const stripped = stageIndex === 0 ? null : stripLineage(genome);
      const strippedFresh = stripped ? freshRoute(stripped) : null;
      const strippedProduction = stripped ? speciesPortrait(stripped) : '';
      pixels.push(production);
      return {
        id: stageIds[stageIndex],
        anchor: stageIndex === 0 ? 1 : Number(genome._anchorVal),
        expectedAnchor: anchorTargets[stageIndex],
        route: routeLabel(genome, fresh.owner),
        expectedRoute: routeLabel(genome, expectedOwner),
        productionMatchesFresh: production === fresh.pixels,
        repeatedProductionStable: production === repeated,
        strippedRoute: strippedFresh ? routeLabel(stripped!, strippedFresh.owner) : null,
        strippedProductionMatchesFresh: strippedFresh ? strippedProduction === strippedFresh.pixels : null,
        strippedDiffers: strippedFresh ? production !== strippedProduction : null,
        lineage: typeof genome._earthBlend === 'string' ? genome._earthBlend : genome._earthName,
      };
    });
    return {
      id: spec.id,
      kingdom: spec.kingdom,
      name: spec.name,
      parents: { earth, earthMate, alien1, alien2, alien3 },
      genomes,
      stages,
      pixels,
      stagePixelsDistinct: new Set(pixels).size === pixels.length,
    };
  });

  /* Same-name genomes are bred through each catalogue kingdom. The shared
     derived seed makes this a cache/selector outcome check rather than a
     hand-authored route fixture. */
  const duplicateSpecs: Array<{ name: string; kingdoms: [K, K] }> = [
    { name: 'Green Algae', kingdoms: ['flora', 'microbe'] },
    { name: 'Snow Algae', kingdoms: ['flora', 'microbe'] },
    { name: 'Reindeer Lichen', kingdoms: ['flora', 'fungi'] },
    { name: 'Tardigrade', kingdoms: ['fauna', 'microbe'] },
  ];
  const duplicateRouteResults = duplicateSpecs.map((spec, index) => {
    const seed = 0xD07100 + index * 0x10;
    const mateSeed = 0xD07200 + index * 0x10;
    const rows = spec.kingdoms.map((kingdom) => {
      const earth = named(seed, kingdom, spec.name);
      const wild = alien(mateSeed, kingdom, 2);
      const child = cross(earth, wild);
      const fresh = freshRoute(child);
      const production = speciesPortrait(child);
      const stripped = stripLineage(child);
      const strippedPixels = speciesPortrait(stripped);
      const expectedOwner = expectedLineageRoute(kingdom, spec.name) === 'lineage-owned' ? 'owned' : 'verbatim';
      return {
        kingdom,
        seed: child.seed,
        lineage: child._earthBlend,
        route: routeLabel(child, fresh.owner),
        expectedRoute: routeLabel(child, expectedOwner),
        productionMatchesFresh: production === fresh.pixels,
        strippedDiffers: production !== strippedPixels,
        pixels: production,
      };
    });
    return {
      name: spec.name,
      rows,
      sameDerivedSeed: rows[0]!.seed === rows[1]!.seed,
      kingdomPixelsDistinct: rows[0]!.pixels !== rows[1]!.pixels,
    };
  });

  /* Real breeding allows any two kingdoms. The child kingdom is inherited by
     a separate RNG pick from the Earth lineage, so both parent orders must keep
     the catalogue owner even when those values disagree. */
  const mixedResult = (child: G, label: string, expectedLineage: string, expectedOwner: K) => {
    const fresh = freshRoute(child);
    const production = speciesPortrait(child);
    const stripped = stripLineage(child);
    const expectedRoute = expectedLineageRoute(expectedOwner, expectedLineage);
    return {
      label,
      childKingdom: child.kingdom,
      lineage: child._earthBlend,
      lineageKingdom: child._earthBlendKingdom,
      expectedLineage,
      expectedLineageKingdom: expectedOwner,
      route: routeLabel(child, fresh.owner),
      expectedRoute,
      productionMatchesFresh: production === fresh.pixels,
      strippedDiffers: production !== speciesPortrait(stripped),
    };
  };
  const findMixed = (owner: K, name: string, other: K, order: 'earth-first' | 'earth-second',
    wantedChild: K, salt: number) => {
    for (let attempt = 0; attempt < 2048; attempt++) {
      const earth = named(hashInt(0xC2055, salt, attempt) >>> 0, owner, name);
      const wild = alien(hashInt(0xA11E7, salt, attempt) >>> 0, other, attempt % 3);
      const child = order === 'earth-first' ? cross(earth, wild) : cross(wild, earth);
      if (child.kingdom === wantedChild && child._earthBlend === name
        && child._earthBlendKingdom === owner) {
        return mixedResult(child, `${name}/${order}/${wantedChild}`, name, owner);
      }
    }
    throw new Error(`mixed-kingdom sentinel not found: ${name}/${order}/${wantedChild}`);
  };
  const mixedKingdomResults = [
    findMixed('flora', 'Apple', 'fauna', 'earth-first', 'flora', 1),
    findMixed('flora', 'Apple', 'fauna', 'earth-first', 'fauna', 2),
    findMixed('flora', 'Apple', 'fauna', 'earth-second', 'flora', 3),
    findMixed('flora', 'Apple', 'fauna', 'earth-second', 'fauna', 4),
    findMixed('fauna', 'Wolf', 'flora', 'earth-first', 'fauna', 5),
    findMixed('fauna', 'Wolf', 'flora', 'earth-first', 'flora', 6),
    findMixed('fauna', 'Wolf', 'flora', 'earth-second', 'fauna', 7),
    findMixed('fauna', 'Wolf', 'flora', 'earth-second', 'flora', 8),
  ];
  const findDuplicateMixed = (order: 'flora-first' | 'microbe-first', wantedOwner: 'flora' | 'microbe',
    wantedChild: 'flora' | 'microbe', salt: number) => {
    for (let attempt = 0; attempt < 2048; attempt++) {
      const flora = named(hashInt(0x6A1A, salt, attempt) >>> 0, 'flora', 'Green Algae');
      const microbe = named(hashInt(0x6A1B, salt, attempt) >>> 0, 'microbe', 'Green Algae');
      const child = order === 'flora-first' ? cross(flora, microbe) : cross(microbe, flora);
      if (child.kingdom === wantedChild && child._earthBlend === 'Green Algae'
        && child._earthBlendKingdom === wantedOwner) {
        return mixedResult(child, `Green Algae/${order}/${wantedOwner}/${wantedChild}`,
          'Green Algae', wantedOwner);
      }
    }
    throw new Error(`duplicate mixed-kingdom sentinel not found: ${order}/${wantedOwner}/${wantedChild}`);
  };
  const duplicateMixedResults = (['flora-first', 'microbe-first'] as const).flatMap((order, orderIndex) =>
    (['flora', 'microbe'] as const).flatMap((owner, ownerIndex) =>
      (['flora', 'microbe'] as const).map((childKingdom, childIndex) =>
        findDuplicateMixed(order, owner, childKingdom, 20 + orderIndex * 4 + ownerIndex * 2 + childIndex))));

  /* The two externally approved fauna rows are explicit compatibility controls.
     Exercise all four real crosses so the bounded seven-name migration cannot
     silently widen into a kingdom-wide route change. */
  const protectedFaunaLineages = ['Sea Turtle', 'Great White Shark'].map((name, index) => {
    const earth = named(0xEA7601 + index * 0x100, 'fauna', name);
    const earthMate = named(0xEA7602 + index * 0x100, 'fauna', name);
    const alien1 = alien(0xA11601 + index * 0x100, 'fauna', 1);
    const alien2 = alien(0xA11602 + index * 0x100, 'fauna', 2);
    const alien3 = alien(0xA11603 + index * 0x100, 'fauna', 3);
    const earthEarth = cross(earth, earthMate);
    const earthAlien = cross(earth, alien1);
    const nextAlien = cross(earthAlien, alien2);
    const floor = cross(nextAlien, alien3);
    const genomes = [earth, earthEarth, earthAlien, nextAlien, floor];
    return {
      name,
      stages: genomes.map((genome, stageIndex) => {
        const fresh = freshRoute(genome), production = speciesPortrait(genome);
        return {
          id: stageIds[stageIndex],
          anchor: stageIndex === 0 ? 1 : Number(genome._anchorVal),
          route: routeLabel(genome, fresh.owner),
          expectedRoute: stageIndex === 0 ? 'named-owned' : 'lineage-verbatim',
          productionMatchesFresh: production === fresh.pixels,
          repeatedProductionStable: production === speciesPortrait(genome),
          lineage: typeof genome._earthBlend === 'string' ? genome._earthBlend : genome._earthName,
        };
      }),
    };
  });

  const faunaFocus = focusLineages[0]!;
  const earthWolf = faunaFocus.parents.earth;
  const alienFauna = faunaFocus.parents.alien1;
  const earthEarth = faunaFocus.genomes[1]!;
  const earthAlien = faunaFocus.genomes[2]!;
  const grandchild = faunaFocus.genomes[3]!;
  const earthEagle = named(0xEA7102, 'fauna', 'Eagle');
  const eagleChild = cross(earthEagle, alienFauna);
  const alienEarth = cross(alienFauna, earthWolf);
  const repeatedCross = cross(earthWolf, alienFauna);
  const earthAlienPixels = speciesPortrait(earthAlien);
  const alienEarthPixels = speciesPortrait(alienEarth);
  const actualChildResults = focusLineages.flatMap((lineage) => lineage.stages.slice(1).map((stage) => ({
    kingdom: lineage.kingdom,
    blend: stage.lineage,
    anchor: stage.anchor,
    route: stage.route,
    expectedRoute: stage.expectedRoute,
    routeMatchesExpected: stage.route === stage.expectedRoute,
    strippedDiffers: stage.strippedDiffers,
  })));
  const hybridStages = focusLineages.flatMap((lineage) => lineage.stages.slice(1));
  const nonFaunaStages = focusLineages.filter((lineage) => lineage.kingdom !== 'fauna')
    .flatMap((lineage) => lineage.stages.slice(1));
  const duplicateRows = duplicateRouteResults.flatMap((pair) => pair.rows);
  const catalogue = _EARTH_NAMES as unknown as Record<K, string[]>;
  const nonFaunaRouteCoverage = (['flora', 'fungi', 'microbe'] as const).map((kingdom, kingdomIndex) => {
    const names = catalogue[kingdom];
    const unowned: string[] = [];
    for (const [index, name] of names.entries()) {
      const earth = named(hashInt(0xE471B, kingdomIndex, index) >>> 0, kingdom, name);
      const wild = alien(hashInt(0xA11E5, kingdomIndex, index) >>> 0, kingdom, index % 3);
      const child = cross(earth, wild);
      if (child._earthBlend !== name || Math.abs(Number(child._anchorVal) - 0.73) > 1e-9
        || resolveOverride(child as never) === null) unowned.push(name);
    }
    return { kingdom, catalogueCount: names.length, unowned };
  });
  const checks = {
    proceduralControlDiffersFromVerbatim: proceduralOwnedRaw !== proceduralVerbatim,
    reviewedFaunaBlendUsesOwnedRoute:
      resolveOverride(earthAlien as never) !== null,
    blendDiffersFromProcedural: earthAlienPixels !== procedural,
    lineagesHaveDistinctPixels: earthAlienPixels !== speciesPortrait(eagleChild),
    anchorValuesHaveDistinctPixels: earthAlienPixels !== speciesPortrait(grandchild),
    repeatedBlendIsStable: earthAlienPixels === speciesPortrait(earthAlien),
    actualCrossesWriteLineage: focusLineages.every((lineage) => lineage.genomes.slice(1).every((child) =>
      child._earthBlend === lineage.name && child._earthBlendKingdom === lineage.kingdom
      && typeof child._anchorVal === 'number')),
    actualCrossPixelsUseLineage: hybridStages.every((stage) =>
      stage.route === stage.expectedRoute && stage.strippedDiffers === true),
    earthEarthRetainsMoreAnchorThanEarthAlien:
      Number(earthEarth._anchorVal) > Number(earthAlien._anchorVal),
    multigenerationAnchorDrifts:
      Number(grandchild._anchorVal) < Number(earthAlien._anchorVal),
    faunaAndFloraCrossesCovered:
      focusLineages.some((row) => row.kingdom === 'fauna') && focusLineages.some((row) => row.kingdom === 'flora'),
    allKingdomsCovered: new Set(focusLineages.map((row) => row.kingdom)).size === 4,
    reviewedFaunaUsesOwnedLineageRoute:
      faunaFocus.stages.slice(1).every((stage) => stage.route === 'lineage-owned'),
    protectedFaunaUsesVerbatimLineageRoute:
      protectedFaunaLineages.every((lineage) => lineage.stages.slice(1).every((stage) =>
        stage.lineage === lineage.name && stage.route === 'lineage-verbatim'
        && stage.expectedRoute === 'lineage-verbatim' && stage.productionMatchesFresh
        && stage.repeatedProductionStable)),
    purePathsStayNamedOwned:
      focusLineages.every((lineage) => lineage.stages[0]?.route === 'named-owned')
      && protectedFaunaLineages.every((lineage) => lineage.stages[0]?.route === 'named-owned'),
    nonFaunaUsesOwnedNamedRoute:
      nonFaunaStages.every((stage) => stage.route === 'lineage-owned'),
    nonFaunaProductionMatchesOwnedRoute:
      nonFaunaStages.every((stage) => stage.productionMatchesFresh),
    floraLineageDiffersWhenStripped:
      focusLineages.find((row) => row.kingdom === 'flora')!.stages.slice(1).every((stage) => stage.strippedDiffers),
    fungiLineageDiffersWhenStripped:
      focusLineages.find((row) => row.kingdom === 'fungi')!.stages.slice(1).every((stage) => stage.strippedDiffers),
    microbeLineageDiffersWhenStripped:
      focusLineages.find((row) => row.kingdom === 'microbe')!.stages.slice(1).every((stage) => stage.strippedDiffers),
    fiveStageTargetsRendered:
      focusLineages.every((lineage) => lineage.stages.length === 5),
    anchorTargetsExact: focusLineages.every((lineage) => lineage.stages.every((stage, index) =>
      Math.abs(Number(stage.anchor) - anchorTargets[index]!) < 1e-9)),
    focusedStagePixelsStayDistinct:
      focusLineages.every((lineage) => lineage.stagePixelsDistinct),
    productionMatchesFreshRoute:
      focusLineages.every((lineage) => lineage.stages.every((stage) => stage.productionMatchesFresh)),
    strippedControlsMatchFreshRoute:
      hybridStages.every((stage) => stage.strippedProductionMatchesFresh === true),
    crossKingdomDuplicateRoutesAreSetSpecific:
      duplicateRouteResults.every((pair) => pair.sameDerivedSeed && pair.kingdomPixelsDistinct)
      && duplicateRows.every((row) => row.lineage && row.route === row.expectedRoute
        && row.productionMatchesFresh && row.strippedDiffers),
    mixedKingdomLineageOwnerSurvives:
      mixedKingdomResults.every((row) => row.lineage === row.expectedLineage
        && row.lineageKingdom === row.expectedLineageKingdom),
    mixedKingdomRouteUsesLineageOwner:
      mixedKingdomResults.every((row) => row.route === row.expectedRoute
        && row.productionMatchesFresh && row.strippedDiffers),
    duplicateNameMixedKingdomOwnerSurvives:
      duplicateMixedResults.every((row) => row.lineage === row.expectedLineage
        && row.lineageKingdom === row.expectedLineageKingdom
        && row.route === row.expectedRoute && row.productionMatchesFresh && row.strippedDiffers),
    nonFaunaCatalogueBlendRoutesOwned:
      nonFaunaRouteCoverage.every((row) => row.catalogueCount > 0 && row.unowned.length === 0),
    swappedParentsShareSeedButDifferGenome:
      earthAlien.seed === alienEarth.seed
      && JSON.stringify(earthAlien) !== JSON.stringify(alienEarth),
    swappedParentPixelsStayDistinct: earthAlienPixels !== alienEarthPixels,
    repeatedCrossIsDeterministic:
      JSON.stringify(earthAlien) === JSON.stringify(repeatedCross)
      && speciesPortrait(earthAlien) === speciesPortrait(repeatedCross),
  };
  const errors = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
  (window as unknown as Record<string, unknown>).__CF_HYBRID__ = {
    done: true,
    pass: errors.length === 0,
    errors,
    seed: proceduralBase.seed,
    checks,
    actualChildResults,
    focusLineages: focusLineages.map((lineage) => ({
      id: lineage.id,
      kingdom: lineage.kingdom,
      name: lineage.name,
      stages: lineage.stages,
      stagePixelsDistinct: lineage.stagePixelsDistinct,
    })),
    duplicateRouteResults: duplicateRouteResults.map((pair) => ({
      name: pair.name,
      sameDerivedSeed: pair.sameDerivedSeed,
      kingdomPixelsDistinct: pair.kingdomPixelsDistinct,
      rows: pair.rows.map(({ pixels: _pixels, ...row }) => row),
    })),
    mixedKingdomResults,
    duplicateMixedResults,
    protectedFaunaLineages,
    nonFaunaRouteCoverage,
  };
  say(`hybrid blend audit: ${errors.length ? 'FAIL ' + errors.join(', ') : 'PASS'}`);
}

/* STRIP MODE (?strip=A,B,C): render just the named species BIG and labelled,
   into one sheet — the standing eyeball instrument for a morphology wave.
   The audit proves 1,254 paint; the strip is how a human judges a handful. */
async function strip(names: string[]): Promise<void> {
  const NAMES = _EARTH_NAMES as unknown as Record<string, string[]>;
  const want = names.map((n) => n.trim().replace(/[''’‘]/g, "'")).filter(Boolean);
  const cells: Array<{ name: string; url: string | null }> = [];
  for (const n of want) {
    let url: string | null = null;
    /* PROCEDURAL FORM: "proc:<kingdom>:h<heat>:s<seed>" renders a genome with
       NO _earthName — the path every bred creature takes. Until this existed
       no instrument had ever shown us one, and twelve waves were judged
       entirely on the Earth catalogue. */
    const pm = /^proc:(\w+):h(\d+):s(\d+)$/.exec(n);
    if (pm) {
      const [, kingdom, heat, s] = pm;
      /* ⚠ D-ART-155 — THIS DERIVED A DIFFERENT SEED THAN THE EXPORT, so the
         only instrument a human can point at a procedural asset rendered a
         DIFFERENT CREATURE than the file that was judged. The export uses
         `hashInt(0xF00D, ki*100 + heat*25 + s, 7)`; this used `hashInt(0xF00D,
         s, 7)`, dropping kingdom and heat from the hash entirely — so the two
         agree only when ki = 0 AND heat = 0, i.e. fauna/h0, and disagree for
         every one of the other ~230 procedural assets.
         It is the D-ART-147/join family again: two places computing the same
         identifier by different rules, silently, with both looking correct.
         Derived from the SAME expression as the export now, keyed off the same
         kingdom ordering. */
      const ki = Object.keys(_EARTH_NAMES as Record<string, unknown>).indexOf(kingdom!);
      const seed = (hashInt(0xF00D, ki * 100 + Number(heat) * 25 + Number(s), 7) >>> 0);
      const g = makeGenome(seed, kingdom!, Number(heat)) as Record<string, unknown>;
      try { url = speciesPortrait(g); } catch { url = null; }
      cells.push({ name: `${kingdom}·h${heat}·s${s}`, url });
      continue;
    }
    for (const [ki, kingdom] of Object.keys(NAMES).entries()) {
      /* normalise BOTH sides: the catalog stores a curly apostrophe
         (Lion's Mane) and a raw compare silently failed to find it */
      const norm = (s: string): string => s.replace(/[’‘]/g, "'");
      const i = NAMES[kingdom]!.findIndex((x) => norm(x) === norm(n));
      if (i < 0) continue;
      /* the SAME genome the audit uses, so the strip shows the audited pixels */
      const g = makeGenome((hashInt(0xEA47, i, ki) >>> 0), kingdom, 1) as Record<string, unknown>;
      g._earthName = n;
      try { url = speciesPortrait(g); } catch { url = null; }
      break;
    }
    cells.push({ name: n, url });
  }
  const C = 300, LAB = 30, cols = Math.min(cells.length, 5);
  const rows = Math.ceil(cells.length / cols);
  const cv = document.createElement('canvas');
  cv.width = cols * C; cv.height = rows * (C + LAB);
  const c = cv.getContext('2d')!;
  c.fillStyle = '#07090d'; c.fillRect(0, 0, cv.width, cv.height);
  const failed: string[] = [];
  await Promise.all(cells.map((cell, i) => new Promise<void>((res) => {
    const x = (i % cols) * C, y = Math.floor(i / cols) * (C + LAB);
    c.fillStyle = '#8ea6c8'; c.font = '15px system-ui, sans-serif'; c.textAlign = 'center';
    c.fillText(cell.name, x + C / 2, y + C + 20);
    if (!cell.url) {
      failed.push(cell.name);
      c.strokeStyle = '#c0392b'; c.strokeRect(x + 8, y + 8, C - 16, C - 16); return res();
    }
    const im = new Image();
    im.onload = () => { c.drawImage(im, x + 6, y + 6, C - 12, C - 12); res(); };
    im.onerror = () => { failed.push(cell.name); res(); };
    im.src = cell.url;
  })));
  say(`strip: ${cells.length} species`);
  (window as unknown as Record<string, unknown>).__CF_STRIP__ = {
    done: true, url: cv.toDataURL(), failed,
  };
}

/* ★ PROPORTION MODE (?prop=<kingdom>) — WAVE 22. Nick: "the bodies on a lot of
   the creatures are not proportionate… some seem way too elongated, especially
   on mammals."

   Every instrument we have answers a yes/no about a single asset: did it paint,
   is it a duplicate, does it clip. None of them could see a SHAPE that is wrong
   across a whole family, because each animal is individually fine-looking until
   you line up its aspect ratio against its relatives. This measures the ink
   bounding box of every species in a kingdom and reports width/height.

   The fit pass scales uniformly (k = min(target/w, target/h)), so aspect ratio
   SURVIVES it — what this measures is the true proportion the painter drew. */
async function proportions(kingdom: string): Promise<void> {
  const NAMES = _EARTH_NAMES as unknown as Record<string, string[]>;
  const ki = Object.keys(NAMES).indexOf(kingdom);
  const pool = NAMES[kingdom] || [];
  const rows: Array<{ name: string; w: number; h: number; aspect: number; lobe: number; eyes: number; eyeU: number }> = [];
  const cv = document.createElement('canvas'); cv.width = cv.height = 440;
  const cc = cv.getContext('2d', { willReadFrequently: true })!;
  for (const [i, name] of pool.entries()) {
    const g = makeGenome((hashInt(0xEA47, i, ki) >>> 0), kingdom, 1) as Record<string, unknown>;
    g._earthName = name;
    let url: string | null = null;
    try { url = speciesPortrait(g); } catch { url = null; }
    if (!url) continue;
    await new Promise<void>((res) => {
      const im = new Image();
      im.onload = () => {
        cc.clearRect(0, 0, 440, 440); cc.drawImage(im, 0, 0);
        const d = cc.getImageData(0, 0, 440, 440).data;
        /* the portrait has a painted vignette background, so alpha cannot find
           the subject — measure against the BACKGROUND COLOUR instead, taking
           the frame's own corner as the reference. A threshold on luminance
           alone would have called the vignette's bright centre "subject". */
        const br = d[0]!, bg2 = d[1]!, bb = d[2]!;
        let x0 = 440, y0 = 440, x1 = -1, y1 = -1;
        for (let y = 0; y < 440; y++) {
          for (let x = 0; x < 440; x++) {
            const o = (y * 440 + x) * 4;
            const dr = d[o]! - br, dg = d[o + 1]! - bg2, db = d[o + 2]! - bb;
            if (dr * dr + dg * dg + db * db > 1500) {
              if (x < x0) x0 = x; if (x > x1) x1 = x;
              if (y < y0) y0 = y; if (y > y1) y1 = y;
            }
          }
        }
        if (x1 >= 0) {
          const w = x1 - x0 + 1, h = y1 - y0 + 1;
          /* ★ WAVE 22b — INTERNAL PROPORTION. Nick: "the horned lizard head is
             massive". Aspect ratio measures the WHOLE subject, so a head twice
             the size it should be is completely invisible to it — the bbox is
             identical either way. This walks the ink column by column and
             builds a height profile, then compares the END LOBES (where a head
             or a rump sits) against the TRUNK. A head bigger than the body it
             is attached to shows up as an end lobe taller than the middle. */
          const prof = new Array<number>(w).fill(0);
          for (let x = x0; x <= x1; x++) {
            let top = -1, bot = -1;
            for (let y = y0; y <= y1; y++) {
              const o = (y * 440 + x) * 4;
              const dr = d[o]! - br, dg = d[o + 1]! - bg2, db = d[o + 2]! - bb;
              if (dr * dr + dg * dg + db * db > 1500) { if (top < 0) top = y; bot = y; }
            }
            prof[x - x0] = top < 0 ? 0 : bot - top + 1;
          }
          const seg = (a: number, b: number): number => {
            let m = 0;
            for (let i = Math.floor(w * a); i < Math.ceil(w * b) && i < w; i++) m = Math.max(m, prof[i]!);
            return m;
          };
          const trunk = seg(0.27, 0.73) || 1;
          const lobe = Math.max(seg(0, 0.18), seg(0.82, 1));

          /* ★ STAGE 2 — IS THERE A READABLE EYE?
             Every eye in this library is drawn the same way: a pale sclera, a
             near-black pupil inside it, and a white catchlight. That signature
             is measurable — a very bright pixel with a very dark pixel within a
             few px. Nothing else in the palette does that, because the pattern
             law forbids hard edges everywhere else. Counting those pairs tells
             us whether the animal HAS a face, which no gate could see before. */
          const lum = (o: number): number => 0.299 * d[o]! + 0.587 * d[o + 1]! + 0.114 * d[o + 2]!;
          /* ⚠ THE FIRST DETECTOR WAS WRONG IN BOTH DIRECTIONS AND ITS SELF-TEST
             DID NOT NOTICE, because the self-test exercised the JUDGEMENT with
             synthetic numbers and never the SENSOR. It reported 7 eyes on the
             elephant (tusks and toenails: bright beside dark) and 0 on the wolf,
             lion, tiger, cat and dragonfly (a 2px stride steps straight over a
             1-2px catchlight).

             What actually distinguishes an eye is not "bright next to dark" —
             a tusk edge is that. It is bright ENCLOSED BY dark: a catchlight
             sits inside a pupil, so the dark surrounds it on most sides. A
             tusk or a claw has dark on one side only. Sample a ring of eight
             directions and require most of them dark. Stride 1, because the
             feature we are hunting is two pixels wide. */
          /* ⚠ AND THE FIRST ENCLOSURE TEST WAS ALSO WRONG — it made things WORSE
             (192 → 300 false "no eye"). The structure of every eye here is
             sclera → pupil → catchlight, three concentric discs. A fixed 4px
             ring around the catchlight of a SMALL eye lands back outside the
             pupil, in the bright sclera, so enclosure failed on exactly the
             eyes it was written to find. The ring has to be smaller than the
             pupil, and the pupil scales with the animal. So: try SEVERAL radii
             and accept if any one of them shows the catchlight enclosed. */
          const eyePx: Array<[number, number]> = [];
          const RINGS = [2, 3, 5, 8];
          for (let y = y0; y <= y1; y++) {
            for (let x = x0; x <= x1; x++) {
              if (lum((y * 440 + x) * 4) < 198) continue;
              let enclosed = false;
              for (const R of RINGS) {
                const q = Math.round(R * 0.7071);
                const dirs: Array<[number, number]> = [[R, 0], [-R, 0], [0, R], [0, -R],
                  [q, q], [q, -q], [-q, q], [-q, -q]];
                let dark = 0;
                for (const [dx, dy] of dirs) {
                  const yy = y + dy, xx = x + dx;
                  if (yy < 0 || yy > 439 || xx < 0 || xx > 439) { dark++; continue; }
                  if (lum((yy * 440 + xx) * 4) < 70) dark++;
                }
                if (dark >= 6) { enclosed = true; break; }
              }
              if (enclosed) eyePx.push([x, y]);
            }
          }
          /* cluster them so one eye is one finding, not forty pixels */
          const clusters: Array<{ x: number; y: number; n: number }> = [];
          for (const [x, y] of eyePx) {
            const c2 = clusters.find((k) => Math.abs(k.x / k.n - x) < 12 && Math.abs(k.y / k.n - y) < 12);
            if (c2) { c2.x += x; c2.y += y; c2.n++; } else clusters.push({ x, y, n: 1 });
          }
          /* a real catchlight is a few pixels; one stray pixel is noise and a hundred
             is a highlight on a flank, so the cluster must be eye-SIZED */
          /* ⚠ n >= 3 REJECTED REAL EYES. A catchlight on a mid-sized head is about two
             pixels across, so after the enclosure test only ONE pixel may survive.
             Requiring three found the lion and missed the wolf. One enclosed
             bright pixel IS the signature — nothing else in this palette makes
             bright-surrounded-by-dark, because the pattern law forbids hard
             edges everywhere else. The upper bound still rejects a lit flank. */
          const real = clusters.filter((k) => k.n >= 1 && k.n <= 260);
          /* where along the long axis do the eyes sit? 0 = left end, 1 = right.
             This is how we find WHICH END IS THE HEAD without guessing that
             every painter faces the same way — several do not. */
          const eyeU = real.length
            ? real.reduce((a, k) => a + (k.x / k.n - x0) / w, 0) / real.length
            : -1;

          rows.push({
            name, w, h,
            aspect: Math.round((w / h) * 1000) / 1000,
            lobe: Math.round((lobe / trunk) * 1000) / 1000,
            eyes: real.length,
            eyeU: Math.round(eyeU * 1000) / 1000,
          });
        }
        res();
      };
      im.onerror = () => res();
      im.src = url!;
    });
    if (i % 40 === 0) { say(`proportions ${kingdom}: ${i}/${pool.length}`); await new Promise((r) => setTimeout(r, 0)); }
  }
  say(`proportions ${kingdom}: ${rows.length} measured`);
  (window as unknown as Record<string, unknown>).__CF_PROP__ = { done: true, kingdom, rows };
}

async function run(): Promise<void> {
  if (new URLSearchParams(location.search).has('hybrid')) { await hybridBlendAudit(); return; }
  const pq = new URLSearchParams(location.search).get('prop');
  if (pq) { await proportions(pq); return; }
  const sp = new URLSearchParams(location.search).get('strip');
  if (sp) { await strip(sp.split(',')); return; }
  const NAMES = _EARTH_NAMES as unknown as Record<string, string[]>;
  const kingdoms = Object.keys(NAMES);
  const sheets: SheetSpec[] = [];
  const fails: string[] = [];
  let total = 0, ok = 0;
  /* the full Earth catalog, kingdom by kingdom */
  for (const [ki, kingdom] of kingdoms.entries()) {
    const cells: SheetSpec['cells'] = [];
    const pool = NAMES[kingdom]!;
    for (let i = 0; i < pool.length; i++) {
      const name = pool[i]!;
      total++;
      let url: string | null = null;
      try {
        const g = makeGenome((hashInt(0xEA47, i, ki) >>> 0), kingdom, 1) as Record<string, unknown>;
        g._earthName = name;
        url = speciesPortrait(g);
        if (!url || url.length < 3000) { url = null; throw new Error('thin paint'); }
        ok++;
      } catch (e) { fails.push(kingdom + ':' + name + ' — ' + (e as Error).message); }
      await pushFull('earth-' + kingdom, name, url);
      cells.push({ name, url });
      if (i % 25 === 0) { say(`Earth ${kingdom}: ${i}/${pool.length} (ok ${ok}/${total})`); await new Promise((r) => setTimeout(r, 0)); }
    }
    sheets.push({ key: 'earth-' + kingdom, cells });
  }
  /* the procedural spread: every kingdom × heats × a seed fan */
  const proc: SheetSpec['cells'] = [];
  for (const [ki, kingdom] of kingdoms.entries()) {
    for (let heat = 0; heat <= 2; heat++) {
      for (let s = 0; s < 20; s++) {
        total++;
        const seed = (hashInt(0xF00D, ki * 100 + heat * 25 + s, 7) >>> 0);
        let url: string | null = null;
        try {
          const g = makeGenome(seed, kingdom, heat);
          url = speciesPortrait(g as never);
          if (!url || url.length < 3000) { url = null; throw new Error('thin paint'); }
          ok++;
        } catch (e) { fails.push('proc:' + kingdom + '/h' + heat + '/s' + s + ' — ' + (e as Error).message); }
        await pushFull('procedural', kingdom + '-h' + heat + '-s' + s, url);
        proc.push({ name: kingdom[0]! + heat + '·' + s, url });
      }
      say(`procedural ${kingdom} heat ${heat} (ok ${ok}/${total})`);
      await new Promise((r) => setTimeout(r, 0));
    }
  }
  sheets.push({ key: 'procedural', cells: proc });

  /* ★ THE ART LOCK FINGERPRINT (arc stage 3 wave 4, on Nick's instruction:
     "put a safety net in there so that, as we're iterating, it's not messing
     up what we did before").

     Three global arithmetic passes in this arc turned a good elephant bad and
     made 127 animals the same shape, and NOTHING CAUGHT IT — every gate the
     project had asks a question about one asset in isolation ("did it paint?
     is it a byte-duplicate? does it fit the frame?"), and all of them stay
     green while the whole catalogue quietly drifts. What was missing is a
     record of what each species ALREADY LOOKED LIKE when it was signed off.

     So every portrait gets a 16x16 luminance fingerprint here, and
     tools/artlock.mjs diffs the whole catalogue against a blessed baseline.
     It does not forbid change — it makes change COUNTABLE, so a two-species
     edit that moved four hundred animals cannot be mistaken for a two-species
     edit. The same grid answers the other half: how far apart two species
     actually look, which is the only way to see "they all became the wolf". */
  const FP = 16;
  const fcv = document.createElement('canvas');
  fcv.width = FP; fcv.height = FP;
  const fg = fcv.getContext('2d', { willReadFrequently: true })!;
  const fingerprints: Record<string, string> = {};
  /* ⚠ THE FIRST FINGERPRINT WAS LUMINANCE ONLY, and it reported 571 of 1,014
     Earth species as look-alikes — because a grey silhouette on a dark field
     says almost nothing about a species. Colour is most of what separates a
     robin from a lark. The signature is the full RGB grid, base64'd so the
     lock file stays a megabyte rather than six. */
  const fingerprint = (im: HTMLImageElement): string => {
    fg.clearRect(0, 0, FP, FP);
    fg.drawImage(im, 0, 0, FP, FP);
    const d = fg.getImageData(0, 0, FP, FP).data;
    let bin = '';
    for (let i = 0; i < FP * FP; i++) {
      const a = d[i * 4 + 3]! / 255;
      bin += String.fromCharCode(Math.round(d[i * 4]! * a), Math.round(d[i * 4 + 1]! * a), Math.round(d[i * 4 + 2]! * a));
    }
    return btoa(bin);
  };

  /* ═══ ★ D-ART-120 — THE SILHOUETTE CHANNEL ═══════════════════════════════
     The 16×16 RGB grid above is a BOX FILTER, so it is area-weighted, and that
     makes it blind to thin structures however wrong they are. Measured, not
     assumed: a wave that rebuilt four crocodilians' legs (two crossing in an X
     became four sprawled limbs) and put a large jumping femur on three
     orthopterans moved EXACTLY ZERO assets. A leg is dark, narrow, and covers
     perhaps a percent of its cell — it averages away. Limbs, tails, bills,
     antennae and tusks are most of what an anatomy audit is about, so the
     guard was blind to the bulk of the remaining work.

     The fix is a separate, much finer channel that measures SHAPE rather than
     mass: a 64×64 one-bit coverage mask. At one bit per pixel it is 512 bytes
     — smaller than the RGB grid it accompanies — and a moved leg flips a
     hundred bits where it shifted a colour average by a fraction of a unit.

     ⚠ IT IS DELIBERATELY A SECOND CHANNEL, NOT A REPLACEMENT. The RGB grid's
     thresholds (WATCH 2.5 / HARD 0.6 / CONFUSABLE 1.5) are calibrated against
     Nick's own judgement of 115 real pairs, and 1,236 pair verdicts depend on
     them. Raising its resolution would silently recalibrate all of that. So
     the look-alike ratchets keep reading the grid they were tuned on, and only
     DRIFT gains the new sensitivity. */
  const SIL = 64;
  const scv = document.createElement('canvas');
  scv.width = SIL; scv.height = SIL;
  const sg = scv.getContext('2d', { willReadFrequently: true })!;
  const silhouettes: Record<string, string> = {};
  const silhouette = (im: HTMLImageElement): string => {
    sg.clearRect(0, 0, SIL, SIL);
    sg.drawImage(im, 0, 0, SIL, SIL);
    const d = sg.getImageData(0, 0, SIL, SIL).data;
    /* ⚠ INK IS MEASURED AGAINST THE FRAME'S OWN CORNER, not a fixed brightness.
       The first cut thresholded on r+g+b > 96, and the negative control caught
       it immediately: these portraits sit on a painted VIGNETTE, not on black,
       so a fixed cut marked the whole frame as subject and every mask came out
       identical — the channel reported zero drift for a limb change, which is
       the exact failure it was built to fix. The proportion pass had already
       solved this the right way; this is the same method. */
    const br = d[0]!, bgc = d[1]!, bb = d[2]!;
    let bin = '', byte = 0, n = 0;
    for (let i = 0; i < SIL * SIL; i++) {
      const dr = d[i * 4]! - br, dg = d[i * 4 + 1]! - bgc, db = d[i * 4 + 2]! - bb;
      byte = (byte << 1) | (dr * dr + dg * dg + db * db > 1500 ? 1 : 0);
      if (++n === 8) { bin += String.fromCharCode(byte); byte = 0; n = 0; }
    }
    if (n) bin += String.fromCharCode(byte << (8 - n));
    return btoa(bin);
  };

  /* contact sheets: a grid per set, portraits at 96px */
  const sheetUrls: Record<string, string> = {};
  for (const sh of sheets) {
    const C = 96, cols = Math.ceil(Math.sqrt(sh.cells.length * 1.4));
    const rows = Math.ceil(sh.cells.length / cols);
    const cv = document.createElement('canvas');
    cv.width = cols * C; cv.height = rows * (C + 14);
    const g = cv.getContext('2d')!;
    g.fillStyle = '#070a12'; g.fillRect(0, 0, cv.width, cv.height);
    for (let i = 0; i < sh.cells.length; i++) {
      const cell = sh.cells[i]!;
      const x = (i % cols) * C, y = Math.floor(i / cols) * (C + 14);
      if (cell.url) {
        const im = new Image();
        await new Promise<void>((res) => { im.onload = () => res(); im.onerror = () => res(); im.src = cell.url!; });
        g.drawImage(im, x + 2, y + 2, C - 4, C - 4);
        /* keyed on sheet+name ALONE this dropped 120 of 1,254 assets on the
           floor: two procedural kingdoms whose labels begin with the same
           letter produce the same cell name, so half the procedural set
           silently overwrote the other half and the lock covered neither.
           The index disambiguates. (PROCESS_LAWS round 9: a key collision
           is a green-but-wrong state, and it looks exactly like a pass.) */
        const fpKey = sh.key + '|' + cell.name + (sh.key === 'procedural' ? '#' + i : '');
        fingerprints[fpKey] = fingerprint(im);
        silhouettes[fpKey] = silhouette(im);
      } else { g.fillStyle = '#5a1f1f'; g.fillRect(x + 2, y + 2, C - 4, C - 4); g.fillStyle = '#070a12'; }
      g.fillStyle = '#8fa3c4'; g.font = '8px system-ui'; g.textAlign = 'center';
      g.fillText(cell.name.slice(0, 18), x + C / 2, y + C + 9);
      if (i % 60 === 0) { say(`sheet ${sh.key}: ${i}/${sh.cells.length}`); await new Promise((r) => setTimeout(r, 0)); }
    }
    sheetUrls[sh.key] = cv.toDataURL('image/png');
  }
  (window as unknown as { __CF_FULL__: { done: boolean } }).__CF_FULL__.done = true;
  /* ★ THE DUPLICATE SENTINEL (Nick's Blocker 3, made permanent): two
     DIFFERENTLY-NAMED Earth species must never render identical pixels.
     Hash every Earth portrait; any collision fails the audit by name. */
  const seen = new Map<string, string>();
  const dupes: string[] = [];
  for (const sh of sheets) {
    if (!sh.key.startsWith('earth-')) continue;
    for (const cell of sh.cells) {
      if (!cell.url) continue;
      let h = 0x811C9DC5;
      for (let i = 0; i < cell.url.length; i += 7) h = Math.imul(h ^ cell.url.charCodeAt(i), 0x01000193) >>> 0;
      const key = sh.key + ':' + h.toString(16) + ':' + cell.url.length;
      const prev = seen.get(key);
      if (prev && prev !== cell.name) dupes.push(prev + ' = ' + cell.name);
      else seen.set(key, cell.name);
    }
  }
  say(`DONE — ${ok}/${total} painted, ${fails.length} failures, ${dupes.length} duplicate pairs, ${new Set(CLIPPED).size} clipped`);
  /* ★ THE CLIP SENTINEL (Nick 2026-08-01: "make sure the noses and everything
     fit within the frame … go back and check that on ALL the artwork"). The
     fit pass records any subject whose ink reached the oversized layer's own
     edge — i.e. cut at DRAW time, which no fitting can undo. Must stay empty. */
  const clipped = [...new Set(CLIPPED)];
  (window as unknown as Record<string, unknown>).__CF_AUDIT__ = { done: true, total, ok, fails, dupes, clipped, sheetUrls };
  (window as unknown as Record<string, unknown>).__CF_FINGERPRINTS__ = fingerprints;
  (window as unknown as Record<string, unknown>).__CF_SILHOUETTES__ = silhouettes;
}
void run();
