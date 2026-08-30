/* Build-output authority shared by smoke and the Arc 1A memory gate. The
   dedicated worker must own both its protocol and painter semantics in one
   exact generated file, with no worker-side JavaScript dependency edge. */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  javascriptModuleImports,
  sealedWorkerJavaScriptDependencyEdges,
} from './sealed-worker-graph.mjs';

const WORKER_REQUEST_SCHEMA = 'cf-v2-species-art-worker-request/v1';
const WORKER_RESPONSE_SCHEMA = 'cf-v2-species-art-worker-response/v1';

const slashPath = (file) => file.split(path.sep).join('/');

const checkedRelativePath = (candidateDist, file, label) => {
  const relativePath = slashPath(path.relative(candidateDist, file));
  if (
    !relativePath
    || relativePath === '..'
    || relativePath.startsWith('../')
    || path.posix.isAbsolute(relativePath)
  ) {
    throw new Error(`candidate ${label} path escaped the build: ${relativePath}`);
  }
  return relativePath;
};

const hashBytes = (bytes) =>
  crypto.createHash('sha256').update(bytes).digest('hex');

const collectCandidateJavaScript = (candidateDist) => {
  const root = path.resolve(candidateDist);
  const rootEntry = fs.lstatSync(root);
  if (rootEntry.isSymbolicLink()) {
    throw new Error(`candidate build root is an unsupported symlink: ${root}`);
  }
  if (!rootEntry.isDirectory()) {
    throw new Error(`candidate build root must be a directory: ${root}`);
  }

  const files = [];
  const visit = (directory) => {
    const entries = fs.readdirSync(directory, { withFileTypes: true })
      .sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const file = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) {
        throw new Error(`candidate build contains an unsupported symlink: ${file}`);
      }
      if (entry.isDirectory()) visit(file);
      else if (entry.isFile() && entry.name.endsWith('.js')) files.push(file);
    }
  };
  visit(root);

  return Object.freeze(files.map((file) => {
    const bytes = fs.readFileSync(file);
    return Object.freeze({
      absolutePath: file,
      relativePath: checkedRelativePath(root, file, 'JavaScript'),
      bytes,
      source: bytes.toString('utf8'),
    });
  }));
};

const semanticMatches = (records, predicate, label) => {
  const matches = records.filter(({ source }) => predicate(source));
  if (matches.length !== 1) {
    throw new Error(
      `candidate build must expose exactly one semantically identifiable ${label}; found ${matches.length}`,
    );
  }
  return matches[0];
};

const chunkIdentity = ({ relativePath, bytes }) => Object.freeze({
  relativePath,
  sha256: hashBytes(bytes),
});

const literalDynamicImports = (source) => {
  return javascriptModuleImports(source)
    .filter(({ kind, specifier }) => kind === 'module-dynamic' && specifier !== null)
    .map(({ specifier }) => specifier);
};

const literalStaticImports = (source) => {
  return javascriptModuleImports(source)
    .filter(({ kind, specifier }) => kind === 'module-static' && specifier !== null)
    .map(({ specifier }) => specifier);
};

