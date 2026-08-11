/* overridecheck.mjs — THE DEAD-ROUTE SENTINEL.
   Every key in every morphology override table must name a species that
   ACTUALLY EXISTS in the Earth catalog. A key matching nothing is a painter
   nobody will ever see — silent, and structurally invisible to the species
   audit, which can only count what the catalog asked for. (Wave 7 shipped
   "King Cobra" and "Sea Snake"; waves 3 and 4 shipped 21 more. Every audit
   in between was green: 1,254/1,254, 0 failures.)
   It also prints the coverage the tables actually REACH, so the percentages
   in our records are measured rather than claimed, and suggests the nearest
   real catalog name for each dead key so the finding is actionable.
   Exits 1 naming every dead route. */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parseAst } from 'rolldown/parseAst';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const src = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const nodeSha256 = (source, node) => createHash('sha256')
  .update(source.slice(node.start, node.end)).digest('hex');

/* The catalog is the denominator of every finding and coverage claim, so it
   gets the same parser-owned treatment as the route tables. The first version
   used a single-quote regex: one valid double-quoted species disappeared from
   the denominator while the checker still printed 100%. Require the one exact
   top-level roster literal, its four kingdom arrays, and every string literal
   independent of source quote style. */
const CATALOG_LABEL = 'packages/domain/descriptors/src/apphooks.verbatim.js';
const CATALOG_WRAPPER_LABEL = 'packages/domain/descriptors/src/apphooks.ts';
const desc = src(CATALOG_LABEL);
const catalog = new Set();
const kingdomsOf = new Map();
const catalogFail = (node, message) => {
  const where = Number.isInteger(node?.start) ? `${CATALOG_LABEL}@${node.start}` : CATALOG_LABEL;
  console.error(`overridecheck: ${where} ${message} — the catalog PARSER is broken`);
  process.exit(2);
};
if (createHash('sha256').update(src(CATALOG_WRAPPER_LABEL)).digest('hex')
    !== 'c7544344733ce0efe0c08762b96bfa3d1ca8451e38b7617ef67aa8fde9a1329a') {
  catalogFail(null, 'live apphooks.ts catalog wrapper changed from its audited authority contract');
}
let catalogProgram;
try {
  catalogProgram = parseAst(desc, { lang: 'js' }, CATALOG_LABEL);
} catch (error) {
  catalogFail(null, String(error?.message || error));
}
const rosterDeclarations = [];
for (const top of catalogProgram.body) {
  const statement = top.type === 'ExportNamedDeclaration' && top.declaration ? top.declaration : top;
  if (statement.type !== 'VariableDeclaration') continue;
  for (const declaration of statement.declarations) {
    if (declaration.id?.type === 'Identifier' && declaration.id.name === '_EARTH_NAMES') {
      rosterDeclarations.push({ statement, declaration });
    }
  }
}
if (rosterDeclarations.length !== 1) {
  catalogFail(rosterDeclarations[0]?.declaration, `expected one top-level _EARTH_NAMES declaration, found ${rosterDeclarations.length}`);
}
const { statement: rosterStatement, declaration: rosterDeclaration } = rosterDeclarations[0];
if (rosterStatement.kind !== 'const' || rosterDeclaration.init?.type !== 'ObjectExpression') {
  catalogFail(rosterDeclaration, '_EARTH_NAMES must be one const object literal');
}
const requiredKingdoms = new Set(['fauna', 'flora', 'fungi', 'microbe']);
const foundKingdoms = new Set();
const catalogRoutes = new Set();
for (const property of rosterDeclaration.init.properties) {
  const kingdom = property?.key?.type === 'Identifier' && !property.computed
    ? property.key.name
    : property?.key?.type === 'Literal' && typeof property.key.value === 'string' && !property.computed
      ? property.key.value : null;
  if (property.type !== 'Property' || property.kind !== 'init' || property.method || property.shorthand
      || !requiredKingdoms.has(kingdom) || foundKingdoms.has(kingdom)
      || property.value?.type !== 'ArrayExpression') {
    catalogFail(property, '_EARTH_NAMES must contain each exact kingdom once as a literal array');
  }
  foundKingdoms.add(kingdom);
  for (const element of property.value.elements) {
    if (!element || element.type !== 'Literal' || typeof element.value !== 'string') {
      catalogFail(element ?? property.value, `${kingdom} roster contains a non-string/spread/hole entry`);
    }
    const name = element.value.replace(/['’‘]/g, "'");
    const route = `${kingdom}\u0000${name}`;
    if (catalogRoutes.has(route)) catalogFail(element, `duplicate normalized catalog route ${JSON.stringify(name)} (${kingdom})`);
    catalogRoutes.add(route);
    catalog.add(name);
    if (!kingdomsOf.has(name)) kingdomsOf.set(name, new Set());
    kingdomsOf.get(name).add(kingdom);   /* a name can live in TWO kingdoms (Green Algae, Tardigrade) */
  }
}
if (foundKingdoms.size !== requiredKingdoms.size || rosterDeclaration.init.properties.length !== requiredKingdoms.size) {
  catalogFail(rosterDeclaration.init, '_EARTH_NAMES must contain exactly fauna, flora, fungi, and microbe');
}
const earthNamePasses = catalogProgram.body.map((top) => top.type === 'ExportNamedDeclaration' && top.declaration
  ? top.declaration : top).filter((statement) => statement.type === 'FunctionDeclaration'
    && statement.id?.type === 'Identifier' && statement.id.name === '_earthNamePass');
if (earthNamePasses.length !== 1
    || nodeSha256(desc, earthNamePasses[0]) !== '9b7282c1b499e09c65d641a898e9ce71ff0885c7ab4d8c58ff3143b932985360') {
  catalogFail(earthNamePasses[0], '_earthNamePass is not the exact audited read-only catalog consumer');
}
const auditCatalogReferences = (node, parent = null, functionScope = null) => {
  if (!node || typeof node !== 'object') return;
  const scope = node.type === 'FunctionDeclaration' ? node.id?.name || null : functionScope;
  if (node.type === 'Identifier' && node.name === '_EARTH_NAMES') {
    const declarationBinding = parent === rosterDeclaration && parent.id === node;
    const exactConsumerRead = scope === '_earthNamePass' && parent?.type === 'MemberExpression'
      && parent.object === node && (desc.slice(parent.start, parent.end) === '_EARTH_NAMES[g.kingdom]'
        || desc.slice(parent.start, parent.end) === '_EARTH_NAMES.fauna');
    const exactExport = parent?.type === 'ExportSpecifier' && (parent.local === node || parent.exported === node)
      && parent.local?.type === 'Identifier' && parent.local.name === '_EARTH_NAMES'
      && parent.exported?.type === 'Identifier' && parent.exported.name === '_EARTH_NAMES';
    if (!(declarationBinding || exactConsumerRead || exactExport)) {
      catalogFail(node, '_EARTH_NAMES escapes its exact declaration/read/export contract');
    }
  }
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const child of value) if (child && typeof child === 'object' && child.type) auditCatalogReferences(child, node, scope);
    } else if (value && typeof value === 'object' && value.type) {
      auditCatalogReferences(value, node, scope);
    }
  }
};
auditCatalogReferences(catalogProgram);
if (catalog.size < 500) { console.error('overridecheck: catalog parse found only ' + catalog.size + ' names — the PARSER is broken, not the tables'); process.exit(2); }

/* Parse each complete TypeScript source and let the parser own BOTH route-table
   discovery and property grammar. The former hand lexer failed on value
   strings, template/regex braces, control-head and member-call slash context,
   Unicode identifiers, and restricted-production ASI. A later two-regex repair
   let comment-separated and non-first const declarators evade both sides of
   its parity check. Rolldown's pinned Oxc parser already owns those decisions;
   this tool owns only "which const declarations are route tables, and which
   AST nodes are their literal route keys?" */
class ParserError extends Error {}

function parserError(label, node, message) {
  const where = Number.isInteger(node?.start) ? `${label}@${node.start}` : label;
  throw new ParserError(`${where} ${message}`);
}

function bindingNames(pattern, out) {
  if (!pattern) return;
  if (pattern.type === 'Identifier') { out.push(pattern.name); return; }
  if (pattern.type === 'AssignmentPattern') { bindingNames(pattern.left, out); return; }
  if (pattern.type === 'RestElement') { bindingNames(pattern.argument, out); return; }
  if (pattern.type === 'ArrayPattern') {
    for (const element of pattern.elements) bindingNames(element, out);
    return;
  }
  if (pattern.type === 'ObjectPattern') {
    for (const property of pattern.properties) {
      if (property.type === 'Property') bindingNames(property.value, out);
      else if (property.type === 'RestElement') bindingNames(property.argument, out);
    }
  }
}

function literalRouteKeys(literal, label, validateValue) {
  try {
    if (literal?.type === 'ArrayExpression') {
      return literal.elements.map((element) => {
        if (!element || element.type !== 'Literal' || typeof element.value !== 'string') {
          parserError(label, element ?? literal, 'array table contains a non-string/spread entry');
        }
        return element.value;
      });
    }
    if (literal?.type !== 'ObjectExpression') {
      parserError(label, literal, 'table initializer is not an object/array literal');
    }
    return literal.properties.map((property) => {
      if (property.type !== 'Property' || property.kind !== 'init' || property.method
        || property.computed || property.shorthand
        || property.key.type !== 'Literal' || typeof property.key.value !== 'string') {
        parserError(label, property, 'object table contains a non-literal/computed/spread/method key');
      }
      if (!validateValue(property.value)) {
        parserError(label, property.value, `route ${JSON.stringify(property.key.value)} does not satisfy its statically live value contract`);
      }
      return property.key.value;
    });
  } catch (error) {
    if (error instanceof ParserError) throw error;
    parserError(label, literal, String(error?.message || error));
  }
}

function parseTypeScript(source, label) {
  try {
    return parseAst(source, { lang: label.endsWith('.tsx') ? 'tsx' : 'ts' }, label);
  } catch (error) {
    throw new ParserError(`${label} ${String(error?.message || error)}`);
  }
}

