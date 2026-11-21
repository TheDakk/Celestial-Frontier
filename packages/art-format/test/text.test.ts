import { describe, expect, it } from 'vitest';
import { formatPart, parseCatalogueText } from '@cf/art-format';
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

fallback quadruped quadruped/torso/sturdy/medium/v0
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
    expect(c.fallbacks.get('quadruped')).toBe('quadruped/torso/sturdy/medium/v0');
    expect(c.palette).toEqual({ colours: [0x0b1020, 0xffffff, 0xeeeeee, 0x00ff00, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4], ramps: { emerald: [12, 13, 14, 15] }, outline: 0, eye: 1, eyeHighlight: 2, glow: 3 });
  });

  it('reads letters a-g as 10-16 and negative entry offsets', () => {
    const c = parseCatalogueText('part quadruped/tail/t0/small/v1\nframe rest anchor=0,0 attach=a:1,2,b:3,4\nag\n\nscaffold quadruped/sturdy/small origin=0,0\npose rest\nentry tail 0 rest -3 -4\n');
    const f = c.parts.get('quadruped/tail/t0/small/v1')!.frames['rest']!;
    expect(Array.from(f.pixels)).toEqual([10, 16]);
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
  it('rejects more than 96 colours', () => {
    expect(thrown('palette\ncolour 95 ffffff')).toBe('did not throw');
    expect(thrown('palette\ncolour 96 ffffff')).toBe('palette: more than 96 colours');
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
  it('rejects palette indices outside 0..95', () => {
    expect(thrown('palette\ncolour -1 ffffff')).toBe('line 2: bad colour index -1');
    expect(thrown('palette\ncolour 0 ffffff\nramp r 0 0 0 96')).toBe('line 3: bad colour index 96');
    expect(thrown('palette\noutline -2')).toBe('line 2: bad colour index -2');
    expect(thrown('palette\neye 96')).toBe('line 2: bad colour index 96');
    expect(thrown('palette\neyeHighlight 200')).toBe('line 2: bad colour index 200');
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
    expect(thrown('fallback quadruped a/b\nfallback quadruped c/d')).toBe('line 2: duplicate fallback quadruped');
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
        rest: { w: 3, h: 2, pixels: Uint8Array.from([0, 1, 16, 10, 9, 0]), anchor: [1, 1], attach: { eye0: [2, 0], eye1: [0, 1] } },
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
});
