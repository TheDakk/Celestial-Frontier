import { describe, expect, it } from 'vitest';
import { _EARTH_NAMES } from '@cf/domain-descriptors';
import {
  EARTH_FAUNA_PROFILES,
  auditEarthFaunaProfiles,
  earthFaunaMedia,
  earthFaunaProfile,
  earthFaunaTemplates,
} from '../src/index.js';

const FAUNA = _EARTH_NAMES.fauna;

describe('the Earth fauna profiles', () => {
  it('there are 88 profiles', () => {
    expect(EARTH_FAUNA_PROFILES.length).toBe(88);
    expect(new Set(EARTH_FAUNA_PROFILES.map((p) => p.id)).size).toBe(88);
  });

  it('every one of the 631 fauna names of _EARTH_NAMES has exactly one profile', () => {
    expect(FAUNA.length).toBe(631);
    expect(auditEarthFaunaProfiles(FAUNA)).toEqual({
      status: 'PASS', species: 631, profiles: 88, missing: [], obsolete: [], duplicates: [],
    });
    // Counted without the audit: each name stands in the names of one profile, once.
    for (const name of FAUNA) {
      const holders = EARTH_FAUNA_PROFILES.filter((p) => p.names.includes(name));
      expect(holders.map((p) => p.names.filter((n) => n === name).length), name).toEqual([1]);
      expect(earthFaunaProfile(name), name).toBe(holders[0]);
    }
    expect(EARTH_FAUNA_PROFILES.reduce((sum, p) => sum + p.names.length, 0)).toBe(631);
  });

  it('the audit reports a missing name, a name no longer in the catalogue and a doubled name, each by itself', () => {
    const first = FAUNA[0]!;
    expect(auditEarthFaunaProfiles([...FAUNA, 'Invented Animal'])).toMatchObject({ status: 'FAIL', missing: ['Invented Animal'], obsolete: [], duplicates: [] });
    expect(auditEarthFaunaProfiles(FAUNA.slice(1))).toMatchObject({ status: 'FAIL', missing: [], obsolete: [first], duplicates: [] });
    expect(auditEarthFaunaProfiles([...FAUNA, first])).toMatchObject({ status: 'FAIL', missing: [], obsolete: [], duplicates: [first] });
  });

  it('the twelve milestone 4 animals have these templates', () => {
    const expected: Record<string, readonly string[]> = {
      'Platypus': ['quadruped'],
      'Civet': ['quadruped'],
      'Brittle Star': ['radial'],
      'Frog': ['hopper'],
      'Pheasant': ['biped-bird'],
      'Oryx': ['quadruped'],
      'Sea Urchin': ['radial'],
      'Prawn': ['crustacean-small'],
      'Harpy Eagle': ['biped-bird'],
      'Capuchin': ['primate'],
      'Polychaete Worm': ['annelid'],
      'Sea Snail': ['gastropod'],
    };
    expect(Object.fromEntries(Object.keys(expected).map((name) => [name, earthFaunaTemplates(name)]))).toEqual(expected);
  });

  it('a name with a template of its own has it after the templates of its profile', () => {
    expect(earthFaunaProfile('Brine Shrimp')?.candidateTemplates).toEqual(['crustacean-small']);
    expect(earthFaunaTemplates('Brine Shrimp')).toEqual(['crustacean-small', 'branchiopod-anostracan']);
    expect(earthFaunaTemplates('Krill')).toEqual(['crustacean-small']);
  });

  it('a name lives in the media of its profile, unless it has media of its own', () => {
    expect(earthFaunaMedia('Platypus')).toEqual(['ground', 'water']);
    expect(earthFaunaProfile('Sea Spider')?.media).toEqual(['ground']);
    expect(earthFaunaMedia('Sea Spider')).toEqual(['water', 'ground']);
    for (const name of FAUNA) expect(earthFaunaMedia(name)?.length, name).toBeGreaterThan(0);
  });

  it('a name that is no Earth animal has no profile, templates or media', () => {
    for (const name of ['Invented Animal', '__proto__', 'constructor', '']) {
      expect(earthFaunaProfile(name), name).toBeUndefined();
      expect(earthFaunaTemplates(name), name).toBeUndefined();
      expect(earthFaunaMedia(name), name).toBeUndefined();
    }
  });

  it('the profiles cannot be changed by a reader', () => {
    expect(Object.isFrozen(EARTH_FAUNA_PROFILES)).toBe(true);
    for (const p of EARTH_FAUNA_PROFILES) {
      expect([p, p.names, p.candidateTemplates, p.media, p.intendedMoves].every(Object.isFrozen), p.id).toBe(true);
    }
    expect(Object.isFrozen(earthFaunaTemplates('Brine Shrimp'))).toBe(true);
    expect(Object.isFrozen(earthFaunaMedia('Sea Spider'))).toBe(true);
  });
});
