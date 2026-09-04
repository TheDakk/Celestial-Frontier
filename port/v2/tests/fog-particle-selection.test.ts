import { describe, expect, it } from 'vitest';
import {
  selectFogParticleCandidatesV1,
  type FogParticleCandidateV1,
} from '../apps/game/src/fog-particle-selection.js';

const candidate = (
  wx: number,
  wy: number,
  alpha = 0.4,
): FogParticleCandidateV1 => Object.freeze({ wx, wy, ramp: 1, alpha });

describe('universe fog particle selection', () => {
  it('spends a four-particle budget around the focus instead of in scan-order fringe cells', () => {
    const fringe = [
      candidate(-3_300, -4_500),
      candidate(-3_300, -3_900),
      candidate(-3_300, -3_300),
      candidate(-3_300, -2_700),
    ];
    const aroundFocus = [
      candidate(1_000, 0),
      candidate(0, 1_000),
      candidate(-1_000, 0),
      candidate(0, -1_000),
    ];
    const selected = selectFogParticleCandidatesV1(
      [...fringe, ...aroundFocus],
      4,
      0,
      0,
    );

    expect(selected).toEqual([
      aroundFocus[0], aroundFocus[1], aroundFocus[2], aroundFocus[3],
    ]);
    expect(Object.isFrozen(selected)).toBe(true);
  });

  it('never spends the cap on invisible candidates and remains input-order independent', () => {
    const visible = [
      candidate(900, 0, 0.031),
      candidate(0, 900, 0.25),
      candidate(-900, 0, 0.35),
    ];
    const invisible = [
      candidate(1, 1, 0),
      candidate(2, 2, 0.03),
      candidate(3, 3, -0.2),
    ];
    const forward = selectFogParticleCandidatesV1(
      [...invisible, ...visible], 3, 0, 0,
    );
    const reverse = selectFogParticleCandidatesV1(
      [...visible, ...invisible].reverse(), 3, 0, 0,
    );

    expect(forward).toEqual([visible[2], visible[1], visible[0]]);
    expect(reverse).toEqual(forward);
    expect(forward.every((row) => row.alpha > 0.03)).toBe(true);
  });

  it('fills sparse sectors without exceeding the exact device-tier ceiling', () => {
    const oneQuadrant = Array.from({ length: 12 }, (_, index) =>
      candidate(400 + index * 50, 100 + index * 10, 0.1 + index / 100));
    const selected = selectFogParticleCandidatesV1(oneQuadrant, 4, 0, 0);

    expect(selected).toHaveLength(4);
    expect(new Set(selected).size).toBe(4);
    expect(selected.every((row) => oneQuadrant.includes(row))).toBe(true);
  });

  it('fails closed on malformed budgets, focus, or candidate geometry', () => {
    expect(() => selectFogParticleCandidatesV1([], -1, 0, 0)).toThrow(TypeError);
    expect(() => selectFogParticleCandidatesV1([], 1.5, 0, 0)).toThrow(TypeError);
    expect(() => selectFogParticleCandidatesV1([], 1, Number.NaN, 0)).toThrow(TypeError);
    expect(() => selectFogParticleCandidatesV1([
      candidate(Number.POSITIVE_INFINITY, 0),
    ], 1, 0, 0)).toThrow(TypeError);
  });
});
