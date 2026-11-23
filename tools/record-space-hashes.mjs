// Records the golden hashes of the map pictures into fixtures/art/space-v1.json: the universe about home, the home
// galaxy, the home galaxy about Sol and the Sol system, each at two screen sizes, painted with the placeholder sheet.
// Then, into fixtures/art/space-v2.json, the same maps with the game's passes on: the web, veil, fog and edge of the
// universe, a tidal bridge, the galaxy haze, the habitable zone, day and night, a cloud deck, a comet, the visitor,
// and what moves, at the same two screen sizes.
// Then, into fixtures/art/space-v3.json, the map as the map screen draws it: everything the size the game gives it at
// the camera's zoom, at a far, an entry and a near zoom of the universe, the home galaxy and the Sol system, with the
// words lettered on each and where they stand on the screen.
// Usage: node tools/record-space-hashes.mjs   (no arguments; reads and writes only inside this repository)
// Re-record only on Dakk's word: the file is the promise that every device draws each map the same.
// Deterministic: running it twice writes a byte-identical file.
import { registerHooks } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// The packages and the app import sibling .ts files without an extension: retry a failed specifier with .ts and /index.ts.
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (!specifier.startsWith('.')) throw error;
      const base = specifier.endsWith('.js') ? specifier.slice(0, -3) : specifier;
      for (const candidate of [base + '.ts', base + '/index.ts']) {
        try {
          return nextResolve(candidate, context);
        } catch {
          // try the next candidate
        }
      }
      throw error;
    }
  },
});

const { NAV_HOME, currentRegionOf, enterGalaxy, enterSystem, reachRadiusOf, resolveCF1Galaxy, resolveCF1Star, systemScene } = await import('@cf/scene');
const { HOME_GAL_SEED, HOME_POS, OBS_R, SOL_POS, SOL_SEED } = await import('@cf/domain-worldconfig');
const { galaxyWormhole } = await import('@cf/domain-worldgen');
const { hashBuffer } = await import('@cf/art-compose');
const { parseInterfaceSheet } = await import('@cf/art-interface');
const { testInterfaceSheetText } = await import('@cf/art-testparts');
const { ascentCamera, descentCamera, toScreen } = await import('../apps/game/src/space/camera.ts');
const { mapPicture } = await import('../apps/game/src/space/project.ts');
const { mapLabels } = await import('../apps/game/src/space/labels.ts');

const galaxy = resolveCF1Galaxy({ seed: HOME_GAL_SEED, x: HOME_POS.x, y: HOME_POS.y });
const homeGalaxy = enterGalaxy(NAV_HOME, galaxy.galaxy);
const sol = enterSystem(homeGalaxy.state, resolveCF1Star(galaxy.galaxy, { seed: SOL_SEED, x: SOL_POS.x, y: SOL_POS.y }).star);
if (!sol.ok) throw new Error('Sol was not entered');
const NAVS = { universe: NAV_HOME, 'home-galaxy': homeGalaxy.state, sol: sol.state };

// A phone held upright and a desktop window: each art pixel covers 4 and 2 screen pixels.
const VIEWS = [{ w: 390, h: 844, dpr: 3 }, { w: 1280, h: 720, dpr: 1 }];
// A new game's charter: no prime signature.
const reach = reachRadiusOf(0);

/** [label, place, camera for a shorter side, time, epoch] in recording order. */
const SCENES = [
  ['the home universe', 'universe', (min) => ({ x: HOME_POS.x, y: HOME_POS.y, z: 0.4 * min / reach }), 0, 0],
  ['the home galaxy', 'home-galaxy', (min) => descentCamera('galaxy', min).to, 0, 0],
  ['the home galaxy at epoch 12', 'home-galaxy', (min) => descentCamera('galaxy', min).to, 0, 12],
  ['the home galaxy about Sol', 'home-galaxy', (min) => ({ x: SOL_POS.x, y: SOL_POS.y, z: min / 200 }), 0, 0],
  ['the Sol system', 'sol', (min) => descentCamera('system', min).to, 0, 0],
  ['the Sol system after ten minutes', 'sol', (min) => descentCamera('system', min).to, 600, 0],
];

const sheet = parseInterfaceSheet(testInterfaceSheetText());

/** Paints every scene at every view and writes the file. A scene is [label, place, camera for a shorter side, time,
 *  epoch] and, for a map with the game's passes on, the settings they follow. With `sized` the picture is the map
 *  screen's, and the words lettered on it are recorded with it: each with the screen pixel it is held at. */
