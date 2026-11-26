// The census of seeded worlds: prints the share tables and the time taken, and holds this game against the legacy game.
// Usage: node tools/census.mjs [--planets 100000]
//        node tools/census.mjs --ref <folder holding celestial-frontier.html> [--planets 100000] [--record]
// With --ref the legacy game's own functions are run over the same worlds and every line is compared; each field that
// differs is listed by star seed and planet. With --record the legacy game's fingerprint is written to
// fixtures/current/census-v1.json (100,000 worlds, with the fingerprint of the first 20,000 beside it). The path
// given is not written to any output. This tool is run by hand; no test imports it.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractTrackedV1Script } from './record-v1-fixtures.mjs';

// The game's sources import some .ts files with .js specifiers, and the app imports its own with none.
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (specifier.endsWith('.js')) return nextResolve(specifier.slice(0, -3) + '.ts', context);
      if (specifier.startsWith('.')) return nextResolve(specifier + '.ts', context);
      throw error;
    }
  },
});

const GAME_HTML = 'celestial-frontier.html';
const FIXTURE = fileURLToPath(new URL('../fixtures/current/census-v1.json', import.meta.url));
const RECORDED_PLANETS = 100000;
const GATE_PLANETS = 20000;

/* ---- the legacy game's readers ---- */

