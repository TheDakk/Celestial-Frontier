// The legacy game's own functions as the census's readers, for tools/census.mjs. Every reader is text cut from the
// legacy script (LEGACY celestial-frontier.html, 1.8.9) and run under new Function; each cut starts at text that
// occurs once. Nothing here is this game's code. This file is used by hand-run tools only; no test imports it.

/** What the recorder supplies in place of the legacy page, written into each fixture. */
export const LEGACY_STAND_INS = 'Supplied by the recorder: st ({sys: the system being read; gal: unset for a seeded world, so no depth boost and no ring cap, and the galaxy of the address for an addressed world}), moonThumb (returns null), and for a first landing _waveOffs (empty), _descWx (no storm), descentBonus and _equipBonus (0).';

export const LEGACY_SLICES = 'mulberry32, hashInt, clamp, TAU, SYL, properName, the WorldConfig constants, starClass, SOL_PLANETS, planetParams, genRocks, _systemFor, climateBand, biosphere, ERAS, civilization, the first statements of planetDescriptor (the survey stream, band, biosphere, civilization), its civilisation rows, its designation statements and its epithet statements, BIOME_SETS, biomeFor, biomeComposition, descentTierFromPct, DESCENT_TIERS, descentFor, rarityRoll, GRADE_TIERS, TIER_MAX, SPECTRA, spectral, REGIONS, regionAt, RING_SPECTRUM, ASC_RING_R, gradeCapAt, _specDomOf, _clampSpectral, ringDesignation, DEPOSIT_PROFILES, RARE_VEIN, depositsFor, BIOME_VEIN, biomeVeinFor, COSMIC_FOUND, COSMIC_BREAK, cosmicVeinFor, exVeinFor, reserveFor, MOON_TYPES, roman, SOL_MOONS, moonDescriptor';

/** The legacy game, cut and run. `st` is the page state its functions read. */
export function legacyGame(script) {
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
  const build = new Function('st', 'moonThumb', `
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
    ${cut('function biosphere(P, sys, band, r){', 'key:level};\n}')}
    ${cut('const ERAS=[', '\n];')}
    ${cut('function civilization(P, sys, band, bio, r){', 'pop:pop};\n}')}
    function survey(P, sys, pl){
      ${upTo('  const r=mulberry32((P.seed^0x1234567)>>>0);\n  const orb = pl?pl.orb:120;', '  /* publish the card')}
      return {band, bio, civ};
    }
    ${cut('const BIOME_SETS={', 'return comp[comp.length-1].biome;\n}')}
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
    ${cut('const REGIONS=[', '\n];')}
    ${cut('function regionAt(x,y){', 'return REGIONS.length-1; }')}
    ${cut('const RING_SPECTRUM=[', '\n];')}
    ${cut('const ASC_RING_R=', ';')}
    ${cut('function gradeCapAt(where){', 'catch(_){ return TIER_MAX; }\n}')}
    ${cut('function _specDomOf(desig){', '  return null;\n}')}
    ${upTo('function _clampSpectral(desig, cap){', 'function ringDesignation(d){')}
    ${upTo('function ringDesignation(d){', '/* v1.5.2c THE CRADLE ROSTER')}
    /* The card's statements that follow the species rows (5133-5191): the civilisation rows, the designation and
       the epithet, with the Life row (5099) before them. */
    function card(P, pl, bio, civ){
      const rows=[['Life', bio.level, 'bio']];
      ${cut('  let civBadge=null;', "'civ']);\n  }")}
      ${cut('  const lifey=/Abundant|Aquatic|flora|Sparse/i.test(bio.level);', ';')}
      ${cut("  const HUEMAP={ocean:'ocean',", 'force:P.seed===133?5:undefined});')}
      ${cut("  let _epi='';", "_epi=' — '+_l[(_er()*_l.length)|0]; }\n  }")}
      return {rows, desig, title:((pl&&pl.name)||'Planet')+_epi};
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
    return { _systemFor, survey, biomeFor, biomeComposition, descentFor, rarityRoll, card, ringDesignation, regionAt, gradeCapAt,
      depositsFor, biomeVeinFor, cosmicVeinFor, exVeinFor, reserveFor, moonDescriptor,
      DEPOSIT_PROFILES, RARE_VEIN, BIOME_VEIN, COSMIC_FOUND, COSMIC_BREAK, BIOME_SETS, TIER_MAX };
  `);
  const st = { sys: null, gal: undefined, planet: null };
  return { st, game: build(st, () => null) };
}

