import test from 'node:test';
import assert from 'node:assert/strict';
import { createDeformationQuality, assessDeformationQuality } from './deformation-quality.mjs';

const triangle = [0, 0, 8, 0, 0, 8];
const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);
const alpha = (width = 10, height = 10, painted = true) => ({
  data: new Uint8Array(width * height).fill(painted ? 255 : 0), width, height, stride: 1, offset: 0,
});
const make = (positions = triangle, mask = alpha()) => createDeformationQuality({ positions, indices: [0, 1, 2], alpha: mask });
const transform = (positions, a, b, c, d, tx = 0, ty = 0) => positions.map((_, i) => {
  const j = i - i % 2, x = positions[j], y = positions[j + 1];
  return i % 2 ? b * x + d * y + ty : a * x + c * y + tx;
});

test('rest and arbitrary rigid rotation/translation preserve all measures; output and buffers are reused', () => {
  const state = make(), result = assessDeformationQuality(state, triangle);
  const metrics = state.metrics, areaBuffer = metrics.signedAreaRatio;
  assert.equal(result.paintedTriangles, 1); assert.equal(result.emptyTriangles, 0);
  assert.equal(result.finiteGeometry, true); assert.equal(result.flippedTriangles, 0);
  assert.equal(result.collapsedTriangles, 0); assert.equal(result.arithmeticFailures, 0);
  for (const key of ['minAreaRatio', 'maxAreaRatio', 'minEdgeRatio', 'maxEdgeRatio', 'minSingularValue', 'maxSingularValue', 'maxAnisotropy']) close(result[key], 1);
  const angle = 0.783, c = Math.cos(angle), s = Math.sin(angle);
  assert.equal(assessDeformationQuality(state, transform(triangle, c, s, -s, c, 31, -27)), result);
  assert.equal(state.metrics, metrics); assert.equal(metrics.signedAreaRatio, areaBuffer);
  close(result.minAreaRatio, 1); close(result.maxEdgeRatio, 1); close(result.maxAnisotropy, 1);
  assert.equal(result.flippedTriangles, 0); assert.equal(result.collapsedTriangles, 0);
  assert.equal('accepted' in result, false); assert.equal('pass' in result, false);
});

test('flipped, collapsed, compressed and stretched triangles expose distinct failures without thresholds', () => {
  const state = make();
  const flipped = assessDeformationQuality(state, transform(triangle, -1, 0, 0, 1));
  assert.equal(flipped.flippedTriangles, 1); close(flipped.minSignedAreaRatio, -1);
  close(flipped.maxAnisotropy, 1); // A reflection has no stretch but is still a flip.
  const collapsed = assessDeformationQuality(state, transform(triangle, 1, 0, 0, 0));
  assert.equal(collapsed.collapsedTriangles, 1); assert.equal(collapsed.minAreaRatio, 0);
  assert.equal(collapsed.minSingularValue, 0); assert.equal(collapsed.maxAnisotropy, Infinity);
  const stretched = assessDeformationQuality(state, transform(triangle, 4, 0, 0, 0.25));
  close(stretched.maxAreaRatio, 1); // Area alone misses destructive anisotropic stretching.
  close(stretched.maxSingularValue, 4); close(stretched.minSingularValue, 0.25);
  close(stretched.maxAnisotropy, 16); close(stretched.maxEdgeRatio, 4);
  assert.equal(stretched.worstStretchTriangle, 0);
  const compressed = assessDeformationQuality(state, transform(triangle, 1e-8, 0, 0, 1));
  assert.equal(compressed.collapsedTriangles, 0); close(compressed.minAreaRatio, 1e-8);
  assert.ok(compressed.maxAnisotropy > 9e7); // Near collapse remains visible, never rounded to a pass.
});

test('anisotropy uses the full deformation gradient and survives skewed source triangles', () => {
  const rest = [1, 1, 7, 2, 6, 8], state = make(rest);
  const result = assessDeformationQuality(state, transform(rest, 1, 0, 3, 1, 17, 19));
  close(result.minAreaRatio, 1);
  const largest = Math.sqrt((11 + Math.sqrt(117)) / 2);
  close(result.maxSingularValue, largest); close(result.minSingularValue, 1 / largest);
  close(result.maxAnisotropy, largest * largest);
  const rigid = assessDeformationQuality(state, transform(rest, 0, -1, 1, 0));
  close(rigid.maxAnisotropy, 1); close(rigid.minAreaRatio, 1);
});

test('genuinely transparent triangles are excluded, but finite geometry is still checked', () => {
  const state = make(triangle, alpha(10, 10, false));
  const empty = assessDeformationQuality(state, transform(triangle, -100, 0, 0, 1));
  assert.equal(empty.emptyTriangles, 1); assert.equal(empty.paintedTriangles, 0);
  assert.equal(empty.measuredTriangles, 0); assert.equal(empty.minAreaRatio, null);
  assert.equal(empty.flippedTriangles, 0); assert.equal(empty.finiteGeometry, true);
  const corrupt = triangle.slice(); corrupt[0] = NaN;
  const invalid = assessDeformationQuality(state, corrupt);
  assert.equal(invalid.nonfiniteVertices, 1); assert.equal(invalid.nonfiniteTriangles, 1);
  assert.equal(invalid.nonfinitePaintedTriangles, 0); assert.equal(invalid.finiteGeometry, false);
});

