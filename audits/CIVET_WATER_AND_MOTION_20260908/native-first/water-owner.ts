/* Local study only. Nick identified shallow water at these four unchanged Civet
 * paw anchors. Narrow waterline occlusion copies the existing background texels;
 * it does not repaint anatomy, introduce a pool, or change generated ecology.
 * No animation owner, texture/source creation, borrowed reparenting or asset load. */
import { ColorMatrixFilter, Container, Graphics, MeshSimple, Sprite,
  type ColorMatrix, type Filter, type Texture } from 'pixi.js';
import { EARTH_RESIDENT_LAYER_PLAN_JSON_V1, snapshotEarthLayerDataV1,
  type EarthResidentLayerPlanV1 } from '../../port/v2/packages/art/src/earth-resident-plan.js';

export interface WaterCivetAsset {
  readonly width: number; readonly height: number;
  readonly alphaBounds: Readonly<{ x0: number; y0: number; x1: number; y1: number }>;
  readonly contactY: number;
  /** Encoded bytes must already have been hash-verified by the texture owner. */
  readonly sha256: string;
}
export interface WaterPawRegion {
  readonly x0: number; readonly y0: number; readonly x1: number; readonly y1: number;
}
export interface CivetWaterRecipe {
  readonly schema: 'cf-civet-water-scene/v1';
  readonly worldKey: string;
  readonly plan: EarthResidentLayerPlanV1;
  readonly civetAsset: WaterCivetAsset;
  readonly civetPaws: readonly WaterPawRegion[];
}
export type WaterTestMode = 'none' | 'noWater' | 'noShadows' | 'shiftWater' | 'noLight'
  | 'noOcclusion' | 'noRipples' | 'missingPaw' | 'strongLight';
export interface CivetWaterInput {
  readonly earth: Container;
  readonly background: Sprite;
  readonly civetActor: Container;
  readonly recipe: CivetWaterRecipe;
  readonly enabled?: boolean;
  readonly allowTestControls?: boolean;
}
export interface WaterContact {
  readonly id: string;
  readonly paw: number;
  readonly x: number; readonly y: number; readonly radiusX: number;
  readonly solidPixels: number;
  readonly observedSourceBounds: Readonly<{ x0: number; y0: number; x1: number; y1: number }>;
}
export type WaterGeometry = Readonly<{ kind: 'ellipse-rings'; x: number; y: number;
  radiusX: number; radiusY: number; rings: 6; alpha: number }>
  | Readonly<{ kind: 'polygon'; points: readonly number[]; alpha: number }>
  | Readonly<{ kind: 'quadratic-arcs'; curves: readonly Readonly<{
    start: readonly [number, number]; control: readonly [number, number]; end: readonly [number, number];
    width: number; alpha: number; color: number;
  }>[] }>;
export interface WaterDeclaredRegion {
  readonly id: string; readonly paw: number;
  readonly role: 'submerged-shadow' | 'waterline' | 'broken-ripple';
  readonly geometry: WaterGeometry;
  /** Includes one scene pixel of antialias clearance; unchanged in fault modes. */
  readonly bounds: Readonly<{ x0: number; y0: number; x1: number; y1: number }>;
}

