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
//#endregion
//#region port/v2/apps/game/src/local-model-delivery.ts
/** Opt-in browser model delivery, not a model/phone/painting qualification.
* OPFS chunks are immutable; only tiny active/ready markers are atomically replaced.
* Existing model attempts, game builds, saves and scene images are never deleted.
* Quota estimates include all origin usage; Web Locks serialize this owner only.
* Actual quota/write errors still stop installation without publishing readiness.
*/
const LOCAL_MODEL_CHUNK_BYTES_V1 = 1048576;
const MAX_NETWORK_CHUNK = 8 * LOCAL_MODEL_CHUNK_BYTES_V1;
const MARKER_MARGIN = 131072;
const NAMESPACE = "cf-local-model-delivery-v1";
var DeliveryError = class extends Error {
	code;
	constructor(code, message = code) {
		super(message);
		this.code = code;
	}
};
const requireValue = (condition, code) => {
	if (!condition) throw new DeliveryError(code);
};
const count = (value) => Number.isSafeInteger(value) && value >= 0;
const digest = (value) => new LocalModelSha256V1().update(new TextEncoder().encode(value)).digestHex();
const notFound = (error) => error instanceof Error && error.name === "NotFoundError";
const canceled = (signal) => {
	if (signal.aborted) throw new DeliveryError("canceled");
};
function normalizeManifest(source) {
	requireValue(source?.schema === "cf.local-model-delivery-manifest.v1" && /^[A-Za-z0-9_-]+\/[A-Za-z0-9_.-]+$/u.test(source.modelId) && /^[a-f0-9]{40}$/u.test(source.revision) && /^[a-f0-9]{64}$/u.test(source.sourceManifestSha256) && Array.isArray(source.files) && source.files.length > 0 && source.files.length <= 128, "invalid-manifest");
	const paths = /* @__PURE__ */ new Set();
	const files = source.files.map((file) => {
		requireValue(typeof file.path === "string" && file.path.length <= 240 && file.path.split("/").every((segment) => /^[A-Za-z0-9_.-]+$/u.test(segment) && segment !== "." && segment !== "..") && !paths.has(file.path) && count(file.bytes) && file.bytes > 0 && file.bytes <= 4294967296 && /^[a-f0-9]{64}$/u.test(file.sha256), "invalid-manifest-file");
		paths.add(file.path);
		return Object.freeze({
			path: file.path,
			bytes: file.bytes,
			sha256: file.sha256
		});
	});
	const totalBytes = files.reduce((total, file) => total + file.bytes, 0);
	requireValue(count(totalBytes) && totalBytes === source.totalBytes && totalBytes <= 34359738368, "invalid-manifest-total");
	return Object.freeze({
		schema: source.schema,
		modelId: source.modelId,
		revision: source.revision,
		sourceManifestSha256: source.sourceManifestSha256,
		totalBytes,
		files: Object.freeze(files)
	});
}
function nativeStorage() {
	requireValue(typeof navigator !== "undefined" && typeof navigator.storage?.getDirectory === "function", "opfs-unavailable");
	return {
		getDirectory: () => navigator.storage.getDirectory(),
		estimate: () => navigator.storage.estimate()
	};
}
function nativeLocks() {
	requireValue(typeof navigator !== "undefined" && typeof navigator.locks?.request === "function", "web-locks-unavailable");
	return { run: (name, signal, action) => navigator.locks.request(name, {
		mode: "exclusive",
		signal
	}, action) };
}
async function maybeFile(directory, name) {
	try {
		return await (await directory.getFileHandle(name)).getFile();
	} catch (error) {
		if (notFound(error)) return null;
		throw error;
	}
}
async function readMarker(directory, name) {
	const file = await maybeFile(directory, name);
	if (!file) return null;
	requireValue(file.size > 0 && file.size <= 65536, "invalid-marker");
	try {
		return JSON.parse(await file.text());
	} catch {
		throw new DeliveryError("invalid-marker");
	}
}
async function atomicWrite(directory, name, data, signal) {
	canceled(signal);
	const writer = await (await directory.getFileHandle(name, { create: true })).createWritable();
	let closed = false;
	try {
		await writer.write(data);
		canceled(signal);
		await writer.close();
		closed = true;
	} finally {
		if (!closed) await writer.abort();
	}
}
function markerAttempt(value, manifestSha256) {
	requireValue(value !== null && typeof value === "object", "invalid-marker");
	const row = value;
	requireValue(row.schema === "cf.local-model-attempt.v1" && row.manifestSha256 === manifestSha256 && typeof row.attemptId === "string" && /^[A-Za-z0-9_-]{1,80}$/u.test(row.attemptId), "invalid-marker");
	return {
		schema: row.schema,
		manifestSha256,
		attemptId: row.attemptId
	};
}
function createLocalModelDeliveryV1(options) {
	const manifest = normalizeManifest(options.manifest), manifestSha256 = digest(JSON.stringify(manifest));
	const address = new URL(options.baseUrl ?? `https://huggingface.co/${manifest.modelId}/resolve/${manifest.revision}/`);
	requireValue((address.protocol === "https:" || address.protocol === "http:" && [
		"localhost",
		"127.0.0.1",
		"[::1]"
	].includes(address.hostname)) && !address.username && !address.password && !address.search && !address.hash && address.pathname.endsWith("/"), "invalid-base-url");
	const headroom = options.headroomBytes ?? 67108864;
	const timeout = options.fileTimeoutMs ?? 6e5;
	requireValue(count(headroom) && Number.isInteger(timeout) && timeout >= 100 && timeout <= 18e5, "invalid-delivery-budget");
	const fetcher = options.fetch ?? globalThis.fetch.bind(globalThis);
	let readyAttempt = null, busy = false;
	let current = Object.freeze({
		phase: "unknown",
		ready: false,
		manifestSha256,
		totalBytes: manifest.totalBytes,
		storedBytes: 0,
		verifiedBytes: 0,
		downloadedBytes: 0,
		verifiedFiles: 0,
		totalFiles: manifest.files.length,
		file: null,
		error: null,
		attemptId: null,
		qualityAccepted: false,
		deviceQualified: false
	});
	const publish = (patch) => {
		current = Object.freeze({
			...current,
			...patch
		});
		options.onStatus?.(current);
		return current;
	};
	const chunkName = (fileIndex, chunkIndex) => `f${fileIndex}-c${chunkIndex}`;
	const activeName = `active-${manifestSha256}.json`, readyName = `ready-${manifestSha256}.json`;
	const getNamespace = async (storage) => (await storage.getDirectory()).getDirectoryHandle(NAMESPACE, { create: true });
	const getAttempt = (directory, marker, create = false) => directory.getDirectoryHandle(marker.attemptId, { create });
	async function quota(storage, additional) {
		const { usage, quota: capacity } = await storage.estimate();
		requireValue(usage !== void 0 && capacity !== void 0 && count(usage) && count(capacity), "storage-estimate-unavailable");
		requireValue(usage + additional + headroom + MARKER_MARGIN <= capacity, "insufficient-storage");
	}
	async function scan(directory, signal, full) {
		let stored = 0, verified = 0, verifiedFiles = 0;
		for (let index = 0; index < manifest.files.length; index++) {
			const file = manifest.files[index], hash = new LocalModelSha256V1();
			let bytes = 0;
			for (let part = 0; bytes < file.bytes; part++) {
				canceled(signal);
				const blob = await maybeFile(directory, chunkName(index, part));
				if (!blob || blob.size === 0) break;
				const expected = Math.min(LOCAL_MODEL_CHUNK_BYTES_V1, file.bytes - bytes);
				requireValue(blob.size === expected, "invalid-chunk-length");
				hash.update(new Uint8Array(await blob.arrayBuffer()));
				bytes += expected;
				stored += expected;
			}
			if (bytes === file.bytes) {
				requireValue(hash.digestHex() === file.sha256, "hash-mismatch");
				verified += bytes;
				verifiedFiles++;
			} else if (full) throw new DeliveryError("missing-ready-chunk");
			publish({
				storedBytes: stored,
				verifiedBytes: verified,
				verifiedFiles,
				file: file.path
			});
		}
		return stored;
	}
	async function verifyReady(directory, value, signal) {
		if (value === null) return false;
		const marker = markerAttempt(value, manifestSha256), attempt = await getAttempt(directory, marker);
		requireValue(await readMarker(attempt, "failed.json") === null, "failed-attempt");
		publish({
			phase: "verifying",
			attemptId: marker.attemptId
		});
		await scan(attempt, signal, true);
		canceled(signal);
		readyAttempt = marker;
		publish({
			phase: "ready",
			ready: true,
			file: null,
			error: null
		});
		return true;
	}
	async function downloadFile(attempt, index, storage, signal) {
		const file = manifest.files[index], hash = new LocalModelSha256V1();
		let offset = 0, part = 0;
		while (offset < file.bytes) {
			canceled(signal);
			const blob = await maybeFile(attempt, chunkName(index, part));
			if (!blob || blob.size === 0) break;
			requireValue(blob.size === Math.min(LOCAL_MODEL_CHUNK_BYTES_V1, file.bytes - offset), "invalid-chunk-length");
			hash.update(new Uint8Array(await blob.arrayBuffer()));
			offset += blob.size;
			part++;
		}
		if (offset < file.bytes) {
			await quota(storage, file.bytes - offset + LOCAL_MODEL_CHUNK_BYTES_V1);
			const controller = new AbortController(), abort = () => controller.abort();
			signal.addEventListener("abort", abort, { once: true });
			if (signal.aborted) abort();
			const timer = setTimeout(abort, timeout);
			let reader = null;
			try {
				const headers = offset ? { Range: `bytes=${offset}-` } : {};
				const response = await fetcher(new URL(file.path.split("/").map(encodeURIComponent).join("/"), address), {
					method: "GET",
					headers,
					signal: controller.signal,
					credentials: "omit",
					cache: "no-store",
					referrerPolicy: "no-referrer"
				});
				canceled(signal);
				if (offset) requireValue(response.status === 206 && response.headers.get("content-range") === `bytes ${offset}-${file.bytes - 1}/${file.bytes}`, "invalid-range-response");
				else requireValue(response.status === 200 && !response.headers.has("content-range"), "invalid-http-response");
				requireValue(response.body !== null, "missing-response-body");
				reader = response.body.getReader();
				let chunk = new Uint8Array(Math.min(LOCAL_MODEL_CHUNK_BYTES_V1, file.bytes - offset)), used = 0;
				publish({
					phase: "downloading",
					file: file.path
				});
				while (true) {
					canceled(signal);
					const next = await reader.read();
					canceled(signal);
					if (next.done) break;
					const value = next.value;
					requireValue(value instanceof Uint8Array && value.byteLength <= MAX_NETWORK_CHUNK, "network-chunk-limit");
					requireValue(offset + used + value.byteLength <= file.bytes, "excess-file-bytes");
					publish({ downloadedBytes: current.downloadedBytes + value.byteLength });
					for (let at = 0; at < value.byteLength;) {
						const take = Math.min(chunk.length - used, value.byteLength - at);
						chunk.set(value.subarray(at, at + take), used);
						used += take;
						at += take;
						if (used === chunk.length) {
							await quota(storage, chunk.length + LOCAL_MODEL_CHUNK_BYTES_V1);
							const name = chunkName(index, part), existing = await maybeFile(attempt, name);
							requireValue(existing === null || existing.size === 0, "immutable-chunk-conflict");
							await atomicWrite(attempt, name, chunk, signal);
							const committed = await maybeFile(attempt, name);
							requireValue(committed !== null && committed.size === chunk.length, "invalid-chunk-length");
							hash.update(new Uint8Array(await committed.arrayBuffer()));
							offset += chunk.length;
							part++;
							used = 0;
							publish({ storedBytes: current.storedBytes + chunk.length });
							chunk = new Uint8Array(Math.min(LOCAL_MODEL_CHUNK_BYTES_V1, file.bytes - offset));
						}
					}
				}
				requireValue(offset === file.bytes && used === 0, "truncated-file");
			} finally {
				controller.abort();
				clearTimeout(timer);
				signal.removeEventListener("abort", abort);
				if (reader) try {
					await reader.cancel();
				} finally {
					reader.releaseLock();
				}
			}
		}
		canceled(signal);
		requireValue(hash.digestHex() === file.sha256, "hash-mismatch");
		publish({
			verifiedBytes: current.verifiedBytes + file.bytes,
			verifiedFiles: current.verifiedFiles + 1,
			file: file.path
		});
	}
	async function run(mode, signal, restart) {
		if (busy) throw new DeliveryError("delivery-busy");
		busy = true;
		readyAttempt = null;
		publish({
			phase: "verifying",
			ready: false,
			storedBytes: 0,
			verifiedBytes: 0,
			verifiedFiles: 0,
			downloadedBytes: 0,
			error: null,
			file: null,
			attemptId: null
		});
		try {
			const storage = options.storage ?? nativeStorage();
			return await (options.locks ?? nativeLocks()).run(NAMESPACE, signal, async () => {
				canceled(signal);
				const directory = await getNamespace(storage);
				if (!restart && await verifyReady(directory, await readMarker(directory, readyName), signal)) return current;
				const active = restart ? null : await readMarker(directory, activeName);
				let marker = active === null ? null : markerAttempt(active, manifestSha256);
				let attempt = marker ? await getAttempt(directory, marker) : null;
				const failed = attempt ? await readMarker(attempt, "failed.json") : null;
				if (mode === "verify") {
					if (!attempt) return publish({
						phase: "missing",
						file: null
					});
					publish({ attemptId: marker.attemptId });
					if (failed !== null) return publish({
						phase: "failed",
						error: "failed-attempt",
						file: null
					});
					await scan(attempt, signal, false);
					return publish({
						phase: "partial",
						file: null
					});
				}
				if (restart || !attempt || failed !== null) {
					await quota(storage, manifest.totalBytes + LOCAL_MODEL_CHUNK_BYTES_V1);
					const attemptId = (options.createAttemptId ?? (() => crypto.randomUUID()))();
					marker = markerAttempt({
						schema: "cf.local-model-attempt.v1",
						manifestSha256,
						attemptId
					}, manifestSha256);
					try {
						await directory.getDirectoryHandle(attemptId);
						throw new DeliveryError("attempt-id-collision");
					} catch (error) {
						if (!notFound(error)) throw error;
					}
					attempt = await getAttempt(directory, marker, true);
					await atomicWrite(directory, activeName, JSON.stringify(marker), signal);
				}
				publish({ attemptId: marker.attemptId });
				await scan(attempt, signal, false);
				publish({
					verifiedBytes: 0,
					verifiedFiles: 0
				});
				try {
					for (let index = 0; index < manifest.files.length; index++) await downloadFile(attempt, index, storage, signal);
					canceled(signal);
					await quota(storage, MARKER_MARGIN);
					await atomicWrite(directory, readyName, JSON.stringify(marker), signal);
					readyAttempt = marker;
					return publish({
						phase: "ready",
						ready: true,
						error: null,
						file: null
					});
				} catch (error) {
					if (error instanceof DeliveryError && ["hash-mismatch", "invalid-chunk-length"].includes(error.code)) await atomicWrite(attempt, "failed.json", JSON.stringify({
						code: error.code,
						manifestSha256
					}), new AbortController().signal);
					throw error;
				}
			});
		} catch (error) {
			const code = signal.aborted ? "canceled" : error instanceof DeliveryError ? error.code : error instanceof Error ? error.name === "QuotaExceededError" ? "insufficient-storage" : error.message : "delivery-failed";
			const phase = code === "canceled" ? "canceled" : ["insufficient-storage", "storage-estimate-unavailable"].includes(code) ? "paused" : [
				"hash-mismatch",
				"invalid-chunk-length",
				"invalid-marker",
				"missing-ready-chunk",
				"failed-attempt"
			].includes(code) ? "invalid" : "failed";
			readyAttempt = null;
			return publish({
				phase,
				ready: false,
				error: code
			});
		} finally {
			busy = false;
		}
	}
	return Object.freeze({
		manifest,
		manifestSha256,
		baseUrl: address.href,
		status: () => current,
		install: (args = {}) => run("install", args.signal ?? new AbortController().signal, args.restart === true),
		verify: (args = {}) => run("verify", args.signal ?? new AbortController().signal, false),
		async openFile(filePath) {
			requireValue(readyAttempt !== null && current.ready, "model-not-verified-ready");
			const index = manifest.files.findIndex((file) => file.path === filePath);
			requireValue(index >= 0, "unknown-model-file");
			const file = manifest.files[index], directory = await getNamespace(options.storage ?? nativeStorage());
			const attempt = await getAttempt(directory, readyAttempt);
			const parts = [];
			for (let offset = 0, part = 0; offset < file.bytes; part++) {
				const blob = await maybeFile(attempt, chunkName(index, part));
				requireValue(blob !== null && blob.size === Math.min(1048576, file.bytes - offset), "missing-ready-chunk");
				parts.push(blob);
				offset += blob.size;
			}
			return new Blob(parts, { type: "application/octet-stream" });
		}
	});
}
/** Read capabilities/estimates only. No model bytes, inference, benchmark or UA/RAM guesses. */
async function probeLocalModelCapabilitiesV1(host = navigator, secureContext = globalThis.isSecureContext === true) {
	const errors = [];
	let usageBytes = null, quotaBytes = null, persisted = null;
	try {
		const estimate = await host.storage?.estimate();
		usageBytes = estimate?.usage !== void 0 && count(estimate.usage) ? estimate.usage : null;
		quotaBytes = estimate?.quota !== void 0 && count(estimate.quota) ? estimate.quota : null;
		persisted = typeof host.storage?.persisted === "function" ? await host.storage.persisted() : null;
	} catch (error) {
		errors.push(String(error));
	}
	let webgpu = false, shaderF16 = false, fallbackAdapter = null, limits = null;
	try {
		const adapter = await host.gpu?.requestAdapter({ powerPreference: "high-performance" });
		if (adapter) {
			webgpu = true;
			shaderF16 = adapter.features.has("shader-f16");
			fallbackAdapter = adapter.info.isFallbackAdapter;
			limits = {
				maxBufferSize: adapter.limits.maxBufferSize,
				maxStorageBufferBindingSize: adapter.limits.maxStorageBufferBindingSize,
				maxStorageBuffersPerShaderStage: adapter.limits.maxStorageBuffersPerShaderStage
			};
		}
	} catch (error) {
		errors.push(String(error));
	}
	const opfs = typeof host.storage?.getDirectory === "function", webLocks = typeof host.locks?.request === "function";
	return Object.freeze({
		secureContext,
		opfs,
		webLocks,
		webgpu,
		shaderF16,
		fallbackAdapter,
		limits,
		storage: {
			usageBytes,
			quotaBytes,
			persisted
		},
		supported: secureContext && opfs && webLocks && webgpu && shaderF16 && fallbackAdapter === false && usageBytes !== null && quotaBytes !== null,
		deviceQualified: false,
		errors: Object.freeze(errors)
	});
}
//#endregion
//#region audits/LOCAL_MODEL_DELIVERY_20260909/native-01/browser-entry.mjs
const statusElement = document.querySelector("#status");
const api = {
	bootId: crypto.randomUUID(),
	kind: "good",
	states: [],
	clicks: [],
	ready: false,
	capability: null,
	instance: null,
	controller: null,
	operation: null,
	error: null
};
window.deliveryAudit = api;
function publish(state) {
	api.states.push(state);
	statusElement.textContent = JSON.stringify(state, null, 2);
}
api.select = async (kind) => {
	if (api.operation) throw Error("Cannot change fixture while an operation runs");
	if (!["good", "corrupt"].includes(kind)) throw Error("Unknown fixture");
	api.kind = kind;
	const response = await fetch("/fixture.json?kind=" + kind, { cache: "no-store" });
	if (!response.ok) throw Error("Fixture fetch failed");
	api.instance = createLocalModelDeliveryV1({
		manifest: await response.json(),
		baseUrl: location.origin + "/model/" + kind + "/",
		fileTimeoutMs: 1e4,
		onStatus: publish
	});
	return api.instance.verify();
};
api.install = () => {
	if (api.operation) throw Error("Operation already active");
	api.controller = new AbortController();
	api.operation = api.instance.install({ signal: api.controller.signal }).catch((error) => {
		api.error = String(error);
		throw error;
	}).finally(() => {
		api.operation = null;
	});
};
api.openAll = async () => {
	const result = [];
	for (const expected of api.instance.manifest.files) {
		const blob = await api.instance.openFile(expected.path);
		const direct = new Uint8Array(await blob.arrayBuffer());
		const hash = (bytes) => crypto.subtle.digest("SHA-256", bytes).then((buffer) => Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, "0")).join(""));
		const url = URL.createObjectURL(blob);
		try {
			const response = await fetch(url), throughUrl = new Uint8Array(await response.arrayBuffer());
			result.push({
				path: expected.path,
				isBlob: blob instanceof Blob,
				bytes: blob.size,
				sha256: await hash(direct),
				blobUrlBytes: throughUrl.byteLength,
				blobUrlSha256: await hash(throughUrl)
			});
		} finally {
			URL.revokeObjectURL(url);
		}
	}
	return result;
};
api.inventory = async () => {
	const root = await navigator.storage.getDirectory();
	const files = [];
	async function walk(directory, prefix = "") {
		for await (const [name, handle] of directory.entries()) if (handle.kind === "directory") await walk(handle, prefix + name + "/");
		else {
			const file = await handle.getFile();
			const row = {
				path: prefix + name,
				bytes: file.size
			};
			if (name.endsWith(".json")) row.json = JSON.parse(await file.text());
			files.push(row);
		}
	}
	await walk(root);
	return files.sort((a, b) => a.path.localeCompare(b.path));
};
for (const id of ["install", "cancel"]) document.querySelector("#" + id).addEventListener("click", (event) => {
	api.clicks.push({
		id,
		trusted: event.isTrusted
	});
	try {
		if (id === "install") api.install();
		else api.controller?.abort();
	} catch (error) {
		api.error = String(error);
	}
});
api.capability = await probeLocalModelCapabilitiesV1();
await api.select("good");
api.ready = true;
//#endregion
