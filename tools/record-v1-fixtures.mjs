// Records answers from the v1 game file for the tests that read that file live in the current game.
// Usage: node tools/record-v1-fixtures.mjs --ref <folder holding celestial-frontier.html> [--only <name>]
// Writes fixtures/v1/recorded/<name>.json, one per test, named after the test. The path is not
// written to any output.
// Each recorder takes from v1 exactly what its test takes, located the way its test locates it, and
// evaluates v1 code the way its test does. This tool is run by hand; no test imports it.
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

const GAME_HTML = 'celestial-frontier.html';

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const occurrences = (text, needle) => text.split(needle).length - 1;

/** The unique inline script, byte for byte, as the current game's test-support/tracked-v1-source.ts extracts it. */
export function extractTrackedV1Script(html) {
  const open = '<script>';
  const close = '</script>';
  const openCount = occurrences(html, open);
  const closeCount = occurrences(html, close);
  if (openCount !== 1 || closeCount !== 1) {
    throw new Error(`tracked game HTML must contain exactly one literal script body (open=${openCount}, close=${closeCount})`);
  }
  const start = html.indexOf(open) + open.length;
  const end = html.indexOf(close, start);
  if (end < start) throw new Error('tracked game HTML script boundaries are reversed');
  const script = html.slice(start, end);
  if (script.trim().length === 0) throw new Error('tracked game HTML script body is empty');
  return script;
}

/* ---- sessionrng: the lexical Math.random census, transcribed from sessionrng.test.ts ---- */

/** Mask comments, quoted strings and template text without changing offsets or newlines. */
function maskCommentsAndStrings(source) {
  const masked = source.split('');
  const frames = [{ kind: 'code', templateBraceDepth: null }];
  const hide = (index) => {
    if (masked[index] !== '\n' && masked[index] !== '\r') masked[index] = ' ';
  };
  for (let index = 0; index < source.length; index++) {
    const frame = frames[frames.length - 1];
    const char = source[index];
    const next = source[index + 1];
    if (frame.kind === 'line-comment') {
      if (char === '\n' || char === '\r') frames.pop();
      else hide(index);
      continue;
    }
    if (frame.kind === 'block-comment') {
      hide(index);
      if (char === '*' && next === '/') {
        hide(index + 1);
        index++;
        frames.pop();
      }
      continue;
    }
    if (frame.kind === 'single' || frame.kind === 'double') {
      hide(index);
      if (char === '\\') {
        if (next !== undefined) hide(++index);
      } else if ((frame.kind === 'single' && char === "'") || (frame.kind === 'double' && char === '"')) {
        frames.pop();
      }
      continue;
    }
    if (frame.kind === 'template') {
      hide(index);
      if (char === '\\') {
        if (next !== undefined) hide(++index);
      } else if (char === '`') {
        frames.pop();
      } else if (char === '$' && next === '{') {
        hide(++index);
        frames.push({ kind: 'code', templateBraceDepth: 1 });
      }
      continue;
    }
    if (frame.kind !== 'code') throw new Error(`unhandled lexical frame ${frame.kind}`);

    if (char === '/' && next === '/') {
      hide(index); hide(++index);
      frames.push({ kind: 'line-comment' });
    } else if (char === '/' && next === '*') {
      hide(index); hide(++index);
      frames.push({ kind: 'block-comment' });
    } else if (char === "'") {
      hide(index);
      frames.push({ kind: 'single' });
    } else if (char === '"') {
      hide(index);
      frames.push({ kind: 'double' });
    } else if (char === '`') {
      hide(index);
      frames.push({ kind: 'template' });
    } else if (frame.templateBraceDepth !== null && char === '{') {
      frame.templateBraceDepth++;
    } else if (frame.templateBraceDepth !== null && char === '}') {
      frame.templateBraceDepth--;
      if (frame.templateBraceDepth === 0) {
        hide(index);
        frames.pop();
      }
    }
  }
  return masked.join('');
}

