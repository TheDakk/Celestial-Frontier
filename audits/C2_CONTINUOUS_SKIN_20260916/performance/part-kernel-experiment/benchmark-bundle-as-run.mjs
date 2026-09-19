//#region port/v2/tools/creature-animation/kinematics.ts
const IDENTITY_AFFINE = Object.freeze([
	1,
	0,
	0,
	1,
	0,
	0
]);
const KINEMATICS_LIMITS = Object.freeze({
	maxCoordinate: 1e6,
	minSegment: 1e-6,
	maxChainPoints: 64,
	maxDurationMs: 6e4,
	maxWaveCycles: 8
});
const ZERO = Object.freeze({
	x: 0,
	y: 0
});
function finite(value, label) {
	if (typeof value !== "number" || !Number.isFinite(value)) throw new TypeError(label + " must be finite");
}
function point$1(value) {
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
	const p = point$1(pivot), move = point$1(offset);
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
const LEGS = Object.freeze([
	"hindFar",
	"foreFar",
	"hindNear",
	"foreNear"
]);
const GRAPH = Object.freeze([
	["pelvis", "root"],
	["spine", "pelvis"],
	["chest", "spine"],
	["neck", "chest"],
	["head", "neck"],
	["jaw", "head"],
	...LEGS.flatMap((id) => [
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
//#endregion
//#region port/v2/apps/game/src/creature-rig-contact.ts
const point = (p) => ({
	x: p[0],
	y: p[1]
});
function poseMatrices(record, pose) {
	const matrices = {}, length = Math.hypot(record.landmarks.chest[0] - record.landmarks.pelvis[0], record.landmarks.chest[1] - record.landmarks.pelvis[1]);
	for (const [name, parent] of [["root", null], ...GRAPH]) {
		const key = pose[name], pivot = point(record.landmarks[parent ?? "root"]);
		const local = key ? rotationAround(pivot, key.rotation, {
			x: (key.dx ?? 0) * length,
			y: (key.dy ?? 0) * length
		}) : IDENTITY_AFFINE;
		matrices[name] = parent ? composeAffine(matrices[parent], local) : local;
	}
	return matrices;
}
//#endregion
//#region port/v2/tools/creature-animation/arap-skin.mjs
/** Allocation-free local/global 2D shape projection. The pose owner supplies all
* targets; this solver neither authors curves nor changes bone transforms.
* Independent anatomical surfaces must supply independent vertex inventories. */
const need = (ok, why) => {
	if (!ok) throw Error("ARAP skin: " + why);
};
function createArapScratch(vertices, triangles, width, height, options = {}) {
	need(Array.isArray(vertices) && vertices.length >= 3 && vertices.length <= 4e4, "vertex budget");
	need(Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0, "dimensions");
	need((Array.isArray(triangles) || ArrayBuffer.isView(triangles)) && triangles.length > 0 && triangles.length % 3 === 0 && triangles.length <= 6e5, "triangle budget");
	const n = vertices.length, rest = new Float64Array(n * 2), adj = Array.from({ length: n }, () => /* @__PURE__ */ new Set()), areas = new Float64Array(triangles.length / 3);
	vertices.forEach((p, i) => {
		need(p && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.y >= 0 && p.x <= width && p.y <= height, "rest vertex");
		rest[i * 2] = p.x;
		rest[i * 2 + 1] = p.y;
	});
	for (let k = 0; k < triangles.length; k += 3) {
		const a = triangles[k], b = triangles[k + 1], c = triangles[k + 2];
		need([
			a,
			b,
			c
		].every((i) => Number.isInteger(i) && i >= 0 && i < n) && a !== b && b !== c && c !== a, "triangle indices");
		const area = (rest[b * 2] - rest[a * 2]) * (rest[c * 2 + 1] - rest[a * 2 + 1]) - (rest[b * 2 + 1] - rest[a * 2 + 1]) * (rest[c * 2] - rest[a * 2]);
		need(Math.abs(area) > 1e-9, "degenerate triangle");
		areas[k / 3] = area;
		for (const [i, j] of [
			[a, b],
			[b, c],
			[c, a]
		]) {
			adj[i].add(j);
			adj[j].add(i);
		}
	}
	need(adj.every((a) => a.size > 0), "unconnected vertex");
	const starts = new Uint32Array(n + 1);
	for (let i = 0; i < n; i++) starts[i + 1] = starts[i] + adj[i].size;
	const neighbours = new Uint32Array(starts[n]), neighbourDofs = new Uint32Array(starts[n]), deltas = new Float64Array(starts[n] * 2);
	for (let i = 0; i < n; i++) {
		let k = starts[i];
		for (const j of [...adj[i]].sort((a, b) => a - b)) {
			neighbours[k] = j;
			neighbourDofs[k] = j * 2;
			deltas[k * 2] = rest[i * 2] - rest[j * 2];
			deltas[k * 2 + 1] = rest[i * 2 + 1] - rest[j * 2 + 1];
			k++;
		}
	}
	const iterations = options.iterations ?? 4, globalIterations = options.globalIterations ?? 4, targetWeight = options.targetWeight ?? .35, orientationIterations = options.orientationIterations ?? 24, minimumAreaRatio = options.minimumAreaRatio ?? .12;
	need(Number.isInteger(iterations) && iterations >= 1 && iterations <= 16 && Number.isInteger(globalIterations) && globalIterations >= 1 && globalIterations <= 32, "iteration budget");
	need(Number.isFinite(targetWeight) && targetWeight > 0 && targetWeight <= 100, "target weight");
	need(Number.isInteger(orientationIterations) && orientationIterations >= 1 && orientationIterations <= 64 && Number.isFinite(minimumAreaRatio) && minimumAreaRatio > 0 && minimumAreaRatio <= .5, "orientation budget");
	const pins = new Uint8Array(n);
	for (const i of options.pins ?? []) {
		need(Number.isInteger(i) && i >= 0 && i < n && !pins[i], "pin");
		pins[i] = 1;
	}
	const freeDofs = Uint32Array.from(Array.from({ length: n }, (_, i) => i).filter((i) => !pins[i]), (i) => i * 2), lambda = new Float64Array(n), divisor = new Float64Array(n);
	for (let i = 0; i < n; i++) {
		const degree = starts[i + 1] - starts[i];
		lambda[i] = degree * targetWeight;
		divisor[i] = degree * (1 + targetWeight);
	}
	const triangleDofs = Uint32Array.from(triangles, (i) => i * 2), triangleSigns = new Int8Array(areas.length), triangleFloors = new Float64Array(areas.length), triangleMovable = new Uint8Array(areas.length);
	for (let k = 0; k < areas.length; k++) {
		triangleSigns[k] = Math.sign(areas[k]);
		triangleFloors[k] = Math.abs(areas[k]) * minimumAreaRatio;
		triangleMovable[k] = (pins[triangles[k * 3]] ? 0 : 1) | (pins[triangles[k * 3 + 1]] ? 0 : 2) | (pins[triangles[k * 3 + 2]] ? 0 : 4);
	}
	let axis = 1, axisDistance = 0;
	for (let i = 1; i < n; i++) {
		const distance = (rest[i * 2] - rest[0]) ** 2 + (rest[i * 2 + 1] - rest[1]) ** 2;
		if (distance > axisDistance) {
			axis = i;
			axisDistance = distance;
		}
	}
	need(axisDistance > 1e-18, "rest axis");
	return {
		n,
		width,
		height,
		rest,
		starts,
		neighbours,
		neighbourDofs,
		deltas,
		pins,
		freeDofs,
		lambda,
		divisor,
		triangleDofs,
		triangleSigns,
		triangleFloors,
		triangleMovable,
		iterations,
		globalIterations,
		targetWeight,
		axis,
		triangles: Uint32Array.from(triangles),
		areas,
		orientationIterations,
		minimumAreaRatio,
		position: new Float64Array(n * 2),
		target: new Float64Array(n * 2),
		rotation: new Float64Array(n * 2),
		rhs: new Float64Array(n * 2),
		stats: {
			rigid: false,
			maximumTargetErrorPx: 0,
			rmsTargetErrorPx: 0,
			maximumProjectionPx: 0,
			flippedTriangles: 0,
			minimumAreaRatio: 1,
			orientationPasses: 0
		}
	};
}
/** Targets/output use the rig's normalized cut-out space. Scratch is exclusive
* to one rig. Repeated seeking is deterministic and never uses its last pose. */
function solveArapSkin(s, targets, output) {
	need(targets?.length === s.n * 2 && output?.length === s.n * 2, "position buffer");
	const { n, width, height, rest, position: p, target: t, starts, neighbourDofs, deltas, rotation: r, rhs, pins, freeDofs, lambda, divisor, triangleDofs, triangleSigns, triangleFloors, triangleMovable } = s;
	for (let i = 0; i < n; i++) {
		const x = targets[i * 2], y = targets[i * 2 + 1];
		need(Number.isFinite(x) && Number.isFinite(y), "nonfinite target");
		t[i * 2] = x * width;
		t[i * 2 + 1] = y * height;
	}
	const a = s.axis * 2, ux = rest[a] - rest[0], uy = rest[a + 1] - rest[1], vx = t[a] - t[0], vy = t[a + 1] - t[1], len2 = ux * ux + uy * uy;
	const cs = (ux * vx + uy * vy) / len2, sn = (ux * vy - uy * vx) / len2;
	let rigid = Math.abs(cs * cs + sn * sn - 1) <= 2e-6;
	if (rigid) for (let i = 0; i < n; i++) {
		const x = rest[i * 2] - rest[0], y = rest[i * 2 + 1] - rest[1];
		if (Math.abs(t[i * 2] - (t[0] + cs * x - sn * y)) > 2e-4 || Math.abs(t[i * 2 + 1] - (t[1] + sn * x + cs * y)) > 2e-4) {
			rigid = false;
			break;
		}
	}
	if (rigid) for (let k = 0; k < triangleDofs.length; k += 3) {
		const a = triangleDofs[k], b = triangleDofs[k + 1], c = triangleDofs[k + 2], ratio = ((t[b] - t[a]) * (t[c + 1] - t[a + 1]) - (t[b + 1] - t[a + 1]) * (t[c] - t[a])) / s.areas[k / 3];
		if (!Number.isFinite(ratio) || ratio <= 0) {
			rigid = false;
			break;
		}
	}
	if (rigid) {
		output.set(targets);
		s.stats.rigid = true;
		s.stats.maximumTargetErrorPx = 0;
		s.stats.rmsTargetErrorPx = 0;
		s.stats.maximumProjectionPx = 0;
		s.stats.flippedTriangles = 0;
		s.stats.minimumAreaRatio = 1;
		s.stats.orientationPasses = 0;
		return s.stats;
	}
	s.stats.rigid = false;
	p.set(t);
	for (let pass = 0; pass < s.iterations; pass++) {
		for (let i = 0; i < n; i++) {
			let dot = 0, cross = 0;
			const ix = p[i * 2], iy = p[i * 2 + 1];
			for (let k = starts[i]; k < starts[i + 1]; k++) {
				const j = neighbourDofs[k], px = ix - p[j], py = iy - p[j + 1], x = deltas[k * 2], y = deltas[k * 2 + 1];
				dot += x * px + y * py;
				cross += x * py - y * px;
			}
			const length = Math.hypot(dot, cross);
			r[i * 2] = length > 1e-12 ? dot / length : 1;
			r[i * 2 + 1] = length > 1e-12 ? cross / length : 0;
		}
		for (let step = 0; step < freeDofs.length; step++) {
			const ii = freeDofs[step], i = ii / 2, l = lambda[i];
			let x = l * t[ii], y = l * t[ii + 1];
			for (let k = starts[i]; k < starts[i + 1]; k++) {
				const j = neighbourDofs[k], c = (r[ii] + r[j]) * .5, q = (r[ii + 1] + r[j + 1]) * .5, dx = deltas[k * 2], dy = deltas[k * 2 + 1];
				x += c * dx - q * dy;
				y += q * dx + c * dy;
			}
			rhs[ii] = x;
			rhs[ii + 1] = y;
		}
		for (let sweep = 0; sweep < s.globalIterations; sweep++) {
			for (let step = 0; step < freeDofs.length; step++) {
				const ii = freeDofs[step], i = ii / 2;
				let x = rhs[ii], y = rhs[ii + 1];
				for (let k = starts[i]; k < starts[i + 1]; k++) {
					const j = neighbourDofs[k];
					x += p[j];
					y += p[j + 1];
				}
				p[ii] = x / divisor[i];
				p[ii + 1] = y / divisor[i];
			}
			for (let step = freeDofs.length - 1; step >= 0; step--) {
				const ii = freeDofs[step], i = ii / 2;
				let x = rhs[ii], y = rhs[ii + 1];
				for (let k = starts[i]; k < starts[i + 1]; k++) {
					const j = neighbourDofs[k];
					x += p[j];
					y += p[j + 1];
				}
				p[ii] = x / divisor[i];
				p[ii + 1] = y / divisor[i];
			}
		}
	}
	rhs.set(p);
	let orientationPasses = 0;
	for (let pass = 0; pass < s.orientationIterations; pass++) {
		let changed = 0;
		for (let k = 0; k < triangleDofs.length; k += 3) {
			const a = triangleDofs[k], b = triangleDofs[k + 1], c = triangleDofs[k + 2], triangle = k / 3, sign = triangleSigns[triangle], movable = triangleMovable[triangle];
			const constraint = ((p[b] - p[a]) * (p[c + 1] - p[a + 1]) - (p[b + 1] - p[a + 1]) * (p[c] - p[a])) * sign - triangleFloors[triangle];
			if (constraint >= 0) continue;
			changed++;
			const ax = p[b + 1] - p[c + 1], ay = p[c] - p[b], bx = p[c + 1] - p[a + 1], by = p[a] - p[c], cx = p[a + 1] - p[b + 1], cy = p[b] - p[a];
			const norm = (movable & 1 ? ax * ax + ay * ay : 0) + (movable & 2 ? bx * bx + by * by : 0) + (movable & 4 ? cx * cx + cy * cy : 0);
			if (norm < 1e-20) continue;
			const scale = -constraint * sign / norm;
			if (movable & 1) {
				p[a] += scale * ax;
				p[a + 1] += scale * ay;
			}
			if (movable & 2) {
				p[b] += scale * bx;
				p[b + 1] += scale * by;
			}
			if (movable & 4) {
				p[c] += scale * cx;
				p[c + 1] += scale * cy;
			}
		}
		orientationPasses = pass + 1;
		if (!changed) break;
	}
	let flipped = 0, minRatio = Infinity;
	for (let k = 0; k < triangleDofs.length; k += 3) {
		const a = triangleDofs[k], b = triangleDofs[k + 1], c = triangleDofs[k + 2], ratio = ((p[b] - p[a]) * (p[c + 1] - p[a + 1]) - (p[b + 1] - p[a + 1]) * (p[c] - p[a])) / s.areas[k / 3];
		if (!Number.isFinite(ratio) || ratio <= 0) flipped++;
		minRatio = Math.min(minRatio, ratio);
	}
	let projection = 0;
	for (let i = 0; i < n; i++) projection = Math.max(projection, (p[i * 2] - rhs[i * 2]) ** 2 + (p[i * 2 + 1] - rhs[i * 2 + 1]) ** 2);
	s.stats.flippedTriangles = flipped;
	s.stats.minimumAreaRatio = minRatio;
	s.stats.orientationPasses = orientationPasses;
	s.stats.maximumProjectionPx = Math.sqrt(projection);
	let maximum = 0, sum = 0;
	for (let i = 0; i < n; i++) {
		need(Number.isFinite(p[i * 2]) && Number.isFinite(p[i * 2 + 1]), "nonfinite solution");
		const e = (p[i * 2] - t[i * 2]) ** 2 + (p[i * 2 + 1] - t[i * 2 + 1]) ** 2;
		maximum = Math.max(maximum, e);
		sum += e;
	}
	s.stats.maximumTargetErrorPx = Math.sqrt(maximum);
	s.stats.rmsTargetErrorPx = Math.sqrt(sum / n);
	need(flipped === 0, "unresolved folded triangles: " + flipped);
	for (let i = 0; i < n; i++) {
		output[i * 2] = pins[i] ? targets[i * 2] : p[i * 2] / width;
		output[i * 2 + 1] = pins[i] ? targets[i * 2 + 1] : p[i * 2 + 1] / height;
	}
	return s.stats;
}
//#endregion
//#region port/v2/tools/creature-animation/compiled-skin-field.mjs
/** Compiled sparse linear blend field. No motion, solver or topology changes.
* Compilation explicitly snapshots source geometry/weights. Every application
* reads CURRENT matrices; there is no matrix-identity or output-result cache.
* Private scratch prevents failed frames from partially publishing geometry.
*/
const states$1 = /* @__PURE__ */ new WeakMap();
const fail$1 = (message) => {
	throw Error("Compiled skin field: " + message);
};
function createCompiledSkinField(skin, width, height) {
	if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) fail$1("dimensions");
	if (skin?.schema !== "cf.paint-skin/v1" || !Array.isArray(skin.vertices) || skin.vertices.length < 3 || skin.vertices.length > 4e4) fail$1("source vertices");
	const vertexCount = skin.vertices.length, jointNames = [], jointIds = /* @__PURE__ */ new Map();
	const positions = new Float64Array(vertexCount * 2), offsets = new Uint32Array(vertexCount + 1);
	let weightCount = 0;
	for (let i = 0; i < vertexCount; i++) {
		const vertex = skin.vertices[i];
		if (!vertex || !Number.isFinite(vertex.x) || !Number.isFinite(vertex.y) || vertex.x < 0 || vertex.x > width || vertex.y < 0 || vertex.y > height || !Array.isArray(vertex.weights) || !vertex.weights.length || vertex.weights.length > 8) fail$1("source vertex");
		positions[i * 2] = vertex.x / width;
		positions[i * 2 + 1] = vertex.y / height;
		offsets[i] = weightCount;
		let sum = 0;
		const used = /* @__PURE__ */ new Set();
		for (const entry of vertex.weights) {
			if (!Array.isArray(entry) || entry.length !== 2) fail$1("source weight");
			const [joint, weight] = entry;
			if (typeof joint !== "string" || !joint.length || used.has(joint) || !Number.isFinite(weight) || weight <= 0 || weight > 1) fail$1("source weight");
			used.add(joint);
			sum += weight;
			weightCount++;
			if (!jointIds.has(joint)) {
				jointIds.set(joint, jointNames.length);
				jointNames.push(joint);
			}
		}
		if (Math.abs(sum - 1) > 1e-8) fail$1("source weight sum");
	}
	offsets[vertexCount] = weightCount;
	const matrixOffsets = new Uint32Array(weightCount), weights = new Float64Array(weightCount);
	let entryIndex = 0;
	for (const vertex of skin.vertices) for (const [joint, weight] of vertex.weights) {
		matrixOffsets[entryIndex] = jointIds.get(joint) * 6;
		weights[entryIndex++] = weight;
	}
	const state = Object.freeze({
		vertexCount,
		jointCount: jointNames.length,
		weightCount
	});
	states$1.set(state, {
		positions,
		offsets,
		matrixOffsets,
		weights,
		jointNames,
		matrixValues: new Float64Array(jointNames.length * 6),
		scratch32: new Float32Array(vertexCount * 2),
		scratch64: new Float64Array(vertexCount * 2)
	});
	return state;
}
/**
* Each required joint lookup and each of its six components is read once per
* call, including when matrix objects are edited in place between calls.
* Weight order and Number arithmetic match applyPaintSkin exactly. The output
* remains byte-identical to its prior state on missing/invalid/overflow input.
*/
function applyCompiledSkinField(state, matrices, output) {
	const data = states$1.get(state);
	if (!data) fail$1("unknown compiled state");
	if (!(output instanceof Float32Array || output instanceof Float64Array) || output.length !== state.vertexCount * 2) fail$1("position buffer");
	if (!matrices || typeof matrices !== "object") fail$1("matrices");
	const { positions, offsets, matrixOffsets, weights, jointNames, matrixValues } = data;
	for (let joint = 0; joint < jointNames.length; joint++) {
		const name = jointNames[joint], matrix = matrices[name];
		if (!Object.hasOwn(matrices, name) || !matrix || matrix.length !== 6) fail$1("matrix: " + name);
		const offset = joint * 6;
		for (let component = 0; component < 6; component++) {
			const value = matrix[component];
			if (!Number.isFinite(value)) fail$1("matrix: " + name);
			matrixValues[offset + component] = value;
		}
	}
	const scratch = output instanceof Float32Array ? data.scratch32 : data.scratch64;
	for (let vertex = 0; vertex < state.vertexCount; vertex++) {
		const index = vertex * 2, x = positions[index], y = positions[index + 1];
		let px = 0, py = 0;
		for (let entry = offsets[vertex]; entry < offsets[vertex + 1]; entry++) {
			const matrix = matrixOffsets[entry], weight = weights[entry];
			px += (matrixValues[matrix] * x + matrixValues[matrix + 2] * y + matrixValues[matrix + 4]) * weight;
			py += (matrixValues[matrix + 1] * x + matrixValues[matrix + 3] * y + matrixValues[matrix + 5]) * weight;
		}
		scratch[index] = px;
		scratch[index + 1] = py;
		if (!Number.isFinite(scratch[index]) || !Number.isFinite(scratch[index + 1])) fail$1("overflow");
	}
	output.set(scratch);
}
//#endregion
//#region port/v2/tools/creature-animation/paint-skin.mjs
function applyPaintPart(part, field, output) {
	for (let i = 0; i < part.vertices.length; i++) {
		const v = part.vertices[i];
		let x = 0, y = 0;
		for (let k = 0; k < 3; k++) {
			x += field[v.triangle[k] * 2] * v.barycentric[k];
			y += field[v.triangle[k] * 2 + 1] * v.barycentric[k];
		}
		output[i * 2] = x;
		output[i * 2 + 1] = y;
	}
}
/** Precomputed signed source areas keep the frame check allocation-free. */
function paintPartAreas(part, skin) {
	const rest = part.vertices.map((v) => v.triangle.reduce((p, k, i) => [p[0] + skin.vertices[k].x * v.barycentric[i], p[1] + skin.vertices[k].y * v.barycentric[i]], [0, 0])), areas = new Float64Array(part.indices.length / 3);
	for (let i = 0; i < part.indices.length; i += 3) {
		const a = rest[part.indices[i]], b = rest[part.indices[i + 1]], c = rest[part.indices[i + 2]];
		areas[i / 3] = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
	}
	return areas;
}
/** Reject actual foldovers before publication. Texture continuity alone is insufficient. */
function assertPaintPartShape(part, skin, p, width, height, areas = paintPartAreas(part, skin)) {
	for (let i = 0; i < part.indices.length; i += 3) {
		const area = areas[i / 3];
		if (!Number.isFinite(area) || area === 0) throw Error("Paint skin degenerate source triangle: " + part.id + " " + i / 3);
		const a = part.indices[i] * 2, b = part.indices[i + 1] * 2, c = part.indices[i + 2] * 2, posed = ((p[b] - p[a]) * (p[c + 1] - p[a + 1]) - (p[b + 1] - p[a + 1]) * (p[c] - p[a])) * width * height;
		if (!Number.isFinite(posed) || posed / area <= 0) throw Error("Paint skin folded triangle: " + part.id + " " + i / 3);
	}
}
//#endregion
//#region port/v2/tools/creature-animation/compiled-paint-part.mjs
/** Snapshot interpolation and orientation inputs once; source topology and
* thresholds remain those of applyPaintPart/assertPaintPartShape. Per-call
* fields are always read again. Nothing is published until the full part passes. */
const states = /* @__PURE__ */ new WeakMap();
const fail = (message) => {
	throw Error("Compiled paint part: " + message);
};
function createCompiledPaintPart(part, skin, width, height) {
	if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) fail("dimensions");
	if (!skin?.vertices?.length || !part?.vertices?.length || !part.indices?.length || part.indices.length % 3) fail("source topology");
	const vertexCount = part.vertices.length, fieldLength = skin.vertices.length * 2, groups = [
		[],
		[],
		[]
	], referenced = /* @__PURE__ */ new Set();
	for (let i = 0; i < vertexCount; i++) {
		const v = part.vertices[i];
		if (!Array.isArray(v.triangle) || v.triangle.length !== 3 || !Array.isArray(v.barycentric) || v.barycentric.length !== 3) fail("source interpolation");
		const entries = [];
		let sum = 0;
		for (let k = 0; k < 3; k++) {
			const index = v.triangle[k], weight = v.barycentric[k];
			if (!Number.isInteger(index) || index < 0 || index >= skin.vertices.length || !Number.isFinite(weight) || weight < -1e-8 || weight > 1 + 1e-8) fail("source interpolation");
			referenced.add(index * 2);
			sum += weight;
			if (weight !== 0) entries.push([index * 2, weight]);
		}
		if (!entries.length || Math.abs(sum - 1) > 1e-8) fail("interpolation sum");
		groups[entries.length - 1].push({
			output: i * 2,
			entries
		});
	}
	const compiled = groups.map((rows, group) => {
		const count = group + 1, outputs = new Uint32Array(rows.length), indices = new Uint32Array(rows.length * count), weights = new Float64Array(indices.length);
		rows.forEach((row, i) => {
			outputs[i] = row.output;
			row.entries.forEach(([index, weight], k) => {
				indices[i * count + k] = index;
				weights[i * count + k] = weight;
			});
		});
		return {
			count,
			outputs,
			indices,
			weights
		};
	});
	const triangles = new Uint32Array(part.indices.length);
	for (let i = 0; i < triangles.length; i++) {
		const index = part.indices[i];
		if (!Number.isInteger(index) || index < 0 || index >= vertexCount) fail("triangle index");
		triangles[i] = index * 2;
	}
	const areas = paintPartAreas(part, skin);
	for (const area of areas) if (!Number.isFinite(area) || area === 0) fail("degenerate source triangle");
	const state = Object.freeze({
		vertexCount,
		triangleCount: triangles.length / 3,
		fieldLength
	});
	states.set(state, {
		id: String(part.id),
		width,
		height,
		compiled,
		referenced: Uint32Array.from(referenced),
		triangles,
		areas,
		scratch32: new Float32Array(vertexCount * 2),
		scratch64: new Float64Array(vertexCount * 2)
	});
	return state;
}
function applyCompiledPaintPart(state, field, output) {
	const data = states.get(state);
	if (!data) fail("unknown compiled state");
	if (!(field instanceof Float32Array || field instanceof Float64Array) || field.length !== state.fieldLength) fail("field buffer");
	if (!(output instanceof Float32Array || output instanceof Float64Array) || output.length !== state.vertexCount * 2) fail("position buffer");
	for (const index of data.referenced) if (!Number.isFinite(field[index]) || !Number.isFinite(field[index + 1])) fail("nonfinite field");
	const pending = output instanceof Float32Array ? data.scratch32 : data.scratch64;
	for (const group of data.compiled) {
		const { count, outputs, indices, weights } = group;
		for (let i = 0; i < outputs.length; i++) {
			const offset = i * count, o = outputs[i], a = indices[offset];
			let x = 0 + field[a] * weights[offset], y = 0 + field[a + 1] * weights[offset];
			if (count > 1) {
				const b = indices[offset + 1];
				x += field[b] * weights[offset + 1];
				y += field[b + 1] * weights[offset + 1];
			}
			if (count > 2) {
				const c = indices[offset + 2];
				x += field[c] * weights[offset + 2];
				y += field[c + 1] * weights[offset + 2];
			}
			pending[o] = x;
			pending[o + 1] = y;
			if (!Number.isFinite(pending[o]) || !Number.isFinite(pending[o + 1])) fail("nonfinite interpolation");
		}
	}
	const { triangles, areas, width, height } = data;
	for (let i = 0; i < triangles.length; i += 3) {
		const a = triangles[i], b = triangles[i + 1], c = triangles[i + 2];
		const posed = ((pending[b] - pending[a]) * (pending[c + 1] - pending[a + 1]) - (pending[b + 1] - pending[a + 1]) * (pending[c] - pending[a])) * width * height;
		if (!Number.isFinite(posed) || posed / areas[i / 3] <= 0) throw Error("Paint skin folded triangle: " + data.id + " " + i / 3);
	}
	output.set(pending);
}
//#endregion
export { applyCompiledPaintPart, applyCompiledSkinField, applyPaintPart, assertPaintPartShape, createArapScratch, createCompiledPaintPart, createCompiledSkinField, paintPartAreas, poseMatrices, solveArapSkin };
