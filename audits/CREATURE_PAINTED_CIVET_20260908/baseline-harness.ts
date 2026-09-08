/* Audit-only native capture. Imports actual current painter owners; no product mutation. */
import { installSpeciesCanvasFactory, createSpeciesCanvas } from '../../port/v2/packages/art/src/speciescanvas.js';
import { renderSpeciesPortraitCanvas, renderSpeciesThumbCanvas } from '../../port/v2/packages/art/src/speciespainter.js';
import { speciesVisualKey } from '../../port/v2/packages/art/src/speciesidentity.js';
import { EARTH_RESIDENT_LAYER_PLAN_V1, EARTH_RESIDENT_LAYER_PLAN_JSON_V1 } from '../../port/v2/packages/art/src/earth-resident-plan.js';
import { renderEarthResidentLayerV1 } from '../../port/v2/packages/art/src/earth-resident-layer.js';
import { CLIPPED } from '../../port/v2/packages/art/src/speciesoverrides.js';

const allocations: OffscreenCanvas[] = [];
installSpeciesCanvasFactory((width, height) => { const canvas = new OffscreenCanvas(width, height); allocations.push(canvas); return canvas; });
const check = (ok: unknown, reason: string): void => { if (!ok) throw Error(reason); };
const ctx = (canvas: OffscreenCanvas): OffscreenCanvasRenderingContext2D => { const c = canvas.getContext('2d'); if (!c) throw Error('2D canvas unavailable'); return c; };
const pixels = (canvas: OffscreenCanvas) => ctx(canvas).getImageData(0, 0, canvas.width, canvas.height).data;
const equalPixels = (left: OffscreenCanvas, right: OffscreenCanvas) => {
  const a = pixels(left), b = pixels(right); if (left.width !== right.width || left.height !== right.height || a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
};
function bounds(canvas: OffscreenCanvas) {
  const data = pixels(canvas); let x0 = canvas.width, y0 = canvas.height, x1 = -1, y1 = -1, contactY = -1, visible = 0, solid = 0;
  for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
    const a = data[(y * canvas.width + x) * 4 + 3]!;
    if (a > 12) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); visible++; }
    if (a >= 230) { contactY = y; solid++; }
  }
  check(x1 >= x0 && y1 >= y0 && contactY >= 0, 'Missing visible/solid body ink');
  check(x0 > 0 && y0 > 0 && x1 < canvas.width - 1 && y1 < canvas.height - 1, 'Raw ink clipped');
  return { x0, y0, x1, y1, width: x1 - x0 + 1, height: y1 - y0 + 1, contactY, visible, solid };
}
function downsample(source: OffscreenCanvas, size: number) { const canvas = createSpeciesCanvas(size, size); ctx(canvas).drawImage(source, 0, 0, size, size); return canvas; }
async function dataURL(canvas: OffscreenCanvas) {
  const blob = await canvas.convertToBlob({ type: 'image/png' });
  return await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob); });
}
const win = window as unknown as Record<string, unknown>;
win.__CF_CIVET_BASELINE_PROMISE__ = (async () => {
  const original = JSON.stringify(EARTH_RESIDENT_LAYER_PLAN_V1);
  check(original === EARTH_RESIDENT_LAYER_PLAN_JSON_V1, 'Earth resident plan changed');
  const residents = EARTH_RESIDENT_LAYER_PLAN_V1.residents;
  check(residents.filter(row => row.name === 'Civet').length === 1, 'Expected one canonical Civet');
  const civet = residents.find(row => row.name === 'Civet')!;
  check(civet.genome.seed === 3212817920 && civet.x === .72 && civet.groundY === .77 && civet.width === .15, 'Canonical Civet identity/anchor changed');
  const before = allocations.length;
  const portrait = renderSpeciesPortraitCanvas({ ...civet.genome });
  const ink = allocations.slice(before).filter(canvas => canvas.width === 880 && canvas.height === 880);
  check(ink.length === 1 && portrait.width === 440 && portrait.height === 440, 'Actual dispatcher allocation changed');
  const raw = ink[0]!, rawBounds = bounds(raw), pad = 12;
  const crop = createSpeciesCanvas(rawBounds.width + pad * 2, rawBounds.height + pad * 2);
  ctx(crop).drawImage(raw, rawBounds.x0, rawBounds.y0, rawBounds.width, rawBounds.height, pad, pad, rawBounds.width, rawBounds.height);
  const portrait300 = downsample(portrait, 300), portrait132 = renderSpeciesThumbCanvas({ ...civet.genome });
  check(equalPixels(portrait132, downsample(portrait, 132)), 'Native thumbnail does not equal current polished portrait downsample');
  const all = createSpeciesCanvas(960, 430), five = createSpeciesCanvas(960, 430);
  const placements = [];
  for (const resident of residents) {
    const prior = allocations.length;
    const currentPortrait = renderSpeciesPortraitCanvas({ ...resident.genome });
    const source = allocations.slice(prior).filter(canvas => canvas.width === 880 && canvas.height === 880);
    check(source.length === 1, 'Resident dispatcher ink allocation changed: ' + resident.name);
    const b = bounds(source[0]!), scale = resident.width * 960 / b.width, contact = b.contactY - b.y0 + 1;
    for (const canvas of resident.name === 'Civet' ? [all] : [all, five]) {
      const c = ctx(canvas); c.save(); c.translate(resident.x * 960, resident.groundY * 430); c.scale(resident.flip ? -1 : 1, 1);
      c.drawImage(source[0]!, b.x0, b.y0, b.width, b.height, -b.width * scale / 2, -contact * scale, b.width * scale, b.height * scale); c.restore();
    }
    placements.push({ name: resident.name, bounds: b, anchor: [resident.x, resident.groundY], relativeWidth: resident.width, scale, flip: resident.flip });
    currentPortrait.width = currentPortrait.height = source[0]!.width = source[0]!.height = 1;
  }
  const actualLayer = renderEarthResidentLayerV1(EARTH_RESIDENT_LAYER_PLAN_V1);
  check(equalPixels(all, actualLayer), 'Audit six-resident composition differs from actual production layer');
  check(!equalPixels(all, five), 'Omitting Civet changed no pixels');
  check(CLIPPED.length === 0, 'Current portrait clipping sentinel fired: ' + CLIPPED.join(','));
  check(JSON.stringify(EARTH_RESIDENT_LAYER_PLAN_V1) === original, 'Capture mutated canonical plan');
  const outputs = [];
  for (const [name, canvas] of [['civet-ink-880.png', raw], ['civet-alpha-crop.png', crop], ['civet-current-440.png', portrait], ['civet-current-300.png', portrait300], ['civet-current-132.png', portrait132], ['earth-residents-original.png', all], ['earth-residents-without-civet.png', five]] as const) {
    outputs.push({ name, width: canvas.width, height: canvas.height, dataURL: await dataURL(canvas) });
  }
  for (const output of outputs.filter(row => !row.name.includes('880') && !row.name.includes('earth-'))) {
    const figure = document.createElement('figure'), image = document.createElement('img'), label = document.createElement('figcaption');
    image.src = output.dataURL; image.width = output.width; image.height = output.height; image.alt = output.name; label.textContent = output.name; figure.append(image, label); document.querySelector('main')!.append(figure);
  }
  await Promise.all([...document.images].map(image => image.decode()));
  document.getElementById('status')!.textContent = 'Exact canonical genome · actual current portrait and transparent ink · six-layer pixel parity passed';
  const result = { schema: 'cf-civet-current-painter-baseline/v1', certification: false, genome: civet.genome, visualKey: speciesVisualKey({ ...civet.genome }), worldKey: EARTH_RESIDENT_LAYER_PLAN_V1.worldKey, placement: civet, rawBounds, cropPadding: pad, placements, originalLayerPixelParity: true, omittedCivetChangesPixels: true, outputs };
  win.__CF_CIVET_BASELINE__ = result; return result;
})().catch(error => { win.__CF_CIVET_BASELINE_FAILURE__ = String(error?.stack || error); document.getElementById('status')!.textContent = String(error); throw error; });