test('ink inside a triangle counts even when vertices and centroid are transparent', () => {
  const mask = alpha(10, 10, false); mask.data[1 * 10 + 5] = 1;
  const state = make(triangle, mask);
  assert.equal(state.result.paintedTriangles, 1); // A single alpha-1 texel cannot be dismissed.
  assert.equal(assessDeformationQuality(state, transform(triangle, -1, 0, 0, 1)).flippedTriangles, 1);
});

test('bounding-box ink outside the triangle does not count, but a sliver crossing a texel does', () => {
  const mask = alpha(10, 10, false); mask.data[8 * 10 + 8] = 255;
  assert.equal(make(triangle, mask).result.emptyTriangles, 1);
  const narrowMask = alpha(4, 4, false); narrowMask.data[1 * 4 + 1] = 255;
  narrowMask.filterRadius = 0;
  const sliver = [1.05, 0, 1.10, 3, 1.15, 0]; // Crosses cell, misses its centre.
  const state = make(sliver, narrowMask);
  assert.equal(state.result.paintedTriangles, 1);
  assert.equal(assessDeformationQuality(state, transform(sliver, -1, 0, 0, 1)).flippedTriangles, 1);
});

test('bilinear support, cutout origin, RGBA alpha and normalized rig output are handled explicitly', () => {
  const mask = alpha(4, 4, false); mask.data[1 * 4 + 1] = 255;
  const nearby = [2.1, 1.1, 2.3, 1.1, 2.1, 1.3];
  assert.equal(make(nearby, mask).result.paintedTriangles, 1);
  assert.equal(make(nearby, { ...mask, filterRadius: 0 }).result.emptyTriangles, 1);
  const rgba = new Uint8Array(4 * 4 * 4); rgba[(1 * 4 + 1) * 4 + 3] = 1;
  const rest = [101, 201, 103, 201, 101, 203];
  const state = make(rest, { data: rgba, width: 4, height: 4, originX: 100, originY: 200 });
  assert.equal(state.result.paintedTriangles, 1);
  const result = assessDeformationQuality(state, rest.map((v, i) => v / (i % 2 ? 300 : 200)), 200, 300);
  close(result.minAreaRatio, 1); close(result.maxAnisotropy, 1);
});

test('painted zero-area source triangles and nonfinite/overflow poses cannot produce complete measurements', () => {
  const degenerate = make([1, 1, 2, 2, 3, 3]);
  const result = assessDeformationQuality(degenerate, [1, 1, 2, 3, 3, 3]);
  assert.equal(result.degenerateSourceTriangles, 1);
  assert.equal(result.unmeasurablePaintedTriangles, 1); assert.equal(result.measuredTriangles, 0);
  const state = make(), broken = triangle.slice(); broken[3] = Infinity;
  assert.equal(assessDeformationQuality(state, broken).nonfinitePaintedTriangles, 1);
  const overflow = assessDeformationQuality(state, [0, 0, 1e308, 0, 0, 1e308]);
  assert.equal(overflow.arithmeticFailures, 1); assert.equal(overflow.finiteGeometry, false);
});

test('mixed triangles count ink individually and classify only the actual corrupt/strained triangle', () => {
  const rest = [0, 0, 4, 0, 0, 4, 10, 10, 14, 10, 10, 14];
  const mask = alpha(16, 16, false); mask.data[1 * 16 + 1] = 255;
  const state = createDeformationQuality({ positions: rest, indices: [0, 1, 2, 3, 4, 5], alpha: mask });
  const posed = rest.slice(); posed[8] = -100;
  const result = assessDeformationQuality(state, posed);
  assert.equal(result.paintedTriangles, 1); assert.equal(result.emptyTriangles, 1);
  close(result.maxEdgeRatio, 1); assert.equal(result.flippedTriangles, 0);
  assert.ok(Number.isNaN(state.metrics.signedAreaRatio[1]));
  posed[2] = 16;
  assert.equal(assessDeformationQuality(state, posed).worstStretchTriangle, 0);
  close(state.metrics.maxSingularValue[0], 4);
});

test('malformed source, missing alpha and malformed posed buffers refuse before measurements', () => {
  assert.throws(() => createDeformationQuality({ positions: triangle, indices: [0, 1, 2] }), /source alpha/);
  assert.throws(() => make([0, 0, NaN, 0, 0, 4]), /source position/);
  assert.throws(() => createDeformationQuality({ positions: triangle, indices: [0, 1, 99], alpha: alpha() }), /source index/);
  assert.throws(() => make(triangle, { ...alpha(), data: new Uint8Array(3) }), /source alpha/);
  const state = make();
  assert.throws(() => assessDeformationQuality(state, [0, 0]), /posed position count/);
  assert.throws(() => assessDeformationQuality(state, triangle, 0, 1), /posed scale/);
});
