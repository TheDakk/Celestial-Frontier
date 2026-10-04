/* Transparent current named-species bodies for one exact Earth scene. */
import { createSpeciesCanvas, type ArtCanvas, type ArtContext2D } from './speciescanvas.js';
import { speciesGenomePalette } from './speciesoverrides.js';
import { faunaQuadruped } from './quadrupedoverrides.js';
import { QUAD2_SPEC } from './mammaloverrides.js';
import { faunaMonotreme } from './faunaoverrides5.js';
import { FAUNA2_NAME } from './faunaoverrides2.js';
import { FLORA_ICONIC } from './floraoverrides.js';
import { FLORA2_SPEC } from './florarost.js';
import {
  EARTH_RESIDENT_LAYER_PLAN_V1, EARTH_RESIDENT_LAYER_PLAN_JSON_V1,
  snapshotEarthLayerDataV1, type EarthResidentLayerPlanV1,
  type EarthResidentPlacementV1,
} from './earth-resident-plan.js';
export {
  EARTH_RESIDENT_LAYER_PLAN_V1, EARTH_RESIDENT_LAYER_PLAN_JSON_V1,
  type EarthResidentLayerPlanV1, type EarthResidentPlacementV1,
} from './earth-resident-plan.js';

const PAINTER_SIZE = 440;
const INK_SIZE = PAINTER_SIZE * 2;
const INK_OFFSET = PAINTER_SIZE * .5;
const VISIBLE_ALPHA = 12; // same visibility floor as the Compendium fit owner
const SOLID_ALPHA = 230; // excludes these six owners' translucent ground shadows

/** Exact routes mirror resolveOverrideCanvas for these six names. Reusing its
 * current body owners preserves the audited anatomy, markings and species
 * hues; the older bare painters predate several of those named corrections. */
function paintNamedResident(context: ArtContext2D, resident: EarthResidentPlacementV1): void {
  const genome = { ...resident.genome };
  const palette = speciesGenomePalette(genome);
  switch (resident.name) {
    case 'Civet': faunaQuadruped(context, genome, palette, QUAD2_SPEC.Civet!, 'Civet'); return;
    case 'Platypus': faunaMonotreme(context, genome, palette, 'Platypus'); return;
    case 'Frog': FAUNA2_NAME.Frog!(context, genome, palette, 'Frog'); return;
    case "Devil's Club": FLORA_ICONIC["Devil's Club"]!(context, genome, palette, "Devil's Club"); return;
    case 'Persimmon': case 'Cranberry':
      FLORA2_SPEC[resident.name]!(context, genome, palette, resident.name); return;
    default: throw new TypeError('Earth resident named owner missing');
  }
}

/** Each painter gets Compendium's oversized transparent ink coordinates. A
 * bounded alpha scan retains soft edges/shadows, but grounds the lowest solid
 * body pixel. This is static sprite contact, not a terrain/locomotion model.
 * Native proof must inspect actual contact; fake unit alpha proves arithmetic. */
function stampResident(context: ArtContext2D, resident: EarthResidentPlacementV1): void {
  const ink = createSpeciesCanvas(INK_SIZE, INK_SIZE);
  try {
    const source = ink.getContext('2d');
    if (!source) throw new Error('Earth resident ink context unavailable');
    source.translate(INK_OFFSET, INK_OFFSET);
    paintNamedResident(source, resident);
    const data = source.getImageData(0, 0, INK_SIZE, INK_SIZE).data;
    if (data.length !== INK_SIZE * INK_SIZE * 4) throw new Error('Earth resident ink readback size');
    let x0 = INK_SIZE, y0 = INK_SIZE, x1 = -1, y1 = -1, contactY = -1;
    for (let y = 0; y < INK_SIZE; y++) {
      for (let x = 0; x < INK_SIZE; x++) {
        const alpha = data[(y * INK_SIZE + x) * 4 + 3]!;
        if (alpha > VISIBLE_ALPHA) {
          x0 = Math.min(x0, x); y0 = Math.min(y0, y);
          x1 = Math.max(x1, x); y1 = Math.max(y1, y);
        }
        if (alpha >= SOLID_ALPHA) contactY = y;
      }
    }
    if (x1 < 0 || contactY < 0) throw new Error('Earth resident has no solid body ink');
    if (x0 <= 0 || y0 <= 0 || x1 >= INK_SIZE - 1 || y1 >= INK_SIZE - 1) {
      throw new Error('Earth resident body clipped at ink boundary');
    }
    const width = x1 - x0 + 1, height = y1 - y0 + 1;
    const scale = resident.width * 960 / width;
    const contact = contactY - y0 + 1;
    context.save();
    try {
      context.translate(resident.x * 960, resident.groundY * 430);
      context.scale(resident.flip ? -1 : 1, 1);
      context.drawImage(ink, x0, y0, width, height,
        -width * scale / 2, -contact * scale, width * scale, height * scale);
    } finally { context.restore(); }
  } finally {
    // Only one temporary ink canvas is live at a time. The output retains the
    // rendered pixels, never the scratch resource or a portrait background.
    ink.width = ink.height = 1;
  }
}

/** Reject altered identity/genome/family/anchors before canvas allocation.
 * Complete world/profile/roster admission belongs to the app recipe owner. */
export function renderEarthResidentLayerV1(plan: EarthResidentLayerPlanV1): ArtCanvas {
  if (JSON.stringify(snapshotEarthLayerDataV1(plan)) !== EARTH_RESIDENT_LAYER_PLAN_JSON_V1) {
    throw new TypeError('Earth layer plan mismatch');
  }
  const canvas = createSpeciesCanvas(960, 430);
  const context = canvas.getContext('2d');
  if (!context) { canvas.width = canvas.height = 1; throw new Error('Earth layer context unavailable'); }
  try {
    for (const resident of EARTH_RESIDENT_LAYER_PLAN_V1.residents) stampResident(context, resident);
    return canvas;
  } catch (error) {
    canvas.width = canvas.height = 1;
    throw error;
  }
}
