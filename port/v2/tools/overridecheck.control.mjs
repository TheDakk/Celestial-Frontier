/* THE NEGATIVE CONTROLS for tools/overridecheck.mjs.
   Project law: a check that has never failed has never been shown to work.
   Finding controls require exit 1 plus their own diagnostic; parser-damage
   controls require exit 2; overcapture controls must remain clean.

   C exists because the tool's first version read a HARDCODED file list, so
   wave 8's new faunaoverrides3.ts was invisible — it reported "no change"
   while 105 new routes went unchecked. D exists because wave 9 found a THIRD
   kind of dead route: a species keyed in two tables of the same kingdom, where
   only the first table's painter ever runs and BOTH keys resolve to a real
   species — invisible to the dead-route check by construction.
   I/J/L/M/N/O cover the grammar contexts that defeated the hand lexer:
   templates, regexes, control heads, keyword-named member calls, Unicode
   identifiers, and restricted-production ASI. K proves malformed table source is
   parser exit 2, never a finding pass. P/Q/R/S prove parenthesized, annotated,
   comment-separated and later declarators are discovered as exact findings.
   T/U prove no literal key is discarded for its length or alphabet; V proves
   CANON cannot silently carry a key with no kingdom separator. W proves a
   later summary reference or inert in-body property label cannot disguise a
   table disconnected from the router. X/Y/Z reject direct, local-alias and
   namespace-alias mutation. AA binds a resolver read to the single real table owner;
   AB proves kingdom-qualified catalogue coverage fails with its own diagnosis;
   AC covers for-of assignment targets; AD closes TypeScript value-wrapper aliases;
   AE rejects callback alias exposure; AF rejects ownerless imported tables;
   AG/AH reject default-module and destructuring aliases; AI rejects inert
   unsupported table members. AJ binds an intact selector to its downstream
   dispatch; AK/AL reject unreachable dupe/quadruped selector predicates;
   AM/AN reject computed-method and prototype-alias escapes; AO rejects an
   inert in-body read that is outside the audited selector/consumer path. AP
   binds painter output through fitInk to the returned canvas; AQ rejects a
   name-indirected prototype escape; AR proves exact recursive import-owner
   provenance; AS rejects a computed inherited-method call. AT rejects a
   shadowed `Object.keys` alias; AU proves shadow direction against traversal
   order; AV rejects a helper-shadowing resolver parameter; AW rejects a
   statically falsy route value; AX/AY/AZ independently prove the canvas,
   ink, and painter-input legs of the returned-canvas contract. BA rejects a
   mutable/reassigned route binding; BB rejects a parameter-returning factory;
   BC covers class-based `Object` shadowing; BD proves truthy is not callable;
   BE covers TypeScript namespace shadowing of the trusted built-in; BF
   independently proves write detection on a function binding; BG binds the
   canvas helpers to stable module declarations. BH/BI protect the built-in
   String/Boolean resolver inputs; BJ binds a local non-canvas route helper.
   BK/BL bind both imported route consumers; BM/BN independently bind the
   canvas-allocation helpers; BO proves imported helpers retain exact owner/name
   provenance rather than merely resolving to some stable function. BP proves
   the catalog denominator includes double-quoted literals through AST parsing.
   BQ pins its read-only runtime consumer; BR/BS reject direct/global-object
   intrinsic poisoning; BT rejects dynamic module escape; BU pins every route
   branch's exact executable furniture; BV/BW/BX pin the three canvas helper
   implementations; BY/BZ prove imports resolve through the exact exported
   table/helper binding; CA binds shadow precedence to selector order; CB proves
   .mts sources and their .mjs imports cannot escape recursive discovery; CC
   rejects a route re-export whose owner escapes that discovered graph; CD
   rejects route-name laundering through an export alias; CE/CF pin the
   allowlisted executable art inputs and live catalog wrapper by byte identity;
   CG rejects an unscanned bare side-effect dependency; CH rejects namespace
   and export-all re-export laundering. CI–CL pin the compositor's free numeric
   dependencies; CM rejects bare re-export side effects; CN proves adjacent
   fauna shadow direction comes from the audited selector order; CO requires
   the returned-canvas serialization call itself to be exact and argument-free;
   CP rejects a curly-apostrophe table key that runtime lookup cannot reach.
   Usage: node tools/overridecheck.control.mjs  (exit 0 = every control fires) */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const SRC = path.join(root, 'packages/art/src');
const VICTIM = path.join(SRC, 'faunaoverrides2.ts');
const TMP = path.join(SRC, `zztmpoverrides-control-${process.pid}.ts`);
const TMP_DIR = path.join(SRC, `zztmpoverrides-control-${process.pid}`);
const TMP_NESTED = path.join(TMP_DIR, 'faunaoverrides2.ts');
const TMP_MTS = path.join(SRC, `zztmpoverrides-control-${process.pid}.mts`);
const ROUTER = path.join(SRC, 'speciesoverrides.ts');
const FLORA = path.join(SRC, 'floraoverrides.ts');
const QUAD = path.join(SRC, 'quadrupedoverrides.ts');
const CATALOG = path.join(root, 'packages/domain/descriptors/src/apphooks.verbatim.js');
const ESCAPE = path.join(root, 'packages/art', `routeescape-control-${process.pid}.ts`);
const VERBATIM = path.join(SRC, 'hdart.verbatim.js');
const CATALOG_WRAPPER = path.join(root, 'packages/domain/descriptors/src/apphooks.ts');
const orig = fs.readFileSync(VICTIM, 'utf8');
const routerOrig = fs.readFileSync(ROUTER, 'utf8');
const floraOrig = fs.readFileSync(FLORA, 'utf8');
const quadOrig = fs.readFileSync(QUAD, 'utf8');
const catalogOrig = fs.readFileSync(CATALOG, 'utf8');
const verbatimOrig = fs.readFileSync(VERBATIM, 'utf8');
const catalogWrapperOrig = fs.readFileSync(CATALOG_WRAPPER, 'utf8');
let victimExpected = orig;
let routerExpected = routerOrig;
let floraExpected = floraOrig;
let quadExpected = quadOrig;
let catalogExpected = catalogOrig;
let escapeExpected = null;
let verbatimExpected = verbatimOrig;
let catalogWrapperExpected = catalogWrapperOrig;
let tmpExpected = null;
let nestedExpected = null;
let mtsExpected = null;
const run = () => {
  try {
    const output = execSync('node tools/overridecheck.mjs', { cwd: root, encoding: 'utf8', stdio: 'pipe' });
    return { code: 0, output };
  } catch (e) {
    return {
      code: typeof e.status === 'number' ? e.status : 2,
      output: String(e.stdout || '') + String(e.stderr || ''),
    };
  }
};

