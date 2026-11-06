/**
 * Deformation diagnostics, not an art acceptor. Source positions are pixels;
 * assessDeformationQuality accepts posed pixels, or normalized positions plus
 * scaleX/scaleY. Construct once per mesh; assessment reuses all result buffers.
 *
 * Alpha exclusion is conservative: a triangle is empty only if no nonzero
 * source texel's footprint intersects it. The default 0.5px filter radius
 * includes linear texture filtering beyond the texel's unit square. Transparent
 * corners, triangle centroids and low alpha are never grounds for exclusion.
 */

const fail = message => { throw Error('Deformation quality: ' + message); };
const finitePositive = value => Number.isFinite(value) && value > 0;

/** Strict positive overlap on separating axes; mere boundary contact is empty. */
function overlapsTexel(ax, ay, bx, by, cx, cy, x, y, radius) {
  const left = x - radius, top = y - radius;
  const right = x + 1 + radius, bottom = y + 1 + radius;
  if (Math.max(ax, bx, cx) <= left || Math.min(ax, bx, cx) >= right ||
      Math.max(ay, by, cy) <= top || Math.min(ay, by, cy) >= bottom) return false;
  const centerX = (left + right) / 2, centerY = (top + bottom) / 2;
  const half = 0.5 + radius;
  for (let edge = 0; edge < 3; edge++) {
    const dx = edge === 0 ? bx - ax : edge === 1 ? cx - bx : ax - cx;
    const dy = edge === 0 ? by - ay : edge === 1 ? cy - by : ay - cy;
    if (dx === 0 && dy === 0) continue;
    const nx = -dy, ny = dx;
    const a = nx * ax + ny * ay, b = nx * bx + ny * by, c = nx * cx + ny * cy;
    const center = nx * centerX + ny * centerY, reach = half * (Math.abs(nx) + Math.abs(ny));
    if (Math.max(a, b, c) <= center - reach || Math.min(a, b, c) >= center + reach) return false;
  }
  return true;
}

function hasSourceInk(ax, ay, bx, by, cx, cy, alpha) {
  const { data, width, height, originX, originY, stride, offset, filterRadius } = alpha;
  ax -= originX; bx -= originX; cx -= originX;
  ay -= originY; by -= originY; cy -= originY;
  const left = Math.max(0, Math.floor(Math.min(ax, bx, cx) - 1 - filterRadius));
  const top = Math.max(0, Math.floor(Math.min(ay, by, cy) - 1 - filterRadius));
  const right = Math.min(width - 1, Math.ceil(Math.max(ax, bx, cx) + filterRadius));
  const bottom = Math.min(height - 1, Math.ceil(Math.max(ay, by, cy) + filterRadius));
  for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) {
    if (data[(y * width + x) * stride + offset] !== 0 &&
        overlapsTexel(ax, ay, bx, by, cx, cy, x, y, filterRadius)) return true;
  }
  return false;
}

/**
 * alpha: {data: Uint8Array|Uint8ClampedArray, width, height, originX=0,
 * originY=0, stride=4, offset=3, filterRadius=0.5}. An alpha-only buffer uses
 * stride:1, offset:0. Origins place a part's decoded cutout in source space.
 * Input geometry and alpha classification are captured now, not read per frame.
 */
