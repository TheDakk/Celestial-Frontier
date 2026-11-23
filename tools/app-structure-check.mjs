import { posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readRepoFiles } from './tracked-files.mjs';
import { importedSpecifiers, scanCode } from './scan-code.mjs';

export const LINE_LIMIT = 500;
const APP_FILE = /^apps\/.*\.(?:ts|mts|mjs|js|css|html)$/;
const GAME_SRC = 'apps/game/src/';
const SCRIPT = /\.(?:ts|mts|mjs|js)$/;
// The game's systems are the folders directly under its src/. Every file may import these two systems and
// these two files; the rest of a system is reached only by the composition root and the screens, through
// the system's index.
const SHARED_SYSTEMS = new Set(['platform', 'ui']);
const SHARED_FILES = new Set(['bus', 'events']);
// The composition roots: the game's page and the page of the layout check.
const ROOTS = new Set(['main.ts', 'layout-main.ts']);
const INDEX = /^index(?:\.(?:ts|mts|mjs|js))?$/;

/** The number of lines in `text`; a final line ending starts no new line. */
function lineCount(text) {
  if (text === '') return 0;
  const breaks = text.split('\n').length - 1;
  return text.endsWith('\n') ? breaks : breaks + 1;
}

const withoutExtension = (name) => name.replace(SCRIPT, '');

function boundsProblems(path, text) {
  const from = path.slice(GAME_SRC.length).split('/');
  const own = from.length === 1 ? null : from[0];
  const joins = own === 'screens' || (own === null && ROOTS.has(from[0]));
  const problems = new Set();
  for (const spec of importedSpecifiers(scanCode(text).kept)) {
    if (!spec.startsWith('./') && !spec.startsWith('../')) continue;
    const target = posix.normalize(posix.join(posix.dirname(path), spec));
    if (!target.startsWith(GAME_SRC)) continue;
    const [first, ...inner] = target.slice(GAME_SRC.length).split('/');
    // A single name directly under src/ is the bus, the events, or a system folder named for its index.
    const system = inner.length === 0 ? withoutExtension(first) : first;
    if (inner.length === 0 && SHARED_FILES.has(system)) continue;
    if (system === own || SHARED_SYSTEMS.has(system)) continue;
    if (!joins) problems.add(`${path}: imports ${spec} from another system (${system})`);
    else if (inner.length > 1 || (inner.length === 1 && !INDEX.test(inner[0]))) {
      problems.add(`${path}: imports ${spec}, an inner file of another system (${system}); only its index may be imported`);
    }
  }
  return [...problems];
}

/** One message per violation; empty when the tree is clean. No ts, mts, mjs, js, css or html file under apps/
 *  has more than LINE_LIMIT lines. A script under apps/game/src/ imports, of that folder, only its own system
 *  folder, bus, events, platform/ and ui/; main.ts, layout-main.ts and screens/ may also import any other system,
 *  by its index only. Imports that leave apps/game/src/, and packages, are not this check's concern. */
export function checkAppStructure(files) {
  const problems = [];
  for (const { path, text } of files) {
    if (!APP_FILE.test(path)) continue;
    const count = lineCount(text);
    if (count > LINE_LIMIT) problems.push(`${path}: ${count} lines, over the limit of ${LINE_LIMIT}`);
    if (path.startsWith(GAME_SRC) && SCRIPT.test(path)) problems.push(...boundsProblems(path, text));
  }
  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const problems = checkAppStructure(readRepoFiles((path) => path.startsWith('apps/')));
  for (const p of problems) console.error(p);
  if (problems.length > 0) process.exit(1);
  console.log('app structure check: ok');
}
