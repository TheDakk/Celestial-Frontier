import { describe, expect, it } from 'vitest';
import { EYE_COUNTS, LIMB_COUNTS, PATTERN_NAMES, TIER_SIZE } from '@cf/art-format';
import * as traits from '@cf/domain-speciestraits';
import { guardianFor } from '@cf/domain-genome';
import { BACK_KIND_BY_SKIN } from '../src/requests';
import { EXTREMOPHILE_MOVEMENT, EYELESS_HEAD, GENE_LENGTHS, GUARDIAN_APEX, isGuardianScale, resolveAnatomy, wrap } from '../src/resolve';

const base = { kingdom: 'fauna', body: 0, loco: 0, head: 3, tail: 6, pattern: 7, skin: 7, limbs: 3, eyes: 1, size: 5, color: 13, accent: 2, lumin: true };

describe('resolveAnatomy', () => {
  it('resolves a full fauna genome at Guardian size when it carries the Guardian marker', () => {
    expect(resolveAnatomy({ ...base, apex: 12 })).toEqual({ kingdom: 'fauna', family: 'quadruped', torso: 'sturdy', tier: 'guardian', head: 3, tail: 6, pattern: 7, skin: 7, limbs: 8, eyes: 4, colour: 13, accent: 2, glow: true, swimmer: false, form: 0, floraTable: 'land' });
  });
  it.each([[0, 'quadruped', 'sturdy'], [1, 'quadruped', 'armored'], [2, 'quadruped', 'stilt'], [3, 'tentacled', ''], [4, 'serpent', ''], [5, 'myriapod', ''], [6, 'gastropod', ''], [7, 'membranous', ''], [8, 'crystalline', ''], [9, 'gelatinous', ''], [10, 'quadruped', 'tusked'], [11, 'quadruped', 'horned'], [12, 'arachnid', ''], [13, 'quadruped', 'squat'], [14, 'insect', ''], [15, 'radial', '']])('body %i is %s %s', (body, family, torso) => {
    const a = resolveAnatomy({ ...base, body }); expect([a.family, a.torso]).toEqual([family, torso]);
  });
  it.each([4, 13])('movement %i makes a fish whatever the body', (loco) => {
    for (let body = 0; body < 16; body++) { const a = resolveAnatomy({ ...base, body, loco }); expect([a.family, a.torso, a.swimmer]).toEqual(['fish', '', true]); }
  });
  it('reads limb and eye counts from their tables', () => {
    expect([0, 1, 2, 3, 4, 5].map((v) => resolveAnatomy({ ...base, limbs: v, eyes: v })).map((a) => [a.limbs, a.eyes])).toEqual([[2, 2], [4, 4], [6, 6], [8, 8], [3, 1], [0, 0]]);
  });
  it('maps size genes to tiers unless the genome is a Guardian or Titan', () => {
    expect([0, 2, 4].map((size) => resolveAnatomy({ ...base, size }).tier)).toEqual(['small', 'medium', 'large']);
    expect([0, 2, 4].map((size) => resolveAnatomy({ ...base, size, apex: 13 }).tier)).toEqual(['guardian', 'guardian', 'guardian']);
  });
  it('gives the eyeless head no eyes whatever the eyes gene, drifted head genes included', () => {
    expect(traits.FA_HEAD[EYELESS_HEAD]).toBe('eyeless and smooth');
    expect(traits.FA_HEAD.indexOf('eyeless and smooth')).toBe(EYELESS_HEAD);
    for (const head of [2, 12, -8, 2.7]) {
      expect([0, 1, 2, 3, 4, 5, 9].map((eyes) => resolveAnatomy({ ...base, head, eyes }).eyes), String(head)).toEqual([0, 0, 0, 0, 0, 0, 0]);
      expect(resolveAnatomy({ ...base, head, eyes: 3 }).head).toBe(2);
    }
    for (const head of [0, 1, 3, 9]) expect(resolveAnatomy({ ...base, head, eyes: 3 }).eyes, String(head)).toBe(8);
  });
  it('glow is true only for lumin true', () => {
    expect([true, 1, 'true', undefined].map((lumin) => resolveAnatomy({ ...base, lumin }).glow)).toEqual([true, false, false, false]);
  });
  it('wraps drifted genes', () => { expect([wrap(-1, 7), wrap(1007, 10), wrap(2.9, 6), wrap('x', 6), wrap(undefined, 6)]).toEqual([6, 7, 2, 0, 0]); });
  it('wraps floor-first, and non-finite numbers give 0', () => {
    expect([wrap(-2, 6), wrap(NaN, 6), wrap(Infinity, 6), wrap(-Infinity, 6), wrap(null, 6)]).toEqual([4, 0, 0, 0, 0]);
  });
  it('never throws on an empty genome', () => { expect(resolveAnatomy({}).family).toBe('quadruped'); });
  it('treats a missing or unknown kingdom as fauna', () => {
    expect(resolveAnatomy({ ...base, kingdom: 'plasma' }).family).toBe('quadruped');
    expect(resolveAnatomy({ ...base, kingdom: undefined }).kingdom).toBe('fauna');
  });
  it.each([['flora', 18], ['fungi', 9], ['microbe', 12]])('%s resolves its own family with form wrapped to %i', (kingdom, size) => {
    const a = resolveAnatomy({ ...base, kingdom, form: size + 2, loco: 4 });
    expect(a).toEqual({ kingdom, family: kingdom, torso: '', tier: 'large', head: 0, tail: 0, pattern: 0, skin: 0, limbs: 0, eyes: 0, colour: 13, accent: 2, glow: true, swimmer: false, form: 2, floraTable: 'land' });
  });
  it('wraps wild genes into range and never throws', () => {
    const wild: unknown[] = [0, 1, 17, 1000003, -1, -999, 2, -7, 3, 2 ** 40, -(2 ** 40), 1e300, -1e300, 2.5, -2.5, 7.9, 'x', '3', undefined, null, NaN, Infinity, -Infinity, true, {}, []];
    const genes = ['kingdom', 'body', 'loco', 'head', 'tail', 'pattern', 'skin', 'limbs', 'eyes', 'size', 'color', 'accent', 'lumin', 'form'];
    const kingdoms = ['fauna', 'flora', 'fungi', 'microbe', 'other', undefined, 3];
    for (let n = 0; n < 200; n++) {
      const genome: Record<string, unknown> = {};
      genes.forEach((gene, i) => { genome[gene] = wild[(n * 7 + i * 11 + (n >> 3)) % wild.length]; });
      genome['kingdom'] = kingdoms[n % kingdoms.length];
      if (n % 5 === 0) genome['apex'] = 12;
      const a = resolveAnatomy(genome);
      const inRange = (v: number, length: number): boolean => Number.isInteger(v) && v >= 0 && v < length;
      expect(['fauna', 'flora', 'fungi', 'microbe']).toContain(a.kingdom);
      expect(['small', 'medium', 'large', 'guardian']).toContain(a.tier);
      expect(typeof a.family).toBe('string');
      expect(typeof a.torso).toBe('string');
      expect(typeof a.glow).toBe('boolean');
      expect(typeof a.swimmer).toBe('boolean');
      expect(inRange(a.head, 10) && inRange(a.tail, 7) && inRange(a.pattern, 8) && inRange(a.skin, 9)).toBe(true);
      expect(inRange(a.colour, 17) && inRange(a.accent, 17) && inRange(a.form, 18)).toBe(true);
      expect(LIMB_COUNTS as readonly number[]).toContain(a.limbs);
      expect(EYE_COUNTS as readonly number[]).toContain(a.eyes);
    }
  });
});

