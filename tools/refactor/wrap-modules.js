// Wraps selected line-range modules of main.js into revealing-module IIFEs:
//
//   /* @module <Alias> [<layer>] — title ... */
//   const <Alias>=(()=>{
//     ...original statements, bytes untouched...
//   return Object.freeze({ <exports> });
//   })();
//   const { <exports> } = <Alias>;
//   /* @end <Alias> */
//
// Statement bytes and order are preserved exactly; only banner/wrapper lines
// are inserted. Exports = names referenced outside the module (analysis.json)
// plus names required by the test probe (probe-names.json).
//
// Usage: node tools/wrap-modules.js <module> [<module> ...]   (names from modules.json)
'use strict';
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');
const root = path.join(__dirname, '..');

const src = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
const modules = JSON.parse(fs.readFileSync(path.join(__dirname, 'modules.json'), 'utf8'));
const analysis = JSON.parse(fs.readFileSync(path.join(__dirname, 'analysis.json'), 'utf8'));
const probeNames = JSON.parse(fs.readFileSync(path.join(__dirname, 'probe-names.json'), 'utf8'));
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'wrap-config.json'), 'utf8'));

const wanted = process.argv.slice(2);
for (const w of wanted) {
  if (!modules.find((m) => m.name === w)) { console.error('unknown module: ' + w); process.exit(1); }
  if (!cfg[w]) { console.error('no wrap-config for: ' + w); process.exit(1); }
}

const ast = acorn.parse(src, { ecmaVersion: 2023, locations: true });
const outer = ast.body.find((n) => n.type === 'ExpressionStatement' && n.expression.type === 'CallExpression');
const body = outer.expression.callee.body.body;
function moduleOf(line) {
  for (const m of modules) for (const [a, b] of m.ranges) if (line >= a && line <= b) return m.name;
  return null;
}

const lines = src.split('\n');
// insertions: line index (0-based, insert BEFORE this line) -> [text...]
const inserts = new Map();
function insertBefore(lineIdx, text) {
  if (!inserts.has(lineIdx)) inserts.set(lineIdx, []);
  inserts.get(lineIdx).push(text);
}

for (const name of wanted) {
  const mod = modules.find((m) => m.name === name);
  const info = analysis[name];
  const conf = cfg[name];
  const stmts = body.filter((s) => moduleOf(s.loc.start.line) === name);
  if (!stmts.length) { console.error('no statements for ' + name); process.exit(1); }
  const first = Math.min(...stmts.map((s) => s.loc.start.line));
  const last = Math.max(...stmts.map((s) => s.loc.end.line));

  const exports = [...new Set([
    ...info.exports,
    ...probeNames.filter((p) => info.decls.includes(p)),
  ])];
  const missing = exports.filter((e) => !info.decls.includes(e));
  if (missing.length) { console.error(name + ': exports not declared in module: ' + missing); process.exit(1); }

  const deps = info.deps.map((d) => (cfg[d] && (wanted.includes(d) || analysis[d].wrapped)) ? cfg[d].alias : d);
  const layer = mod.layer;

  // absorb a single-line section comment directly above the first statement
  let headerAt = first - 1; // 0-based index of the first statement line
  const prev = lines[headerAt - 1] ? lines[headerAt - 1].trim() : '';
  if (/^\/\*.*\*\/$/.test(prev) || /^\/\//.test(prev)) headerAt -= 1;

  const exp = exports.join(', ');
  insertBefore(headerAt,
    '/* ================================================================\n' +
    '   @module ' + conf.alias + ' [' + layer + '] — ' + conf.title + '\n' +
    '   Deps: ' + (deps.length ? deps.join(', ') : 'none') + '\n' +
    '   API:  ' + exp + '\n' +
    '   ================================================================ */\n' +
    'const ' + conf.alias + '=(()=>{');
  insertBefore(last, // 0-based index AFTER the last statement line = (last-1)+1 = last
    'return Object.freeze({' + exp + '});\n' +
    '})();\n' +
    'const {' + exp + '}=' + conf.alias + ';\n' +
    '/* @end ' + conf.alias + ' */');
  analysis[name].wrapped = true;
  console.log('wrapped ' + name + ' as ' + conf.alias + '  (lines ' + first + '-' + last + ', ' + exports.length + ' exports)');
}

const out = [];
for (let i = 0; i < lines.length; i++) {
  if (inserts.has(i)) out.push(...inserts.get(i));
  out.push(lines[i]);
}
fs.writeFileSync(path.join(root, 'main.js'), out.join('\n'));
fs.writeFileSync(path.join(__dirname, 'analysis.json'), JSON.stringify(analysis, null, 1));
console.log('main.js rewritten (' + out.length + ' lines, was ' + lines.length + ')');
