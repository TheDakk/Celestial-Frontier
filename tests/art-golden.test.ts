import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MARK_SLOTS, PATTERN_NAMES, type Catalogue, type Part, type Scaffold } from '@cf/art-format';
import { __buildRecipeAtVersionForTests, buildRecipe, GENE_LENGTHS, identityKey, RENDERER_VERSION, resolveAnatomy, type Recipe } from '@cf/art-recipe';
import { compose, toAscii } from '@cf/art-compose';
import { testCatalogue } from '@cf/art-testparts';
import { mulberry32 } from '@cf/domain-rand';

interface Entry { label: string; genome: Record<string, unknown>; pose: string; hash: string; gaps: string[]; contact: [number, number] | null; }
interface Fixture { rendererVersion: number; catalogue: string; entries: Entry[]; }

const fixture: Fixture = JSON.parse(readFileSync(new URL('../fixtures/art/quadruped-v1.json', import.meta.url), 'utf8'));
const catalogue = testCatalogue();

const run = (entry: Entry, cat: Catalogue = catalogue) => compose(buildRecipe(entry.genome, [], cat), entry.pose, cat);
const isReal = (entry: Entry) => !entry.gaps.some((gap) => gap.startsWith('fallback:'));
const byLabel = (label: string): Entry[] => fixture.entries.filter((e) => e.label === label);

describe('art golden hashes', () => {
  it('records the current renderer version, the test catalogue and the expected entry count', () => {
    expect(fixture.rendererVersion).toBe(RENDERER_VERSION);
    expect(fixture.catalogue).toBe('art-testparts');
    expect(fixture.entries).toHaveLength(621);
  });

  it('has at least 150 entries that compose a real quadruped', () => {
    expect(fixture.entries.filter(isReal).length).toBeGreaterThanOrEqual(150);
  });

  it('records both real Guardians at the guardian tier', () => {
    for (const world of ['kaum', 'osum']) {
      const entries = byLabel(`guardian ${world}`);
      expect(entries.map((e) => e.pose)).toEqual(['rest', 'strike']);
      for (const e of entries) expect(buildRecipe(e.genome, [], catalogue).tier).toBe('guardian');
    }
  });

  it('records the six extremophiles at rest and strike, and an aerial flora at rest', () => {
    const extremophiles = fixture.entries.filter((e) => e.label.startsWith('extremophile '));
    expect(extremophiles).toHaveLength(12);
    expect(extremophiles.map((e) => e.pose)).toEqual(Array.from({ length: 6 }, () => ['rest', 'strike']).flat());
    expect(extremophiles.every((e) => e.genome['x'] === 1)).toBe(true);
    const aerial = byLabel('aerial flora');
    expect(aerial.map((e) => e.pose)).toEqual(['rest']);
    expect(aerial[0]!.genome['af']).toBe(1);
    expect(aerial[0]!.genome['kingdom']).toBe('flora');
  });

  it('holds a gene value outside its table, a non-integer number and a bred genome with parents', () => {
    const outside = fixture.entries.some((e) => (Object.keys(GENE_LENGTHS) as (keyof typeof GENE_LENGTHS)[]).some((gene) => {
      const v = e.genome[gene];
      return typeof v === 'number' && Number.isInteger(v) && (v < 0 || v >= GENE_LENGTHS[gene]);
    }));
    expect(outside).toBe(true);
    expect(fixture.entries.some((e) => Object.values(e.genome).some((v) => typeof v === 'number' && !Number.isInteger(v)))).toBe(true);
    expect(fixture.entries.some((e) => Array.isArray(e.genome['parents']))).toBe(true);
  });

  it('gives a bred pair with its parents swapped a different picture', () => {
    const bred = fixture.entries.filter((e) => e.label.startsWith('bred '));
    expect(bred).toHaveLength(4);
    const differs = [0, 2].map((i) => {
      const [a, b] = [bred[i]!, bred[i + 1]!];
      expect(a.genome['parents']).toEqual([...(b.genome['parents'] as unknown[])].reverse());
      // Swapping the parents always changes the identity; the recorded pictures differ too.
      expect(identityKey(a.genome, [])).not.toBe(identityKey(b.genome, []));
      return a.hash !== b.hash;
    });
    expect(differs.some((d) => d)).toBe(true);
  });

  it('recomputes every entry to its recorded hash, gaps and contact', () => {
    for (const entry of fixture.entries) {
      const actual = run(entry);
      if (actual.hash !== entry.hash || JSON.stringify(actual.gaps) !== JSON.stringify(entry.gaps) || JSON.stringify(actual.contact) !== JSON.stringify(entry.contact)) {
        expect.fail(
          `${entry.label} (${entry.pose}): expected hash ${entry.hash}, actual ${actual.hash}\n` +
          `expected gaps ${JSON.stringify(entry.gaps)}\nactual gaps   ${JSON.stringify(actual.gaps)}\n` +
          `expected contact ${JSON.stringify(entry.contact)}, actual ${JSON.stringify(actual.contact)}\n${toAscii(actual.buffer)}`,
        );
      }
    }
  });
});

