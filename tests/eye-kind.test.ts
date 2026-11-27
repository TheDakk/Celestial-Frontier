import { parseCatalogueText, type Catalogue } from '@cf/art-format';
import { assemble, compose } from '@cf/art-compose';
import { buildRecipe, type Recipe } from '@cf/art-recipe';
import { describe, expect, it } from 'vitest';
import { checkPack } from '../tools/check-pack.mjs';
import { errorsOf, planted, PLACEHOLDER_TEXT } from './support/placeholder-check';
import { poseSweepBudget } from './support/budget';

// A pose-sweep file: it drives the pack checker over the whole placeholder pack, several times. Its tests take the pose-sweep budget, for the reason written at POSE_SWEEP_BUDGET_MS.
poseSweepBudget();

// An eye kind: one eye drawn for a whole eye count, at the one-eyed creature's eye place. A pack offers it as the part
// `<family>/eyes/eye-<count>/<tier>/v0`; a pack without it draws the count's separate eyes, as before.
const EYE = 'part quadruped/eyes/eye/medium/v0\nframe rest anchor=0,1\n76\nde\n';
/** The kind's own drawing, unlike the plain eye's, with a closed frame. */
const KIND_FRAMES = 'frame rest anchor=0,1\ne7\n6d\nframe closed anchor=0,1\ndd\ndd\n';
const FAINT = 'pose faint\nentry torso 0 rest 0 2\nentry head 0 rest 0 3\nentry tail 0 rest 0 2\n\nscaffold quadruped/stilt/medium';
/** The faint pose closing a single eye: the entry a one-eyed creature takes, and so the one an eye kind takes. */
const FAINT_CLOSED = FAINT.replace('\n\n', '\nentry eyes 0 closed 0 0 eyes=1\n\n');
const KIND_ID = 'quadruped/eyes/eye-8/medium/v0';

/** The placeholder pack with an eye kind for eight eyes (four-legged and crustacean bodies) and a closed single eye when faint. */
const kindsText = (kindFrames = KIND_FRAMES, faint = FAINT_CLOSED): string => planted(FAINT, faint,
  planted(EYE, `${EYE.replace('76\nde\n', '76\nde\nframe closed anchor=0,1\ndd\ndd\n')}\npart ${KIND_ID}\n${kindFrames}\npart crustacean/eyes/eye-8/medium/v0\n${KIND_FRAMES}`, PLACEHOLDER_TEXT));
/** The placeholder pack with no kind, whose plain eye is drawn as the kind is: what a one-eyed creature shows of it. */
const plainAsKindText = (): string => planted(FAINT, FAINT_CLOSED, planted(EYE, `part quadruped/eyes/eye/medium/v0\n${KIND_FRAMES}`, PLACEHOLDER_TEXT));

const plain = parseCatalogueText(PLACEHOLDER_TEXT);
const kinds = parseCatalogueText(kindsText());
const EIGHT = 3; // the eyes gene of eight eyes
const TWO = 0;

/** A genome the placeholder pack draws on `scaffoldId`, with this eyes gene. */
function genomeOn(scaffoldId: string, eyes: number): Record<string, unknown> {
  for (let body = 0; body < 16; body++) for (let size = 0; size < 6; size++) for (let seed = 1; seed <= 12; seed++) {
    const genome = { kingdom: 'fauna', body, loco: 0, habitat: 0, size, head: 0, tail: 1, limbs: 0, eyes, pattern: 0, skin: 0, color: 0, accent: 0, lumin: false, seed };
    if (buildRecipe(genome, [], plain).scaffoldId === scaffoldId) return genome;
  }
  throw new Error(`no genome on ${scaffoldId}`);
}
const eyeParts = (r: Recipe): string[] => r.parts.filter((p) => p.slot === 'eyes').map((p) => `${p.index}:${p.partId}`);
const picture = (genome: Record<string, unknown>, pose: string, catalogue: Catalogue): string => compose(buildRecipe(genome, [], catalogue), pose, catalogue).hash;