const resolveBuiltReference = (importerRelativePath, specifier) => {
  if (typeof specifier !== 'string' || specifier.length === 0) return null;
  const withoutSuffix = specifier.split(/[?#]/u, 1)[0];
  let resolved;
  if (withoutSuffix.startsWith('/')) {
    resolved = path.posix.normalize(withoutSuffix.slice(1));
  } else if (withoutSuffix.startsWith('./') || withoutSuffix.startsWith('../')) {
    resolved = path.posix.normalize(
      path.posix.join(path.posix.dirname(importerRelativePath), withoutSuffix),
    );
  } else {
    return null;
  }
  if (!resolved || resolved === '..' || resolved.startsWith('../') || path.posix.isAbsolute(resolved)) {
    return null;
  }
  return resolved;
};

const readCandidateIndex = (candidateDist, indexPath) => {
  const root = path.resolve(candidateDist);
  const requested = indexPath === undefined ? 'index.html' : indexPath;
  if (typeof requested !== 'string' || requested.length === 0) {
    throw new TypeError('candidate indexPath must be a non-empty string');
  }
  const file = path.isAbsolute(requested)
    ? path.resolve(requested)
    : path.resolve(root, requested);
  const relativePath = checkedRelativePath(root, file, 'index');
  const entry = fs.lstatSync(file);
  if (entry.isSymbolicLink()) {
    throw new Error(`candidate build index is an unsupported symlink: ${file}`);
  }
  if (!entry.isFile()) {
    throw new Error(`candidate build index must be a file: ${file}`);
  }
  return Object.freeze({
    relativePath,
    source: fs.readFileSync(file, 'utf8'),
  });
};

const attributeValue = (tag, name) => {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const pattern = new RegExp(
    `(?:^|\\s)${escapedName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>\\x60]+))`,
    'iu',
  );
  const match = pattern.exec(tag);
  return match ? match[1] ?? match[2] ?? match[3] : null;
};

const modulePreloadHrefs = (source) => {
  const hrefs = [];
  const tags = source.match(/<link\b[^>]*>/giu) ?? [];
  for (const tag of tags) {
    const rel = attributeValue(tag, 'rel');
    if (!rel || !rel.toLowerCase().split(/\s+/u).includes('modulepreload')) continue;
    const href = attributeValue(tag, 'href');
    if (href !== null) hrefs.push(href);
  }
  return hrefs;
};

const moduleScriptSources = (source) => {
  const sources = [];
  const tags = source.match(/<script\b[^>]*>/giu) ?? [];
  for (const tag of tags) {
    if (attributeValue(tag, 'type')?.toLowerCase() !== 'module') continue;
    const src = attributeValue(tag, 'src');
    if (src !== null) sources.push(src);
  }
  return sources;
};

const literalWorkerConstructors = (source) => {
  const constructors = [];
  const pattern = /\bnew\s+Worker\s*\(\s*new\s+URL\s*\(\s*(["'`])([^"'`\\\r\n$]+)\1\s*,\s*(?:(["'`])[^"'`\\\r\n]*\3\s*\+\s*)?import\.meta\.url\s*\)\s*,\s*\{([^{}]*)\}\s*\)/gu;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    const options = match[4];
    constructors.push(Object.freeze({
      specifier: match[2],
      validOptions: /(?:^|,)\s*type\s*:\s*(["'`])module\1\s*(?:,|$)/u.test(options)
        && /(?:^|,)\s*name\s*:\s*(["'`])cf-species-art\1\s*(?:,|$)/u.test(options),
    }));
  }
  return constructors;
};

const reachableModuleRecords = (records, index) => {
  const entries = moduleScriptSources(index.source);
  if (entries.length !== 1) {
    throw new Error(`candidate index must own exactly one module script entry; found ${entries.length}`);
  }
  const byPath = new Map(records.map((record) => [record.relativePath, record]));
  const entryPath = resolveBuiltReference(index.relativePath, entries[0]);
  const entry = entryPath ? byPath.get(entryPath) : null;
  if (!entry) {
    throw new Error(`candidate index module entry did not resolve to built JavaScript: ${entries[0]}`);
  }
  const reached = new Map();
  const pending = [entry];
  while (pending.length) {
    const record = pending.shift();
    if (reached.has(record.relativePath)) continue;
    reached.set(record.relativePath, record);
    const specifiers = [
      ...literalStaticImports(record.source), ...literalDynamicImports(record.source),
    ];
    for (const specifier of specifiers) {
      const target = resolveBuiltReference(record.relativePath, specifier);
      if (!target || !target.endsWith('.js')) continue;
      const dependency = byPath.get(target);
      if (!dependency) {
        throw new Error(
          `candidate module ${record.relativePath} references missing built JavaScript ${target}`,
        );
      }
      pending.push(dependency);
    }
  }
  return Object.freeze({ entry, records: Object.freeze([...reached.values()]) });
};

export function candidateSpeciesPainterChunkSource(source) {
  return typeof source === 'string'
    && source.includes('SPECIES_PORTRAIT_SIZE')
    && source.includes('renderSpeciesPortraitCanvas')
    && source.includes('renderSpeciesThumbCanvas');
}

export function candidateSpeciesWorkerEntrySource(source) {
  return typeof source === 'string'
    && source.includes(WORKER_REQUEST_SCHEMA)
    && source.includes(WORKER_RESPONSE_SCHEMA)
    && source.includes('OffscreenCanvas')
    && source.includes('FileReaderSync')
    && source.includes('postMessage')
    && source.includes('addEventListener');
}

export function candidateLegacyWindowSpeciesArtSource(source) {
  return typeof source === 'string'
    && source.includes('fullPortraitRendersForThumb')
    && source.includes('toDataURL');
}

export function findCandidateSpeciesPainterChunk(candidateDist) {
  const records = collectCandidateJavaScript(candidateDist);
  return chunkIdentity(semanticMatches(
    records,
    candidateSpeciesPainterChunkSource,
    'worker-local species painter',
  ));
}

export function findCandidateSpeciesArtBuildGraph(candidateDist, options = {}) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('candidate species-art build options must be an object');
  }

  const root = path.resolve(candidateDist);
  const records = collectCandidateJavaScript(root);
  const painterRecord = semanticMatches(
    records,
    candidateSpeciesPainterChunkSource,
    'worker-local species painter',
  );
  const workerRecord = semanticMatches(
    records,
    candidateSpeciesWorkerEntrySource,
    'dedicated species-art worker entry',
  );
  if (painterRecord.relativePath !== workerRecord.relativePath) {
    throw new Error(
      'candidate species-art painter and worker semantics must share one exact generated file',
    );
  }

  const workerDependencies = sealedWorkerJavaScriptDependencyEdges(workerRecord.source);
  if (workerDependencies.length !== 0) {
    const diagnoses = workerDependencies.map(({ kind, position, specifier }) =>
      `${kind}@${position}${specifier === null ? '' : `:${JSON.stringify(specifier)}`}`);
    throw new Error(
      `candidate dedicated species-art worker must not retain JavaScript dependency edges: ${diagnoses.join(', ')}`,
    );
  }

  const index = readCandidateIndex(root, options.indexPath);
  const windowGraph = reachableModuleRecords(records, index);
  const workerBasename = path.posix.basename(workerRecord.relativePath);
  const workerPreloads = modulePreloadHrefs(index.source).filter((href) =>
    href.includes(workerBasename)
    || resolveBuiltReference(index.relativePath, href) === workerRecord.relativePath);
  if (workerPreloads.length !== 0) {
    throw new Error(
      `candidate index must not modulepreload the dedicated species-art worker: ${workerPreloads.join(', ')}`,
    );
  }
  const importedWorker = windowGraph.records.flatMap((record) => [
    ...literalStaticImports(record.source), ...literalDynamicImports(record.source),
  ].filter((specifier) =>
    resolveBuiltReference(record.relativePath, specifier) === workerRecord.relativePath)
  .map(() => record.relativePath));
  if (importedWorker.length !== 0) {
    throw new Error(
      `candidate Window module graph must construct, not import, the species-art worker: ${importedWorker.join(', ')}`,
    );
  }
  const blobWorkerPaths = windowGraph.records.filter(({ source }) =>
    source.includes(workerBasename)
      && /\bnew\s+Worker\s*\(\s*(?:URL\.)?createObjectURL\s*\(/u.test(source));
  if (blobWorkerPaths.length !== 0) {
    throw new Error(
      `candidate Window module graph must not construct the species-art worker through a blob path: ${blobWorkerPaths.map(({ relativePath }) => relativePath).join(', ')}`,
    );
  }
  const workerEdges = windowGraph.records.flatMap((record) =>
    literalWorkerConstructors(record.source)
      .filter(({ specifier }) =>
        resolveBuiltReference(record.relativePath, specifier) === workerRecord.relativePath)
      .map((edge) => ({ record, edge })));
  if (workerEdges.length !== 1 || workerEdges[0].edge.validOptions !== true) {
    throw new Error(
      `candidate index module graph must own one exact module cf-species-art Worker edge; found ${workerEdges.length}`,
    );
  }
  const workerMentions = windowGraph.records.flatMap((record) => {
    const count = record.source.split(workerBasename).length - 1;
    return Array.from({ length: count }, () => record.relativePath);
  });
  if (workerMentions.length !== 1
    || workerMentions[0] !== workerEdges[0].record.relativePath) {
    throw new Error(
      `candidate Window module graph has ambiguous species-art worker ownership: ${workerMentions.join(', ')}`,
    );
  }
  const legacyWindowPainters = windowGraph.records.filter(({ source }) =>
    candidateLegacyWindowSpeciesArtSource(source));
  if (legacyWindowPainters.length !== 0) {
    throw new Error(
      `candidate Window module graph still reaches the legacy synchronous species-art facade: ${legacyWindowPainters.map(({ relativePath }) => relativePath).join(', ')}`,
    );
  }

  const workerIdentity = chunkIdentity(workerRecord);
  return Object.freeze({
    owner: chunkIdentity(workerEdges[0].record),
    painter: workerIdentity,
    worker: workerIdentity,
  });
}
