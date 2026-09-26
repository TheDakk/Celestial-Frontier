import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { resolveOverrideCanvas,resolveProceduralCanvas } from '../src/speciesoverrides.js';
import type {PainterTopology} from '../src/painter-topology.js';
import { QUAD2_SPEC } from '../src/mammaloverrides.js';
import { installSpeciesCanvasFactory, type ArtCanvas } from '../src/speciescanvas.js';
import {
  EARTH_RESIDENT_LAYER_PLAN_V1, EARTH_RESIDENT_LAYER_PLAN_JSON_V1,
  renderEarthResidentLayerV1, type EarthResidentLayerPlanV1,
} from '../src/earth-resident-layer.js';

interface RecordedCanvas {
  width: number; height: number; trace: unknown[]; draws: RecordedCanvas[];
  getContext: () => unknown;
}
class RecordedPath {
  readonly trace: unknown[] = [];
  constructor() {
    return new Proxy(this, { get(target, key) {
      if (key === 'trace') return target.trace;
      return (...args: unknown[]) => target.trace.push([String(key), ...args.map(recordArgument)]);
    } });
  }
}
function recordArgument(value: unknown): unknown {
  return value instanceof RecordedPath ? structuredClone(value.trace)
    : typeof value === 'object' && value !== null ? '[object]' : value;
}
const allocations: RecordedCanvas[] = [];
let alphaMode: 'nominal' | 'blank' | 'shadow-only' | 'edge' = 'nominal';
function fixturePixels(width: number, height: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4);
  if (alphaMode === 'blank') return data;
  // Deliberately synthetic: arithmetic controls are separate from command
  // identity evidence and never claim to be real rasterized body pixels.
  for (let y = 290; y <= 570; y++) for (let x = 280; x <= 599; x++) {
    data[(y * width + x) * 4 + 3] = y <= 549 && alphaMode !== 'shadow-only' ? 255 : 96;
  }
  if (alphaMode === 'edge') data[3] = 255;
  return data;
}
function recordedCanvas(width: number, height: number): ArtCanvas {
  const trace: unknown[] = [], draws: RecordedCanvas[] = [];
  const target: Record<string, unknown> = {};
  let gradient = 0;
  const context = new Proxy(target, {
    get(object, key) {
      if (Reflect.has(object, key)) return Reflect.get(object, key);
      if (key === 'createImageData' || key === 'getImageData') return (...args: number[]) => {
        const w = key === 'getImageData' ? args[2]! : args[0]!;
        const h = key === 'getImageData' ? args[3]! : args[1]!;
        trace.push([key, ...args]); return { width: w, height: h, data: fixturePixels(w, h) };
      };
      if (key === 'createLinearGradient' || key === 'createRadialGradient') return (...args: unknown[]) => {
        const id = ++gradient; trace.push([key, id, ...args]);
        return { addColorStop: (...values: unknown[]) => trace.push(['stop', id, ...values]) };
      };
      if (key === 'drawImage') return (source: RecordedCanvas, ...args: unknown[]) => {
        draws.push(source); trace.push(['drawImage', source.width, source.height, ...args]);
      };
      if (key === 'measureText') return (text: unknown) => ({ width: String(text).length * 8 });
      return (...args: unknown[]) => trace.push([String(key), ...args.map(recordArgument)]);
    },
    set(object, key, value) {
      trace.push(['set', String(key), recordArgument(value)]);
      return Reflect.set(object, key, value);
    },
  });
  const canvas = { width, height, trace, draws, getContext: () => context };
  allocations.push(canvas);
  return canvas as unknown as ArtCanvas;
}
beforeAll(() => { vi.stubGlobal('Path2D', RecordedPath); installSpeciesCanvasFactory(recordedCanvas); });
afterAll(() => vi.unstubAllGlobals());
const record = (canvas: ArtCanvas): RecordedCanvas => canvas as unknown as RecordedCanvas;

