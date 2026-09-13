import { GlProgram, Mesh, MeshGeometry, Shader, UniformGroup, type Container, type Sprite, type Texture } from 'pixi.js';
import { EARTH_SURFACE_MATERIAL_GLSL_V1 } from './planet-surface-material.js';
import type { SceneTextureLease } from './scene-texture-owner.js';
import { surfaceTurnAngleV1, PLANET_SURFACE_TURN_DURATION_SECONDS } from './planet-surface-turn-math.js';
import { PLANET_TURN_ATLAS_WIDTH, PLANET_TURN_ATLAS_HEIGHT,
  PLANET_TURN_ATLAS_U_EXTENT } from './planet-surface-atlas.js';

const VERTEX = `
in vec2 aPosition;
in vec2 aUV;
uniform mat3 uProjectionMatrix;
uniform mat3 uWorldTransformMatrix;
uniform mat3 uTransformMatrix;
uniform vec4 uWorldColorAlpha;
uniform vec4 uColor;
out vec2 vUV;
out vec4 vColor;
void main() {
  vUV = aUV;
  vColor = uColor * uWorldColorAlpha;
  gl_Position = vec4((uProjectionMatrix * uWorldTransformMatrix * uTransformMatrix
    * vec3(aPosition, 1.0)).xy, 0.0, 1.0);
}`;
const FRAGMENT = `
precision highp float;
in vec2 vUV;
in vec4 vColor;
uniform sampler2D uAtlas;
uniform float uAngle;
uniform float uExtent;
uniform float uMaterial;
out vec4 finalColor;
${EARTH_SURFACE_MATERIAL_GLSL_V1}
void main() {
  vec2 p = vUV * 2.0 - 1.0;
  float rr = dot(p, p);
  if (rr > 1.0) discard;
  float z = sqrt(max(0.0, 1.0 - rr));
  float longitude = (atan(p.x, z) - uAngle) * 1.4;
  vec2 atlasUV = vec2(0.5 + longitude / (2.0 * uExtent), vUV.y);
  vec3 albedo = texture(uAtlas, atlasUV).rgb;
  // Lighting is in view space. Only the sampled surface turns.
  float light = 0.20 + 0.88 * max(-0.42*p.x - 0.30*p.y + 0.86*z, 0.0);
  float edge = 1.0 - smoothstep(0.992, 1.0, rr);
  vec3 surface = uMaterial > 0.5
    ? cfEarthSurfaceMaterialV1(albedo, longitude, p.y, vec3(p, z), light)
    : albedo * light;
  finalColor = vec4(surface * edge, edge) * vColor;
}`;

// Pixi's compiled program cache outlives scene shaders. Reuse one application-owned
// program AND uniform-group uid for the sole active Earth view, rather than adding
// native programs/uniform-dirty entries on each route. Per-view shaders do not own it.
function sharedTurnResources() {
  return appTurnResources ??= {
    program: new GlProgram({ vertex: VERTEX, fragment: FRAGMENT, name: 'cf-earth-surface-turn-v1' }),
    uniforms: new UniformGroup({ uAngle: { value: 0, type: 'f32' },
      uExtent: { value: PLANET_TURN_ATLAS_U_EXTENT, type: 'f32' },
      uMaterial: { value: 0, type: 'f32' } }),
  };
}
let appTurnResources: { program: GlProgram; uniforms: UniformGroup<{
  uAngle: { value: number; type: 'f32' }; uExtent: { value: number; type: 'f32' };
  uMaterial: { value: number; type: 'f32' };
}> } | null = null;

export interface SurfacePlanetTurnOptionsV1 {
  readonly parent: Container;
  readonly fallback: Sprite;
  readonly diameter: number;
  readonly material?: boolean;
  readonly planet: Record<string, unknown>;
  readonly facts: Record<string, unknown> | null;
  readonly isCurrent: () => boolean;
  readonly acquireLease: (canvas: HTMLCanvasElement) => SceneTextureLease<Texture>;
}

/** One opt-in surface view. Workers bake once; the shared app ticker moves a
 * single uniform. This prototype extends only a small canonical longitude arc. */
export const PLANET_SURFACE_TURN_DEADLINE_MS = 12_000;
export const PLANET_SURFACE_TURN_ERROR_SCHEMA = 'cf-earth-turn-error/v1' as const;
const PLANET_SURFACE_TURN_TIMEOUT = 'Earth surface atlas timed out';

