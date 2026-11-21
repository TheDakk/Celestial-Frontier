/* Reusable fail-closed source audit for deterministic audio-data modules.
   A small source-aware lexer keeps executable identifiers/imports visible,
   including Unicode escapes and template expressions, while ignoring inert
   copies of forbidden text in comments, strings, and template prose. */

export const AUDIO_STATIC_PURITY_RULES = Object.freeze([
  'math-random',
  'date-now',
  'performance-now',
  'new-date',
  'crypto',
  'window',
  'document',
  'global-this',
  'dom-import',
  'rng-import',
] as const);

export type AudioStaticPurityRule = typeof AUDIO_STATIC_PURITY_RULES[number];

export interface AudioStaticSource {
  readonly sourceId: string;
  readonly sourceText: string;
}

export interface AudioStaticPurityViolation {
  readonly sourceId: string;
  readonly rule: AudioStaticPurityRule;
  readonly offset: number;
}

export interface AudioStaticPurityAudit {
  readonly sourceCount: number;
  readonly ruleCount: typeof AUDIO_STATIC_PURITY_RULES.length;
  readonly violationCount: 0;
}

const TOKEN_RULES: readonly Readonly<{
  rule: Exclude<AudioStaticPurityRule, 'dom-import' | 'rng-import'>;
  pattern: RegExp;
}>[] = Object.freeze([
  Object.freeze({ rule: 'math-random', pattern: /\bMath\s*\.\s*random\b/u }),
  Object.freeze({ rule: 'date-now', pattern: /\bDate\s*\.\s*now\b/u }),
  Object.freeze({ rule: 'performance-now', pattern: /\bperformance\s*\.\s*now\b/u }),
  Object.freeze({ rule: 'new-date', pattern: /\bnew\s+Date\s*(?:\(|\b)/u }),
  Object.freeze({ rule: 'crypto', pattern: /\bcrypto\b/u }),
  Object.freeze({ rule: 'window', pattern: /\bwindow\b/u }),
  Object.freeze({ rule: 'document', pattern: /\bdocument\b/u }),
  Object.freeze({ rule: 'global-this', pattern: /\bglobalThis\b/u }),
]);

interface StaticToken {
  readonly kind: 'identifier' | 'punctuator' | 'string' | 'template';
  readonly value: string;
  readonly offset: number;
}

interface StaticCodeFragment {
  readonly text: string;
  readonly offsets: readonly number[];
}

interface StaticLexicalSource {
  readonly fragments: readonly StaticCodeFragment[];
  readonly tokenGroups: readonly (readonly StaticToken[])[];
}

const IDENTIFIER_START = /^(?:[$_]|\p{ID_Start})$/u;
const IDENTIFIER_PART = /^(?:[$_\u200c\u200d]|\p{ID_Continue})$/u;

function unicodeEscape(
  sourceText: string,
  offset: number,
): Readonly<{ value: string; next: number }> | null {
  if (sourceText[offset] !== '\\' || sourceText[offset + 1] !== 'u') return null;
  if (sourceText[offset + 2] === '{') {
    const close = sourceText.indexOf('}', offset + 3);
    if (close < 0) return null;
    const digits = sourceText.slice(offset + 3, close);
    if (!/^[0-9a-f]{1,6}$/iu.test(digits)) return null;
    const codePoint = Number.parseInt(digits, 16);
    if (codePoint > 0x10ffff) return null;
    return Object.freeze({ value: String.fromCodePoint(codePoint), next: close + 1 });
  }
  const digits = sourceText.slice(offset + 2, offset + 6);
  if (!/^[0-9a-f]{4}$/iu.test(digits)) return null;
  return Object.freeze({
    value: String.fromCodePoint(Number.parseInt(digits, 16)),
    next: offset + 6,
  });
}

function identifierCharacter(
  sourceText: string,
  offset: number,
  first: boolean,
): Readonly<{ value: string; next: number }> | null {
  const escaped = unicodeEscape(sourceText, offset);
  if (escaped) {
    return (first ? IDENTIFIER_START : IDENTIFIER_PART).test(escaped.value) ? escaped : null;
  }
  const codePoint = sourceText.codePointAt(offset);
  if (codePoint === undefined) return null;
  const value = String.fromCodePoint(codePoint);
  return (first ? IDENTIFIER_START : IDENTIFIER_PART).test(value)
    ? Object.freeze({ value, next: offset + value.length })
    : null;
}

function escapedLiteralCharacter(
  sourceText: string,
  offset: number,
): Readonly<{ value: string; next: number }> {
  const unicode = unicodeEscape(sourceText, offset);
  if (unicode) return unicode;
  if (sourceText[offset] !== '\\') {
    const value = sourceText[offset] ?? '';
    return Object.freeze({ value, next: offset + value.length });
  }
  const next = sourceText[offset + 1];
  if (next === 'x' && /^[0-9a-f]{2}$/iu.test(sourceText.slice(offset + 2, offset + 4))) {
    return Object.freeze({
      value: String.fromCodePoint(Number.parseInt(sourceText.slice(offset + 2, offset + 4), 16)),
      next: offset + 4,
    });
  }
  if (next === '\n') return Object.freeze({ value: '', next: offset + 2 });
  if (next === '\r') {
    return Object.freeze({ value: '', next: sourceText[offset + 2] === '\n' ? offset + 3 : offset + 2 });
  }
  const simple: Readonly<Record<string, string>> = Object.freeze({
    b: '\b', f: '\f', n: '\n', r: '\r', t: '\t', v: '\v', '0': '\0',
  });
  return Object.freeze({ value: next === undefined ? '' : (simple[next] ?? next), next: offset + 2 });
}

function quotedToken(
  sourceText: string,
  offset: number,
): Readonly<{ token: StaticToken; next: number }> {
  const quote = sourceText[offset]!;
  let value = '';
  let cursor = offset + 1;
  while (cursor < sourceText.length) {
    const character = sourceText[cursor]!;
    if (character === quote) {
      return Object.freeze({
        token: Object.freeze({ kind: 'string', value, offset }),
        next: cursor + 1,
      });
    }
    if (character === '\\') {
      const escaped = escapedLiteralCharacter(sourceText, cursor);
      value += escaped.value;
      cursor = escaped.next;
    } else {
      value += character;
      cursor++;
    }
  }
  return Object.freeze({
    token: Object.freeze({ kind: 'string', value, offset }),
    next: cursor,
  });
}

interface MutableStaticLexicalSource {
  readonly fragments: StaticCodeFragment[];
  readonly tokenGroups: Array<readonly StaticToken[]>;
}

function scanStaticCode(
  sourceText: string,
  offset: number,
  stopAtTemplateExpression: boolean,
  output: MutableStaticLexicalSource,
): number {
  const code: string[] = [];
  const offsets: number[] = [];
  const tokens: StaticToken[] = [];
  let cursor = offset;
  let braceDepth = 0;
  const append = (value: string, sourceOffset: number): void => {
    code.push(value);
    for (let index = 0; index < value.length; index++) offsets.push(sourceOffset);
  };
  const mask = (sourceOffset: number): void => { append(' ', sourceOffset); };

  while (cursor < sourceText.length) {
    const character = sourceText[cursor]!;
    if (stopAtTemplateExpression && character === '}' && braceDepth === 0) {
      cursor++;
      break;
    }
    if (character === '/' && sourceText[cursor + 1] === '/') {
      const start = cursor;
      cursor += 2;
      while (cursor < sourceText.length && sourceText[cursor] !== '\n') cursor++;
      mask(start);
      continue;
    }
    if (character === '/' && sourceText[cursor + 1] === '*') {
      const start = cursor;
      const close = sourceText.indexOf('*/', cursor + 2);
      cursor = close < 0 ? sourceText.length : close + 2;
      mask(start);
      continue;
    }
    if (character === "'" || character === '"') {
      const read = quotedToken(sourceText, cursor);
      tokens.push(read.token);
      mask(cursor);
      cursor = read.next;
      continue;
    }
    if (character === '`') {
      const templateOffset = cursor;
      let value = '';
      let hasSubstitution = false;
      cursor++;
      while (cursor < sourceText.length) {
        if (sourceText[cursor] === '`') {
          cursor++;
          break;
        }
        if (sourceText[cursor] === '\\') {
          const escaped = escapedLiteralCharacter(sourceText, cursor);
          value += escaped.value;
          cursor = escaped.next;
          continue;
        }
        if (sourceText[cursor] === '$' && sourceText[cursor + 1] === '{') {
          hasSubstitution = true;
          cursor = scanStaticCode(sourceText, cursor + 2, true, output);
          continue;
        }
        value += sourceText[cursor]!;
        cursor++;
      }
      tokens.push(Object.freeze({
        kind: 'template',
        value: hasSubstitution ? '' : value,
        offset: templateOffset,
      }));
      mask(templateOffset);
      continue;
    }
    const identifierStart = identifierCharacter(sourceText, cursor, true);
    if (identifierStart) {
      const identifierOffset = cursor;
      let value = identifierStart.value;
      const identifierOffsets: number[] = Array.from(
        { length: identifierStart.value.length },
        () => cursor,
      );
      cursor = identifierStart.next;
      while (cursor < sourceText.length) {
        const part = identifierCharacter(sourceText, cursor, false);
        if (!part) break;
        value += part.value;
        for (let index = 0; index < part.value.length; index++) identifierOffsets.push(cursor);
        cursor = part.next;
      }
      tokens.push(Object.freeze({ kind: 'identifier', value, offset: identifierOffset }));
      code.push(value);
      offsets.push(...identifierOffsets);
      continue;
    }
    if (character === '{') braceDepth++;
    else if (character === '}' && braceDepth > 0) braceDepth--;
    if (!/\s/u.test(character)) {
      tokens.push(Object.freeze({ kind: 'punctuator', value: character, offset: cursor }));
    }
    append(character, cursor);
    cursor++;
  }
  output.fragments.push(Object.freeze({ text: code.join(''), offsets: Object.freeze(offsets) }));
  output.tokenGroups.push(Object.freeze(tokens));
  return cursor;
}

function lexicalSource(sourceText: string): StaticLexicalSource {
  const output: MutableStaticLexicalSource = { fragments: [], tokenGroups: [] };
  scanStaticCode(sourceText, 0, false, output);
  return Object.freeze({
    fragments: Object.freeze(output.fragments),
    tokenGroups: Object.freeze(output.tokenGroups),
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function canonicalSourceId(value: unknown): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > 256
    || value.trim() !== value || value.normalize('NFC') !== value
    || /[\u0000-\u001f\u007f]/u.test(value)) {
    throw new TypeError('audio static source id is invalid');
  }
  return value;
}

function importSources(
  lexical: StaticLexicalSource,
): readonly Readonly<{ source: string; offset: number }>[] {
  const imports: Array<Readonly<{ source: string; offset: number }>> = [];
  for (const tokens of lexical.tokenGroups) {
    for (let index = 0; index < tokens.length; index++) {
      const token = tokens[index]!;
      if (token.kind !== 'identifier' || (token.value !== 'import' && token.value !== 'export')) continue;
      const previous = tokens[index - 1];
      if (previous?.kind === 'punctuator' && previous.value === '.') continue;
      const next = tokens[index + 1];
      if (token.value === 'import' && next?.kind === 'punctuator' && next.value === '(') {
        const source = tokens[index + 2];
        if (source?.kind === 'string' || source?.kind === 'template') {
          imports.push(Object.freeze({ source: source.value, offset: token.offset }));
        }
        continue;
      }
      if (token.value === 'import' && next?.kind === 'string') {
        imports.push(Object.freeze({ source: next.value, offset: token.offset }));
        continue;
      }
      for (let cursor = index + 1; cursor < tokens.length; cursor++) {
        const candidate = tokens[cursor]!;
        if (candidate.kind === 'punctuator' && candidate.value === ';') break;
        if (candidate.kind === 'identifier' && candidate.value === 'from') {
          const source = tokens[cursor + 1];
          if (source?.kind === 'string') {
            imports.push(Object.freeze({ source: source.value, offset: token.offset }));
          }
          break;
        }
      }
    }
  }
  return Object.freeze(imports.sort((left, right) => left.offset - right.offset));
}

function isDomImport(source: string): boolean {
  return source === 'jsdom' || source === 'pixi.js'
    || /(?:^|[/.-])(?:dom|browser)(?:[/.-]|$)/iu.test(source);
}

function isRngImport(source: string): boolean {
  return /(?:^|[/.-])(?:rand|rng|sessionrng)(?:[/.-]|$)/iu.test(source);
}

export function inspectAudioStaticPurity(
  sources: readonly unknown[],
): readonly AudioStaticPurityViolation[] {
  if (!Array.isArray(sources) || sources.length < 1) {
    throw new TypeError('audio static purity sources are required');
  }
  const sourceIds = new Set<string>();
  const violations: AudioStaticPurityViolation[] = [];
  for (const [index, value] of sources.entries()) {
    if (!isRecord(value) || Object.keys(value).length !== 2
      || !Object.hasOwn(value, 'sourceId') || !Object.hasOwn(value, 'sourceText')) {
      throw new TypeError(`audio static purity source ${index} has an invalid shape`);
    }
    const sourceId = canonicalSourceId(value.sourceId);
    if (sourceIds.has(sourceId)) throw new RangeError(`duplicate audio static source id ${sourceId}`);
    sourceIds.add(sourceId);
    if (typeof value.sourceText !== 'string') {
      throw new TypeError(`audio static purity source ${sourceId} text is invalid`);
    }
    const lexical = lexicalSource(value.sourceText);
    for (const rule of TOKEN_RULES) {
      let firstOffset: number | null = null;
      for (const fragment of lexical.fragments) {
        const match = rule.pattern.exec(fragment.text);
        if (!match) continue;
        const offset = fragment.offsets[match.index] ?? 0;
        firstOffset = firstOffset === null ? offset : Math.min(firstOffset, offset);
      }
      if (firstOffset !== null) {
        violations.push(Object.freeze({ sourceId, rule: rule.rule, offset: firstOffset }));
      }
    }
    for (const imported of importSources(lexical)) {
      if (isDomImport(imported.source)) {
        violations.push(Object.freeze({ sourceId, rule: 'dom-import', offset: imported.offset }));
      }
      if (isRngImport(imported.source)) {
        violations.push(Object.freeze({ sourceId, rule: 'rng-import', offset: imported.offset }));
      }
    }
  }
  return Object.freeze(violations.slice());
}

export function auditAudioStaticPurity(
  sources: readonly unknown[],
): AudioStaticPurityAudit {
  const violations = inspectAudioStaticPurity(sources);
  if (violations.length > 0) {
    const first = violations[0]!;
    throw new RangeError(
      `audio static purity violation ${first.rule} in ${first.sourceId} at ${first.offset}`,
    );
  }
  return Object.freeze({
    sourceCount: sources.length,
    ruleCount: AUDIO_STATIC_PURITY_RULES.length,
    violationCount: 0,
  });
}
