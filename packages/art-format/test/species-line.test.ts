import { describe, expect, it } from 'vitest';
import { parseCatalogueText } from '@cf/art-format';

const LINE = 'species civet quadruped medium legs=4 eyes=2 iris=3 tail=1';
const civet = (line: string) => parseCatalogueText(`# a pack\n\n${line}\n`).species.get('civet')!;
const thrown = (line: string): string => {
  try { parseCatalogueText(`# a pack\n\n${line}\n`); } catch (e) { return (e as Error).message; }
  return 'no error';
};

describe('a species line: head and template', () => {
  it('a species line with head=0 parses; without the field head is true; head=2 is refused with the line number', () => {
    expect(civet(`${LINE} head=0`).head).toBe(false);
    expect(civet(`${LINE} head=1`).head).toBe(true);
    expect(civet(LINE).head).toBe(true);
    expect(thrown(`${LINE} head=2`)).toBe("line 3: bad head '2'");
    for (const bad of ['', 'no', '-1', '10']) expect(thrown(`${LINE} head=${bad}`), bad).toBe(`line 3: bad head '${bad}'`);
    expect(thrown(`${LINE} head=0 head=1`)).toBe('line 3: bad option head');
  });

  it('template names the species\' template; without the field it is the family name', () => {
    expect(civet(LINE).template).toBe('quadruped');
    expect(civet(LINE.replace('quadruped', 'avian')).template).toBe('avian');
    expect(civet(`${LINE.replace('quadruped', 'avian')} template=biped-bird`).template).toBe('biped-bird');
    expect(civet(LINE.replace('legs=4', 'template=plant legs=4')).template).toBe('plant');
  });

  it('a template that is not a name is refused with the line number', () => {
    for (const bad of ['', 'biped/bird', 'a.b', '__proto__']) expect(thrown(`${LINE} template=${bad}`), bad).toBe(`line 3: bad name ${bad}`);
    expect(thrown(`${LINE} template=plant template=plant`)).toBe('line 3: bad option template');
  });

  it('the whole entry of a line with neither field, and of one with both', () => {
    expect(civet(LINE)).toEqual({ key: 'civet', family: 'quadruped', tier: 'medium', legs: 4, eyes: 2, iris: 3, tail: true, head: true, template: 'quadruped' });
    expect(civet('species civet radial small head=0 legs=0 eyes=1 iris=0 tail=0 template=star'))
      .toEqual({ key: 'civet', family: 'radial', tier: 'small', legs: 0, eyes: 1, iris: 0, tail: false, head: false, template: 'star' });
  });

  it('the four first fields are still each required', () => {
    expect(thrown(`${LINE.replace(' tail=1', '')} head=1 template=x`)).toBe('species civet line 3: missing tail');
  });
});
