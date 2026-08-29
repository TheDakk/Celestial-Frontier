/* Compatibility surface for the original art-owned names. The canonical
   versioned/digested data lives in the dependency-neutral domain package so
   visual, ecology, and audio consumers cannot fork separate profile tables. */
export {
  BIOME_PROFILE_KEYS_V1 as BIOME_VISUAL_KEYS_V1,
  BIOME_PROFILES_V1 as BIOME_VISUAL_PROFILES_V1,
  createBiomeProfileSetV1 as createBiomeVisualProfileAuthorityV1,
} from '@cf/domain-biome-profile';

export type {
  BiomeProfileKeyV1 as BiomeVisualKeyV1,
  BiomeProfileFaunaFamilyV1 as BiomeFaunaFamilyV1,
  BiomeProfileFloraFamilyV1 as BiomeFloraFamilyV1,
  BiomeProfileHazardV1 as BiomeHazardV1,
  BiomeProfileWeatherV1 as BiomeWeatherV1,
  BiomeProfileV1 as BiomeVisualProfileV1,
} from '@cf/domain-biome-profile';
