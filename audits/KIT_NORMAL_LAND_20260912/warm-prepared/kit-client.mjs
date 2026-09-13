//#region port/v2/apps/game/src/local-ai-kit-runtime.ts
/** App-owned worker lifetime: successful landings retain the same engine;
* cancellation/fault/disposal terminates it and the next landing starts fresh. */
function createWarmKitLandfallRuntimeV4(workerUrl, modelFiles = {}) {
	let worker = null, active = false, sequence = 0, disposed = false;
	const destroy = () => {
		worker?.terminate();
		worker = null;
	};
	let cancelActive = null;
	async function generate(recipe, signal, onEvent = () => {}) {
		if (disposed) throw Error("Kit runtime disposed");
		if (active) throw Error("Kit runtime already painting");
		if (signal.aborted) throw new DOMException("Landing canceled", "AbortError");
		active = true;
		try {
			worker ??= new Worker(workerUrl, {
				type: "module",
				name: "cf-kit-landfall-v4"
			});
			const current = worker, requestId = ++sequence;
			return await new Promise((resolve, reject) => {
				let settled = false;
				const finish = (error, result) => {
					if (settled) return;
					settled = true;
					clearTimeout(timer);
					signal.removeEventListener("abort", abort);
					cancelActive = null;
					current.onmessage = null;
					current.onerror = null;
					current.onmessageerror = null;
					if (error) {
						destroy();
						reject(error);
					} else resolve(result);
				};
				const abort = () => finish(new DOMException("Landing canceled", "AbortError"));
				const timer = setTimeout(() => finish(Error("Kit engine run deadline exceeded")), 18e5);
				cancelActive = abort;
				signal.addEventListener("abort", abort, { once: true });
				current.onerror = (event) => finish(Error(event.message || "Kit worker failed"));
				current.onmessageerror = () => finish(Error("Kit worker result unreadable"));
				current.onmessage = ({ data }) => {
					if (settled) return;
					if (data.type === "progress") {
						if (data.phase === "gpu-error") {
							finish(Error(String(data.message)));
							return;
						}
						try {
							onEvent(data);
						} catch {
							finish(Error("Kit progress observer failed"));
						}
						return;
					}
					if (data.requestId !== requestId) return;
					if (data.type === "error") {
						finish(Error(String(data.message)));
						return;
					}
					if (data.type !== "complete" || data.schema !== "cf.kit-engine-result.v4" || !(data.painting instanceof Blob) || data.painting.type !== "image/png" || !data.painting.size || data.painting.size > 16777216 || data.width !== recipe.width || data.height !== recipe.height || data.qualityAccepted !== false) {
						finish(Error("Kit painting contract mismatch"));
						return;
					}
					finish(null, data);
				};
				try {
					current.postMessage({
						stage: "kit-v4",
						requestId,
						recipe,
						modelFiles
					});
				} catch (error) {
					finish(error instanceof Error ? error : Error(String(error)));
				}
				if (signal.aborted) abort();
			});
		} finally {
			active = false;
		}
	}
	return Object.freeze({
		generate,
		dispose() {
			disposed = true;
			cancelActive?.();
			destroy();
		}
	});
}
//#endregion
export { createWarmKitLandfallRuntimeV4 };