export function createDeformationQuality({ positions, indices, alpha }) {
  if (!positions || positions.length < 6 || positions.length % 2) fail('source positions');
  if (!indices || !indices.length || indices.length % 3) fail('source indices');
  const rest = Float64Array.from(positions), vertexCount = rest.length / 2;
  for (const value of rest) if (!Number.isFinite(value)) fail('nonfinite source position');
  for (const index of indices) if (!Number.isInteger(index) || index < 0 || index >= vertexCount) fail('source index');
  const source = {
    ...alpha, originX: alpha?.originX ?? 0, originY: alpha?.originY ?? 0,
    stride: alpha?.stride ?? 4, offset: alpha?.offset ?? 3, filterRadius: alpha?.filterRadius ?? 0.5,
  };
  if (!(source.data instanceof Uint8Array || source.data instanceof Uint8ClampedArray) ||
      !Number.isInteger(source.width) || source.width <= 0 ||
      !Number.isInteger(source.height) || source.height <= 0 ||
      !Number.isInteger(source.stride) || source.stride <= 0 ||
      !Number.isInteger(source.offset) || source.offset < 0 || source.offset >= source.stride ||
      source.data.length !== source.width * source.height * source.stride ||
      !Number.isFinite(source.originX) || !Number.isFinite(source.originY) ||
      !Number.isFinite(source.filterRadius) || source.filterRadius < 0 || source.filterRadius > 1) fail('source alpha');
  const triangles = Uint32Array.from(indices), triangleCount = triangles.length / 3;
  const painted = new Uint8Array(triangleCount), measurable = new Uint8Array(triangleCount);
  const areas = new Float64Array(triangleCount), inverse = new Float64Array(triangleCount * 4);
  const edgeLengths = new Float64Array(triangleCount * 3);
  let paintedTriangles = 0, degenerateSourceTriangles = 0, unmeasurablePaintedTriangles = 0;
  for (let t = 0; t < triangleCount; t++) {
    const a = triangles[t * 3] * 2, b = triangles[t * 3 + 1] * 2, c = triangles[t * 3 + 2] * 2;
    const ax = rest[a], ay = rest[a + 1], bx = rest[b], by = rest[b + 1], cx = rest[c], cy = rest[c + 1];
    const ux = bx - ax, uy = by - ay, vx = cx - ax, vy = cy - ay, area = ux * vy - uy * vx;
    areas[t] = area;
    painted[t] = +hasSourceInk(ax, ay, bx, by, cx, cy, source);
    paintedTriangles += painted[t];
    if (area === 0) degenerateSourceTriangles++;
    const i = t * 4, e = t * 3;
    inverse[i] = vy / area; inverse[i + 1] = -vx / area;
    inverse[i + 2] = -uy / area; inverse[i + 3] = ux / area;
    edgeLengths[e] = Math.hypot(ux, uy);
    edgeLengths[e + 1] = Math.hypot(vx - ux, vy - uy);
    edgeLengths[e + 2] = Math.hypot(vx, vy);
    measurable[t] = +(Number.isFinite(area) && area !== 0 &&
      Number.isFinite(inverse[i]) && Number.isFinite(inverse[i + 1]) &&
      Number.isFinite(inverse[i + 2]) && Number.isFinite(inverse[i + 3]) &&
      finitePositive(edgeLengths[e]) && finitePositive(edgeLengths[e + 1]) && finitePositive(edgeLengths[e + 2]));
    if (painted[t] && !measurable[t]) unmeasurablePaintedTriangles++;
  }
  return {
    vertexCount, triangleCount, triangles, painted, measurable, areas, inverse, edgeLengths,
    metrics: {
      signedAreaRatio: new Float64Array(triangleCount), minEdgeRatio: new Float64Array(triangleCount),
      maxEdgeRatio: new Float64Array(triangleCount), minSingularValue: new Float64Array(triangleCount),
      maxSingularValue: new Float64Array(triangleCount), anisotropy: new Float64Array(triangleCount),
    },
    result: {
      schema: 'cf.deformation-quality/v1', scope: 'Geometry diagnostics only; not visual acceptance',
      vertices: vertexCount, triangles: triangleCount, paintedTriangles,
      emptyTriangles: triangleCount - paintedTriangles, degenerateSourceTriangles,
      unmeasurablePaintedTriangles, alphaFilterRadius: source.filterRadius,
    },
  };
}

