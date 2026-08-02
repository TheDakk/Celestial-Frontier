/* THE SPECIES AUDIT (Phase 5's scale gate, the game's "1010 rendered clean"
   ported): every Earth-catalog name + a procedural spread through the
   VERBATIM hdart engine — counted, failures named, contact sheets baked.
   Driven headless by tools/speciesaudit.mjs; also runnable by hand. */
import { speciesPortrait, CLIPPED } from '@cf/art/species';
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

/* STRIP MODE (?strip=A,B,C): render just the named species BIG and labelled,
   into one sheet — the standing eyeball instrument for a morphology wave.
   The audit proves 1,254 paint; the strip is how a human judges a handful. */
async function strip(names: string[]): Promise<void> {
  const NAMES = _EARTH_NAMES as unknown as Record<string, string[]>;
  const want = names.map((n) => n.trim().replace(/[''’‘]/g, "'")).filter(Boolean);
  const cells: Array<{ name: string; url: string | null }> = [];
  for (const n of want) {
    let url: string | null = null;
    /* PROCEDURAL FORM: "proc:<kingdom>:h<heat>:s<seed>" renders a genome with
       NO _earthName — the path every bred creature takes. Until this existed
       no instrument had ever shown us one, and twelve waves were judged
       entirely on the Earth catalogue. */
    const pm = /^proc:(\w+):h(\d+):s(\d+)$/.exec(n);
    if (pm) {
      const [, kingdom, heat, s] = pm;
      const seed = (hashInt(0xF00D, Number(s), 7) >>> 0);
      const g = makeGenome(seed, kingdom!, Number(heat)) as Record<string, unknown>;
      try { url = speciesPortrait(g); } catch { url = null; }
      cells.push({ name: `${kingdom}·h${heat}·s${s}`, url });
      continue;
    }
    for (const [ki, kingdom] of Object.keys(NAMES).entries()) {
      /* normalise BOTH sides: the catalog stores a curly apostrophe
         (Lion's Mane) and a raw compare silently failed to find it */
      const norm = (s: string): string => s.replace(/[’‘]/g, "'");
      const i = NAMES[kingdom]!.findIndex((x) => norm(x) === norm(n));
      if (i < 0) continue;
      /* the SAME genome the audit uses, so the strip shows the audited pixels */
      const g = makeGenome((hashInt(0xEA47, i, ki) >>> 0), kingdom, 1) as Record<string, unknown>;
      g._earthName = n;
      try { url = speciesPortrait(g); } catch { url = null; }
      break;
    }
    cells.push({ name: n, url });
  }
  const C = 300, LAB = 30, cols = Math.min(cells.length, 5);
  const rows = Math.ceil(cells.length / cols);
  const cv = document.createElement('canvas');
  cv.width = cols * C; cv.height = rows * (C + LAB);
  const c = cv.getContext('2d')!;
  c.fillStyle = '#07090d'; c.fillRect(0, 0, cv.width, cv.height);
  await Promise.all(cells.map((cell, i) => new Promise<void>((res) => {
    const x = (i % cols) * C, y = Math.floor(i / cols) * (C + LAB);
    c.fillStyle = '#8ea6c8'; c.font = '15px system-ui, sans-serif'; c.textAlign = 'center';
    c.fillText(cell.name, x + C / 2, y + C + 20);
    if (!cell.url) { c.strokeStyle = '#c0392b'; c.strokeRect(x + 8, y + 8, C - 16, C - 16); return res(); }
    const im = new Image();
    im.onload = () => { c.drawImage(im, x + 6, y + 6, C - 12, C - 12); res(); };
    im.onerror = () => res();
    im.src = cell.url;
  })));
  say(`strip: ${cells.length} species`);
  (window as unknown as Record<string, unknown>).__CF_STRIP__ = { done: true, url: cv.toDataURL() };
}

/* ★ PROPORTION MODE (?prop=<kingdom>) — WAVE 22. Nick: "the bodies on a lot of
   the creatures are not proportionate… some seem way too elongated, especially
   on mammals."

   Every instrument we have answers a yes/no about a single asset: did it paint,
   is it a duplicate, does it clip. None of them could see a SHAPE that is wrong
   across a whole family, because each animal is individually fine-looking until
   you line up its aspect ratio against its relatives. This measures the ink
   bounding box of every species in a kingdom and reports width/height.

   The fit pass scales uniformly (k = min(target/w, target/h)), so aspect ratio
   SURVIVES it — what this measures is the true proportion the painter drew. */
