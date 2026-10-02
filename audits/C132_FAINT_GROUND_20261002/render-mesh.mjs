/** Software diagnostic of existing textured published triangles. Nearest sampling;
 * not the native Pixi renderer and never a visual acceptance receipt. */
export function rasterPaint(record, binding, atlas, positions, facing = 1) {
  const {width, height, groundLineY} = record.geometry;
  const rgba = new Uint8Array(width * height * 4);
  for (let i = 0; i < rgba.length; i += 4) rgba.set([235, 235, 232, 255], i);
  const ordered = ['far', 'near'].flatMap(layer => binding.paintSkin.parts.filter(part => binding.parts.find(p => p.id === part.id).layer === layer));
  for (const part of ordered) {
    const owner = binding.parts.find(p => p.id === part.id), dest = positions[part.id];
    const uv = part.vertices.map(v => v.triangle.reduce((p, index, k) => [p[0] + binding.paintSkin.vertices[index].x * v.barycentric[k], p[1] + binding.paintSkin.vertices[index].y * v.barycentric[k]], [owner.frame.x - owner.cutout.x, owner.frame.y - owner.cutout.y]));
    for (let i = 0; i < part.indices.length; i += 3) {
      const ids = part.indices.slice(i, i + 3), p = ids.map(j => [(facing === 1 ? dest[j * 2] : 1 - dest[j * 2]) * width, dest[j * 2 + 1] * height]);
      const [a, b, c] = p, d = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
      if (Math.abs(d) < 1e-12) throw Error('Degenerate published triangle');
      const x0 = Math.max(0, Math.floor(Math.min(...p.map(v => v[0])))), x1 = Math.min(width - 1, Math.ceil(Math.max(...p.map(v => v[0]))));
      const y0 = Math.max(0, Math.floor(Math.min(...p.map(v => v[1])))), y1 = Math.min(height - 1, Math.ceil(Math.max(...p.map(v => v[1]))));
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const u = ((b[1] - c[1]) * (x + .5 - c[0]) + (c[0] - b[0]) * (y + .5 - c[1])) / d;
        const v = ((c[1] - a[1]) * (x + .5 - c[0]) + (a[0] - c[0]) * (y + .5 - c[1])) / d, z = 1 - u - v;
        if (Math.min(u, v, z) < -1e-9) continue;
        const weights = [u, v, z], sx = Math.floor(ids.reduce((n, id, k) => n + uv[id][0] * weights[k], 0)), sy = Math.floor(ids.reduce((n, id, k) => n + uv[id][1] * weights[k], 0));
        if (sx < 0 || sy < 0 || sx >= atlas.width || sy >= atlas.height) continue;
        const si = (sy * atlas.width + sx) * 4, di = (y * width + x) * 4, alpha = atlas.data[si + 3] / 255;
        for (let k = 0; k < 3; k++) rgba[di + k] = Math.round(atlas.data[si + k] * alpha + rgba[di + k] * (1 - alpha));
      }
    }
  }
  const ground = Math.round(groundLineY * height);
  for (let x = 0; x < width; x++) rgba.set([180, 35, 35, 255], (ground * width + x) * 4);
  return {width, height, data: Buffer.from(rgba)};
}
