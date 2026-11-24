import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EYE_COUNTS, LIMB_COUNTS, VARIANTS, parseCatalogueText } from '@cf/art-format';
import { describe, expect, it } from 'vitest';
import { guardianFor, makeGenome } from '@cf/domain-genome';
import { assemble } from '@cf/art-compose';
import { bodyOf, buildRecipe, EYELESS_HEAD, routeBody, torsoKindOf, WING_KINDS } from '@cf/art-recipe';
import { checkPack, coverageShortfall, detachedSlots, formatReport, frameOrigin, gapIsInfo, generatedTorsos, labelPicture, neckJoins, numberedCopy, routeStates, shapedFor, shapedGenome, TORSO_POINTS_BY_FAMILY, type PackReport } from '../tools/check-pack.mjs';
import type { Recipe } from '@cf/art-recipe';
import type { Part } from '@cf/art-format';

const TOOL = fileURLToPath(new URL('../tools/check-pack.mjs', import.meta.url));

// A small pack that is right in every way the tool checks (the stub tail t0 and the sensory pit included, which every
// four-legged creature can ask for): the head and tail overlap the torso by two columns,
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
ramp iris8 1 0 1 0
ramp iris9 0 1 1 0
ramp iris10 1 0 0 1
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

part quadruped/tail/t0/small/v0
frame rest anchor=4,0
222222
111111

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

part quadruped/eyes/pit/small/v0
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
/** A pack with the good pack's torso part and scaffold moved to another torso type: those two ids only, each exactly once. */
function onTorso(text: string, torso: string): string {
  return planted('scaffold quadruped/sturdy/small', `scaffold quadruped/${torso}/small`, planted('part quadruped/torso/sturdy/small/v0', `part quadruped/torso/${torso}/small/v0`, text));
}
const errorsOf = (report: PackReport): string[] => formatReport(report).split('\n').filter((l) => l.startsWith('error:'));
/**
 * The checker with no scaffold's creatures sampled: for a test that reads only the whole-pack fields (structure,
 * unreachable), which the sampling never changes (see 'checkPack: the sample option').
 */
