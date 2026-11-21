// Records fixtures from the unmodified current game.
// Usage: node tools/record-fixtures.mjs --source <path to the current game's v2 folder> --only <name>
// The source path is used only to import modules; it is never written to any output.
import { registerHooks } from 'node:module';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Source modules import some .ts files with .js specifiers: retry a failed .js specifier as .ts.
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (specifier.endsWith('.js')) return nextResolve(specifier.slice(0, -3) + '.ts', context);
      throw error;
    }
  },
});

const RANGE = 8;
const EPOCHS = [0, 1, 2, 3, 6, 12];

// Inputs for the combat recorder. They are written into the fixture beside the outputs, so a test
// rebuilds every genome from the recorded input alone: makeGenome(seed, kingdom, heat) + { xp } + extra.
const KINGDOMS = ['fauna', 'flora', 'fungi', 'microbe'];
const WORLD_FIELDS = ['lava', 'ice', 'gas', 'ocean', 'desert'];
const CODE_NAMES = ['Specimen', 'Moss Walker', '<i>Tag</i> & "quote"', 'Zoë — Ω', '', '   padded   ', 'x'.repeat(60)];
const seedAt = (i, salt) => (Math.imul(i + 1, 2654435761) ^ salt) >>> 0;
function genomeInput(i, salt, kingdom) {
  const extra = {};
  if (i % 10 === 3) Object.assign(extra, { brood: (i * 7) % 260, fed: (i * 11) % 260 });
  if (i % 10 === 7) extra.hurt = ((i % 5) + 1) / 5;
  if (i % 25 === 0) extra._cradle = true;
  if (i % 12 === 5) Object.assign(extra, { _mult: 1 + (i % 6) * 0.14, _wf: WORLD_FIELDS[i % 5] });
  if (i % 17 === 0) extra.size = 6 + (i % 7);
  if (i % 31 === 0) Object.assign(extra, { apex: 12 + (i % 3), lumin: true, wild: 1 });
  if (i % 9 === 4) extra.parents = [seedAt(i, 1), seedAt(i, 2)];
  return { seed: seedAt(i, salt), kingdom, heat: (i % 11) / 10, xp: (i * 97) % 487, extra };
}

