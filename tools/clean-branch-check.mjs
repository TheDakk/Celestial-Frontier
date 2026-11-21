import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const MEDIA = /\.(png|jpe?g|gif|webp|mp4|mov|psd)$/i;
const ALLOWED_DOCS = new Set(['README.md', 'CLAUDE.md', 'AGENTS.md']);
// Character classes keep this source free of the literal text it forbids.
const HOME_PATTERNS = [/[/]Users[/]/, /[/]home[/][^/\s]+[/]/, /C:[\\]Users[\\]/];

function escapeRegExp(word) {
  return word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Whole-word, case-insensitive matchers for each non-empty word. */
function denyMatchers(denyWords) {
  return denyWords
    .map((w) => w.trim())
    .filter(Boolean)
    .map((w) => new RegExp(`(?<![\\p{L}\\p{N}_])${escapeRegExp(w)}(?![\\p{L}\\p{N}_])`, 'iu'));
}

/** Comma-separated deny words from an environment value; empty when unset. */
export function parseDenyWords(value) {
  return (value ?? '').split(',');
}

/**
 * One message per violation; empty when the tree is clean. `text` is null for binary files.
 * `denyWords` are private words (e.g. from CF_DENY_WORDS) matched case-insensitively as whole words.
 */
export function checkTrackedFiles(files, denyWords = []) {
  const deny = denyMatchers(denyWords);
  const problems = [];
  for (const { path, text } of files) {
    if (MEDIA.test(path)) problems.push(`${path}: image or media file on the code branch`);
    if (/\.md$/i.test(path) && !ALLOWED_DOCS.has(path)) problems.push(`${path}: document on the code branch`);
    if (text !== null && HOME_PATTERNS.some((re) => re.test(text))) problems.push(`${path}: home-directory path`);
    if (text !== null && deny.some((re) => re.test(text))) problems.push(`${path}: denied word`);
  }
  return problems;
}

function readTracked() {
  const paths = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
  return paths.map((path) => {
    const buf = readFileSync(path);
    return { path, text: buf.includes(0) ? null : buf.toString('utf8') };
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const problems = checkTrackedFiles(readTracked(), parseDenyWords(process.env.CF_DENY_WORDS));
  for (const p of problems) console.error(p);
  if (problems.length > 0) process.exit(1);
  console.log('clean-branch check: ok');
}