async function proportions(kingdom: string): Promise<void> {
  const NAMES = _EARTH_NAMES as unknown as Record<string, string[]>;
  const ki = Object.keys(NAMES).indexOf(kingdom);
  const pool = NAMES[kingdom] || [];
  const rows: Array<{ name: string; w: number; h: number; aspect: number; lobe: number; eyes: number; eyeU: number }> = [];
  const cv = document.createElement('canvas'); cv.width = cv.height = 440;
  const cc = cv.getContext('2d', { willReadFrequently: true })!;
  for (const [i, name] of pool.entries()) {
    const g = makeGenome((hashInt(0xEA47, i, ki) >>> 0), kingdom, 1) as Record<string, unknown>;
    g._earthName = name;
    let url: string | null = null;
    try { url = speciesPortrait(g); } catch { url = null; }
    if (!url) continue;
    await new Promise<void>((res) => {
      const im = new Image();
      im.onload = () => {
        cc.clearRect(0, 0, 440, 440); cc.drawImage(im, 0, 0);
        const d = cc.getImageData(0, 0, 440, 440).data;
        /* the portrait has a painted vignette background, so alpha cannot find
           the subject — measure against the BACKGROUND COLOUR instead, taking
           the frame's own corner as the reference. A threshold on luminance
           alone would have called the vignette's bright centre "subject". */
        const br = d[0]!, bg2 = d[1]!, bb = d[2]!;
        let x0 = 440, y0 = 440, x1 = -1, y1 = -1;
        for (let y = 0; y < 440; y++) {
          for (let x = 0; x < 440; x++) {
            const o = (y * 440 + x) * 4;
            const dr = d[o]! - br, dg = d[o + 1]! - bg2, db = d[o + 2]! - bb;
            if (dr * dr + dg * dg + db * db > 1500) {
              if (x < x0) x0 = x; if (x > x1) x1 = x;
              if (y < y0) y0 = y; if (y > y1) y1 = y;
            }
          }
        }
        if (x1 >= 0) {
          const w = x1 - x0 + 1, h = y1 - y0 + 1;
          /* ★ WAVE 22b — INTERNAL PROPORTION. Nick: "the horned lizard head is
             massive". Aspect ratio measures the WHOLE subject, so a head twice
             the size it should be is completely invisible to it — the bbox is
             identical either way. This walks the ink column by column and
             builds a height profile, then compares the END LOBES (where a head
             or a rump sits) against the TRUNK. A head bigger than the body it
             is attached to shows up as an end lobe taller than the middle. */
          const prof = new Array<number>(w).fill(0);
          for (let x = x0; x <= x1; x++) {
            let top = -1, bot = -1;
            for (let y = y0; y <= y1; y++) {
              const o = (y * 440 + x) * 4;
              const dr = d[o]! - br, dg = d[o + 1]! - bg2, db = d[o + 2]! - bb;
              if (dr * dr + dg * dg + db * db > 1500) { if (top < 0) top = y; bot = y; }
            }
            prof[x - x0] = top < 0 ? 0 : bot - top + 1;
          }
          const seg = (a: number, b: number): number => {
            let m = 0;
            for (let i = Math.floor(w * a); i < Math.ceil(w * b) && i < w; i++) m = Math.max(m, prof[i]!);
            return m;
          };
          const trunk = seg(0.27, 0.73) || 1;
          const lobe = Math.max(seg(0, 0.18), seg(0.82, 1));

          /* ★ STAGE 2 — IS THERE A READABLE EYE?
             Every eye in this library is drawn the same way: a pale sclera, a
             near-black pupil inside it, and a white catchlight. That signature
             is measurable — a very bright pixel with a very dark pixel within a
             few px. Nothing else in the palette does that, because the pattern
             law forbids hard edges everywhere else. Counting those pairs tells
             us whether the animal HAS a face, which no gate could see before. */
          const lum = (o: number): number => 0.299 * d[o]! + 0.587 * d[o + 1]! + 0.114 * d[o + 2]!;
          /* ⚠ THE FIRST DETECTOR WAS WRONG IN BOTH DIRECTIONS AND ITS SELF-TEST
             DID NOT NOTICE, because the self-test exercised the JUDGEMENT with
             synthetic numbers and never the SENSOR. It reported 7 eyes on the
             elephant (tusks and toenails: bright beside dark) and 0 on the wolf,
             lion, tiger, cat and dragonfly (a 2px stride steps straight over a
             1-2px catchlight).

             What actually distinguishes an eye is not "bright next to dark" —
             a tusk edge is that. It is bright ENCLOSED BY dark: a catchlight
             sits inside a pupil, so the dark surrounds it on most sides. A
             tusk or a claw has dark on one side only. Sample a ring of eight
             directions and require most of them dark. Stride 1, because the
             feature we are hunting is two pixels wide. */
          /* ⚠ AND THE FIRST ENCLOSURE TEST WAS ALSO WRONG — it made things WORSE
             (192 → 300 false "no eye"). The structure of every eye here is
             sclera → pupil → catchlight, three concentric discs. A fixed 4px
             ring around the catchlight of a SMALL eye lands back outside the
             pupil, in the bright sclera, so enclosure failed on exactly the
             eyes it was written to find. The ring has to be smaller than the
             pupil, and the pupil scales with the animal. So: try SEVERAL radii
             and accept if any one of them shows the catchlight enclosed. */
          const eyePx: Array<[number, number]> = [];
          const RINGS = [2, 3, 5, 8];
          for (let y = y0; y <= y1; y++) {
            for (let x = x0; x <= x1; x++) {
              if (lum((y * 440 + x) * 4) < 198) continue;
              let enclosed = false;
              for (const R of RINGS) {
                const q = Math.round(R * 0.7071);
                const dirs: Array<[number, number]> = [[R, 0], [-R, 0], [0, R], [0, -R],
                  [q, q], [q, -q], [-q, q], [-q, -q]];
                let dark = 0;
                for (const [dx, dy] of dirs) {
                  const yy = y + dy, xx = x + dx;
                  if (yy < 0 || yy > 439 || xx < 0 || xx > 439) { dark++; continue; }
                  if (lum((yy * 440 + xx) * 4) < 70) dark++;
                }
                if (dark >= 6) { enclosed = true; break; }
              }
              if (enclosed) eyePx.push([x, y]);
            }
          }
          /* cluster them so one eye is one finding, not forty pixels */
          const clusters: Array<{ x: number; y: number; n: number }> = [];
          for (const [x, y] of eyePx) {
            const c2 = clusters.find((k) => Math.abs(k.x / k.n - x) < 12 && Math.abs(k.y / k.n - y) < 12);
            if (c2) { c2.x += x; c2.y += y; c2.n++; } else clusters.push({ x, y, n: 1 });
          }
          /* a real catchlight is a few pixels; one stray pixel is noise and a hundred
             is a highlight on a flank, so the cluster must be eye-SIZED */
          /* ⚠ n >= 3 REJECTED REAL EYES. A catchlight on a mid-sized head is about two
             pixels across, so after the enclosure test only ONE pixel may survive.
             Requiring three found the lion and missed the wolf. One enclosed
             bright pixel IS the signature — nothing else in this palette makes
             bright-surrounded-by-dark, because the pattern law forbids hard
             edges everywhere else. The upper bound still rejects a lit flank. */
          const real = clusters.filter((k) => k.n >= 1 && k.n <= 260);
          /* where along the long axis do the eyes sit? 0 = left end, 1 = right.
             This is how we find WHICH END IS THE HEAD without guessing that
             every painter faces the same way — several do not. */
          const eyeU = real.length
            ? real.reduce((a, k) => a + (k.x / k.n - x0) / w, 0) / real.length
            : -1;

          rows.push({
            name, w, h,
            aspect: Math.round((w / h) * 1000) / 1000,
            lobe: Math.round((lobe / trunk) * 1000) / 1000,
            eyes: real.length,
            eyeU: Math.round(eyeU * 1000) / 1000,
          });
        }
        res();
      };
      im.onerror = () => res();
      im.src = url!;
    });
    if (i % 40 === 0) { say(`proportions ${kingdom}: ${i}/${pool.length}`); await new Promise((r) => setTimeout(r, 0)); }
  }
  say(`proportions ${kingdom}: ${rows.length} measured`);
  (window as unknown as Record<string, unknown>).__CF_PROP__ = { done: true, kingdom, rows };
}

