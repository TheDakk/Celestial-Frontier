/* Resolves the game's `./x.js` specifiers to `./x.ts` sources so Node's native
 * type stripping can run the motion compiler without a build step. */
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { fileURLToPath } from 'node:url';
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && specifier.endsWith('.js') && context.parentURL) {
      const url = new URL(specifier, context.parentURL);
      if (!existsSync(fileURLToPath(url)) && existsSync(fileURLToPath(url).replace(/\.js$/, '.ts'))) return next(specifier.replace(/\.js$/, '.ts'), context);
    }
    return next(specifier, context);
  },
});
