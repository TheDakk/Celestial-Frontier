/** Trace positive-alpha source pixels through their existing published triangles.
 * No generated pixels, source mask repair or ground adjustment. */
export function traceBelowGround(record, binding, atlas, positions, partId) {
  const skin = binding.paintSkin, part = skin.parts.find(p => p.id === partId), owner = binding.parts.find(p => p.id === partId);
  if (!part || !owner) throw Error('Missing source part');
  const source = part.vertices.map(v => v.triangle.reduce((p, index, k) => [p[0] + skin.vertices[index].x * v.barycentric[k], p[1] + skin.vertices[index].y * v.barycentric[k]], [0, 0]));
  const pixels = new Map();
  for (let i = 0; i < part.indices.length; i += 3) {
    const ids = part.indices.slice(i, i + 3), [a, b, c] = ids.map(j => source[j]);
    const d = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
    const x0 = Math.max(owner.cutout.x, Math.floor(Math.min(a[0], b[0], c[0]))), x1 = Math.min(owner.cutout.x + owner.cutout.width - 1, Math.ceil(Math.max(a[0], b[0], c[0])));
    const y0 = Math.max(owner.cutout.y, Math.floor(Math.min(a[1], b[1], c[1]))), y1 = Math.min(owner.cutout.y + owner.cutout.height - 1, Math.ceil(Math.max(a[1], b[1], c[1])));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const u = ((b[1] - c[1]) * (x + .5 - c[0]) + (c[0] - b[0]) * (y + .5 - c[1])) / d;
      const v = ((c[1] - a[1]) * (x + .5 - c[0]) + (a[0] - c[0]) * (y + .5 - c[1])) / d, z = 1 - u - v;
      if (Math.min(u, v, z) < -1e-9) continue;
      const ax = owner.frame.x + x - owner.cutout.x, ay = owner.frame.y + y - owner.cutout.y, alpha = atlas.data[(ay * atlas.width + ax) * 4 + 3];
      if (!alpha) continue;
      const weights = [u, v, z], py = ids.reduce((n, id, k) => n + positions[partId][id * 2 + 1] * weights[k], 0);
      if (py > record.geometry.groundLineY) pixels.set(x + ':' + y, {source: [x, y], atlas: [ax, ay], alpha, face: i / 3, vertices: ids, publishedX: ids.reduce((n, id, k) => n + positions[partId][id * 2] * weights[k], 0), publishedY: py, depthPx: (py - record.geometry.groundLineY) * record.geometry.height});
    }
  }
  const rows = [...pixels.values()].sort((a, b) => b.depthPx - a.depthPx);
  const seen = new Set(), components = [];
  // Connectivity is measured on the entire source-owned alpha, including pixels
  // currently above ground, not merely on the crossed subset.
  for (const pixel of rows) {
    const key = pixel.source.join(':'); if (seen.has(key)) continue;
    const todo = [pixel.source], members = [], crossing = [];
    seen.add(key);
    while (todo.length) {
      const [x, y] = todo.pop(); members.push([x, y]); const crossed = pixels.get(x + ':' + y); if (crossed) crossing.push(crossed);
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (nx < owner.cutout.x || ny < owner.cutout.y || nx >= owner.cutout.x + owner.cutout.width || ny >= owner.cutout.y + owner.cutout.height) continue;
        const nk = nx + ':' + ny; if (seen.has(nk)) continue;
        const ax = owner.frame.x + nx - owner.cutout.x, ay = owner.frame.y + ny - owner.cutout.y;
        if (atlas.data[(ay * atlas.width + ax) * 4 + 3] === 0) continue;
        seen.add(nk); todo.push([nx, ny]);
      }
    }
    const sourceBounds = members.reduce((b, [x, y]) => ({minX: Math.min(b.minX, x), maxX: Math.max(b.maxX, x), minY: Math.min(b.minY, y), maxY: Math.max(b.maxY, y)}), {minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity});
    components.push({sourceOpaquePixels: members.length, belowGroundSourcePixels: crossing.length, sourceBounds, maximumDepthPx: crossing.reduce((n, p) => Math.max(n, p.depthPx), 0)});
  }
  return {partId, positiveAlphaSourcePixelsBelow: rows.length, deepest: rows[0] ?? null, components};
}
