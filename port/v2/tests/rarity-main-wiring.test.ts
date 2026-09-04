import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

interface TestWindow extends Window { close(): void }
interface TestDom { readonly window: TestWindow }

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as {
  JSDOM: new (html: string, options?: Record<string, unknown>) => TestDom;
};
const here = path.dirname(fileURLToPath(import.meta.url));
const mainSource = fs.readFileSync(
  path.join(here, '..', 'apps', 'game', 'src', 'main.ts'),
  'utf8',
);
const indexSource = fs.readFileSync(
  path.join(here, '..', 'apps', 'game', 'index.html'),
  'utf8',
);

function occurrences(source: string, needle: string): number {
  return source.split(needle).length - 1;
}

interface CssRuleSource {
  readonly body: string;
  readonly index: number;
}

function cssRulesForExactSelector(source: string, selector: string): readonly CssRuleSource[] {
  return [...source.matchAll(/([^{}]+)\{([^{}]*)\}/gu)]
    .filter((match) => match[1]!.split(',').map((candidate) => candidate.trim()).includes(selector))
    .map((match) => ({ body: match[2]!, index: match.index! }));
}

function cssProperty(body: string, property: string): string {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  return new RegExp(`(?:^|;)\\s*${escaped}\\s*:\\s*([^;]+)`, 'iu').exec(body)?.[1]?.trim() ?? '';
}

interface BinderSlotCascade {
  readonly missingBackground: string;
  readonly ownedBackground: string;
}

function binderSlotCascade(index: string): BinderSlotCascade {
  const dom = new JSDOM(index);
  const host = dom.window.document.createElement('section');
  host.className = 'records-binder';
  host.innerHTML = '<span class="binder-slot">Exotic</span>'
    + '<span class="binder-slot missing">?</span>';
  dom.window.document.body.append(host);
  const owned = host.querySelector<HTMLElement>('.binder-slot:not(.missing)')!;
  const missing = host.querySelector<HTMLElement>('.binder-slot.missing')!;
  const result = {
    ownedBackground: dom.window.getComputedStyle(owned).backgroundColor.trim().toLowerCase(),
    missingBackground: dom.window.getComputedStyle(missing).backgroundColor.trim().toLowerCase(),
  };
  dom.window.close();
  return result;
}

function transparentBackground(value: string): boolean {
  return value === 'transparent' || value === 'rgba(0, 0, 0, 0)';
}

function binderSlotSurfaceErrors(index: string): string[] {
  const errors: string[] = [];
  const base = cssRulesForExactSelector(index, '.binder-slot');
  const owned = cssRulesForExactSelector(index, '.binder-slot:not(.missing)');
  const missing = cssRulesForExactSelector(index, '.binder-slot.missing');
  if (base.length !== 1 || owned.length !== 1 || missing.length !== 1) {
    errors.push('binder-slot-surface-owner');
  }
  if (owned.length !== 1 || cssProperty(owned[0]!.body, 'background').toLowerCase() !== '#05070d') {
    errors.push('binder-slot-owned-surface');
  }
  if (base.some((rule) => cssProperty(rule.body, 'background') !== '')
    || missing.some((rule) => cssProperty(rule.body, 'background') !== '')) {
    errors.push('binder-slot-missing-semantics');
  }
  if (base.length === 1 && owned.length === 1 && missing.length === 1
    && !(base[0]!.index < owned[0]!.index && owned[0]!.index < missing[0]!.index)) {
    errors.push('binder-slot-surface-order');
  }
  const cascade = binderSlotCascade(index);
  if (cascade.ownedBackground !== 'rgb(5, 7, 13)') {
    errors.push('binder-slot-owned-rendered-surface');
  }
  if (!transparentBackground(cascade.missingBackground)) {
    errors.push('binder-slot-missing-rendered-semantics');
  }
  return errors;
}

