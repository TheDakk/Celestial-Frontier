/* Local authoring compositor, not imported by the game. Borrowed textures and
 * actor transforms remain unchanged. No reflection, vegetation, rock or depth
 * occluder is invented from a flat landscape. One-shot measured contacts and
 * resident-only lighting follow ART_DIRECTION §7's Earth-like tint boundary. */
import { ColorMatrixFilter, Container, Graphics, MeshSimple, Sprite,
  type ColorMatrix, type Filter, type Texture } from 'pixi.js';
import { EARTH_RESIDENT_LAYER_PLAN_JSON_V1, snapshotEarthLayerDataV1,
  type EarthResidentLayerPlanV1 } from '../../port/v2/packages/art/src/earth-resident-plan.js';

export interface CohesionCivetAsset {
  readonly width: number;
  readonly height: number;
  readonly alphaBounds: Readonly<{ x0: number; y0: number; x1: number; y1: number }>;
  readonly contactY: number;
  /** Caller verified encoded bytes before creating this borrowed texture. */
  readonly sha256: string;
}
export interface CohesionPawRegion {
  readonly x0: number; readonly y0: number; readonly x1: number; readonly y1: number;
}
export interface EarthSceneCohesionRecipe {
  readonly schema: 'cf-earth-scene-cohesion/v1';
  readonly worldKey: string;
  readonly plan: EarthResidentLayerPlanV1;
  readonly civetAsset: CohesionCivetAsset;
  /** Four ordered, nonoverlapping normalized source rectangles. The caller
   * remeasures/seals these against the selected master, never assumes v1 RGB. */
  readonly civetPaws: readonly CohesionPawRegion[];
}
export type CohesionTestMode = 'none' | 'missingCivetContact' | 'shiftContacts' | 'noShadows' | 'strongLight';
export interface EarthSceneCohesionInput {
  readonly earth: Container;
  readonly background: Sprite;
  readonly residents: Sprite;
  readonly civetActor: Container;
  readonly recipe: EarthSceneCohesionRecipe;
  readonly enabled?: boolean;
  readonly allowTestControls?: boolean;
}
export interface CohesionShadow {
  readonly id: string;
  readonly resident: string;
  readonly role: 'contact' | 'body';
  readonly x: number; readonly y: number;
  readonly radiusX: number; readonly radiusY: number;
  readonly alpha: number;
  readonly color: number;
  readonly rings: 6;
  readonly solidPixels: number;
  readonly observedSourceBounds: Readonly<{ x0: number; y0: number; x1: number; y1: number }> | null;
}

