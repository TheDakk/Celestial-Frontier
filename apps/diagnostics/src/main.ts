import { parseCatalogueText, type Catalogue } from '@cf/art-format';
import type { PixelBuffer } from '@cf/art-compose';
import { buildRecipe } from '@cf/art-recipe';
import text from '../../../packages/art-testparts/src/quadruped.txt?raw';
import fixtureJson from '../../../fixtures/art/quadruped-v1.json';
import { buildReport, composeEntry, type ArtFixture } from './report';

const fixture = fixtureJson as unknown as ArtFixture;
const catalogue = parseCatalogueText(text);
const $ = (id: string): HTMLElement => document.getElementById(id) as HTMLElement;

function addLine(parent: HTMLElement, content: string): void {
  const pre = document.createElement('pre');
  pre.textContent = content;
  parent.appendChild(pre);
}

function addHeading(parent: HTMLElement, content: string): void {
  const h = document.createElement('h2');
  h.textContent = content;
  parent.appendChild(h);
}

/** Pixel values 1-16 to CSS-independent RGB, using the entry's three ramps and the palette's fixed colours. */
function colourTable(cat: Catalogue, ramps: { primary: string; accent: string; underside: string }): number[] {
  const p = cat.palette;
  const rgb = (index: number | undefined): number => p.colours[index ?? 0] ?? 0;
  const ramp = (name: string): number[] => (p.ramps[name] ?? [0, 0, 0, 0]).map(rgb);
  return [0, ...ramp(ramps.primary), ...ramp(ramps.accent), ...ramp(ramps.underside),
    rgb(p.eye), rgb(p.eyeHighlight), rgb(p.glow), rgb(p.outline)];
}

/** The largest whole-number scale (at most 4) that keeps the canvas within a phone's width. */
const scaleFor = (w: number): number => Math.max(1, Math.min(4, Math.floor(340 / w)));

function drawBuffer(buffer: PixelBuffer, table: number[]): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const scale = scaleFor(buffer.w);
  canvas.width = buffer.w;
  canvas.height = buffer.h;
  canvas.style.width = `${buffer.w * scale}px`;
  canvas.style.height = `${buffer.h * scale}px`;
  const ctx = canvas.getContext('2d');
  if (ctx === null) return canvas;
  ctx.imageSmoothingEnabled = false;
  const image = ctx.createImageData(buffer.w, buffer.h);
  for (let i = 0; i < buffer.pixels.length; i++) {
    const v = buffer.pixels[i] ?? 0;
    if (v === 0) continue; // stays transparent
    const c = table[v] ?? 0;
    image.data[i * 4] = (c >> 16) & 0xff;
    image.data[i * 4 + 1] = (c >> 8) & 0xff;
    image.data[i * 4 + 2] = c & 0xff;
    image.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

function run(): void {
  const report = buildReport(catalogue, fixture);
  const verdict = $('verdict');
  const pass = report.matched === report.total;
  verdict.textContent = `${pass ? 'PASS' : 'FAIL'} ${pass ? report.total : report.matched} / ${report.total}`;
  verdict.className = pass ? 'pass' : 'fail';

  const details = $('details');
  addLine(details, `Renderer version: ${report.rendererVersion}`);

  if (report.mismatches.length > 0) {
    addHeading(details, 'First mismatches');
    for (const m of report.mismatches.slice(0, 10)) {
      addLine(details, `${m.label}\n expected ${m.expected}\n actual   ${m.actual}${m.gapsDiffer ? '\n gaps differ' : ''}`);
    }
  }

  // Timing: display only.
  const times = fixture.entries.map((entry) => {
    const t0 = performance.now();
    composeEntry(catalogue, entry);
    return performance.now() - t0;
  }).sort((a, b) => a - b);
  const mid = times.length >> 1;
  const median = times.length === 0 ? 0 : times.length % 2 === 1 ? times[mid] ?? 0 : ((times[mid - 1] ?? 0) + (times[mid] ?? 0)) / 2;
  const worst = times[times.length - 1] ?? 0;
  addHeading(details, 'Environment');
  addLine(details, `Compose time: median ${median.toFixed(3)} ms, worst ${worst.toFixed(3)} ms`);
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  addLine(details, `Device memory: ${memory === undefined ? 'not provided by this browser' : `${memory} GB`}`);
  addLine(details, `User agent: ${navigator.userAgent}`);

  // About 40 real (no fallback) creatures, spread across the fixture.
  const real = fixture.entries.filter((e) => !e.gaps.some((g) => g.startsWith('fallback:')));
  const step = Math.max(1, Math.floor(real.length / 40));
  const grid = $('grid');
  for (let i = 0, shown = 0; i < real.length && shown < 40; i += step, shown++) {
    const entry = real[i] as ArtFixture['entries'][number];
    const composed = composeEntry(catalogue, entry);
    const recipe = buildRecipe(entry.genome, [], catalogue, { guardian: entry.guardian });
    const figure = document.createElement('figure');
    figure.appendChild(drawBuffer(composed.buffer, colourTable(catalogue, recipe.ramps)));
    const caption = document.createElement('figcaption');
    caption.textContent = `${entry.label} (${entry.pose})`;
    figure.appendChild(caption);
    grid.appendChild(figure);
  }
}

run();
