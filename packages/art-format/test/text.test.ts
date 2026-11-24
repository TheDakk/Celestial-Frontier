import { describe, expect, it } from 'vitest';
import { LAYER_NAMES, SKIN_NAMES, formatPart, parseCatalogueText } from '@cf/art-format';
import type { Part } from '@cf/art-format';

const SAMPLE = `# sample catalogue
palette
colour 0 0b1020
colour 1 ffffff
colour 2 eeeeee
colour 3 00ff00
colour 12 000001
colour 13 000002
colour 14 000003
colour 15 000004
ramp emerald 12 13 14 15
outline 0
eye 1
eyeHighlight 2
glow 3

part quadruped/head/h3/medium/v0
frame rest anchor=1,3 attach=eye0:5,2
..1111..
.122221.
12233221
.199991.

scaffold quadruped/sturdy/medium origin=40,30
pose rest
entry torso 0 rest 0 0
entry head 0 rest 0 0
pose strike contact=88,30
entry torso 0 rest 1 0

fallback quadruped quadruped/head/h3/medium/v0
`;

const thrown = (text: string): string => {
  try {
    parseCatalogueText(text);
  } catch (e) {
    return (e as Error).message;
  }
  return 'did not throw';
};

describe('parseCatalogueText', () => {
  it('parses the sample', () => {
    const c = parseCatalogueText(SAMPLE);
    expect(c.parts.size).toBe(1);
    const head = c.parts.get('quadruped/head/h3/medium/v0')!;
    expect(head).toMatchObject({ family: 'quadruped', slot: 'head', kind: 'h3', tier: 'medium', variant: 0 });
    const f = head.frames['rest']!;
    expect([f.w, f.h]).toEqual([8, 4]);
    expect(f.pixels[10]).toBe(2);
    expect(f.pixels[0]).toBe(0);
    expect(f.pixels[8 * 3 + 1]).toBe(1);
    expect(f.pixels[8 * 3 + 2]).toBe(9);
    expect(f.anchor).toEqual([1, 3]);
    expect(f.attach['eye0']).toEqual([5, 2]);
    const s = c.scaffolds.get('quadruped/sturdy/medium')!;
    expect(s).toMatchObject({ family: 'quadruped', tier: 'medium', origin: [40, 30] });
    expect(Object.keys(s.poses)).toEqual(['rest', 'strike']);
    expect(s.poses['strike']!.contact).toEqual([88, 30]);
    expect(s.poses['rest']!.contact).toBeUndefined();
    expect(s.poses['rest']!.entries).toEqual([
      { slot: 'torso', index: 0, frame: 'rest', dx: 0, dy: 0 },
      { slot: 'head', index: 0, frame: 'rest', dx: 0, dy: 0 },
    ]);
    expect([...c.fallbacks]).toEqual([['quadruped/medium', 'quadruped/head/h3/medium/v0']]);
    expect(c.palette).toEqual({ colours: [0x0b1020, 0xffffff, 0xeeeeee, 0x00ff00, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4], ramps: { emerald: [12, 13, 14, 15] }, outline: 0, eye: 1, eyeHighlight: 2, glow: 3 });
  });

  it('reads letters a-f as 10-15 and negative entry offsets', () => {
    const c = parseCatalogueText('part quadruped/tail/t0/small/v1\nframe rest anchor=0,0 attach=a:1,2,b:3,4\naf\n\nscaffold quadruped/sturdy/small origin=0,0\npose rest\nentry tail 0 rest -3 -4\n');
    const f = c.parts.get('quadruped/tail/t0/small/v1')!.frames['rest']!;
    expect(Array.from(f.pixels)).toEqual([10, 15]);
    expect(f.attach).toEqual({ a: [1, 2], b: [3, 4] });
    expect(c.scaffolds.get('quadruped/sturdy/small')!.poses['rest']!.entries[0]).toMatchObject({ dx: -3, dy: -4 });
  });

  it('rejects ragged rows', () => {
    const id = 'quadruped/head/h3/medium/v0';
    expect(thrown(`part ${id}\nframe rest anchor=0,0\n1111\n111\n`)).toBe(`part ${id} frame rest line 4: row width 3 differs from 4`);
  });
  it('rejects an unknown pixel character', () => {
    const id = 'quadruped/head/h3/medium/v0';
    expect(thrown(`part ${id}\nframe rest anchor=0,0\n11\n1x\n`)).toBe(`part ${id} frame rest line 4: unknown pixel character 'x'`);
    expect(thrown(`part ${id}\nframe rest anchor=0,0\n10\n`)).toBe(`part ${id} frame rest line 3: unknown pixel character '0'`);
  });
  it('rejects a frame without an anchor', () => {
    const id = 'quadruped/head/h3/medium/v0';
    expect(thrown(`\npart ${id}\nframe rest\n11\n`)).toBe(`part ${id} frame rest line 3: missing anchor`);
  });
  it('rejects bad part ids', () => {
    expect(thrown('part quadruped/head/h3/medium')).toBe('part quadruped/head/h3/medium: bad id');
    expect(thrown('part quadruped/wing/h3/medium/v0')).toBe('part quadruped/wing/h3/medium/v0: bad id');
    expect(thrown('part quadruped/head/h3/huge/v0')).toBe('part quadruped/head/h3/huge/v0: bad id');
    expect(thrown('part quadruped/head/h3/medium/v-1')).toBe('part quadruped/head/h3/medium/v-1: bad id');
    expect(thrown('part quadruped/head/h3/medium/vx')).toBe('part quadruped/head/h3/medium/vx: bad id');
  });
  it('rejects unknown directives', () => {
    expect(thrown('# c\n\nbogus 1 2')).toBe("line 3: unknown directive 'bogus'");
  });
  it('a ramp, the outline, the eye and the glow may name a colour far past the old limits', () => {
    expect(thrown('palette\ncolour 5000 ffffff\nramp r 5000 5000 5000 5000\noutline 5000\neye 5000\neyeHighlight 5000\nglow 5000')).toBe('did not throw');
  });

  it('takes thousands of colours and refuses only an index that is no colour number at all', () => {
    expect(thrown('palette\ncolour 4095 ffffff')).toBe('did not throw');
    expect(thrown('palette\ncolour 16777216 ffffff')).toBe('palette: more than 16777216 colours');
  });
  it('rejects non-integers and duplicate ids', () => {
    expect(thrown('scaffold quadruped/sturdy/small origin=1.5,2')).toBe('line 1: expected an integer');
    expect(thrown('palette\ncolour x ffffff')).toBe('line 2: expected an integer');
    const p = 'part quadruped/head/h3/medium/v0\nframe rest anchor=0,0\n1\n';
    expect(thrown(`${p}\n${p}`)).toBe('line 5: duplicate id quadruped/head/h3/medium/v0');
    const s = 'scaffold quadruped/sturdy/small origin=0,0\npose rest\n';
    expect(thrown(`${s}${s}`)).toBe('line 3: duplicate id quadruped/sturdy/small');
  });
});

