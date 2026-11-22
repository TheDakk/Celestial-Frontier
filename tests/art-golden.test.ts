import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MARK_SLOTS, PATTERN_NAMES, type Catalogue, type Part, type Scaffold } from '@cf/art-format';
import { __buildRecipeAtVersionForTests, bodyOf, buildRecipe, GENE_LENGTHS, identityKey, RENDERER_VERSION, type Recipe } from '@cf/art-recipe';
import { compose, PATTERN_TABLE, toAscii } from '@cf/art-compose';
import { testCatalogue } from '@cf/art-testparts';
import { mulberry32 } from '@cf/domain-rand';

interface Entry { label: string; genome: Record<string, unknown>; pose: string; hash: string; gaps: string[]; contact: [number, number] | null; }
interface Fixture { rendererVersion: number; catalogue: string; entries: Entry[]; }

const fixture: Fixture = JSON.parse(readFileSync(new URL('../fixtures/art/quadruped-v1.json', import.meta.url), 'utf8'));
const catalogue = testCatalogue();

const run = (entry: Entry, cat: Catalogue = catalogue) => compose(buildRecipe(entry.genome, [], cat), entry.pose, cat);
const isReal = (entry: Entry) => !entry.gaps.some((gap) => gap.startsWith('fallback:'));
const byLabel = (label: string): Entry[] => fixture.entries.filter((e) => e.label === label);
/** The entries recorded before body routing: their label, genome and pose are kept, in order. */
const RECORDED = 621;
/** The specs appended for body routing (tools/record-art-hashes.mjs), each at rest and strike. */
const APPENDED = 20;
/** See 'the colour fields of every entry's recipe are pinned'. */
const COLOUR_FIELDS_SHA256 = '55840aa5f56da33f21be72db3e41018c269487797ed25d4e32a190cea242eb26';