let pass = true;
const check = (label, result, want, diagnostic = null) => {
  const wantedCode = want === 'pass' ? 0 : want === 'fail' ? 1 : 2;
  const status = result.code === wantedCode;
  const diagnosed = want === 'pass' || (diagnostic instanceof RegExp && diagnostic.test(result.output));
  const ok = status && diagnosed;
  console.log(`  ${ok ? 'PASS' : '★ FAIL'}  ${label} (exit ${result.code}, wanted ${want}${diagnostic ? ' + diagnostic' : ''})`);
  if (!diagnosed) console.log('    missing expected diagnostic: ' + diagnostic);
  if (!ok && result.output) console.log(result.output.trimEnd());
  if (!ok) pass = false;
};
const assertCurrent = (file, expected, label) => {
  const current = fs.readFileSync(file, 'utf8');
  if (current !== expected) throw new Error(`${label}: source changed outside this control; refusing to overwrite it`);
};
const writeVictim = (next) => {
  assertCurrent(VICTIM, victimExpected, 'faunaoverrides2.ts');
  fs.writeFileSync(VICTIM, next);
  victimExpected = next;
};
const writeRouter = (next) => {
  assertCurrent(ROUTER, routerExpected, 'speciesoverrides.ts');
  fs.writeFileSync(ROUTER, next);
  routerExpected = next;
};
const writeFlora = (next) => {
  assertCurrent(FLORA, floraExpected, 'floraoverrides.ts');
  fs.writeFileSync(FLORA, next);
  floraExpected = next;
};
const writeQuad = (next) => {
  assertCurrent(QUAD, quadExpected, 'quadrupedoverrides.ts');
  fs.writeFileSync(QUAD, next);
  quadExpected = next;
};
const writeCatalog = (next) => {
  assertCurrent(CATALOG, catalogExpected, 'apphooks.verbatim.js');
  fs.writeFileSync(CATALOG, next);
  catalogExpected = next;
};
const writeEscape = (next) => {
  if (escapeExpected !== null) throw new Error('temporary escaped-owner control source is already owned');
  fs.writeFileSync(ESCAPE, next, { encoding: 'utf8', flag: 'wx' });
  escapeExpected = next;
};
const removeEscape = () => {
  if (escapeExpected === null) return;
  assertCurrent(ESCAPE, escapeExpected, path.basename(ESCAPE));
  fs.unlinkSync(ESCAPE);
  escapeExpected = null;
};
const writeVerbatim = (next) => {
  assertCurrent(VERBATIM, verbatimExpected, 'hdart.verbatim.js');
  fs.writeFileSync(VERBATIM, next);
  verbatimExpected = next;
};
const writeCatalogWrapper = (next) => {
  assertCurrent(CATALOG_WRAPPER, catalogWrapperExpected, 'apphooks.ts');
  fs.writeFileSync(CATALOG_WRAPPER, next);
  catalogWrapperExpected = next;
};
const writeTmp = (next) => {
  if (tmpExpected !== null) throw new Error('temporary control table is already owned');
  fs.writeFileSync(TMP, next, { encoding: 'utf8', flag: 'wx' });
  tmpExpected = next;
};
const removeTmp = () => {
  if (tmpExpected === null) return;
  assertCurrent(TMP, tmpExpected, path.basename(TMP));
  fs.unlinkSync(TMP);
  tmpExpected = null;
};
const writeNested = (next) => {
  if (nestedExpected !== null || fs.existsSync(TMP_DIR)) throw new Error('temporary nested control source is already owned or pre-exists');
  fs.mkdirSync(TMP_DIR);
  try {
    fs.writeFileSync(TMP_NESTED, next, { encoding: 'utf8', flag: 'wx' });
    nestedExpected = next;
  } catch (error) {
    fs.rmdirSync(TMP_DIR);
    throw error;
  }
};
const removeNested = () => {
  if (nestedExpected === null) return;
  assertCurrent(TMP_NESTED, nestedExpected, path.relative(SRC, TMP_NESTED));
  fs.unlinkSync(TMP_NESTED);
  fs.rmdirSync(TMP_DIR);
  nestedExpected = null;
};
const writeMts = (next) => {
  if (mtsExpected !== null) throw new Error('temporary .mts control source is already owned');
  fs.writeFileSync(TMP_MTS, next, { encoding: 'utf8', flag: 'wx' });
  mtsExpected = next;
};
const removeMts = () => {
  if (mtsExpected === null) return;
  assertCurrent(TMP_MTS, mtsExpected, path.basename(TMP_MTS));
  fs.unlinkSync(TMP_MTS);
  mtsExpected = null;
};
const restore = () => {
  const errors = [];
  try { writeVictim(orig); } catch (error) { errors.push(error); }
  try { writeRouter(routerOrig); } catch (error) { errors.push(error); }
  try { writeFlora(floraOrig); } catch (error) { errors.push(error); }
  try { writeQuad(quadOrig); } catch (error) { errors.push(error); }
  try { writeCatalog(catalogOrig); } catch (error) { errors.push(error); }
  try { removeTmp(); } catch (error) { errors.push(error); }
  try { removeNested(); } catch (error) { errors.push(error); }
  try { removeMts(); } catch (error) { errors.push(error); }
  try { removeEscape(); } catch (error) { errors.push(error); }
  try { writeVerbatim(verbatimOrig); } catch (error) { errors.push(error); }
  try { writeCatalogWrapper(catalogWrapperOrig); } catch (error) { errors.push(error); }
  if (errors.length) throw new AggregateError(errors, 'override controls could not safely restore owned files');
};
const replaceOnce = (source, anchor, replacement, label) => {
  const pieces = source.split(anchor);
  if (pieces.length !== 2) throw new Error(`${label}: expected one exact mutation anchor, found ${pieces.length - 1}`);
  return pieces[0] + replacement + pieces[1];
};
/* a temp override FILE whose table name the tool classifies, so the key
   inside it is actually checked rather than skipped as unclassified */
const tmpTable = (key) => `export const FAUNA4_NAME: Record<string, unknown> = {\n  '${key}': () => {},\n};\n`;
const PYTHON = "  'Python': (c, g, p, n) => reptSnake(c, g, p, { hue: '#9a8355', pattern: 'reticulate', gauge: 1.46, constrictor: 'python' }, n),";
const DEAD = (name) => new RegExp(`^  ★ DEAD OVERRIDE ROUTES — painter written, species does not exist:\\n    ${name}  \\(fauna\\)`, 'm');
const DUPLICATE_COBRA = /^  ★ DUPLICATE TABLE KEYS — the later entry silently wins:\n    Cobra  \[faunaoverrides2\.ts:FAUNA2_NAME\]$/m;
const regexEscape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const SHADOW_COBRA = new RegExp(`Cobra \\(fauna\\)  \\[faunaoverrides2\\.ts:FAUNA2_NAME SHADOWS ${regexEscape(path.basename(TMP))}:FAUNA4_NAME\\]`);
const PRIORITY_COBRA = /Cobra \(fauna\)  \[speciesoverrides\.ts:CANON SHADOWS faunaoverrides2\.ts:FAUNA2_NAME\]/;