const ID = 'quadruped/head/h3/medium/v0';
const PART = `part ${ID}\nframe rest anchor=0,0\n1\n`;
const SCAF = 'scaffold quadruped/sturdy/small origin=0,0\n';

describe('parseCatalogueText: palette checks', () => {
  it('rejects palette indices below 0 or from 16,777,216 (2 to the 24th) up', () => {
    expect(thrown('palette\ncolour -1 ffffff')).toBe('line 2: bad colour index -1');
    expect(thrown('palette\ncolour 0 ffffff\nramp r 0 0 0 16777216')).toBe('line 3: bad colour index 16777216');
    expect(thrown('palette\noutline -2')).toBe('line 2: bad colour index -2');
    expect(thrown('palette\neye 16777216')).toBe('line 2: bad colour index 16777216');
    expect(thrown('palette\neyeHighlight 20000000')).toBe('line 2: bad colour index 20000000');
    expect(thrown('palette\nglow -1')).toBe('line 2: bad colour index -1');
  });
  it('rejects a colour used but not defined', () => {
    expect(thrown('palette\ncolour 0 ffffff\noutline 5')).toBe('palette: colour 5 used but not defined');
    expect(thrown('palette\ncolour 0 ffffff\nramp r 0 0 0 7')).toBe('palette: colour 7 used but not defined');
    expect(thrown('palette\ncolour 0 ffffff\ncolour 2 ffffff\noutline 2')).toBe('did not throw');
  });
  it('rejects duplicate colours and ramps', () => {
    expect(thrown('palette\ncolour 0 ffffff\ncolour 0 000000')).toBe('line 3: duplicate colour 0');
    expect(thrown('palette\ncolour 0 ffffff\nramp r 0 0 0 0\nramp r 0 0 0 0')).toBe('line 4: duplicate ramp r');
  });
});

describe('parseCatalogueText: structure checks', () => {
  it('rejects duplicate frames and poses', () => {
    expect(thrown(`part ${ID}\nframe rest anchor=0,0\n1\n\nframe rest anchor=0,0\n1\n`)).toBe(`part ${ID} frame rest line 5: duplicate frame`);
    expect(thrown(`${SCAF}pose rest\npose rest\n`)).toBe('scaffold quadruped/sturdy/small pose rest line 3: duplicate pose');
  });
  it('rejects empty frames, parts and scaffolds', () => {
    expect(thrown(`part ${ID}\nframe rest anchor=0,0\n\nframe b anchor=0,0\n1\n`)).toBe(`part ${ID} frame rest line 2: frame has no rows`);
    expect(thrown(`part ${ID}\n`)).toBe(`part ${ID}: no frames`);
    expect(thrown(SCAF)).toBe('scaffold quadruped/sturdy/small: no poses');
  });
  it('rejects unknown and repeated options', () => {
    expect(thrown(`part ${ID}\nframe rest anchor=0,0 colour=3\n1\n`)).toBe('line 2: bad option colour');
    expect(thrown(`part ${ID}\nframe rest anchor=0,0 anchor=1,1\n1\n`)).toBe('line 2: bad option anchor');
    expect(thrown('scaffold quadruped/sturdy/small origin=0,0 contact=1,1')).toBe('line 1: bad option contact');
    expect(thrown(`${SCAF}pose rest origin=1,1\n`)).toBe('line 2: bad option origin');
  });
  it('rejects duplicate attach names and fallbacks', () => {
    expect(thrown(`part ${ID}\nframe rest anchor=0,0 attach=a:1,1,a:2,2\n1\n`)).toBe('line 2: duplicate attach a');
    expect(thrown('fallback quadruped a/b\nfallback quadruped c/d')).toBe('line 1: bad fallback part id a/b');
  });
  it('rejects variants with a leading zero', () => {
    expect(thrown('part quadruped/head/h3/medium/v01')).toBe('part quadruped/head/h3/medium/v01: bad id');
    expect(parseCatalogueText('part quadruped/head/h3/medium/v10\nframe a anchor=0,0\n1\n').parts.size).toBe(1);
  });
  it('rejects bad names and never reads inherited keys', () => {
    expect(thrown(`part ${ID}\nframe a.b anchor=0,0\n1\n`)).toBe('line 2: bad name a.b');
    expect(thrown(`part ${ID}\nframe __proto__ anchor=0,0\n1\n`)).toBe('line 2: bad name __proto__');
    expect(thrown(`part ${ID}\nframe constructor anchor=0,0\n1\n`)).toBe('line 2: bad name constructor');
    expect(thrown(`part ${ID}\nframe prototype anchor=0,0\n1\n`)).toBe('line 2: bad name prototype');
    expect(thrown(`part ${ID}\nframe a anchor=0,0 attach=__proto__:1,1\n1\n`)).toBe('line 2: bad name __proto__');
    expect(thrown(`${SCAF}pose p!\n`)).toBe('line 2: bad name p!');
    expect(thrown('palette\ncolour 0 ffffff\nramp __proto__ 0 0 0 0')).toBe('line 3: bad name __proto__');
    expect(thrown('fallback a/b x')).toBe('line 1: bad name a/b');
    const c = parseCatalogueText(`${PART}\n${SCAF}pose toString\nentry torso 0 rest 0 0\n`);
    expect(c.parts.get(ID)!.frames['hasOwnProperty']).toBeUndefined();
    expect(c.scaffolds.get('quadruped/sturdy/small')!.poses['valueOf']).toBeUndefined();
    expect(c.scaffolds.get('quadruped/sturdy/small')!.poses['toString']).toBeDefined();
  });
  it('rejects a pixel row outside a frame', () => {
    expect(thrown(`part ${ID}\nframe rest anchor=0,0\n11\n\n11\n`)).toBe('line 5: pixel row outside a frame');
    expect(thrown('1a.')).toBe('line 1: pixel row outside a frame');
    expect(thrown('bogus')).toBe("line 1: unknown directive 'bogus'");
  });
  it('rejects entry indexes outside 0..7', () => {
    const e = (i: string): string => thrown(`${SCAF}pose rest\nentry torso ${i} rest 0 0\n`);
    expect(e('8')).toBe('line 3: bad entry index 8');
    expect(e('-1')).toBe('line 3: bad entry index -1');
    expect(e('x')).toBe('line 3: bad entry index x');
    expect(e('7')).toBe('did not throw');
  });
  it('does not bounds-check anchors or attach points', () => {
    const f = parseCatalogueText(`part ${ID}\nframe rest anchor=-5,99 attach=eye0:40,-3\n1\n`).parts.get(ID)!.frames['rest']!;
    expect(f.anchor).toEqual([-5, 99]);
    expect(f.attach['eye0']).toEqual([40, -3]);
  });
});

