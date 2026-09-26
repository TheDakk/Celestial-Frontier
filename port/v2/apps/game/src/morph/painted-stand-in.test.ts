/** Painted stand-ins (Nick 2026-09-24: the painted art direction carries throughout the game). Outcomes: every route, the
 * visible-anatomy law (a stand-in draws the SAME body family and leg count the procedural painter draws), and a drift test that
 * runs hdart's own `_procFamily` source against `proceduralFamilyV1` on thousands of genomes. */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { makeGenome } from '@cf/domain-genome';
import { FA_LIMBS, locoOf, habOf } from '@cf/domain-speciestraits';
import { CARD_ARCHETYPES } from './card-archetypes.js';
import { TEMPLATE_PAINTING, paintedStandInV1, proceduralFamilyV1 } from './painted-stand-in.js';
import { EARTH_FAUNA_PROFILES } from '../earth-fauna-profiles.js';

const PAINTED = new Set(CARD_ARCHETYPES.map((a) => a.earthName));
const REPO = new URL('../../../../../../', import.meta.url);
const HDART = readFileSync(new URL('../../../../packages/art/src/hdart.verbatim.js', import.meta.url), 'utf8');
const genomes = (n: number) => Array.from({ length: n }, (_, i) => makeGenome(1000 + i * 7919, 'fauna', (i % 10) / 10) as unknown as Record<string, unknown>);

