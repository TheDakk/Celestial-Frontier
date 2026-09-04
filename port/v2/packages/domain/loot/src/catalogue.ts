/* Canonical v1.8.9 crafted-item subset used by Arc 2 loot.

   The legacy registry stores every crafted item in the same count map. The
   `inventoryShape` discriminator records the only structural distinction made
   here: the 42 equipment definitions have a body slot; the other 20 do not.
   `category` still distinguishes one-build ship systems from ordinary stacks.

   `authoredRarityTier` preserves the literal optional `rar` field from ITEMS.
   `rarityTier` is the exact legacy _itemRarity result, expressed through the
   universal ten-tier vocabulary. */
import { deepFreeze } from './internal.js';

export const GEAR_SLOTS = Object.freeze([
  'helmet', 'ears', 'necklace', 'suit', 'gloves', 'legs', 'boots', 'tool', 'module',
] as const);
export type GearSlot = (typeof GEAR_SLOTS)[number];

export const UNIVERSAL_RARITY_TIERS = deepFreeze([
  { tier: 0, id: 'common', name: 'Common', hex: '#B8BDC7' },
  { tier: 1, id: 'uncommon', name: 'Uncommon', hex: '#4FD16B' },
  { tier: 2, id: 'notable', name: 'Notable', hex: '#35C9B5' },
  { tier: 3, id: 'rare', name: 'Rare', hex: '#3D8BFF' },
  { tier: 4, id: 'exotic', name: 'Exotic', hex: '#9A5CFF' },
  { tier: 5, id: 'legendary', name: 'Legendary', hex: '#F4A62A' },
  { tier: 6, id: 'mythic', name: 'Mythic', hex: '#E54B8D' },
  { tier: 7, id: 'celestial', name: 'Celestial', hex: '#54D8FF' },
  { tier: 8, id: 'primordial', name: 'Primordial', hex: '#D85B3F' },
  { tier: 9, id: 'transcendent', name: 'Transcendent', hex: '#F7F1FF' },
] as const);

export const GEAR_RARITIES = Object.freeze(
  UNIVERSAL_RARITY_TIERS.map((definition) => definition.id),
) as readonly GearRarity[];
export type GearRarity = (typeof UNIVERSAL_RARITY_TIERS)[number]['id'];
export type CatalogueCategory = 'part' | 'comp' | 'sys' | 'gear' | 'relic';
export type GearEffectKey =
  | 'yield' | 'strike' | 'auto' | 'land' | 'land100' | 'struts' | 'scut'
  | 'contact' | 'heal' | 'speed' | 'skim' | 'skimguard' | 'landfam';
export type LandingFamily = 'lava' | 'venus' | 'gas' | 'ice';
export type CatalogueQuantityMap = Readonly<Record<string, number>>;

export interface CatalogueEffects {
  readonly yield?: number;
  readonly strike?: number;
  readonly auto?: number;
  readonly land?: number;
  readonly landfam?: Readonly<Partial<Record<LandingFamily, number>>>;
  readonly land100?: number;
  readonly struts?: number;
  readonly scut?: number;
  readonly contact?: number;
  readonly heal?: number;
  readonly speed?: number;
  readonly skim?: number;
  readonly skimguard?: number;
}

interface CatalogueDefinitionBase {
  readonly id: string;
  readonly category: CatalogueCategory;
  readonly name: string;
  /** Exact authored v1.8.9 icon-family token. */
  readonly family: string;
  /** Exact authored v1.8.9 display hue. */
  readonly hue: string;
  /** Exact authored v1.8.9 description, including retained HTML entities. */
  readonly description: string;
  readonly tier: number;
  /** Literal ITEMS.rar, or null when the source does not author an override. */
  readonly authoredRarityTier: number | null;
  /** Exact v1.8.9 _itemRarity result. */
  readonly rarityTier: number;
  readonly rarity: GearRarity;
  readonly effects: CatalogueEffects;
  /** Exact legacy effect-key vocabulary; no synthetic implicit content. */
  readonly implicits: readonly string[];
  readonly materialCost: CatalogueQuantityMap;
  readonly partCost: CatalogueQuantityMap | null;
  readonly stardustCost: number | null;
  readonly prerequisiteId: string | null;
  readonly signatureId: string | null;
  readonly unlock: string | null;
}