describe('parseCatalogueText: stricter checks', () => {
  it('rejects the outline value g in a part frame', () => {
    expect(thrown(`part ${ID}\nframe rest anchor=0,0\n11\n1g\n`)).toBe(`part ${ID} frame rest line 4: outline value is written by the composer`);
  });
  it.each(['h', 'i', 'j', 'k'])('rejects %s in a part row', (c) => {
    expect(thrown(`part ${ID}\nframe rest anchor=0,0\n11\n1${c}\n`)).toBe(`part ${ID} frame rest line 4: iris value is written by the composer`);
  });
  it('rejects a second entry for the same slot and index in one pose, but not in another pose', () => {
    expect(thrown(`${SCAF}pose rest\nentry head 0 rest 0 0\nentry head 1 rest 0 0\nentry head 0 bite 1 1\n`))
      .toBe('scaffold quadruped/sturdy/small pose rest line 5: duplicate entry head 0');
    expect(thrown(`${SCAF}pose rest\nentry head 0 rest 0 0\npose strike\nentry head 0 rest 1 0\n`)).toBe('did not throw');
  });
  it('reads legs=2 on an entry', () => {
    const c = parseCatalogueText(`${SCAF}pose rest\nentry torso 0 rest 0 0 legs=2\n`);
    expect(c.scaffolds.get('quadruped/sturdy/small')!.poses['rest']!.entries).toEqual([{ slot: 'torso', index: 0, frame: 'rest', dx: 0, dy: 0, legs: 2 }]);
  });
  it('an entry without legs has no legs key', () => {
    const c = parseCatalogueText(`${SCAF}pose rest\nentry torso 0 rest 0 0\n`);
    expect('legs' in c.scaffolds.get('quadruped/sturdy/small')!.poses['rest']!.entries[0]!).toBe(false);
  });
  it('accepts the same slot and index at two leg counts and with none', () => {
    const c = parseCatalogueText(`${SCAF}pose rest\nentry torso 0 rest 0 0\nentry torso 0 rest 1 0 legs=2\nentry torso 0 rest 2 0 legs=4\n`);
    expect(c.scaffolds.get('quadruped/sturdy/small')!.poses['rest']!.entries.map((e) => e.legs)).toEqual([undefined, 2, 4]);
  });
  it('rejects the same slot, index and legs twice', () => {
    expect(thrown(`${SCAF}pose rest\nentry torso 0 rest 0 0 legs=2\nentry torso 0 rest 1 0 legs=2\n`))
      .toBe('scaffold quadruped/sturdy/small pose rest line 4: duplicate entry torso 0');
  });
  it('rejects legs=5, legs=x and a seventh field', () => {
    expect(thrown(`${SCAF}pose rest\nentry torso 0 rest 0 0 legs=5\n`)).toBe("line 3: bad legs '5'");
    expect(thrown(`${SCAF}pose rest\nentry torso 0 rest 0 0 legs=x\n`)).toBe("line 3: bad legs 'x'");
    expect(thrown(`${SCAF}pose rest\nentry torso 0 rest 0 0 legs=2 more\n`)).toBe('line 3: bad entry');
    expect(thrown(`${SCAF}pose rest\nentry torso 0 rest 0 0 foo=2\n`)).toBe('line 3: bad entry');
  });
  it('reads eyes=4 on an eyes entry; an entry without it has no eyes key', () => {
    const c = parseCatalogueText(`${SCAF}pose rest\nentry eyes 0 small 1 -1 eyes=4\nentry eyes 1 rest 0 0\n`);
    const entries = c.scaffolds.get('quadruped/sturdy/small')!.poses['rest']!.entries;
    expect(entries).toEqual([{ slot: 'eyes', index: 0, frame: 'small', dx: 1, dy: -1, eyes: 4 }, { slot: 'eyes', index: 1, frame: 'rest', dx: 0, dy: 0 }]);
    expect('eyes' in entries[1]!).toBe(false);
  });
  it('accepts the same eye index at every eye count, at a leg count and with neither', () => {
    const c = parseCatalogueText(`${SCAF}pose rest\nentry eyes 0 rest 0 0\n${[0, 1, 2, 4, 6, 8].map((n) => `entry eyes 0 rest 0 0 eyes=${n}\n`).join('')}entry eyes 0 rest 0 0 legs=2\n`);
    expect(c.scaffolds.get('quadruped/sturdy/small')!.poses['rest']!.entries.map((e) => [e.eyes, e.legs]))
      .toEqual([[undefined, undefined], [0, undefined], [1, undefined], [2, undefined], [4, undefined], [6, undefined], [8, undefined], [undefined, 2]]);
  });
  it('rejects the same eye index and eye count twice', () => {
    expect(thrown(`${SCAF}pose rest\nentry eyes 0 rest 0 0 eyes=4\nentry eyes 0 small 1 0 eyes=4\n`))
      .toBe('scaffold quadruped/sturdy/small pose rest line 4: duplicate entry eyes 0');
  });
  it('rejects eyes=3, eyes=x, eyes= beside legs=, and eyes= on an entry of another slot', () => {
    expect(thrown(`${SCAF}pose rest\nentry eyes 0 rest 0 0 eyes=3\n`)).toBe("line 3: bad eyes '3'");
    expect(thrown(`${SCAF}pose rest\nentry eyes 0 rest 0 0 eyes=x\n`)).toBe("line 3: bad eyes 'x'");
    expect(thrown(`${SCAF}pose rest\nentry eyes 0 rest 0 0 eyes=4 legs=2\n`)).toBe('line 3: bad entry');
    expect(thrown(`${SCAF}pose rest\nentry head 0 rest 0 0 eyes=4\n`)).toBe("line 3: eyes= on slot 'head': only an eyes entry takes an eye count");
    expect(thrown(`${SCAF}pose rest\nentry nose 0 rest 0 0 eyes=4\n`)).toBe("line 3: unknown slot 'nose'");
    expect(thrown(`${SCAF}pose rest\nentry eyes 0 rest 0 0 eyes=4\nentry head 0 rest 0 0 legs=2\n`)).toBe('did not throw');
  });
  it('rejects a fallback naming a part that is missing by the end, or that has no rest frame', () => {
    expect(thrown(`${PART}\nfallback quadruped quadruped/torso/none/medium/v0\n`)).toBe('fallback quadruped medium: part quadruped/torso/none/medium/v0 missing or has no rest frame');
    expect(thrown(`part ${ID}\nframe wave anchor=0,0\n1\n\nfallback quadruped ${ID}\n`)).toBe(`fallback quadruped medium: part ${ID} missing or has no rest frame`);
    // The part may come after the fallback line: the check runs once parsing is done.
    expect(thrown(`fallback quadruped ${ID}\n${PART}`)).toBe('did not throw');
  });
});