function propertyName(member) {
  if (!member?.computed && member?.property?.type === 'Identifier') return member.property.name;
  if (member?.computed && member?.property?.type === 'Literal' && typeof member.property.value === 'string') {
    return member.property.value;
  }
  return null;
}

function containsRouteReference(node, parent = null) {
  if (!node || typeof node !== 'object') return false;
  if (node.type === 'Identifier' && isRouteTable(node.name)) {
    if (parent?.type === 'MemberExpression' && parent.property === node && !parent.computed) return false;
    if (parent?.type === 'Property' && parent.key === node && !parent.computed && !parent.shorthand) return false;
    return true;
  }
  return Object.values(node).some((value) => {
    if (Array.isArray(value)) return value.some((child) => containsRouteReference(child, node));
    return value && typeof value === 'object' && value.type && containsRouteReference(value, node);
  });
}

function routeRoot(member) {
  let node = member;
  while (node?.type === 'MemberExpression' || node?.type === 'ChainExpression') {
    node = node.type === 'ChainExpression' ? node.expression : node.object;
  }
  return node?.type === 'Identifier' && isRouteTable(node.name) ? node.name : null;
}

const TRUSTED_GLOBAL_BINDINGS = new Set(['Object', 'String', 'Boolean']);
const FORBIDDEN_DYNAMIC_GLOBALS = new Set(['eval', 'Function']);
const GLOBAL_OBJECT_BINDINGS = new Set(['globalThis', 'window', 'self']);
const APPROVED_OBJECT_CALLS = new Set(['freeze', 'is', 'keys']);
const APPROVED_INDEX_GLOBALS = new Set(['_hdLater', 'getGalaxySprite', 'CARD_FACTS', '_quasarSpr']);
const APPROVED_BARE_IMPORTS = new Map([
  ['@cf/domain-rand', new Set(['mulberry32', 'TAU'])],
  ['@cf/domain-speciestraits', new Set(['SP_COLOR', 'SP_HEX'])],
]);

function unwrapRuntimeExpression(node) {
  let current = node;
  while (current && (current.type === 'TSAsExpression' || current.type === 'TSTypeAssertion'
    || current.type === 'TSNonNullExpression' || current.type === 'TSSatisfiesExpression'
    || current.type === 'ChainExpression' || current.type === 'ParenthesizedExpression')) {
    current = current.expression;
  }
  return current;
}

function isNameIndex(node) {
  return node?.type === 'Identifier' && node.name === 'name';
}

function isCanonIndex(node) {
  return node?.type === 'BinaryExpression' && node.operator === '+'
    && isNameIndex(node.right)
    && node.left?.type === 'BinaryExpression' && node.left.operator === '+'
    && node.left.left?.type === 'Identifier' && node.left.left.name === 'kingdom'
    && node.left.right?.type === 'Literal' && node.left.right.value === '|';
}

function auditRouteTableReferences(program, label, source) {
  const visit = (node, parent = null, enclosingFunction = null, enclosingVariable = null) => {
    if (!node || typeof node !== 'object') return;
    const functionScope = node.type === 'FunctionDeclaration'
      ? node.id?.name || null
      : node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression'
        ? null : enclosingFunction;
    const variableScope = node.type === 'VariableDeclarator' && node.id?.type === 'Identifier'
      ? node.id.name : enclosingVariable;
    const lexicalNames = [];
    if (node.type === 'VariableDeclarator') bindingNames(node.id, lexicalNames);
    else if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') {
      bindingNames(node.id, lexicalNames);
      for (const parameter of node.params || []) bindingNames(parameter, lexicalNames);
    } else if (node.type === 'ArrowFunctionExpression') {
      for (const parameter of node.params || []) bindingNames(parameter, lexicalNames);
    } else if (node.type === 'ClassDeclaration' || node.type === 'ClassExpression') {
      bindingNames(node.id, lexicalNames);
    } else if (node.type === 'ImportSpecifier' || node.type === 'ImportDefaultSpecifier'
      || node.type === 'ImportNamespaceSpecifier') {
      bindingNames(node.local, lexicalNames);
    } else if (node.type === 'CatchClause') bindingNames(node.param, lexicalNames);
    else if (node.type === 'TSModuleDeclaration' || node.type === 'TSEnumDeclaration'
      || node.type === 'TSImportEqualsDeclaration') bindingNames(node.id, lexicalNames);
    const shadowedGlobal = lexicalNames.find((name) => TRUSTED_GLOBAL_BINDINGS.has(name));
    if (shadowedGlobal) {
      parserError(label, node, `shadowing the built-in ${shadowedGlobal} binding is unsupported in route-table sources`);
    }
    if (node.type === 'ImportExpression') {
      parserError(label, node, 'dynamic imports are unsupported in route-table sources');
    }
    if (node.type === 'Identifier' && FORBIDDEN_DYNAMIC_GLOBALS.has(node.name)) {
      const staticProperty = (parent?.type === 'MemberExpression' && parent.property === node && !parent.computed)
        || (parent?.type === 'Property' && parent.key === node && !parent.computed && !parent.shorthand);
      if (!staticProperty) parserError(label, node, `${node.name} escape syntax is unsupported in route-table sources`);
    }
    if (node.type === 'Identifier' && GLOBAL_OBJECT_BINDINGS.has(node.name)) {
      const staticProperty = (parent?.type === 'MemberExpression' && parent.property === node && !parent.computed)
        || (parent?.type === 'Property' && parent.key === node && !parent.computed && !parent.shorthand);
      const exactIndexAlias = label === 'index.ts' && node.name === 'globalThis' && variableScope === 'g0';
      const exactPagehide = label === 'speciesart.ts' && node.name === 'window'
        && parent?.type === 'MemberExpression' && parent.object === node && !parent.computed
        && propertyName(parent) === 'addEventListener';
      if (!(staticProperty || exactIndexAlias || exactPagehide)) {
        parserError(label, node, `${node.name} global-object access is outside its exact audited context`);
      }
    }
    if (node.type === 'Identifier' && TRUSTED_GLOBAL_BINDINGS.has(node.name)) {
      const staticName = (parent?.type === 'MemberExpression' && parent.property === node && !parent.computed)
        || (parent?.type === 'Property' && parent.key === node && !parent.computed && !parent.shorthand);
      const directObject = node.name === 'Object' && parent?.type === 'MemberExpression'
        && unwrapRuntimeExpression(parent.object) === node;
      const directCoercion = (node.name === 'String' || node.name === 'Boolean')
        && parent?.type === 'CallExpression' && parent.callee === node;
      if (!(staticName || directObject || directCoercion)) {
        parserError(label, node, `trusted built-in ${node.name} escapes its approved direct-call context`);
      }
    }
    if (node.type === 'MemberExpression') {
      const object = unwrapRuntimeExpression(node.object);
      if (object?.type === 'Identifier' && object.name === 'g0' && label === 'index.ts'
          && (node.computed || !APPROVED_INDEX_GLOBALS.has(propertyName(node)))) {
        parserError(label, node, 'index.ts global alias accesses an unapproved property');
      }
      if (object?.type === 'Identifier' && object.name === 'Object') {
        const method = propertyName(node);
        if (!(parent?.type === 'CallExpression' && parent.callee === node
            && !node.computed && APPROVED_OBJECT_CALLS.has(method))) {
          parserError(label, node, 'trusted built-in Object member escapes its approved direct-call context');
        }
      }
      if (object?.type === 'Identifier' && (object.name === 'String' || object.name === 'Boolean')) {
        parserError(label, node, `trusted built-in ${object.name} members are unsupported in route-table sources`);
      }
    }
    if (node.type === 'ImportNamespaceSpecifier') {
      parserError(label, node, 'namespace imports are unsupported in route-table sources');
    }
    if (node.type === 'ImportDefaultSpecifier') {
      parserError(label, node, 'default imports are unsupported in route-table sources');
    }
    if (node.type === 'ImportDeclaration' && !knownRelativeImport(label, node.source?.value)) {
      parserError(label, node, `relative import ${JSON.stringify(node.source?.value)} is outside recursive art-source discovery`);
    }
    if (node.type === 'ImportDeclaration' && typeof node.source?.value === 'string'
        && !node.source.value.startsWith('.')) {
      const allowed = APPROVED_BARE_IMPORTS.get(node.source.value);
      const exact = allowed && node.specifiers.length > 0 && node.specifiers.every((specifier) => {
        const imported = specifier.type === 'ImportSpecifier' ? exportedName(specifier.imported) : null;
        return imported && specifier.local?.type === 'Identifier' && specifier.local.name === imported
          && allowed.has(imported);
      });
      if (!exact) parserError(label, node, `bare import ${JSON.stringify(node.source.value)} is outside the exact audited dependency surface`);
    }
    if ((node.type === 'ExportNamedDeclaration' || node.type === 'ExportAllDeclaration')
        && node.source && !knownRelativeImport(label, node.source.value)) {
      parserError(label, node, `re-export ${JSON.stringify(node.source.value)} is outside recursive art-source discovery`);
    }
    if ((node.type === 'ExportNamedDeclaration' || node.type === 'ExportAllDeclaration')
        && typeof node.source?.value === 'string' && !node.source.value.startsWith('.')) {
      parserError(label, node, `bare re-export ${JSON.stringify(node.source.value)} is outside the exact audited dependency surface`);
    }
    if (node.type === 'ExportAllDeclaration') {
      parserError(label, node, 'namespace/export-all re-exports are unsupported in route-table sources');
    }
    if (node.type === 'ObjectPattern') {
      for (const property of node.properties || []) {
        if (property.type !== 'Property') continue;
        const name = property.key?.type === 'Identifier' ? property.key.name
          : property.key?.type === 'Literal' ? property.key.value : null;
        if (isRouteTable(name)) {
          parserError(label, property, `${name} route table may not be acquired through object destructuring`);
        }
      }
    }
    if (node.type === 'ImportSpecifier') {
      const imported = node.imported?.name ?? node.imported?.value;
      const local = node.local?.name;
      if ((isRouteTable(imported) || isRouteTable(local)) && imported !== local) {
        parserError(label, node, `route-table import ${imported} may not be aliased as ${local}`);
      }
    }
    if (node.type === 'ExportSpecifier') {
      const local = exportedName(node.local);
      const exported = exportedName(node.exported);
      if (isRouteTable(local) && local !== exported) {
        parserError(label, node, `route-table export ${local} may not be aliased as ${exported}`);
      }
    }
    if (node.type === 'AssignmentExpression' && containsRouteReference(node.left)) {
      parserError(label, node.left, 'route table appears in an assignment target after its literal declaration');
    }
    if (node.type === 'UpdateExpression' && containsRouteReference(node.argument)) {
      parserError(label, node.argument, 'route table appears in an update target after its literal declaration');
    }
    if (node.type === 'UnaryExpression' && node.operator === 'delete' && containsRouteReference(node.argument)) {
      parserError(label, node.argument, 'route table appears in a delete target after its literal declaration');
    }
    if ((node.type === 'ForInStatement' || node.type === 'ForOfStatement')
      && containsRouteReference(node.left)) {
      parserError(label, node.left, `route table appears in a ${node.type === 'ForOfStatement' ? 'for-of' : 'for-in'} assignment target`);
    }
    if (node.type === 'CallExpression' && node.callee?.type === 'MemberExpression') {
      const root = routeRoot(node.callee.object);
      const method = propertyName(node.callee);
      const legalIncludes = root === 'FLORA_DUPES' && !node.callee.computed && method === 'includes'
        && node.arguments.length === 1 && isNameIndex(node.arguments[0]);
      if (root && !legalIncludes) {
        parserError(label, node.callee, `${root} route table is called outside exact FLORA_DUPES.includes(name)`);
      }
    }
    if (node.type === 'MemberExpression') {
      const namedProperty = propertyName(node);
      if (isRouteTable(namedProperty) && !routeRoot(node.object)) {
        parserError(label, node, `${namedProperty} route table is accessed through an unsupported namespace/object alias`);
      }
      const root = routeRoot(node);
      const legalIncludes = root === 'FLORA_DUPES' && !node.computed && namedProperty === 'includes'
        && parent?.type === 'CallExpression' && parent.callee === node;
      const legalIndex = root && node.object?.type === 'Identifier' && node.object.name === root
        && node.computed && root !== 'FLORA_DUPES'
        && (root === 'CANON' ? isCanonIndex(node.property) : isNameIndex(node.property))
        && label === 'speciesoverrides.ts'
        && (functionScope === 'hasNamedRoute' || functionScope === 'resolveOverride');
      if (root && !legalIncludes && !legalIndex) {
        const member = node.computed ? 'computed member' : `member ${namedProperty}`;
        parserError(label, node, `${root} route table uses unsupported ${member}`);
      }
    }
    if (node.type === 'Identifier' && isRouteTable(node.name)) {
      const declarationBinding = parent?.type === 'VariableDeclarator' && parent.id === node;
      const importBinding = parent?.type === 'ImportSpecifier';
      const exportBinding = parent?.type === 'ExportSpecifier'
        && parent.local?.type === 'Identifier' && parent.exported?.type === 'Identifier'
        && parent.local.name === node.name && parent.exported.name === node.name;
      const staticProperty = parent?.type === 'Property' && parent.key === node
        && !parent.computed && !parent.shorthand;
      const staticMemberName = parent?.type === 'MemberExpression' && parent.property === node && !parent.computed;
      const labelName = (parent?.type === 'LabeledStatement' || parent?.type === 'BreakStatement'
        || parent?.type === 'ContinueStatement') && parent.label === node;
      const tableRead = parent?.type === 'MemberExpression' && parent.object === node;
      const objectKeysRead = parent?.type === 'CallExpression' && parent.arguments.includes(node)
        && parent.callee?.type === 'MemberExpression'
        && parent.callee.object?.type === 'Identifier' && parent.callee.object.name === 'Object'
        && propertyName(parent.callee) === 'keys'
        && label === 'speciesoverrides.ts' && functionScope === null && variableScope === 'OVERRIDE_COUNT';
      const spreadRead = parent?.type === 'SpreadElement' && parent.argument === node
        && label === 'speciesoverrides.ts' && functionScope === null && variableScope === 'OVERRIDE_COUNT';
      if (!(declarationBinding || importBinding || exportBinding || staticProperty || staticMemberName || labelName
        || tableRead || objectKeysRead || spreadRead)) {
        parserError(label, node, `${node.name} route table escapes its supported literal/read contexts`);
      }
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (const child of value) if (child && typeof child === 'object' && child.type) visit(child, node, functionScope, variableScope);
      } else if (value && typeof value === 'object' && value.type) {
        visit(value, node, functionScope, variableScope);
      }
    }
  };
  visit(program);
}
/* EVERY source file in the art package — not a list, and not a NAME PATTERN
   either. This blindness has now arrived three times in the same shape:
     1. a hardcoded file list missed faunaoverrides3.ts (105 routes unchecked)
     2. an `export const`-only scan missed both module-private tables
     3. a `*overrides.ts` glob missed florarost.ts (280 routes unchecked)
   Each time the fix was to widen the discovery rule, and each time the RULE
   ITSELF was the assumption. Scan everything; the table-name filter below is
   what decides relevance. */
