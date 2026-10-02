from pathlib import Path
import os
ROOT=Path(__file__).resolve().parents[2]; OUT=Path(__file__).resolve().parent
source=ROOT/'port/v2/tools/creature-animation/arap-sweep.c'; s=source.read_text()
a='''    double dot = 0, cross = 0;
    const double ix = position[i * 2], iy = position[i * 2 + 1];'''
b='''    v128_t sums = wasm_f64x2_splat(0);
    const v128_t origin = wasm_v128_load(position + i * 2);'''
assert s.count(a)==1;s=s.replace(a,b)
a='''      const double px = ix - position[j], py = iy - position[j + 1];
      const double x = deltas[k * 2], y = deltas[k * 2 + 1];
      dot += x * px + y * py;
      cross += x * py - y * px;
    }
    const double squared'''
b='''      const v128_t delta = wasm_f64x2_sub(origin, wasm_v128_load(position + j));
      const v128_t swapped = wasm_i64x2_shuffle(delta, delta, 1, 0);
      const v128_t first = wasm_f64x2_mul(wasm_f64x2_splat(deltas[k * 2]), delta);
      const v128_t second = wasm_f64x2_mul(wasm_f64x2_splat(deltas[k * 2 + 1]), swapped);
      const v128_t signed_second = wasm_v128_xor(second, wasm_i64x2_make(0, (-9223372036854775807LL - 1)));
      sums = wasm_f64x2_add(sums, wasm_f64x2_add(first, signed_second));
    }
    const double dot = wasm_f64x2_extract_lane(sums, 0), cross = wasm_f64x2_extract_lane(sums, 1);
    const double squared'''
assert s.count(a)==1;s=s.replace(a,b)
a='''    double x = l * target[ii], y = l * target[ii + 1];'''
b='''    v128_t sums = wasm_f64x2_mul(wasm_f64x2_splat(l), wasm_v128_load(target + ii));'''
assert s.count(a)==1;s=s.replace(a,b)
a='''      const double c = (rotation[ii] + rotation[j]) * .5;
      const double q = (rotation[ii + 1] + rotation[j + 1]) * .5;
      const double dx = deltas[k * 2], dy = deltas[k * 2 + 1];
      x += c * dx - q * dy;
      y += q * dx + c * dy;
    }
    rhs[ii] = x; rhs[ii + 1] = y;'''
b='''      const v128_t r = wasm_f64x2_mul(wasm_f64x2_add(wasm_v128_load(rotation + ii), wasm_v128_load(rotation + j)), wasm_f64x2_splat(.5));
      const v128_t first = wasm_f64x2_mul(r, wasm_f64x2_splat(deltas[k * 2]));
      const v128_t swapped = wasm_i64x2_shuffle(r, r, 1, 0);
      const v128_t second = wasm_f64x2_mul(swapped, wasm_f64x2_splat(deltas[k * 2 + 1]));
      const v128_t signed_second = wasm_v128_xor(second, wasm_i64x2_make((-9223372036854775807LL - 1), 0));
      sums = wasm_f64x2_add(sums, wasm_f64x2_add(first, signed_second));
    }
    wasm_v128_store(rhs + ii, sums);'''
assert s.count(a)==1;s=s.replace(a,b)
(OUT/'arap-sweep.c').write_text(s)
