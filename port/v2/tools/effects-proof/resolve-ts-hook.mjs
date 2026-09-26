// Module resolution hook: the game sources import siblings as './name.js' (bundler style)
// while living as .ts files. Node's native type stripping needs the real path, so map
// a missing .js sibling to its .ts twin. Registered only by sequence-sheet.mjs (sync hook; the
// async register() path on Node 20 receives the same function).
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && specifier.endsWith('.js') && context.parentURL?.startsWith('file:')) {
    const target = new URL(specifier, context.parentURL);
    if (!existsSync(fileURLToPath(target))) {
      const ts = new URL(specifier.slice(0, -3) + '.ts', context.parentURL);
      if (existsSync(fileURLToPath(ts))) return nextResolve(ts.href, context);
    }
  }
  return nextResolve(specifier, context);
}
