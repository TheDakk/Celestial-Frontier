/** Browser-free geometry receipts for the native battle proof. Coordinates are
 * published mesh display units, not landmarks, alpha guesses or rest bounds.
 * No solver, habitat band, acceptance epsilon or CPU budget is defined here. */
const need = (ok, reason) => { if (!ok) throw Error('Painted envelope: ' + reason); };
const finite = (...values) => values.every(Number.isFinite);
function box(minX, minY, maxX, maxY) {
  need(finite(minX, minY, maxX, maxY) && maxX > minX && maxY > minY,
    'finite nonempty two-dimensional bounds required');
  return Object.freeze({minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY});
}
function checkedBounds(bounds) {
  need(bounds && typeof bounds === 'object', 'bounds required');
  const result = box(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY);
  need((bounds.width === undefined || bounds.width === result.width)
    && (bounds.height === undefined || bounds.height === result.height), 'bounds dimensions disagree');
  return result;
}
function checkedFrame(frame) {
  need(frame && finite(frame.width, frame.height) && frame.width > 0 && frame.height > 0,
    'positive finite frame required');
}
function checkedMedium(medium, band) {
  need(['ground', 'water', 'air'].includes(medium), 'unknown medium');
  need(band && finite(band.minY, band.maxY) && band.minY >= 0 && band.maxY <= 1
    && band.maxY > band.minY, 'valid normalized habitat band required');
}

/** Map<partId, Float32Array>, or iterable of {id, positions}. Supply EVERY
 * published mesh, including seam meshes. Read geometry.getBuffer('aPosition').data
 * after an accepted pose; the caller owns the complete mesh inventory. */
export function publishedMeshBounds(meshes) {
  need(meshes && typeof meshes[Symbol.iterator] === 'function', 'mesh inventory required');
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, vertexCount = 0;
  const ids = new Set();
  for (const entry of meshes) {
    const [id, positions] = Array.isArray(entry) ? entry : [entry?.id, entry?.positions];
    need(typeof id === 'string' && id.length > 0 && !ids.has(id), 'unique nonempty mesh id required');
    need(positions instanceof Float32Array && positions.length > 0 && positions.length % 2 === 0,
      `mesh ${id} needs published Float32 x/y pairs`);
    ids.add(id);
    for (let index = 0; index < positions.length; index += 2) {
      const x = positions[index], y = positions[index + 1];
      need(finite(x, y), `mesh ${id} has nonfinite published coordinates`);
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); vertexCount++;
    }
  }
  need(ids.size > 0, 'no published meshes');
  return Object.freeze({...box(minX, minY, maxX, maxY), meshCount: ids.size, vertexCount});
}

/** Refused/unchanged publications must never contribute their previous good
 * geometry to a motion sweep. Call BEFORE reading that sample's mesh buffers. */
export function assertPublishedSample({before, after}) {
  need(before && after && [before.applied, before.refusals, after.applied, after.refusals]
    .every(value => Number.isSafeInteger(value) && value >= 0), 'publication counters required');
  need(after.refusals === before.refusals, 'refused pose cannot count as a published sample');
  need(after.applied > before.applied, 'sample did not publish a fresh pose');
}

/** Union the full sweep; empty, absent or invalid samples throw rather than
 * disappearing from its envelope. The caller preserves timestamps/run IDs. */
export function mergePaintedBounds(samples) {
  need(samples && typeof samples[Symbol.iterator] === 'function', 'sweep samples required');
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, sampleCount = 0;
  for (const sample of samples) {
    const bounds = checkedBounds(sample);
    minX = Math.min(minX, bounds.minX); minY = Math.min(minY, bounds.minY);
    maxX = Math.max(maxX, bounds.maxX); maxY = Math.max(maxY, bounds.maxY); sampleCount++;
  }
  need(sampleCount > 0, 'no published sweep samples');
  return Object.freeze({...box(minX, minY, maxX, maxY), sampleCount});
}

/** One shared stage scale. massScale is the unmodified combatantScale result;
 * only water/air may cap it to their band. An explicit edgeReserveFraction is
 * presentation spacing on EACH band edge, never an acceptance tolerance.
 * foot is in display units (rig.foot * rig.cutout), not assumed centred at 0.5.
 * Ground standY/centreY are null: its existing ground registration owns placement.
 * `painted` feeds selectHabitatArena, and `scale` feeds BattleStage unchanged. */
