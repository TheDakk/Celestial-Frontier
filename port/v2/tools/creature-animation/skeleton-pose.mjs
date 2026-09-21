/** Family-neutral inherited pose evaluation. Template owners supply the graph
 * and body axis; painter/authored records supply actual normalized landmarks.
 * This does not infer anatomy, admit assets, choose clips or qualify a family. */
import {composeAffine, rotationAround, scaleAround, IDENTITY_AFFINE} from './kinematics.ts';
export const MAX_SKELETON_JOINTS = 64;
const need = (ok, reason) => { if (!ok) throw Error('Skeleton pose: ' + reason); };
const nameIsSafe = name => typeof name === 'string' && /^[A-Za-z][A-Za-z0-9]*$/.test(name)
  && !['constructor', 'prototype', '__proto__'].includes(name);
/** `options.jointScale` (morph M1, additive, default none): a uniform scale about the joint's own pivot composed into
 * that joint's local frame — its whole sub-tree inherits it. Rest pose is then no longer identity for those joints. */
export function createSkeletonPoseProgram(definition, landmarks, options = {}) {
  need(definition && Array.isArray(definition.graph) && definition.graph.length > 0
    && definition.graph.length < MAX_SKELETON_JOINTS, 'joint budget');
  const names = ['root'], seen = new Set(names), parents = [undefined];
  for (const pair of definition.graph) {
    need(Array.isArray(pair) && pair.length === 2, 'graph pair');
    const [child, parent] = pair;
    need(nameIsSafe(child) && nameIsSafe(parent), 'joint name');
    need(!seen.has(child), 'duplicate joint: ' + child);
    need(seen.has(parent), 'parent must precede child: ' + child);
    names.push(child); parents.push(parent); seen.add(child);
  }
  need(landmarks && typeof landmarks === 'object' && !Array.isArray(landmarks)
    && Object.keys(landmarks).length === names.length, 'exact landmark inventory');
  const points = Object.create(null);
  for (const name of names) {
    const p = Object.hasOwn(landmarks, name) ? landmarks[name] : undefined;
    need(Array.isArray(p) && p.length === 2 && p.every(v => Number.isFinite(v) && v >= 0 && v <= 1),
      'normalized landmark: ' + name);
    points[name] = Object.freeze({x: p[0], y: p[1]});
  }
  const axis = definition.bodyAxis;
  need(Array.isArray(axis) && axis.length === 2 && axis.every(n => seen.has(n)), 'explicit body axis');
  const a = points[axis[0]], b = points[axis[1]], bodyLength = Math.hypot(b.x - a.x, b.y - a.y);
  need(bodyLength >= .000001, 'degenerate body axis');
  const pivots = names.map((_, i) => points[parents[i] ?? 'root']);
  const index = new Map(names.map((n, i) => [n, i]));
  const scales = names.map(() => IDENTITY_AFFINE);
  if (options.jointScale !== undefined) {
    need(options.jointScale && typeof options.jointScale === 'object' && !Array.isArray(options.jointScale), 'jointScale map');
    for (const [name, s] of Object.entries(options.jointScale)) { need(index.has(name), 'unknown scaled joint: ' + name); need(Number.isFinite(s) && s > 0, 'positive joint scale: ' + name); scales[index.get(name)] = scaleAround(pivots[index.get(name)], s); }
  }
  return Object.freeze({
    jointNames: Object.freeze(names), bodyLength,
    pivot(name) { need(index.has(name), 'unknown pivot joint: ' + name); return pivots[index.get(name)]; },
    evaluate(pose) {
      need(pose && typeof pose === 'object' && !Array.isArray(pose), 'invalid pose');
      // Validate all supplied keys before calculating or returning any frame.
      for (const [name, key] of Object.entries(pose)) {
        need(seen.has(name), 'unknown pose joint: ' + name);
        need(key && Number.isFinite(key.rotation) && Number.isFinite(key.dx ?? 0)
          && Number.isFinite(key.dy ?? 0), 'nonfinite pose');
      }
      const matrices = Object.create(null);
      for (let i = 0; i < names.length; i++) {
        const name = names[i], parent = parents[i], key = Object.hasOwn(pose, name) ? pose[name] : undefined;
        const rotated = key ? rotationAround(pivots[i], key.rotation,
          {x: (key.dx ?? 0) * bodyLength, y: (key.dy ?? 0) * bodyLength}) : IDENTITY_AFFINE;
        const local = scales[i] === IDENTITY_AFFINE ? rotated : composeAffine(rotated, scales[i]);
        matrices[name] = parent ? composeAffine(matrices[parent], local) : local;
      }
      return matrices;
    },
  });
}