/** The legacy game's own functions as the census's readers. Each slice starts at text that occurs once. */
export function legacyCensusSources(script) {
  const start = (text) => {
    const i = script.indexOf(text);
    if (i < 0) throw new Error(`the legacy script has no ${text}`);
    if (script.indexOf(text, i + 1) !== -1) throw new Error(`${text} is not unique in the legacy script`);
    return i;
  };
  /** From `from` through the first `to` after it. */
  const cut = (from, to) => {
    const i = start(from);
    const j = script.indexOf(to, i);
    if (j < 0) throw new Error(`the legacy script has no ${to} after ${from}`);
    return script.slice(i, j + to.length);
  };
  /** From `from` up to, not including, the first `before` after it. */
  const upTo = (from, before) => {
    const text = cut(from, before);
    return text.slice(0, text.length - before.length);
  };
  const legacy = new Function('st', 'moonThumb', `
    ${cut('function mulberry32(a){', '/4294967296}}')}
    ${cut('function hashInt(seed,x,y){', 'return h>>>0;\n}')}
    ${cut('function clamp(v,a,b){', '}')}
    ${cut('const TAU = Math.PI*2;', ';')}
    ${cut('const SYL=[', '];')}
    ${cut('function properName(seed, parts){', 's.slice(1);\n}')}
    ${cut('const UCELL=400;', 'const SYS_R=320;')}
    ${upTo('function starClass(seed){', 'const KIND_DESC={')}
    ${cut('const SOL_PLANETS=[', '\n];')}
    ${cut('function planetParams(seed){', '  return P;\n}')}
    ${cut('function genRocks(r, beltR){', '  return rocks;\n}')}
    ${cut('function _systemFor(starSeed){', '  return sys;\n}')}
    ${cut('function climateBand(P, sys, orb){', "  return 'cold';\n}")}
    ${cut('function biosphere(P, sys, band, r){', "key:level};\n}")}
    ${cut('const ERAS=[', '\n];')}
    ${cut('function civilization(P, sys, band, bio, r){', 'pop:pop};\n}')}
    function survey(P, sys, pl){
      ${upTo('  const r=mulberry32((P.seed^0x1234567)>>>0);\n  const orb = pl?pl.orb:120;', '  /* publish the card')}
      return {band, bio, civ};
    }
    ${cut('const BIOME_SETS={', 'return pool[pool.length-1];\n}')}
    ${cut('function descentTierFromPct(p){', '{lo:6,hi:8};\n}')}
    ${cut('const DESCENT_TIERS={', 'lava:{p:20,lo:6,hi:8}};')}
    /* A first landing: no storm, no wave-off, no gear. */
    const _waveOffs=new Map(); const _descWx=()=>null; const descentBonus=()=>0; const _equipBonus=()=>0;
    ${cut('function descentFor(pl){', 'biome:bio};\n}')}
    ${upTo('function rarityRoll(seed, salt){', '/* build a color-graded label')}
    ${cut('const GRADE_TIERS=[', '\n];')}
    ${cut('const TIER_MAX=', ';')}
    ${cut('const SPECTRA={', '\n};')}
    ${cut('function spectral(domain, seed, opts){', 'name:T.name};\n}')}
    function designation(P, bio){
      ${cut('  const lifey=/Abundant|Aquatic|flora|Sparse/i.test(bio.level);', ';')}
      ${cut("  const HUEMAP={ocean:'ocean',", 'force:P.seed===133?5:undefined});')}
      return desig;
    }
    ${cut('const DEPOSIT_PROFILES={', '\n};')}
    ${cut('const RARE_VEIN=[', ';')}
    ${cut('function depositsFor(seed, type, tier){', '  return picks;\n}')}
    ${cut('const BIOME_VEIN={', ';')}
    ${cut('function biomeVeinFor(seed){', 'catch(_){ return null; }\n}')}
    ${cut('const COSMIC_FOUND=[', ';')}
    ${cut('const COSMIC_BREAK=[', ';')}
    ${cut('function cosmicVeinFor(seed, tier){', 'return pool[(r()*pool.length)|0];\n}')}
    ${upTo('function exVeinFor(seed, type, tier){', 'function exTierOf(k){')}
    ${cut('function reserveFor(seed, tier){', '(1+(tier||0)*0.35));\n}')}
    ${cut('const MOON_TYPES=[', '\n];')}
    ${cut('function roman(n){', 'return s;\n}')}
    ${cut('const SOL_MOONS={', '\n};')}
    ${cut('function moonDescriptor(pl, m){', "logId:'m'+seed, badge};\n}")}
    return { _systemFor, survey, biomeFor, descentFor, designation, depositsFor, biomeVeinFor, cosmicVeinFor, exVeinFor, reserveFor, moonDescriptor };
  `);
  const st = { sys: null, gal: undefined, planet: null };
  const game = legacy(st, () => null);
  let last = null;
  return {
    system: (starSeed) => {
      if (last === null || last.starSeed !== starSeed) last = { starSeed, system: game._systemFor(starSeed) };
      return last.system;
    },
    survey: (planet, system) => {
      const { band, bio, civ } = game.survey(planet.P, system, planet);
      return { band, life: bio, civ };
    },
    biome: (planet, band) => {
      const biome = game.biomeFor(planet.P, band);
      return biome ? biome.k : null;
    },
    descent: (planet, system) => {
      st.sys = system;
      const odds = game.descentFor(planet);
      return { percent: odds.pct, damageMin: odds.lo, damageMax: odds.hi };
    },
    veins: (planet, system, survey) => {
      // As mineWorld reads them (21425-21436): the tier is the card's designation's, the list the planet type's.
      st.sys = system;
      const seed = planet.P.seed;
      const tier = game.designation(planet.P, survey.life).tier;
      return {
        tier,
        deposits: game.depositsFor(seed, planet.P.type || 'rocky', tier),
        biomeVein: game.biomeVeinFor(seed),
        cosmicVein: game.cosmicVeinFor(seed, tier),
        exceptionalVein: game.exVeinFor(seed, planet.P.type || 'rocky', tier),
        reserve: game.reserveFor(seed, tier),
      };
    },
    moon: (planet, index) => {
      const card = game.moonDescriptor(planet, index);
      return { type: String(card.sub), name: card.title };
    },
  };
}

/* ---- the tables ---- */

const percent = (part, whole) => (whole === 0 ? 'n/a' : `${((100 * part) / whole).toFixed(2)}%`);

function table(title, rows) {
  const width = Math.max(...rows.map(([name]) => name.length));
  console.log(`\n${title}`);
  for (const [name, count, share] of rows) console.log(`  ${name.padEnd(width)}  ${String(count).padStart(8)}  ${share ?? ''}`);
}