/** The tier a world's veins are worked out at, as mineWorld reads it (21425): the card's designation, clamped by
    where the world lives (ringDesignation 14733). `where` unset: a seeded world, no depth and no cap. */
function designationOf(legacy, planet, life, civ, where) {
  const { st, game } = legacy;
  st.gal = where ? where.gal : undefined;
  const raw = game.card(planet.P, planet, life, civ).desig;
  st.gal = undefined;
  const ringed = where ? game.ringDesignation({ designation: raw, where }).designation : raw;
  return { rawTier: raw.tier, tier: ringed.tier };
}

/** The legacy game's readers. `placeOf(starSeed)` gives the galaxy and star of an addressed star, or nothing for a
    seeded one; an addressed world also gives the facts its card and its descent hold (`extras`). */
export function legacyCensusSources(script, placeOf = () => undefined) {
  const legacy = legacyGame(script);
  const { st, game } = legacy;
  let last = null;
  const starOf = new WeakMap();
  const read = new WeakMap();
  const whereOf = (system) => {
    const place = placeOf(starOf.get(system));
    return place ? { gal: place.galaxy, star: place.star } : undefined;
  };
  const sources = {
    system: (starSeed) => {
      if (last === null || last.starSeed !== starSeed) {
        last = { starSeed, system: game._systemFor(starSeed) };
        starOf.set(last.system, starSeed);
      }
      return last.system;
    },
    survey: (planet, system) => {
      const { band, bio, civ } = game.survey(planet.P, system, planet);
      read.set(planet, { bio, civ });
      // An addressed world's civilisation is read from its card rows (extras), as this game's is.
      return { band, life: bio, civ: whereOf(system) ? { civ: civ.civ === true } : civ };
    },
    biome: (planet, band) => {
      const biome = game.biomeFor(planet.P, band);
      return biome ? biome.k : null;
    },
    mix: (planet, band) => {
      const mix = game.biomeComposition(planet.P, band);
      return mix === null ? null : mix.map(({ biome, pct }) => [biome.k, pct]);
    },
    descent: (planet, system) => {
      st.sys = system;
      const odds = game.descentFor(planet);
      return { percent: odds.pct, damageMin: odds.lo, damageMax: odds.hi };
    },
    rarity: (planet) => game.rarityRoll(planet.P.seed, 3),
    veins: (planet, system, survey) => {
      // As mineWorld reads them (21425-21436): the tier is the card's designation's, the list the planet type's.
      st.sys = system;
      const seed = planet.P.seed;
      const { rawTier, tier } = designationOf(legacy, planet, survey.life, read.get(planet).civ, whereOf(system));
      return {
        rawTier,
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
    extras: (planet, system, survey) => {
      if (!whereOf(system)) return [];
      st.sys = system;
      st.gal = undefined;
      const { bio, civ } = read.get(planet);
      const card = game.card(planet.P, planet, bio, civ);
      const biome = game.descentFor(planet).biome;
      const key = biome ? biome.k : null;
      return [
        ['type', planet.P.type], ['orbit', planet.orb],
        ['descentBiome', key], ['rosterBiome', key], ['rosterLife', bio.key], ['rosterBand', survey.band],
        ['card', card.rows.map((row) => [row[0], row[1]])], ['title', card.title],
        ['spectral', [card.desig.tier, card.desig.label, card.desig.name]],
      ];
    },
  };
  return sources;
}

/** Every literal first salt of a hashInt call in the legacy script, in ascending order. */
export function legacyFirstSalts(script) {
  const salts = new Set();
  for (const match of script.matchAll(/hashInt\([^,;]+,\s*(0x[0-9A-Fa-f]+)/g)) salts.add(Number(match[1]));
  return [...salts].sort((a, b) => a - b);
}