export interface StackableCatalogueDefinition extends CatalogueDefinitionBase {
  readonly inventoryShape: 'stackable';
  readonly category: 'part' | 'comp' | 'sys';
  readonly slot: null;
}

export interface SlottedCatalogueDefinition extends CatalogueDefinitionBase {
  readonly inventoryShape: 'slotted';
  readonly category: 'gear' | 'relic';
  readonly slot: GearSlot;
}

export type LootCatalogueDefinition = StackableCatalogueDefinition | SlottedCatalogueDefinition;

type DefinitionInput = Readonly<{
  id: string;
  category: CatalogueCategory;
  name: string;
  family: string;
  hue: string;
  description: string;
  tier: number;
  slot?: GearSlot;
  rar?: number;
  materialCost: CatalogueQuantityMap;
  partCost?: CatalogueQuantityMap;
  stardustCost?: number;
  prerequisiteId?: string;
  signatureId?: string;
  unlock?: string;
  effects?: CatalogueEffects;
}>;

function resolvedLegacyRarity(category: CatalogueCategory, tier: number, authored: number | undefined): number {
  if (authored !== undefined) return Math.max(0, Math.min(9, authored | 0));
  let rarity = tier <= 1 ? 1 : tier === 2 ? 3 : tier === 3 ? 5 : 6;
  if (category === 'relic') rarity = Math.max(rarity, 7);
  return Math.max(0, Math.min(9, rarity));
}

function definition(input: DefinitionInput): LootCatalogueDefinition {
  const rarityTier = resolvedLegacyRarity(input.category, input.tier, input.rar);
  const common = {
    id: input.id,
    category: input.category,
    name: input.name,
    family: input.family,
    hue: input.hue,
    description: input.description,
    tier: input.tier,
    authoredRarityTier: input.rar ?? null,
    rarityTier,
    rarity: UNIVERSAL_RARITY_TIERS[rarityTier]!.id,
    effects: input.effects ?? {},
    implicits: Object.keys(input.effects ?? {}).sort(),
    materialCost: input.materialCost,
    partCost: input.partCost ?? null,
    stardustCost: input.stardustCost ?? null,
    prerequisiteId: input.prerequisiteId ?? null,
    signatureId: input.signatureId ?? null,
    unlock: input.unlock ?? null,
  };
  return input.slot === undefined
    ? { ...common, inventoryShape: 'stackable', category: input.category as 'part' | 'comp' | 'sys', slot: null }
    : { ...common, inventoryShape: 'slotted', category: input.category as 'gear' | 'relic', slot: input.slot };
}