describe('art golden hashes', () => {
  it('records the current renderer version, the test catalogue and the expected entry count', () => {
    expect(fixture.rendererVersion).toBe(RENDERER_VERSION);
    expect(fixture.catalogue).toBe('art-testparts');
    expect(fixture.entries).toHaveLength(RECORDED + 2 * APPENDED);
  });

  it('the first 621 entries keep their label, genome and pose', () => {
    // The SHA-256 of [label, genome, pose] of each of the 621 entries recorded before body routing, taken from that
    // fixture: the re-record changed what each draws, never which creature it is.
    const kept = JSON.stringify(fixture.entries.slice(0, RECORDED).map((e) => [e.label, e.genome, e.pose]));
    expect(createHash('sha256').update(kept).digest('hex')).toBe('ed9b39563c39d5ab55726959119ed70b025f33ad5726ffb050298e269c7ee7b8');
    expect(fixture.entries.slice(RECORDED).every((e) => e.label.startsWith('routed '))).toBe(true);
  });

  it('the colour fields of every entry\'s recipe are pinned: ramps, theme, rim, opacity, airborne and skin', () => {
    // The picture hash is taken on pixel values, so it cannot see these. The SHA-256 of [ramps, theme, rim, opacity,
    // airborne, skin] of the recipe of each of the fixture's entries, in order, taken at the commit that added it: a
    // change to themeOf, irisOf, rimOf, the opacity or the skin a genome gets shows here.
    const colours = JSON.stringify(fixture.entries.map((e) => {
      const r = buildRecipe(e.genome, [], catalogue);
      return [r.ramps, r.theme, r.rim, r.opacity, r.airborne, r.skin];
    }));
    expect(createHash('sha256').update(colours).digest('hex')).toBe(COLOUR_FIELDS_SHA256);
  });

  it('has at least 300 entries that compose a real creature', () => {
    expect(fixture.entries.filter(isReal).length).toBeGreaterThanOrEqual(300);
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
    const bodies = real.map((e) => bodyOf(e.genome));
    expect(real).toHaveLength(322);
    expect([...new Set(bodies.map((b) => b.pattern))].sort()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(PATTERN_NAMES).toHaveLength(8);
    expect([...new Set(bodies.map((b) => b.skin))].sort()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect([...new Set(bodies.map((b) => b.limbs))].filter((n) => n > 0).sort()).toEqual([2, 3, 4, 6, 8]);
    const torsos = new Set(bodies.map((b) => b.torso));
    expect(torsos.has('tusked') && torsos.has('horned')).toBe(true);
  });

  it('the recorded real entries cover every quadruped torso type, and every other family the routed builder draws', () => {
    const scaffolds = new Set(real.map((e) => buildRecipe(e.genome, [], catalogue).scaffoldId.split('/').slice(0, 2).join('/')));
    expect([...scaffolds].filter((id) => id.startsWith('quadruped/')).sort()).toEqual([
      'quadruped/crystalline', 'quadruped/fourwinged', 'quadruped/horned', 'quadruped/membranous', 'quadruped/shelled',
      'quadruped/spindly', 'quadruped/squat', 'quadruped/stilt', 'quadruped/sturdy', 'quadruped/tusked',
    ]);
    expect([...new Set([...scaffolds].map((id) => id.split('/')[0]))].sort()).toEqual(['crustacean', 'fish', 'gelatinous', 'insect', 'quadruped', 'radial', 'serpent', 'tentacled']);
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

  it('the recorded eye-spotted pictures pin the eye-spot centre: any other centre value changes a recorded hash', () => {
    const eyeSpotted = real.filter((e) => bodyOf(e.genome).pattern === 7);
    expect(eyeSpotted.length).toBeGreaterThan(0);
    const rule = PATTERN_TABLE['eye-spotted'] as { centre: number };
    const centre = rule.centre;
    try {
      for (let planted = 1; planted <= 12; planted++) {
        if (planted === centre) continue;
        rule.centre = planted;
        // An entry the true table reproduces (the recomputing test above) that draws differently with the planted centre.
        const moved = eyeSpotted.filter((e) => run(e).hash !== e.hash);
        expect(moved.length, `centre ${planted}`).toBeGreaterThan(0);
      }
    } finally {
      rule.centre = centre;
    }
    expect(eyeSpotted.filter((e) => run(e).hash !== e.hash)).toEqual([]);
  });

  it('a recorded real picture holds an iris value 17-20, and none holds 5-8 where an eye part was stacked', () => {
    const eyeFrame = catalogue.parts.get(EYE)!.frames['rest']!;
    expect([...eyeFrame.pixels].some((v) => v >= 5 && v <= 8)).toBe(true);
    // Every eye-slot part's iris pixels (an eye's or a pit's, any family) and the jelly's organelles moved to 13 (the eye
    // value): the pixels that change are exactly where an iris landed.
    const irisless = (p: Part): Part => ({ ...p, frames: Object.fromEntries(Object.entries(p.frames).map(([n, f]) => [n, { ...f, pixels: f.pixels.map((v) => (v >= 5 && v <= 8 ? 13 : v)) }])) });
    const noIris = editParts(catalogue, (p) => (p.slot === 'eyes' || (p.family === 'gelatinous' && p.slot === 'torso') ? irisless(p) : p));
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
      else expect(recipe.parts.some((p) => p.slot === 'eyes') || recipe.family === 'gelatinous', `${entry.label}: an eye or organelle with no iris`).toBe(false);
    }
    expect(withIris).toBeGreaterThan(200);
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
        // The marks are in the recorded picture; planted fault: with no layers the picture is the plain one. The skin is
        // held back on both sides: a hand-drawn skin layer (translucent) goes with the layers too.
        if (compose(plain, entry.pose, catalogue).hash !== now) counts.marked++;
        expect(compose({ ...recipe, skin: null }, entry.pose, bare).hash, entry.label).toBe(compose({ ...plain, skin: null }, entry.pose, catalogue).hash);
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

describe('art golden: the body routing entries', () => {
  const appended = fixture.entries.slice(RECORDED);
  const ids = (e: Entry): string[] => buildRecipe(e.genome, [], catalogue).parts.map((p) => p.partId);
  const without = (drop: (id: string) => boolean): Catalogue => ({ ...catalogue, parts: new Map([...catalogue.parts].filter(([id]) => !drop(id))) });
  /** What each appended spec shows: the part ids the design adds, by label (each at medium, v0). */
  const SHOWS: Readonly<Record<string, readonly string[]>> = {
    'routed membranous land': ['quadruped/farWings/wing-membranous', 'quadruped/nearWings/wing-membranous'],
    'routed membranous airborne': ['quadruped/farWings/wing-membranous', 'quadruped/nearWings/wing-membranous'],
    'routed membranous aquatic': ['quadruped/nearLimbs/flipper-membranous', 'quadruped/bodyFeature/fins-membranous', 'quadruped/nearWings/wing-membranous'],
    'routed fourwinged aquatic': ['quadruped/nearLimbs/flipper', 'quadruped/bodyFeature/fins-fourwinged', 'quadruped/nearWings/wing-fourwinged', 'quadruped/nearWings/hindwing-fourwinged'],
    'routed sturdy airborne (sails)': ['quadruped/nearWings/sails'],
    'routed shelled land': ['quadruped/bodyFeature/shell-shelled', 'quadruped/torso/shelled'],
    'routed crystalline land': ['quadruped/bodyFeature/crystals-crystalline', 'quadruped/torso/crystalline'],
    'routed spindly land': ['quadruped/torso/spindly'],
    'routed fusiform fish keeping its shell': ['fish/bodyFeature/shell-fusiform', 'fish/torso/fusiform'],
    'routed fusiform fish keeping its crystals': ['fish/bodyFeature/crystals-fusiform'],
    'routed fusiform fish keeping its tusks': ['fish/headFeature/tusks-h0'],
    'routed fusiform fish keeping its horn': ['fish/headFeature/horns-h0'],
    'routed sturdy with tail 0 (t0)': ['quadruped/tail/t0'],
    'routed sturdy with eyes gene 5 (pits)': ['quadruped/eyes/pit'],
    'routed sturdy with the eyeless head (pits)': ['quadruped/eyes/pit'],
    'routed translucent sturdy': [],
    'routed luminous crystalline': ['quadruped/bodyFeature/crystals-crystalline'],
    'routed tusked with head 8 (hornlet)': ['quadruped/headFeature/tusks-h8', 'quadruped/headFeature/hornlet-h8'],
    'routed sturdy with head 3 (horn)': ['quadruped/headFeature/horns-h3'],
    'routed sturdy with trait 11 (horn)': ['quadruped/headFeature/horns-h0'],
  };

  it('the appended entries show wings, sails, flippers, fins, a shell, crystals, a kept tusk and horn, t0, pits, a hornlet, a translucent layer, and each vanishes under a planted fault', () => {
    expect(appended).toHaveLength(2 * APPENDED);
    expect([...new Set(appended.map((e) => e.label))]).toEqual(Object.keys(SHOWS));
    for (const e of appended) {
      expect(e.pose === 'rest' || e.pose === 'strike').toBe(true);
      expect(isReal(e), e.label).toBe(true);
      // No error gap: every part these creatures ask for is in the placeholder pack (a missing back part is information).
      expect(e.gaps.filter((g) => !g.startsWith('variant:') && !/^missing:[^/]+\/back\//.test(g)), e.label).toEqual([]);
      const asked = ids(e);
      for (const part of SHOWS[e.label]!) {
        const id = `${part}/medium/v0`;
        expect(asked, `${e.label} ${part}`).toContain(id);
        // Planted fault: the part taken out of a catalogue copy changes the recorded picture.
        expect(run(e, without((x) => x === id)).hash, `${e.label} ${e.pose} without ${part}`).not.toBe(e.hash);
      }
    }
    // The translucent sturdy: its torso's translucent layer is drawn; without it the picture changes and a skin: gap appears.
    const torso = 'quadruped/torso/sturdy/medium/v0';
    const noLayer = editParts(catalogue, (p) => (p.id !== torso ? p : { ...p, frames: Object.fromEntries(Object.entries(p.frames).map(([n, f]) => {
      const { translucent: _drop, ...layers } = f.layers ?? {};
      return [n, { ...f, layers }];
    })) }));
    for (const e of byLabel('routed translucent sturdy')) {
      expect(buildRecipe(e.genome, [], catalogue).opacity).toBe(66);
      expect(e.gaps.some((g) => g.startsWith('skin:'))).toBe(false);
      const out = run(e, noLayer);
      expect(out.hash, e.pose).not.toBe(e.hash);
      expect(out.gaps).toContain(`skin:${torso}:rest`);
    }
    // The luminous crystalline body carries the strong rim (75), the plain one none; the picture itself is the same.
    expect(byLabel('routed luminous crystalline').map((e) => buildRecipe(e.genome, [], catalogue).rim)).toEqual([75, 75]);
    expect(byLabel('routed crystalline land').map((e) => buildRecipe(e.genome, [], catalogue).rim)).toEqual([0, 0]);
    // The airborne membranous body has two legs; in water none.
    expect(byLabel('routed membranous airborne').map((e) => buildRecipe(e.genome, [], catalogue).legs)).toEqual([2, 2]);
    expect(byLabel('routed membranous aquatic').map((e) => buildRecipe(e.genome, [], catalogue).legs)).toEqual([0, 0]);
  });
});

