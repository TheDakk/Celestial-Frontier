// The art agent's gas kit, read where it lies: packed as the one text the game's kit reader takes, its port-check
// table and its painter's map hashes read from its rules, and its own generator run on a list of seeds. Shared by
// tools/record-planet-kit.mjs (which records the plans the gate holds the code to) and tools/check-planet-kit.mjs
// (which proves the code on the live kit, by hand). Reads the kit folder only; writes nothing. The kit's drawings
// stay in the art agent's folder: nothing here is recorded into this repository but numbers.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

/* The gas kit's literal porting tables, as its zonal edition states them (gas/discovery/zonal.py): colour families
   in order with their spreads and the two ends of each daylight range; the ribbons that have one drawing, with each
   tier's source and nominal depth; the candidate lists; each event's drawing and ink swaps. */
export const GAS_TABLES = [
  'table families warm blue chalk night green violet',
  'table spreads 21 25 90 95 34 29',
  'table night night',
  'table skies/warm d7b779 c59965 b27a53 8b5d4d fff3d8 f8dfad ecc288 dba673 d58950 ba623d 914635 5c383a bfaa93 a18d80 816f70 5e5763',
  'table skies/blue 82abcc 6695bd 5179a3 415d86 e3f0ea c5e3e5 9dc8da 84abcf 6d9bc2 4b71a1 374c7d 2c345b a5c6d4 859eb9 687e9c 495975',
  'table skies/chalk e7e4da d3d1c5 c0bbaf 98918d fffdf4 f4f1e8 e9e5dc dbd8d2 bdb0a2 9f9094 746977 504959 f1eeea dbd9de c9c5cc ada9b7',
  'table skies/night 403c50 302e40 242537 171925 c0cbd5 485469 374258 2c3245 866b63 4b3b45 332634 211c29 7a818f 4b4b5a 343444 212233',
  'table skies/green a3b29d 83a394 699088 547572 ecedcb d0debc b4cfaf 9fbaa4 7ca594 52877e 376765 294851 b6bdac 99aa9c 7a908b 596f74',
  'table skies/violet c0a4b5 a58baf 886e97 705680 f5e9d1 e8d3c6 d5b9c3 be9ebd ad859e 8a6388 68476d 44374e c3b6cb a99bbd 8c7e9d 695f7d',
  'table mineral/warm cba07f ae7952 925f42 714839 f7d7b1 eabc8c d79967 c78051 c65c42 9b443c 743437 4c2c32 a99287 8a7678 6d616b 504658',
  'table mineral/blue 8aaedc 668dc3 4c69a4 3b548a d6eafa b6d6f3 95b9e7 7b9cd6 626aad 4c5397 373f7b 272e58 b4b9cc 8997ba 667ba1 485d80',
  'table mineral/chalk e9d6ca d9c5b8 c6ada0 a88f8a fff9e6 faefd9 eadfcf dad0c7 c2a295 a28389 836c79 615466 e2dfe0 d1cdd3 bbb8c6 9b9aaa',
  'table mineral/night 394953 29363c 202a31 181e26 c4cfc0 45595b 30444a 25353a 658282 354b56 253640 19232d 728486 454e53 333940 21272e',
  'table mineral/green a3aa79 85935f 647d56 4a654a e4e4b0 cdd29b b7c38c 9dad77 6e9780 4c7e6d 345e5a 254649 b8c1b4 94a99e 728b83 536e6d',
  'table mineral/violet ba90ac a4749f 885987 6f476c f3d6bb e5bfae d5a3a2 bd8793 886ba5 6d518e 51386c 382a51 b8b0c7 9b8eaf 807193 605775',
  'table bright ice linen veil pearl sail',
  'table belt dawn copper channel',
  'table active festoon scarp stream trough',
  'table ribbon/north discovery/horizon 32 discovery/horizon 64',
  'table ribbon/silk discovery/silk 32 discovery/silk 64',
  'table ribbon/underflow discovery/underflow 32 discovery/underflow 64',
  'table ribbon/south third/cap 8 third/cap 8',
  'table ribbon/ice weather/bright-drift 40 weather/bright-drift 20',
  'table ribbon/linen third/linen 12 third/shelf 8',
  'table ribbon/veil third/veil 11 third/veil 10',
  'table ribbon/pearl third/pearl 8 third/pearl 10',
  'table ribbon/dawn third/apricot 8 third/dawn 8',
  'table ribbon/copper third/copper 13 third/copper 10',
  'table ribbon/festoon weather/festoon 12 weather/festoon 12',
  'table ribbon/channel weather/pearl-belt 14 weather/pearl-belt 10',
  'table ribbons-else discovery 32 64',
  'table weather pearls dark-barge polar-hood standing-wave cloud-fan squall-line split-jet anvil-bank',
  'table rare breaking-comb banner-front',
  'table deep-hosts pearls standing-wave cloud-fan anvil-bank banner-front',
  'table event/pearls weather/pearls 8:9',
  'table event/dark-barge weather/dark-barge 3:10',
  'table event/polar-hood weather/polar-hood',
  'table event/standing-wave discovery/wave-train 8:10',
  'table event/cloud-fan discovery/fan-plume 8:11 7:2',
  'table event/squall-line discovery/thunderheads',
  'table event/split-jet discovery/split-jet 4:12 3:10',
  'table event/anvil-bank discovery/cloud-anvil 8:10 7:2',
  'table event/breaking-comb discovery/breaking-comb',
  'table event/banner-front discovery/banner-front',
  'table night-ribbon 5:13',
  'table night-event/standing-wave 6:5',
  'table night-event/cloud-fan 6:5',
  'table night-event/anvil-bank 6:5',
  'table night-event/pearls 6:5',
  'table night-event/dark-barge 7:5',
];