describe('an eye kind', () => {
  const eight = genomeOn('quadruped/sturdy/medium', EIGHT);

  it('a pack without the kind draws eight separate eyes, and the kind elsewhere in a pack changes no other count', () => {
    const today = buildRecipe(eight, [], plain);
    expect(today.eyes).toBe(8);
    expect(eyeParts(today)).toEqual(Array.from({ length: 8 }, (_, i) => `${i}:quadruped/eyes/eye/medium/v0`));
    // A two-eyed creature in the pack with a kind for eight only: requested and drawn exactly as in the pack without.
    const two = genomeOn('quadruped/sturdy/medium', TWO);
    expect(buildRecipe(two, [], kinds)).toEqual(buildRecipe(two, [], plain));
    expect(eyeParts(buildRecipe(two, [], kinds))).toEqual(['0:quadruped/eyes/eye/medium/v0', '1:quadruped/eyes/eye/medium/v0']);
    for (const pose of ['rest', 'strike']) expect(picture(two, pose, kinds)).toBe(picture(two, pose, plain));
  });

  it('a pack with the kind draws exactly one eye, of that kind, where a one-eyed creature has its eye, in every pose', () => {
    const recipe = buildRecipe(eight, [], kinds);
    expect(eyeParts(recipe)).toEqual([`0:${KIND_ID}`]);
    // No gap but the ones the creature has without the kind (the placeholder holds one variant of each part).
    expect(recipe.gaps).toEqual(buildRecipe(eight, [], plain).gaps);
    // The same creature as a one-eyed creature of a pack whose plain eye is drawn as the kind is.
    const asKind = parseCatalogueText(plainAsKindText());
    const today = buildRecipe(eight, [], asKind);
    const oneEyed: Recipe = { ...today, eyes: 1, parts: today.parts.filter((p) => p.slot !== 'eyes' || p.index === 0) };
    for (const pose of ['rest', 'strike', 'faint']) {
      const drawn = compose(recipe, pose, kinds);
      expect(drawn.gaps).toEqual(recipe.gaps);
      expect(drawn.hash).toBe(compose(oneEyed, pose, asKind).hash);
      expect(drawn.hash).not.toBe(picture(eight, pose, plain));
    }
    // Faint shows the kind's closed frame: not its rest frame.
    const open = { ...kinds, parts: new Map(kinds.parts) };
    const kind = kinds.parts.get(KIND_ID)!;
    open.parts.set(KIND_ID, { ...kind, frames: { ...kind.frames, closed: kind.frames['rest']! } });
    expect(assemble(recipe, 'faint', kinds).buffer.pixels).not.toEqual(assemble(recipe, 'faint', open).buffer.pixels);
  });

  it('a kind for no eyes replaces the two pits with one part, laid out as a single eye', () => {
    const PITS = 5; // the eyes gene of no eyes
    const none = genomeOn('quadruped/sturdy/medium', PITS);
    expect(eyeParts(buildRecipe(none, [], kinds))).toEqual(['0:quadruped/eyes/pit/medium/v0', '1:quadruped/eyes/pit/medium/v0']);
    const id = 'quadruped/eyes/eye-0/medium/v0';
    const withPits = { ...kinds, parts: new Map(kinds.parts).set(id, { ...kinds.parts.get(KIND_ID)!, id, kind: 'eye-0' }) };
    const recipe = buildRecipe(none, [], withPits);
    expect(eyeParts(recipe)).toEqual([`0:${id}`]);
    expect(recipe.eyes).toBe(1);
  });

  it('a body whose eyes are painted in its torso asks for no eye, kind or not', () => {
    const crab = genomeOn('crustacean/crab/medium', EIGHT);
    expect(eyeParts(buildRecipe(crab, [], kinds))).toEqual([]);
    expect(buildRecipe(crab, [], kinds)).toEqual(buildRecipe(crab, [], plain));
    expect(picture(crab, 'rest', kinds)).toBe(picture(crab, 'rest', plain));
    // The lobster, whose eyes are parts, takes the crustacean kind.
    expect(eyeParts(buildRecipe(genomeOn('crustacean/lobster/medium', EIGHT), [], kinds))).toEqual(['0:crustacean/eyes/eye-8/medium/v0']);
  });
});

describe('checkPack on a pack with an eye kind', () => {
  /** The whole-pack checks, the sturdy scaffold sampled, a short coverage walk. */
  const check = (text: string) => checkPack(text, { sample: (id) => id === 'quadruped/sturdy/medium', coverage: { first: 1, last: 300 } });

  it('accepts the kind, draws creatures with it, and counts them as drawn in full', () => {
    const r = check(kindsText());
    expect(errorsOf(r)).toEqual([]);
    expect(r.ok).toBe(true);
    const without = check(PLACEHOLDER_TEXT);
    expect(without.ok).toBe(true);
    expect(r.coverage!.asked).toBe(without.coverage!.asked);
    expect(r.coverage!.full).toBe(without.coverage!.full);
    expect(r.coverage!.full).toBeGreaterThan(0);
  });

  it('refuses a kind for a count no creature has', () => {
    const r = check(planted(`part ${KIND_ID}\n`, 'part quadruped/eyes/eye-3/medium/v0\n', kindsText()));
    expect(r.ok).toBe(false);
    expect(r.unreachable.some((l) => l.includes('quadruped/eyes/eye-3/medium/v0'))).toBe(true);
  });

  it('refuses a kind that shows no pixel: one moved off the canvas in a pose', () => {
    const r = check(kindsText(KIND_FRAMES, FAINT.replace('\n\n', '\nentry eyes 0 closed 0 -60 eyes=1\n\n')));
    expect(r.ok).toBe(false);
    expect(r.hidden.some((h) => h.partId === KIND_ID && h.pose === 'faint' && h.visible === 0)).toBe(true);
  });

  it('accepts a kind whose closed frame is smaller than its rest frame and shows in full', () => {
    // The rest frame draws four pixels and the closed frame two: in faint the part owes the two it draws there, not rest's four.
    const r = check(kindsText('frame rest anchor=0,1\ne7\n6d\nframe closed anchor=0,1\n..\ndd\n'));
    expect(r.hidden.filter((h) => h.partId === KIND_ID)).toEqual([]);
    expect(errorsOf(r)).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it('refuses a kind that draws nothing', () => {
    const r = check(kindsText('frame rest anchor=0,1\n..\n..\nframe closed anchor=0,1\n..\n..\n'));
    expect(r.ok).toBe(false);
    expect(r.hidden.some((h) => h.partId === KIND_ID && h.visible === 0 && h.needed === 1)).toBe(true);
    expect(errorsOf(r).some((l) => l.startsWith(`error: hidden part ${KIND_ID} `))).toBe(true);
  });
});
