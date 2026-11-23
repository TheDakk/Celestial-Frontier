// Records the golden hashes of the map pictures into fixtures/art/space-v1.json: the universe about home, the home
// galaxy, the home galaxy about Sol and the Sol system, each at two screen sizes, painted with the placeholder sheet.
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

const { NAV_HOME, enterGalaxy, enterSystem, reachRadiusOf, resolveCF1Galaxy, resolveCF1Star } = await import('@cf/scene');
const { HOME_GAL_SEED, HOME_POS, SOL_POS, SOL_SEED } = await import('@cf/domain-worldconfig');
const { hashBuffer } = await import('@cf/art-compose');
const { parseInterfaceSheet } = await import('@cf/art-interface');
const { testInterfaceSheetText } = await import('@cf/art-testparts');
const { descentCamera } = await import('../apps/game/src/space/camera.ts');
const { mapPicture } = await import('../apps/game/src/space/project.ts');

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
const lines = [];
for (const [label, place, camera, time, epoch] of SCENES) {
  for (const { w, h, dpr } of VIEWS) {
    const frame = { place, cam: camera(Math.min(w, h)), view: { w, h }, dpr, time, epoch, reach, charts: true };
    const gaps = { glyphs: [], icons: [], elements: [] };
    const picture = mapPicture({ ...frame, nav: NAVS[place] }, sheet, gaps);
    lines.push('    ' + JSON.stringify({ label: `${label}, ${w} by ${h} at ${dpr}`, ...frame, w: picture.w, h: picture.h, scale: picture.scale, hash: hashBuffer(picture), gaps: gaps.elements }));
  }
}

const text = `{\n  "sheet": "art-testparts",\n  "entries": [\n${lines.join(',\n')}\n  ]\n}\n`;
const out = new URL('../fixtures/art/space-v1.json', import.meta.url);
mkdirSync(fileURLToPath(new URL('./', out)), { recursive: true });
writeFileSync(out, text);
console.log(`recorded ${lines.length} map pictures`);
