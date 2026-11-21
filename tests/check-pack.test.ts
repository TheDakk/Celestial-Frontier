import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIMB_COUNTS, VARIANTS } from '@cf/art-format';
import { describe, expect, it } from 'vitest';
import { checkPack, formatReport, type PackReport } from '../tools/check-pack.mjs';

const TOOL = fileURLToPath(new URL('../tools/check-pack.mjs', import.meta.url));

// A small pack that is right in every way the tool checks: the head and tail overlap the torso by two columns,
// so a shift of one pixel never opens a gap; legs overlap its bottom row and are long enough that each shows at least
// four pixels beside its neighbours; eyes sit inside the head.
const PALETTE = `palette
colour 0 000000
colour 1 445566
ramp iris0 0 1 1 1
ramp iris1 0 0 1 1
ramp iris2 0 0 0 1
ramp iris3 1 1 1 1
ramp iris4 1 0 0 0
ramp iris5 1 1 0 0
ramp iris6 1 1 1 0
ramp iris7 0 1 0 1
outline 0
eye 1
eyeHighlight 1
glow 1
`;
const PARTS = `
part quadruped/torso/sturdy/small/v0
frame rest anchor=0,0 attach=head:10,1,tail:1,1,back:6,-1,far0:0,5,far1:3,5,far2:6,5,far3:9,5,near0:1,5,near1:4,5,near2:7,5,near3:10,5
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
22
22
22
11

part quadruped/nearLimbs/leg/small/v0
frame rest anchor=0,0
33
33
33
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

/** The good pack (or another base) with one exact piece of text replaced; fails the test if the text is not there exactly once. */
function planted(from: string, to: string, base = GOOD): string {
  expect(base.split(from)).toHaveLength(2);
  return base.replace(from, to);
}
const errorsOf = (report: PackReport): string[] => formatReport(report).split('\n').filter((l) => l.startsWith('error:'));

/** The gaps of a report that are not variant: lines, as `<class> <error>`, one per class. */
const gapClasses = (r: PackReport): string[] =>
  [...new Set(r.gaps.filter((g) => !g.gap.startsWith('variant:')).map((g) => `${g.gap.slice(0, g.gap.indexOf(':') + 1)}${g.gap.includes('/back/') ? ' back' : g.gap.includes('/headFeature/') ? ' headFeature' : ''} ${g.error}`))].sort();

describe('checkPack on a known-good pack', () => {
  // Review Focus 2: the good pack is in today's format (no layers, only the shared leg, no back parts).
  it('a pack in the old format still checks OK', () => {
    const r = checkPack(GOOD);
    expect(errorsOf(r)).toEqual([]);
    expect(r.ok).toBe(true);
    expect(r.failures).toEqual([]);
    expect(r.summary).toMatchObject({ parts: 7, scaffolds: 1, fallbacks: 1, colours: 2, ramps: 8, bySlot: { torso: 2, head: 1, tail: 1, farLimbs: 1, nearLimbs: 1, eyes: 1 } });
    expect(formatReport(r).split('\n')[0]).toBe('check-pack: OK');
    // Its new gaps are information, each printed as an info: line.
    for (const prefix of ['marks:', 'role:', 'missing:quadruped/back/']) {
      const found = r.gaps.filter((g) => g.gap.startsWith(prefix));
      expect(found.length, prefix).toBeGreaterThan(0);
      expect(found.every((g) => !g.error), prefix).toBe(true);
      expect(formatReport(r).split('\n').some((l) => l.startsWith(`info: gap ${prefix}`)), prefix).toBe(true);
    }
    expect(gapClasses(r)).toEqual(['marks: false', 'missing: back false', 'role: false']);
    // With no iris ramps either, it is still OK.
    const old = checkPack(OLD_FORMAT);
    expect(old.ok).toBe(true);
    expect(gapClasses(old)).toEqual(['marks: false', 'missing: back false', 'role: false']);
    // A horned torso asks for horns: a missing head feature is information too.
    const horned = checkPack(GOOD.replaceAll('sturdy', 'horned'));
    expect(horned.ok).toBe(true);
    expect(gapClasses(horned)).toEqual(['marks: false', 'missing: back false', 'missing: headFeature false', 'role: false']);
  });

  it('a missing torso is still an error', () => {
    const r = checkPack(planted('part quadruped/torso/sturdy/small/v0', 'part quadruped/torso/sturdy/small/v1'));
    expect(r.gaps.find((g) => g.gap === 'missing:quadruped/torso/sturdy/small/v0')).toMatchObject({ error: true });
    expect(errorsOf(r)).toContain(`error: gap missing:quadruped/torso/sturdy/small/v0 (x${r.gaps.find((g) => g.gap === 'missing:quadruped/torso/sturdy/small/v0')!.count})`);
    expect(r.ok).toBe(false);
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
    const torso = checkPack(planted(',far3:9,5', ''));
    expect(torso.structure).toEqual(['part quadruped/torso/sturdy/small/v0 frame rest: missing attach point far3']);
    expect(torso.gaps.filter((g) => g.error).map((g) => g.gap)).toEqual(['attach:far3']);
    expect(torso.ok).toBe(false);
    const head = checkPack(planted(',eye7:4,3', ''));
    expect(head.structure).toEqual(['part quadruped/head/h0/small/v0 frame rest: missing attach point eye7']);
    expect(head.ok).toBe(false);
  });

  it('requires no eye points on the eyeless head (h2), and still requires them on any other head', () => {
    const noEyes = planted('part quadruped/head/h0/small/v0\nframe rest anchor=0,0 attach=eye0:1,1,eye1:2,1,eye2:3,1,eye3:4,1,eye4:1,3,eye5:2,3,eye6:3,3,eye7:4,3', 'part quadruped/head/h2/small/v0\nframe rest anchor=0,0');
    expect(checkPack(noEyes).structure).toEqual([]);
    expect(checkPack(noEyes).ok).toBe(true);
    const other = checkPack(planted('frame rest anchor=0,0 attach=eye0:1,1,eye1:2,1,eye2:3,1,eye3:4,1,eye4:1,3,eye5:2,3,eye6:3,3,eye7:4,3', 'frame rest anchor=0,0'));
    expect(other.structure).toEqual(['part quadruped/head/h0/small/v0 frame rest: missing attach point eye0, eye1, eye2, eye3, eye4, eye5, eye6, eye7']);
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

  it('a tail drawn wholly behind the torso is a hidden part, named with its genome, pose and shift', () => {
    // The tail (5 wide, 2 high) hangs from x 5 of a 12-wide, 6-high torso: drawn first, it is covered in every pose.
    const r = checkPack(planted('attach=head:10,1,tail:1,1,', 'attach=head:10,1,tail:5,1,'));
    expect(r.detached).toEqual([]);
    expect(r.hidden.length).toBeGreaterThan(0);
    expect(new Set(r.hidden.map((d) => `${d.scaffold} ${d.partId} ${d.visible}`))).toEqual(new Set(['quadruped/sturdy/small quadruped/tail/t1/small/v0 0']));
    expect(new Set(r.hidden.map((d) => d.pose))).toEqual(new Set(['rest', 'approach', 'windup', 'strike', 'recover', 'hit', 'faint']));
    expect(r.hidden.every((d) => d.genome['tail'] === 1 && d.needed === 4)).toBe(true);
    const lines = errorsOf(r);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/^error: hidden part quadruped\/tail\/t1\/small\/v0 on quadruped\/sturdy\/small in \d+ creature poses \(.*\), e\.g\. body 0 loco 0 size 0 head 0 tail 1 limbs \d eyes \d pose \w+ shift head -?\d,-?\d tail -?\d,-?\d: shows 0 of 4 pixels$/);
    expect(r.ok).toBe(false);
  });

  it('an eye drawn wholly off the canvas is a hidden part, and the eye part is named', () => {
    const r = checkPack(planted('part quadruped/eyes/eye/small/v0\nframe rest anchor=0,0', 'part quadruped/eyes/eye/small/v0\nframe rest anchor=-100,0'));
    expect(r.hidden.length).toBeGreaterThan(0);
    expect(new Set(r.hidden.map((d) => d.partId))).toEqual(new Set(['quadruped/eyes/eye/small/v0']));
    expect(errorsOf(r).some((l) => l.startsWith('error: hidden part quadruped/eyes/eye/small/v0 on quadruped/sturdy/small'))).toBe(true);
    expect(r.ok).toBe(false);
  });

  it('an eye that is drawn is not reported hidden, whatever its place in the recipe', () => {
    expect(checkPack(GOOD).hidden).toEqual([]);
  });

  it('a detached eye is reported with the slot named eyes, never as a bare number', () => {
    const r = checkPack(planted('part quadruped/eyes/eye/small/v0\nframe rest anchor=0,0', 'part quadruped/eyes/eye/small/v0\nframe rest anchor=-8,0'));
    expect(r.detached.length).toBeGreaterThan(0);
    expect(r.detached.every((d) => d.off.includes('eyes') && d.off.every((o) => Number.isNaN(Number(o))))).toBe(true);
    expect(errorsOf(r).some((l) => l.startsWith('error: detached eyes on quadruped/sturdy/small'))).toBe(true);
    expect(r.ok).toBe(false);
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

  it('reaches a guardian-tier scaffold through the Guardian marker', () => {
    const r = checkPack(`${GOOD}\nscaffold quadruped/sturdy/guardian origin=100,60\npose rest\n`);
    expect(r.unreachable).toEqual([]);
    // It is composed: with no guardian parts and no guardian fallback, compose reports the missing fallback.
    expect(r.failures).toEqual(['no fallback for family quadruped at guardian (needed by quadruped/sturdy/guardian)']);
  });

  it('a leg named for a torso type with no scaffold is an error; one named for the torso type of a scaffold is not', () => {
    const leg = (kind: string): string => `${GOOD}\npart quadruped/farLimbs/${kind}/small/v0\nframe rest anchor=0,0\n22\n22\n22\n22\n22\n11\n`;
    const own = checkPack(leg('fore-sturdy'));
    expect(own.unreachable).toEqual([]);
    for (const kind of ['fore-winged', 'paw', 'paw-sturdy']) {
      const lost = checkPack(leg(kind));
      expect(lost.unreachable, kind).toHaveLength(1);
      expect(lost.unreachable[0], kind).toContain(`part quadruped/farLimbs/${kind}/small/v0: no creature asks for a leg named '${kind}'`);
      expect(lost.ok, kind).toBe(false);
    }
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

// The good pack's torso with a correct flow and spots layer. Its top row has one transparent pixel and one eye value
// (13, not a ramp value), and the layers leave both blank.
const TORSO_ROWS = '222222222222\n222222222222\n222222222222\n222222222222\n222222222222\n111111111111\n';
const LAYERED_ROWS = `.d2222222222
222222222222
222222222222
222222222222
222222222222
111111111111
layer flow
..3456789abc
123456789abc
123456789abc
123456789abc
123456789abc
123456789abc
layer spots
............
.11.....22..
.11.....22..
............
....33......
....33......
`;
const TORSO_ID = 'quadruped/torso/sturdy/small/v0';
// A pack in the art agent's present format: ramps but no iris ramp, no layers, only the shared leg, no back parts.
const OLD_FORMAT = GOOD.replace(/ramp iris\d [0-9 ]+\n/g, '').replace('colour 1 445566\n', 'colour 1 445566\nramp c0 0 1 1 1\n');
const NO_IRIS = 'info: palette has no iris ramps (iris0 to iris7): eyes show no iris colour';

describe('checkPack on planted faults: layers, iris ramps, leg-count names, the feature point', () => {
  const layered = planted(TORSO_ROWS, LAYERED_ROWS);

  it('a correct flow and spots layer on the torso is silent', () => {
    const r = checkPack(layered);
    expect(r.parseError).toBeNull();
    expect(r.structure).toEqual([]);
    expect(errorsOf(r)).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it('a layer pixel where the frame draws nothing or draws an eye value is an error, counted', () => {
    const line = `error: part ${TORSO_ID} frame rest: layer flow has 2 pixels outside the drawn area`;
    expect(errorsOf(checkPack(layered))).not.toContain(line);
    const r = checkPack(planted('layer flow\n..3456789abc', 'layer flow\n123456789abc', layered));
    expect(errorsOf(r)).toContain(line);
    expect(r.ok).toBe(false);
  });

  it('a spot value in two 4-connected blobs is an error', () => {
    const line = `error: part ${TORSO_ID} frame rest: spot value 3 is in 2 blobs`;
    expect(errorsOf(checkPack(layered))).not.toContain(line);
    // A diagonal neighbour is not 4-connected: the lone 3 touches the blob only at a corner.
    const r = checkPack(planted('....33......\n....33......\n', '....33......\n....3.3.....\n', layered));
    expect(errorsOf(r)).toContain(line);
    expect(r.ok).toBe(false);
  });

  it('a layer on a part whose slot takes no marks is an error', () => {
    const line = 'error: part quadruped/eyes/eye/small/v0: layers on a slot that takes no marks';
    expect(errorsOf(checkPack(GOOD))).not.toContain(line);
    const r = checkPack(planted('part quadruped/eyes/eye/small/v0\nframe rest anchor=0,0\nd\n', 'part quadruped/eyes/eye/small/v0\nframe rest anchor=0,0\nd\nlayer flow\n.\n'));
    expect(r.parseError).toBeNull();
    expect(errorsOf(r)).toContain(line);
    expect(r.ok).toBe(false);
  });

  it('a layer of the wrong size is a parse error', () => {
    const r = checkPack(planted('layer flow\n..3456789abc', 'layer flow\n..3456789ab', layered));
    expect(r.parseError).toMatch(/layer flow row width 11 differs from 12$/);
    expect(r.ok).toBe(false);
  });

  it('a palette with some iris ramps must hold all eight: one error per missing ramp', () => {
    const r = checkPack(planted('ramp iris3 1 1 1 1\n', ''));
    expect(r.structure).toEqual(['palette: missing iris ramp iris3']);
    expect(errorsOf(r)).toEqual(['error: palette: missing iris ramp iris3']);
    expect(formatReport(r)).not.toContain(NO_IRIS);
    expect(r.ok).toBe(false);
  });

  it('a palette with no iris ramp at all is information, not an error, and the pack is OK', () => {
    const r = checkPack(OLD_FORMAT);
    expect(r.structure).toEqual([]);
    expect(r.info).toEqual([NO_IRIS.slice('info: '.length)]);
    expect(formatReport(r).split('\n')).toContain(NO_IRIS);
    expect(r.ok).toBe(true);
  });

  it('the full set of iris ramps prints neither the error nor the information line', () => {
    const r = checkPack(GOOD);
    expect(r.info).toEqual([]);
    expect(formatReport(r)).not.toContain('iris ramp');
  });

  it('a correct near0_2 is accepted; near0_5 and near3_2 are errors', () => {
    const good = checkPack(planted('near3:10,5', 'near3:10,5,near0_2:2,5,far0_3:0,5,near1_3:4,5'));
    expect(good.structure).toEqual([]);
    expect(good.ok).toBe(true);
    const bad = checkPack(planted('near3:10,5', 'near3:10,5,near0_5:1,5,near3_2:10,5'));
    expect(bad.structure).toEqual([
      `part ${TORSO_ID} frame rest: attach point near0_5 is for a leg count that never uses it`,
      `part ${TORSO_ID} frame rest: attach point near3_2 is for a leg count that never uses it`,
    ]);
    expect(bad.ok).toBe(false);
  });

  it('a leg-count suffix on a name that is not a leg point has its own line; a zero leg count or a leg index beyond the side is an error', () => {
    const bad = checkPack(planted('near3:10,5', 'near3:10,5,head_2:10,1,tail_3:1,1,back_2:6,-1,near0_0:1,5,far1_3:3,5'));
    expect(bad.structure).toEqual([
      `part ${TORSO_ID} frame rest: attach point head_2 is never used: only far<i>_<n> and near<i>_<n> take a leg count`,
      `part ${TORSO_ID} frame rest: attach point tail_3 is never used: only far<i>_<n> and near<i>_<n> take a leg count`,
      `part ${TORSO_ID} frame rest: attach point back_2 is never used: only far<i>_<n> and near<i>_<n> take a leg count`,
      `part ${TORSO_ID} frame rest: attach point near0_0 is for a leg count that never uses it`,
      `part ${TORSO_ID} frame rest: attach point far1_3 is for a leg count that never uses it`,
    ]);
    expect(checkPack(GOOD).structure).toEqual([]);
  });

  it('heads need no feature point in a pack without head features', () => {
    expect(checkPack(GOOD).structure).toEqual([]);
  });

  it('a head kind needs a feature point once the pack has a head feature drawn for that kind', () => {
    const line = 'part quadruped/head/h0/small/v0 frame rest: missing attach point feature';
    const feature = (kind: string): string => `\npart quadruped/headFeature/${kind}/small/v0\nframe rest anchor=0,0\n1\n`;
    const r = checkPack(GOOD + feature('horns-h0'));
    expect(r.structure).toEqual([line]);
    expect(r.ok).toBe(false);
    expect(checkPack(planted(',eye7:4,3', ',eye7:4,3,feature:3,0') + feature('horns-h0')).structure).toEqual([]);
    // A head feature for another head kind, or at another tier, asks nothing of this head.
    expect(checkPack(GOOD + feature('horns-h3')).structure).toEqual([]);
    expect(checkPack(GOOD + feature('horns-h0').replaceAll('/small/', '/large/')).structure).not.toContain(line);
  });

  it('a repeated value in a flow layer is not a split spot; the same shape in the spots layer is', () => {
    const shape = '..3416789abc\n123456789abc\n123456789abc\n123456789abc\n123456789abc\n123456789abc\n';
    const spotsRows = '............\n.11.....22..\n.11.....22..\n............\n....33......\n....33......\n';
    const flow = checkPack(planted('layer flow\n..3456789abc\n', 'layer flow\n..3416789abc\n', layered));
    expect(flow.structure).toEqual([]);
    const spots = checkPack(planted(`layer spots\n${spotsRows}`, `layer spots\n${shape}`, layered));
    expect(spots.structure).toEqual([`part ${TORSO_ID} frame rest: spot value 1 is in 2 blobs`]);
  });
});

describe('checkPack reaches every leg count a leg-count entry names', () => {
  const V1 = 'quadruped/nearLimbs/leg/small/v1';
  const secondLeg = `\npart ${V1}\nframe rest anchor=0,0\n33\n33\n33\n33\n33\n11\n`;

  it('forces a limb variant at two legs when a legs=2 entry exists, and finds the leg it pushes off the canvas', () => {
    const r = checkPack(planted('pose rest\n', 'pose rest\nentry nearLimbs 0 rest 0 30 legs=2\n') + secondLeg);
    const twoLegs = limbGene(2);
    expect(r.hidden.some((d) => d.variant === V1 && d.genome['limbs'] === twoLegs && d.pose === 'rest')).toBe(true);
    // Without the entry the variant is forced at eight legs only.
    const plain = checkPack(GOOD + secondLeg);
    expect(plain.hidden).toEqual([]);
    expect(plain.variants).toBe(2);
  });

  it('forces a limb variant at each leg count a leg-count attach name is written for', () => {
    const r = checkPack(planted('near3:10,5', 'near3:10,5,near0_2:1,40') + secondLeg);
    expect(r.structure).toEqual([]);
    expect(r.hidden.some((d) => d.variant === V1 && d.genome['limbs'] === limbGene(2))).toBe(true);
  });

  it('a legs= entry for a limb that leg count never draws is an error', () => {
    const fine = checkPack(planted('pose rest\n', 'pose rest\nentry nearLimbs 0 rest 0 0 legs=2\nentry farLimbs 0 rest 0 0 legs=2\nentry nearLimbs 1 rest 0 0 legs=3\nentry head 0 rest 0 0 legs=0\n'));
    expect(fine.structure).toEqual([]);
    expect(fine.ok).toBe(true);
    const r = checkPack(planted('pose rest\n', 'pose rest\nentry nearLimbs 3 rest 0 0 legs=2\nentry farLimbs 0 rest 0 0 legs=0\nentry farLimbs 1 rest 0 0 legs=3\n'));
    expect(r.structure).toEqual([
      'scaffold quadruped/sturdy/small pose rest: entry nearLimbs 3 legs=2 is for a leg that count never draws',
      'scaffold quadruped/sturdy/small pose rest: entry farLimbs 0 legs=0 is for a leg that count never draws',
      'scaffold quadruped/sturdy/small pose rest: entry farLimbs 1 legs=3 is for a leg that count never draws',
    ]);
    expect(r.ok).toBe(false);
  });

  it('a legs= entry naming a frame the part lacks is an error gap', () => {
    const r = checkPack(planted('pose rest\n', 'pose rest\nentry nearLimbs 0 stand 0 0 legs=2\n'));
    expect(r.gaps.find((g) => g.gap === 'frame:quadruped/nearLimbs/leg/small/v0:stand')).toMatchObject({ error: true });
    expect(r.ok).toBe(false);
  });
});

describe('checkPack neck join', () => {
  // The head body as drawn (shade 1, bottom row shade 0) and the torso (shade 1, bottom row shade 0).
  const HEAD_ROWS = '666666\n666666\n666666\n666666\n555555\n';

  it('a neck one shade step apart is silent; two steps apart is a warning that names the head and the torso, and the pack is still OK', () => {
    expect(checkPack(GOOD).neck).toEqual([]);
    // One step, across two ramps: accent shades 2 and 1 on the head against primary shade 1 everywhere on the torso.
    const oneStep = planted(HEAD_ROWS, '777777\n777777\n777777\n777777\n666666\n', planted(TORSO_ROWS, TORSO_ROWS.replace('111111111111', '222222222222')));
    const quiet = checkPack(oneStep);
    expect(quiet.neck).toEqual([]);
    expect(quiet.ok).toBe(true);
    // Two steps: accent shade 3 on the head against primary shade 1 on the torso.
    const twoSteps = planted(HEAD_ROWS, '888888\n888888\n888888\n888888\n888888\n', planted(TORSO_ROWS, TORSO_ROWS.replace('111111111111', '222222222222')));
    const r = checkPack(twoSteps);
    expect(r.neck).toHaveLength(1);
    // Head pixels ever beside open torso, over the nine shifts (head frame 6x5 at torso 10,1; torso 12x6): the left column
    // (5), and the second and third pixels of the top and bottom rows (2 + 2). Seven poses at nine shifts, four legs: 63 cases.
    expect(r.neck[0]).toEqual({ head: 'quadruped/head/h0/small/v0', torso: TORSO_ID, pixels: 9, cases: 63, example: 'head rest 0,0 value 8 beside torso rest 8,0 value 2' });
    expect(r.ok).toBe(true);
    const text = formatReport(r);
    expect(text.split('\n')[0]).toBe('check-pack: OK');
    const warnings = text.split('\n').filter((l) => l.startsWith('warning: neck join'));
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toBe('warning: neck join quadruped/head/h0/small/v0 on quadruped/torso/sturdy/small/v0: 9 head pixels more than one shade step from the torso beside them, in 63 pose shifts, e.g. head rest 0,0 value 8 beside torso rest 8,0 value 2');
  });

  it('counts only head pixels beside torso pixels the head does not cover, both ramp values', () => {
    // The torso is primary shade 3 throughout. The head is an eye-value (13) ring round accent shade 0: the ring is never a
    // join pixel (not a ramp value), and the shade-0 inside, three steps from the torso it covers, only ever touches head pixels.
    const ringed = planted(HEAD_ROWS, 'dddddd\nd5555d\nd5555d\nd5555d\ndddddd\n', planted(TORSO_ROWS, '444444444444\n'.repeat(6)));
    expect(checkPack(ringed).neck).toEqual([]);
  });

  it('checks every leg count a legs= entry of the torso or head names', () => {
    // The head gains a frame `low`, accent shade 3, used only by a two-legged creature in the rest pose.
    const attach = 'attach=eye0:1,1,eye1:2,1,eye2:3,1,eye3:4,1,eye4:1,3,eye5:2,3,eye6:3,3,eye7:4,3';
    const withLow = planted(HEAD_ROWS, `${HEAD_ROWS}frame low anchor=0,0 ${attach}\n888888\n888888\n888888\n888888\n888888\n`);
    expect(checkPack(withLow).neck).toEqual([]);
    const r = checkPack(planted('pose rest\n', 'pose rest\nentry head 0 low 0 0 legs=2\n', withLow));
    expect(r.neck).toHaveLength(1);
    expect(r.neck[0]).toEqual({ head: 'quadruped/head/h0/small/v0', torso: TORSO_ID, pixels: 9, cases: 9, example: 'head low 0,0 value 8 beside torso rest 8,0 value 2' });
    expect(r.ok).toBe(true);
  });
});

describe('checkPack neck join pairings', () => {
  const head = (kind: string, rows: string): string => `\npart quadruped/head/${kind}/small/v0\nframe rest anchor=0,0 attach=eye0:1,1,eye1:2,1,eye2:3,1,eye3:4,1,eye4:1,3,eye5:2,3,eye6:3,3,eye7:4,3\n${rows}`;
  const torsoBlock = PARTS.slice(PARTS.indexOf(`part ${TORSO_ID}`), PARTS.indexOf('part quadruped/head/'));
  const torsoV1 = '\n' + torsoBlock.replace(TORSO_ID, 'quadruped/torso/sturdy/small/v1');
  const BAD = '888888\n888888\n888888\n888888\n888888\n';

  it('checks every head kind with every variant of the scaffold torso', () => {
    const oneBad = checkPack(GOOD + torsoV1 + head('h1', BAD));
    expect(oneBad.neck.map((n) => `${n.head} on ${n.torso}`)).toEqual([
      'quadruped/head/h1/small/v0 on quadruped/torso/sturdy/small/v0',
      'quadruped/head/h1/small/v0 on quadruped/torso/sturdy/small/v1',
    ]);
    const allBad = checkPack(planted('666666\n666666\n666666\n666666\n555555\n', BAD) + torsoV1 + head('h1', BAD));
    expect(allBad.neck.map((n) => `${n.head} on ${n.torso}`)).toEqual([
      'quadruped/head/h0/small/v0 on quadruped/torso/sturdy/small/v0',
      'quadruped/head/h1/small/v0 on quadruped/torso/sturdy/small/v0',
      'quadruped/head/h0/small/v0 on quadruped/torso/sturdy/small/v1',
      'quadruped/head/h1/small/v0 on quadruped/torso/sturdy/small/v1',
    ]);
  });
});

/**
 * The text with a flow and a spots layer added after the rows of every frame of every torso, head, tail and limb part
 * (fallbacks left alone): flow numbers each drawn pixel by its column, cycling 1 to f; spots is the whole drawn area as
 * one blob. Every frame here is one rectangle of ramp values, so both layers are valid.
 */
function withLayers(text: string): string {
  const blocks = text.split('\n\n');
  return blocks.map((block) => {
    const lines = block.split('\n');
    const head = lines.findIndex((l) => l.startsWith('part '));
    if (head < 0 || !/^part quadruped\/(torso|head|tail|farLimbs|nearLimbs)\//.test(lines[head]!) || lines[head]!.includes('/fallback/')) return block;
    const rows = lines.slice(head + 2).filter((l) => l !== '');
    const flow = rows.map((row) => [...row].map((c, x) => (/[1-9abc]/.test(c) ? '123456789abcdef'[x % 15] : '.')).join(''));
    const spots = rows.map((row) => [...row].map((c) => (/[1-9abc]/.test(c) ? '1' : '.')).join(''));
    return [...lines.slice(0, head + 2), ...rows, 'layer flow', ...flow, 'layer spots', ...spots].join('\n') + '\n';
  }).join('\n\n');
}

describe('checkPack sweeps every pattern and every skin with a back part', () => {
  // A back part sitting on the torso's back point (6,-1): two rows above the torso, the lower one touching it.
  const BACK = '\npart quadruped/back/ridge-sturdy/small/v0\nframe rest anchor=0,1\n4444\n2222\n';

  it('composes 7 poses x (7 patterns + 7 skins) more creatures for one scaffold and one head kind than before', () => {
    // 133 before this sweep (the base sample, the shift sweep and nothing forced).
    expect(checkPack(GOOD).composed).toBe(133 + 98);
  });

  it('a back part on top of the torso is silent; one drawn wholly inside the torso is a hidden part naming its id', () => {
    const fine = checkPack(GOOD + BACK);
    expect(fine.hidden).toEqual([]);
    expect(fine.detached).toEqual([]);
    expect(errorsOf(fine)).toEqual([]);
    expect(fine.gaps.some((g) => g.gap.startsWith('missing:quadruped/back/ridge-'))).toBe(false);
    const inside = checkPack(GOOD + BACK.replace('anchor=0,1\n4444\n2222', 'anchor=0,-3\n22\n22'));
    expect(inside.hidden.length).toBeGreaterThan(0);
    expect(new Set(inside.hidden.map((d) => d.partId))).toEqual(new Set(['quadruped/back/ridge-sturdy/small/v0']));
    // Only the creature with skin 0 (scaled, ridge) carries it: the skin sweep reached it.
    expect(new Set(inside.hidden.map((d) => d.genome['skin']))).toEqual(new Set([0]));
    expect(errorsOf(inside).some((l) => l.startsWith('error: hidden part quadruped/back/ridge-sturdy/small/v0 on quadruped/sturdy/small'))).toBe(true);
    expect(inside.ok).toBe(false);
  });

  it('a head feature drawn wholly inside the head and a role leg drawn off the canvas are hidden parts', () => {
    const horned = planted(',eye7:4,3', ',eye7:4,3,feature:3,1').replaceAll('sturdy', 'horned');
    const feature = (rows: string): string => `\npart quadruped/headFeature/horns-h0/small/v0\nframe rest anchor=0,${rows === '66' ? 0 : 2}\n${rows}\n`;
    expect(checkPack(horned + feature('7777\n7777')).hidden).toEqual([]);
    const hiddenHorns = checkPack(horned + feature('66'));
    expect(new Set(hiddenHorns.hidden.map((d) => d.partId))).toEqual(new Set(['quadruped/headFeature/horns-h0/small/v0']));
    expect(hiddenHorns.ok).toBe(false);
    const mid = (anchor: string): string => `\npart quadruped/nearLimbs/mid/small/v0\nframe rest anchor=${anchor}\n33\n33\n33\n33\n33\n11\n`;
    expect(checkPack(GOOD + mid('0,0')).hidden).toEqual([]);
    const lost = checkPack(GOOD + mid('-100,0'));
    expect(new Set(lost.hidden.map((d) => d.partId))).toEqual(new Set(['quadruped/nearLimbs/mid/small/v0']));
    expect(lost.ok).toBe(false);
  });

  it('a back part or a head feature whose attach point is moved off the body is reported detached, by slot', () => {
    const onBack = checkPack(GOOD + BACK);
    expect(errorsOf(onBack)).toEqual([]);
    // The back point raised from 6,-1 to 6,-4: the part's lower row ends two rows above the torso.
    const looseBack = checkPack(planted('back:6,-1,', 'back:6,-4,') + BACK);
    expect(errorsOf(looseBack).filter((l) => l.startsWith('error: detached back on quadruped/sturdy/small ')).length).toBe(1);
    expect(new Set(looseBack.detached.flatMap((d) => d.off))).toEqual(new Set(['back']));
    expect(looseBack.ok).toBe(false);
    const feature = '\npart quadruped/headFeature/horns-h0/small/v0\nframe rest anchor=0,2\n7777\n7777\n';
    const horned = (point: string): string => planted(',eye7:4,3', `,eye7:4,3,feature:${point}`).replaceAll('sturdy', 'horned') + feature;
    expect(errorsOf(checkPack(horned('3,1')))).toEqual([]);
    // The feature point raised from 3,1 to 3,-4: the feature's lower row ends two rows above the head.
    const looseFeature = checkPack(horned('3,-4'));
    expect(errorsOf(looseFeature).filter((l) => l.startsWith('error: detached headFeature on quadruped/horned/small ')).length).toBe(1);
    expect(new Set(looseFeature.detached.flatMap((d) => d.off))).toEqual(new Set(['headFeature']));
    expect(looseFeature.ok).toBe(false);
  });

  it('a painted mark is never read as a detached or hidden slot', () => {
    const layered = withLayers(GOOD);
    expect(layered).not.toBe(GOOD);
    const marked = checkPack(layered);
    expect(marked.parseError).toBeNull();
    expect(marked.structure).toEqual([]);
    // With layers on every part the patterned creatures are painted: no marks: gap is left.
    expect(marked.gaps.filter((g) => g.gap.startsWith('marks:'))).toEqual([]);
    expect(marked.detached).toEqual(checkPack(GOOD).detached);
    expect(marked.hidden).toEqual(checkPack(GOOD).hidden);
    expect(marked.ok).toBe(true);
    // The same with a near leg that really is detached (hung two columns left of the torso): the slots named are the same
    // with and without marks. A mark painted on its label (4, the lightest shade) would read as 8, the head feature's label.
    const loose = planted('near0:1,5,', 'near0:-4,5,');
    const plainLoose = checkPack(loose);
    expect(plainLoose.detached.length).toBeGreaterThan(0);
    expect(new Set(plainLoose.detached.flatMap((d) => d.off))).toEqual(new Set(['nearLimbs']));
    const markedLoose = checkPack(withLayers(loose));
    expect(markedLoose.gaps.filter((g) => g.gap.startsWith('marks:'))).toEqual([]);
    expect(markedLoose.detached).toEqual(plainLoose.detached);
  });
});

describe('checkPack shift sweep at each leg count', () => {
  it('sweeps the head shifts at a leg count a legs= entry is written for', () => {
    // At two legs the rest pose moves the head two columns right: flush against the torso, so a +1 shift opens a gap.
    const r = checkPack(planted('pose rest\n', 'pose rest\nentry head 0 rest 2 0 legs=2\n'));
    const twoLegs = r.detached.filter((d) => d.genome['limbs'] === limbGene(2) && d.pose === 'rest' && d.variant === undefined);
    expect(new Set(twoLegs.map((d) => d.shift.head.join(',')))).toEqual(new Set(['1,-1', '1,0', '1,1']));
    expect(r.ok).toBe(false);
  });
});

describe('checkPack forced variants keep the creature\'s mark', () => {
  it('a forced head variant with no layers on a patterned creature counts its marks: gap', () => {
    // No sampled creature picks head variant v3 (buildRecipe picks v0 to v2): its marks: gap comes from the forced pass
    // alone, one per pose, and only because the swapped part keeps the creature's mark (a part with no mark is never painted).
    const large = withLayers(GOOD).replaceAll('/small', '/large').replace('part quadruped/head/h0/large/v0', 'part quadruped/head/h9/large/v0');
    const HEAD_ROWS = 'frame rest anchor=0,0 attach=eye0:1,1,eye1:2,1,eye2:3,1,eye3:4,1,eye4:1,3,eye5:2,3,eye6:3,3,eye7:4,3\n666666\n666666\n666666\n666666\n555555\n';
    const r = checkPack(`${large}\npart quadruped/head/h9/large/v3\n${HEAD_ROWS}`);
    expect(r.parseError).toBeNull();
    expect(r.variants).toBe(2);
    expect(r.gaps.find((g) => g.gap === 'marks:quadruped/head/h9/large/v3:rest')).toEqual({ gap: 'marks:quadruped/head/h9/large/v3:rest', count: 7, error: false });
    // The head that sampled creatures do pick has layers: it is painted and has no marks: gap.
    expect(r.gaps.some((g) => g.gap.startsWith('marks:quadruped/head/h9/large/v0'))).toBe(false);
    expect(r.ok).toBe(true);
  });
});

describe('checkPack lists every marks: gap a pose can show, as x0 when no sampled creature drew it', () => {
  const marksOf = (r: PackReport): string[] => r.gaps.filter((g) => g.gap.startsWith('marks:')).map((g) => `${g.gap} x${g.count}`);
  const TAIL_T1 = '\npart quadruped/tail/t1/small/v0\nframe rest anchor=4,0\n22222\n11111\n';
  const HEAD_ATTACH = 'attach=eye0:1,1,eye1:2,1,eye2:3,1,eye3:4,1,eye4:1,3,eye5:2,3,eye6:3,3,eye7:4,3';

  it('a fully layered pack lists none', () => {
    expect(marksOf(checkPack(withLayers(GOOD)))).toEqual([]);
  });

  it('a tail other than the highest, unlayered among layered parts, is listed at x0', () => {
    // Patterned creatures are sampled with the highest tail kind only (t2 here), so no composed creature paints t1.
    const r = checkPack(withLayers(GOOD.replace('part quadruped/tail/t1/', 'part quadruped/tail/t2/')) + TAIL_T1);
    expect(r.parseError).toBeNull();
    expect(marksOf(r)).toEqual(['marks:quadruped/tail/t1/small/v0:rest x0']);
    expect(formatReport(r).split('\n')).toContain('info: gap marks:quadruped/tail/t1/small/v0:rest (x0)');
    expect(r.ok).toBe(true);
  });

  it('a frame only a legs=2 entry shows is listed; a frame no entry reaches is not', () => {
    // The head gains two unlayered frames after its layers: `low`, shown in rest by a two-legged creature, and `spare`, shown by none.
    const frames = `frame low anchor=0,0 ${HEAD_ATTACH}\n666666\n666666\n666666\n666666\n555555\n\nframe spare anchor=0,0 ${HEAD_ATTACH}\n666666\n666666\n666666\n666666\n555555\n`;
    const text = planted('pose rest\n', 'pose rest\nentry head 0 low 0 0 legs=2\n', planted('\npart quadruped/tail/t1', `${frames}\npart quadruped/tail/t1`, withLayers(GOOD)));
    const r = checkPack(text);
    expect(r.parseError).toBeNull();
    expect(marksOf(r)).toEqual(['marks:quadruped/head/h0/small/v0:low x0']);
    expect(r.ok).toBe(true);
  });

  it('a shared leg\'s frame only a two-legged creature shows is listed: the pack has no hind leg, so the shared leg stands in', () => {
    const lift = 'frame lift anchor=0,0\n33\n33\n33\n33\n33\n11\n';
    const text = planted('pose rest\n', 'pose rest\nentry nearLimbs 0 lift 0 0 legs=2\n', planted('\npart quadruped/eyes/', `${lift}\npart quadruped/eyes/`, withLayers(GOOD)));
    const r = checkPack(text);
    expect(r.parseError).toBeNull();
    expect(marksOf(r)).toEqual(['marks:quadruped/nearLimbs/leg/small/v0:lift x0']);
    // With a hind leg of its own (layered), the two-legged creature never shows the shared leg's lift frame.
    const hind = '\npart quadruped/nearLimbs/hind/small/v0\nframe rest anchor=0,0\n33\n33\n33\n33\n33\n11\nlayer flow\n12\n12\n12\n12\n12\n12\nlayer spots\n11\n11\n11\n11\n11\n11\n';
    expect(marksOf(checkPack(text + hind))).toEqual([]);
  });

  it('a variant with flow but no spots is listed, though its forced (striped) creature is painted', () => {
    // No sampled creature picks head variant v3; the forced pass paints it striped, which reads flow alone.
    const v3 = `\npart quadruped/head/h0/small/v3\nframe rest anchor=0,0 ${HEAD_ATTACH}\n666666\n666666\n666666\n666666\n555555\nlayer flow\n123456\n123456\n123456\n123456\n123456\n`;
    const r = checkPack(withLayers(GOOD) + v3);
    expect(r.parseError).toBeNull();
    expect(r.variants).toBe(2);
    expect(marksOf(r)).toEqual(['marks:quadruped/head/h0/small/v3:rest x0']);
  });
});

/** The limbs gene for a leg count. */
const limbGene = (legs: number): number => (LIMB_COUNTS as readonly number[]).indexOf(legs);

describe('checkPack sweeps head and tail shifts independently', () => {
  it('reports a tail that hangs from the head alone when head and tail shift in opposite directions', () => {
    // The tail is attached past the head's front, touching only the head: moving together they stay joined.
    const r = checkPack(planted('attach=head:10,1,tail:1,1,', 'attach=head:10,1,tail:20,2,'));
    // It comes loose exactly when the tail ends up right of where the head moved: every such pair of the 81 is composed.
    const apart = new Set(r.detached.filter((d) => d.off.includes('tail')).map((d) => `${d.shift.head} ${d.shift.tail}`));
    const expected = new Set<string>();
    for (const hy of [-1, 0, 1]) for (const ty of [-1, 0, 1]) for (const [hx, tx] of [[-1, 0], [-1, 1], [0, 1]]) expected.add(`${hx},${hy} ${tx},${ty}`);
    expect(apart).toEqual(expected);
    expect(r.ok).toBe(false);
  });
});

describe('checkPack composes every variant', () => {
  const FLUSH = 'frame rest anchor=-2,0 attach=eye0:1,1,eye1:2,1,eye2:3,1,eye3:4,1,eye4:1,3,eye5:2,3,eye6:3,3,eye7:4,3\n666666\n666666\n666666\n666666\n555555\n';
  const GOOD_HEAD = 'frame rest anchor=0,0 attach=eye0:1,1,eye1:2,1,eye2:3,1,eye3:4,1,eye4:1,3,eye5:2,3,eye6:3,3,eye7:4,3\n666666\n666666\n666666\n666666\n555555\n';
  it('forces each head variant into a creature, at its nine shifts, and reports the one drawn flush against the torso', () => {
    const r = checkPack(`${GOOD}\npart quadruped/head/h0/small/v1\n${GOOD_HEAD}\npart quadruped/head/h0/small/v2\n${FLUSH}`);
    expect(r.variants).toBe(3);
    const forced = r.detached.filter((d) => d.variant !== undefined);
    expect(new Set(forced.map((d) => d.variant))).toEqual(new Set(['quadruped/head/h0/small/v2']));
    expect(new Set(forced.map((d) => d.shift.head[0]))).toEqual(new Set([1]));
    expect(errorsOf(r).some((l) => l.startsWith('error: detached head on quadruped/sturdy/small '))).toBe(true);
    expect(r.ok).toBe(false);
  });
  it('finds a defective variant that no sampled creature picks, through the forced pass alone', () => {
    // buildRecipe picks a head variant from 0 to VARIANTS.head - 1 (v0 to v2), so no sampled creature ever picks v3.
    // v3 is drawn far off the torso, so it is loose at every shift: had any sampled creature picked it, a finding
    // without a forced variant would name it. Only forcing v3 into a creature finds it.
    const large = GOOD.replaceAll('/small', '/large').replace('part quadruped/head/h0/large/v0', 'part quadruped/head/h9/large/v0');
    const FAR = FLUSH.replace('anchor=-2,0', 'anchor=-10,0');
    expect(VARIANTS.head).toBe(3);
    const r = checkPack(`${large}\npart quadruped/head/h9/large/v1\n${GOOD_HEAD}\npart quadruped/head/h9/large/v3\n${FAR}`);
    expect(r.parseError).toBeNull();
    expect(r.unreachable).toEqual([]);
    expect(r.variants).toBe(3);
    expect(r.detached.length).toBeGreaterThan(0);
    expect(r.detached.filter((d) => d.variant === undefined)).toEqual([]);
    expect(new Set(r.detached.map((d) => d.variant))).toEqual(new Set(['quadruped/head/h9/large/v3']));
    expect(new Set(r.detached.map((d) => d.shift.head.join(',')))).toHaveProperty('size', 9);
    expect(errorsOf(r).some((l) => l.startsWith('error: detached head on quadruped/sturdy/large ') && l.endsWith('with variant quadruped/head/h9/large/v3'))).toBe(true);
    expect(r.ok).toBe(false);
  });
  it('composes nothing extra for a pack with one variant per part type', () => {
    expect(checkPack(GOOD).variants).toBe(0);
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
      // A pack in the art agent's present format (no iris ramps) checks OK, exit 0.
      writeFileSync(join(dir, 'old.txt'), OLD_FORMAT);
      const old = run([join(dir, 'old.txt')]);
      expect(old.stdout.split('\n')[0]).toBe('check-pack: OK');
      expect(old.stdout.split('\n')).toContain(NO_IRIS);
      expect(old.status).toBe(0);
      // A neck two shade steps apart is a warning only: the command still exits 0.
      writeFileSync(join(dir, 'parts.txt'), (PARTS.trimStart() + SCAFFOLD).replace('666666\n666666\n666666\n666666\n555555\n', '888888\n888888\n888888\n888888\n888888\n'));
      const warned = run([join(dir, 'palette.txt'), join(dir, 'parts.txt')]);
      expect(warned.stdout.split('\n')[0]).toBe('check-pack: OK');
      expect(warned.stdout.split('\n').filter((l) => l.startsWith('warning: neck join'))).toHaveLength(1);
      expect(warned.status).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
