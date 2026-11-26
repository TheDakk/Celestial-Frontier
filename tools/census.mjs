// The census of worlds: prints the share tables, the hits on every table and the time taken, and holds this game
// against the legacy game.
// Usage: node tools/census.mjs [--planets 100000]
//        node tools/census.mjs --ref <folder holding celestial-frontier.html> [--planets 100000] [--record]
// With --ref the legacy game's own functions (tools/census-legacy.mjs) are run over the same worlds and every line
// is compared; each field that differs is listed by star and planet. Three censuses are held:
//   seeded     Sol, then systems hashInt(0xCE5, i, 0), read through the game's world generation;
//   veins      every tier with every planet type, and seeds of every rarity roll at every depth and ring cap;
//   addressed  real stars of real galaxies, read through the game's production snapshot, roster, descent and card:
//              a first choice of 700 stars, then every real star under a ring that caps is read by the legacy game
//              and kept when the ring cuts one of its worlds or it holds an outcome the choice is still short of.
// With --record the legacy game's answers are written first, whatever this game says, to
// fixtures/v1/recorded/census.json, census-veins.json and census-addressed.json; the comparison follows. This tool
// compares the seeded census line by line; the veins and addressed censuses are compared by their tests.
// The path given is not written to any output. This tool is run by hand; no test imports it.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LEGACY_SLICES, LEGACY_STAND_INS, legacyCensusSources, legacyFirstSalts, legacyGame } from './census-legacy.mjs';
import { extractTrackedV1Script } from './record-v1-fixtures.mjs';

// The game's sources import some .ts files with .js specifiers, and the app imports its own with none.
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (specifier.endsWith('.js')) return nextResolve(specifier.slice(0, -3) + '.ts', context);
      if (specifier.startsWith('.')) {
        try { return nextResolve(specifier + '.ts', context); } catch { return nextResolve(specifier + '/index.ts', context); }
      }
      throw error;
    }
  },
});

const GAME_HTML = 'celestial-frontier.html';
const RECORDED = fileURLToPath(new URL('../fixtures/v1/recorded/', import.meta.url));
const RECORDED_PLANETS = 100000;
const GATE_PLANETS = 20000;
const ROLL_SEEDS = 12;
const TOP_ROLL_SEEDS = 6;
/** How often the addressed census meets each outcome of type, band and life and each biome, or as often as the
    seeded census of 100,000 worlds met it when that is fewer (Earth and Mars are met once). */
const ADDRESSED_EACH = 3;
/** The tables of which the addressed census meets every entry the seeded census met. */
const ADDRESSED_OFTEN = ['life of a type in a band', 'biome'];
const ADDRESSED_ONCE = ['planet type', 'climate band', 'life', 'first-landing odds', 'damage rung', 'biome vein', 'deposit count', 'exceptional vein', 'moon type'];
/** The table the hit counter keeps of the worlds whose tier the ring cut. */
const RING_CUT = 'a tier the ring cut';

const percent = (part, whole) => (whole === 0 ? 'n/a' : `${((100 * part) / whole).toFixed(2)}%`);
const seconds = (from) => `${(Number(process.hrtime.bigint() - from) / 1e9).toFixed(2)}s`;

function table(title, rows) {
  const width = Math.max(...rows.map(([name]) => name.length));
  console.log(`\n${title}`);
  for (const [name, count, share] of rows) console.log(`  ${name.padEnd(width)}  ${String(count).padStart(8)}  ${share ?? ''}`);
}

