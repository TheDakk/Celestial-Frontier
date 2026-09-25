/* Exact ordered forward orientation sweeps. Memory-only leaf, no allocation,
 * imports, relaxed arithmetic, budget changes, or active-set projection. */
static __attribute__((always_inline)) inline int same_number(double a, double b) {
  if (a == b) {
    if (a != 0) return 1;
    union { double number; unsigned long long bits; } x, y;
    x.number = a; y.number = b;
    return x.bits == y.bits;
  }
  return a != a && b != b; /* Object.is considers all NaNs identical. */
}

/* Low seven bits: passes. Bit seven: JS orientationQueue.stalled. */
unsigned cf_orientation_forward(double *p, const unsigned *dofs,
    const signed char *signs, const double *floors,
    const unsigned char *movable, unsigned count, unsigned iterations) {
  unsigned passes = 0;
  for (unsigned pass = 0; pass < iterations; ++pass) {
    unsigned changed = 0;
    int progressed = 0;
    for (unsigned triangle = 0; triangle < count; ++triangle) {
      const unsigned k = triangle * 3, a = dofs[k], b = dofs[k + 1], c = dofs[k + 2];
      const double sign = signs[triangle];
      const unsigned mask = movable[triangle];
      const double area = (p[b] - p[a]) * (p[c + 1] - p[a + 1])
                        - (p[b + 1] - p[a + 1]) * (p[c] - p[a]);
      const double constraint = area * sign - floors[triangle];
      if (constraint >= 0) continue;
      ++changed;
      const double ax = p[b + 1] - p[c + 1], ay = p[c] - p[b];
      const double bx = p[c + 1] - p[a + 1], by = p[a] - p[c];
      const double cx = p[a + 1] - p[b + 1], cy = p[b] - p[a];
      const double norm = ((mask & 1) ? ax * ax + ay * ay : 0)
                        + ((mask & 2) ? bx * bx + by * by : 0)
                        + ((mask & 4) ? cx * cx + cy * cy : 0);
      if (norm < 1e-20) continue;
      const double scale = -constraint * sign / norm;
      if (mask & 1) {
        const double x = p[a], y = p[a + 1];
        p[a] += scale * ax; p[a + 1] += scale * ay;
        if (!same_number(x, p[a]) || !same_number(y, p[a + 1])) progressed = 1;
      }
      if (mask & 2) {
        const double x = p[b], y = p[b + 1];
        p[b] += scale * bx; p[b + 1] += scale * by;
        if (!same_number(x, p[b]) || !same_number(y, p[b + 1])) progressed = 1;
      }
      if (mask & 4) {
        const double x = p[c], y = p[c + 1];
        p[c] += scale * cx; p[c + 1] += scale * cy;
        if (!same_number(x, p[c]) || !same_number(y, p[c + 1])) progressed = 1;
      }
    }
    passes = pass + 1;
    if (!changed || !progressed) return passes | (!progressed ? 128 : 0);
  }
  return passes;
}
