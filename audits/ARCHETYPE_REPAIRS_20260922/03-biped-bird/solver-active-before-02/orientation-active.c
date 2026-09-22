/* Exact ordered active-set orientation projection. Memory-only leaf; no
 * allocation, imports, relaxed arithmetic, deduplication or changed budgets. */
#define INLINE static __attribute__((always_inline)) inline
INLINE int same_number(double a, double b) {
  if (a == b) {
    if (a != 0) return 1;
    union { double number; unsigned long long bits; } x, y;
    x.number = a; y.number = b;
    return x.bits == y.bits;
  }
  return a != a && b != b;
}
INLINE int before(const double *priority, unsigned a, unsigned b) {
  return priority[a] > priority[b] || (priority[a] == priority[b] && a < b);
}
INLINE void swap(unsigned *heap, int *location, unsigned i, unsigned j) {
  const unsigned a = heap[i], b = heap[j];
  heap[i] = b; heap[j] = a; location[a] = j; location[b] = i;
}
INLINE void repair(unsigned *heap, int *location, const double *priority,
    unsigned size, unsigned pos) {
  while (pos > 0) {
    const unsigned parent = (pos - 1) >> 1;
    if (!before(priority, heap[pos], heap[parent])) break;
    swap(heap, location, pos, parent); pos = parent;
  }
  for (;;) {
    const unsigned left = pos * 2 + 1;
    if (left >= size) break;
    const unsigned right = left + 1;
    const unsigned best = right < size && before(priority, heap[right], heap[left]) ? right : left;
    if (!before(priority, heap[best], heap[pos])) break;
    swap(heap, location, best, pos); pos = best;
  }
}
INLINE void remove_triangle(unsigned *heap, int *location, const double *priority,
    unsigned *state, unsigned t) {
  const int pos = location[t];
  if (pos < 0) return;
  const unsigned last = heap[--state[0]];
  location[t] = -1;
  if ((unsigned)pos < state[0]) {
    heap[pos] = last; location[last] = pos;
    repair(heap, location, priority, state[0], pos);
  }
}
INLINE void update(const double *p, const unsigned *d, const signed char *signs,
    const double *floors, const unsigned char *movable, unsigned *heap,
    int *location, double *priority, unsigned *state, unsigned t) {
  const unsigned k = t * 3, a = d[k], b = d[k + 1], c = d[k + 2];
  const double area = ((p[b] - p[a]) * (p[c + 1] - p[a + 1])
                    - (p[b + 1] - p[a + 1]) * (p[c] - p[a])) * signs[t];
  const double value = 1 - area / floors[t];
  priority[t] = value;
  if (value <= 1e-12 || movable[t] == 0) {
    remove_triangle(heap, location, priority, state, t); return;
  }
  int pos = location[t];
  if (pos < 0) { pos = state[0]++; heap[pos] = t; location[t] = pos; }
  repair(heap, location, priority, state[0], pos);
}

/* state = [size, projections, visits]. The caller has reset the active queue
 * before forward projection. Unused heap slots remain byte-for-byte observable. */
unsigned cf_orientation_active(double *p, const unsigned *d,
    const signed char *signs, const double *floors, const unsigned char *movable,
    const unsigned *starts, const unsigned *incident, unsigned *heap,
    int *location, double *priority, unsigned *state, unsigned count,
    unsigned iterations) {
  for (unsigned t = 0; t < count; ++t)
    update(p, d, signs, floors, movable, heap, location, priority, state, t);
  const unsigned budget = count * iterations;
  while (state[0] && priority[heap[0]] >= .5 && state[2] < budget) {
    const unsigned t = heap[0], k = t * 3, a = d[k], b = d[k + 1], c = d[k + 2];
    const unsigned mask = movable[t];
    const double sign = signs[t];
    ++state[2];
    const double area = (p[b] - p[a]) * (p[c + 1] - p[a + 1])
                      - (p[b + 1] - p[a + 1]) * (p[c] - p[a]);
    const double constraint = area * sign - floors[t];
    const double ax = p[b + 1] - p[c + 1], ay = p[c] - p[b];
    const double bx = p[c + 1] - p[a + 1], by = p[a] - p[c];
    const double cx = p[a + 1] - p[b + 1], cy = p[b] - p[a];
    const double norm = ((mask & 1) ? ax * ax + ay * ay : 0)
                      + ((mask & 2) ? bx * bx + by * by : 0)
                      + ((mask & 4) ? cx * cx + cy * cy : 0);
    if (norm < 1e-20) { remove_triangle(heap, location, priority, state, t); continue; }
    const double scale = -constraint * sign / norm;
    int changed = 0;
    if (mask & 1) {
      const double x = p[a], y = p[a + 1];
      p[a] += scale * ax; p[a + 1] += scale * ay;
      changed = changed || !same_number(x, p[a]) || !same_number(y, p[a + 1]);
    }
    if (mask & 2) {
      const double x = p[b], y = p[b + 1];
      p[b] += scale * bx; p[b + 1] += scale * by;
      changed = changed || !same_number(x, p[b]) || !same_number(y, p[b + 1]);
    }
    if (mask & 4) {
      const double x = p[c], y = p[c + 1];
      p[c] += scale * cx; p[c + 1] += scale * cy;
      changed = changed || !same_number(x, p[c]) || !same_number(y, p[c + 1]);
    }
    if (!changed) { remove_triangle(heap, location, priority, state, t); continue; }
    ++state[1];
    for (unsigned corner = 0; corner < 3; ++corner) {
      if (!(mask & (1u << corner))) continue;
      const unsigned v = d[k + corner] / 2;
      for (unsigned i = starts[v]; i < starts[v + 1]; ++i)
        update(p, d, signs, floors, movable, heap, location, priority, state, incident[i]);
    }
  }
  return (state[2] + count - 1) / count;
}
