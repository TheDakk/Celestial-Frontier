import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MARK_SLOTS, parseCatalogueText, type Catalogue, type PartFrame } from '@cf/art-format';
import { buildRoutedRecipe, type Recipe, type RecipePart } from '@cf/art-recipe';
import { assemble, compose } from '@cf/art-compose';
import { joinBodies, REPLACED_PART, routedTestCatalogue, testCatalogue } from '@cf/art-testparts';
import { gapIsInfo, generatedTorsos, routeStates, shapedGenome } from '../../../tools/check-pack.mjs';

// The placeholder parts for the routed builder (bodies.txt), read through routedTestCatalogue. buildRecipe never
// reaches them: these tests draw every creature through buildRoutedRecipe.
const QUADRUPED_TEXT = readFileSync(new URL('../src/quadruped.txt', import.meta.url), 'utf8');
const BODIES_TEXT = readFileSync(new URL('../src/bodies.txt', import.meta.url), 'utf8');
const POSES = ['rest', 'approach', 'windup', 'strike', 'recover', 'hit', 'faint'];
/** Grazers, gliders (airborne) and swimmers (aquatic), all in the deep forest canopy. */
const STATE = { land: { loco: 0, habitat: 0 }, airborne: { loco: 3, habitat: 0 }, aquatic: { loco: 4, habitat: 0 } } as const;
type State = keyof typeof STATE;
/** The new four-legged torso types by body gene; the two winged ones stay four-legged in water too. */
const NEW_TYPES = { shelled: 6, membranous: 7, crystalline: 8, spindly: 12, fourwinged: 14 } as const;
const WINGED = ['membranous', 'fourwinged'];
const STURDY_TORSO = REPLACED_PART;
/** The tail kinds a fish, a tentacled body or a crustacean draws. */
const OWN_TAILS = [2, 3, 5, 6];

