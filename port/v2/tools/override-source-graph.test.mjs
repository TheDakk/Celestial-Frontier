import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {parseAst} from 'rolldown/parseAst';
import {discoverRelativeSourceClosure} from './override-source-graph.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function write(directory, filename, source) {
  const target = path.join(directory, filename);
  fs.mkdirSync(path.dirname(target), {recursive: true});
  fs.writeFileSync(target, source);
}
function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-override-graph-'));
  t.after(() => fs.rmSync(directory, {recursive: true, force: true}));
  const boundaryRoot = path.join(directory, 'v2');
  const sourceRoot = path.join(boundaryRoot, 'packages/art/src');
  fs.mkdirSync(sourceRoot, {recursive: true});
  return {directory, boundaryRoot, sourceRoot,
    graph: () => discoverRelativeSourceClosure({sourceRoot, boundaryRoot, seeds: ['entry.ts'],
      sealed: new Set(), parse: (source, label) => parseAst(source,
        {lang: /\.[cm]?js$/.test(label) ? 'js' : 'ts'}, label)})};
}

test('static dependency closure follows real JS, TS fallbacks, re-exports and cycles beyond art', t => {
  const f = fixture(t);
  write(f.sourceRoot, 'entry.ts', "import {count} from '../../../tools/count.mjs'; export {value} from './value.js';");
  write(f.sourceRoot, 'value.ts', 'export const value=1;');
  write(f.boundaryRoot, 'tools/count.mjs', "import {value} from './value.ts'; export const count=value;");
  write(f.boundaryRoot, 'tools/value.ts', "import '../packages/art/src/entry.js'; export const value=1;");
  const graph = f.graph();
  assert.deepEqual(graph.files, ['../../../tools/count.mjs', '../../../tools/value.ts', 'entry.ts', 'value.ts']);
  assert.equal(graph.resolve('entry.ts', '../../../tools/count.mjs'), '../../../tools/count.mjs');
  assert.equal(graph.resolve('entry.ts', './value.js'), 'value.ts');
  assert.equal(graph.programs.size, 4);
});

for (const [name, setup, expected] of [
  ['missing dependency', f => write(f.sourceRoot, 'entry.ts', "import './missing.js';"), /has 0 source targets/],
  ['ambiguous runtime and typed files', f => {
    write(f.sourceRoot, 'entry.ts', "import './value.js';");
    write(f.sourceRoot, 'value.ts', 'export const x=1;');
    write(f.sourceRoot, 'value.js', 'export const x=2;');
  }, /has 2 source targets/],
  ['source boundary escape', f => {
    write(f.sourceRoot, 'entry.ts', "import '../../../../outside.mjs';");
    write(f.directory, 'outside.mjs', 'export const x=1;');
  }, /escapes the v2 source boundary/],
  ['symlink directory escape', f => {
    write(f.directory, 'outside/value.mjs', 'export const x=1;');
    fs.symlinkSync(path.join(f.directory, 'outside'), path.join(f.boundaryRoot, 'linked'));
    write(f.sourceRoot, 'entry.ts', "import '../../../linked/value.mjs';");
  }, /traverses a symlink/],
  ['declaration-only dependency', f => {
    write(f.sourceRoot, 'entry.ts', "import '../../../tools/types.d.ts';");
    write(f.boundaryRoot, 'tools/types.d.ts', 'export interface X {}');
  }, /not an executable/],
  ['malformed transitive JS', f => {
    write(f.sourceRoot, 'entry.ts', "import '../../../tools/value.mjs';");
    write(f.boundaryRoot, 'tools/value.mjs', 'const value: number = 1;');
  }, /Expected|Unexpected|Parse/],
]) test(`dependency discovery rejects ${name}`, t => {
  const f = fixture(t); setup(f); assert.throws(f.graph, expected);
});