const ART_SOURCE_ROOT = path.join(root, 'packages/art/src');
const KNOWN_VERBATIM_JS_HASHES = new Map([
  ['artextras.verbatim.js', 'dadfd860bc21b4472efb80f91399ddb89b704bc2b0396fe848aa8628b21cc2c7'],
  ['galaxyart.verbatim.js', '2cba375ab1f806ed2eaf394fa599e05dc1fd0e79097b25120cc0a662dca22f45'],
  ['hdart.verbatim.js', 'f57f2e37a8920b487966b1facfa717fb40ffb143b8c33cafa2c70af8f6aa8223'],
  ['thumbart.verbatim.js', '8fcaf662bcedd2d2eebf75a8ad00c5bc243190d1cc5c8071a763113f76c77c48'],
]);
const KNOWN_VERBATIM_JS = new Set(KNOWN_VERBATIM_JS_HASHES.keys());
const isTypeScriptSource = (name) => /\.(?:ts|mts|cts|tsx)$/.test(name)
  && !/\.d\.(?:ts|mts|cts|tsx)$/.test(name);
function discoverArtSources(directory = ART_SOURCE_ROOT, relative = '') {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const rel = relative ? path.posix.join(relative, entry.name) : entry.name;
    if (entry.isSymbolicLink()) {
      console.error(`overridecheck: ${rel} is a symlink inside art sources — recursive discovery refuses ambiguous provenance`);
      process.exit(2);
    }
    if (entry.isDirectory()) files.push(...discoverArtSources(path.join(directory, entry.name), rel));
    else if (entry.isFile() && isTypeScriptSource(entry.name)) files.push(rel);
    else if (entry.isFile() && /\.(?:js|mjs|cjs|jsx)$/.test(entry.name) && !KNOWN_VERBATIM_JS.has(rel)) {
      console.error(`overridecheck: ${rel} is an unsupported executable art source — use a discovered TypeScript extension or audit it explicitly`);
      process.exit(2);
    }
  }
  return files;
}
const FILES = discoverArtSources().sort();
const FILE_SET = new Set(FILES);
for (const [label, expected] of KNOWN_VERBATIM_JS_HASHES) {
  const actual = createHash('sha256').update(fs.readFileSync(path.join(ART_SOURCE_ROOT, label))).digest('hex');
  if (actual !== expected) {
    console.error(`overridecheck: ${label} changed from its audited executable-input hash — the PARSER is broken`);
    process.exit(2);
  }
}
const programCache = new Map();
const bindingCache = new Map();
const exportCache = new Map();
const writtenNameCache = new Map();

function normalizedModuleTarget(label, specifier) {
  if (typeof specifier !== 'string' || !specifier.startsWith('.')) return null;
  const target = specifier.replace(/\.mjs$/, '.mts').replace(/\.cjs$/, '.cts')
    .replace(/\.jsx$/, '.tsx').replace(/\.js$/, '.ts');
  const normalized = path.posix.normalize(path.posix.join(path.posix.dirname(label), target));
  if (path.posix.isAbsolute(normalized) || normalized === '..' || normalized.startsWith('../')) return null;
  return normalized;
}

function knownRelativeImport(label, specifier) {
  if (typeof specifier !== 'string' || !specifier.startsWith('.')) return true;
  const typed = normalizedModuleTarget(label, specifier);
  if (typed && FILE_SET.has(typed)) return true;
  const raw = path.posix.normalize(path.posix.join(path.posix.dirname(label), specifier));
  return !path.posix.isAbsolute(raw) && raw !== '..' && !raw.startsWith('../') && KNOWN_VERBATIM_JS.has(raw);
}

function cachedProgram(label) {
  if (!programCache.has(label)) {
    if (!FILE_SET.has(label)) throw new ParserError(`${label} is outside recursive art-source discovery`);
    programCache.set(label, parseTypeScript(src('packages/art/src/' + label), label));
  }
  return programCache.get(label);
}

function moduleBindings(label) {
  if (bindingCache.has(label)) return bindingCache.get(label);
  const bindings = new Map();
  bindingCache.set(label, bindings);
  for (const top of cachedProgram(label).body) {
    if (top.type === 'ImportDeclaration') {
      const target = normalizedModuleTarget(label, top.source?.value);
      for (const specifier of top.specifiers || []) {
        if (specifier.type !== 'ImportSpecifier' || specifier.local?.type !== 'Identifier') continue;
        bindings.set(specifier.local.name, {
          kind: 'import', target, imported: specifier.imported?.name ?? specifier.imported?.value,
        });
      }
      continue;
    }
    const statement = top.type === 'ExportNamedDeclaration' && top.declaration ? top.declaration : top;
    if (statement.type === 'FunctionDeclaration' && statement.id?.type === 'Identifier') {
      bindings.set(statement.id.name, { kind: 'function', node: statement, name: statement.id.name });
    } else if (statement.type === 'ClassDeclaration' && statement.id?.type === 'Identifier') {
      bindings.set(statement.id.name, { kind: 'class', node: statement, name: statement.id.name });
    } else if (statement.type === 'VariableDeclaration') {
      for (const declaration of statement.declarations) {
        if (declaration.id?.type === 'Identifier') {
          bindings.set(declaration.id.name, {
            kind: 'variable', node: declaration, name: declaration.id.name, declarationKind: statement.kind,
          });
        }
      }
    }
  }
  return bindings;
}