/** A deep copy of the catalogue in which one pixel of one frame of one part is changed. */
function withOnePixelChanged(source: Catalogue, partId: string): Catalogue {
  const parts = new Map<string, Part>();
  for (const [id, part] of source.parts) {
    const frames = Object.fromEntries(Object.entries(part.frames).map(([name, f]) => [name, { ...f, pixels: new Uint8Array(f.pixels) }]));
    parts.set(id, { ...part, frames });
  }
  const frame = (parts.get(partId) as Part).frames['rest']!;
  const { w, pixels } = frame;
  // An interior pixel (all four neighbours drawn). The light and shade step moves an edge pixel by one shade and
  // clamps it within its ramp, so a one-shade edit on an edge can be masked; an interior pixel is safer to edit.
  const at = pixels.findIndex((p, i) => p !== 0 && i % w > 0 && i % w < w - 1 && i >= w && i < pixels.length - w && pixels[i - 1] !== 0 && pixels[i + 1] !== 0 && pixels[i - w] !== 0 && pixels[i + w] !== 0);
  expect(at).toBeGreaterThan(0);
  frame.pixels[at] = (frame.pixels[at] as number) % 4 + 1; // a different body value, 1-4
  return { ...source, parts };
}

describe('art golden negative controls', () => {
  it('a one-pixel change to one used part changes at least one recorded hash', () => {
    const real = fixture.entries.filter(isReal);
    const usedPart = buildRecipe(real[0]!.genome, [], catalogue).parts.find((p) => p.slot === 'torso')!.partId;
    const edited = withOnePixelChanged(catalogue, usedPart);
    expect(edited.parts.get(usedPart)).not.toEqual(catalogue.parts.get(usedPart));
    const changed = fixture.entries.filter((entry) => run(entry, edited).hash !== entry.hash);
    expect(changed.length).toBeGreaterThanOrEqual(1);
  });

  it('composes the same entries in a shuffled order, 50 times each, with the same hash every time', () => {
    const picks = fixture.entries.filter(isReal).slice(0, 6);
    const jobs: number[] = [];
    for (let i = 0; i < picks.length; i++) for (let n = 0; n < 50; n++) jobs.push(i);
    const random = mulberry32(20261120);
    for (let i = jobs.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [jobs[i], jobs[j]] = [jobs[j] as number, jobs[i] as number];
    }
    for (const index of jobs) {
      const entry = picks[index] as Entry;
      expect(run(entry).hash, entry.label).toBe(entry.hash);
    }
  });

  it('composes the recorded entries at renderer version 2 with at least one different hash, and at version 1 with none', () => {
    const at = (version: number, entry: Entry) =>
      compose(__buildRecipeAtVersionForTests(version, entry.genome, [], catalogue), entry.pose, catalogue).hash;
    const differAt = (version: number) => fixture.entries.filter((entry) => at(version, entry) !== entry.hash).length;
    expect(differAt(1)).toBe(0);
    expect(differAt(2)).toBeGreaterThanOrEqual(1);
  });
});

