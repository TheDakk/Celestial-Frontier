import { fileURLToPath } from 'node:url';
import { readRepoFiles } from './tracked-files.mjs';

const MEDIA = /\.(png|jpe?g|gif|webp|mp4|mov|psd|svg|bmp|ico|tiff?|avif|heic|webm|pdf|zip)$/i;
const DOCUMENT = /\.(md|markdown|mdx|rst|docx)$/i;
const ALLOWED_DOCS = new Set(['README.md', 'CLAUDE.md', 'AGENTS.md']);
// Character classes keep this source free of the literal text it forbids.
const HOME_PATTERNS = [
  /[/]Users[/]/,
  // a name character must follow, so the bare word "home" and "/home/" alone stay allowed
  /[/]home[/][\w.-]/,
  // one or more backslashes between segments also catches the escaped form in JS/JSON source
  /\b[a-z]:[\\]+users[\\]+/i,
];
// A local part, "@", then dotted labels ending in a letters-only top-level label. Scoped
// package names (@scope/name) and version specifiers (name@1.2.3) never match.
const EMAIL = /[\w.%+-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}\b/i;

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
 * One message per violation; empty when the tree is clean. Every file's text is scanned, binary files too.
 * `denyWords` are private words (e.g. from CF_DENY_WORDS) matched case-insensitively as whole words.
 */
export function checkTrackedFiles(files, denyWords = []) {
  const deny = denyMatchers(denyWords);
  const problems = [];
  for (const { path, text } of files) {
    if (MEDIA.test(path)) problems.push(`${path}: image or media file on the code branch`);
    if (DOCUMENT.test(path) && !ALLOWED_DOCS.has(path)) problems.push(`${path}: document on the code branch`);
    if (HOME_PATTERNS.some((re) => re.test(text))) problems.push(`${path}: home-directory path`);
    if (EMAIL.test(text)) problems.push(`${path}: email address`);
    if (deny.some((re) => re.test(text))) problems.push(`${path}: denied word`);
  }
  return problems;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const problems = checkTrackedFiles(readRepoFiles(), parseDenyWords(process.env.CF_DENY_WORDS));
  for (const p of problems) console.error(p);
  if (problems.length > 0) process.exit(1);
  console.log('clean-branch check: ok');
}