const requireFact: (value: unknown, message: string) => asserts value = (value, message) => {
  if (!value) throw new TypeError(message);
};
const freeze = <T>(value: T): T => {
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
};
function fields(value: object, names: readonly string[]): void {
  const actual = Object.keys(value).sort(), expected = [...names].sort();
  requireFact(actual.length === expected.length && actual.every((name, i) => name === expected[i]), 'Water recipe fields changed');
}
function admitRecipe(input: CivetWaterRecipe): CivetWaterRecipe {
  // Accessors, hooks, sparse arrays, cycles and unsupported prototypes are
  // rejected without property reads, before any Pixi or readback allocation.
  const recipe = JSON.parse(JSON.stringify(snapshotEarthLayerDataV1(input))) as CivetWaterRecipe;
  fields(recipe, ['schema', 'worldKey', 'plan', 'civetAsset', 'civetPaws']);
  requireFact(recipe.schema === 'cf-civet-water-scene/v1', 'Unknown Civet water schema');
  requireFact(JSON.stringify(recipe.plan) === EARTH_RESIDENT_LAYER_PLAN_JSON_V1, 'Complete canonical Earth plan mismatch');
  requireFact(recipe.worldKey === recipe.plan.worldKey, 'Civet water world mismatch');
  const asset = recipe.civetAsset, b = asset.alphaBounds;
  fields(asset, ['width', 'height', 'alphaBounds', 'contactY', 'sha256']);
  fields(b, ['x0', 'y0', 'x1', 'y1']);
  requireFact(Number.isInteger(asset.width) && Number.isInteger(asset.height)
    && asset.width > 0 && asset.height > 0 && asset.width * asset.height <= 2_000_000, 'Unbounded Civet source');
  requireFact([b.x0, b.y0, b.x1, b.y1, asset.contactY].every(Number.isInteger)
    && b.x0 > 0 && b.y0 > 0 && b.x1 < asset.width - 1 && b.y1 < asset.height - 1
    && b.x1 > b.x0 && b.y1 > b.y0 && asset.contactY >= b.y0 && asset.contactY <= b.y1,
  'Invalid Civet source alpha/contact bounds');
  requireFact(/^[a-f0-9]{64}$/.test(asset.sha256), 'Civet encoded hash absent');
  requireFact(Array.isArray(recipe.civetPaws) && recipe.civetPaws.length === 4, 'Four measured Civet paw regions required');
  recipe.civetPaws.forEach((paw, i) => {
    fields(paw, ['x0', 'y0', 'x1', 'y1']);
    requireFact([paw.x0, paw.y0, paw.x1, paw.y1].every(Number.isFinite)
      && paw.x0 >= 0 && paw.x1 <= 1 && paw.x1 > paw.x0 && paw.y0 >= 0 && paw.y1 <= 1 && paw.y1 > paw.y0
      && paw.y0 * asset.height >= asset.contactY - 32 && paw.y0 * asset.height <= asset.contactY,
    'Invalid normalized lower-paw region');
    if (i) requireFact(recipe.civetPaws[i - 1]!.x1 <= paw.x0, 'Paw regions overlap or changed order');
  });
  return freeze(recipe);
}
function checkTexture(texture: Texture, width: number, height: number): void {
  requireFact(!texture.destroyed && !texture.source.destroyed && texture.width === width && texture.height === height
    && texture.frame.x === 0 && texture.frame.y === 0 && texture.frame.width === width && texture.frame.height === height
    && !texture.trim && texture.rotate === 0, 'Water owner requires the borrowed full-image texture');
}
function measureContacts(recipe: CivetWaterRecipe, civet: MeshSimple): readonly WaterContact[] {
  const asset = recipe.civetAsset;
  checkTexture(civet.texture, asset.width, asset.height);
  const bitmap: unknown = civet.texture.source.resource;
  requireFact(bitmap instanceof ImageBitmap && bitmap.width === asset.width && bitmap.height === asset.height,
    'Water contact measurement requires the already decoded Civet bitmap');
  const resident = recipe.plan.residents.find(row => row.name === 'Civet')!;
  const width = asset.alphaBounds.x1 - asset.alphaBounds.x0 + 1;
  const scale = resident.width * 960 / width;
  const originX = resident.x * 960 - (asset.alphaBounds.x0 + width / 2) * scale;
  const originY = resident.groundY * 430 - (asset.contactY + 1) * scale;
  requireFact(Math.abs(civet.x - originX) < 1e-6 && Math.abs(civet.y - originY) < 1e-6
    && Math.abs(civet.scale.x - asset.width * scale) < 1e-6
    && Math.abs(civet.scale.y - asset.height * scale) < 1e-6, 'Civet alpha/contact placement changed');
  // One bounded temporary canvas; no ImageBitmap, Texture or TextureSource is
  // created here. Readback bytes leave scope after the four contact receipts.
  const scratch = new OffscreenCanvas(asset.width, asset.height);
  try {
    const context = scratch.getContext('2d'); requireFact(context, 'Paw readback unavailable');
    context.drawImage(bitmap, 0, 0);
    const rgba = context.getImageData(0, 0, asset.width, asset.height).data;
    let x0 = asset.width, y0 = asset.height, x1 = -1, y1 = -1, contactY = -1;
    for (let y = 0; y < asset.height; y++) for (let x = 0; x < asset.width; x++) {
      const alpha = rgba[(y * asset.width + x) * 4 + 3]!;
      if (alpha > 12) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
      if (alpha >= 230) contactY = y;
    }
    requireFact(JSON.stringify({ x0, y0, x1, y1 }) === JSON.stringify(asset.alphaBounds)
      && contactY === asset.contactY, 'Actual Civet alpha/contact differs from sealed recipe');
    return freeze(recipe.civetPaws.map((paw, index) => {
      let left = asset.width, top = asset.height, right = -1, bottom = -1, solid = 0;
      for (let y = Math.floor(paw.y0 * asset.height); y < Math.min(asset.height, Math.ceil(paw.y1 * asset.height)); y++) {
        for (let x = Math.floor(paw.x0 * asset.width); x < Math.min(asset.width, Math.ceil(paw.x1 * asset.width)); x++) {
          if (rgba[(y * asset.width + x) * 4 + 3]! < 230) continue;
          left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y); solid++;
        }
      }
      requireFact(solid > 0 && bottom >= asset.contactY - 6, 'Declared paw lacks actual solid contact ink');
      return { id: `Civet:paw:${index}`, paw: index,
        x: originX + (left + right + 1) * .5 * scale, y: originY + (bottom + 1) * scale,
        radiusX: Math.max(2.2, Math.min(7, (right - left + 1) * scale * .48)), solidPixels: solid,
        observedSourceBounds: { x0: left, y0: top, x1: right, y1: bottom } };
    }));
  } finally { scratch.width = scratch.height = 1; }
}
function lightMatrix(strong: boolean): ColorMatrix {
  const saturation = .90, brightness = strong ? 1.7 : .90;
  const weights = [.2126, .7152, .0722], gains = [.985, 1, 1.015], values: number[] = [];
  for (let channel = 0; channel < 3; channel++) {
    for (let input = 0; input < 3; input++) {
      values.push((weights[input]! * (1 - saturation) + (input === channel ? saturation : 0)) * brightness * gains[channel]!);
    }
    values.push(0, strong ? .04 : [.002, .003, .004][channel]!);
  }
  values.push(0, 0, 0, 1, 0); // Preserve source alpha, including the painted fur edge.
  return values as ColorMatrix;
}
function sameFilters(a: readonly Filter[] | null | undefined, b: readonly Filter[] | null | undefined): boolean {
  if (a === null || a === undefined || b === null || b === undefined) return a === b;
  return a.length === b.length && a.every((value, i) => value === b[i]);
}
function transform(node: Container) {
  return { x: node.x, y: node.y, sx: node.scale.x, sy: node.scale.y, rotation: node.rotation,
    px: node.pivot.x, py: node.pivot.y, kx: node.skew.x, ky: node.skew.y };
}
function assertIdentityTransform(node: Container): void {
  requireFact(node.x === 0 && node.y === 0 && node.scale.x === 1 && node.scale.y === 1
    && node.rotation === 0 && node.pivot.x === 0 && node.pivot.y === 0 && node.skew.x === 0 && node.skew.y === 0,
  'Borrowed Earth child transform changed');
}