/** The catalogue with `edit` applied to every part: a copy, the shared catalogue is never changed. */
const editParts = (source: Catalogue, edit: (part: Part) => Part): Catalogue =>
  ({ ...source, parts: new Map([...source.parts].map(([id, p]) => [id, edit(p)])) });
const withoutLayers = (source: Catalogue): Catalogue =>
  editParts(source, (p) => ({ ...p, frames: Object.fromEntries(Object.entries(p.frames).map(([n, { layers: _drop, ...f }]) => [n, f])) }));
const EYE = 'quadruped/eyes/eye/medium/v0';

describe('art golden format 2', () => {
  const real = fixture.entries.filter(isReal);

  it('the recorded real entries cover every pattern gene, every skin gene, 2, 3, 4, 6 and 8 legs, and the tusked and horned torsos', () => {
    const anatomies = real.map((e) => resolveAnatomy(e.genome));
    expect(real).toHaveLength(173);
    expect([...new Set(anatomies.map((a) => a.pattern))].sort()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(PATTERN_NAMES).toHaveLength(8);
    expect([...new Set(anatomies.map((a) => a.skin))].sort()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect([...new Set(anatomies.map((a) => a.limbs))].filter((n) => n > 0).sort()).toEqual([2, 3, 4, 6, 8]);
    const torsos = new Set(anatomies.map((a) => a.torso));
    expect(torsos.has('tusked') && torsos.has('horned')).toBe(true);
  });

  it('removing every layer from the catalogue changes at least one recorded hash and adds a marks: gap', () => {
    const bare = withoutLayers(catalogue);
    let changed = 0;
    let marksGaps = 0;
    for (const entry of real) {
      const out = run(entry, bare);
      if (out.hash !== entry.hash) changed++;
      if (out.gaps.some((g) => g.startsWith('marks:'))) marksGaps++;
      // The recorded pictures themselves carry no marks: gap: every recorded mark-slot frame has its layers.
      expect(entry.gaps.filter((g) => g.startsWith('marks:')), entry.label).toEqual([]);
    }
    expect(changed).toBeGreaterThanOrEqual(1);
    expect(marksGaps).toBeGreaterThanOrEqual(1);
  });

  it('a recorded real picture holds an iris value 17-20, and none holds 5-8 where an eye part was stacked', () => {
    const eyeFrame = catalogue.parts.get(EYE)!.frames['rest']!;
    expect([...eyeFrame.pixels].some((v) => v >= 5 && v <= 8)).toBe(true);
    // The eye part's iris pixels moved to 13 (the eye value): the pixels that change are exactly where an iris landed.
    const noIris = editParts(catalogue, (p) => (p.id !== EYE ? p : { ...p, frames: { rest: { ...eyeFrame, pixels: eyeFrame.pixels.map((v) => (v >= 5 && v <= 8 ? 13 : v)) } } }));
    let withIris = 0;
    for (const entry of real) {
      const recipe = buildRecipe(entry.genome, [], catalogue);
      const shown = compose(recipe, entry.pose, catalogue).buffer.pixels;
      const moved = compose(recipe, entry.pose, noIris).buffer.pixels;
      expect(moved.some((v) => v >= 17 && v <= 20), entry.label).toBe(false);
      for (let i = 0; i < shown.length; i++) {
        if (shown[i] === moved[i]) continue;
        if (!(shown[i]! >= 17 && shown[i]! <= 20)) expect.fail(`${entry.label} ${entry.pose}: pixel ${i} is ${shown[i]} where the eye's iris landed`);
      }
      if (shown.some((v) => v >= 17 && v <= 20)) withIris++;
      else expect(recipe.parts.some((p) => p.slot === 'eyes'), entry.label).toBe(false);
    }
    expect(withIris).toBeGreaterThan(100);
  });

  it('the recorded real pictures show back parts, role legs, marks and the stance entries, and each vanishes under a planted fault', () => {
    const sameHash = (a: Recipe, b: Recipe, pose: string, cat: Catalogue = catalogue): boolean => compose(a, pose, cat).hash === compose(b, pose, cat).hash;
    const counts = { back: 0, feature: 0, roles: 0, patterned: 0, marked: 0, stance: 0 };
    const dropParts = (drop: RegExp): Catalogue => ({ ...catalogue, parts: new Map([...catalogue.parts].filter(([id]) => !drop.test(id))) });
    const noBacks = dropParts(/\/back\//);
    const noRoles = dropParts(/Limbs\/(fore|hind|mid)\//);
    const bare = withoutLayers(catalogue);
    const noStance: Catalogue = {
      ...editParts(catalogue, (p) => ({ ...p, frames: Object.fromEntries(Object.entries(p.frames).map(([n, f]) => [n, { ...f, attach: Object.fromEntries(Object.entries(f.attach).filter(([k]) => !/_\d+$/.test(k))) }])) })),
      scaffolds: new Map([...catalogue.scaffolds].map(([id, sc]): [string, Scaffold] => [id, { ...sc, poses: Object.fromEntries(Object.entries(sc.poses).map(([n, pose]) => [n, { ...pose, entries: pose.entries.filter((e) => e.legs === undefined) }])) }])),
    };
    for (const entry of real) {
      const recipe = buildRecipe(entry.genome, [], catalogue);
      const now = compose(recipe, entry.pose, catalogue).hash;
      const minus = (slot: string): Recipe => ({ ...recipe, parts: recipe.parts.filter((p) => p.slot !== slot) });
      if (recipe.parts.some((p) => p.slot === 'back')) {
        counts.back++;
        expect(sameHash(recipe, minus('back'), entry.pose), `${entry.label} back`).toBe(false);
        // Planted fault: no back parts in the catalogue: a missing: gap, and the picture is the one without the back part.
        const out = run(entry, noBacks);
        expect(out.gaps.some((g) => /^missing:quadruped\/back\//.test(g)), entry.label).toBe(true);
        expect(out.hash, entry.label).toBe(compose(minus('back'), entry.pose, catalogue).hash);
      }
      if (recipe.parts.some((p) => p.slot === 'headFeature')) {
        counts.feature++;
        expect(sameHash(recipe, minus('headFeature'), entry.pose), `${entry.label} head feature`).toBe(false);
      }
      if (recipe.parts.some((p) => /Limbs\/(fore|hind|mid)\//.test(p.partId))) {
        counts.roles++;
        // Planted fault: no role legs: every leg falls back to the shared leg with a role: gap, and the picture changes.
        const out = run(entry, noRoles);
        expect(out.gaps.some((g) => g.startsWith('role:')), entry.label).toBe(true);
        expect(out.hash, `${entry.label} roles`).not.toBe(now);
      }
      if (recipe.marking.pattern !== 0) {
        counts.patterned++;
        expect(recipe.parts.some((p) => p.mark !== undefined && MARK_SLOTS.includes(p.slot))).toBe(true);
        const plain = { ...recipe, marking: { ...recipe.marking, pattern: 0 } };
        // The marks are in the recorded picture; planted fault: with no layers the picture is the plain one.
        if (compose(plain, entry.pose, catalogue).hash !== now) counts.marked++;
        expect(compose(recipe, entry.pose, bare).hash, entry.label).toBe(compose(plain, entry.pose, catalogue).hash);
      }
      if (run(entry, noStance).hash !== now) counts.stance++;
    }
    expect(counts.back).toBeGreaterThan(50);
    expect(counts.feature).toBeGreaterThan(10);
    expect(counts.roles).toBeGreaterThan(100);
    // Every patterned real entry's recorded picture differs from the same recipe drawn plain.
    expect(counts.patterned).toBeGreaterThan(50);
    expect(counts.marked).toBe(counts.patterned);
    // The legs= entries and the _2 points draw some recorded two- and eight-legged sturdy creatures differently.
    expect(counts.stance).toBeGreaterThan(0);
  });
});