/** Every executable `Math.random(` with its 1-based line, its occurrence on that line and the trimmed line. */
export function scanExecutableMathRandom(source) {
  const executable = maskCommentsAndStrings(source);
  const starts = [...executable.matchAll(/\bMath\s*\.\s*random\s*\(/g)].map(({ index }) => index);
  const sourceLines = source.split(/\r?\n/);
  const seen = new Map();
  return starts.map((start) => {
    const legacyLine = executable.slice(0, start).split('\n').length;
    const occurrenceOnLine = (seen.get(legacyLine) ?? 0) + 1;
    seen.set(legacyLine, occurrenceOnLine);
    return { legacyLine, occurrenceOnLine, sourceLine: (sourceLines[legacyLine - 1] ?? '').trim() };
  });
}

/* ---- the recorders ---- */

/** One slice from `start` (which must occur once) to the end of the first `end` after it, as companion-care.test.ts cuts. */
function cutUnique(text, start, end) {
  const i = text.indexOf(start);
  if (i < 0) throw new Error(`v1 script has no ${start}`);
  if (text.indexOf(start, i + 1) !== -1) throw new Error(`${start} is not unique in the v1 script`);
  const j = text.indexOf(end, i);
  if (j < 0) throw new Error(`v1 script has no ${end} after ${start}`);
  return text.slice(i, j + end.length);
}

/* ---- the v1 capture: Tame, Scavenge, Sample and the Yield pool ---- */

/** Runs the v1 capture rules over species the cases describe as {seed, kingdom, tier}. */
function recordLegacyCapture(script) {
  const v1 = new Function('Math', 'describeSpecies', 'ringGrade', 'regionAt', '_equipBonus', 'discoverSpecies', 'gameEvent', 'toast', 'queueSave', `
    const codex=new Map(); let COSMIC_EPOCH=0, _panelKey=null;
    const HOME_GAL_SEED=999; const SOL_POS={x:560,y:170}; const GR=1200; const ASC_RING_R=GR*0.25;
    ${cutUnique(script, 'function clamp(v,a,b){', '}')}
    ${cutUnique(script, 'function mulberry32(a){', '/4294967296}}')}
    ${cutUnique(script, 'function hashInt(seed,x,y){', 'return h>>>0;\n}')}
    ${cutUnique(script, 'function codexId(g){', '}')}
    ${cutUnique(script, 'const TAME_ODDS=[', '];')}
    ${cutUnique(script, 'function _captureRing(where){', 'catch(_){ return 0; }\n}')}
    ${cutUnique(script, 'function captureOdds(g, d, kind){', 'return clamp(base + gear, 0.02, 0.95);\n}')}
    ${cutUnique(script, 'function _captureKind(kind){', "pressed into your Compendium.'};\n}")}
    ${cutUnique(script, 'const bioX=new Map();', ';')}
    ${cutUnique(script, 'function bioPool(d){', '3, 16);\n}')}
    ${cutUnique(script, 'function _bioUsed(seed){', 'return e?e[0]:0;\n}')}
    ${cutUnique(script, 'function bioLeft(d){', '}')}
    ${cutUnique(script, 'function tryCapture(d, kind){', "the biosphere is worked out.'));\n  }\n}")}
    return {
      captureOdds, _captureRing, bioPool, _bioUsed, bioLeft, tryCapture, _captureKind,
      set(o){ codex.clear(); for(const id of o.codex||[]) codex.set(id, {id}); bioX.clear(); for(const [seed, row] of o.bioX||[]) bioX.set(seed, [...row]); COSMIC_EPOCH=o.epoch||0; },
      catalogue(g){ codex.set(codexId(g), {id:codexId(g)}); },
      epoch(n){ COSMIC_EPOCH=n; },
      bioX(seed){ const row=bioX.get(seed); return row?[...row]:null; },
    };`);
  let randoms = [];
  let region = 0;
  let contact = 0;
  let caught = null;
  let events = [];
  let toasted = null;
  const math = Object.create(Math);
  math.random = () => {
    if (randoms.length === 0) throw new Error('a random value was drawn that the case did not supply');
    return randoms.shift();
  };
  let game = null;
  game = v1(math,
    (g) => ({ name: `Species ${g.seed}`, grade: { tier: g.tier } }),
    (g, grade) => grade,
    () => region,
    (key) => (key === 'contact' ? contact : 0),
    (g) => { caught = g.seed; game.catalogue(g); },
    (type) => { events.push(type); },
    (title, text) => { toasted = [title, text]; },
    () => {});
  const HOME = { seed: 999, x: 90, y: -60 };
  const WHERE = {
    // ring 0: the home galaxy, within the Neighborhood of Sol; ring 1: the home galaxy beyond it;
    // rings 2 to 5: another galaxy, in the region the recorder supplies (regionAt is the recorder's).
    0: { gal: HOME, star: { x: 560, y: 170 } },
    1: { gal: HOME, star: { x: 560 + 301, y: 170 } },
    2: { gal: { seed: 5, x: 1, y: 1 } }, 3: { gal: { seed: 5, x: 1, y: 1 } }, 4: { gal: { seed: 5, x: 1, y: 1 } }, 5: { gal: { seed: 5, x: 1, y: 1 } },
  };
  const where = (ring) => { region = Math.max(0, ring - 2); return WHERE[ring]; };
  const cases = [];

  // odds: captureOdds for every verb, tier 0 to 16 (the table has 15 rows), ring 0 to 5, and worn contact points.
  for (const kind of ['tame', 'scavenge', 'sample']) for (let tier = 0; tier <= 16; tier++) for (let ring = 0; ring <= 5; ring++) for (const points of [0, 1, 5, 16, 17, 40]) {
    contact = points;
    cases.push({ group: 'odds', input: { kind, tier, ring, contact: points }, output: game.captureOdds({ seed: 1, tier }, { where: where(ring) }, kind) });
  }
  contact = 0;
  // ring: _captureRing on and beside the Neighborhood's edge, with no place, and in each outer region (a region
  // outside 0..3 is held to it).
  for (const [name, place] of [
    ['none', null], ['no-galaxy', {}], ['sol', WHERE[0]], ['edge', { gal: HOME, star: { x: 560 + 300, y: 170 } }],
    ['beyond', { gal: HOME, star: { x: 560 + 300.001, y: 170 } }], ['home-no-star', { gal: HOME }],
  ]) cases.push({ group: 'ring', input: { name }, output: game._captureRing(place) });
  for (const r of [-1, 0, 1, 2, 3, 4]) { region = r; cases.push({ group: 'ring', input: { name: 'region', region: r }, output: game._captureRing(WHERE[2]) }); }

  // pool: bioPool for 200 world seeds and every species count from 0 to 19.
  for (let seed = 131; seed < 331; seed++) {
    const output = [];
    for (let count = 0; count <= 19; count++) output.push(game.bioPool({ planetSeed: seed, species: Array.from({ length: count }, (_, i) => ({ seed: i })) }));
    cases.push({ group: 'pool', input: { seed }, output });
  }
  // used: _bioUsed and bioLeft for a stored row [used, stamp] read at an epoch; output is [used, left, the row after].
  for (const [used, stamp, epoch] of [[0, 0, 0], [3, 0, 0], [3, 0, 1], [3, 2, 2], [3, 2, 5], [3, 5, 2], [20, 0, 0], [null, 0, 4]]) {
    game.set({ bioX: used === null ? [] : [[133, [used, stamp]]], epoch });
    const d = { planetSeed: 133, species: Array.from({ length: 19 }, (_, i) => ({ seed: i })) };
    cases.push({ group: 'used', input: { used, stamp, epoch, species: 19 }, output: [game._bioUsed(133), game.bioLeft(d), game.bioX(133)] });
  }

  /** One press of tryCapture; the output is [caught species seed or null, bioX row after or null, toast or null,
      events said, random values left unread]. */
  const press = (d, kind, values) => {
    randoms = [...values]; caught = null; events = []; toasted = null;
    game.tryCapture(d, kind);
    return [caught, game.bioX(d.planetSeed), toasted, events, randoms.length];
  };
  // Earth's roster by kingdom, in its order (6 flora, 2 fungi, 3 microbes, 8 fauna), every tier 0.
  const EARTH = ['flora', 'flora', 'flora', 'flora', 'flora', 'flora', 'fungi', 'fungi', 'microbe', 'microbe', 'microbe', 'fauna', 'fauna', 'fauna', 'fauna', 'fauna', 'fauna', 'fauna', 'fauna'];
  const roster = (kingdoms, tier = 0) => kingdoms.map((kingdom, i) => ({ seed: 1000 + i, kingdom, tier }));
  const world = (species) => ({ planetSeed: 133, species, planetName: 'Earth', where: WHERE[0] });
  // press: one press on Earth's roster, for each verb, with part of the roster already in the Compendium, a
  // pick value across the pool and a success value that always hits (0) or always misses (0.999).
  const KNOWN = [[], [11], [11, 12, 13], [0, 1, 6], [8], [11, 12, 13, 14, 15, 16, 17], [11, 12, 13, 14, 15, 16, 17, 18], [0, 1, 2, 3, 4, 5, 6, 7], [8, 9, 10]];
  for (const kind of ['fauna', 'flora', 'microbe']) for (const known of KNOWN) for (const pick of [0, 0.124, 0.125, 0.34, 0.5, 0.75, 0.999]) for (const success of [0, 0.999]) {
    const species = roster(EARTH);
    game.set({ codex: known.map((i) => 's' + species[i].seed), bioX: [], epoch: 0 });
    cases.push({ group: 'press', input: { kind, kingdoms: EARTH, known, used: 0, pick, success }, output: press(world(species), kind, [pick, success]) });
  }
  // worked-out: the pool's last attempt, and a press on a spent world; a press with every species known on a spent world.
  for (const kind of ['fauna', 'flora', 'microbe']) {
    const species = roster(EARTH);
    const size = game.bioPool(world(species));
    for (const [used, known] of [[size - 1, []], [size, []], [size + 2, []], [size, species.map((_, i) => i)], [size - 2, []]]) for (const success of [0, 0.999]) {
      game.set({ codex: known.map((i) => 's' + species[i].seed), bioX: [[133, [used, 0]]], epoch: 0 });
      cases.push({ group: 'worked-out', input: { kind, kingdoms: EARTH, known, used, pool: size, pick: 0.5, success }, output: press(world(species), kind, [0.5, success]) });
    }
  }
  // edge: the success value on and beside the odds, for one species of each tier. Output is [odds, caught or null].
  for (const kind of ['fauna', 'flora', 'microbe']) for (const tier of [0, 1, 4, 9, 14]) {
    const verb = { fauna: 'tame', flora: 'scavenge', microbe: 'sample' }[kind];
    const species = [{ seed: 7, kingdom: kind, tier }];
    const odds = game.captureOdds(species[0], world(species), verb);
    for (const success of [odds - 1e-9, odds, odds + 1e-9]) {
      game.set({ codex: [], bioX: [], epoch: 0 });
      cases.push({ group: 'edge', input: { kind, tier, success }, output: [odds, press(world(species), kind, [0, success])[0]] });
    }
  }
  // chain: presses one after another on one world, the Compendium and the pool carried from each to the next.
  // `turn` raises the epoch before the press. Output per press as in `press`.
  const CHAINS = [
    { kinds: ['fauna', 'fauna', 'fauna', 'flora', 'microbe', 'fauna', 'fauna', 'fauna', 'fauna', 'fauna', 'fauna', 'fauna'], values: [[0, 0], [0, 0], [0.999, 0.999], [0.5, 0], [0, 0], [0.999, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]], turn: [] },
    { kinds: ['microbe', 'microbe', 'microbe', 'microbe', 'flora', 'flora'], values: [[0.9, 0], [0.9, 0], [0.9, 0], [0, 0], [0.99, 0.999], [0.99, 0]], turn: [4] },
  ];
  for (const chain of CHAINS) {
    const species = roster(EARTH);
    game.set({ codex: [], bioX: [], epoch: 0 });
    let epoch = 0;
    const output = chain.kinds.map((kind, step) => {
      if (chain.turn.includes(step)) game.epoch(++epoch);
      return press(world(species), kind, chain.values[step]);
    });
    cases.push({ group: 'chain', input: { kingdoms: EARTH, ...chain }, output });
  }
  return cases;
}

/* ---- the v1 field care: the biosphere scan, its hazard, the Field Scout and the Fifty Paragons ---- */

/** One v1 module, from its opening to the line that hands out its names. */
const cutModule = (script, name) => cutUnique(script, `const ${name}=(()=>{`, `}=${name};`);

/** Runs the v1 biosphere scan (the press, its hazard and what it writes), the scout's lesson at a capture and the
    walk to each Paragon's home world. */
function recordLegacyCare(script) {
  const cases = [];

  // paragon-site: paragonWhere(i) for the Fifty, over the v1 universe itself.
  const sites = new Function('Math', `
    ${['Rand', 'PlanetGen', 'WorldConfig'].map((name) => cutModule(script, name)).join('\n')}
    ${cutUnique(script, 'const GAL_SPRITE_SEEDS=[', '];')}
    const GAL_SPRITES=GAL_SPRITE_SEEDS;
    ${['Naming', 'StarCatalog', 'WorldGen'].map((name) => cutModule(script, name)).join('\n')}
    ${cutUnique(script, 'function slimGal(g){', 'dwarf:g.dwarf||false};\n}')}
    const _parWhere=new Map();
    ${cutUnique(script, 'function paragonWhere(i){', '_parWhere.set(i, out);\n  return out;\n}')}
    return paragonWhere;`)(Math);
  for (let index = 0; index < 50; index++) cases.push({ group: 'paragon-site', input: { index }, output: sites(index) });

  const v1 = new Function('Math', 'battleStats', 'regionAt', '_equipBonus', 'document', 'setTimeout', 'note', `
    const HOME_GAL_SEED=999; const TIER_MAX=14;
    const codex=new Map(), conquered=new Set(), surveyedSet=new Set(), techOwned=new Set(), unlocked=new Set(), _parSites=new Map();
    const stats={surveys:0}; let scoutId=null, hp=100, essence=0;
    let _spExpanded=null, _lifeExpanded=null, _panelKey=null, codexOpen=false, _lastDesc=null;
    const toast=(title, text)=>note('toast', [title, text]);
    const unlock=(id)=>{ if(!unlocked.has(id)){ unlocked.add(id); note('unlock', id); } };
    const gameEvent=(type)=>note('event', type);
    const checkAch=()=>{}, renderRank=()=>{}, queueSave=()=>{}, renderHP=()=>{}, renderCodex=()=>{}, playFailTone=()=>{}, fxShake=()=>{}, fxBurst=()=>{};
    const playRaritySting=()=>{}, cinematic=()=>{}, flashCodex=()=>{}, FX_GOLD=[];
    const showDeath=(why)=>note('death', why);
    const removeFromCodex=(id)=>{ codex.delete(id); note('removed', id); };
    const paragonGenome=(i)=>({seed:9000+i, kingdom:'fauna'});
    const crossGenome=(a)=>({seed:(a.seed+500000), kingdom:a.kingdom, parents:1});
    const _storeSpecies=(g, from, where)=>{ const id=codexId(g); if(codex.has(id)) return null;
      const entry={id, name:'Species '+g.seed, kind:g.kingdom==='fauna'?'Fauna':'Flora', genome:g, from, where:where||null, grade:g.tier==null?null:{tier:g.tier, name:'Grade '+g.tier, hex:'#fff'}};
      codex.set(id, entry); note('stored', [id, from]); return entry; };
    ${cutUnique(script, 'function clamp(v,a,b){', '}')}
    ${cutUnique(script, 'function mulberry32(a){', '/4294967296}}')}
    ${cutUnique(script, 'function codexId(g){', '}')}
    ${cutUnique(script, 'function levelOf(g){', '}')}
    ${cutUnique(script, 'function creatureCondition(g){', "col:'#ff5a4a'};\n}")}
    ${cutUnique(script, 'function hazardFlavor(d, foe){', "('Mid-scan, '+env+'.');\n}")}
    ${cutUnique(script, 'const DEPTH_TAX=[', '];')}
    ${cutUnique(script, 'function depthTax(where){', 'catch(_){ return 1; }\n}')}
    ${cutUnique(script, 'function dangerOf(d){', 'return {pct, dmg, top};\n}')}
    ${cutUnique(script, 'function damageExplorer(amount, why){', 'return false;\n}')}
    ${cutUnique(script, 'function routeHit(dmg, why){', 'return dead;\n}')}
    ${cutUnique(script, 'function awardXP(id, n, why){', 'queueSave();\n}')}
    ${cutUnique(script, 'function autoScanWorld(d){', '  if(codexOpen) renderCodex();\n}')}
    ${cutUnique(script, 'function discoverSpecies(g, from, where){', '  if(codexOpen) renderCodex();\n}')}
    function pressScan(e){
    ${cutUnique(script, "  const scan=e.target.closest('[data-scanlife]');", '    _panelKey=null;\n    return;\n  }')}
    }
    return {
      dangerOf, hazardFlavor, creatureCondition, routeHit, awardXP, autoScanWorld, discoverSpecies, levelOf,
      pressScan(d){ _lastDesc=d; pressScan({target:{closest:(q)=>q==='[data-scanlife]'}}); },
      set(o){ codex.clear(); for(const e of o.codex||[]) codex.set(e.id, {id:e.id, name:e.name||('Species '+e.id), kind:e.kind||'Fauna', genome:{...(e.genome||{})}});
        conquered.clear(); for(const s of o.conquered||[]) conquered.add(s); surveyedSet.clear(); for(const s of o.surveyed||[]) surveyedSet.add(s);
        techOwned.clear(); for(const t of o.tech||[]) techOwned.add(t); unlocked.clear(); _parSites.clear(); for(const [s,i] of o.sites||[]) _parSites.set(s,i);
        for(const k in stats) delete stats[k]; Object.assign(stats, {surveys:surveyedSet.size}, o.stats||{}); scoutId=o.scout||null; hp=o.hp==null?100:o.hp; essence=o.essence||0; },
      get(){ return { hp, scout:scoutId, surveyed:[...surveyedSet], stats:{...stats}, essence,
        genomes:[...codex.values()].map((e)=>[e.id, {...e.genome}]) }; },
    };`);
  let randoms = [];
  let region = 0;
  let suit = 0;
  let notes = [];
  const math = Object.create(Math);
  math.random = () => {
    if (randoms.length === 0) throw new Error('a random value was drawn that the case did not supply');
    return randoms.shift();
  };
  const game = v1(math,
    (g) => ({ total: g.power }),
    () => region,
    (key) => (key === 'scut' ? suit : 0),
    { getElementById: () => null },
    () => {},
    (kind, value) => { notes.push([kind, value]); });
  const HOME = { seed: 999, x: 90, y: -60 };
  const FAR = { seed: 5, x: 1, y: 1 };
  // place: 'home' is the home galaxy; a number is another galaxy in that region (regionAt is the recorder's).
  const where = (place) => { if (place === 'home') return { gal: HOME }; if (place === 'none') return null; region = place; return { gal: FAR }; };
  const fauna = (powers) => powers.map((power, i) => ({ seed: 2000 + i, kingdom: 'fauna', power }));
  const POWERS = [0, 100, 169, 170, 171, 200, 222, 300, 430, 431, 690, 691, 1200];
  const PLACES = ['home', 'none', 0, 1, 2, 3, 4, 5, 6];
  const TYPES = ['terran', 'ocean', 'lava', 'venus', 'ice', 'desert', 'gas', 'rocky', 'unknown'];

  // danger: dangerOf for the strongest beast's power, the world's type, whether it is conquered, and the place.
  for (const power of POWERS) for (const ptype of ['terran', 'lava', 'venus', 'ice']) for (const place of PLACES) for (const settled of [false, true]) {
    game.set({ conquered: settled ? [77] : [] });
    cases.push({ group: 'danger', input: { powers: [50, power, 120], ptype, place, settled }, output: game.dangerOf({ species: [...fauna([50, power, 120]), { seed: 1, kingdom: 'flora', power: 5000 }], ptype, planetSeed: 77, where: where(place) }) });
  }
  // danger-none: a world with no beast, and one with no species at all.
  game.set({});
  cases.push({ group: 'danger-none', input: { species: 'flora-only' }, output: game.dangerOf({ species: [{ seed: 1, kingdom: 'flora', power: 900 }], ptype: 'terran', planetSeed: 77, where: where('home') }) });
  cases.push({ group: 'danger-none', input: { species: 'none' }, output: game.dangerOf({ ptype: 'terran', planetSeed: 77, where: where('home') }) });
  // flavor: hazardFlavor per world type and random value.
  for (const ptype of TYPES) for (const value of [0, 0.2, 0.34, 0.5, 0.67, 0.999]) {
    randoms = [value];
    cases.push({ group: 'flavor', input: { ptype, value }, output: game.hazardFlavor({ ptype }, null) });
  }
  // condition: creatureCondition for a hurt value.
  for (const hurt of [null, 0, 0.049, 0.05, 0.12, 0.299, 0.3, 0.599, 0.6, 0.85, 0.95]) cases.push({ group: 'condition', input: { hurt }, output: game.creatureCondition(hurt === null ? {} : { hurt }) });

  const SCOUT = 's4000';
  const snap = () => { const now = game.get(); return { ...now, notes }; };
  // route: routeHit for a strike, the suit's cut, the explorer's health, and a Field Scout with a hurt (null: no scout).
  for (const dmg of [1, 5, 9, 10, 20, 47, 48, 49, 60, 100]) for (const cut of [0, 0.25, 0.7, 0.9]) for (const scoutHurt of [null, 0, 0.3, 0.4, 0.41, 0.6, 0.85, 0.88, 0.95]) for (const hp of [100, 21, 20, 1]) {
    if (scoutHurt !== null && hp !== 100) continue;
    suit = cut; notes = [];
    game.set({ hp, scout: scoutHurt === null ? null : SCOUT, codex: scoutHurt === null ? [] : [{ id: SCOUT, name: 'Scout', genome: scoutHurt === 0 ? {} : { hurt: scoutHurt } }] });
    const dead = game.routeHit(dmg, 'Mid-scan, a test.');
    cases.push({ group: 'route', input: { dmg, suit: cut, hp, scoutHurt }, output: { dead, ...snap() } });
  }
  suit = 0;
  // route-other: a scout that is not a beast, and a scout no longer in the Compendium, do not take the strike.
  for (const [name, codex] of [['flora-scout', [{ id: SCOUT, kind: 'Flora', genome: {} }]], ['gone-scout', []]]) {
    notes = []; game.set({ hp: 100, scout: SCOUT, codex });
    const dead = game.routeHit(20, 'Mid-scan, a test.');
    cases.push({ group: 'route-other', input: { name, dmg: 20 }, output: { dead, ...snap() } });
  }

  // press: one press of Discover Life. Output: what the game holds afterwards, what it said, and the random
  // values left unread.
  const world = (o) => ({ logId: 'p' + o.seed, planetSeed: o.seed, ptype: o.ptype, badge: o.badge || null, title: 'A world', where: where(o.place),
    species: [...fauna(o.powers), { seed: 3000, kingdom: 'flora', power: 1 }] });
  const press = (name, o) => {
    suit = o.suit || 0; notes = [];
    game.set({ hp: o.hp, scout: o.scoutHurt == null ? null : SCOUT, codex: [...(o.scoutHurt == null ? [] : [{ id: SCOUT, name: 'Scout', genome: o.scoutHurt === 0 ? {} : { hurt: o.scoutHurt } }]), ...(o.known || []).map((id) => ({ id }))],
      conquered: o.settled ? [o.seed] : [], surveyed: o.surveyed || [], tech: o.tech || [], sites: o.sites || [], stats: o.stats || {} });
    randoms = [...o.values];
    game.pressScan(world(o));
    cases.push({ group: 'press', input: { name, ...o }, output: { ...snap(), unread: randoms.length } });
  };
  const BASE = { seed: 77, ptype: 'terran', place: 'home', powers: [430], hp: 100, values: [0.999] };
  press('clear', BASE);
  press('safe-no-roll', { ...BASE, powers: [100], values: [] });
  press('settled-no-roll', { ...BASE, settled: true, values: [] });
  for (const value of [0, 0.25, 0.4999, 0.5, 0.5001]) press('edge', { ...BASE, values: [value, 0.5] });
  for (const place of PLACES) press('hostile-place', { ...BASE, place, values: [0, 0] });
  for (const ptype of ['lava', 'venus']) for (const value of [0.61, 0.62, 0.63]) press('hot-edge', { ...BASE, ptype, values: [value, 0.9] });
  press('hull', { ...BASE, tech: ['hull1'], values: [0, 0] });
  press('hull-suit', { ...BASE, tech: ['hull1'], suit: 0.25, place: 4, values: [0, 0] });
  press('suit-capped', { ...BASE, suit: 0.9, place: 5, values: [0, 0] });
  for (const hp of [100, 40, 37, 36, 35, 20, 8]) press('explorer', { ...BASE, hp, place: 0, values: [0, 0.4] });
  press('explorer-dies', { ...BASE, hp: 30, place: 5, values: [0, 0.4] });
  press('explorer-dies-exact', { ...BASE, hp: 39, place: 0, powers: [1200], values: [0, 0.4] });
  for (const scoutHurt of [0, 0.2, 0.5, 0.62, 0.63, 0.64, 0.85]) press('scout', { ...BASE, scoutHurt, place: 0, values: [0, 0.4] });
  press('scout-lost', { ...BASE, scoutHurt: 0.9, place: 5, values: [0, 0.4] });
  press('second-world', { ...BASE, seed: 78, surveyed: [77, 5], stats: { scanhits: 2 }, values: [0, 0.1] });
  press('all-known-already-surveyed', { ...BASE, surveyed: [77], values: [0.999] });
  for (const badge of ['Civilized', 'Advanced', 'Home', 'Life', 'Biosphere']) press('badge', { ...BASE, badge, values: [0.999] });
  press('paragon', { ...BASE, sites: [[77, 6]], values: [0.999] });
  press('paragon-known', { ...BASE, sites: [[77, 6]], known: ['s9006'], stats: { paragons: 3 }, values: [0.999] });
  press('paragon-counted', { ...BASE, sites: [[77, 6]], stats: { paragons: 3 }, values: [0.999] });
  press('paragon-elsewhere', { ...BASE, sites: [[78, 6]], values: [0.999] });
  press('paragon-after-strike', { ...BASE, sites: [[77, 6]], place: 0, values: [0, 0.4] });

  // xp: awardXP of n to a creature holding xp; output is its xp and level afterwards, and what was said.
  for (const [xp, n] of [[null, 2], [0, 2], [4, 2], [5, 1], [52, 2], [484, 2], [485, 2], [486, 2], [999999, 2]]) {
    notes = []; game.set({ codex: [{ id: SCOUT, name: 'Scout', genome: xp === null ? {} : { xp } }] });
    game.awardXP(SCOUT, n);
    const g = game.get().genomes[0][1];
    cases.push({ group: 'xp', input: { xp, n }, output: { xp: g.xp, level: game.levelOf(g), notes } });
  }
  notes = []; game.set({ codex: [{ id: 's1', kind: 'Flora', genome: {} }] }); game.awardXP('s1', 2);
  cases.push({ group: 'xp', input: { kind: 'Flora', n: 2 }, output: { xp: game.get().genomes[0][1].xp ?? null, level: 0, notes } });

  // discover: discoverSpecies of a new species with a Field Scout standing; output is the scout's xp afterwards
  // (null: it holds none), whether the species was new, and the Stardust held.
  for (const [name, o] of [
    ['scout-learns', { scout: SCOUT, tier: 0 }], ['no-scout', { scout: null, tier: 0 }], ['scout-gone', { scout: 's4999', tier: 0 }],
    ['already-known', { scout: SCOUT, tier: 0, known: true }], ['the-scout-itself', { scout: 's6000', tier: 0 }], ['rare', { scout: SCOUT, tier: 5 }], ['rarer', { scout: SCOUT, tier: 9 }],
    ['flora-scout', { scout: SCOUT, tier: 0, scoutKind: 'Flora' }],
  ]) {
    notes = [];
    game.set({ scout: o.scout, codex: [{ id: SCOUT, name: 'Scout', kind: o.scoutKind || 'Fauna', genome: { xp: 4 } }, ...(o.known ? [{ id: 's6000' }] : [])] });
    game.discoverSpecies({ seed: 6000, kingdom: 'fauna', tier: o.tier }, 'A world', null);
    const now = game.get();
    cases.push({ group: 'discover', input: { name, ...o }, output: { scoutXp: now.genomes.find(([id]) => id === SCOUT)[1].xp ?? null, essence: now.essence, stats: now.stats, stored: notes.filter(([kind]) => kind === 'stored').map(([, value]) => value) } });
  }
  return cases;
}

/* ---- the v1 tastes, a flora's flavour, the explorer's meal and the order of Mend ---- */

/** Runs the v1 tastes (`faunaTastes`), a flora's flavour (`floraStat`), the explorer's meal (`healExplorer` and the
    press that calls it) and the order in which "Mend — safest meals" picks its flora. */
function recordLegacyMeals(script) {
  const cases = [];
  const v1 = new Function('Math', '_equipBonus', 'document', 'note', `
    const codex=new Map(), techOwned=new Set(), unlocked=new Set();
    let tutDone=true, _tutRig=null, codexOpen=false, scoutId=null;
    const codexCountEl={textContent:''};
    const toast=(title, text)=>note('toast', [title, text]);
    const unlock=(id)=>{ if(!unlocked.has(id)){ unlocked.add(id); note('unlock', id); } };
    const gameEvent=(type, detail)=>note('event', [type, detail]);
    const checkAch=()=>{}, renderRank=()=>{}, queueSave=()=>{}, renderHP=()=>{}, renderCodex=()=>{}, playRaritySting=()=>{}, fxBurst=()=>{}, FX_GREEN=[];
    ${cutUnique(script, 'function clamp(v,a,b){', '}')}
    ${cutUnique(script, 'function mulberry32(a){', '/4294967296}}')}
    ${cutUnique(script, 'function hashInt(seed,x,y){', 'return h>>>0;\n}')}
    ${cutUnique(script, 'function removeFromCodex(id){', '  if(codexOpen) renderCodex();\n}')}
    ${cutUnique(script, "const STAT_KEYS=['vit'", '];')}
    ${cutUnique(script, 'const STAT_META={', '\n};')}
    ${cutUnique(script, 'let pstats={', '};')}
    ${cutUnique(script, 'function hpMaxFromVit(){', '}')}
    ${cutUnique(script, 'function floraStat(g){', '}')}
    ${cutUnique(script, 'let HP_MAX=hpMaxFromVit();', ';')}
    ${cutUnique(script, 'let hp=HP_MAX;', ';')}
    ${cutUnique(script, 'function recomputeHPMax(){', 'renderHP(); }')}
    ${cutUnique(script, 'function faunaTastes(g){', 'dislikes:[ks[4]]};\n}')}
    ${cutUnique(script, 'function healExplorer(floraEntry, roll){', 'return {ok:true, pois, heal, stat, gain};\n}')}
    function pressHeal(other, resEl, pickList){
    ${cutUnique(script, "  if(_pickMode==='heal'){", '    return;\n  }').replace("if(_pickMode==='heal'){", '{')}
    }
    function safest(base){
      let fl;
      {
    ${cutUnique(script, '          const tastes=faunaTastes(base.genome);', '            });').replace('const fl=', 'fl=')}
      }
      return fl.map((e)=>e.id);
    }
    return {
      faunaTastes, floraStat, healExplorer, pressHeal, safest, STAT_META,
      set(o){ codex.clear(); for(const e of o.codex||[]) codex.set(e.id, e); techOwned.clear(); for(const t of o.tech||[]) techOwned.add(t); unlocked.clear();
        pstats={vit:50, fer:50, res:50, agi:50, ins:50, ...(o.pstats||{})}; HP_MAX=hpMaxFromVit(); hp=o.hp==null?HP_MAX:o.hp; tutDone=o.tutDone!==false; _tutRig=o.rig||null; scoutId=o.scout||null; },
      get(){ return { hp, hpMax:HP_MAX, pstats:{...pstats}, codex:[...codex.keys()], scout:scoutId }; },
    };`);
  let randoms = [];
  let healGear = 0;
  let notes = [];
  const math = Object.create(Math);
  math.random = () => {
    if (randoms.length === 0) throw new Error('a random value was drawn that the case did not supply');
    return randoms.shift();
  };
  const title = { textContent: '' };
  const game = v1(math, (key) => (key === 'heal' ? healGear : 0), { getElementById: () => title }, (kind, value) => { notes.push([kind, value]); });

  // tastes: faunaTastes for a beast's seed. flavour: floraStat for a plant's seed.
  const SEEDS = [0, 1, 2, 7, 133, 999, 65535, 65536, 0x7FFFFFFF, 0x80000000, 0xFFFFFFFE, 0xFFFFFFFF];
  for (let i = 0; i < 288; i++) SEEDS.push((Math.imul(i + 1, 2654435761) >>> 0));
  for (const seed of SEEDS) cases.push({ group: 'tastes', input: { seed }, output: game.faunaTastes({ seed }) });
  for (const seed of SEEDS) cases.push({ group: 'flavour', input: { seed }, output: game.floraStat({ seed }) });
  cases.push({ group: 'flavour', input: { seed: null }, output: game.floraStat({}) });
  cases.push({ group: 'stat-names', input: {}, output: Object.fromEntries(Object.entries(game.STAT_META).map(([key, meta]) => [key, meta.name])) });

  // A plant of each flavour: the first seed of SEEDS whose floraStat is that stat.
  const plantOf = Object.fromEntries(['vit', 'fer', 'res', 'agi', 'ins'].map((stat) => [stat, SEEDS.find((seed) => game.floraStat({ seed }) === stat)]));
  const flora = (seed, tier) => ({ id: 's' + seed, name: 'Plant ' + seed, kind: 'Flora', genome: { seed, kingdom: 'flora' }, grade: tier === null ? null : { tier } });
  const snap = () => ({ ...game.get(), notes });

  // meal: healExplorer for a plant of a tier and flavour, a roll, the health, the stats, the meal gear and the lab.
  const meal = (o) => {
    healGear = o.gear || 0; notes = [];
    const plant = flora(plantOf[o.stat || 'fer'], o.tier);
    game.set({ codex: [plant, flora(424242, 0)], hp: o.hp, pstats: o.pstats, tech: o.lab ? ['lab1'] : [], scout: o.scout ? plant.id : null });
    const result = game.healExplorer(plant, o.roll);
    cases.push({ group: 'meal', input: o, output: { result, ...snap() } });
  };
  for (const tier of [null, 0, 1, 2, 3, 4, 5, 6, 7, 8, 14]) {
    const pois = Math.max(0.05, Math.min(0.6, 0.08 + (tier || 0) * 0.07));
    for (const roll of [0, pois - 1e-9, pois, pois + 1e-9, 0.95, 0.999]) for (const hp of [100, 60, 30, 5, 2, 1]) meal({ tier, roll, hp });
  }
  for (const stat of ['vit', 'fer', 'res', 'agi', 'ins']) for (const tier of [0, 3, 7]) for (const lab of [false, true]) for (const hp of [100, 40]) meal({ tier, roll: 0.999, hp, stat, lab });
  for (const gear of [0.08, 0.12, 0.2, 0.32]) for (const tier of [0, 2, 5]) for (const roll of [0, 0.999]) meal({ tier, roll, hp: 20, gear });
  for (const value of [320, 325, 328, 329, 330]) for (const stat of ['vit', 'ins']) meal({ tier: 6, roll: 0.999, hp: 50, stat, lab: true, pstats: { [stat]: value } });
  for (const vit of [10, 11, 60, 164, 165]) meal({ tier: 2, roll: 0.999, hp: 15, stat: 'vit', pstats: { vit } });
  meal({ tier: 1, roll: 0.999, hp: 100, scout: true });

  // meal-press: the press of a plant in the heal picker; output adds the words of the result line and the title.
  const press = (o) => {
    healGear = o.gear || 0; notes = [];
    const plant = flora(plantOf[o.stat || 'fer'], o.tier);
    game.set({ codex: [plant], hp: o.hp, tech: o.lab ? ['lab1'] : [], tutDone: o.tutDone, rig: o.rig });
    randoms = [...(o.values || [])];
    const resEl = { innerHTML: '' }, pickList = { innerHTML: 'list' };
    title.textContent = '';
    game.pressHeal(plant, resEl, pickList);
    cases.push({ group: 'meal-press', input: o, output: { said: resEl.innerHTML, title: title.textContent, ...snap(), unread: randoms.length } });
  };
  for (const tier of [0, 2, 5, 8]) for (const value of [0, 0.3, 0.999]) for (const hp of [100, 40, 9, 1]) press({ tier, hp, values: [value] });
  press({ tier: 5, hp: 40, tutDone: false, values: [] });
  press({ tier: 8, hp: 40, tutDone: false, values: [] });
  press({ tier: 8, hp: 40, rig: { heal: 0.95 }, values: [] });
  press({ tier: 3, hp: 40, stat: 'vit', lab: true, values: [0.999] });
  press({ tier: 3, hp: 40, stat: 'ins', gear: 0.2, values: [0.999] });

  // mend-order: the flora "Mend — safest meals" would serve a beast, safest first, from the plants held in order.
  const beasts = SEEDS.slice(12, 24);
  const larder = [];
  for (let i = 0; i < 15; i++) larder.push([SEEDS[40 + i], [0, 3, 1, 0, 2, 5, 1, 4, 0, 2, 3, 1, 0, 6, 2][i]]);
  for (const seed of beasts) for (const count of [0, 1, 5, 15]) {
    const held = larder.slice(0, count).map(([plantSeed, tier]) => flora(plantSeed, tier));
    const base = { id: 's' + seed, kind: 'Fauna', genome: { seed, kingdom: 'fauna', hurt: 0.5 } };
    game.set({ codex: [base, ...held] });
    cases.push({ group: 'mend-order', input: { beast: seed, flora: larder.slice(0, count) }, output: game.safest(base) });
  }
  return cases;
}

/* ---- the v1 descent, shared by its two recorders ---- */

/** Runs the v1 descent rules. `edges` false: the cases of landing-descent. true: those of landing-descent-edges. */
function recordLegacyDescent(script, edges) {
    const v1 = new Function('perfTime', 'climateBand', 'st', 'Math', 'techOwned', 'landed', 'toast', 'queueSave', 'renderHP', 'playFailTone', 'fxShake', 'document', `
      const _waveOffs=new Map(); let _descCleared=null, _descOpenFor=null, hp=0, tutDone=true;
      const items=new Map(); const equip={}; const equipAff={};
      const _descBoxEl=()=>document.getElementById('descbox');
      ${cutUnique(script, 'function mulberry32(a){', '/4294967296}}')}
      ${cutUnique(script, 'function hashInt(seed,x,y){', 'return h>>>0;\n}')}
      ${cutUnique(script, 'const BIOME_SETS={', 'return comp[comp.length-1].biome;\n}')}
      ${cutUnique(script, 'function descentTierFromPct(p){', '{lo:6,hi:8};\n}')}
      ${cutUnique(script, 'const DESCENT_TIERS={', 'lava:{p:20,lo:6,hi:8}};')}
      ${cutUnique(script, 'const ITEMS=[', '\n];')}
      ${cutUnique(script, 'const ITEM_BY=new Map(', ';')}
      ${cutUnique(script, 'const EQ_SLOTS=[', '\n];')}
      ${cutUnique(script, 'function itemCount(id){', '}')}
      ${cutUnique(script, 'function _slotAffix(slot){', 'a : null;\n}')}
      ${cutUnique(script, 'function _equipBonus(key){', 'return v;\n}')}
      ${cutUnique(script, 'function _equipLandFam(type){', 'return v;\n}')}
      ${cutUnique(script, 'function descentBonus(P){', 'return b;\n}')}
      ${cutUnique(script, 'function descentTierLabel(p){', "'Hostile descent';\n}")}
      ${cutUnique(script, 'function _descWx(pl){', 'return now?wx:null;\n}')}
      ${cutUnique(script, 'function descentFor(pl){', 'biome:bio};\n}')}
      ${cutUnique(script, 'function descentSafe(seed){', '}')}
      ${cutUnique(script, 'function _descRoll(pl){', 'queueSave();\n  return false;\n}')}
      ${cutUnique(script, 'function wxEventFor(P, wb, wxTok){', "ironrain:'iron rain glowing as it falls'};")}
      ${cutUnique(script, 'function openDescentBox(pl){', "b.style.display='flex';\n}")}
      return {
        DESCENT_TIERS, descentTierLabel, descentTierFromPct, descentFor, descentSafe, _descRoll, openDescentBox, biomeFor,
        set(o){ _waveOffs.clear(); if(o.waveOffs) _waveOffs.set(o.seed, o.waveOffs); hp=o.hp||0; _descCleared=o.cleared??null;
          tutDone=o.tutDone!==false; for(const k in equip) delete equip[k]; Object.assign(equip, o.equip||{});
            for(const k in equipAff) delete equipAff[k]; Object.assign(equipAff, o.equipAff||{}); },
        get(seed){ return { hp, waveOffs:_waveOffs.get(seed)||0 }; },
      };`);
    let seconds = 0;
    let band = 'temperate';
    let randoms = [];
    let toasted = null;
    const math = Object.create(Math);
    math.random = () => {
      if (randoms.length === 0) throw new Error('a random value was drawn that the case did not supply');
      return randoms.shift();
    };
    const tech = new Set();
    const landedSet = new Set();
    const elements = new Map();
    const doc = {
      getElementById: (id) => {
        if (!elements.has(id)) elements.set(id, { style: {}, textContent: '', innerHTML: '' });
        return elements.get(id);
      },
    };
    const game = v1(() => seconds, () => band, { sys: null }, math, tech, landedSet, (title, text) => { toasted = [title, text]; },
      () => {}, () => {}, () => {}, () => {}, doc);
    if (edges) {
      const mk = (seed, type, name) => ({ P: { seed, type }, orb: 100, name });
      const out = [];
      tech.clear();
      // Rolls on and beside the boundary of the odds: LEGACY lands on `random*100 < pct`.
      for (const type of ['terran', 'ocean', 'ice', 'desert', 'gas', 'venus', 'lava']) for (const seed of [7, 131]) for (const t of [45, 135]) for (const n of [0, 1, 2]) {
        band = 'temperate';
        seconds = t;
        game.set({ seed, waveOffs: n, hp: 9 });
        const pct = game.descentFor(mk(seed, type)).pct;
        for (const success of [pct / 100, (pct - 1) / 100, (pct + 1) / 100, pct / 100 - 1e-9, pct / 100 + 1e-9]) {
          if (success < 0 || success >= 1) continue;
          game.set({ seed, waveOffs: n, hp: 9 });
          landedSet.clear();
          toasted = null;
          randoms = [success, 0.5];
          const landed = game._descRoll(mk(seed, type, 'Testworld'));
          const after = game.get(seed);
          out.push({ group: 'edge-roll', input: { seed, type, band, seconds: t, waveOffs: n, hp: 9, success, damage: 0.5, pct }, output: [landed, after.hp, after.waveOffs, toasted, game.descentFor(mk(seed, type)).pct] });
        }
      }
      // A rolled landing for the first world found at each biome landing value: which are announced.
      seconds = 45;
      const seen = new Set();
      for (const type of ['terran', 'ocean', 'rocky', 'ice', 'desert', 'gas', 'venus', 'lava']) for (const b of ['hot', 'temperate', 'cold', 'frozen']) for (let seed = 1; seed <= 300; seed++) {
        band = b;
        const biome = game.biomeFor({ seed, type }, b);
        if (!biome || seen.has(biome.land)) continue;
        seen.add(biome.land);
        game.set({ seed, hp: 9 });
        landedSet.clear();
        toasted = null;
        randoms = [0, 0];
        const landed = game._descRoll(mk(seed, type, 'Testworld'));
        out.push({ group: 'edge-fire', input: { seed, type, band: b, land: biome.land }, output: [landed, toasted] });
      }
      // Worn pieces with a seeded affix: counted only while the piece it was rolled for is worn.
      const affixed = [
        { equip: { suit: 'thermal' }, equipAff: { suit: { k: 'land', v: 7, forId: 'thermal' } } },
        { equip: { suit: 'thermal' }, equipAff: { suit: { k: 'land', v: 7, forId: 'cryoline' } } },
        { equip: {}, equipAff: { suit: { k: 'land', v: 7, forId: 'thermal' } } },
        { equip: { boots: 'gravboots' }, equipAff: { boots: { k: 'land', v: 12, forId: 'gravboots' } } },
        { equip: { module: 'struts' }, equipAff: { module: { k: 'yield', v: 0.2, forId: 'struts' } } },
      ];
      for (const type of ['terran', 'ice', 'gas', 'venus', 'lava']) for (const worn of affixed) for (const n of [0, 1]) {
        band = 'temperate';
        const seed = 7;
        game.set({ seed, waveOffs: n, hp: 9, ...worn });
        const pct = game.descentFor(mk(seed, type)).pct;
        landedSet.clear();
        toasted = null;
        randoms = [0.999, 0.999];
        const landed = game._descRoll(mk(seed, type, 'Testworld'));
        const after = game.get(seed);
        out.push({ group: 'edge-gear', input: { seed, type, band, ...worn, waveOffs: n, hp: 9, success: 0.999, damage: 0.999 }, output: [pct, landed, after.hp, after.waveOffs, toasted, game.descentFor(mk(seed, type)).pct] });
      }
      return out;
    }
    const types = ['terran', 'ocean', 'rocky', 'ice', 'desert', 'gas', 'venus', 'lava'];
    const bands = ['hot', 'temperate', 'cold', 'frozen'];
    const world = (seed, type, name) => ({ P: { seed, type }, orb: 100, name });
    const pcts = Array.from({ length: 101 }, (_, p) => p);
    const cases = [{
      group: 'tiers',
      output: {
        tiers: game.DESCENT_TIERS,
        label: pcts.map((p) => game.descentTierLabel(p)),
        damage: pcts.map((p) => { const t = game.descentTierFromPct(p); return [t.lo, t.hi]; }),
      },
    }];
    const times = [45, 135, 225, 500, 1234.5];
    const counts = [0, 1, 3, 5];
    for (const type of [...types, 'unknown']) for (const b of bands) for (const seed of [131, 132, 134, 135, 1757105165, 51464061, 7, 8]) {
      band = b;
      const pl = world(seed, type);
      const biome = game.biomeFor(pl.P, b);
      const at = [];
      for (const t of times) for (const n of counts) {
        seconds = t;
        game.set({ seed, waveOffs: n });
        const d = game.descentFor(pl);
        at.push([d.pct, d.lo, d.hi, d.wx]);
      }
      cases.push({ group: 'descent', input: { seed, type, band: b, times, waveOffs: counts }, biome: biome ? [biome.k, biome.n, biome.land] : null, at });
    }
    const worn = [{}, { suit: 'thermal' }, { suit: 'presshull' }, { suit: 'cryoline' }, { module: 'struts' }, { module: 'stabil' }, { module: 'anchor' },
      { suit: 'thermal', module: 'stabil' }, { legs: 'greaves', boots: 'gravboots' }, { suit: 'rl-stone', boots: 'rl-ocean' }];
    seconds = 45;
    for (const type of types) for (const seed of [131, 7]) for (const equip of worn) for (const n of [0, 2]) {
      band = 'temperate';
      game.set({ seed, waveOffs: n, equip });
      cases.push({ group: 'gear', input: { seed, type, band, equip, waveOffs: n }, output: game.descentFor(world(seed, type)).pct });
    }
    for (const type of ['terran', 'gas', 'venus', 'lava']) for (const equip of [{}, { module: 'struts' }, { module: 'stabil' }, { suit: 'rl-stone', legs: 'greaves' }])
      for (const hull1 of [false, true]) for (const hp of [1, 3, 9]) for (const n of [0, 4]) for (const success of [0, 0.5, 0.999]) for (const damage of [0, 0.5, 0.999]) {
        band = 'temperate';
        const seed = 7;
        const pl = world(seed, type, 'Testworld');
        game.set({ seed, waveOffs: n, equip, hp });
        tech.clear();
        if (hull1) tech.add('hull1');
        landedSet.clear();
        toasted = null;
        randoms = [success, damage];
        const landed = game._descRoll(pl);
        const after = game.get(seed);
        cases.push({
          group: 'roll',
          input: { seed, type, band, equip, hull1, hp, waveOffs: n, success, damage },
          output: [landed, after.hp, after.waveOffs, toasted, game.descentFor(pl).pct],
        });
      }
    tech.clear();
    for (const type of types) for (const b of bands) for (const seed of [131, 7]) for (const t of [45, 135]) for (const name of ['Testworld', null]) {
      band = b;
      seconds = t;
      game.set({ seed });
      game.openDescentBox(world(seed, type, name ?? undefined));
      cases.push({ group: 'prompt', input: { seed, type, band: b, seconds: t, name }, output: [elements.get('desc-title').textContent, elements.get('desc-risk').innerHTML] });
    }
    const safe = [];
    for (const tutDone of [true, false]) for (const seed of [133, 134]) for (const wasLanded of [false, true]) for (const cleared of [null, 134]) {
      game.set({ seed, tutDone, cleared });
      landedSet.clear();
      if (wasLanded) landedSet.add(seed);
      safe.push([tutDone, seed, wasLanded, cleared, game.descentSafe(seed)]);
    }
    cases.push({ group: 'safe', output: safe });
    return cases;
}

export const recorders = {
  sessionrng: {
    test: 'packages/domain/sessionrng/test/sessionrng.test.ts',
    kind: 'outputs',
    taken: 'Every executable Math.random( in the whole v1 script, found by the test\'s lexer (comments, quoted strings and template text masked): {legacyLine, occurrenceOnLine, sourceLine}, in script order. Lines count from the first byte after <script>.',
    record: ({ script }) => scanExecutableMathRandom(script),
  },
  'loot-catalogue': {
    test: 'packages/domain/loot/test/catalogue.test.ts',
    kind: 'outputs',
    taken: 'The v1 ITEMS literal (script slice from "const ITEMS=" to "\\n];\\nconst ITEM_BY"), evaluated with node:vm, projected to the test\'s 17 fields, in v1 order.',
    record: ({ script }) => {
      const start = script.indexOf('const ITEMS=[');
      const end = script.indexOf('\n];\nconst ITEM_BY', start);
      if (start < 0 || end <= start) throw new Error('v1 script has no ITEMS literal');
      const items = runInNewContext(script.slice(start + 'const ITEMS='.length, end + 2), Object.create(null));
      return items.map((item) => ({
        id: item.id,
        category: item.cat,
        slot: item.slot ?? null,
        name: item.name,
        family: item.fam,
        hue: item.hue,
        description: item.d,
        tier: item.tier,
        authoredRarityTier: item.rar ?? null,
        effects: item.eff ?? {},
        implicits: Object.keys(item.eff ?? {}).sort(),
        materialCost: item.cost,
        partCost: item.parts ?? null,
        stardustCost: item.sd ?? null,
        prerequisiteId: item.req ?? null,
        signatureId: item.sig ?? null,
        unlock: item.unlock ?? null,
      }));
    },
  },
  'acquisition-companion-care': {
    test: 'packages/domain/acquisition/test/companion-care.test.ts',
    kind: 'outputs',
    taken: 'v1 faunaTastes({seed}) for seed = (s*2654435761)>>>0, s = 0..4999, run with new Function over three unique script slices: "function mulberry32(a){" to "/4294967296}}", "const STAT_KEYS=[\'vit\'" to "];", "function faunaTastes(g){" to "dislikes:[ks[4]]};\\n}".',
    record: ({ script }) => {
      const mulberry = cutUnique(script, 'function mulberry32(a){', '/4294967296}}');
      const keys = cutUnique(script, "const STAT_KEYS=['vit'", '];');
      const tastes = cutUnique(script, 'function faunaTastes(g){', 'dislikes:[ks[4]]};\n}');
      const faunaTastes = new Function(`${mulberry}\n${keys}\n${tastes}\nreturn faunaTastes;`)();
      const cases = [];
      for (let s = 0; s < 5_000; s++) {
        const seed = (s * 2654435761) >>> 0;
        const { likes, dislikes } = faunaTastes({ seed });
        cases.push({ seed, likes, dislikes });
      }
      return cases;
    },
  },
  'progression-achievements': {
    test: 'packages/domain/progression/test/achievements.test.ts',
    kind: 'outputs',
    taken: 'The v1 ACH rows (HTML slice from "const ACH=[" to "];\\n/* survey hooks"), matched by the test\'s pattern {id, cat, ic, name, d} with \\uXXXX escapes in name and d decoded: {id, category, icon, name, description}, in v1 order.',
    record: ({ html }) => {
      const begin = html.indexOf('const ACH=[');
      const end = html.indexOf('];\n/* survey hooks', begin);
      if (begin <= 0 || end <= begin) throw new Error('v1 HTML has no ACH table');
      const pattern = /\{id:'([^']+)',\s*cat:'([^']+)',\s*ic:'([^']+)',\s*name:'([^']+)',\s*d:'([^']+)',\s*t:/gu;
      const decode = (value) => value.replace(/\\u([0-9a-f]{4})/giu, (_, hex) => String.fromCharCode(Number.parseInt(hex, 16)));
      return [...html.slice(begin, end).matchAll(pattern)].map((m) => ({
        id: m[1], category: m[2], icon: m[3], name: decode(m[4]), description: decode(m[5]),
      }));
    },
  },
  'persistence-training-checkpoint': {
    test: 'packages/persistence/test/training-checkpoint.test.ts',
    kind: 'hash',
    taken: 'SHA-256 and byte length of the three whole files the test hashes, each named by its path from the v1 folder and by the role whose <role>Sha256 field training-restart-fixture.json stores.',
    record: ({ readV1File }) => [
      ['gameHtml', GAME_HTML],
      ['probeHarness', 'tools/_probeboot.js'],
      ['captureDriver', 'tools/training-restart-fixture.js'],
    ].map(([role, file]) => {
      const bytes = readV1File(file);
      return { role, file, sha256: sha256(bytes), bytes: bytes.length };
    }),
  },
  'landing-region': {
    test: 'packages/domain/landing/test/region.test.ts',
    kind: 'outputs',
    taken: 'v1 biomeComposition and biomeForLanding, run with new Function over three unique script slices: "function mulberry32(a){" to "/4294967296}}", "function hashInt(seed,x,y){" to "return h>>>0;\\n}", and "const BIOME_SETS={" to "return comp[comp.length-1].biome;\\n}" (BIOME_SETS, biomeFor, biomeComposition, _EARTH_LANDING, _earthLandingComp, biomeForLanding). Groups, in order. composition: biomeComposition({seed, type, iceAmt}, band) as [[key, pct], ...] or null, iceAmt left off the planet when null. roll: biomeForLanding({seed, type}, band, salt) for salt 0..39, as region keys or null. salt: the same for the salts listed in the input. earth: seed 133, terran, temperate, salts 0..4999. edge: over every roll, salt and earth draw, the smallest distance between the draw (walked by the recorder as biomeForLanding walks it) and a boundary of the list, with the case it belongs to.',
    record: ({ script }) => {
      const { biomeComposition, biomeForLanding, walk } = new Function(`
        ${cutUnique(script, 'function mulberry32(a){', '/4294967296}}')}
        ${cutUnique(script, 'function hashInt(seed,x,y){', 'return h>>>0;\n}')}
        ${cutUnique(script, 'const BIOME_SETS={', 'return comp[comp.length-1].biome;\n}')}
        function walk(P, band, salt){
          const comp=(P.seed===133)?_earthLandingComp():biomeComposition(P, band);
          if(!comp||!comp.length) return null;
          let v=mulberry32(hashInt(P.seed, 0x1A2D, (salt|0)+1)>>>0)(), near=Infinity;
          for(const c of comp){ v-=c.pct; near=Math.min(near, Math.abs(v)); }
          return near;
        }
        return { biomeComposition, biomeForLanding, walk };`)();
      const types = ['terran', 'ocean', 'rocky', 'ice', 'desert', 'gas', 'venus', 'lava'];
      const bands = ['hot', 'temperate', 'cold', 'frozen'];
      const seeds = [133, 131, 134, 1757105165, 51464061, 1, 2, 3, 999, 424242];
      const oddSalts = [-1, -2, -0.5, 2.7, 997, 1128, 2147483647, 2147483648, 4294967301, 1000000];
      const cases = [];
      let edge = { smallest: Infinity };
      const rolled = (planet, band, salt) => {
        const near = walk(planet, band, salt);
        if (near !== null && near < edge.smallest) edge = { smallest: near, seed: planet.seed, type: planet.type, band, salt };
        const region = biomeForLanding(planet, band, salt);
        return region === null ? null : region.k;
      };
      for (const type of types) for (const band of bands) for (const seed of seeds) for (const iceAmt of [null, 0, 0.5, 1]) {
        const mix = biomeComposition(iceAmt === null ? { seed, type } : { seed, type, iceAmt }, band);
        cases.push({ group: 'composition', input: { seed, type, band, iceAmt }, output: mix === null ? null : mix.map((c) => [c.biome.k, c.pct]) });
      }
      cases.push({ group: 'composition', input: { seed: 131, type: 'unknown', band: 'temperate', iceAmt: null }, output: biomeComposition({ seed: 131, type: 'unknown' }, 'temperate') });
      for (const type of [...types, 'unknown']) for (const band of bands) for (const seed of seeds) {
        cases.push({ group: 'roll', input: { seed, type, band }, output: Array.from({ length: 40 }, (_, salt) => rolled({ seed, type }, band, salt)) });
      }
      for (const seed of [133, 131, 1757105165]) {
        cases.push({ group: 'salt', input: { seed, type: 'terran', band: 'temperate', salts: oddSalts }, output: oddSalts.map((salt) => rolled({ seed, type: 'terran' }, 'temperate', salt)) });
      }
      cases.push({ group: 'earth', input: { seed: 133, type: 'terran', band: 'temperate' }, output: Array.from({ length: 5000 }, (_, salt) => rolled({ seed: 133, type: 'terran' }, 'temperate', salt)) });
      cases.push({ group: 'edge', output: edge });
      return cases;
    },
  },
  'landing-weather': {
    test: 'packages/domain/landing/test/weather.test.ts',
    kind: 'outputs',
    taken: 'v1 weather, season and time of day, run with new Function over five unique script slices, with perfTime, climateBand and st supplied by the recorder (perfTime returns the case\'s seconds, climateBand its band, st is {sys: null}): "function mulberry32(a){" to "/4294967296}}"; "const TAU = Math.PI*2;"; the statements of openLandingVista from "  if(!pl._env){" to "const tod=Bc>0.72?\'day\':(Bc>0.42?\'twilight\':\'night\');" (they sit inline in that function, so they are wrapped unchanged in function(pl, P, time) returning their own locals); "function _descWx(pl){" to "return now?wx:null;\\n}"; "function wxEventFor(P, wb, wxTok){" to "ironrain:\'iron rain glowing as it falls\'};" (with WX_EVENT_WORD); "const WXW={rain:\'rain\'" to "};" (the weather words of showVistaBox). Groups, in order. words: events is WX_EVENT_WORD, weather is WXW, odds is the WX_ODDS of the openLandingVista statements. world: one per type, band and seed: env is the world\'s pl._env; at holds, per seconds, [seconds, seasonT, effWx, wxNow, tod, the token _descWx returns, wxEventFor for regions null, stormsea, cryogeyser, hotglow with the token (wxNow ? effWx : null)]. edge: the smallest distances found between seasonT and -0.45 (worlds whose base weather is rain) and between Bc and its two thresholds.',
    record: ({ script }) => {
      const tod = "const tod=Bc>0.72?'day':(Bc>0.42?'twilight':'night');";
      const v1 = new Function('perfTime', 'climateBand', 'st', `
        ${cutUnique(script, 'function mulberry32(a){', '/4294967296}}')}
        ${cutUnique(script, 'const TAU = Math.PI*2;', ';')}
        function landingClock(pl, P, time){
        ${cutUnique(script, '  if(!pl._env){\n    const er=mulberry32((P.seed^0xE57)>>>0);', tod)}
          return { env, seasonT, effWx, wxNow, tod, Bc, WX_ODDS };
        }
        ${cutUnique(script, "const WXW={rain:'rain'", '};')}
        ${cutUnique(script, 'function _descWx(pl){', 'return now?wx:null;\n}')}
        ${cutUnique(script, 'function wxEventFor(P, wb, wxTok){', "ironrain:'iron rain glowing as it falls'};")}
        return { landingClock, _descWx, wxEventFor, WX_EVENT_WORD, WXW };`);
      let seconds = 0;
      let band = 'temperate';
      const { landingClock, _descWx, wxEventFor, WX_EVENT_WORD, WXW } = v1(() => seconds, () => band, { sys: null });
      const types = ['terran', 'ocean', 'rocky', 'ice', 'desert', 'gas', 'venus', 'lava'];
      const bands = ['hot', 'temperate', 'cold', 'frozen'];
      const seeds = [133, 131, 134, 1757105165, 51464061, 7, 8, 9];
      const times = [0, 45, 89, 90, 91, 500, 1234.5, 9999, 86400, ...Array.from({ length: 20 }, (_, i) => (i + 2) * 90 + 45)];
      const regions = [null, 'stormsea', 'cryogeyser', 'hotglow'];
      const odds = landingClock({ P: { seed: 133, type: 'terran' }, orb: 100 }, { seed: 133, type: 'terran' }, 0).WX_ODDS;
      const cases = [{ group: 'words', output: { events: { ...WX_EVENT_WORD }, weather: { ...WXW }, odds: { ...odds } } }];
      const edge = { season: Infinity, day: Infinity, twilight: Infinity };
      for (const type of types) for (const b of bands) for (const seed of seeds) {
        band = b;
        const pl = { P: { seed, type }, orb: 100 };
        const at = times.map((t) => {
          seconds = t;
          const now = landingClock(pl, pl.P, t);
          if (now.env.wx === 'rain' && now.seasonT !== 0) edge.season = Math.min(edge.season, Math.abs(now.seasonT + 0.45));
          edge.day = Math.min(edge.day, Math.abs(now.Bc - 0.72));
          edge.twilight = Math.min(edge.twilight, Math.abs(now.Bc - 0.42));
          const token = now.wxNow ? now.effWx : null;
          return [t, now.seasonT, now.effWx, now.wxNow, now.tod, _descWx(pl), regions.map((region) => wxEventFor(pl.P, region, token))];
        });
        cases.push({ group: 'world', input: { seed, type, band: b }, env: { ...pl._env }, at });
      }
      cases.push({ group: 'edge', output: edge });
      return cases;
    },
  },
  'landing-environment': {
    test: 'packages/domain/landing/test/weather.test.ts',
    kind: 'outputs',
    taken: 'The v1 environment of a world (pl._env) for seeds 1..1000 and 133, for each of the types terran, ocean, gas and rocky in a temperate band, run with new Function over three unique script slices, with climateBand (returns temperate) and st ({sys: null}) supplied by the recorder: "function mulberry32(a){" to "/4294967296}}"; "const TAU = Math.PI*2;"; the statements of openLandingVista from "  if(!pl._env){" to "const tod=Bc>0.72?\'day\':(Bc>0.42?\'twilight\':\'night\');" (inline in that function, so wrapped unchanged in function(pl, P, time)). One case per type: output holds, per seed in order, [seed, tilt, hasAtmo, hasField, wx, ph, dayLen, yearLen].',
    record: ({ script }) => {
      const landingClock = new Function('climateBand', 'st', `
        ${cutUnique(script, 'function mulberry32(a){', '/4294967296}}')}
        ${cutUnique(script, 'const TAU = Math.PI*2;', ';')}
        function landingClock(pl, P, time){
        ${cutUnique(script, '  if(!pl._env){\n    const er=mulberry32((P.seed^0xE57)>>>0);', "const tod=Bc>0.72?'day':(Bc>0.42?'twilight':'night');")}
          return env;
        }
        return landingClock;`)(() => 'temperate', { sys: null });
      const seeds = [...Array.from({ length: 1000 }, (_, i) => i + 1), 133];
      return ['terran', 'ocean', 'gas', 'rocky'].map((type) => ({
        input: { type, band: 'temperate' },
        output: seeds.map((seed) => {
          const pl = { P: { seed, type }, orb: 100 };
          const env = landingClock(pl, pl.P, 0);
          return [seed, env.tilt, env.hasAtmo, env.hasField, env.wx, env.ph, env.dayLen, env.yearLen];
        }),
      }));
    },
  },
  'landing-weather-events': {
    test: 'packages/domain/landing/test/weather.test.ts',
    kind: 'outputs',
    taken: 'v1 wxEventFor over 1,000 weather spells, run with new Function over two unique script slices, with perfTime supplied by the recorder (it returns spell * 90 + 45): "function mulberry32(a){" to "/4294967296}}" and "function wxEventFor(P, wb, wxTok){" to "ironrain:\'iron rain glowing as it falls\'};". One case per world type, seed, region and token, for the pairs of region and token under which the type can show an event: output names each event that occurred with the spells (0..999) it occurred in.',
    record: ({ script }) => {
      let spell = 0;
      const wxEventFor = new Function('perfTime', `
        ${cutUnique(script, 'function mulberry32(a){', '/4294967296}}')}
        ${cutUnique(script, 'function wxEventFor(P, wb, wxTok){', "ironrain:'iron rain glowing as it falls'};")}
        return wxEventFor;`)(() => spell * 90 + 45);
      const pairs = {
        lava: [[null, 'ash'], [null, null]],
        desert: [[null, 'dust'], [null, null]],
        ocean: [['stormsea', null], [null, 'rain'], ['stormsea', 'rain'], [null, 'snow']],
        terran: [[null, 'rain'], [null, 'snow'], [null, null]],
        ice: [['cryogeyser', null], [null, 'snow'], ['cryogeyser', 'snow'], [null, null]],
        venus: [[null, null], [null, 'haze']],
        gas: [['hotglow', null], [null, null]],
        rocky: [[null, null]],
      };
      const cases = [];
      for (const [type, list] of Object.entries(pairs)) for (const seed of [133, 131, 1757105165, 51464061]) for (const [region, token] of list) {
        const output = {};
        for (spell = 0; spell < 1000; spell++) {
          const event = wxEventFor({ seed, type }, region, token);
          if (event !== null) (output[event] ??= []).push(spell);
        }
        cases.push({ input: { type, seed, region, token }, output });
      }
      return cases;
    },
  },
  'capture-press': {
    test: 'apps/game/test/capture-legacy.test.ts',
    kind: 'outputs',
    taken: 'The v1 capture rules, run with new Function over unique script slices: clamp, mulberry32, hashInt, codexId, TAME_ODDS, _captureRing, captureOdds, _captureKind, bioX, bioPool, _bioUsed, bioLeft, tryCapture. Supplied by the recorder: Math (the real one with random replaced by the case\'s queue of values), describeSpecies (a name and the grade {tier} the case gives the species), ringGrade (the grade unchanged), regionAt (the case\'s region), _equipBonus (the case\'s contact points), HOME_GAL_SEED 999, SOL_POS {560,170} and ASC_RING_R 300 (GR 1200 × 0.25) as the script declares them, discoverSpecies (notes the species and puts its id in the Compendium), gameEvent, toast, queueSave, and the containers the script declares beside them (codex, COSMIC_EPOCH, _panelKey). Species are {seed, kingdom, tier}. Groups, in order. odds: captureOdds per verb, tier, ring and worn contact points. ring: _captureRing for the named place. pool: bioPool for a world seed and each species count 0..19. used: for a stored row [used, stamp] read at an epoch, [_bioUsed, bioLeft, the row after]. press: one tryCapture on a roster of the input\'s kingdoms (species i has seed 1000+i and tier 0) with the roster indices in `known` already in the Compendium and the two random values pick then success; output is [caught species seed or null, the bioX row after or null, toast as [title, text] or null, events said, random values left unread]. worked-out: the same with `used` attempts already spent of a pool of `pool`. edge: one species of the input\'s tier with a success value on and beside the odds; output is [odds, caught seed or null]. chain: presses in order on one roster, the Compendium and pool carried on; before a step listed in `turn` the epoch rises by one; output is one press output per step.',
    record: ({ script }) => recordLegacyCapture(script),
  },
  'care-field': {
    test: 'apps/game/test/care-legacy.test.ts',
    kind: 'outputs',
    taken: 'The v1 biosphere scan, the Field Scout and the Fifty Paragons. paragon-site: paragonWhere(i) for i = 0..49, run with new Function over the v1 modules Rand, PlanetGen, WorldConfig, Naming, StarCatalog and WorldGen (each from "const <Name>=(()=>{" to "}=<Name>;"), GAL_SPRITE_SEEDS (GAL_SPRITES is supplied as that list: the walk reads only its length), slimGal and paragonWhere, with the real Math. Every other group runs new Function over unique script slices: clamp, mulberry32, codexId, levelOf, creatureCondition, hazardFlavor, DEPTH_TAX, depthTax, dangerOf, damageExplorer, routeHit, awardXP, autoScanWorld, discoverSpecies, and the statements of the survey card\'s click listener from "  const scan=e.target.closest(\'[data-scanlife]\');" to its "return;" (inline in that listener, so wrapped unchanged in function pressScan(e)). Supplied by the recorder: Math (the real one with random replaced by the case\'s queue of values), battleStats (a species\' power as the case gives it), regionAt (the case\'s region), _equipBonus (the case\'s suit cut under scut, 0 otherwise), HOME_GAL_SEED 999 as the script declares it, a document with no elements, and the containers and hooks the script declares beside them (codex, conquered, surveyedSet, techOwned, stats, scoutId, hp, essence, _parSites, toast, unlock, gameEvent, showDeath, removeFromCodex), each noting what it was told; paragonGenome gives {seed 9000+i}, _storeSpecies stores an entry whose grade is the tier the case gives the species, crossGenome a child of seed + 500000. A place is "home" (the home galaxy), "none" (no place) or a region number (another galaxy in that region). Groups, in order. paragon-site: the home world as paragonWhere returns it. danger: dangerOf for a world of three beasts of the input\'s powers and one plant. danger-none: a world with no beast. flavor: hazardFlavor(d, null) for a world type and a random value. condition: creatureCondition for a hurt. route: routeHit(dmg) with the suit\'s cut, the health and a scout of the input\'s hurt (null: none); output holds dead, the health, the scout, each genome, and notes (what was said, removed, unlocked) in order. route-other: a scout that is a plant, or gone from the Compendium. press: one press of Discover Life on a world of the input (beasts of `powers` and one plant) with the random values of the input; output holds the health, scout, surveyed set, stats, genomes, notes in order and the count of values left unread. xp: awardXP(n) to a beast holding xp; output is its xp, level and notes. discover: discoverSpecies of a new beast of the input\'s tier with a scout standing; output is the scout\'s xp, the Stardust, the stats and what was stored.',
    record: ({ script }) => recordLegacyCare(script),
  },
  'care-meals': {
    test: 'apps/game/test/care-meals-legacy.test.ts',
    kind: 'outputs',
    taken: 'The v1 tastes, a flora\'s flavour, the explorer\'s meal and the order of Mend, run with new Function over unique script slices: clamp, mulberry32, hashInt, removeFromCodex, STAT_KEYS, STAT_META, pstats, hpMaxFromVit, floraStat, HP_MAX, hp, recomputeHPMax, faunaTastes, healExplorer, the heal branch of the picker\'s click listener from "  if(_pickMode===\'heal\'){" to its "return;" (inline in that listener, so wrapped unchanged in function pressHeal(other, resEl, pickList) with its condition dropped), and the statements of the "Mend — safest meals" listener that choose the flora, from "const tastes=faunaTastes(base.genome);" to the end of its sort (wrapped in function safest(base), which returns the ids in order). Supplied by the recorder: Math (the real one with random replaced by the case\'s queue of values), _equipBonus (the case\'s meal gear under heal, 0 otherwise), a document whose one element keeps textContent, and the containers and hooks the script declares beside them (codex, techOwned, tutDone, _tutRig, scoutId, toast, unlock, gameEvent), each noting what it was told. A plant is {id "s"+seed, kind Flora, genome {seed}, grade {tier}} (grade null for tier null). Groups, in order. tastes: faunaTastes({seed}). flavour: floraStat({seed}); the last case has no seed. stat-names: STAT_META\'s name per stat key. meal: healExplorer(plant, roll) for a plant of the input\'s tier whose flavour is the input\'s stat (fer when not given), with the health, the explorer\'s stats (50 each unless given), the meal gear and the Xenobotany Lab of the input; output holds the result, the health, its maximum, the stats, the Compendium\'s ids, the scout, and notes in order. meal-press: the press of that plant in the heal picker with the random values of the input, in training when tutDone is false, rigged when rig is given; output adds the result line\'s innerHTML, the title and the count of values left unread. mend-order: for a hurt beast of the input\'s seed and the plants held in the input\'s order as [seed, tier], the ids Mend would serve, safest first.',
    record: ({ script }) => recordLegacyMeals(script),
  },
  'landing-descent': {
    test: 'apps/game/test/descent-policy.test.ts',
    kind: 'outputs',
    taken: 'The v1 descent rules, run with new Function over unique script slices: mulberry32, hashInt, "const BIOME_SETS={" to the end of biomeForLanding (for biomeFor), descentTierFromPct, DESCENT_TIERS, descentBonus, descentTierLabel, _descWx, descentFor, descentSafe, _descRoll, wxEventFor with WX_EVENT_WORD, openDescentBox, and the gear readers ITEMS, ITEM_BY, EQ_SLOTS, itemCount, _slotAffix, _equipBonus, _equipLandFam. Supplied by the recorder: perfTime (the case\'s seconds), climateBand (the case\'s band), st ({sys: null}), Math (the real one with random replaced by the case\'s queue of values), techOwned, landed, toast, queueSave, renderHP, playFailTone, fxShake, a document whose elements keep textContent and innerHTML, and the containers the script declares beside them (_waveOffs, items, equip, equipAff, hp, tutDone, _descCleared, _descOpenFor). Groups, in order. tiers: DESCENT_TIERS; label and damage hold descentTierLabel(p) and descentTierFromPct(p) as [lo, hi] for p = 0..100. descent: per world {seed, type, band}, biome is biomeFor as [key, name, land] or null, and at holds, per seconds and then per wave-off count listed in the input, descentFor as [pct, lo, hi, wx]. gear: descentFor(...).pct at 45 seconds for the worn items and wave-offs of the input. roll: _descRoll with the two random values, the health, the wave-offs, hull1 and the worn items of the input; output is [landed, health after, wave-offs after, toast as [title, text] or null, descentFor(...).pct afterwards]. prompt: openDescentBox for a world with the name of the input (null: no name) at the seconds of the input, as [title, the risk element\'s innerHTML]. safe: rows of [tutDone, seed, landed, cleared seed, descentSafe(seed)].',
    record: ({ script }) => recordLegacyDescent(script, false),
  },
  'landing-descent-edges': {
    test: 'apps/game/test/descent-policy.test.ts',
    kind: 'outputs',
    taken: 'More of the v1 descent rules, run exactly as landing-descent runs them (the same slices and the same supplied clock, band, dice and page), with equipAff also set by the case. Groups, in order. edge-roll: _descRoll with a first random value on and beside the boundary of the odds (pct/100, one percent either side, and 1e-9 either side; values outside [0, 1) left out), for seven world types, two seeds, two times and three wave-off counts; input.pct is descentFor(...).pct before the roll; output is [landed, health after, wave-offs after, toast as [title, text] or null, descentFor(...).pct afterwards]. edge-fire: for the first world (types in order, bands in order, seeds 1..300) whose biome has each landing value, a roll that lands (random 0); output is [landed, toast or null]. edge-gear: worn pieces with a seeded affix (equipAff: slot to {k, v, forId}), at 45 seconds; output is [descentFor(...).pct before, landed, health after, wave-offs after, toast, descentFor(...).pct afterwards] for a roll with both random values 0.999.',
    record: ({ script }) => recordLegacyDescent(script, true),
  },
};