function printShares(shares) {
  const order = (counts) => Object.entries(counts).sort((a, b) => b[1] - a[1]);
  table(`Planet types (of ${shares.planets} planets)`, order(shares.types).map(([k, n]) => [k, n, percent(n, shares.planets)]));
  table('Climate bands (of planets)', order(shares.bands).map(([k, n]) => [k, n, percent(n, shares.planets)]));
  table(`Star kinds (of ${shares.systems} systems)`, order(shares.starKinds).map(([k, n]) => [k, n, percent(n, shares.systems)]));
  table('Systems', [
    ['with planets', shares.systemsWithPlanets, percent(shares.systemsWithPlanets, shares.systems)],
    ['with a belt', shares.systemsWithBelt, percent(shares.systemsWithBelt, shares.systems)],
    ['with an outer ring', shares.systemsWithOuterRing, percent(shares.systemsWithOuterRing, shares.systems)],
    ['with dwarf planets', shares.systemsWithDwarfs, percent(shares.systemsWithDwarfs, shares.systems)],
    ['with comets', shares.systemsWithComets, percent(shares.systemsWithComets, shares.systems)],
    ['with a visitor', shares.systemsWithVisitor, percent(shares.systemsWithVisitor, shares.systems)],
  ]);
  table('Bodies', [
    ['planets a system', (shares.planets / shares.systems).toFixed(3)],
    ['dwarf planets', shares.dwarfs, `${(shares.dwarfs / shares.systemsWithPlanets).toFixed(3)} a system with planets`],
    ['comets', shares.comets, `${(shares.comets / shares.systems).toFixed(3)} a system`],
    ['moons', shares.moons, `${(shares.moons / shares.planets).toFixed(3)} a planet`],
    ['ringed planets', shares.ringed, percent(shares.ringed, shares.planets)],
  ]);
}

/** Every table and how many cases hit each entry, fewest first within a table. */
function printHits(title, hits) {
  console.log(`\n${title}`);
  for (const [name, counts] of Object.entries(hits)) {
    const entries = Object.entries(counts).sort((a, b) => a[1] - b[1]);
    console.log(`  ${name} (${entries.length} entries, fewest ${entries[0][1]}): ${entries.map(([k, n]) => `${k} ${n}`).join('; ')}`);
  }
}

/** A fixture as text: the header fields one a line, then one case a line. */
function writeFixture(name, fixture) {
  const { cases, ...head } = fixture;
  const text = ['{', ...Object.entries(head).map(([key, value]) => ` ${JSON.stringify(key)}: ${JSON.stringify(value)},`),
    ' "cases": [', ...cases.map((c, i) => `  ${JSON.stringify(c)}${i < cases.length - 1 ? ',' : ''}`), ' ]', '}', ''].join('\n');
  writeFileSync(join(RECORDED, `${name}.json`), text);
  console.log(`recorded fixtures/v1/recorded/${name}.json: ${cases.length} cases`);
}

/** The fields of two lines that differ, as `name: this game / the legacy game`. */
function differingFields(mine, theirs) {
  const parts = (row) => new Map(row.split('|').map((part) => {
    const at = part.indexOf('=');
    return at < 0 ? ['ordinal', part] : [part.slice(0, at), part.slice(at + 1)];
  }));
  const a = parts(mine);
  const b = parts(theirs);
  return [...new Set([...a.keys(), ...b.keys()])].filter((key) => a.get(key) !== b.get(key))
    .map((key) => `${key}: game ${a.get(key)} / legacy ${b.get(key)}`);
}

/** Compares two runs of systems line by line; prints the first differences and returns how many lines differ. */
function compareSystems(mine, theirs) {
  let lines = 0;
  let differing = 0;
  const fields = new Map();
  const other = theirs[Symbol.iterator]();
  for (const entry of mine) {
    const their = other.next().value;
    const pairs = [[entry.row, their.row, `star ${entry.starSeed}`], ...entry.worlds.map((world, i) => [world.row, their.worlds[i]?.row ?? '', `star ${entry.starSeed} planet ${world.ordinal} (seed ${world.planet.P.seed})`])];
    for (const [a, b, where] of pairs) {
      lines++;
      if (a === b) continue;
      differing++;
      const names = differingFields(a, b);
      for (const name of names) {
        const field = name.slice(0, name.indexOf(':'));
        fields.set(field, (fields.get(field) ?? 0) + 1);
      }
      if (differing <= 40) console.log(`DIFFERS ${where}\n  ${names.join('\n  ')}`);
    }
  }
  console.log(`${lines} lines compared, ${differing} differ`);
  for (const [field, count] of fields) console.log(`  ${field}: ${count} lines`);
  return differing;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const name = argv[i].replace(/^--/, '');
    if (name === 'record') args.record = true;
    else args[name] = argv[++i];
  }
  return args;
}

/* ---- the veins census: every tier with every type, and seeds of every rarity roll at every place ---- */

/** The first seeds (1, 2, 3 and on) whose legacy rarity roll is each tier, up to 12 a tier; the search ends at the
    sixth seed of the summit, so a tier may hold fewer (tier 13 holds 9). */