function record(file, navs, scenes, sized = false) {
  const lines = [];
  for (const [label, place, camera, time, epoch, passes] of scenes) {
    for (const { w, h, dpr } of VIEWS) {
      const frame = { place, cam: camera(Math.min(w, h)), view: { w, h }, dpr, time, epoch, reach, charts: true, ...(passes === undefined ? {} : { passes }), ...(sized ? { sized } : {}) };
      const gaps = { glyphs: [], icons: [], elements: [] };
      const picture = mapPicture({ ...frame, nav: navs[place] }, sheet, gaps);
      const labels = !sized ? {} : { labels: mapLabels({ ...frame, nav: navs[place] }, currentRegionOf(0).name).map(({ text, wx, wy, hold, lift }) => {
        const at = toScreen(frame.cam, frame.view, wx, wy);
        return { text, x: Math.round(at.x), y: Math.round(at.y) - (lift ?? 0), hold };
      }) };
      lines.push('    ' + JSON.stringify({ label: `${label}, ${w} by ${h} at ${dpr}`, ...frame, w: picture.w, h: picture.h, scale: picture.scale, hash: hashBuffer(picture), gaps: gaps.elements, ...labels }));
    }
  }
  const text = `{\n  "sheet": "art-testparts",\n  "entries": [\n${lines.join(',\n')}\n  ]\n}\n`;
  const out = new URL(`../fixtures/art/${file}`, import.meta.url);
  mkdirSync(fileURLToPath(new URL('./', out)), { recursive: true });
  writeFileSync(out, text);
  console.log(`recorded ${lines.length} map pictures in ${file}`);
}

record('space-v1.json', NAVS, SCENES);

// The maps with the game's passes on.
const system = (seed, x, y) => {
  const entered = enterSystem(homeGalaxy.state, resolveCF1Star(galaxy.galaxy, { seed, x, y }).star);
  if (!entered.ok) throw new Error(`the system of star ${seed} was not entered`);
  return entered.state;
};
/** A galaxy of the galaxies fixture's cells that holds a wormhole; a star of the home galaxy with an interstellar
 *  visitor, a pulsar and a magnetar: the places the tests name WORMHOLE_GALAXY, VISITED, PULSAR and MAGNETAR. */
const WORMHOLE_GALAXY = { seed: 1490277435, x: -786.4846107451718, y: -2720.221214309881 };
const wormhole = galaxyWormhole(WORMHOLE_GALAXY.seed);
const NAVS_2 = {
  ...NAVS,
  'wormhole-galaxy': enterGalaxy(NAV_HOME, resolveCF1Galaxy(WORMHOLE_GALAXY).galaxy).state,
  visited: system(1106282818, -897.8339749993756, -258.4198963288218),
  pulsar: system(729068929, -736.7237938377075, 61.177555879577994),
  magnetar: system(2563295997, -718.0755883874372, -258.9377444498241),
};
/** Where a planet of Sol stands at the start of time. */
const planetAt = (pick) => {
  const planet = systemScene(SOL_SEED).planets.find(pick);
  return { x: Math.cos(planet.orb * 0.13) * planet.orb, y: Math.sin(planet.orb * 0.13) * planet.orb };
};
const earth = planetAt((planet) => planet.seed === 133);
const giant = planetAt((planet) => planet.type === 'gas');
/** A galaxy near home that is colliding with a companion: the view is midway between the two. */
const COLLISION = { x: -2184, y: 1739 };
const ON = { effects: true, motion: true };
const STILL = { effects: true, motion: false };
const atHome = (min) => ({ x: HOME_POS.x, y: HOME_POS.y, z: 0.4 * min / reach });
const galaxyEntry = (min) => descentCamera('galaxy', min).to;
const systemEntry = (min) => descentCamera('system', min).to;

