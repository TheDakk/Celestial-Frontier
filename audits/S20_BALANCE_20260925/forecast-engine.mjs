//#region ../celestial-frontier-anthropic-mac/port/v2/packages/domain/rand/src/index.ts
const TAU = Math.PI * 2;
/** Deterministic 32-bit PRNG. Returns a closure yielding floats in [0,1). */
function mulberry32(a) {
	return function() {
		a |= 0;
		a = a + 1831565813 | 0;
		let t = Math.imul(a ^ a >>> 15, 1 | a);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
/** 32-bit integer hash of (seed, x, y) — the universe's cell addressing. */
function hashInt(seed, x, y) {
	let h = seed | 0;
	h = Math.imul(h ^ (x | 0), 374761393);
	h = Math.imul(h ^ (y | 0), 668265263);
	h ^= h >>> 15;
	h = Math.imul(h, 2246822519);
	h ^= h >>> 13;
	return h >>> 0;
}
/** Seeded PRNG for a universe cell. */
function cellRng(seed, x, y) {
	return mulberry32(hashInt(seed, x, y));
}
function clamp(v, a, b) {
	return v < a ? a : v > b ? b : v;
}
function mix(c1, c2, t) {
	t = clamp(t, 0, 1);
	return [
		c1[0] + (c2[0] - c1[0]) * t,
		c1[1] + (c2[1] - c1[1]) * t,
		c1[2] + (c2[2] - c1[2]) * t
	];
}
/** Seeded 2-D value-noise fBm. Body verbatim from v1.8.9. */
function makeNoise(seed) {
	const r = mulberry32(seed);
	const perm = /* @__PURE__ */ new Uint8Array(512);
	const p = [...Array(256).keys()];
	for (let i = 255; i > 0; i--) {
		const j = Math.floor(r() * (i + 1));
		const t = p[i];
		p[i] = p[j];
		p[j] = t;
	}
	for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
	function fade(t) {
		return t * t * (3 - 2 * t);
	}
	function n2(x, y) {
		const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
		x -= Math.floor(x);
		y -= Math.floor(y);
		const tl = perm[perm[X] + Y & 511] / 255, tr = perm[perm[X + 1 & 255] + Y & 511] / 255;
		const bl = perm[perm[X] + Y + 1 & 511] / 255, br = perm[perm[X + 1 & 255] + Y + 1 & 511] / 255;
		const u = fade(x), v = fade(y);
		return (tl * (1 - u) + tr * u) * (1 - v) + (bl * (1 - u) + br * u) * v;
	}
	return function fbm(x, y, oct) {
		let a = 0, amp = .5, f = 1;
		for (let o = 0; o < (oct || 4); o++) {
			a += amp * n2(x * f, y * f);
			amp *= .5;
			f *= 2;
		}
		return a / (1 - Math.pow(.5, oct || 4));
	};
}
//#endregion
//#region ../celestial-frontier-anthropic-mac/port/v2/packages/domain/worldconfig/src/index.ts
const HOME_POS = Object.freeze({
	x: 90,
	y: -60
});
const GR = 1200;
const SOL_SEED = 424242;
const SOL_POS = Object.freeze({
	x: 560,
	y: 170
});
//#endregion
//#region ../celestial-frontier-anthropic-mac/port/v2/packages/domain/naming/src/index.ts
const SYL = [
	"an",
	"dro",
	"vel",
	"tar",
	"ka",
	"ri",
	"os",
	"um",
	"ze",
	"phy",
	"lon",
	"ae",
	"cy",
	"gn",
	"ur",
	"sa",
	"or",
	"ion",
	"per",
	"sei"
];
function properName(seed, parts) {
	const r = mulberry32(seed ^ 1597463007);
	let s = "";
	for (let i = 0; i < parts; i++) s += SYL[Math.floor(r() * SYL.length)];
	return s.charAt(0).toUpperCase() + s.slice(1);
}
//#endregion
//#region ../celestial-frontier-anthropic-mac/port/v2/packages/domain/speciestraits/src/speciestraits.verbatim.js
const SP_COLOR = [
	"emerald",
	"crimson",
	"violet",
	"golden",
	"turquoise",
	"indigo",
	"amber",
	"rust-red",
	"silver-blue",
	"obsidian-black",
	"bone-white",
	"magenta",
	"teal",
	"ochre",
	"jade",
	"bruise-purple",
	"glass-clear"
];
const GRADE_TIERS = [
	{
		t: 0,
		name: "Common",
		pre: "Pale",
		hex: "#B8BDC7",
		star: ""
	},
	{
		t: 1,
		name: "Uncommon",
		pre: "",
		hex: "#4FD16B",
		star: ""
	},
	{
		t: 2,
		name: "Notable",
		pre: "Bright",
		hex: "#35C9B5",
		star: ""
	},
	{
		t: 3,
		name: "Rare",
		pre: "Deep",
		hex: "#3D8BFF",
		star: ""
	},
	{
		t: 4,
		name: "Exotic",
		pre: "Neon",
		hex: "#9A5CFF",
		star: ""
	},
	{
		t: 5,
		name: "Legendary",
		pre: "Gold",
		hex: "#F4A62A",
		star: ""
	},
	{
		t: 6,
		name: "Mythic",
		pre: "Blackened",
		hex: "#E54B8D",
		star: ""
	},
	{
		t: 7,
		name: "Celestial",
		pre: "Prismatic",
		hex: "#54D8FF",
		star: ""
	},
	{
		t: 8,
		name: "Primordial",
		pre: "Iridescent",
		hex: "#D85B3F",
		star: ""
	},
	{
		t: 9,
		name: "Transcendent",
		pre: "Radiant",
		hex: "#F7F1FF",
		star: ""
	},
	{
		t: 10,
		name: "Transcendent",
		pre: "Primordial",
		hex: "#F7F1FF",
		star: ""
	},
	{
		t: 11,
		name: "Transcendent",
		pre: "Transcendent",
		hex: "#F7F1FF",
		star: ""
	},
	{
		t: 12,
		name: "Transcendent",
		pre: "Empyrean",
		hex: "#F7F1FF",
		star: ""
	},
	{
		t: 13,
		name: "Transcendent",
		pre: "Eternal",
		hex: "#F7F1FF",
		star: ""
	},
	{
		t: 14,
		name: "Transcendent",
		pre: "Omnipotent",
		hex: "#F7F1FF",
		star: ""
	}
];
const TIER_MAX = GRADE_TIERS.length - 1;
const HUE_FAMILY = {
	ocean: "Blue",
	water: "Blue",
	ice: "Cyan",
	desert: "Sand",
	rocky: "Gray",
	lava: "Red",
	gas: "Orange",
	terran: "Green",
	forest: "Green",
	life: "Green",
	fungal: "Violet",
	star: "Yellow",
	redstar: "Crimson",
	bluestar: "Azure",
	remnant: "Pearl",
	neutron: "Electric-Violet",
	blackhole: "Black",
	nebula: "Magenta",
	galaxy: "Blue",
	cluster: "Gold",
	void: "Indigo",
	comet: "Ice-White",
	moon: "Stone",
	dwarf: "Tan",
	metal: "Silver",
	exotic: "Purple",
	anomaly: "Prismatic"
};
function rarityRoll(seed, salt) {
	const r = mulberry32(hashInt(seed >>> 0, salt | 0, 154) >>> 0)();
	if (r > .99999997) return 14;
	if (r > .99999991) return 13;
	if (r > .9999997) return 12;
	if (r > .999999) return 11;
	if (r > .999996) return 10;
	if (r > .999985) return 9;
	if (r > .99994) return 8;
	if (r > .99976) return 7;
	if (r > .992) return 6;
	if (r > .972) return 5;
	if (r > .93) return 4;
	if (r > .84) return 3;
	if (r > .66) return 2;
	if (r > .4) return 1;
	return 0;
}
function colorGrade(kindHue, seed, opts) {
	opts = opts || {};
	let tier = rarityRoll(seed, opts.salt || 1);
	if (opts.boost) tier = Math.min(TIER_MAX, tier + opts.boost);
	if (opts.force != null) tier = opts.force;
	const T = GRADE_TIERS[tier];
	const hue = HUE_FAMILY[kindHue] || "Gray";
	let label;
	if (tier === 7) label = "Prismatic " + hue;
	else if (tier === 5) label = hue + "-Gold";
	else if (tier === 6) label = hue + "-Black";
	else if (T.pre) label = T.pre + " " + hue;
	else label = hue;
	return {
		tier,
		name: T.name,
		label: label + (opts.suffix ? " " + opts.suffix : ""),
		hex: T.hex,
		hue,
		star: T.star,
		glow: tier >= 2
	};
}
const FLORA_FORM = [
	"fern-analogues",
	"fungal forests",
	"lichen mats",
	"reed thickets",
	"bioluminescent groves",
	"crystalline growths",
	"moss carpets",
	"canopy vines",
	"bladder-leafed shrubs",
	"spore-towers",
	"sail-leafed trees",
	"mirror-bark giants",
	"tube-stalk gardens",
	"balloon-pods",
	"razor-grass plains",
	"cushion-scrub",
	"umbrella-canopy titans",
	"glass-needle thickets"
];
const FUNGI_FORM = [
	"mushroom forests",
	"shelf-fungus terraces",
	"puffball fields",
	"lantern-cap groves",
	"mycelial webs",
	"spore-tower colonies",
	"creeping mats",
	"crystal-fungus clusters",
	"mold plains"
];
const MICROBE_FORM = [
	"photosynthetic mats",
	"chemosynthetic films",
	"iron-oxidizing slime",
	"sulfur-eating colonies",
	"radiation-resistant crusts",
	"bioluminescent plankton",
	"methane-eating mats",
	"acid-pool biofilms",
	"magnetotactic swarms",
	"silica-shelled diatom blooms",
	"purple sulfur films",
	"snow-algae crusts"
];
const EX_HABITAT = [
	"hydrothermal vent fields",
	"cooling lava margins",
	"beneath the ice sheets",
	"abyssal trenches",
	"the acid cloud layers",
	"storm-eye updrafts",
	"brine pools",
	"deep cave systems",
	"the crushing lower decks"
];
const EX_LOCO = [
	"vent-clingers",
	"magma-swimmers",
	"under-ice drifters",
	"pressure-walkers",
	"acid-cloud floaters",
	"storm-riders",
	"winged hunters",
	"thermal-soarers",
	"brine-crawlers"
];
const AQ_FLORA_FORM = [
	"kelp towers",
	"seagrass meadows",
	"reef-builder colonies",
	"sargassum rafts",
	"bioluminescent bloom fields",
	"tube-garden banks"
];
const AIR_FLORA_FORM = [
	"aeroplankton veils",
	"drift-spore banners",
	"cloud-garden colonies"
];
function habOf(g) {
	return g && g.x ? EX_HABITAT[(g.habitat || 0) % EX_HABITAT.length] : FA_HABITAT[(g && g.habitat || 0) % FA_HABITAT.length] || "";
}
function locoOf(g) {
	return g && g.x ? EX_LOCO[(g.loco || 0) % EX_LOCO.length] : FA_LOCO[(g && g.loco || 0) % FA_LOCO.length] || "";
}
function floraFormOf(g) {
	if (g && g.aq) return AQ_FLORA_FORM[(g.form || 0) % AQ_FLORA_FORM.length];
	if (g && g.af) return AIR_FLORA_FORM[(g.form || 0) % AIR_FLORA_FORM.length];
	return FLORA_FORM[(g && g.form || 0) % FLORA_FORM.length] || "";
}
const FA_BODY = [
	"sturdy-limbed",
	"armored",
	"stilt-legged",
	"tentacled",
	"serpentine",
	"many-segmented",
	"shelled",
	"membranous",
	"crystalline-plated",
	"gelatinous",
	"tusked",
	"horned",
	"spindly",
	"squat heavy-boned",
	"four-winged",
	"radially symmetric"
];
const FA_LOCO = [
	"grazers",
	"burrowers",
	"pack hunters",
	"gliders",
	"swimmers",
	"floaters",
	"ambush predators",
	"climbers",
	"herd-beasts",
	"filter-feeders",
	"leapers",
	"drifters",
	"runners",
	"jet-propelled swimmers",
	"tentacle-walkers",
	"rollers",
	"wall-clingers",
	"current-drifters"
];
const FA_TRAIT = [
	"with mirrored eyes",
	"that glow in the dark",
	"with iron-hard hide",
	"that change color",
	"with echolocating crests",
	"venomous and bright",
	"that herd in vast migrations",
	"with magnetic senses",
	"that nest in cliffs",
	"feathered and warm-blooded",
	"with translucent flesh",
	"bearing crystal antlers",
	"that hunt by heat",
	"with whip-like tails",
	"singing in low harmonics",
	"with armored crest-plates",
	"breathing through gill-slits",
	"that store water in humped backs",
	"with retractable claws",
	"wreathed in sensory whiskers",
	"that secrete protective slime",
	"with double-jointed limbs",
	"cloaked in shifting camouflage",
	"that pulse with electric charge",
	"bearing a single curved horn"
];
const FA_SIZE = [
	"tiny",
	"small",
	"dog-sized",
	"large",
	"massive",
	"titanic"
];
const FA_DIET = [
	"herbivore",
	"carnivore",
	"filter-feeder",
	"scavenger",
	"chemo-grazer",
	"omnivore"
];
const FA_HEAD = [
	"blunt-snouted",
	"beaked",
	"eyeless and smooth",
	"crested",
	"mandibled",
	"tendril-fringed",
	"horned",
	"domed and bulbous",
	"fanged",
	"frilled"
];
const FA_LIMBS = [
	2,
	4,
	6,
	8,
	3,
	0
];
const FA_SKIN = [
	"scaled",
	"furred",
	"chitinous",
	"slick and wet",
	"plated",
	"warty",
	"feathered",
	"translucent",
	"crystalline"
];
const FA_TAIL = [
	"none",
	"whip-like",
	"finned",
	"spiked",
	"prehensile",
	"plumed",
	"stinger-tipped"
];
const FA_PATTERN = [
	"plain",
	"striped",
	"spotted",
	"banded",
	"mottled",
	"iridescent",
	"marbled",
	"eye-spotted"
];
const FA_EYES = [
	2,
	4,
	6,
	8,
	1,
	0
];
const FA_BEHAVIOR = [
	"hunting in coordinated packs",
	"migrating across whole continents",
	"building elaborate nests",
	"communicating in low infrasound",
	"ambushing from camouflage",
	"grazing in vast placid herds",
	"fiercely territorial",
	"tending symbiotic flora",
	"mimicking other species",
	"active only at night",
	"following seasonal blooms",
	"solitary and elusive"
];
const FA_HABITAT = [
	"the deep forest canopy",
	"open grassland plains",
	"rocky highland ridges",
	"coastal shallows",
	"river deltas and wetlands",
	"subterranean caverns",
	"windswept tundra",
	"the twilight terminator zone",
	"floating reef colonies",
	"volcanic ash fields",
	"the open ocean",
	"desert dunes",
	"methane lakeshores",
	"ammonia-sea shallows",
	"high cloud decks",
	"hydrothermal vent fields",
	"salt-flat pans",
	"mangrove tangles",
	"crystal caverns"
];
const FA_TEMPER = [
	"placid and curious",
	"skittish and fast to flee",
	"aggressively territorial",
	"docile, easily approached",
	"wary but tolerant",
	"fiercely protective of its young",
	"indifferent to onlookers",
	"playful and inquisitive",
	"ill-tempered and unpredictable",
	"eerily calm"
];
const FA_SENSE = [
	"keen night-vision",
	"infrared heat-pits",
	"electroreception",
	"a sharp sense of smell",
	"echolocation",
	"magnetic navigation",
	"polarized-light vision",
	"pressure-sensing whiskers",
	"chemical taste-receptors across its skin",
	"near-blindness, hunting by vibration"
];
const FA_REPRO = [
	"lays clutches of leathery eggs",
	"births live young in litters",
	"broadcasts spore-like gametes",
	"buds asexually when food is plentiful",
	"guards a single precious egg for a full season",
	"spawns in vast synchronized swarms",
	"carries young in a brood-pouch",
	"undergoes a dramatic larval metamorphosis"
];
const FA_LIFE = [
	"a fleeting few seasons",
	"roughly a decade",
	"many decades",
	"a century or more",
	"an unknown, possibly vast span",
	"only a single explosive breeding cycle"
];
const FA_METAB = [
	"warm-blooded and always hungry",
	"cold-blooded, basking to gather heat",
	"slow-metabolizing, needing little food",
	"chemosynthetic, feeding on minerals",
	"photo-supplemented, part-plant in its skin",
	"torpid for half the year"
];
const FLORA_DETAIL = [
	"drinking deep with mineral roots",
	"tracking the sun across the sky",
	"releasing spore-clouds at dusk",
	"sheltering whole micro-ecosystems",
	"closing tight against storms",
	"flowering only once a decade",
	"drawing nitrogen from the air",
	"channelling sap like slow blood",
	"glowing to lure pollinators",
	"filtering toxins from the soil"
];
const SP_NAME_A = [
	"Vel",
	"Thr",
	"Ossi",
	"Kry",
	"Mor",
	"Aza",
	"Pyr",
	"Sil",
	"Umbra",
	"Glau",
	"Cae",
	"Nyx",
	"Ferr",
	"Lume",
	"Quor",
	"Drae",
	"Sib",
	"Eph",
	"Tor",
	"Vash"
];
const SP_NAME_B = [
	"ix",
	"andra",
	"oth",
	"une",
	"ysse",
	"aar",
	"elt",
	"ora",
	"ixil",
	"umph",
	"een",
	"ade",
	"orn",
	"isk",
	"uul",
	"aith",
	"emn",
	"ovo",
	"yx",
	"arn"
];
const SP_NAME_C = [
	"",
	"an",
	"id",
	"ine",
	"ex",
	"ula",
	"oid",
	"ar",
	"eus",
	"ix",
	"ora",
	"ent"
];
function speciesName(seed) {
	const r = mulberry32((seed ^ 388821) >>> 0);
	return SP_NAME_A[r() * SP_NAME_A.length | 0] + SP_NAME_B[r() * SP_NAME_B.length | 0] + SP_NAME_C[r() * SP_NAME_C.length | 0];
}
//#endregion
//#region ../celestial-frontier-anthropic-mac/port/v2/packages/domain/genome/src/genome.verbatim.js
function makeGenome(seed, kingdom, biomeHeat) {
	const r = mulberry32((seed ^ 40507) >>> 0);
	return {
		seed,
		kingdom,
		color: r() * SP_COLOR.length | 0,
		form: r() * 18 | 0,
		body: r() * FA_BODY.length | 0,
		loco: r() * FA_LOCO.length | 0,
		trait: r() * FA_TRAIT.length | 0,
		size: r() * FA_SIZE.length | 0,
		diet: r() * FA_DIET.length | 0,
		head: r() * FA_HEAD.length | 0,
		limbs: r() * FA_LIMBS.length | 0,
		skin: r() * FA_SKIN.length | 0,
		tail: r() * FA_TAIL.length | 0,
		pattern: r() * FA_PATTERN.length | 0,
		eyes: r() * FA_EYES.length | 0,
		behavior: r() * FA_BEHAVIOR.length | 0,
		habitat: r() * FA_HABITAT.length | 0,
		detail: r() * FLORA_DETAIL.length | 0,
		accent: r() * SP_COLOR.length | 0,
		temper: r() * FA_TEMPER.length | 0,
		sense: r() * FA_SENSE.length | 0,
		repro: r() * FA_REPRO.length | 0,
		life: r() * FA_LIFE.length | 0,
		metab: r() * FA_METAB.length | 0,
		lumin: r() < .28,
		gen: 0,
		heat: biomeHeat
	};
}
function _szOf(g) {
	return ((+(g && g.size) || 0) % FA_SIZE.length + FA_SIZE.length) % FA_SIZE.length;
}
function describeSpecies(g) {
	const col = SP_COLOR[g.color % SP_COLOR.length];
	if (g.kingdom === "flora") {
		const detail = FLORA_DETAIL[(g.detail || 0) % FLORA_DETAIL.length];
		return {
			name: speciesName(g.seed),
			kind: "Flora",
			grade: speciesGrade(g),
			desc: col + " " + floraFormOf(g) + (g.lumin ? ", faintly bioluminescent" : ""),
			detail: "A photosynthetic species, " + detail + "."
		};
	}
	if (g.kingdom === "fungi") return {
		name: speciesName(g.seed),
		kind: "Fungi",
		grade: speciesGrade(g),
		desc: col + " " + FUNGI_FORM[g.form % FUNGI_FORM.length] + (g.lumin ? ", glowing softly" : ""),
		detail: "A fungal organism breaking down matter and feeding the wider web of life."
	};
	if (g.kingdom === "microbe") return {
		name: speciesName(g.seed),
		kind: "Microbe",
		grade: speciesGrade(g),
		desc: col + " " + MICROBE_FORM[g.form % MICROBE_FORM.length],
		detail: "Microscopic life — the hardy foundation every larger ecosystem is built upon."
	};
	return faunaDesc(g);
}
function speciesGrade(g) {
	const dom = g.kingdom === "fauna" ? "life" : g.kingdom === "flora" ? "forest" : g.kingdom === "fungi" ? "fungal" : "life";
	if (g.apex) return colorGrade(dom, g.seed, {
		salt: 271,
		force: Math.min(TIER_MAX, Math.max(12, g.apex | 0))
	});
	if (g.par) return colorGrade(dom, g.seed, {
		salt: 271,
		force: Math.min(11, Math.max(8, g.par | 0))
	});
	let boost = 0;
	if (_szOf(g) >= 4) boost++;
	if (_szOf(g) >= 5) boost++;
	if (g.lumin) boost++;
	if ((g.gen || 0) >= 2) boost++;
	if ((g.gen || 0) >= 5) boost++;
	if (g.wild) boost++;
	return colorGrade(dom, g.seed, {
		salt: 271,
		boost
	});
}
function faunaDesc(g) {
	const col = SP_COLOR[g.color % SP_COLOR.length];
	const body = FA_BODY[g.body % FA_BODY.length], loco = locoOf(g);
	const trait = FA_TRAIT[g.trait % FA_TRAIT.length], size = FA_SIZE[g.size % FA_SIZE.length];
	const head = FA_HEAD[(g.head || 0) % FA_HEAD.length], skin = FA_SKIN[(g.skin || 0) % FA_SKIN.length];
	const tail = FA_TAIL[(g.tail || 0) % FA_TAIL.length], eyes = FA_EYES[(g.eyes || 0) % FA_EYES.length];
	const pattern = FA_PATTERN[(g.pattern || 0) % FA_PATTERN.length];
	const behavior = FA_BEHAVIOR[(g.behavior || 0) % FA_BEHAVIOR.length], habitat = habOf(g);
	const diet = FA_DIET[g.diet % FA_DIET.length];
	const eyeTxt = eyes === 0 ? "no eyes" : eyes === 1 ? "a single great eye" : eyes + " eyes";
	const anat = head + ", " + skin + "-skinned, with " + eyeTxt + (tail !== "none" ? " and a " + tail + " tail" : "");
	const temper = FA_TEMPER[(g.temper || 0) % FA_TEMPER.length], sense = FA_SENSE[(g.sense || 0) % FA_SENSE.length];
	const repro = FA_REPRO[(g.repro || 0) % FA_REPRO.length], life = FA_LIFE[(g.life || 0) % FA_LIFE.length];
	const metab = FA_METAB[(g.metab || 0) % FA_METAB.length];
	const detail = "A " + diet + " of " + habitat + ", " + behavior + ". " + anat.charAt(0).toUpperCase() + anat.slice(1) + ". It is " + temper + ", navigates by " + sense + ", and " + repro + ". " + (metab.charAt(0).toUpperCase() + metab.slice(1)) + ", it lives " + life + ".";
	return {
		name: speciesName(g.seed) + (g.apex || g.par ? " " + GUARDIAN_EPITHETS[(g.ep || 0) % GUARDIAN_EPITHETS.length] : ""),
		kind: "Fauna",
		grade: speciesGrade(g),
		desc: size + ", " + col + " " + body + " " + loco + " " + trait + (g.lumin && !/glow/.test(trait) ? ", glowing" : ""),
		diet,
		anatomy: anat,
		pattern,
		temper,
		sense,
		repro,
		life,
		metab,
		habitat,
		behavior,
		detail
	};
}
const GUARDIAN_EPITHETS = [
	"the Undying",
	"the Worldheart",
	"the Stormcrowned",
	"the Pale Sovereign",
	"the First Hunger",
	"the Hundred-Eyed",
	"the Last of Its Line",
	"the Skyrender",
	"the Deep Warden",
	"the Ash Emperor",
	"the Silent Tide",
	"the Star-Eater",
	"the Crownless",
	"the Dawn Stalker",
	"the Hollow Saint",
	"the Gravemind"
];
function guardianFor(pseed) {
	const r = mulberry32(hashInt(pseed >>> 0, 27181, 17) >>> 0);
	if (r() >= .025) return null;
	const tr = r(), tier = tr < .7 ? 12 : tr < .95 ? 13 : 14;
	const g = makeGenome(hashInt(pseed >>> 0, 27181, 34) >>> 0, "fauna", 1);
	g.size = 5;
	g.lumin = true;
	g.wild = 1;
	g.apex = tier;
	g.ep = hashInt(pseed >>> 0, 27181, 68) % GUARDIAN_EPITHETS.length;
	return {
		genome: g,
		tier,
		name: describeSpecies(g).name
	};
}
//#endregion
//#region ../celestial-frontier-anthropic-mac/port/v2/packages/domain/combatcore/src/combatcore.verbatim.js
const ABILITY_THEMES = {
	fire: {
		label: "Fire",
		col: "#ff7a4a",
		list: [
			{
				id: "magma",
				n: "Magma Strike",
				d: "Molten blows sear for +18% damage",
				dmg: 1.18
			},
			{
				id: "ember",
				n: "Ember Coat",
				d: "Smouldering hide shrugs off 14% of damage",
				taken: .86
			},
			{
				id: "cinder",
				n: "Cinderburn",
				d: "Sets foes alight — burns 5% of their vitality each round",
				burn: .05
			},
			{
				id: "wildf",
				n: "Wildfire",
				d: "Fury spreads — ferocity climbs every round",
				ramp: .06
			},
			{
				id: "pyro",
				n: "Pyroclasm",
				d: "Erupts with a devastating opening strike",
				first: 1.6
			}
		]
	},
	frost: {
		label: "Frost",
		col: "#8fd6ff",
		list: [
			{
				id: "frostb",
				n: "Frostbite",
				d: "Chilling strikes crit more and bite for +12%",
				dmg: 1.12,
				critB: .04
			},
			{
				id: "glac",
				n: "Glacial Hide",
				d: "Ice-armoured — takes 18% less damage",
				taken: .82
			},
			{
				id: "rime",
				n: "Rime Mend",
				d: "Frozen torpor knits its wounds each round",
				regen: .05
			},
			{
				id: "csnap",
				n: "Cold Snap",
				d: "Opens with a freezing ambush strike",
				first: 1.55
			},
			{
				id: "shatter",
				n: "Shatterfrost",
				d: "Brittle-freezes foes — criticals land far more often",
				critB: .08
			}
		]
	},
	storm: {
		label: "Storm",
		col: "#ffe06a",
		list: [
			{
				id: "chain",
				n: "Chain Lightning",
				d: "Arcs to strike twice in 15% of rounds",
				dbl: .15
			},
			{
				id: "static",
				n: "Static Field",
				d: "A crackling aura sharply raises critical chance",
				critB: .08
			},
			{
				id: "thndr",
				n: "Thunderclap",
				d: "Opens with a stunning first strike",
				first: 1.7
			},
			{
				id: "srider",
				n: "Stormrider",
				d: "Rides the gale — 12% dodge and quick double-strikes",
				dodge: .12,
				dbl: .07
			},
			{
				id: "volt",
				n: "Voltaic Surge",
				d: "Electrified blows hit for +14%",
				dmg: 1.14
			}
		]
	},
	tide: {
		label: "Tide",
		col: "#5fd0c8",
		list: [
			{
				id: "rip",
				n: "Riptide",
				d: "Surging blows hit for +12%",
				dmg: 1.12
			},
			{
				id: "crush",
				n: "Pressure Crush",
				d: "A crushing depth-charge opening strike",
				first: 1.5
			},
			{
				id: "renew",
				n: "Tidal Renewal",
				d: "Currents heal it at the end of each round",
				regen: .05
			},
			{
				id: "slip",
				n: "Slipstream",
				d: "Flows around blows — 15% chance to evade",
				dodge: .15
			},
			{
				id: "under",
				n: "Undertow",
				d: "Drags foes down — ferocity builds each round",
				ramp: .05
			}
		]
	},
	stone: {
		label: "Stone",
		col: "#caa06a",
		list: [
			{
				id: "hide",
				n: "Stone Hide",
				d: "Rocky plates absorb 16% of damage",
				taken: .84
			},
			{
				id: "tremor",
				n: "Tremor",
				d: "A ground-splitting opening strike",
				first: 1.6
			},
			{
				id: "bedrock",
				n: "Bedrock Stance",
				d: "Immovable — 12% less damage and slow regen",
				taken: .88,
				regen: .03
			},
			{
				id: "bould",
				n: "Boulder Charge",
				d: "Massive blows hit for +16%",
				dmg: 1.16
			},
			{
				id: "burrowg",
				n: "Burrower’s Guard",
				d: "Slips underground — 11% chance to evade",
				dodge: .11
			}
		]
	},
	venom: {
		label: "Venom",
		col: "#9fe06a",
		list: [
			{
				id: "venom",
				n: "Venom Strike",
				d: "Toxic blows hit for +15%",
				dmg: 1.15
			},
			{
				id: "toxin",
				n: "Toxin Bloom",
				d: "Festering venom drains 4% vitality each round",
				burn: .04
			},
			{
				id: "ambush",
				n: "Ambush",
				d: "Strikes first from cover",
				first: 1.7
			},
			{
				id: "camo",
				n: "Camouflage",
				d: "Vanishes — 14% chance to evade a strike",
				dodge: .14
			},
			{
				id: "gut",
				n: "Iron Gut",
				d: "Immune to flora poisoning when fed — and its iron constitution shrugs off part of every blow",
				gutsy: true,
				taken: .93
			}
		]
	},
	void: {
		label: "Void",
		col: "#b58cff",
		list: [
			{
				id: "umbral",
				n: "Umbral Step",
				d: "Phases through blows — 16% chance to evade",
				dodge: .16
			},
			{
				id: "soul",
				n: "Soul Drain",
				d: "Critical hits restore its own vitality",
				drink: true,
				critB: .05
			},
			{
				id: "eclip",
				n: "Eclipse Strike",
				d: "Shadow-honed criticals land far more often",
				critB: .09
			},
			{
				id: "terror",
				n: "Night Terror",
				d: "Opens from darkness with a brutal strike",
				first: 1.65
			},
			{
				id: "vtouch",
				n: "Voidtouched",
				d: "Unnatural flesh — +13% damage and 8% less taken",
				dmg: 1.13,
				taken: .92
			}
		]
	},
	sand: {
		label: "Sand",
		col: "#e8c878",
		list: [
			{
				id: "sblast",
				n: "Sandblast",
				d: "Abrasive blows hit for +14%",
				dmg: 1.14
			},
			{
				id: "mirage",
				n: "Mirage",
				d: "A shimmering haze — 13% chance to evade",
				dodge: .13
			},
			{
				id: "sunsr",
				n: "Sunsear",
				d: "Blistering heat burns 4.5% vitality each round",
				burn: .045
			},
			{
				id: "dust",
				n: "Dust Cloak",
				d: "Veiled in grit — 10% less damage and 8% dodge",
				taken: .9,
				dodge: .08
			},
			{
				id: "scorch",
				n: "Scorching Pace",
				d: "Builds momentum across the fight",
				ramp: .055
			}
		]
	},
	chem: {
		label: "Chem",
		col: "#c0ff5a",
		list: [
			{
				id: "acid",
				n: "Acid Spray",
				d: "Corrosive blows hit for +16%",
				dmg: 1.16
			},
			{
				id: "caustic",
				n: "Caustic Hide",
				d: "Chemical skin absorbs 15% of damage",
				taken: .85
			},
			{
				id: "corgut",
				n: "Corrosive Gut",
				d: "Digests anything — toxin-proof and +6% damage",
				gutsy: true,
				dmg: 1.06
			},
			{
				id: "noxious",
				n: "Noxious Cloud",
				d: "Choking fumes drain 4% vitality each round",
				burn: .04
			},
			{
				id: "volat",
				n: "Volatile Blood",
				d: "Critical hits feed its own vitality",
				drink: true,
				critB: .05
			}
		]
	},
	psionic: {
		label: "Psionic",
		col: "#ff9fe0",
		list: [
			{
				id: "mspike",
				n: "Mind Spike",
				d: "Psychic lances crit far more often",
				critB: .09
			},
			{
				id: "phase",
				n: "Phase Shift",
				d: "Blinks aside — 15% chance to evade",
				dodge: .15
			},
			{
				id: "psidr",
				n: "Psychic Drain",
				d: "Critical hits siphon its vitality back",
				drink: true,
				critB: .05
			},
			{
				id: "fore",
				n: "Foresight",
				d: "Reads the foe — first strike and 6% dodge",
				first: 1.5,
				dodge: .06
			},
			{
				id: "reson",
				n: "Resonance",
				d: "A harmonic field — builds fury and slowly mends",
				ramp: .05,
				regen: .02
			}
		]
	},
	wild: {
		label: "Wild",
		col: "#9fb6d6",
		list: [
			{
				id: "swift",
				n: "Swift Hunter",
				d: "10% chance to strike twice in a round",
				dbl: .1
			},
			{
				id: "apex",
				n: "Apex Instinct",
				d: "Critical hits land more often",
				critB: .07
			},
			{
				id: "pack",
				n: "Pack Howl",
				d: "Ferocity rises every round it fights",
				ramp: .05
			},
			{
				id: "hardy",
				n: "Hardy Beast",
				d: "Thick build — takes 10% less damage",
				taken: .9
			},
			{
				id: "maw",
				n: "Savage Maw",
				d: "Opens with a vicious first strike",
				first: 1.55
			}
		]
	}
};
const HAB_THEME = [
	"venom",
	"wild",
	"stone",
	"tide",
	"tide",
	"stone",
	"frost",
	"void",
	"psionic",
	"fire",
	"tide",
	"sand",
	"chem",
	"chem",
	"storm",
	"fire",
	"sand",
	"venom",
	"frost"
];
function abilityTheme(g) {
	let t = HAB_THEME[(g.habitat || 0) % HAB_THEME.length] || "wild";
	const lo = g.loco || 0;
	if (lo === 3) t = "storm";
	else if (lo === 4 || lo === 13) t = "tide";
	else if (lo === 5 || lo === 11 || lo === 17) t = "psionic";
	else if (lo === 1) t = "stone";
	return t;
}
const ARCH_ROMAN = [
	"I",
	"II",
	"III",
	"IV",
	"V"
];
const ARCHETYPES = [
	{
		id: "smite",
		n: "Smite",
		d: "lands every blow harder",
		mk: (m) => ({ dmg: 1.12 + m * .045 })
	},
	{
		id: "aegis",
		n: "Aegis",
		d: "wears a warded hide that takes less damage",
		mk: (m) => ({ taken: .92 - m * .026 })
	},
	{
		id: "dot",
		n: "Affliction",
		d: "sears the foe for a share of vitality each round",
		mk: (m) => ({ burn: .022 + m * .005 })
	},
	{
		id: "fury",
		n: "Fury",
		d: "builds ferocity every round",
		mk: (m) => ({ ramp: .029 + m * .0072 })
	},
	{
		id: "ambush",
		n: "Ambush",
		d: "opens with a savage strike",
		mk: (m) => ({ first: 1.6 + m * .15 })
	},
	{
		id: "eye",
		n: "Eye",
		d: "lands criticals far more often",
		mk: (m) => ({ critB: .19 + m * .038 })
	},
	{
		id: "veil",
		n: "Veil",
		d: "slips entirely aside from blows",
		mk: (m) => ({ dodge: .1 + m * .022 })
	},
	{
		id: "mend",
		n: "Mending",
		d: "knits its wounds at the end of each round",
		mk: (m) => ({ regen: .03 + m * .006 })
	},
	{
		id: "echo",
		n: "Echo",
		d: "strikes twice in a share of rounds",
		mk: (m) => ({ dbl: .11 + m * .026 })
	},
	{
		id: "thirst",
		n: "Thirst",
		d: "drinks vitality back on critical hits",
		mk: (m) => ({
			drink: true,
			critB: .07 + m * .018
		})
	},
	{
		id: "thorns",
		n: "Thorns",
		d: "bleeds attackers for a share of what they deal",
		mk: (m) => ({ thorns: .08 + m * .025 })
	},
	{
		id: "rend",
		n: "Rend",
		d: "tears defenses open — the foe suffers more as the fight wears on",
		mk: (m) => ({ shred: .06 + m * .014 })
	},
	{
		id: "reck",
		n: "Reckoning",
		d: "punishes wounded foes below half vitality",
		mk: (m) => ({ execB: .28 + m * .09 })
	},
	{
		id: "bulwark",
		n: "Bulwark",
		d: "raises a wall no single blow can breach",
		mk: (m) => ({ cap: .28 - m * .015 })
	},
	{
		id: "shock",
		n: "Shock",
		d: "staggers the foe clean out of its next strike",
		mk: (m) => ({ stun: .095 + m * .024 })
	},
	{
		id: "roulette",
		n: "Roulette",
		d: "swings wild — a gambler’s ceiling",
		mk: (m) => ({ gambit: .34 + m * .07 })
	},
	{
		id: "enrage",
		n: "Rage",
		d: "grows stronger the more it bleeds",
		mk: (m) => ({ enrage: .16 + m * .05 })
	}
];
const CLASS_GROUPS = {
	M: "Martial",
	C: "Caster",
	S: "Stealth",
	D: "Divine",
	N: "Nature",
	K: "Dark",
	B: "Beast",
	T: "Artifice",
	X: "Mythic"
};
const CLASSES = [
	[
		"Warrior",
		"M",
		0,
		"smite",
		"aegis",
		"reck"
	],
	[
		"Fighter",
		"M",
		0,
		"aegis",
		"smite",
		"echo"
	],
	[
		"Barbarian",
		"M",
		0,
		"fury",
		"smite",
		"enrage"
	],
	[
		"Berserker",
		"M",
		2,
		"enrage",
		"fury",
		"roulette"
	],
	[
		"Knight",
		"M",
		1,
		"aegis",
		"bulwark",
		"thorns"
	],
	[
		"Paladin",
		"D",
		3,
		"mend",
		"aegis",
		"smite"
	],
	[
		"Crusader",
		"D",
		2,
		"smite",
		"aegis",
		"dot"
	],
	[
		"Templar",
		"D",
		3,
		"bulwark",
		"mend",
		"eye"
	],
	[
		"Monk",
		"M",
		1,
		"veil",
		"echo",
		"shock"
	],
	[
		"Shadow Monk",
		"S",
		3,
		"veil",
		"shock",
		"ambush"
	],
	[
		"Samurai",
		"M",
		2,
		"ambush",
		"eye",
		"reck"
	],
	[
		"Ronin",
		"M",
		1,
		"roulette",
		"ambush",
		"veil"
	],
	[
		"Duelist",
		"M",
		1,
		"eye",
		"veil",
		"reck"
	],
	[
		"Swashbuckler",
		"M",
		1,
		"echo",
		"veil",
		"roulette"
	],
	[
		"Brawler",
		"M",
		0,
		"shock",
		"smite",
		"enrage"
	],
	[
		"Gladiator",
		"M",
		2,
		"reck",
		"fury",
		"aegis"
	],
	[
		"Ranger",
		"N",
		0,
		"ambush",
		"eye",
		"veil"
	],
	[
		"Hunter",
		"N",
		0,
		"eye",
		"ambush",
		"rend"
	],
	[
		"Archer",
		"M",
		0,
		"eye",
		"echo",
		"ambush"
	],
	[
		"Arcane Archer",
		"C",
		2,
		"eye",
		"dot",
		"echo"
	],
	[
		"Scout",
		"S",
		0,
		"veil",
		"ambush",
		"echo"
	],
	[
		"Rogue",
		"S",
		1,
		"ambush",
		"eye",
		"veil"
	],
	[
		"Assassin",
		"S",
		3,
		"ambush",
		"reck",
		"shock"
	],
	[
		"Ninja",
		"S",
		2,
		"veil",
		"echo",
		"shock"
	],
	[
		"Shadowblade",
		"S",
		4,
		"ambush",
		"rend",
		"veil"
	],
	[
		"Demon Hunter",
		"D",
		3,
		"rend",
		"eye",
		"thorns"
	],
	[
		"Monster Slayer",
		"M",
		2,
		"rend",
		"reck",
		"aegis"
	],
	[
		"Dragon Slayer",
		"M",
		4,
		"rend",
		"reck",
		"bulwark"
	],
	[
		"Giant Slayer",
		"M",
		3,
		"reck",
		"rend",
		"veil"
	],
	[
		"Wizard",
		"C",
		2,
		"dot",
		"eye",
		"shock"
	],
	[
		"Mage",
		"C",
		0,
		"dot",
		"eye",
		"mend"
	],
	[
		"Sorcerer",
		"C",
		1,
		"roulette",
		"dot",
		"fury"
	],
	[
		"Warlock",
		"K",
		2,
		"dot",
		"thirst",
		"rend"
	],
	[
		"Witch",
		"K",
		1,
		"rend",
		"dot",
		"veil"
	],
	[
		"Necromancer",
		"K",
		3,
		"thirst",
		"dot",
		"mend"
	],
	[
		"Lich",
		"K",
		5,
		"thirst",
		"mend",
		"dot"
	],
	[
		"Elementalist",
		"C",
		2,
		"dot",
		"fury",
		"aegis"
	],
	[
		"Pyromancer",
		"C",
		1,
		"dot",
		"smite",
		"fury"
	],
	[
		"Cryomancer",
		"C",
		1,
		"shock",
		"aegis",
		"dot"
	],
	[
		"Stormcaller",
		"C",
		2,
		"echo",
		"shock",
		"dot"
	],
	[
		"Geomancer",
		"C",
		1,
		"bulwark",
		"thorns",
		"aegis"
	],
	[
		"Hydromancer",
		"C",
		1,
		"mend",
		"aegis",
		"dot"
	],
	[
		"Chronomancer",
		"C",
		4,
		"shock",
		"veil",
		"echo"
	],
	[
		"Blood Mage",
		"K",
		3,
		"thirst",
		"enrage",
		"dot"
	],
	[
		"Psion",
		"C",
		3,
		"shock",
		"eye",
		"veil"
	],
	[
		"Cleric",
		"D",
		1,
		"mend",
		"aegis",
		"bulwark"
	],
	[
		"Druid",
		"N",
		1,
		"mend",
		"thorns",
		"fury"
	],
	[
		"Shaman",
		"N",
		1,
		"mend",
		"dot",
		"fury"
	],
	[
		"Oracle",
		"D",
		3,
		"eye",
		"veil",
		"mend"
	],
	[
		"Inquisitor",
		"D",
		2,
		"reck",
		"eye",
		"aegis"
	],
	[
		"Death Knight",
		"K",
		4,
		"thirst",
		"aegis",
		"dot"
	],
	[
		"Dark Knight",
		"K",
		3,
		"enrage",
		"thirst",
		"smite"
	],
	[
		"Hexblade",
		"K",
		3,
		"rend",
		"roulette",
		"thirst"
	],
	[
		"Reaper",
		"K",
		4,
		"reck",
		"ambush",
		"thirst"
	],
	[
		"Vampire",
		"K",
		3,
		"thirst",
		"veil",
		"mend"
	],
	[
		"Plaguebearer",
		"K",
		2,
		"dot",
		"rend",
		"thorns"
	],
	[
		"Beastmaster",
		"B",
		1,
		"fury",
		"echo",
		"mend"
	],
	[
		"Warden",
		"N",
		2,
		"thorns",
		"bulwark",
		"mend"
	],
	[
		"Shapeshifter",
		"B",
		2,
		"roulette",
		"veil",
		"enrage"
	],
	[
		"Alchemist",
		"T",
		1,
		"dot",
		"roulette",
		"mend"
	],
	[
		"Artificer",
		"T",
		2,
		"bulwark",
		"echo",
		"thorns"
	],
	[
		"Engineer",
		"T",
		1,
		"thorns",
		"bulwark",
		"echo"
	],
	[
		"Gunslinger",
		"T",
		2,
		"echo",
		"eye",
		"ambush"
	],
	[
		"Battlemage",
		"C",
		2,
		"smite",
		"aegis",
		"dot"
	],
	[
		"Spellsword",
		"C",
		2,
		"echo",
		"smite",
		"eye"
	],
	[
		"Mystic Knight",
		"C",
		3,
		"aegis",
		"bulwark",
		"smite"
	],
	[
		"Runeblade",
		"C",
		3,
		"rend",
		"smite",
		"bulwark"
	],
	[
		"Summoner",
		"C",
		2,
		"echo",
		"mend",
		"dot"
	],
	[
		"Bard",
		"D",
		1,
		"shock",
		"mend",
		"veil"
	],
	[
		"Sage",
		"C",
		2,
		"eye",
		"mend",
		"veil"
	],
	[
		"Strategist",
		"M",
		2,
		"eye",
		"rend",
		"aegis"
	],
	[
		"Amazon",
		"M",
		2,
		"echo",
		"ambush",
		"fury"
	],
	[
		"Valkyrie",
		"D",
		4,
		"smite",
		"mend",
		"ambush"
	],
	[
		"Titan",
		"X",
		5,
		"bulwark",
		"smite",
		"enrage"
	],
	[
		"Champion",
		"M",
		3,
		"smite",
		"aegis",
		"fury"
	],
	[
		"Guardian",
		"M",
		2,
		"bulwark",
		"thorns",
		"mend"
	],
	[
		"Warlord",
		"M",
		4,
		"fury",
		"smite",
		"reck"
	],
	[
		"Spellbreaker",
		"M",
		3,
		"shock",
		"aegis",
		"rend"
	],
	[
		"Astral Knight",
		"X",
		6,
		"smite",
		"veil",
		"dot"
	],
	[
		"Void Knight",
		"X",
		7,
		"rend",
		"veil",
		"thirst"
	],
	[
		"Phoenix Knight",
		"X",
		6,
		"mend",
		"dot",
		"enrage"
	],
	[
		"Frost Knight",
		"M",
		3,
		"shock",
		"aegis",
		"bulwark"
	],
	[
		"Storm Knight",
		"M",
		3,
		"echo",
		"shock",
		"smite"
	],
	[
		"Holy Beast",
		"B",
		4,
		"mend",
		"smite",
		"aegis"
	],
	[
		"Demonic Beast",
		"B",
		4,
		"enrage",
		"dot",
		"thirst"
	],
	[
		"Elder Beast",
		"B",
		5,
		"bulwark",
		"mend",
		"fury"
	],
	[
		"Primal Beast",
		"B",
		1,
		"fury",
		"enrage",
		"smite"
	],
	[
		"Celestial Beast",
		"X",
		6,
		"eye",
		"mend",
		"veil"
	],
	[
		"Abyssal Beast",
		"X",
		6,
		"rend",
		"veil",
		"dot"
	],
	[
		"Spirit Beast",
		"B",
		3,
		"veil",
		"mend",
		"shock"
	],
	[
		"Crystal Beast",
		"B",
		3,
		"thorns",
		"bulwark",
		"eye"
	],
	[
		"Metal Beast",
		"B",
		2,
		"aegis",
		"bulwark",
		"smite"
	],
	[
		"Poison Beast",
		"B",
		1,
		"dot",
		"thorns",
		"rend"
	],
	[
		"Venomancer",
		"K",
		2,
		"dot",
		"rend",
		"veil"
	],
	[
		"Swarm Lord",
		"B",
		3,
		"echo",
		"dot",
		"fury"
	],
	[
		"Nightstalker",
		"S",
		2,
		"ambush",
		"veil",
		"reck"
	],
	[
		"Dawnbringer",
		"D",
		4,
		"smite",
		"mend",
		"eye"
	],
	[
		"Dragonbound",
		"X",
		5,
		"dot",
		"smite",
		"aegis"
	],
	[
		"Feybound",
		"N",
		3,
		"veil",
		"shock",
		"roulette"
	],
	[
		"Beastbound",
		"B",
		2,
		"fury",
		"smite",
		"mend"
	],
	[
		"Spiritbound",
		"D",
		3,
		"veil",
		"mend",
		"eye"
	],
	[
		"Machinebound",
		"T",
		3,
		"bulwark",
		"echo",
		"aegis"
	],
	[
		"Crystalbound",
		"T",
		3,
		"thorns",
		"eye",
		"bulwark"
	],
	[
		"Godtouched",
		"X",
		8,
		"mend",
		"smite",
		"veil"
	],
	[
		"Cursed One",
		"K",
		4,
		"roulette",
		"enrage",
		"rend"
	],
	[
		"Mutant",
		"B",
		2,
		"roulette",
		"enrage",
		"mend"
	],
	[
		"Eldritch Horror",
		"X",
		9,
		"shock",
		"rend",
		"thirst"
	],
	[
		"Ancient One",
		"X",
		9,
		"bulwark",
		"mend",
		"eye"
	],
	[
		"Worldbreaker",
		"X",
		11,
		"smite",
		"reck",
		"enrage"
	],
	[
		"Worldhealer",
		"X",
		11,
		"mend",
		"bulwark",
		"thorns"
	],
	[
		"Worldeater",
		"X",
		12,
		"thirst",
		"rend",
		"dot"
	],
	[
		"Worldshaper",
		"X",
		12,
		"bulwark",
		"shock",
		"smite"
	],
	[
		"Avatar",
		"X",
		13,
		"smite",
		"mend",
		"veil"
	],
	[
		"Chosen One",
		"X",
		14,
		"enrage",
		"mend",
		"eye"
	],
	[
		"Mystic Monk",
		"M",
		2,
		"mend",
		"veil",
		"eye"
	],
	[
		"Thief",
		"S",
		0,
		"veil",
		"ambush",
		"roulette"
	],
	[
		"Undead Hunter",
		"D",
		2,
		"reck",
		"dot",
		"aegis"
	],
	[
		"Mage Hunter",
		"M",
		2,
		"shock",
		"rend",
		"veil"
	],
	[
		"Bounty Hunter",
		"S",
		1,
		"eye",
		"shock",
		"rend"
	],
	[
		"Aeromancer",
		"C",
		1,
		"veil",
		"echo",
		"shock"
	],
	[
		"Illusionist",
		"C",
		2,
		"veil",
		"shock",
		"roulette"
	],
	[
		"Enchanter",
		"C",
		2,
		"shock",
		"mend",
		"eye"
	],
	[
		"Rune Mage",
		"C",
		3,
		"bulwark",
		"dot",
		"aegis"
	],
	[
		"Astral Mage",
		"X",
		5,
		"dot",
		"eye",
		"veil"
	],
	[
		"Voidwalker",
		"X",
		6,
		"veil",
		"rend",
		"thirst"
	],
	[
		"Dreamwalker",
		"C",
		4,
		"shock",
		"veil",
		"mend"
	],
	[
		"Fateweaver",
		"X",
		7,
		"roulette",
		"eye",
		"veil"
	],
	[
		"Priest",
		"D",
		0,
		"mend",
		"aegis",
		"eye"
	],
	[
		"Seer",
		"D",
		2,
		"eye",
		"veil",
		"mend"
	],
	[
		"Exorcist",
		"D",
		2,
		"reck",
		"mend",
		"shock"
	],
	[
		"Witch Doctor",
		"K",
		2,
		"dot",
		"mend",
		"thorns"
	],
	[
		"Blood Knight",
		"K",
		4,
		"thirst",
		"smite",
		"enrage"
	],
	[
		"Herbalist",
		"N",
		0,
		"mend",
		"dot",
		"aegis"
	],
	[
		"Tinkerer",
		"T",
		1,
		"roulette",
		"thorns",
		"echo"
	],
	[
		"Bombardier",
		"T",
		2,
		"dot",
		"roulette",
		"smite"
	],
	[
		"Crossbowman",
		"M",
		1,
		"eye",
		"smite",
		"rend"
	],
	[
		"Druidic Warrior",
		"N",
		2,
		"thorns",
		"fury",
		"mend"
	],
	[
		"Ranger-Mage",
		"N",
		2,
		"eye",
		"dot",
		"veil"
	],
	[
		"Conjurer",
		"C",
		1,
		"bulwark",
		"echo",
		"mend"
	],
	[
		"Demonologist",
		"K",
		4,
		"dot",
		"thirst",
		"enrage"
	],
	[
		"Necrosummoner",
		"K",
		4,
		"thirst",
		"echo",
		"dot"
	],
	[
		"Spirit Caller",
		"D",
		3,
		"veil",
		"echo",
		"mend"
	],
	[
		"Golemancer",
		"T",
		3,
		"bulwark",
		"aegis",
		"thorns"
	],
	[
		"Minstrel",
		"D",
		0,
		"mend",
		"veil",
		"shock"
	],
	[
		"Dancer",
		"M",
		1,
		"veil",
		"echo",
		"shock"
	],
	[
		"Tactician",
		"M",
		1,
		"eye",
		"aegis",
		"rend"
	],
	[
		"Noble",
		"M",
		1,
		"aegis",
		"eye",
		"mend"
	],
	[
		"Merchant",
		"T",
		0,
		"roulette",
		"aegis",
		"mend"
	],
	[
		"Chef",
		"N",
		0,
		"mend",
		"enrage",
		"aegis"
	],
	[
		"Soulbinder",
		"K",
		3,
		"mend",
		"thirst",
		"bulwark"
	],
	[
		"Beast Knight",
		"B",
		3,
		"smite",
		"fury",
		"aegis"
	],
	[
		"Arcane Beast",
		"B",
		3,
		"roulette",
		"dot",
		"veil"
	],
	[
		"Undead Beast",
		"B",
		3,
		"thirst",
		"aegis",
		"dot"
	],
	[
		"Elemental Beast",
		"B",
		2,
		"dot",
		"aegis",
		"fury"
	],
	[
		"Spore Druid",
		"N",
		2,
		"dot",
		"mend",
		"thorns"
	],
	[
		"Broodmother",
		"B",
		2,
		"echo",
		"dot",
		"mend"
	],
	[
		"Webspinner",
		"B",
		1,
		"shock",
		"dot",
		"veil"
	],
	[
		"Bonecaster",
		"K",
		2,
		"bulwark",
		"dot",
		"aegis"
	],
	[
		"Gravecaller",
		"K",
		3,
		"thirst",
		"shock",
		"dot"
	],
	[
		"Ashen One",
		"K",
		4,
		"dot",
		"mend",
		"enrage"
	],
	[
		"Sun Priest",
		"D",
		3,
		"smite",
		"mend",
		"eye"
	],
	[
		"Moon Priest",
		"D",
		3,
		"veil",
		"mend",
		"shock"
	],
	[
		"Star Seer",
		"X",
		5,
		"eye",
		"veil",
		"roulette"
	],
	[
		"Chaos Mage",
		"C",
		3,
		"roulette",
		"enrage",
		"dot"
	],
	[
		"Order Mage",
		"C",
		3,
		"aegis",
		"bulwark",
		"shock"
	],
	[
		"Gravity Mage",
		"C",
		4,
		"shock",
		"bulwark",
		"rend"
	],
	[
		"Magnetist",
		"T",
		2,
		"rend",
		"aegis",
		"shock"
	],
	[
		"Soundweaver",
		"C",
		2,
		"shock",
		"echo",
		"veil"
	],
	[
		"Lightweaver",
		"D",
		2,
		"eye",
		"veil",
		"mend"
	],
	[
		"Shadowcaster",
		"K",
		2,
		"veil",
		"dot",
		"ambush"
	],
	[
		"Mirror Mage",
		"C",
		3,
		"thorns",
		"veil",
		"roulette"
	],
	[
		"Sand Mage",
		"C",
		1,
		"shock",
		"veil",
		"dot"
	],
	[
		"Lava Mage",
		"C",
		2,
		"dot",
		"smite",
		"bulwark"
	],
	[
		"Tidecaller",
		"C",
		2,
		"mend",
		"shock",
		"dot"
	],
	[
		"Frostborn",
		"B",
		1,
		"aegis",
		"shock",
		"bulwark"
	],
	[
		"Flameborn",
		"B",
		1,
		"dot",
		"smite",
		"enrage"
	],
	[
		"Stormborn",
		"B",
		1,
		"echo",
		"shock",
		"veil"
	],
	[
		"Earthborn",
		"B",
		1,
		"bulwark",
		"thorns",
		"aegis"
	],
	[
		"Hellcaller",
		"K",
		4,
		"dot",
		"enrage",
		"thirst"
	],
	[
		"Angelbound",
		"D",
		4,
		"mend",
		"aegis",
		"smite"
	],
	[
		"Demonbound",
		"K",
		4,
		"enrage",
		"dot",
		"thirst"
	],
	[
		"Skinwalker",
		"B",
		3,
		"roulette",
		"mend",
		"fury"
	]
];
function classOf(g) {
	const tier = speciesGrade(g).tier | 0;
	let pool = CLASSES.filter((c) => c[2] <= tier);
	if (!pool.length) pool = CLASSES.slice(0, 8);
	if (g.parents && g.parents.length === 2) {
		if (mulberry32(hashInt(g.seed >>> 0, 3098, 7) >>> 0)() < .6) {
			const gA = CLASSES[hashInt(g.parents[0] >>> 0, 3098, 5) % CLASSES.length][1];
			const gB = CLASSES[hashInt(g.parents[1] >>> 0, 3098, 5) % CLASSES.length][1];
			const fused = pool.filter((c) => c[1] === gA || c[1] === gB);
			if (fused.length) pool = fused;
		}
	}
	const c = pool[hashInt(g.seed >>> 0, 3098, 5) % pool.length];
	return {
		name: c[0],
		group: CLASS_GROUPS[c[1]] || c[1],
		verbs: [
			c[3],
			c[4],
			c[5]
		],
		minTier: c[2]
	};
}
function levelOf(g) {
	return Math.min(9, Math.floor(Math.sqrt(Math.max(0, +g.xp || 0) / 6)));
}
function classKit(g) {
	const cls = classOf(g), lvl = levelOf(g);
	const n = 1 + (lvl >= 3 ? 1 : 0) + (lvl >= 6 ? 1 : 0);
	const hooks = {};
	for (let i = 0; i < n; i++) {
		const ar = ARCHETYPES.find((a) => a.id === cls.verbs[i]);
		if (!ar) continue;
		const h = ar.mk(i);
		for (const k in h) if (k === "dmg" || k === "taken" || k === "first") hooks[k] = (hooks[k] || 1) * h[k];
		else if (typeof h[k] === "boolean") hooks[k] = hooks[k] || h[k];
		else hooks[k] = (hooks[k] || 0) + h[k];
	}
	return {
		cls,
		lvl,
		slots: n,
		hooks
	};
}
function abilityOf(g) {
	const tk = abilityTheme(g), T = ABILITY_THEMES[tk] || ABILITY_THEMES.wild;
	const tier = speciesGrade(g).tier | 0;
	const m = Math.max(0, Math.min(4, Math.floor(tier / 3)));
	const POOL = T.list.length + ARCHETYPES.length;
	let pick = hashInt(g.seed >>> 0, 2737, 5) % POOL;
	if (g.parents && g.parents.length === 2) {
		if (mulberry32(hashInt(g.seed >>> 0, 2738, 9) >>> 0)() < .7) pick = hashInt(g.parents[1] >>> 0, 2737, 5) % POOL;
	}
	let ab;
	if (pick < T.list.length) ab = Object.assign({}, T.list[pick]);
	else {
		const ar = ARCHETYPES[pick - T.list.length];
		ab = Object.assign({
			id: ar.id + "_" + m,
			n: T.label + " " + ar.n + " " + ARCH_ROMAN[m],
			d: "It " + ar.d + "."
		}, ar.mk(m));
	}
	if (g.apex) {
		const ar = ARCHETYPES[hashInt(g.seed >>> 0, 2739, 3) % ARCHETYPES.length];
		ab = Object.assign({
			id: "sov_" + ar.id,
			n: "Sovereign " + T.label + " " + ar.n,
			d: "A guardian’s art — it " + ar.d + ", and its hide turns a tenth of all harm."
		}, ar.mk(4));
		ab.taken = (ab.taken || 1) * .9;
	}
	return Object.assign(ab, {
		theme: tk,
		themeLabel: T.label,
		col: T.col
	});
}
function battleStats(g) {
	const d = describeSpecies(g);
	const tier = Math.min(d.grade ? d.grade.tier : 0, g && g._cradle ? 2 : 99);
	const r = mulberry32((g.seed ^ 22439) >>> 0);
	const budget = 170 + tier * 38 + Math.floor(r() * 30);
	const W = {
		fauna: [
			1,
			1.15,
			.9,
			1.1,
			.85
		],
		flora: [
			1.3,
			.6,
			1.45,
			.4,
			1.25
		],
		fungi: [
			1.1,
			.75,
			1.1,
			.65,
			1.4
		],
		microbe: [
			.75,
			.95,
			.75,
			1.55,
			1
		]
	}[g.kingdom] || [
		1,
		1,
		1,
		1,
		1
	];
	const raw = [
		0,
		0,
		0,
		0,
		0
	].map(() => .6 + r() * .8);
	let sum = 0;
	for (let i = 0; i < 5; i++) {
		raw[i] *= W[i];
		sum += raw[i];
	}
	const s = raw.map((x) => Math.max(8, Math.round(budget * x / sum)));
	const sz = ((+g.size || 0) % FA_SIZE.length + FA_SIZE.length) % FA_SIZE.length;
	s[0] += sz * 4;
	s[3] = Math.max(6, s[3] - sz * 2);
	s[1] += Math.min(10, (g.diet || 0) * 2);
	const bonusRaw = Math.min(200, g.brood || 0) * 22 + Math.min(200, g.fed || 0) * 10;
	const bonus = bonusRaw <= 1e3 ? bonusRaw : 1e3 + Math.round(700 * (bonusRaw - 1e3) / (bonusRaw - 1e3 + 2160));
	if (bonus) for (let i = 0; i < 5; i++) s[i] += Math.round(bonus / 5);
	if (g._mult && g._mult > 1) for (let i = 0; i < 5; i++) s[i] = Math.round(s[i] * g._mult);
	if (g._wf) {
		const F = {
			lava: [
				0,
				1.12,
				0,
				0,
				0
			],
			ice: [
				0,
				0,
				1.12,
				0,
				0
			],
			gas: [
				0,
				0,
				0,
				1.12,
				0
			],
			ocean: [
				1.1,
				0,
				0,
				0,
				0
			],
			desert: [
				0,
				0,
				0,
				0,
				1.12
			]
		}[g._wf];
		if (F) {
			for (let i = 0; i < 5; i++) if (F[i]) s[i] = Math.round(s[i] * F[i]);
		}
	}
	if (g.hurt && g.hurt > 0) {
		const w = 1 - Math.min(.85, +g.hurt) * .55;
		for (let i = 0; i < 5; i++) s[i] = Math.max(4, Math.round(s[i] * w));
	}
	const ab = abilityOf(g);
	let _cls = null, _lvl = 0;
	if (g.kingdom === "fauna") {
		const K = classKit(g);
		_cls = K.cls.name;
		_lvl = K.lvl;
		for (const k in K.hooks) if (k === "dmg" || k === "taken" || k === "first") ab[k] = (ab[k] || 1) * K.hooks[k];
		else if (typeof K.hooks[k] === "boolean") ab[k] = ab[k] || K.hooks[k];
		else ab[k] = (ab[k] || 0) + K.hooks[k];
	}
	return {
		vit: s[0],
		fer: s[1],
		res: s[2],
		agi: s[3],
		ins: s[4],
		tier,
		total: s[0] + s[1] + s[2] + s[3] + s[4],
		hex: d.grade ? d.grade.hex : "#9fb6d6",
		name: d.name,
		cls: _cls,
		lvl: _lvl,
		ab
	};
}
function runDuel(mine, theirs) {
	const A = mine.stats || battleStats(mine.genome), B = theirs.stats || battleStats(theirs.genome);
	const r = mulberry32(hashInt(mine.genome.seed >>> 0, theirs.genome.seed >>> 0, 53473) >>> 0);
	const maxA = A.vit * 3, maxB = B.vit * 3;
	let hpA = maxA, hpB = maxB, turnA = A.agi > B.agi || A.agi === B.agi && (hashInt(hashInt(mine.genome.seed >>> 0, 40503, 29163), theirs.genome.seed >>> 0, 34283) >>> 8 & 1) === 0;
	const _turnA0 = turnA;
	let rampA = 0, rampB = 0, firstA = true, firstB = true;
	let shredA = 0, shredB = 0, skipA = false, skipB = false;
	const log = [];
	const strike = () => {
		const att = turnA ? A : B, def = turnA ? B : A;
		const an = turnA ? mine.name : theirs.name, dn = turnA ? theirs.name : mine.name;
		if (turnA ? skipA : skipB) {
			if (turnA) skipA = false;
			else skipB = false;
			log.push({
				an,
				dn,
				stun: true,
				hpA,
				hpB
			});
			return;
		}
		if (def.ab.dodge && r() < def.ab.dodge) {
			log.push({
				an,
				dn,
				dodge: true,
				hpA,
				hpB
			});
			return;
		}
		const crit = r() < Math.min(.95, att.ins / 420 + (att.ab.critB || 0));
		const ramp = turnA ? rampA : rampB;
		let fs = false, ex = false, tb = 0, ls = 0, stp = false;
		let dmg = att.fer * (1 + ramp) * (.8 + r() * .5) - def.res * .45;
		if (att.ab.dmg) dmg *= att.ab.dmg;
		if (def.ab.taken) dmg *= def.ab.taken;
		if (att.ab.first && (turnA ? firstA : firstB)) {
			dmg *= att.ab.first;
			fs = true;
		}
		if (att.ab.enrage) {
			const _mf = turnA ? 1 - hpA / maxA : 1 - hpB / maxB;
			dmg *= 1 + att.ab.enrage * _mf;
		}
		if (att.ab.gambit) dmg *= 1 - att.ab.gambit * .45 + r() * att.ab.gambit * 1.45;
		dmg *= 1 + (turnA ? shredB : shredA);
		if (att.ab.execB && (turnA ? hpB < maxB * .5 : hpA < maxA * .5)) {
			dmg *= 1 + att.ab.execB;
			ex = true;
		}
		dmg = Math.max(2, Math.round(att.fer * .1), Math.round(dmg));
		if (crit) dmg = Math.round(dmg * 1.7);
		if (def.ab.cap) dmg = Math.min(dmg, Math.max(3, Math.round((turnA ? maxB : maxA) * def.ab.cap)));
		if (turnA) {
			hpB = Math.max(0, hpB - dmg);
			firstA = false;
		} else {
			hpA = Math.max(0, hpA - dmg);
			firstB = false;
		}
		if (att.ab.shred) if (turnA) shredB += att.ab.shred;
		else shredA += att.ab.shred;
		if (def.ab.thorns) {
			tb = Math.max(1, Math.round(dmg * def.ab.thorns));
			if (turnA) hpA = Math.max(0, hpA - tb);
			else hpB = Math.max(0, hpB - tb);
		}
		if (att.ab.stun && r() < att.ab.stun) {
			if (turnA) skipB = true;
			else skipA = true;
			stp = true;
		}
		if (crit && att.ab.drink) {
			ls = Math.round(dmg * .3);
			if (turnA) hpA = Math.min(maxA, hpA + ls);
			else hpB = Math.min(maxB, hpB + ls);
		}
		log.push({
			an,
			dn,
			dmg,
			crit,
			fs,
			ex,
			tb,
			ls,
			stp,
			side: turnA ? "A" : "B",
			hpA,
			hpB
		});
	};
	for (let round = 0; round < 26 && hpA > 0 && hpB > 0; round++) {
		strike();
		const att = turnA ? A : B;
		if (hpA > 0 && hpB > 0 && att.ab.dbl && r() < att.ab.dbl) strike();
		let _rA = 0, _rB = 0, _bA = 0, _bB = 0;
		if (hpA > 0 && A.ab.regen) {
			_rA = Math.round(maxA * A.ab.regen * .5);
			hpA = Math.min(maxA, hpA + _rA);
		}
		if (hpB > 0 && B.ab.regen) {
			_rB = Math.round(maxB * B.ab.regen * .5);
			hpB = Math.min(maxB, hpB + _rB);
		}
		if (A.ab.ramp) rampA += A.ab.ramp * .5;
		if (B.ab.ramp) rampB += B.ab.ramp * .5;
		if (A.ab.burn && hpB > 0) {
			_bB = Math.max(1, Math.round(maxB * A.ab.burn * .5));
			hpB = Math.max(0, hpB - _bB);
		}
		if (B.ab.burn && hpA > 0) {
			_bA = Math.max(1, Math.round(maxA * B.ab.burn * .5));
			hpA = Math.max(0, hpA - _bA);
		}
		if (_rA || _rB || _bA || _bB) log.push({
			tick: true,
			rA: _rA,
			rB: _rB,
			bA: _bA,
			bB: _bB,
			hpA,
			hpB
		});
		turnA = !turnA;
	}
	const _fa = hpA / maxA, _fb = hpB / maxB;
	return {
		A,
		B,
		log,
		winner: hpA <= 0 && hpB <= 0 ? null : hpA <= 0 ? "B" : hpB <= 0 ? "A" : _fa > _fb ? "A" : _fa < _fb ? "B" : (hashInt(hashInt(mine.genome.seed >>> 0, 40503, 29163), theirs.genome.seed >>> 0, 34283) >>> 9 & 1) === 0 ? "A" : "B",
		hpA,
		hpB,
		maxA,
		maxB,
		turnA0: _turnA0
	};
}
//#endregion
//#region ../celestial-frontier-anthropic-mac/port/v2/packages/domain/combatcore/src/encounter.ts
const ENCOUNTER_SCHEMA_V1 = "cf-v2-encounter/v1";
const ENCOUNTER_PARTY_MAX_V1 = 3;
const ENCOUNTER_LEG_HALF_TURNS_V1 = 26;
/** A fighter's first drop to this fraction of its max HP opens a Break. */
const ENCOUNTER_LOW_HP_FRACTION_V1 = 1 / 3;
const ENCOUNTER_STANCES_V1 = Object.freeze([
	"balanced",
	"press",
	"guard",
	"evade"
]);
/** Placeholder tuning (S4 owns the numbers): multipliers on the fighter's own ability hooks. */
const ENCOUNTER_STANCE_TUNING_V1 = Object.freeze({
	press: Object.freeze({
		dealt: 1.15,
		taken: 1.1
	}),
	guard: Object.freeze({
		dealt: .9,
		taken: .85,
		openerBlunt: .5
	}),
	evade: Object.freeze({
		dealt: .9,
		dodge: .08
	})
});
/** §20 Guardian phase (N1 §4.3, S7): when a Guardian or Titan first falls to half health it changes to a telegraphed second behavior.
*  The change is announced at a Break BEFORE it applies (Hold / Swap / Withdraw), then lasts for the rest of the fight, across legs.
*  Placeholder numbers (one constant; Codex's S4 instrument owns them): the phased defender hits 20% harder and takes 10% less. */
const ENCOUNTER_GUARDIAN_PHASE_V1 = Object.freeze({
	atFraction: .5,
	dealt: 1.2,
	taken: .9
});
/** Whether a defender of this kind has the phase change (Guardians and Titans only). */
function encounterHasGuardianPhaseV1(kind) {
	return kind === "guardian" || kind === "titan";
}
function stanceStats(stats, stance) {
	if (stance === "balanced") return stats;
	const ab = { ...stats.ab };
	const num = (key, fallback) => typeof ab[key] === "number" ? ab[key] : fallback;
	if (stance === "press") {
		ab.dmg = num("dmg", 1) * ENCOUNTER_STANCE_TUNING_V1.press.dealt;
		ab.taken = num("taken", 1) * ENCOUNTER_STANCE_TUNING_V1.press.taken;
	} else if (stance === "guard") {
		ab.dmg = num("dmg", 1) * ENCOUNTER_STANCE_TUNING_V1.guard.dealt;
		ab.taken = num("taken", 1) * ENCOUNTER_STANCE_TUNING_V1.guard.taken;
	} else if (stance === "evade") {
		ab.dmg = num("dmg", 1) * ENCOUNTER_STANCE_TUNING_V1.evade.dealt;
		ab.dodge = num("dodge", 0) + ENCOUNTER_STANCE_TUNING_V1.evade.dodge;
	} else throw new RangeError(`unknown encounter stance ${String(stance)}`);
	return {
		...stats,
		ab
	};
}
function checkedPlan(plan) {
	if (!plan || !Array.isArray(plan.party) || plan.party.length < 1 || plan.party.length > 3) throw new RangeError(`an encounter party holds 1 to 3 fighters`);
	if (plan.mode !== "auto" && plan.mode !== "command") throw new RangeError("encounter mode must be auto or command");
	for (const fighter of plan.party) {
		if (!ENCOUNTER_STANCES_V1.includes(fighter.stance)) throw new RangeError("encounter fighter stance is invalid");
		if (!Number.isSafeInteger(fighter.genome?.seed)) throw new RangeError("encounter fighter needs an integer genome seed");
	}
	if (!Number.isSafeInteger(plan.defender?.genome?.seed)) throw new RangeError("encounter defender needs an integer genome seed");
}
/** The Auto policy: hold, except the sensible swap — at a fighter's low-HP Break, a waiting teammate comes in when the defender is
*  doing at least as well as the current fighter. Auto never withdraws. */
function autoEncounterDecisionV1(b) {
	if (b.kind === "low-hp" && b.nextIndex !== null && b.options.includes("swap") && b.defenderHp / b.defenderMax >= b.fighterHp / b.fighterMax) return "swap";
	return "hold";
}
/** Resolve an encounter from its sealed plan and the decisions made so far (Command); Auto needs none. */
function runEncounterV1(plan, decisions = []) {
	checkedPlan(plan);
	const defender = plan.defender;
	const B0 = defender.stats || battleStats(defender.genome);
	const maxB = B0.vit * 3;
	const phaseEnabled = defender.phase === true;
	let phaseActive = false;
	const phasedB = () => {
		const ab = { ...B0.ab };
		ab.dmg = (typeof ab.dmg === "number" ? ab.dmg : 1) * ENCOUNTER_GUARDIAN_PHASE_V1.dealt;
		ab.taken = (typeof ab.taken === "number" ? ab.taken : 1) * ENCOUNTER_GUARDIAN_PHASE_V1.taken;
		return {
			...B0,
			ab
		};
	};
	let hpBCarried = maxB;
	const legs = [];
	const breaks = [];
	const fighters = [];
	let decisionIndex = 0, breakOrdinal = 0;
	const lowBreakDone = /* @__PURE__ */ new Set();
	const resolveBreak = (b) => {
		const full = Object.freeze({
			...b,
			ordinal: breakOrdinal++,
			options: Object.freeze([...b.options])
		});
		if (plan.mode === "auto") {
			const decision = autoEncounterDecisionV1(full);
			breaks.push(Object.freeze({
				break: full,
				decision,
				by: "auto"
			}));
			return { decision };
		}
		if (decisionIndex >= decisions.length) return { paused: full };
		const decision = decisions[decisionIndex++];
		if (!full.options.includes(decision)) throw new RangeError(`decision ${decision} is not offered at this Break`);
		breaks.push(Object.freeze({
			break: full,
			decision,
			by: "player"
		}));
		return { decision };
	};
	let outcome = null;
	for (let index = 0; index < plan.party.length && outcome === null; index++) {
		const mine = plan.party[index];
		const nextIndex = index + 1 < plan.party.length ? index + 1 : null;
		const A = stanceStats(mine.stats || battleStats(mine.genome), mine.stance);
		let B = phaseActive ? phasedB() : B0;
		const r = mulberry32(hashInt(mine.genome.seed >>> 0, defender.genome.seed >>> 0, 53473) >>> 0);
		const maxA = A.vit * 3;
		let hpA = mine.startHp === void 0 ? maxA : Math.max(1, Math.min(maxA, Math.round(mine.startHp)));
		let hpB = hpBCarried;
		const hpBStart = hpB;
		let turnA = A.agi > B.agi || A.agi === B.agi && (hashInt(hashInt(mine.genome.seed >>> 0, 40503, 29163), defender.genome.seed >>> 0, 34283) >>> 8 & 1) === 0;
		const turnA0 = turnA;
		let rampA = 0, rampB = 0, firstA = true, firstB = true;
		let shredA = 0, shredB = 0, skipA = false, skipB = false;
		const log = [];
		const an0 = mine.name, dn0 = defender.name;
		const abA = A.ab;
		let abB = B.ab;
		const guardOpener = mine.stance === "guard";
		const strike = () => {
			const att = turnA ? abA : abB, def = turnA ? abB : abA;
			const attS = turnA ? A : B, defS = turnA ? B : A;
			const an = turnA ? an0 : dn0, dn = turnA ? dn0 : an0;
			if (turnA ? skipA : skipB) {
				if (turnA) skipA = false;
				else skipB = false;
				log.push({
					an,
					dn,
					stun: true,
					hpA,
					hpB
				});
				return;
			}
			if (def.dodge && r() < def.dodge) {
				log.push({
					an,
					dn,
					dodge: true,
					hpA,
					hpB
				});
				return;
			}
			const crit = r() < Math.min(.95, attS.ins / 420 + (att.critB || 0));
			const ramp = turnA ? rampA : rampB;
			let fs = false, ex = false, tb = 0, ls = 0, stp = false;
			let dmg = attS.fer * (1 + ramp) * (.8 + r() * .5) - defS.res * .45;
			if (att.dmg) dmg *= att.dmg;
			if (def.taken) dmg *= def.taken;
			if (att.first && (turnA ? firstA : firstB)) {
				const first = !turnA && guardOpener ? 1 + (att.first - 1) * ENCOUNTER_STANCE_TUNING_V1.guard.openerBlunt : att.first;
				dmg *= first;
				fs = true;
			}
			if (att.enrage) {
				const mf = turnA ? 1 - hpA / maxA : 1 - hpB / maxB;
				dmg *= 1 + att.enrage * mf;
			}
			if (att.gambit) dmg *= 1 - att.gambit * .45 + r() * att.gambit * 1.45;
			dmg *= 1 + (turnA ? shredB : shredA);
			if (att.execB && (turnA ? hpB < maxB * .5 : hpA < maxA * .5)) {
				dmg *= 1 + att.execB;
				ex = true;
			}
			dmg = Math.max(2, Math.round(attS.fer * .1), Math.round(dmg));
			if (crit) dmg = Math.round(dmg * 1.7);
			if (def.cap) dmg = Math.min(dmg, Math.max(3, Math.round((turnA ? maxB : maxA) * def.cap)));
			if (turnA) {
				hpB = Math.max(0, hpB - dmg);
				firstA = false;
			} else {
				hpA = Math.max(0, hpA - dmg);
				firstB = false;
			}
			if (att.shred) if (turnA) shredB += att.shred;
			else shredA += att.shred;
			if (def.thorns) {
				tb = Math.max(1, Math.round(dmg * def.thorns));
				if (turnA) hpA = Math.max(0, hpA - tb);
				else hpB = Math.max(0, hpB - tb);
			}
			if (att.stun && r() < att.stun) {
				if (turnA) skipB = true;
				else skipA = true;
				stp = true;
			}
			if (crit && att.drink) {
				ls = Math.round(dmg * .3);
				if (turnA) hpA = Math.min(maxA, hpA + ls);
				else hpB = Math.min(maxB, hpB + ls);
			}
			log.push({
				an,
				dn,
				dmg,
				crit,
				fs,
				ex,
				tb,
				ls,
				stp,
				side: turnA ? "A" : "B",
				hpA,
				hpB
			});
		};
		let end = null;
		let paused = null;
		for (let round = 0; round < 26 && hpA > 0 && hpB > 0; round++) {
			strike();
			const att = turnA ? abA : abB;
			if (hpA > 0 && hpB > 0 && att.dbl && r() < att.dbl) strike();
			let rA = 0, rB = 0, bA = 0, bB = 0;
			if (hpA > 0 && abA.regen) {
				rA = Math.round(maxA * abA.regen * .5);
				hpA = Math.min(maxA, hpA + rA);
			}
			if (hpB > 0 && abB.regen) {
				rB = Math.round(maxB * abB.regen * .5);
				hpB = Math.min(maxB, hpB + rB);
			}
			if (abA.ramp) rampA += abA.ramp * .5;
			if (abB.ramp) rampB += abB.ramp * .5;
			if (abA.burn && hpB > 0) {
				bB = Math.max(1, Math.round(maxB * abA.burn * .5));
				hpB = Math.max(0, hpB - bB);
			}
			if (abB.burn && hpA > 0) {
				bA = Math.max(1, Math.round(maxA * abB.burn * .5));
				hpA = Math.max(0, hpA - bA);
			}
			if (rA || rB || bA || bB) log.push({
				tick: true,
				rA,
				rB,
				bA,
				bB,
				hpA,
				hpB
			});
			turnA = !turnA;
			if (phaseEnabled && !phaseActive && hpA > 0 && hpB > 0 && hpB <= maxB * ENCOUNTER_GUARDIAN_PHASE_V1.atFraction) {
				phaseActive = true;
				const resolved = resolveBreak({
					kind: "phase",
					fighterIndex: index,
					nextIndex,
					fighterHp: hpA,
					fighterMax: maxA,
					defenderHp: hpB,
					defenderMax: maxB,
					options: nextIndex !== null ? [
						"hold",
						"swap",
						"withdraw"
					] : ["hold", "withdraw"]
				});
				if ("paused" in resolved) {
					phaseActive = false;
					paused = resolved.paused;
					break;
				}
				B = phasedB();
				abB = B.ab;
				if (resolved.decision === "swap") {
					end = "swapped";
					break;
				}
				if (resolved.decision === "withdraw") {
					end = "withdrew";
					break;
				}
			}
			if (hpA > 0 && hpB > 0 && !lowBreakDone.has(index) && hpA <= maxA * .3333333333333333) {
				lowBreakDone.add(index);
				const resolved = resolveBreak({
					kind: "low-hp",
					fighterIndex: index,
					nextIndex,
					fighterHp: hpA,
					fighterMax: maxA,
					defenderHp: hpB,
					defenderMax: maxB,
					options: nextIndex !== null ? [
						"hold",
						"swap",
						"withdraw"
					] : ["hold", "withdraw"]
				});
				if ("paused" in resolved) {
					paused = resolved.paused;
					break;
				}
				if (resolved.decision === "swap") {
					end = "swapped";
					break;
				}
				if (resolved.decision === "withdraw") {
					end = "withdrew";
					break;
				}
			}
		}
		const fa = hpA / maxA, fb = hpB / maxB;
		const winner = end !== null || paused !== null ? null : hpA <= 0 && hpB <= 0 ? null : hpA <= 0 ? "B" : hpB <= 0 ? "A" : fa > fb ? "A" : fa < fb ? "B" : (hashInt(hashInt(mine.genome.seed >>> 0, 40503, 29163), defender.genome.seed >>> 0, 34283) >>> 9 & 1) === 0 ? "A" : "B";
		if (end === null && paused === null) end = hpB <= 0 ? "defender-fell" : hpA <= 0 ? "fighter-fell" : "cap";
		legs.push(Object.freeze({
			fighterIndex: index,
			A,
			B,
			log: Object.freeze(log),
			winner,
			hpA,
			hpB,
			maxA,
			maxB,
			turnA0,
			hpBStart,
			end: end ?? "cap"
		}));
		fighters.push(Object.freeze({
			index,
			fought: true,
			hpEnd: hpA,
			max: maxA,
			fell: hpA <= 0,
			swappedOut: end === "swapped"
		}));
		hpBCarried = hpB;
		if (paused !== null) return Object.freeze({
			schema: ENCOUNTER_SCHEMA_V1,
			status: "paused",
			pendingBreak: paused,
			decisionsUsed: decisionIndex,
			breaks: Object.freeze([...breaks]),
			legs: Object.freeze([...legs])
		});
		if (end === "withdrew") {
			outcome = "withdrawn";
			break;
		}
		if (winner === "A") {
			outcome = "party";
			break;
		}
		if (hpA <= 0 && hpB <= 0) {
			outcome = "draw";
			break;
		}
		if (end === "swapped") continue;
		if (nextIndex === null) {
			outcome = "defender";
			break;
		}
		const resolved = resolveBreak({
			kind: "next-fighter",
			fighterIndex: index,
			nextIndex,
			fighterHp: Math.max(0, hpA),
			fighterMax: maxA,
			defenderHp: hpB,
			defenderMax: maxB,
			options: ["hold", "withdraw"]
		});
		if ("paused" in resolved) return Object.freeze({
			schema: ENCOUNTER_SCHEMA_V1,
			status: "paused",
			pendingBreak: resolved.paused,
			decisionsUsed: decisionIndex,
			breaks: Object.freeze([...breaks]),
			legs: Object.freeze([...legs])
		});
		if (resolved.decision === "withdraw") {
			outcome = "withdrawn";
			break;
		}
	}
	if (outcome === null) outcome = "defender";
	for (let index = fighters.length; index < plan.party.length; index++) {
		const f = plan.party[index], max = (f.stats || battleStats(f.genome)).vit * 3;
		fighters.push(Object.freeze({
			index,
			fought: false,
			hpEnd: f.startHp === void 0 ? max : Math.max(1, Math.min(max, Math.round(f.startHp))),
			max,
			fell: false,
			swappedOut: false
		}));
	}
	return Object.freeze({
		schema: ENCOUNTER_SCHEMA_V1,
		status: "finished",
		outcome,
		legs: Object.freeze(legs),
		breaks: Object.freeze(breaks),
		fighters: Object.freeze(fighters),
		defenderHp: hpBCarried,
		defenderMax: maxB,
		decisionsUsed: decisionIndex
	});
}
//#endregion
//#region ../celestial-frontier-anthropic-mac/port/v2/packages/domain/worldidentity/src/authority.ts
const REGISTERED_WORLD_KEYS = /* @__PURE__ */ new WeakMap();
function isRecord$1(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isUint32(value) {
	return Number.isSafeInteger(value) && value >= 0 && value <= 4294967295;
}
function isFiniteCoordinate(value) {
	return typeof value === "number" && Number.isFinite(value) && !Object.is(value, -0);
}
function hasWorldShape(value) {
	if (!isRecord$1(value) || value.format !== "CF1" || typeof value.key !== "string" || value.key.length === 0 || !isRecord$1(value.galaxy) || !isRecord$1(value.star) || !isRecord$1(value.planet)) return false;
	return isUint32(value.galaxy.seed) && isFiniteCoordinate(value.galaxy.x) && isFiniteCoordinate(value.galaxy.y) && isUint32(value.star.seed) && isFiniteCoordinate(value.star.x) && isFiniteCoordinate(value.star.y) && isUint32(value.planet.seed) && Number.isSafeInteger(value.planet.ordinal) && value.planet.ordinal >= 0;
}
/** Public lower-layer check. Exact structural clones have no WeakMap entry. */
function isRegisteredCF1WorldAddress(value) {
	return hasWorldShape(value) && REGISTERED_WORLD_KEYS.get(value) === value.key;
}
/** Package-internal mint used only after Scene re-derives and freezes the
* complete CF1 hierarchy from production generators. */
function registerCF1WorldAddressAuthority(address) {
	if (!hasWorldShape(address) || !Object.isFrozen(address) || !Object.isFrozen(address.galaxy) || !Object.isFrozen(address.star) || !Object.isFrozen(address.planet)) throw new TypeError("CF1 world authority requires one deeply frozen canonical address");
	REGISTERED_WORLD_KEYS.set(address, address.key);
	return address;
}
//#endregion
//#region ../celestial-frontier-anthropic-mac/port/v2/packages/domain/combatcore/src/guardian-prime.ts
const GUARDIAN_PRIME_ENCOUNTER_SCHEMA_V1 = "cf-v2-guardian-prime-encounter/v1";
const PRIME_SIGNATURE_IDS_V1 = Object.freeze([
	"stone",
	"flame",
	"sky",
	"star",
	"ocean",
	"mind",
	"life",
	"void",
	"prism"
]);
function signature(value) {
	return Object.freeze({
		...value,
		eligibleWorldTypes: Object.freeze([...value.eligibleWorldTypes])
	});
}
const PRIME_SIGNATURES_V1 = Object.freeze([
	signature({
		id: "stone",
		element: "Earth",
		tier: 1,
		minimumRegionIndex: 0,
		icon: "⛰️",
		signatureName: "Earth Signature",
		verb: "Conquer",
		guardianName: "Terrakoth, the Mountain’s Fist",
		hint: "a rare world of stone, metal or mineral",
		lore: "Terrakoth stands where the crust runs richest — a titan of living rock. Break it, take the Earth.",
		reach: "the basic elements lie near home — Earth among the first",
		hunt: "rocky, mineral worlds",
		eligibleWorldTypes: ["rocky"],
		titanColorIndex: 13,
		battlefieldWorldField: null
	}),
	signature({
		id: "flame",
		element: "Fire",
		tier: 1,
		minimumRegionIndex: 0,
		icon: "🔥",
		signatureName: "Fire Signature",
		verb: "Conquer",
		guardianName: "Pyraxis, the Ember Tyrant",
		hint: "an extreme volcanic world",
		lore: "Pyraxis coils on a molten shore, breathing furnace-light. Quench it, take the Fire.",
		reach: "near — the molten worlds of the inner rings",
		hunt: "molten worlds",
		eligibleWorldTypes: ["lava"],
		titanColorIndex: 1,
		battlefieldWorldField: "lava"
	}),
	signature({
		id: "sky",
		element: "Air",
		tier: 1,
		minimumRegionIndex: 0,
		icon: "🌬️",
		signatureName: "Air Signature",
		verb: "Conquer",
		guardianName: "Sylphrend, the Gale Sovereign",
		hint: "an aerial or gas-giant ecosystem",
		lore: "Sylphrend rides the cloud decks, never once touching ground. Ground it, take the Air.",
		reach: "near — the gas giants and aerial worlds",
		hunt: "the gas giants",
		eligibleWorldTypes: ["gas"],
		titanColorIndex: 10,
		battlefieldWorldField: "gas"
	}),
	signature({
		id: "star",
		element: "Stellar",
		tier: 1,
		minimumRegionIndex: 0,
		icon: "🌀",
		signatureName: "Stellar Signature",
		verb: "Conquer",
		guardianName: "Zephyrmaw, the Stellar Squall",
		hint: "a world scoured by a dying star’s solar wind",
		lore: "Zephyrmaw is born of stellar wind, a storm given shape near the extreme stars. Still it, take the Star.",
		reach: "near — worlds under the fiercest stars",
		hunt: "wind-scoured desert worlds",
		eligibleWorldTypes: ["desert"],
		titanColorIndex: 3,
		battlefieldWorldField: "gas"
	}),
	signature({
		id: "ocean",
		element: "Water",
		tier: 1,
		minimumRegionIndex: 0,
		icon: "🌊",
		signatureName: "Water Signature",
		verb: "Conquer",
		guardianName: "Abyssleth, the Tide Devout",
		hint: "a living ocean world",
		lore: "Abyssleth swims the breathing seas, older than any shore. Beach it, take the Water.",
		reach: "near — any world with living seas",
		hunt: "living ocean worlds",
		eligibleWorldTypes: ["ocean"],
		titanColorIndex: 8,
		battlefieldWorldField: "ocean"
	}),
	signature({
		id: "mind",
		element: "Electric",
		tier: 2,
		minimumRegionIndex: 1,
		icon: "⚡",
		signatureName: "Electric Signature",
		verb: "Conquer",
		guardianName: "Voltmaw, the Living Current",
		hint: "a world alive with electric, signalling life",
		lore: "Voltmaw answers your scans in a voice of raw current. Earth it, take the Electric.",
		reach: "the middle reach — the Local Cluster and Near Field",
		hunt: "storm-lit ice worlds",
		eligibleWorldTypes: ["ice"],
		titanColorIndex: 4,
		battlefieldWorldField: "ice"
	}),
	signature({
		id: "life",
		element: "Poison",
		tier: 2,
		minimumRegionIndex: 1,
		icon: "☠️",
		signatureName: "Poison Signature",
		verb: "Conquer",
		guardianName: "Venomroyne, the Blight Mother",
		hint: "a virulent, toxic biosphere",
		lore: "Venomroyne festers at the heart of a poisoned canopy, mother to a thousand toxins. End it, take the Poison.",
		reach: "the middle reach — the tainted worlds farther out",
		hunt: "toxic hothouse worlds",
		eligibleWorldTypes: ["venus"],
		titanColorIndex: 0,
		battlefieldWorldField: null
	}),
	signature({
		id: "void",
		element: "Void",
		tier: 3,
		minimumRegionIndex: 2,
		icon: "🕳️",
		signatureName: "Void Signature",
		verb: "Conquer",
		guardianName: "Nullreth, the Devourer",
		hint: "a world at the edge of a black hole or anomaly",
		lore: "Nullreth feeds where light itself is swallowed, out past the Deep Field. Deny it, take the Void.",
		reach: "far out — the dark places beyond the Deep Field",
		hunt: "worlds at a black hole’s edge",
		eligibleWorldTypes: [],
		titanColorIndex: 9,
		battlefieldWorldField: null
	}),
	signature({
		id: "prism",
		element: "Prism",
		tier: 3,
		minimumRegionIndex: 2,
		icon: "🔮",
		signatureName: "Prism Signature",
		verb: "Conquer",
		guardianName: "Iridax, the Spectral Paragon",
		hint: "a unique prismatic world at the trail’s end",
		lore: "Iridax is a color no one has named, waiting at the farthest edge of the sky. Claim it, and the Frontier itself opens.",
		reach: "the farthest reach — the trail’s end",
		hunt: "prismatic worlds at the frontier",
		eligibleWorldTypes: ["terran"],
		titanColorIndex: 16,
		battlefieldWorldField: null
	})
]);
const SIGNATURE_BY_ID = new Map(PRIME_SIGNATURES_V1.map((row) => [row.id, row]));
const WORLD_TYPE_SIGNATURE = /* @__PURE__ */ new Map();
for (const row of PRIME_SIGNATURES_V1) for (const worldType of row.eligibleWorldTypes) WORLD_TYPE_SIGNATURE.set(worldType, row.id);
const GUARDIAN_PRIME_ENCOUNTERS_V1 = /* @__PURE__ */ new WeakSet();
function integer(value, label, maximum = Number.MAX_SAFE_INTEGER) {
	if (!Number.isSafeInteger(value) || value < 0 || value > maximum) throw new TypeError(`${label} must be a non-negative safe integer`);
	return value;
}
function uint32(value, label) {
	return integer(value, label, 4294967295);
}
function checkedWorld(world) {
	if (!isRegisteredCF1WorldAddress(world)) throw new TypeError("Guardian encounter requires a registered canonical CF1 world address");
	return world;
}
function worldTypeOf(descriptor) {
	if (typeof descriptor.worldType !== "string" || descriptor.worldType.length === 0 || descriptor.worldType.length > 64) throw new TypeError("world type must be a non-empty bounded string");
	return descriptor.worldType;
}
function claimedSet(ids) {
	const result = /* @__PURE__ */ new Set();
	for (const id of ids) {
		if (!SIGNATURE_BY_ID.has(id)) throw new TypeError(`unknown Prime Signature id: ${String(id)}`);
		if (result.has(id)) throw new TypeError(`duplicate Prime Signature id: ${id}`);
		result.add(id);
	}
	return result;
}
function cloneData(value) {
	if (value === null || typeof value === "boolean" || typeof value === "string") return value;
	if (typeof value === "number") {
		if (!Number.isFinite(value)) throw new TypeError("Guardian encounter genome contains a non-finite number");
		return Object.is(value, -0) ? 0 : value;
	}
	if (Array.isArray(value)) return value.map(cloneData);
	if (typeof value === "object") {
		const result = {};
		for (const key of Object.keys(value)) {
			const child = value[key];
			if (child !== void 0) result[key] = cloneData(child);
		}
		return result;
	}
	throw new TypeError("Guardian encounter genome contains unsupported data");
}
function deepFreezeData(value) {
	if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
		for (const child of Object.values(value)) deepFreezeData(child);
		Object.freeze(value);
	}
	return value;
}
function cloneGenome(genome) {
	return cloneData(genome);
}
function stripBattlefieldModifiers(genome) {
	const portable = cloneGenome(genome);
	delete portable._mult;
	delete portable._wf;
	return deepFreezeData(portable);
}
function freezeBattleGenome(genome) {
	return deepFreezeData(cloneGenome(genome));
}
function seededTitanPresent(planetSeed, signatureId) {
	const salt = signatureId === "void" ? 93 : signatureId.charCodeAt(0);
	return mulberry32(hashInt(planetSeed >>> 0, 29044, salt) >>> 0)() < .085;
}
function selectedTitanId(planetSeed, worldType, regionIndex, claimed) {
	const available = (id) => {
		const definition = SIGNATURE_BY_ID.get(id);
		return !claimed.has(id) && regionIndex >= definition.minimumRegionIndex && seededTitanPresent(planetSeed, id);
	};
	if (available("void")) return "void";
	const nature = WORLD_TYPE_SIGNATURE.get(worldType) ?? null;
	return nature !== null && available(nature) ? nature : null;
}
/** Exact immutable projection of the lifted legacy `guardianFor` identity. */
function projectOrdinaryGuardianV1(worldSeed) {
	const seed = uint32(worldSeed, "guardian world seed");
	const guardian = guardianFor(seed);
	if (guardian === null) return null;
	return Object.freeze({
		kind: "guardian",
		sourceId: `guardian:${seed}`,
		worldSeed: seed,
		name: guardian.name,
		tier: guardian.tier,
		genome: stripBattlefieldModifiers(guardian.genome)
	});
}
function titanDefender(definition, planetSeed, regionIndex) {
	const heat = definition.id === "flame" ? 2 : definition.id === "mind" || definition.id === "void" ? 0 : 1;
	const battleGenome = makeGenome(hashInt(planetSeed >>> 0, 29044, 153) >>> 0, "fauna", heat);
	battleGenome.size = 5;
	battleGenome.lumin = true;
	battleGenome.wild = 1;
	battleGenome.apex = 14;
	battleGenome._titan = definition.id;
	battleGenome.color = definition.titanColorIndex;
	if (definition.battlefieldWorldField !== null) battleGenome._wf = definition.battlefieldWorldField;
	battleGenome._mult = 1.15 + regionIndex * .03;
	const frozenBattle = freezeBattleGenome(battleGenome);
	const capturable = stripBattlefieldModifiers(battleGenome);
	return Object.freeze({
		kind: "titan",
		sourceId: `titan:${definition.id}:${planetSeed}`,
		name: definition.guardianName,
		tier: 14,
		regionIndex,
		signatureId: definition.id,
		battleGenome: frozenBattle,
		capturableGenome: capturable,
		power: battleStats(frozenBattle).total
	});
}
function guardianDefender(guardian, regionIndex) {
	const battleGenome = cloneGenome(guardian.genome);
	if (regionIndex > 0) battleGenome._mult = 1 + regionIndex * .14;
	const frozenBattle = freezeBattleGenome(battleGenome);
	return Object.freeze({
		kind: "guardian",
		sourceId: guardian.sourceId,
		name: guardian.name,
		tier: guardian.tier,
		regionIndex,
		signatureId: null,
		battleGenome: frozenBattle,
		capturableGenome: stripBattlefieldModifiers(battleGenome),
		power: battleStats(frozenBattle).total
	});
}
function faunaDefender(row, worldType, regionIndex) {
	const battleGenome = cloneGenome(row.genome);
	delete battleGenome._mult;
	delete battleGenome._wf;
	const multiplier = 1 + regionIndex * .14;
	if (multiplier > 1) battleGenome._mult = multiplier;
	if (worldType === "lava" || worldType === "ice" || worldType === "gas" || worldType === "ocean" || worldType === "desert") battleGenome._wf = worldType;
	const frozenBattle = freezeBattleGenome(battleGenome);
	const stats = battleStats(frozenBattle);
	return Object.freeze({
		kind: "fauna",
		sourceId: row.speciesId,
		name: describeSpecies(row.genome).name,
		tier: stats.tier,
		regionIndex,
		signatureId: null,
		battleGenome: frozenBattle,
		capturableGenome: null,
		power: stats.total
	});
}
function selectDefender(input, world, worldType, regionIndex, claimed) {
	if (input.conquered) return null;
	const titanId = selectedTitanId(world.planet.seed, worldType, regionIndex, claimed);
	if (titanId !== null) return titanDefender(SIGNATURE_BY_ID.get(titanId), world.planet.seed, regionIndex);
	const fauna = input.faunaRoster.filter((row) => row.genome.kingdom === "fauna");
	if (fauna.length === 0) return null;
	const guardian = projectOrdinaryGuardianV1(world.planet.seed);
	if (guardian !== null) return guardianDefender(guardian, regionIndex);
	let strongest = fauna[0];
	let strongestPower = battleStats(stripBattlefieldModifiers(strongest.genome)).total;
	for (let index = 1; index < fauna.length; index++) {
		const candidate = fauna[index];
		const power = battleStats(stripBattlefieldModifiers(candidate.genome)).total;
		if (power > strongestPower) {
			strongest = candidate;
			strongestPower = power;
		}
	}
	return faunaDefender(strongest, worldType, regionIndex);
}
function canonicalize(value) {
	if (value === null || typeof value === "boolean" || typeof value === "string") return value;
	if (typeof value === "number") {
		if (!Number.isFinite(value)) throw new TypeError("Guardian encounter witness contains a non-finite number");
		return Object.is(value, -0) ? 0 : value;
	}
	if (Array.isArray(value)) return Object.freeze(value.map(canonicalize));
	if (typeof value === "object") {
		const result = {};
		for (const key of Object.keys(value).sort()) {
			const child = value[key];
			if (child === void 0) continue;
			result[key] = canonicalize(child);
		}
		return Object.freeze(result);
	}
	throw new TypeError("Guardian encounter witness contains unsupported data");
}
function encounterIdentity(world, worldType, regionIndex, claimedSignatureIds, defender) {
	return Object.freeze({
		schema: GUARDIAN_PRIME_ENCOUNTER_SCHEMA_V1,
		world,
		worldType,
		regionIndex,
		claimedSignatureIds,
		conquered: false,
		defenderKind: defender.kind,
		defenderSourceId: defender.sourceId,
		signatureId: defender.signatureId
	});
}
/**
* Select the exact legacy defender and bind its complete semantic identity.
* Returns null when the world is conquered or no eligible Titan/Guardian/fauna
* defender exists. No gameplay RNG is consumed beyond the legacy seed-local
* presence and identity derivations.
*/
function projectGuardianPrimeEncounterV1(input) {
	const world = checkedWorld(input.world);
	const worldType = worldTypeOf(input.descriptor);
	const regionIndex = integer(input.regionIndex, "encounter region index", 5);
	const claimed = claimedSet(input.claimedSignatureIds);
	const claimedSignatureIds = Object.freeze(PRIME_SIGNATURE_IDS_V1.filter((id) => claimed.has(id)));
	const defender = selectDefender(input, world, worldType, regionIndex, claimed);
	if (defender === null) return null;
	const identity = encounterIdentity(world, worldType, regionIndex, claimedSignatureIds, defender);
	const witness = JSON.stringify(canonicalize({
		identity,
		defender: {
			kind: defender.kind,
			sourceId: defender.sourceId,
			name: defender.name,
			tier: defender.tier,
			signatureId: defender.signatureId,
			battleGenome: defender.battleGenome,
			capturableGenome: defender.capturableGenome,
			power: defender.power
		}
	}));
	const encounter = Object.freeze({
		identity,
		defender,
		witness
	});
	GUARDIAN_PRIME_ENCOUNTERS_V1.add(encounter);
	return encounter;
}
Object.freeze({
	supportedMode: "legacy-v1.8.9-conquest-only",
	friendlyDuelProgression: "unsupported-open-active-play-policy",
	partyRolesAndRetreat: "unsupported-open-design-gate",
	guardianAuthoredReward: "unsupported-open-loot-table"
});
/** Recovery after a defeat, in ACTIVE-PLAY milliseconds (placeholder: Codex's S4/economy owns the number; §20). */
const COMBAT_DEFEAT_RECOVERY_ACTIVE_MS_V1 = 6e5;
/** §20: a defeat adds NO wound. A fallen fighter and one swapped out get the same Recovery, so a wound on the fallen alone would make
*  swapping necessary to avoid it (Nick: "I don't want them to feel the swap is necessary"), and v2 has no healing yet (D13). */
const COMBAT_DEFEAT_WOUND_STEP_V1 = 0;
new Set(PRIME_SIGNATURE_IDS_V1);
//#endregion
//#region ../celestial-frontier-anthropic-mac/port/v2/packages/domain/starcatalog/src/index.ts
function starClass(seed) {
	if (seed === 424242) return {
		kind: "G",
		col: "#fff4d8",
		r: 26
	};
	const c = mulberry32(seed ^ 40503)();
	if (c < .08) return {
		kind: "BD",
		col: "#c98a6a",
		r: 9
	};
	if (c < .5) return {
		kind: "M",
		col: "#ff9a6a",
		r: 16
	};
	if (c < .63) return {
		kind: "K",
		col: "#ffd9a0",
		r: 22
	};
	if (c < .76) return {
		kind: "G",
		col: "#fff4d8",
		r: 26
	};
	if (c < .84) return {
		kind: "A",
		col: "#e8efff",
		r: 34
	};
	if (c < .875) return {
		kind: "B",
		col: "#9ab8ff",
		r: 46
	};
	if (c < .9) return {
		kind: "PROTO",
		col: "#ff9a5a",
		r: 18
	};
	if (c < .935) return {
		kind: "RG",
		col: "#ff8a4a",
		r: 62
	};
	if (c < .95) return {
		kind: "SG",
		col: "#ff7a50",
		r: 80
	};
	if (c < .968) return {
		kind: "WD",
		col: "#eef4ff",
		r: 7
	};
	if (c < .982) return {
		kind: "NS",
		col: "#dceaff",
		r: 5
	};
	if (c < .989) return {
		kind: "MAG",
		col: "#cfe0ff",
		r: 5
	};
	return {
		kind: "BH",
		col: "#9a86c8",
		r: 10
	};
}
Object.freeze({
	BD: "a brown dwarf — a failed star too small to ignite",
	M: "a dim red dwarf — the most common kind of star",
	K: "an orange dwarf star",
	G: "a yellow sun-like star",
	A: "a hot white star",
	B: "a brilliant, short-lived blue giant",
	RG: "a dying red giant, swollen to enormous size",
	WD: "a white dwarf — the cooling ember of a dead star",
	NS: "a neutron star — a city-sized stellar corpse sweeping beams of radiation",
	PROTO: "a protostar — a star still being born inside its dusty disk",
	SG: "a red supergiant — a colossal dying star, destined for a supernova",
	MAG: "a magnetar — the most powerfully magnetic object known",
	BH: "a stellar-mass black hole — matter spirals in; nothing escapes"
});
const SOL_PLANETS = Object.freeze([
	{
		name: "Mercury",
		orb: 58,
		P: {
			type: "rocky",
			seed: 131,
			sizeMul: .55,
			ring: false,
			moons: 0
		}
	},
	{
		name: "Venus",
		orb: 84,
		P: {
			type: "venus",
			seed: 132,
			hue: 30,
			sizeMul: .8,
			ring: false,
			moons: 0
		}
	},
	{
		name: "Earth",
		orb: 112,
		P: {
			type: "terran",
			seed: 133,
			seaHue: 210,
			landHue: 115,
			iceAmt: .5,
			sizeMul: .85,
			ring: false,
			moons: 1
		}
	},
	{
		name: "Mars",
		orb: 140,
		P: {
			type: "desert",
			seed: 134,
			hue: 20,
			sizeMul: .65,
			ring: false,
			moons: 2
		}
	},
	{
		name: "Jupiter",
		orb: 192,
		P: {
			type: "gas",
			seed: 135,
			hue: 32,
			spot: true,
			spotHue: 12,
			sizeMul: 2.3,
			ring: false,
			moons: 8
		}
	},
	{
		name: "Saturn",
		orb: 236,
		P: {
			type: "gas",
			seed: 136,
			hue: 44,
			spot: false,
			sizeMul: 2,
			ring: true,
			moons: 7
		}
	},
	{
		name: "Uranus",
		orb: 272,
		P: {
			type: "ice",
			seed: 137,
			sizeMul: 1.3,
			ring: true,
			moons: 4
		}
	},
	{
		name: "Neptune",
		orb: 300,
		P: {
			type: "gas",
			seed: 138,
			hue: 222,
			spot: true,
			spotHue: 230,
			sizeMul: 1.3,
			ring: false,
			moons: 4
		}
	}
]);
//#endregion
//#region ../celestial-frontier-anthropic-mac/port/v2/packages/domain/planetgen/src/planetgen.verbatim.js
function planetParams(seed) {
	const r = mulberry32(seed);
	const roll = r();
	let type;
	if (roll < .3) type = "gas";
	else if (roll < .45) type = "rocky";
	else if (roll < .6) type = "desert";
	else if (roll < .72) type = "ice";
	else if (roll < .82) type = "terran";
	else if (roll < .9) type = "ocean";
	else if (roll < .95) type = "venus";
	else type = "lava";
	const P = {
		type,
		seed,
		ring: r() < .16,
		moons: Math.floor(r() * 3)
	};
	if (type === "gas") {
		const fam = r();
		P.hue = fam < .45 ? 18 + r() * 34 : fam < .75 ? 185 + r() * 40 : fam < .9 ? 295 + r() * 40 : 95 + r() * 40;
		P.spot = r() < .5;
		P.spotHue = (P.hue + (r() < .5 ? -28 : 24) + 360) % 360;
		P.sizeMul = 1.7 + r() * .8;
		P.ring = r() < .35;
	} else {
		P.hue = r() * 360;
		P.sizeMul = .7 + r() * .6;
		P.seaHue = 200 + r() * 30;
		P.landHue = 80 + r() * 60;
		P.iceAmt = r();
	}
	{
		const sz = P.sizeMul || 1;
		let base = Math.max(0, Math.round((sz - .85) * 3.1));
		if (type === "gas") base += 4;
		else if (type === "ice" || type === "ocean" || type === "terran") base += 1;
		P.moons = Math.min(16, base + Math.floor(r() * Math.max(1, Math.round(sz * 2.2))));
	}
	return P;
}
function hsl(h, s, l) {
	s /= 100;
	l /= 100;
	const k = (n) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
	const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
	return [
		Math.round(f(0) * 255),
		Math.round(f(8) * 255),
		Math.round(f(4) * 255)
	];
}
function gasPalette(P) {
	const out = [];
	for (let i = 0; i < 8; i++) {
		const lt = i % 2 === 0 ? 52 + i * 2 % 10 : 76 - i * 3 % 8;
		out.push(hsl(P.hue + (i % 3 - 1) * 9, 46, lt));
	}
	return out;
}
function surfaceColor(P, u, lat, fbm, fx) {
	const t = P.type;
	if (t === "gas") {
		if (!P._pal) P._pal = gasPalette(P);
		const bands = P._pal;
		const turb = (fbm(u * 2.6, lat * 6, 5) - .5) * .32;
		let b = ((lat + 1) / 2 + turb) * (bands.length - 1);
		b = clamp(b, 0, bands.length - 1.001);
		const i = Math.floor(b);
		let c = mix(bands[i], bands[i + 1], b - i);
		const storm = fbm(u * 4 + 80, lat * 8 + 80, 3);
		if (storm > .73 && Math.abs(lat) < .7) c = mix(c, [
			250,
			248,
			240
		], (storm - .73) * 3);
		{
			const vs = hashInt(P.seed >>> 0, 119, 3);
			for (let vi = 0; vi < 2; vi++) {
				const vu = (vs >>> vi * 11 & 255) / 255 * 2.4 - 1.2, vl = (vs >>> vi * 11 + 5 & 127) / 127 * 1.1 - .55;
				const gd3 = Math.hypot((u - vu) / .24, (lat - vl) / .085);
				if (gd3 < 1) {
					const eye = Math.max(0, 1 - gd3 * 2.4);
					c = mix(c, mix([
						30,
						26,
						34
					], [
						252,
						250,
						244
					], eye), (1 - gd3) * .5);
				}
			}
		}
		if (P.spot) {
			const gd = Math.hypot((u - .5) / .4, (lat - .28) / .16);
			if (gd < 1) c = mix(hsl(P.spotHue, 55, 42), c, Math.pow(gd, 1.6));
		}
		return c;
	}
	const e = fbm(u * 1.8 + 10, lat * 1.8 + 5, 6);
	const polar = Math.abs(lat);
	if (t === "terran") {
		const hotB = fx && fx.band === "hot", coldB = fx && (fx.band === "cold" || fx.band === "frozen");
		const vegSat = fx && fx.lush === false ? 16 : 42, vegSat2 = fx && fx.lush === false ? 14 : 40;
		const sm = (v, a, b2) => {
			const x2 = clamp((v - a) / (b2 - a), 0, 1);
			return x2 * x2 * (3 - 2 * x2);
		};
		if (coldB) {
			let c;
			if (e < .44) c = mix([
				176,
				200,
				220
			], [
				214,
				232,
				244
			], e / .44);
			else {
				c = mix([
					206,
					216,
					228
				], mix([
					216,
					226,
					236
				], hsl(P.landHue, 20, 26), .5), sm(e, .44, .56));
				c = mix(c, [
					242,
					246,
					252
				], sm(e, .56, .95));
			}
			return mix(c, [
				240,
				246,
				252
			], Math.min(1, sm(polar, .22, .5) * sm(e, .24, .44) + sm(polar, .55, .82)));
		}
		if (hotB) {
			let c;
			if (e < .3) c = mix([
				40,
				80,
				104
			], [
				96,
				134,
				144
			], e / .3);
			else {
				const dst = mix([
					206,
					168,
					104
				], [
					160,
					122,
					74
				], fbm(u * 3.1 + 50, lat * 3.1 + 9, 4));
				c = mix([
					96,
					134,
					144
				], [
					192,
					174,
					128
				], sm(e, .3, .365));
				c = mix(c, dst, sm(e, .35, .48));
				c = mix(c, [
					226,
					222,
					216
				], sm(e, .72, .95));
			}
			return c;
		}
		let c;
		if (e < .44) {
			c = mix([
				8,
				38,
				92
			], [
				20,
				82,
				150
			], e / .44);
			c = mix(c, [
				52,
				128,
				172
			], sm(e, .38, .44));
		} else {
			const veg = hsl(P.landHue, vegSat, 32);
			let land = mix(hsl(P.landHue, vegSat2, 42), veg, sm(e, .5, .62));
			land = mix(land, [
				118,
				102,
				82
			], sm(e, .6, .74));
			land = mix(land, [
				228,
				228,
				234
			], sm(e, .72, .86));
			const aridT = sm(fbm(u * 2.6 + 50, lat * 2.6 + 9, 4), .5, .64) * (1 - sm(polar, .3, .46));
			if (aridT > 0) land = mix(land, mix([
				196,
				164,
				104
			], [
				168,
				134,
				82
			], fbm(u * 7, lat * 7, 3)), aridT);
			const shN = fbm(u * 5.2 + 31, lat * 5.2 + 13, 3);
			c = mix([
				64,
				150,
				185
			], mix(shN < .4 ? [
				172,
				184,
				122
			] : shN > .72 ? [
				152,
				146,
				128
			] : [
				198,
				182,
				134
			], land, sm(e, .468, .468 + (shN > .72 ? .014 : shN < .4 ? .052 : .067))), sm(e, .44, .492));
		}
		const capN = fbm(u * 3.4 + 77, lat * 3.4 + 21, 3);
		const _capSt = .76 - P.iceAmt * .34 + (capN - .5) * .16;
		const capT = sm(polar, _capSt, Math.min(.98, _capSt + .34));
		const capCol = mix([
			240,
			246,
			252
		], [
			210,
			228,
			242
		], 1 - sm(e, .42, .48));
		return mix(c, capCol, capT);
	}
	if (t === "ocean") {
		const smO = (v, a, b2) => {
			const x2 = clamp((v - a) / (b2 - a), 0, 1);
			return x2 * x2 * (3 - 2 * x2);
		};
		let c;
		if (e < .6) c = mix([
			6,
			30,
			86
		], [
			24,
			96,
			164
		], e / .6);
		else {
			c = mix([
				24,
				96,
				164
			], [
				70,
				160,
				190
			], smO(e, .6, .645));
			c = mix(c, mix([
				190,
				176,
				130
			], hsl(P.landHue, 35, 38), smO(e, .66, .8)), smO(e, .625, .68));
		}
		return mix(c, [
			232,
			242,
			250
		], smO(polar, .8, .93));
	}
	if (t === "ice") {
		const cr = fbm(u * 4 + 7, lat * 4 + 3, 4);
		let c = mix([
			196,
			222,
			236
		], [
			238,
			248,
			252
		], e);
		if (cr > .64) c = mix(c, [
			110,
			160,
			200
		], (cr - .64) * 2.2);
		return c;
	}
	if (t === "desert") {
		let c = mix(hsl(P.hue * .1 + 18, 52, 50), hsl(P.hue * .1 + 14, 48, 32), e);
		const maria = fbm(u * 1.1 + 30, lat * 1.1, 3);
		if (maria > .62) c = mix(c, hsl(14, 40, 20), (maria - .62) * 2.2);
		if (polar > .86) c = [
			240,
			236,
			228
		];
		return c;
	}
	if (t === "venus") {
		const shear = fbm(u * 2.2, lat * 2.2, 3) * 1.6;
		const sw = fbm(u * 1.1 + shear, lat * 4.4, 4);
		const sw2 = fbm(u * 1.7 - shear * .7 + 21, lat * 3.1 + 9, 3);
		let c = mix(hsl(P.hue % 60 + 25, 45, 60), hsl(P.hue % 60 + 38, 55, 82), sw);
		c = mix(c, hsl(P.hue % 60 + 33, 50, 88), Math.max(0, sw2 - .62) * 1.6);
		const vx = fbm(u * .9 + 64, lat * 2.4 + 40, 3);
		if (vx > .74 && Math.abs(lat) < .6) c = mix(c, hsl(P.hue % 60 + 18, 42, 44), (vx - .74) * 2.6);
		return c;
	}
	if (t === "lava") {
		let c = mix([
			26,
			20,
			22
		], [
			64,
			50,
			48
		], e);
		const crack = fbm(u * 3.4 + 60, lat * 3.4 + 2, 5);
		if (crack > .6) c = mix(c, [
			255,
			120,
			30
		], (crack - .6) * 2.6);
		if (crack > .74) c = mix(c, [
			255,
			225,
			140
		], (crack - .74) * 3);
		return c;
	}
	return mix([
		84,
		80,
		76
	], [
		164,
		158,
		150
	], e);
}
//#endregion
//#region ../celestial-frontier-anthropic-mac/port/v2/packages/domain/worldgen/src/worldgen.verbatim.js
function genRocks(r, beltR) {
	const rocks = [];
	for (let i = 0; i < 110; i++) rocks.push({
		a: r() * TAU,
		rr: beltR + (r() - .5) * 10,
		s: .4 + r() * .8,
		sp: .04 + r() * .05
	});
	return rocks;
}
const UNOISE = makeNoise(8181);
const ugCache = /* @__PURE__ */ new Map();
function galaxiesInCell(cx, cy) {
	const key = cx + "_" + cy;
	if (ugCache.has(key)) return ugCache.get(key);
	const r = cellRng(1, cx, cy);
	const web = clamp((UNOISE(cx * .11, cy * .11, 4) - .34) / .42, 0, 1);
	let n = 0;
	if (r() < .05 + web * .85) n = 1;
	if (r() < web * .45) n++;
	if (r() < web * .18) n++;
	const out = [];
	out.web = web;
	for (let i = 0; i < n; i++) {
		const gx = cx * 400 + r() * 400, gy = cy * 400 + r() * 400;
		const g = {
			x: gx,
			y: gy,
			size: 26 + r() * 70,
			sp: Math.floor(r() * GAL_SPRITES.length),
			tilt: .3 + r() * .7,
			rot: r() * TAU,
			seed: hashInt(2, cx * 7 + i, cy * 13 - i)
		};
		out.push(g);
		if (!g.dwarf && r() < .045) {
			const ma = r() * TAU, md = g.size * (1.5 + r() * .6);
			const comp = {
				x: gx + Math.cos(ma) * md,
				y: gy + Math.sin(ma) * md,
				size: g.size * (.45 + r() * .35),
				sp: Math.floor(r() * GAL_SPRITES.length),
				tilt: .35 + r() * .6,
				rot: r() * TAU,
				seed: hashInt(6, cx * 3 + i, cy * 9 + i),
				merging: true
			};
			g.merging = true;
			g.bridge = {
				x2: comp.x,
				y2: comp.y
			};
			out.push(comp);
		}
		if (g.size > 62 && r() < .7) {
			const ns = 1 + (r() < .4 ? 1 : 0);
			for (let k = 0; k < ns; k++) {
				const da = r() * TAU, dd = g.size * (1.3 + r() * .5);
				out.push({
					x: gx + Math.cos(da) * dd,
					y: gy + Math.sin(da) * dd,
					size: 7 + r() * 9,
					sp: Math.floor(r() * GAL_SPRITES.length),
					tilt: .4 + r() * .6,
					rot: r() * TAU,
					seed: hashInt(3, cx * 5 + k, cy * 11 + k),
					dwarf: true
				});
			}
		}
	}
	if (r() < .012 * Math.max(web, .2)) out.push({
		x: cx * 400 + r() * 400,
		y: cy * 400 + r() * 400,
		size: 26 + r() * 16,
		rot: r() * TAU,
		tilt: 1,
		sp: 0,
		seed: hashInt(4, cx, cy),
		quasar: true,
		blazar: r() < .3
	});
	if (r() < .01 * Math.max(web, .2)) out.push({
		x: cx * 400 + r() * 400,
		y: cy * 400 + r() * 400,
		size: 30 + r() * 22,
		rot: r() * TAU,
		tilt: .5 + r() * .4,
		sp: 10,
		seed: hashInt(5, cx, cy),
		radio: true
	});
	if (cx === Math.floor(HOME_POS.x / 400) && cy === Math.floor(HOME_POS.y / 400)) out.push({
		x: HOME_POS.x,
		y: HOME_POS.y,
		size: 78,
		sp: 0,
		tilt: .62,
		rot: .5,
		seed: 999,
		home: true
	});
	if (ugCache.size > 3e3) {
		const k = ugCache.keys().next().value;
		ugCache.delete(k);
	}
	ugCache.set(key, out);
	return out;
}
function galaxyProfile(seed) {
	const r = mulberry32(seed);
	return {
		arms: 2 + (r() < .35 ? 1 : 0),
		wind: .22 + r() * .07,
		hue: [
			215,
			195,
			45,
			355,
			265
		][Math.floor(r() * 5)]
	};
}
const starCache = /* @__PURE__ */ new Map();
const fineCache = /* @__PURE__ */ new Map();
function fineStarsInCell(gseed, prof, fx, fy) {
	const key = gseed + "f" + fx + "_" + fy;
	if (fineCache.has(key)) return fineCache.get(key);
	const r = cellRng(gseed ^ 40236, fx, fy);
	const px = fx * 14 + 14 / 2, py = fy * 14 + 14 / 2;
	const rad = Math.hypot(px, py);
	const out = [];
	if (rad < 1200) {
		const th = Math.atan2(py, px);
		const phase = Math.log(Math.max(rad, 18) / 18) / prof.wind - th;
		const k = prof.arms * phase / TAU;
		const dArm = Math.abs((k % 1 + 1) % 1 - .5);
		const armBoost = Math.exp(-(dArm * dArm) / .022);
		const dens = Math.exp(-rad / 130) * 3.2 + .22 + armBoost * 1.25 * Math.exp(-rad / 850);
		const n = Math.floor(dens * r() * 1.5);
		for (let i = 0; i < n; i++) {
			const sx = fx * 14 + r() * 14, sy = fy * 14 + r() * 14;
			const seed = hashInt(gseed ^ 30634, fx * 131 + i, fy * 57 + i * 5);
			const cd = Math.hypot(sx, sy);
			if (cd < 34) continue;
			if (cd < 85 && (seed >>> 3) % 97 < (85 - cd) * 1.7) continue;
			const sc = starClass(seed);
			out.push({
				x: sx,
				y: sy,
				c: sc.col,
				s: clamp(sc.r / 24, .45, 1.6) * .75,
				seed
			});
		}
	}
	if (fineCache.size > 8e3) {
		const k2 = fineCache.keys().next().value;
		fineCache.delete(k2);
	}
	fineCache.set(key, out);
	return out;
}
function starsInCell(gseed, prof, cx, cy) {
	const key = gseed + "_" + cx + "_" + cy;
	if (starCache.has(key)) return starCache.get(key);
	const r = cellRng(gseed, cx, cy);
	const px = cx * 42 + 42 / 2, py = cy * 42 + 42 / 2;
	const rad = Math.hypot(px, py);
	const stars = [], deco = [];
	if (rad < 1200) {
		const th = Math.atan2(py, px);
		const phase = Math.log(Math.max(rad, 18) / 18) / prof.wind - th;
		const k = prof.arms * phase / TAU;
		const dArm = Math.abs((k % 1 + 1) % 1 - .5);
		const armBoost = Math.exp(-(dArm * dArm) / .022);
		const dens = Math.exp(-rad / 130) * 3.2 + .22 + armBoost * 1.25 * Math.exp(-rad / 850);
		const n = Math.floor(dens * r() * 4.1);
		for (let i = 0; i < n; i++) {
			const sx = cx * 42 + r() * 42, sy = cy * 42 + r() * 42;
			const seed = hashInt(gseed ^ 2748, cx * 31 + i, cy * 17 + i * 3);
			const cd = Math.hypot(sx, sy);
			if (cd < 34) continue;
			if (cd < 85 && (seed >>> 3) % 97 < (85 - cd) * 1.7) continue;
			const sc = starClass(seed);
			stars.push({
				x: sx,
				y: sy,
				c: sc.col,
				s: clamp(sc.r / 24, .55, 2),
				seed
			});
		}
		if (armBoost > .4 && r() < .06) {
			const roll = r(), nx = cx * 42 + r() * 42, ny = cy * 42 + r() * 42;
			if (roll < .4) deco.push({
				k: "h2",
				x: nx,
				y: ny,
				rr: 42 * (.5 + r() * .8),
				hue: 332
			});
			else if (roll < .55) deco.push({
				k: "neb",
				x: nx,
				y: ny,
				rr: 42 * (.4 + r() * .6),
				hue: 202
			});
			else if (roll < .72) deco.push({
				k: "mol",
				x: nx,
				y: ny,
				rr: 42 * (.5 + r() * .7)
			});
			else if (roll < .88) {
				const pts = [];
				for (let i = 0; i < 16; i++) {
					const a = r() * TAU, d = Math.pow(r(), 1.4) * 42 * .3;
					pts.push([
						Math.cos(a) * d,
						Math.sin(a) * d,
						.4 + r() * .5
					]);
				}
				deco.push({
					k: "open",
					x: nx,
					y: ny,
					pts,
					rr: 16.8
				});
			} else deco.push({
				k: "plan",
				x: nx,
				y: ny,
				rr: 42 * (.22 + r() * .2)
			});
		}
		if (r() < .007) deco.push({
			k: "rem",
			x: cx * 42 + r() * 42,
			y: cy * 42 + r() * 42,
			rr: 42 * (.3 + r() * .3)
		});
		if (r() < .02) deco.push({
			k: "rogue",
			x: cx * 42 + r() * 42,
			y: cy * 42 + r() * 42,
			rr: 5
		});
		if (r() < .012) deco.push({
			k: "fbd",
			x: cx * 42 + r() * 42,
			y: cy * 42 + r() * 42,
			rr: 5
		});
	} else if (rad < 2040) {
		if (r() < .035) {
			const gx = cx * 42 + r() * 42, gy = cy * 42 + r() * 42;
			const pts = [];
			for (let i = 0; i < 24; i++) {
				const a = r() * TAU, dd = Math.pow(r(), 1.6) * 42 * .38;
				pts.push([
					Math.cos(a) * dd,
					Math.sin(a) * dd,
					.35 + r() * .5
				]);
			}
			deco.push({
				k: "glob",
				x: gx,
				y: gy,
				pts,
				rr: 17.64
			});
		}
	}
	if (gseed === 999 && cx === Math.floor(SOL_POS.x / 42) && cy === Math.floor(SOL_POS.y / 42)) stars.push({
		x: SOL_POS.x,
		y: SOL_POS.y,
		c: "#fff4d8",
		s: 1.1,
		seed: SOL_SEED,
		sol: true
	});
	const out = {
		stars,
		deco
	};
	if (starCache.size > 4e3) {
		const k = starCache.keys().next().value;
		starCache.delete(k);
	}
	starCache.set(key, out);
	return out;
}
const _sysCache = /* @__PURE__ */ new Map();
function systemFor(starSeed) {
	const hit = _sysCache.get(starSeed);
	if (hit) return hit;
	const sys = _systemFor(starSeed);
	if (_sysCache.size > 240) {
		const k = _sysCache.keys().next().value;
		_sysCache.delete(k);
	}
	_sysCache.set(starSeed, sys);
	return sys;
}
function _systemFor(starSeed) {
	if (starSeed === 424242) {
		const r = mulberry32(5);
		return {
			sol: true,
			kind: "G",
			starCol: "#fff4d8",
			starR: 26,
			planets: SOL_PLANETS,
			belt: {
				r: 166,
				rocks: genRocks(r, 166)
			},
			kuiper: {
				r: 306,
				rocks: genRocks(mulberry32(6), 306)
			},
			dwarfs: [{
				name: "Ceres",
				orb: 166,
				seed: 1001
			}, {
				name: "Pluto",
				orb: 308,
				seed: 1002
			}],
			comets: [{
				aMaj: 150,
				ecc: .82,
				tilt: 1.1,
				period: 45,
				off: 0
			}],
			hz: [92, 140]
		};
	}
	const sc = starClass(starSeed);
	const r = mulberry32(starSeed);
	const sys = {
		kind: sc.kind,
		starCol: sc.col,
		starR: sc.r,
		planets: []
	};
	if ("MKGAB".includes(sc.kind) && r() < .24) {
		sys.binary = {
			sep: sc.r * 2.6 + 26,
			col2: r() < .5 ? "#ff9a6a" : "#ffd9a0",
			r2: sc.r * .55
		};
		if (r() < .22) sys.trinary = {
			sep: sc.r * 2.6 + 26 + 38,
			col2: "#ff9a6a",
			r2: sc.r * .4
		};
	}
	let n, orb;
	if (sc.kind === "BH" || sc.kind === "NS" || sc.kind === "MAG") {
		n = Math.floor(r() * 2);
		orb = 95 + r() * 30;
	} else if (sc.kind === "WD") {
		n = Math.floor(r() * 3);
		orb = 70 + r() * 25;
	} else if (sc.kind === "PROTO") {
		n = 0;
		orb = 60;
		sys.disk = true;
	} else if (sc.kind === "BD") {
		n = Math.floor(r() * 3);
		orb = 36 + r() * 14;
	} else if (sc.kind === "RG" || sc.kind === "SG") {
		n = 1 + Math.floor(r() * 4);
		orb = 125 + r() * 25;
	} else {
		n = Math.floor(r() * 7) + (sc.kind === "M" ? 0 : 1);
		orb = 46 + r() * 30;
	}
	for (let i = 0; i < n; i++) {
		orb += 26 + r() * 32;
		if (orb > 306) break;
		const seed = hashInt(starSeed, i * 101 + 7, i * 53 + 3);
		sys.planets.push({
			name: properName(seed, 2),
			orb,
			P: planetParams(seed)
		});
	}
	if (sys.binary) {
		const inner = sys.planets.length ? sys.planets[0].orb : 90;
		sys.binary.sep = Math.min(sys.binary.sep, Math.max(inner * .42, sc.r * 1.8 + 10));
		if (sys.trinary) sys.trinary.sep = sys.binary.sep + 14 + sc.r * .5;
	}
	if (sys.planets.length > 1 && r() < .4) {
		const idx = Math.floor(r() * (sys.planets.length - 1));
		const beltR = (sys.planets[idx].orb + sys.planets[idx + 1].orb) / 2;
		sys.belt = {
			r: beltR,
			rocks: genRocks(r, beltR)
		};
	}
	if (r() < .55) {
		sys.comets = [];
		const nc = 1 + (r() < .3 ? 1 : 0);
		for (let i = 0; i < nc; i++) sys.comets.push({
			aMaj: 134.4 + r() * 320 * .22,
			ecc: .74 + r() * .18,
			tilt: r() * TAU,
			period: 30 + r() * 50,
			off: r() * 60
		});
	}
	if (r() < .5) sys.kuiper = {
		r: 306,
		rocks: genRocks(r, 306)
	};
	if (sys.planets.length && r() < .45) {
		sys.dwarfs = [];
		const nd = 1 + (r() < .3 ? 1 : 0);
		for (let i = 0; i < nd; i++) {
			const dseed = hashInt(starSeed, 400 + i, 9);
			sys.dwarfs.push({
				name: properName(dseed, 2),
				orb: 320 * (.76 + r() * .18),
				seed: dseed
			});
		}
	}
	if (r() < .16) sys.visitor = {
		ang: r() * TAU,
		off: r() * 400,
		speed: 14 + r() * 10,
		b: (r() - .5) * 320 * .7
	};
	const HZB = {
		BD: 24,
		M: 42,
		K: 72,
		G: 108,
		A: 158,
		B: 225,
		RG: 235,
		SG: 255
	}[sc.kind];
	if (HZB && HZB * .82 < 308) sys.hz = [HZB * .82, Math.min(HZB * 1.32, 314)];
	return sys;
}
//#endregion
//#region ../celestial-frontier-anthropic-mac/port/v2/packages/scene/src/address.ts
const UINT32_MAX = 4294967295;
const CF1_COORDINATE_SCALE = 100;
const CF1_COORDINATE_LIMIT = 1e7;
const PARENT_CELL_RADIUS = 1;
const DEFAULT_SOURCES = {
	galaxiesInCell,
	galaxyProfile,
	starsInCell,
	fineStarsInCell: (galaxySeed, profile, cellX, cellY) => fineStarsInCell(galaxySeed, profile, cellX, cellY),
	systemFor
};
const PROVEN_GALAXIES = /* @__PURE__ */ new WeakSet();
const PROVEN_STARS = /* @__PURE__ */ new WeakSet();
const PROVEN_PLANETS = /* @__PURE__ */ new WeakSet();
const CANONICAL_ADDRESSES = /* @__PURE__ */ new WeakSet();
const GALAXY_KEYS = /* @__PURE__ */ new WeakMap();
const STAR_KEYS = /* @__PURE__ */ new WeakMap();
const PLANET_KEYS = /* @__PURE__ */ new WeakMap();
const STAR_PARENT_KEYS = /* @__PURE__ */ new WeakMap();
const PLANET_PARENT_KEYS = /* @__PURE__ */ new WeakMap();
const ADDRESS_KEYS = /* @__PURE__ */ new WeakMap();
function isObject(value) {
	return typeof value === "object" && value !== null;
}
function isRecord(value) {
	return isObject(value) && !Array.isArray(value);
}
function isProvenGalaxy(value) {
	return isObject(value) && PROVEN_GALAXIES.has(value);
}
function isProvenStar(value) {
	return isObject(value) && PROVEN_STARS.has(value);
}
function isProvenPlanet(value) {
	return isObject(value) && PROVEN_PLANETS.has(value);
}
function getProvenGalaxyKey(value) {
	return isObject(value) ? GALAXY_KEYS.get(value) ?? null : null;
}
function getProvenStarKey(value) {
	return isObject(value) ? STAR_KEYS.get(value) ?? null : null;
}
function getProvenPlanetKey(value) {
	return isObject(value) ? PLANET_KEYS.get(value) ?? null : null;
}
function getCanonicalCF1AddressKey(value) {
	return isObject(value) ? ADDRESS_KEYS.get(value) ?? null : null;
}
/** Parent equality is canonical-key equality, not object identity: a fresh,
independent proof of the same parent is valid, while a structural clone
has no private key and is rejected. */
function isProvenStarFor(star, galaxy) {
	if (!isProvenStar(star) || !isProvenGalaxy(galaxy)) return false;
	const parent = STAR_PARENT_KEYS.get(star);
	const galaxyKey = getProvenGalaxyKey(galaxy);
	return parent !== void 0 && galaxyKey !== null && parent === galaxyKey;
}
function isProvenPlanetFor(planet, star) {
	if (!isProvenPlanet(planet) || !isProvenStar(star)) return false;
	const parent = PLANET_PARENT_KEYS.get(planet);
	const starKeyValue = getProvenStarKey(star);
	return parent !== void 0 && starKeyValue !== null && parent === starKeyValue;
}
function hasCanonicalAddressComposition(value) {
	if (!isRecord(value) || value.format !== "CF1" || !isProvenGalaxy(value.galaxy)) return false;
	const ownKey = value.key;
	if ("planet" in value) return "star" in value && isProvenStarFor(value.star, value.galaxy) && isProvenPlanetFor(value.planet, value.star) && ownKey === getProvenPlanetKey(value.planet);
	if ("star" in value) return isProvenStarFor(value.star, value.galaxy) && ownKey === getProvenStarKey(value.star);
	return ownKey === getProvenGalaxyKey(value.galaxy);
}
function isCanonicalCF1Address(value) {
	return isObject(value) && CANONICAL_ADDRESSES.has(value) && hasCanonicalAddressComposition(value) && ADDRESS_KEYS.get(value) === value.key;
}
/** Exact means no coercion, wrapping, truncation, or legacy defaulting. */
function isExactUint32(value) {
	return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= UINT32_MAX;
}
/** Mirrors legacy CF1 `_r2` before serializing public coordinates.
`-0` is canonicalized to `0` so a key cannot split one location. */
function normalizeCF1Coordinate(value) {
	if (typeof value !== "number" || !Number.isFinite(value) || Math.abs(value) > CF1_COORDINATE_LIMIT) return null;
	const rounded = Math.round(value * CF1_COORDINATE_SCALE) / CF1_COORDINATE_SCALE;
	if (!Number.isFinite(rounded)) return null;
	return Object.is(rounded, -0) ? 0 : rounded;
}
function readPoint(value) {
	if (!isRecord(value)) return null;
	const x = normalizeCF1Coordinate(value.x);
	const y = normalizeCF1Coordinate(value.y);
	if (!isExactUint32(value.seed) || x === null || y === null) return null;
	return {
		seed: value.seed,
		x,
		y
	};
}
function readWorld(value) {
	if (!isRecord(value) || !isExactUint32(value.seed)) return null;
	return { seed: value.seed };
}
/** Presentation fields are read from the generator, never the candidate. */
function readGeneratedGalaxy(value) {
	if (!isRecord(value)) return null;
	const point = readPoint(value);
	if (!point) return null;
	if (typeof value.size !== "number" || !Number.isFinite(value.size) || value.size <= 0 || value.size > 4e3) return null;
	if (typeof value.sp !== "number" || !Number.isInteger(value.sp) || value.sp < 0 || value.sp > 3e5) return null;
	if (typeof value.tilt !== "number" || !Number.isFinite(value.tilt) || value.tilt < -7 || value.tilt > 7) return null;
	if (typeof value.rot !== "number" || !Number.isFinite(value.rot) || value.rot < -7 || value.rot > 7) return null;
	for (const flag of [
		"home",
		"quasar",
		"dwarf"
	]) if (value[flag] !== void 0 && typeof value[flag] !== "boolean") return null;
	return {
		...point,
		size: value.size,
		sp: value.sp,
		tilt: value.tilt,
		rot: value.rot,
		home: value.home === true,
		quasar: value.quasar === true,
		dwarf: value.dwarf === true
	};
}
function readStarAddressCandidate(value) {
	if (!isRecord(value)) return null;
	const galaxy = readPoint(value.galaxy);
	const star = readPoint(value.star);
	return galaxy && star ? {
		galaxy,
		star
	} : null;
}
function readWorldAddressCandidate(value) {
	const parents = readStarAddressCandidate(value);
	if (!parents || !isRecord(value) || !isRecord(value.planet) || !isExactUint32(value.planet.seed)) return null;
	return {
		...parents,
		planetSeed: value.planet.seed
	};
}
function samePoint(left, right) {
	return left.seed === right.seed && left.x === right.x && left.y === right.y;
}
/** Rounded coordinates can cross a source-cell edge; probe immediate
neighbors and demand one provenance match rather than trusting floor(). */
function nearbyCells(x, y, cellSize) {
	const centerX = Math.floor(x / cellSize);
	const centerY = Math.floor(y / cellSize);
	const seen = /* @__PURE__ */ new Set();
	const cells = [];
	for (let dx = -1; dx <= PARENT_CELL_RADIUS; dx++) for (let dy = -1; dy <= PARENT_CELL_RADIUS; dy++) {
		const cellX = centerX + dx;
		const cellY = centerY + dy;
		const key = cellX + "," + cellY;
		if (seen.has(key)) continue;
		seen.add(key);
		cells.push({
			x: cellX,
			y: cellY
		});
	}
	return cells;
}
function failure(reason) {
	return Object.freeze({
		ok: false,
		reason
	});
}
function resolveGalaxyRaw(wanted, sources) {
	const matches = [];
	for (const parentCell of nearbyCells(wanted.x, wanted.y, 400)) {
		let generated;
		try {
			generated = sources.galaxiesInCell(parentCell.x, parentCell.y);
		} catch {
			return failure("source-error");
		}
		if (!Array.isArray(generated)) return failure("source-error");
		for (const generatedGalaxy of generated) {
			const source = readGeneratedGalaxy(generatedGalaxy);
			if (!source) return failure("source-error");
			if (!samePoint(source, wanted)) continue;
			matches.push({
				...source,
				parentCell
			});
		}
	}
	if (matches.length === 0) return failure("galaxy-not-found");
	if (matches.length !== 1) return failure("galaxy-ambiguous");
	return {
		ok: true,
		value: matches[0]
	};
}
function resolveStarRaw(wanted, galaxy, sources) {
	let profile;
	try {
		profile = sources.galaxyProfile(galaxy.seed);
	} catch {
		return failure("source-error");
	}
	if (!isRecord(profile)) return failure("source-error");
	const matches = [];
	for (const { layer, cellSize } of [{
		layer: "coarse",
		cellSize: 42
	}, {
		layer: "fine",
		cellSize: 14
	}]) for (const parentCell of nearbyCells(wanted.x, wanted.y, cellSize)) {
		let generated;
		try {
			if (layer === "coarse") {
				const cell = sources.starsInCell(galaxy.seed, profile, parentCell.x, parentCell.y);
				if (!isRecord(cell) || !Array.isArray(cell.stars)) return failure("source-error");
				generated = cell.stars;
			} else {
				generated = sources.fineStarsInCell(galaxy.seed, profile, parentCell.x, parentCell.y);
				if (!Array.isArray(generated)) return failure("source-error");
			}
		} catch {
			return failure("source-error");
		}
		for (const generatedStar of generated) {
			const source = readPoint(generatedStar);
			if (!source) return failure("source-error");
			if (samePoint(source, wanted)) matches.push({
				...source,
				layer,
				parentCell
			});
		}
	}
	if (matches.length === 0) return failure("star-not-found");
	if (matches.length !== 1) return failure("star-ambiguous");
	return {
		ok: true,
		value: matches[0]
	};
}
function resolvePlanetRaw(wantedSeed, star, sources) {
	let system;
	try {
		system = sources.systemFor(star.seed);
	} catch {
		return failure("source-error");
	}
	if (!isRecord(system) || !Array.isArray(system.planets)) return failure("source-error");
	const matches = [];
	for (let ordinal = 0; ordinal < system.planets.length; ordinal++) {
		const entry = system.planets[ordinal];
		if (!isRecord(entry) || !isRecord(entry.P) || !isExactUint32(entry.P.seed)) return failure("source-error");
		if (entry.P.seed === wantedSeed) matches.push({
			seed: entry.P.seed,
			ordinal
		});
	}
	if (matches.length === 0) return failure("planet-not-found");
	if (matches.length !== 1) return failure("planet-ambiguous");
	return {
		ok: true,
		value: matches[0]
	};
}
function keyNumber(value) {
	return value === 0 ? "0" : String(value);
}
function galaxyKey(galaxy) {
	return "CF1|g:" + galaxy.seed + "@" + keyNumber(galaxy.x) + "," + keyNumber(galaxy.y);
}
function starKey(parent, star) {
	return parent + "|s:" + star.seed + "@" + keyNumber(star.x) + "," + keyNumber(star.y);
}
function worldKey(parent, planet) {
	return parent + "|p:" + planet.seed + "#" + planet.ordinal;
}
const KEY_UINT = "(0|[1-9]\\d*)";
const KEY_COORD = "(-?(?:0|[1-9]\\d*)(?:\\.\\d{1,2})?)";
new RegExp(`^CF1\\|g:${KEY_UINT}@${KEY_COORD},${KEY_COORD}\\|s:${KEY_UINT}@${KEY_COORD},${KEY_COORD}\\|p:${KEY_UINT}#${KEY_UINT}$`);
function freezeCell(cell) {
	return Object.freeze({
		x: cell.x,
		y: cell.y
	});
}
function freezeGalaxyData(galaxy) {
	return Object.freeze({
		seed: galaxy.seed,
		x: galaxy.x,
		y: galaxy.y,
		size: galaxy.size,
		sp: galaxy.sp,
		tilt: galaxy.tilt,
		rot: galaxy.rot,
		home: galaxy.home,
		quasar: galaxy.quasar,
		dwarf: galaxy.dwarf,
		parentCell: freezeCell(galaxy.parentCell)
	});
}
function freezeStarData(star) {
	return Object.freeze({
		seed: star.seed,
		x: star.x,
		y: star.y,
		layer: star.layer,
		parentCell: freezeCell(star.parentCell)
	});
}
function freezePlanetData(planet) {
	return Object.freeze({
		seed: planet.seed,
		ordinal: planet.ordinal
	});
}
function mintGalaxy(galaxy) {
	const proven = freezeGalaxyData(galaxy);
	PROVEN_GALAXIES.add(proven);
	GALAXY_KEYS.set(proven, galaxyKey(galaxy));
	return proven;
}
function mintStar(galaxy, star) {
	const parent = getProvenGalaxyKey(galaxy);
	if (!parent) throw new Error("internal CF1 provenance error: missing galaxy key");
	const proven = freezeStarData(star);
	PROVEN_STARS.add(proven);
	STAR_KEYS.set(proven, starKey(parent, star));
	STAR_PARENT_KEYS.set(proven, parent);
	return proven;
}
function mintPlanet(star, planet) {
	const parent = getProvenStarKey(star);
	if (!parent) throw new Error("internal CF1 provenance error: missing star key");
	const proven = freezePlanetData(planet);
	PROVEN_PLANETS.add(proven);
	PLANET_KEYS.set(proven, worldKey(parent, planet));
	PLANET_PARENT_KEYS.set(proven, parent);
	return proven;
}
function registerAddress(address) {
	const frozen = Object.freeze(address);
	if (!hasCanonicalAddressComposition(frozen)) throw new Error("internal CF1 provenance error: invalid address composition");
	CANONICAL_ADDRESSES.add(frozen);
	ADDRESS_KEYS.set(frozen, frozen.key);
	if ("planet" in frozen) registerCF1WorldAddressAuthority(frozen);
	return frozen;
}
function starAddress(galaxy, star) {
	const key = getProvenStarKey(star);
	if (!key) throw new Error("internal CF1 provenance error: missing star key");
	return registerAddress({
		format: "CF1",
		galaxy,
		star,
		key
	});
}
function worldAddress(galaxy, star, planet) {
	const key = getProvenPlanetKey(planet);
	if (!key) throw new Error("internal CF1 provenance error: missing planet key");
	return registerAddress({
		format: "CF1",
		galaxy,
		star,
		planet,
		key
	});
}
/** Resolve one public galaxy candidate against production generators. */
function resolveCF1Galaxy(candidate) {
	const wanted = readPoint(candidate);
	if (!wanted) return failure("malformed-address");
	const resolved = resolveGalaxyRaw(wanted, DEFAULT_SOURCES);
	return resolved.ok ? {
		ok: true,
		galaxy: mintGalaxy(resolved.value)
	} : resolved;
}
/** Resolve a star only beneath a runtime-proven galaxy. */
function resolveCF1Star(galaxy, candidate) {
	if (!isProvenGalaxy(galaxy)) return failure("unproven-parent");
	const wanted = readPoint(candidate);
	if (!wanted) return failure("malformed-address");
	const resolved = resolveStarRaw(wanted, galaxy, DEFAULT_SOURCES);
	return resolved.ok ? {
		ok: true,
		star: mintStar(galaxy, resolved.value)
	} : resolved;
}
/** Resolve a planet/world only beneath a runtime-proven star. */
function resolveCF1World(star, candidate) {
	if (!isProvenStar(star)) return failure("unproven-parent");
	const wanted = readWorld(candidate);
	if (!wanted) return failure("malformed-address");
	const resolved = resolvePlanetRaw(wanted.seed, star, DEFAULT_SOURCES);
	return resolved.ok ? {
		ok: true,
		planet: mintPlanet(star, resolved.value)
	} : resolved;
}
/** Resolve a raw galaxy -> star hierarchy and return a trusted address. */
function resolveCF1StarAddress(candidate) {
	const wanted = readStarAddressCandidate(candidate);
	if (!wanted) return failure("malformed-address");
	const galaxy = resolveCF1Galaxy(wanted.galaxy);
	if (!galaxy.ok) return galaxy;
	const star = resolveCF1Star(galaxy.galaxy, wanted.star);
	return star.ok ? {
		ok: true,
		address: starAddress(galaxy.galaxy, star.star)
	} : star;
}
/** Resolve a raw galaxy -> star -> planet hierarchy. The successful property
layout is compatible with the existing planet-Search consumer. */
function resolveCF1WorldAddress(candidate) {
	const wanted = readWorldAddressCandidate(candidate);
	if (!wanted) return failure("malformed-address");
	const galaxy = resolveCF1Galaxy(wanted.galaxy);
	if (!galaxy.ok) return galaxy;
	const star = resolveCF1Star(galaxy.galaxy, wanted.star);
	if (!star.ok) return star;
	const planet = resolveCF1World(star.star, { seed: wanted.planetSeed });
	return planet.ok ? {
		ok: true,
		address: worldAddress(galaxy.galaxy, star.star, planet.planet)
	} : planet;
}
//#endregion
//#region ../celestial-frontier-anthropic-mac/port/v2/packages/scene/src/zoommode.ts
const PROVEN_NAV_STATES = /* @__PURE__ */ new WeakSet();
function registerNav(value) {
	const frozen = Object.freeze(value);
	PROVEN_NAV_STATES.add(frozen);
	return frozen;
}
registerNav({
	mode: "universe",
	gal: null,
	star: null,
	planet: null
});
Math.floor(GR * 1.7 / 42) + 1;
Object.freeze({
	id: "resolve",
	n: "Frontier Resolve",
	d: "Hardened by the void — recovers each round and shrugs off blows",
	regen: .04,
	taken: .9
});
//#endregion
//#region ../celestial-frontier-anthropic-mac/port/v2/packages/scene/src/charter.ts
function freezeAscChapter(chapter) {
	const goals = Object.freeze(chapter.goals.map((goal) => Object.freeze({ ...goal })));
	return Object.freeze({
		...chapter,
		goals
	});
}
function freezeAscChapters(chapters) {
	return Object.freeze(chapters.map(freezeAscChapter));
}
freezeAscChapters([
	{
		id: "ch1",
		name: "Chapter 1 — Off the Rock",
		intro: "Sol is yours to learn — the rest of the sky is charts and longing. Mine the dead worlds, feed the Fabricator, and build the Jump Drive.",
		goals: [
			{
				id: "c1-land",
				ev: "landfall",
				scope: "sol",
				n: 2,
				t: "Make planetfall on 2 worlds of Sol"
			},
			{
				id: "c1-mine",
				ev: "mined",
				n: 8,
				t: "Mine Sol’s dead worlds 8 times"
			},
			{
				id: "c1-part",
				ev: "crafted",
				n: 4,
				t: "Fabricate 4 basic parts"
			},
			{
				id: "c1-comp",
				ev: "crafted",
				n: 2,
				t: "Assemble 2 components"
			},
			{
				id: "c1-jump",
				ev: "crafted",
				n: 1,
				t: "Build the ⚡ Jump Drive"
			}
		],
		unlockNote: "Interstellar travel is yours — the Neighborhood’s stars are open."
	},
	{
		id: "ch2",
		name: "Chapter 2 — The Neighborhood",
		intro: "The nearby stars answer. Hunt life, plant a flag, and build the Long-Range Array to chart the whole galaxy.",
		goals: [
			{
				id: "c2-land",
				ev: "landfall",
				scope: "nonsol",
				n: 3,
				t: "Land on 3 worlds beyond Sol"
			},
			{
				id: "c2-scan",
				ev: "bioscan",
				n: 2,
				t: "Discover life on 2 alien worlds"
			},
			{
				id: "c2-conq",
				ev: "conquest",
				n: 1,
				t: "Conquer a world"
			},
			{
				id: "c2-array",
				ev: "crafted",
				n: 1,
				t: "Build the 📡 Long-Range Array"
			}
		],
		unlockNote: "The whole home galaxy answers your charts."
	},
	{
		id: "ch3",
		name: "Chapter 3 — Beyond the Rim",
		intro: "One galaxy is a grain of sand. Master the trades, gear up, and build the drive that crosses the dark.",
		goals: [
			{
				id: "c3-breed",
				ev: "bred",
				n: 1,
				t: "Breed a hybrid bloodline"
			},
			{
				id: "c3-gear",
				ev: "crafted",
				n: 2,
				t: "Craft 2 pieces of explorer gear"
			},
			{
				id: "c3-mine",
				ev: "mined",
				n: 20,
				t: "Mine 20 more times"
			},
			{
				id: "c3-ig",
				ev: "crafted",
				n: 1,
				t: "Build the 🌌 Intergalactic Drive"
			}
		],
		unlockNote: "The dark between galaxies is yours to cross — from here the Prime Codex Signatures extend the frontier, ring by ring."
	}
]);
Object.freeze({
	ch1: Object.freeze({ intro: "Learn Sol: make planetfall, mine its dead worlds, and fabricate the Jump Drive." }),
	ch2: Object.freeze({ intro: "Explore beyond Sol, discover life, conquer a world, and build the Long-Range Array." }),
	ch3: Object.freeze({ intro: "Breed a hybrid bloodline, mine, gear up, and build the Intergalactic Drive." })
});
//#endregion
//#region ../celestial-frontier-anthropic-mac/port/v2/packages/domain/descriptors/src/apphooks.verbatim.js
const CARD_FACTS = /* @__PURE__ */ new Map();
function _cardFactsSet$1(seed, v) {
	if (CARD_FACTS.size > 6e3) CARD_FACTS.delete(CARD_FACTS.keys().next().value);
	CARD_FACTS.set(seed, v);
}
const _EARTH_NAMES$1 = {
	fauna: [
		"Jaguar",
		"Leopard",
		"Tiger",
		"Clouded Leopard",
		"Ocelot",
		"Tapir",
		"Forest Elephant",
		"Gorilla",
		"Chimpanzee",
		"Orangutan",
		"Wild Boar",
		"Peccary",
		"Okapi",
		"Sloth",
		"Giant Anteater",
		"Capuchin",
		"Howler Monkey",
		"Spider Monkey",
		"Tamarin",
		"Kinkajou",
		"Coati",
		"Civet",
		"Pangolin",
		"Fruit Bat",
		"Macaw",
		"Parrot",
		"Toucan",
		"Hornbill",
		"Hummingbird",
		"Kingfisher",
		"Eagle",
		"Owl",
		"Anaconda",
		"Boa",
		"Python",
		"Caiman",
		"Crocodile",
		"Tree Frog",
		"Poison Dart Frog",
		"Leafcutter Ant",
		"Butterfly",
		"Tarantula",
		"Elephant",
		"Rhinoceros",
		"Gaur",
		"Banteng",
		"Water Buffalo",
		"Deer",
		"Antelope",
		"Sloth Bear",
		"Macaque",
		"Langur",
		"Mongoose",
		"Jackal",
		"Porcupine",
		"Squirrel",
		"Peacock",
		"Cobra",
		"Monitor Lizard",
		"Pond Turtle",
		"Bullfrog",
		"Termite",
		"Cicada",
		"Mantis",
		"Lion",
		"Giraffe",
		"Zebra",
		"Kudu",
		"Impala",
		"Warthog",
		"Buffalo",
		"Hyena",
		"Baboon",
		"Meerkat",
		"Caracal",
		"Vulture",
		"Guineafowl",
		"Viper",
		"Tortoise",
		"Locust",
		"Dung Beetle",
		"Scorpion",
		"Spectacled Bear",
		"Mountain Tapir",
		"Cougar",
		"Possum",
		"Tanager",
		"Tree Snake",
		"Anole",
		"Glass Frog",
		"Salamander",
		"Orchid Bee",
		"Land Snail",
		"Panda",
		"Red Panda",
		"Asian Elephant",
		"Takin",
		"Pika",
		"Pheasant",
		"Woodpecker",
		"Rat Snake",
		"Gecko",
		"Skink",
		"Black Bear",
		"Brown Bear",
		"Wolf",
		"Coyote",
		"Bobcat",
		"Lynx",
		"Elk",
		"Fox",
		"Raccoon",
		"Badger",
		"Weasel",
		"Stoat",
		"Mink",
		"Marten",
		"Flying Squirrel",
		"Chipmunk",
		"Rabbit",
		"Hare",
		"Mouse",
		"Vole",
		"Mole",
		"Shrew",
		"Hedgehog",
		"Hawk",
		"Crow",
		"Raven",
		"Robin",
		"Cardinal",
		"Turkey",
		"Garter Snake",
		"Box Turtle",
		"Newt",
		"Frog",
		"Deer Tick",
		"Bee",
		"Earthworm",
		"Fisher",
		"River Otter",
		"Beaver",
		"Heron",
		"Alligator Lizard",
		"Giant Salamander",
		"Salmon",
		"Trout",
		"Char",
		"Lamprey",
		"Crayfish",
		"Banana Slug",
		"Beetle",
		"Wolverine",
		"Moose",
		"Reindeer",
		"Caribou",
		"Red Fox",
		"Arctic Fox",
		"Snowshoe Hare",
		"Lemming",
		"Grouse",
		"Ptarmigan",
		"Goose",
		"Duck",
		"Wood Frog",
		"Pike",
		"Mosquito",
		"Black Fly",
		"Snow Leopard",
		"Mountain Goat",
		"Ibex",
		"Chamois",
		"Marmot",
		"Falcon",
		"Chough",
		"Mountain Lizard",
		"Otter",
		"Capybara",
		"Fishing Cat",
		"Egret",
		"Ibis",
		"Stork",
		"Alligator",
		"Cottonmouth",
		"Water Snake",
		"Snapping Turtle",
		"Softshell Turtle",
		"Catfish",
		"Gar",
		"Bowfin",
		"Bass",
		"Eel",
		"Dragonfly",
		"Leech",
		"Cheetah",
		"Spotted Hyena",
		"African Wild Dog",
		"African Elephant",
		"Wildebeest",
		"Hippopotamus",
		"Eland",
		"Gazelle",
		"Hartebeest",
		"Oryx",
		"Serval",
		"Aardvark",
		"Ostrich",
		"Secretary Bird",
		"Mamba",
		"Crane",
		"Spoonbill",
		"Flamingo",
		"Turtle",
		"Carp",
		"Tilapia",
		"Piranha",
		"Bison",
		"Prairie Dog",
		"Jackrabbit",
		"Ground Squirrel",
		"Gopher",
		"Lark",
		"Rattlesnake",
		"Horned Lizard",
		"Grasshopper",
		"Cricket",
		"Ant",
		"Spider",
		"Saiga",
		"Wild Horse",
		"Wild Ass",
		"Camel",
		"Yak",
		"Jerboa",
		"Hamster",
		"Bustard",
		"Sandgrouse",
		"Racer",
		"Agama",
		"Maned Wolf",
		"Pampas Fox",
		"Armadillo",
		"Mara",
		"Agouti",
		"Guinea Pig",
		"Rhea",
		"Seriema",
		"Tegu",
		"Cattle",
		"Sheep",
		"Goat",
		"Sparrow",
		"Finch",
		"Swallow",
		"Quail",
		"Honeybee",
		"Bumblebee",
		"Ladybug",
		"Mountain Viper",
		"Alpine Salamander",
		"Magpie",
		"Jay",
		"Partridge",
		"Dove",
		"Whip Snake",
		"Wall Lizard",
		"Wild Pony",
		"Curlew",
		"Snipe",
		"Grass Snake",
		"Lizard",
		"Toad",
		"Whiptail",
		"Dromedary Camel",
		"Fennec Fox",
		"Sand Cat",
		"Striped Hyena",
		"Gerbil",
		"Roadrunner",
		"Sand Boa",
		"Camel Spider",
		"Wild Sheep",
		"Hyrax",
		"Centipede",
		"Bactrian Camel",
		"Gull",
		"Plover",
		"Sandpiper",
		"Brine Shrimp",
		"Water Flea",
		"Wildcat",
		"Bat",
		"Pigeon",
		"Killifish",
		"Freshwater Snail",
		"King Snake",
		"Polar Bear",
		"Musk Ox",
		"Arctic Hare",
		"Snowy Owl",
		"Swan",
		"Walrus",
		"Seal",
		"Beluga",
		"Narwhal",
		"Orca",
		"Right Whale",
		"Tern",
		"Auk",
		"Puffin",
		"Guillemot",
		"Eider Duck",
		"Arctic Cod",
		"Herring",
		"Krill",
		"Copepod",
		"Amphipod",
		"Jellyfish",
		"Fur Seal",
		"Blue Whale",
		"Humpback Whale",
		"Penguin",
		"Albatross",
		"Petrel",
		"Skua",
		"Squid",
		"Octopus",
		"Starfish",
		"Sea Urchin",
		"Sea Cucumber",
		"Cold-Water Fish",
		"Monkey",
		"Condor",
		"Bear",
		"Swift",
		"Cave Snake",
		"Olm",
		"Blind Fish",
		"Cave Shrimp",
		"Millipede",
		"Snake",
		"Wild Pig",
		"Small Fish",
		"Water Beetle",
		"Fly Larvae",
		"Grayling",
		"Minnow",
		"Sculpin",
		"Caddisfly",
		"Mayfly",
		"Stonefly",
		"Gharial",
		"Sturgeon",
		"Paddlefish",
		"Perch",
		"Pacu",
		"Arapaima",
		"Arowana",
		"Freshwater Shrimp",
		"Mussel",
		"Giant Otter",
		"Electric Eel",
		"Stingray",
		"Cichlid",
		"Tetra",
		"Caecilian",
		"River Dolphin",
		"Manatee",
		"Loon",
		"Grebe",
		"Cormorant",
		"Pelican",
		"Osprey",
		"Sunfish",
		"Walleye",
		"Whitefish",
		"Lungfish",
		"Tigerfish",
		"Freshwater Crab",
		"Coot",
		"Moorhen",
		"Goldfish",
		"Damselfly",
		"Water Strider",
		"Diving Beetle",
		"Water Snail",
		"Water Vole",
		"Rail",
		"Bittern",
		"Giant Water Bug",
		"Sea Turtle",
		"Mullet",
		"Tarpon",
		"Snapper",
		"Juvenile Shark",
		"Ray",
		"Crab",
		"Shrimp",
		"Oyster",
		"Cave Fish",
		"Sea Lion",
		"Oystercatcher",
		"Coastal Lizard",
		"Hermit Crab",
		"Clam",
		"Razor Clam",
		"Sea Snail",
		"Sand Dollar",
		"Sea Otter",
		"Goby",
		"Blenny",
		"Limpet",
		"Chiton",
		"Barnacle",
		"Sea Anemone",
		"Sponge",
		"Nudibranch",
		"Dolphin",
		"Flounder",
		"Prawn",
		"Marine Worm",
		"Marsh Rodent",
		"Godwit",
		"Avocet",
		"Mudskipper",
		"Fiddler Crab",
		"Snail",
		"Grouper",
		"Mud Crab",
		"Dugong",
		"Bonefish",
		"Barracuda",
		"Reef Fish",
		"Shark",
		"Lobster",
		"Porpoise",
		"Gannet",
		"Cod",
		"Mackerel",
		"Halibut",
		"Cold-Water Coral",
		"Reef Shark",
		"Hammerhead Shark",
		"Manta Ray",
		"Eagle Ray",
		"Clownfish",
		"Damselfish",
		"Butterflyfish",
		"Angelfish",
		"Surgeonfish",
		"Tang",
		"Triggerfish",
		"Parrotfish",
		"Wrasse",
		"Cardinalfish",
		"Lionfish",
		"Pufferfish",
		"Boxfish",
		"Seahorse",
		"Moray Eel",
		"Cuttlefish",
		"Giant Clam",
		"Cowrie",
		"Brittle Star",
		"Coral",
		"Pipefish",
		"Rabbitfish",
		"Conch",
		"Sea Bass",
		"Giant Octopus",
		"Abalone",
		"Gray Whale",
		"Tuna",
		"Haddock",
		"Pollock",
		"Scallop",
		"Sperm Whale",
		"Pilot Whale",
		"Beaked Whale",
		"Great White Shark",
		"Tiger Shark",
		"Mako Shark",
		"Whale Shark",
		"Basking Shark",
		"Marlin",
		"Sailfish",
		"Swordfish",
		"Mahi-Mahi",
		"Wahoo",
		"Sardine",
		"Anchovy",
		"Flying Fish",
		"Giant Squid",
		"Portuguese Man-of-War",
		"Frigatebird",
		"Anglerfish",
		"Lanternfish",
		"Viperfish",
		"Fangtooth",
		"Dragonfish",
		"Oarfish",
		"Barreleye",
		"Blobfish",
		"Gulper Eel",
		"Vampire Squid",
		"Deep-Sea Octopus",
		"Comb Jelly",
		"Giant Isopod",
		"Tube Worm",
		"Tripod Fish",
		"Snailfish",
		"Isopod",
		"Polychaete Worm",
		"Giant Tube Worm",
		"Vent Shrimp",
		"Vent Crab",
		"Scale Worm",
		"Deep-Sea Fish",
		"Whale",
		"Monkfish",
		"Deep-Water Coral",
		"Rat",
		"Cat",
		"Seabird",
		"Iguana",
		"Marine Iguana",
		"Land Iguana",
		"Coconut Crab",
		"Booby",
		"Tropicbird",
		"Blind Salamander",
		"Cave Cricket",
		"Harvestman",
		"Pseudoscorpion",
		"Cockroach",
		"Flatworm",
		"Insect-Eating Bat",
		"Cave Frog",
		"Giant Centipede",
		"Snow Petrel",
		"Mite",
		"Ice Worm",
		"Cow",
		"Bull",
		"Horse",
		"Donkey",
		"Pig",
		"Chicken",
		"Rooster",
		"Kestrel",
		"Starling",
		"Llama",
		"Alpaca",
		"Moth",
		"Wasp",
		"Aphid",
		"Dog",
		"Fly",
		"Carrion Beetle",
		"Cold-Adapted Insect",
		"Desert Owl",
		"Vine Snake",
		"Stick Insect",
		"Kangaroo",
		"Koala",
		"Platypus",
		"Echidna",
		"Wombat",
		"Tasmanian Devil",
		"Wallaby",
		"Sugar Glider",
		"Quoll",
		"Komodo Dragon",
		"Chameleon",
		"Gila Monster",
		"Axolotl",
		"Frilled Lizard",
		"Lemur",
		"Gibbon",
		"Mandrill",
		"Marmoset",
		"Aye-Aye",
		"Proboscis Monkey",
		"Tree Shrew",
		"Colugo",
		"Emu",
		"Cassowary",
		"Kiwi",
		"Kakapo",
		"Sun Bear",
		"Dingo",
		"Cockatoo",
		"Firefly",
		"Vampire Bat",
		"Grizzly Bear",
		"Coelacanth",
		"Nautilus",
		"Tardigrade",
		"Horseshoe Crab",
		"Pronghorn",
		"Springbok",
		"Bongo",
		"Duiker",
		"Gerenuk",
		"Nilgai",
		"Tahr",
		"Serow",
		"Harpy Eagle",
		"Kookaburra",
		"Hoatzin",
		"Quetzal",
		"Weaverbird",
		"Screamer",
		"Ocean Sunfish",
		"Remora",
		"Archerfish",
		"Knifefish",
		"Icefish",
		"Mudminnow",
		"Flying Gurnard",
		"Sea Squirt",
		"Salp",
		"Pyrosome",
		"Lancelet",
		"Sea Spider",
		"Fairy Shrimp",
		"Tadpole Shrimp",
		"Springtail",
		"Dobsonfly",
		"Scorpionfly",
		"Thrips"
	],
	flora: [
		"Banana",
		"Plantain",
		"Papaya",
		"Mango",
		"Guava",
		"Avocado",
		"Cacao",
		"Coffee",
		"Vanilla Orchid",
		"Black Pepper",
		"Ginger",
		"Turmeric",
		"Cardamom",
		"Cinnamon",
		"Clove",
		"Nutmeg",
		"Passionfruit",
		"Starfruit",
		"Pineapple",
		"Brazil Nut",
		"Cashew",
		"Coconut",
		"Acai",
		"Soursop",
		"Rambutan",
		"Lychee",
		"Durian",
		"Jackfruit",
		"Breadfruit",
		"Wild Taro",
		"Rainforest Nettle",
		"Rafflesia",
		"Tamarind",
		"Indian Gooseberry",
		"Jujube",
		"Wild Mango",
		"Bamboo Shoots",
		"Curry Leaf",
		"Holy Basil",
		"Sesame",
		"Pigeon Pea",
		"Wild Yam",
		"Neem",
		"Baobab",
		"Acacia",
		"Marula",
		"Wild Fig",
		"Date Plum",
		"Aloe",
		"Roselle",
		"Wild Sesame",
		"Sorghum",
		"Castor Bean",
		"Oleander",
		"Tea",
		"Tree Tomato",
		"Mountain Papaya",
		"Wild Blueberry",
		"Blackberry",
		"Tree Fern Shoots",
		"Mountain Mint",
		"Angel's Trumpet",
		"Wild Ginger",
		"Wild Garlic",
		"Mulberry",
		"Persimmon",
		"Chestnut",
		"Ginseng",
		"Wood Sorrel",
		"Solomon's Seal",
		"Monkshood",
		"Apple",
		"Pear",
		"Wild Cherry",
		"Plum",
		"Raspberry",
		"Blueberry",
		"Elderberry",
		"Hazelnut",
		"Walnut",
		"Wild Onion",
		"Nettle",
		"Dandelion",
		"Yarrow",
		"Echinacea",
		"Mint",
		"Violet",
		"Acorn",
		"Maple Sap",
		"Birch Sap",
		"Foxglove",
		"Belladonna",
		"Salmonberry",
		"Huckleberry",
		"Sword Fern",
		"Licorice Fern",
		"Miner's Lettuce",
		"Devil's Club",
		"Spruce Tips",
		"Lingonberry",
		"Cloudberry",
		"Bilberry",
		"Crowberry",
		"Cranberry",
		"Juniper",
		"Pine Nuts",
		"Fireweed",
		"Labrador Tea",
		"Angelica",
		"Bearberry",
		"Yew",
		"Mountain Blueberry",
		"Currant",
		"Gooseberry",
		"Valerian",
		"Arnica",
		"Wild Rice",
		"Cattail",
		"Watercress",
		"Arrowroot",
		"Swamp Mint",
		"Sweet Flag",
		"Pickerelweed",
		"Lotus Root",
		"Water Hemlock",
		"Wild Melon",
		"Millet",
		"Devil's Claw",
		"African Ginger",
		"Lotus",
		"Water Lily",
		"Taro",
		"Papyrus Shoots",
		"Water Mint",
		"Sunflower",
		"Prairie Turnip",
		"Goldenrod",
		"Clover",
		"Wild Strawberry",
		"Black-Eyed Susan",
		"Bergamot",
		"Milkweed",
		"Wild Rye",
		"Barley",
		"Buckwheat",
		"Wormwood",
		"Sage",
		"Licorice Root",
		"Sea Buckthorn",
		"Ephedra",
		"Steppe Tulip",
		"Yerba Mate",
		"Passionflower",
		"Amaranth",
		"Quinoa",
		"Pampas Herb",
		"Wild Mint",
		"Chili Pepper",
		"Peanut",
		"Prickly Pear",
		"Chamomile",
		"Plantain Herb",
		"Sorrel",
		"Daisy",
		"Chicory",
		"Buttercup",
		"Gentian",
		"Edelweiss",
		"Mountain Thyme",
		"Alpine Mint",
		"Wild Chive",
		"Mountain Sorrel",
		"Olive",
		"Fig",
		"Grape",
		"Pomegranate",
		"Rosemary",
		"Thyme",
		"Oregano",
		"Lavender",
		"Fennel",
		"Bay Laurel",
		"Carob",
		"Heather",
		"Bog Myrtle",
		"Sagebrush",
		"Bitterroot",
		"Wild Mustard",
		"Rabbitbrush",
		"Serviceberry",
		"Chokecherry",
		"Date Palm",
		"Agave",
		"Desert Melon",
		"Mesquite",
		"Desert Sage",
		"Wild Chili",
		"Saltbush",
		"Tamarisk",
		"Desert Rose",
		"Calotropis",
		"Yucca",
		"Barrel Cactus Fruit",
		"Pinyon Pine",
		"Desert Mint",
		"Creosote Bush",
		"Mormon Tea",
		"Wild Rhubarb",
		"Glasswort",
		"Sea Purslane",
		"Saltgrass",
		"Samphire",
		"Sea Lavender",
		"Date",
		"Orange",
		"Lemon",
		"Cucumber",
		"Melon",
		"Arctic Blueberry",
		"Arctic Sorrel",
		"Purple Saxifrage",
		"Arctic Willow",
		"Reindeer Lichen",
		"Mountain Cranberry",
		"Alpine Sorrel",
		"Sea Kale",
		"Scurvy Grass",
		"Sea Rocket",
		"Beach Pea",
		"Kelp",
		"Sea Lettuce",
		"Red Algae",
		"Green Algae",
		"Juniper Berries",
		"Wild Guava",
		"Cliff Rose",
		"Wild Thyme",
		"Cave Fern",
		"Maidenhair Fern",
		"Hardy Fern",
		"Lichen",
		"Rush Shoots",
		"Brooklime",
		"Fiddlehead Fern",
		"Riverbank Nettle",
		"Willow",
		"Cassava",
		"Water Spinach",
		"Arrowhead",
		"Papyrus",
		"Duckweed",
		"Bog Rosemary",
		"Sundew",
		"Pitcher Plant",
		"Beach Plum",
		"Sea Grape",
		"Beach Morning Glory",
		"Rose Hip",
		"Sea Fennel",
		"Sea Beet",
		"Coastal Sage",
		"Marsh Rosemary",
		"Nipa Palm Fruit",
		"Mangrove Leaves",
		"Seagrass",
		"Sargassum",
		"Sea Grapes Algae",
		"Coralline Algae",
		"Giant Kelp",
		"Sugar Kelp",
		"Bull Kelp",
		"Dulse",
		"Wakame",
		"Bladderwrack",
		"Floating Green Algae",
		"Pandanus Fruit",
		"Tussock Grass",
		"Wheat",
		"Rice",
		"Corn",
		"Oats",
		"Rye",
		"Potato",
		"Sweet Potato",
		"Carrot",
		"Beet",
		"Onion",
		"Garlic",
		"Mustard",
		"Alfalfa",
		"Meadow Grass",
		"Peach",
		"Cherry",
		"Apricot",
		"Lime",
		"Red Grape",
		"White Grape",
		"Black Grape",
		"Cabbage",
		"Crabapple",
		"Ivy",
		"Mugwort",
		"Hemlock",
		"Snow Algae",
		"Ice Algae",
		"Rattan",
		"Bromeliad",
		"Air Plant",
		"Orchid Pods",
		"Canopy Vine",
		"Dragon Fruit",
		"Kiwi Fruit",
		"Watermelon",
		"Mangosteen",
		"Rhubarb",
		"Breadnut",
		"Cotton",
		"Flax",
		"Hemp",
		"Tobacco",
		"Canola",
		"Licorice",
		"Anise",
		"Star Anise",
		"Fenugreek",
		"Joshua Tree",
		"Tea Tree",
		"Camphor Tree",
		"Venus Flytrap",
		"Eucalyptus",
		"Poppy",
		"Oak",
		"Redwood",
		"Cedar"
	],
	fungi: [
		"Chanterelle",
		"Morel",
		"Black Truffle",
		"Oyster Mushroom",
		"Giant Puffball",
		"Bracket Fungus",
		"Stinkhorn",
		"Earthstar",
		"Fly Agaric",
		"Death Cap",
		"Destroying Angel",
		"Shiitake",
		"Porcini",
		"Lion’s Mane",
		"Maitake",
		"Enoki",
		"Turkey Tail",
		"Chicken-of-the-Woods",
		"Cordyceps",
		"Bioluminescent Mushroom",
		"Coral Fungus",
		"Jelly Fungus",
		"Shelf Fungus",
		"Reindeer Lichen",
		"Mold",
		"Mildew",
		"Yeast"
	],
	microbe: [
		"Amoeba",
		"Paramecium",
		"Euglena",
		"Diatom",
		"Dinoflagellate",
		"Radiolarian",
		"Foraminiferan",
		"Cyanobacteria",
		"Methanogen",
		"Sulfur-Oxidizing Bacteria",
		"Iron-Oxidizing Bacteria",
		"Nitrogen-Fixing Bacteria",
		"Halophile",
		"Thermophile",
		"Acidophile",
		"Cryophile",
		"Radiation-Resistant Microbe",
		"Bioluminescent Plankton",
		"Red-Tide Algae",
		"Snow Algae",
		"Tardigrade",
		"Green Algae"
	]
};
const GAL_SPRITE_SEEDS = [
	9e3,
	9004,
	9006,
	9007,
	9009,
	9010,
	9016,
	9017,
	9024,
	9018,
	9026,
	9001,
	9002,
	9005,
	9003,
	9008
];
function galSpriteKind(seed) {
	const k = mulberry32(seed)();
	return k < .42 ? "spiral" : k < .6 ? "barred" : k < .72 ? "lenticular" : k < .87 ? "elliptical" : "irregular";
}
const GAL_KIND$1 = GAL_SPRITE_SEEDS.map(galSpriteKind);
//#endregion
//#region ../celestial-frontier-anthropic-mac/port/v2/packages/domain/descriptors/src/apphooks.ts
const _DEDUPE = {
	microbe: ["Tardigrade", "Green Algae"],
	flora: ["Reindeer Lichen", "Snow Algae"]
};
const _EARTH_NAMES = Object.freeze(Object.fromEntries(Object.entries(_EARTH_NAMES$1).map(([k, names]) => {
	const drop = _DEDUPE[k];
	return [k, Object.freeze(drop ? names.filter((n) => !drop.includes(n)) : names.slice())];
})));
/** the verbatim name pass, re-pointed at the deduped roster. The ALGORITHM is
unchanged — same modulo, same linear probe, same mutation of g._earthName —
so this is a data deviation and not a behavioural one. */
function _earthNamePass$1(list) {
	const used = {
		fauna: /* @__PURE__ */ new Set(),
		flora: /* @__PURE__ */ new Set(),
		fungi: /* @__PURE__ */ new Set(),
		microbe: /* @__PURE__ */ new Set()
	};
	for (const g of list) {
		const kingdom = String(g.kingdom ?? "fauna");
		const pool = _EARTH_NAMES[kingdom] ?? _EARTH_NAMES.fauna;
		const u = used[kingdom] ?? used.fauna;
		let i = (g.seed >>> 0) % pool.length, guard = 0;
		while (u.has(i) && guard++ < pool.length) i = (i + 1) % pool.length;
		u.add(i);
		g._earthName = pool[i];
	}
}
/** jsdom's canvas.toDataURL() output at capture — every fixture thumb value. */
const CAPTURE_THUMB = "data:image/png;base64,";
const flatNoise = (() => .5);
function planetThumb$1(P) {
	if (P && P.type === "gas" && !P._pal) surfaceColor(P, 0, 0, flatNoise);
	return CAPTURE_THUMB;
}
const starThumb$1 = () => CAPTURE_THUMB;
const galaxyThumb$1 = () => CAPTURE_THUMB;
const moonThumb$1 = () => CAPTURE_THUMB;
const cometThumb$1 = () => CAPTURE_THUMB;
const beltThumb$1 = () => CAPTURE_THUMB;
/** Install the capture-environment hooks on globalThis (idempotent; never
overwrites an existing binding, so a future app layer wins by default). */
function installCaptureHooks() {
	const g = globalThis;
	const hooks = {
		_cardFactsSet: _cardFactsSet$1,
		_earthNamePass: _earthNamePass$1,
		GAL_KIND: GAL_KIND$1,
		planetThumb: planetThumb$1,
		starThumb: starThumb$1,
		galaxyThumb: galaxyThumb$1,
		moonThumb: moonThumb$1,
		cometThumb: cometThumb$1,
		beltThumb: beltThumb$1,
		GAL_SPRITES: new Array(GAL_SPRITE_SEEDS.length).fill(null)
	};
	for (const [k, v] of Object.entries(hooks)) if (g[k] === void 0) g[k] = v;
}
//#endregion
//#region ../celestial-frontier-anthropic-mac/port/v2/packages/domain/acquisition/src/canonical.ts
const OWNERSHIP_DATA_BUDGET = Object.freeze({
	maxDepth: 24,
	maxNodes: 25e4,
	maxKeys: 256,
	maxArrayLength: 2e4,
	maxStringLength: 16384,
	maxCharacters: 4e6
});
function ownKeys(value) {
	return Reflect.ownKeys(value);
}
function plainPrototype(value) {
	const prototype = Object.getPrototypeOf(value);
	return prototype === Object.prototype || prototype === null;
}
function ownDataDescriptor(value, key) {
	const descriptor = Object.getOwnPropertyDescriptor(value, key);
	if (!descriptor || !("value" in descriptor) || descriptor.get !== void 0 || descriptor.set !== void 0) throw new TypeError(`ownership data property ${String(key)} must be an own data property`);
	return descriptor;
}
function canonicalNumber(value) {
	if (!Number.isFinite(value)) throw new TypeError("ownership data numbers must be finite");
	return Object.is(value, -0) ? 0 : value;
}
function canonicalValue(value, budget, mutable, depth) {
	mutable.nodes++;
	if (mutable.nodes > budget.maxNodes) throw new RangeError("ownership data node budget exceeded");
	if (depth > budget.maxDepth) throw new RangeError("ownership data depth exceeded");
	if (value === null || typeof value === "boolean") return value;
	if (typeof value === "number") return canonicalNumber(value);
	if (typeof value === "string") {
		if (value.length > budget.maxStringLength) throw new RangeError("ownership data string is too long");
		mutable.characters += value.length;
		if (mutable.characters > budget.maxCharacters) throw new RangeError("ownership data character budget exceeded");
		return value;
	}
	if (typeof value !== "object") throw new TypeError("ownership data must be JSON-compatible");
	if (mutable.active.has(value)) throw new TypeError("ownership data must be acyclic");
	mutable.active.add(value);
	try {
		if (Array.isArray(value)) {
			if (Object.getPrototypeOf(value) !== Array.prototype) throw new TypeError("ownership arrays must use Array.prototype");
			if (value.length > budget.maxArrayLength) throw new RangeError("ownership array is too long");
			const keys = ownKeys(value);
			if (keys.some((key) => typeof key === "symbol")) throw new TypeError("ownership arrays cannot contain symbols");
			const expected = value.length + 1;
			if (keys.length !== expected || !keys.includes("length")) throw new TypeError("ownership arrays must be dense and contain no extra properties");
			if (ownDataDescriptor(value, "length").value !== value.length) throw new TypeError("ownership array length descriptor changed");
			const result = [];
			for (let index = 0; index < value.length; index++) {
				const descriptor = ownDataDescriptor(value, String(index));
				if (descriptor.enumerable !== true) throw new TypeError("ownership array elements must be enumerable");
				result.push(canonicalValue(descriptor.value, budget, mutable, depth + 1));
			}
			return Object.freeze(result);
		}
		if (!plainPrototype(value)) throw new TypeError("ownership objects must have a plain prototype");
		const keys = ownKeys(value);
		if (keys.some((key) => typeof key === "symbol")) throw new TypeError("ownership objects cannot contain symbols");
		if (keys.length > budget.maxKeys) throw new RangeError("ownership object key count exceeded");
		const names = keys;
		const result = Object.create(null);
		for (const key of [...names].sort()) {
			if (key.length > 256) throw new RangeError("ownership object key is too long");
			mutable.characters += key.length;
			if (mutable.characters > budget.maxCharacters) throw new RangeError("ownership data character budget exceeded");
			const descriptor = ownDataDescriptor(value, key);
			if (descriptor.enumerable !== true) throw new TypeError("ownership object properties must be enumerable");
			result[key] = canonicalValue(descriptor.value, budget, mutable, depth + 1);
		}
		return Object.freeze(result);
	} finally {
		mutable.active.delete(value);
	}
}
function canonicalizeData(value, budget = OWNERSHIP_DATA_BUDGET) {
	return canonicalValue(value, budget, {
		nodes: 0,
		characters: 0,
		active: /* @__PURE__ */ new WeakSet()
	}, 0);
}
function canonicalJson(value) {
	return JSON.stringify(canonicalizeData(value));
}
Object.freeze([
	1116352408,
	1899447441,
	3049323471,
	3921009573,
	961987163,
	1508970993,
	2453635748,
	2870763221,
	3624381080,
	310598401,
	607225278,
	1426881987,
	1925078388,
	2162078206,
	2614888103,
	3248222580,
	3835390401,
	4022224774,
	264347078,
	604807628,
	770255983,
	1249150122,
	1555081692,
	1996064986,
	2554220882,
	2821834349,
	2952996808,
	3210313671,
	3336571891,
	3584528711,
	113926993,
	338241895,
	666307205,
	773529912,
	1294757372,
	1396182291,
	1695183700,
	1986661051,
	2177026350,
	2456956037,
	2730485921,
	2820302411,
	3259730800,
	3345764771,
	3516065817,
	3600352804,
	4094571909,
	275423344,
	430227734,
	506948616,
	659060556,
	883997877,
	958139571,
	1322822218,
	1537002063,
	1747873779,
	1955562222,
	2024104815,
	2227730452,
	2361852424,
	2428436474,
	2756734187,
	3204031479,
	3329325298
]);
const PARAGON_SEED_ANCHOR = 10123872;
function exactIndex(value) {
	if (!Number.isInteger(value) || value < 0 || value >= 50) throw new RangeError("Paragon index must identify one of the Fifty");
	return value;
}
/** Verbatim legacy seed recipe: hashInt(0x9A7A60, i, 61) >>> 0. */
function paragonSeedV1(indexValue) {
	const index = exactIndex(indexValue);
	return hashInt(PARAGON_SEED_ANCHOR, index | 0, 61) >>> 0;
}
function createParagonGenomeV1(index) {
	const genome = makeGenome(paragonSeedV1(index), "fauna", 1);
	const random = mulberry32(hashInt(PARAGON_SEED_ANCHOR, index | 0, 62) >>> 0);
	genome.size = 4 + (random() * 2 | 0);
	genome.lumin = true;
	genome.wild = 1;
	genome.par = 8 + (random() * 4 | 0);
	genome.ep = hashInt(PARAGON_SEED_ANCHOR, index | 0, 63) % GUARDIAN_EPITHETS.length;
	return Object.freeze(genome);
}
Object.freeze(Array.from({ length: 50 }, (_, index) => createParagonGenomeV1(index)));
Number.MAX_SAFE_INTEGER;
Object.freeze([
	"fauna",
	"flora",
	"fungi",
	"microbe"
]);
Object.freeze({
	capture: true,
	breeding: false,
	guardian: false
});
function record(value, label) {
	if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
	return value;
}
function exactKeys(value, keys, label) {
	const actual = Object.keys(value).sort();
	const wanted = [...keys].sort();
	if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) throw new TypeError(`${label} has unknown or missing fields`);
}
function addressMirror(address) {
	if (!isCanonicalCF1Address(address) || !("planet" in address)) throw new TypeError("ownership world address must be runtime-proven");
	const key = getCanonicalCF1AddressKey(address);
	if (key === null || key !== address.key) throw new TypeError("ownership world address key is unproven");
	return Object.freeze({
		format: "CF1",
		key,
		galaxy: Object.freeze({
			seed: address.galaxy.seed,
			x: address.galaxy.x,
			y: address.galaxy.y,
			size: address.galaxy.size,
			sp: address.galaxy.sp,
			tilt: address.galaxy.tilt,
			rot: address.galaxy.rot,
			home: address.galaxy.home,
			quasar: address.galaxy.quasar,
			dwarf: address.galaxy.dwarf,
			parentCell: Object.freeze({
				x: address.galaxy.parentCell.x,
				y: address.galaxy.parentCell.y
			})
		}),
		star: Object.freeze({
			seed: address.star.seed,
			x: address.star.x,
			y: address.star.y,
			layer: address.star.layer,
			parentCell: Object.freeze({
				x: address.star.parentCell.x,
				y: address.star.parentCell.y
			})
		}),
		planet: Object.freeze({
			seed: address.planet.seed,
			ordinal: address.planet.ordinal
		})
	});
}
Object.freeze({ resolveWorldAddress(mirror) {
	try {
		const detached = addressMirrorFromJson(canonicalizeData(mirror));
		const resolved = resolveCF1WorldAddress({
			galaxy: {
				seed: detached.galaxy.seed,
				x: detached.galaxy.x,
				y: detached.galaxy.y
			},
			star: {
				seed: detached.star.seed,
				x: detached.star.x,
				y: detached.star.y
			},
			planet: { seed: detached.planet.seed }
		});
		if (!resolved.ok || canonicalJson(addressMirror(resolved.address)) !== canonicalJson(detached)) return null;
		return resolved.address;
	} catch {
		return null;
	}
} });
function addressMirrorFromJson(value) {
	const source = record(value, "world address mirror");
	exactKeys(source, [
		"format",
		"key",
		"galaxy",
		"star",
		"planet"
	], "world address mirror");
	if (source.format !== "CF1") throw new TypeError("world address format is invalid");
	return source;
}
Object.freeze([
	"Cataloguing",
	"Breeding",
	"Rarity",
	"Worlds",
	"Stellar",
	"Exploration",
	"Engineering",
	"Cosmic Events",
	"Conquest",
	"Survival",
	"Husbandry",
	"Duels",
	"Legacy"
]);
const atLeast = (field, minimum) => Object.freeze({
	kind: "at-least",
	field,
	minimum
});
const greaterThan = (left, right) => Object.freeze({
	kind: "greater-than",
	left,
	right
});
const flag = (field) => Object.freeze({
	kind: "flag",
	field
});
const all = (...rules) => Object.freeze({
	kind: "all",
	rules: Object.freeze([...rules])
});
const projected = (rule) => Object.freeze({
	kind: "projection",
	rule
});
const eventOwned = (owner) => Object.freeze({
	kind: "event-owner",
	owner
});
const achievement = (id, category, icon, name, description, evaluation) => Object.freeze({
	id,
	category,
	icon,
	name,
	description,
	evaluation
});
Object.freeze([
	achievement("first", "Cataloguing", "🧬", "First Specimen", "Catalogue your first species", projected(atLeast("cataloguedSpeciesCount", 1))),
	achievement("field10", "Cataloguing", "📓", "Field Biologist", "Catalogue 10 species", projected(atLeast("cataloguedSpeciesCount", 10))),
	achievement("field50", "Cataloguing", "🏛", "Menagerie", "Catalogue 50 species", projected(atLeast("cataloguedSpeciesCount", 50))),
	achievement("codex150", "Cataloguing", "📚", "Grand Archive", "Catalogue 150 species", projected(atLeast("cataloguedSpeciesCount", 150))),
	achievement("codex300", "Cataloguing", "🌠", "Cosmic Library", "Catalogue 300 species", projected(atLeast("cataloguedSpeciesCount", 300))),
	achievement("kingdoms", "Cataloguing", "🌿", "Four Kingdoms", "Catalogue flora, fauna, fungi and microbes", projected(atLeast("ownedKingdomCount", 4))),
	achievement("realms8", "Cataloguing", "🗺", "Realm Ranger", "Own species from 8 of the 16 realms", projected(atLeast("ownedRealmCount", 8))),
	achievement("realms16", "Cataloguing", "🏆", "Master of Realms", "Own species from all 16 realms", projected(atLeast("ownedRealmCount", 16))),
	achievement("hybrid", "Breeding", "🧪", "Hybrid Vigor", "Your Compendium breeds its first hybrid", projected(atLeast("hybridCount", 1))),
	achievement("gene10", "Breeding", "⚗️", "Gene Smith", "10 hybrids bred", projected(atLeast("hybridCount", 10))),
	achievement("gene50", "Breeding", "🔬", "Geneticist", "50 hybrids bred", projected(atLeast("hybridCount", 50))),
	achievement("gen5", "Breeding", "🧫", "Dynasty", "Reach a generation-5 hybrid line", projected(atLeast("maxGeneration", 5))),
	achievement("gen10", "Breeding", "👑", "Bloodline Eternal", "Reach a generation-10 hybrid line", projected(atLeast("maxGeneration", 10))),
	achievement("rare", "Rarity", "🔷", "Deep Find", "Discover something Rare or better", projected(atLeast("bestRawRarityTier", 3))),
	achievement("legend", "Rarity", "🌟", "Gold Rush", "Discover a Legendary", projected(atLeast("bestRawRarityTier", 5))),
	achievement("unique", "Rarity", "✦", "Star-Touched", "Discover a Celestial", projected(atLeast("bestRawRarityTier", 7))),
	achievement("mythic", "Rarity", "🧿", "Beyond the Veil", "Discover a Primordial", projected(atLeast("bestRawRarityTier", 8))),
	achievement("transc", "Rarity", "💫", "One in a Million", "Discover a Transcendent", projected(atLeast("bestRawRarityTier", 9))),
	achievement("summit", "Rarity", "🗻", "Beyond the Million", "Own an Apex Guardian&#8217;s bloodline — a forced Transcendent summit", projected(atLeast("bestRawRarityTier", 12))),
	achievement("tiers8", "Rarity", "🎨", "Full Spectrum", "Own species of 8 different rarity tiers", projected(atLeast("ownedDisplayRarityTierCount", 8))),
	achievement("tiers12", "Rarity", "🌈", "The Deep Spectrum", "Own species of all 10 rarity tiers, Common through Transcendent", projected(atLeast("ownedDisplayRarityTierCount", 10))),
	achievement("survey5", "Worlds", "🛰", "Eyes Down", "Survey 5 living worlds", projected(atLeast("surveyedLivingWorldCount", 5))),
	achievement("survey25", "Worlds", "🌍", "World Walker", "Survey 25 living worlds", projected(atLeast("surveyedLivingWorldCount", 25))),
	achievement("survey100", "Worlds", "🛸", "Centurion", "Survey 100 living worlds", projected(atLeast("surveyedLivingWorldCount", 100))),
	achievement("survey250", "Worlds", "🛰", "Survey Fleet", "Survey 250 living worlds", projected(atLeast("surveyedLivingWorldCount", 250))),
	achievement("worldset", "Worlds", "🪐", "Planetary Census", "Survey all 8 world types", projected(atLeast("surveyedWorldTypeCount", 8))),
	achievement("surface5", "Worlds", "👣", "Groundfall", "Stand on the surface of 5 worlds", projected(atLeast("surfaceWorldCount", 5))),
	achievement("surface25", "Worlds", "🥾", "Trailblazer", "Stand on the surface of 25 worlds", projected(atLeast("surfaceWorldCount", 25))),
	achievement("home", "Worlds", "🏠", "Homecoming", "Stand on Earth", eventOwned("landing:earth")),
	achievement("civ", "Worlds", "🏘", "We Are Not Alone", "Scan a civilized world", eventOwned("survey:world-civilized")),
	achievement("spacefar", "Worlds", "🚀", "Peer Review", "Scan a spacefaring civilization", eventOwned("survey:world-spacefaring")),
	achievement("sol", "Stellar", "☀️", "Old Neighborhood", "Survey the Sun", eventOwned("survey:star-sol")),
	achievement("binary", "Stellar", "☀☀", "Twin Suns", "Survey a binary star system", eventOwned("survey:star-binary")),
	achievement("seebh", "Stellar", "🕳", "Event Horizon", "Survey a stellar black hole", eventOwned("survey:star-black-hole")),
	achievement("seens", "Stellar", "🗼", "Lighthouse", "Survey a neutron star", eventOwned("survey:star-neutron-star")),
	achievement("seemag", "Stellar", "🧲", "Starquake", "Survey a magnetar", eventOwned("survey:star-magnetar")),
	achievement("seewd", "Stellar", "🕯", "Stellar Ember", "Survey a white dwarf", eventOwned("survey:star-white-dwarf")),
	achievement("seerg", "Stellar", "🔴", "Swollen Sun", "Survey a red giant", eventOwned("survey:star-red-giant")),
	achievement("seesg", "Stellar", "🐘", "Titan", "Survey a red supergiant", eventOwned("survey:star-red-supergiant")),
	achievement("seeproto", "Stellar", "🥚", "Genesis", "Survey a protostar", eventOwned("survey:star-protostar")),
	achievement("seebd", "Stellar", "🟤", "Almost a Star", "Survey a brown dwarf", eventOwned("survey:star-brown-dwarf")),
	achievement("stellarset", "Stellar", "🌃", "Stellar Census", "Survey 8 different star classes", projected(atLeast("surveyedStarClassCount", 8))),
	achievement("gal5", "Exploration", "🌌", "Island Hopper", "Fly inside 5 different galaxies", projected(atLeast("galaxyCount", 5))),
	achievement("gal25", "Exploration", "🗺", "Intergalactic", "Fly inside 25 different galaxies", projected(atLeast("galaxyCount", 25))),
	achievement("gal100", "Exploration", "♾", "Pan-Galactic", "Fly inside 100 different galaxies", projected(atLeast("galaxyCount", 100))),
	achievement("worm", "Exploration", "🌀", "Threadneedle", "Fly through a wormhole", eventOwned("travel:wormhole")),
	achievement("quasar", "Exploration", "🔆", "Blinding Light", "Visit a quasar galaxy", eventOwned("travel:quasar-galaxy")),
	achievement("dwarfg", "Exploration", "🌫", "Small Wonders", "Visit a dwarf galaxy", eventOwned("travel:dwarf-galaxy")),
	achievement("curator", "Exploration", "★", "Curator", "Favorite a place in your Star Atlas", eventOwned("atlas:first-favorite")),
	achievement("crafter", "Engineering", "🛠", "Fabricator", "Craft your first part", projected(atLeast("craftCount", 1))),
	achievement("crafts25", "Engineering", "⚙", "Assembly Line", "Craft 25 things", projected(atLeast("craftCount", 25))),
	achievement("geared", "Engineering", "🎽", "Outfitted", "Equip a piece of explorer gear", projected(atLeast("equippedGearCount", 1))),
	achievement("shipwright", "Engineering", "⚡", "Shipwright", "Build the Jump Drive", projected(flag("hasJumpDrive"))),
	achievement("arraybuilt", "Engineering", "📡", "The Long Ear", "Build the Long-Range Array", projected(flag("hasLongRangeArray"))),
	achievement("rimbreaker", "Engineering", "🌌", "Rim-Breaker", "Build the Intergalactic Drive", projected(flag("hasIntergalacticDrive"))),
	achievement("ascended", "Engineering", "⬆", "The Last Chapter", "Complete all three Chapters", projected(all(atLeast("ascentChapterIndex", 3), flag("hasIntergalacticDrive")))),
	achievement("lastvein", "Engineering", "⛏", "To the Last Vein", "Mine a world completely dry", projected(atLeast("minedOutWorldCount", 1))),
	achievement("richstrike", "Engineering", "💎", "Prospector&#8217;s Luck", "Mine 250 loads of ore", projected(atLeast("miningLoadCount", 250))),
	achievement("cosmicfind", "Engineering", "✦", "Touched the Cosmos", "Recover a cosmic material from the deepest worlds or a star", projected(atLeast("cosmicMaterialCount", 1))),
	achievement("skimmer", "Engineering", "☀", "Sun-Skimmer", "Skim a star&#8217;s corona for its stellar cosmic", projected(atLeast("coronaSkimCount", 1))),
	achievement("cosmicgear", "Engineering", "🌟", "Forged from Starstuff", "Forge a piece of cosmic gear", projected(flag("hasCosmicGear"))),
	achievement("daily", "Cosmic Events", "🗓", "Pilgrim", "Follow the Traveler’s Beacon", eventOwned("beacon:follow")),
	achievement("anomaly5", "Cosmic Events", "🕯", "Devout", "Follow 5 different Beacons", projected(atLeast("beaconCount", 5))),
	achievement("anomaly25", "Cosmic Events", "⛩", "Lighthouse Keeper", "Follow 25 different Beacons", projected(atLeast("beaconCount", 25))),
	achievement("event1", "Cosmic Events", "👁", "Witness", "Travel to a cosmic event", projected(atLeast("cosmicEventCount", 1))),
	achievement("event5", "Cosmic Events", "🌩", "Storm Chaser", "Travel to 5 cosmic events", projected(atLeast("cosmicEventCount", 5))),
	achievement("event25", "Cosmic Events", "📜", "Chronicler", "Travel to 25 cosmic events", projected(atLeast("cosmicEventCount", 25))),
	achievement("decade", "Cosmic Events", "💫", "Once in a Lifetime", "Witness the once-a-decade event", eventOwned("event:once-a-decade")),
	achievement("settle1", "Conquest", "🏴", "Flagplanter", "Conquer and settle a world", eventOwned("conquest:first-settlement")),
	achievement("settle5", "Conquest", "🏰", "Dominion", "Settle 5 worlds", projected(atLeast("settledWorldCount", 5))),
	achievement("settle25", "Conquest", "🏯", "Empire", "Settle 25 worlds", projected(atLeast("settledWorldCount", 25))),
	achievement("guard1", "Conquest", "👑", "Regicide", "Defeat a named Apex Guardian", projected(atLeast("guardianCount", 1))),
	achievement("guard5", "Conquest", "⚜️", "Throne Breaker", "Defeat 5 Apex Guardians", projected(atLeast("guardianCount", 5))),
	achievement("harvest10", "Conquest", "⛏", "Quartermaster", "Harvest Stardust 10 times", projected(atLeast("stardustHarvestCount", 10))),
	achievement("essence500", "Conquest", "☄", "Stockpiler", "Earn 500 Stardust lifetime", projected(atLeast("lifetimeStardust", 500))),
	achievement("survivor", "Survival", "🩸", "Bitten, Not Beaten", "Survive a hostile strike in the field — a bioscan gone wrong, or a wary first contact", eventOwned("survival:hostile-field-strike")),
	achievement("brink", "Survival", "💔", "On the Brink", "Drop below 20 HP and live to tell it", eventOwned("survival:below-twenty-hp")),
	achievement("fieldmedic", "Survival", "💚", "Field Medic", "Heal yourself with flora", eventOwned("care:flora-heal")),
	achievement("gambler", "Survival", "🎰", "Cruel Bargain", "Heal with flora above 40% poison risk and survive", eventOwned("care:high-risk-flora-heal")),
	achievement("bred1", "Husbandry", "💞", "Matchmaker", "Successfully breed a pair", projected(atLeast("breedWinCount", 1))),
	achievement("bred10", "Husbandry", "🐣", "Brood Master", "10 successful breedings", projected(atLeast("breedWinCount", 10))),
	achievement("bredfail", "Husbandry", "🎲", "High Roller", "Lose a pair to a failed breeding", projected(greaterThan("breedAttemptCount", "breedWinCount"))),
	achievement("bredlegend", "Husbandry", "☣", "Forbidden Science", "Breed two Legendary-or-better creatures", eventOwned("breed:legendary-pair")),
	achievement("feed5", "Husbandry", "🍽", "Zookeeper", "Feed flora to fauna 5 times", projected(atLeast("feedCount", 5))),
	achievement("feedfail", "Husbandry", "☠", "Bitter Harvest", "Lose a beast to a poisonous meal", projected(atLeast("poisonousMealLossCount", 1))),
	achievement("duel1", "Duels", "🤺", "Sparring Partner", "Fight a creature duel", projected(atLeast("duelCount", 1))),
	achievement("duelw1", "Duels", "🏅", "Victor", "Win a creature duel", projected(atLeast("duelWinCount", 1))),
	achievement("duelw5", "Duels", "🏆", "Champion", "Win 5 creature duels", projected(atLeast("duelWinCount", 5))),
	achievement("duelw25", "Duels", "🐉", "Apex", "Win 25 creature duels", projected(atLeast("duelWinCount", 25))),
	achievement("namer", "Legacy", "✎", "Cartographer", "Name a discovery", eventOwned("naming:first-discovery-name")),
	achievement("names5", "Legacy", "🖋", "Toponymist", "Name 5 discoveries", projected(atLeast("namedDiscoveryCount", 5))),
	achievement("names15", "Legacy", "🗃", "Atlas Author", "Name 15 discoveries", projected(atLeast("namedDiscoveryCount", 15))),
	achievement("share", "Legacy", "📡", "Signal Sent", "Share a discovery code", eventOwned("sharing:first-code-sent")),
	achievement("share5", "Legacy", "📻", "Broadcaster", "Share 5 discovery codes", projected(atLeast("sharedCodeCount", 5))),
	achievement("wayfarer", "Legacy", "🧭", "Wayfarer", "Travel by a share code", eventOwned("sharing:first-code-followed")),
	achievement("jumps5", "Legacy", "🕸", "Networked", "Follow 5 share codes", projected(atLeast("followedShareCodeCount", 5)))
]);
Object.freeze({
	cataloguedSpeciesCount: 1500,
	ownedKingdomCount: 4,
	ownedRealmCount: 16,
	hybridCount: 1e9,
	maxGeneration: 1e9,
	bestRawRarityTier: 14,
	ownedDisplayRarityTierCount: 10,
	surveyedLivingWorldCount: 6e4,
	surveyedWorldTypeCount: 8,
	surfaceWorldCount: 6e4,
	surveyedStarClassCount: 8,
	galaxyCount: 2e4,
	craftCount: 1e9,
	equippedGearCount: 9,
	ascentChapterIndex: 3,
	minedOutWorldCount: 1e9,
	miningLoadCount: 1e9,
	cosmicMaterialCount: 1e9,
	coronaSkimCount: 1e9,
	beaconCount: 1e9,
	cosmicEventCount: 1e9,
	settledWorldCount: 2e4,
	guardianCount: 1e9,
	stardustHarvestCount: 1e9,
	lifetimeStardust: 1e9,
	breedAttemptCount: 1e9,
	breedWinCount: 1e9,
	feedCount: 1e9,
	poisonousMealLossCount: 1e9,
	duelCount: 1e9,
	duelWinCount: 1e9,
	namedDiscoveryCount: 5e3,
	sharedCodeCount: 1e9,
	followedShareCodeCount: 1e9
});
Object.freeze([
	"hasJumpDrive",
	"hasLongRangeArray",
	"hasIntergalacticDrive",
	"hasCosmicGear"
]);
//#endregion
//#region ../celestial-frontier-anthropic-mac/port/v2/packages/domain/progression/src/rank.ts
const rank = (index, threshold, name, nameplateHue) => Object.freeze({
	index,
	threshold,
	name,
	nameplateHue,
	iridescent: nameplateHue === "irid"
});
Object.freeze([
	rank(0, 0, "Cadet", "#9fb6d6"),
	rank(1, 30, "Scout", "#7fe6a0"),
	rank(2, 90, "Pathfinder", "#7fd0ff"),
	rank(3, 220, "Voyager", "#5b8cf0"),
	rank(4, 460, "Pioneer", "#46c2b2"),
	rank(5, 900, "Star Cartographer", "#ffd96a"),
	rank(6, 1700, "Mythic Wayfarer", "#b06cff"),
	rank(7, 3e3, "Void Sovereign", "#7a6af0"),
	rank(8, 5200, "Cosmic Luminary", "#ffe9b8"),
	rank(9, 8200, "Eternal Frontier", "irid")
]);
Object.freeze({
	surveyedLivingWorld: 4,
	cataloguedSpecies: 2,
	bestRawRarityTier: 12,
	unlockedAchievement: 6,
	hybrid: 1,
	galaxyVisited: 3
});
Object.freeze({
	surveyedLivingWorldCount: 6e4,
	cataloguedSpeciesCount: 1500,
	bestRawRarityTier: 14,
	unlockedAchievementCount: 146,
	hybridCount: 1e9,
	galaxyCount: 2e4
});
Object.freeze([
	.6,
	.45,
	.36,
	.27,
	.19,
	.13,
	.09,
	.06,
	.04,
	.025,
	.015,
	.01,
	.006,
	.004,
	.0025
]);
Object.freeze({
	legacyEligibility: "same-full-world-current-cycle-successful-species-and-verb-only",
	reacquisition: "new-individual-or-lot-with-first-only-catalogue",
	encodedExtensionByteCapacity: "registered-all-scenario-certificate-required-before-draw",
	breedingProvenance: "unsupported-by-ownership-v1",
	guardianProvenance: "unsupported-by-ownership-v1",
	writerExposed: true,
	playerControlExposed: true
});
Object.freeze([
	"breed",
	"combat",
	"dispatch"
]);
//#endregion
//#region ../celestial-frontier-anthropic-mac/port/v2/packages/persistence/src/repository.ts
const STORES = [
	"meta",
	"player",
	"creatures",
	"catalog",
	"inventory",
	"settings",
	"journal",
	"receipts",
	"assetcache"
];
Number.MAX_SAFE_INTEGER;
new Set(STORES);
Object.freeze([
	"conquer",
	"protect",
	"terraform",
	"preserve",
	"balance"
]);
Object.freeze([
	"color",
	"form",
	"body",
	"loco",
	"trait",
	"size",
	"diet",
	"head",
	"skin",
	"tail",
	"pattern",
	"eyes",
	"behavior",
	"habitat",
	"detail",
	"temper",
	"sense",
	"repro",
	"life",
	"metab",
	"ep"
]);
Object.freeze(Object.fromEntries([
	"undefined",
	"null",
	"boolean",
	"number",
	"string",
	"array",
	"object",
	"other"
].map((valueType) => [valueType, Object.freeze({
	kind: "invalid-route-value",
	valueType
})])));
Object.freeze([
	"st",
	"ps",
	"ac",
	"es",
	"c",
	"ca",
	"cx",
	"it",
	"eq",
	"ea",
	"e"
]);
Object.freeze({
	ac: 500,
	c: 1500,
	ca: 200,
	cx: 200,
	it: 300
});
Object.freeze({
	maxDepth: 12,
	maxArrayLength: 1500,
	maxObjectKeys: 64,
	maxKeyLength: 128,
	maxStringLength: 4096,
	maxNodes: 1e5,
	maxCharacters: 2e6
});
//#endregion
//#region ../celestial-frontier-anthropic-mac/port/v2/packages/persistence/src/migration-v5.ts
const V5_MAX_EXTENSION_JSON_BYTES = 262144;
Object.freeze({
	player: "player",
	creatures: "creatures",
	catalog: "catalog",
	inventory: "inventory",
	settings: "settings"
});
const SETTINGS_FIELDS = [
	"fs",
	"tone",
	"font",
	"snd",
	"fx",
	"chart",
	"shake",
	"sv",
	"notif",
	"tips",
	"vol",
	"gt",
	"rm",
	"cx",
	"vce",
	"cbx"
];
const INVENTORY_FIELDS = [
	"setsc",
	"cargo",
	"cgx",
	"jrn",
	"pin",
	"ctb",
	"minedw",
	"mx",
	"skx",
	"bx",
	"tech",
	"items",
	"eq",
	"ea",
	"xpf",
	"xpa"
];
const CATALOG_FIELDS = [
	"land",
	"scout",
	"wvo",
	"cont",
	"seen",
	"surveyed",
	"gals",
	"surf",
	"sysv",
	"starK",
	"ptypes",
	"evts",
	"evann",
	"log",
	"home",
	"prime",
	"codex"
];
const PLAYER_FIELDS = [
	"v",
	"epoch",
	"view",
	"hp",
	"pstats",
	"landings",
	"chs",
	"chw",
	"chp",
	"chacc",
	"charters",
	"notifs",
	"me",
	"essence",
	"conq",
	"breeds",
	"breedwins",
	"feeds",
	"feedfails",
	"harvests",
	"essenceEarned",
	"guardians",
	"paragons",
	"nh",
	"br",
	"at",
	"mines",
	"crafts",
	"minedout",
	"skims",
	"cosmics",
	"asc",
	"ascp",
	"names",
	"shares",
	"jumps",
	"anomalies",
	"anomKey",
	"events",
	"duels",
	"duelwins",
	"ever",
	"ach",
	"frontier",
	"ending",
	"guide",
	"tut",
	"rn",
	"tsnap"
];
(() => {
	const owners = /* @__PURE__ */ new Map();
	const add = (segment, fields) => {
		for (const field of fields) {
			if (owners.has(field)) throw new Error(`duplicate v4 field owner: ${field}`);
			owners.set(field, segment);
		}
	};
	add("player", PLAYER_FIELDS);
	add("catalog", CATALOG_FIELDS);
	add("inventory", INVENTORY_FIELDS);
	add("settings", SETTINGS_FIELDS);
	return owners;
})();
Object.freeze({});
Number.MAX_SAFE_INTEGER - 1;
//#endregion
//#region ../celestial-frontier-anthropic-mac/port/v2/packages/domain/sessionrng/src/index.ts
/** One semantic counter per legacy gameplay/outcome roll. Presentation-only
* noise is deliberately excluded: reordering particles or audio must not move
* a player outcome. */
const DOMAINS = Object.freeze({
	contactSuccess: "contact.success",
	descentSuccess: "descent.success",
	descentDamage: "descent.damage",
	surveyHazard: "survey.hazard",
	captureCandidate: "capture.candidate",
	captureSuccess: "capture.success",
	bulkFeedOutcome: "care.feed",
	feedOutcome: "care.feed",
	healOutcome: "care.heal",
	breedOutcome: "care.breed",
	hazardFlavor: "hazard.flavor",
	trainingSpecimenSeed: "training.specimen-seed",
	trainingSpecimenVariation: "training.specimen-variation",
	trainingDuelSeed: "training.duel-seed"
});
function freezeLegacySites(sites) {
	for (const site of sites) Object.freeze(site);
	return Object.freeze(sites);
}
/** All and only the 24 executable `Math.random()` call sites in frozen
* v1.8.9. `legacyLine` + one-based `occurrenceOnLine` is the stable physical
* address; `sourceLine` makes even same-address source drift fail closed.
* Presentation calls are recorded but have no SessionRNG domain, so audio/FX
* scheduling can never perturb a player-outcome counter. This is migration
* evidence, not permission to retain bare RNG. */
const LEGACY_RNG_SITES = freezeLegacySites([
	{
		id: "contact-success",
		classification: "outcome",
		domain: DOMAINS.contactSuccess,
		legacyLine: 10720,
		occurrenceOnLine: 1,
		owner: "attemptContact",
		purpose: "contact attempt succeeds",
		sourceLine: `if(Math.random()<Math.min(0.98, 0.7+_equipBonus('contact')/100)){`
	},
	{
		id: "descent-success",
		classification: "outcome",
		domain: DOMAINS.descentSuccess,
		legacyLine: 10982,
		occurrenceOnLine: 1,
		owner: "_descRoll",
		purpose: "descent decision",
		sourceLine: "if(Math.random()*100 < d.pct){"
	},
	{
		id: "descent-damage",
		classification: "outcome",
		domain: DOMAINS.descentDamage,
		legacyLine: 10992,
		occurrenceOnLine: 1,
		owner: "_descRoll",
		purpose: "descent damage amount",
		sourceLine: "let dmg=d.lo+Math.floor(Math.random()*(d.hi-d.lo+1));"
	},
	{
		id: "survey-hazard",
		classification: "outcome",
		domain: DOMAINS.surveyHazard,
		legacyLine: 11837,
		occurrenceOnLine: 1,
		owner: "bioscan",
		purpose: "bioscan hazard decision",
		sourceLine: "if(dz.pct>0 && Math.random()<dz.pct){"
	},
	{
		id: "capture-candidate",
		classification: "outcome",
		domain: DOMAINS.captureCandidate,
		legacyLine: 12415,
		occurrenceOnLine: 1,
		owner: "tryCapture",
		purpose: "capture target selection",
		sourceLine: "const g=pool[(Math.random()*pool.length)|0];"
	},
	{
		id: "capture-success",
		classification: "outcome",
		domain: DOMAINS.captureSuccess,
		legacyLine: 12420,
		occurrenceOnLine: 1,
		owner: "tryCapture",
		purpose: "capture succeeds",
		sourceLine: "if(Math.random()<ch){"
	},
	{
		id: "bulk-feed-outcome",
		classification: "outcome",
		domain: DOMAINS.bulkFeedOutcome,
		legacyLine: 16592,
		occurrenceOnLine: 1,
		owner: "bulk feed",
		purpose: "bulk-feed meal outcome",
		sourceLine: "const r2=feedPair(base, fl[0], Math.random());"
	},
	{
		id: "heal-outcome",
		classification: "outcome",
		domain: DOMAINS.healOutcome,
		legacyLine: 16688,
		occurrenceOnLine: 1,
		owner: "heal",
		purpose: "flora-heal outcome",
		sourceLine: "const r=healExplorer(other, (_tutRig&&_tutRig.heal!=null)?_tutRig.heal:(!tutDone?0.95:Math.random()));"
	},
	{
		id: "breed-outcome",
		classification: "outcome",
		domain: DOMAINS.breedOutcome,
		legacyLine: 16704,
		occurrenceOnLine: 1,
		owner: "breed",
		purpose: "breeding outcome",
		sourceLine: "const r=breedPair(_pickBase, other, (_tutRig&&_tutRig.breed!=null)?_tutRig.breed:(!tutDone?-1:Math.random()));"
	},
	{
		id: "feed-outcome",
		classification: "outcome",
		domain: DOMAINS.feedOutcome,
		legacyLine: 16725,
		occurrenceOnLine: 1,
		owner: "feed",
		purpose: "manual-feed meal outcome",
		sourceLine: "const r=feedPair(_pickBase, other, (_tutRig&&_tutRig.feed!=null)?_tutRig.feed:(!tutDone?0.99:Math.random()));"
	},
	{
		id: "hazard-flavor",
		classification: "outcome",
		domain: DOMAINS.hazardFlavor,
		legacyLine: 16800,
		occurrenceOnLine: 1,
		owner: "hazardFlavor",
		purpose: "hazard flavor selection",
		sourceLine: "const env=arr[Math.floor(Math.random()*arr.length)];"
	},
	{
		id: "training-specimen-seed",
		classification: "outcome",
		domain: DOMAINS.trainingSpecimenSeed,
		legacyLine: 23306,
		occurrenceOnLine: 1,
		owner: "_tutGrant",
		purpose: "training specimen seed",
		sourceLine: "do{ g=makeGenome((Math.random()*0xFFFFFFFF)>>>0, kingdom, 0.3+Math.random()*0.35); }"
	},
	{
		id: "training-specimen-variation",
		classification: "outcome",
		domain: DOMAINS.trainingSpecimenVariation,
		legacyLine: 23306,
		occurrenceOnLine: 2,
		owner: "_tutGrant",
		purpose: "training specimen variation",
		sourceLine: "do{ g=makeGenome((Math.random()*0xFFFFFFFF)>>>0, kingdom, 0.3+Math.random()*0.35); }"
	},
	{
		id: "training-duel-seed",
		classification: "outcome",
		domain: DOMAINS.trainingDuelSeed,
		legacyLine: 23321,
		occurrenceOnLine: 1,
		owner: "_tutDuel",
		purpose: "training rival seed",
		sourceLine: `const rg=makeGenome((Math.random()*0xFFFFFFFF)>>>0, 'fauna', 0.5);`
	},
	{
		id: "voice-noise",
		classification: "presentation",
		domain: null,
		legacyLine: 13690,
		occurrenceOnLine: 1,
		owner: "playVoice",
		purpose: "voice noise buffer",
		sourceLine: "for(let i=0;i<n;i++){ const w=Math.random()*2-1; last=(last+w*0.22)/1.22; ch[i]=last*(1-i/n); }"
	},
	{
		id: "whoosh-noise",
		classification: "presentation",
		domain: null,
		legacyLine: 13783,
		occurrenceOnLine: 1,
		owner: "playWhoosh",
		purpose: "whoosh noise buffer",
		sourceLine: "for(let i=0;i<ch.length;i++) ch[i]=Math.random()*2-1;"
	},
	{
		id: "fx-burst-angle",
		classification: "presentation",
		domain: null,
		legacyLine: 16098,
		occurrenceOnLine: 1,
		owner: "fxBurst",
		purpose: "particle angle",
		sourceLine: "const a=Math.random()*Math.PI*2, v=70+Math.random()*240, s=4+Math.random()*6;"
	},
	{
		id: "fx-burst-velocity",
		classification: "presentation",
		domain: null,
		legacyLine: 16098,
		occurrenceOnLine: 2,
		owner: "fxBurst",
		purpose: "particle velocity",
		sourceLine: "const a=Math.random()*Math.PI*2, v=70+Math.random()*240, s=4+Math.random()*6;"
	},
	{
		id: "fx-burst-size",
		classification: "presentation",
		domain: null,
		legacyLine: 16098,
		occurrenceOnLine: 3,
		owner: "fxBurst",
		purpose: "particle size",
		sourceLine: "const a=Math.random()*Math.PI*2, v=70+Math.random()*240, s=4+Math.random()*6;"
	},
	{
		id: "fx-burst-shape",
		classification: "presentation",
		domain: null,
		legacyLine: 16102,
		occurrenceOnLine: 1,
		owner: "fxBurst",
		purpose: "particle shape",
		sourceLine: `if(Math.random()<0.4) p.style.borderRadius='50%';`
	},
	{
		id: "fx-burst-rotation",
		classification: "presentation",
		domain: null,
		legacyLine: 16105,
		occurrenceOnLine: 1,
		owner: "fxBurst",
		purpose: "particle rotation",
		sourceLine: `p.style.setProperty('--rot',((Math.random()*720-360)|0)+'deg');`
	},
	{
		id: "fx-burst-duration",
		classification: "presentation",
		domain: null,
		legacyLine: 16106,
		occurrenceOnLine: 1,
		owner: "fxBurst",
		purpose: "particle duration",
		sourceLine: `p.style.setProperty('--t',(0.7+Math.random()*0.7).toFixed(2)+'s');`
	},
	{
		id: "hit-noise",
		classification: "presentation",
		domain: null,
		legacyLine: 16153,
		occurrenceOnLine: 1,
		owner: "playHit",
		purpose: "impact noise buffer",
		sourceLine: "for(let i=0;i<n;i++) ch[i]=(Math.random()*2-1)*(1-i/n);"
	},
	{
		id: "ambience-noise",
		classification: "presentation",
		domain: null,
		legacyLine: 16219,
		occurrenceOnLine: 1,
		owner: "ambienceStart",
		purpose: "ambient noise buffer",
		sourceLine: "for(let i=0;i<n;i++){ const w=Math.random()*2-1; last=(last+w*0.14)/1.14; ch[i]=last*3.2; }"
	}
]);
Object.freeze(LEGACY_RNG_SITES.filter((site) => site.classification === "outcome"));
const LEGACY_PRESENTATION_RNG_SITES = Object.freeze(LEGACY_RNG_SITES.filter((site) => site.classification === "presentation"));
Object.freeze(LEGACY_PRESENTATION_RNG_SITES.map(({ legacyLine }) => legacyLine));
Object.freeze([
	"expectedRevision",
	"grant",
	"writable",
	"snapshot",
	"domains",
	"receiptKind",
	"now",
	"preDraw"
]);
Object.freeze([
	"equip",
	"unequip",
	"salvage",
	"pending-claim"
]);
Object.freeze({
	equip: "arc2-equip",
	unequip: "arc2-unequip",
	salvage: "arc2-salvage",
	"pending-claim": "arc2-pending-claim"
});
//#endregion
//#region ../celestial-frontier-anthropic-mac/port/v2/packages/domain/loot/src/internal.ts
function deepFreeze$1(value) {
	if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
		for (const child of Object.values(value)) deepFreeze$1(child);
		Object.freeze(value);
	}
	return value;
}
Object.freeze([
	"helmet",
	"ears",
	"necklace",
	"suit",
	"gloves",
	"legs",
	"boots",
	"tool",
	"module"
]);
const UNIVERSAL_RARITY_TIERS = deepFreeze$1([
	{
		tier: 0,
		id: "common",
		name: "Common",
		hex: "#B8BDC7"
	},
	{
		tier: 1,
		id: "uncommon",
		name: "Uncommon",
		hex: "#4FD16B"
	},
	{
		tier: 2,
		id: "notable",
		name: "Notable",
		hex: "#35C9B5"
	},
	{
		tier: 3,
		id: "rare",
		name: "Rare",
		hex: "#3D8BFF"
	},
	{
		tier: 4,
		id: "exotic",
		name: "Exotic",
		hex: "#9A5CFF"
	},
	{
		tier: 5,
		id: "legendary",
		name: "Legendary",
		hex: "#F4A62A"
	},
	{
		tier: 6,
		id: "mythic",
		name: "Mythic",
		hex: "#E54B8D"
	},
	{
		tier: 7,
		id: "celestial",
		name: "Celestial",
		hex: "#54D8FF"
	},
	{
		tier: 8,
		id: "primordial",
		name: "Primordial",
		hex: "#D85B3F"
	},
	{
		tier: 9,
		id: "transcendent",
		name: "Transcendent",
		hex: "#F7F1FF"
	}
]);
Object.freeze(UNIVERSAL_RARITY_TIERS.map((definition) => definition.id));
function resolvedLegacyRarity(category, tier, authored) {
	if (authored !== void 0) return Math.max(0, Math.min(9, authored | 0));
	let rarity = tier <= 1 ? 1 : tier === 2 ? 3 : tier === 3 ? 5 : 6;
	if (category === "relic") rarity = Math.max(rarity, 7);
	return Math.max(0, Math.min(9, rarity));
}
function definition(input) {
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
		rarity: UNIVERSAL_RARITY_TIERS[rarityTier].id,
		effects: input.effects ?? {},
		implicits: Object.keys(input.effects ?? {}).sort(),
		materialCost: input.materialCost,
		partCost: input.partCost ?? null,
		stardustCost: input.stardustCost ?? null,
		prerequisiteId: input.prerequisiteId ?? null,
		signatureId: input.signatureId ?? null,
		unlock: input.unlock ?? null
	};
	return input.slot === void 0 ? {
		...common,
		inventoryShape: "stackable",
		category: input.category,
		slot: null
	} : {
		...common,
		inventoryShape: "slotted",
		category: input.category,
		slot: input.slot
	};
}
const LOOT_CATALOGUE_V1 = deepFreeze$1([
	definition({
		id: "plate",
		category: "part",
		tier: 1,
		family: "plate",
		hue: "#aab2c2",
		name: "Iron Plate",
		description: "Rolled hull stock — the frontier is built on it",
		materialCost: { Fe: 4 }
	}),
	definition({
		id: "wire",
		category: "part",
		tier: 1,
		family: "wire",
		hue: "#e8b06a",
		name: "Aluminium Wire",
		description: "Drawn conductor spool",
		materialCost: { Al: 3 }
	}),
	definition({
		id: "chip",
		category: "part",
		tier: 1,
		family: "chip",
		hue: "#9fdfe8",
		name: "Silicon Chip",
		description: "Etched logic wafer",
		materialCost: { Si: 3 }
	}),
	definition({
		id: "frame",
		category: "part",
		tier: 1,
		family: "frame",
		hue: "#9fb6d6",
		name: "Steel Frame",
		description: "Chromium-steel truss — light enough, unbreakable enough",
		materialCost: {
			Fe: 3,
			Cr: 1
		}
	}),
	definition({
		id: "lens",
		category: "part",
		tier: 1,
		family: "lens",
		hue: "#cde8fa",
		name: "Optic Lens",
		description: "Fluorite-glass eye for instruments",
		materialCost: {
			Si: 2,
			Ca: 1
		}
	}),
	definition({
		id: "pellet",
		category: "part",
		tier: 1,
		family: "fuel",
		hue: "#f2c8a2",
		name: "Fuel Pellet",
		description: "Compressed hydrogen-methane charge",
		materialCost: {
			H: 3,
			CH4: 1
		}
	}),
	definition({
		id: "weave",
		category: "part",
		tier: 1,
		family: "weave",
		hue: "#8a8a9a",
		name: "Carbon Weave",
		description: "Filament cloth cracked from methane — suits begin here",
		materialCost: { CH4: 3 }
	}),
	definition({
		id: "cell",
		category: "part",
		tier: 1,
		family: "cell",
		hue: "#ff9fb2",
		name: "Power Cell",
		description: "Sealed hydrogen-oxygen charge brick",
		materialCost: {
			H: 2,
			O: 2
		}
	}),
	definition({
		id: "cryogel",
		category: "part",
		tier: 1,
		family: "gel",
		hue: "#8fd6ff",
		name: "Cryo Gel",
		description: "Slush of stabilized ices",
		materialCost: {
			H2O: 3,
			NH3: 1
		}
	}),
	definition({
		id: "coil",
		category: "comp",
		tier: 2,
		family: "coil",
		hue: "#ffd96a",
		name: "Drive Coil",
		description: "Field windings for anything that pushes",
		materialCost: {},
		partCost: {
			wire: 2,
			plate: 1
		}
	}),
	definition({
		id: "navcore",
		category: "comp",
		tier: 2,
		family: "core",
		hue: "#b58cff",
		name: "Nav Core",
		description: "A thinking knot of charts and starlight",
		materialCost: {},
		partCost: {
			chip: 2,
			lens: 1
		}
	}),
	definition({
		id: "hullseg",
		category: "comp",
		tier: 2,
		family: "hull",
		hue: "#b8c0ce",
		name: "Hull Segment",
		description: "Curved armor blade for ship or shelter",
		materialCost: {},
		partCost: {
			frame: 1,
			plate: 2
		}
	}),
	definition({
		id: "fuelcell",
		category: "comp",
		tier: 2,
		family: "fcell",
		hue: "#7fd0ff",
		name: "Fuel Cell",
		description: "A pellet magazine wrapped around a spark",
		materialCost: {},
		partCost: {
			pellet: 2,
			cell: 1
		}
	}),
	definition({
		id: "servo",
		category: "comp",
		tier: 2,
		family: "servo",
		hue: "#c2a878",
		name: "Servo Rig",
		description: "Motorized joints that do the heavy lifting",
		materialCost: {},
		partCost: {
			plate: 1,
			cell: 1,
			wire: 1
		}
	}),
	definition({
		id: "cryocap",
		category: "comp",
		tier: 2,
		family: "capsule",
		hue: "#a8d8f0",
		name: "Cryo Capsule",
		description: "Cold storage that never warms",
		materialCost: {},
		partCost: {
			cryogel: 2,
			frame: 1
		}
	}),
	definition({
		id: "jumpdrive",
		category: "sys",
		tier: 3,
		family: "drive",
		hue: "#7fd0ff",
		name: "Jump Drive",
		description: "Folds the gulf between stars — INTERSTELLAR travel",
		stardustCost: 30,
		materialCost: {},
		partCost: {
			coil: 2,
			navcore: 1,
			fuelcell: 1
		},
		effects: {},
		unlock: "Interstellar travel — every star in the home galaxy"
	}),
	definition({
		id: "array",
		category: "sys",
		tier: 3,
		family: "array",
		hue: "#9fe06a",
		name: "Long-Range Array",
		description: "An ear the size of a mountain — charts the whole galaxy",
		stardustCost: 60,
		materialCost: {},
		partCost: {
			navcore: 2,
			lens: 1,
			cell: 1
		},
		prerequisiteId: "jumpdrive",
		effects: {},
		unlock: "Galaxy-wide reach — and the parts bench for the Intergalactic Drive"
	}),
	definition({
		id: "igdrive",
		category: "sys",
		tier: 3,
		family: "drive",
		hue: "#ff7ae8",
		name: "Intergalactic Drive",
		description: "Crosses the dark between galaxies",
		stardustCost: 150,
		materialCost: { Pt: 2 },
		partCost: {
			coil: 3,
			fuelcell: 2,
			navcore: 1
		},
		prerequisiteId: "array",
		effects: {},
		unlock: "Intergalactic travel — the frontier ladder opens (Prime Codex Signatures extend it)"
	}),
	definition({
		id: "autoext",
		category: "sys",
		tier: 3,
		family: "rig",
		hue: "#c2a878",
		name: "Auto-Extractor",
		description: "Keeps pulling ore at every world you have mined, even while you are away",
		stardustCost: 40,
		materialCost: {},
		partCost: {
			servo: 2,
			navcore: 1,
			cell: 1
		},
		effects: { auto: 1 }
	}),
	definition({
		id: "cscoop",
		category: "sys",
		tier: 3,
		family: "scoop",
		hue: "#ffcf6a",
		name: "Corona Scoop",
		description: "A magnetic ladle the size of a city — drinks deeper from every star, shielded against the dead ones",
		stardustCost: 40,
		materialCost: { Pls: 1 },
		partCost: {
			coil: 2,
			lens: 1,
			cell: 1
		},
		prerequisiteId: "jumpdrive",
		effects: {
			skim: 1,
			skimguard: 1
		},
		unlock: "Deeper coronas, +1 sample per skim — and remnant stars no longer burn"
	}),
	definition({
		id: "rig1",
		category: "gear",
		slot: "tool",
		tier: 1,
		family: "rig",
		hue: "#c2a878",
		name: "Mining Rig I",
		description: "Powered pick — every pull takes half again as much",
		materialCost: {},
		partCost: {
			servo: 1,
			plate: 1
		},
		effects: { yield: .5 }
	}),
	definition({
		id: "rig2",
		category: "gear",
		slot: "tool",
		tier: 2,
		family: "rig",
		hue: "#ffd96a",
		name: "Mining Rig II",
		description: "Twin-head bore — doubles every haul",
		materialCost: { W: 2 },
		partCost: {
			servo: 1,
			frame: 1,
			cell: 1
		},
		prerequisiteId: "rig1",
		effects: { yield: 1 }
	}),
	definition({
		id: "rig3",
		category: "gear",
		slot: "tool",
		tier: 3,
		family: "rig",
		hue: "#ff7ae8",
		name: "Plasma Bore III",
		description: "Cuts stone like water — triple hauls, and rich strikes come oftener",
		materialCost: {
			Ir: 1,
			U: 2
		},
		partCost: {
			servo: 2,
			coil: 1
		},
		prerequisiteId: "rig2",
		effects: {
			yield: 2,
			strike: .04
		}
	}),
	definition({
		id: "fieldsuit",
		category: "gear",
		slot: "suit",
		tier: 1,
		family: "suit",
		hue: "#9fb6d6",
		name: "Field Suit",
		description: "Sealed exploration shell — hostile bioscans bite lighter",
		materialCost: {},
		partCost: {
			weave: 2,
			plate: 1
		},
		effects: {
			scut: .25,
			land: 5
		}
	}),
	definition({
		id: "hazmat",
		category: "gear",
		slot: "suit",
		tier: 2,
		family: "suit",
		hue: "#9fe06a",
		name: "Hazmat Suit",
		description: "Walks through what kills — bioscan wounds nearly halved",
		materialCost: { S: 2 },
		partCost: {
			weave: 2,
			cell: 1
		},
		prerequisiteId: "fieldsuit",
		effects: {
			scut: .45,
			land: 8
		}
	}),
	definition({
		id: "thermal",
		category: "gear",
		slot: "suit",
		tier: 3,
		family: "suit",
		hue: "#ff8a72",
		name: "Thermal Weave",
		description: "Laughs at molten shores — ember and acid worlds open up",
		materialCost: {
			W: 2,
			S: 2
		},
		partCost: {
			weave: 2,
			hullseg: 1
		},
		prerequisiteId: "hazmat",
		effects: {
			scut: .45,
			land: 10,
			landfam: {
				lava: 30,
				venus: 30
			}
		}
	}),
	definition({
		id: "presshull",
		category: "gear",
		slot: "suit",
		tier: 3,
		family: "suit",
		hue: "#cdb8ec",
		name: "Pressure Shell",
		description: "Holds its shape where the sky crushes — gas and acid decks open up",
		materialCost: { Pb: 2 },
		partCost: {
			weave: 1,
			hullseg: 2
		},
		prerequisiteId: "hazmat",
		effects: {
			scut: .45,
			land: 10,
			landfam: {
				gas: 30,
				venus: 30
			}
		}
	}),
	definition({
		id: "cryoline",
		category: "gear",
		slot: "suit",
		tier: 3,
		family: "suit",
		hue: "#8fd6ff",
		name: "Cryo Lining",
		description: "Warm to the last ridge of the ice — frozen worlds open up",
		materialCost: {},
		partCost: {
			weave: 1,
			cryocap: 2
		},
		prerequisiteId: "hazmat",
		effects: {
			scut: .45,
			land: 10,
			landfam: { ice: 30 }
		}
	}),
	definition({
		id: "struts",
		category: "gear",
		slot: "module",
		tier: 1,
		family: "struts",
		hue: "#aab2c2",
		name: "Landing Struts",
		description: "Wave-off scrapes hurt less",
		materialCost: {},
		partCost: {
			frame: 1,
			plate: 1
		},
		effects: {
			struts: 2,
			land: 5
		}
	}),
	definition({
		id: "stabil",
		category: "gear",
		slot: "module",
		tier: 2,
		family: "struts",
		hue: "#ffd96a",
		name: "Descent Stabilizers",
		description: "Reads the storm on the way down — landings markedly safer",
		materialCost: {},
		partCost: {
			servo: 1,
			navcore: 1
		},
		prerequisiteId: "struts",
		effects: {
			struts: 3,
			land: 15
		}
	}),
	definition({
		id: "anchor",
		category: "gear",
		slot: "module",
		tier: 3,
		family: "anchor",
		hue: "#3fe8c8",
		name: "Gravitic Anchor",
		description: "The ground comes to YOU — no descent can wave you off",
		materialCost: {
			Nd: 1,
			U: 1
		},
		partCost: {
			coil: 2,
			navcore: 1
		},
		prerequisiteId: "stabil",
		effects: { land100: 1 }
	}),
	definition({
		id: "headlamp",
		category: "gear",
		slot: "helmet",
		tier: 1,
		family: "helm",
		hue: "#ffd96a",
		name: "Miner’s Headlamp",
		description: "Light finds what shadow hid — rich strikes come a little oftener",
		materialCost: {},
		partCost: {
			lens: 1,
			cell: 1
		},
		effects: { strike: .02 }
	}),
	definition({
		id: "visor",
		category: "gear",
		slot: "helmet",
		tier: 2,
		family: "helm",
		hue: "#9fdfe8",
		name: "Scout Visor",
		description: "Reads the danger before it reads you — field wounds bite lighter",
		materialCost: {},
		partCost: {
			lens: 1,
			chip: 1,
			weave: 1
		},
		prerequisiteId: "headlamp",
		effects: { scut: .15 }
	}),
	definition({
		id: "voidhelm",
		category: "gear",
		slot: "helmet",
		tier: 3,
		family: "helm",
		hue: "#3fe8c8",
		name: "Voidglass Visor",
		description: "Ground from a glass desert&#8217;s lightning-fused sand — near-immune eyes",
		materialCost: { Vg: 1 },
		partCost: {
			lens: 1,
			hullseg: 1
		},
		prerequisiteId: "visor",
		effects: {
			scut: .25,
			strike: .02
		}
	}),
	definition({
		id: "earpiece",
		category: "gear",
		slot: "ears",
		tier: 1,
		family: "probe",
		hue: "#7fd0ff",
		name: "Comms Earpiece",
		description: "Hears the hesitation in a wary hail — first contact lands oftener",
		materialCost: {},
		partCost: {
			wire: 1,
			chip: 1
		},
		effects: { contact: 10 }
	}),
	definition({
		id: "resonator",
		category: "gear",
		slot: "ears",
		tier: 2,
		family: "probe",
		hue: "#b58cff",
		name: "Vein Resonator",
		description: "Sings to buried metal — rich strikes come far oftener",
		materialCost: {},
		partCost: {
			chip: 2,
			coil: 1
		},
		effects: { strike: .06 }
	}),
	definition({
		id: "meteor",
		category: "gear",
		slot: "necklace",
		tier: 1,
		family: "charm",
		hue: "#ffd96a",
		name: "Meteorite Pendant",
		description: "A lucky stone from before the worlds — strikes run a little richer",
		materialCost: {
			Ni: 2,
			C: 1
		},
		effects: { strike: .02 }
	}),
	definition({
		id: "compass",
		category: "gear",
		slot: "necklace",
		tier: 2,
		family: "charm",
		hue: "#7fd0ff",
		name: "Star Compass",
		description: "Always knows the way home — hyperlanes run quicker",
		materialCost: { Ag: 1 },
		partCost: {
			lens: 1,
			wire: 1
		},
		effects: { speed: 1 }
	}),
	definition({
		id: "diplobeacon",
		category: "gear",
		slot: "necklace",
		tier: 2,
		family: "beacon",
		hue: "#cdbcff",
		name: "Diplomat’s Beacon",
		description: "Broadcasts peaceful intent — first contact lands far more often",
		materialCost: { Au: 1 },
		partCost: {
			lens: 1,
			chip: 1,
			cell: 1
		},
		effects: { contact: 20 }
	}),
	definition({
		id: "prismpendant",
		category: "gear",
		slot: "necklace",
		tier: 3,
		family: "charm",
		hue: "#ff7ae8",
		name: "Prismatic Pendant",
		description: "A cut of pure Prismatium from a magma sea — luck bends around it",
		materialCost: { Pz: 1 },
		partCost: { lens: 1 },
		effects: {
			contact: 10,
			heal: .2,
			strike: .02
		}
	}),
	definition({
		id: "gripgloves",
		category: "gear",
		slot: "gloves",
		tier: 1,
		family: "glove",
		hue: "#c2a878",
		name: "Grip Gloves",
		description: "Ore comes up easier when the hands don&#8217;t slip",
		materialCost: {},
		partCost: {
			weave: 1,
			plate: 1
		},
		effects: { yield: .25 }
	}),
	definition({
		id: "surgeon",
		category: "gear",
		slot: "gloves",
		tier: 2,
		family: "glove",
		hue: "#7fe6a0",
		name: "Surgeon’s Gloves",
		description: "Flora meals mend the explorer harder",
		materialCost: {},
		partCost: {
			weave: 2,
			cryogel: 1
		},
		prerequisiteId: "gripgloves",
		effects: { heal: .35 }
	}),
	definition({
		id: "fieldlegs",
		category: "gear",
		slot: "legs",
		tier: 1,
		family: "legs",
		hue: "#9fb6d6",
		name: "Field Leggings",
		description: "Woven filament from ankle to hip — field wounds bite lighter",
		materialCost: {},
		partCost: { weave: 2 },
		effects: { scut: .1 }
	}),
	definition({
		id: "greaves",
		category: "gear",
		slot: "legs",
		tier: 2,
		family: "legs",
		hue: "#ffd96a",
		name: "Stabilizer Greaves",
		description: "Braced for the drop — landings steadier, scrapes shallower",
		materialCost: {},
		partCost: {
			frame: 1,
			weave: 1
		},
		prerequisiteId: "fieldlegs",
		effects: {
			land: 5,
			struts: 1
		}
	}),
	definition({
		id: "magboots",
		category: "gear",
		slot: "boots",
		tier: 1,
		family: "boot",
		hue: "#aab2c2",
		name: "Mag-Boots",
		description: "The ground holds you the moment you touch it — landings land",
		materialCost: {},
		partCost: {
			plate: 1,
			weave: 1
		},
		effects: { land: 5 }
	}),
	definition({
		id: "gravboots",
		category: "gear",
		slot: "boots",
		tier: 3,
		family: "boot",
		hue: "#3fe8c8",
		name: "Graviton Boots",
		description: "Woven around geode-world neodymium — the fall never wins",
		materialCost: { Nd: 1 },
		partCost: {
			coil: 1,
			weave: 1
		},
		prerequisiteId: "magboots",
		effects: {
			land: 10,
			struts: 1
		}
	}),
	definition({
		id: "rl-stone",
		category: "relic",
		slot: "suit",
		tier: 3,
		family: "suit",
		hue: "#c9a878",
		name: "Graven Aegis",
		description: "Beacon I&#8217;s hull plating, re-forged — the ground itself argues on your side",
		materialCost: {
			Fe: 8,
			W: 4,
			Nd: 1
		},
		partCost: { hullseg: 1 },
		signatureId: "stone",
		effects: {
			scut: .45,
			struts: 2
		}
	}),
	definition({
		id: "rl-ocean",
		category: "relic",
		slot: "boots",
		tier: 3,
		family: "boot",
		hue: "#4fc8e8",
		name: "Tidewalker Boots",
		description: "Beacon II&#8217;s keeper walked out under the sea and never slipped once",
		materialCost: {
			H2O: 8,
			Ti: 4
		},
		partCost: {
			weave: 1,
			servo: 1
		},
		signatureId: "ocean",
		effects: {
			land: 6,
			struts: 1
		}
	}),
	definition({
		id: "rl-flame",
		category: "relic",
		slot: "gloves",
		tier: 3,
		family: "glove",
		hue: "#ff7a4a",
		name: "Emberforged Gauntlets",
		description: "Pulled glowing from Beacon III&#8217;s wreck — they remember the heat of the strike",
		materialCost: {
			S: 6,
			Fe: 6,
			Pz: 1
		},
		partCost: { servo: 1 },
		signatureId: "flame",
		effects: {
			yield: .2,
			strike: .08
		}
	}),
	definition({
		id: "rl-sky",
		category: "relic",
		slot: "module",
		tier: 3,
		family: "drive",
		hue: "#8fd6ff",
		name: "Skysail Module",
		description: "Beacon IV&#8217;s storm-rig — it reads every deck and rides the fastest lane",
		materialCost: {
			H: 8,
			He3: 2
		},
		partCost: {
			coil: 1,
			navcore: 1
		},
		signatureId: "sky",
		effects: {
			speed: 1,
			land: 4
		}
	}),
	definition({
		id: "rl-life",
		category: "relic",
		slot: "necklace",
		tier: 3,
		family: "charm",
		hue: "#7fe6a0",
		name: "Verdant Locket",
		description: "A seed from Beacon V&#8217;s canopy, still green — meals mend far past their measure",
		materialCost: {
			O: 6,
			H2O: 6
		},
		partCost: { cryogel: 1 },
		signatureId: "life",
		effects: { heal: .3 }
	}),
	definition({
		id: "rl-mind",
		category: "relic",
		slot: "ears",
		tier: 3,
		family: "chip",
		hue: "#c79fff",
		name: "Mindreader Coil",
		description: "Tuned to the voice that answered Beacon VI — first contact hears you coming",
		materialCost: {
			Si: 8,
			Ir: 2
		},
		partCost: {
			chip: 1,
			wire: 1
		},
		signatureId: "mind",
		effects: { contact: 12 }
	}),
	definition({
		id: "rl-star",
		category: "relic",
		slot: "helmet",
		tier: 3,
		family: "helm",
		hue: "#ffd96a",
		name: "Starcrowned Helm",
		description: "Beacon VII&#8217;s lens, set in gold — it finds the bright seam in anything",
		materialCost: {
			Au: 4,
			Pt: 2
		},
		partCost: { lens: 1 },
		signatureId: "star",
		effects: {
			strike: .1,
			contact: 4
		}
	}),
	definition({
		id: "rl-void",
		category: "relic",
		slot: "legs",
		tier: 3,
		family: "legs",
		hue: "#9a8aff",
		name: "Voidwoven Leggings",
		description: "Cut from what came back of Beacon VIII — half here, half elsewhere, all yours",
		materialCost: {
			C: 6,
			Ir: 2
		},
		partCost: { weave: 2 },
		signatureId: "void",
		effects: {
			scut: .15,
			speed: 1
		}
	}),
	definition({
		id: "rl-prism",
		category: "relic",
		slot: "tool",
		tier: 3,
		family: "rig",
		hue: "#ff7ae8",
		name: "Prismatic Lathe",
		description: "Beacon IX&#8217;s last word, made a tool — it takes the color no one could name",
		materialCost: {
			Vg: 1,
			Pm: 1,
			Pz: 1
		},
		partCost: {
			coil: 1,
			servo: 1
		},
		signatureId: "prism",
		effects: {
			yield: 1.5,
			strike: .12
		}
	}),
	definition({
		id: "cg-proto",
		category: "gear",
		slot: "suit",
		tier: 4,
		rar: 8,
		family: "suit",
		hue: "#c8e06a",
		name: "Protomatter Carapace",
		description: "First-matter, poured into a shell that remembers being a world — nothing gets through it easily",
		materialCost: {
			Pro: 1,
			Ti: 6,
			W: 4
		},
		partCost: { hullseg: 2 },
		effects: {
			scut: .55,
			land: 12
		}
	}),
	definition({
		id: "cg-genesis",
		category: "gear",
		slot: "necklace",
		tier: 4,
		rar: 8,
		family: "charm",
		hue: "#bfeaff",
		name: "Genesis Locket",
		description: "A bead of ice older than the Sun — every meal mends as if life itself were owed to you",
		materialCost: {
			Pri: 1,
			H2O: 8,
			O: 6
		},
		partCost: { cryocap: 1 },
		effects: { heal: .5 }
	}),
	definition({
		id: "cg-void",
		category: "gear",
		slot: "legs",
		tier: 5,
		rar: 9,
		family: "legs",
		hue: "#8a5cff",
		name: "Void-Phase Greaves",
		description: "Woven through with a thread of pure absence — half your steps land in a place harm cannot follow",
		materialCost: {
			Voe: 1,
			C: 8,
			Ir: 3
		},
		partCost: { weave: 2 },
		effects: {
			scut: .28,
			speed: 1
		}
	}),
	definition({
		id: "cg-chron",
		category: "gear",
		slot: "module",
		tier: 5,
		rar: 9,
		family: "drive",
		hue: "#4fe0d0",
		name: "Chronal Drive",
		description: "A shard of frozen time, geared to a hull — the fastest lane is the one you take before you arrive",
		materialCost: {
			Chr: 1,
			He3: 4,
			Pt: 2
		},
		partCost: {
			coil: 2,
			navcore: 1
		},
		effects: {
			speed: 2,
			land: 6
		}
	}),
	definition({
		id: "cg-dark",
		category: "gear",
		slot: "tool",
		tier: 5,
		rar: 9,
		family: "rig",
		hue: "#6a4a8a",
		name: "Dark Matter Bore",
		description: "A drill wound around a knot of the universe&#8217;s hidden mass — it finds the seam in everything",
		materialCost: {
			Dkm: 1,
			W: 6,
			Ir: 3
		},
		partCost: { servo: 2 },
		effects: {
			yield: 2.5,
			strike: .1
		}
	}),
	definition({
		id: "cg-plasma",
		category: "gear",
		slot: "gloves",
		tier: 5,
		rar: 7,
		family: "glove",
		hue: "#ffe27a",
		name: "Plasma Gauntlets",
		description: "Star-fire held in a glove — the richest seam opens at a touch, and nothing bites back",
		materialCost: {
			Pls: 1,
			W: 4,
			Au: 3
		},
		partCost: { servo: 1 },
		effects: {
			yield: .4,
			strike: .1
		}
	}),
	definition({
		id: "cg-corona",
		category: "gear",
		slot: "suit",
		tier: 5,
		rar: 7,
		family: "suit",
		hue: "#ff9d4a",
		name: "Coronal Aegis",
		description: "A weave of stabilized corona — it drinks the heat of any world before it reaches you",
		materialCost: {
			Crn: 1,
			Ti: 6,
			Ir: 2
		},
		partCost: { hullseg: 1 },
		effects: {
			scut: .5,
			land: 10,
			skimguard: 1
		}
	})
]);
deepFreeze$1(LOOT_CATALOGUE_V1.filter((candidate) => candidate.inventoryShape === "stackable"));
deepFreeze$1(LOOT_CATALOGUE_V1.filter((candidate) => candidate.inventoryShape === "slotted"));
new Map(LOOT_CATALOGUE_V1.map((candidate) => [candidate.id, candidate]));
//#endregion
//#region ../celestial-frontier-anthropic-mac/port/v2/packages/domain/loot/src/gear.ts
const GEAR_SOURCE_KINDS = Object.freeze([
	"craft",
	"conquest",
	"guardian",
	"expedition",
	"discovery",
	"legacy-migration"
]);
const SOURCE_PREFIX = "loot1";
const OPTIONAL_SOURCE_SENTINEL = "";
const MAX_ACTION_COMPONENT_CHARS = 192;
const MAX_PROVENANCE_ID_CHARS = 512;
const MAX_SOURCE_ACTION_ID_CHARS = 2048;
function checkedIdentityText(value, maxChars, label) {
	const scalars = typeof value === "string" ? [...value] : [];
	if (typeof value !== "string" || scalars.length < 1 || scalars.length > maxChars || /[\u0000-\u001f\u007f]/.test(value) || scalars.some((character) => character.length === 1 && character.charCodeAt(0) >= 55296 && character.charCodeAt(0) <= 57343)) throw new RangeError(`${label} must be 1–${maxChars} printable scalar characters`);
	return value;
}
function encodedIdentityText(value, maxChars, label) {
	return encodeURIComponent(checkedIdentityText(value, maxChars, label));
}
function optionalEncodedIdentityText(value, label) {
	return value === void 0 ? OPTIONAL_SOURCE_SENTINEL : encodedIdentityText(value, MAX_PROVENANCE_ID_CHARS, label);
}
function checkedSourceKind(value) {
	if (typeof value !== "string" || !GEAR_SOURCE_KINDS.includes(value)) throw new RangeError("gear source kind is not supported");
	return value;
}
function makeGearSourceActionId(identity) {
	if (!identity || typeof identity !== "object") throw new TypeError("gear action identity is required");
	const kind = checkedSourceKind(identity.kind);
	const ownerId = encodedIdentityText(identity.ownerId, MAX_ACTION_COMPONENT_CHARS, "gear source ownerId");
	const actionKey = encodedIdentityText(identity.actionKey, MAX_ACTION_COMPONENT_CHARS, "gear source actionKey");
	const worldId = optionalEncodedIdentityText(identity.worldId, "gear provenance worldId");
	const missionId = optionalEncodedIdentityText(identity.missionId, "gear provenance missionId");
	const receiptId = optionalEncodedIdentityText(identity.receiptId, "gear provenance receiptId");
	const sourceActionId = `${SOURCE_PREFIX}|${kind}|${ownerId}|${actionKey}|${worldId}|${missionId}|${receiptId}`;
	if (sourceActionId.length > MAX_SOURCE_ACTION_ID_CHARS) throw new RangeError("sourceActionId exceeds its bounded canonical encoding");
	return sourceActionId;
}
const LEGACY_AFFIX_DEFINITIONS = deepFreeze$1([
	{
		key: "yield",
		percent: true,
		min: .1,
		max: .35,
		label: "mining yield"
	},
	{
		key: "strike",
		percent: true,
		min: .02,
		max: .06,
		label: "rich-strike chance"
	},
	{
		key: "scut",
		percent: true,
		min: .08,
		max: .25,
		label: "lighter bioscan wounds"
	},
	{
		key: "contact",
		percent: false,
		min: 4,
		max: 12,
		label: "first-contact & capture"
	},
	{
		key: "land",
		percent: false,
		min: 4,
		max: 12,
		label: "descent safety"
	},
	{
		key: "heal",
		percent: true,
		min: .08,
		max: .2,
		label: "flora healing"
	}
]);
const EXCEPTIONAL_CRAFT_EFFECT_KEYS_V1 = Object.freeze([
	"yield",
	"strike",
	"contact"
]);
deepFreeze$1(LEGACY_AFFIX_DEFINITIONS.filter((definitionValue) => EXCEPTIONAL_CRAFT_EFFECT_KEYS_V1.includes(definitionValue.key)).map((definitionValue) => ({
	id: `exceptional-v1:${definitionValue.key}`,
	effectKey: definitionValue.key,
	key: definitionValue.key,
	percent: definitionValue.percent,
	min: definitionValue.min,
	max: definitionValue.max,
	label: definitionValue.label
})));
//#endregion
//#region ../celestial-frontier-anthropic-mac/port/v2/packages/domain/loot/src/recipe.ts
const LEGACY_MATERIAL_IDS_V1 = Object.freeze([
	"Fe",
	"Si",
	"Mg",
	"Al",
	"Ca",
	"Na",
	"Ni",
	"Ti",
	"Cu",
	"Zn",
	"Sn",
	"Mn",
	"Cr",
	"Pb",
	"W",
	"H",
	"He",
	"C",
	"N",
	"O",
	"S",
	"P",
	"Cl",
	"H2O",
	"CH4",
	"NH3",
	"CO2",
	"He3",
	"Ag",
	"Au",
	"Pt",
	"Ir",
	"U",
	"Th",
	"Li",
	"Co",
	"Nd",
	"Pm",
	"Vg",
	"Pz",
	"Pls",
	"Crn",
	"Pro",
	"Pri",
	"Voe",
	"Chr",
	"Dkm"
]);
const LEGACY_SIGNATURE_IDS_V1 = Object.freeze([
	"stone",
	"ocean",
	"flame",
	"sky",
	"life",
	"mind",
	"star",
	"void",
	"prism"
]);
new Set(LEGACY_MATERIAL_IDS_V1);
new Set(LEGACY_SIGNATURE_IDS_V1);
new Set(LOOT_CATALOGUE_V1.map(({ id }) => id));
//#endregion
//#region ../celestial-frontier-anthropic-mac/port/v2/packages/domain/loot/src/economy-ledger.ts
const LEGACY_RESEARCH_SINKS_V1 = deepFreeze$1([
	{
		id: "scan1",
		materialCost: {
			Fe: 6,
			Si: 4
		},
		stardustCost: 20,
		prerequisiteId: null,
		jumpDriveRequired: true
	},
	{
		id: "hull1",
		materialCost: {
			Ti: 5,
			Fe: 8
		},
		stardustCost: 40,
		prerequisiteId: null,
		jumpDriveRequired: false
	},
	{
		id: "lab1",
		materialCost: {
			C: 6,
			P: 3,
			H2O: 4
		},
		stardustCost: 60,
		prerequisiteId: null,
		jumpDriveRequired: false
	},
	{
		id: "drive1",
		materialCost: {
			H: 8,
			He3: 2,
			Fe: 4
		},
		stardustCost: 40,
		prerequisiteId: null,
		jumpDriveRequired: false
	},
	{
		id: "drive2",
		materialCost: {
			He3: 6,
			Pt: 2,
			U: 2
		},
		stardustCost: 120,
		prerequisiteId: "drive1",
		jumpDriveRequired: false
	},
	{
		id: "drive3",
		materialCost: {
			Pz: 1,
			Ir: 3,
			U: 4
		},
		stardustCost: 300,
		prerequisiteId: "drive2",
		jumpDriveRequired: false
	}
]);
new Set(LEGACY_MATERIAL_IDS_V1);
new Set(LOOT_CATALOGUE_V1.map(({ id }) => id));
new Set(LOOT_CATALOGUE_V1.flatMap(({ signatureId }) => signatureId === null ? [] : [signatureId]));
const RESEARCH_IDS$1 = Object.freeze(LEGACY_RESEARCH_SINKS_V1.map(({ id }) => id));
new Set(RESEARCH_IDS$1);
new Map(LOOT_CATALOGUE_V1.map(({ id }, index) => [id, index]));
makeGearSourceActionId({
	kind: "legacy-migration",
	ownerId: "save-v2-user",
	actionKey: "items-v1",
	receiptId: "migration:v4-v5"
});
new Map(LOOT_CATALOGUE_V1.map(({ id }, index) => [id, index]));
Object.freeze({
	rocky: Object.freeze([
		"Fe",
		"Si",
		"Mg",
		"Al",
		"Ni",
		"Ti",
		"Cu",
		"Cr",
		"Mn",
		"Ca"
	]),
	metal: Object.freeze([
		"Fe",
		"Ni",
		"Cu",
		"Ag",
		"Au",
		"Pt",
		"Ir",
		"W",
		"Co",
		"Zn"
	]),
	lava: Object.freeze([
		"S",
		"Fe",
		"W",
		"Ti",
		"U",
		"Th",
		"Cr",
		"Mn"
	]),
	ice: Object.freeze([
		"H2O",
		"CH4",
		"NH3",
		"CO2",
		"He3",
		"N",
		"O"
	]),
	desert: Object.freeze([
		"Si",
		"Fe",
		"Al",
		"Na",
		"Cl",
		"Li",
		"Sn",
		"Ca"
	]),
	gas: Object.freeze([
		"H",
		"He",
		"CH4",
		"NH3",
		"He3"
	]),
	venus: Object.freeze([
		"S",
		"CO2",
		"Cl",
		"P",
		"Pb",
		"Zn"
	]),
	dwarf: Object.freeze([
		"Si",
		"Ni",
		"Fe",
		"C",
		"H2O",
		"Sn"
	]),
	moon: Object.freeze([
		"Si",
		"Al",
		"Ti",
		"Fe",
		"He3",
		"Mg"
	])
});
Object.freeze([
	"Ag",
	"Au",
	"Pt",
	"Ir",
	"U",
	"Nd",
	"Pm",
	"Vg",
	"Pz"
]);
Object.freeze({
	geode: "Nd",
	carbon: "Pm",
	glass: "Vg",
	magmasea: "Pz"
});
Object.freeze(["Pro", "Pri"]);
Object.freeze([
	"Voe",
	"Chr",
	"Dkm"
]);
Object.freeze({
	B: "Pls",
	A: "Pls",
	G: "Pls",
	RG: "Pls",
	SG: "Pls",
	WD: "Crn",
	NS: "Crn",
	MAG: "Crn",
	BH: "Crn"
});
Number.MAX_SAFE_INTEGER;
const RESEARCH_IDS = Object.freeze([
	"scan1",
	"hull1",
	"lab1",
	"drive1",
	"drive2",
	"drive3"
]);
Object.freeze({
	resolveWorldAddress(candidate) {
		const resolved = resolveCF1WorldAddress(candidate);
		return resolved.ok ? resolved.address : null;
	},
	resolveStarAddress(candidate) {
		const resolved = resolveCF1StarAddress(candidate);
		return resolved.ok ? resolved.address : null;
	}
});
//#endregion
//#region ../celestial-frontier-anthropic-mac/port/v2/packages/domain/opportunity/src/planner.ts
const RESEARCH_PRESENTATION = Object.freeze({
	scan1: Object.freeze({
		name: "Deep Scanners",
		description: "Survey cards reveal a world’s mineral veins from orbit"
	}),
	hull1: Object.freeze({
		name: "Reinforced Hull",
		description: "Hostile bioscans wound you 25% lighter"
	}),
	lab1: Object.freeze({
		name: "Xenobotany Lab",
		description: "Eating flora grows the nourished stat by +1 more"
	}),
	drive1: Object.freeze({
		name: "Fusion Drive",
		description: "Hyperlanes run twice as quick"
	}),
	drive2: Object.freeze({
		name: "Antimatter Drive",
		description: "Hyperlanes run four times as quick — far jumps stop straining"
	}),
	drive3: Object.freeze({
		name: "Warp Fold",
		description: "Distance becomes a rumor — every jump arrives in a breath"
	})
});
function deepFreeze(value) {
	if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
	for (const child of Object.values(value)) deepFreeze(child);
	return Object.freeze(value);
}
const researchSinkById = new Map(LEGACY_RESEARCH_SINKS_V1.map((sink) => [sink.id, sink]));
deepFreeze(RESEARCH_IDS.map((id) => {
	const sink = researchSinkById.get(id);
	if (!sink) throw new Error(`research ${id} has no exact economy sink`);
	return {
		id,
		...RESEARCH_PRESENTATION[id],
		materialCost: sink.materialCost,
		stardustCost: sink.stardustCost,
		prerequisiteId: sink.prerequisiteId,
		jumpDriveRequired: sink.jumpDriveRequired,
		consumerStatus: "available"
	};
}));
new Set(LEGACY_MATERIAL_IDS_V1);
new Set(LOOT_CATALOGUE_V1.map(({ id }) => id));
new Set(LEGACY_SIGNATURE_IDS_V1);
Object.freeze([
	"address",
	"opportunity",
	"landing",
	"training"
]);
Object.freeze([
	Object.freeze({
		ownerId: "arc0-field-samples",
		version: 1
	}),
	Object.freeze({
		ownerId: "arc3-world-mining",
		version: 1
	}),
	Object.freeze({
		ownerId: "arc3-stellar-skimming",
		version: 1
	})
]);
Object.freeze(["receiptId", "activePlayMs"]);
new Map(LOOT_CATALOGUE_V1.map(({ id }, index) => [id, index]));
const ARC4_OWNERSHIP_MANIFEST_NAMESPACE = "arc4.ownership.manifest";
const ARC4_OWNERSHIP_PROGRESS_NAMESPACE = "arc4.ownership.progress";
const SEGMENT_ORDER = Object.freeze({
	player: 0,
	creatures: 1,
	catalog: 2,
	inventory: 3,
	settings: 4
});
const SHARD_GROUPS = Object.freeze([
	Object.freeze({
		kind: "catalogSpecies",
		segment: "catalog",
		prefix: "arc4.ownership.catalog"
	}),
	Object.freeze({
		kind: "discoveries",
		segment: "catalog",
		prefix: "arc4.ownership.discoveries"
	}),
	Object.freeze({
		kind: "creatures",
		segment: "creatures",
		prefix: "arc4.ownership.creatures"
	}),
	Object.freeze({
		kind: "specimenLots",
		segment: "inventory",
		prefix: "arc4.ownership.specimens"
	})
]);
function targets() {
	const result = [Object.freeze({
		segment: "player",
		namespace: ARC4_OWNERSHIP_MANIFEST_NAMESPACE
	}), Object.freeze({
		segment: "player",
		namespace: ARC4_OWNERSHIP_PROGRESS_NAMESPACE
	})];
	for (const group of SHARD_GROUPS) for (let index = 0; index < 4; index++) result.push(Object.freeze({
		segment: group.segment,
		namespace: `${group.prefix}.${index}`
	}));
	result.sort((left, right) => SEGMENT_ORDER[left.segment] - SEGMENT_ORDER[right.segment] || (left.namespace < right.namespace ? -1 : left.namespace > right.namespace ? 1 : 0));
	return Object.freeze(result);
}
const ARC4_OWNERSHIP_EXTENSION_TARGETS = targets();
new Set(ARC4_OWNERSHIP_EXTENSION_TARGETS.map(({ segment, namespace }) => `${segment}\u0000${namespace}`));
Object.freeze({
	"bred-acquisition": 0,
	"source-creature-live": 1,
	"source-creature-tombstone": 2,
	"bred-creature-live": 3,
	"bred-creature-tombstone": 4,
	"source-specimen-live": 5,
	"source-specimen-tombstone": 6,
	"scout-override": 7
});
if (canonicalJson({
	schema: "cf-v2-ownership-delta/v1",
	version: 1,
	rows: []
}) !== "{\"rows\":[],\"schema\":\"cf-v2-ownership-delta/v1\",\"version\":1}") throw new Error("empty ownership delta canonical bytes drifted");
const ARC5_OWNERSHIP_MIGRATION_NAMESPACE = "arc5.ownership.migration";
const ARC5_OWNERSHIP_DELTA_PREFIX = "arc5.ownership.delta.";
const ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET = Object.freeze({
	segment: "player",
	namespace: ARC5_OWNERSHIP_MIGRATION_NAMESPACE
});
const ARC5_OWNERSHIP_EXTENSION_TARGETS = Object.freeze([ARC5_OWNERSHIP_MIGRATION_EXTENSION_TARGET, ...Array.from({ length: 4 }, (_, index) => Object.freeze({
	segment: "creatures",
	namespace: `${ARC5_OWNERSHIP_DELTA_PREFIX}${index}`
}))]);
new Set(ARC5_OWNERSHIP_EXTENSION_TARGETS.map(({ segment, namespace }) => `${segment}\u0000${namespace}`));
Object.freeze({
	...OWNERSHIP_DATA_BUDGET,
	maxStringLength: V5_MAX_EXTENSION_JSON_BYTES,
	maxCharacters: 12e5
});
Object.freeze([]);
Object.freeze({
	maxDepth: 4,
	maxNodes: 262160,
	maxKeys: 8,
	maxArrayLength: V5_MAX_EXTENSION_JSON_BYTES,
	maxStringLength: 64,
	maxCharacters: V5_MAX_EXTENSION_JSON_BYTES
});
Object.freeze([]);
Object.freeze([]);
Object.freeze([
	"hold",
	"swap",
	"withdraw"
]);
Object.freeze([
	"balanced",
	"press",
	"guard",
	"evade"
]);
Object.freeze([
	"st-land",
	"st-mine",
	"st-scan",
	"st-scout",
	"st-conq"
]);
/** The live weekly pool: every definition has a v2 event owner. Arc 6 owns conquest;
* species, feeding and breeding join when their owners report weekly progress. */
const WEEKLY_CHARTER_DEFINITIONS_V1 = Object.freeze([
	Object.freeze({
		id: "wk-land",
		event: "landfall",
		count: 3,
		title: "Boots on new ground",
		description: "Make planetfall on 3 worlds you have never landed on.",
		stardust: 20
	}),
	Object.freeze({
		id: "wk-mine",
		event: "mined",
		count: 3,
		title: "Deep veins",
		description: "Mine deposits 3 times.",
		stardust: 20
	}),
	Object.freeze({
		id: "wk-scan",
		event: "bioscan",
		count: 2,
		title: "Field naturalist",
		description: "Discover life on 2 worlds.",
		stardust: 25
	}),
	Object.freeze({
		id: "wk-craft",
		event: "crafted",
		count: 2,
		title: "Workshop hours",
		description: "Fabricate 2 items at the Shipyard.",
		stardust: 20
	}),
	Object.freeze({
		id: "wk-conq",
		event: "conquest",
		count: 1,
		title: "Claim new ground",
		description: "Conquer a world after accepting this Charter.",
		stardust: 30
	})
]);
new Map(WEEKLY_CHARTER_DEFINITIONS_V1.map((d) => [d.id, d]));
Object.freeze({
	schema: "cf-v2-combat-settlement-authority/v1",
	version: 1,
	battles: Object.freeze([]),
	conquests: Object.freeze([]),
	lossXp: Object.freeze([])
});
//#endregion
//#region ../celestial-frontier-anthropic-mac/port/v2/packages/persistence/src/world-identity.ts
const WORLD_IDENTITY_MANIFEST_NAMESPACE = "world.identity.manifest";
const WORLD_IDENTITY_SHARD_PREFIX = "world.identity.shard.";
Object.freeze([]);
Object.freeze([WORLD_IDENTITY_MANIFEST_NAMESPACE, ...Array.from({ length: 4 }, (_, index) => `${WORLD_IDENTITY_SHARD_PREFIX}${index}`)]);
Object.freeze({
	home: "landing:earth",
	curator: "atlas:first-favorite",
	civ: "survey:world-civilized",
	spacefar: "survey:world-spacefaring",
	sol: "survey:star-sol",
	binary: "survey:star-binary",
	seebh: "survey:star-black-hole",
	seens: "survey:star-neutron-star",
	seemag: "survey:star-magnetar",
	seewd: "survey:star-white-dwarf",
	seerg: "survey:star-red-giant",
	seesg: "survey:star-red-supergiant",
	seeproto: "survey:star-protostar",
	seebd: "survey:star-brown-dwarf",
	namer: "naming:first-discovery-name",
	bredlegend: "breed:legendary-pair",
	brink: "survival:below-twenty-hp",
	survivor: "survival:hostile-field-strike",
	fieldmedic: "care:flora-heal",
	gambler: "care:high-risk-flora-heal",
	share: "sharing:first-code-sent",
	wayfarer: "sharing:first-code-followed",
	worm: "travel:wormhole",
	quasar: "travel:quasar-galaxy",
	dwarfg: "travel:dwarf-galaxy"
});
Object.freeze({
	balanced: "Balanced",
	press: "Press — hit harder, take more",
	guard: "Guard — take less, blunt openers",
	evade: "Evade — dodge more, hit softer"
});
const PLAN_FORECAST_MEMO = /* @__PURE__ */ new Map();
/** The whole plan's Auto odds over deterministic sampled seeds (the same seed variation as the single forecast, across every fighter). */
function projectCombatPlanForecastV1(members, encounter, sampleSize = 160) {
	const fighters = members.map(({ champion, stance }) => {
		const projected = championCombatant(champion);
		return {
			projected,
			stance,
			stats: projected.stats ?? battleStats(projected.genome)
		};
	});
	const key = fighters.map((f) => `${statsSignature(f.projected.genome.seed >>> 0, f.stats)}:${f.stance}`).join("|") + `|${encounter.defender.battleGenome.seed >>> 0}|${sampleSize}`;
	const memo = PLAN_FORECAST_MEMO.get(key);
	if (memo !== void 0) return memo;
	let wins = 0, decisive = 0;
	for (let index = 0; index < sampleSize; index++) {
		const result = runEncounterV1({
			mode: "auto",
			defender: {
				name: encounter.defender.name,
				genome: encounter.defender.battleGenome,
				phase: encounterHasGuardianPhaseV1(encounter.defender.kind)
			},
			party: fighters.map((f) => ({
				name: f.projected.name,
				stance: f.stance,
				stats: f.stats,
				genome: {
					...f.projected.genome,
					seed: hashInt(f.projected.genome.seed >>> 0, index, 20974) >>> 0
				}
			}))
		});
		if (result.status !== "finished" || result.outcome === "draw" || result.outcome === "withdrawn") continue;
		decisive++;
		if (result.outcome === "party") wins++;
	}
	const probability = decisive > 0 ? wins / decisive : .5;
	const band = oddsBand(probability);
	const out = Object.freeze({
		probability,
		percent: oddsPercent(probability),
		band: band.band,
		color: band.color,
		sampleSize
	});
	if (PLAN_FORECAST_MEMO.size > 200) PLAN_FORECAST_MEMO.clear();
	PLAN_FORECAST_MEMO.set(key, out);
	return out;
}
function fnv1a32(text) {
	let hash = 2166136261;
	for (let index = 0; index < text.length; index++) {
		hash ^= text.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return (hash >>> 0).toString(36);
}
function statsSignature(seed, stats) {
	return [
		seed >>> 0,
		stats.vit,
		stats.fer,
		stats.res,
		stats.agi,
		stats.ins,
		stats.total,
		stats.lvl || 0,
		fnv1a32(JSON.stringify(stats.ab || null))
	].join(",");
}
function oddsBand(probability) {
	if (probability >= .75) return Object.freeze({
		band: "Favored",
		color: "#7fe6a0"
	});
	if (probability >= .45) return Object.freeze({
		band: "Even",
		color: "#ffd96a"
	});
	if (probability >= .15) return Object.freeze({
		band: "Dangerous",
		color: "#ff8a72"
	});
	return Object.freeze({
		band: "Overwhelming",
		color: "#ff5a4a"
	});
}
function oddsPercent(probability) {
	const rounded = Math.round(probability * 100);
	return rounded <= 0 ? "<1%" : rounded >= 100 ? ">99%" : `${rounded}%`;
}
function championCombatant(champion) {
	return champion.kind === "player" ? Object.freeze({
		name: champion.name,
		genome: Object.freeze({ seed: champion.genomeSeed }),
		stats: champion.stats,
		isPlayer: true
	}) : Object.freeze({
		name: champion.name,
		genome: champion.genome
	});
}
//#endregion
export { COMBAT_DEFEAT_RECOVERY_ACTIVE_MS_V1, COMBAT_DEFEAT_WOUND_STEP_V1, ENCOUNTER_GUARDIAN_PHASE_V1, ENCOUNTER_LEG_HALF_TURNS_V1, ENCOUNTER_LOW_HP_FRACTION_V1, ENCOUNTER_PARTY_MAX_V1, ENCOUNTER_SCHEMA_V1, ENCOUNTER_STANCES_V1, ENCOUNTER_STANCE_TUNING_V1, PRIME_SIGNATURE_IDS_V1, autoEncounterDecisionV1, battleStats, encounterHasGuardianPhaseV1, installCaptureHooks, makeGenome, projectCombatPlanForecastV1, projectGuardianPrimeEncounterV1, resolveCF1WorldAddress, runDuel, runEncounterV1 };
