import { describe, expect, it } from 'vitest';
import { parseCatalogueText, PIXEL_CHARS, SKIN_NAMES, TIER_SIZE, type Catalogue, type PartFrame, type SizeTier } from '@cf/art-format';
import type { Recipe } from '@cf/art-recipe';
import { SKIN_TABLE, compose, hashBuffer, paintSkin, settleTexture } from '@cf/art-compose';
import { checkers, comb, lonePixels, specks, turns, type Picture } from './texture-measures';

// Armour: plates and chitin on a large creature. Whole creatures are measured on the finished picture (compose: stacked,
// settled, outlined, lit and shaded), on a hide drawn in its ramp's two lightest shades and on one drawn in its two
// darkest; single parts as the painter leaves them. A small and a medium creature keep the lines they had (skin.test.ts).

const HEADER = 'palette\ncolour 0 000000\ncolour 1 ffffff\ncolour 2 eeeeee\ncolour 3 00ff00\ncolour 4 111111\nramp r 1 2 3 4\noutline 0\neye 1\neyeHighlight 2\nglow 3\n';
type Hide = 'pale' | 'dark';
const TIERS = ['large'] as const;
const HIDES = ['pale', 'dark'] as const;
const PHASES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

/** The sizes of the test creature of a tier: a torso half the canvas wide, four legs with a thigh an eighth of it wide. */
function sizes(tier: SizeTier) {
  const [w, h] = TIER_SIZE[tier];
  return { w, h, body: { w: w >> 1, h: (h * 3) >> 3 }, thigh: w >> 3, shin: w >> 4, leg: (h * 3) >> 3, head: { w: w / 6 | 0, h: h >> 2 } };
}

/** Rows of a part: `shade(x, y)` gives a pixel's character, '.' for none. */
const rows = (w: number, h: number, shade: (x: number, y: number) => string): string =>
  Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => shade(x, y)).join('')).join('\n');

/**
 * A quadruped of the tier: an oval torso lit from above in two shades (4 over 3 pale, 2 over 1 dark), a head with an
 * eye point and an eye wider than the box the painter keeps clear round that point, a tail, two near legs side by side and two far legs side by side, each a thigh over (near) or under (far)
 * the torso's lower half and a shin half as wide.
 */
function catalogue(tier: SizeTier, hide: Hide, body = 'quadruped'): Catalogue {
  const [family, kind = 'sturdy'] = body.split('/') as [string, string?];
  const s = sizes(tier);
  const [hi, lo] = hide === 'pale' ? ['4', '3'] : ['2', '1'];
  const torso = rows(s.body.w, s.body.h, (x, y) => {
    const dx = (2 * x + 1 - s.body.w) / s.body.w; const dy = (2 * y + 1 - s.body.h) / s.body.h;
    return dx * dx + dy * dy > 1 ? '.' : y * 2 < s.body.h ? hi : lo;
  });
  const leg = rows(s.thigh, s.leg, (x, y) => (y * 3 < s.leg ? (x * 2 < s.thigh ? hi : lo) : x < s.shin ? (x * 2 < s.shin ? hi : lo) : '.'));
  const head = rows(s.head.w, s.head.h, (_x, y) => (y * 2 < s.head.h ? hi : lo));
  const tail = rows(s.thigh, s.shin, () => hi);
  const half = s.body.h >> 1;
  const x0 = s.body.w >> 3; const x1 = s.body.w - 2 * s.thigh - (s.body.w >> 3);
  const attach = `head:${s.body.w - 2},${s.body.h >> 3},tail:0,${half},near0:${x0},${half},near1:${x0 + s.thigh},${half},far0:${x1},${half},far1:${x1 + s.thigh},${half}`;
  return parseCatalogueText(`${HEADER}
part ${family}/torso/sturdy/${tier}/v0
frame rest anchor=0,0 attach=${attach}
${torso}

part ${family}/head/h1/${tier}/v0
frame rest anchor=0,0 attach=eye0:${s.head.w >> 1},${s.head.h >> 1}
${head}

part ${family}/eyes/eye/${tier}/v0
frame rest anchor=${s.shin >> 1},1
${rows(s.shin + 2, 4, (x, y) => (y === 0 && x < 2 ? 'e' : 'd'))}

part ${family}/tail/t1/${tier}/v0
frame rest anchor=${s.thigh - 1},0
${tail}

part ${family}/farLimbs/leg/${tier}/v0
frame rest anchor=0,0
${leg}

part ${family}/nearLimbs/leg/${tier}/v0
frame rest anchor=0,0
${leg}

scaffold ${family}/${kind}/${tier} origin=${s.w >> 2},${s.h >> 3}
pose rest
entry torso 0 rest 0 0
`);
}

