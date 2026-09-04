/* Grammar-aware JavaScript dependency inventory for generated Worker entries.
   es-module-lexer owns every ESM import form (including comment-separated,
   computed, source-phase and deferred syntax). The pinned Acorn parser adds
   direct and global-qualified Worker/SharedWorker and importScripts loader
   detection without confusing comments, strings, regexes or template text. */
import { ImportType, initSync, parse } from 'es-module-lexer';
import { parse as parseJavaScript } from 'acorn';

initSync();

const DYNAMIC_IMPORT_TYPES = new Set([
  ImportType.Dynamic,
  ImportType.DynamicSourcePhase,
  ImportType.DynamicDeferPhase,
]);

const STATIC_IMPORT_TYPES = new Set([
  ImportType.Static,
  ImportType.StaticSourcePhase,
  ImportType.StaticDeferPhase,
]);

const freezeEdge = (kind, position, specifier = null) => Object.freeze({
  kind,
  position,
  specifier,
});

export function javascriptModuleImports(source) {
  if (typeof source !== 'string') throw new TypeError('JavaScript module source must be a string');
  let imports;
  try {
    [imports] = parse(source);
  } catch (error) {
    throw new Error(`Unable to lex generated JavaScript module: ${error instanceof Error ? error.message : String(error)}`);
  }
  return Object.freeze(imports.flatMap((record) => {
    const kind = DYNAMIC_IMPORT_TYPES.has(record.t)
      ? 'module-dynamic'
      : STATIC_IMPORT_TYPES.has(record.t)
        ? 'module-static'
        : null;
    if (kind === null) return [];
    return [freezeEdge(
      kind,
      Number.isSafeInteger(record.ss) && record.ss >= 0 ? record.ss : record.s,
      typeof record.n === 'string' ? record.n : null,
    )];
  }));
}

const unwrappedExpression = (node) => {
  let current = node;
  while (current?.type === 'ChainExpression'
    || current?.type === 'SequenceExpression') {
    current = current.type === 'ChainExpression'
      ? current.expression
      : current.expressions.at(-1);
  }
  return current;
};

const memberPropertyName = (node) => {
  if (node?.type !== 'MemberExpression') return null;
  if (!node.computed && node.property?.type === 'Identifier') return node.property.name;
  if (node.computed && node.property?.type === 'Literal'
    && typeof node.property.value === 'string') return node.property.value;
  return null;
};

const globalReferenceName = (node) => {
  const current = unwrappedExpression(node);
  if (current?.type === 'Identifier') return current.name;
  if (current?.type !== 'MemberExpression') return null;
  const owner = unwrappedExpression(current.object);
  if (owner?.type !== 'Identifier'
    || (owner.name !== 'self' && owner.name !== 'globalThis')) return null;
  return memberPropertyName(current);
};

const calledGlobalReferenceName = (node) => {
  const current = unwrappedExpression(node);
  const direct = globalReferenceName(current);
  if (direct !== null) return direct;
  if (current?.type !== 'MemberExpression') return null;
  const operation = memberPropertyName(current);
  if (operation !== 'call' && operation !== 'apply') return null;
  return globalReferenceName(current.object);
};

const runtimeLoaderEdges = (source) => {
  let root;
  try {
    root = parseJavaScript(source, {
      allowHashBang: true,
      ecmaVersion: 'latest',
      sourceType: 'module',
    });
  } catch (error) {
    throw new Error(
      `Unable to parse generated JavaScript module for runtime loaders: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  const edges = [];
  const pending = [root];
  while (pending.length > 0) {
    const node = pending.pop();
    if (!node || typeof node !== 'object') continue;
    if (node.type === 'NewExpression') {
      const name = globalReferenceName(node.callee);
      if (name === 'Worker' || name === 'SharedWorker') {
        edges.push(freezeEdge(
          name === 'Worker' ? 'nested-worker' : 'nested-shared-worker',
          Number.isSafeInteger(node.start) ? node.start : 0,
        ));
      }
    } else if (node.type === 'CallExpression'
      && calledGlobalReferenceName(node.callee) === 'importScripts') {
      edges.push(freezeEdge(
        'import-scripts',
        Number.isSafeInteger(node.start) ? node.start : 0,
      ));
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (let index = value.length - 1; index >= 0; index--) {
          if (value[index]?.type) pending.push(value[index]);
        }
      } else if (value?.type) {
        pending.push(value);
      }
    }
  }
  return edges;
};

export function sealedWorkerJavaScriptDependencyEdges(source) {
  const moduleEdges = javascriptModuleImports(source);
  // A module edge already violates the sealed-worker invariant, so return it
  // without feeding proposal syntax newer than Acorn through the loader parser.
  const edges = moduleEdges.length === 0 ? runtimeLoaderEdges(source) : moduleEdges;
  return Object.freeze(edges.sort((left, right) => left.position - right.position));
}
