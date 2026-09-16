/* Only the ordered symmetric Gauss-Seidel sweeps. No allocation, imports,
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
void cf_arap_sweep(unsigned row_count, unsigned sweep_count,
    const unsigned *rows, const unsigned *neighbours,
    const double *reciprocals, double *position, const double *rhs) {
  for (unsigned sweep = 0; sweep < sweep_count; ++sweep) {
    for (unsigned row = 0; row < row_count; ++row)
      row_sweep(row, rows, neighbours, reciprocals, position, rhs);
    for (unsigned row = row_count; row > 0;)
      row_sweep(--row, rows, neighbours, reciprocals, position, rhs);
  }
}