describe('the resolver is tied to the game tables', () => {
  // Gene -> the @cf/domain-speciestraits table it indexes (accent indexes the colour table, as makeGenome draws it).
  const TABLES: Record<keyof typeof GENE_LENGTHS, readonly unknown[]> = {
    body: traits.FA_BODY, loco: traits.FA_LOCO, head: traits.FA_HEAD, tail: traits.FA_TAIL, pattern: traits.FA_PATTERN,
    skin: traits.FA_SKIN, limbs: traits.FA_LIMBS, eyes: traits.FA_EYES, size: traits.FA_SIZE, color: traits.SP_COLOR,
    accent: traits.SP_COLOR, floraForm: traits.FLORA_FORM, fungiForm: traits.FUNGI_FORM, microbeForm: traits.MICROBE_FORM,
    extremophileLoco: traits.EX_LOCO, aquaticFloraForm: traits.AQ_FLORA_FORM, aerialFloraForm: traits.AIR_FLORA_FORM,
  };
  it('wraps each gene by the fixed length, and that length is the game table\'s', () => {
    expect(GENE_LENGTHS).toEqual({ body: 16, loco: 18, head: 10, tail: 7, pattern: 8, skin: 9, limbs: 6, eyes: 6, size: 6, color: 17, accent: 17, floraForm: 18, fungiForm: 9, microbeForm: 12, extremophileLoco: 9, aquaticFloraForm: 6, aerialFloraForm: 3 });
    for (const gene of Object.keys(GENE_LENGTHS) as (keyof typeof GENE_LENGTHS)[]) expect(TABLES[gene].length, gene).toBe(GENE_LENGTHS[gene]);
  });
  it('reads LIMB_COUNTS and EYE_COUNTS from the same numbers as the game tables', () => {
    expect([...LIMB_COUNTS]).toEqual(traits.FA_LIMBS.map(Number));
    expect([...EYE_COUNTS]).toEqual(traits.FA_EYES.map(Number));
  });
  it('PATTERN_NAMES is the game\'s pattern table', () => {
    expect([...PATTERN_NAMES]).toEqual(traits.FA_PATTERN);
  });
  it('the back-part table follows the game\'s skin table', () => {
    expect(traits.FA_SKIN.map((skin, i) => [skin, BACK_KIND_BY_SKIN[i]])).toEqual([
      ['scaled', 'ridge'], ['furred', 'mane'], ['chitinous', 'carapace'], ['slick and wet', null], ['plated', 'plates'],
      ['warty', 'knobs'], ['feathered', 'plume'], ['translucent', null], ['crystalline', 'crystals'],
    ]);
    expect(BACK_KIND_BY_SKIN).toHaveLength(traits.FA_SKIN.length);
  });
  it('wraps the size gene like every other gene', () => {
    const tiers = [-1, 6, 2.9, '3', NaN, undefined].map((size) => resolveAnatomy({ ...base, size }).tier);
    expect(tiers).toEqual(['large', 'small', 'medium', 'small', 'small', 'small']);
  });
});

