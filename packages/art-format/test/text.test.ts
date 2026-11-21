import { describe, expect, it } from 'vitest';
import { formatPart, parseCatalogueText } from '@cf/art-format';
import type { Part } from '@cf/art-format';

const SAMPLE = `# sample catalogue
palette
colour 0 0b1020
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
    expect(c.palette).toEqual({ colours: [0x0b1020], ramps: { emerald: [12, 13, 14, 15] }, outline: 0, eye: 1, eyeHighlight: 2, glow: 3 });
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
    const s = 'scaffold quadruped/sturdy/small origin=0,0\n';
    expect(thrown(`${s}${s}`)).toBe('line 2: duplicate id quadruped/sturdy/small');
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
});
