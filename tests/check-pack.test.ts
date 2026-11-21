import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { checkPack, formatReport, type PackReport } from '../tools/check-pack.mjs';

const TOOL = fileURLToPath(new URL('../tools/check-pack.mjs', import.meta.url));
const PLACEHOLDER = new URL('../packages/art-testparts/src/quadruped.txt', import.meta.url);

// A small pack that is right in every way the tool checks: the head and tail overlap the torso by two columns,
// so a shift of one pixel never opens a gap; legs overlap its bottom row; eyes sit inside the head.
const PALETTE = `palette
colour 0 000000
colour 1 445566
outline 0
eye 1
eyeHighlight 1
glow 1
`;
const PARTS = `
part quadruped/torso/sturdy/small/v0
frame rest anchor=0,0 attach=head:10,1,tail:1,1,back:6,-1,far0:1,5,far1:4,5,far2:7,5,far3:10,5,near0:2,5,near1:5,5,near2:8,5,near3:9,5
222222222222
222222222222
222222222222
222222222222
222222222222
111111111111

part quadruped/head/h0/small/v0
frame rest anchor=0,0 attach=eye0:1,1,eye1:2,1,eye2:3,1,eye3:4,1,eye4:1,3,eye5:2,3,eye6:3,3,eye7:4,3
666666
666666
666666
666666
555555

part quadruped/tail/t1/small/v0
frame rest anchor=4,0
22222
11111

part quadruped/farLimbs/leg/small/v0
frame rest anchor=0,0
22
22
11

part quadruped/nearLimbs/leg/small/v0
frame rest anchor=0,0
33
33
11

part quadruped/eyes/eye/small/v0
frame rest anchor=0,0
d

part quadruped/torso/fallback/small/v0
frame rest anchor=1,1
222
222
`;
const SCAFFOLD = `
scaffold quadruped/sturdy/small origin=16,12
pose rest
pose approach
entry torso 0 rest 1 0
pose windup
entry torso 0 rest -1 0
pose strike contact=40,14
entry torso 0 rest 1 0
pose recover
pose hit
entry torso 0 rest 0 1
pose faint
entry torso 0 rest 0 2

fallback quadruped quadruped/torso/fallback/small/v0
`;
const GOOD = PALETTE + PARTS + SCAFFOLD;

/** The good pack with one exact piece of text replaced; fails the test if the text is not there. */
function planted(from: string, to: string): string {
  expect(GOOD.split(from)).toHaveLength(2);
  return GOOD.replace(from, to);
}
const errorsOf = (report: PackReport): string[] => formatReport(report).split('\n').filter((l) => l.startsWith('error:'));

describe('checkPack on a known-good pack', () => {
  it('reports no error, only variant information', () => {
    const r = checkPack(GOOD);
    expect(errorsOf(r)).toEqual([]);
    expect(r.ok).toBe(true);
    expect(r.gaps.every((g) => g.gap.startsWith('variant:') && !g.error)).toBe(true);
    expect(r.composed).toBeGreaterThan(100);
    expect(r.summary).toMatchObject({ parts: 7, scaffolds: 1, fallbacks: 1, colours: 2, ramps: 0, bySlot: { torso: 2, head: 1, tail: 1, farLimbs: 1, nearLimbs: 1, eyes: 1 } });
    expect(formatReport(r).split('\n')[0]).toBe('check-pack: OK');
  });
});