function recipe(tier: SizeTier, skin: number | null, phase: number, body = 'quadruped'): Recipe {
  const [family, kind = 'sturdy'] = body.split('/') as [string, string?];
  const id = (slot: string, kind: string): string => `${family}/${slot}/${kind}/${tier}/v0`;
  const parts = ([['farLimbs', 0, id('farLimbs', 'leg')], ['farLimbs', 1, id('farLimbs', 'leg')], ['tail', 0, id('tail', 't1')], ['torso', 0, id('torso', 'sturdy')],
    ['nearLimbs', 0, id('nearLimbs', 'leg')], ['nearLimbs', 1, id('nearLimbs', 'leg')], ['head', 0, id('head', 'h1')], ['eyes', 0, id('eyes', 'eye')]] as const)
    .map(([slot, index, partId]) => ({ slot, index, partId, source: 'own' as const }));
  return {
    version: 1, identity: 'test', family, tier, scaffoldId: `${family}/${kind}/${tier}`, parts,
    ramps: { primary: 'r', accent: 'r', underside: 'r', iris: 'r' }, marking: { pattern: 0, strength: 2, phase },
    shift: { head: [0, 0], tail: [0, 0] }, legs: 4, eyes: 2, glow: false, gaps: [], opacity: 100, airborne: false, theme: null, rim: 0, skin,
  };
}

const CATALOGUES = new Map<string, Catalogue>();
/** The finished creature with the skin, and the same creature finished with none: what the texture is measured against. */
function finished(tier: SizeTier, hide: Hide, skin: string, phase: number, family = 'quadruped'): Picture {
  const key = `${tier} ${hide} ${family}`;
  const cat = CATALOGUES.get(key) ?? catalogue(tier, hide, family);
  CATALOGUES.set(key, cat);
  const before = compose(recipe(tier, null, phase, family), 'rest', cat).buffer;
  const after = compose(recipe(tier, SKIN_NAMES.indexOf(skin as never), phase, family), 'rest', cat).buffer;
  return { w: after.w, h: after.h, before: before.pixels, after: after.pixels };
}

const at = (p: Picture, x: number, y: number): number => (x < 0 || y < 0 || x >= p.w || y >= p.h ? 0 : p.after[y * p.w + x] ?? 0);
const hide = (v: number): boolean => v >= 1 && v <= 12;
const texture = (p: Picture, x: number, y: number): boolean => x >= 0 && y >= 0 && x < p.w && y < p.h && p.after[y * p.w + x] !== p.before[y * p.w + x];

/**
 * Edges where one piece of armour laps over the next: runs of `least` or more pixel pairs side by side, each pair two
 * hide pixels of one ramp of which the first is two or more shades darker than the second (a rim against a lit edge)
 * and one is texture. `down`: the pair is a pixel and the one under it (a plate's underside over the next plate's lit
 * top), and the run goes along the row; otherwise the pair is a pixel and the one after it (a segment's seam against
 * the next segment's lit front), and the run goes down the column.
 */
