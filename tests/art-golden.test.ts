import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { Catalogue, Part } from '@cf/art-format';
import { __buildRecipeAtVersionForTests, buildRecipe, GENE_LENGTHS, identityKey, RENDERER_VERSION } from '@cf/art-recipe';
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
    expect(fixture.entries).toHaveLength(614);
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