const exportedName = (node) => node?.type === 'Identifier' ? node.name
  : node?.type === 'Literal' && typeof node.value === 'string' ? node.value : null;

function moduleExports(label) {
  if (exportCache.has(label)) return exportCache.get(label);
  const exports = new Map();
  exportCache.set(label, exports);
  const add = (name, binding, node) => {
    if (typeof name !== 'string' || typeof binding.local !== 'string') {
      parserError(label, node, 'named export uses an unsupported binding shape');
    }
    if (exports.has(name)) parserError(label, node, `named export ${name} is declared more than once`);
    exports.set(name, binding);
  };
  for (const top of cachedProgram(label).body) {
    if (top.type !== 'ExportNamedDeclaration') continue;
    if (top.declaration) {
      const statement = top.declaration;
      if ((statement.type === 'FunctionDeclaration' || statement.type === 'ClassDeclaration')
          && statement.id?.type === 'Identifier') {
        add(statement.id.name, { local: statement.id.name, target: null }, statement);
      } else if (statement.type === 'VariableDeclaration') {
        for (const declaration of statement.declarations) {
          const names = [];
          bindingNames(declaration.id, names);
          for (const name of names) add(name, { local: name, target: null }, declaration);
        }
      }
    }
    const target = top.source ? normalizedModuleTarget(label, top.source.value) : null;
    if (top.source && (!target || !FILE_SET.has(target))) {
      parserError(label, top, `re-export ${JSON.stringify(top.source.value)} has no scanned binding owner`);
    }
    for (const specifier of top.specifiers || []) {
      if (specifier.type !== 'ExportSpecifier') parserError(label, specifier, 'non-named export is unsupported in scanned art sources');
      const local = exportedName(specifier.local);
      add(exportedName(specifier.exported), { local, target }, specifier);
    }
  }
  return exports;
}

function exportedBindingFor(label, name, seen = new Set()) {
  const key = `export:${label}:${name}`;
  if (seen.has(key)) return null;
  const next = new Set(seen); next.add(key);
  const binding = moduleExports(label).get(name);
  if (!binding) return null;
  if (binding.target) {
    if (!FILE_SET.has(binding.target)) return null;
    return exportedBindingFor(binding.target, binding.local, next);
  }
  return bindingFor(label, binding.local, next);
}

function bindingFor(label, name, seen = new Set()) {
  const key = `${label}:${name}`;
  if (seen.has(key)) return null;
  const next = new Set(seen); next.add(key);
  const binding = moduleBindings(label).get(name);
  if (!binding || binding.kind !== 'import') return binding ? { ...binding, label, name } : null;
  if (!binding.target || !FILE_SET.has(binding.target) || typeof binding.imported !== 'string') return null;
  return exportedBindingFor(binding.target, binding.imported, next);
}

function assignedNames(pattern, out) {
  if (!pattern || typeof pattern !== 'object') return;
  if (pattern.type === 'Identifier') { out.add(pattern.name); return; }
  if (pattern.type === 'AssignmentPattern') { assignedNames(pattern.left, out); return; }
  if (pattern.type === 'RestElement') { assignedNames(pattern.argument, out); return; }
  if (pattern.type === 'ArrayPattern') {
    for (const element of pattern.elements) assignedNames(element, out);
    return;
  }
  if (pattern.type === 'ObjectPattern') {
    for (const property of pattern.properties) {
      if (property.type === 'Property') assignedNames(property.value, out);
      else if (property.type === 'RestElement') assignedNames(property.argument, out);
    }
    return;
  }
  if (pattern.type === 'TSAsExpression' || pattern.type === 'TSTypeAssertion'
    || pattern.type === 'TSNonNullExpression' || pattern.type === 'TSSatisfiesExpression'
    || pattern.type === 'ChainExpression') assignedNames(pattern.expression, out);
}

function writtenNames(label) {
  if (writtenNameCache.has(label)) return writtenNameCache.get(label);
  const written = new Set();
  writtenNameCache.set(label, written);
  const visit = (node) => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'AssignmentExpression') assignedNames(node.left, written);
    else if (node.type === 'UpdateExpression') assignedNames(node.argument, written);
    else if (node.type === 'ForInStatement' || node.type === 'ForOfStatement') assignedNames(node.left, written);
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (const child of value) if (child && typeof child === 'object' && child.type) visit(child);
      } else if (value && typeof value === 'object' && value.type) visit(value);
    }
  };
  visit(cachedProgram(label));
  return written;
}

function stableBinding(binding) {
  return binding && !writtenNames(binding.label).has(binding.name)
    && (binding.kind !== 'variable' || binding.declarationKind === 'const');
}

const directCallable = (node) => (node?.type === 'ArrowFunctionExpression' || node?.type === 'FunctionExpression')
  && !node.async && !node.generator;

/* Painter tables require a function value, not merely a truthy value: `any`
   and `null!` can defeat their Record annotations. Resolve only immutable exact
   module bindings. Factory calls are accepted only when an immutable function
   expression returns a syntactically direct callable, so parameters/arguments
   cannot smuggle a falsy result through a module-scope name coincidence. */
function definitelyCallableRouteValue(node, label, seen = new Set()) {
  if (!node) return false;
  if (directCallable(node)) return true;
  if (node.type === 'Identifier') {
    const key = `${label}:${node.name}`;
    if (seen.has(key)) return false;
    const binding = bindingFor(label, node.name);
    if (!stableBinding(binding)) return false;
    if (binding.kind === 'function') return !binding.node.async && !binding.node.generator;
    if (binding.kind !== 'variable') return false;
    const next = new Set(seen); next.add(key);
    return definitelyCallableRouteValue(binding.node.init, binding.label, next);
  }
  if (node.type === 'CallExpression' && node.callee?.type === 'Identifier') {
    const key = `${label}:${node.callee.name}()`;
    if (seen.has(key)) return false;
    const binding = bindingFor(label, node.callee.name);
    if (!stableBinding(binding)) return false;
    let fn = null;
    if (binding.kind === 'function') fn = binding.node;
    else if (binding.kind === 'variable'
      && (binding.node.init?.type === 'ArrowFunctionExpression' || binding.node.init?.type === 'FunctionExpression')) {
      fn = binding.node.init;
    }
    return Boolean(fn && !fn.async && !fn.generator && directCallable(fn.body));
  }
  return false;
}

function definitelyObjectRouteValue(node, label, seen = new Set()) {
  if (node?.type === 'ObjectExpression') return true;
  if (node?.type !== 'Identifier') return false;
  const key = `${label}:${node.name}`;
  if (seen.has(key)) return false;
  const binding = bindingFor(label, node.name);
  if (!stableBinding(binding) || binding.kind !== 'variable') return false;
  const next = new Set(seen); next.add(key);
  return definitelyObjectRouteValue(binding.node.init, binding.label, next);
}

function validRouteValue(node, label, table) {
  return table === 'QUAD_SPEC' || table === 'QUAD2_SPEC'
    ? definitelyObjectRouteValue(node, label)
    : definitelyCallableRouteValue(node, label);
}
if (FILES.length < 6) { console.error('overridecheck: found only ' + FILES.length + ' art sources — the PARSER is broken'); process.exit(2); }
/* Which kingdom branch of resolveOverride each table serves. Shadowing is
   only possible WITHIN a branch: 'Green Algae' is in both the flora and the
   microbe catalogs and is correctly keyed in a table for each — the check's
   first cut called that a shadow, which it is not. (The instrument's own
   false positive, found the first time it ran. Again.) */
const TABLE_KINGDOM = {
  FUNGI_NAME: 'fungi', MICROBE_NAME: 'microbe',
  FLORA_ICONIC: 'flora', FLORA_DUPES: 'flora', FLORA2_SPEC: 'flora',
  FAUNA_NAME: 'fauna', FAUNA2_NAME: 'fauna', FAUNA3_NAME: 'fauna', FAUNA4_NAME: 'fauna',
  BIRD_NAME: 'fauna', QUAD_SPEC: 'fauna', QUAD2_SPEC: 'fauna', INVERT_NAME: 'fauna',
};
const FLORA_SELECTOR_ORDER = ['FLORA_ICONIC', 'FLORA2_SPEC'];
const FAUNA_SELECTOR_ORDER = ['FAUNA_NAME', 'FAUNA2_NAME', 'FAUNA3_NAME', 'BIRD_NAME', 'INVERT_NAME'];
const QUAD_SELECTOR_ORDER = ['QUAD_SPEC', 'QUAD2_SPEC'];
/* Lower numbers win exactly as resolveOverride's audited selector chains do.
   File-system traversal order is not routing precedence: the earlier version
   could truthfully find a collision but name the losing table as the shadow. */
const TABLE_PRIORITY = {
  CANON: 0,
  ...Object.fromEntries([...FLORA_SELECTOR_ORDER, 'FLORA_DUPES'].map((table, index) => [table, 10 + index])),
  ...Object.fromEntries([...FAUNA_SELECTOR_ORDER, ...QUAD_SELECTOR_ORDER].map((table, index) => [table, 10 + index])),
  FAUNA4_NAME: 99,
  FUNGI_NAME: 10, MICROBE_NAME: 10,
};
const keys = new Map();   /* "kingdom|name" → "file:TABLE" */
const dupes = [];
const shadowed = [];
const unclassified = [];
const isRouteTable = (table) => table === 'CANON' || /(?:_NAME|_ICONIC|_DUPES|_SPEC)$/.test(table);
const routeId = (kingdom, name) => JSON.stringify([kingdom, name]);
const routeParts = (id) => JSON.parse(id);

