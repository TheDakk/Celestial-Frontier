/* Reusable fail-closed source audit for deterministic audio-data modules.
   It is intentionally lexical: a newly introduced forbidden capability must
   be reviewed explicitly rather than hidden behind aliases or comments. */

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

const STATIC_IMPORT_FROM = /\b(?:import|export)\s+(?:type\s+)?[^;'"\n]*(?:\n[^;'"\n]*)*?\bfrom\s*['"]([^'"]+)['"]/gu;
const STATIC_BARE_IMPORT = /\bimport\s*['"]([^'"]+)['"]/gu;
const DYNAMIC_IMPORT = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/gu;

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

function importSources(sourceText: string): readonly Readonly<{ source: string; offset: number }>[] {
  const imports: Array<Readonly<{ source: string; offset: number }>> = [];
  for (const pattern of [STATIC_IMPORT_FROM, STATIC_BARE_IMPORT, DYNAMIC_IMPORT]) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(sourceText)) !== null) {
      imports.push(Object.freeze({ source: match[1]!, offset: match.index }));
    }
  }
  return Object.freeze(imports);
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
    for (const rule of TOKEN_RULES) {
      const match = rule.pattern.exec(value.sourceText);
      if (match) violations.push(Object.freeze({ sourceId, rule: rule.rule, offset: match.index }));
    }
    for (const imported of importSources(value.sourceText)) {
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