const requireFact = (value: unknown, message: string): void => { if (!value) throw new TypeError(message); };
const equalFilters = (actual: readonly Filter[] | null | undefined, expected: readonly Filter[] | null | undefined): boolean => {
  if (actual === null || actual === undefined || expected === null || expected === undefined) return actual === expected;
  return actual.length === expected.length && actual.every((filter, index) => filter === expected[index]);
};
const freeze = <T>(value: T): T => {
  if (value && typeof value === 'object') { for (const child of Object.values(value)) freeze(child); Object.freeze(value); }
  return value;
};
function keys(value: object, expected: readonly string[]) {
  const actual = Object.keys(value).sort();
  requireFact(actual.length === expected.length && actual.every((key, index) => key === [...expected].sort()[index]), 'Cohesion recipe fields changed');
}
function admitRecipe(input: EarthSceneCohesionRecipe): EarthSceneCohesionRecipe {
  // Descriptor-aware full graph snapshot rejects accessors, hooks, cycles and
  // omitted/reordered canonical genome/roster/anchor data before any allocation.
  const recipe = JSON.parse(JSON.stringify(snapshotEarthLayerDataV1(input))) as EarthSceneCohesionRecipe;
  keys(recipe, ['schema', 'worldKey', 'plan', 'civetAsset', 'civetPaws']);
  requireFact(recipe.schema === 'cf-earth-scene-cohesion/v1', 'Unknown cohesion schema');
  requireFact(JSON.stringify(recipe.plan) === EARTH_RESIDENT_LAYER_PLAN_JSON_V1, 'Complete canonical Earth plan mismatch');
  requireFact(recipe.worldKey === recipe.plan.worldKey, 'Cohesion world does not match exact Earth plan');
  const asset = recipe.civetAsset;
  keys(asset, ['width', 'height', 'alphaBounds', 'contactY', 'sha256']);
  keys(asset.alphaBounds, ['x0', 'y0', 'x1', 'y1']);
  requireFact(Number.isInteger(asset.width) && Number.isInteger(asset.height)
    && asset.width > 0 && asset.height > 0 && asset.width * asset.height <= 2_000_000, 'Civet source dimensions outside bounded study');
  const b = asset.alphaBounds;
  requireFact([b.x0, b.y0, b.x1, b.y1, asset.contactY].every(Number.isInteger)
    && b.x0 > 0 && b.y0 > 0 && b.x1 < asset.width - 1 && b.y1 < asset.height - 1
    && b.x1 > b.x0 && b.y1 > b.y0 && asset.contactY >= b.y0 && asset.contactY <= b.y1, 'Invalid Civet alpha/contact bounds');
  requireFact(/^[a-f0-9]{64}$/.test(asset.sha256), 'Civet encoded identity is absent');
  requireFact(Array.isArray(recipe.civetPaws) && recipe.civetPaws.length === 4, 'Four measured Civet paw regions required');
  recipe.civetPaws.forEach((paw, index) => {
    keys(paw, ['x0', 'y0', 'x1', 'y1']);
    requireFact([paw.x0, paw.y0, paw.x1, paw.y1].every(Number.isFinite)
      && paw.x0 >= 0 && paw.y0 >= 0 && paw.x1 <= 1 && paw.y1 <= 1 && paw.x1 > paw.x0 && paw.y1 > paw.y0,
    'Invalid normalized paw region');
    if (index) requireFact(recipe.civetPaws[index - 1]!.x1 <= paw.x0, 'Paw regions must be ordered and nonoverlapping');
  });
  return freeze(recipe);
}
function readBorrowedPixels(texture: Texture, width: number, height: number) {
  requireFact(!texture.destroyed && !texture.source.destroyed && texture.width === width && texture.height === height
    && texture.frame.x === 0 && texture.frame.y === 0 && texture.frame.width === width && texture.frame.height === height
    && !texture.trim && texture.rotate === 0, 'Borrowed contact texture is not the exact full image');
  const resource: unknown = texture.source.resource;
  requireFact(resource instanceof ImageBitmap && resource.width === width && resource.height === height,
    'Contact owner requires the already decoded immutable ImageBitmap');
  const scratch = new OffscreenCanvas(width, height);
  try {
    const context = scratch.getContext('2d'); requireFact(context, 'Contact readback context unavailable');
    context!.drawImage(resource as ImageBitmap, 0, 0);
    return context!.getImageData(0, 0, width, height).data;
  } finally { scratch.width = scratch.height = 1; }
}
function solidBounds(rgba: Uint8ClampedArray, width: number, height: number, rect: CohesionPawRegion) {
  let x0 = width, y0 = height, x1 = -1, y1 = -1, solid = 0;
  for (let y = Math.max(0, Math.floor(rect.y0)); y < Math.min(height, Math.ceil(rect.y1)); y++) {
    for (let x = Math.max(0, Math.floor(rect.x0)); x < Math.min(width, Math.ceil(rect.x1)); x++) {
      if (rgba[(y * width + x) * 4 + 3]! < 230) continue;
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); solid++;
    }
  }
  requireFact(solid > 0, 'A declared contact region contains no solid native ink');
  return { x0, y0, x1, y1, solid };
}
function measuredShadows(recipe: EarthSceneCohesionRecipe, residents: Sprite, civet: MeshSimple): readonly CohesionShadow[] {
  const shadows: CohesionShadow[] = [], asset = recipe.civetAsset;
  const civetPixels = readBorrowedPixels(civet.texture, asset.width, asset.height);
  const civetPlan = recipe.plan.residents.find(row => row.name === 'Civet')!;
  const visibleWidth = asset.alphaBounds.x1 - asset.alphaBounds.x0 + 1;
  const scale = civetPlan.width * 960 / visibleWidth;
  const originX = civetPlan.x * 960 - (asset.alphaBounds.x0 + visibleWidth / 2) * scale;
  const originY = civetPlan.groundY * 430 - (asset.contactY + 1) * scale;
  requireFact(Math.abs(civet.x - originX) < .000001 && Math.abs(civet.y - originY) < .000001
    && Math.abs(civet.scale.x - asset.width * scale) < .000001
    && Math.abs(civet.scale.y - asset.height * scale) < .000001, 'Civet mesh no longer uses the accepted alpha/contact placement');
  recipe.civetPaws.forEach((paw, index) => {
    const b = solidBounds(civetPixels, asset.width, asset.height,
      { x0: paw.x0 * asset.width, x1: paw.x1 * asset.width, y0: paw.y0 * asset.height, y1: paw.y1 * asset.height });
    shadows.push({ id: 'Civet:paw:' + index, resident: 'Civet', role: 'contact',
      x: originX + (b.x0 + b.x1 + 1) * .5 * scale, y: originY + (b.y1 + 1) * scale + .25,
      radiusX: Math.max(2.2, Math.min(7, (b.x1 - b.x0 + 1) * scale * .48)), radiusY: 1.3,
      alpha: .22, color: 0x192827, rings: 6, solidPixels: b.solid, observedSourceBounds: b });
  });
  const paws = shadows.slice();
  shadows.push({ id: 'Civet:ambient-body', resident: 'Civet', role: 'body',
    x: (paws[0]!.x + paws[3]!.x) * .5, y: civetPlan.groundY * 430 - 2,
    radiusX: 36, radiusY: 3.3, alpha: .045, color: 0x23302f, rings: 6, solidPixels: 0, observedSourceBounds: null });
  // The five-resident bitmap is already decoded and keeps its original ink.
  // Measure low solid support pixels near each unchanged canonical anchor.
  // Narrow Platypus x bounds avoid the adjacent Cranberry canopy.
  const rgba = readBorrowedPixels(residents.texture, 960, 430);
  const halfWidths: Readonly<Record<string, number>> = { Persimmon: .22, Platypus: .20, Frog: .46, "Devil's Club": .40, Cranberry: .49 };
  for (const resident of recipe.plan.residents) {
    if (resident.name === 'Civet') continue;
    const fraction = halfWidths[resident.name]; requireFact(fraction !== undefined, 'Unknown canonical support owner');
    const x = resident.x * 960, ground = resident.groundY * 430, half = resident.width * 960 * fraction!;
    const columns: Array<{ x: number; lowest: number; solid: number }> = [];
    for (let sx = Math.max(0, Math.floor(x - half)); sx <= Math.min(959, Math.ceil(x + half)); sx++) {
      let lowest = -1, solid = 0;
      for (let sy = Math.max(0, Math.floor(ground - 8)); sy <= Math.min(429, Math.ceil(ground + 1)); sy++) {
        if (rgba[(sy * 960 + sx) * 4 + 3]! >= 230) { lowest = sy; solid++; }
      }
      if (solid) columns.push({ x: sx, lowest, solid });
    }
    requireFact(columns.length > 0, 'No actual support ink for ' + resident.name);
    const clusters: Array<{ x0: number; x1: number; y: number; solid: number }> = [];
    for (const column of columns) {
      const previous = clusters[clusters.length - 1];
      if (previous && column.x <= previous.x1 + 3) { previous.x1 = column.x; previous.y = Math.max(previous.y, column.lowest); previous.solid += column.solid; }
      else clusters.push({ x0: column.x, x1: column.x, y: column.lowest, solid: column.solid });
    }
    requireFact(clusters.length <= 16, 'Unbounded fragmented support clusters for ' + resident.name);
    clusters.forEach((cluster, index) => shadows.push({ id: resident.name + ':support:' + index, resident: resident.name, role: 'contact',
      x: (cluster.x0 + cluster.x1 + 1) * .5, y: cluster.y + 1.2,
      radiusX: Math.max(2, Math.min(18, (cluster.x1 - cluster.x0 + 1) * .52)),
      radiusY: resident.family === 'tree' ? 2.1 : 1.5, alpha: .16, color: 0x192827, rings: 6,
      solidPixels: cluster.solid, observedSourceBounds: { x0: cluster.x0, y0: Math.floor(ground - 8), x1: cluster.x1, y1: cluster.y } }));
  }
  return freeze(shadows);
}
function lightingMatrix(strong: boolean): ColorMatrix {
  const saturation = .90, brightness = strong ? 1.65 : .90;
  const weights = [.2126, .7152, .0722], gains = strong ? [1.1, 1, .85] : [.985, 1, 1.015];
  const matrix: number[] = [];
  for (let channel = 0; channel < 3; channel++) {
    for (let input = 0; input < 3; input++) matrix.push((weights[input]! * (1 - saturation) + (input === channel ? saturation : 0)) * brightness * gains[channel]!);
    matrix.push(0, strong ? .05 : [.002, .003, .004][channel]!);
  }
  // RGB changes only: alpha is exactly the original source alpha.
  matrix.push(0, 0, 0, 1, 0); return matrix as ColorMatrix;
}

