/* deadcode.js — defunct-code audit for Celestial Frontier (v1.7 hygiene pass).
 *
 * Finds JS symbols DECLARED in main.js but never referenced anywhere else, and
 * CSS classes/ids styled in the <style> block but never used in markup or JS.
 * This is an AUDIT (a candidate list for human review), not a gate: dynamic
 * access (window[name], string-built ids, event names) can hide real uses, so
 * every candidate must be verified by hand before removal.
 *
 * References are counted across: main.js itself, the html's non-script parts
 * (markup + CSS), tools/probe-names.json (fingerprint probes — removing a
 * probed symbol breaks fp!), tools/smoke.js, tools/uilayout.js,
 * tools/biome-audit.js, and every proof-sheet spec in tools/sheets/ (lift
 * lists reference symbols by name).
 *
 * Usage: node tools/deadcode.js [--css] [--min-refs N]
 */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const mainSrc = fs.readFileSync(path.join(ROOT, 'main.js'), 'utf8');
const htmlSrc = fs.readFileSync(path.join(ROOT, 'celestial-frontier.html'), 'utf8');

/* html minus its main <script> body (the script is main.js; we want markup+CSS only) */
const scriptStart = htmlSrc.indexOf('<script>');
const scriptEnd = htmlSrc.lastIndexOf('</script>');
const htmlShell = scriptStart >= 0 && scriptEnd > scriptStart
  ? htmlSrc.slice(0, scriptStart) + htmlSrc.slice(scriptEnd)
  : htmlSrc;

/* external reference corpora: EVERY tool + probe list + proof sheet (checks
   like coloratlas-check.js and biomeprofile-check.js lift symbols by name) */
const extra = [];
const addDir = (dir) => {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) { if (f !== 'node_modules' && f !== 'refactor') addDir(p); continue; }
    if ((f.endsWith('.js') || f.endsWith('.json')) && f !== 'deadcode.js' && !f.startsWith('simreport') && !f.startsWith('beta'))
      extra.push(fs.readFileSync(p, 'utf8'));
  }
};
addDir(__dirname);
const extraSrc = extra.join('\n');

/* ---- collect declarations ---------------------------------------------- */
/* function NAME( … ) — includes module-internal helpers */
const decls = new Map(); // name -> {kind, line}
const lineOf = (idx) => mainSrc.slice(0, idx).split('\n').length;

let m;
const fnRe = /(?:^|\n)\s*function\s+([A-Za-z_$][\w$]*)\s*\(/g;
while ((m = fnRe.exec(mainSrc))) {
  if (!decls.has(m[1])) decls.set(m[1], { kind: 'function', line: lineOf(m.index + m[0].indexOf('function')) });
}
/* const/let NAME = at line start (top-of-scope bindings; skips destructuring) */
const varRe = /(?:^|\n)\s*(const|let)\s+([A-Za-z_$][\w$]*)\s*=/g;
while ((m = varRe.exec(mainSrc))) {
  if (!decls.has(m[2])) decls.set(m[2], { kind: m[1], line: lineOf(m.index + m[0].indexOf(m[1])) });
}

/* ---- count references --------------------------------------------------- */
const IGNORE = new Set(['i', 'j', 'k', 'x', 'y', 'n', 'm', 's', 't', 'v', 'w', 'h', 'r', 'g', 'b', 'a', 'c', 'd', 'e', 'f', 'p', 'q', 'o', 'u', 'l', '_']);
const results = [];
for (const [name, info] of decls) {
  if (IGNORE.has(name) || name.length < 3) continue; // short locals: too noisy, never worth purging blind
  const re = new RegExp('\\b' + name.replace(/\$/g, '\\$') + '\\b', 'g');
  const inMain = (mainSrc.match(re) || []).length;
  const inShell = (htmlShell.match(re) || []).length;
  const inExtra = (extraSrc.match(re) || []).length;
  /* a function declaration mentions its own name once; const NAME = once.
     inMain===1 means the declaration is the ONLY mention anywhere in the game. */
  results.push({ name, ...info, inMain, inShell, inExtra, total: inMain + inShell + inExtra });
}

const minRefs = (() => { const i = process.argv.indexOf('--min-refs'); return i > 0 ? +process.argv[i + 1] : 1; })();
const dead = results.filter(r => r.inMain <= minRefs && r.inShell === 0)
  .sort((a, b) => a.line - b.line);

console.log('=== JS symbols declared in main.js with no other in-game reference ===');
console.log('(inMain counts include the declaration itself; inExtra = tests/probes/sheets)');
for (const r of dead) {
  console.log(
    String(r.line).padStart(6) + '  ' + r.kind.padEnd(8) + ' ' + r.name.padEnd(34) +
    ' main:' + r.inMain + ' shell:' + r.inShell + ' tools:' + r.inExtra +
    (r.inExtra > 0 ? '   ← REFERENCED BY TOOLING (check probes!)' : ''));
}
console.log(dead.length + ' candidates (' + results.length + ' symbols scanned)');

/* ---- unused CSS --------------------------------------------------------- */
if (process.argv.includes('--css')) {
  console.log('\n=== CSS classes styled but never used in markup or JS strings ===');
  const styleM = htmlSrc.match(/<style>([\s\S]*?)<\/style>/);
  const css = styleM ? styleM[1] : '';
  const classRe = /\.([A-Za-z_-][\w-]*)/g;
  const classes = new Set();
  let cm;
  while ((cm = classRe.exec(css))) classes.add(cm[1]);
  const corpus = mainSrc + htmlShell.replace(/<style>[\s\S]*?<\/style>/, '');
  let deadCss = 0;
  for (const cls of [...classes].sort()) {
    if (/^\d/.test(cls)) continue;
    /* look for the class used: class="… cls …", classList ops, querySelector('.cls'), string concat */
    const useRe = new RegExp('[\'"\\s.]' + cls.replace(/[-]/g, '\\-') + '[\'"\\s,)\\]:]');
    if (!useRe.test(corpus)) { console.log('  .' + cls); deadCss++; }
  }
  console.log(deadCss + ' unused CSS class candidates (verify: dynamic class strings can hide uses)');
}
