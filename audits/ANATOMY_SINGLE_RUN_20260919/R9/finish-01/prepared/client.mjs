//#region port/v2/packages/art/src/earth-resident-plan.ts
/** Six complete original source genomes, with far-to-near contact anchors.
* Captured from the full canonical Earth epoch-0 roster in
* audits/AV_EARTH_LAYERED_SCENE_20260908/canonical-earth.json. */
const EARTH_RESIDENT_LAYER_PLAN_JSON_V1 = "{\"schema\":\"cf.art.earth-resident-layer.v1\",\"sceneId\":\"painted-earth-riverbank-v1\",\"width\":960,\"height\":430,\"worldKey\":\"CF1|g:999@90,-60|s:424242@560,170|p:133#2\",\"environmentFingerprint\":\"cwe1:148:50c1b7d6\",\"fullRosterFingerprint\":\"cwr1:19:6305:58e079f2\",\"residents\":[{\"name\":\"Civet\",\"kingdom\":\"fauna\",\"genome\":{\"seed\":3212817920,\"kingdom\":\"fauna\",\"color\":14,\"form\":12,\"body\":13,\"loco\":6,\"trait\":14,\"size\":4,\"diet\":5,\"head\":5,\"limbs\":3,\"skin\":8,\"tail\":1,\"pattern\":0,\"eyes\":5,\"behavior\":9,\"habitat\":5,\"detail\":4,\"accent\":3,\"temper\":1,\"sense\":7,\"repro\":7,\"life\":5,\"metab\":4,\"lumin\":true,\"gen\":0,\"heat\":1,\"_earthName\":\"Civet\",\"_cradle\":1},\"x\":0.72,\"groundY\":0.77,\"width\":0.15,\"flip\":false,\"family\":\"mammal\"},{\"name\":\"Persimmon\",\"kingdom\":\"flora\",\"genome\":{\"seed\":2058951517,\"kingdom\":\"flora\",\"color\":2,\"form\":17,\"body\":4,\"loco\":0,\"trait\":9,\"size\":3,\"diet\":2,\"head\":7,\"limbs\":1,\"skin\":7,\"tail\":1,\"pattern\":6,\"eyes\":1,\"behavior\":10,\"habitat\":5,\"detail\":9,\"accent\":2,\"temper\":4,\"sense\":3,\"repro\":5,\"life\":4,\"metab\":5,\"lumin\":false,\"gen\":0,\"heat\":1,\"_earthName\":\"Persimmon\",\"_cradle\":1},\"x\":0.13,\"groundY\":0.78,\"width\":0.21,\"flip\":false,\"family\":\"tree\"},{\"name\":\"Platypus\",\"kingdom\":\"fauna\",\"genome\":{\"seed\":4049771185,\"kingdom\":\"fauna\",\"color\":13,\"form\":14,\"body\":12,\"loco\":1,\"trait\":15,\"size\":2,\"diet\":4,\"head\":0,\"limbs\":0,\"skin\":6,\"tail\":4,\"pattern\":7,\"eyes\":0,\"behavior\":3,\"habitat\":9,\"detail\":8,\"accent\":16,\"temper\":7,\"sense\":4,\"repro\":6,\"life\":3,\"metab\":0,\"lumin\":false,\"gen\":0,\"heat\":1,\"_earthName\":\"Platypus\",\"_cradle\":1},\"x\":0.43,\"groundY\":0.86,\"width\":0.2,\"flip\":true,\"family\":\"mammal\"},{\"name\":\"Frog\",\"kingdom\":\"fauna\",\"genome\":{\"seed\":1193089256,\"kingdom\":\"fauna\",\"color\":0,\"form\":12,\"body\":10,\"loco\":11,\"trait\":19,\"size\":0,\"diet\":5,\"head\":9,\"limbs\":4,\"skin\":3,\"tail\":1,\"pattern\":4,\"eyes\":1,\"behavior\":0,\"habitat\":17,\"detail\":7,\"accent\":4,\"temper\":8,\"sense\":5,\"repro\":5,\"life\":0,\"metab\":2,\"lumin\":false,\"gen\":0,\"heat\":1,\"_earthName\":\"Frog\",\"_cradle\":1},\"x\":0.25,\"groundY\":0.87,\"width\":0.07,\"flip\":false,\"family\":\"amphibian\"},{\"name\":\"Devil's Club\",\"kingdom\":\"flora\",\"genome\":{\"seed\":1714376717,\"kingdom\":\"flora\",\"color\":14,\"form\":12,\"body\":2,\"loco\":0,\"trait\":11,\"size\":1,\"diet\":4,\"head\":8,\"limbs\":5,\"skin\":6,\"tail\":1,\"pattern\":7,\"eyes\":2,\"behavior\":3,\"habitat\":6,\"detail\":9,\"accent\":15,\"temper\":5,\"sense\":5,\"repro\":6,\"life\":5,\"metab\":1,\"lumin\":false,\"gen\":0,\"heat\":1,\"_earthName\":\"Devil's Club\",\"_cradle\":1},\"x\":0.87,\"groundY\":0.88,\"width\":0.16,\"flip\":false,\"family\":\"shrub\"},{\"name\":\"Cranberry\",\"kingdom\":\"flora\",\"genome\":{\"seed\":1741924755,\"kingdom\":\"flora\",\"color\":4,\"form\":4,\"body\":9,\"loco\":0,\"trait\":9,\"size\":3,\"diet\":1,\"head\":9,\"limbs\":3,\"skin\":0,\"tail\":5,\"pattern\":0,\"eyes\":5,\"behavior\":7,\"habitat\":0,\"detail\":4,\"accent\":10,\"temper\":7,\"sense\":9,\"repro\":2,\"life\":0,\"metab\":2,\"lumin\":false,\"gen\":0,\"heat\":1,\"_earthName\":\"Cranberry\",\"_cradle\":1},\"x\":0.34,\"groundY\":0.9,\"width\":0.11,\"flip\":false,\"family\":\"shrub\"}]}";
function deepFreeze$1(value) {
	if (value !== null && typeof value === "object") {
		for (const child of Object.values(value)) deepFreeze$1(child);
		Object.freeze(value);
	}
	return value;
}
deepFreeze$1(JSON.parse(EARTH_RESIDENT_LAYER_PLAN_JSON_V1));
/** Nick's one painted-composition experiment, 2026-09-12. Relative height is
* a composition choice, never a mutation of canonical genomes or vector layout. */
const EARTH_PAINTED_COMPOSITION_V1 = deepFreeze$1({
	id: "cf.art.earth-painted-contact.v1",
	residents: [
		{
			name: "Civet",
			height: .3
		},
		{
			name: "Persimmon",
			height: .42
		},
		{
			name: "Platypus",
			height: .18
		},
		{
			name: "Frog",
			width: .12,
			x: .23
		},
		{
			name: "Devil's Club",
			width: .16
		},
		{
			name: "Cranberry",
			width: .11
		}
	],
	foreground: {
		source: "same-plate-lower-band",
		crop: {
			x: 435,
			y: 400,
			width: 64,
			height: 64
		},
		placements: [{
			name: "Civet",
			centreAcrossBody: .74
		}, {
			name: "Platypus",
			centreAcrossBody: .4
		}],
		width: .09,
		height: .045,
		groundOffset: 3
	}
});
deepFreeze$1({
	...EARTH_PAINTED_COMPOSITION_V1,
	id: "cf.art.earth-painted-edge-runners.v1",
	interiorErosionPixels: 8,
	residents: EARTH_PAINTED_COMPOSITION_V1.residents.map((row) => row.name === "Cranberry" ? {
		...row,
		runners: [{
			x: .32,
			groundY: .91,
			width: .09,
			heightScale: .5,
			flip: false
		}, {
			x: .43,
			groundY: .93,
			width: .08,
			heightScale: .5,
			flip: true
		}]
	} : row)
});
deepFreeze$1({
	dropletCount: 3,
	specularStrength: 3,
	precipitationDensity: 2
});
deepFreeze$1({
	...EARTH_PAINTED_COMPOSITION_V1,
	id: "cf.art.earth-painted-weather-mat.v1",
	residents: EARTH_PAINTED_COMPOSITION_V1.residents.map((row) => row.name === "Cranberry" ? {
		...row,
		width: .16,
		mat: [{
			x: .315,
			groundY: .9,
			width: .11,
			heightScale: .75,
			flip: false
		}, {
			x: .365,
			groundY: .9,
			width: .11,
			heightScale: .75,
			flip: true
		}]
	} : row)
});
//#endregion
//#region port/v2/packages/domain/rand/src/index.ts
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
function clamp(v, a, b) {
	return v < a ? a : v > b ? b : v;
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
//#region port/v2/packages/domain/speciestraits/src/speciestraits.verbatim.js
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
Object.freeze({
	x: 90,
	y: -60
});
const GR = 1200;
Object.freeze({
	x: 560,
	y: 170
});
//#endregion
//#region port/v2/packages/domain/starcatalog/src/index.ts
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
//#region port/v2/packages/domain/naming/src/index.ts
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
//#region port/v2/packages/domain/planetgen/src/planetgen.verbatim.js
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
//#endregion
//#region port/v2/packages/domain/worldgen/src/worldgen.verbatim.js
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
makeNoise(8181);
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
Object.freeze([
	"address",
	"worldKey",
	"starSeed",
	"planetSeed",
	"planetOrdinal",
	"biosphereKey",
	"ecologyEpoch",
	"climateBand",
	"biomeProfileSchema",
	"biomeProfileDigest",
	"biomeProfileKey",
	"biomeProfile",
	"environmentFingerprint",
	"fullRosterFingerprint",
	"view"
]);
Object.freeze([
	"all",
	"preview",
	"total",
	"hiddenFromPreview"
]);
//#endregion
//#region port/v2/packages/domain/genome/src/genome.verbatim.js
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
//#endregion
//#region port/v2/packages/domain/genetics/src/genetics.verbatim.js
function evolveGenome(g, epochs) {
	if (!epochs) return g;
	let cur = { ...g };
	for (let e = 0; e < epochs; e++) {
		const r = mulberry32(hashInt((cur.seed ^ 57584) >>> 0, e, cur.gen));
		const muts = [
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
			"habitat"
		];
		const m = muts[r() * muts.length | 0];
		cur[m] = cur[m] + 1 + (r() * 2 | 0);
		if (r() < .15) cur.lumin = !cur.lumin;
		cur.gen = (cur.gen || 0) + 1;
		cur.seed = hashInt(cur.seed >>> 0, 14, e) >>> 0;
		cur.evolved = true;
	}
	return cur;
}
function crossGenome$1(a, b) {
	const seed = hashInt((a.seed ^ 42405) >>> 0, b.seed | 0, 7);
	const r = mulberry32(seed >>> 0);
	const src = {};
	const pick = (key, ka, kb) => {
		const useA = r() < .5;
		src[key] = useA ? 0 : 1;
		return useA ? ka : kb;
	};
	const g = {
		seed,
		kingdom: pick("kingdom", a.kingdom, b.kingdom),
		color: pick("color", a.color, b.color),
		form: pick("form", a.form, b.form),
		body: pick("body", a.body, b.body),
		loco: pick("loco", a.loco, b.loco),
		trait: pick("trait", a.trait, b.trait),
		size: pick("size", a.size, b.size),
		diet: pick("diet", a.diet, b.diet),
		head: pick("head", a.head || 0, b.head || 0),
		limbs: pick("limbs", a.limbs || 0, b.limbs || 0),
		skin: pick("skin", a.skin || 0, b.skin || 0),
		tail: pick("tail", a.tail || 0, b.tail || 0),
		pattern: pick("pattern", a.pattern || 0, b.pattern || 0),
		eyes: pick("eyes", a.eyes || 0, b.eyes || 0),
		behavior: pick("behavior", a.behavior || 0, b.behavior || 0),
		habitat: pick("habitat", a.habitat || 0, b.habitat || 0),
		detail: pick("detail", a.detail || 0, b.detail || 0),
		accent: pick("accent", a.accent || 0, b.accent || 0),
		lumin: r() < .5 ? a.lumin : b.lumin,
		gen: Math.max(a.gen, b.gen) + 1,
		heat: pick("heat", a.heat, b.heat),
		parents: [a.seed, b.seed]
	};
	if (r() < .85) {
		const muts = [
			"color",
			"form",
			"body",
			"loco",
			"trait",
			"size"
		];
		const m = muts[r() * muts.length | 0];
		g[m] = g[m] + 1 + (r() * 3 | 0);
	}
	if (r() < .2) g.lumin = !g.lumin;
	if (a.x && b.x) g.x = 1;
	if (a.aq && b.aq) g.aq = 1;
	if (a.af && b.af) g.af = 1;
	const _ae = a._earthName || a._earthBlend, _be = b._earthName || b._earthBlend;
	if (_ae || _be) {
		g._earthBlend = _ae && _be ? r() < .5 ? _ae : _be : _ae || _be;
		const pA = a._earthName ? 1 : a._anchorVal != null ? a._anchorVal : a._earthBlend ? .85 : 0;
		const pB = b._earthName ? 1 : b._anchorVal != null ? b._anchorVal : b._earthBlend ? .85 : 0;
		g._anchorVal = clamp(Math.max(pA, pB) - (.05 + (1 - Math.min(pA, pB)) * .22), .22, .9);
		g._src = src;
	}
	return g;
}
//#endregion
//#region port/v2/packages/domain/genetics/src/index.ts
const LINEAGE_TOKEN = "\0cf-lineage-v1:";
const EARTH_KINGDOMS = /* @__PURE__ */ new Set([
	"fauna",
	"flora",
	"fungi",
	"microbe"
]);
function lineageOf(parent) {
	const earthName = typeof parent._earthName === "string" && parent._earthName ? parent._earthName : "";
	const blend = typeof parent._earthBlend === "string" && parent._earthBlend ? parent._earthBlend : "";
	const name = earthName || blend;
	if (!name) return null;
	const recorded = !earthName && typeof parent._earthBlendKingdom === "string" ? parent._earthBlendKingdom : "";
	const inherited = EARTH_KINGDOMS.has(recorded) ? recorded : String(parent.kingdom || "");
	return {
		name,
		kingdom: EARTH_KINGDOMS.has(inherited) ? inherited : "fauna",
		field: earthName ? "_earthName" : "_earthBlend"
	};
}
function tokenFor(lineage) {
	return LINEAGE_TOKEN + JSON.stringify([lineage.kingdom, lineage.name]);
}
function encodedParent(parent, lineage) {
	if (!lineage) return parent;
	return {
		...parent,
		[lineage.field]: tokenFor(lineage)
	};
}
function decodeLineage(value) {
	if (typeof value !== "string" || !value.startsWith(LINEAGE_TOKEN)) return null;
	try {
		const decoded = JSON.parse(value.slice(15));
		if (!Array.isArray(decoded) || decoded.length !== 2 || typeof decoded[0] !== "string" || !EARTH_KINGDOMS.has(decoded[0]) || typeof decoded[1] !== "string" || !decoded[1]) return null;
		return {
			kingdom: decoded[0],
			name: decoded[1]
		};
	} catch {
		return null;
	}
}
/** Preserve the selected Earth parent's exact catalogue owner without changing
* the lifted RNG stream. The temporary set-qualified token participates only
* in the verbatim lineage-name pick; it is decoded before the child escapes. */
function crossGenome(a, b) {
	const parentA = a;
	const parentB = b;
	const lineageA = lineageOf(parentA);
	const lineageB = lineageOf(parentB);
	const child = crossGenome$1(encodedParent(parentA, lineageA), encodedParent(parentB, lineageB));
	const selected = decodeLineage(child._earthBlend);
	if (selected) {
		child._earthBlend = selected.name;
		child._earthBlendKingdom = selected.kingdom;
	}
	return child;
}
//#endregion
//#region port/v2/packages/domain/ecology/src/ecology.verbatim.js
function biosphere(P, sys, band, r) {
	if (P.seed === 133) return {
		level: "Abundant — flora and fauna (the home of humanity)",
		key: "earth"
	};
	if (sys && sys.sol) return {
		level: "No known life",
		key: "none"
	};
	if (P.seed === 134) return {
		level: "Possibly microbial (unconfirmed)",
		key: "microbial"
	};
	let level;
	if (P.type === "terran" && band === "temperate") level = r() < .82 ? "complex" : "flora";
	else if (P.type === "terran" && band === "cold") level = r() < .55 ? "sparse" : r() < .7 ? "flora" : "microbial";
	else if (P.type === "terran" && band === "hot") level = r() < .4 ? "sparse" : r() < .7 ? "microbial" : "none";
	else if (P.type === "ocean" && band === "temperate") level = r() < .78 ? "aquatic" : "flora";
	else if (P.type === "ocean" && band === "cold") level = r() < .55 ? "aquatic" : "subsurface";
	else if (P.type === "ocean" && band === "hot") {
		const v = r();
		level = v < .01 ? "xfauna" : v < .35 ? "microbial" : "none";
	} else if (P.type === "desert" && band === "temperate") {
		const v = r();
		level = v < .6 ? "sparse" : v < .615 ? "xfauna" : "microbial";
	} else if (P.type === "desert") {
		const v = r();
		level = v < .3 ? "sparse" : v < .315 ? "xfauna" : "microbial";
	} else if (P.type === "ice") {
		const v = r();
		level = v < .012 ? "xfauna" : v < .5 ? "subsurface" : r() < .7 ? "microbial" : "none";
	} else if (P.type === "rocky") {
		const v = r();
		level = v < .003 ? "xfauna" : v < .18 ? "microbial" : "none";
	} else if (P.type === "venus") {
		const v = r();
		level = v < .001 ? "xfauna" : v < .12 ? "aerial" : "none";
	} else if (P.type === "lava") {
		const v = r();
		level = v < 4e-4 ? "xfauna" : v < .1 ? "microbial" : "none";
	} else if (P.type === "gas") {
		const v = r();
		level = v < .0025 ? "xfauna" : v < .14 ? "aerial" : "none";
	} else level = "none";
	return {
		level: {
			complex: "Abundant — flora and fauna",
			flora: "Plant-like flora only",
			aquatic: "Aquatic ecosystems",
			sparse: "Sparse, hardy vegetation",
			microbial: "Microbial life only",
			subsurface: "Subsurface microbial life (in hidden seas)",
			aerial: "Airborne microbial life in the cloud layers",
			xfauna: "Extremophile fauna — life that should not be possible here",
			none: "No known life"
		}[level] || "No known life",
		key: level
	};
}
//#endregion
//#region port/v2/packages/domain/ecology/src/explicit-epoch.ts
const MAX_ECOLOGY_EPOCH = 1e4;
function checkedEcologyEpoch(value) {
	if (!Number.isSafeInteger(value) || value < 0 || value > 1e4) throw new RangeError(`ecology epoch must be an integer from 0 through ${MAX_ECOLOGY_EPOCH}`);
	return value;
}
const speciesMemo = /* @__PURE__ */ new Map();
/** Exact v1.8.9 planet-species formula with one deliberate ownership repair:
* the epoch is a required, validated argument instead of a free global read.
* The memo remains identity-observable and uses the legacy 49-entry steady
* state (`size > 48` before insertion), so callers must not mutate its rows. */
function planetSpeciesAtEcologyEpoch(planet, system, band, level, ecologyEpoch) {
	const epoch = checkedEcologyEpoch(ecologyEpoch);
	const memoKey = `${planet.seed}_${band}_${level}_${epoch}`;
	const memoized = speciesMemo.get(memoKey);
	if (memoized) return memoized;
	const random = mulberry32((planet.seed ^ 45317) >>> 0);
	const heat = band === "hot" ? 2 : band === "frozen" || band === "cold" ? 0 : 1;
	const baseAge = hashInt(planet.seed, 3, 9) % 5;
	const epochs = planet.seed === 133 ? 0 : baseAge + epoch;
	const list = [];
	let slot = 1;
	const add = (kingdom, speciesSlot) => {
		list.push(evolveGenome(makeGenome(hashInt(planet.seed, kingdom.charCodeAt(0), speciesSlot * 131 + 7), kingdom, heat), epochs));
	};
	const rich = .55 + random() * .9;
	const probability = (value) => Math.min(value * rich, .97);
	const many = (kingdom, base, extra, chance) => {
		let count = base;
		for (let index = 0; index < extra; index++) if (random() < chance) count++;
		for (let index = 0; index < count; index++) add(kingdom, slot++);
	};
	if (level === "complex") {
		many("flora", 3, 5, probability(.62));
		many("fungi", 1, 3, probability(.55));
		many("microbe", 2, 2, probability(.5));
		many("fauna", 5, 7, probability(.6));
	} else if (level === "flora") {
		many("flora", 2, 4, probability(.55));
		many("fungi", 1, 2, probability(.45));
		many("microbe", 1, 2, probability(.5));
	} else if (level === "aquatic") {
		many("flora", 2, 3, probability(.55));
		many("fauna", 4, 6, probability(.6));
		many("microbe", 2, 2, probability(.5));
	} else if (level === "sparse") {
		many("flora", 1, 3, probability(.5));
		many("fauna", 1, 4, probability(.45));
		many("microbe", 1, 2, probability(.5));
	} else if (level === "microbial" || level === "subsurface" || level === "aerial") {
		many("microbe", 2, 4, probability(.55));
		if (level === "subsurface" && random() < .4 * rich) many("fauna", 1, 2, probability(.35));
	} else if (level === "xfauna") {
		many("fauna", 1, 1, probability(.4));
		many("microbe", 2, 2, probability(.55));
		for (const genome of list) if (genome.kingdom === "fauna") genome.x = 1;
	}
	if (list.length >= 2 && rich > 1) {
		const hybridRandom = mulberry32((planet.seed ^ 18203) >>> 0);
		const hybridCount = hashInt(planet.seed, 9, 4) % 100 < (rich - 1) * 60 ? 1 : 0;
		for (let index = 0; index < hybridCount; index++) {
			const left = list[hybridRandom() * list.length | 0];
			const right = list[hybridRandom() * list.length | 0];
			if (left !== right) {
				const wild = crossGenome(left, right);
				wild.wild = true;
				list.push(wild);
			}
		}
	}
	if (level === "aquatic") {
		const aquaticCount = 1 + (mulberry32((planet.seed ^ 659216) >>> 0)() < .5 ? 1 : 0);
		for (let index = 0; index < aquaticCount; index++) {
			add("flora", 900 + index);
			list[list.length - 1].aq = 1;
		}
	} else if (level === "aerial") {
		if (mulberry32((planet.seed ^ 663312) >>> 0)() < .35) {
			add("flora", 920);
			list[list.length - 1].af = 1;
		}
	}
	if (speciesMemo.size > 48) {
		const oldest = speciesMemo.keys().next().value;
		speciesMemo.delete(oldest);
	}
	speciesMemo.set(memoKey, list);
	return list;
}
//#endregion
//#region port/v2/packages/domain/biome-profile/src/index.ts
const BIOME_PROFILE_SCHEMA_V1 = "cf.domain.biome-profile.v1";
const BIOME_PROFILE_KEYS_V1 = Object.freeze([
	"temperate",
	"savanna",
	"jungle",
	"marsh",
	"swamp",
	"mangrove",
	"tundra",
	"karst",
	"saltflat",
	"fungal",
	"crystalsteppe",
	"opensea",
	"archipelago",
	"coral",
	"stormsea",
	"volcisle",
	"abyssal",
	"milksea",
	"glacier",
	"packice",
	"cryogeyser",
	"blueice",
	"dunesea",
	"canyon",
	"saltpan",
	"oxide",
	"glass",
	"cratered",
	"boulder",
	"graben",
	"geode",
	"carbon",
	"sulfurdeck",
	"acidhaze",
	"abyssgreen",
	"ashwaste",
	"emberfield",
	"obsidian",
	"magmasea",
	"banded",
	"ammonia",
	"stormeye",
	"hotglow"
]);
const FAUNA = Object.freeze([
	"mammal",
	"bird",
	"insect",
	"amphibian",
	"primate",
	"reptile",
	"fish",
	"crust",
	"arachnid",
	"gastropod",
	"marine",
	"jelly",
	"ceph",
	"sessile"
]);
const FLORA = Object.freeze([
	"tree",
	"shrub",
	"flower",
	"grass",
	"fern",
	"vine",
	"palm",
	"moss",
	"cactus",
	"herb",
	"seaweed"
]);
const HAZARDS = Object.freeze([
	"drought",
	"mire",
	"cold",
	"sinkhole",
	"salt-glare",
	"spore",
	"shard",
	"storm",
	"ashfall",
	"pressure",
	"cryo-jet",
	"crevasse",
	"sandstorm",
	"flash-flood",
	"dust-devil",
	"glass-shard",
	"meteor",
	"rockfall",
	"fault",
	"soot",
	"acid",
	"heat",
	"ember",
	"magma",
	"megastorm"
]);
const WEATHER = Object.freeze([
	"mild",
	"dry-heat",
	"humid",
	"mist",
	"wind-cold",
	"still",
	"wind",
	"swell",
	"trade-wind",
	"calm",
	"squall",
	"lightless",
	"glow-calm",
	"steam-cold",
	"still-cold",
	"dry",
	"mirage-heat",
	"airless",
	"sulfur-storm",
	"acid-haze",
	"greenhouse",
	"ash",
	"ember-wind",
	"still-heat",
	"heat-shimmer",
	"band-wind",
	"pastel-cloud",
	"cyclone",
	"ember-cloud"
]);
function deepFreeze(value) {
	if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
		for (const child of Object.values(value)) deepFreeze(child);
		Object.freeze(value);
	}
	return value;
}
function oneOf(value, values, label) {
	if (typeof value !== "string" || !values.includes(value)) throw new TypeError(`biome profile: invalid ${label}`);
	return value;
}
function checkedProfile(value, key) {
	if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`biome profile: ${key} is not a profile object`);
	const source = value;
	const fields = Object.keys(source).sort();
	if (JSON.stringify(fields) !== JSON.stringify([
		"fauna",
		"flora",
		"hazard",
		"sig",
		"weather"
	])) throw new TypeError(`biome profile: ${key} has the wrong fields`);
	if (typeof source.sig !== "string" || !/^#[0-9a-f]{6}$/u.test(source.sig)) throw new TypeError(`biome profile: ${key} has an invalid signature color`);
	if (!Array.isArray(source.fauna) || !Array.isArray(source.flora)) throw new TypeError(`biome profile: ${key} families are not arrays`);
	const hazard = source.hazard === null ? null : oneOf(source.hazard, HAZARDS, `${key} hazard`);
	return deepFreeze({
		sig: source.sig,
		fauna: source.fauna.map((family) => oneOf(family, FAUNA, `${key} fauna`)),
		flora: source.flora.map((family) => oneOf(family, FLORA, `${key} flora`)),
		hazard,
		weather: oneOf(source.weather, WEATHER, `${key} weather`)
	});
}
/** Build a canonical exact-set authority. Input order cannot affect output;
* duplicate, missing, and unknown biome identities are rejected separately. */
function createBiomeProfileSetV1(entries) {
	const expected = new Set(BIOME_PROFILE_KEYS_V1);
	const supplied = /* @__PURE__ */ new Map();
	for (const entry of entries) {
		if (!Array.isArray(entry) || entry.length !== 2 || typeof entry[0] !== "string") throw new TypeError("biome profile: malformed authority entry");
		const [key, value] = entry;
		if (!expected.has(key)) throw new TypeError(`biome profile: unexpected key ${key}`);
		if (supplied.has(key)) throw new TypeError(`biome profile: duplicate key ${key}`);
		supplied.set(key, checkedProfile(value, key));
	}
	const missing = BIOME_PROFILE_KEYS_V1.filter((key) => !supplied.has(key));
	if (missing.length > 0) throw new TypeError(`biome profile: missing keys ${missing.join(",")}`);
	return deepFreeze(Object.fromEntries(BIOME_PROFILE_KEYS_V1.map((key) => [key, supplied.get(key)])));
}
const AUTHORED_BIOME_PROFILE_ENTRIES_V1 = [
	["temperate", {
		sig: "#6f9a52",
		fauna: [
			"mammal",
			"bird",
			"insect",
			"amphibian"
		],
		flora: [
			"tree",
			"shrub",
			"flower",
			"grass",
			"fern"
		],
		hazard: null,
		weather: "mild"
	}],
	["savanna", {
		sig: "#c9a24a",
		fauna: [
			"mammal",
			"bird",
			"insect"
		],
		flora: [
			"grass",
			"tree",
			"shrub"
		],
		hazard: "drought",
		weather: "dry-heat"
	}],
	["jungle", {
		sig: "#2f7d4f",
		fauna: [
			"primate",
			"bird",
			"reptile",
			"insect",
			"amphibian"
		],
		flora: [
			"tree",
			"vine",
			"fern",
			"flower",
			"palm"
		],
		hazard: null,
		weather: "humid"
	}],
	["marsh", {
		sig: "#7f8a45",
		fauna: [
			"bird",
			"amphibian",
			"insect",
			"fish"
		],
		flora: [
			"grass",
			"herb",
			"flower"
		],
		hazard: "mire",
		weather: "mist"
	}],
	["swamp", {
		sig: "#4a5940",
		fauna: [
			"reptile",
			"amphibian",
			"insect",
			"fish"
		],
		flora: [
			"tree",
			"moss",
			"vine"
		],
		hazard: "mire",
		weather: "mist"
	}],
	["mangrove", {
		sig: "#5c7a4a",
		fauna: [
			"crust",
			"fish",
			"bird",
			"reptile"
		],
		flora: [
			"tree",
			"palm",
			"grass"
		],
		hazard: null,
		weather: "humid"
	}],
	["tundra", {
		sig: "#9fb0a0",
		fauna: ["mammal", "bird"],
		flora: [
			"moss",
			"shrub",
			"grass"
		],
		hazard: "cold",
		weather: "wind-cold"
	}],
	["karst", {
		sig: "#b8b0a0",
		fauna: [
			"mammal",
			"arachnid",
			"insect"
		],
		flora: [
			"fern",
			"moss",
			"shrub"
		],
		hazard: "sinkhole",
		weather: "mild"
	}],
	["saltflat", {
		sig: "#e8e6dc",
		fauna: [
			"insect",
			"arachnid",
			"bird"
		],
		flora: ["cactus", "herb"],
		hazard: "salt-glare",
		weather: "dry-heat"
	}],
	["fungal", {
		sig: "#9a6fb0",
		fauna: [
			"insect",
			"gastropod",
			"amphibian"
		],
		flora: ["moss", "fern"],
		hazard: "spore",
		weather: "still"
	}],
	["crystalsteppe", {
		sig: "#7fb0c0",
		fauna: [
			"insect",
			"arachnid",
			"mammal"
		],
		flora: ["grass", "cactus"],
		hazard: "shard",
		weather: "wind"
	}],
	["opensea", {
		sig: "#2a5a8a",
		fauna: [
			"fish",
			"marine",
			"jelly",
			"ceph"
		],
		flora: ["seaweed"],
		hazard: null,
		weather: "swell"
	}],
	["archipelago", {
		sig: "#3a8a80",
		fauna: [
			"bird",
			"crust",
			"fish",
			"reptile"
		],
		flora: [
			"palm",
			"tree",
			"grass"
		],
		hazard: null,
		weather: "trade-wind"
	}],
	["coral", {
		sig: "#40c0b0",
		fauna: [
			"fish",
			"sessile",
			"crust",
			"ceph",
			"gastropod"
		],
		flora: ["seaweed"],
		hazard: null,
		weather: "calm"
	}],
	["stormsea", {
		sig: "#4a5a70",
		fauna: [
			"fish",
			"marine",
			"bird"
		],
		flora: ["seaweed"],
		hazard: "storm",
		weather: "squall"
	}],
	["volcisle", {
		sig: "#2a6a6a",
		fauna: [
			"crust",
			"fish",
			"bird"
		],
		flora: ["palm", "fern"],
		hazard: "ashfall",
		weather: "humid"
	}],
	["abyssal", {
		sig: "#16283e",
		fauna: [
			"fish",
			"ceph",
			"jelly",
			"sessile"
		],
		flora: [],
		hazard: "pressure",
		weather: "lightless"
	}],
	["milksea", {
		sig: "#a0d0d0",
		fauna: [
			"jelly",
			"ceph",
			"fish"
		],
		flora: ["seaweed"],
		hazard: null,
		weather: "glow-calm"
	}],
	["glacier", {
		sig: "#cfe0ea",
		fauna: [
			"marine",
			"bird",
			"mammal"
		],
		flora: ["moss"],
		hazard: "cold",
		weather: "wind-cold"
	}],
	["packice", {
		sig: "#a0b8c8",
		fauna: [
			"marine",
			"bird",
			"fish"
		],
		flora: [],
		hazard: "cold",
		weather: "wind-cold"
	}],
	["cryogeyser", {
		sig: "#b0d0d8",
		fauna: ["crust", "fish"],
		flora: ["moss"],
		hazard: "cryo-jet",
		weather: "steam-cold"
	}],
	["blueice", {
		sig: "#6fa8d0",
		fauna: ["marine", "fish"],
		flora: [],
		hazard: "crevasse",
		weather: "still-cold"
	}],
	["dunesea", {
		sig: "#d8b878",
		fauna: [
			"reptile",
			"arachnid",
			"insect",
			"mammal"
		],
		flora: ["cactus", "shrub"],
		hazard: "sandstorm",
		weather: "dry-heat"
	}],
	["canyon", {
		sig: "#b06a48",
		fauna: [
			"reptile",
			"bird",
			"mammal"
		],
		flora: ["shrub", "cactus"],
		hazard: "flash-flood",
		weather: "dry"
	}],
	["saltpan", {
		sig: "#ded8c8",
		fauna: ["insect", "bird"],
		flora: ["herb"],
		hazard: "salt-glare",
		weather: "mirage-heat"
	}],
	["oxide", {
		sig: "#b0603a",
		fauna: [
			"arachnid",
			"insect",
			"reptile"
		],
		flora: ["cactus"],
		hazard: "dust-devil",
		weather: "dry"
	}],
	["glass", {
		sig: "#c8b0a0",
		fauna: ["arachnid", "insect"],
		flora: [],
		hazard: "glass-shard",
		weather: "dry-heat"
	}],
	["cratered", {
		sig: "#9a9a94",
		fauna: ["arachnid", "insect"],
		flora: ["moss"],
		hazard: "meteor",
		weather: "airless"
	}],
	["boulder", {
		sig: "#a8a090",
		fauna: [
			"reptile",
			"arachnid",
			"mammal"
		],
		flora: ["moss", "shrub"],
		hazard: "rockfall",
		weather: "dry"
	}],
	["graben", {
		sig: "#78787a",
		fauna: ["arachnid", "reptile"],
		flora: ["moss"],
		hazard: "fault",
		weather: "still"
	}],
	["geode", {
		sig: "#9a6fc0",
		fauna: ["insect", "arachnid"],
		flora: [],
		hazard: "shard",
		weather: "still"
	}],
	["carbon", {
		sig: "#2a2a2e",
		fauna: ["arachnid", "insect"],
		flora: [],
		hazard: "soot",
		weather: "still"
	}],
	["sulfurdeck", {
		sig: "#b0a040",
		fauna: ["insect"],
		flora: [],
		hazard: "acid",
		weather: "sulfur-storm"
	}],
	["acidhaze", {
		sig: "#b8a850",
		fauna: [],
		flora: [],
		hazard: "acid",
		weather: "acid-haze"
	}],
	["abyssgreen", {
		sig: "#6a6030",
		fauna: [],
		flora: [],
		hazard: "heat",
		weather: "greenhouse"
	}],
	["ashwaste", {
		sig: "#7a7570",
		fauna: ["arachnid", "insect"],
		flora: [],
		hazard: "ashfall",
		weather: "ash"
	}],
	["emberfield", {
		sig: "#c05028",
		fauna: ["insect"],
		flora: [],
		hazard: "ember",
		weather: "ember-wind"
	}],
	["obsidian", {
		sig: "#2a2428",
		fauna: ["arachnid"],
		flora: [],
		hazard: "glass-shard",
		weather: "still-heat"
	}],
	["magmasea", {
		sig: "#e06020",
		fauna: [],
		flora: [],
		hazard: "magma",
		weather: "heat-shimmer"
	}],
	["banded", {
		sig: "#c8b090",
		fauna: ["jelly", "ceph"],
		flora: [],
		hazard: "storm",
		weather: "band-wind"
	}],
	["ammonia", {
		sig: "#d0c8d8",
		fauna: ["jelly"],
		flora: [],
		hazard: "cold",
		weather: "pastel-cloud"
	}],
	["stormeye", {
		sig: "#a0604a",
		fauna: ["jelly", "ceph"],
		flora: [],
		hazard: "megastorm",
		weather: "cyclone"
	}],
	["hotglow", {
		sig: "#b04030",
		fauna: [],
		flora: [],
		hazard: "heat",
		weather: "ember-cloud"
	}]
];
const DIGEST_SEEDS = Object.freeze([
	2166136261,
	2654435769,
	2246822507,
	3266489909
]);
function hashContent32(source, seed) {
	let hash = seed >>> 0;
	for (let index = 0; index < source.length; index += 1) hash = Math.imul(hash ^ source.charCodeAt(index), 16777619) >>> 0;
	hash ^= hash >>> 16;
	hash = Math.imul(hash, 2246822507) >>> 0;
	hash ^= hash >>> 13;
	hash = Math.imul(hash, 3266489909) >>> 0;
	return (hash ^ hash >>> 16) >>> 0;
}
function canonicalProfileContent(profiles) {
	return JSON.stringify([BIOME_PROFILE_SCHEMA_V1, ...BIOME_PROFILE_KEYS_V1.map((key) => {
		const profile = profiles[key];
		return [
			key,
			profile.sig,
			profile.fauna,
			profile.flora,
			profile.hazard,
			profile.weather
		];
	})]);
}
function digestCanonicalProfiles(profiles) {
	const source = canonicalProfileContent(profiles);
	return `bpd1-${DIGEST_SEEDS.map((seed) => hashContent32(source, seed).toString(16).padStart(8, "0")).join("")}`;
}
/** Build a detached, recursively frozen authority whose digest binds schema,
* key order, and every profile field. Input entry order is not identity. */
function createBiomeProfileAuthorityV1(entries) {
	const profiles = createBiomeProfileSetV1(entries);
	return deepFreeze({
		schema: BIOME_PROFILE_SCHEMA_V1,
		digest: digestCanonicalProfiles(profiles),
		keys: BIOME_PROFILE_KEYS_V1,
		profiles
	});
}
createBiomeProfileAuthorityV1(AUTHORED_BIOME_PROFILE_ENTRIES_V1).profiles;
//#endregion
//#region port/v2/packages/domain/surveyphrases/src/surveyphrases.verbatim.js
function climateBand(P, sys, orb) {
	if (P.seed === 133) return "temperate";
	if (sys && sys.hz) {
		if (orb < sys.hz[0] * .92) return "hot";
		if (orb > sys.hz[1] * 1.12) return "cold";
		return "temperate";
	}
	if (sys && (sys.kind === "BH" || sys.kind === "NS" || sys.kind === "WD" || sys.kind === "MAG" || sys.kind === "PROTO")) return "frozen";
	if (sys && (sys.kind === "RG" || sys.kind === "SG")) return "hot";
	if (P.type === "lava" || P.type === "venus") return "hot";
	if (P.type === "ice") return "frozen";
	return "cold";
}
//#endregion
//#region port/v2/packages/domain/combatcore/src/guardian-prime.ts
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
new Map(PRIME_SIGNATURES_V1.map((row) => [row.id, row]));
const WORLD_TYPE_SIGNATURE = /* @__PURE__ */ new Map();
for (const row of PRIME_SIGNATURES_V1) for (const worldType of row.eligibleWorldTypes) WORLD_TYPE_SIGNATURE.set(worldType, row.id);
Object.freeze({
	supportedMode: "legacy-v1.8.9-conquest-only",
	friendlyDuelProgression: "unsupported-open-active-play-policy",
	partyRolesAndRetreat: "unsupported-open-design-gate",
	guardianAuthoredReward: "unsupported-open-loot-table"
});
new Set(PRIME_SIGNATURE_IDS_V1);
//#endregion
//#region port/v2/packages/domain/strays/src/strays.verbatim.js
const BIOME_SETS = {
	terran: [
		{
			k: "temperate",
			n: "Temperate world",
			w: 24,
			land: 100,
			bands: ["temperate"],
			f: "meadows, forests and slow rivers under a kind sun"
		},
		{
			k: "savanna",
			n: "Savanna world",
			w: 12,
			land: 100,
			bands: ["temperate", "hot"],
			f: "gold grass to the horizon, herds moving like weather"
		},
		{
			k: "jungle",
			n: "Jungle world",
			w: 10,
			land: 85,
			bands: ["temperate"],
			f: "canopy over canopy — the ground is a rumor"
		},
		{
			k: "marsh",
			n: "Marsh world",
			w: 8,
			land: 90,
			bands: ["temperate"],
			f: "reed flats and braided channels, loud with small lives"
		},
		{
			k: "swamp",
			n: "Swamp world",
			w: 7,
			land: 80,
			bands: ["temperate"],
			f: "blackwater fens under hanging moss"
		},
		{
			k: "mangrove",
			n: "Mangrove world",
			w: 5,
			land: 90,
			bands: ["temperate"],
			f: "tangled roots walking out into a warm sea"
		},
		{
			k: "tundra",
			n: "Tundra world",
			w: 12,
			land: 90,
			bands: ["cold"],
			f: "permafrost moss and a low, reluctant sun"
		},
		{
			k: "karst",
			n: "Karst world",
			w: 5,
			land: 80,
			bands: [
				"temperate",
				"cold",
				"hot"
			],
			f: "sinkholes and cave mouths — the ground is hollow"
		},
		{
			k: "saltflat",
			n: "Salt-Flat world",
			w: 8,
			land: 85,
			bands: ["hot"],
			f: "blinding white pans where the water used to be"
		},
		{
			k: "fungal",
			n: "Fungal world",
			w: 1.6,
			land: 85,
			bands: ["temperate", "cold"],
			rare: 1,
			f: "spore towers and gill canopies — a forest with no trees"
		},
		{
			k: "crystalsteppe",
			n: "Crystal Steppe world",
			w: 1.4,
			land: 85,
			bands: [
				"temperate",
				"cold",
				"hot"
			],
			rare: 1,
			f: "mineral spires standing in the grass like a frozen chord"
		}
	],
	ocean: [
		{
			k: "opensea",
			n: "Open-Sea world",
			w: 20,
			land: 90,
			f: "water to every horizon, weather its only geography"
		},
		{
			k: "archipelago",
			n: "Archipelago world",
			w: 14,
			land: 95,
			f: "island chains scattered like a flung handful of green"
		},
		{
			k: "coral",
			n: "Coral-Shallows world",
			w: 10,
			land: 100,
			bands: ["temperate"],
			f: "turquoise reef flats you can read from orbit"
		},
		{
			k: "stormsea",
			n: "Storm-Sea world",
			w: 8,
			land: 60,
			f: "squall lines stacked to the edge of sight"
		},
		{
			k: "volcisle",
			n: "Volcanic-Archipelago world",
			w: 5,
			land: 70,
			f: "young fire building new land out of the sea"
		},
		{
			k: "abyssal",
			n: "Abyssal world",
			w: 7,
			land: 75,
			f: "no islands, no shallows — a lightless deep that goes down and down"
		},
		{
			k: "milksea",
			n: "Milk-Sea world",
			w: 1.4,
			land: 90,
			rare: 1,
			f: "bioluminescent blooms wide enough to glow at the horizon"
		}
	],
	ice: [
		{
			k: "glacier",
			n: "Glacier world",
			w: 18,
			land: 90,
			f: "rivers of old ice grinding to a frozen sea"
		},
		{
			k: "packice",
			n: "Pack-Ice world",
			w: 12,
			land: 85,
			f: "a frozen ocean ridged where the floes shoulder each other"
		},
		{
			k: "cryogeyser",
			n: "Cryogeyser world",
			w: 8,
			land: 70,
			f: "plumes of buried sea breaking through the crust"
		},
		{
			k: "blueice",
			n: "Blue-Ice world",
			w: 2,
			land: 55,
			rare: 1,
			f: "canyons of old blue ice, lit from within"
		}
	],
	desert: [
		{
			k: "dunesea",
			n: "Dune-Sea world",
			w: 18,
			land: 90,
			f: "sand in slow waves the size of hills"
		},
		{
			k: "canyon",
			n: "Canyon world",
			w: 10,
			land: 85,
			f: "slot canyons and strata — a history book split open"
		},
		{
			k: "saltpan",
			n: "Salt-Pan world",
			w: 8,
			land: 85,
			bands: ["hot"],
			f: "mirage shimmer over crusted brine pans"
		},
		{
			k: "oxide",
			n: "Oxide-Waste world",
			w: 10,
			land: 75,
			f: "rust plains walked by dust devils"
		},
		{
			k: "glass",
			n: "Glass-Desert world",
			w: 1.6,
			land: 50,
			rare: 1,
			f: "sand fused to glass by old lightning, sharp as a warning"
		}
	],
	rocky: [
		{
			k: "cratered",
			n: "Cratered world",
			w: 18,
			land: 95,
			f: "a face that remembers every impact"
		},
		{
			k: "boulder",
			n: "Boulder-Field world",
			w: 10,
			land: 90,
			f: "regolith plains strewn with stones the size of houses"
		},
		{
			k: "graben",
			n: "Graben-Canyon world",
			w: 8,
			land: 85,
			f: "the crust pulled apart into long shadowed trenches"
		},
		{
			k: "geode",
			n: "Geode world",
			w: 2.4,
			land: 80,
			rare: 1,
			f: "gashes of amethyst where the ground split and grew jewels"
		},
		{
			k: "carbon",
			n: "Carbon world",
			w: 1.6,
			land: 60,
			rare: 1,
			f: "graphite-black plains that glint, here and there, like diamond"
		}
	],
	venus: [
		{
			k: "sulfurdeck",
			n: "Sulfur-Storm world",
			w: 10,
			land: 30,
			f: "storm decks of sulfur, gold-green and furious"
		},
		{
			k: "acidhaze",
			n: "Acid-Haze world",
			w: 12,
			land: 25,
			f: "a crushing haze that eats light and metal alike"
		},
		{
			k: "abyssgreen",
			n: "Greenhouse-Abyss world",
			w: 4,
			land: 10,
			f: "the bottom of an atmosphere like an ocean — gloom, heat, and lightning"
		}
	],
	lava: [
		{
			k: "ashwaste",
			n: "Ash-Waste world",
			w: 10,
			land: 35,
			f: "cooling fields under a slow gray snowfall of ash"
		},
		{
			k: "emberfield",
			n: "Ember-Field world",
			w: 10,
			land: 25,
			f: "ground that glows through its own cracks"
		},
		{
			k: "obsidian",
			n: "Obsidian world",
			w: 7,
			land: 20,
			f: "black glass plains veined with fire"
		},
		{
			k: "magmasea",
			n: "Magma-Sea world",
			w: 4,
			land: 10,
			f: "a shoreline where the ocean is molten rock"
		}
	],
	gas: [
		{
			k: "banded",
			n: "Banded giant",
			w: 16,
			land: 65,
			f: "storm bands running unbroken around the world"
		},
		{
			k: "ammonia",
			n: "Pastel-Ammonia giant",
			w: 8,
			land: 75,
			f: "soft pale decks, deceptively calm"
		},
		{
			k: "stormeye",
			n: "Storm-Eye giant",
			w: 4,
			land: 30,
			f: "one storm older than nations, wider than worlds"
		},
		{
			k: "hotglow",
			n: "Ember giant",
			w: 3,
			land: 15,
			rare: 1,
			f: "a giant that glows its own sullen red — the night side is a furnace"
		}
	]
};
function biomeFor(P, band) {
	if (P.seed === 133) return null;
	const set = BIOME_SETS[P.type];
	if (!set) return null;
	const bd = band === "frozen" ? "cold" : band;
	const cands = set.filter((b) => !b.bands || b.bands.includes(bd));
	const pool = cands.length ? cands : set;
	const r = mulberry32(hashInt(P.seed, 45326, 7) >>> 0);
	let total = 0;
	for (const b of pool) total += b.w;
	let v = r() * total;
	for (const b of pool) {
		v -= b.w;
		if (v <= 0) return b;
	}
	return pool[pool.length - 1];
}
//#endregion
//#region port/v2/packages/domain/descriptors/src/apphooks.verbatim.js
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
GAL_SPRITE_SEEDS.map(galSpriteKind);
//#endregion
//#region port/v2/packages/domain/descriptors/src/apphooks.ts
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
//#endregion
//#region port/v2/packages/scene/src/address.ts
const KEY_UINT = "(0|[1-9]\\d*)";
const KEY_COORD = "(-?(?:0|[1-9]\\d*)(?:\\.\\d{1,2})?)";
new RegExp(`^CF1\\|g:${KEY_UINT}@${KEY_COORD},${KEY_COORD}\\|s:${KEY_UINT}@${KEY_COORD},${KEY_COORD}\\|p:${KEY_UINT}#${KEY_UINT}$`);
//#endregion
//#region port/v2/packages/scene/src/zoommode.ts
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
//#endregion
//#region port/v2/packages/scene/src/charter.ts
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
Object.freeze([
	"hot",
	"temperate",
	"cold",
	"frozen"
]);
const CANONICAL_BIOSPHERE_KEYS = Object.freeze([
	"earth",
	"none",
	"complex",
	"flora",
	"aquatic",
	"sparse",
	"microbial",
	"subsurface",
	"aerial",
	"xfauna"
]);
new Set(CANONICAL_BIOSPHERE_KEYS);
Object.freeze({
	systemFor,
	climateBand,
	biosphere,
	planetSpecies: planetSpeciesAtEcologyEpoch,
	nameEarth: _earthNamePass$1,
	biomeFor
});
Object.freeze([
	"terran",
	"ocean",
	"ice",
	"desert",
	"rocky",
	"venus",
	"lava",
	"gas"
]);
Object.freeze({
	terran: "temperate",
	ocean: "opensea",
	ice: "glacier",
	desert: "dunesea",
	rocky: "cratered",
	venus: "acidhaze",
	lava: "emberfield",
	gas: "banded"
});
Object.freeze({
	ok: false,
	reason: "unproven-roster"
});
Object.freeze({
	ok: false,
	reason: "unsupported-recipe"
});
//#endregion
//#region port/v2/apps/game/src/landfall-conditioning.ts
function freeze(value) {
	if (value !== null && typeof value === "object") {
		for (const child of Object.values(value)) freeze(child);
		Object.freeze(value);
	}
	return value;
}
freeze([
	{
		id: "earth-civet-v1",
		name: "Civet",
		kingdom: "fauna",
		family: "mammal",
		taxon: "viverrid",
		sourceOwners: ["art/mammaloverrides.ts#QUAD2_SPEC.Civet", "art/quadrupedoverrides.ts#mammalDViverrid"],
		diagnostics: [
			{
				role: "body",
				required: "low long body, spotted natural fur"
			},
			{
				role: "head",
				required: "one pointed muzzle, small round ears, dark face mask"
			},
			{
				role: "limbs",
				required: "four short legs with paws"
			},
			{
				role: "tail",
				required: "one long ringed tail"
			}
		],
		forbiddenSubstitutions: [
			"fox head",
			"duplicate head or body",
			"extra legs",
			"unringed tail"
		]
	},
	{
		id: "earth-platypus-v1",
		name: "Platypus",
		kingdom: "fauna",
		family: "mammal",
		taxon: "monotreme",
		sourceOwners: ["art/speciesoverrides.ts#CANON.fauna|Platypus", "art/faunaoverrides5.ts#faunaMonotreme"],
		diagnostics: [
			{
				role: "body",
				required: "low sleek dark-brown furred body"
			},
			{
				role: "head",
				required: "broad flat rubbery duck bill"
			},
			{
				role: "limbs",
				required: "four short limbs with webbed clawed feet"
			},
			{
				role: "tail",
				required: "broad flat blunt paddle tail"
			}
		],
		forbiddenSubstitutions: [
			"rodent muzzle",
			"furred nose instead of bill",
			"round rodent ears",
			"thin tail"
		]
	},
	{
		id: "earth-frog-v1",
		name: "Frog",
		kingdom: "fauna",
		family: "amphibian",
		taxon: "anuran",
		sourceOwners: ["art/faunaoverrides2.ts#FAUNA2_NAME.Frog", "art/faunaoverrides2.ts#amphFrog"],
		diagnostics: [
			{
				role: "body",
				required: "small green crouched body"
			},
			{
				role: "head",
				required: "wide mouth and two domed eyes"
			},
			{
				role: "limbs",
				required: "four limbs, long folded hind legs"
			}
		],
		forbiddenSubstitutions: [
			"mammal fur",
			"upright mammal posture",
			"adult tail"
		]
	},
	{
		id: "earth-persimmon-v1",
		name: "Persimmon",
		kingdom: "flora",
		family: "tree",
		taxon: "fruit-tree",
		sourceOwners: ["art/florarost.ts#FLORA2_SPEC.Persimmon", "art/floraoverrides2.ts#plantBody.Persimmon"],
		diagnostics: [
			{
				role: "stem",
				required: "branching woody tree"
			},
			{
				role: "leaves",
				required: "broad simple oval green leaves"
			},
			{
				role: "fruit",
				required: "orange fruits with four-lobed calyx"
			}
		],
		forbiddenSubstitutions: [
			"pinnate compound leaves",
			"citrus fruit",
			"generic berry bush"
		]
	},
	{
		id: "earth-devils-club-v1",
		name: "Devil's Club",
		kingdom: "flora",
		family: "shrub",
		taxon: "spiny-shrub",
		sourceOwners: ["art/floraoverrides.ts#FLORA_ICONIC", "art/floraoverrides.ts#floraDevilsClub"],
		diagnostics: [
			{
				role: "stem",
				required: "thick spiny canes"
			},
			{
				role: "leaves",
				required: "huge palmate lobed green leaves"
			},
			{
				role: "fruit",
				required: "upright terminal red berry cones"
			}
		],
		forbiddenSubstitutions: [
			"small narrow leaves",
			"smooth canes",
			"generic berry bush"
		]
	},
	{
		id: "earth-cranberry-v1",
		name: "Cranberry",
		kingdom: "flora",
		family: "shrub",
		taxon: "creeping-shrub",
		sourceOwners: ["art/florarost.ts#FLORA2_SPEC.Cranberry", "art/floraoverrides2.ts#berryHabit.cranberry"],
		diagnostics: [
			{
				role: "stem",
				required: "low creeping runners"
			},
			{
				role: "leaves",
				required: "small simple oval green leaves"
			},
			{
				role: "fruit",
				required: "red berries close to the ground"
			}
		],
		forbiddenSubstitutions: [
			"tall woody bush",
			"large leaves",
			"hanging grape bunches"
		]
	}
]);
/** Desktop creature texture class, same kit finisher, inverted protection polarity.
* No per-species prompt/settings; pixels carry anatomy and palette. */
function compileCreatureFinishV1(input) {
	if (!/^[a-f0-9]{64}$/.test(input.recordRecipeHash) || !/^[a-f0-9]{64}$/.test(input.cutoutAssetHash) || !Number.isSafeInteger(input.seed)) throw Error("Creature finish identity");
	const seed = (input.seed ^ Number.parseInt(input.recordRecipeHash.slice(0, 8), 16)) >>> 0;
	return freeze({
		schema: "cf.creature-finish.v1",
		tier: "desktop",
		width: input.width,
		height: input.height,
		seed,
		master: input.master,
		labels: input.labels,
		settings: {
			strength: .35,
			steps: 1,
			boundaryPixels: 4,
			gradientRatio: .95
		},
		prompt: "Rich natural-history fantasy painting. Finish the existing painted creature with fine natural material texture and softly modeled light. Preserve its exact anatomy, count of legs and pincers, pose, silhouette, pigment colors, markings and part boundaries. Work only inside the existing painted surfaces. Keep the source background unchanged. No added limbs, objects, scenery, lettering or decorations."
	});
}
//#endregion
//#region port/v2/apps/game/src/local-model-sha256.ts
const SHA256_K = Object.freeze([
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
function rotateRight(value, amount) {
	return value >>> amount | value << 32 - amount;
}
const MAX_HASH_BYTES = Math.floor(Number.MAX_SAFE_INTEGER / 8);
var LocalModelSha256V1 = class {
	block = /* @__PURE__ */ new Uint8Array(64);
	words = /* @__PURE__ */ new Uint32Array(64);
	state = new Uint32Array([
		1779033703,
		3144134277,
		1013904242,
		2773480762,
		1359893119,
		2600822924,
		528734635,
		1541459225
	]);
	blockLength = 0;
	totalBytes = 0;
	digest = null;
	update(bytes) {
		if (this.digest !== null) throw new Error("local model SHA-256 is already finalized");
		if (bytes.byteLength > MAX_HASH_BYTES - this.totalBytes) throw new RangeError("local model SHA-256 exceeds the safe bit-length limit");
		this.totalBytes += bytes.byteLength;
		let offset = 0;
		if (this.blockLength > 0) {
			const count = Math.min(64 - this.blockLength, bytes.byteLength);
			this.block.set(bytes.subarray(0, count), this.blockLength);
			this.blockLength += count;
			offset += count;
			if (this.blockLength === 64) {
				this.compress(this.block, 0);
				this.blockLength = 0;
			}
		}
		while (offset + 64 <= bytes.byteLength) {
			this.compress(bytes, offset);
			offset += 64;
		}
		if (offset < bytes.byteLength) {
			this.block.set(bytes.subarray(offset), this.blockLength);
			this.blockLength += bytes.byteLength - offset;
		}
		return this;
	}
	/** Finalize once; repeated reads return the same digest. Further updates fail. */
	digestHex() {
		if (this.digest !== null) return this.digest;
		this.block[this.blockLength] = 128;
		this.block.fill(0, this.blockLength + 1);
		if (this.blockLength >= 56) {
			this.compress(this.block, 0);
			this.block.fill(0);
		}
		const bitLength = this.totalBytes * 8;
		const high = Math.floor(bitLength / 4294967296);
		const low = bitLength >>> 0;
		for (let index = 0; index < 4; index++) {
			this.block[56 + index] = high >>> 24 - index * 8 & 255;
			this.block[60 + index] = low >>> 24 - index * 8 & 255;
		}
		this.compress(this.block, 0);
		this.digest = Array.from(this.state, (word) => word.toString(16).padStart(8, "0")).join("");
		return this.digest;
	}
	compress(bytes, offset) {
		const words = this.words;
		const h = this.state;
		for (let index = 0; index < 16; index++) {
			const at = offset + index * 4;
			words[index] = (bytes[at] << 24 | bytes[at + 1] << 16 | bytes[at + 2] << 8 | bytes[at + 3]) >>> 0;
		}
		for (let index = 16; index < 64; index++) {
			const a = words[index - 15];
			const b = words[index - 2];
			const s0 = rotateRight(a, 7) ^ rotateRight(a, 18) ^ a >>> 3;
			const s1 = rotateRight(b, 17) ^ rotateRight(b, 19) ^ b >>> 10;
			words[index] = words[index - 16] + s0 + words[index - 7] + s1 >>> 0;
		}
		let a = h[0], b = h[1], c = h[2], d = h[3];
		let e = h[4], f = h[5], g = h[6], hh = h[7];
		for (let index = 0; index < 64; index++) {
			const s1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
			const choice = e & f ^ ~e & g;
			const temp1 = hh + s1 + choice + SHA256_K[index] + words[index] >>> 0;
			const temp2 = (rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22)) + (a & b ^ a & c ^ b & c) >>> 0;
			hh = g;
			g = f;
			f = e;
			e = d + temp1 >>> 0;
			d = c;
			c = b;
			b = a;
			a = temp1 + temp2 >>> 0;
		}
		h[0] = h[0] + a >>> 0;
		h[1] = h[1] + b >>> 0;
		h[2] = h[2] + c >>> 0;
		h[3] = h[3] + d >>> 0;
		h[4] = h[4] + e >>> 0;
		h[5] = h[5] + f >>> 0;
		h[6] = h[6] + g >>> 0;
		h[7] = h[7] + hh >>> 0;
	}
};
const CHUNK = 65536;
async function hashLandfallBufferV1(buffer, options = {}) {
	if (!(buffer instanceof ArrayBuffer) || buffer.byteLength < 1 || buffer.byteLength > 16777216) throw new Error("Invalid or oversized landfall hash input");
	const subtle = options.subtle === void 0 ? globalThis.crypto?.subtle : options.subtle;
	if (subtle) {
		const result = await subtle.digest("SHA-256", buffer);
		if (result.byteLength !== 32) throw new Error("Invalid native SHA-256 result");
		return Array.from(new Uint8Array(result), (byte) => byte.toString(16).padStart(2, "0")).join("");
	}
	const bytes = new Uint8Array(buffer.slice(0)), hasher = new LocalModelSha256V1();
	const yieldTask = options.yieldTask ?? (() => new Promise((resolve) => setTimeout(resolve, 0)));
	for (let start = 0; start < bytes.byteLength; start += CHUNK) {
		hasher.update(bytes.subarray(start, start + CHUNK));
		if (start + CHUNK < bytes.byteLength) await yieldTask();
	}
	return hasher.digestHex();
}
async function hashLandfallBlobV1(blob) {
	if (!(blob instanceof Blob)) throw new Error("Landfall blob required");
	const snapshot = Blob.prototype.slice.call(blob);
	if (snapshot.size !== blob.size || snapshot.size < 1 || snapshot.size > 16777216) throw new Error("Invalid or oversized landfall original");
	const bytes = await snapshot.arrayBuffer();
	if (bytes.byteLength !== snapshot.size) throw new Error("Landfall original byte count changed");
	return hashLandfallBufferV1(bytes);
}
//#endregion
//#region port/v2/apps/game/src/creature-originals.ts
/** Immutable desktop-generated originals. Phone delivery may read, never infer. */
function creatureOriginalKey(input) {
	const values = [
		input.recordRecipeHash,
		input.cutoutAssetHash,
		input.settingsHash,
		input.modelHash
	];
	if (values.some((v) => typeof v !== "string" || !/^[a-f0-9]{64}$/.test(v))) throw Error("Creature original identity");
	return new LocalModelSha256V1().update(new TextEncoder().encode(JSON.stringify(values))).digestHex();
}
function createAiCreatureOriginalStoreV1(factory = globalThis.indexedDB) {
	let db = null, closed = false;
	const opening = new Promise((resolve, reject) => {
		const r = factory.open("cf-ai-creature-originals-v1", 1);
		r.onupgradeneeded = () => r.result.createObjectStore("originals");
		r.onerror = () => reject(r.error);
		r.onblocked = () => reject(Error("Creature store blocked"));
		r.onsuccess = () => {
			if (closed) {
				r.result.close();
				reject(Error("Creature store closed"));
				return;
			}
			db = r.result;
			db.onversionchange = () => {
				closed = true;
				db?.close();
			};
			resolve(db);
		};
	});
	const transaction = async (mode, operation) => {
		if (closed) throw Error("Creature store closed");
		const database = await opening;
		return new Promise((resolve, reject) => {
			const t = database.transaction("originals", mode), r = operation(t.objectStore("originals"));
			t.oncomplete = () => resolve(r.result);
			t.onerror = () => reject(t.error);
			t.onabort = () => reject(t.error ?? Error("Creature store aborted"));
		});
	};
	const find = async (input) => {
		const key = creatureOriginalKey(input), r = await transaction("readonly", (s) => s.get(key));
		if (!r) return null;
		if (r.key !== key || !(r.blob instanceof Blob) || r.blob.type !== "image/png" || await hashLandfallBlobV1(r.blob) !== r.sha256) throw Error("Creature original corrupt");
		return Object.freeze(r);
	};
	return Object.freeze({
		find,
		read: find,
		async retain(input, blob, receipt) {
			const key = creatureOriginalKey(input);
			if (blob.type !== "image/png" || !blob.size || blob.size > 67108864 || !receipt || receipt.length > 1048576) throw Error("Creature original payload");
			const row = Object.freeze({
				key,
				sha256: await hashLandfallBlobV1(blob),
				blob,
				receipt
			});
			await transaction("readwrite", (s) => s.add(row, key));
			return await find(input);
		},
		close() {
			closed = true;
			db?.close();
		}
	});
}
async function obtainCreatureOriginalV1(store, input, tier, infer) {
	const existing = await store.find(input);
	if (existing) return {
		original: existing,
		inferencePasses: 0
	};
	if (tier !== "desktop") return {
		original: null,
		inferencePasses: 0,
		painterFallback: true
	};
	const generated = await infer();
	return {
		original: await store.retain(input, generated.blob, generated.receipt),
		inferencePasses: 1
	};
}
//#endregion
//#region port/v2/tools/painted-creature/finish-conservation.mjs
/** Conservation is measured on decoded pixels; original ownership labels never change. */
function lab(a, i) {
	const [r, g, b] = [
		0,
		1,
		2
	].map((c) => {
		const v = a[i * 4 + c] / 255;
		return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
	});
	const f = (v) => v > 216 / 24389 ? Math.cbrt(v) : v * 841 / 108 + 4 / 29;
	const x = f((.4124564 * r + .3575761 * g + .1804375 * b) / .95047), y = f(.2126729 * r + .7151522 * g + .072175 * b), z = f((.0193339 * r + .119192 * g + .9503041 * b) / 1.08883);
	return [
		116 * y - 16,
		500 * (x - y),
		200 * (y - z)
	];
}
function colorStats(a, b, labels, label) {
	let n = 0, delta = 0, sa = 0, sb = 0, aa = 0, bb = 0, ab = 0;
	for (let i = 0; i < labels.length / 4; i++) if (labels[i * 4] === label) {
		const l = lab(a, i), r = lab(b, i);
		delta += Math.hypot(...l.map((v, c) => v - r[c]));
		const x = .2126 * a[i * 4] + .7152 * a[i * 4 + 1] + .0722 * a[i * 4 + 2], y = .2126 * b[i * 4] + .7152 * b[i * 4 + 1] + .0722 * b[i * 4 + 2];
		n++;
		sa += x;
		sb += y;
		aa += x * x;
		bb += y * y;
		ab += x * y;
	}
	const ma = sa / n, mb = sb / n, va = aa / n - ma * ma, vb = bb / n - mb * mb, cov = ab / n - ma * mb;
	return {
		meanDeltaE76: delta / n,
		luminanceSsim: (2 * ma * mb + 6.5025) * (2 * cov + 58.5225) / ((ma * ma + mb * mb + 6.5025) * (va + vb + 58.5225)),
		ssimScope: "whole labeled part, population moments"
	};
}
function finishConservation(master, finished, labels, w, h, ratio = .95) {
	if (master.length !== w * h * 4 || finished.length !== master.length || labels.length !== master.length || ratio !== .95) throw Error("Conservation dimensions/ratio");
	let alphaChanged = 0, outsideChanged = 0;
	const stats = /* @__PURE__ */ new Map(), seen = new Uint8Array(w * h);
	const metric = (a, b, i, j) => Math.hypot(...[
		0,
		1,
		2
	].map((c) => a[i * 4 + c] - b[j * 4 + c]));
	for (let i = 0; i < w * h; i++) {
		if (master[i * 4 + 3] !== finished[i * 4 + 3]) alphaChanged++;
		if (master[i * 4 + 3] === 0) {
			for (let c = 0; c < 4; c++) if (master[i * 4 + c] !== finished[i * 4 + c]) outsideChanged++;
		}
		const l = labels[i * 4];
		if (!l) continue;
		if (!stats.has(l)) stats.set(l, {
			label: l,
			pixels: 0,
			components: 0,
			boundarySamples: 0,
			beforeGradient: 0,
			afterGradient: 0,
			sumSquaredError: 0
		});
		const s = stats.get(l);
		s.pixels++;
		s.sumSquaredError += metric(master, finished, i, i) ** 2;
		for (const j of [i % w < w - 1 ? i + 1 : -1, i + w < w * h ? i + w : -1]) if (j >= 0 && labels[j * 4] !== l) {
			s.boundarySamples++;
			s.beforeGradient += metric(master, master, i, j);
			s.afterGradient += metric(finished, finished, i, j);
		}
		if (!seen[i]) {
			s.components++;
			const q = [i];
			seen[i] = 1;
			for (let k = 0; k < q.length; k++) {
				const p = q[k];
				for (const j of [
					p % w ? p - 1 : -1,
					p % w < w - 1 ? p + 1 : -1,
					p - w,
					p + w
				]) if (j >= 0 && j < w * h && !seen[j] && labels[j * 4] === l) {
					seen[j] = 1;
					q.push(j);
				}
			}
		}
	}
	const parts = [...stats.values()].map((s) => ({
		...s,
		...colorStats(master, finished, labels, s.label),
		rgbRms: Math.sqrt(s.sumSquaredError / s.pixels / 3),
		gradientRatio: s.beforeGradient ? s.afterGradient / s.beforeGradient : 1,
		componentsAfter: s.components
	}));
	const failures = [];
	if (alphaChanged) failures.push("alpha");
	if (outsideChanged) failures.push("outside");
	if (parts.some((s) => s.gradientRatio + 1e-12 < ratio)) failures.push("boundary-gradient");
	return {
		status: failures.length ? "FAIL" : "PASS",
		alphaChanged,
		outsideChanged,
		ratio,
		parts,
		failures,
		componentCountBasis: "identical alpha and original label topology; invalid when alpha gate fails"
	};
}
//#endregion
//#region port/v2/tools/painted-creature/finish-client.ts
const sha = async (b) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", b)), (v) => v.toString(16).padStart(2, "0")).join("");
const state = {
	status: "idle",
	rows: [],
	events: [],
	artifacts: {}
};
let worker;
let store;
async function paint(recipe) {
	return new Promise((resolve, reject) => {
		worker.onmessage = ({ data }) => {
			if (data.type === "progress") {
				state.events.push({
					phase: data.phase,
					stage: data.stage,
					elapsedMs: data.elapsedMs
				});
				if (state.events.length > 500) state.events.shift();
			} else if (data.type === "complete") resolve(data);
			else reject(Error(data.message));
		};
		worker.onerror = (e) => reject(Error(e.message));
		worker.postMessage({
			stage: "creature-finish-v1",
			requestId: state.rows.length,
			recipe
		});
	});
}
async function start() {
	state.status = "running";
	store = createAiCreatureOriginalStoreV1();
	worker = new Worker("/kit-stage-worker.mjs", { type: "module" });
	try {
		const inputs = await (await fetch("/inputs.json")).json();
		for (const input of inputs.subjects) {
			state.subject = input.id;
			const row = {
				id: input.id,
				status: "FAIL"
			};
			state.rows.push(row);
			try {
				const recipe = compileCreatureFinishV1(input), settingsHash = await sha(new TextEncoder().encode(JSON.stringify({
					settings: recipe.settings,
					prompt: recipe.prompt,
					seed: recipe.seed
				}))), identity = {
					recordRecipeHash: input.recordRecipeHash,
					cutoutAssetHash: input.cutoutAssetHash,
					settingsHash,
					modelHash: inputs.modelHash
				};
				let result, inferences = 0;
				const infer = async () => {
					inferences++;
					result = await paint(recipe);
					const master = new Uint8Array(await (await fetch(recipe.master.url)).arrayBuffer()), labels = new Uint8Array(await (await fetch(recipe.labels.url)).arrayBuffer());
					row.conservation = finishConservation(master, result.rgba, labels, recipe.width, recipe.height);
					if (row.conservation.status !== "PASS") throw Error("Conservation before retention failed");
					return {
						blob: result.painting,
						receipt: JSON.stringify({
							identity,
							recipe,
							elapsedMs: result.elapsedMs,
							editablePixels: result.editablePixels,
							protectedTokens: result.protectedTokens
						})
					};
				};
				const first = await obtainCreatureOriginalV1(store, identity, "desktop", infer);
				if (!first.original) throw Error("Missing original");
				state.artifacts[input.id] = first.original.blob;
				row.sha256 = first.original.sha256;
				row.identity = identity;
				row.recipe = recipe;
				row.details = result ? {
					elapsedMs: result.elapsedMs,
					editablePixels: result.editablePixels,
					protectedTokens: result.protectedTokens,
					sessionCreates: result.sessionCreates
				} : null;
				const second = await obtainCreatureOriginalV1(store, identity, "desktop", infer);
				row.retention = {
					first: first.inferencePasses,
					second: second.inferencePasses,
					inferences,
					hashEqual: second.original?.sha256 === row.sha256
				};
				try {
					await store.retain(identity, first.original.blob, "overwrite mutant");
					throw Error("Overwrite accepted");
				} catch (e) {
					if (String(e).includes("Overwrite accepted")) throw e;
					row.overwriteRefused = true;
				}
				row.changedSettingsMiss = await store.find({
					...identity,
					settingsHash: "0".repeat(64)
				}) === null;
				row.phoneMissing = await obtainCreatureOriginalV1(store, {
					...identity,
					settingsHash: "1".repeat(64)
				}, "phone", () => {
					throw Error("Phone inferred");
				});
				if (input.id === inputs.subjects[0].id) {
					const repeat = await paint(recipe), mutant = await paint({
						...recipe,
						seed: recipe.seed + 1 >>> 0
					});
					const repeatSha = await sha(await repeat.painting.arrayBuffer()), mutantSha = await sha(await mutant.painting.arrayBuffer());
					row.determinism = {
						repeatSha,
						seedPlusOneSha: mutantSha,
						identical: repeatSha === row.sha256,
						seedLive: mutantSha !== row.sha256,
						mutantRetained: false
					};
					if (!row.determinism.identical || !row.determinism.seedLive) throw Error("Determinism control failed");
				}
				row.status = "PASS";
			} catch (e) {
				row.error = String(e);
				worker.terminate();
				worker = new Worker("/kit-stage-worker.mjs", { type: "module" });
			}
		}
		state.status = "complete";
	} catch (e) {
		state.status = "failed";
		state.error = String(e);
	} finally {
		worker?.terminate();
		store?.close();
	}
}
window.creatureProof = {
	start,
	snapshot: () => ({
		status: state.status,
		subject: state.subject,
		rows: state.rows.map((r) => ({
			id: r.id,
			status: r.status,
			error: r.error
		})),
		last: state.events.at(-1)
	}),
	report: () => ({
		status: state.status,
		rows: state.rows,
		events: state.events,
		error: state.error
	}),
	artifact: async (id) => {
		const bytes = new Uint8Array(await state.artifacts[id].arrayBuffer());
		let s = "";
		for (let i = 0; i < bytes.length; i += 8192) s += String.fromCharCode(...bytes.subarray(i, i + 8192));
		return btoa(s);
	}
};
//#endregion
