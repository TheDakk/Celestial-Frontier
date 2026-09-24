// Films the painted library's land/air pairs through the E1.5 harness (tools/battle2-proof/native-runner.mjs), one after
// another (the harness holds a workspace lock). Run from port/v2 with approved out-of-sandbox execution (browser-owning).
import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process';
const R = path.resolve(import.meta.dirname, '../..'), O = import.meta.dirname;
const fit = (key) => path.join(R, JSON.parse(fs.readFileSync(path.join(R, 'port/v2/apps/game/assets/painted-cards', key, 'SOURCE.json'), 'utf8')).fitDir);
const pairs = [['python-vs-tarantula', 'python', 'tarantula'], ['eagle-vs-beetle', 'eagle', 'beetle'], ['chimpanzee-vs-centipede', 'chimpanzee', 'centipede'], ['treefrog-vs-fruitbat', 'tree-frog', 'fruit-bat']];
const only = process.argv[2] && process.argv[2] !== 'all' ? process.argv[2] : null, take = process.argv[3] ?? '01';
for (const [name, a, b] of pairs) { if (only && only !== name) continue;
  const out = path.join(O, name + '-' + take), r = spawnSync(process.execPath, ['tools/battle2-proof/native-runner.mjs', fit(a), fit(b), out, path.join(O, 'script-' + name + '.json')], { cwd: path.join(R, 'port/v2'), encoding: 'utf8', maxBuffer: 1 << 26 });
  fs.writeFileSync(out + '.log', (r.stdout ?? '') + (r.stderr ?? ''));
  let rep = {}; try { rep = JSON.parse(fs.readFileSync(path.join(out, 'report.json'), 'utf8')); } catch {}
  console.log(JSON.stringify({ name, fit: rep.gates?.fit, widthCapped: rep.gates?.widthCapped, exit: r.status, status: rep.status, error: (rep.error ?? '').slice(0, 220), attacks: rep.gates?.attacks, habitat: rep.gates?.habitat, refusals: rep.capture?.refusalsAtEnd, cpuP95Ms: rep.capture?.cpuP95Ms, frames: rep.capture?.frames }));
}
