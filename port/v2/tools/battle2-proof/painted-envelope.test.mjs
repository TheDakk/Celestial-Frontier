import assert from 'node:assert/strict';
import fs from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import vm from 'node:vm';
import test from 'node:test';
import {parseAst} from 'rolldown/parseAst';
import {publishedMeshBounds, assertPublishedSample, mergePaintedBounds,
  fitPaintedEnvelope, preserveGroundMassRatios, placedPaintedBounds, assessPaintedContainment} from './painted-envelope.mjs';

const frame = {width: 100, height: 100}, band = {minY: .25, maxY: .75};
const foot = {x: .5, y: .875};
const bounds = publishedMeshBounds(new Map([
  ['body', Float32Array.from([.25, .25, .75, .25, .75, .5, .25, .5])],
]));
const fit = options => fitPaintedEnvelope({bounds, foot, frame, medium: 'water', band,
  massScale: 1000, edgeReserveFraction: .125, ...options});
const place = (sizing = fit(), options = {}) => placedPaintedBounds({bounds,
  root: {x: -foot.x, y: -foot.y, scaleX: 1, scaleY: 1},
  holder: {x: 50, y: sizing.standY * frame.height, scaleX: sizing.scale, scaleY: sizing.scale},
  camera: {x: 0, y: 0}, ...options});
const assess = (placed, options = {}) => assessPaintedContainment({placed, frame, medium: 'water', band, ...options});

test('all published Float32 meshes contribute extrema, including a remote seam vertex', () => {
  const result = publishedMeshBounds([
    {id: 'body', positions: Float32Array.from([.25, .25, .75, .5])},
    {id: 'seam', positions: Float32Array.from([-.5, .375, .5, 1.25])},
  ]);
  assert.deepEqual(result, {minX: -.5, minY: .25, maxX: .75, maxY: 1.25,
    width: 1.25, height: 1, meshCount: 2, vertexCount: 4});
});

for (const [name, meshes] of [
  ['empty inventory', []],
  ['wrong numeric type', [{id: 'bad', positions: new Float64Array([0, 0, 1, 1])}]],
  ['odd coordinate count', [{id: 'bad', positions: new Float32Array([0, 0, 1])}]],
  ['NaN', [{id: 'bad', positions: new Float32Array([0, 0, NaN, 1])}]],
  ['infinity', [{id: 'bad', positions: new Float32Array([0, 0, 1, Infinity])}]],
  ['zero height', [{id: 'bad', positions: new Float32Array([0, 0, 1, 0])}]],
  ['duplicate mesh id', [{id: 'same', positions: new Float32Array([0, 0, 1, 1])},
    {id: 'same', positions: new Float32Array([0, 0, 2, 2])}]],
]) test(`invalid geometry cannot yield passing bounds: ${name}`, () => {
  assert.throws(() => publishedMeshBounds(meshes), /Painted envelope:/);
});

test('the full sweep expands from actual extrema; invalid samples are not skipped', () => {
  const moving = publishedMeshBounds(new Map([['moving', new Float32Array([-.5, -.25, .875, .75])]]));
  const result = mergePaintedBounds([bounds, moving]);
  assert.deepEqual(result, {minX: -.5, minY: -.25, maxX: .875, maxY: .75,
    width: 1.375, height: 1, sampleCount: 2});
  assert.throws(() => mergePaintedBounds([]), /no published sweep samples/);
  assert.throws(() => mergePaintedBounds([bounds, null]), /bounds required/);
  assert.throws(() => mergePaintedBounds([{...bounds, height: 10}]), /dimensions disagree/);
});

test('a refused or unchanged pose cannot contribute its stale mesh as a measured sample', () => {
  assertPublishedSample({before: {applied: 4, refusals: 0}, after: {applied: 5, refusals: 0}});
  assert.throws(() => assertPublishedSample({before: {applied: 4, refusals: 0},
    after: {applied: 4, refusals: 1}}), /refused pose/);
  assert.throws(() => assertPublishedSample({before: {applied: 4, refusals: 0},
    after: {applied: 5, refusals: 1}}), /refused pose/);
  assert.throws(() => assertPublishedSample({before: {applied: 4, refusals: 0},
    after: {applied: 4, refusals: 0}}), /did not publish/);
  assert.throws(() => assertPublishedSample({before: {}, after: {}}), /counters required/);
});

test('off-centre painted bounds use their actual centre and foot, not half the cutout', () => {
  const sizing = fit();
  assert.deepEqual(sizing, {scale: 150, painted: {height: .375, footBelowCentre: .75},
    centreY: .5, standY: 1.25});
  assert.deepEqual(place(sizing).arena, {minX: 12.5, minY: 31.25, maxX: 87.5, maxY: 68.75,
    width: 75, height: 37.5});
  assert.equal(assess(place(sizing)).status, 'PASS');
  const wrongStandY = .5 + (foot.y - .5) * sizing.scale / frame.height;
  assert.deepEqual(assess(place(sizing, {holder: {x: 50, y: wrongStandY * frame.height,
    scaleX: sizing.scale, scaleY: sizing.scale}})).findings, ['medium-band']);
});

