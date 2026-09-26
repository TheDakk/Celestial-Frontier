import { expect, test } from 'vitest';
import fs from 'node:fs';
import { kitRuntimeAssets } from '../apps/game/kit-runtime-assets.js';

test('built worker carries its exact creature helper; an omitted or changed helper fails', () => {
  const plugin = kitRuntimeAssets(), emitted: Array<{ fileName?: string; source?: string | Uint8Array }> = [];
  const hook = plugin.generateBundle;
  if (typeof hook !== 'function') throw Error('Missing build hook');
  hook.call({ emitFile: (file: typeof emitted[number]) => { emitted.push(file); return String(emitted.length); }, warn: () => {} } as never, {} as never, {} as never, false);
  const source = fs.readFileSync(new URL('../../../tools/local-image-generation/creature-finish-math.mjs', import.meta.url));
  const accept = (assets: typeof emitted) => {
    const matches = assets.filter(a => a.fileName === '__local_ai/creature-finish-math.mjs');
    expect(matches).toHaveLength(1);
    expect(Buffer.from(matches[0]!.source!)).toEqual(source);
  };
  accept(emitted);
  expect(() => accept(emitted.filter(a => a.fileName !== '__local_ai/creature-finish-math.mjs'))).toThrow();
  expect(() => accept(emitted.map(a => a.fileName === '__local_ai/creature-finish-math.mjs' ? { ...a, source: 'wrong helper' } : a))).toThrow();
  accept(emitted);
});