try {
  check('baseline: clean tables', run(), 'pass');

  writeVictim(replaceOnce(orig,
    "  'Cobra': (c, g, p) => faunaESquamata(c, g, p, 'Cobra'),",
    "  'Zzz Nonexistent Beast': (c, g, p, n) => reptSnake(c, g, p, {}, n),\n  'Cobra': (c, g, p) => faunaESquamata(c, g, p, 'Cobra'),",
    'control A'));
  check('A: a key naming no catalog species', run(), 'fail',
    DEAD('Zzz Nonexistent Beast'));
  writeVictim(orig);

  writeVictim(replaceOnce(orig,
    PYTHON,
    "  'Cobra': (c, g, p, n) => reptSnake(c, g, p, {}, n),\n  'Python': (c, g, p, n) => reptSnake(c, g, p, { hue: '#9a8355', pattern: 'reticulate', gauge: 1.46, constrictor: 'python' }, n),",
    'control B'));
  check('B: a duplicate key (the later entry silently wins)', run(), 'fail',
    DUPLICATE_COBRA);
  writeVictim(orig);

  writeVictim(replaceOnce(orig,
    PYTHON,
    "  'Python': (c, g, p) => faunaESquamata(c, g, p, 'Cobra'),",
    'control G'));
  check('G: an inline plan literal matching a real route is not a table key', run(), 'pass');
  writeVictim(orig);

  writeVictim(replaceOnce(orig,
    PYTHON,
    "  'Python': (c, g, p, n) => true ? 'Cobra' : reptSnake(c, g, p, { hue: '#9a8355', pattern: 'reticulate', gauge: 1.46, constrictor: 'python' }, n),",
    'control H'));
  check('H: a ternary value before a colon is not an object property', run(), 'pass');
  writeVictim(orig);

  writeVictim(replaceOnce(orig,
    PYTHON,
    "  'Python': (c, g, p, n) => `literal } ${({ mark: '[' }).mark}`,\n  'Cobra': (c, g, p, n) => reptSnake(c, g, p, {}, n),",
    'control I'));
  check('I: a duplicate after a template-literal brace remains visible', run(), 'fail',
    DUPLICATE_COBRA);
  writeVictim(orig);

  writeVictim(replaceOnce(orig,
    PYTHON,
    "  'Python': (c, g, p, n) => void /[}\\]\\/]/u,\n  'Cobra': (c, g, p, n) => reptSnake(c, g, p, {}, n),",
    'control J'));
  check('J: a duplicate after a regex delimiter remains visible', run(), 'fail',
    DUPLICATE_COBRA);
  writeVictim(orig);

  writeVictim(replaceOnce(orig,
    PYTHON,
    "  'Python': (c, g, p, n) => { if (n) /}/.test('}'); },\n  'Cobra': (c, g, p, n) => reptSnake(c, g, p, {}, n),",
    'control L'));
  check('L: a duplicate after a control-head regex remains visible', run(), 'fail',
    DUPLICATE_COBRA);
  writeVictim(orig);

  writeVictim(replaceOnce(orig,
    PYTHON,
    "  'Python': (c, g, p, n) => { c.catch(n) / { x: 1 / 2 }; },\n  'Cobra': (c, g, p, n) => reptSnake(c, g, p, {}, n),",
    'control M'));
  check('M: a member named catch is not a control head', run(), 'fail',
    DUPLICATE_COBRA);
  writeVictim(orig);

  writeVictim(replaceOnce(orig,
    PYTHON,
    "  'Python': (c, g, p, n) => α / 2, 'Cobra': (c, g, p, n) => reptSnake(c, g, p, {}, n),",
    'control N'));
  check('N: Unicode identifier grammar cannot hide a later duplicate', run(), 'fail',
    DUPLICATE_COBRA);
  writeVictim(orig);

  writeVictim(replaceOnce(orig,
    PYTHON,
    "  'Python': (c, g, p, n) => { while (n) { break\n    /}/.test('}'); } },\n  'Cobra': (c, g, p, n) => reptSnake(c, g, p, {}, n),",
    'control O'));
  check('O: restricted-production ASI cannot hide a later duplicate', run(), 'fail',
    DUPLICATE_COBRA);
  writeVictim(orig);

  writeVictim(replaceOnce(orig,
    PYTHON,
    "  'Python': (c, g, p, n) => ({ value: 1 ],",
    'control K'));
  check('K: malformed delimiters fail as parser damage', run(), 'parser-fail',
    /Parse failed with 1 error:[\s\S]*Expected[\s\S]*found `\]`[\s\S]*PARSER is broken/);
  writeVictim(orig);

  writeTmp(tmpTable('Zzz Phantom Species'));
  check('C: a NEW override file with a dead key is not invisible', run(), 'fail',
    DEAD('Zzz Phantom Species'));
  removeTmp();

  writeTmp(tmpTable('X'));
  check('T: a one-character literal key is still validated', run(), 'fail', DEAD('X'));
  removeTmp();

  writeTmp(tmpTable('🐉'));
  check('U: a non-ASCII literal key is still validated', run(), 'fail', DEAD('🐉'));
  removeTmp();

  writeTmp(tmpTable('Cobra'));
  check('D: a species shadowed by another table of the same kingdom', run(), 'fail',
    SHADOW_COBRA);
  removeTmp();

  writeTmp(`export const ZZUNKNOWN_NAME: Record<string, unknown> = {\n  'Cobra': () => {},\n};\n`);
  check('E: a table this tool cannot classify is reported, not skipped silently', run(), 'fail',
    /UNCLASSIFIED TABLE[\s\S]*ZZUNKNOWN_NAME/);
  removeTmp();

  writeTmp(`export const FAUNA4_NAME: Record<string, unknown> = ({\n  'Zzz Parenthesized Species': () => {},\n});\n`);
  check('P: a parenthesized route table cannot escape discovery', run(), 'fail',
    DEAD('Zzz Parenthesized Species'));
  removeTmp();

  writeTmp(`export const FAUNA4_NAME: { [name: string]: unknown } = {\n  'Zzz Structural Annotation Species': () => {},\n};\n`);
  check('Q: a structural annotation cannot escape discovery', run(), 'fail',
    DEAD('Zzz Structural Annotation Species'));
  removeTmp();

  writeTmp(`export const/*route table*/FAUNA4_NAME = {\n  'Zzz Comment Gap Species': () => {},\n};\n`);
  check('R: a comment between const and table cannot escape discovery', run(), 'fail',
    DEAD('Zzz Comment Gap Species'));
  removeTmp();

  writeTmp(`export const helper = 1, FAUNA4_NAME = {\n  'Zzz Later Declarator Species': () => {},\n};\n`);
  check('S: a later const declarator cannot escape discovery', run(), 'fail',
    DEAD('Zzz Later Declarator Species'));
  removeTmp();

  writeRouter(replaceOnce(routerOrig,
    "  'fauna|Tardigrade': tardigrade,",
    "  'Tardigrade': tardigrade,\n  'fauna|Tardigrade': tardigrade,",
    'control V'));
  check('V: a CANON key without a kingdom separator cannot disappear', run(), 'parser-fail',
    /CANON key "Tardigrade" has no kingdom separator[\s\S]*PARSER is broken/);
  writeRouter(routerOrig);

  writeRouter(replaceOnce(routerOrig,
    "  'microbe|Green Algae': microAlgaeCell,\n",
    '',
    'control AB'));
  check('AB: removing one cross-kingdom route fails complete coverage', run(), 'fail',
    /INCOMPLETE ROUTE COVERAGE — 1 kingdom-qualified catalog routes have no live override:[\s\S]*Green Algae  \(microbe\)/);
  writeRouter(routerOrig);

  /* F: a table whose keys all resolve and whose ownership helper still sees it,
     but which resolveOverride never reads — the wave-11 bug: 280 routes written,
     imported, and unreachable from the renderer. */
  writeRouter(replaceOnce(routerOrig,
    '    const iconic = FLORA_ICONIC[name] || FLORA2_SPEC[name];',
    '    const iconic = FLORA_ICONIC[name];',
    'control F'));
  check('F: a table imported but never consulted by the router', run(), 'fail',
    /UNWIRED TABLES[\s\S]*FLORA2_SPEC/);
  writeRouter(routerOrig);

  writeRouter(replaceOnce(routerOrig,
    "    const fp = FAUNA_NAME[name] || FAUNA2_NAME[name] || FAUNA3_NAME[name] || BIRD_NAME[name] || INVERT_NAME[name];",
    "    const fp = FAUNA_NAME[name] || FAUNA3_NAME[name] || BIRD_NAME[name] || INVERT_NAME[name];",
    'control W'));
  check('W: a later summary mention cannot disguise an unwired table', run(), 'fail',
    /UNWIRED TABLES[\s\S]*FAUNA2_NAME/);
  writeRouter(routerOrig);

  writeTmp(`export const FAUNA4_NAME = { 'Cobra': () => {} };\nFAUNA4_NAME['Zzz Mutated Species'] = 1;\n`);
  check('X: post-declaration route mutation is parser damage', run(), 'parser-fail',
    /route table appears in an assignment target after its literal declaration[\s\S]*PARSER is broken/);
  removeTmp();

  writeTmp(`export const FAUNA4_NAME = { 'Cobra': () => {} };\nconst escaped = FAUNA4_NAME;\nescaped['Zzz Mutated Species'] = 1;\n`);
  check('Y: alias escape cannot hide later route mutation', run(), 'parser-fail',
    /FAUNA4_NAME route table escapes its supported literal\/read contexts[\s\S]*PARSER is broken/);
  removeTmp();

  writeTmp(`import * as routes from './faunaoverrides3.js';\nroutes.FAUNA3_NAME['Zzz Mutated Species'] = 1;\n`);
  check('Z: namespace alias cannot hide later route mutation', run(), 'parser-fail',
    /namespace imports are unsupported in route-table sources[\s\S]*PARSER is broken/);
  removeTmp();

  writeTmp(`export const FAUNA4_NAME = { 'Cobra': () => {} };\nfor (FAUNA4_NAME['Zzz Mutated Species'] of [FAUNA4_NAME['Cobra']]) {}\n`);
  check('AC: for-of cannot write a post-declaration route', run(), 'parser-fail',
    /route table appears in a for-of assignment target[\s\S]*PARSER is broken/);
  removeTmp();

  writeTmp(`export const FAUNA4_NAME = { 'Cobra': () => {} };\nconst escaped = FAUNA4_NAME as Record<string, unknown>;\nescaped['Zzz Mutated Species'] = 1;\n`);
  check('AD: a TypeScript assertion cannot hide a table alias', run(), 'parser-fail',
    /FAUNA4_NAME route table escapes its supported literal\/read contexts[\s\S]*PARSER is broken/);
  removeTmp();

  writeTmp(`export const FLORA3_DUPES = ['Cobra'];\nFLORA3_DUPES.forEach((_v, _i, sameTable) => { sameTable.push('Zzz Mutated Species'); });\n`);
  check('AE: a callback cannot expose a route table under an untracked alias', run(), 'parser-fail',
    /FLORA3_DUPES route table is called outside exact FLORA_DUPES\.includes\(name\)[\s\S]*PARSER is broken/);
  removeTmp();

  writeTmp('export const harmlessControlBinding = 1;\n');
  writeRouter(replaceOnce(routerOrig,
    "import { FAUNA3_NAME } from './faunaoverrides3.js';\n",
    `import { FAUNA3_NAME } from './faunaoverrides3.js';\nimport { FAUNA5_NAME } from './${path.basename(TMP, '.ts')}.js';\n`,
    'control AF'));
  check('AF: an imported route table must have a scanned declaration owner', run(), 'parser-fail',
    /FAUNA5_NAME is imported\/read by resolveOverride but has no declaration owner[\s\S]*PARSER is broken/);
  writeRouter(routerOrig);
  removeTmp();

  writeTmp(`import routes from './faunaoverrides3.js';\nvoid routes;\n`);
  check('AG: default-module aliases are forbidden in scanned art sources', run(), 'parser-fail',
    /default imports are unsupported in route-table sources[\s\S]*PARSER is broken/);
  removeTmp();

  writeTmp(`const source = { FAUNA4_NAME: { Cobra: 1 } };\nconst { FAUNA4_NAME: escaped } = source;\nvoid escaped;\n`);
  check('AH: object destructuring cannot hide a route-table alias', run(), 'parser-fail',
    /FAUNA4_NAME route table may not be acquired through object destructuring[\s\S]*PARSER is broken/);
  removeTmp();

  writeTmp(`export const FAUNA4_NAME = { 'Cobra': () => {} };\nvoid FAUNA4_NAME.constructor;\n`);
  check('AI: unsupported member syntax is parser damage, not wiring', run(), 'parser-fail',
    /FAUNA4_NAME route table uses unsupported member constructor[\s\S]*PARSER is broken/);
  removeTmp();

  writeRouter(replaceOnce(routerOrig,
    "    if (fp) fp(ink.c, g, palette(g) as Pal, name);",
    "    if (fp) return resolveProcedural(g);",
    'control AJ'));
  check('AJ: an intact selector disconnected from dispatch fails closed', run(), 'parser-fail',
    /resolver selector\/consumer contract changed: fauna selectors do not guard and feed the painter\/fallback that returns the canvas[\s\S]*PARSER is broken/);
  writeRouter(routerOrig);

  writeRouter(replaceOnce(routerOrig,
    "    const dupe = !iconic && FLORA_DUPES.includes(name);",
    "    const dupe = false && FLORA_DUPES.includes(name);",
    'control AK'));
  check('AK: an unreachable duplicate selector predicate fails closed', run(), 'parser-fail',
    /resolver selector\/consumer contract changed: dupe must be gated by !iconic[\s\S]*PARSER is broken/);
  writeRouter(routerOrig);

  writeRouter(replaceOnce(routerOrig,
    "    const quad = !fp ? (QUAD_SPEC[name] || QUAD2_SPEC[name]) : undefined;   /* wave 4: the mammal system */",
    "    const quad = false ? (QUAD_SPEC[name] || QUAD2_SPEC[name]) : undefined;   /* wave 4: the mammal system */",
    'control AL'));
  check('AL: an unreachable quadruped selector predicate fails closed', run(), 'parser-fail',
    /resolver selector\/consumer contract changed: quad must be the !fp-gated quadruped fallback[\s\S]*PARSER is broken/);
  writeRouter(routerOrig);

  writeTmp(`export const FLORA3_DUPES = ['Cobra'];\nconst method = 'forEach';\nFLORA3_DUPES[method]((_v, _i, sameTable) => { sameTable.push('Zzz Mutated Species'); });\n`);
  check('AM: a computed method cannot expose a route table callback alias', run(), 'parser-fail',
    /FLORA3_DUPES route table is called outside exact FLORA_DUPES\.includes\(name\)[\s\S]*PARSER is broken/);
  removeTmp();

  writeTmp(`export const FAUNA4_NAME = { 'Cobra': () => {} };\nconst escaped = FAUNA4_NAME['__proto__'] as unknown as Record<string, unknown>;\nescaped['Zzz Mutated Species'] = FAUNA4_NAME[name];\n`);
  check('AN: a computed prototype read cannot escape under an alias', run(), 'parser-fail',
    /FAUNA4_NAME route table uses unsupported computed member[\s\S]*PARSER is broken/);
  removeTmp();

  let inertRouter = replaceOnce(routerOrig,
    "    const fp = FAUNA_NAME[name] || FAUNA2_NAME[name] || FAUNA3_NAME[name] || BIRD_NAME[name] || INVERT_NAME[name];",
    "    const fp = FAUNA_NAME[name] || FAUNA3_NAME[name] || BIRD_NAME[name] || INVERT_NAME[name];",
    'control AO selector');
  inertRouter = replaceOnce(inertRouter,
    "    fitInk(ink.cv, c, 'fauna:' + name);",
    "    fitInk(ink.cv, c, Boolean(FAUNA2_NAME[name]) ? 'fauna:' + name : 'fauna:' + name);",
    'control AO inert read');
  writeRouter(inertRouter);
  check('AO: inert in-body mentions cannot disguise a disconnected table', run(), 'parser-fail',
    /resolver selector\/consumer contract changed: resolveOverride contains a route-table member outside the audited selector initializers[\s\S]*PARSER is broken/);
  writeRouter(routerOrig);

  writeRouter(replaceOnce(routerOrig,
    "    fitInk(ink.cv, c, 'fauna:' + name);",
    '    void 0;',
    'control AP'));
  check('AP: painter output must be fitted into the returned canvas', run(), 'parser-fail',
    /resolver selector\/consumer contract changed: fauna selectors do not guard and feed the painter\/fallback that returns the canvas[\s\S]*PARSER is broken/);
  writeRouter(routerOrig);

  writeTmp(`export const FAUNA4_NAME = { 'Cobra': () => {} };\nconst name = '__proto__';\nconst escaped = FAUNA4_NAME[name] as unknown as Record<string, unknown>;\nescaped['Zzz Mutated Species'] = 1;\n`);
  check('AQ: a name-indirected prototype read cannot escape under an alias', run(), 'parser-fail',
    /FAUNA4_NAME route table uses unsupported computed member[\s\S]*PARSER is broken/);
  removeTmp();

  writeNested("export { FAUNA2_NAME } from '../faunaoverrides2.js';\n");
  writeRouter(replaceOnce(routerOrig,
    "import { FAUNA2_NAME } from './faunaoverrides2.js';",
    `import { FAUNA2_NAME } from './${path.basename(TMP_DIR)}/faunaoverrides2.js';`,
    'control AR'));
  check('AR: same-basename nested imports cannot impersonate the declaration owner', run(), 'parser-fail',
    /FAUNA2_NAME is read by resolveOverride from zztmpoverrides-control-\d+\/faunaoverrides2\.ts, but its only declaration owner is faunaoverrides2\.ts[\s\S]*PARSER is broken/);
  writeRouter(routerOrig);
  removeNested();

  writeTmp(`export const FAUNA4_NAME = { 'Cobra': () => {} };\nconst name = 'valueOf';\nconst escaped = FAUNA4_NAME[name](null as never) as unknown as Record<string, unknown>;\nescaped['Zzz Mutated Species'] = 1;\n`);
  check('AS: an inherited computed method cannot return a route-table alias', run(), 'parser-fail',
    /FAUNA4_NAME route table is called outside exact FLORA_DUPES\.includes\(name\)[\s\S]*PARSER is broken/);
  removeTmp();

  writeTmp(`export const FAUNA4_NAME: Record<string, unknown> = { 'Cobra': () => {} };\nconst Object = { keys: (value: Record<string, unknown>) => value };\nconst escaped = Object.keys(FAUNA4_NAME);\nescaped['Zzz Mutated Species'] = 1;\n`);
  check('AT: a shadowed Object.keys cannot return a route-table alias', run(), 'parser-fail',
    /shadowing the built-in Object binding is unsupported in route-table sources[\s\S]*PARSER is broken/);
  removeTmp();

  writeRouter(replaceOnce(routerOrig,
    "  'fauna|Bat': (c, g, pp) => faunaBat(c, g, speciesHue(pp, '#4a423b'), 'Bat'),",
    "  'fauna|Cobra': faunaBear,\n  'fauna|Bat': (c, g, pp) => faunaBat(c, g, speciesHue(pp, '#4a423b'), 'Bat'),",
    'control AU'));
  check('AU: shadow direction follows resolver priority, not file traversal', run(), 'fail',
    PRIORITY_COBRA);
  writeRouter(routerOrig);

  writeRouter(replaceOnce(routerOrig,
    'export function resolveOverride(g: G): string | null {',
    'export function resolveOverride(g: G, fitInk: (src: HTMLCanvasElement, dst: Ctx, who: string) => void = () => {}): string | null {',
    'control AV'));
  check('AV: a resolver parameter cannot shadow the canvas compositor', run(), 'parser-fail',
    /resolver selector\/consumer contract changed: resolveOverride must have only its audited g parameter[\s\S]*PARSER is broken/);
  writeRouter(routerOrig);

  writeVictim(replaceOnce(orig, PYTHON, "  'Python': null!,", 'control AW'));
  check('AW: a statically falsy table value is not a live route', run(), 'parser-fail',
    /route "Python" does not satisfy its statically live value contract[\s\S]*PARSER is broken/);
  writeVictim(orig);

  writeRouter(replaceOnce(routerOrig,
    "    if (!fp && !quad) return null;\n    const { cv, c } = newCanvas();",
    "    if (!fp && !quad) return null;\n    const { cv, c } = newInk();",
    'control AX'));
  check('AX: the returned canvas must originate from newCanvas', run(), 'parser-fail',
    /resolver selector\/consumer contract changed: fauna selectors do not guard and feed the painter\/fallback that returns the canvas[\s\S]*PARSER is broken/);
  writeRouter(routerOrig);

  writeRouter(replaceOnce(routerOrig,
    "    const ink = newInk();\n    if (fp) fp(ink.c, g, palette(g) as Pal, name);",
    "    const ink = newCanvas();\n    if (fp) fp(ink.c, g, palette(g) as Pal, name);",
    'control AY'));
  check('AY: the detached painter surface must originate from newInk', run(), 'parser-fail',
    /resolver selector\/consumer contract changed: fauna selectors do not guard and feed the painter\/fallback that returns the canvas[\s\S]*PARSER is broken/);
  writeRouter(routerOrig);

  writeRouter(replaceOnce(routerOrig,
    "    if (fp) fp(ink.c, g, palette(g) as Pal, name);",
    "    if (fp) fp(c, g, palette(g) as Pal, name);",
    'control AZ'));
  check('AZ: the selected painter must draw into ink.c', run(), 'parser-fail',
    /resolver selector\/consumer contract changed: fauna selectors do not guard and feed the painter\/fallback that returns the canvas[\s\S]*PARSER is broken/);
  writeRouter(routerOrig);

  let mutableValue = replaceOnce(orig,
    'export const FAUNA2_NAME: Record<string, Painter2> = {',
    'let pythonRoute: any = () => {};\n\nexport const FAUNA2_NAME: Record<string, Painter2> = {',
    'control BA binding');
  mutableValue = replaceOnce(mutableValue, PYTHON, "  'Python': pythonRoute,", 'control BA route');
  writeVictim(mutableValue);
  check('BA: a mutable painter binding is not statically live', run(), 'parser-fail',
    /route "Python" does not satisfy its statically live value contract[\s\S]*PARSER is broken/);
  writeVictim(orig);

  let parameterFactory = replaceOnce(orig,
    'export const FAUNA2_NAME: Record<string, Painter2> = {',
    'const zztmpFactory = (value: any): any => value;\n\nexport const FAUNA2_NAME: Record<string, Painter2> = {',
    'control BB binding');
  parameterFactory = replaceOnce(parameterFactory, PYTHON, "  'Python': zztmpFactory(null!),", 'control BB route');
  writeVictim(parameterFactory);
  check('BB: a factory parameter cannot masquerade as a callable return', run(), 'parser-fail',
    /route "Python" does not satisfy its statically live value contract[\s\S]*PARSER is broken/);
  writeVictim(orig);

  writeRouter(replaceOnce(routerOrig,
    '/** How many species wave 1 corrects (for the record + the audit sentinel). */',
    "class Object {\n  static keys(value: any): string[] { value['Zzz Mutated Species'] = () => {}; return []; }\n}\n\n/** How many species wave 1 corrects (for the record + the audit sentinel). */",
    'control BC'));
  check('BC: a class cannot shadow the built-in Object.keys binding', run(), 'parser-fail',
    /shadowing the built-in Object binding is unsupported in route-table sources[\s\S]*PARSER is broken/);
  writeRouter(routerOrig);

  let nonCallable = replaceOnce(orig,
    'export const FAUNA2_NAME: Record<string, Painter2> = {',
    'const pythonPainter: any = {};\n\nexport const FAUNA2_NAME: Record<string, Painter2> = {',
    'control BD binding');
  nonCallable = replaceOnce(nonCallable, PYTHON, "  'Python': pythonPainter,", 'control BD route');
  writeVictim(nonCallable);
  check('BD: a truthy object is not a callable painter route', run(), 'parser-fail',
    /route "Python" does not satisfy its statically live value contract[\s\S]*PARSER is broken/);
  writeVictim(orig);

  writeRouter(replaceOnce(routerOrig,
    '/** How many species wave 1 corrects (for the record + the audit sentinel). */',
    "namespace Object {\n  export function keys(value: any): string[] { value['Zzz Mutated Species'] = () => {}; return []; }\n}\n\n/** How many species wave 1 corrects (for the record + the audit sentinel). */",
    'control BE'));
  check('BE: a namespace cannot shadow the built-in Object.keys binding', run(), 'parser-fail',
    /shadowing the built-in Object binding is unsupported in route-table sources[\s\S]*PARSER is broken/);
  writeRouter(routerOrig);

  let reassignedFunction = replaceOnce(orig,
    'export const FAUNA2_NAME: Record<string, Painter2> = {',
    'function pythonRoute(): void {}\npythonRoute = null!;\n\nexport const FAUNA2_NAME: Record<string, Painter2> = {',
    'control BF binding');
  reassignedFunction = replaceOnce(reassignedFunction, PYTHON, "  'Python': pythonRoute,", 'control BF route');
  writeVictim(reassignedFunction);
  check('BF: a reassigned function binding is not statically live', run(), 'parser-fail',
    /route "Python" does not satisfy its statically live value contract[\s\S]*PARSER is broken/);
  writeVictim(orig);

  writeRouter(replaceOnce(routerOrig,
    'export function resolveOverride(g: G): string | null {',
    "fitInk = (_src: HTMLCanvasElement, _dst: Ctx, _who: string): void => {};\n\nexport function resolveOverride(g: G): string | null {",
    'control BG'));
  check('BG: a reassigned canvas helper fails the binding contract', run(), 'parser-fail',
    /resolver selector\/consumer contract changed: route helper fitInk is not its stable exact function binding[\s\S]*PARSER is broken/);
  writeRouter(routerOrig);

  writeRouter(replaceOnce(routerOrig,
    'export function resolveOverride(g: G): string | null {',
    "const String = (_value: unknown): string => '';\n\nexport function resolveOverride(g: G): string | null {",
    'control BH'));
  check('BH: a local binding cannot shadow the built-in String resolver input', run(), 'parser-fail',
    /shadowing the built-in String binding is unsupported in route-table sources[\s\S]*PARSER is broken/);
  writeRouter(routerOrig);

  writeRouter(replaceOnce(routerOrig,
    'export function resolveOverride(g: G): string | null {',
    "const Boolean = (_value: unknown): boolean => false;\n\nexport function resolveOverride(g: G): string | null {",
    'control BI'));
  check('BI: a local binding cannot shadow the built-in Boolean route probe', run(), 'parser-fail',
    /shadowing the built-in Boolean binding is unsupported in route-table sources[\s\S]*PARSER is broken/);
  writeRouter(routerOrig);

  writeRouter(replaceOnce(routerOrig,
    'export function resolveOverride(g: G): string | null {',
    "lineageRenderKingdom = (_g: G): EarthKingdom => 'fauna';\n\nexport function resolveOverride(g: G): string | null {",
    'control BJ'));
  check('BJ: a reassigned lineage route helper fails the binding contract', run(), 'parser-fail',
    /resolver selector\/consumer contract changed: route helper lineageRenderKingdom is not its stable exact function binding[\s\S]*PARSER is broken/);
  writeRouter(routerOrig);

  writeFlora(replaceOnce(floraOrig,
    'export const FLORA_ICONIC: Record<string, FloraPainter> = {',
    'floraLadder = floraLadder;\n\nexport const FLORA_ICONIC: Record<string, FloraPainter> = {',
    'control BK'));
  check('BK: a reassigned flora route consumer fails the binding contract', run(), 'parser-fail',
    /resolver selector\/consumer contract changed: route helper floraLadder is not its stable exact function binding[\s\S]*PARSER is broken/);
  writeFlora(floraOrig);

  writeQuad(replaceOnce(quadOrig,
    'export const QUAD_SPEC: Record<string, QuadSpec> = {',
    'faunaQuadruped = faunaQuadruped;\n\nexport const QUAD_SPEC: Record<string, QuadSpec> = {',
    'control BL'));
  check('BL: a reassigned quadruped route consumer fails the binding contract', run(), 'parser-fail',
    /resolver selector\/consumer contract changed: route helper faunaQuadruped is not its stable exact function binding[\s\S]*PARSER is broken/);
  writeQuad(quadOrig);

  writeRouter(replaceOnce(routerOrig,
    'export function resolveOverride(g: G): string | null {',
    'newCanvas = newCanvas;\n\nexport function resolveOverride(g: G): string | null {',
    'control BM'));
  check('BM: a reassigned canvas allocator fails the binding contract', run(), 'parser-fail',
    /resolver selector\/consumer contract changed: route helper newCanvas is not its stable exact function binding[\s\S]*PARSER is broken/);
  writeRouter(routerOrig);

  writeRouter(replaceOnce(routerOrig,
    'export function resolveOverride(g: G): string | null {',
    'newInk = newInk;\n\nexport function resolveOverride(g: G): string | null {',
    'control BN'));
  check('BN: a reassigned ink allocator fails the binding contract', run(), 'parser-fail',
    /resolver selector\/consumer contract changed: route helper newInk is not its stable exact function binding[\s\S]*PARSER is broken/);
  writeRouter(routerOrig);

  const helperModule = `export function noOp(..._args: any[]): void {}\n`;
  writeTmp(helperModule);
  writeRouter(replaceOnce(routerOrig,
    "import { FLORA_ICONIC, FLORA_DUPES, floraLadder, type Pal } from './floraoverrides.js';",
    `import { FLORA_ICONIC, FLORA_DUPES, type Pal } from './floraoverrides.js';\nimport { noOp as floraLadder } from './${path.basename(TMP, '.ts')}.js';`,
    'control BO'));
  check('BO: an imported route helper cannot change owner or exported name', run(), 'parser-fail',
    /resolver selector\/consumer contract changed: route helper floraLadder is not its stable exact function binding[\s\S]*PARSER is broken/);
  writeRouter(routerOrig);
  removeTmp();

  writeCatalog(replaceOnce(catalogOrig,
    "  fauna:['Jaguar',",
    "  fauna:[\"Zzz Double-Quoted Species\",'Jaguar',",
    'control BP'));
  check('BP: a double-quoted catalog species cannot disappear from coverage', run(), 'fail',
    /INCOMPLETE ROUTE COVERAGE — 1 kingdom-qualified catalog routes have no live override:[\s\S]*Zzz Double-Quoted Species  \(fauna\)/);
  writeCatalog(catalogOrig);

  writeCatalog(replaceOnce(catalogOrig,
    '}\nfunction _earthNamePass(list){',
    '}\n_EARTH_NAMES.fauna.push("Zzz Mutated Catalog Species");\nfunction _earthNamePass(list){',
    'control BQ'));
  check('BQ: post-initializer catalog mutation is parser damage', run(), 'parser-fail',
    /_EARTH_NAMES escapes its exact declaration\/read\/export contract[\s\S]*catalog PARSER is broken/);
  writeCatalog(catalogOrig);

  writeRouter(replaceOnce(routerOrig,
    'export function resolveOverride(g: G): string | null {',
    "(Object as any).keys = (_value: object): string[] => [];\n\nexport function resolveOverride(g: G): string | null {",
    'control BR'));
  check('BR: Object.keys cannot be monkeypatched around the route audit', run(), 'parser-fail',
    /trusted built-in Object member escapes its approved direct-call context[\s\S]*PARSER is broken/);
  writeRouter(routerOrig);

  writeRouter(replaceOnce(routerOrig,
    'export function resolveOverride(g: G): string | null {',
    "globalThis.String = ((_value?: unknown): string => '') as StringConstructor;\n\nexport function resolveOverride(g: G): string | null {",
    'control BS'));
  check('BS: a global-object write cannot poison the String route input', run(), 'parser-fail',
    /globalThis global-object access is outside its exact audited context[\s\S]*PARSER is broken/);
  writeRouter(routerOrig);

  writeRouter(replaceOnce(routerOrig,
    'export function resolveOverride(g: G): string | null {',
    "void import('./faunaoverrides2.js');\n\nexport function resolveOverride(g: G): string | null {",
    'control BT'));
  check('BT: dynamic imports cannot acquire a route table outside static provenance', run(), 'parser-fail',
    /dynamic imports are unsupported in route-table sources[\s\S]*PARSER is broken/);
  writeRouter(routerOrig);

  writeRouter(replaceOnce(routerOrig,
    "    const { cv, c } = newCanvas();\n    vignette(c, false);\n    floorFade(c);\n    const ink = newInk();\n    if (fp)",
    "    const { cv, c } = newCanvas();\n    cv.toDataURL = () => '';\n    floorFade(c);\n    const ink = newInk();\n    if (fp)",
    'control BU'));
  check('BU: generic furniture syntax cannot poison the returned canvas', run(), 'parser-fail',
    /fauna selectors do not guard and feed the painter\/fallback that returns the canvas[\s\S]*PARSER is broken/);
  writeRouter(routerOrig);

  writeRouter(replaceOnce(routerOrig,
    "  const cv = document.createElement('canvas'); cv.width = cv.height = S;",
    "  const cv = document.createElement('canvas'); cv.width = cv.height = 1;",
    'control BV'));
  check('BV: newCanvas implementation drift fails the canvas contract', run(), 'parser-fail',
    /route helper newCanvas implementation changed from its audited canvas contract[\s\S]*PARSER is broken/);
  writeRouter(routerOrig);

  writeRouter(replaceOnce(routerOrig,
    "  const cv = document.createElement('canvas'); cv.width = cv.height = INK;",
    "  const cv = document.createElement('canvas'); cv.width = cv.height = 1;",
    'control BW'));
  check('BW: newInk implementation drift fails the canvas contract', run(), 'parser-fail',
    /route helper newInk implementation changed from its audited canvas contract[\s\S]*PARSER is broken/);
  writeRouter(routerOrig);

  writeRouter(replaceOnce(routerOrig,
    'function fitInk(src: HTMLCanvasElement, dst: Ctx, who: string): void {',
    'function fitInk(src: HTMLCanvasElement, dst: Ctx, who: string): void {\n  if (Boolean(src)) return;',
    'control BX'));
  check('BX: fitInk implementation drift fails the compositor contract', run(), 'parser-fail',
    /route helper fitInk implementation changed from its audited canvas contract[\s\S]*PARSER is broken/);
  writeRouter(routerOrig);

  writeVictim(replaceOnce(orig,
    'export const FAUNA2_NAME: Record<string, Painter2> = {',
    'const escapedFauna2: Record<string, Painter2> = {};\nexport { escapedFauna2 as "FAUNA2_NAME" };\nconst FAUNA2_NAME: Record<string, Painter2> = {',
    'control BY'));
  check('BY: a route import must resolve to the exact exported table declaration', run(), 'parser-fail',
    /faunaoverrides2\.ts does not export FAUNA2_NAME from its exact stable table declaration[\s\S]*PARSER is broken/);
  writeVictim(orig);

  let helperExport = replaceOnce(floraOrig,
    'export function floraLadder(c: Ctx, g: G, p: Pal, name: string): void {',
    'function floraLadder(c: Ctx, g: G, p: Pal, name: string): void {',
    'control BZ declaration');
  helperExport = replaceOnce(helperExport,
    'export const FLORA_ICONIC: Record<string, FloraPainter> = {',
    'function escapedFloraLadder(_c: Ctx, _g: G, _p: Pal, _name: string): void {}\nexport { escapedFloraLadder as "floraLadder" };\nvoid floraLadder;\n\nexport const FLORA_ICONIC: Record<string, FloraPainter> = {',
    'control BZ export');
  writeFlora(helperExport);
  check('BZ: an imported helper must resolve to its exact exported function declaration', run(), 'parser-fail',
    /route helper floraLadder is not its stable exact function binding[\s\S]*PARSER is broken/);
  writeFlora(floraOrig);

  writeRouter(replaceOnce(routerOrig,
    'const fp = FAUNA_NAME[name] || FAUNA2_NAME[name] || FAUNA3_NAME[name] || BIRD_NAME[name] || INVERT_NAME[name];',
    'const fp = FAUNA2_NAME[name] || FAUNA_NAME[name] || FAUNA3_NAME[name] || BIRD_NAME[name] || INVERT_NAME[name];',
    'control CA'));
  check('CA: resolver precedence must match the audited shadow order', run(), 'parser-fail',
    /fp route lookup order changed[\s\S]*PARSER is broken/);
  writeRouter(routerOrig);

  writeMts("import { FAUNA2_NAME } from './faunaoverrides2.js';\nFAUNA2_NAME.Python = () => {};\n");
  writeRouter(replaceOnce(routerOrig,
    'type G = Record<string, unknown>;',
    `import './${path.basename(TMP_MTS, '.mts')}.mjs';\n\ntype G = Record<string, unknown>;`,
    'control CB'));
  check('CB: a live .mts route mutation cannot escape recursive discovery', run(), 'parser-fail',
    /route table appears in an assignment target after its literal declaration[\s\S]*PARSER is broken/);
  writeRouter(routerOrig);
  removeMts();

  writeEscape('export const FAUNA2_NAME: Record<string, unknown> = {};\n');
  writeVictim(replaceOnce(orig,
    'export const FAUNA2_NAME: Record<string, Painter2> = {',
    `export { FAUNA2_NAME } from '../${path.basename(ESCAPE, '.ts')}.js';\nconst FAUNA2_NAME: Record<string, Painter2> = {`,
    'control CC'));
  check('CC: a route re-export cannot escape the recursively scanned owner graph', run(), 'parser-fail',
    /re-export "\.\.\/routeescape-control-[0-9]+\.js" is outside recursive art-source discovery[\s\S]*PARSER is broken/);
  writeVictim(orig);
  removeEscape();

  writeTmp("export { FAUNA2_NAME as routes } from './faunaoverrides2.js';\n");
  check('CD: a route table cannot be laundered through a non-route export name', run(), 'parser-fail',
    /route-table export FAUNA2_NAME may not be aliased as routes[\s\S]*PARSER is broken/);
  removeTmp();

  writeVerbatim(verbatimOrig + '\nvoid 0;\n');
  check('CE: an allowlisted executable JS input is byte-pinned', run(), 'parser-fail',
    /hdart\.verbatim\.js changed from its audited executable-input hash[\s\S]*PARSER is broken/);
  writeVerbatim(verbatimOrig);

  writeCatalogWrapper(catalogWrapperOrig + '\nvoid 0;\n');
  check('CF: the live catalog wrapper is byte-pinned', run(), 'parser-fail',
    /live apphooks\.ts catalog wrapper changed from its audited authority contract[\s\S]*catalog PARSER is broken/);
  writeCatalogWrapper(catalogWrapperOrig);

  writeRouter(replaceOnce(routerOrig,
    'type G = Record<string, unknown>;',
    "import '@cf/routepoison';\n\ntype G = Record<string, unknown>;",
    'control CG'));
  check('CG: an unscanned bare side-effect package cannot enter the art graph', run(), 'parser-fail',
    /bare import "@cf\/routepoison" is outside the exact audited dependency surface[\s\S]*PARSER is broken/);
  writeRouter(routerOrig);

  writeTmp("export * as routes from './faunaoverrides2.js';\n");
  check('CH: a route module cannot be laundered through a namespace re-export', run(), 'parser-fail',
    /namespace\/export-all re-exports are unsupported in route-table sources[\s\S]*PARSER is broken/);
  removeTmp();

  writeRouter(replaceOnce(routerOrig, 'const S = 440;', 'const S = 1;', 'control CI'));
  check('CI: the returned-canvas size dependency is pinned', run(), 'parser-fail',
    /canvas dependency S changed from its audited initializer[\s\S]*PARSER is broken/);
  writeRouter(routerOrig);

  writeRouter(replaceOnce(routerOrig, 'const FIT_MARGIN = 0.90;', 'const FIT_MARGIN = 0;', 'control CJ'));
  check('CJ: a zero fit margin cannot erase all routed ink', run(), 'parser-fail',
    /canvas dependency FIT_MARGIN changed from its audited initializer[\s\S]*PARSER is broken/);
  writeRouter(routerOrig);

  writeRouter(replaceOnce(routerOrig, 'const INK = S * 2;', 'const INK = 1;', 'control CK'));
  check('CK: the detached ink-surface size dependency is pinned', run(), 'parser-fail',
    /canvas dependency INK changed from its audited initializer[\s\S]*PARSER is broken/);
  writeRouter(routerOrig);

  writeRouter(replaceOnce(routerOrig, 'const INK_OFF = S * 0.5;', 'const INK_OFF = 0;', 'control CL'));
  check('CL: the detached ink-origin dependency is pinned', run(), 'parser-fail',
    /canvas dependency INK_OFF changed from its audited initializer[\s\S]*PARSER is broken/);
  writeRouter(routerOrig);

  writeTmp("export {} from '@cf/routepoison';\n");
  check('CM: a bare re-export cannot load an unscanned side-effect package', run(), 'parser-fail',
    /bare re-export "@cf\/routepoison" is outside the exact audited dependency surface[\s\S]*PARSER is broken/);
  removeTmp();

  writeVictim(replaceOnce(orig,
    "  'Cobra': (c, g, p) => faunaESquamata(c, g, p, 'Cobra'),",
    "  'Blue Whale': () => {},\n  'Cobra': (c, g, p) => faunaESquamata(c, g, p, 'Cobra'),",
    'control CN'));
  check('CN: adjacent fauna shadow direction follows selector order', run(), 'fail',
    /Blue Whale \(fauna\)  \[faunaoverrides\.ts:FAUNA_NAME SHADOWS faunaoverrides2\.ts:FAUNA2_NAME\]/);
  writeVictim(orig);

  writeRouter(replaceOnce(routerOrig,
    "    fitInk(ink.cv, c, kingdom + ':' + name);\n    return cv.toDataURL();\n  }\n  /* FLORA",
    "    fitInk(ink.cv, c, kingdom + ':' + name);\n    return cv.toDataURL((() => { throw new Error('route never returns'); })());\n  }\n  /* FLORA",
    'control CO'));
  check('CO: returned-canvas serialization must be the exact zero-argument call', run(), 'parser-fail',
    /canon lookup is not the guarded painter that feeds the returned canvas[\s\S]*PARSER is broken/);
  writeRouter(routerOrig);

  writeRouter(replaceOnce(routerOrig,
    '  "Lion\'s Mane": fungiLionsMane,',
    '  "Lion’s Mane": fungiLionsMane,',
    'control CP'));
  check('CP: a noncanonical apostrophe cannot masquerade as a reachable route key', run(), 'parser-fail',
    /key "Lion’s Mane" is not runtime-canonical; use "Lion\'s Mane"[\s\S]*PARSER is broken/);
  writeRouter(routerOrig);

  let shadowRouter = replaceOnce(routerOrig,
    "import { FAUNA2_NAME } from './faunaoverrides2.js';\n",
    '',
    'control AA import');
  shadowRouter = replaceOnce(shadowRouter,
    "type EarthKingdom = 'fauna' | 'flora' | 'fungi' | 'microbe';",
    "const FAUNA2_NAME: Record<string, Painter> = {};\n\ntype EarthKingdom = 'fauna' | 'flora' | 'fungi' | 'microbe';",
    'control AA local shadow');
  writeRouter(shadowRouter);
  check('AA: a fake local table cannot impersonate the imported owner', run(), 'parser-fail',
    /FAUNA2_NAME route table has multiple declaration owners:[\s\S]*PARSER is broken/);
  writeRouter(routerOrig);

  check('restored: clean tables again', run(), 'pass');
} finally { restore(); }
process.exit(pass ? 0 : 1);