const grid = (name, rows) => [`grid ${name} ${rows[0].length} ${rows.length}`, ...rows].join('\n');

/** The kit as one text: the tables above and every drawing they name, each tier read from its own folder
 *  (`gas/<study>/wrap<width>/<name>.txt`), in name order. */
export function packGasKit(kitsFolder) {
  const lines = ['kit 1 gas', ...GAS_TABLES];
  const words = GAS_TABLES.map((line) => line.split(' '));
  const list = (name) => words.find((w) => w[1] === name).slice(2);
  for (const [width, at] of [[384, 0], [192, 2]]) {
    const names = new Set();
    for (const w of words) {
      if (w[1].startsWith('ribbon/')) names.add(w[2 + at]);
      if (w[1].startsWith('event/')) names.add(w[2]);
    }
    const single = new Set(words.filter((w) => w[1].startsWith('ribbon/')).map((w) => w[1].slice(7)));
    for (const name of [...list('bright'), ...list('belt'), ...list('active')]) {
      if (!single.has(name)) for (const variant of [1, 2]) names.add(`discovery/${name}-${variant}`);
    }
    lines.push(`tier ${width}`);
    for (const name of [...names].sort()) {
      const [study, piece] = name.split('/');
      const rows = readFileSync(join(kitsFolder, 'gas', study, `wrap${width}`, `${piece}.txt`), 'utf8').split('\n').filter((row) => row.length > 0);
      lines.push(grid(name, rows));
    }
  }
  return lines.join('\n') + '\n';
}

/** The port-check table of the kit's rules (gas/discovery/zonal.md, "Port checks"): a row a seed, the first sixteen
 *  hexadecimal digits of the hash of its finished map at 384 by 128 and at 192 by 64. Throws when the section or its
 *  rows cannot be read. */
export function readPortChecks(kitsFolder) {
  const text = readFileSync(join(kitsFolder, 'gas', 'discovery', 'zonal.md'), 'utf8');
  const at = text.indexOf('## Port checks');
  if (at < 0) throw new Error('gas/discovery/zonal.md has no "Port checks" section');
  const rows = [];
  for (const line of text.slice(at).split('\n').slice(1)) {
    if (line.startsWith('## ')) break;
    const m = /^\|\s*(\d+)\s*\|\s*([0-9a-f]{16})\s*\|\s*([0-9a-f]{16})\s*\|\s*$/.exec(line);
    if (m !== null) rows.push({ seed: Number(m[1]), wide: m[2], narrow: m[3] });
  }
  if (rows.length === 0) throw new Error('the "Port checks" section of gas/discovery/zonal.md holds no row of a seed and two hashes');
  return rows;
}

/** The kit's own painter's finished maps of its seeded (zonal) worlds, from the manifest its rules link to
 *  (gas/kit.md, "Hashes and run counts"): a row a seed and width, the SHA-256 of the map's bytes. Throws when the
 *  link or the manifest's zonal rows cannot be read. */
