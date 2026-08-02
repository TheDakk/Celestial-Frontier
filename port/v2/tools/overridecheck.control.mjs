/* THE NEGATIVE CONTROLS for tools/overridecheck.mjs.
   Project law: a check that has never failed has never been shown to work.
   Each control breaks the guarded thing on purpose and requires exit 1.
   Control C exists because the tool's FIRST version read a hardcoded file
   list, so wave 8's new faunaoverrides3.ts was invisible to it — it happily
   reported "no change" while 106 new routes went unchecked. The same
   blindness the tool exists to catch, inside the tool.
   Usage: node tools/overridecheck.control.mjs  (exit 0 = all controls fire) */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const SRC = path.join(root, 'packages/art/src');
const VICTIM = path.join(SRC, 'faunaoverrides2.ts');
const TMP = path.join(SRC, 'zztmpoverrides.ts');
const orig = fs.readFileSync(VICTIM, 'utf8');
const run = () => { try { execSync('node tools/overridecheck.mjs', { cwd: root, stdio: 'pipe' }); return 0; } catch (e) { return e.status; } };

let pass = true;
const check = (label, code, want) => {
  const ok = want === 'fail' ? code !== 0 : code === 0;
  console.log(`  ${ok ? 'PASS' : '★ FAIL'}  ${label} (exit ${code}, wanted ${want})`);
  if (!ok) pass = false;
};
const restore = () => { fs.writeFileSync(VICTIM, orig); try { fs.unlinkSync(TMP); } catch { /* absent */ } };

try {
  check('baseline: clean tables', run(), 'pass');

  fs.writeFileSync(VICTIM, orig.replace("  'Cobra': (c, g, p, n) =>",
    "  'Zzz Nonexistent Beast': (c, g, p, n) => reptSnake(c, g, p, {}, n),\n  'Cobra': (c, g, p, n) =>"));
  check('A: a key naming no catalog species', run(), 'fail');
  fs.writeFileSync(VICTIM, orig);

  fs.writeFileSync(VICTIM, orig.replace("  'Python': (c, g, p, n) =>",
    "  'Cobra': (c, g, p, n) => reptSnake(c, g, p, {}, n),\n  'Python': (c, g, p, n) =>"));
  check('B: a duplicate key (the later entry silently wins)', run(), 'fail');
  fs.writeFileSync(VICTIM, orig);

  /* C: a WHOLE NEW override file must be seen — the hardcoded-list bug */
  fs.writeFileSync(TMP, `export const ZZTMP_NAME: Record<string, number> = {\n  'Zzz Phantom Species': 1,\n};\n`);
  check('C: a NEW override file with a dead key is not invisible', run(), 'fail');
  fs.unlinkSync(TMP);

  check('restored: clean tables again', run(), 'pass');
} finally { restore(); }
process.exit(pass ? 0 : 1);
