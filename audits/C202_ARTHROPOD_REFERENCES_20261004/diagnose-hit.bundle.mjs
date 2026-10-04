import fs from "node:fs";
import assert from "node:assert/strict";
//#region \0rolldown/runtime.js
var __esmMin = (fn, res, err) => () => {
	if (err) throw err[0];
	try {
		return fn && (res = fn(fn = 0)), res;
	} catch (e) {
		throw err = [e], e;
	}
};
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
//#endregion
//#region port/v2/tools/creature-animation/specialized-templates.mjs
function build$1(id, axis, graph, roles, gaits, { anchored = false, legs = [], rigid = [], optional = {} } = {}) {
	const joints = ["root", ...graph.map(([j]) => j)];
	if (new Set(joints).size !== joints.length || joints.length > 64) throw Error("Specialized template inventory " + id);
	const seen = /* @__PURE__ */ new Set(["root"]);
	for (const [j, p] of graph) {
		if (!seen.has(p)) throw Error("parent order " + id + "/" + j);
		seen.add(j);
	}
	return freeze$2({
		id,
		version: 1,
		clipSetId: id + "-v1",
		graph,
		joints,
		legs,
		bodyAxis: axis,
		roles,
		gaits,
		anchored,
		rigid,
		optional,
		limitsDeg: Object.fromEntries(joints.map((j) => [j, {
			min: rigid.includes(j) ? 0 : j === "root" ? -12 : -35,
			max: rigid.includes(j) ? 0 : j === "root" ? 12 : 35
		}])),
		bounds: [
			{
				id: "body",
				min: .04,
				max: .9,
				kind: "distance",
				axis
			},
			{
				id: "bone-min",
				min: .001,
				max: .8,
				kind: "bone-min"
			},
			{
				id: "bone-max",
				min: .001,
				max: .8,
				kind: "bone-max"
			}
		],
		secondaryChains: []
	});
}
function specializedTemplate(id) {
	return SPECIALIZED_TEMPLATES[id] ?? null;
}
var chain$1, seq$1, leg, freeze$2, legIds, crustLegs, smallLegs, loboLegs, horseLegs, shellGraph, gastropodGraph, wormGraph, crustGraph, smallGraph, loboGraph, horseGraph, crabGraph, SPECIALIZED_TEMPLATES;
var init_specialized_templates = __esmMin((() => {
	chain$1 = (parent, names) => names.map((j, i) => [j, i ? names[i - 1] : parent]);
	seq$1 = (prefix, n, parent) => chain$1(parent, Array.from({ length: n }, (_, i) => prefix + i));
	leg = (parent, id) => chain$1(parent, [
		id + "Root",
		id + "Knee",
		id + "Foot"
	]);
	freeze$2 = (x) => {
		if (x && typeof x === "object") {
			Object.values(x).forEach(freeze$2);
			Object.freeze(x);
		}
		return x;
	};
	legIds = (n) => Array.from({ length: n }, (_, i) => ["leg" + i + "Far", "leg" + i + "Near"]).flat();
	crustLegs = legIds(4);
	smallLegs = legIds(5);
	loboLegs = legIds(4);
	horseLegs = legIds(5);
	shellGraph = [
		["hinge", "root"],
		["valveFar", "hinge"],
		["valveNear", "hinge"],
		["mantle", "hinge"],
		["siphon", "mantle"],
		["foot", "mantle"]
	];
	gastropodGraph = [
		...seq$1("foot", 4, "root"),
		["head", "foot3"],
		["mouth", "head"],
		["eyeFar", "head"],
		["eyeNear", "head"],
		["shell", "foot1"]
	];
	wormGraph = seq$1("segment", 12, "root");
	crustGraph = [
		["thorax", "root"],
		["head", "thorax"],
		...seq$1("abdomen", 4, "thorax"),
		["tailFan", "abdomen3"],
		...crustLegs.flatMap((id) => leg("thorax", id)),
		...["Far", "Near"].flatMap((s) => [
			...chain$1("head", [
				"claw" + s + "Base",
				"claw" + s + "Palm",
				"claw" + s + "Finger"
			]),
			...chain$1("head", ["antenna" + s + "Base", "antenna" + s + "Tip"]),
			["eye" + s, "head"]
		])
	];
	smallGraph = [
		["thorax", "root"],
		["head", "thorax"],
		...seq$1("abdomen", 6, "thorax"),
		["tailFan", "abdomen5"],
		...smallLegs.flatMap((id) => leg("thorax", id)),
		...["Far", "Near"].flatMap((s) => chain$1("head", ["antenna" + s + "Base", "antenna" + s + "Tip"]))
	];
	loboGraph = [
		...seq$1("segment", 4, "root"),
		["head", "segment0"],
		["mouth", "head"],
		...loboLegs.flatMap((id, i) => leg("segment" + Math.floor(i / 2), id))
	];
	horseGraph = [
		["prosoma", "root"],
		["head", "prosoma"],
		["opisthosoma", "prosoma"],
		["telson", "opisthosoma"],
		...horseLegs.flatMap((id) => leg("prosoma", id))
	];
	crabGraph = [
		["carapace", "root"],
		...crustLegs.flatMap((id) => leg("carapace", id)),
		...["Far", "Near"].flatMap((side) => [
			...chain$1("carapace", ["eye" + side + "Root", "eye" + side + "Tip"]),
			...chain$1("carapace", [
				"claw" + side + "Base",
				"claw" + side + "Elbow",
				"claw" + side + "Palm"
			]),
			...chain$1("claw" + side + "Palm", ["claw" + side + "FixedRoot", "claw" + side + "FixedTip"]),
			...chain$1("claw" + side + "Palm", ["claw" + side + "DactylRoot", "claw" + side + "DactylTip"])
		])
	];
	SPECIALIZED_TEMPLATES = freeze$2({
		brachyuran: build$1("brachyuran", ["root", "carapace"], crabGraph, {
			legs: crustLegs.flatMap((id) => [
				id + "Root",
				id + "Knee",
				id + "Foot"
			]),
			claws: ["clawFarDactylRoot", "clawNearDactylRoot"],
			reach: [
				"clawFarBase",
				"clawFarElbow",
				"clawNearBase",
				"clawNearElbow"
			],
			sensors: ["eyeFarRoot", "eyeNearRoot"]
		}, ["scuttle"], {
			legs: crustLegs,
			rigid: [
				"carapace",
				"clawFarFixedRoot",
				"clawFarFixedTip",
				"clawNearFixedRoot",
				"clawNearFixedTip",
				"clawFarDactylTip",
				"clawNearDactylTip"
			]
		}),
		bivalve: build$1("bivalve", ["hinge", "mantle"], shellGraph, {
			valves: ["valveFar", "valveNear"],
			soft: [
				"mantle",
				"siphon",
				"foot"
			]
		}, ["settle", "jet"], { optional: {
			siphon: ["siphon"],
			foot: ["foot"]
		} }),
		gastropod: build$1("gastropod", ["foot0", "foot3"], gastropodGraph, {
			wave: [
				"foot0",
				"foot1",
				"foot2",
				"foot3"
			],
			head: ["head", "mouth"],
			sensors: ["eyeFar", "eyeNear"]
		}, ["crawl"], {
			rigid: ["shell"],
			optional: {
				shell: ["shell"],
				eyes: ["eyeFar", "eyeNear"]
			}
		}),
		annelid: build$1("annelid", ["segment0", "segment11"], wormGraph, { wave: wormGraph.map(([j]) => j) }, ["undulate"]),
		"crustacean-clawed": build$1("crustacean-clawed", ["thorax", "abdomen3"], crustGraph, {
			legs: crustLegs.flatMap((id) => [id + "Knee", id + "Foot"]),
			claws: ["clawFarFinger", "clawNearFinger"],
			reach: ["clawFarBase", "clawNearBase"],
			wave: [
				"abdomen0",
				"abdomen1",
				"abdomen2",
				"abdomen3",
				"tailFan"
			],
			sensors: ["antennaFarTip", "antennaNearTip"]
		}, ["scuttle", "swim"], { legs: crustLegs }),
		"crustacean-small": build$1("crustacean-small", ["thorax", "abdomen5"], smallGraph, {
			legs: smallLegs.flatMap((id) => [id + "Knee", id + "Foot"]),
			wave: Array.from({ length: 6 }, (_, i) => "abdomen" + i).concat("tailFan"),
			sensors: ["antennaFarTip", "antennaNearTip"]
		}, ["swim", "crawl"], {
			legs: smallLegs,
			optional: { tailFan: ["tailFan"] }
		}),
		"sessile-filter": build$1("sessile-filter", ["base", "crown"], [
			["base", "root"],
			["body", "base"],
			["crown", "body"],
			["aperture", "crown"]
		], { soft: [
			"body",
			"crown",
			"aperture"
		] }, ["anchored"], {
			anchored: true,
			rigid: ["root", "base"]
		}),
		"colonial-filter": build$1("colonial-filter", ["segment0", "segment3"], seq$1("segment", 4, "root").concat([["aperture", "segment3"]]), {
			wave: [
				"segment0",
				"segment1",
				"segment2",
				"segment3"
			],
			soft: ["aperture"]
		}, ["drift"]),
		barnacle: build$1("barnacle", ["base", "mouth"], [
			["base", "root"],
			["mouth", "base"],
			["plateFar", "mouth"],
			["plateNear", "mouth"],
			...Array.from({ length: 6 }, (_, i) => chain$1("mouth", ["cirrus" + i + "Base", "cirrus" + i + "Tip"])).flat()
		], {
			valves: ["plateFar", "plateNear"],
			sensors: Array.from({ length: 6 }, (_, i) => "cirrus" + i + "Tip")
		}, ["anchored"], {
			anchored: true,
			rigid: ["root", "base"]
		}),
		lobopod: build$1("lobopod", ["segment0", "segment3"], loboGraph, {
			wave: [
				"segment0",
				"segment1",
				"segment2",
				"segment3"
			],
			legs: loboLegs.flatMap((id) => [id + "Knee", id + "Foot"]),
			head: ["head", "mouth"]
		}, ["crawl"], { legs: loboLegs }),
		xiphosuran: build$1("xiphosuran", ["prosoma", "opisthosoma"], horseGraph, {
			legs: horseLegs.flatMap((id) => [id + "Knee", id + "Foot"]),
			wave: ["opisthosoma", "telson"]
		}, ["crawl"], { legs: horseLegs }),
		larva: build$1("larva", ["segment0", "segment7"], seq$1("segment", 8, "root"), { wave: Array.from({ length: 8 }, (_, i) => "segment" + i) }, ["undulate"])
	});
}));
//#endregion
//#region port/v2/tools/creature-animation/motion-scale.mjs
function motionScaleReference(template) {
	return MOTION_SCALE_REFERENCES[template.id] ?? {
		kind: "span",
		axis: template.bodyAxis ?? ["pelvis", "chest"]
	};
}
function measureMotionScale(template, landmarks) {
	const reference = motionScaleReference(template), distance = (a, b) => {
		const p = landmarks[a], q = landmarks[b];
		if (!p || !q) throw Error("Motion scale: missing observed landmark");
		return Math.hypot(q[0] - p[0], q[1] - p[1]);
	};
	let length;
	if (reference.kind === "span") length = distance(...reference.axis);
	else {
		const lengths = { [reference.origin]: 0 };
		for (const [j, p] of template.graph) {
			if (lengths[p] === void 0) throw Error("Motion scale: parent order");
			lengths[j] = lengths[p] + distance(p, j);
		}
		length = Math.max(...Object.values(lengths));
	}
	if (!Number.isFinite(length) || length <= 0) throw Error("Motion scale: invalid reference");
	if (template.id === "brachyuran" && (length < .08 || length > .9)) throw Error("Motion scale: declared reference outside [0.08, 0.9]");
	return {
		reference,
		length
	};
}
var MOTION_SCALE_REFERENCES;
var init_motion_scale = __esmMin((() => {
	MOTION_SCALE_REFERENCES = Object.freeze({
		brachyuran: Object.freeze({
			kind: "span",
			axis: Object.freeze(["leg0FarRoot", "leg0NearRoot"])
		}),
		"plant-woody": Object.freeze({
			kind: "longest-chain",
			origin: "root"
		}),
		"plant-herb": Object.freeze({
			kind: "longest-chain",
			origin: "root"
		})
	});
}));
//#endregion
//#region port/v2/apps/game/src/motion/amplitude-profile.ts
function compileAmplitudeProfile(parts, bodyLength, materials, contactScales = {}) {
	if (!Number.isFinite(bodyLength) || bodyLength <= 0) throw Error("Amplitude: invalid body length");
	const depth = { root: 0 }, scales = { root: 1 };
	for (const p of parts) {
		if (depth[p.parent] === void 0 || !Number.isFinite(p.boneLength) || p.boneLength <= 0) throw Error("Amplitude: invalid source chain");
		const d = depth[p.parent] + 1;
		depth[p.joint] = d;
		const ratio = p.boneLength / bodyLength, plant = materials[p.joint] === "bark" || materials[p.joint] === "foliage", softArm = p.group === "arms" && materials[p.joint] === "translucent";
		scales[p.joint] = Object.hasOwn(contactScales, p.joint) ? 1 : plant || softArm ? Math.max(.08, Math.min(.5, .5 / (Math.max(.5, ratio) * (1 + .5 * d)))) : p.group === "legs" ? Math.min(1, .5 / Math.max(.5, ratio)) : 1;
	}
	return Object.freeze({
		schema: "cf.motion-amplitude/v1",
		scales: Object.freeze(scales)
	});
}
var init_amplitude_profile = __esmMin((() => {}));
//#endregion
//#region port/v2/tools/creature-animation/pose-projection.mjs
/** Convert canonical backward-pointing bird-wing rotations into the authored
* image plane. This changes coordinate basis, never clip timing or anatomy. */
function poseProjectionSigns(record) {
	if (record.projection === void 0) {
		if ((record.template?.id ?? (record.family === "jelly" ? "radial" : record.family) ?? record.kind) !== "radial") return {};
		const centre = record.landmarks.centre, signs = {};
		for (const [joint, p] of Object.entries(record.landmarks)) {
			const m = /^arm(\d+)Seg0$/.exec(joint);
			if (!m) continue;
			const dx = p[0] - centre[0];
			if (Math.abs(dx) < 1e-8) continue;
			const canonical = Number(m[1]) % 2 === 0 ? 1 : -1, observed = dx > 0 ? 1 : -1;
			for (let k = 0; k < 3; k++) signs["arm" + m[1] + "Seg" + k] = observed / canonical;
		}
		return signs;
	}
	if (record.projection === "source-pincers") return Object.fromEntries(pincerBasis(record).map(([j, angle]) => [j, angle < 0 ? 1 : -1]));
	if (record.projection !== "frontal-wings" || record.template.id !== "biped-bird") throw Error("Pose projection: unsupported source view");
	const signs = {};
	for (const side of ["Near", "Far"]) {
		const a = record.landmarks["wing" + side + "Root"], b = record.landmarks["wing" + side + "Tip"];
		if (!a || !b || Math.abs(b[0] - a[0]) < .04) throw Error("Pose projection: wing has no lateral span");
		const sign = b[0] > a[0] ? -1 : 1;
		signs["wing" + side + "Root"] = sign;
		signs["wing" + side + "Tip"] = sign;
	}
	if (signs.wingNearRoot === signs.wingFarRoot) throw Error("Pose projection: frontal wings must oppose");
	return signs;
}
function projectTemplateLimits(template, record) {
	const signs = poseProjectionSigns(record), project = (limits) => Object.fromEntries(Object.entries(limits).map(([j, l]) => [j, signs[j] === -1 ? {
		min: -l.max,
		max: -l.min
	} : l]));
	return {
		...template,
		limitsDeg: project(template.limitsDeg),
		...template.contactLimitsDeg ? { contactLimitsDeg: project(template.contactLimitsDeg) } : {}
	};
}
/** Normalized pincer closure uses the actual painted gape, not a fixed degree
* swing that can drive a thin finger through its opposing fixed finger. */
function pincerBasis(record) {
	if (record.template.id !== "brachyuran") throw Error("Pose projection: pincer source family");
	return ["Far", "Near"].map((side) => {
		const prefix = "claw" + side, p = record.landmarks[prefix + "Palm"], f = record.landmarks[prefix + "FixedTip"], d = record.landmarks[prefix + "DactylTip"];
		if (!p || !f || !d || [
			...p,
			...f,
			...d
		].some((v) => !Number.isFinite(v))) throw Error("Pose projection: missing pincer geometry");
		const fx = f[0] - p[0], fy = f[1] - p[1], dx = d[0] - p[0], dy = d[1] - p[1], angle = Math.atan2(dx * fy - dy * fx, dx * fx + dy * fy) * 180 / Math.PI;
		if (Math.hypot(fx, fy) < 1e-6 || Math.hypot(dx, dy) < 1e-6 || Math.abs(angle) < 1e-4 || Math.abs(angle) > 35) throw Error("Pose projection: unsupported painted gape");
		return [prefix + "DactylRoot", angle];
	});
}
function poseProjectionScales(record) {
	return record.projection === "source-pincers" ? Object.fromEntries(pincerBasis(record).map(([j, angle]) => [j, Math.abs(angle) / 25])) : {};
}
var init_pose_projection = __esmMin((() => {}));
//#endregion
//#region port/v2/tools/creature-animation/hidden-anatomy.mjs
function resolveHiddenPresence(template, anatomy) {
	if (anatomy?.hidden === void 0) return template;
	need$5(anatomy.schema === "cf.anatomy-presence/v2" && Array.isArray(anatomy.hidden), "v2 hidden list required");
	const hidden = anatomy.hidden;
	need$5(new Set(hidden).size === hidden.length, "duplicate declaration");
	need$5(hidden.every((id) => template.id === "brachyuran" && ["leg3Far", "leg3Near"].includes(id)), "unsupported hidden chain");
	need$5(hidden.every((id) => !anatomy.absent.includes(id)), "hidden is not absent");
	if (!hidden.length) return template;
	const hiddenJoints = hidden.flatMap((id) => [
		"Root",
		"Knee",
		"Foot"
	].map((j) => id + j));
	need$5(hiddenJoints.every((j) => template.joints.includes(j)), "hidden joint inventory");
	return Object.freeze({
		...template,
		hiddenChains: Object.freeze([...hidden]),
		hiddenJoints: Object.freeze(hiddenJoints)
	});
}
var need$5;
var init_hidden_anatomy = __esmMin((() => {
	need$5 = (ok, message) => {
		if (!ok) throw Error("Hidden anatomy: " + message);
	};
}));
//#endregion
//#region port/v2/tools/creature-animation/plant-anatomy.mjs
/** Source-declared woody branch groups; no missing geometry is synthesized. */
function plantBranchCount(id, anatomy) {
	const count = anatomy?.growth?.branches;
	if (anatomy?.growth === void 0) return null;
	if (id !== "plant-woody" || Object.keys(anatomy.growth).length !== 1 || !Number.isInteger(count) || count < 1 || count > 20) throw Error("Plant anatomy: invalid branches or family");
	return count;
}
function expandPlantAnatomy(template, anatomy) {
	const count = plantBranchCount(template.id, anatomy);
	if (count === null) return template;
	const graph = [["trunk", "root"]], limits = {
		root: template.limitsDeg.root,
		trunk: template.limitsDeg.trunk
	}, bounds = [], proportions = [], chains = [];
	for (let i = 0; i < count; i++) {
		const base = "branch" + i + "Base", tip = "branch" + i + "Tip", leaf = "leaf" + i, bones = [base, tip], axis = ["root", "trunk"];
		graph.push([base, "trunk"], [tip, base], [leaf, tip]);
		for (const [j, prototype] of [
			[base, "branch0Base"],
			[tip, "branch0Tip"],
			[leaf, "leaf0"]
		]) limits[j] = template.limitsDeg[prototype];
		const id = "branch/trunk:branch" + i, min = .1, max = 2.5;
		bounds.push({
			id,
			min,
			max,
			kind: "ratio",
			bones,
			axis
		});
		proportions.push({
			id,
			min,
			max,
			measure: (lm, lengths) => bones.reduce((s, j) => s + lengths[j], 0) / Math.hypot(lm.root[0] - lm.trunk[0], lm.root[1] - lm.trunk[1])
		});
		chains.push({
			id: "branch" + i,
			kind: "frond",
			driver: "trunk",
			joints: [
				base,
				tip,
				leaf
			]
		});
	}
	return {
		...template,
		graph,
		joints: ["root", ...graph.map(([j]) => j)],
		limitsDeg: limits,
		...template.bounds ? { bounds: [...template.bounds.filter((b) => !b.id.startsWith("branch/trunk:")), ...bounds] } : {},
		...template.proportions ? { proportions: [...template.proportions.filter((b) => !b.id.startsWith("branch/trunk:")), ...proportions] } : {},
		...template.secondaryChains ? { secondaryChains: chains } : {}
	};
}
var init_plant_anatomy = __esmMin((() => {}));
//#endregion
//#region port/v2/tools/creature-animation/kinematics.ts
function finite(value, label) {
	if (typeof value !== "number" || !Number.isFinite(value)) throw new TypeError(label + " must be finite");
}
function point$2(value) {
	if (!value || typeof value !== "object") throw new TypeError("point required");
	finite(value.x, "point x");
	finite(value.y, "point y");
	if (Math.abs(value.x) > KINEMATICS_LIMITS.maxCoordinate || Math.abs(value.y) > KINEMATICS_LIMITS.maxCoordinate) throw new RangeError("point exceeds coordinate bound");
	return Object.freeze({
		x: value.x,
		y: value.y
	});
}
function affine(value) {
	if (!Array.isArray(value) || value.length !== 6) throw new TypeError("six affine coefficients required");
	for (let i = 0; i < 6; i++) finite(value[i], "affine coefficient");
}
function transformPoint(matrix, input) {
	affine(matrix);
	const p = point$2(input);
	return point$2({
		x: matrix[0] * p.x + matrix[2] * p.y + matrix[4],
		y: matrix[1] * p.x + matrix[3] * p.y + matrix[5]
	});
}
function composeAffine(parent, local) {
	affine(parent);
	affine(local);
	const result = [
		parent[0] * local[0] + parent[2] * local[1],
		parent[1] * local[0] + parent[3] * local[1],
		parent[0] * local[2] + parent[2] * local[3],
		parent[1] * local[2] + parent[3] * local[3],
		parent[0] * local[4] + parent[2] * local[5] + parent[4],
		parent[1] * local[4] + parent[3] * local[5] + parent[5]
	];
	affine(result);
	return Object.freeze(result);
}
function rotationAround(pivot, radians, offset = ZERO) {
	const p = point$2(pivot), move = point$2(offset);
	finite(radians, "rotation");
	if (radians === 0 && move.x === 0 && move.y === 0) return IDENTITY_AFFINE;
	const c = Math.cos(radians), s = Math.sin(radians);
	const matrix = [
		c,
		s,
		-s,
		c,
		p.x - c * p.x + s * p.y + move.x,
		p.y - s * p.x - c * p.y + move.y
	];
	return Object.freeze(matrix);
}
/** Uniform scale about a pivot (the morph system's M1: a sub-tree grows or shrinks about its root joint). */
function scaleAround(pivot, scale) {
	const p = point$2(pivot);
	finite(scale, "scale");
	if (!(scale > 0)) throw new RangeError("scale must be positive");
	if (scale === 1) return IDENTITY_AFFINE;
	const matrix = [
		scale,
		0,
		0,
		scale,
		p.x - scale * p.x,
		p.y - scale * p.y
	];
	return Object.freeze(matrix);
}
function segment(a, b) {
	const value = length$1(a, b);
	if (value < KINEMATICS_LIMITS.minSegment) throw new RangeError("degenerate chain segment");
	return value;
}
/** A bend sign selects the side of root→end occupied by the joint. A fully
* extended rest chain needs that explicit sign; the solver never guesses a limb.
* Unreachable targets are rejected rather than moving a requested fixed contact. */
function createTwoBoneChain(input) {
	if (!input || input.bend !== 1 && input.bend !== -1) throw new TypeError("explicit bend sign required");
	const root = point$2(input.root), joint = point$2(input.joint), end = point$2(input.end), bend = input.bend;
	const upper = segment(root, joint), lower = segment(joint, end), distance = segment(root, end);
	const side = (end.x - root.x) * (joint.y - root.y) - (end.y - root.y) * (joint.x - root.x);
	const tolerance = (upper + lower) * 1e-10;
	if (Math.abs(side) > tolerance * (upper + lower) && Math.sign(side) !== bend) throw new RangeError("bend sign contradicts rest geometry");
	if (distance <= Math.abs(upper - lower) + tolerance) throw new RangeError("folded rest chain has no stable direction");
	const rest = Object.freeze({
		root,
		joint,
		end,
		upperMatrix: IDENTITY_AFFINE,
		lowerMatrix: IDENTITY_AFFINE
	});
	return Object.freeze({
		lengths: Object.freeze({
			upper,
			lower
		}),
		rest: () => rest,
		solve(targetRoot, targetEnd) {
			const r = point$2(targetRoot), e = point$2(targetEnd);
			if (same(r, root) && same(e, end)) return rest;
			const d = length$1(r, e), min = Math.abs(upper - lower), max = upper + lower;
			if (d < KINEMATICS_LIMITS.minSegment || d < min || d > max) throw new RangeError("target outside two-bone reach");
			const ux = (e.x - r.x) / d, uy = (e.y - r.y) / d;
			const along = (upper * upper - lower * lower + d * d) / (2 * d);
			const altitude = Math.sqrt(Math.max(0, upper * upper - along * along));
			const j = point$2({
				x: r.x + ux * along - uy * altitude * bend,
				y: r.y + uy * along + ux * altitude * bend
			});
			const upperAngle = Math.atan2(j.y - r.y, j.x - r.x) - Math.atan2(joint.y - root.y, joint.x - root.x);
			const lowerAngle = Math.atan2(e.y - j.y, e.x - j.x) - Math.atan2(end.y - joint.y, end.x - joint.x);
			return Object.freeze({
				root: r,
				joint: j,
				end: e,
				upperMatrix: rotationAround(root, upperAngle, {
					x: r.x - root.x,
					y: r.y - root.y
				}),
				lowerMatrix: rotationAround(joint, lowerAngle, {
					x: j.x - joint.x,
					y: j.y - joint.y
				})
			});
		}
	});
}
var IDENTITY_AFFINE, KINEMATICS_LIMITS, ZERO, length$1, same;
var init_kinematics = __esmMin((() => {
	IDENTITY_AFFINE = Object.freeze([
		1,
		0,
		0,
		1,
		0,
		0
	]);
	KINEMATICS_LIMITS = Object.freeze({
		maxCoordinate: 1e6,
		minSegment: 1e-6,
		maxChainPoints: 64,
		maxDurationMs: 6e4,
		maxWaveCycles: 8
	});
	ZERO = Object.freeze({
		x: 0,
		y: 0
	});
	length$1 = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
	same = (a, b) => a.x === b.x && a.y === b.y;
}));
//#endregion
//#region port/v2/tools/creature-animation/fixed-attachments.mjs
function expected(definition) {
	if (definition?.anatomyModel === INSECT_MODEL) {
		need$4(definition.id === "insect", "unsupported anatomy model");
		const parents = new Map(definition.graph), legs = definition.legs;
		need$4(Array.isArray(legs) && legs.length === 6 && new Set(legs).size === 6 && INSECT_LEGS.every((id) => legs.includes(id) && parents.get(id + "Knee") === "thorax" && parents.get(id + "Foot") === id + "Knee"), "insect walking socket graph mismatch");
		return legs.map((id) => id + "Knee");
	}
	need$4(definition?.id === "myriapod" && definition.anatomyModel === MODEL, "unsupported anatomy model");
	need$4(Array.isArray(definition.graph) && Array.isArray(definition.legs) && definition.legs.length > 0, "compact graph and walking legs required");
	const parents = new Map(definition.graph), legs = definition.legs;
	need$4(new Set(legs).size === legs.length && legs.every((id) => typeof id === "string" && /^leg\d+(Far|Near)$/.test(id) && parents.get(id + "Knee") === "root" && parents.get(id + "Foot") === id + "Knee"), "walking socket graph mismatch");
	need$4(parents.get("head") === "root", "head socket graph mismatch");
	const ultimate = ["ultimateFar", "ultimateNear"].filter((id) => parents.has(id));
	need$4(ultimate.length === 0 || ultimate.length === 2 && ultimate.every((id) => parents.get(id) === "root"), "ultimate socket graph mismatch");
	return [
		"head",
		...legs.map((id) => id + "Knee"),
		...ultimate
	];
}
function checked(points, keys) {
	need$4(object$1(points) && exact(points, keys), "exact socket inventory required");
	return Object.freeze(Object.fromEntries(keys.map((key) => {
		const p = points[key];
		need$4(Array.isArray(p) && p.length === 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]) && p.every((n) => n >= 0 && n <= 1), "normalized finite socket required: " + key);
		return [key, Object.freeze([p[0], p[1]])];
	})));
}
/** Standalone skeleton/measurement consumers validate the resolved definition.
* A compact model cannot silently use a parent landmark when sockets are absent. */
function validateFixedPivots(definition) {
	const has = !!definition && Object.hasOwn(definition, "fixedPivots");
	if (![MODEL, INSECT_MODEL].includes(definition?.anatomyModel)) {
		need$4(!has, "fixed pivots require compact myriapod or observed insect sockets");
		return null;
	}
	return checked(definition.fixedPivots, expected(definition));
}
/** Missing declaration/model returns the exact original definition. Compact
* declarations are copied/frozen and match any already resolved pivot map.
* Optional alpha checks the actual source pixel, not an inferred nearby point. */
function resolveFixedAttachments(definition, record, alpha) {
	const has = !!record?.geometry && Object.hasOwn(record.geometry, "fixedAttachments");
	if (definition?.id === "insect" && definition.anatomyModel === void 0 && has) definition = {
		...definition,
		anatomyModel: INSECT_MODEL
	};
	if (![MODEL, INSECT_MODEL].includes(definition?.anatomyModel)) {
		need$4(!has && !Object.hasOwn(definition ?? {}, "fixedPivots"), "fixed attachments require compact myriapod or observed insect sockets");
		return definition;
	}
	const keys = expected(definition);
	need$4(has, "source socket declaration required");
	const points = checked(record.geometry.fixedAttachments, keys);
	if (Object.hasOwn(definition, "fixedPivots")) {
		const old = checked(definition.fixedPivots, keys);
		need$4(keys.every((k) => old[k][0] === points[k][0] && old[k][1] === points[k][1]), "resolved pivots differ from source sockets");
	}
	if (alpha !== void 0) {
		const { width, height } = record.geometry;
		need$4(Number.isSafeInteger(width) && width > 0 && Number.isSafeInteger(height) && height > 0 && Number.isSafeInteger(width * height) && alpha instanceof Uint8Array && alpha.length === width * height, "source alpha dimensions");
		for (const key of keys) {
			const p = points[key], x = Math.min(width - 1, Math.floor(p[0] * width)), y = Math.min(height - 1, Math.floor(p[1] * height));
			need$4(alpha[y * width + x] > 0, "socket outside painted alpha: " + key);
		}
	}
	return Object.freeze({
		...definition,
		fixedPivots: points
	});
}
var MODEL, INSECT_MODEL, INSECT_LEGS, need$4, object$1, exact;
var init_fixed_attachments = __esmMin((() => {
	MODEL = "myriapod-rigid-trunk-v1";
	INSECT_MODEL = "insect-observed-sockets-v1";
	INSECT_LEGS = [
		"legFrontFar",
		"legFrontNear",
		"legMidFar",
		"legMidNear",
		"legHindFar",
		"legHindNear"
	];
	need$4 = (ok, reason) => {
		if (!ok) throw Error("Fixed attachments: " + reason);
	};
	object$1 = (v) => v !== null && typeof v === "object" && !Array.isArray(v) && [Object.getPrototypeOf({}), null].includes(Object.getPrototypeOf(v));
	exact = (v, keys) => Reflect.ownKeys(v).length === keys.length && keys.every((k) => Object.hasOwn(v, k));
}));
//#endregion
//#region port/v2/tools/creature-animation/skeleton-pose.mjs
/** `options.jointScale` (morph M1, additive, default none): a uniform scale about the joint's own pivot composed into
* that joint's local frame — its whole sub-tree inherits it. Rest pose is then no longer identity for those joints. */
function createSkeletonPoseProgram(definition, landmarks, options = {}) {
	need$3(definition && Array.isArray(definition.graph) && definition.graph.length > 0 && definition.graph.length < 64, "joint budget");
	const names = ["root"], seen = new Set(names), parents = [void 0];
	for (const pair of definition.graph) {
		need$3(Array.isArray(pair) && pair.length === 2, "graph pair");
		const [child, parent] = pair;
		need$3(nameIsSafe(child) && nameIsSafe(parent), "joint name");
		need$3(!seen.has(child), "duplicate joint: " + child);
		need$3(seen.has(parent), "parent must precede child: " + child);
		names.push(child);
		parents.push(parent);
		seen.add(child);
	}
	need$3(landmarks && typeof landmarks === "object" && !Array.isArray(landmarks) && Object.keys(landmarks).length === names.length, "exact landmark inventory");
	const points = Object.create(null);
	for (const name of names) {
		const p = Object.hasOwn(landmarks, name) ? landmarks[name] : void 0;
		need$3(Array.isArray(p) && p.length === 2 && p.every((v) => Number.isFinite(v) && v >= 0 && v <= 1), "normalized landmark: " + name);
		points[name] = Object.freeze({
			x: p[0],
			y: p[1]
		});
	}
	const axis = definition.bodyAxis;
	need$3(Array.isArray(axis) && axis.length === 2 && axis.every((n) => seen.has(n)), "explicit body axis");
	const a = points[axis[0]], b = points[axis[1]], bodyLength = Math.hypot(b.x - a.x, b.y - a.y);
	need$3(bodyLength >= 1e-6, "degenerate body axis");
	const fixedPivots = validateFixedPivots(definition);
	const pivots = names.map((name, i) => fixedPivots?.[name] ? Object.freeze({
		x: fixedPivots[name][0],
		y: fixedPivots[name][1]
	}) : points[parents[i] ?? "root"]);
	const index = new Map(names.map((n, i) => [n, i]));
	const scales = names.map(() => IDENTITY_AFFINE);
	if (options.jointScale !== void 0) {
		need$3(options.jointScale && typeof options.jointScale === "object" && !Array.isArray(options.jointScale), "jointScale map");
		for (const [name, s] of Object.entries(options.jointScale)) {
			need$3(index.has(name), "unknown scaled joint: " + name);
			need$3(Number.isFinite(s) && s > 0, "positive joint scale: " + name);
			scales[index.get(name)] = scaleAround(pivots[index.get(name)], s);
		}
	}
	return Object.freeze({
		jointNames: Object.freeze(names),
		bodyLength,
		pivot(name) {
			need$3(index.has(name), "unknown pivot joint: " + name);
			return pivots[index.get(name)];
		},
		evaluate(pose) {
			need$3(pose && typeof pose === "object" && !Array.isArray(pose), "invalid pose");
			for (const [name, key] of Object.entries(pose)) {
				need$3(seen.has(name), "unknown pose joint: " + name);
				need$3(key && Number.isFinite(key.rotation) && Number.isFinite(key.dx ?? 0) && Number.isFinite(key.dy ?? 0), "nonfinite pose");
			}
			const matrices = Object.create(null);
			for (let i = 0; i < names.length; i++) {
				const name = names[i], parent = parents[i], key = Object.hasOwn(pose, name) ? pose[name] : void 0;
				const rotated = key ? rotationAround(pivots[i], key.rotation, {
					x: (key.dx ?? 0) * bodyLength,
					y: (key.dy ?? 0) * bodyLength
				}) : IDENTITY_AFFINE;
				const local = scales[i] === IDENTITY_AFFINE ? rotated : composeAffine(rotated, scales[i]);
				matrices[name] = parent ? composeAffine(matrices[parent], local) : local;
			}
			return matrices;
		}
	});
}
var need$3, nameIsSafe;
var init_skeleton_pose = __esmMin((() => {
	init_kinematics();
	init_fixed_attachments();
	need$3 = (ok, reason) => {
		if (!ok) throw Error("Skeleton pose: " + reason);
	};
	nameIsSafe = (name) => typeof name === "string" && /^[A-Za-z][A-Za-z0-9]*$/.test(name) && ![
		"constructor",
		"prototype",
		"__proto__"
	].includes(name);
}));
//#endregion
//#region port/v2/tools/creature-animation/myriapod-anatomy.mjs
/** Explicit rigid-trunk, fixed-socket myriapod representation.
* All walking legs retain two real spans. Painted trunk plates are carried by
* one rigid body; this model never claims the legacy eight-segment wave. */
function expandCompactMyriapod(template, counts) {
	const graph = [
		["head", "root"],
		["mandible", "head"],
		["antennaFar", "head"],
		["antennaNear", "head"]
	], legs = [];
	const limits = Object.fromEntries([
		"root",
		"head",
		"mandible",
		"antennaFar",
		"antennaNear"
	].map((j) => [j, { ...template.limitsDeg[j] }]));
	for (let i = 0; i < counts.walkingLegPairs; i++) for (const side of ["Far", "Near"]) {
		const id = "leg" + i + side;
		legs.push(id);
		graph.push([id + "Knee", "root"], [id + "Foot", id + "Knee"]);
		limits[id + "Knee"] = { ...template.limitsDeg.legAFarKnee };
		limits[id + "Foot"] = { ...template.limitsDeg.legAFarFoot };
	}
	const ultimateSides = counts.ultimateLegPairs === 1 ? ["Far", "Near"] : [];
	for (const side of ultimateSides) {
		graph.push(["ultimate" + side, "root"]);
		limits["ultimate" + side] = { ...template.limitsDeg.legAFarFoot };
	}
	const bodyAxis = ["root", "head"], distance = (lm) => Math.hypot(lm.head[0] - lm.root[0], lm.head[1] - lm.root[1]);
	const bounds = [
		{
			id: "body",
			min: .1,
			max: .95,
			kind: "distance",
			axis: bodyAxis
		},
		{
			id: "bone-min",
			min: .001,
			max: .75,
			kind: "bone-min"
		},
		{
			id: "bone-max",
			min: .001,
			max: .75,
			kind: "bone-max"
		},
		...legs.map((id) => ({
			id: "leg/body:" + id,
			min: .05,
			max: 1.5,
			kind: "ratio",
			bones: [id + "Knee", id + "Foot"],
			axis: bodyAxis
		}))
	];
	const proportions = bounds.map((b) => ({
		id: b.id,
		min: b.min,
		max: b.max,
		measure: (lm, bones) => b.kind === "distance" ? distance(lm) : b.kind === "bone-min" ? Math.min(...Object.values(bones)) : b.kind === "bone-max" ? Math.max(...Object.values(bones)) : b.bones.reduce((n, j) => n + bones[j], 0) / distance(lm)
	}));
	const secondaryChains = [...["Far", "Near"].map((side) => ({
		id: "antenna" + side,
		kind: "antenna",
		driver: "head",
		joints: ["antenna" + side]
	})), ...ultimateSides.map((side) => ({
		id: "ultimate" + side,
		kind: "tail",
		driver: "root",
		joints: ["ultimate" + side]
	}))];
	return {
		...template,
		anatomyModel: "myriapod-rigid-trunk-v1",
		graph,
		joints: ["root", ...graph.map(([j]) => j)],
		legs,
		limitsDeg: limits,
		bodyAxis,
		...template.bounds ? { bounds } : {},
		...template.proportions ? { proportions } : {},
		...template.secondaryChains ? { secondaryChains } : {},
		contactStance: {
			default: "all",
			actions: {},
			swingLift: "toward-socket",
			travelSubsteps: {
				hit: 2,
				dodge: 2,
				tame: 2
			},
			gaits: { "approach:crawl": "alternating" },
			travel: {
				"melee:mandible": "source-steps",
				"melee:body": "source-steps",
				hit: "source-steps",
				dodge: "source-steps",
				tame: "source-steps"
			}
		}
	};
}
var init_myriapod_anatomy = __esmMin((() => {}));
//#endregion
//#region port/v2/tools/creature-animation/repeated-anatomy.mjs
function appendageCounts(id, anatomy) {
	if (anatomy?.schema !== "cf.anatomy-presence/v2") return null;
	const c = anatomy.appendages;
	if (c === void 0 && (Array.isArray(anatomy.hidden) || Array.isArray(anatomy.folded))) return null;
	if (id === "myriapod" && c && typeof c === "object" && !Array.isArray(c)) {
		if (Object.keys(c).length !== 2 || !Object.hasOwn(c, "walkingLegPairs") || !Object.hasOwn(c, "ultimateLegPairs")) fail("unknown or missing myriapod appendage count");
		if (!Number.isInteger(c.walkingLegPairs) || c.walkingLegPairs < 1 || ![0, 1].includes(c.ultimateLegPairs)) fail("invalid myriapod appendage count");
		const joints = 5 + 4 * c.walkingLegPairs + 2 * c.ultimateLegPairs;
		if (joints > 64) fail("64-joint budget exceeded: " + joints);
		return {
			walkingLegPairs: c.walkingLegPairs,
			ultimateLegPairs: c.ultimateLegPairs
		};
	}
	if (!c || typeof c !== "object" || Array.isArray(c) || !["radial", "cephalopod"].includes(id)) fail("unsupported repeated topology " + id);
	const allowed = id === "radial" ? ["arms"] : ["arms", "feedingTentacles"];
	if (Object.keys(c).some((k) => !allowed.includes(k)) || !allowed.every((k) => Object.hasOwn(c, k))) fail("unknown or missing appendage count");
	const arms = c.arms, tentacles = id === "radial" ? 0 : c.feedingTentacles;
	if (!Number.isInteger(arms) || arms < 2 || arms > 20 || !Number.isInteger(tentacles) || tentacles < 0 || tentacles > 4) fail("invalid appendage count");
	const joints = (id === "radial" ? 3 : 8) + 3 * (arms + tentacles);
	if (joints > 64) fail("64-joint budget exceeded: " + joints);
	return {
		arms,
		feedingTentacles: tentacles
	};
}
function expandRepeatedAnatomy(template, anatomy) {
	const counts = appendageCounts(template.id, anatomy);
	if (!counts) return template;
	if (template.id === "myriapod") return freeze$1(expandCompactMyriapod(template, counts));
	const radial = template.id === "radial", parent = radial ? "centre" : "head", axis = radial ? ["centre", "bell"] : ["head", "mantle"];
	const prefixes = [...Array.from({ length: counts.arms }, (_, i) => "arm" + i), ...Array.from({ length: counts.feedingTentacles }, (_, i) => "tentacle" + i)];
	const repeated = (j) => /^arm\d+Seg[012]$/.test(j);
	const graph = template.graph.filter(([j]) => !repeated(j));
	const limits = Object.fromEntries(Object.entries(template.limitsDeg).filter(([j]) => !repeated(j)));
	const min = .3, max = radial ? 8 : 6, boundPrefix = radial ? "arm/bell:" : "arm/body:";
	const bounds = [], proportions = [], chains = [];
	for (const prefix of prefixes) {
		const bones = Array.from({ length: 3 }, (_, i) => prefix + "Seg" + i);
		for (let i = 0; i < 3; i++) {
			graph.push([bones[i], i ? bones[i - 1] : parent]);
			limits[bones[i]] = { ...template.limitsDeg["arm0Seg" + i] };
		}
		const id = boundPrefix + prefix;
		bounds.push({
			id,
			min,
			max,
			kind: "ratio",
			bones,
			axis
		});
		proportions.push({
			id,
			min,
			max,
			measure: (lm, lengths) => bones.reduce((s, j) => s + lengths[j], 0) / Math.hypot(lm[axis[0]][0] - lm[axis[1]][0], lm[axis[0]][1] - lm[axis[1]][1])
		});
		chains.push({
			id: prefix,
			kind: radial ? "arm" : "tentacle",
			driver: parent,
			joints: bones
		});
	}
	return freeze$1({
		...template,
		graph,
		joints: ["root", ...graph.map(([j]) => j)],
		limitsDeg: limits,
		...template.bounds ? { bounds: [...template.bounds.filter((b) => !b.id.startsWith(boundPrefix)), ...bounds] } : {},
		...template.proportions ? { proportions: [...template.proportions.filter((b) => !b.id.startsWith(boundPrefix)), ...proportions] } : {},
		...template.secondaryChains ? { secondaryChains: [...template.secondaryChains.filter((c) => !/^arm\d+$/.test(c.id)), ...chains] } : {}
	});
}
var fail, freeze$1;
var init_repeated_anatomy = __esmMin((() => {
	init_skeleton_pose();
	init_myriapod_anatomy();
	fail = (detail) => {
		throw Error("Anatomy inventory: " + detail);
	};
	freeze$1 = (value) => {
		if (value && typeof value === "object" && !Object.isFrozen(value)) {
			Object.values(value).forEach(freeze$1);
			Object.freeze(value);
		}
		return value;
	};
}));
//#endregion
//#region port/v2/tools/creature-animation/anatomy-inventory.mjs
function resolveAnatomyInventory(template, anatomy) {
	if (anatomy === void 0) return template;
	const allowed = anatomy?.schema === "cf.anatomy-presence/v2" ? [
		"schema",
		"absent",
		"appendages",
		"growth",
		"hidden",
		"folded"
	] : [
		"schema",
		"absent",
		"growth"
	];
	if (!anatomy || !["cf.anatomy-presence/v1", "cf.anatomy-presence/v2"].includes(anatomy.schema) || !Array.isArray(anatomy.absent) || Object.keys(anatomy).some((k) => !allowed.includes(k))) throw Error("Anatomy inventory: invalid presence declaration");
	const expanded = expandRepeatedAnatomy(template, anatomy);
	const folded = anatomy.folded === void 0 ? [] : anatomy.folded;
	if (!Array.isArray(folded) || new Set(folded).size !== folded.length || folded.some((id) => typeof id !== "string" || !expanded.legs?.includes(id))) throw Error("Anatomy inventory: invalid folded leg declaration");
	if (folded.some((id) => anatomy.absent.includes(id) || Array.isArray(anatomy.hidden) && anatomy.hidden.includes(id))) throw Error("Anatomy inventory: folded is neither hidden nor absent");
	template = resolveHiddenPresence(expandPlantAnatomy(expanded, anatomy), anatomy);
	if (new Set(anatomy.absent).size !== anatomy.absent.length) throw Error("Anatomy inventory: duplicate absence");
	const removed = /* @__PURE__ */ new Set(), omittedBounds = /* @__PURE__ */ new Set();
	for (const group of anatomy.absent) {
		const names = template.optional?.[group] ?? OPTIONAL[template.id]?.[group];
		if (!names) throw Error("Anatomy inventory: mandatory or unknown part " + group);
		for (const j of names) removed.add(j);
		for (const id of OMITTED_BOUNDS[template.id]?.[group] ?? []) omittedBounds.add(id);
	}
	if (!removed.size) return template;
	const graph = template.graph.filter(([child]) => !removed.has(child));
	if (graph.some(([, parent]) => removed.has(parent))) throw Error("Anatomy inventory: disconnected child");
	return Object.freeze({
		...template,
		...template.proportions ? { proportions: Object.freeze(template.proportions.filter((b) => !omittedBounds.has(b.id))) } : {},
		...template.bounds ? { bounds: Object.freeze(template.bounds.filter((b) => !omittedBounds.has(b.id))) } : {},
		graph: Object.freeze(graph),
		joints: Object.freeze(template.joints.filter((j) => !removed.has(j))),
		limitsDeg: Object.freeze(Object.fromEntries(Object.entries(template.limitsDeg).filter(([j]) => !removed.has(j)))),
		...template.contactLimitsDeg ? { contactLimitsDeg: Object.freeze(Object.fromEntries(Object.entries(template.contactLimitsDeg).filter(([j]) => !removed.has(j)))) } : {},
		...template.secondaryChains ? { secondaryChains: Object.freeze(template.secondaryChains.map((c) => ({
			...c,
			joints: c.joints.filter((j) => !removed.has(j))
		})).filter((c) => c.joints.length && !removed.has(c.driver))) } : {}
	});
}
var ears$2, tail, OPTIONAL, OMITTED_BOUNDS;
var init_anatomy_inventory = __esmMin((() => {
	init_hidden_anatomy();
	init_plant_anatomy();
	init_repeated_anatomy();
	ears$2 = [
		"earFarRoot",
		"earFarTip",
		"earNearRoot",
		"earNearTip"
	];
	tail = [
		"tail0",
		"tail1",
		"tail2",
		"tail3"
	];
	OPTIONAL = Object.freeze({
		quadruped: {
			tail,
			"external-ears": ears$2
		},
		hopper: {
			tail,
			"external-ears": ears$2
		},
		"biped-bird": {
			wings: [
				"wingFarRoot",
				"wingFarTip",
				"wingNearRoot",
				"wingNearTip"
			],
			"tail-fan": ["tailFan"],
			beak: ["beak"]
		},
		fish: {
			jaw: ["jaw"],
			caudal: ["caudal"],
			dorsal: ["dorsal"],
			"paired-pectoral-fins": ["pectoralFar", "pectoralNear"]
		},
		insect: {
			mandible: ["mandible"],
			wings: ["wingFar", "wingNear"],
			antennae: ["antennaFar", "antennaNear"]
		},
		serpent: { jaw: ["jaw"] },
		arachnid: {
			sting: ["sting"],
			chelicerae: ["cheliceraFar", "cheliceraNear"]
		},
		myriapod: {
			mandible: ["mandible"],
			antennae: ["antennaFar", "antennaNear"]
		},
		cephalopod: {
			fins: ["finFar", "finNear"],
			eyes: ["eyeFar", "eyeNear"]
		},
		"flyer-membrane": {
			tail: ["tail0"],
			"external-ears": ["earFarTip", "earNearTip"]
		},
		primate: { tail: [
			"tail0",
			"tail1",
			"tail2"
		] }
	});
	OMITTED_BOUNDS = Object.freeze({
		"biped-bird": { wings: ["wing/torso"] },
		fish: { caudal: ["caudal/body"] }
	});
}));
//#endregion
//#region port/v2/packages/domain/rand/src/index.ts
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
var init_src$2 = __esmMin((() => {
	Math.PI * 2;
}));
//#endregion
//#region port/v2/packages/domain/speciestraits/src/speciestraits.verbatim.js
function habOf(g) {
	return g && g.x ? EX_HABITAT[(g.habitat || 0) % EX_HABITAT.length] : FA_HABITAT[(g && g.habitat || 0) % FA_HABITAT.length] || "";
}
function locoOf(g) {
	return g && g.x ? EX_LOCO[(g.loco || 0) % EX_LOCO.length] : FA_LOCO[(g && g.loco || 0) % FA_LOCO.length] || "";
}
var GRADE_TIERS, EX_HABITAT, EX_LOCO, FA_LOCO, FA_HEAD, FA_SKIN, FA_TAIL, FA_HABITAT;
var init_speciestraits_verbatim = __esmMin((() => {
	init_src$2();
	GRADE_TIERS = [
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
	GRADE_TIERS.length - 1;
	EX_HABITAT = [
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
	EX_LOCO = [
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
	FA_LOCO = [
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
	FA_HEAD = [
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
	FA_SKIN = [
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
	FA_TAIL = [
		"none",
		"whip-like",
		"finned",
		"spiked",
		"prehensile",
		"plumed",
		"stinger-tipped"
	];
	FA_HABITAT = [
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
}));
//#endregion
//#region port/v2/packages/domain/speciestraits/src/statkeys.verbatim.js
var init_statkeys_verbatim = __esmMin((() => {}));
//#endregion
//#region port/v2/packages/domain/speciestraits/src/index.ts
var init_src$1 = __esmMin((() => {
	init_speciestraits_verbatim();
	init_statkeys_verbatim();
}));
//#endregion
//#region port/v2/apps/game/src/earth-fauna-profiles.ts
function earthFaunaProfile(name) {
	return byName.get(name);
}
var group, EARTH_FAUNA_PROFILES, byName;
var init_earth_fauna_profiles = __esmMin((() => {
	group = (id, names, candidateTemplates, media, intendedMoves, notes, needsObservedFit = false) => Object.freeze({
		...needsObservedFit ? { needsObservedFit: true } : {},
		id,
		names: Object.freeze(names),
		candidateTemplates: Object.freeze(candidateTemplates),
		media: Object.freeze(media),
		intendedMoves: Object.freeze(intendedMoves),
		notes
	});
	EARTH_FAUNA_PROFILES = Object.freeze([
		group("felid", [
			"Jaguar",
			"Leopard",
			"Tiger",
			"Clouded Leopard",
			"Ocelot",
			"Lion",
			"Cougar",
			"Snow Leopard",
			"Bobcat",
			"Lynx",
			"Caracal",
			"Fishing Cat",
			"Cheetah",
			"Serval",
			"Sand Cat",
			"Wildcat",
			"Cat"
		], ["quadruped"], ["ground"], ["claw", "bite"], ""),
		group("canid", [
			"Jackal",
			"Wolf",
			"Coyote",
			"Fox",
			"Red Fox",
			"Arctic Fox",
			"African Wild Dog",
			"Maned Wolf",
			"Pampas Fox",
			"Fennec Fox",
			"Dog",
			"Dingo"
		], ["quadruped"], ["ground"], ["bite", "claw"], ""),
		group("hyena", [
			"Hyena",
			"Spotted Hyena",
			"Striped Hyena"
		], ["quadruped"], ["ground"], ["bite"], ""),
		group("bear", [
			"Sloth Bear",
			"Spectacled Bear",
			"Panda",
			"Black Bear",
			"Brown Bear",
			"Polar Bear",
			"Bear",
			"Sun Bear",
			"Grizzly Bear"
		], ["quadruped"], ["ground"], ["claw", "bite"], ""),
		group("small-clawed-mammal", [
			"Kinkajou",
			"Coati",
			"Civet",
			"Mongoose",
			"Meerkat",
			"Red Panda",
			"Raccoon",
			"Badger",
			"Weasel",
			"Stoat",
			"Mink",
			"Marten",
			"Fisher",
			"Wolverine",
			"Possum",
			"Porcupine",
			"Squirrel",
			"Chipmunk",
			"Mouse",
			"Vole",
			"Mole",
			"Shrew",
			"Hedgehog",
			"Lemming",
			"Marmot",
			"Prairie Dog",
			"Ground Squirrel",
			"Gopher",
			"Hamster",
			"Gerbil",
			"Hyrax",
			"Agouti",
			"Guinea Pig",
			"Rat",
			"Tree Shrew",
			"Wombat",
			"Tasmanian Devil",
			"Quoll"
		], ["quadruped"], ["ground"], ["bite", "claw"], ""),
		group("aquatic-pawed-mammal", [
			"River Otter",
			"Otter",
			"Giant Otter",
			"Sea Otter",
			"Beaver",
			"Capybara",
			"Water Vole",
			"Marsh Rodent"
		], ["quadruped"], ["ground", "water"], ["bite", "claw"], ""),
		group("gliding-mammal", [
			"Flying Squirrel",
			"Sugar Glider",
			"Colugo"
		], ["quadruped"], ["air", "ground"], ["bite", "claw"], "Gliding membrane needs its own observed geometry; ordinary quadruped legs do not certify gliding."),
		group("toothless-clawed-mammal", [
			"Giant Anteater",
			"Pangolin",
			"Echidna"
		], ["quadruped"], ["ground"], ["claw"], "No bite granted from the quadruped default."),
		group("xenarthran", ["Sloth", "Armadillo"], ["quadruped"], ["ground"], ["claw"], ""),
		group("aardvark", ["Aardvark"], ["quadruped"], ["ground"], ["claw"], ""),
		group("rabbit-hopper", [
			"Pika",
			"Rabbit",
			"Hare",
			"Snowshoe Hare",
			"Jackrabbit",
			"Jerboa",
			"Arctic Hare",
			"Mara"
		], ["hopper", "quadruped"], ["ground"], ["kick", "bite"], ""),
		group("marsupial-hopper", ["Kangaroo", "Wallaby"], ["hopper"], ["ground"], ["kick", "bite"], ""),
		group("koala", ["Koala"], ["quadruped"], ["ground"], ["claw", "bite"], ""),
		group("primate", [
			"Gorilla",
			"Chimpanzee",
			"Orangutan",
			"Capuchin",
			"Howler Monkey",
			"Spider Monkey",
			"Tamarin",
			"Macaque",
			"Langur",
			"Baboon",
			"Monkey",
			"Lemur",
			"Gibbon",
			"Mandrill",
			"Marmoset",
			"Aye-Aye",
			"Proboscis Monkey"
		], ["primate"], ["ground"], ["punch", "bite"], ""),
		group("hoofed-horned", [
			"Gaur",
			"Banteng",
			"Water Buffalo",
			"Deer",
			"Antelope",
			"Takin",
			"Elk",
			"Moose",
			"Reindeer",
			"Caribou",
			"Mountain Goat",
			"Ibex",
			"Chamois",
			"Giraffe",
			"Kudu",
			"Impala",
			"Buffalo",
			"Wildebeest",
			"Eland",
			"Gazelle",
			"Hartebeest",
			"Oryx",
			"Bison",
			"Saiga",
			"Yak",
			"Cattle",
			"Sheep",
			"Goat",
			"Wild Sheep",
			"Musk Ox",
			"Cow",
			"Bull",
			"Pronghorn",
			"Springbok",
			"Bongo",
			"Duiker",
			"Gerenuk",
			"Nilgai",
			"Tahr",
			"Serow"
		], ["quadruped"], ["ground"], [
			"gore",
			"headbutt",
			"kick"
		], "Horn/antler use additionally needs an observed weapon; sex/age and hornless masters must not receive gore."),
		group("hoofed-unhorned", [
			"Zebra",
			"Wild Horse",
			"Wild Ass",
			"Camel",
			"Wild Pony",
			"Dromedary Camel",
			"Bactrian Camel",
			"Horse",
			"Donkey",
			"Llama",
			"Alpaca",
			"Okapi"
		], ["quadruped"], ["ground"], ["kick", "bite"], "No generic claw; horn use not inferred."),
		group("tapir", ["Tapir", "Mountain Tapir"], ["quadruped"], ["ground", "water"], ["bite", "headbutt"], ""),
		group("suid", [
			"Wild Boar",
			"Peccary",
			"Warthog",
			"Wild Pig",
			"Pig"
		], ["quadruped"], ["ground"], [
			"bite",
			"gore",
			"headbutt"
		], "Tusks must be observed before a gore motion is admitted."),
		group("elephant", [
			"Elephant",
			"Forest Elephant",
			"Asian Elephant",
			"African Elephant"
		], ["quadruped"], ["ground"], ["gore", "headbutt"], "Tusks/trunk require their own observed contact geometry."),
		group("rhino", ["Rhinoceros"], ["quadruped"], ["ground"], ["gore", "headbutt"], ""),
		group("hippo", ["Hippopotamus"], ["quadruped"], ["ground", "water"], ["bite", "headbutt"], ""),
		group("platypus", ["Platypus"], ["quadruped"], ["ground", "water"], ["bite"], "Bill contact; a male hind spur is conditional and is not assumed."),
		group("bat", [
			"Fruit Bat",
			"Bat",
			"Insect-Eating Bat",
			"Vampire Bat"
		], ["flyer-membrane"], ["air", "ground"], ["bite", "claw"], ""),
		group("pinniped", [
			"Walrus",
			"Seal",
			"Fur Seal",
			"Sea Lion"
		], ["quadruped"], ["water", "ground"], ["bite"], "Requires flipper topology and swimming/haul-out poses, not a four-legged walking substitute."),
		group("toothed-cetacean", [
			"Beluga",
			"Narwhal",
			"Orca",
			"River Dolphin",
			"Dolphin",
			"Porpoise",
			"Sperm Whale",
			"Pilot Whale",
			"Beaked Whale"
		], ["fish"], ["water"], ["bite"], "Swimming template needs mammalian fluke axis/absence declarations; narwhal tusk remains conditional."),
		group("baleen-cetacean", [
			"Right Whale",
			"Blue Whale",
			"Humpback Whale",
			"Gray Whale",
			"Whale"
		], ["fish"], ["water"], ["body", "tail"], "No biting teeth invented. Generic Whale is conservative; fluke contact needs observed anatomy."),
		group("sirenian", ["Manatee", "Dugong"], ["fish"], ["water"], ["body", "tail"], "No legs or claw attack; fluke topology required."),
		group("raptor", [
			"Eagle",
			"Owl",
			"Hawk",
			"Falcon",
			"Snowy Owl",
			"Osprey",
			"Kestrel",
			"Desert Owl",
			"Harpy Eagle"
		], ["biped-bird"], ["air", "ground"], ["claw", "peck"], ""),
		group("flightless-bird", [
			"Ostrich",
			"Rhea",
			"Emu",
			"Cassowary",
			"Kiwi",
			"Kakapo"
		], ["biped-bird"], ["ground"], ["kick", "peck"], "No aerial attack. Wings do not imply flight."),
		group("penguin", ["Penguin"], ["biped-bird"], ["ground", "water"], ["peck"], "Flipper swimming, no aerial attack."),
		group("swimming-bird", [
			"Goose",
			"Duck",
			"Swan",
			"Eider Duck",
			"Auk",
			"Puffin",
			"Guillemot",
			"Loon",
			"Grebe",
			"Cormorant",
			"Coot",
			"Moorhen"
		], ["biped-bird"], [
			"air",
			"water",
			"ground"
		], ["peck", "kick"], ""),
		group("wading-bird", [
			"Heron",
			"Egret",
			"Ibis",
			"Stork",
			"Crane",
			"Spoonbill",
			"Flamingo",
			"Curlew",
			"Snipe",
			"Plover",
			"Sandpiper",
			"Rail",
			"Bittern",
			"Oystercatcher",
			"Godwit",
			"Avocet",
			"Screamer"
		], ["biped-bird"], ["air", "ground"], ["peck", "kick"], ""),
		group("ground-foraging-bird", [
			"Peacock",
			"Guineafowl",
			"Turkey",
			"Grouse",
			"Ptarmigan",
			"Bustard",
			"Sandgrouse",
			"Quail",
			"Partridge",
			"Roadrunner",
			"Chicken",
			"Rooster",
			"Secretary Bird",
			"Seriema"
		], ["biped-bird"], ["air", "ground"], ["peck", "kick"], "Flight-capable does not require every move to be airborne."),
		group("bird", [
			"Macaw",
			"Parrot",
			"Toucan",
			"Hornbill",
			"Hummingbird",
			"Kingfisher",
			"Vulture",
			"Tanager",
			"Woodpecker",
			"Crow",
			"Raven",
			"Robin",
			"Cardinal",
			"Chough",
			"Lark",
			"Sparrow",
			"Finch",
			"Swallow",
			"Magpie",
			"Jay",
			"Dove",
			"Gull",
			"Pigeon",
			"Tern",
			"Albatross",
			"Petrel",
			"Skua",
			"Condor",
			"Swift",
			"Pelican",
			"Gannet",
			"Frigatebird",
			"Seabird",
			"Booby",
			"Tropicbird",
			"Snow Petrel",
			"Starling",
			"Cockatoo",
			"Kookaburra",
			"Hoatzin",
			"Quetzal",
			"Weaverbird"
		], ["biped-bird"], ["air", "ground"], ["peck"], ""),
		group("constricting-snake", [
			"Anaconda",
			"Boa",
			"Python",
			"Sand Boa"
		], ["serpent"], ["ground", "water"], ["strike", "constrict"], ""),
		group("snake", [
			"Cobra",
			"Viper",
			"Tree Snake",
			"Rat Snake",
			"Garter Snake",
			"Cottonmouth",
			"Water Snake",
			"Mamba",
			"Rattlesnake",
			"Racer",
			"Mountain Viper",
			"Whip Snake",
			"Grass Snake",
			"King Snake",
			"Cave Snake",
			"Snake",
			"Vine Snake"
		], ["serpent"], ["ground", "water"], ["strike"], ""),
		group("crocodilian", [
			"Caiman",
			"Crocodile",
			"Alligator",
			"Gharial"
		], ["quadruped"], ["water", "ground"], ["bite", "tail"], "Low sprawling legs and tail; no fur/ears from a mammal template."),
		group("lizard", [
			"Monitor Lizard",
			"Anole",
			"Gecko",
			"Skink",
			"Alligator Lizard",
			"Mountain Lizard",
			"Tegu",
			"Wall Lizard",
			"Lizard",
			"Whiptail",
			"Agama",
			"Iguana",
			"Land Iguana",
			"Coastal Lizard",
			"Komodo Dragon",
			"Gila Monster",
			"Frilled Lizard"
		], ["quadruped"], ["ground"], ["bite", "tail"], "Reptile-specific absence and skin declarations required."),
		group("special-lizard", ["Chameleon", "Horned Lizard"], ["quadruped"], ["ground"], ["bite"], "Do not invent a rigid striking horn or tail weapon from the name."),
		group("marine-iguana", ["Marine Iguana"], ["quadruped"], ["ground", "water"], ["bite", "tail"], ""),
		group("tortoise", ["Tortoise", "Box Turtle"], ["quadruped"], ["ground"], ["bite"], "Shell and retracted limbs need actual observed topology."),
		group("freshwater-turtle", [
			"Pond Turtle",
			"Snapping Turtle",
			"Softshell Turtle",
			"Turtle"
		], ["quadruped"], ["water", "ground"], ["bite"], ""),
		group("sea-turtle", ["Sea Turtle"], ["quadruped"], ["water", "ground"], ["bite"], "Flipper topology required; no running paws."),
		group("frog", [
			"Tree Frog",
			"Poison Dart Frog",
			"Bullfrog",
			"Glass Frog",
			"Frog",
			"Wood Frog",
			"Toad",
			"Cave Frog"
		], ["hopper"], ["ground", "water"], ["kick", "bite"], "Adult frog: tail and external ears absent."),
		group("salamander", [
			"Salamander",
			"Newt",
			"Giant Salamander",
			"Alpine Salamander",
			"Olm",
			"Blind Salamander",
			"Axolotl"
		], ["quadruped"], ["water", "ground"], ["bite"], "Preserve tail and optional external gills; no mammalian ears."),
		group("caecilian", ["Caecilian"], ["serpent"], ["ground", "water"], ["strike"], "Limb-free amphibian; no venom or constriction inferred."),
		group("fish", [
			"Salmon",
			"Trout",
			"Char",
			"Pike",
			"Catfish",
			"Gar",
			"Bowfin",
			"Bass",
			"Carp",
			"Tilapia",
			"Piranha",
			"Killifish",
			"Arctic Cod",
			"Herring",
			"Cold-Water Fish",
			"Blind Fish",
			"Small Fish",
			"Grayling",
			"Minnow",
			"Sculpin",
			"Sturgeon",
			"Paddlefish",
			"Perch",
			"Pacu",
			"Arapaima",
			"Arowana",
			"Cichlid",
			"Tetra",
			"Sunfish",
			"Walleye",
			"Whitefish",
			"Lungfish",
			"Tigerfish",
			"Goldfish",
			"Mullet",
			"Tarpon",
			"Snapper",
			"Cave Fish",
			"Goby",
			"Blenny",
			"Flounder",
			"Grouper",
			"Bonefish",
			"Barracuda",
			"Reef Fish",
			"Cod",
			"Mackerel",
			"Halibut",
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
			"Rabbitfish",
			"Sea Bass",
			"Tuna",
			"Haddock",
			"Pollock",
			"Marlin",
			"Sailfish",
			"Swordfish",
			"Mahi-Mahi",
			"Wahoo",
			"Sardine",
			"Anchovy",
			"Flying Fish",
			"Anglerfish",
			"Lanternfish",
			"Viperfish",
			"Fangtooth",
			"Dragonfish",
			"Oarfish",
			"Barreleye",
			"Blobfish",
			"Tripod Fish",
			"Snailfish",
			"Deep-Sea Fish",
			"Monkfish",
			"Coelacanth",
			"Ocean Sunfish",
			"Remora",
			"Archerfish",
			"Knifefish",
			"Icefish",
			"Mudminnow",
			"Flying Gurnard"
		], ["fish"], ["water"], ["bite"], "Fin/body variants and toothless suction-feeders need actual jaw/feeding-part observation; not a claim of teeth."),
		group("eel", [
			"Eel",
			"Electric Eel",
			"Moray Eel",
			"Gulper Eel"
		], ["fish", "serpent"], ["water"], ["bite", "strike"], "No legs. Electrical effects are abilities, not physical anatomy."),
		group("jawless-fish", ["Lamprey", "Lancelet"], ["fish"], ["water"], ["body"], "No articulated biting jaw invented."),
		group("tube-snouted-fish", ["Seahorse", "Pipefish"], ["fish"], ["water"], ["body"], "No conventional jaw bite; feeding/suction contact needs a specific observation."),
		group("mudskipper", ["Mudskipper"], ["fish"], ["water", "ground"], ["body", "bite"], "Amphibious pectoral support, never quadruped paws."),
		group("predatory-shark", [
			"Juvenile Shark",
			"Shark",
			"Reef Shark",
			"Hammerhead Shark",
			"Great White Shark",
			"Tiger Shark",
			"Mako Shark"
		], ["fish"], ["water"], ["bite"], ""),
		group("filter-shark", ["Whale Shark", "Basking Shark"], ["fish"], ["water"], ["body"], "No predatory bite inferred from shark family."),
		group("ray", [
			"Ray",
			"Manta Ray",
			"Eagle Ray"
		], ["fish"], ["water"], ["body"], "Disc/pectoral fins; stinging tail not inferred from a broad ray identity."),
		group("stingray", ["Stingray"], ["fish"], ["water"], ["tail"], "Tail barb must be observed; existing generic fish bite is not appropriate."),
		group("cephalopod", [
			"Squid",
			"Octopus",
			"Cuttlefish",
			"Giant Octopus",
			"Giant Squid",
			"Vampire Squid",
			"Deep-Sea Octopus",
			"Nautilus"
		], ["cephalopod"], ["water"], ["lash", "bite"], "Preserve arm/tentacle counts and shell; Nautilus does not inherit exactly eight arms."),
		group("cnidarian", [
			"Jellyfish",
			"Portuguese Man-of-War",
			"Sea Anemone",
			"Coral",
			"Cold-Water Coral",
			"Deep-Water Coral"
		], ["radial"], ["water"], ["sting-arms"], "Colony/sessile forms need anchored topology, not swimming-bell motion."),
		group("comb-jelly", ["Comb Jelly"], ["radial"], ["water"], ["body"], "No cnidarian sting inferred."),
		group("echinoderm", [
			"Starfish",
			"Sea Urchin",
			"Sea Cucumber",
			"Sand Dollar",
			"Brittle Star"
		], ["radial"], ["water"], ["body"], "No universal sting, jaw or jellyfish bell."),
		group("sponge", ["Sponge"], ["sessile-filter"], ["water"], [], "Sessile filtration; effect-only combat needs a verified root/colony anchor.", true),
		group("sessile-tunicate", ["Sea Squirt"], ["sessile-filter"], ["water"], [], "Sessile or colonial suspension feeders; no invented jaws, legs or arms.", true),
		group("tunicate", ["Salp", "Pyrosome"], ["colonial-filter"], ["water"], [], "Sessile or colonial suspension feeders; no invented jaws, legs or arms.", true),
		group("bivalve", [
			"Mussel",
			"Oyster",
			"Clam",
			"Razor Clam",
			"Giant Clam",
			"Scallop"
		], ["bivalve"], ["water"], [], "Valve closure/jet escape needs a valve rig; do not call it a bite.", true),
		group("land-gastropod", [
			"Land Snail",
			"Banana Slug",
			"Snail"
		], ["gastropod"], ["ground"], [], "Foot-wave/retraction needs a gastropod body; no leg or snake-jaw substitution.", true),
		group("water-gastropod", [
			"Freshwater Snail",
			"Water Snail",
			"Sea Snail",
			"Limpet",
			"Chiton",
			"Nudibranch",
			"Cowrie",
			"Conch",
			"Abalone"
		], ["gastropod"], ["water"], [], "Radula/mantle/foot are not a fish bite or jellyfish arms.", true),
		group("annelid-land", ["Earthworm", "Ice Worm"], ["annelid"], ["ground"], [], "Segmented body compression needs observed source geometry.", true),
		group("annelid-water", [
			"Leech",
			"Marine Worm",
			"Tube Worm",
			"Polychaete Worm",
			"Giant Tube Worm",
			"Scale Worm",
			"Flatworm"
		], ["annelid"], ["water"], [], "Different feeding structures; no universal jaw or venom.", true),
		group("observed-crab", [
			"Freshwater Crab",
			"Crab",
			"Mud Crab",
			"Vent Crab"
		], ["brachyuran"], ["water", "ground"], ["pinch"], "Observed palm/fixed finger/dactyl and contact landmark required; profile alone is not admission."),
		group("fiddler-crab", ["Fiddler Crab"], ["brachyuran"], ["water", "ground"], ["pinch"], "Pincer, walking-leg and abdomen counts need a crustacean topology; do not substitute spider chelicerae.", true),
		group("clawed-crustacean", [
			"Crayfish",
			"Hermit Crab",
			"Lobster"
		], ["crustacean-clawed"], ["water", "ground"], ["pinch"], "Pincer, walking-leg and abdomen counts need a crustacean topology; do not substitute spider chelicerae.", true),
		group("shrimp-prawn", [
			"Cave Shrimp",
			"Freshwater Shrimp",
			"Shrimp",
			"Prawn",
			"Vent Shrimp"
		], ["crustacean-small"], ["water"], ["claw"], "Observed bilateral foreleg root/knee/tip strike; no articulated pincer closure without fixed/dactyl landmarks.", true),
		group("small-crustacean", [
			"Brine Shrimp",
			"Water Flea",
			"Krill",
			"Copepod",
			"Amphipod",
			"Giant Isopod",
			"Isopod",
			"Fairy Shrimp",
			"Tadpole Shrimp"
		], ["crustacean-small"], ["water"], [], "Observed segmented swimming/crawling appendages; no generic stinger.", true),
		group("barnacle", ["Barnacle"], ["barnacle"], ["water"], [], "Anchored feeding cirri, no locomotor leap.", true),
		group("horseshoe-crab", ["Horseshoe Crab"], ["xiphosuran"], ["water", "ground"], [], "Telson is not a venomous stinger; dedicated topology needed.", true),
		group("spider", ["Tarantula", "Spider"], ["arachnid"], ["ground"], ["bite"], "No scorpion stinger."),
		group("scorpion", ["Scorpion"], ["arachnid"], ["ground"], ["sting", "bite"], ""),
		group("other-arachnid", [
			"Deer Tick",
			"Camel Spider",
			"Harvestman",
			"Pseudoscorpion",
			"Mite",
			"Sea Spider"
		], ["arachnid"], ["ground"], ["body"], "Distinct mouth/palp/pincer inventories; no scorpion tail assigned."),
		group("centipede", ["Centipede", "Giant Centipede"], ["myriapod"], ["ground"], ["mandible"], "Venom claws are at the head; no rear stinger."),
		group("millipede", ["Millipede"], ["myriapod"], ["ground"], ["body"], "No centipede forcipules or tail sting."),
		group("mandibulate-insect", [
			"Leafcutter Ant",
			"Termite",
			"Mantis",
			"Locust",
			"Dung Beetle",
			"Beetle",
			"Grasshopper",
			"Cricket",
			"Ant",
			"Honeybee",
			"Bumblebee",
			"Ladybug",
			"Bee",
			"Orchid Bee",
			"Water Beetle",
			"Caddisfly",
			"Stonefly",
			"Dragonfly",
			"Damselfly",
			"Diving Beetle",
			"Cave Cricket",
			"Cockroach",
			"Wasp",
			"Carrion Beetle",
			"Stick Insect",
			"Firefly",
			"Dobsonfly"
		], ["insect"], ["ground"], ["mandible"], "Wings/stings are conditional; ant/termite castes and aquatic larvae must retain their actual stage. Flight requires a source habitat declaration for the observed stage."),
		group("soft-mouth-insect", [
			"Butterfly",
			"Cicada",
			"Mosquito",
			"Black Fly",
			"Moth",
			"Aphid",
			"Fly",
			"Cold-Adapted Insect",
			"Mayfly",
			"Scorpionfly",
			"Thrips"
		], ["insect"], ["air", "ground"], ["body"], "Proboscis/stylet/body/effect motion; no chewing mandible or scorpion sting inferred."),
		group("aquatic-insect", ["Water Strider", "Giant Water Bug"], ["insect"], [
			"water",
			"ground",
			"air"
		], ["body"], "Surface/piercing mouthparts need observation; no submerged fish pose."),
		group("larva", ["Fly Larvae"], ["larva"], ["water", "ground"], [], "Life stage cannot inherit adult wings or adult six-leg graph.", true),
		group("springtail", ["Springtail"], ["insect"], ["ground"], ["body"], "Furcula jump needs observed spring organ, not a stinger."),
		group("tardigrade", ["Tardigrade"], ["lobopod"], ["water", "ground"], [], "Eight lobopod legs and stylets require exact topology; no arachnid fangs.", true),
		group("pheasant", ["Pheasant"], ["biped-bird"], ["air", "ground"], ["peck", "claw"], "Foot rake on the observed foot, not an inferred raptor talon."),
		group("terrestrial-crab", ["Coconut Crab"], ["brachyuran"], ["ground"], ["pinch"], "Observed pincer/leg topology required; adult is not a submerged aquatic fighter.")
	]);
	byName = /* @__PURE__ */ new Map();
	for (const profile of EARTH_FAUNA_PROFILES) for (const name of profile.names) {
		if (byName.has(name)) throw Error("Duplicate Earth fauna profile: " + name);
		byName.set(name, profile);
	}
}));
//#endregion
//#region port/v2/packages/domain/biome-profile/src/index.ts
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
var BIOME_PROFILE_SCHEMA_V1, BIOME_PROFILE_KEYS_V1, FAUNA, FLORA, HAZARDS, WEATHER, AUTHORED_BIOME_PROFILE_ENTRIES_V1, DIGEST_SEEDS, BIOME_PROFILE_AUTHORITY_V1;
var init_src = __esmMin((() => {
	BIOME_PROFILE_SCHEMA_V1 = "cf.domain.biome-profile.v1";
	BIOME_PROFILE_KEYS_V1 = Object.freeze([
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
	FAUNA = Object.freeze([
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
	FLORA = Object.freeze([
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
	HAZARDS = Object.freeze([
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
	WEATHER = Object.freeze([
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
	AUTHORED_BIOME_PROFILE_ENTRIES_V1 = [
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
	DIGEST_SEEDS = Object.freeze([
		2166136261,
		2654435769,
		2246822507,
		3266489909
	]);
	BIOME_PROFILE_AUTHORITY_V1 = createBiomeProfileAuthorityV1(AUTHORED_BIOME_PROFILE_ENTRIES_V1);
	BIOME_PROFILE_AUTHORITY_V1.profiles;
}));
//#endregion
//#region port/v2/apps/game/src/battle-habitat.ts
function resolvePhysicalHabitat(record, genome) {
	let realm, source, liquid = null, profileMedia;
	if (record.habitat) {
		const h = record.habitat;
		if (!REALMS.includes(h.realm) || !h.source?.trim()) throw Error("Habitat: invalid source declaration");
		realm = h.realm;
		source = h.source;
		liquid = h.liquid ?? null;
	} else if (record.identity.earthName) {
		profileMedia = earthFaunaProfile(record.identity.earthName)?.media;
		const preferred = profileMedia?.[0];
		realm = preferred === "air" ? "aerial" : profileMedia?.includes("ground") && profileMedia.includes("water") ? "amphibious" : preferred === "water" ? "aquatic" : preferred === "ground" ? "land" : void 0;
		source = "exact-name Earth fauna presentation profile";
	} else if (genome) {
		if (genome.kingdom !== void 0 && genome.kingdom !== "fauna") throw Error("Habitat: non-fauna needs a source habitat declaration");
		const habitat = String(habOf(genome)), loco = String(locoOf(genome));
		realm = /cloud deck/.test(habitat) ? "gas-giant" : /swim|jet|current/.test(loco) || /ocean|reef|shallows|vent field|methane lake|ammonia-sea/.test(habitat) ? "aquatic" : /glid|float|drift/.test(loco) ? "aerial" : /wetland|delta|mangrove/.test(habitat) ? "amphibious" : FAMILY[record.template.id];
		liquid = /methane/.test(habitat) ? "methane" : /ammonia/.test(habitat) ? "ammonia" : null;
		source = "source genome habitat/locomotion + resolved anatomy";
	} else {
		realm = FAMILY[record.template.id];
		source = "resolved anatomy family";
	}
	if (!realm) throw Error("Habitat: unresolved physical realm; source declaration required");
	const allowed = profileMedia ?? (realm === "aquatic" ? ["water"] : realm === "aerial" || realm === "gas-giant" ? ["air"] : realm === "amphibious" ? ["ground", "water"] : ["ground"]);
	return Object.freeze({
		realm,
		preferred: allowed[0],
		allowed: Object.freeze(allowed),
		source,
		requiresAtmosphere: Boolean(record.identity.earthName) && allowed.some((m) => m !== "water"),
		liquid: allowed.includes("water") ? liquid ?? "water" : null
	});
}
var REALMS, FAMILY;
var init_battle_habitat = __esmMin((() => {
	init_src$1();
	init_earth_fauna_profiles();
	init_src();
	REALMS = [
		"land",
		"aerial",
		"aquatic",
		"amphibious",
		"gas-giant"
	];
	FAMILY = Object.freeze({
		quadruped: "land",
		hopper: "amphibious",
		"biped-bird": "aerial",
		fish: "aquatic",
		insect: "land",
		serpent: "land",
		arachnid: "land",
		radial: "aquatic",
		"plant-woody": "land",
		"plant-herb": "land",
		myriapod: "land",
		cephalopod: "aquatic",
		"flyer-membrane": "aerial",
		primate: "land"
	});
}));
//#endregion
//#region port/v2/tools/creature-animation/family-contracts.mjs
function contactStanceForAction(template, actionId) {
	const c = template.contactStance;
	return c?.actions?.[actionId] ?? c?.actions?.[actionId.split(":")[0] + ":*"] ?? c?.default ?? "all";
}
function familyContract(id) {
	const value = SPECIALIZED_TEMPLATES[id] ?? FAMILY_CONTRACTS.find((t) => t.id === id);
	if (!value) throw Error("Family admission: unknown template " + id);
	return value.id === "brachyuran" ? freeze({
		...value,
		contactStance: {
			default: "all",
			actions: {}
		},
		contactLimitsDeg: {
			...value.limitsDeg,
			...Object.fromEntries(value.legs.flatMap((id) => Object.entries({
				Knee: 75,
				Foot: 105
			}).map(([joint, max]) => [id + joint, {
				min: -max,
				max
			}])))
		}
	}) : value;
}
function familyContractForRecord(record) {
	return projectTemplateLimits(resolveFixedAttachments(resolveAnatomyInventory(familyContract(record.template.id), record.anatomy), record), record);
}
/** Declared leg-chain convention, resolved only within a template's own graph.
* No landmark search and no fabricated joints. Terminal paint is independent
* from the two-bone endpoint (Ankle→Paw/Foot versus Knee→Foot). */
function familyContactChains(template) {
	const parents = new Map(template.graph), out = [];
	for (const [i, id] of template.legs.entries()) {
		if (template.hiddenChains?.includes(id)) continue;
		const knee = id + "Knee", ankle = id + "Ankle", foot = id + "Foot", end = parents.has(ankle) ? ankle : foot;
		const hip = parents.get(knee), terminal = parents.has(id + "Paw") ? id + "Paw" : end === ankle && parents.has(foot) ? foot : null;
		if (!hip || parents.get(end) !== knee || terminal && parents.get(terminal) !== end) throw Error("Contact contract: unsupported leg " + id);
		out.push(Object.freeze({
			id,
			hip,
			knee,
			end,
			terminal,
			group: (Math.floor(i / 2) + i % 2) % 2
		}));
	}
	return Object.freeze(out);
}
var contracts, freeze, quadrupedContact, FAMILY_CONTRACTS;
var init_family_contracts = __esmMin((() => {
	init_specialized_templates();
	init_pose_projection();
	init_anatomy_inventory();
	init_fixed_attachments();
	contracts = [
		{
			"id": "quadruped",
			"version": 1,
			"clipSetId": "quadruped-land-v1",
			"graph": [
				["pelvis", "root"],
				["spine", "pelvis"],
				["chest", "spine"],
				["neck", "chest"],
				["head", "neck"],
				["jaw", "head"],
				["hindFarRoot", "pelvis"],
				["hindFarKnee", "hindFarRoot"],
				["hindFarAnkle", "hindFarKnee"],
				["hindFarPaw", "hindFarAnkle"],
				["foreFarRoot", "chest"],
				["foreFarKnee", "foreFarRoot"],
				["foreFarAnkle", "foreFarKnee"],
				["foreFarPaw", "foreFarAnkle"],
				["hindNearRoot", "pelvis"],
				["hindNearKnee", "hindNearRoot"],
				["hindNearAnkle", "hindNearKnee"],
				["hindNearPaw", "hindNearAnkle"],
				["foreNearRoot", "chest"],
				["foreNearKnee", "foreNearRoot"],
				["foreNearAnkle", "foreNearKnee"],
				["foreNearPaw", "foreNearAnkle"],
				["tail0", "pelvis"],
				["tail1", "tail0"],
				["tail2", "tail1"],
				["tail3", "tail2"],
				["earFarRoot", "head"],
				["earFarTip", "earFarRoot"],
				["earNearRoot", "head"],
				["earNearTip", "earNearRoot"]
			],
			"bodyAxis": ["pelvis", "chest"],
			"joints": [
				"root",
				"pelvis",
				"spine",
				"chest",
				"neck",
				"head",
				"jaw",
				"hindFarRoot",
				"hindFarKnee",
				"hindFarAnkle",
				"hindFarPaw",
				"foreFarRoot",
				"foreFarKnee",
				"foreFarAnkle",
				"foreFarPaw",
				"hindNearRoot",
				"hindNearKnee",
				"hindNearAnkle",
				"hindNearPaw",
				"foreNearRoot",
				"foreNearKnee",
				"foreNearAnkle",
				"foreNearPaw",
				"tail0",
				"tail1",
				"tail2",
				"tail3",
				"earFarRoot",
				"earFarTip",
				"earNearRoot",
				"earNearTip"
			],
			"legs": [
				"hindFar",
				"foreFar",
				"hindNear",
				"foreNear"
			],
			"limitsDeg": {
				"root": {
					"min": -15,
					"max": 15
				},
				"pelvis": {
					"min": -20,
					"max": 20
				},
				"spine": {
					"min": -25,
					"max": 25
				},
				"chest": {
					"min": -20,
					"max": 20
				},
				"neck": {
					"min": -35,
					"max": 35
				},
				"head": {
					"min": -35,
					"max": 35
				},
				"jaw": {
					"min": -30,
					"max": 5
				},
				"hindFarRoot": {
					"min": -60,
					"max": 60
				},
				"hindFarKnee": {
					"min": -75,
					"max": 75
				},
				"hindFarAnkle": {
					"min": -60,
					"max": 60
				},
				"hindFarPaw": {
					"min": -40,
					"max": 40
				},
				"foreFarRoot": {
					"min": -60,
					"max": 60
				},
				"foreFarKnee": {
					"min": -75,
					"max": 75
				},
				"foreFarAnkle": {
					"min": -60,
					"max": 60
				},
				"foreFarPaw": {
					"min": -40,
					"max": 40
				},
				"hindNearRoot": {
					"min": -60,
					"max": 60
				},
				"hindNearKnee": {
					"min": -75,
					"max": 75
				},
				"hindNearAnkle": {
					"min": -60,
					"max": 60
				},
				"hindNearPaw": {
					"min": -40,
					"max": 40
				},
				"foreNearRoot": {
					"min": -60,
					"max": 60
				},
				"foreNearKnee": {
					"min": -75,
					"max": 75
				},
				"foreNearAnkle": {
					"min": -60,
					"max": 60
				},
				"foreNearPaw": {
					"min": -40,
					"max": 40
				},
				"tail0": {
					"min": -40,
					"max": 40
				},
				"tail1": {
					"min": -50,
					"max": 50
				},
				"tail2": {
					"min": -50,
					"max": 50
				},
				"tail3": {
					"min": -50,
					"max": 50
				},
				"earFarRoot": {
					"min": -60,
					"max": 60
				},
				"earFarTip": {
					"min": -40,
					"max": 40
				},
				"earNearRoot": {
					"min": -60,
					"max": 60
				},
				"earNearTip": {
					"min": -40,
					"max": 40
				}
			},
			"bounds": [
				{
					"id": "torso",
					"min": .08,
					"max": .65,
					"kind": "distance",
					"axis": ["pelvis", "chest"]
				},
				{
					"id": "head",
					"min": .015,
					"max": .75,
					"kind": "distance",
					"axis": ["neck", "head"]
				},
				{
					"id": "head/torso",
					"min": .02,
					"max": 1.6,
					"kind": "ratio",
					"bones": ["head"],
					"axis": ["pelvis", "chest"]
				},
				{
					"id": "bone-min",
					"min": .001,
					"max": .75,
					"kind": "bone-min"
				},
				{
					"id": "bone-max",
					"min": .001,
					"max": .75,
					"kind": "bone-max"
				},
				{
					"id": "leg/torso:hindFar",
					"min": .25,
					"max": 2.7,
					"kind": "ratio",
					"bones": [
						"hindFarKnee",
						"hindFarAnkle",
						"hindFarPaw"
					],
					"axis": ["pelvis", "chest"]
				},
				{
					"id": "leg/torso:foreFar",
					"min": .25,
					"max": 2.7,
					"kind": "ratio",
					"bones": [
						"foreFarKnee",
						"foreFarAnkle",
						"foreFarPaw"
					],
					"axis": ["pelvis", "chest"]
				},
				{
					"id": "leg/torso:hindNear",
					"min": .25,
					"max": 2.7,
					"kind": "ratio",
					"bones": [
						"hindNearKnee",
						"hindNearAnkle",
						"hindNearPaw"
					],
					"axis": ["pelvis", "chest"]
				},
				{
					"id": "leg/torso:foreNear",
					"min": .25,
					"max": 2.7,
					"kind": "ratio",
					"bones": [
						"foreNearKnee",
						"foreNearAnkle",
						"foreNearPaw"
					],
					"axis": ["pelvis", "chest"]
				}
			]
		},
		{
			"id": "hopper",
			"version": 1,
			"clipSetId": "hopper-land-v1",
			"graph": [
				["pelvis", "root"],
				["spine", "pelvis"],
				["chest", "spine"],
				["neck", "chest"],
				["head", "neck"],
				["jaw", "head"],
				["hindFarRoot", "pelvis"],
				["hindFarKnee", "hindFarRoot"],
				["hindFarAnkle", "hindFarKnee"],
				["hindFarPaw", "hindFarAnkle"],
				["foreFarRoot", "chest"],
				["foreFarKnee", "foreFarRoot"],
				["foreFarAnkle", "foreFarKnee"],
				["foreFarPaw", "foreFarAnkle"],
				["hindNearRoot", "pelvis"],
				["hindNearKnee", "hindNearRoot"],
				["hindNearAnkle", "hindNearKnee"],
				["hindNearPaw", "hindNearAnkle"],
				["foreNearRoot", "chest"],
				["foreNearKnee", "foreNearRoot"],
				["foreNearAnkle", "foreNearKnee"],
				["foreNearPaw", "foreNearAnkle"],
				["tail0", "pelvis"],
				["tail1", "tail0"],
				["tail2", "tail1"],
				["tail3", "tail2"],
				["earFarRoot", "head"],
				["earFarTip", "earFarRoot"],
				["earNearRoot", "head"],
				["earNearTip", "earNearRoot"]
			],
			"bodyAxis": ["pelvis", "chest"],
			"joints": [
				"root",
				"pelvis",
				"spine",
				"chest",
				"neck",
				"head",
				"jaw",
				"hindFarRoot",
				"hindFarKnee",
				"hindFarAnkle",
				"hindFarPaw",
				"foreFarRoot",
				"foreFarKnee",
				"foreFarAnkle",
				"foreFarPaw",
				"hindNearRoot",
				"hindNearKnee",
				"hindNearAnkle",
				"hindNearPaw",
				"foreNearRoot",
				"foreNearKnee",
				"foreNearAnkle",
				"foreNearPaw",
				"tail0",
				"tail1",
				"tail2",
				"tail3",
				"earFarRoot",
				"earFarTip",
				"earNearRoot",
				"earNearTip"
			],
			"legs": [
				"hindFar",
				"foreFar",
				"hindNear",
				"foreNear"
			],
			"limitsDeg": {
				"root": {
					"min": -30,
					"max": 30
				},
				"pelvis": {
					"min": -25,
					"max": 25
				},
				"spine": {
					"min": -30,
					"max": 30
				},
				"chest": {
					"min": -20,
					"max": 20
				},
				"neck": {
					"min": -35,
					"max": 35
				},
				"head": {
					"min": -35,
					"max": 35
				},
				"jaw": {
					"min": -30,
					"max": 5
				},
				"hindFarRoot": {
					"min": -70,
					"max": 70
				},
				"hindFarKnee": {
					"min": -110,
					"max": 110
				},
				"hindFarAnkle": {
					"min": -110,
					"max": 110
				},
				"hindFarPaw": {
					"min": -45,
					"max": 45
				},
				"foreFarRoot": {
					"min": -60,
					"max": 60
				},
				"foreFarKnee": {
					"min": -75,
					"max": 75
				},
				"foreFarAnkle": {
					"min": -60,
					"max": 60
				},
				"foreFarPaw": {
					"min": -45,
					"max": 45
				},
				"hindNearRoot": {
					"min": -70,
					"max": 70
				},
				"hindNearKnee": {
					"min": -110,
					"max": 110
				},
				"hindNearAnkle": {
					"min": -110,
					"max": 110
				},
				"hindNearPaw": {
					"min": -45,
					"max": 45
				},
				"foreNearRoot": {
					"min": -60,
					"max": 60
				},
				"foreNearKnee": {
					"min": -75,
					"max": 75
				},
				"foreNearAnkle": {
					"min": -60,
					"max": 60
				},
				"foreNearPaw": {
					"min": -45,
					"max": 45
				},
				"tail0": {
					"min": -40,
					"max": 40
				},
				"tail1": {
					"min": -50,
					"max": 50
				},
				"tail2": {
					"min": -50,
					"max": 50
				},
				"tail3": {
					"min": -50,
					"max": 50
				},
				"earFarRoot": {
					"min": -30,
					"max": 30
				},
				"earFarTip": {
					"min": -40,
					"max": 40
				},
				"earNearRoot": {
					"min": -30,
					"max": 30
				},
				"earNearTip": {
					"min": -40,
					"max": 40
				}
			},
			"bounds": [
				{
					"id": "body",
					"min": .08,
					"max": .65,
					"kind": "distance",
					"axis": ["pelvis", "chest"]
				},
				{
					"id": "bone-min",
					"min": .001,
					"max": .75,
					"kind": "bone-min"
				},
				{
					"id": "bone-max",
					"min": .001,
					"max": .75,
					"kind": "bone-max"
				},
				{
					"id": "leg/torso:hindFar",
					"min": .25,
					"max": 3.2,
					"kind": "ratio",
					"bones": [
						"hindFarKnee",
						"hindFarAnkle",
						"hindFarPaw"
					],
					"axis": ["pelvis", "chest"]
				},
				{
					"id": "leg/torso:foreFar",
					"min": .25,
					"max": 3.2,
					"kind": "ratio",
					"bones": [
						"foreFarKnee",
						"foreFarAnkle",
						"foreFarPaw"
					],
					"axis": ["pelvis", "chest"]
				},
				{
					"id": "leg/torso:hindNear",
					"min": .25,
					"max": 3.2,
					"kind": "ratio",
					"bones": [
						"hindNearKnee",
						"hindNearAnkle",
						"hindNearPaw"
					],
					"axis": ["pelvis", "chest"]
				},
				{
					"id": "leg/torso:foreNear",
					"min": .25,
					"max": 3.2,
					"kind": "ratio",
					"bones": [
						"foreNearKnee",
						"foreNearAnkle",
						"foreNearPaw"
					],
					"axis": ["pelvis", "chest"]
				}
			]
		},
		{
			"id": "biped-bird",
			"version": 1,
			"clipSetId": "biped-bird-v1",
			"graph": [
				["pelvis", "root"],
				["spine", "pelvis"],
				["chest", "spine"],
				["neck0", "chest"],
				["neck1", "neck0"],
				["head", "neck1"],
				["beak", "head"],
				["legFarKnee", "pelvis"],
				["legFarAnkle", "legFarKnee"],
				["legFarFoot", "legFarAnkle"],
				["legNearKnee", "pelvis"],
				["legNearAnkle", "legNearKnee"],
				["legNearFoot", "legNearAnkle"],
				["wingFarRoot", "chest"],
				["wingFarTip", "wingFarRoot"],
				["wingNearRoot", "chest"],
				["wingNearTip", "wingNearRoot"],
				["tailFan", "pelvis"]
			],
			"bodyAxis": ["pelvis", "chest"],
			"joints": [
				"root",
				"pelvis",
				"spine",
				"chest",
				"neck0",
				"neck1",
				"head",
				"beak",
				"legFarKnee",
				"legFarAnkle",
				"legFarFoot",
				"legNearKnee",
				"legNearAnkle",
				"legNearFoot",
				"wingFarRoot",
				"wingFarTip",
				"wingNearRoot",
				"wingNearTip",
				"tailFan"
			],
			"legs": ["legFar", "legNear"],
			"limitsDeg": {
				"root": {
					"min": -25,
					"max": 25
				},
				"pelvis": {
					"min": -20,
					"max": 20
				},
				"spine": {
					"min": -25,
					"max": 25
				},
				"chest": {
					"min": -20,
					"max": 20
				},
				"neck0": {
					"min": -45,
					"max": 45
				},
				"neck1": {
					"min": -45,
					"max": 45
				},
				"head": {
					"min": -40,
					"max": 40
				},
				"beak": {
					"min": -30,
					"max": 5
				},
				"legFarKnee": {
					"min": -70,
					"max": 70
				},
				"legFarAnkle": {
					"min": -85,
					"max": 85
				},
				"legFarFoot": {
					"min": -45,
					"max": 45
				},
				"legNearKnee": {
					"min": -70,
					"max": 70
				},
				"legNearAnkle": {
					"min": -85,
					"max": 85
				},
				"legNearFoot": {
					"min": -45,
					"max": 45
				},
				"wingFarRoot": {
					"min": -60,
					"max": 95
				},
				"wingFarTip": {
					"min": -70,
					"max": 70
				},
				"wingNearRoot": {
					"min": -60,
					"max": 95
				},
				"wingNearTip": {
					"min": -70,
					"max": 70
				},
				"tailFan": {
					"min": -40,
					"max": 40
				}
			},
			"bounds": [
				{
					"id": "body",
					"min": .06,
					"max": .65,
					"kind": "distance",
					"axis": ["pelvis", "chest"]
				},
				{
					"id": "bone-min",
					"min": .001,
					"max": .75,
					"kind": "bone-min"
				},
				{
					"id": "bone-max",
					"min": .001,
					"max": .75,
					"kind": "bone-max"
				},
				{
					"id": "leg/torso:legFar",
					"min": .3,
					"max": 3.5,
					"kind": "ratio",
					"bones": [
						"legFarKnee",
						"legFarAnkle",
						"legFarFoot"
					],
					"axis": ["pelvis", "chest"]
				},
				{
					"id": "leg/torso:legNear",
					"min": .3,
					"max": 3.5,
					"kind": "ratio",
					"bones": [
						"legNearKnee",
						"legNearAnkle",
						"legNearFoot"
					],
					"axis": ["pelvis", "chest"]
				},
				{
					"id": "wing/torso",
					"min": .4,
					"max": 4.5,
					"kind": "ratio",
					"bones": ["wingFarRoot", "wingFarTip"],
					"axis": ["pelvis", "chest"]
				}
			]
		},
		{
			"id": "fish",
			"version": 1,
			"clipSetId": "fish-aquatic-v1",
			"graph": [
				["head", "root"],
				["jaw", "head"],
				["spine0", "root"],
				["spine1", "spine0"],
				["spine2", "spine1"],
				["spine3", "spine2"],
				["spine4", "spine3"],
				["spine5", "spine4"],
				["caudal", "spine5"],
				["dorsal", "spine1"],
				["pectoralFar", "root"],
				["pectoralNear", "root"]
			],
			"bodyAxis": ["spine0", "spine5"],
			"joints": [
				"root",
				"head",
				"jaw",
				"spine0",
				"spine1",
				"spine2",
				"spine3",
				"spine4",
				"spine5",
				"caudal",
				"dorsal",
				"pectoralFar",
				"pectoralNear"
			],
			"legs": [],
			"limitsDeg": {
				"root": {
					"min": -30,
					"max": 30
				},
				"head": {
					"min": -30,
					"max": 30
				},
				"jaw": {
					"min": -35,
					"max": 5
				},
				"spine0": {
					"min": -35,
					"max": 35
				},
				"spine1": {
					"min": -35,
					"max": 35
				},
				"spine2": {
					"min": -35,
					"max": 35
				},
				"spine3": {
					"min": -35,
					"max": 35
				},
				"spine4": {
					"min": -35,
					"max": 35
				},
				"spine5": {
					"min": -35,
					"max": 35
				},
				"caudal": {
					"min": -50,
					"max": 50
				},
				"dorsal": {
					"min": -35,
					"max": 35
				},
				"pectoralFar": {
					"min": -60,
					"max": 60
				},
				"pectoralNear": {
					"min": -60,
					"max": 60
				}
			},
			"bounds": [
				{
					"id": "body",
					"min": .1,
					"max": .85,
					"kind": "distance",
					"axis": ["spine0", "spine5"]
				},
				{
					"id": "bone-min",
					"min": .001,
					"max": .75,
					"kind": "bone-min"
				},
				{
					"id": "bone-max",
					"min": .001,
					"max": .75,
					"kind": "bone-max"
				},
				{
					"id": "caudal/body",
					"min": .05,
					"max": .9,
					"kind": "ratio",
					"bones": ["caudal"],
					"axis": ["spine0", "spine5"]
				},
				{
					"id": "head/body",
					"min": .04,
					"max": .8,
					"kind": "ratio",
					"bones": ["head"],
					"axis": ["spine0", "spine5"]
				}
			]
		},
		{
			"id": "insect",
			"version": 1,
			"clipSetId": "insect-v1",
			"graph": [
				["thorax", "root"],
				["head", "thorax"],
				["mandible", "head"],
				["abdomen", "thorax"],
				["legFrontFarKnee", "thorax"],
				["legFrontFarFoot", "legFrontFarKnee"],
				["legFrontNearKnee", "thorax"],
				["legFrontNearFoot", "legFrontNearKnee"],
				["legMidFarKnee", "thorax"],
				["legMidFarFoot", "legMidFarKnee"],
				["legMidNearKnee", "thorax"],
				["legMidNearFoot", "legMidNearKnee"],
				["legHindFarKnee", "thorax"],
				["legHindFarFoot", "legHindFarKnee"],
				["legHindNearKnee", "thorax"],
				["legHindNearFoot", "legHindNearKnee"],
				["antennaFar", "head"],
				["antennaNear", "head"],
				["wingFar", "thorax"],
				["wingNear", "thorax"]
			],
			"bodyAxis": ["abdomen", "head"],
			"joints": [
				"root",
				"thorax",
				"head",
				"mandible",
				"abdomen",
				"legFrontFarKnee",
				"legFrontFarFoot",
				"legFrontNearKnee",
				"legFrontNearFoot",
				"legMidFarKnee",
				"legMidFarFoot",
				"legMidNearKnee",
				"legMidNearFoot",
				"legHindFarKnee",
				"legHindFarFoot",
				"legHindNearKnee",
				"legHindNearFoot",
				"antennaFar",
				"antennaNear",
				"wingFar",
				"wingNear"
			],
			"legs": [
				"legFrontFar",
				"legFrontNear",
				"legMidFar",
				"legMidNear",
				"legHindFar",
				"legHindNear"
			],
			"limitsDeg": {
				"root": {
					"min": -25,
					"max": 25
				},
				"thorax": {
					"min": -15,
					"max": 15
				},
				"head": {
					"min": -35,
					"max": 35
				},
				"mandible": {
					"min": -40,
					"max": 5
				},
				"abdomen": {
					"min": -35,
					"max": 50
				},
				"legFrontFarKnee": {
					"min": -65,
					"max": 65
				},
				"legFrontFarFoot": {
					"min": -75,
					"max": 75
				},
				"legFrontNearKnee": {
					"min": -65,
					"max": 65
				},
				"legFrontNearFoot": {
					"min": -75,
					"max": 75
				},
				"legMidFarKnee": {
					"min": -65,
					"max": 65
				},
				"legMidFarFoot": {
					"min": -75,
					"max": 75
				},
				"legMidNearKnee": {
					"min": -65,
					"max": 65
				},
				"legMidNearFoot": {
					"min": -75,
					"max": 75
				},
				"legHindFarKnee": {
					"min": -65,
					"max": 65
				},
				"legHindFarFoot": {
					"min": -75,
					"max": 75
				},
				"legHindNearKnee": {
					"min": -65,
					"max": 65
				},
				"legHindNearFoot": {
					"min": -75,
					"max": 75
				},
				"antennaFar": {
					"min": -50,
					"max": 50
				},
				"antennaNear": {
					"min": -50,
					"max": 50
				},
				"wingFar": {
					"min": -85,
					"max": 85
				},
				"wingNear": {
					"min": -85,
					"max": 85
				}
			},
			"bounds": [
				{
					"id": "body",
					"min": .08,
					"max": .85,
					"kind": "distance",
					"axis": ["abdomen", "head"]
				},
				{
					"id": "bone-min",
					"min": .001,
					"max": .75,
					"kind": "bone-min"
				},
				{
					"id": "bone-max",
					"min": .001,
					"max": .75,
					"kind": "bone-max"
				},
				{
					"id": "leg/body:legFrontFar",
					"min": .1,
					"max": 2.5,
					"kind": "ratio",
					"bones": ["legFrontFarKnee", "legFrontFarFoot"],
					"axis": ["abdomen", "head"]
				},
				{
					"id": "leg/body:legFrontNear",
					"min": .1,
					"max": 2.5,
					"kind": "ratio",
					"bones": ["legFrontNearKnee", "legFrontNearFoot"],
					"axis": ["abdomen", "head"]
				},
				{
					"id": "leg/body:legMidFar",
					"min": .1,
					"max": 2.5,
					"kind": "ratio",
					"bones": ["legMidFarKnee", "legMidFarFoot"],
					"axis": ["abdomen", "head"]
				},
				{
					"id": "leg/body:legMidNear",
					"min": .1,
					"max": 2.5,
					"kind": "ratio",
					"bones": ["legMidNearKnee", "legMidNearFoot"],
					"axis": ["abdomen", "head"]
				},
				{
					"id": "leg/body:legHindFar",
					"min": .1,
					"max": 2.5,
					"kind": "ratio",
					"bones": ["legHindFarKnee", "legHindFarFoot"],
					"axis": ["abdomen", "head"]
				},
				{
					"id": "leg/body:legHindNear",
					"min": .1,
					"max": 2.5,
					"kind": "ratio",
					"bones": ["legHindNearKnee", "legHindNearFoot"],
					"axis": ["abdomen", "head"]
				}
			]
		},
		{
			"id": "serpent",
			"version": 1,
			"clipSetId": "serpent-v1",
			"graph": [
				["head", "root"],
				["jaw", "head"],
				["seg0", "root"],
				["seg1", "seg0"],
				["seg2", "seg1"],
				["seg3", "seg2"],
				["seg4", "seg3"],
				["seg5", "seg4"],
				["seg6", "seg5"],
				["seg7", "seg6"],
				["seg8", "seg7"],
				["seg9", "seg8"]
			],
			"bodyAxis": ["seg0", "seg9"],
			"joints": [
				"root",
				"head",
				"jaw",
				"seg0",
				"seg1",
				"seg2",
				"seg3",
				"seg4",
				"seg5",
				"seg6",
				"seg7",
				"seg8",
				"seg9"
			],
			"legs": [],
			"limitsDeg": {
				"root": {
					"min": -25,
					"max": 25
				},
				"head": {
					"min": -50,
					"max": 50
				},
				"jaw": {
					"min": -45,
					"max": 5
				},
				"seg0": {
					"min": -45,
					"max": 45
				},
				"seg1": {
					"min": -45,
					"max": 45
				},
				"seg2": {
					"min": -45,
					"max": 45
				},
				"seg3": {
					"min": -45,
					"max": 45
				},
				"seg4": {
					"min": -45,
					"max": 45
				},
				"seg5": {
					"min": -45,
					"max": 45
				},
				"seg6": {
					"min": -45,
					"max": 45
				},
				"seg7": {
					"min": -45,
					"max": 45
				},
				"seg8": {
					"min": -45,
					"max": 45
				},
				"seg9": {
					"min": -45,
					"max": 45
				}
			},
			"bounds": [
				{
					"id": "body",
					"min": .1,
					"max": .9,
					"kind": "distance",
					"axis": ["seg0", "seg9"]
				},
				{
					"id": "bone-min",
					"min": .001,
					"max": .75,
					"kind": "bone-min"
				},
				{
					"id": "bone-max",
					"min": .001,
					"max": .75,
					"kind": "bone-max"
				},
				{
					"id": "head/body",
					"min": .02,
					"max": .5,
					"kind": "ratio",
					"bones": ["head"],
					"axis": ["seg0", "seg9"]
				}
			]
		},
		{
			"id": "arachnid",
			"version": 1,
			"clipSetId": "arachnid-v1",
			"graph": [
				["cephalothorax", "root"],
				["abdomen", "cephalothorax"],
				["sting", "abdomen"],
				["cheliceraFar", "cephalothorax"],
				["cheliceraNear", "cephalothorax"],
				["leg1FarKnee", "cephalothorax"],
				["leg1FarFoot", "leg1FarKnee"],
				["leg1NearKnee", "cephalothorax"],
				["leg1NearFoot", "leg1NearKnee"],
				["leg2FarKnee", "cephalothorax"],
				["leg2FarFoot", "leg2FarKnee"],
				["leg2NearKnee", "cephalothorax"],
				["leg2NearFoot", "leg2NearKnee"],
				["leg3FarKnee", "cephalothorax"],
				["leg3FarFoot", "leg3FarKnee"],
				["leg3NearKnee", "cephalothorax"],
				["leg3NearFoot", "leg3NearKnee"],
				["leg4FarKnee", "cephalothorax"],
				["leg4FarFoot", "leg4FarKnee"],
				["leg4NearKnee", "cephalothorax"],
				["leg4NearFoot", "leg4NearKnee"]
			],
			"bodyAxis": ["abdomen", "cephalothorax"],
			"joints": [
				"root",
				"cephalothorax",
				"abdomen",
				"sting",
				"cheliceraFar",
				"cheliceraNear",
				"leg1FarKnee",
				"leg1FarFoot",
				"leg1NearKnee",
				"leg1NearFoot",
				"leg2FarKnee",
				"leg2FarFoot",
				"leg2NearKnee",
				"leg2NearFoot",
				"leg3FarKnee",
				"leg3FarFoot",
				"leg3NearKnee",
				"leg3NearFoot",
				"leg4FarKnee",
				"leg4FarFoot",
				"leg4NearKnee",
				"leg4NearFoot"
			],
			"legs": [
				"leg1Far",
				"leg1Near",
				"leg2Far",
				"leg2Near",
				"leg3Far",
				"leg3Near",
				"leg4Far",
				"leg4Near"
			],
			"limitsDeg": {
				"root": {
					"min": -25,
					"max": 25
				},
				"cephalothorax": {
					"min": -15,
					"max": 15
				},
				"abdomen": {
					"min": -35,
					"max": 65
				},
				"sting": {
					"min": -70,
					"max": 70
				},
				"cheliceraFar": {
					"min": -45,
					"max": 45
				},
				"cheliceraNear": {
					"min": -45,
					"max": 45
				},
				"leg1FarKnee": {
					"min": -65,
					"max": 65
				},
				"leg1FarFoot": {
					"min": -75,
					"max": 75
				},
				"leg1NearKnee": {
					"min": -65,
					"max": 65
				},
				"leg1NearFoot": {
					"min": -75,
					"max": 75
				},
				"leg2FarKnee": {
					"min": -65,
					"max": 65
				},
				"leg2FarFoot": {
					"min": -75,
					"max": 75
				},
				"leg2NearKnee": {
					"min": -65,
					"max": 65
				},
				"leg2NearFoot": {
					"min": -75,
					"max": 75
				},
				"leg3FarKnee": {
					"min": -65,
					"max": 65
				},
				"leg3FarFoot": {
					"min": -75,
					"max": 75
				},
				"leg3NearKnee": {
					"min": -65,
					"max": 65
				},
				"leg3NearFoot": {
					"min": -75,
					"max": 75
				},
				"leg4FarKnee": {
					"min": -65,
					"max": 65
				},
				"leg4FarFoot": {
					"min": -75,
					"max": 75
				},
				"leg4NearKnee": {
					"min": -65,
					"max": 65
				},
				"leg4NearFoot": {
					"min": -75,
					"max": 75
				}
			},
			"bounds": [
				{
					"id": "body",
					"min": .05,
					"max": .7,
					"kind": "distance",
					"axis": ["abdomen", "cephalothorax"]
				},
				{
					"id": "bone-min",
					"min": .001,
					"max": .75,
					"kind": "bone-min"
				},
				{
					"id": "bone-max",
					"min": .001,
					"max": .75,
					"kind": "bone-max"
				},
				{
					"id": "leg/body:leg1Far",
					"min": .15,
					"max": 4,
					"kind": "ratio",
					"bones": ["leg1FarKnee", "leg1FarFoot"],
					"axis": ["abdomen", "cephalothorax"]
				},
				{
					"id": "leg/body:leg1Near",
					"min": .15,
					"max": 4,
					"kind": "ratio",
					"bones": ["leg1NearKnee", "leg1NearFoot"],
					"axis": ["abdomen", "cephalothorax"]
				},
				{
					"id": "leg/body:leg2Far",
					"min": .15,
					"max": 4,
					"kind": "ratio",
					"bones": ["leg2FarKnee", "leg2FarFoot"],
					"axis": ["abdomen", "cephalothorax"]
				},
				{
					"id": "leg/body:leg2Near",
					"min": .15,
					"max": 4,
					"kind": "ratio",
					"bones": ["leg2NearKnee", "leg2NearFoot"],
					"axis": ["abdomen", "cephalothorax"]
				},
				{
					"id": "leg/body:leg3Far",
					"min": .15,
					"max": 4,
					"kind": "ratio",
					"bones": ["leg3FarKnee", "leg3FarFoot"],
					"axis": ["abdomen", "cephalothorax"]
				},
				{
					"id": "leg/body:leg3Near",
					"min": .15,
					"max": 4,
					"kind": "ratio",
					"bones": ["leg3NearKnee", "leg3NearFoot"],
					"axis": ["abdomen", "cephalothorax"]
				},
				{
					"id": "leg/body:leg4Far",
					"min": .15,
					"max": 4,
					"kind": "ratio",
					"bones": ["leg4FarKnee", "leg4FarFoot"],
					"axis": ["abdomen", "cephalothorax"]
				},
				{
					"id": "leg/body:leg4Near",
					"min": .15,
					"max": 4,
					"kind": "ratio",
					"bones": ["leg4NearKnee", "leg4NearFoot"],
					"axis": ["abdomen", "cephalothorax"]
				}
			]
		},
		{
			"id": "radial",
			"version": 1,
			"clipSetId": "radial-v1",
			"graph": [
				["centre", "root"],
				["bell", "centre"],
				["arm0Seg0", "centre"],
				["arm0Seg1", "arm0Seg0"],
				["arm0Seg2", "arm0Seg1"],
				["arm1Seg0", "centre"],
				["arm1Seg1", "arm1Seg0"],
				["arm1Seg2", "arm1Seg1"],
				["arm2Seg0", "centre"],
				["arm2Seg1", "arm2Seg0"],
				["arm2Seg2", "arm2Seg1"],
				["arm3Seg0", "centre"],
				["arm3Seg1", "arm3Seg0"],
				["arm3Seg2", "arm3Seg1"],
				["arm4Seg0", "centre"],
				["arm4Seg1", "arm4Seg0"],
				["arm4Seg2", "arm4Seg1"],
				["arm5Seg0", "centre"],
				["arm5Seg1", "arm5Seg0"],
				["arm5Seg2", "arm5Seg1"]
			],
			"bodyAxis": ["centre", "bell"],
			"joints": [
				"root",
				"centre",
				"bell",
				"arm0Seg0",
				"arm0Seg1",
				"arm0Seg2",
				"arm1Seg0",
				"arm1Seg1",
				"arm1Seg2",
				"arm2Seg0",
				"arm2Seg1",
				"arm2Seg2",
				"arm3Seg0",
				"arm3Seg1",
				"arm3Seg2",
				"arm4Seg0",
				"arm4Seg1",
				"arm4Seg2",
				"arm5Seg0",
				"arm5Seg1",
				"arm5Seg2"
			],
			"legs": [],
			"limitsDeg": {
				"root": {
					"min": -35,
					"max": 35
				},
				"centre": {
					"min": -15,
					"max": 15
				},
				"bell": {
					"min": -25,
					"max": 25
				},
				"arm0Seg0": {
					"min": -45,
					"max": 45
				},
				"arm0Seg1": {
					"min": -55,
					"max": 55
				},
				"arm0Seg2": {
					"min": -55,
					"max": 55
				},
				"arm1Seg0": {
					"min": -45,
					"max": 45
				},
				"arm1Seg1": {
					"min": -55,
					"max": 55
				},
				"arm1Seg2": {
					"min": -55,
					"max": 55
				},
				"arm2Seg0": {
					"min": -45,
					"max": 45
				},
				"arm2Seg1": {
					"min": -55,
					"max": 55
				},
				"arm2Seg2": {
					"min": -55,
					"max": 55
				},
				"arm3Seg0": {
					"min": -45,
					"max": 45
				},
				"arm3Seg1": {
					"min": -55,
					"max": 55
				},
				"arm3Seg2": {
					"min": -55,
					"max": 55
				},
				"arm4Seg0": {
					"min": -45,
					"max": 45
				},
				"arm4Seg1": {
					"min": -55,
					"max": 55
				},
				"arm4Seg2": {
					"min": -55,
					"max": 55
				},
				"arm5Seg0": {
					"min": -45,
					"max": 45
				},
				"arm5Seg1": {
					"min": -55,
					"max": 55
				},
				"arm5Seg2": {
					"min": -55,
					"max": 55
				}
			},
			"bounds": [
				{
					"id": "body",
					"min": .03,
					"max": .6,
					"kind": "distance",
					"axis": ["centre", "bell"]
				},
				{
					"id": "bone-min",
					"min": .001,
					"max": .75,
					"kind": "bone-min"
				},
				{
					"id": "bone-max",
					"min": .001,
					"max": .75,
					"kind": "bone-max"
				},
				{
					"id": "arm/bell:arm0",
					"min": .3,
					"max": 8,
					"kind": "ratio",
					"bones": [
						"arm0Seg0",
						"arm0Seg1",
						"arm0Seg2"
					],
					"axis": ["centre", "bell"]
				},
				{
					"id": "arm/bell:arm1",
					"min": .3,
					"max": 8,
					"kind": "ratio",
					"bones": [
						"arm1Seg0",
						"arm1Seg1",
						"arm1Seg2"
					],
					"axis": ["centre", "bell"]
				},
				{
					"id": "arm/bell:arm2",
					"min": .3,
					"max": 8,
					"kind": "ratio",
					"bones": [
						"arm2Seg0",
						"arm2Seg1",
						"arm2Seg2"
					],
					"axis": ["centre", "bell"]
				},
				{
					"id": "arm/bell:arm3",
					"min": .3,
					"max": 8,
					"kind": "ratio",
					"bones": [
						"arm3Seg0",
						"arm3Seg1",
						"arm3Seg2"
					],
					"axis": ["centre", "bell"]
				},
				{
					"id": "arm/bell:arm4",
					"min": .3,
					"max": 8,
					"kind": "ratio",
					"bones": [
						"arm4Seg0",
						"arm4Seg1",
						"arm4Seg2"
					],
					"axis": ["centre", "bell"]
				},
				{
					"id": "arm/bell:arm5",
					"min": .3,
					"max": 8,
					"kind": "ratio",
					"bones": [
						"arm5Seg0",
						"arm5Seg1",
						"arm5Seg2"
					],
					"axis": ["centre", "bell"]
				}
			]
		},
		{
			"id": "plant-woody",
			"version": 1,
			"clipSetId": "plant-woody-v1",
			"graph": [
				["trunk", "root"],
				["branch0Base", "trunk"],
				["branch0Tip", "branch0Base"],
				["leaf0", "branch0Tip"],
				["branch1Base", "trunk"],
				["branch1Tip", "branch1Base"],
				["leaf1", "branch1Tip"],
				["branch2Base", "trunk"],
				["branch2Tip", "branch2Base"],
				["leaf2", "branch2Tip"]
			],
			"bodyAxis": ["root", "trunk"],
			"joints": [
				"root",
				"trunk",
				"branch0Base",
				"branch0Tip",
				"leaf0",
				"branch1Base",
				"branch1Tip",
				"leaf1",
				"branch2Base",
				"branch2Tip",
				"leaf2"
			],
			"legs": [],
			"limitsDeg": {
				"root": {
					"min": -5,
					"max": 5
				},
				"trunk": {
					"min": -12,
					"max": 12
				},
				"branch0Base": {
					"min": -25,
					"max": 25
				},
				"branch0Tip": {
					"min": -35,
					"max": 35
				},
				"leaf0": {
					"min": -45,
					"max": 45
				},
				"branch1Base": {
					"min": -25,
					"max": 25
				},
				"branch1Tip": {
					"min": -35,
					"max": 35
				},
				"leaf1": {
					"min": -45,
					"max": 45
				},
				"branch2Base": {
					"min": -25,
					"max": 25
				},
				"branch2Tip": {
					"min": -35,
					"max": 35
				},
				"leaf2": {
					"min": -45,
					"max": 45
				}
			},
			"bounds": [
				{
					"id": "body",
					"min": .08,
					"max": .8,
					"kind": "distance",
					"axis": ["root", "trunk"]
				},
				{
					"id": "bone-min",
					"min": .001,
					"max": .75,
					"kind": "bone-min"
				},
				{
					"id": "bone-max",
					"min": .001,
					"max": .75,
					"kind": "bone-max"
				},
				{
					"id": "branch/trunk:branch0",
					"min": .1,
					"max": 2.5,
					"kind": "ratio",
					"bones": ["branch0Base", "branch0Tip"],
					"axis": ["root", "trunk"]
				},
				{
					"id": "branch/trunk:branch1",
					"min": .1,
					"max": 2.5,
					"kind": "ratio",
					"bones": ["branch1Base", "branch1Tip"],
					"axis": ["root", "trunk"]
				},
				{
					"id": "branch/trunk:branch2",
					"min": .1,
					"max": 2.5,
					"kind": "ratio",
					"bones": ["branch2Base", "branch2Tip"],
					"axis": ["root", "trunk"]
				}
			]
		},
		{
			"id": "plant-herb",
			"version": 1,
			"clipSetId": "plant-herb-v1",
			"graph": [
				["stem0Seg0", "root"],
				["stem0Seg1", "stem0Seg0"],
				["stem0Seg2", "stem0Seg1"],
				["frond0", "stem0Seg2"],
				["stem1Seg0", "root"],
				["stem1Seg1", "stem1Seg0"],
				["stem1Seg2", "stem1Seg1"],
				["frond1", "stem1Seg2"],
				["stem2Seg0", "root"],
				["stem2Seg1", "stem2Seg0"],
				["stem2Seg2", "stem2Seg1"],
				["frond2", "stem2Seg2"],
				["stem3Seg0", "root"],
				["stem3Seg1", "stem3Seg0"],
				["stem3Seg2", "stem3Seg1"],
				["frond3", "stem3Seg2"]
			],
			"bodyAxis": ["stem0Seg0", "stem0Seg2"],
			"joints": [
				"root",
				"stem0Seg0",
				"stem0Seg1",
				"stem0Seg2",
				"frond0",
				"stem1Seg0",
				"stem1Seg1",
				"stem1Seg2",
				"frond1",
				"stem2Seg0",
				"stem2Seg1",
				"stem2Seg2",
				"frond2",
				"stem3Seg0",
				"stem3Seg1",
				"stem3Seg2",
				"frond3"
			],
			"legs": [],
			"limitsDeg": {
				"root": {
					"min": -5,
					"max": 5
				},
				"stem0Seg0": {
					"min": -25,
					"max": 25
				},
				"stem0Seg1": {
					"min": -40,
					"max": 40
				},
				"stem0Seg2": {
					"min": -40,
					"max": 40
				},
				"frond0": {
					"min": -50,
					"max": 50
				},
				"stem1Seg0": {
					"min": -25,
					"max": 25
				},
				"stem1Seg1": {
					"min": -40,
					"max": 40
				},
				"stem1Seg2": {
					"min": -40,
					"max": 40
				},
				"frond1": {
					"min": -50,
					"max": 50
				},
				"stem2Seg0": {
					"min": -25,
					"max": 25
				},
				"stem2Seg1": {
					"min": -40,
					"max": 40
				},
				"stem2Seg2": {
					"min": -40,
					"max": 40
				},
				"frond2": {
					"min": -50,
					"max": 50
				},
				"stem3Seg0": {
					"min": -25,
					"max": 25
				},
				"stem3Seg1": {
					"min": -40,
					"max": 40
				},
				"stem3Seg2": {
					"min": -40,
					"max": 40
				},
				"frond3": {
					"min": -50,
					"max": 50
				}
			},
			"bounds": [
				{
					"id": "body",
					"min": .04,
					"max": .8,
					"kind": "distance",
					"axis": ["stem0Seg0", "stem0Seg2"]
				},
				{
					"id": "bone-min",
					"min": .001,
					"max": .75,
					"kind": "bone-min"
				},
				{
					"id": "bone-max",
					"min": .001,
					"max": .75,
					"kind": "bone-max"
				},
				{
					"id": "stem/stem0:stem0",
					"min": .2,
					"max": 4,
					"kind": "ratio",
					"bones": ["stem0Seg1", "stem0Seg2"],
					"axis": ["stem0Seg0", "stem0Seg2"]
				},
				{
					"id": "stem/stem0:stem1",
					"min": .2,
					"max": 4,
					"kind": "ratio",
					"bones": ["stem1Seg1", "stem1Seg2"],
					"axis": ["stem0Seg0", "stem0Seg2"]
				},
				{
					"id": "stem/stem0:stem2",
					"min": .2,
					"max": 4,
					"kind": "ratio",
					"bones": ["stem2Seg1", "stem2Seg2"],
					"axis": ["stem0Seg0", "stem0Seg2"]
				},
				{
					"id": "stem/stem0:stem3",
					"min": .2,
					"max": 4,
					"kind": "ratio",
					"bones": ["stem3Seg1", "stem3Seg2"],
					"axis": ["stem0Seg0", "stem0Seg2"]
				}
			]
		},
		{
			"id": "myriapod",
			"version": 1,
			"clipSetId": "myriapod-v1",
			"graph": [
				["head", "root"],
				["mandible", "head"],
				["seg0", "root"],
				["seg1", "seg0"],
				["seg2", "seg1"],
				["seg3", "seg2"],
				["seg4", "seg3"],
				["seg5", "seg4"],
				["seg6", "seg5"],
				["seg7", "seg6"],
				["legAFarKnee", "seg0"],
				["legAFarFoot", "legAFarKnee"],
				["legANearKnee", "seg0"],
				["legANearFoot", "legANearKnee"],
				["legBFarKnee", "seg2"],
				["legBFarFoot", "legBFarKnee"],
				["legBNearKnee", "seg2"],
				["legBNearFoot", "legBNearKnee"],
				["legCFarKnee", "seg4"],
				["legCFarFoot", "legCFarKnee"],
				["legCNearKnee", "seg4"],
				["legCNearFoot", "legCNearKnee"],
				["legDFarKnee", "seg6"],
				["legDFarFoot", "legDFarKnee"],
				["legDNearKnee", "seg6"],
				["legDNearFoot", "legDNearKnee"],
				["antennaFar", "head"],
				["antennaNear", "head"]
			],
			"bodyAxis": ["seg7", "head"],
			"joints": [
				"root",
				"head",
				"mandible",
				"seg0",
				"seg1",
				"seg2",
				"seg3",
				"seg4",
				"seg5",
				"seg6",
				"seg7",
				"legAFarKnee",
				"legAFarFoot",
				"legANearKnee",
				"legANearFoot",
				"legBFarKnee",
				"legBFarFoot",
				"legBNearKnee",
				"legBNearFoot",
				"legCFarKnee",
				"legCFarFoot",
				"legCNearKnee",
				"legCNearFoot",
				"legDFarKnee",
				"legDFarFoot",
				"legDNearKnee",
				"legDNearFoot",
				"antennaFar",
				"antennaNear"
			],
			"legs": [
				"legAFar",
				"legANear",
				"legBFar",
				"legBNear",
				"legCFar",
				"legCNear",
				"legDFar",
				"legDNear"
			],
			"limitsDeg": {
				"root": {
					"min": -20,
					"max": 20
				},
				"head": {
					"min": -35,
					"max": 35
				},
				"mandible": {
					"min": -40,
					"max": 5
				},
				"seg0": {
					"min": -35,
					"max": 35
				},
				"seg1": {
					"min": -35,
					"max": 35
				},
				"seg2": {
					"min": -35,
					"max": 35
				},
				"seg3": {
					"min": -35,
					"max": 35
				},
				"seg4": {
					"min": -60,
					"max": 60
				},
				"seg5": {
					"min": -60,
					"max": 60
				},
				"seg6": {
					"min": -60,
					"max": 60
				},
				"seg7": {
					"min": -60,
					"max": 60
				},
				"legAFarKnee": {
					"min": -60,
					"max": 60
				},
				"legAFarFoot": {
					"min": -70,
					"max": 70
				},
				"legANearKnee": {
					"min": -60,
					"max": 60
				},
				"legANearFoot": {
					"min": -70,
					"max": 70
				},
				"legBFarKnee": {
					"min": -60,
					"max": 60
				},
				"legBFarFoot": {
					"min": -70,
					"max": 70
				},
				"legBNearKnee": {
					"min": -60,
					"max": 60
				},
				"legBNearFoot": {
					"min": -70,
					"max": 70
				},
				"legCFarKnee": {
					"min": -60,
					"max": 60
				},
				"legCFarFoot": {
					"min": -70,
					"max": 70
				},
				"legCNearKnee": {
					"min": -60,
					"max": 60
				},
				"legCNearFoot": {
					"min": -70,
					"max": 70
				},
				"legDFarKnee": {
					"min": -60,
					"max": 60
				},
				"legDFarFoot": {
					"min": -70,
					"max": 70
				},
				"legDNearKnee": {
					"min": -60,
					"max": 60
				},
				"legDNearFoot": {
					"min": -70,
					"max": 70
				},
				"antennaFar": {
					"min": -50,
					"max": 50
				},
				"antennaNear": {
					"min": -50,
					"max": 50
				}
			},
			"bounds": [
				{
					"id": "body",
					"min": .1,
					"max": .95,
					"kind": "distance",
					"axis": ["seg7", "head"]
				},
				{
					"id": "bone-min",
					"min": .001,
					"max": .75,
					"kind": "bone-min"
				},
				{
					"id": "bone-max",
					"min": .001,
					"max": .75,
					"kind": "bone-max"
				},
				{
					"id": "leg/body:legAFar",
					"min": .05,
					"max": 1.5,
					"kind": "ratio",
					"bones": ["legAFarKnee", "legAFarFoot"],
					"axis": ["seg7", "head"]
				},
				{
					"id": "leg/body:legANear",
					"min": .05,
					"max": 1.5,
					"kind": "ratio",
					"bones": ["legANearKnee", "legANearFoot"],
					"axis": ["seg7", "head"]
				},
				{
					"id": "leg/body:legBFar",
					"min": .05,
					"max": 1.5,
					"kind": "ratio",
					"bones": ["legBFarKnee", "legBFarFoot"],
					"axis": ["seg7", "head"]
				},
				{
					"id": "leg/body:legBNear",
					"min": .05,
					"max": 1.5,
					"kind": "ratio",
					"bones": ["legBNearKnee", "legBNearFoot"],
					"axis": ["seg7", "head"]
				},
				{
					"id": "leg/body:legCFar",
					"min": .05,
					"max": 1.5,
					"kind": "ratio",
					"bones": ["legCFarKnee", "legCFarFoot"],
					"axis": ["seg7", "head"]
				},
				{
					"id": "leg/body:legCNear",
					"min": .05,
					"max": 1.5,
					"kind": "ratio",
					"bones": ["legCNearKnee", "legCNearFoot"],
					"axis": ["seg7", "head"]
				},
				{
					"id": "leg/body:legDFar",
					"min": .05,
					"max": 1.5,
					"kind": "ratio",
					"bones": ["legDFarKnee", "legDFarFoot"],
					"axis": ["seg7", "head"]
				},
				{
					"id": "leg/body:legDNear",
					"min": .05,
					"max": 1.5,
					"kind": "ratio",
					"bones": ["legDNearKnee", "legDNearFoot"],
					"axis": ["seg7", "head"]
				}
			]
		},
		{
			"id": "cephalopod",
			"version": 1,
			"clipSetId": "cephalopod-v1",
			"graph": [
				["mantle", "root"],
				["head", "root"],
				["eyeFar", "head"],
				["eyeNear", "head"],
				["siphon", "head"],
				["finFar", "mantle"],
				["finNear", "mantle"],
				["arm0Seg0", "head"],
				["arm0Seg1", "arm0Seg0"],
				["arm0Seg2", "arm0Seg1"],
				["arm1Seg0", "head"],
				["arm1Seg1", "arm1Seg0"],
				["arm1Seg2", "arm1Seg1"],
				["arm2Seg0", "head"],
				["arm2Seg1", "arm2Seg0"],
				["arm2Seg2", "arm2Seg1"],
				["arm3Seg0", "head"],
				["arm3Seg1", "arm3Seg0"],
				["arm3Seg2", "arm3Seg1"],
				["arm4Seg0", "head"],
				["arm4Seg1", "arm4Seg0"],
				["arm4Seg2", "arm4Seg1"],
				["arm5Seg0", "head"],
				["arm5Seg1", "arm5Seg0"],
				["arm5Seg2", "arm5Seg1"],
				["arm6Seg0", "head"],
				["arm6Seg1", "arm6Seg0"],
				["arm6Seg2", "arm6Seg1"],
				["arm7Seg0", "head"],
				["arm7Seg1", "arm7Seg0"],
				["arm7Seg2", "arm7Seg1"]
			],
			"bodyAxis": ["head", "mantle"],
			"joints": [
				"root",
				"mantle",
				"head",
				"eyeFar",
				"eyeNear",
				"siphon",
				"finFar",
				"finNear",
				"arm0Seg0",
				"arm0Seg1",
				"arm0Seg2",
				"arm1Seg0",
				"arm1Seg1",
				"arm1Seg2",
				"arm2Seg0",
				"arm2Seg1",
				"arm2Seg2",
				"arm3Seg0",
				"arm3Seg1",
				"arm3Seg2",
				"arm4Seg0",
				"arm4Seg1",
				"arm4Seg2",
				"arm5Seg0",
				"arm5Seg1",
				"arm5Seg2",
				"arm6Seg0",
				"arm6Seg1",
				"arm6Seg2",
				"arm7Seg0",
				"arm7Seg1",
				"arm7Seg2"
			],
			"legs": [],
			"limitsDeg": {
				"root": {
					"min": -30,
					"max": 30
				},
				"mantle": {
					"min": -25,
					"max": 25
				},
				"head": {
					"min": -30,
					"max": 30
				},
				"eyeFar": {
					"min": -20,
					"max": 20
				},
				"eyeNear": {
					"min": -20,
					"max": 20
				},
				"siphon": {
					"min": -45,
					"max": 45
				},
				"finFar": {
					"min": -40,
					"max": 40
				},
				"finNear": {
					"min": -40,
					"max": 40
				},
				"arm0Seg0": {
					"min": -55,
					"max": 55
				},
				"arm0Seg1": {
					"min": -70,
					"max": 70
				},
				"arm0Seg2": {
					"min": -80,
					"max": 80
				},
				"arm1Seg0": {
					"min": -55,
					"max": 55
				},
				"arm1Seg1": {
					"min": -70,
					"max": 70
				},
				"arm1Seg2": {
					"min": -80,
					"max": 80
				},
				"arm2Seg0": {
					"min": -55,
					"max": 55
				},
				"arm2Seg1": {
					"min": -70,
					"max": 70
				},
				"arm2Seg2": {
					"min": -80,
					"max": 80
				},
				"arm3Seg0": {
					"min": -55,
					"max": 55
				},
				"arm3Seg1": {
					"min": -70,
					"max": 70
				},
				"arm3Seg2": {
					"min": -80,
					"max": 80
				},
				"arm4Seg0": {
					"min": -55,
					"max": 55
				},
				"arm4Seg1": {
					"min": -70,
					"max": 70
				},
				"arm4Seg2": {
					"min": -80,
					"max": 80
				},
				"arm5Seg0": {
					"min": -55,
					"max": 55
				},
				"arm5Seg1": {
					"min": -70,
					"max": 70
				},
				"arm5Seg2": {
					"min": -80,
					"max": 80
				},
				"arm6Seg0": {
					"min": -55,
					"max": 55
				},
				"arm6Seg1": {
					"min": -70,
					"max": 70
				},
				"arm6Seg2": {
					"min": -80,
					"max": 80
				},
				"arm7Seg0": {
					"min": -55,
					"max": 55
				},
				"arm7Seg1": {
					"min": -70,
					"max": 70
				},
				"arm7Seg2": {
					"min": -80,
					"max": 80
				}
			},
			"bounds": [
				{
					"id": "body",
					"min": .05,
					"max": .7,
					"kind": "distance",
					"axis": ["head", "mantle"]
				},
				{
					"id": "bone-min",
					"min": .001,
					"max": .75,
					"kind": "bone-min"
				},
				{
					"id": "bone-max",
					"min": .001,
					"max": .75,
					"kind": "bone-max"
				},
				{
					"id": "arm/body:arm0",
					"min": .3,
					"max": 6,
					"kind": "ratio",
					"bones": [
						"arm0Seg0",
						"arm0Seg1",
						"arm0Seg2"
					],
					"axis": ["head", "mantle"]
				},
				{
					"id": "arm/body:arm1",
					"min": .3,
					"max": 6,
					"kind": "ratio",
					"bones": [
						"arm1Seg0",
						"arm1Seg1",
						"arm1Seg2"
					],
					"axis": ["head", "mantle"]
				},
				{
					"id": "arm/body:arm2",
					"min": .3,
					"max": 6,
					"kind": "ratio",
					"bones": [
						"arm2Seg0",
						"arm2Seg1",
						"arm2Seg2"
					],
					"axis": ["head", "mantle"]
				},
				{
					"id": "arm/body:arm3",
					"min": .3,
					"max": 6,
					"kind": "ratio",
					"bones": [
						"arm3Seg0",
						"arm3Seg1",
						"arm3Seg2"
					],
					"axis": ["head", "mantle"]
				},
				{
					"id": "arm/body:arm4",
					"min": .3,
					"max": 6,
					"kind": "ratio",
					"bones": [
						"arm4Seg0",
						"arm4Seg1",
						"arm4Seg2"
					],
					"axis": ["head", "mantle"]
				},
				{
					"id": "arm/body:arm5",
					"min": .3,
					"max": 6,
					"kind": "ratio",
					"bones": [
						"arm5Seg0",
						"arm5Seg1",
						"arm5Seg2"
					],
					"axis": ["head", "mantle"]
				},
				{
					"id": "arm/body:arm6",
					"min": .3,
					"max": 6,
					"kind": "ratio",
					"bones": [
						"arm6Seg0",
						"arm6Seg1",
						"arm6Seg2"
					],
					"axis": ["head", "mantle"]
				},
				{
					"id": "arm/body:arm7",
					"min": .3,
					"max": 6,
					"kind": "ratio",
					"bones": [
						"arm7Seg0",
						"arm7Seg1",
						"arm7Seg2"
					],
					"axis": ["head", "mantle"]
				}
			]
		},
		{
			"id": "flyer-membrane",
			"version": 1,
			"clipSetId": "flyer-membrane-v1",
			"graph": [
				["pelvis", "root"],
				["spine", "pelvis"],
				["chest", "spine"],
				["neck", "chest"],
				["head", "neck"],
				["jaw", "head"],
				["wingFarRoot", "chest"],
				["wingFarElbow", "wingFarRoot"],
				["wingFarWrist", "wingFarElbow"],
				["wingFarTip", "wingFarWrist"],
				["wingNearRoot", "chest"],
				["wingNearElbow", "wingNearRoot"],
				["wingNearWrist", "wingNearElbow"],
				["wingNearTip", "wingNearWrist"],
				["legFarKnee", "pelvis"],
				["legFarFoot", "legFarKnee"],
				["legNearKnee", "pelvis"],
				["legNearFoot", "legNearKnee"],
				["earFarTip", "head"],
				["earNearTip", "head"],
				["tail0", "pelvis"]
			],
			"bodyAxis": ["pelvis", "chest"],
			"joints": [
				"root",
				"pelvis",
				"spine",
				"chest",
				"neck",
				"head",
				"jaw",
				"wingFarRoot",
				"wingFarElbow",
				"wingFarWrist",
				"wingFarTip",
				"wingNearRoot",
				"wingNearElbow",
				"wingNearWrist",
				"wingNearTip",
				"legFarKnee",
				"legFarFoot",
				"legNearKnee",
				"legNearFoot",
				"earFarTip",
				"earNearTip",
				"tail0"
			],
			"legs": ["legFar", "legNear"],
			"limitsDeg": {
				"root": {
					"min": -35,
					"max": 35
				},
				"pelvis": {
					"min": -20,
					"max": 20
				},
				"spine": {
					"min": -25,
					"max": 25
				},
				"chest": {
					"min": -20,
					"max": 20
				},
				"neck": {
					"min": -35,
					"max": 35
				},
				"head": {
					"min": -40,
					"max": 40
				},
				"jaw": {
					"min": -40,
					"max": 5
				},
				"wingFarRoot": {
					"min": -80,
					"max": 100
				},
				"wingFarElbow": {
					"min": -90,
					"max": 90
				},
				"wingFarWrist": {
					"min": -80,
					"max": 80
				},
				"wingFarTip": {
					"min": -70,
					"max": 70
				},
				"wingNearRoot": {
					"min": -80,
					"max": 100
				},
				"wingNearElbow": {
					"min": -90,
					"max": 90
				},
				"wingNearWrist": {
					"min": -80,
					"max": 80
				},
				"wingNearTip": {
					"min": -70,
					"max": 70
				},
				"legFarKnee": {
					"min": -70,
					"max": 70
				},
				"legFarFoot": {
					"min": -60,
					"max": 60
				},
				"legNearKnee": {
					"min": -70,
					"max": 70
				},
				"legNearFoot": {
					"min": -60,
					"max": 60
				},
				"earFarTip": {
					"min": -40,
					"max": 40
				},
				"earNearTip": {
					"min": -40,
					"max": 40
				},
				"tail0": {
					"min": -45,
					"max": 45
				}
			},
			"bounds": [
				{
					"id": "body",
					"min": .05,
					"max": .6,
					"kind": "distance",
					"axis": ["pelvis", "chest"]
				},
				{
					"id": "bone-min",
					"min": .001,
					"max": .75,
					"kind": "bone-min"
				},
				{
					"id": "bone-max",
					"min": .001,
					"max": .75,
					"kind": "bone-max"
				},
				{
					"id": "wing/torso:wingFar",
					"min": .8,
					"max": 12,
					"kind": "ratio",
					"bones": [
						"wingFarRoot",
						"wingFarElbow",
						"wingFarWrist",
						"wingFarTip"
					],
					"axis": ["pelvis", "chest"]
				},
				{
					"id": "wing/torso:wingNear",
					"min": .8,
					"max": 12,
					"kind": "ratio",
					"bones": [
						"wingNearRoot",
						"wingNearElbow",
						"wingNearWrist",
						"wingNearTip"
					],
					"axis": ["pelvis", "chest"]
				},
				{
					"id": "leg/torso:legFar",
					"min": .2,
					"max": 4,
					"kind": "ratio",
					"bones": ["legFarKnee", "legFarFoot"],
					"axis": ["pelvis", "chest"]
				},
				{
					"id": "leg/torso:legNear",
					"min": .2,
					"max": 4,
					"kind": "ratio",
					"bones": ["legNearKnee", "legNearFoot"],
					"axis": ["pelvis", "chest"]
				}
			]
		},
		{
			"id": "primate",
			"version": 1,
			"clipSetId": "primate-v1",
			"graph": [
				["pelvis", "root"],
				["spine", "pelvis"],
				["chest", "spine"],
				["neck", "chest"],
				["head", "neck"],
				["jaw", "head"],
				["armFarShoulder", "chest"],
				["armFarElbow", "armFarShoulder"],
				["armFarHand", "armFarElbow"],
				["armNearShoulder", "chest"],
				["armNearElbow", "armNearShoulder"],
				["armNearHand", "armNearElbow"],
				["legFarHip", "pelvis"],
				["legFarKnee", "legFarHip"],
				["legFarFoot", "legFarKnee"],
				["legNearHip", "pelvis"],
				["legNearKnee", "legNearHip"],
				["legNearFoot", "legNearKnee"],
				["tail0", "pelvis"],
				["tail1", "tail0"],
				["tail2", "tail1"]
			],
			"bodyAxis": ["pelvis", "chest"],
			"joints": [
				"root",
				"pelvis",
				"spine",
				"chest",
				"neck",
				"head",
				"jaw",
				"armFarShoulder",
				"armFarElbow",
				"armFarHand",
				"armNearShoulder",
				"armNearElbow",
				"armNearHand",
				"legFarHip",
				"legFarKnee",
				"legFarFoot",
				"legNearHip",
				"legNearKnee",
				"legNearFoot",
				"tail0",
				"tail1",
				"tail2"
			],
			"legs": ["legFar", "legNear"],
			"limitsDeg": {
				"root": {
					"min": -30,
					"max": 30
				},
				"pelvis": {
					"min": -25,
					"max": 25
				},
				"spine": {
					"min": -30,
					"max": 30
				},
				"chest": {
					"min": -25,
					"max": 25
				},
				"neck": {
					"min": -35,
					"max": 35
				},
				"head": {
					"min": -40,
					"max": 40
				},
				"jaw": {
					"min": -35,
					"max": 5
				},
				"armFarShoulder": {
					"min": -100,
					"max": 100
				},
				"armFarElbow": {
					"min": -110,
					"max": 110
				},
				"armFarHand": {
					"min": -60,
					"max": 60
				},
				"armNearShoulder": {
					"min": -100,
					"max": 100
				},
				"armNearElbow": {
					"min": -110,
					"max": 110
				},
				"armNearHand": {
					"min": -60,
					"max": 60
				},
				"legFarHip": {
					"min": -80,
					"max": 80
				},
				"legFarKnee": {
					"min": -110,
					"max": 110
				},
				"legFarFoot": {
					"min": -50,
					"max": 50
				},
				"legNearHip": {
					"min": -80,
					"max": 80
				},
				"legNearKnee": {
					"min": -110,
					"max": 110
				},
				"legNearFoot": {
					"min": -50,
					"max": 50
				},
				"tail0": {
					"min": -40,
					"max": 40
				},
				"tail1": {
					"min": -50,
					"max": 50
				},
				"tail2": {
					"min": -50,
					"max": 50
				}
			},
			"bounds": [
				{
					"id": "body",
					"min": .06,
					"max": .6,
					"kind": "distance",
					"axis": ["pelvis", "chest"]
				},
				{
					"id": "bone-min",
					"min": .001,
					"max": .75,
					"kind": "bone-min"
				},
				{
					"id": "bone-max",
					"min": .001,
					"max": .75,
					"kind": "bone-max"
				},
				{
					"id": "arm/torso:armFar",
					"min": .5,
					"max": 4,
					"kind": "ratio",
					"bones": [
						"armFarShoulder",
						"armFarElbow",
						"armFarHand"
					],
					"axis": ["pelvis", "chest"]
				},
				{
					"id": "arm/torso:armNear",
					"min": .5,
					"max": 4,
					"kind": "ratio",
					"bones": [
						"armNearShoulder",
						"armNearElbow",
						"armNearHand"
					],
					"axis": ["pelvis", "chest"]
				},
				{
					"id": "leg/torso:legFar",
					"min": .5,
					"max": 4,
					"kind": "ratio",
					"bones": [
						"legFarHip",
						"legFarKnee",
						"legFarFoot"
					],
					"axis": ["pelvis", "chest"]
				},
				{
					"id": "leg/torso:legNear",
					"min": .5,
					"max": 4,
					"kind": "ratio",
					"bones": [
						"legNearHip",
						"legNearKnee",
						"legNearFoot"
					],
					"axis": ["pelvis", "chest"]
				}
			]
		}
	];
	freeze = (x) => {
		if (x && typeof x === "object") {
			for (const v of Object.values(x)) freeze(v);
			Object.freeze(x);
		}
		return x;
	};
	contracts.find((t) => t.id === "quadruped").contactStance = {
		default: "all",
		gaits: {
			"approach:walk": "alternating",
			"approach:trot": "alternating",
			"approach:gallop": "bounding"
		},
		actions: {
			idle: "all",
			alert: "all",
			hit: "all",
			feed: "all",
			tame: "all",
			faint: "all",
			approach: "all",
			"melee:*": "hind",
			cast: "hind",
			victory: "hind",
			dodge: "none",
			"melee:kick": "none"
		}
	};
	contracts.find((t) => t.id === "insect").contactStance = {
		default: "all",
		actions: {
			cast: "hind",
			victory: "hind",
			dodge: "none"
		},
		travel: {
			hit: "source-steps",
			tame: "source-steps"
		}
	};
	contracts.find((t) => t.id === "hopper").contactStance = {
		default: "all",
		actions: {
			"melee:bite": "hind",
			cast: "hind",
			victory: "hind",
			dodge: "none"
		},
		travel: {
			hit: "source-steps",
			tame: "source-steps"
		}
	};
	contracts.find((t) => t.id === "primate").contactStance = {
		default: "all",
		actions: { dodge: "none" }
	};
	contracts.find((t) => t.id === "arachnid").contactStance = {
		default: "all",
		hind: [
			"leg3Far",
			"leg3Near",
			"leg4Far",
			"leg4Near"
		],
		actions: {
			cast: "hind",
			victory: "hind",
			dodge: "none"
		},
		travel: {
			hit: "source-steps",
			tame: "source-steps"
		}
	};
	quadrupedContact = contracts.find((t) => t.id === "quadruped");
	quadrupedContact.contactLimitsDeg = {
		...quadrupedContact.limitsDeg,
		...Object.fromEntries(quadrupedContact.legs.flatMap((id) => Object.entries({
			Knee: 100,
			Ankle: 105,
			Paw: 95
		}).map(([joint, max]) => [id + joint, {
			min: -max,
			max
		}])))
	};
	FAMILY_CONTRACTS = freeze(contracts);
}));
//#endregion
//#region port/v2/tools/creature-animation/terminal-contact-pads.mjs
/** Missing own contactPads property leaves legacy admission untouched. A present
* declaration must be complete. Alpha is optional for sealing, mandatory when
* the caller admits the source image. Pixel cells use floor(point * dimension),
* with the normalized closed edge 1 assigned to the last cell. There is no
* neighborhood search, alpha cutoff, automatic point inference, or mutation.
*/
function validateTerminalContactPads(record, chains, alpha) {
	const geometry = record?.geometry;
	if (!geometry || !Object.hasOwn(geometry, "contactPads")) return void 0;
	const declaration = geometry.contactPads;
	need$2(object(declaration), "declaration object required");
	need$2(exactKeys(declaration, [
		"schema",
		"kind",
		"points"
	]), "exact declaration fields required");
	need$2(declaration.schema === "cf.terminal-pad-support/v1", "unsupported schema");
	need$2(declaration.kind === "adhesive", "unsupported kind");
	need$2(object(declaration.points), "points object required");
	need$2(Array.isArray(chains) && chains.length > 0, "contact chains required");
	need$2(chains.every((chain) => chain && typeof chain.end === "string" && chain.end.length > 0 && typeof chain.terminal === "string" && chain.terminal.length > 0 && chain.terminal !== chain.end), "terminal chain required");
	const names = chains.map((chain) => chain.end);
	need$2(new Set(names).size === names.length, "duplicate contact chain");
	need$2(exactKeys(declaration.points, names), "exact contact point inventory required");
	const { width, height } = geometry;
	need$2([width, height].every((n) => Number.isSafeInteger(n) && n > 0) && Number.isSafeInteger(width * height), "source dimensions");
	if (alpha !== void 0) need$2(alpha instanceof Uint8Array && alpha.length === width * height, "alpha dimensions or type");
	const entries = names.map((name) => {
		const point = declaration.points[name];
		need$2(Array.isArray(point) && point.length === 2 && Number.isFinite(point[0]) && Number.isFinite(point[1]), "finite point required: " + name);
		need$2(point.every((n) => n >= 0 && n <= 1), "point outside source: " + name);
		if (alpha !== void 0) {
			const x = Math.min(width - 1, Math.floor(point[0] * width)), y = Math.min(height - 1, Math.floor(point[1] * height));
			need$2(alpha[y * width + x] > 0, "point outside painted alpha: " + name);
		}
		return [name, Object.freeze([point[0], point[1]])];
	});
	return Object.freeze({
		schema: declaration.schema,
		kind: declaration.kind,
		points: Object.freeze(Object.fromEntries(entries))
	});
}
var need$2, object, exactKeys;
var init_terminal_contact_pads = __esmMin((() => {
	need$2 = (ok, reason) => {
		if (!ok) throw Error("Terminal contact pads: " + reason);
	};
	object = (value) => value !== null && typeof value === "object" && !Array.isArray(value) && [Object.prototype, null].includes(Object.getPrototypeOf(value));
	exactKeys = (value, expected) => Reflect.ownKeys(value).length === expected.length && expected.every((key) => Object.hasOwn(value, key));
})), LEGS$1, GRAPH;
var init_quadruped_template = __esmMin((() => {
	init_kinematics();
	Object.freeze({
		id: "quadruped",
		version: 1,
		clipSetId: "quadruped-land-v1",
		clips: Object.freeze({
			rest: 0,
			idle: 3e3,
			attack: 2200,
			hit: 1300
		}),
		layers: Object.freeze(["far", "near"])
	});
	LEGS$1 = Object.freeze([
		"hindFar",
		"foreFar",
		"hindNear",
		"foreNear"
	]);
	GRAPH = Object.freeze([
		["pelvis", "root"],
		["spine", "pelvis"],
		["chest", "spine"],
		["neck", "chest"],
		["head", "neck"],
		["jaw", "head"],
		...LEGS$1.flatMap((id) => [
			[id + "Root", id.startsWith("hind") ? "pelvis" : "chest"],
			[id + "Knee", id + "Root"],
			[id + "Ankle", id + "Knee"],
			[id + "Paw", id + "Ankle"]
		]),
		["tail0", "pelvis"],
		["tail1", "tail0"],
		["tail2", "tail1"],
		["tail3", "tail2"],
		["earFarRoot", "head"],
		["earFarTip", "earFarRoot"],
		["earNearRoot", "head"],
		["earNearTip", "earNearRoot"]
	].map(Object.freeze));
	[...GRAPH.map((b) => b[0])];
}));
//#endregion
//#region port/v2/tools/creature-animation/family-record.mjs
function measureFamilyBounds(template, landmarks) {
	const fixedPivots = validateFixedPivots(template);
	const bones = Object.fromEntries(template.graph.map(([child, parent]) => {
		const pivot = fixedPivots?.[child];
		return [child, pivot ? Math.hypot(landmarks[child][0] - pivot[0], landmarks[child][1] - pivot[1]) : distance(landmarks, [parent, child])];
	}));
	return {
		boneLengths: bones,
		measures: Object.fromEntries(template.bounds.map((b) => [b.id, b.kind === "bone-min" ? Math.min(...Object.values(bones)) : b.kind === "bone-max" ? Math.max(...Object.values(bones)) : b.kind === "distance" ? distance(landmarks, b.axis) : b.bones.reduce((sum, name) => sum + bones[name], 0) / distance(landmarks, b.axis)]))
	};
}
var distance;
var init_family_record = __esmMin((() => {
	init_motion_scale();
	init_fixed_attachments();
	init_family_contracts();
	init_skeleton_pose();
	init_quadruped_template();
	distance = (j, axis) => Math.hypot(j[axis[1]][0] - j[axis[0]][0], j[axis[1]][1] - j[axis[0]][1]);
})), PLANT_TEMPLATE_IDS, dist$1, need$1, chain, seq, sides, F, boneBounds, axisBound, ratioBound, sec, build, QUAD_LEGS, HOPPER$1, birdLegs, BIRD$1, FISH$1, insectLegs, INSECT$1, SERPENT$1, arachnidLegs, ARACHNID$1, arms, RADIAL$1, myriaPairs, myriaLegs, MYRIAPOD$1, cephArms, CEPHALOPOD$1, batWings, batLegs, FLYER$1, primArms, primLegs, PRIMATE$1, branches, WOODY$1, stems, HERB$1, FAMILY_TEMPLATES, TEMPLATE_BY_FAMILY, templateIdForFamily;
var init_family_templates = __esmMin((() => {
	init_specialized_templates();
	Object.freeze([
		"hopper",
		"biped-bird",
		"fish",
		"insect",
		"serpent",
		"arachnid",
		"radial",
		"plant-woody",
		"plant-herb",
		"myriapod",
		"cephalopod",
		"flyer-membrane",
		"primate"
	]);
	PLANT_TEMPLATE_IDS = Object.freeze(["plant-woody", "plant-herb"]);
	dist$1 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
	need$1 = (v, what) => {
		if (v === void 0) throw new Error("template bound: " + what);
		return v;
	};
	chain = (parent, names) => names.map((n, i) => [n, i === 0 ? parent : names[i - 1]]);
	seq = (prefix, n, parent) => chain(parent, Array.from({ length: n }, (_, i) => prefix + i));
	sides = ["Far", "Near"];
	F = (x) => Object.freeze(x);
	boneBounds = () => [{
		id: "bone-min",
		min: .001,
		max: .75,
		measure: (_, b) => Math.min(...Object.values(b))
	}, {
		id: "bone-max",
		min: .001,
		max: .75,
		measure: (_, b) => Math.max(...Object.values(b))
	}];
	axisBound = (a, b, min = .06, max = .85) => ({
		id: "body",
		min,
		max,
		measure: (lm) => dist$1(need$1(lm[a], a), need$1(lm[b], b))
	});
	ratioBound = (id, joints, a, b, min, max) => ({
		id,
		min,
		max,
		measure: (lm, bones) => joints.reduce((s, j) => s + need$1(bones[j], j), 0) / dist$1(need$1(lm[a], a), need$1(lm[b], b))
	});
	sec = (id, kind, driver, joints) => F({
		id,
		kind,
		driver,
		joints: F(joints)
	});
	build = (s) => {
		const joints = ["root", ...s.graph.map(([c]) => c)];
		const limitFor = (j) => s.limits.find(([re]) => re.test(j))?.[1] ?? {
			min: -30,
			max: 30
		};
		return F({
			id: s.id,
			version: 1,
			clipSetId: s.clipSetId,
			graph: F(s.graph.map((p) => F(p))),
			joints: F(joints),
			legs: F(s.legs),
			limitsDeg: F(Object.fromEntries(joints.map((j) => [j, limitFor(j)]))),
			secondaryChains: F(s.secondaryChains),
			proportions: F(s.proportions),
			bodyAxis: F(s.bodyAxis)
		});
	};
	QUAD_LEGS = [
		"hindFar",
		"foreFar",
		"hindNear",
		"foreNear"
	];
	HOPPER$1 = build({
		id: "hopper",
		clipSetId: "hopper-land-v1",
		graph: [
			["pelvis", "root"],
			["spine", "pelvis"],
			["chest", "spine"],
			["neck", "chest"],
			["head", "neck"],
			["jaw", "head"],
			...QUAD_LEGS.flatMap((id) => chain(id.startsWith("hind") ? "pelvis" : "chest", [
				id + "Root",
				id + "Knee",
				id + "Ankle",
				id + "Paw"
			])),
			...seq("tail", 4, "pelvis"),
			...chain("head", ["earFarRoot", "earFarTip"]),
			...chain("head", ["earNearRoot", "earNearTip"])
		],
		legs: QUAD_LEGS,
		bodyAxis: ["pelvis", "chest"],
		limits: [
			[/^root$/, {
				min: -30,
				max: 30
			}],
			[/^pelvis$/, {
				min: -25,
				max: 25
			}],
			[/^spine$/, {
				min: -30,
				max: 30
			}],
			[/^chest$/, {
				min: -20,
				max: 20
			}],
			[/^(neck|head)$/, {
				min: -35,
				max: 35
			}],
			[/^jaw$/, {
				min: -30,
				max: 5
			}],
			[/^hind.*Root$/, {
				min: -70,
				max: 70
			}],
			[/^hind.*(Knee|Ankle)$/, {
				min: -110,
				max: 110
			}],
			[/^fore.*Root$/, {
				min: -60,
				max: 60
			}],
			[/^fore.*Knee$/, {
				min: -75,
				max: 75
			}],
			[/Ankle$/, {
				min: -60,
				max: 60
			}],
			[/Paw$/, {
				min: -45,
				max: 45
			}],
			[/^tail0$/, {
				min: -40,
				max: 40
			}],
			[/^tail[123]$/, {
				min: -50,
				max: 50
			}],
			[/Tip$/, {
				min: -40,
				max: 40
			}]
		],
		secondaryChains: [
			sec("tail", "tail", "pelvis", [
				"tail0",
				"tail1",
				"tail2",
				"tail3"
			]),
			sec("earFar", "ear", "head", ["earFarRoot", "earFarTip"]),
			sec("earNear", "ear", "head", ["earNearRoot", "earNearTip"])
		],
		proportions: [
			axisBound("pelvis", "chest", .08, .65),
			...boneBounds(),
			...QUAD_LEGS.map((leg) => ratioBound("leg/torso:" + leg, [
				leg + "Knee",
				leg + "Ankle",
				leg + "Paw"
			], "pelvis", "chest", .25, 3.2))
		]
	});
	birdLegs = sides.map((s) => "leg" + s);
	BIRD$1 = build({
		id: "biped-bird",
		clipSetId: "biped-bird-v1",
		legs: birdLegs,
		bodyAxis: ["pelvis", "chest"],
		graph: [
			["pelvis", "root"],
			["spine", "pelvis"],
			["chest", "spine"],
			...chain("chest", [
				"neck0",
				"neck1",
				"head",
				"beak"
			]),
			...birdLegs.flatMap((l) => chain("pelvis", [
				l + "Knee",
				l + "Ankle",
				l + "Foot"
			])),
			...sides.flatMap((s) => chain("chest", ["wing" + s + "Root", "wing" + s + "Tip"])),
			["tailFan", "pelvis"]
		],
		limits: [
			[/^root$/, {
				min: -25,
				max: 25
			}],
			[/^(pelvis|chest)$/, {
				min: -20,
				max: 20
			}],
			[/^spine$/, {
				min: -25,
				max: 25
			}],
			[/^neck[01]$/, {
				min: -45,
				max: 45
			}],
			[/^head$/, {
				min: -40,
				max: 40
			}],
			[/^beak$/, {
				min: -30,
				max: 5
			}],
			[/Knee$/, {
				min: -70,
				max: 70
			}],
			[/Ankle$/, {
				min: -85,
				max: 85
			}],
			[/Foot$/, {
				min: -45,
				max: 45
			}],
			[/^wing.*Root$/, {
				min: -60,
				max: 95
			}],
			[/^wing.*Tip$/, {
				min: -70,
				max: 70
			}],
			[/^tailFan$/, {
				min: -40,
				max: 40
			}]
		],
		secondaryChains: [
			sec("wingFar", "wing", "chest", ["wingFarRoot", "wingFarTip"]),
			sec("wingNear", "wing", "chest", ["wingNearRoot", "wingNearTip"]),
			sec("tailFan", "tailfan", "pelvis", ["tailFan"])
		],
		proportions: [
			axisBound("pelvis", "chest", .06, .65),
			...boneBounds(),
			...birdLegs.map((l) => ratioBound("leg/torso:" + l, [
				l + "Knee",
				l + "Ankle",
				l + "Foot"
			], "pelvis", "chest", .3, 3.5)),
			ratioBound("wing/torso", ["wingFarRoot", "wingFarTip"], "pelvis", "chest", .4, 4.5)
		]
	});
	FISH$1 = build({
		id: "fish",
		clipSetId: "fish-aquatic-v1",
		legs: [],
		bodyAxis: ["spine0", "spine5"],
		graph: [
			["head", "root"],
			["jaw", "head"],
			...seq("spine", 6, "root"),
			["caudal", "spine5"],
			["dorsal", "spine1"],
			["pectoralFar", "root"],
			["pectoralNear", "root"]
		],
		limits: [
			[/^root$/, {
				min: -30,
				max: 30
			}],
			[/^head$/, {
				min: -30,
				max: 30
			}],
			[/^jaw$/, {
				min: -35,
				max: 5
			}],
			[/^spine[0-5]$/, {
				min: -35,
				max: 35
			}],
			[/^caudal$/, {
				min: -50,
				max: 50
			}],
			[/^dorsal$/, {
				min: -35,
				max: 35
			}],
			[/^pectoral/, {
				min: -60,
				max: 60
			}]
		],
		secondaryChains: [
			sec("caudal", "fin", "spine5", ["caudal"]),
			sec("dorsal", "fin", "spine1", ["dorsal"]),
			sec("pectoralFar", "fin", "root", ["pectoralFar"]),
			sec("pectoralNear", "fin", "root", ["pectoralNear"])
		],
		proportions: [
			axisBound("spine0", "spine5", .1, .85),
			...boneBounds(),
			ratioBound("caudal/body", ["caudal"], "spine0", "spine5", .05, .9),
			ratioBound("head/body", ["head"], "spine0", "spine5", .04, .8)
		]
	});
	insectLegs = [
		"Front",
		"Mid",
		"Hind"
	].flatMap((p) => sides.map((s) => "leg" + p + s));
	INSECT$1 = build({
		id: "insect",
		clipSetId: "insect-v1",
		legs: insectLegs,
		bodyAxis: ["abdomen", "head"],
		graph: [
			["thorax", "root"],
			["head", "thorax"],
			["mandible", "head"],
			["abdomen", "thorax"],
			...insectLegs.flatMap((l) => chain("thorax", [l + "Knee", l + "Foot"])),
			["antennaFar", "head"],
			["antennaNear", "head"],
			["wingFar", "thorax"],
			["wingNear", "thorax"]
		],
		limits: [
			[/^root$/, {
				min: -25,
				max: 25
			}],
			[/^thorax$/, {
				min: -15,
				max: 15
			}],
			[/^head$/, {
				min: -35,
				max: 35
			}],
			[/^mandible$/, {
				min: -40,
				max: 5
			}],
			[/^abdomen$/, {
				min: -35,
				max: 50
			}],
			[/Knee$/, {
				min: -65,
				max: 65
			}],
			[/Foot$/, {
				min: -75,
				max: 75
			}],
			[/^antenna/, {
				min: -50,
				max: 50
			}],
			[/^wing/, {
				min: -85,
				max: 85
			}]
		],
		secondaryChains: [
			sec("antennaFar", "antenna", "head", ["antennaFar"]),
			sec("antennaNear", "antenna", "head", ["antennaNear"]),
			sec("wingFar", "wing", "thorax", ["wingFar"]),
			sec("wingNear", "wing", "thorax", ["wingNear"])
		],
		proportions: [
			axisBound("abdomen", "head", .08, .85),
			...boneBounds(),
			...insectLegs.map((l) => ratioBound("leg/body:" + l, [l + "Knee", l + "Foot"], "abdomen", "head", .1, 2.5))
		]
	});
	SERPENT$1 = build({
		id: "serpent",
		clipSetId: "serpent-v1",
		legs: [],
		bodyAxis: ["seg0", "seg9"],
		graph: [
			["head", "root"],
			["jaw", "head"],
			...seq("seg", 10, "root")
		],
		limits: [
			[/^root$/, {
				min: -25,
				max: 25
			}],
			[/^head$/, {
				min: -50,
				max: 50
			}],
			[/^jaw$/, {
				min: -45,
				max: 5
			}],
			[/^seg\d$/, {
				min: -45,
				max: 45
			}]
		],
		secondaryChains: [sec("tail", "tail", "seg6", [
			"seg7",
			"seg8",
			"seg9"
		])],
		proportions: [
			axisBound("seg0", "seg9", .1, .9),
			...boneBounds(),
			ratioBound("head/body", ["head"], "seg0", "seg9", .02, .5)
		]
	});
	arachnidLegs = [
		1,
		2,
		3,
		4
	].flatMap((n) => sides.map((s) => "leg" + n + s));
	ARACHNID$1 = build({
		id: "arachnid",
		clipSetId: "arachnid-v1",
		legs: arachnidLegs,
		bodyAxis: ["abdomen", "cephalothorax"],
		graph: [
			["cephalothorax", "root"],
			["abdomen", "cephalothorax"],
			["sting", "abdomen"],
			["cheliceraFar", "cephalothorax"],
			["cheliceraNear", "cephalothorax"],
			...arachnidLegs.flatMap((l) => chain("cephalothorax", [l + "Knee", l + "Foot"]))
		],
		limits: [
			[/^root$/, {
				min: -25,
				max: 25
			}],
			[/^cephalothorax$/, {
				min: -15,
				max: 15
			}],
			[/^abdomen$/, {
				min: -35,
				max: 65
			}],
			[/^sting$/, {
				min: -70,
				max: 70
			}],
			[/^chelicera/, {
				min: -45,
				max: 45
			}],
			[/Knee$/, {
				min: -65,
				max: 65
			}],
			[/Foot$/, {
				min: -75,
				max: 75
			}]
		],
		secondaryChains: [sec("abdomen", "tail", "cephalothorax", ["abdomen", "sting"])],
		proportions: [
			axisBound("abdomen", "cephalothorax", .05, .7),
			...boneBounds(),
			...arachnidLegs.map((l) => ratioBound("leg/body:" + l, [l + "Knee", l + "Foot"], "abdomen", "cephalothorax", .15, 4))
		]
	});
	arms = [
		0,
		1,
		2,
		3,
		4,
		5
	].map((n) => "arm" + n);
	RADIAL$1 = build({
		id: "radial",
		clipSetId: "radial-v1",
		legs: [],
		bodyAxis: ["centre", "bell"],
		graph: [
			["centre", "root"],
			["bell", "centre"],
			...arms.flatMap((a) => chain("centre", [
				a + "Seg0",
				a + "Seg1",
				a + "Seg2"
			]))
		],
		limits: [
			[/^root$/, {
				min: -35,
				max: 35
			}],
			[/^centre$/, {
				min: -15,
				max: 15
			}],
			[/^bell$/, {
				min: -25,
				max: 25
			}],
			[/Seg0$/, {
				min: -45,
				max: 45
			}],
			[/Seg[12]$/, {
				min: -55,
				max: 55
			}]
		],
		secondaryChains: [sec("bell", "bell", "centre", ["bell"]), ...arms.map((a) => sec(a, "arm", "centre", [
			a + "Seg0",
			a + "Seg1",
			a + "Seg2"
		]))],
		proportions: [
			axisBound("centre", "bell", .03, .6),
			...boneBounds(),
			...arms.map((a) => ratioBound("arm/bell:" + a, [
				a + "Seg0",
				a + "Seg1",
				a + "Seg2"
			], "centre", "bell", .3, 8))
		]
	});
	myriaPairs = [
		"legA",
		"legB",
		"legC",
		"legD"
	];
	myriaLegs = myriaPairs.flatMap((p) => sides.map((s) => p + s));
	MYRIAPOD$1 = build({
		id: "myriapod",
		clipSetId: "myriapod-v1",
		legs: myriaLegs,
		bodyAxis: ["seg7", "head"],
		graph: [
			["head", "root"],
			["mandible", "head"],
			...seq("seg", 8, "root"),
			...myriaPairs.flatMap((p, i) => sides.flatMap((s) => chain("seg" + i * 2, [p + s + "Knee", p + s + "Foot"]))),
			["antennaFar", "head"],
			["antennaNear", "head"]
		],
		limits: [
			[/^root$/, {
				min: -20,
				max: 20
			}],
			[/^head$/, {
				min: -35,
				max: 35
			}],
			[/^mandible$/, {
				min: -40,
				max: 5
			}],
			[/^seg[0-3]$/, {
				min: -35,
				max: 35
			}],
			[/^seg[4-7]$/, {
				min: -60,
				max: 60
			}],
			[/Knee$/, {
				min: -60,
				max: 60
			}],
			[/Foot$/, {
				min: -70,
				max: 70
			}],
			[/^antenna/, {
				min: -50,
				max: 50
			}]
		],
		secondaryChains: [
			sec("tail", "tail", "seg5", ["seg6", "seg7"]),
			sec("antennaFar", "antenna", "head", ["antennaFar"]),
			sec("antennaNear", "antenna", "head", ["antennaNear"])
		],
		proportions: [
			axisBound("seg7", "head", .1, .95),
			...boneBounds(),
			...myriaLegs.map((l) => ratioBound("leg/body:" + l, [l + "Knee", l + "Foot"], "seg7", "head", .05, 1.5))
		]
	});
	cephArms = [
		0,
		1,
		2,
		3,
		4,
		5,
		6,
		7
	].map((n) => "arm" + n);
	CEPHALOPOD$1 = build({
		id: "cephalopod",
		clipSetId: "cephalopod-v1",
		legs: [],
		bodyAxis: ["head", "mantle"],
		graph: [
			["mantle", "root"],
			["head", "root"],
			["eyeFar", "head"],
			["eyeNear", "head"],
			["siphon", "head"],
			["finFar", "mantle"],
			["finNear", "mantle"],
			...cephArms.flatMap((a) => chain("head", [
				a + "Seg0",
				a + "Seg1",
				a + "Seg2"
			]))
		],
		limits: [
			[/^root$/, {
				min: -30,
				max: 30
			}],
			[/^mantle$/, {
				min: -25,
				max: 25
			}],
			[/^head$/, {
				min: -30,
				max: 30
			}],
			[/^eye/, {
				min: -20,
				max: 20
			}],
			[/^siphon$/, {
				min: -45,
				max: 45
			}],
			[/^fin/, {
				min: -40,
				max: 40
			}],
			[/Seg0$/, {
				min: -55,
				max: 55
			}],
			[/Seg1$/, {
				min: -70,
				max: 70
			}],
			[/Seg2$/, {
				min: -80,
				max: 80
			}]
		],
		secondaryChains: [
			sec("finFar", "fin", "mantle", ["finFar"]),
			sec("finNear", "fin", "mantle", ["finNear"]),
			...cephArms.map((a) => sec(a, "tentacle", "head", [
				a + "Seg0",
				a + "Seg1",
				a + "Seg2"
			]))
		],
		proportions: [
			axisBound("head", "mantle", .05, .7),
			...boneBounds(),
			...cephArms.map((a) => ratioBound("arm/body:" + a, [
				a + "Seg0",
				a + "Seg1",
				a + "Seg2"
			], "head", "mantle", .3, 6))
		]
	});
	batWings = sides.map((s) => "wing" + s);
	batLegs = sides.map((s) => "leg" + s);
	FLYER$1 = build({
		id: "flyer-membrane",
		clipSetId: "flyer-membrane-v1",
		legs: batLegs,
		bodyAxis: ["pelvis", "chest"],
		graph: [
			["pelvis", "root"],
			["spine", "pelvis"],
			["chest", "spine"],
			["neck", "chest"],
			["head", "neck"],
			["jaw", "head"],
			...batWings.flatMap((w) => chain("chest", [
				w + "Root",
				w + "Elbow",
				w + "Wrist",
				w + "Tip"
			])),
			...batLegs.flatMap((l) => chain("pelvis", [l + "Knee", l + "Foot"])),
			["earFarTip", "head"],
			["earNearTip", "head"],
			["tail0", "pelvis"]
		],
		limits: [
			[/^root$/, {
				min: -35,
				max: 35
			}],
			[/^(pelvis|chest)$/, {
				min: -20,
				max: 20
			}],
			[/^spine$/, {
				min: -25,
				max: 25
			}],
			[/^neck$/, {
				min: -35,
				max: 35
			}],
			[/^head$/, {
				min: -40,
				max: 40
			}],
			[/^jaw$/, {
				min: -40,
				max: 5
			}],
			[/^wing.*Root$/, {
				min: -80,
				max: 100
			}],
			[/^wing.*Elbow$/, {
				min: -90,
				max: 90
			}],
			[/^wing.*Wrist$/, {
				min: -80,
				max: 80
			}],
			[/^wing.*Tip$/, {
				min: -70,
				max: 70
			}],
			[/Knee$/, {
				min: -70,
				max: 70
			}],
			[/Foot$/, {
				min: -60,
				max: 60
			}],
			[/^ear/, {
				min: -40,
				max: 40
			}],
			[/^tail0$/, {
				min: -45,
				max: 45
			}]
		],
		secondaryChains: [
			sec("wingFar", "membrane", "chest", [
				"wingFarRoot",
				"wingFarElbow",
				"wingFarWrist",
				"wingFarTip"
			]),
			sec("wingNear", "membrane", "chest", [
				"wingNearRoot",
				"wingNearElbow",
				"wingNearWrist",
				"wingNearTip"
			]),
			sec("earFar", "ear", "head", ["earFarTip"]),
			sec("earNear", "ear", "head", ["earNearTip"]),
			sec("tail", "tail", "pelvis", ["tail0"])
		],
		proportions: [
			axisBound("pelvis", "chest", .05, .6),
			...boneBounds(),
			...batWings.map((w) => ratioBound("wing/torso:" + w, [
				w + "Root",
				w + "Elbow",
				w + "Wrist",
				w + "Tip"
			], "pelvis", "chest", .8, 12)),
			...batLegs.map((l) => ratioBound("leg/torso:" + l, [l + "Knee", l + "Foot"], "pelvis", "chest", .2, 4))
		]
	});
	primArms = sides.map((s) => "arm" + s);
	primLegs = sides.map((s) => "leg" + s);
	PRIMATE$1 = build({
		id: "primate",
		clipSetId: "primate-v1",
		legs: primLegs,
		bodyAxis: ["pelvis", "chest"],
		graph: [
			["pelvis", "root"],
			["spine", "pelvis"],
			["chest", "spine"],
			["neck", "chest"],
			["head", "neck"],
			["jaw", "head"],
			...primArms.flatMap((a) => chain("chest", [
				a + "Shoulder",
				a + "Elbow",
				a + "Hand"
			])),
			...primLegs.flatMap((l) => chain("pelvis", [
				l + "Hip",
				l + "Knee",
				l + "Foot"
			])),
			...seq("tail", 3, "pelvis")
		],
		limits: [
			[/^root$/, {
				min: -30,
				max: 30
			}],
			[/^pelvis$/, {
				min: -25,
				max: 25
			}],
			[/^spine$/, {
				min: -30,
				max: 30
			}],
			[/^chest$/, {
				min: -25,
				max: 25
			}],
			[/^neck$/, {
				min: -35,
				max: 35
			}],
			[/^head$/, {
				min: -40,
				max: 40
			}],
			[/^jaw$/, {
				min: -35,
				max: 5
			}],
			[/Shoulder$/, {
				min: -100,
				max: 100
			}],
			[/Elbow$/, {
				min: -110,
				max: 110
			}],
			[/Hand$/, {
				min: -60,
				max: 60
			}],
			[/Hip$/, {
				min: -80,
				max: 80
			}],
			[/Knee$/, {
				min: -110,
				max: 110
			}],
			[/Foot$/, {
				min: -50,
				max: 50
			}],
			[/^tail0$/, {
				min: -40,
				max: 40
			}],
			[/^tail[12]$/, {
				min: -50,
				max: 50
			}]
		],
		secondaryChains: [sec("tail", "tail", "pelvis", [
			"tail0",
			"tail1",
			"tail2"
		])],
		proportions: [
			axisBound("pelvis", "chest", .06, .6),
			...boneBounds(),
			...primArms.map((a) => ratioBound("arm/torso:" + a, [
				a + "Shoulder",
				a + "Elbow",
				a + "Hand"
			], "pelvis", "chest", .5, 4)),
			...primLegs.map((l) => ratioBound("leg/torso:" + l, [
				l + "Hip",
				l + "Knee",
				l + "Foot"
			], "pelvis", "chest", .5, 4))
		]
	});
	branches = [
		0,
		1,
		2
	].map((n) => "branch" + n);
	WOODY$1 = build({
		id: "plant-woody",
		clipSetId: "plant-woody-v1",
		legs: [],
		bodyAxis: ["root", "trunk"],
		graph: [["trunk", "root"], ...branches.flatMap((b, i) => [...chain("trunk", [b + "Base", b + "Tip"]), ["leaf" + i, b + "Tip"]])],
		limits: [
			[/^root$/, {
				min: -5,
				max: 5
			}],
			[/^trunk$/, {
				min: -12,
				max: 12
			}],
			[/Base$/, {
				min: -25,
				max: 25
			}],
			[/Tip$/, {
				min: -35,
				max: 35
			}],
			[/^leaf/, {
				min: -45,
				max: 45
			}]
		],
		secondaryChains: branches.map((b, i) => sec(b, "frond", "trunk", [
			b + "Base",
			b + "Tip",
			"leaf" + i
		])),
		proportions: [
			axisBound("root", "trunk", .08, .8),
			...boneBounds(),
			...branches.map((b) => ratioBound("branch/trunk:" + b, [b + "Base", b + "Tip"], "root", "trunk", .1, 2.5))
		]
	});
	stems = [
		0,
		1,
		2,
		3
	].map((n) => "stem" + n);
	HERB$1 = build({
		id: "plant-herb",
		clipSetId: "plant-herb-v1",
		legs: [],
		bodyAxis: ["stem0Seg0", "stem0Seg2"],
		graph: stems.flatMap((s, i) => [...chain("root", [
			s + "Seg0",
			s + "Seg1",
			s + "Seg2"
		]), ["frond" + i, s + "Seg2"]]),
		limits: [
			[/^root$/, {
				min: -5,
				max: 5
			}],
			[/Seg0$/, {
				min: -25,
				max: 25
			}],
			[/Seg[12]$/, {
				min: -40,
				max: 40
			}],
			[/^frond/, {
				min: -50,
				max: 50
			}]
		],
		secondaryChains: stems.map((s, i) => sec(s, "frond", "root", [
			s + "Seg0",
			s + "Seg1",
			s + "Seg2",
			"frond" + i
		])),
		proportions: [
			axisBound("stem0Seg0", "stem0Seg2", .04, .8),
			...boneBounds(),
			...stems.map((s) => ratioBound("stem/stem0:" + s, [s + "Seg1", s + "Seg2"], "stem0Seg0", "stem0Seg2", .2, 4))
		]
	});
	FAMILY_TEMPLATES = F({
		hopper: HOPPER$1,
		"biped-bird": BIRD$1,
		fish: FISH$1,
		insect: INSECT$1,
		serpent: SERPENT$1,
		arachnid: ARACHNID$1,
		radial: RADIAL$1,
		"plant-woody": WOODY$1,
		"plant-herb": HERB$1,
		myriapod: MYRIAPOD$1,
		cephalopod: CEPHALOPOD$1,
		"flyer-membrane": FLYER$1,
		primate: PRIMATE$1
	});
	TEMPLATE_BY_FAMILY = F({
		mammal: "quadruped",
		reptile: "quadruped",
		amphibian: "quadruped",
		turtle: "quadruped",
		quadruped: "quadruped",
		frog: "hopper",
		hopper: "hopper",
		leaper: "hopper",
		bird: "biped-bird",
		fish: "fish",
		insect: "insect",
		arachnid: "arachnid",
		snake: "serpent",
		serpent: "serpent",
		jelly: "radial",
		radial: "radial",
		myriapod: "myriapod",
		centipede: "myriapod",
		millipede: "myriapod",
		ceph: "cephalopod",
		cephalopod: "cephalopod",
		bat: "flyer-membrane",
		"flyer-membrane": "flyer-membrane",
		primate: "primate",
		tree: "plant-woody",
		shrub: "plant-woody",
		vine: "plant-woody",
		cane: "plant-woody",
		fern: "plant-herb",
		grass: "plant-herb",
		rosette: "plant-herb",
		seaweed: "plant-herb",
		fungal: "plant-herb"
	});
	templateIdForFamily = (family) => TEMPLATE_BY_FAMILY[family.toLowerCase()] ?? specializedTemplate(family.toLowerCase())?.id ?? null;
}));
//#endregion
//#region port/v2/apps/game/src/motion/templates.ts
/** Kit §3: an unsupported template compiles to the labelled whole-portrait fallback. */
function resolveTemplate(id, version = 1) {
	const specialty = specializedTemplate(id);
	const t = REGISTRY[id] ?? (specialty ? {
		...specialty,
		proportions: specialty.bounds.map((b) => ({
			...b,
			measure: (landmarks, bones) => b.kind === "bone-min" ? Math.min(...Object.values(bones)) : b.kind === "bone-max" ? Math.max(...Object.values(bones)) : measureFamilyBounds({
				...specialty,
				graph: specialty.graph.filter(([j]) => Object.hasOwn(landmarks, j)),
				bounds: [b]
			}, landmarks).measures[b.id]
		}))
	} : void 0);
	if (!t) return {
		kind: "whole-portrait",
		templateId: id,
		reason: `template "${id}" has no motion library (known: ${KNOWN_TEMPLATE_IDS.join(", ")})`
	};
	if (t.version !== version) return {
		kind: "whole-portrait",
		templateId: id,
		reason: `template "${id}" v${version} is not v${t.version}`
	};
	return t;
}
var QUADRUPED_LEGS, legGraph, QUADRUPED_GRAPH, LIMIT_TABLE, limitFor, dist, need, QUADRUPED_TEMPLATE, REGISTRY, KNOWN_TEMPLATE_IDS, isMotionFallback;
var init_templates = __esmMin((() => {
	init_specialized_templates();
	init_family_record();
	init_family_templates();
	QUADRUPED_LEGS = Object.freeze([
		"hindFar",
		"foreFar",
		"hindNear",
		"foreNear"
	]);
	legGraph = (id) => [
		[id + "Root", id.startsWith("hind") ? "pelvis" : "chest"],
		[id + "Knee", id + "Root"],
		[id + "Ankle", id + "Knee"],
		[id + "Paw", id + "Ankle"]
	];
	QUADRUPED_GRAPH = Object.freeze([
		["pelvis", "root"],
		["spine", "pelvis"],
		["chest", "spine"],
		["neck", "chest"],
		["head", "neck"],
		["jaw", "head"],
		...QUADRUPED_LEGS.flatMap(legGraph),
		["tail0", "pelvis"],
		["tail1", "tail0"],
		["tail2", "tail1"],
		["tail3", "tail2"],
		["earFarRoot", "head"],
		["earFarTip", "earFarRoot"],
		["earNearRoot", "head"],
		["earNearTip", "earNearRoot"]
	].map((pair) => Object.freeze(pair)));
	LIMIT_TABLE = [
		[/^root$/, {
			min: -15,
			max: 15
		}],
		[/^pelvis$/, {
			min: -20,
			max: 20
		}],
		[/^spine$/, {
			min: -25,
			max: 25
		}],
		[/^chest$/, {
			min: -20,
			max: 20
		}],
		[/^neck$/, {
			min: -35,
			max: 35
		}],
		[/^head$/, {
			min: -35,
			max: 35
		}],
		[/^jaw$/, {
			min: -30,
			max: 5
		}],
		[/Root$/, {
			min: -60,
			max: 60
		}],
		[/Knee$/, {
			min: -75,
			max: 75
		}],
		[/Ankle$/, {
			min: -60,
			max: 60
		}],
		[/Paw$/, {
			min: -40,
			max: 40
		}],
		[/^tail0$/, {
			min: -40,
			max: 40
		}],
		[/^tail[123]$/, {
			min: -50,
			max: 50
		}],
		[/Tip$/, {
			min: -40,
			max: 40
		}]
	];
	limitFor = (joint) => LIMIT_TABLE.find(([re]) => re.test(joint))?.[1] ?? {
		min: -30,
		max: 30
	};
	dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
	need = (v, what) => {
		if (v === void 0) throw new Error("template bound: " + what);
		return v;
	};
	QUADRUPED_TEMPLATE = Object.freeze({
		id: "quadruped",
		version: 1,
		clipSetId: "quadruped-land-v1",
		graph: QUADRUPED_GRAPH,
		joints: Object.freeze(["root", ...QUADRUPED_GRAPH.map(([child]) => child)]),
		legs: QUADRUPED_LEGS,
		limitsDeg: Object.freeze(Object.fromEntries(["root", ...QUADRUPED_GRAPH.map(([c]) => c)].map((j) => [j, limitFor(j)]))),
		secondaryChains: Object.freeze([
			{
				id: "tail",
				driver: "pelvis",
				joints: Object.freeze([
					"tail0",
					"tail1",
					"tail2",
					"tail3"
				])
			},
			{
				id: "earFar",
				driver: "head",
				joints: Object.freeze(["earFarRoot", "earFarTip"])
			},
			{
				id: "earNear",
				driver: "head",
				joints: Object.freeze(["earNearRoot", "earNearTip"])
			}
		]),
		proportions: Object.freeze([
			{
				id: "torso",
				min: .08,
				max: .65,
				measure: (lm) => dist(need(lm.pelvis, "pelvis"), need(lm.chest, "chest"))
			},
			{
				id: "head",
				min: .015,
				max: .75,
				measure: (lm) => dist(need(lm.neck, "neck"), need(lm.head, "head"))
			},
			{
				id: "head/torso",
				min: .02,
				max: 1.6,
				measure: (lm) => dist(need(lm.neck, "neck"), need(lm.head, "head")) / dist(need(lm.pelvis, "pelvis"), need(lm.chest, "chest"))
			},
			{
				id: "bone-min",
				min: .001,
				max: .75,
				measure: (_, b) => Math.min(...Object.values(b))
			},
			{
				id: "bone-max",
				min: .001,
				max: .75,
				measure: (_, b) => Math.max(...Object.values(b))
			},
			...QUADRUPED_LEGS.map((leg) => ({
				id: "leg/torso:" + leg,
				min: .25,
				max: 2.7,
				measure: (lm, b) => (need(b[leg + "Knee"], leg) + need(b[leg + "Ankle"], leg) + need(b[leg + "Paw"], leg)) / dist(need(lm.pelvis, "pelvis"), need(lm.chest, "chest"))
			}))
		])
	});
	REGISTRY = Object.freeze({
		quadruped: QUADRUPED_TEMPLATE,
		...FAMILY_TEMPLATES
	});
	KNOWN_TEMPLATE_IDS = Object.freeze(Object.keys(REGISTRY));
	isMotionFallback = (x) => typeof x === "object" && x !== null && x.kind === "whole-portrait";
}));
//#endregion
//#region port/v2/apps/game/src/motion/timing.ts
/** Mass-scaled duration, bounded to 60%..200% of base. */
function scaleMs(baseMs, mass) {
	return Math.min(Math.max(baseMs * mass, baseMs * SCALE_MIN), baseMs * 2);
}
/** Seeded, mass-scaled idle period; guaranteed non-integer so two creatures never sync. */
function idlePeriodMs(seed, mass) {
	const r = mulberry32(seed | 0)();
	let ms = scaleMs(IDLE_PERIOD.minMs + r * (IDLE_PERIOD.maxMs - IDLE_PERIOD.minMs), mass);
	if (Number.isInteger(ms)) ms += .37;
	return ms;
}
function phaseDurations(actionFamily, mass) {
	const phases = ACTION_PHASES[actionFamily];
	if (!phases) throw new Error("timing: no phases for " + actionFamily);
	return phases.map(([name, base]) => [name, scaleMs(base, mass)]);
}
/** Normalized time at `fraction` through `phase` of an action family (mass-invariant). */
function tAt(actionFamily, phase, fraction = 1) {
	const phases = ACTION_PHASES[actionFamily];
	if (!phases) throw new Error("timing: no phases for " + actionFamily);
	const total = phases.reduce((s, [, ms]) => s + ms, 0);
	let acc = 0;
	for (const [name, ms] of phases) {
		if (name === phase) return (acc + ms * fraction) / total;
		acc += ms;
	}
	throw new Error(`timing: ${actionFamily} has no phase ${phase}`);
}
var MASS_CLASS, MASS_BY_SIZE_INDEX, SCALE_MIN, SMEAR_FRAME_MS, ACTION_PHASES, HITSTOP, IDLE_PERIOD, hitstopMs;
var init_timing = __esmMin((() => {
	init_src$2();
	MASS_CLASS = Object.freeze({
		tiny: .7,
		small: .85,
		medium: 1,
		large: 1.2,
		huge: 1.4,
		titanic: 1.6
	});
	MASS_BY_SIZE_INDEX = Object.freeze([
		"tiny",
		"small",
		"medium",
		"large",
		"huge",
		"titanic"
	]);
	SCALE_MIN = .6;
	SMEAR_FRAME_MS = 1e3 / 60;
	Object.freeze({
		desktop: 60,
		phone: 30
	});
	ACTION_PHASES = Object.freeze({
		idle: [["period", 3e3]],
		alert: [["lift", 220]],
		approach: [["stride", 420]],
		melee: [
			["anticipation", 140],
			["strike", 90],
			["smear", SMEAR_FRAME_MS],
			["recovery", 260]
		],
		cast: [
			["rise", 180],
			["hold", 120],
			["release", 90],
			["settle", 220]
		],
		hit: [
			["recoil", 110],
			["stagger", 160],
			["settle", 180]
		],
		dodge: [["out", 120], ["back", 160]],
		faint: [["fall", 520]],
		victory: [
			["rear", 210],
			["toss", 150],
			["settle", 240]
		],
		return: [["walk", 380]],
		tame: [
			["approach", 260],
			["lower", 200],
			["settle", 180]
		],
		feed: [
			["down", 160],
			["chew", 120],
			["chew2", 120],
			["up", 180]
		],
		sway: [["period", 3e3]],
		disturb: [["recoil", 120], ["settle", 260]],
		harvest: [
			["shake", 180],
			["detach", 90],
			["settle", 220]
		],
		grow: [
			["rise", 320],
			["overshoot", 120],
			["settle", 160]
		]
	});
	HITSTOP = Object.freeze({
		baseMs: 70,
		capMs: 140
	});
	Object.freeze({
		whiteFrames: 2,
		fadeMs: 120
	});
	Object.freeze({
		amplitudePx: 6,
		ms: 180
	});
	Object.freeze({
		popMs: 90,
		popEase: "back-out",
		riseMs: 420,
		fadeMs: 160
	});
	Object.freeze({
		readyEaseFraction: .1,
		ease: "ease-out"
	});
	IDLE_PERIOD = Object.freeze({
		minMs: 2600,
		maxMs: 3400
	});
	hitstopMs = (attackerMass) => Math.min(HITSTOP.baseMs * attackerMass, HITSTOP.capMs);
})), P$5, REST$1, legs, crouch, ears$1, strideA, strideB, gaitCycle, meleeFor, QUADRUPED_ACTIONS, DEG;
var init_actions = __esmMin((() => {
	init_timing();
	Object.freeze([
		"ease-out",
		"ease-in",
		"back-out",
		"sine-in-out"
	]);
	P$5 = (t, ease, joints, dx = 0, dy = 0) => ({
		t,
		ease,
		joints,
		root: {
			dx,
			dy
		}
	});
	REST$1 = {};
	legs = (foreFar, hindFar, foreNear = foreFar, hindNear = hindFar, bend = 0) => ({
		foreFarKnee: foreFar,
		foreNearKnee: foreNear,
		hindFarKnee: hindFar,
		hindNearKnee: hindNear,
		foreFarAnkle: -bend,
		foreNearAnkle: -bend,
		hindFarAnkle: bend,
		hindNearAnkle: bend
	});
	crouch = (depth) => ({
		...legs(-depth * .4, depth * .5, -depth * .4, depth * .5, depth),
		spine: depth * .3,
		tail0: -depth * .3
	});
	ears$1 = (deg) => ({
		earFarTip: deg,
		earNearTip: deg
	});
	strideA = (amp, bend) => ({ ...legs(-amp, amp, amp, -amp, bend) });
	strideB = (amp, bend) => ({ ...legs(amp, -amp, -amp, amp, bend) });
	gaitCycle = (id) => {
		if (id === "walk") return [
			P$5(.25, "sine-in-out", strideA(18, 8), 0, -.01),
			P$5(.5, "sine-in-out", { ...legs(0, 0, 0, 0, 14) }, 0, .004),
			P$5(.75, "sine-in-out", strideB(18, 8), 0, -.01),
			P$5(1, "sine-in-out", REST$1)
		];
		if (id === "trot") return [
			P$5(.25, "sine-in-out", {
				...strideA(26, 12),
				spine: -3,
				neck: -4
			}, 0, -.022),
			P$5(.5, "sine-in-out", {
				...legs(0, 0, 0, 0, 18),
				spine: 2
			}, 0, .006),
			P$5(.75, "sine-in-out", {
				...strideB(26, 12),
				spine: -3,
				neck: -4
			}, 0, -.022),
			P$5(1, "sine-in-out", REST$1)
		];
		if (id === "gallop") return [
			P$5(.2, "ease-in", {
				...legs(20, -20, 24, -24, 24),
				spine: 10,
				chest: 6,
				neck: 6,
				tail0: 12
			}, 0, .02),
			P$5(.45, "ease-out", {
				...legs(-36, 34, -30, 30, 4),
				spine: -12,
				chest: -6,
				neck: -10,
				head: -6,
				tail0: -14
			}, 0, -.08),
			P$5(.7, "ease-in", {
				...legs(20, -20, 24, -24, 24),
				spine: 10,
				chest: 6,
				neck: 6,
				tail0: 12
			}, 0, .02),
			P$5(.95, "ease-out", {
				...legs(-36, 34, -30, 30, 4),
				spine: -12,
				chest: -6,
				neck: -10,
				head: -6,
				tail0: -14
			}, 0, -.08),
			P$5(1, "ease-out", REST$1)
		];
		return [
			P$5(.3, "ease-in", {
				...crouch(36),
				head: 8
			}, 0, .04),
			P$5(.65, "ease-out", {
				...legs(-30, 34, -30, 34, 0),
				spine: -6,
				neck: -8,
				tail0: -10
			}, 0, -.14),
			P$5(1, "back-out", { ...crouch(16) }, 0, .016)
		];
	};
	meleeFor = (strike, launch = {}, anticipation = {}) => {
		const m = "melee";
		return [
			P$5(tAt(m, "anticipation"), "ease-in", {
				...crouch(30),
				spine: 12,
				neck: 8,
				head: 10,
				...anticipation
			}, -.04, .03),
			P$5(tAt(m, "strike"), "ease-out", {
				...legs(-30, 30, -30, 30, -10),
				spine: -6,
				neck: -10,
				head: -6,
				jaw: -10,
				tail0: -12,
				...launch
			}, .36, -.05),
			P$5(tAt(m, "smear"), "ease-out", {
				...legs(-30, 30, -30, 30, -10),
				spine: -2,
				head: 8,
				...strike
			}, .4, -.01),
			P$5(tAt(m, "recovery", .55), "back-out", {
				...crouch(10),
				head: 2
			}, .1, .01),
			P$5(1, "ease-out", REST$1)
		];
	};
	QUADRUPED_ACTIONS = Object.freeze({
		idle: {
			id: "idle",
			family: "idle",
			loop: true,
			poses: [
				P$5(.25, "sine-in-out", {
					tail0: 4,
					tail1: 3,
					pelvis: 1
				}, .008, -.004),
				P$5(.5, "sine-in-out", {
					spine: -2,
					chest: -2,
					neck: -3,
					head: 1,
					...ears$1(-3)
				}, 0, -.011),
				P$5(.75, "sine-in-out", {
					tail0: -4,
					tail1: -3,
					pelvis: -1
				}, -.008, -.004),
				P$5(1, "sine-in-out", REST$1)
			]
		},
		alert: {
			id: "alert",
			family: "alert",
			loop: false,
			poses: [P$5(1, "back-out", {
				neck: -12,
				head: -8,
				spine: -3,
				tail0: -6,
				...ears$1(-20)
			}, 0, -.006)]
		},
		"approach:walk": {
			id: "approach:walk",
			family: "approach",
			loop: false,
			poses: gaitCycle("walk")
		},
		"approach:trot": {
			id: "approach:trot",
			family: "approach",
			loop: false,
			poses: gaitCycle("trot")
		},
		"approach:gallop": {
			id: "approach:gallop",
			family: "approach",
			loop: false,
			poses: gaitCycle("gallop")
		},
		"approach:hop": {
			id: "approach:hop",
			family: "approach",
			loop: false,
			poses: gaitCycle("hop")
		},
		"melee:bite": {
			id: "melee:bite",
			family: "melee",
			loop: false,
			poses: meleeFor({
				jaw: -25,
				head: 12,
				neck: 6,
				foreNearKnee: -40
			})
		},
		"melee:claw": {
			id: "melee:claw",
			family: "melee",
			loop: false,
			poses: meleeFor({
				jaw: -8,
				foreNearKnee: 40,
				foreNearAnkle: 30,
				head: 5
			}, {
				foreNearKnee: -55,
				foreNearAnkle: 30
			})
		},
		"melee:gore": {
			id: "melee:gore",
			family: "melee",
			loop: false,
			poses: meleeFor({
				neck: -25,
				head: -30,
				jaw: 0
			}, {
				neck: 20,
				head: 25,
				jaw: 0
			}, {
				neck: 18,
				head: 22
			})
		},
		"melee:tail": {
			id: "melee:tail",
			family: "melee",
			loop: false,
			poses: meleeFor({
				tail0: 35,
				tail1: 30,
				tail2: 20,
				tail3: 12,
				pelvis: 6,
				jaw: 0
			}, {
				tail0: -30,
				tail1: -22,
				tail2: -12,
				pelvis: -6,
				jaw: 0
			}, {
				pelvis: -8,
				tail0: -20,
				tail1: -12
			})
		},
		"melee:headbutt": {
			id: "melee:headbutt",
			family: "melee",
			loop: false,
			poses: meleeFor({
				neck: 20,
				head: 15,
				jaw: 0
			}, {
				neck: -15,
				head: -10,
				jaw: 0
			}, {
				neck: -15,
				head: -10
			})
		},
		cast: {
			id: "cast",
			family: "cast",
			loop: false,
			poses: [
				P$5(tAt("cast", "rise"), "ease-in", {
					pelvis: -5,
					spine: -18,
					chest: -15,
					neck: -12,
					...legs(-45, 10, -45, 10, 16),
					tail0: 8
				}, -.02, -.06),
				P$5(tAt("cast", "hold"), "sine-in-out", {
					pelvis: -5,
					spine: -18,
					chest: -15,
					neck: -14,
					head: -5,
					...legs(-42, 12, -48, 12, 16),
					tail0: 6,
					...ears$1(-8)
				}, -.02, -.064),
				P$5(tAt("cast", "release"), "ease-out", {
					spine: -10,
					chest: -6,
					neck: 10,
					head: 25,
					jaw: -15,
					...legs(-30, 20, -30, 20, 8)
				}, .06, -.03),
				P$5(1, "back-out", REST$1)
			]
		},
		hit: {
			id: "hit",
			family: "hit",
			loop: false,
			poses: [
				P$5(tAt("hit", "recoil"), "ease-out", {
					head: -20,
					neck: -12,
					spine: 6,
					chest: -6,
					pelvis: -4,
					jaw: -8,
					...ears$1(12),
					tail0: 10
				}, -.08, .02),
				P$5(tAt("hit", "stagger"), "ease-out", {
					head: -8,
					neck: -6,
					spine: 3,
					hindFarKnee: -12,
					hindFarAnkle: 18,
					foreNearKnee: 10,
					tail0: 6
				}, -.14, .012),
				P$5(1, "back-out", REST$1)
			]
		},
		dodge: {
			id: "dodge",
			family: "dodge",
			loop: false,
			poses: [P$5(tAt("dodge", "out"), "ease-out", {
				spine: -4,
				neck: -6,
				...legs(-12, 15, -12, 15, 6)
			}, -.25, -.04), P$5(1, "back-out", REST$1)]
		},
		faint: {
			id: "faint",
			family: "faint",
			loop: false,
			poses: [P$5(.45, "ease-in", {
				...crouch(40),
				head: 10,
				neck: 10
			}, 0, .1), P$5(1, "ease-out", {
				...legs(-20, 30, -20, 30, 60),
				root: 10,
				spine: 8,
				neck: 25,
				head: 30,
				tail0: 20,
				tail1: 12,
				...ears$1(16)
			}, -.02, .22)]
		},
		victory: {
			id: "victory",
			family: "victory",
			loop: false,
			poses: [
				P$5(tAt("victory", "rear"), "ease-out", {
					pelvis: -6,
					spine: -20,
					chest: -12,
					neck: -8,
					head: -15,
					jaw: -10,
					...legs(-45, 12, -45, 12, 14),
					tail0: -12
				}, 0, -.08),
				P$5(tAt("victory", "toss"), "back-out", {
					pelvis: -6,
					spine: -20,
					chest: -12,
					neck: -12,
					head: -25,
					...legs(-40, 12, -50, 12, 14),
					tail0: -16,
					...ears$1(-15)
				}, 0, -.084),
				P$5(1, "back-out", REST$1)
			]
		},
		tame: {
			id: "tame",
			family: "tame",
			loop: false,
			poses: [
				P$5(tAt("tame", "approach"), "ease-out", {
					head: -6,
					...strideA(12, 6)
				}, .12, -.008),
				P$5(tAt("tame", "lower"), "ease-out", {
					neck: 20,
					head: 18,
					spine: 3,
					...ears$1(-10),
					tail0: 4
				}, .12, .02),
				P$5(1, "back-out", { head: 6 }, .12, .004)
			]
		},
		feed: {
			id: "feed",
			family: "feed",
			loop: false,
			poses: [
				P$5(tAt("feed", "down"), "ease-out", {
					neck: 25,
					head: 20,
					foreFarKnee: 5,
					foreNearKnee: 5
				}, .02, .012),
				P$5(tAt("feed", "chew", .5), "sine-in-out", {
					neck: 25,
					head: 20,
					jaw: -14,
					foreFarKnee: 5,
					foreNearKnee: 5
				}, .02, .012),
				P$5(tAt("feed", "chew"), "sine-in-out", {
					neck: 25,
					head: 20,
					jaw: -2,
					foreFarKnee: 5,
					foreNearKnee: 5
				}, .02, .012),
				P$5(tAt("feed", "chew2", .5), "sine-in-out", {
					neck: 25,
					head: 20,
					jaw: -14,
					foreFarKnee: 5,
					foreNearKnee: 5
				}, .02, .012),
				P$5(tAt("feed", "chew2"), "sine-in-out", {
					neck: 25,
					head: 20,
					jaw: -2,
					foreFarKnee: 5,
					foreNearKnee: 5
				}, .02, .012),
				P$5(1, "back-out", REST$1)
			]
		}
	});
	Object.freeze(Object.keys(QUADRUPED_ACTIONS));
	DEG = Math.PI / 180;
}));
//#endregion
//#region port/v2/apps/game/src/motion/specialized-actions.ts
function specializedActions(id) {
	const spec = specializedTemplate(id);
	if (!spec) return void 0;
	const pose = (wave, effort, locomote = false) => {
		const j = {};
		for (const [role, names] of Object.entries(spec.roles)) for (const [name, index] of names.map((n, i) => [n, i])) j[name] = role === "legs" ? locomote ? Math.sin(index * .9 + wave) * effort * .25 : 0 : role === "valves" ? (index % 2 ? -1 : 1) * effort : role === "claws" ? -effort : role === "reach" ? effort * .5 : role === "wave" ? Math.sin(index * .65 + wave) * effort : role === "sensors" ? Math.sin(wave + index) * effort * .65 : Math.sin(wave) * effort * .3;
		for (const rigid of spec.rigid) j[rigid] = 0;
		return j;
	};
	const action = (id, family, effort, loop = false, travel = 0) => {
		const times = family === "melee" ? [
			tAt("melee", "anticipation"),
			tAt("melee", "strike"),
			tAt("melee", "smear")
		] : family === "cast" ? [
			tAt("cast", "rise"),
			tAt("cast", "hold"),
			tAt("cast", "release")
		] : family === "hit" ? [
			tAt("hit", "recoil"),
			tAt("hit", "stagger"),
			tAt("hit", "settle", .5)
		] : [
			.25,
			.5,
			.75
		];
		const loaded = (wave, gain) => ({
			...pose(wave, gain, family === "approach"),
			...!spec.anchored && spec.legs.length && ["hit", "faint"].includes(family) ? { root: family === "faint" ? 0 : -Math.sin(wave) * 3 } : {}
		});
		const scaleLoading = spec.id === "brachyuran" && ["hit", "faint"].includes(family);
		const loading = scaleLoading ? family === "faint" ? .08 : .03 : !spec.anchored && spec.legs.length && family === "faint" ? .015 : 0;
		return {
			id,
			family,
			loop,
			...scaleLoading ? { rootUnit: "motion-scale" } : {},
			poses: [
				P$4(times[0], loaded(0, effort * .6)),
				P$4(times[1], loaded(Math.PI / 2, effort), spec.anchored ? 0 : travel, loading),
				P$4(times[2], loaded(Math.PI, effort), spec.anchored ? 0 : travel * .35),
				P$4(1, {})
			]
		};
	};
	const actions = [
		action("idle", "idle", 3, true),
		action("alert", "alert", 7),
		...spec.gaits.map((g) => action("approach:" + g, "approach", g === "anchored" ? 4 : 12, true)),
		action("cast", "cast", 14, false),
		action("hit", "hit", 10),
		action("dodge", "dodge", 8, false, spec.anchored ? 0 : -.08),
		action("faint", "faint", 5),
		action("victory", "victory", 12),
		action("tame", "tame", 5),
		action("feed", "feed", 6)
	];
	if (id === "crustacean-small") actions.push({
		id: "melee:claw",
		family: "melee",
		loop: false,
		poses: [P$4(1, {})]
	});
	if (id === "crustacean-clawed") actions.push(action("melee:pinch", "melee", 25, false, .08));
	if (id === "brachyuran") {
		const pincerJoints = spec.roles.claws;
		if (!pincerJoints?.length) throw Error("Missing pincer contract");
		const claws = (closure) => Object.fromEntries(pincerJoints.map((j) => [j, closure]));
		actions.push({
			id: "melee:pinch",
			family: "melee",
			loop: false,
			poses: [
				P$4(tAt("melee", "anticipation"), claws(8)),
				P$4(tAt("melee", "strike"), claws(-25)),
				P$4(tAt("melee", "smear"), claws(-25)),
				P$4(1, {})
			]
		});
	}
	return Object.freeze(Object.fromEntries(actions.map((a) => [a.id, a])));
}
var P$4;
var init_specialized_actions = __esmMin((() => {
	init_specialized_templates();
	init_timing();
	P$4 = (t, joints, dx = 0, dy = 0) => ({
		t,
		ease: "sine-in-out",
		joints,
		root: {
			dx,
			dy
		}
	});
}));
//#endregion
//#region port/v2/apps/game/src/motion/additional-actions.ts
var pose, attack, forward, level, ADDITIONAL_ACTIONS;
var init_additional_actions = __esmMin((() => {
	init_timing();
	pose = (t, joints, dx, dy, ease) => ({
		t,
		joints,
		root: {
			dx,
			dy
		},
		ease
	});
	attack = (verb, anticipation, launch, contact, recovery, dx, dy) => Object.freeze({
		id: "melee:" + verb,
		family: "melee",
		loop: false,
		poses: [
			pose(tAt("melee", "anticipation"), anticipation, dx[0], dy[0], "ease-in"),
			pose(tAt("melee", "strike"), launch, dx[1], dy[1], "ease-out"),
			pose(tAt("melee", "smear"), contact, dx[2], dy[2], "ease-out"),
			pose(tAt("melee", "recovery", .55), recovery, dx[3], dy[3], "back-out"),
			pose(1, {}, 0, 0, "ease-out")
		]
	});
	forward = [
		-.025,
		.18,
		.2,
		.04
	];
	level = [
		.005,
		-.01,
		0,
		.003
	];
	ADDITIONAL_ACTIONS = Object.freeze({
		quadruped: Object.freeze({ "melee:kick": attack("kick", {
			spine: -3,
			chest: -4,
			foreNearKnee: 22,
			foreNearAnkle: -34,
			foreNearPaw: 12
		}, {
			chest: -5,
			neck: 5,
			foreNearKnee: -44,
			foreNearAnkle: 30,
			foreNearPaw: -8,
			hindNearKnee: 8
		}, {
			chest: -4,
			foreNearKnee: -52,
			foreNearAnkle: 38,
			foreNearPaw: -12,
			tail0: 8
		}, {
			foreNearKnee: 8,
			foreNearAnkle: -20,
			foreNearPaw: 7
		}, forward, level) }),
		"biped-bird": Object.freeze({ "melee:kick": attack("kick", {
			pelvis: 4,
			spine: -5,
			legNearKnee: 25,
			legNearAnkle: -35,
			legNearFoot: 12,
			neck0: -6
		}, {
			pelvis: -4,
			spine: -8,
			legNearKnee: -45,
			legNearAnkle: 50,
			legNearFoot: -15,
			neck0: 8,
			tailFan: 8
		}, {
			spine: -6,
			legNearKnee: -58,
			legNearAnkle: 65,
			legNearFoot: -22,
			neck0: 10,
			tailFan: 10
		}, {
			legNearKnee: 12,
			legNearAnkle: -22,
			neck0: -3
		}, forward, level) }),
		fish: Object.freeze({
			"melee:body": attack("body", {
				spine0: 5,
				spine1: 8,
				spine2: 4,
				spine4: -8,
				caudal: -12
			}, {
				head: -4,
				spine0: -4,
				spine1: -6,
				spine3: 5,
				spine4: 10,
				caudal: 18,
				pectoralNear: 10
			}, {
				head: 6,
				spine0: 6,
				spine1: 3,
				spine4: 8,
				caudal: 14
			}, {
				head: -2,
				spine0: -3,
				spine3: -5,
				caudal: -10
			}, [
				-.04,
				.28,
				.31,
				.06
			], [
				0,
				-.015,
				-.005,
				0
			]),
			"melee:tail": attack("tail", {
				spine2: -8,
				spine3: -12,
				spine4: -16,
				spine5: -18,
				caudal: -22
			}, {
				spine1: 3,
				spine2: 8,
				spine3: 12,
				spine4: 18,
				spine5: 22,
				caudal: 28
			}, {
				spine3: 16,
				spine4: 20,
				spine5: 26,
				caudal: 34,
				pectoralNear: -12
			}, {
				spine3: -5,
				spine4: -8,
				spine5: -10,
				caudal: -14
			}, [
				-.02,
				.1,
				.12,
				.02
			], [
				0,
				0,
				0,
				0
			])
		}),
		insect: Object.freeze({ "melee:body": attack("body", {
			thorax: -6,
			abdomen: 10,
			head: -4
		}, {
			thorax: 8,
			abdomen: -10,
			head: 5,
			legFrontNearKnee: -15
		}, {
			thorax: 12,
			abdomen: -6,
			head: 8
		}, {
			thorax: -3,
			abdomen: 4
		}, forward, level) }),
		arachnid: Object.freeze({ "melee:body": attack("body", {
			cephalothorax: -5,
			abdomen: 6,
			leg1NearKnee: 15
		}, {
			cephalothorax: 8,
			abdomen: -8,
			leg1NearKnee: -20
		}, {
			cephalothorax: 10,
			abdomen: -6,
			leg1NearKnee: -25
		}, {
			cephalothorax: -3,
			abdomen: 3
		}, forward, level) }),
		myriapod: Object.freeze({ "melee:body": attack("body", {
			head: -4,
			seg0: -6,
			seg1: -10,
			seg2: -12,
			seg3: -8,
			seg4: 6
		}, {
			head: 4,
			seg0: 6,
			seg1: 10,
			seg2: 12,
			seg3: 10,
			seg4: -6
		}, {
			head: 6,
			seg0: 8,
			seg1: 12,
			seg2: 16,
			seg3: 12
		}, {
			seg0: -3,
			seg1: -4,
			seg2: -5,
			seg3: -3
		}, forward, [
			0,
			0,
			0,
			0
		]) }),
		radial: Object.freeze({ "melee:body": attack("body", {
			centre: -5,
			bell: -10,
			arm0Seg0: 8,
			arm3Seg0: -8
		}, {
			centre: 5,
			bell: 12,
			arm0Seg0: -12,
			arm3Seg0: 12
		}, {
			centre: 8,
			bell: 15,
			arm0Seg0: -15,
			arm3Seg0: 15
		}, {
			centre: -2,
			bell: -4,
			arm0Seg0: 4,
			arm3Seg0: -4
		}, [
			-.02,
			.14,
			.16,
			.03
		], [
			0,
			-.025,
			0,
			.008
		]) })
	});
}));
//#endregion
//#region port/v2/apps/game/src/motion/travelling-wave.ts
/** Relative-to-rest curvature wave. The constant phase offset makes every
* channel exactly zero at rest without synchronizing segment extrema. */
function travellingWave(joints, amplitudesDeg, wavelength = 1, keys = 64) {
	if (joints.length < 3 || amplitudesDeg.length !== joints.length || new Set(joints).size !== joints.length || amplitudesDeg.some((a) => !Number.isFinite(a) || a < 0) || !Number.isFinite(wavelength) || wavelength <= 0 || !Number.isInteger(keys) || keys < 32 || keys > 128) throw Error("motion: invalid travelling wave");
	return Array.from({ length: keys }, (_, i) => {
		const t = (i + 1) / keys;
		return P$3(t, "sine-in-out", Object.fromEntries(joints.map((j, k) => {
			const phase = 2 * Math.PI * k / ((joints.length - 1) * wavelength);
			return [j, i === keys - 1 ? 0 : amplitudesDeg[k] * (Math.sin(2 * Math.PI * t - phase) - Math.sin(-phase))];
		})));
	});
}
var P$3;
var init_travelling_wave = __esmMin((() => {
	P$3 = (t, ease, joints) => ({
		t,
		ease,
		joints,
		root: {
			dx: 0,
			dy: 0
		}
	});
}));
//#endregion
//#region port/v2/apps/game/src/motion/family-actions.ts
function radialActions(arms = 6) {
	const splay = (s0, s1, s2) => Object.fromEntries(Array.from({ length: arms }, (_, i) => i).flatMap((n) => {
		const k = n % 2 === 0 ? 1 : -1;
		return [
			["arm" + n + "Seg0", s0 * k],
			["arm" + n + "Seg1", s1 * k],
			["arm" + n + "Seg2", s2 * k]
		];
	}));
	return fauna({
		idle: [
			{
				bell: 3,
				...splay(3, 4, 5)
			},
			{
				bell: -4,
				centre: 1,
				...splay(-2, -3, -4)
			},
			{
				bell: 3,
				...splay(2, 3, 4)
			},
			0,
			-.006,
			-.012
		],
		alert: [{
			bell: -12,
			centre: -3,
			...splay(-15, -20, -25)
		}, -.02],
		approach: {
			drift: loop4({
				...splay(6, 9, 12),
				bell: 2
			}, {
				...splay(-3, -5, -8),
				bell: -3
			}, {
				...splay(5, 8, 11),
				bell: 2
			}, .02, -.02, -.03),
			pulse: [
				P$2(.3, "ease-in", {
					bell: -18,
					centre: -2,
					...splay(-30, -35, -40)
				}, 0, -.1),
				P$2(.6, "ease-out", {
					bell: 15,
					centre: 2,
					...splay(20, 25, 30)
				}, 0, -.04),
				P$2(.85, "sine-in-out", {
					bell: 4,
					...splay(8, 10, 12)
				}, 0, -.02),
				P$2(1, "sine-in-out", REST, 0, -.01)
			]
		},
		melee: { "sting-arms": melee({
			bell: -10,
			...splay(-20, -30, -35)
		}, {
			bell: 15,
			root: 10,
			...splay(35, 45, 50)
		}, {
			root: 14,
			bell: 12,
			...splay(40, 52, 55)
		}, {
			bell: 4,
			...splay(10, 15, 20)
		}, [
			-.03,
			.22,
			.28,
			.08
		], [
			.01,
			-.02,
			-.01,
			0
		]) },
		cast: cast({
			bell: -20,
			root: -15,
			...splay(-30, -40, -45)
		}, {
			bell: -22,
			root: -15,
			...splay(-32, -42, -48)
		}, {
			bell: 18,
			root: 5,
			...splay(30, 40, 45)
		}, -.08),
		hit: hit({
			bell: 12,
			centre: -8,
			root: -12,
			...splay(-15, -25, -30)
		}, {
			root: -6,
			...splay(10, 15, 20)
		}),
		dodge: dodge({
			bell: -15,
			root: -20,
			...splay(-25, -35, -40)
		}, -.2, -.06),
		faint: faint({
			bell: 10,
			...splay(15, 20, 25)
		}, {
			root: 30,
			bell: 20,
			...splay(30, 40, 45)
		}, .06, .18),
		victory: victory({
			bell: -20,
			root: -25,
			...splay(-35, -45, -50)
		}, {
			bell: 15,
			root: -10,
			...splay(30, 45, 50)
		}, -.1),
		tame: tame({
			...splay(6, 9, 12),
			bell: 2
		}, {
			bell: 8,
			...splay(15, 20, 25)
		}, { bell: 3 }),
		feed: feed({
			bell: 5,
			...splay(30, 40, 45)
		}, splay(40, 52, 55), splay(25, 35, 40))
	});
}
/** Compact rigid-trunk articulation: all walking limbs remain two-link;
* motion travels through source steps, while the long trunk stays level.
* The ultimate pair senses/fans behind the body and is not a stance foot. */
function compactMyriapodActions(pairs, ultimatePairs) {
	const legs = Array.from({ length: pairs }, (_, i) => ["leg" + i + "Far", "leg" + i + "Near"]).flat();
	const wave = (k, f) => Object.fromEntries(legs.flatMap((id, i) => {
		const sign = (Math.floor(i / 2) + i % 2) % 2 ? 1 : -1;
		return [[id + "Knee", k * sign], [id + "Foot", f * sign]];
	}));
	const ultimate = (v) => ultimatePairs === 1 ? {
		ultimateFar: -v,
		ultimateNear: v
	} : {};
	const take = (j, dx = 0, dy = 0) => P$2(1, "sine-in-out", j, dx, dy);
	return fauna({
		idle: [
			{
				...ant(-3),
				...ultimate(2)
			},
			{ head: -2 },
			{
				...ant(3),
				...ultimate(-2)
			},
			0,
			-.001,
			-.002
		],
		alert: [{
			head: -12,
			...ant(-24),
			...ultimate(5)
		}, -.002],
		approach: { crawl: loop4(wave(22, 12), wave(-3, 5), wave(-22, -12)) },
		melee: {
			mandible: melee({ head: -12 }, {
				head: 8,
				mandible: -20
			}, {
				head: 16,
				mandible: -38
			}, { head: 2 }, [
				-.02,
				.1,
				.12,
				.03
			], [
				0,
				0,
				0,
				0
			]),
			body: melee({
				head: -4,
				...ultimate(3)
			}, { head: 3 }, {
				head: 6,
				...ultimate(-3)
			}, { head: 1 }, [
				-.01,
				.07,
				.09,
				.02
			], [
				0,
				0,
				0,
				0
			])
		},
		cast: [
			P$2(tAt("cast", "rise"), "ease-in", {
				head: -16,
				...ant(-15)
			}, 0, -.002),
			P$2(tAt("cast", "hold"), "sine-in-out", {
				head: -20,
				...ant(-25),
				...ultimate(8)
			}, 0, -.002),
			P$2(tAt("cast", "release"), "ease-out", {
				head: 14,
				mandible: -15
			}, 0, 0),
			take(REST)
		],
		hit: hit({
			head: -18,
			...ant(20),
			...ultimate(8)
		}, {
			head: -6,
			...ultimate(3)
		}, .002),
		dodge: dodge({
			...wave(16, -18),
			head: -5,
			...ultimate(10)
		}, -.12, 0),
		faint: [P$2(.45, "ease-in", {
			head: 6,
			...ant(12)
		}, 0, .003), P$2(1, "ease-out", {
			head: 20,
			...ant(30),
			...ultimate(-10)
		}, 0, .006)],
		victory: [
			P$2(tAt("victory", "rear"), "ease-out", {
				head: -22,
				...ant(-28),
				...ultimate(8)
			}, 0, -.002),
			P$2(tAt("victory", "toss"), "back-out", {
				head: -28,
				mandible: -12,
				...ant(-38),
				...ultimate(12)
			}, 0, -.002),
			take(REST)
		],
		tame: [
			P$2(tAt("tame", "approach"), "ease-out", wave(12, 8), .1, 0),
			P$2(tAt("tame", "lower"), "ease-out", {
				head: 14,
				...ant(12)
			}, .1, .002),
			P$2(1, "back-out", { head: 5 }, .1, 0)
		],
		feed: feed({ head: 18 }, { mandible: -20 }, { mandible: -3 })
	});
}
function cephalopodActions(arms = 8, feedingTentacles = 0) {
	const cephArmsA = Array.from({ length: arms }, (_, i) => "arm" + i), tentacles = Array.from({ length: feedingTentacles }, (_, i) => "tentacle" + i);
	const csplay = (s0, s1, s2) => Object.fromEntries([...cephArmsA, ...tentacles].flatMap((a, n) => {
		const k = n < arms ? n < arms / 2 ? -1 : 1 : n - arms < feedingTentacles / 2 ? -1 : 1;
		return [
			[a + "Seg0", s0 * k],
			[a + "Seg1", s1 * k],
			[a + "Seg2", s2 * k]
		];
	}));
	const calt = (s0, s1, s2) => Object.fromEntries([...cephArmsA, ...tentacles].flatMap((a, n) => {
		const k = n % 2 === 0 ? 1 : -1;
		return [
			[a + "Seg0", s0 * k],
			[a + "Seg1", s1 * k],
			[a + "Seg2", s2 * k]
		];
	}));
	const front = (a, b, c) => Object.fromEntries((tentacles.length ? tentacles : [cephArmsA[Math.floor((arms - 1) / 2)], cephArmsA[Math.ceil((arms - 1) / 2)]]).flatMap((n) => [
		[n + "Seg0", a],
		[n + "Seg1", b],
		[n + "Seg2", c]
	]));
	const fins = (v) => ({
		finFar: -v,
		finNear: v
	});
	const eyes = (v) => ({
		eyeFar: v,
		eyeNear: v
	});
	return fauna({
		idle: [
			{
				mantle: 2,
				...csplay(3, 4, 5)
			},
			{
				head: -2,
				...fins(6),
				siphon: -4
			},
			{
				mantle: -2,
				...csplay(-2, -3, -4)
			},
			.002,
			-.005,
			-.01
		],
		alert: [{
			mantle: -10,
			head: -5,
			...csplay(-15, -20, -25),
			...eyes(-8),
			...fins(20)
		}, -.02],
		approach: {
			jet: [
				P$2(.3, "ease-in", {
					mantle: -12,
					siphon: 25,
					...csplay(-28, -34, -40)
				}, 0, -.06),
				P$2(.6, "ease-out", {
					mantle: 10,
					siphon: -10,
					...csplay(18, 24, 30),
					...fins(15)
				}, .3, -.12),
				P$2(.85, "sine-in-out", {
					mantle: 3,
					...csplay(6, 8, 10)
				}, .45, -.05),
				P$2(1, "sine-in-out", REST, 0, -.02)
			],
			crawl: loop4(calt(20, 25, 30), {
				mantle: -2,
				...fins(5)
			}, calt(-20, -25, -30), 0, -.004, .002)
		},
		melee: {
			lash: melee({
				mantle: -6,
				...front(-40, -50, -55),
				...eyes(-5)
			}, {
				mantle: 8,
				root: 6,
				...front(45, 60, 70)
			}, {
				root: 10,
				mantle: 10,
				...front(40, 60, -80)
			}, {
				mantle: 3,
				...front(10, 15, 20)
			}, [
				-.04,
				.28,
				.34,
				.1
			], [
				.02,
				-.03,
				-.01,
				.01
			]),
			bite: melee({
				head: -10,
				mantle: -4,
				...csplay(-10, -15, -20)
			}, {
				head: 8,
				root: 4,
				...csplay(15, 20, 25)
			}, {
				head: 15,
				root: 8,
				...csplay(25, 35, 40),
				...eyes(6)
			}, { head: 2 }, [
				-.04,
				.26,
				.32,
				.1
			], [
				.02,
				-.03,
				-.01,
				.01
			])
		},
		cast: cast({
			mantle: -18,
			head: -8,
			...csplay(-30, -40, -45),
			...fins(25),
			siphon: 15
		}, {
			mantle: -20,
			head: -10,
			...csplay(-32, -42, -48),
			...fins(28),
			siphon: 18
		}, {
			mantle: 12,
			head: 6,
			...csplay(28, 38, 42),
			siphon: -20
		}, -.08),
		hit: hit({
			mantle: 12,
			head: -10,
			root: -10,
			...csplay(-12, -20, -25),
			...eyes(-8)
		}, {
			root: -5,
			...csplay(8, 12, 15)
		}),
		dodge: dodge({
			mantle: -12,
			root: -18,
			siphon: 30,
			...csplay(-25, -35, -40)
		}, -.22, -.07),
		faint: faint({
			mantle: 8,
			...csplay(12, 18, 22)
		}, {
			root: 28,
			mantle: 18,
			head: 10,
			...csplay(28, 38, 45),
			...fins(-15)
		}, .06, .18),
		victory: victory({
			mantle: -18,
			root: -22,
			...csplay(-35, -45, -50),
			...fins(30)
		}, {
			mantle: 12,
			root: -8,
			...csplay(30, 42, 50),
			...fins(35),
			...eyes(10)
		}, -.1),
		tame: tame({
			...csplay(5, 8, 10),
			mantle: 2
		}, {
			head: 8,
			...csplay(14, 20, 24)
		}, { head: 3 }),
		feed: feed({
			head: 5,
			...csplay(28, 38, 42)
		}, csplay(40, 50, 55), csplay(24, 32, 38))
	});
}
function actionsFor(templateId, anatomy) {
	const branches = plantBranchCount(templateId, anatomy);
	if (branches !== null) return plant((k) => wsway(k, branches), Object.fromEntries(Array.from({ length: branches }, (_, i) => ["leaf" + i, i % 2 ? -30 : 30])));
	const counts = appendageCounts(templateId, anatomy);
	if (counts && "walkingLegPairs" in counts) return compactMyriapodActions(counts.walkingLegPairs, counts.ultimateLegPairs);
	if (counts) return Object.freeze({
		...templateId === "radial" ? radialActions(counts.arms) : cephalopodActions(counts.arms, counts.feedingTentacles),
		...ADDITIONAL_ACTIONS[templateId]
	});
	return ACTIONS_BY_TEMPLATE[templateId] ?? specializedActions(templateId);
}
var P$2, REST, neg, mul, pair, A, loop4, melee, cast, hit, dodge, faint, victory, tame, feed, fauna, hind, fore, ears, HOPPER, legs2, wings, neck2, BIRD, wave, pect, FISH, tripodA, tripodB, legSet, tripod, allLegs6, frontLegs, ant, wing1, INSECT, swave, SERPENT, tetA, tetB, tetrapod, allLegs8, leg1, leg2, chel, ARACHNID, RADIAL, myA, myB, mtripod, allLegsM, legA, mwave, MYRIAPOD, CEPHALOPOD, bw, bl, bears, FLYER, pa, pl, alt, tail3, climbA, climbB, PRIMATE, wsway, hsway, plant, WOODY, HERB, BASE_ACTIONS_BY_TEMPLATE, ACTIONS_BY_TEMPLATE, MELEE_ALIAS, templateGaits, templateMelees;
var init_family_actions = __esmMin((() => {
	init_actions();
	init_specialized_actions();
	init_additional_actions();
	init_travelling_wave();
	init_plant_anatomy();
	init_repeated_anatomy();
	init_timing();
	P$2 = (t, ease, joints, dx = 0, dy = 0) => ({
		t,
		ease,
		joints,
		root: {
			dx,
			dy
		}
	});
	REST = {};
	neg = (j, k = -1) => Object.fromEntries(Object.entries(j).map(([n, v]) => [n, v * k]));
	mul = (j, k) => neg(j, k);
	pair = (base, v, suffix = "") => ({
		[base + "Far" + suffix]: v,
		[base + "Near" + suffix]: v
	});
	A = (id, family, poses, loop = false) => ({
		id,
		family,
		loop,
		poses
	});
	loop4 = (a, mid, b, dxA = 0, dyA = 0, dyMid = 0) => [
		P$2(.25, "sine-in-out", a, dxA, dyA),
		P$2(.5, "sine-in-out", mid, 0, dyMid),
		P$2(.75, "sine-in-out", b, -dxA, dyA),
		P$2(1, "sine-in-out", REST)
	];
	melee = (anticipation, launch, strike, recover, dx = [
		-.04,
		.36,
		.4,
		.1
	], dy = [
		.03,
		-.05,
		-.01,
		.01
	]) => [
		P$2(tAt("melee", "anticipation"), "ease-in", anticipation, dx[0], dy[0]),
		P$2(tAt("melee", "strike"), "ease-out", launch, dx[1], dy[1]),
		P$2(tAt("melee", "smear"), "ease-out", strike, dx[2], dy[2]),
		P$2(tAt("melee", "recovery", .55), "back-out", recover, dx[3], dy[3]),
		P$2(1, "ease-out", REST)
	];
	cast = (rise, hold, release, dy = -.06) => [
		P$2(tAt("cast", "rise"), "ease-in", rise, -.02, dy),
		P$2(tAt("cast", "hold"), "sine-in-out", hold, -.02, dy - .004),
		P$2(tAt("cast", "release"), "ease-out", release, .06, dy * .5),
		P$2(1, "back-out", REST)
	];
	hit = (recoil, stagger, dy = .02) => [
		P$2(tAt("hit", "recoil"), "ease-out", recoil, -.08, dy),
		P$2(tAt("hit", "stagger"), "ease-out", stagger, -.14, dy * .6),
		P$2(1, "back-out", REST)
	];
	dodge = (out, dx = -.25, dy = -.04) => [P$2(tAt("dodge", "out"), "ease-out", out, dx, dy), P$2(1, "back-out", REST)];
	faint = (mid, end, dyMid = .1, dyEnd = .22) => [P$2(.45, "ease-in", mid, 0, dyMid), P$2(1, "ease-out", end, -.02, dyEnd)];
	victory = (rear, toss, dy = -.08) => [
		P$2(tAt("victory", "rear"), "ease-out", rear, 0, dy),
		P$2(tAt("victory", "toss"), "back-out", toss, 0, dy - .004),
		P$2(1, "back-out", REST)
	];
	tame = (approach, lower, end) => [
		P$2(tAt("tame", "approach"), "ease-out", approach, .12, -.008),
		P$2(tAt("tame", "lower"), "ease-out", lower, .12, .02),
		P$2(1, "back-out", end, .12, .004)
	];
	feed = (down, open, closed) => [
		P$2(tAt("feed", "down"), "ease-out", down, .02, .012),
		P$2(tAt("feed", "chew", .5), "sine-in-out", {
			...down,
			...open
		}, .02, .012),
		P$2(tAt("feed", "chew"), "sine-in-out", {
			...down,
			...closed
		}, .02, .012),
		P$2(tAt("feed", "chew2", .5), "sine-in-out", {
			...down,
			...open
		}, .02, .012),
		P$2(tAt("feed", "chew2"), "sine-in-out", {
			...down,
			...closed
		}, .02, .012),
		P$2(1, "back-out", REST)
	];
	fauna = (s) => Object.freeze(Object.fromEntries([
		A("idle", "idle", loop4(s.idle[0], s.idle[1], s.idle[2], s.idle[3], s.idle[4], s.idle[5]), true),
		A("alert", "alert", [P$2(1, "back-out", s.alert[0], 0, s.alert[1])]),
		...Object.entries(s.approach).map(([g, poses]) => ({
			...A("approach:" + g, "approach", poses),
			...s.phaseOwnedGaits?.[g] ? { phaseOwnedJoints: s.phaseOwnedGaits[g] } : {}
		})),
		...Object.entries(s.melee).map(([w, poses]) => A("melee:" + w, "melee", poses)),
		A("cast", "cast", s.cast),
		A("hit", "hit", s.hit),
		A("dodge", "dodge", s.dodge),
		A("faint", "faint", s.faint),
		A("victory", "victory", s.victory),
		A("tame", "tame", s.tame),
		A("feed", "feed", s.feed)
	].map((a) => [a.id, a])));
	hind = (knee, ankle, paw = 0) => ({
		...pair("hind", knee, "Knee"),
		...pair("hind", ankle, "Ankle"),
		...pair("hind", paw, "Paw")
	});
	fore = (knee, ankle = 0) => ({
		...pair("fore", knee, "Knee"),
		...pair("fore", ankle, "Ankle")
	});
	ears = (deg) => pair("ear", deg, "Tip");
	HOPPER = fauna({
		idle: [
			{
				spine: -1,
				chest: -2,
				tail0: 3
			},
			{
				neck: -2,
				head: 1,
				...ears(-2)
			},
			{
				tail0: -3,
				spine: 1
			},
			.004,
			-.003,
			-.009
		],
		alert: [{
			neck: -14,
			head: -10,
			spine: -4,
			...ears(-22),
			...hind(-10, 8)
		}, -.006],
		approach: { hop: [
			P$2(.3, "ease-in", {
				...hind(50, -60),
				...fore(-20),
				spine: 10,
				head: 6,
				tail0: -8
			}, 0, .05),
			P$2(.55, "ease-out", {
				...hind(-70, 60, 20),
				...fore(-35, 10),
				spine: -10,
				neck: -8,
				tail0: -14,
				root: -8
			}, .3, -.18),
			P$2(.85, "ease-in", {
				...hind(30, -30),
				...fore(30, -20),
				spine: 8,
				root: 6
			}, .5, -.02),
			P$2(1, "back-out", {
				...hind(20, -24),
				...fore(-8),
				spine: 4
			}, 0, .012)
		] },
		melee: {
			kick: melee({
				...hind(60, -70),
				...fore(-15),
				spine: 10,
				head: 6
			}, {
				...hind(-90, 80),
				spine: -8,
				neck: -6,
				tail0: -10
			}, {
				hindNearKnee: -105,
				hindNearAnkle: 95,
				hindNearPaw: 30,
				hindFarKnee: -80,
				hindFarAnkle: 70,
				root: 8,
				spine: -4
			}, {
				...hind(25, -30),
				spine: 4
			}, [
				-.06,
				.3,
				.34,
				.1
			], [
				.04,
				-.08,
				-.03,
				.01
			]),
			bite: melee({
				...hind(45, -55),
				spine: 12,
				neck: 8,
				head: 10
			}, {
				...hind(-60, 55),
				spine: -6,
				neck: -10,
				head: -8,
				jaw: -12,
				tail0: -10
			}, {
				...hind(-50, 45),
				jaw: -28,
				head: 14,
				neck: 8,
				...fore(-30)
			}, {
				...hind(20, -25),
				head: 2
			})
		},
		cast: cast({
			...hind(35, -45),
			...fore(-45, 16),
			pelvis: -5,
			spine: -18,
			chest: -15,
			neck: -12,
			tail0: 8
		}, {
			...hind(35, -45),
			...fore(-48, 16),
			pelvis: -5,
			spine: -18,
			chest: -15,
			neck: -14,
			head: -5,
			...ears(-8)
		}, {
			...hind(20, -25),
			...fore(-30, 8),
			spine: -10,
			neck: 10,
			head: 25,
			jaw: -15
		}),
		hit: hit({
			head: -20,
			neck: -12,
			spine: 6,
			chest: -6,
			pelvis: -4,
			jaw: -8,
			...ears(12),
			tail0: 10
		}, {
			head: -8,
			neck: -6,
			spine: 3,
			...hind(-15, 18),
			...fore(10),
			tail0: 6
		}),
		dodge: dodge({
			...hind(-40, 40),
			...fore(15),
			spine: -4,
			neck: -6
		}, -.3, -.08),
		faint: faint({
			...hind(45, -55),
			...fore(20, 20),
			spine: 10,
			head: 10,
			neck: 10
		}, {
			...hind(30, -20),
			...fore(-25, 50),
			root: 12,
			spine: 8,
			neck: 22,
			head: 28,
			tail0: 20,
			tail1: 12,
			...ears(16)
		}),
		victory: victory({
			pelvis: -6,
			spine: -22,
			chest: -12,
			neck: -8,
			head: -15,
			jaw: -10,
			...fore(-50, 14),
			...hind(20, -10),
			tail0: -12
		}, {
			pelvis: -6,
			spine: -22,
			chest: -12,
			neck: -12,
			head: -28,
			...fore(-50, 14),
			...hind(20, -10),
			tail0: -16,
			...ears(-15)
		}),
		tame: tame({
			head: -6,
			...hind(15, -18),
			...fore(-10)
		}, {
			neck: 20,
			head: 18,
			spine: 3,
			...ears(-10),
			tail0: 4
		}, { head: 6 }),
		feed: feed({
			neck: 25,
			head: 20,
			...fore(5)
		}, { jaw: -14 }, { jaw: -2 })
	});
	legs2 = (far, near, bend = 0) => ({
		legFarKnee: far,
		legNearKnee: near,
		legFarAnkle: -far * .8 + bend,
		legNearAnkle: -near * .8 + bend,
		legFarFoot: far * .4,
		legNearFoot: near * .4
	});
	wings = (root, tip) => ({
		...pair("wing", root, "Root"),
		...pair("wing", tip, "Tip")
	});
	neck2 = (a, b, head = 0) => ({
		neck0: a,
		neck1: b,
		head
	});
	BIRD = fauna({
		idle: [
			{
				...neck2(-2, 2),
				tailFan: 3
			},
			{
				spine: -2,
				chest: -2,
				head: 2,
				...wings(2, 0)
			},
			{
				tailFan: -3,
				head: -2
			},
			.004,
			-.003,
			-.01
		],
		alert: [{
			...neck2(-15, -12, -8),
			tailFan: -10,
			...wings(6, 0),
			spine: -3
		}, -.01],
		approach: {
			walk: loop4({
				...legs2(-22, 22, 6),
				...neck2(6, -4)
			}, {
				...legs2(0, 0, 14),
				...neck2(-4, 3)
			}, {
				...legs2(22, -22, 6),
				...neck2(6, -4)
			}, 0, -.01, .004),
			flight: [
				P$2(.25, "sine-in-out", {
					...wings(65, 35),
					...legs2(40, 40, -40),
					spine: -6,
					...neck2(4, 4)
				}, 0, -.12),
				P$2(.5, "sine-in-out", {
					...wings(10, -5),
					...legs2(40, 40, -40),
					spine: -4
				}, 0, -.16),
				P$2(.75, "sine-in-out", {
					...wings(-45, -40),
					...legs2(40, 40, -40),
					spine: 2,
					...neck2(-3, -3)
				}, 0, -.12),
				P$2(1, "sine-in-out", {
					...wings(20, 10),
					...legs2(40, 40, -40),
					spine: -4
				}, 0, -.1)
			]
		},
		melee: {
			peck: melee({
				...neck2(-22, -18, -10),
				spine: -4,
				...wings(12, 0)
			}, {
				...neck2(25, 20, 15),
				beak: -10,
				spine: 6,
				...wings(30, 10)
			}, {
				...neck2(35, 30, 25),
				beak: -25,
				spine: 8
			}, { ...neck2(-5, 0, 2) }, [
				-.03,
				.25,
				.3,
				.08
			]),
			claw: melee({
				legNearKnee: -30,
				spine: -6,
				...wings(30, 10),
				...neck2(-8, -6)
			}, {
				legNearKnee: -60,
				legNearAnkle: 70,
				legNearFoot: -30,
				...wings(50, 20),
				spine: -8
			}, {
				legNearKnee: -70,
				legNearAnkle: 82,
				legNearFoot: -42,
				...wings(55, 25),
				root: 6,
				spine: -6
			}, {
				legNearKnee: -15,
				legNearAnkle: 10
			}, [
				-.04,
				.28,
				.32,
				.1
			], [
				.02,
				-.06,
				-.03,
				.01
			])
		},
		cast: cast({
			...wings(80, 50),
			spine: -12,
			...neck2(-10, -8),
			tailFan: -12
		}, {
			...wings(85, 55),
			spine: -12,
			...neck2(-12, -10, -5),
			tailFan: -14
		}, {
			...wings(-20, -15),
			...neck2(15, 12, 20),
			beak: -15,
			spine: -6
		}, -.05),
		hit: hit({
			...neck2(-15, -10, -18),
			spine: 8,
			chest: -5,
			...wings(25, 10),
			tailFan: 15
		}, {
			...neck2(-6, -4, -6),
			legFarKnee: -15,
			legFarAnkle: 20,
			spine: 3,
			tailFan: 6
		}),
		dodge: dodge({
			...legs2(20, 20, -30),
			...wings(40, 15),
			spine: -4
		}, -.25, -.06),
		faint: faint({
			...legs2(40, 40, -50),
			spine: 8,
			...neck2(6, 6, 6)
		}, {
			...legs2(30, 30, -30),
			root: 14,
			spine: 10,
			...neck2(25, 25, 20),
			...wings(-30, -35),
			tailFan: 20
		}, .08, .2),
		victory: victory({
			...wings(85, 55),
			spine: -15,
			...neck2(-10, -8, -12),
			tailFan: -15
		}, {
			...wings(90, 60),
			spine: -15,
			...neck2(-12, -15, -30),
			tailFan: -25
		}, -.04),
		tame: tame({
			...legs2(-12, 12, 6),
			head: -4
		}, {
			...neck2(20, 18, 15),
			...wings(-5, 0),
			tailFan: 5,
			spine: 2
		}, { head: 5 }),
		feed: feed({
			...neck2(30, 30, 20),
			spine: 4
		}, { beak: -12 }, { beak: -2 })
	});
	wave = (k) => mul({
		spine0: -6,
		spine1: -10,
		spine2: -4,
		spine3: 6,
		spine4: 12,
		spine5: 16,
		caudal: 20
	}, k);
	pect = (v) => ({
		pectoralFar: -v,
		pectoralNear: v
	});
	FISH = fauna({
		phaseOwnedGaits: { swim: [
			"spine0",
			"spine1",
			"spine2",
			"spine3",
			"spine4",
			"spine5",
			"caudal"
		] },
		idle: [
			wave(.4),
			{
				...pect(6),
				dorsal: -3,
				head: 1
			},
			wave(-.4),
			.004,
			-.004,
			-.008
		],
		alert: [{
			head: -8,
			dorsal: -12,
			...pect(20),
			spine4: 6,
			spine5: 10,
			caudal: 14
		}, -.01],
		approach: { swim: travellingWave([
			"spine0",
			"spine1",
			"spine2",
			"spine3",
			"spine4",
			"spine5",
			"caudal"
		], [
			2,
			3,
			4,
			5,
			7,
			9,
			11
		]) },
		melee: { bite: melee({
			...wave(-.8),
			head: -6,
			...pect(-10)
		}, {
			...wave(.6),
			head: -4,
			jaw: -15,
			...pect(15)
		}, {
			head: 8,
			jaw: -30,
			spine0: -6,
			spine1: -4,
			...pect(20)
		}, {
			...wave(.2),
			head: 2
		}, [
			-.05,
			.3,
			.36,
			.1
		], [
			.01,
			-.02,
			-.01,
			0
		]) },
		cast: cast({
			head: -18,
			spine0: -8,
			spine1: -6,
			...pect(35),
			dorsal: -10
		}, {
			head: -20,
			spine0: -8,
			spine1: -6,
			...pect(38),
			dorsal: -12
		}, {
			head: 22,
			jaw: -20,
			spine0: 6,
			...pect(10)
		}, -.05),
		hit: hit({
			head: -14,
			spine0: 8,
			spine1: 10,
			spine2: 6,
			caudal: -10,
			...pect(-15)
		}, {
			...wave(-.5),
			root: -6,
			head: -4
		}, .01),
		dodge: dodge({
			...wave(1.2),
			root: -8,
			...pect(25)
		}, -.2, -.06),
		faint: faint({
			root: 15,
			...pect(-10)
		}, {
			root: 28,
			head: 10,
			...wave(.5),
			...pect(-20)
		}, .05, .2),
		victory: victory({
			root: -25,
			head: -10,
			...wave(-.7),
			...pect(40)
		}, {
			root: -20,
			head: -20,
			...wave(-.5),
			caudal: 35,
			...pect(45)
		}),
		tame: tame(wave(.6), {
			head: 15,
			spine0: 4,
			...pect(10)
		}, { head: 5 }),
		feed: feed({
			head: 18,
			spine0: 6,
			...pect(8)
		}, { jaw: -18 }, { jaw: -3 })
	});
	tripodA = [
		"legFrontFar",
		"legMidNear",
		"legHindFar"
	];
	tripodB = [
		"legFrontNear",
		"legMidFar",
		"legHindNear"
	];
	legSet = (names, knee, foot) => Object.fromEntries(names.flatMap((n) => [[n + "Knee", knee], [n + "Foot", foot]]));
	tripod = (k, f) => ({
		...legSet(tripodA, -k, f),
		...legSet(tripodB, k, -f)
	});
	allLegs6 = (knee, foot) => legSet([...tripodA, ...tripodB], knee, foot);
	frontLegs = (knee, foot = 0) => legSet(["legFrontFar", "legFrontNear"], knee, foot);
	ant = (v) => ({
		antennaFar: v,
		antennaNear: v
	});
	wing1 = (v) => ({
		wingFar: v,
		wingNear: -v
	});
	INSECT = fauna({
		idle: [
			{
				abdomen: 3,
				...ant(-4)
			},
			{
				thorax: -1,
				head: -2,
				abdomen: -2
			},
			{
				abdomen: -3,
				...ant(4)
			},
			.003,
			-.002,
			-.006
		],
		alert: [{
			head: -12,
			...ant(-30),
			thorax: -4,
			...frontLegs(-20)
		}, -.01],
		approach: {
			crawl: loop4(tripod(25, 15), {
				...allLegs6(-4, 6),
				thorax: -1
			}, tripod(-25, -15), 0, -.006, .003),
			flight: [
				P$2(.25, "sine-in-out", {
					...wing1(-70),
					...allLegs6(30, -40),
					abdomen: 8
				}, 0, -.11),
				P$2(.5, "sine-in-out", {
					...wing1(0),
					...allLegs6(30, -40),
					abdomen: 4
				}, 0, -.13),
				P$2(.75, "sine-in-out", {
					...wing1(70),
					...allLegs6(30, -40),
					abdomen: 8
				}, 0, -.11),
				P$2(1, "sine-in-out", {
					...wing1(-10),
					...allLegs6(30, -40),
					abdomen: 4
				}, 0, -.1)
			]
		},
		melee: { mandible: melee({
			head: -15,
			thorax: 4,
			...frontLegs(-25),
			abdomen: 6
		}, {
			head: 10,
			mandible: -20,
			...frontLegs(-10),
			thorax: -3
		}, {
			head: 18,
			mandible: -38,
			...frontLegs(30, -10),
			thorax: -2
		}, {
			head: 2,
			...frontLegs(5)
		}, [
			-.04,
			.28,
			.34,
			.1
		], [
			.02,
			-.03,
			-.01,
			.01
		]) },
		cast: cast({
			thorax: -10,
			head: -15,
			abdomen: 20,
			...wing1(-60),
			...frontLegs(-50),
			...legSet(["legMidFar", "legMidNear"], -25, 10)
		}, {
			thorax: -10,
			head: -18,
			abdomen: 22,
			...wing1(-65),
			...frontLegs(-55),
			...ant(-20)
		}, {
			head: 20,
			mandible: -15,
			abdomen: -10,
			...wing1(30),
			...frontLegs(10)
		}, -.04),
		hit: hit({
			head: -18,
			thorax: 6,
			abdomen: -12,
			...ant(25),
			...frontLegs(-10)
		}, {
			...legSet(["legHindFar", "legHindNear"], -20, 25),
			head: -6,
			abdomen: -4
		}, .012),
		dodge: dodge({
			...allLegs6(30, -35),
			head: -6,
			abdomen: -8
		}, -.22, -.03),
		faint: faint({
			...allLegs6(40, -50),
			thorax: 3
		}, {
			root: 12,
			thorax: 5,
			head: 15,
			abdomen: 20,
			...allLegs6(55, -65),
			...ant(30)
		}, .06, .16),
		victory: victory({
			thorax: -12,
			head: -20,
			abdomen: 25,
			...frontLegs(-55),
			...legSet(["legMidFar", "legMidNear"], -30, 10),
			...wing1(-75)
		}, {
			thorax: -12,
			head: -30,
			abdomen: 25,
			...frontLegs(-55),
			...ant(-40),
			...wing1(-80)
		}, -.05),
		tame: tame(tripod(15, 10), {
			head: 20,
			thorax: 4,
			...ant(15),
			...frontLegs(20)
		}, { head: 5 }),
		feed: feed({
			head: 25,
			thorax: 6,
			...frontLegs(15)
		}, { mandible: -18 }, { mandible: -3 })
	});
	swave = (k) => mul({
		seg0: 8,
		seg1: 14,
		seg2: 8,
		seg3: -8,
		seg4: -14,
		seg5: -8,
		seg6: 8,
		seg7: 14,
		seg8: 8,
		seg9: -8
	}, k);
	SERPENT = fauna({
		phaseOwnedGaits: { slither: Array.from({ length: 10 }, (_, i) => "seg" + i) },
		idle: [
			{
				head: -2,
				seg0: 2,
				seg1: 3
			},
			{
				head: 2,
				seg8: 3,
				seg9: 4
			},
			{
				head: -1,
				seg0: -2,
				seg1: -3
			},
			.003,
			-.002,
			-.004
		],
		alert: [{
			head: -25,
			seg0: -15,
			seg1: -10,
			seg2: -4
		}, -.03],
		approach: { slither: travellingWave(Array.from({ length: 10 }, (_, i) => "seg" + i), Array(10).fill(6)) },
		melee: {
			strike: melee({
				head: -20,
				seg0: -18,
				seg1: -12,
				seg2: -6,
				seg3: 6,
				seg4: 8
			}, {
				head: 5,
				seg0: -5,
				seg1: 5,
				seg2: 12,
				seg3: 4,
				jaw: -20
			}, {
				head: 15,
				jaw: -42,
				seg0: 4,
				seg1: 2
			}, {
				head: -5,
				seg0: -10,
				seg1: -8
			}, [
				-.08,
				.4,
				.48,
				.12
			], [
				.01,
				-.03,
				-.01,
				0
			]),
			constrict: melee({
				...swave(1),
				head: -10
			}, {
				seg0: 20,
				seg1: 30,
				seg2: 35,
				seg3: 30,
				seg4: 20,
				seg5: 10,
				head: 10
			}, {
				seg0: 30,
				seg1: 42,
				seg2: 44,
				seg3: 40,
				seg4: 32,
				seg5: 25,
				seg6: 15,
				head: 20,
				jaw: -10
			}, {
				seg0: 15,
				seg1: 20,
				seg2: 22,
				seg3: 20,
				seg4: 15,
				head: 8
			}, [
				-.05,
				.3,
				.34,
				.14
			], [
				.01,
				-.02,
				0,
				0
			])
		},
		cast: cast({
			head: -30,
			seg0: -30,
			seg1: -25,
			seg2: -15,
			seg3: -5
		}, {
			head: -32,
			seg0: -30,
			seg1: -25,
			seg2: -15,
			seg3: -5,
			jaw: -8
		}, {
			head: 25,
			jaw: -30,
			seg0: 5,
			seg1: 5
		}),
		hit: hit({
			head: -28,
			seg0: -12,
			seg1: 6,
			seg2: 10,
			seg3: 6
		}, {
			head: -10,
			seg0: -5,
			...swave(-.4)
		}, .012),
		dodge: dodge({
			head: -15,
			seg0: -20,
			seg1: -15,
			seg2: -5,
			seg3: 10,
			seg4: 12
		}, -.2, -.02),
		faint: faint({
			head: 10,
			seg0: 8
		}, {
			root: 8,
			head: 30,
			seg0: 12,
			...swave(.3)
		}, .04, .12),
		victory: victory({
			head: -35,
			seg0: -35,
			seg1: -30,
			seg2: -18,
			seg3: -6
		}, {
			head: -45,
			jaw: -20,
			seg0: -30,
			seg1: -25,
			seg2: -18,
			seg3: -6
		}),
		tame: tame(swave(.5), {
			head: 20,
			seg0: 8
		}, { head: 6 }),
		feed: feed({
			head: 25,
			seg0: 8
		}, { jaw: -30 }, { jaw: -5 })
	});
	tetA = [
		"leg1Far",
		"leg2Near",
		"leg3Far",
		"leg4Near"
	];
	tetB = [
		"leg1Near",
		"leg2Far",
		"leg3Near",
		"leg4Far"
	];
	tetrapod = (k, f) => ({
		...legSet(tetA, -k, f),
		...legSet(tetB, k, -f)
	});
	allLegs8 = (knee, foot) => legSet([...tetA, ...tetB], knee, foot);
	leg1 = (knee, foot = 0) => legSet(["leg1Far", "leg1Near"], knee, foot);
	leg2 = (knee, foot = 0) => legSet(["leg2Far", "leg2Near"], knee, foot);
	chel = (v) => pair("chelicera", v);
	ARACHNID = fauna({
		idle: [
			{
				abdomen: 3,
				...chel(-3)
			},
			{
				cephalothorax: -1,
				abdomen: -2
			},
			{
				abdomen: -3,
				...chel(3)
			},
			.003,
			-.002,
			-.006
		],
		alert: [{
			cephalothorax: -5,
			abdomen: 10,
			sting: -20,
			...chel(-20),
			...leg1(-30)
		}, -.01],
		approach: { scuttle: loop4(tetrapod(25, 15), {
			...allLegs8(-4, 6),
			cephalothorax: -1
		}, tetrapod(-25, -15), 0, -.006, .003) },
		melee: {
			sting: melee({
				abdomen: 20,
				sting: 25,
				cephalothorax: 3,
				...leg1(-15)
			}, {
				abdomen: 55,
				sting: 50,
				cephalothorax: -6,
				...leg1(-25)
			}, {
				abdomen: 62,
				sting: 68,
				cephalothorax: -10,
				...leg1(-35, -10)
			}, {
				abdomen: 20,
				sting: 10
			}, [
				-.04,
				.18,
				.26,
				.08
			], [
				.02,
				-.02,
				-.01,
				.01
			]),
			bite: melee({
				cephalothorax: 6,
				...chel(-30),
				...leg1(-25)
			}, {
				cephalothorax: -4,
				...chel(-10),
				...leg1(-10)
			}, {
				cephalothorax: 8,
				...chel(40),
				...leg1(20, -10)
			}, {
				cephalothorax: 2,
				...chel(5)
			}, [
				-.04,
				.26,
				.32,
				.1
			], [
				.02,
				-.03,
				-.01,
				.01
			])
		},
		cast: cast({
			cephalothorax: -12,
			...leg1(-60, 10),
			...leg2(-35, 10),
			abdomen: 25,
			sting: 30
		}, {
			cephalothorax: -12,
			...leg1(-62, 10),
			...leg2(-38, 10),
			abdomen: 28,
			sting: 34,
			...chel(-15)
		}, {
			cephalothorax: 10,
			...chel(30),
			...leg1(10),
			abdomen: -10,
			sting: -10
		}, -.04),
		hit: hit({
			cephalothorax: -10,
			abdomen: -15,
			sting: -25,
			...chel(20),
			...leg1(-10)
		}, {
			...legSet(["leg4Far", "leg4Near"], -20, 25),
			cephalothorax: -4,
			abdomen: -5
		}, .012),
		dodge: dodge({
			...allLegs8(30, -35),
			cephalothorax: -5,
			abdomen: -8
		}, -.22, -.03),
		faint: faint({
			...allLegs8(40, -50),
			cephalothorax: 3
		}, {
			root: 10,
			cephalothorax: 5,
			...allLegs8(60, -70),
			abdomen: 15,
			sting: 20,
			...chel(15)
		}, .05, .14),
		victory: victory({
			cephalothorax: -14,
			...leg1(-60, 10),
			...leg2(-40, 10),
			abdomen: 35,
			sting: 45,
			...chel(-30)
		}, {
			cephalothorax: -12,
			...leg1(-60, 10),
			...leg2(-40, 10),
			abdomen: 35,
			sting: 60,
			...chel(30)
		}, -.05),
		tame: tame(tetrapod(15, 10), {
			cephalothorax: 12,
			...leg1(15),
			...chel(10),
			abdomen: -5
		}, { cephalothorax: 4 }),
		feed: feed({
			cephalothorax: 15,
			...leg1(20)
		}, {
			cheliceraFar: -20,
			cheliceraNear: 20
		}, {
			cheliceraFar: -4,
			cheliceraNear: 4
		})
	});
	RADIAL = radialActions();
	myA = [
		"legAFar",
		"legBNear",
		"legCFar",
		"legDNear"
	];
	myB = [
		"legANear",
		"legBFar",
		"legCNear",
		"legDFar"
	];
	mtripod = (k, f) => ({
		...legSet(myA, -k, f),
		...legSet(myB, k, -f)
	});
	allLegsM = (knee, foot) => legSet([...myA, ...myB], knee, foot);
	legA = (knee, foot = 0) => legSet(["legAFar", "legANear"], knee, foot);
	mwave = (k) => mul({
		seg0: 6,
		seg1: 10,
		seg2: 6,
		seg3: -6,
		seg4: -10,
		seg5: -6,
		seg6: 6,
		seg7: 10
	}, k);
	MYRIAPOD = fauna({
		idle: [
			{
				...mwave(.3),
				...ant(-3)
			},
			{
				head: -2,
				seg7: 3
			},
			{
				...mwave(-.3),
				...ant(3)
			},
			.003,
			-.002,
			-.005
		],
		alert: [{
			head: -15,
			...ant(-30),
			seg0: -8,
			seg1: -4,
			...legA(-20)
		}, -.008],
		approach: { crawl: loop4({
			...mtripod(22, 12),
			...mwave(.6)
		}, allLegsM(-3, 5), {
			...mtripod(-22, -12),
			...mwave(-.6)
		}, 0, -.005, .003) },
		melee: {
			mandible: melee({
				head: -14,
				seg0: -10,
				seg1: -6,
				...legA(-25)
			}, {
				head: 12,
				mandible: -20,
				seg0: 6,
				...legA(-10)
			}, {
				head: 20,
				mandible: -38,
				seg0: 8,
				seg1: 4,
				...legA(28, -10)
			}, {
				head: 2,
				...legA(5)
			}, [
				-.04,
				.28,
				.34,
				.1
			], [
				.02,
				-.03,
				-.01,
				.01
			]),
			sting: melee(mwave(.5), {
				seg5: 20,
				seg6: 35,
				seg7: 45
			}, {
				seg4: 15,
				seg5: 30,
				seg6: 42,
				seg7: 55,
				head: -8
			}, {
				seg6: 10,
				seg7: 15
			}, [
				-.03,
				.2,
				.26,
				.08
			], [
				.01,
				-.02,
				-.01,
				0
			])
		},
		cast: cast({
			head: -18,
			seg0: -20,
			seg1: -12,
			...legA(-45, 10),
			...ant(-15)
		}, {
			head: -20,
			seg0: -22,
			seg1: -12,
			...legA(-48, 10),
			...ant(-25)
		}, {
			head: 18,
			mandible: -15,
			seg0: 6,
			...legA(10)
		}, -.04),
		hit: hit({
			head: -20,
			seg0: 8,
			seg1: 10,
			seg2: 6,
			...ant(25),
			...legA(-10)
		}, {
			head: -6,
			...mwave(-.4)
		}, .01),
		dodge: dodge({
			...allLegsM(28, -32),
			head: -5,
			...mwave(.8)
		}, -.22, -.03),
		faint: faint({
			...allLegsM(35, -45),
			head: 6
		}, {
			root: 10,
			head: 20,
			...allLegsM(55, -65),
			...mwave(.3),
			...ant(30)
		}, .05, .14),
		victory: victory({
			head: -25,
			seg0: -25,
			seg1: -15,
			seg2: -6,
			...legA(-55, 10),
			...ant(-35)
		}, {
			head: -32,
			mandible: -15,
			seg0: -25,
			seg1: -15,
			seg2: -6,
			...legA(-55, 10),
			...ant(-45)
		}, -.05),
		tame: tame(mtripod(12, 8), {
			head: 18,
			seg0: 6,
			...ant(12),
			...legA(15)
		}, { head: 5 }),
		feed: feed({
			head: 22,
			seg0: 6,
			...legA(12)
		}, { mandible: -20 }, { mandible: -3 })
	});
	CEPHALOPOD = cephalopodActions();
	bw = (root, elbow, wrist, tip) => ({
		...pair("wing", root, "Root"),
		...pair("wing", elbow, "Elbow"),
		...pair("wing", wrist, "Wrist"),
		...pair("wing", tip, "Tip")
	});
	bl = (knee, foot) => ({
		...pair("leg", knee, "Knee"),
		...pair("leg", foot, "Foot")
	});
	bears = (v) => pair("ear", v, "Tip");
	FLYER = fauna({
		idle: [
			{
				spine: -1,
				chest: -2,
				...bw(2, -2, 0, 0)
			},
			{
				neck: -2,
				head: 1,
				...bears(-3)
			},
			{
				...bw(-2, 2, 0, 0),
				tail0: 2
			},
			.003,
			-.004,
			-.01
		],
		alert: [{
			neck: -14,
			head: -10,
			...bears(-25),
			...bw(20, -10, 0, 5),
			spine: -3
		}, -.01],
		approach: {
			flight: [
				P$2(.25, "sine-in-out", {
					...bw(70, -30, -20, -10),
					...bl(30, -30),
					spine: -6,
					neck: 4
				}, 0, -.12),
				P$2(.5, "sine-in-out", {
					...bw(10, 10, 15, 20),
					...bl(30, -30),
					spine: -4
				}, 0, -.16),
				P$2(.75, "sine-in-out", {
					...bw(-50, 40, 35, 30),
					...bl(30, -30),
					spine: 2,
					neck: -3
				}, 0, -.12),
				P$2(1, "sine-in-out", {
					...bw(20, 0, 0, 5),
					...bl(30, -30),
					spine: -4
				}, 0, -.1)
			],
			crawl: loop4({
				...bw(-30, 30, 20, 10),
				...bl(-20, 15),
				spine: 4
			}, {
				...bw(-25, 25, 15, 5),
				...bl(0, 10)
			}, {
				...bw(-35, 35, 25, 15),
				...bl(20, -15),
				spine: 4
			}, 0, -.006, .004)
		},
		melee: {
			bite: melee({
				neck: -20,
				head: -16,
				spine: -4,
				...bw(30, -15, 0, 0),
				...bears(-15)
			}, {
				neck: 22,
				head: 14,
				jaw: -15,
				spine: 6,
				...bw(45, -10, 0, 5)
			}, {
				neck: 30,
				head: 20,
				jaw: -35,
				spine: 8,
				...bw(50, -5, 0, 10)
			}, {
				neck: -4,
				head: 2
			}, [
				-.03,
				.26,
				.3,
				.08
			]),
			claw: melee({
				...bl(-30, 20),
				spine: -6,
				...bw(35, -15, 0, 0)
			}, {
				legNearKnee: -60,
				legNearFoot: 35,
				...bw(55, -10, 0, 5),
				spine: -8
			}, {
				legNearKnee: -68,
				legNearFoot: 48,
				...bw(60, -5, 0, 10),
				root: 6
			}, {
				legNearKnee: -15,
				legNearFoot: 10
			}, [
				-.04,
				.28,
				.32,
				.1
			], [
				.02,
				-.06,
				-.03,
				.01
			])
		},
		cast: cast({
			...bw(85, -40, -30, -20),
			spine: -12,
			neck: -10,
			tail0: -10
		}, {
			...bw(90, -45, -35, -25),
			spine: -12,
			neck: -12,
			head: -5,
			...bears(-10)
		}, {
			...bw(-20, 20, 15, 10),
			neck: 15,
			head: 20,
			jaw: -15,
			spine: -6
		}, -.05),
		hit: hit({
			neck: -15,
			head: -18,
			spine: 8,
			chest: -5,
			...bw(25, -10, 0, 0),
			...bears(12),
			tail0: 10
		}, {
			neck: -6,
			head: -6,
			legFarKnee: -15,
			legFarFoot: 20,
			spine: 3
		}),
		dodge: dodge({
			...bl(20, -30),
			...bw(40, -15, 0, 5),
			spine: -4
		}, -.25, -.06),
		faint: faint({
			...bl(40, -50),
			spine: 8,
			neck: 6,
			head: 6
		}, {
			...bl(30, -30),
			root: 14,
			spine: 10,
			neck: 22,
			head: 20,
			...bw(-30, -30, -20, -10),
			tail0: 20
		}, .08, .2),
		victory: victory({
			...bw(85, -45, -35, -25),
			spine: -15,
			neck: -10,
			head: -12,
			tail0: -15
		}, {
			...bw(90, -50, -40, -30),
			spine: -15,
			neck: -12,
			head: -30,
			jaw: -10,
			...bears(-20)
		}, -.04),
		tame: tame({
			...bl(-12, 10),
			head: -4
		}, {
			neck: 20,
			head: 18,
			...bw(-5, 0, 0, 0),
			spine: 2,
			...bears(-8)
		}, { head: 5 }),
		feed: feed({
			neck: 30,
			head: 20,
			spine: 4
		}, { jaw: -14 }, { jaw: -2 })
	});
	pa = (sh, el, hand) => ({
		...pair("arm", sh, "Shoulder"),
		...pair("arm", el, "Elbow"),
		...pair("arm", hand, "Hand")
	});
	pl = (hip, knee, foot) => ({
		...pair("leg", hip, "Hip"),
		...pair("leg", knee, "Knee"),
		...pair("leg", foot, "Foot")
	});
	alt = (base, v, suffix) => ({
		[base + "Far" + suffix]: -v,
		[base + "Near" + suffix]: v
	});
	tail3 = (a, b, c) => ({
		tail0: a,
		tail1: b,
		tail2: c
	});
	climbA = {
		armFarShoulder: -70,
		armFarElbow: 45,
		armNearShoulder: -40,
		armNearElbow: 30,
		legFarHip: 20,
		legFarKnee: -45,
		legNearHip: 40,
		legNearKnee: -60,
		spine: -6
	};
	climbB = {
		armFarShoulder: -40,
		armFarElbow: 30,
		armNearShoulder: -70,
		armNearElbow: 45,
		legFarHip: 40,
		legFarKnee: -60,
		legNearHip: 20,
		legNearKnee: -45,
		spine: -6
	};
	PRIMATE = fauna({
		idle: [
			{
				spine: -2,
				chest: -1,
				...tail3(3, 4, 5)
			},
			{
				neck: -2,
				head: 2,
				...pa(2, -3, 0)
			},
			{
				spine: 1,
				...tail3(-3, -4, -5)
			},
			.003,
			-.003,
			-.008
		],
		alert: [{
			neck: -12,
			head: -10,
			spine: -6,
			chest: -4,
			...pa(-20, -15, 0),
			...tail3(-15, -10, -5)
		}, -.01],
		approach: {
			walk: loop4({
				...pa(0, 10, 0),
				...pl(0, -15, 5),
				...alt("arm", 25, "Shoulder"),
				...alt("leg", 25, "Hip"),
				spine: 3
			}, {
				...pa(0, 15, 0),
				...pl(0, -10, 10)
			}, {
				...pa(0, 10, 0),
				...pl(0, -15, 5),
				...alt("arm", -25, "Shoulder"),
				...alt("leg", -25, "Hip"),
				spine: 3
			}, 0, -.008, .004),
			climb: loop4(climbA, {
				...pa(-50, 35, 0),
				...pl(30, -50, 10),
				spine: -4
			}, climbB, 0, -.05, -.03)
		},
		melee: {
			punch: melee({
				armNearShoulder: 35,
				armNearElbow: -80,
				spine: -6,
				chest: -4,
				...pl(10, -15, 0)
			}, {
				armNearShoulder: -60,
				armNearElbow: -20,
				armNearHand: -10,
				spine: 8,
				chest: 6
			}, {
				armNearShoulder: -75,
				armNearElbow: -5,
				armNearHand: -20,
				spine: 10,
				chest: 8,
				root: 4,
				head: 4
			}, {
				armNearShoulder: -20,
				armNearElbow: -25,
				spine: 3
			}, [
				-.05,
				.3,
				.36,
				.1
			], [
				.02,
				-.03,
				-.01,
				.01
			]),
			bite: melee({
				neck: -18,
				head: -14,
				spine: -6,
				...pa(-15, -20, 0)
			}, {
				neck: 18,
				head: 12,
				jaw: -14,
				spine: 8,
				...pa(-30, -15, 0)
			}, {
				neck: 26,
				head: 18,
				jaw: -32,
				spine: 10,
				...pa(-35, -10, 0)
			}, {
				neck: -3,
				head: 2
			}, [
				-.04,
				.26,
				.32,
				.1
			])
		},
		cast: cast({
			...pa(-95, -30, -20),
			spine: -15,
			chest: -10,
			neck: -10,
			head: -8,
			...tail3(-10, -8, -5)
		}, {
			...pa(-100, -35, -25),
			spine: -15,
			chest: -10,
			neck: -12,
			head: -10
		}, {
			...pa(-40, -10, 15),
			neck: 12,
			head: 15,
			jaw: -10,
			spine: 4
		}, -.06),
		hit: hit({
			neck: -16,
			head: -18,
			spine: 8,
			chest: -6,
			...pa(20, -25, 0),
			...tail3(10, 8, 5)
		}, {
			neck: -6,
			head: -6,
			spine: 3,
			...pl(-10, -15, 10)
		}),
		dodge: dodge({
			...pl(25, -40, 10),
			...pa(-30, -20, 0),
			spine: -6,
			neck: -6
		}, -.25, -.05),
		faint: faint({
			...pl(30, -45, 10),
			...pa(20, -30, 0),
			spine: 8,
			head: 6
		}, {
			...pl(40, -30, 20),
			...pa(35, -40, 10),
			root: 14,
			spine: 12,
			neck: 22,
			head: 26,
			...tail3(15, 12, 8)
		}, .08, .2),
		victory: victory({
			...pa(-100, -40, -20),
			spine: -18,
			chest: -10,
			neck: -8,
			head: -12,
			...tail3(-12, -10, -6)
		}, {
			...pa(-100, -45, -25),
			spine: -18,
			chest: -10,
			neck: -12,
			head: -28,
			jaw: -12,
			...tail3(-16, -12, -8)
		}, -.06),
		tame: tame({
			...pl(-10, -12, 5),
			head: -4,
			...pa(-8, -10, 0)
		}, {
			neck: 20,
			head: 18,
			spine: 3,
			...pa(-15, -30, 10),
			...tail3(4, 3, 2)
		}, { head: 5 }),
		feed: feed({
			neck: 24,
			head: 18,
			...pa(-40, -70, 15)
		}, { jaw: -14 }, { jaw: -2 })
	});
	wsway = (k, count = 3) => ({
		trunk: .3 * k,
		...Object.fromEntries(Array.from({ length: count }, (_, n) => n).flatMap((n) => {
			const s = n % 2 ? -1 : 1;
			return [["branch" + n + "Base", k * s], ["branch" + n + "Tip", 1.5 * k * s]];
		}))
	});
	hsway = (k) => Object.fromEntries([
		0,
		1,
		2,
		3
	].flatMap((n) => {
		const s = n % 2 === 0 ? 1 : -1;
		return [
			["stem" + n + "Seg0", .6 * k * s],
			["stem" + n + "Seg1", k * s],
			["stem" + n + "Seg2", 1.4 * k * s]
		];
	}));
	plant = (sway, _leaves) => Object.freeze(Object.fromEntries([
		A("sway", "sway", [
			P$2(.25, "sine-in-out", sway(6)),
			P$2(.5, "sine-in-out", sway(1)),
			P$2(.75, "sine-in-out", sway(-5)),
			P$2(1, "sine-in-out", REST)
		], true),
		A("disturb", "disturb", [
			P$2(tAt("disturb", "recoil"), "ease-out", sway(-14)),
			P$2(tAt("disturb", "settle", .5), "sine-in-out", sway(6)),
			P$2(1, "back-out", REST)
		]),
		A("harvest", "harvest", [
			P$2(tAt("harvest", "shake"), "ease-in", sway(12)),
			P$2(tAt("harvest", "detach"), "ease-out", sway(-10)),
			P$2(tAt("harvest", "settle", .5), "sine-in-out", sway(4)),
			P$2(1, "back-out", REST)
		]),
		A("grow", "grow", [
			P$2(.02, "ease-out", sway(-8)),
			P$2(tAt("grow", "rise"), "ease-out", sway(-2)),
			P$2(tAt("grow", "overshoot"), "back-out", sway(3)),
			P$2(1, "sine-in-out", REST)
		])
	].map((a) => [a.id, a])));
	WOODY = plant(wsway, {
		leaf0: 30,
		leaf1: -30,
		leaf2: 30
	});
	HERB = plant(hsway, {
		frond0: 35,
		frond1: -35,
		frond2: 35,
		frond3: -35
	});
	BASE_ACTIONS_BY_TEMPLATE = Object.freeze({
		quadruped: QUADRUPED_ACTIONS,
		hopper: HOPPER,
		"biped-bird": BIRD,
		fish: FISH,
		insect: INSECT,
		serpent: SERPENT,
		arachnid: ARACHNID,
		radial: RADIAL,
		"plant-woody": WOODY,
		"plant-herb": HERB,
		myriapod: MYRIAPOD,
		cephalopod: CEPHALOPOD,
		"flyer-membrane": FLYER,
		primate: PRIMATE
	});
	ACTIONS_BY_TEMPLATE = Object.freeze(Object.fromEntries(Object.entries(BASE_ACTIONS_BY_TEMPLATE).map(([id, actions]) => [id, Object.freeze({
		...actions,
		...ADDITIONAL_ACTIONS[id]
	})])));
	MELEE_ALIAS = Object.freeze({
		brachyuran: { claw: "pinch" },
		hopper: { claw: "kick" },
		insect: { bite: "mandible" },
		serpent: { bite: "strike" },
		radial: {
			sting: "sting-arms",
			tail: "sting-arms",
			bite: "sting-arms"
		},
		fish: {},
		"biped-bird": {},
		arachnid: {},
		quadruped: {},
		myriapod: { bite: "mandible" },
		cephalopod: {
			constrict: "lash",
			tail: "lash"
		},
		"flyer-membrane": {},
		primate: { claw: "punch" }
	});
	templateGaits = (templateId) => Object.keys(actionsFor(templateId) ?? {}).filter((k) => k.startsWith("approach:")).map((k) => k.slice(9));
	templateMelees = (templateId) => Object.keys(actionsFor(templateId) ?? {}).filter((k) => k.startsWith("melee:")).map((k) => k.slice(6));
}));
//#endregion
//#region port/v2/apps/game/src/motion/secondary.ts
/** FA_SKIN name → kit material (the kit shortens "slick and wet" to slick). */
function materialFromSkinName(name) {
	const n = name.toLowerCase();
	if (n === "bark" || n === "woody bark") return "bark";
	if (n === "foliage" || n === "leaves" || n === "fronds") return "foliage";
	if (/fur/.test(n)) return "furred";
	if (/scale/.test(n)) return "scaled";
	if (/feather/.test(n)) return "feathered";
	if (/chitin/.test(n)) return "chitinous";
	if (/slick|wet|slime|^smooth skin$/.test(n)) return "slick";
	if (/plate/.test(n)) return "plated";
	if (/wart/.test(n)) return "warty";
	if (/translucent/.test(n)) return "translucent";
	if (/crystal/.test(n)) return "crystalline";
	return null;
}
/** Per-joint lag/overshoot/squash parameters for one secondary chain. */
function secondaryParams(part, realm, luminous) {
	return part.joints.map((joint, order) => {
		const rule = MATERIAL_RULES[part.jointMaterials?.[joint] ?? part.material], medium = MEDIUM_RULES[realm], chain = part.kind ? CHAIN_RULES[part.kind] ?? {} : null;
		const lagS = chain && !rule.rigid ? chain.lagS ?? rule.lagS : rule.lagS, overshoot = chain && !rule.rigid ? chain.overshoot ?? rule.overshoot : rule.overshoot;
		return {
			partId: part.id,
			joint,
			driver: part.driver,
			order,
			lagMs: lagS * 1e3 * (order + 1),
			overshoot: overshoot * (1 - order * .15),
			damping: Math.min(1, rule.damping * medium.damping),
			squash: rule.squash,
			stretch: rule.stretch,
			rigid: rule.rigid,
			quiverMs: Math.max(rule.quiverS ?? 0, chain?.quiverS ?? 0) * 1e3,
			wobbleMs: Math.max(rule.wobbleS ?? 0, chain?.wobbleS ?? 0) * 1e3,
			pulseMs: luminous ? LUMINOUS_PULSE.idleMs : 0,
			...chain ? {
				kind: part.kind,
				flutterMs: rule.flutter && chain.flutterS ? chain.flutterS * 1e3 : 0
			} : {}
		};
	});
}
var MATERIAL_RULES, LUMINOUS_PULSE, MEDIUM_RULES, CHAIN_RULES;
var init_secondary = __esmMin((() => {
	MATERIAL_RULES = Object.freeze({
		bark: {
			lagS: .05,
			overshoot: .05,
			damping: .8,
			squash: 0,
			stretch: 0,
			rigid: false
		},
		foliage: {
			lagS: .05,
			overshoot: .15,
			damping: .6,
			squash: 0,
			stretch: 0,
			rigid: false
		},
		furred: {
			lagS: .08,
			overshoot: .2,
			damping: .55,
			squash: 0,
			stretch: 0,
			rigid: false
		},
		feathered: {
			lagS: .06,
			overshoot: .25,
			damping: .5,
			squash: 0,
			stretch: 0,
			rigid: false,
			flutter: true,
			crestLift: true
		},
		scaled: {
			lagS: .05,
			overshoot: .05,
			damping: .8,
			squash: 0,
			stretch: 0,
			rigid: false
		},
		slick: {
			lagS: .06,
			overshoot: .15,
			damping: .6,
			squash: .06,
			stretch: .04,
			rigid: false
		},
		warty: {
			lagS: .06,
			overshoot: .15,
			damping: .6,
			squash: .06,
			stretch: .04,
			rigid: false
		},
		chitinous: {
			lagS: 0,
			overshoot: 0,
			damping: 1,
			squash: 0,
			stretch: 0,
			rigid: true,
			quiverS: .04
		},
		plated: {
			lagS: 0,
			overshoot: 0,
			damping: 1,
			squash: 0,
			stretch: 0,
			rigid: true,
			heavySettle: true
		},
		crystalline: {
			lagS: 0,
			overshoot: 0,
			damping: 1,
			squash: 0,
			stretch: 0,
			rigid: true,
			glintOnStrike: true
		},
		translucent: {
			lagS: .12,
			overshoot: .35,
			damping: .35,
			squash: .03,
			stretch: .02,
			rigid: false,
			wobbleS: .12,
			wobbleCycles: 2
		}
	});
	LUMINOUS_PULSE = Object.freeze({
		idleMs: 1800,
		strikeMs: 120
	});
	MEDIUM_RULES = Object.freeze({
		land: {
			damping: 1,
			bobMs: 0,
			drift: false
		},
		amphibious: {
			damping: .9,
			bobMs: 0,
			drift: false
		},
		aquatic: {
			damping: .75,
			bobMs: 0,
			drift: true
		},
		aerial: {
			damping: 1,
			bobMs: 1400,
			drift: false
		},
		"gas-giant": {
			damping: .85,
			bobMs: 0,
			drift: true
		}
	});
	CHAIN_RULES = Object.freeze({
		wing: { flutterS: .06 },
		tailfan: { flutterS: .06 },
		fin: {
			lagS: .05,
			overshoot: .1
		},
		antenna: { quiverS: .04 },
		frond: {
			lagS: .05,
			overshoot: .15
		},
		bell: {
			wobbleS: .12,
			overshoot: .3
		},
		arm: { lagS: .06 },
		membrane: {
			lagS: .04,
			overshoot: .05
		},
		tentacle: {
			lagS: .07,
			overshoot: .2
		},
		tail: {},
		ear: {}
	});
}));
//#endregion
//#region port/v2/apps/game/src/motion/body-card.ts
function compileBodyCard(record, genome) {
	if (!record || typeof record !== "object" || !record.identity || !record.template && !record.family) throw new MotionCompileError("missing-record", "record lacks template/identity");
	const familyTemplate = record.family ? templateIdForFamily(String(record.family)) : null;
	if (record.family && !familyTemplate) throw new MotionCompileError("unsupported-template", `family "${record.family}" routes to no motion template`, {
		kind: "whole-portrait",
		templateId: String(record.family),
		reason: `family "${record.family}" has no motion library`
	});
	if (familyTemplate && record.template && String(record.template.id) !== familyTemplate) throw new MotionCompileError("family-mismatch", `family "${record.family}" routes to ${familyTemplate} but the record names template "${record.template.id}"`);
	const templateId = record.template ? String(record.template.id) : familyTemplate;
	const baseTemplate = resolveTemplate(templateId, record.template ? Number(record.template.version) : 1);
	if (isMotionFallback(baseTemplate)) throw new MotionCompileError("unsupported-template", baseTemplate.reason, baseTemplate);
	const resolved = resolveFixedAttachments(resolveAnatomyInventory(baseTemplate, record.anatomy), record);
	if (isMotionFallback(resolved)) throw new MotionCompileError("unsupported-template", resolved.reason, resolved);
	if (record.kind !== resolved.id) throw new MotionCompileError("unsupported-template", `record kind "${record.kind}" is not ${resolved.id}`, {
		kind: "whole-portrait",
		templateId,
		reason: `kind ${record.kind} does not match template ${resolved.id}`
	});
	const lmIn = record.landmarks;
	if (!lmIn || typeof lmIn !== "object") throw new MotionCompileError("missing-landmarks", "record has no landmarks");
	const landmarks = {};
	for (const j of resolved.joints) {
		const p = lmIn[j];
		if (!Array.isArray(p) || p.length !== 2 || !p.every((v) => Number.isFinite(v) && v >= 0 && v <= 1)) throw new MotionCompileError("missing-landmarks", `landmark "${j}" missing or not a normalized [x,y] (${resolved.id} inventory: ${resolved.joints.length} joints)`);
		landmarks[j] = [p[0], p[1]];
	}
	const foreign = Object.keys(lmIn).filter((j) => !resolved.joints.includes(j));
	if (foreign.length) throw new MotionCompileError("joint-inventory", `landmarks [${foreign.join(", ")}] are not in the ${resolved.id} joint inventory`);
	const bones = {};
	const specialized = specializedTemplate(resolved.id);
	const specialtyGroup = (joint) => {
		const role = specialized && Object.entries(specialized.roles).find(([, names]) => names.includes(joint))?.[0];
		return role === "legs" ? "legs" : role === "sensors" ? "antennae" : role === "head" ? "head" : role === "claws" || role === "reach" ? "arms" : "body";
	};
	const parts = resolved.graph.map(([child, parent]) => {
		const pivot = resolved.fixedPivots?.[child] ?? landmarks[parent], tip = landmarks[child], boneLength = Math.hypot(tip[0] - pivot[0], tip[1] - pivot[1]);
		bones[child] = boneLength;
		return {
			joint: child,
			parent,
			group: specialized ? specialtyGroup(child) : groupOf(child),
			pivot,
			tip,
			boneLength
		};
	});
	const clamped = [];
	for (const b of resolved.proportions) {
		const v = b.measure(landmarks, bones);
		if (!Number.isFinite(v)) throw new MotionCompileError("out-of-bounds", `${b.id} is not finite`);
		if (v >= b.min && v <= b.max) continue;
		const limit = v < b.min ? b.min : b.max, over = Math.abs(v - limit) / limit;
		if (over > BOUND_TOLERANCE) throw new MotionCompileError("out-of-bounds", `${b.id}=${v.toFixed(4)} is ${(over * 100).toFixed(1)}% beyond [${b.min}, ${b.max}]`);
		clamped.push({
			id: b.id,
			measured: v,
			clamped: limit
		});
	}
	const notes = [];
	const earth = record.identity.earthName ? EARTH_SPECIES[record.identity.earthName] ?? EARTH_DEFAULT : null;
	if (record.identity.earthName && !EARTH_SPECIES[record.identity.earthName]) notes.push(`earth species "${record.identity.earthName}" mass uncalibrated (medium); gait from physical habitat/anatomy`);
	const massName = earth ? earth.mass : at(MASS_BY_SIZE_INDEX, genome?.size) ?? "medium";
	const locoName = earth ? earth.loco : at(FA_LOCO, genome?.loco) ?? null;
	const physical = resolvePhysicalHabitat(record, genome);
	const habitatGait = physical.realm === "aquatic" ? "swim" : physical.realm === "aerial" || physical.realm === "gas-giant" ? "fly" : resolved.id === "hopper" ? "hop" : "walk";
	const gait = record.habitat?.gait ?? (record.identity.earthName ? EARTH_SPECIES[record.identity.earthName]?.gait ?? habitatGait : locoName ? LOCO_GAIT[locoName] ?? habitatGait : habitatGait);
	const gaits = templateGaits(resolved.id), gaitAlias = GAIT_FALLBACK[resolved.id]?.[gait];
	const isPlant = PLANT_TEMPLATE_IDS.includes(resolved.id);
	let templateGait = gaits.includes(gait) ? gait : gaitAlias && gaits.includes(gaitAlias) ? gaitAlias : gaits[0] ?? "none";
	if (!isPlant && !gaits.includes(gait)) notes.push(`gait "${gait}" has no ${resolved.id} approach; using ${templateGait}`);
	if (isPlant) templateGait = "none";
	const weapons = [];
	const addWeapon = (w) => {
		if (w && !weapons.includes(w)) weapons.push(w);
	};
	const natural = TEMPLATE_WEAPONS[resolved.id] ?? (specializedTemplate(resolved.id) ? [] : ["bite", "claw"]);
	if (isPlant) {} else if (earth) {
		const verbs = earthFaunaProfile(record.identity.earthName)?.intendedMoves ?? [];
		const vocabulary = {
			bite: "bite",
			claw: "claw",
			pinch: "claw",
			peck: "peck",
			headbutt: "headbutt",
			tail: "tail",
			strike: "bite",
			constrict: "constrict",
			mandible: "bite",
			lash: "constrict",
			punch: "claw",
			kick: "kick",
			body: "body",
			"sting-arms": "sting"
		};
		for (const verb of verbs) addWeapon(vocabulary[verb]);
	} else if (!specialized) {
		const headName = earth ? void 0 : at(FA_HEAD, genome?.head), tailName = earth ? void 0 : at(FA_TAIL, genome?.tail);
		addWeapon(headName ? HEAD_WEAPON[headName] : void 0);
		addWeapon(natural[0]);
		if (tailName) addWeapon(TAIL_WEAPON[tailName]);
		addWeapon(natural[1]);
	}
	const luminous = genome?.lumin === true;
	const realm = physical.realm;
	notes.push("physical realm: " + physical.source);
	const surface = record.materials?.surface ?? null;
	const recordMaterial = surface ? materialFromSkinName(surface) : null;
	let material = recordMaterial;
	if (typeof genome?.skin === "number") {
		const skinName = at(FA_SKIN, genome.skin), genomeMaterial = skinName ? materialFromSkinName(skinName) : null;
		if (genomeMaterial && surface === null && !record.identity.earthName) {
			material = genomeMaterial;
			notes.push(`materials: record omits surface; genome skin "${skinName}" used as fallback`);
		} else if (genomeMaterial && recordMaterial && recordMaterial !== genomeMaterial) notes.push(`materials: record surface "${surface}" wins over genome skin "${skinName}" (observer disagreement)`);
	}
	if (!material) throw new MotionCompileError("unsupported-materials", `surface "${surface}" maps to no kit material`);
	const materials = Object.freeze(Object.fromEntries(PART_GROUPS.map((g) => [g, material])));
	const jointMaterials = Object.fromEntries(resolved.joints.map((j) => [j, material]));
	for (const [joint, surface] of Object.entries(record.materials?.joints ?? {})) {
		const selected = materialFromSkinName(surface);
		if (!resolved.joints.includes(joint) || !selected) throw new MotionCompileError("unsupported-materials", "unknown joint/material " + joint + ": " + surface);
		jointMaterials[joint] = selected;
	}
	const secondaryParts = resolved.secondaryChains.map((c) => ({
		id: c.id,
		driver: c.driver,
		joints: c.joints,
		lagOrder: c.joints.map((_, i) => i),
		material,
		jointMaterials: Object.fromEntries(c.joints.map((j) => [j, jointMaterials[j]])),
		...c.kind ? { kind: c.kind } : {}
	}));
	const legSlack = {};
	for (const leg of resolved.legs) {
		const kneeJoint = leg + "Knee", kneeParent = resolved.graph.find(([j]) => j === kneeJoint)?.[1];
		const r = resolved.fixedPivots?.[kneeJoint] ?? landmarks[leg + "Root"] ?? (kneeParent ? landmarks[kneeParent] : void 0), k = landmarks[kneeJoint], a = landmarks[leg + "Ankle"] ?? landmarks[leg + "Foot"];
		if (!r || !k || !a) {
			notes.push("leg slack unavailable: " + leg + " lacks an observed two-bone chain");
			continue;
		}
		const upper = Math.hypot(k[0] - r[0], k[1] - r[1]), lower = Math.hypot(a[0] - k[0], a[1] - k[1]), dx = a[0] - r[0], vertical = a[1] - r[1];
		legSlack[leg] = Math.sqrt(Math.max(0, (upper + lower) ** 2 - dx * dx)) - vertical;
	}
	const [axisA, axisB] = resolved.bodyAxis ?? ["pelvis", "chest"];
	const torso = landmarks[axisA] && landmarks[axisB] ? Math.hypot(landmarks[axisB][0] - landmarks[axisA][0], landmarks[axisB][1] - landmarks[axisA][1]) : 0;
	const torsoClamp = clamped.find((c) => c.id === "torso" || c.id === "body");
	const bodyLength = torsoClamp ? torsoClamp.clamped : torso;
	const scale = measureMotionScale(resolved, landmarks);
	const slackBL = Object.freeze(Object.fromEntries(Object.entries(legSlack).map(([leg, v]) => [leg, bodyLength > 0 ? v / bodyLength : 0])));
	const straight = Object.entries(slackBL).filter(([, v]) => v < LEG_SLACK_MIN_BL).map(([leg, v]) => `${leg} ${(v * 100).toFixed(1)}%`);
	if (straight.length) notes.push(`leg slack under ${LEG_SLACK_MIN_BL * 100}% of body length (near-collinear rest chain; a planted paw cannot absorb lifts): ${straight.join(", ")}`);
	return {
		kind: "body-card",
		contactGeometry: structuredClone(record.geometry),
		...record.habitat ? { habitat: Object.freeze({ ...record.habitat }) } : {},
		amplitudeProfile: compileAmplitudeProfile(parts, scale.length, jointMaterials, poseProjectionScales(record)),
		...record.anatomy ? { anatomy: structuredClone(record.anatomy) } : {},
		projectionSigns: poseProjectionSigns(record),
		projectionScales: poseProjectionScales(record),
		identity: record.identity,
		recipeHash: record.recipeHash ?? null,
		template: {
			id: resolved.id,
			version: resolved.version,
			clipSetId: resolved.clipSetId
		},
		massClass: {
			name: massName,
			multiplier: MASS_CLASS[massName]
		},
		locomotion: {
			loco: locoName,
			gait,
			templateGait
		},
		realm,
		materials,
		jointMaterials: Object.freeze(jointMaterials),
		parts,
		secondaryParts,
		weapons,
		luminous,
		bodyLength,
		scaleLength: scale.length,
		scaleReference: scale.reference,
		groundLineY: record.geometry.groundLineY,
		landmarks,
		bounds: {
			inside: clamped.length === 0,
			clamped,
			limitsDeg: resolved.limitsDeg,
			legSlack: slackBL
		},
		notes
	};
}
var PART_GROUPS, MotionCompileError, EARTH_SPECIES, EARTH_DEFAULT, LOCO_GAIT, HEAD_WEAPON, TAIL_WEAPON, BOUND_TOLERANCE, LEG_SLACK_MIN_BL, TEMPLATE_WEAPONS, GAIT_FALLBACK, groupOf, at;
var init_body_card = __esmMin((() => {
	init_specialized_templates();
	init_motion_scale();
	init_amplitude_profile();
	init_pose_projection();
	init_anatomy_inventory();
	init_fixed_attachments();
	init_battle_habitat();
	init_earth_fauna_profiles();
	init_src$1();
	init_templates();
	init_family_templates();
	init_family_actions();
	init_timing();
	init_secondary();
	PART_GROUPS = Object.freeze([
		"body",
		"head",
		"legs",
		"tail",
		"ears",
		"wings",
		"fins",
		"antennae",
		"fronds",
		"arms"
	]);
	MotionCompileError = class extends Error {
		reason;
		fallback;
		constructor(reason, detail, fallback = null) {
			super(`motion refused (${reason}): ${detail}`);
			this.name = "MotionCompileError";
			this.reason = reason;
			this.fallback = fallback;
		}
	};
	EARTH_SPECIES = Object.freeze({
		"Civet": {
			gait: "walk",
			loco: "climbers",
			mass: "small",
			weapons: ["bite", "claw"]
		},
		"Frog": {
			gait: "hop",
			loco: "leapers",
			mass: "small",
			weapons: ["bite"]
		},
		"Red Fox": {
			gait: "trot",
			loco: "runners",
			mass: "medium",
			weapons: ["bite", "claw"]
		}
	});
	EARTH_DEFAULT = Object.freeze({
		gait: "walk",
		loco: null,
		mass: "medium",
		weapons: ["bite", "claw"]
	});
	LOCO_GAIT = Object.freeze({
		"grazers": "walk",
		"burrowers": "walk",
		"pack hunters": "trot",
		"gliders": "glide",
		"swimmers": "swim",
		"floaters": "drift",
		"ambush predators": "walk",
		"climbers": "walk",
		"herd-beasts": "trot",
		"filter-feeders": "drift",
		"leapers": "hop",
		"drifters": "drift",
		"runners": "gallop",
		"jet-propelled swimmers": "jet",
		"tentacle-walkers": "crawl",
		"rollers": "roll",
		"wall-clingers": "cling-crawl",
		"current-drifters": "drift"
	});
	HEAD_WEAPON = Object.freeze({
		"fanged": "bite",
		"horned": "gore",
		"beaked": "peck",
		"mandibled": "bite",
		"domed and bulbous": "headbutt"
	});
	TAIL_WEAPON = Object.freeze({
		"whip-like": "tail",
		"spiked": "tail",
		"stinger-tipped": "sting"
	});
	BOUND_TOLERANCE = .15;
	LEG_SLACK_MIN_BL = .03;
	TEMPLATE_WEAPONS = Object.freeze({
		quadruped: ["bite", "claw"],
		hopper: ["bite", "claw"],
		"biped-bird": ["peck", "claw"],
		fish: ["bite"],
		insect: ["bite"],
		serpent: ["bite", "constrict"],
		arachnid: ["sting", "bite"],
		radial: ["sting"],
		"plant-woody": [],
		"plant-herb": [],
		myriapod: ["bite", "sting"],
		cephalopod: ["constrict", "bite"],
		"flyer-membrane": ["bite", "claw"],
		primate: ["claw", "bite"]
	});
	GAIT_FALLBACK = Object.freeze({
		"biped-bird": {
			fly: "flight",
			glide: "flight"
		},
		insect: {
			fly: "flight",
			glide: "flight"
		},
		radial: {
			jet: "pulse",
			swim: "pulse"
		},
		fish: {
			jet: "swim",
			drift: "swim"
		},
		serpent: {
			crawl: "slither",
			swim: "slither"
		},
		arachnid: {
			crawl: "scuttle",
			walk: "scuttle",
			"cling-crawl": "scuttle"
		},
		hopper: {},
		myriapod: {
			walk: "crawl",
			"cling-crawl": "crawl",
			trot: "crawl"
		},
		cephalopod: {
			swim: "jet",
			drift: "jet",
			walk: "crawl",
			"cling-crawl": "crawl"
		},
		"flyer-membrane": {
			fly: "flight",
			glide: "flight",
			walk: "crawl",
			"cling-crawl": "crawl"
		},
		primate: {
			"cling-crawl": "climb",
			crawl: "walk",
			trot: "walk",
			gallop: "walk"
		}
	});
	groupOf = (joint) => /^tail|^abdomen$|^sting$/.test(joint) ? "tail" : /^ear/.test(joint) ? "ears" : /wing|tailFan/.test(joint) ? "wings" : /caudal|dorsal|pectoral/.test(joint) ? "fins" : /antenna/.test(joint) ? "antennae" : /branch|leaf|stem|frond/.test(joint) ? "fronds" : /^(arm(\d|Far|Near)|tentacle\d)/.test(joint) ? "arms" : /^(neck\d?|head|jaw|beak|mandible|chelicera|eye)/.test(joint) ? "head" : /^(pelvis|spine\d?|chest|thorax|cephalothorax|centre|bell|trunk|seg\d|mantle|siphon)$/.test(joint) ? "body" : /^fin/.test(joint) ? "fins" : "legs";
	at = (arr, i) => typeof i === "number" ? arr[((i | 0) % arr.length + arr.length) % arr.length] : void 0;
}));
//#endregion
//#region port/v2/tools/creature-animation/painted-contact-selector.mjs
/** One source-space selector shared by intake contact locks and runtime support.
* Preserve the runtime's normalized PER-CORNER arithmetic and strict first-on-
* equal-distance order. Algebraically equivalent pixel sums choose differently
* at floating-point ties. This function reads geometry only and never rewrites it.
*/
function selectPaintedContactVertex(vertices, part, end, width, height) {
	if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0 || !Array.isArray(end) || end.length !== 2 || end.some((v) => !Number.isFinite(v))) throw Error("Painted contact selector: dimensions or endpoint");
	let best, distance = Infinity;
	for (const [vertexIndex, v] of part.vertices.entries()) {
		let x = 0, y = 0;
		for (let k = 0; k < 3; k++) {
			const p = vertices[v.triangle[k]], weight = v.barycentric[k];
			if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y) || !Number.isFinite(weight)) throw Error("Painted contact selector: source vertex");
			x += p.x * weight / width;
			y += p.y * weight / height;
		}
		const d = Math.hypot((x - end[0]) * width, (y - end[1]) * height);
		if (!Number.isFinite(d)) throw Error("Painted contact selector: nonfinite distance");
		if (d < distance) {
			distance = d;
			best = {
				vertexIndex,
				rest: [x, y],
				distancePx: d,
				vertex: v
			};
		}
	}
	return best;
}
var init_painted_contact_selector = __esmMin((() => {}));
//#endregion
//#region port/v2/apps/game/src/motion/grounded-bird.ts
function groundedBirdAction(card, action, base, sample, compile) {
	const unchanged = {
		action,
		note: null
	};
	if (card.template.id !== "biped-bird" || ![
		"dodge",
		"hit",
		"tame",
		"melee:claw",
		"faint"
	].includes(action.id) || !["land", "amphibious"].includes(card.realm) || !card.contactGeometry || !card.recipeHash) return unchanged;
	if (action.id === "faint" && !card.paintedContactSupports) return unchanged;
	const key = JSON.stringify({
		card,
		action,
		timeline: {
			...base,
			seed: 0,
			hash: ""
		}
	}), entries = cache$2.get(card) ?? /* @__PURE__ */ new Map(), prior = entries.get(action.id);
	if (prior?.key === key) return prior;
	const finish = (a, note) => {
		const value = {
			key,
			action: a,
			note
		};
		entries.set(action.id, value);
		cache$2.set(card, entries);
		return value;
	};
	const definition = familyContract("biped-bird");
	if (definition.contactStance?.travel?.[action.id]) return finish(action, null);
	const record = {
		template: card.template,
		recipeHash: card.recipeHash,
		geometry: card.contactGeometry,
		landmarks: card.landmarks,
		...card.anatomy ? { anatomy: card.anatomy } : {}
	};
	let solver;
	try {
		solver = createFamilyContactSolver(record, card.paintedContactSupports?.supports ?? {});
	} catch {
		return finish(action, null);
	}
	const fits = (tl) => {
		for (let i = 0; i <= 128; i++) {
			const ms = tl.durationMs * i / 128, p = sample(tl, ms), pose = {};
			for (const [j, rotation] of Object.entries(p.joints)) pose[j] = { rotation };
			pose.root = {
				rotation: p.root.rotation,
				dx: p.root.dx,
				dy: p.root.dy
			};
			const modes = action.id === "faint" ? ["solver", "stage"] : action.id === "melee:claw" ? ["stage"] : ["solver"];
			try {
				for (const travel of modes) solver.resolve(pose, {
					actionId: action.id,
					elapsedMs: ms,
					durationMs: tl.durationMs,
					weight: 1,
					realm: card.realm,
					travel
				});
			} catch {
				return false;
			}
		}
		return true;
	};
	if (fits(base)) return finish(action, null);
	if (action.id === "faint") {
		const torso = /* @__PURE__ */ new Set([
			"root",
			"pelvis",
			"spine",
			"chest"
		]);
		const scaled = (gain) => freezeAction({
			...action,
			poses: action.poses.map((p) => ({
				...p,
				joints: Object.fromEntries(Object.entries(p.joints).map(([j, v]) => [j, v * (torso.has(j) ? gain : 1)])),
				root: {
					dx: p.root.dx * gain,
					dy: p.root.dy * gain
				}
			}))
		});
		if (!fits(compile(scaled(0)))) return finish(action, null);
		let low = 0, high = 1;
		for (let i = 0; i < 12; i++) {
			const m = (low + high) / 2;
			if (fits(compile(scaled(m)))) low = m;
			else high = m;
		}
		const gain = low * .9, candidate = scaled(gain);
		return gain > 0 && fits(compile(candidate)) ? finish(candidate, "grounded-bird:painted-faint-gain=" + gain) : finish(action, null);
	}
	if (action.id === "melee:claw") {
		const level = freezeAction({
			...action,
			poses: action.poses.map((p) => ({
				...p,
				joints: {
					...p.joints,
					root: 0
				},
				root: {
					...p.root,
					dy: 0
				}
			}))
		});
		return fits(compile(level)) ? finish(level, "grounded-bird:level-claw") : finish(action, null);
	}
	const distance = (a, b) => {
		const p = card.landmarks[a], q = card.landmarks[b];
		return p && q ? Math.hypot(p[0] - q[0], p[1] - q[1]) : NaN;
	};
	const ratio = Math.min(...familyContactChains(definition).map((c) => distance(c.hip, c.knee) + distance(c.knee, c.end))) / card.bodyLength;
	if (!Number.isFinite(ratio) || ratio <= 0) return finish(action, null);
	const candidate = freezeAction({
		...action,
		rootUnit: "body",
		poses: action.poses.map((p, i) => action.id === "dodge" ? {
			...p,
			joints: i === 0 ? {
				neck0: 15,
				neck1: 10,
				head: 5
			} : {},
			root: i === 0 ? {
				dx: -.12 * ratio,
				dy: .06 * ratio
			} : {
				dx: 0,
				dy: 0
			}
		} : {
			...p,
			root: {
				dx: p.root.dx * ratio,
				dy: p.root.dy * ratio
			}
		})
	});
	if (fits(compile(candidate))) return finish(candidate, action.id === "dodge" ? "grounded-bird:neck-duck" : "grounded-bird:leg-span-translation");
	if (action.id === "hit" || action.id === "tame") {
		const recoil = freezeAction({
			...candidate,
			poses: candidate.poses.map((p) => ({
				...p,
				joints: {
					...p.joints,
					root: 0,
					pelvis: 0,
					spine: 0,
					chest: 0
				},
				root: {
					dx: 0,
					dy: 0
				}
			}))
		});
		if (fits(compile(recoil))) return finish(recoil, action.id === "tame" ? "grounded-bird:neck-bow" : "grounded-bird:neck-recoil");
	}
	return finish(action, null);
}
var cache$2, freezeAction;
var init_grounded_bird = __esmMin((() => {
	init_creature_rig_contact();
	init_family_contracts();
	cache$2 = /* @__PURE__ */ new WeakMap();
	freezeAction = (a) => Object.freeze({
		...a,
		poses: Object.freeze(a.poses.map((p) => Object.freeze({
			...p,
			joints: Object.freeze({ ...p.joints }),
			root: Object.freeze({ ...p.root })
		})))
	});
}));
//#endregion
//#region port/v2/apps/game/src/motion/grounded-quadruped.ts
function groundedQuadrupedAction(card, action, base, sample, compile) {
	const unchanged = {
		action,
		note: null
	};
	if (card.template.id !== "quadruped" || !["approach:gallop", "cast"].includes(action.id) || !["land", "amphibious"].includes(card.realm) || !card.contactGeometry || !card.recipeHash) return unchanged;
	const key = JSON.stringify({
		card,
		action,
		timeline: {
			...base,
			seed: 0,
			hash: ""
		}
	}), entries = cache$1.get(card) ?? /* @__PURE__ */ new Map(), prior = entries.get(action.id);
	if (prior?.key === key) return prior;
	const finish = (a, note) => {
		const result = {
			key,
			action: a,
			note
		};
		entries.set(action.id, result);
		cache$1.set(card, entries);
		return result;
	};
	const record = {
		template: card.template,
		recipeHash: card.recipeHash,
		geometry: card.contactGeometry,
		landmarks: card.landmarks,
		...card.anatomy ? { anatomy: card.anatomy } : {}
	};
	let solver;
	try {
		solver = createFamilyContactSolver(record);
	} catch {
		return finish(action, null);
	}
	const fits = (tl) => {
		for (let i = 0; i <= 128; i++) {
			const ms = tl.durationMs * i / 128, p = sample(tl, ms), pose = {};
			for (const [j, rotation] of Object.entries(p.joints)) pose[j] = { rotation };
			pose.root = {
				rotation: p.root.rotation,
				dx: p.root.dx,
				dy: p.root.dy
			};
			try {
				solver.resolve(pose, {
					actionId: action.id,
					elapsedMs: ms,
					durationMs: tl.durationMs,
					weight: 1,
					realm: card.realm
				});
			} catch {
				return false;
			}
		}
		return true;
	};
	if (fits(base)) return finish(action, null);
	const scaled = (gain) => ({
		...action,
		poses: action.poses.map((p) => ({
			...p,
			joints: Object.fromEntries(Object.entries(p.joints).map(([j, v]) => [j, v * (TORSO$4.has(j) ? gain : 1)])),
			root: {
				dx: p.root.dx * gain,
				dy: p.root.dy * gain
			}
		}))
	});
	if (!fits(compile(scaled(0)))) return finish(action, null);
	let low = 0, high = 1;
	for (let i = 0; i < 12; i++) {
		const mid = (low + high) / 2;
		if (fits(compile(scaled(mid)))) low = mid;
		else high = mid;
	}
	const gain = low * .9, candidate = scaled(gain);
	if (!(gain > 0) || !fits(compile(candidate))) return finish(action, null);
	return finish(Object.freeze({
		...candidate,
		poses: Object.freeze(candidate.poses.map((p) => Object.freeze({
			...p,
			joints: Object.freeze({ ...p.joints }),
			root: Object.freeze({ ...p.root })
		})))
	}), "grounded-quadruped:torso-gain=" + gain);
}
var TORSO$4, cache$1;
var init_grounded_quadruped = __esmMin((() => {
	init_creature_rig_contact();
	TORSO$4 = /* @__PURE__ */ new Set([
		"root",
		"pelvis",
		"spine",
		"chest"
	]);
	cache$1 = /* @__PURE__ */ new WeakMap();
}));
//#endregion
//#region port/v2/apps/game/src/motion/sprawler-profile.ts
function isSprawler(card) {
	if (card.template.id !== "quadruped" || !["land", "amphibious"].includes(card.realm) || !(card.bodyLength > 0)) return false;
	return LEGS.every((leg) => {
		const r = card.landmarks[leg + "Root"], k = card.landmarks[leg + "Knee"], a = card.landmarks[leg + "Ankle"];
		return r && k && a && Math.hypot(k[0] - r[0], k[1] - r[1]) / card.bodyLength <= .45 && Math.abs(a[1] - r[1]) / card.bodyLength <= .65;
	});
}
function sprawlerAction(card, action) {
	if (!isSprawler(card)) return action;
	if (!(action.id.startsWith("approach:") || [
		"idle",
		"alert",
		"cast",
		"hit",
		"faint",
		"victory",
		"tame",
		"feed"
	].includes(action.id)) && action.id !== "melee:tail") return action;
	const flat = LEGS.some((leg) => card.landmarks[leg + "Ankle"][1] - card.landmarks[leg + "Root"][1] < card.bodyLength * .03);
	const idle = action.id === "idle", faint = action.id === "faint";
	return Object.freeze({
		...action,
		poses: Object.freeze(action.poses.map((p) => Object.freeze({
			...p,
			joints: Object.freeze(Object.fromEntries(Object.entries(p.joints).map(([joint, value]) => {
				return [joint, value * (TORSO$3.has(joint) ? flat || idle ? 0 : .08 : joint === "head" || joint === "neck" ? idle || faint ? 0 : .2 : joint.startsWith("tail") ? .12 : joint === "jaw" ? 1 : 1)];
			}))),
			root: Object.freeze({
				dx: flat || idle ? 0 : p.root.dx * .08,
				dy: flat || idle ? 0 : p.root.dy * .04
			})
		})))
	});
}
var LEGS, TORSO$3;
var init_sprawler_profile = __esmMin((() => {
	LEGS = [
		"foreNear",
		"foreFar",
		"hindNear",
		"hindFar"
	];
	TORSO$3 = /* @__PURE__ */ new Set([
		"root",
		"pelvis",
		"spine",
		"chest"
	]);
}));
//#endregion
//#region port/v2/apps/game/src/motion/axial-faint.ts
/** A split painted nape can span several axial owners. Independent local
* rotations accumulate along the head chain: preserved interior paint then
* protrudes as a rigid spike, even with valid triangles and foot contacts.
* Canonical grounded bird/primate faint keeps this continuous painted region
* coherent through faint settling: birds retain their initial nod and torso frame;
* primates also include the torso owning their posterior nape.
* Root slump and hand/leg/wing/tail tracks
* remain authored; idle, other actions and explicit editor curves are untouched.
* This deliberately trades independent faint head/neck and upper-arm curl for continuity.
* It changes no skin, source ownership, joint limit or publication guard. */
function axialFaintAction(card, action) {
	if (action.id !== "faint" || action.family !== "faint" || !card.paintedContactSupports || !["biped-bird", "primate"].includes(card.template.id) || !["land", "amphibious"].includes(card.realm)) return action;
	const byJoint = new Map(card.parts.map((p) => [p.joint, p])), chain = [];
	let joint = "head";
	while (joint !== "root") {
		const part = byJoint.get(joint);
		if (!part || chain.includes(joint)) throw Error("motion: invalid faint axial chain");
		if (card.template.id === "biped-bird" && part.group !== "head") break;
		chain.push(joint);
		joint = part.parent;
	}
	for (const part of card.parts) if (part.group === "arms" && card.parts.some((p) => p.group === "arms" && p.parent === part.joint)) chain.push(part.joint);
	const adapt = (index) => card.template.id !== "biped-bird" || index === action.poses.length - 1;
	if (!action.poses.some((p, i) => adapt(i) && chain.some((j) => (p.joints[j] ?? 0) !== 0))) return action;
	return {
		...action,
		poses: action.poses.map((p, i) => adapt(i) ? {
			...p,
			joints: {
				...p.joints,
				...Object.fromEntries(chain.map((j) => [j, 0]))
			}
		} : p)
	};
}
var init_axial_faint = __esmMin((() => {}));
//#endregion
//#region port/v2/apps/game/src/motion/cast-attack.ts
/** The D31 cast for this card, or null (every other family, a portrait, or a card that has an admitted melee verb). */
function castAttackOf(card) {
	if (!card) return null;
	const fam = CAST_ATTACK_FAMILIES[card.template.id];
	if (!fam) return null;
	const verbs = templateMelees(card.template.id), alias = MELEE_ALIAS[card.template.id] ?? {};
	if (card.weapons.some((w) => verbs.includes(alias[w] ?? w))) return null;
	const has = fam.emitter !== null && card.parts.some((p) => p.joint === fam.emitter);
	const emitter = has ? fam.emitter : null;
	const reason = `D31 cast: ${card.template.id} has no admitted melee; launch at ${has ? fam.emitterWhy : fam.emitter ? `the body centre (no ${fam.emitter} landmark on this record)` : fam.emitterWhy}`;
	const anchored = specializedTemplate(card.template.id)?.anchored === true;
	return Object.freeze({
		family: card.template.id,
		emitter,
		reason: anchored ? reason + "; anchored: casts from its stand, no run-up" : reason,
		anchored
	});
}
/** First-order screen displacement (image coordinates, y down) of `point` under the pose `deg` (pre-projection degrees). */
function displacement(card, deg, owner, point) {
	const byJoint = new Map(card.parts.map((p) => [p.joint, p]));
	let dx = 0, dy = 0, j = owner;
	while (j && j !== "root") {
		const part = byJoint.get(j);
		if (!part) break;
		const th = (deg[j] ?? 0) * DEG * (card.projectionSigns?.[j] ?? 1);
		dx += -th * (point[1] - part.pivot[1]);
		dy += th * (point[0] - part.pivot[0]);
		j = part.parent;
	}
	return {
		dx,
		dy
	};
}
/** Mean displacement of the given joints' landmarks (their part tips). */
function meanShift(card, deg, joints) {
	const tips = card.parts.filter((p) => joints.includes(p.joint));
	if (!tips.length) return {
		dx: 0,
		dy: 0
	};
	const s = tips.map((p) => displacement(card, deg, p.joint, p.tip));
	return {
		dx: s.reduce((a, b) => a + b.dx, 0) / s.length,
		dy: s.reduce((a, b) => a + b.dy, 0) / s.length
	};
}
/** The D31 pulse for a card's `cast`, or the authored action unchanged. */
function castAttackAction(card, action) {
	if (action.id !== "cast" || action.family !== "cast") return action;
	const cast = castAttackOf(card), spec = cast ? specializedTemplate(card.template.id) : null;
	if (!cast || !spec) return action;
	const present = new Set(card.parts.map((p) => p.joint)), rigid = new Set(spec.rigid);
	const live = (names) => (names ?? []).filter((n) => present.has(n) && !rigid.has(n));
	const rule = MATERIAL_RULES[bodyMaterial(card)] ?? MATERIAL_RULES.slick;
	const gather = 6 + 100 * rule.squash, reach = rule.rigid ? 0 : 150 * rule.stretch, overshoot = rule.overshoot;
	const wave = live(spec.roles.wave), soft = live(spec.roles.soft), head = live(spec.roles.head), valves = live(spec.roles.valves), sensors = live(spec.roles.sensors);
	const curl = {};
	const chain = (names, w) => {
		const ws = names.map((_, i) => w(i)), sum = ws.reduce((a, b) => a + b, 0) || 1;
		names.forEach((n, i) => {
			curl[n] = 2 * ws[i] / sum;
		});
	};
	chain(wave, (i) => Math.sin(Math.PI * (i + .5) / wave.length));
	chain(soft, (i) => .5 + .5 * (i + 1) / soft.length);
	head.forEach((n) => {
		curl[n] = n === "mouth" ? 0 : .8;
	});
	sensors.forEach((n) => {
		curl[n] = .6;
	});
	const curlJoints = Object.keys(curl), anchored = spec.anchored === true;
	const probe = meanShift(card, curl, curlJoints);
	const sign = anchored ? probe.dx > 0 ? -1 : 1 : probe.dy > 0 ? -1 : 1;
	const rise = scaled(curl, sign * gather);
	if (valves.length === 2) {
		const [a, b] = valves, open = {
			[a]: 1,
			[b]: -1
		};
		const sa = displacement(card, open, a, card.parts.find((p) => p.joint === a).tip), sb = displacement(card, open, b, card.parts.find((p) => p.joint === b).tip);
		const ta = card.parts.find((p) => p.joint === a).tip, tb = card.parts.find((p) => p.joint === b).tip;
		const vs = (ta[0] - tb[0]) * (sa.dx - sb.dx) + (ta[1] - tb[1]) * (sa.dy - sb.dy) >= 0 ? 1 : -1;
		rise[a] = vs * gather;
		rise[b] = -vs * gather;
	}
	const release = scaled(rise, anchored && reach > 0 ? -reach / gather : .15);
	if (head.includes("mouth")) release.mouth = -sign * gather;
	if (valves.length === 2) for (const v of valves) release[v] = -(rise[v] ?? 0) * .2;
	const lift = anchored ? 0 : -rule.stretch * .5;
	const poses = [
		P$1(tAt("cast", "rise"), "ease-in", rise, lift),
		P$1(tAt("cast", "hold"), "sine-in-out", scaled(rise, 1.1), lift),
		P$1(tAt("cast", "release"), "ease-out", release, 0)
	];
	if (!rule.rigid && overshoot > 0) {
		const k = anchored ? overshoot : -overshoot * .5;
		poses.push(P$1(tAt("cast", "settle", .4), "sine-in-out", scaled(rise, k)));
		if ((rule.wobbleCycles ?? 0) >= 2) poses.push(P$1(tAt("cast", "settle", .7), "sine-in-out", scaled(rise, -k * .4)));
	}
	poses.push(P$1(1, rule.rigid ? "ease-out" : "back-out", {}));
	return Object.freeze({
		id: "cast",
		family: "cast",
		loop: false,
		poses: Object.freeze(poses)
	});
}
var CAST_ATTACK_FAMILIES, CAST_ATTACK_NOTE, P$1, scaled, bodyMaterial;
var init_cast_attack = __esmMin((() => {
	init_timing();
	init_secondary();
	init_actions();
	init_specialized_templates();
	init_family_actions();
	CAST_ATTACK_FAMILIES = Object.freeze({
		annelid: Object.freeze({
			emitter: null,
			emitterWhy: "an annelid declares no mouth landmark: the painted body centre"
		}),
		"sessile-filter": Object.freeze({
			emitter: "aperture",
			emitterWhy: "the declared exhalant aperture (osculum)"
		}),
		gastropod: Object.freeze({
			emitter: "mouth",
			emitterWhy: "the declared mouth"
		}),
		bivalve: Object.freeze({
			emitter: "siphon",
			emitterWhy: "the declared siphon"
		})
	});
	CAST_ATTACK_NOTE = "cast-attack:d31-body-pulse-v1";
	P$1 = (t, ease, joints, dy = 0) => ({
		t,
		ease,
		joints,
		root: {
			dx: 0,
			dy
		}
	});
	scaled = (j, k) => Object.fromEntries(Object.entries(j).map(([n, v]) => [n, v * k]));
	bodyMaterial = (card) => card.materials.body;
}));
//#endregion
//#region port/v2/apps/game/src/motion/small-crustacean-attack.ts
function smallCrustaceanAttackAction(card, action) {
	if (card.template.id !== "crustacean-small" || action.id !== "melee:claw" || action.family !== "melee") return action;
	const present = new Set(card.parts.map((p) => p.joint));
	if ([
		"thorax",
		"head",
		...["Near", "Far"].flatMap((s) => [
			"Root",
			"Knee",
			"Foot"
		].map((j) => "leg0" + s + j))
	].some((j) => !present.has(j) || !card.landmarks[j])) throw Error("motion: foreleg strike requires observed bilateral root/knee/tip chains");
	const head = card.landmarks.head, thorax = card.landmarks.thorax, fx = head[0] - thorax[0], fy = head[1] - thorax[1];
	if (Math.hypot(fx, fy) < 1e-6) throw Error("motion: foreleg strike requires a nondegenerate observed forward axis");
	const gather = {}, strike = {};
	for (const side of ["Near", "Far"]) {
		const prefix = "leg0" + side, root = card.landmarks[prefix + "Root"], knee = card.landmarks[prefix + "Knee"], tip = card.landmarks[prefix + "Foot"];
		const a = [knee[0] - root[0], knee[1] - root[1]], b = [tip[0] - knee[0], tip[1] - knee[1]];
		if (Math.hypot(a[0], a[1]) < 1e-6 || Math.hypot(b[0], b[1]) < 1e-6) throw Error("motion: foreleg strike requires nondegenerate observed segments");
		const upper = bounded(angleTo(a[0], a[1], fx, fy), 12);
		const distal = bounded(angleTo(b[0], b[1], fx, fy) - upper, 18);
		for (const [joint, deg] of [[prefix + "Knee", upper], [prefix + "Foot", distal]]) {
			strike[joint] = deg * (card.projectionSigns?.[joint] ?? 1);
			gather[joint] = -.6 * strike[joint];
		}
	}
	return Object.freeze({
		id: action.id,
		family: "melee",
		loop: false,
		poses: Object.freeze([
			P(tAt("melee", "anticipation"), gather, "ease-in"),
			P(tAt("melee", "strike"), strike, "ease-out"),
			P(tAt("melee", "smear"), strike, "sine-in-out"),
			P(1, {}, "sine-in-out")
		])
	});
}
var bounded, angleTo, P;
var init_small_crustacean_attack = __esmMin((() => {
	init_actions();
	init_timing();
	bounded = (angle, max) => Math.max(-max, Math.min(max, angle));
	angleTo = (x, y, fx, fy) => Math.atan2(x * fy - y * fx, x * fx + y * fy) / DEG;
	P = (t, joints, ease) => ({
		t,
		joints,
		ease,
		root: {
			dx: 0,
			dy: 0
		}
	});
}));
//#endregion
//#region port/v2/apps/game/src/motion/grounded-insect.ts
function groundedInsectAction(card, action, base, sample, compile) {
	const unchanged = {
		action,
		note: null
	};
	if (card.template.id !== "insect" || action.id !== "feed" || !card.paintedContactSupports || !["land", "amphibious"].includes(card.realm) || !card.contactGeometry || !card.recipeHash) return unchanged;
	const key = JSON.stringify({
		card,
		action,
		timeline: {
			...base,
			seed: 0,
			hash: ""
		}
	}), entries = cache.get(card) ?? /* @__PURE__ */ new Map(), prior = entries.get(action.id);
	if (prior?.key === key) return prior;
	const finish = (a, note) => {
		const result = {
			key,
			action: a,
			note
		};
		entries.set(action.id, result);
		cache.set(card, entries);
		return result;
	};
	const record = {
		template: card.template,
		recipeHash: card.recipeHash,
		geometry: card.contactGeometry,
		landmarks: card.landmarks,
		...card.anatomy ? { anatomy: card.anatomy } : {}
	};
	let solver;
	try {
		solver = createFamilyContactSolver(record, card.paintedContactSupports.supports);
	} catch {
		return finish(action, null);
	}
	const fits = (tl) => {
		for (let i = 0; i <= 128; i++) {
			const ms = tl.durationMs * i / 128, p = sample(tl, ms), pose = {};
			for (const [j, rotation] of Object.entries(p.joints)) pose[j] = { rotation };
			pose.root = {
				rotation: p.root.rotation,
				dx: p.root.dx,
				dy: p.root.dy
			};
			try {
				solver.resolve(pose, {
					actionId: action.id,
					elapsedMs: ms,
					durationMs: tl.durationMs,
					weight: 1,
					realm: card.realm
				});
			} catch {
				return false;
			}
		}
		return true;
	};
	if (fits(base)) return finish(action, null);
	const scaled = (gain) => ({
		...action,
		poses: action.poses.map((p) => ({
			...p,
			joints: Object.fromEntries(Object.entries(p.joints).map(([j, v]) => [j, v * (TORSO$2.has(j) ? gain : 1)])),
			root: {
				dx: p.root.dx * gain,
				dy: p.root.dy * gain
			}
		}))
	});
	if (!fits(compile(scaled(0)))) return finish(action, null);
	let low = 0, high = 1;
	for (let i = 0; i < 12; i++) {
		const mid = (low + high) / 2;
		if (fits(compile(scaled(mid)))) low = mid;
		else high = mid;
	}
	const gain = low * .9, candidate = scaled(gain);
	if (!(gain > 0) || !fits(compile(candidate))) return finish(action, null);
	return finish(Object.freeze({
		...candidate,
		poses: Object.freeze(candidate.poses.map((p) => Object.freeze({
			...p,
			joints: Object.freeze({ ...p.joints }),
			root: Object.freeze({ ...p.root })
		})))
	}), "grounded-insect:painted-torso-gain=" + gain);
}
var TORSO$2, cache;
var init_grounded_insect = __esmMin((() => {
	init_creature_rig_contact();
	TORSO$2 = /* @__PURE__ */ new Set(["root", "thorax"]);
	cache = /* @__PURE__ */ new WeakMap();
}));
//#endregion
//#region port/v2/apps/game/src/motion/stance-envelope.ts
function faintStanceEnvelope(card, tl, sample) {
	if (!["quadruped", "insect"].includes(card.template.id) || tl.actionId !== "faint" || card.realm !== "land" && card.realm !== "amphibious") return null;
	const base = familyContract(card.template.id), parents = new Map(base.graph), contactChains = familyContactChains(base);
	if (card.parts.some((p) => parents.get(p.joint) !== p.parent) || contactChains.some((c) => [
		c.hip,
		c.knee,
		c.end,
		...c.terminal ? [c.terminal] : []
	].some((j) => !card.landmarks[j]))) return null;
	const definition = {
		...base,
		graph: card.parts.map((p) => [p.joint, p.parent])
	};
	const program = createSkeletonPoseProgram(definition, card.landmarks), limits = definition.contactLimitsDeg ?? definition.limitsDeg;
	const observed = contactChains.map((c) => {
		const root = point$1(card.landmarks[c.hip]), joint = point$1(card.landmarks[c.knee]), end = point$1(card.landmarks[c.end]);
		const cross = (end.x - root.x) * (joint.y - root.y) - (end.y - root.y) * (joint.x - root.x);
		return {
			...c,
			root,
			joint,
			endPoint: end,
			cross
		};
	});
	if (observed.some((c) => Math.abs(c.cross) < 1e-12)) return null;
	const chains = observed.map((c) => ({
		...c,
		chain: createTwoBoneChain({
			root: c.root,
			joint: c.joint,
			end: c.endPoint,
			bend: c.cross < 0 ? -1 : 1
		})
	}));
	const poses = Array.from({ length: 129 }, (_, i) => sample(tl.durationMs * i / SAMPLES));
	const fits = (gain) => {
		for (const p of poses) {
			const pose = {};
			for (const j of TORSO$1) if (card.landmarks[j]) pose[j] = { rotation: (p.joints[j] ?? 0) * gain };
			pose.root = {
				rotation: (p.joints.root ?? 0) * gain,
				dx: p.root.dx * gain,
				dy: p.root.dy * gain
			};
			const matrices = program.evaluate(pose);
			for (const c of chains) {
				const parent = matrices[c.hip], root = transformPoint(parent, c.root), distance = Math.hypot(c.endPoint.x - root.x, c.endPoint.y - root.y);
				if (distance < Math.abs(c.chain.lengths.upper - c.chain.lengths.lower) || distance > c.chain.lengths.upper + c.chain.lengths.lower || distance < 1e-6) return false;
				const solved = c.chain.solve(root, c.endPoint), upper = wrapped$1(angle$2(solved.root, solved.joint) - angle$2(c.root, c.joint)), lower = wrapped$1(angle$2(solved.joint, solved.end) - angle$2(c.joint, c.endPoint));
				const rotations = [[c.knee, wrapped$1(upper - Math.atan2(parent[1], parent[0]))], [c.end, wrapped$1(lower - upper)]];
				if (c.terminal) rotations.push([c.terminal, wrapped$1(-lower)]);
				for (const [j, value] of rotations) {
					const bound = limits[j], degrees = value * 180 / Math.PI;
					if (degrees < bound.min * ANGLE_RESERVE || degrees > bound.max * ANGLE_RESERVE) return false;
				}
			}
		}
		return true;
	};
	if (fits(1)) return null;
	if (!fits(0)) throw Error("Motion envelope: rest geometry has no planted faint envelope");
	let low = 0, high = 1;
	for (let i = 0; i < 12; i++) {
		const middle = (low + high) / 2;
		if (fits(middle)) low = middle;
		else high = middle;
	}
	if (low === 0) throw Error("Motion envelope: no nonzero planted faint excursion");
	return Object.freeze({
		schema: "cf.motion.stance-envelope/v1",
		torsoGain: low,
		angleReserve: ANGLE_RESERVE,
		samples: 129
	});
}
/** Scaling a complete curve preserves its timing/easing and continuity. */
function applyStanceEnvelope(tl, envelope) {
	const { hash: _, ...body } = tl, gain = envelope.torsoGain;
	return {
		...body,
		stanceEnvelope: envelope,
		tracks: Object.fromEntries(Object.entries(tl.tracks).map(([j, keys]) => [j, TORSO$1.has(j) ? keys.map((k) => ({
			...k,
			value: k.value * gain
		})) : keys])),
		root: {
			dx: tl.root.dx.map((k) => ({
				...k,
				value: k.value * gain
			})),
			dy: tl.root.dy.map((k) => ({
				...k,
				value: k.value * gain
			}))
		}
	};
}
var TORSO$1, ANGLE_RESERVE, SAMPLES, point$1, angle$2, wrapped$1;
var init_stance_envelope = __esmMin((() => {
	init_family_contracts();
	init_skeleton_pose();
	init_kinematics();
	TORSO$1 = /* @__PURE__ */ new Set([
		"root",
		"pelvis",
		"spine",
		"chest",
		"thorax"
	]);
	ANGLE_RESERVE = .9;
	SAMPLES = 128;
	point$1 = ([x, y]) => ({
		x,
		y
	});
	angle$2 = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
	wrapped$1 = (v) => Math.atan2(Math.sin(v), Math.cos(v));
}));
//#endregion
//#region port/v2/apps/game/src/motion/contact-envelope.ts
function stationaryContactEnvelope(card, tl, sample) {
	if (card.template.id !== "quadruped" || !["hit", "tame"].includes(tl.actionId) || !["land", "amphibious"].includes(card.realm) || !card.contactGeometry || !card.recipeHash) return null;
	if (familyContract("quadruped").contactStance?.travel?.[tl.actionId]) throw Error("Stationary envelope requires a fixed-support action");
	const record = {
		template: card.template,
		recipeHash: card.recipeHash,
		geometry: card.contactGeometry,
		landmarks: card.landmarks,
		...card.anatomy ? { anatomy: card.anatomy } : {}
	};
	let solver;
	try {
		solver = createFamilyContactSolver(record);
	} catch {
		return null;
	}
	const poses = Array.from({ length: 129 }, (_, i) => {
		const ms = tl.durationMs * i / STEPS;
		return {
			ms,
			p: sample(ms)
		};
	});
	const fits = (gain) => {
		for (const { ms, p } of poses) {
			const pose = {};
			for (const [j, rotation] of Object.entries(p.joints)) if (j !== "root") pose[j] = { rotation: rotation * (TORSO.has(j) ? gain : 1) };
			pose.root = {
				rotation: p.root.rotation * gain,
				dx: p.root.dx * gain,
				dy: p.root.dy * gain
			};
			try {
				solver.resolve(pose, {
					actionId: tl.actionId,
					elapsedMs: ms,
					durationMs: tl.durationMs,
					weight: 1,
					realm: card.realm
				});
			} catch {
				return false;
			}
		}
		return true;
	};
	if (fits(1)) return null;
	if (!fits(0)) return null;
	let low = 0, high = 1;
	for (let i = 0; i < 12; i++) {
		const middle = (low + high) / 2;
		if (fits(middle)) low = middle;
		else high = middle;
	}
	const torsoGain = low * GAIN_RESERVE;
	if (!(torsoGain > 0) || !fits(torsoGain)) return null;
	return Object.freeze({
		schema: "cf.motion.contact-envelope/v1",
		torsoGain,
		gainReserve: GAIN_RESERVE,
		samples: 129
	});
}
var TORSO, STEPS, GAIN_RESERVE;
var init_contact_envelope = __esmMin((() => {
	init_creature_rig_contact();
	init_family_contracts();
	TORSO = /* @__PURE__ */ new Set([
		"root",
		"pelvis",
		"spine",
		"chest"
	]);
	STEPS = 128;
	GAIN_RESERVE = .9;
}));
//#endregion
//#region port/v2/apps/game/src/motion/timeline.ts
function envelopeFor(card, base) {
	if (!(card.template.id === "quadruped" && [
		"hit",
		"tame",
		"faint"
	].includes(base.actionId) || card.template.id === "insect" && base.actionId === "faint")) return null;
	const key = JSON.stringify({
		card,
		timeline: {
			...base,
			seed: 0,
			hash: ""
		}
	}), cache = envelopeCache.get(card) ?? /* @__PURE__ */ new Map(), prior = cache.get(base.actionId);
	if (prior?.key === key) return prior.value;
	const value = faintStanceEnvelope(card, base, (ms) => sampleTimeline(base, ms)) ?? stationaryContactEnvelope(card, base, (ms) => sampleTimeline(base, ms));
	cache.set(base.actionId, {
		key,
		value
	});
	envelopeCache.set(card, cache);
	return value;
}
/** approach → the card's template gait; melee → the first card weapon the template's library (or its alias table) has a verb for, else the library's first melee verb with a note. */
function resolveActionId(card, actionId) {
	if (actionId === "approach") return {
		id: "approach:" + card.locomotion.templateGait,
		note: null
	};
	if (actionId === "melee") {
		const verbs = templateMelees(card.template.id), alias = MELEE_ALIAS[card.template.id] ?? {};
		const w = card.weapons.map((x) => alias[x] ?? x).find((x) => verbs.includes(x));
		if (!w) throw Error(`motion: no admitted ${card.template.id} melee for weapons [${card.weapons.join(",")}]`);
		return {
			id: "melee:" + w,
			note: null
		};
	}
	return {
		id: actionId,
		note: null
	};
}
function fnv1a(text) {
	let h = 2166136261;
	for (let i = 0; i < text.length; i++) {
		h ^= text.charCodeAt(i);
		h = Math.imul(h, 16777619) >>> 0;
	}
	return h.toString(16).padStart(8, "0");
}
function sampleKeys(keys, ms) {
	const first = keys[0], last = keys[keys.length - 1];
	if (!first || !last) return 0;
	if (ms <= first.ms) return first.value;
	if (ms >= last.ms) return last.value;
	for (let i = 1; i < keys.length; i++) {
		const a = keys[i - 1], b = keys[i];
		if (ms <= b.ms) {
			const span = b.ms - a.ms;
			return span <= 0 ? b.value : a.value + (b.value - a.value) * EASE_FN[b.ease]((ms - a.ms) / span);
		}
	}
	return last.value;
}
function buildTimeline(card, actionId, seed) {
	const resolved = resolveActionId(card, actionId);
	const authored = actionsFor(card.template.id, card.anatomy)?.[resolved.id];
	if (!authored) throw new Error(`motion: ${card.template.id} has no action "${resolved.id}"`);
	const sprawler = sprawlerAction(card, authored), axial = axialFaintAction(card, sprawler), cast = castAttackAction(card, axial), action = smallCrustaceanAttackAction(card, cast);
	const notes = [
		...card.notes,
		...resolved.note ? [resolved.note] : [],
		...sprawler !== authored ? ["sprawler:low-trunk-v1"] : [],
		...axial !== sprawler ? ["axial-faint:coherent-upper-body-v1"] : [],
		...cast !== axial ? [CAST_ATTACK_NOTE] : [],
		...action !== cast ? ["small-crustacean:observed-foreleg-strike-v1"] : []
	];
	const base = buildActionTimeline(card, action, seed, notes);
	const selected = card.template.id === "quadruped" ? groundedQuadrupedAction(card, action, base, sampleTimeline, (a) => buildActionTimeline(card, a, seed, notes)) : card.template.id === "insect" ? groundedInsectAction(card, action, base, sampleTimeline, (a) => buildActionTimeline(card, a, seed, notes)) : groundedBirdAction(card, action, base, sampleTimeline, (a) => buildActionTimeline(card, a, seed, notes));
	return selected.action === action ? base : buildActionTimeline(card, selected.action, seed, [...notes, selected.note]);
}
/** Shared constructor for ordinary playback and reviewed editor overlays. */
function buildActionTimeline(card, action, seed, notesIn = card.notes) {
	const mass = card.massClass.multiplier, notes = [...notesIn];
	const phases = action.family === "idle" || action.family === "sway" ? [["period", idlePeriodMs(seed, mass)]] : phaseDurations(action.family, mass);
	const bodyMs = phases.reduce((s, [, ms]) => s + ms, 0);
	const clamped = [];
	const tracks = {};
	const joints = ["root", ...card.parts.map((p) => p.joint)];
	for (const joint of joints) {
		const lim = card.bounds.limitsDeg[joint];
		tracks[joint] = [REST_KEY, ...action.poses.map((pose) => {
			let deg = (pose.joints[joint] ?? 0) * (card.amplitudeProfile?.scales[joint] ?? 1) * (card.projectionScales?.[joint] ?? 1);
			if (lim && (deg < lim.min || deg > lim.max)) {
				clamped.push(`${action.id}/${joint}@${pose.t.toFixed(3)}:${deg}`);
				deg = Math.min(lim.max, Math.max(lim.min, deg));
			}
			return {
				ms: pose.t * bodyMs,
				t: pose.t,
				value: deg * DEG * (card.projectionSigns?.[joint] ?? 1),
				ease: pose.ease
			};
		})];
	}
	const rootKeys = (pick) => [REST_KEY, ...action.poses.map((p) => ({
		ms: p.t * bodyMs,
		t: p.t,
		value: p.root[pick] * (action.rootUnit === "motion-scale" ? card.scaleLength / card.bodyLength : 1),
		ease: p.ease
	}))];
	const secondary = [];
	let maxLag = 0;
	for (const part of card.secondaryParts) {
		let prev = [REST_KEY];
		for (const prm of secondaryParams(part, card.realm, card.luminous)) {
			if (action.phaseOwnedJoints?.includes(prm.joint)) continue;
			const own = tracks[prm.joint] ?? [REST_KEY];
			const src = own.some((k) => k.value !== 0) ? own : prev.map((k) => ({
				...k,
				value: k.value * CHAIN_ATTENUATION
			}));
			prev = src;
			const keys = [];
			for (const k of src) {
				keys.push({
					...k,
					ms: k.ms + prm.lagMs,
					t: bodyMs ? (k.ms + prm.lagMs) / bodyMs : 0,
					value: k.value * (1 + prm.overshoot)
				});
				if (prm.overshoot > 0 && k.value !== 0) keys.push({
					ms: k.ms + prm.lagMs * 1.6,
					t: bodyMs ? (k.ms + prm.lagMs * 1.6) / bodyMs : 0,
					value: k.value,
					ease: "sine-in-out"
				});
			}
			if (!action.loop) {
				keys[0] = {
					...keys[0],
					ms: 0,
					t: 0
				};
				keys.push({
					ms: bodyMs + prm.lagMs * 1.6,
					t: 1,
					value: 0,
					ease: "ease-out"
				});
			}
			keys.sort((a, b) => a.ms - b.ms);
			maxLag = Math.max(maxLag, prm.lagMs * 1.6);
			secondary.push({
				...prm,
				keys
			});
		}
	}
	const rule = secondary[0];
	const body = {
		kind: "motion-timeline",
		actionId: action.id,
		family: action.family,
		loop: action.loop,
		seed,
		recipeHash: card.recipeHash,
		massClass: card.massClass.name,
		limitsRad: Object.fromEntries(Object.entries(card.bounds.limitsDeg).map(([j, l]) => [j, card.projectionSigns?.[j] === -1 ? {
			min: -l.max * DEG,
			max: -l.min * DEG
		} : {
			min: l.min * DEG,
			max: l.max * DEG
		}])),
		bodyMs,
		durationMs: action.loop ? bodyMs : bodyMs + maxLag,
		phases,
		tracks,
		root: {
			dx: rootKeys("dx"),
			dy: rootKeys("dy")
		},
		secondary,
		deform: {
			squash: rule?.squash ?? 0,
			stretch: rule?.stretch ?? 0
		},
		hitstopMs: action.family === "melee" ? hitstopMs(mass) : 0,
		luminousPulseMs: card.luminous ? 1800 : 0,
		clamped,
		notes
	};
	const base = {
		...body,
		hash: fnv1a(JSON.stringify(body))
	};
	const envelope = envelopeFor(card, base);
	if (!envelope) return base;
	const adapted = applyStanceEnvelope(base, envelope);
	return {
		...adapted,
		hash: fnv1a(JSON.stringify(adapted))
	};
}
/** Limits apply after easing and material overshoot, in the projected joint basis. */
function boundedJoint(tl, joint, value) {
	const l = tl.limitsRad[joint];
	if (!l || !Number.isFinite(value)) throw Error("motion: invalid joint sample " + joint);
	return Math.max(l.min, Math.min(l.max, value));
}
function sampleTimeline(tl, ms) {
	const at = wrap$1(tl, ms), joints = {};
	for (const [joint, keys] of Object.entries(tl.tracks)) joints[joint] = sampleKeys(keys, at);
	for (const s of tl.secondary) {
		const t = tl.loop ? ((at - s.lagMs) % tl.bodyMs + tl.bodyMs) % tl.bodyMs + s.lagMs : at;
		joints[s.joint] = s.rigid ? sampleKeys(tl.tracks[s.joint] ?? [], at) : sampleKeys(s.keys, t);
	}
	for (const j of Object.keys(joints)) joints[j] = boundedJoint(tl, j, joints[j]);
	const dx = sampleKeys(tl.root.dx, at), dy = sampleKeys(tl.root.dy, at);
	const vx = sampleKeys(tl.root.dx, Math.min(at + 1, tl.durationMs)) - dx, vy = dy - sampleKeys(tl.root.dy, Math.max(at - 1, 0));
	const launch = Math.min(1, Math.max(0, vx / .004)), land = dy >= -.001 ? Math.min(1, Math.max(0, vy / .001)) : 0;
	const stretch = tl.deform.stretch * launch, squash = tl.deform.squash * land;
	return {
		ms: at,
		joints,
		root: {
			dx,
			dy,
			rotation: joints.root ?? 0
		},
		scale: {
			x: 1 + stretch - squash * .5,
			y: 1 - stretch + squash
		}
	};
}
var envelopeCache, EASE_FN, REST_KEY, CHAIN_ATTENUATION, wrap$1;
var init_timeline = __esmMin((() => {
	init_actions();
	init_grounded_bird();
	init_grounded_quadruped();
	init_sprawler_profile();
	init_axial_faint();
	init_cast_attack();
	init_small_crustacean_attack();
	init_grounded_insect();
	init_stance_envelope();
	init_contact_envelope();
	init_family_actions();
	init_secondary();
	init_timing();
	envelopeCache = /* @__PURE__ */ new WeakMap();
	EASE_FN = Object.freeze({
		"ease-out": (t) => 1 - (1 - t) * (1 - t),
		"ease-in": (t) => t * t,
		"back-out": (t) => {
			const s = 1.70158, p = t - 1;
			return p * p * (2.70158 * p + s) + 1;
		},
		"sine-in-out": (t) => -(Math.cos(Math.PI * t) - 1) / 2
	});
	REST_KEY = {
		ms: 0,
		t: 0,
		value: 0,
		ease: "ease-out"
	};
	CHAIN_ATTENUATION = .6;
	wrap$1 = (tl, ms) => tl.loop ? (ms % tl.bodyMs + tl.bodyMs) % tl.bodyMs : Math.min(Math.max(ms, 0), tl.durationMs);
}));
//#endregion
//#region port/v2/apps/game/src/creature-contact-travel.ts
function createContactTravel(keys, bodyLength) {
	if (!Number.isFinite(bodyLength) || bodyLength <= 0 || !keys.length) throw Error("Contact travel: invalid keys/body length");
	const path = [{
		ms: 0,
		value: 0
	}];
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		if (!Number.isFinite(key.ms) || !Number.isFinite(key.value) || key.ms < 0) throw Error("Contact travel: invalid key");
		if (i === 0 && key.ms === 0) {
			if (key.value !== 0) throw Error("Contact travel: nonzero rest");
			continue;
		}
		const previous = path[path.length - 1], value = key.value * bodyLength;
		if (key.ms <= previous.ms || !Number.isFinite(value) || !Number.isFinite(value - previous.value)) throw Error("Contact travel: invalid ordered displacement");
		path.push({
			ms: key.ms,
			value
		});
	}
	const last = path[path.length - 1];
	return Object.freeze({ sample(elapsedMs) {
		if (!Number.isFinite(elapsedMs) || elapsedMs < 0) throw Error("Contact travel: invalid time");
		for (let i = 1; i < path.length; i++) {
			const a = path[i - 1], b = path[i];
			if (elapsedMs < b.ms) return {
				base: a.value,
				stride: b.value - a.value,
				progress: (elapsedMs - a.ms) / (b.ms - a.ms)
			};
		}
		return {
			base: last.value,
			stride: 0,
			progress: 1
		};
	} });
}
var init_creature_contact_travel = __esmMin((() => {}));
//#endregion
//#region port/v2/apps/game/src/motion/gait-phase.ts
/** Prospective anatomy timing, in normalized cycles. No species branches,
* clocks, inferred support, geometry limits or battle-stage ownership. */
function gaitTiming(template, action, ids) {
	if (![
		"approach:walk",
		"approach:crawl",
		"approach:scuttle"
	].includes(action)) return null;
	const offsets = {};
	if (template === "myriapod") for (const id of ids) {
		const m = /^leg(\d+)(Far|Near)$/.exec(id);
		if (!m) return null;
		offsets[id] = (Number(m[1]) * .2 + (m[2] === "Near" ? .5 : 0)) % 1;
	}
	else if (template === "insect") for (const id of ids) {
		if (!/^leg(Front|Mid|Hind)(Far|Near)$/.test(id)) return null;
		offsets[id] = [
			"legFrontFar",
			"legMidNear",
			"legHindFar"
		].includes(id) ? 0 : .5;
	}
	else if (template === "arachnid") for (const id of ids) {
		const m = /^leg([1-4])(Far|Near)$/.exec(id);
		if (!m) return null;
		offsets[id] = (Number(m[1]) - 1 + (m[2] === "Near" ? 1 : 0)) % 2 * .5;
	}
	else if (template === "biped-bird" || template === "flyer-membrane") for (const id of ids) offsets[id] = id.endsWith("Near") ? 0 : .5;
	else if (template === "primate") {
		const order = {
			legNear: 0,
			armFar: .25,
			legFar: .5,
			armNear: .75
		};
		for (const id of ids) {
			if (order[id] === void 0) return null;
			offsets[id] = order[id];
		}
	} else return null;
	return {
		duty: .65,
		offsets
	};
}
function gaitStep(progress, offset, duty) {
	if (![
		progress,
		offset,
		duty
	].every(Number.isFinite) || duty <= 0 || duty >= 1) throw Error("motion: invalid gait phase");
	const smooth = (t) => t * t * (3 - 2 * t), phase = (u) => u - Math.floor(u), advance = (u) => Math.floor(u) + (phase(u) < duty ? 0 : smooth((phase(u) - duty) / (1 - duty))), u = phase(progress - offset), swing = u >= duty, at = swing ? (u - duty) / (1 - duty) : 0;
	return {
		stance: !swing,
		swing,
		at,
		step: advance(progress - offset) - advance(-offset),
		lift: swing ? Math.sin(Math.PI * at) ** 2 : 0
	};
}
var init_gait_phase = __esmMin((() => {}));
//#endregion
//#region port/v2/apps/game/src/creature-terminal-contact.ts
function createTerminalContactSolver(input) {
	const root = copyPoint(input.root), joint = copyPoint(input.joint), end = copyPoint(input.end), support = copyPoint(input.support), bend = input.bend;
	const chain = createTwoBoneChain({
		root,
		joint,
		end,
		bend
	}), upper = minus(joint, root), lower = minus(end, joint), foot = minus(support, end);
	const lengths = {
		upper: length(upper),
		lower: length(lower),
		terminal: length(foot)
	};
	if (lengths.terminal < KINEMATICS_LIMITS.minSegment) throw Error("Terminal contact: degenerate terminal support");
	const limits = Object.fromEntries([
		"knee",
		"end",
		"terminal"
	].map((name) => {
		const l = input.limits[name];
		if (!l || ![l.min, l.max].every(Number.isFinite) || l.min > l.max) throw Error("Terminal contact: invalid joint limit " + name);
		return [name, Object.freeze({
			min: l.min,
			max: l.max
		})];
	}));
	const boundaries = ["terminal-min", "terminal-max"].map((mode, i) => {
		const terminal = i === 0 ? limits.terminal.min : limits.terminal.max, effective = plus(lower, rotate(foot, terminal)), span = length(effective);
		if (span < KINEMATICS_LIMITS.minSegment) return {
			mode,
			terminal,
			effective,
			solvers: []
		};
		return {
			mode,
			terminal,
			effective,
			solvers: [1, -1].map((branch) => {
				const x = -branch * lengths.upper;
				return {
					branch,
					chain: createTwoBoneChain({
						root: {
							x: 0,
							y: 0
						},
						joint: {
							x,
							y: 0
						},
						end: {
							x,
							y: span
						},
						bend: branch
					})
				};
			})
		};
	});
	return Object.freeze({ solve(sample) {
		const h = copyPoint(sample.root), target = copyPoint(sample.target), parent = sample.parentRotation;
		if (!Number.isFinite(parent)) throw Error("Terminal contact: invalid parent rotation");
		const candidates = [], attempts = [];
		const accept = (mode, branch, knee, ankle, terminal) => {
			const rotations = {
				knee,
				end: ankle,
				terminal
			};
			for (const name of [
				"knee",
				"end",
				"terminal"
			]) {
				const value = rotations[name], l = limits[name];
				if (!Number.isFinite(value) || value < l.min || value > l.max) {
					attempts.push({
						mode,
						branch,
						reason: "joint limit " + name
					});
					return;
				}
			}
			const worldUpper = parent + knee, worldLower = worldUpper + ankle, worldFoot = worldLower + terminal;
			const atRest = h.x === root.x && h.y === root.y && knee === 0 && ankle === 0 && terminal === 0 && parent === 0;
			const k = atRest ? joint : plus(h, rotate(upper, worldUpper)), a = atRest ? end : plus(k, rotate(lower, worldLower)), p = atRest ? support : plus(a, rotate(foot, worldFoot));
			const side = cross(minus(a, h), minus(k, h));
			if (side !== 0 && Math.sign(side) !== bend) {
				attempts.push({
					mode,
					branch,
					reason: "anatomical bend branch"
				});
				return;
			}
			const supportError = length(minus(p, target)), lengthErrors = {
				upper: Math.abs(length(minus(k, h)) - lengths.upper),
				lower: Math.abs(length(minus(a, k)) - lengths.lower),
				terminal: Math.abs(length(minus(p, a)) - lengths.terminal)
			};
			const roundoff = 128 * Number.EPSILON * Math.max(1, ...[
				h,
				k,
				a,
				p,
				target
			].flatMap((q) => [Math.abs(q.x), Math.abs(q.y)]), ...Object.values(lengths));
			if (!Number.isFinite(supportError) || supportError > roundoff || Object.values(lengthErrors).some((e) => !Number.isFinite(e) || e > roundoff)) {
				attempts.push({
					mode,
					branch,
					reason: "analytic reconstruction roundoff"
				});
				return;
			}
			candidates.push(Object.freeze({
				mode,
				rotations: Object.freeze(rotations),
				points: Object.freeze({
					root: h,
					joint: copyPoint(k),
					end: copyPoint(a),
					support: copyPoint(p)
				}),
				footRotation: wrap(worldFoot),
				supportError,
				lengthErrors: Object.freeze(lengthErrors)
			}));
		};
		try {
			const pose = chain.solve(h, minus(target, foot)), worldUpper = angle$1(minus(pose.joint, h)) - angle$1(upper), worldLower = angle$1(minus(pose.end, pose.joint)) - angle$1(lower);
			accept("preferred", bend, wrap(worldUpper - parent), wrap(worldLower - worldUpper), wrap(-worldLower));
		} catch (error) {
			attempts.push({
				mode: "preferred",
				branch: bend,
				reason: String(error)
			});
		}
		for (const boundary of boundaries) {
			if (!boundary.solvers.length) {
				attempts.push({
					mode: boundary.mode,
					branch: bend,
					reason: "degenerate effective support vector"
				});
				continue;
			}
			for (const alternative of boundary.solvers) try {
				const pose = alternative.chain.solve(h, target), worldUpper = angle$1(minus(pose.joint, h)) - angle$1(upper), worldLower = angle$1(minus(target, pose.joint)) - angle$1(boundary.effective);
				accept(boundary.mode, alternative.branch, wrap(worldUpper - parent), wrap(worldLower - worldUpper), boundary.terminal);
			} catch (error) {
				attempts.push({
					mode: boundary.mode,
					branch: alternative.branch,
					reason: String(error)
				});
			}
		}
		const rank = {
			"preferred": 0,
			"terminal-min": 1,
			"terminal-max": 2
		};
		candidates.sort((a, b) => a.mode === "preferred" ? -1 : b.mode === "preferred" ? 1 : Math.abs(a.footRotation) - Math.abs(b.footRotation) || rank[a.mode] - rank[b.mode]);
		const all = Object.freeze(candidates), diagnostics = Object.freeze(attempts), first = all[0];
		return first ? Object.freeze({
			...first,
			status: "solved",
			candidates: all,
			attempts: diagnostics
		}) : Object.freeze({
			status: "refused",
			reason: "no-admitted-candidate",
			candidates: all,
			attempts: diagnostics
		});
	} });
}
var wrap, minus, plus, rotate, angle$1, length, cross, copyPoint;
var init_creature_terminal_contact = __esmMin((() => {
	init_kinematics();
	wrap = (x) => {
		const a = Math.atan2(Math.sin(x), Math.cos(x));
		return a === 0 ? 0 : a;
	};
	minus = (a, b) => ({
		x: a.x - b.x,
		y: a.y - b.y
	});
	plus = (a, b) => ({
		x: a.x + b.x,
		y: a.y + b.y
	});
	rotate = (v, a) => ({
		x: Math.cos(a) * v.x - Math.sin(a) * v.y,
		y: Math.sin(a) * v.x + Math.cos(a) * v.y
	});
	angle$1 = (v) => Math.atan2(v.y, v.x);
	length = (v) => Math.hypot(v.x, v.y);
	cross = (a, b) => a.x * b.y - a.y * b.x;
	copyPoint = (p) => {
		if (!p || ![p.x, p.y].every(Number.isFinite) || Math.max(Math.abs(p.x), Math.abs(p.y)) > KINEMATICS_LIMITS.maxCoordinate) throw Error("Terminal contact: invalid point");
		return Object.freeze({
			x: p.x,
			y: p.y
		});
	};
}));
//#endregion
//#region port/v2/apps/game/src/creature-terminal-support.ts
function terminalPaintedSupport(record, binding, chain, pad) {
	const skin = binding.paintSkin, owner = binding.parts.find((p) => p.joint === chain.terminal && p.kind === "part"), part = skin.parts.find((p) => p.id === owner?.id);
	if (!chain.terminal || !part) throw Error("Contact pad: missing terminal surface " + chain.end);
	const w = record.geometry.width, h = record.geometry.height, pins = new Set(skin.solver?.pins ?? []);
	const rendered = part.vertices.map((v) => {
		const p = [0, 0];
		for (let k = 0; k < 3; k++) {
			const q = skin.vertices[v.triangle[k]];
			p[0] += q.x / w * v.barycentric[k];
			p[1] += q.y / h * v.barycentric[k];
		}
		return p;
	});
	for (let i = 0; i < part.indices.length; i += 3) {
		const indices = part.indices.slice(i, i + 3), [a, b, c] = indices.map((index) => rendered[index]), d = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
		if (d === 0) continue;
		const u = ((b[1] - c[1]) * (pad[0] - c[0]) + (c[0] - b[0]) * (pad[1] - c[1])) / d, v = ((c[1] - a[1]) * (pad[0] - c[0]) + (a[0] - c[0]) * (pad[1] - c[1])) / d, bary = [
			u,
			v,
			1 - u - v
		];
		if (bary.some((n) => n < 0 || n > 1)) continue;
		const contributors = /* @__PURE__ */ new Map();
		for (let k = 0; k < 3; k++) {
			const vertex = part.vertices[indices[k]];
			for (let j = 0; j < 3; j++) {
				const index = vertex.triangle[j], weight = bary[k] * vertex.barycentric[j];
				if (weight !== 0) contributors.set(index, (contributors.get(index) ?? 0) + weight);
			}
		}
		const vertices = [...contributors].filter(([, weight]) => weight !== 0).map(([index, barycentric]) => {
			const vertex = skin.vertices[index];
			return {
				rest: [vertex.x / w, vertex.y / h],
				barycentric,
				weights: vertex.weights.map(([j, n]) => [j, n]),
				index
			};
		});
		if (vertices.some((v) => !pins.has(v.index) || v.weights.length !== 1 || v.weights[0][0] !== chain.terminal || v.weights[0][1] !== 1)) continue;
		const rest = [0, 0];
		for (const p of vertices) {
			rest[0] += p.rest[0] * p.barycentric;
			rest[1] += p.rest[1] * p.barycentric;
		}
		if (Math.hypot(rest[0] - pad[0], rest[1] - pad[1]) > 1e-12) throw Error("Contact pad: source interpolation mismatch");
		return {
			rest: pad,
			pivotJoint: chain.terminal,
			surface: {
				partId: part.id,
				triangle: indices,
				barycentric: bary
			},
			vertices: vertices.map(({ index, ...vertex }) => vertex)
		};
	}
	throw Error("Contact pad: authored point lacks a rigid pinned terminal surface " + chain.end);
}
var init_creature_terminal_support = __esmMin((() => {}));
//#endregion
//#region port/v2/apps/game/src/creature-rig-contact.ts
/** Exact per-vertex LBS, then interpolation at the observed painted support.
* Spatially varying weights must never be collapsed onto a common rest point. */
function predictContactSupport(support, matrices) {
	let x = 0, y = 0;
	for (const vertex of support.vertices) for (const [joint, weight] of vertex.weights) {
		const m = matrices[joint];
		if (!m) throw Error("Contact: missing support matrix " + joint);
		const p = transformPoint(m, point(vertex.rest));
		x += vertex.barycentric * weight * p.x;
		y += vertex.barycentric * weight * p.y;
	}
	return {
		x,
		y
	};
}
/** Source-owned painted vertices sampled independently of the skeleton endpoint.
* Reads the binding; does not change source landmarks, skin weights, pins or joins. */
function observedContactSupports(record, binding) {
	const skin = binding.paintSkin;
	if (!skin || binding.recordRecipeHash !== record.recipeHash) throw Error("Contact: source-bound painted skin required");
	const supports = {}, chains = familyContactChains(familyContractForRecord(record)), pads = validateTerminalContactPads(record, chains);
	for (const chain of chains) {
		if (pads) {
			supports[chain.end] = terminalPaintedSupport(record, binding, chain, pads.points[chain.end]);
			continue;
		}
		const owner = binding.parts.find((p) => p.joint === chain.end), part = skin.parts.find((p) => p.id === owner?.id), end = record.landmarks[chain.end];
		if (!part) throw Error("Contact: missing painted surface " + chain.end);
		const best = selectPaintedContactVertex(skin.vertices, part, end, record.geometry.width, record.geometry.height);
		if (!best) throw Error("Contact: empty painted surface " + chain.end);
		const v = best.vertex;
		supports[chain.end] = {
			rest: best.rest,
			surface: {
				partId: part.id,
				vertexIndex: best.vertexIndex
			},
			vertices: v.triangle.map((index, k) => {
				const vertex = skin.vertices[index];
				return {
					rest: [vertex.x / record.geometry.width, vertex.y / record.geometry.height],
					barycentric: v.barycentric[k],
					weights: vertex.weights.map(([j, w]) => [j, w])
				};
			})
		};
	}
	return Object.freeze(supports);
}
/** Source graph contacts for stance and alternating support. Elapsed phase is
* explicit and replayable; rendering cadence is not solver state. */
function createFamilyContactSolver(record, paintedSupports = {}) {
	const template = familyContractForRecord(record), program = createSkeletonPoseProgram(template, record.landmarks), padDeclaration = validateTerminalContactPads(record, familyContactChains(template));
	if (padDeclaration && !Object.keys(paintedSupports).length) throw Error("Contact pad: observed painted supports required");
	const chains = familyContactChains(template).map((c) => {
		const root = template.fixedPivots?.[c.knee] ? program.pivot(c.knee) : point(record.landmarks[c.hip]), joint = point(record.landmarks[c.knee]), end = point(record.landmarks[c.end]);
		const cross = (end.x - root.x) * (joint.y - root.y) - (end.y - root.y) * (joint.x - root.x);
		if (Math.abs(cross) < 1e-12) throw Error("Contact: source bend direction missing " + c.id);
		const declaration = paintedSupports[c.end] ?? record.landmarks[c.end];
		const model = "rest" in declaration ? declaration : {
			rest: declaration,
			vertices: [{
				rest: declaration,
				barycentric: 1,
				weights: [[c.end, 1]]
			}]
		}, support = model.rest;
		if (support.length !== 2 || support.some((v) => !Number.isFinite(v) || v < 0 || v > 1)) throw Error("Contact: invalid painted support " + c.end);
		if (!model.vertices.length || model.vertices.length > (padDeclaration ? 9 : 3) || Math.abs(model.vertices.reduce((s, v) => s + v.barycentric, 0) - 1) > 1e-8) throw Error("Contact: invalid support interpolation " + c.end);
		for (const v of model.vertices) if (v.rest.length !== 2 || v.rest.some((n) => !Number.isFinite(n) || n < 0 || n > 1) || !Number.isFinite(v.barycentric) || v.barycentric < -1e-8 || !v.weights.length || new Set(v.weights.map(([j]) => j)).size !== v.weights.length || v.weights.some(([j, w]) => !Object.hasOwn(record.landmarks, j) || !Number.isFinite(w) || w <= 0) || Math.abs(v.weights.reduce((s, [, w]) => s + w, 0) - 1) > 1e-8) throw Error("Contact: invalid support weights " + c.end);
		const endpointOnly = model.vertices.every((v) => v.barycentric === 0 || v.weights.length === 1 && v.weights[0][0] === c.end && v.weights[0][1] === 1);
		if (padDeclaration && (!c.terminal || model.rest[0] !== padDeclaration.points[c.end][0] || model.rest[1] !== padDeclaration.points[c.end][1] || !model.surface || model.pivotJoint !== c.terminal || !model.vertices.every((v) => v.barycentric === 0 || v.weights.length === 1 && v.weights[0][0] === c.terminal && v.weights[0][1] === 1))) throw Error("Contact pad: exact terminal-rigid support required " + c.end);
		if (!padDeclaration && model.pivotJoint) throw Error("Contact pad: undeclared terminal support");
		const terminalSolver = padDeclaration ? createTerminalContactSolver({
			root,
			joint,
			end,
			support: point(support),
			bend: cross < 0 ? -1 : 1,
			limits: Object.fromEntries([
				["knee", c.knee],
				["end", c.end],
				["terminal", c.terminal]
			].map(([key, joint]) => {
				const l = (template.contactLimitsDeg ?? template.limitsDeg)[joint];
				return [key, {
					min: l.min * Math.PI / 180,
					max: l.max * Math.PI / 180
				}];
			}))
		}) : null;
		return {
			...c,
			root,
			joint,
			endPoint: end,
			support: point(support),
			model,
			endpointOnly,
			terminalSolver,
			offset: {
				x: support[0] - end.x,
				y: support[1] - end.y
			},
			chain: createTwoBoneChain({
				root,
				joint,
				end,
				bend: cross < 0 ? -1 : 1
			})
		};
	});
	if (Object.keys(paintedSupports).length && (Object.keys(paintedSupports).length !== chains.length || chains.some((c) => !Object.hasOwn(paintedSupports, c.end)))) throw Error("Contact: exact painted support inventory required");
	const swingLift = template.contactStance?.swingLift;
	if (template.contactStance && Object.hasOwn(template.contactStance, "swingLift") && (swingLift !== "toward-socket" || template.id !== "myriapod" || template.anatomyModel !== "myriapod-rigid-trunk-v1" || !template.fixedPivots || chains.some((c) => !Object.hasOwn(template.fixedPivots, c.knee)))) throw Error("Contact: invalid swing lift declaration");
	const travelSubsteps = template.contactStance?.travelSubsteps;
	if (template.contactStance && Object.hasOwn(template.contactStance, "travelSubsteps") && (template.id !== "myriapod" || template.anatomyModel !== "myriapod-rigid-trunk-v1" || !travelSubsteps || typeof travelSubsteps !== "object" || Array.isArray(travelSubsteps) || ![Object.prototype, null].includes(Object.getPrototypeOf(travelSubsteps)) || !Reflect.ownKeys(travelSubsteps).length || Reflect.ownKeys(travelSubsteps).some((id) => id !== "hit" && id !== "dodge" && id !== "tame" || travelSubsteps[id] !== 2 || template.contactStance?.travel?.[id] !== "source-steps"))) throw Error("Contact: invalid travel substeps declaration");
	const declaredHind = template.contactStance?.hind, hasDeclaredHind = !!template.contactStance && Object.hasOwn(template.contactStance, "hind");
	if (hasDeclaredHind && (!Array.isArray(declaredHind) || !declaredHind.length || new Set(declaredHind).size !== declaredHind.length || declaredHind.some((id) => typeof id !== "string" || !template.legs.includes(id) || !chains.some((c) => c.id === id)))) throw Error("Contact: invalid declared hind support group");
	const hindGroup = hasDeclaredHind ? new Set(declaredHind) : null;
	const scaleLength = measureMotionScale(template, record.landmarks).length;
	const stride = chains.length ? Math.min(...chains.map((c) => c.chain.lengths.upper + c.chain.lengths.lower)) * .04 : 0;
	const direction = template.id === "brachyuran" ? Math.sign(record.landmarks.leg0NearRoot[0] - record.landmarks.leg0FarRoot[0]) : 1;
	const hasOffset = chains.some((c) => c.offset.x !== 0 || c.offset.y !== 0 || !c.endpointOnly);
	const supportCandidateChains = /* @__PURE__ */ new Map();
	const travelPlans = /* @__PURE__ */ new Map();
	const travelFor = (phase, weight) => {
		if (phase.travel === "stage" || template.contactStance?.travel?.[phase.actionId] !== "source-steps") return null;
		let plan = travelPlans.get(phase.actionId);
		if (!plan) {
			const source = record;
			const card = compileBodyCard(source, source.genome), timeline = buildTimeline(card, phase.actionId, card.identity.seed);
			if (timeline.loop) throw Error("Contact: source-step travel requires a nonloop timeline");
			plan = {
				timeline,
				path: createContactTravel(timeline.root.dx, program.bodyLength)
			};
			travelPlans.set(phase.actionId, plan);
		}
		if (phase.durationMs !== plan.timeline.durationMs) return null;
		const at = plan.path.sample(phase.elapsedMs);
		const step = phase.elapsedMs >= plan.timeline.durationMs && weight < 1 && at.base !== 0 ? {
			base: at.base,
			stride: -at.base,
			progress: 1 - weight
		} : at;
		const authoredDx = sampleKeys(plan.timeline.root.dx, phase.elapsedMs) * weight;
		if ((phase.actionId === "hit" || phase.actionId === "dodge" || phase.actionId === "tame") && travelSubsteps?.[phase.actionId] === 2 && step.stride !== 0) {
			const rootDisplacement = step.base + step.stride * step.progress, half = step.stride / 2, doubled = step.progress * 2, index = doubled < 1 ? 0 : 1;
			return {
				base: step.base + half * index,
				stride: half,
				progress: doubled - index,
				rootDisplacement,
				authoredDx
			};
		}
		return {
			...step,
			authoredDx
		};
	};
	return {
		chains,
		scaleLength,
		stride,
		resolve(input, phase) {
			if (!Number.isFinite(phase.elapsedMs) || phase.elapsedMs < 0 || !Number.isFinite(phase.durationMs) || phase.durationMs <= 0) throw Error("Contact: invalid phase");
			if (phase.travel !== void 0 && phase.travel !== "solver" && phase.travel !== "stage") throw Error("Contact: invalid travel owner");
			if (phase.travel === "stage" && phase.stageDisplacement !== void 0 && !Number.isFinite(phase.stageDisplacement)) throw Error("Contact: invalid stage displacement");
			if (phase.travel === "stage") input = {
				...input,
				root: {
					rotation: 0,
					...input.root,
					dx: 0
				}
			};
			const free = /:(flight|fly|swim|jet|hop|leap|climb)$/.test(phase.actionId) || phase.actionId === "melee:kick" || phase.realm === "aquatic" || phase.realm === "aerial" || phase.realm === "gas-giant";
			const stance = contactStanceForAction(template, phase.actionId), selected = free || stance === "none" ? [] : chains.filter((c) => stance === "all" || (hindGroup ? hindGroup.has(c.id) : c.id.startsWith("hind") || c.id.startsWith("legHind")));
			if (!free && stance === "hind" && !selected.length) throw Error("Contact: declared hind stance has no chains");
			const gaitPolicy = template.contactStance?.gaits?.[phase.actionId], cycleAt = phase.elapsedMs / phase.durationMs % 1;
			const timing = gaitTiming(template.id, phase.actionId, chains.map((c) => c.id));
			const activeChains = timing || !gaitPolicy ? selected : gaitPolicy === "bounding" && (input.spine?.rotation ?? 0) < 0 ? selected.filter((c) => c.id.startsWith("hind")) : selected.filter((c) => !(c.group === 1 ? cycleAt < .5 : cycleAt >= .5));
			if (template.contactStance) {
				for (const c of chains) if (!activeChains.includes(c)) for (const j of [
					c.hip,
					c.knee,
					c.end,
					...c.terminal ? [c.terminal] : []
				]) {
					const v = input[j];
					if (!v) continue;
					const l = template.limitsDeg[j], deg = v.rotation * 180 / Math.PI;
					if (deg < l.min - 1e-7 || deg > l.max + 1e-7) throw Error("Contact: raw clip joint limit " + j + " " + phase.actionId + "@" + phase.elapsedMs + ": " + deg);
				}
			}
			if (!activeChains.length) {
				program.evaluate(input);
				return {
					pose: input,
					contacts: [],
					maxError: 0
				};
			}
			const weight = phase.weight ?? 1;
			if (!Number.isFinite(weight) || weight < 0 || weight > 1) throw Error("Contact: invalid blend weight");
			const sourceTravel = travelFor(phase, weight), gait = !!sourceTravel || /^approach:(walk|trot|gallop|crawl|scuttle)$/.test(phase.actionId);
			const pose = Object.fromEntries(Object.entries(input).map(([j, k]) => [j, { ...k }]));
			for (const c of activeChains) if (template.legs.some((id) => c.hip === id + "Root")) pose[c.hip] = { rotation: 0 };
			const progress = sourceTravel?.progress ?? phase.elapsedMs / phase.durationMs, cycle = sourceTravel ? progress : progress % 1, completed = Math.floor(progress);
			const smooth = (v) => v * v * (3 - 2 * v);
			if (gait) pose.root = {
				rotation: 0,
				...pose.root,
				dx: sourceTravel ? (sourceTravel.rootDisplacement ?? sourceTravel.base + sourceTravel.stride * progress) / program.bodyLength + (pose.root?.dx ?? 0) - sourceTravel.authoredDx : phase.travel === "stage" ? 0 : direction * stride * progress / program.bodyLength
			};
			const contacts = activeChains.map((c) => {
				const bodyPlanted = phase.travel === "stage" && record.anatomy?.schema === "cf.anatomy-presence/v2" && record.anatomy.folded?.includes(c.id) === true;
				const scheduled = timing ? gaitStep(progress, timing.offsets[c.id], timing.duty) : null;
				const swing = !bodyPlanted && gait && (scheduled ? scheduled.swing : !gaitPolicy && (!sourceTravel || sourceTravel.stride !== 0 && progress < 1) && (c.group === 1 ? cycle < .5 : cycle >= .5)), at = swing ? scheduled ? scheduled.at : c.group === 1 ? cycle * 2 : (cycle - .5) * 2 : 0;
				const step = scheduled ? scheduled.step - completed : c.group === 1 ? cycle < .5 ? smooth(cycle * 2) : 1 : cycle < .5 ? 0 : smooth((cycle - .5) * 2);
				const lift = c.chain.lengths.lower * .15 * weight;
				const target = {
					x: c.endPoint.x + (sourceTravel ? sourceTravel.base + sourceTravel.stride * step : gait && phase.travel !== "stage" ? direction * stride * (completed + step) : 0) - (swing ? Math.sign(c.endPoint.x - c.root.x) * c.chain.lengths.lower * .1 * Math.sin(Math.PI * at) ** 2 * weight : 0),
					y: swingLift === "toward-socket" ? c.endPoint.y + Math.sign(c.root.y - c.endPoint.y) * (swing ? Math.sin(Math.PI * at) ** 2 * lift : 0) : c.endPoint.y - (swing ? Math.sin(Math.PI * at) ** 2 * lift : 0)
				};
				if (!swing && !bodyPlanted && phase.travel === "stage" && phase.stageDisplacement !== void 0) target.x -= phase.stageDisplacement * scaleLength;
				return {
					joint: c.end,
					target,
					endpointTarget: { ...target },
					paintedTarget: {
						x: target.x + c.offset.x,
						y: target.y + c.offset.y
					},
					stance: !swing,
					...bodyPlanted ? { space: "body" } : {}
				};
			});
			if (padDeclaration) {
				let matrices = program.evaluate(pose), compression = 0;
				for (let i = 0; i < activeChains.length; i++) {
					const c = activeChains[i], target = contacts[i].paintedTarget, parent = matrices[c.hip], root = transformPoint(parent, c.root);
					if (c.terminalSolver.solve({
						root,
						target,
						parentRotation: Math.atan2(parent[1], parent[0])
					}).status === "solved") continue;
					const ankle = {
						x: target.x - c.offset.x,
						y: target.y - c.offset.y
					}, dx = ankle.x - root.x, max = c.chain.lengths.upper + c.chain.lengths.lower;
					if (Math.hypot(dx, ankle.y - root.y) <= max) continue;
					if (Math.abs(dx) >= max || ankle.y < root.y) throw Error("Contact pad: " + phase.actionId + "@" + phase.elapsedMs + " " + c.id + " outside accommodatable reach");
					compression = Math.max(compression, ankle.y - Math.sqrt(max * max - dx * dx) + 1e-10 - root.y);
				}
				if (compression > scaleLength * .08) throw Error("Contact pad: exceeds scale compression bound");
				if (compression > 0) {
					pose.root = {
						rotation: 0,
						...pose.root,
						dy: (pose.root?.dy ?? 0) + compression / program.bodyLength
					};
					matrices = program.evaluate(pose);
				}
				const padModes = {};
				for (let i = 0; i < activeChains.length; i++) {
					const c = activeChains[i], contact = contacts[i], parent = matrices[c.hip], root = transformPoint(parent, c.root), solved = c.terminalSolver.solve({
						root,
						target: contact.paintedTarget,
						parentRotation: Math.atan2(parent[1], parent[0])
					});
					if (solved.status !== "solved") throw Error("Contact pad: " + phase.actionId + "@" + phase.elapsedMs + " " + c.id + " no admitted candidate " + JSON.stringify(solved.attempts));
					pose[c.knee] = { rotation: solved.rotations.knee };
					pose[c.end] = { rotation: solved.rotations.end };
					pose[c.terminal] = { rotation: solved.rotations.terminal };
					contact.endpointTarget = { ...solved.points.end };
					padModes[c.end] = solved.mode;
				}
				const final = program.evaluate(pose);
				let maxError = 0, maxPaintTargetErrorPx = 0;
				for (let i = 0; i < activeChains.length; i++) {
					const c = activeChains[i], contact = contacts[i];
					for (const j of [
						c.knee,
						c.end,
						c.terminal
					]) {
						const l = (template.contactLimitsDeg ?? template.limitsDeg)[j], deg = pose[j].rotation * 180 / Math.PI;
						if (deg < l.min - 1e-7 || deg > l.max + 1e-7) throw Error("Contact pad: joint limit " + j);
					}
					const endpoint = transformPoint(final[c.end], c.endPoint), paint = predictContactSupport(c.model, final);
					maxError = Math.max(maxError, Math.hypot(endpoint.x - contact.endpointTarget.x, endpoint.y - contact.endpointTarget.y));
					maxPaintTargetErrorPx = Math.max(maxPaintTargetErrorPx, Math.hypot((paint.x - contact.paintedTarget.x) * record.geometry.width, (paint.y - contact.paintedTarget.y) * record.geometry.height));
				}
				if (maxError > 1e-8) throw Error("Contact pad: unresolved endpoint");
				if (maxPaintTargetErrorPx > .25) throw Error("Contact pad: painted support residual " + maxPaintTargetErrorPx);
				return {
					pose,
					contacts,
					maxError,
					compression,
					maxPaintTargetErrorPx,
					padModes
				};
			}
			const uncompressedRoot = pose.root;
			let compression = 0, final = program.evaluate(pose);
			const rigidEligible = hasOffset && activeChains.every((c) => c.endpointOnly), candidateEligible = hasOffset;
			const recoverIterativeRefusal = candidateEligible && (!!template.contactStance?.travel || template.id === "insect" && rigidEligible);
			const candidateBaseline = rigidEligible ? null : { ...pose };
			let iterativeFailure;
			try {
				for (let pass = 0; pass <= (hasOffset ? 3 : 0); pass++) {
					if (pass) for (let i = 0; i < activeChains.length; i++) {
						const c = activeChains[i], contact = contacts[i], m = final[c.end];
						if (c.endpointOnly) contact.endpointTarget = {
							x: contact.paintedTarget.x - m[0] * c.offset.x - m[2] * c.offset.y,
							y: contact.paintedTarget.y - m[1] * c.offset.x - m[3] * c.offset.y
						};
						else {
							const predicted = predictContactSupport(c.model, final);
							contact.endpointTarget = {
								x: contact.endpointTarget.x + (contact.paintedTarget.x - predicted.x),
								y: contact.endpointTarget.y + (contact.paintedTarget.y - predicted.y)
							};
						}
					}
					let matrices = program.evaluate(pose), shift = 0;
					for (let i = 0; i < activeChains.length; i++) {
						const c = activeChains[i], target = contacts[i].endpointTarget, root = transformPoint(matrices[c.hip], c.root), dx = target.x - root.x, max = c.chain.lengths.upper + c.chain.lengths.lower;
						if (Math.hypot(dx, target.y - root.y) <= max) continue;
						if (Math.abs(dx) >= max || target.y < root.y) throw Error("Contact: " + phase.actionId + "@" + phase.elapsedMs + " " + c.id + " outside accommodatable reach");
						shift = Math.max(shift, target.y - Math.sqrt(max * max - dx * dx) + 1e-10 - root.y);
					}
					if (compression + shift > scaleLength * .08) throw Error("Contact: " + phase.actionId + "@" + phase.elapsedMs + " exceeds scale compression bound");
					if (shift > 0) {
						compression += shift;
						pose.root = {
							rotation: 0,
							...pose.root,
							dy: (pose.root?.dy ?? 0) + shift / program.bodyLength
						};
						matrices = program.evaluate(pose);
					}
					for (let i = 0; i < activeChains.length; i++) {
						const c = activeChains[i], target = contacts[i].endpointTarget, parent = matrices[c.hip], root = transformPoint(parent, c.root);
						let solved;
						try {
							solved = c.chain.solve(root, target);
						} catch (error) {
							throw Error("Contact: " + phase.actionId + "@" + phase.elapsedMs + " " + c.id + " " + String(error));
						}
						const upper = wrapped(angle(solved.root, solved.joint) - angle(c.root, c.joint));
						const lower = wrapped(angle(solved.joint, solved.end) - angle(c.joint, c.endPoint));
						pose[c.knee] = { rotation: wrapped(upper - Math.atan2(parent[1], parent[0])) };
						pose[c.end] = { rotation: wrapped(lower - upper) };
						if (c.terminal) pose[c.terminal] = { rotation: wrapped(-lower) };
					}
					final = program.evaluate(pose);
				}
			} catch (error) {
				if (!recoverIterativeRefusal) throw error;
				iterativeFailure = error;
			}
			const measure = () => {
				let maxError = 0, maxPaintTargetErrorPx = 0;
				for (let i = 0; i < activeChains.length; i++) {
					const c = activeChains[i], contact = contacts[i];
					for (const j of [
						c.knee,
						c.end,
						...c.terminal ? [c.terminal] : []
					]) {
						const l = (template.contactLimitsDeg ?? template.limitsDeg)[j], deg = pose[j].rotation * 180 / Math.PI;
						if (deg < l.min - 1e-7 || deg > l.max + 1e-7) throw Error("Contact: joint limit " + j + " " + phase.actionId + "@" + phase.elapsedMs + ": " + deg);
					}
					const p = transformPoint(final[c.end], c.endPoint), paint = c.endpointOnly ? transformPoint(final[c.end], c.support) : predictContactSupport(c.model, final);
					maxError = Math.max(maxError, Math.hypot(p.x - contact.endpointTarget.x, p.y - contact.endpointTarget.y));
					maxPaintTargetErrorPx = Math.max(maxPaintTargetErrorPx, Math.hypot((paint.x - contact.paintedTarget.x) * record.geometry.width, (paint.y - contact.paintedTarget.y) * record.geometry.height));
				}
				if (maxError > 1e-8) throw Error("Contact: unresolved endpoint");
				return {
					maxError,
					maxPaintTargetErrorPx
				};
			};
			let measured = {
				maxError: 0,
				maxPaintTargetErrorPx: Infinity
			};
			if (iterativeFailure === void 0) try {
				measured = measure();
			} catch (error) {
				if (!recoverIterativeRefusal) throw error;
				iterativeFailure = error;
			}
			if ((iterativeFailure !== void 0 || measured.maxPaintTargetErrorPx > .25) && candidateEligible) try {
				if (candidateBaseline) {
					for (const joint of Object.keys(pose)) delete pose[joint];
					Object.assign(pose, candidateBaseline);
				}
				const supportKind = rigidEligible ? "rigid support" : "support candidate";
				const rigid = activeChains.map((c) => {
					let chain = supportCandidateChains.get(c.id);
					if (!chain) {
						const cross = (c.support.x - c.root.x) * (c.joint.y - c.root.y) - (c.support.y - c.root.y) * (c.joint.x - c.root.x);
						chain = createTwoBoneChain({
							root: c.root,
							joint: c.joint,
							end: c.support,
							bend: cross < 0 ? -1 : 1
						});
						supportCandidateChains.set(c.id, chain);
					}
					return chain;
				});
				if (uncompressedRoot) pose.root = uncompressedRoot;
				else delete pose.root;
				let matrices = program.evaluate(pose), shift = 0;
				for (let i = 0; i < activeChains.length; i++) {
					const c = activeChains[i], target = contacts[i].paintedTarget, root = transformPoint(matrices[c.hip], c.root), dx = target.x - root.x, max = rigid[i].lengths.upper + rigid[i].lengths.lower;
					if (Math.hypot(dx, target.y - root.y) <= max) continue;
					if (Math.abs(dx) >= max || target.y < root.y) throw Error("Contact: " + phase.actionId + "@" + phase.elapsedMs + " " + c.id + " " + supportKind + " outside accommodatable reach");
					shift = Math.max(shift, target.y - Math.sqrt(max * max - dx * dx) + 1e-10 - root.y);
				}
				if (shift > scaleLength * .08) throw Error("Contact: " + phase.actionId + "@" + phase.elapsedMs + " " + supportKind + " exceeds scale compression bound");
				compression = shift;
				if (shift > 0) {
					pose.root = {
						rotation: 0,
						...pose.root,
						dy: (pose.root?.dy ?? 0) + shift / program.bodyLength
					};
					matrices = program.evaluate(pose);
				}
				for (let i = 0; i < activeChains.length; i++) {
					const c = activeChains[i], contact = contacts[i], parent = matrices[c.hip], root = transformPoint(parent, c.root), solved = rigid[i].solve(root, contact.paintedTarget);
					const upper = wrapped(angle(solved.root, solved.joint) - angle(c.root, c.joint));
					const lower = wrapped(angle(solved.joint, solved.end) - angle(c.joint, c.support));
					pose[c.knee] = { rotation: wrapped(upper - Math.atan2(parent[1], parent[0])) };
					pose[c.end] = { rotation: wrapped(lower - upper) };
					if (c.terminal) pose[c.terminal] = { rotation: wrapped(-lower) };
					const dx = c.endPoint.x - c.joint.x, dy = c.endPoint.y - c.joint.y, cos = Math.cos(lower), sin = Math.sin(lower);
					contact.endpointTarget = {
						x: solved.joint.x + cos * dx - sin * dy,
						y: solved.joint.y + sin * dx + cos * dy
					};
				}
				final = program.evaluate(pose);
				measured = measure();
				if (!rigidEligible && measured.maxPaintTargetErrorPx > .25) throw Error("Contact: painted support candidate residual " + measured.maxPaintTargetErrorPx);
			} catch (error) {
				if (iterativeFailure !== void 0) {
					if (iterativeFailure instanceof Error) iterativeFailure.cause = error;
					throw iterativeFailure;
				}
				throw error;
			}
			if (measured.maxPaintTargetErrorPx > .25) throw Error("Contact: painted support iteration residual " + measured.maxPaintTargetErrorPx);
			return {
				pose,
				contacts,
				maxError: measured.maxError,
				compression,
				maxPaintTargetErrorPx: measured.maxPaintTargetErrorPx
			};
		}
	};
}
var point, angle, wrapped;
var init_creature_rig_contact = __esmMin((() => {
	init_painted_contact_selector();
	init_motion_scale();
	init_family_contracts();
	init_skeleton_pose();
	init_body_card();
	init_timeline();
	init_creature_contact_travel();
	init_gait_phase();
	init_creature_terminal_contact();
	init_creature_terminal_support();
	init_terminal_contact_pads();
	init_quadruped_template();
	init_kinematics();
	point = (p) => ({
		x: p[0],
		y: p[1]
	});
	angle = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
	wrapped = (a) => Math.atan2(Math.sin(a), Math.cos(a));
}));
//#endregion
//#region port/v2/apps/game/src/motion/painted-supports.ts
/** Returns a new frozen card carrying `paintedContactSupports`. Throws on any identity disagreement: the card, record and binding must
* describe the same recipe. Mixed per-vertex skin weights are preserved exactly (the object is the one the runtime computes). */
function withPaintedContactSupports(card, record, binding) {
	if (!card.recipeHash) throw new Error("Painted supports: the card has no recipe hash");
	if (record.recipeHash !== card.recipeHash) throw new Error("Painted supports: record recipe disagrees with the card");
	if (binding.recordRecipeHash !== card.recipeHash) throw new Error("Painted supports: binding recipe disagrees with the card");
	if (typeof binding.bindingHash !== "string" || !binding.bindingHash) throw new Error("Painted supports: binding identity missing");
	const supports = observedContactSupports(record, binding);
	return Object.freeze({
		...card,
		paintedContactSupports: Object.freeze({
			recipeHash: card.recipeHash,
			bindingHash: binding.bindingHash,
			supports
		})
	});
}
var init_painted_supports = __esmMin((() => {
	init_creature_rig_contact();
}));
//#endregion
//#region audits/C202_ARTHROPOD_REFERENCES_20261004/diagnose-hit.ts
var require_diagnose_hit = /* @__PURE__ */ __commonJSMin((() => {
	init_body_card();
	init_painted_supports();
	init_timeline();
	init_family_actions();
	init_creature_rig_contact();
	const read = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
	const record = read("audits/C202_ARTHROPOD_REFERENCES_20261004/11-beetle-relaxed-legs/fit01/record.json");
	const binding = read("audits/C202_ARTHROPOD_REFERENCES_20261004/11-beetle-relaxed-legs/fit01/binding.json");
	const card = withPaintedContactSupports(compileBodyCard(record, record.genome), record, binding);
	const raw = actionsFor("insect", card.anatomy).hit;
	const torso = /* @__PURE__ */ new Set(["root", "thorax"]);
	const scaled = (gain) => ({
		...raw,
		poses: raw.poses.map((p) => ({
			...p,
			joints: Object.fromEntries(Object.entries(p.joints).map(([j, v]) => [j, v * (torso.has(j) ? gain : 1)])),
			root: {
				dx: p.root.dx * gain,
				dy: p.root.dy * gain
			}
		}))
	});
	function probe(gain, samples = 128) {
		const tl = buildActionTimeline(card, scaled(gain), card.identity.seed), modes = [];
		for (const travel of ["solver", "stage"]) {
			const solver = createFamilyContactSolver(record, observedContactSupports(record, binding));
			let maxCompression = 0, refusal = null, checked = 0;
			for (let i = 0; i <= samples; i++) {
				const ms = tl.durationMs * i / samples, p = sampleTimeline(tl, ms), pose = {
					...Object.fromEntries(Object.entries(p.joints).map(([j, rotation]) => [j, { rotation }])),
					root: p.root
				};
				try {
					const r = solver.resolve(pose, {
						actionId: "hit",
						elapsedMs: ms,
						durationMs: tl.durationMs,
						realm: card.realm,
						weight: 1,
						travel
					});
					assert((r.maxError ?? 0) <= 1e-8);
					maxCompression = Math.max(maxCompression, r.compression ?? 0);
					checked++;
				} catch (e) {
					refusal = {
						ms,
						error: String(e).split("\n")[0]
					};
					break;
				}
			}
			modes.push({
				travel,
				checked,
				maxCompression,
				limit: solver.scaleLength * .08,
				refusal
			});
		}
		return {
			gain,
			pass: modes.every((x) => !x.refusal),
			modes
		};
	}
	const probes = [probe(1), probe(0)];
	const zero = probes[1];
	let selected = null;
	if (!probes[0].pass && zero.pass) {
		let low = 0, high = 1;
		for (let i = 0; i < 12; i++) {
			const m = (low + high) / 2, r = probe(m);
			probes.push(r);
			if (r.pass) low = m;
			else high = m;
		}
		const gain = low * .9, r = probe(gain, 480);
		probes.push(r);
		if (gain > 0 && r.pass) selected = {
			gain,
			action: scaled(gain),
			validation: r
		};
	}
	const before = buildActionTimeline(card, raw, card.identity.seed);
	const after = selected ? buildActionTimeline(card, selected.action, card.identity.seed) : null;
	if (after) {
		assert.deepEqual(after.phases, before.phases);
		assert.equal(after.durationMs, before.durationMs);
		assert.deepEqual(after.secondary, before.secondary);
		assert.deepEqual(after.limitsRad, before.limitsRad);
		assert.deepEqual(after.deform, before.deform);
		for (const [j, keys] of Object.entries(before.tracks)) if (!torso.has(j)) assert.deepEqual(after.tracks[j], keys);
	}
	fs.writeFileSync("audits/C202_ARTHROPOD_REFERENCES_20261004/hit-gain-diagnosis.json", JSON.stringify({
		schema: "cf.c202-audit-hit-authoring/v1",
		scope: "Audit-only pure contact proof on actual source-bound supports; not moving paint or native qualification",
		recordRecipeHash: record.recipeHash,
		bindingHash: binding.bindingHash,
		masterSha256: record.geometry.cutoutAssetHash,
		probes,
		selected,
		preserved: [
			"all non-torso tracks",
			"secondary curves",
			"limits",
			"deform",
			"timing",
			"phase inventory"
		],
		productChanged: false
	}, null, 2) + "\n", { flag: "wx" });
	console.log(JSON.stringify({
		selectedGain: selected?.gain ?? null,
		original: probes[0],
		zero: probes[1],
		final: selected?.validation ?? null
	}));
}));
//#endregion
export default require_diagnose_hit();
export {};