function routeTables(source, label) {
  const program = parseTypeScript(source, label);
  programCache.set(label, program);
  bindingCache.delete(label);

  const tables = [];
  const tableCounts = new Map();
  const visit = (node) => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'VariableDeclaration') {
      for (const declaration of node.declarations) {
        const names = [];
        bindingNames(declaration.id, names);
        for (const table of names) {
          if (!isRouteTable(table)) continue;
          if (node.kind !== 'const') parserError(label, declaration, `${table} route table is not const`);
          if (declaration.id.type !== 'Identifier') {
            parserError(label, declaration.id, `${table} route table uses a destructuring binding`);
          }
          const count = (tableCounts.get(table) || 0) + 1;
          tableCounts.set(table, count);
          if (count !== 1) parserError(label, declaration, `${table} route table is declared more than once`);
          tables.push({
            table,
            keys: literalRouteKeys(declaration.init, `${label}:${table}`,
              (value) => validRouteValue(value, label, table)),
          });
        }
      }
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (const child of value) if (child && typeof child === 'object' && child.type) visit(child);
      } else if (value && typeof value === 'object' && value.type) {
        visit(value);
      }
    }
  };
  visit(program);
  auditRouteTableReferences(program, label, source);
  return tables;
}

function routerWiring(source, label, functionName) {
  const program = parseTypeScript(source, label);
  const matches = [];
  const namedRouteMatches = [];
  const imports = new Map();
  const find = (node) => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'FunctionDeclaration' && node.id?.name === functionName) matches.push(node);
    if (node.type === 'FunctionDeclaration' && node.id?.name === 'hasNamedRoute') namedRouteMatches.push(node);
    if (node.type === 'ImportDeclaration' && typeof node.source?.value === 'string') {
      if (!node.source.value.startsWith('.')) {
        const routeImport = (node.specifiers || []).some((specifier) => isRouteTable(specifier.local?.name));
        if (routeImport) parserError(label, node, 'route-table imports must use a relative source path');
      }
      const owner = normalizedModuleTarget(label, node.source.value);
      if (!owner) {
        const routeImport = (node.specifiers || []).some((specifier) => isRouteTable(specifier.local?.name));
        if (routeImport) parserError(label, node, `route-table import escapes scanned art sources: ${node.source.value}`);
      }
      for (const specifier of node.specifiers || []) {
        if (specifier.type !== 'ImportSpecifier' || !isRouteTable(specifier.local?.name)) continue;
        if (imports.has(specifier.local.name)) {
          parserError(label, specifier, `${specifier.local.name} route table is imported more than once`);
        }
        imports.set(specifier.local.name, owner);
      }
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (const child of value) if (child && typeof child === 'object' && child.type) find(child);
      } else if (value && typeof value === 'object' && value.type) {
        find(value);
      }
    }
  };
  find(program);
  if (matches.length !== 1 || !matches[0].body) {
    parserError(label, matches[0], `expected exactly one ${functionName} function body, found ${matches.length}`);
  }
  if (namedRouteMatches.length !== 1 || !namedRouteMatches[0].body) {
    parserError(label, namedRouteMatches[0], `expected exactly one hasNamedRoute function body, found ${namedRouteMatches.length}`);
  }
  const selectorNames = new Set(['canon', 'iconic', 'dupe', 'fp', 'quad', 'painter']);
  const selectors = new Map();
  const collectSelectors = (node) => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression'
      || node.type === 'ArrowFunctionExpression' || node.type === 'ClassDeclaration'
      || node.type === 'ClassExpression') return;
    if (node.type === 'VariableDeclarator' && node.id?.type === 'Identifier'
      && selectorNames.has(node.id.name)) {
      if (selectors.has(node.id.name)) parserError(label, node, `resolver selector ${node.id.name} is declared more than once`);
      selectors.set(node.id.name, node);
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (const child of value) if (child && typeof child === 'object' && child.type) collectSelectors(child);
      } else if (value && typeof value === 'object' && value.type) {
        collectSelectors(value);
      }
    }
  };
  collectSelectors(matches[0].body);

  const contractError = (node, message) => {
    parserError(label, node, `resolver selector/consumer contract changed: ${message}`);
  };
  const identifier = (node, name) => node?.type === 'Identifier' && node.name === name;
  const literal = (node, value) => node?.type === 'Literal' && node.value === value;
  const notIdentifier = (node, name) => node?.type === 'UnaryExpression'
    && node.operator === '!' && identifier(node.argument, name);
  const andNot = (node, left, right) => node?.type === 'LogicalExpression'
    && node.operator === '&&' && notIdentifier(node.left, left) && notIdentifier(node.right, right);
  const declaration = (statement, name) => {
    if (statement?.type !== 'VariableDeclaration' || statement.declarations.length !== 1) return null;
    const declarator = statement.declarations[0];
    return identifier(declarator.id, name) ? declarator : null;
  };
  const callStatement = (statement) => statement?.type === 'ExpressionStatement'
    && statement.expression?.type === 'CallExpression' ? statement.expression : null;
  const returnNull = (statement) => statement?.type === 'ReturnStatement' && literal(statement.argument, null);
  const returnDataUrl = (statement) => statement?.type === 'ReturnStatement'
    && statement.argument?.type === 'CallExpression'
    && statement.argument.callee?.type === 'MemberExpression'
    && identifier(statement.argument.callee.object, 'cv')
    && !statement.argument.callee.computed && propertyName(statement.argument.callee) === 'toDataURL'
    && statement.argument.arguments.length === 0
    && source.slice(statement.argument.start, statement.argument.end) === 'cv.toDataURL()';
  const exactMember = (node, object, property) => node?.type === 'MemberExpression'
    && !node.computed && identifier(node.object, object) && propertyName(node) === property;
  const canvasDeclaration = (statement) => {
    const declarator = statement?.type === 'VariableDeclaration' && statement.kind === 'const'
      && statement.declarations.length === 1 ? statement.declarations[0] : null;
    if (declarator?.id?.type !== 'ObjectPattern' || declarator.id.properties.length !== 2
      || declarator.init?.type !== 'CallExpression' || !identifier(declarator.init.callee, 'newCanvas')
      || declarator.init.arguments.length !== 0) return false;
    const names = [];
    bindingNames(declarator.id, names);
    return names.length === 2 && names[0] === 'cv' && names[1] === 'c';
  };
  const inkDeclaration = (statement) => {
    const declarator = declaration(statement, 'ink');
    return statement?.kind === 'const' && declarator?.init?.type === 'CallExpression'
      && identifier(declarator.init.callee, 'newInk') && declarator.init.arguments.length === 0;
  };
  const paintsInk = (call) => call?.type === 'CallExpression'
    && call.arguments.length > 0 && exactMember(call.arguments[0], 'ink', 'c');
  const fitsInkToCanvas = (statement) => {
    const call = callStatement(statement);
    return identifier(call?.callee, 'fitInk') && call.arguments.length === 3
      && exactMember(call.arguments[0], 'ink', 'cv') && identifier(call.arguments[1], 'c');
  };
  const exactCall = (statement, expected) => {
    const call = callStatement(statement);
    return call && source.slice(call.start, call.end) === expected;
  };
  const exactFit = (statement, tag) => fitsInkToCanvas(statement)
    && source.slice(callStatement(statement).arguments[2].start, callStatement(statement).arguments[2].end) === tag;
  const exactTypes = (statements, types, where) => {
    if (statements.length !== types.length
      || statements.some((statement, index) => statement.type !== types[index])) {
      contractError(statements[0] ?? matches[0].body, `${where} statement shape is not the audited route path`);
    }
  };
  const kingdomTest = (node, kingdom) => node?.type === 'BinaryExpression' && node.operator === '==='
    && identifier(node.left, 'kingdom') && literal(node.right, kingdom);
  const directKingdomBranch = (statements, kingdom) => {
    const found = statements.filter((statement) => statement.type === 'IfStatement'
      && kingdomTest(statement.test, kingdom) && statement.consequent?.type === 'BlockStatement');
    if (found.length !== 1) contractError(found[0] ?? matches[0].body, `expected one direct ${kingdom} route branch`);
    return found[0];
  };

  const body = matches[0].body.body;
  if (!(matches[0].params.length === 1 && identifier(matches[0].params[0], 'g'))) {
    contractError(matches[0], 'resolveOverride must have only its audited g parameter');
  }
  for (const globalName of ['Object', 'String', 'Boolean']) {
    if (writtenNames(label).has(globalName) || moduleBindings(label).has(globalName)) {
      contractError(matches[0], `trusted built-in ${globalName} is shadowed or reassigned`);
    }
  }
  const helperProvenance = new Map([
    ['isEarthKingdom', ['speciesoverrides.ts', 'isEarthKingdom']],
    ['hasNamedRoute', ['speciesoverrides.ts', 'hasNamedRoute']],
    ['lineageRenderKingdom', ['speciesoverrides.ts', 'lineageRenderKingdom']],
    ['resolveProcedural', ['speciesoverrides.ts', 'resolveProcedural']],
    ['newCanvas', ['speciesoverrides.ts', 'newCanvas']],
    ['newInk', ['speciesoverrides.ts', 'newInk']],
    ['fitInk', ['speciesoverrides.ts', 'fitInk']],
    ['palette', ['speciesoverrides.ts', 'palette']],
    ['vignette', ['speciesoverrides.ts', 'vignette']],
    ['floorFade', ['speciesoverrides.ts', 'floorFade']],
    ['floraLadder', ['floraoverrides.ts', 'floraLadder']],
    ['faunaQuadruped', ['quadrupedoverrides.ts', 'faunaQuadruped']],
  ]);
  const exactHelperImplementations = new Map([
    ['newCanvas', '4cc8d2bbcf61aa856a91cc41de06f0c0a3439bc3aae844279a703b031d091767'],
    ['newInk', '6d4f4e49abf74f243aadaf196c3ec273dc7ab104a3de90f8e3ec136bc6309a3a'],
    ['fitInk', '2146842c7bccbd9994870c2034be794cf5fd8057a2c0899ace2a7b40785a46b7'],
  ]);
  const exactCanvasDependencies = new Map([
    ['S', '440'],
    ['FIT_MARGIN', '0.90'],
    ['INK', 'S * 2'],
    ['INK_OFF', 'S * 0.5'],
  ]);
  for (const [dependency, expectedInitializer] of exactCanvasDependencies) {
    const binding = bindingFor(label, dependency);
    if (!(stableBinding(binding) && binding.kind === 'variable' && binding.label === label
        && source.slice(binding.node.init?.start, binding.node.init?.end) === expectedInitializer)) {
      contractError(binding?.node ?? matches[0], `canvas dependency ${dependency} changed from its audited initializer`);
    }
  }
  for (const [helper, [expectedLabel, expectedName]] of helperProvenance) {
    const binding = bindingFor(label, helper);
    if (!(stableBinding(binding) && binding.kind === 'function'
        && !binding.node.async && !binding.node.generator
        && binding.label === expectedLabel && binding.name === expectedName)) {
      contractError(binding?.node ?? matches[0], `route helper ${helper} is not its stable exact function binding`);
    }
    const implementationHash = exactHelperImplementations.get(helper);
    if (implementationHash
        && nodeSha256(src('packages/art/src/' + binding.label), binding.node) !== implementationHash) {
      contractError(binding.node, `route helper ${helper} implementation changed from its audited canvas contract`);
    }
  }
  exactTypes(body, [
    'VariableDeclaration', 'VariableDeclaration', 'VariableDeclaration', 'VariableDeclaration',
    'VariableDeclaration', 'IfStatement', 'IfStatement', 'VariableDeclaration', 'IfStatement',
    'IfStatement', 'IfStatement', 'VariableDeclaration', 'IfStatement', 'VariableDeclaration',
    'ExpressionStatement', 'ExpressionStatement', 'VariableDeclaration', 'ExpressionStatement',
    'ExpressionStatement', 'ReturnStatement',
  ], 'resolveOverride');
  const prelude = [
    ['earthName', `String((g as { _earthName?: string })._earthName || '').replace(/[’‘]/g, "'")`],
    ['blend', `String((g as { _earthBlend?: string })._earthBlend || '').replace(/[’‘]/g, "'")`],
    ['genomeKingdom', `isEarthKingdom(g.kingdom) ? g.kingdom : 'fauna'`],
    ['kingdom', 'earthName ? genomeKingdom : lineageRenderKingdom(g)'],
    ['name', `earthName || (kingdom === 'flora' || kingdom === 'fungi' || kingdom === 'microbe' ? blend : '')`],
  ];
  for (let index = 0; index < prelude.length; index++) {
    const [name, expected] = prelude[index];
    const declarator = declaration(body[index], name);
    if (!declarator || source.slice(declarator.init?.start, declarator.init?.end) !== expected) {
      contractError(body[index], `${name} route input changed`);
    }
  }
  if (!(body[5].test?.type === 'LogicalExpression' && body[5].test.operator === '&&'
      && notIdentifier(body[5].test.left, 'name') && identifier(body[5].test.right, 'blend')
      && returnNull(body[5].consequent) && !body[5].alternate)) {
    contractError(body[5], 'named-route blend guard changed');
  }
  if (!(notIdentifier(body[6].test, 'name') && body[6].consequent?.type === 'ReturnStatement'
      && body[6].consequent.argument?.type === 'CallExpression'
      && identifier(body[6].consequent.argument.callee, 'resolveProcedural')
      && body[6].consequent.argument.arguments.length === 1
      && identifier(body[6].consequent.argument.arguments[0], 'g') && !body[6].alternate)) {
    contractError(body[6], 'procedural fallthrough guard changed');
  }

  const canonDeclarator = declaration(body[7], 'canon');
  const canonIf = body[8];
  const floraIf = directKingdomBranch(body, 'flora');
  const faunaIf = directKingdomBranch(body, 'fauna');
  const painterDeclarator = declaration(body[11], 'painter');
  if (floraIf !== body[9] || faunaIf !== body[10]) {
    contractError(body[9], 'kingdom route branches changed order or scope');
  }
  const expectedDirectSelectors = new Map([
    ['canon', canonDeclarator],
    ['iconic', declaration(floraIf.consequent.body[0], 'iconic')],
    ['dupe', declaration(floraIf.consequent.body[1], 'dupe')],
    ['fp', declaration(faunaIf.consequent.body[0], 'fp')],
    ['quad', declaration(faunaIf.consequent.body[1], 'quad')],
    ['painter', painterDeclarator],
  ]);
  if (selectors.size !== selectorNames.size
    || [...expectedDirectSelectors].some(([name, node]) => !node || selectors.get(name) !== node)) {
    contractError(matches[0].body, 'selectors are not declared exactly once on their audited executable branches');
  }

  const validatedResolverAccesses = new Set();
  const directLookup = (node, record = false) => {
    if (node?.type === 'CallExpression' && node.callee?.type === 'MemberExpression'
      && node.callee.object?.type === 'Identifier' && node.callee.object.name === 'FLORA_DUPES'
      && !node.callee.computed && propertyName(node.callee) === 'includes'
      && node.arguments.length === 1 && node.arguments[0]?.type === 'Identifier'
      && node.arguments[0].name === 'name') {
      if (record) validatedResolverAccesses.add(node.callee);
      return 'FLORA_DUPES';
    }
    if (node?.type !== 'MemberExpression' || node.object?.type !== 'Identifier' || !node.computed) return null;
    const table = node.object.name;
    if (!isRouteTable(table)) return null;
    const valid = table === 'CANON' ? isCanonIndex(node.property) : isNameIndex(node.property);
    if (!valid) return null;
    if (record) validatedResolverAccesses.add(node);
    return table;
  };
  const orLeaves = (node) => node?.type === 'LogicalExpression' && node.operator === '||'
    ? [...orLeaves(node.left), ...orLeaves(node.right)] : [node];

  const namedRoute = namedRouteMatches[0];
  const namedBody = namedRoute.body.body;
  exactTypes(namedBody, ['IfStatement', 'IfStatement', 'IfStatement', 'ReturnStatement'], 'hasNamedRoute');
  if (!(namedRoute.params.length === 2 && identifier(namedRoute.params[0], 'kingdom')
      && identifier(namedRoute.params[1], 'name'))) {
    contractError(namedRoute, 'hasNamedRoute parameters changed');
  }
  const trueReturn = (statement) => statement?.type === 'ReturnStatement' && literal(statement.argument, true);
  const booleanArgument = (statement) => {
    const call = statement?.type === 'ReturnStatement' ? statement.argument : null;
    return call?.type === 'CallExpression' && identifier(call.callee, 'Boolean')
      && call.arguments.length === 1 ? call.arguments[0] : null;
  };
  const exactLookupSet = (expression, expected, where) => {
    const found = new Set();
    for (const leaf of orLeaves(expression)) {
      const table = directLookup(leaf);
      if (!table || found.has(table)) contractError(leaf, `${where} contains an unsupported or repeated lookup`);
      found.add(table);
    }
    if (found.size !== expected.size || [...expected].some((table) => !found.has(table))) {
      contractError(expression, `${where} does not inspect the exact audited route tables`);
    }
  };
  if (!(directLookup(namedBody[0].test) === 'CANON' && trueReturn(namedBody[0].consequent)
      && !namedBody[0].alternate)) {
    contractError(namedBody[0], 'hasNamedRoute CANON ownership check changed');
  }
  if (!(kingdomTest(namedBody[1].test, 'flora') && !namedBody[1].alternate)) {
    contractError(namedBody[1], 'hasNamedRoute flora branch changed');
  }
  exactLookupSet(booleanArgument(namedBody[1].consequent),
    new Set(['FLORA_ICONIC', 'FLORA2_SPEC', 'FLORA_DUPES']), 'hasNamedRoute flora branch');
  if (!(kingdomTest(namedBody[2].test, 'fauna') && !namedBody[2].alternate)) {
    contractError(namedBody[2], 'hasNamedRoute fauna branch changed');
  }
  exactLookupSet(booleanArgument(namedBody[2].consequent),
    new Set(['FAUNA_NAME', 'FAUNA2_NAME', 'FAUNA3_NAME', 'BIRD_NAME', 'INVERT_NAME', 'QUAD_SPEC', 'QUAD2_SPEC']),
    'hasNamedRoute fauna branch');
  const terminal = booleanArgument(namedBody[3]);
  if (!(terminal?.type === 'ConditionalExpression' && kingdomTest(terminal.test, 'fungi')
      && directLookup(terminal.consequent) === 'FUNGI_NAME'
      && directLookup(terminal.alternate) === 'MICROBE_NAME')) {
    contractError(namedBody[3], 'hasNamedRoute fungi/microbe ownership branch changed');
  }

  const tableReads = new Set();
  const addOrSelector = (name, expectedOrder) => {
    const init = selectors.get(name)?.init;
    if (!init) contractError(selectors.get(name), `${name} has no initializer`);
    const leaves = orLeaves(init);
    const found = new Set();
    let previousIndex = -1;
    for (let index = 0; index < leaves.length; index++) {
      const leaf = leaves[index];
      const table = directLookup(leaf, true);
      if (!table) contractError(leaf, `${name} contains a non-route or unsupported lookup`);
      const expectedIndex = expectedOrder.indexOf(table);
      if (expectedIndex < 0 || expectedIndex <= previousIndex) contractError(leaf, `${name} route lookup order changed`);
      previousIndex = expectedIndex;
      if (found.has(table)) contractError(leaf, `${name} reads ${table} more than once`);
      found.add(table);
      tableReads.add(table);
    }
  };
  if (directLookup(canonDeclarator.init, true) !== 'CANON') contractError(canonDeclarator, 'canon is not the exact kingdom-qualified CANON lookup');
  tableReads.add('CANON');
  addOrSelector('iconic', FLORA_SELECTOR_ORDER);
  const dupe = selectors.get('dupe').init;
  if (!(dupe?.type === 'LogicalExpression' && dupe.operator === '&&'
      && notIdentifier(dupe.left, 'iconic') && directLookup(dupe.right, true) === 'FLORA_DUPES')) {
    contractError(dupe, 'dupe must be gated by !iconic and the exact FLORA_DUPES.includes(name) lookup');
  }
  tableReads.add('FLORA_DUPES');
  addOrSelector('fp', FAUNA_SELECTOR_ORDER);
  const quad = selectors.get('quad').init;
  if (!(quad?.type === 'ConditionalExpression' && notIdentifier(quad.test, 'fp')
      && identifier(quad.alternate, 'undefined'))) {
    contractError(quad, 'quad must be the !fp-gated quadruped fallback');
  }
  const quadLeaves = orLeaves(quad.consequent);
  const quadTables = new Set();
  let previousQuadIndex = -1;
  for (let index = 0; index < quadLeaves.length; index++) {
    const leaf = quadLeaves[index];
    const table = directLookup(leaf, true);
    if (!table) contractError(leaf, 'quad contains a non-route or unsupported lookup');
    const expectedIndex = QUAD_SELECTOR_ORDER.indexOf(table);
    if (expectedIndex < 0 || expectedIndex <= previousQuadIndex) contractError(leaf, 'quad route lookup order changed');
    previousQuadIndex = expectedIndex;
    if (quadTables.has(table)) contractError(leaf, `quad reads ${table} more than once`);
    quadTables.add(table);
    tableReads.add(table);
  }
  const painter = selectors.get('painter').init;
  if (!(painter?.type === 'ConditionalExpression' && kingdomTest(painter.test, 'fungi')
      && directLookup(painter.consequent, true) === 'FUNGI_NAME'
      && painter.alternate?.type === 'ConditionalExpression'
      && kingdomTest(painter.alternate.test, 'microbe')
      && directLookup(painter.alternate.consequent, true) === 'MICROBE_NAME'
      && identifier(painter.alternate.alternate, 'undefined'))) {
    contractError(painter, 'painter must preserve the fungi/microbe lookup chain');
  }
  tableReads.add('FUNGI_NAME');
  tableReads.add('MICROBE_NAME');

  const auditResolverAccesses = (node) => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'MemberExpression' && routeRoot(node)
      && !validatedResolverAccesses.has(node)) {
      contractError(node, 'resolveOverride contains a route-table member outside the audited selector initializers');
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (const child of value) if (child && typeof child === 'object' && child.type) auditResolverAccesses(child);
      } else if (value && typeof value === 'object' && value.type) {
        auditResolverAccesses(value);
      }
    }
  };
  auditResolverAccesses(matches[0].body);

  exactTypes(canonIf.consequent?.body || [], [
    'VariableDeclaration', 'ExpressionStatement', 'ExpressionStatement', 'VariableDeclaration',
    'ExpressionStatement', 'ExpressionStatement', 'ReturnStatement',
  ], 'canon consumer');
  const canonCall = callStatement(canonIf.consequent.body[4]);
  if (!(identifier(canonIf.test, 'canon') && !canonIf.alternate
      && canvasDeclaration(canonIf.consequent.body[0])
      && exactCall(canonIf.consequent.body[1], "vignette(c, kingdom === 'fungi')")
      && exactCall(canonIf.consequent.body[2], 'floorFade(c)')
      && inkDeclaration(canonIf.consequent.body[3])
      && identifier(canonCall?.callee, 'canon') && paintsInk(canonCall)
      && source.slice(canonCall.start, canonCall.end) === 'canon(ink.c, g, palette(g) as Pal)'
      && exactFit(canonIf.consequent.body[5], "kingdom + ':' + name")
      && returnDataUrl(canonIf.consequent.body[6]))) {
    contractError(canonIf, 'canon lookup is not the guarded painter that feeds the returned canvas');
  }

  const floraBody = floraIf.consequent.body;
  exactTypes(floraBody, [
    'VariableDeclaration', 'VariableDeclaration', 'IfStatement', 'VariableDeclaration',
    'ExpressionStatement', 'ExpressionStatement', 'VariableDeclaration', 'ExpressionStatement',
    'ExpressionStatement', 'ReturnStatement',
  ], 'flora consumer');
  const floraCall = callStatement(floraBody[7]);
  if (!(andNot(floraBody[2].test, 'iconic', 'dupe') && returnNull(floraBody[2].consequent)
      && !floraBody[2].alternate
      && floraCall?.callee?.type === 'LogicalExpression' && floraCall.callee.operator === '||'
      && identifier(floraCall.callee.left, 'iconic') && identifier(floraCall.callee.right, 'floraLadder')
      && canvasDeclaration(floraBody[3]) && exactCall(floraBody[4], 'vignette(c, false)')
      && exactCall(floraBody[5], 'floorFade(c)') && inkDeclaration(floraBody[6]) && paintsInk(floraCall)
      && source.slice(floraCall.start, floraCall.end) === '(iconic || floraLadder)(ink.c, g, palette(g) as Pal, name)'
      && exactFit(floraBody[8], "'flora:' + name")
      && returnDataUrl(floraBody[9]))) {
    contractError(floraIf, 'flora selectors do not guard and feed the returned painter');
  }

  const faunaBody = faunaIf.consequent.body;
  exactTypes(faunaBody, [
    'VariableDeclaration', 'VariableDeclaration', 'IfStatement', 'VariableDeclaration',
    'ExpressionStatement', 'ExpressionStatement', 'VariableDeclaration', 'IfStatement',
    'ExpressionStatement', 'ReturnStatement',
  ], 'fauna consumer');
  const faunaDispatch = faunaBody[7];
  const fpCall = faunaDispatch.consequent?.type === 'ExpressionStatement'
    ? faunaDispatch.consequent.expression : null;
  const quadCall = faunaDispatch.alternate?.type === 'ExpressionStatement'
    ? faunaDispatch.alternate.expression : null;
  const quadArgument = quadCall?.arguments?.[3];
  if (!(andNot(faunaBody[2].test, 'fp', 'quad') && returnNull(faunaBody[2].consequent)
      && !faunaBody[2].alternate
      && identifier(faunaDispatch.test, 'fp') && fpCall?.type === 'CallExpression'
      && identifier(fpCall.callee, 'fp') && paintsInk(fpCall) && quadCall?.type === 'CallExpression'
      && identifier(quadCall.callee, 'faunaQuadruped')
      && paintsInk(quadCall)
      && source.slice(fpCall.start, fpCall.end) === 'fp(ink.c, g, palette(g) as Pal, name)'
      && source.slice(quadCall.start, quadCall.end) === 'faunaQuadruped(ink.c, g, palette(g) as Pal, quad!, name)'
      && quadArgument?.type === 'TSNonNullExpression' && identifier(quadArgument.expression, 'quad')
      && canvasDeclaration(faunaBody[3]) && exactCall(faunaBody[4], 'vignette(c, false)')
      && exactCall(faunaBody[5], 'floorFade(c)') && inkDeclaration(faunaBody[6])
      && exactFit(faunaBody[8], "'fauna:' + name")
      && returnDataUrl(faunaBody[9]))) {
    contractError(faunaIf, 'fauna selectors do not guard and feed the painter/fallback that returns the canvas');
  }

  const tail = body.slice(11);
  exactTypes(tail, [
    'VariableDeclaration', 'IfStatement', 'VariableDeclaration', 'ExpressionStatement',
    'ExpressionStatement', 'VariableDeclaration', 'ExpressionStatement', 'ExpressionStatement',
    'ReturnStatement',
  ], 'fungi/microbe consumer');
  const painterCall = callStatement(tail[6]);
  if (!(notIdentifier(tail[1].test, 'painter') && returnNull(tail[1].consequent)
      && !tail[1].alternate && canvasDeclaration(tail[2])
      && exactCall(tail[3], "vignette(c, kingdom === 'fungi')") && exactCall(tail[4], 'floorFade(c)')
      && inkDeclaration(tail[5])
      && identifier(painterCall?.callee, 'painter') && paintsInk(painterCall)
      && source.slice(painterCall.start, painterCall.end) === 'painter(ink.c, g, palette(g))'
      && exactFit(tail[7], "kingdom + ':' + name")
      && returnDataUrl(tail[8]))) {
    contractError(tail[1], 'fungi/microbe selector does not guard and feed the returned painter');
  }

  const referenceCounts = new Map([...selectorNames].map((name) => [name, 0]));
  const countReferences = (node, parent = null) => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'Identifier' && selectorNames.has(node.name)
      && !(parent?.type === 'VariableDeclarator' && parent.id === node)) {
      referenceCounts.set(node.name, referenceCounts.get(node.name) + 1);
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (const child of value) if (child && typeof child === 'object' && child.type) countReferences(child, node);
      } else if (value && typeof value === 'object' && value.type) {
        countReferences(value, node);
      }
    }
  };
  countReferences(matches[0].body);
  const expectedReferences = new Map([
    ['canon', 2], ['iconic', 3], ['dupe', 1], ['fp', 4], ['quad', 2], ['painter', 2],
  ]);
  for (const [name, expected] of expectedReferences) {
    if (referenceCounts.get(name) !== expected) {
      contractError(selectors.get(name), `${name} has ${referenceCounts.get(name)} uses; expected ${expected} audited selector uses`);
    }
  }
  return { tableReads, imports };
}

