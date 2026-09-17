import { $ as Matrix, B as Texture, C as TexturePool, I as warn, J as v8_0_0, K as nextPow2, L as Color, U as TextureSource, W as TextureStyle, X as uid, Z as Rectangle, a as State, b as ViewContainer, c as BindGroup, g as UPDATE_PRIORITY, h as Ticker, it as extensions, l as UniformGroup, n as Buffer, nt as ObservablePoint, q as deprecation, r as BufferUsage, rt as ExtensionType, t as Geometry, tt as eventemitter3_default, v as DOMAdapter, x as Container, y as Sprite, z as updateQuadBounds } from "./Geometry-P-yRC1RG.js";
import { t as getPo2TextureFromSource } from "./getPo2TextureFromSource-DMIUa6T9.js";
import { t as canvasUtils } from "./canvasUtils-Cd0S7jt0.js";
import { D as ApplicationInitHook, O as AbstractRenderer, d as color32BitToUniform, f as GCManagedHash, u as BatchableSprite, w as getAdjustedBlendModeBlend } from "./RenderTargetSystem-D2_-Q3rU.js";
import { a as toStrokeStyle, i as toFillStyle, n as Graphics, o as FillPattern, r as GraphicsContext, s as FillGradient } from "./CanvasRenderer-C_LQYfmj.js";
import { t as CanvasPool } from "./CanvasPool-DiGLMfnB.js";
//#region port/v2/node_modules/pixi.js/lib/environment-browser/browserExt.mjs
const browserExt = {
	extension: {
		type: ExtensionType.Environment,
		name: "browser",
		priority: -1
	},
	test: () => true,
	load: async () => {
		await import("./browserAll-D3No-vVf.js");
	}
};
//#endregion
//#region port/v2/node_modules/pixi.js/lib/environment-webworker/webworkerExt.mjs
const webworkerExt = {
	extension: {
		type: ExtensionType.Environment,
		name: "webworker",
		priority: 0
	},
	test: () => typeof self !== "undefined" && self.WorkerGlobalScope !== void 0,
	load: async () => {
		await import("./webworkerAll-eBtI5Ph6.js");
	}
};
//#endregion
//#region port/v2/node_modules/pixi.js/lib/utils/browser/isWebGLSupported.mjs
let _isWebGLSupported;
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
//#endregion
//#region port/v2/node_modules/pixi.js/lib/utils/browser/isWebGPUSupported.mjs
let _isWebGPUSupported;
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
//#endregion
//#region port/v2/node_modules/pixi.js/lib/rendering/renderers/autoDetectRenderer.mjs
const renderPriority = [
	"webgl",
	"webgpu",
	"canvas"
];
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
			const { WebGPURenderer } = await import("./WebGPURenderer-CRgcgkuU.js");
			RendererClass = WebGPURenderer;
			finalOptions = {
				...options,
				...options.webgpu
			};
			break;
		} else if (rendererType === "webgl" && isWebGLSupported(options.failIfMajorPerformanceCaveat ?? AbstractRenderer.defaultOptions.failIfMajorPerformanceCaveat)) {
			const { WebGLRenderer } = await import("./WebGLRenderer-DrilAfou.js");
			RendererClass = WebGLRenderer;
			finalOptions = {
				...options,
				...options.webgl
			};
			break;
		} else if (rendererType === "canvas") {
			const { CanvasRenderer } = await import("./CanvasRenderer-Bw_Fhk5K.js");
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
//#endregion
//#region port/v2/node_modules/pixi.js/lib/app/ResizePlugin.mjs
var ResizePlugin = class {
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
//#endregion
//#region port/v2/node_modules/pixi.js/lib/app/TickerPlugin.mjs
var TickerPlugin = class {
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
//#endregion
//#region port/v2/node_modules/pixi.js/lib/app/init.mjs
extensions.add(ResizePlugin);
extensions.add(TickerPlugin);
//#endregion
//#region port/v2/node_modules/pixi.js/lib/app/Application.mjs
const _Application = class _Application {
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
let Application = _Application;
extensions.handleByList(ExtensionType.Application, Application._plugins);
extensions.add(ApplicationInitHook);
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
//#endregion
//#region port/v2/node_modules/pixi.js/lib/scene/mesh/shared/MeshGeometry.mjs
const _MeshGeometry = class _MeshGeometry extends Geometry {
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
let MeshGeometry = _MeshGeometry;
//#endregion
//#region port/v2/node_modules/pixi.js/lib/scene/mesh/shared/BatchableMesh.mjs
var BatchableMesh = class {
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
//#endregion
//#region port/v2/node_modules/pixi.js/lib/scene/mesh/shared/MeshPipe.mjs
var MeshGpuData = class {
	destroy() {}
};
var MeshPipe = class {
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
//#endregion
//#region port/v2/node_modules/pixi.js/lib/scene/mesh/init.mjs
extensions.add(MeshPipe);
//#endregion
//#region port/v2/node_modules/pixi.js/lib/scene/mesh/shared/Mesh.mjs
var Mesh = class extends ViewContainer {
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
//#endregion
//#region port/v2/node_modules/pixi.js/lib/scene/text/AbstractText.mjs
var AbstractText = class extends ViewContainer {
	constructor(options, styleClass) {
		const { text, resolution, style, anchor, width, height, roundPixels, ...rest } = options;
		super({ ...rest });
		/** @internal */
		this.batched = true;
		/** @internal */
		this._resolution = null;
		/** @internal */
		this._autoResolution = true;
		/** @internal */
		this._didTextUpdate = true;
		this._styleClass = styleClass;
		this.text = text ?? "";
		this.style = style;
		this.resolution = resolution ?? null;
		this.allowChildren = false;
		this._anchor = new ObservablePoint({ _onUpdate: () => {
			this.onViewUpdate();
		} });
		if (anchor) this.anchor = anchor;
		this.roundPixels = roundPixels ?? false;
		if (width !== void 0) this.width = width;
		if (height !== void 0) this.height = height;
	}
	/**
	* The anchor point of the text that controls the origin point for positioning and rotation.
	* Can be a number (same value for x/y) or a PointData object.
	* - (0,0) is top-left
	* - (0.5,0.5) is center
	* - (1,1) is bottom-right
	* ```ts
	* // Set anchor to center
	* const text = new Text({
	*     text: 'Hello Pixi!',
	*     anchor: 0.5 // Same as { x: 0.5, y: 0.5 }
	* });
	* // Set anchor to top-left
	* const text2 = new Text({
	*     text: 'Hello Pixi!',
	*     anchor: { x: 0, y: 0 } // Top-left corner
	* });
	* // Set anchor to bottom-right
	* const text3 = new Text({
	*     text: 'Hello Pixi!',
	*     anchor: { x: 1, y: 1 } // Bottom-right corner
	* });
	* ```
	* @default { x: 0, y: 0 }
	*/
	get anchor() {
		return this._anchor;
	}
	set anchor(value) {
		typeof value === "number" ? this._anchor.set(value) : this._anchor.copyFrom(value);
	}
	/**
	* The text content to display. Use '\n' for line breaks.
	* Accepts strings, numbers, or objects with toString() method.
	* @example
	* ```ts
	* const text = new Text({
	*     text: 'Hello Pixi!',
	* });
	* const multilineText = new Text({
	*     text: 'Line 1\nLine 2\nLine 3',
	* });
	* const numberText = new Text({
	*     text: 12345, // Will be converted to '12345'
	* });
	* const objectText = new Text({
	*     text: { toString: () => 'Object Text' }, // Custom toString
	* });
	*
	* // Update text dynamically
	* text.text = 'Updated Text'; // Re-renders with new text
	* text.text = 67890; // Updates to '67890'
	* text.text = { toString: () => 'Dynamic Text' }; // Uses custom toString method
	* // Clear text
	* text.text = ''; // Clears the text
	* ```
	* @default ''
	*/
	set text(value) {
		value = value.toString();
		if (this._text === value) return;
		this._text = value;
		this.onViewUpdate();
	}
	get text() {
		return this._text;
	}
	/**
	* The resolution/device pixel ratio for rendering.
	* Higher values result in sharper text at the cost of performance.
	* Set to null for auto-resolution based on device.
	* @example
	* ```ts
	* const text = new Text({
	*     text: 'Hello Pixi!',
	*     resolution: 2 // High DPI for sharper text
	* });
	* const autoResText = new Text({
	*     text: 'Auto Resolution',
	*     resolution: null // Use device's pixel ratio
	* });
	* ```
	* @default null
	*/
	set resolution(value) {
		this._autoResolution = value === null;
		this._resolution = value;
		this.onViewUpdate();
	}
	get resolution() {
		return this._resolution;
	}
	get style() {
		return this._style;
	}
	/**
	* The style configuration for the text.
	* Can be a TextStyle instance or a configuration object.
	* Supports canvas text styles, HTML text styles, and bitmap text styles.
	* @example
	* ```ts
	* const text = new Text({
	*     text: 'Styled Text',
	*     style: {
	*         fontSize: 24,
	*         fill: 0xff1010, // Red color
	*         fontFamily: 'Arial',
	*         align: 'center', // Center alignment
	*         stroke: { color: '#4a1850', width: 5 }, // Purple stroke
	*         dropShadow: {
	*             color: '#000000', // Black shadow
	*             blur: 4, // Shadow blur
	*             distance: 6 // Shadow distance
	*         }
	*     }
	* });
	* const htmlText = new HTMLText({
	*     text: 'HTML Styled Text',
	*     style: {
	*         fontSize: '20px',
	*         fill: 'blue',
	*         fontFamily: 'Verdana',
	*     }
	* });
	* const bitmapText = new BitmapText({
	*     text: 'Bitmap Styled Text',
	*     style: {
	*         fontName: 'Arial',
	*         fontSize: 32,
	*     }
	* })
	*
	* // Update style dynamically
	* text.style = {
	*     fontSize: 30, // Change font size
	*     fill: 0x00ff00, // Change color to green
	*     align: 'right', // Change alignment to right
	*     stroke: { color: '#000000', width: 2 }, // Add black stroke
	* }
	*/
	set style(style) {
		style || (style = {});
		this._style?.off("update", this.onViewUpdate, this);
		if (style instanceof this._styleClass) this._style = style;
		else this._style = new this._styleClass(style);
		this._style.on("update", this.onViewUpdate, this);
		this.onViewUpdate();
	}
	/**
	* The width of the sprite, setting this will actually modify the scale to achieve the value set.
	* @example
	* ```ts
	* // Set width directly
	* texture.width = 200;
	* console.log(texture.scale.x); // Scale adjusted to match width
	*
	* // For better performance when setting both width and height
	* texture.setSize(300, 400); // Avoids recalculating bounds twice
	* ```
	*/
	get width() {
		return Math.abs(this.scale.x) * this.bounds.width;
	}
	set width(value) {
		this._setWidth(value, this.bounds.width);
	}
	/**
	* The height of the sprite, setting this will actually modify the scale to achieve the value set.
	* @example
	* ```ts
	* // Set height directly
	* texture.height = 200;
	* console.log(texture.scale.y); // Scale adjusted to match height
	*
	* // For better performance when setting both width and height
	* texture.setSize(300, 400); // Avoids recalculating bounds twice
	* ```
	*/
	get height() {
		return Math.abs(this.scale.y) * this.bounds.height;
	}
	set height(value) {
		this._setHeight(value, this.bounds.height);
	}
	/**
	* Retrieves the size of the Text as a [Size]{@link Size} object based on the texture dimensions and scale.
	* This is faster than getting width and height separately as it only calculates the bounds once.
	* @example
	* ```ts
	* // Basic size retrieval
	* const text = new Text({
	*     text: 'Hello Pixi!',
	*     style: { fontSize: 24 }
	* });
	* const size = text.getSize();
	* console.log(`Size: ${size.width}x${size.height}`);
	*
	* // Reuse existing size object
	* const reuseSize = { width: 0, height: 0 };
	* text.getSize(reuseSize);
	* ```
	* @param out - Optional object to store the size in, to avoid allocating a new object
	* @returns The size of the Sprite
	* @see {@link Text#width} For getting just the width
	* @see {@link Text#height} For getting just the height
	* @see {@link Text#setSize} For setting both width and height
	*/
	getSize(out) {
		out || (out = {});
		out.width = Math.abs(this.scale.x) * this.bounds.width;
		out.height = Math.abs(this.scale.y) * this.bounds.height;
		return out;
	}
	/**
	* Sets the size of the Text to the specified width and height.
	* This is faster than setting width and height separately as it only recalculates bounds once.
	* @example
	* ```ts
	* // Basic size setting
	* const text = new Text({
	*    text: 'Hello Pixi!',
	*    style: { fontSize: 24 }
	* });
	* text.setSize(100, 200); // Width: 100, Height: 200
	*
	* // Set uniform size
	* text.setSize(100); // Sets both width and height to 100
	*
	* // Set size with object
	* text.setSize({
	*     width: 200,
	*     height: 300
	* });
	* ```
	* @param value - This can be either a number or a {@link Size} object
	* @param height - The height to set. Defaults to the value of `width` if not provided
	* @see {@link Text#width} For setting width only
	* @see {@link Text#height} For setting height only
	*/
	setSize(value, height) {
		if (typeof value === "object") {
			height = value.height ?? value.width;
			value = value.width;
		} else height ?? (height = value);
		value !== void 0 && this._setWidth(value, this.bounds.width);
		height !== void 0 && this._setHeight(height, this.bounds.height);
	}
	/**
	* Checks if the object contains the given point in local coordinates.
	* Uses the text's bounds for hit testing.
	* @example
	* ```ts
	* // Basic point check
	* const localPoint = { x: 50, y: 25 };
	* const contains = text.containsPoint(localPoint);
	* console.log('Point is inside:', contains);
	* ```
	* @param point - The point to check in local coordinates
	* @returns True if the point is within the text's bounds
	* @see {@link Container#toLocal} For converting global coordinates to local
	*/
	containsPoint(point) {
		const width = this.bounds.width;
		const height = this.bounds.height;
		const x1 = -width * this.anchor.x;
		let y1 = 0;
		if (point.x >= x1 && point.x <= x1 + width) {
			y1 = -height * this.anchor.y;
			if (point.y >= y1 && point.y <= y1 + height) return true;
		}
		return false;
	}
	/** @internal */
	onViewUpdate() {
		if (!this.didViewUpdate) this._didTextUpdate = true;
		super.onViewUpdate();
	}
	/**
	* Destroys this text renderable and optionally its style texture.
	* @param options - Options parameter. A boolean will act as if all options
	*  have been set to that value
	* @example
	* // Destroys the text and its style
	* text.destroy({ style: true, texture: true, textureSource: true });
	* text.destroy(true);
	* text.destroy() // Destroys the text, but not its style
	*/
	destroy(options = false) {
		super.destroy(options);
		this.owner = null;
		this._bounds = null;
		this._anchor = null;
		if (typeof options === "boolean" ? options : options?.style) this._style.destroy(options);
		this._style = null;
		this._text = null;
	}
	/**
	* Returns a unique key for this instance.
	* This key is used for caching.
	* @returns {string} Unique key for the instance
	*/
	get styleKey() {
		return `${this._text}:${this._style.styleKey}:${this._resolution}`;
	}
};
function ensureTextOptions(args, name) {
	let options = args[0] ?? {};
	if (typeof options === "string" || args[1]) {
		deprecation(v8_0_0, `use new ${name}({ text: "hi!", style }) instead`);
		options = {
			text: options,
			style: args[1]
		};
	}
	return options;
}
//#endregion
//#region port/v2/node_modules/pixi.js/lib/utils/canvas/getCanvasBoundingBox.mjs
let _internalCanvas = null;
let _internalContext = null;
function ensureInternalCanvas(width, height) {
	if (!_internalCanvas) {
		_internalCanvas = DOMAdapter.get().createCanvas(256, 128);
		_internalContext = _internalCanvas.getContext("2d", { willReadFrequently: true });
		_internalContext.globalCompositeOperation = "copy";
		_internalContext.globalAlpha = 1;
	}
	if (_internalCanvas.width < width || _internalCanvas.height < height) {
		_internalCanvas.width = nextPow2(width);
		_internalCanvas.height = nextPow2(height);
	}
}
function checkRow(data, width, y) {
	for (let x = 0, index = 4 * y * width; x < width; ++x, index += 4) if (data[index + 3] !== 0) return false;
	return true;
}
function checkColumn(data, width, x, top, bottom) {
	const stride = 4 * width;
	for (let y = top, index = top * stride + 4 * x; y <= bottom; ++y, index += stride) if (data[index + 3] !== 0) return false;
	return true;
}
function getCanvasBoundingBox(...args) {
	let options = args[0];
	if (!options.canvas) options = {
		canvas: args[0],
		resolution: args[1]
	};
	const { canvas } = options;
	const resolution = Math.min(options.resolution ?? 1, 1);
	const width = options.width ?? canvas.width;
	const height = options.height ?? canvas.height;
	let output = options.output;
	ensureInternalCanvas(width, height);
	if (!_internalContext) throw new TypeError("Failed to get canvas 2D context");
	_internalContext.drawImage(canvas, 0, 0, width, height, 0, 0, width * resolution, height * resolution);
	const data = _internalContext.getImageData(0, 0, width, height).data;
	let left = 0;
	let top = 0;
	let right = width - 1;
	let bottom = height - 1;
	while (top < height && checkRow(data, width, top)) ++top;
	if (top === height) return Rectangle.EMPTY;
	while (checkRow(data, width, bottom)) --bottom;
	while (checkColumn(data, width, left, top, bottom)) ++left;
	while (checkColumn(data, width, right, top, bottom)) --right;
	++right;
	++bottom;
	_internalContext.globalCompositeOperation = "source-over";
	_internalContext.strokeRect(left, top, right - left, bottom - top);
	_internalContext.globalCompositeOperation = "copy";
	output ?? (output = new Rectangle());
	output.set(left / resolution, top / resolution, (right - left) / resolution, (bottom - top) / resolution);
	return output;
}
//#endregion
//#region port/v2/node_modules/tiny-lru/dist/tiny-lru.js
/**
* tiny-lru
*
* @copyright 2026 Jason Mulligan <jason.mulligan@avoidwork.com>
* @license BSD-3-Clause
* @version 11.4.7
*/
/**
* A high-performance Least Recently Used (LRU) cache implementation with optional TTL support.
* Items are automatically evicted when the cache reaches its maximum size,
* removing the least recently used items first. All core operations (get, set, delete) are O(1).
*
* @class LRU
* @example
* // Create a cache with max 100 items
* const cache = new LRU(100);
* cache.set('key1', 'value1');
* console.log(cache.get('key1')); // 'value1'
*
* @example
* // Create a cache with TTL
* const cache = new LRU(100, 5000); // 5 second TTL
* cache.set('key1', 'value1');
* // After 5 seconds, key1 will be expired
*/
var LRU = class {
	/**
	* Creates a new LRU cache instance.
	* Note: Constructor does not validate parameters. Use lru() factory function for parameter validation.
	*
	* @constructor
	* @param {number} [max=0] - Maximum number of items to store. 0 means unlimited.
	* @param {number} [ttl=0] - Time to live in milliseconds. 0 means no expiration.
	* @param {boolean} [resetTtl=false] - Whether to reset TTL when accessing existing items via get().
	* @example
	* const cache = new LRU(1000, 60000, true); // 1000 items, 1 minute TTL, reset on access
	* @see {@link lru} For parameter validation
	* @since 1.0.0
	*/
	constructor(max = 0, ttl = 0, resetTtl = false) {
		this.first = null;
		this.items = Object.create(null);
		this.last = null;
		this.max = max;
		this.resetTtl = resetTtl;
		this.size = 0;
		this.ttl = ttl;
	}
	/**
	* Removes all items from the cache.
	*
	* @method clear
	* @memberof LRU
	* @returns {LRU} The LRU instance for method chaining.
	* @example
	* cache.clear();
	* console.log(cache.size); // 0
	* @since 1.0.0
	*/
	clear() {
		this.first = null;
		this.items = Object.create(null);
		this.last = null;
		this.size = 0;
		return this;
	}
	/**
	* Removes an item from the cache by key.
	*
	* @method delete
	* @memberof LRU
	* @param {string} key - The key of the item to delete.
	* @returns {LRU} The LRU instance for method chaining.
	* @example
	* cache.set('key1', 'value1');
	* cache.delete('key1');
	* console.log(cache.has('key1')); // false
	* @see {@link LRU#has}
	* @see {@link LRU#clear}
	* @since 1.0.0
	*/
	delete(key) {
		if (this.has(key)) {
			const item = this.items[key];
			delete this.items[key];
			this.size--;
			if (item.prev !== null) item.prev.next = item.next;
			if (item.next !== null) item.next.prev = item.prev;
			if (this.first === item) this.first = item.next;
			if (this.last === item) this.last = item.prev;
		}
		return this;
	}
	/**
	* Returns an array of [key, value] pairs for the specified keys.
	* Order follows LRU order (least to most recently used).
	*
	* @method entries
	* @memberof LRU
	* @param {string[]} [keys=this.keys()] - Array of keys to get entries for. Defaults to all keys.
	* @returns {Array<Array<*>>} Array of [key, value] pairs in LRU order.
	* @example
	* cache.set('a', 1).set('b', 2);
	* console.log(cache.entries()); // [['a', 1], ['b', 2]]
	* console.log(cache.entries(['a'])); // [['a', 1]]
	* @see {@link LRU#keys}
	* @see {@link LRU#values}
	* @since 11.1.0
	*/
	entries(keys = this.keys()) {
		const result = new Array(keys.length);
		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			result[i] = [key, this.get(key)];
		}
		return result;
	}
	/**
	* Removes the least recently used item from the cache.
	*
	* @method evict
	* @memberof LRU
	* @param {boolean} [bypass=false] - Whether to force eviction even when cache is empty.
	* @returns {LRU} The LRU instance for method chaining.
	* @example
	* cache.set('old', 'value').set('new', 'value');
	* cache.evict(); // Removes 'old' item
	* @see {@link LRU#setWithEvicted}
	* @since 1.0.0
	*/
	evict(bypass = false) {
		if (bypass || this.size > 0) {
			const item = this.first;
			delete this.items[item.key];
			if (--this.size === 0) {
				this.first = null;
				this.last = null;
			} else {
				this.first = item.next;
				this.first.prev = null;
			}
		}
		return this;
	}
	/**
	* Returns the expiration timestamp for a given key.
	*
	* @method expiresAt
	* @memberof LRU
	* @param {string} key - The key to check expiration for.
	* @returns {number|undefined} The expiration timestamp in milliseconds, or undefined if key doesn't exist.
	* @example
	* const cache = new LRU(100, 5000); // 5 second TTL
	* cache.set('key1', 'value1');
	* console.log(cache.expiresAt('key1')); // timestamp 5 seconds from now
	* @see {@link LRU#get}
	* @see {@link LRU#has}
	* @since 1.0.0
	*/
	expiresAt(key) {
		let result;
		if (this.has(key)) result = this.items[key].expiry;
		return result;
	}
	/**
	* Retrieves a value from the cache by key. Updates the item's position to most recently used.
	*
	* @method get
	* @memberof LRU
	* @param {string} key - The key to retrieve.
	* @returns {*} The value associated with the key, or undefined if not found or expired.
	* @example
	* cache.set('key1', 'value1');
	* console.log(cache.get('key1')); // 'value1'
	* console.log(cache.get('nonexistent')); // undefined
	* @see {@link LRU#set}
	* @see {@link LRU#has}
	* @since 1.0.0
	*/
	get(key) {
		const item = this.items[key];
		if (item !== void 0) {
			if (this.ttl > 0) {
				if (item.expiry <= Date.now()) {
					this.delete(key);
					return;
				}
			}
			this.moveToEnd(item);
			return item.value;
		}
	}
	/**
	* Checks if a key exists in the cache.
	*
	* @method has
	* @memberof LRU
	* @param {string} key - The key to check for.
	* @returns {boolean} True if the key exists, false otherwise.
	* @example
	* cache.set('key1', 'value1');
	* console.log(cache.has('key1')); // true
	* console.log(cache.has('nonexistent')); // false
	* @see {@link LRU#get}
	* @see {@link LRU#delete}
	* @since 9.0.0
	*/
	has(key) {
		return key in this.items;
	}
	/**
	* Efficiently moves an item to the end of the LRU list (most recently used position).
	* This is an internal optimization method that avoids the overhead of the full set() operation
	* when only LRU position needs to be updated.
	*
	* @method moveToEnd
	* @memberof LRU
	* @param {Object} item - The cache item with prev/next pointers to reposition.
	* @private
	* @since 11.3.5
	*/
	moveToEnd(item) {
		if (this.last === item) return;
		if (item.prev !== null) item.prev.next = item.next;
		if (item.next !== null) item.next.prev = item.prev;
		if (this.first === item) this.first = item.next;
		item.prev = this.last;
		item.next = null;
		if (this.last !== null) this.last.next = item;
		this.last = item;
		if (this.first === null) this.first = item;
	}
	/**
	* Returns an array of all keys in the cache, ordered from least to most recently used.
	*
	* @method keys
	* @memberof LRU
	* @returns {string[]} Array of keys in LRU order.
	* @example
	* cache.set('a', 1).set('b', 2);
	* cache.get('a'); // Move 'a' to most recent
	* console.log(cache.keys()); // ['b', 'a']
	* @see {@link LRU#values}
	* @see {@link LRU#entries}
	* @since 9.0.0
	*/
	keys() {
		const result = new Array(this.size);
		let x = this.first;
		let i = 0;
		while (x !== null) {
			result[i++] = x.key;
			x = x.next;
		}
		return result;
	}
	/**
	* Sets a value in the cache and returns any evicted item.
	*
	* @method setWithEvicted
	* @memberof LRU
	* @param {string} key - The key to set.
	* @param {*} value - The value to store.
	* @param {boolean} [resetTtl=this.resetTtl] - Whether to reset the TTL for this operation.
	* @returns {Object|null} The evicted item (if any) with shape {key, value, expiry, prev, next}, or null.
	* @example
	* const cache = new LRU(2);
	* cache.set('a', 1).set('b', 2);
	* const evicted = cache.setWithEvicted('c', 3); // evicted = {key: 'a', value: 1, ...}
	* @see {@link LRU#set}
	* @see {@link LRU#evict}
	* @since 11.3.0
	*/
	setWithEvicted(key, value, resetTtl = this.resetTtl) {
		let evicted = null;
		if (this.has(key)) this.set(key, value, true, resetTtl);
		else {
			if (this.max > 0 && this.size === this.max) {
				evicted = { ...this.first };
				this.evict(true);
			}
			let item = this.items[key] = {
				expiry: this.ttl > 0 ? Date.now() + this.ttl : this.ttl,
				key,
				prev: this.last,
				next: null,
				value
			};
			if (++this.size === 1) this.first = item;
			else this.last.next = item;
			this.last = item;
		}
		return evicted;
	}
	/**
	* Sets a value in the cache. Updates the item's position to most recently used.
	*
	* @method set
	* @memberof LRU
	* @param {string} key - The key to set.
	* @param {*} value - The value to store.
	* @param {boolean} [bypass=false] - Internal parameter for setWithEvicted method.
	* @param {boolean} [resetTtl=this.resetTtl] - Whether to reset the TTL for this operation.
	* @returns {LRU} The LRU instance for method chaining.
	* @example
	* cache.set('key1', 'value1')
	*      .set('key2', 'value2')
	*      .set('key3', 'value3');
	* @see {@link LRU#get}
	* @see {@link LRU#setWithEvicted}
	* @since 1.0.0
	*/
	set(key, value, bypass = false, resetTtl = this.resetTtl) {
		let item = this.items[key];
		if (bypass || item !== void 0) {
			item.value = value;
			if (bypass === false && resetTtl) item.expiry = this.ttl > 0 ? Date.now() + this.ttl : this.ttl;
			this.moveToEnd(item);
		} else {
			if (this.max > 0 && this.size === this.max) this.evict(true);
			item = this.items[key] = {
				expiry: this.ttl > 0 ? Date.now() + this.ttl : this.ttl,
				key,
				prev: this.last,
				next: null,
				value
			};
			if (++this.size === 1) this.first = item;
			else this.last.next = item;
			this.last = item;
		}
		return this;
	}
	/**
	* Returns an array of all values in the cache for the specified keys.
	* Order follows LRU order (least to most recently used).
	*
	* @method values
	* @memberof LRU
	* @param {string[]} [keys=this.keys()] - Array of keys to get values for. Defaults to all keys.
	* @returns {Array<*>} Array of values corresponding to the keys in LRU order.
	* @example
	* cache.set('a', 1).set('b', 2);
	* console.log(cache.values()); // [1, 2]
	* console.log(cache.values(['a'])); // [1]
	* @see {@link LRU#keys}
	* @see {@link LRU#entries}
	* @since 11.1.0
	*/
	values(keys = this.keys()) {
		const result = new Array(keys.length);
		for (let i = 0; i < keys.length; i++) result[i] = this.get(keys[i]);
		return result;
	}
};
/**
* Factory function to create a new LRU cache instance with parameter validation.
*
* @function lru
* @param {number} [max=1000] - Maximum number of items to store. Must be >= 0. Use 0 for unlimited size.
* @param {number} [ttl=0] - Time to live in milliseconds. Must be >= 0. Use 0 for no expiration.
* @param {boolean} [resetTtl=false] - Whether to reset TTL when accessing existing items via get().
* @returns {LRU} A new LRU cache instance.
* @throws {TypeError} When parameters are invalid (negative numbers or wrong types).
* @example
* // Create cache with factory function
* const cache = lru(100, 5000, true);
* cache.set('key', 'value');
*
* @example
* // Error handling
* try {
*   const cache = lru(-1); // Invalid max
* } catch (error) {
*   console.error(error.message); // "Invalid max value"
* }
* @see {@link LRU}
* @since 1.0.0
*/
function lru(max = 1e3, ttl = 0, resetTtl = false) {
	if (isNaN(max) || max < 0) throw new TypeError("Invalid max value");
	if (isNaN(ttl) || ttl < 0) throw new TypeError("Invalid ttl value");
	if (typeof resetTtl !== "boolean") throw new TypeError("Invalid resetTtl value");
	return new LRU(max, ttl, resetTtl);
}
//#endregion
//#region port/v2/node_modules/pixi.js/lib/scene/text/canvas/utils/parseTaggedText.mjs
function hasTagStyles(style) {
	return !!style.tagStyles && Object.keys(style.tagStyles).length > 0;
}
function hasTagMarkup(text) {
	return text.includes("<");
}
function createMergedStyle(baseStyle, overrides) {
	return baseStyle.clone().assign(overrides);
}
function parseTaggedText(text, style) {
	const runs = [];
	const tagStyles = style.tagStyles;
	if (!hasTagStyles(style) || !hasTagMarkup(text)) {
		runs.push({
			text,
			style
		});
		return runs;
	}
	const styleStack = [style];
	const tagStack = [];
	let currentText = "";
	let i = 0;
	while (i < text.length) {
		const char = text[i];
		if (char === "<") {
			const closeIndex = text.indexOf(">", i);
			if (closeIndex === -1) {
				currentText += char;
				i++;
				continue;
			}
			const nextOpenIndex = text.indexOf("<", i + 1);
			if (nextOpenIndex !== -1 && nextOpenIndex < closeIndex) {
				currentText += char;
				i++;
				continue;
			}
			const tagContent = text.slice(i + 1, closeIndex);
			if (tagContent.startsWith("/")) {
				const closingTagName = tagContent.slice(1).trim();
				if (tagStack.length > 0 && tagStack[tagStack.length - 1] === closingTagName) {
					if (currentText.length > 0) {
						runs.push({
							text: currentText,
							style: styleStack[styleStack.length - 1]
						});
						currentText = "";
					}
					styleStack.pop();
					tagStack.pop();
					i = closeIndex + 1;
					continue;
				} else {
					currentText += text.slice(i, closeIndex + 1);
					i = closeIndex + 1;
					continue;
				}
			} else {
				const tagName = tagContent.trim();
				if (tagStyles[tagName]) {
					if (currentText.length > 0) {
						runs.push({
							text: currentText,
							style: styleStack[styleStack.length - 1]
						});
						currentText = "";
					}
					const currentStyle = styleStack[styleStack.length - 1];
					const mergedStyle = createMergedStyle(currentStyle, tagStyles[tagName]);
					styleStack.push(mergedStyle);
					tagStack.push(tagName);
					i = closeIndex + 1;
					continue;
				} else {
					currentText += text.slice(i, closeIndex + 1);
					i = closeIndex + 1;
					continue;
				}
			}
		} else {
			currentText += char;
			i++;
		}
	}
	if (currentText.length > 0) runs.push({
		text: currentText,
		style: styleStack[styleStack.length - 1]
	});
	return runs;
}
const NEWLINES_SET = /* @__PURE__ */ new Set([10, 13]);
const BREAKING_SPACES_SET = /* @__PURE__ */ new Set([
	9,
	32,
	8192,
	8193,
	8194,
	8195,
	8196,
	8197,
	8198,
	8200,
	8201,
	8202,
	8287,
	12288
]);
const BREAK_AFTER_CHARS_SET = /* @__PURE__ */ new Set([
	45,
	8208,
	8211,
	8212,
	173
]);
const NEWLINE_SPLIT_REGEX = /(\r\n|\r|\n)/;
const NEWLINE_MATCH_REGEX = /(?:\r\n|\r|\n)/;
function isNewline(char) {
	if (typeof char !== "string") return false;
	return NEWLINES_SET.has(char.charCodeAt(0));
}
function isBreakingSpace(char, _nextChar) {
	if (typeof char !== "string") return false;
	return BREAKING_SPACES_SET.has(char.charCodeAt(0));
}
function isBreakAfterChar(char) {
	if (typeof char !== "string") return false;
	return BREAK_AFTER_CHARS_SET.has(char.charCodeAt(0));
}
function collapseSpaces(whiteSpace) {
	return whiteSpace === "normal" || whiteSpace === "pre-line";
}
function collapseNewlines(whiteSpace) {
	return whiteSpace === "normal";
}
function trimRight(text) {
	if (typeof text !== "string") return "";
	let i = text.length - 1;
	while (i >= 0 && isBreakingSpace(text[i])) i--;
	return i < text.length - 1 ? text.slice(0, i + 1) : text;
}
function tokenize(text) {
	const tokens = [];
	const tokenChars = [];
	if (typeof text !== "string") return tokens;
	for (let i = 0; i < text.length; i++) {
		const char = text[i];
		const nextChar = text[i + 1];
		if (isBreakingSpace(char, nextChar) || isNewline(char)) {
			if (tokenChars.length > 0) {
				tokens.push(tokenChars.join(""));
				tokenChars.length = 0;
			}
			if (char === "\r" && nextChar === "\n") {
				tokens.push("\r\n");
				i++;
			} else tokens.push(char);
			continue;
		}
		tokenChars.push(char);
		if (isBreakAfterChar(char) && nextChar && !isBreakingSpace(nextChar) && !isNewline(nextChar)) {
			tokens.push(tokenChars.join(""));
			tokenChars.length = 0;
		}
	}
	if (tokenChars.length > 0) tokens.push(tokenChars.join(""));
	return tokens;
}
function getCharacterGroups(token, breakWords, splitFn, canBreakCharsFn) {
	const characters = splitFn(token);
	const groups = [];
	for (let j = 0; j < characters.length; j++) {
		let char = characters[j];
		let lastChar = char;
		let k = 1;
		while (characters[j + k]) {
			const nextChar = characters[j + k];
			if (!canBreakCharsFn(lastChar, nextChar, token, j, breakWords)) {
				char += nextChar;
				lastChar = nextChar;
				k++;
			} else break;
		}
		j += k - 1;
		groups.push(char);
	}
	return groups;
}
//#endregion
//#region port/v2/node_modules/pixi.js/lib/scene/text/canvas/utils/measureTaggedText.mjs
const NEWLINE_TO_SPACE_REGEX = /\r\n|\r|\n/g;
function measureTaggedText(text, style, wordWrap, context, measureTextFn, wrapMeasureTextFn, measureFontFn, canBreakCharsFn, wordWrapSplitFn) {
	const runs = parseTaggedText(text, style);
	if (collapseNewlines(style.whiteSpace)) for (let i = 0; i < runs.length; i++) {
		const run = runs[i];
		runs[i] = {
			text: run.text.replace(NEWLINE_TO_SPACE_REGEX, " "),
			style: run.style
		};
	}
	const runsByLine = [];
	let currentLineRuns = [];
	for (const run of runs) {
		const parts = run.text.split(NEWLINE_SPLIT_REGEX);
		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];
			if (part === "\r\n" || part === "\r" || part === "\n") {
				runsByLine.push(currentLineRuns);
				currentLineRuns = [];
			} else if (part.length > 0) currentLineRuns.push({
				text: part,
				style: run.style
			});
		}
	}
	if (currentLineRuns.length > 0 || runsByLine.length === 0) runsByLine.push(currentLineRuns);
	const wrappedRunsByLine = wordWrap ? wordWrapTaggedLines(runsByLine, style, context, wrapMeasureTextFn, canBreakCharsFn, wordWrapSplitFn) : runsByLine;
	const lineWidths = [];
	const lineAscents = [];
	const lineDescents = [];
	const lineHeightsArr = [];
	const lines = [];
	let maxLineWidth = 0;
	const baseFont = style._fontString;
	const baseFontProps = measureFontFn(baseFont);
	if (baseFontProps.fontSize === 0) {
		baseFontProps.fontSize = style.fontSize;
		baseFontProps.ascent = style.fontSize;
	}
	let lastFont = "";
	let hasDropShadow = !!style.dropShadow;
	let maxRunStrokeWidth = style._stroke?.width || 0;
	for (const lineRuns of wrappedRunsByLine) {
		let lineWidth = 0;
		let lineAscent = baseFontProps.ascent;
		let lineDescent = baseFontProps.descent;
		let lineText = "";
		for (const run of lineRuns) {
			const runFont = run.style._fontString;
			const runFontProps = measureFontFn(runFont);
			if (runFont !== lastFont) {
				context.font = runFont;
				lastFont = runFont;
			}
			const runWidth = measureTextFn(run.text, run.style.letterSpacing, context);
			lineWidth += runWidth;
			lineAscent = Math.max(lineAscent, runFontProps.ascent);
			lineDescent = Math.max(lineDescent, runFontProps.descent);
			lineText += run.text;
			const runStrokeWidth = run.style._stroke?.width || 0;
			if (runStrokeWidth > maxRunStrokeWidth) maxRunStrokeWidth = runStrokeWidth;
			if (!hasDropShadow && run.style.dropShadow) hasDropShadow = true;
		}
		if (lineRuns.length === 0) {
			lineAscent = baseFontProps.ascent;
			lineDescent = baseFontProps.descent;
		}
		lineWidths.push(lineWidth);
		lineAscents.push(lineAscent);
		lineDescents.push(lineDescent);
		lines.push(lineText);
		const computedLineHeight = style.lineHeight || lineAscent + lineDescent;
		lineHeightsArr.push(computedLineHeight + style.leading);
		maxLineWidth = Math.max(maxLineWidth, lineWidth);
	}
	const strokeWidth = maxRunStrokeWidth;
	const width = maxLineWidth + strokeWidth + (style.dropShadow ? style.dropShadow.distance : 0);
	let baseHeight = 0;
	for (let i = 0; i < lineHeightsArr.length; i++) baseHeight += lineHeightsArr[i];
	baseHeight = Math.max(baseHeight, lineHeightsArr[0] + strokeWidth);
	return {
		width,
		height: baseHeight + (style.dropShadow ? style.dropShadow.distance : 0),
		lines,
		lineWidths,
		lineHeight: (style.lineHeight || baseFontProps.fontSize) + style.leading,
		maxLineWidth,
		fontProperties: baseFontProps,
		runsByLine: wrappedRunsByLine,
		lineAscents,
		lineDescents,
		lineHeights: lineHeightsArr,
		hasDropShadow
	};
}
function wordWrapTaggedLines(runsByLine, style, context, measureTextFn, canBreakCharsFn, wordWrapSplitFn) {
	const { letterSpacing, whiteSpace, wordWrapWidth, breakWords } = style;
	const shouldCollapseSpaces = collapseSpaces(whiteSpace);
	const adjustedWrapWidth = wordWrapWidth + letterSpacing;
	const tokenWidthCache = {};
	let lastFont = "";
	const measureTokenWidth = (token, tokenStyle) => {
		const cacheKey = `${token}|${tokenStyle.styleKey}`;
		let width = tokenWidthCache[cacheKey];
		if (width === void 0) {
			const font = tokenStyle._fontString;
			if (font !== lastFont) {
				context.font = font;
				lastFont = font;
			}
			width = measureTextFn(token, tokenStyle.letterSpacing, context) + tokenStyle.letterSpacing;
			tokenWidthCache[cacheKey] = width;
		}
		return width;
	};
	const result = [];
	for (const lineRuns of runsByLine) {
		const styledTokens = tokenizeTaggedRuns(lineRuns);
		const resultStartLength = result.length;
		const getWordGroupWidth = (startIndex) => {
			let totalWidth = 0;
			let j = startIndex;
			do {
				const { token: groupToken, style: groupStyle } = styledTokens[j];
				totalWidth += measureTokenWidth(groupToken, groupStyle);
				j++;
			} while (j < styledTokens.length && styledTokens[j].continuesFromPrevious);
			return totalWidth;
		};
		const getWordGroupTokens = (startIndex) => {
			const tokens = [];
			let j = startIndex;
			do {
				tokens.push({
					token: styledTokens[j].token,
					style: styledTokens[j].style
				});
				j++;
			} while (j < styledTokens.length && styledTokens[j].continuesFromPrevious);
			return tokens;
		};
		let currentLineRuns = [];
		let currentWidth = 0;
		let canPrependSpaces = !shouldCollapseSpaces;
		let buildingRun = null;
		const flushBuildingRun = () => {
			if (buildingRun && buildingRun.text.length > 0) currentLineRuns.push(buildingRun);
			buildingRun = null;
		};
		const startNewLine = () => {
			flushBuildingRun();
			if (currentLineRuns.length > 0) {
				const lastRun = currentLineRuns[currentLineRuns.length - 1];
				lastRun.text = trimRight(lastRun.text);
				if (lastRun.text.length === 0) currentLineRuns.pop();
			}
			result.push(currentLineRuns);
			currentLineRuns = [];
			currentWidth = 0;
			canPrependSpaces = false;
		};
		for (let i = 0; i < styledTokens.length; i++) {
			const { token, style: tokenStyle, continuesFromPrevious } = styledTokens[i];
			const tokenWidth = measureTokenWidth(token, tokenStyle);
			if (shouldCollapseSpaces) {
				const currIsSpace = isBreakingSpace(token);
				const lastChar = buildingRun?.text[buildingRun.text.length - 1] ?? currentLineRuns[currentLineRuns.length - 1]?.text.slice(-1) ?? "";
				const lastIsSpace = lastChar ? isBreakingSpace(lastChar) : false;
				if (currIsSpace && lastIsSpace) continue;
			}
			const startsWordGroup = !continuesFromPrevious;
			const wordGroupWidth = startsWordGroup ? getWordGroupWidth(i) : tokenWidth;
			if (wordGroupWidth > adjustedWrapWidth && startsWordGroup) {
				if (currentWidth > 0) startNewLine();
				if (breakWords) {
					const wordGroupTokens = getWordGroupTokens(i);
					for (let g = 0; g < wordGroupTokens.length; g++) {
						const groupToken = wordGroupTokens[g].token;
						const groupStyle = wordGroupTokens[g].style;
						const charGroups = getCharacterGroups(groupToken, breakWords, wordWrapSplitFn, canBreakCharsFn);
						for (const char of charGroups) {
							const charWidth = measureTokenWidth(char, groupStyle);
							if (charWidth + currentWidth > adjustedWrapWidth) startNewLine();
							if (!buildingRun || buildingRun.style !== groupStyle) {
								flushBuildingRun();
								buildingRun = {
									text: char,
									style: groupStyle
								};
							} else buildingRun.text += char;
							currentWidth += charWidth;
						}
					}
					i += wordGroupTokens.length - 1;
				} else {
					const wordGroupTokens = getWordGroupTokens(i);
					flushBuildingRun();
					result.push(wordGroupTokens.map((t) => ({
						text: t.token,
						style: t.style
					})));
					canPrependSpaces = false;
					i += wordGroupTokens.length - 1;
				}
			} else if (wordGroupWidth + currentWidth > adjustedWrapWidth && startsWordGroup) {
				if (isBreakingSpace(token)) {
					canPrependSpaces = false;
					continue;
				}
				startNewLine();
				buildingRun = {
					text: token,
					style: tokenStyle
				};
				currentWidth = tokenWidth;
			} else if (continuesFromPrevious && !breakWords) {
				if (!buildingRun || buildingRun.style !== tokenStyle) {
					flushBuildingRun();
					buildingRun = {
						text: token,
						style: tokenStyle
					};
				} else buildingRun.text += token;
				currentWidth += tokenWidth;
			} else {
				const isSpace = isBreakingSpace(token);
				if (currentWidth === 0 && isSpace && !canPrependSpaces) continue;
				if (!buildingRun || buildingRun.style !== tokenStyle) {
					flushBuildingRun();
					buildingRun = {
						text: token,
						style: tokenStyle
					};
				} else buildingRun.text += token;
				currentWidth += tokenWidth;
			}
		}
		flushBuildingRun();
		if (currentLineRuns.length > 0) {
			const lastRun = currentLineRuns[currentLineRuns.length - 1];
			lastRun.text = trimRight(lastRun.text);
			if (lastRun.text.length === 0) currentLineRuns.pop();
		}
		if (currentLineRuns.length > 0 || result.length === resultStartLength) result.push(currentLineRuns);
	}
	return result;
}
function tokenizeTaggedRuns(runs) {
	const styledTokens = [];
	let lastTokenWasWord = false;
	for (const run of runs) {
		const tokens = tokenize(run.text);
		let isFirstTokenInRun = true;
		for (const token of tokens) {
			const isSpace = isBreakingSpace(token) || isNewline(token);
			const continuesFromPrevious = isFirstTokenInRun && lastTokenWasWord && !isSpace;
			styledTokens.push({
				token,
				style: run.style,
				continuesFromPrevious
			});
			lastTokenWasWord = !isSpace;
			isFirstTokenInRun = false;
		}
	}
	return styledTokens;
}
//#endregion
//#region port/v2/node_modules/pixi.js/lib/scene/text/canvas/utils/wordWrap.mjs
const contextSettings$1 = { willReadFrequently: true };
function getFromCache(key, letterSpacing, cache, context, measureTextFn) {
	let width = cache[key];
	if (typeof width !== "number") {
		width = measureTextFn(key, letterSpacing, context) + letterSpacing;
		cache[key] = width;
	}
	return width;
}
function wordWrap(text, style, canvas, measureTextFn, canBreakWordsFn, canBreakCharsFn, wordWrapSplitFn) {
	const context = canvas.getContext("2d", contextSettings$1);
	context.font = style._fontString;
	let width = 0;
	let line = "";
	const linesArray = [];
	const cache = /* @__PURE__ */ Object.create(null);
	const { letterSpacing, whiteSpace } = style;
	const shouldCollapseSpaces = collapseSpaces(whiteSpace);
	const shouldCollapseNewlines = collapseNewlines(whiteSpace);
	let canPrependSpaces = !shouldCollapseSpaces;
	const wordWrapWidth = style.wordWrapWidth + letterSpacing;
	const tokens = tokenize(text);
	for (let i = 0; i < tokens.length; i++) {
		let token = tokens[i];
		if (isNewline(token)) {
			if (!shouldCollapseNewlines) {
				linesArray.push(trimRight(line));
				canPrependSpaces = !shouldCollapseSpaces;
				line = "";
				width = 0;
				continue;
			}
			token = " ";
		}
		if (shouldCollapseSpaces) {
			const currIsBreakingSpace = isBreakingSpace(token);
			const lastIsBreakingSpace = isBreakingSpace(line[line.length - 1]);
			if (currIsBreakingSpace && lastIsBreakingSpace) continue;
		}
		const tokenWidth = getFromCache(token, letterSpacing, cache, context, measureTextFn);
		if (tokenWidth > wordWrapWidth) {
			if (line !== "") {
				linesArray.push(trimRight(line));
				line = "";
				width = 0;
			}
			if (canBreakWordsFn(token, style.breakWords)) {
				const charGroups = getCharacterGroups(token, style.breakWords, wordWrapSplitFn, canBreakCharsFn);
				for (const char of charGroups) {
					const characterWidth = getFromCache(char, letterSpacing, cache, context, measureTextFn);
					if (characterWidth + width > wordWrapWidth) {
						linesArray.push(trimRight(line));
						canPrependSpaces = false;
						line = "";
						width = 0;
					}
					line += char;
					width += characterWidth;
				}
			} else {
				if (line.length > 0) {
					linesArray.push(trimRight(line));
					line = "";
					width = 0;
				}
				linesArray.push(trimRight(token));
				canPrependSpaces = false;
				line = "";
				width = 0;
			}
		} else {
			if (tokenWidth + width > wordWrapWidth) {
				canPrependSpaces = false;
				linesArray.push(trimRight(line));
				line = "";
				width = 0;
			}
			if (line.length > 0 || !isBreakingSpace(token) || canPrependSpaces) {
				line += token;
				width += tokenWidth;
			}
		}
	}
	const trimmedLine = trimRight(line);
	if (trimmedLine.length > 0) linesArray.push(trimmedLine);
	return linesArray.join("\n");
}
//#endregion
//#region port/v2/node_modules/pixi.js/lib/scene/text/canvas/CanvasTextMetrics.mjs
const contextSettings = { willReadFrequently: true };
const _CanvasTextMetrics = class _CanvasTextMetrics {
	/**
	* Checking that we can use modern canvas 2D API.
	*
	* Note: This is an unstable API, Chrome < 94 use `textLetterSpacing`, later versions use `letterSpacing`.
	* @see CanvasTextMetrics.experimentalLetterSpacing
	* @see https://developer.mozilla.org/en-US/docs/Web/API/ICanvasRenderingContext2D/letterSpacing
	* @see https://developer.chrome.com/origintrials/#/view_trial/3585991203293757441
	*/
	static get experimentalLetterSpacingSupported() {
		let result = _CanvasTextMetrics._experimentalLetterSpacingSupported;
		if (result === void 0) {
			const proto = DOMAdapter.get().getCanvasRenderingContext2D().prototype;
			result = _CanvasTextMetrics._experimentalLetterSpacingSupported = "letterSpacing" in proto || "textLetterSpacing" in proto;
		}
		return result;
	}
	/**
	* @param text - the text that was measured
	* @param style - the style that was measured
	* @param width - the measured width of the text
	* @param height - the measured height of the text
	* @param lines - an array of the lines of text broken by new lines and wrapping if specified in style
	* @param lineWidths - an array of the line widths for each line matched to `lines`
	* @param lineHeight - the measured line height for this style
	* @param maxLineWidth - the maximum line width for all measured lines
	* @param fontProperties - the font properties object from TextMetrics.measureFont
	* @param taggedData - optional object containing tagged text specific data
	* @param taggedData.runsByLine - per-line style runs for tagged text
	* @param taggedData.lineAscents - per-line ascent values for tagged text
	* @param taggedData.lineDescents - per-line descent values for tagged text
	* @param taggedData.lineHeights - per-line height values for tagged text
	* @param taggedData.hasDropShadow - whether any run has a drop shadow
	*/
	constructor(text, style, width, height, lines, lineWidths, lineHeight, maxLineWidth, fontProperties, taggedData) {
		this.text = text;
		this.style = style;
		this.width = width;
		this.height = height;
		this.lines = lines;
		this.lineWidths = lineWidths;
		this.lineHeight = lineHeight;
		this.maxLineWidth = maxLineWidth;
		this.fontProperties = fontProperties;
		if (taggedData) {
			this.runsByLine = taggedData.runsByLine;
			this.lineAscents = taggedData.lineAscents;
			this.lineDescents = taggedData.lineDescents;
			this.lineHeights = taggedData.lineHeights;
			this.hasDropShadow = taggedData.hasDropShadow;
		}
	}
	/**
	* Measures the supplied string of text and returns a Rectangle.
	* @param text - The text to measure.
	* @param style - The text style to use for measuring
	* @param canvas - optional specification of the canvas to use for measuring.
	* @param wordWrap
	* @returns Measured width and height of the text.
	*/
	static measureText(text = " ", style, canvas = _CanvasTextMetrics._canvas, wordWrap2 = style.wordWrap) {
		const textKey = `${text}-${style.styleKey}-wordWrap-${wordWrap2}`;
		if (_CanvasTextMetrics._measurementCache.has(textKey)) return _CanvasTextMetrics._measurementCache.get(textKey);
		if (hasTagStyles(style) && hasTagMarkup(text)) {
			const result = measureTaggedText(text, style, wordWrap2, _CanvasTextMetrics._context, _CanvasTextMetrics._measureText, _CanvasTextMetrics._measureTextAdvance, _CanvasTextMetrics.measureFont, _CanvasTextMetrics.canBreakChars, _CanvasTextMetrics.wordWrapSplit);
			const measurements2 = new _CanvasTextMetrics(text, style, result.width, result.height, result.lines, result.lineWidths, result.lineHeight, result.maxLineWidth, result.fontProperties, {
				runsByLine: result.runsByLine,
				lineAscents: result.lineAscents,
				lineDescents: result.lineDescents,
				lineHeights: result.lineHeights,
				hasDropShadow: result.hasDropShadow
			});
			_CanvasTextMetrics._measurementCache.set(textKey, measurements2);
			return measurements2;
		}
		const font = style._fontString;
		const fontProperties = _CanvasTextMetrics.measureFont(font);
		if (fontProperties.fontSize === 0) {
			fontProperties.fontSize = style.fontSize;
			fontProperties.ascent = style.fontSize;
			fontProperties.descent = 0;
		}
		const context = _CanvasTextMetrics._context;
		context.font = font;
		const lines = (wordWrap2 ? _CanvasTextMetrics._wordWrap(text, style, canvas) : text).split(NEWLINE_MATCH_REGEX);
		const lineWidths = new Array(lines.length);
		let maxLineWidth = 0;
		for (let i = 0; i < lines.length; i++) {
			const lineWidth = _CanvasTextMetrics._measureText(lines[i], style.letterSpacing, context);
			lineWidths[i] = lineWidth;
			maxLineWidth = Math.max(maxLineWidth, lineWidth);
		}
		const strokeWidth = style._stroke?.width ?? 0;
		const lineHeight = style.lineHeight || fontProperties.fontSize;
		const width = _CanvasTextMetrics._adjustWidthForStyle(maxLineWidth, style);
		const baseHeight = Math.max(lineHeight, fontProperties.fontSize + strokeWidth) + (lines.length - 1) * (lineHeight + style.leading);
		const height = _CanvasTextMetrics._adjustHeightForStyle(baseHeight, style);
		const measurements = new _CanvasTextMetrics(text, style, width, height, lines, lineWidths, lineHeight + style.leading, maxLineWidth, fontProperties);
		_CanvasTextMetrics._measurementCache.set(textKey, measurements);
		return measurements;
	}
	/**
	* Adjusts the measured width to account for stroke and drop shadow.
	* @param baseWidth - The base content width
	* @param style - The text style
	* @returns The adjusted width
	*/
	static _adjustWidthForStyle(baseWidth, style) {
		let width = baseWidth + (style._stroke?.width || 0);
		if (style.dropShadow) width += style.dropShadow.distance;
		return width;
	}
	/**
	* Adjusts the measured height to account for drop shadow.
	* @param baseHeight - The base content height
	* @param style - The text style
	* @returns The adjusted height
	*/
	static _adjustHeightForStyle(baseHeight, style) {
		let height = baseHeight;
		if (style.dropShadow) height += style.dropShadow.distance;
		return height;
	}
	/**
	* Measures the rendered width of a string, accounting for letter spacing and using the provided context.
	* Returns the larger of the advance width and the bounding box width.
	* @param text - The text to measure
	* @param letterSpacing - Letter spacing in pixels
	* @param context - Canvas 2D context
	* @returns The measured width of the text with spacing
	* @internal
	*/
	static _measureText(text, letterSpacing, context) {
		const { metricWidth, metrics, letterSpacingVal } = _CanvasTextMetrics._measureTextCore(text, letterSpacing, context);
		const actualBoundingBoxLeft = -(metrics.actualBoundingBoxLeft ?? 0);
		let boundsWidth = (metrics.actualBoundingBoxRight ?? 0) - actualBoundingBoxLeft;
		if (metrics.width > 0) boundsWidth += letterSpacingVal;
		return Math.max(metricWidth, boundsWidth);
	}
	/**
	* Measures advance width only (no bounding box). Advance widths are additive,
	* making this suitable for word wrap line-fitting where per-token widths must sum correctly.
	* @param text - The text to measure
	* @param letterSpacing - Letter spacing in pixels
	* @param context - Canvas 2D context
	* @returns The advance width of the text
	* @internal
	*/
	static _measureTextAdvance(text, letterSpacing, context) {
		return _CanvasTextMetrics._measureTextCore(text, letterSpacing, context).metricWidth;
	}
	/**
	* Shared measurement core: sets up letter spacing on the context, calls
	* context.measureText, and adjusts the advance width for letter spacing.
	* @param text
	* @param letterSpacing
	* @param context
	* @internal
	*/
	static _measureTextCore(text, letterSpacing, context) {
		let useExperimentalLetterSpacing = false;
		if (_CanvasTextMetrics.experimentalLetterSpacingSupported) if (_CanvasTextMetrics.experimentalLetterSpacing) {
			context.letterSpacing = `${letterSpacing}px`;
			context.textLetterSpacing = `${letterSpacing}px`;
			useExperimentalLetterSpacing = true;
		} else {
			context.letterSpacing = "0px";
			context.textLetterSpacing = "0px";
		}
		const metrics = context.measureText(text);
		let metricWidth = metrics.width;
		let letterSpacingVal = 0;
		if (metricWidth > 0) {
			if (useExperimentalLetterSpacing) letterSpacingVal = -letterSpacing;
			else letterSpacingVal = (_CanvasTextMetrics.graphemeSegmenter(text).length - 1) * letterSpacing;
			metricWidth += letterSpacingVal;
		}
		return {
			metricWidth,
			metrics,
			letterSpacingVal
		};
	}
	/**
	* Applies newlines to a string to have it optimally fit into the horizontal
	* bounds set by the Text object's wordWrapWidth property.
	* @param text - String to apply word wrapping to
	* @param style - the style to use when wrapping
	* @param canvas - optional specification of the canvas to use for measuring.
	* @returns New string with new lines applied where required
	*/
	static _wordWrap(text, style, canvas = _CanvasTextMetrics._canvas) {
		return wordWrap(text, style, canvas, _CanvasTextMetrics._measureTextAdvance, _CanvasTextMetrics.canBreakWords, _CanvasTextMetrics.canBreakChars, _CanvasTextMetrics.wordWrapSplit);
	}
	/**
	* Determines if char is a breaking whitespace.
	*
	* It allows one to determine whether char should be a breaking whitespace
	* For example certain characters in CJK langs or numbers.
	* It must return a boolean.
	* @param char - The character
	* @param [_nextChar] - The next character
	* @returns True if whitespace, False otherwise.
	*/
	static isBreakingSpace(char, _nextChar) {
		return isBreakingSpace(char, _nextChar);
	}
	/**
	* Overridable helper method used internally by TextMetrics, exposed to allow customizing the class's behavior.
	*
	* It allows one to customise which words should break
	* Examples are if the token is CJK or numbers.
	* It must return a boolean.
	* @param _token - The token
	* @param breakWords - The style attr break words
	* @returns Whether to break word or not
	*/
	static canBreakWords(_token, breakWords) {
		return breakWords;
	}
	/**
	* Overridable helper method used internally by TextMetrics, exposed to allow customizing the class's behavior.
	*
	* It allows one to determine whether a pair of characters
	* should be broken by newlines
	* For example certain characters in CJK langs or numbers.
	* It must return a boolean.
	* @param _char - The character
	* @param _nextChar - The next character
	* @param _token - The token/word the characters are from
	* @param _index - The index in the token of the char
	* @param _breakWords - The style attr break words
	* @returns whether to break word or not
	*/
	static canBreakChars(_char, _nextChar, _token, _index, _breakWords) {
		return true;
	}
	/**
	* Overridable helper method used internally by TextMetrics, exposed to allow customizing the class's behavior.
	*
	* It is called when a token (usually a word) has to be split into separate pieces
	* in order to determine the point to break a word.
	* It must return an array of characters.
	* @param token - The token to split
	* @returns The characters of the token
	* @see CanvasTextMetrics.graphemeSegmenter
	*/
	static wordWrapSplit(token) {
		return _CanvasTextMetrics.graphemeSegmenter(token);
	}
	/**
	* Calculates the ascent, descent and fontSize of a given font-style
	* @param font - String representing the style of the font
	* @returns Font properties object
	*/
	static measureFont(font) {
		if (_CanvasTextMetrics._fonts[font]) return _CanvasTextMetrics._fonts[font];
		const context = _CanvasTextMetrics._context;
		context.font = font;
		const metrics = context.measureText(_CanvasTextMetrics.METRICS_STRING + _CanvasTextMetrics.BASELINE_SYMBOL);
		const ascent = metrics.actualBoundingBoxAscent ?? 0;
		const descent = metrics.actualBoundingBoxDescent ?? 0;
		const properties = {
			ascent,
			descent,
			fontSize: ascent + descent
		};
		_CanvasTextMetrics._fonts[font] = properties;
		return properties;
	}
	/**
	* Clear font metrics in metrics cache.
	* @param {string} [font] - font name. If font name not set then clear cache for all fonts.
	*/
	static clearMetrics(font = "") {
		if (font) delete _CanvasTextMetrics._fonts[font];
		else _CanvasTextMetrics._fonts = {};
	}
	/**
	* Cached canvas element for measuring text
	* TODO: this should be private, but isn't because of backward compat, will fix later.
	* @ignore
	*/
	static get _canvas() {
		if (!_CanvasTextMetrics.__canvas) {
			let canvas;
			try {
				const c = new OffscreenCanvas(0, 0);
				if (c.getContext("2d", contextSettings)?.measureText) {
					_CanvasTextMetrics.__canvas = c;
					return c;
				}
				canvas = DOMAdapter.get().createCanvas();
			} catch (_cx) {
				canvas = DOMAdapter.get().createCanvas();
			}
			canvas.width = canvas.height = 10;
			_CanvasTextMetrics.__canvas = canvas;
		}
		return _CanvasTextMetrics.__canvas;
	}
	/**
	* TODO: this should be private, but isn't because of backward compat, will fix later.
	* @ignore
	*/
	static get _context() {
		if (!_CanvasTextMetrics.__context) _CanvasTextMetrics.__context = _CanvasTextMetrics._canvas.getContext("2d", contextSettings);
		return _CanvasTextMetrics.__context;
	}
};
/**
* String used for calculate font metrics.
* These characters are all tall to help calculate the height required for text.
*/
_CanvasTextMetrics.METRICS_STRING = "|ÉqÅ";
/** Baseline symbol for calculate font metrics. */
_CanvasTextMetrics.BASELINE_SYMBOL = "M";
/** Baseline multiplier for calculate font metrics. */
_CanvasTextMetrics.BASELINE_MULTIPLIER = 1.4;
/** Height multiplier for setting height of canvas to calculate font metrics. */
_CanvasTextMetrics.HEIGHT_MULTIPLIER = 2;
/**
* A Unicode "character", or "grapheme cluster", can be composed of multiple Unicode code points,
* such as letters with diacritical marks (e.g. `'\u0065\u0301'`, letter e with acute)
* or emojis with modifiers (e.g. `'\uD83E\uDDD1\u200D\uD83D\uDCBB'`, technologist).
* The new `Intl.Segmenter` API in ES2022 can split the string into grapheme clusters correctly. If it is not available,
* PixiJS will fallback to use the iterator of String, which can only spilt the string into code points.
* If you want to get full functionality in environments that don't support `Intl.Segmenter` (such as Firefox),
* you can use other libraries such as [grapheme-splitter]{@link https://www.npmjs.com/package/grapheme-splitter}
* or [graphemer]{@link https://www.npmjs.com/package/graphemer} to create a polyfill. Since these libraries can be
* relatively large in size to handle various Unicode grapheme clusters properly, PixiJS won't use them directly.
*/
_CanvasTextMetrics.graphemeSegmenter = (() => {
	if (typeof Intl?.Segmenter === "function") {
		const segmenter = new Intl.Segmenter();
		return (s) => {
			const segments = segmenter.segment(s);
			const result = [];
			let i = 0;
			for (const segment of segments) result[i++] = segment.segment;
			return result;
		};
	}
	return (s) => [...s];
})();
/**
* New rendering behavior for letter-spacing which uses Chrome's new native API. This will
* lead to more accurate letter-spacing results because it does not try to manually draw
* each character. However, this Chrome API is experimental and may not serve all cases yet.
* @see CanvasTextMetrics.experimentalLetterSpacingSupported
*/
_CanvasTextMetrics.experimentalLetterSpacing = false;
/** Cache of {@link TextMetrics.FontMetrics} objects. */
_CanvasTextMetrics._fonts = {};
/** Cache for measured text metrics */
_CanvasTextMetrics._measurementCache = lru(1e3);
let CanvasTextMetrics = _CanvasTextMetrics;
//#endregion
//#region port/v2/node_modules/pixi.js/lib/scene/text/canvas/utils/fontStringFromTextStyle.mjs
const genericFontFamilies = [
	"serif",
	"sans-serif",
	"monospace",
	"cursive",
	"fantasy",
	"system-ui"
];
function fontStringFromTextStyle(style) {
	const fontSizeString = typeof style.fontSize === "number" ? `${style.fontSize}px` : style.fontSize;
	let fontFamilies = style.fontFamily;
	if (!Array.isArray(style.fontFamily)) fontFamilies = style.fontFamily.split(",");
	for (let i = fontFamilies.length - 1; i >= 0; i--) {
		let fontFamily = fontFamilies[i].trim();
		if (!/([\"\'])[^\'\"]+\1/.test(fontFamily) && !genericFontFamilies.includes(fontFamily)) fontFamily = `"${fontFamily}"`;
		fontFamilies[i] = fontFamily;
	}
	return `${style.fontStyle} ${style.fontVariant} ${style.fontWeight} ${fontSizeString} ${fontFamilies.join(",")}`;
}
//#endregion
//#region port/v2/node_modules/pixi.js/lib/scene/text/canvas/utils/getCanvasFillStyle.mjs
const PRECISION = 1e5;
function getCanvasFillStyle(fillStyle, context, textMetrics, padding = 0, offsetX = 0, offsetY = 0) {
	if (fillStyle.texture === Texture.WHITE && !fillStyle.fill) return Color.shared.setValue(fillStyle.color).setAlpha(fillStyle.alpha ?? 1).toHexa();
	else if (!fillStyle.fill) {
		const pattern = context.createPattern(fillStyle.texture.source.resource, "repeat");
		const tempMatrix = fillStyle.matrix.copyTo(Matrix.shared);
		tempMatrix.scale(fillStyle.texture.source.pixelWidth, fillStyle.texture.source.pixelHeight);
		pattern.setTransform(tempMatrix);
		return pattern;
	} else if (fillStyle.fill instanceof FillPattern) {
		const fillPattern = fillStyle.fill;
		const pattern = context.createPattern(fillPattern.texture.source.resource, "repeat");
		canvasUtils.applyPatternTransform(pattern, fillPattern.transform, false);
		return pattern;
	} else if (fillStyle.fill instanceof FillGradient) {
		const fillGradient = fillStyle.fill;
		const isLinear = fillGradient.type === "linear";
		const isLocal = fillGradient.textureSpace === "local";
		let width = 1;
		let height = 1;
		if (isLocal && textMetrics) {
			width = textMetrics.width + padding;
			height = textMetrics.height + padding;
		}
		let gradient;
		let isNearlyVertical = false;
		if (isLinear) {
			const { start, end } = fillGradient;
			gradient = context.createLinearGradient(start.x * width + offsetX, start.y * height + offsetY, end.x * width + offsetX, end.y * height + offsetY);
			isNearlyVertical = Math.abs(end.x - start.x) < Math.abs((end.y - start.y) * .1);
		} else {
			const { center, innerRadius, outerCenter, outerRadius } = fillGradient;
			gradient = context.createRadialGradient(center.x * width + offsetX, center.y * height + offsetY, innerRadius * width, outerCenter.x * width + offsetX, outerCenter.y * height + offsetY, outerRadius * width);
		}
		if (isNearlyVertical && isLocal && textMetrics) {
			const ratio = textMetrics.lineHeight / height;
			for (let i = 0; i < textMetrics.lines.length; i++) {
				const start = (i * textMetrics.lineHeight + padding / 2) / height;
				fillGradient.colorStops.forEach((stop) => {
					let globalStop = start + stop.offset * ratio;
					globalStop = Math.max(0, Math.min(1, globalStop));
					gradient.addColorStop(Math.floor(globalStop * PRECISION) / PRECISION, Color.shared.setValue(stop.color).toHex());
				});
			}
		} else fillGradient.colorStops.forEach((stop) => {
			gradient.addColorStop(stop.offset, Color.shared.setValue(stop.color).toHex());
		});
		return gradient;
	}
	warn("FillStyle not recognised", fillStyle);
	return "red";
}
//#endregion
//#region port/v2/node_modules/pixi.js/lib/scene/text/canvas/CanvasTextGenerator.mjs
const tempRect = new Rectangle();
function countSpaces(text) {
	let count = 0;
	for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) === 32) count++;
	return count;
}
var CanvasTextGeneratorClass = class {
	/**
	* Creates a canvas with the specified text rendered to it.
	*
	* Generates a canvas of appropriate size, renders the text with the provided style,
	* and returns both the canvas/context and a Rectangle representing the text bounds.
	*
	* When trim is enabled in the style, the frame will represent the bounds of the
	* non-transparent pixels, which can be smaller than the full canvas.
	* @param options - The options for generating the text canvas
	* @param options.text - The text to render
	* @param options.style - The style to apply to the text
	* @param options.resolution - The resolution of the canvas (defaults to 1)
	* @param options.padding
	* @returns An object containing the canvas/context and the frame (bounds) of the text
	*/
	getCanvasAndContext(options) {
		const { text, style, resolution = 1 } = options;
		const padding = style._getFinalPadding();
		const measured = CanvasTextMetrics.measureText(text || " ", style);
		const width = Math.ceil(Math.ceil(Math.max(1, measured.width) + padding * 2) * resolution);
		const height = Math.ceil(Math.ceil(Math.max(1, measured.height) + padding * 2) * resolution);
		const canvasAndContext = CanvasPool.getOptimalCanvasAndContext(width, height);
		this._renderTextToCanvas(style, padding, resolution, canvasAndContext, measured);
		return {
			canvasAndContext,
			frame: style.trim ? getCanvasBoundingBox({
				canvas: canvasAndContext.canvas,
				width,
				height,
				resolution: 1,
				output: tempRect
			}) : tempRect.set(0, 0, width, height)
		};
	}
	/**
	* Returns a canvas and context to the pool.
	*
	* This should be called when you're done with the canvas to allow reuse
	* and prevent memory leaks.
	* @param canvasAndContext - The canvas and context to return to the pool
	*/
	returnCanvasAndContext(canvasAndContext) {
		CanvasPool.returnCanvasAndContext(canvasAndContext);
	}
	/**
	* Renders text to its canvas, and updates its texture.
	* @param style - The style of the text
	* @param padding - The padding of the text
	* @param resolution - The resolution of the text
	* @param canvasAndContext - The canvas and context to render the text to
	* @param measured - Pre-measured text metrics to avoid duplicate measurement
	*/
	_renderTextToCanvas(style, padding, resolution, canvasAndContext, measured) {
		if (measured.runsByLine && measured.runsByLine.length > 0) {
			this._renderTaggedTextToCanvas(measured, style, padding, resolution, canvasAndContext);
			return;
		}
		const { canvas, context } = canvasAndContext;
		const font = fontStringFromTextStyle(style);
		const lines = measured.lines;
		const lineHeight = measured.lineHeight;
		const lineWidths = measured.lineWidths;
		const maxLineWidth = measured.maxLineWidth;
		const fontProperties = measured.fontProperties;
		const height = canvas.height;
		context.resetTransform();
		context.scale(resolution, resolution);
		context.textBaseline = style.textBaseline;
		if (style._stroke?.width) {
			const strokeStyle = style._stroke;
			context.lineWidth = strokeStyle.width;
			context.miterLimit = strokeStyle.miterLimit;
			context.lineJoin = strokeStyle.join;
			context.lineCap = strokeStyle.cap;
		}
		context.font = font;
		let linePositionX;
		let linePositionY;
		const passesCount = style.dropShadow ? 2 : 1;
		const halfStroke = (style._stroke?.width ?? 0) / 2;
		let linePositionYShift = (lineHeight - fontProperties.fontSize) / 2;
		if (lineHeight - fontProperties.fontSize < 0) linePositionYShift = 0;
		for (let i = 0; i < passesCount; ++i) {
			const isShadowPass = style.dropShadow && i === 0;
			const dsOffsetText = isShadowPass ? Math.ceil(Math.max(1, height) + padding * 2) : 0;
			const dsOffsetShadow = dsOffsetText * resolution;
			if (isShadowPass) this._setupDropShadow(context, style, resolution, dsOffsetShadow);
			else {
				const gradientBounds = style._gradientBounds;
				const gradientOffset = style._gradientOffset;
				if (gradientBounds) {
					const gradientMetrics = {
						width: gradientBounds.width,
						height: gradientBounds.height,
						lineHeight: gradientBounds.height,
						lines: measured.lines
					};
					this._setFillAndStrokeStyles(context, style, gradientMetrics, padding, halfStroke, gradientOffset?.x ?? 0, gradientOffset?.y ?? 0);
				} else if (gradientOffset) this._setFillAndStrokeStyles(context, style, measured, padding, halfStroke, gradientOffset.x, gradientOffset.y);
				else this._setFillAndStrokeStyles(context, style, measured, padding, halfStroke);
				context.shadowColor = "rgba(0,0,0,0)";
			}
			for (let j = 0; j < lines.length; j++) {
				linePositionX = halfStroke;
				linePositionY = halfStroke + j * lineHeight + fontProperties.ascent + linePositionYShift;
				linePositionX += this._getAlignmentOffset(lineWidths[j], maxLineWidth, style.align);
				let wordSpacing = 0;
				if (style.align === "justify" && style.wordWrap && j < lines.length - 1) {
					const spaces = countSpaces(lines[j]);
					if (spaces > 0) wordSpacing = (maxLineWidth - lineWidths[j]) / spaces;
				}
				if (style._stroke?.width) this._drawLetterSpacing(lines[j], style, canvasAndContext, linePositionX + padding, linePositionY + padding - dsOffsetText, true, wordSpacing);
				if (style._fill !== void 0) this._drawLetterSpacing(lines[j], style, canvasAndContext, linePositionX + padding, linePositionY + padding - dsOffsetText, false, wordSpacing);
			}
		}
	}
	/**
	* Renders tagged text (with per-run styles) to canvas.
	* @param measured - The measured text metrics containing runsByLine
	* @param style - The base text style
	* @param padding - The padding of the text
	* @param resolution - The resolution of the text
	* @param canvasAndContext - The canvas and context to render to
	*/
	_renderTaggedTextToCanvas(measured, style, padding, resolution, canvasAndContext) {
		const { canvas, context } = canvasAndContext;
		const { runsByLine, lineWidths, maxLineWidth, lineAscents, lineHeights, hasDropShadow } = measured;
		const height = canvas.height;
		context.resetTransform();
		context.scale(resolution, resolution);
		context.textBaseline = style.textBaseline;
		const passesCount = hasDropShadow ? 2 : 1;
		let maxStrokeWidth = style._stroke?.width ?? 0;
		for (const lineRuns of runsByLine) for (const run of lineRuns) {
			const w = run.style._stroke?.width ?? 0;
			if (w > maxStrokeWidth) maxStrokeWidth = w;
		}
		const halfStroke = maxStrokeWidth / 2;
		const runDataByLine = [];
		for (let lineIndex = 0; lineIndex < runsByLine.length; lineIndex++) {
			const lineRuns = runsByLine[lineIndex];
			const runData = [];
			for (const run of lineRuns) {
				const font = fontStringFromTextStyle(run.style);
				context.font = font;
				runData.push({
					width: CanvasTextMetrics._measureText(run.text, run.style.letterSpacing, context),
					font
				});
			}
			runDataByLine.push(runData);
		}
		for (let pass = 0; pass < passesCount; ++pass) {
			const isShadowPass = hasDropShadow && pass === 0;
			const dsOffsetText = isShadowPass ? Math.ceil(Math.max(1, height) + padding * 2) : 0;
			const dsOffsetShadow = dsOffsetText * resolution;
			if (!isShadowPass) context.shadowColor = "rgba(0,0,0,0)";
			let currentY = halfStroke;
			for (let lineIndex = 0; lineIndex < runsByLine.length; lineIndex++) {
				const lineRuns = runsByLine[lineIndex];
				const lineWidth = lineWidths[lineIndex];
				const lineAscent = lineAscents[lineIndex];
				const currentLineHeight = lineHeights[lineIndex];
				const lineRunData = runDataByLine[lineIndex];
				let linePositionX = halfStroke;
				linePositionX += this._getAlignmentOffset(lineWidth, maxLineWidth, style.align);
				let wordSpacing = 0;
				if (style.align === "justify" && style.wordWrap && lineIndex < runsByLine.length - 1) {
					let totalSpaces = 0;
					for (const run of lineRuns) totalSpaces += countSpaces(run.text);
					if (totalSpaces > 0) wordSpacing = (maxLineWidth - lineWidth) / totalSpaces;
				}
				const linePositionY = currentY + lineAscent;
				let runX = linePositionX + padding;
				for (let runIndex = 0; runIndex < lineRuns.length; runIndex++) {
					const run = lineRuns[runIndex];
					const { width: runWidth, font: runFont } = lineRunData[runIndex];
					context.font = runFont;
					context.textBaseline = run.style.textBaseline;
					if (run.style._stroke?.width) {
						const runStroke = run.style._stroke;
						context.lineWidth = runStroke.width;
						context.miterLimit = runStroke.miterLimit;
						context.lineJoin = runStroke.join;
						context.lineCap = runStroke.cap;
						if (isShadowPass) if (run.style.dropShadow) this._setupDropShadow(context, run.style, resolution, dsOffsetShadow);
						else {
							const spacesSkipped = countSpaces(run.text);
							runX += runWidth + spacesSkipped * wordSpacing;
							continue;
						}
						else {
							const runFontProps = CanvasTextMetrics.measureFont(runFont);
							const runHeight = run.style.lineHeight || runFontProps.fontSize;
							context.strokeStyle = getCanvasFillStyle(runStroke, context, {
								width: runWidth,
								height: runHeight,
								lineHeight: runHeight,
								lines: [run.text]
							}, padding * 2, runX - padding, currentY);
						}
						this._drawLetterSpacing(run.text, run.style, canvasAndContext, runX, linePositionY + padding - dsOffsetText, true, wordSpacing);
					}
					const spacesInRun = countSpaces(run.text);
					runX += runWidth + spacesInRun * wordSpacing;
				}
				runX = linePositionX + padding;
				for (let runIndex = 0; runIndex < lineRuns.length; runIndex++) {
					const run = lineRuns[runIndex];
					const { width: runWidth, font: runFont } = lineRunData[runIndex];
					context.font = runFont;
					context.textBaseline = run.style.textBaseline;
					if (run.style._fill !== void 0) {
						if (isShadowPass) if (run.style.dropShadow) this._setupDropShadow(context, run.style, resolution, dsOffsetShadow);
						else {
							const spacesSkipped = countSpaces(run.text);
							runX += runWidth + spacesSkipped * wordSpacing;
							continue;
						}
						else {
							const runFontProps = CanvasTextMetrics.measureFont(runFont);
							const runHeight = run.style.lineHeight || runFontProps.fontSize;
							const runMetrics = {
								width: runWidth,
								height: runHeight,
								lineHeight: runHeight,
								lines: [run.text]
							};
							context.fillStyle = getCanvasFillStyle(run.style._fill, context, runMetrics, padding * 2, runX - padding, currentY);
						}
						this._drawLetterSpacing(run.text, run.style, canvasAndContext, runX, linePositionY + padding - dsOffsetText, false, wordSpacing);
					}
					const spacesInFillRun = countSpaces(run.text);
					runX += runWidth + spacesInFillRun * wordSpacing;
				}
				currentY += currentLineHeight;
			}
		}
	}
	/**
	* Sets fill and stroke styles on the canvas context for text rendering.
	* @param context - The canvas context
	* @param style - The text style
	* @param metrics - The text metrics for gradient calculation
	* @param padding - The padding value
	* @param halfStroke - Half the stroke width
	* @param offsetX - X offset for gradient positioning
	* @param offsetY - Y offset for gradient positioning
	*/
	_setFillAndStrokeStyles(context, style, metrics, padding, halfStroke, offsetX = 0, offsetY = 0) {
		context.fillStyle = style._fill ? getCanvasFillStyle(style._fill, context, metrics, padding * 2, offsetX, offsetY) : null;
		if (style._stroke?.width) {
			const strokePadding = halfStroke + padding * 2;
			context.strokeStyle = getCanvasFillStyle(style._stroke, context, metrics, strokePadding, offsetX, offsetY);
		}
	}
	/**
	* Sets up the canvas context for drop shadow rendering.
	* @param context - The canvas context
	* @param style - The text style containing drop shadow options
	* @param resolution - The resolution multiplier
	* @param dsOffsetShadow - The shadow Y offset
	*/
	_setupDropShadow(context, style, resolution, dsOffsetShadow) {
		context.fillStyle = "black";
		context.strokeStyle = "black";
		const shadowOptions = style.dropShadow;
		const dropShadowColor = shadowOptions.color;
		const dropShadowAlpha = shadowOptions.alpha;
		context.shadowColor = Color.shared.setValue(dropShadowColor).setAlpha(dropShadowAlpha).toRgbaString();
		const dropShadowBlur = shadowOptions.blur * resolution;
		const dropShadowDistance = shadowOptions.distance * resolution;
		context.shadowBlur = dropShadowBlur;
		context.shadowOffsetX = Math.cos(shadowOptions.angle) * dropShadowDistance;
		context.shadowOffsetY = Math.sin(shadowOptions.angle) * dropShadowDistance + dsOffsetShadow;
	}
	/**
	* Calculates the X offset for text alignment.
	* @param lineWidth - The width of the current line
	* @param alignWidth - The width to align against
	* @param align - The text alignment
	* @returns The X offset for this line
	*/
	_getAlignmentOffset(lineWidth, alignWidth, align) {
		if (align === "right") return alignWidth - lineWidth;
		else if (align === "center") return (alignWidth - lineWidth) / 2;
		return 0;
	}
	/**
	* Render the text with letter-spacing.
	*
	* This method handles rendering text with the correct letter spacing, using either:
	* 1. Native letter spacing if supported by the browser
	* 2. Manual letter spacing calculation if not natively supported
	*
	* For manual letter spacing, it calculates the position of each character
	* based on its width and the desired spacing.
	* @param text - The text to draw
	* @param style - The text style to apply
	* @param canvasAndContext - The canvas and context to draw to
	* @param x - Horizontal position to draw the text
	* @param y - Vertical position to draw the text
	* @param isStroke - Whether to render the stroke (true) or fill (false)
	* @param wordSpacing - Extra spacing to add between words (for justify alignment)
	* @private
	*/
	_drawLetterSpacing(text, style, canvasAndContext, x, y, isStroke = false, wordSpacing = 0) {
		const { context } = canvasAndContext;
		const letterSpacing = style.letterSpacing;
		let useExperimentalLetterSpacing = false;
		if (CanvasTextMetrics.experimentalLetterSpacingSupported) if (CanvasTextMetrics.experimentalLetterSpacing) {
			context.letterSpacing = `${letterSpacing}px`;
			context.textLetterSpacing = `${letterSpacing}px`;
			useExperimentalLetterSpacing = true;
		} else {
			context.letterSpacing = "0px";
			context.textLetterSpacing = "0px";
		}
		if ((letterSpacing === 0 || useExperimentalLetterSpacing) && wordSpacing === 0) {
			if (isStroke) context.strokeText(text, x, y);
			else context.fillText(text, x, y);
			return;
		}
		if (wordSpacing !== 0 && (letterSpacing === 0 || useExperimentalLetterSpacing)) {
			const words = text.split(" ");
			let currentPosition2 = x;
			const spaceWidth = context.measureText(" ").width;
			for (let i = 0; i < words.length; i++) {
				if (isStroke) context.strokeText(words[i], currentPosition2, y);
				else context.fillText(words[i], currentPosition2, y);
				currentPosition2 += context.measureText(words[i]).width + spaceWidth + wordSpacing;
			}
			return;
		}
		let currentPosition = x;
		const stringArray = CanvasTextMetrics.graphemeSegmenter(text);
		let previousWidth = context.measureText(text).width;
		let currentWidth = 0;
		for (let i = 0; i < stringArray.length; ++i) {
			const currentChar = stringArray[i];
			if (isStroke) context.strokeText(currentChar, currentPosition, y);
			else context.fillText(currentChar, currentPosition, y);
			let textStr = "";
			for (let j = i + 1; j < stringArray.length; ++j) textStr += stringArray[j];
			currentWidth = context.measureText(textStr).width;
			currentPosition += previousWidth - currentWidth + letterSpacing;
			if (currentChar === " ") currentPosition += wordSpacing;
			previousWidth = currentWidth;
		}
	}
};
const CanvasTextGenerator = new CanvasTextGeneratorClass();
//#endregion
//#region port/v2/node_modules/pixi.js/lib/scene/text/TextStyle.mjs
const _TextStyle = class _TextStyle extends eventemitter3_default {
	constructor(style = {}) {
		super();
		/**
		* Unique identifier for the TextStyle class.
		* This is used to track instances and ensure uniqueness.
		* @internal
		*/
		this.uid = uid("textStyle");
		/**
		* Internal tick counter used to track updates and changes.
		* This is incremented whenever the style is modified, allowing for efficient change detection.
		* @internal
		*/
		this._tick = 0;
		this._cachedFontString = null;
		convertV7Tov8Style(style);
		const isTextStyle = style instanceof _TextStyle;
		const existingStyle = style;
		if (isTextStyle) style = existingStyle._toObject();
		const fullStyle = {
			..._TextStyle.defaultTextStyle,
			...style
		};
		for (const key in fullStyle) {
			const thisKey = key;
			this[thisKey] = fullStyle[key];
		}
		this._tagStyles = style.tagStyles ?? void 0;
		this.update();
		this._tick = 0;
	}
	/**
	* Alignment for multiline text, does not affect single line text.
	* @type {'left'|'center'|'right'|'justify'}
	*/
	get align() {
		return this._align;
	}
	set align(value) {
		if (this._align === value) return;
		this._align = value;
		this.update();
	}
	/** Indicates if lines can be wrapped within words, it needs wordWrap to be set to true. */
	get breakWords() {
		return this._breakWords;
	}
	set breakWords(value) {
		if (this._breakWords === value) return;
		this._breakWords = value;
		this.update();
	}
	/** Set a drop shadow for the text. */
	get dropShadow() {
		return this._dropShadow;
	}
	set dropShadow(value) {
		if (this._dropShadow === value) return;
		if (value !== null && typeof value === "object") this._dropShadow = this._createProxy({
			..._TextStyle.defaultDropShadow,
			...value
		});
		else this._dropShadow = value ? this._createProxy({ ..._TextStyle.defaultDropShadow }) : null;
		this.update();
	}
	/** The font family, can be a single font name, or a list of names where the first is the preferred font. */
	get fontFamily() {
		return this._fontFamily;
	}
	set fontFamily(value) {
		if (this._fontFamily === value) return;
		this._fontFamily = value;
		this.update();
	}
	/** The font size (as a number it converts to px, but as a string, equivalents are '26px','20pt','160%' or '1.6em') */
	get fontSize() {
		return this._fontSize;
	}
	set fontSize(value) {
		if (this._fontSize === value) return;
		if (typeof value === "string") this._fontSize = parseInt(value, 10);
		else this._fontSize = value;
		this.update();
	}
	/**
	* The font style.
	* @type {'normal'|'italic'|'oblique'}
	*/
	get fontStyle() {
		return this._fontStyle;
	}
	set fontStyle(value) {
		if (this._fontStyle === value) return;
		this._fontStyle = value.toLowerCase();
		this.update();
	}
	/**
	* The font variant.
	* @type {'normal'|'small-caps'}
	*/
	get fontVariant() {
		return this._fontVariant;
	}
	set fontVariant(value) {
		if (this._fontVariant === value) return;
		this._fontVariant = value;
		this.update();
	}
	/**
	* The font weight.
	* @type {'normal'|'bold'|'bolder'|'lighter'|'100'|'200'|'300'|'400'|'500'|'600'|'700'|'800'|'900'}
	*/
	get fontWeight() {
		return this._fontWeight;
	}
	set fontWeight(value) {
		if (this._fontWeight === value) return;
		this._fontWeight = value;
		this.update();
	}
	/** The space between lines. */
	get leading() {
		return this._leading;
	}
	set leading(value) {
		if (this._leading === value) return;
		this._leading = value;
		this.update();
	}
	/** The amount of spacing between letters, default is 0. */
	get letterSpacing() {
		return this._letterSpacing;
	}
	set letterSpacing(value) {
		if (this._letterSpacing === value) return;
		this._letterSpacing = value;
		this.update();
	}
	/** The line height, a number that represents the vertical space that a letter uses. */
	get lineHeight() {
		return this._lineHeight;
	}
	set lineHeight(value) {
		if (this._lineHeight === value) return;
		this._lineHeight = value;
		this.update();
	}
	/**
	* Occasionally some fonts are cropped. Adding some padding will prevent this from happening
	* by adding padding to all sides of the text.
	* > [!NOTE] This will NOT affect the positioning or bounds of the text.
	*/
	get padding() {
		return this._padding;
	}
	set padding(value) {
		if (this._padding === value) return;
		this._padding = value;
		this.update();
	}
	/**
	* An optional filter or array of filters to apply to the text, allowing for advanced visual effects.
	* These filters will be applied to the text as it is created, resulting in faster rendering for static text
	* compared to applying the filter directly to the text object (which would be applied at run time).
	* @default null
	*/
	get filters() {
		return this._filters;
	}
	set filters(value) {
		if (this._filters === value) return;
		this._filters = Object.freeze(value);
		this.update();
	}
	/**
	* Trim transparent borders from the text texture.
	* > [!IMPORTANT] PERFORMANCE WARNING:
	* > This is a costly operation as it requires scanning pixel alpha values.
	* > Avoid using `trim: true` for dynamic text, as it could significantly impact performance.
	*/
	get trim() {
		return this._trim;
	}
	set trim(value) {
		if (this._trim === value) return;
		this._trim = value;
		this.update();
	}
	/**
	* The baseline of the text that is rendered.
	* @type {'alphabetic'|'top'|'hanging'|'middle'|'ideographic'|'bottom'}
	*/
	get textBaseline() {
		return this._textBaseline;
	}
	set textBaseline(value) {
		if (this._textBaseline === value) return;
		this._textBaseline = value;
		this.update();
	}
	/**
	* How newlines and spaces should be handled.
	* Default is 'pre' (preserve, preserve).
	*
	*  value       | New lines     |   Spaces
	*  ---         | ---           |   ---
	* 'normal'     | Collapse      |   Collapse
	* 'pre'        | Preserve      |   Preserve
	* 'pre-line'   | Preserve      |   Collapse
	* @type {'normal'|'pre'|'pre-line'}
	*/
	get whiteSpace() {
		return this._whiteSpace;
	}
	set whiteSpace(value) {
		if (this._whiteSpace === value) return;
		this._whiteSpace = value;
		this.update();
	}
	/** Indicates if word wrap should be used. */
	get wordWrap() {
		return this._wordWrap;
	}
	set wordWrap(value) {
		if (this._wordWrap === value) return;
		this._wordWrap = value;
		this.update();
	}
	/** The width at which text will wrap, it needs wordWrap to be set to true. */
	get wordWrapWidth() {
		return this._wordWrapWidth;
	}
	set wordWrapWidth(value) {
		if (this._wordWrapWidth === value) return;
		this._wordWrapWidth = value;
		this.update();
	}
	/**
	* The fill style that will be used to color the text.
	* This can be:
	* - A color string like 'red', '#00FF00', or 'rgba(255,0,0,0.5)'
	* - A hex number like 0xff0000 for red
	* - A FillStyle object with properties like { color: 0xff0000, alpha: 0.5 }
	* - A FillGradient for gradient fills
	* - A FillPattern for pattern/texture fills
	*
	* When using a FillGradient, vertical gradients (angle of 90 degrees) are applied per line of text,
	* while gradients at any other angle are spread across the entire text body as a whole.
	* @example
	* // Vertical gradient applied per line
	* const verticalGradient = new FillGradient(0, 0, 0, 1)
	*     .addColorStop(0, 0xff0000)
	*     .addColorStop(1, 0x0000ff);
	*
	* const text = new Text({
	*     text: 'Line 1\nLine 2',
	*     style: { fill: verticalGradient }
	* });
	*
	* To manage the gradient in a global scope, set the textureSpace property of the FillGradient to 'global'.
	* @type {string|number|FillStyle|FillGradient|FillPattern}
	*/
	get fill() {
		return this._originalFill;
	}
	set fill(value) {
		if (value === this._originalFill) return;
		this._originalFill = value;
		if (this._isFillStyle(value)) this._originalFill = this._createProxy({
			...GraphicsContext.defaultFillStyle,
			...value
		}, () => {
			this._fill = toFillStyle({ ...this._originalFill }, GraphicsContext.defaultFillStyle);
		});
		this._fill = toFillStyle(value === 0 ? "black" : value, GraphicsContext.defaultFillStyle);
		this.update();
	}
	/** A fillstyle that will be used on the text stroke, e.g., 'blue', '#FCFF00'. */
	get stroke() {
		return this._originalStroke;
	}
	set stroke(value) {
		if (value === this._originalStroke) return;
		this._originalStroke = value;
		if (this._isFillStyle(value)) this._originalStroke = this._createProxy({
			...GraphicsContext.defaultStrokeStyle,
			...value
		}, () => {
			this._stroke = toStrokeStyle({ ...this._originalStroke }, GraphicsContext.defaultStrokeStyle);
		});
		this._stroke = toStrokeStyle(value, GraphicsContext.defaultStrokeStyle);
		this.update();
	}
	/**
	* Custom styles to apply to specific tags within the text.
	* Allows for rich text formatting using simple tag markup like `<red>text</red>`.
	*
	* Tags are only parsed when this property has entries. If `tagStyles` is undefined,
	* `<` characters in text are treated as literal.
	* @example
	* ```ts
	* const text = new Text({
	*     text: '<red>Red</red>, <blue>Blue</blue>',
	*     style: {
	*         fill: 'white',
	*         tagStyles: {
	*             red: { fill: 'red' },
	*             blue: { fill: 'blue' }
	*         }
	*     }
	* });
	* ```
	*/
	get tagStyles() {
		return this._tagStyles;
	}
	set tagStyles(value) {
		if (this._tagStyles === value) return;
		this._tagStyles = value ?? void 0;
		this.update();
	}
	update() {
		this._tick++;
		this._cachedFontString = null;
		this.emit("update", this);
	}
	/** Resets all properties to the default values */
	reset() {
		const defaultStyle = _TextStyle.defaultTextStyle;
		for (const key in defaultStyle) this[key] = defaultStyle[key];
	}
	/**
	* Assigns partial style options to this TextStyle instance.
	* Uses public setters to ensure proper value transformation.
	* @param values - Partial style options to assign
	* @returns This TextStyle instance for chaining
	*/
	assign(values) {
		for (const key in values) {
			const thisKey = key;
			this[thisKey] = values[key];
		}
		return this;
	}
	/**
	* Returns a unique key for this instance.
	* This key is used for caching.
	* @returns {string} Unique key for the instance
	*/
	get styleKey() {
		return `${this.uid}-${this._tick}`;
	}
	/**
	* Returns the CSS font string for this style, cached for performance.
	* @internal
	* @returns CSS font string
	*/
	get _fontString() {
		if (this._cachedFontString === null) this._cachedFontString = fontStringFromTextStyle(this);
		return this._cachedFontString;
	}
	/**
	* Returns an object with the same values as this TextStyle instance.
	* @returns Object with the same values as this TextStyle instance
	* @example
	* ```ts
	* const style = new TextStyle({
	*     fontSize: 24,
	*     fill: 0xff0000,
	*     stroke: { color: 0x0000ff, width: 2 }
	* });
	* const object = style.toObject();
	* console.log(object);
	* // { fontSize: 24, fill: 0xff0000, stroke: { color: 0x0000ff, width: 2 } }
	* ```
	*/
	_toObject() {
		return {
			align: this.align,
			breakWords: this.breakWords,
			dropShadow: this._dropShadow ? { ...this._dropShadow } : null,
			fill: this._fill ? { ...this._fill } : void 0,
			fontFamily: this.fontFamily,
			fontSize: this.fontSize,
			fontStyle: this.fontStyle,
			fontVariant: this.fontVariant,
			fontWeight: this.fontWeight,
			leading: this.leading,
			letterSpacing: this.letterSpacing,
			lineHeight: this.lineHeight,
			padding: this.padding,
			stroke: this._stroke ? { ...this._stroke } : void 0,
			textBaseline: this.textBaseline,
			trim: this.trim,
			whiteSpace: this.whiteSpace,
			wordWrap: this.wordWrap,
			wordWrapWidth: this.wordWrapWidth,
			filters: this._filters ? [...this._filters] : void 0,
			tagStyles: this._tagStyles ? { ...this._tagStyles } : void 0
		};
	}
	/**
	* Creates a new TextStyle object with the same values as this one.
	* @returns New cloned TextStyle object
	*/
	clone() {
		return new _TextStyle(this._toObject());
	}
	/**
	* Returns the final padding for the text style, taking into account any filters applied.
	* Used internally for correct measurements
	* @internal
	* @returns {number} The final padding for the text style.
	*/
	_getFinalPadding() {
		let filterPadding = 0;
		if (this._filters) for (let i = 0; i < this._filters.length; i++) filterPadding += this._filters[i].padding;
		return Math.max(this._padding, filterPadding);
	}
	/**
	* Destroys this text style.
	* @param options - Options parameter. A boolean will act as if all options
	*  have been set to that value
	* @example
	* // Destroy the text style and its textures
	* textStyle.destroy({ texture: true, textureSource: true });
	* textStyle.destroy(true);
	*/
	destroy(options = false) {
		this.removeAllListeners();
		if (typeof options === "boolean" ? options : options?.texture) {
			const destroyTextureSource = typeof options === "boolean" ? options : options?.textureSource;
			if (this._fill?.texture) this._fill.texture.destroy(destroyTextureSource);
			if (this._originalFill?.texture) this._originalFill.texture.destroy(destroyTextureSource);
			if (this._stroke?.texture) this._stroke.texture.destroy(destroyTextureSource);
			if (this._originalStroke?.texture) this._originalStroke.texture.destroy(destroyTextureSource);
		}
		this._fill = null;
		this._stroke = null;
		this.dropShadow = null;
		this._originalStroke = null;
		this._originalFill = null;
	}
	_createProxy(value, cb) {
		return new Proxy(value, { set: (target, property, newValue) => {
			if (target[property] === newValue) return true;
			target[property] = newValue;
			cb?.(property, newValue);
			this.update();
			return true;
		} });
	}
	_isFillStyle(value) {
		return (value ?? null) !== null && !(Color.isColorLike(value) || value instanceof FillGradient || value instanceof FillPattern);
	}
};
/**
* Default drop shadow settings used when enabling drop shadows on text.
* These values are used as the base configuration when drop shadows are enabled without specific settings.
* @example
* ```ts
* // Customize default settings globally
* TextStyle.defaultDropShadow.alpha = 0.5;    // 50% opacity for all shadows
* TextStyle.defaultDropShadow.blur = 2;       // 2px blur for all shadows
* TextStyle.defaultDropShadow.color = 'blue'; // Blue shadows by default
* ```
*/
_TextStyle.defaultDropShadow = {
	alpha: 1,
	angle: Math.PI / 6,
	blur: 0,
	color: "black",
	distance: 5
};
/**
* Default text style settings used when creating new text objects.
* These values serve as the base configuration and can be customized globally.
* @example
* ```ts
* // Customize default text style globally
* TextStyle.defaultTextStyle.fontSize = 16;
* TextStyle.defaultTextStyle.fill = 0x333333;
* TextStyle.defaultTextStyle.fontFamily = ['Arial', 'Helvetica', 'sans-serif'];
* ```
*/
_TextStyle.defaultTextStyle = {
	align: "left",
	breakWords: false,
	dropShadow: null,
	fill: "black",
	fontFamily: "Arial",
	fontSize: 26,
	fontStyle: "normal",
	fontVariant: "normal",
	fontWeight: "normal",
	leading: 0,
	letterSpacing: 0,
	lineHeight: 0,
	padding: 0,
	stroke: null,
	textBaseline: "alphabetic",
	trim: false,
	whiteSpace: "pre",
	wordWrap: false,
	wordWrapWidth: 100
};
let TextStyle = _TextStyle;
function convertV7Tov8Style(style) {
	const oldStyle = style;
	if (typeof oldStyle.dropShadow === "boolean" && oldStyle.dropShadow) {
		const defaults = TextStyle.defaultDropShadow;
		style.dropShadow = {
			alpha: oldStyle.dropShadowAlpha ?? defaults.alpha,
			angle: oldStyle.dropShadowAngle ?? defaults.angle,
			blur: oldStyle.dropShadowBlur ?? defaults.blur,
			color: oldStyle.dropShadowColor ?? defaults.color,
			distance: oldStyle.dropShadowDistance ?? defaults.distance
		};
	}
	if (oldStyle.strokeThickness !== void 0) {
		deprecation(v8_0_0, "strokeThickness is now a part of stroke");
		const color = oldStyle.stroke;
		let obj = {};
		if (Color.isColorLike(color)) obj.color = color;
		else if (color instanceof FillGradient || color instanceof FillPattern) obj.fill = color;
		else if (Object.hasOwnProperty.call(color, "color") || Object.hasOwnProperty.call(color, "fill")) obj = color;
		else throw new Error("Invalid stroke value.");
		style.stroke = {
			...obj,
			width: oldStyle.strokeThickness
		};
	}
	if (Array.isArray(oldStyle.fillGradientStops)) {
		deprecation(v8_0_0, "gradient fill is now a fill pattern: `new FillGradient(...)`");
		if (!Array.isArray(oldStyle.fill) || oldStyle.fill.length === 0) throw new Error("Invalid fill value. Expected an array of colors for gradient fill.");
		if (oldStyle.fill.length !== oldStyle.fillGradientStops.length) warn("The number of fill colors must match the number of fill gradient stops.");
		const gradientFill = new FillGradient({
			start: {
				x: 0,
				y: 0
			},
			end: {
				x: 0,
				y: 1
			},
			textureSpace: "local"
		});
		const fillGradientStops = oldStyle.fillGradientStops.slice();
		const fills = oldStyle.fill.map((color) => Color.shared.setValue(color).toNumber());
		fillGradientStops.forEach((stop, index) => {
			gradientFill.addColorStop(stop, fills[index]);
		});
		style.fill = { fill: gradientFill };
	}
}
//#endregion
//#region port/v2/node_modules/pixi.js/lib/scene/text/utils/updateTextBounds.mjs
function updateTextBounds(batchableSprite, text) {
	const { texture, bounds } = batchableSprite;
	const padding = text._style._getFinalPadding();
	updateQuadBounds(bounds, text._anchor, texture);
	const paddingOffset = text._anchor._x * padding * 2;
	const paddingOffsetY = text._anchor._y * padding * 2;
	bounds.minX -= padding - paddingOffset;
	bounds.minY -= padding - paddingOffsetY;
	bounds.maxX -= padding - paddingOffset;
	bounds.maxY -= padding - paddingOffsetY;
}
//#endregion
//#region port/v2/node_modules/pixi.js/lib/scene/text/canvas/BatchableText.mjs
var BatchableText = class extends BatchableSprite {};
//#endregion
//#region port/v2/node_modules/pixi.js/lib/scene/text/canvas/CanvasTextPipe.mjs
var CanvasTextPipe = class {
	constructor(renderer) {
		this._renderer = renderer;
		renderer.runners.resolutionChange.add(this);
		this._managedTexts = new GCManagedHash({
			renderer,
			type: "renderable",
			onUnload: this.onTextUnload.bind(this),
			name: "canvasText"
		});
	}
	resolutionChange() {
		for (const key in this._managedTexts.items) {
			const text = this._managedTexts.items[key];
			if (text?._autoResolution) text.onViewUpdate();
		}
	}
	validateRenderable(text) {
		const gpuText = this._getGpuText(text);
		const newKey = text.styleKey;
		if (gpuText.currentKey !== newKey) return true;
		return text._didTextUpdate;
	}
	addRenderable(text, instructionSet) {
		const batchableText = this._getGpuText(text);
		if (text._didTextUpdate) {
			const resolution = text._autoResolution ? this._renderer.resolution : text.resolution;
			if (batchableText.currentKey !== text.styleKey || text._resolution !== resolution) this._updateGpuText(text);
			text._didTextUpdate = false;
			updateTextBounds(batchableText, text);
		}
		this._renderer.renderPipes.batch.addToBatch(batchableText, instructionSet);
	}
	updateRenderable(text) {
		const batchableText = this._getGpuText(text);
		batchableText._batcher.updateElement(batchableText);
	}
	_updateGpuText(text) {
		const batchableText = this._getGpuText(text);
		if (batchableText.texture) this._renderer.canvasText.decreaseReferenceCount(batchableText.currentKey);
		text._resolution = text._autoResolution ? this._renderer.resolution : text.resolution;
		batchableText.texture = this._renderer.canvasText.getManagedTexture(text);
		batchableText.currentKey = text.styleKey;
	}
	_getGpuText(text) {
		return text._gpuData[this._renderer.uid] || this.initGpuText(text);
	}
	initGpuText(text) {
		const batchableText = new BatchableText();
		batchableText.currentKey = "--";
		batchableText.renderable = text;
		batchableText.transform = text.groupTransform;
		batchableText.bounds = {
			minX: 0,
			maxX: 1,
			minY: 0,
			maxY: 0
		};
		batchableText.roundPixels = this._renderer._roundPixels | text._roundPixels;
		text._gpuData[this._renderer.uid] = batchableText;
		this._managedTexts.add(text);
		return batchableText;
	}
	onTextUnload(text) {
		const gpuData = text._gpuData[this._renderer.uid];
		if (!gpuData) return;
		const { canvasText } = this._renderer;
		if (canvasText.getReferenceCount(gpuData.currentKey) > 0) canvasText.decreaseReferenceCount(gpuData.currentKey);
		else if (gpuData.texture) canvasText.returnTexture(gpuData.texture);
	}
	destroy() {
		this._managedTexts.destroy();
		this._renderer = null;
	}
};
/** @ignore */
CanvasTextPipe.extension = {
	type: [
		ExtensionType.WebGLPipes,
		ExtensionType.WebGPUPipes,
		ExtensionType.CanvasPipes
	],
	name: "text"
};
//#endregion
//#region port/v2/node_modules/pixi.js/lib/scene/text/shared/AbstractTextSystem.mjs
var AbstractTextSystem = class {
	constructor(renderer, retainCanvasContext) {
		this._activeTextures = {};
		this._renderer = renderer;
		this._retainCanvasContext = retainCanvasContext;
	}
	getTexture(options, _resolution, _style, _textKey) {
		if (typeof options === "string") {
			deprecation("8.0.0", "CanvasTextSystem.getTexture: Use object TextOptions instead of separate arguments");
			options = {
				text: options,
				style: _style,
				resolution: _resolution
			};
		}
		if (!(options.style instanceof TextStyle)) options.style = new TextStyle(options.style);
		if (!(options.textureStyle instanceof TextureStyle)) options.textureStyle = new TextureStyle(options.textureStyle);
		if (typeof options.text !== "string") options.text = options.text.toString();
		const { text, style, textureStyle, autoGenerateMipmaps } = options;
		const resolution = options.resolution ?? this._renderer.resolution;
		const { frame, canvasAndContext } = CanvasTextGenerator.getCanvasAndContext({
			text,
			style,
			resolution
		});
		const texture = getPo2TextureFromSource(canvasAndContext.canvas, frame.width, frame.height, resolution, autoGenerateMipmaps);
		if (textureStyle) texture.source.style = textureStyle;
		if (style.trim) {
			frame.pad(style.padding);
			texture.frame.copyFrom(frame);
			texture.frame.scale(1 / resolution);
			texture.updateUvs();
		}
		if (style.filters) {
			const filteredTexture = this._applyFilters(texture, style.filters);
			this.returnTexture(texture);
			CanvasTextGenerator.returnCanvasAndContext(canvasAndContext);
			return filteredTexture;
		}
		this._renderer.texture.initSource(texture._source);
		if (!this._retainCanvasContext) CanvasTextGenerator.returnCanvasAndContext(canvasAndContext);
		return texture;
	}
	/**
	* Returns a texture that was created wit the above `getTexture` function.
	* Handy if you are done with a texture and want to return it to the pool.
	* @param texture - The texture to be returned.
	*/
	returnTexture(texture) {
		const source = texture.source;
		const resource = source.resource;
		if (this._retainCanvasContext && resource?.getContext) {
			const context = resource.getContext("2d");
			if (context) CanvasTextGenerator.returnCanvasAndContext({
				canvas: resource,
				context
			});
		}
		source.resource = null;
		source.uploadMethodId = "unknown";
		source.alphaMode = "no-premultiply-alpha";
		TexturePool.returnTexture(texture, true);
	}
	/**
	* Renders text to its canvas, and updates its texture.
	* @deprecated since 8.10.0
	*/
	renderTextToCanvas() {
		deprecation("8.10.0", "CanvasTextSystem.renderTextToCanvas: no longer supported, use CanvasTextSystem.getTexture instead");
	}
	/**
	* Gets or creates a managed texture for a Text object. This method handles texture reuse and reference counting.
	* @param text - The Text object that needs a texture
	* @returns A Texture instance that represents the rendered text
	* @remarks
	* This method performs the following:
	* 1. Sets the appropriate resolution based on auto-resolution settings
	* 2. Checks if a texture already exists for the text's style
	* 3. Creates a new texture if needed or returns an existing one
	* 4. Manages reference counting for texture reuse
	*/
	getManagedTexture(text) {
		text._resolution = text._autoResolution ? this._renderer.resolution : text.resolution;
		const textKey = text.styleKey;
		if (this._activeTextures[textKey]) {
			this._increaseReferenceCount(textKey);
			return this._activeTextures[textKey].texture;
		}
		const texture = this.getTexture({
			text: text.text,
			style: text.style,
			resolution: text._resolution,
			textureStyle: text.textureStyle,
			autoGenerateMipmaps: text.autoGenerateMipmaps
		});
		this._activeTextures[textKey] = {
			texture,
			usageCount: 1
		};
		return texture;
	}
	/**
	* Decreases the reference count for a texture associated with a text key.
	* When the reference count reaches zero, the texture is returned to the pool.
	* @param textKey - The unique key identifying the text style configuration
	* @remarks
	* This method is crucial for memory management, ensuring textures are properly
	* cleaned up when they are no longer needed by any Text instances.
	*/
	decreaseReferenceCount(textKey) {
		const activeTexture = this._activeTextures[textKey];
		if (!activeTexture) return;
		activeTexture.usageCount--;
		if (activeTexture.usageCount === 0) {
			this.returnTexture(activeTexture.texture);
			this._activeTextures[textKey] = null;
		}
	}
	/**
	* Gets the current reference count for a texture associated with a text key.
	* @param textKey - The unique key identifying the text style configuration
	* @returns The number of Text instances currently using this texture
	*/
	getReferenceCount(textKey) {
		return this._activeTextures[textKey]?.usageCount ?? 0;
	}
	_increaseReferenceCount(textKey) {
		this._activeTextures[textKey].usageCount++;
	}
	/**
	* Applies the specified filters to the given texture.
	*
	* This method takes a texture and a list of filters, applies the filters to the texture,
	* and returns the resulting texture. It also ensures that the alpha mode of the resulting
	* texture is set to 'premultiplied-alpha'.
	* @param {Texture} texture - The texture to which the filters will be applied.
	* @param {Filter[]} filters - The filters to apply to the texture.
	* @returns {Texture} The resulting texture after all filters have been applied.
	*/
	_applyFilters(texture, filters) {
		const currentRenderTarget = this._renderer.renderTarget.renderTarget;
		const resultTexture = this._renderer.filter.generateFilteredTexture({
			texture,
			filters
		});
		this._renderer.renderTarget.bind(currentRenderTarget, false);
		return resultTexture;
	}
	destroy() {
		this._renderer = null;
		for (const key in this._activeTextures) if (this._activeTextures[key]) this.returnTexture(this._activeTextures[key].texture);
		this._activeTextures = null;
	}
};
//#endregion
//#region port/v2/node_modules/pixi.js/lib/scene/text/canvas/CanvasTextSystem.mjs
var CanvasRendererTextSystem = class extends AbstractTextSystem {
	constructor(renderer) {
		super(renderer, true);
	}
};
/** @ignore */
CanvasRendererTextSystem.extension = {
	type: [ExtensionType.CanvasSystem],
	name: "canvasText"
};
//#endregion
//#region port/v2/node_modules/pixi.js/lib/scene/text/shared/GpuTextSystem.mjs
var CanvasTextSystem = class extends AbstractTextSystem {
	constructor(renderer) {
		super(renderer, false);
	}
};
/** @ignore */
CanvasTextSystem.extension = {
	type: [ExtensionType.WebGLSystem, ExtensionType.WebGPUSystem],
	name: "canvasText"
};
//#endregion
//#region port/v2/node_modules/pixi.js/lib/scene/text/init.mjs
extensions.add(CanvasRendererTextSystem);
extensions.add(CanvasTextSystem);
extensions.add(CanvasTextPipe);
//#endregion
//#region port/v2/node_modules/pixi.js/lib/scene/text/Text.mjs
var Text = class extends AbstractText {
	constructor(...args) {
		const options = ensureTextOptions(args, "Text");
		super(options, TextStyle);
		/** @internal */
		this.renderPipeId = "text";
		if (options.textureStyle) this.textureStyle = options.textureStyle instanceof TextureStyle ? options.textureStyle : new TextureStyle(options.textureStyle);
		this.autoGenerateMipmaps = options.autoGenerateMipmaps ?? TextureSource.defaultOptions.autoGenerateMipmaps;
	}
	/** @private */
	updateBounds() {
		const bounds = this._bounds;
		const anchor = this._anchor;
		let width = 0;
		let height = 0;
		if (this._style.trim) {
			const { frame, canvasAndContext } = CanvasTextGenerator.getCanvasAndContext({
				text: this.text,
				style: this._style,
				resolution: 1
			});
			CanvasTextGenerator.returnCanvasAndContext(canvasAndContext);
			width = frame.width;
			height = frame.height;
		} else {
			const canvasMeasurement = CanvasTextMetrics.measureText(this._text, this._style);
			width = canvasMeasurement.width;
			height = canvasMeasurement.height;
		}
		bounds.minX = -anchor._x * width;
		bounds.maxX = bounds.minX + width;
		bounds.minY = -anchor._y * height;
		bounds.maxY = bounds.minY + height;
	}
};
//#endregion
//#region port/v2/node_modules/pixi.js/lib/index.mjs
extensions.add(browserExt, webworkerExt);
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
function validatePaintSkin(skin, parts, w, h, joints) {
	const fail = (why) => {
		throw Error("Paint skin: " + why);
	};
	if (skin?.schema !== "cf.paint-skin/v1" || !Array.isArray(skin.vertices) || skin.vertices.length < 3 || skin.vertices.length > 4e4 || !Array.isArray(skin.parts)) fail("schema/budget");
	if (skin.solver !== void 0) {
		if (!Array.isArray(skin.triangles) || !skin.triangles.length || skin.triangles.length % 3 || skin.triangles.length > 6e5 || skin.triangles.some((i) => !Number.isInteger(i) || i < 0 || i >= skin.vertices.length)) fail("solver topology");
		const s = skin.solver;
		if (!s || typeof s !== "object" || Array.isArray(s) || Object.getPrototypeOf(s) !== Object.prototype && Object.getPrototypeOf(s) !== null || Reflect.ownKeys(s).length !== 4 || Reflect.ownKeys(s).some((k) => ![
			"iterations",
			"globalIterations",
			"targetWeight",
			"pins"
		].includes(k))) fail("shared solver profile keys");
		if (s.iterations !== 4 || s.globalIterations !== 4 || s.targetWeight !== .35 || !Array.isArray(s.pins) || new Set(s.pins).size !== s.pins.length || s.pins.some((i) => !Number.isInteger(i) || i < 0 || i >= skin.vertices.length)) fail("shared solver profile");
	}
	const known = new Set(joints), ids = /* @__PURE__ */ new Set();
	for (const v of skin.vertices) {
		if (!Number.isFinite(v.x) || !Number.isFinite(v.y) || v.x < 0 || v.y < 0 || v.x > w || v.y > h || !Array.isArray(v.weights) || !v.weights.length || v.weights.length > 8) fail("vertex");
		let sum = 0;
		const used = /* @__PURE__ */ new Set();
		for (const [j, n] of v.weights) {
			if (!known.has(j) || used.has(j) || !Number.isFinite(n) || n <= 0 || n > 1) fail("weights");
			used.add(j);
			sum += n;
		}
		if (Math.abs(sum - 1) > 1e-8) fail("weight sum");
	}
	let count = 0;
	for (const p of skin.parts) {
		const owner = parts.find((x) => x.id === p.id);
		if (!owner || owner.kind !== "part" || ids.has(p.id) || !p.vertices?.length || !p.indices?.length) fail("part");
		ids.add(p.id);
		count += p.vertices.length;
		if (count > 2e5) fail("part vertex budget");
		for (const v of p.vertices) {
			if (!Array.isArray(v.triangle) || v.triangle.length !== 3 || v.triangle.some((i) => !Number.isInteger(i) || i < 0 || i >= skin.vertices.length) || !Array.isArray(v.barycentric) || v.barycentric.length !== 3 || v.barycentric.some((n) => !Number.isFinite(n) || n < -1e-8 || n > 1 + 1e-8) || Math.abs(v.barycentric.reduce((a, b) => a + b, 0) - 1) > 1e-8) fail("interpolation");
			const x = v.triangle.reduce((n, k, i) => n + skin.vertices[k].x * v.barycentric[i], 0), y = v.triangle.reduce((n, k, i) => n + skin.vertices[k].y * v.barycentric[i], 0), b = owner.cutout;
			if (x < b.x - 1e-6 || x > b.x + b.width + 1e-6 || y < b.y - 1e-6 || y > b.y + b.height + 1e-6) fail("UV outside owned frame");
		}
		if (p.indices.length > 1e6 || p.indices.length % 3 || p.indices.some((i) => !Number.isInteger(i) || i < 0 || i >= p.vertices.length)) fail("indices");
		if (paintPartAreas(p, skin).some((a) => !Number.isFinite(a) || a === 0)) fail("degenerate source triangle");
	}
	if (parts.filter((p) => p.kind === "part").some((p) => !ids.has(p.id))) fail("missing painted part");
	return {
		vertices: skin.vertices.length,
		partVertices: count,
		parts: ids.size
	};
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
function point(value) {
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
	const p = point(pivot), move = point(offset);
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
//#endregion
//#region port/v2/tools/creature-animation/quadruped-template.mjs
const TEMPLATE = Object.freeze({
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
const names = ["root", ...GRAPH.map((b) => b[0])];
const length = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const assert = (ok, msg) => {
	if (!ok) throw Error("Quadruped admission: " + msg);
};
const stableJSON = (x) => JSON.stringify(x, (_, v) => v && !Array.isArray(v) && typeof v === "object" ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, v[k]])) : v);
async function hashBytes(bytes) {
	return [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map((n) => n.toString(16).padStart(2, "0")).join("");
}
const hashJSON = (x) => hashBytes(new TextEncoder().encode(stableJSON(x)));
function checkGeometry(record, alpha) {
	assert(record.template.id === TEMPLATE.id && record.template.version === 1 && record.kind === "quadruped", "unsupported body or template");
	assert(record.clipSetId === TEMPLATE.clipSetId && !("clipOverrides" in record), "shared clip set required");
	const j = record.landmarks, { width: w, height: h } = record.geometry;
	assert(Number.isInteger(w) && Number.isInteger(h) && w >= 128 && h >= 128 && w <= 2048 && h <= 2048, "input dimensions");
	assert(Object.keys(j).length === names.length && names.every((n) => Array.isArray(j[n]) && j[n].length === 2 && j[n].every((v) => Number.isFinite(v) && v >= 0 && v <= 1)), "joint inventory / normalized coordinates");
	const torso = length(j.pelvis, j.chest), head = length(j.neck, j.head);
	assert(torso >= .08 && torso <= .65 && head >= .015 && head <= torso * 1.6, "torso / head proportion bounds");
	const bones = Object.fromEntries(GRAPH.map(([n, p]) => [n, length(j[n], j[p])]));
	assert(Object.values(bones).every((n) => n >= .001 && n <= .75), "degenerate or excessive bone");
	for (const id of LEGS) {
		const total = [
			"Knee",
			"Ankle",
			"Paw"
		].reduce((s, n) => s + bones[id + n], 0);
		assert(total / torso >= .25 && total / torso <= 2.7, "leg proportions");
	}
	assert(Number.isFinite(record.geometry.groundLineY) && record.geometry.groundLineY > 0 && record.geometry.groundLineY <= 1, "ground line");
	assert(record.geometry.depthLayers.length === 2 && record.geometry.depthLayers.every((l, i) => l.id === TEMPLATE.layers[i] && l.order === i), "two depth layers");
	if (alpha) {
		assert(alpha.length === w * h, "alpha dimensions");
		for (const n of names) {
			const [x, y] = j[n];
			let found = false;
			const r = Math.ceil(Math.max(w, h) * .012), xx = Math.round(x * w), yy = Math.round(y * h);
			for (let dy = -r; dy <= r && !found; dy++) for (let dx = -r; dx <= r; dx++) if (xx + dx >= 0 && yy + dy >= 0 && xx + dx < w && yy + dy < h && alpha[(yy + dy) * w + xx + dx] > 12) {
				found = true;
				break;
			}
			assert(found, "landmark outside painted alpha: " + n);
		}
	}
	return {
		inside: true,
		clamped: [],
		boneLengths: bones
	};
}
async function admitRecord(record, cutoutBytes, alpha) {
	const { recipeHash, ...body } = record;
	assert(await hashJSON(body) === recipeHash, "corrupted landmark / recipe hash");
	assert(await hashBytes(cutoutBytes) === record.geometry.cutoutAssetHash, "mismatched cut-out hash");
	assert(typeof record.identity.speciesVisualKey === "string" && record.identity.speciesVisualKey.length > 5 && Number.isInteger(record.identity.seed) && record.identity.ownerId, "identity");
	assert(stableJSON(checkGeometry(record, alpha)) === stableJSON(record.boundsCheck), "stale bounds / lengths");
	return true;
}
//#endregion
//#region port/v2/tools/creature-animation/ownership-junctions.mjs
/** Close only the point where three/four painted owners meet. Separate limb
* boundaries are never stitched along their length. No new atlas or pigment. */
const parent$1 = new Map(GRAPH);
function paintedAncestor(parts, ancestor, descendant) {
	const declared = new Map(parts.filter((p) => p.kind === "part").map((p) => [p.joint, p.id]));
	for (let j = parent$1.get(descendant.joint); j; j = parent$1.get(j)) if ((declared.get(j) ?? (["root", "pelvis"].includes(j) ? "torso" : null)) === ancestor.id) return true;
	return false;
}
function junctionPoints(junction, matrices, width, height) {
	const [x, y] = junction.point;
	return junction.joints.map((j) => {
		const m = matrices[j];
		if (!m || m.length !== 6 || !m.every(Number.isFinite)) throw Error("Junction matrix");
		return [(m[0] * x / width + m[2] * y / height + m[4]) * width, (m[1] * x / width + m[3] * y / height + m[5]) * height];
	});
}
//#endregion
//#region port/v2/tools/creature-animation/seam-bridge.mjs
/** Two-joint strips made from authored ownership edges. No new pigment or curves.
* At rest both copies of an edge coincide: the strip has exactly zero area.
* Under motion its two sides follow the two actual part transforms. */
const parent = new Map(GRAPH);
const need$8 = (ok, why) => {
	if (!ok) throw Error("Seam bridge: " + why);
};
function validateSeamBridges(groups, parts, width, height, atlasSize, joints) {
	need$8(Array.isArray(groups) && groups.length > 0 && parts.length <= 40 && groups.length <= parts.length, "group budget");
	const ids = /* @__PURE__ */ new Set(), junctionIds = /* @__PURE__ */ new Set(), owners = new Map(parts.map((p) => [p.id, p]));
	let count = 0;
	const jointOwners = new Map(parts.filter((p) => p.kind === "part").map((p) => [p.joint, p.id]));
	const nearestOwner = (joint) => {
		for (let j = parent.get(joint); j; j = parent.get(j)) {
			if (j === "root" || j === "pelvis") return "torso";
			if (jointOwners.has(j)) return jointOwners.get(j);
		}
		return null;
	};
	for (const g of groups) {
		const patch = owners.get(g.id);
		need$8(typeof g.id === "string" && !ids.has(g.id) && patch?.kind === "joint-patch" && patch.joint === g.ancestorJoint && patch.layer === g.layer, "group identity");
		ids.add(g.id);
		need$8(g.rigidUnderlap === void 0 || typeof g.rigidUnderlap === "boolean", "underlap mode");
		need$8(joints.includes(g.ancestorJoint) && ["far", "near"].includes(g.layer) && Array.isArray(g.edges) && g.edges.length > 0, "group");
		need$8(g.junctions === void 0 || Array.isArray(g.junctions), "junction list");
		for (const j of g.junctions ?? []) {
			need$8(Array.isArray(j.point) && j.point.length === 2 && j.point.every(Number.isInteger) && j.point[0] > 0 && j.point[0] < width && j.point[1] > 0 && j.point[1] < height, "junction point");
			const id = j.point.join(":");
			need$8(!junctionIds.has(id) && junctionIds.size < 2048, "junction budget/identity");
			junctionIds.add(id);
			need$8(Array.isArray(j.parts) && j.parts.length >= 3 && j.parts.length <= 4 && new Set(j.parts).size === j.parts.length && Array.isArray(j.joints) && j.joints.length === j.parts.length, "junction owners");
			const ps = j.parts.map((id) => owners.get(id)), a = owners.get(j.ancestorPart), src = owners.get(j.sourcePart);
			need$8(a?.kind === "part" && a.joint === g.ancestorJoint && ps.includes(a) && ps.every((p, i) => p?.kind === "part" && p.joint === j.joints[i] && (p === a || paintedAncestor(parts, a, p))), "junction ancestry");
			need$8(src && src !== a && ps.includes(src), "junction descendant ink");
			need$8(Array.isArray(j.sourcePixel) && j.sourcePixel.length === 2 && j.sourcePixel.every(Number.isInteger), "junction source pixel");
			const [x, y] = j.sourcePixel, b = src.cutout;
			need$8([j.point[0] - 1, j.point[0]].includes(x) && [j.point[1] - 1, j.point[1]].includes(y) && x >= b.x && y >= b.y && x < b.x + b.width && y < b.y + b.height, "junction pixel touches original point");
		}
		for (const e of g.edges) {
			need$8(++count <= 2e4, "edge budget");
			const source = owners.get(e.sourcePart), ancestor = owners.get(e.ancestorPart);
			need$8(source?.kind === "part" && ancestor?.kind === "part" && source.joint === e.descendantJoint && ancestor.joint === g.ancestorJoint && source.layer === g.layer, "source/ancestor ownership");
			need$8(e.ancestorOverlap === void 0 || typeof e.ancestorOverlap === "boolean", "ancestral contact mode");
			if (e.ancestorOverlap === true) {
				let found = false;
				for (let j = parent.get(e.descendantJoint); j; j = parent.get(j)) if ((jointOwners.get(j) ?? (["root", "pelvis"].includes(j) ? "torso" : null)) === e.ancestorPart) found = true;
				need$8(found, "overlap closure requires a real ancestor; siblings stay independent");
			} else need$8(nearestOwner(e.descendantJoint) === e.ancestorPart, "true joint required; undeclared rest overlap must not be stitched");
			need$8(source.frame.width === source.cutout.width && source.frame.height === source.cutout.height, "native source pixels required");
			need$8(Array.isArray(e.edge) && e.edge.length === 2 && e.edge.every((p) => Array.isArray(p) && p.length === 2 && p.every(Number.isInteger) && p[0] >= 0 && p[0] <= width && p[1] >= 0 && p[1] <= height), "edge coordinates");
			const [[ax, ay], [bx, by]] = e.edge;
			need$8(Math.abs(ax - bx) + Math.abs(ay - by) === 1, "unit ownership edge");
			need$8(Array.isArray(e.sourcePixel) && e.sourcePixel.length === 2 && e.sourcePixel.every(Number.isInteger), "source pixel");
			const [x, y] = e.sourcePixel, b = source.cutout;
			need$8(x >= b.x && y >= b.y && x < b.x + b.width && y < b.y + b.height, "source pixel bounds");
			need$8(ax === bx ? (x === ax || x === ax - 1) && y === Math.min(ay, by) : (y === ay || y === ay - 1) && x === Math.min(ax, bx), "source pixel touches edge");
			need$8(Number.isFinite(e.sourceDepthPx) && e.sourceDepthPx > 0 && e.sourceDepthPx <= Math.min(width / 8, b.width / 2, b.height / 2) + 1e-9, "unchanged depth cap");
			if (e.interiorPixel !== void 0) {
				const q = e.interiorPixel;
				need$8(Array.isArray(q) && q.length === 2 && q.every(Number.isInteger) && q[0] >= b.x && q[1] >= b.y && q[0] < b.x + b.width && q[1] < b.y + b.height, "interior pixel bounds");
				const nx = ax === bx ? x >= ax ? 1 : -1 : 0, ny = ay === by ? y >= ay ? 1 : -1 : 0, d = (q[0] - x) * nx + (q[1] - y) * ny;
				need$8(d >= 0 && d <= Math.floor(e.sourceDepthPx) && q[0] - x === nx * d && q[1] - y === ny * d, "interior sample must follow owned normal within cap");
			}
		}
	}
	need$8(atlasSize.width > 0 && atlasSize.height > 0, "atlas size");
	return count;
}
function createSeamGeometry(group, parts, width, height, atlasSize) {
	const owners = new Map(parts.map((p) => [p.id, p])), n = group.edges.length + 1 + (group.junctions?.length ?? 0), patch = owners.get(group.id);
	const positions = new Float32Array(n * 8), pending = new Float32Array(n * 8), uvs = new Float32Array(n * 8), indices = new Uint32Array(n * 6);
	const f = patch.frame;
	uvs.set([
		f.x / atlasSize.width,
		f.y / atlasSize.height,
		(f.x + f.width) / atlasSize.width,
		f.y / atlasSize.height,
		(f.x + f.width) / atlasSize.width,
		(f.y + f.height) / atlasSize.height,
		f.x / atlasSize.width,
		(f.y + f.height) / atlasSize.height
	]);
	indices.set(group.rigidUnderlap === false ? [
		0,
		0,
		0,
		0,
		0,
		0
	] : [
		0,
		1,
		2,
		0,
		2,
		3
	]);
	group.edges.forEach((e, index) => {
		const k = index + 1;
		const p = owners.get(e.sourcePart), u = (p.frame.x + e.sourcePixel[0] - p.cutout.x + .5) / atlasSize.width, v = (p.frame.y + e.sourcePixel[1] - p.cutout.y + .5) / atlasSize.height;
		const q = e.interiorPixel ?? e.sourcePixel, iu = (p.frame.x + q[0] - p.cutout.x + .5) / atlasSize.width, iv = (p.frame.y + q[1] - p.cutout.y + .5) / atlasSize.height;
		for (let j = 0; j < 4; j++) {
			uvs[k * 8 + j * 2] = j < 2 ? iu : u;
			uvs[k * 8 + j * 2 + 1] = j < 2 ? iv : v;
		}
		indices.set([
			k * 4,
			k * 4 + 1,
			k * 4 + 2,
			k * 4,
			k * 4 + 2,
			k * 4 + 3
		], k * 6);
	});
	for (const [i, j] of (group.junctions ?? []).entries()) {
		const k = 1 + group.edges.length + i, p = owners.get(j.sourcePart), u = (p.frame.x + j.sourcePixel[0] - p.cutout.x + .5) / atlasSize.width, v = (p.frame.y + j.sourcePixel[1] - p.cutout.y + .5) / atlasSize.height;
		for (let n = 0; n < 4; n++) uvs.set([u, v], k * 8 + n * 2);
		indices.set([
			k * 4,
			k * 4 + 1,
			k * 4 + 2,
			k * 4,
			k * 4 + 2,
			k * 4 + (j.parts.length === 4 ? 3 : 2)
		], k * 6);
	}
	return {
		positions,
		pending,
		uvs,
		indices
	};
}
function writeSeamPose(group, matrices, width, height, output, staticBox) {
	need$8(output.length === (group.edges.length + 1 + (group.junctions?.length ?? 0)) * 8, "position buffer");
	const a = matrices[group.ancestorJoint];
	need$8(a?.length === 6 && a.every(Number.isFinite), "ancestor matrix");
	[
		[staticBox.x, staticBox.y],
		[staticBox.x + staticBox.width, staticBox.y],
		[staticBox.x + staticBox.width, staticBox.y + staticBox.height],
		[staticBox.x, staticBox.y + staticBox.height]
	].forEach(([px, py], i) => {
		const x = px / width, y = py / height;
		output[i * 2] = a[0] * x + a[2] * y + a[4];
		output[i * 2 + 1] = a[1] * x + a[3] * y + a[5];
	});
	const checked = /* @__PURE__ */ new Set();
	for (let k = 0; k < group.edges.length; k++) {
		const e = group.edges[k], d = matrices[e.descendantJoint];
		if (!checked.has(d)) {
			need$8(d?.length === 6 && d.every(Number.isFinite), "descendant matrix");
			checked.add(d);
		}
		const ex = (e.edge[1][0] - e.edge[0][0]) / 64, ey = (e.edge[1][1] - e.edge[0][1]) / 64;
		const x0 = (e.edge[0][0] - ex) / width, y0 = (e.edge[0][1] - ey) / height, x1 = (e.edge[1][0] + ex) / width, y1 = (e.edge[1][1] + ey) / height;
		const ax0 = a[0] * x0 + a[2] * y0 + a[4], ay0 = a[1] * x0 + a[3] * y0 + a[5], ax1 = a[0] * x1 + a[2] * y1 + a[4], ay1 = a[1] * x1 + a[3] * y1 + a[5];
		const dx0 = d[0] * x0 + d[2] * y0 + d[4], dy0 = d[1] * x0 + d[3] * y0 + d[5], dx1 = d[0] * x1 + d[2] * y1 + d[4], dy1 = d[1] * x1 + d[3] * y1 + d[5];
		const span2 = Math.max(((ax0 - dx0) * width) ** 2 + ((ay0 - dy0) * height) ** 2, ((ax1 - dx1) * width) ** 2 + ((ay1 - dy1) * height) ** 2);
		need$8(Number.isFinite(span2), "nonfinite span");
		const o = (k + 1) * 8;
		output[o] = ax0;
		output[o + 1] = ay0;
		output[o + 2] = ax1;
		output[o + 3] = ay1;
		output[o + 4] = dx1;
		output[o + 5] = dy1;
		output[o + 6] = dx0;
		output[o + 7] = dy0;
	}
	for (const [i, j] of (group.junctions ?? []).entries()) {
		const ps = junctionPoints(j, matrices, width, height), cx = ps.reduce((n, p) => n + p[0], 0) / ps.length, cy = ps.reduce((n, p) => n + p[1], 0) / ps.length;
		const radius = Math.max(...ps.map((p) => Math.hypot(p[0] - cx, p[1] - cy))), scale = radius > 1e-9 ? 1 + 1 / (64 * radius) : 1;
		for (let n = 0; n < 4; n++) {
			const p = ps[Math.min(n, ps.length - 1)], o = (1 + group.edges.length + i) * 8 + n * 2;
			output[o] = (cx + (p[0] - cx) * scale) / width;
			output[o + 1] = (cy + (p[1] - cy) * scale) / height;
		}
	}
	need$8(output.every(Number.isFinite), "position overflow");
}
//#endregion
//#region port/v2/tools/creature-animation/arap-sweep-bytes.mjs
const ARAP_SWEEP_BYTES = Uint8Array.from([
	0,
	97,
	115,
	109,
	1,
	0,
	0,
	0,
	1,
	18,
	1,
	96,
	13,
	127,
	127,
	127,
	127,
	127,
	127,
	127,
	127,
	127,
	127,
	127,
	127,
	127,
	1,
	127,
	2,
	24,
	1,
	3,
	101,
	110,
	118,
	15,
	95,
	95,
	108,
	105,
	110,
	101,
	97,
	114,
	95,
	109,
	101,
	109,
	111,
	114,
	121,
	2,
	0,
	0,
	3,
	2,
	1,
	0,
	7,
	8,
	1,
	4,
	112,
	97,
	115,
	115,
	0,
	0,
	10,
	156,
	15,
	1,
	153,
	15,
	8,
	4,
	127,
	2,
	124,
	2,
	127,
	2,
	124,
	1,
	127,
	1,
	124,
	1,
	127,
	3,
	124,
	2,
	64,
	2,
	64,
	32,
	0,
	69,
	13,
	0,
	32,
	3,
	40,
	2,
	0,
	33,
	13,
	65,
	0,
	33,
	14,
	3,
	64,
	32,
	14,
	65,
	1,
	116,
	34,
	15,
	65,
	1,
	114,
	65,
	3,
	116,
	33,
	16,
	68,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	33,
	17,
	68,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	33,
	18,
	2,
	64,
	32,
	3,
	32,
	14,
	65,
	1,
	106,
	34,
	19,
	65,
	2,
	116,
	106,
	40,
	2,
	0,
	34,
	20,
	32,
	13,
	77,
	13,
	0,
	32,
	9,
	32,
	14,
	65,
	4,
	116,
	106,
	43,
	3,
	0,
	33,
	21,
	32,
	9,
	32,
	16,
	106,
	43,
	3,
	0,
	33,
	22,
	32,
	20,
	32,
	13,
	107,
	33,
	23,
	32,
	5,
	32,
	13,
	65,
	4,
	116,
	106,
	33,
	14,
	32,
	4,
	32,
	13,
	65,
	2,
	116,
	106,
	33,
	13,
	68,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	33,
	18,
	68,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	33,
	17,
	3,
	64,
	32,
	17,
	32,
	14,
	43,
	3,
	0,
	34,
	24,
	32,
	22,
	32,
	9,
	32,
	13,
	40,
	2,
	0,
	65,
	3,
	116,
	106,
	34,
	25,
	65,
	8,
	106,
	43,
	3,
	0,
	161,
	34,
	26,
	162,
	32,
	21,
	32,
	25,
	43,
	3,
	0,
	161,
	34,
	27,
	32,
	14,
	65,
	8,
	106,
	43,
	3,
	0,
	34,
	28,
	162,
	161,
	160,
	33,
	17,
	32,
	18,
	32,
	27,
	32,
	24,
	162,
	32,
	26,
	32,
	28,
	162,
	160,
	160,
	33,
	18,
	32,
	14,
	65,
	16,
	106,
	33,
	14,
	32,
	13,
	65,
	4,
	106,
	33,
	13,
	32,
	23,
	65,
	127,
	106,
	34,
	23,
	13,
	0,
	11,
	11,
	65,
	0,
	33,
	14,
	32,
	17,
	32,
	17,
	162,
	32,
	18,
	32,
	18,
	162,
	160,
	34,
	24,
	68,
	172,
	247,
	78,
	21,
	146,
	126,
	104,
	22,
	102,
	69,
	13,
	2,
	32,
	24,
	68,
	90,
	98,
	215,
	215,
	24,
	231,
	116,
	105,
	101,
	69,
	13,
	2,
	32,
	11,
	32,
	16,
	106,
	32,
	17,
	32,
	24,
	159,
	34,
	24,
	163,
	68,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	32,
	24,
	68,
	17,
	234,
	45,
	129,
	153,
	151,
	113,
	61,
	100,
	34,
	14,
	27,
	57,
	3,
	0,
	32,
	11,
	32,
	15,
	65,
	3,
	116,
	106,
	32,
	18,
	32,
	24,
	163,
	68,
	0,
	0,
	0,
	0,
	0,
	0,
	240,
	63,
	32,
	14,
	27,
	57,
	3,
	0,
	32,
	20,
	33,
	13,
	32,
	19,
	33,
	14,
	32,
	19,
	32,
	0,
	71,
	13,
	0,
	11,
	11,
	2,
	64,
	32,
	1,
	69,
	13,
	0,
	65,
	0,
	33,
	19,
	3,
	64,
	32,
	6,
	32,
	7,
	32,
	19,
	65,
	44,
	108,
	106,
	40,
	2,
	0,
	34,
	14,
	65,
	1,
	118,
	34,
	13,
	65,
	3,
	116,
	106,
	43,
	3,
	0,
	34,
	18,
	32,
	10,
	32,
	14,
	65,
	1,
	106,
	65,
	3,
	116,
	34,
	16,
	106,
	43,
	3,
	0,
	162,
	33,
	17,
	32,
	18,
	32,
	10,
	32,
	14,
	65,
	3,
	116,
	34,
	20,
	106,
	43,
	3,
	0,
	162,
	33,
	18,
	2,
	64,
	32,
	3,
	32,
	13,
	65,
	2,
	116,
	106,
	34,
	14,
	40,
	2,
	4,
	34,
	23,
	32,
	14,
	40,
	2,
	0,
	34,
	13,
	77,
	13,
	0,
	32,
	23,
	32,
	13,
	107,
	33,
	23,
	32,
	5,
	32,
	13,
	65,
	4,
	116,
	106,
	33,
	14,
	32,
	4,
	32,
	13,
	65,
	2,
	116,
	106,
	33,
	13,
	32,
	11,
	32,
	16,
	106,
	43,
	3,
	0,
	33,
	21,
	32,
	11,
	32,
	20,
	106,
	43,
	3,
	0,
	33,
	22,
	3,
	64,
	32,
	17,
	32,
	14,
	43,
	3,
	0,
	34,
	24,
	32,
	21,
	32,
	11,
	32,
	13,
	40,
	2,
	0,
	65,
	3,
	116,
	106,
	34,
	25,
	65,
	8,
	106,
	43,
	3,
	0,
	160,
	68,
	0,
	0,
	0,
	0,
	0,
	0,
	224,
	63,
	162,
	34,
	26,
	162,
	32,
	22,
	32,
	25,
	43,
	3,
	0,
	160,
	68,
	0,
	0,
	0,
	0,
	0,
	0,
	224,
	63,
	162,
	34,
	27,
	32,
	14,
	65,
	8,
	106,
	43,
	3,
	0,
	34,
	28,
	162,
	160,
	160,
	33,
	17,
	32,
	18,
	32,
	27,
	32,
	24,
	162,
	32,
	26,
	32,
	28,
	162,
	161,
	160,
	33,
	18,
	32,
	14,
	65,
	16,
	106,
	33,
	14,
	32,
	13,
	65,
	4,
	106,
	33,
	13,
	32,
	23,
	65,
	127,
	106,
	34,
	23,
	13,
	0,
	11,
	11,
	32,
	12,
	32,
	16,
	106,
	32,
	17,
	57,
	3,
	0,
	32,
	12,
	32,
	20,
	106,
	32,
	18,
	57,
	3,
	0,
	32,
	19,
	65,
	1,
	106,
	34,
	19,
	32,
	1,
	71,
	13,
	0,
	11,
	11,
	2,
	64,
	32,
	2,
	13,
	0,
	65,
	1,
	15,
	11,
	65,
	0,
	33,
	15,
	3,
	64,
	2,
	64,
	32,
	1,
	69,
	13,
	0,
	65,
	0,
	33,
	11,
	3,
	64,
	32,
	12,
	32,
	7,
	32,
	11,
	65,
	44,
	108,
	106,
	34,
	14,
	40,
	2,
	0,
	34,
	13,
	65,
	3,
	116,
	34,
	19,
	106,
	43,
	3,
	0,
	33,
	17,
	32,
	12,
	32,
	13,
	65,
	1,
	106,
	65,
	3,
	116,
	34,
	16,
	106,
	43,
	3,
	0,
	33,
	18,
	2,
	64,
	2,
	64,
	32,
	14,
	65,
	4,
	106,
	40,
	2,
	0,
	34,
	13,
	65,
	4,
	79,
	13,
	0,
	65,
	0,
	33,
	23,
	12,
	1,
	11,
	32,
	17,
	32,
	9,
	32,
	14,
	65,
	12,
	106,
	40,
	2,
	0,
	65,
	3,
	116,
	106,
	34,
	23,
	43,
	3,
	0,
	160,
	32,
	9,
	32,
	14,
	65,
	16,
	106,
	40,
	2,
	0,
	65,
	3,
	116,
	106,
	34,
	25,
	43,
	3,
	0,
	160,
	32,
	9,
	32,
	14,
	65,
	20,
	106,
	40,
	2,
	0,
	65,
	3,
	116,
	106,
	34,
	20,
	43,
	3,
	0,
	160,
	32,
	9,
	32,
	14,
	65,
	24,
	106,
	40,
	2,
	0,
	65,
	3,
	116,
	106,
	34,
	10,
	43,
	3,
	0,
	160,
	33,
	17,
	32,
	18,
	32,
	23,
	65,
	8,
	106,
	43,
	3,
	0,
	160,
	32,
	25,
	65,
	8,
	106,
	43,
	3,
	0,
	160,
	32,
	20,
	65,
	8,
	106,
	43,
	3,
	0,
	160,
	32,
	10,
	65,
	8,
	106,
	43,
	3,
	0,
	160,
	33,
	18,
	65,
	4,
	33,
	23,
	32,
	13,
	65,
	8,
	73,
	13,
	0,
	32,
	17,
	32,
	9,
	32,
	14,
	65,
	28,
	106,
	40,
	2,
	0,
	65,
	3,
	116,
	106,
	34,
	25,
	43,
	3,
	0,
	160,
	32,
	9,
	32,
	14,
	65,
	32,
	106,
	40,
	2,
	0,
	65,
	3,
	116,
	106,
	34,
	20,
	43,
	3,
	0,
	160,
	32,
	9,
	32,
	14,
	65,
	36,
	106,
	40,
	2,
	0,
	65,
	3,
	116,
	106,
	34,
	10,
	43,
	3,
	0,
	160,
	32,
	9,
	32,
	14,
	65,
	40,
	106,
	40,
	2,
	0,
	65,
	3,
	116,
	106,
	34,
	3,
	43,
	3,
	0,
	160,
	33,
	17,
	65,
	8,
	33,
	23,
	32,
	18,
	32,
	25,
	65,
	8,
	106,
	43,
	3,
	0,
	160,
	32,
	20,
	65,
	8,
	106,
	43,
	3,
	0,
	160,
	32,
	10,
	65,
	8,
	106,
	43,
	3,
	0,
	160,
	32,
	3,
	65,
	8,
	106,
	43,
	3,
	0,
	160,
	33,
	18,
	11,
	2,
	64,
	32,
	23,
	32,
	13,
	79,
	13,
	0,
	32,
	23,
	65,
	1,
	114,
	33,
	25,
	32,
	14,
	65,
	8,
	106,
	40,
	2,
	0,
	65,
	2,
	116,
	33,
	14,
	2,
	64,
	32,
	13,
	65,
	1,
	113,
	69,
	13,
	0,
	32,
	17,
	32,
	9,
	32,
	4,
	32,
	14,
	106,
	32,
	23,
	65,
	2,
	116,
	106,
	40,
	2,
	0,
	65,
	3,
	116,
	106,
	34,
	23,
	43,
	3,
	0,
	160,
	33,
	17,
	32,
	18,
	32,
	23,
	65,
	8,
	106,
	43,
	3,
	0,
	160,
	33,
	18,
	32,
	25,
	33,
	23,
	11,
	32,
	13,
	32,
	25,
	70,
	13,
	0,
	32,
	4,
	32,
	23,
	65,
	2,
	116,
	32,
	14,
	106,
	106,
	33,
	14,
	32,
	13,
	32,
	23,
	107,
	33,
	13,
	3,
	64,
	32,
	17,
	32,
	9,
	32,
	14,
	40,
	2,
	0,
	65,
	3,
	116,
	106,
	34,
	23,
	43,
	3,
	0,
	160,
	32,
	9,
	32,
	14,
	65,
	4,
	106,
	40,
	2,
	0,
	65,
	3,
	116,
	106,
	34,
	25,
	43,
	3,
	0,
	160,
	33,
	17,
	32,
	18,
	32,
	23,
	65,
	8,
	106,
	43,
	3,
	0,
	160,
	32,
	25,
	65,
	8,
	106,
	43,
	3,
	0,
	160,
	33,
	18,
	32,
	14,
	65,
	8,
	106,
	33,
	14,
	32,
	13,
	65,
	126,
	106,
	34,
	13,
	13,
	0,
	11,
	11,
	32,
	9,
	32,
	19,
	106,
	32,
	17,
	32,
	8,
	32,
	11,
	65,
	3,
	116,
	106,
	34,
	14,
	43,
	3,
	0,
	162,
	57,
	3,
	0,
	32,
	9,
	32,
	16,
	106,
	32,
	18,
	32,
	14,
	43,
	3,
	0,
	162,
	57,
	3,
	0,
	32,
	11,
	65,
	1,
	106,
	34,
	11,
	32,
	1,
	71,
	13,
	0,
	11,
	32,
	1,
	33,
	11,
	3,
	64,
	32,
	12,
	32,
	7,
	32,
	11,
	65,
	127,
	106,
	34,
	11,
	65,
	44,
	108,
	106,
	34,
	14,
	40,
	2,
	0,
	34,
	13,
	65,
	3,
	116,
	34,
	19,
	106,
	43,
	3,
	0,
	33,
	17,
	32,
	12,
	32,
	13,
	65,
	1,
	106,
	65,
	3,
	116,
	34,
	16,
	106,
	43,
	3,
	0,
	33,
	18,
	2,
	64,
	2,
	64,
	32,
	14,
	65,
	4,
	106,
	40,
	2,
	0,
	34,
	13,
	65,
	4,
	79,
	13,
	0,
	65,
	0,
	33,
	23,
	12,
	1,
	11,
	32,
	17,
	32,
	9,
	32,
	14,
	65,
	12,
	106,
	40,
	2,
	0,
	65,
	3,
	116,
	106,
	34,
	23,
	43,
	3,
	0,
	160,
	32,
	9,
	32,
	14,
	65,
	16,
	106,
	40,
	2,
	0,
	65,
	3,
	116,
	106,
	34,
	25,
	43,
	3,
	0,
	160,
	32,
	9,
	32,
	14,
	65,
	20,
	106,
	40,
	2,
	0,
	65,
	3,
	116,
	106,
	34,
	20,
	43,
	3,
	0,
	160,
	32,
	9,
	32,
	14,
	65,
	24,
	106,
	40,
	2,
	0,
	65,
	3,
	116,
	106,
	34,
	10,
	43,
	3,
	0,
	160,
	33,
	17,
	32,
	18,
	32,
	23,
	65,
	8,
	106,
	43,
	3,
	0,
	160,
	32,
	25,
	65,
	8,
	106,
	43,
	3,
	0,
	160,
	32,
	20,
	65,
	8,
	106,
	43,
	3,
	0,
	160,
	32,
	10,
	65,
	8,
	106,
	43,
	3,
	0,
	160,
	33,
	18,
	2,
	64,
	32,
	13,
	65,
	8,
	79,
	13,
	0,
	65,
	4,
	33,
	23,
	12,
	1,
	11,
	32,
	17,
	32,
	9,
	32,
	14,
	65,
	28,
	106,
	40,
	2,
	0,
	65,
	3,
	116,
	106,
	34,
	25,
	43,
	3,
	0,
	160,
	32,
	9,
	32,
	14,
	65,
	32,
	106,
	40,
	2,
	0,
	65,
	3,
	116,
	106,
	34,
	20,
	43,
	3,
	0,
	160,
	32,
	9,
	32,
	14,
	65,
	36,
	106,
	40,
	2,
	0,
	65,
	3,
	116,
	106,
	34,
	10,
	43,
	3,
	0,
	160,
	32,
	9,
	32,
	14,
	65,
	40,
	106,
	40,
	2,
	0,
	65,
	3,
	116,
	106,
	34,
	3,
	43,
	3,
	0,
	160,
	33,
	17,
	65,
	8,
	33,
	23,
	32,
	18,
	32,
	25,
	65,
	8,
	106,
	43,
	3,
	0,
	160,
	32,
	20,
	65,
	8,
	106,
	43,
	3,
	0,
	160,
	32,
	10,
	65,
	8,
	106,
	43,
	3,
	0,
	160,
	32,
	3,
	65,
	8,
	106,
	43,
	3,
	0,
	160,
	33,
	18,
	11,
	2,
	64,
	32,
	23,
	32,
	13,
	79,
	13,
	0,
	32,
	23,
	65,
	1,
	114,
	33,
	25,
	32,
	14,
	65,
	8,
	106,
	40,
	2,
	0,
	65,
	2,
	116,
	33,
	14,
	2,
	64,
	32,
	13,
	65,
	1,
	113,
	69,
	13,
	0,
	32,
	17,
	32,
	9,
	32,
	4,
	32,
	14,
	106,
	32,
	23,
	65,
	2,
	116,
	106,
	40,
	2,
	0,
	65,
	3,
	116,
	106,
	34,
	23,
	43,
	3,
	0,
	160,
	33,
	17,
	32,
	18,
	32,
	23,
	65,
	8,
	106,
	43,
	3,
	0,
	160,
	33,
	18,
	32,
	25,
	33,
	23,
	11,
	32,
	13,
	32,
	25,
	70,
	13,
	0,
	32,
	4,
	32,
	23,
	65,
	2,
	116,
	32,
	14,
	106,
	106,
	33,
	14,
	32,
	13,
	32,
	23,
	107,
	33,
	13,
	3,
	64,
	32,
	17,
	32,
	9,
	32,
	14,
	40,
	2,
	0,
	65,
	3,
	116,
	106,
	34,
	23,
	43,
	3,
	0,
	160,
	32,
	9,
	32,
	14,
	65,
	4,
	106,
	40,
	2,
	0,
	65,
	3,
	116,
	106,
	34,
	25,
	43,
	3,
	0,
	160,
	33,
	17,
	32,
	18,
	32,
	23,
	65,
	8,
	106,
	43,
	3,
	0,
	160,
	32,
	25,
	65,
	8,
	106,
	43,
	3,
	0,
	160,
	33,
	18,
	32,
	14,
	65,
	8,
	106,
	33,
	14,
	32,
	13,
	65,
	126,
	106,
	34,
	13,
	13,
	0,
	11,
	11,
	32,
	9,
	32,
	19,
	106,
	32,
	17,
	32,
	8,
	32,
	11,
	65,
	3,
	116,
	106,
	34,
	14,
	43,
	3,
	0,
	162,
	57,
	3,
	0,
	32,
	9,
	32,
	16,
	106,
	32,
	18,
	32,
	14,
	43,
	3,
	0,
	162,
	57,
	3,
	0,
	32,
	11,
	13,
	0,
	11,
	11,
	65,
	1,
	33,
	14,
	32,
	15,
	65,
	1,
	106,
	34,
	15,
	32,
	2,
	71,
	13,
	0,
	11,
	11,
	32,
	14,
	11
]);
//#endregion
//#region port/v2/tools/creature-animation/wasm-arap-sweep.mjs
/** One optional memory-only normal pass; robust JS remains the fallback. */
const modules = /* @__PURE__ */ new WeakMap();
const need$7 = (ok, why) => {
	if (!ok) throw Error("ARAP Wasm pass: " + why);
};
function referencePass(c, p, t, r, rhs) {
	const n = c.rest.length / 2;
	for (let i = 0; i < n; i++) {
		let dot = 0, cross = 0;
		const ix = p[i * 2], iy = p[i * 2 + 1];
		for (let k = c.starts[i]; k < c.starts[i + 1]; k++) {
			const j = c.neighbours[k], px = ix - p[j], py = iy - p[j + 1], x = c.deltas[k * 2], y = c.deltas[k * 2 + 1];
			dot += x * px + y * py;
			cross += x * py - y * px;
		}
		const squared = dot * dot + cross * cross;
		if (!(squared >= 1e-200 && squared <= 1e200)) return false;
		const length = Math.sqrt(squared);
		r[i * 2] = length > 1e-12 ? dot / length : 1;
		r[i * 2 + 1] = length > 1e-12 ? cross / length : 0;
	}
	for (let row = 0; row < c.reciprocals.length; row++) {
		const ii = c.rows[row * 11], i = ii / 2, l = c.lambda[i];
		let x = l * t[ii], y = l * t[ii + 1];
		for (let k = c.starts[i]; k < c.starts[i + 1]; k++) {
			const j = c.neighbours[k], cos = (r[ii] + r[j]) * .5, sin = (r[ii + 1] + r[j + 1]) * .5, dx = c.deltas[k * 2], dy = c.deltas[k * 2 + 1];
			x += cos * dx - sin * dy;
			y += sin * dx + cos * dy;
		}
		rhs[ii] = x;
		rhs[ii + 1] = y;
	}
	for (let direction = 0; direction < 2; direction++) for (let step = 0; step < c.reciprocals.length; step++) {
		const row = direction ? c.reciprocals.length - 1 - step : step, base = row * 11, ii = c.rows[base], degree = c.rows[base + 1], start = c.rows[base + 2];
		let x = rhs[ii], y = rhs[ii + 1];
		for (let k = 0; k < degree; k++) {
			const j = c.neighbours[start + k];
			x += p[j];
			y += p[j + 1];
		}
		p[ii] = x * c.reciprocals[row];
		p[ii + 1] = y * c.reciprocals[row];
	}
	return true;
}
/** All invariants are snapshotted into fixed private memory. The same Float64
* target/position/rotation/RHS views are used by JS and Wasm without pass copies.
* A zero return leaves position untouched and asks the caller for robust JS. */
function createWasmArapPass(c, runtime = globalThis.WebAssembly) {
	need$7(c && c.rest instanceof Float64Array && c.rest.length >= 6 && c.rest.length <= 8e4 && c.rest.length % 2 === 0, "position budget");
	const positionLength = c.rest.length, n = positionLength / 2, { rows, neighbours, reciprocals, starts, deltas, lambda } = c;
	need$7(rows instanceof Uint32Array && rows.length % 11 === 0 && rows.length <= 44e4 && neighbours instanceof Uint32Array && neighbours.length <= 12e5 && reciprocals instanceof Float64Array && reciprocals.length === rows.length / 11 && starts instanceof Uint32Array && starts.length === n + 1 && deltas instanceof Float64Array && deltas.length === neighbours.length * 2 && lambda instanceof Float64Array && lambda.length === n, "topology buffers");
	need$7(starts[0] === 0 && starts[n] === neighbours.length, "adjacency bounds");
	for (let i = 0; i < n; i++) {
		need$7(starts[i + 1] >= starts[i] + 2 && starts[i + 1] <= neighbours.length, "adjacency row");
		need$7(Number.isFinite(c.rest[i * 2]) && Number.isFinite(c.rest[i * 2 + 1]) && Number.isFinite(lambda[i]) && lambda[i] > 0, "rest/lambda");
	}
	for (let k = 0; k < neighbours.length; k++) need$7(neighbours[k] % 2 === 0 && neighbours[k] + 1 < positionLength && Number.isFinite(deltas[k * 2]) && Number.isFinite(deltas[k * 2 + 1]), "neighbor/delta");
	let previous = -1;
	for (let row = 0; row < reciprocals.length; row++) {
		const base = row * 11, ii = rows[base], degree = rows[base + 1], start = rows[base + 2];
		need$7(ii > previous && ii % 2 === 0 && ii + 1 < positionLength && degree === starts[ii / 2 + 1] - starts[ii / 2] && start === starts[ii / 2], "row");
		previous = ii;
		need$7(Number.isFinite(reciprocals[row]) && reciprocals[row] > 0 && reciprocals[row] <= .5, "reciprocal");
		for (let k = 0; k < Math.min(8, degree); k++) need$7(rows[base + 3 + k] === neighbours[start + k], "compiled neighbor");
	}
	if (!runtime || typeof runtime.Module !== "function" || typeof runtime.Instance !== "function" || typeof runtime.Memory !== "function") return null;
	try {
		let module = modules.get(runtime);
		if (!module) {
			module = new runtime.Module(ARAP_SWEEP_BYTES.slice());
			const im = runtime.Module.imports(module), ex = runtime.Module.exports(module);
			if (im.length !== 1 || im[0].module !== "env" || im[0].name !== "__linear_memory" || im[0].kind !== "memory" || ex.length !== 1 || ex[0].name !== "pass" || ex[0].kind !== "function") return null;
			modules.set(runtime, module);
		}
		let end = 16;
		const reserve = (bytes) => {
			const at = end + 7 & -8;
			end = at + bytes;
			return at;
		}, positionOffset = reserve(positionLength * 8), targetOffset = reserve(positionLength * 8), rotationOffset = reserve(positionLength * 8), rhsOffset = reserve(positionLength * 8), rowsOffset = reserve(rows.byteLength), neighboursOffset = reserve(neighbours.byteLength), reciprocalsOffset = reserve(reciprocals.byteLength), startsOffset = reserve(starts.byteLength), deltasOffset = reserve(deltas.byteLength), lambdaOffset = reserve(lambda.byteLength), pages = Math.ceil(end / 65536), memory = new runtime.Memory({
			initial: pages,
			maximum: pages
		}), buffer = memory.buffer;
		const position = new Float64Array(buffer, positionOffset, positionLength), target = new Float64Array(buffer, targetOffset, positionLength), rotation = new Float64Array(buffer, rotationOffset, positionLength), rhs = new Float64Array(buffer, rhsOffset, positionLength), fixedRows = new Uint32Array(buffer, rowsOffset, rows.length), fixedNeighbours = new Uint32Array(buffer, neighboursOffset, neighbours.length), fixedReciprocals = new Float64Array(buffer, reciprocalsOffset, reciprocals.length), fixedStarts = new Uint32Array(buffer, startsOffset, starts.length), fixedDeltas = new Float64Array(buffer, deltasOffset, deltas.length), fixedLambda = new Float64Array(buffer, lambdaOffset, lambda.length);
		fixedRows.set(rows);
		fixedNeighbours.set(neighbours);
		fixedReciprocals.set(reciprocals);
		fixedStarts.set(starts);
		fixedDeltas.set(deltas);
		fixedLambda.set(lambda);
		const rowCount = reciprocals.length, leaf = new runtime.Instance(module, { env: { __linear_memory: memory } }).exports.pass;
		if (typeof leaf !== "function") return null;
		let normalPasses = 0, robustFallbacks = 0;
		const runPass = (sweeps) => {
			need$7(Number.isInteger(sweeps) && sweeps >= 1 && sweeps <= 32, "sweep budget");
			const result = leaf(n, rowCount, sweeps, startsOffset, neighboursOffset, deltasOffset, lambdaOffset, rowsOffset, reciprocalsOffset, positionOffset, targetOffset, rotationOffset, rhsOffset);
			need$7(result === 0 || result === 1, "invalid result");
			if (result === 1) normalPasses++;
			else robustFallbacks++;
			return result === 1;
		};
		for (let i = 0; i < positionLength; i += 2) {
			const x = c.rest[i], y = c.rest[i + 1];
			position[i] = x * .9375 - y * .125;
			position[i + 1] = x * .1875 + y * 1.0625;
		}
		for (let i = 0; i < positionLength; i++) target[i] = position[i] + (i % 7 - 3) / 32;
		const expected = position.slice(), expectedRotation = rotation.slice(), expectedRhs = rhs.slice();
		if (!referencePass({
			rest: c.rest,
			rows: fixedRows,
			neighbours: fixedNeighbours,
			reciprocals: fixedReciprocals,
			starts: fixedStarts,
			deltas: fixedDeltas,
			lambda: fixedLambda
		}, expected, target, expectedRotation, expectedRhs) || !runPass(1)) return null;
		for (let i = 0; i < positionLength; i++) if (!Object.is(expected[i], position[i]) || !Object.is(expectedRotation[i], rotation[i]) || !Object.is(expectedRhs[i], rhs[i])) return null;
		position.fill(0);
		target.fill(0);
		rotation.fill(0);
		rhs.fill(0);
		normalPasses = 0;
		robustFallbacks = 0;
		return Object.freeze({
			kind: "wasm",
			position,
			target,
			rotation,
			rhs,
			byteLength: buffer.byteLength,
			runPass,
			get normalPasses() {
				return normalPasses;
			},
			get robustFallbacks() {
				return robustFallbacks;
			}
		});
	} catch {
		return null;
	}
}
//#endregion
//#region port/v2/tools/creature-animation/arap-skin.mjs
/** Allocation-free local/global 2D shape projection. The pose owner supplies all
* targets; this solver neither authors curves nor changes bone transforms.
* Independent anatomical surfaces must supply independent vertex inventories. */
const need$6 = (ok, why) => {
	if (!ok) throw Error("ARAP skin: " + why);
};
function createArapScratch(vertices, triangles, width, height, options = {}) {
	need$6(Array.isArray(vertices) && vertices.length >= 3 && vertices.length <= 4e4, "vertex budget");
	need$6(Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0, "dimensions");
	need$6((Array.isArray(triangles) || ArrayBuffer.isView(triangles)) && triangles.length > 0 && triangles.length % 3 === 0 && triangles.length <= 6e5, "triangle budget");
	const n = vertices.length, rest = new Float64Array(n * 2), adj = Array.from({ length: n }, () => /* @__PURE__ */ new Set()), areas = new Float64Array(triangles.length / 3);
	vertices.forEach((p, i) => {
		need$6(p && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.y >= 0 && p.x <= width && p.y <= height, "rest vertex");
		rest[i * 2] = p.x;
		rest[i * 2 + 1] = p.y;
	});
	for (let k = 0; k < triangles.length; k += 3) {
		const a = triangles[k], b = triangles[k + 1], c = triangles[k + 2];
		need$6([
			a,
			b,
			c
		].every((i) => Number.isInteger(i) && i >= 0 && i < n) && a !== b && b !== c && c !== a, "triangle indices");
		const area = (rest[b * 2] - rest[a * 2]) * (rest[c * 2 + 1] - rest[a * 2 + 1]) - (rest[b * 2 + 1] - rest[a * 2 + 1]) * (rest[c * 2] - rest[a * 2]);
		need$6(Math.abs(area) > 1e-9, "degenerate triangle");
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
	need$6(adj.every((a) => a.size > 0), "unconnected vertex");
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
	const iterations = options.iterations ?? 4, globalIterations = options.globalIterations ?? 4, targetWeight = options.targetWeight ?? .35, orientationIterations = options.orientationIterations ?? 64, minimumAreaRatio = options.minimumAreaRatio ?? .12;
	need$6(Number.isInteger(iterations) && iterations >= 1 && iterations <= 16 && Number.isInteger(globalIterations) && globalIterations >= 1 && globalIterations <= 32, "iteration budget");
	need$6(Number.isFinite(targetWeight) && targetWeight > 0 && targetWeight <= 100, "target weight");
	need$6(Number.isInteger(orientationIterations) && orientationIterations >= 1 && orientationIterations <= 64 && Number.isFinite(minimumAreaRatio) && minimumAreaRatio > 0 && minimumAreaRatio <= .5, "orientation budget");
	const pins = new Uint8Array(n);
	for (const i of options.pins ?? []) {
		need$6(Number.isInteger(i) && i >= 0 && i < n && !pins[i], "pin");
		pins[i] = 1;
	}
	const freeDofs = Uint32Array.from(Array.from({ length: n }, (_, i) => i).filter((i) => !pins[i]), (i) => i * 2), lambda = new Float64Array(n), divisor = new Float64Array(n);
	for (let i = 0; i < n; i++) {
		const degree = starts[i + 1] - starts[i];
		lambda[i] = degree * targetWeight;
		divisor[i] = degree * (1 + targetWeight);
	}
	const solveRows = new Uint32Array(freeDofs.length * 11), solveDivisors = new Float64Array(freeDofs.length), solveReciprocals = new Float64Array(freeDofs.length);
	for (let row = 0; row < freeDofs.length; row++) {
		const ii = freeDofs[row], i = ii / 2, start = starts[i], degree = starts[i + 1] - start, base = row * 11;
		solveRows[base] = ii;
		solveRows[base + 1] = degree;
		solveRows[base + 2] = start;
		solveDivisors[row] = divisor[i];
		solveReciprocals[row] = 1 / divisor[i];
		for (let k = 0; k < Math.min(8, degree); k++) solveRows[base + 3 + k] = neighbourDofs[start + k];
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
	need$6(axisDistance > 1e-18, "rest axis");
	const sweepKernel = createWasmArapPass({
		rest,
		rows: solveRows,
		neighbours: neighbourDofs,
		reciprocals: solveReciprocals,
		starts,
		deltas,
		lambda
	});
	return {
		sweepBackend: sweepKernel ? "wasm" : "js",
		get normalPasses() {
			return sweepKernel?.normalPasses ?? 0;
		},
		get robustFallbacks() {
			return sweepKernel?.robustFallbacks ?? 0;
		},
		sweepKernel,
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
		solveRows,
		solveDivisors,
		solveReciprocals,
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
		position: sweepKernel?.position ?? new Float64Array(n * 2),
		target: sweepKernel?.target ?? new Float64Array(n * 2),
		rotation: sweepKernel?.rotation ?? new Float64Array(n * 2),
		rhs: sweepKernel?.rhs ?? new Float64Array(n * 2),
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
	need$6(targets?.length === s.n * 2 && output?.length === s.n * 2, "position buffer");
	const { n, width, height, rest, position: p, target: t, starts, neighbourDofs, deltas, rotation: r, rhs, pins, freeDofs, lambda, divisor, solveRows, solveDivisors, solveReciprocals, triangleDofs, triangleSigns, triangleFloors, triangleMovable } = s;
	for (let i = 0; i < n; i++) {
		const x = targets[i * 2], y = targets[i * 2 + 1];
		need$6(Number.isFinite(x) && Number.isFinite(y), "nonfinite target");
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
		if (s.sweepKernel?.runPass(s.globalIterations)) continue;
		for (let i = 0; i < n; i++) {
			let dot = 0, cross = 0;
			const ix = p[i * 2], iy = p[i * 2 + 1];
			for (let k = starts[i]; k < starts[i + 1]; k++) {
				const j = neighbourDofs[k], px = ix - p[j], py = iy - p[j + 1], x = deltas[k * 2], y = deltas[k * 2 + 1];
				dot += x * px + y * py;
				cross += x * py - y * px;
			}
			const squared = dot * dot + cross * cross, length = squared >= 1e-200 && squared <= 1e200 ? Math.sqrt(squared) : Math.hypot(dot, cross);
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
				const base = step * 11, ii = solveRows[base], degree = solveRows[base + 1];
				let x = rhs[ii], y = rhs[ii + 1], k = 0;
				if (degree >= 4) {
					const a = solveRows[base + 3], b = solveRows[base + 4], c = solveRows[base + 5], d = solveRows[base + 6];
					x += p[a];
					y += p[a + 1];
					x += p[b];
					y += p[b + 1];
					x += p[c];
					y += p[c + 1];
					x += p[d];
					y += p[d + 1];
					k = 4;
				}
				if (degree >= 8) {
					const a = solveRows[base + 7], b = solveRows[base + 8], c = solveRows[base + 9], d = solveRows[base + 10];
					x += p[a];
					y += p[a + 1];
					x += p[b];
					y += p[b + 1];
					x += p[c];
					y += p[c + 1];
					x += p[d];
					y += p[d + 1];
					k = 8;
				}
				const start = solveRows[base + 2];
				for (; k < degree; k++) {
					const j = neighbourDofs[start + k];
					x += p[j];
					y += p[j + 1];
				}
				p[ii] = x * solveReciprocals[step];
				p[ii + 1] = y * solveReciprocals[step];
			}
			for (let step = freeDofs.length - 1; step >= 0; step--) {
				const base = step * 11, ii = solveRows[base], degree = solveRows[base + 1];
				let x = rhs[ii], y = rhs[ii + 1], k = 0;
				if (degree >= 4) {
					const a = solveRows[base + 3], b = solveRows[base + 4], c = solveRows[base + 5], d = solveRows[base + 6];
					x += p[a];
					y += p[a + 1];
					x += p[b];
					y += p[b + 1];
					x += p[c];
					y += p[c + 1];
					x += p[d];
					y += p[d + 1];
					k = 4;
				}
				if (degree >= 8) {
					const a = solveRows[base + 7], b = solveRows[base + 8], c = solveRows[base + 9], d = solveRows[base + 10];
					x += p[a];
					y += p[a + 1];
					x += p[b];
					y += p[b + 1];
					x += p[c];
					y += p[c + 1];
					x += p[d];
					y += p[d + 1];
					k = 8;
				}
				const start = solveRows[base + 2];
				for (; k < degree; k++) {
					const j = neighbourDofs[start + k];
					x += p[j];
					y += p[j + 1];
				}
				p[ii] = x * solveReciprocals[step];
				p[ii + 1] = y * solveReciprocals[step];
			}
		}
	}
	rhs.set(p);
	let orientationPasses = 0;
	for (let pass = 0; pass < s.orientationIterations; pass++) {
		let changed = 0, progressed = false;
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
				const x = p[a], y = p[a + 1];
				p[a] += scale * ax;
				p[a + 1] += scale * ay;
				if (!Object.is(x, p[a]) || !Object.is(y, p[a + 1])) progressed = true;
			}
			if (movable & 2) {
				const x = p[b], y = p[b + 1];
				p[b] += scale * bx;
				p[b + 1] += scale * by;
				if (!Object.is(x, p[b]) || !Object.is(y, p[b + 1])) progressed = true;
			}
			if (movable & 4) {
				const x = p[c], y = p[c + 1];
				p[c] += scale * cx;
				p[c + 1] += scale * cy;
				if (!Object.is(x, p[c]) || !Object.is(y, p[c + 1])) progressed = true;
			}
		}
		orientationPasses = pass + 1;
		if (!changed || !progressed) break;
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
		need$6(Number.isFinite(p[i * 2]) && Number.isFinite(p[i * 2 + 1]), "nonfinite solution");
		const e = (p[i * 2] - t[i * 2]) ** 2 + (p[i * 2 + 1] - t[i * 2 + 1]) ** 2;
		maximum = Math.max(maximum, e);
		sum += e;
	}
	s.stats.maximumTargetErrorPx = Math.sqrt(maximum);
	s.stats.rmsTargetErrorPx = Math.sqrt(sum / n);
	need$6(flipped === 0, "unresolved folded triangles: " + flipped);
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
const states = /* @__PURE__ */ new WeakMap();
const fail = (message) => {
	throw Error("Compiled skin field: " + message);
};
function createCompiledSkinField(skin, width, height) {
	if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(height) || height <= 0) fail("dimensions");
	if (skin?.schema !== "cf.paint-skin/v1" || !Array.isArray(skin.vertices) || skin.vertices.length < 3 || skin.vertices.length > 4e4) fail("source vertices");
	const vertexCount = skin.vertices.length, jointNames = [], jointIds = /* @__PURE__ */ new Map();
	const positions = new Float64Array(vertexCount * 2), offsets = new Uint32Array(vertexCount + 1);
	let weightCount = 0;
	for (let i = 0; i < vertexCount; i++) {
		const vertex = skin.vertices[i];
		if (!vertex || !Number.isFinite(vertex.x) || !Number.isFinite(vertex.y) || vertex.x < 0 || vertex.x > width || vertex.y < 0 || vertex.y > height || !Array.isArray(vertex.weights) || !vertex.weights.length || vertex.weights.length > 8) fail("source vertex");
		positions[i * 2] = vertex.x / width;
		positions[i * 2 + 1] = vertex.y / height;
		offsets[i] = weightCount;
		let sum = 0;
		const used = /* @__PURE__ */ new Set();
		for (const entry of vertex.weights) {
			if (!Array.isArray(entry) || entry.length !== 2) fail("source weight");
			const [joint, weight] = entry;
			if (typeof joint !== "string" || !joint.length || used.has(joint) || !Number.isFinite(weight) || weight <= 0 || weight > 1) fail("source weight");
			used.add(joint);
			sum += weight;
			weightCount++;
			if (!jointIds.has(joint)) {
				jointIds.set(joint, jointNames.length);
				jointNames.push(joint);
			}
		}
		if (Math.abs(sum - 1) > 1e-8) fail("source weight sum");
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
	states.set(state, {
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
	const data = states.get(state);
	if (!data) fail("unknown compiled state");
	if (!(output instanceof Float32Array || output instanceof Float64Array) || output.length !== state.vertexCount * 2) fail("position buffer");
	if (!matrices || typeof matrices !== "object") fail("matrices");
	const { positions, offsets, matrixOffsets, weights, jointNames, matrixValues } = data;
	for (let joint = 0; joint < jointNames.length; joint++) {
		const name = jointNames[joint], matrix = matrices[name];
		if (!Object.hasOwn(matrices, name) || !matrix || matrix.length !== 6) fail("matrix: " + name);
		const offset = joint * 6;
		for (let component = 0; component < 6; component++) {
			const value = matrix[component];
			if (!Number.isFinite(value)) fail("matrix: " + name);
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
		if (!Number.isFinite(scratch[index]) || !Number.isFinite(scratch[index + 1])) fail("overflow");
	}
	output.set(scratch);
}
//#endregion
//#region port/v2/tools/creature-animation/pose-projection.mjs
/** Convert canonical backward-pointing bird-wing rotations into the authored
* image plane. This changes coordinate basis, never clip timing or anatomy. */
function poseProjectionSigns(record) {
	if (record.projection === void 0) return {};
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
	const signs = poseProjectionSigns(record);
	return {
		...template,
		limitsDeg: Object.fromEntries(Object.entries(template.limitsDeg).map(([j, l]) => [j, signs[j] === -1 ? {
			min: -l.max,
			max: -l.min
		} : l]))
	};
}
//#endregion
//#region port/v2/tools/creature-animation/anatomy-inventory.mjs
/** Explicit anatomical absence, shared by the motion producer and rig intake.
* A hidden but present appendage is NOT absent. Never infer absence from a
* missing landmark: only the hash-bound record can declare it. */
const OPTIONAL = Object.freeze({ hopper: Object.freeze({
	tail: [
		"tail0",
		"tail1",
		"tail2",
		"tail3"
	],
	"external-ears": [
		"earFarRoot",
		"earFarTip",
		"earNearRoot",
		"earNearTip"
	]
}) });
function resolveAnatomyInventory(template, anatomy) {
	if (anatomy === void 0) return template;
	if (!anatomy || anatomy.schema !== "cf.anatomy-presence/v1" || !Array.isArray(anatomy.absent) || Object.keys(anatomy).some((k) => !["schema", "absent"].includes(k))) throw Error("Anatomy inventory: invalid presence declaration");
	if (new Set(anatomy.absent).size !== anatomy.absent.length) throw Error("Anatomy inventory: duplicate absence");
	const removed = /* @__PURE__ */ new Set();
	for (const group of anatomy.absent) {
		const names = OPTIONAL[template.id]?.[group];
		if (!names) throw Error("Anatomy inventory: mandatory or unknown part " + group);
		for (const j of names) removed.add(j);
	}
	if (!removed.size) return template;
	const graph = template.graph.filter(([child]) => !removed.has(child));
	if (graph.some(([, parent]) => removed.has(parent))) throw Error("Anatomy inventory: disconnected child");
	return Object.freeze({
		...template,
		graph: Object.freeze(graph),
		joints: Object.freeze(template.joints.filter((j) => !removed.has(j))),
		limitsDeg: Object.freeze(Object.fromEntries(Object.entries(template.limitsDeg).filter(([j]) => !removed.has(j)))),
		...template.secondaryChains ? { secondaryChains: Object.freeze(template.secondaryChains.map((c) => ({
			...c,
			joints: c.joints.filter((j) => !removed.has(j))
		})).filter((c) => c.joints.length && !removed.has(c.driver))) } : {}
	});
}
//#endregion
//#region port/v2/tools/creature-animation/family-contracts.mjs
/** Contracted anatomy inventories from the read-only motion producer.
* These describe supported topologies, not painter coverage or art acceptance. */
const contracts = [
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
const freeze = (x) => {
	if (x && typeof x === "object") {
		for (const v of Object.values(x)) freeze(v);
		Object.freeze(x);
	}
	return x;
};
const FAMILY_CONTRACTS = freeze(contracts);
function familyContract(id) {
	const value = FAMILY_CONTRACTS.find((t) => t.id === id);
	if (!value) throw Error("Family admission: unknown template " + id);
	return value;
}
function familyContractForRecord(record) {
	return projectTemplateLimits(resolveAnatomyInventory(familyContract(record.template.id), record.anatomy), record);
}
//#endregion
//#region port/v2/tools/quadruped-proof/source-join-continuity.mjs
/** Source-adjacent painted attachment continuity, independent of compiled seam
* lists, runtime weight sharing or projected bones. Nearest joint attachments
* and proximal limb-to-axial skin must remain continuous. Distinct limbs and
* distal limb/body silhouette crossings are measured separately, not welded.
* Root/pelvis ink belongs to the declared remainder surface. */
const need$5 = (ok, message) => {
	if (!ok) throw Error("Source join continuity: " + message);
};
const CELL = 32;
const legJoint = (joint) => /^(?:fore|hind)(?:Near|Far)(?:Root|Knee|Ankle|Paw)$/.test(joint);
const upperJoint = (joint) => /^(?:fore|hind)(?:Near|Far)(?:Root|Knee)$/.test(joint);
const proximalSkin = (a, d) => upperJoint(a.joint) && !legJoint(d.joint) || !legJoint(a.joint) && upperJoint(d.joint);
function meshSource(part, skin) {
	const positions = Float64Array.from(part.vertices.flatMap((v) => v.triangle.reduce((p, k, i) => [p[0] + skin.vertices[k].x * v.barycentric[i], p[1] + skin.vertices[k].y * v.barycentric[i]], [0, 0]))), bins = /* @__PURE__ */ new Map();
	for (let t = 0; t < part.indices.length; t += 3) {
		const ix = Array.from(part.indices.slice(t, t + 3)), xs = ix.map((i) => positions[i * 2]), ys = ix.map((i) => positions[i * 2 + 1]);
		for (let y = Math.floor(Math.min(...ys) / CELL); y <= Math.floor(Math.max(...ys) / CELL); y++) for (let x = Math.floor(Math.min(...xs) / CELL); x <= Math.floor(Math.max(...xs) / CELL); x++) {
			const key = x + ":" + y;
			if (!bins.has(key)) bins.set(key, []);
			bins.get(key).push(t);
		}
	}
	return {
		part,
		positions,
		bins
	};
}
function trianglesNear(mesh, points) {
	const found = /* @__PURE__ */ new Set();
	for (const [x, y] of points) for (const t of mesh.bins.get(Math.floor(x / CELL) + ":" + Math.floor(y / CELL)) ?? []) found.add(t);
	return [...found].sort((a, b) => a - b);
}
function barycentric(mesh, point) {
	const p = mesh.positions, [x, y] = point;
	for (const t of trianglesNear(mesh, [point])) {
		const ids = Array.from(mesh.part.indices.slice(t, t + 3)), [a, b, c] = ids.map((i) => i * 2), ux = p[b] - p[a], uy = p[b + 1] - p[a + 1], vx = p[c] - p[a], vy = p[c + 1] - p[a + 1], det = ux * vy - uy * vx;
		if (Math.abs(det) < 1e-12) continue;
		const u = ((x - p[a]) * vy - (y - p[a + 1]) * vx) / det, v = (ux * (y - p[a + 1]) - uy * (x - p[a])) / det, w = 1 - u - v;
		if (Math.min(w, u, v) >= -1e-8) return {
			triangle: ids,
			weights: [
				w,
				u,
				v
			]
		};
	}
	return null;
}
/** Union of both meshes' affine breakpoints along each original unit edge.
* Endpoint-only or midpoint-only sampling can miss a narrow reopened triangle. */
function edgePoints(a, b, meshes) {
	const axis = a[0] === b[0] ? 0 : 1, along = 1 - axis, start = a[along], span = b[along] - start, values = [0, 1];
	for (const mesh of meshes) for (const t of trianglesNear(mesh, [
		a,
		b,
		[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
	])) for (let e = 0; e < 3; e++) {
		const ia = mesh.part.indices[t + e] * 2, ib = mesh.part.indices[t + (e + 1) % 3] * 2, p = mesh.positions, d = p[ib + axis] - p[ia + axis];
		if (Math.abs(d) < 1e-12) {
			if (Math.abs(p[ia + axis] - a[axis]) < 1e-8) for (const i of [ia, ib]) {
				const v = (p[i + along] - start) / span;
				if (v >= -1e-8 && v <= 1 + 1e-8) values.push(Math.max(0, Math.min(1, v)));
			}
			continue;
		}
		const u = (a[axis] - p[ia + axis]) / d;
		if (u < -1e-8 || u > 1 + 1e-8) continue;
		const v = (p[ia + along] + u * (p[ib + along] - p[ia + along]) - start) / span;
		if (v >= -1e-8 && v <= 1 + 1e-8) values.push(Math.max(0, Math.min(1, v)));
	}
	values.sort((x, y) => x - y);
	return values.filter((v, i) => !i || v - values[i - 1] > 1e-9).map((v) => [a[0] + (b[0] - a[0]) * v, a[1] + (b[1] - a[1]) * v]);
}
function createSourceJoinProbe({ record, binding, atlas, remainderPartId }) {
	need$5(binding?.recordRecipeHash === record?.recipeHash && binding.paintSkin, "record / paint skin binding");
	const { width, height } = record.geometry, parts = binding.parts.filter((p) => p.kind === "part"), skin = binding.paintSkin;
	need$5([width, height].every((n) => Number.isInteger(n) && n > 0 && n <= 2048), "source dimensions");
	need$5(atlas?.rgba?.length === atlas.width * atlas.height * 4 && atlas.width === binding.atlasSize.width && atlas.height === binding.atlasSize.height, "atlas dimensions");
	const family = familyContractForRecord({
		...record,
		template: record.template ?? { id: "quadruped" }
	});
	const byId = new Map(parts.map((p) => [p.id, p])), declared = new Map(parts.map((p) => [p.joint, p.id])), parent = new Map(family.graph), joints = new Set(family.joints);
	need$5(byId.size === parts.length && declared.size === parts.length && parts.every((p) => joints.has(p.joint)), "unique known source owners");
	const remainder = remainderPartId ?? binding.sourceJoinTopology?.remainderPartId ?? (family.id === "quadruped" ? parts.find((p) => p.joint === "spine")?.id : void 0);
	need$5(byId.has(remainder), "explicit family remainder owner required");
	const ownerAtJoint = (j) => {
		if (!j) return null;
		if (declared.has(j)) return declared.get(j);
		if (j === "root" || j === "pelvis") return remainder;
		return ownerAtJoint(parent.get(j));
	};
	const nearest = (p) => ownerAtJoint(parent.get(p.joint));
	const ancestor = (a, d) => {
		for (let j = parent.get(d.joint); j; j = parent.get(j)) if (ownerAtJoint(j) === a.id) return true;
		return false;
	};
	const owner = new Uint16Array(width * height), meshes = /* @__PURE__ */ new Map();
	for (const [k, p] of parts.entries()) {
		const b = p.cutout, f = p.frame, part = skin.parts.find((q) => q.id === p.id);
		need$5(part && b.width === f.width && b.height === f.height, "native part mesh/frame " + p.id);
		need$5([
			b.x,
			b.y,
			b.width,
			b.height,
			f.x,
			f.y,
			f.width,
			f.height
		].every(Number.isInteger) && b.x >= 0 && b.y >= 0 && b.x + b.width <= width && b.y + b.height <= height && f.x >= 0 && f.y >= 0 && f.x + f.width <= atlas.width && f.y + f.height <= atlas.height, "source frame bounds");
		meshes.set(p.id, meshSource(part, skin));
		for (let y = 0; y < b.height; y++) for (let x = 0; x < b.width; x++) if (atlas.rgba[((f.y + y) * atlas.width + f.x + x) * 4 + 3] !== 0) {
			const i = (b.y + y) * width + b.x + x;
			need$5(owner[i] === 0, "overlapping base ink");
			owner[i] = k + 1;
		}
	}
	const joins = /* @__PURE__ */ new Map(), excluded = /* @__PURE__ */ new Map();
	const sampleEdge = (row, edge, a, d) => {
		for (const point of edgePoints(...edge, [meshes.get(a.id), meshes.get(d.id)])) {
			const key = point.map((v) => v.toFixed(9)).join(",");
			if (row.seen.has(key)) continue;
			row.seen.add(key);
			const ap = barycentric(meshes.get(a.id), point), dp = barycentric(meshes.get(d.id), point);
			need$5(ap && dp, "source attachment absent from mesh " + row.name + " at " + point.join(","));
			row.samples.push({
				source: point,
				ancestor: ap,
				descendant: dp
			});
		}
	};
	const visit = (i, j, edge) => {
		if (!owner[i] || !owner[j] || owner[i] === owner[j]) return;
		let a = parts[owner[i] - 1], d = parts[owner[j] - 1];
		if (nearest(a) === d.id) [a, d] = [d, a];
		const nearestAttachment = nearest(d) === a.id, proximal = family.id === "quadruped" && proximalSkin(a, d);
		if (!nearestAttachment && proximal && upperJoint(a.joint)) [a, d] = [d, a];
		if (!nearestAttachment && !proximal) {
			const ids = [a.id, d.id].sort(), kind = ancestor(a, d) || ancestor(d, a) ? "non-nearest ancestral silhouette adjacency" : "independent sibling adjacency", key = ids.join("|");
			a = byId.get(ids[0]);
			d = byId.get(ids[1]);
			if (!excluded.has(key)) excluded.set(key, {
				name: key,
				parts: ids,
				reason: kind,
				ancestorPart: a.id,
				descendantPart: d.id,
				sourceEdges: 0,
				samples: [],
				seen: /* @__PURE__ */ new Set()
			});
			const row = excluded.get(key);
			row.sourceEdges++;
			sampleEdge(row, edge, a, d);
			return;
		}
		const key = a.id + "--" + d.id;
		if (!joins.has(key)) joins.set(key, {
			name: key,
			rule: nearestAttachment ? "nearest anatomical attachment" : "proximal body-skin attachment",
			ancestorPart: a.id,
			descendantPart: d.id,
			ancestorJoint: a.joint,
			descendantJoint: d.joint,
			sourceEdges: [],
			samples: [],
			seen: /* @__PURE__ */ new Set()
		});
		const join = joins.get(key);
		join.sourceEdges.push(edge);
		sampleEdge(join, edge, a, d);
	};
	for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
		const i = y * width + x;
		if (x + 1 < width) visit(i, i + 1, [[x + 1, y], [x + 1, y + 1]]);
		if (y + 1 < height) visit(i, i + width, [[x, y + 1], [x + 1, y + 1]]);
	}
	need$5(joins.size > 0, "empty attachment inventory");
	const result = [...joins.values()].sort((a, b) => a.name.localeCompare(b.name)).map(({ seen, ...join }) => join);
	return {
		schema: "cf.source-join-continuity/v1",
		recordRecipeHash: record.recipeHash,
		bindingHash: binding.bindingHash,
		atlasSha256: binding.atlasSha256,
		width,
		height,
		epsilonNativePx: 8 * Math.pow(2, -23) * Math.max(width, height),
		epsilonReason: "Eight Float32 ulps at the native image extent cover published-buffer rounding, not a visible-pixel allowance.",
		parts: parts.map((p) => ({
			id: p.id,
			vertexCount: meshes.get(p.id).part.vertices.length
		})),
		joins: result,
		excluded: [...excluded.values()].sort((a, b) => a.parts.join("|").localeCompare(b.parts.join("|"))).map(({ seen, ...row }) => row),
		scope: "Nearest anatomical attachments and proximal limb-to-axial body-skin attachments, independently enumerated from every nonzero source-alpha edge. Distinct limb-to-limb and distal limb-to-body silhouette boundaries are observation-only; they are not required welds."
	};
}
function assessSourceJoinContinuity(probe, positionsByPart) {
	const buffers = /* @__PURE__ */ new Map();
	for (const part of probe.parts) {
		const p = positionsByPart instanceof Map ? positionsByPart.get(part.id) : positionsByPart?.[part.id];
		need$5(p?.length === part.vertexCount * 2 && Array.from(p).every(Number.isFinite), "published mesh " + part.id);
		buffers.set(part.id, p);
	}
	const at = (part, sample) => {
		const p = buffers.get(part);
		let x = 0, y = 0;
		for (let k = 0; k < 3; k++) {
			x += p[sample.triangle[k] * 2] * sample.weights[k] * probe.width;
			y += p[sample.triangle[k] * 2 + 1] * sample.weights[k] * probe.height;
		}
		return [x, y];
	};
	const measure = (join) => {
		let maxGapPx = 0, worst = null, violations = 0;
		for (const sample of join.samples) {
			const a = at(join.ancestorPart, sample.ancestor), d = at(join.descendantPart, sample.descendant), gap = Math.hypot(d[0] - a[0], d[1] - a[1]);
			if (gap > probe.epsilonNativePx) violations++;
			if (gap > maxGapPx) {
				maxGapPx = gap;
				worst = {
					source: sample.source,
					ancestor: a,
					descendant: d
				};
			}
		}
		return {
			name: join.name,
			rule: join.rule,
			ancestorJoint: join.ancestorJoint,
			descendantJoint: join.descendantJoint,
			sourceEdges: typeof join.sourceEdges === "number" ? join.sourceEdges : join.sourceEdges.length,
			samples: join.samples.length,
			maxGapPx,
			violations,
			worst,
			status: violations ? "GAP" : "CONTINUOUS"
		};
	};
	const rows = probe.joins.map(measure), excluded = probe.excluded.map((join) => ({
		...measure(join),
		parts: join.parts,
		reason: join.reason,
		status: "OBSERVATION_ONLY"
	}));
	return {
		schema: probe.schema,
		units: "native cut-out pixels",
		epsilonNativePx: probe.epsilonNativePx,
		epsilonReason: probe.epsilonReason,
		sourceEdges: rows.reduce((n, r) => n + r.sourceEdges, 0),
		samples: rows.reduce((n, r) => n + r.samples, 0),
		maxGapPx: Math.max(...rows.map((r) => r.maxGapPx)),
		joins: rows,
		excluded,
		status: rows.some((r) => r.violations) ? "FAIL" : "PASS",
		scope: probe.scope
	};
}
//#endregion
//#region port/v2/tools/creature-animation/seam-sampling-guard.mjs
/** One-texel sampling guard on opaque sewn interiors. The original atlas is
* immutable. Geometry, source alpha, depth and paint ownership remain unchanged:
* this plan only supplies the adjacent owner's original opaque pixel to the
* transparent/filter-padding side of a verified common skin boundary. */
const need$4 = (ok, why) => {
	if (!ok) throw Error("Seam sampling guard: " + why);
};
function fieldBasis(part, sample) {
	const result = /* @__PURE__ */ new Map();
	sample.triangle.forEach((index, i) => {
		const vertex = part.vertices[index];
		vertex.triangle.forEach((source, j) => {
			const value = sample.weights[i] * vertex.barycentric[j];
			result.set(source, (result.get(source) ?? 0) + value);
		});
	});
	return result;
}
function basisDifference(a, b) {
	let max = 0;
	for (const key of /* @__PURE__ */ new Set([...a.keys(), ...b.keys()])) max = Math.max(max, Math.abs((a.get(key) ?? 0) - (b.get(key) ?? 0)));
	return max;
}
function createOpaqueSeamSamplingGuard({ record, binding, atlas }) {
	const probe = createSourceJoinProbe({
		record,
		binding,
		atlas
	}), { width: w, height: h } = record.geometry, aw = atlas.width, ah = atlas.height;
	const parts = binding.parts.filter((p) => p.kind === "part"), byId = new Map(parts.map((p) => [p.id, p])), skinParts = new Map(binding.paintSkin.parts.map((p) => [p.id, p]));
	const sourceOwner = new Int16Array(w * h).fill(-1), atlasFrameOwner = new Int16Array(aw * ah).fill(-1), sourcePixels = new Uint8Array(w * h * 4);
	for (const [index, p] of binding.parts.entries()) {
		const f = p.frame;
		for (let y = 0; y < f.height; y++) for (let x = 0; x < f.width; x++) {
			const q = (f.y + y) * aw + f.x + x;
			need$4(atlasFrameOwner[q] === -1, "overlapping atlas frames");
			atlasFrameOwner[q] = index;
		}
	}
	for (const [index, p] of parts.entries()) {
		const f = p.frame, b = p.cutout;
		for (let y = 0; y < b.height; y++) for (let x = 0; x < b.width; x++) {
			const source = (b.y + y) * w + b.x + x, q = ((f.y + y) * aw + f.x + x) * 4;
			if (!atlas.rgba[q + 3]) continue;
			need$4(sourceOwner[source] === -1, "overlapping source owners");
			sourceOwner[source] = index;
			sourcePixels.set(atlas.rgba.subarray(q, q + 4), source * 4);
		}
	}
	const writes = /* @__PURE__ */ new Map(), rows = [];
	let opaqueEdges = 0;
	const add = (receiver, donorIndex, sx, sy) => {
		if (sx < 0 || sy < 0 || sx >= w || sy >= h) return;
		const source = sy * w + sx;
		if (sourceOwner[source] !== donorIndex || sourcePixels[source * 4 + 3] !== 255) return;
		const b = receiver.cutout, f = receiver.frame, x = f.x + sx - b.x, y = f.y + sy - b.y;
		need$4(x >= 0 && y >= 0 && x < aw && y < ah, "insufficient atlas padding at " + receiver.id);
		need$4(x >= f.x - 1 && y >= f.y - 1 && x <= f.x + f.width && y <= f.y + f.height, "guard exceeds one texel");
		const target = y * aw + x, frameOwner = atlasFrameOwner[target], receiverFrame = binding.parts.indexOf(receiver);
		need$4(frameOwner === -1 || frameOwner === receiverFrame, "guard touches another atlas frame");
		if (frameOwner === receiverFrame) need$4(atlas.rgba[target * 4 + 3] === 0, "guard would overwrite original owned ink");
		const rgba = Array.from(sourcePixels.subarray(source * 4, source * 4 + 4)), existing = writes.get(target);
		need$4(!existing || existing.partId === receiver.id && existing.rgba.every((n, i) => n === rgba[i]), "conflicting atlas padding guards");
		writes.set(target, {
			x,
			y,
			rgba,
			partId: receiver.id,
			source: [sx, sy]
		});
	};
	for (const join of probe.joins) {
		const a = byId.get(join.ancestorPart), d = byId.get(join.descendantPart), ai = parts.indexOf(a), di = parts.indexOf(d);
		let maxBasisDifference = 0, count = 0;
		for (const sample of join.samples) maxBasisDifference = Math.max(maxBasisDifference, basisDifference(fieldBasis(skinParts.get(a.id), sample.ancestor), fieldBasis(skinParts.get(d.id), sample.descendant)));
		need$4(maxBasisDifference <= 1e-7, "unshared skin field at " + join.name + " (" + maxBasisDifference + ")");
		for (const [start, end] of join.sourceEdges) {
			const vertical = start[0] === end[0], px = vertical ? start[0] - 1 : start[0], py = vertical ? start[1] : start[1] - 1, qx = vertical ? start[0] : start[0], qy = vertical ? start[1] : start[1], p = py * w + px, q = qy * w + qx;
			if (sourcePixels[p * 4 + 3] !== 255 || sourcePixels[q * 4 + 3] !== 255) continue;
			need$4(sourceOwner[p] === ai && sourceOwner[q] === di || sourceOwner[p] === di && sourceOwner[q] === ai, "source edge owner changed");
			count++;
			opaqueEdges++;
			for (const [x, y] of [[px, py], [qx, qy]]) {
				const receiverIndex = sourceOwner[y * w + x], receiver = parts[receiverIndex], donorIndex = receiverIndex === ai ? di : ai;
				for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (dx || dy) add(receiver, donorIndex, x + dx, y + dy);
			}
		}
		rows.push({
			name: join.name,
			rule: join.rule,
			opaqueEdges: count,
			maxBasisDifference
		});
	}
	const pixels = [...writes.values()].sort((a, b) => a.y - b.y || a.x - b.x);
	return {
		pixels,
		receipt: {
			schema: "cf.opaque-seam-sampling-guard/v1",
			sourceAtlasSha256: binding.atlasSha256,
			bindingHash: binding.bindingHash,
			guardTexels: pixels.length,
			opaqueEdges,
			joins: rows,
			policy: "Decode-time copies of exact opaque adjacent-owner RGBA in a one-texel ring at independently enumerated shared-field skin joins; original bytes, geometry, silhouettes, nonopaque pixels and distinct-limb/depth boundaries remain unchanged."
		}
	};
}
const need$3 = (ok, reason) => {
	if (!ok) throw Error("Skeleton pose: " + reason);
};
const nameIsSafe = (name) => typeof name === "string" && /^[A-Za-z][A-Za-z0-9]*$/.test(name) && ![
	"constructor",
	"prototype",
	"__proto__"
].includes(name);
function createSkeletonPoseProgram(definition, landmarks) {
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
	const pivots = names.map((_, i) => points[parents[i] ?? "root"]);
	const index = new Map(names.map((n, i) => [n, i]));
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
				const local = key ? rotationAround(pivots[i], key.rotation, {
					x: (key.dx ?? 0) * bodyLength,
					y: (key.dy ?? 0) * bodyLength
				}) : IDENTITY_AFFINE;
				matrices[name] = parent ? composeAffine(matrices[parent], local) : local;
			}
			return matrices;
		}
	});
}
//#endregion
//#region port/v2/tools/creature-animation/family-record.mjs
/** Family-specific admission shared by offline intake and the actual Pixi loader.
* No family guessing, skeleton fitting, missing-joint synthesis or clip overrides. */
const need$2 = (ok, reason) => {
	if (!ok) throw Error("Family admission: " + reason);
};
const distance = (j, axis) => Math.hypot(j[axis[1]][0] - j[axis[0]][0], j[axis[1]][1] - j[axis[0]][1]);
function measureFamilyBounds(template, landmarks) {
	const bones = Object.fromEntries(template.graph.map(([child, parent]) => [child, distance(landmarks, [parent, child])]));
	return {
		boneLengths: bones,
		measures: Object.fromEntries(template.bounds.map((b) => [b.id, b.kind === "bone-min" ? Math.min(...Object.values(bones)) : b.kind === "bone-max" ? Math.max(...Object.values(bones)) : b.kind === "distance" ? distance(landmarks, b.axis) : b.bones.reduce((sum, name) => sum + bones[name], 0) / distance(landmarks, b.axis)]))
	};
}
function checkFamilyGeometry(record, alpha) {
	if (record?.template?.id === "quadruped") return checkGeometry(record, alpha);
	const template = familyContractForRecord(record);
	need$2(record.kind === template.id && record.template.version === template.version, "unsupported body or template version");
	need$2(record.clipSetId === template.clipSetId && !Object.hasOwn(record, "clipOverrides"), "shared clip set required");
	const { width: w, height: h, groundLineY, depthLayers } = record.geometry ?? {};
	need$2([w, h].every((n) => Number.isInteger(n) && n >= 128 && n <= 2048), "input dimensions");
	createSkeletonPoseProgram(template, record.landmarks);
	need$2(Number.isFinite(groundLineY) && groundLineY > 0 && groundLineY <= 1, "ground line");
	need$2(Array.isArray(depthLayers) && depthLayers.length === 2 && depthLayers.every((v, i) => v.id === ["far", "near"][i] && v.order === i), "two depth layers");
	const result = measureFamilyBounds(template, record.landmarks);
	for (const bound of template.bounds) {
		const value = result.measures[bound.id];
		need$2(Number.isFinite(value) && value >= bound.min && value <= bound.max, "proportion bound: " + bound.id);
	}
	if (alpha !== void 0) {
		need$2(alpha instanceof Uint8Array && alpha.length === w * h, "alpha dimensions");
		const radius = Math.ceil(Math.max(w, h) * .012);
		for (const name of template.joints) {
			const p = record.landmarks[name], x = Math.round(p[0] * w), y = Math.round(p[1] * h);
			let found = false;
			for (let dy = -radius; dy <= radius && !found; dy++) for (let dx = -radius; dx <= radius; dx++) {
				const xx = x + dx, yy = y + dy;
				if (xx >= 0 && yy >= 0 && xx < w && yy < h && alpha[yy * w + xx] > 12) {
					found = true;
					break;
				}
			}
			need$2(found, "landmark outside painted alpha: " + name);
		}
	}
	return {
		inside: true,
		clamped: [],
		...result
	};
}
async function admitFamilyRecord(record, cutoutBytes, alpha) {
	const template = familyContractForRecord(record);
	if (template.id === "quadruped") {
		await admitRecord(record, cutoutBytes, alpha);
		return template;
	}
	const { recipeHash, ...body } = record;
	need$2(typeof recipeHash === "string" && await hashJSON(body) === recipeHash, "corrupted landmark / recipe hash");
	need$2(await hashBytes(cutoutBytes) === record.geometry?.cutoutAssetHash, "mismatched cut-out hash");
	const identity = record.identity;
	need$2(identity && typeof identity.speciesVisualKey === "string" && identity.speciesVisualKey.length > 5 && Number.isInteger(identity.seed) && typeof identity.ownerId === "string" && identity.ownerId.length > 0, "identity");
	need$2(record.materials && typeof record.materials.surface === "string" && record.materials.surface.length > 0, "painter material required");
	need$2(stableJSON(checkFamilyGeometry(record, alpha)) === stableJSON(record.boundsCheck), "stale bounds / lengths");
	return template;
}
//#endregion
//#region port/v2/apps/game/src/creature-rig.ts
const rigRuntimeDiagnostics = /* @__PURE__ */ new WeakMap();
const requireValue = (ok, reason) => {
	if (!ok) throw Error("Creature rig: " + reason);
};
const validBox = (box, w, h) => box && [
	box.x,
	box.y,
	box.width,
	box.height
].every(Number.isInteger) && box.x >= 0 && box.y >= 0 && box.width > 0 && box.height > 0 && box.x + box.width <= w && box.y + box.height <= h;
const shaPattern = /^[a-f0-9]{64}$/;
async function decodeAtlasPng(bytes) {
	const copy = new Uint8Array(bytes.length);
	copy.set(bytes);
	const bitmap = await createImageBitmap(new Blob([copy.buffer], { type: "image/png" }));
	return Texture.from(bitmap);
}
/** Preserve the original decode and write only opaque internal guard texels.
* In particular, never get/put the whole translucent atlas through ImageData. */
async function decodeGuardedAtlasPng(bytes, record, binding) {
	const copy = new Uint8Array(bytes.length);
	copy.set(bytes);
	const bitmap = await createImageBitmap(new Blob([copy.buffer], { type: "image/png" }));
	try {
		requireValue(bitmap.width === binding.atlasSize.width && bitmap.height === binding.atlasSize.height, "decoded atlas dimensions");
		const canvas = new OffscreenCanvas(bitmap.width, bitmap.height), context = canvas.getContext("2d");
		requireValue(context, "atlas sampling guard context");
		context.drawImage(bitmap, 0, 0);
		const original = context.getImageData(0, 0, bitmap.width, bitmap.height).data;
		const plan = createOpaqueSeamSamplingGuard({
			record,
			binding,
			atlas: {
				rgba: original,
				width: bitmap.width,
				height: bitmap.height
			}
		});
		for (let first = 0; first < plan.pixels.length;) {
			let end = first + 1;
			const start = plan.pixels[first];
			while (end < plan.pixels.length && plan.pixels[end].y === start.y && plan.pixels[end].x === plan.pixels[end - 1].x + 1) end++;
			const data = new Uint8ClampedArray((end - first) * 4);
			for (let i = first; i < end; i++) data.set(plan.pixels[i].rgba, (i - first) * 4);
			context.putImageData(new ImageData(data, end - first, 1), start.x, start.y);
			first = end;
		}
		const derived = await createImageBitmap(canvas);
		return {
			texture: Texture.from(derived),
			samplingGuard: plan.receipt
		};
	} finally {
		bitmap.close();
	}
}
/** Hash admission precedes image decode and Pixi allocation. The decoder owns a
* new atlas texture; dispose releases it, never the accepted source master. */
async function loadCreatureRigV1(recordInput, bindingInput, cutoutBytes, cutoutAlpha, atlasBytes, decodeAtlas = decodeAtlasPng) {
	const record = structuredClone(recordInput), binding = structuredClone(bindingInput);
	const template = await admitFamilyRecord(record, cutoutBytes, cutoutAlpha);
	const joints = [...template.joints];
	requireValue(binding?.schema === "cf.creature-parts/v1", "unsupported parts schema");
	const { bindingHash, ...body } = binding;
	requireValue(shaPattern.test(bindingHash) && await hashJSON(body) === bindingHash, "corrupted part binding");
	requireValue(binding.recordRecipeHash === record.recipeHash, "parts belong to another record");
	requireValue(shaPattern.test(binding.atlasSha256) && await hashBytes(atlasBytes) === binding.atlasSha256, "mismatched atlas hash");
	const skeleton = createSkeletonPoseProgram(template, record.landmarks);
	const { width: w, height: h } = record.geometry, { width: aw, height: ah } = binding.atlasSize;
	requireValue([aw, ah].every((n) => Number.isInteger(n) && n > 0 && n <= 2048), "atlas budget");
	requireValue(binding.parts.length > 0 && binding.parts.length <= 40, "part budget");
	const ids = /* @__PURE__ */ new Set();
	for (const part of binding.parts) {
		requireValue(typeof part.id === "string" && part.id.length > 0 && !ids.has(part.id), "duplicate or empty part id");
		ids.add(part.id);
		requireValue(joints.includes(part.joint), "unknown part joint: " + part.joint);
		requireValue(part.layer === "far" || part.layer === "near", "unknown depth layer");
		requireValue(part.kind === "part" || part.kind === "joint-patch", "unknown part kind");
		requireValue(validBox(part.frame, aw, ah) && validBox(part.cutout, w, h), "part rectangle outside image");
	}
	requireValue(!(binding.paintSkin && binding.seamBridges), "one deformation owner");
	if (binding.paintSkin) {
		requireValue(binding.parts.every((p) => p.frame.width === p.cutout.width && p.frame.height === p.cutout.height), "paint skin requires native source frames");
		validatePaintSkin(binding.paintSkin, binding.parts, w, h, joints);
	}
	if (binding.seamBridges !== void 0) {
		requireValue(template.id === "quadruped", "legacy seam bridge ownership is quadruped-only; use family paint skin");
		requireValue(binding.seamBridges?.schema === "cf.seam-bridges/v1", "seam bridge schema");
		validateSeamBridges(binding.seamBridges.groups, binding.parts, w, h, binding.atlasSize, joints);
	}
	const skin = binding.paintSkin, field = skin ? new Float32Array(skin.vertices.length * 2) : null;
	const shape = skin?.solver ? createArapScratch(skin.vertices, skin.triangles, w, h, skin.solver) : null;
	const target = shape && field ? field.slice() : null;
	const compiledField = skin ? createCompiledSkinField(skin, w, h) : null;
	const atlas = (decodeAtlas === decodeAtlasPng && skin ? await decodeGuardedAtlasPng(atlasBytes.slice(), record, binding) : {
		texture: await decodeAtlas(atlasBytes.slice()),
		samplingGuard: void 0
	}).texture;
	if (atlas.width !== aw || atlas.height !== ah) {
		atlas.destroy(true);
		throw Error("Creature rig: decoded atlas dimensions");
	}
	const root = new Container(), far = new Container(), near = new Container();
	root.addChild(far, near);
	const textures = [];
	const bridgeGroups = new Map((binding.seamBridges?.groups ?? []).map((group) => [group.id, group]));
	const bridges = (binding.seamBridges?.groups ?? []).map((group) => {
		const part = binding.parts.find((p) => p.id === group.id);
		const buffers = createSeamGeometry(group, binding.parts, w, h, binding.atlasSize);
		const geometry = new MeshGeometry({
			positions: buffers.positions,
			uvs: buffers.uvs,
			indices: buffers.indices
		});
		const mesh = new Mesh({
			geometry,
			texture: atlas
		}), display = new Container();
		display.addChild(mesh);
		(group.layer === "far" ? far : near).addChild(display);
		return {
			group,
			part,
			buffers,
			geometry,
			display
		};
	});
	const skins = (skin?.parts ?? []).map((part) => {
		const source = binding.parts.find((p) => p.id === part.id), uvs = new Float32Array(part.vertices.length * 2), positions = uvs.slice(), pending = uvs.slice();
		part.vertices.forEach((v, i) => {
			const x = v.triangle.reduce((n, k, j) => n + skin.vertices[k].x * v.barycentric[j], 0), y = v.triangle.reduce((n, k, j) => n + skin.vertices[k].y * v.barycentric[j], 0);
			uvs[i * 2] = (source.frame.x + x - source.cutout.x) / aw;
			uvs[i * 2 + 1] = (source.frame.y + y - source.cutout.y) / ah;
		});
		const geometry = new MeshGeometry({
			positions,
			uvs,
			indices: new Uint32Array(part.indices)
		}), mesh = new Mesh({
			geometry,
			texture: atlas
		}), display = new Container();
		display.addChild(mesh);
		(source.layer === "far" ? far : near).addChild(display);
		return {
			part,
			source,
			geometry,
			positions,
			pending,
			display,
			areas: paintPartAreas(part, skin)
		};
	});
	const entries = binding.parts.filter((part) => !bridgeGroups.has(part.id) && !skin).map((part) => {
		const frame = part.frame, box = part.cutout, texture = new Texture({
			source: atlas.source,
			frame: new Rectangle(frame.x, frame.y, frame.width, frame.height)
		});
		textures.push(texture);
		const sprite = new Sprite(texture), display = new Container();
		sprite.position.set(box.x / w, box.y / h);
		sprite.scale.set(box.width / w / frame.width, box.height / h / frame.height);
		display.addChild(sprite);
		(part.layer === "far" ? far : near).addChild(display);
		return {
			part,
			display,
			pivot: skeleton.pivot(part.joint)
		};
	});
	let disposed = false;
	const parts = Object.freeze([
		...skins.map(({ source, display }) => Object.freeze({
			id: source.id,
			display,
			pivot: skeleton.pivot(source.joint),
			layer: source.layer
		})),
		...entries.map(({ part, display, pivot }) => Object.freeze({
			id: part.id,
			display,
			pivot,
			layer: part.layer
		})),
		...bridges.map(({ group, display }) => Object.freeze({
			id: group.id,
			display,
			pivot: skeleton.pivot(group.ancestorJoint),
			layer: group.layer
		}))
	]);
	const rig = Object.freeze({
		recipeHash: record.recipeHash,
		templateId: record.template.id,
		root,
		parts,
		bounds: Object.freeze({
			width: 1,
			height: 1,
			groundLineY: record.geometry.groundLineY
		}),
		applyPose(pose) {
			requireValue(!disposed, "disposed");
			const matrices = skeleton.evaluate(pose);
			if (skin && field && compiledField) {
				applyCompiledSkinField(compiledField, matrices, target ?? field);
				if (shape && target) solveArapSkin(shape, target, field);
				for (const entry of skins) {
					applyPaintPart(entry.part, field, entry.pending);
					assertPaintPartShape(entry.part, skin, entry.pending, w, h, entry.areas);
				}
			}
			for (const bridge of bridges) writeSeamPose(bridge.group, matrices, w, h, bridge.buffers.pending, bridge.part.cutout);
			for (const entry of skins) {
				entry.positions.set(entry.pending);
				entry.geometry.getBuffer("aPosition").update();
			}
			for (const entry of entries) entry.display.setFromMatrix(new Matrix(...matrices[entry.part.joint]));
			for (const bridge of bridges) {
				bridge.buffers.positions.set(bridge.buffers.pending);
				bridge.geometry.getBuffer("aPosition").update();
			}
		},
		dispose() {
			if (disposed) return;
			disposed = true;
			root.destroy({ children: true });
			for (const entry of skins) entry.geometry.destroy();
			for (const bridge of bridges) bridge.geometry.destroy();
			for (const texture of textures) texture.destroy(false);
			atlas.destroy(true);
		}
	});
	rigRuntimeDiagnostics.set(rig, Object.freeze({
		schema: "cf.creature-rig-runtime/v1",
		sweepBackend: shape?.sweepBackend ?? "none",
		fieldVertices: skin?.vertices.length ?? 0,
		get normalPasses() {
			return shape?.normalPasses ?? 0;
		},
		get robustFallbacks() {
			return shape?.robustFallbacks ?? 0;
		}
	}));
	return rig;
}
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
const PLANT_TEMPLATE_IDS = Object.freeze(["plant-woody", "plant-herb"]);
const dist$1 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const need$1 = (v, what) => {
	if (v === void 0) throw new Error("template bound: " + what);
	return v;
};
/** A linear chain parent→names[0]→names[1]… */
const chain = (parent, names) => names.map((n, i) => [n, i === 0 ? parent : names[i - 1]]);
const seq = (prefix, n, parent) => chain(parent, Array.from({ length: n }, (_, i) => prefix + i));
const sides = ["Far", "Near"];
const F = (x) => Object.freeze(x);
const boneBounds = () => [{
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
const axisBound = (a, b, min = .06, max = .85) => ({
	id: "body",
	min,
	max,
	measure: (lm) => dist$1(need$1(lm[a], a), need$1(lm[b], b))
});
const ratioBound = (id, joints, a, b, min, max) => ({
	id,
	min,
	max,
	measure: (lm, bones) => joints.reduce((s, j) => s + need$1(bones[j], j), 0) / dist$1(need$1(lm[a], a), need$1(lm[b], b))
});
const sec = (id, kind, driver, joints) => F({
	id,
	kind,
	driver,
	joints: F(joints)
});
const build = (s) => {
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
const QUAD_LEGS = [
	"hindFar",
	"foreFar",
	"hindNear",
	"foreNear"
];
const HOPPER$1 = build({
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
const birdLegs = sides.map((s) => "leg" + s);
const BIRD$1 = build({
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
Array.from({ length: 6 }, (_, i) => "spine" + i);
const FISH$1 = build({
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
const insectLegs = [
	"Front",
	"Mid",
	"Hind"
].flatMap((p) => sides.map((s) => "leg" + p + s));
const INSECT$1 = build({
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
const SERPENT$1 = build({
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
const arachnidLegs = [
	1,
	2,
	3,
	4
].flatMap((n) => sides.map((s) => "leg" + n + s));
const ARACHNID$1 = build({
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
const arms = [
	0,
	1,
	2,
	3,
	4,
	5
].map((n) => "arm" + n);
const RADIAL$1 = build({
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
const myriaPairs = [
	"legA",
	"legB",
	"legC",
	"legD"
];
const myriaLegs = myriaPairs.flatMap((p) => sides.map((s) => p + s));
const MYRIAPOD$1 = build({
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
const cephArms = [
	0,
	1,
	2,
	3,
	4,
	5,
	6,
	7
].map((n) => "arm" + n);
const CEPHALOPOD$1 = build({
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
const batWings = sides.map((s) => "wing" + s);
const batLegs = sides.map((s) => "leg" + s);
const FLYER$1 = build({
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
const primArms = sides.map((s) => "arm" + s);
const primLegs = sides.map((s) => "leg" + s);
const PRIMATE$1 = build({
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
const branches = [
	0,
	1,
	2
].map((n) => "branch" + n);
const WOODY$1 = build({
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
const stems = [
	0,
	1,
	2,
	3
].map((n) => "stem" + n);
const FAMILY_TEMPLATES = F({
	hopper: HOPPER$1,
	"biped-bird": BIRD$1,
	fish: FISH$1,
	insect: INSECT$1,
	serpent: SERPENT$1,
	arachnid: ARACHNID$1,
	radial: RADIAL$1,
	"plant-woody": WOODY$1,
	"plant-herb": build({
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
	}),
	myriapod: MYRIAPOD$1,
	cephalopod: CEPHALOPOD$1,
	"flyer-membrane": FLYER$1,
	primate: PRIMATE$1
});
/** Painter family / rig family / flora architecture → template. Unlisted families have no motion library (whole-portrait fallback). */
const TEMPLATE_BY_FAMILY = F({
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
	marine: "fish",
	insect: "insect",
	arachnid: "arachnid",
	crust: "arachnid",
	snake: "serpent",
	serpent: "serpent",
	jelly: "radial",
	sessile: "radial",
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
const templateIdForFamily = (family) => TEMPLATE_BY_FAMILY[family.toLowerCase()] ?? null;
//#endregion
//#region port/v2/apps/game/src/motion/templates.ts
const QUADRUPED_LEGS = Object.freeze([
	"hindFar",
	"foreFar",
	"hindNear",
	"foreNear"
]);
const legGraph = (id) => [
	[id + "Root", id.startsWith("hind") ? "pelvis" : "chest"],
	[id + "Knee", id + "Root"],
	[id + "Ankle", id + "Knee"],
	[id + "Paw", id + "Ankle"]
];
const QUADRUPED_GRAPH = Object.freeze([
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
/** Joint limits in degrees, by bone family. Tunable; poses beyond are clamped and flagged. */
const LIMIT_TABLE = [
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
const limitFor = (joint) => LIMIT_TABLE.find(([re]) => re.test(joint))?.[1] ?? {
	min: -30,
	max: 30
};
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const need = (v, what) => {
	if (v === void 0) throw new Error("template bound: " + what);
	return v;
};
const QUADRUPED_TEMPLATE = Object.freeze({
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
const REGISTRY = Object.freeze({
	quadruped: QUADRUPED_TEMPLATE,
	...FAMILY_TEMPLATES
});
const KNOWN_TEMPLATE_IDS = Object.freeze(Object.keys(REGISTRY));
/** Kit §3: an unsupported template compiles to the labelled whole-portrait fallback. */
function resolveTemplate(id, version = 1) {
	const t = REGISTRY[id];
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
const isMotionFallback = (x) => typeof x === "object" && x !== null && x.kind === "whole-portrait";
Math.PI * 2;
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
//#endregion
//#region port/v2/apps/game/src/motion/timing.ts
const MASS_CLASS = Object.freeze({
	tiny: .7,
	small: .85,
	medium: 1,
	large: 1.2,
	huge: 1.4,
	titanic: 1.6
});
/** FA_SIZE index 0..5 → kit mass class. */
const MASS_BY_SIZE_INDEX = Object.freeze([
	"tiny",
	"small",
	"medium",
	"large",
	"huge",
	"titanic"
]);
const SCALE_MIN = .6;
const SMEAR_FRAME_MS = 1e3 / 60;
Object.freeze({
	desktop: 60,
	phone: 30
});
/** Ordered phases per action (kit §5). `feed` and `tame` are A1 defaults, not kit rows. */
const ACTION_PHASES = Object.freeze({
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
const HITSTOP = Object.freeze({
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
const IDLE_PERIOD = Object.freeze({
	minMs: 2600,
	maxMs: 3400
});
/** Mass-scaled duration, bounded to 60%..200% of base. */
function scaleMs(baseMs, mass) {
	return Math.min(Math.max(baseMs * mass, baseMs * SCALE_MIN), baseMs * 2);
}
/** Scaled by the ATTACKER's mass, capped at 140 (applies to both combatants). */
const hitstopMs = (attackerMass) => Math.min(HITSTOP.baseMs * attackerMass, HITSTOP.capMs);
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
Object.freeze([
	"ease-out",
	"ease-in",
	"back-out",
	"sine-in-out"
]);
const P$1 = (t, ease, joints, dx = 0, dy = 0) => ({
	t,
	ease,
	joints,
	root: {
		dx,
		dy
	}
});
const REST$1 = {};
/** Upper legs (Knee bones) and lower legs (Ankle bones): fore/hind swing, +back / -forward. */
const legs = (foreFar, hindFar, foreNear = foreFar, hindNear = hindFar, bend = 0) => ({
	foreFarKnee: foreFar,
	foreNearKnee: foreNear,
	hindFarKnee: hindFar,
	hindNearKnee: hindNear,
	foreFarAnkle: -bend,
	foreNearAnkle: -bend,
	hindFarAnkle: bend,
	hindNearAnkle: bend
});
const crouch = (depth) => ({
	...legs(-depth * .4, depth * .5, -depth * .4, depth * .5, depth),
	spine: depth * .3,
	tail0: -depth * .3
});
const ears$1 = (deg) => ({
	earFarTip: deg,
	earNearTip: deg
});
const strideA = (amp, bend) => ({ ...legs(-amp, amp, amp, -amp, bend) });
const strideB = (amp, bend) => ({ ...legs(amp, -amp, -amp, amp, bend) });
const gaitCycle = (id) => {
	if (id === "walk") return [
		P$1(.25, "sine-in-out", strideA(18, 8), 0, -.01),
		P$1(.5, "sine-in-out", { ...legs(0, 0, 0, 0, 14) }, 0, .004),
		P$1(.75, "sine-in-out", strideB(18, 8), 0, -.01),
		P$1(1, "sine-in-out", REST$1)
	];
	if (id === "trot") return [
		P$1(.25, "sine-in-out", {
			...strideA(26, 12),
			spine: -3,
			neck: -4
		}, 0, -.022),
		P$1(.5, "sine-in-out", {
			...legs(0, 0, 0, 0, 18),
			spine: 2
		}, 0, .006),
		P$1(.75, "sine-in-out", {
			...strideB(26, 12),
			spine: -3,
			neck: -4
		}, 0, -.022),
		P$1(1, "sine-in-out", REST$1)
	];
	if (id === "gallop") return [
		P$1(.2, "ease-in", {
			...legs(20, -20, 24, -24, 24),
			spine: 10,
			chest: 6,
			neck: 6,
			tail0: 12
		}, 0, .02),
		P$1(.45, "ease-out", {
			...legs(-36, 34, -30, 30, 4),
			spine: -12,
			chest: -6,
			neck: -10,
			head: -6,
			tail0: -14
		}, 0, -.08),
		P$1(.7, "ease-in", {
			...legs(20, -20, 24, -24, 24),
			spine: 10,
			chest: 6,
			neck: 6,
			tail0: 12
		}, 0, .02),
		P$1(.95, "ease-out", {
			...legs(-36, 34, -30, 30, 4),
			spine: -12,
			chest: -6,
			neck: -10,
			head: -6,
			tail0: -14
		}, 0, -.08),
		P$1(1, "ease-out", REST$1)
	];
	return [
		P$1(.3, "ease-in", {
			...crouch(36),
			head: 8
		}, 0, .04),
		P$1(.65, "ease-out", {
			...legs(-30, 34, -30, 34, 0),
			spine: -6,
			neck: -8,
			tail0: -10
		}, 0, -.14),
		P$1(1, "back-out", { ...crouch(16) }, 0, .016)
	];
};
/** Melee: anticipation crouch → launch → strike (one-frame smear) → recover. */
const meleeFor = (strike, launch = {}, anticipation = {}) => {
	const m = "melee";
	return [
		P$1(tAt(m, "anticipation"), "ease-in", {
			...crouch(30),
			spine: 12,
			neck: 8,
			head: 10,
			...anticipation
		}, -.04, .03),
		P$1(tAt(m, "strike"), "ease-out", {
			...legs(-30, 30, -30, 30, -10),
			spine: -6,
			neck: -10,
			head: -6,
			jaw: -10,
			tail0: -12,
			...launch
		}, .36, -.05),
		P$1(tAt(m, "smear"), "ease-out", {
			...legs(-30, 30, -30, 30, -10),
			spine: -2,
			head: 8,
			...strike
		}, .4, -.01),
		P$1(tAt(m, "recovery", .55), "back-out", {
			...crouch(10),
			head: 2
		}, .1, .01),
		P$1(1, "ease-out", REST$1)
	];
};
const QUADRUPED_ACTIONS = Object.freeze({
	idle: {
		id: "idle",
		family: "idle",
		loop: true,
		poses: [
			P$1(.25, "sine-in-out", {
				tail0: 4,
				tail1: 3,
				pelvis: 1
			}, .008, -.004),
			P$1(.5, "sine-in-out", {
				spine: -2,
				chest: -2,
				neck: -3,
				head: 1,
				...ears$1(-3)
			}, 0, -.011),
			P$1(.75, "sine-in-out", {
				tail0: -4,
				tail1: -3,
				pelvis: -1
			}, -.008, -.004),
			P$1(1, "sine-in-out", REST$1)
		]
	},
	alert: {
		id: "alert",
		family: "alert",
		loop: false,
		poses: [P$1(1, "back-out", {
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
			P$1(tAt("cast", "rise"), "ease-in", {
				pelvis: -5,
				spine: -18,
				chest: -15,
				neck: -12,
				...legs(-45, 10, -45, 10, 16),
				tail0: 8
			}, -.02, -.06),
			P$1(tAt("cast", "hold"), "sine-in-out", {
				pelvis: -5,
				spine: -18,
				chest: -15,
				neck: -14,
				head: -5,
				...legs(-42, 12, -48, 12, 16),
				tail0: 6,
				...ears$1(-8)
			}, -.02, -.064),
			P$1(tAt("cast", "release"), "ease-out", {
				spine: -10,
				chest: -6,
				neck: 10,
				head: 25,
				jaw: -15,
				...legs(-30, 20, -30, 20, 8)
			}, .06, -.03),
			P$1(1, "back-out", REST$1)
		]
	},
	hit: {
		id: "hit",
		family: "hit",
		loop: false,
		poses: [
			P$1(tAt("hit", "recoil"), "ease-out", {
				head: -20,
				neck: -12,
				spine: 6,
				chest: -6,
				pelvis: -4,
				jaw: -8,
				...ears$1(12),
				tail0: 10
			}, -.08, .02),
			P$1(tAt("hit", "stagger"), "ease-out", {
				head: -8,
				neck: -6,
				spine: 3,
				hindFarKnee: -12,
				hindFarAnkle: 18,
				foreNearKnee: 10,
				tail0: 6
			}, -.14, .012),
			P$1(1, "back-out", REST$1)
		]
	},
	dodge: {
		id: "dodge",
		family: "dodge",
		loop: false,
		poses: [P$1(tAt("dodge", "out"), "ease-out", {
			spine: -4,
			neck: -6,
			...legs(-12, 15, -12, 15, 6)
		}, -.25, -.04), P$1(1, "back-out", REST$1)]
	},
	faint: {
		id: "faint",
		family: "faint",
		loop: false,
		poses: [P$1(.45, "ease-in", {
			...crouch(40),
			head: 10,
			neck: 10
		}, 0, .1), P$1(1, "ease-out", {
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
			P$1(tAt("victory", "rear"), "ease-out", {
				pelvis: -6,
				spine: -20,
				chest: -12,
				neck: -8,
				head: -15,
				jaw: -10,
				...legs(-45, 12, -45, 12, 14),
				tail0: -12
			}, 0, -.08),
			P$1(tAt("victory", "toss"), "back-out", {
				pelvis: -6,
				spine: -20,
				chest: -12,
				neck: -12,
				head: -25,
				...legs(-40, 12, -50, 12, 14),
				tail0: -16,
				...ears$1(-15)
			}, 0, -.084),
			P$1(1, "back-out", REST$1)
		]
	},
	tame: {
		id: "tame",
		family: "tame",
		loop: false,
		poses: [
			P$1(tAt("tame", "approach"), "ease-out", {
				head: -6,
				...strideA(12, 6)
			}, .12, -.008),
			P$1(tAt("tame", "lower"), "ease-out", {
				neck: 20,
				head: 18,
				spine: 3,
				...ears$1(-10),
				tail0: 4
			}, .12, .02),
			P$1(1, "back-out", { head: 6 }, .12, .004)
		]
	},
	feed: {
		id: "feed",
		family: "feed",
		loop: false,
		poses: [
			P$1(tAt("feed", "down"), "ease-out", {
				neck: 25,
				head: 20,
				foreFarKnee: 5,
				foreNearKnee: 5
			}, .02, .012),
			P$1(tAt("feed", "chew", .5), "sine-in-out", {
				neck: 25,
				head: 20,
				jaw: -14,
				foreFarKnee: 5,
				foreNearKnee: 5
			}, .02, .012),
			P$1(tAt("feed", "chew"), "sine-in-out", {
				neck: 25,
				head: 20,
				jaw: -2,
				foreFarKnee: 5,
				foreNearKnee: 5
			}, .02, .012),
			P$1(tAt("feed", "chew2", .5), "sine-in-out", {
				neck: 25,
				head: 20,
				jaw: -14,
				foreFarKnee: 5,
				foreNearKnee: 5
			}, .02, .012),
			P$1(tAt("feed", "chew2"), "sine-in-out", {
				neck: 25,
				head: 20,
				jaw: -2,
				foreFarKnee: 5,
				foreNearKnee: 5
			}, .02, .012),
			P$1(1, "back-out", REST$1)
		]
	}
});
Object.freeze(Object.keys(QUADRUPED_ACTIONS));
const DEG = Math.PI / 180;
//#endregion
//#region port/v2/apps/game/src/motion/family-actions.ts
const cephArmsA = [
	0,
	1,
	2,
	3,
	4,
	5,
	6,
	7
].map((n) => "arm" + n);
const P = (t, ease, joints, dx = 0, dy = 0) => ({
	t,
	ease,
	joints,
	root: {
		dx,
		dy
	}
});
const REST = {};
const neg = (j, k = -1) => Object.fromEntries(Object.entries(j).map(([n, v]) => [n, v * k]));
const mul = (j, k) => neg(j, k);
const pair = (base, v, suffix = "") => ({
	[base + "Far" + suffix]: v,
	[base + "Near" + suffix]: v
});
const A = (id, family, poses, loop = false) => ({
	id,
	family,
	loop,
	poses
});
const loop4 = (a, mid, b, dxA = 0, dyA = 0, dyMid = 0) => [
	P(.25, "sine-in-out", a, dxA, dyA),
	P(.5, "sine-in-out", mid, 0, dyMid),
	P(.75, "sine-in-out", b, -dxA, dyA),
	P(1, "sine-in-out", REST)
];
const melee = (anticipation, launch, strike, recover, dx = [
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
	P(tAt("melee", "anticipation"), "ease-in", anticipation, dx[0], dy[0]),
	P(tAt("melee", "strike"), "ease-out", launch, dx[1], dy[1]),
	P(tAt("melee", "smear"), "ease-out", strike, dx[2], dy[2]),
	P(tAt("melee", "recovery", .55), "back-out", recover, dx[3], dy[3]),
	P(1, "ease-out", REST)
];
const cast = (rise, hold, release, dy = -.06) => [
	P(tAt("cast", "rise"), "ease-in", rise, -.02, dy),
	P(tAt("cast", "hold"), "sine-in-out", hold, -.02, dy - .004),
	P(tAt("cast", "release"), "ease-out", release, .06, dy * .5),
	P(1, "back-out", REST)
];
const hit = (recoil, stagger, dy = .02) => [
	P(tAt("hit", "recoil"), "ease-out", recoil, -.08, dy),
	P(tAt("hit", "stagger"), "ease-out", stagger, -.14, dy * .6),
	P(1, "back-out", REST)
];
const dodge = (out, dx = -.25, dy = -.04) => [P(tAt("dodge", "out"), "ease-out", out, dx, dy), P(1, "back-out", REST)];
const faint = (mid, end, dyMid = .1, dyEnd = .22) => [P(.45, "ease-in", mid, 0, dyMid), P(1, "ease-out", end, -.02, dyEnd)];
const victory = (rear, toss, dy = -.08) => [
	P(tAt("victory", "rear"), "ease-out", rear, 0, dy),
	P(tAt("victory", "toss"), "back-out", toss, 0, dy - .004),
	P(1, "back-out", REST)
];
const tame = (approach, lower, end) => [
	P(tAt("tame", "approach"), "ease-out", approach, .12, -.008),
	P(tAt("tame", "lower"), "ease-out", lower, .12, .02),
	P(1, "back-out", end, .12, .004)
];
const feed = (down, open, closed) => [
	P(tAt("feed", "down"), "ease-out", down, .02, .012),
	P(tAt("feed", "chew", .5), "sine-in-out", {
		...down,
		...open
	}, .02, .012),
	P(tAt("feed", "chew"), "sine-in-out", {
		...down,
		...closed
	}, .02, .012),
	P(tAt("feed", "chew2", .5), "sine-in-out", {
		...down,
		...open
	}, .02, .012),
	P(tAt("feed", "chew2"), "sine-in-out", {
		...down,
		...closed
	}, .02, .012),
	P(1, "back-out", REST)
];
const fauna = (s) => Object.freeze(Object.fromEntries([
	A("idle", "idle", loop4(s.idle[0], s.idle[1], s.idle[2], s.idle[3], s.idle[4], s.idle[5]), true),
	A("alert", "alert", [P(1, "back-out", s.alert[0], 0, s.alert[1])]),
	...Object.entries(s.approach).map(([g, poses]) => A("approach:" + g, "approach", poses)),
	...Object.entries(s.melee).map(([w, poses]) => A("melee:" + w, "melee", poses)),
	A("cast", "cast", s.cast),
	A("hit", "hit", s.hit),
	A("dodge", "dodge", s.dodge),
	A("faint", "faint", s.faint),
	A("victory", "victory", s.victory),
	A("tame", "tame", s.tame),
	A("feed", "feed", s.feed)
].map((a) => [a.id, a])));
const hind = (knee, ankle, paw = 0) => ({
	...pair("hind", knee, "Knee"),
	...pair("hind", ankle, "Ankle"),
	...pair("hind", paw, "Paw")
});
const fore = (knee, ankle = 0) => ({
	...pair("fore", knee, "Knee"),
	...pair("fore", ankle, "Ankle")
});
const ears = (deg) => pair("ear", deg, "Tip");
const HOPPER = fauna({
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
		P(.3, "ease-in", {
			...hind(50, -60),
			...fore(-20),
			spine: 10,
			head: 6,
			tail0: -8
		}, 0, .05),
		P(.55, "ease-out", {
			...hind(-70, 60, 20),
			...fore(-35, 10),
			spine: -10,
			neck: -8,
			tail0: -14,
			root: -8
		}, .3, -.18),
		P(.85, "ease-in", {
			...hind(30, -30),
			...fore(30, -20),
			spine: 8,
			root: 6
		}, .5, -.02),
		P(1, "back-out", {
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
const legs2 = (far, near, bend = 0) => ({
	legFarKnee: far,
	legNearKnee: near,
	legFarAnkle: -far * .8 + bend,
	legNearAnkle: -near * .8 + bend,
	legFarFoot: far * .4,
	legNearFoot: near * .4
});
/** Wing keys: + LIFTS the wing (the bones point backward from the chest, so clockwise-positive raises the tip). */
const wings = (root, tip) => ({
	...pair("wing", root, "Root"),
	...pair("wing", tip, "Tip")
});
const neck2 = (a, b, head = 0) => ({
	neck0: a,
	neck1: b,
	head
});
const BIRD = fauna({
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
			P(.25, "sine-in-out", {
				...wings(65, 35),
				...legs2(40, 40, -40),
				spine: -6,
				...neck2(4, 4)
			}, 0, -.12),
			P(.5, "sine-in-out", {
				...wings(10, -5),
				...legs2(40, 40, -40),
				spine: -4
			}, 0, -.16),
			P(.75, "sine-in-out", {
				...wings(-45, -40),
				...legs2(40, 40, -40),
				spine: 2,
				...neck2(-3, -3)
			}, 0, -.12),
			P(1, "sine-in-out", {
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
const wave = (k) => mul({
	spine0: -6,
	spine1: -10,
	spine2: -4,
	spine3: 6,
	spine4: 12,
	spine5: 16,
	caudal: 20
}, k);
const pect = (v) => ({
	pectoralFar: -v,
	pectoralNear: v
});
const FISH = fauna({
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
	approach: { swim: loop4(wave(1), {
		...pect(12),
		dorsal: 4
	}, wave(-1), 0, -.01, -.014) },
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
const tripodA = [
	"legFrontFar",
	"legMidNear",
	"legHindFar"
];
const tripodB = [
	"legFrontNear",
	"legMidFar",
	"legHindNear"
];
const legSet = (names, knee, foot) => Object.fromEntries(names.flatMap((n) => [[n + "Knee", knee], [n + "Foot", foot]]));
const tripod = (k, f) => ({
	...legSet(tripodA, -k, f),
	...legSet(tripodB, k, -f)
});
const allLegs6 = (knee, foot) => legSet([...tripodA, ...tripodB], knee, foot);
const frontLegs = (knee, foot = 0) => legSet(["legFrontFar", "legFrontNear"], knee, foot);
const ant = (v) => ({
	antennaFar: v,
	antennaNear: v
});
const wing1 = (v) => ({
	wingFar: v,
	wingNear: -v
});
const INSECT = fauna({
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
			P(.25, "sine-in-out", {
				...wing1(-70),
				...allLegs6(30, -40),
				abdomen: 8
			}, 0, -.11),
			P(.5, "sine-in-out", {
				...wing1(0),
				...allLegs6(30, -40),
				abdomen: 4
			}, 0, -.13),
			P(.75, "sine-in-out", {
				...wing1(70),
				...allLegs6(30, -40),
				abdomen: 8
			}, 0, -.11),
			P(1, "sine-in-out", {
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
const swave = (k) => mul({
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
const SERPENT = fauna({
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
	approach: { slither: loop4(swave(1), {
		head: 2,
		seg0: 2
	}, swave(-1), 0, -.004, 0) },
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
const tetA = [
	"leg1Far",
	"leg2Near",
	"leg3Far",
	"leg4Near"
];
const tetB = [
	"leg1Near",
	"leg2Far",
	"leg3Near",
	"leg4Far"
];
const tetrapod = (k, f) => ({
	...legSet(tetA, -k, f),
	...legSet(tetB, k, -f)
});
const allLegs8 = (knee, foot) => legSet([...tetA, ...tetB], knee, foot);
const leg1 = (knee, foot = 0) => legSet(["leg1Far", "leg1Near"], knee, foot);
const leg2 = (knee, foot = 0) => legSet(["leg2Far", "leg2Near"], knee, foot);
const chel = (v) => pair("chelicera", v);
const ARACHNID = fauna({
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
const splay = (s0, s1, s2) => Object.fromEntries([
	0,
	1,
	2,
	3,
	4,
	5
].flatMap((n) => {
	const k = n % 2 === 0 ? 1 : -1;
	return [
		["arm" + n + "Seg0", s0 * k],
		["arm" + n + "Seg1", s1 * k],
		["arm" + n + "Seg2", s2 * k]
	];
}));
const RADIAL = fauna({
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
			P(.3, "ease-in", {
				bell: -18,
				centre: -2,
				...splay(-30, -35, -40)
			}, 0, -.1),
			P(.6, "ease-out", {
				bell: 15,
				centre: 2,
				...splay(20, 25, 30)
			}, 0, -.04),
			P(.85, "sine-in-out", {
				bell: 4,
				...splay(8, 10, 12)
			}, 0, -.02),
			P(1, "sine-in-out", REST, 0, -.01)
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
const myA = [
	"legAFar",
	"legBNear",
	"legCFar",
	"legDNear"
];
const myB = [
	"legANear",
	"legBFar",
	"legCNear",
	"legDFar"
];
const mtripod = (k, f) => ({
	...legSet(myA, -k, f),
	...legSet(myB, k, -f)
});
const allLegsM = (knee, foot) => legSet([...myA, ...myB], knee, foot);
const legA = (knee, foot = 0) => legSet(["legAFar", "legANear"], knee, foot);
const mwave = (k) => mul({
	seg0: 6,
	seg1: 10,
	seg2: 6,
	seg3: -6,
	seg4: -10,
	seg5: -6,
	seg6: 6,
	seg7: 10
}, k);
const MYRIAPOD = fauna({
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
const csplay = (s0, s1, s2) => Object.fromEntries(cephArmsA.flatMap((a, n) => {
	const k = n < 4 ? -1 : 1;
	return [
		[a + "Seg0", s0 * k],
		[a + "Seg1", s1 * k],
		[a + "Seg2", s2 * k]
	];
}));
const calt = (s0, s1, s2) => Object.fromEntries(cephArmsA.flatMap((a, n) => {
	const k = n % 2 === 0 ? 1 : -1;
	return [
		[a + "Seg0", s0 * k],
		[a + "Seg1", s1 * k],
		[a + "Seg2", s2 * k]
	];
}));
const front = (a, b, c) => ({
	arm3Seg0: a,
	arm3Seg1: b,
	arm3Seg2: c,
	arm4Seg0: a,
	arm4Seg1: b,
	arm4Seg2: c
});
const fins = (v) => ({
	finFar: -v,
	finNear: v
});
const eyes = (v) => ({
	eyeFar: v,
	eyeNear: v
});
const CEPHALOPOD = fauna({
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
			P(.3, "ease-in", {
				mantle: -12,
				siphon: 25,
				...csplay(-28, -34, -40)
			}, 0, -.06),
			P(.6, "ease-out", {
				mantle: 10,
				siphon: -10,
				...csplay(18, 24, 30),
				...fins(15)
			}, .3, -.12),
			P(.85, "sine-in-out", {
				mantle: 3,
				...csplay(6, 8, 10)
			}, .45, -.05),
			P(1, "sine-in-out", REST, 0, -.02)
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
const bw = (root, elbow, wrist, tip) => ({
	...pair("wing", root, "Root"),
	...pair("wing", elbow, "Elbow"),
	...pair("wing", wrist, "Wrist"),
	...pair("wing", tip, "Tip")
});
const bl = (knee, foot) => ({
	...pair("leg", knee, "Knee"),
	...pair("leg", foot, "Foot")
});
const bears = (v) => pair("ear", v, "Tip");
const FLYER = fauna({
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
			P(.25, "sine-in-out", {
				...bw(70, -30, -20, -10),
				...bl(30, -30),
				spine: -6,
				neck: 4
			}, 0, -.12),
			P(.5, "sine-in-out", {
				...bw(10, 10, 15, 20),
				...bl(30, -30),
				spine: -4
			}, 0, -.16),
			P(.75, "sine-in-out", {
				...bw(-50, 40, 35, 30),
				...bl(30, -30),
				spine: 2,
				neck: -3
			}, 0, -.12),
			P(1, "sine-in-out", {
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
const pa = (sh, el, hand) => ({
	...pair("arm", sh, "Shoulder"),
	...pair("arm", el, "Elbow"),
	...pair("arm", hand, "Hand")
});
const pl = (hip, knee, foot) => ({
	...pair("leg", hip, "Hip"),
	...pair("leg", knee, "Knee"),
	...pair("leg", foot, "Foot")
});
const alt = (base, v, suffix) => ({
	[base + "Far" + suffix]: -v,
	[base + "Near" + suffix]: v
});
const tail3 = (a, b, c) => ({
	tail0: a,
	tail1: b,
	tail2: c
});
const climbA = {
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
const climbB = {
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
const PRIMATE = fauna({
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
const wsway = (k) => ({
	trunk: .3 * k,
	...Object.fromEntries([
		0,
		1,
		2
	].flatMap((n) => {
		const s = n === 1 ? -1 : 1;
		return [
			["branch" + n + "Base", k * s],
			["branch" + n + "Tip", 1.5 * k * s],
			["leaf" + n, 2 * k * s]
		];
	}))
});
const hsway = (k) => Object.fromEntries([
	0,
	1,
	2,
	3
].flatMap((n) => {
	const s = n % 2 === 0 ? 1 : -1;
	return [
		["stem" + n + "Seg0", .6 * k * s],
		["stem" + n + "Seg1", k * s],
		["stem" + n + "Seg2", 1.4 * k * s],
		["frond" + n, 2 * k * s]
	];
}));
const plant = (sway, leaves) => Object.freeze(Object.fromEntries([
	A("sway", "sway", [
		P(.25, "sine-in-out", sway(6)),
		P(.5, "sine-in-out", sway(1)),
		P(.75, "sine-in-out", sway(-5)),
		P(1, "sine-in-out", REST)
	], true),
	A("disturb", "disturb", [
		P(tAt("disturb", "recoil"), "ease-out", {
			...sway(-14),
			...mul(leaves, -1)
		}, -.01),
		P(tAt("disturb", "settle", .5), "sine-in-out", sway(6)),
		P(1, "back-out", REST)
	]),
	A("harvest", "harvest", [
		P(tAt("harvest", "shake"), "ease-in", sway(12)),
		P(tAt("harvest", "detach"), "ease-out", {
			...sway(-10),
			...leaves
		}, 0, .004),
		P(tAt("harvest", "settle", .5), "sine-in-out", sway(4)),
		P(1, "back-out", REST)
	]),
	A("grow", "grow", [
		P(.02, "ease-out", mul(leaves, -1.2), 0, .3),
		P(tAt("grow", "rise"), "ease-out", mul(leaves, -.4), 0, -.03),
		P(tAt("grow", "overshoot"), "back-out", {
			...sway(3),
			...mul(leaves, .3)
		}, 0, -.05),
		P(1, "sine-in-out", REST)
	])
].map((a) => [a.id, a])));
const WOODY = plant(wsway, {
	leaf0: 30,
	leaf1: -30,
	leaf2: 30
});
const HERB = plant(hsway, {
	frond0: 35,
	frond1: -35,
	frond2: 35,
	frond3: -35
});
const ACTIONS_BY_TEMPLATE = Object.freeze({
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
/** Card weapon → the template's melee action name when the family's weapon has its own verb. */
const MELEE_ALIAS = Object.freeze({
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
const actionsFor = (templateId) => ACTIONS_BY_TEMPLATE[templateId];
/** Gaits (approach:*) and melee verbs (melee:*) a template's library offers, in table order. */
const templateGaits = (templateId) => Object.keys(actionsFor(templateId) ?? {}).filter((k) => k.startsWith("approach:")).map((k) => k.slice(9));
const templateMelees = (templateId) => Object.keys(actionsFor(templateId) ?? {}).filter((k) => k.startsWith("melee:")).map((k) => k.slice(6));
//#endregion
//#region port/v2/apps/game/src/motion/secondary.ts
const MATERIAL_RULES = Object.freeze({
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
const LUMINOUS_PULSE = Object.freeze({
	idleMs: 1800,
	strikeMs: 120
});
const MEDIUM_RULES = Object.freeze({
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
/** FA_SKIN name → kit material (the kit shortens "slick and wet" to slick). */
function materialFromSkinName(name) {
	const n = name.toLowerCase();
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
const CHAIN_RULES = Object.freeze({
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
/** Per-joint lag/overshoot/squash parameters for one secondary chain. */
function secondaryParams(part, realm, luminous) {
	const rule = MATERIAL_RULES[part.material], medium = MEDIUM_RULES[realm], chain = part.kind ? CHAIN_RULES[part.kind] ?? {} : null;
	const lagS = chain && !rule.rigid ? chain.lagS ?? rule.lagS : rule.lagS, overshoot = chain && !rule.rigid ? chain.overshoot ?? rule.overshoot : rule.overshoot;
	return part.joints.map((joint, order) => ({
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
	}));
}
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
function habOf(g) {
	return g && g.x ? EX_HABITAT[(g.habitat || 0) % EX_HABITAT.length] : FA_HABITAT[(g && g.habitat || 0) % FA_HABITAT.length] || "";
}
function locoOf(g) {
	return g && g.x ? EX_LOCO[(g.loco || 0) % EX_LOCO.length] : FA_LOCO[(g && g.loco || 0) % FA_LOCO.length] || "";
}
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
const BIOME_PROFILES_V1 = createBiomeProfileAuthorityV1(AUTHORED_BIOME_PROFILE_ENTRIES_V1).profiles;
//#endregion
//#region port/v2/apps/game/src/battle-habitat.ts
/** Physical battle placement, separate from rarity/sapience display realms.
* This compiler never rerolls worlds, grants capabilities, or changes combat. */
const REALMS = [
	"land",
	"aerial",
	"aquatic",
	"amphibious",
	"gas-giant"
];
const KNOWN_EARTH = Object.freeze({
	Civet: "land",
	"Red Fox": "land",
	Fox: "land",
	Frog: "amphibious",
	Platypus: "amphibious",
	Pheasant: "aerial",
	Penguin: "amphibious",
	Ostrich: "land",
	Emu: "land",
	Cassowary: "land",
	Kiwi: "land",
	Kakapo: "land"
});
const FAMILY = Object.freeze({
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
function resolvePhysicalHabitat(record, genome) {
	let realm, source, liquid = null;
	if (record.habitat) {
		const h = record.habitat;
		if (!REALMS.includes(h.realm) || !h.source?.trim()) throw Error("Habitat: invalid source declaration");
		realm = h.realm;
		source = h.source;
		liquid = h.liquid ?? null;
	} else if (record.identity.earthName) {
		realm = KNOWN_EARTH[record.identity.earthName];
		source = "named Earth natural history";
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
	const allowed = realm === "aquatic" ? ["water"] : realm === "aerial" || realm === "gas-giant" ? ["air"] : realm === "amphibious" ? ["ground", "water"] : ["ground"];
	return Object.freeze({
		realm,
		preferred: allowed[0],
		allowed: Object.freeze(allowed),
		source,
		liquid: allowed.includes("water") ? liquid ?? "water" : null
	});
}
const hash$1 = (s) => {
	let h = 2166136261;
	for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
	return h >>> 0;
};
function checkWorld(w) {
	if (!w?.key || !Object.hasOwn(BIOME_PROFILES_V1, w.biome) || !Number.isSafeInteger(w.seed) || typeof w.solid !== "boolean" || typeof w.atmosphere !== "boolean" || typeof w.surfaceWater !== "boolean" || !(w.liquid === null || typeof w.liquid === "string" && w.liquid.length > 0) || !w.cardHash) throw Error("Habitat: invalid source world");
	if (w.groundLineY !== void 0 && (!Number.isFinite(w.groundLineY) || w.groundLineY < .6 || w.groundLineY > .95)) throw Error("Habitat: invalid ground registration");
}
function compileHabitatBattle(input) {
	if (!input.contextId || !Number.isSafeInteger(input.seed) || !Number.isInteger(input.round) || input.round < 0 || ![
		"wild",
		"guardian",
		"duel"
	].includes(input.kind)) throw Error("Habitat: invalid battle context");
	checkWorld(input.home);
	checkWorld(input.visitor);
	const first = hash$1(input.contextId + ":" + input.seed) % 2, world = input.kind === "duel" && (input.round + first) % 2 === 1 ? input.visitor : input.home;
	const seed = hash$1(JSON.stringify([
		input.contextId,
		input.seed,
		input.round,
		world.key,
		world.seed,
		world.cardHash
	])), available = [];
	if (world.solid) available.push("ground");
	if (world.atmosphere) available.push("air");
	if (world.liquid) available.push("water");
	const select = (h) => {
		const compatible = h.allowed.filter((m) => available.includes(m) && (m !== "water" || h.liquid === world.liquid));
		return compatible.includes(h.preferred) ? h.preferred : compatible[0];
	};
	const left = select(input.left), right = select(input.right);
	if (!left || !right) return {
		status: "UNSUPPORTED",
		reason: "Selected home arena cannot support both organisms; no habitat or biome substitution",
		worldKey: world.key,
		seed
	};
	if (left === "water" !== (right === "water") && !world.surfaceWater) return {
		status: "UNSUPPORTED",
		reason: "No surface interface between this deep-water arena and the other medium",
		worldKey: world.key,
		seed
	};
	const surfaceY = .52, groundY = world.groundLineY ?? .86, band = (medium) => medium === "air" ? {
		minY: .08,
		maxY: .46
	} : medium === "water" ? {
		minY: .57,
		maxY: .86
	} : {
		minY: .08,
		maxY: groundY
	};
	return {
		status: "READY",
		schema: "cf.battle-habitat/v1",
		worldKey: world.key,
		biome: world.biome,
		cardHash: world.cardHash,
		signature: world.signature,
		seed,
		round: input.round,
		surfaceY,
		groundY,
		left: {
			medium: left,
			band: band(left),
			x: .3
		},
		right: {
			medium: right,
			band: band(right),
			x: .7
		},
		interaction: left === right ? "same-medium" : "surface-ranged",
		recipeKey: "habitat-v1-" + hash$1(JSON.stringify([
			seed,
			left,
			right,
			world
		])).toString(16)
	};
}
//#endregion
//#region port/v2/apps/game/src/motion/body-card.ts
const PART_GROUPS = Object.freeze([
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
var MotionCompileError = class extends Error {
	reason;
	fallback;
	constructor(reason, detail, fallback = null) {
		super(`motion refused (${reason}): ${detail}`);
		this.name = "MotionCompileError";
		this.reason = reason;
		this.fallback = fallback;
	}
};
/** Named Earth species: the record owns anatomy and materials; gait/mass/weapons come from this table. */
const EARTH_SPECIES = Object.freeze({
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
const EARTH_DEFAULT = Object.freeze({
	gait: "walk",
	loco: null,
	mass: "medium",
	weapons: ["bite", "claw"]
});
/** FA_LOCO name → approach gait. Every FA_LOCO entry must be here (contract-tested). */
const LOCO_GAIT = Object.freeze({
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
const HEAD_WEAPON = Object.freeze({
	"fanged": "bite",
	"horned": "gore",
	"beaked": "peck",
	"mandibled": "bite",
	"domed and bulbous": "headbutt"
});
const TAIL_WEAPON = Object.freeze({
	"whip-like": "tail",
	"spiked": "tail",
	"stinger-tipped": "sting"
});
const BOUND_TOLERANCE = .15;
/** Rest leg slack below this fraction of body length is noted on the card (kit §3 anatomy; the C2 planted-contact solver needs it). */
const LEG_SLACK_MIN_BL = .03;
/** Natural weapons a template always carries [primary, secondary]; head/tail genome weapons are added around them as before. */
const TEMPLATE_WEAPONS = Object.freeze({
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
/** Gait a template falls back to when the card's FA_LOCO gait has no approach in its library (first approach verb in table order). */
const GAIT_FALLBACK = Object.freeze({
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
const groupOf = (joint) => /^tail|^abdomen$|^sting$/.test(joint) ? "tail" : /^ear/.test(joint) ? "ears" : /wing|tailFan/.test(joint) ? "wings" : /caudal|dorsal|pectoral/.test(joint) ? "fins" : /antenna/.test(joint) ? "antennae" : /branch|leaf|stem|frond/.test(joint) ? "fronds" : /^arm(\d|Far|Near)/.test(joint) ? "arms" : /^(neck\d?|head|jaw|beak|mandible|chelicera|eye)/.test(joint) ? "head" : /^(pelvis|spine\d?|chest|thorax|cephalothorax|centre|bell|trunk|seg\d|mantle|siphon)$/.test(joint) ? "body" : /^fin/.test(joint) ? "fins" : "legs";
const at = (arr, i) => typeof i === "number" ? arr[((i | 0) % arr.length + arr.length) % arr.length] : void 0;
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
	const resolved = resolveAnatomyInventory(baseTemplate, record.anatomy);
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
	const parts = resolved.graph.map(([child, parent]) => {
		const pivot = landmarks[parent], tip = landmarks[child], boneLength = Math.hypot(tip[0] - pivot[0], tip[1] - pivot[1]);
		bones[child] = boneLength;
		return {
			joint: child,
			parent,
			group: groupOf(child),
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
	if (record.identity.earthName && !EARTH_SPECIES[record.identity.earthName]) notes.push(`earth species "${record.identity.earthName}" not in the named table; walk/medium defaults`);
	const massName = earth ? earth.mass : at(MASS_BY_SIZE_INDEX, genome?.size) ?? "medium";
	const locoName = earth ? earth.loco : at(FA_LOCO, genome?.loco) ?? null;
	const physical = resolvePhysicalHabitat(record, genome);
	const habitatGait = physical.realm === "aquatic" ? "swim" : physical.realm === "aerial" || physical.realm === "gas-giant" ? "fly" : resolved.id === "hopper" ? "hop" : "walk";
	const gait = record.habitat?.gait ?? (earth ? earth.gait : locoName ? LOCO_GAIT[locoName] ?? habitatGait : habitatGait);
	const gaits = templateGaits(resolved.id), gaitAlias = GAIT_FALLBACK[resolved.id]?.[gait];
	const isPlant = PLANT_TEMPLATE_IDS.includes(resolved.id);
	let templateGait = gaits.includes(gait) ? gait : gaitAlias && gaits.includes(gaitAlias) ? gaitAlias : gaits[0] ?? "none";
	if (!isPlant && !gaits.includes(gait)) notes.push(`gait "${gait}" has no ${resolved.id} approach; using ${templateGait}`);
	if (isPlant) templateGait = "none";
	const weapons = [];
	const addWeapon = (w) => {
		if (w && !weapons.includes(w)) weapons.push(w);
	};
	const natural = TEMPLATE_WEAPONS[resolved.id] ?? ["bite", "claw"];
	if (isPlant) {} else if (earth && resolved.id === "quadruped") earth.weapons.forEach(addWeapon);
	else {
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
		if (genomeMaterial && !recordMaterial) {
			material = genomeMaterial;
			notes.push(`materials: record omits surface; genome skin "${skinName}" used as fallback`);
		} else if (genomeMaterial && recordMaterial && recordMaterial !== genomeMaterial) notes.push(`materials: record surface "${surface}" wins over genome skin "${skinName}" (observer disagreement)`);
	}
	if (!material) throw new MotionCompileError("unsupported-materials", `surface "${surface}" maps to no kit material`);
	const materials = Object.freeze(Object.fromEntries(PART_GROUPS.map((g) => [g, material])));
	const secondaryParts = resolved.secondaryChains.map((c) => ({
		id: c.id,
		driver: c.driver,
		joints: c.joints,
		lagOrder: c.joints.map((_, i) => i),
		material,
		...c.kind ? { kind: c.kind } : {}
	}));
	const legSlack = {};
	for (const leg of resolved.legs) {
		const r = landmarks[leg + "Root"], k = landmarks[leg + "Knee"], a = landmarks[leg + "Ankle"];
		if (!r || !k || !a) continue;
		const upper = Math.hypot(k[0] - r[0], k[1] - r[1]), lower = Math.hypot(a[0] - k[0], a[1] - k[1]), dx = a[0] - r[0], vertical = a[1] - r[1];
		legSlack[leg] = Math.sqrt(Math.max(0, (upper + lower) ** 2 - dx * dx)) - vertical;
	}
	const [axisA, axisB] = resolved.bodyAxis ?? ["pelvis", "chest"];
	const torso = landmarks[axisA] && landmarks[axisB] ? Math.hypot(landmarks[axisB][0] - landmarks[axisA][0], landmarks[axisB][1] - landmarks[axisA][1]) : 0;
	const torsoClamp = clamped.find((c) => c.id === "torso" || c.id === "body");
	const bodyLength = torsoClamp ? torsoClamp.clamped : torso;
	const slackBL = Object.freeze(Object.fromEntries(Object.entries(legSlack).map(([leg, v]) => [leg, bodyLength > 0 ? v / bodyLength : 0])));
	const straight = Object.entries(slackBL).filter(([, v]) => v < LEG_SLACK_MIN_BL).map(([leg, v]) => `${leg} ${(v * 100).toFixed(1)}%`);
	if (straight.length) notes.push(`leg slack under ${LEG_SLACK_MIN_BL * 100}% of body length (near-collinear rest chain; a planted paw cannot absorb lifts): ${straight.join(", ")}`);
	return {
		kind: "body-card",
		projectionSigns: poseProjectionSigns(record),
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
		parts,
		secondaryParts,
		weapons,
		luminous,
		bodyLength,
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
//#endregion
//#region port/v2/apps/game/src/motion/timeline.ts
/** The frozen easing family; numerically identical to gsap power1.out / power1.in / back.out(1.70158) / sine.inOut. */
const EASE_FN = Object.freeze({
	"ease-out": (t) => 1 - (1 - t) * (1 - t),
	"ease-in": (t) => t * t,
	"back-out": (t) => {
		const s = 1.70158, p = t - 1;
		return p * p * (2.70158 * p + s) + 1;
	},
	"sine-in-out": (t) => -(Math.cos(Math.PI * t) - 1) / 2
});
/** approach → the card's template gait; melee → the first card weapon the template's library (or its alias table) has a verb for, else the library's first melee verb with a note. */
function resolveActionId(card, actionId) {
	if (actionId === "approach") return {
		id: "approach:" + card.locomotion.templateGait,
		note: null
	};
	if (actionId === "melee") {
		const verbs = templateMelees(card.template.id), alias = MELEE_ALIAS[card.template.id] ?? {};
		const w = card.weapons.map((x) => alias[x] ?? x).find((x) => verbs.includes(x));
		const first = verbs[0] ?? "bite";
		return w ? {
			id: "melee:" + w,
			note: null
		} : {
			id: "melee:" + first,
			note: `no ${card.template.id} melee for weapons [${card.weapons.join(",")}]; ${first} used`
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
const REST_KEY = {
	ms: 0,
	t: 0,
	value: 0,
	ease: "ease-out"
};
const CHAIN_ATTENUATION = .6;
function buildTimeline(card, actionId, seed) {
	const resolved = resolveActionId(card, actionId);
	const action = actionsFor(card.template.id)?.[resolved.id];
	if (!action) throw new Error(`motion: ${card.template.id} has no action "${resolved.id}"`);
	const mass = card.massClass.multiplier, notes = [...card.notes];
	if (resolved.note) notes.push(resolved.note);
	const phases = action.family === "idle" || action.family === "sway" ? [["period", idlePeriodMs(seed, mass)]] : phaseDurations(action.family, mass);
	const bodyMs = phases.reduce((s, [, ms]) => s + ms, 0);
	const clamped = [];
	const tracks = {};
	const joints = ["root", ...card.parts.map((p) => p.joint)];
	for (const joint of joints) {
		const lim = card.bounds.limitsDeg[joint];
		tracks[joint] = [REST_KEY, ...action.poses.map((pose) => {
			let deg = pose.joints[joint] ?? 0;
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
		value: p.root[pick],
		ease: p.ease
	}))];
	const secondary = [];
	let maxLag = 0;
	for (const part of card.secondaryParts) {
		let prev = [REST_KEY];
		for (const prm of secondaryParams(part, card.realm, card.luminous)) {
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
		actionId: resolved.id,
		family: action.family,
		loop: action.loop,
		seed,
		recipeHash: card.recipeHash,
		massClass: card.massClass.name,
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
	return {
		...body,
		hash: fnv1a(JSON.stringify(body))
	};
}
//#endregion
//#region port/v2/node_modules/gsap/gsap-core.js
function _assertThisInitialized(self) {
	if (self === void 0) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
	return self;
}
function _inheritsLoose(subClass, superClass) {
	subClass.prototype = Object.create(superClass.prototype);
	subClass.prototype.constructor = subClass;
	subClass.__proto__ = superClass;
}
/*!
* GSAP 3.15.0
* https://gsap.com
*
* @license Copyright 2008-2026, GreenSock. All rights reserved.
* Subject to the terms at https://gsap.com/standard-license
* @author: Jack Doyle, jack@greensock.com
*/
var _config = {
	autoSleep: 120,
	force3D: "auto",
	nullTargetWarn: 1,
	units: { lineHeight: "" }
};
var _defaults = {
	duration: .5,
	overwrite: false,
	delay: 0
};
var _suppressOverwrites;
var _reverting$1;
var _context;
var _bigNum$1 = 1e8;
var _tinyNum = 1 / _bigNum$1;
var _2PI = Math.PI * 2;
var _HALF_PI = _2PI / 4;
var _gsID = 0;
var _sqrt = Math.sqrt;
var _cos = Math.cos;
var _sin = Math.sin;
var _isString = function _isString(value) {
	return typeof value === "string";
};
var _isFunction = function _isFunction(value) {
	return typeof value === "function";
};
var _isNumber = function _isNumber(value) {
	return typeof value === "number";
};
var _isUndefined = function _isUndefined(value) {
	return typeof value === "undefined";
};
var _isObject = function _isObject(value) {
	return typeof value === "object";
};
var _isNotFalse = function _isNotFalse(value) {
	return value !== false;
};
var _windowExists$1 = function _windowExists() {
	return typeof window !== "undefined";
};
var _isFuncOrString = function _isFuncOrString(value) {
	return _isFunction(value) || _isString(value);
};
var _isTypedArray = typeof ArrayBuffer === "function" && ArrayBuffer.isView || function() {};
var _isArray = Array.isArray;
var _randomExp = /random\([^)]+\)/g;
var _commaDelimExp = /,\s*/g;
var _strictNumExp = /(?:-?\.?\d|\.)+/gi;
var _numExp = /[-+=.]*\d+[.e\-+]*\d*[e\-+]*\d*/g;
var _numWithUnitExp = /[-+=.]*\d+[.e-]*\d*[a-z%]*/g;
var _complexStringNumExp = /[-+=.]*\d+\.?\d*(?:e-|e\+)?\d*/gi;
var _relExp = /[+-]=-?[.\d]+/;
var _delimitedValueExp = /[^,'"\[\]\s]+/gi;
var _unitExp = /^[+\-=e\s\d]*\d+[.\d]*([a-z]*|%)\s*$/i;
var _globalTimeline;
var _win$1;
var _coreInitted;
var _doc$1;
var _globals = {};
var _installScope = {};
var _coreReady;
var _install = function _install(scope) {
	return (_installScope = _merge(scope, _globals)) && gsap;
};
var _missingPlugin = function _missingPlugin(property, value) {
	return console.warn("Invalid property", property, "set to", value, "Missing plugin? gsap.registerPlugin()");
};
var _warn = function _warn(message, suppress) {
	return !suppress && console.warn(message);
};
var _addGlobal = function _addGlobal(name, obj) {
	return name && (_globals[name] = obj) && _installScope && (_installScope[name] = obj) || _globals;
};
var _emptyFunc = function _emptyFunc() {
	return 0;
};
var _startAtRevertConfig = {
	suppressEvents: true,
	isStart: true,
	kill: false
};
var _revertConfigNoKill = {
	suppressEvents: true,
	kill: false
};
var _revertConfig = { suppressEvents: true };
var _reservedProps = {};
var _lazyTweens = [];
var _lazyLookup = {};
var _lastRenderedFrame;
var _plugins = {};
var _effects = {};
var _nextGCFrame = 30;
var _harnessPlugins = [];
var _callbackNames = "";
var _harness = function _harness(targets) {
	var target = targets[0], harnessPlugin, i;
	_isObject(target) || _isFunction(target) || (targets = [targets]);
	if (!(harnessPlugin = (target._gsap || {}).harness)) {
		i = _harnessPlugins.length;
		while (i-- && !_harnessPlugins[i].targetTest(target));
		harnessPlugin = _harnessPlugins[i];
	}
	i = targets.length;
	while (i--) targets[i] && (targets[i]._gsap || (targets[i]._gsap = new GSCache(targets[i], harnessPlugin))) || targets.splice(i, 1);
	return targets;
};
var _getCache = function _getCache(target) {
	return target._gsap || _harness(toArray(target))[0]._gsap;
};
var _getProperty = function _getProperty(target, property, v) {
	return (v = target[property]) && _isFunction(v) ? target[property]() : _isUndefined(v) && target.getAttribute && target.getAttribute(property) || v;
};
var _forEachName = function _forEachName(names, func) {
	return (names = names.split(",")).forEach(func) || names;
};
var _round = function _round(value) {
	return Math.round(value * 1e5) / 1e5 || 0;
};
var _roundPrecise = function _roundPrecise(value) {
	return Math.round(value * 1e7) / 1e7 || 0;
};
var _parseRelative = function _parseRelative(start, value) {
	var operator = value.charAt(0), end = parseFloat(value.substr(2));
	start = parseFloat(start);
	return operator === "+" ? start + end : operator === "-" ? start - end : operator === "*" ? start * end : start / end;
};
var _arrayContainsAny = function _arrayContainsAny(toSearch, toFind) {
	var l = toFind.length, i = 0;
	for (; toSearch.indexOf(toFind[i]) < 0 && ++i < l;);
	return i < l;
};
var _lazyRender = function _lazyRender() {
	var l = _lazyTweens.length, a = _lazyTweens.slice(0), i, tween;
	_lazyLookup = {};
	_lazyTweens.length = 0;
	for (i = 0; i < l; i++) {
		tween = a[i];
		tween && tween._lazy && (tween.render(tween._lazy[0], tween._lazy[1], true)._lazy = 0);
	}
};
var _isRevertWorthy = function _isRevertWorthy(animation) {
	return !!(animation._initted || animation._startAt || animation.add);
};
var _lazySafeRender = function _lazySafeRender(animation, time, suppressEvents, force) {
	_lazyTweens.length && !_reverting$1 && _lazyRender();
	animation.render(time, suppressEvents, force || !!(_reverting$1 && time < 0 && _isRevertWorthy(animation)));
	_lazyTweens.length && !_reverting$1 && _lazyRender();
};
var _numericIfPossible = function _numericIfPossible(value) {
	var n = parseFloat(value);
	return (n || n === 0) && (value + "").match(_delimitedValueExp).length < 2 ? n : _isString(value) ? value.trim() : value;
};
var _passThrough = function _passThrough(p) {
	return p;
};
var _setDefaults = function _setDefaults(obj, defaults) {
	for (var p in defaults) p in obj || (obj[p] = defaults[p]);
	return obj;
};
var _setKeyframeDefaults = function _setKeyframeDefaults(excludeDuration) {
	return function(obj, defaults) {
		for (var p in defaults) p in obj || p === "duration" && excludeDuration || p === "ease" || (obj[p] = defaults[p]);
	};
};
var _merge = function _merge(base, toMerge) {
	for (var p in toMerge) base[p] = toMerge[p];
	return base;
};
var _mergeDeep = function _mergeDeep(base, toMerge) {
	for (var p in toMerge) p !== "__proto__" && p !== "constructor" && p !== "prototype" && (base[p] = _isObject(toMerge[p]) ? _mergeDeep(base[p] || (base[p] = {}), toMerge[p]) : toMerge[p]);
	return base;
};
var _copyExcluding = function _copyExcluding(obj, excluding) {
	var copy = {}, p;
	for (p in obj) p in excluding || (copy[p] = obj[p]);
	return copy;
};
var _inheritDefaults = function _inheritDefaults(vars) {
	var parent = vars.parent || _globalTimeline, func = vars.keyframes ? _setKeyframeDefaults(_isArray(vars.keyframes)) : _setDefaults;
	if (_isNotFalse(vars.inherit)) while (parent) {
		func(vars, parent.vars.defaults);
		parent = parent.parent || parent._dp;
	}
	return vars;
};
var _arraysMatch = function _arraysMatch(a1, a2) {
	var i = a1.length, match = i === a2.length;
	while (match && i-- && a1[i] === a2[i]);
	return i < 0;
};
var _addLinkedListItem = function _addLinkedListItem(parent, child, firstProp, lastProp, sortBy) {
	if (firstProp === void 0) firstProp = "_first";
	if (lastProp === void 0) lastProp = "_last";
	var prev = parent[lastProp], t;
	if (sortBy) {
		t = child[sortBy];
		while (prev && prev[sortBy] > t) prev = prev._prev;
	}
	if (prev) {
		child._next = prev._next;
		prev._next = child;
	} else {
		child._next = parent[firstProp];
		parent[firstProp] = child;
	}
	if (child._next) child._next._prev = child;
	else parent[lastProp] = child;
	child._prev = prev;
	child.parent = child._dp = parent;
	return child;
};
var _removeLinkedListItem = function _removeLinkedListItem(parent, child, firstProp, lastProp) {
	if (firstProp === void 0) firstProp = "_first";
	if (lastProp === void 0) lastProp = "_last";
	var prev = child._prev, next = child._next;
	if (prev) prev._next = next;
	else if (parent[firstProp] === child) parent[firstProp] = next;
	if (next) next._prev = prev;
	else if (parent[lastProp] === child) parent[lastProp] = prev;
	child._next = child._prev = child.parent = null;
};
var _removeFromParent = function _removeFromParent(child, onlyIfParentHasAutoRemove) {
	child.parent && (!onlyIfParentHasAutoRemove || child.parent.autoRemoveChildren) && child.parent.remove && child.parent.remove(child);
	child._act = 0;
};
var _uncache = function _uncache(animation, child) {
	if (animation && (!child || child._end > animation._dur || child._start < 0)) {
		var a = animation;
		while (a) {
			a._dirty = 1;
			a = a.parent;
		}
	}
	return animation;
};
var _recacheAncestors = function _recacheAncestors(animation) {
	var parent = animation.parent;
	while (parent && parent.parent) {
		parent._dirty = 1;
		parent.totalDuration();
		parent = parent.parent;
	}
	return animation;
};
var _rewindStartAt = function _rewindStartAt(tween, totalTime, suppressEvents, force) {
	return tween._startAt && (_reverting$1 ? tween._startAt.revert(_revertConfigNoKill) : tween.vars.immediateRender && !tween.vars.autoRevert || tween._startAt.render(totalTime, true, force));
};
var _hasNoPausedAncestors = function _hasNoPausedAncestors(animation) {
	return !animation || animation._ts && _hasNoPausedAncestors(animation.parent);
};
var _elapsedCycleDuration = function _elapsedCycleDuration(animation) {
	return animation._repeat ? _animationCycle(animation._tTime, animation = animation.duration() + animation._rDelay) * animation : 0;
};
var _animationCycle = function _animationCycle(tTime, cycleDuration) {
	var whole = Math.floor(tTime = _roundPrecise(tTime / cycleDuration));
	return tTime && whole === tTime ? whole - 1 : whole;
};
var _parentToChildTotalTime = function _parentToChildTotalTime(parentTime, child) {
	return (parentTime - child._start) * child._ts + (child._ts >= 0 ? 0 : child._dirty ? child.totalDuration() : child._tDur);
};
var _setEnd = function _setEnd(animation) {
	return animation._end = _roundPrecise(animation._start + (animation._tDur / Math.abs(animation._ts || animation._rts || _tinyNum) || 0));
};
var _alignPlayhead = function _alignPlayhead(animation, totalTime) {
	var parent = animation._dp;
	if (parent && parent.smoothChildTiming && animation._ts) {
		animation._start = _roundPrecise(parent._time - (animation._ts > 0 ? totalTime / animation._ts : ((animation._dirty ? animation.totalDuration() : animation._tDur) - totalTime) / -animation._ts));
		_setEnd(animation);
		parent._dirty || _uncache(parent, animation);
	}
	return animation;
};
var _postAddChecks = function _postAddChecks(timeline, child) {
	var t;
	if (child._time || !child._dur && child._initted || child._start < timeline._time && (child._dur || !child.add)) {
		t = _parentToChildTotalTime(timeline.rawTime(), child);
		if (!child._dur || _clamp(0, child.totalDuration(), t) - child._tTime > _tinyNum) child.render(t, true);
	}
	if (_uncache(timeline, child)._dp && timeline._initted && timeline._time >= timeline._dur && timeline._ts) {
		if (timeline._dur < timeline.duration()) {
			t = timeline;
			while (t._dp) {
				t.rawTime() >= 0 && t.totalTime(t._tTime);
				t = t._dp;
			}
		}
		timeline._zTime = -_tinyNum;
	}
};
var _addToTimeline = function _addToTimeline(timeline, child, position, skipChecks) {
	child.parent && _removeFromParent(child);
	child._start = _roundPrecise((_isNumber(position) ? position : position || timeline !== _globalTimeline ? _parsePosition(timeline, position, child) : timeline._time) + child._delay);
	child._end = _roundPrecise(child._start + (child.totalDuration() / Math.abs(child.timeScale()) || 0));
	_addLinkedListItem(timeline, child, "_first", "_last", timeline._sort ? "_start" : 0);
	_isFromOrFromStart(child) || (timeline._recent = child);
	skipChecks || _postAddChecks(timeline, child);
	timeline._ts < 0 && _alignPlayhead(timeline, timeline._tTime);
	return timeline;
};
var _scrollTrigger = function _scrollTrigger(animation, trigger) {
	return (_globals.ScrollTrigger || _missingPlugin("scrollTrigger", trigger)) && _globals.ScrollTrigger.create(trigger, animation);
};
var _attemptInitTween = function _attemptInitTween(tween, time, force, suppressEvents, tTime) {
	_initTween(tween, time, tTime);
	if (!tween._initted) return 1;
	if (!force && tween._pt && !_reverting$1 && (tween._dur && tween.vars.lazy !== false || !tween._dur && tween.vars.lazy) && _lastRenderedFrame !== _ticker.frame) {
		_lazyTweens.push(tween);
		tween._lazy = [tTime, suppressEvents];
		return 1;
	}
};
var _parentPlayheadIsBeforeStart = function _parentPlayheadIsBeforeStart(_ref) {
	var parent = _ref.parent;
	return parent && parent._ts && parent._initted && !parent._lock && (parent.rawTime() < 0 || _parentPlayheadIsBeforeStart(parent));
};
var _isFromOrFromStart = function _isFromOrFromStart(_ref2) {
	var data = _ref2.data;
	return data === "isFromStart" || data === "isStart";
};
var _renderZeroDurationTween = function _renderZeroDurationTween(tween, totalTime, suppressEvents, force) {
	var prevRatio = tween.ratio, ratio = totalTime < 0 || !totalTime && (!tween._start && _parentPlayheadIsBeforeStart(tween) && !(!tween._initted && _isFromOrFromStart(tween)) || (tween._ts < 0 || tween._dp._ts < 0) && !_isFromOrFromStart(tween)) ? 0 : 1, repeatDelay = tween._rDelay, tTime = 0, pt, iteration, prevIteration;
	if (repeatDelay && tween._repeat) {
		tTime = _clamp(0, tween._tDur, totalTime);
		iteration = _animationCycle(tTime, repeatDelay);
		tween._yoyo && iteration & 1 && (ratio = 1 - ratio);
		if (iteration !== _animationCycle(tween._tTime, repeatDelay)) {
			prevRatio = 1 - ratio;
			tween.vars.repeatRefresh && tween._initted && tween.invalidate();
		}
	}
	if (ratio !== prevRatio || _reverting$1 || force || tween._zTime === _tinyNum || !totalTime && tween._zTime) {
		if (!tween._initted && _attemptInitTween(tween, totalTime, force, suppressEvents, tTime)) return;
		prevIteration = tween._zTime;
		tween._zTime = totalTime || (suppressEvents ? _tinyNum : 0);
		suppressEvents || (suppressEvents = totalTime && !prevIteration);
		tween.ratio = ratio;
		tween._from && (ratio = 1 - ratio);
		tween._time = 0;
		tween._tTime = tTime;
		pt = tween._pt;
		while (pt) {
			pt.r(ratio, pt.d);
			pt = pt._next;
		}
		totalTime < 0 && _rewindStartAt(tween, totalTime, suppressEvents, true);
		tween._onUpdate && !suppressEvents && _callback(tween, "onUpdate");
		tTime && tween._repeat && !suppressEvents && tween.parent && _callback(tween, "onRepeat");
		if ((totalTime >= tween._tDur || totalTime < 0) && tween.ratio === ratio) {
			ratio && _removeFromParent(tween, 1);
			if (!suppressEvents && !_reverting$1) {
				_callback(tween, ratio ? "onComplete" : "onReverseComplete", true);
				tween._prom && tween._prom();
			}
		}
	} else if (!tween._zTime) tween._zTime = totalTime;
};
var _findNextPauseTween = function _findNextPauseTween(animation, prevTime, time) {
	var child;
	if (time > prevTime) {
		child = animation._first;
		while (child && child._start <= time) {
			if (child.data === "isPause" && child._start > prevTime) return child;
			child = child._next;
		}
	} else {
		child = animation._last;
		while (child && child._start >= time) {
			if (child.data === "isPause" && child._start < prevTime) return child;
			child = child._prev;
		}
	}
};
var _setDuration = function _setDuration(animation, duration, skipUncache, leavePlayhead) {
	var repeat = animation._repeat, dur = _roundPrecise(duration) || 0, totalProgress = animation._tTime / animation._tDur;
	totalProgress && !leavePlayhead && (animation._time *= dur / animation._dur);
	animation._dur = dur;
	animation._tDur = !repeat ? dur : repeat < 0 ? 1e10 : _roundPrecise(dur * (repeat + 1) + animation._rDelay * repeat);
	totalProgress > 0 && !leavePlayhead && _alignPlayhead(animation, animation._tTime = animation._tDur * totalProgress);
	animation.parent && _setEnd(animation);
	skipUncache || _uncache(animation.parent, animation);
	return animation;
};
var _onUpdateTotalDuration = function _onUpdateTotalDuration(animation) {
	return animation instanceof Timeline ? _uncache(animation) : _setDuration(animation, animation._dur);
};
var _zeroPosition = {
	_start: 0,
	endTime: _emptyFunc,
	totalDuration: _emptyFunc
};
var _parsePosition = function _parsePosition(animation, position, percentAnimation) {
	var labels = animation.labels, recent = animation._recent || _zeroPosition, clippedDuration = animation.duration() >= _bigNum$1 ? recent.endTime(false) : animation._dur, i, offset, isPercent;
	if (_isString(position) && (isNaN(position) || position in labels)) {
		offset = position.charAt(0);
		isPercent = position.substr(-1) === "%";
		i = position.indexOf("=");
		if (offset === "<" || offset === ">") {
			i >= 0 && (position = position.replace(/=/, ""));
			return (offset === "<" ? recent._start : recent.endTime(recent._repeat >= 0)) + (parseFloat(position.substr(1)) || 0) * (isPercent ? (i < 0 ? recent : percentAnimation).totalDuration() / 100 : 1);
		}
		if (i < 0) {
			position in labels || (labels[position] = clippedDuration);
			return labels[position];
		}
		offset = parseFloat(position.charAt(i - 1) + position.substr(i + 1));
		if (isPercent && percentAnimation) offset = offset / 100 * (_isArray(percentAnimation) ? percentAnimation[0] : percentAnimation).totalDuration();
		return i > 1 ? _parsePosition(animation, position.substr(0, i - 1), percentAnimation) + offset : clippedDuration + offset;
	}
	return position == null ? clippedDuration : +position;
};
var _createTweenType = function _createTweenType(type, params, timeline) {
	var isLegacy = _isNumber(params[1]), varsIndex = (isLegacy ? 2 : 1) + (type < 2 ? 0 : 1), vars = params[varsIndex], irVars, parent;
	isLegacy && (vars.duration = params[1]);
	vars.parent = timeline;
	if (type) {
		irVars = vars;
		parent = timeline;
		while (parent && !("immediateRender" in irVars)) {
			irVars = parent.vars.defaults || {};
			parent = _isNotFalse(parent.vars.inherit) && parent.parent;
		}
		vars.immediateRender = _isNotFalse(irVars.immediateRender);
		type < 2 ? vars.runBackwards = 1 : vars.startAt = params[varsIndex - 1];
	}
	return new Tween(params[0], vars, params[varsIndex + 1]);
};
var _conditionalReturn = function _conditionalReturn(value, func) {
	return value || value === 0 ? func(value) : func;
};
var _clamp = function _clamp(min, max, value) {
	return value < min ? min : value > max ? max : value;
};
var getUnit = function getUnit(value, v) {
	return !_isString(value) || !(v = _unitExp.exec(value)) ? "" : v[1];
};
var clamp = function clamp(min, max, value) {
	return _conditionalReturn(value, function(v) {
		return _clamp(min, max, v);
	});
};
var _slice = [].slice;
var _isArrayLike = function _isArrayLike(value, nonEmpty) {
	return value && _isObject(value) && "length" in value && (!nonEmpty && !value.length || value.length - 1 in value && _isObject(value[0])) && !value.nodeType && value !== _win$1;
};
var _flatten = function _flatten(ar, leaveStrings, accumulator) {
	if (accumulator === void 0) accumulator = [];
	return ar.forEach(function(value) {
		var _accumulator;
		return _isString(value) && !leaveStrings || _isArrayLike(value, 1) ? (_accumulator = accumulator).push.apply(_accumulator, toArray(value)) : accumulator.push(value);
	}) || accumulator;
};
var toArray = function toArray(value, scope, leaveStrings) {
	return _context && !scope && _context.selector ? _context.selector(value) : _isString(value) && !leaveStrings && (_coreInitted || !_wake()) ? _slice.call((scope || _doc$1).querySelectorAll(value), 0) : _isArray(value) ? _flatten(value, leaveStrings) : _isArrayLike(value) ? _slice.call(value, 0) : value ? [value] : [];
};
var selector = function selector(value) {
	value = toArray(value)[0] || _warn("Invalid scope") || {};
	return function(v) {
		var el = value.current || value.nativeElement || value;
		return toArray(v, el.querySelectorAll ? el : el === value ? _warn("Invalid scope") || _doc$1.createElement("div") : value);
	};
};
var shuffle = function shuffle(a) {
	return a.sort(function() {
		return .5 - Math.random();
	});
};
var distribute = function distribute(v) {
	if (_isFunction(v)) return v;
	var vars = _isObject(v) ? v : { each: v }, ease = _parseEase(vars.ease), from = vars.from || 0, base = parseFloat(vars.base) || 0, cache = {}, isDecimal = from > 0 && from < 1, ratios = isNaN(from) || isDecimal, axis = vars.axis, ratioX = from, ratioY = from;
	if (_isString(from)) ratioX = ratioY = {
		center: .5,
		edges: .5,
		end: 1
	}[from] || 0;
	else if (!isDecimal && ratios) {
		ratioX = from[0];
		ratioY = from[1];
	}
	return function(i, target, a) {
		var l = (a || vars).length, distances = cache[l], originX, originY, x, y, d, j, max, min, wrapAt;
		if (!distances) {
			wrapAt = vars.grid === "auto" ? 0 : (vars.grid || [1, _bigNum$1])[1];
			if (!wrapAt) {
				max = -_bigNum$1;
				while (max < (max = a[wrapAt++].getBoundingClientRect().left) && wrapAt < l);
				wrapAt < l && wrapAt--;
			}
			distances = cache[l] = [];
			originX = ratios ? Math.min(wrapAt, l) * ratioX - .5 : from % wrapAt;
			originY = wrapAt === _bigNum$1 ? 0 : ratios ? l * ratioY / wrapAt - .5 : from / wrapAt | 0;
			max = 0;
			min = _bigNum$1;
			for (j = 0; j < l; j++) {
				x = j % wrapAt - originX;
				y = originY - (j / wrapAt | 0);
				distances[j] = d = !axis ? _sqrt(x * x + y * y) : Math.abs(axis === "y" ? y : x);
				d > max && (max = d);
				d < min && (min = d);
			}
			from === "random" && shuffle(distances);
			distances.max = max - min;
			distances.min = min;
			distances.v = l = (parseFloat(vars.amount) || parseFloat(vars.each) * (wrapAt > l ? l - 1 : !axis ? Math.max(wrapAt, l / wrapAt) : axis === "y" ? l / wrapAt : wrapAt) || 0) * (from === "edges" ? -1 : 1);
			distances.b = l < 0 ? base - l : base;
			distances.u = getUnit(vars.amount || vars.each) || 0;
			ease = ease && l < 0 ? _invertEase(ease) : ease;
		}
		l = (distances[i] - distances.min) / distances.max || 0;
		return _roundPrecise(distances.b + (ease ? ease(l) : l) * distances.v) + distances.u;
	};
};
var _roundModifier = function _roundModifier(v) {
	var p = Math.pow(10, ((v + "").split(".")[1] || "").length);
	return function(raw) {
		var n = _roundPrecise(Math.round(parseFloat(raw) / v) * v * p);
		return (n - n % 1) / p + (_isNumber(raw) ? 0 : getUnit(raw));
	};
};
var snap = function snap(snapTo, value) {
	var isArray = _isArray(snapTo), radius, is2D;
	if (!isArray && _isObject(snapTo)) {
		radius = isArray = snapTo.radius || _bigNum$1;
		if (snapTo.values) {
			snapTo = toArray(snapTo.values);
			if (is2D = !_isNumber(snapTo[0])) radius *= radius;
		} else snapTo = _roundModifier(snapTo.increment);
	}
	return _conditionalReturn(value, !isArray ? _roundModifier(snapTo) : _isFunction(snapTo) ? function(raw) {
		is2D = snapTo(raw);
		return Math.abs(is2D - raw) <= radius ? is2D : raw;
	} : function(raw) {
		var x = parseFloat(is2D ? raw.x : raw), y = parseFloat(is2D ? raw.y : 0), min = _bigNum$1, closest = 0, i = snapTo.length, dx, dy;
		while (i--) {
			if (is2D) {
				dx = snapTo[i].x - x;
				dy = snapTo[i].y - y;
				dx = dx * dx + dy * dy;
			} else dx = Math.abs(snapTo[i] - x);
			if (dx < min) {
				min = dx;
				closest = i;
			}
		}
		closest = !radius || min <= radius ? snapTo[closest] : raw;
		return is2D || closest === raw || _isNumber(raw) ? closest : closest + getUnit(raw);
	});
};
var random = function random(min, max, roundingIncrement, returnFunction) {
	return _conditionalReturn(_isArray(min) ? !max : roundingIncrement === true ? !!(roundingIncrement = 0) : !returnFunction, function() {
		return _isArray(min) ? min[~~(Math.random() * min.length)] : (roundingIncrement = roundingIncrement || 1e-5) && (returnFunction = roundingIncrement < 1 ? Math.pow(10, (roundingIncrement + "").length - 2) : 1) && Math.floor(Math.round((min - roundingIncrement / 2 + Math.random() * (max - min + roundingIncrement * .99)) / roundingIncrement) * roundingIncrement * returnFunction) / returnFunction;
	});
};
var pipe = function pipe() {
	for (var _len = arguments.length, functions = new Array(_len), _key = 0; _key < _len; _key++) functions[_key] = arguments[_key];
	return function(value) {
		return functions.reduce(function(v, f) {
			return f(v);
		}, value);
	};
};
var unitize = function unitize(func, unit) {
	return function(value) {
		return func(parseFloat(value)) + (unit || getUnit(value));
	};
};
var normalize = function normalize(min, max, value) {
	return mapRange(min, max, 0, 1, value);
};
var _wrapArray = function _wrapArray(a, wrapper, value) {
	return _conditionalReturn(value, function(index) {
		return a[~~wrapper(index)];
	});
};
var wrap = function wrap(min, max, value) {
	var range = max - min;
	return _isArray(min) ? _wrapArray(min, wrap(0, min.length), max) : _conditionalReturn(value, function(value) {
		return (range + (value - min) % range) % range + min;
	});
};
var wrapYoyo = function wrapYoyo(min, max, value) {
	var range = max - min, total = range * 2;
	return _isArray(min) ? _wrapArray(min, wrapYoyo(0, min.length - 1), max) : _conditionalReturn(value, function(value) {
		value = (total + (value - min) % total) % total || 0;
		return min + (value > range ? total - value : value);
	});
};
var _replaceRandom = function _replaceRandom(s) {
	return s.replace(_randomExp, function(match) {
		var arIndex = match.indexOf("[") + 1, values = match.substring(arIndex || 7, arIndex ? match.indexOf("]") : match.length - 1).split(_commaDelimExp);
		return random(arIndex ? values : +values[0], arIndex ? 0 : +values[1], +values[2] || 1e-5);
	});
};
var mapRange = function mapRange(inMin, inMax, outMin, outMax, value) {
	var inRange = inMax - inMin, outRange = outMax - outMin;
	return _conditionalReturn(value, function(value) {
		return outMin + ((value - inMin) / inRange * outRange || 0);
	});
};
var interpolate = function interpolate(start, end, progress, mutate) {
	var func = isNaN(start + end) ? 0 : function(p) {
		return (1 - p) * start + p * end;
	};
	if (!func) {
		var isString = _isString(start), master = {}, p, i, interpolators, l, il;
		progress === true && (mutate = 1) && (progress = null);
		if (isString) {
			start = { p: start };
			end = { p: end };
		} else if (_isArray(start) && !_isArray(end)) {
			interpolators = [];
			l = start.length;
			il = l - 2;
			for (i = 1; i < l; i++) interpolators.push(interpolate(start[i - 1], start[i]));
			l--;
			func = function func(p) {
				p *= l;
				var i = Math.min(il, ~~p);
				return interpolators[i](p - i);
			};
			progress = end;
		} else if (!mutate) start = _merge(_isArray(start) ? [] : {}, start);
		if (!interpolators) {
			for (p in end) _addPropTween.call(master, start, p, "get", end[p]);
			func = function func(p) {
				return _renderPropTweens(p, master) || (isString ? start.p : start);
			};
		}
	}
	return _conditionalReturn(progress, func);
};
var _getLabelInDirection = function _getLabelInDirection(timeline, fromTime, backward) {
	var labels = timeline.labels, min = _bigNum$1, p, distance, label;
	for (p in labels) {
		distance = labels[p] - fromTime;
		if (distance < 0 === !!backward && distance && min > (distance = Math.abs(distance))) {
			label = p;
			min = distance;
		}
	}
	return label;
};
var _callback = function _callback(animation, type, executeLazyFirst) {
	var v = animation.vars, callback = v[type], prevContext = _context, context = animation._ctx, params, scope, result;
	if (!callback) return;
	params = v[type + "Params"];
	scope = v.callbackScope || animation;
	executeLazyFirst && _lazyTweens.length && _lazyRender();
	context && (_context = context);
	result = params ? callback.apply(scope, params) : callback.call(scope);
	_context = prevContext;
	return result;
};
var _interrupt = function _interrupt(animation) {
	_removeFromParent(animation);
	animation.scrollTrigger && animation.scrollTrigger.kill(!!_reverting$1);
	animation.progress() < 1 && _callback(animation, "onInterrupt");
	return animation;
};
var _quickTween;
var _registerPluginQueue = [];
var _createPlugin = function _createPlugin(config) {
	if (!config) return;
	config = !config.name && config["default"] || config;
	if (_windowExists$1() || config.headless) {
		var name = config.name, isFunc = _isFunction(config), Plugin = name && !isFunc && config.init ? function() {
			this._props = [];
		} : config, instanceDefaults = {
			init: _emptyFunc,
			render: _renderPropTweens,
			add: _addPropTween,
			kill: _killPropTweensOf,
			modifier: _addPluginModifier,
			rawVars: 0
		}, statics = {
			targetTest: 0,
			get: 0,
			getSetter: _getSetter,
			aliases: {},
			register: 0
		};
		_wake();
		if (config !== Plugin) {
			if (_plugins[name]) return;
			_setDefaults(Plugin, _setDefaults(_copyExcluding(config, instanceDefaults), statics));
			_merge(Plugin.prototype, _merge(instanceDefaults, _copyExcluding(config, statics)));
			_plugins[Plugin.prop = name] = Plugin;
			if (config.targetTest) {
				_harnessPlugins.push(Plugin);
				_reservedProps[name] = 1;
			}
			name = (name === "css" ? "CSS" : name.charAt(0).toUpperCase() + name.substr(1)) + "Plugin";
		}
		_addGlobal(name, Plugin);
		config.register && config.register(gsap, Plugin, PropTween);
	} else _registerPluginQueue.push(config);
};
var _255 = 255;
var _colorLookup = {
	aqua: [
		0,
		_255,
		_255
	],
	lime: [
		0,
		_255,
		0
	],
	silver: [
		192,
		192,
		192
	],
	black: [
		0,
		0,
		0
	],
	maroon: [
		128,
		0,
		0
	],
	teal: [
		0,
		128,
		128
	],
	blue: [
		0,
		0,
		_255
	],
	navy: [
		0,
		0,
		128
	],
	white: [
		_255,
		_255,
		_255
	],
	olive: [
		128,
		128,
		0
	],
	yellow: [
		_255,
		_255,
		0
	],
	orange: [
		_255,
		165,
		0
	],
	gray: [
		128,
		128,
		128
	],
	purple: [
		128,
		0,
		128
	],
	green: [
		0,
		128,
		0
	],
	red: [
		_255,
		0,
		0
	],
	pink: [
		_255,
		192,
		203
	],
	cyan: [
		0,
		_255,
		_255
	],
	transparent: [
		_255,
		_255,
		_255,
		0
	]
};
var _hue = function _hue(h, m1, m2) {
	h += h < 0 ? 1 : h > 1 ? -1 : 0;
	return (h * 6 < 1 ? m1 + (m2 - m1) * h * 6 : h < .5 ? m2 : h * 3 < 2 ? m1 + (m2 - m1) * (2 / 3 - h) * 6 : m1) * _255 + .5 | 0;
};
var splitColor = function splitColor(v, toHSL, forceAlpha) {
	var a = !v ? _colorLookup.black : _isNumber(v) ? [
		v >> 16,
		v >> 8 & _255,
		v & _255
	] : 0, r, g, b, h, s, l, max, min, d, wasHSL;
	if (!a) {
		if (v.substr(-1) === ",") v = v.substr(0, v.length - 1);
		if (_colorLookup[v]) a = _colorLookup[v];
		else if (v.charAt(0) === "#") {
			if (v.length < 6) {
				r = v.charAt(1);
				g = v.charAt(2);
				b = v.charAt(3);
				v = "#" + r + r + g + g + b + b + (v.length === 5 ? v.charAt(4) + v.charAt(4) : "");
			}
			if (v.length === 9) {
				a = parseInt(v.substr(1, 6), 16);
				return [
					a >> 16,
					a >> 8 & _255,
					a & _255,
					parseInt(v.substr(7), 16) / 255
				];
			}
			v = parseInt(v.substr(1), 16);
			a = [
				v >> 16,
				v >> 8 & _255,
				v & _255
			];
		} else if (v.substr(0, 3) === "hsl") {
			a = wasHSL = v.match(_strictNumExp);
			if (!toHSL) {
				h = +a[0] % 360 / 360;
				s = +a[1] / 100;
				l = +a[2] / 100;
				g = l <= .5 ? l * (s + 1) : l + s - l * s;
				r = l * 2 - g;
				a.length > 3 && (a[3] *= 1);
				a[0] = _hue(h + 1 / 3, r, g);
				a[1] = _hue(h, r, g);
				a[2] = _hue(h - 1 / 3, r, g);
			} else if (~v.indexOf("=")) {
				a = v.match(_numExp);
				forceAlpha && a.length < 4 && (a[3] = 1);
				return a;
			}
		} else a = v.match(_strictNumExp) || _colorLookup.transparent;
		a = a.map(Number);
	}
	if (toHSL && !wasHSL) {
		r = a[0] / _255;
		g = a[1] / _255;
		b = a[2] / _255;
		max = Math.max(r, g, b);
		min = Math.min(r, g, b);
		l = (max + min) / 2;
		if (max === min) h = s = 0;
		else {
			d = max - min;
			s = l > .5 ? d / (2 - max - min) : d / (max + min);
			h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
			h *= 60;
		}
		a[0] = ~~(h + .5);
		a[1] = ~~(s * 100 + .5);
		a[2] = ~~(l * 100 + .5);
	}
	forceAlpha && a.length < 4 && (a[3] = 1);
	return a;
};
var _colorOrderData = function _colorOrderData(v) {
	var values = [], c = [], i = -1;
	v.split(_colorExp).forEach(function(v) {
		var a = v.match(_numWithUnitExp) || [];
		values.push.apply(values, a);
		c.push(i += a.length + 1);
	});
	values.c = c;
	return values;
};
var _formatColors = function _formatColors(s, toHSL, orderMatchData) {
	var result = "", colors = (s + result).match(_colorExp), type = toHSL ? "hsla(" : "rgba(", i = 0, c, shell, d, l;
	if (!colors) return s;
	colors = colors.map(function(color) {
		return (color = splitColor(color, toHSL, 1)) && type + (toHSL ? color[0] + "," + color[1] + "%," + color[2] + "%," + color[3] : color.join(",")) + ")";
	});
	if (orderMatchData) {
		d = _colorOrderData(s);
		c = orderMatchData.c;
		if (c.join(result) !== d.c.join(result)) {
			shell = s.replace(_colorExp, "1").split(_numWithUnitExp);
			l = shell.length - 1;
			for (; i < l; i++) result += shell[i] + (~c.indexOf(i) ? colors.shift() || type + "0,0,0,0)" : (d.length ? d : colors.length ? colors : orderMatchData).shift());
		}
	}
	if (!shell) {
		shell = s.split(_colorExp);
		l = shell.length - 1;
		for (; i < l; i++) result += shell[i] + colors[i];
	}
	return result + shell[l];
};
var _colorExp = function() {
	var s = "(?:\\b(?:(?:rgb|rgba|hsl|hsla)\\(.+?\\))|\\B#(?:[0-9a-f]{3,4}){1,2}\\b", p;
	for (p in _colorLookup) s += "|" + p + "\\b";
	return new RegExp(s + ")", "gi");
}();
var _hslExp = /hsl[a]?\(/;
var _colorStringFilter = function _colorStringFilter(a) {
	var combined = a.join(" "), toHSL;
	_colorExp.lastIndex = 0;
	if (_colorExp.test(combined)) {
		toHSL = _hslExp.test(combined);
		a[1] = _formatColors(a[1], toHSL);
		a[0] = _formatColors(a[0], toHSL, _colorOrderData(a[1]));
		return true;
	}
};
var _tickerActive;
var _ticker = function() {
	var _getTime = Date.now, _lagThreshold = 500, _adjustedLag = 33, _startTime = _getTime(), _lastUpdate = _startTime, _gap = 1e3 / 240, _nextTime = _gap, _listeners = [], _id, _req, _raf, _self, _delta, _i, _tick = function _tick(v) {
		var elapsed = _getTime() - _lastUpdate, manual = v === true, overlap, dispatch, time, frame;
		(elapsed > _lagThreshold || elapsed < 0) && (_startTime += elapsed - _adjustedLag);
		_lastUpdate += elapsed;
		time = _lastUpdate - _startTime;
		overlap = time - _nextTime;
		if (overlap > 0 || manual) {
			frame = ++_self.frame;
			_delta = time - _self.time * 1e3;
			_self.time = time = time / 1e3;
			_nextTime += overlap + (overlap >= _gap ? 4 : _gap - overlap);
			dispatch = 1;
		}
		manual || (_id = _req(_tick));
		if (dispatch) for (_i = 0; _i < _listeners.length; _i++) _listeners[_i](time, _delta, frame, v);
	};
	_self = {
		time: 0,
		frame: 0,
		tick: function tick() {
			_tick(true);
		},
		deltaRatio: function deltaRatio(fps) {
			return _delta / (1e3 / (fps || 60));
		},
		wake: function wake() {
			if (_coreReady) {
				if (!_coreInitted && _windowExists$1()) {
					_win$1 = _coreInitted = window;
					_doc$1 = _win$1.document || {};
					_globals.gsap = gsap;
					(_win$1.gsapVersions || (_win$1.gsapVersions = [])).push(gsap.version);
					_install(_installScope || _win$1.GreenSockGlobals || !_win$1.gsap && _win$1 || {});
					_registerPluginQueue.forEach(_createPlugin);
				}
				_raf = typeof requestAnimationFrame !== "undefined" && requestAnimationFrame;
				_id && _self.sleep();
				_req = _raf || function(f) {
					return setTimeout(f, _nextTime - _self.time * 1e3 + 1 | 0);
				};
				_tickerActive = 1;
				_tick(2);
			}
		},
		sleep: function sleep() {
			(_raf ? cancelAnimationFrame : clearTimeout)(_id);
			_tickerActive = 0;
			_req = _emptyFunc;
		},
		lagSmoothing: function lagSmoothing(threshold, adjustedLag) {
			_lagThreshold = threshold || Infinity;
			_adjustedLag = Math.min(adjustedLag || 33, _lagThreshold);
		},
		fps: function fps(_fps) {
			_gap = 1e3 / (_fps || 240);
			_nextTime = _self.time * 1e3 + _gap;
		},
		add: function add(callback, once, prioritize) {
			var func = once ? function(t, d, f, v) {
				callback(t, d, f, v);
				_self.remove(func);
			} : callback;
			_self.remove(callback);
			_listeners[prioritize ? "unshift" : "push"](func);
			_wake();
			return func;
		},
		remove: function remove(callback, i) {
			~(i = _listeners.indexOf(callback)) && _listeners.splice(i, 1) && _i >= i && _i--;
		},
		_listeners
	};
	return _self;
}();
var _wake = function _wake() {
	return !_tickerActive && _ticker.wake();
};
var _easeMap = {};
var _customEaseExp = /^[\d.\-M][\d.\-,\s]/;
var _quotesExp = /["']/g;
var _parseObjectInString = function _parseObjectInString(value) {
	var obj = {}, split = value.substr(1, value.length - 3).split(":"), key = split[0], i = 1, l = split.length, index, val, parsedVal;
	for (; i < l; i++) {
		val = split[i];
		index = i !== l - 1 ? val.lastIndexOf(",") : val.length;
		parsedVal = val.substr(0, index);
		obj[key] = isNaN(parsedVal) ? parsedVal.replace(_quotesExp, "").trim() : +parsedVal;
		key = val.substr(index + 1).trim();
	}
	return obj;
};
var _valueInParentheses = function _valueInParentheses(value) {
	var open = value.indexOf("(") + 1, close = value.indexOf(")"), nested = value.indexOf("(", open);
	return value.substring(open, ~nested && nested < close ? value.indexOf(")", close + 1) : close);
};
var _configEaseFromString = function _configEaseFromString(name) {
	var split = (name + "").split("("), ease = _easeMap[split[0]];
	return ease && split.length > 1 && ease.config ? ease.config.apply(null, ~name.indexOf("{") ? [_parseObjectInString(split[1])] : _valueInParentheses(name).split(",").map(_numericIfPossible)) : _easeMap._CE && _customEaseExp.test(name) ? _easeMap._CE("", name) : ease;
};
var _invertEase = function _invertEase(ease) {
	return function(p) {
		return 1 - ease(1 - p);
	};
};
var _parseEase = function _parseEase(ease, defaultEase) {
	return !ease ? defaultEase : (_isFunction(ease) ? ease : _easeMap[ease] || _configEaseFromString(ease)) || defaultEase;
};
var _insertEase = function _insertEase(names, easeIn, easeOut, easeInOut) {
	if (easeOut === void 0) easeOut = function easeOut(p) {
		return 1 - easeIn(1 - p);
	};
	if (easeInOut === void 0) easeInOut = function easeInOut(p) {
		return p < .5 ? easeIn(p * 2) / 2 : 1 - easeIn((1 - p) * 2) / 2;
	};
	var ease = {
		easeIn,
		easeOut,
		easeInOut
	}, lowercaseName;
	_forEachName(names, function(name) {
		_easeMap[name] = _globals[name] = ease;
		_easeMap[lowercaseName = name.toLowerCase()] = easeOut;
		for (var p in ease) _easeMap[lowercaseName + (p === "easeIn" ? ".in" : p === "easeOut" ? ".out" : ".inOut")] = _easeMap[name + "." + p] = ease[p];
	});
	return ease;
};
var _easeInOutFromOut = function _easeInOutFromOut(easeOut) {
	return function(p) {
		return p < .5 ? (1 - easeOut(1 - p * 2)) / 2 : .5 + easeOut((p - .5) * 2) / 2;
	};
};
var _configElastic = function _configElastic(type, amplitude, period) {
	var p1 = amplitude >= 1 ? amplitude : 1, p2 = (period || (type ? .3 : .45)) / (amplitude < 1 ? amplitude : 1), p3 = p2 / _2PI * (Math.asin(1 / p1) || 0), easeOut = function easeOut(p) {
		return p === 1 ? 1 : p1 * Math.pow(2, -10 * p) * _sin((p - p3) * p2) + 1;
	}, ease = type === "out" ? easeOut : type === "in" ? function(p) {
		return 1 - easeOut(1 - p);
	} : _easeInOutFromOut(easeOut);
	p2 = _2PI / p2;
	ease.config = function(amplitude, period) {
		return _configElastic(type, amplitude, period);
	};
	return ease;
};
var _configBack = function _configBack(type, overshoot) {
	if (overshoot === void 0) overshoot = 1.70158;
	var easeOut = function easeOut(p) {
		return p ? --p * p * ((overshoot + 1) * p + overshoot) + 1 : 0;
	}, ease = type === "out" ? easeOut : type === "in" ? function(p) {
		return 1 - easeOut(1 - p);
	} : _easeInOutFromOut(easeOut);
	ease.config = function(overshoot) {
		return _configBack(type, overshoot);
	};
	return ease;
};
_forEachName("Linear,Quad,Cubic,Quart,Quint,Strong", function(name, i) {
	var power = i < 5 ? i + 1 : i;
	_insertEase(name + ",Power" + (power - 1), i ? function(p) {
		return Math.pow(p, power);
	} : function(p) {
		return p;
	}, function(p) {
		return 1 - Math.pow(1 - p, power);
	}, function(p) {
		return p < .5 ? Math.pow(p * 2, power) / 2 : 1 - Math.pow((1 - p) * 2, power) / 2;
	});
});
_easeMap.Linear.easeNone = _easeMap.none = _easeMap.Linear.easeIn;
_insertEase("Elastic", _configElastic("in"), _configElastic("out"), _configElastic());
(function(n, c) {
	var n1 = 1 / c, n2 = 2 * n1, n3 = 2.5 * n1, easeOut = function easeOut(p) {
		return p < n1 ? n * p * p : p < n2 ? n * Math.pow(p - 1.5 / c, 2) + .75 : p < n3 ? n * (p -= 2.25 / c) * p + .9375 : n * Math.pow(p - 2.625 / c, 2) + .984375;
	};
	_insertEase("Bounce", function(p) {
		return 1 - easeOut(1 - p);
	}, easeOut);
})(7.5625, 2.75);
_insertEase("Expo", function(p) {
	return Math.pow(2, 10 * (p - 1)) * p + p * p * p * p * p * p * (1 - p);
});
_insertEase("Circ", function(p) {
	return -(_sqrt(1 - p * p) - 1);
});
_insertEase("Sine", function(p) {
	return p === 1 ? 1 : -_cos(p * _HALF_PI) + 1;
});
_insertEase("Back", _configBack("in"), _configBack("out"), _configBack());
_easeMap.SteppedEase = _easeMap.steps = _globals.SteppedEase = { config: function config(steps, immediateStart) {
	if (steps === void 0) steps = 1;
	var p1 = 1 / steps, p2 = steps + (immediateStart ? 0 : 1), p3 = immediateStart ? 1 : 0, max = 1 - _tinyNum;
	return function(p) {
		return ((p2 * _clamp(0, max, p) | 0) + p3) * p1;
	};
} };
_defaults.ease = _easeMap["quad.out"];
_forEachName("onComplete,onUpdate,onStart,onRepeat,onReverseComplete,onInterrupt", function(name) {
	return _callbackNames += name + "," + name + "Params,";
});
var GSCache = function GSCache(target, harness) {
	this.id = _gsID++;
	target._gsap = this;
	this.target = target;
	this.harness = harness;
	this.get = harness ? harness.get : _getProperty;
	this.set = harness ? harness.getSetter : _getSetter;
};
var Animation = /*#__PURE__*/ function() {
	function Animation(vars) {
		this.vars = vars;
		this._delay = +vars.delay || 0;
		if (this._repeat = vars.repeat === Infinity ? -2 : vars.repeat || 0) {
			this._rDelay = vars.repeatDelay || 0;
			this._yoyo = !!vars.yoyo || !!vars.yoyoEase;
		}
		this._ts = 1;
		_setDuration(this, +vars.duration, 1, 1);
		this.data = vars.data;
		if (_context) {
			this._ctx = _context;
			_context.data.push(this);
		}
		_tickerActive || _ticker.wake();
	}
	var _proto = Animation.prototype;
	_proto.delay = function delay(value) {
		if (value || value === 0) {
			this.parent && this.parent.smoothChildTiming && this.startTime(this._start + value - this._delay);
			this._delay = value;
			return this;
		}
		return this._delay;
	};
	_proto.duration = function duration(value) {
		return arguments.length ? this.totalDuration(this._repeat > 0 ? value + (value + this._rDelay) * this._repeat : value) : this.totalDuration() && this._dur;
	};
	_proto.totalDuration = function totalDuration(value) {
		if (!arguments.length) return this._tDur;
		this._dirty = 0;
		return _setDuration(this, this._repeat < 0 ? value : (value - this._repeat * this._rDelay) / (this._repeat + 1));
	};
	_proto.totalTime = function totalTime(_totalTime, suppressEvents) {
		_wake();
		if (!arguments.length) return this._tTime;
		var parent = this._dp;
		if (parent && parent.smoothChildTiming && this._ts) {
			_alignPlayhead(this, _totalTime);
			!parent._dp || parent.parent || _postAddChecks(parent, this);
			while (parent && parent.parent) {
				if (parent.parent._time !== parent._start + (parent._ts >= 0 ? parent._tTime / parent._ts : (parent.totalDuration() - parent._tTime) / -parent._ts)) parent.totalTime(parent._tTime, true);
				parent = parent.parent;
			}
			if (!this.parent && this._dp.autoRemoveChildren && (this._ts > 0 && _totalTime < this._tDur || this._ts < 0 && _totalTime > 0 || !this._tDur && !_totalTime)) _addToTimeline(this._dp, this, this._start - this._delay);
		}
		if (this._tTime !== _totalTime || !this._dur && !suppressEvents || this._initted && Math.abs(this._zTime) === _tinyNum || !this._initted && this._dur && _totalTime || !_totalTime && !this._initted && (this.add || this._ptLookup)) {
			this._ts || (this._pTime = _totalTime);
			_lazySafeRender(this, _totalTime, suppressEvents);
		}
		return this;
	};
	_proto.time = function time(value, suppressEvents) {
		return arguments.length ? this.totalTime(Math.min(this.totalDuration(), value + _elapsedCycleDuration(this)) % (this._dur + this._rDelay) || (value ? this._dur : 0), suppressEvents) : this._time;
	};
	_proto.totalProgress = function totalProgress(value, suppressEvents) {
		return arguments.length ? this.totalTime(this.totalDuration() * value, suppressEvents) : this.totalDuration() ? Math.min(1, this._tTime / this._tDur) : this.rawTime() >= 0 && this._initted ? 1 : 0;
	};
	_proto.progress = function progress(value, suppressEvents) {
		return arguments.length ? this.totalTime(this.duration() * (this._yoyo && !(this.iteration() & 1) ? 1 - value : value) + _elapsedCycleDuration(this), suppressEvents) : this.duration() ? Math.min(1, this._time / this._dur) : this.rawTime() > 0 ? 1 : 0;
	};
	_proto.iteration = function iteration(value, suppressEvents) {
		var cycleDuration = this.duration() + this._rDelay;
		return arguments.length ? this.totalTime(this._time + (value - 1) * cycleDuration, suppressEvents) : this._repeat ? _animationCycle(this._tTime, cycleDuration) + 1 : 1;
	};
	_proto.timeScale = function timeScale(value, suppressEvents) {
		if (!arguments.length) return this._rts === -_tinyNum ? 0 : this._rts;
		if (this._rts === value) return this;
		var tTime = this.parent && this._ts ? _parentToChildTotalTime(this.parent._time, this) : this._tTime;
		this._rts = +value || 0;
		this._ts = this._ps || value === -_tinyNum ? 0 : this._rts;
		this.totalTime(_clamp(-Math.abs(this._delay), this.totalDuration(), tTime), suppressEvents !== false);
		_setEnd(this);
		return _recacheAncestors(this);
	};
	_proto.paused = function paused(value) {
		if (!arguments.length) return this._ps;
		if (this._ps !== value) {
			this._ps = value;
			if (value) {
				this._pTime = this._tTime || Math.max(-this._delay, this.rawTime());
				this._ts = this._act = 0;
			} else {
				_wake();
				this._ts = this._rts;
				this.totalTime(this.parent && !this.parent.smoothChildTiming ? this.rawTime() : this._tTime || this._pTime, this.progress() === 1 && Math.abs(this._zTime) !== _tinyNum && (this._tTime -= _tinyNum));
			}
		}
		return this;
	};
	_proto.startTime = function startTime(value) {
		if (arguments.length) {
			this._start = _roundPrecise(value);
			var parent = this.parent || this._dp;
			parent && (parent._sort || !this.parent) && _addToTimeline(parent, this, this._start - this._delay);
			return this;
		}
		return this._start;
	};
	_proto.endTime = function endTime(includeRepeats) {
		return this._start + (_isNotFalse(includeRepeats) ? this.totalDuration() : this.duration()) / Math.abs(this._ts || 1);
	};
	_proto.rawTime = function rawTime(wrapRepeats) {
		var parent = this.parent || this._dp;
		return !parent ? this._tTime : wrapRepeats && (!this._ts || this._repeat && this._time && this.totalProgress() < 1) ? this._tTime % (this._dur + this._rDelay) : !this._ts ? this._tTime : _parentToChildTotalTime(parent.rawTime(wrapRepeats), this);
	};
	_proto.revert = function revert(config) {
		if (config === void 0) config = _revertConfig;
		var prevIsReverting = _reverting$1;
		_reverting$1 = config;
		if (_isRevertWorthy(this)) {
			this.timeline && this.timeline.revert(config);
			this.totalTime(-.01, config.suppressEvents);
		}
		this.data !== "nested" && config.kill !== false && this.kill();
		_reverting$1 = prevIsReverting;
		return this;
	};
	_proto.globalTime = function globalTime(rawTime) {
		var animation = this, time = arguments.length ? rawTime : animation.rawTime();
		while (animation) {
			time = animation._start + time / (Math.abs(animation._ts) || 1);
			animation = animation._dp;
		}
		return !this.parent && this._sat ? this._sat.globalTime(rawTime) : time;
	};
	_proto.repeat = function repeat(value) {
		if (arguments.length) {
			this._repeat = value === Infinity ? -2 : value;
			return _onUpdateTotalDuration(this);
		}
		return this._repeat === -2 ? Infinity : this._repeat;
	};
	_proto.repeatDelay = function repeatDelay(value) {
		if (arguments.length) {
			var time = this._time;
			this._rDelay = value;
			_onUpdateTotalDuration(this);
			return time ? this.time(time) : this;
		}
		return this._rDelay;
	};
	_proto.yoyo = function yoyo(value) {
		if (arguments.length) {
			this._yoyo = value;
			return this;
		}
		return this._yoyo;
	};
	_proto.seek = function seek(position, suppressEvents) {
		return this.totalTime(_parsePosition(this, position), _isNotFalse(suppressEvents));
	};
	_proto.restart = function restart(includeDelay, suppressEvents) {
		this.play().totalTime(includeDelay ? -this._delay : 0, _isNotFalse(suppressEvents));
		this._dur || (this._zTime = -_tinyNum);
		return this;
	};
	_proto.play = function play(from, suppressEvents) {
		from != null && this.seek(from, suppressEvents);
		return this.reversed(false).paused(false);
	};
	_proto.reverse = function reverse(from, suppressEvents) {
		from != null && this.seek(from || this.totalDuration(), suppressEvents);
		return this.reversed(true).paused(false);
	};
	_proto.pause = function pause(atTime, suppressEvents) {
		atTime != null && this.seek(atTime, suppressEvents);
		return this.paused(true);
	};
	_proto.resume = function resume() {
		return this.paused(false);
	};
	_proto.reversed = function reversed(value) {
		if (arguments.length) {
			!!value !== this.reversed() && this.timeScale(-this._rts || (value ? -_tinyNum : 0));
			return this;
		}
		return this._rts < 0;
	};
	_proto.invalidate = function invalidate() {
		this._initted = this._act = 0;
		this._zTime = -_tinyNum;
		return this;
	};
	_proto.isActive = function isActive() {
		var parent = this.parent || this._dp, start = this._start, rawTime;
		return !!(!parent || this._ts && this._initted && parent.isActive() && (rawTime = parent.rawTime(true)) >= start && rawTime < this.endTime(true) - _tinyNum);
	};
	_proto.eventCallback = function eventCallback(type, callback, params) {
		var vars = this.vars;
		if (arguments.length > 1) {
			if (!callback) delete vars[type];
			else {
				vars[type] = callback;
				params && (vars[type + "Params"] = params);
				type === "onUpdate" && (this._onUpdate = callback);
			}
			return this;
		}
		return vars[type];
	};
	_proto.then = function then(onFulfilled) {
		var self = this, prevProm = self._prom;
		return new Promise(function(resolve) {
			var f = _isFunction(onFulfilled) ? onFulfilled : _passThrough, _resolve = function _resolve() {
				var _then = self.then;
				self.then = null;
				prevProm && prevProm();
				_isFunction(f) && (f = f(self)) && (f.then || f === self) && (self.then = _then);
				resolve(f);
				self.then = _then;
			};
			if (self._initted && self.totalProgress() === 1 && self._ts >= 0 || !self._tTime && self._ts < 0) _resolve();
			else self._prom = _resolve;
		});
	};
	_proto.kill = function kill() {
		_interrupt(this);
	};
	return Animation;
}();
_setDefaults(Animation.prototype, {
	_time: 0,
	_start: 0,
	_end: 0,
	_tTime: 0,
	_tDur: 0,
	_dirty: 0,
	_repeat: 0,
	_yoyo: false,
	parent: null,
	_initted: false,
	_rDelay: 0,
	_ts: 1,
	_dp: 0,
	ratio: 0,
	_zTime: -_tinyNum,
	_prom: 0,
	_ps: false,
	_rts: 1
});
var Timeline = /*#__PURE__*/ function(_Animation) {
	_inheritsLoose(Timeline, _Animation);
	function Timeline(vars, position) {
		var _this;
		if (vars === void 0) vars = {};
		_this = _Animation.call(this, vars) || this;
		_this.labels = {};
		_this.smoothChildTiming = !!vars.smoothChildTiming;
		_this.autoRemoveChildren = !!vars.autoRemoveChildren;
		_this._sort = _isNotFalse(vars.sortChildren);
		_globalTimeline && _addToTimeline(vars.parent || _globalTimeline, _assertThisInitialized(_this), position);
		vars.reversed && _this.reverse();
		vars.paused && _this.paused(true);
		vars.scrollTrigger && _scrollTrigger(_assertThisInitialized(_this), vars.scrollTrigger);
		return _this;
	}
	var _proto2 = Timeline.prototype;
	_proto2.to = function to(targets, vars, position) {
		_createTweenType(0, arguments, this);
		return this;
	};
	_proto2.from = function from(targets, vars, position) {
		_createTweenType(1, arguments, this);
		return this;
	};
	_proto2.fromTo = function fromTo(targets, fromVars, toVars, position) {
		_createTweenType(2, arguments, this);
		return this;
	};
	_proto2.set = function set(targets, vars, position) {
		vars.duration = 0;
		vars.parent = this;
		_inheritDefaults(vars).repeatDelay || (vars.repeat = 0);
		vars.immediateRender = !!vars.immediateRender;
		new Tween(targets, vars, _parsePosition(this, position), 1);
		return this;
	};
	_proto2.call = function call(callback, params, position) {
		return _addToTimeline(this, Tween.delayedCall(0, callback, params), position);
	};
	_proto2.staggerTo = function staggerTo(targets, duration, vars, stagger, position, onCompleteAll, onCompleteAllParams) {
		vars.duration = duration;
		vars.stagger = vars.stagger || stagger;
		vars.onComplete = onCompleteAll;
		vars.onCompleteParams = onCompleteAllParams;
		vars.parent = this;
		new Tween(targets, vars, _parsePosition(this, position));
		return this;
	};
	_proto2.staggerFrom = function staggerFrom(targets, duration, vars, stagger, position, onCompleteAll, onCompleteAllParams) {
		vars.runBackwards = 1;
		_inheritDefaults(vars).immediateRender = _isNotFalse(vars.immediateRender);
		return this.staggerTo(targets, duration, vars, stagger, position, onCompleteAll, onCompleteAllParams);
	};
	_proto2.staggerFromTo = function staggerFromTo(targets, duration, fromVars, toVars, stagger, position, onCompleteAll, onCompleteAllParams) {
		toVars.startAt = fromVars;
		_inheritDefaults(toVars).immediateRender = _isNotFalse(toVars.immediateRender);
		return this.staggerTo(targets, duration, toVars, stagger, position, onCompleteAll, onCompleteAllParams);
	};
	_proto2.render = function render(totalTime, suppressEvents, force) {
		var prevTime = this._time, tDur = this._dirty ? this.totalDuration() : this._tDur, dur = this._dur, tTime = totalTime <= 0 ? 0 : _roundPrecise(totalTime), crossingStart = this._zTime < 0 !== totalTime < 0 && (this._initted || !dur), time, child, next, iteration, cycleDuration, prevPaused, pauseTween, timeScale, prevStart, prevIteration, yoyo, isYoyo;
		this !== _globalTimeline && tTime > tDur && totalTime >= 0 && (tTime = tDur);
		if (tTime !== this._tTime || force || crossingStart) {
			if (prevTime !== this._time && dur) {
				tTime += this._time - prevTime;
				totalTime += this._time - prevTime;
			}
			time = tTime;
			prevStart = this._start;
			timeScale = this._ts;
			prevPaused = !timeScale;
			if (crossingStart) {
				dur || (prevTime = this._zTime);
				(totalTime || !suppressEvents) && (this._zTime = totalTime);
			}
			if (this._repeat) {
				yoyo = this._yoyo;
				cycleDuration = dur + this._rDelay;
				if (this._repeat < -1 && totalTime < 0) return this.totalTime(cycleDuration * 100 + totalTime, suppressEvents, force);
				time = _roundPrecise(tTime % cycleDuration);
				if (tTime === tDur) {
					iteration = this._repeat;
					time = dur;
				} else {
					prevIteration = _roundPrecise(tTime / cycleDuration);
					iteration = ~~prevIteration;
					if (iteration && iteration === prevIteration) {
						time = dur;
						iteration--;
					}
					time > dur && (time = dur);
				}
				prevIteration = _animationCycle(this._tTime, cycleDuration);
				!prevTime && this._tTime && prevIteration !== iteration && this._tTime - prevIteration * cycleDuration - this._dur <= 0 && (prevIteration = iteration);
				if (yoyo && iteration & 1) {
					time = dur - time;
					isYoyo = 1;
				}
				if (iteration !== prevIteration && !this._lock) {
					var rewinding = yoyo && prevIteration & 1, doesWrap = rewinding === (yoyo && iteration & 1);
					iteration < prevIteration && (rewinding = !rewinding);
					prevTime = rewinding ? 0 : tTime % dur ? dur : tTime;
					this._lock = 1;
					this.render(prevTime || (isYoyo ? 0 : _roundPrecise(iteration * cycleDuration)), suppressEvents, !dur)._lock = 0;
					this._tTime = tTime;
					!suppressEvents && this.parent && _callback(this, "onRepeat");
					if (this.vars.repeatRefresh && !isYoyo) {
						this.invalidate()._lock = 1;
						prevIteration = iteration;
					}
					if (prevTime && prevTime !== this._time || prevPaused !== !this._ts || this.vars.onRepeat && !this.parent && !this._act) return this;
					dur = this._dur;
					tDur = this._tDur;
					if (doesWrap) {
						this._lock = 2;
						prevTime = rewinding ? dur : -1e-4;
						this.render(prevTime, true);
						this.vars.repeatRefresh && !isYoyo && this.invalidate();
					}
					this._lock = 0;
					if (!this._ts && !prevPaused) return this;
				}
			}
			if (this._hasPause && !this._forcing && this._lock < 2) {
				pauseTween = _findNextPauseTween(this, _roundPrecise(prevTime), _roundPrecise(time));
				if (pauseTween) tTime -= time - (time = pauseTween._start);
			}
			this._tTime = tTime;
			this._time = time;
			this._act = !!timeScale;
			if (!this._initted) {
				this._onUpdate = this.vars.onUpdate;
				this._initted = 1;
				this._zTime = totalTime;
				prevTime = 0;
			}
			if (!prevTime && tTime && dur && !suppressEvents && !prevIteration) {
				_callback(this, "onStart");
				if (this._tTime !== tTime) return this;
			}
			if (time >= prevTime && totalTime >= 0) {
				child = this._first;
				while (child) {
					next = child._next;
					if ((child._act || time >= child._start) && child._ts && pauseTween !== child) {
						if (child.parent !== this) return this.render(totalTime, suppressEvents, force);
						child.render(child._ts > 0 ? (time - child._start) * child._ts : (child._dirty ? child.totalDuration() : child._tDur) + (time - child._start) * child._ts, suppressEvents, force);
						if (time !== this._time || !this._ts && !prevPaused) {
							pauseTween = 0;
							next && (tTime += this._zTime = -_tinyNum);
							break;
						}
					}
					child = next;
				}
			} else {
				child = this._last;
				var adjustedTime = totalTime < 0 ? totalTime : time;
				while (child) {
					next = child._prev;
					if ((child._act || adjustedTime <= child._end) && child._ts && pauseTween !== child) {
						if (child.parent !== this) return this.render(totalTime, suppressEvents, force);
						child.render(child._ts > 0 ? (adjustedTime - child._start) * child._ts : (child._dirty ? child.totalDuration() : child._tDur) + (adjustedTime - child._start) * child._ts, suppressEvents, force || _reverting$1 && _isRevertWorthy(child));
						if (time !== this._time || !this._ts && !prevPaused) {
							pauseTween = 0;
							next && (tTime += this._zTime = adjustedTime ? -_tinyNum : _tinyNum);
							break;
						}
					}
					child = next;
				}
			}
			if (pauseTween && !suppressEvents) {
				this.pause();
				pauseTween.render(time >= prevTime ? 0 : -_tinyNum)._zTime = time >= prevTime ? 1 : -1;
				if (this._ts) {
					this._start = prevStart;
					_setEnd(this);
					return this.render(totalTime, suppressEvents, force);
				}
			}
			this._onUpdate && !suppressEvents && _callback(this, "onUpdate", true);
			if (tTime === tDur && this._tTime >= this.totalDuration() || !tTime && prevTime) {
				if (prevStart === this._start || Math.abs(timeScale) !== Math.abs(this._ts)) {
					if (!this._lock) {
						(totalTime || !dur) && (tTime === tDur && this._ts > 0 || !tTime && this._ts < 0) && _removeFromParent(this, 1);
						if (!suppressEvents && !(totalTime < 0 && !prevTime) && (tTime || prevTime || !tDur)) {
							_callback(this, tTime === tDur && totalTime >= 0 ? "onComplete" : "onReverseComplete", true);
							this._prom && !(tTime < tDur && this.timeScale() > 0) && this._prom();
						}
					}
				}
			}
		}
		return this;
	};
	_proto2.add = function add(child, position) {
		var _this2 = this;
		_isNumber(position) || (position = _parsePosition(this, position, child));
		if (!(child instanceof Animation)) {
			if (_isArray(child)) {
				child.forEach(function(obj) {
					return _this2.add(obj, position);
				});
				return this;
			}
			if (_isString(child)) return this.addLabel(child, position);
			if (_isFunction(child)) child = Tween.delayedCall(0, child);
			else return this;
		}
		return this !== child ? _addToTimeline(this, child, position) : this;
	};
	_proto2.getChildren = function getChildren(nested, tweens, timelines, ignoreBeforeTime) {
		if (nested === void 0) nested = true;
		if (tweens === void 0) tweens = true;
		if (timelines === void 0) timelines = true;
		if (ignoreBeforeTime === void 0) ignoreBeforeTime = -_bigNum$1;
		var a = [], child = this._first;
		while (child) {
			if (child._start >= ignoreBeforeTime) if (child instanceof Tween) tweens && a.push(child);
			else {
				timelines && a.push(child);
				nested && a.push.apply(a, child.getChildren(true, tweens, timelines));
			}
			child = child._next;
		}
		return a;
	};
	_proto2.getById = function getById(id) {
		var animations = this.getChildren(1, 1, 1), i = animations.length;
		while (i--) if (animations[i].vars.id === id) return animations[i];
	};
	_proto2.remove = function remove(child) {
		if (_isString(child)) return this.removeLabel(child);
		if (_isFunction(child)) return this.killTweensOf(child);
		child.parent === this && _removeLinkedListItem(this, child);
		if (child === this._recent) this._recent = this._last;
		return _uncache(this);
	};
	_proto2.totalTime = function totalTime(_totalTime2, suppressEvents) {
		if (!arguments.length) return this._tTime;
		this._forcing = 1;
		if (!this._dp && this._ts) this._start = _roundPrecise(_ticker.time - (this._ts > 0 ? _totalTime2 / this._ts : (this.totalDuration() - _totalTime2) / -this._ts));
		_Animation.prototype.totalTime.call(this, _totalTime2, suppressEvents);
		this._forcing = 0;
		return this;
	};
	_proto2.addLabel = function addLabel(label, position) {
		this.labels[label] = _parsePosition(this, position);
		return this;
	};
	_proto2.removeLabel = function removeLabel(label) {
		delete this.labels[label];
		return this;
	};
	_proto2.addPause = function addPause(position, callback, params) {
		var t = Tween.delayedCall(0, callback || _emptyFunc, params);
		t.data = "isPause";
		this._hasPause = 1;
		return _addToTimeline(this, t, _parsePosition(this, position));
	};
	_proto2.removePause = function removePause(position) {
		var child = this._first;
		position = _parsePosition(this, position);
		while (child) {
			if (child._start === position && child.data === "isPause") _removeFromParent(child);
			child = child._next;
		}
	};
	_proto2.killTweensOf = function killTweensOf(targets, props, onlyActive) {
		var tweens = this.getTweensOf(targets, onlyActive), i = tweens.length;
		while (i--) _overwritingTween !== tweens[i] && tweens[i].kill(targets, props);
		return this;
	};
	_proto2.getTweensOf = function getTweensOf(targets, onlyActive) {
		var a = [], parsedTargets = toArray(targets), child = this._first, isGlobalTime = _isNumber(onlyActive), children;
		while (child) {
			if (child instanceof Tween) {
				if (_arrayContainsAny(child._targets, parsedTargets) && (isGlobalTime ? (!_overwritingTween || child._initted && child._ts) && child.globalTime(0) <= onlyActive && child.globalTime(child.totalDuration()) > onlyActive : !onlyActive || child.isActive())) a.push(child);
			} else if ((children = child.getTweensOf(parsedTargets, onlyActive)).length) a.push.apply(a, children);
			child = child._next;
		}
		return a;
	};
	_proto2.tweenTo = function tweenTo(position, vars) {
		vars = vars || {};
		var tl = this, endTime = _parsePosition(tl, position), _vars = vars, startAt = _vars.startAt, _onStart = _vars.onStart, onStartParams = _vars.onStartParams, immediateRender = _vars.immediateRender, initted, tween = Tween.to(tl, _setDefaults({
			ease: vars.ease || "none",
			lazy: false,
			immediateRender: false,
			time: endTime,
			overwrite: "auto",
			duration: vars.duration || Math.abs((endTime - (startAt && "time" in startAt ? startAt.time : tl._time)) / tl.timeScale()) || _tinyNum,
			onStart: function onStart() {
				tl.pause();
				if (!initted) {
					var duration = vars.duration || Math.abs((endTime - (startAt && "time" in startAt ? startAt.time : tl._time)) / tl.timeScale());
					tween._dur !== duration && _setDuration(tween, duration, 0, 1).render(tween._time, true, true);
					initted = 1;
				}
				_onStart && _onStart.apply(tween, onStartParams || []);
			}
		}, vars));
		return immediateRender ? tween.render(0) : tween;
	};
	_proto2.tweenFromTo = function tweenFromTo(fromPosition, toPosition, vars) {
		return this.tweenTo(toPosition, _setDefaults({ startAt: { time: _parsePosition(this, fromPosition) } }, vars));
	};
	_proto2.recent = function recent() {
		return this._recent;
	};
	_proto2.nextLabel = function nextLabel(afterTime) {
		if (afterTime === void 0) afterTime = this._time;
		return _getLabelInDirection(this, _parsePosition(this, afterTime));
	};
	_proto2.previousLabel = function previousLabel(beforeTime) {
		if (beforeTime === void 0) beforeTime = this._time;
		return _getLabelInDirection(this, _parsePosition(this, beforeTime), 1);
	};
	_proto2.currentLabel = function currentLabel(value) {
		return arguments.length ? this.seek(value, true) : this.previousLabel(this._time + _tinyNum);
	};
	_proto2.shiftChildren = function shiftChildren(amount, adjustLabels, ignoreBeforeTime) {
		if (ignoreBeforeTime === void 0) ignoreBeforeTime = 0;
		var child = this._first, labels = this.labels, p;
		amount = _roundPrecise(amount);
		while (child) {
			if (child._start >= ignoreBeforeTime) {
				child._start += amount;
				child._end += amount;
			}
			child = child._next;
		}
		if (adjustLabels) {
			for (p in labels) if (labels[p] >= ignoreBeforeTime) labels[p] += amount;
		}
		return _uncache(this);
	};
	_proto2.invalidate = function invalidate(soft) {
		var child = this._first;
		this._lock = 0;
		while (child) {
			child.invalidate(soft);
			child = child._next;
		}
		return _Animation.prototype.invalidate.call(this, soft);
	};
	_proto2.clear = function clear(includeLabels) {
		if (includeLabels === void 0) includeLabels = true;
		var child = this._first, next;
		while (child) {
			next = child._next;
			this.remove(child);
			child = next;
		}
		this._dp && (this._time = this._tTime = this._pTime = 0);
		includeLabels && (this.labels = {});
		return _uncache(this);
	};
	_proto2.totalDuration = function totalDuration(value) {
		var max = 0, self = this, child = self._last, prevStart = _bigNum$1, prev, start, parent;
		if (arguments.length) return self.timeScale((self._repeat < 0 ? self.duration() : self.totalDuration()) / (self.reversed() ? -value : value));
		if (self._dirty) {
			parent = self.parent;
			while (child) {
				prev = child._prev;
				child._dirty && child.totalDuration();
				start = child._start;
				if (start > prevStart && self._sort && child._ts && !self._lock) {
					self._lock = 1;
					_addToTimeline(self, child, start - child._delay, 1)._lock = 0;
				} else prevStart = start;
				if (start < 0 && child._ts) {
					max -= start;
					if (!parent && !self._dp || parent && parent.smoothChildTiming) {
						self._start += _roundPrecise(start / self._ts);
						self._time -= start;
						self._tTime -= start;
					}
					self.shiftChildren(-start, false, -Infinity);
					prevStart = 0;
				}
				child._end > max && child._ts && (max = child._end);
				child = prev;
			}
			_setDuration(self, self === _globalTimeline && self._time > max ? self._time : max, 1, 1);
			self._dirty = 0;
		}
		return self._tDur;
	};
	Timeline.updateRoot = function updateRoot(time) {
		if (_globalTimeline._ts) {
			_lazySafeRender(_globalTimeline, _parentToChildTotalTime(time, _globalTimeline));
			_lastRenderedFrame = _ticker.frame;
		}
		if (_ticker.frame >= _nextGCFrame) {
			_nextGCFrame += _config.autoSleep || 120;
			var child = _globalTimeline._first;
			if (!child || !child._ts) {
				if (_config.autoSleep && _ticker._listeners.length < 2) {
					while (child && !child._ts) child = child._next;
					child || _ticker.sleep();
				}
			}
		}
	};
	return Timeline;
}(Animation);
_setDefaults(Timeline.prototype, {
	_lock: 0,
	_hasPause: 0,
	_forcing: 0
});
var _addComplexStringPropTween = function _addComplexStringPropTween(target, prop, start, end, setter, stringFilter, funcParam) {
	var pt = new PropTween(this._pt, target, prop, 0, 1, _renderComplexString, null, setter), index = 0, matchIndex = 0, result, startNums, color, endNum, chunk, startNum, hasRandom, a;
	pt.b = start;
	pt.e = end;
	start += "";
	end += "";
	if (hasRandom = ~end.indexOf("random(")) end = _replaceRandom(end);
	if (stringFilter) {
		a = [start, end];
		stringFilter(a, target, prop);
		start = a[0];
		end = a[1];
	}
	startNums = start.match(_complexStringNumExp) || [];
	while (result = _complexStringNumExp.exec(end)) {
		endNum = result[0];
		chunk = end.substring(index, result.index);
		if (color) color = (color + 1) % 5;
		else if (chunk.substr(-5) === "rgba(") color = 1;
		if (endNum !== startNums[matchIndex++]) {
			startNum = parseFloat(startNums[matchIndex - 1]) || 0;
			pt._pt = {
				_next: pt._pt,
				p: chunk || matchIndex === 1 ? chunk : ",",
				s: startNum,
				c: endNum.charAt(1) === "=" ? _parseRelative(startNum, endNum) - startNum : parseFloat(endNum) - startNum,
				m: color && color < 4 ? Math.round : 0
			};
			index = _complexStringNumExp.lastIndex;
		}
	}
	pt.c = index < end.length ? end.substring(index, end.length) : "";
	pt.fp = funcParam;
	if (_relExp.test(end) || hasRandom) pt.e = 0;
	this._pt = pt;
	return pt;
};
var _addPropTween = function _addPropTween(target, prop, start, end, index, targets, modifier, stringFilter, funcParam, optional) {
	_isFunction(end) && (end = end(index || 0, target, targets));
	var currentValue = target[prop], parsedStart = start !== "get" ? start : !_isFunction(currentValue) ? currentValue : funcParam ? target[prop.indexOf("set") || !_isFunction(target["get" + prop.substr(3)]) ? prop : "get" + prop.substr(3)](funcParam) : target[prop](), setter = !_isFunction(currentValue) ? _setterPlain : funcParam ? _setterFuncWithParam : _setterFunc, pt;
	if (_isString(end)) {
		if (~end.indexOf("random(")) end = _replaceRandom(end);
		if (end.charAt(1) === "=") {
			pt = _parseRelative(parsedStart, end) + (getUnit(parsedStart) || 0);
			if (pt || pt === 0) end = pt;
		}
	}
	if (!optional || parsedStart !== end || _forceAllPropTweens) {
		if (!isNaN(parsedStart * end) && end !== "") {
			pt = new PropTween(this._pt, target, prop, +parsedStart || 0, end - (parsedStart || 0), typeof currentValue === "boolean" ? _renderBoolean : _renderPlain, 0, setter);
			funcParam && (pt.fp = funcParam);
			modifier && pt.modifier(modifier, this, target);
			return this._pt = pt;
		}
		!currentValue && !(prop in target) && _missingPlugin(prop, end);
		return _addComplexStringPropTween.call(this, target, prop, parsedStart, end, setter, stringFilter || _config.stringFilter, funcParam);
	}
};
var _processVars = function _processVars(vars, index, target, targets, tween) {
	_isFunction(vars) && (vars = _parseFuncOrString(vars, tween, index, target, targets));
	if (!_isObject(vars) || vars.style && vars.nodeType || _isArray(vars) || _isTypedArray(vars)) return _isString(vars) ? _parseFuncOrString(vars, tween, index, target, targets) : vars;
	var copy = {}, p;
	for (p in vars) copy[p] = _parseFuncOrString(vars[p], tween, index, target, targets);
	return copy;
};
var _checkPlugin = function _checkPlugin(property, vars, tween, index, target, targets) {
	var plugin, pt, ptLookup, i;
	if (_plugins[property] && (plugin = new _plugins[property]()).init(target, plugin.rawVars ? vars[property] : _processVars(vars[property], index, target, targets, tween), tween, index, targets) !== false) {
		tween._pt = pt = new PropTween(tween._pt, target, property, 0, 1, plugin.render, plugin, 0, plugin.priority);
		if (tween !== _quickTween) {
			ptLookup = tween._ptLookup[tween._targets.indexOf(target)];
			i = plugin._props.length;
			while (i--) ptLookup[plugin._props[i]] = pt;
		}
	}
	return plugin;
};
var _overwritingTween;
var _forceAllPropTweens;
var _initTween = function _initTween(tween, time, tTime) {
	var vars = tween.vars, ease = vars.ease, startAt = vars.startAt, immediateRender = vars.immediateRender, lazy = vars.lazy, onUpdate = vars.onUpdate, runBackwards = vars.runBackwards, yoyoEase = vars.yoyoEase, keyframes = vars.keyframes, autoRevert = vars.autoRevert, dur = tween._dur, prevStartAt = tween._startAt, targets = tween._targets, parent = tween.parent, fullTargets = parent && parent.data === "nested" ? parent.vars.targets : targets, autoOverwrite = tween._overwrite === "auto" && !_suppressOverwrites, tl = tween.timeline, reverseEase = vars.easeReverse || yoyoEase, cleanVars, i, p, pt, target, hasPriority, gsData, harness, plugin, ptLookup, index, harnessVars, overwritten;
	tl && (!keyframes || !ease) && (ease = "none");
	tween._ease = _parseEase(ease, _defaults.ease);
	tween._rEase = reverseEase && (_parseEase(reverseEase) || tween._ease);
	tween._from = !tl && !!vars.runBackwards;
	if (tween._from) tween.ratio = 1;
	if (!tl || keyframes && !vars.stagger) {
		harness = targets[0] ? _getCache(targets[0]).harness : 0;
		harnessVars = harness && vars[harness.prop];
		cleanVars = _copyExcluding(vars, _reservedProps);
		if (prevStartAt) {
			prevStartAt._zTime < 0 && prevStartAt.progress(1);
			time < 0 && runBackwards && immediateRender && !autoRevert ? prevStartAt.render(-1, true) : prevStartAt.revert(runBackwards && dur ? _revertConfigNoKill : _startAtRevertConfig);
			prevStartAt._lazy = 0;
		}
		if (startAt) {
			_removeFromParent(tween._startAt = Tween.set(targets, _setDefaults({
				data: "isStart",
				overwrite: false,
				parent,
				immediateRender: true,
				lazy: !prevStartAt && _isNotFalse(lazy),
				startAt: null,
				delay: 0,
				onUpdate: onUpdate && function() {
					return _callback(tween, "onUpdate");
				},
				stagger: 0
			}, startAt)));
			tween._startAt._dp = 0;
			tween._startAt._sat = tween;
			time < 0 && (_reverting$1 || !immediateRender && !autoRevert) && tween._startAt.revert(_revertConfigNoKill);
			if (immediateRender) {
				if (dur && time <= 0 && tTime <= 0) {
					time && (tween._zTime = time);
					return;
				}
			}
		} else if (runBackwards && dur) {
			if (!prevStartAt) {
				time && (immediateRender = false);
				p = _setDefaults({
					overwrite: false,
					data: "isFromStart",
					lazy: immediateRender && !prevStartAt && _isNotFalse(lazy),
					immediateRender,
					stagger: 0,
					parent
				}, cleanVars);
				harnessVars && (p[harness.prop] = harnessVars);
				_removeFromParent(tween._startAt = Tween.set(targets, p));
				tween._startAt._dp = 0;
				tween._startAt._sat = tween;
				time < 0 && (_reverting$1 ? tween._startAt.revert(_revertConfigNoKill) : tween._startAt.render(-1, true));
				tween._zTime = time;
				if (!immediateRender) _initTween(tween._startAt, _tinyNum, _tinyNum);
				else if (!time) return;
			}
		}
		tween._pt = tween._ptCache = 0;
		lazy = dur && _isNotFalse(lazy) || lazy && !dur;
		for (i = 0; i < targets.length; i++) {
			target = targets[i];
			gsData = target._gsap || _harness(targets)[i]._gsap;
			tween._ptLookup[i] = ptLookup = {};
			_lazyLookup[gsData.id] && _lazyTweens.length && _lazyRender();
			index = fullTargets === targets ? i : fullTargets.indexOf(target);
			if (harness && (plugin = new harness()).init(target, harnessVars || cleanVars, tween, index, fullTargets) !== false) {
				tween._pt = pt = new PropTween(tween._pt, target, plugin.name, 0, 1, plugin.render, plugin, 0, plugin.priority);
				plugin._props.forEach(function(name) {
					ptLookup[name] = pt;
				});
				plugin.priority && (hasPriority = 1);
			}
			if (!harness || harnessVars) for (p in cleanVars) if (_plugins[p] && (plugin = _checkPlugin(p, cleanVars, tween, index, target, fullTargets))) plugin.priority && (hasPriority = 1);
			else ptLookup[p] = pt = _addPropTween.call(tween, target, p, "get", cleanVars[p], index, fullTargets, 0, vars.stringFilter);
			tween._op && tween._op[i] && tween.kill(target, tween._op[i]);
			if (autoOverwrite && tween._pt) {
				_overwritingTween = tween;
				_globalTimeline.killTweensOf(target, ptLookup, tween.globalTime(time));
				overwritten = !tween.parent;
				_overwritingTween = 0;
			}
			tween._pt && lazy && (_lazyLookup[gsData.id] = 1);
		}
		hasPriority && _sortPropTweensByPriority(tween);
		tween._onInit && tween._onInit(tween);
	}
	tween._onUpdate = onUpdate;
	tween._initted = (!tween._op || tween._pt) && !overwritten;
	keyframes && time <= 0 && tl.render(_bigNum$1, true, true);
};
var _updatePropTweens = function _updatePropTweens(tween, property, value, start, startIsRelative, ratio, time, skipRecursion) {
	var ptCache = (tween._pt && tween._ptCache || (tween._ptCache = {}))[property], pt, rootPT, lookup, i;
	if (!ptCache) {
		ptCache = tween._ptCache[property] = [];
		lookup = tween._ptLookup;
		i = tween._targets.length;
		while (i--) {
			pt = lookup[i][property];
			if (pt && pt.d && pt.d._pt) {
				pt = pt.d._pt;
				while (pt && pt.p !== property && pt.fp !== property) pt = pt._next;
			}
			if (!pt) {
				_forceAllPropTweens = 1;
				tween.vars[property] = "+=0";
				_initTween(tween, time);
				_forceAllPropTweens = 0;
				return skipRecursion ? _warn(property + " not eligible for reset. Try splitting into individual properties") : 1;
			}
			ptCache.push(pt);
		}
	}
	i = ptCache.length;
	while (i--) {
		rootPT = ptCache[i];
		pt = rootPT._pt || rootPT;
		pt.s = (start || start === 0) && !startIsRelative ? start : pt.s + (start || 0) + ratio * pt.c;
		pt.c = value - pt.s;
		rootPT.e && (rootPT.e = _round(value) + getUnit(rootPT.e));
		rootPT.b && (rootPT.b = pt.s + getUnit(rootPT.b));
	}
};
var _addAliasesToVars = function _addAliasesToVars(targets, vars) {
	var harness = targets[0] ? _getCache(targets[0]).harness : 0, propertyAliases = harness && harness.aliases, copy, p, i, aliases;
	if (!propertyAliases) return vars;
	copy = _merge({}, vars);
	for (p in propertyAliases) if (p in copy) {
		aliases = propertyAliases[p].split(",");
		i = aliases.length;
		while (i--) copy[aliases[i]] = copy[p];
	}
	return copy;
};
var _parseKeyframe = function _parseKeyframe(prop, obj, allProps, easeEach) {
	var ease = obj.ease || easeEach || "power1.inOut", p, a;
	if (_isArray(obj)) {
		a = allProps[prop] || (allProps[prop] = []);
		obj.forEach(function(value, i) {
			return a.push({
				t: i / (obj.length - 1) * 100,
				v: value,
				e: ease
			});
		});
	} else for (p in obj) {
		a = allProps[p] || (allProps[p] = []);
		p === "ease" || a.push({
			t: parseFloat(prop),
			v: obj[p],
			e: ease
		});
	}
};
var _parseFuncOrString = function _parseFuncOrString(value, tween, i, target, targets) {
	return _isFunction(value) ? value.call(tween, i, target, targets) : _isString(value) && ~value.indexOf("random(") ? _replaceRandom(value) : value;
};
var _staggerTweenProps = _callbackNames + "repeat,repeatDelay,yoyo,repeatRefresh,yoyoEase,easeReverse,autoRevert";
var _staggerPropsToSkip = {};
_forEachName(_staggerTweenProps + ",id,stagger,delay,duration,paused,scrollTrigger", function(name) {
	return _staggerPropsToSkip[name] = 1;
});
var Tween = /*#__PURE__*/ function(_Animation2) {
	_inheritsLoose(Tween, _Animation2);
	function Tween(targets, vars, position, skipInherit) {
		var _this3;
		if (typeof vars === "number") {
			position.duration = vars;
			vars = position;
			position = null;
		}
		_this3 = _Animation2.call(this, skipInherit ? vars : _inheritDefaults(vars)) || this;
		var _this3$vars = _this3.vars, duration = _this3$vars.duration, delay = _this3$vars.delay, immediateRender = _this3$vars.immediateRender, stagger = _this3$vars.stagger, overwrite = _this3$vars.overwrite, keyframes = _this3$vars.keyframes, defaults = _this3$vars.defaults, scrollTrigger = _this3$vars.scrollTrigger, parent = vars.parent || _globalTimeline, parsedTargets = (_isArray(targets) || _isTypedArray(targets) ? _isNumber(targets[0]) : "length" in vars) ? [targets] : toArray(targets), tl, i, copy, l, p, curTarget, staggerFunc, staggerVarsToMerge;
		_this3._targets = parsedTargets.length ? _harness(parsedTargets) : _warn("GSAP target " + targets + " not found. https://gsap.com", !_config.nullTargetWarn) || [];
		_this3._ptLookup = [];
		_this3._overwrite = overwrite;
		if (keyframes || stagger || _isFuncOrString(duration) || _isFuncOrString(delay)) {
			vars = _this3.vars;
			var easeReverse = vars.easeReverse || vars.yoyoEase;
			tl = _this3.timeline = new Timeline({
				data: "nested",
				defaults: defaults || {},
				targets: parent && parent.data === "nested" ? parent.vars.targets : parsedTargets
			});
			tl.kill();
			tl.parent = tl._dp = _assertThisInitialized(_this3);
			tl._start = 0;
			if (stagger || _isFuncOrString(duration) || _isFuncOrString(delay)) {
				l = parsedTargets.length;
				staggerFunc = stagger && distribute(stagger);
				if (_isObject(stagger)) {
					for (p in stagger) if (~_staggerTweenProps.indexOf(p)) {
						staggerVarsToMerge || (staggerVarsToMerge = {});
						staggerVarsToMerge[p] = stagger[p];
					}
				}
				for (i = 0; i < l; i++) {
					copy = _copyExcluding(vars, _staggerPropsToSkip);
					copy.stagger = 0;
					easeReverse && (copy.easeReverse = easeReverse);
					staggerVarsToMerge && _merge(copy, staggerVarsToMerge);
					curTarget = parsedTargets[i];
					copy.duration = +_parseFuncOrString(duration, _assertThisInitialized(_this3), i, curTarget, parsedTargets);
					copy.delay = (+_parseFuncOrString(delay, _assertThisInitialized(_this3), i, curTarget, parsedTargets) || 0) - _this3._delay;
					if (!stagger && l === 1 && copy.delay) {
						_this3._delay = delay = copy.delay;
						_this3._start += delay;
						copy.delay = 0;
					}
					tl.to(curTarget, copy, staggerFunc ? staggerFunc(i, curTarget, parsedTargets) : 0);
					tl._ease = _easeMap.none;
				}
				tl.duration() ? duration = delay = 0 : _this3.timeline = 0;
			} else if (keyframes) {
				_inheritDefaults(_setDefaults(tl.vars.defaults, { ease: "none" }));
				tl._ease = _parseEase(keyframes.ease || vars.ease || "none");
				var time = 0, a, kf, v;
				if (_isArray(keyframes)) {
					keyframes.forEach(function(frame) {
						return tl.to(parsedTargets, frame, ">");
					});
					tl.duration();
				} else {
					copy = {};
					for (p in keyframes) p === "ease" || p === "easeEach" || _parseKeyframe(p, keyframes[p], copy, keyframes.easeEach);
					for (p in copy) {
						a = copy[p].sort(function(a, b) {
							return a.t - b.t;
						});
						time = 0;
						for (i = 0; i < a.length; i++) {
							kf = a[i];
							v = {
								ease: kf.e,
								duration: (kf.t - (i ? a[i - 1].t : 0)) / 100 * duration
							};
							v[p] = kf.v;
							tl.to(parsedTargets, v, time);
							time += v.duration;
						}
					}
					tl.duration() < duration && tl.to({}, { duration: duration - tl.duration() });
				}
			}
			duration || _this3.duration(duration = tl.duration());
		} else _this3.timeline = 0;
		if (overwrite === true && !_suppressOverwrites) {
			_overwritingTween = _assertThisInitialized(_this3);
			_globalTimeline.killTweensOf(parsedTargets);
			_overwritingTween = 0;
		}
		_addToTimeline(parent, _assertThisInitialized(_this3), position);
		vars.reversed && _this3.reverse();
		vars.paused && _this3.paused(true);
		if (immediateRender || !duration && !keyframes && _this3._start === _roundPrecise(parent._time) && _isNotFalse(immediateRender) && _hasNoPausedAncestors(_assertThisInitialized(_this3)) && parent.data !== "nested") {
			_this3._tTime = -_tinyNum;
			_this3.render(Math.max(0, -delay) || 0);
		}
		scrollTrigger && _scrollTrigger(_assertThisInitialized(_this3), scrollTrigger);
		return _this3;
	}
	var _proto3 = Tween.prototype;
	_proto3.render = function render(totalTime, suppressEvents, force) {
		var prevTime = this._time, tDur = this._tDur, dur = this._dur, isNegative = totalTime < 0, tTime = totalTime > tDur - _tinyNum && !isNegative ? tDur : totalTime < _tinyNum ? 0 : totalTime, time, pt, iteration, cycleDuration, prevIteration, isYoyo, ratio, timeline;
		if (!dur) _renderZeroDurationTween(this, totalTime, suppressEvents, force);
		else if (tTime !== this._tTime || !totalTime || force || !this._initted && this._tTime || this._startAt && this._zTime < 0 !== isNegative || this._lazy) {
			time = tTime;
			timeline = this.timeline;
			if (this._repeat) {
				cycleDuration = dur + this._rDelay;
				if (this._repeat < -1 && isNegative) return this.totalTime(cycleDuration * 100 + totalTime, suppressEvents, force);
				time = _roundPrecise(tTime % cycleDuration);
				if (tTime === tDur) {
					iteration = this._repeat;
					time = dur;
				} else {
					prevIteration = _roundPrecise(tTime / cycleDuration);
					iteration = ~~prevIteration;
					if (iteration && iteration === prevIteration) {
						time = dur;
						iteration--;
					} else if (time > dur) time = dur;
				}
				isYoyo = this._yoyo && iteration & 1;
				if (isYoyo) time = dur - time;
				prevIteration = _animationCycle(this._tTime, cycleDuration);
				if (time === prevTime && !force && this._initted && iteration === prevIteration) {
					this._tTime = tTime;
					return this;
				}
				if (iteration !== prevIteration) {
					if (this.vars.repeatRefresh && !isYoyo && !this._lock && time !== cycleDuration && this._initted) {
						this._lock = force = 1;
						this.render(_roundPrecise(cycleDuration * iteration), true).invalidate()._lock = 0;
					}
				}
			}
			if (!this._initted) {
				if (_attemptInitTween(this, isNegative ? totalTime : time, force, suppressEvents, tTime)) {
					this._tTime = 0;
					return this;
				}
				if (prevTime !== this._time && !(force && this.vars.repeatRefresh && iteration !== prevIteration)) return this;
				if (dur !== this._dur) return this.render(totalTime, suppressEvents, force);
			}
			if (this._rEase) {
				var inv = time < prevTime;
				if (inv !== this._inv) {
					var segDur = inv ? prevTime : dur - prevTime;
					this._inv = inv;
					if (this._from) this.ratio = 1 - this.ratio;
					this._invRatio = this.ratio;
					this._invTime = prevTime;
					this._invRecip = segDur ? (inv ? -1 : 1) / segDur : 0;
					this._invScale = inv ? -this.ratio : 1 - this.ratio;
					this._invEase = inv ? this._rEase : this._ease;
				}
				this.ratio = ratio = this._invRatio + this._invScale * this._invEase((time - this._invTime) * this._invRecip);
			} else this.ratio = ratio = this._ease(time / dur);
			if (this._from) this.ratio = ratio = 1 - ratio;
			this._tTime = tTime;
			this._time = time;
			if (!this._act && this._ts) {
				this._act = 1;
				this._lazy = 0;
			}
			if (!prevTime && tTime && !suppressEvents && !prevIteration) {
				_callback(this, "onStart");
				if (this._tTime !== tTime) return this;
			}
			pt = this._pt;
			while (pt) {
				pt.r(ratio, pt.d);
				pt = pt._next;
			}
			timeline && timeline.render(totalTime < 0 ? totalTime : timeline._dur * timeline._ease(time / this._dur), suppressEvents, force) || this._startAt && (this._zTime = totalTime);
			if (this._onUpdate && !suppressEvents) {
				isNegative && _rewindStartAt(this, totalTime, suppressEvents, force);
				_callback(this, "onUpdate");
			}
			this._repeat && iteration !== prevIteration && this.vars.onRepeat && !suppressEvents && this.parent && _callback(this, "onRepeat");
			if ((tTime === this._tDur || !tTime) && this._tTime === tTime) {
				isNegative && !this._onUpdate && _rewindStartAt(this, totalTime, true, true);
				(totalTime || !dur) && (tTime === this._tDur && this._ts > 0 || !tTime && this._ts < 0) && _removeFromParent(this, 1);
				if (!suppressEvents && !(isNegative && !prevTime) && (tTime || prevTime || isYoyo)) {
					_callback(this, tTime === tDur ? "onComplete" : "onReverseComplete", true);
					this._prom && !(tTime < tDur && this.timeScale() > 0) && this._prom();
				}
			}
		}
		return this;
	};
	_proto3.targets = function targets() {
		return this._targets;
	};
	_proto3.invalidate = function invalidate(soft) {
		(!soft || !this.vars.runBackwards) && (this._startAt = 0);
		this._pt = this._op = this._onUpdate = this._lazy = this.ratio = 0;
		this._ptLookup = [];
		this.timeline && this.timeline.invalidate(soft);
		return _Animation2.prototype.invalidate.call(this, soft);
	};
	_proto3.resetTo = function resetTo(property, value, start, startIsRelative, skipRecursion) {
		_tickerActive || _ticker.wake();
		this._ts || this.play();
		var time = Math.min(this._dur, (this._dp._time - this._start) * this._ts), ratio;
		this._initted || _initTween(this, time);
		ratio = this._ease(time / this._dur);
		if (_updatePropTweens(this, property, value, start, startIsRelative, ratio, time, skipRecursion)) return this.resetTo(property, value, start, startIsRelative, 1);
		_alignPlayhead(this, 0);
		this.parent || _addLinkedListItem(this._dp, this, "_first", "_last", this._dp._sort ? "_start" : 0);
		return this.render(0);
	};
	_proto3.kill = function kill(targets, vars) {
		if (vars === void 0) vars = "all";
		if (!targets && (!vars || vars === "all")) {
			this._lazy = this._pt = 0;
			this.parent ? _interrupt(this) : this.scrollTrigger && this.scrollTrigger.kill(!!_reverting$1);
			return this;
		}
		if (this.timeline) {
			var tDur = this.timeline.totalDuration();
			this.timeline.killTweensOf(targets, vars, _overwritingTween && _overwritingTween.vars.overwrite !== true)._first || _interrupt(this);
			this.parent && tDur !== this.timeline.totalDuration() && _setDuration(this, this._dur * this.timeline._tDur / tDur, 0, 1);
			return this;
		}
		var parsedTargets = this._targets, killingTargets = targets ? toArray(targets) : parsedTargets, propTweenLookup = this._ptLookup, firstPT = this._pt, overwrittenProps, curLookup, curOverwriteProps, props, p, pt, i;
		if ((!vars || vars === "all") && _arraysMatch(parsedTargets, killingTargets)) {
			vars === "all" && (this._pt = 0);
			return _interrupt(this);
		}
		overwrittenProps = this._op = this._op || [];
		if (vars !== "all") {
			if (_isString(vars)) {
				p = {};
				_forEachName(vars, function(name) {
					return p[name] = 1;
				});
				vars = p;
			}
			vars = _addAliasesToVars(parsedTargets, vars);
		}
		i = parsedTargets.length;
		while (i--) if (~killingTargets.indexOf(parsedTargets[i])) {
			curLookup = propTweenLookup[i];
			if (vars === "all") {
				overwrittenProps[i] = vars;
				props = curLookup;
				curOverwriteProps = {};
			} else {
				curOverwriteProps = overwrittenProps[i] = overwrittenProps[i] || {};
				props = vars;
			}
			for (p in props) {
				pt = curLookup && curLookup[p];
				if (pt) {
					if (!("kill" in pt.d) || pt.d.kill(p) === true) _removeLinkedListItem(this, pt, "_pt");
					delete curLookup[p];
				}
				if (curOverwriteProps !== "all") curOverwriteProps[p] = 1;
			}
		}
		this._initted && !this._pt && firstPT && _interrupt(this);
		return this;
	};
	Tween.to = function to(targets, vars) {
		return new Tween(targets, vars, arguments[2]);
	};
	Tween.from = function from(targets, vars) {
		return _createTweenType(1, arguments);
	};
	Tween.delayedCall = function delayedCall(delay, callback, params, scope) {
		return new Tween(callback, 0, {
			immediateRender: false,
			lazy: false,
			overwrite: false,
			delay,
			onComplete: callback,
			onReverseComplete: callback,
			onCompleteParams: params,
			onReverseCompleteParams: params,
			callbackScope: scope
		});
	};
	Tween.fromTo = function fromTo(targets, fromVars, toVars) {
		return _createTweenType(2, arguments);
	};
	Tween.set = function set(targets, vars) {
		vars.duration = 0;
		vars.repeatDelay || (vars.repeat = 0);
		return new Tween(targets, vars);
	};
	Tween.killTweensOf = function killTweensOf(targets, props, onlyActive) {
		return _globalTimeline.killTweensOf(targets, props, onlyActive);
	};
	return Tween;
}(Animation);
_setDefaults(Tween.prototype, {
	_targets: [],
	_lazy: 0,
	_startAt: 0,
	_op: 0,
	_onInit: 0
});
_forEachName("staggerTo,staggerFrom,staggerFromTo", function(name) {
	Tween[name] = function() {
		var tl = new Timeline(), params = _slice.call(arguments, 0);
		params.splice(name === "staggerFromTo" ? 5 : 4, 0, 0);
		return tl[name].apply(tl, params);
	};
});
var _setterPlain = function _setterPlain(target, property, value) {
	return target[property] = value;
};
var _setterFunc = function _setterFunc(target, property, value) {
	return target[property](value);
};
var _setterFuncWithParam = function _setterFuncWithParam(target, property, value, data) {
	return target[property](data.fp, value);
};
var _setterAttribute = function _setterAttribute(target, property, value) {
	return target.setAttribute(property, value);
};
var _getSetter = function _getSetter(target, property) {
	return _isFunction(target[property]) ? _setterFunc : _isUndefined(target[property]) && target.setAttribute ? _setterAttribute : _setterPlain;
};
var _renderPlain = function _renderPlain(ratio, data) {
	return data.set(data.t, data.p, Math.round((data.s + data.c * ratio) * 1e6) / 1e6, data);
};
var _renderBoolean = function _renderBoolean(ratio, data) {
	return data.set(data.t, data.p, !!(data.s + data.c * ratio), data);
};
var _renderComplexString = function _renderComplexString(ratio, data) {
	var pt = data._pt, s = "";
	if (!ratio && data.b) s = data.b;
	else if (ratio === 1 && data.e) s = data.e;
	else {
		while (pt) {
			s = pt.p + (pt.m ? pt.m(pt.s + pt.c * ratio) : Math.round((pt.s + pt.c * ratio) * 1e4) / 1e4) + s;
			pt = pt._next;
		}
		s += data.c;
	}
	data.set(data.t, data.p, s, data);
};
var _renderPropTweens = function _renderPropTweens(ratio, data) {
	var pt = data._pt;
	while (pt) {
		pt.r(ratio, pt.d);
		pt = pt._next;
	}
};
var _addPluginModifier = function _addPluginModifier(modifier, tween, target, property) {
	var pt = this._pt, next;
	while (pt) {
		next = pt._next;
		pt.p === property && pt.modifier(modifier, tween, target);
		pt = next;
	}
};
var _killPropTweensOf = function _killPropTweensOf(property) {
	var pt = this._pt, hasNonDependentRemaining, next;
	while (pt) {
		next = pt._next;
		if (pt.p === property && !pt.op || pt.op === property) _removeLinkedListItem(this, pt, "_pt");
		else if (!pt.dep) hasNonDependentRemaining = 1;
		pt = next;
	}
	return !hasNonDependentRemaining;
};
var _setterWithModifier = function _setterWithModifier(target, property, value, data) {
	data.mSet(target, property, data.m.call(data.tween, value, data.mt), data);
};
var _sortPropTweensByPriority = function _sortPropTweensByPriority(parent) {
	var pt = parent._pt, next, pt2, first, last;
	while (pt) {
		next = pt._next;
		pt2 = first;
		while (pt2 && pt2.pr > pt.pr) pt2 = pt2._next;
		if (pt._prev = pt2 ? pt2._prev : last) pt._prev._next = pt;
		else first = pt;
		if (pt._next = pt2) pt2._prev = pt;
		else last = pt;
		pt = next;
	}
	parent._pt = first;
};
var PropTween = /*#__PURE__*/ function() {
	function PropTween(next, target, prop, start, change, renderer, data, setter, priority) {
		this.t = target;
		this.s = start;
		this.c = change;
		this.p = prop;
		this.r = renderer || _renderPlain;
		this.d = data || this;
		this.set = setter || _setterPlain;
		this.pr = priority || 0;
		this._next = next;
		if (next) next._prev = this;
	}
	var _proto4 = PropTween.prototype;
	_proto4.modifier = function modifier(func, tween, target) {
		this.mSet = this.mSet || this.set;
		this.set = _setterWithModifier;
		this.m = func;
		this.mt = target;
		this.tween = tween;
	};
	return PropTween;
}();
_forEachName(_callbackNames + "parent,duration,ease,delay,overwrite,runBackwards,startAt,yoyo,immediateRender,repeat,repeatDelay,data,paused,reversed,lazy,callbackScope,stringFilter,id,yoyoEase,stagger,inherit,repeatRefresh,keyframes,autoRevert,scrollTrigger,easeReverse", function(name) {
	return _reservedProps[name] = 1;
});
_globals.TweenMax = _globals.TweenLite = Tween;
_globals.TimelineLite = _globals.TimelineMax = Timeline;
_globalTimeline = new Timeline({
	sortChildren: false,
	defaults: _defaults,
	autoRemoveChildren: true,
	id: "root",
	smoothChildTiming: true
});
_config.stringFilter = _colorStringFilter;
var _media = [];
var _listeners = {};
var _emptyArray = [];
var _lastMediaTime = 0;
var _contextID = 0;
var _dispatch = function _dispatch(type) {
	return (_listeners[type] || _emptyArray).map(function(f) {
		return f();
	});
};
var _onMediaChange = function _onMediaChange() {
	var time = Date.now(), matches = [];
	if (time - _lastMediaTime > 2) {
		_dispatch("matchMediaInit");
		_media.forEach(function(c) {
			var queries = c.queries, conditions = c.conditions, match, p, anyMatch, toggled;
			for (p in queries) {
				match = _win$1.matchMedia(queries[p]).matches;
				match && (anyMatch = 1);
				if (match !== conditions[p]) {
					conditions[p] = match;
					toggled = 1;
				}
			}
			if (toggled) {
				c.revert();
				anyMatch && matches.push(c);
			}
		});
		_dispatch("matchMediaRevert");
		matches.forEach(function(c) {
			return c.onMatch(c, function(func) {
				return c.add(null, func);
			});
		});
		_lastMediaTime = time;
		_dispatch("matchMedia");
	}
};
var Context = /*#__PURE__*/ function() {
	function Context(func, scope) {
		this.selector = scope && selector(scope);
		this.data = [];
		this._r = [];
		this.isReverted = false;
		this.id = _contextID++;
		func && this.add(func);
	}
	var _proto5 = Context.prototype;
	_proto5.add = function add(name, func, scope) {
		if (_isFunction(name)) {
			scope = func;
			func = name;
			name = _isFunction;
		}
		var self = this, f = function f() {
			var prev = _context, prevSelector = self.selector, result;
			prev && prev !== self && prev.data.push(self);
			scope && (self.selector = selector(scope));
			_context = self;
			result = func.apply(self, arguments);
			_isFunction(result) && self._r.push(result);
			_context = prev;
			self.selector = prevSelector;
			self.isReverted = false;
			return result;
		};
		self.last = f;
		return name === _isFunction ? f(self, function(func) {
			return self.add(null, func);
		}) : name ? self[name] = f : f;
	};
	_proto5.ignore = function ignore(func) {
		var prev = _context;
		_context = null;
		func(this);
		_context = prev;
	};
	_proto5.getTweens = function getTweens() {
		var a = [];
		this.data.forEach(function(e) {
			return e instanceof Context ? a.push.apply(a, e.getTweens()) : e instanceof Tween && !(e.parent && e.parent.data === "nested") && a.push(e);
		});
		return a;
	};
	_proto5.clear = function clear() {
		this._r.length = this.data.length = 0;
	};
	_proto5.kill = function kill(revert, matchMedia) {
		var _this4 = this;
		if (revert) (function() {
			var tweens = _this4.getTweens(), i = _this4.data.length, t;
			while (i--) {
				t = _this4.data[i];
				if (t.data === "isFlip") {
					t.revert();
					t.getChildren(true, true, false).forEach(function(tween) {
						return tweens.splice(tweens.indexOf(tween), 1);
					});
				}
			}
			tweens.map(function(t) {
				return {
					g: t._dur || t._delay || t._sat && !t._sat.vars.immediateRender ? t.globalTime(0) : -Infinity,
					t
				};
			}).sort(function(a, b) {
				return b.g - a.g || -Infinity;
			}).forEach(function(o) {
				return o.t.revert(revert);
			});
			i = _this4.data.length;
			while (i--) {
				t = _this4.data[i];
				if (t instanceof Timeline) {
					if (t.data !== "nested") {
						t.scrollTrigger && t.scrollTrigger.revert();
						t.kill();
					}
				} else !(t instanceof Tween) && t.revert && t.revert(revert);
			}
			_this4._r.forEach(function(f) {
				return f(revert, _this4);
			});
			_this4.isReverted = true;
		})();
		else this.data.forEach(function(e) {
			return e.kill && e.kill();
		});
		this.clear();
		if (matchMedia) {
			var i = _media.length;
			while (i--) _media[i].id === this.id && _media.splice(i, 1);
		}
	};
	_proto5.revert = function revert(config) {
		this.kill(config || {});
	};
	return Context;
}();
var MatchMedia = /*#__PURE__*/ function() {
	function MatchMedia(scope) {
		this.contexts = [];
		this.scope = scope;
		_context && _context.data.push(this);
	}
	var _proto6 = MatchMedia.prototype;
	_proto6.add = function add(conditions, func, scope) {
		_isObject(conditions) || (conditions = { matches: conditions });
		var context = new Context(0, scope || this.scope), cond = context.conditions = {}, mq, p, active;
		_context && !context.selector && (context.selector = _context.selector);
		this.contexts.push(context);
		func = context.add("onMatch", func);
		context.queries = conditions;
		for (p in conditions) if (p === "all") active = 1;
		else {
			mq = _win$1.matchMedia(conditions[p]);
			if (mq) {
				_media.indexOf(context) < 0 && _media.push(context);
				(cond[p] = mq.matches) && (active = 1);
				mq.addListener ? mq.addListener(_onMediaChange) : mq.addEventListener("change", _onMediaChange);
			}
		}
		active && func(context, function(f) {
			return context.add(null, f);
		});
		return this;
	};
	_proto6.revert = function revert(config) {
		this.kill(config || {});
	};
	_proto6.kill = function kill(revert) {
		this.contexts.forEach(function(c) {
			return c.kill(revert, true);
		});
	};
	return MatchMedia;
}();
var _gsap = {
	registerPlugin: function registerPlugin() {
		for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) args[_key2] = arguments[_key2];
		args.forEach(function(config) {
			return _createPlugin(config);
		});
	},
	timeline: function timeline(vars) {
		return new Timeline(vars);
	},
	getTweensOf: function getTweensOf(targets, onlyActive) {
		return _globalTimeline.getTweensOf(targets, onlyActive);
	},
	getProperty: function getProperty(target, property, unit, uncache) {
		_isString(target) && (target = toArray(target)[0]);
		var getter = _getCache(target || {}).get, format = unit ? _passThrough : _numericIfPossible;
		unit === "native" && (unit = "");
		return !target ? target : !property ? function(property, unit, uncache) {
			return format((_plugins[property] && _plugins[property].get || getter)(target, property, unit, uncache));
		} : format((_plugins[property] && _plugins[property].get || getter)(target, property, unit, uncache));
	},
	quickSetter: function quickSetter(target, property, unit) {
		target = toArray(target);
		if (target.length > 1) {
			var setters = target.map(function(t) {
				return gsap.quickSetter(t, property, unit);
			}), l = setters.length;
			return function(value) {
				var i = l;
				while (i--) setters[i](value);
			};
		}
		target = target[0] || {};
		var Plugin = _plugins[property], cache = _getCache(target), p = cache.harness && (cache.harness.aliases || {})[property] || property, setter = Plugin ? function(value) {
			var p = new Plugin();
			_quickTween._pt = 0;
			p.init(target, unit ? value + unit : value, _quickTween, 0, [target]);
			p.render(1, p);
			_quickTween._pt && _renderPropTweens(1, _quickTween);
		} : cache.set(target, p);
		return Plugin ? setter : function(value) {
			return setter(target, p, unit ? value + unit : value, cache, 1);
		};
	},
	quickTo: function quickTo(target, property, vars) {
		var _setDefaults2;
		var tween = gsap.to(target, _setDefaults((_setDefaults2 = {}, _setDefaults2[property] = "+=0.1", _setDefaults2.paused = true, _setDefaults2.stagger = 0, _setDefaults2), vars || {})), func = function func(value, start, startIsRelative) {
			return tween.resetTo(property, value, start, startIsRelative);
		};
		func.tween = tween;
		return func;
	},
	isTweening: function isTweening(targets) {
		return _globalTimeline.getTweensOf(targets, true).length > 0;
	},
	defaults: function defaults(value) {
		value && value.ease && (value.ease = _parseEase(value.ease, _defaults.ease));
		return _mergeDeep(_defaults, value || {});
	},
	config: function config(value) {
		return _mergeDeep(_config, value || {});
	},
	registerEffect: function registerEffect(_ref3) {
		var name = _ref3.name, effect = _ref3.effect, plugins = _ref3.plugins, defaults = _ref3.defaults, extendTimeline = _ref3.extendTimeline;
		(plugins || "").split(",").forEach(function(pluginName) {
			return pluginName && !_plugins[pluginName] && !_globals[pluginName] && _warn(name + " effect requires " + pluginName + " plugin.");
		});
		_effects[name] = function(targets, vars, tl) {
			return effect(toArray(targets), _setDefaults(vars || {}, defaults), tl);
		};
		if (extendTimeline) Timeline.prototype[name] = function(targets, vars, position) {
			return this.add(_effects[name](targets, _isObject(vars) ? vars : (position = vars) && {}, this), position);
		};
	},
	registerEase: function registerEase(name, ease) {
		_easeMap[name] = _parseEase(ease);
	},
	parseEase: function parseEase(ease, defaultEase) {
		return arguments.length ? _parseEase(ease, defaultEase) : _easeMap;
	},
	getById: function getById(id) {
		return _globalTimeline.getById(id);
	},
	exportRoot: function exportRoot(vars, includeDelayedCalls) {
		if (vars === void 0) vars = {};
		var tl = new Timeline(vars), child, next;
		tl.smoothChildTiming = _isNotFalse(vars.smoothChildTiming);
		_globalTimeline.remove(tl);
		tl._dp = 0;
		tl._time = tl._tTime = _globalTimeline._time;
		child = _globalTimeline._first;
		while (child) {
			next = child._next;
			if (includeDelayedCalls || !(!child._dur && child instanceof Tween && child.vars.onComplete === child._targets[0])) _addToTimeline(tl, child, child._start - child._delay);
			child = next;
		}
		_addToTimeline(_globalTimeline, tl, 0);
		return tl;
	},
	context: function context(func, scope) {
		return func ? new Context(func, scope) : _context;
	},
	matchMedia: function matchMedia(scope) {
		return new MatchMedia(scope);
	},
	matchMediaRefresh: function matchMediaRefresh() {
		return _media.forEach(function(c) {
			var cond = c.conditions, found, p;
			for (p in cond) if (cond[p]) {
				cond[p] = false;
				found = 1;
			}
			found && c.revert();
		}) || _onMediaChange();
	},
	addEventListener: function addEventListener(type, callback) {
		var a = _listeners[type] || (_listeners[type] = []);
		~a.indexOf(callback) || a.push(callback);
	},
	removeEventListener: function removeEventListener(type, callback) {
		var a = _listeners[type], i = a && a.indexOf(callback);
		i >= 0 && a.splice(i, 1);
	},
	utils: {
		wrap,
		wrapYoyo,
		distribute,
		random,
		snap,
		normalize,
		getUnit,
		clamp,
		splitColor,
		toArray,
		selector,
		mapRange,
		pipe,
		unitize,
		interpolate,
		shuffle
	},
	install: _install,
	effects: _effects,
	ticker: _ticker,
	updateRoot: Timeline.updateRoot,
	plugins: _plugins,
	globalTimeline: _globalTimeline,
	core: {
		PropTween,
		globals: _addGlobal,
		Tween,
		Timeline,
		Animation,
		getCache: _getCache,
		_removeLinkedListItem,
		reverting: function reverting() {
			return _reverting$1;
		},
		context: function context(toAdd) {
			if (toAdd && _context) {
				_context.data.push(toAdd);
				toAdd._ctx = _context;
			}
			return _context;
		},
		suppressOverwrites: function suppressOverwrites(value) {
			return _suppressOverwrites = value;
		}
	}
};
_forEachName("to,from,fromTo,delayedCall,set,killTweensOf", function(name) {
	return _gsap[name] = Tween[name];
});
_ticker.add(Timeline.updateRoot);
_quickTween = _gsap.to({}, { duration: 0 });
var _getPluginPropTween = function _getPluginPropTween(plugin, prop) {
	var pt = plugin._pt;
	while (pt && pt.p !== prop && pt.op !== prop && pt.fp !== prop) pt = pt._next;
	return pt;
};
var _addModifiers = function _addModifiers(tween, modifiers) {
	var targets = tween._targets, p, i, pt;
	for (p in modifiers) {
		i = targets.length;
		while (i--) {
			pt = tween._ptLookup[i][p];
			if (pt && (pt = pt.d)) {
				if (pt._pt) pt = _getPluginPropTween(pt, p);
				pt && pt.modifier && pt.modifier(modifiers[p], tween, targets[i], p);
			}
		}
	}
};
var _buildModifierPlugin = function _buildModifierPlugin(name, modifier) {
	return {
		name,
		headless: 1,
		rawVars: 1,
		init: function init(target, vars, tween) {
			tween._onInit = function(tween) {
				var temp, p;
				if (_isString(vars)) {
					temp = {};
					_forEachName(vars, function(name) {
						return temp[name] = 1;
					});
					vars = temp;
				}
				if (modifier) {
					temp = {};
					for (p in vars) temp[p] = modifier(vars[p]);
					vars = temp;
				}
				_addModifiers(tween, vars);
			};
		}
	};
};
var gsap = _gsap.registerPlugin({
	name: "attr",
	init: function init(target, vars, tween, index, targets) {
		var p, pt, v;
		this.tween = tween;
		for (p in vars) {
			v = target.getAttribute(p) || "";
			pt = this.add(target, "setAttribute", (v || 0) + "", vars[p], index, targets, 0, 0, p);
			pt.op = p;
			pt.b = v;
			this._props.push(p);
		}
	},
	render: function render(ratio, data) {
		var pt = data._pt;
		while (pt) {
			_reverting$1 ? pt.set(pt.t, pt.p, pt.b, pt) : pt.r(ratio, pt.d);
			pt = pt._next;
		}
	}
}, {
	name: "endArray",
	headless: 1,
	init: function init(target, value) {
		var i = value.length;
		while (i--) this.add(target, i, target[i] || 0, value[i], 0, 0, 0, 0, 0, 1);
	}
}, _buildModifierPlugin("roundProps", _roundModifier), _buildModifierPlugin("modifiers"), _buildModifierPlugin("snap", snap)) || _gsap;
Tween.version = Timeline.version = gsap.version = "3.15.0";
_coreReady = 1;
_windowExists$1() && _wake();
_easeMap.Power0;
_easeMap.Power1;
_easeMap.Power2;
_easeMap.Power3;
_easeMap.Power4;
_easeMap.Linear;
_easeMap.Quad;
_easeMap.Cubic;
_easeMap.Quart;
_easeMap.Quint;
_easeMap.Strong;
_easeMap.Elastic;
_easeMap.Back;
_easeMap.SteppedEase;
_easeMap.Bounce;
_easeMap.Sine;
_easeMap.Expo;
_easeMap.Circ;
//#endregion
//#region port/v2/node_modules/gsap/CSSPlugin.js
/*!
* CSSPlugin 3.15.0
* https://gsap.com
*
* Copyright 2008-2026, GreenSock. All rights reserved.
* Subject to the terms at https://gsap.com/standard-license
* @author: Jack Doyle, jack@greensock.com
*/
var _win;
var _doc;
var _docElement;
var _pluginInitted;
var _tempDiv;
var _recentSetterPlugin;
var _reverting;
var _windowExists = function _windowExists() {
	return typeof window !== "undefined";
};
var _transformProps = {};
var _RAD2DEG = 180 / Math.PI;
var _DEG2RAD = Math.PI / 180;
var _atan2 = Math.atan2;
var _bigNum = 1e8;
var _capsExp = /([A-Z])/g;
var _horizontalExp = /(left|right|width|margin|padding|x)/i;
var _complexExp = /[\s,\(]\S/;
var _propertyAliases = {
	autoAlpha: "opacity,visibility",
	scale: "scaleX,scaleY",
	alpha: "opacity"
};
var _renderCSSProp = function _renderCSSProp(ratio, data) {
	return data.set(data.t, data.p, Math.round((data.s + data.c * ratio) * 1e4) / 1e4 + data.u, data);
};
var _renderPropWithEnd = function _renderPropWithEnd(ratio, data) {
	return data.set(data.t, data.p, ratio === 1 ? data.e : Math.round((data.s + data.c * ratio) * 1e4) / 1e4 + data.u, data);
};
var _renderCSSPropWithBeginning = function _renderCSSPropWithBeginning(ratio, data) {
	return data.set(data.t, data.p, ratio ? Math.round((data.s + data.c * ratio) * 1e4) / 1e4 + data.u : data.b, data);
};
var _renderCSSPropWithBeginningAndEnd = function _renderCSSPropWithBeginningAndEnd(ratio, data) {
	return data.set(data.t, data.p, ratio === 1 ? data.e : ratio ? Math.round((data.s + data.c * ratio) * 1e4) / 1e4 + data.u : data.b, data);
};
var _renderRoundedCSSProp = function _renderRoundedCSSProp(ratio, data) {
	var value = data.s + data.c * ratio;
	data.set(data.t, data.p, ~~(value + (value < 0 ? -.5 : .5)) + data.u, data);
};
var _renderNonTweeningValue = function _renderNonTweeningValue(ratio, data) {
	return data.set(data.t, data.p, ratio ? data.e : data.b, data);
};
var _renderNonTweeningValueOnlyAtEnd = function _renderNonTweeningValueOnlyAtEnd(ratio, data) {
	return data.set(data.t, data.p, ratio !== 1 ? data.b : data.e, data);
};
var _setterCSSStyle = function _setterCSSStyle(target, property, value) {
	return target.style[property] = value;
};
var _setterCSSProp = function _setterCSSProp(target, property, value) {
	return target.style.setProperty(property, value);
};
var _setterTransform = function _setterTransform(target, property, value) {
	return target._gsap[property] = value;
};
var _setterScale = function _setterScale(target, property, value) {
	return target._gsap.scaleX = target._gsap.scaleY = value;
};
var _setterScaleWithRender = function _setterScaleWithRender(target, property, value, data, ratio) {
	var cache = target._gsap;
	cache.scaleX = cache.scaleY = value;
	cache.renderTransform(ratio, cache);
};
var _setterTransformWithRender = function _setterTransformWithRender(target, property, value, data, ratio) {
	var cache = target._gsap;
	cache[property] = value;
	cache.renderTransform(ratio, cache);
};
var _transformProp = "transform";
var _transformOriginProp = _transformProp + "Origin";
var _saveStyle = function _saveStyle(property, isNotCSS) {
	var _this = this;
	var target = this.target, style = target.style, cache = target._gsap;
	if (property in _transformProps && style) {
		this.tfm = this.tfm || {};
		if (property !== "transform") {
			property = _propertyAliases[property] || property;
			~property.indexOf(",") ? property.split(",").forEach(function(a) {
				return _this.tfm[a] = _get(target, a);
			}) : this.tfm[property] = cache.x ? cache[property] : _get(target, property);
			property === _transformOriginProp && (this.tfm.zOrigin = cache.zOrigin);
		} else return _propertyAliases.transform.split(",").forEach(function(p) {
			return _saveStyle.call(_this, p, isNotCSS);
		});
		if (this.props.indexOf(_transformProp) >= 0) return;
		if (cache.svg) {
			this.svgo = target.getAttribute("data-svg-origin");
			this.props.push(_transformOriginProp, isNotCSS, "");
		}
		property = _transformProp;
	}
	(style || isNotCSS) && this.props.push(property, isNotCSS, style[property]);
};
var _removeIndependentTransforms = function _removeIndependentTransforms(style) {
	if (style.translate) {
		style.removeProperty("translate");
		style.removeProperty("scale");
		style.removeProperty("rotate");
	}
};
var _revertStyle = function _revertStyle() {
	var props = this.props, target = this.target, style = target.style, cache = target._gsap, i, p;
	for (i = 0; i < props.length; i += 3) if (!props[i + 1]) props[i + 2] ? style[props[i]] = props[i + 2] : style.removeProperty(props[i].substr(0, 2) === "--" ? props[i] : props[i].replace(_capsExp, "-$1").toLowerCase());
	else if (props[i + 1] === 2) target[props[i]](props[i + 2]);
	else target[props[i]] = props[i + 2];
	if (this.tfm) {
		for (p in this.tfm) cache[p] = this.tfm[p];
		if (cache.svg) {
			cache.renderTransform();
			target.setAttribute("data-svg-origin", this.svgo || "");
		}
		i = _reverting();
		if ((!i || !i.isStart) && !style[_transformProp]) {
			_removeIndependentTransforms(style);
			if (cache.zOrigin && style[_transformOriginProp]) {
				style[_transformOriginProp] += " " + cache.zOrigin + "px";
				cache.zOrigin = 0;
				cache.renderTransform();
			}
			cache.uncache = 1;
		}
	}
};
var _getStyleSaver = function _getStyleSaver(target, properties) {
	var saver = {
		target,
		props: [],
		revert: _revertStyle,
		save: _saveStyle
	};
	target._gsap || gsap.core.getCache(target);
	properties && target.style && target.nodeType && properties.split(",").forEach(function(p) {
		return saver.save(p);
	});
	return saver;
};
var _supports3D;
var _createElement = function _createElement(type, ns) {
	var e = _doc.createElementNS ? _doc.createElementNS((ns || "http://www.w3.org/1999/xhtml").replace(/^https/, "http"), type) : _doc.createElement(type);
	return e && e.style ? e : _doc.createElement(type);
};
var _getComputedProperty = function _getComputedProperty(target, property, skipPrefixFallback) {
	var cs = getComputedStyle(target);
	return cs[property] || cs.getPropertyValue(property.replace(_capsExp, "-$1").toLowerCase()) || cs.getPropertyValue(property) || !skipPrefixFallback && _getComputedProperty(target, _checkPropPrefix(property) || property, 1) || "";
};
var _prefixes = "O,Moz,ms,Ms,Webkit".split(",");
var _checkPropPrefix = function _checkPropPrefix(property, element, preferPrefix) {
	var s = (element || _tempDiv).style, i = 5;
	if (property in s && !preferPrefix) return property;
	property = property.charAt(0).toUpperCase() + property.substr(1);
	while (i-- && !(_prefixes[i] + property in s));
	return i < 0 ? null : (i === 3 ? "ms" : i >= 0 ? _prefixes[i] : "") + property;
};
var _initCore = function _initCore() {
	if (_windowExists() && window.document) {
		_win = window;
		_doc = _win.document;
		_docElement = _doc.documentElement;
		_tempDiv = _createElement("div") || { style: {} };
		_createElement("div");
		_transformProp = _checkPropPrefix(_transformProp);
		_transformOriginProp = _transformProp + "Origin";
		_tempDiv.style.cssText = "border-width:0;line-height:0;position:absolute;padding:0";
		_supports3D = !!_checkPropPrefix("perspective");
		_reverting = gsap.core.reverting;
		_pluginInitted = 1;
	}
};
var _getReparentedCloneBBox = function _getReparentedCloneBBox(target) {
	var owner = target.ownerSVGElement, svg = _createElement("svg", owner && owner.getAttribute("xmlns") || "http://www.w3.org/2000/svg"), clone = target.cloneNode(true), bbox;
	clone.style.display = "block";
	svg.appendChild(clone);
	_docElement.appendChild(svg);
	try {
		bbox = clone.getBBox();
	} catch (e) {}
	svg.removeChild(clone);
	_docElement.removeChild(svg);
	return bbox;
};
var _getAttributeFallbacks = function _getAttributeFallbacks(target, attributesArray) {
	var i = attributesArray.length;
	while (i--) if (target.hasAttribute(attributesArray[i])) return target.getAttribute(attributesArray[i]);
};
var _getBBox = function _getBBox(target) {
	var bounds, cloned;
	try {
		bounds = target.getBBox();
	} catch (error) {
		bounds = _getReparentedCloneBBox(target);
		cloned = 1;
	}
	bounds && (bounds.width || bounds.height) || cloned || (bounds = _getReparentedCloneBBox(target));
	return bounds && !bounds.width && !bounds.x && !bounds.y ? {
		x: +_getAttributeFallbacks(target, [
			"x",
			"cx",
			"x1"
		]) || 0,
		y: +_getAttributeFallbacks(target, [
			"y",
			"cy",
			"y1"
		]) || 0,
		width: 0,
		height: 0
	} : bounds;
};
var _isSVG = function _isSVG(e) {
	return !!(e.getCTM && (!e.parentNode || e.ownerSVGElement) && _getBBox(e));
};
var _removeProperty = function _removeProperty(target, property) {
	if (property) {
		var style = target.style, first2Chars;
		if (property in _transformProps && property !== _transformOriginProp) property = _transformProp;
		if (style.removeProperty) {
			first2Chars = property.substr(0, 2);
			if (first2Chars === "ms" || property.substr(0, 6) === "webkit") property = "-" + property;
			style.removeProperty(first2Chars === "--" ? property : property.replace(_capsExp, "-$1").toLowerCase());
		} else style.removeAttribute(property);
	}
};
var _addNonTweeningPT = function _addNonTweeningPT(plugin, target, property, beginning, end, onlySetAtEnd) {
	var pt = new PropTween(plugin._pt, target, property, 0, 1, onlySetAtEnd ? _renderNonTweeningValueOnlyAtEnd : _renderNonTweeningValue);
	plugin._pt = pt;
	pt.b = beginning;
	pt.e = end;
	plugin._props.push(property);
	return pt;
};
var _nonConvertibleUnits = {
	deg: 1,
	rad: 1,
	turn: 1
};
var _nonStandardLayouts = {
	grid: 1,
	flex: 1
};
var _convertToUnit = function _convertToUnit(target, property, value, unit) {
	var curValue = parseFloat(value) || 0, curUnit = (value + "").trim().substr((curValue + "").length) || "px", style = _tempDiv.style, horizontal = _horizontalExp.test(property), isRootSVG = target.tagName.toLowerCase() === "svg", measureProperty = (isRootSVG ? "client" : "offset") + (horizontal ? "Width" : "Height"), amount = 100, toPixels = unit === "px", toPercent = unit === "%", px, parent, cache, isSVG;
	if (unit === curUnit || !curValue || _nonConvertibleUnits[unit] || _nonConvertibleUnits[curUnit]) return curValue;
	curUnit !== "px" && !toPixels && (curValue = _convertToUnit(target, property, value, "px"));
	isSVG = target.getCTM && _isSVG(target);
	if ((toPercent || curUnit === "%") && (_transformProps[property] || ~property.indexOf("adius"))) {
		px = isSVG ? target.getBBox()[horizontal ? "width" : "height"] : target[measureProperty];
		return _round(toPercent ? curValue / px * amount : curValue / 100 * px);
	}
	style[horizontal ? "width" : "height"] = amount + (toPixels ? curUnit : unit);
	parent = unit !== "rem" && ~property.indexOf("adius") || unit === "em" && target.appendChild && !isRootSVG ? target : target.parentNode;
	if (isSVG) parent = (target.ownerSVGElement || {}).parentNode;
	if (!parent || parent === _doc || !parent.appendChild) parent = _doc.body;
	cache = parent._gsap;
	if (cache && toPercent && cache.width && horizontal && cache.time === _ticker.time && !cache.uncache) return _round(curValue / cache.width * amount);
	else {
		if (toPercent && (property === "height" || property === "width")) {
			var v = target.style[property];
			target.style[property] = amount + unit;
			px = target[measureProperty];
			v ? target.style[property] = v : _removeProperty(target, property);
		} else {
			(toPercent || curUnit === "%") && !_nonStandardLayouts[_getComputedProperty(parent, "display")] && (style.position = _getComputedProperty(target, "position"));
			parent === target && (style.position = "static");
			parent.appendChild(_tempDiv);
			px = _tempDiv[measureProperty];
			parent.removeChild(_tempDiv);
			style.position = "absolute";
		}
		if (horizontal && toPercent) {
			cache = _getCache(parent);
			cache.time = _ticker.time;
			cache.width = parent[measureProperty];
		}
	}
	return _round(toPixels ? px * curValue / amount : px && curValue ? amount / px * curValue : 0);
};
var _get = function _get(target, property, unit, uncache) {
	var value;
	_pluginInitted || _initCore();
	if (property in _propertyAliases && property !== "transform") {
		property = _propertyAliases[property];
		if (~property.indexOf(",")) property = property.split(",")[0];
	}
	if (_transformProps[property] && property !== "transform") {
		value = _parseTransform(target, uncache);
		value = property !== "transformOrigin" ? value[property] : value.svg ? value.origin : _firstTwoOnly(_getComputedProperty(target, _transformOriginProp)) + " " + value.zOrigin + "px";
	} else {
		value = target.style[property];
		if (!value || value === "auto" || uncache || ~(value + "").indexOf("calc(")) value = _specialProps[property] && _specialProps[property](target, property, unit) || _getComputedProperty(target, property) || _getProperty(target, property) || (property === "opacity" ? 1 : 0);
	}
	return unit && !~(value + "").trim().indexOf(" ") ? _convertToUnit(target, property, value, unit) + unit : value;
};
var _tweenComplexCSSString = function _tweenComplexCSSString(target, prop, start, end) {
	if (!start || start === "none") {
		var p = _checkPropPrefix(prop, target, 1), s = p && _getComputedProperty(target, p, 1);
		if (s && s !== start) {
			prop = p;
			start = s;
		} else if (prop === "borderColor") start = _getComputedProperty(target, "borderTopColor");
	}
	var pt = new PropTween(this._pt, target.style, prop, 0, 1, _renderComplexString), index = 0, matchIndex = 0, a, result, startValues, startNum, color, startValue, endValue, endNum, chunk, endUnit, startUnit, endValues;
	pt.b = start;
	pt.e = end;
	start += "";
	end += "";
	if (end.substring(0, 6) === "var(--") end = _getComputedProperty(target, end.substring(4, end.indexOf(")")));
	if (end === "auto") {
		startValue = target.style[prop];
		target.style[prop] = end;
		end = _getComputedProperty(target, prop) || end;
		startValue ? target.style[prop] = startValue : _removeProperty(target, prop);
	}
	a = [start, end];
	_colorStringFilter(a);
	start = a[0];
	end = a[1];
	startValues = start.match(_numWithUnitExp) || [];
	endValues = end.match(_numWithUnitExp) || [];
	if (endValues.length) {
		while (result = _numWithUnitExp.exec(end)) {
			endValue = result[0];
			chunk = end.substring(index, result.index);
			if (color) color = (color + 1) % 5;
			else if (chunk.substr(-5) === "rgba(" || chunk.substr(-5) === "hsla(") color = 1;
			if (endValue !== (startValue = startValues[matchIndex++] || "")) {
				startNum = parseFloat(startValue) || 0;
				startUnit = startValue.substr((startNum + "").length);
				endValue.charAt(1) === "=" && (endValue = _parseRelative(startNum, endValue) + startUnit);
				endNum = parseFloat(endValue);
				endUnit = endValue.substr((endNum + "").length);
				index = _numWithUnitExp.lastIndex - endUnit.length;
				if (!endUnit) {
					endUnit = endUnit || _config.units[prop] || startUnit;
					if (index === end.length) {
						end += endUnit;
						pt.e += endUnit;
					}
				}
				if (startUnit !== endUnit) startNum = _convertToUnit(target, prop, startValue, endUnit) || 0;
				pt._pt = {
					_next: pt._pt,
					p: chunk || matchIndex === 1 ? chunk : ",",
					s: startNum,
					c: endNum - startNum,
					m: color && color < 4 || prop === "zIndex" ? Math.round : 0
				};
			}
		}
		pt.c = index < end.length ? end.substring(index, end.length) : "";
	} else pt.r = prop === "display" && end === "none" ? _renderNonTweeningValueOnlyAtEnd : _renderNonTweeningValue;
	_relExp.test(end) && (pt.e = 0);
	this._pt = pt;
	return pt;
};
var _keywordToPercent = {
	top: "0%",
	bottom: "100%",
	left: "0%",
	right: "100%",
	center: "50%"
};
var _convertKeywordsToPercentages = function _convertKeywordsToPercentages(value) {
	var split = value.split(" "), x = split[0], y = split[1] || "50%";
	if (x === "top" || x === "bottom" || y === "left" || y === "right") {
		value = x;
		x = y;
		y = value;
	}
	split[0] = _keywordToPercent[x] || x;
	split[1] = _keywordToPercent[y] || y;
	return split.join(" ");
};
var _renderClearProps = function _renderClearProps(ratio, data) {
	if (data.tween && data.tween._time === data.tween._dur) {
		var target = data.t, style = target.style, props = data.u, cache = target._gsap, prop, clearTransforms, i;
		if (props === "all" || props === true) {
			style.cssText = "";
			clearTransforms = 1;
		} else {
			props = props.split(",");
			i = props.length;
			while (--i > -1) {
				prop = props[i];
				if (_transformProps[prop]) {
					clearTransforms = 1;
					prop = prop === "transformOrigin" ? _transformOriginProp : _transformProp;
				}
				_removeProperty(target, prop);
			}
		}
		if (clearTransforms) {
			_removeProperty(target, _transformProp);
			if (cache) {
				cache.svg && target.removeAttribute("transform");
				style.scale = style.rotate = style.translate = "none";
				_parseTransform(target, 1);
				cache.uncache = 1;
				_removeIndependentTransforms(style);
			}
		}
	}
};
var _specialProps = { clearProps: function clearProps(plugin, target, property, endValue, tween) {
	if (tween.data !== "isFromStart") {
		var pt = plugin._pt = new PropTween(plugin._pt, target, property, 0, 0, _renderClearProps);
		pt.u = endValue;
		pt.pr = -10;
		pt.tween = tween;
		plugin._props.push(property);
		return 1;
	}
} };
var _identity2DMatrix = [
	1,
	0,
	0,
	1,
	0,
	0
];
var _rotationalProperties = {};
var _isNullTransform = function _isNullTransform(value) {
	return value === "matrix(1, 0, 0, 1, 0, 0)" || value === "none" || !value;
};
var _getComputedTransformMatrixAsArray = function _getComputedTransformMatrixAsArray(target) {
	var matrixString = _getComputedProperty(target, _transformProp);
	return _isNullTransform(matrixString) ? _identity2DMatrix : matrixString.substr(7).match(_numExp).map(_round);
};
var _getMatrix = function _getMatrix(target, force2D) {
	var cache = target._gsap || _getCache(target), style = target.style, matrix = _getComputedTransformMatrixAsArray(target), parent, nextSibling, temp, addedToDOM;
	if (cache.svg && target.getAttribute("transform")) {
		temp = target.transform.baseVal.consolidate().matrix;
		matrix = [
			temp.a,
			temp.b,
			temp.c,
			temp.d,
			temp.e,
			temp.f
		];
		return matrix.join(",") === "1,0,0,1,0,0" ? _identity2DMatrix : matrix;
	} else if (matrix === _identity2DMatrix && !target.offsetParent && target !== _docElement && !cache.svg) {
		temp = style.display;
		style.display = "block";
		parent = target.parentNode;
		if (!parent || !target.offsetParent && !target.getBoundingClientRect().width) {
			addedToDOM = 1;
			nextSibling = target.nextElementSibling;
			_docElement.appendChild(target);
		}
		matrix = _getComputedTransformMatrixAsArray(target);
		temp ? style.display = temp : _removeProperty(target, "display");
		if (addedToDOM) nextSibling ? parent.insertBefore(target, nextSibling) : parent ? parent.appendChild(target) : _docElement.removeChild(target);
	}
	return force2D && matrix.length > 6 ? [
		matrix[0],
		matrix[1],
		matrix[4],
		matrix[5],
		matrix[12],
		matrix[13]
	] : matrix;
};
var _applySVGOrigin = function _applySVGOrigin(target, origin, originIsAbsolute, smooth, matrixArray, pluginToAddPropTweensTo) {
	var cache = target._gsap, matrix = matrixArray || _getMatrix(target, true), xOriginOld = cache.xOrigin || 0, yOriginOld = cache.yOrigin || 0, xOffsetOld = cache.xOffset || 0, yOffsetOld = cache.yOffset || 0, a = matrix[0], b = matrix[1], c = matrix[2], d = matrix[3], tx = matrix[4], ty = matrix[5], originSplit = origin.split(" "), xOrigin = parseFloat(originSplit[0]) || 0, yOrigin = parseFloat(originSplit[1]) || 0, bounds, determinant, x, y;
	if (!originIsAbsolute) {
		bounds = _getBBox(target);
		xOrigin = bounds.x + (~originSplit[0].indexOf("%") ? xOrigin / 100 * bounds.width : xOrigin);
		yOrigin = bounds.y + (~(originSplit[1] || originSplit[0]).indexOf("%") ? yOrigin / 100 * bounds.height : yOrigin);
	} else if (matrix !== _identity2DMatrix && (determinant = a * d - b * c)) {
		x = xOrigin * (d / determinant) + yOrigin * (-c / determinant) + (c * ty - d * tx) / determinant;
		y = xOrigin * (-b / determinant) + yOrigin * (a / determinant) - (a * ty - b * tx) / determinant;
		xOrigin = x;
		yOrigin = y;
	}
	if (smooth || smooth !== false && cache.smooth) {
		tx = xOrigin - xOriginOld;
		ty = yOrigin - yOriginOld;
		cache.xOffset = xOffsetOld + (tx * a + ty * c) - tx;
		cache.yOffset = yOffsetOld + (tx * b + ty * d) - ty;
	} else cache.xOffset = cache.yOffset = 0;
	cache.xOrigin = xOrigin;
	cache.yOrigin = yOrigin;
	cache.smooth = !!smooth;
	cache.origin = origin;
	cache.originIsAbsolute = !!originIsAbsolute;
	target.style[_transformOriginProp] = "0px 0px";
	if (pluginToAddPropTweensTo) {
		_addNonTweeningPT(pluginToAddPropTweensTo, cache, "xOrigin", xOriginOld, xOrigin);
		_addNonTweeningPT(pluginToAddPropTweensTo, cache, "yOrigin", yOriginOld, yOrigin);
		_addNonTweeningPT(pluginToAddPropTweensTo, cache, "xOffset", xOffsetOld, cache.xOffset);
		_addNonTweeningPT(pluginToAddPropTweensTo, cache, "yOffset", yOffsetOld, cache.yOffset);
	}
	target.setAttribute("data-svg-origin", xOrigin + " " + yOrigin);
};
var _parseTransform = function _parseTransform(target, uncache) {
	var cache = target._gsap || new GSCache(target);
	if ("x" in cache && !uncache && !cache.uncache) return cache;
	var style = target.style, invertedScaleX = cache.scaleX < 0, px = "px", deg = "deg", cs = getComputedStyle(target), origin = _getComputedProperty(target, _transformOriginProp) || "0", x = y = z = rotation = rotationX = rotationY = skewX = skewY = perspective = 0, y, z, scaleX = scaleY = 1, scaleY, rotation, rotationX, rotationY, skewX, skewY, perspective, xOrigin, yOrigin, matrix, angle, cos, sin, a, b, c, d, a12, a22, t1, t2, t3, a13, a23, a33, a42, a43, a32;
	cache.svg = !!(target.getCTM && _isSVG(target));
	if (cs.translate) {
		if (cs.translate !== "none" || cs.scale !== "none" || cs.rotate !== "none") style[_transformProp] = (cs.translate !== "none" ? "translate3d(" + (cs.translate + " 0 0").split(" ").slice(0, 3).join(", ") + ") " : "") + (cs.rotate !== "none" ? "rotate(" + cs.rotate + ") " : "") + (cs.scale !== "none" ? "scale(" + cs.scale.split(" ").join(",") + ") " : "") + (cs[_transformProp] !== "none" ? cs[_transformProp] : "");
		style.scale = style.rotate = style.translate = "none";
	}
	matrix = _getMatrix(target, cache.svg);
	if (cache.svg) {
		if (cache.uncache) {
			t2 = target.getBBox();
			origin = cache.xOrigin - t2.x + "px " + (cache.yOrigin - t2.y) + "px";
			t1 = "";
		} else t1 = !uncache && target.getAttribute("data-svg-origin");
		_applySVGOrigin(target, t1 || origin, !!t1 || cache.originIsAbsolute, cache.smooth !== false, matrix);
	}
	xOrigin = cache.xOrigin || 0;
	yOrigin = cache.yOrigin || 0;
	if (matrix !== _identity2DMatrix) {
		a = matrix[0];
		b = matrix[1];
		c = matrix[2];
		d = matrix[3];
		x = a12 = matrix[4];
		y = a22 = matrix[5];
		if (matrix.length === 6) {
			scaleX = Math.sqrt(a * a + b * b);
			scaleY = Math.sqrt(d * d + c * c);
			rotation = a || b ? _atan2(b, a) * _RAD2DEG : 0;
			skewX = c || d ? _atan2(c, d) * _RAD2DEG + rotation : 0;
			skewX && (scaleY *= Math.abs(Math.cos(skewX * _DEG2RAD)));
			if (cache.svg) {
				x -= xOrigin - (xOrigin * a + yOrigin * c);
				y -= yOrigin - (xOrigin * b + yOrigin * d);
			}
		} else {
			a32 = matrix[6];
			a42 = matrix[7];
			a13 = matrix[8];
			a23 = matrix[9];
			a33 = matrix[10];
			a43 = matrix[11];
			x = matrix[12];
			y = matrix[13];
			z = matrix[14];
			angle = _atan2(a32, a33);
			rotationX = angle * _RAD2DEG;
			if (angle) {
				cos = Math.cos(-angle);
				sin = Math.sin(-angle);
				t1 = a12 * cos + a13 * sin;
				t2 = a22 * cos + a23 * sin;
				t3 = a32 * cos + a33 * sin;
				a13 = a12 * -sin + a13 * cos;
				a23 = a22 * -sin + a23 * cos;
				a33 = a32 * -sin + a33 * cos;
				a43 = a42 * -sin + a43 * cos;
				a12 = t1;
				a22 = t2;
				a32 = t3;
			}
			angle = _atan2(-c, a33);
			rotationY = angle * _RAD2DEG;
			if (angle) {
				cos = Math.cos(-angle);
				sin = Math.sin(-angle);
				t1 = a * cos - a13 * sin;
				t2 = b * cos - a23 * sin;
				t3 = c * cos - a33 * sin;
				a43 = d * sin + a43 * cos;
				a = t1;
				b = t2;
				c = t3;
			}
			angle = _atan2(b, a);
			rotation = angle * _RAD2DEG;
			if (angle) {
				cos = Math.cos(angle);
				sin = Math.sin(angle);
				t1 = a * cos + b * sin;
				t2 = a12 * cos + a22 * sin;
				b = b * cos - a * sin;
				a22 = a22 * cos - a12 * sin;
				a = t1;
				a12 = t2;
			}
			if (rotationX && Math.abs(rotationX) + Math.abs(rotation) > 359.9) {
				rotationX = rotation = 0;
				rotationY = 180 - rotationY;
			}
			scaleX = _round(Math.sqrt(a * a + b * b + c * c));
			scaleY = _round(Math.sqrt(a22 * a22 + a32 * a32));
			angle = _atan2(a12, a22);
			skewX = Math.abs(angle) > 2e-4 ? angle * _RAD2DEG : 0;
			perspective = a43 ? 1 / (a43 < 0 ? -a43 : a43) : 0;
		}
		if (cache.svg) {
			t1 = target.getAttribute("transform");
			cache.forceCSS = target.setAttribute("transform", "") || !_isNullTransform(_getComputedProperty(target, _transformProp));
			t1 && target.setAttribute("transform", t1);
		}
	}
	if (Math.abs(skewX) > 90 && Math.abs(skewX) < 270) if (invertedScaleX) {
		scaleX *= -1;
		skewX += rotation <= 0 ? 180 : -180;
		rotation += rotation <= 0 ? 180 : -180;
	} else {
		scaleY *= -1;
		skewX += skewX <= 0 ? 180 : -180;
	}
	uncache = uncache || cache.uncache;
	cache.x = x - ((cache.xPercent = x && (!uncache && cache.xPercent || (Math.round(target.offsetWidth / 2) === Math.round(-x) ? -50 : 0))) ? target.offsetWidth * cache.xPercent / 100 : 0) + px;
	cache.y = y - ((cache.yPercent = y && (!uncache && cache.yPercent || (Math.round(target.offsetHeight / 2) === Math.round(-y) ? -50 : 0))) ? target.offsetHeight * cache.yPercent / 100 : 0) + px;
	cache.z = z + px;
	cache.scaleX = _round(scaleX);
	cache.scaleY = _round(scaleY);
	cache.rotation = _round(rotation) + deg;
	cache.rotationX = _round(rotationX) + deg;
	cache.rotationY = _round(rotationY) + deg;
	cache.skewX = skewX + deg;
	cache.skewY = skewY + deg;
	cache.transformPerspective = perspective + px;
	if (cache.zOrigin = parseFloat(origin.split(" ")[2]) || !uncache && cache.zOrigin || 0) style[_transformOriginProp] = _firstTwoOnly(origin);
	cache.xOffset = cache.yOffset = 0;
	cache.force3D = _config.force3D;
	cache.renderTransform = cache.svg ? _renderSVGTransforms : _supports3D ? _renderCSSTransforms : _renderNon3DTransforms;
	cache.uncache = 0;
	return cache;
};
var _firstTwoOnly = function _firstTwoOnly(value) {
	return (value = value.split(" "))[0] + " " + value[1];
};
var _addPxTranslate = function _addPxTranslate(target, start, value) {
	var unit = getUnit(start);
	return _round(parseFloat(start) + parseFloat(_convertToUnit(target, "x", value + "px", unit))) + unit;
};
var _renderNon3DTransforms = function _renderNon3DTransforms(ratio, cache) {
	cache.z = "0px";
	cache.rotationY = cache.rotationX = "0deg";
	cache.force3D = 0;
	_renderCSSTransforms(ratio, cache);
};
var _zeroDeg = "0deg";
var _zeroPx = "0px";
var _endParenthesis = ") ";
var _renderCSSTransforms = function _renderCSSTransforms(ratio, cache) {
	var _ref = cache || this, xPercent = _ref.xPercent, yPercent = _ref.yPercent, x = _ref.x, y = _ref.y, z = _ref.z, rotation = _ref.rotation, rotationY = _ref.rotationY, rotationX = _ref.rotationX, skewX = _ref.skewX, skewY = _ref.skewY, scaleX = _ref.scaleX, scaleY = _ref.scaleY, transformPerspective = _ref.transformPerspective, force3D = _ref.force3D, target = _ref.target, zOrigin = _ref.zOrigin, transforms = "", use3D = force3D === "auto" && ratio && ratio !== 1 || force3D === true;
	if (zOrigin && (rotationX !== _zeroDeg || rotationY !== _zeroDeg)) {
		var angle = parseFloat(rotationY) * _DEG2RAD, a13 = Math.sin(angle), a33 = Math.cos(angle), cos;
		angle = parseFloat(rotationX) * _DEG2RAD;
		cos = Math.cos(angle);
		x = _addPxTranslate(target, x, a13 * cos * -zOrigin);
		y = _addPxTranslate(target, y, -Math.sin(angle) * -zOrigin);
		z = _addPxTranslate(target, z, a33 * cos * -zOrigin + zOrigin);
	}
	if (transformPerspective !== _zeroPx) transforms += "perspective(" + transformPerspective + _endParenthesis;
	if (xPercent || yPercent) transforms += "translate(" + xPercent + "%, " + yPercent + "%) ";
	if (use3D || x !== _zeroPx || y !== _zeroPx || z !== _zeroPx) transforms += z !== _zeroPx || use3D ? "translate3d(" + x + ", " + y + ", " + z + ") " : "translate(" + x + ", " + y + _endParenthesis;
	if (rotation !== _zeroDeg) transforms += "rotate(" + rotation + _endParenthesis;
	if (rotationY !== _zeroDeg) transforms += "rotateY(" + rotationY + _endParenthesis;
	if (rotationX !== _zeroDeg) transforms += "rotateX(" + rotationX + _endParenthesis;
	if (skewX !== _zeroDeg || skewY !== _zeroDeg) transforms += "skew(" + skewX + ", " + skewY + _endParenthesis;
	if (scaleX !== 1 || scaleY !== 1) transforms += "scale(" + scaleX + ", " + scaleY + _endParenthesis;
	target.style[_transformProp] = transforms || "translate(0, 0)";
};
var _renderSVGTransforms = function _renderSVGTransforms(ratio, cache) {
	var _ref2 = cache || this, xPercent = _ref2.xPercent, yPercent = _ref2.yPercent, x = _ref2.x, y = _ref2.y, rotation = _ref2.rotation, skewX = _ref2.skewX, skewY = _ref2.skewY, scaleX = _ref2.scaleX, scaleY = _ref2.scaleY, target = _ref2.target, xOrigin = _ref2.xOrigin, yOrigin = _ref2.yOrigin, xOffset = _ref2.xOffset, yOffset = _ref2.yOffset, forceCSS = _ref2.forceCSS, tx = parseFloat(x), ty = parseFloat(y), a11, a21, a12, a22, temp;
	rotation = parseFloat(rotation);
	skewX = parseFloat(skewX);
	skewY = parseFloat(skewY);
	if (skewY) {
		skewY = parseFloat(skewY);
		skewX += skewY;
		rotation += skewY;
	}
	if (rotation || skewX) {
		rotation *= _DEG2RAD;
		skewX *= _DEG2RAD;
		a11 = Math.cos(rotation) * scaleX;
		a21 = Math.sin(rotation) * scaleX;
		a12 = Math.sin(rotation - skewX) * -scaleY;
		a22 = Math.cos(rotation - skewX) * scaleY;
		if (skewX) {
			skewY *= _DEG2RAD;
			temp = Math.tan(skewX - skewY);
			temp = Math.sqrt(1 + temp * temp);
			a12 *= temp;
			a22 *= temp;
			if (skewY) {
				temp = Math.tan(skewY);
				temp = Math.sqrt(1 + temp * temp);
				a11 *= temp;
				a21 *= temp;
			}
		}
		a11 = _round(a11);
		a21 = _round(a21);
		a12 = _round(a12);
		a22 = _round(a22);
	} else {
		a11 = scaleX;
		a22 = scaleY;
		a21 = a12 = 0;
	}
	if (tx && !~(x + "").indexOf("px") || ty && !~(y + "").indexOf("px")) {
		tx = _convertToUnit(target, "x", x, "px");
		ty = _convertToUnit(target, "y", y, "px");
	}
	if (xOrigin || yOrigin || xOffset || yOffset) {
		tx = _round(tx + xOrigin - (xOrigin * a11 + yOrigin * a12) + xOffset);
		ty = _round(ty + yOrigin - (xOrigin * a21 + yOrigin * a22) + yOffset);
	}
	if (xPercent || yPercent) {
		temp = target.getBBox();
		tx = _round(tx + xPercent / 100 * temp.width);
		ty = _round(ty + yPercent / 100 * temp.height);
	}
	temp = "matrix(" + a11 + "," + a21 + "," + a12 + "," + a22 + "," + tx + "," + ty + ")";
	target.setAttribute("transform", temp);
	forceCSS && (target.style[_transformProp] = temp);
};
var _addRotationalPropTween = function _addRotationalPropTween(plugin, target, property, startNum, endValue) {
	var cap = 360, isString = _isString(endValue), change = parseFloat(endValue) * (isString && ~endValue.indexOf("rad") ? _RAD2DEG : 1) - startNum, finalValue = startNum + change + "deg", direction, pt;
	if (isString) {
		direction = endValue.split("_")[1];
		if (direction === "short") {
			change %= cap;
			if (change !== change % (cap / 2)) change += change < 0 ? cap : -cap;
		}
		if (direction === "cw" && change < 0) change = (change + cap * _bigNum) % cap - ~~(change / cap) * cap;
		else if (direction === "ccw" && change > 0) change = (change - cap * _bigNum) % cap - ~~(change / cap) * cap;
	}
	plugin._pt = pt = new PropTween(plugin._pt, target, property, startNum, change, _renderPropWithEnd);
	pt.e = finalValue;
	pt.u = "deg";
	plugin._props.push(property);
	return pt;
};
var _assign = function _assign(target, source) {
	for (var p in source) target[p] = source[p];
	return target;
};
var _addRawTransformPTs = function _addRawTransformPTs(plugin, transforms, target) {
	var startCache = _assign({}, target._gsap), exclude = "perspective,force3D,transformOrigin,svgOrigin", style = target.style, endCache, p, startValue, endValue, startNum, endNum, startUnit, endUnit;
	if (startCache.svg) {
		startValue = target.getAttribute("transform");
		target.setAttribute("transform", "");
		style[_transformProp] = transforms;
		endCache = _parseTransform(target, 1);
		_removeProperty(target, _transformProp);
		target.setAttribute("transform", startValue);
	} else {
		startValue = getComputedStyle(target)[_transformProp];
		style[_transformProp] = transforms;
		endCache = _parseTransform(target, 1);
		style[_transformProp] = startValue;
	}
	for (p in _transformProps) {
		startValue = startCache[p];
		endValue = endCache[p];
		if (startValue !== endValue && exclude.indexOf(p) < 0) {
			startUnit = getUnit(startValue);
			endUnit = getUnit(endValue);
			startNum = startUnit !== endUnit ? _convertToUnit(target, p, startValue, endUnit) : parseFloat(startValue);
			endNum = parseFloat(endValue);
			plugin._pt = new PropTween(plugin._pt, endCache, p, startNum, endNum - startNum, _renderCSSProp);
			plugin._pt.u = endUnit || 0;
			plugin._props.push(p);
		}
	}
	_assign(endCache, startCache);
};
_forEachName("padding,margin,Width,Radius", function(name, index) {
	var t = "Top", r = "Right", b = "Bottom", l = "Left", props = (index < 3 ? [
		t,
		r,
		b,
		l
	] : [
		t + l,
		t + r,
		b + r,
		b + l
	]).map(function(side) {
		return index < 2 ? name + side : "border" + side + name;
	});
	_specialProps[index > 1 ? "border" + name : name] = function(plugin, target, property, endValue, tween) {
		var a, vars;
		if (arguments.length < 4) {
			a = props.map(function(prop) {
				return _get(plugin, prop, property);
			});
			vars = a.join(" ");
			return vars.split(a[0]).length === 5 ? a[0] : vars;
		}
		a = (endValue + "").split(" ");
		vars = {};
		props.forEach(function(prop, i) {
			return vars[prop] = a[i] = a[i] || a[(i - 1) / 2 | 0];
		});
		plugin.init(target, vars, tween);
	};
});
var CSSPlugin = {
	name: "css",
	register: _initCore,
	targetTest: function targetTest(target) {
		return target.style && target.nodeType;
	},
	init: function init(target, vars, tween, index, targets) {
		var props = this._props, style = target.style, startAt = tween.vars.startAt, startValue, endValue, endNum, startNum, type, specialProp, p, startUnit, endUnit, relative, isTransformRelated, transformPropTween, cache, smooth, hasPriority, inlineProps, finalTransformValue;
		_pluginInitted || _initCore();
		this.styles = this.styles || _getStyleSaver(target);
		inlineProps = this.styles.props;
		this.tween = tween;
		for (p in vars) {
			if (p === "autoRound") continue;
			endValue = vars[p];
			if (_plugins[p] && _checkPlugin(p, vars, tween, index, target, targets)) continue;
			type = typeof endValue;
			specialProp = _specialProps[p];
			if (type === "function") {
				endValue = endValue.call(tween, index, target, targets);
				type = typeof endValue;
			}
			if (type === "string" && ~endValue.indexOf("random(")) endValue = _replaceRandom(endValue);
			if (specialProp) specialProp(this, target, p, endValue, tween) && (hasPriority = 1);
			else if (p.substr(0, 2) === "--") {
				startValue = (getComputedStyle(target).getPropertyValue(p) + "").trim();
				endValue += "";
				_colorExp.lastIndex = 0;
				if (!_colorExp.test(startValue)) {
					startUnit = getUnit(startValue);
					endUnit = getUnit(endValue);
					endUnit ? startUnit !== endUnit && (startValue = _convertToUnit(target, p, startValue, endUnit) + endUnit) : startUnit && (endValue += startUnit);
				}
				this.add(style, "setProperty", startValue, endValue, index, targets, 0, 0, p);
				props.push(p);
				inlineProps.push(p, 0, style[p]);
			} else if (type !== "undefined") {
				if (startAt && p in startAt) {
					startValue = typeof startAt[p] === "function" ? startAt[p].call(tween, index, target, targets) : startAt[p];
					_isString(startValue) && ~startValue.indexOf("random(") && (startValue = _replaceRandom(startValue));
					getUnit(startValue + "") || startValue === "auto" || (startValue += _config.units[p] || getUnit(_get(target, p)) || "");
					(startValue + "").charAt(1) === "=" && (startValue = _get(target, p));
				} else startValue = _get(target, p);
				startNum = parseFloat(startValue);
				relative = type === "string" && endValue.charAt(1) === "=" && endValue.substr(0, 2);
				relative && (endValue = endValue.substr(2));
				endNum = parseFloat(endValue);
				if (p in _propertyAliases) {
					if (p === "autoAlpha") {
						if (startNum === 1 && _get(target, "visibility") === "hidden" && endNum) startNum = 0;
						inlineProps.push("visibility", 0, style.visibility);
						_addNonTweeningPT(this, style, "visibility", startNum ? "inherit" : "hidden", endNum ? "inherit" : "hidden", !endNum);
					}
					if (p !== "scale" && p !== "transform") {
						p = _propertyAliases[p];
						~p.indexOf(",") && (p = p.split(",")[0]);
					}
				}
				isTransformRelated = p in _transformProps;
				if (isTransformRelated) {
					this.styles.save(p);
					finalTransformValue = endValue;
					if (type === "string" && endValue.substring(0, 6) === "var(--") {
						endValue = _getComputedProperty(target, endValue.substring(4, endValue.indexOf(")")));
						if (endValue.substring(0, 5) === "calc(") {
							var origPerspective = target.style.perspective;
							target.style.perspective = endValue;
							endValue = _getComputedProperty(target, "perspective");
							origPerspective ? target.style.perspective = origPerspective : _removeProperty(target, "perspective");
						}
						endNum = parseFloat(endValue);
					}
					if (!transformPropTween) {
						cache = target._gsap;
						cache.renderTransform && !vars.parseTransform || _parseTransform(target, vars.parseTransform);
						smooth = vars.smoothOrigin !== false && cache.smooth;
						transformPropTween = this._pt = new PropTween(this._pt, style, _transformProp, 0, 1, cache.renderTransform, cache, 0, -1);
						transformPropTween.dep = 1;
					}
					if (p === "scale") {
						this._pt = new PropTween(this._pt, cache, "scaleY", cache.scaleY, (relative ? _parseRelative(cache.scaleY, relative + endNum) : endNum) - cache.scaleY || 0, _renderCSSProp);
						this._pt.u = 0;
						props.push("scaleY", p);
						p += "X";
					} else if (p === "transformOrigin") {
						inlineProps.push(_transformOriginProp, 0, style[_transformOriginProp]);
						endValue = _convertKeywordsToPercentages(endValue);
						if (cache.svg) _applySVGOrigin(target, endValue, 0, smooth, 0, this);
						else {
							endUnit = parseFloat(endValue.split(" ")[2]) || 0;
							endUnit !== cache.zOrigin && _addNonTweeningPT(this, cache, "zOrigin", cache.zOrigin, endUnit);
							_addNonTweeningPT(this, style, p, _firstTwoOnly(startValue), _firstTwoOnly(endValue));
						}
						continue;
					} else if (p === "svgOrigin") {
						_applySVGOrigin(target, endValue, 1, smooth, 0, this);
						continue;
					} else if (p in _rotationalProperties) {
						_addRotationalPropTween(this, cache, p, startNum, relative ? _parseRelative(startNum, relative + endValue) : endValue);
						continue;
					} else if (p === "smoothOrigin") {
						_addNonTweeningPT(this, cache, "smooth", cache.smooth, endValue);
						continue;
					} else if (p === "force3D") {
						cache[p] = endValue;
						continue;
					} else if (p === "transform") {
						_addRawTransformPTs(this, endValue, target);
						continue;
					}
				} else if (!(p in style)) p = _checkPropPrefix(p) || p;
				if (isTransformRelated || (endNum || endNum === 0) && (startNum || startNum === 0) && !_complexExp.test(endValue) && p in style) {
					startUnit = (startValue + "").substr((startNum + "").length);
					endNum || (endNum = 0);
					endUnit = getUnit(endValue) || (p in _config.units ? _config.units[p] : startUnit);
					startUnit !== endUnit && (startNum = _convertToUnit(target, p, startValue, endUnit));
					this._pt = new PropTween(this._pt, isTransformRelated ? cache : style, p, startNum, (relative ? _parseRelative(startNum, relative + endNum) : endNum) - startNum, !isTransformRelated && (endUnit === "px" || p === "zIndex") && vars.autoRound !== false ? _renderRoundedCSSProp : _renderCSSProp);
					this._pt.u = endUnit || 0;
					if (isTransformRelated && finalTransformValue !== endValue) {
						this._pt.b = startValue;
						this._pt.e = finalTransformValue;
						this._pt.r = _renderCSSPropWithBeginningAndEnd;
					} else if (startUnit !== endUnit && endUnit !== "%") {
						this._pt.b = startValue;
						this._pt.r = _renderCSSPropWithBeginning;
					}
				} else if (!(p in style)) {
					if (p in target) this.add(target, p, startValue || target[p], relative ? relative + endValue : endValue, index, targets);
					else if (p !== "parseTransform") {
						_missingPlugin(p, endValue);
						continue;
					}
				} else _tweenComplexCSSString.call(this, target, p, startValue, relative ? relative + endValue : endValue);
				isTransformRelated || (p in style ? inlineProps.push(p, 0, style[p]) : typeof target[p] === "function" ? inlineProps.push(p, 2, target[p]()) : inlineProps.push(p, 1, startValue || target[p]));
				props.push(p);
			}
		}
		hasPriority && _sortPropTweensByPriority(this);
	},
	render: function render(ratio, data) {
		if (data.tween._time || !_reverting()) {
			var pt = data._pt;
			while (pt) {
				pt.r(ratio, pt.d);
				pt = pt._next;
			}
		} else data.styles.revert();
	},
	get: _get,
	aliases: _propertyAliases,
	getSetter: function getSetter(target, property, plugin) {
		var p = _propertyAliases[property];
		p && p.indexOf(",") < 0 && (property = p);
		return property in _transformProps && property !== _transformOriginProp && (target._gsap.x || _get(target, "x")) ? plugin && _recentSetterPlugin === plugin ? property === "scale" ? _setterScale : _setterTransform : (_recentSetterPlugin = plugin || {}) && (property === "scale" ? _setterScaleWithRender : _setterTransformWithRender) : target.style && !_isUndefined(target.style[property]) ? _setterCSSStyle : ~property.indexOf("-") ? _setterCSSProp : _getSetter(target, property);
	},
	core: {
		_removeProperty,
		_getMatrix
	}
};
gsap.utils.checkPrefix = _checkPropPrefix;
gsap.core.getStyleSaver = _getStyleSaver;
(function(positionAndScale, rotation, others, aliases) {
	var all = _forEachName(positionAndScale + "," + rotation + "," + others, function(name) {
		_transformProps[name] = 1;
	});
	_forEachName(rotation, function(name) {
		_config.units[name] = "deg";
		_rotationalProperties[name] = 1;
	});
	_propertyAliases[all[13]] = positionAndScale + "," + rotation;
	_forEachName(aliases, function(name) {
		var split = name.split(":");
		_propertyAliases[split[1]] = all[split[0]];
	});
})("x,y,z,scale,scaleX,scaleY,xPercent,yPercent", "rotation,rotationX,rotationY,skewX,skewY", "transform,transformOrigin,svgOrigin,force3D,smoothOrigin,transformPerspective", "0:translateX,1:translateY,2:translateZ,8:rotate,8:rotationZ,8:rotateZ,9:rotateX,10:rotateY");
_forEachName("x,y,z,top,right,bottom,left,width,height,fontSize,padding,margin,perspective", function(name) {
	_config.units[name] = "px";
});
gsap.registerPlugin(CSSPlugin);
//#endregion
//#region port/v2/node_modules/gsap/index.js
var gsapWithCSS = gsap.registerPlugin(CSSPlugin) || gsap;
gsapWithCSS.core.Tween;
//#endregion
//#region port/v2/apps/game/src/motion/gsap-adapter.ts
const GSAP_EASE = Object.freeze({
	"ease-out": "power1.out",
	"ease-in": "power1.in",
	"back-out": "back.out(1.70158)",
	"sine-in-out": "sine.inOut"
});
function createGsapPlayer(timeline, target, options) {
	const g = options.gsapLib ?? gsapWithCSS;
	const values = {}, root = {
		dx: 0,
		dy: 0
	};
	const tl = g.timeline({
		paused: true,
		repeat: timeline.loop ? -1 : 0
	});
	const addTrack = (obj, key, keys) => {
		for (let i = 1; i < keys.length; i++) {
			const a = keys[i - 1], b = keys[i], dur = Math.max(0, b.ms - a.ms) / 1e3;
			tl.to(obj, {
				[key]: b.value,
				duration: dur,
				ease: GSAP_EASE[b.ease],
				overwrite: false
			}, a.ms / 1e3);
		}
	};
	const secondaryJoints = new Map(timeline.secondary.map((s) => [s.joint, s]));
	for (const [joint, keys] of Object.entries(timeline.tracks)) {
		const s = secondaryJoints.get(joint);
		values[joint] = { v: keys[0]?.value ?? 0 };
		addTrack(values[joint], "v", s && !s.rigid ? s.keys : keys);
	}
	addTrack(root, "dx", timeline.root.dx);
	addTrack(root, "dy", timeline.root.dy);
	tl.to({}, { duration: timeline.durationMs / 1e3 }, 0);
	const push = () => {
		for (const [joint, cell] of Object.entries(values)) target.setJoint(joint, cell.v, joint === "root" ? root.dx : 0, joint === "root" ? root.dy : 0);
	};
	let startMs = 0, running = false;
	const seek = (ms) => {
		if (timeline.loop) {
			const w = (ms % timeline.bodyMs + timeline.bodyMs) % timeline.bodyMs;
			tl.time(w / 1e3, false);
			for (const s of timeline.secondary) if (!s.rigid) values[s.joint].v = sampleKeys(s.keys, ((w - s.lagMs) % timeline.bodyMs + timeline.bodyMs) % timeline.bodyMs + s.lagMs);
		} else tl.time(Math.min(Math.max(ms, 0), timeline.durationMs) / 1e3, false);
		push();
	};
	return {
		timeline,
		start() {
			startMs = options.now();
			running = true;
			seek(0);
		},
		tick() {
			if (!running) return 0;
			const ms = options.now() - startMs;
			seek(ms);
			return timeline.loop ? ms % timeline.bodyMs / timeline.bodyMs : Math.min(1, ms / timeline.durationMs);
		},
		seek,
		stop() {
			running = false;
			tl.kill();
		}
	};
}
Object.freeze({
	parts: 40,
	bones: 32,
	atlas: {
		desktop: 2048,
		phone: 1024
	},
	updateMs: {
		desktop: 2,
		phone: 4
	},
	effect: {
		phaseTextures: 3,
		particles: 200
	},
	frameRate: {
		desktop: 60,
		phone: 30
	}
});
//#endregion
//#region port/v2/apps/game/src/battle-presentation-clock.ts
function bodyPresentationMs(elapsedMs, holds) {
	if (!Number.isFinite(elapsedMs) || elapsedMs < 0) throw Error("Presentation time: elapsed");
	let removed = 0, end = -Infinity;
	for (const hold of holds) {
		if (!Number.isFinite(hold.atMs) || !Number.isFinite(hold.durationMs) || hold.atMs < 0 || hold.durationMs < 0 || hold.atMs < end) throw Error("Presentation time: ordered non-overlapping holds");
		end = hold.atMs + hold.durationMs;
		removed += Math.max(0, Math.min(hold.durationMs, elapsedMs - hold.atMs));
	}
	return elapsedMs - removed;
}
//#endregion
//#region port/v2/apps/game/src/motion-pose-blend.ts
/** Presentation-only continuity. Inputs are sampled shared motion curves;
* interpolation never changes world seeds, combat, anatomy or clip assets. */
function blendCreaturePoses(a, b, weight) {
	if (!Number.isFinite(weight) || weight < 0 || weight > 1) throw Error("Pose blend: weight");
	const out = {};
	for (const j of /* @__PURE__ */ new Set([...Object.keys(a), ...Object.keys(b)])) {
		const x = a[j] ?? {
			rotation: 0,
			dx: 0,
			dy: 0
		}, y = b[j] ?? {
			rotation: 0,
			dx: 0,
			dy: 0
		};
		out[j] = {
			rotation: (x.rotation ?? 0) * (1 - weight) + (y.rotation ?? 0) * weight,
			dx: (x.dx ?? 0) * (1 - weight) + (y.dx ?? 0) * weight,
			dy: (x.dy ?? 0) * (1 - weight) + (y.dy ?? 0) * weight
		};
	}
	return out;
}
function closedLoopPose(sample, ms, period) {
	if (!Number.isFinite(ms) || !Number.isFinite(period) || period <= 0) throw Error("Pose blend: period");
	const t = (ms % period + period) % period, window = period * .18;
	const raw = sample(t);
	if (t >= window) return raw;
	const u = t / window, w = u * u * (3 - 2 * u);
	return blendCreaturePoses(sample(period - 1e-6), raw, w);
}
//#endregion
//#region port/v2/tools/quadruped-proof/capture-contract.mjs
/** Supply live frames until the recorder acknowledges start. Waiting for its
* start event before feeding the canvas can deadlock metadata acquisition. */
function primeRecorder({ started, paint, requestFrame, schedule, now, timeoutMs = 5e3 }) {
	const deadline = now() + timeoutMs;
	return new Promise((resolve, reject) => {
		const tick = () => {
			if (started()) {
				resolve();
				return;
			}
			if (now() >= deadline) {
				reject(Error("Recorder start deadline while feeding frames"));
				return;
			}
			paint();
			requestFrame();
			schedule(tick);
		};
		schedule(tick);
	});
}
//#endregion
//#region port/v2/tools/biome-encounter/recipe.mjs
const hash = (s) => {
	let h = 2166136261;
	for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
	return h >>> 0;
};
const rng = (seed) => () => {
	seed += 1831565813;
	let n = Math.imul(seed ^ seed >>> 15, 1 | seed);
	n ^= n + Math.imul(n ^ n >>> 7, 61 | n);
	return ((n ^ n >>> 14) >>> 0) / 4294967296;
};
function compileClearing({ seed, world, actors }) {
	if (!Number.isInteger(seed) || seed < 0 || seed > 4294967295 || world.biome !== "temperate" || !world.cardHash || !world.solid || world.groundLineY !== .78) throw Error("Clearing: supported source/card/ground required");
	if (actors.length !== 3 || new Set(actors.map((a) => a.id)).size !== 3 || actors.some((a) => !a.physical.allowed.includes("ground"))) throw Error("Clearing: three distinct ground-compatible actors required");
	const recipeSeed = hash(JSON.stringify([
		seed,
		world.key,
		world.cardHash,
		actors.map((a) => [a.id, a.recordHash])
	])), random = rng(recipeSeed);
	const scenery = {
		farOffset: (random() - .5) * 90,
		farScale: 1.1 + random() * .05,
		midOffset: (random() - .5) * 40,
		trees: [{
			x: -.045 + random() * .06,
			height: .63 + random() * .1,
			flip: false
		}, {
			x: .96 + random() * .07,
			height: .56 + random() * .12,
			flip: true
		}],
		shrubs: [{
			x: .035 + random() * .03,
			height: .15 + random() * .04
		}, {
			x: .94 + random() * .035,
			height: .15 + random() * .04
		}],
		rain: Array.from({ length: 110 }, () => ({
			x: random(),
			y: random(),
			speed: .7 + random() * .6,
			length: .008 + random() * .007
		}))
	};
	const order = [
		0,
		1,
		2
	];
	for (let i = order.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[order[i], order[j]] = [order[j], order[i]];
	}
	return {
		schema: "cf.seeded-painted-clearing/v1",
		seed: recipeSeed,
		encounterSeed: seed,
		world,
		actors,
		scenery,
		turns: order.map((actor, index) => ({
			actor,
			target: actor === 2 ? random() < .5 ? 0 : 1 : 2,
			startMs: index * 6e3,
			damage: 16 + Math.floor(random() * 13)
		})),
		durationMs: 18e3,
		groundLineY: .78,
		template: "accepted Earth temperate v1",
		generation: "seeded composition of existing painted layers; no newly inferred biome painting"
	};
}
const ease = (t) => {
	const x = Math.max(0, Math.min(1, t));
	return x * x * (3 - 2 * x);
};
/** Absolute scene time; no frame accumulation or wall clock enters the recipe. */
function encounterBeat(recipe, ms, cards) {
	if (!Number.isFinite(ms) || ms < 0) throw Error("Encounter time");
	const turn = recipe.turns[Math.min(2, Math.floor(ms / 6e3))], t = Math.min(5999, ms - turn.startMs), card = cards[turn.actor];
	const approachStart = 900, attackStart = 1350, impact = attackStart + card.meleeMs * .42, attackEnd = attackStart + card.meleeMs, returnEnd = attackEnd + 450;
	return {
		turn,
		t,
		approachStart,
		attackStart,
		impact,
		attackEnd,
		returnEnd,
		travel: t < attackStart ? ease((t - approachStart) / 450) : t < attackEnd ? 1 : 1 - ease((t - attackEnd) / 450),
		phase: t < approachStart ? "ready" : t < attackStart ? "approach" : t < attackEnd ? "attack" : t < returnEnd ? "return" : "settle"
	};
}
//#endregion
//#region port/v2/tools/biome-encounter/contact.mjs
/** These admitted masters face +X in source space. Mirroring changes the screen
* transform, never which source end is the mouth. Use the published jaw mesh. */
function mouthOffset(jaw, rootX, scale, direction) {
	if (!jaw?.length || jaw.length % 2 || ![
		rootX,
		scale,
		...jaw
	].every(Number.isFinite) || scale <= 0 || ![-1, 1].includes(direction)) throw Error("Encounter: invalid mouth geometry");
	let x = -Infinity;
	for (let i = 0; i < jaw.length; i += 2) x = Math.max(x, jaw[i]);
	return rootX + x * scale * direction;
}
//#endregion
//#region port/v2/tools/biome-encounter/native-entry.mjs
const state = { status: "LOADING" };
window.cfClearing = { state };
const get = async (n) => {
	const r = await fetch(n);
	if (!r.ok) throw Error("Missing scene asset " + n);
	return r;
};
const json = async (n) => (await get(n)).json();
const bytes = async (n) => new Uint8Array(await (await get(n)).arrayBuffer());
const b64 = (b) => {
	let s = "";
	const a = new Uint8Array(b);
	for (let i = 0; i < a.length; i += 8192) s += String.fromCharCode(...a.subarray(i, i + 8192));
	return btoa(s);
};
const image = async (n) => {
	const b = await bytes(n), bmp = await createImageBitmap(new Blob([b])), c = new OffscreenCanvas(bmp.width, bmp.height), ctx = c.getContext("2d");
	ctx.drawImage(bmp, 0, 0);
	return {
		bytes: b,
		canvas: c,
		rgba: ctx.getImageData(0, 0, c.width, c.height).data
	};
};
try {
	const W = 1600, H = 900, app = new Application();
	await app.init({
		width: W,
		height: H,
		resolution: 1,
		background: 2371627,
		antialias: true,
		autoStart: false,
		preference: "webgl"
	});
	document.body.append(app.canvas);
	const world = await json("world.json"), assets = {};
	for (const id of [
		"far",
		"mid",
		"near",
		"tree",
		"shrub",
		"impact"
	]) assets[id] = await image(id + ".png");
	const actors = [];
	for (const [id, name, homeX, height, direction] of [
		[
			"rosette",
			"ROSETTE",
			.21,
			.35,
			1
		],
		[
			"crystal",
			"GLASSHORN",
			.39,
			.28,
			1
		],
		[
			"broad",
			"THICKET PROWLER",
			.8,
			.37,
			-1
		]
	]) {
		const record = await json(id + "-record.json"), binding = await json(id + "-binding.json"), paint = await image(id + "-keyed.png"), atlas = await image(id + "-atlas.png"), rig = await loadCreatureRigV1(record, binding, await bytes(id + "-master.png"), Uint8Array.from({ length: paint.canvas.width * paint.canvas.height }, (_, i) => paint.rgba[i * 4 + 3]), atlas.bytes), card = compileBodyCard(record, record.genome), clips = {};
		for (const action of [
			"idle",
			"approach",
			"melee",
			"hit"
		]) {
			const tl = buildTimeline(card, action, record.identity.seed);
			let p = {};
			const player = createGsapPlayer(tl, { setJoint(n, rotation, dx, dy) {
				p[n] = {
					rotation,
					dx,
					dy
				};
			} }, { now: () => 0 });
			clips[action] = {
				tl,
				sample(ms) {
					p = {};
					player.seek(ms);
					return p;
				}
			};
		}
		const positions = () => Object.fromEntries(binding.paintSkin.parts.map((p) => [p.id, rig.parts.find((r) => r.id === p.id).display.children[0].geometry.getBuffer("aPosition").data]));
		const bounds = () => {
			let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
			for (const p of Object.values(positions())) for (let i = 0; i < p.length; i += 2) {
				x0 = Math.min(x0, p[i]);
				y0 = Math.min(y0, p[i + 1]);
				x1 = Math.max(x1, p[i]);
				y1 = Math.max(y1, p[i + 1]);
			}
			return {
				x0,
				y0,
				x1,
				y1
			};
		};
		rig.applyPose({});
		const rest = bounds(), scale = H * height / (rest.y1 - rest.y0), holder = new Container();
		holder.addChild(rig.root);
		rig.root.scale.set(direction * scale, scale);
		rig.root.position.set(-(rest.x0 + rest.x1) / 2 * direction * scale, -rest.y1 * scale);
		actors.push({
			id,
			name,
			record,
			binding,
			rig,
			card,
			clips,
			positions,
			bounds,
			rest,
			scale,
			direction,
			holder,
			homeX,
			physical: resolvePhysicalHabitat(record, record.genome),
			probe: createSourceJoinProbe({
				record,
				binding,
				atlas: {
					rgba: atlas.rgba,
					width: atlas.canvas.width,
					height: atlas.canvas.height
				}
			})
		});
	}
	const pair = compileHabitatBattle({
		contextId: "painted-clearing-squad",
		seed: 301,
		round: 0,
		kind: "wild",
		home: world,
		visitor: world,
		left: actors[0].physical,
		right: actors[2].physical
	});
	if (pair.status !== "READY") throw Error(pair.reason);
	const scene = new Container();
	app.stage.addChild(scene);
	const far = new Sprite(Texture.from(assets.far.canvas));
	scene.addChild(far);
	const treeLayer = new Container();
	scene.addChild(treeLayer);
	const mid = new Sprite(Texture.from(assets.mid.canvas));
	mid.width = 1680;
	mid.height = H;
	mid.x = -40;
	scene.addChild(mid);
	const shadowLayer = new Graphics();
	scene.addChild(shadowLayer);
	scene.addChild(actors[1].holder, actors[0].holder, actors[2].holder);
	const near = new Sprite(Texture.from(assets.near.canvas));
	near.width = 1680;
	near.height = H;
	near.x = -40;
	scene.addChild(near);
	const shrubLayer = new Container();
	scene.addChild(shrubLayer);
	const fx = new Sprite(Texture.from(assets.impact.canvas));
	fx.anchor.set(.8, .55);
	fx.scale.set(.85);
	scene.addChild(fx);
	const rain = new Graphics();
	scene.addChild(rain);
	const hud = new Container();
	app.stage.addChild(hud);
	const top = new Graphics().rect(0, 0, W, 95).fill({
		color: 991266,
		alpha: .84
	});
	hud.addChild(top);
	const title = new Text({
		text: "THE RAINWOOD CLEARING",
		style: {
			fontFamily: "Georgia",
			fontSize: 27,
			fill: 16116946
		}
	});
	title.position.set(34, 16);
	hud.addChild(title);
	const subtitle = new Text({
		text: "",
		style: {
			fontFamily: "Arial",
			fontSize: 16,
			fill: 12439740
		}
	});
	subtitle.position.set(35, 57);
	hud.addChild(subtitle);
	const banner = new Text({
		text: "",
		style: {
			fontFamily: "Georgia",
			fontSize: 27,
			fill: 16768926
		}
	});
	banner.anchor.set(.5);
	banner.position.set(W / 2, 133);
	hud.addChild(banner);
	const cards = actors.map((a) => ({ meleeMs: a.clips.melee.tl.durationMs })), bars = new Graphics(), labels = [];
	hud.addChild(bars);
	for (const a of actors) {
		const label = new Text({
			text: a.name,
			style: {
				fontFamily: "Arial",
				fontSize: 17,
				fill: 16051663
			}
		});
		hud.addChild(label);
		labels.push(label);
	}
	const number = new Text({
		text: "",
		style: {
			fontFamily: "Arial",
			fontWeight: "bold",
			fontSize: 38,
			fill: 16769955
		}
	});
	hud.addChild(number);
	const footnote = new Text({
		text: "Seeded painted-template encounter · animation study",
		style: {
			fontFamily: "Arial",
			fontSize: 15,
			fill: 13095354
		}
	});
	footnote.position.set(28, 872);
	hud.addChild(footnote);
	let recipe, holds, clock = 0, playing = true, startTime = null, updates = {}, last = {};
	function choose(seed) {
		recipe = compileClearing({
			seed,
			world,
			actors: actors.map((a) => ({
				id: a.id,
				recordHash: a.record.recipeHash,
				physical: a.physical
			}))
		});
		holds = recipe.turns.map((turn) => ({
			atMs: turn.startMs + 1350 + cards[turn.actor].meleeMs * .42,
			durationMs: actors[turn.actor].clips.melee.tl.hitstopMs
		}));
		for (const layer of [treeLayer, shrubLayer]) layer.removeChildren().forEach((c) => c.destroy());
		for (const p of recipe.scenery.trees) {
			const s = new Sprite(Texture.from(assets.tree.canvas));
			s.anchor.set(.5, 1);
			s.height = p.height * H;
			s.scale.x = Math.abs(s.scale.y) * (p.flip ? -1 : 1);
			s.position.set(p.x * W, H * .76);
			treeLayer.addChild(s);
		}
		for (const p of recipe.scenery.shrubs) {
			const s = new Sprite(Texture.from(assets.shrub.canvas));
			s.anchor.set(.5, 1);
			s.height = p.height * H;
			s.scale.x = s.scale.y;
			s.position.set(p.x * W, H * .99);
			shrubLayer.addChild(s);
		}
		far.width = W * recipe.scenery.farScale;
		far.height = H * recipe.scenery.farScale;
		far.position.set((W - far.width) / 2 + recipe.scenery.farOffset, H - far.height);
		subtitle.text = "Temperate · rain · encounter " + seed + " · three combatants";
		clock = 0;
		startTime = null;
		updates = Object.fromEntries(actors.map((a) => [a.id, []]));
		stageAt(0);
		return recipe;
	}
	function stageAt(ms, measure = false) {
		clock = ms;
		const turnIndex = Math.min(2, Math.floor(ms / 6e3)), bodyMs = bodyPresentationMs(ms, holds), localBody = bodyMs - bodyPresentationMs(turnIndex * 6e3, holds), b = encounterBeat(recipe, turnIndex * 6e3 + localBody, cards), rawT = ms - b.turn.startMs, hitAge = ms - holds[turnIndex].atMs, atImpact = hitAge >= 0 && hitAge < holds[turnIndex].durationMs;
		const bounds = [];
		for (let i = 0; i < actors.length; i++) {
			const a = actors[i], at = performance.now();
			let p = closedLoopPose(a.clips.idle.sample, bodyMs + i * 337, a.clips.idle.tl.durationMs), action = "idle", age = 0, weight = 0;
			if (i === b.turn.actor && b.phase === "approach") {
				action = "approach";
				age = b.t - b.approachStart;
				weight = ease(age / 100);
			} else if (i === b.turn.actor && b.t >= b.attackStart && b.t <= b.attackEnd) {
				action = "melee";
				age = b.t - b.attackStart;
				weight = Math.min(ease(age / 90), ease((b.attackEnd - b.t) / 130));
			} else if (i === b.turn.actor && b.phase === "return") {
				action = "approach";
				age = b.t - b.attackEnd;
				weight = 1 - ease(age / 450);
			} else if (i === b.turn.target && b.t >= b.impact && b.t < b.impact + a.clips.hit.tl.durationMs) {
				action = "hit";
				age = b.t - b.impact;
				weight = Math.min(ease(age / 50), ease((a.clips.hit.tl.durationMs - age) / 120));
			}
			if (weight > 0) {
				const c = a.clips[action];
				p = blendCreaturePoses(p, action === "approach" ? closedLoopPose(c.sample, age, c.tl.bodyMs) : c.sample(age), weight);
			}
			a.rig.applyPose(p);
			if (measure) updates[a.id].push(performance.now() - at);
			bounds.push(a.bounds());
			a.holder.position.set(a.homeX * W, recipe.groundLineY * H);
			a.rig.root.tint = i === b.turn.target && hitAge >= 0 && hitAge < 90 ? 16767914 : 16777215;
		}
		const attack = actors[b.turn.actor], target = actors[b.turn.target], tb = bounds[b.turn.target];
		const mouth = (a) => mouthOffset(a.positions().jaw, a.rig.root.x, a.scale, a.direction), targetMouth = target.holder.x + mouth(target);
		const targetContact = targetMouth - target.direction * 12, desiredX = targetContact - mouth(attack);
		attack.holder.x = attack.homeX * W + (desiredX - attack.homeX * W) * b.travel;
		const flight = b.phase === "attack" ? Math.sin(Math.PI * Math.min(1, (b.t - b.attackStart) / cards[b.turn.actor].meleeMs)) * 24 : 0;
		attack.holder.y -= flight;
		const contact = {
			x: targetContact,
			y: target.holder.y + target.rig.root.y + (tb.y0 + (tb.y1 - tb.y0) * .45) * target.scale
		};
		shadowLayer.clear();
		for (let i = 0; i < actors.length; i++) {
			const a = actors[i], w = (a.rest.x1 - a.rest.x0) * a.scale * .3;
			shadowLayer.ellipse(a.holder.x, recipe.groundLineY * H + 3, w, 10).fill({
				color: 1318938,
				alpha: i === b.turn.actor ? .28 - .08 * b.travel : .28
			});
		}
		const push = .025 * b.travel;
		scene.scale.set(1 + push);
		scene.position.set(-1600 / 2 * push + (hitAge >= 0 && hitAge < 150 ? Math.sin(hitAge * .11) * (1 - hitAge / 150) * 4 : 0), -540 * push);
		far.x = (W - far.width) / 2 + recipe.scenery.farOffset - b.travel * attack.direction * 6;
		mid.x = -40 + recipe.scenery.midOffset - b.travel * attack.direction * 12;
		near.x = -40 - b.travel * attack.direction * 20;
		fx.visible = hitAge >= 0 && hitAge < holds[turnIndex].durationMs + 240;
		fx.position.set(contact.x, contact.y);
		fx.scale.set(.75 * attack.direction, .75);
		fx.alpha = 1;
		rain.clear();
		for (const p of recipe.scenery.rain) {
			const y = (p.y + ms * 2e-4 * p.speed) % 1 * H, x = p.x * W - y * .12;
			rain.moveTo(x, y).lineTo(x - 3, y + p.length * H).stroke({
				color: 14149071,
				alpha: .22,
				width: 1
			});
		}
		banner.text = b.phase === "approach" || b.phase === "attack" ? attack.name + "  ·  SAVAGE MAW" : "";
		bars.clear();
		for (let i = 0; i < actors.length; i++) {
			actors[i];
			const x = i === 2 ? 1290 : 30 + i * 320, y = 812;
			labels[i].position.set(x, 786);
			const damage = recipe.turns.reduce((n, tr, k) => n + (tr.target === i && ms >= holds[k].atMs ? tr.damage : 0), 0);
			bars.roundRect(x, y, 270, 10, 5).fill({
				color: 1582623,
				alpha: .9
			}).roundRect(x, y, 270 * Math.max(.1, (100 - damage) / 100), 10, 5).fill(i === 2 ? 13143650 : 10139780);
		}
		const timing = ease((rawT - 650) / 500);
		if (b.phase === "approach") bars.rect(W / 2 - 90, 160, 180, 4).fill({
			color: 1582623,
			alpha: .7
		}).rect(W / 2 - 90, 160, 180 * timing, 4).fill(14929804);
		number.text = hitAge >= 0 && hitAge < 750 ? "−" + b.turn.damage : "";
		number.position.set(contact.x, contact.y - 55 - Math.max(0, hitAge) * .06);
		number.alpha = hitAge < 400 ? 1 : Math.max(0, 1 - (hitAge - 400) / 350);
		app.renderer.render(app.stage);
		last = {
			beat: b,
			contact,
			contactGap: Math.abs((attack.holder.x + mouth(attack) - targetMouth) * attack.direction - 12),
			atImpact,
			bounds
		};
		return last;
	}
	function snapshot(ms) {
		stageAt(ms);
		return actors.map((a) => ({
			xy: [a.holder.x, a.holder.y],
			parts: Object.fromEntries(Object.entries(a.positions()).map(([id, v]) => [id, Array.from(v)]))
		}));
	}
	async function gates() {
		let samples = 0, maxGap = 0, failures = [];
		for (let i = 0; i <= 1080; i++) {
			const ms = i * 1e3 / 60, s = stageAt(ms);
			for (let n = 0; n < actors.length; n++) {
				const a = actors[n], seams = assessSourceJoinContinuity(a.probe, a.positions());
				maxGap = Math.max(maxGap, seams.maxGapPx);
				samples++;
				if (seams.status !== "PASS") failures.push({
					ms,
					id: a.id,
					reason: "seam"
				});
				const b = s.bounds[n], x = [b.x0, b.x1].map((x) => a.holder.x + a.rig.root.x + x * a.direction * a.scale), y0 = a.holder.y + a.rig.root.y + b.y0 * a.scale, y1 = a.holder.y + a.rig.root.y + b.y1 * a.scale;
				if (Math.min(...x) < 0 || Math.max(...x) > W || y0 < 95 || y1 > H * .9) failures.push({
					ms,
					id: a.id,
					reason: "body outside encounter",
					x,
					y0,
					y1
				});
			}
		}
		const freeze = holds.map((h) => JSON.stringify(snapshot(h.atMs + 1)) === JSON.stringify(snapshot(h.atMs + h.durationMs - 1))), contacts = holds.map((h) => stageAt(h.atMs + 1).contactGap), same = JSON.stringify(recipe) === JSON.stringify(compileClearing({
			seed: recipe.encounterSeed,
			world,
			actors: recipe.actors
		}));
		return {
			status: !failures.length && freeze.every(Boolean) && contacts.every((n) => n < 1) && same ? "PASS" : "FAIL",
			samples,
			maxSourceGapPx: maxGap,
			failures: failures.slice(0, 12),
			hitstopAllActors: freeze,
			contactGapPx: contacts,
			replayRecipeIdentical: same,
			recipe,
			impactTimes: holds.map((h) => h.atMs + h.durationMs / 2),
			scope: "Three painted grounded-family actors; published jaw/skin contact diagnostic, not anatomical bite or planted-paw certification"
		};
	}
	async function capture() {
		playing = false;
		const stream = app.canvas.captureStream(0), track = stream.getVideoTracks()[0], chunks = [], rec = new MediaRecorder(stream, {
			mimeType: "video/webm;codecs=vp9",
			videoBitsPerSecond: 8e6
		}), stopped = new Promise((r) => rec.onstop = r);
		rec.ondataavailable = (e) => {
			if (e.data.size) chunks.push(e.data);
		};
		let started = false;
		rec.onstart = () => started = true;
		rec.start();
		await primeRecorder({
			started: () => started,
			paint: () => stageAt(0),
			requestFrame: () => track.requestFrame(),
			schedule: requestAnimationFrame,
			now: () => performance.now()
		});
		updates = Object.fromEntries(actors.map((a) => [a.id, []]));
		let start;
		const frames = [], cpu = [];
		await new Promise((resolve, reject) => {
			const tick = (now) => {
				try {
					start ??= now;
					const ms = now - start, at = performance.now();
					stageAt(Math.min(ms, 18e3), true);
					cpu.push(performance.now() - at);
					track.requestFrame();
					frames.push(now);
					if (ms >= 18e3) resolve();
					else requestAnimationFrame(tick);
				} catch (e) {
					reject(e);
				}
			};
			requestAnimationFrame(tick);
		});
		await new Promise((r) => setTimeout(r, 120));
		track.requestFrame();
		rec.stop();
		await stopped;
		stream.getTracks().forEach((t) => t.stop());
		const p95 = (a) => a.sort((x, y) => x - y)[Math.floor(a.length * .95)];
		return {
			fps: (frames.length - 1) * 1e3 / (frames.at(-1) - frames[0]),
			frames: frames.length,
			wholeFrameP95Ms: p95(cpu),
			creatureP95Ms: Object.fromEntries(Object.entries(updates).map(([id, a]) => [id, p95(a)])),
			video: b64(await new Blob(chunks).arrayBuffer())
		};
	}
	window.cfClearing = {
		state,
		gates,
		capture,
		snapshot,
		choose,
		still(ms) {
			playing = false;
			stageAt(ms);
			return app.canvas.toDataURL("image/png").split(",")[1];
		},
		play() {
			playing = true;
			startTime = null;
		},
		pause() {
			playing = false;
		}
	};
	choose(301);
	state.status = "READY";
	function tick(now) {
		if (playing) {
			startTime ??= now - clock;
			stageAt((now - startTime) % 18e3);
		}
		requestAnimationFrame(tick);
	}
	requestAnimationFrame(tick);
	document.querySelector("#restart")?.addEventListener("click", () => {
		choose(recipe.encounterSeed);
		playing = true;
	});
	for (const b of document.querySelectorAll("[data-seed]")) b.addEventListener("click", () => {
		choose(Number(b.dataset.seed));
		playing = true;
	});
} catch (e) {
	state.status = "FAIL";
	state.error = String(e.stack ?? e);
	const p = document.createElement("p");
	p.textContent = state.error;
	document.body.append(p);
}
//#endregion