describe('parseCatalogueText: one fallback per family and tier', () => {
  const part = (tier: string): string => `part quadruped/torso/fb/${tier}/v0\nframe rest anchor=0,0\n1\n\n`;
  it('keys each fallback by its family and the tier segment of its part id', () => {
    const c = parseCatalogueText(`${part('small')}${part('large')}fallback quadruped quadruped/torso/fb/small/v0\nfallback quadruped quadruped/torso/fb/large/v0\nfallback fish quadruped/torso/fb/small/v0\n`);
    expect([...c.fallbacks]).toEqual([
      ['quadruped/small', 'quadruped/torso/fb/small/v0'], ['quadruped/large', 'quadruped/torso/fb/large/v0'], ['fish/small', 'quadruped/torso/fb/small/v0'],
    ]);
  });
  it('rejects a second fallback for the same family and tier, and a part id with no tier', () => {
    expect(thrown(`${part('small')}${part('large')}fallback quadruped quadruped/torso/fb/small/v0\nfallback quadruped quadruped/torso/fb/large/v0\nfallback quadruped quadruped/torso/fb/small/v0\n`))
      .toBe('line 11: duplicate fallback quadruped small');
    expect(thrown('fallback quadruped quadruped/torso/fb/huge/v0')).toBe('line 1: bad fallback part id quadruped/torso/fb/huge/v0');
  });
});

describe('parseCatalogueText: errors from the first version', () => {
  it('rejects directives out of place', () => {
    expect(thrown('frame rest anchor=0,0')).toBe('line 1: frame outside a part');
    expect(thrown('pose rest')).toBe('line 1: pose outside a scaffold');
    expect(thrown(`${SCAF}entry torso 0 rest 0 0`)).toBe('line 2: entry outside a pose');
    expect(thrown('ramp r 0 0 0 0')).toBe('line 1: ramp outside a palette');
    expect(thrown('glow 1')).toBe('line 1: glow outside a palette');
  });
  it('rejects an unknown slot', () => {
    expect(thrown(`${SCAF}pose rest\nentry wing 0 rest 0 0`)).toBe("line 3: unknown slot 'wing'");
  });
  it('parses parts and pose entries in the three new slots', () => {
    const slots = ['farWings', 'bodyFeature', 'nearWings'] as const;
    const c = parseCatalogueText(
      slots.map((slot) => `part quadruped/${slot}/k/small/v0\nframe rest anchor=0,0\n1\n`).join('\n')
      + `\n${SCAF}pose rest\n${slots.map((slot) => `entry ${slot} 1 rest 2 -1`).join('\n')}\n`,
    );
    for (const slot of slots) expect(c.parts.get(`quadruped/${slot}/k/small/v0`)).toMatchObject({ family: 'quadruped', slot, kind: 'k', tier: 'small', variant: 0 });
    expect(c.scaffolds.get('quadruped/sturdy/small')!.poses['rest']!.entries).toEqual(slots.map((slot) => ({ slot, index: 1, frame: 'rest', dx: 2, dy: -1 })));
  });
  it('rejects a bad colour hex', () => {
    expect(thrown('palette\ncolour 0 12345')).toBe('line 2: bad colour');
    expect(thrown('palette\ncolour 0 zzzzzz')).toBe('line 2: bad colour');
  });
  it('rejects a wrong argument count', () => {
    expect(thrown('palette\ncolour 0')).toBe('line 2: bad colour');
    expect(thrown(`${SCAF}pose rest\nentry torso 0 rest 0`)).toBe('line 3: bad entry');
    expect(thrown('fallback quadruped')).toBe('line 1: bad fallback');
    expect(thrown('palette\noutline 1 2')).toBe('line 2: bad outline');
    expect(thrown(`part ${ID} extra`)).toBe('line 1: bad part');
  });
  it('rejects a bad scaffold id and a missing origin', () => {
    expect(thrown('scaffold quadruped/sturdy origin=0,0')).toBe('scaffold quadruped/sturdy: bad id');
    expect(thrown('scaffold quadruped/sturdy/huge origin=0,0')).toBe('scaffold quadruped/sturdy/huge: bad id');
    expect(thrown('scaffold quadruped/sturdy/small')).toBe('scaffold quadruped/sturdy/small line 1: missing origin');
  });
});

