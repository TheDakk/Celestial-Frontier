import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import { MANIFEST_PATH, PACKS_DIR, verifyPacks } from '../../tools/verify-packs.mjs';
import type { VerifiedPack } from '../../tools/verify-packs.mjs';

export interface PackPlaces { manifestPath: string; packsDir: string }

/** The packs a build may ship: every present pack that matches the manifest. Throws when a present pack
 *  does not match, or the manifest cannot be read. An absent pack is left to the game's stand-ins. */
export async function packsForBuild(places: PackPlaces): Promise<VerifiedPack[]> {
  const { problems, present } = await verifyPacks(places);
  if (problems.length > 0) throw new Error(`art packs refused:\n${problems.join('\n')}`);
  return present;
}

const PACK_FILE = /^\/([A-Za-z0-9_-][A-Za-z0-9._-]*)$/;

/** Art packs live in the ignored `art-packs/` folder. A build checks them against the manifest and copies
 *  the right ones beside the app; the development server serves the folder at `/art-packs/`. */
export function packs(places: PackPlaces = { manifestPath: MANIFEST_PATH, packsDir: PACKS_DIR }): Plugin {
  let building = false;
  let present: VerifiedPack[] = [];
  return {
    name: 'cf-packs',
    configResolved(config) { building = config.command === 'build'; },
    async buildStart() { if (building) present = await packsForBuild(places); },
    generateBundle() {
      for (const { file } of present) this.emitFile({ type: 'asset', fileName: `art-packs/${file}`, source: readFileSync(join(places.packsDir, file)) });
    },
    configureServer(server) {
      // An absent pack answers 404, never the app's page: the loader must see that it is absent.
      server.middlewares.use('/art-packs', (request, response) => {
        const name = PACK_FILE.exec((request.url ?? '').split('?')[0]!)?.[1];
        const path = name === undefined ? null : join(places.packsDir, name);
        if (path === null || !existsSync(path)) { response.statusCode = 404; response.end(); return; }
        response.setHeader('Content-Type', 'text/plain; charset=utf-8');
        response.setHeader('Cache-Control', 'no-store');
        response.end(readFileSync(path));
      });
    },
  };
}

// The workspace packages ship TypeScript source (their exports point at src/index.ts); Vite compiles them
// in place, as vitest does, so no package has a build step of its own.
// The `layout` mode builds the page of the layout check (`npm run layout`) into its own folder, never the game's.
export default defineConfig(({ mode }) => ({
  plugins: [packs()],
  build: mode === 'layout' ? { target: 'es2022', outDir: 'dist-layout', rollupOptions: { input: 'layout.html' } } : { target: 'es2022' },
}));
