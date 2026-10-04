/** Compiled sparse linear blend field. No motion, solver or topology changes.
 * Compilation explicitly snapshots source geometry/weights. Every application
 * reads CURRENT matrices; there is no matrix-identity or output-result cache.
 * Private scratch prevents failed frames from partially publishing geometry.
 */
const states = new WeakMap();
const fail = message => { throw Error('Compiled skin field: ' + message); };

export function createCompiledSkinField(skin, width, height) {
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) fail('dimensions');
  if (skin?.schema !== 'cf.paint-skin/v1' || !Array.isArray(skin.vertices) ||
      skin.vertices.length < 3 || skin.vertices.length > 40000) fail('source vertices');
  const vertexCount = skin.vertices.length, jointNames = [], jointIds = new Map();
  const positions = new Float64Array(vertexCount * 2), offsets = new Uint32Array(vertexCount + 1);
  let weightCount = 0;
  for (let i = 0; i < vertexCount; i++) {
    const vertex = skin.vertices[i];
    if (!vertex || !Number.isFinite(vertex.x) || !Number.isFinite(vertex.y) ||
        vertex.x < 0 || vertex.x > width || vertex.y < 0 || vertex.y > height ||
        !Array.isArray(vertex.weights) || !vertex.weights.length || vertex.weights.length > 8) fail('source vertex');
    positions[i * 2] = vertex.x / width; positions[i * 2 + 1] = vertex.y / height;
    offsets[i] = weightCount;
    let sum = 0;
    const used = new Set();
    for (const entry of vertex.weights) {
      if (!Array.isArray(entry) || entry.length !== 2) fail('source weight');
      const [joint, weight] = entry;
      if (typeof joint !== 'string' || !joint.length || used.has(joint) ||
          !Number.isFinite(weight) || weight <= 0 || weight > 1) fail('source weight');
      used.add(joint); sum += weight; weightCount++;
      if (!jointIds.has(joint)) { jointIds.set(joint, jointNames.length); jointNames.push(joint); }
    }
    if (Math.abs(sum - 1) > 1e-8) fail('source weight sum');
  }
  offsets[vertexCount] = weightCount;
  const matrixOffsets = new Uint32Array(weightCount), weights = new Float64Array(weightCount);
  let entryIndex = 0;
  for (const vertex of skin.vertices) for (const [joint, weight] of vertex.weights) {
    matrixOffsets[entryIndex] = jointIds.get(joint) * 6;
    weights[entryIndex++] = weight;
  }
  const state = Object.freeze({ vertexCount, jointCount: jointNames.length, weightCount });
  states.set(state, {
    positions, offsets, matrixOffsets, weights, jointNames,
    matrixValues: new Float64Array(jointNames.length * 6),
    scratch32: new Float32Array(vertexCount * 2), scratch64: new Float64Array(vertexCount * 2),
  });
  return state;
}

/**
 * Each required joint lookup and each of its six components is read once per
 * call, including when matrix objects are edited in place between calls.
 * Weight order and Number arithmetic match applyPaintSkin exactly. The output
 * remains byte-identical to its prior state on missing/invalid/overflow input.
 */
export function applyCompiledSkinField(state, matrices, output) {
  const data = states.get(state);
  if (!data) fail('unknown compiled state');
  if (!(output instanceof Float32Array || output instanceof Float64Array) ||
      output.length !== state.vertexCount * 2) fail('position buffer');
  if (!matrices || typeof matrices !== 'object') fail('matrices');
  const { positions, offsets, matrixOffsets, weights, jointNames, matrixValues } = data;
  for (let joint = 0; joint < jointNames.length; joint++) {
    const name = jointNames[joint], matrix = matrices[name];
    if (!Object.hasOwn(matrices, name) || !matrix || matrix.length !== 6) fail('matrix: ' + name);
    const offset = joint * 6;
    for (let component = 0; component < 6; component++) {
      const value = matrix[component];
      if (!Number.isFinite(value)) fail('matrix: ' + name);
      matrixValues[offset + component] = value;
    }
  }
  const scratch = output instanceof Float32Array ? data.scratch32 : data.scratch64;
  for (let vertex = 0; vertex < state.vertexCount; vertex++) {
    const index = vertex * 2, x = positions[index], y = positions[index + 1];
    let px = 0, py = 0;
    for (let entry = offsets[vertex]; entry < offsets[vertex + 1]; entry++) {
      const matrix = matrixOffsets[entry], weight = weights[entry];
      px += (matrixValues[matrix] * x + matrixValues[matrix + 2] * y + matrixValues[matrix + 4]) * weight;
      py += (matrixValues[matrix + 1] * x + matrixValues[matrix + 3] * y + matrixValues[matrix + 5]) * weight;
    }
    scratch[index] = px; scratch[index + 1] = py;
    // Check AFTER the destination-precision conversion, including Float32 overflow.
    if (!Number.isFinite(scratch[index]) || !Number.isFinite(scratch[index + 1])) fail('overflow');
  }
  output.set(scratch);
}