function laps(p: Picture, down: boolean, least = 3): number {
  const [dx, dy] = down ? [0, 1] : [1, 0];
  const edge = (x: number, y: number): boolean => {
    const a = at(p, x, y); const b = at(p, x + dx, y + dy);
    return hide(a) && hide(b) && (a - 1) >> 2 === (b - 1) >> 2 && b - a >= 2 && (texture(p, x, y) || texture(p, x + dx, y + dy));
  };
  let n = 0;
  for (let y = 0; y < p.h; y++) {
    for (let x = 0; x < p.w; x++) {
      // A run is counted at its first pair: the one with no edge before it along the run.
      if (!edge(x, y) || edge(x - dy, y - dx)) continue;
      let len = 1;
      while (edge(x + len * dy, y + len * dx)) len++;
      if (len >= least) n++;
    }
  }
  return n;
}
/** Texture pixels of the finished picture, and those of them under the torso's last row (on the legs alone). */
function textured(p: Picture, tier: SizeTier): { all: number; legs: number; hide: number } {
  const s = sizes(tier);
  const under = (s.h >> 3) + s.body.h;
  let all = 0; let legs = 0; let n = 0;
  for (let y = 0; y < p.h; y++) {
    for (let x = 0; x < p.w; x++) {
      if (hide(p.before[y * p.w + x] ?? 0)) n++;
      if (!texture(p, x, y)) continue;
      all++;
      if (y >= under) legs++;
    }
  }
  return { all, legs, hide: n };
}
/** The longest run along one row of texture pixels on their ramp's darkest shade: a rim. */
function longestRim(p: Picture): number {
  let most = 0;
  for (let y = 0; y < p.h; y++) {
    let run = 0;
    for (let x = 0; x < p.w; x++) {
      const v = at(p, x, y);
      run = hide(v) && ((v - 1) & 3) === 0 && texture(p, x, y) ? run + 1 : 0;
      if (run > most) most = run;
    }
  }
  return most;
}

describe('the measures of armour, each on a picture that must fail it and one that must pass', () => {
  const picture = (before: readonly string[], after: readonly string[]): Picture => ({
    w: (before[0] as string).length, h: before.length,
    before: Uint8Array.from(before.join(''), (c) => Number(c)), after: Uint8Array.from(after.join(''), (c) => Number(c)),
  });
  it('a lap is a rim two shades under the lit edge beside it, three pixels long; one shade, or two pixels, is none', () => {
    expect(laps(picture(['33333', '33333', '33333'], ['33333', '21113', '34443']), true)).toBe(1);
    expect(laps(picture(['33333', '33333', '33333'], ['33333', '32223', '33333']), true)).toBe(0);
    expect(laps(picture(['33333', '33333', '33333'], ['33333', '31133', '34433']), true)).toBe(0);
    expect(laps(picture(['33333', '33333', '33333'], ['33333', '31133', '34433']), true, 2)).toBe(1);
    expect(laps(picture(['333', '333', '333', '333'], ['314', '314', '314', '333']), false)).toBe(1);
    expect(laps(picture(['333', '333', '333', '333'], ['314', '314', '314', '333']), true)).toBe(0);
    // Shading that was there without the skin is no lap.
    expect(laps(picture(['33333', '11111', '44444'], ['33333', '11111', '44444']), true)).toBe(0);
  });
  it('the longest rim counts texture on the darkest shade along a row, not down a column and not hide left as it was', () => {
    expect(longestRim(picture(['22222', '22222'], ['21112', '22222']))).toBe(3);
    expect(longestRim(picture(['22222', '22222'], ['21222', '21222']))).toBe(1);
    expect(longestRim(picture(['11111', '22222'], ['11111', '22222']))).toBe(0);
  });
  it('two values in turn along a row or a column are counted where the texture made them', () => {
    expect(turns(picture(['2222', '2222'], ['2323', '2222']))).toBe(1);
    expect(turns(picture(['2', '2', '2', '2'], ['2', '1', '2', '1']))).toBe(1);
    expect(turns(picture(['2323', '2222'], ['2323', '2222']))).toBe(0);
    expect(turns(picture(['2222', '2222'], ['2332', '2222']))).toBe(0);
  });
});

