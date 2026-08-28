import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

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