const tableOwners = new Map();
for (const f of FILES) {
  const t = src('packages/art/src/' + f);
  let parsedTables;
  try {
    parsedTables = routeTables(t, f);
  } catch (error) {
    if (!(error instanceof ParserError)) throw error;
    console.error(`overridecheck: ${error.message} — the PARSER is broken`);
    process.exit(2);
  }
  /* module-PRIVATE tables count too: FUNGI_NAME and MICROBE_NAME are not
     exported, and an `export const`-only scan silently skipped both — the
     tool would have reported "fungi 0" as if wave 1 had never happened. */
  for (const { table, keys: tableKeys } of parsedTables) {
    if (tableOwners.has(table)) {
      console.error(`overridecheck: ${table} route table has multiple declaration owners: ${tableOwners.get(table)} and ${f} — the PARSER is broken`);
      process.exit(2);
    }
    tableOwners.set(table, f);
    /* ★ WAVE 42, CODE PASS — CANON WAS NEVER PARSED. The filter matched
       NAME/ICONIC/DUPES/SPEC, so the HIGHEST-priority table — the one that
       shadows everything else — was the one this shadow check could not see.
       Nine species shipped keyed in both CANON and a lower table (five in
       faunaoverrides, six in florarost, two in floraoverrides, three in
       speciesoverrides, four in invertoverrides across the audits' counts),
       each lower row a live-looking painter that never runs and silently
       reactivates wrong if the CANON key is ever renamed — the documented
       Insect-Eating Bat hazard, at scale. One home per name. */
    /* CANON keys carry their own kingdom ('fauna|Caiman'); every other table
       gets its kingdom from the classification map */
    const canon = table === 'CANON';
    const kingdom = canon ? null : TABLE_KINGDOM[table];
    if (!canon && !kingdom) { unclassified.push(`${f}:${table}`); continue; }
    const seen = new Set();
    for (const k0 of tableKeys) {
      const canonical = k0.replace(/[’‘]/g, "'");
      if (k0 !== canonical) {
        console.error(`overridecheck: ${f}:${table} key ${JSON.stringify(k0)} is not runtime-canonical; use ${JSON.stringify(canonical)} — the PARSER is broken`);
        process.exit(2);
      }
      let n = k0;
      let kdm = kingdom;
      if (canon) {
        const bar = n.indexOf('|');
        if (bar < 0) {
          console.error(`overridecheck: ${f}:CANON key ${JSON.stringify(n)} has no kingdom separator — the PARSER is broken`);
          process.exit(2);
        }
        kdm = n.slice(0, bar); n = n.slice(bar + 1);
      }
      /* Every literal key is a claim, including empty, one-character and
         non-ASCII names. The former length/Latin-letter heuristic silently
         discarded those keys after the AST had correctly discovered them. */
      const kk = routeId(kdm, n);
      /* a repeated key is not an error in JS — the LAST one silently wins,
         so a painter can be written, listed, and never once called */
      /* ⚠ key `seen` by KINGDOM+name, not name. CANON deliberately carries
         the four cross-kingdom organisms twice — 'flora|Green Algae' AND
         'microbe|Green Algae' — which is the whole point of that table, and
         keying on the bare name reported all four as duplicates. The
         instrument's own false positive, on its first run. Again. */
      if (seen.has(kk)) dupes.push(`${n}  [${f}:${table}]`);
      seen.add(kk);
      /* THE THIRD KIND OF DEAD ROUTE: the same species keyed in two tables
         OF THE SAME KINGDOM. resolveOverride consults them in a fixed order,
         so the later table's painter never runs — and both keys resolve to a
         real species, which is why the dead-route check alone cannot see it.
         Wave 9 wrote a swan-necked Swan that wave 3's plain Swan shadowed. */
      const owner = `${f}:${table}`;
      const existing = keys.get(kk);
      if (existing && existing.owner !== owner) {
        const priority = TABLE_PRIORITY[table];
        if (!Number.isInteger(priority) || priority === existing.priority) {
          console.error(`overridecheck: cannot order route owners ${existing.owner} and ${owner} — the PARSER is broken`);
          process.exit(2);
        }
        const winner = priority < existing.priority ? { owner, priority } : existing;
        const loser = priority < existing.priority ? existing : { owner, priority };
        shadowed.push(`${n} (${kdm})  [${winner.owner} SHADOWS ${loser.owner}]`);
        keys.set(kk, winner);
      } else if (!existing) {
        const priority = TABLE_PRIORITY[table];
        if (!Number.isInteger(priority)) {
          console.error(`overridecheck: ${table} has no audited resolver priority — the PARSER is broken`);
          process.exit(2);
        }
        keys.set(kk, { owner, priority });
      }
    }
  }
}
/* IS THE TABLE ACTUALLY WIRED? A fourth blindness class, and the costliest
   yet: wave 11's FLORA2_SPEC was imported into speciesoverrides.ts and never
   consulted by resolveOverride. Every key resolved to a real catalog
   species, so this tool reported 927/927 with 0 dead — while all 280 of its
   routes were unreachable. "The key names a real species" and "the router
   ever looks at this table" are DIFFERENT CLAIMS, and only the second one
   makes a painter run. The duplicate sentinel was the only thing that
   noticed, and only because retiring the superseded anti-duplicate entries
   regressed 15 pairs. */
{
  const router = src('packages/art/src/speciesoverrides.ts');
  let wiring;
  try {
    wiring = routerWiring(router, 'speciesoverrides.ts', 'resolveOverride');
  } catch (error) {
    if (!(error instanceof ParserError)) throw error;
    console.error(`overridecheck: ${error.message} — the PARSER is broken`);
    process.exit(2);
  }
  for (const table of new Set([...wiring.tableReads, ...wiring.imports.keys()])) {
    if (!tableOwners.has(table)) {
      console.error(`overridecheck: ${table} is imported/read by resolveOverride but has no declaration owner in scanned art sources — the PARSER is broken`);
      process.exit(2);
    }
  }
  for (const [table, owner] of tableOwners) {
    if (!wiring.tableReads.has(table) || owner === 'speciesoverrides.ts') continue;
    const importedOwner = wiring.imports.get(table);
    if (!importedOwner || importedOwner !== owner) {
      console.error(`overridecheck: ${table} is read by resolveOverride from ${importedOwner || 'no import'}, but its only declaration owner is ${owner} — the PARSER is broken`);
      process.exit(2);
    }
    const exported = exportedBindingFor(owner, table);
    if (!(exported?.label === owner && exported?.name === table && exported.kind === 'variable'
        && stableBinding(exported))) {
      console.error(`overridecheck: ${owner} does not export ${table} from its exact stable table declaration — the PARSER is broken`);
      process.exit(2);
    }
  }
  const unwired = [...tableOwners.keys()].filter((table) => !wiring.tableReads.has(table));
  if (unwired.length) {
    console.error('  ★ UNWIRED TABLES — every key resolves, but resolveOverride never consults them:');
    for (const u of unwired) console.error('    ' + u + '   (imported but never read — all its routes are dead)');
    process.exitCode = 1;
  }
}
if (keys.size < 150) { console.error('overridecheck: only ' + keys.size + ' table keys found — the PARSER is broken'); process.exit(2); }

