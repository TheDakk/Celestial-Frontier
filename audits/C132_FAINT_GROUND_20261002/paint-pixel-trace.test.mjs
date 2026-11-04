import {test} from 'node:test';
import assert from 'node:assert/strict';
import {traceBelowGround} from './paint-pixel-trace.mjs';
function fixture() {
  const vertices = [[0, 0], [4, 0], [4, 4], [0, 4]].map(([x, y]) => ({x, y}));
  const part = id => ({id, vertices: vertices.map((_, i) => ({triangle: [i, i, i], barycentric: [1, 0, 0]})), indices: [0, 1, 2, 0, 2, 3]});
  const owner = (id, x) => ({id, cutout: {x: 0, y: 0, width: 4, height: 4}, frame: {x, y: 0, width: 4, height: 4}});
  const data = new Uint8Array(8 * 4 * 4); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) data[(y * 8 + x) * 4 + 3] = 255;
  return {record: {geometry: {width: 4, height: 4, groundLineY: .5}}, binding: {paintSkin: {vertices, parts: [part('head'), part('overlap')]}, parts: [owner('head', 0), owner('overlap', 4)]}, atlas: {width: 8, height: 4, data}, positions: {head: Float32Array.of(0, 0, 1, 0, 1, 1, 0, 1), overlap: Float32Array.of(0, 0, 1, 0, 1, 1, 0, 1)}};
}
test('reports actual positive-alpha source pixels and source connectivity, not empty mesh extent', () => {
  const f = fixture(), measure = () => traceBelowGround(f.record, f.binding, f.atlas, f.positions, 'head');
  const actual = measure(); assert.equal(actual.positiveAlphaSourcePixelsBelow, 8); assert.equal(actual.components[0].sourceOpaquePixels, 16); assert.equal(actual.deepest.depthPx, 1.5);
  for (let y = 2; y < 4; y++) for (let x = 0; x < 4; x++) f.atlas.data[(y * 8 + x) * 4 + 3] = 0;
  assert.equal(measure().positiveAlphaSourcePixelsBelow, 0, 'Identical below-ground geometry with no alpha must not invent visible ink');
});
test('overlapping source rectangles retain independent atlas paint ownership', () => {
  const f = fixture();
  assert.equal(traceBelowGround(f.record, f.binding, f.atlas, f.positions, 'overlap').positiveAlphaSourcePixelsBelow, 0);
  assert.equal(traceBelowGround(f.record, f.binding, f.atlas, f.positions, 'head').positiveAlphaSourcePixelsBelow, 8);
  f.positions.head = Float32Array.of(0, 0, 1, 0, 1, .5, 0, .5);
  assert.equal(traceBelowGround(f.record, f.binding, f.atlas, f.positions, 'head').positiveAlphaSourcePixelsBelow, 0, 'The same visible source above ground must clear');
});
