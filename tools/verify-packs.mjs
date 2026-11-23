// Checks the art packs present in the ignored art-packs/ folder against packs/manifest.json: the same
// check the game makes on a device. A pack that is absent is not a fault; the game draws its stand-ins.
// Usage: node tools/verify-packs.mjs [--manifest <file>] [--packs <folder>]
import { registerHooks } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REPO_ROOT } from './tracked-files.mjs';

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
// The game's modules import each other without a file extension, which its bundler resolves. Run by
// node alone, a relative specifier that fails is tried again as .ts.
if (isMain) {
  registerHooks({
    resolve(specifier, context, nextResolve) {
      try {
        return nextResolve(specifier, context);
      } catch (error) {
        if (specifier.startsWith('.') && !/\.[a-z]+$/.test(specifier)) return nextResolve(`${specifier}.ts`, context);
        throw error;
      }
    },
  });
}

export const MANIFEST_PATH = join(REPO_ROOT, 'packs', 'manifest.json');
export const PACKS_DIR = join(REPO_ROOT, 'art-packs');

/** Checks every pack of the manifest at `manifestPath` against its file in `packsDir`. `problems` is one
 *  message per fault (an unreadable or malformed manifest, a present pack of the wrong hash or size);
 *  `notes` is one line per pack that is right or absent; `present` are the entries whose file is right. */
export async function verifyPacks({ manifestPath = MANIFEST_PATH, packsDir = PACKS_DIR } = {}) {
  const { parseManifest, checkPackBytes } = await import('../apps/game/src/packs/manifest.ts');
  let manifest;
  try {
    manifest = parseManifest(JSON.parse(readFileSync(manifestPath, 'utf8')));
  } catch (error) {
    return { problems: [`pack manifest: ${String(error.message).replace(/^pack manifest: /, '')}`], notes: [], present: [] };
  }
  const problems = [];
  const notes = [];
  const present = [];
  for (const entry of manifest.packs) {
    const path = join(packsDir, entry.file);
    if (!existsSync(path)) {
      notes.push(`pack ${entry.name}: absent, the stand-ins are used`);
      continue;
    }
    const check = checkPackBytes(entry, new Uint8Array(readFileSync(path)));
    if (check.ok) {
      notes.push(`pack ${entry.name}: ok`);
      present.push(entry);
    } else {
      problems.push(`pack ${entry.name}: ${entry.file} is present with the ${check.reason === 'wrong-hash' ? 'wrong hash' : 'wrong size'}`);
    }
  }
  return { problems, notes, present };
}

if (isMain) {
  const args = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 2) args[argv[i].replace(/^--/, '')] = argv[i + 1];
  const { problems, notes } = await verifyPacks({ manifestPath: args.manifest, packsDir: args.packs });
  for (const note of notes) console.log(note);
  for (const problem of problems) console.error(problem);
  if (problems.length > 0) process.exit(1);
  console.log('verify-packs: ok');
}