export function printShares(shares) {
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

/* ---- the run ---- */

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const name = argv[i].replace(/^--/, '');
    if (name === 'record') args.record = true;
    else args[name] = argv[++i];
  }
  return args;
}

const seconds = (from) => `${(Number(process.hrtime.bigint() - from) / 1e9).toFixed(2)}s`;

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

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  const planets = Number(args.planets ?? RECORDED_PLANETS);
  if (!Number.isInteger(planets) || planets < 1 || (args.record && !args.ref)) {
    console.error('usage: node tools/census.mjs [--planets <count>] [--ref <folder holding celestial-frontier.html> [--record]]');
    process.exit(2);
  }
  const { censusFingerprint, censusSystems } = await import('@cf/domain-worldkinds');
  // The same readers the gate's test reads through.
  const game = (await import('../tests/support/census.ts')).gameSources();

  let from = process.hrtime.bigint();
  const mine = censusFingerprint(game, planets);
  console.log(`census of this game: ${mine.planets} planets in ${mine.shares.systems} systems, ${seconds(from)}`);
  console.log(`fingerprint ${mine.total}`);
  printShares(mine.shares);

  // What the lines held, so an agreement is known not to be an agreement of blanks.
  const held = { life: {}, tier: {}, civilised: 0, wild: 0, biomeVein: 0, cosmicVein: 0, exceptionalVein: 0, rareVein: 0, landing: {} };
  const count = (counts, key) => { counts[key] = (counts[key] ?? 0) + 1; };
  for (const entry of censusSystems(game, planets)) for (const world of entry.worlds) {
    count(held.life, world.survey.life.key);
    count(held.tier, world.veins.tier);
    count(held.landing, world.descent.percent);
    if (world.survey.civ.civ) held.civilised++;
    if (world.survey.civ.wild) held.wild++;
    if (world.veins.biomeVein) held.biomeVein++;
    if (world.veins.cosmicVein) held.cosmicVein++;
    if (world.veins.exceptionalVein) held.exceptionalVein++;
    if (world.veins.deposits.some((symbol) => ['Ag', 'Au', 'Pt', 'Ir', 'U', 'Nd', 'Pm', 'Vg', 'Pz'].includes(symbol))) held.rareVein++;
  }
  const byKey = (counts) => Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k, n]) => [k, n, percent(n, mine.planets)]);
  table('Life (of planets)', byKey(held.life));
  table('Tier, with no depth and no ring cap (of planets)', Object.entries(held.tier).sort((a, b) => a[0] - b[0]).map(([k, n]) => [`tier ${k}`, n, percent(n, mine.planets)]));
  table('First-landing odds (of planets)', Object.entries(held.landing).sort((a, b) => b[0] - a[0]).map(([k, n]) => [`${k}%`, n, percent(n, mine.planets)]));
  table('Worlds holding', [
    ['a civilisation', held.civilised, percent(held.civilised, mine.planets)],
    ['a wilderness note', held.wild, percent(held.wild, mine.planets)],
    ['a rare-vein symbol in the deposits', held.rareVein, percent(held.rareVein, mine.planets)],
    ['a biome vein', held.biomeVein, percent(held.biomeVein, mine.planets)],
    ['an exceptional vein', held.exceptionalVein, percent(held.exceptionalVein, mine.planets)],
    ['a cosmic vein', held.cosmicVein, percent(held.cosmicVein, mine.planets)],
  ]);

  if (args.ref) {
    const htmlBytes = readFileSync(join(resolve(args.ref), GAME_HTML));
    const legacy = legacyCensusSources(extractTrackedV1Script(htmlBytes.toString('utf8')));
    from = process.hrtime.bigint();
    const theirs = censusFingerprint(legacy, planets);
    console.log(`\ncensus of the legacy game: ${theirs.planets} planets in ${theirs.shares.systems} systems, ${seconds(from)}`);
    console.log(`fingerprint ${theirs.total}`);

    // Line by line, so a disagreement names its worlds and fields.
    const walk = censusSystems(legacy, planets);
    let lines = 0;
    let differing = 0;
    const fields = new Map();
    for (const entry of censusSystems(game, planets)) {
      const other = walk.next().value;
      const pairs = [[entry.row, other.row, `star ${entry.starSeed}`], ...entry.worlds.map((world, i) => [world.row, other.worlds[i]?.row ?? '', `star ${entry.starSeed} planet ${world.ordinal} (seed ${world.planet.P.seed})`])];
      for (const [a, b, where] of pairs) {
        lines++;
        if (a === b) continue;
        differing++;
        const names = differingFields(a, b);
        for (const name of names) fields.set(name.slice(0, name.indexOf(':')), (fields.get(name.slice(0, name.indexOf(':'))) ?? 0) + 1);
        if (differing <= 40) console.log(`DIFFERS ${where}\n  ${names.join('\n  ')}`);
      }
    }
    console.log(`\n${lines} lines compared, ${differing} differ`);
    for (const [field, count] of fields) console.log(`  ${field}: ${count} lines`);
    if (differing > 0 || mine.total !== theirs.total) {
      console.error('this game and the legacy game DISAGREE');
      process.exit(1);
    }
    console.log('this game and the legacy game agree on every line');

    if (args.record) {
      if (planets !== RECORDED_PLANETS) {
        console.error(`the fixture is recorded at ${RECORDED_PLANETS} planets`);
        process.exit(2);
      }
      const gate = censusFingerprint(legacy, GATE_PLANETS);
      const sha = createHash('sha256').update(htmlBytes).digest('hex');
      const fixture = {
        schema: 'cf-census/v1',
        source: `${GAME_HTML} sha256:${sha} bytes:${htmlBytes.length}`,
        taken: 'censusFingerprint (packages/domain/worldkinds/src/census.ts) read through the legacy game\'s own functions, cut from its script by tools/census.mjs legacyCensusSources and run with new Function: mulberry32, hashInt, clamp, TAU, SYL, properName, the WorldConfig constants, starClass, SOL_PLANETS, planetParams, genRocks, _systemFor, climateBand, biosphere, ERAS, civilization, the first statements of planetDescriptor (the survey stream, band, biosphere, civilization), BIOME_SETS, biomeFor, descentTierFromPct, DESCENT_TIERS, descentFor, rarityRoll, GRADE_TIERS, TIER_MAX, SPECTRA, spectral, the designation statements of planetDescriptor, DEPOSIT_PROFILES, RARE_VEIN, depositsFor, BIOME_VEIN, biomeVeinFor, COSMIC_FOUND, COSMIC_BREAK, cosmicVeinFor, exVeinFor, reserveFor, MOON_TYPES, roman, SOL_MOONS, moonDescriptor. Supplied by the recorder: st ({sys: the system being read, gal: undefined, so no depth boost and no ring cap}), moonThumb (returns null), and for a first landing _waveOffs (empty), _descWx (no storm), descentBonus and _equipBonus (0). Worlds: Sol, then systems hashInt(0xCE5, i, 0), until the count is reached.',
        full: { planets: theirs.planets, total: theirs.total, shares: theirs.shares },
        gate: { planets: gate.planets, total: gate.total, shares: gate.shares },
        perThousand: theirs.perThousand,
      };
      const { perThousand, ...head } = fixture;
      const text = ['{', ...Object.entries(head).map(([key, value]) => ` ${JSON.stringify(key)}: ${JSON.stringify(value)},`),
        ' "perThousand": [', ...perThousand.map((digest, i) => `  ${JSON.stringify(digest)}${i < perThousand.length - 1 ? ',' : ''}`), ' ]', '}', ''].join('\n');
      writeFileSync(FIXTURE, text);
      console.log(`recorded fixtures/current/census-v1.json: ${theirs.planets} planets, ${perThousand.length} digests`);
    }
  }
}
