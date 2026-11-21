import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIMB_COUNTS, VARIANTS, parseCatalogueText } from '@cf/art-format';
import { describe, expect, it } from 'vitest';
import { assemble } from '@cf/art-compose';
import { bodyOf, buildRoutedRecipe, EYELESS_HEAD, resolveAnatomy, torsoKindOf, WING_KINDS } from '@cf/art-recipe';
import { checkPack, detachedSlots, formatReport, frameOrigin, gapIsInfo, generatedTorsos, labelPicture, neckJoins, numberedCopy, routeStates, shapedGenome, TORSO_POINTS_BY_FAMILY, type PackReport } from '../tools/check-pack.mjs';
import type { Recipe } from '@cf/art-recipe';
import type { Part } from '@cf/art-format';

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

  it('a pack holding sails, which no creature on today\'s path asks for, checks as the same pack without them, but for their marks: lines', () => {
    const extra = ['sails', 'sails-sturdy'].map((kind) => `\npart quadruped/nearWings/${kind}/small/v0\nframe rest anchor=0,0\n2\n`).join('');
    const r = checkPack(GOOD + extra);
    const base = checkPack(GOOD);
    expect(r.summary!.bySlot).toMatchObject({ nearWings: 2 });
    const notSails = r.gaps.filter((g) => !g.gap.startsWith('marks:quadruped/nearWings/'));
    expect({ ...r, gaps: notSails, summary: null }).toEqual({ ...base, summary: null });
  });

  it('a detached wing is reported as farWings', () => {
    // A label picture: the torso (label 1) and, two columns away, one pixel of another slot's label.
    const off = (label: number): string[] | null => detachedSlots({ w: 4, h: 1, pixels: Uint8Array.from([1, 1, 0, label]) });
    expect(off(11)).toEqual(['farWings']);
    expect(off(12)).toEqual(['nearWings']);
    expect(off(6)).toEqual(['bodyFeature']);
    // Every slot that was labelled before keeps its label.
    expect([2, 3, 4, 5, 7, 8, 9, 10].map((v) => off(v))).toEqual([['tail'], ['farLimbs'], ['nearLimbs'], ['head'], ['back'], ['headFeature'], ['glow'], ['eyes']]);
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

  it('an eye named for no species is an error', () => {
    const lost = checkPack(`${GOOD}\npart quadruped/eyes/otter/small/v0\nframe rest anchor=0,0\n11\n`);
    expect(lost.unreachable).toEqual(["part quadruped/eyes/otter/small/v0: no creature asks for an eye named 'otter' (eye, or the key of a species of this family and tier)"]);
    expect(lost.ok).toBe(false);
    expect(checkPack(GOOD).unreachable).toEqual([]);
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

  it('a skin layer on a back part is an error', () => {
    // The slot rule, now for skin layers: a back part takes no marks and no skin, so a layer named for a skin is an error.
    const line = 'error: part quadruped/back/plates/small/v0: layers on a slot that takes no marks';
    const back = 'part quadruped/back/plates/small/v0\nframe rest anchor=0,0\n2\n';
    const bare = checkPack(planted('\npart quadruped/torso/fallback/small/v0', `\n${back}\npart quadruped/torso/fallback/small/v0`));
    expect(bare.parseError).toBeNull();
    expect(errorsOf(bare)).not.toContain(line);
    const r = checkPack(planted('\npart quadruped/torso/fallback/small/v0', `\n${back}layer scaled\n1\n\npart quadruped/torso/fallback/small/v0`));
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

// A named species beside the good pack: its own torso, head and tail (kind civet), the shared legs and eye, its own
// scaffold and ramps. The torso and head are primary shades 2 and 3, so the species' own neck join is quiet, while
// its head sits two shade steps from the sturdy torso (shades 1 and 0): a sign if it were ever paired with it.
const CIVET_RAMPS = 'ramp civet 0 1 1 1\nramp civet-accent 0 1 1 1\nramp civet-under 0 1 1 1\n';
const CIVET_PARTS = `
species civet quadruped small legs=4 eyes=2 iris=0 tail=1

part quadruped/torso/civet/small/v0
frame rest anchor=0,0 attach=head:10,1,tail:1,1,far0:0,5,far1:3,5,near0:1,5,near1:4,5
333333333333
333333333333
333333333333
333333333333
333333333333
444444444444

part quadruped/head/civet/small/v0
frame rest anchor=0,0 attach=eye0:1,1,eye1:2,1
444444
444444
444444
444444
444444

part quadruped/tail/civet/small/v0
frame rest anchor=4,0
33333
44444
`;
const CIVET_SCAFFOLD = SCAFFOLD.replace('quadruped/sturdy/small', 'quadruped/civet/small').replace(/fallback .*\n/, '');
const WITH_CIVET = planted('outline 0\n', `${CIVET_RAMPS}outline 0\n`, PALETTE) + PARTS + SCAFFOLD + CIVET_PARTS + CIVET_SCAFFOLD;
const CIVET_ID = 'quadruped/civet/small';

describe('checkPack on a named species', () => {
  it('a good pack plus a complete small species checks OK and counts it', () => {
    const base = checkPack(GOOD);
    const r = checkPack(WITH_CIVET);
    expect(errorsOf(r)).toEqual([]);
    expect(r.ok).toBe(true);
    expect(r.summary).toMatchObject({ species: 1, scaffolds: 2 });
    expect(base.summary).toMatchObject({ species: 0 });
    expect(formatReport(r).split('\n')[2]).toBe('scaffolds: 2, fallbacks: 1, species: 1, palette colours: 2, ramps: 11');
    // Composed once in every pose the scaffold defines, and its own neck join is quiet.
    expect(r.composed).toBe(base.composed + 7);
    expect(r.neck).toEqual([]);
  });

  it('a species line with no scaffold is an error', () => {
    expect(checkPack(WITH_CIVET).unreachable).toEqual([]);
    const r = checkPack(WITH_CIVET.replace(CIVET_SCAFFOLD, ''));
    expect(r.unreachable).toEqual([`species civet: no scaffold ${CIVET_ID}`]);
    expect(errorsOf(r)).toContain(`error: species civet: no scaffold ${CIVET_ID}`);
    expect(r.ok).toBe(false);
  });

  it('a species ramp the palette lacks is an error', () => {
    expect(checkPack(WITH_CIVET).structure).toEqual([]);
    const r = checkPack(planted('ramp civet-under 0 1 1 1\n', '', WITH_CIVET));
    expect(r.structure).toEqual(['species civet: palette has no ramp civet-under']);
    expect(r.ok).toBe(false);
    const iris = checkPack(planted('iris=0', 'iris=7', planted('ramp iris7 0 1 0 1\n', 'ramp iris7x 0 1 0 1\n', WITH_CIVET)));
    expect(iris.structure).toContain('species civet: palette has no ramp iris7');
  });

  it('a missing species head is an error gap', () => {
    const r = checkPack(planted('part quadruped/head/civet/small/v0', 'part quadruped/head/civet/small/v1', WITH_CIVET));
    expect(r.gaps.find((g) => g.gap === 'missing:quadruped/head/civet/small/v0')).toMatchObject({ count: 7, error: true });
    expect(r.ok).toBe(false);
    expect(checkPack(WITH_CIVET).gaps.some((g) => g.gap.includes('civet'))).toBe(false);
  });

  it('a species touching the canvas edge is an error, reported by its key', () => {
    expect(checkPack(WITH_CIVET).edge).toEqual([]);
    const r = checkPack(planted(`scaffold ${CIVET_ID} origin=16,12`, `scaffold ${CIVET_ID} origin=2,12`, WITH_CIVET));
    expect(r.edge.length).toBeGreaterThan(0);
    expect(r.edge.every((e) => e.scaffold === CIVET_ID && e.genome['species'] === 'civet')).toBe(true);
    expect(errorsOf(r).find((l) => l.startsWith(`error: touches the canvas edge on ${CIVET_ID}`))).toContain('e.g. species civet pose rest');
    expect(r.ok).toBe(false);
  });

  it('a species part off the body is an error, reported by its key', () => {
    expect(checkPack(WITH_CIVET).detached).toEqual([]);
    // The species tail hangs eight columns left of the torso's end: it no longer touches the torso.
    const r = checkPack(planted('attach=head:10,1,tail:1,1,far0', 'attach=head:10,1,tail:-8,1,far0', WITH_CIVET));
    expect(r.detached).toHaveLength(7);
    expect(r.detached.every((d) => d.scaffold === CIVET_ID && d.genome['species'] === 'civet' && d.off.join() === 'tail')).toBe(true);
    expect(errorsOf(r).find((l) => l.startsWith(`error: detached tail on ${CIVET_ID} in 7 creature poses`))).toContain('e.g. species civet pose rest');
    expect(r.ok).toBe(false);
  });

  it('a species head is not sampled as a generated head: the generated counts are the same with and without it', () => {
    const without = checkPack(planted('outline 0\n', `${CIVET_RAMPS}outline 0\n`, PALETTE) + PARTS + SCAFFOLD);
    const r = checkPack(WITH_CIVET);
    expect(r.variants).toBe(without.variants);
    expect(r.composed).toBe(without.composed + 7);
    expect(r.gaps.map((g) => g.gap).sort()).toEqual(without.gaps.map((g) => g.gap).sort());
    expect(r.neck).toEqual(without.neck);
    // With two variants of each species part, none is forced into a generated creature either.
    const twice = (text: string): string => text.replace(/part quadruped\/(torso|head|tail)\/civet\/small\/v0\n[^]*?\n\n/g, (block) => `${block}${block.replace('/v0\n', '/v1\n')}`);
    const v1 = checkPack(twice(WITH_CIVET));
    expect(v1.summary?.parts).toBe(r.summary!.parts + 3);
    expect(v1.variants).toBe(without.variants);
  });

  it('a species head is checked at the neck against its own torso only, at its own leg count and no shift', () => {
    // The species torso drawn as the sturdy one (shades 1 and 0): two steps from its head.
    const r = checkPack(planted('333333333333\n333333333333\n333333333333\n333333333333\n333333333333\n444444444444\n', TORSO_ROWS, WITH_CIVET));
    expect(r.neck.map((n) => `${n.head} on ${n.torso} x${n.cases}`)).toEqual(['quadruped/head/civet/small/v0 on quadruped/torso/civet/small/v0 x7']);
  });

  it('accepts fore-<key> legs once the species scaffold exists', () => {
    const legs = (text: string): string => `${text}\npart quadruped/farLimbs/fore-civet/small/v0\nframe rest anchor=0,0\n33\n33\n33\n33\n33\n44\n\npart quadruped/nearLimbs/fore-civet/small/v0\nframe rest anchor=0,0\n33\n33\n33\n33\n33\n44\n`;
    const r = checkPack(legs(WITH_CIVET));
    expect(r.unreachable).toEqual([]);
    expect(r.ok).toBe(true);
    const lost = checkPack(legs(WITH_CIVET.replace(CIVET_SCAFFOLD, '')));
    expect(lost.unreachable.filter((u) => u.includes("a leg named 'fore-civet'"))).toHaveLength(2);
  });

  it('a species torso and head need only the attach points the species uses', () => {
    // The complete species above has no back, far2, far3, near2, near3 or eye2-eye7 points and checks OK; dropping one it uses is an error.
    const r = checkPack(planted(',near1:4,5\n', '\n', WITH_CIVET));
    expect(r.structure).toContain('part quadruped/torso/civet/small/v0 frame rest: missing attach point near1');
    const eye = checkPack(planted('attach=eye0:1,1,eye1:2,1\n444444', 'attach=eye0:1,1\n444444', WITH_CIVET));
    expect(eye.structure).toContain('part quadruped/head/civet/small/v0 frame rest: missing attach point eye1');
    const tail = checkPack(planted(',tail:1,1,far0', ',far0', planted('tail=1', 'tail=0', WITH_CIVET)));
    expect(tail.structure).toEqual([]);
  });

  it('a species key that is a torso type of its family is an error', () => {
    const r = checkPack(`${WITH_CIVET}\nspecies stilt quadruped small legs=4 eyes=2 iris=0 tail=1\n`);
    expect(r.structure).toContain('species stilt: key is a torso type of quadruped');
    expect(checkPack(WITH_CIVET).structure).toEqual([]);
  });
});

describe('routing helpers', () => {
  const ALL_TORSOS = [
    'quadruped/sturdy', 'quadruped/stilt', 'quadruped/shelled', 'quadruped/membranous', 'quadruped/crystalline',
    'quadruped/tusked', 'quadruped/horned', 'quadruped/spindly', 'quadruped/squat', 'quadruped/fourwinged',
    'fish/fusiform', 'fish/shark', 'fish/flat', 'fish/angler', 'fish/sturgeon',
    'serpent/snake', 'serpent/viper', 'gelatinous/body',
    'radial/anemone', 'radial/urchin', 'radial/coral', 'radial/cucumber',
    'tentacled/octopus', 'tentacled/squid', 'tentacled/cuttlefish',
    'insect/beetle', 'insect/generic', 'insect/mantis',
    'crustacean/crab', 'crustacean/lobster',
  ];

  it('finds a genome for every shape of every family', () => {
    const all = generatedTorsos();
    expect(all.size).toBe(30);
    expect([...all].sort()).toEqual([...ALL_TORSOS].sort());
    for (const id of all) {
      const [family, torso] = id.split('/') as [string, string];
      const states = routeStates(`${id}/medium`);
      expect(states.length, id).toBeGreaterThan(0);
      for (const { state, genes } of states) {
        const shaped = shapedGenome({ ...genes, head: 0 }, family, torso);
        expect(shaped, `${id} ${state}`).toBeDefined();
        const b = bodyOf(shaped!);
        expect(`${b.family}/${b.torso}`, `${id} ${state}`).toBe(id);
        expect(b.tier, `${id} ${state}`).toBe('medium');
      }
    }
  });

  it('samples airborne and aquatic only where they change the parts', () => {
    const statesOf = (id: string) => routeStates(id).map((s) => s.state);
    expect(statesOf('quadruped/membranous/medium')).toEqual(['land', 'airborne', 'aquatic']);
    expect(statesOf('quadruped/fourwinged/medium')).toEqual(['land', 'airborne', 'aquatic']);
    expect(statesOf('quadruped/sturdy/medium')).toEqual(['land', 'airborne']);
    expect(routeStates('fish/sturgeon/medium')).toEqual([{ state: 'aquatic', genes: { size: 2, body: 6, loco: 4, habitat: 0 } }]);
    expect(routeStates('crustacean/crab/medium')).toEqual([{ state: 'land', genes: { size: 2, body: 1, loco: 0, habitat: 0 } }]);
    const membranous = routeStates('quadruped/membranous/medium');
    expect(membranous.map((s) => s.genes)).toEqual([
      { size: 2, body: 7, loco: 0, habitat: 0 }, { size: 2, body: 7, loco: 3, habitat: 0 }, { size: 2, body: 7, loco: 4, habitat: 0 },
    ]);
    for (const { state, genes } of membranous) {
      const b = bodyOf(shapedGenome(genes, 'quadruped', 'membranous')!);
      expect([b.airborne, b.aquatic], state).toEqual([state === 'airborne', state === 'aquatic']);
    }
    // The tier genes: small is size gene 1 (gene 0 draws medium), guardian carries the Guardian marker.
    expect(routeStates('quadruped/sturdy/small')[0]!.genes).toEqual({ size: 1, body: 0, loco: 0, habitat: 0 });
    expect(bodyOf(routeStates('quadruped/sturdy/small')[0]!.genes).tier).toBe('small');
    expect(routeStates('quadruped/sturdy/large')[0]!.genes).toEqual({ size: 4, body: 0, loco: 0, habitat: 0 });
    expect(bodyOf(routeStates('quadruped/sturdy/guardian')[0]!.genes).tier).toBe('guardian');
  });

  it('an id no genome reaches gives nothing', () => {
    expect(routeStates('quadruped/armored/medium')).toEqual([]);
    expect(routeStates('crustacean/shrimp/medium')).toEqual([]);
    expect(routeStates('fish/body/medium')).toEqual([]);
    expect(routeStates('quadruped/sturdy/huge')).toEqual([]);
    expect(shapedGenome({ body: 0, loco: 0, habitat: 0, size: 2 }, 'quadruped', 'armored')).toBeUndefined();
  });

  it('shapedGenome changes only the seed', () => {
    const genome = { kingdom: 'fauna', size: 2, body: 15, loco: 0, habitat: 0, head: 3, tail: 2, limbs: 4, eyes: 1, color: 5, seed: 999 };
    for (const torso of ['anemone', 'urchin', 'coral', 'cucumber']) {
      const shaped = shapedGenome(genome, 'radial', torso)!;
      expect(shaped, torso).toBeDefined();
      const { seed, ...rest } = shaped;
      const { seed: _old, ...before } = genome;
      expect(rest, torso).toEqual(before);
      expect(Number.isInteger(seed) && (seed as number) >= 1 && (seed as number) <= 64, torso).toBe(true);
      // the smallest seed: no smaller one gives the shape
      for (let s = 1; s < (seed as number); s++) expect(bodyOf({ ...genome, seed: s }).torso, `${torso} seed ${s}`).not.toBe(torso);
      expect(bodyOf(shaped).torso, torso).toBe(torso);
    }
    expect(genome.seed).toBe(999); // the input is not changed
  });
});

describe('checkPack: attach points, names and gaps for wings, body features and flippers', () => {
  /** The good pack's torso attach list, to plant points into. */
  const TORSO_ATTACH = 'attach=head:10,1,';
  const part = (id: string, attach = ''): string => `\npart ${id}\nframe rest anchor=0,0${attach === '' ? '' : ` attach=${attach}`}\n22\n`;
  /** The good pack on another torso type (a scaffold the old path never reaches, so nothing is composed on it). */
  const on = (torso: string, wingPoints = ''): string => GOOD.replaceAll('sturdy', torso).replace(TORSO_ATTACH, `attach=${wingPoints}head:10,1,`);
  const partLines = (lines: readonly string[]): string[] => lines.filter((l) => l.startsWith('part '));

  it('a membranous torso without wing is an error once the pack holds wing-membranous', () => {
    const torso = 'part quadruped/torso/membranous/small/v0 frame rest: missing attach point wing';
    expect(checkPack(on('membranous')).structure).toEqual([]);
    for (const slot of ['farWings', 'nearWings']) {
      const wing = part(`quadruped/${slot}/wing-membranous/small/v0`);
      expect(checkPack(on('membranous') + wing).structure, slot).toEqual([torso]);
      expect(checkPack(on('membranous', 'wing:6,0,') + wing).structure, slot).toEqual([]);
    }
    // A wing of another tier, or of another torso type, asks nothing of this torso.
    expect(checkPack(on('membranous') + part('quadruped/farWings/wing-membranous/medium/v0')).structure.filter((l) => l.startsWith('part quadruped/torso/'))).toEqual([]);
    expect(checkPack(on('membranous') + part('quadruped/farWings/wing-fourwinged/small/v0')).structure).toEqual([]);
  });

  it('without hindwing parts, wing1 is not needed', () => {
    const four = on('fourwinged', 'wing:6,0,') + part('quadruped/farWings/wing-fourwinged/small/v0') + part('quadruped/nearWings/wing-fourwinged/small/v0');
    expect(checkPack(four).structure).toEqual([]);
    const hind = four + part('quadruped/farWings/hindwing-fourwinged/small/v0');
    expect(checkPack(hind).structure).toEqual(['part quadruped/torso/fourwinged/small/v0 frame rest: missing attach point wing1']);
    expect(checkPack(hind.replace('attach=wing:6,0,', 'attach=wing:6,0,wing1:3,0,')).structure).toEqual([]);
  });

  it('a serpent torso needs eye0 and no legs; a radial torso needs nothing', () => {
    const serpent = (attach: string): string[] => partLines(checkPack(GOOD + part('serpent/torso/snake/small/v0', attach)).structure);
    expect(serpent('eye0:1,0,back:2,0')).toEqual([]);
    expect(serpent('back:2,0')).toEqual(['part serpent/torso/snake/small/v0 frame rest: missing attach point eye0']);
    expect(partLines(checkPack(GOOD + part('radial/torso/anemone/small/v0')).structure)).toEqual([]);
    // The others, each missing the last of its points.
    const missingLast = (id: string, points: readonly string[]): string[] =>
      partLines(checkPack(GOOD + part(id, points.slice(0, -1).map((p) => `${p}:0,0`).join(','))).structure);
    expect(missingLast('fish/torso/shark/small/v0', ['head', 'tail', 'back'])).toEqual(['part fish/torso/shark/small/v0 frame rest: missing attach point back']);
    expect(missingLast('insect/torso/mantis/small/v0', ['head', 'back', 'far0', 'far1', 'far2', 'near0', 'near1', 'near2'])).toEqual(['part insect/torso/mantis/small/v0 frame rest: missing attach point near2']);
    expect(missingLast('tentacled/torso/squid/small/v0', ['tail', 'back'])).toEqual(['part tentacled/torso/squid/small/v0 frame rest: missing attach point back']);
    expect(missingLast('crustacean/torso/crab/small/v0', ['head', 'tail', 'back'])).toEqual(['part crustacean/torso/crab/small/v0 frame rest: missing attach point back']);
    // A family no genome routes to keeps the four-legged set.
    expect(missingLast('myriapod/torso/body/small/v0', ['head'])[0]).toMatch(/^part myriapod\/torso\/body\/small\/v0 frame rest: missing attach point head, tail, back, far0/);
  });

  it('until Task 17 a torso id the live builder draws keeps the four-legged set; only a routed-only id takes its family\'s', () => {
    const full = ['head', 'tail', 'back', 'far0', 'far1', 'far2', 'far3', 'near0', 'near1', 'near2', 'near3'];
    const structureOf = (id: string, points: readonly string[]): string[] =>
      partLines(checkPack(GOOD + part(id, points.map((p) => `${p}:0,0`).join(','))).structure);
    const missing = (id: string, points: readonly string[]): string[] => [`part ${id} frame rest: missing attach point ${points.join(', ')}`];
    // As at base: the live builder asks these for a head, a tail and legs.
    expect(structureOf('tentacled/torso/body/small/v0', ['tail', 'back'])).toEqual(missing('tentacled/torso/body/small/v0', full.filter((p) => p !== 'tail' && p !== 'back')));
    expect(structureOf('insect/torso/body/small/v0', ['head', 'back', 'far0', 'far1', 'far2', 'near0', 'near1', 'near2'])).toEqual(missing('insect/torso/body/small/v0', ['tail', 'far3', 'near3']));
    expect(structureOf('fish/torso/body/small/v0', ['head', 'tail', 'back'])).toEqual(missing('fish/torso/body/small/v0', full.slice(3)));
    expect(structureOf('serpent/torso/body/small/v0', full)).toEqual([]);
    expect(structureOf('gelatinous/torso/body/small/v0', ['back'])).toEqual(missing('gelatinous/torso/body/small/v0', full.filter((p) => p !== 'back')));
    // Routed-only ids take their family's set.
    expect(structureOf('fish/torso/shark/small/v0', ['head', 'tail', 'back'])).toEqual([]);
    expect(structureOf('serpent/torso/snake/small/v0', ['back'])).toEqual(missing('serpent/torso/snake/small/v0', ['eye0']));
    // The ids both builders reach, today: the five shared quadruped types (whose family set is the four-legged set) and gelatinous/body.
    const live = new Set([0, 4].flatMap((loco) => Array.from({ length: 16 }, (_, body) => {
      const a = resolveAnatomy({ kingdom: 'fauna', body, loco });
      return `${a.family}/${torsoKindOf(a)}`;
    })));
    expect([...generatedTorsos()].filter((id) => live.has(id)).sort()).toEqual(['gelatinous/body', 'quadruped/horned', 'quadruped/squat', 'quadruped/stilt', 'quadruped/sturdy', 'quadruped/tusked']);
  });

  it('wing-membranous is accepted only with a membranous scaffold; wing-sturdy, wing-armored and bodyFeature/plates-sturdy are errors', () => {
    const lost = (id: string): string => {
      const [, slot, kind] = id.split('/');
      return `part ${id}: no creature asks for a ${slot} part named '${kind}'`;
    };
    const unreachable = (text: string): string[] => partLines(checkPack(text).unreachable);
    for (const id of ['quadruped/farWings/wing-sturdy/small/v0', 'quadruped/nearWings/wing-armored/small/v0', 'quadruped/bodyFeature/plates-sturdy/small/v0',
      'quadruped/farWings/wing-membranous/small/v0', 'quadruped/farWings/sails-sturdy/small/v0', 'quadruped/bodyFeature/shell-shelled/small/v0',
      'quadruped/nearLimbs/flipper-sturdy/small/v0', 'quadruped/farWings/w/small/v0']) {
      expect(unreachable(GOOD + part(id)), id).toEqual([lost(id)]);
      expect(checkPack(GOOD + part(id)).ok, id).toBe(false);
    }
    // Names a creature asks for, at a tier with a scaffold of that torso type or shape.
    expect(unreachable(GOOD + part('quadruped/nearWings/sails-sturdy/small/v0') + part('quadruped/nearWings/sails/small/v0'))).toEqual([]);
    const membranous = on('membranous', 'wing:6,0,');
    for (const id of ['quadruped/farWings/wing-membranous/small/v0', 'quadruped/nearWings/wing-membranous/small/v0', 'quadruped/bodyFeature/fins-membranous/small/v0',
      'quadruped/nearLimbs/flipper-membranous/small/v0', 'quadruped/nearLimbs/flipper/small/v0']) {
      expect(unreachable(membranous + part(id)), id).toEqual([]);
    }
    for (const id of ['quadruped/nearWings/sails-membranous/small/v0', 'quadruped/farWings/wing-membranous/medium/v0', 'quadruped/farLimbs/flipper-membranous/small/v0',
      'quadruped/farWings/hindwing-membranous/small/v0']) {
      expect(unreachable(membranous + part(id)), id).toEqual([lost(id)]);
    }
    expect(unreachable(on('shelled') + part('quadruped/bodyFeature/shell-shelled/small/v0'))).toEqual([]);
    const sturgeon = `${GOOD}\nscaffold fish/sturgeon/small origin=16,12\npose rest\n`;
    expect(unreachable(sturgeon + part('fish/bodyFeature/shell-sturgeon/small/v0'))).toEqual([]);
    expect(unreachable(sturgeon + part('fish/bodyFeature/shell-shark/small/v0'))).toEqual([lost('fish/bodyFeature/shell-shark/small/v0')]);
  });

  it('a wing slot part is in the marks check by its own kind rule: sails on a sturdy scaffold, the own kind before the shared one', () => {
    const sailsGaps = (text: string): string[] => checkPack(text).gaps.filter((g) => g.gap.startsWith('marks:quadruped/nearWings/')).map((g) => `${g.gap} x${g.count}`);
    expect(sailsGaps(GOOD + part('quadruped/nearWings/sails/small/v0'))).toEqual(['marks:quadruped/nearWings/sails/small/v0:rest x0']);
    expect(sailsGaps(GOOD + part('quadruped/nearWings/sails/small/v0') + part('quadruped/nearWings/sails-sturdy/small/v0'))).toEqual(['marks:quadruped/nearWings/sails-sturdy/small/v0:rest x0']);
    const layered = '\npart quadruped/nearWings/sails/small/v0\nframe rest anchor=0,0\n22\nlayer flow\n12\nlayer spots\n1.\n';
    expect(sailsGaps(GOOD + layered)).toEqual([]);
  });

  /** The gaps the routed builder meets for a route on the good pack (which holds only small parts). */
  const routedGaps = (id: string, state: string, genes: Record<string, unknown>): string[] => {
    const [family, torso] = id.split('/') as [string, string];
    const { genes: route } = routeStates(`${id}/medium`).find((s) => s.state === state)!;
    const genome = shapedGenome({ kingdom: 'fauna', head: 0, tail: 2, limbs: 1, eyes: 0, skin: 3, pattern: 0, ...route, ...genes }, family, torso)!;
    return [...buildRoutedRecipe(genome, [], parseCatalogueText(GOOD)).gaps];
  };

  it('missing wings, sails, flippers and body features are information', () => {
    const winged = routedGaps('quadruped/membranous', 'aquatic', {});
    const info = [
      'missing:quadruped/farWings/wing-membranous/medium/v0', 'missing:quadruped/nearWings/wing-membranous/medium/v0',
      'missing:quadruped/bodyFeature/fins-membranous/medium/v0', 'missing:quadruped/nearLimbs/flipper/medium/v0',
    ];
    for (const gap of info) expect(winged, gap).toContain(gap);
    expect(routedGaps('quadruped/sturdy', 'airborne', {})).toContain('missing:quadruped/nearWings/sails/medium/v0');
    expect(routedGaps('quadruped/shelled', 'land', {})).toContain('missing:quadruped/bodyFeature/shell-shelled/medium/v0');
    expect(routedGaps('fish/sturgeon', 'aquatic', { body: 8 })).toContain('missing:fish/bodyFeature/crystals-sturgeon/medium/v0');
    const all = [...info, 'missing:quadruped/nearWings/sails/medium/v0', 'missing:quadruped/bodyFeature/shell-shelled/medium/v0', 'missing:fish/bodyFeature/crystals-sturgeon/medium/v0',
      'missing:quadruped/nearLimbs/flipper-membranous/medium/v0', 'missing:quadruped/back/ridge-sturdy/small/v0', 'missing:quadruped/headFeature/horns-h0/small/v0'];
    expect(all.filter((g) => !gapIsInfo(g))).toEqual([]);
    // The torso, a limb and the head stay errors.
    expect(winged.filter((g) => g.startsWith('missing:quadruped/torso/') || g.startsWith('missing:quadruped/head/')).map(gapIsInfo)).toEqual([false, false]);
    expect(gapIsInfo('missing:quadruped/nearLimbs/leg/medium/v0')).toBe(false);
  });

  it('a skin: gap is information', () => {
    expect(gapIsInfo('skin:quadruped/torso/sturdy/medium/v0:rest')).toBe(true);
    expect(gapIsInfo('skin:fish/torso/shark/medium/v1:swim')).toBe(true);
    // Only the skin: prefix: a gap that merely contains it stays an error.
    expect(gapIsInfo('frame:skin:rest')).toBe(false);
    expect(gapIsInfo('skins:quadruped/torso/sturdy/medium/v0:rest')).toBe(false);
  });

  it('a missing t0 and a missing pit are errors', () => {
    const t0 = 'missing:quadruped/tail/t0/medium/v0';
    expect(routedGaps('quadruped/sturdy', 'land', { tail: 0 })).toContain(t0);
    const pit = 'missing:fish/eyes/pit/medium/v0';
    expect(routedGaps('fish/shark', 'aquatic', { head: EYELESS_HEAD })).toContain(pit);
    expect(gapIsInfo(t0)).toBe(false);
    expect(gapIsInfo(pit)).toBe(false);
  });

  it('the family point table equals what planBodyParts can ask for', () => {
    // Every point the composer looks for on the torso, for each route: a pack holding every part the route asks for, its
    // torso with every candidate point but one, composed in rest; the point is asked for when its attach: gap appears.
    const candidates = [...new Set([...TORSO_POINTS_BY_FAMILY['quadruped']!, ...Array.from({ length: 8 }, (_, i) => `eye${i}`), 'wing', 'wing1', 'wing2', 'feature'])];
    const headPoints = [...Array.from({ length: 8 }, (_, i) => `eye${i}:0,0`), 'feature:0,0'].join(',');
    const pointsAskedFor = (genome: Record<string, unknown>, scaffoldId: string): string[] => {
      const ids = [...new Set(buildRoutedRecipe(genome, [], parseCatalogueText(PALETTE)).gaps.filter((g) => g.startsWith('missing:')).map((g) => g.slice('missing:'.length)))];
      const pack = (omit: string): string => PALETTE + ids.map((id) => {
        const slot = id.split('/')[1];
        const attach = slot === 'torso' ? candidates.filter((p) => p !== omit).map((p) => `${p}:0,0`).join(',') : slot === 'head' ? headPoints : '';
        return part(id, attach);
      }).join('') + `\nscaffold ${scaffoldId} origin=16,12\npose rest\n`;
      return candidates.filter((p) => {
        const catalogue = parseCatalogueText(pack(p));
        return assemble(buildRoutedRecipe(genome, [], catalogue), 'rest', catalogue).gaps.includes(`attach:${p}`);
      });
    };
    const seen = new Set<string>();
    for (const id of generatedTorsos()) {
      const [family, torso] = id.split('/') as [string, string];
      const asked = new Set<string>();
      for (const { genes } of routeStates(`${id}/medium`)) {
        for (const head of [0, EYELESS_HEAD]) {
          // Eight legs, eight eyes, a tail every family draws, a skin with a back part.
          const genome = shapedGenome({ kingdom: 'fauna', ...genes, head, tail: 2, limbs: 3, eyes: 3, skin: 0, pattern: 0 }, family, torso)!;
          for (const p of pointsAskedFor(genome, `${id}/medium`)) asked.add(p);
        }
      }
      const wings = WING_KINDS[torso] ?? [];
      const expected = [...TORSO_POINTS_BY_FAMILY[family]!, ...(wings.includes('wing') ? ['wing'] : []), ...(wings.includes('hindwing') ? ['wing1'] : [])];
      expect([...asked].sort(), id).toEqual([...expected].sort());
      seen.add(family);
    }
    expect([...seen].sort()).toEqual(Object.keys(TORSO_POINTS_BY_FAMILY).sort());
  });
});

describe('checkPack: coded and label copies are never skinned', () => {
  // A torso 8x4 drawn 1 with its head point at (8,1); a head 3x2 drawn 2; a tail and a near leg drawn 2 and 4 (label
  // values, as labelCatalogue draws a tail and a near leg). Crystalline (gene 8, step +1) and scaled (gene 0, step -1)
  // step row 0 of every part, so a skin left on would move each coded value 1 to 12 by one.
  const CODED = PALETTE + `
part quadruped/torso/sturdy/small/v0
frame rest anchor=0,0 attach=head:8,1,tail:-1,0,near0:2,4
11111111
11111111
11111111
11111111

part quadruped/head/h0/small/v0
frame rest anchor=0,0
222
222

part quadruped/tail/t1/small/v0
frame rest anchor=0,0
2

part quadruped/nearLimbs/leg/small/v0
frame rest anchor=0,0
4
4

part quadruped/torso/fallback/small/v0
frame rest anchor=0,0
1
` + SCAFFOLD;
  const cat = parseCatalogueText(CODED);
  const scaffold = cat.scaffolds.get('quadruped/sturdy/small')!;
  const TORSO = 'quadruped/torso/sturdy/small/v0';
  const HEAD = 'quadruped/head/h0/small/v0';
  const recipeOf = (skin: number | null): Recipe => ({
    version: 1, identity: 'coded', family: 'quadruped', tier: 'small', scaffoldId: scaffold.id, legs: 1,
    parts: [
      { slot: 'tail', index: 0, partId: 'quadruped/tail/t1/small/v0', source: 'own' },
      { slot: 'torso', index: 0, partId: TORSO, source: 'own' },
      { slot: 'nearLimbs', index: 0, partId: 'quadruped/nearLimbs/leg/small/v0', source: 'own' },
      { slot: 'head', index: 0, partId: HEAD, source: 'own' },
    ],
    ramps: { primary: 'c0', accent: 'c1', underside: 'c0-under', iris: 'iris0' },
    marking: { pattern: 0, strength: 2, phase: 0 }, shift: { head: [0, 0], tail: [0, 0] }, glow: false, gaps: [],
    opacity: 100, airborne: false, theme: null, rim: 0, skin,
  });
  const pixels = (r: Recipe, catalogue = cat): number[] => Array.from(assemble(r, 'rest', catalogue).buffer.pixels);

  it('the cases are sensitive: the real picture of each skinned recipe differs from the unskinned one', () => {
    for (const skin of [0, 8]) expect(pixels(recipeOf(skin)), `skin ${skin}`).not.toEqual(pixels(recipeOf(null)));
  });

  it('a coded copy draws its codes, and frameOrigin finds the frame, as with skin null', () => {
    for (const skin of [0, 8]) {
      for (const k of [0, 1, 2, 3]) {
        for (const axis of ['x', 'y'] as const) {
          const coded = (r: Recipe): number[] => { const c = numberedCopy(r, cat, new Map<string, Part>(), (i) => (i === k ? axis : 'blank')); return pixels(c.recipe, c.catalogue); };
          expect(coded(recipeOf(skin)), `skin ${skin} part ${k} ${axis}`).toEqual(coded(recipeOf(null)));
        }
        expect(frameOrigin(recipeOf(skin), k, 'rest', cat, new Map()), `skin ${skin} part ${k}`).toEqual(frameOrigin(recipeOf(null), k, 'rest', cat, new Map()));
      }
      // The torso's pixel 0,0 is at the scaffold origin, the head's at the torso's head point.
      expect(frameOrigin(recipeOf(skin), 1, 'rest', cat, new Map())).toEqual([16, 12]);
      expect(frameOrigin(recipeOf(skin), 3, 'rest', cat, new Map())).toEqual([24, 13]);
      // A copy with a real part keeps the skin, so its real parts are drawn as in the real picture.
      expect(numberedCopy(recipeOf(skin), cat, new Map(), (i) => (i === 1 ? 'real' : 'blank')).recipe.skin).toBe(skin);
    }
  });

  it('a label picture is drawn with skin null', () => {
    for (const skin of [0, 8]) expect(Array.from(labelPicture(recipeOf(skin), 'rest', cat).pixels), `skin ${skin}`).toEqual(pixels(recipeOf(null)));
  });

  it('the neck rule reads the parts as drawn, without skin', () => {
    const joins = (skin: number | null): unknown => neckJoins(cat, scaffold, TORSO, [HEAD], [1], () => recipeOf(skin), new Map());
    // Head 2 beside torso 1 is one shade step: no breach. Crystalline would draw the head's row 0 as 3, two steps from the torso.
    expect(joins(null)).toEqual([]);
    for (const skin of [0, 8]) expect(joins(skin), `skin ${skin}`).toEqual([]);
  });
});