function unclippedRectangles(trace: unknown[]): unknown[] {
  const stack: boolean[] = [], findings: unknown[] = [];
  let clipped = false;
  for (const row of trace) {
    if (!Array.isArray(row)) continue;
    if (row[0] === 'save') stack.push(clipped);
    else if (row[0] === 'restore') clipped = stack.pop() ?? false;
    else if (row[0] === 'clip') clipped = true;
    else if (row[0] === 'fillRect' && !clipped) findings.push(row);
  }
  return findings;
}

/** Real current body-owner command evidence. Native proof separately inspects
 * actual alpha/pixels and bank contact; the synthetic mask below does not. */
describe('independent transparent Earth resident layer', () => {
  it('uses the exact current Compendium body owners and their named anatomy/palettes for all six residents', () => {
    const before = JSON.stringify(EARTH_RESIDENT_LAYER_PLAN_V1);
    const start = allocations.length;
    const layer = record(renderEarthResidentLayerV1(EARTH_RESIDENT_LAYER_PLAN_V1));
    expect([layer.width, layer.height]).toEqual([960, 430]);
    expect(allocations.length - start).toBe(7); // output + six sequential, retired ink canvases
    expect(layer.draws).toHaveLength(6);
    EARTH_RESIDENT_LAYER_PLAN_V1.residents.forEach((resident, index) => {
      const portrait = resolveOverrideCanvas({ ...resident.genome });
      expect(portrait, resident.name).not.toBeNull();
      // Independently enter the actual Compendium dispatcher, then compare its
      // transparent ink body (before framing/polish), including Path2D commands.
      const expected = record(portrait!).draws[0]!;
      expect(layer.draws[index]!.trace, resident.name).toEqual(expected.trace);
      expect([layer.draws[index]!.width, layer.draws[index]!.height]).toEqual([1, 1]);
    });
    expect(QUAD2_SPEC.Civet).toMatchObject({ family: 'mustelid', mammalDPlan: 'Civet',
      hue: '#a8996f', coat: 'spots', tail: 'banded' });
    const traces = layer.draws.map(canvas => JSON.stringify(canvas.trace));
    expect(traces[3]).toContain('#4c9a3f'); // canonical Frog hue, not its random purple genome
    expect(traces[4]).toContain('#5f8a48'); // dedicated Devil's Club palmate leaf gradient
    expect(traces[2]).toContain('#3a2e2c'); // Platypus bill, absent from old generic body
    expect(JSON.stringify(EARTH_RESIDENT_LAYER_PLAN_V1)).toBe(before);
    expect(before).toBe(EARTH_RESIDENT_LAYER_PLAN_JSON_V1);
  });

  it('grounds solid body ink independently of lower translucent shadows and keeps the scene transparent', () => {
    const first = record(renderEarthResidentLayerV1(EARTH_RESIDENT_LAYER_PLAN_V1));
    const second = record(renderEarthResidentLayerV1(EARTH_RESIDENT_LAYER_PLAN_V1));
    expect(first.trace).toEqual(second.trace);
    expect(first.trace.filter(row => Array.isArray(row) && row[0] === 'fillRect')).toEqual([]);
    for (const source of first.draws) {
      expect(unclippedRectangles(source.trace)).toEqual([]);
    }
    // Civet's canonical ear painter clips a full rectangle to its Path2D.
    // Clipping may protect that rectangle only until its own restore.
    const rectangle = ['fillRect', 0, 0, 440, 440];
    expect(unclippedRectangles([['save'], ['clip'], rectangle, ['restore']])).toEqual([]);
    expect(unclippedRectangles([['save'], ['clip'], rectangle, ['restore'], rectangle])).toEqual([rectangle]);
    const draws = first.trace.filter(row => Array.isArray(row) && row[0] === 'drawImage');
    expect(draws).toEqual(EARTH_RESIDENT_LAYER_PLAN_V1.residents.map(resident => {
      const scale = resident.width * 960 / 320;
      return ['drawImage', 880, 880, 280, 290, 320, 281, -320 * scale / 2,
        -260 * scale, 320 * scale, 281 * scale];
    }));
    expect(first.trace.filter(row => Array.isArray(row) && row[0] === 'translate')).toEqual(
      EARTH_RESIDENT_LAYER_PLAN_V1.residents.map(row => ['translate', row.x * 960, row.groundY * 430]),
    );
    expect(first.trace.filter(row => Array.isArray(row) && row[0] === 'scale')).toEqual(
      EARTH_RESIDENT_LAYER_PLAN_V1.residents.map(row => ['scale', row.flip ? -1 : 1, 1]),
    );
  });

  it('rejects absent solid ink or clipped ink and retires both failed output and temporary canvas', () => {
    for (const mode of ['blank', 'shadow-only', 'edge'] as const) {
      const before = allocations.length;
      alphaMode = mode;
      try { expect(() => renderEarthResidentLayerV1(EARTH_RESIDENT_LAYER_PLAN_V1)).toThrow(); }
      finally { alphaMode = 'nominal'; }
      const created = allocations.slice(before);
      expect(created).toHaveLength(2);
      expect(created.map(canvas => [canvas.width, canvas.height])).toEqual([[1, 1], [1, 1]]);
    }
    expect(record(renderEarthResidentLayerV1(EARTH_RESIDENT_LAYER_PLAN_V1)).draws).toHaveLength(6);
  });

  it('rejects changed genome, family, anchor, order, missing resident and hostile hooks before allocation', () => {
    let invoked = 0;
    const mutations: Array<(plan: any) => void> = [
      plan => { plan.residents[0].genome.color += 1; },
      plan => { plan.residents[0].family = 'fish'; },
      plan => { plan.residents[0].x += .01; },
      plan => { plan.residents.reverse(); },
      plan => { plan.residents.pop(); },
      plan => { plan.worldKey += 'wrong'; },
      plan => Object.defineProperty(plan.residents[0].genome, 'seed', { enumerable: true, get() { invoked++; return 0; } }),
      plan => { plan.toJSON = () => { invoked++; return {}; }; },
    ];
    for (const mutate of mutations) {
      const plan = JSON.parse(EARTH_RESIDENT_LAYER_PLAN_JSON_V1); mutate(plan);
      const before = allocations.length;
      expect(() => renderEarthResidentLayerV1(plan as EarthResidentLayerPlanV1)).toThrow();
      expect(allocations).toHaveLength(before);
    }
    expect(invoked).toBe(0);
  });
});


