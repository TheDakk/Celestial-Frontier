// One-off TS scripts under `node --experimental-strip-types`: the app's `./x.js` imports resolve to `./x.ts` when no
// `.js` exists (the same rewrite vitest/rolldown perform). Use: node --experimental-strip-types --import ./tools/ts-resolve-hook.mjs script.mjs
import { register } from 'node:module';
register('data:text/javascript,' + encodeURIComponent(`
import { existsSync } from 'node:fs'; import { fileURLToPath } from 'node:url';
export async function resolve(specifier, context, next) {
  if (/^\\.{1,2}\\//.test(specifier) && specifier.endsWith('.js') && context.parentURL?.startsWith('file:')) {
    const js = new URL(specifier, context.parentURL);
    if (!existsSync(fileURLToPath(js))) { const ts = new URL(specifier.slice(0, -3) + '.ts', context.parentURL); if (existsSync(fileURLToPath(ts))) return next(ts.href, context); }
  }
  return next(specifier, context);
}`), import.meta.url);