function relativeLuminance(hex: string): number {
  const components = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/iu.exec(hex);
  if (components === null) throw new Error(`invalid color ${hex}`);
  const linear = components.slice(1).map((component) => {
    const value = Number.parseInt(component, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
}

function contrastRatio(foreground: string, background: string): number {
  const foregroundLuminance = relativeLuminance(foreground);
  const backgroundLuminance = relativeLuminance(background);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

function section(source: string, startText: string, endText: string): string {
  const start = source.indexOf(startText);
  const end = source.indexOf(endText, start);
  return start >= 0 && end > start ? source.slice(start, end) : '';
}

function replaceInSectionExact(
  source: string,
  startText: string,
  endText: string,
  needle: string,
  replacement: string,
): string {
  const start = source.indexOf(startText);
  const end = source.indexOf(endText, start);
  if (start < 0 || end <= start) throw new Error(`source section is missing: ${startText}`);
  const body = source.slice(start, end);
  if (occurrences(body, needle) !== 1) {
    throw new Error(`source section must contain exactly one mutation target: ${needle}`);
  }
  return source.slice(0, start) + body.replace(needle, replacement) + source.slice(end);
}

function rarityWiringErrors(source: string, index = indexSource): string[] {
  const errors: string[] = [];
  if (occurrences(
    source,
    "import { projectDisplayRarity } from './rarity-presentation.js';",
  ) !== 1) errors.push('projector-import');

  const survey = section(source, 'function showSurvey(', '\nfunction hideSurvey(');
  if (survey.length === 0) errors.push('survey-section');
  if (!survey.includes("const rarityView = typeof d.designation?.name === 'string'\n    ? projectDisplayRarity(d.designation.tier)\n    : null;")) {
    errors.push('survey-name-presence-projector');
  }
  if (!survey.includes('const rarityVisible = rarityView !== null && (!isPlanet || landedPlanet);')) {
    errors.push('survey-planetfall-disclosure');
  }
  if (!survey.includes('${esc(rarityView.name)}</div>')
    || survey.includes('esc(d.designation?.name)')) errors.push('survey-canonical-name');

  const row = section(source, 'function mountCodexRow(', '\nfunction fillCodex(');
  if (row.length === 0) errors.push('row-section');
  if (!row.includes('const rarityView = projectDisplayRarity(e.tier);')) {
    errors.push('row-stored-tier-projector');
  }
  if (!row.includes('data-sel="codex-row-rarity"')
    || !row.includes('class="rarity-badge"')
    || !row.includes('esc(rarityView.name)')
    || !row.includes('esc(rarityView.hex)')) errors.push('row-canonical-view');
  if (row.includes("' · tier ' + e.tier") || row.includes('e.tier != null')
    || row.includes("name: 'tier ' + e.tier")) {
    errors.push('row-raw-tier-leak');
  }

  const detail = section(source, 'function fillCodexDetail(', '\nfunction fillRecords(');
  if (detail.length === 0) errors.push('detail-section');
  if (!detail.includes('const rarityView = projectDisplayRarity(e.tier);')) {
    errors.push('detail-stored-tier-projector');
  }
  if (!detail.includes('data-sel="detail-grade"')
    || !detail.includes('class="rarity-badge"')
    || !detail.includes('esc(rarityView.name)')
    || occurrences(detail, 'esc(rarityView.hex)') !== 2) errors.push('detail-canonical-view');
  if (/\bd\.grade\b/u.test(detail)) errors.push('detail-art-label-leak');

  const rarityBadgeRule = index.match(/\.rarity-badge\s*\{[^}]*\}/u)?.[0] ?? '';
  if (!/background:\s*#05070d\s*;/u.test(rarityBadgeRule)) {
    errors.push('rarity-badge-surface');
  }
  errors.push(...binderSlotSurfaceErrors(index));

  return [...new Set(errors)];
}

describe('v2 rarity presentation — player-surface wiring', () => {
  it('routes Survey and both Compendium surfaces through the strict projector', () => {
    expect(rarityWiringErrors(mainSource)).toEqual([]);
  });

  it('negative-controls both raw-grade disclosure and invalid-to-Common invention', () => {
    const rawLeak = replaceInSectionExact(
      mainSource,
      'function mountCodexRow(',
      '\nfunction fillCodex(',
      '  const rarityView = projectDisplayRarity(e.tier);',
      "  const rarityView = e.tier == null ? null : { tier: e.tier, id: String(e.tier), name: 'tier ' + e.tier, hex: '#FFFFFF' };",
    );
    expect(rarityWiringErrors(rawLeak)).toEqual(expect.arrayContaining([
      'row-stored-tier-projector',
      'row-raw-tier-leak',
    ]));

    const inventedCommon = replaceInSectionExact(
      mainSource,
      'function fillCodexDetail(',
      '\nfunction fillRecords(',
      '  const rarityView = projectDisplayRarity(e.tier);',
      "  const rarityView = projectDisplayRarity(e.tier) ?? { tier: 0, id: 'common', name: 'Common', hex: '#B8BDC7' };",
    );
    expect(rarityWiringErrors(inventedCommon)).toContain('detail-stored-tier-projector');
  });

  it('negative-controls the art-label path independently from the stored-tier path', () => {
    const artLabelLeak = replaceInSectionExact(
      mainSource,
      'function fillCodexDetail(',
      '\nfunction fillRecords(',
      'esc(rarityView.name)',
      'esc(d.grade?.label || rarityView.name)',
    );
    expect(rarityWiringErrors(artLabelLeak)).toContain('detail-art-label-leak');
  });

  it('negative-controls the shared opaque rarity reading surface', () => {
    const badgeRule = indexSource.match(/\.rarity-badge\s*\{[^}]*\}/u)?.[0] ?? '';
    expect(occurrences(badgeRule, 'background: #05070d;')).toBe(1);
    const transparentBadge = indexSource.replace(badgeRule, badgeRule.replace(
      'background: #05070d;',
      'background: transparent;',
    ));
    expect(rarityWiringErrors(mainSource, transparentBadge)).toContain('rarity-badge-surface');

    const missingRowBadge = replaceInSectionExact(
      mainSource,
      'function mountCodexRow(',
      '\nfunction fillCodex(',
      '<span class="rarity-badge" data-sel="codex-row-rarity"',
      '<span data-sel="codex-row-rarity"',
    );
    expect(rarityWiringErrors(missingRowBadge)).toContain('row-canonical-view');
  });

  it('keeps owned Binder rarity text opaque while missing slots retain their distinct surface', () => {
    expect(binderSlotSurfaceErrors(indexSource)).toEqual([]);
    expect(contrastRatio('#9A5CFF', '#05070d')).toBeGreaterThanOrEqual(4.5);

    const transparentOwned = indexSource.replace(
      '.binder-slot:not(.missing) { background: #05070d; }',
      '.binder-slot:not(.missing) { background: transparent; }',
    );
    expect(transparentOwned).not.toBe(indexSource);
    expect(binderSlotSurfaceErrors(transparentOwned)).toContain('binder-slot-owned-surface');

    const wrongScope = indexSource.replace(
      '.binder-slot:not(.missing) { background: #05070d; }',
      '.binder-slot { background: #05070d; }',
    );
    expect(wrongScope).not.toBe(indexSource);
    expect(binderSlotSurfaceErrors(wrongScope)).toEqual(expect.arrayContaining([
      'binder-slot-surface-owner',
      'binder-slot-owned-surface',
      'binder-slot-missing-semantics',
    ]));

    const missingMadeOpaque = indexSource.replace(
      '.binder-slot.missing { border-color: rgba(87,112,154,.42); color: var(--dim); }',
      '.binder-slot.missing { border-color: rgba(87,112,154,.42); color: var(--dim); background: #05070d; }',
    );
    expect(missingMadeOpaque).not.toBe(indexSource);
    expect(binderSlotSurfaceErrors(missingMadeOpaque)).toContain('binder-slot-missing-semantics');

    const reordered = indexSource.replace(
      '    .binder-slot:not(.missing) { background: #05070d; }\n',
      '',
    ).replace(
      '    .binder-slot { min-width: 0;',
      '    .binder-slot:not(.missing) { background: #05070d; }\n    .binder-slot { min-width: 0;',
    );
    expect(reordered).not.toBe(indexSource);
    expect(binderSlotSurfaceErrors(reordered)).toContain('binder-slot-surface-order');

    const laterTransparentOverride = indexSource.replace(
      '.binder-slot.missing { border-color: rgba(87,112,154,.42); color: var(--dim); }',
      '.binder-slot.missing { border-color: rgba(87,112,154,.42); color: var(--dim); }\n'
        + '    .binder-slot:not(.missing) { background: transparent; }',
    );
    expect(laterTransparentOverride).not.toBe(indexSource);
    expect(binderSlotSurfaceErrors(laterTransparentOverride)).toEqual(expect.arrayContaining([
      'binder-slot-surface-owner',
      'binder-slot-owned-surface',
      'binder-slot-owned-rendered-surface',
    ]));

    const strongerLaterTransparentOverride = indexSource.replace(
      '.binder-slot.missing { border-color: rgba(87,112,154,.42); color: var(--dim); }',
      '.binder-slot.missing { border-color: rgba(87,112,154,.42); color: var(--dim); }\n'
        + '    .records-binder .binder-slot:not(.missing) { background: transparent; }',
    );
    expect(strongerLaterTransparentOverride).not.toBe(indexSource);
    expect(binderSlotSurfaceErrors(strongerLaterTransparentOverride))
      .toEqual(['binder-slot-owned-rendered-surface']);

    const strongerLaterMissingOverride = indexSource.replace(
      '.binder-slot.missing { border-color: rgba(87,112,154,.42); color: var(--dim); }',
      '.binder-slot.missing { border-color: rgba(87,112,154,.42); color: var(--dim); }\n'
        + '    .records-binder .binder-slot.missing { background: #05070d; }',
    );
    expect(strongerLaterMissingOverride).not.toBe(indexSource);
    expect(binderSlotSurfaceErrors(strongerLaterMissingOverride))
      .toEqual(['binder-slot-missing-rendered-semantics']);
  });

  it('negative-controls both Survey disclosure gates', () => {
    const missingNameDisclosure = replaceInSectionExact(
      mainSource,
      'function showSurvey(',
      '\nfunction hideSurvey(',
      "typeof d.designation?.name === 'string'",
      "typeof d.designation?.tier === 'number'",
    );
    expect(rarityWiringErrors(missingNameDisclosure)).toContain('survey-name-presence-projector');

    const preLandDisclosure = replaceInSectionExact(
      mainSource,
      'function showSurvey(',
      '\nfunction hideSurvey(',
      '(!isPlanet || landedPlanet)',
      'true',
    );
    expect(rarityWiringErrors(preLandDisclosure)).toContain('survey-planetfall-disclosure');
  });
});