function seedsOfEveryRoll(game, tiers) {
  const found = Array.from({ length: tiers }, () => []);
  for (let seed = 1; found[tiers - 1].length < TOP_ROLL_SEEDS; seed++) {
    const roll = game.rarityRoll(seed, 3);
    if (found[roll].length < ROLL_SEEDS) found[roll].push(seed);
  }
  return found;
}

/** The legacy game's answers to the veins cases, and what they hit. `support` is tests/support/census-veins.ts. */
function legacyVeins(legacy, support, rollSeeds) {
  const { st, game } = legacy;
  const hits = new support.VeinHits(game.DEPOSIT_PROFILES, game.RARE_VEIN);
  const answerAt = (seed, type, rawTier, tier) => ({
    rawTier, tier,
    deposits: game.depositsFor(seed, type, tier),
    cosmicVein: game.cosmicVeinFor(seed, tier),
    exceptionalVein: game.exVeinFor(seed, type, tier),
    reserve: game.reserveFor(seed, tier),
  });
  const digestOf = (lines) => createHash('sha256').update(lines.join('\n')).digest('hex').slice(0, 16);
  const cases = [];
  for (let tier = 0; tier < support.VEIN_TIERS; tier++) for (const type of support.VEIN_TYPES) {
    const lines = support.gridSeeds(tier, type).map((seed) => {
      const answer = answerAt(seed, type, tier, tier);
      hits.answer(type, answer);
      return support.veinLine(seed, type, answer);
    });
    cases.push({ group: 'grid', input: { tier, type, seeds: lines.length }, output: digestOf(lines) });
  }
  rollSeeds.forEach((seeds, roll) => {
    const lines = [];
    seeds.forEach((seed, i) => {
      const type = support.VEIN_TYPES[i % support.VEIN_TYPES.length];
      for (const place of support.VEIN_PLACES) for (const level of support.VEIN_LIFE) {
        // The card's designation where the world lives, then the ring's clamp (5158-5163, 14733-14747).
        st.gal = place.gal;
        const raw = game.card({ seed, type }, null, { level }, { civ: false }).desig;
        st.gal = undefined;
        const ringed = game.ringDesignation({ designation: raw, where: { gal: place.gal, star: place.star } }).designation;
        const answer = answerAt(seed, type, raw.tier, ringed.tier);
        hits.answer(type, answer);
        hits.hit('place', `${place.name}: ${ringed.tier < raw.tier ? 'capped' : 'not capped'}`);
        hits.hit('rarity roll', String(roll));
        lines.push(`${place.name}|${level}|${support.veinLine(seed, type, answer)}`);
      }
    });
    cases.push({ group: 'roll', input: { roll, seeds }, output: digestOf(lines) });
  });
  cases.push({ group: 'hits', input: {}, output: hits.hits() });
  return cases;
}

/* ---- the addressed census: real stars of real galaxies ---- */

/** Stars with planets, each proven by the game's resolver. First the choice: Sol and its Neighborhood, the far home
    galaxy, two galaxies in each region of the universe, and the two deep worlds the mining tests name. Then the
    widening: every real star under a ring that caps (the whole home galaxy and every galaxy of the three inner
    regions, both layers of stars) is read by the legacy game, and kept when the ring cuts the tier of one of its
    worlds, or when it holds an entry of a table that `short` still asks for. `read(place)` gives what the legacy
    game's census of that star hit. Returns the places and what the widening read. */