export function attachCivetWaterScene(input: CivetWaterInput) {
  const recipe = admitRecipe(input.recipe), recipeJSON = JSON.stringify(recipe);
  requireFact(input.enabled === undefined || typeof input.enabled === 'boolean', 'enabled must be boolean');
  requireFact(input.allowTestControls === undefined || typeof input.allowTestControls === 'boolean', 'test flag must be boolean');
  const allowTests = input.allowTestControls === true;
  const { earth, background, civetActor } = input;
  requireFact(earth instanceof Container && background instanceof Sprite && civetActor instanceof Container
    && !earth.destroyed && !background.destroyed && !civetActor.destroyed, 'Borrowed water scene is not live');
  requireFact(background.parent === earth && civetActor.parent === earth
    && earth.getChildIndex(background) < earth.getChildIndex(civetActor), 'Borrowed scene parent/order changed');
  assertIdentityTransform(background); assertIdentityTransform(civetActor);
  requireFact(background.anchor.x === 0 && background.anchor.y === 0 && background.alpha === 1
    && background.tint === 0xffffff && !(background.filters?.length) && !background.mask,
  'Waterline requires the unchanged, unfiltered background texels');
  checkTexture(background.texture, 960, 430);
  requireFact(civetActor.children.length === 1 && civetActor.children[0] instanceof MeshSimple,
    'Civet actor must retain exactly its existing mesh');
  const civet = civetActor.children[0] as MeshSimple;
  requireFact(civet.rotation === 0 && civet.pivot.x === 0 && civet.pivot.y === 0
    && civet.skew.x === 0 && civet.skew.y === 0, 'Borrowed Civet orientation changed');
  const declaredContacts = measureContacts(recipe, civet);
  const borrowed = [background, civetActor].map(node => ({ node, parent: node.parent!, index: earth.getChildIndex(node),
    filters: node.filters as readonly Filter[] | null | undefined, transform: JSON.stringify(transform(node)) }));
  const originalFilters = borrowed[1]!.filters, originalMeshTransform = JSON.stringify(transform(civet));
  const sources = [background.texture, civet.texture].map(texture => ({ texture, source: texture.source, resource: texture.source.resource }));
  const declaredRegions: readonly WaterDeclaredRegion[] = freeze(declaredContacts.flatMap(contact => {
    const { x, y, radiusX: r, paw, id } = contact;
    return [
      { id: id + ':shadow', paw, role: 'submerged-shadow' as const,
        geometry: { kind: 'ellipse-rings' as const, x, y: y + .6, radiusX: r, radiusY: 1.2, rings: 6 as const, alpha: .085 },
        bounds: { x0: x - r - 1, y0: y - 1.6, x1: x + r + 1, y1: y + 2.8 } },
      { id: id + ':waterline', paw, role: 'waterline' as const,
        geometry: { kind: 'polygon' as const, alpha: .72,
          points: [x - r - .6, y - .75, x - r * .35, y - 1.05, x + r + .6, y - .55,
            x + r + .6, y + .5, x - r - .6, y + .5] },
        bounds: { x0: x - r - 1.7, y0: y - 2.2, x1: x + r + 1.7, y1: y + 1.7 } },
      { id: id + ':ripples', paw, role: 'broken-ripple' as const,
        geometry: { kind: 'quadratic-arcs' as const, curves: [
          { start: [x - r * 1.35, y + .15] as const, control: [x - r * .9, y + 1.45] as const,
            end: [x - r * .28, y + 1.45] as const, width: .65, alpha: .24, color: 0xa8b7b8 },
          { start: [x + r * .24, y + 1.25] as const, control: [x + r * .9, y + 1.35] as const,
            end: [x + r * 1.35, y + .1] as const, width: .55, alpha: .22, color: 0xb4c0be },
        ] },
        bounds: { x0: x - r * 1.4 - 1.4, y0: y - 1.1, x1: x + r * 1.4 + 1.4, y1: y + 3.0 } },
    ];
  }));
  const shadowRoot = new Container(), surfaceRoot = new Container();
  shadowRoot.label = 'civet-submerged-contact'; surfaceRoot.label = 'civet-water-surface';
  shadowRoot.eventMode = surfaceRoot.eventMode = 'none';
  let filter: ColorMatrixFilter | undefined;
  const allGraphics: Array<{ graphic: Graphics; context: Graphics['context']; role: string; paw: number }> = [];
  const waterSprites: Sprite[] = [];
  const rows: Array<{ shadow: Graphics; mask: Graphics; sprite: Sprite; ripple: Graphics; contact: WaterContact }> = [];
  let enabled = input.enabled ?? true, testMode: WaterTestMode = 'none', disposalRequested = false, disposed = false;
  const failures: string[] = [];
  function ownedGraphic(role: string, paw: number): Graphics {
    const graphic = new Graphics(); allGraphics.push({ graphic, context: graphic.context, role, paw });
    graphic.label = `Civet:paw:${paw}:${role}`; graphic.eventMode = 'none'; return graphic;
  }
  function apply(): void {
    requireFact(!disposalRequested && filter && !civetActor.destroyed && civetActor.parent === earth,
      'Water owner is inactive or borrowed actor changed');
    const withOwnedFilter = [...(originalFilters ?? []), filter];
    requireFact(sameFilters(civetActor.filters, originalFilters) || sameFilters(civetActor.filters, withOwnedFilter),
      'Borrowed filter chain changed outside this water owner');
    civetActor.filters = enabled && testMode !== 'noLight' ? withOwnedFilter : originalFilters ? [...originalFilters] : originalFilters;
    filter.matrix = lightMatrix(testMode === 'strongLight');
    shadowRoot.visible = surfaceRoot.visible = enabled && testMode !== 'noWater';
    const shifted = testMode === 'shiftWater';
    shadowRoot.position.set(shifted ? 22 : 0, shifted ? 9 : 0);
    surfaceRoot.position.set(shifted ? 22 : 0, shifted ? 9 : 0);
    for (const row of rows) {
      const present = !(testMode === 'missingPaw' && row.contact.paw === 3);
      row.shadow.visible = present && testMode !== 'noShadows';
      row.sprite.visible = present && testMode !== 'noOcclusion';
      row.ripple.visible = present && testMode !== 'noRipples';
    }
  }
  function snapshot() {
    const matrix = filter && !filter._destroyed ? Array.from(filter.matrix) : null;
    return { schema: 'cf-civet-water-owner/v1', enabled, testMode, disposalRequested, disposed, recipeJSON,
      declaredContacts, declaredRegions, lightingMatrix: matrix, alphaRow: matrix?.slice(15) ?? null,
      submergedRoot: { destroyed: shadowRoot.destroyed, parentIsEarth: shadowRoot.parent === earth,
        visible: !shadowRoot.destroyed && shadowRoot.visible,
        position: shadowRoot.destroyed ? null : { x: shadowRoot.x, y: shadowRoot.y } },
      surfaceRoot: { destroyed: surfaceRoot.destroyed, parentIsEarth: surfaceRoot.parent === earth,
        visible: !surfaceRoot.destroyed && surfaceRoot.visible,
        position: surfaceRoot.destroyed ? null : { x: surfaceRoot.x, y: surfaceRoot.y } },
      filterDestroyed: filter?._destroyed ?? true,
      graphics: allGraphics.map(row => ({ role: row.role, paw: row.paw, destroyed: row.graphic.destroyed,
        contextDestroyed: row.context.destroyed, visible: !row.graphic.destroyed && row.graphic.visible })),
      waterSprites: waterSprites.map((sprite, paw) => ({ paw, destroyed: sprite.destroyed,
        visible: !sprite.destroyed && sprite.visible, usesBorrowedBackground: !sprite.destroyed && sprite.texture === background.texture,
        hasOwnedMask: !sprite.destroyed && sprite.mask === rows[paw]?.mask })),
      borrowed: borrowed.map(row => ({ label: row.node.label, alive: !row.node.destroyed,
        parentIntact: !row.node.destroyed && row.node.parent === row.parent,
        indexRestored: !row.node.destroyed && row.node.parent === row.parent && row.parent.getChildIndex(row.node) === row.index,
        transformUnchanged: !row.node.destroyed && JSON.stringify(transform(row.node)) === row.transform,
        filtersRestored: !row.node.destroyed && sameFilters(row.node.filters, row.filters),
        usesOwnedLighting: !row.node.destroyed && !!filter && (row.node.filters ?? []).includes(filter) })),
      meshTransformUnchanged: !civet.destroyed && JSON.stringify(transform(civet)) === originalMeshTransform,
      borrowedSourcesIntact: sources.every(row => !row.texture.destroyed && !row.source.destroyed
        && row.texture.source === row.source && row.source.resource === row.resource),
      noBorrowedReparenting: true, noOwnedTextures: true, noAnimationLoop: true,
      reflection: 'Not added: this bounded waterline does not claim a coherent reflected body.', failures: [...failures] };
  }
  function dispose() {
    if (disposed) return snapshot();
    disposalRequested = true; enabled = false;
    const attempt = (label: string, fn: () => void) => { try { fn(); } catch (error) { failures.push(label + ': ' + String(error)); } };
    // Keep references and retry unfinished retirement on a later dispose call.
    // A failed child cannot prevent sibling cleanup or lose its own context.
    if (!civetActor.destroyed) attempt('restore borrowed filters', () => {
      requireFact(sameFilters(civetActor.filters, originalFilters)
        || (filter && sameFilters(civetActor.filters, [...(originalFilters ?? []), filter])),
      'Borrowed filter chain changed; retain foreign state and retry restoration after its owner settles');
      civetActor.filters = originalFilters ? [...originalFilters] : originalFilters;
    });
    else if (!failures.includes('Borrowed Civet destroyed before restoration')) failures.push('Borrowed Civet destroyed before restoration');
    for (const sprite of waterSprites) if (!sprite.destroyed) attempt('retire water sprite', () => {
      sprite.mask = null; sprite.destroy({ texture: false, textureSource: false });
    });
    for (const row of allGraphics) if (!row.graphic.destroyed || !row.context.destroyed) attempt('retire ' + row.role, () => {
      if (!row.graphic.destroyed) row.graphic.destroy({ context: true });
      else if (!row.context.destroyed) row.context.destroy();
    });
    for (const root of [shadowRoot, surfaceRoot]) if (!root.destroyed && root.children.length === 0) {
      attempt('retire water container', () => root.destroy({ children: false }));
    }
    if (filter && !filter._destroyed && (civetActor.destroyed || sameFilters(civetActor.filters, originalFilters))) {
      attempt('retire lighting', () => filter!.destroy());
    }
    disposed = shadowRoot.destroyed && surfaceRoot.destroyed && (!filter || filter._destroyed)
      && waterSprites.every(sprite => sprite.destroyed)
      && allGraphics.every(row => row.graphic.destroyed && row.context.destroyed);
    return snapshot();
  }
  try {
    filter = new ColorMatrixFilter();
    for (const contact of declaredContacts) {
      const { paw } = contact;
      const shadowShape = declaredRegions.find(region => region.paw === paw && region.role === 'submerged-shadow')!.geometry;
      const waterShape = declaredRegions.find(region => region.paw === paw && region.role === 'waterline')!.geometry;
      const rippleShape = declaredRegions.find(region => region.paw === paw && region.role === 'broken-ripple')!.geometry;
      requireFact(shadowShape.kind === 'ellipse-rings' && waterShape.kind === 'polygon' && rippleShape.kind === 'quadratic-arcs',
        'Water geometry role mismatch');
      const shadow = ownedGraphic('submerged-shadow', paw); shadowRoot.addChild(shadow);
      for (let ring = 0; ring < shadowShape.rings; ring++) {
        const k = 1 - ring * .12;
        shadow.ellipse(shadowShape.x, shadowShape.y, shadowShape.radiusX * k, shadowShape.radiusY * k)
          .fill({ color: 0x34494b, alpha: shadowShape.alpha / shadowShape.rings });
      }
      const sprite = new Sprite(background.texture); waterSprites.push(sprite);
      sprite.label = `Civet:paw:${paw}:borrowed-water-texels`; sprite.eventMode = 'none';
      sprite.alpha = waterShape.alpha; surfaceRoot.addChild(sprite);
      const mask = ownedGraphic('waterline-mask', paw); surfaceRoot.addChild(mask);
      mask.poly([...waterShape.points]).fill({ color: 0xffffff }); sprite.mask = mask;
      const ripple = ownedGraphic('broken-ripple', paw); surfaceRoot.addChild(ripple);
      for (const curve of rippleShape.curves) {
        ripple.moveTo(...curve.start).quadraticCurveTo(...curve.control, ...curve.end)
          .stroke({ color: curve.color, width: curve.width, alpha: curve.alpha });
      }
      rows.push({ contact, shadow, mask, sprite, ripple });
    }
    earth.addChildAt(shadowRoot, earth.getChildIndex(background) + 1);
    earth.addChildAt(surfaceRoot, earth.getChildIndex(civetActor) + 1);
    apply();
  } catch (error) { dispose(); throw error; }
  return Object.freeze({
    setEnabled(value: boolean) {
      requireFact(!disposalRequested && typeof value === 'boolean', 'Water enabled state is unavailable or invalid');
      enabled = value; apply(); return snapshot();
    },
    setTestMode(value: WaterTestMode) {
      requireFact(!disposalRequested && allowTests, 'Water diagnostic controls were not enabled');
      requireFact(['none', 'noWater', 'noShadows', 'shiftWater', 'noLight', 'noOcclusion', 'noRipples', 'missingPaw', 'strongLight'].includes(value),
        'Unknown water diagnostic');
      testMode = value; apply(); return snapshot();
    },
    snapshot, dispose,
  });
}