export class SurfacePlanetTurnViewV1 {
  private status: 'pending' | 'ready' | 'failed' | 'disposed' = 'pending';
  private error: string | null = null;
  private worker: Worker | null = null;
  private deadline: ReturnType<typeof setTimeout> | null = null;
  private expiresAt: number | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private lease: SceneTextureLease<Texture> | null = null;
  private geometry: MeshGeometry | null = null;
  private shader: Shader | null = null;
  private uniforms: UniformGroup<{ uAngle: { value: number; type: 'f32' };
    uExtent: { value: number; type: 'f32' };
    uMaterial: { value: number; type: 'f32' } }> | null = null;
  private mesh: Mesh<MeshGeometry, Shader> | null = null;
  private elapsedSeconds = 0;
  private angle = 0;
  private shown = false;
  private starts = 0;

  constructor(private readonly options: SurfacePlanetTurnOptionsV1) {
    try {
      if (!options.isCurrent() || options.planet.seed !== 133 || options.planet.type !== 'terran') {
        throw new Error('Earth turn requires the current canonical Earth surface');
      }
      this.worker = new Worker(new URL('./planet-surface-turn.worker.ts', import.meta.url),
        { type: 'module', name: 'cf-earth-surface-turn' });
      this.starts++;
      this.expiresAt = performance.now() + PLANET_SURFACE_TURN_DEADLINE_MS;
      this.deadline = setTimeout(() => this.fail(PLANET_SURFACE_TURN_TIMEOUT), PLANET_SURFACE_TURN_DEADLINE_MS);
      this.worker.onerror = () => this.fail('Earth surface atlas worker failed');
      this.worker.onmessage = (event: MessageEvent<unknown>) => this.accept(event.data);
      this.worker.postMessage({ schema: 'cf-earth-turn-request/v1',
        planet: options.planet, facts: options.facts });
    } catch (error) { this.fail(error); }
  }

  private stopWorker(): void {
    if (this.deadline !== null) clearTimeout(this.deadline);
    this.deadline = null;
    const worker = this.worker;
    this.worker = null;
    if (worker) {
      worker.onmessage = null;
      worker.onerror = null;
      worker.terminate();
    }
  }

