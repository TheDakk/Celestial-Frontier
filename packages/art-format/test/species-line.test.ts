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

describe('a species line: eyeHighlight', () => {
  const PALETTE = 'palette\ncolour 0 000000\ncolour 7 fff1cf';
  const own = (line: string) => parseCatalogueText(`${PALETTE}\n${line}\n`).species.get('civet')!;

  it('eyeHighlight names the palette colour of the species\' own eye highlight; without the field the entry has none', () => {
    expect(own(`${LINE} eyeHighlight=7`).eyeHighlight).toBe(7);
    expect(own(`${LINE} eyeHighlight=0`).eyeHighlight).toBe(0);
    expect(own(LINE.replace('legs=4', 'eyeHighlight=7 legs=4')).eyeHighlight).toBe(7);
    expect('eyeHighlight' in own(LINE)).toBe(false);
    // The colour may be defined after the line, in a palette block of the species' own file.
    expect(parseCatalogueText(`${LINE} eyeHighlight=7\n${PALETTE}\n`).species.get('civet')!.eyeHighlight).toBe(7);
  });

  it('an eyeHighlight that names a colour no palette defines is refused by the species and the colour', () => {
    expect(thrown(`${PALETTE}\n${LINE} eyeHighlight=7`)).toBe('no error');
    for (const missing of [1, 6, 8, 5000]) {
      expect(thrown(`${PALETTE}\n${LINE} eyeHighlight=${missing}`), String(missing)).toBe(`species civet line 6: eyeHighlight colour ${missing} is not defined`);
    }
    // No palette at all defines no colour.
    expect(thrown(`${LINE} eyeHighlight=0`)).toBe('species civet line 3: eyeHighlight colour 0 is not defined');
  });

  it('an eyeHighlight that is no colour index is refused with the line number', () => {
    for (const bad of ['', 'x', '1.5', '7x']) expect(thrown(`${LINE} eyeHighlight=${bad}`), bad).toBe('line 3: expected an integer');
    for (const bad of ['-1', '20000000']) expect(thrown(`${LINE} eyeHighlight=${bad}`), bad).toBe(`line 3: bad colour index ${bad}`);
    expect(thrown(`${LINE} eyeHighlight=7 eyeHighlight=7`)).toBe('line 3: bad option eyeHighlight');
  });
});