export function readZonalMaps(kitsFolder) {
  const rules = readFileSync(join(kitsFolder, 'gas', 'kit.md'), 'utf8');
  const link = /\[Hashes and run counts\]\(([^)]+\.tsv)\)/.exec(rules);
  if (link === null) throw new Error('gas/kit.md no longer links to its "Hashes and run counts" manifest');
  const lines = readFileSync(join(dirname(join(kitsFolder, 'gas', 'kit.md')), link[1]), 'utf8').split('\n');
  const head = (lines[0] ?? '').split('\t');
  const at = ['series', 'world', 'width', 'indices_sha256'].map((name) => head.indexOf(name));
  if (at.some((i) => i < 0)) throw new Error('the gas map manifest has no series, world, width and indices_sha256 columns');
  const maps = [];
  for (const line of lines.slice(1)) {
    const cells = line.split('\t');
    if (cells[at[0]] !== 'zonal') continue;
    const [seed, width, hash] = [Number(cells[at[1]]), Number(cells[at[2]]), cells[at[3]]];
    if (!Number.isInteger(seed) || (width !== 384 && width !== 192) || !/^[0-9a-f]{64}$/.test(hash)) throw new Error(`the gas map manifest holds a zonal row that is no seed, width and hash: ${line.slice(0, 60)}`);
    maps.push({ seed, width, hash });
  }
  if (maps.length === 0) throw new Error('the gas map manifest holds no zonal row');
  return maps;
}

/** The seeds whose plans are recorded: 1 to 24, the kit's first port-check seeds 49 and 96, two seeds past 2^31; the
 *  generator adds the first two and the last seed past 2^31 that open with a rare kind of weather. */
export const PLAN_SEEDS = [...Array.from({ length: 24 }, (_, i) => i + 1), 49, 96, 2 ** 31 + 5, 2 ** 32 - 1];
const PLAN_SOURCE = "the gas kit's own generator (plan_for in gas/discovery/zonal.py), run on each seed; small is each ribbon's drawing and nominal depth in the 192 tier";
const PYTHON = `
import sys, json
from unittest.mock import MagicMock
numpy = MagicMock()
numpy.clip = lambda v, lo, hi: max(lo, min(hi, v))
sys.modules['numpy'] = numpy
sys.modules['PIL'] = MagicMock()
sys.path.insert(0, sys.argv[1])
from generate import Dice
from zonal import plan_for, RARE
def plan(s):
    p = plan_for(s, Dice(s))
    return p, dict(family=p['family'], profile=p['profile'], ramps=p['ramps'], winds=p['winds'],
        ribbons=[dict(source=r['source'], nominal=r['nominal'], top=r['top'], depth=r['depth'], shift=r['shift'], mirror=r['mirror']) for r in p['tiers']['384']['ribbons']],
        small=[r['source']+'/'+str(r['nominal']) for r in p['tiers']['192']['ribbons']],
        storms=[dict(name=e['name'], x=e['x'], y=e['y'], sx=e['sx'], sy=e['sy'], mirror=e['mirror'], source=e['source']) for e in p['tiers']['384']['storms']])
rare = lambda s: plan(s)[0]['tiers']['384']['storms'][0]['name'] in RARE
seeds = json.loads(sys.argv[2])
up = [s for s in range(2**31 + 1, 2**31 + 400) if rare(s)][:2]
down = [s for s in range(2**32 - 2, 2**32 - 400, -1) if rare(s)][:1]
out = {}
for s in seeds + up + down:
    out[str(s)] = plan(s)[1]
print(json.dumps(dict(source=sys.argv[3], plans=out), separators=(',', ':')))
`;

/** What the kit's own generator plans for PLAN_SEEDS and the three rare openings, as the text of the plans fixture.
 *  The generator is run by python3 with no bytecode kept. Planning uses none of its picture libraries, which its
 *  files import all the same, so they are stood in for by modules that answer anything; the one function planning
 *  does call (a clamp) is real. Throws one line when the generator does not run. */
export function generatedPlans(kitsFolder) {
  const run = spawnSync('python3', ['-B', '-c', PYTHON, join(kitsFolder, 'gas', 'discovery'), JSON.stringify(PLAN_SEEDS), PLAN_SOURCE], { encoding: 'utf8', maxBuffer: 1 << 26, env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' } });
  if (run.status !== 0) throw new Error(`the kit's generator did not run: ${(run.stderr || run.error?.message || '').trim().split('\n').pop()}`);
  return run.stdout;
}