describe('checkPack on planted faults', () => {
  it('a parser error is reported with its message and nothing further', () => {
    const text = planted('666666\n555555', '666666\n55555g');
    const line = text.split('\n').indexOf('55555g') + 1;
    const message = `part quadruped/head/h0/small/v0 frame rest line ${line}: outline value is written by the composer`;
    const r = checkPack(text);
    expect(r.ok).toBe(false);
    expect(r.parseError).toBe(message);
    expect(r.summary).toBeNull();
    expect(r.composed).toBe(0);
    expect(formatReport(r)).toBe(`check-pack: FAIL\nerror: parse: ${message}\n`);
  });

  it('a missing attach point on a torso frame or a head frame', () => {
    const torso = checkPack(planted(',far3:10,5', ''));
    expect(torso.structure).toEqual(['part quadruped/torso/sturdy/small/v0 frame rest: missing attach point far3']);
    expect(torso.gaps.filter((g) => g.error).map((g) => g.gap)).toEqual(['attach:far3']);
    expect(torso.ok).toBe(false);
    const head = checkPack(planted(',eye7:4,3', ''));
    expect(head.structure).toEqual(['part quadruped/head/h0/small/v0 frame rest: missing attach point eye7']);
    expect(head.ok).toBe(false);
  });

  it('a part touching the canvas edge', () => {
    const r = checkPack(planted('origin=16,12', 'origin=1,12'));
    expect(r.edge.length).toBeGreaterThan(0);
    expect(new Set(r.edge.map((e) => e.scaffold))).toEqual(new Set(['quadruped/sturdy/small']));
    expect(errorsOf(r).some((l) => l.startsWith('error: touches the canvas edge on quadruped/sturdy/small'))).toBe(true);
    expect(r.ok).toBe(false);
  });

  it('a detached head', () => {
    const r = checkPack(planted('attach=head:10,1,', 'attach=head:14,1,'));
    expect(r.detached.length).toBeGreaterThan(0);
    expect(r.detached.every((d) => d.off.includes('head') && !d.off.includes('tail'))).toBe(true);
    expect(errorsOf(r).some((l) => l.startsWith('error: detached head on quadruped/sturdy/small'))).toBe(true);
    expect(r.ok).toBe(false);
  });

  it('a head that touches only at shift 0 is detached at the shifts that open a gap, and only those', () => {
    // Head flush against the torso's last column (x 11): a head shift of +1 in x leaves a one-pixel gap.
    const r = checkPack(planted('attach=head:10,1,', 'attach=head:12,1,'));
    const shifts = new Set(r.detached.map((d) => d.shift.head.join(',')));
    expect(shifts).toEqual(new Set(['1,-1', '1,0', '1,1']));
  });

  it('a missing pose and a strike pose with no contact point', () => {
    const missing = checkPack(planted('pose faint\nentry torso 0 rest 0 2\n', ''));
    expect(missing.structure).toEqual(['scaffold quadruped/sturdy/small: missing pose faint']);
    expect(missing.ok).toBe(false);
    const contact = checkPack(planted('pose strike contact=40,14', 'pose strike'));
    expect(contact.structure).toEqual(['scaffold quadruped/sturdy/small: pose strike has no contact point']);
    expect(contact.ok).toBe(false);
  });

  it('a fallback that does not fit its canvas when centred, or at the origin of its scaffold', () => {
    const r = checkPack(planted('frame rest anchor=1,1\n222\n222', 'frame rest anchor=30,1\n222\n222'));
    expect(r.structure).toEqual([
      'fallback quadruped small: part quadruped/torso/fallback/small/v0 does not fit the 48x32 canvas when centred',
      'fallback quadruped small: part quadruped/torso/fallback/small/v0 does not fit the 48x32 canvas at the origin of scaffold quadruped/sturdy/small',
    ]);
    expect(r.ok).toBe(false);
  });

  it('a family present in the pack with no fallback at a tier the pack has parts for', () => {
    const r = checkPack(`${GOOD}\npart serpent/tail/t1/large/v0\nframe rest anchor=0,0\n1\n`);
    expect(r.structure).toEqual(['family quadruped has no fallback at large', 'family serpent has no fallback at small', 'family serpent has no fallback at large']);
    expect(errorsOf(r)).toContain('error: family serpent has no fallback at small');
    expect(r.ok).toBe(false);
  });

  it('a creature that needs a fallback the pack lacks is an error line, not a crash', () => {
    const text = planted('fallback quadruped quadruped/torso/fallback/small/v0\n', '').replace('part quadruped/torso/sturdy/small/v0', 'part quadruped/torso/gone/small/v0');
    let r: PackReport | undefined;
    expect(() => { r = checkPack(text); }).not.toThrow();
    expect(r!.failures).toEqual(['no fallback for family quadruped at small (needed by quadruped/sturdy/small)']);
    expect(errorsOf(r!)).toContain('error: compose failed: no fallback for family quadruped at small (needed by quadruped/sturdy/small)');
    expect(r!.ok).toBe(false);
  });

  it('a gap other than variant: is an error; a scaffold no genome reaches is an error', () => {
    const r = checkPack(planted('part quadruped/eyes/eye/small/v0', 'part quadruped/eyes/dot/small/v0'));
    expect(r.gaps.find((g) => g.gap === 'missing:quadruped/eyes/eye/small/v0')).toMatchObject({ error: true });
    expect(r.ok).toBe(false);
    const lost = checkPack(`${GOOD}\nscaffold quadruped/winged/small origin=16,12\npose rest\n`);
    expect(lost.unreachable).toEqual(['scaffold quadruped/winged/small: no fauna genome resolves to it, so the renderer never uses it']);
    expect(lost.ok).toBe(false);
  });
});