describe('formatPart', () => {
  it('round-trips with the parser', () => {
    const p: Part = {
      id: 'quadruped/head/h3/medium/v0', family: 'quadruped', slot: 'head', tier: 'medium', kind: 'h3', variant: 0,
      frames: {
        rest: { w: 3, h: 2, pixels: Uint8Array.from([0, 1, 15, 10, 9, 0]), anchor: [1, 1], attach: { eye0: [2, 0], eye1: [0, 1] } },
        bite: { w: 2, h: 1, pixels: Uint8Array.from([5, 6]), anchor: [0, 0], attach: {} },
      },
    };
    const c = parseCatalogueText(`${formatPart(p)}\n${formatPart({ ...p, id: 'quadruped/head/h3/medium/v1', variant: 1 })}`);
    expect(c.parts.get(p.id)).toEqual(p);
    expect(Object.keys(c.parts.get(p.id)!.frames)).toEqual(['rest', 'bite']);
  });

  it('refuses a part it cannot write back', () => {
    const f = { w: 2, h: 1, pixels: Uint8Array.from([1, 1]), anchor: [0, 0] as const, attach: {} };
    const base: Part = { id: 'quadruped/head/h3/medium/v0', family: 'quadruped', slot: 'head', tier: 'medium', kind: 'h3', variant: 0, frames: { rest: f } };
    expect(() => formatPart({ ...base, frames: { rest: { ...f, pixels: Uint8Array.from([1]) } } })).toThrow('part quadruped/head/h3/medium/v0: cannot format: frame rest has 1 pixels, expected 2');
    expect(() => formatPart({ ...base, frames: { 'a b': f } })).toThrow('part quadruped/head/h3/medium/v0: cannot format: frame name a b is not a valid name');
    expect(() => formatPart({ ...base, frames: { rest: { ...f, attach: { 'x:y': [0, 0] } } } })).toThrow('part quadruped/head/h3/medium/v0: cannot format: attach name x:y is not a valid name');
  });

  it('refuses a part with no frames or a zero-size frame', () => {
    const f = { w: 2, h: 1, pixels: Uint8Array.from([1, 1]), anchor: [0, 0] as const, attach: {} };
    const base: Part = { id: 'quadruped/head/h3/medium/v0', family: 'quadruped', slot: 'head', tier: 'medium', kind: 'h3', variant: 0, frames: { rest: f } };
    expect(formatPart(base)).toContain('frame rest');
    expect(() => formatPart({ ...base, frames: {} })).toThrow('part quadruped/head/h3/medium/v0: cannot format: it has no frames');
    expect(() => formatPart({ ...base, frames: { rest: { ...f, w: 0, pixels: new Uint8Array(0) } } })).toThrow('part quadruped/head/h3/medium/v0: cannot format: frame rest is 0x1, which has no pixels');
    expect(() => formatPart({ ...base, frames: { rest: { ...f, h: 0, pixels: new Uint8Array(0) } } })).toThrow('part quadruped/head/h3/medium/v0: cannot format: frame rest is 2x0, which has no pixels');
  });

  it('refuses a frame holding the outline value, which the parser would reject', () => {
    const base: Part = { id: 'quadruped/head/h3/medium/v0', family: 'quadruped', slot: 'head', tier: 'medium', kind: 'h3', variant: 0,
      frames: { rest: { w: 2, h: 1, pixels: Uint8Array.from([1, 16]), anchor: [0, 0], attach: {} } } };
    expect(() => formatPart(base)).toThrow('part quadruped/head/h3/medium/v0: cannot format: frame rest holds the outline value, which only the composer writes');
  });
});

describe('iris values', () => {
  it('formatPart refuses a frame holding 17', () => {
    const base: Part = { id: 'quadruped/head/h3/medium/v0', family: 'quadruped', slot: 'head', tier: 'medium', kind: 'h3', variant: 0,
      frames: { rest: { w: 2, h: 1, pixels: Uint8Array.from([1, 17]), anchor: [0, 0], attach: {} } } };
    expect(() => formatPart(base)).toThrow('part quadruped/head/h3/medium/v0: cannot format: frame rest holds an iris value, which only the composer writes');
  });
});