describe('isGuardianScale', () => {
  it('is true for both real Guardians the game makes and for a Titan, false for an ordinary or Paragon creature', () => {
    for (const planetSeed of [1757105165, 51464061]) {
      const guardian = guardianFor(planetSeed)!.genome as unknown as Record<string, unknown>;
      expect(isGuardianScale(guardian), String(planetSeed)).toBe(true);
      expect(resolveAnatomy(guardian).tier).toBe('guardian');
      expect(isGuardianScale({ ...guardian, apex: undefined }), String(planetSeed)).toBe(false);
    }
    // A Titan's battle genome, as the game builds it: apex 14 and the Titan's signature id.
    expect(isGuardianScale({ ...base, size: 5, lumin: true, wild: 1, apex: 14, _titan: 'void' })).toBe(true);
    expect(isGuardianScale({ ...base, par: 9 })).toBe(false);
    expect(isGuardianScale({ ...base, size: 5, wild: 1 })).toBe(false);
  });
  it('keeps exactly the apex values the game keeps on loading a save or importing a share code', () => {
    const values: unknown[] = ['12', 12.7, 'x', [], [13], {}, true, NaN, 1e21, 12, 13, 14, 15, 11, 1, 0.5, -3, 0, -0, null, undefined, Infinity, -Infinity, false, '', ' 13 ', '0x0c', 14.999, -12, 4294967308, ['14'], [12, 13]];
    expect(values.map((apex) => isGuardianScale({ ...base, apex }))).toEqual([
      true, true, false, false, true, false, false, false, false, true, true, true, false, false, false, false, false, false, false, false, false, false, false, false, false, true, true, true, false, true, true, false,
    ]);
    for (const apex of values) {
      const g = { ...base, apex };
      expect(isGuardianScale(JSON.parse(JSON.stringify(g))), String(apex)).toBe(isGuardianScale(g));
    }
    expect(isGuardianScale({ ...base, apex: Symbol('apex') })).toBe(false);
  });
  it('agrees with the game\'s sanitizer for every sample value', () => {
    // The game's two lines, re-implemented. SOURCE packages/domain/strays/src/strays.verbatim.js:264
    // (_sanitizeSavedGenome, on loading a save) and packages/domain/combatcore/src/combatcore.verbatim.js:726
    // (normGenome, on importing a share code), identical in both:
    //   if(g.apex!=null){ const a=(+g.apex)|0; if(a>=12 && a<=TIER_MAX) g.apex=a; else delete g.apex; }
    // TIER_MAX = GRADE_TIERS.length-1 (speciestraits.verbatim.js:72). A Guardian is a genome whose apex survives.
    const gameKeeps = (apex: unknown): boolean => {
      if (apex == null) return false;
      const a = (+(apex as number)) | 0;
      return a >= 12 && a <= traits.TIER_MAX;
    };
    const samples: unknown[] = [
      '12', 12.7, 'x', [], [13], {}, true, NaN, 1e21, 12, 13, 14, 15, 11, 1, 0.5, -3, 0, -0, null, undefined,
      Infinity, -Infinity, false, '', ' 13 ', '0x0c', 14.999, 15.5, 11.999, -12, 4294967308, -4294967284, ['14'], [12, 13],
      '1e1', '14abc', 2 ** 31 + 13, -(2 ** 31), Number.MAX_SAFE_INTEGER, 'Infinity',
    ];
    expect(samples.length).toBeGreaterThanOrEqual(25);
    for (const apex of samples) expect(isGuardianScale({ ...base, apex }), String(apex)).toBe(gameKeeps(apex));
  });
  it('tops the band at the game\'s top grade tier', () => {
    expect(GUARDIAN_APEX).toEqual({ lowest: 12, top: 14 });
    expect(GUARDIAN_APEX.top).toBe(traits.TIER_MAX);
    expect(GUARDIAN_APEX.top).toBe(traits.GRADE_TIERS.length - 1);
    expect(traits.GRADE_TIERS).toHaveLength(15);
  });
});