test('real sentinel audits transitive modules and exact null-prototype construction in an isolated source copy', async t => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'cf-override-sentinel-'));
  t.after(() => fs.rmSync(temporary, {recursive: true, force: true}));
  for (const directory of ['packages/art/src', 'packages/domain/descriptors/src']) {
    fs.mkdirSync(path.dirname(path.join(temporary, directory)), {recursive: true});
    fs.cpSync(path.join(root, directory), path.join(temporary, directory), {recursive: true});
  }
  for (const filename of ['tools/overridecheck.mjs', 'tools/override-source-graph.mjs',
    'tools/creature-animation/repeated-anatomy.mjs', 'tools/creature-animation/skeleton-pose.mjs',
    'tools/creature-animation/kinematics.ts', 'tools/creature-animation/fixed-attachments.mjs',
    'tools/creature-animation/myriapod-anatomy.mjs']) {
    write(temporary, filename, fs.readFileSync(path.join(root, filename)));
  }
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(temporary, 'node_modules'), 'dir');
  const source = fs.readFileSync(path.join(temporary, 'tools/creature-animation/skeleton-pose.mjs'), 'utf8');
  const run = () => {
    const result = spawnSync(process.execPath, ['tools/overridecheck.mjs'], {
      cwd: temporary, encoding: 'utf8', timeout: 60_000,
    });
    assert.ifError(result.error);
    return {status: result.status, output: result.stdout + result.stderr};
  };
  const baseline = run();
  assert.equal(baseline.status, 0, baseline.output);
  assert.match(baseline.output, /source graph \d+ art \+ 5 transitive modules/);
  for (const [name, mutated, expected] of [
    ['transitive route mutation', source + '\nFAUNA2_NAME.Python = () => {};\n', /route table appears in an assignment target/],
    ['arbitrary Object.create prototype', source.replace('Object.create(null)', 'Object.create({})'), /trusted built-in Object member escapes/],
    ['Object.create property descriptors', source.replace('Object.create(null)', 'Object.create(null, {})'), /trusted built-in Object member escapes/],
    ['aliased Object.create', source + '\nconst create = Object.create;\n', /trusted built-in Object member escapes/],
  ]) await t.test(name, () => {
    assert.notEqual(mutated, source);
    write(temporary, 'tools/creature-animation/skeleton-pose.mjs', mutated);
    const result = run();
    assert.equal(result.status, 2, result.output);
    assert.match(result.output, expected);
    write(temporary, 'tools/creature-animation/skeleton-pose.mjs', source);
  });
  await t.test('outside-art re-export cannot hide a second route owner (CC)', () => {
    const victim = 'packages/art/src/faunaoverrides2.ts';
    const original = fs.readFileSync(path.join(temporary, victim), 'utf8');
    const anchor = 'export const FAUNA2_NAME: Record<string, Painter2> = {';
    assert.equal(original.split(anchor).length - 1, 1);
    write(temporary, 'packages/art/routeescape-control.ts', 'export const FAUNA2_NAME: Record<string, unknown> = {};\n');
    write(temporary, victim, original.replace(anchor,
      "export { FAUNA2_NAME } from '../routeescape-control.js';\nconst FAUNA2_NAME: Record<string, Painter2> = {"));
    const result = run();
    assert.equal(result.status, 2, result.output);
    assert.match(result.output, /FAUNA2_NAME route table has multiple declaration owners:/);
    write(temporary, victim, original);
    fs.unlinkSync(path.join(temporary, 'packages/art/routeescape-control.ts'));
  });
  const routerName = 'packages/art/src/speciesoverrides.ts';
  const router = fs.readFileSync(path.join(temporary, routerName), 'utf8');
  for (const [name, before, after, expected] of [
    ['private route function reassignment', 'function paintOverrideCanvas(g: G,', 'paintOverrideCanvas = (_g:G) => null;\nfunction paintOverrideCanvas(g: G,', /route helper paintOverrideCanvas is not its stable exact function binding/],
    ['public ordinary branch disconnects', 'if(!observeTopology?.captureParts)return paintOverrideCanvas(g,observeTopology);', 'if(!observeTopology?.captureParts)return null;', /route helper resolveOverrideCanvas implementation changed/],
    ['public capture branch returns replay ink', 'observeTopology({...primary.topology,partMasks:{...partMasks,labels}},primary.ink);\n  return normal;', 'observeTopology({...primary.topology,partMasks:{...partMasks,labels}},primary.ink);\n  return capturedInk;', /route helper resolveOverrideCanvas implementation changed/],
    ['selected painter bypasses ink', '()=>canon(ink.c, g, palette(g) as Pal)', '()=>canon(c, g, palette(g) as Pal)', /canon lookup is not/],
    ['topology helper skips painting', '}else paint();', '}else void 0;', /route helper paintWithTopology implementation changed/],
    ['topology callback loses the painter', '()=>canon(ink.c, g, palette(g) as Pal)', '()=>void canon', /topology callback changed/],
    ['topology callback receives the wrong ink', 'paintWithTopology(ink,()=>canon', 'paintWithTopology({c,cv},()=>canon', /topology observation must/],
    ['topology callback changes painter genome', '()=>canon(ink.c, g, palette(g) as Pal)', '()=>canon(ink.c, {}, palette(g) as Pal)', /canon lookup is not/],
    ['route precedence remains enforced', 'const fp = FAUNA_NAME[name] || FAUNA2_NAME[name]', 'const fp = FAUNA2_NAME[name] || FAUNA_NAME[name]', /fp route lookup order changed/],
  ]) await t.test(name, () => {
    assert.equal(router.split(before).length - 1, 1, name);
    write(temporary, routerName, router.replace(before, after));
    const result = run();
    assert.equal(result.status, 2, result.output);
    assert.match(result.output, expected);
    write(temporary, routerName, router);
  });
  const recovery = run();
  assert.equal(recovery.status, 0, recovery.output);
  assert.equal(recovery.output, baseline.output, 'exact unmodified source recovers identical gate output');
});
