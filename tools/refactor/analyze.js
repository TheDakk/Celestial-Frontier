// Static analysis for the module refactor. Parses main.js (a single IIFE),
// assigns each top-level-in-IIFE statement to a module per modules.json, then
// reports, per module:
//   - declared names and which of them are referenced from other modules
//     (= the module's required exports)
//   - module dependencies (other modules whose names it references)
// and, critically, two classes of wrapping hazards:
//   H1: an identifier evaluated IMMEDIATELY (at script-eval time) whose
//       declaration lives in a LATER module (TDZ break under IIFE wrapping)
//   H2: a `let`/`var` declared in module A but REASSIGNED in module B
//       (a destructured export alias would not propagate the write, so the
//       declaration must stay in shared scope or modules A+B must merge)
//
// Usage: node tools/analyze.js [--map tools/modules.json]
'use strict';
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');
const root = path.join(__dirname, '..');
const mapPath = process.argv.includes('--map')
  ? process.argv[process.argv.indexOf('--map') + 1]
  : path.join(__dirname, 'modules.json');

const src = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
const modules = JSON.parse(fs.readFileSync(mapPath, 'utf8'));

const ast = acorn.parse(src, { ecmaVersion: 2023, locations: true });
// unwrap: Program -> ExpressionStatement -> CallExpression -> Arrow/FunctionExpression -> body.body
const outer = ast.body.find((n) => n.type === 'ExpressionStatement' && n.expression.type === 'CallExpression');
const body = outer.expression.callee.body.body;
console.log('IIFE top-level statements:', body.length);

// --- helpers ---------------------------------------------------------------
function patternNames(node, out) {
  switch (node.type) {
    case 'Identifier': out.push(node.name); break;
    case 'ObjectPattern': node.properties.forEach((p) => patternNames(p.value || p.argument, out)); break;
    case 'ArrayPattern': node.elements.forEach((e) => e && patternNames(e, out)); break;
    case 'AssignmentPattern': patternNames(node.left, out); break;
    case 'RestElement': patternNames(node.argument, out); break;
  }
}
function declaredNames(stmt) {
  const out = [];
  if (stmt.type === 'FunctionDeclaration' || stmt.type === 'ClassDeclaration') out.push(stmt.id.name);
  else if (stmt.type === 'VariableDeclaration') stmt.declarations.forEach((d) => patternNames(d.id, out));
  return out;
}

// generic AST walk
function walk(node, fn, parent) {
  if (!node || typeof node.type !== 'string') return;
  fn(node, parent);
  for (const k of Object.keys(node)) {
    if (k === 'loc' || k === 'start' || k === 'end') continue;
    const v = node[k];
    if (Array.isArray(v)) v.forEach((c) => c && typeof c.type === 'string' && walk(c, fn, node));
    else if (v && typeof v.type === 'string') walk(v, fn, node);
  }
}

// all identifier references in a subtree (excluding declaration ids / keys / labels)
function refIdents(stmtNode) {
  const refs = [];
  walk(stmtNode, (n, parent) => {
    if (n.type !== 'Identifier') return;
    if (!parent) return;
    if (parent.type === 'VariableDeclarator' && parent.id === n) return;
    if ((parent.type === 'FunctionDeclaration' || parent.type === 'FunctionExpression' || parent.type === 'ClassDeclaration') && parent.id === n) return;
    if (parent.type === 'Property' && parent.key === n && !parent.computed && !parent.shorthand) return;
    if (parent.type === 'MemberExpression' && parent.property === n && !parent.computed) return;
    if (parent.type === 'LabeledStatement' || parent.type === 'BreakStatement' || parent.type === 'ContinueStatement') return;
    if (parent.type === 'MethodDefinition' && parent.key === n && !parent.computed) return;
    refs.push(n.name);
  });
  return refs;
}

// identifiers evaluated immediately when the statement runs at script-eval
// time: walk but do NOT descend into function bodies unless the function is
// the callee of an immediately-invoked CallExpression.
function immediateIdents(stmtNode) {
  const refs = [];
  (function go(node, parent) {
    if (!node || typeof node.type !== 'string') return;
    const isFn = node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression' || node.type === 'FunctionDeclaration' || node.type === 'ClassDeclaration';
    if (isFn) {
      const iife = parent && parent.type === 'CallExpression' && parent.callee === node;
      if (!iife) return; // body runs later
    }
    if (node.type === 'Identifier') {
      if (parent) {
        if (parent.type === 'VariableDeclarator' && parent.id === node) return;
        if (parent.type === 'Property' && parent.key === node && !parent.computed && !parent.shorthand) return;
        if (parent.type === 'MemberExpression' && parent.property === node && !parent.computed) return;
      }
      refs.push(node.name);
      return;
    }
    for (const k of Object.keys(node)) {
      if (k === 'loc' || k === 'start' || k === 'end') continue;
      const v = node[k];
      if (Array.isArray(v)) v.forEach((c) => c && typeof c.type === 'string' && go(c, node));
      else if (v && typeof v.type === 'string') go(v, node);
    }
  })(stmtNode, null);
  return refs;
}