async function run(): Promise<void> {
  const pq = new URLSearchParams(location.search).get('prop');
  if (pq) { await proportions(pq); return; }
  const sp = new URLSearchParams(location.search).get('strip');
  if (sp) { await strip(sp.split(',')); return; }
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

  /* ★ THE ART LOCK FINGERPRINT (arc stage 3 wave 4, on Nick's instruction:
     "put a safety net in there so that, as we're iterating, it's not messing
     up what we did before").

     Three global arithmetic passes in this arc turned a good elephant bad and
     made 127 animals the same shape, and NOTHING CAUGHT IT — every gate the
     project had asks a question about one asset in isolation ("did it paint?
     is it a byte-duplicate? does it fit the frame?"), and all of them stay
     green while the whole catalogue quietly drifts. What was missing is a
     record of what each species ALREADY LOOKED LIKE when it was signed off.

     So every portrait gets a 16x16 luminance fingerprint here, and
     tools/artlock.mjs diffs the whole catalogue against a blessed baseline.
     It does not forbid change — it makes change COUNTABLE, so a two-species
     edit that moved four hundred animals cannot be mistaken for a two-species
     edit. The same grid answers the other half: how far apart two species
     actually look, which is the only way to see "they all became the wolf". */
  const FP = 16;
  const fcv = document.createElement('canvas');
  fcv.width = FP; fcv.height = FP;
  const fg = fcv.getContext('2d', { willReadFrequently: true })!;
  const fingerprints: Record<string, string> = {};
  /* ⚠ THE FIRST FINGERPRINT WAS LUMINANCE ONLY, and it reported 571 of 1,014
     Earth species as look-alikes — because a grey silhouette on a dark field
     says almost nothing about a species. Colour is most of what separates a
     robin from a lark. The signature is the full RGB grid, base64'd so the
     lock file stays a megabyte rather than six. */
  const fingerprint = (im: HTMLImageElement): string => {
    fg.clearRect(0, 0, FP, FP);
    fg.drawImage(im, 0, 0, FP, FP);
    const d = fg.getImageData(0, 0, FP, FP).data;
    let bin = '';
    for (let i = 0; i < FP * FP; i++) {
      const a = d[i * 4 + 3]! / 255;
      bin += String.fromCharCode(Math.round(d[i * 4]! * a), Math.round(d[i * 4 + 1]! * a), Math.round(d[i * 4 + 2]! * a));
    }
    return btoa(bin);
  };

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
        /* keyed on sheet+name ALONE this dropped 120 of 1,254 assets on the
           floor: two procedural kingdoms whose labels begin with the same
           letter produce the same cell name, so half the procedural set
           silently overwrote the other half and the lock covered neither.
           The index disambiguates. (PROCESS_LAWS round 9: a key collision
           is a green-but-wrong state, and it looks exactly like a pass.) */
        fingerprints[sh.key + '|' + cell.name + (sh.key === 'procedural' ? '#' + i : '')] = fingerprint(im);
      } else { g.fillStyle = '#5a1f1f'; g.fillRect(x + 2, y + 2, C - 4, C - 4); g.fillStyle = '#070a12'; }
      g.fillStyle = '#8fa3c4'; g.font = '8px system-ui'; g.textAlign = 'center';
      g.fillText(cell.name.slice(0, 18), x + C / 2, y + C + 9);
      if (i % 60 === 0) { say(`sheet ${sh.key}: ${i}/${sh.cells.length}`); await new Promise((r) => setTimeout(r, 0)); }
    }
    sheetUrls[sh.key] = cv.toDataURL('image/png');
  }
  (window as unknown as { __CF_FULL__: { done: boolean } }).__CF_FULL__.done = true;
  /* ★ THE DUPLICATE SENTINEL (Nick's Blocker 3, made permanent): two
     DIFFERENTLY-NAMED Earth species must never render identical pixels.
     Hash every Earth portrait; any collision fails the audit by name. */
  const seen = new Map<string, string>();
  const dupes: string[] = [];
  for (const sh of sheets) {
    if (!sh.key.startsWith('earth-')) continue;
    for (const cell of sh.cells) {
      if (!cell.url) continue;
      let h = 0x811C9DC5;
      for (let i = 0; i < cell.url.length; i += 7) h = Math.imul(h ^ cell.url.charCodeAt(i), 0x01000193) >>> 0;
      const key = sh.key + ':' + h.toString(16) + ':' + cell.url.length;
      const prev = seen.get(key);
      if (prev && prev !== cell.name) dupes.push(prev + ' = ' + cell.name);
      else seen.set(key, cell.name);
    }
  }
  say(`DONE — ${ok}/${total} painted, ${fails.length} failures, ${dupes.length} duplicate pairs, ${new Set(CLIPPED).size} clipped`);
  /* ★ THE CLIP SENTINEL (Nick 2026-08-01: "make sure the noses and everything
     fit within the frame … go back and check that on ALL the artwork"). The
     fit pass records any subject whose ink reached the oversized layer's own
     edge — i.e. cut at DRAW time, which no fitting can undo. Must stay empty. */
  const clipped = [...new Set(CLIPPED)];
  (window as unknown as Record<string, unknown>).__CF_AUDIT__ = { done: true, total, ok, fails, dupes, clipped, sheetUrls };
  (window as unknown as Record<string, unknown>).__CF_FINGERPRINTS__ = fingerprints;
}
void run();
