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
//#region port/v2/packages/domain/worldconfig/src/index.ts
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
const SP_HEX = {
	emerald: "#2fbf6b",
	crimson: "#d33b46",
	violet: "#9a6cff",
	golden: "#e7b94a",
	turquoise: "#36c7c2",
	indigo: "#5b6cf0",
	"amber": "#e08a3c",
	"rust-red": "#b5503a",
	"silver-blue": "#9fb6d6",
	"obsidian-black": "#2b2d3a",
	"bone-white": "#e6e0cf",
	magenta: "#d65bb8",
	teal: "#2fa89a",
	ochre: "#c98a3c",
	jade: "#5fbf8a",
	"bruise-purple": "#7a4d8a",
	"glass-clear": "#bcd6e6"
};
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
const FA_SIZE_M = [
	.28,
	.45,
	.62,
	.82,
	1,
	1.25
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
//#region port/v2/packages/domain/combatcore/src/combatcore.verbatim.js
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
//#endregion
//#region port/v2/packages/domain/worldidentity/src/authority.ts
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
/** Package-internal mint used only after Scene re-derives and freezes the
* complete CF1 hierarchy from production generators. */
function registerCF1WorldAddressAuthority(address) {
	if (!hasWorldShape(address) || !Object.isFrozen(address) || !Object.isFrozen(address.galaxy) || !Object.isFrozen(address.star) || !Object.isFrozen(address.planet)) throw new TypeError("CF1 world authority requires one deeply frozen canonical address");
	REGISTERED_WORLD_KEYS.set(address, address.key);
	return address;
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
function hdGenesFor(g) {
	const S = battleStats(g), r = mulberry32((g.seed ^ 780887) >>> 0);
	const col = S.ab && S.ab.col || "#c8a878";
	const plan = (g.body || 0) % 16;
	const headTxt = FA_HEAD[(g.head || 0) % FA_HEAD.length] || "";
	const trait = FA_TRAIT[(g.trait || 0) % FA_TRAIT.length] || "";
	const patTxt = FA_PATTERN[(g.pattern || 0) % FA_PATTERN.length] || "";
	const sizeM = FA_SIZE_M[(g.size || 2) % FA_SIZE_M.length] || 1;
	const hideHex = SP_HEX[SP_COLOR[(g.color || 0) % SP_COLOR.length]] || "#8a9bb5";
	const hn = parseInt(hideHex.slice(1), 16), an = parseInt(col.slice(1), 16);
	const bmix = (a, b2) => Math.round(Math.min(255, a * .62 + b2 * .38));
	const base = [
		bmix(hn >> 16 & 255, an >> 16 & 255),
		bmix(hn >> 8 & 255, an >> 8 & 255),
		bmix(hn & 255, an & 255)
	];
	const horn = headTxt.includes("horn") || headTxt.includes("crest") || /crystal antlers/.test(trait) ? .7 + r() * .4 : plan === 11 ? 1 : plan === 10 ? .5 : 0;
	const rot = ((g.accent || 0) % 2 ? 1 : -1) * (26 + (g.accent || 0) % 5 * 6);
	const _h2r = (rgb, deg) => {
		const [R, G2, B] = rgb;
		const mx = Math.max(R, G2, B), mn = Math.min(R, G2, B);
		const l = (mx + mn) / 2;
		let h = 0, s2 = 0;
		const d2 = mx - mn;
		if (d2) {
			s2 = l > 127 ? d2 / (510 - mx - mn) : d2 / (mx + mn);
			h = mx === R ? (G2 - B) / d2 + (G2 < B ? 6 : 0) : mx === G2 ? (B - R) / d2 + 2 : (R - G2) / d2 + 4;
			h *= 60;
		}
		h = (h + deg + 360) % 360;
		const c2 = (1 - Math.abs(2 * l / 255 - 1)) * s2 * 255, x2 = c2 * (1 - Math.abs(h / 60 % 2 - 1)), m2 = l - c2 / 2;
		const [r5, g5, b5] = h < 60 ? [
			c2,
			x2,
			0
		] : h < 120 ? [
			x2,
			c2,
			0
		] : h < 180 ? [
			0,
			c2,
			x2
		] : h < 240 ? [
			0,
			x2,
			c2
		] : h < 300 ? [
			x2,
			0,
			c2
		] : [
			c2,
			0,
			x2
		];
		return [
			Math.round(clamp(r5 + m2, 0, 255)),
			Math.round(clamp(g5 + m2, 0, 255)),
			Math.round(clamp(b5 + m2, 0, 255))
		];
	};
	const base2 = _h2r(base, rot);
	const pat = [
		base2[0] * .5 + (an >> 16 & 255) * .3 | 0,
		base2[1] * .5 + (an >> 8 & 255) * .3 | 0,
		base2[2] * .5 + (an & 255) * .3 | 0
	];
	const irid = _h2r(base, rot > 0 ? 130 : -130), irid2 = _h2r(base, rot > 0 ? -110 : 110);
	const tier = S.tier | 0;
	const R = {
		bulk: clamp(.62 + sizeM * .3 + S.vit / 400 * .3, .6, 1.7),
		len: .82 + (g.size || 2) % 5 * .09 + (g.body || 0) % 4 * .05,
		neck: .3 + (g.head || 0) % 5 * .13,
		horn,
		tail: .35 + (g.tail || 0) % 7 * .09,
		leg: plan === 2 || plan === 12 ? .9 : .3 + (g.limbs || 0) % 6 * .09,
		stripes: patTxt === "striped" || patTxt === "banded" ? .75 : 0,
		mottle: /mottled|spotted|marbled/.test(patTxt) ? .95 : .62,
		aqua: /swim|filter|jet|brine-crawl/.test(locoOf(g)) || /ocean|shallows|reef|vent|trench|lakeshore|sea/.test(habOf(g)),
		airb: /glider|floater|drifter|soarer|storm-rider|winged/.test(locoOf(g)) || /cloud deck|updraft/.test(habOf(g)),
		base,
		base2,
		pat,
		irid,
		irid2,
		dark: [
			base[0] * .42 | 0,
			base[1] * .42 | 0,
			base[2] * .42 | 0
		],
		finish: tier >= 8 ? 3 : tier >= 6 ? 2 : tier >= 4 ? 1 : 0,
		rim: g.lumin ? col : "rgba(255,220,170,1)",
		eye: col,
		plan,
		glow: !!g.lumin,
		apex: !!g.apex,
		par: !!g.par,
		tier,
		heat: (g.habitat || 0) % FA_HABITAT.length
	};
	R.headK = (g.head || 0) % FA_HEAD.length;
	R.eyeN = FA_EYES[(g.eyes || 0) % FA_EYES.length];
	R.tailK = (g.tail || 0) % FA_TAIL.length;
	R.limbN = FA_LIMBS[(g.limbs || 0) % FA_LIMBS.length];
	R.skinK = (g.skin || 0) % FA_SKIN.length;
	R.dietK = (g.diet || 0) % FA_DIET.length;
	if (g._earthName) {
		R._earthName = g._earthName;
		try {
			const rec = _earthArt(g._earthName);
			if (rec) {
				R.airb = !!rec.airb;
				R.aqua = !!rec.aqua;
				Object.assign(R, rec);
				R.dark = [
					R.base[0] * .42 | 0,
					R.base[1] * .42 | 0,
					R.base[2] * .42 | 0
				];
				if (!("pat" in rec)) R.pat = [
					R.base[0] * .5 | 0,
					R.base[1] * .5 | 0,
					R.base[2] * .5 | 0
				];
				R._recPelt = "stripes" in rec || "mottle" in rec;
				if (!("stripes" in rec)) R.stripes = 0;
				if (!("mottle" in rec)) R.mottle = Math.min(R.mottle || .62, .4);
			}
		} catch (_) {}
	} else if (g._earthBlend) try {
		const rec = _earthArt(g._earthBlend);
		if (rec) {
			const kB = R.base, kB2 = R.base2, kP = R.pat, kI = R.irid, kI2 = R.irid2, kE = R.eye, kR = R.rim, kG = R.glow;
			R.airb = !!rec.airb;
			R.aqua = !!rec.aqua;
			Object.assign(R, rec);
			R.base = kB;
			R.base2 = kB2;
			R.pat = kP;
			R.irid = kI;
			R.irid2 = kI2;
			R.eye = kE;
			R.rim = kR;
			R.glow = kG;
			R.dark = [
				R.base[0] * .42 | 0,
				R.base[1] * .42 | 0,
				R.base[2] * .42 | 0
			];
			R._recPelt = "stripes" in rec || "mottle" in rec;
			R._earthBlend = g._earthBlend;
			delete R._earthName;
			R._anchor = g._anchorVal != null ? g._anchorVal : .85;
			R._gen = g.gen || 1;
		}
	} catch (_) {}
	return R;
}
//#endregion
//#region port/v2/packages/domain/descriptors/src/apphooks.verbatim.js
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
//#region port/v2/packages/scene/src/address.ts
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
//#region port/v2/packages/scene/src/system.ts
function systemScene(starSeed, source = systemFor) {
	const sys = source(starSeed);
	const planets = (sys.planets || []).map((pl, ordinal) => ({
		name: pl.name || "Planet",
		orb: pl.orb ?? 0,
		seed: pl.P.seed,
		ordinal,
		type: pl.P.type || "rocky",
		ring: !!pl.P.ring,
		moons: pl.P.moons || 0,
		P: pl.P
	})).sort((a, b) => a.orb - b.orb);
	return {
		starSeed,
		sol: !!sys.sol,
		kind: sys.kind || "",
		starCol: sys.starCol || "",
		starR: sys.starR || 0,
		planets,
		belt: sys.belt ?? null,
		kuiper: sys.kuiper ?? null,
		hz: sys.hz ?? null
	};
}
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
function deepFreeze$1(value) {
	if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
		for (const child of Object.values(value)) deepFreeze$1(child);
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
	return deepFreeze$1({
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
	return deepFreeze$1(Object.fromEntries(BIOME_PROFILE_KEYS_V1.map((key) => [key, supplied.get(key)])));
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
	return deepFreeze$1({
		schema: BIOME_PROFILE_SCHEMA_V1,
		digest: digestCanonicalProfiles(profiles),
		keys: BIOME_PROFILE_KEYS_V1,
		profiles
	});
}
const BIOME_PROFILE_AUTHORITY_V1 = createBiomeProfileAuthorityV1(AUTHORED_BIOME_PROFILE_ENTRIES_V1);
BIOME_PROFILE_AUTHORITY_V1.profiles;
const CANONICAL_CLIMATE_BANDS = Object.freeze([
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
const CANONICAL_BIOSPHERE_KEY_SET = new Set(CANONICAL_BIOSPHERE_KEYS);
const SOURCES = Object.freeze({
	systemFor,
	climateBand,
	biosphere,
	planetSpecies: planetSpeciesAtEcologyEpoch,
	nameEarth: _earthNamePass$1,
	biomeFor
});
const CANONICAL_PLANET_TYPES = Object.freeze([
	"terran",
	"ocean",
	"ice",
	"desert",
	"rocky",
	"venus",
	"lava",
	"gas"
]);
const DEFAULT_BIOME_PROFILE_KEY = Object.freeze({
	terran: "temperate",
	ocean: "opensea",
	ice: "glacier",
	desert: "dunesea",
	rocky: "cratered",
	venus: "acidhaze",
	lava: "emberfield",
	gas: "banded"
});
const CANONICAL_WORLD_ROSTERS = /* @__PURE__ */ new WeakSet();
const MAX_WORLD_ROSTER_ROWS = 64;
const MAX_WORLD_ROSTER_OBJECT_KEYS = 64;
const MAX_WORLD_ROSTER_ARRAY_LENGTH = 64;
const MAX_WORLD_ROSTER_DATA_DEPTH = 8;
const MAX_WORLD_ROSTER_DATA_ENTRIES = 4096;
const MAX_WORLD_ROSTER_DATA_CODE_UNITS = 262144;
function spendRosterBudget(budget, entries, codeUnits) {
	budget.entries += entries;
	budget.codeUnits += codeUnits;
	if (budget.entries > MAX_WORLD_ROSTER_DATA_ENTRIES || budget.codeUnits > MAX_WORLD_ROSTER_DATA_CODE_UNITS) throw new RangeError("world roster data exceeds its canonical size budget");
}
function exactArrayDataValues(value, label, maximumLength) {
	if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) throw new TypeError(`${label} must be an exact plain data array`);
	const keys = Reflect.ownKeys(value);
	if (keys.some((key) => typeof key !== "string")) throw new TypeError(`${label} has a symbol key`);
	const stringKeys = keys;
	const lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length");
	if (!lengthDescriptor || !Object.hasOwn(lengthDescriptor, "value") || !Number.isSafeInteger(lengthDescriptor.value) || lengthDescriptor.value < 0 || lengthDescriptor.value > maximumLength) throw new RangeError(`${label} exceeds its canonical length budget`);
	const length = lengthDescriptor.value;
	if (stringKeys.length !== length + 1 || stringKeys.some((key) => key !== "length" && (!/^(?:0|[1-9]\d*)$/u.test(key) || Number(key) >= length))) throw new TypeError(`${label} must be dense and contain no extra properties`);
	const values = [];
	for (let index = 0; index < length; index++) {
		const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
		if (!descriptor || !Object.hasOwn(descriptor, "value") || descriptor.enumerable !== true) throw new TypeError(`${label}[${index}] must be an enumerable data property`);
		values.push(descriptor.value);
	}
	return values;
}
function cloneCanonicalRosterData(value, label, depth, ancestors, budget) {
	if (depth > MAX_WORLD_ROSTER_DATA_DEPTH) throw new RangeError("world roster data exceeds its canonical depth budget");
	if (value === null || typeof value === "boolean") {
		spendRosterBudget(budget, 1, 0);
		return value;
	}
	if (typeof value === "number") {
		if (!Number.isFinite(value)) throw new TypeError("world roster contains a non-finite number");
		spendRosterBudget(budget, 1, 0);
		return value;
	}
	if (typeof value === "string") {
		spendRosterBudget(budget, 1, value.length);
		return value;
	}
	if (typeof value !== "object") throw new TypeError(`world roster contains unsupported ${typeof value} data`);
	if (ancestors.has(value)) throw new TypeError("world roster contains a cyclic row");
	ancestors.add(value);
	try {
		if (Array.isArray(value)) {
			const values = exactArrayDataValues(value, label, MAX_WORLD_ROSTER_ARRAY_LENGTH);
			spendRosterBudget(budget, 1, 0);
			return values.map((entry, index) => cloneCanonicalRosterData(entry, `${label}[${index}]`, depth + 1, ancestors, budget));
		}
		if (Object.getPrototypeOf(value) !== Object.prototype) throw new TypeError(`${label} must be an exact plain data object`);
		const keys = Reflect.ownKeys(value);
		if (keys.length > MAX_WORLD_ROSTER_OBJECT_KEYS) throw new RangeError(`${label} exceeds its canonical key budget`);
		if (keys.some((key) => typeof key !== "string")) throw new TypeError(`${label} has a symbol key`);
		spendRosterBudget(budget, 1, keys.reduce((total, key) => total + key.length, 0));
		const clone = {};
		for (const key of keys) {
			const descriptor = Object.getOwnPropertyDescriptor(value, key);
			if (!descriptor || !Object.hasOwn(descriptor, "value") || descriptor.enumerable !== true) throw new TypeError(`${label}.${key} must be an enumerable data property`);
			Object.defineProperty(clone, key, {
				configurable: true,
				enumerable: true,
				writable: true,
				value: cloneCanonicalRosterData(descriptor.value, `${label}.${key}`, depth + 1, ancestors, budget)
			});
		}
		return clone;
	} finally {
		ancestors.delete(value);
	}
}
function detachedRosterRows(value, label) {
	const sourceRows = exactArrayDataValues(value, label, MAX_WORLD_ROSTER_ROWS);
	const budget = {
		entries: 0,
		codeUnits: 0
	};
	return sourceRows.map((sourceRow, index) => {
		if (sourceRow === null || typeof sourceRow !== "object" || Array.isArray(sourceRow) || Object.getPrototypeOf(sourceRow) !== Object.prototype) throw new TypeError(`${label}[${index}] must be an exact plain data object`);
		const clone = cloneCanonicalRosterData(sourceRow, `${label}[${index}]`, 0, /* @__PURE__ */ new Set(), budget);
		if (!Number.isInteger(clone.seed) || clone.seed < 0 || clone.seed > 4294967295) throw new TypeError(`${label}[${index}].seed must be an exact uint32`);
		if (typeof clone.kingdom !== "string" || ![
			"fauna",
			"flora",
			"fungi",
			"microbe"
		].includes(clone.kingdom)) throw new TypeError(`${label}[${index}].kingdom is not canonical`);
		return clone;
	});
}
function freezeCanonicalRosterData(value) {
	if (!value || typeof value !== "object") return;
	for (const key of Reflect.ownKeys(value)) {
		const descriptor = Object.getOwnPropertyDescriptor(value, key);
		if (descriptor && Object.hasOwn(descriptor, "value")) freezeCanonicalRosterData(descriptor.value);
	}
	Object.freeze(value);
}
function isCanonicalWorldRoster(value) {
	return value !== null && typeof value === "object" && CANONICAL_WORLD_ROSTERS.has(value);
}
function messageOf(error) {
	return error instanceof Error ? error.message : String(error);
}
function rosterFailure(reason, message) {
	return Object.freeze({
		ok: false,
		reason,
		message
	});
}
function canonicalBiosphereKey(key, planetSeed) {
	if (!CANONICAL_BIOSPHERE_KEY_SET.has(key)) throw new TypeError(`biosphere source returned unsupported key ${JSON.stringify(key)}`);
	if (planetSeed === 133 && key !== "earth") throw new TypeError("planet seed 133 requires biosphere key \"earth\"");
	if (planetSeed !== 133 && key === "earth") throw new TypeError("biosphere key \"earth\" is only valid for planet seed 133");
	return key;
}
function freezeDetachedRow(row) {
	freezeCanonicalRosterData(row);
	return row;
}
function canonicalFingerprintValue(value, ancestors = /* @__PURE__ */ new Set()) {
	if (value === null) return "null";
	if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
	if (typeof value === "number") {
		if (!Number.isFinite(value)) throw new TypeError("world roster contains a non-finite number");
		return Object.is(value, -0) ? "-0" : String(value);
	}
	if (typeof value !== "object") throw new TypeError(`world roster contains unsupported ${typeof value} data`);
	if (ancestors.has(value)) throw new TypeError("world roster contains a cyclic row");
	ancestors.add(value);
	try {
		if (Array.isArray(value)) return `[${value.map((entry) => canonicalFingerprintValue(entry, ancestors)).join(",")}]`;
		const prototype = Object.getPrototypeOf(value);
		if (prototype !== Object.prototype && prototype !== null) throw new TypeError("world roster contains a non-canonical object");
		const record = value;
		return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalFingerprintValue(record[key], ancestors)}`).join(",")}}`;
	} finally {
		ancestors.delete(value);
	}
}
function fnv1a32(value) {
	let hash = 2166136261;
	for (let index = 0; index < value.length; index++) {
		hash ^= value.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return hash >>> 0;
}
function canonicalPlanetType(value) {
	if (typeof value !== "string" || !CANONICAL_PLANET_TYPES.includes(value)) throw new TypeError("world roster source returned an unsupported planet type");
	return value;
}
function canonicalClimateBand(value) {
	if (typeof value !== "string" || !CANONICAL_CLIMATE_BANDS.includes(value)) throw new TypeError("world roster source returned an unsupported climate band");
	return value;
}
function canonicalBiomePresentation(planet, band, classifier) {
	const type = canonicalPlanetType(planet.type);
	const selected = classifier(planet, band);
	let candidate;
	if (selected !== null && selected !== void 0) {
		if (typeof selected !== "object" || Array.isArray(selected) || Object.getPrototypeOf(selected) !== Object.prototype) throw new TypeError("world roster source returned a malformed biome profile selection");
		const descriptor = Object.getOwnPropertyDescriptor(selected, "k");
		if (!descriptor || !Object.hasOwn(descriptor, "value")) throw new TypeError("world roster source returned a biome selection without a data key");
		candidate = descriptor.value;
	}
	if (candidate !== void 0 && candidate !== null && (typeof candidate !== "string" || !BIOME_PROFILE_KEYS_V1.includes(candidate))) throw new TypeError("world roster source returned an unsupported biome profile key");
	const key = typeof candidate === "string" ? candidate : DEFAULT_BIOME_PROFILE_KEY[type];
	return Object.freeze({
		schema: BIOME_PROFILE_AUTHORITY_V1.schema,
		digest: BIOME_PROFILE_AUTHORITY_V1.digest,
		key,
		profile: BIOME_PROFILE_AUTHORITY_V1.profiles[key]
	});
}
function environmentFingerprint(worldKey, ecologyEpoch, biosphereKey, band, biome) {
	const canonical = JSON.stringify([
		worldKey,
		ecologyEpoch,
		biosphereKey,
		band,
		biome.schema,
		biome.digest,
		biome.key
	]);
	return `cwe1:${canonical.length}:${fnv1a32(canonical).toString(16).padStart(8, "0")}`;
}
function fullRosterFingerprint(worldKey, ecologyEpoch, rows) {
	const canonical = canonicalFingerprintValue([
		worldKey,
		ecologyEpoch,
		rows
	]);
	return `cwr1:${rows.length}:${canonical.length}:${fnv1a32(canonical).toString(16).padStart(8, "0")}`;
}
function earthVagrants(ecologyEpoch) {
	if (ecologyEpoch === 0) return [];
	const random = mulberry32(hashInt(133, ecologyEpoch, 31390) >>> 0);
	const count = 1 + (random() < .5 ? 1 : 0);
	const rows = [];
	for (let index = 0; index < count; index++) {
		const kingdom = random() < .7 ? "fauna" : "flora";
		const genome = evolveGenome(makeGenome(hashInt(133, ecologyEpoch * 163 + index + 1, 959089) >>> 0, kingdom, 1), 0);
		genome._cradle = 1;
		genome._rare = 1;
		rows.push(genome);
	}
	return rows;
}
function buildRoster(candidate, ecologyEpochValue, sources) {
	if (!isCanonicalCF1Address(candidate) || !("planet" in candidate) || candidate.key !== getProvenPlanetKey(candidate.planet)) return rosterFailure("unproven-address", "world roster requires a proven canonical CF1 world address");
	const address = candidate;
	let ecologyEpoch;
	try {
		ecologyEpoch = checkedEcologyEpoch(ecologyEpochValue);
	} catch (error) {
		return rosterFailure("invalid-epoch", messageOf(error));
	}
	try {
		const system = sources.systemFor(address.star.seed);
		if (!system || typeof system !== "object" || Array.isArray(system) || !Array.isArray(system.planets)) throw new TypeError("system source returned a malformed system");
		const planet = systemScene(address.star.seed, () => system).planets.find((node) => node.ordinal === address.planet.ordinal);
		if (!planet || planet.seed !== address.planet.seed) return rosterFailure("address-mismatch", `canonical world ${address.key} does not match its source planet ordinal`);
		const random = mulberry32((planet.seed ^ 19088743) >>> 0);
		const band = canonicalClimateBand(sources.climateBand(planet.P, system, planet.orb));
		const bio = sources.biosphere(planet.P, system, band, random);
		if (!bio || typeof bio.key !== "string" || !bio.key) throw new TypeError("biosphere source returned a malformed key");
		const biosphereKey = canonicalBiosphereKey(bio.key, planet.seed);
		const biome = canonicalBiomePresentation(planet.P, band, sources.biomeFor ?? biomeFor);
		let rows = [];
		if (biosphereKey !== "none") {
			const speciesLevel = biosphereKey === "earth" ? "complex" : biosphereKey;
			rows = detachedRosterRows(sources.planetSpecies(planet.P, system, band, speciesLevel, ecologyEpoch), `species source roster for biosphere key "${biosphereKey}"`);
			if (rows.length === 0) throw new TypeError(`biosphere key "${biosphereKey}" returned an empty inhabited roster`);
			if (biosphereKey === "earth") {
				sources.nameEarth(rows);
				rows = detachedRosterRows(rows, "named Earth starter roster");
				let vagrants = earthVagrants(ecologyEpoch);
				sources.nameEarth(vagrants);
				vagrants = detachedRosterRows(vagrants, "named Earth vagrant roster");
				rows.push(...vagrants);
				if (rows.length > MAX_WORLD_ROSTER_ROWS) throw new RangeError("Earth roster exceeds its canonical row budget");
				for (const row of rows) row._cradle = 1;
			}
		}
		const frozenRows = rows.map(freezeDetachedRow);
		return Object.freeze({
			ok: true,
			roster: Object.freeze({
				address,
				worldKey: address.key,
				starSeed: address.star.seed,
				planetSeed: planet.seed,
				planetOrdinal: planet.ordinal,
				biosphereKey,
				ecologyEpoch,
				climateBand: band,
				biomeProfileSchema: biome.schema,
				biomeProfileDigest: biome.digest,
				biomeProfileKey: biome.key,
				biomeProfile: biome.profile,
				environmentFingerprint: environmentFingerprint(address.key, ecologyEpoch, biosphereKey, band, biome),
				fullRosterFingerprint: fullRosterFingerprint(address.key, ecologyEpoch, frozenRows),
				view: worldRosterView(frozenRows)
			})
		});
	} catch (error) {
		return rosterFailure("source-error", messageOf(error));
	}
}
function canonicalWorldRoster(address, ecologyEpoch) {
	const built = buildRoster(address, ecologyEpoch, SOURCES);
	if (!built.ok) return built;
	const roster = built.roster;
	CANONICAL_WORLD_ROSTERS.add(roster);
	return Object.freeze({
		ok: true,
		roster
	});
}
function worldRosterView(rows) {
	if (!Array.isArray(rows)) throw new TypeError("world roster must be an array");
	const all = Object.freeze([...rows]);
	const preview = Object.freeze(all.slice(0, 8));
	return Object.freeze({
		all,
		preview,
		total: all.length,
		hiddenFromPreview: Math.max(0, all.length - preview.length)
	});
}
//#endregion
//#region port/v2/apps/game/src/biome-vista-surface.ts
const PLANET_TYPES = Object.freeze([
	"terran",
	"ocean",
	"ice",
	"desert",
	"rocky",
	"venus",
	"lava",
	"gas"
]);
const SEA_KEYS = /* @__PURE__ */ new Set([
	"opensea",
	"archipelago",
	"stormsea",
	"volcisle",
	"milksea"
]);
function planetType(value) {
	if (typeof value !== "string" || !PLANET_TYPES.includes(value)) throw new TypeError("biome vista projection: unsupported planet type");
	return value;
}
function hasCanonicalEarthMagneticFieldV1(roster) {
	const address = roster.address;
	return address.galaxy.seed === 999 && address.galaxy.x === HOME_POS.x && address.galaxy.y === HOME_POS.y && address.star.seed === 424242 && address.star.x === SOL_POS.x && address.star.y === SOL_POS.y && address.planet.seed === 133 && address.planet.ordinal === 2;
}
function surfaceWater(type, band) {
	if (type === "ocean") return "liquid";
	if (type === "ice") return "frozen";
	if (type !== "terran") return "none";
	if (band === "hot") return "none";
	if (band === "cold" || band === "frozen") return "frozen";
	return "liquid";
}
function residentClass(genome) {
	const locomotion = locoOf(genome);
	const habitat = habOf(genome);
	if (/swim|filter|current/u.test(locomotion) || /open ocean|sea shallows|vent fields/u.test(habitat)) return "aqua";
	if (/glider|floater|drift/u.test(locomotion) || /cloud decks/u.test(habitat)) return "air";
	return "land";
}
/** One deterministic weather authority shared by vista presentation and
* descent policy, so the visible storm and its landing modifier cannot drift. */
function projectStaticBiomeWeatherV1(typeValue, band, seed) {
	const type = planetType(typeValue);
	if (typeof band !== "string" || !Number.isInteger(seed) || seed < 0 || seed > 4294967295) throw new TypeError("static biome weather requires a canonical climate and planet seed");
	const candidate = type === "terran" ? band === "temperate" ? "rain" : band === "hot" ? "haze" : "snow" : type === "ocean" ? "rain" : type === "ice" ? "snow" : type === "desert" ? "dust" : type === "lava" ? "ash" : type === "venus" ? "haze" : null;
	if (!candidate) return null;
	const odds = Object.freeze({
		rain: .42,
		snow: .58,
		dust: .48,
		ash: .68,
		haze: .88
	});
	return mulberry32((seed ^ 30698) >>> 0)() < (odds[candidate] ?? 1) ? candidate : null;
}
function timeOfDay(seed) {
	const phase = mulberry32((seed ^ 54439) >>> 0)();
	return phase < .62 ? "day" : phase < .82 ? "twilight" : "night";
}
function buildBiomeVistaRenderRequestV1(planet, starSeed, expectedWorldKey, system, roster) {
	if (!isCanonicalWorldRoster(roster) || !Number.isInteger(planet.seed) || planet.seed < 0 || planet.seed > 4294967295 || !Number.isInteger(starSeed) || starSeed < 0 || starSeed > 4294967295 || roster.starSeed !== starSeed || typeof expectedWorldKey !== "string" || expectedWorldKey.length === 0 || roster.worldKey !== expectedWorldKey || roster.planetSeed !== planet.seed || roster.planetOrdinal !== planet.ordinal) throw new TypeError("biome vista projection: proven world and roster must match");
	const type = planetType(planet.P.type ?? planet.type);
	const key = roster.biomeProfileKey;
	const band = roster.climateBand;
	if (roster.biomeProfileSchema !== BIOME_PROFILE_AUTHORITY_V1.schema || roster.biomeProfileDigest !== BIOME_PROFILE_AUTHORITY_V1.digest || roster.biomeProfile !== BIOME_PROFILE_AUTHORITY_V1.profiles[key]) throw new TypeError("biome vista projection: canonical profile authority changed");
	const identity = Object.freeze({
		worldKey: roster.worldKey,
		environmentFingerprint: roster.environmentFingerprint,
		profileSchema: roster.biomeProfileSchema,
		profileDigest: roster.biomeProfileDigest,
		biomeKey: key
	});
	const tod = timeOfDay(planet.seed);
	const wx = projectStaticBiomeWeatherV1(type, band, planet.seed);
	const rows = roster.view.all;
	const fauna = rows.filter((row) => row.kingdom === "fauna");
	const land = fauna.filter((row) => residentClass(row) === "land");
	const aqua = fauna.filter((row) => residentClass(row) === "aqua");
	const air = fauna.filter((row) => residentClass(row) === "air");
	const flora = rows.filter((row) => row.kingdom === "flora");
	const groundFlora = flora.filter((row) => !row.aq && !row.af);
	const faunaGenes = (items) => items.slice(0, 3).map((row) => hdGenesFor(row));
	if (type === "gas") {
		const hue = Number.isFinite(planet.P.hue) ? Number(planet.P.hue) : 30;
		const spotHue = Number.isFinite(planet.P.spotHue) ? Number(planet.P.spotHue) : void 0;
		return Object.freeze({
			...identity,
			scene: "gas",
			options: Object.freeze({
				seed: planet.seed,
				hue,
				spot: !!planet.P.spot,
				...spotHue === void 0 ? {} : { spotHue },
				ring: planet.ring,
				moons: planet.moons,
				tod,
				aurora: true,
				air: air.length,
				wb: key,
				airGenes: air.length ? faunaGenes(air).slice(0, 2) : null,
				aerFlora: flora.filter((row) => !!row.af).slice(0, 1),
				evt: null,
				titan: false
			})
		});
	}
	if (key === "abyssal") return Object.freeze({
		...identity,
		scene: "abyss",
		options: Object.freeze({
			seed: planet.seed,
			aqua: aqua.length,
			genes: faunaGenes(aqua)
		})
	});
	if (key === "coral") return Object.freeze({
		...identity,
		scene: "reef",
		options: Object.freeze({
			seed: planet.seed,
			genes: faunaGenes(aqua)
		})
	});
	let pal = "day";
	if (type === "ice") pal = "ice";
	else if (type === "rocky") pal = "grey";
	else if (type === "venus") pal = "haze";
	else if (type === "desert") pal = wx === "dust" ? "dust" : "sand";
	else if (type === "lava") pal = "ember";
	else if (type === "terran" || type === "ocean") {
		if (tod === "night") pal = "night";
		else if (tod === "twilight") pal = "twilight";
		else if (wx === "rain") pal = "rain";
		else if (wx === "snow" || band === "cold" || band === "frozen") pal = "snow";
	}
	const hasField = hasCanonicalEarthMagneticFieldV1(roster) || (type === "terran" || type === "ocean") && mulberry32((planet.seed ^ 48879) >>> 0)() < .8;
	const clockGrade = type !== "terran" && type !== "ocean" && type !== "lava";
	const starColor = typeof system.starCol === "string" ? system.starCol : null;
	return Object.freeze({
		...identity,
		scene: "generic",
		options: Object.freeze({
			seed: planet.seed,
			era: "none",
			pal,
			biome: type === "ocean" || type === "terran" && SEA_KEYS.has(key) ? "island" : "land",
			wx,
			moons: planet.moons,
			aurora: hasField && wx !== "rain" && wx !== "snow",
			nightize: clockGrade && tod === "night",
			duskize: clockGrade && tod === "twilight",
			flora: groundFlora.length > 0,
			water: surfaceWater(type, band),
			genes: land.length ? faunaGenes(land) : null,
			floraGenes: groundFlora.slice(0, 2),
			ring: planet.ring,
			stc: starColor,
			herd: land.length,
			aqua: aqua.length,
			air: air.length,
			wb: key,
			evt: null,
			titan: false,
			salt: 0
		})
	});
}
//#endregion
//#region port/v2/packages/art/src/earth-resident-plan.ts
/** Six complete original source genomes, with far-to-near contact anchors.
* Captured from the full canonical Earth epoch-0 roster in
* audits/AV_EARTH_LAYERED_SCENE_20260908/canonical-earth.json. */
const EARTH_RESIDENT_LAYER_PLAN_JSON_V1 = "{\"schema\":\"cf.art.earth-resident-layer.v1\",\"sceneId\":\"painted-earth-riverbank-v1\",\"width\":960,\"height\":430,\"worldKey\":\"CF1|g:999@90,-60|s:424242@560,170|p:133#2\",\"environmentFingerprint\":\"cwe1:148:50c1b7d6\",\"fullRosterFingerprint\":\"cwr1:19:6305:58e079f2\",\"residents\":[{\"name\":\"Civet\",\"kingdom\":\"fauna\",\"genome\":{\"seed\":3212817920,\"kingdom\":\"fauna\",\"color\":14,\"form\":12,\"body\":13,\"loco\":6,\"trait\":14,\"size\":4,\"diet\":5,\"head\":5,\"limbs\":3,\"skin\":8,\"tail\":1,\"pattern\":0,\"eyes\":5,\"behavior\":9,\"habitat\":5,\"detail\":4,\"accent\":3,\"temper\":1,\"sense\":7,\"repro\":7,\"life\":5,\"metab\":4,\"lumin\":true,\"gen\":0,\"heat\":1,\"_earthName\":\"Civet\",\"_cradle\":1},\"x\":0.72,\"groundY\":0.77,\"width\":0.15,\"flip\":false,\"family\":\"mammal\"},{\"name\":\"Persimmon\",\"kingdom\":\"flora\",\"genome\":{\"seed\":2058951517,\"kingdom\":\"flora\",\"color\":2,\"form\":17,\"body\":4,\"loco\":0,\"trait\":9,\"size\":3,\"diet\":2,\"head\":7,\"limbs\":1,\"skin\":7,\"tail\":1,\"pattern\":6,\"eyes\":1,\"behavior\":10,\"habitat\":5,\"detail\":9,\"accent\":2,\"temper\":4,\"sense\":3,\"repro\":5,\"life\":4,\"metab\":5,\"lumin\":false,\"gen\":0,\"heat\":1,\"_earthName\":\"Persimmon\",\"_cradle\":1},\"x\":0.13,\"groundY\":0.78,\"width\":0.21,\"flip\":false,\"family\":\"tree\"},{\"name\":\"Platypus\",\"kingdom\":\"fauna\",\"genome\":{\"seed\":4049771185,\"kingdom\":\"fauna\",\"color\":13,\"form\":14,\"body\":12,\"loco\":1,\"trait\":15,\"size\":2,\"diet\":4,\"head\":0,\"limbs\":0,\"skin\":6,\"tail\":4,\"pattern\":7,\"eyes\":0,\"behavior\":3,\"habitat\":9,\"detail\":8,\"accent\":16,\"temper\":7,\"sense\":4,\"repro\":6,\"life\":3,\"metab\":0,\"lumin\":false,\"gen\":0,\"heat\":1,\"_earthName\":\"Platypus\",\"_cradle\":1},\"x\":0.43,\"groundY\":0.86,\"width\":0.2,\"flip\":true,\"family\":\"mammal\"},{\"name\":\"Frog\",\"kingdom\":\"fauna\",\"genome\":{\"seed\":1193089256,\"kingdom\":\"fauna\",\"color\":0,\"form\":12,\"body\":10,\"loco\":11,\"trait\":19,\"size\":0,\"diet\":5,\"head\":9,\"limbs\":4,\"skin\":3,\"tail\":1,\"pattern\":4,\"eyes\":1,\"behavior\":0,\"habitat\":17,\"detail\":7,\"accent\":4,\"temper\":8,\"sense\":5,\"repro\":5,\"life\":0,\"metab\":2,\"lumin\":false,\"gen\":0,\"heat\":1,\"_earthName\":\"Frog\",\"_cradle\":1},\"x\":0.25,\"groundY\":0.87,\"width\":0.07,\"flip\":false,\"family\":\"amphibian\"},{\"name\":\"Devil's Club\",\"kingdom\":\"flora\",\"genome\":{\"seed\":1714376717,\"kingdom\":\"flora\",\"color\":14,\"form\":12,\"body\":2,\"loco\":0,\"trait\":11,\"size\":1,\"diet\":4,\"head\":8,\"limbs\":5,\"skin\":6,\"tail\":1,\"pattern\":7,\"eyes\":2,\"behavior\":3,\"habitat\":6,\"detail\":9,\"accent\":15,\"temper\":5,\"sense\":5,\"repro\":6,\"life\":5,\"metab\":1,\"lumin\":false,\"gen\":0,\"heat\":1,\"_earthName\":\"Devil's Club\",\"_cradle\":1},\"x\":0.87,\"groundY\":0.88,\"width\":0.16,\"flip\":false,\"family\":\"shrub\"},{\"name\":\"Cranberry\",\"kingdom\":\"flora\",\"genome\":{\"seed\":1741924755,\"kingdom\":\"flora\",\"color\":4,\"form\":4,\"body\":9,\"loco\":0,\"trait\":9,\"size\":3,\"diet\":1,\"head\":9,\"limbs\":3,\"skin\":0,\"tail\":5,\"pattern\":0,\"eyes\":5,\"behavior\":7,\"habitat\":0,\"detail\":4,\"accent\":10,\"temper\":7,\"sense\":9,\"repro\":2,\"life\":0,\"metab\":2,\"lumin\":false,\"gen\":0,\"heat\":1,\"_earthName\":\"Cranberry\",\"_cradle\":1},\"x\":0.34,\"groundY\":0.9,\"width\":0.11,\"flip\":false,\"family\":\"shrub\"}]}";
function deepFreeze(value) {
	if (value !== null && typeof value === "object") {
		for (const child of Object.values(value)) deepFreeze(child);
		Object.freeze(value);
	}
	return value;
}
const EARTH_RESIDENT_LAYER_PLAN_V1 = deepFreeze(JSON.parse(EARTH_RESIDENT_LAYER_PLAN_JSON_V1));
/** Snapshot descriptors before accessing values, then serialize only detached
* null-prototype objects/arrays. Getters, toJSON hooks, sparse arrays, cycles,
* symbols and unsupported prototypes cannot enter the admitted data graph. */
function snapshotEarthLayerDataV1(value, budget = { remaining: 8192 }, depth = 0) {
	if (--budget.remaining < 0 || depth > 12) throw new TypeError("Earth layer data budget");
	if (value === null || typeof value === "boolean") return value;
	if (typeof value === "string" && value.length <= 4096) return value;
	if (typeof value === "number" && Number.isFinite(value) && !Object.is(value, -0)) return value;
	if (typeof value !== "object" || value === null) throw new TypeError("Earth layer plain data");
	const array = Array.isArray(value);
	const prototype = Object.getPrototypeOf(value);
	if (array ? prototype !== Array.prototype && prototype !== null : prototype !== Object.prototype && prototype !== null) throw new TypeError("Earth layer prototype");
	const keys = Reflect.ownKeys(value);
	if (keys.length > 128 || keys.some((key) => typeof key !== "string")) throw new TypeError("Earth layer data keys");
	const snapshot = array ? Object.setPrototypeOf([], null) : Object.create(null);
	let length = 0;
	if (array) {
		const descriptor = Object.getOwnPropertyDescriptor(value, "length");
		if (!descriptor || !Object.hasOwn(descriptor, "value") || !Number.isSafeInteger(descriptor.value) || descriptor.value < 0 || descriptor.value > 127 || keys.length !== descriptor.value + 1) throw new TypeError("Earth layer dense array");
		length = descriptor.value;
	}
	for (const key of keys) {
		if (array && key === "length") continue;
		if (array && (!/^(?:0|[1-9]\d*)$/u.test(key) || Number(key) >= length)) throw new TypeError("Earth layer array key");
		const descriptor = Object.getOwnPropertyDescriptor(value, key);
		if (!descriptor || !Object.hasOwn(descriptor, "value") || descriptor.enumerable !== true) throw new TypeError("Earth layer descriptor");
		Object.defineProperty(snapshot, key, {
			value: snapshotEarthLayerDataV1(descriptor.value, budget, depth + 1),
			enumerable: true,
			configurable: true,
			writable: true
		});
	}
	return snapshot;
}
const ROSTER_KEYS = Object.freeze([
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
const VIEW_KEYS = Object.freeze([
	"all",
	"preview",
	"total",
	"hiddenFromPreview"
]);
function exactKeys(value, keys) {
	return Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
}
/** Static six-resident presentation compatibility, independent of the exact
* world JSON gate. Named-family annotations come from audited art owners;
* raw Earth body/habitat/loco genes are not a species-to-biome classifier.
* This neither filters nor rerolls the canonical gameplay roster. */
function earthResidentFamiliesFitBiomeProfileV1(residents, biomeProfile) {
	try {
		const rows = snapshotEarthLayerDataV1(residents);
		const profile = snapshotEarthLayerDataV1(biomeProfile);
		if (!Array.isArray(rows) || rows.length !== EARTH_RESIDENT_LAYER_PLAN_V1.residents.length || profile === null || typeof profile !== "object" || Array.isArray(profile) || !Array.isArray(profile.fauna) || !Array.isArray(profile.flora)) return false;
		const seen = /* @__PURE__ */ new Set();
		for (let index = 0; index < rows.length; index++) {
			const row = rows[index];
			if (row === null || typeof row !== "object" || Array.isArray(row)) return false;
			const expected = EARTH_RESIDENT_LAYER_PLAN_V1.residents.find((entry) => entry.name === row.name);
			if (!expected || seen.has(expected.name) || row.kingdom !== expected.kingdom || row.family !== expected.family || !Array.prototype.includes.call(profile[expected.kingdom], expected.family)) return false;
			seen.add(expected.name);
		}
		return true;
	} catch {
		return false;
	}
}
function buildEarthLayeredRecipeV1(request, roster) {
	try {
		const requestData = snapshotEarthLayerDataV1(request);
		const rosterData = snapshotEarthLayerDataV1(roster);
		if (JSON.stringify(requestData) !== "{\"worldKey\":\"CF1|g:999@90,-60|s:424242@560,170|p:133#2\",\"environmentFingerprint\":\"cwe1:148:50c1b7d6\",\"profileSchema\":\"cf.domain.biome-profile.v1\",\"profileDigest\":\"bpd1-6fce883d4d70e3b6bde0fb184b416e8e\",\"biomeKey\":\"temperate\",\"scene\":\"generic\",\"options\":{\"seed\":133,\"era\":\"none\",\"pal\":\"rain\",\"biome\":\"land\",\"wx\":\"rain\",\"moons\":1,\"aurora\":false,\"nightize\":false,\"duskize\":false,\"flora\":true,\"water\":\"liquid\",\"genes\":[{\"bulk\":0.83975,\"len\":1,\"neck\":0.3,\"horn\":0,\"tail\":0.71,\"leg\":0.9,\"stripes\":0,\"mottle\":0.95,\"aqua\":false,\"airb\":false,\"base\":[201,146,77],\"base2\":[201,80,77],\"pat\":[161,88,70],\"irid\":[125,77,201],\"irid2\":[77,201,125],\"dark\":[84,61,32],\"finish\":0,\"rim\":\"rgba(255,220,170,1)\",\"eye\":\"#caa06a\",\"plan\":12,\"glow\":false,\"apex\":false,\"par\":false,\"tier\":0,\"heat\":9,\"headK\":0,\"eyeN\":2,\"tailK\":4,\"limbN\":2,\"skinK\":6,\"dietK\":4,\"_earthName\":\"Platypus\"},{\"bulk\":0.9747499999999999,\"len\":1.23,\"neck\":0.3,\"horn\":0,\"tail\":0.43999999999999995,\"leg\":0.5700000000000001,\"stripes\":0,\"mottle\":0.62,\"aqua\":false,\"airb\":false,\"base\":[136,179,126],\"base2\":[126,179,155],\"pat\":[123,137,109],\"irid\":[126,127,179],\"irid2\":[179,126,127],\"dark\":[57,75,52],\"finish\":0,\"rim\":\"#caa06a\",\"eye\":\"#caa06a\",\"plan\":13,\"glow\":true,\"apex\":false,\"par\":false,\"tier\":2,\"heat\":5,\"headK\":5,\"eyeN\":0,\"tailK\":1,\"limbN\":8,\"skinK\":8,\"dietK\":5,\"_earthName\":\"Civet\"},{\"bulk\":0.8540000000000001,\"len\":1.05,\"neck\":0.8200000000000001,\"horn\":0,\"tail\":0.53,\"leg\":0.39,\"stripes\":0,\"mottle\":0.95,\"aqua\":false,\"airb\":false,\"base\":[153,113,177],\"base2\":[113,126,177],\"pat\":[133,99,110],\"irid\":[113,177,142],\"irid2\":[177,142,113],\"dark\":[64,47,74],\"finish\":0,\"rim\":\"rgba(255,220,170,1)\",\"eye\":\"#ff7a4a\",\"plan\":9,\"glow\":false,\"apex\":false,\"par\":false,\"tier\":1,\"heat\":9,\"headK\":9,\"eyeN\":0,\"tailK\":2,\"limbN\":4,\"skinK\":1,\"dietK\":2,\"_earthName\":\"Sea Urchin\"}],\"floraGenes\":[{\"seed\":2058951517,\"kingdom\":\"flora\",\"color\":2,\"form\":17,\"body\":4,\"loco\":0,\"trait\":9,\"size\":3,\"diet\":2,\"head\":7,\"limbs\":1,\"skin\":7,\"tail\":1,\"pattern\":6,\"eyes\":1,\"behavior\":10,\"habitat\":5,\"detail\":9,\"accent\":2,\"temper\":4,\"sense\":3,\"repro\":5,\"life\":4,\"metab\":5,\"lumin\":false,\"gen\":0,\"heat\":1,\"_earthName\":\"Persimmon\",\"_cradle\":1},{\"seed\":1714376717,\"kingdom\":\"flora\",\"color\":14,\"form\":12,\"body\":2,\"loco\":0,\"trait\":11,\"size\":1,\"diet\":4,\"head\":8,\"limbs\":5,\"skin\":6,\"tail\":1,\"pattern\":7,\"eyes\":2,\"behavior\":3,\"habitat\":6,\"detail\":9,\"accent\":15,\"temper\":5,\"sense\":5,\"repro\":6,\"life\":5,\"metab\":1,\"lumin\":false,\"gen\":0,\"heat\":1,\"_earthName\":\"Devil's Club\",\"_cradle\":1}],\"ring\":false,\"stc\":\"#fff4d8\",\"herd\":3,\"aqua\":3,\"air\":2,\"wb\":\"temperate\",\"evt\":null,\"titan\":false,\"salt\":0}}" || rosterData === null || typeof rosterData !== "object" || Array.isArray(rosterData) || !exactKeys(rosterData, ROSTER_KEYS)) return null;
		const view = rosterData.view;
		if (view === null || typeof view !== "object" || Array.isArray(view) || !exactKeys(view, VIEW_KEYS)) return null;
		const authority = Object.create(null);
		for (const key of ROSTER_KEYS) authority[key] = key === "view" ? {
			all: view.all,
			total: view.total
		} : rosterData[key];
		if (JSON.stringify(authority) !== "{\"address\":{\"format\":\"CF1\",\"galaxy\":{\"seed\":999,\"x\":90,\"y\":-60,\"size\":78,\"sp\":0,\"tilt\":0.62,\"rot\":0.5,\"home\":true,\"quasar\":false,\"dwarf\":false,\"parentCell\":{\"x\":0,\"y\":-1}},\"star\":{\"seed\":424242,\"x\":560,\"y\":170,\"layer\":\"coarse\",\"parentCell\":{\"x\":13,\"y\":4}},\"planet\":{\"seed\":133,\"ordinal\":2},\"key\":\"CF1|g:999@90,-60|s:424242@560,170|p:133#2\"},\"worldKey\":\"CF1|g:999@90,-60|s:424242@560,170|p:133#2\",\"starSeed\":424242,\"planetSeed\":133,\"planetOrdinal\":2,\"biosphereKey\":\"earth\",\"ecologyEpoch\":0,\"climateBand\":\"temperate\",\"biomeProfileSchema\":\"cf.domain.biome-profile.v1\",\"biomeProfileDigest\":\"bpd1-6fce883d4d70e3b6bde0fb184b416e8e\",\"biomeProfileKey\":\"temperate\",\"biomeProfile\":{\"sig\":\"#6f9a52\",\"fauna\":[\"mammal\",\"bird\",\"insect\",\"amphibian\"],\"flora\":[\"tree\",\"shrub\",\"flower\",\"grass\",\"fern\"],\"hazard\":null,\"weather\":\"mild\"},\"environmentFingerprint\":\"cwe1:148:50c1b7d6\",\"fullRosterFingerprint\":\"cwr1:19:6305:58e079f2\",\"view\":{\"all\":[{\"seed\":2058951517,\"kingdom\":\"flora\",\"color\":2,\"form\":17,\"body\":4,\"loco\":0,\"trait\":9,\"size\":3,\"diet\":2,\"head\":7,\"limbs\":1,\"skin\":7,\"tail\":1,\"pattern\":6,\"eyes\":1,\"behavior\":10,\"habitat\":5,\"detail\":9,\"accent\":2,\"temper\":4,\"sense\":3,\"repro\":5,\"life\":4,\"metab\":5,\"lumin\":false,\"gen\":0,\"heat\":1,\"_earthName\":\"Persimmon\",\"_cradle\":1},{\"seed\":1714376717,\"kingdom\":\"flora\",\"color\":14,\"form\":12,\"body\":2,\"loco\":0,\"trait\":11,\"size\":1,\"diet\":4,\"head\":8,\"limbs\":5,\"skin\":6,\"tail\":1,\"pattern\":7,\"eyes\":2,\"behavior\":3,\"habitat\":6,\"detail\":9,\"accent\":15,\"temper\":5,\"sense\":5,\"repro\":6,\"life\":5,\"metab\":1,\"lumin\":false,\"gen\":0,\"heat\":1,\"_earthName\":\"Devil's Club\",\"_cradle\":1},{\"seed\":1741924755,\"kingdom\":\"flora\",\"color\":4,\"form\":4,\"body\":9,\"loco\":0,\"trait\":9,\"size\":3,\"diet\":1,\"head\":9,\"limbs\":3,\"skin\":0,\"tail\":5,\"pattern\":0,\"eyes\":5,\"behavior\":7,\"habitat\":0,\"detail\":4,\"accent\":10,\"temper\":7,\"sense\":9,\"repro\":2,\"life\":0,\"metab\":2,\"lumin\":false,\"gen\":0,\"heat\":1,\"_earthName\":\"Cranberry\",\"_cradle\":1},{\"seed\":3293061876,\"kingdom\":\"flora\",\"color\":2,\"form\":0,\"body\":1,\"loco\":2,\"trait\":12,\"size\":2,\"diet\":2,\"head\":1,\"limbs\":2,\"skin\":1,\"tail\":3,\"pattern\":0,\"eyes\":2,\"behavior\":7,\"habitat\":5,\"detail\":4,\"accent\":6,\"temper\":0,\"sense\":6,\"repro\":2,\"life\":4,\"metab\":2,\"lumin\":false,\"gen\":0,\"heat\":1,\"_earthName\":\"Rambutan\",\"_cradle\":1},{\"seed\":358709633,\"kingdom\":\"flora\",\"color\":6,\"form\":15,\"body\":12,\"loco\":17,\"trait\":2,\"size\":4,\"diet\":2,\"head\":5,\"limbs\":0,\"skin\":5,\"tail\":5,\"pattern\":6,\"eyes\":2,\"behavior\":10,\"habitat\":3,\"detail\":4,\"accent\":15,\"temper\":7,\"sense\":9,\"repro\":2,\"life\":3,\"metab\":4,\"lumin\":true,\"gen\":0,\"heat\":1,\"_earthName\":\"Wild Guava\",\"_cradle\":1},{\"seed\":2837464762,\"kingdom\":\"flora\",\"color\":13,\"form\":17,\"body\":3,\"loco\":5,\"trait\":22,\"size\":0,\"diet\":2,\"head\":8,\"limbs\":1,\"skin\":6,\"tail\":4,\"pattern\":6,\"eyes\":3,\"behavior\":8,\"habitat\":3,\"detail\":3,\"accent\":0,\"temper\":7,\"sense\":2,\"repro\":5,\"life\":5,\"metab\":3,\"lumin\":false,\"gen\":0,\"heat\":1,\"_earthName\":\"Barrel Cactus Fruit\",\"_cradle\":1},{\"seed\":2328743221,\"kingdom\":\"fungi\",\"color\":0,\"form\":5,\"body\":2,\"loco\":0,\"trait\":11,\"size\":4,\"diet\":3,\"head\":0,\"limbs\":4,\"skin\":7,\"tail\":2,\"pattern\":7,\"eyes\":0,\"behavior\":0,\"habitat\":12,\"detail\":4,\"accent\":14,\"temper\":0,\"sense\":2,\"repro\":2,\"life\":3,\"metab\":3,\"lumin\":false,\"gen\":0,\"heat\":1,\"_earthName\":\"Mildew\",\"_cradle\":1},{\"seed\":1635973906,\"kingdom\":\"fungi\",\"color\":14,\"form\":4,\"body\":13,\"loco\":5,\"trait\":23,\"size\":1,\"diet\":0,\"head\":9,\"limbs\":2,\"skin\":4,\"tail\":0,\"pattern\":7,\"eyes\":2,\"behavior\":10,\"habitat\":18,\"detail\":2,\"accent\":12,\"temper\":0,\"sense\":4,\"repro\":6,\"life\":2,\"metab\":3,\"lumin\":true,\"gen\":0,\"heat\":1,\"_earthName\":\"Giant Puffball\",\"_cradle\":1},{\"seed\":653352398,\"kingdom\":\"microbe\",\"color\":0,\"form\":1,\"body\":12,\"loco\":7,\"trait\":9,\"size\":0,\"diet\":0,\"head\":2,\"limbs\":2,\"skin\":6,\"tail\":6,\"pattern\":1,\"eyes\":5,\"behavior\":6,\"habitat\":13,\"detail\":9,\"accent\":1,\"temper\":9,\"sense\":6,\"repro\":2,\"life\":3,\"metab\":3,\"lumin\":true,\"gen\":0,\"heat\":1,\"_earthName\":\"Red-Tide Algae\",\"_cradle\":1},{\"seed\":1093271452,\"kingdom\":\"microbe\",\"color\":16,\"form\":13,\"body\":7,\"loco\":13,\"trait\":9,\"size\":2,\"diet\":0,\"head\":2,\"limbs\":3,\"skin\":2,\"tail\":0,\"pattern\":0,\"eyes\":2,\"behavior\":8,\"habitat\":15,\"detail\":8,\"accent\":0,\"temper\":9,\"sense\":0,\"repro\":4,\"life\":0,\"metab\":3,\"lumin\":false,\"gen\":0,\"heat\":1,\"_earthName\":\"Halophile\",\"_cradle\":1},{\"seed\":1367420842,\"kingdom\":\"microbe\",\"color\":2,\"form\":7,\"body\":3,\"loco\":9,\"trait\":9,\"size\":5,\"diet\":3,\"head\":7,\"limbs\":4,\"skin\":2,\"tail\":2,\"pattern\":7,\"eyes\":5,\"behavior\":1,\"habitat\":0,\"detail\":1,\"accent\":3,\"temper\":0,\"sense\":4,\"repro\":3,\"life\":5,\"metab\":1,\"lumin\":true,\"gen\":0,\"heat\":1,\"_earthName\":\"Euglena\",\"_cradle\":1},{\"seed\":4049771185,\"kingdom\":\"fauna\",\"color\":13,\"form\":14,\"body\":12,\"loco\":1,\"trait\":15,\"size\":2,\"diet\":4,\"head\":0,\"limbs\":0,\"skin\":6,\"tail\":4,\"pattern\":7,\"eyes\":0,\"behavior\":3,\"habitat\":9,\"detail\":8,\"accent\":16,\"temper\":7,\"sense\":4,\"repro\":6,\"life\":3,\"metab\":0,\"lumin\":false,\"gen\":0,\"heat\":1,\"_earthName\":\"Platypus\",\"_cradle\":1},{\"seed\":3212817920,\"kingdom\":\"fauna\",\"color\":14,\"form\":12,\"body\":13,\"loco\":6,\"trait\":14,\"size\":4,\"diet\":5,\"head\":5,\"limbs\":3,\"skin\":8,\"tail\":1,\"pattern\":0,\"eyes\":5,\"behavior\":9,\"habitat\":5,\"detail\":4,\"accent\":3,\"temper\":1,\"sense\":7,\"repro\":7,\"life\":5,\"metab\":4,\"lumin\":true,\"gen\":0,\"heat\":1,\"_earthName\":\"Civet\",\"_cradle\":1},{\"seed\":3983378525,\"kingdom\":\"fauna\",\"color\":8,\"form\":12,\"body\":8,\"loco\":7,\"trait\":14,\"size\":4,\"diet\":0,\"head\":6,\"limbs\":1,\"skin\":5,\"tail\":0,\"pattern\":2,\"eyes\":1,\"behavior\":7,\"habitat\":13,\"detail\":9,\"accent\":13,\"temper\":8,\"sense\":5,\"repro\":3,\"life\":4,\"metab\":1,\"lumin\":true,\"gen\":0,\"heat\":1,\"_earthName\":\"Brittle Star\",\"_cradle\":1},{\"seed\":1193089256,\"kingdom\":\"fauna\",\"color\":0,\"form\":12,\"body\":10,\"loco\":11,\"trait\":19,\"size\":0,\"diet\":5,\"head\":9,\"limbs\":4,\"skin\":3,\"tail\":1,\"pattern\":4,\"eyes\":1,\"behavior\":0,\"habitat\":17,\"detail\":7,\"accent\":4,\"temper\":8,\"sense\":5,\"repro\":5,\"life\":0,\"metab\":2,\"lumin\":false,\"gen\":0,\"heat\":1,\"_earthName\":\"Frog\",\"_cradle\":1},{\"seed\":2492583870,\"kingdom\":\"fauna\",\"color\":3,\"form\":6,\"body\":14,\"loco\":5,\"trait\":16,\"size\":5,\"diet\":2,\"head\":9,\"limbs\":4,\"skin\":2,\"tail\":6,\"pattern\":3,\"eyes\":0,\"behavior\":7,\"habitat\":3,\"detail\":6,\"accent\":16,\"temper\":5,\"sense\":4,\"repro\":5,\"life\":5,\"metab\":1,\"lumin\":false,\"gen\":0,\"heat\":1,\"_earthName\":\"Pheasant\",\"_cradle\":1},{\"seed\":4076641958,\"kingdom\":\"fauna\",\"color\":10,\"form\":7,\"body\":1,\"loco\":13,\"trait\":13,\"size\":3,\"diet\":4,\"head\":3,\"limbs\":4,\"skin\":7,\"tail\":4,\"pattern\":3,\"eyes\":0,\"behavior\":11,\"habitat\":9,\"detail\":7,\"accent\":6,\"temper\":8,\"sense\":5,\"repro\":6,\"life\":3,\"metab\":2,\"lumin\":false,\"gen\":0,\"heat\":1,\"_earthName\":\"Oryx\",\"_cradle\":1},{\"seed\":2598368726,\"kingdom\":\"fauna\",\"color\":5,\"form\":9,\"body\":9,\"loco\":15,\"trait\":12,\"size\":2,\"diet\":2,\"head\":9,\"limbs\":1,\"skin\":1,\"tail\":2,\"pattern\":4,\"eyes\":5,\"behavior\":6,\"habitat\":9,\"detail\":6,\"accent\":14,\"temper\":7,\"sense\":1,\"repro\":3,\"life\":4,\"metab\":3,\"lumin\":false,\"gen\":0,\"heat\":1,\"_earthName\":\"Sea Urchin\",\"_cradle\":1},{\"seed\":3879755030,\"kingdom\":\"fauna\",\"color\":6,\"form\":2,\"body\":8,\"loco\":1,\"trait\":13,\"size\":4,\"diet\":1,\"head\":1,\"limbs\":1,\"skin\":7,\"tail\":6,\"pattern\":7,\"eyes\":3,\"behavior\":11,\"habitat\":15,\"detail\":9,\"accent\":6,\"temper\":1,\"sense\":8,\"repro\":4,\"life\":0,\"metab\":2,\"lumin\":false,\"gen\":0,\"heat\":1,\"_earthName\":\"Prawn\",\"_cradle\":1}],\"total\":19}}") return null;
		if (!earthResidentFamiliesFitBiomeProfileV1(EARTH_RESIDENT_LAYER_PLAN_V1.residents, rosterData.biomeProfile)) return null;
		return EARTH_RESIDENT_LAYER_PLAN_V1;
	} catch {
		return null;
	}
}
//#endregion
//#region port/v2/apps/game/src/landfall-appearance-snapshot.ts
const LANDFALL_APPEARANCE_SNAPSHOT_SCHEMA_V1 = "cf.art.landfall-snapshot.v1";
const LANDFALL_APPEARANCE_RECIPE_ID_V1 = "canonical-earth-epoch0-six-residents-v1";
const UNPROVEN = Object.freeze({
	ok: false,
	reason: "unproven-roster"
});
const UNSUPPORTED = Object.freeze({
	ok: false,
	reason: "unsupported-recipe"
});
function freezeData(value) {
	if (value !== null && typeof value === "object") {
		for (const child of Object.values(value)) freezeData(child);
		Object.freeze(value);
	}
	return value;
}
/** Only an actual live roster can enter this boundary. Parsed JSON, diagnostic
* snapshots, spreads and proxies cannot manufacture the private WeakSet brand.
* The detached result intentionally cannot be fed back as live roster authority.
*
* Model pins, prompts, references, render dimensions and scheduler parameters
* belong to the separate generation recipe. This function owns no RNG or clock.
* Data arrays retain the safe null prototype of snapshotEarthLayerDataV1; use
* Array.from/Array.prototype methods or parse canonicalJson for transport use. */
function buildLandfallAppearanceSnapshotV1(request, roster) {
	if (!isCanonicalWorldRoster(roster)) return UNPROVEN;
	try {
		const requestData = snapshotEarthLayerDataV1(request);
		const rosterData = snapshotEarthLayerDataV1(roster);
		const plan = buildEarthLayeredRecipeV1(requestData, rosterData);
		if (plan === null) return UNSUPPORTED;
		const { view, ...authority } = rosterData;
		const snapshot = freezeData({
			schema: LANDFALL_APPEARANCE_SNAPSHOT_SCHEMA_V1,
			recipeId: LANDFALL_APPEARANCE_RECIPE_ID_V1,
			qualityAccepted: false,
			request: requestData,
			roster: {
				...authority,
				view: {
					all: view.all,
					total: view.total
				}
			},
			displayPlan: snapshotEarthLayerDataV1(plan)
		});
		return Object.freeze({
			ok: true,
			snapshot,
			canonicalJson: JSON.stringify(snapshot)
		});
	} catch {
		return UNSUPPORTED;
	}
}
//#endregion
//#region port/v2/tools/landfall-snapshot/entry.ts
function produceCanonicalEarthSnapshot() {
	installCaptureHooks();
	const star = {
		seed: 424242,
		x: 560,
		y: 170
	};
	const address = resolveCF1WorldAddress({
		galaxy: {
			seed: 999,
			x: 90,
			y: -60
		},
		star,
		planet: { seed: 133 }
	});
	if (!address.ok) throw Error("Canonical Earth address unavailable");
	const result = canonicalWorldRoster(address.address, 0);
	const planet = systemScene(star.seed).planets.find((row) => row.seed === 133);
	if (!result.ok || !planet) throw Error("Canonical Earth roster unavailable");
	const outcome = buildLandfallAppearanceSnapshotV1(buildBiomeVistaRenderRequestV1(planet, star.seed, result.roster.worldKey, systemFor(star.seed), result.roster), result.roster);
	if (!outcome.ok) throw Error("Canonical appearance unsupported: " + outcome.reason);
	return outcome;
}
//#endregion
//#region port/v2/packages/art/src/speciesidentity.ts
function stableGenomeNode(value, ancestors) {
	if (value === null) return ["null"];
	if (value === void 0) return ["undefined"];
	if (Array.isArray(value)) {
		if (ancestors.has(value)) throw new TypeError("cyclic genome cache value");
		ancestors.add(value);
		const result = ["array", value.map((item) => stableGenomeNode(item, ancestors))];
		ancestors.delete(value);
		return result;
	}
	if (typeof value === "object") {
		if (ancestors.has(value)) throw new TypeError("cyclic genome cache value");
		ancestors.add(value);
		const object = value;
		const result = ["object", Object.keys(object).sort().map((key) => [key, stableGenomeNode(object[key], ancestors)])];
		ancestors.delete(value);
		return result;
	}
	if (typeof value === "number") return ["number", Number.isNaN(value) ? "NaN" : value === Infinity ? "Infinity" : value === -Infinity ? "-Infinity" : Object.is(value, -0) ? "-0" : String(value)];
	if (typeof value === "string") return ["string", value];
	if (typeof value === "boolean") return ["boolean", value];
	if (typeof value === "bigint") return ["bigint", String(value)];
	throw new TypeError(`unsupported genome cache value: ${typeof value}`);
}
function speciesVisualKey(genome) {
	return JSON.stringify(stableGenomeNode(genome, /* @__PURE__ */ new Set()));
}
//#endregion
//#region port/v2/apps/game/src/landfall-conditioning.ts
const LANDFALL_CONDITIONING_SCHEMA_V1 = "cf.art.landfall-conditioning.v1";
const LANDFALL_NAMED_RULES_VERSION_V1 = "cf.art.named-earth-diagnostics.v1";
const LANDFALL_STYLE_VERSION_V1 = "cf.art.cohesive-natural-history.v1";
function freeze(value) {
	if (value !== null && typeof value === "object") {
		for (const child of Object.values(value)) freeze(child);
		Object.freeze(value);
	}
	return value;
}
/** Small source-backed named records, kept separate from compilation/style.
* New names need their actual winning owner and explicit diagnostics; unknown
* names, lineages and body families never fall back to a generic animal/plant.
* SPECIES_AND_GENOME Earth rules and ART_DIRECTION §1 own these requirements.
* This table does not invoke/import painters or claim their pixels are accepted. */
const LANDFALL_NAMED_RULES_V1 = freeze([
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
const refuse = (reason) => Object.freeze({
	ok: false,
	reason
});
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
/** Accept a transported snapshot only as conditioning data. Reuse the original
* full request/19-roster gate; the cosmetic empty preview needed by that gate
* is reconstructed locally and never supplied to gameplay. This cannot mint a
* CanonicalWorldRoster. No widened Earth epoch/world/species admission. */
function buildLandfallConditioningV1(input) {
	try {
		const data = snapshotEarthLayerDataV1(input);
		if (!object(data)) return refuse("unsupported-snapshot");
		if (data.schema !== "cf.art.landfall-snapshot.v1" || data.recipeId !== "canonical-earth-epoch0-six-residents-v1") return refuse("unsupported-schema");
		if (Object.keys(data).sort().join("|") !== "displayPlan|qualityAccepted|recipeId|request|roster|schema" || data.qualityAccepted !== false || !object(data.roster) || !object(data.roster.view) || Object.keys(data.roster.view).sort().join("|") !== "all|total" || !object(data.displayPlan) || !Array.isArray(data.displayPlan.residents)) return refuse("unsupported-snapshot");
		for (const row of Array.from(data.displayPlan.residents)) if (!object(row) || !LANDFALL_NAMED_RULES_V1.some((rule) => rule.name === row.name && rule.kingdom === row.kingdom && rule.family === row.family)) return refuse("unsupported-species");
		const roster = {
			...data.roster,
			view: {
				all: data.roster.view.all,
				preview: [],
				total: data.roster.view.total,
				hiddenFromPreview: data.roster.view.total
			}
		};
		const plan = buildEarthLayeredRecipeV1(data.request, roster);
		if (!plan || JSON.stringify(data.displayPlan) !== JSON.stringify(plan)) return refuse("unsupported-snapshot");
		const snapshot = JSON.parse(JSON.stringify(data));
		const residents = Array.from(snapshot.displayPlan.residents, (row) => {
			const rule = LANDFALL_NAMED_RULES_V1.find((candidate) => candidate.name === row.name);
			return {
				identityKey: speciesVisualKey(row.genome),
				name: row.name,
				kingdom: rule.kingdom,
				family: rule.family,
				genome: row.genome,
				placement: {
					x: row.x,
					groundY: row.groundY,
					width: row.width,
					flip: row.flip
				},
				namedRule: rule,
				rawGenomicVisualPolicy: "preserve-identity-use-named-earth-anatomy"
			};
		});
		const options = snapshot.request.options;
		if (snapshot.roster.biomeProfileKey !== "temperate" || options.wx !== "rain" || options.water !== "liquid") return refuse("unsupported-snapshot");
		const scene = {
			biome: snapshot.roster.biomeProfileKey,
			weather: options.wx,
			timeOfDay: options.nightize ? "night" : options.duskize ? "dusk" : "day",
			water: options.water
		};
		const subject = residents.find((row) => row.name === "Platypus");
		const prompt = [
			"Cohesive natural-history painting: shared light, soft contact shadows, depth and restrained detail.",
			`${scene.timeOfDay === "day" ? "Daylight" : scene.timeOfDay}, rainy ${scene.biome} riverbank with liquid water, rooted vegetation and damp stones.`,
			"Image 1 defines only the Platypus anatomy. Keep its diagnostic features clear.",
			...residents.map((row) => `One ${row.name} at ${Math.round(row.placement.x * 100)}% across, base ${Math.round(row.placement.groundY * 100)}% down, ${Math.round(row.placement.width * 100)}% wide${row.kingdom === "fauna" && row.placement.flip ? ", facing left" : ""}: ${row.namedRule.diagnostics.map((item) => item.required).join("; ")}.`),
			"Keep each whole subject in frame, naturally integrated. No extra animals, duplicate anatomy, text or interface."
		].join("\n");
		const recipe = freeze({
			schema: LANDFALL_CONDITIONING_SCHEMA_V1,
			namedRulesVersion: LANDFALL_NAMED_RULES_VERSION_V1,
			styleVersion: LANDFALL_STYLE_VERSION_V1,
			sourceSnapshot: snapshot,
			scene,
			residents,
			referenceRequirements: [{
				imageIndex: 1,
				purpose: "named-species-fidelity",
				subjectIdentityKey: subject.identityKey,
				name: "Platypus",
				fullGenome: subject.genome,
				requiredFeatures: subject.namedRule.diagnostics.map((item) => item.required),
				acceptance: "reviewed-exact-identity-reference-required"
			}],
			prompt,
			negativePrompt: residents.flatMap((row) => row.namedRule.forbiddenSubstitutions.map((text) => `${row.name}: ${text}`)).join("; "),
			qualityAccepted: false,
			referenceStatus: "unresolved",
			fidelityGuarantee: "none-prose-and-reference-require-outcome-review"
		});
		const canonicalJson = JSON.stringify(recipe);
		return Object.freeze({
			ok: true,
			recipe,
			snapshotKey: `lfas1:${JSON.stringify(snapshot)}`,
			recipeKey: `lfc1:${canonicalJson}`,
			canonicalJson
		});
	} catch {
		return refuse("unsupported-snapshot");
	}
}
//#endregion
//#region \0canonical-conditioning-review
const result = buildLandfallConditioningV1(produceCanonicalEarthSnapshot().snapshot);
//#endregion
export { result };