// reassignment targets in a subtree
function assignedIdents(stmtNode) {
  const out = [];
  walk(stmtNode, (n) => {
    if (n.type === 'AssignmentExpression' && n.left.type === 'Identifier') out.push(n.left.name);
    if (n.type === 'UpdateExpression' && n.argument.type === 'Identifier') out.push(n.argument.name);
    if (n.type === 'AssignmentExpression' && (n.left.type === 'ObjectPattern' || n.left.type === 'ArrayPattern')) patternNames(n.left, out);
  });
  return out;
}

// --- assign statements to modules -------------------------------------------
function moduleOf(line) {
  for (const m of modules) {
    for (const [a, b] of m.ranges) if (line >= a && line <= b) return m.name;
  }
  return null;
}
const stmts = body.map((s) => ({
  node: s,
  line: s.loc.start.line,
  endLine: s.loc.end.line,
  module: moduleOf(s.loc.start.line),
  decls: declaredNames(s),
}));
const unassigned = stmts.filter((s) => !s.module);
if (unassigned.length) {
  console.log('\nUNASSIGNED statements:');
  unassigned.forEach((s) => console.log('  line ' + s.line + '-' + s.endLine + ': ' + src.split('\n')[s.line - 1].slice(0, 90)));
}
// statements spanning a module boundary?
for (const s of stmts) {
  if (s.module && moduleOf(s.endLine) !== s.module) {
    console.log('BOUNDARY VIOLATION: stmt ' + s.line + '-' + s.endLine + ' starts in ' + s.module + ' ends in ' + moduleOf(s.endLine));
  }
}

// name -> {module, kind, declLine}
const declIndex = new Map();
for (const s of stmts) {
  const kind = s.node.type === 'VariableDeclaration' ? s.node.kind : 'function';
  for (const n of s.decls) declIndex.set(n, { module: s.module, kind, line: s.line });
}

// --- per-module reference analysis ------------------------------------------
const modInfo = new Map(modules.map((m) => [m.name, { ...m, decls: [], externalRefs: new Set(), exportsNeeded: new Set(), deps: new Set() }]));
for (const s of stmts) {
  if (!s.module) continue;
  modInfo.get(s.module).decls.push(...s.decls);
  for (const r of refIdents(s.node)) {
    const d = declIndex.get(r);
    if (d && d.module && d.module !== s.module) {
      modInfo.get(s.module).deps.add(d.module);
      modInfo.get(d.module).exportsNeeded.add(r);
    }
  }
}

// --- hazard H1: immediate forward refs across modules ------------------------
console.log('\n--- H1: immediate cross-module forward references (TDZ breaks) ---');
let h1 = 0;
for (const s of stmts) {
  if (!s.module) continue;
  for (const r of immediateIdents(s.node)) {
    const d = declIndex.get(r);
    if (d && d.module !== s.module && d.line > s.line) {
      console.log('  line ' + s.line + ' [' + s.module + '] immediately uses "' + r + '" declared line ' + d.line + ' [' + d.module + ']');
      h1++;
    }
  }
}
if (!h1) console.log('  none');

// --- hazard H2: cross-module reassignment of let/var -------------------------
console.log('\n--- H2: cross-module reassigned let/var (must live in shared scope) ---');
const h2names = new Map();
for (const s of stmts) {
  if (!s.module) continue;
  for (const a of assignedIdents(s.node)) {
    const d = declIndex.get(a);
    if (d && d.module && d.module !== s.module) {
      if (!h2names.has(a)) h2names.set(a, { declModule: d.module, declLine: d.line, kind: d.kind, writers: new Set() });
      h2names.get(a).writers.add(s.module);
    }
  }
}
for (const [n, info] of h2names) {
  console.log('  "' + n + '" (' + info.kind + ', ' + info.declModule + ':' + info.declLine + ') reassigned from: ' + [...info.writers].join(', '));
}
if (!h2names.size) console.log('  none');

// --- module summary -----------------------------------------------------------
console.log('\n--- module summary ---');
for (const [name, m] of modInfo) {
  console.log(name + (m.layer ? ' [' + m.layer + ']' : '') +
    '  decls=' + m.decls.length +
    '  exports=' + m.exportsNeeded.size +
    '  deps={' + [...m.deps].join(',') + '}');
}

// machine-readable output for the wrapper generator
const out = {};
for (const [name, m] of modInfo) {
  out[name] = { layer: m.layer || 'app', ranges: m.ranges, decls: m.decls, exports: [...m.exportsNeeded], deps: [...m.deps] };
}
out.__h2__ = [...h2names.keys()];
fs.writeFileSync(path.join(__dirname, 'analysis.json'), JSON.stringify(out, null, 1));
console.log('\nwrote tools/analysis.json');