export function attachEarthSceneCohesion(input: EarthSceneCohesionInput) {
  const recipe = admitRecipe(input.recipe), recipeJSON = JSON.stringify(recipe);
  requireFact(input.enabled === undefined || typeof input.enabled === 'boolean', 'enabled must be boolean');
  requireFact(input.allowTestControls === undefined || typeof input.allowTestControls === 'boolean', 'test-controls flag must be boolean');
  const { earth, background, residents, civetActor } = input;
  requireFact(!earth.destroyed && background instanceof Sprite && residents instanceof Sprite
    && !background.destroyed && !residents.destroyed && !civetActor.destroyed, 'Borrowed scene is not live');
  requireFact(background.parent === earth && residents.parent === earth && civetActor.parent === earth,
    'Borrowed Earth layers must already share their canonical direct parent');
  requireFact(earth.getChildIndex(background) < earth.getChildIndex(residents)
    && earth.getChildIndex(residents) < earth.getChildIndex(civetActor), 'Existing Earth paint order changed');
  for (const node of [background, residents, civetActor]) requireFact(node.x === 0 && node.y === 0 && node.scale.x === 1 && node.scale.y === 1
    && node.rotation === 0 && node.pivot.x === 0 && node.pivot.y === 0 && node.skew.x === 0 && node.skew.y === 0, 'Borrowed layer transform changed');
  requireFact(background.anchor.x === 0 && background.anchor.y === 0 && residents.anchor.x === 0 && residents.anchor.y === 0, 'Borrowed sprite anchor changed');
  requireFact(civetActor.children.length === 1 && civetActor.children[0] instanceof MeshSimple, 'Civet actor must own exactly its existing mesh');
  const civet = civetActor.children[0] as MeshSimple;
  requireFact(civet.rotation === 0 && civet.pivot.x === 0 && civet.pivot.y === 0 && civet.skew.x === 0 && civet.skew.y === 0, 'Borrowed Civet orientation changed');
  const declaredShadows = measuredShadows(recipe, residents, civet);
  const borrowed = [background, residents, civetActor].map(node => ({ node, parent: node.parent!, index: earth.getChildIndex(node), filters: node.filters as readonly Filter[] | null | undefined }));
  const textures = [background.texture, residents.texture, civet.texture].map(texture => ({ texture, source: texture.source, resource: texture.source.resource }));
  const shadowRoot = new Container(); shadowRoot.label = 'earth-scene-cohesion-contacts'; shadowRoot.eventMode = 'none';
  let filter: ColorMatrixFilter;
  try { filter = new ColorMatrixFilter(); } catch (error) { shadowRoot.destroy({ children: false }); throw error; }
  const painted = [residents, civetActor];
  const graphics: Array<{ graphic: Graphics; context: Graphics['context']; shadow: CohesionShadow }> = [];
  let enabled = input.enabled ?? true, testMode: CohesionTestMode = 'none', disposed = false;
  const failures: string[] = [];
  function apply() {
    requireFact(!disposed, 'Cohesion owner is disposed');
    for (const node of painted) {
      requireFact(!node.destroyed && node.parent === earth, 'Borrowed resident owner changed');
      const original = borrowed.find(row => row.node === node)!.filters;
      node.filters = enabled ? [...(original ?? []), filter] : original ? [...original] : original;
    }
    shadowRoot.visible = enabled && testMode !== 'noShadows';
    shadowRoot.position.set(testMode === 'shiftContacts' ? 22 : 0, testMode === 'shiftContacts' ? 9 : 0);
    for (const row of graphics) row.graphic.visible = !(testMode === 'missingCivetContact' && row.shadow.resident === 'Civet' && row.shadow.role === 'contact');
    filter.matrix = lightingMatrix(testMode === 'strongLight');
  }
  function snapshot() {
    const matrix = disposed ? null : Array.from(filter.matrix);
    return { schema: 'cf-earth-scene-cohesion-owner/v1', enabled, testMode, disposed, recipeJSON,
      declaredShadows, lightingMatrix: matrix, alphaRow: matrix?.slice(15) ?? null,
      shadowContainerDestroyed: shadowRoot.destroyed, filterDestroyed: filter._destroyed,
      shadowContainerParentIsEarth: !shadowRoot.destroyed && shadowRoot.parent === earth,
      shadowContainerPosition: shadowRoot.destroyed ? null : { x: shadowRoot.x, y: shadowRoot.y },
      shadowContainerVisible: !shadowRoot.destroyed && shadowRoot.visible,
      graphics: graphics.map(row => ({ id: row.shadow.id, destroyed: row.graphic.destroyed, contextDestroyed: row.context.destroyed,
        visible: !row.graphic.destroyed && row.graphic.visible })),
      borrowed: borrowed.map(row => ({ label: row.node.label, alive: !row.node.destroyed,
        parentIntact: !row.node.destroyed && row.node.parent === row.parent,
        indexRestored: !row.node.destroyed && row.node.parent === row.parent && row.parent.getChildIndex(row.node) === row.index,
        filtersRestored: !row.node.destroyed && equalFilters(row.node.filters, row.filters),
        usesOwnedLighting: !row.node.destroyed && (row.node.filters ?? []).includes(filter) })),
      borrowedSourcesIntact: textures.every(row => !row.texture.destroyed && !row.source.destroyed
        && row.texture.source === row.source && row.source.resource === row.resource),
      noBorrowedReparenting: true, noOwnedTextures: true, noAnimationLoop: true, failures: [...failures] };
  }
  function dispose() {
    if (disposed) return snapshot();
    disposed = true; enabled = false;
    for (const row of borrowed) {
      if (row.node === background) continue;
      try { if (!row.node.destroyed) row.node.filters = row.filters ? [...row.filters] : row.filters; else failures.push('Borrowed resident was destroyed before restoration'); }
      catch (error) { failures.push(String(error)); }
    }
    for (const row of graphics) try { row.graphic.destroy({ context: true }); } catch (error) { failures.push(String(error)); }
    try { shadowRoot.destroy({ children: false }); } catch (error) { failures.push(String(error)); }
    try { filter.destroy(); } catch (error) { failures.push(String(error)); }
    return snapshot();
  }
  try {
    for (const shadow of declaredShadows) {
      const graphic = new Graphics(); graphics.push({ graphic, context: graphic.context, shadow });
      graphic.label = shadow.id; graphic.eventMode = 'none'; shadowRoot.addChild(graphic);
      for (let ring = 0; ring < shadow.rings; ring++) {
        const scale = 1 - ring * .12;
        graphic.ellipse(shadow.x, shadow.y, shadow.radiusX * scale, shadow.radiusY * scale).fill({ color: shadow.color, alpha: shadow.alpha / shadow.rings });
      }
    }
    earth.addChildAt(shadowRoot, earth.getChildIndex(background) + 1); apply();
  }
  catch (error) { dispose(); throw error; }
  return Object.freeze({
    setEnabled(value: boolean) { requireFact(!disposed, 'Cohesion owner is disposed'); requireFact(typeof value === 'boolean', 'enabled must be boolean'); enabled = value; apply(); return snapshot(); },
    setTestMode(value: CohesionTestMode) {
      requireFact(!disposed, 'Cohesion owner is disposed');
      requireFact(input.allowTestControls === true, 'Diagnostic controls were not enabled for this local bench');
      requireFact(['none', 'missingCivetContact', 'shiftContacts', 'noShadows', 'strongLight'].includes(value), 'Unknown cohesion diagnostic');
      testMode = value; apply(); return snapshot();
    },
    snapshot, dispose,
  });
}
