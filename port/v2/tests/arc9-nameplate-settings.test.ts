import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  importSaveV2,
  type ContentRegistry,
  type SaveStateV2,
} from '@cf/persistence';
import {
  projectArc9NameplateSettingsV1,
  renderArc9NameplateSettingV1,
} from '../apps/game/src/nameplate-settings.js';

interface TestWindow extends Window { close(): void }
interface TestDom { readonly window: TestWindow }

const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom') as {
  JSDOM: new (html: string) => TestDom;
};
const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = JSON.parse(fs.readFileSync(path.join(
  here, '..', '..', 'baseline-v1.8.9', 'content-registry.json',
), 'utf8')) as ContentRegistry;
const indexSource = fs.readFileSync(path.join(here, '..', 'apps', 'game', 'index.html'), 'utf8');
const NOW = 1_753_900_080_000;

function state(): SaveStateV2 {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(`nameplate Settings state failed: ${imported.reason}`);
  imported.state.stats.bestRank = 3;
  imported.state.nameHue = 2;
  return imported.state;
}

function controlErrors(html: string, css: string, bestRank = 3): string[] {
  const dom = new JSDOM(`<!doctype html><body>${html}</body>`);
  try {
    const document = dom.window.document;
    const select = document.querySelector<HTMLSelectElement>('[data-arc9-nameplate-choice]');
    const label = document.querySelector<HTMLLabelElement>('label[for="setnameplate"]');
    const help = document.getElementById('setnameplate-help');
    const errors: string[] = [];
    if (!select || !label || label.htmlFor !== select.id) errors.push('accessible-label');
    if (!select || select.getAttribute('aria-describedby') !== help?.id) errors.push('accessible-help');
    if (!select || select.getAttribute('aria-label') !== 'Nameplate color') errors.push('accessible-name');
    if (select) {
      const indices = [...select.options].map((option) => Number(option.value));
      if (indices[0] !== -1 || indices.some((index) => index < -1 || index > bestRank)) {
        errors.push('locked-choice-exposed');
      }
      if (new Set(indices).size !== indices.length) errors.push('duplicate-choice');
    }
    if (!css.includes('.panel .nameplate-setting > select { flex: 1.4; min-width: 0; min-height: 44px;')) {
      errors.push('touch-target');
    }
    if (!css.includes(':is(.seg,input[type="range"],button,select)')) errors.push('mobile-width');
    return errors;
  } finally {
    dom.window.close();
  }
}

describe('Arc 9 accessible Settings nameplate control', () => {
  it('renders only Auto plus earned colors, preserves the durable selection, and meets the touch floor', () => {
    const projection = projectArc9NameplateSettingsV1(state());
    expect(projection).toMatchObject({
      kind: 'projected',
      model: { selectedChoiceIndex: 2, savedBestRankIndex: 3, currentRankName: 'Cadet' },
    });
    if (projection.kind !== 'projected') return;
    expect(projection.model.choices.map(({ index }) => index)).toEqual([-1, 0, 1, 2, 3]);
    const html = renderArc9NameplateSettingV1(projection, false);
    expect(controlErrors(html, indexSource)).toEqual([]);
    const dom = new JSDOM(`<!doctype html><body>${html}</body>`);
    try {
      const select = dom.window.document.querySelector<HTMLSelectElement>('[data-arc9-nameplate-choice]')!;
      expect(select.value).toBe('2');
      expect(select.disabled).toBe(false);
      expect(select.options[0]?.textContent).toBe('Auto — match current rank (Cadet)');
      expect([...select.options].some((option) => option.textContent?.includes('Pioneer'))).toBe(false);
    } finally {
      dom.window.close();
    }
  });

  it('falls back visually for a retained locked legacy choice and disables protected or pending state', () => {
    const locked = state();
    locked.nameHue = 8;
    const projection = projectArc9NameplateSettingsV1(locked);
    expect(projection).toMatchObject({ kind: 'projected', model: { selectedChoiceIndex: -1 } });
    if (projection.kind !== 'projected') return;
    const pending = new JSDOM(`<!doctype html><body>${renderArc9NameplateSettingV1(projection, true)}</body>`);
    try {
      const row = pending.window.document.querySelector('[data-arc9-nameplate-setting]')!;
      const select = pending.window.document.querySelector<HTMLSelectElement>('[data-arc9-nameplate-choice]')!;
      expect(row.getAttribute('aria-busy')).toBe('true');
      expect(select.disabled).toBe(true);
      expect(select.value).toBe('-1');
    } finally {
      pending.window.close();
    }

    const corrupt = state();
    corrupt.unlocked = ['first', 'first'];
    const protectedProjection = projectArc9NameplateSettingsV1(corrupt);
    expect(protectedProjection).toEqual({ kind: 'protected', reason: 'achievement-id-shape' });
    const protectedDom = new JSDOM(`<!doctype html><body>${renderArc9NameplateSettingV1(protectedProjection, false)}</body>`);
    try {
      const select = protectedDom.window.document.querySelector<HTMLSelectElement>('[data-arc9-nameplate-choice]')!;
      expect(select.disabled).toBe(true);
      expect(select.getAttribute('aria-disabled')).toBe('true');
      expect(protectedDom.window.document.body.textContent).toContain('Reload after restoring save authority');
    } finally {
      protectedDom.window.close();
    }
  });

  it('mutation-controls label ownership, locked-option filtering, and responsive touch geometry', () => {
    const projection = projectArc9NameplateSettingsV1(state());
    if (projection.kind !== 'projected') throw new Error('nameplate projection unavailable');
    const html = renderArc9NameplateSettingV1(projection, false);
    expect(controlErrors(
      html.replace('for="setnameplate"', 'for="wrong-nameplate"'),
      indexSource,
    )).toContain('accessible-label');
    expect(controlErrors(
      html.replace('</select>', '<option value="9">Locked summit</option></select>'),
      indexSource,
    )).toContain('locked-choice-exposed');
    expect(controlErrors(
      html,
      indexSource.replace(
        '.panel .nameplate-setting > select { flex: 1.4; min-width: 0; min-height: 44px;',
        '.panel .nameplate-setting > select { flex: 1.4; min-width: 0; min-height: 20px;',
      ),
    )).toContain('touch-target');
    expect(controlErrors(
      html,
      indexSource.replace(':is(.seg,input[type="range"],button,select)', ':is(.seg,input[type="range"],button)'),
    )).toContain('mobile-width');
  });
});
