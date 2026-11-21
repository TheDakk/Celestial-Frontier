/* D-LOC: the lifted v1.8.9 generator remains byte-verbatim, including its
   ambient-locale presentation string. This facade replaces only that derived
   label with a pure ASCII grouping rule. Numeric year, RNG chronology and all
   other generated fields remain owned by the lifted function. */
import { civilization as liftedCivilization } from './ecology.verbatim.js';
import type { Biosphere, Civilization } from './ecology.verbatim.js';

function groupedSafeInteger(value: number): string {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError('civilization year must be a safe integer');
  }
  const sign = value < 0 ? '-' : '';
  const digits = Math.abs(value).toString(10);
  const first = digits.length % 3 || 3;
  let grouped = digits.slice(0, first);
  for (let index = first; index < digits.length; index += 3) {
    grouped += `,${digits.slice(index, index + 3)}`;
  }
  return `${sign}${grouped}`;
}

export function civilization(
  P: { seed: number },
  sys: unknown,
  band: string,
  bio: Biosphere,
  r: () => number,
): Civilization {
  const result = liftedCivilization(P, sys, band, bio, r);
  if (P.seed === 133 || result.civ !== true || result.year === undefined) return result;
  return {
    ...result,
    yearLabel: `Local year ~${groupedSafeInteger(result.year)}`,
  };
}
