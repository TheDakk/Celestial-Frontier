import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { makeGenome } from '@cf/domain-genome';
import { hdGenesFor } from '@cf/domain-strays';
import { BIOME_VISUAL_KEYS_V1, BIOME_VISUAL_PROFILES_V1 } from '@cf/art/biome-visual-profile';
import { createVisualTreatmentV1 } from '@cf/art/visual-treatment';
import { renderBiomeVistaV1, type BiomeVistaInputV1, type GenericBiomeVistaOptionsV1 } from '@cf/art/biome-vista';
import { installSpeciesCanvasFactory } from '../src/speciescanvas.js';
import { readTrackedV1Source } from '../../../test-support/tracked-v1-source.js';
import {
  renderPreservedGenericVistaV1, renderPreservedGasDeckVistaV1,
  renderPreservedAbyssVistaV1, renderPreservedReefVistaV1,
  PRESERVED_FULL_VISTA_SOURCE_SHA256,
} from '../src/biomevista-full.worker.verbatim.js';

const allocationTraces: unknown[][] = [];

function portableSurface(width: number, height: number): OffscreenCanvas {
  const trace: unknown[] = [];
  allocationTraces.push(trace);
  let gradient = 0;
  const target: Record<string, unknown> = {};
  const context = new Proxy(target, {
    get(object, key) {
      if (Reflect.has(object, key)) return Reflect.get(object, key);
      if (key === 'createImageData') return (w: number, h: number) => {
        trace.push(['image-data-create', w, h]);
        return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) };
      };
      if (key === 'getImageData') return (x: number, y: number, w: number, h: number) => {
        trace.push(['image-data-read', x, y, w, h]);
        return { width: w, height: h, data: new Uint8ClampedArray(w * h * 4) };
      };
      if (key === 'createLinearGradient' || key === 'createRadialGradient') return (...args: unknown[]) => {
        const id = ++gradient; trace.push(['gradient', String(key), id, ...args]);
        return { addColorStop: (...values: unknown[]) => trace.push(['stop', id, ...values]) };
      };
      if (key === 'measureText') return (text: unknown) => ({ width: String(text).length * 8 });
      return (...args: unknown[]) => { trace.push(['call', String(key), ...args.map((arg) => typeof arg === 'object' ? '[object]' : arg)]); };
    },
    set(object, key, value) { trace.push(['set', String(key), typeof value === 'object' ? '[object]' : value]); return Reflect.set(object, key, value); },
  });
  const surface = {
    width,
    height,
    getContext: () => {
      trace.push(['context', surface.width, surface.height]);
      return context;
    },
  };
  return surface as unknown as OffscreenCanvas;
}

beforeAll(() => installSpeciesCanvasFactory(portableSurface));

function treatment(key: string, polished = false) {
  return createVisualTreatmentV1({ scope: 'biome', key }, polished ? { atmosphere: 'polished' } : undefined);
}

function genericOptions(key: typeof BIOME_VISUAL_KEYS_V1[number]): GenericBiomeVistaOptionsV1 {
  return {
    seed: 0x1234_5678, era: 'none', pal: key === 'abyssal' ? 'night' : 'day', biome: 'land', wx: null,
    moons: 1, aurora: false, nightize: false, duskize: false, flora: false, water: 'none', genes: null,
    floraGenes: null, ring: false, stc: null, herd: 0, aqua: 0, air: 0, wb: key, evt: null, titan: false, salt: 0,
  };
}

function captured(run: () => unknown): string {
  const start = allocationTraces.length;
  run();
  return JSON.stringify(allocationTraces.slice(start));
}