/** Returns the SAME mutable scalar result object every call. Snapshot it to retain a frame. */
export function assessDeformationQuality(state, positions, scaleX = 1, scaleY = 1) {
  if (positions?.length !== state.vertexCount * 2) fail('posed position count');
  if (!finitePositive(scaleX) || !finitePositive(scaleY)) fail('posed scale');
  const { triangles, painted, measurable, areas, inverse, edgeLengths, metrics, result } = state;
  metrics.signedAreaRatio.fill(NaN); metrics.minEdgeRatio.fill(NaN); metrics.maxEdgeRatio.fill(NaN);
  metrics.minSingularValue.fill(NaN); metrics.maxSingularValue.fill(NaN); metrics.anisotropy.fill(NaN);
  let nonfiniteVertices = 0, nonfiniteTriangles = 0, nonfinitePaintedTriangles = 0;
  let flippedTriangles = 0, collapsedTriangles = 0, measuredTriangles = 0, arithmeticFailures = 0;
  let minSignedAreaRatio = Infinity, minAreaRatio = Infinity, maxAreaRatio = -Infinity;
  let minEdgeRatio = Infinity, maxEdgeRatio = -Infinity, minSingularValue = Infinity;
  let maxSingularValue = -Infinity, maxAnisotropy = -Infinity;
  let worstStretchTriangle = -1, worstCompressionTriangle = -1, worstAnisotropyTriangle = -1;
  for (let i = 0; i < positions.length; i += 2) {
    if (!Number.isFinite(positions[i] * scaleX) || !Number.isFinite(positions[i + 1] * scaleY)) nonfiniteVertices++;
  }
  for (let t = 0; t < state.triangleCount; t++) {
    const a = triangles[t * 3] * 2, b = triangles[t * 3 + 1] * 2, c = triangles[t * 3 + 2] * 2;
    const ax = positions[a] * scaleX, ay = positions[a + 1] * scaleY;
    const bx = positions[b] * scaleX, by = positions[b + 1] * scaleY;
    const cx = positions[c] * scaleX, cy = positions[c + 1] * scaleY;
    if (!Number.isFinite(ax) || !Number.isFinite(ay) || !Number.isFinite(bx) ||
        !Number.isFinite(by) || !Number.isFinite(cx) || !Number.isFinite(cy)) {
      nonfiniteTriangles++; if (painted[t]) nonfinitePaintedTriangles++; continue;
    }
    if (!painted[t] || !measurable[t]) continue;
    const ux = bx - ax, uy = by - ay, vx = cx - ax, vy = cy - ay;
    const signedAreaRatio = (ux * vy - uy * vx) / areas[t], areaRatio = Math.abs(signedAreaRatio);
    const e = t * 3, i = t * 4;
    const edge0 = Math.hypot(ux, uy) / edgeLengths[e];
    const edge1 = Math.hypot(vx - ux, vy - uy) / edgeLengths[e + 1];
    const edge2 = Math.hypot(vx, vy) / edgeLengths[e + 2];
    const shortest = Math.min(edge0, edge1, edge2), longest = Math.max(edge0, edge1, edge2);
    // F = posed edge matrix * inverse(rest edge matrix), independent of triangle shape.
    const f00 = ux * inverse[i] + vx * inverse[i + 2], f01 = ux * inverse[i + 1] + vx * inverse[i + 3];
    const f10 = uy * inverse[i] + vy * inverse[i + 2], f11 = uy * inverse[i + 1] + vy * inverse[i + 3];
    const m00 = f00 * f00 + f10 * f10, m11 = f01 * f01 + f11 * f11, m01 = f00 * f01 + f10 * f11;
    const largest = Math.sqrt((m00 + m11 + Math.hypot(m00 - m11, 2 * m01)) / 2);
    const smallest = largest === 0 ? 0 : Math.abs(f00 * f11 - f01 * f10) / largest;
    // Infinity denotes a singular collapse, not an invalid input or a passing value.
    const anisotropy = smallest === 0 ? Infinity : largest / smallest;
    if (!Number.isFinite(signedAreaRatio) || !Number.isFinite(shortest) || !Number.isFinite(longest) ||
        !Number.isFinite(largest) || !Number.isFinite(smallest) || Number.isNaN(anisotropy)) {
      arithmeticFailures++; continue;
    }
    measuredTriangles++;
    if (signedAreaRatio < 0) flippedTriangles++;
    if (signedAreaRatio === 0) collapsedTriangles++;
    metrics.signedAreaRatio[t] = signedAreaRatio;
    metrics.minEdgeRatio[t] = shortest; metrics.maxEdgeRatio[t] = longest;
    metrics.minSingularValue[t] = smallest; metrics.maxSingularValue[t] = largest;
    metrics.anisotropy[t] = anisotropy;
    minSignedAreaRatio = Math.min(minSignedAreaRatio, signedAreaRatio);
    minAreaRatio = Math.min(minAreaRatio, areaRatio); maxAreaRatio = Math.max(maxAreaRatio, areaRatio);
    minEdgeRatio = Math.min(minEdgeRatio, shortest); maxEdgeRatio = Math.max(maxEdgeRatio, longest);
    if (smallest < minSingularValue) { minSingularValue = smallest; worstCompressionTriangle = t; }
    if (largest > maxSingularValue) { maxSingularValue = largest; worstStretchTriangle = t; }
    if (anisotropy > maxAnisotropy) { maxAnisotropy = anisotropy; worstAnisotropyTriangle = t; }
  }
  result.nonfiniteVertices = nonfiniteVertices; result.nonfiniteTriangles = nonfiniteTriangles;
  result.nonfinitePaintedTriangles = nonfinitePaintedTriangles; result.arithmeticFailures = arithmeticFailures;
  result.finiteGeometry = nonfiniteVertices === 0 && arithmeticFailures === 0;
  result.measuredTriangles = measuredTriangles; result.flippedTriangles = flippedTriangles;
  result.collapsedTriangles = collapsedTriangles;
  result.minSignedAreaRatio = measuredTriangles ? minSignedAreaRatio : null;
  result.minAreaRatio = measuredTriangles ? minAreaRatio : null; result.maxAreaRatio = measuredTriangles ? maxAreaRatio : null;
  result.minEdgeRatio = measuredTriangles ? minEdgeRatio : null; result.maxEdgeRatio = measuredTriangles ? maxEdgeRatio : null;
  result.minSingularValue = measuredTriangles ? minSingularValue : null;
  result.maxSingularValue = measuredTriangles ? maxSingularValue : null;
  result.maxAnisotropy = measuredTriangles ? maxAnisotropy : null;
  result.worstStretchTriangle = worstStretchTriangle; result.worstCompressionTriangle = worstCompressionTriangle;
  result.worstAnisotropyTriangle = worstAnisotropyTriangle;
  return result;
}