/* the nearest real name, so a dead route says what it probably meant */
function nearest(n) {
  const low = n.toLowerCase();
  let best = null, bs = 0;
  for (const c of catalog) {
    const cl = c.toLowerCase();
    let s = 0;
    if (cl === low) s = 100;
    else if (cl.includes(low) || low.includes(cl)) s = 60 + Math.min(cl.length, low.length);
    else { const w = low.split(' '); s = w.filter((x) => x.length > 3 && cl.includes(x)).length * 20; }
    if (s > bs) { bs = s; best = c; }
  }
  return bs >= 20 ? best : null;
}

if (shadowed.length) {
  console.error('  ★ SHADOWED ROUTES — the same species keyed in two tables; only the first runs:');
  for (const s of shadowed) console.error('    ' + s);
}
if (dupes.length) {
  console.error('  ★ DUPLICATE TABLE KEYS — the later entry silently wins:');
  for (const d of dupes) console.error('    ' + d);
}
/* a key is dead if its species is absent from the catalog ENTIRELY, or
   present but not in the kingdom whose table claims it (a flora painter for
   a microbe is never reached — resolveOverride branches on kingdom first) */
const dead = [...keys.keys()].filter((kk) => { const [k, n] = routeParts(kk); return !(kingdomsOf.get(n) || new Set()).has(k); })
  .map((kk) => { const [k, n] = routeParts(kk); return n + '  (' + k + ')'; }).sort();