const wholePack = (text: string): PackReport => checkPack(text, { sample: () => false });

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
    expect(r.summary).toMatchObject({ parts: 9, scaffolds: 1, fallbacks: 1, colours: 2, ramps: 11, bySlot: { torso: 2, head: 1, tail: 2, farLimbs: 1, nearLimbs: 1, eyes: 2 } });
    expect(formatReport(r).split('\n')[0]).toBe('check-pack: OK');
    // Its new gaps are information, each printed as an info: line: no layer for a pattern, the shared leg for a role,
    // a missing back part, missing sails (an airborne creature), and no translucent layer (a translucent creature).
    for (const prefix of ['marks:', 'role:', 'missing:quadruped/back/', 'missing:quadruped/nearWings/sails/', 'skin:']) {
      const found = r.gaps.filter((g) => g.gap.startsWith(prefix));
      expect(found.length, prefix).toBeGreaterThan(0);
      expect(found.every((g) => !g.error), prefix).toBe(true);
      expect(formatReport(r).split('\n').some((l) => l.startsWith(`info: gap ${prefix}`)), prefix).toBe(true);
    }
    expect(gapClasses(r)).toEqual(['marks: false', 'missing: back false', 'missing: false', 'role: false', 'skin: false']);
    // With no iris ramps either, it is still OK.
    const old = checkPack(OLD_FORMAT);
    expect(old.ok).toBe(true);
    expect(gapClasses(old)).toEqual(['marks: false', 'missing: back false', 'missing: false', 'role: false', 'skin: false']);
    // A horned torso asks for horns: a missing head feature is information too.
    const horned = checkPack(onTorso(GOOD, 'horned'));
    expect(horned.ok).toBe(true);
    expect(gapClasses(horned)).toEqual(['marks: false', 'missing: back false', 'missing: false', 'missing: headFeature false', 'role: false', 'skin: false']);
  });

  it('a missing torso is still an error', () => {
    // The torso is asked for at the bulk step (normal, v1), then at v0: a pack holding only v2 has neither.
    const r = checkPack(planted('part quadruped/torso/sturdy/small/v0', 'part quadruped/torso/sturdy/small/v2'));
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

  it('requires only eye0 and eye1 (its two sensory pits) on the eyeless head (h2), and all eight eye points on any other head', () => {
    const pitsOnly = planted('part quadruped/head/h0/small/v0\nframe rest anchor=0,0 attach=eye0:1,1,eye1:2,1,eye2:3,1,eye3:4,1,eye4:1,3,eye5:2,3,eye6:3,3,eye7:4,3', 'part quadruped/head/h2/small/v0\nframe rest anchor=0,0 attach=eye0:1,1,eye1:2,1');
    expect(checkPack(pitsOnly).structure).toEqual([]);
    expect(checkPack(pitsOnly).ok).toBe(true);
    const noEyes = planted('part quadruped/head/h0/small/v0\nframe rest anchor=0,0 attach=eye0:1,1,eye1:2,1,eye2:3,1,eye3:4,1,eye4:1,3,eye5:2,3,eye6:3,3,eye7:4,3', 'part quadruped/head/h2/small/v0\nframe rest anchor=0,0');
    expect(checkPack(noEyes).structure).toEqual(['part quadruped/head/h2/small/v0 frame rest: missing attach point eye0, eye1']);
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
    // Both tails hang from the moved point: the stub tail t0 (tail gene 0) and t1.
    expect(new Set(r.hidden.map((d) => `${d.scaffold} ${d.partId} ${d.visible}`))).toEqual(new Set(['quadruped/sturdy/small quadruped/tail/t0/small/v0 0', 'quadruped/sturdy/small quadruped/tail/t1/small/v0 0']));
    expect(new Set(r.hidden.map((d) => d.pose))).toEqual(new Set(['rest', 'approach', 'windup', 'strike', 'recover', 'hit', 'faint']));
    expect(r.hidden.every((d) => d.genome['tail'] === Number(d.partId.split('/')[2]!.slice(1)) && d.needed === 4)).toBe(true);
    const lines = errorsOf(r);
    expect(lines).toHaveLength(2);
    expect(lines[1]).toMatch(/^error: hidden part quadruped\/tail\/t1\/small\/v0 on quadruped\/sturdy\/small in \d+ creature poses \(.*\), e\.g\. body 0 loco 0 habitat 0 size 0 head 0 tail 1 limbs \d eyes \d skin 3 seed \d+ pose \w+ shift head -?\d,-?\d tail -?\d,-?\d: shows 0 of 4 pixels$/);
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

  it('an airborne sturdy creature is sampled with its sails: missing ones are information, held ones are drawn, its own kind before the shared one', () => {
    const sailsOf = (text: string): string[] => checkPack(text).gaps.filter((g) => g.gap.includes('/nearWings/')).map((g) => `${g.gap} x${g.count}`);
    // The good pack holds no sails: each airborne creature (35 recipes x 7 poses, but for the tail pairs' extra shifts) meets one missing: line.
    const base = checkPack(GOOD);
    expect(base.ok).toBe(true);
    expect(base.gaps.filter((g) => g.gap.includes('/nearWings/'))).toEqual([{ gap: 'missing:quadruped/nearWings/sails/small/v0', count: 30 * 7, error: false }]);
    const sail = (kind: string): string => `\npart quadruped/nearWings/${kind}/small/v0\nframe rest anchor=0,0\n2\n`;
    // Held, the shared sails are drawn (an unlayered part on a patterned creature: a marks: line per patterned pose), and
    // the sturdy body's own sails are drawn in their place.
    expect(sailsOf(GOOD + sail('sails'))).toEqual(['marks:quadruped/nearWings/sails/small/v0:rest x49']);
    expect(sailsOf(GOOD + sail('sails') + sail('sails-sturdy'))).toEqual(['marks:quadruped/nearWings/sails-sturdy/small/v0:rest x49']);
    expect(checkPack(GOOD + sail('sails')).ok).toBe(true);
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
    expect(lost.unreachable).toEqual(["part quadruped/eyes/otter/small/v0: no creature asks for an eye named 'otter' (eye, pit where the family has sensory pits, or the key of a species of this family and tier)"]);
    expect(lost.ok).toBe(false);
    expect(checkPack(GOOD).unreachable).toEqual([]);
  });

  it('a pit is asked for in a family whose bodies have sensory pits, and in no other: a serpent has one eye always', () => {
    const pit = (family: string): string => `\npart ${family}/eyes/pit/small/v0\nframe rest anchor=0,0\nd\n`;
    // The good pack's quadruped pit is reachable (pinned above: no unreachable line).
    for (const family of ['fish', 'insect', 'crustacean']) expect(wholePack(GOOD + pit(family)).unreachable, family).toEqual([]);
    for (const family of ['serpent', 'tentacled', 'gelatinous', 'radial']) {
      expect(wholePack(GOOD + pit(family)).unreachable, family).toEqual([`part ${family}/eyes/pit/small/v0: no creature asks for an eye named 'pit' (eye, pit where the family has sensory pits, or the key of a species of this family and tier)`]);
    }
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
const OLD_FORMAT = GOOD.replace(/ramp iris\d+ [0-9 ]+\n/g, '').replace('colour 1 445566\n', 'colour 1 445566\nramp c0 0 1 1 1\n');
const NO_IRIS = 'info: palette has no iris ramps (iris0 to iris10): eyes show no iris colour';

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

  it('a palette with some iris ramps must hold all eleven: one error per missing ramp', () => {
    const r = checkPack(planted('ramp iris3 1 1 1 1\n', ''));
    expect(r.structure).toEqual(['palette: missing iris ramp iris3']);
    expect(errorsOf(r)).toEqual(['error: palette: missing iris ramp iris3']);
    expect(r.info).toEqual([]);
    expect(formatReport(r)).not.toContain(NO_IRIS);
    expect(r.ok).toBe(false);
    // The eight ramps of a pack made before one ramp per theme: each of the three new ones is an error.
    const eight = checkPack(GOOD.replace(/ramp iris(8|9|10) [0-9 ]+\n/g, ''));
    expect(eight.structure).toEqual(['palette: missing iris ramp iris8', 'palette: missing iris ramp iris9', 'palette: missing iris ramp iris10']);
    expect(eight.info).toEqual([]);
    expect(eight.ok).toBe(false);
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
    const bad = wholePack(planted('near3:10,5', 'near3:10,5,head_2:10,1,tail_3:1,1,back_2:6,-1,near0_0:1,5,far1_3:3,5'));
    expect(bad.structure).toEqual([
      `part ${TORSO_ID} frame rest: attach point head_2 is never used: only far<i>_<n> and near<i>_<n> take a leg count`,
      `part ${TORSO_ID} frame rest: attach point tail_3 is never used: only far<i>_<n> and near<i>_<n> take a leg count`,
      `part ${TORSO_ID} frame rest: attach point back_2 is never used: only far<i>_<n> and near<i>_<n> take a leg count`,
      `part ${TORSO_ID} frame rest: attach point near0_0 is for a leg count that never uses it`,
      `part ${TORSO_ID} frame rest: attach point far1_3 is for a leg count that never uses it`,
    ]);
    expect(wholePack(GOOD).structure).toEqual([]);
  });

  it('heads need no feature point in a pack without head features', () => {
    expect(wholePack(GOOD).structure).toEqual([]);
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
    const flow = wholePack(planted('layer flow\n..3456789abc\n', 'layer flow\n..3416789abc\n', layered));
    expect(flow.structure).toEqual([]);
    const spots = wholePack(planted(`layer spots\n${spotsRows}`, `layer spots\n${shape}`, layered));
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
    expect(plain.variants).toBe(4); // two limb variants, on land and airborne
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

  it('composes 7 poses x the recipes SAMPLED names for one scaffold, one head kind and tails t0 and t1, on land and airborne', () => {
    // Land: 1 head x 2 tails x 6 leg counts + 5 more eye counts = 17, then 7 patterns + 1 translucent + 7 back skins = 15,
    // then the shift sweep: the head alone and 2 head and tail pairs = 3; 35 recipes. Airborne: 2 head and tail pairs x 6
    // leg counts = 12, then 15 and 3 as on land; 30 recipes. Each in 7 poses.
    expect(checkPack(GOOD).composed).toBe((35 + 30) * 7);
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
    const horned = onTorso(planted(',eye7:4,3', ',eye7:4,3,feature:3,1'), 'horned');
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
    const horned = (point: string): string => onTorso(planted(',eye7:4,3', `,eye7:4,3,feature:${point}`), 'horned') + feature;
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

describe('checkPack: eye-count attach points and eyes= entries', () => {
  const HEAD_ID = 'quadruped/head/h0/small/v0';
  /** The good pack with more attach points on its head. */
  const headPoints = (more: string, base = GOOD): string => planted(',eye7:4,3', `,eye7:4,3,${more}`, base);
  /** The good pack with entries added to its rest pose. */
  const restEntries = (entries: string, base = GOOD): string => planted('pose rest\n', `pose rest\n${entries}`, base);
  /** The eyes gene for an eye count. */
  const eyeGene = (eyes: number): number => (EYE_COUNTS as readonly number[]).indexOf(eyes);

  it('an eye<i>_<n> point on a head or a torso is accepted for an eye that count draws: i below n, 0 and 1 for the two pits', () => {
    const good = checkPack(headPoints('eye0_1:1,1,eye1_2:2,1,eye3_4:4,1,eye5_6:2,3,eye7_8:4,3,eye0_0:1,1,eye1_0:2,1'));
    expect(good.structure).toEqual([]);
    expect(errorsOf(good)).toEqual([]);
    expect(good.ok).toBe(true);
    expect(wholePack(planted('near3:10,5', 'near3:10,5,eye0_1:1,1')).structure).toEqual([]);
  });

  it('an eye<i>_<n> point for an eye that count never draws, or for a number that is no eye count, is an error', () => {
    const bad = wholePack(headPoints('eye1_1:1,1,eye4_4:1,3,eye2_0:3,1,eye0_3:1,1,eye8_8:1,1'));
    expect(bad.structure).toEqual(['eye1_1', 'eye4_4', 'eye2_0', 'eye0_3', 'eye8_8'].map((point) => `part ${HEAD_ID} frame rest: attach point ${point} is for an eye count that never uses it`));
    expect(bad.ok).toBe(false);
    expect(wholePack(planted('near3:10,5', 'near3:10,5,eye2_2:1,1')).structure).toEqual([`part ${TORSO_ID} frame rest: attach point eye2_2 is for an eye count that never uses it`]);
    expect(wholePack(GOOD).structure).toEqual([]);
  });

  it('the plain eye points stay required beside the eye-count ones', () => {
    const r = wholePack(planted('eye0:1,1,eye1:2,1,eye2:3,1,eye3:4,1,', 'eye0:1,1,eye1:2,1,eye2:3,1,eye3_4:4,1,'));
    expect(r.structure).toEqual([`part ${HEAD_ID} frame rest: missing attach point eye3`]);
  });

  it('an eyes= entry for an eye that count never draws is an error', () => {
    const fine = checkPack(restEntries('entry eyes 0 rest 0 0 eyes=1\nentry eyes 3 rest 0 0 eyes=4\nentry eyes 7 rest 0 0 eyes=8\nentry eyes 1 rest 0 0 eyes=0\nentry eyes 7 rest 0 0 legs=2\n'));
    expect(fine.structure).toEqual([]);
    expect(fine.ok).toBe(true);
    const r = checkPack(restEntries('entry eyes 1 rest 0 0 eyes=1\nentry eyes 4 rest 0 0 eyes=4\nentry eyes 2 rest 0 0 eyes=0\n'));
    expect(r.structure).toEqual([
      'scaffold quadruped/sturdy/small pose rest: entry eyes 1 eyes=1 is for an eye that count never draws',
      'scaffold quadruped/sturdy/small pose rest: entry eyes 4 eyes=4 is for an eye that count never draws',
      'scaffold quadruped/sturdy/small pose rest: entry eyes 2 eyes=0 is for an eye that count never draws',
    ]);
    expect(r.ok).toBe(false);
  });

  it('an eyes= entry naming a frame the eye lacks is an error gap, met only at that eye count', () => {
    const r = checkPack(restEntries('entry eyes 0 wide 0 0 eyes=6\n'));
    // Six eyes in the rest pose: one creature of the eye-count sweep, then one for each of the 7 back skins on land and airborne.
    expect(r.gaps.find((g) => g.gap === 'frame:quadruped/eyes/eye/small/v0:wide')).toEqual({ gap: 'frame:quadruped/eyes/eye/small/v0:wide', count: 15, error: true });
    expect(checkPack(GOOD).gaps.some((g) => g.gap.startsWith('frame:'))).toBe(false);
  });

  it('finds an eye an eye-count point puts off the head, at that eye count only', () => {
    // Eye 3 of four eyes one pixel right of the head (6 wide) and one row above the tail side: touching nothing.
    const r = checkPack(headPoints('eye3_4:7,1'));
    expect(r.structure).toEqual([]);
    expect(r.detached.length).toBeGreaterThan(0);
    expect(r.detached.every((d) => d.genome['eyes'] === eyeGene(4) && d.off.includes('eyes'))).toBe(true);
    expect(new Set(r.detached.map((d) => d.pose))).toEqual(new Set(['rest', 'approach', 'windup', 'strike', 'recover', 'hit', 'faint']));
    expect(r.ok).toBe(false);
    // The same point inside the head is silent.
    expect(checkPack(headPoints('eye3_4:4,2')).ok).toBe(true);
  });

  it('finds an eye an eyes= entry moves off the head, at that eye count only', () => {
    const r = checkPack(restEntries('entry eyes 0 rest 9 0 eyes=6\n'));
    expect(r.detached.length).toBeGreaterThan(0);
    expect(r.detached.every((d) => d.genome['eyes'] === eyeGene(6) && d.pose === 'rest' && d.off.includes('eyes'))).toBe(true);
    expect(checkPack(restEntries('entry eyes 0 rest 0 1 eyes=6\n')).ok).toBe(true);
  });

  it('finds an eye an eye-count point hides under another, at that eye count only', () => {
    // Eye 1 of two eyes on eye 0's own pixel: a one-pixel eye must show its one pixel.
    const r = checkPack(headPoints('eye1_2:1,1'));
    expect(r.hidden.length).toBeGreaterThan(0);
    expect(r.hidden.every((d) => d.genome['eyes'] === eyeGene(2) && d.partId === 'quadruped/eyes/eye/small/v0')).toBe(true);
    expect(r.ok).toBe(false);
  });

  it('draws an eye count with a point or entry of its own at every leg count a legs= entry is written for', () => {
    // Eye 0 of four sits left of the head, on the torso. At two legs the rest pose lifts the head four rows (it still
    // overlaps the torso), and that eye with it: two rows above the torso, touching nothing.
    const moved = restEntries('entry head 0 rest 0 -4 legs=2\nentry eyes 0 rest -4 0 eyes=4\n');
    const r = checkPack(moved);
    const twoLegsFourEyes = r.detached.filter((d) => d.genome['limbs'] === limbGene(2) && d.genome['eyes'] === eyeGene(4));
    expect(twoLegsFourEyes.length).toBeGreaterThan(0);
    expect(twoLegsFourEyes.every((d) => d.off.includes('eyes'))).toBe(true);
    expect(r.detached).toEqual(twoLegsFourEyes);
    // Without the eyes=4 entry no four-eyed creature is drawn at two legs, and the lifted head alone is fine.
    expect(checkPack(restEntries('entry head 0 rest 0 -4 legs=2\n')).ok).toBe(true);
  });

  it('forces a head variant at each eye count a point or entry is written for', () => {
    const V1 = 'quadruped/head/h0/small/v1';
    const HEAD_ROWS = '666666\n666666\n666666\n666666\n555555\n';
    const points = 'eye0:1,1,eye1:2,1,eye2:3,1,eye3:4,1,eye4:1,3,eye5:2,3,eye6:3,3,eye7:4,3';
    const second = (more: string): string => `\npart ${V1}\nframe rest anchor=0,0 attach=${points}${more}\n${HEAD_ROWS}`;
    const plain = checkPack(GOOD + second(''));
    expect(plain.ok).toBe(true);
    expect(plain.variants).toBe(4); // two head variants, on land and airborne
    // The second variant alone puts eye 5 of six off the head: only the forced pass at six eyes is sure to draw it.
    const r = checkPack(GOOD + second(',eye5_6:8,1'));
    expect(r.variants).toBe(8); // each again at six eyes
    const forced = r.detached.filter((d) => d.variant === V1);
    expect(forced.length).toBeGreaterThan(0);
    expect(forced.every((d) => d.genome['eyes'] === eyeGene(6) && d.off.includes('eyes'))).toBe(true);
    expect(r.detached.some((d) => d.variant === 'quadruped/head/h0/small/v0')).toBe(false);
  });

  it('draws each back skin at an eye count with a point or entry of its own', () => {
    const plain = checkPack(GOOD).composed;
    // Four eyes with an entry of their own: 7 back skins more on land and 7 airborne, each in 7 poses.
    expect(checkPack(restEntries('entry eyes 0 rest 0 0 eyes=4\n')).composed).toBe(plain + 14 * 7);
    // Eight eyes are drawn everywhere already.
    expect(checkPack(restEntries('entry eyes 0 rest 0 0 eyes=8\n')).composed).toBe(plain);
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
    expect(r.variants).toBe(4); // v0 and v3, on land and airborne
    expect(r.gaps.find((g) => g.gap === 'marks:quadruped/head/h9/large/v3:rest')).toEqual({ gap: 'marks:quadruped/head/h9/large/v3:rest', count: 14, error: false });
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
    const text = planted('pose rest\n', 'pose rest\nentry nearLimbs 0 lift 0 0 legs=2\n', planted('\npart quadruped/eyes/eye/', `${lift}\npart quadruped/eyes/eye/`, withLayers(GOOD)));
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
    expect(r.variants).toBe(4); // v0 and v3, on land and airborne
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
    expect(r.variants).toBe(6); // three head variants, on land and airborne
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
    expect(r.variants).toBe(6); // three head variants, on land and airborne
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
    expect(r.stderr).toBe('usage: node tools/check-pack.mjs [--require-coverage] [--coverage-seeds=<first>-<last>] <pack.txt> [more.txt ...]\n');
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
    expect(formatReport(r).split('\n')[2]).toBe('scaffolds: 2, fallbacks: 1, species: 1, palette colours: 2, ramps: 14');
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

  it('a species with its own iris ramp <key>-iris needs no iris<n> ramp for itself; without either it is an error', () => {
    // iris=7 with no iris7 ramp: the species error, and the palette's own partial-iris error
    const noIris7 = planted('iris=0', 'iris=7', planted('ramp iris7 0 1 0 1\n', '', WITH_CIVET));
    expect(checkPack(noIris7).structure).toEqual(['palette: missing iris ramp iris7', 'species civet: palette has no ramp iris7']);
    // the same pack with a civet-iris ramp: the species is satisfied, the palette's own rule still stands
    const own = checkPack(planted(CIVET_RAMPS, `${CIVET_RAMPS}ramp civet-iris 0 1 0 1\n`, noIris7));
    expect(own.structure).toEqual(['palette: missing iris ramp iris7']);
    // another species' own iris ramp does not satisfy this one
    const other = checkPack(planted(CIVET_RAMPS, `${CIVET_RAMPS}ramp otter-iris 0 1 0 1\n`, noIris7));
    expect(other.structure).toEqual(['palette: missing iris ramp iris7', 'species civet: palette has no ramp iris7']);
    // a full palette plus civet-iris checks OK and draws the species with it
    const good = checkPack(planted(CIVET_RAMPS, `${CIVET_RAMPS}ramp civet-iris 0 1 0 1\n`, WITH_CIVET));
    expect(errorsOf(good)).toEqual([]);
    expect(good.ok).toBe(true);
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
    const r = wholePack(planted(',near1:4,5\n', '\n', WITH_CIVET));
    expect(r.structure).toContain('part quadruped/torso/civet/small/v0 frame rest: missing attach point near1');
    const eye = wholePack(planted('attach=eye0:1,1,eye1:2,1\n444444', 'attach=eye0:1,1\n444444', WITH_CIVET));
    expect(eye.structure).toContain('part quadruped/head/civet/small/v0 frame rest: missing attach point eye1');
    const tail = wholePack(planted(',tail:1,1,far0', ',far0', planted('tail=1', 'tail=0', WITH_CIVET)));
    expect(tail.structure).toEqual([]);
  });

  it('a species key that is a torso type of its family is an error', () => {
    const r = wholePack(`${WITH_CIVET}\nspecies stilt quadruped small legs=4 eyes=2 iris=0 tail=1\n`);
    expect(r.structure).toContain('species stilt: key is a torso type of quadruped');
    expect(wholePack(WITH_CIVET).structure).toEqual([]);
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
    // The tier genes: small is size gene 0 (tiny creatures stay small), guardian carries the Guardian marker.
    expect(routeStates('quadruped/sturdy/small')[0]!.genes).toEqual({ size: 0, body: 0, loco: 0, habitat: 0 });
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
  /** The good pack on another torso type. */
  const on = (torso: string, wingPoints = ''): string => onTorso(GOOD, torso).replace(TORSO_ATTACH, `attach=${wingPoints}head:10,1,`);
  const partLines = (lines: readonly string[]): string[] => lines.filter((l) => l.startsWith('part '));

  it('a membranous torso without wing is an error once the pack holds wing-membranous', () => {
    const torso = 'part quadruped/torso/membranous/small/v0 frame rest: missing attach point wing';
    expect(wholePack(on('membranous')).structure).toEqual([]);
    for (const slot of ['farWings', 'nearWings']) {
      const wing = part(`quadruped/${slot}/wing-membranous/small/v0`);
      expect(wholePack(on('membranous') + wing).structure, slot).toEqual([torso]);
      expect(wholePack(on('membranous', 'wing:6,0,') + wing).structure, slot).toEqual([]);
    }
    // A wing of another tier, or of another torso type, asks nothing of this torso.
    expect(wholePack(on('membranous') + part('quadruped/farWings/wing-membranous/medium/v0')).structure.filter((l) => l.startsWith('part quadruped/torso/'))).toEqual([]);
    expect(wholePack(on('membranous') + part('quadruped/farWings/wing-fourwinged/small/v0')).structure).toEqual([]);
  });

  it('without hindwing parts, wing1 is not needed', () => {
    const four = on('fourwinged', 'wing:6,0,') + part('quadruped/farWings/wing-fourwinged/small/v0') + part('quadruped/nearWings/wing-fourwinged/small/v0');
    expect(wholePack(four).structure).toEqual([]);
    const hind = four + part('quadruped/farWings/hindwing-fourwinged/small/v0');
    expect(wholePack(hind).structure).toEqual(['part quadruped/torso/fourwinged/small/v0 frame rest: missing attach point wing1']);
    expect(wholePack(hind.replace('attach=wing:6,0,', 'attach=wing:6,0,wing1:3,0,')).structure).toEqual([]);
  });

  it('a serpent torso needs eye0 and no legs; a radial torso needs nothing', () => {
    const serpent = (attach: string): string[] => partLines(wholePack(GOOD + part('serpent/torso/snake/small/v0', attach)).structure);
    expect(serpent('eye0:1,0,back:2,0')).toEqual([]);
    expect(serpent('back:2,0')).toEqual(['part serpent/torso/snake/small/v0 frame rest: missing attach point eye0']);
    expect(partLines(wholePack(GOOD + part('radial/torso/anemone/small/v0')).structure)).toEqual([]);
    // The others, each missing the last of its points.
    const missingLast = (id: string, points: readonly string[]): string[] =>
      partLines(wholePack(GOOD + part(id, points.slice(0, -1).map((p) => `${p}:0,0`).join(','))).structure);
    expect(missingLast('fish/torso/shark/small/v0', ['head', 'tail', 'back'])).toEqual(['part fish/torso/shark/small/v0 frame rest: missing attach point back']);
    expect(missingLast('insect/torso/mantis/small/v0', ['head', 'back', 'far0', 'far1', 'far2', 'near0', 'near1', 'near2'])).toEqual(['part insect/torso/mantis/small/v0 frame rest: missing attach point near2']);
    expect(missingLast('tentacled/torso/squid/small/v0', ['tail', 'back'])).toEqual(['part tentacled/torso/squid/small/v0 frame rest: missing attach point back']);
    expect(missingLast('crustacean/torso/crab/small/v0', ['head', 'tail', 'back'])).toEqual(['part crustacean/torso/crab/small/v0 frame rest: missing attach point back']);
    // A family no genome routes to keeps the four-legged set.
    expect(missingLast('myriapod/torso/body/small/v0', ['head'])[0]).toMatch(/^part myriapod\/torso\/body\/small\/v0 frame rest: missing attach point head, tail, back, far0/);
  });

  it('every torso takes its family\'s set, whatever its kind; a family no genome reaches takes the four-legged set', () => {
    const full = ['head', 'tail', 'back', 'far0', 'far1', 'far2', 'far3', 'near0', 'near1', 'near2', 'near3'];
    const structureOf = (id: string, points: readonly string[]): string[] =>
      partLines(wholePack(GOOD + part(id, points.map((p) => `${p}:0,0`).join(','))).structure);
    const missing = (id: string, points: readonly string[]): string[] => [`part ${id} frame rest: missing attach point ${points.join(', ')}`];
    // The old builder's `body` torsos now take their family's set, as every routed shape does (the flip at the switch).
    expect(structureOf('tentacled/torso/body/small/v0', ['tail', 'back'])).toEqual([]);
    expect(structureOf('insect/torso/body/small/v0', ['head', 'back', 'far0', 'far1', 'far2', 'near0', 'near1', 'near2'])).toEqual([]);
    expect(structureOf('fish/torso/body/small/v0', ['head', 'tail', 'back'])).toEqual([]);
    expect(structureOf('serpent/torso/body/small/v0', full)).toEqual(missing('serpent/torso/body/small/v0', ['eye0']));
    expect(structureOf('gelatinous/torso/body/small/v0', ['back'])).toEqual([]);
    expect(structureOf('fish/torso/shark/small/v0', ['head', 'tail', 'back'])).toEqual([]);
    expect(structureOf('serpent/torso/snake/small/v0', ['back'])).toEqual(missing('serpent/torso/snake/small/v0', ['eye0']));
    // A family no genome reaches (the old myriapod) takes the four-legged set.
    expect(structureOf('myriapod/torso/body/small/v0', ['back'])).toEqual(missing('myriapod/torso/body/small/v0', full.filter((p) => p !== 'back')));
    // The torso ids every routed genome reaches: 10 four-legged types and 20 shapes of the other families.
    expect(generatedTorsos().size).toBe(30);
    expect([...generatedTorsos()].filter((id) => id.endsWith('/body'))).toEqual(['gelatinous/body']);
  });

  it('wing-membranous is accepted only with a membranous scaffold; wing-sturdy, wing-armored and bodyFeature/plates-sturdy are errors', () => {
    const lost = (id: string): string => {
      const [, slot, kind] = id.split('/');
      return `part ${id}: no creature asks for a ${slot} part named '${kind}'`;
    };
    const unreachable = (text: string): string[] => partLines(wholePack(text).unreachable);
    for (const id of ['quadruped/farWings/wing-sturdy/small/v0', 'quadruped/nearWings/wing-armored/small/v0', 'quadruped/bodyFeature/plates-sturdy/small/v0',
      'quadruped/farWings/wing-membranous/small/v0', 'quadruped/farWings/sails-sturdy/small/v0', 'quadruped/bodyFeature/shell-shelled/small/v0',
      'quadruped/nearLimbs/flipper-sturdy/small/v0', 'quadruped/farWings/w/small/v0']) {
      expect(unreachable(GOOD + part(id)), id).toEqual([lost(id)]);
      expect(wholePack(GOOD + part(id)).ok, id).toBe(false);
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
    // The airborne creatures draw them: 7 patterned recipes x 7 poses meet the unlayered rest frame.
    expect(sailsGaps(GOOD + part('quadruped/nearWings/sails/small/v0'))).toEqual(['marks:quadruped/nearWings/sails/small/v0:rest x49']);
    expect(sailsGaps(GOOD + part('quadruped/nearWings/sails/small/v0') + part('quadruped/nearWings/sails-sturdy/small/v0'))).toEqual(['marks:quadruped/nearWings/sails-sturdy/small/v0:rest x49']);
    const layered = '\npart quadruped/nearWings/sails/small/v0\nframe rest anchor=0,0\n22\nlayer flow\n12\nlayer spots\n1.\n';
    expect(sailsGaps(GOOD + layered)).toEqual([]);
  });

  /** The gaps the routed builder meets for a route on the good pack (which holds only small parts). */
  const routedGaps = (id: string, state: string, genes: Record<string, unknown>): string[] => {
    const [family, torso] = id.split('/') as [string, string];
    const { genes: route } = routeStates(`${id}/medium`).find((s) => s.state === state)!;
    const genome = shapedGenome({ kingdom: 'fauna', head: 0, tail: 2, limbs: 1, eyes: 0, skin: 3, pattern: 0, ...route, ...genes }, family, torso)!;
    return [...buildRecipe(genome, [], parseCatalogueText(GOOD)).gaps];
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

  it('a missing flipper is information only in a limb slot', () => {
    for (const slot of ['farLimbs', 'nearLimbs']) {
      expect(gapIsInfo(`missing:quadruped/${slot}/flipper/medium/v0`), slot).toBe(true);
      expect(gapIsInfo(`missing:quadruped/${slot}/flipper-membranous/medium/v0`), slot).toBe(true);
    }
    for (const slot of ['torso', 'head', 'tail', 'eyes', 'glow']) {
      expect(gapIsInfo(`missing:quadruped/${slot}/flipper/medium/v0`), slot).toBe(false);
      expect(gapIsInfo(`missing:quadruped/${slot}/flipper-membranous/medium/v0`), slot).toBe(false);
    }
    // A wing index the composer has no point for is an error.
    expect(gapIsInfo('index:nearWings:2')).toBe(false);
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

  it('the family point table is frozen, each family\'s list too', () => {
    expect(Object.isFrozen(TORSO_POINTS_BY_FAMILY)).toBe(true);
    for (const [family, points] of Object.entries(TORSO_POINTS_BY_FAMILY)) expect(Object.isFrozen(points), family).toBe(true);
  });

  it('the family point table equals what planBodyParts can ask for', () => {
    // Every point the composer looks for on the torso, for each route: a pack holding every part the route asks for, its
    // torso with every candidate point but one, composed in rest; the point is asked for when its attach: gap appears.
    const candidates = [...new Set([...TORSO_POINTS_BY_FAMILY['quadruped']!, ...Array.from({ length: 8 }, (_, i) => `eye${i}`), 'wing', 'wing1', 'wing2', 'feature'])];
    const headPoints = [...Array.from({ length: 8 }, (_, i) => `eye${i}:0,0`), 'feature:0,0'].join(',');
    const pointsAskedFor = (genome: Record<string, unknown>, scaffoldId: string): string[] => {
      const ids = [...new Set(buildRecipe(genome, [], parseCatalogueText(PALETTE)).gaps.filter((g) => g.startsWith('missing:')).map((g) => g.slice('missing:'.length)))];
      const pack = (omit: string): string => PALETTE + ids.map((id) => {
        const slot = id.split('/')[1];
        const attach = slot === 'torso' ? candidates.filter((p) => p !== omit).map((p) => `${p}:0,0`).join(',') : slot === 'head' ? headPoints : '';
        return part(id, attach);
      }).join('') + `\nscaffold ${scaffoldId} origin=16,12\npose rest\n`;
      return candidates.filter((p) => {
        const catalogue = parseCatalogueText(pack(p));
        return assemble(buildRecipe(genome, [], catalogue), 'rest', catalogue).gaps.includes(`attach:${p}`);
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
    version: 1, identity: 'coded', family: 'quadruped', tier: 'small', scaffoldId: scaffold.id, legs: 1, eyes: 0,
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

describe('checkPack samples every scaffold through the routed builder (the switch)', () => {
  /** A scaffold of the good pack's shape for another family and torso, its torso attached at head, tail and back. */
  const scaffoldFor = (id: string): string => SCAFFOLD.replace('quadruped/sturdy/small', id).replace(/fallback .*\n/, '');
  const torsoFor = (id: string, attach: string): string => `\npart ${id}\nframe rest anchor=0,0 attach=${attach}\n222222222222\n222222222222\n111111111111\n`;

  it('a crab scaffold in a planted pack is sampled, not unreachable', () => {
    const crab = GOOD + torsoFor('crustacean/torso/crab/small/v0', 'head:10,1,tail:1,1,back:6,-1') + scaffoldFor('crustacean/crab/small') + '\nfallback crustacean quadruped/torso/fallback/small/v0\n';
    const base = checkPack(GOOD);
    const r = checkPack(crab);
    expect(r.parseError).toBeNull();
    expect(r.unreachable).toEqual([]);
    // Its creatures are composed: more poses, and each asks for the crustacean head the pack lacks (an error gap).
    expect(r.composed).toBeGreaterThan(base.composed);
    expect(r.gaps.find((g) => g.gap === 'missing:crustacean/head/h0/small/v0')).toMatchObject({ error: true });
    // A crab draws no gene eyes and no legs: no crustacean eye or leg is asked for.
    expect(r.gaps.filter((g) => /^missing:crustacean\/(eyes|farLimbs|nearLimbs)\//.test(g.gap))).toEqual([]);
  });

  it('an armored scaffold in a planted pack is unreachable: body 1 is the crustacean now', () => {
    const armored = GOOD + torsoFor('quadruped/torso/armored/small/v0', 'head:10,1,tail:1,1,back:6,-1,far0:0,2,far1:3,2,far2:6,2,far3:9,2,near0:1,2,near1:4,2,near2:7,2,near3:10,2') + scaffoldFor('quadruped/armored/small');
    const r = checkPack(armored);
    expect(r.unreachable).toEqual(['scaffold quadruped/armored/small: no fauna genome resolves to it, so the renderer never uses it']);
    expect(errorsOf(r)).toContain('error: scaffold quadruped/armored/small: no fauna genome resolves to it, so the renderer never uses it');
    expect(r.ok).toBe(false);
    expect(routeStates('quadruped/armored/small')).toEqual([]);
  });

  it('sails are never sampled on a fish', () => {
    // Every fish shape is sampled in water only, and no body there asks for sails.
    for (const shape of ['fusiform', 'shark', 'flat', 'angler', 'sturgeon']) {
      const states = routeStates(`fish/${shape}/small`);
      expect(states.map((x) => x.state), shape).toEqual(['aquatic']);
      for (const { genes } of states) {
        const shaped = shapedGenome({ kingdom: 'fauna', ...genes }, 'fish', shape)!;
        expect(buildRecipe(shaped, [], parseCatalogueText(GOOD)).gaps.filter((g) => g.includes('/nearWings/')), shape).toEqual([]);
      }
    }
    // A fish pack holding sails: they are named unreachable, and no composed fish meets a sails gap.
    const fish = GOOD + torsoFor('fish/torso/fusiform/small/v0', 'head:10,1,tail:1,1,back:6,-1') + scaffoldFor('fish/fusiform/small') + '\nfallback fish quadruped/torso/fallback/small/v0\n' +
      '\npart fish/nearWings/sails/small/v0\nframe rest anchor=0,0\n2\n';
    const r = checkPack(fish);
    expect(r.unreachable).toEqual(["part fish/nearWings/sails/small/v0: no creature asks for a nearWings part named 'sails'"]);
    expect(r.gaps.filter((g) => g.gap.includes('fish/nearWings/'))).toEqual([]);
    expect(r.gaps.some((g) => g.gap.startsWith('missing:fish/'))).toBe(true); // the fish is composed
  });

  it('a genome no seed shapes, or one drawn at another tier, is a failure line naming it, not a crash', () => {
    const genes = { kingdom: 'fauna', body: 1, loco: 0, habitat: 0, size: 2 };
    expect(shapedFor(genes, 'crustacean', 'crab', 'medium').genome).toEqual(shapedGenome(genes, 'crustacean', 'crab'));
    expect(shapedFor(genes, 'crustacean', 'shrimp', 'medium')).toEqual({ failure: 'no seed from 1 to 64 gives body 1 loco 0 habitat 0 size 2 head undefined tail undefined limbs undefined eyes undefined skin undefined seed undefined the shape crustacean/shrimp' });
    const crab = shapedGenome(genes, 'crustacean', 'crab')!;
    expect(shapedFor(genes, 'crustacean', 'crab', 'small')).toEqual({ failure: `body 1 loco 0 habitat 0 size 2 head undefined tail undefined limbs undefined eyes undefined skin undefined seed ${String(crab['seed'])} draws at tier medium, not small` });
  });

  it('a skinned sampled creature: the detached check and the shift sweep find a loose head, and nothing in the good pack', () => {
    // Every generated four-legged creature now carries its skin (gene 3 here, slick): the composer paints it.
    const catalogue = parseCatalogueText(GOOD);
    const clean = checkPack(GOOD);
    expect([clean.detached, clean.edge, clean.hidden]).toEqual([[], [], []]);
    const loose = planted('attach=head:10,1,', 'attach=head:14,1,');
    const r = checkPack(loose);
    expect(r.detached.length).toBeGreaterThan(0);
    // Found at the creatures' own shifts (a creature with legs: the good pack sweeps shifts at no legs only) and in the
    // shift sweep (a shift other than the creature's own), every one of them a skinned creature.
    const own = r.detached.filter((d) => d.genome['limbs'] !== limbGene(0));
    const swept = r.detached.filter((d) => d.shift.head.join() !== buildRecipe(d.genome, [], catalogue).shift.head.join());
    expect(own.length).toBeGreaterThan(0);
    expect(swept.length).toBeGreaterThan(0);
    expect(r.detached.every((d) => buildRecipe(d.genome, [], catalogue).skin !== null)).toBe(true);
    expect(new Set(r.detached.flatMap((d) => d.off.filter((slot) => slot !== 'eyes' && slot !== 'headFeature')))).toEqual(new Set(['head']));
    expect(r.ok).toBe(false);
  });

  it('a winged body in water is sampled with its flippers, and an unlayered flipper frame is a marks: line', () => {
    const membranous = withLayers(onTorso(GOOD, 'membranous'));
    const flipper = (layered: boolean): string => `\npart quadruped/nearLimbs/flipper/small/v0\nframe rest anchor=0,0\n33\n33\n11\n${layered ? 'layer flow\n12\n12\n12\nlayer spots\n11\n11\n..\n' : ''}`;
    const without = checkPack(membranous);
    expect(without.gaps.find((g) => g.gap === 'missing:quadruped/nearLimbs/flipper/small/v0')).toMatchObject({ error: false });
    const r = checkPack(membranous + flipper(false));
    expect(r.gaps.find((g) => g.gap.startsWith('missing:quadruped/nearLimbs/flipper'))).toBeUndefined();
    // The patterned creatures in water (7 patterns x 7 poses) paint both flippers and find no layer.
    expect(r.gaps.filter((g) => g.gap.startsWith('marks:quadruped/nearLimbs/flipper')).map((g) => `${g.gap} x${g.count}`)).toEqual(['marks:quadruped/nearLimbs/flipper/small/v0:rest x98']);
    expect(checkPack(membranous + flipper(true)).gaps.filter((g) => g.gap.startsWith('marks:quadruped/nearLimbs/flipper'))).toEqual([]);
  });

  it('an unlayered flipper frame no sampled creature draws is listed at x0 (the flipper branch of the x0 list)', () => {
    // A flipper held only at v1: the planner asks for v0 (missing, information), a single variant is never forced, so no
    // sampled creature draws it, and only the x0 list's flipper branch (a winged body's two flippers at no legs) finds it.
    const membranous = withLayers(onTorso(GOOD, 'membranous'));
    const v1 = (layered: boolean): string => `\npart quadruped/nearLimbs/flipper/small/v1\nframe rest anchor=0,0\n33\n33\n11\n${layered ? 'layer flow\n12\n12\n12\nlayer spots\n11\n11\n..\n' : ''}`;
    const marks = (text: string): string[] => checkPack(text).gaps.filter((g) => g.gap.startsWith('marks:')).map((g) => `${g.gap} x${g.count}`);
    expect(marks(membranous + v1(false))).toEqual(['marks:quadruped/nearLimbs/flipper/small/v1:rest x0']);
    expect(marks(membranous + v1(true))).toEqual([]);
  });

  it('a head needs the eye points its family hangs from a head: all eight on a crustacean (the lobster), none on a serpent', () => {
    const bare = (family: string): string => `${GOOD}\npart ${family}/head/h0/small/v0\nframe rest anchor=0,0\n22\n`;
    const heads = (text: string): string[] => wholePack(text).structure.filter((l) => l.includes('/head/'));
    expect(heads(bare('crustacean'))).toEqual(['part crustacean/head/h0/small/v0 frame rest: missing attach point eye0, eye1, eye2, eye3, eye4, eye5, eye6, eye7']);
    expect(heads(bare('fish'))).toHaveLength(1);
    for (const family of ['serpent', 'tentacled', 'gelatinous', 'radial']) expect(heads(bare(family)), family).toEqual([]);
  });
});

describe('checkPack: the sample option', () => {
  it('the default samples every scaffold: the same report as sampling all, and as before the option', () => {
    const plain = checkPack(GOOD);
    expect(checkPack(GOOD, {})).toEqual(plain);
    expect(checkPack(GOOD, { sample: () => true })).toEqual(plain);
    expect(plain.composed).toBe((35 + 30) * 7);
    expect(plain.partial).toBeNull();
    expect(formatReport(plain).split('\n')[0]).toBe('check-pack: OK');
  });

  it('a report that left a scaffold out is marked partial, with the ids left out, and says so on its first line', () => {
    const none = checkPack(GOOD, { sample: () => false });
    expect(none.partial).toEqual(['quadruped/sturdy/small']);
    expect(formatReport(none).split('\n')[0]).toBe('check-pack: OK (partial: 1 scaffold not sampled)');
    // two left out, one of them failing a whole-pack check: the count is plural and the failure stays a failure
    const two = GOOD + SCAFFOLD.replace('quadruped/sturdy/small', 'quadruped/squat/small').replace(/fallback .*\n/, '');
    const both = checkPack(two, { sample: () => false });
    expect(both.partial).toEqual(['quadruped/sturdy/small', 'quadruped/squat/small']);
    expect(formatReport(both).split('\n')[0]).toMatch(/^check-pack: (OK|FAIL \(\d+ distinct errors\)) \(partial: 2 scaffolds not sampled\)$/);
    // a species scaffold is always composed, so never in the list; a parse failure samples nothing and is no partial report
    expect(checkPack(WITH_CIVET, { sample: () => false }).partial).toEqual(['quadruped/sturdy/small']);
    expect(checkPack('palette\nbad line\n').partial).toBeNull();
  });

  it('a scaffold left out is not composed, but the whole-pack checks and the species still run', () => {
    const none = checkPack(GOOD, { sample: () => false });
    expect([none.composed, none.gaps, none.edge, none.detached, none.hidden, none.neck]).toEqual([0, [], [], [], [], []]);
    expect([none.summary, none.structure, none.unreachable, none.info, none.ok]).toEqual([checkPack(GOOD).summary, [], [], [], true]);
    // A whole-pack fault is still found: a head without its eye points, an unreachable scaffold, a palette short of a ramp.
    const faults = planted('ramp iris3 1 1 1 1\n', '', planted('attach=eye0:1,1,eye1:2,1,eye2:3,1,eye3:4,1,eye4:1,3,eye5:2,3,eye6:3,3,eye7:4,3', 'attach=eye0:1,1', GOOD))
      + SCAFFOLD.replace('quadruped/sturdy/small', 'quadruped/armored/small').replace(/fallback .*\n/, '');
    const r = checkPack(faults, { sample: () => false });
    expect(r.structure).toEqual(['part quadruped/head/h0/small/v0 frame rest: missing attach point eye1, eye2, eye3, eye4, eye5, eye6, eye7', 'palette: missing iris ramp iris3']);
    expect(r.unreachable).toEqual(['scaffold quadruped/armored/small: no fauna genome resolves to it, so the renderer never uses it']);
    // A named species is composed whatever is sampled.
    expect(checkPack(WITH_CIVET, { sample: () => false }).composed).toBe(7);
  });
});


describe('checkPack: the bone ramp, needed only when a part draws bone values', () => {
  const HEAD_ROWS = '666666\n666666\n666666\n666666\n555555\n';
  const BONE_HEAD = 'mmmmmm\n666666\n666666\n666666\n555555\n';
  const HEAD_ID = 'quadruped/head/h0/small/v0';
  const WITH_BONE_RAMP = (base: string): string => planted('outline 0\n', 'ramp bone 0 1 1 1\noutline 0\n', base);
  const NO_BONE = `palette: no ramp bone: 1 part draws bone values (l to o), which would show black, e.g. part ${HEAD_ID}; add 'ramp bone <four colour numbers, dark to light>'`;
  const boneLines = (r: PackReport): string[] => formatReport(r).split('\n').filter((l) => l.includes('bone'));

  it('a pack that draws no bone says nothing of bone, with the ramp or without', () => {
    for (const text of [GOOD, WITH_BONE_RAMP(GOOD), WITH_CIVET]) {
      const r = wholePack(text);
      expect(r.structure).toEqual([]);
      expect(boneLines(r)).toEqual([]);
    }
  });

  it('a part drawing bone in a palette with no bone ramp is an error naming the part and the line to add; with the ramp it is OK', () => {
    const boned = planted(HEAD_ROWS, BONE_HEAD);
    const r = checkPack(boned);
    expect(r.structure).toEqual([NO_BONE]);
    expect(errorsOf(r)).toEqual([`error: ${NO_BONE}`]);
    expect(r.ok).toBe(false);
    const fixed = checkPack(WITH_BONE_RAMP(boned));
    expect(fixed.structure).toEqual([]);
    expect(errorsOf(fixed)).toEqual([]);
    expect(boneLines(fixed)).toEqual([]);
    expect(fixed.ok).toBe(true);
    // The same error from the command, exit 1; with the ramp, OK and exit 0.
    const dir = mkdtempSync(join(tmpdir(), 'check-pack-bone-'));
    try {
      const run = (text: string) => {
        writeFileSync(join(dir, 'pack.txt'), text);
        return spawnSync(process.execPath, [TOOL, join(dir, 'pack.txt')], { encoding: 'utf8' });
      };
      const bad = run(boned);
      expect(bad.stdout.split('\n')[0]).toBe('check-pack: FAIL (1 distinct errors)');
      expect(bad.stdout.split('\n')).toContain(`error: ${NO_BONE}`);
      expect(bad.status).toBe(1);
      const good = run(WITH_BONE_RAMP(boned));
      expect(good.stdout.split('\n')[0]).toBe('check-pack: OK');
      expect(good.stdout).not.toContain('bone');
      expect(good.status).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('bone drawn only in a hand-drawn layer needs the ramp too, and the parts are counted', () => {
    const layered = planted(HEAD_ROWS, `${HEAD_ROWS}layer striped\n.o....\n......\n......\n......\n......\n`);
    expect(wholePack(layered).structure).toEqual([NO_BONE]);
    expect(wholePack(WITH_BONE_RAMP(layered)).structure).toEqual([]);
    const two = planted(TORSO_ROWS, TORSO_ROWS.replace('111111111111', 'llllllllllll'), planted(HEAD_ROWS, BONE_HEAD));
    expect(wholePack(two).structure).toEqual([NO_BONE.replace('1 part draws', '2 parts draw').replace(HEAD_ID, TORSO_ID)]);
  });

  it('a species\' own part drawing bone needs <key>-bone or bone: neither is an error, either is enough', () => {
    const CIVET_TORSO = 'quadruped/torso/civet/small/v0';
    const civet = planted('333333333333\n444444444444\n', 'mmmmmmmmmmmm\n444444444444\n', WITH_CIVET);
    const missing = `species civet: palette has no ramp bone: part ${CIVET_TORSO} draws bone values (l to o), which would show black; add 'ramp bone <four colour numbers, dark to light>' or 'ramp civet-bone ...'`;
    expect(wholePack(civet).structure).toEqual([missing]);
    expect(wholePack(civet).ok).toBe(false);
    expect(wholePack(WITH_BONE_RAMP(civet)).structure).toEqual([]);
    const own = planted(CIVET_RAMPS, `${CIVET_RAMPS}ramp civet-bone 0 1 1 1\n`, civet);
    expect(wholePack(own).structure).toEqual([]);
    // Another species' bone ramp is not this one's.
    expect(wholePack(planted(CIVET_RAMPS, `${CIVET_RAMPS}ramp otter-bone 0 1 1 1\n`, civet)).structure).toEqual([missing]);
    // A species' own ramp does not serve a generated creature's part: that still needs bone.
    expect(wholePack(planted(HEAD_ROWS, BONE_HEAD, own)).structure).toEqual([NO_BONE]);
  });
});

describe('checkPack: deep values (p to s), which need nothing of the palette', () => {
  const HEAD_ROWS = '666666\n666666\n666666\n666666\n555555\n';
  const DEEP_HEAD = 'qqqqqq\n666666\n666666\n666666\n555555\n';
  const layered = planted(TORSO_ROWS, LAYERED_ROWS);

  it('a part drawing deep, in its rows or in a hand-drawn layer, is OK with no ramp for it, and the report is that of the same pack drawn in hide', () => {
    // The same pack drawn in hide: the good pack, and the good pack with a hand-drawn striped layer on the head.
    const striped = (c: string): string => planted(HEAD_ROWS, `${HEAD_ROWS}layer striped\n.${c}....\n......\n......\n......\n......\n`);
    for (const [text, hide] of [[planted(HEAD_ROWS, DEEP_HEAD), GOOD], [striped('s'), striped('8')]] as const) {
      const r = checkPack(text);
      expect(r.parseError).toBeNull();
      expect(r.structure).toEqual([]);
      expect(errorsOf(r)).toEqual([]);
      expect(r.ok).toBe(true);
      expect(formatReport(r)).toBe(formatReport(checkPack(hide)));
    }
    // The same from the command: OK, exit 0, no word of deep or bone.
    const dir = mkdtempSync(join(tmpdir(), 'check-pack-deep-'));
    try {
      writeFileSync(join(dir, 'pack.txt'), planted(HEAD_ROWS, DEEP_HEAD));
      const run = spawnSync(process.execPath, [TOOL, join(dir, 'pack.txt')], { encoding: 'utf8' });
      expect(run.stdout.split('\n')[0]).toBe('check-pack: OK');
      expect(run.stdout).not.toMatch(/deep|bone/);
      expect(run.status).toBe(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('a layer pixel over deep is outside the drawn area, as one over bone or an eye value is', () => {
    const over = (top: string): string[] => errorsOf(checkPack(planted('layer flow\n..3456789abc', 'layer flow\n123456789abc', planted('.d2222222222', top, layered))));
    const line = (n: number): string => `error: part ${TORSO_ID} frame rest: layer flow has ${n} pixels outside the drawn area`;
    for (const c of 'pqrs') expect(over(`.${c}2222222222`), c).toEqual([line(2)]);
    expect(over('.l2222222222')).toContain(line(2));
    expect(over('.d2222222222')).toEqual([line(2)]);
    // Control: over hide, only the pixel over nothing is outside.
    expect(over('.22222222222')).toEqual([line(1)]);
  });

  it('the neck rule reads no deep pixel, as it reads no bone pixel', () => {
    // Accent shade 3 on the head against primary shade 1 on the torso: two steps, a warning counting the head's left column.
    const torso = planted(TORSO_ROWS, TORSO_ROWS.replace('111111111111', '222222222222'));
    const neckOf = (head: string) => checkPack(planted(HEAD_ROWS, head, torso)).neck.map((n) => n.pixels);
    expect(neckOf('888888\n888888\n888888\n888888\n888888\n')).toEqual([9]);
    // The left column in deep's lightest value (shade 3, as 8 is): those five pixels are no longer read.
    const deep = neckOf('s88888\ns88888\ns88888\ns88888\ns88888\n');
    expect(deep).toEqual([4]);
    expect(neckOf('o88888\no88888\no88888\no88888\no88888\n')).toEqual(deep);
    // A head all in deep is silent.
    expect(neckOf('ssssss\nssssss\nssssss\nssssss\nssssss\n')).toEqual([]);
  });
});

describe('check-pack coverage: what the generator asks for', () => {
  const RANGE = { first: 1, last: 20 };
  const EMPTY = parseCatalogueText(PALETTE);
  /** The creatures of RANGE as the game makes them, asked of a pack that holds nothing: every scaffold and every part's last-tried id is named. */
  const asked = Array.from({ length: RANGE.last - RANGE.first + 1 }, (_, i) => buildRecipe(makeGenome(RANGE.first + i, 'fauna', 1), [], EMPTY))
    .map((r) => ({ family: r.family, tier: r.tier, scaffold: r.scaffoldId, parts: new Set(r.gaps.filter((g) => g.startsWith('missing:')).map((g) => g.slice('missing:'.length))) }));
  const allScaffolds = [...new Set(asked.map((a) => a.scaffold))];
  const allParts = [...new Set(asked.flatMap((a) => [...a.parts]))];
  /** A pack of one-pixel parts and bare scaffolds: wrong in most other ways, which coverage does not look at. Each
   *  torso has the layer a translucent skin is painted from. */
  const pack = (scaffolds: string[], parts: string[]): string => PALETTE
    + parts.map((id) => `\npart ${id}\nframe rest anchor=0,0\n2\n${id.split('/')[1] === 'torso' ? 'layer translucent\n3\n' : ''}`).join('')
    + scaffolds.map((id) => `\nscaffold ${id} origin=16,12\npose rest\n`).join('');
  const coverageOf = (text: string) => checkPack(text, { sample: () => false, coverage: RANGE }).coverage!;
  const coverageLines = (text: string): string[] => formatReport(checkPack(text, { sample: () => false, coverage: RANGE })).split('\n').filter((l) => l.startsWith('coverage:'));

  it('reports every creature drawn in full by a pack that holds all they ask for', () => {
    const c = coverageOf(pack(allScaffolds, allParts));
    expect({ asked: c.asked, guardians: c.guardians, full: c.full, noScaffold: c.noScaffold, missingPart: c.missingPart, composeGap: c.composeGap }).toEqual({ asked: 20, guardians: 0, full: 20, noScaffold: 0, missingPart: 0, composeGap: 0 });
    expect(c.scaffolds).toEqual([]);
    expect(c.parts).toEqual([]);
    expect(c.rows.every((r) => r.full === r.asked)).toBe(true);
    expect(c.rows.reduce((n, r) => n + r.asked, 0)).toBe(20);
    expect(coverageLines(pack(allScaffolds, allParts))[0]).toBe('coverage: seeds 1 to 20 as the generator makes them, and the Guardians of the worlds of those seeds, each composed at rest (no Titan, no bred creature): 20 creatures (0 Guardians), 20 drawn in full, 0 with no scaffold, 0 with a part missing, 0 with a pose or skin gap');
  });

  it('names a scaffold tier the pack lacks once, with the creatures that ask for it, and leaves the other tiers drawn', () => {
    const gone = 'quadruped/membranous/small';
    const hit = asked.filter((a) => a.scaffold === gone).length;
    expect(hit).toBeGreaterThan(1);
    const sameRow = asked.filter((a) => a.family === 'quadruped' && a.tier === 'small').length;
    expect(sameRow).toBeGreaterThan(hit);
    const text = pack(allScaffolds.filter((id) => id !== gone), allParts);
    const c = coverageOf(text);
    expect(c.scaffolds).toEqual([{ id: gone, count: hit }]);
    expect(c.parts).toEqual([]);
    expect({ full: c.full, noScaffold: c.noScaffold, missingPart: c.missingPart }).toEqual({ full: 20 - hit, noScaffold: hit, missingPart: 0 });
    expect(c.rows.find((r) => r.family === 'quadruped' && r.tier === 'small')).toEqual({ family: 'quadruped', tier: 'small', asked: sameRow, full: sameRow - hit, noScaffold: hit, missingPart: 0, composeGap: 0 });
    expect(c.rows.filter((r) => r.noScaffold > 0)).toHaveLength(1);
    const lines = coverageLines(text);
    expect(lines).toContain(`coverage: no scaffold ${gone} (x${hit})`);
    expect(lines).toContain(`coverage: quadruped small: ${sameRow} asked, ${sameRow - hit} in full, ${hit} no scaffold, 0 part missing, 0 pose or skin gap`);
    expect(lines.filter((l) => l.startsWith('coverage: no scaffold '))).toHaveLength(1);
  });

  it('names a part the pack lacks once, with the creatures that ask for it', () => {
    const gone = 'quadruped/eyes/eye/large/v0';
    const hit = asked.filter((a) => a.parts.has(gone)).length;
    expect(hit).toBeGreaterThan(1);
    const text = pack(allScaffolds, allParts.filter((id) => id !== gone));
    const c = coverageOf(text);
    expect(c.parts).toEqual([{ id: gone, count: hit }]);
    expect(c.scaffolds).toEqual([]);
    expect({ full: c.full, noScaffold: c.noScaffold, missingPart: c.missingPart }).toEqual({ full: 20 - hit, noScaffold: 0, missingPart: hit });
    expect(coverageLines(text)).toContain(`coverage: missing part ${gone} (x${hit})`);
  });

  it('a creature with no scaffold is counted there only, whatever parts it also lacks', () => {
    const c = coverageOf(PALETTE);
    expect({ full: c.full, noScaffold: c.noScaffold, missingPart: c.missingPart }).toEqual({ full: 0, noScaffold: 20, missingPart: 0 });
    expect(c.scaffolds.map((m) => m.id).sort()).toEqual([...allScaffolds].sort());
    expect(c.parts).toEqual([]);
  });

  it('walks seeds 1 to 2000 unless told otherwise, changes no verdict, and is absent on a parse failure', () => {
    const r = checkPack(GOOD);
    expect(r.ok).toBe(true);
    const c = r.coverage!;
    // The 2,000 creatures and the 48 Guardians of those worlds. The good pack holds one small scaffold: 18 creatures
    // reach it and each lacks a part.
    expect({ first: c.first, last: c.last, asked: c.asked, guardians: c.guardians }).toEqual({ first: 1, last: 2000, asked: 2048, guardians: 48 });
    expect({ full: c.full, noScaffold: c.noScaffold, missingPart: c.missingPart, composeGap: c.composeGap }).toEqual({ full: 0, noScaffold: 2030, missingPart: 18, composeGap: 0 });
    expect(c.rows.filter((row) => row.tier === 'guardian').reduce((n, row) => n + row.asked, 0)).toBe(48);
    expect(formatReport(r).split('\n')[0]).toBe('check-pack: OK');
    expect(checkPack('part nonsense').coverage).toBeNull();
  });

  const unique = <T,>(values: T[]): T[] => [...new Set(values)];

  describe('the Guardians of the worlds of the same seeds', () => {
    /** The first world seed the game gives a Guardian. */
    const WORLD = Array.from({ length: 2000 }, (_, i) => i + 1).find((seed) => guardianFor(seed) !== null)!;
    const one = { first: WORLD, last: WORLD };
    const recipeOf = (genome: object) => buildRecipe(genome as Parameters<typeof buildRecipe>[0], [], EMPTY);
    const needs = (r: Recipe) => ({ scaffold: r.scaffoldId, parts: unique(r.gaps.filter((g) => g.startsWith('missing:')).map((g) => g.slice('missing:'.length))) });
    const creature = needs(recipeOf(makeGenome(WORLD, 'fauna', 1)));
    const guardian = recipeOf(guardianFor(WORLD)!.genome);
    const guardianNeeds = needs(guardian);
    const text = (scaffolds: string[]) => pack(scaffolds, unique([...creature.parts, ...guardianNeeds.parts]));
    const walk = (packText: string) => checkPack(packText, { sample: () => false, coverage: one }).coverage!;

    it('is drawn at the guardian tier, by the marker the game stores with it and not by a size gene', () => {
      expect(guardian.tier).toBe('guardian');
      expect(guardianNeeds.scaffold.endsWith('/guardian')).toBe(true);
      expect(guardianNeeds.scaffold).not.toBe(creature.scaffold);
    });

    it('each is a creature of its own, in a row of the guardian tier', () => {
      const c = walk(text([creature.scaffold, guardianNeeds.scaffold]));
      expect({ asked: c.asked, guardians: c.guardians, full: c.full }).toEqual({ asked: 2, guardians: 1, full: 2 });
      expect(c.rows.filter((r) => r.tier === 'guardian')).toEqual([{ family: guardian.family, tier: 'guardian', asked: 1, full: 1, noScaffold: 0, missingPart: 0, composeGap: 0 }]);
    });

    it('a pack that cannot draw a Guardian does not draw every creature in full', () => {
      const c = walk(text([creature.scaffold]));
      expect({ asked: c.asked, full: c.full, noScaffold: c.noScaffold }).toEqual({ asked: 2, full: 1, noScaffold: 1 });
      expect(c.scaffolds).toEqual([{ id: guardianNeeds.scaffold, count: 1 }]);
      expect(c.rows.find((r) => r.tier === 'guardian')).toEqual({ family: guardian.family, tier: 'guardian', asked: 1, full: 0, noScaffold: 1, missingPart: 0, composeGap: 0 });
    });

    it('the headline says how many of the creatures are Guardians and what the walk leaves out', () => {
      const line = formatReport(checkPack(text([creature.scaffold]), { sample: () => false, coverage: one })).split('\n').find((l) => l.startsWith('coverage: seeds'))!;
      expect(line).toBe(`coverage: seeds ${WORLD} to ${WORLD} as the generator makes them, and the Guardians of the worlds of those seeds, each composed at rest (no Titan, no bred creature): 2 creatures (1 Guardians), 1 drawn in full, 1 with no scaffold, 0 with a part missing, 0 with a pose or skin gap`);
    });
  });

  describe('what composing the rest pose finds', () => {
    /** The first seed whose creature has a translucent skin (gene 7) the composer paints: a radial is never skinned. */
    const SEED = Array.from({ length: 2000 }, (_, i) => i + 1).find((seed) => buildRecipe(makeGenome(seed, 'fauna', 1), [], EMPTY).skin === 7)!;
    const one = { first: SEED, last: SEED };
    const recipe = buildRecipe(makeGenome(SEED, 'fauna', 1), [], EMPTY);
    const parts = unique(recipe.gaps.filter((g) => g.startsWith('missing:')).map((g) => g.slice('missing:'.length)));
    const torso = parts.find((id) => id.split('/')[1] === 'torso')!;
    const bare = (id: string) => `\npart ${id}\nframe rest anchor=0,0\n2\n`;
    const text = (torsoText: string, scaffoldText: string) => PALETTE + parts.filter((id) => id !== torso).map(bare).join('') + torsoText + scaffoldText;
    const scaffold = `\nscaffold ${recipe.scaffoldId} origin=16,12\npose rest\n`;
    const walk = (packText: string) => checkPack(packText, { sample: () => false, coverage: one }).coverage!;

    it('a translucent creature whose torso has its translucent layer is drawn in full', () => {
      const c = walk(text(`${bare(torso)}layer translucent\n3\n`, scaffold));
      expect({ asked: c.asked, full: c.full, composeGap: c.composeGap, gaps: c.gaps }).toEqual({ asked: 1, full: 1, composeGap: 0, gaps: [] });
    });

    it('without that layer it is not drawn in full: the skin gap is counted and named', () => {
      const packText = text(bare(torso), scaffold);
      const c = walk(packText);
      expect({ asked: c.asked, full: c.full, noScaffold: c.noScaffold, missingPart: c.missingPart, composeGap: c.composeGap }).toEqual({ asked: 1, full: 0, noScaffold: 0, missingPart: 0, composeGap: 1 });
      expect(c.gaps).toEqual([{ id: `skin:${torso}:rest`, count: 1 }]);
      const lines = formatReport(checkPack(packText, { sample: () => false, coverage: one })).split('\n');
      expect(lines).toContain(`coverage: gap skin:${torso}:rest (x1)`);
      expect(lines.find((l) => l.startsWith('coverage: seeds'))).toContain('0 drawn in full, 0 with no scaffold, 0 with a part missing, 1 with a pose or skin gap');
    });

    it('a scaffold with no rest pose is a pose gap, counted and named', () => {
      const c = walk(text(`${bare(torso)}layer translucent\n3\n`, `\nscaffold ${recipe.scaffoldId} origin=16,12\npose faint\n`));
      expect({ full: c.full, composeGap: c.composeGap, gaps: c.gaps }).toEqual({ full: 0, composeGap: 1, gaps: [{ id: 'pose:rest', count: 1 }] });
    });
  });

  it('a requirement of coverage is met only by creatures: a walk that asked for none falls short, as one with a gap does', () => {
    const full = pack(allScaffolds, allParts);
    expect(coverageShortfall(coverageOf(full))).toBeNull();
    expect(coverageShortfall(coverageOf(pack(allScaffolds.slice(1), allParts)))).toMatch(/^\d+ of 20 generated creatures cannot be drawn in full$/);
    const none = checkPack(full, { sample: () => false, coverage: { first: 5, last: 1 } }).coverage!;
    expect(none.asked).toBe(0);
    expect(coverageShortfall(none)).toBe('the walk asked for no creature');
  });

  // The first seed whose creature the good pack draws in full (a small sturdy quadruped with no back part or feature,
  // its skin slick). Seed 18396 has every part too, but its skin is translucent and the good torso has no layer for it.
  const COVERED = 28460;
  it('exits 0 with a gap, and 1 with --require-coverage only when there is a gap', () => {
    const dir = mkdtempSync(join(tmpdir(), 'check-pack-'));
    try {
      const file = join(dir, 'pack.txt');
      writeFileSync(file, GOOD);
      const run = (...flags: string[]) => spawnSync(process.execPath, [TOOL, ...flags, file], { encoding: 'utf8' });
      const one = `--coverage-seeds=${COVERED}-${COVERED}`;
      const two = `--coverage-seeds=${COVERED - 1}-${COVERED}`;
      const covered = run('--require-coverage', one);
      expect(covered.stdout).toContain(`coverage: seeds ${COVERED} to ${COVERED} as the generator makes them, and the Guardians of the worlds of those seeds, each composed at rest (no Titan, no bred creature): 1 creatures (0 Guardians), 1 drawn in full, 0 with no scaffold, 0 with a part missing, 0 with a pose or skin gap`);
      expect([covered.status, covered.stderr]).toEqual([0, '']);
      const gap = run(two);
      expect(gap.stdout).toContain('2 creatures (0 Guardians), 1 drawn in full');
      expect([gap.status, gap.stderr]).toEqual([0, '']);
      const required = run('--require-coverage', two);
      expect(required.stdout).toBe(gap.stdout);
      expect([required.status, required.stderr]).toEqual([1, 'check-pack: coverage required: 1 of 2 generated creatures cannot be drawn in full\n']);
      const skinless = run('--require-coverage', '--coverage-seeds=18396-18396');
      expect(skinless.stdout).toContain('coverage: gap skin:quadruped/torso/sturdy/small/v0:rest (x1)');
      expect([skinless.status, skinless.stderr]).toEqual([1, 'check-pack: coverage required: 1 of 1 generated creatures cannot be drawn in full\n']);
      const unknown = run('--require-covrage');
      expect(unknown.status).toBe(2);
      // A range that runs backwards names no seed: a usage error, never a requirement met by nothing.
      const usage = 'usage: node tools/check-pack.mjs [--require-coverage] [--coverage-seeds=<first>-<last>] <pack.txt> [more.txt ...]\n';
      for (const flags of [['--coverage-seeds=9-3'], ['--require-coverage', '--coverage-seeds=9-3']]) {
        const reversed = run(...flags);
        expect([reversed.status, reversed.stdout, reversed.stderr], flags.join(' ')).toEqual([2, '', `check-pack: --coverage-seeds=9-3 names no seed: the first is after the last\n${usage}`]);
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