export const LOOT_CATALOGUE_V1: readonly LootCatalogueDefinition[] = deepFreeze([
  definition({ id: 'plate', category: 'part', tier: 1, family: 'plate', hue: '#aab2c2', name: 'Iron Plate', description: 'Rolled hull stock — the frontier is built on it', materialCost: { Fe: 4 } }),
  definition({ id: 'wire', category: 'part', tier: 1, family: 'wire', hue: '#e8b06a', name: 'Aluminium Wire', description: 'Drawn conductor spool', materialCost: { Al: 3 } }),
  definition({ id: 'chip', category: 'part', tier: 1, family: 'chip', hue: '#9fdfe8', name: 'Silicon Chip', description: 'Etched logic wafer', materialCost: { Si: 3 } }),
  definition({ id: 'frame', category: 'part', tier: 1, family: 'frame', hue: '#9fb6d6', name: 'Steel Frame', description: 'Chromium-steel truss — light enough, unbreakable enough', materialCost: { Fe: 3, Cr: 1 } }),
  definition({ id: 'lens', category: 'part', tier: 1, family: 'lens', hue: '#cde8fa', name: 'Optic Lens', description: 'Fluorite-glass eye for instruments', materialCost: { Si: 2, Ca: 1 } }),
  definition({ id: 'pellet', category: 'part', tier: 1, family: 'fuel', hue: '#f2c8a2', name: 'Fuel Pellet', description: 'Compressed hydrogen-methane charge', materialCost: { H: 3, CH4: 1 } }),
  definition({ id: 'weave', category: 'part', tier: 1, family: 'weave', hue: '#8a8a9a', name: 'Carbon Weave', description: 'Filament cloth cracked from methane — suits begin here', materialCost: { CH4: 3 } }),
  definition({ id: 'cell', category: 'part', tier: 1, family: 'cell', hue: '#ff9fb2', name: 'Power Cell', description: 'Sealed hydrogen-oxygen charge brick', materialCost: { H: 2, O: 2 } }),
  definition({ id: 'cryogel', category: 'part', tier: 1, family: 'gel', hue: '#8fd6ff', name: 'Cryo Gel', description: 'Slush of stabilized ices', materialCost: { H2O: 3, NH3: 1 } }),
  definition({ id: 'coil', category: 'comp', tier: 2, family: 'coil', hue: '#ffd96a', name: 'Drive Coil', description: 'Field windings for anything that pushes', materialCost: {}, partCost: { wire: 2, plate: 1 } }),
  definition({ id: 'navcore', category: 'comp', tier: 2, family: 'core', hue: '#b58cff', name: 'Nav Core', description: 'A thinking knot of charts and starlight', materialCost: {}, partCost: { chip: 2, lens: 1 } }),
  definition({ id: 'hullseg', category: 'comp', tier: 2, family: 'hull', hue: '#b8c0ce', name: 'Hull Segment', description: 'Curved armor blade for ship or shelter', materialCost: {}, partCost: { frame: 1, plate: 2 } }),
  definition({ id: 'fuelcell', category: 'comp', tier: 2, family: 'fcell', hue: '#7fd0ff', name: 'Fuel Cell', description: 'A pellet magazine wrapped around a spark', materialCost: {}, partCost: { pellet: 2, cell: 1 } }),
  definition({ id: 'servo', category: 'comp', tier: 2, family: 'servo', hue: '#c2a878', name: 'Servo Rig', description: 'Motorized joints that do the heavy lifting', materialCost: {}, partCost: { plate: 1, cell: 1, wire: 1 } }),
  definition({ id: 'cryocap', category: 'comp', tier: 2, family: 'capsule', hue: '#a8d8f0', name: 'Cryo Capsule', description: 'Cold storage that never warms', materialCost: {}, partCost: { cryogel: 2, frame: 1 } }),
  definition({ id: 'jumpdrive', category: 'sys', tier: 3, family: 'drive', hue: '#7fd0ff', name: 'Jump Drive', description: 'Folds the gulf between stars — INTERSTELLAR travel', stardustCost: 30, materialCost: {}, partCost: { coil: 2, navcore: 1, fuelcell: 1 }, effects: {}, unlock: 'Interstellar travel — every star in the home galaxy' }),
  definition({ id: 'array', category: 'sys', tier: 3, family: 'array', hue: '#9fe06a', name: 'Long-Range Array', description: 'An ear the size of a mountain — charts the whole galaxy', stardustCost: 60, materialCost: {}, partCost: { navcore: 2, lens: 1, cell: 1 }, prerequisiteId: 'jumpdrive', effects: {}, unlock: 'Galaxy-wide reach — and the parts bench for the Intergalactic Drive' }),
  definition({ id: 'igdrive', category: 'sys', tier: 3, family: 'drive', hue: '#ff7ae8', name: 'Intergalactic Drive', description: 'Crosses the dark between galaxies', stardustCost: 150, materialCost: { Pt: 2 }, partCost: { coil: 3, fuelcell: 2, navcore: 1 }, prerequisiteId: 'array', effects: {}, unlock: 'Intergalactic travel — the frontier ladder opens (Prime Codex Signatures extend it)' }),
  definition({ id: 'autoext', category: 'sys', tier: 3, family: 'rig', hue: '#c2a878', name: 'Auto-Extractor', description: 'Keeps pulling ore at every world you have mined, even while you are away', stardustCost: 40, materialCost: {}, partCost: { servo: 2, navcore: 1, cell: 1 }, effects: { auto: 1 } }),
  definition({ id: 'cscoop', category: 'sys', tier: 3, family: 'scoop', hue: '#ffcf6a', name: 'Corona Scoop', description: 'A magnetic ladle the size of a city — drinks deeper from every star, shielded against the dead ones', stardustCost: 40, materialCost: { Pls: 1 }, partCost: { coil: 2, lens: 1, cell: 1 }, prerequisiteId: 'jumpdrive', effects: { skim: 1, skimguard: 1 }, unlock: 'Deeper coronas, +1 sample per skim — and remnant stars no longer burn' }),

  definition({ id: 'rig1', category: 'gear', slot: 'tool', tier: 1, family: 'rig', hue: '#c2a878', name: 'Mining Rig I', description: 'Powered pick — every pull takes half again as much', materialCost: {}, partCost: { servo: 1, plate: 1 }, effects: { yield: 0.5 } }),
  definition({ id: 'rig2', category: 'gear', slot: 'tool', tier: 2, family: 'rig', hue: '#ffd96a', name: 'Mining Rig II', description: 'Twin-head bore — doubles every haul', materialCost: { W: 2 }, partCost: { servo: 1, frame: 1, cell: 1 }, prerequisiteId: 'rig1', effects: { yield: 1 } }),
  definition({ id: 'rig3', category: 'gear', slot: 'tool', tier: 3, family: 'rig', hue: '#ff7ae8', name: 'Plasma Bore III', description: 'Cuts stone like water — triple hauls, and rich strikes come oftener', materialCost: { Ir: 1, U: 2 }, partCost: { servo: 2, coil: 1 }, prerequisiteId: 'rig2', effects: { yield: 2, strike: 0.04 } }),
  definition({ id: 'fieldsuit', category: 'gear', slot: 'suit', tier: 1, family: 'suit', hue: '#9fb6d6', name: 'Field Suit', description: 'Sealed exploration shell — hostile bioscans bite lighter', materialCost: {}, partCost: { weave: 2, plate: 1 }, effects: { scut: 0.25, land: 5 } }),
  definition({ id: 'hazmat', category: 'gear', slot: 'suit', tier: 2, family: 'suit', hue: '#9fe06a', name: 'Hazmat Suit', description: 'Walks through what kills — bioscan wounds nearly halved', materialCost: { S: 2 }, partCost: { weave: 2, cell: 1 }, prerequisiteId: 'fieldsuit', effects: { scut: 0.45, land: 8 } }),
  definition({ id: 'thermal', category: 'gear', slot: 'suit', tier: 3, family: 'suit', hue: '#ff8a72', name: 'Thermal Weave', description: 'Laughs at molten shores — ember and acid worlds open up', materialCost: { W: 2, S: 2 }, partCost: { weave: 2, hullseg: 1 }, prerequisiteId: 'hazmat', effects: { scut: 0.45, land: 10, landfam: { lava: 30, venus: 30 } } }),
  definition({ id: 'presshull', category: 'gear', slot: 'suit', tier: 3, family: 'suit', hue: '#cdb8ec', name: 'Pressure Shell', description: 'Holds its shape where the sky crushes — gas and acid decks open up', materialCost: { Pb: 2 }, partCost: { weave: 1, hullseg: 2 }, prerequisiteId: 'hazmat', effects: { scut: 0.45, land: 10, landfam: { gas: 30, venus: 30 } } }),
  definition({ id: 'cryoline', category: 'gear', slot: 'suit', tier: 3, family: 'suit', hue: '#8fd6ff', name: 'Cryo Lining', description: 'Warm to the last ridge of the ice — frozen worlds open up', materialCost: {}, partCost: { weave: 1, cryocap: 2 }, prerequisiteId: 'hazmat', effects: { scut: 0.45, land: 10, landfam: { ice: 30 } } }),
  definition({ id: 'struts', category: 'gear', slot: 'module', tier: 1, family: 'struts', hue: '#aab2c2', name: 'Landing Struts', description: 'Wave-off scrapes hurt less', materialCost: {}, partCost: { frame: 1, plate: 1 }, effects: { struts: 2, land: 5 } }),
  definition({ id: 'stabil', category: 'gear', slot: 'module', tier: 2, family: 'struts', hue: '#ffd96a', name: 'Descent Stabilizers', description: 'Reads the storm on the way down — landings markedly safer', materialCost: {}, partCost: { servo: 1, navcore: 1 }, prerequisiteId: 'struts', effects: { struts: 3, land: 15 } }),
  definition({ id: 'anchor', category: 'gear', slot: 'module', tier: 3, family: 'anchor', hue: '#3fe8c8', name: 'Gravitic Anchor', description: 'The ground comes to YOU — no descent can wave you off', materialCost: { Nd: 1, U: 1 }, partCost: { coil: 2, navcore: 1 }, prerequisiteId: 'stabil', effects: { land100: 1 } }),
  definition({ id: 'headlamp', category: 'gear', slot: 'helmet', tier: 1, family: 'helm', hue: '#ffd96a', name: 'Miner’s Headlamp', description: 'Light finds what shadow hid — rich strikes come a little oftener', materialCost: {}, partCost: { lens: 1, cell: 1 }, effects: { strike: 0.02 } }),
  definition({ id: 'visor', category: 'gear', slot: 'helmet', tier: 2, family: 'helm', hue: '#9fdfe8', name: 'Scout Visor', description: 'Reads the danger before it reads you — field wounds bite lighter', materialCost: {}, partCost: { lens: 1, chip: 1, weave: 1 }, prerequisiteId: 'headlamp', effects: { scut: 0.15 } }),
  definition({ id: 'voidhelm', category: 'gear', slot: 'helmet', tier: 3, family: 'helm', hue: '#3fe8c8', name: 'Voidglass Visor', description: 'Ground from a glass desert&#8217;s lightning-fused sand — near-immune eyes', materialCost: { Vg: 1 }, partCost: { lens: 1, hullseg: 1 }, prerequisiteId: 'visor', effects: { scut: 0.25, strike: 0.02 } }),
  definition({ id: 'earpiece', category: 'gear', slot: 'ears', tier: 1, family: 'probe', hue: '#7fd0ff', name: 'Comms Earpiece', description: 'Hears the hesitation in a wary hail — first contact lands oftener', materialCost: {}, partCost: { wire: 1, chip: 1 }, effects: { contact: 10 } }),
  definition({ id: 'resonator', category: 'gear', slot: 'ears', tier: 2, family: 'probe', hue: '#b58cff', name: 'Vein Resonator', description: 'Sings to buried metal — rich strikes come far oftener', materialCost: {}, partCost: { chip: 2, coil: 1 }, effects: { strike: 0.06 } }),
  definition({ id: 'meteor', category: 'gear', slot: 'necklace', tier: 1, family: 'charm', hue: '#ffd96a', name: 'Meteorite Pendant', description: 'A lucky stone from before the worlds — strikes run a little richer', materialCost: { Ni: 2, C: 1 }, effects: { strike: 0.02 } }),
  definition({ id: 'compass', category: 'gear', slot: 'necklace', tier: 2, family: 'charm', hue: '#7fd0ff', name: 'Star Compass', description: 'Always knows the way home — hyperlanes run quicker', materialCost: { Ag: 1 }, partCost: { lens: 1, wire: 1 }, effects: { speed: 1 } }),
  definition({ id: 'diplobeacon', category: 'gear', slot: 'necklace', tier: 2, family: 'beacon', hue: '#cdbcff', name: 'Diplomat’s Beacon', description: 'Broadcasts peaceful intent — first contact lands far more often', materialCost: { Au: 1 }, partCost: { lens: 1, chip: 1, cell: 1 }, effects: { contact: 20 } }),
  definition({ id: 'prismpendant', category: 'gear', slot: 'necklace', tier: 3, family: 'charm', hue: '#ff7ae8', name: 'Prismatic Pendant', description: 'A cut of pure Prismatium from a magma sea — luck bends around it', materialCost: { Pz: 1 }, partCost: { lens: 1 }, effects: { contact: 10, heal: 0.2, strike: 0.02 } }),
  definition({ id: 'gripgloves', category: 'gear', slot: 'gloves', tier: 1, family: 'glove', hue: '#c2a878', name: 'Grip Gloves', description: 'Ore comes up easier when the hands don&#8217;t slip', materialCost: {}, partCost: { weave: 1, plate: 1 }, effects: { yield: 0.25 } }),
  definition({ id: 'surgeon', category: 'gear', slot: 'gloves', tier: 2, family: 'glove', hue: '#7fe6a0', name: 'Surgeon’s Gloves', description: 'Flora meals mend the explorer harder', materialCost: {}, partCost: { weave: 2, cryogel: 1 }, prerequisiteId: 'gripgloves', effects: { heal: 0.35 } }),
  definition({ id: 'fieldlegs', category: 'gear', slot: 'legs', tier: 1, family: 'legs', hue: '#9fb6d6', name: 'Field Leggings', description: 'Woven filament from ankle to hip — field wounds bite lighter', materialCost: {}, partCost: { weave: 2 }, effects: { scut: 0.1 } }),
  definition({ id: 'greaves', category: 'gear', slot: 'legs', tier: 2, family: 'legs', hue: '#ffd96a', name: 'Stabilizer Greaves', description: 'Braced for the drop — landings steadier, scrapes shallower', materialCost: {}, partCost: { frame: 1, weave: 1 }, prerequisiteId: 'fieldlegs', effects: { land: 5, struts: 1 } }),
  definition({ id: 'magboots', category: 'gear', slot: 'boots', tier: 1, family: 'boot', hue: '#aab2c2', name: 'Mag-Boots', description: 'The ground holds you the moment you touch it — landings land', materialCost: {}, partCost: { plate: 1, weave: 1 }, effects: { land: 5 } }),
  definition({ id: 'gravboots', category: 'gear', slot: 'boots', tier: 3, family: 'boot', hue: '#3fe8c8', name: 'Graviton Boots', description: 'Woven around geode-world neodymium — the fall never wins', materialCost: { Nd: 1 }, partCost: { coil: 1, weave: 1 }, prerequisiteId: 'magboots', effects: { land: 10, struts: 1 } }),

  definition({ id: 'rl-stone', category: 'relic', slot: 'suit', tier: 3, family: 'suit', hue: '#c9a878', name: 'Graven Aegis', description: 'Beacon I&#8217;s hull plating, re-forged — the ground itself argues on your side', materialCost: { Fe: 8, W: 4, Nd: 1 }, partCost: { hullseg: 1 }, signatureId: 'stone', effects: { scut: 0.45, struts: 2 } }),
  definition({ id: 'rl-ocean', category: 'relic', slot: 'boots', tier: 3, family: 'boot', hue: '#4fc8e8', name: 'Tidewalker Boots', description: 'Beacon II&#8217;s keeper walked out under the sea and never slipped once', materialCost: { H2O: 8, Ti: 4 }, partCost: { weave: 1, servo: 1 }, signatureId: 'ocean', effects: { land: 6, struts: 1 } }),
  definition({ id: 'rl-flame', category: 'relic', slot: 'gloves', tier: 3, family: 'glove', hue: '#ff7a4a', name: 'Emberforged Gauntlets', description: 'Pulled glowing from Beacon III&#8217;s wreck — they remember the heat of the strike', materialCost: { S: 6, Fe: 6, Pz: 1 }, partCost: { servo: 1 }, signatureId: 'flame', effects: { yield: 0.2, strike: 0.08 } }),
  definition({ id: 'rl-sky', category: 'relic', slot: 'module', tier: 3, family: 'drive', hue: '#8fd6ff', name: 'Skysail Module', description: 'Beacon IV&#8217;s storm-rig — it reads every deck and rides the fastest lane', materialCost: { H: 8, He3: 2 }, partCost: { coil: 1, navcore: 1 }, signatureId: 'sky', effects: { speed: 1, land: 4 } }),
  definition({ id: 'rl-life', category: 'relic', slot: 'necklace', tier: 3, family: 'charm', hue: '#7fe6a0', name: 'Verdant Locket', description: 'A seed from Beacon V&#8217;s canopy, still green — meals mend far past their measure', materialCost: { O: 6, H2O: 6 }, partCost: { cryogel: 1 }, signatureId: 'life', effects: { heal: 0.3 } }),
  definition({ id: 'rl-mind', category: 'relic', slot: 'ears', tier: 3, family: 'chip', hue: '#c79fff', name: 'Mindreader Coil', description: 'Tuned to the voice that answered Beacon VI — first contact hears you coming', materialCost: { Si: 8, Ir: 2 }, partCost: { chip: 1, wire: 1 }, signatureId: 'mind', effects: { contact: 12 } }),
  definition({ id: 'rl-star', category: 'relic', slot: 'helmet', tier: 3, family: 'helm', hue: '#ffd96a', name: 'Starcrowned Helm', description: 'Beacon VII&#8217;s lens, set in gold — it finds the bright seam in anything', materialCost: { Au: 4, Pt: 2 }, partCost: { lens: 1 }, signatureId: 'star', effects: { strike: 0.1, contact: 4 } }),
  definition({ id: 'rl-void', category: 'relic', slot: 'legs', tier: 3, family: 'legs', hue: '#9a8aff', name: 'Voidwoven Leggings', description: 'Cut from what came back of Beacon VIII — half here, half elsewhere, all yours', materialCost: { C: 6, Ir: 2 }, partCost: { weave: 2 }, signatureId: 'void', effects: { scut: 0.15, speed: 1 } }),
  definition({ id: 'rl-prism', category: 'relic', slot: 'tool', tier: 3, family: 'rig', hue: '#ff7ae8', name: 'Prismatic Lathe', description: 'Beacon IX&#8217;s last word, made a tool — it takes the color no one could name', materialCost: { Vg: 1, Pm: 1, Pz: 1 }, partCost: { coil: 1, servo: 1 }, signatureId: 'prism', effects: { yield: 1.5, strike: 0.12 } }),

  definition({ id: 'cg-proto', category: 'gear', slot: 'suit', tier: 4, rar: 8, family: 'suit', hue: '#c8e06a', name: 'Protomatter Carapace', description: 'First-matter, poured into a shell that remembers being a world — nothing gets through it easily', materialCost: { Pro: 1, Ti: 6, W: 4 }, partCost: { hullseg: 2 }, effects: { scut: 0.55, land: 12 } }),
  definition({ id: 'cg-genesis', category: 'gear', slot: 'necklace', tier: 4, rar: 8, family: 'charm', hue: '#bfeaff', name: 'Genesis Locket', description: 'A bead of ice older than the Sun — every meal mends as if life itself were owed to you', materialCost: { Pri: 1, H2O: 8, O: 6 }, partCost: { cryocap: 1 }, effects: { heal: 0.5 } }),
  definition({ id: 'cg-void', category: 'gear', slot: 'legs', tier: 5, rar: 9, family: 'legs', hue: '#8a5cff', name: 'Void-Phase Greaves', description: 'Woven through with a thread of pure absence — half your steps land in a place harm cannot follow', materialCost: { Voe: 1, C: 8, Ir: 3 }, partCost: { weave: 2 }, effects: { scut: 0.28, speed: 1 } }),
  definition({ id: 'cg-chron', category: 'gear', slot: 'module', tier: 5, rar: 9, family: 'drive', hue: '#4fe0d0', name: 'Chronal Drive', description: 'A shard of frozen time, geared to a hull — the fastest lane is the one you take before you arrive', materialCost: { Chr: 1, He3: 4, Pt: 2 }, partCost: { coil: 2, navcore: 1 }, effects: { speed: 2, land: 6 } }),
  definition({ id: 'cg-dark', category: 'gear', slot: 'tool', tier: 5, rar: 9, family: 'rig', hue: '#6a4a8a', name: 'Dark Matter Bore', description: 'A drill wound around a knot of the universe&#8217;s hidden mass — it finds the seam in everything', materialCost: { Dkm: 1, W: 6, Ir: 3 }, partCost: { servo: 2 }, effects: { yield: 2.5, strike: 0.10 } }),
  definition({ id: 'cg-plasma', category: 'gear', slot: 'gloves', tier: 5, rar: 7, family: 'glove', hue: '#ffe27a', name: 'Plasma Gauntlets', description: 'Star-fire held in a glove — the richest seam opens at a touch, and nothing bites back', materialCost: { Pls: 1, W: 4, Au: 3 }, partCost: { servo: 1 }, effects: { yield: 0.4, strike: 0.1 } }),
  definition({ id: 'cg-corona', category: 'gear', slot: 'suit', tier: 5, rar: 7, family: 'suit', hue: '#ff9d4a', name: 'Coronal Aegis', description: 'A weave of stabilized corona — it drinks the heat of any world before it reaches you', materialCost: { Crn: 1, Ti: 6, Ir: 2 }, partCost: { hullseg: 1 }, effects: { scut: 0.50, land: 10, skimguard: 1 } }),
]);

export const STACKABLE_CATALOGUE_V1: readonly StackableCatalogueDefinition[] = deepFreeze(
  LOOT_CATALOGUE_V1.filter((candidate): candidate is StackableCatalogueDefinition => candidate.inventoryShape === 'stackable'),
);

export const SLOTTED_GEAR_BASES_V1: readonly SlottedCatalogueDefinition[] = deepFreeze(
  LOOT_CATALOGUE_V1.filter((candidate): candidate is SlottedCatalogueDefinition => candidate.inventoryShape === 'slotted'),
);

const LOOT_CATALOGUE_BY_ID_V1: ReadonlyMap<string, LootCatalogueDefinition> = new Map(
  LOOT_CATALOGUE_V1.map((candidate) => [candidate.id, candidate]),
);

export function getLootCatalogueDefinition(id: string): LootCatalogueDefinition | undefined {
  return LOOT_CATALOGUE_BY_ID_V1.get(id);
}
