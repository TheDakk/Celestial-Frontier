import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIMB_COUNTS } from '@cf/art-format';
import { beforeAll, describe, expect, it } from 'vitest';
import { checkPack, formatReport, type PackReport } from '../tools/check-pack.mjs';

const TOOL = fileURLToPath(new URL('../tools/check-pack.mjs', import.meta.url));
const PLACEHOLDER = new URL('../packages/art-testparts/src/quadruped.txt', import.meta.url);

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

describe('checkPack on a known-good pack', () => {
  it('reports no error, only variant information', () => {
    const r = checkPack(GOOD);
    expect(errorsOf(r)).toEqual([]);
    expect(r.ok).toBe(true);
    expect(r.gaps.every((g) => g.gap.startsWith('variant:') && !g.error)).toBe(true);
    expect(r.composed).toBeGreaterThan(100);
    expect(r.summary).toMatchObject({ parts: 7, scaffolds: 1, fallbacks: 1, colours: 2, ramps: 8, bySlot: { torso: 2, head: 1, tail: 1, farLimbs: 1, nearLimbs: 1, eyes: 1 } });
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

  it('a palette with ramps must hold every iris ramp; a palette with none needs none', () => {
    const r = checkPack(planted('ramp iris3 1 1 1 1\n', ''));
    expect(r.structure).toEqual(['palette: missing iris ramp iris3']);
    expect(errorsOf(r)).toEqual(['error: palette: missing iris ramp iris3']);
    expect(r.ok).toBe(false);
    expect(checkPack(GOOD).structure).toEqual([]);
    const noRamps = GOOD.replace(/ramp iris\d [0-9 ]+\n/g, '');
    expect(noRamps).not.toContain('ramp');
    expect(checkPack(noRamps).structure).toEqual([]);
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

  it('a leg-count suffix on a name that is not a leg point, a zero leg count, or a leg index beyond the side is an error', () => {
    const bad = checkPack(planted('near3:10,5', 'near3:10,5,head_2:10,1,near0_0:1,5,far1_3:3,5'));
    expect(bad.structure).toEqual([
      `part ${TORSO_ID} frame rest: attach point head_2 is for a leg count that never uses it`,
      `part ${TORSO_ID} frame rest: attach point near0_0 is for a leg count that never uses it`,
      `part ${TORSO_ID} frame rest: attach point far1_3 is for a leg count that never uses it`,
    ]);
  });

  it('heads need no feature point in a pack without head features', () => {
    expect(checkPack(GOOD).structure).toEqual([]);
  });

  it('every head frame needs a feature point once the pack has a head feature of its family and tier', () => {
    const line = 'part quadruped/head/h0/small/v0 frame rest: missing attach point feature';
    const feature = '\npart quadruped/headFeature/horns/small/v0\nframe rest anchor=0,0\n1\n';
    const r = checkPack(GOOD + feature);
    expect(r.structure).toEqual([line]);
    expect(r.ok).toBe(false);
    expect(checkPack(planted(',eye7:4,3', ',eye7:4,3,feature:3,0') + feature).structure).toEqual([]);
    // A head feature at another tier asks nothing of a small head.
    expect(checkPack(GOOD + feature.replaceAll('/small/', '/large/')).structure).not.toContain(line);
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
    expect(r.neck[0]).toMatchObject({ head: 'quadruped/head/h0/small/v0', torso: TORSO_ID });
    expect(r.neck[0]!.pairs).toBeGreaterThan(0);
    // Seven poses at nine head shifts, four legs: every case has the head beside the torso.
    expect(r.neck[0]!.cases).toBe(63);
    expect(r.ok).toBe(true);
    const text = formatReport(r);
    expect(text.split('\n')[0]).toBe('check-pack: OK');
    const warnings = text.split('\n').filter((l) => l.startsWith('warning: neck join'));
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toMatch(/^warning: neck join quadruped\/head\/h0\/small\/v0 on quadruped\/torso\/sturdy\/small\/v0: \d+ pixel pairs more than one shade step apart in 63 pose shifts, e\.g\. pose rest head shift -1,-1 legs 4: head \d+,\d+ value 8 shade 3 beside torso \d+,\d+ value 2 shade 1$/);
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
    expect(r.neck[0]).toMatchObject({ head: 'quadruped/head/h0/small/v0', torso: TORSO_ID, cases: 9 });
    expect(r.neck[0]!.example).toMatch(/^pose rest head shift -1,-1 legs 2: /);
    expect(r.ok).toBe(true);
  });
});

/** The limbs gene for a leg count. */
const limbGene = (legs: number): number => (LIMB_COUNTS as readonly number[]).indexOf(legs);

describe('checkPack on the placeholder catalogue (the real result, pinned)', () => {
  let text: string;
  let r: PackReport;
  beforeAll(() => { text = readFileSync(PLACEHOLDER, 'utf8'); r = checkPack(text); });

  it('passes clean: parses, sums up, has every attach point, pose and fallback, never touches the edge, nothing comes loose', () => {
    expect(r.parseError).toBeNull();
    expect(r.summary).toMatchObject({ parts: 85, scaffolds: 6, fallbacks: 60, colours: 16, ramps: 42, byTier: { medium: 40, small: 15, large: 15, guardian: 15 } });
    expect(r.structure).toEqual([]);
    expect(r.unreachable).toEqual([]);
    expect(r.failures).toEqual([]);
    expect(r.edge).toEqual([]);
    expect(r.detached).toEqual([]);
    expect(r.hidden).toEqual([]);
    expect(r.gaps.filter((g) => g.error)).toEqual([]);
    expect(errorsOf(r)).toEqual([]);
    expect(r.ok).toBe(true);
    expect(r.composed).toBe(20580);
  });

  it('still reports a head drawn flush against the torso again, on that scaffold only, at the shifts that open the gap', () => {
    const flush = text.replace('part quadruped/torso/sturdy/medium/v0\nframe rest anchor=0,0 attach=head:32,3,', 'part quadruped/torso/sturdy/medium/v0\nframe rest anchor=0,0 attach=head:36,3,');
    expect(flush).not.toBe(text);
    const bad = checkPack(flush);
    expect(bad.ok).toBe(false);
    expect(new Set(bad.detached.map((d) => `${d.scaffold} ${d.off.filter((slot) => slot !== 'eyes').join(',')}`))).toEqual(new Set(['quadruped/sturdy/medium head']));
    expect(errorsOf(bad).filter((l) => l.startsWith('error: detached head on quadruped/sturdy/medium '))).toHaveLength(1);
    // Rest has no head offset: only a +1 head shift opens the gap there.
    expect(new Set(bad.detached.filter((d) => d.pose === 'rest').map((d) => d.shift.head[0]))).toEqual(new Set([1]));
  });
});

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
    // At the large tier with head kind h9, the art streams of every creature the tool samples pick head variant v0 or
    // v1, never v2. v2 is drawn far off the torso, so it is loose at every shift: had any sampled creature picked it,
    // a finding without a forced variant would name it. Only forcing v2 into a creature finds it.
    const large = GOOD.replaceAll('/small', '/large').replace('part quadruped/head/h0/large/v0', 'part quadruped/head/h9/large/v0');
    const FAR = FLUSH.replace('anchor=-2,0', 'anchor=-10,0');
    const r = checkPack(`${large}\npart quadruped/head/h9/large/v1\n${GOOD_HEAD}\npart quadruped/head/h9/large/v2\n${FAR}`);
    expect(r.parseError).toBeNull();
    expect(r.unreachable).toEqual([]);
    expect(r.variants).toBe(3);
    expect(r.detached.length).toBeGreaterThan(0);
    expect(r.detached.filter((d) => d.variant === undefined)).toEqual([]);
    expect(new Set(r.detached.map((d) => d.variant))).toEqual(new Set(['quadruped/head/h9/large/v2']));
    expect(new Set(r.detached.map((d) => d.shift.head.join(',')))).toHaveProperty('size', 9);
    expect(errorsOf(r).some((l) => l.startsWith('error: detached head on quadruped/sturdy/large ') && l.endsWith('with variant quadruped/head/h9/large/v2'))).toBe(true);
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
