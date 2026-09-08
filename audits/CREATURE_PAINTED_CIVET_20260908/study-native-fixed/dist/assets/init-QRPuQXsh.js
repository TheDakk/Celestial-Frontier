import { $t as extensions, A as init_Ticker, Ct as init_Texture, Dt as init_BufferImageSource, Et as BufferImageSource, F as DOMAdapter, H as init_Container, Ht as Rectangle, I as init_adapter, L as Sprite, N as CanvasSource, Ot as TextureSource, P as init_CanvasSource, Qt as ExtensionType, R as init_Sprite, St as Texture, Ut as init_Rectangle, V as Container, X as init_getLocalBounds, Y as getLocalBounds, _t as warn, at as boundsPool, bt as Bounds, en as init_Extensions, gt as init_warn, it as init_getGlobalBounds, k as Ticker, kt as init_TextureSource, nn as __esmMin, ot as init_matrixAndBoundsPool, rt as getGlobalBounds, st as matrixPool, xt as init_Bounds } from "./Geometry-CgCjw-Bj.js";
import { a as ImageSource, o as init_ImageSource } from "./canvasUtils-D4O_SOPi.js";
//#region port/v2/node_modules/pixi.js/lib/rendering/mask/utils/addMaskBounds.mjs
function addMaskBounds(mask, bounds, skipUpdateTransform) {
	const boundsToMask = tempBounds;
	mask.measurable = true;
	getGlobalBounds(mask, skipUpdateTransform, boundsToMask);
	bounds.addBoundsMask(boundsToMask);
	mask.measurable = false;
}
var tempBounds;
var init_addMaskBounds = __esmMin((() => {
	init_Bounds();
	init_getGlobalBounds();
	tempBounds = new Bounds();
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/mask/utils/addMaskLocalBounds.mjs
function addMaskLocalBounds(mask, bounds, localRoot) {
	const boundsToMask = boundsPool.get();
	mask.measurable = true;
	const tempMatrix = matrixPool.get().identity();
	const relativeMask = getMatrixRelativeToParent(mask, localRoot, tempMatrix);
	getLocalBounds(mask, boundsToMask, relativeMask);
	mask.measurable = false;
	bounds.addBoundsMask(boundsToMask);
	matrixPool.return(tempMatrix);
	boundsPool.return(boundsToMask);
}
function getMatrixRelativeToParent(target, root, matrix) {
	if (!target) {
		warn("Mask bounds, renderable is not inside the root container");
		return matrix;
	}
	if (target !== root) {
		getMatrixRelativeToParent(target.parent, root, matrix);
		target.updateLocalTransform();
		matrix.append(target.localTransform);
	}
	return matrix;
}
var init_addMaskLocalBounds = __esmMin((() => {
	init_getLocalBounds();
	init_matrixAndBoundsPool();
	init_warn();
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/mask/alpha/AlphaMask.mjs
var AlphaMask;
var init_AlphaMask = __esmMin((() => {
	init_Extensions();
	init_Sprite();
	init_addMaskBounds();
	init_addMaskLocalBounds();
	AlphaMask = class {
		constructor(options) {
			this.priority = 0;
			this.inverse = false;
			this.channel = "red";
			this.pipe = "alphaMask";
			if (options?.mask) this.init(options.mask);
		}
		init(mask) {
			this.mask = mask;
			this.renderMaskToTexture = !(mask instanceof Sprite);
			this.mask.renderable = this.renderMaskToTexture;
			this.mask.includeInBuild = !this.renderMaskToTexture;
			this.mask.measurable = false;
		}
		reset() {
			if (this.mask === null) return;
			this.mask.measurable = true;
			this.mask = null;
		}
		addBounds(bounds, skipUpdateTransform) {
			if (!this.inverse) addMaskBounds(this.mask, bounds, skipUpdateTransform);
		}
		addLocalBounds(bounds, localRoot) {
			addMaskLocalBounds(this.mask, bounds, localRoot);
		}
		containsPoint(point, hitTestFn) {
			const mask = this.mask;
			return hitTestFn(mask, point);
		}
		destroy() {
			this.reset();
		}
		static test(mask) {
			return mask instanceof Sprite;
		}
	};
	AlphaMask.extension = ExtensionType.MaskEffect;
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/mask/color/ColorMask.mjs
var ColorMask;
var init_ColorMask = __esmMin((() => {
	init_Extensions();
	ColorMask = class {
		constructor(options) {
			this.priority = 0;
			this.pipe = "colorMask";
			if (options?.mask) this.init(options.mask);
		}
		init(mask) {
			this.mask = mask;
		}
		destroy() {}
		static test(mask) {
			return typeof mask === "number";
		}
	};
	ColorMask.extension = ExtensionType.MaskEffect;
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/mask/stencil/StencilMask.mjs
var StencilMask;
var init_StencilMask = __esmMin((() => {
	init_Extensions();
	init_Container();
	init_addMaskBounds();
	init_addMaskLocalBounds();
	StencilMask = class {
		constructor(options) {
			this.priority = 0;
			this.pipe = "stencilMask";
			if (options?.mask) this.init(options.mask);
		}
		init(mask) {
			this.mask = mask;
			this.mask.includeInBuild = false;
			this.mask.measurable = false;
		}
		reset() {
			if (this.mask === null) return;
			this.mask.measurable = true;
			this.mask.includeInBuild = true;
			this.mask = null;
		}
		addBounds(bounds, skipUpdateTransform) {
			addMaskBounds(this.mask, bounds, skipUpdateTransform);
		}
		addLocalBounds(bounds, localRoot) {
			addMaskLocalBounds(this.mask, bounds, localRoot);
		}
		containsPoint(point, hitTestFn) {
			const mask = this.mask;
			return hitTestFn(mask, point);
		}
		destroy() {
			this.reset();
		}
		static test(mask) {
			return mask instanceof Container;
		}
	};
	StencilMask.extension = ExtensionType.MaskEffect;
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/utils/browser/detectVideoAlphaMode.mjs
async function detectVideoAlphaMode() {
	promise ?? (promise = (async () => {
		const gl = DOMAdapter.get().createCanvas(1, 1).getContext("webgl");
		if (!gl) return "premultiply-alpha-on-upload";
		const video = await new Promise((resolve) => {
			const video2 = document.createElement("video");
			video2.onloadeddata = () => resolve(video2);
			video2.onerror = () => resolve(null);
			video2.autoplay = false;
			video2.crossOrigin = "anonymous";
			video2.preload = "auto";
			video2.src = "data:video/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQJChYECGFOAZwEAAAAAAAHTEU2bdLpNu4tTq4QVSalmU6yBoU27i1OrhBZUrmtTrIHGTbuMU6uEElTDZ1OsggEXTbuMU6uEHFO7a1OsggG97AEAAAAAAABZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVSalmoCrXsYMPQkBNgIRMYXZmV0GETGF2ZkSJiEBEAAAAAAAAFlSua8yuAQAAAAAAAEPXgQFzxYgAAAAAAAAAAZyBACK1nIN1bmSIgQCGhVZfVlA5g4EBI+ODhAJiWgDglLCBArqBApqBAlPAgQFVsIRVuYEBElTDZ9Vzc9JjwItjxYgAAAAAAAAAAWfInEWjh0VOQ09ERVJEh49MYXZjIGxpYnZweC12cDlnyKJFo4hEVVJBVElPTkSHlDAwOjAwOjAwLjA0MDAwMDAwMAAAH0O2dcfngQCgwqGggQAAAIJJg0IAABAAFgA4JBwYSgAAICAAEb///4r+AAB1oZ2mm+6BAaWWgkmDQgAAEAAWADgkHBhKAAAgIABIQBxTu2uRu4+zgQC3iveBAfGCAXHwgQM=";
			video2.load();
		});
		if (!video) return "premultiply-alpha-on-upload";
		const texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, texture);
		const framebuffer = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
		gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
		gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
		const pixel = /* @__PURE__ */ new Uint8Array(4);
		gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
		gl.deleteFramebuffer(framebuffer);
		gl.deleteTexture(texture);
		gl.getExtension("WEBGL_lose_context")?.loseContext();
		return pixel[0] <= pixel[3] ? "premultiplied-alpha" : "premultiply-alpha-on-upload";
	})());
	return promise;
}
var promise;
var init_detectVideoAlphaMode = __esmMin((() => {
	init_adapter();
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/VideoSource.mjs
var _VideoSource, VideoSource;
var init_VideoSource = __esmMin((() => {
	init_Extensions();
	init_Ticker();
	init_detectVideoAlphaMode();
	init_TextureSource();
	_VideoSource = class _VideoSource extends TextureSource {
		constructor(options) {
			super(options);
			/** Whether or not the video is ready to play. */
			this.isReady = false;
			/** The upload method for this texture. */
			this.uploadMethodId = "video";
			options = {
				..._VideoSource.defaultOptions,
				...options
			};
			this._autoUpdate = true;
			this._isConnectedToTicker = false;
			this._updateFPS = options.updateFPS || 0;
			this._msToNextUpdate = 0;
			this.autoPlay = options.autoPlay !== false;
			this.alphaMode = options.alphaMode ?? "premultiply-alpha-on-upload";
			this._videoFrameRequestCallback = this._videoFrameRequestCallback.bind(this);
			this._videoFrameRequestCallbackHandle = null;
			this._load = null;
			this._resolve = null;
			this._reject = null;
			this._onCanPlay = this._onCanPlay.bind(this);
			this._onCanPlayThrough = this._onCanPlayThrough.bind(this);
			this._onError = this._onError.bind(this);
			this._onPlayStart = this._onPlayStart.bind(this);
			this._onPlayStop = this._onPlayStop.bind(this);
			this._onSeeked = this._onSeeked.bind(this);
			this._onLoadedMetadata = this._onLoadedMetadata.bind(this);
			if (options.autoLoad !== false) this.load();
		}
		/** Update the video frame if the source is not destroyed and meets certain conditions. */
		updateFrame() {
			if (this.destroyed) return;
			if (this._updateFPS) {
				const elapsedMS = Ticker.shared.elapsedMS * this.resource.playbackRate;
				this._msToNextUpdate = Math.floor(this._msToNextUpdate - elapsedMS);
			}
			if (!this._updateFPS || this._msToNextUpdate <= 0) this._msToNextUpdate = this._updateFPS ? Math.floor(1e3 / this._updateFPS) : 0;
			if (this.isValid) this.update();
		}
		/** Callback to update the video frame and potentially request the next frame update. */
		_videoFrameRequestCallback() {
			this.updateFrame();
			if (this.destroyed) this._videoFrameRequestCallbackHandle = null;
			else this._videoFrameRequestCallbackHandle = this.resource.requestVideoFrameCallback(this._videoFrameRequestCallback);
		}
		/**
		* Checks if the resource has valid dimensions.
		* @returns {boolean} True if width and height are set, otherwise false.
		*/
		get isValid() {
			return !!this.resource.videoWidth && !!this.resource.videoHeight;
		}
		/**
		* Start preloading the video resource.
		* @returns {Promise<this>} Handle the validate event
		*/
		async load() {
			if (this._load) return this._load;
			const source = this.resource;
			const options = this.options;
			if ((source.readyState === source.HAVE_ENOUGH_DATA || source.readyState === source.HAVE_FUTURE_DATA) && source.width && source.height) source.complete = true;
			source.addEventListener("play", this._onPlayStart);
			source.addEventListener("pause", this._onPlayStop);
			source.addEventListener("seeked", this._onSeeked);
			if (!this._isSourceReady()) {
				if (!options.preload) source.addEventListener("canplay", this._onCanPlay);
				source.addEventListener("canplaythrough", this._onCanPlayThrough);
				source.addEventListener("error", this._onError, true);
			} else this._mediaReady();
			if (!this.isValid) source.addEventListener("loadedmetadata", this._onLoadedMetadata);
			this.alphaMode = await detectVideoAlphaMode();
			this._load = new Promise((resolve, reject) => {
				if (this.isValid) resolve(this);
				else {
					this._resolve = resolve;
					this._reject = reject;
					if (options.preloadTimeoutMs !== void 0) this._preloadTimeout = setTimeout(() => {
						this._onError(new ErrorEvent(`Preload exceeded timeout of ${options.preloadTimeoutMs}ms`));
					});
					source.load();
				}
			});
			return this._load;
		}
		/**
		* Handle video error events.
		* @param event - The error event
		*/
		_onError(event) {
			this.resource.removeEventListener("error", this._onError, true);
			this.emit("error", event);
			if (this._reject) {
				this._reject(event);
				this._reject = null;
				this._resolve = null;
			}
		}
		/**
		* Checks if the underlying source is playing.
		* @returns True if playing.
		*/
		_isSourcePlaying() {
			const source = this.resource;
			return !source.paused && !source.ended;
		}
		/**
		* Checks if the underlying source is ready for playing.
		* @returns True if ready.
		*/
		_isSourceReady() {
			return this.resource.readyState > 2;
		}
		/** Runs the update loop when the video is ready to play. */
		_onPlayStart() {
			this._configureAutoUpdate();
		}
		/** Stops the update loop when a pause event is triggered. */
		_onPlayStop() {
			this._configureAutoUpdate();
		}
		/** Handles behavior when the video completes seeking to the current playback position. */
		_onSeeked() {
			if (this._autoUpdate && !this._isSourcePlaying()) {
				this._msToNextUpdate = 0;
				this.updateFrame();
				this._msToNextUpdate = 0;
			}
		}
		/** When intrinsic size becomes known after play / canplay (common with MediaStream). */
		_onLoadedMetadata() {
			if (!this.isValid) return;
			this._mediaReady();
		}
		_onCanPlay() {
			this.resource.removeEventListener("canplay", this._onCanPlay);
			this._mediaReady();
		}
		_onCanPlayThrough() {
			this.resource.removeEventListener("canplaythrough", this._onCanPlayThrough);
			if (this._preloadTimeout) {
				clearTimeout(this._preloadTimeout);
				this._preloadTimeout = void 0;
			}
			this._mediaReady();
		}
		/** Fired when the video is loaded and ready to play. */
		_mediaReady() {
			const source = this.resource;
			if (this.isValid) {
				this.isReady = true;
				this.resize(source.videoWidth, source.videoHeight);
			}
			this._msToNextUpdate = 0;
			this.updateFrame();
			this._msToNextUpdate = 0;
			if (this._resolve && this.isValid) {
				this._resolve(this);
				this._resolve = null;
				this._reject = null;
			}
			if (this._isSourcePlaying()) this._onPlayStart();
			else if (this.autoPlay) this.resource.play();
		}
		/** Cleans up resources and event listeners associated with this texture. */
		destroy() {
			this._configureAutoUpdate();
			const source = this.resource;
			if (source) {
				source.removeEventListener("play", this._onPlayStart);
				source.removeEventListener("pause", this._onPlayStop);
				source.removeEventListener("seeked", this._onSeeked);
				source.removeEventListener("canplay", this._onCanPlay);
				source.removeEventListener("canplaythrough", this._onCanPlayThrough);
				source.removeEventListener("loadedmetadata", this._onLoadedMetadata);
				source.removeEventListener("error", this._onError, true);
				source.pause();
				source.src = "";
				source.load();
			}
			super.destroy();
		}
		/** Should the base texture automatically update itself, set to true by default. */
		get autoUpdate() {
			return this._autoUpdate;
		}
		set autoUpdate(value) {
			if (value !== this._autoUpdate) {
				this._autoUpdate = value;
				this._configureAutoUpdate();
			}
		}
		/**
		* How many times a second to update the texture from the video.
		* Leave at 0 to update at every render.
		* A lower fps can help performance, as updating the texture at 60fps on a 30ps video may not be efficient.
		*/
		get updateFPS() {
			return this._updateFPS;
		}
		set updateFPS(value) {
			if (value !== this._updateFPS) {
				this._updateFPS = value;
				this._configureAutoUpdate();
			}
		}
		/**
		* Configures the updating mechanism based on the current state and settings.
		*
		* This method decides between using the browser's native video frame callback or a custom ticker
		* for updating the video frame. It ensures optimal performance and responsiveness
		* based on the video's state, playback status, and the desired frames-per-second setting.
		*
		* - If `_autoUpdate` is enabled and the video source is playing:
		*   - It will prefer the native video frame callback if available and no specific FPS is set.
		*   - Otherwise, it will use a custom ticker for manual updates.
		* - If `_autoUpdate` is disabled or the video isn't playing, any active update mechanisms are halted.
		*/
		_configureAutoUpdate() {
			if (this._autoUpdate && this._isSourcePlaying()) if (!this._updateFPS && this.resource.requestVideoFrameCallback) {
				if (this._isConnectedToTicker) {
					Ticker.shared.remove(this.updateFrame, this);
					this._isConnectedToTicker = false;
					this._msToNextUpdate = 0;
				}
				if (this._videoFrameRequestCallbackHandle === null) this._videoFrameRequestCallbackHandle = this.resource.requestVideoFrameCallback(this._videoFrameRequestCallback);
			} else {
				if (this._videoFrameRequestCallbackHandle !== null) {
					this.resource.cancelVideoFrameCallback(this._videoFrameRequestCallbackHandle);
					this._videoFrameRequestCallbackHandle = null;
				}
				if (!this._isConnectedToTicker) {
					Ticker.shared.add(this.updateFrame, this);
					this._isConnectedToTicker = true;
					this._msToNextUpdate = 0;
				}
			}
			else {
				if (this._videoFrameRequestCallbackHandle !== null) {
					this.resource.cancelVideoFrameCallback(this._videoFrameRequestCallbackHandle);
					this._videoFrameRequestCallbackHandle = null;
				}
				if (this._isConnectedToTicker) {
					Ticker.shared.remove(this.updateFrame, this);
					this._isConnectedToTicker = false;
					this._msToNextUpdate = 0;
				}
			}
		}
		static test(resource) {
			return globalThis.HTMLVideoElement && resource instanceof HTMLVideoElement;
		}
	};
	_VideoSource.extension = ExtensionType.TextureSource;
	/** The default options for video sources. */
	_VideoSource.defaultOptions = {
		...TextureSource.defaultOptions,
		/** If true, the video will start loading immediately. */
		autoLoad: true,
		/** If true, the video will start playing as soon as it is loaded. */
		autoPlay: true,
		/** The number of times a second to update the texture from the video. Leave at 0 to update at every render. */
		updateFPS: 0,
		/** If true, the video will be loaded with the `crossorigin` attribute. */
		crossorigin: true,
		/** If true, the video will loop when it ends. */
		loop: false,
		/** If true, the video will be muted. */
		muted: true,
		/** If true, the video will play inline. */
		playsinline: true,
		/** If true, the video will be preloaded. */
		preload: false
	};
	/**
	* Map of video MIME types that can't be directly derived from file extensions.
	* @readonly
	*/
	_VideoSource.MIME_TYPES = {
		ogv: "video/ogg",
		mov: "video/quicktime",
		m4v: "video/mp4"
	};
	VideoSource = _VideoSource;
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/assets/utils/convertToList.mjs
var convertToList;
var init_convertToList = __esmMin((() => {
	convertToList = (input, transform, forceTransform = false) => {
		if (!Array.isArray(input)) input = [input];
		if (!transform) return input;
		return input.map((item) => {
			if (typeof item === "string" || forceTransform) return transform(item);
			return item;
		});
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/assets/cache/Cache.mjs
var CacheClass, Cache;
var init_Cache = __esmMin((() => {
	init_warn();
	init_convertToList();
	CacheClass = class {
		constructor() {
			this._parsers = [];
			this._cache = /* @__PURE__ */ new Map();
			this._cacheMap = /* @__PURE__ */ new Map();
		}
		/** Clear all entries. */
		reset() {
			this._cacheMap.clear();
			this._cache.clear();
		}
		/**
		* Check if the key exists
		* @param key - The key to check
		*/
		has(key) {
			return this._cache.has(key);
		}
		/**
		* Fetch entry by key
		* @param key - The key of the entry to get
		*/
		get(key) {
			const result = this._cache.get(key);
			if (!result) warn(`[Assets] Asset id ${key} was not found in the Cache`);
			return result;
		}
		/**
		* Set a value by key or keys name
		* @param key - The key or keys to set
		* @param value - The value to store in the cache or from which cacheable assets will be derived.
		*/
		set(key, value) {
			const keys = convertToList(key);
			let cacheableAssets;
			for (let i = 0; i < this.parsers.length; i++) {
				const parser = this.parsers[i];
				if (parser.test(value)) {
					cacheableAssets = parser.getCacheableAssets(keys, value);
					break;
				}
			}
			const cacheableMap = new Map(Object.entries(cacheableAssets || {}));
			if (!cacheableAssets) keys.forEach((key2) => {
				cacheableMap.set(key2, value);
			});
			const cacheKeys = [...cacheableMap.keys()];
			const cachedAssets = {
				cacheKeys,
				keys
			};
			keys.forEach((key2) => {
				this._cacheMap.set(key2, cachedAssets);
			});
			cacheKeys.forEach((key2) => {
				const val = cacheableAssets ? cacheableAssets[key2] : value;
				if (this._cache.has(key2) && this._cache.get(key2) !== val) warn("[Cache] already has key:", key2);
				this._cache.set(key2, cacheableMap.get(key2));
			});
		}
		/**
		* Remove entry by key
		*
		* This function will also remove any associated alias from the cache also.
		* @param key - The key of the entry to remove
		*/
		remove(key) {
			if (!this._cacheMap.has(key)) {
				warn(`[Assets] Asset id ${key} was not found in the Cache`);
				return;
			}
			const cacheMap = this._cacheMap.get(key);
			cacheMap.cacheKeys.forEach((key2) => {
				this._cache.delete(key2);
			});
			cacheMap.keys.forEach((key2) => {
				this._cacheMap.delete(key2);
			});
		}
		/**
		* All loader parsers registered
		* @advanced
		*/
		get parsers() {
			return this._parsers;
		}
	};
	Cache = new CacheClass();
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/shared/texture/utils/textureFrom.mjs
function textureSourceFrom(options = {}) {
	const hasResource = options && options.resource;
	const res = hasResource ? options.resource : options;
	const opts = hasResource ? options : { resource: options };
	for (let i = 0; i < sources.length; i++) {
		const Source = sources[i];
		if (Source.test(res)) return new Source(opts);
	}
	throw new Error(`Could not find a source type for resource: ${opts.resource}`);
}
function resourceToTexture(options = {}, skipCache = false) {
	const hasResource = options && options.resource;
	const resource = hasResource ? options.resource : options;
	const opts = hasResource ? options : { resource: options };
	if (!skipCache && Cache.has(resource)) return Cache.get(resource);
	const texture = new Texture({ source: textureSourceFrom(opts) });
	texture.on("destroy", () => {
		if (Cache.has(resource)) Cache.remove(resource);
	});
	if (!skipCache) Cache.set(resource, texture);
	return texture;
}
function textureFrom(id, skipCache = false) {
	if (typeof id === "string") return Cache.get(id);
	else if (id instanceof TextureSource) return new Texture({ source: id });
	return resourceToTexture(id, skipCache);
}
var sources;
var init_textureFrom = __esmMin((() => {
	init_Cache();
	init_Extensions();
	init_TextureSource();
	init_Texture();
	sources = [];
	extensions.handleByList(ExtensionType.TextureSource, sources);
	Texture.from = textureFrom;
	TextureSource.from = textureSourceFrom;
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/init.mjs
var init_init$1 = __esmMin((() => {
	init_Extensions();
	init_AlphaMask();
	init_ColorMask();
	init_StencilMask();
	init_BufferImageSource();
	init_CanvasSource();
	init_ImageSource();
	init_VideoSource();
	init_textureFrom();
	extensions.add(AlphaMask, ColorMask, StencilMask, VideoSource, ImageSource, CanvasSource, BufferImageSource);
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/assets/loader/parsers/LoaderParser.mjs
var LoaderParserPriority;
var init_LoaderParser = __esmMin((() => {
	LoaderParserPriority = /* @__PURE__ */ ((LoaderParserPriority2) => {
		LoaderParserPriority2[LoaderParserPriority2["Low"] = 0] = "Low";
		LoaderParserPriority2[LoaderParserPriority2["Normal"] = 1] = "Normal";
		LoaderParserPriority2[LoaderParserPriority2["High"] = 2] = "High";
		return LoaderParserPriority2;
	})(LoaderParserPriority || {});
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/utils/path.mjs
function assertPath(path2) {
	if (typeof path2 !== "string") throw new TypeError(`Path must be a string. Received ${JSON.stringify(path2)}`);
}
function removeUrlParams(url) {
	return url.split("?")[0].split("#")[0];
}
function escapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function replaceAll(str, find, replace) {
	return str.replace(new RegExp(escapeRegExp(find), "g"), replace);
}
function normalizeStringPosix(path2, allowAboveRoot) {
	let res = "";
	let lastSegmentLength = 0;
	let lastSlash = -1;
	let dots = 0;
	let code = -1;
	for (let i = 0; i <= path2.length; ++i) {
		if (i < path2.length) code = path2.charCodeAt(i);
		else if (code === 47) break;
		else code = 47;
		if (code === 47) {
			if (lastSlash === i - 1 || dots === 1) {} else if (lastSlash !== i - 1 && dots === 2) {
				if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 || res.charCodeAt(res.length - 2) !== 46) {
					if (res.length > 2) {
						const lastSlashIndex = res.lastIndexOf("/");
						if (lastSlashIndex !== res.length - 1) {
							if (lastSlashIndex === -1) {
								res = "";
								lastSegmentLength = 0;
							} else {
								res = res.slice(0, lastSlashIndex);
								lastSegmentLength = res.length - 1 - res.lastIndexOf("/");
							}
							lastSlash = i;
							dots = 0;
							continue;
						}
					} else if (res.length === 2 || res.length === 1) {
						res = "";
						lastSegmentLength = 0;
						lastSlash = i;
						dots = 0;
						continue;
					}
				}
				if (allowAboveRoot) {
					if (res.length > 0) res += "/..";
					else res = "..";
					lastSegmentLength = 2;
				}
			} else {
				if (res.length > 0) res += `/${path2.slice(lastSlash + 1, i)}`;
				else res = path2.slice(lastSlash + 1, i);
				lastSegmentLength = i - lastSlash - 1;
			}
			lastSlash = i;
			dots = 0;
		} else if (code === 46 && dots !== -1) ++dots;
		else dots = -1;
	}
	return res;
}
var path;
var init_path = __esmMin((() => {
	init_adapter();
	path = {
		/**
		* Converts a path to posix format.
		* @param path - The path to convert to posix
		* @example
		* ```ts
		* // Convert a Windows path to POSIX format
		* path.toPosix('C:\\Users\\User\\Documents\\file.txt');
		* // -> 'C:/Users/User/Documents/file.txt'
		* ```
		*/
		toPosix(path2) {
			return replaceAll(path2, "\\", "/");
		},
		/**
		* Checks if the path is a URL e.g. http://, https://
		* @param path - The path to check
		* @example
		* ```ts
		* // Check if a path is a URL
		* path.isUrl('http://www.example.com');
		* // -> true
		* path.isUrl('C:/Users/User/Documents/file.txt');
		* // -> false
		* ```
		*/
		isUrl(path2) {
			return /^https?:/.test(this.toPosix(path2));
		},
		/**
		* Checks if the path is a data URL
		* @param path - The path to check
		* @example
		* ```ts
		* // Check if a path is a data URL
		* path.isDataUrl('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA...');
		* // -> true
		* ```
		*/
		isDataUrl(path2) {
			return /^data:([a-z]+\/[a-z0-9-+.]+(;[a-z0-9-.!#$%*+.{}|~`]+=[a-z0-9-.!#$%*+.{}()_|~`]+)*)?(;base64)?,([a-z0-9!$&',()*+;=\-._~:@\/?%\s<>]*?)$/i.test(path2);
		},
		/**
		* Checks if the path is a blob URL
		* @param path - The path to check
		* @example
		* ```ts
		* // Check if a path is a blob URL
		* path.isBlobUrl('blob:http://www.example.com/12345678-1234-1234-1234-123456789012');
		* // -> true
		* ```
		*/
		isBlobUrl(path2) {
			return path2.startsWith("blob:");
		},
		/**
		* Checks if the path has a protocol e.g. http://, https://, file:///, data:, blob:, C:/
		* This will return true for windows file paths
		* @param path - The path to check
		* @example
		* ```ts
		* // Check if a path has a protocol
		* path.hasProtocol('http://www.example.com');
		* // -> true
		* path.hasProtocol('C:/Users/User/Documents/file.txt');
		* // -> true
		* ```
		*/
		hasProtocol(path2) {
			return /^[^/:]+:/.test(this.toPosix(path2));
		},
		/**
		* Returns the protocol of the path e.g. http://, https://, file:///, data:, blob:, C:/
		* @param path - The path to get the protocol from
		* @example
		* ```ts
		* // Get the protocol from a URL
		* path.getProtocol('http://www.example.com/path/to/resource');
		* // -> 'http://'
		* // Get the protocol from a file path
		* path.getProtocol('C:/Users/User/Documents/file.txt');
		* // -> 'C:/'
		* ```
		*/
		getProtocol(path2) {
			assertPath(path2);
			path2 = this.toPosix(path2);
			const matchFile = /^file:\/\/\//.exec(path2);
			if (matchFile) return matchFile[0];
			const matchProtocol = /^[^/:]+:\/{0,2}/.exec(path2);
			if (matchProtocol) return matchProtocol[0];
			return "";
		},
		/**
		* Converts URL to an absolute path.
		* When loading from a Web Worker, we must use absolute paths.
		* If the URL is already absolute we return it as is
		* If it's not, we convert it
		* @param url - The URL to test
		* @param customBaseUrl - The base URL to use
		* @param customRootUrl - The root URL to use
		* @example
		* ```ts
		* // Convert a relative URL to an absolute path
		* path.toAbsolute('images/texture.png', 'http://example.com/assets/');
		* // -> 'http://example.com/assets/images/texture.png'
		* ```
		*/
		toAbsolute(url, customBaseUrl, customRootUrl) {
			assertPath(url);
			if (this.isDataUrl(url) || this.isBlobUrl(url)) return url;
			const baseUrl = removeUrlParams(this.toPosix(customBaseUrl ?? DOMAdapter.get().getBaseUrl()));
			const rootUrl = removeUrlParams(this.toPosix(customRootUrl ?? this.rootname(baseUrl)));
			url = this.toPosix(url);
			if (url.startsWith("/")) return path.join(rootUrl, url.slice(1));
			return this.isAbsolute(url) ? url : this.join(baseUrl, url);
		},
		/**
		* Normalizes the given path, resolving '..' and '.' segments
		* @param path - The path to normalize
		* @example
		* ```ts
		* // Normalize a path with relative segments
		* path.normalize('http://www.example.com/foo/bar/../baz');
		* // -> 'http://www.example.com/foo/baz'
		* // Normalize a file path with relative segments
		* path.normalize('C:\\Users\\User\\Documents\\..\\file.txt');
		* // -> 'C:/Users/User/file.txt'
		* ```
		*/
		normalize(path2) {
			assertPath(path2);
			if (path2.length === 0) return ".";
			if (this.isDataUrl(path2) || this.isBlobUrl(path2)) return path2;
			path2 = this.toPosix(path2);
			let protocol = "";
			const isAbsolute = path2.startsWith("/");
			if (this.hasProtocol(path2)) {
				protocol = this.rootname(path2);
				path2 = path2.slice(protocol.length);
			}
			const trailingSeparator = path2.endsWith("/");
			path2 = normalizeStringPosix(path2, false);
			if (path2.length > 0 && trailingSeparator) path2 += "/";
			if (isAbsolute) return `/${path2}`;
			return protocol + path2;
		},
		/**
		* Determines if path is an absolute path.
		* Absolute paths can be urls, data urls, or paths on disk
		* @param path - The path to test
		* @example
		* ```ts
		* // Check if a path is absolute
		* path.isAbsolute('http://www.example.com/foo/bar');
		* // -> true
		* path.isAbsolute('C:/Users/User/Documents/file.txt');
		* // -> true
		* ```
		*/
		isAbsolute(path2) {
			assertPath(path2);
			path2 = this.toPosix(path2);
			if (this.hasProtocol(path2)) return true;
			return path2.startsWith("/");
		},
		/**
		* Joins all given path segments together using the platform-specific separator as a delimiter,
		* then normalizes the resulting path
		* @param segments - The segments of the path to join
		* @example
		* ```ts
		* // Join multiple path segments
		* path.join('assets', 'images', 'sprite.png');
		* // -> 'assets/images/sprite.png'
		* // Join with relative segments
		* path.join('assets', 'images', '../textures', 'sprite.png');
		* // -> 'assets/textures/sprite.png'
		* ```
		*/
		join(...segments) {
			if (segments.length === 0) return ".";
			let joined;
			for (let i = 0; i < segments.length; ++i) {
				const arg = segments[i];
				assertPath(arg);
				if (arg.length > 0) if (joined === void 0) joined = arg;
				else {
					const prevArg = segments[i - 1] ?? "";
					if (this.joinExtensions.includes(this.extname(prevArg).toLowerCase())) joined += `/../${arg}`;
					else joined += `/${arg}`;
				}
			}
			if (joined === void 0) return ".";
			return this.normalize(joined);
		},
		/**
		* Returns the directory name of a path
		* @param path - The path to parse
		* @example
		* ```ts
		* // Get the directory name of a path
		* path.dirname('http://www.example.com/foo/bar/baz.png');
		* // -> 'http://www.example.com/foo/bar'
		* // Get the directory name of a file path
		* path.dirname('C:/Users/User/Documents/file.txt');
		* // -> 'C:/Users/User/Documents'
		* ```
		*/
		dirname(path2) {
			assertPath(path2);
			if (path2.length === 0) return ".";
			path2 = this.toPosix(path2);
			let code = path2.charCodeAt(0);
			const hasRoot = code === 47;
			let end = -1;
			let matchedSlash = true;
			const proto = this.getProtocol(path2);
			const origpath = path2;
			path2 = path2.slice(proto.length);
			for (let i = path2.length - 1; i >= 1; --i) {
				code = path2.charCodeAt(i);
				if (code === 47) {
					if (!matchedSlash) {
						end = i;
						break;
					}
				} else matchedSlash = false;
			}
			if (end === -1) return hasRoot ? "/" : this.isUrl(origpath) ? proto + path2 : proto;
			if (hasRoot && end === 1) return "//";
			return proto + path2.slice(0, end);
		},
		/**
		* Returns the root of the path e.g. /, C:/, file:///, http://domain.com/
		* @param path - The path to parse
		* @example
		* ```ts
		* // Get the root of a URL
		* path.rootname('http://www.example.com/foo/bar/baz.png');
		* // -> 'http://www.example.com/'
		* // Get the root of a file path
		* path.rootname('C:/Users/User/Documents/file.txt');
		* // -> 'C:/'
		* ```
		*/
		rootname(path2) {
			assertPath(path2);
			path2 = this.toPosix(path2);
			let root = "";
			if (path2.startsWith("/")) root = "/";
			else root = this.getProtocol(path2);
			if (this.isUrl(path2)) {
				const index = path2.indexOf("/", root.length);
				if (index !== -1) root = path2.slice(0, index);
				else root = path2;
				if (!root.endsWith("/")) root += "/";
			}
			return root;
		},
		/**
		* Returns the last portion of a path
		* @param path - The path to test
		* @param ext - Optional extension to remove
		* @example
		* ```ts
		* // Get the basename of a URL
		* path.basename('http://www.example.com/foo/bar/baz.png');
		* // -> 'baz.png'
		* // Get the basename of a file path
		* path.basename('C:/Users/User/Documents/file.txt');
		* // -> 'file.txt'
		* ```
		*/
		basename(path2, ext) {
			assertPath(path2);
			if (ext) assertPath(ext);
			path2 = removeUrlParams(this.toPosix(path2));
			let start = 0;
			let end = -1;
			let matchedSlash = true;
			let i;
			if (ext !== void 0 && ext.length > 0 && ext.length <= path2.length) {
				if (ext.length === path2.length && ext === path2) return "";
				let extIdx = ext.length - 1;
				let firstNonSlashEnd = -1;
				for (i = path2.length - 1; i >= 0; --i) {
					const code = path2.charCodeAt(i);
					if (code === 47) {
						if (!matchedSlash) {
							start = i + 1;
							break;
						}
					} else {
						if (firstNonSlashEnd === -1) {
							matchedSlash = false;
							firstNonSlashEnd = i + 1;
						}
						if (extIdx >= 0) if (code === ext.charCodeAt(extIdx)) {
							if (--extIdx === -1) end = i;
						} else {
							extIdx = -1;
							end = firstNonSlashEnd;
						}
					}
				}
				if (start === end) end = firstNonSlashEnd;
				else if (end === -1) end = path2.length;
				return path2.slice(start, end);
			}
			for (i = path2.length - 1; i >= 0; --i) if (path2.charCodeAt(i) === 47) {
				if (!matchedSlash) {
					start = i + 1;
					break;
				}
			} else if (end === -1) {
				matchedSlash = false;
				end = i + 1;
			}
			if (end === -1) return "";
			return path2.slice(start, end);
		},
		/**
		* Returns the extension of the path, from the last occurrence of the . (period) character to end of string in the last
		* portion of the path. If there is no . in the last portion of the path, or if there are no . characters other than
		* the first character of the basename of path, an empty string is returned.
		* @param path - The path to parse
		* @example
		* ```ts
		* // Get the extension of a URL
		* path.extname('http://www.example.com/foo/bar/baz.png');
		* // -> '.png'
		* // Get the extension of a file path
		* path.extname('C:/Users/User/Documents/file.txt');
		* // -> '.txt'
		* ```
		*/
		extname(path2) {
			assertPath(path2);
			path2 = removeUrlParams(this.toPosix(path2));
			let startDot = -1;
			let startPart = 0;
			let end = -1;
			let matchedSlash = true;
			let preDotState = 0;
			for (let i = path2.length - 1; i >= 0; --i) {
				const code = path2.charCodeAt(i);
				if (code === 47) {
					if (!matchedSlash) {
						startPart = i + 1;
						break;
					}
					continue;
				}
				if (end === -1) {
					matchedSlash = false;
					end = i + 1;
				}
				if (code === 46) {
					if (startDot === -1) startDot = i;
					else if (preDotState !== 1) preDotState = 1;
				} else if (startDot !== -1) preDotState = -1;
			}
			if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) return "";
			return path2.slice(startDot, end);
		},
		/**
		* Parses a path into an object containing the 'root', `dir`, `base`, `ext`, and `name` properties.
		* @param path - The path to parse
		* @example
		* ```ts
		* // Parse a URL
		* const parsed = path.parse('http://www.example.com/foo/bar/baz.png');
		* // -> {
		* //   root: 'http://www.example.com/',
		* //   dir: 'http://www.example.com/foo/bar',
		* //   base: 'baz.png',
		* //   ext: '.png',
		* //   name: 'baz'
		* // }
		* // Parse a file path
		* const parsedFile = path.parse('C:/Users/User/Documents/file.txt');
		* // -> {
		* //   root: 'C:/',
		* //   dir: 'C:/Users/User/Documents',
		* //   base: 'file.txt',
		* //   ext: '.txt',
		* //   name: 'file'
		* // }
		* ```
		*/
		parse(path2) {
			assertPath(path2);
			const ret = {
				root: "",
				dir: "",
				base: "",
				ext: "",
				name: ""
			};
			if (path2.length === 0) return ret;
			path2 = removeUrlParams(this.toPosix(path2));
			let code = path2.charCodeAt(0);
			const isAbsolute = this.isAbsolute(path2);
			let start;
			ret.root = this.rootname(path2);
			if (isAbsolute || this.hasProtocol(path2)) start = 1;
			else start = 0;
			let startDot = -1;
			let startPart = 0;
			let end = -1;
			let matchedSlash = true;
			let i = path2.length - 1;
			let preDotState = 0;
			for (; i >= start; --i) {
				code = path2.charCodeAt(i);
				if (code === 47) {
					if (!matchedSlash) {
						startPart = i + 1;
						break;
					}
					continue;
				}
				if (end === -1) {
					matchedSlash = false;
					end = i + 1;
				}
				if (code === 46) {
					if (startDot === -1) startDot = i;
					else if (preDotState !== 1) preDotState = 1;
				} else if (startDot !== -1) preDotState = -1;
			}
			if (startDot === -1 || end === -1 || preDotState === 0 || preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
				if (end !== -1) if (startPart === 0 && isAbsolute) ret.base = ret.name = path2.slice(1, end);
				else ret.base = ret.name = path2.slice(startPart, end);
			} else {
				if (startPart === 0 && isAbsolute) {
					ret.name = path2.slice(1, startDot);
					ret.base = path2.slice(1, end);
				} else {
					ret.name = path2.slice(startPart, startDot);
					ret.base = path2.slice(startPart, end);
				}
				ret.ext = path2.slice(startDot, end);
			}
			ret.dir = this.dirname(path2);
			return ret;
		},
		sep: "/",
		delimiter: ":",
		joinExtensions: [".html"]
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/assets/utils/createStringVariations.mjs
function processX(base, ids, depth, result, tags) {
	const id = ids[depth];
	for (let i = 0; i < id.length; i++) {
		const value = id[i];
		if (depth < ids.length - 1) processX(base.replace(result[depth], value), ids, depth + 1, result, tags);
		else tags.push(base.replace(result[depth], value));
	}
}
function createStringVariations(string) {
	const result = string.match(/\{(.*?)\}/g);
	const tags = [];
	if (result) {
		const ids = [];
		result.forEach((vars) => {
			const split = vars.substring(1, vars.length - 1).split(",");
			ids.push(split);
		});
		processX(string, ids, 0, result, tags);
	} else tags.push(string);
	return tags;
}
var init_createStringVariations = __esmMin((() => {}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/assets/utils/isSingleItem.mjs
var isSingleItem;
var init_isSingleItem = __esmMin((() => {
	isSingleItem = (item) => !Array.isArray(item);
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/assets/resolver/Resolver.mjs
function getUrlExtension(url) {
	return url.split(".").pop().split("?").shift().split("#").shift();
}
var Resolver;
var init_Resolver = __esmMin((() => {
	init_warn();
	init_path();
	init_convertToList();
	init_createStringVariations();
	init_isSingleItem();
	Resolver = class {
		constructor() {
			this._defaultBundleIdentifierOptions = {
				connector: "-",
				createBundleAssetId: (bundleId, assetId) => `${bundleId}${this._bundleIdConnector}${assetId}`,
				extractAssetIdFromBundle: (bundleId, assetBundleId) => assetBundleId.replace(`${bundleId}${this._bundleIdConnector}`, "")
			};
			/** The character that is used to connect the bundleId and the assetId when generating a bundle asset id key */
			this._bundleIdConnector = this._defaultBundleIdentifierOptions.connector;
			/**
			* A function that generates a bundle asset id key from a bundleId and an assetId
			* @param bundleId - the bundleId
			* @param assetId  - the assetId
			* @returns the bundle asset id key
			*/
			this._createBundleAssetId = this._defaultBundleIdentifierOptions.createBundleAssetId;
			/**
			* A function that generates an assetId from a bundle asset id key. This is the reverse of generateBundleAssetId
			* @param bundleId - the bundleId
			* @param assetBundleId - the bundle asset id key
			* @returns the assetId
			*/
			this._extractAssetIdFromBundle = this._defaultBundleIdentifierOptions.extractAssetIdFromBundle;
			this._assetMap = {};
			this._preferredOrder = [];
			this._parsers = [];
			this._resolverHash = {};
			this._bundles = {};
		}
		/**
		* Override how the resolver deals with generating bundle ids.
		* must be called before any bundles are added
		* @param bundleIdentifier - the bundle identifier options
		*/
		setBundleIdentifier(bundleIdentifier) {
			this._bundleIdConnector = bundleIdentifier.connector ?? this._bundleIdConnector;
			this._createBundleAssetId = bundleIdentifier.createBundleAssetId ?? this._createBundleAssetId;
			this._extractAssetIdFromBundle = bundleIdentifier.extractAssetIdFromBundle ?? this._extractAssetIdFromBundle;
			if (this._extractAssetIdFromBundle("foo", this._createBundleAssetId("foo", "bar")) !== "bar") throw new Error("[Resolver] GenerateBundleAssetId are not working correctly");
		}
		/**
		* Let the resolver know which assets you prefer to use when resolving assets.
		* Multiple prefer user defined rules can be added.
		* @example
		* resolver.prefer({
		*     // first look for something with the correct format, and then then correct resolution
		*     priority: ['format', 'resolution'],
		*     params:{
		*         format:'webp', // prefer webp images
		*         resolution: 2, // prefer a resolution of 2
		*     }
		* })
		* resolver.add('foo', ['bar@2x.webp', 'bar@2x.png', 'bar.webp', 'bar.png']);
		* resolver.resolveUrl('foo') // => 'bar@2x.webp'
		* @param preferOrders - the prefer options
		*/
		prefer(...preferOrders) {
			preferOrders.forEach((prefer) => {
				this._preferredOrder.push(prefer);
				if (!prefer.priority) prefer.priority = Object.keys(prefer.params);
			});
			this._resolverHash = {};
		}
		/**
		* Set the base path to prepend to all urls when resolving
		* @example
		* resolver.basePath = 'https://home.com/';
		* resolver.add('foo', 'bar.ong');
		* resolver.resolveUrl('foo', 'bar.png'); // => 'https://home.com/bar.png'
		* @param basePath - the base path to use
		*/
		set basePath(basePath) {
			this._basePath = basePath;
		}
		get basePath() {
			return this._basePath;
		}
		/**
		* Set the root path for root-relative URLs. By default the `basePath`'s root is used. If no `basePath` is set, then the
		* default value for browsers is `window.location.origin`
		* @example
		* // Application hosted on https://home.com/some-path/index.html
		* resolver.basePath = 'https://home.com/some-path/';
		* resolver.rootPath = 'https://home.com/';
		* resolver.add('foo', '/bar.png');
		* resolver.resolveUrl('foo', '/bar.png'); // => 'https://home.com/bar.png'
		* @param rootPath - the root path to use
		*/
		set rootPath(rootPath) {
			this._rootPath = rootPath;
		}
		get rootPath() {
			return this._rootPath;
		}
		/**
		* All the active URL parsers that help the parser to extract information and create
		* an asset object-based on parsing the URL itself.
		*
		* Can be added using the extensions API
		* @example
		* resolver.add('foo', [
		*     {
		*         resolution: 2,
		*         format: 'png',
		*         src: 'image@2x.png',
		*     },
		*     {
		*         resolution:1,
		*         format:'png',
		*         src: 'image.png',
		*     },
		* ]);
		*
		* // With a url parser the information such as resolution and file format could extracted from the url itself:
		* extensions.add({
		*     extension: ExtensionType.ResolveParser,
		*     test: loadTextures.test, // test if url ends in an image
		*     parse: (value: string) =>
		*     ({
		*         resolution: parseFloat(Resolver.RETINA_PREFIX.exec(value)?.[1] ?? '1'),
		*         format: value.split('.').pop(),
		*         src: value,
		*     }),
		* });
		*
		* // Now resolution and format can be extracted from the url
		* resolver.add('foo', [
		*     'image@2x.png',
		*     'image.png',
		* ]);
		*/
		get parsers() {
			return this._parsers;
		}
		/** Used for testing, this resets the resolver to its initial state */
		reset() {
			this.setBundleIdentifier(this._defaultBundleIdentifierOptions);
			this._assetMap = {};
			this._preferredOrder = [];
			this._resolverHash = {};
			this._rootPath = null;
			this._basePath = null;
			this._manifest = null;
			this._bundles = {};
			this._defaultSearchParams = null;
		}
		/**
		* Sets the default URL search parameters for the URL resolver. The urls can be specified as a string or an object.
		* @param searchParams - the default url parameters to append when resolving urls
		*/
		setDefaultSearchParams(searchParams) {
			if (typeof searchParams === "string") this._defaultSearchParams = searchParams;
			else {
				const queryValues = searchParams;
				this._defaultSearchParams = Object.keys(queryValues).map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(queryValues[key])}`).join("&");
			}
		}
		/**
		* Returns the aliases for a given asset
		* @param asset - the asset to get the aliases for
		*/
		getAlias(asset) {
			const { alias, src } = asset;
			return convertToList(alias || src, (value) => {
				if (typeof value === "string") return value;
				if (Array.isArray(value)) return value.map((v) => v?.src ?? v);
				if (value?.src) return value.src;
				return value;
			}, true);
		}
		/**
		* Removes the specified alias for an asset.
		*
		* This only removes the alias mapping. It does **not** remove, unload, or destroy the
		* underlying asset. If the asset is already cached, it stays in memory until you call
		* `Assets.unload`.
		*
		* If `asset` is provided, the alias is only removed when the resolver's current mapping for
		* that alias matches the given `ResolvedAsset`. This lets you avoid accidentally removing an
		* alias that has been reassigned.
		*
		* Silently returns if the alias does not exist or the asset does not match.
		* @param alias - the alias to remove
		* @param asset - only remove the alias if it is currently assigned to this asset
		* @example
		* ```ts
		* resolver.add({ alias: 'hero', src: 'hero.png' });
		*
		* // Simple removal
		* resolver.removeAlias('hero');
		*
		* // Conditional removal — only if alias currently maps to a specific asset
		* const resolved = resolver.resolve('hero');
		* resolver.removeAlias('hero', resolved);
		* ```
		*/
		removeAlias(alias, asset) {
			if (!this._assetMap[alias]) return;
			if (asset && asset !== this._resolverHash[alias]) return;
			delete this._resolverHash[alias];
			delete this._assetMap[alias];
		}
		/**
		* Add a manifest to the asset resolver. This is a nice way to add all the asset information in one go.
		* generally a manifest would be built using a tool.
		* @param manifest - the manifest to add to the resolver
		*/
		addManifest(manifest) {
			if (this._manifest) warn("[Resolver] Manifest already exists, this will be overwritten");
			this._manifest = manifest;
			manifest.bundles.forEach((bundle) => {
				this.addBundle(bundle.name, bundle.assets);
			});
		}
		/**
		* This adds a bundle of assets in one go so that you can resolve them as a group.
		* For example you could add a bundle for each screen in you pixi app
		* @example
		* resolver.addBundle('animals', [
		*  { alias: 'bunny', src: 'bunny.png' },
		*  { alias: 'chicken', src: 'chicken.png' },
		*  { alias: 'thumper', src: 'thumper.png' },
		* ]);
		* // or
		* resolver.addBundle('animals', {
		*     bunny: 'bunny.png',
		*     chicken: 'chicken.png',
		*     thumper: 'thumper.png',
		* });
		*
		* const resolvedAssets = await resolver.resolveBundle('animals');
		* @param bundleId - The id of the bundle to add
		* @param assets - A record of the asset or assets that will be chosen from when loading via the specified key
		*/
		addBundle(bundleId, assets) {
			const assetNames = [];
			let convertedAssets = assets;
			if (!Array.isArray(assets)) convertedAssets = Object.entries(assets).map(([alias, src]) => {
				if (typeof src === "string" || Array.isArray(src)) return {
					alias,
					src
				};
				return {
					alias,
					...src
				};
			});
			convertedAssets.forEach((asset) => {
				const srcs = asset.src;
				const aliases = asset.alias;
				let ids;
				if (typeof aliases === "string") {
					const bundleAssetId = this._createBundleAssetId(bundleId, aliases);
					assetNames.push(bundleAssetId);
					ids = [aliases, bundleAssetId];
				} else {
					const bundleIds = aliases.map((name) => this._createBundleAssetId(bundleId, name));
					assetNames.push(...bundleIds);
					ids = [...aliases, ...bundleIds];
				}
				this.add({
					...asset,
					alias: ids,
					src: srcs
				});
			});
			this._bundles[bundleId] = assetNames;
		}
		/**
		* Tells the resolver what keys are associated with witch asset.
		* The most important thing the resolver does
		* @example
		* // Single key, single asset:
		* resolver.add({alias: 'foo', src: 'bar.png');
		* resolver.resolveUrl('foo') // => 'bar.png'
		*
		* // Multiple keys, single asset:
		* resolver.add({alias: ['foo', 'boo'], src: 'bar.png'});
		* resolver.resolveUrl('foo') // => 'bar.png'
		* resolver.resolveUrl('boo') // => 'bar.png'
		*
		* // Multiple keys, multiple assets:
		* resolver.add({alias: ['foo', 'boo'], src: ['bar.png', 'bar.webp']});
		* resolver.resolveUrl('foo') // => 'bar.png'
		*
		* // Add custom data attached to the resolver
		* Resolver.add({
		*     alias: 'bunnyBooBooSmooth',
		*     src: 'bunny{png,webp}',
		*     data: { scaleMode:SCALE_MODES.NEAREST }, // Base texture options
		* });
		*
		* resolver.resolve('bunnyBooBooSmooth') // => { src: 'bunny.png', data: { scaleMode: SCALE_MODES.NEAREST } }
		* @param aliases - the UnresolvedAsset or array of UnresolvedAssets to add to the resolver
		*/
		add(aliases) {
			const assets = [];
			if (Array.isArray(aliases)) assets.push(...aliases);
			else assets.push(aliases);
			let keyCheck = (key) => {
				if (this.hasKey(key)) warn(`[Resolver] already has key: ${key} overwriting`);
			};
			convertToList(assets).forEach((asset) => {
				const { src } = asset;
				let { data, format, loadParser: userDefinedLoadParser, parser: userDefinedParser } = asset;
				const srcsToUse = convertToList(src).map((src2) => {
					if (typeof src2 === "string") return createStringVariations(src2);
					return Array.isArray(src2) ? src2 : [src2];
				});
				const aliasesToUse = this.getAlias(asset);
				Array.isArray(aliasesToUse) ? aliasesToUse.forEach(keyCheck) : keyCheck(aliasesToUse);
				const resolvedAssets = [];
				const parseUrl = (url) => {
					return {
						src: url,
						...this._parsers.find((p) => p.test(url))?.parse(url)
					};
				};
				srcsToUse.forEach((srcs) => {
					srcs.forEach((src2) => {
						let formattedAsset = {};
						if (typeof src2 !== "object") formattedAsset = parseUrl(src2);
						else {
							data = src2.data ?? data;
							format = src2.format ?? format;
							if (src2.loadParser || src2.parser) {
								userDefinedLoadParser = src2.loadParser ?? userDefinedLoadParser;
								userDefinedParser = src2.parser ?? userDefinedParser;
							}
							formattedAsset = {
								...parseUrl(src2.src),
								...src2
							};
						}
						if (!aliasesToUse) throw new Error(`[Resolver] alias is undefined for this asset: ${formattedAsset.src}`);
						formattedAsset = this._buildResolvedAsset(formattedAsset, {
							aliases: aliasesToUse,
							data,
							format,
							loadParser: userDefinedLoadParser,
							parser: userDefinedParser,
							progressSize: asset.progressSize
						});
						resolvedAssets.push(formattedAsset);
					});
				});
				aliasesToUse.forEach((alias) => {
					this._assetMap[alias] = resolvedAssets;
				});
			});
		}
		/**
		* If the resolver has had a manifest set via setManifest, this will return the assets urls for
		* a given bundleId or bundleIds.
		* @example
		* // Manifest Example
		* const manifest = {
		*     bundles: [
		*         {
		*             name: 'load-screen',
		*             assets: [
		*                 {
		*                     alias: 'background',
		*                     src: 'sunset.png',
		*                 },
		*                 {
		*                     alias: 'bar',
		*                     src: 'load-bar.{png,webp}',
		*                 },
		*             ],
		*         },
		*         {
		*             name: 'game-screen',
		*             assets: [
		*                 {
		*                     alias: 'character',
		*                     src: 'robot.png',
		*                 },
		*                 {
		*                     alias: 'enemy',
		*                     src: 'bad-guy.png',
		*                 },
		*             ],
		*         },
		*     ]
		* };
		*
		* resolver.setManifest(manifest);
		* const resolved = resolver.resolveBundle('load-screen');
		* @param bundleIds - The bundle ids to resolve
		* @returns All the bundles assets or a hash of assets for each bundle specified
		*/
		resolveBundle(bundleIds) {
			const singleAsset = isSingleItem(bundleIds);
			bundleIds = convertToList(bundleIds);
			const out = {};
			bundleIds.forEach((bundleId) => {
				const assetNames = this._bundles[bundleId];
				if (assetNames) {
					const results = this.resolve(assetNames);
					const assets = {};
					for (const key in results) {
						const asset = results[key];
						assets[this._extractAssetIdFromBundle(bundleId, key)] = asset;
					}
					out[bundleId] = assets;
				}
			});
			return singleAsset ? out[bundleIds[0]] : out;
		}
		/**
		* Does exactly what resolve does, but returns just the URL rather than the whole asset object
		* @param key - The key or keys to resolve
		* @returns - The URLs associated with the key(s)
		*/
		resolveUrl(key) {
			const result = this.resolve(key);
			if (typeof key !== "string") {
				const out = {};
				for (const i in result) out[i] = result[i].src;
				return out;
			}
			return result.src;
		}
		resolve(keys) {
			const singleAsset = isSingleItem(keys);
			keys = convertToList(keys);
			const result = {};
			keys.forEach((key) => {
				if (!this._resolverHash[key]) if (this._assetMap[key]) {
					let assets = this._assetMap[key];
					const preferredOrder = this._getPreferredOrder(assets);
					preferredOrder?.priority.forEach((priorityKey) => {
						preferredOrder.params[priorityKey].forEach((value) => {
							const filteredAssets = assets.filter((asset) => {
								if (asset[priorityKey]) return asset[priorityKey] === value;
								return false;
							});
							if (filteredAssets.length) assets = filteredAssets;
						});
					});
					this._resolverHash[key] = assets[0];
				} else this._resolverHash[key] = this._buildResolvedAsset({
					alias: [key],
					src: key
				}, {});
				result[key] = this._resolverHash[key];
			});
			return singleAsset ? result[keys[0]] : result;
		}
		/**
		* Checks if an asset with a given key exists in the resolver
		* @param key - The key of the asset
		*/
		hasKey(key) {
			return !!this._assetMap[key];
		}
		/**
		* Checks if a bundle with the given key exists in the resolver
		* @param key - The key of the bundle
		*/
		hasBundle(key) {
			return !!this._bundles[key];
		}
		/**
		* Internal function for figuring out what prefer criteria an asset should use.
		* @param assets
		*/
		_getPreferredOrder(assets) {
			for (let i = 0; i < assets.length; i++) {
				const asset = assets[i];
				const preferred = this._preferredOrder.find((preference) => preference.params.format.includes(asset.format));
				if (preferred) return preferred;
			}
			return this._preferredOrder[0];
		}
		/**
		* Appends the default url parameters to the url
		* @param url - The url to append the default parameters to
		* @returns - The url with the default parameters appended
		*/
		_appendDefaultSearchParams(url) {
			if (!this._defaultSearchParams) return url;
			return `${url}${/\?/.test(url) ? "&" : "?"}${this._defaultSearchParams}`;
		}
		_buildResolvedAsset(formattedAsset, data) {
			const { aliases, data: assetData, loadParser, parser, format, progressSize } = data;
			if (this._basePath || this._rootPath) formattedAsset.src = path.toAbsolute(formattedAsset.src, this._basePath, this._rootPath);
			formattedAsset.alias = aliases ?? formattedAsset.alias ?? [formattedAsset.src];
			formattedAsset.src = this._appendDefaultSearchParams(formattedAsset.src);
			formattedAsset.data = {
				...assetData || {},
				...formattedAsset.data
			};
			formattedAsset.loadParser = loadParser ?? formattedAsset.loadParser;
			formattedAsset.parser = parser ?? formattedAsset.parser;
			formattedAsset.format = format ?? formattedAsset.format ?? getUrlExtension(formattedAsset.src);
			if (progressSize !== void 0) formattedAsset.progressSize = progressSize;
			return formattedAsset;
		}
	};
	/**
	* The prefix that denotes a URL is for a retina asset.
	* @default /@([0-9\.]+)x/
	* @example `@2x`
	*/
	Resolver.RETINA_PREFIX = /@([0-9\.]+)x/;
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/assets/utils/copySearchParams.mjs
var copySearchParams;
var init_copySearchParams = __esmMin((() => {
	copySearchParams = (targetUrl, sourceUrl) => {
		const searchParams = sourceUrl.split("?")[1];
		if (searchParams) targetUrl += `?${searchParams}`;
		return targetUrl;
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/spritesheet/Spritesheet.mjs
var _Spritesheet, Spritesheet;
var init_Spritesheet = __esmMin((() => {
	init_Rectangle();
	init_TextureSource();
	init_Texture();
	_Spritesheet = class _Spritesheet {
		constructor(optionsOrTexture, arg1) {
			/** For multi-packed spritesheets, this contains a reference to all the other spritesheets it depends on. */
			this.linkedSheets = [];
			let options = optionsOrTexture;
			if (optionsOrTexture?.source instanceof TextureSource) options = {
				texture: optionsOrTexture,
				data: arg1
			};
			const { texture, data, cachePrefix = "" } = options;
			this.cachePrefix = cachePrefix;
			this._texture = texture instanceof Texture ? texture : null;
			this.textureSource = texture.source;
			this.textures = {};
			this.animations = {};
			this.data = data;
			const metaResolution = parseFloat(data.meta.scale);
			if (metaResolution) {
				this.resolution = metaResolution;
				texture.source.resolution = this.resolution;
			} else this.resolution = texture.source._resolution;
			this._frames = this.data.frames;
			this._frameKeys = Object.keys(this._frames);
			this._batchIndex = 0;
			this._callback = null;
		}
		/**
		* Parse spritesheet from loaded data. This is done asynchronously
		* to prevent creating too many Texture within a single process.
		*/
		parse() {
			return new Promise((resolve) => {
				this._callback = resolve;
				this._batchIndex = 0;
				if (this._frameKeys.length <= _Spritesheet.BATCH_SIZE) {
					this._processFrames(0);
					this._processAnimations();
					this._parseComplete();
				} else this._nextBatch();
			});
		}
		/**
		* Parse spritesheet from loaded data. This is done synchronously
		* and is only suitable for smaller spritesheets (less than ~1000 frames)
		* or may cause too many Texture within a single process. However, synchronous parsing may be
		* more convenient since the called does not need to be asynchronous and is safe for
		* small-to-medium sized spritesheets.
		*
		* Other than being synchronous, `parseSync` is otherwise identical to `.parse()`.
		*/
		parseSync() {
			this._processFrames(0, true);
			this._processAnimations();
			return this.textures;
		}
		/**
		* Process a batch of frames
		* @param initialFrameIndex - The index of frame to start.
		* @param processAll - if true will process all frames in a single batch, ignoring BATCH_SIZE - this
		* is used for synchronous parsing.
		*/
		_processFrames(initialFrameIndex, processAll = false) {
			let frameIndex = initialFrameIndex;
			const maxFrames = processAll ? Infinity : _Spritesheet.BATCH_SIZE;
			while (frameIndex - initialFrameIndex < maxFrames && frameIndex < this._frameKeys.length) {
				const i = this._frameKeys[frameIndex];
				const data = this._frames[i];
				const rect = data.frame;
				if (rect) {
					let frame = null;
					let trim = null;
					const sourceSize = data.trimmed !== false && data.sourceSize ? data.sourceSize : data.frame;
					const orig = new Rectangle(0, 0, Math.floor(sourceSize.w) / this.resolution, Math.floor(sourceSize.h) / this.resolution);
					if (data.rotated) frame = new Rectangle(Math.floor(rect.x) / this.resolution, Math.floor(rect.y) / this.resolution, Math.floor(rect.h) / this.resolution, Math.floor(rect.w) / this.resolution);
					else frame = new Rectangle(Math.floor(rect.x) / this.resolution, Math.floor(rect.y) / this.resolution, Math.floor(rect.w) / this.resolution, Math.floor(rect.h) / this.resolution);
					if (data.trimmed !== false && data.spriteSourceSize) trim = new Rectangle(Math.floor(data.spriteSourceSize.x) / this.resolution, Math.floor(data.spriteSourceSize.y) / this.resolution, Math.floor(rect.w) / this.resolution, Math.floor(rect.h) / this.resolution);
					this.textures[i] = new Texture({
						source: this.textureSource,
						frame,
						orig,
						trim,
						rotate: data.rotated ? 2 : 0,
						defaultAnchor: data.anchor,
						defaultBorders: data.borders,
						label: i.toString()
					});
				}
				frameIndex++;
			}
		}
		/** Parse animations config. */
		_processAnimations() {
			const animations = this.data.animations || {};
			for (const animName in animations) {
				this.animations[animName] = [];
				for (let i = 0; i < animations[animName].length; i++) {
					const frameName = animations[animName][i];
					this.animations[animName].push(this.textures[frameName]);
				}
			}
		}
		/** The parse has completed. */
		_parseComplete() {
			const callback = this._callback;
			this._callback = null;
			this._batchIndex = 0;
			callback.call(this, this.textures);
		}
		/** Begin the next batch of textures. */
		_nextBatch() {
			this._processFrames(this._batchIndex * _Spritesheet.BATCH_SIZE);
			this._batchIndex++;
			setTimeout(() => {
				if (this._batchIndex * _Spritesheet.BATCH_SIZE < this._frameKeys.length) this._nextBatch();
				else {
					this._processAnimations();
					this._parseComplete();
				}
			}, 0);
		}
		/**
		* Destroy Spritesheet and don't use after this.
		* @param {boolean} [destroyBase=false] - Whether to destroy the base texture as well
		*/
		destroy(destroyBase = false) {
			for (const i in this.textures) this.textures[i].destroy();
			this._frames = null;
			this._frameKeys = null;
			this.data = null;
			this.textures = null;
			if (destroyBase) {
				this._texture?.destroy();
				this.textureSource.destroy();
			}
			this._texture = null;
			this.textureSource = null;
			this.linkedSheets = [];
		}
	};
	/**
	* The maximum number of Textures to build per process.
	* @advanced
	*/
	_Spritesheet.BATCH_SIZE = 1e3;
	Spritesheet = _Spritesheet;
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/spritesheet/spritesheetAsset.mjs
function getCacheableAssets(keys, asset, ignoreMultiPack) {
	const out = {};
	keys.forEach((key) => {
		out[key] = asset;
	});
	Object.keys(asset.textures).forEach((key) => {
		out[`${asset.cachePrefix}${key}`] = asset.textures[key];
	});
	if (!ignoreMultiPack) {
		const basePath = path.dirname(keys[0]);
		asset.linkedSheets.forEach((item, i) => {
			const out2 = getCacheableAssets([`${basePath}/${asset.data.meta.related_multi_packs[i]}`], item, true);
			Object.assign(out, out2);
		});
	}
	return out;
}
var validImages, spritesheetAsset;
var init_spritesheetAsset = __esmMin((() => {
	init_LoaderParser();
	init_Resolver();
	init_copySearchParams();
	init_Extensions();
	init_Texture();
	init_path();
	init_Spritesheet();
	validImages = [
		"jpg",
		"png",
		"jpeg",
		"avif",
		"webp",
		"basis",
		"etc2",
		"bc7",
		"bc6h",
		"bc5",
		"bc4",
		"bc3",
		"bc2",
		"bc1",
		"eac",
		"astc"
	];
	spritesheetAsset = {
		extension: ExtensionType.Asset,
		/** Handle the caching of the related Spritesheet Textures */
		cache: {
			test: (asset) => asset instanceof Spritesheet,
			getCacheableAssets: (keys, asset) => getCacheableAssets(keys, asset, false)
		},
		/** Resolve the resolution of the asset. */
		resolver: {
			extension: {
				type: ExtensionType.ResolveParser,
				name: "resolveSpritesheet"
			},
			test: (value) => {
				const split = value.split("?")[0].split(".");
				const extension = split.pop();
				const format = split.pop();
				return extension === "json" && validImages.includes(format);
			},
			parse: (value) => {
				const split = value.split(".");
				return {
					resolution: parseFloat(Resolver.RETINA_PREFIX.exec(value)?.[1] ?? "1"),
					format: split[split.length - 2],
					src: value
				};
			}
		},
		/**
		* Loader plugin that parses sprite sheets!
		* once the JSON has been loaded this checks to see if the JSON is spritesheet data.
		* If it is, we load the spritesheets image and parse the data into Spritesheet
		* All textures in the sprite sheet are then added to the cache
		*/
		loader: {
			/** used for deprecation purposes */
			name: "spritesheetLoader",
			id: "spritesheet",
			extension: {
				type: ExtensionType.LoadParser,
				priority: LoaderParserPriority.Normal,
				name: "spritesheetLoader"
			},
			async testParse(asset, options) {
				return path.extname(options.src).toLowerCase() === ".json" && !!asset.frames;
			},
			async parse(asset, options, loader) {
				const { texture: imageTexture, imageFilename, textureOptions, cachePrefix } = options?.data ?? {};
				let basePath = path.dirname(options.src);
				if (basePath && basePath.lastIndexOf("/") !== basePath.length - 1) basePath += "/";
				let texture;
				if (imageTexture instanceof Texture) texture = imageTexture;
				else {
					const imagePath = copySearchParams(basePath + (imageFilename ?? asset.meta.image), options.src);
					texture = (await loader.load([{
						src: imagePath,
						data: textureOptions
					}]))[imagePath];
				}
				const spritesheet = new Spritesheet({
					texture: texture.source,
					data: asset,
					cachePrefix
				});
				await spritesheet.parse();
				const multiPacks = asset?.meta?.related_multi_packs;
				if (Array.isArray(multiPacks)) {
					const promises = [];
					for (const item of multiPacks) {
						if (typeof item !== "string") continue;
						let itemUrl = basePath + item;
						if (options.data?.ignoreMultiPack) continue;
						itemUrl = copySearchParams(itemUrl, options.src);
						promises.push(loader.load({
							src: itemUrl,
							data: {
								textureOptions,
								ignoreMultiPack: true
							}
						}));
					}
					const res = await Promise.all(promises);
					spritesheet.linkedSheets = res;
					res.forEach((item) => {
						item.linkedSheets = [spritesheet].concat(spritesheet.linkedSheets.filter((sp) => sp !== item));
					});
				}
				return spritesheet;
			},
			async unload(spritesheet, _resolvedAsset, loader) {
				await loader.unload(spritesheet.textureSource._sourceOrigin);
				spritesheet.destroy(false);
			}
		}
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/spritesheet/init.mjs
var init_init = __esmMin((() => {
	init_Extensions();
	init_spritesheetAsset();
	extensions.add(spritesheetAsset);
}));
//#endregion
export { init_init$1 as n, init_textureFrom as r, init_init as t };
