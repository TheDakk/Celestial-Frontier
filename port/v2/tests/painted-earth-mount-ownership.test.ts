import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { transformSync } from 'rolldown/utils';
import { describe, expect, it, vi } from 'vitest';
import { retireEarthLayerResourcesV1 } from '../apps/game/src/earth-layered-resources.js';

// Execute actual application owners with controlled display/lease failures.
// This proves transactions, not a real Pixi renderer or native visibility.
const main = readFileSync(new URL('../apps/game/src/main.ts', import.meta.url), 'utf8');
function section(start: string, end: string): string {
  if (main.split(start).length !== 2 || main.split(end).length !== 2) throw new Error('Ambiguous main owner');
  const begin = main.indexOf(start), finish = main.indexOf(end, begin);
  if (finish <= begin) throw new Error('Reversed main owner');
  return main.slice(begin, finish);
}
const owners = [
  section('function retireSurfaceEarthLayers(', '\nfunction releaseSurfaceVistaOwner('),
  section('function releaseSurfaceVistaOwner(', '\nfunction releaseSurfaceVistaCache('),
  section('function syncSurfaceVistaPresentation(', '\nfunction mountSurfaceVistaCanvas('),
  section('function mountEarthLayeredCanvases(', '\nfunction requestSurfaceVista('),
].join('\n');
const PAIR = 'painted-earth-riverbank-v1', STILL = 'painted-earth-civet-landing-v1';
type Canvas = { width: number; height: number };
type Texture = { source?: Canvas };
type Lease = { texture: Texture; released: boolean; release(): boolean };
type Entry = { canvas: Canvas; lease: Lease | null; sprite: Display | null };
const EMPTY: Texture = {};
class Display {
  label = ''; eventMode = ''; visible = true; destroyed = false;
  parent: Stage | null = null;
  scale = { set: vi.fn() }; position = { set: vi.fn() }; anchor = { set: vi.fn() };
  y = 0;
  constructor(public texture: Texture | null = EMPTY) {}
  removeFromParent(): void {
    if (!this.parent) return;
    const index = this.parent.children.indexOf(this);
    if (index >= 0) this.parent.children.splice(index, 1);
    this.parent = null;
  }
  destroy(): void { this.removeFromParent(); this.destroyed = true; this.texture = null; }
}
class Stage {
  children: Display[] = []; adds = 0; failAt = 0;
  addChildAt(display: Display, index: number): void {
    if (++this.adds === this.failAt) throw new Error('injected stage insertion failure');
    display.removeFromParent(); this.children.splice(index, 0, display); display.parent = this;
  }
}
const canvas = (): Canvas => ({ width: 960, height: 430 });
function fixture(source = owners) {
  const stage = new Stage(), world = new Display(), globe = new Display();
  stage.children.push(world); world.parent = stage;
  const cloud = { visible: true, destroyed: false };
  const leases: Lease[] = [], faults: unknown[] = [];
  const blocked = new Set<number>();
  const state = {
    Sprite: Display, Texture: { EMPTY }, nav: { mode: 'surface' },
    app: { stage, screen: { height: 844 } }, world,
    EARTH_LAYERED_SCENE_ID: PAIR, PAINTED_EARTH_LANDING_ID: STILL,
    PAINTED_MARS_VISTA_ID: 'painted-mars-dunesea-v1',
    currentEarthLayeredLayout: () => ({ scale: .4, centerX: 195, centerY: 280 }),
    surfClouds: { a: { parent: cloud } },
    surfacePlanetSprite: globe as Display | null,
    surfaceVistaSprite: null as Display | null, surfaceEarthResidentSprite: null as Display | null,
    surfacePaintedGlobe: null as Display | null,
    surfaceEarthCloudDeck: null as { container: typeof cloud; visible: boolean } | null,
    surfaceVistaArtVariant: null as string | null,
    surfaceEarthLayeredResources: [] as Entry[],
    surfaceVistaGeneration: 2, surfaceVistaWorldKey: 'canonical', surfaceVistaEnvironmentFingerprint: 'canonical',
    surfaceEarthLayeredLoad: null, surfaceEarthLayeredLast: null,
    surfacePaintedVistaLoad: null, surfacePaintedVistaLast: null,
    surfaceVistaDeadline: null, surfaceVistaWorker: null,
    audiovisualPilotVistaReady: false,
    clearTimeout: vi.fn(), retireEarthLayerResourcesV1,
    noteSurfaceVistaFault: (error: unknown) => faults.push(error),
    sceneTextureLease: (backing: Canvas): Lease => {
      const id = leases.length;
      const lease: Lease = { texture: { source: backing }, released: false, release: vi.fn(() => {
        if (blocked.has(id)) throw new Error('injected release failure');
        lease.released = true; return true;
      }) };
      leases.push(lease); return lease;
    },
  };
  const compiled = transformSync('main-earth-owners.ts', source);
  if (compiled.errors.length) throw new Error(JSON.stringify(compiled.errors));
  const api = runInNewContext(compiled.code + '\n({mount:mountEarthLayeredCanvases,release:releaseSurfaceVistaOwner});', state) as {
    mount(background: Canvas, residents: Canvas | null, variant: string): boolean | 'retained-failure';
    release(): void;
  };
  return { state, stage, world, globe, cloud, leases, blocked, faults, api };
}
function assertRetired(f: ReturnType<typeof fixture>, canvases: Canvas[], displays: Display[]): void {
  if (f.state.surfaceEarthLayeredResources.length || f.state.surfaceVistaSprite || f.state.surfaceEarthResidentSprite
    || f.state.surfaceVistaArtVariant || f.state.surfacePaintedGlobe || f.state.surfaceEarthCloudDeck
    || f.leases.some(lease => !lease.released)
    || canvases.some(value => value.width !== 1 || value.height !== 1)
    || displays.some(value => !value.destroyed || value.parent !== null || value.texture !== null)) {
    throw new Error('Earth owner did not retire actual resources');
  }
}
function assertRetained(f: ReturnType<typeof fixture>, backing: Canvas): void {
  const entry = f.state.surfaceEarthLayeredResources[0];
  if (!entry || entry.canvas !== backing || entry.lease?.released !== false
    || backing.width !== 960 || backing.height !== 430) throw new Error('Live failed lease lost its backing canvas');
}

