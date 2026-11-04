// Separate Node-test owner: no browser and no checkout lock.
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const files = fs.readdirSync(path.join(root, 'tools'), {recursive: true})
  .filter(name => name.endsWith('.test.mjs')).sort().map(name => path.join(root, 'tools', name));
if (!files.length) throw Error('Node tool test inventory is empty');
// Tests that reach the Art Kit CLI export take its exclusive, fail-fast workspace lock, so two of them in
// parallel refuse each other (reproduced 4/4). They run one at a time after the parallel set.
const takesExportLock = file => /compile-master-prompt|compile-library-master|kit-export/.test(fs.readFileSync(file, 'utf8'));
const serial = files.filter(takesExportLock), parallel = files.filter(file => !serial.includes(file));
let status = 0;
for (const [args, set] of [[['--test'], parallel], [['--test', '--test-concurrency=1'], serial]]) {
  if (!set.length) continue;
  const result = spawnSync(process.execPath, [...args, ...set], {cwd: root, stdio: 'inherit'});
  if (result.error) throw result.error;
  status ||= result.status ?? 1;
}
process.exitCode = status;
