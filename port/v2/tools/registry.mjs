/* registry.mjs — the ported-package export registry, shared by lift.mjs and
   lift-strays.mjs for auto-import detection. One source of truth: when a
   package gains exports, update it HERE. */
export const REGISTRY = {
  '@cf/domain-rand': ['mulberry32', 'clamp', 'mix', 'makeNoise', 'TAU', 'hashInt', 'cellRng'],
  '@cf/domain-worldconfig': ['HOME_GAL_SEED', 'SOL_SEED', 'UCELL', 'HOME_POS', 'GR', 'GCELL', 'SOL_POS', 'SYS_R', 'OBS_R'],
  '@cf/domain-naming': ['properName', 'starName', 'galaxyName', 'cleanName'],
  '@cf/domain-starcatalog': ['starClass', 'SOL_PLANETS', 'KIND_DESC'],
  '@cf/domain-planetgen': ['surfaceColor', 'planetParams'],
  '@cf/domain-worldgen': ['galaxiesInCell', 'galaxyProfile', 'galaxyWormhole', 'starsInCell', 'fineStarsInCell', 'systemFor', 'supernovaSites'],
  '@cf/domain-surveyphrases': ['climateBand', 'COMP', 'atmosphereText', 'climateText', 'waterText', 'gravityText', 'TYPE_LABEL'],
  '@cf/domain-speciestraits': ['SP_COLOR', 'FA_BODY', 'FA_LOCO', 'FA_TRAIT', 'FA_SIZE', 'FA_DIET', 'FA_HEAD', 'FA_LIMBS', 'FA_SKIN', 'FA_TAIL', 'FA_PATTERN', 'FA_EYES', 'FA_BEHAVIOR', 'FA_HABITAT', 'FLORA_DETAIL', 'FA_TEMPER', 'FA_SENSE', 'FA_REPRO', 'FA_LIFE', 'FA_METAB', 'FLORA_FORM', 'FUNGI_FORM', 'MICROBE_FORM', 'speciesName', 'colorGrade', 'SP_HEX', 'FA_SIZE_M', 'SPECTRA', 'spectral', 'GRADE_TIERS', 'TIER_MAX', 'RARITY_V17', 'displayRarity', 'rarityRoll', 'EX_HABITAT', 'EX_LOCO', 'AQ_FLORA_FORM', 'AIR_FLORA_FORM', 'habOf', 'locoOf', 'floraFormOf', 'STAT_KEYS'],
  '@cf/domain-genome': ['describeSpecies', 'makeGenome', 'sapienceTier', 'classifyRealm', 'ecologyRole', 'realmBiome', 'realmModifiers', 'REALM_ICON', 'REALM_ORDER', 'faunaDesc', 'speciesGrade', 'guardianFor', 'GUARDIAN_EPITHETS', '_szOf'],
  '@cf/domain-encutil': ['shade', 'svgURI', 'b64encUtf8', 'b64decUtf8'],
  '@cf/domain-genetics': ['evolveGenome', 'crossGenome'],
  '@cf/domain-ecology': ['biosphere', 'civilization', 'planetSpecies'],
  '@cf/domain-descriptors': ['galaxyStats', 'fmtBig', 'roman', 'describePick', 'slimGal', 'starDescriptor', 'planetDescriptor', 'moonDescriptor', 'galaxyDescriptor', 'wormholeDescriptor', 'cmbDescriptor', 'oortDescriptor', 'kuiperDescriptor', 'visitorDescriptor', 'beltDescriptor', 'SOL_MOONS'],
  '@cf/domain-combatcore': ['abilityOf', 'battleStats', 'STAT_NAMES', 'STAT_HUES', 'runDuel', 'decodeCreature', 'encodeCreature', 'playerCombatant', 'playerAvatar', 'paperdollAvatar', 'DOLL_ANCHORS', 'statBlockHTML', '_statOpen', 'abilityTheme', 'normGenome', 'PLAYER_SEED', 'levelOf', 'ABILITY_THEMES'],
  '@cf/domain-strays': ['_r2', 'encodeWhere', 'decodeWhere', 'winEstimate', 'floraStat', 'BIOME_SETS', 'biomeFor', 'hdGenesFor', '_sanitizeSavedGenome', '_sanitizeView', 'REGIONS', 'RING_SPECTRUM', 'ASC_RING_R', 'regionAt', 'gradeCapAt', 'ringGrade'],
};
