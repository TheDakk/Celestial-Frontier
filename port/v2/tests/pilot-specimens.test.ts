import { describe, expect, it } from 'vitest';
import { makeGenome } from '@cf/domain-genome';
import { crossGenome } from '@cf/domain-genetics';
import { speciesVisualKey } from '@cf/art/species-identity';
import {
  getPilotSpecimenV1, PILOT_BODY_PLANS_V1, PILOT_PORTRAIT_SIZES_V1, PILOT_SPECIMENS_V1,
} from '../apps/game/src/pilot-specimens.js';

describe('fixed pilot portrait inputs', () => {
  it('retains eight independently selected identities and all 48 size/mode conditions', () => {
    expect(PILOT_BODY_PLANS_V1).toEqual([
      'quadruped', 'biped', 'avian', 'serpentine', 'arthropod', 'tentacled', 'aquatic', 'flora-fungus',
    ]);
    expect(PILOT_PORTRAIT_SIZES_V1).toEqual([132, 300, 440]);
    expect(PILOT_SPECIMENS_V1.map((row) => [row.id, row.family, row.genome.seed])).toEqual([
      ['wolf', 'quadruped', 792844710], ['kangaroo', 'biped', 4108794714],
      ['eagle-hybrid', 'avian', 427462844], ['serpentine-10', 'serpentine', 10],
      ['dragonfly', 'arthropod', 862555894], ['octopus', 'tentacled', 6160491],
      ['blue-whale', 'aquatic', 2875388574], ['fungus-42', 'flora-fungus', 42],
    ]);
    const conditions = PILOT_SPECIMENS_V1.flatMap((row) => PILOT_PORTRAIT_SIZES_V1.flatMap(
      (size) => ['static', 'animated'].map((mode) => `${row.id}:${size}:${mode}`),
    ));
    expect(new Set(conditions).size).toBe(48);
    expect(getPilotSpecimenV1('unknown')).toBeNull();
  });

  it('uses complete canonical genomes and real ordered hybrid inheritance without anatomy edits', () => {
    for (const [id, name, seed] of [
      ['wolf', 'Wolf', 792844710], ['kangaroo', 'Kangaroo', 4108794714],
      ['dragonfly', 'Dragonfly', 862555894], ['octopus', 'Octopus', 6160491],
      ['blue-whale', 'Blue Whale', 2875388574],
    ] as const) {
      expect(getPilotSpecimenV1(id)?.genome).toEqual({ ...makeGenome(seed, 'fauna', 1), _earthName: name });
    }
    expect(getPilotSpecimenV1('serpentine-10')?.genome).toEqual(makeGenome(10, 'fauna', 1));
    expect(getPilotSpecimenV1('serpentine-10')?.genome).toMatchObject({ body: 4, loco: 15 });
    expect(getPilotSpecimenV1('fungus-42')?.genome).toEqual(makeGenome(42, 'fungi', 1));
    const eagle = { ...makeGenome(3837331972, 'fauna', 1), _earthName: 'Eagle' };
    const alien = makeGenome(133, 'fauna', 1);
    const before = JSON.stringify([eagle, alien]);
    const hybrid = getPilotSpecimenV1('eagle-hybrid')!;
    expect(hybrid.genome).toEqual(crossGenome(eagle, alien));
    expect(hybrid.genome).toMatchObject({
      seed: 427462844, gen: 1, parents: [3837331972, 133],
      _earthBlend: 'Eagle', _earthBlendKingdom: 'fauna', _anchorVal: 0.73,
    });
    expect(JSON.stringify([eagle, alien])).toBe(before);
    expect(hybrid.visualKey).not.toBe(speciesVisualKey(crossGenome(alien, eagle)));
    expect(hybrid.visualKey).not.toBe(speciesVisualKey({ ...hybrid.genome, _earthBlend: undefined }));
  });

  it('freezes full identity and never counts static fallback as completed anatomical animation', () => {
    expect(Object.isFrozen(PILOT_SPECIMENS_V1)).toBe(true);
    for (const row of PILOT_SPECIMENS_V1) {
      expect(Object.isFrozen(row)).toBe(true);
      expect(Object.isFrozen(row.source)).toBe(true);
      expect(Object.isFrozen(row.genome)).toBe(true);
      expect(row.visualKey).toBe(speciesVisualKey(row.genome));
      expect(row.anatomicalAnimation).toBe('incomplete');
      expect(row.staticFallback).toBe(true);
      expect(row.animationLimitation).toContain('Anatomical animation has not been proved');
      expect(() => { (row.genome as { seed: number }).seed = 0; }).toThrow(TypeError);
    }
    const hybrid = getPilotSpecimenV1('eagle-hybrid')!;
    expect(Object.isFrozen(hybrid.genome.parents)).toBe(true);
    expect(Object.isFrozen(hybrid.genome._src)).toBe(true);
    expect(hybrid.source.kind).toBe('hybrid');
    if (hybrid.source.kind === 'hybrid') expect(Object.isFrozen(hybrid.source.left)).toBe(true);
  });
});
