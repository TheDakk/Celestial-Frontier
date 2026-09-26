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
//#region port/v2/packages/domain/worldidentity/src/authority.ts
const REGISTERED_WORLD_KEYS = /* @__PURE__ */ new WeakMap();
function isRecord$3(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isUint32(value) {
	return Number.isSafeInteger(value) && value >= 0 && value <= 4294967295;
}
function isFiniteCoordinate(value) {
	return typeof value === "number" && Number.isFinite(value) && !Object.is(value, -0);
}
function hasWorldShape(value) {
	if (!isRecord$3(value) || value.format !== "CF1" || typeof value.key !== "string" || value.key.length === 0 || !isRecord$3(value.galaxy) || !isRecord$3(value.star) || !isRecord$3(value.planet)) return false;
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
//#region port/v2/packages/domain/combatcore/src/guardian-prime.ts
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
/** Runtime authority check for downstream settlement. A structural clone may
* retain every visible field, but it cannot become an encounter producer. */
function isGuardianPrimeEncounterV1(value) {
	return typeof value === "object" && value !== null && GUARDIAN_PRIME_ENCOUNTERS_V1.has(value) && value.identity.schema === "cf-v2-guardian-prime-encounter/v1";
}
function integer$1(value, label, maximum = Number.MAX_SAFE_INTEGER) {
	if (!Number.isSafeInteger(value) || value < 0 || value > maximum) throw new TypeError(`${label} must be a non-negative safe integer`);
	return value;
}
function uint32$1(value, label) {
	return integer$1(value, label, 4294967295);
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
	const seed = uint32$1(worldSeed, "guardian world seed");
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
	const regionIndex = integer$1(input.regionIndex, "encounter region index", 5);
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
//#endregion
//#region port/v2/packages/domain/combatcore/src/combat-settlement.ts
const COMBAT_SETTLEMENT_PLAN_SCHEMA_V1 = "cf-v2-combat-settlement-plan/v1";
const COMBAT_SETTLEMENT_WITNESS_SCHEMA_V1 = "cf-v2-combat-settlement-witness/v1";
const COMBAT_SETTLEMENT_RECEIPT_KIND_V1 = "combat-settlement";
const LAST_USABLE_COMBAT_RECEIPT_ORDINAL_V1 = 4294967294;
Object.freeze({
	supportedMode: "legacy-v1.8.9-conquest-only",
	friendlyDuelProgression: "unsupported-open-active-play-policy",
	partyRolesAndRetreat: "unsupported-open-design-gate",
	guardianAuthoredReward: "unsupported-open-loot-table"
});
const COMBAT_SETTLEMENT_PLANS_V1 = /* @__PURE__ */ new WeakSet();
const PRIME_IDS = new Set(PRIME_SIGNATURE_IDS_V1);
function isCombatSettlementPlanV1(value) {
	return typeof value === "object" && value !== null && COMBAT_SETTLEMENT_PLANS_V1.has(value) && value.schema === "cf-v2-combat-settlement-plan/v1";
}
function refused(reason) {
	return Object.freeze({
		status: "refused",
		reason
	});
}
function boundedText$1(value, label, maximum = 192) {
	if (typeof value !== "string" || value.length < 1 || value.length > maximum || /[\u0000-\u001f\u007f]/u.test(value)) throw new TypeError(`${label} is invalid`);
	return value;
}
function uint32(value, label) {
	if (!Number.isSafeInteger(value) || value < 0 || value > 4294967295) throw new RangeError(`${label} must be a uint32`);
	return value;
}
function integer(value, label, maximum) {
	if (!Number.isSafeInteger(value) || value < 0 || value > maximum) throw new RangeError(`${label} is invalid`);
	return value;
}
function canonicalClone(value, active = /* @__PURE__ */ new WeakSet()) {
	if (value === null || typeof value === "boolean" || typeof value === "string") return value;
	if (typeof value === "number") {
		if (!Number.isFinite(value)) throw new TypeError("combat evidence contains a non-finite number");
		return Object.is(value, -0) ? 0 : value;
	}
	if (typeof value !== "object") throw new TypeError("combat evidence is not JSON-compatible");
	if (active.has(value)) throw new TypeError("combat evidence is cyclic");
	active.add(value);
	try {
		if (Array.isArray(value)) return Object.freeze(value.map((row) => canonicalClone(row, active)));
		const prototype = Object.getPrototypeOf(value);
		if (prototype !== Object.prototype && prototype !== null) throw new TypeError("combat evidence objects must be plain");
		const result = {};
		for (const key of Object.keys(value).sort()) {
			const child = value[key];
			if (child !== void 0) result[key] = canonicalClone(child, active);
		}
		return Object.freeze(result);
	} finally {
		active.delete(value);
	}
}
function canonicalJson(value) {
	return JSON.stringify(canonicalClone(value));
}
function deepFreeze(value) {
	if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
		for (const child of Object.values(value)) deepFreeze(child);
		Object.freeze(value);
	}
	return value;
}
function fnv1a32(text, offset, reverse) {
	let hash = offset >>> 0;
	for (let step = 0; step < text.length; step++) {
		const index = reverse ? text.length - 1 - step : step;
		hash ^= text.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return hash >>> 0;
}
/** Bounded deterministic fingerprint. The full frozen evidence remains on the
* registered plan; F3's save-lifetime ordinal supplies duplicate authority. */
function fingerprint(value) {
	const left = fnv1a32(value, 2166136261, false).toString(16).padStart(8, "0");
	const right = fnv1a32(value, 2654435769, true).toString(16).padStart(8, "0");
	return `cfp1:${value.length}:${left}${right}`;
}
function exactClaimedIds(ids) {
	if (!Array.isArray(ids)) throw new TypeError("claimed Prime ids must be an array");
	const seen = /* @__PURE__ */ new Set();
	const result = [];
	for (const id of ids) {
		if (!PRIME_IDS.has(id) || seen.has(id)) throw new TypeError("claimed Prime ids are invalid");
		seen.add(id);
		result.push(id);
	}
	return Object.freeze(result);
}
function hurtOf(genome) {
	const raw = genome.hurt;
	if (raw === void 0 || raw === null || raw === 0) return 0;
	if (typeof raw !== "number" || !Number.isFinite(raw) || raw < 0 || raw > .85) throw new RangeError("champion hurt is outside the legacy persisted range");
	return raw;
}
function checkedLossXp(value, championKind) {
	if (championKind === "player") {
		if (value !== null) throw new TypeError("player champion cannot carry creature loss XP authority");
		return null;
	}
	if (value === null || typeof value !== "object") throw new TypeError("owned champion loss XP authority is required");
	if (value.kind === "legacy-shared-key-ambiguous") return Object.freeze({ kind: value.kind });
	if (value.kind === "known-target" && (value.awardedTarget === 0 || value.awardedTarget === 3 || value.awardedTarget === 5)) return Object.freeze({
		kind: value.kind,
		awardedTarget: value.awardedTarget
	});
	throw new TypeError("owned champion loss XP authority is invalid");
}
function checkedChampion(champion) {
	if (!champion || typeof champion !== "object") throw new TypeError("combat champion is required");
	if (champion.kind === "owned-fauna") {
		const genome = canonicalClone(champion.genome);
		uint32(genome.seed, "champion genome seed");
		if (genome.kingdom !== "fauna") throw new TypeError("owned combat champion must be fauna");
		if (typeof champion.legacyBredLineage !== "boolean") throw new TypeError("legacy bred lineage must be explicit");
		hurtOf(genome);
		return deepFreeze({
			kind: "owned-fauna",
			creatureId: boundedText$1(champion.creatureId, "champion creature id"),
			name: boundedText$1(champion.name, "champion name", 96),
			genome,
			legacyBredLineage: champion.legacyBredLineage
		});
	}
	if (champion.kind === "player") {
		const stats = canonicalClone(champion.stats);
		for (const key of [
			"vit",
			"fer",
			"res",
			"agi",
			"ins",
			"total"
		]) if (typeof stats[key] !== "number" || !Number.isFinite(stats[key]) || stats[key] < 0) throw new TypeError(`player battle stat ${key} is invalid`);
		if (!stats.ab || typeof stats.ab !== "object") throw new TypeError("player battle ability is invalid");
		const currentHp = integer(champion.currentHp, "current explorer HP", Number.MAX_SAFE_INTEGER);
		if (currentHp < 1) throw new RangeError("current explorer HP must respect the mercy floor");
		return deepFreeze({
			kind: "player",
			explorerId: boundedText$1(champion.explorerId, "explorer id"),
			name: boundedText$1(champion.name, "explorer name", 96),
			genomeSeed: uint32(champion.genomeSeed, "player genome seed"),
			stats,
			currentHp
		});
	}
	throw new TypeError("combat champion kind is invalid");
}
function outcomeOf(transcript) {
	return transcript.winner === "A" ? "champion-win" : transcript.winner === "B" ? "defender-win" : "draw";
}
function buildTranscript(champion, encounter, supplied) {
	const expected = runDuel(champion.kind === "player" ? {
		name: champion.name,
		genome: { seed: champion.genomeSeed },
		stats: champion.stats
	} : {
		name: champion.name,
		genome: champion.genome
	}, {
		name: encounter.defender.name,
		genome: encounter.defender.battleGenome
	});
	const expectedJson = canonicalJson(expected);
	if (expectedJson !== canonicalJson(supplied)) return null;
	if (expectedJson.length > 25e4) throw new RangeError("combat transcript exceeds its receipt-planning bound");
	const transcript = canonicalClone(expected);
	return Object.freeze({
		transcript,
		fingerprint: fingerprint(expectedJson)
	});
}
function lossXpPlan(champion, transcript, authority, worldKey) {
	const nearBrink = transcript.hpB / Math.max(1, transcript.maxB) < .3;
	if (authority.kind === "legacy-shared-key-ambiguous") return Object.freeze({
		status: "protected-unsupported",
		creatureId: champion.creatureId,
		reason: "legacy-shared-key-amount-ambiguous",
		nearBrink,
		totalDelta: 0
	});
	const previous = authority.awardedTarget;
	const outcomeTarget = nearBrink ? 5 : 3;
	const baseDelta = previous < 3 ? 3 : 0;
	const nearBrinkDelta = nearBrink && previous < 5 ? 2 : 0;
	const totalDelta = baseDelta + nearBrinkDelta;
	const nextTarget = Math.max(previous, outcomeTarget);
	return Object.freeze({
		status: "loss-target",
		creatureId: champion.creatureId,
		ledgerModel: "per-creature-per-canonical-world-maximum/v1",
		ledgerIdentity: `combat-loss-xp/v1|${champion.creatureId}|${worldKey}`,
		nearBrink,
		previousTarget: previous,
		outcomeTarget,
		nextTarget,
		baseDelta,
		nearBrinkDelta,
		totalDelta
	});
}
function xpPlan(champion, encounter, transcript, outcome, worldTier, lossAuthority) {
	if (champion.kind === "player") return Object.freeze({
		status: "not-applicable",
		reason: "player-champion"
	});
	if (outcome !== "champion-win") return lossXpPlan(champion, transcript, lossAuthority, encounter.identity.world.key);
	const guarded = encounter.defender.kind === "guardian" || encounter.defender.kind === "titan";
	return Object.freeze({
		status: "award",
		source: guarded ? "guardian-win" : "conquest-win",
		creatureId: champion.creatureId,
		amount: (guarded ? 60 : 20) + worldTier
	});
}
function injuryPlan(champion, encounter, transcript, outcome) {
	if (outcome === "champion-win") {
		if (champion.kind === "player") return Object.freeze({
			status: "none",
			reason: "player-win"
		});
		const log = transcript.log;
		const lastHp = (log.length > 0 ? log[log.length - 1] : void 0)?.hpA;
		if (typeof lastHp !== "number" || !Number.isFinite(lastHp) || transcript.maxA <= 0) return Object.freeze({
			status: "none",
			reason: "healthy-win"
		});
		const fraction = Math.max(0, lastHp / transcript.maxA);
		if (fraction >= .55) return Object.freeze({
			status: "none",
			reason: "healthy-win"
		});
		const before = hurtOf(champion.genome);
		return Object.freeze({
			status: "set-hurt",
			reason: "hard-won-conquest",
			creatureId: champion.creatureId,
			hurtBefore: before,
			hurtAfter: Math.min(.85, before + (.55 - fraction) * .7),
			winningHpFraction: fraction
		});
	}
	if (champion.kind === "player") {
		const damage = Math.min(Math.round(16 + encounter.defender.power / 24), Math.max(0, champion.currentHp - 1));
		return Object.freeze({
			status: "damage-player",
			hpBefore: champion.currentHp,
			hpAfter: champion.currentHp - damage,
			damage,
			mercyFloor: 1
		});
	}
	const before = hurtOf(champion.genome);
	if (champion.legacyBredLineage && before < .85) return Object.freeze({
		status: "set-hurt",
		reason: "bred-crawl-home",
		creatureId: champion.creatureId,
		hurtBefore: before,
		hurtAfter: .85,
		winningHpFraction: null
	});
	return Object.freeze({
		status: "remove-creature",
		reason: champion.legacyBredLineage ? "critical-repeat-defeat" : "wild-or-unbred-defeat",
		creatureId: champion.creatureId
	});
}
function guardianCapturePlan(encounter, outcome) {
	const genome = encounter.defender.capturableGenome;
	if (outcome !== "champion-win" || genome === null) return Object.freeze({ status: "none" });
	if (genome._mult !== void 0 || genome._wf !== void 0) throw new TypeError("capturable Guardian genome retained battlefield modifiers");
	return Object.freeze({
		status: "ownership-writer-required",
		source: encounter.defender.kind === "titan" ? "Elemental Titan" : "Apex Guardian",
		sourceId: encounter.defender.sourceId,
		portableGenome: genome,
		battlefieldModifiersStripped: true,
		cataloguePolicy: "legacy-store-species-deduplication"
	});
}
function primeClaimPlan(encounter, outcome) {
	const signatureId = encounter.defender.signatureId;
	if (outcome !== "champion-win" || encounter.defender.kind !== "titan" || signatureId === null) return Object.freeze({ status: "none" });
	const definition = PRIME_SIGNATURES_V1.find((row) => row.id === signatureId);
	return Object.freeze({
		status: "claim",
		signatureId,
		title: `${definition.element} — ${encounter.defender.name}`,
		sub: "titan felled",
		tier: 14,
		hex: "#ffd96a",
		world: encounter.identity.world
	});
}
function rewardPlan(encounter, outcome, worldTier) {
	const won = outcome === "champion-win";
	const guarded = encounter.defender.kind === "guardian" || encounter.defender.kind === "titan";
	const stardust = won ? 8 + Math.max(1, worldTier) * 5 + (guarded ? 40 : 0) : 0;
	return deepFreeze({
		stardust: {
			status: won ? "award" : "none",
			amount: stardust,
			lifetimeEarnedDelta: stardust
		},
		legacyConquestAffix: {
			status: won ? "delegated-exact" : "none",
			owner: "loot-and-equipped-state-writer",
			planetSeed: encounter.identity.world.planet.seed,
			gateSalt: 22785,
			selectionSalt: 22786,
			gateChance: .4
		},
		guardianAuthoredReward: {
			status: won && guarded ? "unsupported-open" : "none",
			owner: "Arc-6-loot-design",
			reason: "authored-Guardian-reward-table-not-authoritative"
		}
	});
}
function planCombatSettlementV1(input) {
	if (!input || typeof input !== "object") return refused("input-invalid");
	if (!isGuardianPrimeEncounterV1(input.encounter)) return refused("encounter-unregistered");
	try {
		const battleId = boundedText$1(input.battleId, "battle id");
		const receiptOrdinal = integer(input.receiptOrdinal, "combat receipt ordinal", LAST_USABLE_COMBAT_RECEIPT_ORDINAL_V1);
		const worldTier = integer(input.worldTier, "combat world tier", 14);
		if (!input.authority || typeof input.authority !== "object" || typeof input.authority.worldConquered !== "boolean") throw new TypeError("combat authority is invalid");
		if (input.authority.worldConquered) return refused("already-conquered");
		const claimedPrimeSignatureIds = exactClaimedIds(input.authority.claimedPrimeSignatureIds);
		const encounterClaims = [...input.encounter.identity.claimedSignatureIds].sort();
		const settlementClaims = [...claimedPrimeSignatureIds].sort();
		if (canonicalJson(encounterClaims) !== canonicalJson(settlementClaims) || input.encounter.identity.conquered !== false) return refused("encounter-authority-mismatch");
		if (input.encounter.defender.signatureId !== null && claimedPrimeSignatureIds.includes(input.encounter.defender.signatureId)) return refused("prime-already-claimed");
		const champion = checkedChampion(input.champion);
		const lossXp = checkedLossXp(input.authority.lossXp, champion.kind);
		const authority = Object.freeze({
			worldConquered: false,
			claimedPrimeSignatureIds,
			lossXp
		});
		const settled = buildTranscript(champion, input.encounter, input.transcript);
		if (settled === null) return refused("transcript-mismatch");
		const derivedOutcome = outcomeOf(settled.transcript);
		if (input.outcome !== derivedOutcome) return refused("outcome-mismatch");
		const guarded = input.encounter.defender.kind === "guardian" || input.encounter.defender.kind === "titan";
		const counters = Object.freeze({
			duels: 1,
			duelWins: derivedOutcome === "champion-win" ? 1 : 0,
			guardians: derivedOutcome === "champion-win" && guarded ? 1 : 0
		});
		const xp = xpPlan(champion, input.encounter, settled.transcript, derivedOutcome, worldTier, lossXp);
		const injury = injuryPlan(champion, input.encounter, settled.transcript, derivedOutcome);
		const conquest = derivedOutcome === "champion-win" ? Object.freeze({
			status: "settle",
			worldKey: input.encounter.identity.world.key,
			world: input.encounter.identity.world,
			tier: worldTier,
			legacyEpoch: 0
		}) : Object.freeze({
			status: "unchanged",
			worldKey: input.encounter.identity.world.key
		});
		const guardianCapture = guardianCapturePlan(input.encounter, derivedOutcome);
		const primeClaim = primeClaimPlan(input.encounter, derivedOutcome);
		const rewards = rewardPlan(input.encounter, derivedOutcome, worldTier);
		const witness = canonicalJson({
			schema: COMBAT_SETTLEMENT_WITNESS_SCHEMA_V1,
			battleId,
			receiptOrdinal,
			encounterFingerprint: fingerprint(input.encounter.witness),
			transcriptFingerprint: settled.fingerprint,
			championFingerprint: fingerprint(canonicalJson(champion)),
			outcome: derivedOutcome,
			worldTier,
			authority,
			counters,
			xp,
			injury,
			conquest: conquest.status === "settle" ? {
				status: conquest.status,
				worldKey: conquest.worldKey,
				tier: conquest.tier,
				legacyEpoch: 0
			} : conquest,
			guardianCapture: guardianCapture.status === "ownership-writer-required" ? {
				...guardianCapture,
				portableGenome: fingerprint(canonicalJson(guardianCapture.portableGenome))
			} : guardianCapture,
			primeClaim: primeClaim.status === "claim" ? {
				...primeClaim,
				world: primeClaim.world.key
			} : primeClaim,
			rewards
		});
		if (witness.length > 4096) throw new RangeError("combat settlement witness exceeds F3 receipt capacity");
		const receipt = Object.freeze({
			ordinal: receiptOrdinal,
			kind: COMBAT_SETTLEMENT_RECEIPT_KIND_V1,
			witness
		});
		const plan = deepFreeze({
			schema: COMBAT_SETTLEMENT_PLAN_SCHEMA_V1,
			status: "planned",
			policy: "legacy-v1.8.9-conquest",
			battleId,
			receiptOrdinal,
			encounter: input.encounter,
			champion,
			transcript: settled.transcript,
			transcriptFingerprint: settled.fingerprint,
			outcome: derivedOutcome,
			worldTier,
			authority,
			counters,
			xp,
			injury,
			conquest,
			guardianCapture,
			primeClaim,
			rewards,
			witness,
			receipt
		});
		COMBAT_SETTLEMENT_PLANS_V1.add(plan);
		return plan;
	} catch {
		return refused("input-invalid");
	}
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
function isRecord$2(value) {
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
	if (!isRecord$2(value) || value.format !== "CF1" || !isProvenGalaxy(value.galaxy)) return false;
	const ownKey = value.key;
	if ("planet" in value) return "star" in value && isProvenStarFor(value.star, value.galaxy) && isProvenPlanetFor(value.planet, value.star) && ownKey === getProvenPlanetKey(value.planet);
	if ("star" in value) return isProvenStarFor(value.star, value.galaxy) && ownKey === getProvenStarKey(value.star);
	return ownKey === getProvenGalaxyKey(value.galaxy);
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
	if (!isRecord$2(value)) return null;
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
	if (!isRecord$2(value) || !isExactUint32(value.seed)) return null;
	return { seed: value.seed };
}
/** Presentation fields are read from the generator, never the candidate. */
function readGeneratedGalaxy(value) {
	if (!isRecord$2(value)) return null;
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
	if (!isRecord$2(value)) return null;
	const galaxy = readPoint(value.galaxy);
	const star = readPoint(value.star);
	return galaxy && star ? {
		galaxy,
		star
	} : null;
}
function readWorldAddressCandidate(value) {
	const parents = readStarAddressCandidate(value);
	if (!parents || !isRecord$2(value) || !isRecord$2(value.planet) || !isExactUint32(value.planet.seed)) return null;
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
	if (!isRecord$2(profile)) return failure("source-error");
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
				if (!isRecord$2(cell) || !Array.isArray(cell.stars)) return failure("source-error");
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
	if (!isRecord$2(system) || !Array.isArray(system.planets)) return failure("source-error");
	const matches = [];
	for (let ordinal = 0; ordinal < system.planets.length; ordinal++) {
		const entry = system.planets[ordinal];
		if (!isRecord$2(entry) || !isRecord$2(entry.P) || !isExactUint32(entry.P.seed)) return failure("source-error");
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
const AUDIO_ROUTE_INVENTORY_DIGEST = "arv1-f715350becaa52946933ff5039030733";
const AUDIO_KINGDOM_ORDER = Object.freeze([
	"fauna",
	"flora",
	"fungi",
	"microbe"
]);
const AUDIO_PALETTE_POLICY = Object.freeze({
	fauna: "fauna-vocal-foley",
	flora: "flora-environmental-sonification",
	fungi: "fungi-environmental-sonification",
	microbe: "microbe-environmental-sonification"
});
const AUDIO_TAXONOMY = Object.freeze({
	fauna: Object.freeze({
		taxonomyId: "earth-fauna-biophony",
		palettePolicy: AUDIO_PALETTE_POLICY.fauna
	}),
	flora: Object.freeze({
		taxonomyId: "earth-flora-botanical-sonification",
		palettePolicy: AUDIO_PALETTE_POLICY.flora
	}),
	fungi: Object.freeze({
		taxonomyId: "earth-fungi-mycological-sonification",
		palettePolicy: AUDIO_PALETTE_POLICY.fungi
	}),
	microbe: Object.freeze({
		taxonomyId: "earth-microbe-scientific-sonification",
		palettePolicy: AUDIO_PALETTE_POLICY.microbe
	})
});
Object.freeze({
	taxonomyId: "legacy-fallback",
	paletteId: "legacy",
	ordinarySelection: false
});
const EXPECTED_CURRENT_ROUTES = 1010;
const EXPECTED_APPROVED_ROUTES = 1014;
const LEGACY_COMPATIBILITY_ROUTES = Object.freeze([
	Object.freeze({
		kingdom: "microbe",
		name: "Tardigrade",
		canonicalKingdom: "fauna"
	}),
	Object.freeze({
		kingdom: "flora",
		name: "Reindeer Lichen",
		canonicalKingdom: "fungi"
	}),
	Object.freeze({
		kingdom: "flora",
		name: "Snow Algae",
		canonicalKingdom: "microbe"
	}),
	Object.freeze({
		kingdom: "microbe",
		name: "Green Algae",
		canonicalKingdom: "flora"
	})
]);
function isRecord$1(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}
function hasExactKeys$2(value, expected) {
	const actual = Object.keys(value);
	return actual.length === expected.length && actual.every((key) => expected.includes(key));
}
function isAudioKingdom(value) {
	return typeof value === "string" && AUDIO_KINGDOM_ORDER.includes(value);
}
function canonicalName(value) {
	if (typeof value !== "string" || value.length < 1 || value.length > 128 || value.trim() !== value || value.normalize("NFC") !== value || /[\u0000-\u001f\u007f]/u.test(value)) throw new TypeError("audio catalogue name is not a bounded canonical name");
	return value;
}
function audioCatalogueRouteKey(kingdom, name) {
	if (!isAudioKingdom(kingdom)) throw new TypeError("audio catalogue route kingdom is invalid");
	return JSON.stringify([kingdom, canonicalName(name)]);
}
function canonicalIdentityKey(kingdom, name) {
	return JSON.stringify([kingdom, canonicalName(name)]);
}
function routeRow(kingdom, name, canonicalKingdom, status) {
	const taxonomy = AUDIO_TAXONOMY[kingdom];
	return Object.freeze({
		routeKey: audioCatalogueRouteKey(kingdom, name),
		kingdom,
		name: canonicalName(name),
		canonicalIdentityKey: canonicalIdentityKey(canonicalKingdom, name),
		canonicalKingdom,
		taxonomyId: taxonomy.taxonomyId,
		palettePolicy: taxonomy.palettePolicy,
		status
	});
}
const CURRENT_ROWS = AUDIO_KINGDOM_ORDER.flatMap((kingdom) => _EARTH_NAMES[kingdom].map((name) => routeRow(kingdom, name, kingdom, "current")));
const EXPECTED_ROWS = Object.freeze([...CURRENT_ROWS, ...LEGACY_COMPATIBILITY_ROUTES.map((row) => routeRow(row.kingdom, row.name, row.canonicalKingdom, "legacy-compatibility"))]);
const EXPECTED_BY_ROUTE = new Map(EXPECTED_ROWS.map((row) => [row.routeKey, row]));
const ROUTE_DIGEST_KEYS = Object.freeze([
	"routeKey",
	"kingdom",
	"name",
	"canonicalIdentityKey",
	"canonicalKingdom",
	"taxonomyId",
	"palettePolicy",
	"status"
]);
const ROUTE_DIGEST_SEEDS = Object.freeze([
	2166136261,
	2654435769,
	2246822507,
	3266489909
]);
function routeDigestHash(source, seed) {
	let hash = seed >>> 0;
	for (let index = 0; index < source.length; index++) {
		hash ^= source.charCodeAt(index);
		hash = Math.imul(hash, 16777619) >>> 0;
	}
	hash ^= hash >>> 16;
	hash = Math.imul(hash, 2246822507) >>> 0;
	hash ^= hash >>> 13;
	return (hash >>> 0).toString(16).padStart(8, "0");
}
/** Digest exact ordered source/route data, including canonical ownership and
* taxonomy. This is deliberately independent of the expected-row lookup so a
* same-count edit to the authoritative catalogue cannot redefine both sides
* of its own check. */
function audioRouteInventoryDigest(rows) {
	if (!Array.isArray(rows)) throw new TypeError("audio route inventory rows are required");
	const source = JSON.stringify(rows.map((value, index) => {
		if (!isRecord$1(value) || !hasExactKeys$2(value, ROUTE_DIGEST_KEYS)) throw new TypeError(`audio route inventory row ${index} has an invalid digest shape`);
		return ROUTE_DIGEST_KEYS.map((key) => {
			const field = value[key];
			if (typeof field !== "string") throw new TypeError(`audio route inventory row ${index} has a non-string digest field`);
			return field;
		});
	}));
	return `arv1-${ROUTE_DIGEST_SEEDS.map((seed) => routeDigestHash(source, seed)).join("")}`;
}
function assertPinnedAudioRouteInventory(rows) {
	const digest = audioRouteInventoryDigest(rows);
	if (digest !== "arv1-f715350becaa52946933ff5039030733") throw new RangeError(`audio resolver 1 source/route digest changed: ${digest}`);
	return AUDIO_ROUTE_INVENTORY_DIGEST;
}
/** Validate the entire route join in both directions. This accepts an explicit
* row array so tests can inject missing, duplicate, cross-kingdom, legacy, and
* mammal-fallback defects and prove the instrument rejects each one. */
function auditAudioRouteManifest(rows) {
	if (!Array.isArray(rows) || rows.length !== EXPECTED_APPROVED_ROUTES) throw new RangeError(`audio route manifest must contain exactly ${EXPECTED_APPROVED_ROUTES} routes`);
	if (CURRENT_ROWS.length !== EXPECTED_CURRENT_ROUTES) throw new RangeError(`current Earth catalogue must contain exactly ${EXPECTED_CURRENT_ROUTES} routes`);
	const routeKeys = /* @__PURE__ */ new Set();
	const canonicalKeys = /* @__PURE__ */ new Set();
	let currentRouteCount = 0;
	let compatibilityRouteCount = 0;
	for (const [index, value] of rows.entries()) {
		if (!isRecord$1(value) || !hasExactKeys$2(value, [
			"routeKey",
			"kingdom",
			"name",
			"canonicalIdentityKey",
			"canonicalKingdom",
			"taxonomyId",
			"palettePolicy",
			"status"
		])) throw new TypeError(`audio route manifest row ${index} has an invalid shape`);
		if (!isAudioKingdom(value.kingdom) || !isAudioKingdom(value.canonicalKingdom)) throw new TypeError(`audio route manifest row ${index} has an invalid kingdom`);
		const name = canonicalName(value.name);
		const routeKey = audioCatalogueRouteKey(value.kingdom, name);
		if (value.routeKey !== routeKey || routeKeys.has(routeKey)) throw new RangeError(`audio route manifest row ${index} has a duplicate or mismatched route key`);
		routeKeys.add(routeKey);
		const expected = EXPECTED_BY_ROUTE.get(routeKey);
		if (!expected) throw new RangeError(`audio route manifest row ${index} is not an approved catalogue route`);
		const expectedTaxonomy = AUDIO_TAXONOMY[value.kingdom];
		if (value.taxonomyId !== expectedTaxonomy.taxonomyId || value.palettePolicy !== expectedTaxonomy.palettePolicy) throw new RangeError(`audio route manifest row ${index} crossed its intentional kingdom taxonomy`);
		if (value.canonicalKingdom !== expected.canonicalKingdom || value.canonicalIdentityKey !== expected.canonicalIdentityKey || value.status !== expected.status) throw new RangeError(`audio route manifest row ${index} changed its canonical catalogue identity`);
		canonicalKeys.add(value.canonicalIdentityKey);
		if (value.status === "current") currentRouteCount++;
		else if (value.status === "legacy-compatibility") compatibilityRouteCount++;
		else throw new RangeError(`audio route manifest row ${index} has an invalid status`);
	}
	for (const key of EXPECTED_BY_ROUTE.keys()) if (!routeKeys.has(key)) throw new RangeError(`audio route manifest omitted approved route ${key}`);
	if (currentRouteCount !== EXPECTED_CURRENT_ROUTES || compatibilityRouteCount !== 4 || canonicalKeys.size !== EXPECTED_CURRENT_ROUTES) throw new RangeError("audio route manifest counts or canonical identity collapse changed");
	const sourceRouteDigest = assertPinnedAudioRouteInventory(rows);
	return Object.freeze({
		resolverVersion: 1,
		sourceRouteDigest,
		routeCount: EXPECTED_APPROVED_ROUTES,
		currentRouteCount: EXPECTED_CURRENT_ROUTES,
		compatibilityRouteCount: 4,
		canonicalIdentityCount: EXPECTED_CURRENT_ROUTES
	});
}
const AUDIO_ROUTE_MANIFEST = Object.freeze(EXPECTED_ROWS.slice());
auditAudioRouteManifest(AUDIO_ROUTE_MANIFEST);
new Map(AUDIO_ROUTE_MANIFEST.map((row) => [row.routeKey, row]));
Object.freeze({
	fauna: Object.freeze([
		"fauna-resonant",
		"fauna-breathy",
		"fauna-percussive",
		"fauna-chitter"
	]),
	flora: Object.freeze([
		"flora-canopy",
		"flora-stem-resonance",
		"flora-seed-rattle",
		"flora-pollen-shimmer"
	]),
	fungi: Object.freeze([
		"fungi-spore-hush",
		"fungi-gill-pulse",
		"fungi-mycelial-click",
		"fungi-fruiting-resonance"
	]),
	microbe: Object.freeze([
		"microbe-colony-pulse",
		"microbe-vesicle-tick",
		"microbe-bloom-shimmer",
		"microbe-cilia-rhythm"
	])
});
Object.freeze({
	fauna: Object.freeze([
		"call-response",
		"rising-motif",
		"broken-pulse",
		"descending-motif"
	]),
	flora: Object.freeze([
		"growth-cycle",
		"branching-chime",
		"wind-response",
		"seed-cycle"
	]),
	fungi: Object.freeze([
		"spore-cycle",
		"network-pulse",
		"gill-rhythm",
		"decay-bloom"
	]),
	microbe: Object.freeze([
		"colony-cycle",
		"division-pulse",
		"cilia-pattern",
		"bloom-cycle"
	])
});
Object.freeze([
	"even",
	"syncopated",
	"clustered",
	"spaced"
]);
Object.freeze([
	"smooth",
	"breathy",
	"granular",
	"plucked"
]);
Object.freeze([
	"contact",
	"contented",
	"subdued",
	"greeting",
	"celebration"
]);
function boundedAudioKey(value, label, maxLength = 192) {
	if (typeof value !== "string" || value.length < 1 || value.length > maxLength || value.trim() !== value || value.normalize("NFC") !== value || /[\u0000-\u001f\u007f]/u.test(value)) throw new TypeError(`${label} is not a bounded canonical key`);
	return value;
}
//#endregion
//#region port/v2/packages/audio/src/runtime.ts
const AUDIO_CATEGORIES = Object.freeze([
	"music",
	"ambience",
	"creature",
	"combat-gameplay",
	"ui"
]);
const AUDIO_VOICE_MIX_INTENT_SCHEMA_V1 = "cf.audio.voice-mix-intent/v1";
const GRAPH_NODES = 13;
const MAX_VOICE_GRAPH_NODES = 32;
const MAX_CATEGORY_MIX_PASSES = 12;
const CATEGORY_DUCK_SECONDS = .025;
const CATEGORY_RELEASE_SECONDS = .09;
const METERS = Object.freeze(["master", ...AUDIO_CATEGORIES]);
const DEFAULT_BUDGETS = Object.freeze({
	maxVoices: 24,
	maxCreatureEmitters: 8,
	maxNodes: 96,
	maxCacheEntries: 32,
	maxCooldownGroups: 128,
	maxFaults: 20
});
function boundedInteger(value, label, minimum, maximum) {
	if (!Number.isSafeInteger(value) || value < minimum || value > maximum) throw new TypeError(`${label} is outside its bounded integer range`);
	return value;
}
function boundedGain(value, label) {
	if (typeof value !== "number" || !Number.isFinite(value)) throw new TypeError(`${label} is not finite`);
	return Math.max(0, Math.min(1, value));
}
function category(value) {
	if (!AUDIO_CATEGORIES.includes(value)) throw new TypeError("audio category is invalid");
	return value;
}
function errorMessage(error) {
	return (error instanceof Error ? error.message : String(error)).slice(0, 192);
}
function isNode(value) {
	return value !== null && typeof value === "object" && typeof value.connect === "function" && typeof value.disconnect === "function";
}
function isScheduledSource(value) {
	return isNode(value) && typeof value.start === "function" && typeof value.stop === "function" && "onended" in value;
}
function hasExactKeys$1(value, expected) {
	const actual = Object.keys(value).sort();
	const sorted = [...expected].sort();
	return actual.length === sorted.length && actual.every((key, index) => key === sorted[index]);
}
function exactDataFields(value, expected, label, requireFrozen) {
	try {
		if (value === null || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype || requireFrozen && !Object.isFrozen(value)) throw new TypeError(`${label} must be an exact${requireFrozen ? " immutable" : ""} data object`);
		const keys = Reflect.ownKeys(value);
		if (keys.length !== expected.length || keys.some((key) => typeof key !== "string" || !expected.includes(key))) throw new TypeError(`${label} has unexpected fields`);
		const output = {};
		for (const key of expected) {
			const descriptor = Object.getOwnPropertyDescriptor(value, key);
			if (!descriptor || !Object.hasOwn(descriptor, "value") || !descriptor.enumerable) throw new TypeError(`${label}.${key} must be an enumerable data property`);
			output[key] = descriptor.value;
		}
		return output;
	} catch (error) {
		if (error instanceof TypeError) throw error;
		throw new TypeError(`${label} could not be inspected`);
	}
}
function voiceMixFactor(value, categoryName) {
	if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) throw new TypeError(`${categoryName} voice mix factor is outside [0, 1]`);
	return Object.is(value, -0) ? 0 : value;
}
function snapshotVoiceMixFactors(value, requireFrozen) {
	const input = exactDataFields(value, AUDIO_CATEGORIES, "audio voice mix factors", requireFrozen);
	return Object.freeze(Object.fromEntries(AUDIO_CATEGORIES.map((name) => [name, voiceMixFactor(input[name], name)])));
}
function voiceMixIntent(value) {
	const input = exactDataFields(value, ["schema", "factors"], "audio voice mix intent", true);
	if (input.schema !== "cf.audio.voice-mix-intent/v1") throw new TypeError("audio voice mix intent schema is unsupported");
	return Object.freeze({
		schema: AUDIO_VOICE_MIX_INTENT_SCHEMA_V1,
		factors: snapshotVoiceMixFactors(input.factors, true)
	});
}
/** Mint a detached immutable v1 intent from one exact full category map. */
function createAudioVoiceMixIntentV1(factors) {
	return Object.freeze({
		schema: AUDIO_VOICE_MIX_INTENT_SCHEMA_V1,
		factors: snapshotVoiceMixFactors(factors, false)
	});
}
const AUDIO_NEUTRAL_VOICE_MIX_INTENT_V1 = createAudioVoiceMixIntentV1(Object.freeze({
	music: 1,
	ambience: 1,
	creature: 1,
	"combat-gameplay": 1,
	ui: 1
}));
function counterpartReceipt(value) {
	if (value === null || typeof value !== "object" || !hasExactKeys$1(value, [
		"counterpartKey",
		"eventKey",
		"generation"
	])) throw new TypeError("meaningful audio counterpart receipt is invalid");
	const input = value;
	return Object.freeze({
		counterpartKey: boundedAudioKey(input.counterpartKey, "meaningful audio counterpart", 192),
		eventKey: boundedAudioKey(input.eventKey, "meaningful audio event", 192),
		generation: boundedInteger(input.generation, "meaningful audio counterpart generation", 1, Number.MAX_SAFE_INTEGER)
	});
}
function setParam(param, value, time) {
	param.setValueAtTime(value, time);
}
function disconnectQuietly(nodes) {
	for (let index = nodes.length - 1; index >= 0; index--) try {
		nodes[index].disconnect();
	} catch {}
}
function createGraph(context, masterGain, gains) {
	const nodes = [];
	const own = (node) => {
		nodes.push(node);
		return node;
	};
	try {
		const master = own(context.createGain());
		const masterAnalyser = own(context.createAnalyser());
		const limiter = own(context.createDynamicsCompressor());
		const categories = {};
		const meters = {};
		setParam(master.gain, masterGain, context.currentTime);
		setParam(limiter.threshold, -1, context.currentTime);
		setParam(limiter.knee, 0, context.currentTime);
		setParam(limiter.ratio, 20, context.currentTime);
		setParam(limiter.attack, .003, context.currentTime);
		setParam(limiter.release, .1, context.currentTime);
		masterAnalyser.fftSize = 32;
		masterAnalyser.smoothingTimeConstant = .8;
		meters.master = {
			analyser: masterAnalyser,
			samples: new Float32Array(Math.max(1, Math.min(1024, masterAnalyser.frequencyBinCount)))
		};
		for (const name of AUDIO_CATEGORIES) {
			const bus = own(context.createGain());
			const analyser = own(context.createAnalyser());
			analyser.fftSize = 32;
			analyser.smoothingTimeConstant = .8;
			setParam(bus.gain, gains[name], context.currentTime);
			bus.connect(analyser);
			analyser.connect(master);
			categories[name] = bus;
			meters[name] = {
				analyser,
				samples: new Float32Array(Math.max(1, Math.min(1024, analyser.frequencyBinCount)))
			};
		}
		master.connect(masterAnalyser);
		masterAnalyser.connect(limiter);
		limiter.connect(context.destination);
		if (nodes.length !== GRAPH_NODES) throw new Error("audio graph node budget invariant failed");
		return {
			master,
			limiter,
			categories: Object.freeze(categories),
			meters: Object.freeze(meters),
			nodes: Object.freeze(nodes)
		};
	} catch (error) {
		disconnectQuietly(nodes);
		throw error;
	}
}
function resolvedBudgets(input) {
	return Object.freeze({
		maxVoices: boundedInteger(input?.maxVoices ?? DEFAULT_BUDGETS.maxVoices, "audio voice budget", 1, 64),
		maxCreatureEmitters: boundedInteger(input?.maxCreatureEmitters ?? DEFAULT_BUDGETS.maxCreatureEmitters, "audio creature-emitter budget", 1, 8),
		maxNodes: boundedInteger(input?.maxNodes ?? DEFAULT_BUDGETS.maxNodes, "audio node budget", 15, 120),
		maxCacheEntries: boundedInteger(input?.maxCacheEntries ?? DEFAULT_BUDGETS.maxCacheEntries, "audio cache budget", 0, 256),
		maxCooldownGroups: boundedInteger(input?.maxCooldownGroups ?? DEFAULT_BUDGETS.maxCooldownGroups, "audio cooldown budget", 1, 512),
		maxFaults: boundedInteger(input?.maxFaults ?? DEFAULT_BUDGETS.maxFaults, "audio fault budget", 1, 64)
	});
}
var InjectedAudioRuntime = class {
	createContext;
	nowMs;
	verifyCounterpart;
	scheduleVoiceDeadline;
	budgets;
	gains;
	active = /* @__PURE__ */ new Map();
	/** At most five current-graph transitions; no callback, node or context owner. */
	categoryTransitions = /* @__PURE__ */ new Map();
	cache = /* @__PURE__ */ new Map();
	cooldowns = /* @__PURE__ */ new Map();
	peakLevels;
	retainedFaults = [];
	context = null;
	graph = null;
	state = "blocked";
	muted;
	masterGain;
	hidden = false;
	disposedTerminal = false;
	resumeBlocked = false;
	activation = null;
	pendingActivations = /* @__PURE__ */ new Set();
	failedTeardownContexts = /* @__PURE__ */ new Set();
	closeSettlements = /* @__PURE__ */ new Map();
	muteSettlement = null;
	disposeSettlement = null;
	stateListener = null;
	contextGeneration = 0;
	lifecycleGeneration = 0;
	voiceOrdinal = 0;
	reservationOrdinal = 0;
	faultOrdinal = 0;
	totalFaults = 0;
	peakNodes = 0;
	peakVoices = 0;
	peakCreatureEmitters = 0;
	peakCache = 0;
	cacheEvictions = 0;
	voicesStarted = 0;
	voicesCompleted = 0;
	voicesStopped = 0;
	voicesStolen = 0;
	cooldownRejects = 0;
	concurrencyRejects = 0;
	voiceAdmissionInProgress = false;
	categoryMixApplying = false;
	categoryMixDirty = false;
	categoryPolicyGeneration = 0;
	reservedVoices = 0;
	reservedNodes = 0;
	peakReservedVoices = 0;
	peakReservedNodes = 0;
	peakVoicesWithReservations = 0;
	peakNodesWithReservations = 0;
	sourceStopFailures = 0;
	nodeDisconnectFailures = 0;
	cacheReleaseFailures = 0;
	lastNowMs = null;
	deadlineWake = null;
	deadlineReconciling = false;
	deadlineDirty = false;
	deadlineFailed = false;
	constructor(options) {
		if (options === null || typeof options !== "object") throw new TypeError("audio runtime requires injected context and clock factories");
		let createContext;
		let nowMs;
		let verifyCounterpart;
		let scheduleVoiceDeadline;
		let budgets;
		let initialMuted;
		let initialMasterGain;
		let categoryGains;
		try {
			createContext = options.createContext;
			nowMs = options.nowMs;
			verifyCounterpart = options.verifyCounterpart;
			scheduleVoiceDeadline = options.scheduleVoiceDeadline;
			budgets = options.budgets;
			initialMuted = options.initialMuted;
			initialMasterGain = options.initialMasterGain;
			categoryGains = options.categoryGains;
		} catch {
			throw new TypeError("audio runtime options could not be read");
		}
		if (typeof createContext !== "function" || typeof nowMs !== "function") throw new TypeError("audio runtime requires injected context and clock factories");
		this.createContext = createContext;
		this.nowMs = nowMs;
		if (scheduleVoiceDeadline !== void 0 && typeof scheduleVoiceDeadline !== "function") throw new TypeError("audio voice deadline scheduler must be a function");
		this.scheduleVoiceDeadline = scheduleVoiceDeadline ?? null;
		if (verifyCounterpart !== void 0 && typeof verifyCounterpart !== "function") throw new TypeError("audio counterpart verifier must be a function");
		this.verifyCounterpart = verifyCounterpart ?? null;
		this.budgets = resolvedBudgets(budgets);
		this.muted = initialMuted === true;
		this.masterGain = boundedGain(initialMasterGain ?? 1, "master gain");
		this.gains = Object.fromEntries(AUDIO_CATEGORIES.map((name) => [name, boundedGain(categoryGains?.[name] ?? 1, `${name} category gain`)]));
		this.peakLevels = Object.fromEntries(METERS.map((name) => [name, 0]));
	}
	activate() {
		if (this.activation && (this.activation.lifecycle === this.lifecycleGeneration || this.context !== null)) return this.activation.promise;
		const lifecycle = this.lifecycleGeneration;
		let resolveCancellation;
		const record = {
			lifecycle,
			promise: null,
			context: null,
			published: false,
			cancelled: false,
			cancellation: new Promise((resolve) => {
				resolveCancellation = resolve;
			}),
			cancel: () => {
				if (record.cancelled) return;
				record.cancelled = true;
				resolveCancellation();
			}
		};
		let resolveActivation;
		let rejectActivation;
		const pending = new Promise((resolve, reject) => {
			resolveActivation = resolve;
			rejectActivation = reject;
		});
		record.promise = pending;
		this.activation = record;
		this.pendingActivations.add(record);
		const clear = () => {
			this.pendingActivations.delete(record);
			if (this.activation === record) this.activation = null;
		};
		pending.then(clear, clear);
		this.activateInner(record).then(resolveActivation, rejectActivation);
		return pending;
	}
	async activateInner(record) {
		const lifecycle = record.lifecycle;
		if (this.isDisposed()) return Object.freeze({ kind: "disposed" });
		if (record.cancelled || lifecycle !== this.lifecycleGeneration) return this.activationResultForCurrentPolicy();
		if (this.hidden) {
			this.state = "suspended";
			return Object.freeze({
				kind: "suspended",
				reason: "hidden"
			});
		}
		if (this.muted) {
			this.state = "blocked";
			return Object.freeze({
				kind: "blocked",
				reason: "muted"
			});
		}
		this.syncContextState();
		if (!this.context) {
			if (this.failedTeardownContexts.size > 0) {
				if ((await Promise.race([Promise.all(this.retryFailedTeardownContexts()).then(() => Object.freeze({ kind: "settled" })), record.cancellation.then(() => Object.freeze({ kind: "cancelled" }))])).kind === "cancelled" || record.cancelled || lifecycle !== this.lifecycleGeneration || this.isDisposed() || this.hidden || this.muted) return this.activationResultForCurrentPolicy();
				if (this.failedTeardownContexts.size > 0) {
					this.state = "blocked";
					return Object.freeze({
						kind: "blocked",
						reason: "context-unavailable"
					});
				}
			}
			if (this.closeSettlements.size > 0) {
				this.state = "blocked";
				return Object.freeze({
					kind: "blocked",
					reason: "context-unavailable"
				});
			}
			let context = null;
			try {
				context = this.createContext();
				record.context = context;
				this.contextGeneration++;
				if (this.closeSettlements.has(context) || this.failedTeardownContexts.has(context)) {
					this.state = "blocked";
					return Object.freeze({
						kind: "blocked",
						reason: "context-unavailable"
					});
				}
				const graph = createGraph(context, this.masterGain, this.gains);
				if (lifecycle !== this.lifecycleGeneration || this.isDisposed() || this.hidden || this.muted) {
					await this.closeUnpublishedContext(context, graph);
					return this.activationResultForCurrentPolicy();
				}
				this.context = context;
				this.graph = graph;
				record.published = true;
				this.attachStateListener(context);
				this.observeBudgets();
				if (record.cancelled || lifecycle !== this.lifecycleGeneration || this.isDisposed() || this.hidden || this.muted || this.context !== context || this.graph !== graph) return this.activationResultForCurrentPolicy();
			} catch (error) {
				this.recordFault("context-create", error);
				const publishedHere = context !== null && this.context === context;
				if (context && publishedHere) try {
					this.detachStateListener(context);
				} catch (detachError) {
					this.recordFault("context-listener-remove", detachError);
				}
				const failedGraph = publishedHere ? this.graph : null;
				if (publishedHere) {
					this.context = null;
					this.graph = null;
				}
				if (failedGraph) this.disconnectOwned(failedGraph.nodes, "graph-disconnect");
				if (context) await this.closeContext(context);
				if (lifecycle !== this.lifecycleGeneration) return this.activationResultForCurrentPolicy();
				if (this.isDisposed()) return Object.freeze({ kind: "disposed" });
				this.state = this.hidden ? "suspended" : "blocked";
				return Object.freeze({
					kind: "blocked",
					reason: "context-create"
				});
			}
		}
		const context = this.context;
		if (!context || !this.graph) {
			this.state = "blocked";
			return Object.freeze({
				kind: "blocked",
				reason: "context-unavailable"
			});
		}
		record.context = context;
		record.published = true;
		if (context.state === "suspended") {
			this.state = "suspended";
			let resumeOutcome;
			try {
				const resume = context.resume();
				const resumeAttempt = Promise.resolve(resume).then(() => Object.freeze({ kind: "resumed" }), (error) => Object.freeze({
					kind: "failed",
					error
				}));
				if (record.cancelled) return this.activationResultForCurrentPolicy();
				resumeOutcome = await Promise.race([resumeAttempt, record.cancellation.then(() => Object.freeze({ kind: "cancelled" }))]);
			} catch (error) {
				resumeOutcome = Object.freeze({
					kind: "failed",
					error
				});
			}
			if (resumeOutcome.kind === "cancelled" || record.cancelled) return this.activationResultForCurrentPolicy();
			if (resumeOutcome.kind === "failed") {
				const { error } = resumeOutcome;
				this.resumeBlocked = true;
				this.recordFault("resume", error);
				if (lifecycle !== this.lifecycleGeneration) {
					await this.shutdownContext("stale-activation", context);
					return this.activationResultForCurrentPolicy();
				}
				if (this.isDisposed()) return Object.freeze({ kind: "disposed" });
				if (this.hidden) {
					this.state = "suspended";
					return Object.freeze({
						kind: "suspended",
						reason: "hidden"
					});
				}
				if (this.context === context && !this.isDisposed()) this.state = "blocked";
				return Object.freeze({
					kind: "blocked",
					reason: "resume-failed"
				});
			}
			this.resumeBlocked = false;
		}
		if (record.cancelled || lifecycle !== this.lifecycleGeneration) {
			await this.shutdownContext("stale-activation", context);
			return this.activationResultForCurrentPolicy();
		}
		if (this.isDisposed()) return Object.freeze({ kind: "disposed" });
		if (this.hidden) {
			this.state = "suspended";
			return Object.freeze({
				kind: "suspended",
				reason: "hidden"
			});
		}
		if (this.muted) {
			this.state = "blocked";
			this.applyMasterMute();
			return Object.freeze({
				kind: "blocked",
				reason: "muted"
			});
		}
		if (this.context !== context || context.state !== "running") {
			this.syncContextState();
			if (!this.isDisposed()) this.state = "blocked";
			return Object.freeze({
				kind: "blocked",
				reason: "context-unavailable"
			});
		}
		this.state = "running";
		this.applyMasterMute();
		return Object.freeze({ kind: "running" });
	}
	setMuted(muted) {
		const next = muted === true;
		if (next && this.closeSettlements.size > 0) {
			if (this.isDisposed()) return Promise.resolve();
			if (!this.muted) {
				this.lifecycleGeneration++;
				this.muted = true;
				this.cancelPendingActivations();
			}
			this.state = this.hidden ? "suspended" : "blocked";
			this.applyMasterMute();
			this.shutdownContext("mute");
			return Promise.resolve();
		}
		if (this.isDisposed()) {
			if (next && this.failedTeardownContexts.size > 0) return this.dispose();
			return Promise.resolve();
		}
		if (this.muted === next) {
			if (!next) return Promise.resolve();
			if (this.muteSettlement) return this.muteSettlement;
			if (this.failedTeardownContexts.size === 0) return Promise.resolve();
			return this.beginMasterMuteSettlement(this.lifecycleGeneration, null);
		}
		const lifecycle = ++this.lifecycleGeneration;
		this.muted = next;
		this.cancelPendingActivations();
		if (!this.muted) {
			this.applyMasterMute();
			this.syncContextState();
			if (!this.context) this.state = this.hidden ? "suspended" : "blocked";
			return Promise.resolve();
		}
		return this.beginMasterMuteSettlement(lifecycle, this.muteSettlement);
	}
	beginMasterMuteSettlement(lifecycle, prior) {
		let resolveSettlement;
		let rejectSettlement;
		const settlement = new Promise((resolve, reject) => {
			resolveSettlement = resolve;
			rejectSettlement = reject;
		});
		this.muteSettlement = settlement;
		const clear = () => {
			if (this.muteSettlement === settlement) this.muteSettlement = null;
		};
		settlement.then(clear, clear);
		this.state = this.hidden ? "suspended" : "blocked";
		this.applyMasterMute();
		const unpublishedActivations = this.unpublishedActivationPromises();
		const failedContexts = [...this.failedTeardownContexts];
		const context = this.context;
		const closing = context ? this.shutdownContext("mute", context) : Promise.resolve();
		const failedTeardowns = this.retryFailedTeardownContexts(failedContexts);
		this.settleMasterMute(lifecycle, prior, unpublishedActivations, closing, failedTeardowns).then(resolveSettlement, rejectSettlement);
		return settlement;
	}
	setMasterGain(gain) {
		if (this.isDisposed()) return;
		this.masterGain = boundedGain(gain, "master gain");
		this.applyMasterMute();
	}
	setCategoryGain(categoryValue, gain) {
		if (this.isDisposed()) return;
		const name = category(categoryValue);
		const value = boundedGain(gain, `${name} category gain`);
		this.gains[name] = value;
		this.categoryPolicyGeneration++;
		this.reconcileCurrentCategoryMix(null, [name]);
	}
	async setHidden(hidden) {
		if (this.isDisposed()) return;
		const lifecycle = ++this.lifecycleGeneration;
		this.hidden = hidden === true;
		this.cancelPendingActivations();
		if (!this.hidden) return;
		this.state = "suspended";
		if (this.context) await this.shutdownContext("hidden", this.context);
		else if (this.activation?.promise) await this.activation.promise;
		if (this.isDisposed() || lifecycle !== this.lifecycleGeneration || !this.hidden) return;
		if (this.context) await this.shutdownContext("hidden", this.context);
		if (!this.isDisposed() && lifecycle === this.lifecycleGeneration && this.hidden) this.state = "suspended";
	}
	playVoice(request) {
		if (this.isDisposed()) return Object.freeze({
			kind: "rejected",
			reason: "disposed"
		});
		if (this.muted) return Object.freeze({
			kind: "rejected",
			reason: "muted"
		});
		this.syncContextState();
		if (this.state !== "running" || !this.context || !this.graph || this.hidden) return Object.freeze({
			kind: "rejected",
			reason: "not-running"
		});
		if (this.voiceAdmissionInProgress) return Object.freeze({
			kind: "rejected",
			reason: "reentrant"
		});
		this.voiceAdmissionInProgress = true;
		try {
			return this.playVoiceInner(request);
		} finally {
			this.voiceAdmissionInProgress = false;
		}
	}
	playVoiceInner(request) {
		let key;
		let categoryName;
		let priority;
		let cooldownGroup;
		let cooldownMs;
		let maxDurationMs;
		let concurrencyGroup;
		let maxConcurrent;
		let nodeCount;
		let mixIntent;
		let counterpart = null;
		let create;
		try {
			if (request === null || typeof request !== "object") throw new TypeError("audio voice request is incomplete");
			const keyValue = request.key;
			const categoryValue = request.category;
			const priorityValue = request.priority;
			const cooldownGroupValue = request.cooldownGroup;
			const cooldownMsValue = request.cooldownMs;
			const maxDurationMsValue = request.maxDurationMs;
			const concurrencyGroupValue = request.concurrencyGroup;
			const maxConcurrentValue = request.maxConcurrent;
			const nodeCountValue = request.nodeCount;
			const mixIntentValue = request.mixIntent;
			const meaningValue = request.meaning;
			const createValue = request.create;
			key = boundedAudioKey(keyValue, "audio voice key", 192);
			categoryName = category(categoryValue);
			priority = boundedInteger(priorityValue, "audio voice priority", -1e3, 1e3);
			cooldownGroup = boundedAudioKey(cooldownGroupValue, "audio cooldown group", 128);
			cooldownMs = boundedInteger(cooldownMsValue, "audio cooldown", 0, 6e5);
			maxDurationMs = maxDurationMsValue === void 0 ? null : boundedInteger(maxDurationMsValue, "audio voice maximum duration", 1, 2147483647);
			if (maxDurationMs !== null && (!this.scheduleVoiceDeadline || this.deadlineFailed)) throw new TypeError("bounded audio voices require an available deadline scheduler");
			concurrencyGroup = boundedAudioKey(concurrencyGroupValue, "audio concurrency group", 128);
			maxConcurrent = boundedInteger(maxConcurrentValue, "audio group concurrency", 1, this.budgets.maxVoices);
			nodeCount = boundedInteger(nodeCountValue, "audio graph node reservation", 1, MAX_VOICE_GRAPH_NODES);
			mixIntent = voiceMixIntent(mixIntentValue);
			if (typeof createValue !== "function" || meaningValue === null || typeof meaningValue !== "object") throw new TypeError("audio voice request is incomplete");
			create = createValue;
			const meaningKind = meaningValue.kind;
			if (meaningKind === "meaningful") counterpart = counterpartReceipt(meaningValue.counterpart);
			else if (meaningKind !== "decorative") throw new TypeError("audio voice meaning is invalid");
		} catch {
			return Object.freeze({
				kind: "rejected",
				reason: "invalid-request"
			});
		}
		const counterpartResult = this.counterpartResult(counterpart);
		if (counterpartResult) return counterpartResult;
		this.syncContextState();
		const unavailable = this.voiceUnavailableResult();
		if (unavailable) return unavailable;
		let now;
		try {
			now = this.readMonotonicNow();
		} catch (error) {
			this.recordFault("clock", error);
			return Object.freeze({
				kind: "fault",
				reason: "clock"
			});
		}
		this.purgeCooldowns(now);
		this.reconcileVoiceDeadline();
		this.syncContextState();
		const postDeadlineUnavailable = this.voiceUnavailableResult();
		if (postDeadlineUnavailable) return postDeadlineUnavailable;
		if (maxDurationMs !== null && this.deadlineFailed) return Object.freeze({
			kind: "rejected",
			reason: "invalid-request"
		});
		const cooldown = this.cooldowns.get(cooldownGroup);
		if (cooldown && cooldown.untilMs > now) {
			this.cooldownRejects++;
			return Object.freeze({
				kind: "rejected",
				reason: "cooldown"
			});
		}
		const initialAdmission = this.voiceAdmission(priority, categoryName, concurrencyGroup, maxConcurrent);
		if (initialAdmission.reason) return this.admissionRejection(initialAdmission.reason);
		const reservationNodes = nodeCount + 1;
		if (this.currentNodeCount() + this.reservedNodes + reservationNodes > this.budgets.maxNodes) return Object.freeze({
			kind: "rejected",
			reason: "node-budget"
		});
		const reservation = Object.freeze({
			id: `reservation-${(++this.reservationOrdinal).toString(36).padStart(6, "0")}`,
			graphNodes: nodeCount,
			totalNodes: reservationNodes
		});
		this.beginReservation(reservationNodes);
		let reservationActive = true;
		let voiceGraph = null;
		let nodes = null;
		let sources = null;
		let voiceGain = null;
		const context = this.context;
		const runtimeGraph = this.graph;
		try {
			try {
				voiceGraph = create(context, reservation);
			} catch (error) {
				this.recordFault("voice-create", error);
				return Object.freeze({
					kind: "fault",
					reason: "voice-create"
				});
			}
			const snapshot = this.snapshotVoiceGraph(voiceGraph);
			const validated = snapshot ? this.validateVoiceGraph(snapshot, reservation) : null;
			if (!validated) {
				if (snapshot) this.discardVoiceGraph(snapshot);
				this.recordFault("voice-create", /* @__PURE__ */ new TypeError("voice graph ownership/reservation is invalid"));
				return Object.freeze({
					kind: "fault",
					reason: "voice-create"
				});
			}
			nodes = validated.nodes;
			sources = validated.sources;
			try {
				voiceGain = context.createGain();
				setParam(voiceGain.gain, 0, context.currentTime);
				validated.output.connect(voiceGain);
				voiceGain.connect(runtimeGraph.categories[categoryName]);
			} catch (error) {
				this.disconnectOwned(voiceGain ? [voiceGain, ...nodes] : nodes, "voice-connect");
				this.recordFault("voice-connect", error);
				return Object.freeze({
					kind: "fault",
					reason: "voice-connect"
				});
			}
			this.syncContextState();
			const postCreateUnavailable = this.voiceUnavailableResult(context, runtimeGraph);
			if (postCreateUnavailable) {
				this.disconnectOwned([voiceGain, ...nodes], "voice-discard");
				return postCreateUnavailable;
			}
			const postCreateCounterpart = this.counterpartResult(counterpart);
			if (postCreateCounterpart) {
				this.disconnectOwned([voiceGain, ...nodes], "voice-discard");
				return postCreateCounterpart;
			}
			const finalAdmission = this.voiceAdmission(priority, categoryName, concurrencyGroup, maxConcurrent);
			if (finalAdmission.reason) {
				this.disconnectOwned([voiceGain, ...nodes], "voice-discard");
				return this.admissionRejection(finalAdmission.reason);
			}
			if (this.currentNodeCount() + this.reservedNodes > this.budgets.maxNodes) {
				this.disconnectOwned([voiceGain, ...nodes], "voice-discard");
				return Object.freeze({
					kind: "rejected",
					reason: "node-budget"
				});
			}
			let expiresAtMs = null;
			if (maxDurationMs !== null) {
				try {
					expiresAtMs = this.readMonotonicNow() + maxDurationMs;
					if (!Number.isFinite(expiresAtMs) || expiresAtMs > Number.MAX_SAFE_INTEGER) throw new TypeError("audio voice deadline is outside the safe clock range");
				} catch (error) {
					this.disconnectOwned([voiceGain, ...nodes], "voice-disconnect");
					this.recordFault("clock", error);
					return Object.freeze({
						kind: "fault",
						reason: "clock"
					});
				}
				this.syncContextState();
				const clockUnavailable = this.voiceUnavailableResult(context, runtimeGraph);
				if (clockUnavailable) {
					this.disconnectOwned([voiceGain, ...nodes], "voice-discard");
					return clockUnavailable;
				}
			}
			const ordinal = ++this.voiceOrdinal;
			const id = `voice-${ordinal.toString(36).padStart(6, "0")}`;
			let installed = false;
			let endedDuringStart = false;
			const startedSources = [];
			try {
				validated.source.onended = () => {
					if (installed) this.finishVoice(id, "natural");
					else endedDuringStart = true;
				};
				for (const source of sources) {
					source.start();
					startedSources.push(source);
				}
				if (endedDuringStart) throw new Error("audio completion source ended during start");
			} catch (error) {
				this.clearSourceEndedHandlers(sources, "voice-handler-clear");
				this.stopSources(startedSources, "voice-stop");
				this.disconnectOwned([voiceGain, ...nodes], "voice-disconnect");
				this.recordFault("voice-start", error);
				return Object.freeze({
					kind: "fault",
					reason: "voice-start"
				});
			}
			this.syncContextState();
			const postStartUnavailable = this.voiceUnavailableResult(context, runtimeGraph);
			if (postStartUnavailable) {
				this.clearSourceEndedHandlers(sources, "voice-handler-clear");
				this.stopSources(sources, "voice-stop");
				this.disconnectOwned([voiceGain, ...nodes], "voice-discard");
				return postStartUnavailable;
			}
			const postStartCounterpart = this.counterpartResult(counterpart);
			if (postStartCounterpart) {
				this.clearSourceEndedHandlers(sources, "voice-handler-clear");
				this.stopSources(sources, "voice-stop");
				this.disconnectOwned([voiceGain, ...nodes], "voice-discard");
				return postStartCounterpart;
			}
			const active = {
				id,
				key,
				ordinal,
				priority,
				category: categoryName,
				concurrencyGroup,
				mixIntent,
				source: validated.source,
				sources,
				nodes,
				voiceGain,
				nodeCount: reservationNodes,
				expiresAtMs,
				cleaned: false
			};
			const previousMixFactors = this.voiceMixFactors();
			const prospectiveMixFactors = this.voiceMixFactors(mixIntent, finalAdmission.victim?.id ?? null);
			const discardCandidate = () => {
				this.clearSourceEndedHandlers(sources, "voice-handler-clear");
				this.stopSources(sources, "voice-stop");
				this.disconnectOwned([voiceGain, ...nodes], "voice-disconnect");
			};
			if (!this.applyProspectiveCategoryMix(prospectiveMixFactors, previousMixFactors)) {
				discardCandidate();
				this.reconcileCurrentCategoryMix(null);
				return Object.freeze({
					kind: "fault",
					reason: "voice-start"
				});
			}
			let admittedPolicyGeneration = this.categoryPolicyGeneration;
			if (finalAdmission.victim) {
				this.finishVoice(finalAdmission.victim.id, "stolen", true);
				const expectedGeneration = admittedPolicyGeneration + 1;
				if (this.categoryPolicyGeneration !== expectedGeneration) {
					discardCandidate();
					this.reconcileCurrentCategoryMix(null);
					this.recordFault("category-mix-reentrant", /* @__PURE__ */ new Error("replacement cleanup changed category policy during admission"));
					return Object.freeze({
						kind: "fault",
						reason: "voice-start"
					});
				}
				admittedPolicyGeneration = expectedGeneration;
			}
			this.syncContextState();
			const postMixUnavailable = this.voiceUnavailableResult(context, runtimeGraph);
			if (postMixUnavailable) {
				discardCandidate();
				this.reconcileCurrentCategoryMix(null);
				return postMixUnavailable;
			}
			if (endedDuringStart) {
				discardCandidate();
				this.reconcileCurrentCategoryMix(null);
				this.recordFault("voice-start", /* @__PURE__ */ new Error("audio completion source ended during mix admission"));
				return Object.freeze({
					kind: "fault",
					reason: "voice-start"
				});
			}
			try {
				setParam(voiceGain.gain, 1, context.currentTime);
			} catch (error) {
				discardCandidate();
				this.reconcileCurrentCategoryMix(null);
				this.recordFault("voice-start", error);
				return Object.freeze({
					kind: "fault",
					reason: "voice-start"
				});
			}
			this.syncContextState();
			const postGainUnavailable = this.voiceUnavailableResult(context, runtimeGraph);
			if (postGainUnavailable) {
				discardCandidate();
				this.reconcileCurrentCategoryMix(null);
				return postGainUnavailable;
			}
			if (endedDuringStart || this.categoryPolicyGeneration !== admittedPolicyGeneration) {
				discardCandidate();
				this.reconcileCurrentCategoryMix(null);
				this.recordFault("voice-start", /* @__PURE__ */ new Error(endedDuringStart ? "audio completion source ended during gain admission" : "category policy changed during voice gain admission"));
				return Object.freeze({
					kind: "fault",
					reason: "voice-start"
				});
			}
			this.endReservation(reservationNodes);
			reservationActive = false;
			this.active.set(id, active);
			this.categoryPolicyGeneration++;
			installed = true;
			this.voicesStarted++;
			this.reconcileVoiceDeadline();
			if (!this.active.has(id)) return Object.freeze({
				kind: "fault",
				reason: "voice-start"
			});
			if (cooldownMs > 0) this.stampCooldown(cooldownGroup, now + cooldownMs);
			this.observeBudgets();
			return Object.freeze({
				kind: "started",
				voiceId: id
			});
		} finally {
			if (reservationActive) this.endReservation(reservationNodes);
		}
	}
	stopVoice(voiceId) {
		if (!this.active.get(voiceId)) return false;
		this.finishVoice(voiceId, "manual");
		return true;
	}
	putCached(keyValue, value, release) {
		if (this.isDisposed() || this.hidden || this.budgets.maxCacheEntries === 0) return false;
		const key = boundedAudioKey(keyValue, "audio cache key", 192);
		const existing = this.cache.get(key);
		if (existing) {
			this.cache.delete(key);
			this.releaseCacheEntry(existing);
		}
		while (this.cache.size >= this.budgets.maxCacheEntries) {
			const oldest = this.cache.keys().next().value;
			if (oldest === void 0) break;
			const entry = this.cache.get(oldest);
			this.cache.delete(oldest);
			this.cacheEvictions++;
			this.releaseCacheEntry(entry);
		}
		this.cache.set(key, {
			value,
			release: release ? release : null
		});
		this.observeBudgets();
		return true;
	}
	getCached(keyValue) {
		const key = boundedAudioKey(keyValue, "audio cache key", 192);
		const entry = this.cache.get(key);
		if (!entry) return void 0;
		this.cache.delete(key);
		this.cache.set(key, entry);
		return entry.value;
	}
	deleteCached(keyValue) {
		const key = boundedAudioKey(keyValue, "audio cache key", 192);
		const entry = this.cache.get(key);
		if (!entry) return false;
		this.cache.delete(key);
		this.releaseCacheEntry(entry);
		return true;
	}
	clearCache() {
		const entries = [...this.cache.values()];
		this.cache.clear();
		for (const entry of entries) this.releaseCacheEntry(entry);
	}
	diagnostics() {
		this.syncContextState();
		this.samplePeaks();
		this.observeBudgets();
		const peaks = Object.freeze({ ...this.peakLevels });
		const voiceIds = Object.freeze([...this.active.keys()]);
		const mixFactors = this.voiceMixFactors();
		const mixOwners = Object.freeze([...this.active.values()].map((voice) => Object.freeze({
			voiceId: voice.id,
			factors: Object.freeze({ ...voice.mixIntent.factors })
		})));
		return Object.freeze({
			state: this.state,
			contextState: this.context?.state ?? null,
			contextGeneration: this.contextGeneration,
			muted: this.muted,
			hidden: this.hidden,
			gains: Object.freeze({
				master: this.masterGain,
				effectiveMaster: this.muted ? 0 : this.masterGain,
				categories: Object.freeze({ ...this.gains })
			}),
			voiceMix: Object.freeze({
				schema: AUDIO_VOICE_MIX_INTENT_SCHEMA_V1,
				activeOwners: mixOwners.length,
				owners: mixOwners,
				factors: mixFactors,
				effectiveCategoryGains: this.effectiveCategoryGains(mixFactors)
			}),
			nodes: Object.freeze({
				active: this.currentNodeCount(),
				peak: this.peakNodes,
				budget: this.budgets.maxNodes
			}),
			cache: Object.freeze({
				active: this.cache.size,
				peak: this.peakCache,
				budget: this.budgets.maxCacheEntries,
				evictions: this.cacheEvictions
			}),
			voices: Object.freeze({
				active: this.active.size,
				peak: this.peakVoices,
				budget: this.budgets.maxVoices,
				ids: voiceIds,
				started: this.voicesStarted,
				completed: this.voicesCompleted,
				stopped: this.voicesStopped,
				stolen: this.voicesStolen,
				cooldownRejects: this.cooldownRejects,
				concurrencyRejects: this.concurrencyRejects
			}),
			creatureEmitters: Object.freeze({
				active: this.currentCreatureEmitterCount(),
				peak: this.peakCreatureEmitters,
				budget: this.budgets.maxCreatureEmitters
			}),
			cooldowns: Object.freeze({
				active: this.cooldowns.size,
				budget: this.budgets.maxCooldownGroups
			}),
			reservations: Object.freeze({
				voices: Object.freeze({
					active: this.reservedVoices,
					peak: this.peakReservedVoices,
					activePlusReservedPeak: this.peakVoicesWithReservations
				}),
				nodes: Object.freeze({
					active: this.reservedNodes,
					peak: this.peakReservedNodes,
					activePlusReservedPeak: this.peakNodesWithReservations
				})
			}),
			cleanup: Object.freeze({
				sourceStopFailures: this.sourceStopFailures,
				nodeDisconnectFailures: this.nodeDisconnectFailures,
				cacheReleaseFailures: this.cacheReleaseFailures
			}),
			peaks,
			faults: Object.freeze({
				total: this.totalFaults,
				retained: Object.freeze(this.retainedFaults.map((fault) => Object.freeze({ ...fault }))),
				budget: this.budgets.maxFaults
			})
		});
	}
	dispose() {
		if (this.closeSettlements.size > 0) {
			if (!this.disposedTerminal) {
				this.disposedTerminal = true;
				this.lifecycleGeneration++;
				this.cancelPendingActivations();
			}
			this.state = "disposed";
			this.shutdownContext("dispose");
			this.clearCache();
			this.cooldowns.clear();
			return Promise.resolve();
		}
		if (this.disposeSettlement) return this.disposeSettlement;
		let resolveSettlement;
		let rejectSettlement;
		const settlement = new Promise((resolve, reject) => {
			resolveSettlement = resolve;
			rejectSettlement = reject;
		});
		this.disposeSettlement = settlement;
		if (!this.disposedTerminal) {
			this.disposedTerminal = true;
			this.lifecycleGeneration++;
			this.cancelPendingActivations();
		}
		this.state = "disposed";
		const unpublishedActivations = this.unpublishedActivationPromises();
		const failedContexts = [...this.failedTeardownContexts];
		const closing = this.shutdownContext("dispose");
		const failedTeardowns = this.retryFailedTeardownContexts(failedContexts);
		const obligations = [
			closing,
			...unpublishedActivations,
			...failedTeardowns
		];
		if (this.muteSettlement) obligations.push(this.muteSettlement);
		const operation = Promise.all(obligations).then(() => {
			this.clearCache();
			this.cooldowns.clear();
			this.state = "disposed";
		});
		const clear = () => {
			if (this.disposeSettlement === settlement) this.disposeSettlement = null;
		};
		settlement.then(clear, clear);
		operation.then(resolveSettlement, rejectSettlement);
		return settlement;
	}
	counterpartResult(counterpart) {
		if (!counterpart) return null;
		if (!this.verifyCounterpart) return Object.freeze({
			kind: "rejected",
			reason: "missing-counterpart"
		});
		try {
			if (this.verifyCounterpart(counterpart) !== true) return Object.freeze({
				kind: "rejected",
				reason: "missing-counterpart"
			});
			return null;
		} catch (error) {
			this.recordFault("counterpart-verify", error);
			return Object.freeze({
				kind: "fault",
				reason: "counterpart-verify"
			});
		}
	}
	voiceUnavailableResult(expectedContext, expectedGraph) {
		if (this.isDisposed()) return Object.freeze({
			kind: "rejected",
			reason: "disposed"
		});
		if (this.muted) return Object.freeze({
			kind: "rejected",
			reason: "muted"
		});
		if (this.hidden || this.state !== "running" || !this.context || !this.graph || expectedContext !== void 0 && this.context !== expectedContext || expectedGraph !== void 0 && this.graph !== expectedGraph) return Object.freeze({
			kind: "rejected",
			reason: "not-running"
		});
		return null;
	}
	readMonotonicNow() {
		const now = this.nowMs();
		if (!Number.isFinite(now) || now < 0 || this.lastNowMs !== null && now < this.lastNowMs) throw new TypeError("audio clock is not monotonic-finite");
		this.lastNowMs = now;
		return now;
	}
	cancelVoiceDeadline() {
		const wake = this.deadlineWake;
		this.deadlineWake = null;
		if (wake?.cancel) wake.cancel();
	}
	failVoiceDeadline(error) {
		this.deadlineFailed = true;
		this.recordFault("voice-watchdog", error);
		try {
			this.cancelVoiceDeadline();
		} catch (cancelError) {
			this.recordFault("voice-watchdog-cancel", cancelError);
		}
		for (const voice of [...this.active.values()]) if (voice.expiresAtMs !== null) this.finishVoice(voice.id, "watchdog");
	}
	reconcileVoiceDeadline() {
		this.deadlineDirty = true;
		if (this.deadlineReconciling) return;
		this.deadlineReconciling = true;
		try {
			for (let pass = 0; pass < 12; pass++) {
				this.deadlineDirty = false;
				if (this.isDisposed() || this.muted || this.hidden || !this.context) {
					this.cancelVoiceDeadline();
					return;
				}
				const bounded = [...this.active.values()].filter((voice) => voice.expiresAtMs !== null);
				if (bounded.length === 0) {
					this.cancelVoiceDeadline();
					if (this.deadlineDirty) continue;
					return;
				}
				if (this.deadlineFailed || !this.scheduleVoiceDeadline) throw new Error("audio voice watchdog is unavailable");
				const now = this.readMonotonicNow();
				if (this.deadlineDirty) continue;
				const expired = bounded.filter((voice) => voice.expiresAtMs <= now);
				if (expired.length) {
					for (const voice of expired) this.finishVoice(voice.id, "watchdog");
					continue;
				}
				const expiresAtMs = Math.min(...bounded.map((voice) => voice.expiresAtMs));
				if (this.deadlineWake?.expiresAtMs === expiresAtMs) return;
				this.cancelVoiceDeadline();
				if (this.deadlineDirty) continue;
				const wake = {
					expiresAtMs,
					cancel: null,
					arming: true
				};
				this.deadlineWake = wake;
				let synchronousWake = false;
				const cancel = this.scheduleVoiceDeadline(() => {
					if (this.deadlineWake !== wake) return;
					if (wake.arming) {
						synchronousWake = true;
						return;
					}
					this.deadlineWake = null;
					this.reconcileVoiceDeadline();
				}, Math.min(2147483647, Math.ceil(expiresAtMs - now)));
				wake.arming = false;
				if (typeof cancel !== "function") throw new TypeError("audio watchdog cancellation is missing");
				wake.cancel = cancel;
				if (synchronousWake) throw new Error("audio watchdog scheduler called synchronously");
				if (this.deadlineWake !== wake) cancel();
				if (!this.deadlineDirty) return;
			}
			throw new Error("audio voice watchdog ownership did not settle");
		} catch (error) {
			this.failVoiceDeadline(error);
		} finally {
			this.deadlineReconciling = false;
		}
	}
	voiceAdmission(priority, categoryName, concurrencyGroup, maxConcurrent) {
		const active = [...this.active.values()];
		const groupFull = active.filter((voice) => voice.concurrencyGroup === concurrencyGroup).length >= maxConcurrent;
		const creatureFull = categoryName === "creature" && this.currentCreatureEmitterCount() >= this.budgets.maxCreatureEmitters;
		const voiceFull = active.length >= this.budgets.maxVoices;
		if (!groupFull && !creatureFull && !voiceFull) return Object.freeze({
			victim: null,
			reason: null
		});
		const rejectionReason = groupFull ? "concurrency" : creatureFull ? "creature-budget" : "voice-budget";
		const candidate = active.filter((voice) => (!groupFull || voice.concurrencyGroup === concurrencyGroup) && (!creatureFull || voice.category === "creature")).sort((left, right) => left.priority - right.priority || left.ordinal - right.ordinal)[0];
		if (!candidate || priority <= candidate.priority) return Object.freeze({
			victim: null,
			reason: rejectionReason
		});
		return Object.freeze({
			victim: candidate,
			reason: null
		});
	}
	admissionRejection(reason) {
		if (reason === "concurrency") this.concurrencyRejects++;
		return Object.freeze({
			kind: "rejected",
			reason
		});
	}
	beginReservation(nodes) {
		this.reservedVoices++;
		this.reservedNodes += nodes;
		this.peakReservedVoices = Math.max(this.peakReservedVoices, this.reservedVoices);
		this.peakReservedNodes = Math.max(this.peakReservedNodes, this.reservedNodes);
		this.peakVoicesWithReservations = Math.max(this.peakVoicesWithReservations, this.active.size + this.reservedVoices);
		this.peakNodesWithReservations = Math.max(this.peakNodesWithReservations, this.currentNodeCount() + this.reservedNodes);
	}
	endReservation(nodes) {
		this.reservedVoices--;
		this.reservedNodes -= nodes;
		if (this.reservedVoices < 0 || this.reservedNodes < 0) {
			this.reservedVoices = Math.max(0, this.reservedVoices);
			this.reservedNodes = Math.max(0, this.reservedNodes);
			this.recordFault("reservation-release", /* @__PURE__ */ new Error("audio reservation accounting underflow"));
		}
	}
	voiceMixFactors(additionalIntent = null, excludedVoiceId = null) {
		const factors = Object.fromEntries(AUDIO_CATEGORIES.map((name) => [name, 1]));
		const apply = (intent) => {
			for (const name of AUDIO_CATEGORIES) factors[name] = Math.min(factors[name], intent.factors[name]);
		};
		for (const voice of this.active.values()) if (voice.id !== excludedVoiceId) apply(voice.mixIntent);
		if (additionalIntent) apply(additionalIntent);
		return Object.freeze(factors);
	}
	effectiveCategoryGains(factors) {
		return Object.freeze(Object.fromEntries(AUDIO_CATEGORIES.map((name) => [name, this.gains[name] * factors[name]])));
	}
	writeCategoryGain(name, param, target, factor, previousFactor, time, stillCurrent) {
		const prior = this.categoryTransitions.get(name);
		const current = prior?.param === param ? prior : void 0;
		const progress = current ? Math.max(0, Math.min(1, (time - current.start) / Math.max(1e-6, current.end - current.start))) : 1;
		const held = current ? current.from + (current.target - current.from) * progress : param.value;
		const nativeAutomation = typeof param.cancelScheduledValues === "function" && typeof param.linearRampToValueAtTime === "function";
		const transitioning = current !== void 0 && time < current.end;
		const smooth = nativeAutomation && target > 0 && (factor < 1 || previousFactor !== void 0 && previousFactor !== factor || transitioning);
		if (!nativeAutomation) {
			if (current) throw new TypeError("category gain automation capabilities changed");
			setParam(param, target, time);
			return stillCurrent();
		}
		if (!smooth && current === void 0) {
			setParam(param, target, time);
			return stillCurrent();
		}
		const from = smooth ? held : target;
		this.categoryTransitions.set(name, {
			param,
			from,
			target: from,
			start: time,
			end: time
		});
		param.cancelScheduledValues(time);
		if (!stillCurrent()) return false;
		setParam(param, from, time);
		if (!stillCurrent()) return false;
		if (!smooth || from === target) {
			this.categoryTransitions.delete(name);
			return true;
		}
		const end = time + (target < from ? CATEGORY_DUCK_SECONDS : CATEGORY_RELEASE_SECONDS);
		this.categoryTransitions.set(name, {
			param,
			from,
			target,
			start: time,
			end
		});
		param.linearRampToValueAtTime(target, end);
		return stillCurrent();
	}
	writeCategoryMixTarget(factors, previousFactors, categories, expectedGeneration) {
		if (this.categoryMixApplying) {
			this.categoryMixDirty = true;
			return Object.freeze({ kind: "reentrant" });
		}
		const context = this.context;
		const graph = this.graph;
		if (!context || !graph) return Object.freeze({ kind: "applied" });
		const targetGains = this.effectiveCategoryGains(factors);
		this.categoryMixApplying = true;
		this.categoryMixDirty = false;
		try {
			for (const name of categories) {
				if (previousFactors && previousFactors[name] === factors[name]) continue;
				if (this.categoryMixDirty || this.categoryPolicyGeneration !== expectedGeneration || this.context !== context || this.graph !== graph) return Object.freeze({ kind: "reentrant" });
				if (!this.writeCategoryGain(name, graph.categories[name].gain, targetGains[name], factors[name], previousFactors?.[name], context.currentTime, () => !this.categoryMixDirty && this.categoryPolicyGeneration === expectedGeneration && this.context === context && this.graph === graph)) return Object.freeze({ kind: "reentrant" });
				if (this.categoryMixDirty || this.categoryPolicyGeneration !== expectedGeneration || this.context !== context || this.graph !== graph) return Object.freeze({ kind: "reentrant" });
			}
			return Object.freeze({ kind: "applied" });
		} catch (error) {
			return Object.freeze({
				kind: "failed",
				error
			});
		} finally {
			this.categoryMixApplying = false;
		}
	}
	reconcileCurrentCategoryMix(previousFactors, categories = AUDIO_CATEGORIES) {
		if (this.categoryMixApplying) {
			this.categoryMixDirty = true;
			return true;
		}
		let comparison = previousFactors;
		let selected = categories;
		let firstFailure = null;
		for (let pass = 0; pass < MAX_CATEGORY_MIX_PASSES; pass++) {
			const generation = this.categoryPolicyGeneration;
			const result = this.writeCategoryMixTarget(this.voiceMixFactors(), comparison, selected, generation);
			if (result.kind === "applied") return true;
			if (result.kind === "failed" && firstFailure === null) {
				firstFailure = result.error;
				this.recordFault("category-mix-gain", result.error);
			}
			comparison = null;
			selected = AUDIO_CATEGORIES;
		}
		this.quarantineCategoryMixer(firstFailure ?? /* @__PURE__ */ new Error("category mix reentrancy did not settle"));
		return false;
	}
	applyProspectiveCategoryMix(factors, previousFactors) {
		if (this.categoryMixApplying) {
			this.categoryMixDirty = true;
			this.recordFault("category-mix-reentrant", /* @__PURE__ */ new Error("prospective category mix was reentrant"));
			return false;
		}
		const generation = this.categoryPolicyGeneration;
		const result = this.writeCategoryMixTarget(factors, previousFactors, AUDIO_CATEGORIES, generation);
		if (result.kind === "applied") return true;
		if (result.kind === "failed") this.recordFault("category-mix-gain", result.error);
		else this.recordFault("category-mix-reentrant", /* @__PURE__ */ new Error("prospective category mix policy changed during admission"));
		this.reconcileCurrentCategoryMix(null);
		return false;
	}
	quarantineCategoryMixer(error) {
		const context = this.context;
		if (!context || !this.graph) return;
		this.recordFault("category-mix-quarantine", error);
		this.state = "suspended";
		this.shutdownContext("stale-activation", context);
	}
	applyMasterMute() {
		if (!this.graph || !this.context) return;
		try {
			setParam(this.graph.master.gain, this.muted ? 0 : this.masterGain, this.context.currentTime);
		} catch (error) {
			this.recordFault("master-gain", error);
		}
	}
	isDisposed() {
		return this.disposedTerminal;
	}
	async settleMasterMute(lifecycle, prior, unpublishedActivations, closing, failedTeardowns) {
		const obligations = [
			closing,
			...unpublishedActivations,
			...failedTeardowns
		];
		if (prior) obligations.push(prior);
		await Promise.all(obligations);
		if (!this.isDisposed() && lifecycle === this.lifecycleGeneration && this.muted) this.state = this.hidden ? "suspended" : "blocked";
	}
	unpublishedActivationPromises() {
		const pending = [];
		for (const record of this.pendingActivations) if (!record.published && record.promise) pending.push(record.promise);
		return pending;
	}
	retryFailedTeardownContexts(contexts = [...this.failedTeardownContexts]) {
		return contexts.map((context) => this.closeContext(context));
	}
	cancelActivationsForContext(context) {
		const pending = [];
		for (const record of this.pendingActivations) {
			if (record.context !== context) continue;
			record.cancel();
			if (record.promise) pending.push(record.promise);
		}
		return pending;
	}
	cancelPendingActivations() {
		for (const record of this.pendingActivations) record.cancel();
	}
	activationResultForCurrentPolicy() {
		if (this.isDisposed()) return Object.freeze({ kind: "disposed" });
		if (this.hidden) {
			if (!this.context) this.state = "suspended";
			return Object.freeze({
				kind: "suspended",
				reason: "hidden"
			});
		}
		if (!this.context) this.state = "blocked";
		return this.muted ? Object.freeze({
			kind: "blocked",
			reason: "muted"
		}) : Object.freeze({
			kind: "blocked",
			reason: "context-unavailable"
		});
	}
	async closeUnpublishedContext(context, graph) {
		this.disconnectOwned(graph.nodes, "graph-disconnect");
		await this.closeContext(context);
	}
	closeContext(context) {
		if (context.state === "closed") {
			this.failedTeardownContexts.delete(context);
			return Promise.resolve();
		}
		const existing = this.closeSettlements.get(context);
		if (existing) return existing;
		let resolveSettlement;
		const settlement = new Promise((resolve) => {
			resolveSettlement = resolve;
		});
		this.closeSettlements.set(context, settlement);
		let settled = false;
		const finish = (error) => {
			if (settled) return;
			settled = true;
			if (error !== void 0) this.recordFault("context-close", error);
			if (context.state === "closed") this.failedTeardownContexts.delete(context);
			else this.failedTeardownContexts.add(context);
			if (this.closeSettlements.get(context) === settlement) this.closeSettlements.delete(context);
			resolveSettlement();
		};
		let pending;
		try {
			pending = context.close();
		} catch (error) {
			finish(error);
			return settlement;
		}
		Promise.resolve(pending).then(() => {
			if (context.state !== "closed") {
				finish(/* @__PURE__ */ new Error(`audio context close resolved in ${context.state}`));
				return;
			}
			finish();
		}, finish);
		return settlement;
	}
	attachStateListener(context) {
		if (!context.addEventListener) return;
		const listener = () => {
			if (this.context !== context || this.isDisposed()) return;
			this.syncContextState();
		};
		context.addEventListener("statechange", listener);
		this.stateListener = listener;
	}
	detachStateListener(context) {
		if (this.stateListener && context.removeEventListener) try {
			context.removeEventListener("statechange", this.stateListener);
		} catch (error) {
			this.recordFault("context-listener-remove", error);
		}
		this.stateListener = null;
	}
	syncContextState() {
		const context = this.context;
		if (!context || this.isDisposed()) return;
		if (context.state === "running") {
			this.resumeBlocked = false;
			this.state = this.hidden ? "suspended" : this.muted ? "blocked" : "running";
			return;
		}
		if (context.state === "suspended") {
			this.state = this.hidden ? "suspended" : this.resumeBlocked || this.muted ? "blocked" : "suspended";
			return;
		}
		if (context.state === "closed" || context.state === "interrupted") {
			const lostState = context.state;
			this.recordFault("context-loss", /* @__PURE__ */ new Error(`audio context entered ${lostState}`));
			this.state = "suspended";
			const detached = this.detachContextOwnership("context-loss", context);
			if (lostState !== "closed") this.closeContext(context);
			if (detached) this.settleCancelledActivations(detached.activations);
			return;
		}
		this.state = "blocked";
	}
	async shutdownContext(reason, expectedContext) {
		const detached = this.detachContextOwnership(reason, expectedContext);
		if (!detached) return;
		const obligations = [];
		if (detached.context) obligations.push(this.closeContext(detached.context));
		if (reason !== "stale-activation") obligations.push(this.settleCancelledActivations(detached.activations));
		await Promise.all(obligations);
	}
	detachContextOwnership(reason, expectedContext) {
		if (expectedContext && this.context !== expectedContext) return null;
		const context = this.context;
		const graph = this.graph;
		if (context) this.detachStateListener(context);
		this.context = null;
		this.graph = null;
		this.categoryTransitions.clear();
		this.resumeBlocked = false;
		const activations = context ? this.cancelActivationsForContext(context) : [];
		this.clearCache();
		this.stopAllVoices(reason);
		if (graph) this.disconnectOwned(graph.nodes, "graph-disconnect");
		return Object.freeze({
			context,
			activations: Object.freeze(activations)
		});
	}
	async settleCancelledActivations(activations) {
		for (const activation of activations) try {
			await activation;
		} catch (error) {
			this.recordFault("activation-shutdown", error);
		}
	}
	snapshotVoiceGraph(graph) {
		if (graph === null || typeof graph !== "object") return null;
		try {
			const value = graph;
			const source = value.source;
			const sources = value.sources;
			const output = value.output;
			const nodes = value.nodes;
			const graphReservation = value.reservation;
			return Object.freeze({
				source,
				sources: Array.isArray(sources) ? Object.freeze([...sources]) : sources,
				output,
				nodes: Array.isArray(nodes) ? Object.freeze([...nodes]) : nodes,
				reservation: graphReservation
			});
		} catch {
			return null;
		}
	}
	validateVoiceGraph(graph, reservation) {
		try {
			if (!graph || typeof graph !== "object" || graph.reservation !== reservation || !isScheduledSource(graph.source) || !isNode(graph.output) || !Array.isArray(graph.nodes) || graph.nodes.length !== reservation.graphNodes || !Array.isArray(graph.sources) || graph.sources.length < 1) return null;
			const nodes = [...graph.nodes];
			const sources = [...graph.sources];
			if (nodes.some((node) => this.isProtectedRuntimeNode(node) || !isNode(node)) || new Set(nodes).size !== nodes.length || sources.some((source) => !isScheduledSource(source) || source.onended !== null) || new Set(sources).size !== sources.length || !sources.includes(graph.source) || !nodes.includes(graph.source) || !nodes.includes(graph.output) || sources.some((source) => !nodes.includes(source)) || nodes.some((node) => isScheduledSource(node) && !sources.includes(node))) return null;
			return Object.freeze({
				source: graph.source,
				output: graph.output,
				nodes: Object.freeze(nodes),
				sources: Object.freeze(sources)
			});
		} catch {
			return null;
		}
	}
	discardVoiceGraph(graph) {
		const candidates = [];
		try {
			if (Array.isArray(graph.nodes)) candidates.push(...graph.nodes);
		} catch {}
		try {
			if (Array.isArray(graph.sources)) candidates.push(...graph.sources);
		} catch {}
		candidates.push(graph.source, graph.output);
		const disposable = [];
		for (const candidate of candidates) try {
			if (!this.isProtectedRuntimeNode(candidate) && isNode(candidate)) disposable.push(candidate);
		} catch {}
		this.disconnectOwned([...new Set(disposable)], "voice-discard");
	}
	finishVoice(id, reason, mixAlreadyApplied = false) {
		const voice = this.active.get(id);
		if (!voice || voice.cleaned) return;
		const previousMixFactors = mixAlreadyApplied ? null : this.voiceMixFactors();
		voice.cleaned = true;
		this.active.delete(id);
		this.categoryPolicyGeneration++;
		if (previousMixFactors) this.reconcileCurrentCategoryMix(previousMixFactors);
		this.clearSourceEndedHandlers(voice.sources, "voice-handler-clear");
		this.stopSources(voice.sources, "voice-stop");
		this.disconnectOwned([voice.voiceGain, ...voice.nodes], "voice-disconnect");
		if (reason === "natural") this.voicesCompleted++;
		else {
			this.voicesStopped++;
			if (reason === "stolen") this.voicesStolen++;
		}
		this.reconcileVoiceDeadline();
	}
	stopAllVoices(reason) {
		for (const id of [...this.active.keys()]) this.finishVoice(id, reason);
	}
	clearSourceEndedHandlers(sources, faultKind) {
		for (const source of [...new Set(sources)]) try {
			source.onended = null;
		} catch (error) {
			this.recordFault(faultKind, error);
		}
	}
	isProtectedRuntimeNode(node) {
		if (this.context?.destination === node || this.graph?.nodes.some((candidate) => candidate === node)) return true;
		for (const voice of this.active.values()) if (voice.voiceGain === node || voice.nodes.some((candidate) => candidate === node)) return true;
		return false;
	}
	stopSources(sources, faultKind) {
		for (const source of [...new Set(sources)]) try {
			source.stop();
		} catch (error) {
			this.sourceStopFailures++;
			this.recordFault(faultKind, error);
		}
	}
	disconnectOwned(nodes, faultKind) {
		const unique = [...new Set(nodes)];
		for (let index = unique.length - 1; index >= 0; index--) try {
			unique[index].disconnect();
		} catch (error) {
			this.nodeDisconnectFailures++;
			this.recordFault(faultKind, error);
		}
	}
	stampCooldown(group, untilMs) {
		if (this.cooldowns.has(group)) this.cooldowns.delete(group);
		while (this.cooldowns.size >= this.budgets.maxCooldownGroups) {
			const oldest = this.cooldowns.keys().next().value;
			if (oldest === void 0) break;
			this.cooldowns.delete(oldest);
		}
		this.cooldowns.set(group, { untilMs });
	}
	purgeCooldowns(now) {
		for (const [group, entry] of this.cooldowns) if (entry.untilMs <= now) this.cooldowns.delete(group);
	}
	releaseCacheEntry(entry) {
		if (!entry.release) return;
		try {
			entry.release(entry.value);
		} catch (error) {
			this.cacheReleaseFailures++;
			this.recordFault("cache-release", error);
		}
	}
	samplePeaks() {
		if (!this.graph) return;
		for (const meter of METERS) {
			const entry = this.graph.meters[meter];
			try {
				entry.analyser.getFloatTimeDomainData(entry.samples);
				let peak = 0;
				for (const sample of entry.samples) if (Number.isFinite(sample)) peak = Math.max(peak, Math.min(1, Math.abs(sample)));
				this.peakLevels[meter] = Math.max(this.peakLevels[meter], peak);
			} catch (error) {
				this.recordFault("peak-sample", error);
			}
		}
	}
	currentNodeCount() {
		let count = this.graph?.nodes.length ?? 0;
		for (const voice of this.active.values()) count += voice.nodeCount;
		return count;
	}
	currentCreatureEmitterCount() {
		let count = 0;
		for (const voice of this.active.values()) if (voice.category === "creature") count++;
		return count;
	}
	observeBudgets() {
		this.peakNodes = Math.max(this.peakNodes, this.currentNodeCount());
		this.peakVoices = Math.max(this.peakVoices, this.active.size);
		this.peakCreatureEmitters = Math.max(this.peakCreatureEmitters, this.currentCreatureEmitterCount());
		this.peakCache = Math.max(this.peakCache, this.cache.size);
		this.peakVoicesWithReservations = Math.max(this.peakVoicesWithReservations, this.active.size + this.reservedVoices);
		this.peakNodesWithReservations = Math.max(this.peakNodesWithReservations, this.currentNodeCount() + this.reservedNodes);
	}
	recordFault(kind, error) {
		this.totalFaults++;
		const fault = Object.freeze({
			ordinal: ++this.faultOrdinal,
			kind,
			message: errorMessage(error)
		});
		this.retainedFaults.push(fault);
		if (this.retainedFaults.length > this.budgets.maxFaults) this.retainedFaults.shift();
	}
};
function createAudioRuntime(options) {
	return new InjectedAudioRuntime(options);
}
//#endregion
//#region port/v2/packages/audio/src/combat-cues.ts
const COMBAT_CUE_PARTICIPANTS_SCHEMA_V1 = "cf.audio.combat-cue-participants/v1";
const COMBAT_CUE_PLAN_SCHEMA_V1 = "cf.audio.combat-cue-plan/v1";
const PARTICIPANT_FACTS = /* @__PURE__ */ new WeakSet();
const CUE_PLANS = /* @__PURE__ */ new WeakSet();
function isCombatCueParticipantsV1(value) {
	return value !== null && typeof value === "object" && PARTICIPANT_FACTS.has(value) && value.schema === "cf.audio.combat-cue-participants/v1";
}
function isCombatCuePlanV1(value) {
	return value !== null && typeof value === "object" && CUE_PLANS.has(value) && value.schema === "cf.audio.combat-cue-plan/v1";
}
function boundedText(value, label, maximum = 192) {
	if (typeof value !== "string" || value.length < 1 || value.length > maximum || /[\u0000-\u001f\u007f]/u.test(value)) throw new TypeError(`${label} is invalid`);
	return value;
}
function finiteInteger(value, label, minimum = 0) {
	if (!Number.isSafeInteger(value) || value < minimum) throw new TypeError(`${label} is invalid`);
	return value;
}
function finiteNumber(value, label, minimum = 0) {
	if (typeof value !== "number" || !Number.isFinite(value) || value < minimum) throw new TypeError(`${label} is invalid`);
	return value;
}
function exactKeys(value, expected) {
	try {
		const actual = Reflect.ownKeys(value);
		return Object.getPrototypeOf(value) === Object.prototype && actual.length === expected.length && actual.every((key) => typeof key === "string" && expected.includes(key));
	} catch {
		return false;
	}
}
function sameCanonicalValue(left, right) {
	try {
		return JSON.stringify(left) === JSON.stringify(right);
	} catch {
		return false;
	}
}
function hash32$1(text, seed) {
	let value = seed >>> 0;
	for (let index = 0; index < text.length; index++) {
		value ^= text.charCodeAt(index);
		value = Math.imul(value, 16777619);
	}
	return value >>> 0;
}
function digest(text) {
	const left = hash32$1(text, 2166136261).toString(16).padStart(8, "0");
	const right = hash32$1([...text].reverse().join(""), 2654435769).toString(16).padStart(8, "0");
	return `${text.length.toString(36)}-${left}${right}`;
}
function abilityFact(value, explorerColor) {
	if (value === null || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) throw new TypeError("settled combat ability is invalid");
	const fields = {};
	for (const key of Object.keys(value).sort()) {
		boundedText(key, "combat ability field", 64);
		const child = value[key];
		if (typeof child === "number") {
			if (!Number.isFinite(child)) throw new TypeError("settled combat ability is invalid");
			fields[key] = Object.is(child, -0) ? 0 : child;
		} else if (typeof child === "string" || typeof child === "boolean") fields[key] = child;
		else throw new TypeError("settled combat ability is invalid");
	}
	if (explorerColor === "#ffcf8a" && exactKeys(fields, [
		"id",
		"n",
		"d",
		"regen",
		"taken"
	]) && fields.id === "resolve" && fields.n === "Frontier Resolve" && fields.d === "Hardened by the void — recovers each round and shrugs off blows" && fields.regen === .04 && fields.taken === .9) return Object.freeze({
		theme: fields.id,
		themeLabel: fields.n,
		color: explorerColor,
		fields: Object.freeze(fields)
	});
	const theme = boundedText(fields.theme, "combat ability theme", 64);
	const themeLabel = boundedText(fields.themeLabel, "combat ability label", 96);
	const color = boundedText(fields.col, "combat ability color", 32);
	return Object.freeze({
		theme,
		themeLabel,
		color,
		fields: Object.freeze(fields)
	});
}
function bodyMaterialFact(genome) {
	return Object.freeze({
		policy: "legacy-genome-weight-inputs-unmapped",
		genomeSeed: finiteInteger(genome.seed, "combat genome seed"),
		sizeIndex: finiteInteger(genome.size, "combat size index"),
		bodyIndex: finiteInteger(genome.body, "combat body index"),
		skinIndex: finiteInteger(genome.skin, "combat skin index"),
		detailIndex: finiteInteger(genome.detail, "combat detail index"),
		luminous: Boolean(genome.lumin)
	});
}
function participantFacts(plan) {
	const champion = plan.champion;
	const aRole = champion.kind === "player" ? "explorer" : "owned-fauna";
	const aSourceId = champion.kind === "player" ? champion.explorerId : champion.creatureId;
	const aBody = champion.kind === "player" ? null : bodyMaterialFact(champion.genome);
	const defender = plan.encounter.defender;
	const bRole = defender.kind === "titan" ? "titan" : defender.kind === "guardian" ? "guardian" : "defender-fauna";
	const a = Object.freeze({
		side: "A",
		role: aRole,
		sourceId: boundedText(aSourceId, "combat champion id"),
		combatName: boundedText(champion.name, "combat champion name"),
		statName: boundedText(plan.transcript.A.name, "combat champion stat name"),
		maxHp: finiteNumber(plan.transcript.maxA, "combat champion maximum HP", 1),
		ability: abilityFact(plan.transcript.A.ab, champion.kind === "player" ? plan.transcript.A.hex : void 0),
		bodyMaterial: aBody
	});
	const b = Object.freeze({
		side: "B",
		role: bRole,
		sourceId: boundedText(defender.sourceId, "combat defender id"),
		combatName: boundedText(defender.name, "combat defender name"),
		statName: boundedText(plan.transcript.B.name, "combat defender stat name"),
		maxHp: finiteNumber(plan.transcript.maxB, "combat defender maximum HP", 1),
		ability: abilityFact(plan.transcript.B.ab),
		bodyMaterial: bodyMaterialFact(defender.battleGenome)
	});
	let guardian = null;
	if (defender.kind === "guardian") {
		const ep = finiteInteger(defender.battleGenome.ep, "Guardian epithet index");
		const epithet = GUARDIAN_EPITHETS[ep % GUARDIAN_EPITHETS.length];
		if (epithet === void 0 || !defender.name.endsWith(epithet)) throw new TypeError("Guardian epithet does not match its canonical name");
		guardian = Object.freeze({
			kind: "guardian",
			sourceId: b.sourceId,
			planetSeed: finiteInteger(plan.encounter.identity.world.planet.seed, "Guardian planet seed"),
			tier: finiteInteger(defender.tier, "Guardian tier", 1),
			epithet,
			signatureId: null,
			abilityTheme: b.ability.theme
		});
	} else if (defender.kind === "titan") {
		const definition = PRIME_SIGNATURES_V1.find((row) => row.id === defender.signatureId);
		if (definition === void 0 || definition.guardianName !== defender.name) throw new TypeError("Titan identity does not match its Prime Signature");
		const separator = definition.guardianName.indexOf(", ");
		const epithet = separator < 0 ? definition.guardianName : definition.guardianName.slice(separator + 2);
		guardian = Object.freeze({
			kind: "titan",
			sourceId: b.sourceId,
			planetSeed: finiteInteger(plan.encounter.identity.world.planet.seed, "Titan planet seed"),
			tier: finiteInteger(defender.tier, "Titan tier", 1),
			epithet: boundedText(epithet, "Titan epithet"),
			signatureId: definition.id,
			abilityTheme: b.ability.theme
		});
	}
	return Object.freeze({
		schema: COMBAT_CUE_PARTICIPANTS_SCHEMA_V1,
		battleId: boundedText(plan.battleId, "combat battle id"),
		transcriptFingerprint: boundedText(plan.transcriptFingerprint, "combat transcript fingerprint"),
		champion: a,
		defender: b,
		guardian
	});
}
/** Snapshot the exact participant/Guardian facts from one canonical settlement.
* The private registration prevents a structurally plausible drifted clone
* from becoming cue authority. */
function projectCombatCueParticipantsV1(settlement) {
	if (!isCombatSettlementPlanV1(settlement)) throw new TypeError("registered completed combat settlement is required");
	const projected = participantFacts(settlement);
	PARTICIPANT_FACTS.add(projected);
	return projected;
}
function inferredSides(attackerName, defenderName, participants) {
	const aToB = attackerName === participants.champion.combatName && defenderName === participants.defender.combatName;
	const bToA = attackerName === participants.defender.combatName && defenderName === participants.champion.combatName;
	if (!aToB && !bToA) throw new TypeError("combat transcript names drifted from participants");
	if (aToB && bToA) return [null, null];
	return aToB ? ["A", "B"] : ["B", "A"];
}
function motifFact(guardian, motif) {
	return Object.freeze({
		...guardian,
		motif
	});
}
/** Pure transcript-to-cue projection. The settlement is named `result` to
* preserve the documented combatCuePlan(result, participants) contract. */
function combatCuePlan(result, participants) {
	if (!isCombatSettlementPlanV1(result)) throw new TypeError("registered completed combat settlement is required");
	if (!isCombatCueParticipantsV1(participants) || !sameCanonicalValue(participants, participantFacts(result))) throw new TypeError("registered combat participants do not match this settlement");
	const transcript = result.transcript;
	const planSeed = `${result.battleId}|${result.transcriptFingerprint}|${JSON.stringify(participants)}`;
	const cues = [];
	const pushCue = (input) => {
		if (input.families.length < 1 || new Set(input.families).size !== input.families.length) throw new TypeError("combat cue families are invalid");
		const ordinal = cues.length;
		const cueId = `combat-cue:${digest(`${planSeed}|${ordinal}|${input.stage}|${String(input.transcriptIndex)}|${input.families.join(",")}`)}`;
		const counterparts = Object.freeze(input.families.map((family) => Object.freeze({
			family,
			captionToken: `${cueId}:caption:${family}`,
			visualToken: `${cueId}:visual:${family}`
		})));
		cues.push(Object.freeze({
			cueId,
			ordinal,
			stage: input.stage,
			transcriptIndex: input.transcriptIndex,
			families: Object.freeze([...input.families]),
			actorSide: input.actorSide ?? null,
			targetSide: input.targetSide ?? null,
			defeatedSides: Object.freeze([...input.defeatedSides ?? []]),
			ability: input.ability ?? null,
			bodyMaterial: input.bodyMaterial ?? null,
			impact: input.impact ?? null,
			guardianMotif: input.guardianMotif ?? null,
			counterparts
		}));
	};
	if (participants.guardian !== null) pushCue({
		stage: "prelude",
		transcriptIndex: null,
		families: ["guardian-entrance"],
		actorSide: "B",
		guardianMotif: motifFact(participants.guardian, "entrance"),
		ability: participants.defender.ability,
		bodyMaterial: participants.defender.bodyMaterial
	});
	const initiativeSide = transcript.turnA0 ? "A" : "B";
	pushCue({
		stage: "prelude",
		transcriptIndex: null,
		families: ["initiative"],
		actorSide: initiativeSide,
		ability: initiativeSide === "A" ? participants.champion.ability : participants.defender.ability
	});
	let hpA = finiteNumber(transcript.maxA, "combat maximum HP A", 1);
	let hpB = finiteNumber(transcript.maxB, "combat maximum HP B", 1);
	let guardianPhaseSeen = false;
	for (let transcriptIndex = 0; transcriptIndex < transcript.log.length; transcriptIndex++) {
		const row = transcript.log[transcriptIndex];
		if (row === null || typeof row !== "object" || Array.isArray(row)) throw new TypeError("combat transcript event is malformed");
		const nextHpA = finiteNumber(row.hpA, "combat event HP A");
		const nextHpB = finiteNumber(row.hpB, "combat event HP B");
		if (nextHpA > transcript.maxA || nextHpB > transcript.maxB) throw new TypeError("combat transcript HP exceeds its settled maximum");
		const defeated = [];
		if (hpA > 0 && nextHpA === 0) defeated.push("A");
		if (hpB > 0 && nextHpB === 0) defeated.push("B");
		if (Object.hasOwn(row, "stun")) {
			if (!exactKeys(row, [
				"an",
				"dn",
				"stun",
				"hpA",
				"hpB"
			]) || row.stun !== true || nextHpA !== hpA || nextHpB !== hpB) throw new TypeError("combat stun event is malformed");
			const [actorSide, targetSide] = inferredSides(boundedText(row.an, "combat attacker name"), boundedText(row.dn, "combat defender name"), participants);
			pushCue({
				stage: "transcript",
				transcriptIndex,
				families: ["stun-skipped"],
				actorSide,
				targetSide
			});
		} else if (Object.hasOwn(row, "dodge")) {
			if (!exactKeys(row, [
				"an",
				"dn",
				"dodge",
				"hpA",
				"hpB"
			]) || row.dodge !== true || nextHpA !== hpA || nextHpB !== hpB) throw new TypeError("combat dodge event is malformed");
			const [actorSide, targetSide] = inferredSides(boundedText(row.an, "combat attacker name"), boundedText(row.dn, "combat defender name"), participants);
			pushCue({
				stage: "transcript",
				transcriptIndex,
				families: ["dodge"],
				actorSide,
				targetSide
			});
		} else if (Object.hasOwn(row, "tick")) {
			if (!exactKeys(row, [
				"tick",
				"rA",
				"rB",
				"bA",
				"bB",
				"hpA",
				"hpB"
			]) || row.tick !== true) throw new TypeError("combat tick event is malformed");
			const rA = finiteInteger(row.rA, "combat regen A");
			const rB = finiteInteger(row.rB, "combat regen B");
			const bA = finiteInteger(row.bA, "combat burn A");
			const bB = finiteInteger(row.bB, "combat burn B");
			const families = [];
			if (bA > 0 || bB > 0) families.push("burn");
			if (rA > 0 || rB > 0) families.push("regen");
			if (defeated.length > 0) families.push("defeat");
			if (families.length < 1) throw new TypeError("combat tick event has no settled effect");
			pushCue({
				stage: "transcript",
				transcriptIndex,
				families,
				defeatedSides: defeated
			});
		} else {
			if (!exactKeys(row, [
				"an",
				"dn",
				"dmg",
				"crit",
				"fs",
				"ex",
				"tb",
				"ls",
				"stp",
				"side",
				"hpA",
				"hpB"
			])) throw new TypeError("combat damage event is malformed");
			if (row.side !== "A" && row.side !== "B") throw new TypeError("combat damage side is malformed");
			const actorSide = row.side;
			const targetSide = actorSide === "A" ? "B" : "A";
			const actor = actorSide === "A" ? participants.champion : participants.defender;
			const target = targetSide === "A" ? participants.champion : participants.defender;
			if (row.an !== actor.combatName || row.dn !== target.combatName) throw new TypeError("combat damage names drifted from participants");
			const damage = finiteInteger(row.dmg, "combat damage", 1);
			const thorns = finiteInteger(row.tb, "combat thorns");
			const lifesteal = finiteInteger(row.ls, "combat lifesteal");
			if (typeof row.crit !== "boolean" || typeof row.fs !== "boolean" || typeof row.ex !== "boolean" || typeof row.stp !== "boolean") throw new TypeError("combat damage flags are malformed");
			const families = ["damage"];
			if (row.crit) families.push("critical");
			if (row.fs) families.push("first-strike");
			if (row.ex) families.push("execute");
			if (thorns > 0) families.push("thorns");
			if (lifesteal > 0) families.push("lifesteal");
			if (row.stp) families.push("stun-applied");
			if (defeated.length > 0) families.push("defeat");
			const targetMaxHp = target.maxHp;
			pushCue({
				stage: "transcript",
				transcriptIndex,
				families,
				actorSide,
				targetSide,
				defeatedSides: defeated,
				ability: actor.ability,
				bodyMaterial: target.bodyMaterial,
				impact: Object.freeze({
					damage,
					targetMaxHp,
					damageFraction: damage / targetMaxHp,
					critical: row.crit,
					abilityProc: row.fs || row.ex || row.stp
				})
			});
		}
		if (!guardianPhaseSeen && participants.guardian !== null && hpB > transcript.maxB * .5 && nextHpB <= transcript.maxB * .5) {
			guardianPhaseSeen = true;
			pushCue({
				stage: "transcript",
				transcriptIndex,
				families: ["guardian-phase"],
				actorSide: "B",
				ability: participants.defender.ability,
				bodyMaterial: participants.defender.bodyMaterial,
				guardianMotif: motifFact(participants.guardian, "phase")
			});
		}
		hpA = nextHpA;
		hpB = nextHpB;
	}
	if (hpA !== transcript.hpA || hpB !== transcript.hpB) throw new TypeError("combat transcript terminal HP is malformed");
	const winner = transcript.winner;
	pushCue({
		stage: "resolution",
		transcriptIndex: null,
		families: ["resolution"],
		actorSide: winner,
		defeatedSides: winner === "A" ? ["B"] : winner === "B" ? ["A"] : []
	});
	if (participants.guardian !== null && winner !== null) {
		const guardianWon = winner === "B";
		pushCue({
			stage: "resolution",
			transcriptIndex: null,
			families: [guardianWon ? "guardian-victory" : "guardian-defeat"],
			actorSide: "B",
			ability: participants.defender.ability,
			bodyMaterial: participants.defender.bodyMaterial,
			guardianMotif: motifFact(participants.guardian, guardianWon ? "victory" : "defeat")
		});
	}
	const frozenCues = Object.freeze(cues);
	const planId = `combat-plan:${digest(`${planSeed}|${JSON.stringify(frozenCues)}`)}`;
	const plan = Object.freeze({
		schema: COMBAT_CUE_PLAN_SCHEMA_V1,
		planId,
		battleId: result.battleId,
		transcriptFingerprint: result.transcriptFingerprint,
		participantSchema: COMBAT_CUE_PARTICIPANTS_SCHEMA_V1,
		skipPolicy: "legacy-silent",
		resultOnlySkipMotif: "unsupported-open-policy",
		cues: frozenCues
	});
	CUE_PLANS.add(plan);
	return plan;
}
//#endregion
//#region port/v2/packages/audio/src/finite-voice-lifetime.ts
/** Cleanup allowance after the already-authored final source stop. This does
* not alter an envelope, mix, cooldown, or source schedule; natural onended
* still owns ordinary completion. The deadline only bounds a lost callback. */
const SOURCE_COMPLETION_TAIL_MS = 250;
function finiteVoiceMaxDurationMs(scheduledSeconds) {
	return Math.ceil(scheduledSeconds * 1e3) + SOURCE_COMPLETION_TAIL_MS;
}
//#endregion
//#region port/v2/packages/audio/src/combat-gameplay-voice.ts
const COMBAT_FOREGROUND_MIX = createAudioVoiceMixIntentV1(Object.freeze({
	music: .75,
	ambience: .75,
	creature: 1,
	"combat-gameplay": 1,
	ui: 1
}));
const VOICE_PRIORITY = 80;
const CONCURRENCY_GROUP = "combat-gameplay-impact";
const MAX_CONCURRENT = 2;
function cuePriority(cue) {
	const motif = cue.guardianMotif?.motif;
	if (motif === "victory" || motif === "defeat") return 90;
	if (motif === "phase") return 88;
	if (motif === "entrance") return 86;
	if (cue.impact !== null) return VOICE_PRIORITY;
	const primary = cue.families[0];
	if (primary === "resolution") return 82;
	if (primary === "burn" || primary === "regen" || primary === "defeat") return 76;
	if (primary === "dodge" || primary === "stun-skipped") return 72;
	return 60;
}
function isRecord(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}
function hasExactKeys(value, expected) {
	try {
		const actual = Reflect.ownKeys(value);
		return Object.getPrototypeOf(value) === Object.prototype && actual.length === expected.length && actual.every((key) => typeof key === "string" && expected.includes(key));
	} catch {
		return false;
	}
}
function canonicalCue(plan, cue) {
	if (!isCombatCuePlanV1(plan)) throw new TypeError("registered combat cue plan is required");
	if (!isRecord(cue) || !plan.cues.includes(cue) || cue.families.length < 1) throw new TypeError("registered settled combat cue is required");
	return cue;
}
function canonicalCounterpart(value, cue) {
	const audible = cue.counterparts[0];
	if (audible === void 0 || audible.family !== cue.families[0] || !isRecord(value) || !hasExactKeys(value, [
		"counterpartKey",
		"eventKey",
		"generation"
	]) || value.counterpartKey !== audible.captionToken || value.eventKey !== cue.cueId || !Number.isSafeInteger(value.generation) || value.generation < 1) throw new TypeError("combat counterpart does not own this settled combat cue");
	return Object.freeze({
		counterpartKey: boundedAudioKey(value.counterpartKey, "combat counterpart", 192),
		eventKey: boundedAudioKey(value.eventKey, "combat event", 192),
		generation: value.generation
	});
}
function exponentialParam(value, label) {
	if (typeof value.exponentialRampToValueAtTime !== "function") throw new TypeError(`combat synthesis requires ${label} automation`);
	return value;
}
function synthesisContext(value) {
	const context = value;
	const sampleRate = context.sampleRate;
	if (typeof context.createOscillator !== "function" || typeof context.createBuffer !== "function" || typeof context.createBufferSource !== "function" || typeof context.createBiquadFilter !== "function" || !Number.isSafeInteger(sampleRate) || typeof sampleRate !== "number" || sampleRate < 8e3 || sampleRate > 384e3 || !Number.isFinite(value.currentTime) || value.currentTime < 0) throw new TypeError("combat synthesis requires an exact Web Audio context");
	return value;
}
function scheduledSource(raw, startTime, endTime) {
	let handler = null;
	let ended = false;
	let started = false;
	if (!raw || typeof raw.connect !== "function" || typeof raw.disconnect !== "function" || typeof raw.start !== "function" || typeof raw.stop !== "function" || raw.onended !== null) {
		try {
			raw?.disconnect();
		} catch {}
		throw new TypeError("combat synthesis source is invalid or already owned");
	}
	raw.onended = () => {
		if (ended) return;
		ended = true;
		handler?.();
	};
	return {
		get onended() {
			return handler;
		},
		set onended(value) {
			handler = value;
		},
		connect(destination) {
			return raw.connect(destination);
		},
		disconnect() {
			handler = null;
			raw.onended = null;
			raw.disconnect();
		},
		start(when) {
			if (started) throw new Error("combat synthesis source already started");
			started = true;
			raw.start(when ?? startTime);
			if (ended) return;
			try {
				raw.stop(endTime);
			} catch (error) {
				try {
					raw.stop();
				} catch {}
				throw error;
			}
		},
		stop(when) {
			if (!started || ended) return;
			raw.stop(when);
		}
	};
}
function hash32(text) {
	let value = 2166136261;
	for (let index = 0; index < text.length; index++) {
		value ^= text.charCodeAt(index);
		value = Math.imul(value, 16777619);
	}
	return value >>> 0;
}
function fillDeterministicCombatNoise(target, cueKey) {
	let state = hash32(cueKey) || 1831565813;
	const length = target.length;
	for (let index = 0; index < length; index++) {
		state ^= state << 13;
		state ^= state >>> 17;
		state ^= state << 5;
		const unit = (state >>> 0) / 4294967296;
		target[index] = (unit * 2 - 1) * (1 - index / length);
	}
}
function nodeCount(cue) {
	if (cue.impact !== null) return 6 + (cue.impact.critical ? 2 : 0) + (cue.impact.abilityProc ? 3 : 0);
	if (cue.guardianMotif !== null) return 7;
	const primary = cue.families[0];
	if (primary === "initiative" || primary === "stun-skipped" || primary === "defeat") return 3;
	if (primary === "dodge") return 4;
	if (primary === "resolution") return 5;
	if (primary === "burn" || primary === "regen") return 1 + (cue.families.includes("burn") ? 3 : 0) + (cue.families.includes("regen") ? 2 : 0) + (cue.families.includes("defeat") ? 2 : 0);
	throw new TypeError(`combat cue family ${String(primary)} has no authored synthesis`);
}
function createVoiceGraph(contextValue, reservation, cue) {
	const context = synthesisContext(contextValue);
	const impact = cue.impact;
	const nodes = [];
	const sources = [];
	try {
		const output = context.createGain();
		nodes.push(output);
		output.gain.value = 1;
		const impactEnvelope = context.createGain();
		nodes.push(impactEnvelope);
		const impactGain = exponentialParam(impactEnvelope.gain, "impact gain");
		impactEnvelope.connect(output);
		const startTime = context.currentTime + .01;
		const heavy = Math.max(.15, Math.min(1, impact.damageFraction || .3));
		impactGain.setValueAtTime(1e-4, startTime);
		impactGain.exponentialRampToValueAtTime(.16 + heavy * .3, startTime + .008);
		impactGain.exponentialRampToValueAtTime(1e-4, startTime + .1 + heavy * .22);
		const bodyRaw = context.createOscillator();
		if (!bodyRaw || typeof bodyRaw.frequency?.setValueAtTime !== "function") {
			try {
				bodyRaw?.disconnect();
			} catch {}
			throw new TypeError("combat body oscillator is invalid");
		}
		const bodyEnd = startTime + .12 + heavy * .22;
		const body = scheduledSource(bodyRaw, startTime, bodyEnd);
		nodes.push(body);
		sources.push(Object.freeze({
			source: body,
			endTime: bodyEnd
		}));
		bodyRaw.type = "triangle";
		bodyRaw.frequency.setValueAtTime(220 - heavy * 120, startTime);
		exponentialParam(bodyRaw.frequency, "body pitch").exponentialRampToValueAtTime(Math.max(40, 70 - heavy * 25), startTime + .09 + heavy * .14);
		body.connect(impactEnvelope);
		const sampleLength = Math.max(1, Math.floor(context.sampleRate * .07));
		const buffer = context.createBuffer(1, sampleLength, context.sampleRate);
		const channel = buffer.getChannelData(0);
		if (!(channel instanceof Float32Array) || channel.length !== sampleLength) throw new TypeError("combat impact buffer is invalid");
		fillDeterministicCombatNoise(channel, cue.cueId);
		const noiseRaw = context.createBufferSource();
		if (!noiseRaw) throw new TypeError("combat impact source is invalid");
		noiseRaw.buffer = buffer;
		const noiseEnd = startTime + .08;
		const noise = scheduledSource(noiseRaw, startTime, noiseEnd);
		nodes.push(noise);
		sources.push(Object.freeze({
			source: noise,
			endTime: noiseEnd
		}));
		const impactBand = context.createBiquadFilter();
		nodes.push(impactBand);
		impactBand.type = "bandpass";
		impactBand.frequency.value = impact.critical ? 2600 : 900 + heavy * 700;
		impactBand.Q.value = impact.critical ? 2.2 : 1.1;
		const noiseGain = context.createGain();
		nodes.push(noiseGain);
		noiseGain.gain.value = impact.critical ? .5 : .28;
		noise.connect(impactBand);
		impactBand.connect(noiseGain);
		noiseGain.connect(impactEnvelope);
		if (impact.critical) {
			const criticalRaw = context.createOscillator();
			if (!criticalRaw || typeof criticalRaw.frequency?.setValueAtTime !== "function") {
				try {
					criticalRaw?.disconnect();
				} catch {}
				throw new TypeError("combat critical oscillator is invalid");
			}
			const criticalEnd = startTime + .22;
			const critical = scheduledSource(criticalRaw, startTime, criticalEnd);
			nodes.push(critical);
			sources.push(Object.freeze({
				source: critical,
				endTime: criticalEnd
			}));
			criticalRaw.type = "sine";
			criticalRaw.frequency.setValueAtTime(1760, startTime);
			exponentialParam(criticalRaw.frequency, "critical pitch").exponentialRampToValueAtTime(2640, startTime + .14);
			const criticalGainNode = context.createGain();
			nodes.push(criticalGainNode);
			const criticalGain = exponentialParam(criticalGainNode.gain, "critical gain");
			criticalGain.setValueAtTime(1e-4, startTime);
			criticalGain.exponentialRampToValueAtTime(.14, startTime + .02);
			criticalGain.exponentialRampToValueAtTime(1e-4, startTime + .2);
			critical.connect(criticalGainNode);
			criticalGainNode.connect(output);
		}
		if (impact.abilityProc) {
			const abilityRaw = context.createOscillator();
			if (!abilityRaw || typeof abilityRaw.frequency?.setValueAtTime !== "function") {
				try {
					abilityRaw?.disconnect();
				} catch {}
				throw new TypeError("combat ability oscillator is invalid");
			}
			const abilityStart = startTime + .02;
			const abilityEnd = startTime + .24;
			const ability = scheduledSource(abilityRaw, abilityStart, abilityEnd);
			nodes.push(ability);
			sources.push(Object.freeze({
				source: ability,
				endTime: abilityEnd
			}));
			abilityRaw.type = "sawtooth";
			abilityRaw.frequency.setValueAtTime(330, abilityStart);
			exponentialParam(abilityRaw.frequency, "ability pitch").exponentialRampToValueAtTime(880, startTime + .16);
			const abilityBand = context.createBiquadFilter();
			nodes.push(abilityBand);
			abilityBand.type = "bandpass";
			abilityBand.frequency.value = 1200;
			abilityBand.Q.value = 4;
			const abilityGainNode = context.createGain();
			nodes.push(abilityGainNode);
			const abilityGain = exponentialParam(abilityGainNode.gain, "ability gain");
			abilityGain.setValueAtTime(1e-4, abilityStart);
			abilityGain.exponentialRampToValueAtTime(.08, startTime + .05);
			abilityGain.exponentialRampToValueAtTime(1e-4, startTime + .22);
			ability.connect(abilityBand);
			abilityBand.connect(abilityGainNode);
			abilityGainNode.connect(output);
		}
		if (nodes.length !== reservation.graphNodes || nodes.length !== nodeCount(cue)) throw new TypeError("combat graph reservation does not match its exact cue");
		const completion = sources.reduce((latest, candidate) => candidate.endTime > latest.endTime ? candidate : latest);
		return Object.freeze({
			source: completion.source,
			sources: Object.freeze(sources.map((row) => row.source)),
			output,
			nodes: Object.freeze(nodes),
			reservation
		});
	} catch (error) {
		for (let index = nodes.length - 1; index >= 0; index--) try {
			nodes[index].disconnect();
		} catch {}
		throw error;
	}
}
function createNonImpactVoiceGraph(contextValue, reservation, cue) {
	const context = synthesisContext(contextValue);
	const nodes = [];
	const sources = [];
	try {
		const output = context.createGain();
		nodes.push(output);
		output.gain.value = 1;
		const baseTime = context.currentTime + .01;
		const addTone = (profile) => {
			const raw = context.createOscillator();
			if (!raw || typeof raw.frequency?.setValueAtTime !== "function") {
				try {
					raw?.disconnect();
				} catch {}
				throw new TypeError(`combat ${profile.label} oscillator is invalid`);
			}
			const start = baseTime + profile.startOffset;
			const end = start + profile.duration;
			const source = scheduledSource(raw, start, end);
			nodes.push(source);
			sources.push(Object.freeze({
				source,
				endTime: end
			}));
			raw.type = profile.waveform;
			raw.frequency.setValueAtTime(profile.startHz, start);
			exponentialParam(raw.frequency, `${profile.label} pitch`).exponentialRampToValueAtTime(profile.endHz, end - .01);
			const gainNode = context.createGain();
			nodes.push(gainNode);
			const gain = exponentialParam(gainNode.gain, `${profile.label} gain`);
			gain.setValueAtTime(1e-4, start);
			gain.exponentialRampToValueAtTime(profile.peak, start + Math.min(.018, profile.duration / 3));
			gain.exponentialRampToValueAtTime(1e-4, end - .005);
			source.connect(gainNode);
			gainNode.connect(output);
		};
		const addNoise = (input) => {
			const sampleLength = Math.max(1, Math.floor(context.sampleRate * input.duration));
			const buffer = context.createBuffer(1, sampleLength, context.sampleRate);
			const channel = buffer.getChannelData(0);
			if (!(channel instanceof Float32Array) || channel.length !== sampleLength) throw new TypeError(`combat ${input.label} buffer is invalid`);
			fillDeterministicCombatNoise(channel, `${cue.cueId}:${input.label}`);
			const raw = context.createBufferSource();
			if (!raw) throw new TypeError(`combat ${input.label} source is invalid`);
			raw.buffer = buffer;
			const end = baseTime + input.duration;
			const source = scheduledSource(raw, baseTime, end);
			nodes.push(source);
			sources.push(Object.freeze({
				source,
				endTime: end
			}));
			const band = context.createBiquadFilter();
			nodes.push(band);
			band.type = "bandpass";
			band.frequency.value = input.frequency;
			band.Q.value = input.q;
			const gainNode = context.createGain();
			nodes.push(gainNode);
			const gain = exponentialParam(gainNode.gain, `${input.label} gain`);
			gain.setValueAtTime(1e-4, baseTime);
			gain.exponentialRampToValueAtTime(input.peak, baseTime + .012);
			gain.exponentialRampToValueAtTime(1e-4, end - .005);
			source.connect(band);
			band.connect(gainNode);
			gainNode.connect(output);
		};
		if (cue.guardianMotif !== null) {
			const fact = cue.guardianMotif;
			const root = 42 + hash32(`${fact.kind}:${fact.abilityTheme}:${fact.signatureId ?? fact.epithet}`) % 29 + Math.min(28, fact.tier * 2);
			const contour = fact.motif === "entrance" ? .72 : fact.motif === "phase" ? 1.48 : fact.motif === "victory" ? 1.82 : .54;
			const duration = fact.motif === "entrance" ? .72 : .54;
			addTone({
				waveform: "triangle",
				startHz: root,
				endHz: Math.max(28, root * contour),
				startOffset: 0,
				duration,
				peak: .18,
				label: "guardian-root"
			});
			addTone({
				waveform: fact.kind === "titan" ? "sawtooth" : "square",
				startHz: root * 1.5,
				endHz: Math.max(36, root * 1.5 * contour),
				startOffset: .025,
				duration: duration * .82,
				peak: .075,
				label: "guardian-overtone"
			});
			addTone({
				waveform: "sine",
				startHz: root * 3,
				endHz: Math.max(52, root * 3 * contour),
				startOffset: .06,
				duration: duration * .62,
				peak: .05,
				label: "guardian-sigil"
			});
		} else {
			const primary = cue.families[0];
			if (primary === "initiative") {
				const sideLift = cue.actorSide === "A" ? 1 : 1.18;
				addTone({
					waveform: "triangle",
					startHz: 420 * sideLift,
					endHz: 840 * sideLift,
					startOffset: 0,
					duration: .16,
					peak: .11,
					label: "initiative"
				});
			} else if (primary === "dodge") addNoise({
				label: "dodge",
				duration: .12,
				frequency: 2200,
				q: 1.8,
				peak: .12
			});
			else if (primary === "stun-skipped") addTone({
				waveform: "square",
				startHz: 310,
				endHz: 92,
				startOffset: 0,
				duration: .2,
				peak: .08,
				label: "stun-skipped"
			});
			else if (primary === "burn" || primary === "regen") {
				if (cue.families.includes("burn")) addNoise({
					label: "burn",
					duration: .2,
					frequency: 1450,
					q: 2.6,
					peak: .1
				});
				if (cue.families.includes("regen")) addTone({
					waveform: "sine",
					startHz: 260,
					endHz: 720,
					startOffset: .02,
					duration: .24,
					peak: .085,
					label: "regen"
				});
				if (cue.families.includes("defeat")) addTone({
					waveform: "triangle",
					startHz: 150,
					endHz: 42,
					startOffset: .01,
					duration: .34,
					peak: .13,
					label: "tick-defeat"
				});
			} else if (primary === "defeat") addTone({
				waveform: "triangle",
				startHz: 150,
				endHz: 42,
				startOffset: 0,
				duration: .34,
				peak: .13,
				label: "defeat"
			});
			else if (primary === "resolution") {
				const victory = cue.actorSide !== null;
				addTone({
					waveform: "triangle",
					startHz: victory ? 330 : 260,
					endHz: victory ? 660 : 260,
					startOffset: 0,
					duration: .28,
					peak: .1,
					label: "resolution-root"
				});
				addTone({
					waveform: "sine",
					startHz: victory ? 495 : 390,
					endHz: victory ? 990 : 390,
					startOffset: .055,
					duration: .32,
					peak: .075,
					label: "resolution-crown"
				});
			} else throw new TypeError(`combat cue family ${String(primary)} has no authored synthesis`);
		}
		if (sources.length < 1 || nodes.length !== reservation.graphNodes || nodes.length !== nodeCount(cue)) throw new TypeError("combat graph reservation does not match its exact cue");
		const completion = sources.reduce((latest, candidate) => candidate.endTime > latest.endTime ? candidate : latest);
		return Object.freeze({
			source: completion.source,
			sources: Object.freeze(sources.map((row) => row.source)),
			output,
			nodes: Object.freeze(nodes),
			reservation
		});
	} catch (error) {
		for (let index = nodes.length - 1; index >= 0; index--) try {
			nodes[index].disconnect();
		} catch {}
		throw error;
	}
}
/** The final scheduled source for each existing composite envelope. These
* bounds include the graph's 10 ms start offset, not a new audible tail. */
function voiceDurationSeconds(cue) {
	if (cue.impact !== null) {
		const heavy = Math.max(.15, Math.min(1, cue.impact.damageFraction || .3));
		return .01 + Math.max(.12 + heavy * .22, .08, cue.impact.critical ? .22 : 0, cue.impact.abilityProc ? .24 : 0);
	}
	if (cue.guardianMotif !== null) {
		const duration = cue.guardianMotif.motif === "entrance" ? .72 : .54;
		return .01 + Math.max(duration, .025 + duration * .82, .06 + duration * .62);
	}
	const primary = cue.families[0];
	if (primary === "initiative") return .17;
	if (primary === "dodge") return .13;
	if (primary === "stun-skipped") return .01 + .2;
	if (primary === "burn" || primary === "regen") return .01 + Math.max(cue.families.includes("burn") ? .2 : 0, cue.families.includes("regen") ? .26 : 0, cue.families.includes("defeat") ? .01 + .34 : 0);
	if (primary === "defeat") return .01 + .34;
	if (primary === "resolution") return .01 + Math.max(.28, .375);
	throw new TypeError(`combat cue family ${String(primary)} has no authored synthesis`);
}
/** Render one registered cue through its stable first-family counterpart.
* Multi-family rows (for example burn+regen+defeat or a critical ability
* strike) remain one composite voice, preventing duplicate semantics. */
function createCombatGameplayVoiceRequest(input) {
	if (!isRecord(input) || !hasExactKeys(input, [
		"plan",
		"cue",
		"counterpart"
	])) throw new TypeError("combat gameplay voice request input is invalid");
	const cue = canonicalCue(input.plan, input.cue);
	const counterpart = canonicalCounterpart(input.counterpart, cue);
	return Object.freeze({
		key: `combat-gameplay:${cue.cueId}`,
		category: "combat-gameplay",
		priority: cuePriority(cue),
		cooldownGroup: `combat-gameplay:${cue.cueId}`,
		cooldownMs: 0,
		concurrencyGroup: CONCURRENCY_GROUP,
		maxConcurrent: MAX_CONCURRENT,
		nodeCount: nodeCount(cue),
		maxDurationMs: finiteVoiceMaxDurationMs(voiceDurationSeconds(cue)),
		mixIntent: COMBAT_FOREGROUND_MIX,
		meaning: Object.freeze({
			kind: "meaningful",
			counterpart
		}),
		create: (context, reservation) => cue.impact === null ? createNonImpactVoiceGraph(context, reservation, cue) : createVoiceGraph(context, reservation, cue)
	});
}
//#endregion
//#region port/v2/tools/audio-native-mix/entry.ts
const RATE = 48e3;
const LENGTH = 19200;
const LEVEL = .02;
function requireValue(condition, message) {
	if (!condition) throw Error(message);
}
function fixture() {
	installCaptureHooks();
	const world = resolveCF1WorldAddress({
		galaxy: {
			seed: 1594395733,
			x: -5501.81,
			y: -11753.64
		},
		star: {
			seed: 4077594722,
			x: -271.54,
			y: -67.36
		},
		planet: { seed: 488332735 }
	});
	requireValue(world.ok, "Fixed native audio world must resolve");
	const encounter = projectGuardianPrimeEncounterV1({
		world: world.address,
		descriptor: { worldType: "airless" },
		regionIndex: 0,
		faunaRoster: [{
			speciesId: "audio-impact-defender",
			genome: makeGenome(999, "fauna", .5)
		}],
		claimedSignatureIds: [],
		conquered: false
	});
	requireValue(encounter, "Fixed native audio encounter must exist");
	const genome = makeGenome(1, "fauna", .5);
	const champion = {
		kind: "owned-fauna",
		creatureId: "native-mix-champion-1",
		name: "Native Mix Champion",
		genome,
		legacyBredLineage: true
	};
	const transcript = runDuel({
		name: champion.name,
		genome
	}, {
		name: encounter.defender.name,
		genome: encounter.defender.battleGenome
	});
	const winner = transcript.winner;
	const settled = planCombatSettlementV1({
		battleId: "native-mix-fixed-duel-1",
		receiptOrdinal: 41,
		encounter,
		champion,
		transcript,
		outcome: winner === "A" ? "champion-win" : winner === "B" ? "defender-win" : "draw",
		worldTier: 4,
		authority: {
			worldConquered: false,
			claimedPrimeSignatureIds: [],
			lossXp: {
				kind: "known-target",
				awardedTarget: 0
			}
		}
	});
	requireValue(settled.status === "planned", "Fixed native audio duel must produce registered settlement");
	const plan = combatCuePlan(settled, projectCombatCueParticipantsV1(settled));
	const cues = plan.cues.slice(0, 2);
	requireValue(cues.length === 2, "Two registered cues required");
	const counterparts = cues.map((cue) => ({
		counterpartKey: cue.counterparts[0].captionToken,
		eventKey: cue.cueId,
		generation: 1
	}));
	document.getElementById("captions").textContent = cues.map((cue) => cue.counterparts[0].captionToken).join("\n");
	return {
		plan,
		cues,
		counterparts
	};
}
function encode(samples) {
	const bytes = new Uint8Array(samples.buffer, samples.byteOffset, samples.byteLength);
	let text = "";
	for (let index = 0; index < bytes.length; index += 8192) text += String.fromCharCode(...bytes.subarray(index, index + 8192));
	return btoa(text);
}
async function observe(kind, fault) {
	const canonical = fixture();
	const offline = new OfflineAudioContext(3, LENGTH, RATE);
	const records = [], runtimeGains = [];
	const automation = [];
	const own = (node, owner, label) => {
		const row = {
			node,
			owner,
			kind: label,
			disconnects: 0,
			edges: /* @__PURE__ */ new Set()
		};
		records.push(row);
		const connect = node.connect, disconnect = node.disconnect;
		Object.defineProperty(node, "connect", {
			configurable: true,
			value: (...args) => {
				const result = Reflect.apply(connect, node, args);
				row.edges.add(args[0]);
				return result;
			}
		});
		Object.defineProperty(node, "disconnect", {
			configurable: true,
			value: (...args) => {
				const result = Reflect.apply(disconnect, node, args);
				row.disconnects++;
				if (!args.length) row.edges.clear();
				return result;
			}
		});
		return node;
	};
	const merger = own(offline.createChannelMerger(3), "observer", "channel-merger");
	const fullMix = own(offline.createGain(), "observer", "full-mix-tap");
	merger.connect(offline.destination);
	fullMix.connect(merger, 0, 2);
	let logicalState = "running", closeCalls = 0;
	const adapter = {
		get currentTime() {
			return offline.currentTime;
		},
		get sampleRate() {
			return offline.sampleRate;
		},
		get state() {
			return logicalState;
		},
		destination: fullMix,
		createGain: () => {
			const node = own(offline.createGain(), "runtime", "gain");
			runtimeGains.push(node);
			return node;
		},
		createAnalyser: () => own(offline.createAnalyser(), "runtime", "analyser"),
		createDynamicsCompressor: () => own(offline.createDynamicsCompressor(), "runtime", "limiter"),
		createOscillator: () => own(offline.createOscillator(), "runtime", "oscillator"),
		createBufferSource: () => own(offline.createBufferSource(), "runtime", "buffer-source"),
		createBiquadFilter: () => own(offline.createBiquadFilter(), "runtime", "filter"),
		createBuffer: (channels, frames, rate) => offline.createBuffer(channels, frames, rate),
		resume: async () => {},
		close: async () => {
			closeCalls++;
			logicalState = "closed";
		}
	};
	const verifyCounterpart = (receipt) => canonical.counterparts.some((row) => row.counterpartKey === receipt.counterpartKey && row.eventKey === receipt.eventKey && row.generation === receipt.generation);
	const runtime = createAudioRuntime({
		createContext: () => adapter,
		nowMs: () => offline.currentTime * 1e3,
		categoryGains: {
			music: .8,
			ambience: .6
		},
		verifyCounterpart,
		scheduleVoiceDeadline: () => () => {}
	});
	const marks = [], voices = [];
	let rendered = null;
	let rendering = null;
	let peakNodes = 0;
	const mark = (action) => {
		const state = runtime.diagnostics();
		peakNodes = Math.max(peakNodes, state.nodes.peak);
		marks.push({
			action,
			time: offline.currentTime,
			ownerCount: state.voiceMix.activeOwners,
			musicBase: state.gains.categories.music,
			ambienceBase: state.gains.categories.ambience
		});
	};
	try {
		requireValue((await runtime.activate()).kind === "running", "Production runtime must activate in audit scheduling adapter");
		requireValue(runtimeGains.length === 6, "Source-bound master + five category bus inventory changed");
		const music = runtimeGains[1], ambience = runtimeGains[2];
		music.connect(merger, 0, 0);
		ambience.connect(merger, 0, 1);
		for (const [label, node] of [["music", music], ["ambience", ambience]]) for (const method of [
			"setValueAtTime",
			"cancelScheduledValues",
			"linearRampToValueAtTime"
		]) {
			const original = node.gain[method];
			Object.defineProperty(node.gain, method, {
				configurable: true,
				value: (...args) => {
					automation.push({
						bus: label,
						method,
						args: [...args]
					});
					if (fault === "immediate" && method === "linearRampToValueAtTime") return node.gain.setValueAtTime(args[0], offline.currentTime);
					return Reflect.apply(original, node.gain, args);
				}
			});
		}
		for (const category of ["music", "ambience"]) {
			const request = {
				key: `calibration-${category}`,
				category,
				priority: 1,
				cooldownGroup: `calibration-${category}`,
				cooldownMs: 0,
				concurrencyGroup: `calibration-${category}`,
				maxConcurrent: 1,
				nodeCount: 1,
				mixIntent: AUDIO_NEUTRAL_VOICE_MIX_INTENT_V1,
				meaning: { kind: "decorative" },
				create: (_context, reservation) => {
					const source = own(offline.createConstantSource(), "runtime", "calibration-source");
					source.offset.value = LEVEL;
					return {
						source,
						sources: [source],
						output: source,
						nodes: [source],
						reservation
					};
				}
			};
			requireValue(runtime.playVoice(request).kind === "started", "Native calibration voice must start through production runtime");
		}
		const start = (index) => {
			const request = createCombatGameplayVoiceRequest({
				plan: canonical.plan,
				cue: canonical.cues[index],
				counterpart: canonical.counterparts[index]
			});
			const result = runtime.playVoice(fault === "neutral" ? {
				...request,
				mixIntent: AUDIO_NEUTRAL_VOICE_MIX_INTENT_V1
			} : request);
			requireValue(result.kind === "started", "Canonical combat cue must start");
			voices[index] = result.voiceId;
		};
		const stop = (index) => requireValue(runtime.stopVoice(voices[index]), "Exact combat owner must still be live at explicit stop");
		const steps = kind === "overlap" ? [
			{
				at: .04,
				action: "first",
				run: () => start(0)
			},
			{
				at: .055,
				action: "second",
				run: () => start(1)
			},
			{
				at: .08,
				action: "stop-first",
				run: () => {
					stop(0);
					if (fault === "early-restore") {
						music.gain.cancelScheduledValues(offline.currentTime);
						music.gain.setValueAtTime(.8, offline.currentTime);
						ambience.gain.cancelScheduledValues(offline.currentTime);
						ambience.gain.setValueAtTime(.6, offline.currentTime);
					}
				}
			},
			{
				at: .11,
				action: "stop-last",
				run: () => stop(1)
			}
		] : [
			{
				at: .04,
				action: "first",
				run: () => start(0)
			},
			{
				at: .075,
				action: "stop-first",
				run: () => stop(0)
			},
			{
				at: .1,
				action: "second",
				run: () => start(1)
			},
			{
				at: .145,
				action: "saved-volume",
				run: () => runtime.setCategoryGain("music", .4)
			},
			{
				at: .18,
				action: "zero",
				run: () => runtime.setCategoryGain("music", 0)
			},
			{
				at: .21,
				action: "stop-last",
				run: () => stop(1)
			}
		];
		const pauses = steps.map((step) => offline.suspend(step.at));
		const shutdown = offline.suspend(.33);
		mark("baseline");
		rendering = offline.startRendering();
		for (const [index, step] of steps.entries()) {
			await pauses[index];
			step.run();
			mark(step.action);
			await offline.resume();
		}
		await shutdown;
		mark("before-dispose");
		await runtime.dispose();
		mark("disposed");
		for (const row of records.filter((row) => row.owner === "observer")) row.node.disconnect();
		await offline.resume();
		rendered = await rendering;
		const state = runtime.diagnostics();
		const cleanup = {
			voices: state.voices.active,
			mixOwners: state.voiceMix.activeOwners,
			nodes: state.nodes.active,
			faults: state.faults.total,
			peakRuntimeNodes: peakNodes,
			runtimeNodeCount: records.filter((row) => row.owner === "runtime").length,
			observerNodeCount: records.filter((row) => row.owner === "observer").length,
			connectedNodes: records.filter((row) => row.edges.size > 0).length,
			undisconnectedNodes: records.filter((row) => row.disconnects < 1).map((row) => row.kind),
			closeCalls,
			logicalState,
			sourceHandlers: records.filter((row) => row.node instanceof AudioScheduledSourceNode && row.node.onended !== null).length
		};
		return {
			kind,
			fault,
			marks,
			rate: RATE,
			frames: LENGTH,
			channels: [
				0,
				1,
				2
			].map((channel) => rendered.getChannelData(channel).slice()),
			cleanup,
			identity: {
				planId: canonical.plan.planId,
				cueIds: canonical.cues.map((cue) => cue.cueId),
				seed: 1,
				reference: "fixed registered duel fixture; no species or world mutation"
			},
			automation
		};
	} finally {
		await runtime.dispose();
		for (const row of records) if (row.edges.size) try {
			row.node.disconnect();
		} catch {}
		if (rendering && !rendered && offline.state === "suspended") try {
			await offline.resume();
		} catch {}
	}
}
/** Independent expected envelope from observed operation times. No production
* transition state, automation log or fault tag is read by this acceptor. */
function acceptWaveform(row) {
	requireValue(row.rate === RATE && row.frames === LENGTH && row.channels.length === 3, "Exact native PCM shape");
	const errors = [], checks = {};
	const time = (name) => {
		const mark = row.marks.find((mark) => mark.action === name);
		requireValue(mark, `Missing ${name}`);
		return mark.time;
	};
	const first = time("first"), second = time("second"), last = time("stop-last"), stopFirst = time("stop-first");
	const sample = (channel, at) => row.channels[channel][Math.round(at * RATE)] / LEVEL;
	const near = (name, actual, expected, tolerance = .0015) => {
		checks[name] = actual;
		if (!Number.isFinite(actual) || Math.abs(actual - expected) > tolerance) errors.push(`${name}: ${actual}, expected ${expected}`);
	};
	for (const [channel, base] of [[0, .8], [1, .6]]) {
		near(`${channel}:baseline`, sample(channel, first - .01), base);
		for (let fraction = .1; fraction < 1; fraction += .1) near(`${channel}:attack-${fraction.toFixed(1)}`, sample(channel, first + .025 * fraction), base * (1 - .25 * fraction));
		if (row.kind === "overlap") {
			near(`${channel}:overlap`, sample(channel, stopFirst + (last - stopFirst) / 2), base * .75);
			near(`${channel}:not-restarted`, sample(channel, first + .027), base * .75);
			for (let fraction = .1; fraction < 1; fraction += .1) near(`${channel}:release-${fraction.toFixed(1)}`, sample(channel, last + .09 * fraction), base * (.75 + .25 * fraction));
			near(`${channel}:restored`, sample(channel, last + .095), base);
		} else {
			const fractionRecovered = (second - stopFirst) / .09;
			const held = base * (.75 + .25 * fractionRecovered);
			near(`${channel}:recovery-interior`, sample(channel, (stopFirst + second) / 2), base * (.75 + .125 * fractionRecovered));
			near(`${channel}:reverse-held`, sample(channel, second), held);
			near(`${channel}:reverse-interior`, sample(channel, second + .0125), (held + base * .75) / 2);
			if (channel === 0) {
				const saved = time("saved-volume"), zero = time("zero");
				near("music:saved-down", sample(channel, saved + .0125), .45);
				near("music:saved-target", sample(channel, saved + .028), .3);
				near("music:immediate-zero", sample(channel, zero + 1 / RATE), 0, 1e-6);
				let peak = 0;
				for (let frame = Math.ceil((zero + 1 / RATE) * RATE); frame < Math.floor(.32 * RATE); frame++) peak = Math.max(peak, Math.abs(row.channels[0][frame]));
				near("music:zero-tail", peak, 0, 1e-7);
			} else near("ambience:restored", sample(channel, last + .095), .6);
		}
	}
	const expectedOwners = row.kind === "overlap" ? [
		2,
		3,
		4,
		3,
		2,
		2,
		0
	] : [
		2,
		3,
		2,
		3,
		3,
		3,
		2,
		2,
		0
	];
	if (JSON.stringify(row.marks.map((mark) => mark.ownerCount)) !== JSON.stringify(expectedOwners)) errors.push("Ownership timeline drift");
	if (!row.channels.every((channel) => channel.every(Number.isFinite))) errors.push("Nonfinite PCM");
	if (!row.channels[2].some((value) => Math.abs(value) > 1e-4)) errors.push("Full mix is empty");
	const cleanup = row.cleanup;
	if (cleanup.voices !== 0 || cleanup.mixOwners !== 0 || cleanup.nodes !== 0 || cleanup.faults !== 0 || cleanup.connectedNodes !== 0 || cleanup.sourceHandlers !== 0 || cleanup.closeCalls !== 1 || cleanup.logicalState !== "closed" || JSON.stringify(cleanup.undisconnectedNodes) !== "[]" || cleanup.observerNodeCount !== 2) errors.push("Native node/adapter cleanup incomplete");
	return {
		accepted: errors.length === 0,
		checks,
		errors
	};
}
const state = {
	status: "READY",
	cases: [],
	error: null
};
let running = false;
async function run() {
	requireValue(!running && state.status === "READY", "Native proof runs once per page");
	running = true;
	state.status = "RUNNING";
	try {
		requireValue(new Uint8Array(new Uint32Array([1]).buffer)[0] === 1, "f32le artifact requires little-endian browser");
		for (const [kind, fault] of [
			["overlap", "none"],
			["interruption", "none"],
			["overlap", "neutral"],
			["overlap", "immediate"],
			["overlap", "early-restore"],
			["overlap", "none"]
		]) {
			const observation = await observe(kind, fault), verdict = acceptWaveform(observation);
			const { channels, ...metadata } = observation;
			state.cases.push({
				...metadata,
				verdict,
				pcm: channels.map(encode),
				pcmLayout: "three planar f32le channels: music tap, ambience tap, full mix"
			});
			requireValue(fault === "none" ? verdict.accepted : !verdict.accepted, `Unexpected ${kind}/${fault} waveform verdict: ${verdict.errors.join("; ")}`);
		}
		state.status = "PASS";
	} catch (error) {
		state.status = "FAIL";
		state.error = String(error instanceof Error ? error.stack : error);
		throw error;
	} finally {
		running = false;
		document.getElementById("status").textContent = `${state.status}: native waveform proof; human listening remains open`;
	}
	return state;
}
Object.assign(window, { cfNativeAudioMix: {
	run,
	state
} });
document.getElementById("run").onclick = () => {
	run().catch(() => {});
};
//#endregion

//# sourceMappingURL=bundle.js.map