  private accept(value: unknown): void {
    if (this.status !== 'pending') return;
    if (!this.options.isCurrent()) { this.dispose(); return; }
    // K27: a result arriving at or after the monotonic boundary is late even
    // when a throttled timer has not fired yet; it is never mounted.
    if (this.expiresAt !== null && performance.now() >= this.expiresAt) {
      this.fail(PLANET_SURFACE_TURN_TIMEOUT); return;
    }
    try {
      this.stopWorker();
      const result = value as Record<string, unknown> | null;
      // K28: the worker reports its real reason; surface it instead of the
      // generic shape refusal.
      if (result && result.schema === PLANET_SURFACE_TURN_ERROR_SCHEMA) {
        const reason = typeof result.message === 'string' && result.message.length > 0
          ? result.message.slice(0, 256) : 'no reason given';
        throw new Error(`Earth surface atlas worker error: ${reason}`);
      }
      if (!result || result.schema !== 'cf-earth-turn-result/v1'
        || result.sourceSeed !== 133 || result.width !== PLANET_TURN_ATLAS_WIDTH
        || result.height !== PLANET_TURN_ATLAS_HEIGHT || result.uExtent !== PLANET_TURN_ATLAS_U_EXTENT
        || !(result.pixels instanceof Uint8ClampedArray)
        || result.pixels.length !== PLANET_TURN_ATLAS_WIDTH * PLANET_TURN_ATLAS_HEIGHT * 4) {
        throw new Error('invalid Earth surface atlas response');
      }
      const canvas = document.createElement('canvas');
      this.canvas = canvas;
      canvas.width = PLANET_TURN_ATLAS_WIDTH;
      canvas.height = PLANET_TURN_ATLAS_HEIGHT;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Earth surface canvas unavailable');
      const data = context.createImageData(canvas.width, canvas.height);
      data.data.set(result.pixels);
      context.putImageData(data, 0, 0);
      this.lease = this.options.acquireLease(canvas);
      const half = this.options.diameter / 2;
      this.geometry = new MeshGeometry({
        positions: new Float32Array([-half, -half, half, -half, half, half, -half, half]),
        uvs: new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]),
        indices: new Uint32Array([0, 1, 2, 0, 2, 3]),
      });
      const shared = sharedTurnResources();
      this.uniforms = shared.uniforms;
      this.uniforms.uniforms.uAngle = 0;
      this.uniforms.uniforms.uMaterial = this.options.material === true ? 1 : 0;
      this.shader = new Shader({ glProgram: shared.program,
        resources: { uAtlas: this.lease.texture.source, turnUniforms: this.uniforms } });
      this.mesh = new Mesh({ geometry: this.geometry, shader: this.shader,
        texture: this.lease.texture });
      this.mesh.eventMode = 'none';
      this.mesh.visible = false;
      const index = this.options.parent.getChildIndex(this.options.fallback);
      this.options.parent.addChildAt(this.mesh, index + 1);
      this.status = 'ready';
    } catch (error) { this.fail(error); }
  }

  tick(deltaMS: number, visible: boolean, motion: boolean, effects: boolean): void {
    if (this.status === 'disposed' || this.status === 'failed') return;
    if (!this.options.isCurrent()) { this.dispose(); return; }
    if (this.status !== 'ready' || !this.mesh || !this.uniforms) return;
    this.shown = visible && motion && effects;
    this.mesh.visible = this.shown;
    this.options.fallback.visible = !this.shown;
    if (!motion || !effects) {
      this.elapsedSeconds = 0;
      this.angle = 0;
      this.uniforms.uniforms.uAngle = 0;
      return;
    }
    if (!this.shown) return;
    if (Number.isFinite(deltaMS) && deltaMS > 0) {
      this.elapsedSeconds = Math.min(PLANET_SURFACE_TURN_DURATION_SECONDS,
        this.elapsedSeconds + Math.min(deltaMS, 100) / 1000);
    }
    this.angle = surfaceTurnAngleV1(this.elapsedSeconds);
    this.uniforms.uniforms.uAngle = this.angle;
  }

  snapshot() {
    return Object.freeze({ status: this.status, error: this.error, shown: this.shown,
      materialEnabled: this.options.material === true,
      appProgramKey: appTurnResources?.program._key ?? null,
      appUniformUid: appTurnResources?.uniforms.uid ?? null,
      workerActive: this.worker !== null, workerStarts: this.starts,
      elapsedSeconds: this.elapsedSeconds, angle: this.angle,
      meshLive: this.mesh !== null && !this.mesh.destroyed,
      textureLive: this.lease !== null && !this.lease.released,
      canvasPixels: (this.canvas?.width ?? 0) * (this.canvas?.height ?? 0),
      canonicalVisible: this.options.fallback.visible });
  }

  private release(): void {
    const failures: string[] = [];
    const attempt = (release: () => void): void => {
      try { release(); } catch (error) { failures.push(String(error).slice(0, 128)); }
    };
    attempt(() => this.stopWorker());
    const mesh = this.mesh, shader = this.shader, geometry = this.geometry;
    const lease = this.lease, canvas = this.canvas;
    this.mesh = null; this.shader = null; this.geometry = null;
    this.uniforms = null; this.lease = null; this.canvas = null;
    if (mesh) { attempt(() => { mesh.removeFromParent(); }); attempt(() => { mesh.destroy(); }); }
    if (shader) attempt(() => { shader.destroy(false); });
    if (geometry) attempt(() => { geometry.destroy(true); });
    if (lease) attempt(() => { lease.release(); });
    if (canvas) attempt(() => { canvas.width = 1; canvas.height = 1; });
    this.shown = false;
    if (!this.options.fallback.destroyed) this.options.fallback.visible = true;
    if (failures.length) this.error = [this.error, ...failures].filter(Boolean).join('; ').slice(0, 512);
  }

  private fail(error: unknown): void {
    if (this.status === 'disposed') return;
    this.error = (error instanceof Error ? error.message : String(error)).slice(0, 256);
    this.status = 'failed';
    this.release();
  }

  dispose(): void {
    if (this.status === 'disposed') return;
    this.status = 'disposed';
    this.release();
  }
}
