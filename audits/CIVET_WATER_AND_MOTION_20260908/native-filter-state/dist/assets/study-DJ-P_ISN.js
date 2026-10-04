const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/browserAll-Bb-JdeeW.js","assets/Geometry-CgCjw-Bj.js","assets/defaultFilter.vert-D5W_H1zX.js","assets/canvasUtils-D4O_SOPi.js","assets/init-CiSqEodx.js","assets/CanvasPool-D0IGP4PS.js","assets/webworkerAll-QeelJbSZ.js","assets/CanvasRenderer-BnZAmjuc.js","assets/RenderTargetSystem-C8zObf9q.js","assets/getTextureBatchBindGroup-BqyP7eOb.js"])))=>i.map(i=>d[i]);
import { $t as extensions, A as init_Ticker, B as init_ViewContainer, Bt as init_uid, C as GlProgram, Ct as init_Texture, D as createIdFromString, F as DOMAdapter, H as init_Container, Ht as Rectangle, I as init_adapter, It as deprecation, Kt as Matrix, L as Sprite, Lt as init_deprecation, M as init_const$2, Mt as definedProps, N as CanvasSource, Nt as init_definedProps, O as init_createIdFromString, Ot as TextureSource, P as init_CanvasSource, Qt as ExtensionType, R as init_Sprite, Rt as v8_0_0, S as init_getAttributeInfoFromFormat, St as Texture, Ut as init_Rectangle, V as Container, Vt as uid, Zt as init_eventemitter3, _ as UniformGroup, _t as warn, a as BufferUsage, b as init_GpuProgram, c as init_Filter, d as Shader, en as init_Extensions, f as init_Shader, g as init_BindGroup, gt as init_warn, h as BindGroup, i as init_Buffer, j as UPDATE_PRIORITY, k as Ticker, kt as init_TextureSource, l as State, m as init_types, n as init_Geometry, nn as __esmMin, o as init_const$3, p as RendererType, qt as init_Matrix, r as Buffer, rn as __exportAll, s as Filter, t as Geometry, tn as __commonJSMin, u as init_State, v as init_UniformGroup, vt as Color, w as init_GlProgram, x as getAttributeInfoFromFormat, y as GpuProgram, yt as init_Color, z as ViewContainer } from "./Geometry-CgCjw-Bj.js";
import { a as init_textureFrom, i as init_init$2, n as vertex, r as init_init$3, t as init_defaultFilter_vert } from "./defaultFilter.vert-D5W_H1zX.js";
import { a as ImageSource, o as init_ImageSource } from "./canvasUtils-D4O_SOPi.js";
import { A as generateTextureBatchBitGl, B as getAdjustedBlendModeBlend, D as roundPixelsBit, E as init_roundPixelsBit, F as compileHighShaderGlProgram, G as init_fastCopy, H as STENCIL_MODES, I as compileHighShaderGpuProgram, J as AbstractRenderer, K as ApplicationInitHook, L as init_compileHighShaderToProgram, M as colorBit, N as colorBitGl, O as roundPixelsBitGl, P as init_colorBit, R as checkMaxIfStatementsInShader, T as init_getBatchSamplersUniformGroup, U as init_const$4, V as init_getAdjustedBlendModeBlend, W as fastCopy, X as CLEAR, Y as init_AbstractRenderer, Z as init_const$5, a as init_SharedSystems, b as GCManagedHash, i as SharedSystems, j as init_generateTextureBatchBit, k as generateTextureBatchBit, n as init_RenderTargetSystem, q as init_globalHooks, r as SharedRenderPipes, t as RenderTargetSystem, v as color32BitToUniform, w as getBatchSamplersUniformGroup, x as init_GCManagedHash, y as init_colorToUniform, z as init_checkMaxIfStatementsInShader } from "./RenderTargetSystem-C8zObf9q.js";
import { i as init_Graphics, r as Graphics } from "./CanvasRenderer-BnZAmjuc.js";
import { n as init_getTextureBatchBindGroup, t as getTextureBatchBindGroup } from "./getTextureBatchBindGroup-BqyP7eOb.js";
import { n as init_CanvasPool, t as CanvasPool } from "./CanvasPool-D0IGP4PS.js";
import { S as localUniformBitGroup2, _ as textureBit, a as uboSyncFunctionsWGSL, b as localUniformBit, c as init_uniformParsers, d as init_UboSystem, f as GpuStencilModesToPixi, g as init_textureBit, h as init_ensureAttributes, i as uboSyncFunctionsSTD40, l as uniformParsers, m as ensureAttributes, n as init_BufferResource, o as createUboSyncFunction, p as init_GpuStencilModesToPixi, r as init_uboSyncFunctions, s as init_createUboSyncFunction, t as BufferResource, u as UboSystem, v as textureBitGl, x as localUniformBitGl, y as init_localUniformBit } from "./BufferResource-B2JaIKPf.js";
//#region \0vite/modulepreload-polyfill.js
(function polyfill() {
	const relList = document.createElement("link").relList;
	if (relList && relList.supports && relList.supports("modulepreload")) return;
	for (const link of document.querySelectorAll("link[rel=\"modulepreload\"]")) processPreload(link);
	new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type !== "childList") continue;
			for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
		}
	}).observe(document, {
		childList: true,
		subtree: true
	});
	function getFetchOpts(link) {
		const fetchOpts = {};
		if (link.integrity) fetchOpts.integrity = link.integrity;
		if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
		if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
		else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
		else fetchOpts.credentials = "same-origin";
		return fetchOpts;
	}
	function processPreload(link) {
		if (link.ep) return;
		link.ep = true;
		const fetchOpts = getFetchOpts(link);
		fetch(link.href, fetchOpts);
	}
})();
//#endregion
//#region \0vite/preload-helper.js
var scriptRel, assetsURL, seen, __vitePreload;
var init_preload_helper = __esmMin((() => {
	scriptRel = "modulepreload";
	assetsURL = function(dep) {
		return "/" + dep;
	};
	seen = {};
	__vitePreload = function preload(baseModule, deps, importerUrl) {
		let promise = Promise.resolve();
		if (deps && deps.length > 0) {
			const links = document.getElementsByTagName("link");
			const cspNonceMeta = document.querySelector("meta[property=csp-nonce]");
			const cspNonce = cspNonceMeta?.nonce || cspNonceMeta?.getAttribute("nonce");
			function allSettled(promises) {
				return Promise.all(promises.map((p) => Promise.resolve(p).then((value) => ({
					status: "fulfilled",
					value
				}), (reason) => ({
					status: "rejected",
					reason
				}))));
			}
			function importMetaResolve(specifier) {
				if (import.meta.resolve) return import.meta.resolve(specifier);
				return new URL(
					specifier,
					/** #__KEEP__ */
					import.meta.url
				).href;
			}
			promise = allSettled(deps.map((dep) => {
				dep = assetsURL(dep, importerUrl);
				dep = importMetaResolve(dep);
				if (dep in seen) return;
				seen[dep] = true;
				const isCss = dep.endsWith(".css");
				for (let i = links.length - 1; i >= 0; i--) {
					const link = links[i];
					if (link.href === dep && (!isCss || link.rel === "stylesheet")) return;
				}
				const link = document.createElement("link");
				link.rel = isCss ? "stylesheet" : scriptRel;
				if (!isCss) link.as = "script";
				link.crossOrigin = "";
				link.href = dep;
				if (cspNonce) link.setAttribute("nonce", cspNonce);
				document.head.appendChild(link);
				if (isCss) return new Promise((res, rej) => {
					link.addEventListener("load", res);
					link.addEventListener("error", () => rej(/* @__PURE__ */ new Error(`Unable to preload CSS for ${dep}`)));
				});
			}));
		}
		function handlePreloadError(err) {
			const e = new Event("vite:preloadError", { cancelable: true });
			e.payload = err;
			window.dispatchEvent(e);
			if (!e.defaultPrevented) throw err;
		}
		return promise.then((res) => {
			for (const item of res || []) {
				if (item.status !== "rejected") continue;
				handlePreloadError(item.reason);
			}
			return baseModule().catch(handlePreloadError);
		});
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/environment-browser/browserExt.mjs
var browserExt;
var init_browserExt = __esmMin((() => {
	init_Extensions();
	init_preload_helper();
	browserExt = {
		extension: {
			type: ExtensionType.Environment,
			name: "browser",
			priority: -1
		},
		test: () => true,
		load: async () => {
			await __vitePreload(() => import("./browserAll-Bb-JdeeW.js"), __vite__mapDeps([0,1,2,3,4,5]));
		}
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/environment-webworker/webworkerExt.mjs
var webworkerExt;
var init_webworkerExt = __esmMin((() => {
	init_Extensions();
	init_preload_helper();
	webworkerExt = {
		extension: {
			type: ExtensionType.Environment,
			name: "webworker",
			priority: 0
		},
		test: () => typeof self !== "undefined" && self.WorkerGlobalScope !== void 0,
		load: async () => {
			await __vitePreload(() => import("./webworkerAll-QeelJbSZ.js"), __vite__mapDeps([6,1,2,3,4,5]));
		}
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/utils/browser/isWebGLSupported.mjs
function isWebGLSupported(failIfMajorPerformanceCaveat) {
	if (_isWebGLSupported !== void 0) return _isWebGLSupported;
	_isWebGLSupported = (() => {
		const contextOptions = {
			stencil: true,
			failIfMajorPerformanceCaveat: failIfMajorPerformanceCaveat ?? AbstractRenderer.defaultOptions.failIfMajorPerformanceCaveat
		};
		try {
			if (!DOMAdapter.get().getWebGLRenderingContext()) return false;
			let gl = DOMAdapter.get().createCanvas().getContext("webgl", contextOptions);
			const success = !!gl?.getContextAttributes()?.stencil;
			if (gl) {
				const loseContext = gl.getExtension("WEBGL_lose_context");
				if (loseContext) loseContext.loseContext();
			}
			gl = null;
			return success;
		} catch (_e) {
			return false;
		}
	})();
	return _isWebGLSupported;
}
var _isWebGLSupported;
var init_isWebGLSupported = __esmMin((() => {
	init_adapter();
	init_AbstractRenderer();
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/utils/browser/isWebGPUSupported.mjs
async function isWebGPUSupported(options = {}) {
	if (_isWebGPUSupported !== void 0) return _isWebGPUSupported;
	_isWebGPUSupported = await (async () => {
		const gpu = DOMAdapter.get().getNavigator().gpu;
		if (!gpu) return false;
		try {
			await (await gpu.requestAdapter(options)).requestDevice();
			return true;
		} catch (_e) {
			return false;
		}
	})();
	return _isWebGPUSupported;
}
var _isWebGPUSupported;
var init_isWebGPUSupported = __esmMin((() => {
	init_adapter();
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/autoDetectRenderer.mjs
async function autoDetectRenderer(options) {
	let preferredOrder = [];
	if (options.preference) if (Array.isArray(options.preference)) preferredOrder = options.preference.slice();
	else {
		preferredOrder.push(options.preference);
		renderPriority.forEach((item) => {
			if (item !== options.preference) preferredOrder.push(item);
		});
	}
	else preferredOrder = renderPriority.slice();
	let RendererClass;
	let finalOptions = {};
	for (let i = 0; i < preferredOrder.length; i++) {
		const rendererType = preferredOrder[i];
		if (rendererType === "webgpu" && await isWebGPUSupported()) {
			const { WebGPURenderer } = await __vitePreload(async () => {
				const { WebGPURenderer } = await Promise.resolve().then(() => (init_WebGPURenderer(), WebGPURenderer_exports));
				return { WebGPURenderer };
			}, void 0);
			RendererClass = WebGPURenderer;
			finalOptions = {
				...options,
				...options.webgpu
			};
			break;
		} else if (rendererType === "webgl" && isWebGLSupported(options.failIfMajorPerformanceCaveat ?? AbstractRenderer.defaultOptions.failIfMajorPerformanceCaveat)) {
			const { WebGLRenderer } = await __vitePreload(async () => {
				const { WebGLRenderer } = await Promise.resolve().then(() => (init_WebGLRenderer(), WebGLRenderer_exports));
				return { WebGLRenderer };
			}, void 0);
			RendererClass = WebGLRenderer;
			finalOptions = {
				...options,
				...options.webgl
			};
			break;
		} else if (rendererType === "canvas") {
			const { CanvasRenderer } = await __vitePreload(async () => {
				const { CanvasRenderer } = await import("./CanvasRenderer-BnZAmjuc.js").then((n) => (n.n(), n.t));
				return { CanvasRenderer };
			}, __vite__mapDeps([7,1,3,8,9]));
			RendererClass = CanvasRenderer;
			finalOptions = {
				...options,
				...options.canvasOptions
			};
			break;
		}
	}
	delete finalOptions.webgpu;
	delete finalOptions.webgl;
	delete finalOptions.canvasOptions;
	if (!RendererClass) throw new Error("No available renderer for the current environment");
	const renderer = new RendererClass();
	await renderer.init(finalOptions);
	return renderer;
}
var renderPriority;
var init_autoDetectRenderer = __esmMin((() => {
	init_isWebGLSupported();
	init_isWebGPUSupported();
	init_AbstractRenderer();
	init_preload_helper();
	renderPriority = [
		"webgl",
		"webgpu",
		"canvas"
	];
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/app/ResizePlugin.mjs
var ResizePlugin;
var init_ResizePlugin = __esmMin((() => {
	init_Extensions();
	ResizePlugin = class {
		/**
		* Initialize the plugin with scope of application instance
		* @private
		* @param {object} [options] - See application options
		*/
		static init(options) {
			Object.defineProperty(this, "resizeTo", {
				configurable: true,
				set(dom) {
					globalThis.removeEventListener("resize", this.queueResize);
					this._resizeTo = dom;
					if (dom) {
						globalThis.addEventListener("resize", this.queueResize);
						this.resize();
					}
				},
				get() {
					return this._resizeTo;
				}
			});
			this.queueResize = () => {
				if (!this._resizeTo) return;
				this._cancelResize();
				this._resizeId = requestAnimationFrame(() => this.resize());
			};
			this._cancelResize = () => {
				if (this._resizeId) {
					cancelAnimationFrame(this._resizeId);
					this._resizeId = null;
				}
			};
			this.resize = () => {
				if (!this._resizeTo) return;
				this._cancelResize();
				let width;
				let height;
				if (this._resizeTo === globalThis.window) {
					width = globalThis.innerWidth;
					height = globalThis.innerHeight;
				} else {
					const { clientWidth, clientHeight } = this._resizeTo;
					width = clientWidth;
					height = clientHeight;
				}
				this.renderer.resize(width, height);
				this.render();
			};
			this._resizeId = null;
			this._resizeTo = null;
			this.resizeTo = options.resizeTo || null;
		}
		/**
		* Clean up the ticker, scoped to application
		* @private
		*/
		static destroy() {
			globalThis.removeEventListener("resize", this.queueResize);
			this._cancelResize();
			this._cancelResize = null;
			this.queueResize = null;
			this.resizeTo = null;
			this.resize = null;
		}
	};
	/** @ignore */
	ResizePlugin.extension = ExtensionType.Application;
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/app/TickerPlugin.mjs
var TickerPlugin;
var init_TickerPlugin = __esmMin((() => {
	init_Extensions();
	init_const$2();
	init_Ticker();
	TickerPlugin = class {
		/**
		* Initialize the plugin with scope of application instance
		* @private
		* @param {object} [options] - See application options
		*/
		static init(options) {
			options = Object.assign({
				autoStart: true,
				sharedTicker: false
			}, options);
			Object.defineProperty(this, "ticker", {
				configurable: true,
				set(ticker) {
					if (this._ticker) this._ticker.remove(this.render, this);
					this._ticker = ticker;
					if (ticker) ticker.add(this.render, this, UPDATE_PRIORITY.LOW);
				},
				get() {
					return this._ticker;
				}
			});
			this.stop = () => {
				this._ticker.stop();
			};
			this.start = () => {
				this._ticker.start();
			};
			this._ticker = null;
			this.ticker = options.sharedTicker ? Ticker.shared : new Ticker();
			if (options.autoStart) this.start();
		}
		/**
		* Clean up the ticker, scoped to application.
		* @private
		*/
		static destroy() {
			if (this._ticker) {
				const oldTicker = this._ticker;
				this.ticker = null;
				oldTicker.destroy();
			}
		}
	};
	/** @ignore */
	TickerPlugin.extension = ExtensionType.Application;
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/app/init.mjs
var init_init$1 = __esmMin((() => {
	init_Extensions();
	init_ResizePlugin();
	init_TickerPlugin();
	extensions.add(ResizePlugin);
	extensions.add(TickerPlugin);
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/app/Application.mjs
var _Application, Application;
var init_Application = __esmMin((() => {
	init_Extensions();
	init_autoDetectRenderer();
	init_Container();
	init_globalHooks();
	init_deprecation();
	init_init$1();
	_Application = class _Application {
		constructor(...args) {
			/**
			* The root display container for your application.
			* All visual elements should be added to this container or its children.
			* @example
			* ```js
			* // Create a sprite and add it to the stage
			* const sprite = Sprite.from('image.png');
			* app.stage.addChild(sprite);
			*
			* // Create a container for grouping objects
			* const container = new Container();
			* app.stage.addChild(container);
			* ```
			*/
			this.stage = new Container();
			if (args[0] !== void 0) deprecation(v8_0_0, "Application constructor options are deprecated, please use Application.init() instead.");
		}
		/**
		* Initializes the PixiJS application with the specified options.
		*
		* This method must be called after creating a new Application instance.
		* @param options - Configuration options for the application and renderer
		* @returns A promise that resolves when initialization is complete
		* @example
		* ```js
		* const app = new Application();
		*
		* // Initialize with custom options
		* await app.init({
		*     width: 800,
		*     height: 600,
		*     backgroundColor: 0x1099bb,
		*     preference: 'webgl', // or 'webgpu'
		* });
		* ```
		*/
		async init(options) {
			options = { ...options };
			this.stage || (this.stage = new Container());
			this.renderer = await autoDetectRenderer(options);
			_Application._plugins.forEach((plugin) => {
				plugin.init.call(this, options);
			});
		}
		/**
		* Renders the current stage to the screen.
		*
		* When using the default setup with {@link TickerPlugin} (enabled by default), you typically don't need to call
		* this method directly as rendering is handled automatically.
		*
		* Only use this method if you've disabled the {@link TickerPlugin} or need custom
		* render timing control.
		* @example
		* ```js
		* // Example 1: Default setup (TickerPlugin handles rendering)
		* const app = new Application();
		* await app.init();
		* // No need to call render() - TickerPlugin handles it
		*
		* // Example 2: Custom rendering loop (if TickerPlugin is disabled)
		* const app = new Application();
		* await app.init({ autoStart: false }); // Disable automatic rendering
		*
		* function animate() {
		*     app.render();
		*     requestAnimationFrame(animate);
		* }
		* animate();
		* ```
		*/
		render() {
			this.renderer.render({ container: this.stage });
		}
		/**
		* Reference to the renderer's canvas element. This is the HTML element
		* that displays your application's graphics.
		* @readonly
		* @type {HTMLCanvasElement}
		* @example
		* ```js
		* // Create a new application
		* const app = new Application();
		* // Initialize the application
		* await app.init({...});
		* // Add canvas to the page
		* document.body.appendChild(app.canvas);
		*
		* // Access the canvas directly
		* console.log(app.canvas); // HTMLCanvasElement
		* ```
		*/
		get canvas() {
			return this.renderer.canvas;
		}
		/**
		* Reference to the renderer's canvas element.
		* @type {HTMLCanvasElement}
		* @deprecated since 8.0.0
		* @see {@link Application#canvas}
		*/
		get view() {
			deprecation(v8_0_0, "Application.view is deprecated, please use Application.canvas instead.");
			return this.renderer.canvas;
		}
		/**
		* Reference to the renderer's screen rectangle. This represents the visible area of your application.
		*
		* It's commonly used for:
		* - Setting filter areas for full-screen effects
		* - Defining hit areas for screen-wide interaction
		* - Determining the visible bounds of your application
		* @readonly
		* @example
		* ```js
		* // Use as filter area for a full-screen effect
		* const blurFilter = new BlurFilter();
		* sprite.filterArea = app.screen;
		*
		* // Use as hit area for screen-wide interaction
		* const screenSprite = new Sprite();
		* screenSprite.hitArea = app.screen;
		*
		* // Get screen dimensions
		* console.log(app.screen.width, app.screen.height);
		* ```
		* @see {@link Rectangle} For all available properties and methods
		*/
		get screen() {
			return this.renderer.screen;
		}
		/**
		* Get the html div element that holds all DOM Container elements.
		* @readonly
		* @type {HTMLDivElement}
		*/
		get domContainerRoot() {
			return this.renderer.renderPipes.dom?._domElement;
		}
		/**
		* Destroys the application and all of its resources.
		*
		* This method should be called when you want to completely
		* clean up the application and free all associated memory.
		* @param rendererDestroyOptions - Options for destroying the renderer:
		*  - `false` or `undefined`: Preserves the canvas element (default)
		*  - `true`: Removes the canvas element
		*  - `{ removeView: boolean }`: Object with removeView property to control canvas removal
		* @param options - Options for destroying the application:
		*  - `false` or `undefined`: Basic cleanup (default)
		*  - `true`: Complete cleanup including children
		*  - Detailed options object:
		*    - `children`: Remove children
		*    - `texture`: Destroy textures
		*    - `textureSource`: Destroy texture sources
		*    - `context`: Destroy WebGL context
		* @example
		* ```js
		* // Basic cleanup
		* app.destroy();
		*
		* // Remove canvas and do complete cleanup
		* app.destroy(true, true);
		*
		* // Remove canvas with explicit options
		* app.destroy({ removeView: true }, true);
		*
		* // Detailed cleanup with specific options
		* app.destroy(
		*     { removeView: true },
		*     {
		*         children: true,
		*         texture: true,
		*         textureSource: true,
		*         context: true
		*     }
		* );
		* ```
		* > [!WARNING] After calling destroy, the application instance should no longer be used.
		* > All properties will be null and further operations will throw errors.
		*/
		destroy(rendererDestroyOptions = false, options = false) {
			const plugins = _Application._plugins.slice(0);
			plugins.reverse();
			plugins.forEach((plugin) => {
				plugin.destroy.call(this);
			});
			this.stage.destroy(options);
			this.stage = null;
			this.renderer.destroy(rendererDestroyOptions);
			this.renderer = null;
		}
	};
	/**
	* Collection of installed plugins.
	* @internal
	*/
	_Application._plugins = [];
	Application = _Application;
	extensions.handleByList(ExtensionType.Application, Application._plugins);
	extensions.add(ApplicationInitHook);
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/maths/point/pointInTriangle.mjs
function pointInTriangle(px, py, x1, y1, x2, y2, x3, y3) {
	const v2x = x3 - x1;
	const v2y = y3 - y1;
	const v1x = x2 - x1;
	const v1y = y2 - y1;
	const v0x = px - x1;
	const v0y = py - y1;
	const dot00 = v2x * v2x + v2y * v2y;
	const dot01 = v2x * v1x + v2y * v1y;
	const dot02 = v2x * v0x + v2y * v0y;
	const dot11 = v1x * v1x + v1y * v1y;
	const dot12 = v1x * v0x + v1y * v0y;
	const invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
	const u = (dot11 * dot02 - dot01 * dot12) * invDenom;
	const v = (dot00 * dot12 - dot01 * dot02) * invDenom;
	return u >= 0 && v >= 0 && u + v < 1;
}
var init_pointInTriangle = __esmMin((() => {}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/filters/defaults/color-matrix/colorMatrixFilter.frag.mjs
var fragment;
var init_colorMatrixFilter_frag = __esmMin((() => {
	fragment = "\nin vec2 vTextureCoord;\nin vec4 vColor;\n\nout vec4 finalColor;\n\nuniform float uColorMatrix[20];\nuniform float uAlpha;\n\nuniform sampler2D uTexture;\n\nfloat rand(vec2 co)\n{\n    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);\n}\n\nvoid main()\n{\n    vec4 color = texture(uTexture, vTextureCoord);\n    float randomValue = rand(gl_FragCoord.xy * 0.2);\n    float diff = (randomValue - 0.5) *  0.5;\n\n    if (uAlpha == 0.0) {\n        finalColor = color;\n        return;\n    }\n\n    if (color.a > 0.0) {\n        color.rgb /= color.a;\n    }\n\n    vec4 result;\n\n    result.r = (uColorMatrix[0] * color.r);\n        result.r += (uColorMatrix[1] * color.g);\n        result.r += (uColorMatrix[2] * color.b);\n        result.r += (uColorMatrix[3] * color.a);\n        result.r += uColorMatrix[4];\n\n    result.g = (uColorMatrix[5] * color.r);\n        result.g += (uColorMatrix[6] * color.g);\n        result.g += (uColorMatrix[7] * color.b);\n        result.g += (uColorMatrix[8] * color.a);\n        result.g += uColorMatrix[9];\n\n    result.b = (uColorMatrix[10] * color.r);\n       result.b += (uColorMatrix[11] * color.g);\n       result.b += (uColorMatrix[12] * color.b);\n       result.b += (uColorMatrix[13] * color.a);\n       result.b += uColorMatrix[14];\n\n    result.a = (uColorMatrix[15] * color.r);\n       result.a += (uColorMatrix[16] * color.g);\n       result.a += (uColorMatrix[17] * color.b);\n       result.a += (uColorMatrix[18] * color.a);\n       result.a += uColorMatrix[19];\n\n    vec3 rgb = mix(color.rgb, result.rgb, uAlpha);\n\n    // Premultiply alpha again.\n    rgb *= result.a;\n\n    finalColor = vec4(rgb, result.a);\n}\n";
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/filters/defaults/color-matrix/colorMatrixFilter.wgsl.mjs
var source;
var init_colorMatrixFilter_wgsl = __esmMin((() => {
	source = "struct GlobalFilterUniforms {\n  uInputSize:vec4<f32>,\n  uInputPixel:vec4<f32>,\n  uInputClamp:vec4<f32>,\n  uOutputFrame:vec4<f32>,\n  uGlobalFrame:vec4<f32>,\n  uOutputTexture:vec4<f32>,\n};\n\nstruct ColorMatrixUniforms {\n  uColorMatrix:array<vec4<f32>, 5>,\n  uAlpha:f32,\n};\n\n\n@group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;\n@group(0) @binding(1) var uTexture: texture_2d<f32>;\n@group(0) @binding(2) var uSampler : sampler;\n@group(1) @binding(0) var<uniform> colorMatrixUniforms : ColorMatrixUniforms;\n\n\nstruct VSOutput {\n    @builtin(position) position: vec4<f32>,\n    @location(0) uv : vec2<f32>,\n  };\n  \nfn filterVertexPosition(aPosition:vec2<f32>) -> vec4<f32>\n{\n    var position = aPosition * gfu.uOutputFrame.zw + gfu.uOutputFrame.xy;\n\n    position.x = position.x * (2.0 / gfu.uOutputTexture.x) - 1.0;\n    position.y = position.y * (2.0*gfu.uOutputTexture.z / gfu.uOutputTexture.y) - gfu.uOutputTexture.z;\n\n    return vec4(position, 0.0, 1.0);\n}\n\nfn filterTextureCoord( aPosition:vec2<f32> ) -> vec2<f32>\n{\n  return aPosition * (gfu.uOutputFrame.zw * gfu.uInputSize.zw);\n}\n\n@vertex\nfn mainVertex(\n  @location(0) aPosition : vec2<f32>, \n) -> VSOutput {\n  return VSOutput(\n   filterVertexPosition(aPosition),\n   filterTextureCoord(aPosition),\n  );\n}\n\n\n@fragment\nfn mainFragment(\n  @location(0) uv: vec2<f32>,\n) -> @location(0) vec4<f32> {\n\n\n  var c = textureSample(uTexture, uSampler, uv);\n  \n  if (colorMatrixUniforms.uAlpha == 0.0) {\n    return c;\n  }\n\n \n    // Un-premultiply alpha before applying the color matrix. See issue #3539.\n    if (c.a > 0.0) {\n      c.r /= c.a;\n      c.g /= c.a;\n      c.b /= c.a;\n    }\n\n    var cm = colorMatrixUniforms.uColorMatrix;\n\n\n    var result = vec4<f32>(0.);\n\n    result.r = (cm[0][0] * c.r);\n    result.r += (cm[0][1] * c.g);\n    result.r += (cm[0][2] * c.b);\n    result.r += (cm[0][3] * c.a);\n    result.r += cm[1][0];\n\n    result.g = (cm[1][1] * c.r);\n    result.g += (cm[1][2] * c.g);\n    result.g += (cm[1][3] * c.b);\n    result.g += (cm[2][0] * c.a);\n    result.g += cm[2][1];\n\n    result.b = (cm[2][2] * c.r);\n    result.b += (cm[2][3] * c.g);\n    result.b += (cm[3][0] * c.b);\n    result.b += (cm[3][1] * c.a);\n    result.b += cm[3][2];\n\n    result.a = (cm[3][3] * c.r);\n    result.a += (cm[4][0] * c.g);\n    result.a += (cm[4][1] * c.b);\n    result.a += (cm[4][2] * c.a);\n    result.a += cm[4][3];\n\n    var rgb = mix(c.rgb, result.rgb, colorMatrixUniforms.uAlpha);\n\n    rgb.r *= result.a;\n    rgb.g *= result.a;\n    rgb.b *= result.a;\n\n    return vec4(rgb, result.a);\n}";
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/filters/defaults/color-matrix/ColorMatrixFilter.mjs
var ColorMatrixFilter;
var init_ColorMatrixFilter = __esmMin((() => {
	init_Color();
	init_GlProgram();
	init_GpuProgram();
	init_UniformGroup();
	init_Filter();
	init_defaultFilter_vert();
	init_colorMatrixFilter_frag();
	init_colorMatrixFilter_wgsl();
	ColorMatrixFilter = class extends Filter {
		constructor(options = {}) {
			const colorMatrixUniforms = new UniformGroup({
				uColorMatrix: {
					value: [
						1,
						0,
						0,
						0,
						0,
						0,
						1,
						0,
						0,
						0,
						0,
						0,
						1,
						0,
						0,
						0,
						0,
						0,
						1,
						0
					],
					type: "f32",
					size: 20
				},
				uAlpha: {
					value: 1,
					type: "f32"
				}
			});
			const gpuProgram = GpuProgram.from({
				vertex: {
					source,
					entryPoint: "mainVertex"
				},
				fragment: {
					source,
					entryPoint: "mainFragment"
				}
			});
			const glProgram = GlProgram.from({
				vertex,
				fragment,
				name: "color-matrix-filter"
			});
			super({
				...options,
				gpuProgram,
				glProgram,
				resources: { colorMatrixUniforms }
			});
			this.alpha = 1;
		}
		/**
		* Transforms current matrix and set the new one
		* @param {number[]} matrix - 5x4 matrix
		* @param multiply - if true, current matrix and matrix are multiplied. If false,
		*  just set the current matrix with matrix
		*/
		_loadMatrix(matrix, multiply = false) {
			if (multiply) {
				const newMatrix = [...matrix];
				this._multiply(newMatrix, this.matrix, matrix);
				this.resources.colorMatrixUniforms.uniforms.uColorMatrix = newMatrix;
			} else this.resources.colorMatrixUniforms.uniforms.uColorMatrix = matrix;
			this.resources.colorMatrixUniforms.update();
		}
		/**
		* Multiplies two mat5's
		* @private
		* @param out - 5x4 matrix the receiving matrix
		* @param a - 5x4 matrix the first operand
		* @param b - 5x4 matrix the second operand
		* @returns {number[]} 5x4 matrix
		*/
		_multiply(out, a, b) {
			out[0] = a[0] * b[0] + a[1] * b[5] + a[2] * b[10] + a[3] * b[15];
			out[1] = a[0] * b[1] + a[1] * b[6] + a[2] * b[11] + a[3] * b[16];
			out[2] = a[0] * b[2] + a[1] * b[7] + a[2] * b[12] + a[3] * b[17];
			out[3] = a[0] * b[3] + a[1] * b[8] + a[2] * b[13] + a[3] * b[18];
			out[4] = a[0] * b[4] + a[1] * b[9] + a[2] * b[14] + a[3] * b[19] + a[4];
			out[5] = a[5] * b[0] + a[6] * b[5] + a[7] * b[10] + a[8] * b[15];
			out[6] = a[5] * b[1] + a[6] * b[6] + a[7] * b[11] + a[8] * b[16];
			out[7] = a[5] * b[2] + a[6] * b[7] + a[7] * b[12] + a[8] * b[17];
			out[8] = a[5] * b[3] + a[6] * b[8] + a[7] * b[13] + a[8] * b[18];
			out[9] = a[5] * b[4] + a[6] * b[9] + a[7] * b[14] + a[8] * b[19] + a[9];
			out[10] = a[10] * b[0] + a[11] * b[5] + a[12] * b[10] + a[13] * b[15];
			out[11] = a[10] * b[1] + a[11] * b[6] + a[12] * b[11] + a[13] * b[16];
			out[12] = a[10] * b[2] + a[11] * b[7] + a[12] * b[12] + a[13] * b[17];
			out[13] = a[10] * b[3] + a[11] * b[8] + a[12] * b[13] + a[13] * b[18];
			out[14] = a[10] * b[4] + a[11] * b[9] + a[12] * b[14] + a[13] * b[19] + a[14];
			out[15] = a[15] * b[0] + a[16] * b[5] + a[17] * b[10] + a[18] * b[15];
			out[16] = a[15] * b[1] + a[16] * b[6] + a[17] * b[11] + a[18] * b[16];
			out[17] = a[15] * b[2] + a[16] * b[7] + a[17] * b[12] + a[18] * b[17];
			out[18] = a[15] * b[3] + a[16] * b[8] + a[17] * b[13] + a[18] * b[18];
			out[19] = a[15] * b[4] + a[16] * b[9] + a[17] * b[14] + a[18] * b[19] + a[19];
			return out;
		}
		/**
		* Adjusts the brightness of a display object.
		*
		* The brightness adjustment works by multiplying the RGB channels by a scalar value while keeping
		* the alpha channel unchanged. Values below 1 darken the image, while values above 1 brighten it.
		* @param b - The brightness multiplier to apply. Values between 0-1 darken the image (0 being black),
		*           while values > 1 brighten it (2.0 would make it twice as bright)
		* @param multiply - When true, the new matrix is multiplied with the current one instead of replacing it.
		*                  This allows for cumulative effects when calling multiple color adjustments.
		* @example
		* ```ts
		* // Create a new color matrix filter
		* const colorMatrix = new ColorMatrixFilter();
		*
		* // Darken the image to 50% brightness
		* colorMatrix.brightness(0.5, false);
		*
		* // Chain with other effects by using multiply
		* colorMatrix
		*     .brightness(1.2, true)  // Brighten by 20%
		*     .saturate(1.1, true);   // Increase saturation by 10%
		* ```
		*/
		brightness(b, multiply) {
			const matrix = [
				b,
				0,
				0,
				0,
				0,
				0,
				b,
				0,
				0,
				0,
				0,
				0,
				b,
				0,
				0,
				0,
				0,
				0,
				1,
				0
			];
			this._loadMatrix(matrix, multiply);
		}
		/**
		* Sets each channel on the diagonal of the color matrix to apply a color tint.
		*
		* This method provides a way to tint display objects using the color matrix filter, similar to
		* the tint property available on Sprites and other display objects. The tint is applied by
		* scaling the RGB channels of each pixel.
		* @param color - The color to use for tinting, this can be any valid color source.
		* @param multiply - When true, the new tint matrix is multiplied with the current matrix instead
		*                  of replacing it. This allows for combining tints with other color effects.
		* @example
		* ```ts
		* const colorMatrix = new ColorMatrixFilter();
		*
		* // Apply a red tint
		* colorMatrix.tint(0xff0000);
		*
		* // Layer a green tint on top of existing effects
		* colorMatrix.tint('green', true);
		*
		* // Chain with other color adjustments
		* colorMatrix
		*     .tint('blue')       // Blue tint
		*     .brightness(1.2, true) // Increase brightness
		* ```
		*/
		tint(color, multiply) {
			const [r, g, b] = Color.shared.setValue(color).toArray();
			const matrix = [
				r,
				0,
				0,
				0,
				0,
				0,
				g,
				0,
				0,
				0,
				0,
				0,
				b,
				0,
				0,
				0,
				0,
				0,
				1,
				0
			];
			this._loadMatrix(matrix, multiply);
		}
		/**
		* Converts the display object to greyscale by applying a weighted matrix transformation.
		*
		* The greyscale effect works by setting equal RGB values for each pixel based on the scale parameter,
		* effectively removing color information while preserving luminance.
		* @param scale - The intensity of the greyscale effect. Value between 0-1, where:
		*               - 0 produces black
		*               - 0.5 produces 50% grey
		*               - 1 produces white
		* @param multiply - When true, the new matrix is multiplied with the current matrix instead of replacing it.
		*                  This allows for cumulative effects when calling multiple color adjustments.
		* @example
		* ```ts
		* const colorMatrix = new ColorMatrixFilter();
		*
		* // Convert to 50% grey
		* colorMatrix.greyscale(0.5, false);
		*
		* // Chain with other effects
		* colorMatrix
		*     .greyscale(0.6, true)    // Add grey tint
		*     .brightness(1.2, true);   // Brighten the result
		* ```
		*/
		greyscale(scale, multiply) {
			const matrix = [
				scale,
				scale,
				scale,
				0,
				0,
				scale,
				scale,
				scale,
				0,
				0,
				scale,
				scale,
				scale,
				0,
				0,
				0,
				0,
				0,
				1,
				0
			];
			this._loadMatrix(matrix, multiply);
		}
		/**
		* Converts the display object to grayscale by applying a weighted matrix transformation.
		*
		* The grayscale effect works by setting equal RGB values for each pixel based on the scale parameter,
		* effectively removing color information while preserving luminance.
		* @param scale - The intensity of the grayscale effect. Value between 0-1, where:
		*               - 0 produces black
		*               - 0.5 produces 50% grey
		*               - 1 produces white
		* @param multiply - When true, the new matrix is multiplied with the current matrix instead of replacing it.
		*                  This allows for cumulative effects when calling multiple color adjustments.
		* @example
		* ```ts
		* const colorMatrix = new ColorMatrixFilter();
		*
		* // Convert to 50% grey
		* colorMatrix.grayscale(0.5, false);
		*
		* // Chain with other effects
		* colorMatrix
		*     .grayscale(0.6, true)    // Add grey tint
		*     .brightness(1.2, true);   // Brighten the result
		* ```
		*/
		grayscale(scale, multiply) {
			this.greyscale(scale, multiply);
		}
		/**
		* Converts the display object to pure black and white using a luminance-based threshold.
		*
		* This method applies a matrix transformation that removes all color information and reduces
		* the image to just black and white values based on the luminance of each pixel. The transformation
		* uses standard luminance weightings: 30% red, 60% green, and 10% blue.
		* @param multiply - When true, the new matrix is multiplied with the current matrix instead of replacing it.
		*                  This allows for cumulative effects when calling multiple color adjustments.
		* @example
		* ```ts
		* const colorMatrix = new ColorMatrixFilter();
		*
		* // Convert to black and white
		* colorMatrix.blackAndWhite(false);
		*
		* // Chain with other effects
		* colorMatrix
		*     .blackAndWhite(true)     // Apply B&W effect
		*     .brightness(1.2, true);   // Then increase brightness
		* ```
		*/
		blackAndWhite(multiply) {
			this._loadMatrix([
				.3,
				.6,
				.1,
				0,
				0,
				.3,
				.6,
				.1,
				0,
				0,
				.3,
				.6,
				.1,
				0,
				0,
				0,
				0,
				0,
				1,
				0
			], multiply);
		}
		/**
		* Adjusts the hue of the display object by rotating the color values around the color wheel.
		*
		* This method uses an optimized matrix transformation that accurately rotates the RGB color space
		* around its luminance axis. The implementation is based on RGB cube rotation in 3D space, providing
		* better results than traditional matrices with magic luminance constants.
		* @param rotation - The angle of rotation in degrees around the color wheel:
		*                  - 0 = no change
		*                  - 90 = rotate colors 90° clockwise
		*                  - 180 = invert all colors
		*                  - 270 = rotate colors 90° counter-clockwise
		* @param multiply - When true, the new matrix is multiplied with the current matrix instead of replacing it.
		*                  This allows for cumulative effects when calling multiple color adjustments.
		* @example
		* ```ts
		* const colorMatrix = new ColorMatrixFilter();
		*
		* // Rotate hue by 90 degrees
		* colorMatrix.hue(90, false);
		*
		* // Chain multiple color adjustments
		* colorMatrix
		*     .hue(45, true)          // Rotate colors by 45°
		*     .saturate(1.2, true)    // Increase saturation
		*     .brightness(1.1, true); // Slightly brighten
		* ```
		*/
		hue(rotation, multiply) {
			rotation = (rotation || 0) / 180 * Math.PI;
			const cosR = Math.cos(rotation);
			const sinR = Math.sin(rotation);
			const sqrt = Math.sqrt;
			const w = 1 / 3;
			const sqrW = sqrt(w);
			const matrix = [
				cosR + (1 - cosR) * w,
				w * (1 - cosR) - sqrW * sinR,
				w * (1 - cosR) + sqrW * sinR,
				0,
				0,
				w * (1 - cosR) + sqrW * sinR,
				cosR + w * (1 - cosR),
				w * (1 - cosR) - sqrW * sinR,
				0,
				0,
				w * (1 - cosR) - sqrW * sinR,
				w * (1 - cosR) + sqrW * sinR,
				cosR + w * (1 - cosR),
				0,
				0,
				0,
				0,
				0,
				1,
				0
			];
			this._loadMatrix(matrix, multiply);
		}
		/**
		* Adjusts the contrast of the display object by modifying the separation between dark and bright values.
		*
		* This method applies a matrix transformation that affects the difference between dark and light areas
		* in the image. Increasing contrast makes shadows darker and highlights brighter, while decreasing
		* contrast brings shadows up and highlights down, reducing the overall dynamic range.
		* @param amount - The contrast adjustment value. Range is 0 to 1, where:
		*                - 0 represents minimum contrast (flat gray)
		*                - 0.5 represents normal contrast
		*                - 1 represents maximum contrast
		* @param multiply - When true, the new matrix is multiplied with the current matrix instead of replacing it.
		*                  This allows for cumulative effects when calling multiple color adjustments.
		* @example
		* ```ts
		* const colorMatrix = new ColorMatrixFilter();
		*
		* // Increase contrast by 50%
		* colorMatrix.contrast(0.75, false);
		*
		* // Chain with other effects
		* colorMatrix
		*     .contrast(0.6, true)     // Boost contrast
		*     .brightness(1.1, true)   // Slightly brighten
		*     .saturate(1.2, true);    // Increase color intensity
		* ```
		*/
		contrast(amount, multiply) {
			const v = (amount || 0) + 1;
			const o = -.5 * (v - 1);
			const matrix = [
				v,
				0,
				0,
				0,
				o,
				0,
				v,
				0,
				0,
				o,
				0,
				0,
				v,
				0,
				o,
				0,
				0,
				0,
				1,
				0
			];
			this._loadMatrix(matrix, multiply);
		}
		/**
		* Adjusts the saturation of the display object by modifying color separation.
		*
		* This method applies a matrix transformation that affects the intensity of colors.
		* Increasing saturation makes colors more vivid and intense, while decreasing saturation
		* moves colors toward grayscale.
		* @param amount - The saturation adjustment value. Range is -1 to 1, where:
		*                - -1 produces grayscale
		*                - 0 represents no change
		*                - 1 produces maximum saturation
		* @param multiply - When true, the new matrix is multiplied with the current matrix instead of replacing it.
		*                  This allows for cumulative effects when calling multiple color adjustments.
		* @example
		* ```ts
		* const colorMatrix = new ColorMatrixFilter();
		*
		* // Double the saturation
		* colorMatrix.saturate(1, false);
		*
		* // Chain with other effects
		* colorMatrix
		*     .saturate(0.5, true)     // Increase saturation by 50%
		*     .brightness(1.1, true)    // Slightly brighten
		*     .contrast(0.8, true);     // Reduce contrast
		* ```
		*/
		saturate(amount = 0, multiply) {
			const x = amount * 2 / 3 + 1;
			const y = (x - 1) * -.5;
			const matrix = [
				x,
				y,
				y,
				0,
				0,
				y,
				x,
				y,
				0,
				0,
				y,
				y,
				x,
				0,
				0,
				0,
				0,
				0,
				1,
				0
			];
			this._loadMatrix(matrix, multiply);
		}
		/**
		* Completely removes color information from the display object, creating a grayscale version.
		*
		* This is a convenience method that calls `saturate(-1)` internally. The transformation preserves
		* the luminance of the original image while removing all color information.
		* @example
		* ```ts
		* const colorMatrix = new ColorMatrixFilter();
		*
		* // Convert image to grayscale
		* colorMatrix.desaturate();
		*
		* // Can be chained with other effects
		* colorMatrix
		*     .desaturate()         // Remove all color
		*     .brightness(1.2);     // Then increase brightness
		* ```
		*/
		desaturate() {
			this.saturate(-1);
		}
		/**
		* Creates a negative effect by inverting all colors in the display object.
		*
		* This method applies a matrix transformation that inverts the RGB values of each pixel
		* while preserving the alpha channel. The result is similar to a photographic negative.
		* @param multiply - When true, the new matrix is multiplied with the current matrix instead of replacing it.
		*                  This allows for cumulative effects when calling multiple color adjustments.
		* @example
		* ```ts
		* const colorMatrix = new ColorMatrixFilter();
		*
		* // Create negative effect
		* colorMatrix.negative(false);
		*
		* // Chain with other effects
		* colorMatrix
		*     .negative(true)       // Apply negative effect
		*     .brightness(1.2, true) // Increase brightness
		*     .contrast(0.8, true);  // Reduce contrast
		* ```
		*/
		negative(multiply) {
			this._loadMatrix([
				-1,
				0,
				0,
				1,
				0,
				0,
				-1,
				0,
				1,
				0,
				0,
				0,
				-1,
				1,
				0,
				0,
				0,
				0,
				1,
				0
			], multiply);
		}
		/**
		* Applies a sepia tone effect to the display object, creating a warm brown tint reminiscent of vintage photographs.
		*
		* This method applies a matrix transformation that converts colors to various shades of brown while
		* preserving the original luminance values.
		* @param multiply - When true, the new matrix is multiplied with the current matrix instead of replacing it.
		*                  This allows for cumulative effects when calling multiple color adjustments.
		* @example
		* ```ts
		* const colorMatrix = new ColorMatrixFilter();
		*
		* // Apply sepia effect
		* colorMatrix.sepia(false);
		*
		* // Chain with other effects
		* colorMatrix
		*     .sepia(true)           // Add sepia tone
		*     .brightness(1.1, true)  // Slightly brighten
		*     .contrast(0.9, true);   // Reduce contrast
		* ```
		*/
		sepia(multiply) {
			this._loadMatrix([
				.393,
				.7689999,
				.18899999,
				0,
				0,
				.349,
				.6859999,
				.16799999,
				0,
				0,
				.272,
				.5339999,
				.13099999,
				0,
				0,
				0,
				0,
				0,
				1,
				0
			], multiply);
		}
		/**
		* Applies a Technicolor-style effect that simulates the early color motion picture process.
		*
		* This method applies a matrix transformation that recreates the distinctive look of the
		* Technicolor process. The effect produces highly
		* saturated colors with a particular emphasis on reds, greens, and blues.
		* @param multiply - When true, the new matrix is multiplied with the current matrix instead of replacing it.
		*                  This allows for cumulative effects when calling multiple color adjustments.
		* @example
		* ```ts
		* const colorMatrix = new ColorMatrixFilter();
		*
		* // Apply Technicolor effect
		* colorMatrix.technicolor(false);
		*
		* // Chain with other effects
		* colorMatrix
		*     .technicolor(true)      // Add Technicolor effect
		*     .contrast(1.1, true)    // Boost contrast
		*     .brightness(0.9, true); // Slightly darken
		* ```
		*/
		technicolor(multiply) {
			this._loadMatrix([
				1.9125277891456083,
				-.8545344976951645,
				-.09155508482755585,
				0,
				.046249425232852304,
				-.3087833385928097,
				1.7658908555458428,
				-.10601743074722245,
				0,
				-.2758903984886823,
				-.231103377548616,
				-.7501899197440212,
				1.847597816108189,
				0,
				.12137623870388682,
				0,
				0,
				0,
				1,
				0
			], multiply);
		}
		/**
		* Applies a vintage Polaroid camera effect to the display object.
		*
		* This method applies a matrix transformation that simulates the distinctive look of
		* Polaroid instant photographs, characterized by slightly enhanced contrast, subtle color shifts,
		* and a warm overall tone.
		* @param multiply - When true, the new matrix is multiplied with the current matrix instead of replacing it.
		*                  This allows for cumulative effects when calling multiple color adjustments.
		* @example
		* ```ts
		* const colorMatrix = new ColorMatrixFilter();
		*
		* // Apply Polaroid effect
		* colorMatrix.polaroid(false);
		*
		* // Chain with other effects
		* colorMatrix
		*     .polaroid(true)         // Add Polaroid effect
		*     .brightness(1.1, true)  // Slightly brighten
		*     .contrast(1.1, true);   // Boost contrast
		* ```
		*/
		polaroid(multiply) {
			this._loadMatrix([
				1.438,
				-.062,
				-.062,
				0,
				0,
				-.122,
				1.378,
				-.122,
				0,
				0,
				-.016,
				-.016,
				1.483,
				0,
				0,
				0,
				0,
				0,
				1,
				0
			], multiply);
		}
		/**
		* Swaps the red and blue color channels in the display object.
		*
		* This method applies a matrix transformation that exchanges the red and blue color values
		* while keeping the green channel and alpha unchanged.
		* @param multiply - When true, the new matrix is multiplied with the current matrix instead of replacing it.
		*                  This allows for cumulative effects when calling multiple color adjustments.
		* @example
		* ```ts
		* const colorMatrix = new ColorMatrixFilter();
		*
		* // Swap red and blue channels
		* colorMatrix.toBGR(false);
		*
		* // Chain with other effects
		* colorMatrix
		*     .toBGR(true)           // Swap R and B channels
		*     .brightness(1.1, true)  // Slightly brighten
		*     .contrast(0.9, true);   // Reduce contrast
		* ```
		*/
		toBGR(multiply) {
			this._loadMatrix([
				0,
				0,
				1,
				0,
				0,
				0,
				1,
				0,
				0,
				0,
				1,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				1,
				0
			], multiply);
		}
		/**
		* Applies a Kodachrome color effect that simulates the iconic film stock.
		*
		* This method applies a matrix transformation that recreates the distinctive look of Kodachrome film,
		* known for its rich, vibrant colors and excellent image preservation qualities. The effect emphasizes
		* reds and blues while producing deep, true blacks.
		* @param multiply - When true, the new matrix is multiplied with the current matrix instead of replacing it.
		*                  This allows for cumulative effects when calling multiple color adjustments.
		* @example
		* ```ts
		* const colorMatrix = new ColorMatrixFilter();
		*
		* // Apply Kodachrome effect
		* colorMatrix.kodachrome(false);
		*
		* // Chain with other effects
		* colorMatrix
		*     .kodachrome(true)       // Add Kodachrome effect
		*     .contrast(1.1, true)    // Boost contrast
		*     .brightness(0.9, true); // Slightly darken
		* ```
		*/
		kodachrome(multiply) {
			this._loadMatrix([
				1.1285582396593525,
				-.3967382283601348,
				-.03992559172921793,
				0,
				.24991995145868634,
				-.16404339962244616,
				1.0835251566291304,
				-.05498805115633132,
				0,
				.09698983488904393,
				-.16786010706155763,
				-.5603416277695248,
				1.6014850761964943,
				0,
				.13972481597886063,
				0,
				0,
				0,
				1,
				0
			], multiply);
		}
		/**
		* Applies a stylized brown-tinted effect to the display object.
		*
		* This method applies a matrix transformation that creates a rich, warm brown tone
		* with enhanced contrast and subtle color shifts.
		* @param multiply - When true, the new matrix is multiplied with the current matrix instead of replacing it.
		*                  This allows for cumulative effects when calling multiple color adjustments.
		* @example
		* ```ts
		* const colorMatrix = new ColorMatrixFilter();
		*
		* // Apply browni effect
		* colorMatrix.browni(false);
		*
		* // Chain with other effects
		* colorMatrix
		*     .browni(true)          // Add brown tint
		*     .brightness(1.1, true)  // Slightly brighten
		*     .contrast(1.2, true);   // Boost contrast
		* ```
		*/
		browni(multiply) {
			this._loadMatrix([
				.5997023498159715,
				.34553243048391263,
				-.2708298674538042,
				0,
				.1860075629647401,
				-.037703249837783157,
				.8609577587992641,
				.15059552388459913,
				0,
				-.14497417640467167,
				.24113635128153335,
				-.07441037908422492,
				.44972182064877153,
				0,
				-.029655197167024642,
				0,
				0,
				0,
				1,
				0
			], multiply);
		}
		/**
		* Applies a vintage photo effect that simulates old photography techniques.
		*
		* This method applies a matrix transformation that creates a nostalgic, aged look
		* with muted colors, enhanced warmth, and subtle vignetting.
		* @param multiply - When true, the new matrix is multiplied with the current matrix instead of replacing it.
		*                  This allows for cumulative effects when calling multiple color adjustments.
		* @example
		* ```ts
		* const colorMatrix = new ColorMatrixFilter();
		*
		* // Apply vintage effect
		* colorMatrix.vintage(false);
		*
		* // Chain with other effects
		* colorMatrix
		*     .vintage(true)          // Add vintage look
		*     .brightness(0.9, true)  // Slightly darken
		*     .contrast(1.1, true);   // Boost contrast
		* ```
		*/
		vintage(multiply) {
			this._loadMatrix([
				.6279345635605994,
				.3202183420819367,
				-.03965408211312453,
				0,
				.037848179746251466,
				.02578397704808868,
				.6441188644374771,
				.03259127616149294,
				0,
				.029265996770472907,
				.0466055556782719,
				-.0851232987247891,
				.5241648018700465,
				0,
				.020232119953863904,
				0,
				0,
				0,
				1,
				0
			], multiply);
		}
		/**
		* We don't know exactly what it does, kind of gradient map, but funny to play with!
		* @param desaturation - Tone values.
		* @param toned - Tone values.
		* @param lightColor - Tone values, example: `0xFFE580`
		* @param darkColor - Tone values, example: `0xFFE580`
		* @param multiply - if true, current matrix and matrix are multiplied. If false,
		*  just set the current matrix with matrix
		* @example
		* ```ts
		* const colorMatrix = new ColorMatrixFilter();
		*
		* // Create sepia-like effect with custom colors
		* colorMatrix.colorTone(
		*     0.3,        // Moderate desaturation
		*     0.2,        // Moderate toning
		*     0xFFE580,   // Warm highlight color
		*     0x338000,   // Dark green shadows
		*     false
		* );
		*
		* // Chain with other effects
		* colorMatrix
		*     .colorTone(0.2, 0.15, 0xFFE580, 0x338000, true)
		*     .brightness(1.1, true);  // Slightly brighten
		* ```
		*/
		colorTone(desaturation, toned, lightColor, darkColor, multiply) {
			desaturation || (desaturation = .2);
			toned || (toned = .15);
			lightColor || (lightColor = 16770432);
			darkColor || (darkColor = 3375104);
			const temp = Color.shared;
			const [lR, lG, lB] = temp.setValue(lightColor).toArray();
			const [dR, dG, dB] = temp.setValue(darkColor).toArray();
			const matrix = [
				.3,
				.59,
				.11,
				0,
				0,
				lR,
				lG,
				lB,
				desaturation,
				0,
				dR,
				dG,
				dB,
				toned,
				0,
				lR - dR,
				lG - dG,
				lB - dB,
				0,
				0
			];
			this._loadMatrix(matrix, multiply);
		}
		/**
		* Applies a night vision effect to the display object.
		*
		* This method applies a matrix transformation that simulates night vision by enhancing
		* certain color channels while suppressing others, creating a green-tinted effect
		* similar to night vision goggles.
		* @param intensity - The intensity of the night effect (0-1):
		*                   - 0 produces no effect
		*                   - 0.1 produces a subtle night vision effect (default)
		*                   - 1 produces maximum night vision effect
		* @param multiply - When true, the new matrix is multiplied with the current matrix instead of replacing it.
		*                  This allows for cumulative effects when calling multiple color adjustments.
		* @example
		* ```ts
		* const colorMatrix = new ColorMatrixFilter();
		*
		* // Apply night vision effect
		* colorMatrix.night(0.3, false);
		*
		* // Chain with other effects
		* colorMatrix
		*     .night(0.2, true)        // Add night vision
		*     .brightness(1.1, true)    // Slightly brighten
		*     .contrast(1.2, true);     // Boost contrast
		* ```
		*/
		night(intensity, multiply) {
			intensity || (intensity = .1);
			const matrix = [
				intensity * -2,
				-intensity,
				0,
				0,
				0,
				-intensity,
				0,
				intensity,
				0,
				0,
				0,
				intensity,
				intensity * 2,
				0,
				0,
				0,
				0,
				0,
				1,
				0
			];
			this._loadMatrix(matrix, multiply);
		}
		/**
		* Predator effect
		*
		* Erase the current matrix by setting a new independent one
		* @param amount - how much the predator feels his future victim
		* @param multiply - if true, current matrix and matrix are multiplied. If false,
		*  just set the current matrix with matrix
		* @example
		* ```ts
		* const colorMatrix = new ColorMatrixFilter();
		*
		* // Apply thermal vision effect
		* colorMatrix.predator(0.5, false);
		*
		* // Chain with other effects
		* colorMatrix
		*     .predator(0.3, true)      // Add thermal effect
		*     .contrast(1.2, true)      // Boost contrast
		*     .brightness(1.1, true);   // Slightly brighten
		* ```
		*/
		predator(amount, multiply) {
			const matrix = [
				11.224130630493164 * amount,
				-4.794486999511719 * amount,
				-2.8746118545532227 * amount,
				0 * amount,
				.40342438220977783 * amount,
				-3.6330697536468506 * amount,
				9.193157196044922 * amount,
				-2.951810836791992 * amount,
				0 * amount,
				-1.316135048866272 * amount,
				-3.2184197902679443 * amount,
				-4.2375030517578125 * amount,
				7.476448059082031 * amount,
				0 * amount,
				.8044459223747253 * amount,
				0,
				0,
				0,
				1,
				0
			];
			this._loadMatrix(matrix, multiply);
		}
		/**
		* Applies a psychedelic color effect that creates dramatic color shifts.
		*
		* This method applies a matrix transformation that produces vibrant colors
		* through channel mixing and amplification. Creates an effect reminiscent of
		* color distortions in psychedelic art.
		* @param multiply - When true, the new matrix is multiplied with the current matrix instead of replacing it.
		*                  This allows for cumulative effects when calling multiple color adjustments.
		* @example
		* ```ts
		* const colorMatrix = new ColorMatrixFilter();
		*
		* // Apply psychedelic effect
		* colorMatrix.lsd(false);
		*
		* // Chain with other effects
		* colorMatrix
		*     .lsd(true)             // Add color distortion
		*     .brightness(0.9, true)  // Slightly darken
		*     .contrast(1.2, true);   // Boost contrast
		* ```
		*/
		lsd(multiply) {
			this._loadMatrix([
				2,
				-.4,
				.5,
				0,
				0,
				-.5,
				2,
				-.4,
				0,
				0,
				-.4,
				-.5,
				3,
				0,
				0,
				0,
				0,
				0,
				1,
				0
			], multiply);
		}
		/**
		* Resets the color matrix filter to its default state.
		*
		* This method resets all color transformations by setting the matrix back to its identity state.
		* The identity matrix leaves colors unchanged, effectively removing all previously applied effects.
		* @example
		* ```ts
		* const colorMatrix = new ColorMatrixFilter();
		*
		* // Apply some effects
		* colorMatrix
		*     .sepia(true)
		*     .brightness(1.2, true);
		*
		* // Reset back to original colors
		* colorMatrix.reset();
		* ```
		*/
		reset() {
			this._loadMatrix([
				1,
				0,
				0,
				0,
				0,
				0,
				1,
				0,
				0,
				0,
				0,
				0,
				1,
				0,
				0,
				0,
				0,
				0,
				1,
				0
			], false);
		}
		/**
		* The current color transformation matrix of the filter.
		*
		* This 5x4 matrix transforms RGBA color and alpha values of each pixel. The matrix is stored
		* as a 20-element array in row-major order.
		* @type {ColorMatrix}
		* @default [
		*     1, 0, 0, 0, 0,  // Red channel
		*     0, 1, 0, 0, 0,  // Green channel
		*     0, 0, 1, 0, 0,  // Blue channel
		*     0, 0, 0, 1, 0   // Alpha channel
		* ]
		* @example
		* ```ts
		* const colorMatrix = new ColorMatrixFilter();
		* // Get the current color matrix
		* const currentMatrix = colorMatrix.matrix;
		* // Modify the matrix
		* colorMatrix.matrix = [
		*     1, 0, 0, 0, 0,
		*     0, 1, 0, 0, 0,
		*     0, 0, 1, 0, 0,
		*     0, 0, 0, 1, 0
		* ];
		*/
		get matrix() {
			return this.resources.colorMatrixUniforms.uniforms.uColorMatrix;
		}
		set matrix(value) {
			this.resources.colorMatrixUniforms.uniforms.uColorMatrix = value;
		}
		/**
		* The opacity value used to blend between the original and transformed colors.
		*
		* This value controls how much of the color transformation is applied:
		* - 0 = Original color only (no effect)
		* - 0.5 = 50% blend of original and transformed colors
		* - 1 = Fully transformed color (default)
		* @default 1
		* @example
		* ```ts
		* const colorMatrix = new ColorMatrixFilter();
		*
		* // Apply sepia at 50% strength
		* colorMatrix.sepia(false);
		* colorMatrix.alpha = 0.5;
		*
		* // Fade between effects
		* colorMatrix
		*     .saturate(1.5)      // Increase saturation
		*     .contrast(1.2);     // Boost contrast
		* colorMatrix.alpha = 0.7; // Apply at 70% strength
		* ```
		*/
		get alpha() {
			return this.resources.colorMatrixUniforms.uniforms.uAlpha;
		}
		set alpha(value) {
			this.resources.colorMatrixUniforms.uniforms.uAlpha = value;
		}
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/scene/mesh/shared/MeshGeometry.mjs
var _MeshGeometry, MeshGeometry;
var init_MeshGeometry = __esmMin((() => {
	init_Buffer();
	init_const$3();
	init_Geometry();
	init_deprecation();
	_MeshGeometry = class _MeshGeometry extends Geometry {
		constructor(...args) {
			let options = args[0] ?? {};
			if (options instanceof Float32Array) {
				deprecation(v8_0_0, "use new MeshGeometry({ positions, uvs, indices }) instead");
				options = {
					positions: options,
					uvs: args[1],
					indices: args[2]
				};
			}
			options = {
				..._MeshGeometry.defaultOptions,
				...options
			};
			const positions = options.positions || new Float32Array([
				0,
				0,
				1,
				0,
				1,
				1,
				0,
				1
			]);
			let uvs = options.uvs;
			if (!uvs) if (options.positions) uvs = new Float32Array(positions.length);
			else uvs = new Float32Array([
				0,
				0,
				1,
				0,
				1,
				1,
				0,
				1
			]);
			const indices = options.indices || new Uint32Array([
				0,
				1,
				2,
				0,
				2,
				3
			]);
			const shrinkToFit = options.shrinkBuffersToFit;
			const positionBuffer = new Buffer({
				data: positions,
				label: "attribute-mesh-positions",
				shrinkToFit,
				usage: BufferUsage.VERTEX | BufferUsage.COPY_DST
			});
			const uvBuffer = new Buffer({
				data: uvs,
				label: "attribute-mesh-uvs",
				shrinkToFit,
				usage: BufferUsage.VERTEX | BufferUsage.COPY_DST
			});
			const indexBuffer = new Buffer({
				data: indices,
				label: "index-mesh-buffer",
				shrinkToFit,
				usage: BufferUsage.INDEX | BufferUsage.COPY_DST
			});
			super({
				attributes: {
					aPosition: {
						buffer: positionBuffer,
						format: "float32x2",
						stride: 8,
						offset: 0
					},
					aUV: {
						buffer: uvBuffer,
						format: "float32x2",
						stride: 8,
						offset: 0
					}
				},
				indexBuffer,
				topology: options.topology
			});
			this.batchMode = "auto";
		}
		/** The positions of the mesh. */
		get positions() {
			return this.attributes.aPosition.buffer.data;
		}
		/**
		* Set the positions of the mesh.
		* When setting the positions, its important that the uvs array is at least as long as the positions array.
		* otherwise the geometry will not be valid.
		* @param {Float32Array} value - The positions of the mesh.
		*/
		set positions(value) {
			this.attributes.aPosition.buffer.data = value;
		}
		/** The UVs of the mesh. */
		get uvs() {
			return this.attributes.aUV.buffer.data;
		}
		/**
		* Set the UVs of the mesh.
		* Its important that the uvs array you set is at least as long as the positions array.
		* otherwise the geometry will not be valid.
		* @param {Float32Array} value - The UVs of the mesh.
		*/
		set uvs(value) {
			this.attributes.aUV.buffer.data = value;
		}
		/** The indices of the mesh. */
		get indices() {
			return this.indexBuffer.data;
		}
		set indices(value) {
			this.indexBuffer.data = value;
		}
	};
	_MeshGeometry.defaultOptions = {
		topology: "triangle-list",
		shrinkBuffersToFit: false
	};
	MeshGeometry = _MeshGeometry;
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/scene/mesh/shared/BatchableMesh.mjs
var BatchableMesh;
var init_BatchableMesh = __esmMin((() => {
	BatchableMesh = class {
		constructor() {
			this.batcherName = "default";
			this.packAsQuad = false;
			this.indexOffset = 0;
			this.attributeOffset = 0;
			this.roundPixels = 0;
			this._batcher = null;
			this._batch = null;
			this._textureMatrixUpdateId = -1;
			this._uvUpdateId = -1;
		}
		get blendMode() {
			return this.renderable.groupBlendMode;
		}
		get topology() {
			return this._topology || this.geometry.topology;
		}
		set topology(value) {
			this._topology = value;
		}
		reset() {
			this.renderable = null;
			this.texture = null;
			this._batcher = null;
			this._batch = null;
			this.geometry = null;
			this._uvUpdateId = -1;
			this._textureMatrixUpdateId = -1;
		}
		/**
		* Sets the texture for the batchable mesh.
		* As it does so, it resets the texture matrix update ID.
		* this is to ensure that the texture matrix is recalculated when the uvs are referenced
		* @param value - The texture to set.
		*/
		setTexture(value) {
			if (this.texture === value) return;
			this.texture = value;
			this._textureMatrixUpdateId = -1;
		}
		get uvs() {
			const uvBuffer = this.geometry.getBuffer("aUV");
			const uvs = uvBuffer.data;
			let transformedUvs = uvs;
			const textureMatrix = this.texture.textureMatrix;
			if (!textureMatrix.isSimple) {
				transformedUvs = this._transformedUvs;
				if (this._textureMatrixUpdateId !== textureMatrix._updateID || this._uvUpdateId !== uvBuffer._updateID) {
					if (!transformedUvs || transformedUvs.length < uvs.length) transformedUvs = this._transformedUvs = new Float32Array(uvs.length);
					this._textureMatrixUpdateId = textureMatrix._updateID;
					this._uvUpdateId = uvBuffer._updateID;
					textureMatrix.multiplyUvs(uvs, transformedUvs);
				}
			}
			return transformedUvs;
		}
		get positions() {
			return this.geometry.positions;
		}
		get indices() {
			return this.geometry.indices;
		}
		get color() {
			return this.renderable.groupColorAlpha;
		}
		get groupTransform() {
			return this.renderable.groupTransform;
		}
		get attributeSize() {
			return this.geometry.positions.length / 2;
		}
		get indexSize() {
			return this.geometry.indices.length;
		}
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/scene/mesh/shared/MeshPipe.mjs
var MeshGpuData, MeshPipe;
var init_MeshPipe = __esmMin((() => {
	init_Extensions();
	init_Matrix();
	init_BindGroup();
	init_UniformGroup();
	init_getAdjustedBlendModeBlend();
	init_colorToUniform();
	init_BatchableMesh();
	MeshGpuData = class {
		destroy() {}
	};
	MeshPipe = class {
		constructor(renderer, adaptor) {
			this.localUniforms = new UniformGroup({
				uTransformMatrix: {
					value: new Matrix(),
					type: "mat3x3<f32>"
				},
				uColor: {
					value: new Float32Array([
						1,
						1,
						1,
						1
					]),
					type: "vec4<f32>"
				},
				uRound: {
					value: 0,
					type: "f32"
				}
			});
			this.localUniformsBindGroup = new BindGroup({ 0: this.localUniforms });
			this.renderer = renderer;
			this._adaptor = adaptor;
			this._adaptor.init();
		}
		validateRenderable(mesh) {
			const meshData = this._getMeshData(mesh);
			const wasBatched = meshData.batched;
			const isBatched = mesh.batched;
			meshData.batched = isBatched;
			if (wasBatched !== isBatched) return true;
			else if (isBatched) {
				const geometry = mesh._geometry;
				if (geometry.indices.length !== meshData.indexSize || geometry.positions.length !== meshData.vertexSize) {
					meshData.indexSize = geometry.indices.length;
					meshData.vertexSize = geometry.positions.length;
					return true;
				}
				const batchableMesh = this._getBatchableMesh(mesh);
				if (batchableMesh.texture.uid !== mesh._texture.uid) batchableMesh._textureMatrixUpdateId = -1;
				return !batchableMesh._batcher.checkAndUpdateTexture(batchableMesh, mesh._texture);
			}
			return false;
		}
		addRenderable(mesh, instructionSet) {
			const batcher = this.renderer.renderPipes.batch;
			const meshData = this._getMeshData(mesh);
			if (mesh.didViewUpdate) {
				meshData.indexSize = mesh._geometry.indices?.length;
				meshData.vertexSize = mesh._geometry.positions?.length;
			}
			if (meshData.batched) {
				const gpuBatchableMesh = this._getBatchableMesh(mesh);
				gpuBatchableMesh.setTexture(mesh._texture);
				gpuBatchableMesh.geometry = mesh._geometry;
				batcher.addToBatch(gpuBatchableMesh, instructionSet);
			} else {
				batcher.break(instructionSet);
				instructionSet.add(mesh);
			}
		}
		updateRenderable(mesh) {
			if (mesh.batched) {
				const gpuBatchableMesh = this._getBatchableMesh(mesh);
				gpuBatchableMesh.setTexture(mesh._texture);
				gpuBatchableMesh.geometry = mesh._geometry;
				gpuBatchableMesh._batcher.updateElement(gpuBatchableMesh);
			}
		}
		execute(mesh) {
			if (!mesh.isRenderable) return;
			mesh.state.blendMode = getAdjustedBlendModeBlend(mesh.groupBlendMode, mesh.texture._source);
			const localUniforms = this.localUniforms;
			localUniforms.uniforms.uTransformMatrix = mesh.groupTransform;
			localUniforms.uniforms.uRound = this.renderer._roundPixels | mesh._roundPixels;
			localUniforms.update();
			color32BitToUniform(mesh.groupColorAlpha, localUniforms.uniforms.uColor, 0);
			this._adaptor.execute(this, mesh);
		}
		_getMeshData(mesh) {
			var _a, _b;
			(_a = mesh._gpuData)[_b = this.renderer.uid] || (_a[_b] = new MeshGpuData());
			return mesh._gpuData[this.renderer.uid].meshData || this._initMeshData(mesh);
		}
		_initMeshData(mesh) {
			mesh._gpuData[this.renderer.uid].meshData = {
				batched: mesh.batched,
				indexSize: 0,
				vertexSize: 0
			};
			return mesh._gpuData[this.renderer.uid].meshData;
		}
		_getBatchableMesh(mesh) {
			var _a, _b;
			(_a = mesh._gpuData)[_b = this.renderer.uid] || (_a[_b] = new MeshGpuData());
			return mesh._gpuData[this.renderer.uid].batchableMesh || this._initBatchableMesh(mesh);
		}
		_initBatchableMesh(mesh) {
			const gpuMesh = new BatchableMesh();
			gpuMesh.renderable = mesh;
			gpuMesh.setTexture(mesh._texture);
			gpuMesh.transform = mesh.groupTransform;
			gpuMesh.roundPixels = this.renderer._roundPixels | mesh._roundPixels;
			mesh._gpuData[this.renderer.uid].batchableMesh = gpuMesh;
			return gpuMesh;
		}
		destroy() {
			this.localUniforms = null;
			this.localUniformsBindGroup = null;
			this._adaptor.destroy();
			this._adaptor = null;
			this.renderer = null;
		}
	};
	/** @ignore */
	MeshPipe.extension = {
		type: [ExtensionType.WebGLPipes, ExtensionType.WebGPUPipes],
		name: "mesh"
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/scene/mesh/init.mjs
var init_init = __esmMin((() => {
	init_Extensions();
	init_MeshPipe();
	extensions.add(MeshPipe);
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/scene/mesh/shared/Mesh.mjs
var Mesh;
var init_Mesh = __esmMin((() => {
	init_pointInTriangle();
	init_Geometry();
	init_State();
	init_Texture();
	init_deprecation();
	init_ViewContainer();
	init_MeshGeometry();
	init_init();
	Mesh = class extends ViewContainer {
		constructor(...args) {
			let options = args[0];
			if (options instanceof Geometry) {
				deprecation(v8_0_0, "Mesh: use new Mesh({ geometry, shader }) instead");
				options = {
					geometry: options,
					shader: args[1]
				};
				if (args[3]) {
					deprecation(v8_0_0, "Mesh: drawMode argument has been removed, use geometry.topology instead");
					options.geometry.topology = args[3];
				}
			}
			const { geometry, shader, texture, roundPixels, state, ...rest } = options;
			super({
				label: "Mesh",
				...rest
			});
			/** @internal */
			this.renderPipeId = "mesh";
			/** @internal */
			this._shader = null;
			this.allowChildren = false;
			this.shader = shader ?? null;
			this.texture = texture ?? shader?.texture ?? Texture.WHITE;
			this.state = state ?? State.for2d();
			this._geometry = geometry;
			this._geometry.on("update", this.onViewUpdate, this);
			this.roundPixels = roundPixels ?? false;
		}
		/** Alias for {@link Mesh#shader}. */
		get material() {
			deprecation(v8_0_0, "mesh.material property has been removed, use mesh.shader instead");
			return this._shader;
		}
		/**
		* Represents the vertex and fragment shaders that processes the geometry and runs on the GPU.
		* Can be shared between multiple Mesh objects.
		*/
		set shader(value) {
			if (this._shader === value) return;
			this._shader = value;
			this.onViewUpdate();
		}
		get shader() {
			return this._shader;
		}
		/**
		* Includes vertex positions, face indices, colors, UVs, and
		* custom attributes within buffers, reducing the cost of passing all
		* this data to the GPU. Can be shared between multiple Mesh objects.
		*/
		set geometry(value) {
			if (this._geometry === value) return;
			this._geometry?.off("update", this.onViewUpdate, this);
			value.on("update", this.onViewUpdate, this);
			this._geometry = value;
			this.onViewUpdate();
		}
		get geometry() {
			return this._geometry;
		}
		/** The texture that the Mesh uses. Null for non-MeshMaterial shaders */
		set texture(value) {
			value || (value = Texture.EMPTY);
			const currentTexture = this._texture;
			if (currentTexture === value) return;
			if (currentTexture && currentTexture.dynamic) currentTexture.off("update", this.onViewUpdate, this);
			if (value.dynamic) value.on("update", this.onViewUpdate, this);
			if (this.shader) this.shader.texture = value;
			this._texture = value;
			this.onViewUpdate();
		}
		get texture() {
			return this._texture;
		}
		get batched() {
			if (this._shader) return false;
			if ((this.state.data & 12) !== 0) return false;
			if (this._geometry instanceof MeshGeometry) {
				if (this._geometry.batchMode === "auto") return this._geometry.positions.length / 2 <= 100;
				return this._geometry.batchMode === "batch";
			}
			return false;
		}
		/**
		* The local bounds of the mesh.
		* @type {Bounds}
		*/
		get bounds() {
			return this._geometry.bounds;
		}
		/**
		* Update local bounds of the mesh.
		* @private
		*/
		updateBounds() {
			this._bounds = this._geometry.bounds;
		}
		/**
		* Checks if the object contains the given point.
		* @param point - The point to check
		*/
		containsPoint(point) {
			const { x, y } = point;
			if (!this.bounds.containsPoint(x, y)) return false;
			const vertices = this.geometry.getBuffer("aPosition").data;
			const step = this.geometry.topology === "triangle-strip" ? 3 : 1;
			if (this.geometry.getIndex()) {
				const indices = this.geometry.getIndex().data;
				const len = indices.length;
				for (let i = 0; i + 2 < len; i += step) {
					const ind0 = indices[i] * 2;
					const ind1 = indices[i + 1] * 2;
					const ind2 = indices[i + 2] * 2;
					if (pointInTriangle(x, y, vertices[ind0], vertices[ind0 + 1], vertices[ind1], vertices[ind1 + 1], vertices[ind2], vertices[ind2 + 1])) return true;
				}
			} else {
				const len = vertices.length / 2;
				for (let i = 0; i + 2 < len; i += step) {
					const ind0 = i * 2;
					const ind1 = (i + 1) * 2;
					const ind2 = (i + 2) * 2;
					if (pointInTriangle(x, y, vertices[ind0], vertices[ind0 + 1], vertices[ind1], vertices[ind1 + 1], vertices[ind2], vertices[ind2 + 1])) return true;
				}
			}
			return false;
		}
		/**
		* Destroys this sprite renderable and optionally its texture.
		* @param options - Options parameter. A boolean will act as if all options
		*  have been set to that value
		* @example
		* mesh.destroy();
		* mesh.destroy(true);
		* mesh.destroy({ texture: true, textureSource: true });
		*/
		destroy(options) {
			super.destroy(options);
			if (typeof options === "boolean" ? options : options?.texture) {
				const destroyTextureSource = typeof options === "boolean" ? options : options?.textureSource;
				this._texture.destroy(destroyTextureSource);
			}
			this._geometry?.off("update", this.onViewUpdate, this);
			this._texture = null;
			this._geometry = null;
			this._shader = null;
		}
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/utils/browser/isSafari.mjs
function isSafari() {
	const { userAgent } = DOMAdapter.get().getNavigator();
	return /^((?!chrome|android).)*safari/i.test(userAgent);
}
var init_isSafari = __esmMin((() => {
	init_adapter();
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/batcher/gl/GlBatchAdaptor.mjs
var GlBatchAdaptor;
var init_GlBatchAdaptor = __esmMin((() => {
	init_Extensions();
	init_State();
	GlBatchAdaptor = class {
		constructor() {
			this._tempState = State.for2d();
			/**
			* We only want to sync the a batched shaders uniforms once on first use
			* this is a hash of shader uids to a boolean value.  When the shader is first bound
			* we set the value to true.  When the shader is bound again we check the value and
			* if it is true we know that the uniforms have already been synced and we skip it.
			*/
			this._didUploadHash = {};
		}
		init(batcherPipe) {
			batcherPipe.renderer.runners.contextChange.add(this);
		}
		contextChange() {
			this._didUploadHash = {};
		}
		start(batchPipe, geometry, shader) {
			const renderer = batchPipe.renderer;
			const didUpload = this._didUploadHash[shader.uid];
			renderer.shader.bind(shader, didUpload);
			if (!didUpload) this._didUploadHash[shader.uid] = true;
			renderer.shader.updateUniformGroup(renderer.globalUniforms.uniformGroup);
			renderer.geometry.bind(geometry, shader.glProgram);
		}
		execute(batchPipe, batch) {
			const renderer = batchPipe.renderer;
			this._tempState.blendMode = batch.blendMode;
			renderer.state.set(this._tempState);
			const textures = batch.textures.textures;
			for (let i = 0; i < batch.textures.count; i++) renderer.texture.bind(textures[i], i);
			renderer.geometry.draw(batch.topology, batch.size, batch.start);
		}
	};
	/** @ignore */
	GlBatchAdaptor.extension = {
		type: [ExtensionType.WebGLPipesAdaptor],
		name: "batch"
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/batcher/gpu/GpuBatchAdaptor.mjs
var tempState, GpuBatchAdaptor;
var init_GpuBatchAdaptor = __esmMin((() => {
	init_Extensions();
	init_State();
	init_getTextureBatchBindGroup();
	tempState = State.for2d();
	GpuBatchAdaptor = class {
		start(batchPipe, geometry, shader) {
			const renderer = batchPipe.renderer;
			const encoder = renderer.encoder;
			const program = shader.gpuProgram;
			this._shader = shader;
			this._geometry = geometry;
			encoder.setGeometry(geometry, program);
			tempState.blendMode = "normal";
			renderer.pipeline.getPipeline(geometry, program, tempState);
			const globalUniformsBindGroup = renderer.globalUniforms.bindGroup;
			encoder.resetBindGroup(1);
			encoder.setBindGroup(0, globalUniformsBindGroup, program);
		}
		execute(batchPipe, batch) {
			const program = this._shader.gpuProgram;
			const renderer = batchPipe.renderer;
			const encoder = renderer.encoder;
			if (!batch.bindGroup) {
				const textureBatch = batch.textures;
				batch.bindGroup = getTextureBatchBindGroup(textureBatch.textures, textureBatch.count, renderer.limits.maxBatchableTextures);
			}
			tempState.blendMode = batch.blendMode;
			const gpuBindGroup = renderer.bindGroup.getBindGroup(batch.bindGroup, program, 1);
			const pipeline = renderer.pipeline.getPipeline(this._geometry, program, tempState, batch.topology);
			batch.bindGroup._touch(renderer.gc.now, renderer.tick);
			encoder.setPipeline(pipeline);
			encoder.renderPassEncoder.setBindGroup(1, gpuBindGroup);
			encoder.renderPassEncoder.drawIndexed(batch.size, 1, batch.start);
		}
	};
	/** @ignore */
	GpuBatchAdaptor.extension = {
		type: [ExtensionType.WebGPUPipesAdaptor],
		name: "batch"
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/buffer/const.mjs
var BUFFER_TYPE;
var init_const$1 = __esmMin((() => {
	BUFFER_TYPE = /* @__PURE__ */ ((BUFFER_TYPE2) => {
		BUFFER_TYPE2[BUFFER_TYPE2["ELEMENT_ARRAY_BUFFER"] = 34963] = "ELEMENT_ARRAY_BUFFER";
		BUFFER_TYPE2[BUFFER_TYPE2["ARRAY_BUFFER"] = 34962] = "ARRAY_BUFFER";
		BUFFER_TYPE2[BUFFER_TYPE2["UNIFORM_BUFFER"] = 35345] = "UNIFORM_BUFFER";
		return BUFFER_TYPE2;
	})(BUFFER_TYPE || {});
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/buffer/GlBuffer.mjs
var GlBuffer;
var init_GlBuffer = __esmMin((() => {
	GlBuffer = class {
		constructor(buffer, type) {
			this._lastBindBaseLocation = -1;
			this._lastBindCallId = -1;
			this.buffer = buffer || null;
			this.updateID = -1;
			this.byteLength = -1;
			this.type = type;
		}
		destroy() {
			this.buffer = null;
			this.updateID = -1;
			this.byteLength = -1;
			this.type = -1;
			this._lastBindBaseLocation = -1;
			this._lastBindCallId = -1;
		}
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/buffer/GlBufferSystem.mjs
var GlBufferSystem;
var init_GlBufferSystem = __esmMin((() => {
	init_Extensions();
	init_GCManagedHash();
	init_const$3();
	init_const$1();
	init_GlBuffer();
	GlBufferSystem = class {
		/**
		* @param {Renderer} renderer - The renderer this System works for.
		*/
		constructor(renderer) {
			/** Cache keeping track of the base bound buffer bases */
			this._boundBufferBases = /* @__PURE__ */ Object.create(null);
			this._minBaseLocation = 0;
			this._nextBindBaseIndex = this._minBaseLocation;
			this._bindCallId = 0;
			this._renderer = renderer;
			this._managedBuffers = new GCManagedHash({
				renderer,
				type: "resource",
				onUnload: this.onBufferUnload.bind(this),
				name: "glBuffer"
			});
		}
		/** @ignore */
		destroy() {
			this._managedBuffers.destroy();
			this._renderer = null;
			this._gl = null;
			this._boundBufferBases = {};
		}
		/** Sets up the renderer context and necessary buffers. */
		contextChange() {
			this._gl = this._renderer.gl;
			this.destroyAll(true);
			this._maxBindings = this._renderer.limits.maxUniformBindings;
		}
		getGlBuffer(buffer) {
			buffer._gcLastUsed = this._renderer.gc.now;
			return buffer._gpuData[this._renderer.uid] || this.createGLBuffer(buffer);
		}
		/**
		* This binds specified buffer. On first run, it will create the webGL buffers for the context too
		* @param buffer - the buffer to bind to the renderer
		*/
		bind(buffer) {
			const { _gl: gl } = this;
			const glBuffer = this.getGlBuffer(buffer);
			gl.bindBuffer(glBuffer.type, glBuffer.buffer);
		}
		/**
		* Binds an uniform buffer to at the given index.
		*
		* A cache is used so a buffer will not be bound again if already bound.
		* @param glBuffer - the buffer to bind
		* @param index - the base index to bind it to.
		*/
		bindBufferBase(glBuffer, index) {
			const { _gl: gl } = this;
			if (this._boundBufferBases[index] !== glBuffer) {
				this._boundBufferBases[index] = glBuffer;
				glBuffer._lastBindBaseLocation = index;
				gl.bindBufferBase(gl.UNIFORM_BUFFER, index, glBuffer.buffer);
			}
		}
		nextBindBase(hasTransformFeedback) {
			this._bindCallId++;
			this._minBaseLocation = 0;
			if (hasTransformFeedback) {
				this._boundBufferBases[0] = null;
				this._minBaseLocation = 1;
				if (this._nextBindBaseIndex < 1) this._nextBindBaseIndex = 1;
			}
		}
		freeLocationForBufferBase(glBuffer) {
			let freeIndex = this.getLastBindBaseLocation(glBuffer);
			if (freeIndex >= this._minBaseLocation) {
				glBuffer._lastBindCallId = this._bindCallId;
				return freeIndex;
			}
			let loop = 0;
			let nextIndex = this._nextBindBaseIndex;
			while (loop < 2) {
				if (nextIndex >= this._maxBindings) {
					nextIndex = this._minBaseLocation;
					loop++;
				}
				const curBuf = this._boundBufferBases[nextIndex];
				if (curBuf && curBuf._lastBindCallId === this._bindCallId) {
					nextIndex++;
					continue;
				}
				break;
			}
			freeIndex = nextIndex;
			this._nextBindBaseIndex = nextIndex + 1;
			if (loop >= 2) return -1;
			glBuffer._lastBindCallId = this._bindCallId;
			this._boundBufferBases[freeIndex] = null;
			return freeIndex;
		}
		getLastBindBaseLocation(glBuffer) {
			const index = glBuffer._lastBindBaseLocation;
			if (this._boundBufferBases[index] === glBuffer) return index;
			return -1;
		}
		/**
		* Binds a buffer whilst also binding its range.
		* This will make the buffer start from the offset supplied rather than 0 when it is read.
		* @param glBuffer - the buffer to bind
		* @param index - the base index to bind at, defaults to 0
		* @param offset - the offset to bind at (this is blocks of 256). 0 = 0, 1 = 256, 2 = 512 etc
		* @param size - the size to bind at (this is blocks of 256).
		*/
		bindBufferRange(glBuffer, index, offset, size) {
			const { _gl: gl } = this;
			offset || (offset = 0);
			index || (index = 0);
			this._boundBufferBases[index] = null;
			gl.bindBufferRange(gl.UNIFORM_BUFFER, index || 0, glBuffer.buffer, offset * 256, size || 256);
		}
		/**
		* Will ensure the data in the buffer is uploaded to the GPU.
		* @param {Buffer} buffer - the buffer to update
		*/
		updateBuffer(buffer) {
			const { _gl: gl } = this;
			const glBuffer = this.getGlBuffer(buffer);
			if (buffer._updateID === glBuffer.updateID) return glBuffer;
			glBuffer.updateID = buffer._updateID;
			gl.bindBuffer(glBuffer.type, glBuffer.buffer);
			const data = buffer.data;
			const drawType = buffer.descriptor.usage & BufferUsage.STATIC ? gl.STATIC_DRAW : gl.DYNAMIC_DRAW;
			if (data) if (glBuffer.byteLength >= data.byteLength) gl.bufferSubData(glBuffer.type, 0, data, 0, buffer._updateSize / data.BYTES_PER_ELEMENT);
			else {
				glBuffer.byteLength = data.byteLength;
				gl.bufferData(glBuffer.type, data, drawType);
			}
			else {
				glBuffer.byteLength = buffer.descriptor.size;
				gl.bufferData(glBuffer.type, glBuffer.byteLength, drawType);
			}
			return glBuffer;
		}
		/**
		* dispose all WebGL resources of all managed buffers
		* @param contextLost
		*/
		destroyAll(contextLost = false) {
			this._managedBuffers.removeAll(contextLost);
		}
		onBufferUnload(buffer, contextLost = false) {
			const glBuffer = buffer._gpuData[this._renderer.uid];
			if (!glBuffer) return;
			if (!contextLost) this._gl.deleteBuffer(glBuffer.buffer);
		}
		/**
		* creates and attaches a GLBuffer object tied to the current context.
		* @param buffer
		* @protected
		*/
		createGLBuffer(buffer) {
			const { _gl: gl } = this;
			let type = BUFFER_TYPE.ARRAY_BUFFER;
			if (buffer.descriptor.usage & BufferUsage.INDEX) type = BUFFER_TYPE.ELEMENT_ARRAY_BUFFER;
			else if (buffer.descriptor.usage & BufferUsage.UNIFORM) type = BUFFER_TYPE.UNIFORM_BUFFER;
			const glBuffer = new GlBuffer(gl.createBuffer(), type);
			buffer._gpuData[this._renderer.uid] = glBuffer;
			this._managedBuffers.add(buffer);
			return glBuffer;
		}
		resetState() {
			this._boundBufferBases = /* @__PURE__ */ Object.create(null);
		}
	};
	/** @ignore */
	GlBufferSystem.extension = {
		type: [ExtensionType.WebGLSystem],
		name: "buffer"
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/context/GlContextSystem.mjs
var _GlContextSystem, GlContextSystem;
var init_GlContextSystem = __esmMin((() => {
	init_adapter();
	init_Extensions();
	init_warn();
	_GlContextSystem = class _GlContextSystem {
		/** @param renderer - The renderer this System works for. */
		constructor(renderer) {
			/**
			* Features supported by current renderer.
			* @type {object}
			* @readonly
			*/
			this.supports = {
				/** Support for 32-bit indices buffer. */
				uint32Indices: true,
				/** Support for UniformBufferObjects */
				uniformBufferObject: true,
				/** Support for VertexArrayObjects */
				vertexArrayObject: true,
				/** Support for SRGB texture format */
				srgbTextures: true,
				/** Support for wrapping modes if a texture is non-power of two */
				nonPowOf2wrapping: true,
				/** Support for MSAA (antialiasing of dynamic textures) */
				msaa: true,
				/** Support for mipmaps if a texture is non-power of two */
				nonPowOf2mipmaps: true
			};
			this._renderer = renderer;
			this.extensions = /* @__PURE__ */ Object.create(null);
			this.handleContextLost = this.handleContextLost.bind(this);
			this.handleContextRestored = this.handleContextRestored.bind(this);
		}
		/**
		* `true` if the context is lost
		* @readonly
		*/
		get isLost() {
			return !this.gl || this.gl.isContextLost();
		}
		/**
		* Handles the context change event.
		* @param {WebGLRenderingContext} gl - New WebGL context.
		*/
		contextChange(gl) {
			this.gl = gl;
			this._renderer.gl = gl;
		}
		init(options) {
			options = {
				..._GlContextSystem.defaultOptions,
				...options
			};
			let multiView = this.multiView = options.multiView;
			if (options.context && multiView) {
				warn("Renderer created with both a context and multiview enabled. Disabling multiView as both cannot work together.");
				multiView = false;
			}
			if (multiView) this.canvas = DOMAdapter.get().createCanvas(this._renderer.canvas.width, this._renderer.canvas.height);
			else this.canvas = this._renderer.view.canvas;
			if (options.context) this.initFromContext(options.context);
			else {
				const alpha = this._renderer.background.alpha < 1;
				const premultipliedAlpha = options.premultipliedAlpha ?? true;
				const antialias = options.antialias && !this._renderer.backBuffer.useBackBuffer;
				this.createContext(options.preferWebGLVersion, {
					alpha,
					premultipliedAlpha,
					antialias,
					stencil: true,
					preserveDrawingBuffer: options.preserveDrawingBuffer,
					powerPreference: options.powerPreference ?? "default"
				});
			}
		}
		ensureCanvasSize(targetCanvas) {
			if (!this.multiView) {
				if (targetCanvas !== this.canvas) warn("multiView is disabled, but targetCanvas is not the main canvas");
				return;
			}
			const { canvas } = this;
			if (canvas.width < targetCanvas.width || canvas.height < targetCanvas.height) {
				canvas.width = Math.max(targetCanvas.width, targetCanvas.width);
				canvas.height = Math.max(targetCanvas.height, targetCanvas.height);
			}
		}
		/**
		* Initializes the context.
		* @protected
		* @param {WebGLRenderingContext} gl - WebGL context
		*/
		initFromContext(gl) {
			this.gl = gl;
			this.webGLVersion = gl instanceof DOMAdapter.get().getWebGLRenderingContext() ? 1 : 2;
			this.getExtensions();
			this.validateContext(gl);
			this._renderer.runners.contextChange.emit(gl);
			const element = this._renderer.view.canvas;
			element.addEventListener("webglcontextlost", this.handleContextLost, false);
			element.addEventListener("webglcontextrestored", this.handleContextRestored, false);
		}
		/**
		* Initialize from context options
		* @protected
		* @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext
		* @param preferWebGLVersion
		* @param {object} options - context attributes
		*/
		createContext(preferWebGLVersion, options) {
			let gl;
			const canvas = this.canvas;
			if (preferWebGLVersion === 2) gl = canvas.getContext("webgl2", options);
			if (!gl) {
				gl = canvas.getContext("webgl", options);
				if (!gl) throw new Error("This browser does not support WebGL. Try using the canvas renderer");
			}
			this.gl = gl;
			this.initFromContext(this.gl);
		}
		/** Auto-populate the {@link GlContextSystem.extensions extensions}. */
		getExtensions() {
			const { gl } = this;
			const common = {
				anisotropicFiltering: gl.getExtension("EXT_texture_filter_anisotropic"),
				floatTextureLinear: gl.getExtension("OES_texture_float_linear"),
				s3tc: gl.getExtension("WEBGL_compressed_texture_s3tc"),
				s3tc_sRGB: gl.getExtension("WEBGL_compressed_texture_s3tc_srgb"),
				etc: gl.getExtension("WEBGL_compressed_texture_etc"),
				etc1: gl.getExtension("WEBGL_compressed_texture_etc1"),
				pvrtc: gl.getExtension("WEBGL_compressed_texture_pvrtc") || gl.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc"),
				atc: gl.getExtension("WEBGL_compressed_texture_atc"),
				astc: gl.getExtension("WEBGL_compressed_texture_astc"),
				bptc: gl.getExtension("EXT_texture_compression_bptc"),
				rgtc: gl.getExtension("EXT_texture_compression_rgtc"),
				loseContext: gl.getExtension("WEBGL_lose_context")
			};
			if (this.webGLVersion === 1) this.extensions = {
				...common,
				drawBuffers: gl.getExtension("WEBGL_draw_buffers"),
				depthTexture: gl.getExtension("WEBGL_depth_texture"),
				vertexArrayObject: gl.getExtension("OES_vertex_array_object") || gl.getExtension("MOZ_OES_vertex_array_object") || gl.getExtension("WEBKIT_OES_vertex_array_object"),
				uint32ElementIndex: gl.getExtension("OES_element_index_uint"),
				floatTexture: gl.getExtension("OES_texture_float"),
				floatTextureLinear: gl.getExtension("OES_texture_float_linear"),
				textureHalfFloat: gl.getExtension("OES_texture_half_float"),
				textureHalfFloatLinear: gl.getExtension("OES_texture_half_float_linear"),
				vertexAttribDivisorANGLE: gl.getExtension("ANGLE_instanced_arrays"),
				srgb: gl.getExtension("EXT_sRGB")
			};
			else {
				this.extensions = {
					...common,
					colorBufferFloat: gl.getExtension("EXT_color_buffer_float")
				};
				const provokeExt = gl.getExtension("WEBGL_provoking_vertex");
				if (provokeExt) provokeExt.provokingVertexWEBGL(provokeExt.FIRST_VERTEX_CONVENTION_WEBGL);
			}
		}
		/**
		* Handles a lost webgl context
		* @param {WebGLContextEvent} event - The context lost event.
		*/
		handleContextLost(event) {
			event.preventDefault();
			if (this._contextLossForced) {
				this._contextLossForced = false;
				setTimeout(() => {
					if (this.gl.isContextLost()) this.extensions.loseContext?.restoreContext();
				}, 0);
			}
		}
		/** Handles a restored webgl context. */
		handleContextRestored() {
			this.getExtensions();
			this._renderer.runners.contextChange.emit(this.gl);
		}
		destroy() {
			const element = this._renderer.view.canvas;
			this._renderer = null;
			element.removeEventListener("webglcontextlost", this.handleContextLost);
			element.removeEventListener("webglcontextrestored", this.handleContextRestored);
			this.gl.useProgram(null);
			this.extensions.loseContext?.loseContext();
		}
		/**
		* this function can be called to force a webGL context loss
		* this will release all resources on the GPU.
		* Useful if you need to put Pixi to sleep, and save some GPU memory
		*
		* As soon as render is called - all resources will be created again.
		*/
		forceContextLoss() {
			this.extensions.loseContext?.loseContext();
			this._contextLossForced = true;
		}
		/**
		* Validate context.
		* @param {WebGLRenderingContext} gl - Render context.
		*/
		validateContext(gl) {
			const attributes = gl.getContextAttributes();
			if (attributes && !attributes.stencil) warn("Provided WebGL context does not have a stencil buffer, masks may not render correctly");
			const supports = this.supports;
			const isWebGl2 = this.webGLVersion === 2;
			const extensions = this.extensions;
			supports.uint32Indices = isWebGl2 || !!extensions.uint32ElementIndex;
			supports.uniformBufferObject = isWebGl2;
			supports.vertexArrayObject = isWebGl2 || !!extensions.vertexArrayObject;
			supports.srgbTextures = isWebGl2 || !!extensions.srgb;
			supports.nonPowOf2wrapping = isWebGl2;
			supports.nonPowOf2mipmaps = isWebGl2;
			supports.msaa = isWebGl2;
			if (!supports.uint32Indices) warn("Provided WebGL context does not support 32 index buffer, large scenes may not render correctly");
		}
	};
	/** @ignore */
	_GlContextSystem.extension = {
		type: [ExtensionType.WebGLSystem],
		name: "context"
	};
	/** The default options for the system. */
	_GlContextSystem.defaultOptions = {
		/**
		* {@link WebGLOptions.context}
		* @default null
		*/
		context: null,
		/**
		* {@link WebGLOptions.premultipliedAlpha}
		* @default true
		*/
		premultipliedAlpha: true,
		/**
		* {@link WebGLOptions.preserveDrawingBuffer}
		* @default false
		*/
		preserveDrawingBuffer: false,
		/**
		* {@link WebGLOptions.powerPreference}
		* @default default
		*/
		powerPreference: void 0,
		/**
		* {@link WebGLOptions.webGLVersion}
		* @default 2
		*/
		preferWebGLVersion: 2,
		/**
		* {@link WebGLOptions.multiView}
		* @default false
		*/
		multiView: false
	};
	GlContextSystem = _GlContextSystem;
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/texture/const.mjs
var GL_FORMATS, GL_TARGETS, GL_TYPES;
var init_const = __esmMin((() => {
	GL_FORMATS = /* @__PURE__ */ ((GL_FORMATS2) => {
		GL_FORMATS2[GL_FORMATS2["RGBA"] = 6408] = "RGBA";
		GL_FORMATS2[GL_FORMATS2["RGB"] = 6407] = "RGB";
		GL_FORMATS2[GL_FORMATS2["RG"] = 33319] = "RG";
		GL_FORMATS2[GL_FORMATS2["RED"] = 6403] = "RED";
		GL_FORMATS2[GL_FORMATS2["RGBA_INTEGER"] = 36249] = "RGBA_INTEGER";
		GL_FORMATS2[GL_FORMATS2["RGB_INTEGER"] = 36248] = "RGB_INTEGER";
		GL_FORMATS2[GL_FORMATS2["RG_INTEGER"] = 33320] = "RG_INTEGER";
		GL_FORMATS2[GL_FORMATS2["RED_INTEGER"] = 36244] = "RED_INTEGER";
		GL_FORMATS2[GL_FORMATS2["ALPHA"] = 6406] = "ALPHA";
		GL_FORMATS2[GL_FORMATS2["LUMINANCE"] = 6409] = "LUMINANCE";
		GL_FORMATS2[GL_FORMATS2["LUMINANCE_ALPHA"] = 6410] = "LUMINANCE_ALPHA";
		GL_FORMATS2[GL_FORMATS2["DEPTH_COMPONENT"] = 6402] = "DEPTH_COMPONENT";
		GL_FORMATS2[GL_FORMATS2["DEPTH_STENCIL"] = 34041] = "DEPTH_STENCIL";
		return GL_FORMATS2;
	})(GL_FORMATS || {});
	GL_TARGETS = /* @__PURE__ */ ((GL_TARGETS2) => {
		GL_TARGETS2[GL_TARGETS2["TEXTURE_2D"] = 3553] = "TEXTURE_2D";
		GL_TARGETS2[GL_TARGETS2["TEXTURE_CUBE_MAP"] = 34067] = "TEXTURE_CUBE_MAP";
		GL_TARGETS2[GL_TARGETS2["TEXTURE_2D_ARRAY"] = 35866] = "TEXTURE_2D_ARRAY";
		GL_TARGETS2[GL_TARGETS2["TEXTURE_CUBE_MAP_POSITIVE_X"] = 34069] = "TEXTURE_CUBE_MAP_POSITIVE_X";
		GL_TARGETS2[GL_TARGETS2["TEXTURE_CUBE_MAP_NEGATIVE_X"] = 34070] = "TEXTURE_CUBE_MAP_NEGATIVE_X";
		GL_TARGETS2[GL_TARGETS2["TEXTURE_CUBE_MAP_POSITIVE_Y"] = 34071] = "TEXTURE_CUBE_MAP_POSITIVE_Y";
		GL_TARGETS2[GL_TARGETS2["TEXTURE_CUBE_MAP_NEGATIVE_Y"] = 34072] = "TEXTURE_CUBE_MAP_NEGATIVE_Y";
		GL_TARGETS2[GL_TARGETS2["TEXTURE_CUBE_MAP_POSITIVE_Z"] = 34073] = "TEXTURE_CUBE_MAP_POSITIVE_Z";
		GL_TARGETS2[GL_TARGETS2["TEXTURE_CUBE_MAP_NEGATIVE_Z"] = 34074] = "TEXTURE_CUBE_MAP_NEGATIVE_Z";
		return GL_TARGETS2;
	})(GL_TARGETS || {});
	GL_TYPES = /* @__PURE__ */ ((GL_TYPES2) => {
		GL_TYPES2[GL_TYPES2["UNSIGNED_BYTE"] = 5121] = "UNSIGNED_BYTE";
		GL_TYPES2[GL_TYPES2["UNSIGNED_SHORT"] = 5123] = "UNSIGNED_SHORT";
		GL_TYPES2[GL_TYPES2["UNSIGNED_SHORT_5_6_5"] = 33635] = "UNSIGNED_SHORT_5_6_5";
		GL_TYPES2[GL_TYPES2["UNSIGNED_SHORT_4_4_4_4"] = 32819] = "UNSIGNED_SHORT_4_4_4_4";
		GL_TYPES2[GL_TYPES2["UNSIGNED_SHORT_5_5_5_1"] = 32820] = "UNSIGNED_SHORT_5_5_5_1";
		GL_TYPES2[GL_TYPES2["UNSIGNED_INT"] = 5125] = "UNSIGNED_INT";
		GL_TYPES2[GL_TYPES2["UNSIGNED_INT_10F_11F_11F_REV"] = 35899] = "UNSIGNED_INT_10F_11F_11F_REV";
		GL_TYPES2[GL_TYPES2["UNSIGNED_INT_2_10_10_10_REV"] = 33640] = "UNSIGNED_INT_2_10_10_10_REV";
		GL_TYPES2[GL_TYPES2["UNSIGNED_INT_24_8"] = 34042] = "UNSIGNED_INT_24_8";
		GL_TYPES2[GL_TYPES2["UNSIGNED_INT_5_9_9_9_REV"] = 35902] = "UNSIGNED_INT_5_9_9_9_REV";
		GL_TYPES2[GL_TYPES2["BYTE"] = 5120] = "BYTE";
		GL_TYPES2[GL_TYPES2["SHORT"] = 5122] = "SHORT";
		GL_TYPES2[GL_TYPES2["INT"] = 5124] = "INT";
		GL_TYPES2[GL_TYPES2["FLOAT"] = 5126] = "FLOAT";
		GL_TYPES2[GL_TYPES2["FLOAT_32_UNSIGNED_INT_24_8_REV"] = 36269] = "FLOAT_32_UNSIGNED_INT_24_8_REV";
		GL_TYPES2[GL_TYPES2["HALF_FLOAT"] = 36193] = "HALF_FLOAT";
		return GL_TYPES2;
	})(GL_TYPES || {});
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/geometry/utils/getGlTypeFromFormat.mjs
function getGlTypeFromFormat(format) {
	return infoMap[format] ?? infoMap.float32;
}
var infoMap;
var init_getGlTypeFromFormat = __esmMin((() => {
	init_const();
	infoMap = {
		uint8x2: GL_TYPES.UNSIGNED_BYTE,
		uint8x4: GL_TYPES.UNSIGNED_BYTE,
		sint8x2: GL_TYPES.BYTE,
		sint8x4: GL_TYPES.BYTE,
		unorm8x2: GL_TYPES.UNSIGNED_BYTE,
		unorm8x4: GL_TYPES.UNSIGNED_BYTE,
		snorm8x2: GL_TYPES.BYTE,
		snorm8x4: GL_TYPES.BYTE,
		uint16x2: GL_TYPES.UNSIGNED_SHORT,
		uint16x4: GL_TYPES.UNSIGNED_SHORT,
		sint16x2: GL_TYPES.SHORT,
		sint16x4: GL_TYPES.SHORT,
		unorm16x2: GL_TYPES.UNSIGNED_SHORT,
		unorm16x4: GL_TYPES.UNSIGNED_SHORT,
		snorm16x2: GL_TYPES.SHORT,
		snorm16x4: GL_TYPES.SHORT,
		float16x2: GL_TYPES.HALF_FLOAT,
		float16x4: GL_TYPES.HALF_FLOAT,
		float32: GL_TYPES.FLOAT,
		float32x2: GL_TYPES.FLOAT,
		float32x3: GL_TYPES.FLOAT,
		float32x4: GL_TYPES.FLOAT,
		uint32: GL_TYPES.UNSIGNED_INT,
		uint32x2: GL_TYPES.UNSIGNED_INT,
		uint32x3: GL_TYPES.UNSIGNED_INT,
		uint32x4: GL_TYPES.UNSIGNED_INT,
		sint32: GL_TYPES.INT,
		sint32x2: GL_TYPES.INT,
		sint32x3: GL_TYPES.INT,
		sint32x4: GL_TYPES.INT
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/geometry/GlGeometrySystem.mjs
var topologyToGlMap, GlGeometryGpuData, GlGeometrySystem;
var init_GlGeometrySystem = __esmMin((() => {
	init_Extensions();
	init_GCManagedHash();
	init_getAttributeInfoFromFormat();
	init_ensureAttributes();
	init_getGlTypeFromFormat();
	topologyToGlMap = {
		"point-list": 0,
		"line-list": 1,
		"line-strip": 3,
		"triangle-list": 4,
		"triangle-strip": 5
	};
	GlGeometryGpuData = class {
		constructor() {
			this.vaoCache = /* @__PURE__ */ Object.create(null);
		}
		destroy() {
			this.vaoCache = /* @__PURE__ */ Object.create(null);
		}
	};
	GlGeometrySystem = class {
		/** @param renderer - The renderer this System works for. */
		constructor(renderer) {
			this._renderer = renderer;
			this._activeGeometry = null;
			this._activeVao = null;
			this.hasVao = true;
			this.hasInstance = true;
			this._managedGeometries = new GCManagedHash({
				renderer,
				type: "resource",
				onUnload: this.onGeometryUnload.bind(this),
				name: "glGeometry"
			});
		}
		/** Sets up the renderer context and necessary buffers. */
		contextChange() {
			const gl = this.gl = this._renderer.gl;
			if (!this._renderer.context.supports.vertexArrayObject) throw new Error("[PixiJS] Vertex Array Objects are not supported on this device");
			this.destroyAll(true);
			const nativeVaoExtension = this._renderer.context.extensions.vertexArrayObject;
			if (nativeVaoExtension) {
				gl.createVertexArray = () => nativeVaoExtension.createVertexArrayOES();
				gl.bindVertexArray = (vao) => nativeVaoExtension.bindVertexArrayOES(vao);
				gl.deleteVertexArray = (vao) => nativeVaoExtension.deleteVertexArrayOES(vao);
			}
			const nativeInstancedExtension = this._renderer.context.extensions.vertexAttribDivisorANGLE;
			if (nativeInstancedExtension) {
				gl.drawArraysInstanced = (a, b, c, d) => {
					nativeInstancedExtension.drawArraysInstancedANGLE(a, b, c, d);
				};
				gl.drawElementsInstanced = (a, b, c, d, e) => {
					nativeInstancedExtension.drawElementsInstancedANGLE(a, b, c, d, e);
				};
				gl.vertexAttribDivisor = (a, b) => nativeInstancedExtension.vertexAttribDivisorANGLE(a, b);
			}
			this._activeGeometry = null;
			this._activeVao = null;
		}
		/**
		* Binds geometry so that is can be drawn. Creating a Vao if required
		* @param geometry - Instance of geometry to bind.
		* @param program - Instance of program to use vao for.
		*/
		bind(geometry, program) {
			const gl = this.gl;
			this._activeGeometry = geometry;
			const vao = this.getVao(geometry, program);
			if (this._activeVao !== vao) {
				this._activeVao = vao;
				gl.bindVertexArray(vao);
			}
			this.updateBuffers();
		}
		/** Reset and unbind any active VAO and geometry. */
		resetState() {
			this.unbind();
		}
		/** Update buffers of the currently bound geometry. */
		updateBuffers() {
			const geometry = this._activeGeometry;
			const bufferSystem = this._renderer.buffer;
			for (let i = 0; i < geometry.buffers.length; i++) {
				const buffer = geometry.buffers[i];
				bufferSystem.updateBuffer(buffer);
			}
			geometry._gcLastUsed = this._renderer.gc.now;
		}
		/**
		* Check compatibility between a geometry and a program
		* @param geometry - Geometry instance.
		* @param program - Program instance.
		*/
		checkCompatibility(geometry, program) {
			const geometryAttributes = geometry.attributes;
			const shaderAttributes = program._attributeData;
			for (const j in shaderAttributes) if (!geometryAttributes[j]) throw new Error(`shader and geometry incompatible, geometry missing the "${j}" attribute`);
		}
		/**
		* Takes a geometry and program and generates a unique signature for them.
		* @param geometry - To get signature from.
		* @param program - To test geometry against.
		* @returns - Unique signature of the geometry and program
		*/
		getSignature(geometry, program) {
			const attribs = geometry.attributes;
			const shaderAttributes = program._attributeData;
			const strings = ["g", geometry.uid];
			for (const i in attribs) if (shaderAttributes[i]) strings.push(i, shaderAttributes[i].location);
			return strings.join("-");
		}
		getVao(geometry, program) {
			return geometry._gpuData[this._renderer.uid]?.vaoCache[program._key] || this.initGeometryVao(geometry, program);
		}
		/**
		* Creates or gets Vao with the same structure as the geometry and stores it on the geometry.
		* If vao is created, it is bound automatically. We use a shader to infer what and how to set up the
		* attribute locations.
		* @param geometry - Instance of geometry to to generate Vao for.
		* @param program
		* @param _incRefCount - Increment refCount of all geometry buffers.
		*/
		initGeometryVao(geometry, program, _incRefCount = true) {
			const gl = this._renderer.gl;
			const bufferSystem = this._renderer.buffer;
			this._renderer.shader._getProgramData(program);
			this.checkCompatibility(geometry, program);
			const signature = this.getSignature(geometry, program);
			let gpuData = geometry._gpuData[this._renderer.uid];
			if (!gpuData) {
				gpuData = new GlGeometryGpuData();
				geometry._gpuData[this._renderer.uid] = gpuData;
				this._managedGeometries.add(geometry);
			}
			const vaoObjectHash = gpuData.vaoCache;
			let vao = vaoObjectHash[signature];
			if (vao) {
				vaoObjectHash[program._key] = vao;
				return vao;
			}
			ensureAttributes(geometry, program._attributeData);
			const buffers = geometry.buffers;
			vao = gl.createVertexArray();
			gl.bindVertexArray(vao);
			for (let i = 0; i < buffers.length; i++) {
				const buffer = buffers[i];
				bufferSystem.bind(buffer);
			}
			this.activateVao(geometry, program);
			vaoObjectHash[program._key] = vao;
			vaoObjectHash[signature] = vao;
			gl.bindVertexArray(null);
			return vao;
		}
		onGeometryUnload(geometry, contextLost = false) {
			const gpuData = geometry._gpuData[this._renderer.uid];
			if (!gpuData) return;
			const vaoCache = gpuData.vaoCache;
			if (!contextLost) for (const i in vaoCache) {
				if (this._activeVao !== vaoCache[i]) this.resetState();
				this.gl.deleteVertexArray(vaoCache[i]);
			}
		}
		/**
		* Dispose all WebGL resources of all managed geometries.
		* @param [contextLost=false] - If context was lost, we suppress `gl.delete` calls
		*/
		destroyAll(contextLost = false) {
			this._managedGeometries.removeAll(contextLost);
		}
		/**
		* Activate vertex array object.
		* @param geometry - Geometry instance.
		* @param program - Shader program instance.
		*/
		activateVao(geometry, program) {
			const gl = this._renderer.gl;
			const bufferSystem = this._renderer.buffer;
			const attributes = geometry.attributes;
			if (geometry.indexBuffer) bufferSystem.bind(geometry.indexBuffer);
			let lastBuffer = null;
			for (const j in attributes) {
				const attribute = attributes[j];
				const buffer = attribute.buffer;
				const glBuffer = bufferSystem.getGlBuffer(buffer);
				const programAttrib = program._attributeData[j];
				if (programAttrib) {
					if (lastBuffer !== glBuffer) {
						bufferSystem.bind(buffer);
						lastBuffer = glBuffer;
					}
					const location = programAttrib.location;
					gl.enableVertexAttribArray(location);
					const attributeInfo = getAttributeInfoFromFormat(attribute.format);
					const type = getGlTypeFromFormat(attribute.format);
					if (programAttrib.format?.substring(1, 4) === "int") gl.vertexAttribIPointer(location, attributeInfo.size, type, attribute.stride, attribute.offset);
					else gl.vertexAttribPointer(location, attributeInfo.size, type, attributeInfo.normalised, attribute.stride, attribute.offset);
					if (attribute.instance) if (this.hasInstance) {
						const divisor = attribute.divisor ?? 1;
						gl.vertexAttribDivisor(location, divisor);
					} else throw new Error("geometry error, GPU Instancing is not supported on this device");
				}
			}
		}
		/**
		* Draws the currently bound geometry.
		* @param topology - The type primitive to render.
		* @param size - The number of elements to be rendered. If not specified, all vertices after the
		*  starting vertex will be drawn.
		* @param start - The starting vertex in the geometry to start drawing from. If not specified,
		*  drawing will start from the first vertex.
		* @param instanceCount - The number of instances of the set of elements to execute. If not specified,
		*  all instances will be drawn.
		* @returns This instance of the geometry system.
		*/
		draw(topology, size, start, instanceCount) {
			const { gl } = this._renderer;
			const geometry = this._activeGeometry;
			const glTopology = topologyToGlMap[topology || geometry.topology];
			instanceCount ?? (instanceCount = geometry.instanceCount);
			if (geometry.indexBuffer) {
				const byteSize = geometry.indexBuffer.data.BYTES_PER_ELEMENT;
				const glType = byteSize === 2 ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT;
				if (instanceCount !== 1) gl.drawElementsInstanced(glTopology, size || geometry.indexBuffer.data.length, glType, (start || 0) * byteSize, instanceCount);
				else gl.drawElements(glTopology, size || geometry.indexBuffer.data.length, glType, (start || 0) * byteSize);
			} else if (instanceCount !== 1) gl.drawArraysInstanced(glTopology, start || 0, size || geometry.getSize(), instanceCount);
			else gl.drawArrays(glTopology, start || 0, size || geometry.getSize());
			return this;
		}
		/** Unbind/reset everything. */
		unbind() {
			this.gl.bindVertexArray(null);
			this._activeVao = null;
			this._activeGeometry = null;
		}
		destroy() {
			this._managedGeometries.destroy();
			this._renderer = null;
			this.gl = null;
			this._activeVao = null;
			this._activeGeometry = null;
		}
	};
	/** @ignore */
	GlGeometrySystem.extension = {
		type: [ExtensionType.WebGLSystem],
		name: "geometry"
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/GlBackBufferSystem.mjs
var bigTriangleGeometry, _GlBackBufferSystem, GlBackBufferSystem;
var init_GlBackBufferSystem = __esmMin((() => {
	init_Extensions();
	init_warn();
	init_Geometry();
	init_Shader();
	init_State();
	init_TextureSource();
	init_Texture();
	init_GlProgram();
	bigTriangleGeometry = new Geometry({ attributes: { aPosition: [
		-1,
		-1,
		3,
		-1,
		-1,
		3
	] } });
	_GlBackBufferSystem = class _GlBackBufferSystem {
		constructor(renderer) {
			/** if true, the back buffer is used */
			this.useBackBuffer = false;
			this._useBackBufferThisRender = false;
			this._renderer = renderer;
		}
		init(options = {}) {
			const { useBackBuffer, antialias } = {
				..._GlBackBufferSystem.defaultOptions,
				...options
			};
			this.useBackBuffer = useBackBuffer;
			this._antialias = antialias;
			if (!this._renderer.context.supports.msaa) {
				warn("antialiasing, is not supported on when using the back buffer");
				this._antialias = false;
			}
			this._state = State.for2d();
			const bigTriangleProgram = new GlProgram({
				vertex: `
                attribute vec2 aPosition;
                out vec2 vUv;

                void main() {
                    gl_Position = vec4(aPosition, 0.0, 1.0);

                    vUv = (aPosition + 1.0) / 2.0;

                    // flip dem UVs
                    vUv.y = 1.0 - vUv.y;
                }`,
				fragment: `
                in vec2 vUv;
                out vec4 finalColor;

                uniform sampler2D uTexture;

                void main() {
                    finalColor = texture(uTexture, vUv);
                }`,
				name: "big-triangle"
			});
			this._bigTriangleShader = new Shader({
				glProgram: bigTriangleProgram,
				resources: { uTexture: Texture.WHITE.source }
			});
		}
		/**
		* This is called before the RenderTargetSystem is started. This is where
		* we replace the target with the back buffer if required.
		* @param options - The options for this render.
		*/
		renderStart(options) {
			const renderTarget = this._renderer.renderTarget.getRenderTarget(options.target);
			this._useBackBufferThisRender = this.useBackBuffer && !!renderTarget.isRoot;
			if (this._useBackBufferThisRender) {
				const renderTarget2 = this._renderer.renderTarget.getRenderTarget(options.target);
				this._targetTexture = renderTarget2.colorTexture;
				options.target = this._getBackBufferTexture(renderTarget2.colorTexture);
			}
		}
		renderEnd() {
			this._presentBackBuffer();
		}
		_presentBackBuffer() {
			const renderer = this._renderer;
			renderer.renderTarget.finishRenderPass();
			if (!this._useBackBufferThisRender) return;
			renderer.renderTarget.bind(this._targetTexture, false);
			this._bigTriangleShader.resources.uTexture = this._backBufferTexture.source;
			renderer.encoder.draw({
				geometry: bigTriangleGeometry,
				shader: this._bigTriangleShader,
				state: this._state
			});
		}
		_getBackBufferTexture(targetSourceTexture) {
			this._backBufferTexture = this._backBufferTexture || new Texture({ source: new TextureSource({
				width: targetSourceTexture.width,
				height: targetSourceTexture.height,
				resolution: targetSourceTexture._resolution,
				antialias: this._antialias
			}) });
			this._backBufferTexture.source.resize(targetSourceTexture.width, targetSourceTexture.height, targetSourceTexture._resolution);
			return this._backBufferTexture;
		}
		/** destroys the back buffer */
		destroy() {
			if (this._backBufferTexture) {
				this._backBufferTexture.destroy();
				this._backBufferTexture = null;
			}
		}
	};
	/** @ignore */
	_GlBackBufferSystem.extension = {
		type: [ExtensionType.WebGLSystem],
		name: "backBuffer",
		priority: 1
	};
	/** default options for the back buffer system */
	_GlBackBufferSystem.defaultOptions = { 
	/** if true will use the back buffer where required */
useBackBuffer: false };
	GlBackBufferSystem = _GlBackBufferSystem;
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/GlColorMaskSystem.mjs
var GlColorMaskSystem;
var init_GlColorMaskSystem = __esmMin((() => {
	init_Extensions();
	GlColorMaskSystem = class {
		constructor(renderer) {
			this._colorMaskCache = 15;
			this._renderer = renderer;
		}
		setMask(colorMask) {
			if (this._colorMaskCache === colorMask) return;
			this._colorMaskCache = colorMask;
			this._renderer.gl.colorMask(!!(colorMask & 8), !!(colorMask & 4), !!(colorMask & 2), !!(colorMask & 1));
		}
	};
	/** @ignore */
	GlColorMaskSystem.extension = {
		type: [ExtensionType.WebGLSystem],
		name: "colorMask"
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/GlEncoderSystem.mjs
var GlEncoderSystem;
var init_GlEncoderSystem = __esmMin((() => {
	init_Extensions();
	GlEncoderSystem = class {
		constructor(renderer) {
			this.commandFinished = Promise.resolve();
			this._renderer = renderer;
		}
		setGeometry(geometry, shader) {
			this._renderer.geometry.bind(geometry, shader.glProgram);
		}
		finishRenderPass() {}
		draw(options) {
			const renderer = this._renderer;
			const { geometry, shader, state, skipSync, topology: type, size, start, instanceCount } = options;
			renderer.shader.bind(shader, skipSync);
			renderer.geometry.bind(geometry, renderer.shader._activeProgram);
			if (state) renderer.state.set(state);
			renderer.geometry.draw(type, size, start, instanceCount ?? geometry.instanceCount);
		}
		destroy() {
			this._renderer = null;
		}
	};
	/** @ignore */
	GlEncoderSystem.extension = {
		type: [ExtensionType.WebGLSystem],
		name: "encoder"
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/GlLimitsSystem.mjs
var GlLimitsSystem;
var init_GlLimitsSystem = __esmMin((() => {
	init_Extensions();
	init_checkMaxIfStatementsInShader();
	GlLimitsSystem = class {
		constructor(renderer) {
			this._renderer = renderer;
		}
		contextChange() {
			const gl = this._renderer.gl;
			this.maxTextures = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
			this.maxBatchableTextures = checkMaxIfStatementsInShader(this.maxTextures, gl);
			const isWebGl2 = this._renderer.context.webGLVersion === 2;
			this.maxUniformBindings = isWebGl2 ? gl.getParameter(gl.MAX_UNIFORM_BUFFER_BINDINGS) : 0;
		}
		destroy() {}
	};
	/** @ignore */
	GlLimitsSystem.extension = {
		type: [ExtensionType.WebGLSystem],
		name: "limits"
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/GlRenderTarget.mjs
var GlRenderTarget;
var init_GlRenderTarget = __esmMin((() => {
	GlRenderTarget = class {
		constructor() {
			this.width = -1;
			this.height = -1;
			this.msaa = false;
			/**
			* Tracks which mip level is currently attached to this render target's framebuffer.
			* This lets us skip redundant framebufferTexture2D calls on the common path.
			* @internal
			*/
			this._attachedMipLevel = 0;
			/**
			* Tracks which array layer (or cube face index) is currently attached to this render target's framebuffer.
			* For non-array 2D textures this will always be 0.
			* @internal
			*/
			this._attachedLayer = 0;
			this.msaaRenderBuffer = [];
		}
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/GlStencilSystem.mjs
var GlStencilSystem;
var init_GlStencilSystem = __esmMin((() => {
	init_Extensions();
	init_GpuStencilModesToPixi();
	init_const$4();
	GlStencilSystem = class {
		constructor(renderer) {
			this._stencilCache = {
				enabled: false,
				stencilReference: 0,
				stencilMode: STENCIL_MODES.NONE
			};
			this._renderTargetStencilState = /* @__PURE__ */ Object.create(null);
			renderer.renderTarget.onRenderTargetChange.add(this);
		}
		contextChange(gl) {
			this._gl = gl;
			this._comparisonFuncMapping = {
				always: gl.ALWAYS,
				never: gl.NEVER,
				equal: gl.EQUAL,
				"not-equal": gl.NOTEQUAL,
				less: gl.LESS,
				"less-equal": gl.LEQUAL,
				greater: gl.GREATER,
				"greater-equal": gl.GEQUAL
			};
			this._stencilOpsMapping = {
				keep: gl.KEEP,
				zero: gl.ZERO,
				replace: gl.REPLACE,
				invert: gl.INVERT,
				"increment-clamp": gl.INCR,
				"decrement-clamp": gl.DECR,
				"increment-wrap": gl.INCR_WRAP,
				"decrement-wrap": gl.DECR_WRAP
			};
			this.resetState();
		}
		onRenderTargetChange(renderTarget) {
			if (this._activeRenderTarget === renderTarget) return;
			this._activeRenderTarget = renderTarget;
			let stencilState = this._renderTargetStencilState[renderTarget.uid];
			if (!stencilState) stencilState = this._renderTargetStencilState[renderTarget.uid] = {
				stencilMode: STENCIL_MODES.DISABLED,
				stencilReference: 0
			};
			this.setStencilMode(stencilState.stencilMode, stencilState.stencilReference);
		}
		resetState() {
			this._stencilCache.enabled = false;
			this._stencilCache.stencilMode = STENCIL_MODES.NONE;
			this._stencilCache.stencilReference = 0;
		}
		setStencilMode(stencilMode, stencilReference) {
			const stencilState = this._renderTargetStencilState[this._activeRenderTarget.uid];
			const gl = this._gl;
			const mode = GpuStencilModesToPixi[stencilMode];
			const _stencilCache = this._stencilCache;
			stencilState.stencilMode = stencilMode;
			stencilState.stencilReference = stencilReference;
			if (stencilMode === STENCIL_MODES.DISABLED) {
				if (this._stencilCache.enabled) {
					this._stencilCache.enabled = false;
					gl.disable(gl.STENCIL_TEST);
				}
				return;
			}
			if (!this._stencilCache.enabled) {
				this._stencilCache.enabled = true;
				gl.enable(gl.STENCIL_TEST);
			}
			if (stencilMode !== _stencilCache.stencilMode || _stencilCache.stencilReference !== stencilReference) {
				_stencilCache.stencilMode = stencilMode;
				_stencilCache.stencilReference = stencilReference;
				gl.stencilFunc(this._comparisonFuncMapping[mode.stencilBack.compare], stencilReference, 255);
				gl.stencilOp(gl.KEEP, gl.KEEP, this._stencilOpsMapping[mode.stencilBack.passOp]);
			}
		}
	};
	/** @ignore */
	GlStencilSystem.extension = {
		type: [ExtensionType.WebGLSystem],
		name: "stencil"
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/shader/utils/createUboElementsSTD40.mjs
function createUboElementsSTD40(uniformData) {
	const uboElements = uniformData.map((data) => ({
		data,
		offset: 0,
		size: 0
	}));
	const chunkSize = 16;
	let size = 0;
	let offset = 0;
	for (let i = 0; i < uboElements.length; i++) {
		const uboElement = uboElements[i];
		size = WGSL_TO_STD40_SIZE[uboElement.data.type];
		if (!size) throw new Error(`Unknown type ${uboElement.data.type}`);
		if (uboElement.data.size > 1) size = Math.max(size, chunkSize) * uboElement.data.size;
		const boundary = size === 12 ? 16 : size;
		uboElement.size = size;
		const curOffset = offset % chunkSize;
		if (curOffset > 0 && chunkSize - curOffset < boundary) offset += (chunkSize - curOffset) % 16;
		else offset += (size - curOffset % size) % size;
		uboElement.offset = offset;
		offset += size;
	}
	offset = Math.ceil(offset / 16) * 16;
	return {
		uboElements,
		size: offset
	};
}
var WGSL_TO_STD40_SIZE;
var init_createUboElementsSTD40 = __esmMin((() => {
	WGSL_TO_STD40_SIZE = {
		f32: 4,
		i32: 4,
		"vec2<f32>": 8,
		"vec3<f32>": 12,
		"vec4<f32>": 16,
		"vec2<i32>": 8,
		"vec3<i32>": 12,
		"vec4<i32>": 16,
		"mat2x2<f32>": 32,
		"mat3x3<f32>": 48,
		"mat4x4<f32>": 64
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/shader/utils/generateArraySyncSTD40.mjs
function generateArraySyncSTD40(uboElement, offsetToAdd) {
	const rowSize = Math.max(WGSL_TO_STD40_SIZE[uboElement.data.type] / 16, 1);
	const elementSize = uboElement.data.value.length / uboElement.data.size;
	const remainder = (4 - elementSize % 4) % 4;
	const data = uboElement.data.type.indexOf("i32") >= 0 ? "dataInt32" : "data";
	return `
        v = uv.${uboElement.data.name};
        offset += ${offsetToAdd};

        arrayOffset = offset;

        t = 0;

        for(var i=0; i < ${uboElement.data.size * rowSize}; i++)
        {
            for(var j = 0; j < ${elementSize}; j++)
            {
                ${data}[arrayOffset++] = v[t++];
            }
            ${remainder !== 0 ? `arrayOffset += ${remainder};` : ""}
        }
    `;
}
var init_generateArraySyncSTD40 = __esmMin((() => {
	init_createUboElementsSTD40();
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/shader/utils/createUboSyncSTD40.mjs
function createUboSyncFunctionSTD40(uboElements) {
	return createUboSyncFunction(uboElements, "uboStd40", generateArraySyncSTD40, uboSyncFunctionsSTD40);
}
var init_createUboSyncSTD40 = __esmMin((() => {
	init_createUboSyncFunction();
	init_uboSyncFunctions();
	init_generateArraySyncSTD40();
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/GlUboSystem.mjs
var GlUboSystem;
var init_GlUboSystem = __esmMin((() => {
	init_Extensions();
	init_UboSystem();
	init_createUboElementsSTD40();
	init_createUboSyncSTD40();
	GlUboSystem = class extends UboSystem {
		constructor() {
			super({
				createUboElements: createUboElementsSTD40,
				generateUboSync: createUboSyncFunctionSTD40
			});
		}
	};
	/** @ignore */
	GlUboSystem.extension = {
		type: [ExtensionType.WebGLSystem],
		name: "ubo"
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/renderTarget/GlRenderTargetAdaptor.mjs
var GlRenderTargetAdaptor;
var init_GlRenderTargetAdaptor = __esmMin((() => {
	init_Rectangle();
	init_warn();
	init_CanvasSource();
	init_const$5();
	init_GlRenderTarget();
	GlRenderTargetAdaptor = class {
		constructor() {
			this._clearColorCache = [
				0,
				0,
				0,
				0
			];
			this._viewPortCache = new Rectangle();
		}
		init(renderer, renderTargetSystem) {
			this._renderer = renderer;
			this._renderTargetSystem = renderTargetSystem;
			renderer.runners.contextChange.add(this);
		}
		contextChange() {
			this._clearColorCache = [
				0,
				0,
				0,
				0
			];
			this._viewPortCache = new Rectangle();
			const gl = this._renderer.gl;
			this._drawBuffersCache = [];
			for (let i = 1; i <= 16; i++) this._drawBuffersCache[i] = Array.from({ length: i }, (_, j) => gl.COLOR_ATTACHMENT0 + j);
		}
		copyToTexture(sourceRenderSurfaceTexture, destinationTexture, originSrc, size, originDest) {
			const renderTargetSystem = this._renderTargetSystem;
			const renderer = this._renderer;
			const glRenderTarget = renderTargetSystem.getGpuRenderTarget(sourceRenderSurfaceTexture);
			const gl = renderer.gl;
			this.finishRenderPass(sourceRenderSurfaceTexture);
			gl.bindFramebuffer(gl.FRAMEBUFFER, glRenderTarget.resolveTargetFramebuffer);
			renderer.texture.bind(destinationTexture, 0);
			gl.copyTexSubImage2D(gl.TEXTURE_2D, 0, originDest.x, originDest.y, originSrc.x, originSrc.y, size.width, size.height);
			return destinationTexture;
		}
		startRenderPass(renderTarget, clear = true, clearColor, viewport, mipLevel = 0, layer = 0) {
			const renderTargetSystem = this._renderTargetSystem;
			const source = renderTarget.colorTexture;
			const gpuRenderTarget = renderTargetSystem.getGpuRenderTarget(renderTarget);
			if (layer !== 0 && this._renderer.context.webGLVersion < 2) throw new Error("[RenderTargetSystem] Rendering to array layers requires WebGL2.");
			if (mipLevel > 0) {
				if (gpuRenderTarget.msaa) throw new Error("[RenderTargetSystem] Rendering to mip levels is not supported with MSAA render targets.");
				if (this._renderer.context.webGLVersion < 2) throw new Error("[RenderTargetSystem] Rendering to mip levels requires WebGL2.");
			}
			let viewPortY = viewport.y;
			if (renderTarget.isRoot) viewPortY = source.pixelHeight - viewport.height - viewport.y;
			renderTarget.colorTextures.forEach((texture) => {
				this._renderer.texture.unbind(texture);
			});
			const gl = this._renderer.gl;
			gl.bindFramebuffer(gl.FRAMEBUFFER, gpuRenderTarget.framebuffer);
			if (!renderTarget.isRoot && (gpuRenderTarget._attachedMipLevel !== mipLevel || gpuRenderTarget._attachedLayer !== layer)) {
				renderTarget.colorTextures.forEach((colorTexture, i) => {
					const glSource = this._renderer.texture.getGlSource(colorTexture);
					if (glSource.target === gl.TEXTURE_2D) {
						if (layer !== 0) throw new Error("[RenderTargetSystem] layer must be 0 when rendering to 2D textures in WebGL.");
						gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, glSource.texture, mipLevel);
					} else if (glSource.target === gl.TEXTURE_2D_ARRAY) {
						if (this._renderer.context.webGLVersion < 2) throw new Error("[RenderTargetSystem] Rendering to 2D array textures requires WebGL2.");
						gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, glSource.texture, mipLevel, layer);
					} else if (glSource.target === gl.TEXTURE_CUBE_MAP) {
						if (layer < 0 || layer > 5) throw new Error("[RenderTargetSystem] Cube map layer must be between 0 and 5.");
						gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_CUBE_MAP_POSITIVE_X + layer, glSource.texture, mipLevel);
					} else throw new Error("[RenderTargetSystem] Unsupported texture target for render-to-layer in WebGL.");
				});
				gpuRenderTarget._attachedMipLevel = mipLevel;
				gpuRenderTarget._attachedLayer = layer;
			}
			if (renderTarget.colorTextures.length > 1) this._setDrawBuffers(renderTarget, gl);
			const viewPortCache = this._viewPortCache;
			if (viewPortCache.x !== viewport.x || viewPortCache.y !== viewPortY || viewPortCache.width !== viewport.width || viewPortCache.height !== viewport.height) {
				viewPortCache.x = viewport.x;
				viewPortCache.y = viewPortY;
				viewPortCache.width = viewport.width;
				viewPortCache.height = viewport.height;
				gl.viewport(viewport.x, viewPortY, viewport.width, viewport.height);
			}
			if (!gpuRenderTarget.depthStencilRenderBuffer && (renderTarget.stencil || renderTarget.depth)) this._initStencil(gpuRenderTarget);
			this.clear(renderTarget, clear, clearColor);
		}
		finishRenderPass(renderTarget) {
			const glRenderTarget = this._renderTargetSystem.getGpuRenderTarget(renderTarget);
			if (!glRenderTarget.msaa) return;
			const gl = this._renderer.gl;
			gl.bindFramebuffer(gl.FRAMEBUFFER, glRenderTarget.resolveTargetFramebuffer);
			gl.bindFramebuffer(gl.READ_FRAMEBUFFER, glRenderTarget.framebuffer);
			gl.blitFramebuffer(0, 0, glRenderTarget.width, glRenderTarget.height, 0, 0, glRenderTarget.width, glRenderTarget.height, gl.COLOR_BUFFER_BIT, gl.NEAREST);
			gl.bindFramebuffer(gl.FRAMEBUFFER, glRenderTarget.framebuffer);
		}
		initGpuRenderTarget(renderTarget) {
			const gl = this._renderer.gl;
			const glRenderTarget = new GlRenderTarget();
			glRenderTarget._attachedMipLevel = 0;
			glRenderTarget._attachedLayer = 0;
			if (renderTarget.colorTexture instanceof CanvasSource) {
				this._renderer.context.ensureCanvasSize(renderTarget.colorTexture.resource);
				glRenderTarget.framebuffer = null;
				return glRenderTarget;
			}
			this._initColor(renderTarget, glRenderTarget);
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			return glRenderTarget;
		}
		destroyGpuRenderTarget(gpuRenderTarget) {
			const gl = this._renderer.gl;
			if (gpuRenderTarget.framebuffer) {
				gl.deleteFramebuffer(gpuRenderTarget.framebuffer);
				gpuRenderTarget.framebuffer = null;
			}
			if (gpuRenderTarget.resolveTargetFramebuffer) {
				gl.deleteFramebuffer(gpuRenderTarget.resolveTargetFramebuffer);
				gpuRenderTarget.resolveTargetFramebuffer = null;
			}
			if (gpuRenderTarget.depthStencilRenderBuffer) {
				gl.deleteRenderbuffer(gpuRenderTarget.depthStencilRenderBuffer);
				gpuRenderTarget.depthStencilRenderBuffer = null;
			}
			gpuRenderTarget.msaaRenderBuffer.forEach((renderBuffer) => {
				gl.deleteRenderbuffer(renderBuffer);
			});
			gpuRenderTarget.msaaRenderBuffer = null;
		}
		clear(_renderTarget, clear, clearColor, _viewport, _mipLevel = 0, layer = 0) {
			if (!clear) return;
			if (layer !== 0) throw new Error("[RenderTargetSystem] Clearing array layers is not supported in WebGL renderer.");
			const renderTargetSystem = this._renderTargetSystem;
			if (typeof clear === "boolean") clear = clear ? CLEAR.ALL : CLEAR.NONE;
			const gl = this._renderer.gl;
			if (clear & CLEAR.COLOR) {
				clearColor ?? (clearColor = renderTargetSystem.defaultClearColor);
				const clearColorCache = this._clearColorCache;
				const clearColorArray = clearColor;
				if (clearColorCache[0] !== clearColorArray[0] || clearColorCache[1] !== clearColorArray[1] || clearColorCache[2] !== clearColorArray[2] || clearColorCache[3] !== clearColorArray[3]) {
					clearColorCache[0] = clearColorArray[0];
					clearColorCache[1] = clearColorArray[1];
					clearColorCache[2] = clearColorArray[2];
					clearColorCache[3] = clearColorArray[3];
					gl.clearColor(clearColorArray[0], clearColorArray[1], clearColorArray[2], clearColorArray[3]);
				}
			}
			gl.clear(clear);
		}
		resizeGpuRenderTarget(renderTarget) {
			if (renderTarget.isRoot) return;
			const glRenderTarget = this._renderTargetSystem.getGpuRenderTarget(renderTarget);
			this._resizeColor(renderTarget, glRenderTarget);
			if (renderTarget.stencil || renderTarget.depth) this._resizeStencil(glRenderTarget);
		}
		_initColor(renderTarget, glRenderTarget) {
			const renderer = this._renderer;
			const gl = renderer.gl;
			const resolveTargetFramebuffer = gl.createFramebuffer();
			glRenderTarget.resolveTargetFramebuffer = resolveTargetFramebuffer;
			gl.bindFramebuffer(gl.FRAMEBUFFER, resolveTargetFramebuffer);
			glRenderTarget.width = renderTarget.colorTexture.source.pixelWidth;
			glRenderTarget.height = renderTarget.colorTexture.source.pixelHeight;
			renderTarget.colorTextures.forEach((colorTexture, i) => {
				const source = colorTexture.source;
				if (source.antialias) if (renderer.context.supports.msaa) glRenderTarget.msaa = true;
				else warn("[RenderTexture] Antialiasing on textures is not supported in WebGL1");
				renderer.texture.bindSource(source, 0);
				const glSource = renderer.texture.getGlSource(source);
				const glTexture = glSource.texture;
				if (glSource.target === gl.TEXTURE_2D) gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, glTexture, 0);
				else if (glSource.target === gl.TEXTURE_2D_ARRAY) {
					if (renderer.context.webGLVersion < 2) throw new Error("[RenderTargetSystem] TEXTURE_2D_ARRAY requires WebGL2.");
					gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, glTexture, 0, 0);
				} else if (glSource.target === gl.TEXTURE_CUBE_MAP) gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_CUBE_MAP_POSITIVE_X, glTexture, 0);
				else throw new Error("[RenderTargetSystem] Unsupported texture target for framebuffer attachment.");
			});
			if (glRenderTarget.msaa) {
				const viewFramebuffer = gl.createFramebuffer();
				glRenderTarget.framebuffer = viewFramebuffer;
				gl.bindFramebuffer(gl.FRAMEBUFFER, viewFramebuffer);
				renderTarget.colorTextures.forEach((_, i) => {
					const msaaRenderBuffer = gl.createRenderbuffer();
					glRenderTarget.msaaRenderBuffer[i] = msaaRenderBuffer;
				});
			} else glRenderTarget.framebuffer = resolveTargetFramebuffer;
			this._resizeColor(renderTarget, glRenderTarget);
		}
		_resizeColor(renderTarget, glRenderTarget) {
			const source = renderTarget.colorTexture.source;
			glRenderTarget.width = source.pixelWidth;
			glRenderTarget.height = source.pixelHeight;
			glRenderTarget._attachedMipLevel = 0;
			glRenderTarget._attachedLayer = 0;
			renderTarget.colorTextures.forEach((colorTexture, i) => {
				if (i === 0) return;
				colorTexture.source.resize(source.width, source.height, source._resolution);
			});
			if (glRenderTarget.msaa) {
				const renderer = this._renderer;
				const gl = renderer.gl;
				const viewFramebuffer = glRenderTarget.framebuffer;
				gl.bindFramebuffer(gl.FRAMEBUFFER, viewFramebuffer);
				renderTarget.colorTextures.forEach((colorTexture, i) => {
					const source2 = colorTexture.source;
					renderer.texture.bindSource(source2, 0);
					const glInternalFormat = renderer.texture.getGlSource(source2).internalFormat;
					const msaaRenderBuffer = glRenderTarget.msaaRenderBuffer[i];
					gl.bindRenderbuffer(gl.RENDERBUFFER, msaaRenderBuffer);
					gl.renderbufferStorageMultisample(gl.RENDERBUFFER, 4, glInternalFormat, source2.pixelWidth, source2.pixelHeight);
					gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.RENDERBUFFER, msaaRenderBuffer);
				});
			}
		}
		_initStencil(glRenderTarget) {
			if (glRenderTarget.framebuffer === null) return;
			const gl = this._renderer.gl;
			const depthStencilRenderBuffer = gl.createRenderbuffer();
			glRenderTarget.depthStencilRenderBuffer = depthStencilRenderBuffer;
			gl.bindRenderbuffer(gl.RENDERBUFFER, depthStencilRenderBuffer);
			gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, depthStencilRenderBuffer);
			this._resizeStencil(glRenderTarget);
		}
		_resizeStencil(glRenderTarget) {
			const gl = this._renderer.gl;
			gl.bindRenderbuffer(gl.RENDERBUFFER, glRenderTarget.depthStencilRenderBuffer);
			if (glRenderTarget.msaa) gl.renderbufferStorageMultisample(gl.RENDERBUFFER, 4, gl.DEPTH24_STENCIL8, glRenderTarget.width, glRenderTarget.height);
			else gl.renderbufferStorage(gl.RENDERBUFFER, this._renderer.context.webGLVersion === 2 ? gl.DEPTH24_STENCIL8 : gl.DEPTH_STENCIL, glRenderTarget.width, glRenderTarget.height);
		}
		prerender(renderTarget) {
			const resource = renderTarget.colorTexture.resource;
			if (this._renderer.context.multiView && CanvasSource.test(resource)) this._renderer.context.ensureCanvasSize(resource);
		}
		postrender(renderTarget) {
			if (!this._renderer.context.multiView) return;
			if (CanvasSource.test(renderTarget.colorTexture.resource)) {
				const contextCanvas = this._renderer.context.canvas;
				const canvasSource = renderTarget.colorTexture;
				canvasSource.context2D.drawImage(contextCanvas, 0, canvasSource.pixelHeight - contextCanvas.height);
			}
		}
		_setDrawBuffers(renderTarget, gl) {
			const count = renderTarget.colorTextures.length;
			const bufferArray = this._drawBuffersCache[count];
			if (this._renderer.context.webGLVersion === 1) {
				const ext = this._renderer.context.extensions.drawBuffers;
				if (!ext) warn("[RenderTexture] This WebGL1 context does not support rendering to multiple targets");
				else ext.drawBuffersWEBGL(bufferArray);
			} else gl.drawBuffers(bufferArray);
		}
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/renderTarget/GlRenderTargetSystem.mjs
var GlRenderTargetSystem;
var init_GlRenderTargetSystem = __esmMin((() => {
	init_Extensions();
	init_RenderTargetSystem();
	init_GlRenderTargetAdaptor();
	GlRenderTargetSystem = class extends RenderTargetSystem {
		constructor(renderer) {
			super(renderer);
			this.adaptor = new GlRenderTargetAdaptor();
			this.adaptor.init(renderer, this);
		}
	};
	/** @ignore */
	GlRenderTargetSystem.extension = {
		type: [ExtensionType.WebGLSystem],
		name: "renderTarget"
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/shader/GenerateShaderSyncCode.mjs
function generateShaderSyncCode(shader, shaderSystem) {
	const funcFragments = [];
	const headerFragments = [`
        var g = s.groups;
        var sS = r.shader;
        var p = s.glProgram;
        var ugS = r.uniformGroup;
        var resources;
    `];
	let addedTextreSystem = false;
	let textureCount = 0;
	const programData = shaderSystem._getProgramData(shader.glProgram);
	for (const i in shader.groups) {
		const group = shader.groups[i];
		funcFragments.push(`
            resources = g[${i}].resources;
        `);
		for (const j in group.resources) {
			const resource = group.resources[j];
			if (resource instanceof UniformGroup) if (resource.ubo) {
				const resName = shader._uniformBindMap[i][Number(j)];
				funcFragments.push(`
                        sS.bindUniformBlock(
                            resources[${j}],
                            '${resName}',
                            ${shader.glProgram._uniformBlockData[resName].index}
                        );
                    `);
			} else funcFragments.push(`
                        ugS.updateUniformGroup(resources[${j}], p, sD);
                    `);
			else if (resource instanceof BufferResource) {
				const resName = shader._uniformBindMap[i][Number(j)];
				funcFragments.push(`
                    sS.bindUniformBlock(
                        resources[${j}],
                        '${resName}',
                        ${shader.glProgram._uniformBlockData[resName].index}
                    );
                `);
			} else if (resource instanceof TextureSource) {
				const uniformName = shader._uniformBindMap[i][j];
				const uniformData = programData.uniformData[uniformName];
				if (uniformData) {
					if (!addedTextreSystem) {
						addedTextreSystem = true;
						headerFragments.push(`
                        var tS = r.texture;
                        `);
					}
					shaderSystem._gl.uniform1i(uniformData.location, textureCount);
					funcFragments.push(`
                        tS.bind(resources[${j}], ${textureCount});
                    `);
					textureCount++;
				}
			}
		}
	}
	const functionSource = [...headerFragments, ...funcFragments].join("\n");
	return new Function("r", "s", "sD", functionSource);
}
var init_GenerateShaderSyncCode = __esmMin((() => {
	init_BufferResource();
	init_UniformGroup();
	init_TextureSource();
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/shader/GlProgramData.mjs
var GlProgramData;
var init_GlProgramData = __esmMin((() => {
	GlProgramData = class {
		/**
		* Makes a new Pixi program.
		* @param program - webgl program
		* @param uniformData - uniforms
		*/
		constructor(program, uniformData) {
			this.program = program;
			this.uniformData = uniformData;
			this.uniformGroups = {};
			this.uniformDirtyGroups = {};
			this.uniformBlockBindings = {};
		}
		/** Destroys this program. */
		destroy() {
			this.uniformData = null;
			this.uniformGroups = null;
			this.uniformDirtyGroups = null;
			this.uniformBlockBindings = null;
			this.program = null;
		}
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/compileShader.mjs
function compileShader(gl, type, src) {
	const shader = gl.createShader(type);
	gl.shaderSource(shader, src);
	gl.compileShader(shader);
	return shader;
}
var init_compileShader = __esmMin((() => {}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/defaultValue.mjs
function booleanArray(size) {
	const array = new Array(size);
	for (let i = 0; i < array.length; i++) array[i] = false;
	return array;
}
function defaultValue(type, size) {
	switch (type) {
		case "float": return 0;
		case "vec2": return new Float32Array(2 * size);
		case "vec3": return new Float32Array(3 * size);
		case "vec4": return new Float32Array(4 * size);
		case "int":
		case "uint":
		case "sampler2D":
		case "sampler2DArray": return 0;
		case "ivec2": return new Int32Array(2 * size);
		case "ivec3": return new Int32Array(3 * size);
		case "ivec4": return new Int32Array(4 * size);
		case "uvec2": return new Uint32Array(2 * size);
		case "uvec3": return new Uint32Array(3 * size);
		case "uvec4": return new Uint32Array(4 * size);
		case "bool": return false;
		case "bvec2": return booleanArray(2 * size);
		case "bvec3": return booleanArray(3 * size);
		case "bvec4": return booleanArray(4 * size);
		case "mat2": return new Float32Array([
			1,
			0,
			0,
			1
		]);
		case "mat3": return new Float32Array([
			1,
			0,
			0,
			0,
			1,
			0,
			0,
			0,
			1
		]);
		case "mat4": return new Float32Array([
			1,
			0,
			0,
			0,
			0,
			1,
			0,
			0,
			0,
			0,
			1,
			0,
			0,
			0,
			0,
			1
		]);
	}
	return null;
}
var init_defaultValue = __esmMin((() => {}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/mapType.mjs
function mapType(gl, type) {
	if (!GL_TABLE) {
		const typeNames = Object.keys(GL_TO_GLSL_TYPES);
		GL_TABLE = {};
		for (let i = 0; i < typeNames.length; ++i) {
			const tn = typeNames[i];
			GL_TABLE[gl[tn]] = GL_TO_GLSL_TYPES[tn];
		}
	}
	return GL_TABLE[type];
}
function mapGlToVertexFormat(gl, type) {
	const typeValue = mapType(gl, type);
	return GLSL_TO_VERTEX_TYPES[typeValue] || "float32";
}
var GL_TABLE, GL_TO_GLSL_TYPES, GLSL_TO_VERTEX_TYPES;
var init_mapType = __esmMin((() => {
	GL_TABLE = null;
	GL_TO_GLSL_TYPES = {
		FLOAT: "float",
		FLOAT_VEC2: "vec2",
		FLOAT_VEC3: "vec3",
		FLOAT_VEC4: "vec4",
		INT: "int",
		INT_VEC2: "ivec2",
		INT_VEC3: "ivec3",
		INT_VEC4: "ivec4",
		UNSIGNED_INT: "uint",
		UNSIGNED_INT_VEC2: "uvec2",
		UNSIGNED_INT_VEC3: "uvec3",
		UNSIGNED_INT_VEC4: "uvec4",
		BOOL: "bool",
		BOOL_VEC2: "bvec2",
		BOOL_VEC3: "bvec3",
		BOOL_VEC4: "bvec4",
		FLOAT_MAT2: "mat2",
		FLOAT_MAT3: "mat3",
		FLOAT_MAT4: "mat4",
		SAMPLER_2D: "sampler2D",
		INT_SAMPLER_2D: "sampler2D",
		UNSIGNED_INT_SAMPLER_2D: "sampler2D",
		SAMPLER_CUBE: "samplerCube",
		INT_SAMPLER_CUBE: "samplerCube",
		UNSIGNED_INT_SAMPLER_CUBE: "samplerCube",
		SAMPLER_2D_ARRAY: "sampler2DArray",
		INT_SAMPLER_2D_ARRAY: "sampler2DArray",
		UNSIGNED_INT_SAMPLER_2D_ARRAY: "sampler2DArray"
	};
	GLSL_TO_VERTEX_TYPES = {
		float: "float32",
		vec2: "float32x2",
		vec3: "float32x3",
		vec4: "float32x4",
		int: "sint32",
		ivec2: "sint32x2",
		ivec3: "sint32x3",
		ivec4: "sint32x4",
		uint: "uint32",
		uvec2: "uint32x2",
		uvec3: "uint32x3",
		uvec4: "uint32x4",
		bool: "uint32",
		bvec2: "uint32x2",
		bvec3: "uint32x3",
		bvec4: "uint32x4"
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/extractAttributesFromGlProgram.mjs
function extractAttributesFromGlProgram(program, gl, sortAttributes = false) {
	const attributes = {};
	const totalAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
	for (let i = 0; i < totalAttributes; i++) {
		const attribData = gl.getActiveAttrib(program, i);
		if (attribData.name.startsWith("gl_")) continue;
		const format = mapGlToVertexFormat(gl, attribData.type);
		attributes[attribData.name] = {
			location: 0,
			format,
			stride: getAttributeInfoFromFormat(format).stride,
			offset: 0,
			instance: false,
			start: 0
		};
	}
	const keys = Object.keys(attributes);
	if (sortAttributes) {
		keys.sort((a, b) => a > b ? 1 : -1);
		for (let i = 0; i < keys.length; i++) {
			attributes[keys[i]].location = i;
			gl.bindAttribLocation(program, i, keys[i]);
		}
		gl.linkProgram(program);
	} else for (let i = 0; i < keys.length; i++) attributes[keys[i]].location = gl.getAttribLocation(program, keys[i]);
	return attributes;
}
var init_extractAttributesFromGlProgram = __esmMin((() => {
	init_getAttributeInfoFromFormat();
	init_mapType();
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/getUboData.mjs
function getUboData(program, gl) {
	if (!gl.ACTIVE_UNIFORM_BLOCKS) return {};
	const uniformBlocks = {};
	const totalUniformsBlocks = gl.getProgramParameter(program, gl.ACTIVE_UNIFORM_BLOCKS);
	for (let i = 0; i < totalUniformsBlocks; i++) {
		const name = gl.getActiveUniformBlockName(program, i);
		uniformBlocks[name] = {
			name,
			index: gl.getUniformBlockIndex(program, name),
			size: gl.getActiveUniformBlockParameter(program, i, gl.UNIFORM_BLOCK_DATA_SIZE)
		};
	}
	return uniformBlocks;
}
var init_getUboData = __esmMin((() => {}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/getUniformData.mjs
function getUniformData(program, gl) {
	const uniforms = {};
	const totalUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
	for (let i = 0; i < totalUniforms; i++) {
		const uniformData = gl.getActiveUniform(program, i);
		const name = uniformData.name.replace(/\[.*?\]$/, "");
		const isArray = !!uniformData.name.match(/\[.*?\]$/);
		const type = mapType(gl, uniformData.type);
		uniforms[name] = {
			name,
			index: i,
			type,
			size: uniformData.size,
			isArray,
			value: defaultValue(type, uniformData.size)
		};
	}
	return uniforms;
}
var init_getUniformData = __esmMin((() => {
	init_defaultValue();
	init_mapType();
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/logProgramError.mjs
function logPrettyShaderError(gl, shader) {
	const rawSource = gl.getShaderSource(shader);
	if (rawSource === null) {
		console.error("PixiJS Error: Could not retrieve shader source (WebGL context may be lost).");
		return;
	}
	const shaderSrc = rawSource.split("\n").map((line, index) => `${index}: ${line}`);
	const shaderLog = gl.getShaderInfoLog(shader) ?? "";
	const splitShader = shaderLog.split("\n");
	const dedupe = {};
	const lineNumbers = splitShader.map((line) => parseFloat(line.replace(/^ERROR\: 0\:([\d]+)\:.*$/, "$1"))).filter((n) => {
		if (n && !dedupe[n]) {
			dedupe[n] = true;
			return true;
		}
		return false;
	});
	const logArgs = [""];
	lineNumbers.forEach((number) => {
		shaderSrc[number - 1] = `%c${shaderSrc[number - 1]}%c`;
		logArgs.push("background: #FF0000; color:#FFFFFF; font-size: 10px", "font-size: 10px");
	});
	logArgs[0] = shaderSrc.join("\n");
	console.error(shaderLog);
	console.groupCollapsed("click to view full shader code");
	console.warn(...logArgs);
	console.groupEnd();
}
function logProgramError(gl, program, vertexShader, fragmentShader) {
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) logPrettyShaderError(gl, vertexShader);
		if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) logPrettyShaderError(gl, fragmentShader);
		console.error("PixiJS Error: Could not initialize shader.");
		if (gl.getProgramInfoLog(program) !== "") console.warn("PixiJS Warning: gl.getProgramInfoLog()", gl.getProgramInfoLog(program));
	}
}
var init_logProgramError = __esmMin((() => {}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/generateProgram.mjs
function generateProgram(gl, program) {
	const glVertShader = compileShader(gl, gl.VERTEX_SHADER, program.vertex);
	const glFragShader = compileShader(gl, gl.FRAGMENT_SHADER, program.fragment);
	const webGLProgram = gl.createProgram();
	gl.attachShader(webGLProgram, glVertShader);
	gl.attachShader(webGLProgram, glFragShader);
	const transformFeedbackVaryings = program.transformFeedbackVaryings;
	if (transformFeedbackVaryings) if (typeof gl.transformFeedbackVaryings !== "function") warn(`TransformFeedback is not supported but TransformFeedbackVaryings are given.`);
	else gl.transformFeedbackVaryings(webGLProgram, transformFeedbackVaryings.names, transformFeedbackVaryings.bufferMode === "separate" ? gl.SEPARATE_ATTRIBS : gl.INTERLEAVED_ATTRIBS);
	gl.linkProgram(webGLProgram);
	if (!gl.getProgramParameter(webGLProgram, gl.LINK_STATUS)) logProgramError(gl, webGLProgram, glVertShader, glFragShader);
	program._attributeData = extractAttributesFromGlProgram(webGLProgram, gl, !/^[ \t]*#[ \t]*version[ \t]+300[ \t]+es[ \t]*$/m.test(program.vertex));
	program._uniformData = getUniformData(webGLProgram, gl);
	program._uniformBlockData = getUboData(webGLProgram, gl);
	gl.deleteShader(glVertShader);
	gl.deleteShader(glFragShader);
	const uniformData = {};
	for (const i in program._uniformData) {
		const data = program._uniformData[i];
		uniformData[i] = {
			location: gl.getUniformLocation(webGLProgram, i),
			value: defaultValue(data.type, data.size)
		};
	}
	return new GlProgramData(webGLProgram, uniformData);
}
var init_generateProgram = __esmMin((() => {
	init_warn();
	init_GlProgramData();
	init_compileShader();
	init_defaultValue();
	init_extractAttributesFromGlProgram();
	init_getUboData();
	init_getUniformData();
	init_logProgramError();
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/shader/GlShaderSystem.mjs
var defaultSyncData, GlShaderSystem;
var init_GlShaderSystem = __esmMin((() => {
	init_Extensions();
	init_GenerateShaderSyncCode();
	init_generateProgram();
	defaultSyncData = {
		textureCount: 0,
		blockIndex: 0
	};
	GlShaderSystem = class {
		constructor(renderer) {
			/** @internal */
			this._activeProgram = null;
			this._programDataHash = /* @__PURE__ */ Object.create(null);
			this._shaderSyncFunctions = /* @__PURE__ */ Object.create(null);
			this._renderer = renderer;
		}
		contextChange(gl) {
			this._gl = gl;
			this._programDataHash = /* @__PURE__ */ Object.create(null);
			this._shaderSyncFunctions = /* @__PURE__ */ Object.create(null);
			this._activeProgram = null;
		}
		/**
		* Changes the current shader to the one given in parameter.
		* @param shader - the new shader
		* @param skipSync - false if the shader should automatically sync its uniforms.
		* @returns the glProgram that belongs to the shader.
		*/
		bind(shader, skipSync) {
			this._setProgram(shader.glProgram);
			if (skipSync) return;
			defaultSyncData.textureCount = 0;
			defaultSyncData.blockIndex = 0;
			let syncFunction = this._shaderSyncFunctions[shader.glProgram._key];
			if (!syncFunction) syncFunction = this._shaderSyncFunctions[shader.glProgram._key] = this._generateShaderSync(shader, this);
			this._renderer.buffer.nextBindBase(!!shader.glProgram.transformFeedbackVaryings);
			syncFunction(this._renderer, shader, defaultSyncData);
		}
		/**
		* Updates the uniform group.
		* @param uniformGroup - the uniform group to update
		*/
		updateUniformGroup(uniformGroup) {
			this._renderer.uniformGroup.updateUniformGroup(uniformGroup, this._activeProgram, defaultSyncData);
		}
		/**
		* Binds a uniform block to the shader.
		* @param uniformGroup - the uniform group to bind
		* @param name - the name of the uniform block
		* @param index - the index of the uniform block
		*/
		bindUniformBlock(uniformGroup, name, index = 0) {
			const bufferSystem = this._renderer.buffer;
			const programData = this._getProgramData(this._activeProgram);
			const isBufferResource = uniformGroup._bufferResource;
			if (!isBufferResource) this._renderer.ubo.updateUniformGroup(uniformGroup);
			const buffer = uniformGroup.buffer;
			const glBuffer = bufferSystem.updateBuffer(buffer);
			const boundLocation = bufferSystem.freeLocationForBufferBase(glBuffer);
			if (isBufferResource) {
				const { offset, size } = uniformGroup;
				if (offset === 0 && size === buffer.data.byteLength) bufferSystem.bindBufferBase(glBuffer, boundLocation);
				else bufferSystem.bindBufferRange(glBuffer, boundLocation, offset);
			} else if (bufferSystem.getLastBindBaseLocation(glBuffer) !== boundLocation) bufferSystem.bindBufferBase(glBuffer, boundLocation);
			const uniformBlockIndex = this._activeProgram._uniformBlockData[name].index;
			if (programData.uniformBlockBindings[index] === boundLocation) return;
			programData.uniformBlockBindings[index] = boundLocation;
			this._renderer.gl.uniformBlockBinding(programData.program, uniformBlockIndex, boundLocation);
		}
		_setProgram(program) {
			if (this._activeProgram === program) return;
			this._activeProgram = program;
			const programData = this._getProgramData(program);
			this._gl.useProgram(programData.program);
		}
		/**
		* @param program - the program to get the data for
		* @internal
		*/
		_getProgramData(program) {
			return this._programDataHash[program._key] || this._createProgramData(program);
		}
		_createProgramData(program) {
			const key = program._key;
			this._programDataHash[key] = generateProgram(this._gl, program);
			return this._programDataHash[key];
		}
		destroy() {
			for (const key of Object.keys(this._programDataHash)) this._programDataHash[key].destroy();
			this._programDataHash = null;
			this._shaderSyncFunctions = null;
			this._activeProgram = null;
			this._renderer = null;
			this._gl = null;
		}
		/**
		* Creates a function that can be executed that will sync the shader as efficiently as possible.
		* Overridden by the unsafe eval package if you don't want eval used in your project.
		* @param shader - the shader to generate the sync function for
		* @param shaderSystem - the shader system to use
		* @returns - the generated sync function
		* @ignore
		*/
		_generateShaderSync(shader, shaderSystem) {
			return generateShaderSyncCode(shader, shaderSystem);
		}
		resetState() {
			this._activeProgram = null;
		}
	};
	/** @ignore */
	GlShaderSystem.extension = {
		type: [ExtensionType.WebGLSystem],
		name: "shader"
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/shader/utils/generateUniformsSyncTypes.mjs
var UNIFORM_TO_SINGLE_SETTERS, UNIFORM_TO_ARRAY_SETTERS;
var init_generateUniformsSyncTypes = __esmMin((() => {
	UNIFORM_TO_SINGLE_SETTERS = {
		f32: `if (cv !== v) {
            cu.value = v;
            gl.uniform1f(location, v);
        }`,
		"vec2<f32>": `if (cv[0] !== v[0] || cv[1] !== v[1]) {
            cv[0] = v[0];
            cv[1] = v[1];
            gl.uniform2f(location, v[0], v[1]);
        }`,
		"vec3<f32>": `if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2]) {
            cv[0] = v[0];
            cv[1] = v[1];
            cv[2] = v[2];
            gl.uniform3f(location, v[0], v[1], v[2]);
        }`,
		"vec4<f32>": `if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3]) {
            cv[0] = v[0];
            cv[1] = v[1];
            cv[2] = v[2];
            cv[3] = v[3];
            gl.uniform4f(location, v[0], v[1], v[2], v[3]);
        }`,
		i32: `if (cv !== v) {
            cu.value = v;
            gl.uniform1i(location, v);
        }`,
		"vec2<i32>": `if (cv[0] !== v[0] || cv[1] !== v[1]) {
            cv[0] = v[0];
            cv[1] = v[1];
            gl.uniform2i(location, v[0], v[1]);
        }`,
		"vec3<i32>": `if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2]) {
            cv[0] = v[0];
            cv[1] = v[1];
            cv[2] = v[2];
            gl.uniform3i(location, v[0], v[1], v[2]);
        }`,
		"vec4<i32>": `if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3]) {
            cv[0] = v[0];
            cv[1] = v[1];
            cv[2] = v[2];
            cv[3] = v[3];
            gl.uniform4i(location, v[0], v[1], v[2], v[3]);
        }`,
		u32: `if (cv !== v) {
            cu.value = v;
            gl.uniform1ui(location, v);
        }`,
		"vec2<u32>": `if (cv[0] !== v[0] || cv[1] !== v[1]) {
            cv[0] = v[0];
            cv[1] = v[1];
            gl.uniform2ui(location, v[0], v[1]);
        }`,
		"vec3<u32>": `if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2]) {
            cv[0] = v[0];
            cv[1] = v[1];
            cv[2] = v[2];
            gl.uniform3ui(location, v[0], v[1], v[2]);
        }`,
		"vec4<u32>": `if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3]) {
            cv[0] = v[0];
            cv[1] = v[1];
            cv[2] = v[2];
            cv[3] = v[3];
            gl.uniform4ui(location, v[0], v[1], v[2], v[3]);
        }`,
		bool: `if (cv !== v) {
            cu.value = v;
            gl.uniform1i(location, v);
        }`,
		"vec2<bool>": `if (cv[0] !== v[0] || cv[1] !== v[1]) {
            cv[0] = v[0];
            cv[1] = v[1];
            gl.uniform2i(location, v[0], v[1]);
        }`,
		"vec3<bool>": `if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2]) {
            cv[0] = v[0];
            cv[1] = v[1];
            cv[2] = v[2];
            gl.uniform3i(location, v[0], v[1], v[2]);
        }`,
		"vec4<bool>": `if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3]) {
            cv[0] = v[0];
            cv[1] = v[1];
            cv[2] = v[2];
            cv[3] = v[3];
            gl.uniform4i(location, v[0], v[1], v[2], v[3]);
        }`,
		"mat2x2<f32>": `gl.uniformMatrix2fv(location, false, v);`,
		"mat3x3<f32>": `gl.uniformMatrix3fv(location, false, v);`,
		"mat4x4<f32>": `gl.uniformMatrix4fv(location, false, v);`
	};
	UNIFORM_TO_ARRAY_SETTERS = {
		f32: `gl.uniform1fv(location, v);`,
		"vec2<f32>": `gl.uniform2fv(location, v);`,
		"vec3<f32>": `gl.uniform3fv(location, v);`,
		"vec4<f32>": `gl.uniform4fv(location, v);`,
		"mat2x2<f32>": `gl.uniformMatrix2fv(location, false, v);`,
		"mat3x3<f32>": `gl.uniformMatrix3fv(location, false, v);`,
		"mat4x4<f32>": `gl.uniformMatrix4fv(location, false, v);`,
		i32: `gl.uniform1iv(location, v);`,
		"vec2<i32>": `gl.uniform2iv(location, v);`,
		"vec3<i32>": `gl.uniform3iv(location, v);`,
		"vec4<i32>": `gl.uniform4iv(location, v);`,
		u32: `gl.uniform1iv(location, v);`,
		"vec2<u32>": `gl.uniform2iv(location, v);`,
		"vec3<u32>": `gl.uniform3iv(location, v);`,
		"vec4<u32>": `gl.uniform4iv(location, v);`,
		bool: `gl.uniform1iv(location, v);`,
		"vec2<bool>": `gl.uniform2iv(location, v);`,
		"vec3<bool>": `gl.uniform3iv(location, v);`,
		"vec4<bool>": `gl.uniform4iv(location, v);`
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/shader/utils/generateUniformsSync.mjs
function generateUniformsSync(group, uniformData) {
	const funcFragments = [`
        var v = null;
        var cv = null;
        var cu = null;
        var t = 0;
        var gl = renderer.gl;
        var name = null;
    `];
	for (const i in group.uniforms) {
		if (!uniformData[i]) {
			if (group.uniforms[i] instanceof UniformGroup) if (group.uniforms[i].ubo) funcFragments.push(`
                        renderer.shader.bindUniformBlock(uv.${i}, "${i}");
                    `);
			else funcFragments.push(`
                        renderer.shader.updateUniformGroup(uv.${i});
                    `);
			else if (group.uniforms[i] instanceof BufferResource) funcFragments.push(`
                        renderer.shader.bindBufferResource(uv.${i}, "${i}");
                    `);
			continue;
		}
		const uniform = group.uniformStructures[i];
		let parsed = false;
		for (let j = 0; j < uniformParsers.length; j++) {
			const parser = uniformParsers[j];
			if (uniform.type === parser.type && parser.test(uniform)) {
				funcFragments.push(`name = "${i}";`, uniformParsers[j].uniform);
				parsed = true;
				break;
			}
		}
		if (!parsed) {
			const template = (uniform.size === 1 ? UNIFORM_TO_SINGLE_SETTERS : UNIFORM_TO_ARRAY_SETTERS)[uniform.type].replace("location", `ud["${i}"].location`);
			funcFragments.push(`
            cu = ud["${i}"];
            cv = cu.value;
            v = uv["${i}"];
            ${template};`);
		}
	}
	return new Function("ud", "uv", "renderer", "syncData", funcFragments.join("\n"));
}
var init_generateUniformsSync = __esmMin((() => {
	init_BufferResource();
	init_UniformGroup();
	init_uniformParsers();
	init_generateUniformsSyncTypes();
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/shader/GlUniformGroupSystem.mjs
var GlUniformGroupSystem;
var init_GlUniformGroupSystem = __esmMin((() => {
	init_Extensions();
	init_generateUniformsSync();
	GlUniformGroupSystem = class {
		/** @param renderer - The renderer this System works for. */
		constructor(renderer) {
			/** Cache to holds the generated functions. Stored against UniformObjects unique signature. */
			this._cache = {};
			this._uniformGroupSyncHash = {};
			this._renderer = renderer;
			this.gl = null;
			this._cache = {};
		}
		contextChange(gl) {
			this.gl = gl;
		}
		/**
		* Uploads the uniforms values to the currently bound shader.
		* @param group - the uniforms values that be applied to the current shader
		* @param program
		* @param syncData
		* @param syncData.textureCount
		*/
		updateUniformGroup(group, program, syncData) {
			const programData = this._renderer.shader._getProgramData(program);
			if (!group.isStatic || group._dirtyId !== programData.uniformDirtyGroups[group.uid]) {
				programData.uniformDirtyGroups[group.uid] = group._dirtyId;
				this._getUniformSyncFunction(group, program)(programData.uniformData, group.uniforms, this._renderer, syncData);
			}
		}
		/**
		* Overridable by the pixi.js/unsafe-eval package to use static syncUniforms instead.
		* @param group
		* @param program
		*/
		_getUniformSyncFunction(group, program) {
			return this._uniformGroupSyncHash[group._signature]?.[program._key] || this._createUniformSyncFunction(group, program);
		}
		_createUniformSyncFunction(group, program) {
			const uniformGroupSyncHash = this._uniformGroupSyncHash[group._signature] || (this._uniformGroupSyncHash[group._signature] = {});
			const id = this._getSignature(group, program._uniformData, "u");
			if (!this._cache[id]) this._cache[id] = this._generateUniformsSync(group, program._uniformData);
			uniformGroupSyncHash[program._key] = this._cache[id];
			return uniformGroupSyncHash[program._key];
		}
		_generateUniformsSync(group, uniformData) {
			return generateUniformsSync(group, uniformData);
		}
		/**
		* Takes a uniform group and data and generates a unique signature for them.
		* @param group - The uniform group to get signature of
		* @param group.uniforms
		* @param uniformData - Uniform information generated by the shader
		* @param preFix
		* @returns Unique signature of the uniform group
		*/
		_getSignature(group, uniformData, preFix) {
			const uniforms = group.uniforms;
			const strings = [`${preFix}-`];
			for (const i in uniforms) {
				strings.push(i);
				if (uniformData[i]) strings.push(uniformData[i].type);
			}
			return strings.join("-");
		}
		/** Destroys this System and removes all its textures. */
		destroy() {
			this._renderer = null;
			this._cache = null;
		}
	};
	/** @ignore */
	GlUniformGroupSystem.extension = {
		type: [ExtensionType.WebGLSystem],
		name: "uniformGroup"
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/state/mapWebGLBlendModesToPixi.mjs
function mapWebGLBlendModesToPixi(gl) {
	const blendMap = {};
	blendMap.normal = [gl.ONE, gl.ONE_MINUS_SRC_ALPHA];
	blendMap.add = [gl.ONE, gl.ONE];
	blendMap.multiply = [
		gl.DST_COLOR,
		gl.ONE_MINUS_SRC_ALPHA,
		gl.ONE,
		gl.ONE_MINUS_SRC_ALPHA
	];
	blendMap.screen = [
		gl.ONE,
		gl.ONE_MINUS_SRC_COLOR,
		gl.ONE,
		gl.ONE_MINUS_SRC_ALPHA
	];
	blendMap.none = [0, 0];
	blendMap["normal-npm"] = [
		gl.SRC_ALPHA,
		gl.ONE_MINUS_SRC_ALPHA,
		gl.ONE,
		gl.ONE_MINUS_SRC_ALPHA
	];
	blendMap["add-npm"] = [
		gl.SRC_ALPHA,
		gl.ONE,
		gl.ONE,
		gl.ONE
	];
	blendMap["screen-npm"] = [
		gl.SRC_ALPHA,
		gl.ONE_MINUS_SRC_COLOR,
		gl.ONE,
		gl.ONE_MINUS_SRC_ALPHA
	];
	blendMap.erase = [gl.ZERO, gl.ONE_MINUS_SRC_ALPHA];
	if (!(gl instanceof DOMAdapter.get().getWebGLRenderingContext())) {
		blendMap.min = [
			gl.ONE,
			gl.ONE,
			gl.ONE,
			gl.ONE,
			gl.MIN,
			gl.MIN
		];
		blendMap.max = [
			gl.ONE,
			gl.ONE,
			gl.ONE,
			gl.ONE,
			gl.MAX,
			gl.MAX
		];
	} else {
		const ext = gl.getExtension("EXT_blend_minmax");
		if (ext) {
			blendMap.min = [
				gl.ONE,
				gl.ONE,
				gl.ONE,
				gl.ONE,
				ext.MIN_EXT,
				ext.MIN_EXT
			];
			blendMap.max = [
				gl.ONE,
				gl.ONE,
				gl.ONE,
				gl.ONE,
				ext.MAX_EXT,
				ext.MAX_EXT
			];
		}
	}
	return blendMap;
}
var init_mapWebGLBlendModesToPixi = __esmMin((() => {
	init_adapter();
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/state/GlStateSystem.mjs
var BLEND, OFFSET, CULLING, DEPTH_TEST, WINDING, DEPTH_MASK, _GlStateSystem, GlStateSystem;
var init_GlStateSystem = __esmMin((() => {
	init_Extensions();
	init_State();
	init_mapWebGLBlendModesToPixi();
	BLEND = 0;
	OFFSET = 1;
	CULLING = 2;
	DEPTH_TEST = 3;
	WINDING = 4;
	DEPTH_MASK = 5;
	_GlStateSystem = class _GlStateSystem {
		constructor(renderer) {
			/**
			* Whether to invert the front face when rendering
			* This is used for render textures where the Y-coordinate is flipped
			* @default false
			*/
			this._invertFrontFace = false;
			this.gl = null;
			this.stateId = 0;
			this.polygonOffset = 0;
			this.blendMode = "none";
			this._blendEq = false;
			this.map = [];
			this.map[BLEND] = this.setBlend;
			this.map[OFFSET] = this.setOffset;
			this.map[CULLING] = this.setCullFace;
			this.map[DEPTH_TEST] = this.setDepthTest;
			this.map[WINDING] = this.setFrontFace;
			this.map[DEPTH_MASK] = this.setDepthMask;
			this.checks = [];
			this.defaultState = State.for2d();
			renderer.renderTarget.onRenderTargetChange.add(this);
		}
		onRenderTargetChange(renderTarget) {
			this._invertFrontFace = !renderTarget.isRoot;
			if (this._cullFace) this.setFrontFace(this._frontFace);
			else this._frontFaceDirty = true;
		}
		contextChange(gl) {
			this.gl = gl;
			this.blendModesMap = mapWebGLBlendModesToPixi(gl);
			this.resetState();
		}
		/**
		* Sets the current state
		* @param {*} state - The state to set.
		*/
		set(state) {
			state || (state = this.defaultState);
			if (this.stateId !== state.data) {
				let diff = this.stateId ^ state.data;
				let i = 0;
				while (diff) {
					if (diff & 1) this.map[i].call(this, !!(state.data & 1 << i));
					diff >>= 1;
					i++;
				}
				this.stateId = state.data;
			}
			for (let i = 0; i < this.checks.length; i++) this.checks[i](this, state);
		}
		/**
		* Sets the state, when previous state is unknown.
		* @param {*} state - The state to set
		*/
		forceState(state) {
			state || (state = this.defaultState);
			for (let i = 0; i < this.map.length; i++) this.map[i].call(this, !!(state.data & 1 << i));
			for (let i = 0; i < this.checks.length; i++) this.checks[i](this, state);
			this.stateId = state.data;
		}
		/**
		* Sets whether to enable or disable blending.
		* @param value - Turn on or off WebGl blending.
		*/
		setBlend(value) {
			this._updateCheck(_GlStateSystem._checkBlendMode, value);
			this.gl[value ? "enable" : "disable"](this.gl.BLEND);
		}
		/**
		* Sets whether to enable or disable polygon offset fill.
		* @param value - Turn on or off webgl polygon offset testing.
		*/
		setOffset(value) {
			this._updateCheck(_GlStateSystem._checkPolygonOffset, value);
			this.gl[value ? "enable" : "disable"](this.gl.POLYGON_OFFSET_FILL);
		}
		/**
		* Sets whether to enable or disable depth test.
		* @param value - Turn on or off webgl depth testing.
		*/
		setDepthTest(value) {
			this.gl[value ? "enable" : "disable"](this.gl.DEPTH_TEST);
		}
		/**
		* Sets whether to enable or disable depth mask.
		* @param value - Turn on or off webgl depth mask.
		*/
		setDepthMask(value) {
			this.gl.depthMask(value);
		}
		/**
		* Sets whether to enable or disable cull face.
		* @param {boolean} value - Turn on or off webgl cull face.
		*/
		setCullFace(value) {
			this._cullFace = value;
			this.gl[value ? "enable" : "disable"](this.gl.CULL_FACE);
			if (this._cullFace && this._frontFaceDirty) this.setFrontFace(this._frontFace);
		}
		/**
		* Sets the gl front face.
		* @param {boolean} value - true is clockwise and false is counter-clockwise
		*/
		setFrontFace(value) {
			this._frontFace = value;
			this._frontFaceDirty = false;
			const faceMode = this._invertFrontFace ? !value : value;
			if (this._glFrontFace !== faceMode) {
				this._glFrontFace = faceMode;
				this.gl.frontFace(this.gl[faceMode ? "CW" : "CCW"]);
			}
		}
		/**
		* Sets the blend mode.
		* @param {number} value - The blend mode to set to.
		*/
		setBlendMode(value) {
			if (!this.blendModesMap[value]) value = "normal";
			if (value === this.blendMode) return;
			this.blendMode = value;
			const mode = this.blendModesMap[value];
			const gl = this.gl;
			if (mode.length === 2) gl.blendFunc(mode[0], mode[1]);
			else gl.blendFuncSeparate(mode[0], mode[1], mode[2], mode[3]);
			if (mode.length === 6) {
				this._blendEq = true;
				gl.blendEquationSeparate(mode[4], mode[5]);
			} else if (this._blendEq) {
				this._blendEq = false;
				gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
			}
		}
		/**
		* Sets the polygon offset.
		* @param {number} value - the polygon offset
		* @param {number} scale - the polygon offset scale
		*/
		setPolygonOffset(value, scale) {
			this.gl.polygonOffset(value, scale);
		}
		/** Resets all the logic and disables the VAOs. */
		resetState() {
			this._glFrontFace = false;
			this._frontFace = false;
			this._cullFace = false;
			this._frontFaceDirty = false;
			this._invertFrontFace = false;
			this.gl.frontFace(this.gl.CCW);
			this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, false);
			this.forceState(this.defaultState);
			this._blendEq = true;
			this.blendMode = "";
			this.setBlendMode("normal");
		}
		/**
		* Checks to see which updates should be checked based on which settings have been activated.
		*
		* For example, if blend is enabled then we should check the blend modes each time the state is changed
		* or if polygon fill is activated then we need to check if the polygon offset changes.
		* The idea is that we only check what we have too.
		* @param func - the checking function to add or remove
		* @param value - should the check function be added or removed.
		*/
		_updateCheck(func, value) {
			const index = this.checks.indexOf(func);
			if (value && index === -1) this.checks.push(func);
			else if (!value && index !== -1) this.checks.splice(index, 1);
		}
		/**
		* A private little wrapper function that we call to check the blend mode.
		* @param system - the System to perform the state check on
		* @param state - the state that the blendMode will pulled from
		*/
		static _checkBlendMode(system, state) {
			system.setBlendMode(state.blendMode);
		}
		/**
		* A private little wrapper function that we call to check the polygon offset.
		* @param system - the System to perform the state check on
		* @param state - the state that the blendMode will pulled from
		*/
		static _checkPolygonOffset(system, state) {
			system.setPolygonOffset(1, state.polygonOffset);
		}
		/** @ignore */
		destroy() {
			this.gl = null;
			this.checks.length = 0;
		}
	};
	/** @ignore */
	_GlStateSystem.extension = {
		type: [ExtensionType.WebGLSystem],
		name: "state"
	};
	GlStateSystem = _GlStateSystem;
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/texture/GlTexture.mjs
var GlTexture;
var init_GlTexture = __esmMin((() => {
	init_const();
	GlTexture = class {
		constructor(texture) {
			this.target = GL_TARGETS.TEXTURE_2D;
			/**
			* Bitmask tracking which array layers / sub-targets have been initialized at mip level 0.
			* Used by uploaders that need per-layer allocation semantics (e.g. cube faces).
			* @internal
			*/
			this._layerInitMask = 0;
			this.texture = texture;
			this.width = -1;
			this.height = -1;
			this.type = GL_TYPES.UNSIGNED_BYTE;
			this.internalFormat = GL_FORMATS.RGBA;
			this.format = GL_FORMATS.RGBA;
			this.samplerType = 0;
		}
		destroy() {}
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/texture/uploaders/glUploadBufferImageResource.mjs
var glUploadBufferImageResource;
var init_glUploadBufferImageResource = __esmMin((() => {
	glUploadBufferImageResource = {
		id: "buffer",
		upload(source, glTexture, gl, _webGLVersion, targetOverride, forceAllocation = false) {
			const target = targetOverride || glTexture.target;
			if (!forceAllocation && glTexture.width === source.width && glTexture.height === source.height) gl.texSubImage2D(target, 0, 0, 0, source.width, source.height, glTexture.format, glTexture.type, source.resource);
			else gl.texImage2D(target, 0, glTexture.internalFormat, source.width, source.height, 0, glTexture.format, glTexture.type, source.resource);
			glTexture.width = source.width;
			glTexture.height = source.height;
		}
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/texture/uploaders/glUploadCompressedTextureResource.mjs
var compressedFormatMap, glUploadCompressedTextureResource;
var init_glUploadCompressedTextureResource = __esmMin((() => {
	compressedFormatMap = {
		"bc1-rgba-unorm": true,
		"bc1-rgba-unorm-srgb": true,
		"bc2-rgba-unorm": true,
		"bc2-rgba-unorm-srgb": true,
		"bc3-rgba-unorm": true,
		"bc3-rgba-unorm-srgb": true,
		"bc4-r-unorm": true,
		"bc4-r-snorm": true,
		"bc5-rg-unorm": true,
		"bc5-rg-snorm": true,
		"bc6h-rgb-ufloat": true,
		"bc6h-rgb-float": true,
		"bc7-rgba-unorm": true,
		"bc7-rgba-unorm-srgb": true,
		"etc2-rgb8unorm": true,
		"etc2-rgb8unorm-srgb": true,
		"etc2-rgb8a1unorm": true,
		"etc2-rgb8a1unorm-srgb": true,
		"etc2-rgba8unorm": true,
		"etc2-rgba8unorm-srgb": true,
		"eac-r11unorm": true,
		"eac-r11snorm": true,
		"eac-rg11unorm": true,
		"eac-rg11snorm": true,
		"astc-4x4-unorm": true,
		"astc-4x4-unorm-srgb": true,
		"astc-5x4-unorm": true,
		"astc-5x4-unorm-srgb": true,
		"astc-5x5-unorm": true,
		"astc-5x5-unorm-srgb": true,
		"astc-6x5-unorm": true,
		"astc-6x5-unorm-srgb": true,
		"astc-6x6-unorm": true,
		"astc-6x6-unorm-srgb": true,
		"astc-8x5-unorm": true,
		"astc-8x5-unorm-srgb": true,
		"astc-8x6-unorm": true,
		"astc-8x6-unorm-srgb": true,
		"astc-8x8-unorm": true,
		"astc-8x8-unorm-srgb": true,
		"astc-10x5-unorm": true,
		"astc-10x5-unorm-srgb": true,
		"astc-10x6-unorm": true,
		"astc-10x6-unorm-srgb": true,
		"astc-10x8-unorm": true,
		"astc-10x8-unorm-srgb": true,
		"astc-10x10-unorm": true,
		"astc-10x10-unorm-srgb": true,
		"astc-12x10-unorm": true,
		"astc-12x10-unorm-srgb": true,
		"astc-12x12-unorm": true,
		"astc-12x12-unorm-srgb": true
	};
	glUploadCompressedTextureResource = {
		id: "compressed",
		upload(source, glTexture, gl, _webGLVersion, targetOverride, _forceAllocation) {
			const target = targetOverride ?? glTexture.target;
			gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
			let mipWidth = source.pixelWidth;
			let mipHeight = source.pixelHeight;
			const compressed = !!compressedFormatMap[source.format];
			for (let i = 0; i < source.resource.length; i++) {
				const levelBuffer = source.resource[i];
				if (compressed) gl.compressedTexImage2D(target, i, glTexture.internalFormat, mipWidth, mipHeight, 0, levelBuffer);
				else gl.texImage2D(target, i, glTexture.internalFormat, mipWidth, mipHeight, 0, glTexture.format, glTexture.type, levelBuffer);
				mipWidth = Math.max(mipWidth >> 1, 1);
				mipHeight = Math.max(mipHeight >> 1, 1);
			}
		}
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/texture/uploaders/glUploadCubeTextureResource.mjs
function createGlUploadCubeTextureResource(uploaders) {
	return {
		id: "cube",
		upload(source, glTexture, gl, webGLVersion) {
			const faces = source.faces;
			for (let faceIndex = 0; faceIndex < FACE_ORDER$1.length; faceIndex++) {
				const face = faces[FACE_ORDER$1[faceIndex]];
				(uploaders[face.uploadMethodId] || uploaders.image).upload(face, glTexture, gl, webGLVersion, GL_TARGETS.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex, (glTexture._layerInitMask & 1 << faceIndex) === 0);
				glTexture._layerInitMask |= 1 << faceIndex;
			}
			glTexture.width = source.pixelWidth;
			glTexture.height = source.pixelHeight;
		}
	};
}
var FACE_ORDER$1;
var init_glUploadCubeTextureResource = __esmMin((() => {
	init_const();
	FACE_ORDER$1 = [
		"right",
		"left",
		"top",
		"bottom",
		"front",
		"back"
	];
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/texture/uploaders/glUploadImageResource.mjs
function uploadImageWebGL2(gl, target, glTexture, textureWidth, textureHeight, resourceWidth, resourceHeight, resource, needsAllocation, resourceFitsTexture) {
	if (!resourceFitsTexture) {
		if (needsAllocation) gl.texImage2D(target, 0, glTexture.internalFormat, textureWidth, textureHeight, 0, glTexture.format, glTexture.type, null);
		gl.texSubImage2D(target, 0, 0, 0, resourceWidth, resourceHeight, glTexture.format, glTexture.type, resource);
		return;
	}
	if (!needsAllocation) {
		gl.texSubImage2D(target, 0, 0, 0, glTexture.format, glTexture.type, resource);
		return;
	}
	gl.texImage2D(target, 0, glTexture.internalFormat, textureWidth, textureHeight, 0, glTexture.format, glTexture.type, resource);
}
function uploadImageWebGL1(gl, target, glTexture, textureWidth, textureHeight, _resourceWidth, _resourceHeight, resource, needsAllocation, resourceFitsTexture) {
	if (!resourceFitsTexture) {
		if (needsAllocation) gl.texImage2D(target, 0, glTexture.internalFormat, textureWidth, textureHeight, 0, glTexture.format, glTexture.type, null);
		gl.texSubImage2D(target, 0, 0, 0, glTexture.format, glTexture.type, resource);
		return;
	}
	if (!needsAllocation) {
		gl.texSubImage2D(target, 0, 0, 0, glTexture.format, glTexture.type, resource);
		return;
	}
	gl.texImage2D(target, 0, glTexture.internalFormat, glTexture.format, glTexture.type, resource);
}
var glUploadImageResource;
var init_glUploadImageResource = __esmMin((() => {
	glUploadImageResource = {
		id: "image",
		upload(source, glTexture, gl, webGLVersion, targetOverride, forceAllocation = false) {
			const target = targetOverride || glTexture.target;
			const textureWidth = source.pixelWidth;
			const textureHeight = source.pixelHeight;
			const resourceWidth = source.resourceWidth;
			const resourceHeight = source.resourceHeight;
			const isWebGL2 = webGLVersion === 2;
			const needsAllocation = forceAllocation || glTexture.width !== textureWidth || glTexture.height !== textureHeight;
			const resourceFitsTexture = resourceWidth >= textureWidth && resourceHeight >= textureHeight;
			const resource = source.resource;
			(isWebGL2 ? uploadImageWebGL2 : uploadImageWebGL1)(gl, target, glTexture, textureWidth, textureHeight, resourceWidth, resourceHeight, resource, needsAllocation, resourceFitsTexture);
			glTexture.width = textureWidth;
			glTexture.height = textureHeight;
		}
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/texture/uploaders/glUploadVideoResource.mjs
var defaultForceAllocation, glUploadVideoResource;
var init_glUploadVideoResource = __esmMin((() => {
	init_isSafari();
	init_glUploadImageResource();
	defaultForceAllocation = isSafari();
	glUploadVideoResource = {
		id: "video",
		upload(source, glTexture, gl, webGLVersion, targetOverride, forceAllocation = defaultForceAllocation) {
			if (!source.isValid) {
				const target = targetOverride ?? glTexture.target;
				gl.texImage2D(target, 0, glTexture.internalFormat, 1, 1, 0, glTexture.format, glTexture.type, null);
				return;
			}
			glUploadImageResource.upload(source, glTexture, gl, webGLVersion, targetOverride, forceAllocation);
		}
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/texture/utils/pixiToGlMaps.mjs
var scaleModeToGlFilter, mipmapScaleModeToGlFilter, wrapModeToGlAddress, compareModeToGlCompare;
var init_pixiToGlMaps = __esmMin((() => {
	scaleModeToGlFilter = {
		linear: 9729,
		nearest: 9728
	};
	mipmapScaleModeToGlFilter = {
		linear: {
			linear: 9987,
			nearest: 9985
		},
		nearest: {
			linear: 9986,
			nearest: 9984
		}
	};
	wrapModeToGlAddress = {
		"clamp-to-edge": 33071,
		repeat: 10497,
		"mirror-repeat": 33648
	};
	compareModeToGlCompare = {
		never: 512,
		less: 513,
		equal: 514,
		"less-equal": 515,
		greater: 516,
		"not-equal": 517,
		"greater-equal": 518,
		always: 519
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/texture/utils/applyStyleParams.mjs
function applyStyleParams(style, gl, mipmaps, anisotropicExt, glFunctionName, firstParam, forceClamp, firstCreation) {
	const castParam = firstParam;
	if (!firstCreation || style.addressModeU !== "repeat" || style.addressModeV !== "repeat" || style.addressModeW !== "repeat") {
		const wrapModeS = wrapModeToGlAddress[forceClamp ? "clamp-to-edge" : style.addressModeU];
		const wrapModeT = wrapModeToGlAddress[forceClamp ? "clamp-to-edge" : style.addressModeV];
		const wrapModeR = wrapModeToGlAddress[forceClamp ? "clamp-to-edge" : style.addressModeW];
		gl[glFunctionName](castParam, gl.TEXTURE_WRAP_S, wrapModeS);
		gl[glFunctionName](castParam, gl.TEXTURE_WRAP_T, wrapModeT);
		if (gl.TEXTURE_WRAP_R) gl[glFunctionName](castParam, gl.TEXTURE_WRAP_R, wrapModeR);
	}
	if (!firstCreation || style.magFilter !== "linear") gl[glFunctionName](castParam, gl.TEXTURE_MAG_FILTER, scaleModeToGlFilter[style.magFilter]);
	if (mipmaps) {
		if (!firstCreation || style.mipmapFilter !== "linear") {
			const glFilterMode = mipmapScaleModeToGlFilter[style.minFilter][style.mipmapFilter];
			gl[glFunctionName](castParam, gl.TEXTURE_MIN_FILTER, glFilterMode);
		}
	} else gl[glFunctionName](castParam, gl.TEXTURE_MIN_FILTER, scaleModeToGlFilter[style.minFilter]);
	if (anisotropicExt && style.maxAnisotropy > 1) {
		const level = Math.min(style.maxAnisotropy, gl.getParameter(anisotropicExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT));
		gl[glFunctionName](castParam, anisotropicExt.TEXTURE_MAX_ANISOTROPY_EXT, level);
	}
	if (style.compare) gl[glFunctionName](castParam, gl.TEXTURE_COMPARE_FUNC, compareModeToGlCompare[style.compare]);
}
var init_applyStyleParams = __esmMin((() => {
	init_pixiToGlMaps();
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/texture/utils/mapFormatToGlFormat.mjs
function mapFormatToGlFormat(gl) {
	return {
		r8unorm: gl.RED,
		r8snorm: gl.RED,
		r8uint: gl.RED,
		r8sint: gl.RED,
		r16uint: gl.RED,
		r16sint: gl.RED,
		r16float: gl.RED,
		rg8unorm: gl.RG,
		rg8snorm: gl.RG,
		rg8uint: gl.RG,
		rg8sint: gl.RG,
		r32uint: gl.RED,
		r32sint: gl.RED,
		r32float: gl.RED,
		rg16uint: gl.RG,
		rg16sint: gl.RG,
		rg16float: gl.RG,
		rgba8unorm: gl.RGBA,
		"rgba8unorm-srgb": gl.RGBA,
		rgba8snorm: gl.RGBA,
		rgba8uint: gl.RGBA,
		rgba8sint: gl.RGBA,
		bgra8unorm: gl.RGBA,
		"bgra8unorm-srgb": gl.RGBA,
		rgb9e5ufloat: gl.RGB,
		rgb10a2unorm: gl.RGBA,
		rg11b10ufloat: gl.RGB,
		rg32uint: gl.RG,
		rg32sint: gl.RG,
		rg32float: gl.RG,
		rgba16uint: gl.RGBA,
		rgba16sint: gl.RGBA,
		rgba16float: gl.RGBA,
		rgba32uint: gl.RGBA,
		rgba32sint: gl.RGBA,
		rgba32float: gl.RGBA,
		stencil8: gl.STENCIL_INDEX8,
		depth16unorm: gl.DEPTH_COMPONENT,
		depth24plus: gl.DEPTH_COMPONENT,
		"depth24plus-stencil8": gl.DEPTH_STENCIL,
		depth32float: gl.DEPTH_COMPONENT,
		"depth32float-stencil8": gl.DEPTH_STENCIL
	};
}
var init_mapFormatToGlFormat = __esmMin((() => {}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/texture/utils/mapFormatToGlInternalFormat.mjs
function mapFormatToGlInternalFormat(gl, extensions) {
	let srgb = {};
	let bgra8unorm = gl.RGBA;
	if (!(gl instanceof DOMAdapter.get().getWebGLRenderingContext())) {
		srgb = {
			"rgba8unorm-srgb": gl.SRGB8_ALPHA8,
			"bgra8unorm-srgb": gl.SRGB8_ALPHA8
		};
		bgra8unorm = gl.RGBA8;
	} else if (extensions.srgb) srgb = {
		"rgba8unorm-srgb": extensions.srgb.SRGB8_ALPHA8_EXT,
		"bgra8unorm-srgb": extensions.srgb.SRGB8_ALPHA8_EXT
	};
	return {
		r8unorm: gl.R8,
		r8snorm: gl.R8_SNORM,
		r8uint: gl.R8UI,
		r8sint: gl.R8I,
		r16uint: gl.R16UI,
		r16sint: gl.R16I,
		r16float: gl.R16F,
		rg8unorm: gl.RG8,
		rg8snorm: gl.RG8_SNORM,
		rg8uint: gl.RG8UI,
		rg8sint: gl.RG8I,
		r32uint: gl.R32UI,
		r32sint: gl.R32I,
		r32float: gl.R32F,
		rg16uint: gl.RG16UI,
		rg16sint: gl.RG16I,
		rg16float: gl.RG16F,
		rgba8unorm: gl.RGBA,
		...srgb,
		rgba8snorm: gl.RGBA8_SNORM,
		rgba8uint: gl.RGBA8UI,
		rgba8sint: gl.RGBA8I,
		bgra8unorm,
		rgb9e5ufloat: gl.RGB9_E5,
		rgb10a2unorm: gl.RGB10_A2,
		rg11b10ufloat: gl.R11F_G11F_B10F,
		rg32uint: gl.RG32UI,
		rg32sint: gl.RG32I,
		rg32float: gl.RG32F,
		rgba16uint: gl.RGBA16UI,
		rgba16sint: gl.RGBA16I,
		rgba16float: gl.RGBA16F,
		rgba32uint: gl.RGBA32UI,
		rgba32sint: gl.RGBA32I,
		rgba32float: gl.RGBA32F,
		stencil8: gl.STENCIL_INDEX8,
		depth16unorm: gl.DEPTH_COMPONENT16,
		depth24plus: gl.DEPTH_COMPONENT24,
		"depth24plus-stencil8": gl.DEPTH24_STENCIL8,
		depth32float: gl.DEPTH_COMPONENT32F,
		"depth32float-stencil8": gl.DEPTH32F_STENCIL8,
		...extensions.s3tc ? {
			"bc1-rgba-unorm": extensions.s3tc.COMPRESSED_RGBA_S3TC_DXT1_EXT,
			"bc2-rgba-unorm": extensions.s3tc.COMPRESSED_RGBA_S3TC_DXT3_EXT,
			"bc3-rgba-unorm": extensions.s3tc.COMPRESSED_RGBA_S3TC_DXT5_EXT
		} : {},
		...extensions.s3tc_sRGB ? {
			"bc1-rgba-unorm-srgb": extensions.s3tc_sRGB.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT,
			"bc2-rgba-unorm-srgb": extensions.s3tc_sRGB.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT,
			"bc3-rgba-unorm-srgb": extensions.s3tc_sRGB.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT
		} : {},
		...extensions.rgtc ? {
			"bc4-r-unorm": extensions.rgtc.COMPRESSED_RED_RGTC1_EXT,
			"bc4-r-snorm": extensions.rgtc.COMPRESSED_SIGNED_RED_RGTC1_EXT,
			"bc5-rg-unorm": extensions.rgtc.COMPRESSED_RED_GREEN_RGTC2_EXT,
			"bc5-rg-snorm": extensions.rgtc.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT
		} : {},
		...extensions.bptc ? {
			"bc6h-rgb-float": extensions.bptc.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT,
			"bc6h-rgb-ufloat": extensions.bptc.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT,
			"bc7-rgba-unorm": extensions.bptc.COMPRESSED_RGBA_BPTC_UNORM_EXT,
			"bc7-rgba-unorm-srgb": extensions.bptc.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT
		} : {},
		...extensions.etc ? {
			"etc2-rgb8unorm": extensions.etc.COMPRESSED_RGB8_ETC2,
			"etc2-rgb8unorm-srgb": extensions.etc.COMPRESSED_SRGB8_ETC2,
			"etc2-rgb8a1unorm": extensions.etc.COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2,
			"etc2-rgb8a1unorm-srgb": extensions.etc.COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2,
			"etc2-rgba8unorm": extensions.etc.COMPRESSED_RGBA8_ETC2_EAC,
			"etc2-rgba8unorm-srgb": extensions.etc.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC,
			"eac-r11unorm": extensions.etc.COMPRESSED_R11_EAC,
			"eac-rg11unorm": extensions.etc.COMPRESSED_SIGNED_RG11_EAC
		} : {},
		...extensions.astc ? {
			"astc-4x4-unorm": extensions.astc.COMPRESSED_RGBA_ASTC_4x4_KHR,
			"astc-4x4-unorm-srgb": extensions.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR,
			"astc-5x4-unorm": extensions.astc.COMPRESSED_RGBA_ASTC_5x4_KHR,
			"astc-5x4-unorm-srgb": extensions.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR,
			"astc-5x5-unorm": extensions.astc.COMPRESSED_RGBA_ASTC_5x5_KHR,
			"astc-5x5-unorm-srgb": extensions.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR,
			"astc-6x5-unorm": extensions.astc.COMPRESSED_RGBA_ASTC_6x5_KHR,
			"astc-6x5-unorm-srgb": extensions.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR,
			"astc-6x6-unorm": extensions.astc.COMPRESSED_RGBA_ASTC_6x6_KHR,
			"astc-6x6-unorm-srgb": extensions.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR,
			"astc-8x5-unorm": extensions.astc.COMPRESSED_RGBA_ASTC_8x5_KHR,
			"astc-8x5-unorm-srgb": extensions.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR,
			"astc-8x6-unorm": extensions.astc.COMPRESSED_RGBA_ASTC_8x6_KHR,
			"astc-8x6-unorm-srgb": extensions.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR,
			"astc-8x8-unorm": extensions.astc.COMPRESSED_RGBA_ASTC_8x8_KHR,
			"astc-8x8-unorm-srgb": extensions.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR,
			"astc-10x5-unorm": extensions.astc.COMPRESSED_RGBA_ASTC_10x5_KHR,
			"astc-10x5-unorm-srgb": extensions.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR,
			"astc-10x6-unorm": extensions.astc.COMPRESSED_RGBA_ASTC_10x6_KHR,
			"astc-10x6-unorm-srgb": extensions.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR,
			"astc-10x8-unorm": extensions.astc.COMPRESSED_RGBA_ASTC_10x8_KHR,
			"astc-10x8-unorm-srgb": extensions.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR,
			"astc-10x10-unorm": extensions.astc.COMPRESSED_RGBA_ASTC_10x10_KHR,
			"astc-10x10-unorm-srgb": extensions.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR,
			"astc-12x10-unorm": extensions.astc.COMPRESSED_RGBA_ASTC_12x10_KHR,
			"astc-12x10-unorm-srgb": extensions.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR,
			"astc-12x12-unorm": extensions.astc.COMPRESSED_RGBA_ASTC_12x12_KHR,
			"astc-12x12-unorm-srgb": extensions.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR
		} : {}
	};
}
var init_mapFormatToGlInternalFormat = __esmMin((() => {
	init_adapter();
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/texture/utils/mapFormatToGlType.mjs
function mapFormatToGlType(gl) {
	return {
		r8unorm: gl.UNSIGNED_BYTE,
		r8snorm: gl.BYTE,
		r8uint: gl.UNSIGNED_BYTE,
		r8sint: gl.BYTE,
		r16uint: gl.UNSIGNED_SHORT,
		r16sint: gl.SHORT,
		r16float: gl.HALF_FLOAT,
		rg8unorm: gl.UNSIGNED_BYTE,
		rg8snorm: gl.BYTE,
		rg8uint: gl.UNSIGNED_BYTE,
		rg8sint: gl.BYTE,
		r32uint: gl.UNSIGNED_INT,
		r32sint: gl.INT,
		r32float: gl.FLOAT,
		rg16uint: gl.UNSIGNED_SHORT,
		rg16sint: gl.SHORT,
		rg16float: gl.HALF_FLOAT,
		rgba8unorm: gl.UNSIGNED_BYTE,
		"rgba8unorm-srgb": gl.UNSIGNED_BYTE,
		rgba8snorm: gl.BYTE,
		rgba8uint: gl.UNSIGNED_BYTE,
		rgba8sint: gl.BYTE,
		bgra8unorm: gl.UNSIGNED_BYTE,
		"bgra8unorm-srgb": gl.UNSIGNED_BYTE,
		rgb9e5ufloat: gl.UNSIGNED_INT_5_9_9_9_REV,
		rgb10a2unorm: gl.UNSIGNED_INT_2_10_10_10_REV,
		rg11b10ufloat: gl.UNSIGNED_INT_10F_11F_11F_REV,
		rg32uint: gl.UNSIGNED_INT,
		rg32sint: gl.INT,
		rg32float: gl.FLOAT,
		rgba16uint: gl.UNSIGNED_SHORT,
		rgba16sint: gl.SHORT,
		rgba16float: gl.HALF_FLOAT,
		rgba32uint: gl.UNSIGNED_INT,
		rgba32sint: gl.INT,
		rgba32float: gl.FLOAT,
		stencil8: gl.UNSIGNED_BYTE,
		depth16unorm: gl.UNSIGNED_SHORT,
		depth24plus: gl.UNSIGNED_INT,
		"depth24plus-stencil8": gl.UNSIGNED_INT_24_8,
		depth32float: gl.FLOAT,
		"depth32float-stencil8": gl.FLOAT_32_UNSIGNED_INT_24_8_REV
	};
}
var init_mapFormatToGlType = __esmMin((() => {}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/texture/utils/mapViewDimensionToGlTarget.mjs
function mapViewDimensionToGlTarget(gl) {
	return {
		"2d": gl.TEXTURE_2D,
		cube: gl.TEXTURE_CUBE_MAP,
		"1d": null,
		"3d": gl?.TEXTURE_3D || null,
		"2d-array": gl?.TEXTURE_2D_ARRAY || null,
		"cube-array": gl?.TEXTURE_CUBE_MAP_ARRAY || null
	};
}
var init_mapViewDimensionToGlTarget = __esmMin((() => {}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/texture/GlTextureSystem.mjs
var BYTES_PER_PIXEL, _GlTextureSystem, GlTextureSystem;
var init_GlTextureSystem = __esmMin((() => {
	init_adapter();
	init_Extensions();
	init_GCManagedHash();
	init_Texture();
	init_GlTexture();
	init_glUploadBufferImageResource();
	init_glUploadCompressedTextureResource();
	init_glUploadCubeTextureResource();
	init_glUploadImageResource();
	init_glUploadVideoResource();
	init_applyStyleParams();
	init_mapFormatToGlFormat();
	init_mapFormatToGlInternalFormat();
	init_mapFormatToGlType();
	init_mapViewDimensionToGlTarget();
	BYTES_PER_PIXEL = 4;
	_GlTextureSystem = class _GlTextureSystem {
		constructor(renderer) {
			this._glSamplers = /* @__PURE__ */ Object.create(null);
			this._boundTextures = [];
			this._activeTextureLocation = -1;
			this._boundSamplers = /* @__PURE__ */ Object.create(null);
			this._premultiplyAlpha = false;
			this._useSeparateSamplers = false;
			this._renderer = renderer;
			this._managedTextures = new GCManagedHash({
				renderer,
				type: "resource",
				onUnload: this.onSourceUnload.bind(this),
				name: "glTexture"
			});
			const baseUploaders = {
				image: glUploadImageResource,
				buffer: glUploadBufferImageResource,
				video: glUploadVideoResource,
				compressed: glUploadCompressedTextureResource,
				..._GlTextureSystem.uploadExtensions
			};
			this._uploads = {
				...baseUploaders,
				cube: createGlUploadCubeTextureResource(baseUploaders)
			};
		}
		/**
		* @deprecated since 8.15.0
		*/
		get managedTextures() {
			return Object.values(this._managedTextures.items);
		}
		contextChange(gl) {
			this._gl = gl;
			if (!this._mapFormatToInternalFormat) {
				this._mapFormatToInternalFormat = mapFormatToGlInternalFormat(gl, this._renderer.context.extensions);
				this._mapFormatToType = mapFormatToGlType(gl);
				this._mapFormatToFormat = mapFormatToGlFormat(gl);
				this._mapViewDimensionToGlTarget = mapViewDimensionToGlTarget(gl);
			}
			this._managedTextures.removeAll(true);
			this._glSamplers = /* @__PURE__ */ Object.create(null);
			this._boundSamplers = /* @__PURE__ */ Object.create(null);
			this._premultiplyAlpha = false;
			for (let i = 0; i < 16; i++) this.bind(Texture.EMPTY, i);
		}
		/**
		* Initializes a texture source, if it has already been initialized nothing will happen.
		* @param source - The texture source to initialize.
		* @returns The initialized texture source.
		*/
		initSource(source) {
			this.bind(source);
		}
		bind(texture, location = 0) {
			const source = texture.source;
			if (texture) {
				this.bindSource(source, location);
				if (this._useSeparateSamplers) this._bindSampler(source.style, location);
			} else {
				this.bindSource(null, location);
				if (this._useSeparateSamplers) this._bindSampler(null, location);
			}
		}
		bindSource(source, location = 0) {
			const gl = this._gl;
			source._gcLastUsed = this._renderer.gc.now;
			if (this._boundTextures[location] !== source) {
				this._boundTextures[location] = source;
				this._activateLocation(location);
				source || (source = Texture.EMPTY.source);
				const glTexture = this.getGlSource(source);
				gl.bindTexture(glTexture.target, glTexture.texture);
			}
		}
		_bindSampler(style, location = 0) {
			const gl = this._gl;
			if (!style) {
				this._boundSamplers[location] = null;
				gl.bindSampler(location, null);
				return;
			}
			const sampler = this._getGlSampler(style);
			if (this._boundSamplers[location] !== sampler) {
				this._boundSamplers[location] = sampler;
				gl.bindSampler(location, sampler);
			}
		}
		unbind(texture) {
			const source = texture.source;
			const boundTextures = this._boundTextures;
			const gl = this._gl;
			for (let i = 0; i < boundTextures.length; i++) if (boundTextures[i] === source) {
				this._activateLocation(i);
				const glTexture = this.getGlSource(source);
				gl.bindTexture(glTexture.target, null);
				boundTextures[i] = null;
			}
		}
		_activateLocation(location) {
			if (this._activeTextureLocation !== location) {
				this._activeTextureLocation = location;
				this._gl.activeTexture(this._gl.TEXTURE0 + location);
			}
		}
		_initSource(source) {
			const gl = this._gl;
			const glTexture = new GlTexture(gl.createTexture());
			glTexture.type = this._mapFormatToType[source.format];
			glTexture.internalFormat = this._mapFormatToInternalFormat[source.format];
			glTexture.format = this._mapFormatToFormat[source.format];
			glTexture.target = this._mapViewDimensionToGlTarget[source.viewDimension];
			if (glTexture.target === null) throw new Error(`Unsupported view dimension: ${source.viewDimension} with this webgl version: ${this._renderer.context.webGLVersion}`);
			if (source.uploadMethodId === "cube") glTexture.target = gl.TEXTURE_CUBE_MAP;
			if (source.autoGenerateMipmaps && (this._renderer.context.supports.nonPowOf2mipmaps || source.isPowerOfTwo)) {
				const biggestDimension = Math.max(source.width, source.height);
				source.mipLevelCount = Math.floor(Math.log2(biggestDimension)) + 1;
			}
			source._gpuData[this._renderer.uid] = glTexture;
			if (this._managedTextures.add(source)) {
				source.on("update", this.onSourceUpdate, this);
				source.on("resize", this.onSourceUpdate, this);
				source.on("styleChange", this.onStyleChange, this);
				source.on("updateMipmaps", this.onUpdateMipmaps, this);
			}
			this.onSourceUpdate(source);
			this.updateStyle(source, false);
			return glTexture;
		}
		onStyleChange(source) {
			this.updateStyle(source, false);
		}
		updateStyle(source, firstCreation) {
			const gl = this._gl;
			const glTexture = this.getGlSource(source);
			gl.bindTexture(glTexture.target, glTexture.texture);
			this._boundTextures[this._activeTextureLocation] = source;
			applyStyleParams(source.style, gl, source.mipLevelCount > 1, this._renderer.context.extensions.anisotropicFiltering, "texParameteri", glTexture.target, !this._renderer.context.supports.nonPowOf2wrapping && !source.isPowerOfTwo, firstCreation);
		}
		onSourceUnload(source, contextLost = false) {
			const glTexture = source._gpuData[this._renderer.uid];
			if (!glTexture) return;
			if (!contextLost) {
				this.unbind(source);
				this._gl.deleteTexture(glTexture.texture);
			}
			source.off("update", this.onSourceUpdate, this);
			source.off("resize", this.onSourceUpdate, this);
			source.off("styleChange", this.onStyleChange, this);
			source.off("updateMipmaps", this.onUpdateMipmaps, this);
		}
		onSourceUpdate(source) {
			const gl = this._gl;
			const glTexture = this.getGlSource(source);
			gl.bindTexture(glTexture.target, glTexture.texture);
			this._boundTextures[this._activeTextureLocation] = source;
			const premultipliedAlpha = source.alphaMode === "premultiply-alpha-on-upload";
			if (this._premultiplyAlpha !== premultipliedAlpha) {
				this._premultiplyAlpha = premultipliedAlpha;
				gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premultipliedAlpha);
			}
			if (this._uploads[source.uploadMethodId]) this._uploads[source.uploadMethodId].upload(source, glTexture, gl, this._renderer.context.webGLVersion);
			else if (glTexture.target === gl.TEXTURE_2D) this._initEmptyTexture2D(glTexture, source);
			else if (glTexture.target === gl.TEXTURE_2D_ARRAY) this._initEmptyTexture2DArray(glTexture, source);
			else if (glTexture.target === gl.TEXTURE_CUBE_MAP) this._initEmptyTextureCube(glTexture, source);
			else throw new Error("[GlTextureSystem] Unsupported texture target for empty allocation.");
			this._applyMipRange(glTexture, source);
			if (source.autoGenerateMipmaps && source.mipLevelCount > 1) this.onUpdateMipmaps(source, false);
		}
		onUpdateMipmaps(source, bind = true) {
			if (bind) this.bindSource(source, 0);
			const glTexture = this.getGlSource(source);
			this._gl.generateMipmap(glTexture.target);
		}
		_initEmptyTexture2D(glTexture, source) {
			const gl = this._gl;
			gl.texImage2D(gl.TEXTURE_2D, 0, glTexture.internalFormat, source.pixelWidth, source.pixelHeight, 0, glTexture.format, glTexture.type, null);
			let w = Math.max(source.pixelWidth >> 1, 1);
			let h = Math.max(source.pixelHeight >> 1, 1);
			for (let level = 1; level < source.mipLevelCount; level++) {
				gl.texImage2D(gl.TEXTURE_2D, level, glTexture.internalFormat, w, h, 0, glTexture.format, glTexture.type, null);
				w = Math.max(w >> 1, 1);
				h = Math.max(h >> 1, 1);
			}
		}
		_initEmptyTexture2DArray(glTexture, source) {
			if (this._renderer.context.webGLVersion !== 2) throw new Error("[GlTextureSystem] TEXTURE_2D_ARRAY requires WebGL2.");
			const gl2 = this._gl;
			const depth = Math.max(source.arrayLayerCount | 0, 1);
			gl2.texImage3D(gl2.TEXTURE_2D_ARRAY, 0, glTexture.internalFormat, source.pixelWidth, source.pixelHeight, depth, 0, glTexture.format, glTexture.type, null);
			let w = Math.max(source.pixelWidth >> 1, 1);
			let h = Math.max(source.pixelHeight >> 1, 1);
			for (let level = 1; level < source.mipLevelCount; level++) {
				gl2.texImage3D(gl2.TEXTURE_2D_ARRAY, level, glTexture.internalFormat, w, h, depth, 0, glTexture.format, glTexture.type, null);
				w = Math.max(w >> 1, 1);
				h = Math.max(h >> 1, 1);
			}
		}
		_initEmptyTextureCube(glTexture, source) {
			const gl = this._gl;
			const totalCubeFaces = 6;
			for (let face = 0; face < totalCubeFaces; face++) gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + face, 0, glTexture.internalFormat, source.pixelWidth, source.pixelHeight, 0, glTexture.format, glTexture.type, null);
			let w = Math.max(source.pixelWidth >> 1, 1);
			let h = Math.max(source.pixelHeight >> 1, 1);
			for (let level = 1; level < source.mipLevelCount; level++) {
				for (let face = 0; face < totalCubeFaces; face++) gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + face, level, glTexture.internalFormat, w, h, 0, glTexture.format, glTexture.type, null);
				w = Math.max(w >> 1, 1);
				h = Math.max(h >> 1, 1);
			}
		}
		/**
		* Applies a mip range to the currently-bound texture so WebGL2 considers the texture "mipmap complete"
		* for the declared `mipLevelCount` (especially important for partial mip chains rendered via FBO).
		* @param glTexture - The GL texture wrapper.
		* @param source - The texture source describing mipLevelCount.
		*/
		_applyMipRange(glTexture, source) {
			if (this._renderer.context.webGLVersion !== 2) return;
			if (source.mipLevelCount <= 1) return;
			const gl = this._gl;
			const maxLevel = Math.max((source.mipLevelCount | 0) - 1, 0);
			gl.texParameteri(glTexture.target, gl.TEXTURE_BASE_LEVEL, 0);
			gl.texParameteri(glTexture.target, gl.TEXTURE_MAX_LEVEL, maxLevel);
		}
		_initSampler(style) {
			const gl = this._gl;
			const glSampler = this._gl.createSampler();
			this._glSamplers[style._resourceId] = glSampler;
			applyStyleParams(style, gl, this._boundTextures[this._activeTextureLocation].mipLevelCount > 1, this._renderer.context.extensions.anisotropicFiltering, "samplerParameteri", glSampler, false, true);
			return this._glSamplers[style._resourceId];
		}
		_getGlSampler(sampler) {
			return this._glSamplers[sampler._resourceId] || this._initSampler(sampler);
		}
		getGlSource(source) {
			source._gcLastUsed = this._renderer.gc.now;
			return source._gpuData[this._renderer.uid] || this._initSource(source);
		}
		generateCanvas(texture) {
			const { pixels, width, height } = this.getPixels(texture);
			const canvas = DOMAdapter.get().createCanvas();
			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext("2d");
			if (ctx) {
				const imageData = ctx.createImageData(width, height);
				imageData.data.set(pixels);
				ctx.putImageData(imageData, 0, 0);
			}
			return canvas;
		}
		getPixels(texture) {
			const resolution = texture.source.resolution;
			const frame = texture.frame;
			const width = Math.max(Math.round(frame.width * resolution), 1);
			const height = Math.max(Math.round(frame.height * resolution), 1);
			const pixels = new Uint8Array(BYTES_PER_PIXEL * width * height);
			const renderer = this._renderer;
			const renderTarget = renderer.renderTarget.getRenderTarget(texture);
			const glRenterTarget = renderer.renderTarget.getGpuRenderTarget(renderTarget);
			const gl = renderer.gl;
			gl.bindFramebuffer(gl.FRAMEBUFFER, glRenterTarget.resolveTargetFramebuffer);
			gl.readPixels(Math.round(frame.x * resolution), Math.round(frame.y * resolution), width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
			return {
				pixels: new Uint8ClampedArray(pixels.buffer),
				width,
				height
			};
		}
		destroy() {
			this._managedTextures.destroy();
			this._glSamplers = null;
			this._boundTextures = null;
			this._boundSamplers = null;
			this._mapFormatToInternalFormat = null;
			this._mapFormatToType = null;
			this._mapFormatToFormat = null;
			this._uploads = null;
			this._renderer = null;
		}
		resetState() {
			this._activeTextureLocation = -1;
			this._boundTextures.fill(Texture.EMPTY.source);
			this._boundSamplers = /* @__PURE__ */ Object.create(null);
			const gl = this._gl;
			this._premultiplyAlpha = false;
			gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, this._premultiplyAlpha);
		}
	};
	/** @ignore */
	_GlTextureSystem.extension = {
		type: [ExtensionType.WebGLSystem],
		name: "texture"
	};
	/**
	* Optional uploaders registered via {@link ExtensionType.TextureUploaderWebGL}. Each entry is
	* merged into {@link _uploads} at construction time, so import order matters: register the
	* extension before creating the renderer.
	* @internal
	*/
	_GlTextureSystem.uploadExtensions = /* @__PURE__ */ Object.create(null);
	GlTextureSystem = _GlTextureSystem;
	extensions.handleByMap(ExtensionType.TextureUploaderWebGL, GlTextureSystem.uploadExtensions);
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/scene/graphics/gl/GlGraphicsAdaptor.mjs
var GlGraphicsAdaptor;
var init_GlGraphicsAdaptor = __esmMin((() => {
	init_Extensions();
	init_Matrix();
	init_compileHighShaderToProgram();
	init_colorBit();
	init_generateTextureBatchBit();
	init_localUniformBit();
	init_roundPixelsBit();
	init_getBatchSamplersUniformGroup();
	init_Shader();
	init_UniformGroup();
	GlGraphicsAdaptor = class {
		contextChange(renderer) {
			const uniforms = new UniformGroup({
				uColor: {
					value: new Float32Array([
						1,
						1,
						1,
						1
					]),
					type: "vec4<f32>"
				},
				uTransformMatrix: {
					value: new Matrix(),
					type: "mat3x3<f32>"
				},
				uRound: {
					value: 0,
					type: "f32"
				}
			});
			const maxTextures = renderer.limits.maxBatchableTextures;
			const glProgram = compileHighShaderGlProgram({
				name: "graphics",
				bits: [
					colorBitGl,
					generateTextureBatchBitGl(maxTextures),
					localUniformBitGl,
					roundPixelsBitGl
				]
			});
			this.shader = new Shader({
				glProgram,
				resources: {
					localUniforms: uniforms,
					batchSamplers: getBatchSamplersUniformGroup(maxTextures)
				}
			});
		}
		execute(graphicsPipe, renderable) {
			const context = renderable.context;
			const shader = context.customShader || this.shader;
			const renderer = graphicsPipe.renderer;
			const { batcher, instructions } = renderer.graphicsContext.getContextRenderData(context);
			shader.groups[0] = renderer.globalUniforms.bindGroup;
			renderer.state.set(graphicsPipe.state);
			renderer.shader.bind(shader);
			renderer.geometry.bind(batcher.geometry, shader.glProgram);
			const batches = instructions.instructions;
			for (let i = 0; i < instructions.instructionSize; i++) {
				const batch = batches[i];
				if (batch.size) {
					for (let j = 0; j < batch.textures.count; j++) renderer.texture.bind(batch.textures.textures[j], j);
					renderer.geometry.draw(batch.topology, batch.size, batch.start);
				}
			}
		}
		destroy() {
			this.shader.destroy(true);
			this.shader = null;
		}
	};
	/** @ignore */
	GlGraphicsAdaptor.extension = {
		type: [ExtensionType.WebGLPipesAdaptor],
		name: "graphics"
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/scene/mesh/gl/GlMeshAdaptor.mjs
var GlMeshAdaptor;
var init_GlMeshAdaptor = __esmMin((() => {
	init_Extensions();
	init_Matrix();
	init_compileHighShaderToProgram();
	init_localUniformBit();
	init_roundPixelsBit();
	init_textureBit();
	init_Shader();
	init_Texture();
	init_warn();
	GlMeshAdaptor = class {
		init() {
			const glProgram = compileHighShaderGlProgram({
				name: "mesh",
				bits: [
					localUniformBitGl,
					textureBitGl,
					roundPixelsBitGl
				]
			});
			this._shader = new Shader({
				glProgram,
				resources: {
					uTexture: Texture.EMPTY.source,
					textureUniforms: { uTextureMatrix: {
						type: "mat3x3<f32>",
						value: new Matrix()
					} }
				}
			});
		}
		execute(meshPipe, mesh) {
			const renderer = meshPipe.renderer;
			let shader = mesh._shader;
			if (!shader) {
				shader = this._shader;
				const texture = mesh.texture;
				const source = texture.source;
				shader.resources.uTexture = source;
				shader.resources.uSampler = source.style;
				shader.resources.textureUniforms.uniforms.uTextureMatrix = texture.textureMatrix.mapCoord;
			} else if (!shader.glProgram) {
				warn("Mesh shader has no glProgram", mesh.shader);
				return;
			}
			shader.groups[100] = renderer.globalUniforms.bindGroup;
			shader.groups[101] = meshPipe.localUniformsBindGroup;
			renderer.encoder.draw({
				geometry: mesh._geometry,
				shader,
				state: mesh.state
			});
		}
		destroy() {
			this._shader.destroy(true);
			this._shader = null;
		}
	};
	GlMeshAdaptor.extension = {
		type: [ExtensionType.WebGLPipesAdaptor],
		name: "mesh"
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gl/WebGLRenderer.mjs
var WebGLRenderer_exports = /* @__PURE__ */ __exportAll({ WebGLRenderer: () => WebGLRenderer });
var DefaultWebGLSystems, DefaultWebGLPipes, DefaultWebGLAdapters, systems$1, renderPipes$1, renderPipeAdaptors$1, WebGLRenderer;
var init_WebGLRenderer = __esmMin((() => {
	init_Extensions();
	init_GlGraphicsAdaptor();
	init_GlMeshAdaptor();
	init_GlBatchAdaptor();
	init_AbstractRenderer();
	init_SharedSystems();
	init_types();
	init_GlBufferSystem();
	init_GlContextSystem();
	init_GlGeometrySystem();
	init_GlBackBufferSystem();
	init_GlColorMaskSystem();
	init_GlEncoderSystem();
	init_GlLimitsSystem();
	init_GlStencilSystem();
	init_GlUboSystem();
	init_GlRenderTargetSystem();
	init_GlShaderSystem();
	init_GlUniformGroupSystem();
	init_GlStateSystem();
	init_GlTextureSystem();
	DefaultWebGLSystems = [
		...SharedSystems,
		GlUboSystem,
		GlBackBufferSystem,
		GlContextSystem,
		GlLimitsSystem,
		GlBufferSystem,
		GlTextureSystem,
		GlRenderTargetSystem,
		GlGeometrySystem,
		GlUniformGroupSystem,
		GlShaderSystem,
		GlEncoderSystem,
		GlStateSystem,
		GlStencilSystem,
		GlColorMaskSystem
	];
	DefaultWebGLPipes = [...SharedRenderPipes];
	DefaultWebGLAdapters = [
		GlBatchAdaptor,
		GlMeshAdaptor,
		GlGraphicsAdaptor
	];
	systems$1 = [];
	renderPipes$1 = [];
	renderPipeAdaptors$1 = [];
	extensions.handleByNamedList(ExtensionType.WebGLSystem, systems$1);
	extensions.handleByNamedList(ExtensionType.WebGLPipes, renderPipes$1);
	extensions.handleByNamedList(ExtensionType.WebGLPipesAdaptor, renderPipeAdaptors$1);
	extensions.add(...DefaultWebGLSystems, ...DefaultWebGLPipes, ...DefaultWebGLAdapters);
	WebGLRenderer = class extends AbstractRenderer {
		constructor() {
			const systemConfig = {
				name: "webgl",
				type: RendererType.WEBGL,
				systems: systems$1,
				renderPipes: renderPipes$1,
				renderPipeAdaptors: renderPipeAdaptors$1
			};
			super(systemConfig);
		}
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gpu/BindGroupSystem.mjs
var BindGroupSystem;
var init_BindGroupSystem = __esmMin((() => {
	init_Extensions();
	BindGroupSystem = class {
		constructor(renderer) {
			this._hash = /* @__PURE__ */ Object.create(null);
			this._renderer = renderer;
		}
		contextChange(gpu) {
			this._gpu = gpu;
		}
		getBindGroup(bindGroup, program, groupIndex) {
			bindGroup._updateKey();
			return this._hash[bindGroup._key] || this._createBindGroup(bindGroup, program, groupIndex);
		}
		_createBindGroup(group, program, groupIndex) {
			const device = this._gpu.device;
			const groupLayout = program.layout[groupIndex];
			const entries = [];
			const renderer = this._renderer;
			for (const j in groupLayout) {
				const resource = group.resources[j] ?? group.resources[groupLayout[j]];
				let gpuResource;
				if (resource._resourceType === "uniformGroup") {
					const uniformGroup = resource;
					renderer.ubo.updateUniformGroup(uniformGroup);
					const buffer = uniformGroup.buffer;
					gpuResource = {
						buffer: renderer.buffer.getGPUBuffer(buffer),
						offset: 0,
						size: buffer.descriptor.size
					};
				} else if (resource._resourceType === "buffer") {
					const buffer = resource;
					gpuResource = {
						buffer: renderer.buffer.getGPUBuffer(buffer),
						offset: 0,
						size: buffer.descriptor.size
					};
				} else if (resource._resourceType === "bufferResource") {
					const bufferResource = resource;
					gpuResource = {
						buffer: renderer.buffer.getGPUBuffer(bufferResource.buffer),
						offset: bufferResource.offset,
						size: bufferResource.size
					};
				} else if (resource._resourceType === "textureSampler") {
					const sampler = resource;
					gpuResource = renderer.texture.getGpuSampler(sampler);
				} else if (resource._resourceType === "textureSource") {
					const texture = resource;
					gpuResource = renderer.texture.getTextureView(texture);
				}
				entries.push({
					binding: groupLayout[j],
					resource: gpuResource
				});
			}
			const layout = renderer.shader.getProgramData(program).bindGroups[groupIndex];
			const gpuBindGroup = device.createBindGroup({
				layout,
				entries
			});
			this._hash[group._key] = gpuBindGroup;
			return gpuBindGroup;
		}
		destroy() {
			this._hash = null;
			this._renderer = null;
		}
	};
	/** @ignore */
	BindGroupSystem.extension = {
		type: [ExtensionType.WebGPUSystem],
		name: "bindGroup"
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gpu/buffer/GpuBufferSystem.mjs
var GpuBufferData, GpuBufferSystem;
var init_GpuBufferSystem = __esmMin((() => {
	init_Extensions();
	init_GCManagedHash();
	init_uid();
	init_fastCopy();
	GpuBufferData = class {
		constructor(gpuBuffer) {
			this.gpuBuffer = gpuBuffer;
		}
		destroy() {
			this.gpuBuffer.destroy();
			this.gpuBuffer = null;
		}
	};
	GpuBufferSystem = class {
		constructor(renderer) {
			this._renderer = renderer;
			this._managedBuffers = new GCManagedHash({
				renderer,
				type: "resource",
				onUnload: this.onBufferUnload.bind(this),
				name: "gpuBuffer"
			});
		}
		contextChange(gpu) {
			this._gpu = gpu;
		}
		getGPUBuffer(buffer) {
			buffer._gcLastUsed = this._renderer.gc.now;
			return buffer._gpuData[this._renderer.uid]?.gpuBuffer || this.createGPUBuffer(buffer);
		}
		updateBuffer(buffer) {
			const gpuBuffer = this.getGPUBuffer(buffer);
			const data = buffer.data;
			if (buffer._updateID && data) {
				buffer._updateID = 0;
				this._gpu.device.queue.writeBuffer(gpuBuffer, 0, data.buffer, 0, (buffer._updateSize || data.byteLength) + 3 & -4);
			}
			return gpuBuffer;
		}
		/** dispose all WebGL resources of all managed buffers */
		destroyAll() {
			this._managedBuffers.removeAll();
		}
		onBufferUnload(buffer) {
			buffer.off("update", this.updateBuffer, this);
			buffer.off("change", this.onBufferChange, this);
		}
		createGPUBuffer(buffer) {
			const gpuBuffer = this._gpu.device.createBuffer(buffer.descriptor);
			buffer._updateID = 0;
			buffer._resourceId = uid("resource");
			if (buffer.data) {
				fastCopy(buffer.data.buffer, gpuBuffer.getMappedRange(), buffer.data.byteOffset, buffer.data.byteLength);
				gpuBuffer.unmap();
			}
			buffer._gpuData[this._renderer.uid] = new GpuBufferData(gpuBuffer);
			if (this._managedBuffers.add(buffer)) {
				buffer.on("update", this.updateBuffer, this);
				buffer.on("change", this.onBufferChange, this);
			}
			return gpuBuffer;
		}
		onBufferChange(buffer) {
			this._managedBuffers.remove(buffer);
			buffer._updateID = 0;
			this.createGPUBuffer(buffer);
		}
		destroy() {
			this._managedBuffers.destroy();
			this._renderer = null;
			this._gpu = null;
		}
	};
	/** @ignore */
	GpuBufferSystem.extension = {
		type: [ExtensionType.WebGPUSystem],
		name: "buffer"
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gpu/buffer/UboBatch.mjs
var UboBatch;
var init_UboBatch = __esmMin((() => {
	UboBatch = class {
		constructor({ minUniformOffsetAlignment }) {
			this._minUniformOffsetAlignment = 256;
			this.byteIndex = 0;
			this._minUniformOffsetAlignment = minUniformOffsetAlignment;
			this.data = /* @__PURE__ */ new Float32Array(65535);
		}
		clear() {
			this.byteIndex = 0;
		}
		addEmptyGroup(size) {
			if (size > this._minUniformOffsetAlignment / 4) throw new Error(`UniformBufferBatch: array is too large: ${size * 4}`);
			const start = this.byteIndex;
			let newSize = start + size * 4;
			newSize = Math.ceil(newSize / this._minUniformOffsetAlignment) * this._minUniformOffsetAlignment;
			if (newSize > this.data.length * 4) throw new Error("UniformBufferBatch: ubo batch got too big");
			this.byteIndex = newSize;
			return start;
		}
		addGroup(array) {
			const offset = this.addEmptyGroup(array.length);
			for (let i = 0; i < array.length; i++) this.data[offset / 4 + i] = array[i];
			return offset;
		}
		destroy() {
			this.data = null;
		}
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gpu/GpuColorMaskSystem.mjs
var GpuColorMaskSystem;
var init_GpuColorMaskSystem = __esmMin((() => {
	init_Extensions();
	GpuColorMaskSystem = class {
		constructor(renderer) {
			this._colorMaskCache = 15;
			this._renderer = renderer;
		}
		setMask(colorMask) {
			if (this._colorMaskCache === colorMask) return;
			this._colorMaskCache = colorMask;
			this._renderer.pipeline.setColorMask(colorMask);
		}
		destroy() {
			this._renderer = null;
			this._colorMaskCache = null;
		}
	};
	/** @ignore */
	GpuColorMaskSystem.extension = {
		type: [ExtensionType.WebGPUSystem],
		name: "colorMask"
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gpu/GpuDeviceSystem.mjs
var GpuDeviceSystem;
var init_GpuDeviceSystem = __esmMin((() => {
	init_adapter();
	init_Extensions();
	GpuDeviceSystem = class {
		/**
		* @param {WebGPURenderer} renderer - The renderer this System works for.
		*/
		constructor(renderer) {
			this._renderer = renderer;
		}
		async init(options) {
			if (this._initPromise) return this._initPromise;
			this._initPromise = (options.gpu ? Promise.resolve(options.gpu) : this._createDeviceAndAdaptor(options)).then((gpu) => {
				this.gpu = gpu;
				this.extensions = { transientAttachment: typeof GPUTextureUsage.TRANSIENT_ATTACHMENT === "number" };
				this._renderer.runners.contextChange.emit(this.gpu);
			});
			return this._initPromise;
		}
		/**
		* Handle the context change event
		* @param gpu
		*/
		contextChange(gpu) {
			this._renderer.gpu = gpu;
		}
		/**
		* Helper class to create a WebGL Context
		* @param {object} options - An options object that gets passed in to the canvas element containing the
		*    context attributes
		* @see https://developer.mozilla.org/en/docs/Web/API/HTMLCanvasElement/getContext
		* @returns {WebGLRenderingContext} the WebGL context
		*/
		async _createDeviceAndAdaptor(options) {
			const adapter = await DOMAdapter.get().getNavigator().gpu.requestAdapter({
				powerPreference: options.powerPreference,
				forceFallbackAdapter: options.forceFallbackAdapter
			});
			const requiredFeatures = [
				"texture-compression-bc",
				"texture-compression-astc",
				"texture-compression-etc2"
			].filter((feature) => adapter.features.has(feature));
			return {
				adapter,
				device: await adapter.requestDevice({ requiredFeatures })
			};
		}
		destroy() {
			this.gpu = null;
			this.extensions = null;
			this._renderer = null;
		}
	};
	/** @ignore */
	GpuDeviceSystem.extension = {
		type: [ExtensionType.WebGPUSystem],
		name: "device"
	};
	/** The default options for the GpuDeviceSystem. */
	GpuDeviceSystem.defaultOptions = {
		/**
		* {@link WebGPUOptions.powerPreference}
		* @default default
		*/
		powerPreference: void 0,
		/**
		* Force the use of the fallback adapter
		* @default false
		*/
		forceFallbackAdapter: false
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gpu/GpuEncoderSystem.mjs
var GpuEncoderSystem;
var init_GpuEncoderSystem = __esmMin((() => {
	init_Extensions();
	GpuEncoderSystem = class {
		constructor(renderer) {
			this._boundBindGroup = /* @__PURE__ */ Object.create(null);
			this._boundVertexBuffer = /* @__PURE__ */ Object.create(null);
			this._renderer = renderer;
		}
		renderStart() {
			this.commandFinished = new Promise((resolve) => {
				this._resolveCommandFinished = resolve;
			});
			this.commandEncoder = this._renderer.gpu.device.createCommandEncoder();
		}
		beginRenderPass(gpuRenderTarget) {
			this.endRenderPass();
			this._clearCache();
			this.renderPassEncoder = this.commandEncoder.beginRenderPass(gpuRenderTarget.descriptor);
		}
		endRenderPass() {
			if (this.renderPassEncoder) this.renderPassEncoder.end();
			this.renderPassEncoder = null;
		}
		setViewport(viewport) {
			this.renderPassEncoder.setViewport(viewport.x, viewport.y, viewport.width, viewport.height, 0, 1);
		}
		setPipelineFromGeometryProgramAndState(geometry, program, state, topology) {
			const pipeline = this._renderer.pipeline.getPipeline(geometry, program, state, topology);
			this.setPipeline(pipeline);
		}
		setPipeline(pipeline) {
			if (this._boundPipeline === pipeline) return;
			this._boundPipeline = pipeline;
			this.renderPassEncoder.setPipeline(pipeline);
		}
		_setVertexBuffer(index, buffer) {
			if (this._boundVertexBuffer[index] === buffer) return;
			this._boundVertexBuffer[index] = buffer;
			this.renderPassEncoder.setVertexBuffer(index, this._renderer.buffer.updateBuffer(buffer));
		}
		_setIndexBuffer(buffer) {
			if (this._boundIndexBuffer === buffer) return;
			this._boundIndexBuffer = buffer;
			const indexFormat = buffer.data.BYTES_PER_ELEMENT === 2 ? "uint16" : "uint32";
			this.renderPassEncoder.setIndexBuffer(this._renderer.buffer.updateBuffer(buffer), indexFormat);
		}
		resetBindGroup(index) {
			this._boundBindGroup[index] = null;
		}
		setBindGroup(index, bindGroup, program) {
			if (this._boundBindGroup[index] === bindGroup) return;
			this._boundBindGroup[index] = bindGroup;
			bindGroup._touch(this._renderer.gc.now, this._renderer.tick);
			const gpuBindGroup = this._renderer.bindGroup.getBindGroup(bindGroup, program, index);
			this.renderPassEncoder.setBindGroup(index, gpuBindGroup);
		}
		setGeometry(geometry, program) {
			const buffersToBind = this._renderer.pipeline.getBufferNamesToBind(geometry, program);
			for (const i in buffersToBind) this._setVertexBuffer(parseInt(i, 10), geometry.attributes[buffersToBind[i]].buffer);
			if (geometry.indexBuffer) this._setIndexBuffer(geometry.indexBuffer);
		}
		_setShaderBindGroups(shader, skipSync) {
			for (const i in shader.groups) {
				const bindGroup = shader.groups[i];
				if (!skipSync) this._syncBindGroup(bindGroup);
				this.setBindGroup(i, bindGroup, shader.gpuProgram);
			}
		}
		_syncBindGroup(bindGroup) {
			for (const j in bindGroup.resources) {
				const resource = bindGroup.resources[j];
				if (resource.isUniformGroup) this._renderer.ubo.updateUniformGroup(resource);
			}
		}
		draw(options) {
			const { geometry, shader, state, topology, size, start, instanceCount, skipSync } = options;
			this.setPipelineFromGeometryProgramAndState(geometry, shader.gpuProgram, state, topology);
			this.setGeometry(geometry, shader.gpuProgram);
			this._setShaderBindGroups(shader, skipSync);
			if (geometry.indexBuffer) this.renderPassEncoder.drawIndexed(size || geometry.indexBuffer.data.length, instanceCount ?? geometry.instanceCount, start || 0);
			else this.renderPassEncoder.draw(size || geometry.getSize(), instanceCount ?? geometry.instanceCount, start || 0);
		}
		finishRenderPass() {
			if (this.renderPassEncoder) {
				this.renderPassEncoder.end();
				this.renderPassEncoder = null;
			}
		}
		postrender() {
			this.finishRenderPass();
			this._gpu.device.queue.submit([this.commandEncoder.finish()]);
			this._resolveCommandFinished();
			this.commandEncoder = null;
		}
		restoreRenderPass() {
			const descriptor = this._renderer.renderTarget.adaptor.getDescriptor(this._renderer.renderTarget.renderTarget, false, [
				0,
				0,
				0,
				1
			], this._renderer.renderTarget.mipLevel, this._renderer.renderTarget.layer);
			this.renderPassEncoder = this.commandEncoder.beginRenderPass(descriptor);
			const boundPipeline = this._boundPipeline;
			const boundVertexBuffer = { ...this._boundVertexBuffer };
			const boundIndexBuffer = this._boundIndexBuffer;
			const boundBindGroup = { ...this._boundBindGroup };
			this._clearCache();
			const viewport = this._renderer.renderTarget.viewport;
			this.renderPassEncoder.setViewport(viewport.x, viewport.y, viewport.width, viewport.height, 0, 1);
			this.setPipeline(boundPipeline);
			for (const i in boundVertexBuffer) this._setVertexBuffer(i, boundVertexBuffer[i]);
			for (const i in boundBindGroup) this.setBindGroup(i, boundBindGroup[i], null);
			this._setIndexBuffer(boundIndexBuffer);
		}
		_clearCache() {
			for (let i = 0; i < 16; i++) {
				this._boundBindGroup[i] = null;
				this._boundVertexBuffer[i] = null;
			}
			this._boundIndexBuffer = null;
			this._boundPipeline = null;
		}
		destroy() {
			this._renderer = null;
			this._gpu = null;
			this._boundBindGroup = null;
			this._boundVertexBuffer = null;
			this._boundIndexBuffer = null;
			this._boundPipeline = null;
		}
		contextChange(gpu) {
			this._gpu = gpu;
		}
	};
	/** @ignore */
	GpuEncoderSystem.extension = {
		type: [ExtensionType.WebGPUSystem],
		name: "encoder",
		priority: 1
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gpu/GpuLimitsSystem.mjs
var GpuLimitsSystem;
var init_GpuLimitsSystem = __esmMin((() => {
	init_Extensions();
	GpuLimitsSystem = class {
		constructor(renderer) {
			this._renderer = renderer;
		}
		contextChange() {
			this.maxTextures = this._renderer.device.gpu.device.limits.maxSampledTexturesPerShaderStage;
			this.maxBatchableTextures = this.maxTextures;
		}
		destroy() {}
	};
	/** @ignore */
	GpuLimitsSystem.extension = {
		type: [ExtensionType.WebGPUSystem],
		name: "limits"
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gpu/GpuStencilSystem.mjs
var GpuStencilSystem;
var init_GpuStencilSystem = __esmMin((() => {
	init_Extensions();
	init_const$4();
	GpuStencilSystem = class {
		constructor(renderer) {
			this._renderTargetStencilState = /* @__PURE__ */ Object.create(null);
			this._renderer = renderer;
			renderer.renderTarget.onRenderTargetChange.add(this);
		}
		onRenderTargetChange(renderTarget) {
			let stencilState = this._renderTargetStencilState[renderTarget.uid];
			if (!stencilState) stencilState = this._renderTargetStencilState[renderTarget.uid] = {
				stencilMode: STENCIL_MODES.DISABLED,
				stencilReference: 0
			};
			this._activeRenderTarget = renderTarget;
			this.setStencilMode(stencilState.stencilMode, stencilState.stencilReference);
		}
		setStencilMode(stencilMode, stencilReference) {
			const stencilState = this._renderTargetStencilState[this._activeRenderTarget.uid];
			stencilState.stencilMode = stencilMode;
			stencilState.stencilReference = stencilReference;
			const renderer = this._renderer;
			renderer.pipeline.setStencilMode(stencilMode);
			renderer.encoder.renderPassEncoder.setStencilReference(stencilReference);
		}
		destroy() {
			this._renderer.renderTarget.onRenderTargetChange.remove(this);
			this._renderer = null;
			this._activeRenderTarget = null;
			this._renderTargetStencilState = null;
		}
	};
	/** @ignore */
	GpuStencilSystem.extension = {
		type: [ExtensionType.WebGPUSystem],
		name: "stencil"
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/utils/createUboElementsWGSL.mjs
function createUboElementsWGSL(uniformData) {
	const uboElements = uniformData.map((data) => ({
		data,
		offset: 0,
		size: 0
	}));
	let offset = 0;
	for (let i = 0; i < uboElements.length; i++) {
		const uboElement = uboElements[i];
		let size = WGSL_ALIGN_SIZE_DATA[uboElement.data.type].size;
		const align = WGSL_ALIGN_SIZE_DATA[uboElement.data.type].align;
		if (!WGSL_ALIGN_SIZE_DATA[uboElement.data.type]) throw new Error(`[Pixi.js] WebGPU UniformBuffer: Unknown type ${uboElement.data.type}`);
		if (uboElement.data.size > 1) size = Math.max(size, align) * uboElement.data.size;
		offset = Math.ceil(offset / align) * align;
		uboElement.size = size;
		uboElement.offset = offset;
		offset += size;
	}
	offset = Math.ceil(offset / 16) * 16;
	return {
		uboElements,
		size: offset
	};
}
var WGSL_ALIGN_SIZE_DATA;
var init_createUboElementsWGSL = __esmMin((() => {
	WGSL_ALIGN_SIZE_DATA = {
		i32: {
			align: 4,
			size: 4
		},
		u32: {
			align: 4,
			size: 4
		},
		f32: {
			align: 4,
			size: 4
		},
		f16: {
			align: 2,
			size: 2
		},
		"vec2<i32>": {
			align: 8,
			size: 8
		},
		"vec2<u32>": {
			align: 8,
			size: 8
		},
		"vec2<f32>": {
			align: 8,
			size: 8
		},
		"vec2<f16>": {
			align: 4,
			size: 4
		},
		"vec3<i32>": {
			align: 16,
			size: 12
		},
		"vec3<u32>": {
			align: 16,
			size: 12
		},
		"vec3<f32>": {
			align: 16,
			size: 12
		},
		"vec3<f16>": {
			align: 8,
			size: 6
		},
		"vec4<i32>": {
			align: 16,
			size: 16
		},
		"vec4<u32>": {
			align: 16,
			size: 16
		},
		"vec4<f32>": {
			align: 16,
			size: 16
		},
		"vec4<f16>": {
			align: 8,
			size: 8
		},
		"mat2x2<f32>": {
			align: 8,
			size: 16
		},
		"mat2x2<f16>": {
			align: 4,
			size: 8
		},
		"mat3x2<f32>": {
			align: 8,
			size: 24
		},
		"mat3x2<f16>": {
			align: 4,
			size: 12
		},
		"mat4x2<f32>": {
			align: 8,
			size: 32
		},
		"mat4x2<f16>": {
			align: 4,
			size: 16
		},
		"mat2x3<f32>": {
			align: 16,
			size: 32
		},
		"mat2x3<f16>": {
			align: 8,
			size: 16
		},
		"mat3x3<f32>": {
			align: 16,
			size: 48
		},
		"mat3x3<f16>": {
			align: 8,
			size: 24
		},
		"mat4x3<f32>": {
			align: 16,
			size: 64
		},
		"mat4x3<f16>": {
			align: 8,
			size: 32
		},
		"mat2x4<f32>": {
			align: 16,
			size: 32
		},
		"mat2x4<f16>": {
			align: 8,
			size: 16
		},
		"mat3x4<f32>": {
			align: 16,
			size: 48
		},
		"mat3x4<f16>": {
			align: 8,
			size: 24
		},
		"mat4x4<f32>": {
			align: 16,
			size: 64
		},
		"mat4x4<f16>": {
			align: 8,
			size: 32
		}
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/utils/generateArraySyncWGSL.mjs
function generateArraySyncWGSL(uboElement, offsetToAdd) {
	const { size, align } = WGSL_ALIGN_SIZE_DATA[uboElement.data.type];
	const remainder = (align - size) / 4;
	const data = uboElement.data.type.indexOf("i32") >= 0 ? "dataInt32" : "data";
	return `
         v = uv.${uboElement.data.name};
         ${offsetToAdd !== 0 ? `offset += ${offsetToAdd};` : ""}

         arrayOffset = offset;

         t = 0;

         for(var i=0; i < ${uboElement.data.size * (size / 4)}; i++)
         {
             for(var j = 0; j < ${size / 4}; j++)
             {
                 ${data}[arrayOffset++] = v[t++];
             }
             ${remainder !== 0 ? `arrayOffset += ${remainder};` : ""}
         }
     `;
}
var init_generateArraySyncWGSL = __esmMin((() => {
	init_createUboElementsWGSL();
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/utils/createUboSyncFunctionWGSL.mjs
function createUboSyncFunctionWGSL(uboElements) {
	return createUboSyncFunction(uboElements, "uboWgsl", generateArraySyncWGSL, uboSyncFunctionsWGSL);
}
var init_createUboSyncFunctionWGSL = __esmMin((() => {
	init_createUboSyncFunction();
	init_uboSyncFunctions();
	init_generateArraySyncWGSL();
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gpu/GpuUboSystem.mjs
var GpuUboSystem;
var init_GpuUboSystem = __esmMin((() => {
	init_Extensions();
	init_UboSystem();
	init_createUboElementsWGSL();
	init_createUboSyncFunctionWGSL();
	GpuUboSystem = class extends UboSystem {
		constructor() {
			super({
				createUboElements: createUboElementsWGSL,
				generateUboSync: createUboSyncFunctionWGSL
			});
		}
	};
	/** @ignore */
	GpuUboSystem.extension = {
		type: [ExtensionType.WebGPUSystem],
		name: "ubo"
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gpu/GpuUniformBatchPipe.mjs
var minUniformOffsetAlignment, GpuUniformBatchPipe;
var init_GpuUniformBatchPipe = __esmMin((() => {
	init_Extensions();
	init_Buffer();
	init_BufferResource();
	init_const$3();
	init_UboBatch();
	init_BindGroup();
	minUniformOffsetAlignment = 128;
	GpuUniformBatchPipe = class {
		constructor(renderer) {
			this._bindGroupHash = /* @__PURE__ */ Object.create(null);
			this._buffers = [];
			this._bindGroups = [];
			this._bufferResources = [];
			this._renderer = renderer;
			this._batchBuffer = new UboBatch({ minUniformOffsetAlignment });
			const totalBuffers = 256 / minUniformOffsetAlignment;
			for (let i = 0; i < totalBuffers; i++) {
				let usage = BufferUsage.UNIFORM | BufferUsage.COPY_DST;
				if (i === 0) usage |= BufferUsage.COPY_SRC;
				this._buffers.push(new Buffer({
					data: this._batchBuffer.data,
					usage
				}));
			}
		}
		renderEnd() {
			this._uploadBindGroups();
			this._resetBindGroups();
		}
		_resetBindGroups() {
			this._bindGroupHash = /* @__PURE__ */ Object.create(null);
			this._batchBuffer.clear();
		}
		getUniformBindGroup(group, duplicate) {
			if (!duplicate && this._bindGroupHash[group.uid]) return this._bindGroupHash[group.uid];
			this._renderer.ubo.ensureUniformGroup(group);
			const data = group.buffer.data;
			const offset = this._batchBuffer.addEmptyGroup(data.length);
			this._renderer.ubo.syncUniformGroup(group, this._batchBuffer.data, offset / 4);
			this._bindGroupHash[group.uid] = this._getBindGroup(offset / minUniformOffsetAlignment);
			return this._bindGroupHash[group.uid];
		}
		getUboResource(group) {
			this._renderer.ubo.updateUniformGroup(group);
			const data = group.buffer.data;
			const offset = this._batchBuffer.addGroup(data);
			return this._getBufferResource(offset / minUniformOffsetAlignment);
		}
		getArrayBindGroup(data) {
			const offset = this._batchBuffer.addGroup(data);
			return this._getBindGroup(offset / minUniformOffsetAlignment);
		}
		getArrayBufferResource(data) {
			const index = this._batchBuffer.addGroup(data) / minUniformOffsetAlignment;
			return this._getBufferResource(index);
		}
		_getBufferResource(index) {
			if (!this._bufferResources[index]) {
				const buffer = this._buffers[index % 2];
				this._bufferResources[index] = new BufferResource({
					buffer,
					offset: (index / 2 | 0) * 256,
					size: minUniformOffsetAlignment
				});
			}
			return this._bufferResources[index];
		}
		_getBindGroup(index) {
			if (!this._bindGroups[index]) {
				const bindGroup = new BindGroup({ 0: this._getBufferResource(index) });
				this._bindGroups[index] = bindGroup;
			}
			return this._bindGroups[index];
		}
		_uploadBindGroups() {
			const bufferSystem = this._renderer.buffer;
			const firstBuffer = this._buffers[0];
			firstBuffer.update(this._batchBuffer.byteIndex);
			bufferSystem.updateBuffer(firstBuffer);
			const commandEncoder = this._renderer.gpu.device.createCommandEncoder();
			for (let i = 1; i < this._buffers.length; i++) {
				const buffer = this._buffers[i];
				commandEncoder.copyBufferToBuffer(bufferSystem.getGPUBuffer(firstBuffer), minUniformOffsetAlignment, bufferSystem.getGPUBuffer(buffer), 0, this._batchBuffer.byteIndex);
			}
			this._renderer.gpu.device.queue.submit([commandEncoder.finish()]);
		}
		destroy() {
			for (let i = 0; i < this._bindGroups.length; i++) this._bindGroups[i]?.destroy();
			this._bindGroups = null;
			this._bindGroupHash = null;
			for (let i = 0; i < this._buffers.length; i++) this._buffers[i].destroy();
			this._buffers = null;
			for (let i = 0; i < this._bufferResources.length; i++) this._bufferResources[i].destroy();
			this._bufferResources = null;
			this._batchBuffer.destroy();
			this._renderer = null;
		}
	};
	/** @ignore */
	GpuUniformBatchPipe.extension = {
		type: [ExtensionType.WebGPUPipes],
		name: "uniformBatch"
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gpu/pipeline/PipelineSystem.mjs
function getGraphicsStateKey(geometryLayout, shaderKey, state, blendMode, topology) {
	return geometryLayout << 24 | shaderKey << 16 | state << 10 | blendMode << 5 | topology;
}
function getGlobalStateKey(stencilStateId, multiSampleCount, colorMask, renderTarget, colorTargetCount) {
	return colorMask << 8 | stencilStateId << 5 | renderTarget << 3 | colorTargetCount << 1 | multiSampleCount;
}
var topologyStringToId, PipelineSystem;
var init_PipelineSystem = __esmMin((() => {
	init_Extensions();
	init_warn();
	init_ensureAttributes();
	init_const$4();
	init_createIdFromString();
	init_GpuStencilModesToPixi();
	topologyStringToId = {
		"point-list": 0,
		"line-list": 1,
		"line-strip": 2,
		"triangle-list": 3,
		"triangle-strip": 4
	};
	PipelineSystem = class {
		constructor(renderer) {
			this._moduleCache = /* @__PURE__ */ Object.create(null);
			this._bufferLayoutsCache = /* @__PURE__ */ Object.create(null);
			this._bindingNamesCache = /* @__PURE__ */ Object.create(null);
			this._pipeCache = /* @__PURE__ */ Object.create(null);
			this._pipeStateCaches = /* @__PURE__ */ Object.create(null);
			this._colorMask = 15;
			this._multisampleCount = 1;
			this._colorTargetCount = 1;
			this._renderer = renderer;
		}
		contextChange(gpu) {
			this._gpu = gpu;
			this.setStencilMode(STENCIL_MODES.DISABLED);
			this._updatePipeHash();
		}
		setMultisampleCount(multisampleCount) {
			if (this._multisampleCount === multisampleCount) return;
			this._multisampleCount = multisampleCount;
			this._updatePipeHash();
		}
		setRenderTarget(renderTarget) {
			this._multisampleCount = renderTarget.msaaSamples;
			this._depthStencilAttachment = renderTarget.descriptor.depthStencilAttachment ? 1 : 0;
			this._colorTargetCount = renderTarget.colorTargetCount;
			this._updatePipeHash();
		}
		setColorMask(colorMask) {
			if (this._colorMask === colorMask) return;
			this._colorMask = colorMask;
			this._updatePipeHash();
		}
		setStencilMode(stencilMode) {
			if (this._stencilMode === stencilMode) return;
			this._stencilMode = stencilMode;
			this._stencilState = GpuStencilModesToPixi[stencilMode];
			this._updatePipeHash();
		}
		setPipeline(geometry, program, state, passEncoder) {
			const pipeline = this.getPipeline(geometry, program, state);
			passEncoder.setPipeline(pipeline);
		}
		getPipeline(geometry, program, state, topology) {
			if (!geometry._layoutKey) {
				ensureAttributes(geometry, program.attributeData);
				this._generateBufferKey(geometry);
			}
			topology || (topology = geometry.topology);
			const key = getGraphicsStateKey(geometry._layoutKey, program._layoutKey, state.data, state._blendModeId, topologyStringToId[topology]);
			if (this._pipeCache[key]) return this._pipeCache[key];
			this._pipeCache[key] = this._createPipeline(geometry, program, state, topology);
			return this._pipeCache[key];
		}
		_createPipeline(geometry, program, state, topology) {
			const device = this._gpu.device;
			const buffers = this._createVertexBufferLayouts(geometry, program);
			const blendModes = this._renderer.state.getColorTargets(state, this._colorTargetCount);
			const writeMask = this._stencilMode === STENCIL_MODES.RENDERING_MASK_ADD ? 0 : this._colorMask;
			for (let i = 0; i < blendModes.length; i++) blendModes[i].writeMask = writeMask;
			const layout = this._renderer.shader.getProgramData(program).pipeline;
			const descriptor = {
				vertex: {
					module: this._getModule(program.vertex.source),
					entryPoint: program.vertex.entryPoint,
					buffers
				},
				fragment: {
					module: this._getModule(program.fragment.source),
					entryPoint: program.fragment.entryPoint,
					targets: blendModes
				},
				primitive: {
					topology,
					cullMode: state.cullMode
				},
				layout,
				multisample: { count: this._multisampleCount },
				label: `PIXI Pipeline`
			};
			if (this._depthStencilAttachment) descriptor.depthStencil = {
				...this._stencilState,
				format: "depth24plus-stencil8",
				depthWriteEnabled: state.depthTest,
				depthCompare: state.depthTest ? "less" : "always"
			};
			return device.createRenderPipeline(descriptor);
		}
		_getModule(code) {
			return this._moduleCache[code] || this._createModule(code);
		}
		_createModule(code) {
			const device = this._gpu.device;
			this._moduleCache[code] = device.createShaderModule({ code });
			return this._moduleCache[code];
		}
		_generateBufferKey(geometry) {
			const keyGen = [];
			let index = 0;
			const attributeKeys = Object.keys(geometry.attributes).sort();
			for (let i = 0; i < attributeKeys.length; i++) {
				const attribute = geometry.attributes[attributeKeys[i]];
				keyGen[index++] = attribute.offset;
				keyGen[index++] = attribute.format;
				keyGen[index++] = attribute.stride;
				keyGen[index++] = attribute.instance;
			}
			const stringKey = keyGen.join("|");
			geometry._layoutKey = createIdFromString(stringKey, "geometry");
			return geometry._layoutKey;
		}
		_generateAttributeLocationsKey(program) {
			const keyGen = [];
			let index = 0;
			const attributeKeys = Object.keys(program.attributeData).sort();
			for (let i = 0; i < attributeKeys.length; i++) {
				const attribute = program.attributeData[attributeKeys[i]];
				keyGen[index++] = attribute.location;
			}
			const stringKey = keyGen.join("|");
			program._attributeLocationsKey = createIdFromString(stringKey, "programAttributes");
			return program._attributeLocationsKey;
		}
		/**
		* Returns a hash of buffer names mapped to bind locations.
		* This is used to bind the correct buffer to the correct location in the shader.
		* @param geometry - The geometry where to get the buffer names
		* @param program - The program where to get the buffer names
		* @returns An object of buffer names mapped to the bind location.
		*/
		getBufferNamesToBind(geometry, program) {
			const key = geometry._layoutKey << 16 | program._attributeLocationsKey;
			if (this._bindingNamesCache[key]) return this._bindingNamesCache[key];
			const data = this._createVertexBufferLayouts(geometry, program);
			const bufferNamesToBind = /* @__PURE__ */ Object.create(null);
			const attributeData = program.attributeData;
			for (let i = 0; i < data.length; i++) {
				const shaderLocation = Object.values(data[i].attributes)[0].shaderLocation;
				for (const j in attributeData) if (attributeData[j].location === shaderLocation) {
					bufferNamesToBind[i] = j;
					break;
				}
			}
			this._bindingNamesCache[key] = bufferNamesToBind;
			return bufferNamesToBind;
		}
		_createVertexBufferLayouts(geometry, program) {
			if (!program._attributeLocationsKey) this._generateAttributeLocationsKey(program);
			const key = geometry._layoutKey << 16 | program._attributeLocationsKey;
			if (this._bufferLayoutsCache[key]) return this._bufferLayoutsCache[key];
			const vertexBuffersLayout = [];
			geometry.buffers.forEach((buffer) => {
				const bufferEntry = {
					arrayStride: 0,
					stepMode: "vertex",
					attributes: []
				};
				const bufferEntryAttributes = bufferEntry.attributes;
				for (const i in program.attributeData) {
					const attribute = geometry.attributes[i];
					if ((attribute.divisor ?? 1) !== 1) warn(`Attribute ${i} has an invalid divisor value of '${attribute.divisor}'. WebGPU only supports a divisor value of 1`);
					if (attribute.buffer === buffer) {
						bufferEntry.arrayStride = attribute.stride;
						bufferEntry.stepMode = attribute.instance ? "instance" : "vertex";
						bufferEntryAttributes.push({
							shaderLocation: program.attributeData[i].location,
							offset: attribute.offset,
							format: attribute.format
						});
					}
				}
				if (bufferEntryAttributes.length) vertexBuffersLayout.push(bufferEntry);
			});
			this._bufferLayoutsCache[key] = vertexBuffersLayout;
			return vertexBuffersLayout;
		}
		_updatePipeHash() {
			const key = getGlobalStateKey(this._stencilMode, this._multisampleCount, this._colorMask, this._depthStencilAttachment, this._colorTargetCount);
			if (!this._pipeStateCaches[key]) this._pipeStateCaches[key] = /* @__PURE__ */ Object.create(null);
			this._pipeCache = this._pipeStateCaches[key];
		}
		destroy() {
			this._renderer = null;
			this._bufferLayoutsCache = null;
		}
	};
	/** @ignore */
	PipelineSystem.extension = {
		type: [ExtensionType.WebGPUSystem],
		name: "pipeline"
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gpu/renderTarget/GpuRenderTarget.mjs
var GpuRenderTarget;
var init_GpuRenderTarget = __esmMin((() => {
	GpuRenderTarget = class {
		constructor() {
			this.contexts = [];
			this.msaaTextures = [];
			this.msaaSamples = 1;
		}
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gpu/renderTarget/GpuRenderTargetAdaptor.mjs
var GpuRenderTargetAdaptor;
var init_GpuRenderTargetAdaptor = __esmMin((() => {
	init_const$5();
	init_CanvasSource();
	init_TextureSource();
	init_GpuRenderTarget();
	GpuRenderTargetAdaptor = class {
		init(renderer, renderTargetSystem) {
			this._renderer = renderer;
			this._renderTargetSystem = renderTargetSystem;
		}
		copyToTexture(sourceRenderSurfaceTexture, destinationTexture, originSrc, size, originDest) {
			const renderer = this._renderer;
			const baseGpuTexture = this._getGpuColorTexture(sourceRenderSurfaceTexture);
			const backGpuTexture = renderer.texture.getGpuSource(destinationTexture.source);
			renderer.encoder.commandEncoder.copyTextureToTexture({
				texture: baseGpuTexture,
				origin: originSrc
			}, {
				texture: backGpuTexture,
				origin: originDest
			}, size);
			return destinationTexture;
		}
		startRenderPass(renderTarget, clear = true, clearColor, viewport, mipLevel = 0, layer = 0) {
			const gpuRenderTarget = this._renderTargetSystem.getGpuRenderTarget(renderTarget);
			if (layer !== 0 && gpuRenderTarget.msaaTextures?.length) throw new Error("[RenderTargetSystem] Rendering to array layers is not supported with MSAA render targets.");
			if (mipLevel > 0 && gpuRenderTarget.msaaTextures?.length) throw new Error("[RenderTargetSystem] Rendering to mip levels is not supported with MSAA render targets.");
			gpuRenderTarget.descriptor = this.getDescriptor(renderTarget, clear, clearColor, mipLevel, layer);
			this._renderer.pipeline.setRenderTarget(gpuRenderTarget);
			this._renderer.encoder.beginRenderPass(gpuRenderTarget);
			this._renderer.encoder.setViewport(viewport);
		}
		finishRenderPass() {
			this._renderer.encoder.endRenderPass();
		}
		/**
		* returns the gpu texture for the first color texture in the render target
		* mainly used by the filter manager to get copy the texture for blending
		* @param renderTarget
		* @returns a gpu texture
		*/
		_getGpuColorTexture(renderTarget) {
			const gpuRenderTarget = this._renderTargetSystem.getGpuRenderTarget(renderTarget);
			if (gpuRenderTarget.contexts[0]) return gpuRenderTarget.contexts[0].getCurrentTexture();
			return this._renderer.texture.getGpuSource(renderTarget.colorTextures[0].source);
		}
		getDescriptor(renderTarget, clear, clearValue, mipLevel = 0, layer = 0) {
			if (typeof clear === "boolean") clear = clear ? CLEAR.ALL : CLEAR.NONE;
			const renderTargetSystem = this._renderTargetSystem;
			const gpuRenderTarget = renderTargetSystem.getGpuRenderTarget(renderTarget);
			const colorAttachments = renderTarget.colorTextures.map((texture, i) => {
				const context = gpuRenderTarget.contexts[i];
				let view;
				let resolveTarget;
				if (context) {
					if (layer !== 0) throw new Error("[RenderTargetSystem] Rendering to array layers is not supported for canvas targets.");
					view = context.getCurrentTexture().createView();
				} else view = this._renderer.texture.getGpuSource(texture).createView({
					dimension: "2d",
					baseMipLevel: mipLevel,
					mipLevelCount: 1,
					baseArrayLayer: layer,
					arrayLayerCount: 1
				});
				let attachmentIsTransient = false;
				if (gpuRenderTarget.msaaTextures[i]) {
					resolveTarget = view;
					view = this._renderer.texture.getTextureView(gpuRenderTarget.msaaTextures[i]);
					attachmentIsTransient = gpuRenderTarget.msaaTextures[i].transient;
				}
				const loadOp = clear & CLEAR.COLOR ? "clear" : "load";
				clearValue ?? (clearValue = renderTargetSystem.defaultClearColor);
				return {
					view,
					resolveTarget,
					clearValue,
					storeOp: attachmentIsTransient ? "discard" : "store",
					loadOp
				};
			});
			let depthStencilAttachment;
			if ((renderTarget.stencil || renderTarget.depth) && !renderTarget.depthStencilTexture) {
				renderTarget.ensureDepthStencilTexture();
				renderTarget.depthStencilTexture.source.sampleCount = gpuRenderTarget.msaa ? 4 : 1;
				renderTarget.depthStencilTexture.source.transient = !!gpuRenderTarget.msaaTextures[0]?.transient;
			}
			if (renderTarget.depthStencilTexture) {
				const stencilLoadOp = clear & CLEAR.STENCIL ? "clear" : "load";
				const depthLoadOp = clear & CLEAR.DEPTH ? "clear" : "load";
				const dsStoreOp = renderTarget.depthStencilTexture.source.transient ? "discard" : "store";
				depthStencilAttachment = {
					view: this._renderer.texture.getGpuSource(renderTarget.depthStencilTexture.source).createView({
						dimension: "2d",
						baseMipLevel: mipLevel,
						mipLevelCount: 1,
						baseArrayLayer: layer,
						arrayLayerCount: 1
					}),
					stencilStoreOp: dsStoreOp,
					stencilLoadOp,
					depthClearValue: 1,
					depthLoadOp,
					depthStoreOp: dsStoreOp
				};
			}
			return {
				colorAttachments,
				depthStencilAttachment
			};
		}
		clear(renderTarget, clear = true, clearColor, viewport, mipLevel = 0, layer = 0) {
			if (!clear) return;
			const { gpu, encoder } = this._renderer;
			const device = gpu.device;
			if (encoder.commandEncoder === null) {
				const commandEncoder = device.createCommandEncoder();
				const renderPassDescriptor = this.getDescriptor(renderTarget, clear, clearColor, mipLevel, layer);
				const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
				passEncoder.setViewport(viewport.x, viewport.y, viewport.width, viewport.height, 0, 1);
				passEncoder.end();
				const gpuCommands = commandEncoder.finish();
				device.queue.submit([gpuCommands]);
			} else this.startRenderPass(renderTarget, clear, clearColor, viewport, mipLevel, layer);
		}
		initGpuRenderTarget(renderTarget) {
			renderTarget.isRoot = true;
			const gpuRenderTarget = new GpuRenderTarget();
			gpuRenderTarget.colorTargetCount = renderTarget.colorTextures.length;
			renderTarget.colorTextures.forEach((colorTexture, i) => {
				if (colorTexture instanceof CanvasSource) {
					const context = colorTexture.resource.getContext("webgpu");
					const alphaMode = colorTexture.transparent ? "premultiplied" : "opaque";
					try {
						context.configure({
							device: this._renderer.gpu.device,
							usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_SRC,
							format: "bgra8unorm",
							alphaMode
						});
					} catch (e) {
						console.error(e);
					}
					gpuRenderTarget.contexts[i] = context;
				}
				gpuRenderTarget.msaa = colorTexture.source.antialias;
				if (colorTexture.source.antialias) {
					const msaaTexture = new TextureSource({
						width: 0,
						height: 0,
						sampleCount: 4,
						transient: colorTexture.source.transient,
						arrayLayerCount: colorTexture.source.arrayLayerCount
					});
					gpuRenderTarget.msaaTextures[i] = msaaTexture;
				}
			});
			if (gpuRenderTarget.msaa) {
				gpuRenderTarget.msaaSamples = 4;
				if (renderTarget.depthStencilTexture) {
					renderTarget.depthStencilTexture.source.sampleCount = 4;
					renderTarget.depthStencilTexture.source.transient = !!gpuRenderTarget.msaaTextures[0]?.transient;
				}
			}
			return gpuRenderTarget;
		}
		destroyGpuRenderTarget(gpuRenderTarget) {
			gpuRenderTarget.contexts.forEach((context) => {
				context.unconfigure();
			});
			gpuRenderTarget.msaaTextures.forEach((texture) => {
				texture.destroy();
			});
			gpuRenderTarget.msaaTextures.length = 0;
			gpuRenderTarget.contexts.length = 0;
		}
		ensureDepthStencilTexture(renderTarget) {
			const gpuRenderTarget = this._renderTargetSystem.getGpuRenderTarget(renderTarget);
			if (renderTarget.depthStencilTexture && gpuRenderTarget.msaa) renderTarget.depthStencilTexture.source.sampleCount = 4;
		}
		resizeGpuRenderTarget(renderTarget) {
			const gpuRenderTarget = this._renderTargetSystem.getGpuRenderTarget(renderTarget);
			gpuRenderTarget.width = renderTarget.width;
			gpuRenderTarget.height = renderTarget.height;
			if (gpuRenderTarget.msaa) renderTarget.colorTextures.forEach((colorTexture, i) => {
				gpuRenderTarget.msaaTextures[i]?.resize(colorTexture.source.width, colorTexture.source.height, colorTexture.source._resolution);
			});
		}
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gpu/renderTarget/GpuRenderTargetSystem.mjs
var GpuRenderTargetSystem;
var init_GpuRenderTargetSystem = __esmMin((() => {
	init_Extensions();
	init_RenderTargetSystem();
	init_GpuRenderTargetAdaptor();
	GpuRenderTargetSystem = class extends RenderTargetSystem {
		constructor(renderer) {
			super(renderer);
			this.adaptor = new GpuRenderTargetAdaptor();
			this.adaptor.init(renderer, this);
		}
	};
	/** @ignore */
	GpuRenderTargetSystem.extension = {
		type: [ExtensionType.WebGPUSystem],
		name: "renderTarget"
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/GpuShaderSystem.mjs
var GpuShaderSystem;
var init_GpuShaderSystem = __esmMin((() => {
	init_Extensions();
	GpuShaderSystem = class {
		constructor() {
			this._gpuProgramData = /* @__PURE__ */ Object.create(null);
		}
		contextChange(gpu) {
			this._gpu = gpu;
		}
		getProgramData(program) {
			return this._gpuProgramData[program._layoutKey] || this._createGPUProgramData(program);
		}
		_createGPUProgramData(program) {
			const device = this._gpu.device;
			const bindGroups = program.gpuLayout.map((group) => device.createBindGroupLayout({ entries: group }));
			const pipelineLayoutDesc = { bindGroupLayouts: bindGroups };
			this._gpuProgramData[program._layoutKey] = {
				bindGroups,
				pipeline: device.createPipelineLayout(pipelineLayoutDesc)
			};
			return this._gpuProgramData[program._layoutKey];
		}
		destroy() {
			this._gpu = null;
			this._gpuProgramData = null;
		}
	};
	/** @ignore */
	GpuShaderSystem.extension = {
		type: [ExtensionType.WebGPUSystem],
		name: "shader"
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gpu/state/GpuBlendModesToPixi.mjs
var GpuBlendModesToPixi;
var init_GpuBlendModesToPixi = __esmMin((() => {
	GpuBlendModesToPixi = {};
	GpuBlendModesToPixi.normal = {
		alpha: {
			srcFactor: "one",
			dstFactor: "one-minus-src-alpha",
			operation: "add"
		},
		color: {
			srcFactor: "one",
			dstFactor: "one-minus-src-alpha",
			operation: "add"
		}
	};
	GpuBlendModesToPixi.add = {
		alpha: {
			srcFactor: "src-alpha",
			dstFactor: "one-minus-src-alpha",
			operation: "add"
		},
		color: {
			srcFactor: "one",
			dstFactor: "one",
			operation: "add"
		}
	};
	GpuBlendModesToPixi.multiply = {
		alpha: {
			srcFactor: "one",
			dstFactor: "one-minus-src-alpha",
			operation: "add"
		},
		color: {
			srcFactor: "dst",
			dstFactor: "one-minus-src-alpha",
			operation: "add"
		}
	};
	GpuBlendModesToPixi.screen = {
		alpha: {
			srcFactor: "one",
			dstFactor: "one-minus-src-alpha",
			operation: "add"
		},
		color: {
			srcFactor: "one",
			dstFactor: "one-minus-src",
			operation: "add"
		}
	};
	GpuBlendModesToPixi.overlay = {
		alpha: {
			srcFactor: "one",
			dstFactor: "one-minus-src-alpha",
			operation: "add"
		},
		color: {
			srcFactor: "one",
			dstFactor: "one-minus-src",
			operation: "add"
		}
	};
	GpuBlendModesToPixi.none = {
		alpha: {
			srcFactor: "one",
			dstFactor: "one-minus-src-alpha",
			operation: "add"
		},
		color: {
			srcFactor: "zero",
			dstFactor: "zero",
			operation: "add"
		}
	};
	GpuBlendModesToPixi["normal-npm"] = {
		alpha: {
			srcFactor: "one",
			dstFactor: "one-minus-src-alpha",
			operation: "add"
		},
		color: {
			srcFactor: "src-alpha",
			dstFactor: "one-minus-src-alpha",
			operation: "add"
		}
	};
	GpuBlendModesToPixi["add-npm"] = {
		alpha: {
			srcFactor: "one",
			dstFactor: "one",
			operation: "add"
		},
		color: {
			srcFactor: "src-alpha",
			dstFactor: "one",
			operation: "add"
		}
	};
	GpuBlendModesToPixi["screen-npm"] = {
		alpha: {
			srcFactor: "one",
			dstFactor: "one-minus-src-alpha",
			operation: "add"
		},
		color: {
			srcFactor: "src-alpha",
			dstFactor: "one-minus-src",
			operation: "add"
		}
	};
	GpuBlendModesToPixi.erase = {
		alpha: {
			srcFactor: "zero",
			dstFactor: "one-minus-src-alpha",
			operation: "add"
		},
		color: {
			srcFactor: "zero",
			dstFactor: "one-minus-src",
			operation: "add"
		}
	};
	GpuBlendModesToPixi.min = {
		alpha: {
			srcFactor: "one",
			dstFactor: "one",
			operation: "min"
		},
		color: {
			srcFactor: "one",
			dstFactor: "one",
			operation: "min"
		}
	};
	GpuBlendModesToPixi.max = {
		alpha: {
			srcFactor: "one",
			dstFactor: "one",
			operation: "max"
		},
		color: {
			srcFactor: "one",
			dstFactor: "one",
			operation: "max"
		}
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gpu/state/GpuStateSystem.mjs
var GpuStateSystem;
var init_GpuStateSystem = __esmMin((() => {
	init_Extensions();
	init_State();
	init_GpuBlendModesToPixi();
	GpuStateSystem = class {
		constructor() {
			this.defaultState = new State();
			this.defaultState.blend = true;
		}
		contextChange(gpu) {
			this.gpu = gpu;
		}
		/**
		* Gets the blend mode data for the current state
		* @param state - The state to get the blend mode from
		* @param count - The number of color targets to create
		*/
		getColorTargets(state, count) {
			const blend = GpuBlendModesToPixi[state.blendMode] || GpuBlendModesToPixi.normal;
			const targets = [];
			const target = {
				format: "bgra8unorm",
				writeMask: 0,
				blend
			};
			for (let i = 0; i < count; i++) targets[i] = target;
			return targets;
		}
		destroy() {
			this.gpu = null;
		}
	};
	/** @ignore */
	GpuStateSystem.extension = {
		type: [ExtensionType.WebGPUSystem],
		name: "state"
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gpu/texture/uploaders/gpuUploadBufferImageResource.mjs
var gpuUploadBufferImageResource;
var init_gpuUploadBufferImageResource = __esmMin((() => {
	gpuUploadBufferImageResource = {
		type: "image",
		upload(source, gpuTexture, gpu, originZOverride = 0) {
			const resource = source.resource;
			const total = (source.pixelWidth | 0) * (source.pixelHeight | 0);
			const bytesPerPixel = resource.byteLength / total;
			gpu.device.queue.writeTexture({
				texture: gpuTexture,
				origin: {
					x: 0,
					y: 0,
					z: originZOverride
				}
			}, resource, {
				offset: 0,
				rowsPerImage: source.pixelHeight,
				bytesPerRow: source.pixelWidth * bytesPerPixel
			}, {
				width: source.pixelWidth,
				height: source.pixelHeight,
				depthOrArrayLayers: 1
			});
		}
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gpu/texture/uploaders/gpuUploadCompressedTextureResource.mjs
var blockDataMap, defaultBlockData, gpuUploadCompressedTextureResource;
var init_gpuUploadCompressedTextureResource = __esmMin((() => {
	blockDataMap = {
		"bc1-rgba-unorm": {
			blockBytes: 8,
			blockWidth: 4,
			blockHeight: 4
		},
		"bc2-rgba-unorm": {
			blockBytes: 16,
			blockWidth: 4,
			blockHeight: 4
		},
		"bc3-rgba-unorm": {
			blockBytes: 16,
			blockWidth: 4,
			blockHeight: 4
		},
		"bc7-rgba-unorm": {
			blockBytes: 16,
			blockWidth: 4,
			blockHeight: 4
		},
		"etc1-rgb-unorm": {
			blockBytes: 8,
			blockWidth: 4,
			blockHeight: 4
		},
		"etc2-rgba8unorm": {
			blockBytes: 16,
			blockWidth: 4,
			blockHeight: 4
		},
		"astc-4x4-unorm": {
			blockBytes: 16,
			blockWidth: 4,
			blockHeight: 4
		}
	};
	defaultBlockData = {
		blockBytes: 4,
		blockWidth: 1,
		blockHeight: 1
	};
	gpuUploadCompressedTextureResource = {
		type: "compressed",
		upload(source, gpuTexture, gpu, originZOverride = 0) {
			let mipWidth = source.pixelWidth;
			let mipHeight = source.pixelHeight;
			const blockData = blockDataMap[source.format] || defaultBlockData;
			for (let i = 0; i < source.resource.length; i++) {
				const levelBuffer = source.resource[i];
				const bytesPerRow = Math.ceil(mipWidth / blockData.blockWidth) * blockData.blockBytes;
				gpu.device.queue.writeTexture({
					texture: gpuTexture,
					mipLevel: i,
					origin: {
						x: 0,
						y: 0,
						z: originZOverride
					}
				}, levelBuffer, {
					offset: 0,
					bytesPerRow
				}, {
					width: Math.ceil(mipWidth / blockData.blockWidth) * blockData.blockWidth,
					height: Math.ceil(mipHeight / blockData.blockHeight) * blockData.blockHeight,
					depthOrArrayLayers: 1
				});
				mipWidth = Math.max(mipWidth >> 1, 1);
				mipHeight = Math.max(mipHeight >> 1, 1);
			}
		}
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gpu/texture/uploaders/gpuUploadCubeTextureResource.mjs
function createGpuUploadCubeTextureResource(uploaders) {
	return {
		type: "cube",
		upload(source, gpuTexture, gpu) {
			const faces = source.faces;
			for (let i = 0; i < FACE_ORDER.length; i++) {
				const face = faces[FACE_ORDER[i]];
				(uploaders[face.uploadMethodId] || uploaders.image).upload(face, gpuTexture, gpu, i);
			}
		}
	};
}
var FACE_ORDER;
var init_gpuUploadCubeTextureResource = __esmMin((() => {
	FACE_ORDER = [
		"right",
		"left",
		"top",
		"bottom",
		"front",
		"back"
	];
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gpu/texture/uploaders/gpuUploadImageSource.mjs
var gpuUploadImageResource;
var init_gpuUploadImageSource = __esmMin((() => {
	init_adapter();
	init_warn();
	gpuUploadImageResource = {
		type: "image",
		upload(source, gpuTexture, gpu, originZOverride = 0) {
			const resource = source.resource;
			if (!resource) return;
			if (globalThis.HTMLImageElement && resource instanceof HTMLImageElement) {
				const canvas = DOMAdapter.get().createCanvas(resource.width, resource.height);
				canvas.getContext("2d").drawImage(resource, 0, 0, resource.width, resource.height);
				source.resource = canvas;
				warn("ImageSource: Image element passed, converting to canvas and replacing resource.");
			}
			const width = Math.min(gpuTexture.width, source.resourceWidth || source.pixelWidth);
			const height = Math.min(gpuTexture.height, source.resourceHeight || source.pixelHeight);
			const premultipliedAlpha = source.alphaMode === "premultiply-alpha-on-upload";
			gpu.device.queue.copyExternalImageToTexture({ source: resource }, {
				texture: gpuTexture,
				origin: {
					x: 0,
					y: 0,
					z: originZOverride
				},
				premultipliedAlpha
			}, {
				width,
				height
			});
		}
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gpu/texture/uploaders/gpuUploadVideoSource.mjs
var gpuUploadVideoResource;
var init_gpuUploadVideoSource = __esmMin((() => {
	init_gpuUploadImageSource();
	gpuUploadVideoResource = {
		type: "video",
		upload(source, gpuTexture, gpu, originZOverride) {
			gpuUploadImageResource.upload(source, gpuTexture, gpu, originZOverride);
		}
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gpu/texture/utils/GpuMipmapGenerator.mjs
var GpuMipmapGenerator;
var init_GpuMipmapGenerator = __esmMin((() => {
	GpuMipmapGenerator = class {
		constructor(device) {
			this.device = device;
			this.sampler = device.createSampler({ minFilter: "linear" });
			this.pipelines = {};
		}
		_getMipmapPipeline(format) {
			let pipeline = this.pipelines[format];
			if (!pipeline) {
				if (!this.mipmapShaderModule) this.mipmapShaderModule = this.device.createShaderModule({ code: `
                        var<private> pos : array<vec2<f32>, 3> = array<vec2<f32>, 3>(
                        vec2<f32>(-1.0, -1.0), vec2<f32>(-1.0, 3.0), vec2<f32>(3.0, -1.0));

                        struct VertexOutput {
                        @builtin(position) position : vec4<f32>,
                        @location(0) texCoord : vec2<f32>,
                        };

                        @vertex
                        fn vertexMain(@builtin(vertex_index) vertexIndex : u32) -> VertexOutput {
                        var output : VertexOutput;
                        output.texCoord = pos[vertexIndex] * vec2<f32>(0.5, -0.5) + vec2<f32>(0.5);
                        output.position = vec4<f32>(pos[vertexIndex], 0.0, 1.0);
                        return output;
                        }

                        @group(0) @binding(0) var imgSampler : sampler;
                        @group(0) @binding(1) var img : texture_2d<f32>;

                        @fragment
                        fn fragmentMain(@location(0) texCoord : vec2<f32>) -> @location(0) vec4<f32> {
                        return textureSample(img, imgSampler, texCoord);
                        }
                    ` });
				pipeline = this.device.createRenderPipeline({
					layout: "auto",
					vertex: {
						module: this.mipmapShaderModule,
						entryPoint: "vertexMain"
					},
					fragment: {
						module: this.mipmapShaderModule,
						entryPoint: "fragmentMain",
						targets: [{ format }]
					}
				});
				this.pipelines[format] = pipeline;
			}
			return pipeline;
		}
		/**
		* Generates mipmaps for the given GPUTexture from the data in level 0.
		* @param {module:External.GPUTexture} texture - Texture to generate mipmaps for.
		* @returns {module:External.GPUTexture} - The originally passed texture
		*/
		generateMipmap(texture) {
			const pipeline = this._getMipmapPipeline(texture.format);
			if (texture.dimension === "3d" || texture.dimension === "1d") throw new Error("Generating mipmaps for non-2d textures is currently unsupported!");
			let mipTexture = texture;
			const arrayLayerCount = texture.depthOrArrayLayers || 1;
			const renderToSource = texture.usage & GPUTextureUsage.RENDER_ATTACHMENT;
			if (!renderToSource) {
				const mipTextureDescriptor = {
					size: {
						width: Math.ceil(texture.width / 2),
						height: Math.ceil(texture.height / 2),
						depthOrArrayLayers: arrayLayerCount
					},
					format: texture.format,
					usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.RENDER_ATTACHMENT,
					mipLevelCount: texture.mipLevelCount - 1
				};
				mipTexture = this.device.createTexture(mipTextureDescriptor);
			}
			const commandEncoder = this.device.createCommandEncoder({});
			const bindGroupLayout = pipeline.getBindGroupLayout(0);
			for (let arrayLayer = 0; arrayLayer < arrayLayerCount; ++arrayLayer) {
				let srcView = texture.createView({
					baseMipLevel: 0,
					mipLevelCount: 1,
					dimension: "2d",
					baseArrayLayer: arrayLayer,
					arrayLayerCount: 1
				});
				let dstMipLevel = renderToSource ? 1 : 0;
				for (let i = 1; i < texture.mipLevelCount; ++i) {
					const dstView = mipTexture.createView({
						baseMipLevel: dstMipLevel++,
						mipLevelCount: 1,
						dimension: "2d",
						baseArrayLayer: arrayLayer,
						arrayLayerCount: 1
					});
					const passEncoder = commandEncoder.beginRenderPass({ colorAttachments: [{
						view: dstView,
						storeOp: "store",
						loadOp: "clear",
						clearValue: {
							r: 0,
							g: 0,
							b: 0,
							a: 0
						}
					}] });
					const bindGroup = this.device.createBindGroup({
						layout: bindGroupLayout,
						entries: [{
							binding: 0,
							resource: this.sampler
						}, {
							binding: 1,
							resource: srcView
						}]
					});
					passEncoder.setPipeline(pipeline);
					passEncoder.setBindGroup(0, bindGroup);
					passEncoder.draw(3, 1, 0, 0);
					passEncoder.end();
					srcView = dstView;
				}
			}
			if (!renderToSource) {
				const mipLevelSize = {
					width: Math.ceil(texture.width / 2),
					height: Math.ceil(texture.height / 2),
					depthOrArrayLayers: arrayLayerCount
				};
				for (let i = 1; i < texture.mipLevelCount; ++i) {
					commandEncoder.copyTextureToTexture({
						texture: mipTexture,
						mipLevel: i - 1
					}, {
						texture,
						mipLevel: i
					}, mipLevelSize);
					mipLevelSize.width = Math.ceil(mipLevelSize.width / 2);
					mipLevelSize.height = Math.ceil(mipLevelSize.height / 2);
				}
			}
			this.device.queue.submit([commandEncoder.finish()]);
			if (!renderToSource) mipTexture.destroy();
			return texture;
		}
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gpu/texture/GpuTextureSystem.mjs
var GPUTextureGpuData, _GpuTextureSystem, GpuTextureSystem;
var init_GpuTextureSystem = __esmMin((() => {
	init_adapter();
	init_Extensions();
	init_GCManagedHash();
	init_UniformGroup();
	init_CanvasPool();
	init_BindGroup();
	init_gpuUploadBufferImageResource();
	init_gpuUploadCompressedTextureResource();
	init_gpuUploadCubeTextureResource();
	init_gpuUploadImageSource();
	init_gpuUploadVideoSource();
	init_GpuMipmapGenerator();
	GPUTextureGpuData = class {
		constructor(gpuTexture) {
			this.textureView = null;
			this.gpuTexture = gpuTexture;
		}
		/** Destroys this GPU data instance. */
		destroy() {
			this.gpuTexture.destroy();
			this.textureView = null;
			this.gpuTexture = null;
		}
	};
	_GpuTextureSystem = class _GpuTextureSystem {
		constructor(renderer) {
			this._gpuSamplers = /* @__PURE__ */ Object.create(null);
			this._bindGroupHash = /* @__PURE__ */ Object.create(null);
			this._renderer = renderer;
			renderer.gc.addCollection(this, "_bindGroupHash", "hash");
			this._managedTextures = new GCManagedHash({
				renderer,
				type: "resource",
				onUnload: this.onSourceUnload.bind(this),
				name: "gpuTextureSource"
			});
			const baseUploaders = {
				image: gpuUploadImageResource,
				buffer: gpuUploadBufferImageResource,
				video: gpuUploadVideoResource,
				compressed: gpuUploadCompressedTextureResource,
				..._GpuTextureSystem.uploadExtensions
			};
			this._uploads = {
				...baseUploaders,
				cube: createGpuUploadCubeTextureResource(baseUploaders)
			};
		}
		/**
		* @deprecated since 8.15.0
		*/
		get managedTextures() {
			return Object.values(this._managedTextures.items);
		}
		contextChange(gpu) {
			this._gpu = gpu;
		}
		/**
		* Initializes a texture source, if it has already been initialized nothing will happen.
		* @param source - The texture source to initialize.
		* @returns The initialized texture source.
		*/
		initSource(source) {
			return source._gpuData[this._renderer.uid]?.gpuTexture || this._initSource(source);
		}
		_initSource(source) {
			if (source.autoGenerateMipmaps) {
				const biggestDimension = Math.max(source.pixelWidth, source.pixelHeight);
				source.mipLevelCount = Math.floor(Math.log2(biggestDimension)) + 1;
			}
			let usage;
			if (source.sampleCount > 1) {
				usage = GPUTextureUsage.RENDER_ATTACHMENT;
				if (source.transient && this._renderer.device.extensions.transientAttachment) usage |= GPUTextureUsage.TRANSIENT_ATTACHMENT;
			} else {
				usage = GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST;
				if (source.uploadMethodId !== "compressed") {
					usage |= GPUTextureUsage.RENDER_ATTACHMENT;
					usage |= GPUTextureUsage.COPY_SRC;
				}
			}
			const blockData = blockDataMap[source.format] || {
				blockBytes: 4,
				blockWidth: 1,
				blockHeight: 1
			};
			const width = Math.ceil(source.pixelWidth / blockData.blockWidth) * blockData.blockWidth;
			const height = Math.ceil(source.pixelHeight / blockData.blockHeight) * blockData.blockHeight;
			const textureDescriptor = {
				label: source.label,
				size: {
					width,
					height,
					depthOrArrayLayers: source.arrayLayerCount
				},
				format: source.format,
				sampleCount: source.sampleCount,
				mipLevelCount: source.mipLevelCount,
				dimension: source.dimension,
				usage
			};
			const gpuTexture = this._gpu.device.createTexture(textureDescriptor);
			source._gpuData[this._renderer.uid] = new GPUTextureGpuData(gpuTexture);
			if (this._managedTextures.add(source)) {
				source.on("update", this.onSourceUpdate, this);
				source.on("resize", this.onSourceResize, this);
				source.on("updateMipmaps", this.onUpdateMipmaps, this);
			}
			this.onSourceUpdate(source);
			return gpuTexture;
		}
		onSourceUpdate(source) {
			const gpuTexture = this.getGpuSource(source);
			if (!gpuTexture) return;
			if (this._uploads[source.uploadMethodId]) this._uploads[source.uploadMethodId].upload(source, gpuTexture, this._gpu);
			if (source.autoGenerateMipmaps && source.mipLevelCount > 1) this.onUpdateMipmaps(source);
		}
		onUpdateMipmaps(source) {
			if (!this._mipmapGenerator) this._mipmapGenerator = new GpuMipmapGenerator(this._gpu.device);
			const gpuTexture = this.getGpuSource(source);
			this._mipmapGenerator.generateMipmap(gpuTexture);
		}
		onSourceUnload(source) {
			source.off("update", this.onSourceUpdate, this);
			source.off("resize", this.onSourceResize, this);
			source.off("updateMipmaps", this.onUpdateMipmaps, this);
		}
		onSourceResize(source) {
			source._gcLastUsed = this._renderer.gc.now;
			const gpuData = source._gpuData[this._renderer.uid];
			const gpuTexture = gpuData?.gpuTexture;
			if (!gpuTexture) this.initSource(source);
			else if (gpuTexture.width !== source.pixelWidth || gpuTexture.height !== source.pixelHeight) {
				gpuData.destroy();
				this._bindGroupHash[source.uid] = null;
				source._gpuData[this._renderer.uid] = null;
				this.initSource(source);
			}
		}
		_initSampler(sampler) {
			this._gpuSamplers[sampler._resourceId] = this._gpu.device.createSampler(sampler);
			return this._gpuSamplers[sampler._resourceId];
		}
		getGpuSampler(sampler) {
			return this._gpuSamplers[sampler._resourceId] || this._initSampler(sampler);
		}
		getGpuSource(source) {
			source._gcLastUsed = this._renderer.gc.now;
			return source._gpuData[this._renderer.uid]?.gpuTexture || this.initSource(source);
		}
		/**
		* this returns s bind group for a specific texture, the bind group contains
		* - the texture source
		* - the texture style
		* - the texture matrix
		* This is cached so the bind group should only be created once per texture
		* @param texture - the texture you want the bindgroup for
		* @returns the bind group for the texture
		*/
		getTextureBindGroup(texture) {
			return this._bindGroupHash[texture.uid] || this._createTextureBindGroup(texture);
		}
		_createTextureBindGroup(texture) {
			const source = texture.source;
			this._bindGroupHash[texture.uid] = new BindGroup({
				0: source,
				1: source.style,
				2: new UniformGroup({ uTextureMatrix: {
					type: "mat3x3<f32>",
					value: texture.textureMatrix.mapCoord
				} })
			});
			return this._bindGroupHash[texture.uid];
		}
		getTextureView(texture) {
			const source = texture.source;
			source._gcLastUsed = this._renderer.gc.now;
			let gpuData = source._gpuData[this._renderer.uid];
			if (!gpuData) {
				this.initSource(source);
				gpuData = source._gpuData[this._renderer.uid];
			}
			gpuData.textureView || (gpuData.textureView = gpuData.gpuTexture.createView({ dimension: source.viewDimension }));
			return gpuData.textureView;
		}
		generateCanvas(texture) {
			const renderer = this._renderer;
			const commandEncoder = renderer.gpu.device.createCommandEncoder();
			const canvas = DOMAdapter.get().createCanvas();
			canvas.width = texture.source.pixelWidth;
			canvas.height = texture.source.pixelHeight;
			const context = canvas.getContext("webgpu");
			context.configure({
				device: renderer.gpu.device,
				usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC,
				format: DOMAdapter.get().getNavigator().gpu.getPreferredCanvasFormat(),
				alphaMode: "premultiplied"
			});
			commandEncoder.copyTextureToTexture({
				texture: renderer.texture.getGpuSource(texture.source),
				origin: {
					x: 0,
					y: 0
				}
			}, { texture: context.getCurrentTexture() }, {
				width: canvas.width,
				height: canvas.height
			});
			renderer.gpu.device.queue.submit([commandEncoder.finish()]);
			return canvas;
		}
		getPixels(texture) {
			const webGPUCanvas = this.generateCanvas(texture);
			const canvasAndContext = CanvasPool.getOptimalCanvasAndContext(webGPUCanvas.width, webGPUCanvas.height);
			const context = canvasAndContext.context;
			context.drawImage(webGPUCanvas, 0, 0);
			const { width, height } = webGPUCanvas;
			const imageData = context.getImageData(0, 0, width, height);
			const pixels = new Uint8ClampedArray(imageData.data.buffer);
			CanvasPool.returnCanvasAndContext(canvasAndContext);
			return {
				pixels,
				width,
				height
			};
		}
		destroy() {
			this._managedTextures.destroy();
			for (const k of Object.keys(this._bindGroupHash)) {
				const key = Number(k);
				this._bindGroupHash[key]?.destroy();
			}
			this._renderer = null;
			this._gpu = null;
			this._mipmapGenerator = null;
			this._gpuSamplers = null;
			this._bindGroupHash = null;
		}
	};
	/** @ignore */
	_GpuTextureSystem.extension = {
		type: [ExtensionType.WebGPUSystem],
		name: "texture"
	};
	/**
	* Optional uploaders registered via {@link ExtensionType.TextureUploaderWebGPU}. Each entry is
	* merged into {@link _uploads} at construction time, so import order matters: register the
	* extension before creating the renderer.
	* @internal
	*/
	_GpuTextureSystem.uploadExtensions = /* @__PURE__ */ Object.create(null);
	GpuTextureSystem = _GpuTextureSystem;
	extensions.handleByMap(ExtensionType.TextureUploaderWebGPU, GpuTextureSystem.uploadExtensions);
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/scene/graphics/gpu/GpuGraphicsAdaptor.mjs
var GpuGraphicsAdaptor;
var init_GpuGraphicsAdaptor = __esmMin((() => {
	init_Extensions();
	init_Matrix();
	init_getTextureBatchBindGroup();
	init_compileHighShaderToProgram();
	init_colorBit();
	init_generateTextureBatchBit();
	init_localUniformBit();
	init_roundPixelsBit();
	init_Shader();
	init_UniformGroup();
	GpuGraphicsAdaptor = class {
		constructor() {
			this._maxTextures = 0;
		}
		contextChange(renderer) {
			const localUniforms = new UniformGroup({
				uTransformMatrix: {
					value: new Matrix(),
					type: "mat3x3<f32>"
				},
				uColor: {
					value: new Float32Array([
						1,
						1,
						1,
						1
					]),
					type: "vec4<f32>"
				},
				uRound: {
					value: 0,
					type: "f32"
				}
			});
			this._maxTextures = renderer.limits.maxBatchableTextures;
			const gpuProgram = compileHighShaderGpuProgram({
				name: "graphics",
				bits: [
					colorBit,
					generateTextureBatchBit(this._maxTextures),
					localUniformBitGroup2,
					roundPixelsBit
				]
			});
			this.shader = new Shader({
				gpuProgram,
				resources: { localUniforms }
			});
		}
		execute(graphicsPipe, renderable) {
			const context = renderable.context;
			const shader = context.customShader || this.shader;
			const renderer = graphicsPipe.renderer;
			const { batcher, instructions } = renderer.graphicsContext.getContextRenderData(context);
			const encoder = renderer.encoder;
			encoder.setGeometry(batcher.geometry, shader.gpuProgram);
			const globalUniformsBindGroup = renderer.globalUniforms.bindGroup;
			encoder.setBindGroup(0, globalUniformsBindGroup, shader.gpuProgram);
			const localBindGroup = renderer.renderPipes.uniformBatch.getUniformBindGroup(shader.resources.localUniforms, true);
			encoder.setBindGroup(2, localBindGroup, shader.gpuProgram);
			const batches = instructions.instructions;
			let topology = null;
			for (let i = 0; i < instructions.instructionSize; i++) {
				const batch = batches[i];
				if (batch.topology !== topology) {
					topology = batch.topology;
					encoder.setPipelineFromGeometryProgramAndState(batcher.geometry, shader.gpuProgram, graphicsPipe.state, batch.topology);
				}
				shader.groups[1] = batch.bindGroup;
				if (!batch.gpuBindGroup) {
					const textureBatch = batch.textures;
					batch.bindGroup = getTextureBatchBindGroup(textureBatch.textures, textureBatch.count, this._maxTextures);
					batch.gpuBindGroup = renderer.bindGroup.getBindGroup(batch.bindGroup, shader.gpuProgram, 1);
				}
				encoder.setBindGroup(1, batch.bindGroup, shader.gpuProgram);
				encoder.renderPassEncoder.drawIndexed(batch.size, 1, batch.start);
			}
		}
		destroy() {
			this.shader.destroy(true);
			this.shader = null;
		}
	};
	/** @ignore */
	GpuGraphicsAdaptor.extension = {
		type: [ExtensionType.WebGPUPipesAdaptor],
		name: "graphics"
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/scene/mesh/gpu/GpuMeshAdapter.mjs
var GpuMeshAdapter;
var init_GpuMeshAdapter = __esmMin((() => {
	init_Extensions();
	init_Matrix();
	init_compileHighShaderToProgram();
	init_localUniformBit();
	init_roundPixelsBit();
	init_textureBit();
	init_Shader();
	init_Texture();
	init_warn();
	GpuMeshAdapter = class {
		init() {
			const gpuProgram = compileHighShaderGpuProgram({
				name: "mesh",
				bits: [
					localUniformBit,
					textureBit,
					roundPixelsBit
				]
			});
			this._shader = new Shader({
				gpuProgram,
				resources: {
					uTexture: Texture.EMPTY._source,
					uSampler: Texture.EMPTY._source.style,
					textureUniforms: { uTextureMatrix: {
						type: "mat3x3<f32>",
						value: new Matrix()
					} }
				}
			});
		}
		execute(meshPipe, mesh) {
			const renderer = meshPipe.renderer;
			let shader = mesh._shader;
			if (!shader) {
				shader = this._shader;
				shader.groups[2] = renderer.texture.getTextureBindGroup(mesh.texture);
			} else if (!shader.gpuProgram) {
				warn("Mesh shader has no gpuProgram", mesh.shader);
				return;
			}
			const gpuProgram = shader.gpuProgram;
			if (gpuProgram.autoAssignGlobalUniforms) shader.groups[0] = renderer.globalUniforms.bindGroup;
			if (gpuProgram.autoAssignLocalUniforms) {
				const localUniforms = meshPipe.localUniforms;
				shader.groups[1] = renderer.renderPipes.uniformBatch.getUniformBindGroup(localUniforms, true);
			}
			renderer.encoder.draw({
				geometry: mesh._geometry,
				shader,
				state: mesh.state
			});
		}
		destroy() {
			this._shader.destroy(true);
			this._shader = null;
		}
	};
	/** @ignore */
	GpuMeshAdapter.extension = {
		type: [ExtensionType.WebGPUPipesAdaptor],
		name: "mesh"
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/gpu/WebGPURenderer.mjs
var WebGPURenderer_exports = /* @__PURE__ */ __exportAll({ WebGPURenderer: () => WebGPURenderer });
var DefaultWebGPUSystems, DefaultWebGPUPipes, DefaultWebGPUAdapters, systems, renderPipes, renderPipeAdaptors, WebGPURenderer;
var init_WebGPURenderer = __esmMin((() => {
	init_Extensions();
	init_GpuGraphicsAdaptor();
	init_GpuMeshAdapter();
	init_GpuBatchAdaptor();
	init_AbstractRenderer();
	init_SharedSystems();
	init_types();
	init_BindGroupSystem();
	init_GpuBufferSystem();
	init_GpuColorMaskSystem();
	init_GpuDeviceSystem();
	init_GpuEncoderSystem();
	init_GpuLimitsSystem();
	init_GpuStencilSystem();
	init_GpuUboSystem();
	init_GpuUniformBatchPipe();
	init_PipelineSystem();
	init_GpuRenderTargetSystem();
	init_GpuShaderSystem();
	init_GpuStateSystem();
	init_GpuTextureSystem();
	DefaultWebGPUSystems = [
		...SharedSystems,
		GpuUboSystem,
		GpuEncoderSystem,
		GpuDeviceSystem,
		GpuLimitsSystem,
		GpuBufferSystem,
		GpuTextureSystem,
		GpuRenderTargetSystem,
		GpuShaderSystem,
		GpuStateSystem,
		PipelineSystem,
		GpuColorMaskSystem,
		GpuStencilSystem,
		BindGroupSystem
	];
	DefaultWebGPUPipes = [...SharedRenderPipes, GpuUniformBatchPipe];
	DefaultWebGPUAdapters = [
		GpuBatchAdaptor,
		GpuMeshAdapter,
		GpuGraphicsAdaptor
	];
	systems = [];
	renderPipes = [];
	renderPipeAdaptors = [];
	extensions.handleByNamedList(ExtensionType.WebGPUSystem, systems);
	extensions.handleByNamedList(ExtensionType.WebGPUPipes, renderPipes);
	extensions.handleByNamedList(ExtensionType.WebGPUPipesAdaptor, renderPipeAdaptors);
	extensions.add(...DefaultWebGPUSystems, ...DefaultWebGPUPipes, ...DefaultWebGPUAdapters);
	WebGPURenderer = class extends AbstractRenderer {
		constructor() {
			const systemConfig = {
				name: "webgpu",
				type: RendererType.WEBGPU,
				systems,
				renderPipes,
				renderPipeAdaptors
			};
			super(systemConfig);
		}
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/scene/mesh-simple/MeshSimple.mjs
var MeshSimple;
var init_MeshSimple = __esmMin((() => {
	init_definedProps();
	init_Mesh();
	init_MeshGeometry();
	MeshSimple = class extends Mesh {
		/**
		* @param options - Options to be used for construction
		*/
		constructor(options) {
			const { texture, vertices, uvs, indices, topology, ...rest } = options;
			const geometry = new MeshGeometry(definedProps({
				positions: vertices,
				uvs,
				indices,
				topology
			}));
			super(definedProps({
				...rest,
				texture,
				geometry
			}));
			this.autoUpdate = true;
			this.onRender = this._render;
		}
		/**
		* The vertex positions of the mesh as a TypedArray. Each vertex is represented by two
		* consecutive values (x, y) in the array. Changes to these values will update the mesh's shape.
		* @example
		* ```ts
		* // Read vertex positions
		* const vertices = mesh.vertices;
		* console.log('First vertex:', vertices[0], vertices[1]);
		*
		* // Modify vertices directly
		* vertices[0] += 10;  // Move first vertex right
		* vertices[1] -= 20;  // Move first vertex up
		*
		* // Animate vertices
		* app.ticker.add(() => {
		*     const time = performance.now() / 1000;
		*     const vertices = mesh.vertices;
		*
		*     // Wave motion
		*     for (let i = 0; i < vertices.length; i += 2) {
		*         vertices[i + 1] = Math.sin(time + i * 0.5) * 20;
		*     }
		* });
		* ```
		* @see {@link MeshSimple#autoUpdate} For controlling vertex buffer updates
		* @see {@link MeshGeometry#getBuffer} For direct buffer access
		*/
		get vertices() {
			return this.geometry.getBuffer("aPosition").data;
		}
		set vertices(value) {
			this.geometry.getBuffer("aPosition").data = value;
		}
		_render() {
			if (this.autoUpdate) this.geometry.getBuffer("aPosition").update();
		}
	};
}));
//#endregion
//#region port/v2/node_modules/pixi.js/lib/index.mjs
var init_lib = __esmMin((() => {
	init_browserExt();
	init_webworkerExt();
	init_Extensions();
	init_init$2();
	init_init$3();
	init_Application();
	init_ResizePlugin();
	init_TickerPlugin();
	init_preload_helper();
	init_isWebGLSupported();
	init_isWebGPUSupported();
	init_colorMatrixFilter_frag();
	init_colorMatrixFilter_wgsl();
	init_ColorMatrixFilter();
	init_Rectangle();
	init_Mesh();
	init_BatchableMesh();
	init_MeshGeometry();
	init_isSafari();
	init_GlBatchAdaptor();
	init_GpuBatchAdaptor();
	init_autoDetectRenderer();
	init_const$1();
	init_GlBuffer();
	init_GlBufferSystem();
	init_GlContextSystem();
	init_GlGeometrySystem();
	init_getGlTypeFromFormat();
	init_GlBackBufferSystem();
	init_GlColorMaskSystem();
	init_GlEncoderSystem();
	init_GlLimitsSystem();
	init_GlRenderTarget();
	init_GlStencilSystem();
	init_GlUboSystem();
	init_GlRenderTargetAdaptor();
	init_GlRenderTargetSystem();
	init_GenerateShaderSyncCode();
	init_GlProgramData();
	init_GlShaderSystem();
	init_GlUniformGroupSystem();
	init_extractAttributesFromGlProgram();
	init_generateProgram();
	init_getUniformData();
	init_mapType();
	init_createUboElementsSTD40();
	init_createUboSyncSTD40();
	init_generateArraySyncSTD40();
	init_generateUniformsSync();
	init_generateUniformsSyncTypes();
	init_GlStateSystem();
	init_mapWebGLBlendModesToPixi();
	init_const();
	init_GlTexture();
	init_GlTextureSystem();
	init_glUploadBufferImageResource();
	init_glUploadCompressedTextureResource();
	init_glUploadCubeTextureResource();
	init_glUploadImageResource();
	init_glUploadVideoResource();
	init_applyStyleParams();
	init_mapFormatToGlInternalFormat();
	init_pixiToGlMaps();
	init_WebGLRenderer();
	init_BindGroupSystem();
	init_GpuBufferSystem();
	init_UboBatch();
	init_GpuColorMaskSystem();
	init_GpuDeviceSystem();
	init_GpuEncoderSystem();
	init_GpuLimitsSystem();
	init_GpuStencilSystem();
	init_GpuUboSystem();
	init_GpuUniformBatchPipe();
	init_PipelineSystem();
	init_GpuRenderTarget();
	init_GpuRenderTargetAdaptor();
	init_GpuRenderTargetSystem();
	init_GpuShaderSystem();
	init_createUboElementsWGSL();
	init_createUboSyncFunctionWGSL();
	init_generateArraySyncWGSL();
	init_GpuBlendModesToPixi();
	init_GpuStateSystem();
	init_GpuTextureSystem();
	init_gpuUploadBufferImageResource();
	init_gpuUploadCompressedTextureResource();
	init_gpuUploadCubeTextureResource();
	init_gpuUploadImageSource();
	init_gpuUploadVideoSource();
	init_GpuMipmapGenerator();
	init_WebGPURenderer();
	init_ImageSource();
	init_Texture();
	init_textureFrom();
	init_Container();
	init_GlGraphicsAdaptor();
	init_GpuGraphicsAdaptor();
	init_Graphics();
	init_MeshSimple();
	init_GlMeshAdaptor();
	init_GpuMeshAdapter();
	init_MeshPipe();
	init_Sprite();
	init_eventemitter3();
	extensions.add(browserExt, webworkerExt);
}));
//#endregion
//#region port/v2/packages/art/src/earth-resident-plan.ts
function deepFreeze(value) {
	if (value !== null && typeof value === "object") {
		for (const child of Object.values(value)) deepFreeze(child);
		Object.freeze(value);
	}
	return value;
}
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
var EARTH_RESIDENT_LAYER_PLAN_JSON_V1, EARTH_RESIDENT_LAYER_PLAN_V1;
var init_earth_resident_plan = __esmMin((() => {
	EARTH_RESIDENT_LAYER_PLAN_JSON_V1 = "{\"schema\":\"cf.art.earth-resident-layer.v1\",\"sceneId\":\"painted-earth-riverbank-v1\",\"width\":960,\"height\":430,\"worldKey\":\"CF1|g:999@90,-60|s:424242@560,170|p:133#2\",\"environmentFingerprint\":\"cwe1:148:50c1b7d6\",\"fullRosterFingerprint\":\"cwr1:19:6305:58e079f2\",\"residents\":[{\"name\":\"Civet\",\"kingdom\":\"fauna\",\"genome\":{\"seed\":3212817920,\"kingdom\":\"fauna\",\"color\":14,\"form\":12,\"body\":13,\"loco\":6,\"trait\":14,\"size\":4,\"diet\":5,\"head\":5,\"limbs\":3,\"skin\":8,\"tail\":1,\"pattern\":0,\"eyes\":5,\"behavior\":9,\"habitat\":5,\"detail\":4,\"accent\":3,\"temper\":1,\"sense\":7,\"repro\":7,\"life\":5,\"metab\":4,\"lumin\":true,\"gen\":0,\"heat\":1,\"_earthName\":\"Civet\",\"_cradle\":1},\"x\":0.72,\"groundY\":0.77,\"width\":0.15,\"flip\":false,\"family\":\"mammal\"},{\"name\":\"Persimmon\",\"kingdom\":\"flora\",\"genome\":{\"seed\":2058951517,\"kingdom\":\"flora\",\"color\":2,\"form\":17,\"body\":4,\"loco\":0,\"trait\":9,\"size\":3,\"diet\":2,\"head\":7,\"limbs\":1,\"skin\":7,\"tail\":1,\"pattern\":6,\"eyes\":1,\"behavior\":10,\"habitat\":5,\"detail\":9,\"accent\":2,\"temper\":4,\"sense\":3,\"repro\":5,\"life\":4,\"metab\":5,\"lumin\":false,\"gen\":0,\"heat\":1,\"_earthName\":\"Persimmon\",\"_cradle\":1},\"x\":0.13,\"groundY\":0.78,\"width\":0.21,\"flip\":false,\"family\":\"tree\"},{\"name\":\"Platypus\",\"kingdom\":\"fauna\",\"genome\":{\"seed\":4049771185,\"kingdom\":\"fauna\",\"color\":13,\"form\":14,\"body\":12,\"loco\":1,\"trait\":15,\"size\":2,\"diet\":4,\"head\":0,\"limbs\":0,\"skin\":6,\"tail\":4,\"pattern\":7,\"eyes\":0,\"behavior\":3,\"habitat\":9,\"detail\":8,\"accent\":16,\"temper\":7,\"sense\":4,\"repro\":6,\"life\":3,\"metab\":0,\"lumin\":false,\"gen\":0,\"heat\":1,\"_earthName\":\"Platypus\",\"_cradle\":1},\"x\":0.43,\"groundY\":0.86,\"width\":0.2,\"flip\":true,\"family\":\"mammal\"},{\"name\":\"Frog\",\"kingdom\":\"fauna\",\"genome\":{\"seed\":1193089256,\"kingdom\":\"fauna\",\"color\":0,\"form\":12,\"body\":10,\"loco\":11,\"trait\":19,\"size\":0,\"diet\":5,\"head\":9,\"limbs\":4,\"skin\":3,\"tail\":1,\"pattern\":4,\"eyes\":1,\"behavior\":0,\"habitat\":17,\"detail\":7,\"accent\":4,\"temper\":8,\"sense\":5,\"repro\":5,\"life\":0,\"metab\":2,\"lumin\":false,\"gen\":0,\"heat\":1,\"_earthName\":\"Frog\",\"_cradle\":1},\"x\":0.25,\"groundY\":0.87,\"width\":0.07,\"flip\":false,\"family\":\"amphibian\"},{\"name\":\"Devil's Club\",\"kingdom\":\"flora\",\"genome\":{\"seed\":1714376717,\"kingdom\":\"flora\",\"color\":14,\"form\":12,\"body\":2,\"loco\":0,\"trait\":11,\"size\":1,\"diet\":4,\"head\":8,\"limbs\":5,\"skin\":6,\"tail\":1,\"pattern\":7,\"eyes\":2,\"behavior\":3,\"habitat\":6,\"detail\":9,\"accent\":15,\"temper\":5,\"sense\":5,\"repro\":6,\"life\":5,\"metab\":1,\"lumin\":false,\"gen\":0,\"heat\":1,\"_earthName\":\"Devil's Club\",\"_cradle\":1},\"x\":0.87,\"groundY\":0.88,\"width\":0.16,\"flip\":false,\"family\":\"shrub\"},{\"name\":\"Cranberry\",\"kingdom\":\"flora\",\"genome\":{\"seed\":1741924755,\"kingdom\":\"flora\",\"color\":4,\"form\":4,\"body\":9,\"loco\":0,\"trait\":9,\"size\":3,\"diet\":1,\"head\":9,\"limbs\":3,\"skin\":0,\"tail\":5,\"pattern\":0,\"eyes\":5,\"behavior\":7,\"habitat\":0,\"detail\":4,\"accent\":10,\"temper\":7,\"sense\":9,\"repro\":2,\"life\":0,\"metab\":2,\"lumin\":false,\"gen\":0,\"heat\":1,\"_earthName\":\"Cranberry\",\"_cradle\":1},\"x\":0.34,\"groundY\":0.9,\"width\":0.11,\"flip\":false,\"family\":\"shrub\"}]}";
	EARTH_RESIDENT_LAYER_PLAN_V1 = deepFreeze(JSON.parse(EARTH_RESIDENT_LAYER_PLAN_JSON_V1));
}));
//#endregion
//#region port/v2/tools/painted-creature/civet-rig.ts
/** Complete canonical genome admission; a name, seed or shortened phenotype is insufficient. */
function isPaintedCivetIdentity(genome) {
	try {
		return JSON.stringify(snapshotEarthLayerDataV1(genome)) === canonicalJSON;
	} catch {
		return false;
	}
}
/** One fixed-size allocation. Authoring UVs are never regenerated from motion or genome fields. */
function createCivetMesh$1(genome) {
	if (!isPaintedCivetIdentity(genome)) throw new TypeError("unsupported painted Civet identity");
	const rest = /* @__PURE__ */ new Float32Array(3234), indices = /* @__PURE__ */ new Uint32Array(9216);
	for (let row = 0; row <= 32; row++) for (let column = 0; column <= 48; column++) {
		const i = (row * 49 + column) * 2;
		rest[i] = column / 48;
		rest[i + 1] = row / 32;
	}
	let k = 0;
	for (let row = 0; row < 32; row++) for (let column = 0; column < 48; column++) {
		const a = row * 49 + column, b = a + 1, d = a + 48 + 1, c = d + 1;
		indices.set([
			a,
			b,
			c,
			a,
			c,
			d
		], k);
		k += 6;
	}
	return {
		vertices: rest.slice(),
		rest,
		uvs: rest.slice(),
		indices
	};
}
var canonical, canonicalJSON, CIVET_SOURCE_GENOME_JSON;
var init_civet_rig = __esmMin((() => {
	init_earth_resident_plan();
	canonical = EARTH_RESIDENT_LAYER_PLAN_V1.residents.find((row) => row.name === "Civet");
	canonicalJSON = JSON.stringify(canonical.genome);
	CIVET_SOURCE_GENOME_JSON = canonicalJSON;
	Object.freeze({
		rest: 0,
		breathe: 4200,
		strike: 1e3,
		recoil: 700
	});
	Object.freeze({
		breath: 0,
		drive: 0,
		tail: 0
	});
	Object.freeze({
		footLockY: .75,
		legBlendY: .62,
		headStartX: .64,
		headRigidX: .76,
		neckPivotX: .69,
		neckPivotY: .48,
		tailRootX: .3
	});
}));
//#endregion
//#region port/v2/tools/painted-creature/civet-articulated-rig.ts
function track(t, keys) {
	for (let i = 1; i < keys.length; i++) {
		const a = keys[i - 1], b = keys[i];
		if (t <= b[0]) return a[1] + (b[1] - a[1]) * smooth(a[0], b[0], t);
	}
	return 0;
}
function sampleCivetPose(clip, elapsedMs, policy) {
	if (!Object.hasOwn(CIVET_CLIP_MS, clip) || !Number.isFinite(elapsedMs) || elapsedMs < 0) throw new TypeError("invalid finite articulated Civet clip sample");
	if (!policy.effectsOn || !policy.fullMotion || !policy.visible || clip === "rest") return REST;
	const duration = CIVET_CLIP_MS[clip];
	if (elapsedMs === 0 || elapsedMs >= duration) return REST;
	const t = elapsedMs / duration;
	if (clip === "breathe") return {
		breath: Math.sin(2 * Math.PI * t) ** 2,
		drive: 0,
		tail: .25 * Math.sin(Math.PI * t) ** 2 * Math.sin(4 * Math.PI * t - .5)
	};
	const drive = track(t, clip === "strike" ? STRIKE : RECOIL);
	return {
		breath: 0,
		drive,
		tail: -drive * .65
	};
}
function validPose(pose) {
	if (!Number.isFinite(pose.breath) || !Number.isFinite(pose.drive) || !Number.isFinite(pose.tail) || pose.breath < 0 || pose.breath > 1 || Math.abs(pose.drive) > 1 || Math.abs(pose.tail) > 1) throw new TypeError("invalid articulated Civet pose");
}
function rotation(out, index, x, y, angle, dx = 0, dy = 0) {
	const k = index * 6, a = Math.cos(angle), b = Math.sin(angle) * 1.5, c = -Math.sin(angle) / 1.5;
	out[k] = a;
	out[k + 1] = b;
	out[k + 2] = c;
	out[k + 3] = a;
	out[k + 4] = x - a * x - c * y + dx;
	out[k + 5] = y - b * x - a * y + dy;
}
/** Child matrix is composed in its parent's local frame; joints inherit their
* ancestor's rotation/translation instead of independently sliding image strips. */
function inherit(out, child, parent) {
	const c = child * 6, p = parent * 6;
	const a = out[c], b = out[c + 1], cc = out[c + 2], d = out[c + 3], x = out[c + 4], y = out[c + 5];
	out[c] = out[p] * a + out[p + 2] * b;
	out[c + 1] = out[p + 1] * a + out[p + 3] * b;
	out[c + 2] = out[p] * cc + out[p + 2] * d;
	out[c + 3] = out[p + 1] * cc + out[p + 3] * d;
	out[c + 4] = out[p] * x + out[p + 2] * y + out[p + 4];
	out[c + 5] = out[p + 1] * x + out[p + 3] * y + out[p + 5];
}
function prepare(out, pose) {
	const crouch = Math.max(0, -pose.drive), thrust = Math.max(0, pose.drive);
	rotation(out, 0, .69, .4, -.055 * pose.drive - .012 * pose.breath, .033 * pose.drive, .013 * crouch - .008 * thrust - .006 * pose.breath);
	for (let i = 0; i < LIMBS.length; i++) {
		const limb = LIMBS[i], upper = 1 + i * 2, lower = upper + 1;
		const effort = crouch - thrust * .6;
		rotation(out, upper, limb.x, limb.y, limb.upper * effort);
		rotation(out, lower, limb.kneeX, limb.kneeY, limb.lower * effort);
		inherit(out, lower, upper);
	}
	rotation(out, 9, .3, .44, .045 * pose.tail, .007 * pose.drive, .011 * crouch - .006 * pose.breath);
	rotation(out, 10, .215, .56, .085 * pose.tail);
	inherit(out, 10, 9);
	rotation(out, 11, .12, .69, .14 * pose.tail);
	inherit(out, 11, 10);
}
function deltaX(bones, bone, x, y) {
	const k = bone * 6;
	return bones[k] * x + bones[k + 2] * y + bones[k + 4] - x;
}
function deltaY(bones, bone, x, y) {
	const k = bone * 6;
	return bones[k + 1] * x + bones[k + 3] * y + bones[k + 5] - y;
}
function writePoint(out, offset, x, y, pose, bones) {
	if (!pose.breath && !pose.drive && !pose.tail || x >= 1 / 3 && y >= .75) {
		out[offset] = x;
		out[offset + 1] = y;
		return;
	}
	const planted = 1 - smooth(.27, 1 / 3, x) * smooth(.64, .75, y);
	const body = smooth(.22, .34, x) * (1 - smooth(.72, .8, x));
	const head = smooth(.64, .77, x);
	const crouch = Math.max(0, -pose.drive), thrust = Math.max(0, pose.drive);
	let dx = (.011 * pose.drive + .01 * pose.breath * (x - .5)) * body;
	let dy = (.022 * crouch - .008 * thrust - .02 * pose.breath * (1 - smooth(.54, .7, y))) * body;
	let jointX = 0, jointY = 0, totalWeight = 0;
	for (let i = 0; i < LIMBS.length; i++) {
		const limb = LIMBS[i], axisX = limb.x + (limb.kneeX - limb.x) * clamp((y - limb.y) / (limb.kneeY - limb.y));
		const weight = .68 * (1 - smooth(.018, .072, Math.abs(x - axisX))) * smooth(limb.y - .075, limb.y + .025, y) * (1 - smooth(.715, .75, y));
		const lower = smooth(limb.kneeY - .055, limb.kneeY + .035, y), upperBone = 1 + i * 2;
		jointX += weight * ((1 - lower) * deltaX(bones, upperBone, x, y) + lower * deltaX(bones, upperBone + 1, x, y));
		jointY += weight * ((1 - lower) * deltaY(bones, upperBone, x, y) + lower * deltaY(bones, upperBone + 1, x, y));
		totalWeight += weight;
	}
	dx += jointX / Math.max(1, totalWeight);
	dy += jointY / Math.max(1, totalWeight);
	dx = dx * (1 - head) + deltaX(bones, 0, x, y) * head;
	dy = dy * (1 - head) + deltaY(bones, 0, x, y) * head;
	const tail = (1 - smooth(.24, .34, x)) * smooth(.3, .48, y);
	const mid = 1 - smooth(.15, .245, x), tip = 1 - smooth(.06, .16, x);
	const tailX = (1 - mid) * deltaX(bones, 9, x, y) + mid * (1 - tip) * deltaX(bones, 10, x, y) + mid * tip * deltaX(bones, 11, x, y);
	const tailY = (1 - mid) * deltaY(bones, 9, x, y) + mid * (1 - tip) * deltaY(bones, 10, x, y) + mid * tip * deltaY(bones, 11, x, y);
	out[offset] = x + planted * (dx * (1 - tail) + tailX * tail);
	out[offset + 1] = y + planted * (dy * (1 - tail) + tailY * tail);
}
/** Retains the original complete29-field admission and fixed connected topology.
* All animation scratch belongs to this mesh and is allocated exactly once. */
function createCivetMesh(genome) {
	return {
		...createCivetMesh$1(genome),
		bones: new Float64Array(CIVET_CAPACITY.matrixScalars)
	};
}
/** Reuses the mesh's output and matrix storage; source UVs/rest/indices are read
* only, and applying rest always restores their exact Float32 positions. */
function applyCivetPose(mesh, pose) {
	validPose(pose);
	if (!pose.breath && !pose.drive && !pose.tail) {
		mesh.vertices.set(mesh.rest);
		return;
	}
	prepare(mesh.bones, pose);
	for (let i = 0; i < mesh.vertices.length; i += 2) writePoint(mesh.vertices, i, mesh.rest[i], mesh.rest[i + 1], pose, mesh.bones);
}
var CIVET_RIG_VERSION, CIVET_CLIP_MS, REST, CIVET_CAPACITY, clamp, smooth, STRIKE, RECOIL, LIMBS;
var init_civet_articulated_rig = __esmMin((() => {
	init_civet_rig();
	CIVET_RIG_VERSION = "cf.painted-civet.articulated-study.v1";
	CIVET_CLIP_MS = Object.freeze({
		rest: 0,
		breathe: 6e3,
		strike: 1600,
		recoil: 1100
	});
	REST = Object.freeze({
		breath: 0,
		drive: 0,
		tail: 0
	});
	CIVET_CAPACITY = Object.freeze({
		vertices: 1617,
		triangles: 3072,
		vertexScalars: 3234,
		indexScalars: 9216,
		bones: 12,
		matrixScalars: 72,
		ownedTypedArrayBytes: 76248
	});
	Object.freeze({
		sourceWidth: 768,
		sourceHeight: 512,
		footLockX: 1 / 3,
		footLockY: .75,
		footBlendX: .27,
		footBlendY: .64,
		neckPivotX: .69,
		neckPivotY: .4,
		headStartX: .64,
		headRigidX: .77,
		tailRootX: .3,
		tailRootY: .44,
		tailMidX: .215,
		tailMidY: .56,
		tailTipJointX: .12,
		tailTipJointY: .69
	});
	Object.freeze({
		breatheInhale1: 1500,
		breatheExhale: 3e3,
		breatheInhale2: 4500,
		strikeAnticipation: 448,
		strikeThrust: 864,
		recoilPeak: 308
	});
	clamp = (x) => Math.max(0, Math.min(1, x));
	smooth = (lo, hi, x) => {
		const t = clamp((x - lo) / (hi - lo));
		return t * t * (3 - 2 * t);
	};
	STRIKE = Object.freeze([
		[0, 0],
		[.28, -.85],
		[.54, 1],
		[.78, -.22],
		[1, 0]
	]);
	RECOIL = Object.freeze([
		[0, 0],
		[.28, -.85],
		[.65, .15],
		[1, 0]
	]);
	LIMBS = Object.freeze([
		Object.freeze({
			x: .385,
			y: .52,
			kneeX: .37,
			kneeY: .675,
			upper: .1,
			lower: -.17
		}),
		Object.freeze({
			x: .433,
			y: .57,
			kneeX: .435,
			kneeY: .7,
			upper: -.075,
			lower: .14
		}),
		Object.freeze({
			x: .568,
			y: .54,
			kneeX: .576,
			kneeY: .695,
			upper: -.075,
			lower: .15
		}),
		Object.freeze({
			x: .62,
			y: .49,
			kneeX: .637,
			kneeY: .675,
			upper: -.1,
			lower: .19
		})
	]);
}));
//#endregion
//#region audits/CIVET_WATER_AND_MOTION_20260908/water-owner.ts
function fields(value, names) {
	const actual = Object.keys(value).sort(), expected = [...names].sort();
	requireFact(actual.length === expected.length && actual.every((name, i) => name === expected[i]), "Water recipe fields changed");
}
function admitRecipe(input) {
	const recipe = JSON.parse(JSON.stringify(snapshotEarthLayerDataV1(input)));
	fields(recipe, [
		"schema",
		"worldKey",
		"plan",
		"civetAsset",
		"civetPaws"
	]);
	requireFact(recipe.schema === "cf-civet-water-scene/v1", "Unknown Civet water schema");
	requireFact(JSON.stringify(recipe.plan) === EARTH_RESIDENT_LAYER_PLAN_JSON_V1, "Complete canonical Earth plan mismatch");
	requireFact(recipe.worldKey === recipe.plan.worldKey, "Civet water world mismatch");
	const asset = recipe.civetAsset, b = asset.alphaBounds;
	fields(asset, [
		"width",
		"height",
		"alphaBounds",
		"contactY",
		"sha256"
	]);
	fields(b, [
		"x0",
		"y0",
		"x1",
		"y1"
	]);
	requireFact(Number.isInteger(asset.width) && Number.isInteger(asset.height) && asset.width > 0 && asset.height > 0 && asset.width * asset.height <= 2e6, "Unbounded Civet source");
	requireFact([
		b.x0,
		b.y0,
		b.x1,
		b.y1,
		asset.contactY
	].every(Number.isInteger) && b.x0 > 0 && b.y0 > 0 && b.x1 < asset.width - 1 && b.y1 < asset.height - 1 && b.x1 > b.x0 && b.y1 > b.y0 && asset.contactY >= b.y0 && asset.contactY <= b.y1, "Invalid Civet source alpha/contact bounds");
	requireFact(/^[a-f0-9]{64}$/.test(asset.sha256), "Civet encoded hash absent");
	requireFact(Array.isArray(recipe.civetPaws) && recipe.civetPaws.length === 4, "Four measured Civet paw regions required");
	recipe.civetPaws.forEach((paw, i) => {
		fields(paw, [
			"x0",
			"y0",
			"x1",
			"y1"
		]);
		requireFact([
			paw.x0,
			paw.y0,
			paw.x1,
			paw.y1
		].every(Number.isFinite) && paw.x0 >= 0 && paw.x1 <= 1 && paw.x1 > paw.x0 && paw.y0 >= 0 && paw.y1 <= 1 && paw.y1 > paw.y0 && paw.y0 * asset.height >= asset.contactY - 32 && paw.y0 * asset.height <= asset.contactY, "Invalid normalized lower-paw region");
		if (i) requireFact(recipe.civetPaws[i - 1].x1 <= paw.x0, "Paw regions overlap or changed order");
	});
	return freeze(recipe);
}
function checkTexture(texture, width, height) {
	requireFact(!texture.destroyed && !texture.source.destroyed && texture.width === width && texture.height === height && texture.frame.x === 0 && texture.frame.y === 0 && texture.frame.width === width && texture.frame.height === height && !texture.trim && texture.rotate === 0, "Water owner requires the borrowed full-image texture");
}
function measureContacts(recipe, civet) {
	const asset = recipe.civetAsset;
	checkTexture(civet.texture, asset.width, asset.height);
	const bitmap = civet.texture.source.resource;
	requireFact(bitmap instanceof ImageBitmap && bitmap.width === asset.width && bitmap.height === asset.height, "Water contact measurement requires the already decoded Civet bitmap");
	const resident = recipe.plan.residents.find((row) => row.name === "Civet");
	const width = asset.alphaBounds.x1 - asset.alphaBounds.x0 + 1;
	const scale = resident.width * 960 / width;
	const originX = resident.x * 960 - (asset.alphaBounds.x0 + width / 2) * scale;
	const originY = resident.groundY * 430 - (asset.contactY + 1) * scale;
	requireFact(Math.abs(civet.x - originX) < 1e-6 && Math.abs(civet.y - originY) < 1e-6 && Math.abs(civet.scale.x - asset.width * scale) < 1e-6 && Math.abs(civet.scale.y - asset.height * scale) < 1e-6, "Civet alpha/contact placement changed");
	const scratch = new OffscreenCanvas(asset.width, asset.height);
	try {
		const context = scratch.getContext("2d");
		requireFact(context, "Paw readback unavailable");
		context.drawImage(bitmap, 0, 0);
		const rgba = context.getImageData(0, 0, asset.width, asset.height).data;
		let x0 = asset.width, y0 = asset.height, x1 = -1, y1 = -1, contactY = -1;
		for (let y = 0; y < asset.height; y++) for (let x = 0; x < asset.width; x++) {
			const alpha = rgba[(y * asset.width + x) * 4 + 3];
			if (alpha > 12) {
				x0 = Math.min(x0, x);
				y0 = Math.min(y0, y);
				x1 = Math.max(x1, x);
				y1 = Math.max(y1, y);
			}
			if (alpha >= 230) contactY = y;
		}
		requireFact(JSON.stringify({
			x0,
			y0,
			x1,
			y1
		}) === JSON.stringify(asset.alphaBounds) && contactY === asset.contactY, "Actual Civet alpha/contact differs from sealed recipe");
		return freeze(recipe.civetPaws.map((paw, index) => {
			let left = asset.width, top = asset.height, right = -1, bottom = -1, solid = 0;
			for (let y = Math.floor(paw.y0 * asset.height); y < Math.min(asset.height, Math.ceil(paw.y1 * asset.height)); y++) for (let x = Math.floor(paw.x0 * asset.width); x < Math.min(asset.width, Math.ceil(paw.x1 * asset.width)); x++) {
				if (rgba[(y * asset.width + x) * 4 + 3] < 230) continue;
				left = Math.min(left, x);
				top = Math.min(top, y);
				right = Math.max(right, x);
				bottom = Math.max(bottom, y);
				solid++;
			}
			requireFact(solid > 0 && bottom >= asset.contactY - 6, "Declared paw lacks actual solid contact ink");
			return {
				id: `Civet:paw:${index}`,
				paw: index,
				x: originX + (left + right + 1) * .5 * scale,
				y: originY + (bottom + 1) * scale,
				radiusX: Math.max(2.2, Math.min(7, (right - left + 1) * scale * .48)),
				solidPixels: solid,
				observedSourceBounds: {
					x0: left,
					y0: top,
					x1: right,
					y1: bottom
				}
			};
		}));
	} finally {
		scratch.width = scratch.height = 1;
	}
}
function lightMatrix(strong) {
	const saturation = .9, brightness = strong ? 1.7 : .9;
	const weights = [
		.2126,
		.7152,
		.0722
	], gains = [
		.985,
		1,
		1.015
	], values = [];
	for (let channel = 0; channel < 3; channel++) {
		for (let input = 0; input < 3; input++) values.push((weights[input] * .09999999999999998 + (input === channel ? saturation : 0)) * brightness * gains[channel]);
		values.push(0, strong ? .04 : [
			.002,
			.003,
			.004
		][channel]);
	}
	values.push(0, 0, 0, 1, 0);
	return values;
}
function sameFilters(a, b) {
	if ((a?.length ?? 0) === 0 || (b?.length ?? 0) === 0) return (a?.length ?? 0) === 0 && (b?.length ?? 0) === 0;
	return a.length === b.length && a.every((value, i) => value === b[i]);
}
function transform(node) {
	return {
		x: node.x,
		y: node.y,
		sx: node.scale.x,
		sy: node.scale.y,
		rotation: node.rotation,
		px: node.pivot.x,
		py: node.pivot.y,
		kx: node.skew.x,
		ky: node.skew.y
	};
}
function assertIdentityTransform(node) {
	requireFact(node.x === 0 && node.y === 0 && node.scale.x === 1 && node.scale.y === 1 && node.rotation === 0 && node.pivot.x === 0 && node.pivot.y === 0 && node.skew.x === 0 && node.skew.y === 0, "Borrowed Earth child transform changed");
}
function attachCivetWaterScene(input) {
	const recipe = admitRecipe(input.recipe), recipeJSON = JSON.stringify(recipe);
	requireFact(input.enabled === void 0 || typeof input.enabled === "boolean", "enabled must be boolean");
	requireFact(input.allowTestControls === void 0 || typeof input.allowTestControls === "boolean", "test flag must be boolean");
	const allowTests = input.allowTestControls === true;
	const { earth, background, civetActor } = input;
	requireFact(earth instanceof Container && background instanceof Sprite && civetActor instanceof Container && !earth.destroyed && !background.destroyed && !civetActor.destroyed, "Borrowed water scene is not live");
	requireFact(background.parent === earth && civetActor.parent === earth && earth.getChildIndex(background) < earth.getChildIndex(civetActor), "Borrowed scene parent/order changed");
	assertIdentityTransform(background);
	assertIdentityTransform(civetActor);
	requireFact(background.anchor.x === 0 && background.anchor.y === 0 && background.alpha === 1 && background.tint === 16777215 && !background.filters?.length && !background.mask, "Waterline requires the unchanged, unfiltered background texels");
	checkTexture(background.texture, 960, 430);
	requireFact(civetActor.children.length === 1 && civetActor.children[0] instanceof MeshSimple, "Civet actor must retain exactly its existing mesh");
	const civet = civetActor.children[0];
	requireFact(civet.rotation === 0 && civet.pivot.x === 0 && civet.pivot.y === 0 && civet.skew.x === 0 && civet.skew.y === 0, "Borrowed Civet orientation changed");
	const declaredContacts = measureContacts(recipe, civet);
	const borrowed = [background, civetActor].map((node) => ({
		node,
		parent: node.parent,
		index: earth.getChildIndex(node),
		filters: node.filters,
		transform: JSON.stringify(transform(node))
	}));
	const originalFilters = borrowed[1].filters, originalMeshTransform = JSON.stringify(transform(civet));
	const sources = [background.texture, civet.texture].map((texture) => ({
		texture,
		source: texture.source,
		resource: texture.source.resource
	}));
	const declaredRegions = freeze(declaredContacts.flatMap((contact) => {
		const { x, y, radiusX: r, paw, id } = contact;
		return [
			{
				id: id + ":shadow",
				paw,
				role: "submerged-shadow",
				geometry: {
					kind: "ellipse-rings",
					x,
					y: y + .6,
					radiusX: r,
					radiusY: 1.2,
					rings: 6,
					alpha: .085
				},
				bounds: {
					x0: x - r - 1,
					y0: y - 1.6,
					x1: x + r + 1,
					y1: y + 2.8
				}
			},
			{
				id: id + ":waterline",
				paw,
				role: "waterline",
				geometry: {
					kind: "polygon",
					alpha: .72,
					points: [
						x - r - .6,
						y - .75,
						x - r * .35,
						y - 1.05,
						x + r + .6,
						y - .55,
						x + r + .6,
						y + .5,
						x - r - .6,
						y + .5
					]
				},
				bounds: {
					x0: x - r - 1.7,
					y0: y - 2.2,
					x1: x + r + 1.7,
					y1: y + 1.7
				}
			},
			{
				id: id + ":ripples",
				paw,
				role: "broken-ripple",
				geometry: {
					kind: "quadratic-arcs",
					curves: [{
						start: [x - r * 1.35, y + .15],
						control: [x - r * .9, y + 1.45],
						end: [x - r * .28, y + 1.45],
						width: .65,
						alpha: .24,
						color: 11057080
					}, {
						start: [x + r * .24, y + 1.25],
						control: [x + r * .9, y + 1.35],
						end: [x + r * 1.35, y + .1],
						width: .55,
						alpha: .22,
						color: 11845822
					}]
				},
				bounds: {
					x0: x - r * 1.4 - 1.4,
					y0: y - 1.1,
					x1: x + r * 1.4 + 1.4,
					y1: y + 3
				}
			}
		];
	}));
	const shadowRoot = new Container(), surfaceRoot = new Container();
	shadowRoot.label = "civet-submerged-contact";
	surfaceRoot.label = "civet-water-surface";
	shadowRoot.eventMode = surfaceRoot.eventMode = "none";
	let filter;
	const allGraphics = [];
	const waterSprites = [];
	const rows = [];
	let enabled = input.enabled ?? true, testMode = "none", disposalRequested = false, disposed = false;
	const failures = [];
	function ownedGraphic(role, paw) {
		const graphic = new Graphics();
		allGraphics.push({
			graphic,
			context: graphic.context,
			role,
			paw
		});
		graphic.label = `Civet:paw:${paw}:${role}`;
		graphic.eventMode = "none";
		return graphic;
	}
	function apply() {
		requireFact(!disposalRequested && filter && !civetActor.destroyed && civetActor.parent === earth, "Water owner is inactive or borrowed actor changed");
		const withOwnedFilter = [...originalFilters ?? [], filter];
		requireFact(sameFilters(civetActor.filters, originalFilters) || sameFilters(civetActor.filters, withOwnedFilter), "Borrowed filter chain changed outside this water owner");
		civetActor.filters = enabled && testMode !== "noLight" ? withOwnedFilter : originalFilters ? [...originalFilters] : originalFilters;
		filter.matrix = lightMatrix(testMode === "strongLight");
		shadowRoot.visible = surfaceRoot.visible = enabled && testMode !== "noWater";
		const shifted = testMode === "shiftWater";
		shadowRoot.position.set(shifted ? 22 : 0, shifted ? 9 : 0);
		surfaceRoot.position.set(shifted ? 22 : 0, shifted ? 9 : 0);
		for (const row of rows) {
			const present = !(testMode === "missingPaw" && row.contact.paw === 3);
			row.shadow.visible = present && testMode !== "noShadows";
			row.sprite.visible = present && testMode !== "noOcclusion";
			row.ripple.visible = present && testMode !== "noRipples";
		}
	}
	function snapshot() {
		const matrix = filter && !filter._destroyed ? Array.from(filter.matrix) : null;
		return {
			schema: "cf-civet-water-owner/v1",
			enabled,
			testMode,
			disposalRequested,
			disposed,
			recipeJSON,
			declaredContacts,
			declaredRegions,
			lightingMatrix: matrix,
			alphaRow: matrix?.slice(15) ?? null,
			submergedRoot: {
				destroyed: shadowRoot.destroyed,
				parentIsEarth: shadowRoot.parent === earth,
				visible: !shadowRoot.destroyed && shadowRoot.visible,
				position: shadowRoot.destroyed ? null : {
					x: shadowRoot.x,
					y: shadowRoot.y
				}
			},
			surfaceRoot: {
				destroyed: surfaceRoot.destroyed,
				parentIsEarth: surfaceRoot.parent === earth,
				visible: !surfaceRoot.destroyed && surfaceRoot.visible,
				position: surfaceRoot.destroyed ? null : {
					x: surfaceRoot.x,
					y: surfaceRoot.y
				}
			},
			filterDestroyed: filter?._destroyed ?? true,
			graphics: allGraphics.map((row) => ({
				role: row.role,
				paw: row.paw,
				destroyed: row.graphic.destroyed,
				contextDestroyed: row.context.destroyed,
				visible: !row.graphic.destroyed && row.graphic.visible
			})),
			waterSprites: waterSprites.map((sprite, paw) => ({
				paw,
				destroyed: sprite.destroyed,
				visible: !sprite.destroyed && sprite.visible,
				usesBorrowedBackground: !sprite.destroyed && sprite.texture === background.texture,
				hasOwnedMask: !sprite.destroyed && sprite.mask === rows[paw]?.mask
			})),
			borrowed: borrowed.map((row) => ({
				label: row.node.label,
				alive: !row.node.destroyed,
				parentIntact: !row.node.destroyed && row.node.parent === row.parent,
				indexRestored: !row.node.destroyed && row.node.parent === row.parent && row.parent.getChildIndex(row.node) === row.index,
				transformUnchanged: !row.node.destroyed && JSON.stringify(transform(row.node)) === row.transform,
				filtersRestored: !row.node.destroyed && sameFilters(row.node.filters, row.filters),
				usesOwnedLighting: !row.node.destroyed && !!filter && (row.node.filters ?? []).includes(filter)
			})),
			meshTransformUnchanged: !civet.destroyed && JSON.stringify(transform(civet)) === originalMeshTransform,
			borrowedSourcesIntact: sources.every((row) => !row.texture.destroyed && !row.source.destroyed && row.texture.source === row.source && row.source.resource === row.resource),
			noBorrowedReparenting: true,
			noOwnedTextures: true,
			noAnimationLoop: true,
			reflection: "Not added: this bounded waterline does not claim a coherent reflected body.",
			failures: [...failures]
		};
	}
	function dispose() {
		if (disposed) return snapshot();
		disposalRequested = true;
		enabled = false;
		const attempt = (label, fn) => {
			try {
				fn();
			} catch (error) {
				failures.push(label + ": " + String(error));
			}
		};
		if (!civetActor.destroyed) attempt("restore borrowed filters", () => {
			requireFact(sameFilters(civetActor.filters, originalFilters) || filter && sameFilters(civetActor.filters, [...originalFilters ?? [], filter]), "Borrowed filter chain changed; retain foreign state and retry restoration after its owner settles");
			civetActor.filters = originalFilters ? [...originalFilters] : originalFilters;
		});
		else if (!failures.includes("Borrowed Civet destroyed before restoration")) failures.push("Borrowed Civet destroyed before restoration");
		for (const sprite of waterSprites) if (!sprite.destroyed) attempt("retire water sprite", () => {
			sprite.mask = null;
			sprite.destroy({
				texture: false,
				textureSource: false
			});
		});
		for (const row of allGraphics) if (!row.graphic.destroyed || !row.context.destroyed) attempt("retire " + row.role, () => {
			if (!row.graphic.destroyed) row.graphic.destroy({ context: true });
			else if (!row.context.destroyed) row.context.destroy();
		});
		for (const root of [shadowRoot, surfaceRoot]) if (!root.destroyed && root.children.length === 0) attempt("retire water container", () => root.destroy({ children: false }));
		if (filter && !filter._destroyed && (civetActor.destroyed || sameFilters(civetActor.filters, originalFilters))) attempt("retire lighting", () => filter.destroy());
		disposed = shadowRoot.destroyed && surfaceRoot.destroyed && (!filter || filter._destroyed) && waterSprites.every((sprite) => sprite.destroyed) && allGraphics.every((row) => row.graphic.destroyed && row.context.destroyed);
		return snapshot();
	}
	try {
		filter = new ColorMatrixFilter();
		for (const contact of declaredContacts) {
			const { paw } = contact;
			const shadowShape = declaredRegions.find((region) => region.paw === paw && region.role === "submerged-shadow").geometry;
			const waterShape = declaredRegions.find((region) => region.paw === paw && region.role === "waterline").geometry;
			const rippleShape = declaredRegions.find((region) => region.paw === paw && region.role === "broken-ripple").geometry;
			requireFact(shadowShape.kind === "ellipse-rings" && waterShape.kind === "polygon" && rippleShape.kind === "quadratic-arcs", "Water geometry role mismatch");
			const shadow = ownedGraphic("submerged-shadow", paw);
			shadowRoot.addChild(shadow);
			for (let ring = 0; ring < shadowShape.rings; ring++) {
				const k = 1 - ring * .12;
				shadow.ellipse(shadowShape.x, shadowShape.y, shadowShape.radiusX * k, shadowShape.radiusY * k).fill({
					color: 3426635,
					alpha: shadowShape.alpha / shadowShape.rings
				});
			}
			const sprite = new Sprite(background.texture);
			waterSprites.push(sprite);
			sprite.label = `Civet:paw:${paw}:borrowed-water-texels`;
			sprite.eventMode = "none";
			sprite.alpha = waterShape.alpha;
			surfaceRoot.addChild(sprite);
			const mask = ownedGraphic("waterline-mask", paw);
			surfaceRoot.addChild(mask);
			mask.poly([...waterShape.points]).fill({ color: 16777215 });
			sprite.mask = mask;
			const ripple = ownedGraphic("broken-ripple", paw);
			surfaceRoot.addChild(ripple);
			for (const curve of rippleShape.curves) ripple.moveTo(...curve.start).quadraticCurveTo(...curve.control, ...curve.end).stroke({
				color: curve.color,
				width: curve.width,
				alpha: curve.alpha
			});
			rows.push({
				contact,
				shadow,
				mask,
				sprite,
				ripple
			});
		}
		earth.addChildAt(shadowRoot, earth.getChildIndex(background) + 1);
		earth.addChildAt(surfaceRoot, earth.getChildIndex(civetActor) + 1);
		apply();
	} catch (error) {
		dispose();
		throw error;
	}
	return Object.freeze({
		setEnabled(value) {
			requireFact(!disposalRequested && typeof value === "boolean", "Water enabled state is unavailable or invalid");
			enabled = value;
			apply();
			return snapshot();
		},
		setTestMode(value) {
			requireFact(!disposalRequested && allowTests, "Water diagnostic controls were not enabled");
			requireFact([
				"none",
				"noWater",
				"noShadows",
				"shiftWater",
				"noLight",
				"noOcclusion",
				"noRipples",
				"missingPaw",
				"strongLight"
			].includes(value), "Unknown water diagnostic");
			testMode = value;
			apply();
			return snapshot();
		},
		snapshot,
		dispose
	});
}
var requireFact, freeze;
var init_water_owner = __esmMin((() => {
	init_lib();
	init_earth_resident_plan();
	requireFact = (value, message) => {
		if (!value) throw new TypeError(message);
	};
	freeze = (value) => {
		if (value && typeof value === "object") {
			for (const child of Object.values(value)) freeze(child);
			Object.freeze(value);
		}
		return value;
	};
}));
(/* @__PURE__ */ __commonJSMin((() => {
	init_lib();
	init_civet_articulated_rig();
	init_earth_resident_plan();
	init_water_owner();
	var manifest = Object.freeze({
		"path": "./study-assets/civet-selected-v1.webp",
		"sha256": "186d76da888a4d6a1393eef85b0c47dfc3fd4f9653258dad3bdc027c4e400365",
		"width": 768,
		"height": 512,
		"alphaBounds": {
			"x0": 14,
			"y0": 102,
			"x1": 755,
			"y1": 415
		},
		"contactY": 413,
		"civetPaws": [
			{
				"x0": .3515625,
				"y0": .767578125,
				"x1": .4231770833333333,
				"y1": .8125
			},
			{
				"x0": .4231770833333333,
				"y0": .767578125,
				"x1": .5013020833333334,
				"y1": .8125
			},
			{
				"x0": .5572916666666666,
				"y0": .767578125,
				"x1": .6328125,
				"y1": .8125
			},
			{
				"x0": .6328125,
				"y0": .767578125,
				"x1": .7135416666666666,
				"y1": .8125
			}
		]
	});
	var sceneManifest = Object.freeze({ "background": {
		"path": "./study-assets/earth-background-original.webp",
		"sha256": "2993cd8054a2424f20ba24040717acdb17aa9c7157500cd5b945170cd1f625d8",
		"width": 960,
		"height": 430
	} });
	var genome = JSON.parse(CIVET_SOURCE_GENOME_JSON);
	var identityBefore = JSON.stringify(genome);
	var recipeBefore = JSON.stringify(manifest);
	var assert = (ok, why) => {
		if (!ok) throw Error(why);
	};
	var digest = async (bytes) => [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map((x) => x.toString(16).padStart(2, "0")).join("");
	var view = document.getElementById("study-view");
	var status = document.getElementById("status");
	var effects = document.getElementById("effects");
	var reduced = document.getElementById("reduced");
	var grounding = document.getElementById("cohesion");
	var buttons = new Map([
		"breathe",
		"strike",
		"recoil",
		"rest",
		"portrait",
		"environment",
		"hide",
		"dispose"
	].map((id) => [id, document.getElementById(id)]));
	var resources = [];
	var failures = [];
	var listeners = [];
	var journal = [];
	var log = (v) => {
		journal.push(v);
		if (journal.length > 256) journal.shift();
	};
	var counters = {
		decodedCreature: 0,
		creatureTextures: 0,
		creatureSources: 0,
		started: 0,
		completed: 0,
		cancelled: 0,
		frames: 0,
		renders: 0,
		meshesDestroyed: 0,
		geometriesDestroyed: 0,
		texturesDestroyed: 0,
		sourcesDestroyed: 0,
		bitmapsClosed: 0
	};
	var app = new Application();
	var initialized = false;
	var disposed = false;
	var raf = 0;
	var clip = "rest";
	var startMs = null;
	var elapsed = 0;
	var sequence = 0;
	var currentPose = {
		breath: 0,
		drive: 0,
		tail: 0
	};
	var mode = "portrait";
	var lastWidth = 0;
	var lastCancellation = "";
	var water;
	var waterRetirement = null;
	var earth;
	var background;
	var hero;
	var earthActor;
	var actors = [];
	var motionMutation = "none";
	var nativeBaseline = null;
	var recordArmed = false;
	var recorder = null;
	var recordStream = null;
	var recordingResult = null;
	function beginRecording() {
		if (!recordArmed) return;
		recordArmed = false;
		const mime = ["video/webm;codecs=vp9", "video/webm;codecs=vp8"].find((x) => MediaRecorder.isTypeSupported(x));
		assert(mime, "Native WebM recording unavailable");
		recordStream = app.canvas.captureStream(0);
		const chunks = [];
		recordingResult = {
			done: false,
			frames: 0,
			mime
		};
		const result = recordingResult, stream = recordStream;
		recorder = new MediaRecorder(stream, {
			mimeType: mime,
			videoBitsPerSecond: 18e5
		});
		recorder.ondataavailable = (e) => {
			if (e.data.size) chunks.push(e.data);
		};
		recorder.onstop = () => {
			for (const track of stream.getTracks()) track.stop();
			const reader = new FileReader();
			reader.onload = () => {
				result.dataURL = String(reader.result);
				result.done = true;
			};
			reader.readAsDataURL(new Blob(chunks, { type: mime }));
		};
		recorder.start();
	}
	function stopRecording() {
		if (recorder?.state === "recording") recorder.stop();
		recorder = null;
		recordStream = null;
	}
	var visible = () => {
		if (disposed || document.hidden || !view.isConnected) return false;
		for (let n = view; n; n = n.parentElement) {
			const s = getComputedStyle(n);
			if (n.hidden || n.hasAttribute("inert") || s.display === "none" || s.visibility === "hidden" || Number(s.opacity) === 0) return false;
		}
		return true;
	};
	var policy = () => ({
		effectsOn: effects.checked,
		fullMotion: !reduced.checked,
		visible: visible()
	});
	function listen(target, event, fn) {
		target.addEventListener(event, fn);
		listeners.push(() => target.removeEventListener(event, fn));
	}
	function inspectAlpha(bitmap, expected) {
		assert(bitmap.width === expected.width && bitmap.height === expected.height, "Decoded creature dimensions differ from immutable manifest");
		const canvas = new OffscreenCanvas(bitmap.width, bitmap.height), context = canvas.getContext("2d");
		try {
			context.drawImage(bitmap, 0, 0);
			const rgba = context.getImageData(0, 0, bitmap.width, bitmap.height).data;
			let x0 = bitmap.width, y0 = bitmap.height, x1 = -1, y1 = -1, contactY = -1, zero = 0, solid = 0, partial = 0, border = 0;
			for (let y = 0; y < bitmap.height; y++) for (let x = 0; x < bitmap.width; x++) {
				const a = rgba[(y * bitmap.width + x) * 4 + 3];
				if (a === 0) zero++;
				else if (a < 255) partial++;
				if (a >= 230) {
					solid++;
					contactY = y;
				}
				if (a > 12) {
					x0 = Math.min(x0, x);
					y0 = Math.min(y0, y);
					x1 = Math.max(x1, x);
					y1 = Math.max(y1, y);
				}
				if (a > 0 && (x === 0 || y === 0 || x === bitmap.width - 1 || y === bitmap.height - 1)) border++;
			}
			assert(zero > bitmap.width * bitmap.height * .1 && solid > 100 && partial > 0 && border === 0, "Creature must have real transparent margins and antialiased visible ink; opaque/matte/edge-clipped asset refused");
			assert(JSON.stringify({
				x0,
				y0,
				x1,
				y1
			}) === JSON.stringify(expected.alphaBounds), "Native alpha>12 bounds changed");
			assert(contactY === expected.contactY, "Native alpha>=230 contact row changed");
			return {
				x0,
				y0,
				x1,
				y1,
				contactY,
				zero,
				solid,
				partial,
				border
			};
		} finally {
			canvas.width = canvas.height = 1;
		}
	}
	async function validateHash(bytes, expected) {
		assert(await digest(bytes) === expected, "Immutable texture SHA-256 mismatch");
	}
	async function loadTexture(name, input, creature = false) {
		assert(input.path.startsWith("./study-assets/") && !input.path.includes(".."), "Only fixed local study assets are admitted");
		const response = await fetch(input.path, { cache: "no-store" });
		assert(response.ok, "Required local texture unavailable: " + name);
		const bytes = await response.arrayBuffer();
		await validateHash(bytes, input.sha256);
		let bitmap = await createImageBitmap(new Blob([bytes]));
		try {
			assert(bitmap.width === input.width && bitmap.height === input.height, "Texture dimensions changed: " + name);
			if (creature) {
				inspectAlpha(bitmap, input);
				counters.decodedCreature++;
			}
			const source = new ImageSource({
				resource: bitmap,
				scaleMode: "linear",
				autoGenerateMipmaps: false,
				alphaMode: "premultiply-alpha-on-upload"
			});
			const texture = new Texture({ source });
			resources.push({
				name,
				bitmap,
				source,
				texture,
				disposed: false
			});
			bitmap = null;
			if (creature) {
				counters.creatureTextures++;
				counters.creatureSources++;
			}
			return texture;
		} finally {
			bitmap?.close();
		}
	}
	function addActor(texture, parent) {
		const data = createCivetMesh(genome), mesh = new MeshSimple({
			texture,
			vertices: data.vertices,
			uvs: data.uvs,
			indices: data.indices
		});
		mesh.autoUpdate = true;
		mesh.eventMode = "none";
		const root = new Container();
		root.eventMode = "none";
		root.addChild(mesh);
		parent.addChild(root);
		const b = manifest.alphaBounds, w = b.x1 - b.x0 + 1, h = b.y1 - b.y0 + 1, k = Math.min(396 / w, 396 / h), sourceX = 220 - (b.x0 + w / 2) * k, sourceY = 220 - (b.y0 + h / 2) * k;
		mesh.scale.set(manifest.width * k, manifest.height * k);
		mesh.position.set(sourceX, sourceY);
		const buffers = [...new Set([...mesh.geometry.buffers, mesh.geometry.indexBuffer].filter((v) => !!v))];
		const actor = {
			root,
			mesh,
			geometry: mesh.geometry,
			buffers,
			data,
			k,
			sourceX,
			sourceY
		};
		actors.push(actor);
		return actor;
	}
	function render() {
		if (initialized && !disposed) {
			app.render();
			counters.renders++;
			const track = recordStream?.getVideoTracks()[0];
			if (track && recordingResult) {
				track.requestFrame();
				recordingResult.frames++;
			}
		}
	}
	function pose(value) {
		currentPose = value;
		for (const a of actors) {
			applyCivetPose(a.data, motionMutation === "constant-rest" ? {
				breath: 0,
				drive: 0,
				tail: 0
			} : motionMutation === "held-breath" && clip === "breathe" ? {
				...value,
				breath: 1
			} : value);
			for (let i = 0; i < a.data.vertices.length; i += 2) {
				const x = a.data.rest[i], y = a.data.rest[i + 1];
				if (motionMutation === "rigid-block") {
					a.data.vertices[i] = x + .018 * value.drive;
					a.data.vertices[i + 1] = y - .02 * value.breath;
				}
				if (motionMutation === "frozen-tail" && x < 1 / 3) {
					a.data.vertices[i] = x;
					a.data.vertices[i + 1] = y;
				}
				if (motionMutation === "subpixel") {
					a.data.vertices[i] = x + (a.data.vertices[i] - x) * .01;
					a.data.vertices[i + 1] = y + (a.data.vertices[i + 1] - y) * .01;
				}
			}
			a.mesh.vertices = a.data.vertices;
		}
		render();
	}
	function rest(reason, completed = false) {
		if (raf) cancelAnimationFrame(raf);
		raf = 0;
		if (clip !== "rest") if (completed) counters.completed++;
		else counters.cancelled++;
		clip = "rest";
		startMs = null;
		elapsed = 0;
		lastCancellation = reason;
		if (!disposed) pose({
			breath: 0,
			drive: 0,
			tail: 0
		});
		stopRecording();
		buttons.get("rest").disabled = true;
		log({
			event: completed ? "settled" : "rest",
			reason,
			sequence
		});
		status.textContent = disposed ? "Study disposed." : "Ready · choose a movement";
	}
	function animate(now) {
		raf = 0;
		if (!visible() || !effects.checked || reduced.checked) {
			rest("motion policy or visibility changed");
			return;
		}
		if (clip === "rest" || disposed) return;
		startMs ??= now;
		elapsed = now - startMs;
		counters.frames++;
		if (elapsed >= CIVET_CLIP_MS[clip]) {
			rest("finite movement completed", true);
			return;
		}
		pose(sampleCivetPose(clip, elapsed, policy()));
		raf = requestAnimationFrame(animate);
	}
	function start(next, trusted) {
		if (!initialized || disposed) return;
		rest("new movement");
		log({
			event: "request",
			clip: next,
			trusted,
			policy: policy()
		});
		if (!visible() || !effects.checked || reduced.checked) {
			status.textContent = "Motion is paused by your preference.";
			return;
		}
		nativeBaseline = readPainted().pixels;
		beginRecording();
		clip = next;
		sequence++;
		counters.started++;
		buttons.get("rest").disabled = false;
		status.textContent = next === "breathe" ? "Breathing · two slow breaths" : next === "strike" ? "Brace → push forward → settle" : "React → recover";
		raf = requestAnimationFrame(animate);
	}
	function layout() {
		if (!initialized || disposed) return;
		const width = Math.max(260, Math.min(1e3, view.clientWidth));
		lastWidth = width;
		hero.root.visible = mode === "portrait";
		earth.visible = mode === "environment";
		if (mode === "portrait") {
			const scale = Math.min(1.25, (width - 20) / 440);
			hero.root.scale.set(scale);
			hero.root.position.set((width - 440 * scale) / 2, 8);
			app.renderer.resize(width, Math.ceil(440 * scale + 16));
		} else {
			const scale = (width - 2) / 960;
			earth.position.set(1, 1);
			earth.scale.set(scale);
			app.renderer.resize(width, Math.ceil(430 * scale + 2));
		}
		nativeBaseline = null;
		render();
		log({
			event: "layout",
			width,
			mode,
			sequence,
			clip
		});
	}
	function snapshot() {
		return {
			ready: initialized && !disposed,
			disposed,
			mode,
			clip,
			elapsed,
			sequence,
			currentPose,
			pendingRaf: raf !== 0,
			policy: policy(),
			durations: CIVET_CLIP_MS,
			counters: { ...counters },
			lastCancellation,
			sourceIdentityUnchanged: JSON.stringify(genome) === identityBefore && JSON.stringify(manifest) === recipeBefore,
			failures: [...failures],
			journal: [...journal],
			water: water?.snapshot() ?? null,
			waterRetirement,
			actors: actors.map((a) => ({
				restExact: a.data.vertices.every((v, i) => v === a.data.rest[i]),
				meshDestroyed: a.mesh.destroyed,
				geometryDestroyed: a.geometry.buffers === null,
				buffers: a.buffers.map((b) => ({ destroyed: b.destroyed })),
				rootDestroyed: a.root.destroyed
			})),
			resources: resources.map((r) => ({
				name: r.name,
				textureDestroyed: r.texture.destroyed,
				sourceDestroyed: r.source.destroyed,
				bitmapWidth: r.bitmap.width,
				bitmapHeight: r.bitmap.height
			})),
			earthDestroyed: earth?.destroyed ?? false,
			canvas: initialized && !disposed ? {
				width: app.canvas.width,
				height: app.canvas.height,
				rect: app.canvas.getBoundingClientRect().toJSON()
			} : null
		};
	}
	function encode(pixels, width, height) {
		const c = document.createElement("canvas");
		c.width = width;
		c.height = height;
		try {
			c.getContext("2d").putImageData(new ImageData(new Uint8ClampedArray(pixels), width, height), 0, 0);
			return c.toDataURL("image/png");
		} finally {
			c.width = c.height = 1;
		}
	}
	function readPainted() {
		const c = new OffscreenCanvas(app.canvas.width, app.canvas.height);
		try {
			const ctx = c.getContext("2d");
			ctx.drawImage(app.canvas, 0, 0);
			return {
				pixels: ctx.getImageData(0, 0, c.width, c.height).data,
				width: c.width,
				height: c.height
			};
		} finally {
			c.width = c.height = 1;
		}
	}
	function pixelStats(pixels, width, height, baseline) {
		const a = mode === "portrait" ? hero : earthActor, parent = mode === "portrait" ? a.root : earth, scale = parent.scale.x, dpr = app.renderer.resolution;
		const sourceToScreen = (x, y) => ({
			x: (parent.x + (a.sourceX + x * manifest.width * a.k) * scale) * dpr,
			y: (parent.y + (a.sourceY + y * manifest.height * a.k) * scale) * dpr
		});
		return {
			regions: [
				[
					"chest",
					.43,
					.17,
					.64,
					.6
				],
				[
					"head",
					.76,
					.19,
					.97,
					.46
				],
				[
					"tail",
					.018,
					.46,
					.3,
					.81
				],
				[
					"hindLeg",
					.35,
					.59,
					.49,
					.75
				],
				[
					"foreLeg",
					.55,
					.57,
					.72,
					.75
				],
				...manifest.civetPaws.map((p, i) => [
					"paw" + i,
					p.x0,
					p.y0,
					p.x1,
					p.y1
				])
			].map(([name, x0, y0, x1, y1]) => {
				const p0 = sourceToScreen(x0, y0), p1 = sourceToScreen(x1, y1);
				let ink = 0, changed = 0, exactChanged = 0, max = 0, alphaChanged = 0, weighted = 0;
				for (let y = Math.max(0, Math.floor(p0.y)); y < Math.min(height, Math.ceil(p1.y)); y++) for (let x = Math.max(0, Math.floor(p0.x)); x < Math.min(width, Math.ceil(p1.x)); x++) {
					const i = (y * width + x) * 4;
					if (baseline[i + 3] >= 230) ink++;
					let delta = 0;
					for (let c = 0; c < 4; c++) delta = Math.max(delta, Math.abs(pixels[i + c] - baseline[i + c]));
					if (delta > 0) exactChanged++;
					if (delta > 8) {
						changed++;
						weighted += delta;
					}
					if (Math.abs(pixels[i + 3] - baseline[i + 3]) > 8) alphaChanged++;
					max = Math.max(max, delta);
				}
				const shape = (data) => {
					let solid = 0, sx = 0, sy = 0, right = -1, topSum = 0, columns = 0;
					for (let x = Math.max(0, Math.floor(p0.x)); x < Math.min(width, Math.ceil(p1.x)); x++) {
						let top = -1;
						for (let y = Math.max(0, Math.floor(p0.y)); y < Math.min(height, Math.ceil(p1.y)); y++) if (data[(y * width + x) * 4 + 3] >= 230) {
							solid++;
							sx += x;
							sy += y;
							right = Math.max(right, x);
							if (top < 0) top = y;
						}
						if (top >= 0) {
							topSum += top;
							columns++;
						}
					}
					return {
						solid,
						centroid: solid ? {
							x: sx / solid / dpr,
							y: sy / solid / dpr
						} : null,
						right: right / dpr,
						top: columns ? topSum / columns / dpr : null,
						columns
					};
				};
				return {
					name,
					ink,
					changed,
					exactChanged,
					max,
					alphaChanged,
					weighted,
					beforeShape: shape(baseline),
					afterShape: shape(pixels),
					screenCSS: {
						x: p0.x / dpr,
						y: p0.y / dpr,
						width: (p1.x - p0.x) / dpr,
						height: (p1.y - p0.y) / dpr
					}
				};
			}),
			dpr
		};
	}
	function nativeFrame() {
		assert(initialized && !disposed, "Inactive study");
		const capture = readPainted();
		assert(capture.pixels.some((v, i) => i % 4 === 3 && v > 230), "Actual painted canvas is empty");
		const metrics = nativeBaseline && nativeBaseline.length === capture.pixels.length ? pixelStats(capture.pixels, capture.width, capture.height, nativeBaseline) : null;
		return {
			state: snapshot(),
			captureMethod: "drawImage current preserved native canvas; no render/extract/pose",
			metrics,
			png: encode(capture.pixels, capture.width, capture.height),
			width: capture.width,
			height: capture.height
		};
	}
	function captureEarth() {
		const prior = {
			visible: earth.visible,
			x: earth.x,
			y: earth.y,
			sx: earth.scale.x,
			sy: earth.scale.y
		};
		earth.visible = true;
		earth.position.set(0, 0);
		earth.scale.set(1);
		try {
			return app.renderer.extract.pixels({
				target: earth,
				frame: new Rectangle(0, 0, 960, 430),
				resolution: 1,
				antialias: true
			});
		} finally {
			earth.visible = prior.visible;
			earth.position.set(prior.x, prior.y);
			earth.scale.set(prior.sx, prior.sy);
		}
	}
	function sceneProbe(testMode = "none") {
		assert(initialized && !disposed, "Inactive study");
		rest("scene comparison");
		const prior = grounding.checked;
		try {
			water.setTestMode("none");
			water.setEnabled(false);
			const before = captureEarth();
			earthActor.root.visible = false;
			const backgroundOnly = captureEarth();
			earthActor.root.visible = true;
			background.visible = false;
			const ink = captureEarth();
			background.visible = true;
			water.setEnabled(true);
			water.setTestMode("noShadows");
			const noShadows = captureEarth();
			water.setTestMode("noOcclusion");
			const noOcclusion = captureEarth();
			water.setTestMode("noRipples");
			const noRipples = captureEarth();
			water.setTestMode(testMode);
			const after = captureEarth();
			return {
				testMode,
				owner: water.snapshot(),
				beforePng: encode(before.pixels, 960, 430),
				afterPng: encode(after.pixels, 960, 430),
				backgroundPng: encode(backgroundOnly.pixels, 960, 430),
				inkPng: encode(ink.pixels, 960, 430),
				noOcclusionPng: encode(noOcclusion.pixels, 960, 430),
				noRipplesPng: encode(noRipples.pixels, 960, 430),
				noShadowsPng: encode(noShadows.pixels, 960, 430)
			};
		} finally {
			earthActor.root.visible = true;
			background.visible = true;
			water.setTestMode("none");
			water.setEnabled(prior);
			render();
		}
	}
	function retireWater() {
		rest("retire water");
		water.setEnabled(false);
		const before = captureEarth();
		waterRetirement = water.dispose();
		const after = captureEarth();
		let changed = 0;
		for (let i = 0; i < before.pixels.length; i++) if (before.pixels[i] !== after.pixels[i]) changed++;
		const priorMode = mode;
		mode = "portrait";
		layout();
		const sibling = readPainted();
		mode = priorMode;
		layout();
		let siblingInk = 0;
		for (let i = 3; i < sibling.pixels.length; i += 4) if (sibling.pixels[i] >= 230) siblingInk++;
		return {
			state: waterRetirement,
			restoredSceneChannelChanges: changed,
			siblingTextureAlive: !hero.mesh.texture.destroyed,
			siblingInk,
			siblingPng: encode(sibling.pixels, sibling.width, sibling.height),
			scenePng: encode(after.pixels, 960, 430)
		};
	}
	function dispose() {
		if (disposed) return snapshot();
		rest("dispose");
		waterRetirement ??= water?.dispose();
		disposed = true;
		observer.disconnect();
		resizeObserver.disconnect();
		for (const off of listeners.splice(0)) off();
		for (const a of actors) {
			a.mesh.destroy({
				texture: false,
				textureSource: false
			});
			counters.meshesDestroyed++;
			a.geometry.destroy(true);
			counters.geometriesDestroyed++;
			a.root.destroy({ children: false });
		}
		earth?.destroy({
			children: true,
			texture: false,
			textureSource: false
		});
		for (const r of resources) {
			r.texture.destroy(false);
			counters.texturesDestroyed++;
			r.source.destroy();
			counters.sourcesDestroyed++;
			r.bitmap.close();
			counters.bitmapsClosed++;
			r.disposed = true;
		}
		if (initialized) app.destroy({ removeView: true }, {
			children: false,
			texture: false,
			textureSource: false
		});
		for (const button of buttons.values()) button.disabled = true;
		effects.disabled = reduced.disabled = grounding.disabled = true;
		return snapshot();
	}
	var observer = new MutationObserver(() => {
		if (initialized && !disposed && !visible()) rest("hidden ancestor");
	});
	var resizeObserver = new ResizeObserver(() => {
		if (initialized && !disposed && visible() && Math.abs(view.clientWidth - lastWidth) > .5) layout();
	});
	var ready = (async () => {
		await app.init({
			width: 600,
			height: 480,
			backgroundAlpha: 0,
			antialias: true,
			preference: "webgl",
			preserveDrawingBuffer: true,
			resolution: Math.min(devicePixelRatio, 2),
			autoDensity: true,
			autoStart: false,
			sharedTicker: false
		});
		app.stop();
		initialized = true;
		view.append(app.canvas);
		const texture = await loadTexture("creature", manifest, true), bg = await loadTexture("background", sceneManifest.background);
		hero = addActor(texture, app.stage);
		earth = new Container();
		earth.eventMode = "none";
		app.stage.addChild(earth);
		background = new Sprite(bg);
		background.eventMode = "none";
		earth.addChild(background);
		earthActor = addActor(texture, earth);
		const bounds = manifest.alphaBounds, w = bounds.x1 - bounds.x0 + 1, k = 144 / w;
		earthActor.k = k;
		earthActor.sourceX = .72 * 960 - (bounds.x0 + w / 2) * k;
		earthActor.sourceY = 331.1 - (manifest.contactY + 1) * k;
		earthActor.mesh.scale.set(manifest.width * k, manifest.height * k);
		earthActor.mesh.position.set(earthActor.sourceX, earthActor.sourceY);
		water = attachCivetWaterScene({
			earth,
			background,
			civetActor: earthActor.root,
			recipe: {
				schema: "cf-civet-water-scene/v1",
				worldKey: EARTH_RESIDENT_LAYER_PLAN_V1.worldKey,
				plan: EARTH_RESIDENT_LAYER_PLAN_V1,
				civetAsset: {
					width: manifest.width,
					height: manifest.height,
					alphaBounds: manifest.alphaBounds,
					contactY: manifest.contactY,
					sha256: manifest.sha256
				},
				civetPaws: manifest.civetPaws
			},
			enabled: true,
			allowTestControls: true
		});
		for (const next of [
			"breathe",
			"strike",
			"recoil"
		]) listen(buttons.get(next), "click", (event) => start(next, event.isTrusted));
		listen(buttons.get("rest"), "click", (event) => {
			log({
				event: "native-stop",
				trusted: event.isTrusted
			});
			rest("Stop/reset selected");
		});
		for (const next of ["portrait", "environment"]) listen(buttons.get(next), "click", (event) => {
			mode = next;
			buttons.get("portrait").setAttribute("aria-pressed", String(next === "portrait"));
			buttons.get("environment").setAttribute("aria-pressed", String(next === "environment"));
			layout();
			log({
				event: "view-control",
				mode,
				trusted: event.isTrusted
			});
		});
		listen(grounding, "change", (event) => {
			water.setEnabled(grounding.checked);
			render();
			log({
				event: "water-control",
				trusted: event.isTrusted,
				enabled: grounding.checked
			});
		});
		for (const input of [effects, reduced]) listen(input, "change", (event) => {
			log({
				event: "policy-control",
				id: input.id,
				trusted: event.isTrusted
			});
			rest("motion preference changed");
		});
		listen(buttons.get("hide"), "click", (event) => {
			view.hidden = !view.hidden;
			buttons.get("hide").textContent = view.hidden ? "Show study" : "Hide study";
			if (view.hidden) rest("study hidden");
			else layout();
			log({
				event: "hide-control",
				hidden: view.hidden,
				trusted: event.isTrusted
			});
		});
		listen(buttons.get("dispose"), "click", () => dispose());
		listen(document, "visibilitychange", () => {
			if (document.hidden) rest("document hidden");
		});
		listen(window, "pagehide", () => dispose());
		for (let n = view; n; n = n.parentElement) observer.observe(n, {
			attributes: true,
			attributeFilter: [
				"hidden",
				"inert",
				"style",
				"class"
			]
		});
		resizeObserver.observe(view);
		for (const [id, button] of buttons) button.disabled = id === "rest";
		document.getElementById("identity").textContent = JSON.stringify({
			rig: CIVET_RIG_VERSION,
			genome,
			texture: manifest.sha256,
			scene: {
				x: .72,
				groundY: .77,
				width: .15
			},
			reviewResidents: ["Civet"],
			gameRosterUnchanged: true
		}, null, 2);
		layout();
		return snapshot();
	})().catch((error) => {
		failures.push(String(error?.stack || error));
		status.textContent = "Study refused: " + String(error);
		try {
			dispose();
		} catch (e) {
			failures.push(String(e));
		}
		throw error;
	});
	window.__CF_WATER_STUDY__ = Object.freeze({
		ready,
		snapshot,
		nativeFrame,
		sceneProbe,
		retireWater,
		dispose,
		armRecording() {
			assert(clip === "rest" && !recorder, "Recorder must start from rest");
			recordArmed = true;
		},
		recording() {
			return recordingResult;
		},
		setMotionMutation(value) {
			assert([
				"none",
				"constant-rest",
				"rigid-block",
				"frozen-tail",
				"subpixel",
				"held-breath"
			].includes(value), "Unknown motion control");
			assert(clip === "rest", "Change control only at rest");
			motionMutation = value;
			nativeBaseline = null;
			return snapshot();
		}
	});
})))();
//#endregion