const SCENES_2 = [
  ['the home universe: web, veil and fog', 'universe', atHome, 0, 0, ON],
  ['the home universe after 100 seconds: the fog has drifted', 'universe', atHome, 100, 0, ON],
  ['the home universe with motion reduced: fewer fog banks, standing still', 'universe', atHome, 100, 0, STILL],
  ['the home universe with effects off: no fog', 'universe', atHome, 0, 0, { effects: false, motion: true }],
  ['the universe from afar: the web and the edge of the observable universe', 'universe', (min) => ({ x: 0, y: 0, z: 0.45 * min / OBS_R }), 0, 0, ON],
  ['the universe from farther than the charter shows: the edge alone', 'universe', (min) => ({ x: 0, y: 0, z: 0.012 * min / 390 }), 0, 0, ON],
  ['the edge of the observable universe up close', 'universe', (min) => ({ x: 0, y: -OBS_R, z: min / 1500 }), 0, 0, ON],
  ['a colliding pair and its tidal bridge', 'universe', (min) => ({ ...COLLISION, z: min / 220 }), 0, 0, ON],
  ['the home galaxy: haze', 'home-galaxy', galaxyEntry, 0, 0, ON],
  ['the home galaxy after 3.3 seconds: stars twinkle, beams turn, protostars pulse', 'home-galaxy', galaxyEntry, 3.3, 0, ON],
  ['the home galaxy after 3.3 seconds with motion reduced', 'home-galaxy', galaxyEntry, 3.3, 0, STILL],
  ['the home galaxy about Sol: grain', 'home-galaxy', (min) => ({ x: SOL_POS.x, y: SOL_POS.y, z: min / 200 }), 0, 0, ON],
  ['the core of the home galaxy', 'home-galaxy', (min) => ({ x: 60, y: 30, z: min / 400 }), 0, 0, ON],
  ['a wormhole, turned', 'wormhole-galaxy', (min) => ({ x: wormhole.x, y: wormhole.y, z: min / 300 }), 1.5, 0, ON],
  ['the Sol system: habitable zone, comet, day and night', 'sol', systemEntry, 0, 0, ON],
  ['the Sol system after ten seconds: the comet has moved', 'sol', systemEntry, 10, 0, ON],
  ['Earth up close: cloud deck', 'sol', () => ({ ...earth, z: 6 }), 0, 0, ON],
  ['a gas giant of Sol up close: day and night', 'sol', () => ({ ...giant, z: 5 }), 0, 0, ON],
  ['a system with an interstellar visitor', 'visited', (min) => ({ x: 0, y: 0, z: min / 300 }), 5, 0, ON],
  ['a pulsar system, its beams turned', 'pulsar', systemEntry, 0.6, 0, ON],
  ['a magnetar system, its beams turned', 'magnetar', systemEntry, 0.9, 0, ON],
];
record('space-v2.json', NAVS_2, SCENES_2);

// The map as the map screen draws it, sized by the camera, at a far, an entry and a near zoom of each map.
const homeGalaxyNode = { kind: 'galaxy', x: HOME_POS.x, y: HOME_POS.y, size: galaxy.galaxy.size };
/** Galaxies near home: one named once it is near, a quasar and a radio galaxy. */
const NEIGHBOUR = { x: -353.9256348274648, y: 76.0142870247364, size: 63.054942834656686 };
const QUASAR = { x: -3248.226942215115, y: 2709.3011943623424, size: 28.276660196483135 };
const RADIO = { x: 1187.468503601849, y: -2042.271316703409, size: 50.723668528255075 };
const SCENES_3 = [
  ['the universe, far: the whole charter', 'universe', atHome, 0, 0, ON],
  ['the universe, entry: as it is come back to from the home galaxy', 'universe', (min) => ascentCamera(homeGalaxyNode, min).to, 0, 0, ON],
  ['the universe, near: the home galaxy just short of the dive', 'universe', (min) => ({ x: HOME_POS.x, y: HOME_POS.y, z: 0.55 * min / galaxy.galaxy.size * 0.97 }), 0, 0, ON],
  ['the universe, near: a neighbour that has earned its name', 'universe', () => ({ x: NEIGHBOUR.x, y: NEIGHBOUR.y, z: 60 / NEIGHBOUR.size }), 0, 0, ON],
  ['the universe, near: a quasar, told what it is', 'universe', () => ({ x: QUASAR.x, y: QUASAR.y, z: 60 / QUASAR.size }), 0, 0, ON],
  ['the universe, near: a radio galaxy, told what it is', 'universe', () => ({ x: RADIO.x, y: RADIO.y, z: 60 / RADIO.size }), 0, 0, ON],
  ['the home galaxy, far: just short of leaving it', 'home-galaxy', (min) => ({ ...galaxyEntry(min), z: galaxyEntry(min).z * 0.65 }), 0, 0, ON],
  ['the home galaxy, entry', 'home-galaxy', galaxyEntry, 0, 0, ON],
  ['the home galaxy, near: about the Sun just short of the dive', 'home-galaxy', (min) => ({ x: SOL_POS.x, y: SOL_POS.y, z: min / 34 * 0.97 }), 0, 0, ON],
  ['the home galaxy, near: its core', 'home-galaxy', (min) => ({ x: 20, y: 10, z: min / 60 }), 0, 0, ON],
  ['the Sol system, far: just short of leaving it', 'sol', (min) => ({ ...systemEntry(min), z: systemEntry(min).z * 0.65 }), 0, 0, ON],
  ['the Sol system, entry', 'sol', systemEntry, 0, 0, ON],
  ['the Sol system, near: about Earth', 'sol', (min) => ({ ...earth, z: min / 60 }), 0, 0, ON],
  ['the Sol system, near: its star', 'sol', (min) => ({ x: 0, y: 0, z: min / 90 }), 0, 0, ON],
];
record('space-v3.json', NAVS, SCENES_3, true);