test('water and air cap only oversized scale; ground and already-small mass scale stay unchanged', () => {
  assert.equal(fit({medium: 'air'}).scale, 150);
  const small = fit({massScale: 100});
  assert.equal(small.scale, 100);
  const ground = fit({medium: 'ground'});
  assert.equal(ground.scale, 1000);
  assert.equal(ground.standY, null);
  assert.equal(ground.centreY, null);
});

test('full swept geometry, rather than rest height, determines the medium scale', () => {
  const sweep = mergePaintedBounds([bounds, {minX: .25, minY: -.25, maxX: .75, maxY: .75}]);
  assert.equal(fit({bounds: sweep}).scale, 37.5);
  assert.equal(fit({bounds: sweep}).painted.height, .375);
  assert.throws(() => fit({massScale: Infinity}), /mass scale/);
  assert.throws(() => fit({edgeReserveFraction: .5}), /edge reserve/);
  assert.throws(() => fit({band: {minY: .75, maxY: .25}}), /habitat band/);
});

test('the existing source-owned habitat gate still refuses an oversized organism', () => {
  const source = fs.readFileSync(new URL('../../apps/game/src/battle-habitat.ts', import.meta.url), 'utf8');
  const program = parseAst(source, {lang: 'ts'});
  const nodes = program.body.filter(node => node.type === 'ExportNamedDeclaration'
    && node.declaration?.type === 'FunctionDeclaration' && node.declaration.id.name === 'containHabitatBody');
  assert.equal(nodes.length, 1);
  const node = nodes[0].declaration;
  // Run the actual current guard body in isolation; no copied guard or test-only
  // replacement of the application owner and no domain/world/module bootstrap.
  const contain = vm.runInNewContext('(' + stripTypeScriptTypes(source.slice(node.start, node.end)) + ')', {Math, Number, Error});
  assert.throws(() => contain(band, .5, .5000000001), /organism cannot fit its medium/);
  assert.equal(contain(band, .5, fit().painted.height), .5);
});

test('holder facing, root dynamic scale and camera shake all enter the current frame receipt', () => {
  const sizing = fit();
  const flipped = place(sizing, {holder: {x: 50, y: 125, scaleX: -150, scaleY: 150}});
  assert.deepEqual(flipped, place(sizing));
  const enlarged = place(sizing, {root: {x: -.5, y: -.875, scaleX: 1, scaleY: 2}});
  assert.equal(assess(enlarged).status, 'REFUSED');
  assert.ok(assess(enlarged).findings.includes('medium-band'));
  const shaken = place(sizing, {camera: {x: 0, y: 40}});
  assert.deepEqual(shaken.arena, place(sizing).arena);
  assert.deepEqual(assess(shaken).findings, ['viewport']);
});

test('ground skips medium-band height only and cannot hide an offscreen body', () => {
  const tall = {arena: {minX: 10, minY: 0, maxX: 90, maxY: 100},
    viewport: {minX: 10, minY: 0, maxX: 90, maxY: 100}};
  assert.equal(assess(tall, {medium: 'ground'}).status, 'PASS');
  assert.deepEqual(assess(tall).findings, ['medium-band']);
  assert.deepEqual(assess({...tall, viewport: {...tall.viewport, maxX: 101}}, {medium: 'ground'}).findings, ['viewport']);
});

test('frame assessment has no epsilon and rejects malformed or collapsed transforms', () => {
  const tinyBreach = {arena: {minX: 10, minY: 25 - Number.EPSILON * 16, maxX: 90, maxY: 75},
    viewport: {minX: 10, minY: 25, maxX: 90, maxY: 75}};
  assert.deepEqual(assess(tinyBreach).findings, ['medium-band']);
  assert.throws(() => place(fit(), {root: {x: 0, y: 0, scaleX: 0, scaleY: 1}}), /nonzero display transform/);
  assert.throws(() => place(fit(), {camera: {x: 0, y: NaN}}), /camera translation/);
  assert.throws(() => assess({arena: bounds, viewport: {...bounds, maxY: Infinity}}), /finite nonempty/);
});