async function censusPlaces(read, short) {
  const { FCELL, fineStarsInCell, galaxiesInCell, galaxyProfile, starsInCell, systemFor } = await import('@cf/domain-worldgen');
  const { GCELL, GR } = await import('@cf/domain-worldconfig');
  const { regionAt } = await import('@cf/domain-strays');
  const { resolveCF1WorldAddress } = await import('@cf/scene');
  const places = [];
  const seen = new Set();
  const proven = (galaxy, star) => {
    const first = systemFor(star.seed).planets[0];
    return Boolean(first) && !seen.has(star.seed) && resolveCF1WorldAddress({ galaxy, star, planet: { seed: first.P.seed } }).ok;
  };
  const take = (place, hits) => {
    seen.add(place.star.seed);
    places.push(place);
    for (const [table, counts] of Object.entries(hits)) for (const [entry, count] of Object.entries(counts)) {
      const left = short.get(`${table}|${entry}`);
      if (left !== undefined) short.set(`${table}|${entry}`, left - count);
    }
  };
  const add = (galaxy, star) => {
    if (!proven(galaxy, star)) return false;
    const place = { galaxy, star };
    take(place, read(place));
    return true;
  };
  const starsOf = (galaxy, cells, limit, fine = false) => {
    const profile = galaxyProfile(galaxy.seed);
    let taken = 0;
    for (const [cx, cy] of cells) for (const star of fine ? fineStarsInCell(galaxy.seed, profile, cx, cy) : starsInCell(galaxy.seed, profile, cx, cy).stars) {
      if (taken < limit && add(galaxy, { seed: star.seed, x: star.x, y: star.y })) taken++;
    }
  };
  const square = (x0, x1, y0, y1) => {
    const cells = [];
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) cells.push([cx, cy]);
    return cells;
  };
  const home = { seed: 999, x: 90, y: -60 };
  add(home, { seed: 424242, x: 560, y: 170 });
  starsOf(home, square(6, 20, -3, 11), 200);            // around Sol: the Neighborhood and just beyond it
  starsOf(home, square(24, 56, -2, 26), 700, true);     // the Neighborhood's fainter stars, under the ring's cap of 5
  starsOf(home, square(-24, -15, -6, 3), 120);          // far across the home galaxy
  starsOf(home, square(-60, -45, -8, 8), 150, true);
  const perRegion = new Map();
  for (let ring = 0; ring <= 21 && [...perRegion.values()].filter((n) => n >= 2).length < 6; ring++) {
    for (const [cx, cy] of square(-ring, ring, -ring, ring)) {
      if (Math.max(Math.abs(cx), Math.abs(cy)) !== ring) continue;
      for (const g of galaxiesInCell(cx, cy)) {
        const region = regionAt(g.x, g.y);
        if (g.seed === home.seed || (perRegion.get(region) ?? 0) >= 2) continue;
        const before = places.length;
        starsOf({ seed: g.seed, x: g.x, y: g.y }, square(-3, 3, -3, 3), 45);
        if (places.length > before) perRegion.set(region, (perRegion.get(region) ?? 0) + 1);
      }
    }
  }
  add({ seed: 2775120088, x: -15585.946043489894, y: -13862.482918268226 }, { seed: 510510541, x: -550.8509466005489, y: -8.055439678020775 });
  add({ seed: 1012779741, x: -599.7658047693408, y: -6073.942273357868 }, { seed: 3589953231, x: -138.81464905291796, y: -21.96363354055211 });
  const chosen = places.length;

  // The widening. A galaxy's stars lie inside its radius: every cell of both layers that could hold one is read.
  const capped = [home];
  const reach = 8;   // universe cells: the third region ends 7 cells from home
  for (const [cx, cy] of square(-reach, reach, -reach, reach)) for (const g of galaxiesInCell(cx, cy)) {
    if (g.seed !== home.seed && regionAt(g.x, g.y) <= 2) capped.push({ seed: g.seed, x: g.x, y: g.y });
  }
  const scan = { galaxies: capped.length, stars: 0, planets: 0, cut: {} };
  const coarse = Math.ceil(GR / GCELL);
  const fine = Math.ceil(GR / FCELL);
  for (const galaxy of capped) {
    const profile = galaxyProfile(galaxy.seed);
    const stars = [];
    for (const [cx, cy] of square(-coarse, coarse, -coarse, coarse)) stars.push(...starsInCell(galaxy.seed, profile, cx, cy).stars);
    for (const [cx, cy] of square(-fine, fine, -fine, fine)) stars.push(...fineStarsInCell(galaxy.seed, profile, cx, cy));
    for (const { seed, x, y } of stars) {
      const place = { galaxy, star: { seed, x, y } };
      const planets = systemFor(seed).planets.length;
      if (planets === 0) continue;
      const hits = read(place);
      scan.stars++;
      scan.planets += planets;
      const cut = hits[RING_CUT];
      for (const [entry, count] of Object.entries(cut ?? {})) scan.cut[entry] = (scan.cut[entry] ?? 0) + count;
      const wanted = Object.entries(hits).some(([table, counts]) => Object.keys(counts).some((entry) => (short.get(`${table}|${entry}`) ?? 0) > 0));
      if ((cut !== undefined || wanted) && proven(galaxy, place.star)) take(place, hits);
    }
  }
  return { places, chosen, scan };
}

