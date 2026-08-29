/* Pure, allocation-bounded selection for the universe fog owner. The scene
   supplies already-derived candidates; this helper rejects invisible rows and
   chooses the nearest deterministic candidate in each angular sector before
   filling any remaining budget. Scan order therefore cannot strand a whole
   device tier's fog allocation off-screen on one edge of the streamed grid. */

export interface FogParticleCandidateV1 {
  readonly wx: number;
  readonly wy: number;
  readonly ramp: number;
  readonly alpha: number;
}

const TAU = Math.PI * 2;
const MIN_VISIBLE_FOG_ALPHA_V1 = 0.03;

function candidateOrder(
  focusX: number,
  focusY: number,
): (left: FogParticleCandidateV1, right: FogParticleCandidateV1) => number {
  return (left, right) => {
    const leftDistance = (left.wx - focusX) ** 2 + (left.wy - focusY) ** 2;
    const rightDistance = (right.wx - focusX) ** 2 + (right.wy - focusY) ** 2;
    return leftDistance - rightDistance
      || right.alpha - left.alpha
      || left.wx - right.wx
      || left.wy - right.wy;
  };
}

/** Return at most `maximumCount` nontrivial candidates with deterministic
 * angular coverage around the current streamed-camera focus. */
export function selectFogParticleCandidatesV1(
  candidates: readonly FogParticleCandidateV1[],
  maximumCount: number,
  focusX: number,
  focusY: number,
): readonly FogParticleCandidateV1[] {
  if (!Number.isSafeInteger(maximumCount) || maximumCount < 0) {
    throw new TypeError('fog particle maximumCount must be a nonnegative safe integer');
  }
  if (!Number.isFinite(focusX) || !Number.isFinite(focusY)) {
    throw new TypeError('fog particle focus must be finite');
  }
  if (maximumCount === 0) return Object.freeze([]);

  const eligible = candidates.filter((candidate) => {
    if (![candidate.wx, candidate.wy, candidate.ramp, candidate.alpha]
      .every(Number.isFinite)) {
      throw new TypeError('fog particle candidate must contain finite geometry');
    }
    return candidate.alpha > MIN_VISIBLE_FOG_ALPHA_V1;
  });
  if (eligible.length <= maximumCount) {
    return Object.freeze([...eligible].sort(candidateOrder(focusX, focusY)));
  }

  const sectorCount = maximumCount;
  const sectors: FogParticleCandidateV1[][] = Array.from(
    { length: sectorCount },
    () => [],
  );
  for (const candidate of eligible) {
    const angle = (Math.atan2(candidate.wy - focusY, candidate.wx - focusX) + TAU) % TAU;
    const sector = Math.min(sectorCount - 1, Math.floor(angle / TAU * sectorCount));
    sectors[sector]!.push(candidate);
  }

  const order = candidateOrder(focusX, focusY);
  const selected: FogParticleCandidateV1[] = [];
  const selectedSet = new Set<FogParticleCandidateV1>();
  for (const sector of sectors) {
    sector.sort(order);
    const nearest = sector[0];
    if (nearest) {
      selected.push(nearest);
      selectedSet.add(nearest);
    }
  }
  if (selected.length < maximumCount) {
    for (const candidate of [...eligible].sort(order)) {
      if (selectedSet.has(candidate)) continue;
      selected.push(candidate);
      if (selected.length === maximumCount) break;
    }
  }
  return Object.freeze(selected);
}
