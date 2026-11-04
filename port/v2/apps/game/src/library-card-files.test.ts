/** FINISH F4: the compact LIBRARY card table. Outcomes: it behaves as the literal table did (has/get/size/keys/entries); every file it
 * names is a real library file pinned by the art-library manifest; unknown dirs, keys and spellings are absent; a duplicate key is
 * refused; records are frozen. */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { libraryCardFilesV1 } from './library-card-files.js';
import { CARD_LIBRARY_FILES } from './painted-cards.js';
import { CARD_ARCHETYPES } from './morph/card-archetypes.js';

const ROOT = 'port/v2/apps/game/public/library/cards/';
describe('compact library card files', () => {
  it('a small table behaves exactly like the literal map it replaces; unknown dirs are absent; duplicates refused', () => {
    const m = libraryCardFilesV1(ROOT, 'library/', ['wolf', 'bass'], ['card/card.json', 'record.json'], { bass: ['markings.json'] });
    const literal = new Map([[ROOT + 'wolf/', { 'card/card.json': 'library/cards/wolf/card/card.json', 'record.json': 'library/cards/wolf/record.json' }],
      [ROOT + 'bass/', { 'card/card.json': 'library/cards/bass/card/card.json', 'record.json': 'library/cards/bass/record.json', 'markings.json': 'library/cards/bass/markings.json' }]]);
    expect(m.size).toBe(2); expect([...m.keys()]).toEqual([...literal.keys()]);
    expect([...m].map(([d, f]) => [d, { ...f }])).toEqual([...literal].map(([d, f]) => [d, f]));
    for (const [d, f] of literal) { expect(m.has(d)).toBe(true); expect({ ...m.get(d) }).toEqual(f); expect(Object.isFrozen(m.get(d))).toBe(true); }
    for (const bad of [ROOT + 'tiger/', ROOT + 'wolf', ROOT.slice(0, -1) + 'x/wolf/', 'library/cards/wolf/', ROOT + 'wolf/card/']) { expect(m.has(bad), bad).toBe(false); expect(m.get(bad), bad).toBeUndefined(); }
    expect(() => libraryCardFilesV1(ROOT, 'library/', ['wolf', 'wolf'], [], {})).toThrow(/duplicate/);
  });
  it('the shipped table: exactly the library archetypes, every named file is on disk and pinned by the art-library manifest', () => {
    const lib = CARD_ARCHETYPES.filter((a) => a.dir.startsWith(ROOT));
    expect(CARD_LIBRARY_FILES.size).toBe(lib.length); expect(lib.length).toBeGreaterThan(300);
    const manifest = new Set((JSON.parse(readFileSync(new URL('../public/library/art-library.json', import.meta.url), 'utf8')) as { files: { path: string }[] }).files.map((f) => f.path));
    for (const a of lib) { const files = CARD_LIBRARY_FILES.get(a.dir); expect(files, a.earthName).toBeDefined();
      for (const [rel, served] of Object.entries(files!)) { expect(served, a.earthName).toBe('library/cards/' + a.dir.slice(ROOT.length) + rel); expect(manifest.has(served), served).toBe(true); } }
  });
});
