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
  'landing-descent': {
    test: 'apps/game/test/descent-policy.test.ts',
    kind: 'outputs',
    taken: 'The v1 descent rules, run with new Function over unique script slices: mulberry32, hashInt, "const BIOME_SETS={" to the end of biomeForLanding (for biomeFor), descentTierFromPct, DESCENT_TIERS, descentBonus, descentTierLabel, _descWx, descentFor, descentSafe, _descRoll, wxEventFor with WX_EVENT_WORD, openDescentBox, and the gear readers ITEMS, ITEM_BY, EQ_SLOTS, itemCount, _slotAffix, _equipBonus, _equipLandFam. Supplied by the recorder: perfTime (the case\'s seconds), climateBand (the case\'s band), st ({sys: null}), Math (the real one with random replaced by the case\'s queue of values), techOwned, landed, toast, queueSave, renderHP, playFailTone, fxShake, a document whose elements keep textContent and innerHTML, and the containers the script declares beside them (_waveOffs, items, equip, equipAff, hp, tutDone, _descCleared, _descOpenFor). Groups, in order. tiers: DESCENT_TIERS; label and damage hold descentTierLabel(p) and descentTierFromPct(p) as [lo, hi] for p = 0..100. descent: per world {seed, type, band}, biome is biomeFor as [key, name, land] or null, and at holds, per seconds and then per wave-off count listed in the input, descentFor as [pct, lo, hi, wx]. gear: descentFor(...).pct at 45 seconds for the worn items and wave-offs of the input. roll: _descRoll with the two random values, the health, the wave-offs, hull1 and the worn items of the input; output is [landed, health after, wave-offs after, toast as [title, text] or null, descentFor(...).pct afterwards]. prompt: openDescentBox for a world with the name of the input (null: no name) at the seconds of the input, as [title, the risk element\'s innerHTML]. safe: rows of [tutDone, seed, landed, cleared seed, descentSafe(seed)].',
    record: ({ script }) => {
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
            tutDone=o.tutDone!==false; for(const k in equip) delete equip[k]; Object.assign(equip, o.equip||{}); },
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
    },
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