const live = keys.size - dead.length;
const byKingdom = {};
for (const kk of keys.keys()) { const [k, n] = routeParts(kk); if ((kingdomsOf.get(n) || new Set()).has(k)) byKingdom[k] = (byKingdom[k] || 0) + 1; }
console.log(`OVERRIDE CHECK: ${keys.size} table keys · ${live} reach a real catalog species · ${dead.length} dead`);
/* ★ WAVE 42 — THE COVERAGE FIGURE READ 100.4%, which is not a possible
   percentage and is the tell. `live` counts kingdom|name ROUTES while
   catalog.size counts unique NAMES, and the four cross-kingdom organisms
   (Green Algae, Snow Algae, Reindeer Lichen, Tardigrade) legitimately own two
   routes each. Comparing routes to names inflated every coverage number this
   tool has ever printed — including the ones quoted in the handoffs. Count
   unique species covered against unique species, and report the route total
   separately so both numbers stay honest. */
const covered = new Set([...keys.keys()]
  .filter((kk) => { const [k, n] = routeParts(kk); return (kingdomsOf.get(n) || new Set()).has(k); })
  .map((kk) => routeParts(kk)[1]));
console.log('  coverage: ' + Object.entries(byKingdom).sort().map(([k, v]) => `${k} ${v}`).join(' · ')
  + ` = ${covered.size}/${catalog.size} Earth species (${(covered.size / catalog.size * 100).toFixed(1)}%)`
  + `  ·  ${live} routes (the 4 cross-kingdom organisms own two each)`);
const expectedRoutes = new Set();
for (const [name, kingdoms] of kingdomsOf) {
  for (const kingdom of kingdoms) expectedRoutes.add(routeId(kingdom, name));
}
const missingRoutes = [...expectedRoutes].filter((id) => !keys.has(id))
  .map((id) => routeParts(id)).sort(([ka, na], [kb, nb]) => na.localeCompare(nb) || ka.localeCompare(kb));
if (missingRoutes.length) {
  console.error(`  ★ INCOMPLETE ROUTE COVERAGE — ${missingRoutes.length} kingdom-qualified catalog routes have no live override:`);
  for (const [kingdom, name] of missingRoutes) {
    console.error(`    ${name}  (${kingdom})`);
  }
  process.exitCode = 1;
}
if (unclassified.length) {
  console.error('  ★ UNCLASSIFIED TABLE — this tool does not know which kingdom branch serves it, so its keys went UNCHECKED:');
  for (const u of unclassified) console.error('    ' + u + '   (add it to TABLE_KINGDOM)');
}
if (dead.length || dupes.length || shadowed.length || unclassified.length) {
  if (!dead.length) process.exit(1);
  console.error('  ★ DEAD OVERRIDE ROUTES — painter written, species does not exist:');
  for (const n of dead) {
    const near = nearest(n.split('  (')[0]);
    console.error(`    ${n}` + (near ? `  → did you mean "${near}"?` : '  → not in this kingdom'));
  }
  process.exit(1);
}
