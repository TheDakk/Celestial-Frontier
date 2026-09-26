/* Only guarded local rotation/RHS and ordered symmetric sweeps. No allocation, imports,
 * globals, stack arrays, motion, projection, relaxation or fused arithmetic. */
static __attribute__((always_inline)) inline void row_sweep(
    unsigned row, const unsigned *rows, const unsigned *neighbours,
    const double *reciprocals, double *position, const double *rhs) {
  const unsigned base = row * 11, ii = rows[base], degree = rows[base + 1];
  double x = rhs[ii], y = rhs[ii + 1];
  unsigned k = 0;
  if (degree >= 4) {
    const unsigned a = rows[base + 3], b = rows[base + 4];
    const unsigned c = rows[base + 5], d = rows[base + 6];
    x += position[a]; y += position[a + 1];
    x += position[b]; y += position[b + 1];
    x += position[c]; y += position[c + 1];
    x += position[d]; y += position[d + 1];
    k = 4;
  }
  if (degree >= 8) {
    const unsigned a = rows[base + 7], b = rows[base + 8];
    const unsigned c = rows[base + 9], d = rows[base + 10];
    x += position[a]; y += position[a + 1];
    x += position[b]; y += position[b + 1];
    x += position[c]; y += position[c + 1];
    x += position[d]; y += position[d + 1];
    k = 8;
  }
  const unsigned start = rows[base + 2];
  for (; k < degree; ++k) {
    const unsigned j = neighbours[start + k];
    x += position[j]; y += position[j + 1];
  }
  position[ii] = x * reciprocals[row];
  position[ii + 1] = y * reciprocals[row];
}
/* Return 0 before any position write if robust JS norm scaling is required.
 * Rotation scratch may be partially written; the fallback recomputes it all. */
int cf_arap_pass(unsigned vertex_count, unsigned row_count, unsigned sweep_count,
    const unsigned *starts, const unsigned *neighbours, const double *deltas,
    const double *lambda, const unsigned *rows, const double *reciprocals,
    double *position, const double *target, double *rotation, double *rhs) {
  for (unsigned i = 0; i < vertex_count; ++i) {
    double dot = 0, cross = 0;
    const double ix = position[i * 2], iy = position[i * 2 + 1];
    for (unsigned k = starts[i]; k < starts[i + 1]; ++k) {
      const unsigned j = neighbours[k];
      const double px = ix - position[j], py = iy - position[j + 1];
      const double x = deltas[k * 2], y = deltas[k * 2 + 1];
      dot += x * px + y * py;
      cross += x * py - y * px;
    }
    const double squared = dot * dot + cross * cross;
    if (!(squared >= 1e-200 && squared <= 1e200)) return 0;
    const double length = __builtin_sqrt(squared);
    rotation[i * 2] = length > 1e-12 ? dot / length : 1;
    rotation[i * 2 + 1] = length > 1e-12 ? cross / length : 0;
  }
  for (unsigned row = 0; row < row_count; ++row) {
    const unsigned ii = rows[row * 11], i = ii / 2;
    const double l = lambda[i];
    double x = l * target[ii], y = l * target[ii + 1];
    for (unsigned k = starts[i]; k < starts[i + 1]; ++k) {
      const unsigned j = neighbours[k];
      const double c = (rotation[ii] + rotation[j]) * .5;
      const double q = (rotation[ii + 1] + rotation[j + 1]) * .5;
      const double dx = deltas[k * 2], dy = deltas[k * 2 + 1];
      x += c * dx - q * dy;
      y += q * dx + c * dy;
    }
    rhs[ii] = x; rhs[ii + 1] = y;
  }
  for (unsigned sweep = 0; sweep < sweep_count; ++sweep) {
    for (unsigned row = 0; row < row_count; ++row)
      row_sweep(row, rows, neighbours, reciprocals, position, rhs);
    for (unsigned row = row_count; row > 0;)
      row_sweep(--row, rows, neighbours, reciprocals, position, rhs);
  }
  return 1;
}
