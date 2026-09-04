import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const TRACKED_GAME_HTML = fileURLToPath(
  new URL('../../../celestial-frontier.html', import.meta.url),
);
const SCRIPT_OPEN = '<script>';
const SCRIPT_CLOSE = '</script>';

function occurrences(source: string, needle: string): number {
  return source.split(needle).length - 1;
}

/**
 * Return the unique inline game script exactly as tracked. This deliberately
 * performs no trimming or newline normalization: legacy line numbers, lifted
 * byte seals, and deterministic parity all depend on the original bytes.
 */
export function extractTrackedV1Script(html: string): string {
  const openCount = occurrences(html, SCRIPT_OPEN);
  const closeCount = occurrences(html, SCRIPT_CLOSE);
  if (openCount !== 1 || closeCount !== 1) {
    throw new Error(
      `tracked game HTML must contain exactly one literal script body (open=${openCount}, close=${closeCount})`,
    );
  }
  const start = html.indexOf(SCRIPT_OPEN) + SCRIPT_OPEN.length;
  const end = html.indexOf(SCRIPT_CLOSE, start);
  if (end < start) throw new Error('tracked game HTML script boundaries are reversed');
  const script = html.slice(start, end);
  if (script.trim().length === 0) throw new Error('tracked game HTML script body is empty');
  return script;
}

export type TrackedV1Source = Readonly<{
  html: string;
  script: string;
}>;

export function readTrackedV1Source(): TrackedV1Source {
  const html = readFileSync(TRACKED_GAME_HTML, 'utf8');
  return Object.freeze({ html, script: extractTrackedV1Script(html) });
}