describe('the Guardian tier canvas', () => {
  it('fits both battle stages with at least 16 pixels to spare on each axis', () => {
    const [w, h] = TIER_SIZE.guardian;
    expect([w, h]).toEqual([240, 160]);
    for (const [stageW, stageH] of [[292, 400], [480, 270]] as const) {
      expect(stageW - w, `${stageW}x${stageH}`).toBeGreaterThanOrEqual(16);
      expect(stageH - h, `${stageW}x${stageH}`).toBeGreaterThanOrEqual(16);
    }
  });
});

describe('extremophiles', () => {
  it('classifies every row of the game\'s extremophile movement table, in its order', () => {
    expect(EXTREMOPHILE_MOVEMENT).toHaveLength(traits.EX_LOCO.length);
    EXTREMOPHILE_MOVEMENT.forEach(([name], i) => expect(name, `row ${i}`).toBe(traits.EX_LOCO[i]));
    expect(EXTREMOPHILE_MOVEMENT.map(([, swims]) => swims)).toEqual([false, true, true, false, false, false, false, false, false]);
  });
  it('routes a marked genome by the extremophile table: swimmers to the swimming body, the rest to the body table', () => {
    const x = { ...base, body: 1, x: 1 };
    for (let loco = 0; loco < 9; loco++) {
      const a = resolveAnatomy({ ...x, loco });
      const swims = loco === 1 || loco === 2;
      expect([a.family, a.torso, a.swimmer], `loco ${loco}`).toEqual(swims ? ['fish', '', true] : ['quadruped', 'armored', false]);
    }
  });
  it('wraps a drifted or negative movement gene by the extremophile table\'s length', () => {
    const swims = (loco: unknown, marker: unknown = 1): boolean => resolveAnatomy({ ...base, x: marker, loco }).swimmer;
    expect([10, 10.6, 11, -8, -7].map((loco) => swims(loco))).toEqual([true, true, true, true, true]); // 1, 1, 2, 1, 2
    expect([4, 13, 17, -1, 9, NaN, undefined].map((loco) => swims(loco))).toEqual([false, false, false, false, false, false, false]); // 4, 4, 8, 8, 0, 0, 0
    expect([true, 'yes', 2].map((marker) => swims(1, marker))).toEqual([true, true, true]);
  });
  it('keeps the normal rule without the marker: movement 4 and 13 swim, 1 and 2 do not', () => {
    for (const marker of [undefined, 0, false, '', null, Infinity]) {
      expect([1, 2, 4, 13].map((loco) => resolveAnatomy({ ...base, x: marker, loco }).swimmer), String(marker)).toEqual([false, false, true, true]);
    }
  });
});

describe('flora form tables', () => {
  const flora = { ...base, kingdom: 'flora' };
  it('wraps the form by the sea table for aq, else the air table for af, else the land table', () => {
    const at = (extra: Record<string, unknown>, form: number) => { const a = resolveAnatomy({ ...flora, ...extra, form }); return [a.floraTable, a.form]; };
    const [land, sea, air] = [traits.FLORA_FORM.length, traits.AQ_FLORA_FORM.length, traits.AIR_FLORA_FORM.length];
    expect(at({}, land + 2)).toEqual(['land', 2]);
    expect(at({ aq: 1 }, sea + 2)).toEqual(['aquatic', 2]);
    expect(at({ af: 1 }, air + 2)).toEqual(['aerial', 2]);
    expect(at({ aq: 1, af: 1 }, sea + 4)).toEqual(['aquatic', 4]); // the sea marker is checked first
    expect(at({ aq: 0, af: true }, -1)).toEqual(['aerial', air - 1]);
  });
  it('is land for every other kingdom, markers or not', () => {
    for (const kingdom of ['fauna', 'fungi', 'microbe']) expect(resolveAnatomy({ ...base, kingdom, aq: 1, af: 1 }).floraTable, kingdom).toBe('land');
  });
});