describe('actual main Earth mount and retirement transactions', () => {
  it.each([STILL, PAIR])('publishes and fully retires %s with the actual one/two canvas count', variant => {
    const f = fixture(), background = canvas(), resident = variant === PAIR ? canvas() : null;
    const canvases = resident ? [background, resident] : [background];
    expect(f.api.mount(background, resident, variant)).toBe(true);
    expect(f.leases).toHaveLength(canvases.length);
    expect(f.state.surfaceEarthLayeredResources.map(entry => entry.canvas)).toEqual(canvases);
    const displays = f.state.surfaceEarthLayeredResources.map(entry => entry.sprite!);
    expect(displays.map(value => value.label)).toEqual(resident
      ? ['earth-painted-background', 'earth-canonical-residents'] : ['earth-painted-landing-still']);
    expect(displays.every(value => value.parent === f.stage && value.eventMode === 'none')).toBe(true);
    expect(f.state.surfaceEarthResidentSprite).toBe(resident ? displays[1] : null);
    expect(f.globe.visible).toBe(false); expect(f.cloud.visible).toBe(false);
    f.api.release();
    expect(() => assertRetired(f, canvases, displays)).not.toThrow();
    expect(f.globe.visible).toBe(true); expect(f.cloud.visible).toBe(true);
    expect(f.stage.children).toEqual([f.world]);
    f.api.release();
    for (const lease of f.leases) expect(lease.release).toHaveBeenCalledOnce();
  });

  it('refuses a missing paired layer or an extra still layer before acquiring resources', () => {
    for (const [variant, resident] of [[PAIR, null], [STILL, canvas()]] as const) {
      const f = fixture();
      expect(f.api.mount(canvas(), resident, variant)).toBe(false);
      expect(f.leases).toHaveLength(0); expect(f.stage.children).toEqual([f.world]);
      expect(f.state.surfaceEarthLayeredResources).toHaveLength(0);
      expect(f.globe.visible).toBe(true); expect(f.cloud.visible).toBe(true);
    }
  });

  it.each([STILL, PAIR])('retains and retries the failed lease after %s insertion rolls back', variant => {
    const f = fixture(), background = canvas(), resident = variant === PAIR ? canvas() : null;
    f.stage.failAt = resident ? 2 : 1; f.blocked.add(0);
    expect(f.api.mount(background, resident, variant)).toBe('retained-failure');
    expect(() => assertRetained(f, background)).not.toThrow();
    expect(f.state.surfaceVistaSprite).toBeNull(); expect(f.state.surfaceEarthResidentSprite).toBeNull();
    expect(f.state.surfaceVistaArtVariant).toBeNull(); expect(f.faults.length).toBeGreaterThan(0);
    expect(f.globe.visible).toBe(true); expect(f.cloud.visible).toBe(true);
    if (resident) expect(resident).toEqual({ width: 1, height: 1 });
    const retiredDisplay = f.state.surfaceEarthLayeredResources[0]!.sprite!;
    f.blocked.clear(); f.api.release();
    expect(() => assertRetired(f, resident ? [background, resident] : [background], [retiredDisplay])).not.toThrow();
    expect(f.leases[0]!.release).toHaveBeenCalledTimes(2);
    expect(f.stage.children).toEqual([f.world]);
  });

  it('rejects early canvas shrinking and omitted retirement with the same ownership outcome rulers', () => {
    const seam = "    return retired.retained.length ? 'retained-failure' : false;";
    expect(owners.split(seam)).toHaveLength(2);
    const early = fixture(owners.replace(seam,
      '    for (const entry of owned) { entry.canvas.width = entry.canvas.height = 1; }\n' + seam));
    const backing = canvas(); early.stage.failAt = 1; early.blocked.add(0);
    expect(early.api.mount(backing, null, STILL)).toBe('retained-failure');
    expect(() => assertRetained(early, backing)).toThrow('Live failed lease lost');
    const retire = '  const retired = retireSurfaceEarthLayers(surfaceEarthLayeredResources);';
    expect(owners.split(retire)).toHaveLength(2);
    const omitted = fixture(owners.replace(retire, '  const retired = { retained: [], errors: [] };'));
    const other = canvas(); expect(omitted.api.mount(other, null, STILL)).toBe(true);
    const display = omitted.state.surfaceVistaSprite!; omitted.api.release();
    expect(() => assertRetired(omitted, [other], [display])).toThrow('Earth owner did not retire');
  });
});