/** A medium fauna genome: four legs, four eyes, plain, slick skin (no back part), on land, unless `genes` say otherwise. */
const fauna = (genes: Record<string, unknown>, state: State = 'land'): Record<string, unknown> => ({
  kingdom: 'fauna', body: 0, head: 0, tail: 1, limbs: 1, eyes: 1, size: 2, color: 3, accent: 5, pattern: 0, skin: 3, trait: 0, seed: 1,
  ...STATE[state], ...genes,
});
/** A fish genome shaped fusiform (the smallest seed that gives it); fails the test when none does. */
const fusiform = (genes: Record<string, unknown>): Record<string, unknown> => {
  const g = shapedGenome(fauna(genes, 'aquatic'), 'fish', 'fusiform');
  if (g === undefined) expect.fail(`no fusiform seed for ${JSON.stringify(genes)}`);
  return g;
};
const routed = (g: Record<string, unknown>): Recipe => buildRoutedRecipe(g, [], routedTestCatalogue());
const ids = (text: string): string[] => [...parseCatalogueText(text).parts.keys()];
/** The recipe without its part at position i. */
const without = (r: Recipe, i: number): Recipe => ({ ...r, parts: r.parts.filter((_, k) => k !== i) });
/** The pixels that differ between two buffers. */
function changed(a: Uint8Array, b: Uint8Array): number {
  let n = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) n++;
  return n;
}
/** Whether a buffer draws a pixel on its outermost ring. */
function touchesEdge({ w, h, pixels }: { w: number; h: number; pixels: Uint8Array }): boolean {
  for (let x = 0; x < w; x++) if (pixels[x] !== 0 || pixels[(h - 1) * w + x] !== 0) return true;
  for (let y = 0; y < h; y++) if (pixels[y * w] !== 0 || pixels[y * w + w - 1] !== 0) return true;
  return false;
}
/** The canvas box [x0, y0, x1, y1] of the pixels that differ between two buffers of width w, or null. */
function diffBox(a: Uint8Array, b: Uint8Array, w: number): [number, number, number, number] | null {
  let box: [number, number, number, number] | null = null;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) continue;
    const x = i % w;
    const y = (i - x) / w;
    box = box === null ? [x, y, x, y] : [Math.min(box[0], x), Math.min(box[1], y), Math.max(box[2], x), Math.max(box[3], y)];
  }
  return box;
}
/** The canvas box a frame's drawn pixels cover when its anchor lands on (x, y). */
function frameBox(frame: PartFrame, x: number, y: number): [number, number, number, number] {
  let box: [number, number, number, number] | null = null;
  for (let i = 0; i < frame.pixels.length; i++) {
    if (frame.pixels[i] === 0) continue;
    const fx = i % frame.w;
    const fy = (i - fx) / frame.w;
    box = box === null ? [fx, fy, fx, fy] : [Math.min(box[0], fx), Math.min(box[1], fy), Math.max(box[2], fx), Math.max(box[3], fy)];
  }
  if (box === null) throw new Error('frame draws nothing');
  const [dx, dy] = [x - frame.anchor[0], y - frame.anchor[1]];
  return [box[0] + dx, box[1] + dy, box[2] + dx, box[3] + dy];
}
const restFrame = (cat: Catalogue, rp: RecipePart): PartFrame => cat.parts.get(rp.partId)!.frames['rest']!;
/** Where a host part's anchor lands in the rest pose: the torso at the scaffold origin, the head at the torso's `head` point plus the head shift. */
function hostAnchor(recipe: Recipe, cat: Catalogue, host: 'torso' | 'head'): [number, number] {
  const scaffold = cat.scaffolds.get(recipe.scaffoldId)!;
  const entry = (slot: string) => scaffold.poses['rest']!.entries.find((e) => e.slot === slot && e.index === 0 && e.legs === undefined);
  const t = entry('torso');
  const torso: [number, number] = [scaffold.origin[0] + (t?.dx ?? 0), scaffold.origin[1] + (t?.dy ?? 0)];
  if (host === 'torso') return torso;
  const torsoFrame = restFrame(cat, recipe.parts.find((p) => p.slot === 'torso')!);
  const point = torsoFrame.attach['head']!;
  const h = entry('head');
  return [torso[0] + point[0] - torsoFrame.anchor[0] + (h?.dx ?? 0) + recipe.shift.head[0], torso[1] + point[1] - torsoFrame.anchor[1] + (h?.dy ?? 0) + recipe.shift.head[1]];
}
/** Where a part's drawn pixels land when it hangs from `point` on `host` in the rest pose (no pose entry of its own). */
function expectedBox(recipe: Recipe, cat: Catalogue, rp: RecipePart, host: 'torso' | 'head', point: string): [number, number, number, number] {
  const hostPart = recipe.parts.find((p) => p.slot === host)!;
  const hostFrame = restFrame(cat, hostPart);
  const [hx, hy] = hostAnchor(recipe, cat, host);
  const at = hostFrame.attach[point]!;
  return frameBox(restFrame(cat, rp), hx + at[0] - hostFrame.anchor[0], hy + at[1] - hostFrame.anchor[1]);
}
/** The box the part at position i draws in the rest pose, read from the assembled pictures with and without it. */
function landedBox(recipe: Recipe, cat: Catalogue, i: number): [number, number, number, number] | null {
  const a = assemble(recipe, 'rest', cat).buffer;
  return diffBox(a.pixels, assemble(without(recipe, i), 'rest', cat).buffer.pixels, a.w);
}

