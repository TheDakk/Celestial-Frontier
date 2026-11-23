/* The exponential, the logarithm and the angle of a direction by add, multiply, divide, round and square root
   alone, which give the same bits on every device. Each agrees with the library function to one part in a
   million million. */

const LN2 = 0.6931471805599453;
const PI = 3.141592653589793;

/** e to the power x. */
export function expOf(x: number): number {
  const halvings = Math.round(x / LN2);
  if (halvings < -1100) return 0;
  const r = x - halvings * LN2;
  let term = 1;
  let sum = 1;
  for (let n = 1; n <= 14; n++) { term *= r / n; sum += term; }
  for (let i = 0; i < halvings; i++) sum *= 2;
  for (let i = 0; i > halvings; i--) sum /= 2;
  return sum;
}

/** The natural logarithm of x, for x above 0. */
export function lnOf(x: number): number {
  let doublings = 0;
  while (x >= 1.4142135623730951) { x /= 2; doublings++; }
  while (x < 0.7071067811865476) { x *= 2; doublings--; }
  const s = (x - 1) / (x + 1);
  const s2 = s * s;
  let power = s;
  let sum = 0;
  for (let n = 1; n <= 23; n += 2) { sum += power / n; power *= s2; }
  return 2 * sum + doublings * LN2;
}

/** The angle of a slope from 0 to 1, from 0 to a quarter of pi. */
function arc(t: number): number {
  // Halving the angle twice leaves a slope under 0.2, where the series ends within 12 terms.
  for (let i = 0; i < 2; i++) t /= 1 + Math.sqrt(1 + t * t);
  const t2 = t * t;
  let power = t;
  let sum = 0;
  for (let n = 1; n <= 23; n += 2) { sum += (n & 2) === 0 ? power / n : -power / n; power *= t2; }
  return 4 * sum;
}

/** The angle of the direction (x, y) from the x axis, from -pi to pi; 0 for no direction. */
export function angleOf(y: number, x: number): number {
  const ax = Math.abs(x);
  const ay = Math.abs(y);
  if (ax === 0 && ay === 0) return 0;
  const first = ay <= ax ? arc(ay / ax) : PI / 2 - arc(ax / ay);
  const upper = x >= 0 ? first : PI - first;
  return y >= 0 ? upper : -upper;
}