/** Seams: runs of three or more pixels down a column, each a hide pixel darker than the pixel before it and two or more shades darker than the pixel after it, in one ramp: a dark line one pixel wide with a lit edge behind it. */
function seams(p: Picture): number {
  const seam = (x: number, y: number): boolean => {
    const before = at(p, x - 1, y); const v = at(p, x, y); const after = at(p, x + 1, y);
    return hide(before) && hide(v) && hide(after) && (v - 1) >> 2 === (after - 1) >> 2 && (v - 1) >> 2 === (before - 1) >> 2 && before > v && after - v >= 2 && texture(p, x, y);
  };
  let n = 0;
  for (let y = 0; y < p.h; y++) {
    for (let x = 0; x < p.w; x++) {
      if (!seam(x, y) || seam(x, y - 1)) continue;
      let len = 1;
      while (seam(x, y + len)) len++;
      if (len >= 3) n++;
    }
  }
  return n;
}
/** Texture pixels that touch an eye pixel (13, 14, 17 to 20), corners counted. */
function onEyes(p: Picture): number {
  const eye = (v: number): boolean => v === 13 || v === 14 || (v >= 17 && v <= 20);
  let n = 0;
  for (let y = 0; y < p.h; y++) {
    for (let x = 0; x < p.w; x++) {
      if (!texture(p, x, y)) continue;
      let near = false;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (eye(at(p, x + dx, y + dy))) near = true;
      if (near) n++;
    }
  }
  return n;
}