describe('checkPack on the placeholder catalogue (the real result, pinned)', () => {
  let r: PackReport;
  beforeAll(() => { r = checkPack(readFileSync(PLACEHOLDER, 'utf8')); });
  const QUADRUPEDS = ['sturdy', 'armored', 'stilt', 'tusked', 'horned', 'squat'].map((t) => `quadruped/${t}/medium`);

  it('parses, sums up, has every attach point and pose, never touches the edge and has no gap but variant:', () => {
    expect(r.parseError).toBeNull();
    expect(r.summary).toMatchObject({ parts: 85, scaffolds: 6, fallbacks: 60, colours: 16, ramps: 34, byTier: { medium: 40, small: 15, large: 15, guardian: 15 } });
    expect(r.structure).toEqual([]);
    expect(r.unreachable).toEqual([]);
    expect(r.edge).toEqual([]);
    expect(r.gaps.filter((g) => g.error)).toEqual([]);
    expect(r.composed).toBe(19740);
  });

  it('reports the tail detaching under a shift away from the body, and attached at shift 0 in rest', () => {
    const tailRest = r.detached.filter((d) => d.off.includes('tail') && d.pose === 'rest');
    expect(tailRest.length).toBeGreaterThan(0);
    expect(new Set(tailRest.map((d) => d.shift.tail.join(',')))).toEqual(new Set(['-1,-1', '-1,0', '-1,1']));
  });

  it('reports, on every quadruped scaffold, the head and tail detached in exactly these poses and shifts', () => {
    const seen = (slot: 'head' | 'tail', scaffold: string): Record<string, string> => {
      const out: Record<string, Set<string>> = {};
      for (const d of r.detached) if (d.scaffold === scaffold && d.off.includes(slot)) (out[d.pose] ??= new Set()).add(d.shift[slot].join(','));
      return Object.fromEntries(Object.entries(out).map(([pose, s]) => [pose, [...s].sort().join(' ')]));
    };
    const ALL = '-1,-1 -1,0 -1,1 0,-1 0,0 0,1 1,-1 1,0 1,1';
    const RIGHT = '1,-1 1,0 1,1';
    const NOT_LEFT = '0,-1 0,0 0,1 1,-1 1,0 1,1';
    const LEFT = '-1,-1 -1,0 -1,1';
    const NOT_RIGHT = '-1,-1 -1,0 -1,1 0,-1 0,0 0,1';
    for (const scaffold of QUADRUPEDS) {
      // The placeholder head sits flush on the torso: a +1 head shift opens a gap; approach and recover move it +1, strike +2.
      expect(seen('head', scaffold), scaffold).toEqual({ rest: RIGHT, approach: NOT_LEFT, strike: ALL, recover: NOT_LEFT, faint: RIGHT });
      // The tail mirrors it: a -1 tail shift opens a gap; approach and strike move it -1.
      expect(seen('tail', scaffold), scaffold).toEqual({ rest: LEFT, approach: NOT_RIGHT, windup: LEFT, strike: NOT_RIGHT, hit: LEFT, faint: LEFT });
    }
    // Only heads, their eyes and tails come loose; legs never do.
    expect(new Set(r.detached.flatMap((d) => d.off))).toEqual(new Set(['head', 'eyes', 'tail']));
    expect(r.ok).toBe(false);
  });

  it('prints one line per detached slot and scaffold', () => {
    const errors = errorsOf(r);
    expect(errors).toHaveLength(12);
    for (const scaffold of QUADRUPEDS) {
      expect(errors.filter((l) => l.startsWith(`error: detached head on ${scaffold} `))).toHaveLength(1);
      expect(errors.filter((l) => l.startsWith(`error: detached tail on ${scaffold} `))).toHaveLength(1);
    }
  });
});

describe('check-pack command line', () => {
  const run = (args: string[]) => spawnSync(process.execPath, [TOOL, ...args], { encoding: 'utf8' });

  it('prints a usage line and fails with no arguments', () => {
    const r = run([]);
    expect(r.status).toBe(2);
    expect(r.stderr).toBe('usage: node tools/check-pack.mjs <pack.txt> [more.txt ...]\n');
  });

  it('joins several files with a newline, exits 0 for a good pack and 1 for a fault', () => {
    const dir = mkdtempSync(join(tmpdir(), 'check-pack-'));
    try {
      // The palette file has no final newline: the join must still keep the next file's first line separate.
      writeFileSync(join(dir, 'palette.txt'), PALETTE.trimEnd());
      writeFileSync(join(dir, 'parts.txt'), PARTS.trimStart() + SCAFFOLD);
      const good = run([join(dir, 'palette.txt'), join(dir, 'parts.txt')]);
      expect(good.stdout.split('\n')[0]).toBe('check-pack: OK');
      expect(good.status).toBe(0);
      writeFileSync(join(dir, 'parts.txt'), (PARTS.trimStart() + SCAFFOLD).replace('pose strike contact=40,14', 'pose strike'));
      const bad = run([join(dir, 'palette.txt'), join(dir, 'parts.txt')]);
      expect(bad.stdout).toContain('error: scaffold quadruped/sturdy/small: pose strike has no contact point');
      expect(bad.status).toBe(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