describe('routedTestCatalogue', () => {
  it('routedTestCatalogue parses and holds every part of both files', () => {
    const cat = routedTestCatalogue();
    const quadruped = parseCatalogueText(QUADRUPED_TEXT);
    const bodies = parseCatalogueText(BODIES_TEXT);
    for (const id of [...quadruped.parts.keys(), ...bodies.parts.keys()]) expect(cat.parts.has(id), id).toBe(true);
    // Every part of bodies.txt is drawn as bodies.txt draws it; the one id both files hold is the sturdy torso.
    for (const [id, part] of bodies.parts) expect(cat.parts.get(id), id).toEqual(part);
    expect([...bodies.parts.keys()].filter((id) => quadruped.parts.has(id))).toEqual([STURDY_TORSO]);
    expect(cat.parts.size).toBe(quadruped.parts.size + bodies.parts.size - 1);
    expect([...cat.scaffolds.keys()].sort()).toEqual([...quadruped.scaffolds.keys(), ...bodies.scaffolds.keys()].sort());
    expect(cat.scaffolds.size).toBe(quadruped.scaffolds.size + bodies.scaffolds.size);
    expect([...cat.fallbacks]).toEqual([...quadruped.fallbacks, ...bodies.fallbacks]);
    expect(cat.palette).toEqual(quadruped.palette);
    expect(cat.species.size).toBe(0);
  });

  it('throws on a part id both files hold, except the one sturdy torso bodies.txt replaces', () => {
    const base = parseCatalogueText(QUADRUPED_TEXT);
    const bodies = parseCatalogueText(BODIES_TEXT);
    expect(() => joinBodies(base, bodies)).not.toThrow();
    const ridge = 'quadruped/back/ridge-sturdy/medium/v0';
    const repeated = new Map(bodies.parts).set(ridge, base.parts.get(ridge)!);
    expect(() => joinBodies(base, { ...bodies, parts: repeated })).toThrow(`bodies.txt: duplicate part ${ridge}`);
    const scaffold = new Map(bodies.scaffolds).set('quadruped/sturdy/medium', base.scaffolds.get('quadruped/sturdy/medium')!);
    expect(() => joinBodies(base, { ...bodies, scaffolds: scaffold })).toThrow('bodies.txt: duplicate scaffold quadruped/sturdy/medium');
  });

  it('keeps the sturdy torso drawing, adding only a translucent layer on its rest frame', () => {
    const live = testCatalogue().parts.get(STURDY_TORSO)!;
    const routedTorso = routedTestCatalogue().parts.get(STURDY_TORSO)!;
    expect(Object.keys(routedTorso.frames)).toEqual(['rest']);
    const { layers, ...frame } = routedTorso.frames['rest']!;
    const { layers: liveLayers, ...liveFrame } = live.frames['rest']!;
    expect(frame).toEqual(liveFrame);
    expect(Object.keys(layers!).sort()).toEqual(['flow', 'spots', 'translucent']);
    expect(layers!.flow).toEqual(liveLayers!.flow);
    expect(layers!.spots).toEqual(liveLayers!.spots);
    expect(layers!.translucent!.some((v) => v !== 0)).toBe(true);
  });

  it('leaves testCatalogue as quadruped.txt alone draws it', () => {
    const live = testCatalogue();
    expect(live).toEqual(parseCatalogueText(QUADRUPED_TEXT));
    for (const id of ids(BODIES_TEXT)) if (id !== STURDY_TORSO) expect(live.parts.has(id), id).toBe(false);
  });

  it('bodies.txt holds no palette, medium v0 parts with flow and spots on every mark-slot frame, and crustacean fallbacks at every tier', () => {
    expect(BODIES_TEXT).not.toMatch(/^palette/m);
    const bodies = parseCatalogueText(BODIES_TEXT);
    const fallbackIds = new Set(bodies.fallbacks.values());
    expect([...bodies.fallbacks.keys()]).toEqual(['crustacean/small', 'crustacean/medium', 'crustacean/large', 'crustacean/guardian']);
    for (const part of bodies.parts.values()) {
      expect(part.variant, part.id).toBe(0);
      if (fallbackIds.has(part.id)) continue;
      expect(part.tier, part.id).toBe('medium');
      if (!MARK_SLOTS.includes(part.slot)) continue;
      for (const [name, frame] of Object.entries(part.frames)) {
        expect(Object.keys(frame.layers ?? {}), `${part.id} ${name}`).toEqual(expect.arrayContaining(['flow', 'spots']));
      }
    }
    // Before the switch the live file may not hold a jelly torso (controller note, Task 8); bodies.txt is its place.
    expect(testCatalogue().parts.has('gelatinous/torso/body/medium/v0')).toBe(false);
  });
});