describe('layers', () => {
  const PID = 'quadruped/torso/t1/medium/v0';
  const head = `part ${PID}\n`;
  const parse = (body: string) => parseCatalogueText(head + body).parts.get(PID)!;
  const err = (body: string): string => {
    try { parseCatalogueText(head + body); } catch (e) { return (e as Error).message; }
    return 'no error';
  };
  const F = 'frame rest anchor=0,0\n123\n45.\n';

  it("parses flow, spots and a pattern layer after a frame's rows", () => {
    const f = parse(`${F}layer flow\n123\n45.\nlayer spots\n...\n.1.\nlayer striped\n1.2\n..c\n`).frames.rest!;
    expect(f.layers!.flow).toEqual(Uint8Array.from([1, 2, 3, 4, 5, 0]));
    expect(Object.keys(f.layers!)).toEqual(['flow', 'spots', 'striped']);
    expect(f.pixels).toEqual(Uint8Array.from([1, 2, 3, 4, 5, 0]));
  });

  it('reads f as 15 in a guide layer and c as 12 in a pattern layer', () => {
    const f = parse(`${F}layer spots\nf..\n...\nlayer banded\nc..\n...\n`).frames.rest!;
    expect(f.layers!.spots![0]).toBe(15);
    expect(f.layers!.banded![0]).toBe(12);
  });

  it('a frame without layers has no layers key', () => {
    expect(Object.hasOwn(parse(F).frames.rest!, 'layers')).toBe(false);
  });

  it('a second frame may follow a layered frame after an empty line', () => {
    const p = parse(`${F}layer flow\n123\n456\n\nframe bite anchor=0,0\n12\n`);
    expect(Object.keys(p.frames)).toEqual(['rest', 'bite']);
    expect(p.frames.rest!.layers!.flow).toBeDefined();
    expect(Object.hasOwn(p.frames.bite!, 'layers')).toBe(false);
    expect(p.frames.bite!.pixels).toEqual(Uint8Array.from([1, 2]));
  });

  it('a directive ends the layer and the next frame', () => {
    const p = parse(`${F}layer flow\n123\n456\nframe bite anchor=0,0\n12\n`);
    expect(Object.keys(p.frames)).toEqual(['rest', 'bite']);
  });

  it('rejects bad layers with exact messages', () => {
    const w = 'part quadruped/torso/t1/medium/v0 frame rest line';
    expect(err('layer flow\n123\n')).toBe('line 2: layer outside a frame');
    expect(err('frame rest anchor=0,0\nlayer flow\n')).toBe('line 3: layer outside a frame');
    expect(err(`${F}layer glow\n123\n456\n`)).toBe(`${w} 5: unknown layer 'glow'`);
    expect(err(`${F}layer flow\n123\n456\nlayer flow\n`)).toBe(`${w} 8: duplicate layer flow`);
    expect(err(`${F}layer striped\n1d3\n456\n`)).toBe(`${w} 6: bad layer value 'd'`);
    expect(err(`${F}layer flow\n12g\n456\n`)).toBe(`${w} 6: bad layer value 'g'`);
    expect(err(`${F}layer flow\n12\n456\n`)).toBe(`${w} 6: layer flow row width 2 differs from 3`);
    expect(err(`${F}layer flow\n123\n`)).toBe(`${w} 5: layer flow has 1 rows, frame has 2`);
    expect(err(`${F}layer flow\n123\n456\n789\n`)).toBe(`${w} 5: layer flow has 3 rows, frame has 2`);
  });

  it('parses a scaled and a translucent layer', () => {
    const p = parse(`${F}layer translucent\n.3.\n4..\nlayer scaled\n1.2\n..c\n`);
    const f = p.frames.rest!;
    expect(Object.keys(f.layers!)).toEqual(['scaled', 'translucent']);
    expect(f.layers!.scaled).toEqual(Uint8Array.from([1, 0, 2, 0, 0, 12]));
    expect(f.layers!.translucent).toEqual(Uint8Array.from([0, 3, 0, 4, 0, 0]));
    expect(parseCatalogueText(formatPart(p)).parts.get(PID)).toEqual(p);
  });

  it('rejects d in a skin layer', () => {
    const w = 'part quadruped/torso/t1/medium/v0 frame rest line';
    expect(err(`${F}layer furred\n1d3\n456\n`)).toBe(`${w} 6: bad layer value 'd'`);
    expect(err(`${F}layer crystalline\n123\n45f\n`)).toBe(`${w} 7: bad layer value 'f'`);
  });

  it('LAYER_NAMES ends with the nine skin names', () => {
    expect(SKIN_NAMES).toEqual(['scaled', 'furred', 'chitinous', 'slick', 'plated', 'warty', 'feathered', 'translucent', 'crystalline']);
    expect(LAYER_NAMES.slice(-9)).toEqual([...SKIN_NAMES]);
    expect(LAYER_NAMES.length).toBe(18);
  });

  it('a layer followed at once by another has no rows', () => {
    const w = 'part quadruped/torso/t1/medium/v0 frame rest line';
    expect(err(`${F}layer flow\nlayer spots\n...\n.1.\n`)).toBe(`${w} 5: layer flow has 0 rows, frame has 2`);
  });

  it('a layer line with no name or with two names is a bad layer', () => {
    expect(err(`${F}layer\n123\n456\n`)).toBe('line 5: bad layer');
    expect(err(`${F}layer flow spots\n123\n456\n`)).toBe('line 5: bad layer');
  });

  it('layers written out of order parse and format in LAYER_NAMES order', () => {
    const p = parse(`${F}layer striped\n1.2\n..c\nlayer spots\n...\n.1.\nlayer flow\n123\n45.\n`);
    expect(Object.keys(p.frames.rest!.layers!)).toEqual(['flow', 'spots', 'striped']);
    const text = formatPart(p);
    expect(text.split('\n').filter((l) => l.startsWith('layer '))).toEqual(['layer flow', 'layer spots', 'layer striped']);
    expect(parseCatalogueText(text).parts.get(PID)).toEqual(p);
    // A part built in code with its layer keys out of order is written in LAYER_NAMES order too.
    const built: Part = { ...p, frames: { rest: { ...p.frames.rest!, layers: { striped: p.frames.rest!.layers!.striped!, spots: p.frames.rest!.layers!.spots!, flow: p.frames.rest!.layers!.flow! } } } };
    expect(Object.keys(built.frames.rest!.layers!)).toEqual(['striped', 'spots', 'flow']);
    expect(formatPart(built)).toBe(text);
  });

  const base: Part = { id: PID, family: 'quadruped', slot: 'torso', tier: 'medium', kind: 't1', variant: 0, frames: {} };
  const withLayers = (layers: Record<string, Uint8Array>): Part => ({
    ...base,
    frames: { rest: { w: 3, h: 2, pixels: Uint8Array.from([1, 2, 3, 4, 5, 0]), anchor: [0, 0], attach: {}, layers } },
  });

  it('formatPart round-trips a part with layers', () => {
    const p = withLayers({ flow: Uint8Array.from([1, 2, 3, 4, 5, 0]), spots: Uint8Array.from([0, 15, 0, 0, 0, 0]), 'eye-spotted': Uint8Array.from([12, 0, 0, 0, 0, 1]) });
    const text = formatPart(p);
    expect(text.indexOf('layer flow')).toBeLessThan(text.indexOf('layer spots'));
    expect(text.indexOf('layer spots')).toBeLessThan(text.indexOf('layer eye-spotted'));
    expect(parseCatalogueText(text).parts.get(PID)).toEqual(p);
  });

  it('formatPart refuses a layer of the wrong length or with a value out of range', () => {
    const pre = `part ${PID}: cannot format: frame rest layer`;
    expect(() => formatPart(withLayers({ flow: Uint8Array.from([1, 2]) }))).toThrow(`${pre} flow has 2 pixels, expected 6`);
    expect(() => formatPart(withLayers({ striped: Uint8Array.from([0, 0, 13, 0, 0, 0]) }))).toThrow(`${pre} striped holds a value above 12`);
    expect(() => formatPart(withLayers({ flow: Uint8Array.from([0, 0, 16, 0, 0, 0]) }))).toThrow(`${pre} flow holds a value above 15`);
    expect(() => formatPart(withLayers({ glow: new Uint8Array(6) }))).toThrow('has an unknown layer glow');
  });
});