const recorders = {
  galaxies: async (source) => {
    // The current game's galaxy sprite seed list has 16 entries; the file reads this free global.
    globalThis.GAL_SPRITES = new Array(16);
    const url = pathToFileURL(join(source, 'packages/domain/worldgen/src/worldgen.verbatim.js')).href;
    const { galaxiesInCell } = await import(url);
    const cells = [];
    for (let cy = -RANGE; cy <= RANGE; cy++) {
      for (let cx = -RANGE; cx <= RANGE; cx++) {
        const galaxies = galaxiesInCell(cx, cy).map(({ seed, x, y, size, sp }) => ({ seed, x, y, size, sp }));
        cells.push({ cx, cy, galaxies });
      }
    }
    return cells;
  },
  rosters: async (source) => {
    const load = (rel) => import(pathToFileURL(join(source, rel)).href);
    const { systemFor } = await load('packages/domain/worldgen/src/index.ts');
    const { climateBand } = await load('packages/domain/surveyphrases/src/index.ts');
    const { mulberry32 } = await load('packages/domain/rand/src/index.ts');
    const { biosphere } = await load('packages/domain/ecology/src/ecology.verbatim.js');
    const { planetSpeciesAtEcologyEpoch } = await load('packages/domain/ecology/src/explicit-epoch.ts');
    const worlds = {
      earth: { planet: 133, star: 424242 },
      kaum: { planet: 1757105165, star: 2737406570 },
      osum: { planet: 51464061, star: 1074947061 },
    };
    const out = {};
    for (const [name, { planet, star }] of Object.entries(worlds)) {
      const sys = systemFor(star);
      const found = sys.planets.find((entry) => entry.P.seed === planet);
      if (!found) throw new Error(`${name}: planet ${planet} not found in system ${star}`);
      const { P, orb } = found;
      const band = climateBand(P, sys, orb);
      const key = biosphere(P, sys, band, mulberry32((P.seed ^ 0x1234567) >>> 0)).key;
      const level = key === 'earth' ? 'complex' : key;
      out[name] = EPOCHS.map((epoch) => JSON.parse(JSON.stringify(planetSpeciesAtEcologyEpoch(P, sys, band, level, epoch))));
    }
    return out;
  },
  // Pure gameplay outputs of the combat package (no drawing): the surface its art cut must not move.
  combat: async (source) => {
    const load = (rel) => import(pathToFileURL(join(source, rel)).href);
    const combat = await load('packages/domain/combatcore/src/index.ts');
    const { makeGenome } = await load('packages/domain/genome/src/index.ts');
    const { systemFor } = await load('packages/domain/worldgen/src/index.ts');
    const { hashInt } = await load('packages/domain/rand/src/index.ts');
    // The current game's own address mint, used here only so the real Titan defender can be reached.
    // Tests never mint: they check the recorded defenders through the package's public functions.
    const { registerCF1WorldAddressAuthority } = await load('packages/domain/worldidentity/src/mint-internal.ts');
    const genomeOf = (input) => Object.assign(makeGenome(input.seed, input.kingdom, input.heat), { xp: input.xp }, structuredClone(input.extra));
    const attempt = (fn) => { try { return fn(); } catch (error) { return { throws: String(error.message) }; } };

    const stats = Array.from({ length: 200 }, (_, i) => {
      const input = genomeInput(i, 0, KINGDOMS[i % 4]);
      const g = genomeOf(input);
      return {
        input,
        battleStats: combat.battleStats(g),
        abilityOf: combat.abilityOf(g),
        abilityTheme: combat.abilityTheme(g),
        levelOf: combat.levelOf(g),
        innateArts: attempt(() => combat.projectCreatureInnateArts(g)),
      };
    });

    const duels = Array.from({ length: 200 }, (_, i) => {
      const a = genomeInput(i, 0xa, KINGDOMS[i % 4]);
      const mirror = i % 20 === 0;
      const b = mirror ? structuredClone(a) : genomeInput(i + 1, 0xb, KINGDOMS[(i >> 2) % 4]);
      if (!mirror && i % 3 === 0) b.extra._mult = 1 + (i % 6) * 0.14;
      if (!mirror && i % 5 === 0) b.extra._wf = WORLD_FIELDS[(i / 5) % 5];
      const withStats = i % 2 === 0;
      const ga = genomeOf(a);
      const gb = genomeOf(b);
      const r = combat.runDuel(
        { name: 'A', genome: ga, ...(withStats ? { stats: combat.battleStats(ga) } : {}) },
        { name: 'B', genome: gb, ...(withStats ? { stats: combat.battleStats(gb) } : {}) },
      );
      return { a, b, withStats, result: { winner: r.winner, hpA: r.hpA, hpB: r.hpB, maxA: r.maxA, maxB: r.maxB, turnA0: r.turnA0, log: r.log } };
    });

    const codes = Array.from({ length: 100 }, (_, i) => {
      const input = genomeInput(i, 0xc, KINGDOMS[i % 4]);
      if (i % 7 === 0) Object.assign(input.extra, { _mult: 1.3, _wf: 'ice', hurt: 0.4, brood: 250 });
      const name = CODE_NAMES[i % CODE_NAMES.length];
      const champ = i % 2 === 1;
      const g = genomeOf(input);
      const code = combat.encodeCreature({ name, genome: g }, champ);
      return { input, name, champ, code, decoded: combat.decodeCreature(code), normalized: combat.normGenome(g) };
    });
    const badCodes = ['', 'nonsense', 'CFB-', 'CFB-e30', 'CFB-eyJnIjp7fX0', 'CFB-' + 'A'.repeat(8200)]
      .map((code) => ({ code, decoded: combat.decodeCreature(code) }));

    const guardians = {};
    for (const [name, { planet, star }] of Object.entries({
      kaum: { planet: 1757105165, star: 2737406570 },
      osum: { planet: 51464061, star: 1074947061 },
    })) {
      const found = systemFor(star).planets.find((entry) => entry.P.seed === planet);
      if (!found) throw new Error(`${name}: planet ${planet} not found in system ${star}`);
      const worldType = found.P.type;
      const ordinary = combat.projectOrdinaryGuardianV1(planet);
      const regions = [0, 1, 2, 3, 4, 5];
      guardians[name] = {
        planetSeed: planet,
        worldType,
        ordinary,
        titanPlacement: regions.map((regionIndex) => combat.projectTitanPlacementFactsV1({ planetSeed: planet, worldType, regionIndex, claimedSignatureIds: [] })),
        // battleStats of the Guardian's genome at each region's multiplier (1 + region * 0.14 above region 0).
        regionBattleStats: regions.map((r) => combat.battleStats(r > 0 ? { ...ordinary.genome, _mult: 1 + r * 0.14 } : { ...ordinary.genome })),
      };
    }

    // Titan defenders. `mirrored` builds the battle genome exactly as guardian-prime.ts titanDefender does,
    // for every signature and region on Kaum and Osum (neither world has a Titan of its own). `real` holds
    // SOURCE's own titanDefender output, reached through projectGuardianPrimeEncounterV1 on the first
    // planet seed where each signature is selected; every real row is checked against the mirror.
    const titanBuild = (planetSeed, definition, regionIndex) => {
      const id = definition.id;
      const heat = id === 'flame' ? 2 : (id === 'mind' || id === 'void') ? 0 : 1;
      const g = makeGenome(hashInt(planetSeed >>> 0, 0x7174, 0x99) >>> 0, 'fauna', heat);
      Object.assign(g, { size: 5, lumin: true, wild: 1, apex: 14, _titan: id, color: definition.titanColorIndex });
      if (definition.battlefieldWorldField !== null) g._wf = definition.battlefieldWorldField;
      g._mult = 1.15 + regionIndex * 0.03;
      const battleGenome = JSON.parse(JSON.stringify(g));
      const capturableGenome = JSON.parse(JSON.stringify(g));
      delete capturableGenome._mult;
      delete capturableGenome._wf;
      return { battleGenome, capturableGenome, power: combat.battleStats(battleGenome).total };
    };
    const regionsAll = [0, 1, 2, 3, 4, 5];
    const mirrored = [];
    for (const planetSeed of [1757105165, 51464061]) {
      for (const definition of combat.PRIME_SIGNATURES_V1) {
        for (const regionIndex of regionsAll) mirrored.push({ planetSeed, signatureId: definition.id, regionIndex, ...titanBuild(planetSeed, definition, regionIndex) });
      }
    }
    const real = [];
    for (const definition of combat.PRIME_SIGNATURES_V1) {
      const worldType = definition.eligibleWorldTypes[0] ?? 'rocky';
      let planetSeed = 1;
      const selectedAt = (seed) => combat.projectTitanPlacementFactsV1({ planetSeed: seed, worldType, regionIndex: 5, claimedSignatureIds: [] })
        .find((fact) => fact.signatureId === definition.id).selected;
      while (!selectedAt(planetSeed)) planetSeed++;
      const freeze = (o) => Object.freeze(o);
      const world = registerCF1WorldAddressAuthority(freeze({
        format: 'CF1', key: `CF1:recorded:${planetSeed}`,
        galaxy: freeze({ seed: 0, x: 0, y: 0 }), star: freeze({ seed: 0, x: 0, y: 0 }), planet: freeze({ seed: planetSeed, ordinal: 0 }),
      }));
      for (const regionIndex of regionsAll.filter((r) => r >= definition.minimumRegionIndex)) {
        const encounter = combat.projectGuardianPrimeEncounterV1({
          world, descriptor: { worldType }, regionIndex, faunaRoster: [], claimedSignatureIds: [], conquered: false,
        });
        if (encounter?.defender.kind !== 'titan' || encounter.defender.signatureId !== definition.id) {
          throw new Error(`titan ${definition.id} not selected at planet ${planetSeed} region ${regionIndex}`);
        }
        const defender = JSON.parse(JSON.stringify(encounter.defender));
        const { battleGenome, capturableGenome, power } = titanBuild(planetSeed, definition, regionIndex);
        if (JSON.stringify([battleGenome, capturableGenome, power]) !== JSON.stringify([defender.battleGenome, defender.capturableGenome, defender.power])) {
          throw new Error(`titan ${definition.id}: the mirrored build differs from the real defender`);
        }
        real.push({ planetSeed, worldType, regionIndex, signatureId: definition.id, defender });
      }
    }

    const levelEdges = [{ xp: 487 }, { xp: 600 }, { xp: 4200 }, { xp: -5 }, { nan: true }, { xp: '54' }, {}, { xp: 5.9 }, { xp: null }, { xp: 'abc' }]
      .map((input) => ({ input, level: combat.levelOf(input.nan ? { xp: NaN } : 'xp' in input ? { xp: input.xp } : {}) }));

    return {
      constants: { STAT_NAMES: combat.STAT_NAMES, STAT_HUES: combat.STAT_HUES, ABILITY_THEMES: combat.ABILITY_THEMES, PLAYER_SEED: combat.PLAYER_SEED },
      levels: Array.from({ length: 487 }, (_, xp) => combat.levelOf({ xp })),
      levelEdges,
      stats,
      duels,
      codes,
      badCodes,
      guardians,
      titans: { mirrored, real },
    };
  },
  // hdGenesFor on genomes carrying an Earth name or an Earth breed blend: the branches that call the
  // art lookup `_earthArt`. That name is a free global the file reads and nothing in the current game
  // defines, so the recorder supplies NO value: each call throws and the file's own try/catch swallows it.
  strays: async (source) => {
    if ('_earthArt' in globalThis) throw new Error('strays: _earthArt must not be defined while recording');
    const load = (rel) => import(pathToFileURL(join(source, rel)).href);
    const { hdGenesFor } = await load('packages/domain/strays/src/index.ts');
    const { makeGenome } = await load('packages/domain/genome/src/index.ts');
    const { systemFor } = await load('packages/domain/worldgen/src/index.ts');
    const { climateBand } = await load('packages/domain/surveyphrases/src/index.ts');
    const { planetSpeciesAtEcologyEpoch } = await load('packages/domain/ecology/src/explicit-epoch.ts');
    const { _earthNamePass, _EARTH_NAMES } = await load('packages/domain/descriptors/src/apphooks.ts');
    // Each genome is cloned through JSON before the call, so the recorded genome is exactly the input.
    const row = (genome) => {
      const input = JSON.parse(JSON.stringify(genome));
      return { genome: input, hdGenes: hdGenesFor(structuredClone(input)) };
    };

    // Earth's roster at epoch 0, named as planetDescriptor names it (descriptors.verbatim.js:85-86, 100).
    const sys = systemFor(424242);
    const found = sys.planets.find((entry) => entry.P.seed === 133);
    if (!found) throw new Error('earth: planet 133 not found in system 424242');
    const band = climateBand(found.P, sys, found.orb);
    const roster = JSON.parse(JSON.stringify(planetSpeciesAtEcologyEpoch(found.P, sys, band, 'complex', 0)));
    _earthNamePass(roster);
    for (const g of roster) g._cradle = 1;
    const earthRoster = roster.map(row);

    // Earth names and breed blends over procedural genomes of every kingdom.
    const nameAt = (kingdom, i) => _EARTH_NAMES[kingdom][(i * 37) % _EARTH_NAMES[kingdom].length];
    const genomeAt = (i, salt) => makeGenome(seedAt(i, salt), KINGDOMS[i % 4], (i % 11) / 10);
    const earthNamed = Array.from({ length: 40 }, (_, i) => row(Object.assign(genomeAt(i, 0xe1), { _earthName: nameAt(KINGDOMS[i % 4], i) })));
    const blends = Array.from({ length: 40 }, (_, i) => {
      const extra = { _earthBlend: nameAt(KINGDOMS[(i + 1) % 4], i), gen: 1 + (i % 6) };
      if (i % 2 === 0) extra._anchorVal = (i % 10) / 10;
      if (i % 8 === 4) extra._earthBlendKingdom = KINGDOMS[(i + 1) % 4];
      return row(Object.assign(genomeAt(i, 0xb1), extra));
    });
    const [wolf, cat] = [nameAt('fauna', 0), nameAt('fauna', 1)];
    const edges = [
      { _earthName: wolf, _earthBlend: cat },
      { _earthName: '', _earthBlend: cat, _anchorVal: 0 },
      { _earthBlend: cat, gen: 0 },
      { _earthBlend: cat, _anchorVal: null },
      { _earthName: wolf, lumin: true, apex: 13, size: 9 },
      { _earthBlend: wolf, lumin: true, par: 8, accent: 3 },
    ].map((extra, i) => row(Object.assign(genomeAt(i, 0xed), extra)));

    return {
      freeGlobals: { _earthArt: 'not supplied: undefined, as in every running context of the current game' },
      earthRoster,
      earthNamed,
      blends,
      edges,
    };
  },
  // Survey cards (descriptors) with the hooks installed the way the current game installs them: the app
  // calls installCaptureHooks() at boot and publishes globalThis.COSMIC_EPOCH. Each case is an input of
  // plain numbers; the cases run in the recorded order, because the generators memoise and the
  // planet-thumb hook caches a gas giant's palette onto the shared planet object.
  descriptors: async (source) => {
    const NAMES = ['_cardFactsSet', '_earthNamePass', 'GAL_KIND', 'planetThumb', 'starThumb', 'galaxyThumb',
      'moonThumb', 'cometThumb', 'beltThumb', 'GAL_SPRITES', 'COSMIC_EPOCH', 'st', 'customNames'];
    for (const name of NAMES) if (name in globalThis) throw new Error(`descriptors: ${name} must not be defined before recording`);
    const load = (rel) => import(pathToFileURL(join(source, rel)).href);
    const d = await load('packages/domain/descriptors/src/index.ts');
    const { systemFor, galaxiesInCell } = await load('packages/domain/worldgen/src/index.ts');
    d.installCaptureHooks();

    const SOL = 424242;
    const KAUM = { star: 2737406570, planet: 1757105165 };
    const OSUM = { star: 1074947061, planet: 51464061 };
    const planetOf = (star, planet) => {
      const pl = systemFor(star).planets.find((entry) => entry.P.seed === planet);
      if (!pl) throw new Error(`planet ${planet} not found in system ${star}`);
      return pl;
    };
    const cases = [];
    // The three contract seeds: the home galaxy (999, alone in cell 0,-1), Sol (424242) and Earth (133).
    cases.push({ kind: 'galaxy', cx: 0, cy: -1, index: 0 }, { kind: 'star', seed: SOL });
    for (const epoch of [0, 12]) for (const pl of systemFor(SOL).planets) cases.push({ kind: 'planet', star: SOL, planet: pl.P.seed, epoch });
    for (const epoch of [1, 2, 3, 6, 10000]) cases.push({ kind: 'planet', star: SOL, planet: 133, epoch });
    cases.push({ kind: 'moon', star: SOL, planet: 133, moon: 0 }, { kind: 'belt', star: SOL });
    // Kaum and Osum.
    for (const { star, planet } of [KAUM, OSUM]) {
      cases.push({ kind: 'star', seed: star });
      for (const epoch of [0, 12]) cases.push({ kind: 'planet', star, planet, epoch });
      cases.push({ kind: 'moon', star, planet, moon: 0 }, { kind: 'moon', star, planet, moon: 1 }, { kind: 'belt', star });
    }
    // Every galaxy in cells -8..8: the kind label comes from GAL_KIND.
    for (let cy = -RANGE; cy <= RANGE; cy++) {
      for (let cx = -RANGE; cx <= RANGE; cx++) {
        galaxiesInCell(cx, cy).forEach((_, index) => { if (!(cx === 0 && cy === -1)) cases.push({ kind: 'galaxy', cx, cy, index }); });
      }
    }
    // Sol's system after its planets were described: the gas giants carry the palette the hook cached.
    cases.push({ kind: 'system', star: SOL });

    const run = (input) => {
      switch (input.kind) {
        case 'galaxy': {
          const g = galaxiesInCell(input.cx, input.cy)[input.index];
          return { stats: d.galaxyStats(g), card: d.galaxyDescriptor(g) };
        }
        case 'star': return d.starDescriptor(input.seed);
        case 'planet': {
          const sys = systemFor(input.star);
          const pl = planetOf(input.star, input.planet);
          globalThis.COSMIC_EPOCH = input.epoch;
          try { return d.planetDescriptor(pl.P, sys, pl); } finally { delete globalThis.COSMIC_EPOCH; }
        }
        case 'moon': return d.moonDescriptor(planetOf(input.star, input.planet), input.moon);
        case 'belt': return d.beltDescriptor(systemFor(input.star), input.star);
        case 'system': return systemFor(input.star);
        default: throw new Error(`unknown case ${input.kind}`);
      }
    };
    const rows = cases.map((input) => ({ input, output: JSON.parse(JSON.stringify(run(structuredClone(input)))) }));
    for (const name of ['COSMIC_EPOCH', 'st', 'customNames']) if (name in globalThis) throw new Error(`descriptors: ${name} was left defined`);

    return {
      freeGlobals: {
        _cardFactsSet: 'installCaptureHooks(): the card-facts side cache of apphooks.verbatim.js',
        _earthNamePass: 'installCaptureHooks(): the deduped Earth name pass of apphooks.ts',
        GAL_KIND: 'installCaptureHooks(): the 16 sprite kinds of apphooks.verbatim.js',
        planetThumb: 'installCaptureHooks(): returns "data:image/png;base64,"; for a gas planet it first caches its palette on the planet',
        starThumb: 'installCaptureHooks(): returns "data:image/png;base64,"',
        galaxyThumb: 'installCaptureHooks(): returns "data:image/png;base64,"',
        moonThumb: 'installCaptureHooks(): returns "data:image/png;base64,"',
        cometThumb: 'installCaptureHooks(): returns "data:image/png;base64," (no case calls it)',
        beltThumb: 'installCaptureHooks(): returns "data:image/png;base64,"',
        GAL_SPRITES: 'installCaptureHooks(): an array of length 16, read by the current game\'s worldgen',
        COSMIC_EPOCH: 'set to the case\'s epoch around each planet case, as the app sets it; deleted after',
        st: 'not supplied: undefined, as in the app (the guarded read gives region boost 0)',
        customNames: 'not supplied: read only by the verbatim describePick, which no case calls',
      },
      cases: rows,
    };
  },
  // Survey cards through describePickWithState, the card router the app calls, with the hooks installed
  // the way the game installs them. Sections in order: the pick kinds nothing else pins (quasar, radio,
  // comet, deco, dwarf, snova, protostar), one pick of every other kind (routing), the custom-name
  // lookup, and the null-card branches. Each input is a pick, a navigation state, optionally a table of
  // custom names and, for planet picks, the epoch set as COSMIC_EPOCH around the call, as the app sets
  // it. Inputs are built from the current game's own generators, cloned through JSON, then recorded
  // beside the card and the keys the router looked up.
  'descriptors-misc': async (source) => {
    const NAMES = ['_cardFactsSet', '_earthNamePass', 'GAL_KIND', 'planetThumb', 'starThumb', 'galaxyThumb',
      'moonThumb', 'cometThumb', 'beltThumb', 'GAL_SPRITES', 'COSMIC_EPOCH', 'st', 'customNames'];
    for (const name of NAMES) if (name in globalThis) throw new Error(`descriptors-misc: ${name} must not be defined before recording`);
    const load = (rel) => import(pathToFileURL(join(source, rel)).href);
    const d = await load('packages/domain/descriptors/src/index.ts');
    const w = await load('packages/domain/worldgen/src/index.ts');
    const { GCELL, GR, HOME_GAL_SEED } = await load('packages/domain/worldconfig/src/index.ts');
    d.installCaptureHooks();
    const plain = (value) => JSON.parse(JSON.stringify(value));
    const take = (list, n) => list.slice(0, n);

    const home = plain(w.galaxiesInCell(0, -1).find((g) => g.seed === HOME_GAL_SEED));
    const merging = plain(w.galaxiesInCell(-6, 4)[0]);

    // Quasars (with and without a blazar jet) and radio galaxies, scanning cells in a fixed order.
    const blazars = [], quasars = [], radios = [];
    for (let cy = -30; cy <= 30; cy++) {
      for (let cx = -30; cx <= 30; cx++) {
        for (const g of w.galaxiesInCell(cx, cy)) {
          if (g.quasar) (g.blazar ? blazars : quasars).push(plain(g));
          if (g.radio) radios.push(plain(g));
        }
      }
    }

    // The home galaxy's stars and deep-sky objects, disk and halo, every kind of deco.
    const prof = w.galaxyProfile(HOME_GAL_SEED);
    const reach = Math.ceil((GR * 1.7) / GCELL);
    const decoByKind = new Map();
    const stars = [];
    let solStar = null;
    for (let cy = -reach; cy <= reach; cy++) {
      for (let cx = -reach; cx <= reach; cx++) {
        const cell = w.starsInCell(HOME_GAL_SEED, prof, cx, cy);
        for (const dc of cell.deco) {
          const list = decoByKind.get(dc.k) ?? [];
          if (list.length < 2) list.push(plain(dc));
          decoByKind.set(dc.k, list);
        }
        for (const s of cell.stars) {
          if (s.sol) solStar = { x: s.x, y: s.y, seed: s.seed };
          else if (stars.length < 400) stars.push(plain(s));
        }
      }
    }
    const DECO_KINDS = ['h2', 'neb', 'mol', 'open', 'plan', 'rem', 'rogue', 'fbd', 'glob'];
    for (const k of DECO_KINDS) if (!decoByKind.has(k)) throw new Error(`descriptors-misc: no ${k} deco found`);
    if (!solStar || solStar.seed !== 424242) throw new Error('descriptors-misc: Sol not found in the home galaxy');
    const starRef = (s) => ({ x: s.x, y: s.y, seed: s.seed });

    // Star systems with comets and dwarf planets: Sol, then the first home-galaxy stars that have them.
    const withComets = stars.filter((s) => w.systemFor(s.seed).comets);
    const withDwarfs = stars.filter((s) => w.systemFor(s.seed).dwarfs);
    const twoComets = withComets.find((s) => w.systemFor(s.seed).comets.length === 2);
    const twoDwarfs = withDwarfs.find((s) => w.systemFor(s.seed).dwarfs.length === 2);
    if (!twoComets || !twoDwarfs) throw new Error('descriptors-misc: no system with two comets or two dwarfs');
    const cometStars = [solStar, ...take(withComets.filter((s) => s !== twoComets), 3).map(starRef), starRef(twoComets)];
    const dwarfStars = [solStar, ...take(withDwarfs.filter((s) => s !== twoDwarfs), 3).map(starRef), starRef(twoDwarfs)];

    // Supernova sites and their newborn protostars, for two galaxies at three epochs.
    const sites = [];
    for (const g of [home, merging]) for (const epoch of [0, 1, 12]) sites.push(...plain(w.supernovaSites(g.seed, epoch)).map((site) => ({ g, site })));
    for (const remnant of ['NS', 'shell', 'BH']) if (!sites.some(({ site }) => site.remnant === remnant)) throw new Error(`descriptors-misc: no ${remnant} site`);
    const births = sites.flatMap(({ g, site }) => site.births.map((b) => ({ g, b })));

    const galaxyNav = (g) => ({ gal: g, star: null });
    const starNav = (g, star) => ({ gal: g, star });
    // A quasar pick with no galaxy (no thumb, logId 'q', no name key) closes the quasar section, without
    // and with a custom-name table, after the rows recorded before it.
    const sections = {
      quasar: [
        ...[...take(blazars, 3), ...take(quasars, 3)].map((g) => ({ pick: { kind: 'quasar', data: g }, nav: galaxyNav(null) })),
        { pick: { kind: 'quasar', data: null }, nav: galaxyNav(null) },
        { pick: { kind: 'quasar', data: null }, nav: galaxyNav(home), names: { [`g${HOME_GAL_SEED}`]: 'Unused' } },
      ],
      radio: take(radios, 5).map((g) => ({ pick: { kind: 'radio', data: g }, nav: galaxyNav(null) })),
      comet: cometStars.flatMap((star) => w.systemFor(star.seed).comets.map((cm, ci) => ({ pick: { kind: 'comet', data: { ci, cm } }, nav: starNav(home, star) }))),
      deco: DECO_KINDS.flatMap((k) => decoByKind.get(k)).map((dc, i) => ({ pick: { kind: 'deco', data: dc }, nav: i % 2 ? galaxyNav(home) : starNav(home, starRef(stars[i])) })),
      dwarf: dwarfStars.flatMap((star) => w.systemFor(star.seed).dwarfs.map((dw) => ({ pick: { kind: 'dwarf', data: { dw } }, nav: starNav(home, star) }))),
      snova: sites.map(({ g, site }) => ({ pick: { kind: 'snova', data: site }, nav: galaxyNav(g) })),
      protostar: take(births, 10).map(({ g, b }) => ({ pick: { kind: 'protostar', data: b }, nav: galaxyNav(g) })),
    };

    // One pick of every other kind, through the router, so its `where` and `_nameKey` are pinned too.
    const sol = plain(w.systemFor(424242));
    const earth = sol.planets.find((pl) => pl.P.seed === 133);
    const mars = sol.planets.find((pl) => pl.P.seed === 134);
    const planetPick = (pl) => ({ kind: 'planet', data: { P: pl.P, sys: sol, pl } });
    const star0 = stars[0];
    const solNav = starNav(home, solStar);
    sections.routing = [
      { pick: { kind: 'galaxy', data: merging }, nav: galaxyNav(null) },
      { pick: { kind: 'galaxy', data: home }, nav: galaxyNav(home) },
      { pick: { kind: 'star', data: star0 }, nav: galaxyNav(home) },
      { pick: { kind: 'starsys', data: { seed: 424242 } }, nav: solNav },
      ...[0, 12].map((epoch) => ({ pick: planetPick(earth), nav: solNav, epoch })),
      { pick: planetPick(mars), nav: solNav, epoch: 0 },
      { pick: { kind: 'moon', data: { pl: earth, m: 0 } }, nav: solNav },
      { pick: { kind: 'belt', data: { sys: sol } }, nav: solNav },
      { pick: { kind: 'belt', data: { sys: plain(w.systemFor(star0.seed)) } }, nav: starNav(home, starRef(star0)) },
      { pick: { kind: 'worm', data: { x: 1, y: 2 } }, nav: galaxyNav(home) },
      { pick: { kind: 'kuiper', data: { sys: sol } }, nav: solNav },
      { pick: { kind: 'oort', data: {} }, nav: starNav(home, starRef(star0)) },
      { pick: { kind: 'visitor', data: {} }, nav: starNav(merging, starRef(star0)) },
      { pick: { kind: 'cmb', data: {} }, nav: galaxyNav(null) },
    ];

    // The custom-name lookup: a hit renames the card; null, a missing key, or no key at all do not.
    const dwarf0 = w.systemFor(424242).dwarfs[0];
    sections.customNames = [
      { pick: { kind: 'galaxy', data: merging }, nav: galaxyNav(null), names: { [`g${merging.seed}`]: 'Bright Harbour' } },
      { pick: { kind: 'star', data: star0 }, nav: galaxyNav(home), names: { [`s${star0.seed}`]: 'Lantern' } },
      { pick: { kind: 'planet', data: { P: earth.P, sys: sol, pl: earth } }, nav: solNav, names: { p133: 'Home' }, epoch: 0 },
      { pick: { kind: 'moon', data: { pl: earth, m: 0 } }, nav: solNav, names: { p133: 'Home' } },
      { pick: { kind: 'dwarf', data: { dw: plain(dwarf0) } }, nav: solNav, names: { s424242: '' } },
      { pick: { kind: 'deco', data: decoByKind.get('h2')[0] }, nav: galaxyNav(home), names: { [`g${HOME_GAL_SEED}`]: null } },
      { pick: { kind: 'deco', data: decoByKind.get('neb')[0] }, nav: galaxyNav(null), names: { [`g${HOME_GAL_SEED}`]: 'Unused' } },
      { pick: { kind: 'protostar', data: births[0].b }, nav: galaxyNav(home), names: { [`g${HOME_GAL_SEED}`]: 'Cradle' } },
      { pick: { kind: 'cmb', data: {} }, nav: galaxyNav(null), names: { [`g${HOME_GAL_SEED}`]: 'Everything' } },
      { pick: { kind: 'worm', data: {} }, nav: galaxyNav(home), names: { [`g${HOME_GAL_SEED}`]: 'Unused' } },
    ];

    // The null cards: a star-bound pick with no current star, a planet or moon pick without its planet,
    // a bad star, an unknown deco, an unknown kind. These use a small system (planets, no rock rings).
    const smallStar = stars.find((s) => { const sys = w.systemFor(s.seed); return sys.planets.length && !sys.belt && !sys.kuiper; });
    const small = plain(w.systemFor(smallStar.seed));
    const smallPlanet = { P: small.planets[0].P, sys: small, pl: small.planets[0] };
    sections.nullCards = [
      ...['starsys', 'comet', 'belt', 'dwarf', 'kuiper', 'oort', 'visitor'].map((kind) => ({
        pick: { kind, data: { seed: smallStar.seed, ci: 0, cm: sol.comets[0], sys: small, dw: plain(dwarf0) } }, nav: galaxyNav(home),
      })),
      { pick: { kind: 'planet', data: smallPlanet }, nav: galaxyNav(home), epoch: 0 },
      { pick: { kind: 'moon', data: { pl: small.planets[0], m: 0 } }, nav: { gal: home, star: { x: 1, y: 2, seed: 4.5 } } },
      { pick: { kind: 'oort', data: {} }, nav: { gal: home, star: { x: null, y: 2, seed: 7 } } },
      { pick: { kind: 'planet', data: { sys: small, pl: small.planets[0] } }, nav: starNav(home, starRef(smallStar)), epoch: 0 },
      { pick: { kind: 'moon', data: { pl: { orb: 1 }, m: 0 } }, nav: solNav },
      { pick: { kind: 'star', data: { x: 1, y: 2, seed: 1.5 } }, nav: galaxyNav(home) },
      { pick: { kind: 'deco', data: { k: 'nothing', x: 1, y: 2 } }, nav: galaxyNav(home) },
      { pick: { kind: 'nothing', data: {} }, nav: solNav },
    ];

    const run = (input) => {
      const lookups = [];
      const lookup = (key) => { lookups.push(key); return input.names ? input.names[key] : undefined; };
      if (input.epoch !== undefined) globalThis.COSMIC_EPOCH = input.epoch;
      try {
        return { output: plain(d.describePickWithState(input.pick, input.nav, lookup) ?? null), lookups };
      } finally {
        delete globalThis.COSMIC_EPOCH;
      }
    };
    const out = {};
    for (const [name, inputs] of Object.entries(sections)) {
      out[name] = inputs.map((raw) => {
        const input = plain(raw);
        return { input, ...run(structuredClone(input)) };
      });
    }
    for (const name of ['COSMIC_EPOCH', 'st', 'customNames']) if (name in globalThis) throw new Error(`descriptors-misc: ${name} was left defined`);

    return {
      freeGlobals: {
        installCaptureHooks: 'called once before the first case: _cardFactsSet, _earthNamePass, GAL_KIND, the six thumb hooks (each returns "data:image/png;base64,") and GAL_SPRITES',
        COSMIC_EPOCH: 'set to the case\'s epoch around each case that has one (planet picks), as the app sets it; deleted after',
        st: 'not supplied: undefined, as in the app (the guarded read gives region boost 0)',
        customNames: 'not supplied: the router takes a lookup instead, which returns names[key] from the case (undefined when the case has no names)',
      },
      sections: out,
    };
  },
  // Taming (Tame / Scavenge / Sample capture) and breeding outcomes of the acquisition package. Every
  // random value comes from an injected SessionRNG state (seed, per-domain counters, ordinal) planned with
  // the current game's own planner, and every clock value is an injected active-play time in ms. Each
  // case records its full input beside its output, so a test rebuilds the case from the input alone.
  acquisition: async (source) => {
    const NAMES = ['_cardFactsSet', '_earthNamePass', 'GAL_KIND', 'planetThumb', 'starThumb', 'galaxyThumb',
      'moonThumb', 'cometThumb', 'beltThumb', 'GAL_SPRITES', 'COSMIC_EPOCH', 'st', 'customNames'];
    for (const name of NAMES) if (name in globalThis) throw new Error(`acquisition: ${name} must not be defined before recording`);
    const load = (rel) => import(pathToFileURL(join(source, rel)).href);
    const acq = await load('packages/domain/acquisition/src/index.ts');
    const model = await load('packages/domain/acquisition/src/model.ts');
    const v2 = await load('packages/domain/acquisition/src/model-v2.ts');
    const breed = await load('packages/domain/acquisition/src/breed.ts');
    const availability = await load('packages/domain/acquisition/src/companion-availability.ts');
    const { registerAcquisitionSnapshotV1, registerCaptureDrawBundleV1 } = await load('packages/domain/acquisition/src/snapshot-internal.ts');
    const loot = await load('packages/domain/loot/src/index.ts');
    const { registerArc2EngineeringLoadout } = await load('packages/domain/loot/src/engineering-loadout-internal.ts');
    const { createSessionRNG, planSessionRNGDraws, DOMAINS } = await load('packages/domain/sessionrng/src/index.ts');
    const { resolveCF1WorldAddress } = await load('packages/scene/src/index.ts');
    const { installCaptureHooks } = await load('packages/domain/descriptors/src/index.ts');
    const { systemFor } = await load('packages/domain/worldgen/src/index.ts');
    const { climateBand } = await load('packages/domain/surveyphrases/src/index.ts');
    const { mulberry32 } = await load('packages/domain/rand/src/index.ts');
    const { biosphere } = await load('packages/domain/ecology/src/ecology.verbatim.js');
    const { planetSpeciesAtEcologyEpoch } = await load('packages/domain/ecology/src/explicit-epoch.ts');
    // The address resolver walks the current game's worldgen, which reads GAL_SPRITES: install the hooks
    // the way the game and the current game's acquisition tests do.
    installCaptureHooks();
    const plain = (value) => JSON.parse(JSON.stringify(value));

    // Every roster row of a world at an epoch, generated as the rosters recorder generates it.
    const rosterOf = (star, planet, epoch) => {
      const sys = systemFor(star);
      const found = sys.planets.find((entry) => entry.P.seed === planet);
      if (!found) throw new Error(`acquisition: planet ${planet} not found in system ${star}`);
      const band = climateBand(found.P, sys, found.orb);
      const key = biosphere(found.P, sys, band, mulberry32((found.P.seed ^ 0x1234567) >>> 0)).key;
      return { biosphereKey: key, rows: plain(planetSpeciesAtEcologyEpoch(found.P, sys, band, key === 'earth' ? 'complex' : key, epoch)) };
    };

    // Taming odds: the whole chance table and the hit rule.
    const VERBS = ['tame', 'scavenge', 'sample'];
    const CONTACTS = [0, 1, 7, 16, 17, 37, 1000];
    const chance = VERBS.flatMap((verb) => CONTACTS.map((contactCapturePoints) => ({
      verb,
      contactCapturePoints,
      byTierThenRing: Array.from({ length: 15 }, (_, tier) => Array.from({ length: 6 }, (_, ring) => acq.captureChanceV1({ verb, tier, ring, contactCapturePoints }))),
    })));
    const hitEdges = [[0, 0.02], [0.0199999, 0.02], [0.02, 0.02], [0.5, 0.95], [0.9499999, 0.95], [0.95, 0.95], [0.999999, 1]]
      .map(([successDraw, ch]) => ({ successDraw, chance: ch, hit: acq.captureHitV1(successDraw, ch) }));

    // Capture end to end on worlds whose canonical addresses the current game's acquisition tests use:
    // Earth (home ring), a ring-3, a ring-4 and a deep living world; then Kaum and Osum, two home-galaxy
    // worlds whose star positions come from the current game's galaxyScene(999).stars.
    const WORLDS = {
      earth: { galaxy: { seed: 999, x: 90, y: -60 }, star: { seed: 424242, x: 560, y: 170 }, planetSeed: 133 },
      ring3: { galaxy: { seed: 2168115821, x: -1104.3939002789557, y: -1400.6738864816725 }, star: { seed: 2404948836, x: 79.28673347271979, y: 172.30901278089732 }, planetSeed: 2525295284 },
      ring4: { galaxy: { seed: 742431365, x: 357.33832279220223, y: 1882.66924303025 }, star: { seed: 134687484, x: 219.1186681254767, y: -157.20003835111856 }, planetSeed: 2525295284 },
      deepLiving: { galaxy: { seed: 1012779741, x: -599.7658047693408, y: -6073.942273357868 }, star: { seed: 3589953231, x: -138.81464905291796, y: -21.96363354055211 }, planetSeed: 3533877330 },
      kaum: { galaxy: { seed: 999, x: 90, y: -60 }, star: { seed: 2737406570, x: 160.5956227169372, y: -89.13221201486886 }, planetSeed: 1757105165 },
      osum: { galaxy: { seed: 999, x: 90, y: -60 }, star: { seed: 1074947061, x: 114.26536275492981, y: 446.9253231128678 }, planetSeed: 51464061 },
    };
    const gearSource = loot.makeGearSourceActionId({ kind: 'legacy-migration', ownerId: 'acquisition-recorder', actionKey: 'items-v1', receiptId: 'migration:v4-v5' });
    const GEAR = {
      none: { itemCounts: [], equipped: {}, equippedAffixes: {}, revision: 1, capacity: 6 },
      contact: { itemCounts: [['earpiece', 1], ['diplobeacon', 1], ['prismpendant', 1]], equipped: { ears: 'earpiece', necklace: 'diplobeacon' }, equippedAffixes: { ears: { k: 'contact', v: 7, forId: 'earpiece' } }, revision: 11, capacity: 6 },
    };
    const capabilitiesOf = (gear) => {
      const migrated = loot.migrateLegacyGear({ sourceActionId: gearSource, itemCounts: gear.itemCounts, equipped: gear.equipped, equippedAffixes: gear.equippedAffixes });
      const inventory = loot.decodeGearInventory(JSON.stringify({
        schema: loot.GEAR_INVENTORY_SCHEMA, revision: gear.revision, capacity: gear.capacity,
        entries: migrated.instances.map((instance) => ({ instance, favorite: false, locked: false })),
        equipped: migrated.equipped, pendingRewards: [],
      }));
      return loot.projectAcquisitionCapabilities(registerArc2EngineeringLoadout(inventory, []));
    };
    const CAPTURE_DOMAINS = [DOMAINS.captureCandidate, DOMAINS.captureSuccess];
    const attemptCapture = (address, roster, gearName, verb, ownership, sessionRng, activePlayMs) => {
      const snapshot = registerAcquisitionSnapshotV1({
        address, worldKey: address.key, ecologyEpoch: 0,
        fullRosterFingerprint: `recorded-roster:${address.key}:0:${roster.rows.length}`,
        biosphereKey: roster.biosphereKey, rosterRows: roster.rows,
        capabilities: capabilitiesOf(GEAR[gearName]), ownership,
        f4Authority: { activePlayMs, sessionRng },
      });
      const snapshotOut = {
        fingerprint: snapshot.fingerprint, captureRing: snapshot.captureRing, biosphereYield: snapshot.biosphereYield,
        cycle: snapshot.cycle, contactCapturePoints: snapshot.contactCapturePoints, candidates: snapshot.candidates.length,
      };
      const preflight = acq.preflightCaptureV1(snapshot, verb);
      if (preflight.kind !== 'ready') return { snapshot: snapshotOut, preflight: plain(preflight), plan: null, next: null };
      const sessionPlan = planSessionRNGDraws(createSessionRNG(sessionRng.seed, { ...sessionRng.draws }, sessionRng.ordinal).state(), CAPTURE_DOMAINS);
      const bundle = registerCaptureDrawBundleV1({
        snapshot,
        plan: {
          draws: sessionPlan.draws.map(({ domain, value }) => ({ domain, value })),
          receiptOrdinal: sessionPlan.receiptOrdinal,
          currentAuthority: { activePlayMs, sessionRng },
          nextSessionRng: sessionPlan.nextState,
          sessionPlan,
        },
      });
      const planned = acq.planCaptureV1(preflight, bundle);
      if (planned.kind !== 'planned') return { snapshot: snapshotOut, preflight: { kind: 'ready' }, plan: plain(planned), next: null };
      const { successor, ...rest } = planned.plan;
      return {
        snapshot: snapshotOut,
        preflight: {
          kind: 'ready', pool: preflight.pool.map((c) => c.sourceOrdinal), used: preflight.used,
          remainingBefore: preflight.remainingBefore, requiredHitHeadroom: preflight.requiredHitHeadroom,
        },
        plan: { ...plain(rest), successorDigest: model.ownershipStateDigestV1(successor) },
        next: { ownership: successor, sessionRng: plain(bundle.nextSessionRng) },
      };
    };
    // The inputs every capture case shares: each world's address and epoch-0 roster, and the gear.
    const worlds = Object.fromEntries(Object.entries(WORLDS).map(([name, w]) => [name, { ...w, ...rosterOf(w.star.seed, w.planetSeed, 0) }]));
    const captures = [];
    const SESSION_SEEDS = [12345, 777, 3735928559];
    const CLOCKS = [0, 1250000];
    for (const [world, w] of Object.entries(WORLDS)) {
      const resolved = resolveCF1WorldAddress({ galaxy: w.galaxy, star: w.star, planet: { seed: w.planetSeed } });
      if (!resolved.ok) throw new Error(`acquisition: ${world} address did not resolve: ${resolved.reason}`);
      const roster = worlds[world];
      for (const gear of Object.keys(GEAR)) {
        for (const verb of VERBS) {
          for (const seed of SESSION_SEEDS) {
            for (const activePlayMs of CLOCKS) {
              const input = { world, gear, verb, activePlayMs, sessionRng: { seed, ordinal: 0, draws: {} } };
              const c = structuredClone(input);
              const out = attemptCapture(resolved.address, roster, c.gear, c.verb, model.createEmptyOwnershipStateV1(), c.sessionRng, c.activePlayMs);
              captures.push({ input, snapshot: out.snapshot, preflight: out.preflight, plan: out.plan });
            }
          }
        }
      }
    }
    // Repeated tames on one world: each attempt starts from the previous successor and next SessionRNG
    // state; the clock crosses the 20-minute cycle once, so spent species and the yield reset.
    const chains = [];
    for (const [world, seed] of [['deepLiving', 12345], ['earth', 777]]) {
      const w = WORLDS[world];
      const address = resolveCF1WorldAddress({ galaxy: w.galaxy, star: w.star, planet: { seed: w.planetSeed } }).address;
      const roster = worlds[world];
      let ownership = model.createEmptyOwnershipStateV1();
      let sessionRng = { seed, ordinal: 0, draws: {} };
      const steps = [];
      for (const [verb, activePlayMs] of [['tame', 0], ['tame', 1000], ['scavenge', 2000], ['tame', 3000], ['sample', 4000], ['tame', 5000], ['tame', 1200000], ['tame', 1201000]]) {
        const out = attemptCapture(address, roster, 'contact', verb, ownership, structuredClone(sessionRng), activePlayMs);
        steps.push({ input: { verb, activePlayMs, sessionRng: plain(sessionRng) }, snapshot: out.snapshot, preflight: out.preflight, plan: out.plan });
        if (out.next) ({ ownership, sessionRng } = out.next);
      }
      chains.push({ world, gear: 'contact', steps });
    }

    // Breeding: every ordered pair of Kaum's fauna (both parent orders), with varied care state, clock,
    // receipt, earned Stardust and first-pair flag. The outcome draw is the injected SessionRNG's
    // care.breed draw, as the game plans it; three fixed draws are settled as well.
    const KAUM = { star: 2737406570, planet: 1757105165 };
    const kaumFauna = rosterOf(KAUM.star, KAUM.planet, 0).rows.filter((g) => g.kingdom === 'fauna');
    const ownershipOf = (parents) => {
      const identities = parents.map((p) => model.canonicalGenomeIdentityV1(p.genome));
      const discoveries = identities.map((identity, index) => model.createLegacyDiscoveryRecordV1({
        recordId: model.ownershipContentId('discovery', `breed-${index}`), speciesId: identity.speciesId,
        legacyCodexId: `breed-${index}`, legacySourceIndex: index, from: 'Legacy', legacyLocation: null, firstForSpecies: true,
      }));
      const ids = parents.map((_, index) => model.ownershipContentId('creature', `breed-${index}`));
      const creatures = parents.map((p, index) => model.createCreatureInstanceV1({
        creatureId: ids[index], speciesId: identities[index].speciesId, genomeIdentity: identities[index].genomeIdentity,
        genome: identities[index].genome, nickname: `Parent ${index}`, origin: 'legacy', acquisitionRecordId: discoveries[index].recordId,
        lineage: { kind: 'none', generation: identities[index].genome.gen }, xp: p.xp, hurt: p.hurt, fed: p.fed, brood: p.brood,
        assignment: p.assignment, bond: null,
      }));
      const source = model.createInitialOwnershipStateV1({
        catalogSpecies: identities.map((identity, index) => model.createCatalogSpeciesV1({ identity, alias: null, firstObservationId: discoveries[index].recordId })),
        discoveries, creatures, specimenLots: [], biosphereProgress: [], legacyBioX: [], scoutCreatureId: ids[0],
      });
      return { state: v2.migrateOwnershipStateV1ToV2(source), ids };
    };
    const scenarioOut = (s) => {
      const { successor, preflight, parentsBefore, parentsAfter, ...rest } = s;
      return { ...plain(rest), parentAssignmentsAfter: plain(parentsAfter.map((p) => p.assignment)), successorDigest: v2.ownershipStateDigestV2(successor) };
    };
    const CARE = [
      { hurt: null, fed: 80, brood: 3 }, { hurt: 0, fed: 30, brood: 4 }, { hurt: 0.1, fed: 0, brood: 0 },
      { hurt: 0.29, fed: 120, brood: 14 }, { hurt: null, fed: null, brood: null },
    ];
    const breedCase = (input) => {
      const c = structuredClone(input);
      const { state, ids } = ownershipOf(c.parents);
      const preflight = breed.preflightArc5BreedV1(state, {
        parentCreatureIds: [ids[0], ids[1]], activePlayMs: c.activePlayMs, earnedStardustBonus: breed.earnedStardustBonusV1(c.earnedStardust),
      });
      const row = { input, preflight: plain(preflight), plan: null, draw: null, settled: null, recovery: null };
      if (preflight.kind !== 'ready') return row;
      const sessionPlan = planSessionRNGDraws(createSessionRNG(c.sessionRng.seed, { ...c.sessionRng.draws }, c.sessionRng.ordinal).state(), [DOMAINS.breedOutcome]);
      const planned = breed.planArc5BreedScenariosV1(preflight.preflight, sessionPlan.receiptOrdinal, c.speciesPairFirst);
      if (planned.kind !== 'planned') return { ...row, plan: plain(planned) };
      const { plan } = planned;
      return {
        ...row,
        plan: { kind: 'planned', receiptOrdinal: plan.receiptOrdinal, success: scenarioOut(plan.success), failure: scenarioOut(plan.failure) },
        draw: { value: sessionPlan.draws[0].value, nextSessionRng: plain(sessionPlan.nextState) },
        settled: [sessionPlan.draws[0].value, ...c.fixedDraws].map((d) => ({ draw: d, result: breed.settleArc5BreedScenariosV1(plan, d).scenario.result })),
        // Recovery: both parents just before and exactly at their ready time, after each outcome.
        recovery: ['success', 'failure'].map((result) => {
          const s = plan[result];
          return { result, at: [s.recoveryReadyAtActivePlayMs - 1, s.recoveryReadyAtActivePlayMs].map((t) => ({
            activePlayMs: t,
            parents: s.parentsAfter.map((p) => plain(availability.projectCompanionAvailabilityV1(p, t))),
          })) };
        }),
      };
    };
    const breeding = [];
    let k = 0;
    for (let a = 0; a < kaumFauna.length; a++) {
      for (let b = 0; b < kaumFauna.length; b++) {
        if (a === b) continue;
        breeding.push(breedCase({
          parents: [
            { genome: kaumFauna[a], xp: (k * 13) % 300, ...CARE[k % CARE.length], assignment: k % 11 === 5 ? { kind: 'recovery', readyAtActivePlayMs: 40000 } : null },
            { genome: kaumFauna[b], xp: (k * 29) % 300, ...CARE[(k + 2) % CARE.length], assignment: null },
          ],
          activePlayMs: [0, 1000, 40000, 50000, 1200000, 86400000][k % 6],
          earnedStardust: [0, 49, 50, 750, 50000][k % 5],
          sessionRng: { seed: (Math.imul(k + 1, 2654435761) ^ 0xb7ed) >>> 0, ordinal: k % 4, draws: k % 3 ? { 'care.breed': k % 7 } : {} },
          speciesPairFirst: k % 4 !== 3,
          fixedDraws: [0, 0.5, 0.999999],
        }));
        k++;
      }
    }
    // One cross, where only the injected clock or only the injected SessionRNG seed differs.
    const injectedOnly = [];
    for (const activePlayMs of [1000, 90000]) {
      for (const seed of [1, 4, 10]) {
        injectedOnly.push(breedCase({
          parents: [
            { genome: kaumFauna[0], xp: 7, hurt: null, fed: 80, brood: 3, assignment: null },
            { genome: kaumFauna[1], xp: 7, hurt: 0, fed: 30, brood: 4, assignment: null },
          ],
          activePlayMs, earnedStardust: 750, sessionRng: { seed, ordinal: 0, draws: {} }, speciesPairFirst: true, fixedDraws: [],
        }));
      }
    }
    // Companion missions. The sealed result comes from exactly three companion-mission draws, planned
    // from the injected SessionRNG state; the claim stamps the companion's new bond memories with the
    // injected active-play clock.
    const missions = await load('packages/domain/acquisition/src/companion-missions.ts');
    const care = await load('packages/domain/acquisition/src/companion-care.ts');
    const bondOf = (memories) => care.withCompanionBondMemoriesV1(null, Array.from({ length: memories }, (_, i) => ({ id: `taste:m${i}`, kind: 'taste' })), 0);
    const missionDraws = (sessionRng) => planSessionRNGDraws(createSessionRNG(sessionRng.seed, { ...sessionRng.draws }, sessionRng.ordinal).state(),
      [missions.COMPANION_MISSION_DOMAIN_V1, missions.COMPANION_MISSION_DOMAIN_V1, missions.COMPANION_MISSION_DOMAIN_V1]).draws.map((d) => d.value);
    const DEPOSITS = ['Fe', 'Si', 'Ni', 'Cu'];
    const seals = [];
    for (const type of missions.COMPANION_MISSION_TYPES_V1) {
      for (const length of missions.COMPANION_MISSION_LENGTHS_V1) {
        for (const bondMemories of [0, 15]) {
          for (const seed of [5, 6, 7, 3735928559]) {
            const input = { type, length, bondMemories, deposits: DEPOSITS, sessionRng: { seed, ordinal: 0, draws: {} } };
            const c = structuredClone(input);
            const draws = missionDraws(c.sessionRng);
            seals.push({ input, draws, sealed: plain(missions.sealCompanionMissionV1({ type: c.type, length: c.length, bond: bondOf(c.bondMemories), deposits: c.deposits, draws })) });
          }
        }
      }
    }
    const claims = [];
    for (const length of ['short', 'long']) {
      for (const activePlayMs of [1000, 90000]) {
        const input = { length, type: 'survey', worldKey: 'CF1|recorded-world', missionId: 'mission:7', activePlayMs, sessionRng: { seed: 6, ordinal: 0, draws: {} } };
        const c = structuredClone(input);
        const sealed = missions.sealCompanionMissionV1({ type: c.type, length: c.length, bond: null, deposits: DEPOSITS, draws: missionDraws(c.sessionRng) });
        const [first, second] = injectedOnly[0].input.parents;
        const { state, ids } = ownershipOf([{ ...first, assignment: { kind: 'mission', missionId: c.missionId } }, second]);
        const out = missions.companionMissionClaimSuccessorV1(state, { creatureId: ids[0], missionId: c.missionId, type: c.type, length: c.length, worldKey: c.worldKey, sealed, activePlayMs: c.activePlayMs });
        claims.push({ input, sealed: plain(sealed), creatureAfter: plain(out.creatureAfter), memento: out.memento, successorDigest: v2.ownershipStateDigestV2(out.successor) });
      }
    }
    for (const name of ['COSMIC_EPOCH', 'st', 'customNames']) if (name in globalThis) throw new Error(`acquisition: ${name} was left defined`);

    return {
      freeGlobals: {
        installCaptureHooks: 'called once before the first case, as the current game\'s acquisition tests do: the address resolver reaches worldgen, which reads GAL_SPRITES',
        COSMIC_EPOCH: 'not supplied: rosters are generated through the explicit-epoch entry at epoch 0',
        st: 'not supplied: undefined',
        customNames: 'not supplied: undefined',
      },
      injected: {
        clock: 'activePlayMs, an integer of active-play milliseconds, given in every case input; no case reads a device clock',
        random: 'a SessionRNG state { seed, ordinal, draws } given in every case input; capture draws capture.candidate then capture.success, breeding draws care.breed, a mission seal draws companion-mission three times, each planned with planSessionRNGDraws; fixedDraws are settled directly',
      },
      taming: { tameOdds: acq.TAME_ODDS_V1, chance, hitEdges, worlds, gear: GEAR, captures, chains },
      breeding: { world: 'kaum', star: KAUM.star, planet: KAUM.planet, epoch: 0, cases: breeding, injectedOnly },
      missions: { deposits: DEPOSITS, seals, claims },
    };
  },
  // Fixed fabrication plans of the opportunity package: the one planner that needs no Arc 2 capability.
  // Its only clock is the injected active-play time; the receipt ordinal seeds generated-gear metadata.
  // There is no random source: no case reads Math.random or a device clock.
  opportunity: async (source) => {
    const NAMES = ['_cardFactsSet', '_earthNamePass', 'GAL_KIND', 'planetThumb', 'starThumb', 'galaxyThumb',
      'moonThumb', 'cometThumb', 'beltThumb', 'GAL_SPRITES', 'COSMIC_EPOCH', 'st', 'customNames'];
    for (const name of NAMES) if (name in globalThis) throw new Error(`opportunity: ${name} must not be defined before recording`);
    const load = (rel) => import(pathToFileURL(join(source, rel)).href);
    const o = await load('packages/domain/opportunity/src/index.ts');
    const { resolveCF1WorldAddress, resolveCF1StarAddress, navFromCanonicalCF1Address } = await load('packages/scene/src/index.ts');
    const loot = await load('packages/domain/loot/src/index.ts');
    const { registerArc2EngineeringLoadout } = await load('packages/domain/loot/src/engineering-loadout-internal.ts');
    const { installCaptureHooks } = await load('packages/domain/descriptors/src/index.ts');
    // The address resolver walks the current game's worldgen, which reads GAL_SPRITES.
    installCaptureHooks();
    const plain = (value) => JSON.parse(JSON.stringify(value));

    // A world the current game's planner tests mine (its biome-vein world), for a state with extractions.
    const world = { galaxy: { seed: 999, x: 90, y: -60 }, star: { seed: 3037235558, x: -897.1608293121681, y: -86.20030916528776 }, planet: { seed: 171668249 } };
    const resolved = resolveCF1WorldAddress(world);
    if (!resolved.ok) throw new Error(`opportunity: world did not resolve: ${resolved.reason}`);
    const stateOf = (name) => (name === 'fresh' ? o.createEngineeringState() : o.migrateLegacyEngineeringState({
      schema: o.LEGACY_ENGINEERING_SEED_MIRROR_SCHEMA, revision: 2, worlds: [{ seed: world.planet.seed, extractionsTaken: 3 }], stars: [], research: [],
    }, o.createLegacyEngineeringSeedResolver({ worlds: [resolved.address], stars: [] })));
    const ASSETS = {
      plenty: { materials: { C: 4, Ni: 4 }, exceptionalMaterials: {}, itemCounts: { cell: 1, navcore: 1, servo: 2, chip: 1, wire: 1 }, stardust: 100, signatureIds: [] },
      exceptional: { materials: { C: 4, Ni: 4 }, exceptionalMaterials: { C: 1, Ni: 2 }, itemCounts: {}, stardust: 0, signatureIds: [] },
    };
    const cases = [];
    for (const [baseId, assets] of [['meteor', 'plenty'], ['meteor', 'exceptional'], ['earpiece', 'plenty'], ['autoext', 'plenty']]) {
      for (const state of ['fresh', 'mined']) {
        for (const activePlayMs of [0, 90000]) {
          for (const receiptOrdinal of [4, 5]) {
            const input = { baseId, assets, state, activePlayMs, receiptOrdinal };
            const c = structuredClone(input);
            const out = o.planFixedFabrication({ state: stateOf(c.state), baseId: c.baseId, assets: structuredClone(ASSETS[c.assets]), activePlay: { activePlayMs: c.activePlayMs }, receiptOrdinal: c.receiptOrdinal });
            cases.push({ input, output: plain(out) });
          }
        }
      }
    }

    // Mining and stellar skimming need an Arc 2 engineering capability. It is built from the loot
    // package directly (a registered loadout of legacy gear plus system counts), as inventory 5 #3
    // proposes, instead of through persistence. Each economy receipt is taken from its plan with the
    // same injected clock the plan was made at.
    const gearSource = loot.makeGearSourceActionId({ kind: 'legacy-migration', ownerId: 'opportunity-recorder', actionKey: 'items-v1', receiptId: 'migration:v4-v5' });
    const LOADOUTS = {
      none: { itemCounts: [], equipped: {}, equippedAffixes: {}, systems: [] },
      mining: { itemCounts: [['rig3', 1], ['headlamp', 1]], equipped: { tool: 'rig3', helmet: 'headlamp' }, equippedAffixes: { tool: { k: 'yield', v: 0.25, forId: 'rig3' } }, systems: [{ baseId: 'autoext', count: 1 }] },
      jumpdrive: { itemCounts: [], equipped: {}, equippedAffixes: {}, systems: [{ baseId: 'jumpdrive', count: 1 }] },
    };
    const capabilitiesOf = (l) => {
      const migrated = loot.migrateLegacyGear({ sourceActionId: gearSource, itemCounts: l.itemCounts, equipped: l.equipped, equippedAffixes: l.equippedAffixes });
      const inventory = loot.decodeGearInventory(JSON.stringify({
        schema: loot.GEAR_INVENTORY_SCHEMA, revision: 1, capacity: 8,
        entries: migrated.instances.map((instance) => ({ instance, favorite: false, locked: false })),
        equipped: migrated.equipped, pendingRewards: [],
      }));
      return loot.projectEngineeringCapabilities(registerArc2EngineeringLoadout(inventory, l.systems));
    };
    const attempt = (fn) => { try { return fn(); } catch (error) { return { throws: String(error.message) }; } };
    const mars = { galaxy: { seed: 999, x: 90, y: -60 }, star: { seed: 424242, x: 560, y: 170 }, planet: { seed: 134 } };
    const marsAddress = resolveCF1WorldAddress(mars).address;
    const marsSurface = navFromCanonicalCF1Address(marsAddress).state;
    const mine = (state, loadout, activePlayMs, receiptOrdinal) => o.planWorldMining({
      state, opportunity: o.projectWorldOpportunity(marsAddress), currentSurface: marsSurface,
      capabilities: capabilitiesOf(LOADOUTS[loadout]), activePlay: { activePlayMs }, receiptOrdinal,
    });
    const receipt = (fn, plan, activePlayMs) => attempt(() => fn(plan, { receiptId: `receipt-${plan.receiptOrdinal}`, activePlayMs }));
    const mining = [];
    for (const loadout of ['none', 'mining']) {
      for (const activePlayMs of [1000, 90000]) {
        for (const receiptOrdinal of [3, 4]) {
          const input = { loadout, activePlayMs, receiptOrdinal };
          const plan = mine(o.createEngineeringState(), loadout, activePlayMs, receiptOrdinal);
          mining.push({ input, plan: plain(plan), receipt: plan.status === 'planned' ? plain(receipt(o.economyReceiptFromWorldMiningV1, plan, activePlayMs)) : null,
            receiptAtOtherClock: plan.status === 'planned' ? plain(receipt(o.economyReceiptFromWorldMiningV1, plan, activePlayMs + 1)) : null });
        }
      }
    }
    // The Auto-Extractor: a first load at 1000 starts its cursor; a second load from that state, later on
    // the injected clock, collects the loads matured in between.
    const autoExtractor = [];
    for (const later of [1000 + 600000, 1000 + 3600000]) {
      const first = mine(o.createEngineeringState(), 'mining', 1000, 3);
      const second = mine(first.nextState, 'mining', later, 4);
      autoExtractor.push({ input: { loadout: 'mining', first: { activePlayMs: 1000, receiptOrdinal: 3 }, second: { activePlayMs: later, receiptOrdinal: 4 } }, plan: plain(second) });
    }
    const remnant = { galaxy: { seed: 999, x: 90, y: -60 }, star: { seed: 3363971653, x: -386.2348864697851, y: 453.95830733468756 } };
    const remnantAddress = resolveCF1StarAddress(remnant).address;
    const remnantSystem = navFromCanonicalCF1Address(remnantAddress).state;
    const skimming = [];
    for (const loadout of ['none', 'jumpdrive']) {
      for (const activePlayMs of [2000, 90000]) {
        for (const receiptOrdinal of [4, 5]) {
          const input = { loadout, playerHp: 100, activePlayMs, receiptOrdinal };
          const plan = o.planStellarSkim({ state: o.createEngineeringState(), opportunity: o.projectStarOpportunity(remnantAddress), currentSystem: remnantSystem,
            capabilities: capabilitiesOf(LOADOUTS[loadout]), playerHp: 100, activePlay: { activePlayMs }, receiptOrdinal });
          skimming.push({ input, plan: plain(plan), receipt: plan.status === 'planned' ? plain(receipt(o.economyReceiptFromStellarSkimV1, plan, activePlayMs)) : null,
            receiptAtOtherClock: plan.status === 'planned' ? plain(receipt(o.economyReceiptFromStellarSkimV1, plan, activePlayMs + 1)) : null });
        }
      }
    }
    const samples = o.projectFieldSamples({ address: marsAddress, opportunity: o.projectWorldOpportunity(marsAddress), landing: 'first', training: false });
    const fieldSamples = [500, 90000].map((activePlayMs) => ({ input: { landing: 'first', training: false, activePlayMs }, receipt: plain(attempt(() => o.economyReceiptFromFieldSamplesV1(samples, { receiptId: 'land-receipt-1', activePlayMs }))) }));
    for (const name of ['COSMIC_EPOCH', 'st', 'customNames']) if (name in globalThis) throw new Error(`opportunity: ${name} was left defined`);
    return {
      freeGlobals: {
        installCaptureHooks: 'called once before the first case: the address resolver reaches worldgen, which reads GAL_SPRITES',
        COSMIC_EPOCH: 'not supplied', st: 'not supplied', customNames: 'not supplied',
      },
      injected: { clock: 'activePlayMs, given in every case input as activePlay.activePlayMs', random: 'none: the receipt ordinal, given in every input, seeds generated-gear metadata; mining and skimming draw from mulberry32 seeded by the planet or star seed and the extraction count' },
      world,
      assets: ASSETS,
      fabrication: cases,
      mars, remnant, loadouts: LOADOUTS, mining, autoExtractor, skimming, fieldSamples,
    };
  },
};

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) args[argv[i].replace(/^--/, '')] = argv[i + 1];
  return args;
}

const { source, only } = parseArgs(process.argv.slice(2));
if (!source || !only || !recorders[only]) {
  console.error(`usage: node tools/record-fixtures.mjs --source <path> --only <${Object.keys(recorders).join('|')}>`);
  process.exit(2);
}
const outDir = fileURLToPath(new URL('../fixtures/current/', import.meta.url));
mkdirSync(outDir, { recursive: true });
const data = await recorders[only](resolve(source));
writeFileSync(join(outDir, `${only}.json`), JSON.stringify(data, null, 1) + '\n');
console.log(`recorded ${only}: ${Array.isArray(data) ? data.length : Object.keys(data).length} entries`);
