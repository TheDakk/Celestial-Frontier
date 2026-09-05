import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

/** Read-only build consumer: use the browser's parsed document, not text which
 * could mistake a comment, script, or template for the emitted head marker. */
export function readBuiltGameMode(distDir) {
  const indexPath = resolve(distDir, 'index.html');
  const source = readFileSync(indexPath, 'utf8');
  // Source-only tools and early CLI rejection do not need an HTML runtime.
  // Keep browser-equivalent parsing synchronous, but load it only on use.
  const { JSDOM } = createRequire(import.meta.url)('jsdom');
  const dom = new JSDOM(source);
  try {
    const { document } = dom.window;
    const markers = [...document.querySelectorAll('meta[name="cf-build-mode"]')];
    const marker = markers[0];
    if (markers.length !== 1 || marker.parentElement !== document.head) {
      throw new Error(`Expected exactly one cf-build-mode marker in the built document head: ${indexPath}`);
    }
    const mode = marker.getAttribute('content');
    if (mode !== 'evidence' && mode !== 'distributable') {
      throw new Error(`Invalid cf-build-mode ${JSON.stringify(mode)}: ${indexPath}`);
    }
    return mode;
  } finally {
    dom.window.close();
  }
}

export function assertBuiltGameMode(distDir, expectedMode) {
  if (expectedMode !== 'evidence' && expectedMode !== 'distributable') {
    throw new Error(`Invalid expected game build mode ${JSON.stringify(expectedMode)}`);
  }
  const actualMode = readBuiltGameMode(distDir);
  if (actualMode !== expectedMode) {
    throw new Error(`Expected ${expectedMode} game build; found ${actualMode}: ${resolve(distDir, 'index.html')}`);
  }
  return actualMode;
}
