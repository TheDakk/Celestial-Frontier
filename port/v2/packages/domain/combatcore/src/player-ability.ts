/* The Explorer's native combat identity, owned once by the combat domain.
   The persistence player projection and the audio/Chronicle cue owner both
   read these values; neither may carry its own copy of the label, description,
   numbers or palette (K25: the cue owner used to string-match the description
   text, so any copy edit silently re-broke Chronicle admission). */

export const PLAYER_COMBAT_HEX_V1 = '#ffcf8a' as const;

export interface FrontierResolveAbilityV1 {
  readonly id: 'resolve';
  readonly n: string;
  readonly d: string;
  readonly regen: number;
  readonly taken: number;
}

export const FRONTIER_RESOLVE_ABILITY_V1: FrontierResolveAbilityV1 = Object.freeze({
  id: 'resolve', n: 'Frontier Resolve',
  d: 'Hardened by the void — recovers each round and shrugs off blows',
  regen: 0.04, taken: 0.9,
});
