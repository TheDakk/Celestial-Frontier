/* THE NEGATIVE CONTROLS for tools/overridecheck.mjs.
   Project law: a check that has never failed has never been shown to work.
   Each control breaks the guarded thing on purpose and requires exit 1.

   C exists because the tool's first version read a HARDCODED file list, so
   wave 8's new faunaoverrides3.ts was invisible — it reported "no change"
   while 105 new routes went unchecked. D exists because wave 9 found a THIRD
   kind of dead route: a species keyed in two tables of the same kingdom, where
   only the first table's painter ever runs and BOTH keys resolve to a real
   species — invisible to the dead-route check by construction.
   Usage: node tools/overridecheck.control.mjs  (exit 0 = every control fires) */
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
/* a temp override FILE whose table name the tool classifies, so the key
   inside it is actually checked rather than skipped as unclassified */
const tmpTable = (key) => `export const FAUNA3_NAME: Record<string, unknown> = {\n  '${key}': 1,\n};\n`;

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

  fs.writeFileSync(TMP, tmpTable('Zzz Phantom Species'));
  check('C: a NEW override file with a dead key is not invisible', run(), 'fail');
  fs.unlinkSync(TMP);

  fs.writeFileSync(TMP, tmpTable('Cobra'));
  check('D: a species shadowed by another table of the same kingdom', run(), 'fail');
  fs.unlinkSync(TMP);

  fs.writeFileSync(TMP, `export const ZZUNKNOWN_NAME: Record<string, unknown> = {\n  'Cobra': 1,\n};\n`);
  check('E: a table this tool cannot classify is reported, not skipped silently', run(), 'fail');
  fs.unlinkSync(TMP);

  /* F: a table whose keys all resolve but which resolveOverride never reads —
     the wave-11 bug: 280 routes written, imported, and unreachable */
  const ROUTER = path.join(SRC, 'speciesoverrides.ts');
  const routerOrig = fs.readFileSync(ROUTER, 'utf8');
  /* The lineage-owner helper also consults this table before resolveOverride.
     Remove every occurrence so the control still breaks the actual router body
     instead of stopping at a preparatory membership check. */
  fs.writeFileSync(ROUTER, routerOrig.replaceAll('FLORA_ICONIC[name] || FLORA2_SPEC[name]', 'FLORA_ICONIC[name]'));
  check('F: a table imported but never consulted by the router', run(), 'fail');
  fs.writeFileSync(ROUTER, routerOrig);

  check('restored: clean tables again', run(), 'pass');
} finally { restore(); }
process.exit(pass ? 0 : 1);
