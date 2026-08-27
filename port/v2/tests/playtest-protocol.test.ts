import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const template = readFileSync(
  new URL('../../playtests/PLAYTEST_TEMPLATE.md', import.meta.url),
  'utf8',
);
const preview = readFileSync(
  new URL('../../DEVELOPMENT_PREVIEW.md', import.meta.url),
  'utf8',
);

function protocolErrors(playtest: string, developmentPreview: string): string[] {
  const errors: string[] = [];
  const previewFlat = developmentPreview.replace(/\s+/gu, ' ');
  const required = [
    'Celestial Frontier v2.0 development',
    'full 40-character commit',
    'Floating corner DEV badge was absent',
    'Screen-reader or other assistive-technology player',
    '**Survey** an opportunity',
    '**Gather** finite resources',
    '**Build** one available item',
    '**Tame** fauna',
    '**Visibly improve the ship**',
    '**Reach farther**',
    '**Return** to Sol/home',
    'without a hidden-system workaround',
    'status/live announcements',
  ] as const;
  for (const marker of required) if (!playtest.includes(marker)) errors.push(marker);
  if (/Confirm `DEV · <short-commit>` is visible/u.test(playtest)) errors.push('obsolete-floating-badge-check');
  if (!previewFlat.includes('Visible identity—**Celestial Frontier v2.0 development** plus the full commit—lives inside the Guide only; there is no corner badge.')) {
    errors.push('guide-only-preview-identity');
  }
  if (!previewFlat.includes('A floating `cf-dev-preview-banner` or `cf-development-site-banner` is itself a defect')) {
    errors.push('floating-badge-defect-contract');
  }
  return errors;
}

describe('human playtest protocol', () => {
  it('binds Guide-only identity, the complete Arc 4.5 journey, and an explicit AT lens', () => {
    expect(protocolErrors(template, preview)).toEqual([]);
  });

  it('rejects every identity, journey, and accessibility omission independently', () => {
    const markers = [
      'Celestial Frontier v2.0 development',
      'full 40-character commit',
      'Floating corner DEV badge was absent',
      'Screen-reader or other assistive-technology player',
      '**Survey** an opportunity',
      '**Gather** finite resources',
      '**Build** one available item',
      '**Tame** fauna',
      '**Visibly improve the ship**',
      '**Reach farther**',
      '**Return** to Sol/home',
      'without a hidden-system workaround',
      'status/live announcements',
    ] as const;
    for (const [index, marker] of markers.entries()) {
      const mutant = template.replaceAll(marker, `__PLAYTEST_PROTOCOL_MUTANT_${index}__`);
      expect(protocolErrors(mutant, preview), marker).toContain(marker);
    }
    const obsolete = template.replace(
      '- [ ] Confirm there is no floating corner DEV badge; its presence is a packaging defect.',
      '- [ ] Confirm `DEV · <short-commit>` is visible and its full-commit title/label matches.',
    );
    expect(protocolErrors(obsolete, preview)).toContain('obsolete-floating-badge-check');
  });
});
