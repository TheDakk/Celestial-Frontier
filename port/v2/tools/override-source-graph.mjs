import fs from 'node:fs';
import path from 'node:path';

const EXECUTABLE = /\.(?:[cm]?ts|tsx|[cm]?js|jsx)$/;
const DECLARATION = /\.d\.(?:[cm]?ts|tsx)$/;
const inside = (directory, target) => {
  const relative = path.relative(directory, target);
  return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
};

/** Extend the recursively discovered art sources through their actual static
 * relative imports/re-exports. Every unsealed dependency returns to the caller's
 * same AST audit; being outside the art folder grants no execution exemption. */
export function discoverRelativeSourceClosure({sourceRoot, boundaryRoot, seeds, sealed, parse}) {
  sourceRoot = path.resolve(sourceRoot);
  boundaryRoot = path.resolve(boundaryRoot);
  if (!inside(boundaryRoot, sourceRoot)) throw Error('art source root is outside the source boundary');
  const programs = new Map(), targets = new Map();
  const pending = [...seeds], files = new Set(seeds);
  const labelOf = filename => path.relative(sourceRoot, filename).split(path.sep).join('/');
  function inspect(filename, context) {
    if (!inside(boundaryRoot, filename)) throw Error(`${context} escapes the v2 source boundary`);
    let current = boundaryRoot;
    for (const piece of path.relative(boundaryRoot, filename).split(path.sep)) {
      current = path.join(current, piece);
      let stat;
      try { stat = fs.lstatSync(current); }
      catch (error) { if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return null; throw error; }
      if (stat.isSymbolicLink()) throw Error(`${context} traverses a symlink — ambiguous source provenance`);
    }
    return fs.statSync(filename);
  }
  function resolve(label, specifier) {
    const context = `${label} relative module ${JSON.stringify(specifier)}`;
    if (!specifier.startsWith('.')) return null;
    const raw = path.resolve(sourceRoot, path.dirname(label), specifier);
    const typed = raw.replace(/\.mjs$/, '.mts').replace(/\.cjs$/, '.cts')
      .replace(/\.jsx$/, '.tsx').replace(/\.js$/, '.ts');
    const candidates = [...new Set([raw, typed])].filter(filename => inspect(filename, context)?.isFile());
    if (candidates.length !== 1) throw Error(`${context} has ${candidates.length} source targets; expected exactly one`);
    const filename = candidates[0];
    if (!EXECUTABLE.test(filename) || DECLARATION.test(filename)) {
      throw Error(`${context} is not an executable JavaScript/TypeScript source`);
    }
    return labelOf(filename);
  }
  for (let index = 0; index < pending.length; index++) {
    const label = pending[index], filename = path.resolve(sourceRoot, label);
    if (!inspect(filename, label)?.isFile()) throw Error(`${label} source is missing`);
    const program = parse(fs.readFileSync(filename, 'utf8'), label);
    programs.set(label, program);
    const imports = new Map();
    targets.set(label, imports);
    for (const node of program.body) {
      if (!['ImportDeclaration', 'ExportNamedDeclaration', 'ExportAllDeclaration'].includes(node.type)
          || typeof node.source?.value !== 'string' || !node.source.value.startsWith('.')) continue;
      const target = resolve(label, node.source.value);
      imports.set(node.source.value, target);
      if (!sealed.has(target) && !files.has(target)) { files.add(target); pending.push(target); }
    }
  }
  return {files: [...files].sort(), programs, resolve: (label, specifier) => targets.get(label)?.get(specifier) ?? null};
}