test('ground framing closes the retained Python bottom breach without changing its foot or gate', () => {
  const frame = {width: 1024, height: 576}, band = {minY: .08, maxY: .86};
  const source = {minX: 109.4388280453432, minY: 326.0186672453447,
    maxX: 377.9039230451767, maxY: 579.4291486982866};
  const foot = {x: 250, y: .78 * frame.height};
  const options = {bounds: source, foot, frame, medium: 'ground', band,
    massScale: 1, edgeReserveFraction: .05};
  const placement = scale => placedPaintedBounds({bounds: source,
    root: {x: -foot.x, y: -foot.y, scaleX: 1, scaleY: 1},
    holder: {x: foot.x, y: foot.y, scaleX: scale, scaleY: scale}, camera: {x: 0, y: 0}});
  const check = scale => assessPaintedContainment({placed: placement(scale), frame, medium: 'ground', band});
  assert.deepEqual(check(fitPaintedEnvelope(options).scale).findings, ['viewport']);
  const sizing = fitPaintedEnvelope({...options,
    groundViewport: {standY: .78, cameraMinY: 0, cameraMaxY: 0}});
  assert.ok(sizing.scale < 1);
  assert.equal(check(sizing.scale).status, 'PASS');
  assert.equal(placement(sizing.scale).viewport.maxY, frame.height - frame.height * .05);
  assert.equal(sizing.standY, null); // caller still uses the same source ground registration
  assert.equal(sizing.centreY, null);
  // Removing the cap from the otherwise corrected path recreates the reported breach.
  assert.deepEqual(check(options.massScale).findings, ['viewport']);
});

test('ground fit accounts for upward motion, off-centre foot and both camera extrema', () => {
  const bounds = {minX: -.2, minY: -2, maxX: .2, maxY: .1}, foot = {x: 0, y: 0};
  const options = {bounds, foot, frame, medium: 'ground', band, massScale: 100,
    edgeReserveFraction: .05, groundViewport: {standY: .25, cameraMinY: -8, cameraMaxY: 3}};
  const sizing = fitPaintedEnvelope(options);
  for (const y of [-8, 3]) {
    const placed = placedPaintedBounds({bounds, root: {x: 0, y: 0, scaleX: 1, scaleY: 1},
      holder: {x: 50, y: 25, scaleX: sizing.scale, scaleY: sizing.scale}, camera: {x: 0, y}});
    assert.equal(assessPaintedContainment({placed, frame, medium: 'ground', band}).status, 'PASS');
    assert.ok(placed.viewport.minY >= 5 && placed.viewport.maxY <= 95);
  }
  assert.equal(fitPaintedEnvelope({...options, massScale: 1}).scale, 1);
  const noCamera = fitPaintedEnvelope({...options, edgeReserveFraction: 0,
    groundViewport: {...options.groundViewport, cameraMinY: 0, cameraMaxY: 0}});
  const wrong = placedPaintedBounds({bounds, root: {x: 0, y: 0, scaleX: 1, scaleY: 1},
    holder: {x: 50, y: 25, scaleX: noCamera.scale, scaleY: noCamera.scale}, camera: {x: 0, y: -8}});
  assert.deepEqual(assessPaintedContainment({placed: wrong, frame, medium: 'ground', band}).findings, ['viewport']);
});

test('ground framing refuses unavailable or malformed placement and camera evidence', () => {
  for (const groundViewport of [
    {standY: NaN, cameraMinY: 0, cameraMaxY: 0},
    {standY: 0, cameraMinY: 0, cameraMaxY: 0},
    {standY: .8, cameraMinY: 3, cameraMaxY: -3},
    {standY: .99, cameraMinY: 0, cameraMaxY: 20},
  ]) assert.throws(() => fit({medium: 'ground', groundViewport}), /ground/);
  assert.throws(() => fit({groundViewport: {standY: .8, cameraMinY: 0, cameraMaxY: 0}}), /ground/);
});


test('shared ground framing preserves equal and unequal source mass ratios across turn roles', () => {
  for (const rightMass of [10, 20]) {
    const original = {left: {medium: 'ground', massScale: 10, scale: 4, height: .4, footBelowCentre: .1},
      right: {medium: 'ground', massScale: rightMass, scale: rightMass * .8, height: .8, footBelowCentre: .2},
      water: {medium: 'water', massScale: 20, scale: 3, height: .2, footBelowCentre: .1}};
    const out = preserveGroundMassRatios(original);
    assert.equal(out.left.scale / out.right.scale, 10 / rightMass);
    assert.equal(out.right.scale, rightMass * .4);
    assert.equal(out.right.height, .4);
    assert.equal(out.right.footBelowCentre, .1);
    assert.equal(out.water, original.water);
    assert.equal(original.right.scale, rightMass * .8);
    // The old independent cap visibly changes the ratio despite valid individual fits.
    assert.notEqual(original.left.scale / original.right.scale, 10 / rightMass);
  }
  assert.throws(() => preserveGroundMassRatios({left: {medium: 'ground', scale: 2, massScale: 1, height: .5, footBelowCentre: 0}}), /ground scale/);
});