/** Builds one fixture object from the v1 folder's files. `readV1File(relativePath)` returns a Buffer. */
export function recordV1Fixture(name, readV1File) {
  const recorder = recorders[name];
  if (!recorder) throw new Error(`no recorder named ${name}`);
  const htmlBytes = readV1File(GAME_HTML);
  const html = htmlBytes.toString('utf8');
  const script = extractTrackedV1Script(html);
  const cases = recorder.record({ html, script, readV1File });
  return {
    kind: recorder.kind,
    source: `${GAME_HTML} sha256:${sha256(htmlBytes)} bytes:${htmlBytes.length}`,
    test: recorder.test,
    provenance: {
      htmlSha256: sha256(htmlBytes),
      htmlBytes: htmlBytes.length,
      scriptSha256: sha256(script),
      scriptBytes: Buffer.byteLength(script),
    },
    taken: recorder.taken,
    cases,
  };
}

/** Stable text: header fields one per line, then one case per line. */
export function serializeFixture(fixture) {
  const { cases, ...header } = fixture;
  const head = Object.entries(header).map(([key, value]) => ` ${JSON.stringify(key)}: ${JSON.stringify(value)},`);
  const body = cases.map((c, i) => `  ${JSON.stringify(c)}${i < cases.length - 1 ? ',' : ''}`);
  return ['{', ...head, ' "cases": [', ...body, ' ]', '}', ''].join('\n');
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) args[argv[i].replace(/^--/, '')] = argv[i + 1];
  return args;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { ref, only } = parseArgs(process.argv.slice(2));
  const names = only === undefined ? Object.keys(recorders) : [only];
  if (!ref || names.some((name) => !recorders[name])) {
    console.error(`usage: node tools/record-v1-fixtures.mjs --ref <path> [--only <${Object.keys(recorders).join('|')}>]`);
    process.exit(2);
  }
  const root = resolve(ref);
  const readV1File = (file) => readFileSync(join(root, file));
  const outDir = fileURLToPath(new URL('../fixtures/v1/recorded/', import.meta.url));
  mkdirSync(outDir, { recursive: true });
  for (const name of names) {
    const fixture = recordV1Fixture(name, readV1File);
    writeFileSync(join(outDir, `${name}.json`), serializeFixture(fixture));
    console.log(`recorded ${name}: ${fixture.kind}, ${fixture.cases.length} cases`);
  }
}