describe('parseCatalogueText: species lines', () => {
  const LINE = 'species civet quadruped medium legs=4 eyes=2 iris=3 tail=1';

  it('parses a species line to its entry, its fields in any order', () => {
    const c = parseCatalogueText(`${LINE}\nspecies molerat2 serpent small tail=0 iris=7 eyes=0 legs=0\n`);
    expect([...c.species]).toEqual([
      ['civet', { key: 'civet', family: 'quadruped', tier: 'medium', legs: 4, eyes: 2, iris: 3, tail: true }],
      ['molerat2', { key: 'molerat2', family: 'serpent', tier: 'small', legs: 0, eyes: 0, iris: 7, tail: false }],
    ]);
  });

  it('a catalogue with no species line has an empty map', () => {
    expect(parseCatalogueText(SAMPLE).species.size).toBe(0);
  });

  it('a species line ends the part before it', () => {
    const c = parseCatalogueText(`${PART}${LINE}\n`);
    expect(c.parts.get(ID)!.frames['rest']!.h).toBe(1);
    expect(c.species.has('civet')).toBe(true);
  });

  it('rejects a bad key, the key body, a bad family and a bad tier', () => {
    expect(thrown(LINE.replace('civet', 'Civet'))).toBe("line 1: bad species key 'Civet'");
    expect(thrown(LINE.replace('civet', '2civet'))).toBe("line 1: bad species key '2civet'");
    expect(thrown(LINE.replace('civet', 'civet_x'))).toBe("line 1: bad species key 'civet_x'");
    // Letters and digits only, starting with a letter: no hyphen anywhere.
    for (const key of ['civet-cat', 'civet-', 'civet-accent', 'a--b']) expect(thrown(LINE.replace('civet', key)), key).toBe(`line 1: bad species key '${key}'`);
    for (const key of ['civet', 'civet2', 'c', 'h', 'iris', 'legs', 'eyes', 'bones']) expect(thrown(LINE.replace('civet', key)), key).toBe('did not throw');
    expect(thrown(LINE.replace('quadruped', 'quad/ruped'))).toBe('line 1: bad name quad/ruped');
    expect(thrown(LINE.replace('medium', 'huge'))).toBe("line 1: bad tier 'huge'");
    expect(thrown('species civet quadruped')).toBe('line 1: bad species');
  });

  it('rejects a key that is a name the generated creatures use: a kind, a torso type or a ramp', () => {
    for (const key of ['body', 'leg', 'fore', 'hind', 'mid', 'eye', 'bone', 'h0', 'h3', 'h12', 't0', 't6', 't10', 'c0', 'c16', 'c123', 'iris0', 'iris7', 'iris12']) {
      expect(thrown(LINE.replace('civet', key)), key).toBe(`line 1: species key '${key}' is a name the generated creatures use`);
    }
  });

  it('rejects an unknown field, a repeated one and a missing one', () => {
    expect(thrown(`${LINE} wings=2`)).toBe('line 1: bad option wings');
    expect(thrown(`${LINE} legs=4`)).toBe('line 1: bad option legs');
    expect(thrown(`${LINE} tail`)).toBe("line 1: bad option 'tail'");
    for (const field of ['legs=4', 'eyes=2', 'iris=3', 'tail=1']) {
      expect(thrown(LINE.replace(` ${field}`, '')), field).toBe(`species civet line 1: missing ${field.slice(0, field.indexOf('='))}`);
    }
  });

  it('rejects a bad value in each field', () => {
    expect(thrown(LINE.replace('legs=4', 'legs=5'))).toBe("line 1: bad legs '5'");
    expect(thrown(LINE.replace('legs=4', 'legs=x'))).toBe("line 1: bad legs 'x'");
    expect(thrown(LINE.replace('eyes=2', 'eyes=3'))).toBe("line 1: bad eyes '3'");
    expect(thrown(LINE.replace('iris=3', 'iris=11'))).toBe("line 1: bad iris '11'");
    expect(thrown(LINE.replace('iris=3', 'iris=-1'))).toBe("line 1: bad iris '-1'");
    expect(thrown(LINE.replace('tail=1', 'tail=2'))).toBe("line 1: bad tail '2'");
    expect(thrown(LINE.replace('tail=1', 'tail=yes'))).toBe("line 1: bad tail 'yes'");
    // Every leg count, eye count and iris ramp number is accepted.
    for (const legs of [0, 2, 3, 4, 6, 8]) expect(thrown(LINE.replace('legs=4', `legs=${legs}`))).toBe('did not throw');
    for (const eyes of [0, 1, 2, 4, 6, 8]) expect(thrown(LINE.replace('eyes=2', `eyes=${eyes}`))).toBe('did not throw');
    for (let iris = 0; iris < 11; iris++) expect(thrown(LINE.replace('iris=3', `iris=${iris}`))).toBe('did not throw');
  });

  it('rejects a second line for the same key', () => {
    expect(thrown(`${LINE}\n\n${LINE.replace('medium', 'small')}`)).toBe('line 3: duplicate species civet');
  });
});

describe('bone values 21 to 24 (l to o)', () => {
  const BID = 'quadruped/torso/t1/medium/v0';
  const HEAD = `part ${BID}\nframe rest anchor=0,0\n`;
  const message = (text: string): string => {
    try {
      parseCatalogueText(text);
      return 'did not throw';
    } catch (e) {
      return (e as Error).message;
    }
  };
  const rest = (text: string) => parseCatalogueText(text).parts.get(BID)!.frames.rest!;

  it('a part row may hold l, m, n and o, read as 21 to 24', () => {
    expect(rest(`${HEAD}lmno\n1c.d\n`).pixels).toEqual(Uint8Array.from([21, 22, 23, 24, 1, 12, 0, 13]));
  });

  it('a part row still refuses the outline g and the iris h to k, and any character after s', () => {
    expect(message(`${HEAD}lmno\n1g..\n`)).toBe(`part ${BID} frame rest line 4: outline value is written by the composer`);
    for (const c of 'hijk') expect(message(`${HEAD}lmno\n1${c}..\n`), c).toBe(`part ${BID} frame rest line 4: iris value is written by the composer`);
    expect(message(`${HEAD}lmno\n1t..\n`)).toBe(`part ${BID} frame rest line 4: unknown pixel character 't'`);
  });

  it('a hand-drawn pattern or skin layer may hold l to o; a guide layer may not, and no layer holds d to k', () => {
    const f = rest(`${HEAD}1234\nlayer striped\nlmno\nlayer scaled\n.o1c\n`);
    expect(f.layers!.striped).toEqual(Uint8Array.from([21, 22, 23, 24]));
    expect(f.layers!.scaled).toEqual(Uint8Array.from([0, 24, 1, 12]));
    for (const guide of ['flow', 'spots']) expect(message(`${HEAD}1234\nlayer ${guide}\n123l\n`), guide).toBe(`part ${BID} frame rest line 5: bad layer value 'l'`);
    for (const c of 'defghijk') {
      for (const layer of ['striped', 'furred']) expect(message(`${HEAD}1234\nlayer ${layer}\n123${c}\n`), `${layer} ${c}`).toBe(`part ${BID} frame rest line 5: bad layer value '${c}'`);
    }
    // A guide layer keeps its own range: d, e and f (13 to 15) are spot and flow counters there.
    expect(rest(`${HEAD}1234\nlayer flow\ndef.\n`).layers!.flow).toEqual(Uint8Array.from([13, 14, 15, 0]));
  });

  it('formatPart writes bone and the parser reads it back the same, rows and layers', () => {
    const part: Part = { id: BID, family: 'quadruped', slot: 'torso', tier: 'medium', kind: 't1', variant: 0,
      frames: { rest: { w: 4, h: 1, pixels: Uint8Array.from([21, 22, 23, 24]), anchor: [0, 0], attach: {}, layers: { banded: Uint8Array.from([24, 0, 5, 21]), slick: Uint8Array.from([0, 22, 0, 0]) } } } };
    const text = formatPart(part);
    expect(text).toBe(`part ${BID}\nframe rest anchor=0,0\nlmno\nlayer banded\no.5l\nlayer slick\n.m..\n\n`);
    expect(parseCatalogueText(text).parts.get(BID)).toEqual(part);
  });

  it('formatPart still refuses what the parser refuses: an iris value in a row, 13 to 20 and 29 in a hand-drawn layer, bone in a guide layer', () => {
    const framed = (pixels: number[], layers?: Record<string, Uint8Array>): Part => ({ id: BID, family: 'quadruped', slot: 'torso', tier: 'medium', kind: 't1', variant: 0,
      frames: { rest: { w: 2, h: 1, pixels: Uint8Array.from(pixels), anchor: [0, 0], attach: {}, ...(layers === undefined ? {} : { layers }) } } });
    for (const v of [17, 20]) expect(() => formatPart(framed([1, v])), String(v)).toThrow('frame rest holds an iris value, which only the composer writes');
    expect(() => formatPart(framed([1, 24]))).not.toThrow();
    for (const v of [13, 16, 17, 20, 29]) expect(() => formatPart(framed([1, 1], { striped: Uint8Array.from([0, v]) })), String(v)).toThrow('layer striped holds a value above 12 that is not bone or deep (21 to 28)');
    expect(() => formatPart(framed([1, 1], { flow: Uint8Array.from([0, 21]) }))).toThrow('layer flow holds a value above 15');
  });
});