describe('painted stand-ins', () => {
  it('each painted archetype record carries the template TEMPLATE_PAINTING maps it from (the map cannot drift from the paintings)', () => {
    for (const a of CARD_ARCHETYPES) {
      const record = JSON.parse(readFileSync(new URL(a.dir + 'record.json', REPO), 'utf8')) as { template: { id: string } };
      const mapped = TEMPLATE_PAINTING[record.template.id]!; expect(mapped, `${a.earthName} (${record.template.id})`).toBeDefined(); expect(PAINTED.has(mapped)).toBe(true);
      // a plan may have several paintings (five crabs; Salmon/Bass/Tang fish; Starfish/Jellyfish radial) — the map names ONE of them
      if (mapped === a.earthName) continue; const own = JSON.parse(readFileSync(new URL(CARD_ARCHETYPES.find((x) => x.earthName === mapped)!.dir + 'record.json', REPO), 'utf8')) as { template: { id: string } };
      expect(own.template.id, `${a.earthName}: the plan's painting ${mapped} must carry the same plan`).toBe(record.template.id);
    }
    // the inverse direction: every mapped painting's own record carries the plan it is mapped from (the map cannot drift)
    for (const [template, name] of Object.entries(TEMPLATE_PAINTING)) { const a = CARD_ARCHETYPES.find((x) => x.earthName === name)!; expect(a, name).toBeDefined();
      expect((JSON.parse(readFileSync(new URL(a.dir + 'record.json', REPO), 'utf8')) as { template: { id: string } }).template.id, name).toBe(template); }
  });
  it('route 1: a painted Earth species is itself; route 2: an Earth species takes its body plan\'s painting; no profile or no painted template → null; non-fauna → null', () => {
    expect(paintedStandInV1({ _earthName: 'Python', seed: 1 }, PAINTED)).toEqual({ earthName: 'Python', kind: 'painted', family: 'self' });
    expect(paintedStandInV1({ _earthName: 'Brown Bear', seed: 1 }, PAINTED)).toEqual({ earthName: 'Civet', kind: 'earth-stand-in', family: 'quadruped' });
    expect(paintedStandInV1({ _earthName: 'Garter Snake', seed: 1 }, PAINTED)?.earthName).toBe('Python');
    expect(paintedStandInV1({ _earthName: 'Fiddler Crab', seed: 1 }, PAINTED)?.earthName).toBe('Crab');
    // C15: a procedural jelly (body plan 9) draws as the painted Jellyfish; without the Jellyfish in the painted set it keeps procedural art
    expect(paintedStandInV1({ kingdom: 'fauna', body: 9, seed: 1 }, PAINTED)).toEqual({ earthName: 'Jellyfish', kind: 'procedural-stand-in', family: 'jelly' });
    expect(paintedStandInV1({ kingdom: 'fauna', body: 9, seed: 1 }, new Set([...PAINTED].filter((n) => n !== 'Jellyfish')))).toBeNull();
    expect(paintedStandInV1({ _earthName: 'No Such Creature', seed: 1 }, PAINTED)).toBeNull();
    expect(paintedStandInV1({ kingdom: 'flora', seed: 1 }, PAINTED)).toBeNull();
    // every profile with a painted template resolves; every one without resolves to null
    let covered = 0, uncovered = 0;
    for (const p of EARTH_FAUNA_PROFILES) for (const name of p.names) { const t = p.candidateTemplates[0], s = paintedStandInV1({ _earthName: name, seed: 1 }, PAINTED);
      if (PAINTED.has(name)) expect(s?.kind, name).toBe('painted');
      else if (t && TEMPLATE_PAINTING[t]) { expect(s?.earthName, name).toBe(TEMPLATE_PAINTING[t]); covered++; } else { expect(s, name).toBeNull(); uncovered++; } }
    expect(covered).toBeGreaterThan(500); expect(uncovered).toBeGreaterThan(0);
  });
  it('route 3 obeys the visible-anatomy law: a land stand-in has the leg count the procedural painter draws (4 → Civet or Tree Frog, 6 → Beetle, 8 → Tarantula); 0, 2 and 3 legs keep the procedural art', () => {
    const LEGS: Readonly<Record<string, number>> = { Civet: 4, 'Tree Frog': 4, Beetle: 6, Tarantula: 8 };
    let land = 0;
    for (const g of genomes(3000)) { const fam = proceduralFamilyV1(g), s = paintedStandInV1(g, PAINTED);
      if (!fam.startsWith('land:')) continue; land++;
      const limbs = FA_LIMBS[((g.limbs as number) || 0) % FA_LIMBS.length]!;
      if (s) expect(LEGS[s.earthName], `${fam} → ${s.earthName}`).toBe(limbs); else expect([0, 2, 3]).toContain(limbs);
    }
    expect(land).toBeGreaterThan(300);
  });
  it('DRIFT: proceduralFamilyV1 equals hdart\'s own _procFamily (run from its source) on 4000 genomes, with the same plan / water / seed inputs hdart reads', () => {
    // the inputs, pinned as hdart's source text: plan, the water test, the portrait seed (a change there must fail here)
    expect(HDART).toContain('const plan=(g.body||0)%16;');
    expect(HDART).toContain("aqua:/swim|filter|jet|brine-crawl/.test(locoOf(g))||/ocean|shallows|reef|vent|trench|lakeshore|sea/.test(habOf(g)),");
    expect(HDART).toContain('const bcv=hdBeastBare(G,(g.seed^0x9A11)>>>0);');
    const start = HDART.indexOf('function _procFamily(G, seed){'), end = HDART.indexOf('\n}\n', start);
    expect(start).toBeGreaterThan(0);
    const procFamily = new Function(`${HDART.slice(start, end + 2)}; return _procFamily;`)() as (G: Record<string, unknown>, seed: number) => Record<string, string> | null;
    const asFamily = (o: Record<string, string> | null, g: Record<string, unknown>, plan: number): string => {
      if (!o) return plan === 7 ? 'winged:membrane' : plan === 14 ? 'winged:four' : `land:${FA_LIMBS[((g.limbs as number) || 0) % FA_LIMBS.length]}${/leaper/.test(locoOf(g)) ? ':leaper' : ''}`;
      if (o.rig === 'serpent') return `serpent:${o.ssub}`; if (o.rig === 'jelly') return 'jelly'; if (o.rig === 'sessile') return `sessile:${o.sshape}`;
      if (o.rig === 'ceph') return `ceph:${o.cephk}`; if (o.rig === 'insect') return `insect:${o.ishape}`; if (o.rig === 'crust') return `crust:${o.cshape}`; if (o.rig === 'fish') return `fish:${o.fshape}`;
      return `?${o.rig}`; };
    const seen = new Set<string>();
    for (const g of genomes(4000)) {
      const plan = ((g.body as number) || 0) % 16, aqua = /swim|filter|jet|brine-crawl/.test(locoOf(g)) || /ocean|shallows|reef|vent|trench|lakeshore|sea/.test(habOf(g));
      const theirs = asFamily(procFamily({ plan, aqua }, (((g.seed as number) ^ 0x9A11) >>> 0)), g, plan), mine = proceduralFamilyV1(g);
      expect(mine, `seed ${g.seed}`).toBe(theirs); seen.add(mine.split(':')[0]!);
    }
    expect([...seen].sort()).toEqual(['ceph', 'crust', 'fish', 'insect', 'jelly', 'land', 'serpent', 'sessile', 'winged']); // every branch exercised
  });
  it('coverage of procedural creatures today (reported, not a gate): the share of genomes a painting now draws', () => {
    const all = genomes(4000), hit = all.filter((g) => paintedStandInV1(g, PAINTED) !== null).length;
    expect(hit / all.length).toBeGreaterThan(0.3);
  });
});
