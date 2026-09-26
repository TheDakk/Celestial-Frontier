// Separate Node-test owner: no browser and no checkout lock.
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const files = fs.readdirSync(path.join(root, 'tools'), {recursive: true})
  .filter(name => name.endsWith('.test.mjs')).sort().map(name => path.join(root, 'tools', name));
if (!files.length) throw Error('Node tool test inventory is empty');
const result = spawnSync(process.execPath, ['--test', ...files], {cwd: root, stdio: 'inherit'});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