export function fitPaintedEnvelope({bounds: input, foot, frame, medium, band, massScale,
  edgeReserveFraction = 0}) {
  const bounds = checkedBounds(input); checkedFrame(frame); checkedMedium(medium, band);
  need(foot && finite(foot.x, foot.y), 'finite display-space foot required');
  need(Number.isFinite(massScale) && massScale > 0, 'positive finite mass scale required');
  need(Number.isFinite(edgeReserveFraction) && edgeReserveFraction >= 0 && edgeReserveFraction < .5,
    'edge reserve must lie in [0, 0.5)');
  const free = (band.maxY - band.minY) * frame.height * (1 - 2 * edgeReserveFraction);
  const scale = medium === 'ground' ? massScale : Math.min(massScale, free / bounds.height);
  need(Number.isFinite(scale) && scale > 0, 'medium has no positive display scale');
  const height = bounds.height * scale / frame.height;
  const footBelowCentre = (foot.y - (bounds.minY + bounds.maxY) / 2) * scale / frame.height;
  const centreY = medium === 'ground' ? null : (band.minY + band.maxY) / 2;
  return Object.freeze({scale, painted: Object.freeze({height, footBelowCentre}), centreY,
    standY: centreY === null ? null : centreY + footBelowCentre});
}

function transformPoint(point, transform) {
  need(transform && typeof transform === 'object', 'display transform required');
  const {x, y, scaleX, scaleY, rotation = 0, pivotX = 0, pivotY = 0} = transform;
  need(finite(x, y, scaleX, scaleY, rotation, pivotX, pivotY) && scaleX !== 0 && scaleY !== 0,
    'finite nonzero display transform required');
  const px = (point.x - pivotX) * scaleX, py = (point.y - pivotY) * scaleY;
  const c = Math.cos(rotation), s = Math.sin(rotation);
  return {x: x + c * px - s * py, y: y + s * px + c * py};
}

/** Root THEN holder transforms, read from their ACTUAL current display state.
 * Include root x/y (normally -foot), dynamic root scale/pivot and holder facing.
 * Camera shake translates the arena AND habitat together: band containment uses
 * `arena`; viewport containment uses `viewport`. Rotated bounding boxes are
 * conservative envelopes; they never discard a corner to obtain a pass. */
export function placedPaintedBounds({bounds: input, root, holder, camera}) {
  const bounds = checkedBounds(input);
  need(camera && finite(camera.x, camera.y), 'finite current camera translation required');
  const points = [[bounds.minX, bounds.minY], [bounds.maxX, bounds.minY],
    [bounds.maxX, bounds.maxY], [bounds.minX, bounds.maxY]].map(([x, y]) =>
    transformPoint(transformPoint({x, y}, root), holder));
  const arena = box(Math.min(...points.map(p => p.x)), Math.min(...points.map(p => p.y)),
    Math.max(...points.map(p => p.x)), Math.max(...points.map(p => p.y)));
  const viewport = box(arena.minX + camera.x, arena.minY + camera.y,
    arena.maxX + camera.x, arena.maxY + camera.y);
  return Object.freeze({arena, viewport});
}

/** Exact geometric comparisons, with no epsilon or relaxed band. Ground is
 * exempt from band height only; every organism must remain in the viewport.
 * Refused findings remain data for the packet; callers must not count them PASS. */
export function assessPaintedContainment({placed, frame, medium, band}) {
  checkedFrame(frame); checkedMedium(medium, band);
  need(placed && typeof placed === 'object', 'placed bounds required');
  const arena = checkedBounds(placed.arena), viewport = checkedBounds(placed.viewport), findings = [];
  if (medium !== 'ground' && (arena.minY < band.minY * frame.height
      || arena.maxY > band.maxY * frame.height)) findings.push('medium-band');
  if (viewport.minX < 0 || viewport.maxX > frame.width
      || viewport.minY < 0 || viewport.maxY > frame.height) findings.push('viewport');
  return Object.freeze({status: findings.length ? 'REFUSED' : 'PASS',
    findings: Object.freeze(findings), medium, band: Object.freeze({...band}), arena, viewport});
}