describe('plates and chitin on a finished large creature, on a pale hide and on a dark one', () => {
  for (const tier of TIERS) {
    for (const of of HIDES) {
      it(`${tier}, ${of}: plates lap one over the next, and chitin's segments meet at seams`, () => {
        for (const phase of PHASES) {
          const plated = finished(tier, of, 'plated', phase);
          // A plate laps over the one under it, and its back rim lies against the lit front of the one behind it.
          expect(laps(plated, true) + laps(plated, false), `plated phase ${phase}`).toBeGreaterThanOrEqual(12);
          expect(laps(plated, true), `plated phase ${phase}: one over the next`).toBeGreaterThanOrEqual(6);
          // A segment's back edge is a dark line against the next one's lit front; on a pale hide, where the ramp has the
          // room, it is darker than the segment's own shadow beside it (on a dark hide both are the ramp's darkest).
          const chitin = finished(tier, of, 'chitinous', phase);
          expect(laps(chitin, false), `chitinous phase ${phase}`).toBeGreaterThanOrEqual(4);
          if (of === 'pale') expect(seams(chitin), `chitinous phase ${phase}: seams`).toBeGreaterThanOrEqual(3);
        }
      });

      it(`${tier}, ${of}: the texture survives the finish: over a tenth of the hide, legs included`, () => {
        for (const skin of ['plated', 'chitinous']) {
          for (const phase of PHASES) {
            const t = textured(finished(tier, of, skin, phase), tier);
            expect(t.all * 10, `${skin} phase ${phase}: ${t.all} of ${t.hide}`).toBeGreaterThan(t.hide);
            expect(t.legs, `${skin} phase ${phase}: on the legs`).toBeGreaterThanOrEqual(24);
          }
        }
      });

      it(`${tier}, ${of}: no texture pixel of the finished creature stands alone, makes a checker, two values in turn, or a comb longer than a plate's edge`, () => {
        for (const skin of ['plated', 'chitinous']) {
          for (const phase of PHASES) {
            const p = finished(tier, of, skin, phase);
            expect(lonePixels(p), `lone pixels: ${skin} phase ${phase}`).toBe(0);
            expect(checkers(p), `checkers: ${skin} phase ${phase}`).toBe(0);
            expect(turns(p), `two values in turn: ${skin} phase ${phase}`).toBe(0);
            expect(comb(p), `comb: ${skin} phase ${phase}`).toBeLessThanOrEqual(6);
          }
        }
      });

      it(`${tier}, ${of}: no rim runs on from one leg across the leg beside it: none is as long as two thighs are wide`, () => {
        for (const skin of ['plated', 'chitinous']) {
          for (const phase of PHASES) expect(longestRim(finished(tier, of, skin, phase)), `${skin} phase ${phase}`).toBeLessThan(2 * sizes(tier).thigh);
        }
      });

      it(`${tier}, ${of}: nothing is drawn off the creature, out of a pixel's ramp, within an eye's reach of the eye point, or touching the eye`, () => {
        const s = sizes(tier);
        const eye = { x: (s.w >> 2) + s.body.w - 2 + (s.head.w >> 1), y: (s.h >> 3) + (s.body.h >> 3) + (s.head.h >> 1) };
        for (const skin of ['plated', 'chitinous']) {
          let onHead = 0;
          for (const phase of PHASES) {
            const p = finished(tier, of, skin, phase);
            // The eye is wider than the box round its point: armour keeps off every pixel of it all the same.
            expect(onEyes(p), `${skin} phase ${phase}: texture touching the eye`).toBe(0);
            for (let y = 0; y < p.h; y++) {
              for (let x = 0; x < p.w; x++) {
                if (!texture(p, x, y)) continue;
                const a = p.before[y * p.w + x] ?? 0; const b = at(p, x, y);
                expect(hide(a) && hide(b) && (a - 1) >> 2 === (b - 1) >> 2, `${skin} phase ${phase} (${x},${y}) ${a}>${b}`).toBe(true);
                expect(Math.abs(x - eye.x) <= 4 && Math.abs(y - eye.y) <= 4, `${skin} phase ${phase} (${x},${y}) under the eye`).toBe(false);
                if (x >= (s.w >> 2) + s.body.w) onHead++;
              }
            }
          }
          // Control: the head, clear of the eye, does take texture, so the eye's reach was measured on a textured part.
          expect(onHead, skin).toBeGreaterThan(0);
        }
      });
    }
  }

  it('the same large creature as a fish keeps chitin\'s thin lines and takes plates as armour; as a jelly it keeps the lines for both', () => {
    // The one creature, composed under another family's name: only the name decides (ARMOUR, skins.ts).
    for (const phase of PHASES) {
      const share = (p: Picture): number => { const t = textured(p, 'large'); return t.all / t.hide; };
      // Lines: a few seams, under a tenth of the hide, and no plate lapping over another. Armour: over a tenth.
      for (const [family, skin] of [['fish', 'chitinous'], ['gelatinous', 'chitinous'], ['gelatinous', 'plated']] as const) {
        const p = finished('large', 'pale', skin, phase, family);
        expect(share(p), `${family} ${skin} phase ${phase}`).toBeGreaterThan(0);
        expect(share(p), `${family} ${skin} phase ${phase}`).toBeLessThan(0.1);
        expect(laps(p, true), `${family} ${skin} phase ${phase}`).toBe(0);
      }
      const plated = finished('large', 'pale', 'plated', phase, 'fish');
      expect(share(plated), `fish plated phase ${phase}`).toBeGreaterThan(0.1);
      expect(laps(plated, true), `fish plated phase ${phase}`).toBeGreaterThanOrEqual(6);
      // And the fish's plates are the quadruped's: the family changes nothing else.
      expect(Array.from(plated.after), `fish plated phase ${phase}`).toEqual(Array.from(finished('large', 'pale', 'plated', phase).after));
    }
  });

  it('a large creature that keeps the lines is composed as before the armour was built, pixel for pixel', () => {
    // The test creature finished with plates and with chitin at fifteen phases, as one hash each, recorded from the code
    // branch's composer (e02a6f8), which draws every large creature with the lines: a fish's chitin and a jelly's plates
    // and chitin give exactly that; armour gives something else.
    const recorded = { chitinous: '9736aadc', plated: 'ab739a30' };
    const hashOf = (skin: 'plated' | 'chitinous', family: string): string => {
      const all: number[] = [];
      for (const phase of PHASES) all.push(...finished('large', 'pale', skin, phase, family).after);
      return hashBuffer({ w: all.length, h: 1, pixels: all });
    };
    expect(hashOf('chitinous', 'fish')).toBe(recorded.chitinous);
    expect(hashOf('chitinous', 'gelatinous')).toBe(recorded.chitinous);
    expect(hashOf('chitinous', 'tentacled')).toBe(recorded.chitinous);
    expect(hashOf('chitinous', 'serpent/viper')).toBe(recorded.chitinous);
    expect(hashOf('chitinous', 'insect/beetle')).toBe(recorded.chitinous);
    // Their plates, and the other serpent's and insects' chitin, are armour.
    for (const [skin, body] of [['plated', 'serpent/viper'], ['plated', 'insect/beetle'], ['chitinous', 'serpent/snake'], ['chitinous', 'insect/mantis']] as const) expect(hashOf(skin, body), `${skin} ${body}`).not.toBe(recorded[skin]);
    expect(hashOf('plated', 'gelatinous')).toBe(recorded.plated);
    expect(hashOf('plated', 'fish')).not.toBe(recorded.plated);
    expect(hashOf('chitinous', 'quadruped')).not.toBe(recorded.chitinous);
  });

  it('the same creature and phase give the same finished picture; another phase gives another', () => {
    for (const skin of ['plated', 'chitinous']) {
      const a = finished('large', 'pale', skin, 3);
      expect(Array.from(finished('large', 'pale', skin, 3).after)).toEqual(Array.from(a.after));
      expect(Array.from(finished('large', 'pale', skin, 4).after)).not.toEqual(Array.from(a.after));
    }
  });
});

