// Adds @section banners above each unwrapped app section, locating each
// section's first statement by its (unique) original source line. Also inserts
// the architecture table of contents right after the script's IIFE preamble.
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const modules = JSON.parse(fs.readFileSync(path.join(__dirname, 'modules.json'), 'utf8'));
const analysis = JSON.parse(fs.readFileSync(path.join(__dirname, 'analysis.json'), 'utf8'));
const orig = fs.readFileSync(path.join(root, 'main.js.bak'), 'utf8').split('\n');
let cur = fs.readFileSync(path.join(root, 'main.js'), 'utf8');

const TITLES = {
  'ui-dom':       'cached DOM element handles',
  'ui-hud':       'trail breadcrumb, hover hints & pick/lock view state',
  'viewport':     'canvas sizing, DPR cap (3) & topbar height sync (--topbar-h/--row1-h)',
  'art-tiles':    'surface-mode terrain tile cache (per-frame render budget)',
  'state-camera': 'THE shared view state `st` + camera accessor & zoom limits',
  'input':        'pointer/touch/wheel input — drag, pinch zoom, double-tap, hover',
  'transitions':  'zoom-driven mode transitions (universe ⇄ galaxy ⇄ system ⇄ surface)',
  'ui-panel':     'survey-card panel — render, lock, bookmark row, actions',
  'atlas':        'Star Atlas — bookmarks, favorites & the home marker',
  'compendium':   'Compendium — discovered-species catalogue, reveal queue, cosmic epoch',
  'nav':          'goTo() — travel to any saved, searched or shared location',
  'newgame':      'new-expedition setup (the Sol/Earth opening)',
  'player-state': 'shared expedition state — custom names, seen-sets, counters, flags',
  'notify':       'toasts + the bell notification tray (capped at 60)',
  'audio':        'Web Audio stings & tones; sound/effects/shake settings flags',
  'progression':  'ranks & achievements',
  'share':        'CF1- share codes, the share box & renaming',
  'search':       'search box — discoveries and pasted CF1-/CFB- codes',
  'beacon':       "Traveler's Beacon — a fresh random destination every 5 minutes",
  'duel-ui':      'duel UI — code loader, side cards & fight flow (CFB- codes)',
  'economy':      'stardust economy — conquered-worlds map, essence, breeding odds',
  'husbandry':    'breeding & feeding rules (both parents consumed; feeding is fauna-only)',
  'ui-picker':    'breed/feed/heal specimen picker modal',
  'player':       'player battle stats (pstats), HP pool, eating flora, death',
  'guide':        "Pathfinder's Primer (help) wiring",
  'conquest':     'planetary conquest & the hourly stardust harvest',
  'prime':        'Prime Codex — 9 Signatures, frontier regions & endings',
  'naming-ui':    'explorer & species naming modal',
  'settings':     'settings panel — text size, sound, effects, shake, notifications, reset',
  'events':       'Cosmic Events — timed rare-event feed',
  'ui-stats':     'expedition stats panel',
  'bootstrap':    'boot — restore the save (or open the intro) and start the frame loop',
};

let added = 0;
for (const m of modules) {
  if (analysis[m.name] && analysis[m.name].wrapped) continue;
  const title = TITLES[m.name];
  if (!title) { console.error('no title for ' + m.name); process.exit(1); }
  const firstLine = orig[m.ranges[0][0] - 1];
  const ix = cur.indexOf('\n' + firstLine + '\n');
  if (ix < 0) { console.error('anchor not found for ' + m.name + ': ' + firstLine.slice(0, 60)); process.exit(1); }
  if (cur.indexOf('\n' + firstLine + '\n', ix + 1) >= 0) { console.error('anchor not unique for ' + m.name); process.exit(1); }
  const owns = (analysis[m.name].decls || []).slice(0, 10).join(', ');
  const banner = '\n/* ----------------------------------------------------------------\n' +
    '   @section ' + m.name + ' [app] — ' + title + '\n' +
    (owns ? '   Owns: ' + owns + (analysis[m.name].decls.length > 10 ? ', …' : '') + '\n' : '') +
    '   ---------------------------------------------------------------- */';
  cur = cur.slice(0, ix) + banner + cur.slice(ix);
  added++;
}

// architecture TOC after the IIFE preamble
const preamble = "'use strict';";
const pix = cur.indexOf(preamble);
const toc = `

/* ====================================================================
   ARCHITECTURE — Celestial Frontier, refactored on SOLID lines (v1.1)

   One file, one IIFE, three strata:

   1. DOMAIN MODULES (@module … [domain]) — pure & deterministic; every
      output derives from seeds. No DOM, no clock, no Math.random().
      Wrapped as revealing-module IIFEs with frozen public APIs:
        Rand → PlanetGen / Naming / WorldConfig / StarCatalog → WorldGen
        SurveyPhrases / SpeciesTraits → Genome → Genetics → Ecology
        EncUtil → Descriptors → CombatCore
   2. ART & SERVICE MODULES (@module … [app]) — deterministic canvas/SVG
      art and self-contained services:
        ThumbArt, GalaxyArt, SpeciesArt, Fx, SaveSystem, Renderer
   3. APP SECTIONS (@section …) — UI, input, shared mutable state and
      wiring. Shared cross-section state stays in plain script scope (a
      module may not own a binding another section reassigns).

   Module banners name each unit's responsibility (SRP), dependencies
   (DIP — wired top-down, domain never reaches into UI), and exported
   API (ISP — everything else is module-private). Extension points are
   data registries (OCP): trait tables, ABILITY_THEMES, GRADE_TIERS,
   REGIONS, SIGS, ACH, EVENT_DEFS, MODE_PAINTERS.

   Hard rule unchanged from v1.0: NEVER let Math.random()/Date.now()
   feed anything in stratum 1, or share codes and cross-device
   determinism break. See CLAUDE.md / HANDOFF.md.
   ==================================================================== */`;
cur = cur.slice(0, pix + preamble.length) + toc + cur.slice(pix + preamble.length);

fs.writeFileSync(path.join(root, 'main.js'), cur);
console.log('added ' + added + ' section banners + architecture TOC');