describe('deep values 25 to 28 (p to s)', () => {
  const BID = 'quadruped/torso/t1/medium/v0';
  const HEAD = `part ${BID}\nframe rest anchor=0,0\n`;
  const message = (text: string): string => {
    try {
      parseCatalogueText(text);
      return 'did not throw';
    } catch (e) {
      return (e as Error).message;
    }
  };
  const rest = (text: string) => parseCatalogueText(text).parts.get(BID)!.frames.rest!;

  it('a part row may hold p, q, r and s, read as 25 to 28, beside bone and hide', () => {
    expect(rest(`${HEAD}pqrs\n1o.d\n`).pixels).toEqual(Uint8Array.from([25, 26, 27, 28, 1, 24, 0, 13]));
  });

  it('a part row still refuses the outline g and the iris h to k, and any character after s', () => {
    expect(message(`${HEAD}pqrs\n1g..\n`)).toBe(`part ${BID} frame rest line 4: outline value is written by the composer`);
    for (const c of 'hijk') expect(message(`${HEAD}pqrs\n1${c}..\n`), c).toBe(`part ${BID} frame rest line 4: iris value is written by the composer`);
    for (const c of 'tuz') expect(message(`${HEAD}pqrs\n1${c}..\n`), c).toBe(`part ${BID} frame rest line 4: unknown pixel character '${c}'`);
  });

  it('a hand-drawn pattern or skin layer may hold p to s; a guide layer may not, and no layer holds d to k', () => {
    const f = rest(`${HEAD}1234\nlayer striped\npqrs\nlayer scaled\n.s1o\n`);
    expect(f.layers!.striped).toEqual(Uint8Array.from([25, 26, 27, 28]));
    expect(f.layers!.scaled).toEqual(Uint8Array.from([0, 28, 1, 24]));
    for (const guide of ['flow', 'spots']) {
      for (const c of 'pqrs') expect(message(`${HEAD}1234\nlayer ${guide}\n123${c}\n`), `${guide} ${c}`).toBe(`part ${BID} frame rest line 5: bad layer value '${c}'`);
    }
    for (const c of 'defghijk') {
      for (const layer of ['striped', 'furred']) expect(message(`${HEAD}1234\nlayer ${layer}\n123${c}\n`), `${layer} ${c}`).toBe(`part ${BID} frame rest line 5: bad layer value '${c}'`);
    }
  });

  it('formatPart writes deep and the parser reads it back the same, rows and layers', () => {
    const part: Part = { id: BID, family: 'quadruped', slot: 'torso', tier: 'medium', kind: 't1', variant: 0,
      frames: { rest: { w: 4, h: 1, pixels: Uint8Array.from([25, 26, 27, 28]), anchor: [0, 0], attach: {}, layers: { banded: Uint8Array.from([28, 0, 5, 25]), slick: Uint8Array.from([0, 26, 0, 21]) } } } };
    const text = formatPart(part);
    expect(text).toBe(`part ${BID}\nframe rest anchor=0,0\npqrs\nlayer banded\ns.5p\nlayer slick\n.q.l\n\n`);
    expect(parseCatalogueText(text).parts.get(BID)).toEqual(part);
  });

  it('formatPart still refuses what the parser refuses: an iris value in a row, 13 to 20 and 29 in a hand-drawn layer, deep in a guide layer', () => {
    const framed = (pixels: number[], layers?: Record<string, Uint8Array>): Part => ({ id: BID, family: 'quadruped', slot: 'torso', tier: 'medium', kind: 't1', variant: 0,
      frames: { rest: { w: 2, h: 1, pixels: Uint8Array.from(pixels), anchor: [0, 0], attach: {}, ...(layers === undefined ? {} : { layers }) } } });
    for (const v of [17, 20]) expect(() => formatPart(framed([25, v])), String(v)).toThrow('frame rest holds an iris value, which only the composer writes');
    for (const v of [25, 28]) expect(() => formatPart(framed([1, v])), String(v)).not.toThrow();
    expect(() => formatPart(framed([1, 29]))).toThrow('pixel value 29 out of range');
    for (const v of [25, 28]) expect(() => formatPart(framed([1, 1], { striped: Uint8Array.from([0, v]) })), String(v)).not.toThrow();
    for (const v of [13, 16, 17, 20, 29]) expect(() => formatPart(framed([1, 1], { striped: Uint8Array.from([0, v]) })), String(v)).toThrow('layer striped holds a value above 12 that is not bone or deep (21 to 28)');
    for (const v of [25, 28]) expect(() => formatPart(framed([1, 1], { flow: Uint8Array.from([0, v]) })), String(v)).toThrow('layer flow holds a value above 15');
  });
});
