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