describe('portable full biome vista', () => {
  it('routes all 43 generic biome keys with identity-equivalent commands and RNG chronology', () => {
    for (const key of BIOME_VISUAL_KEYS_V1) {
      const options = genericOptions(key);
      const direct = captured(() => renderPreservedGenericVistaV1(options as unknown as Record<string, unknown>, BIOME_VISUAL_PROFILES_V1));
      const adapted = captured(() => renderBiomeVistaV1({
        scene: 'generic', biomeKey: key, profile: BIOME_VISUAL_PROFILES_V1[key], treatment: treatment(key), options,
      }));
      expect(adapted, key).toBe(direct);
    }
  });

  it('renders non-empty canonical fauna and flora through every biome and dedicated scene', () => {
    const fauna = hdGenesFor(makeGenome(0x1234_abcd, 'fauna', 0.5));
    const flora = makeGenome(0x5678_dcba, 'flora', 0.5);
    for (const key of BIOME_VISUAL_KEYS_V1) {
      const dimensions: number[] = [];
      const trace = captured(() => {
        const canvas = renderBiomeVistaV1({
          scene: 'generic', biomeKey: key, profile: BIOME_VISUAL_PROFILES_V1[key],
          treatment: treatment(key),
          options: {
            ...genericOptions(key), flora: true, genes: [fauna], floraGenes: [flora], herd: 1,
          },
        });
        dimensions.push(canvas.width, canvas.height);
      });
      expect(dimensions, key).toEqual([960, 430]);
      expect(trace.includes('["context",300,300]'), `${key}: fauna branch`).toBe(true);
      expect(trace.includes('["context",200,200]'), `${key}: flora branch`).toBe(true);
    }
    const dedicated: BiomeVistaInputV1[] = [
      {
        scene: 'gas', biomeKey: 'stormeye', profile: BIOME_VISUAL_PROFILES_V1.stormeye,
        treatment: treatment('stormeye'),
        options: {
          seed: 91, hue: 208, spot: true, spotHue: 0, ring: true, moons: 2,
          tod: 'twilight', aurora: true, air: 1, wb: 'stormeye',
          airGenes: [fauna], aerFlora: [flora], evt: null, titan: false,
        },
      },
      {
        scene: 'abyss', biomeKey: 'abyssal', profile: BIOME_VISUAL_PROFILES_V1.abyssal,
        treatment: treatment('abyssal'), options: { seed: 92, aqua: 1, genes: [fauna] },
      },
      {
        scene: 'reef', biomeKey: 'coral', profile: BIOME_VISUAL_PROFILES_V1.coral,
        treatment: treatment('coral'), options: { seed: 93, genes: [fauna] },
      },
    ];
    for (const input of dedicated) {
      const dimensions: number[] = [];
      const trace = captured(() => {
        const canvas = renderBiomeVistaV1(input);
        dimensions.push(canvas.width, canvas.height);
      });
      expect(dimensions, input.scene).toEqual([960, 430]);
      expect(trace.includes('["context",300,300]'), `${input.scene}: fauna branch`).toBe(true);
      if (input.scene === 'gas') {
        expect(trace.includes('["context",200,200]'), 'gas: flora branch').toBe(true);
      }
    }
  });

  it('preserves gas, abyss and reef command traces through the adapter', () => {
    const cases: Array<{ input: BiomeVistaInputV1; direct: () => unknown }> = [
      { input: { scene: 'gas', biomeKey: 'banded', profile: BIOME_VISUAL_PROFILES_V1.banded, treatment: treatment('banded'), options: { seed: 91, hue: 44, spot: false, ring: false, moons: 0, tod: 'day', aurora: false, air: 0, wb: 'banded', airGenes: null, aerFlora: null, evt: null, titan: false } }, direct: () => renderPreservedGasDeckVistaV1({ seed: 91, hue: 44, spot: false, ring: false, moons: 0, tod: 'day', aurora: false, air: 0, wb: 'banded', airGenes: null, aerFlora: null, evt: null, titan: false }) },
      { input: { scene: 'gas', biomeKey: 'stormeye', profile: BIOME_VISUAL_PROFILES_V1.stormeye, treatment: treatment('stormeye'), options: { seed: 94, hue: 208, spot: true, spotHue: 0, ring: true, moons: 2, tod: 'twilight', aurora: true, air: 1, wb: 'stormeye', airGenes: [], aerFlora: [], evt: null, titan: false } }, direct: () => renderPreservedGasDeckVistaV1({ seed: 94, hue: 208, spot: true, spotHue: 0, ring: true, moons: 2, tod: 'twilight', aurora: true, air: 1, wb: 'stormeye', airGenes: [], aerFlora: [], evt: null, titan: false }) },
      { input: { scene: 'abyss', biomeKey: 'abyssal', profile: BIOME_VISUAL_PROFILES_V1.abyssal, treatment: treatment('abyssal'), options: { seed: 92, aqua: 0, genes: [] } }, direct: () => renderPreservedAbyssVistaV1({ seed: 92, aqua: 0, genes: [] }) },
      { input: { scene: 'reef', biomeKey: 'coral', profile: BIOME_VISUAL_PROFILES_V1.coral, treatment: treatment('coral'), options: { seed: 93, genes: [] } }, direct: () => renderPreservedReefVistaV1({ seed: 93, genes: [] }) },
    ];
    for (const item of cases) {
      const direct = captured(item.direct);
      const adapted = captured(() => renderBiomeVistaV1(item.input));
      expect(adapted, item.input.scene).toBe(direct);
    }
  });

  it('admits the preserved town-era branch without changing its commands', () => {
    const options = { ...genericOptions('temperate'), era: 'town' as const };
    const direct = captured(() => renderPreservedGenericVistaV1(
      options as unknown as Record<string, unknown>,
      BIOME_VISUAL_PROFILES_V1,
    ));
    const adapted = captured(() => renderBiomeVistaV1({
      scene: 'generic', biomeKey: 'temperate', profile: BIOME_VISUAL_PROFILES_V1.temperate,
      treatment: treatment('temperate'), options,
    }));
    const noCivilization = captured(() => renderBiomeVistaV1({
      scene: 'generic', biomeKey: 'temperate', profile: BIOME_VISUAL_PROFILES_V1.temperate,
      treatment: treatment('temperate'), options: genericOptions('temperate'),
    }));
    expect(adapted).toBe(direct);
    expect(adapted).not.toBe(noCivilization);
  });

  it('rejects authority, treatment, option and finite-value mutants before allocation', () => {
    const before = allocationTraces.length;
    const base = { scene: 'generic' as const, biomeKey: 'temperate' as const, profile: BIOME_VISUAL_PROFILES_V1.temperate, treatment: treatment('temperate'), options: genericOptions('temperate') };
    expect(() => renderBiomeVistaV1({ ...base, profile: BIOME_VISUAL_PROFILES_V1.savanna })).toThrow(/canonical/);
    expect(() => renderBiomeVistaV1({ ...base, treatment: treatment('temperate', true) })).toThrow(/identity/);
    expect(() => renderBiomeVistaV1({ ...base, options: { ...base.options, surprise: 1 } } as unknown as BiomeVistaInputV1)).toThrow(/unexpected/);
    const without = (field: string) => Object.fromEntries(
      Object.entries(base.options).filter(([key]) => key !== field),
    );
    const missingWb = without('wb');
    const missingEra = without('era');
    const missingGenes = without('genes');
    expect(() => renderBiomeVistaV1({ ...base, options: missingWb } as unknown as BiomeVistaInputV1)).toThrow(/missing generic option wb/);
    expect(() => renderBiomeVistaV1({ ...base, options: missingEra } as unknown as BiomeVistaInputV1)).toThrow(/missing generic option era/);
    expect(() => renderBiomeVistaV1({ ...base, options: missingGenes } as unknown as BiomeVistaInputV1)).toThrow(/missing generic option genes/);
    expect(() => renderBiomeVistaV1({ ...base, options: { ...base.options, herd: Number.NaN } })).toThrow(/non-finite/);
    expect(() => renderBiomeVistaV1({
      scene: 'gas', biomeKey: 'banded', profile: BIOME_VISUAL_PROFILES_V1.banded,
      treatment: treatment('banded'),
      options: {
        seed: 91, hue: 44, spot: false, spotHue: undefined, ring: false, moons: 0,
        tod: 'day', aurora: false, air: 0, wb: 'banded', airGenes: null,
        aerFlora: null, evt: null, titan: false,
      },
    } as unknown as BiomeVistaInputV1)).toThrow(/invalid options\.spotHue|invalid gas options/);
    expect(allocationTraces).toHaveLength(before);
  });

  it('seals the exact selected source slices and excludes lifecycle ownership', () => {
    const main = readTrackedV1Source().script;
    const generic = main.slice(main.indexOf('function _hdVolcano('), main.indexOf('\n/* the planetfall overlay', main.indexOf('function hdVista(')));
    const deck = main.slice(main.indexOf('function _hdDeckScene('), main.indexOf('\n/* sea-region biome keys', main.indexOf('function _hdDeckScene(')));
    const wxStart = generic.indexOf('function wxEventFor(P, wb, wxTok){');
    const wxEnd = generic.indexOf('\nconst WX_EVENT_WORD=', wxStart);
    const selected = generic.slice(0, wxStart) + generic.slice(wxEnd) + '\n' + deck;
    expect(createHash('sha256').update(selected).digest('hex')).toBe(PRESERVED_FULL_VISTA_SOURCE_SHA256);
    const generated = readFileSync(fileURLToPath(new URL('../src/biomevista-full.worker.verbatim.js', import.meta.url)), 'utf8');
    expect(generated).not.toMatch(/\b(?:document|window|globalThis|localStorage|vistaBox|showVistaBox|_descSeq|AudioContext|VisualEffectPolicyV1|CameraShakePolicyV1)\b|Math\.random\s*\(/u);
    const forbidden = /\b(?:document|vistaBox|AudioContext|CameraShakePolicyV1)\b/u;
    for (const mutant of ['document', 'vistaBox', 'AudioContext', 'CameraShakePolicyV1']) expect(forbidden.test(mutant)).toBe(true);

    const worker = readFileSync(fileURLToPath(new URL('../src/hdportrait.worker.verbatim.js', import.meta.url)), 'utf8');
    const primitiveNames = ['hdBeastBare', '_hdPlantBare', 'hdFloraBare', '_hdCamo', '_hdStampPlant', '_hdPlaceBeast', '_hdHash', '_hdFbm', '_hdSm'];
    for (const name of primitiveNames) {
      expect(worker.match(new RegExp(`\\bfunction\\s+${name}\\s*\\(`, 'g')), name).toHaveLength(1);
      expect(generated, name).not.toMatch(new RegExp(`\\bfunction\\s+${name}\\s*\\(`));
    }
    const portraitStart = main.lastIndexOf('/*', main.indexOf('@section hdart [app]'));
    const portraitEnd = main.indexOf("/* the volcano that rules an ember world's mid-ground", portraitStart);
    const portraitSeal = createHash('sha256').update(main.slice(portraitStart, portraitEnd)).digest('hex').slice(0, 16);
    expect(worker).toContain(`body sha256/16 ${portraitSeal}`);
  });
});