// Single parts, as the painter leaves them.
const grid = (rws: readonly string[]): Uint8Array => Uint8Array.from(rws.join('').split('').map((c) => PIXEL_CHARS.indexOf(c)));
const part = (rws: readonly string[]): PartFrame => ({ w: (rws[0] as string).length, h: rws.length, pixels: grid(rws), anchor: [0, 0], attach: {}, layers: {} });
const block = (w: number, h: number, c: string): string[] => new Array<string>(h).fill(c.repeat(w));
const painted = (f: PartFrame, skin: 'plated' | 'chitinous', seed: number): Picture => ({ w: f.w, h: f.h, before: f.pixels, after: paintSkin(f, f.pixels, skin, 'large', seed)! });
const SEEDS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

/** The lit upper edges of plates along one row of a flat hide: [start, length] of each run of four or more pixels lighter than the hide was. */
function litRuns(p: Picture, y: number): [number, number][] {
  const out: [number, number][] = [];
  for (let x = 0; x < p.w; x++) {
    let n = 0;
    while (x + n < p.w && (p.after[y * p.w + x + n] ?? 0) > (p.before[y * p.w + x + n] ?? 0)) n++;
    if (n >= 4) out.push([x, n]);
    x += n;
  }
  return out;
}

describe('armour is drawn as pieces, never as a mesh, a ruled grid or a comb', () => {
  it('the measures: a mesh of blocks is all specks; a comb is counted whatever its values; plates on one grid share their starts', () => {
    const flat = block(12, 6, '2');
    const mesh = ['112211221122', '112211221122', '222222222222', '222222222222', '112211221122', '112211221122'];
    const pic = (after: readonly string[]): Picture => ({ w: 12, h: 6, before: grid(flat), after: grid(after) });
    expect(specks(pic(mesh))).toBe(6);
    expect(specks(pic(['222222222222', '211111111112', '211111111112', '222222222222', '222222222222', '222222222222']))).toBe(0);
    // Texture and hide in turn with mixed values (1, 3, 4, 3, 1, 4 on a hide of 2): `turns` sees no two values in turn, `comb` sees the comb.
    const mixed = pic(['123242321242', ...block(12, 5, '2')]);
    expect(turns(mixed)).toBe(0);
    expect(comb(mixed)).toBe(12);
    expect(comb(pic(['211122211122', ...block(12, 5, '2')]))).toBe(2);
    expect(litRuns(pic(['233332333322', ...block(12, 5, '2')]), 0)).toEqual([[1, 4], [6, 4]]);
  });

  it('settling armour takes back a comb longer than a plate\'s edge, whatever its values, and leaves a shorter one', () => {
    // Two rows thick, so no pixel stands alone, and of mixed values, so no two values come in turn: only a comb.
    const settled = (row: string): string[] => {
      const before = grid(block(row.length, 4, '2'));
      const out = grid([...block(row.length, 1, '2'), row, row, ...block(row.length, 1, '2')]);
      settleTexture(row.length, 4, before, out, { x0: 0, y0: 0, x1: row.length - 1, y1: 3 }, true);
      return [0, 1, 2, 3].map((y) => Array.from(out.subarray(y * row.length, (y + 1) * row.length), (v) => PIXEL_CHARS[v]).join(''));
    };
    expect(settled('21232423212422')).toEqual(block(14, 4, '2'));   // texture and hide in turn eleven times: a comb
    expect(settled('21232422222222')).toEqual(['22222222222222', '21232422222222', '21232422222222', '22222222222222']); // five: a plate's edge
  });

  it('on a flat middle shade a piece leaves its face as the hide was: no mesh, dots or blocks inside it', () => {
    const flat = part(block(96, 64, '2'));
    for (const skin of ['plated', 'chitinous'] as const) {
      for (const seed of SEEDS) {
        const p = painted(flat, skin, seed);
        // 96 by 64 pixels hold some sixty plates or eight segments: a mesh over their faces would be hundreds of specks.
        expect(specks(p), `${skin} seed ${seed}`).toBeLessThanOrEqual(8);
        expect(comb(p), `${skin} seed ${seed}`).toBeLessThanOrEqual(6);
      }
    }
  });

  it('rows of plates are not ruled: a row does not start where the row above it starts, and plates differ in width', () => {
    const flat = part(block(96, 64, '2'));
    const rule = SKIN_TABLE.plated;
    if (rule.mode !== 'plates') throw new Error('plated is not drawn as plates');
    let shared = 0; let starts = 0;
    for (const seed of SEEDS) {
      const p = painted(flat, 'plated', seed);
      const widths = new Set<number>();
      // The rows of plates lie one plate's height apart from the top edge: their lit upper edges are in those rows.
      const rowsOfPlates = [0, 1, 2, 3].map((j) => litRuns(p, j * rule.armour.tall));
      for (const [j, runs] of rowsOfPlates.entries()) {
        expect(runs.length, `seed ${seed} row ${j}: plates in the row`).toBeGreaterThanOrEqual(5);
        // A plate cut by the part's edge is not a whole plate: the first and last of a row are left out.
        for (const [, n] of runs.slice(1, -1)) widths.add(n);
        if (j === 0) continue;
        const above = new Set((rowsOfPlates[j - 1] as [number, number][]).map(([x]) => x));
        for (const [x] of runs) { starts++; if (above.has(x)) shared++; }
      }
      expect(widths.size, `seed ${seed}: widths ${[...widths].join(' ')}`).toBeGreaterThanOrEqual(2);
    }
    // By chance a plate starts under another about once in thirteen; on a grid every one does.
    expect(shared * 4, `${shared} of ${starts} plates start where one above starts`).toBeLessThan(starts);
  });

  it('plates go down five eighths of a body and no further', () => {
    const rule = SKIN_TABLE.plated;
    if (rule.mode !== 'plates') throw new Error('plated is not drawn as plates');
    const tall = 64; const flat = part(block(96, tall, '2'));
    for (const seed of SEEDS) {
      const p = painted(flat, 'plated', seed);
      const row = (y: number): number => { let n = 0; for (let x = 0; x < p.w; x++) if (texture(p, x, y)) n++; return n; };
      // The last row of plates starts above five eighths of the height (row 40) and ends one plate lower at most.
      const last = [...Array(tall).keys()].filter((y) => row(y) > 0).pop() as number;
      expect(last, `seed ${seed}`).toBeGreaterThanOrEqual(34);
      expect(last, `seed ${seed}`).toBeLessThan(40 + rule.armour.tall);
    }
  });

  it('a piece on a hide half one shade and half the next takes the lighter as its face', () => {
    // A leg four wide, its front half shade 2 and its back half shade 3: a joint's lit line is then the ramp's lightest
    // (face 3, lit 4), not the 3 a face of 2 would give.
    const leg = part(new Array<string>(40).fill('2233'));
    let lit = 0;
    for (const seed of SEEDS) {
      const p = painted(leg, 'chitinous', seed);
      for (let y = 0; y < p.h; y++) {
        const r = [0, 1, 2, 3].map((x) => at(p, x, y));
        if (r[0] === r[1] && r[1] === r[2] && r[2] === r[3] && r[0] !== 1) { expect(r[0], `seed ${seed} row ${y}`).toBe(4); lit++; }
      }
    }
    expect(lit).toBeGreaterThan(12);
  });

  it('chitin joints are drawn across a leg, and not across an upright part wider than two segments', () => {
    const rule = SKIN_TABLE.chitinous;
    if (rule.mode !== 'seams') throw new Error('chitinous is not drawn as segments');
    const leg = part(block(2 * rule.armour.gap, 60, '2'));
    const slab = part(block(2 * rule.armour.gap + 1, 60, '2'));
    for (const seed of SEEDS) {
      expect(longestRim(painted(leg, 'chitinous', seed)), `leg seed ${seed}`).toBeGreaterThanOrEqual(2 * rule.armour.gap - 4);
      expect(Array.from(painted(slab, 'chitinous', seed).after), `slab seed ${seed}`).toEqual(Array.from(slab.pixels));
    }
  });
});