it('the actual procedural dispatcher publishes the winning topology once and preserves ordinary ink commands',()=>{
  for(const [body,loco,owner]of [[15,0,'proceduralRadialFauna'],[5,0,'myriapod'],[14,3,'faunaBird']] as const){
    const genome={kingdom:'fauna',seed:1597751321,body,loco,size:2,head:0,skin:0};
    let count=0,observed:PainterTopology|null=null,observedInk:ArtCanvas|undefined;
    const picture=resolveProceduralCanvas(genome,undefined,false,(value,ink)=>{count++;observed=value;observedInk=ink;});
    const ordinary=resolveProceduralCanvas(genome);
    expect(count).toBe(1);expect((observed as PainterTopology|null)?.ownerId).toBe(owner);
    expect(record(picture!).trace).toEqual(record(ordinary!).trace);
    expect(record(observedInk!).trace).toEqual(record(ordinary!).draws[0]!.trace);
  }
});
it('a currently unobserved owner reports null rather than guessed anatomy',()=>{
  let calls=0,value:PainterTopology|null|undefined;
  const picture=resolveProceduralCanvas({kingdom:'fauna',seed:1597751321,body:0,loco:4},undefined,false,topology=>{calls++;value=topology;});
  expect(picture).not.toBeNull();expect(calls).toBe(1);expect(value).toBeNull();
});
