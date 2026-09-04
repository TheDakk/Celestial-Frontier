/* Fail-soft containment for a browser Worker error event. Preventing the
   default is what keeps an already-handled worker startup/import fault from
   surfacing again as an uncaught Window error; cleanup remains mandatory even
   if diagnostic bookkeeping fails. */

export interface BiomeVistaWorkerErrorOwnerV1 {
  readonly stale: () => boolean;
  readonly noteFault: () => void;
  readonly finish: () => void;
}

export type BiomeVistaWorkerResponseDispositionV1 = 'current' | 'stale' | 'fault';

export interface BiomeVistaWorkerResponseIdentityV1 {
  readonly documentToken: string;
  readonly generation: number;
  readonly worldKey: string;
  readonly environmentFingerprint: string;
  readonly profileSchema: string;
  readonly profileDigest: string;
}

export function biomeVistaWorkerResponseIdentityMatchesV1(
  observed: BiomeVistaWorkerResponseIdentityV1,
  expected: BiomeVistaWorkerResponseIdentityV1,
): boolean {
  return observed.documentToken === expected.documentToken
    && observed.generation === expected.generation
    && observed.worldKey === expected.worldKey
    && observed.environmentFingerprint === expected.environmentFingerprint
    && observed.profileSchema === expected.profileSchema
    && observed.profileDigest === expected.profileDigest;
}

export function biomeVistaWorkerResponseDispositionV1(
  stale: boolean,
  identityMatches: boolean,
): BiomeVistaWorkerResponseDispositionV1 {
  if (stale) return 'stale';
  return identityMatches ? 'current' : 'fault';
}

export function containBiomeVistaWorkerErrorV1(
  event: Pick<Event, 'preventDefault'>,
  owner: BiomeVistaWorkerErrorOwnerV1,
): void {
  try {
    event.preventDefault();
  } finally {
    try {
      if (!owner.stale()) owner.noteFault();
    } finally {
      owner.finish();
    }
  }
}