describe('the routed bodies on the placeholder parts', () => {
  it('every family and shape the routed resolver produces draws on its own medium scaffold with no error gap and no missing part but a back part', () => {
    const cat = routedTestCatalogue();
    const torsos = [...generatedTorsos()].sort();
    expect(torsos).toHaveLength(30);
    for (const torso of torsos) {
      const [family, shape] = torso.split('/') as [string, string];
      const states = routeStates(`${torso}/medium`);
      expect(states.length, torso).toBeGreaterThan(0);
      for (const { state, genes } of states) {
        for (let head = 0; head < 10; head++) {
          const g = shapedGenome({ kingdom: 'fauna', ...genes, head, tail: head % 7, limbs: 1, eyes: head % 6, skin: head % 9, pattern: head % 8, trait: 0, color: 3, accent: 5 }, family, shape);
          if (g === undefined) expect.fail(`no seed shapes ${torso} ${state}`);
          const recipe = routed(g);
          expect(recipe.scaffoldId).toBe(`${torso}/medium`);
          for (const pose of POSES) {
            const where = `${torso} ${state} head ${head} ${pose}`;
            const out = compose(recipe, pose, cat);
            expect(out.gaps.filter((gap) => !gapIsInfo(gap) || gap.startsWith('fallback:')), where).toEqual([]);
            expect(out.gaps.filter((gap) => gap.startsWith('missing:') && !/^missing:[^/]+\/back\//.test(gap)), where).toEqual([]);
          }
        }
      }
    }
  });

  it('a fish of every shape composes every head kind 0 to 9 and every tail kind 2, 3, 5, 6 with no missing head or tail, and a fish keeping a feature finds it at every head kind', () => {
    const cat = routedTestCatalogue();
    for (const shape of ['fusiform', 'shark', 'flat', 'angler', 'sturgeon']) {
      const { genes } = routeStates(`fish/${shape}/medium`)[0]!;
      for (let head = 0; head < 10; head++) {
        for (const tail of OWN_TAILS) {
          const g = shapedGenome({ kingdom: 'fauna', ...genes, head, tail, skin: 3 }, 'fish', shape);
          if (g === undefined) expect.fail(`no seed shapes fish ${shape}`);
          const recipe = routed(g);
          const ids = recipe.parts.map((p) => p.partId);
          expect(ids).toContain(`fish/head/h${head}/medium/v0`);
          expect(ids).toContain(`fish/tail/t${tail}/medium/v0`);
          const gaps = compose(recipe, 'rest', cat).gaps;
          expect(gaps.filter((gap) => /^missing:fish\/(head|tail)\//.test(gap)), `${shape} h${head} t${tail}`).toEqual([]);
        }
      }
    }
    // A fish keeping its tusks, horn, shell or crystals finds that part at every head kind, on both shapes that keep one.
    for (const shape of ['fusiform', 'sturgeon']) {
      for (const body of [6, 8, 10, 11]) {
        for (let head = 0; head < 10; head++) {
          const g = shapedGenome(fauna({ body, head, tail: 2 }, 'aquatic'), 'fish', shape);
          if (g === undefined) expect.fail(`no seed shapes fish ${shape} body ${body}`);
          const gaps = compose(routed(g), 'rest', cat).gaps;
          expect(gaps.filter((gap) => gap.startsWith('missing:')), `${shape} body ${body} h${head}`).toEqual([]);
        }
      }
    }
  });

  it('every new quadruped torso type composes all seven poses with no gap but variant: and information', () => {
    const cat = routedTestCatalogue();
    let composed = 0;
    for (const [type, body] of Object.entries(NEW_TYPES)) {
      const states: State[] = WINGED.includes(type) ? ['land', 'airborne', 'aquatic'] : ['land', 'airborne'];
      for (const state of states) {
        for (let skin = 0; skin < 9; skin++) {
          for (let head = 0; head < 10; head++) {
            const g = fauna({ body, head, tail: head % 7, eyes: head % 6, pattern: head % 8, skin }, state);
            const recipe = routed(g);
            expect(recipe.scaffoldId).toBe(`quadruped/${type}/medium`);
            for (const pose of POSES) {
              const out = compose(recipe, pose, cat);
              composed++;
              const where = `${type} ${state} skin ${skin} head ${head} ${pose}`;
              expect(out.gaps.filter((gap) => !gapIsInfo(gap)), where).toEqual([]);
              // bodies.txt draws every part these creatures ask for: no information gap names a missing part either.
              expect(out.gaps.filter((gap) => gap.startsWith('missing:')), where).toEqual([]);
            }
            expect(compose(recipe, 'strike', cat).contact).not.toBeNull();
          }
        }
      }
    }
    expect(composed).toBe(12 * 9 * 10 * 7);
  });

  it('a fusiform fish keeping each of its four features composes with no error gap', () => {
    const cat = routedTestCatalogue();
    const featureOf = { 6: 'bodyFeature/shell-fusiform', 8: 'bodyFeature/crystals-fusiform', 10: 'headFeature/tusks-h', 11: 'headFeature/horns-h' } as const;
    for (const body of [6, 8, 10, 11] as const) {
      for (const head of [0, 2]) {
        for (const tail of [0, 2]) {
          for (let eyes = 0; eyes < 6; eyes++) {
            const recipe = routed(fusiform({ body, head, tail, eyes, pattern: eyes + 1 }));
            const where = `body ${body} head ${head} tail ${tail} eyes ${eyes}`;
            expect(recipe.scaffoldId, where).toBe('fish/fusiform/medium');
            const feature = featureOf[body];
            expect(recipe.parts.map((p) => p.partId), where).toContain(`fish/${feature}${feature.endsWith('-h') ? head : ''}/medium/v0`);
            for (const pose of POSES) {
              const out = compose(recipe, pose, cat);
              expect(out.gaps.filter((gap) => !gapIsInfo(gap)), `${where} ${pose}`).toEqual([]);
              expect(out.gaps.filter((gap) => gap.startsWith('missing:')), `${where} ${pose}`).toEqual([]);
            }
          }
        }
      }
    }
  });

  it('every part in bodies.txt shows at least 4 pixels in some routed creature, and none touches the canvas edge in any pose', () => {
    const cat = routedTestCatalogue();
    const wanted = new Set(ids(BODIES_TEXT));
    const creatures: Record<string, unknown>[] = [];
    for (const [type, body] of Object.entries(NEW_TYPES)) {
      for (const skin of [0, 1, 2, 3, 4, 5, 6, 8]) creatures.push(fauna({ body, skin }));
      creatures.push(fauna({ body, skin: 3 }, 'airborne'));
      if (WINGED.includes(type)) creatures.push(fauna({ body }, 'aquatic'));
    }
    creatures.push(fauna({ body: 0, skin: 7, tail: 0, eyes: 5 }), fauna({ body: 0 }, 'airborne'), fauna({ body: 2 }, 'airborne'));
    for (const head of [0, 1, 2, 4, 5, 7, 8, 9]) creatures.push(fauna({ body: 10, head }));
    for (const body of [6, 8, 10, 11]) for (const head of [0, 2]) creatures.push(fusiform({ body, head, tail: 2 }));
    // Every family and shape outside the four-legged bodies, at every head kind, each own tail kind and eye count.
    for (const torso of generatedTorsos()) {
      const [family, shape] = torso.split('/') as [string, string];
      if (family === 'quadruped') continue;
      for (const { genes } of routeStates(`${torso}/medium`)) {
        for (let head = 0; head < 10; head++) {
          const g = shapedGenome({ ...fauna({}), ...genes, head, tail: OWN_TAILS[head % 4], eyes: head % 6 }, family, shape);
          if (g !== undefined) creatures.push(g);
        }
      }
    }
    // A fish keeping each feature, on both shapes that keep one, at every head kind.
    for (const shape of ['fusiform', 'sturgeon']) {
      for (const body of [6, 8, 10, 11]) {
        for (let head = 0; head < 10; head++) {
          const g = shapedGenome(fauna({ body, head, tail: 2 }, 'aquatic'), 'fish', shape);
          if (g !== undefined) creatures.push(g);
        }
      }
    }
    for (const size of [{ size: 1 }, { size: 2 }, { size: 4 }, { size: 5, apex: 12 }]) creatures.push(fauna({ body: 1, ...size }));

    const shown = new Set<string>();
    for (const g of creatures) {
      const routedRecipe = routed(g);
      // A fallback is drawn when nothing else is: each creature is drawn as it is and, once, with no parts.
      for (const recipe of [routedRecipe, { ...routedRecipe, parts: [] }]) for (const pose of recipe.parts.length === 0 ? ['rest'] : POSES) {
        const out = compose(recipe, pose, cat);
        if (touchesEdge(out.buffer)) expect.fail(`${recipe.scaffoldId} ${JSON.stringify(g)} touches the edge in ${pose}`);
        if (out.gaps.includes(`fallback:${recipe.family}`)) {
          const id = cat.fallbacks.get(`${recipe.family}/${recipe.tier}`)!;
          if (out.buffer.pixels.filter((p) => p !== 0).length >= 4) shown.add(id);
          continue;
        }
        const whole = assemble(recipe, pose, cat).buffer.pixels;
        recipe.parts.forEach((rp, i) => {
          if (!wanted.has(rp.partId) || shown.has(rp.partId)) return;
          if (changed(whole, assemble(without(recipe, i), pose, cat).buffer.pixels) >= 4) shown.add(rp.partId);
        });
      }
    }
    expect([...wanted].filter((id) => !shown.has(id))).toEqual([]);
  });

  it('sails-stilt is used by an airborne stilt body and sails by an airborne sturdy body', () => {
    const sailOf = (body: number) => routed(fauna({ body }, 'airborne')).parts.filter((p) => p.slot === 'nearWings').map((p) => p.partId);
    expect(sailOf(2)).toEqual(['quadruped/nearWings/sails-stilt/medium/v0']);
    expect(sailOf(0)).toEqual(['quadruped/nearWings/sails/medium/v0']);
    expect(sailOf(8)).toEqual(['quadruped/nearWings/sails/medium/v0']);
  });

  it('the sturdy translucent creature has no skin: gap, the stilt one has one', () => {
    const cat = routedTestCatalogue();
    const skinGaps = (body: number) => compose(routed(fauna({ body, skin: 7 })), 'rest', cat).gaps.filter((gap) => gap.startsWith('skin:'));
    expect(skinGaps(0)).toEqual([]);
    expect(skinGaps(2)).toEqual(['skin:quadruped/torso/stilt/medium/v0:rest']);
  });
});

describe('the composer places the new parts from a catalogue', () => {
  const cat = routedTestCatalogue();
  /** The recipe's part with this id and its position; fails when it holds none. */
  const partOf = (recipe: Recipe, id: string): [RecipePart, number] => {
    const i = recipe.parts.findIndex((p) => p.partId === id);
    if (i < 0) expect.fail(`no ${id} in ${recipe.parts.map((p) => p.partId).join(' ')}`);
    return [recipe.parts[i]!, i];
  };

  it('hangs a sail from the torso back point, not from a wing point', () => {
    const recipe = routed(fauna({ body: 0 }, 'airborne'));
    const [sail, i] = partOf(recipe, 'quadruped/nearWings/sails/medium/v0');
    expect(sail.at).toEqual({ host: 'torso', point: 'back' });
    expect(landedBox(recipe, cat, i)).toEqual(expectedBox(recipe, cat, sail, 'torso', 'back'));
    // Without its `at`, a sail in nearWings would ask the sturdy torso for a wing point it does not have.
    const { at: _, ...plain } = sail;
    const loose = { ...recipe, parts: recipe.parts.map((p, k) => (k === i ? plain : p)) };
    expect(assemble(loose, 'rest', cat).gaps).toContain('attach:wing');
  });

  it('hangs a hindwing at wing index 1 from the torso point wing1', () => {
    const recipe = routed(fauna({ body: 14 }));
    const [hindwing, i] = partOf(recipe, 'quadruped/nearWings/hindwing-fourwinged/medium/v0');
    expect(hindwing.index).toBe(1);
    expect(hindwing.at).toBeUndefined();
    const box = landedBox(recipe, cat, i);
    expect(box).toEqual(expectedBox(recipe, cat, hindwing, 'torso', 'wing1'));
    expect(box).not.toEqual(expectedBox(recipe, cat, hindwing, 'torso', 'wing'));
  });

  it('hangs a head feature at index 1 from the head feature point', () => {
    const recipe = routed(fauna({ body: 10, head: 4 }));
    const [hornlet, i] = partOf(recipe, 'quadruped/headFeature/hornlet-h4/medium/v0');
    expect(hornlet.index).toBe(1);
    expect(recipe.parts[i - 1]!.partId).toBe('quadruped/headFeature/tusks-h4/medium/v0');
    expect(landedBox(recipe, cat, i)).toEqual(expectedBox(recipe, cat, hornlet, 'head', 'feature'));
  });

  it('hangs flippers from near0 and near1 of a winged torso in water', () => {
    for (const [body, kind] of [[7, 'flipper-membranous'], [14, 'flipper']] as const) {
      const recipe = routed(fauna({ body }, 'aquatic'));
      expect(recipe.legs).toBe(0);
      for (const index of [0, 1]) {
        const i = recipe.parts.findIndex((p) => p.slot === 'nearLimbs' && p.index === index);
        const rp = recipe.parts[i]!;
        expect(rp.partId).toBe(`quadruped/nearLimbs/${kind}/medium/v0`);
        expect(landedBox(recipe, cat, i)).toEqual(expectedBox(recipe, cat, rp, 'torso', `near${index}`));
      }
    }
  });
});
