import { colourTable, parseCatalogueText } from '@cf/art-format';
import type { PixelBuffer } from '@cf/art-compose';
import { buildRecipe } from '@cf/art-recipe';
import text from '../../../packages/art-testparts/src/quadruped.txt?raw';
import fixtureJson from '../../../fixtures/art/quadruped-v1.json';
import { reportFromResults, tryComposeEntry, verdict, type ArtFixture, type EntryResult } from './report';

const fixture = fixtureJson as unknown as ArtFixture;
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

const PAGE_PADDING = 12; // matches body padding in index.html, each side
/** The largest whole-number scale (at most 4) that keeps a canvas of this width within the page. */
const scaleFor = (w: number, available: number): number => Math.max(1, Math.min(4, Math.floor(available / w)));

function drawBuffer(buffer: PixelBuffer, table: number[], available: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const scale = scaleFor(buffer.w, available);
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
  const catalogue = parseCatalogueText(text);
  const available = document.documentElement.clientWidth - 2 * PAGE_PADDING;

  // Each entry is composed once; the timing, the report and the grid all use this one pass.
  const times: number[] = [];
  const results: EntryResult[] = fixture.entries.map((entry) => {
    const t0 = performance.now();
    const result = tryComposeEntry(catalogue, entry);
    times.push(performance.now() - t0);
    return result;
  });
  const report = reportFromResults(fixture, results);
  const outcome = verdict(report);
  const verdictLine = $('verdict');
  verdictLine.textContent = outcome.text;
  verdictLine.className = outcome.ok ? 'pass' : 'fail';

  const details = $('details');
  addLine(details, `Renderer version: code ${report.rendererVersion}, fixture ${report.fixtureVersion}`);

  if (report.mismatches.length > 0) {
    addHeading(details, 'First mismatches');
    for (const m of report.mismatches.slice(0, 10)) {
      addLine(details, `${m.label}\n expected ${m.expected}\n actual   ${m.actual}${m.gapsDiffer ? '\n gaps differ' : ''}`);
    }
  }

  // Timing: display only.
  times.sort((a, b) => a - b);
  const mid = times.length >> 1;
  const median = times.length === 0 ? 0 : times.length % 2 === 1 ? times[mid] ?? 0 : ((times[mid - 1] ?? 0) + (times[mid] ?? 0)) / 2;
  const worst = times[times.length - 1] ?? 0;
  addHeading(details, 'Environment');
  addLine(details, `Compose time: median ${median.toFixed(3)} ms, worst ${worst.toFixed(3)} ms`);
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  addLine(details, `Device memory: ${memory === undefined ? 'not provided by this browser' : `${memory} GB`}`);
  addLine(details, `User agent: ${navigator.userAgent}`);

  // About 40 real (no fallback) creatures, spread across the fixture.
  const real: number[] = [];
  fixture.entries.forEach((e, i) => { if (!e.gaps.some((g) => g.startsWith('fallback:'))) real.push(i); });
  const step = Math.max(1, Math.floor(real.length / 40));
  const grid = $('grid');
  for (let i = 0, shown = 0; i < real.length && shown < 40; i += step, shown++) {
    const index = real[i] as number;
    const entry = fixture.entries[index] as ArtFixture['entries'][number];
    const result = results[index];
    if (result === undefined || 'error' in result) continue;
    const recipe = buildRecipe(entry.genome, [], catalogue);
    const { table, unknown } = colourTable(catalogue.palette, recipe.ramps);
    const figure = document.createElement('figure');
    figure.appendChild(drawBuffer(result.composed.buffer, table, available));
    const caption = document.createElement('figcaption');
    caption.textContent = [`${entry.label} (${entry.pose})`, ...unknown.map((name) => `unknown ramp: ${name}`)].join('\n');
    figure.appendChild(caption);
    grid.appendChild(figure);
  }
}

/** Any error ends up on the page, never a blank screen. */
function showError(error: unknown): void {
  const verdictLine = $('verdict');
  verdictLine.textContent = 'FAIL: error';
  verdictLine.className = 'fail';
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error && error.stack !== undefined ? error.stack : '';
  addLine($('details'), stack.includes(message) ? stack : `${message}\n${stack}`);
}

// Let the browser paint the "Running" line before the heavy work starts.
requestAnimationFrame(() => {
  setTimeout(() => {
    try {
      run();
    } catch (error) {
      showError(error);
    }
  }, 0);
});