describe('armour follows the body: it keeps off arms, and off an eye the body draws', () => {
  const mantle = block(80, 16, '3');

  it('a body over a few arms takes armour on the body alone', () => {
    // A mantle 80 by 16 over two arms under its first third, each 4 rows thick with 3 empty rows over it.
    const few = part([...mantle, ...[0, 1].flatMap(() => [...block(80, 3, '.'), ...new Array<string>(4).fill('3'.repeat(28) + '.'.repeat(52))])]);
    for (const skin of ['plated', 'chitinous'] as const) {
      for (const seed of SEEDS) {
        const p = painted(few, skin, seed);
        let onBody = 0; let onArms = 0;
        for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) if (texture(p, x, y)) { if (y < 16) onBody++; else onArms++; }
        expect(onArms, `${skin} seed ${seed}: on the arms`).toBe(0);
        expect(onBody, `${skin} seed ${seed}: on the body`).toBeGreaterThan(60);
      }
    }
  });

  it('an eye drawn in the body itself keeps the hide round it as drawn, four pixels each way', () => {
    const rws = block(60, 30, '3');
    rws[12] = '3'.repeat(30) + 'de' + '3'.repeat(28);
    const eyed = part(rws);
    for (const skin of ['plated', 'chitinous'] as const) {
      let elsewhere = 0;
      for (const seed of SEEDS) {
        const p = painted(eyed, skin, seed);
        for (let y = 0; y < p.h; y++) {
          for (let x = 0; x < p.w; x++) {
            if (!texture(p, x, y)) continue;
            expect(x >= 26 && x <= 35 && y >= 8 && y <= 16, `${skin} seed ${seed} (${x},${y})`).toBe(false);
            elsewhere++;
          }
        }
      }
      expect(elsewhere, skin).toBeGreaterThan(1000);
    }
  });
});