/** What the addressed census is asked to meet, from what the legacy game's seeded census met: each entry of the
    often-met tables `ADDRESSED_EACH` times (or as often as the seeded census met it, when fewer), each entry of the
    others once. A map of `table|entry` to how many are still wanted. */
function addressedShort(seededHits) {
  const short = new Map();
  for (const table of ADDRESSED_OFTEN) for (const [entry, count] of Object.entries(seededHits[table])) short.set(`${table}|${entry}`, Math.min(ADDRESSED_EACH, count));
  for (const table of ADDRESSED_ONCE) for (const entry of Object.keys(seededHits[table])) short.set(`${table}|${entry}`, 1);
  return short;
}

/* ---- the run ---- */

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  const planets = Number(args.planets ?? RECORDED_PLANETS);
  if (!Number.isInteger(planets) || planets < 1 || (args.record && (!args.ref || planets !== RECORDED_PLANETS))) {
    console.error(`usage: node tools/census.mjs [--planets <count>] [--ref <folder holding celestial-frontier.html> [--record]]; a recording is of ${RECORDED_PLANETS} planets`);
    process.exit(2);
  }
  const kinds = await import('@cf/domain-worldkinds');
  const { censusFingerprint, censusSystem, censusSystemDigest, censusSystems, CensusHitCounter } = kinds;
  // The same readers the gate's tests read through.
  const game = (await import('../tests/support/census.ts')).gameSources();

  let from = process.hrtime.bigint();
  const mine = censusFingerprint(game, planets);
  console.log(`seeded census of this game: ${mine.planets} planets in ${mine.shares.systems} systems, ${seconds(from)}`);
  console.log(`fingerprint ${mine.total}`);
  printShares(mine.shares);
  printHits(`Seeded census: hits on each table (${mine.planets} planets)`, mine.hits);

  // The new types: each slice of planets step by step, and what each design's source rule counts.
  const { SWITCHES_OFF, SWITCHES_ON, WORLD_TYPES, sliceStepsPassed } = kinds;
  const { switchCensus } = await import('../tests/support/census-switches.ts');
  const steps = new Map(WORLD_TYPES.map((type) => [type.key, new Array((type.slice ?? type.source ?? []).length).fill(0)]));
  for (const entry of censusSystems(game, planets)) {
    const sol = entry.system.sol === true;
    for (const type of WORLD_TYPES) {
      const counts = steps.get(type.key);
      if (type.source !== null) type.source.forEach((step, i) => { counts[i] += step.count(entry.starSeed, entry.system); });
      if (type.slice !== null) for (const world of entry.worlds) {
        const passed = sliceStepsPassed(type, world.planet.P, world.survey.band, sol);
        for (let i = 0; i < passed; i++) counts[i]++;
      }
    }
  }
  const oneIn = (part, whole) => (part === 0 ? 'none' : `1 in ${(whole / part).toFixed(1)}`);
  console.log(`\nNew world types, switches on (${mine.planets} planets, ${mine.shares.systems} systems; no type has rules yet).`);
  console.log('A source rule is counted over whole systems, so the last system\'s planets beyond the count are in it.');
  for (const type of WORLD_TYPES) {
    const counts = steps.get(type.key);
    if (type.slice !== null) {
      table(`${type.label}: a slice of planets`, type.slice.map((step, i) => [step.name, counts[i],
        `${percent(counts[i], i === 0 ? mine.planets : counts[i - 1])} of ${i === 0 ? 'planets' : 'the step above'}; ${percent(counts[i], mine.planets)} of planets, ${oneIn(counts[i], mine.planets)}`]));
    } else if (type.source !== null) {
      table(`${type.label}: what its source rule counts`, type.source.map((step, i) => [step.name, counts[i],
        `${(counts[i] / mine.shares.systems).toFixed(4)} a system; ${oneIn(counts[i], mine.planets)} planets`]));
    } else {
      console.log(`\n${type.label}: not counted by a census of systems`);
    }
  }
  from = process.hrtime.bigint();
  const on = switchCensus(planets, SWITCHES_ON);
  const off = switchCensus(planets, SWITCHES_OFF);
  table(`Every switch on against every switch off, ${seconds(from)} for both`, [
    ['legacy layer: fingerprint with every switch on', on.legacy.total, on.legacy.total === mine.total ? 'the same as with none' : 'DIFFERS'],
    ['legacy layer: fingerprint with every switch off', off.legacy.total, off.legacy.total === mine.total ? 'the same' : 'DIFFERS'],
    ['effective layer: worlds changed outside a slice', on.changedOutside],
    ['effective layer: worlds changed inside a slice', on.changedInside, 'no type has rules yet'],
    ['worlds moved with every switch off', off.movedWhenOff + on.movedWhenOff],
    ['bodies added', on.bodies],
  ]);
  let failed = on.legacy.total !== mine.total || off.legacy.total !== mine.total || on.changedOutside + on.movedWhenOff + off.movedWhenOff > 0;
  if (failed) console.error('a switch MOVED a world outside its slice');

  if (args.ref) {
    const htmlBytes = readFileSync(join(resolve(args.ref), GAME_HTML));
    const script = extractTrackedV1Script(htmlBytes.toString('utf8'));
    const source = `${GAME_HTML} sha256:${createHash('sha256').update(htmlBytes).digest('hex')} bytes:${htmlBytes.length}`;
    const support = await import('../tests/support/census-veins.ts');

    // The legacy game first: its answers are recorded whatever this game says.
    const legacy = legacyCensusSources(script);
    from = process.hrtime.bigint();
    const theirs = censusFingerprint(legacy, planets);
    console.log(`\nseeded census of the legacy game: ${theirs.planets} planets in ${theirs.shares.systems} systems, ${seconds(from)}`);
    console.log(`fingerprint ${theirs.total}`);
    from = process.hrtime.bigint();
    const cut = legacyGame(script);
    const rollSeeds = seedsOfEveryRoll(cut.game, support.VEIN_TIERS);
    console.log(`seeds of every rarity roll found, ${seconds(from)}`);
    const veinCases = legacyVeins(cut, support, rollSeeds);
    // The addressed stars: the legacy game reads each star where it lives, and its answers choose the widening.
    from = process.hrtime.bigint();
    const placeOf = new Map();
    const legacyAddressed = legacyCensusSources(script, (starSeed) => placeOf.get(starSeed));
    const legacyEntry = (place) => {
      placeOf.set(place.star.seed, place);
      return censusSystem(legacyAddressed, place.star.seed);
    };
    const short = addressedShort(theirs.hits);
    const { places, chosen, scan } = await censusPlaces((place) => {
      const hits = new CensusHitCounter();
      const entry = legacyEntry(place);
      hits.system(entry.system);
      for (const world of entry.worlds) hits.world(world);
      return hits.hits();
    }, short);
    console.log(`addressed stars: ${chosen} chosen, ${places.length - chosen} more from ${scan.stars} stars with planets (${scan.planets} planets) in ${scan.galaxies} galaxies under a ring that caps, ${seconds(from)}`);
    console.log(`  worlds the ring cuts among them: ${JSON.stringify(scan.cut)}`);
    const unmet = [...short].filter(([, left]) => left > 0).map(([key]) => key);
    if (unmet.length > 0) {
      console.error(`the addressed census could not meet: ${unmet.join('; ')}`);
      process.exit(1);
    }
    const addressedHits = new CensusHitCounter();
    const addressedCases = places.map((place) => {
      const entry = legacyEntry(place);
      addressedHits.system(entry.system);
      for (const world of entry.worlds) addressedHits.world(world);
      return { group: 'star', input: place, output: { planets: entry.worlds.length, digest: censusSystemDigest(entry) } };
    });
    addressedCases.push({ group: 'ring', input: {}, output: scan });
    addressedCases.push({ group: 'hits', input: {}, output: addressedHits.hits() });
    printHits(`Veins census of the legacy game: hits on each table (${veinCases.length - 1} groups of cases)`, veinCases.at(-1).output);
    printHits(`Addressed census of the legacy game: hits on each table (${places.length} stars)`, addressedHits.hits());

    if (args.record) {
      const gate = censusFingerprint(legacy, GATE_PLANETS);
      const taken = (what) => `${what} Read through the legacy game's own functions, cut from its script by tools/census-legacy.mjs and run with new Function: ${LEGACY_SLICES}. ${LEGACY_STAND_INS}`;
      writeFixture('census', {
        kind: 'outputs', source, test: 'tests/census.test.ts',
        taken: taken('censusFingerprint (packages/domain/worldkinds/src/census.ts) over Sol and then the systems hashInt(0xCE5, i, 0), until the count is reached. Cases: full is the whole census with what it hit on each table; gate its first 20,000 worlds; thousands one digest for each thousand worlds.'),
        cases: [
          { group: 'full', planets: theirs.planets, total: theirs.total, shares: theirs.shares, hits: theirs.hits },
          { group: 'gate', planets: gate.planets, total: gate.total, shares: gate.shares },
          { group: 'thousands', digests: theirs.perThousand },
        ],
      });
      writeFixture('census-veins', {
        kind: 'outputs', source, test: 'packages/domain/opportunity/test/veins-legacy.test.ts',
        taken: taken('The cases of tests/support/census-veins.ts. grid: for each tier 0 to 14 and each planet type, depositsFor, cosmicVeinFor, exVeinFor and reserveFor at that tier for 200 seeds; output is the first 16 hex digits of the sha256 of the lines. roll: the first seeds (1, 2, 3 and on) whose rarityRoll(seed, 3) is each tier, up to 12 a tier, the search ending at the sixth seed of tier 14 (so 9 at tier 13 and 6 at tier 14); for each seed, at each of eight places and each of three life levels, the card\'s designation with st.gal set to the place, clamped by ringDesignation, and the veins and reserve at that tier. hits: how many answers hit each entry of each table.'),
        cases: veinCases,
      });
      writeFixture('census-addressed', {
        kind: 'outputs', source, test: 'apps/game/test/census-addressed.test.ts',
        taken: taken(`censusSystem for real stars. First ${chosen} stars: Sol and its Neighborhood, the far home galaxy, two galaxies in each of the six regions, and two deep worlds. Then every real star with planets under a ring that caps (the whole home galaxy and every galaxy of the three inner regions, both layers of stars) was read by the legacy game, and kept when the ring cut the tier of one of its worlds, or when it held an outcome of type, band and life or a biome met fewer than ${ADDRESSED_EACH} times so far (or fewer times than the seeded census of 100,000 worlds met it, when that is under ${ADDRESSED_EACH}). The stars were listed and proven by this game\'s star generation and resolver; the legacy game was given each star\'s seed and place. An addressed line also holds the world\'s type, orbit, the descent\'s biome, the life and band, the card\'s Life and civilisation rows, its title and its spectral class with st.gal unset. One case a star: the count of its planets and the digest of its lines. ring: what the widening read, and every world among it whose tier the ring cut, by the tier it was cut to. hits: how many worlds hit each entry of each table.`),
        cases: addressedCases,
      });
    }

    console.log('\nSeeded census, this game against the legacy game:');
    const differing = compareSystems(censusSystems(game, planets), censusSystems(legacy, planets));

    // The veins and addressed censuses are held by tests, which can load the whole app: the production paths need
    // it. With the legacy file at hand the addressed test names each differing field.
    console.log('\nVeins census against the legacy game: npx vitest run packages/domain/opportunity/test/veins-legacy.test.ts');
    console.log('Addressed census, the production paths against the legacy game: CF_CENSUS_REF=<folder> npx vitest run apps/game/test/census-addressed.test.ts');

    const salts = legacyFirstSalts(script);
    const missing = salts.filter((salt) => !kinds.LEGACY_FIRST_SALTS.includes(salt));
    console.log(`\nLegacy first salts: ${salts.length} in the script, ${missing.length} missing from the guard${missing.length ? `: ${missing.map((s) => `0x${s.toString(16)}`).join(', ')}` : ''}`);
    if (differing > 0 || mine.total !== theirs.total || missing.length > 0) {
      console.error('this game and the legacy game DISAGREE');
      failed = true;
    } else {
      console.log('this game and the legacy game agree on every line');
    }
  }
  if (failed) process.exit(1);
}
