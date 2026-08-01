/* THE SPECIES AUDIT (Phase 5's scale gate, the game's "1010 rendered clean"
   ported): every Earth-catalog name + a procedural spread through the
   VERBATIM hdart engine — counted, failures named, contact sheets baked.
   Driven headless by tools/speciesaudit.mjs; also runnable by hand. */
import { speciesPortrait } from '@cf/art/species';
import { _EARTH_NAMES } from '@cf/domain-descriptors';
import { makeGenome } from '@cf/domain-genome';
import { hashInt } from '@cf/domain-rand';

const log = document.getElementById('log')!;
const say = (t: string): void => { log.textContent = t; };
/* FULL-SIZE EXPORT MODE (?full=1): stream every portrait at the engine's
   NATIVE resolution through a pull-buffer for the driver to write to disk
   (Nick's system-check deliverable — no downscales, no re-encodes). */
const FULL = location.search.includes('full');
interface FullItem { k: string; name: string; url: string }
const fullQ: FullItem[] = [];
(window as unknown as Record<string, unknown>).__CF_FULL__ = { q: fullQ, done: false };
async function pushFull(k: string, name: string, url: string | null): Promise<void> {
  if (!FULL || !url) return;
  fullQ.push({ k, name, url });
  while (fullQ.length > 12) await new Promise((r) => setTimeout(r, 80));   /* let the driver drain */
}
interface SheetSpec { key: string; cells: Array<{ name: string; url: string | null }> }

async function run(): Promise<void> {
  const NAMES = _EARTH_NAMES as unknown as Record<string, string[]>;
  const kingdoms = Object.keys(NAMES);
  const sheets: SheetSpec[] = [];
  const fails: string[] = [];
  let total = 0, ok = 0;
  /* the full Earth catalog, kingdom by kingdom */
  for (const [ki, kingdom] of kingdoms.entries()) {
    const cells: SheetSpec['cells'] = [];
    const pool = NAMES[kingdom]!;
    for (let i = 0; i < pool.length; i++) {
      const name = pool[i]!;
      total++;
      let url: string | null = null;
      try {
        const g = makeGenome((hashInt(0xEA47, i, ki) >>> 0), kingdom, 1) as Record<string, unknown>;
        g._earthName = name;
        url = speciesPortrait(g);
        if (!url || url.length < 3000) { url = null; throw new Error('thin paint'); }
        ok++;
      } catch (e) { fails.push(kingdom + ':' + name + ' — ' + (e as Error).message); }
      await pushFull('earth-' + kingdom, name, url);
      cells.push({ name, url });
      if (i % 25 === 0) { say(`Earth ${kingdom}: ${i}/${pool.length} (ok ${ok}/${total})`); await new Promise((r) => setTimeout(r, 0)); }
    }
    sheets.push({ key: 'earth-' + kingdom, cells });
  }
  /* the procedural spread: every kingdom × heats × a seed fan */
  const proc: SheetSpec['cells'] = [];
  for (const [ki, kingdom] of kingdoms.entries()) {
    for (let heat = 0; heat <= 2; heat++) {
      for (let s = 0; s < 20; s++) {
        total++;
        const seed = (hashInt(0xF00D, ki * 100 + heat * 25 + s, 7) >>> 0);
        let url: string | null = null;
        try {
          const g = makeGenome(seed, kingdom, heat);
          url = speciesPortrait(g as never);
          if (!url || url.length < 3000) { url = null; throw new Error('thin paint'); }
          ok++;
        } catch (e) { fails.push('proc:' + kingdom + '/h' + heat + '/s' + s + ' — ' + (e as Error).message); }
        await pushFull('procedural', kingdom + '-h' + heat + '-s' + s, url);
        proc.push({ name: kingdom[0]! + heat + '·' + s, url });
      }
      say(`procedural ${kingdom} heat ${heat} (ok ${ok}/${total})`);
      await new Promise((r) => setTimeout(r, 0));
    }
  }
  sheets.push({ key: 'procedural', cells: proc });
  /* contact sheets: a grid per set, portraits at 96px */
  const sheetUrls: Record<string, string> = {};
  for (const sh of sheets) {
    const C = 96, cols = Math.ceil(Math.sqrt(sh.cells.length * 1.4));
    const rows = Math.ceil(sh.cells.length / cols);
    const cv = document.createElement('canvas');
    cv.width = cols * C; cv.height = rows * (C + 14);
    const g = cv.getContext('2d')!;
    g.fillStyle = '#070a12'; g.fillRect(0, 0, cv.width, cv.height);
    for (let i = 0; i < sh.cells.length; i++) {
      const cell = sh.cells[i]!;
      const x = (i % cols) * C, y = Math.floor(i / cols) * (C + 14);
      if (cell.url) {
        const im = new Image();
        await new Promise<void>((res) => { im.onload = () => res(); im.onerror = () => res(); im.src = cell.url!; });
        g.drawImage(im, x + 2, y + 2, C - 4, C - 4);
      } else { g.fillStyle = '#5a1f1f'; g.fillRect(x + 2, y + 2, C - 4, C - 4); g.fillStyle = '#070a12'; }
      g.fillStyle = '#8fa3c4'; g.font = '8px system-ui'; g.textAlign = 'center';
      g.fillText(cell.name.slice(0, 18), x + C / 2, y + C + 9);
      if (i % 60 === 0) { say(`sheet ${sh.key}: ${i}/${sh.cells.length}`); await new Promise((r) => setTimeout(r, 0)); }
    }
    sheetUrls[sh.key] = cv.toDataURL('image/png');
  }
  (window as unknown as { __CF_FULL__: { done: boolean } }).__CF_FULL__.done = true;
  say(`DONE — ${ok}/${total} painted, ${fails.length} failures`);
  (window as unknown as Record<string, unknown>).__CF_AUDIT__ = { done: true, total, ok, fails, sheetUrls };
}
void run();
