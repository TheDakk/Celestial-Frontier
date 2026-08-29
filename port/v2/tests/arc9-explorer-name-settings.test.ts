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
  assessArc9ExplorerNameDraftV1,
  projectArc9ExplorerNameSettingsV1,
  renderArc9ExplorerNameSettingV1,
} from '../apps/game/src/explorer-name-settings.js';

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

function state(name = 'Nova'): SaveStateV2 {
  const imported = importSaveV2('{}', REGISTRY, NOW);
  if (!imported.ok) throw new Error(`explorer-name Settings state failed: ${imported.reason}`);
  imported.state.explorerName = name;
  return imported.state;
}

function controlErrors(html: string, css: string): string[] {
  const dom = new JSDOM(`<!doctype html><body>${html}</body>`);
  try {
    const document = dom.window.document;
    const opener = document.querySelector<HTMLButtonElement>('[data-arc9-explorer-name-open]');
    const form = document.querySelector<HTMLFormElement>('[data-arc9-explorer-name-editor]');
    const input = document.querySelector<HTMLInputElement>('[data-arc9-explorer-name-input]');
    const label = document.querySelector<HTMLLabelElement>('label[for="setexplorername"]');
    const help = document.querySelector<HTMLElement>('[data-arc9-explorer-name-help]');
    const save = document.querySelector<HTMLButtonElement>('[data-arc9-explorer-name-save]');
    const cancel = document.querySelector<HTMLButtonElement>('[data-arc9-explorer-name-cancel]');
    const errors: string[] = [];
    if (!opener || opener.textContent?.trim() !== '✎ Change name'
      || opener.getAttribute('aria-controls') !== 'setexplorername-editor') {
      errors.push('accessible-opener');
    }
    if (!form || !input || !label || label.htmlFor !== input.id) errors.push('accessible-label');
    if (!input || input.maxLength !== 24 || input.getAttribute('autocomplete') !== 'nickname') {
      errors.push('bounded-input');
    }
    if (!input || input.getAttribute('aria-describedby') !== help?.id
      || help?.getAttribute('aria-live') !== 'polite') errors.push('accessible-help');
    if (!save || save.type !== 'submit' || !cancel || cancel.type !== 'button') {
      errors.push('explicit-actions');
    }
    if (!css.includes('.panel .explorer-name-editor > input { min-width: 0; min-height: 44px;')) {
      errors.push('input-touch-target');
    }
    if (!css.includes('.panel .explorer-name-actions > button { min-width: 44px; min-height: 44px;')) {
      errors.push('action-touch-target');
    }
    return errors;
  } finally {
    dom.window.close();
  }
}

describe('Arc 9 accessible explorer self-rename Settings control', () => {
  it('shows the durable name and opens a labelled, bounded editor without optimistic copy', () => {
    const projection = projectArc9ExplorerNameSettingsV1(state('Nova'));
    expect(projection).toMatchObject({
      kind: 'projected', model: { explorerName: 'Nova', displayName: 'Nova', maximumCharacters: 24 },
    });
    if (projection.kind !== 'projected') return;
    const closedHtml = renderArc9ExplorerNameSettingV1(projection, false, false);
    const closed = new JSDOM(`<!doctype html><body>${closedHtml}</body>`);
    try {
      expect(closed.window.document.querySelector('[data-arc9-explorer-name-value]')?.textContent)
        .toBe('Nova');
      expect(closed.window.document.querySelector('[data-arc9-explorer-name-editor]')).toBeNull();
      expect(closed.window.document.querySelector('[data-arc9-explorer-name-open]')
        ?.getAttribute('aria-expanded')).toBe('false');
    } finally {
      closed.window.close();
    }

    const editingHtml = renderArc9ExplorerNameSettingV1(projection, true, false);
    expect(controlErrors(editingHtml, indexSource)).toEqual([]);
    const editing = new JSDOM(`<!doctype html><body>${editingHtml}</body>`);
    try {
      const input = editing.window.document.querySelector<HTMLInputElement>(
        '[data-arc9-explorer-name-input]',
      )!;
      const save = editing.window.document.querySelector<HTMLButtonElement>(
        '[data-arc9-explorer-name-save]',
      )!;
      expect(input.value).toBe('Nova');
      expect(save.disabled).toBe(true);
      expect(editing.window.document.querySelector('[data-arc9-explorer-name-open]')
        ?.getAttribute('aria-expanded')).toBe('true');
    } finally {
      editing.window.close();
    }
  });

  it('reuses the exact clean/cap policy and distinguishes empty, unchanged, and ready drafts', () => {
    expect(assessArc9ExplorerNameDraftV1('Nova', '<>&"\'')).toEqual({
      cleanedName: '', saveable: false, reason: 'cleaned-empty',
    });
    expect(assessArc9ExplorerNameDraftV1('Nova', ' Nova ')).toEqual({
      cleanedName: 'Nova', saveable: false, reason: 'unchanged',
    });
    expect(assessArc9ExplorerNameDraftV1(
      'Nova', '1234567890123456789012345',
    )).toEqual({
      cleanedName: '123456789012345678901234', saveable: true, reason: 'ready',
    });
  });

  it('preserves a canonical durable name and fail-closes protected or pending state', () => {
    const safeProjection = projectArc9ExplorerNameSettingsV1(state('Nova ✨'));
    if (safeProjection.kind !== 'projected') throw new Error('expected projected name');
    const safe = renderArc9ExplorerNameSettingV1(safeProjection, true, false);
    expect(safe).toContain('Nova ✨');

    const pending = new JSDOM(`<!doctype html><body>${
      renderArc9ExplorerNameSettingV1(safeProjection, true, true)
    }</body>`);
    try {
      expect(pending.window.document.querySelector('[data-arc9-explorer-name-setting]')
        ?.getAttribute('aria-busy')).toBe('true');
      for (const control of pending.window.document.querySelectorAll<
        HTMLInputElement | HTMLButtonElement
      >('[data-arc9-explorer-name-open],[data-arc9-explorer-name-input],'
        + '[data-arc9-explorer-name-save],[data-arc9-explorer-name-cancel]')) {
        expect(control.disabled).toBe(true);
      }
    } finally {
      pending.window.close();
    }

    const corrupt = state();
    corrupt.explorerName = '<bad>';
    const projection = projectArc9ExplorerNameSettingsV1(corrupt);
    expect(projection).toEqual({ kind: 'protected', reason: 'state-name-shape' });
    const protectedDom = new JSDOM(`<!doctype html><body>${
      renderArc9ExplorerNameSettingV1(projection, false, false)
    }</body>`);
    try {
      expect(protectedDom.window.document.querySelector<HTMLButtonElement>(
        '[data-arc9-explorer-name-open]',
      )?.disabled).toBe(true);
    } finally {
      protectedDom.window.close();
    }
  });

  it('mutation-controls label/help ownership and both 44px touch floors', () => {
    const projection = projectArc9ExplorerNameSettingsV1(state());
    if (projection.kind !== 'projected') throw new Error('expected projected name');
    const html = renderArc9ExplorerNameSettingV1(projection, true, false);
    expect(controlErrors(
      html.replace('for="setexplorername"', 'for="wrong-explorer-name"'),
      indexSource,
    )).toContain('accessible-label');
    expect(controlErrors(
      html.replace('aria-live="polite"', 'aria-live="off"'),
      indexSource,
    )).toContain('accessible-help');
    expect(controlErrors(
      html.replace('maxlength="24"', 'maxlength="25"'),
      indexSource,
    )).toContain('bounded-input');
    expect(controlErrors(
      html,
      indexSource.replace(
        '.panel .explorer-name-editor > input { min-width: 0; min-height: 44px;',
        '.panel .explorer-name-editor > input { min-width: 0; min-height: 20px;',
      ),
    )).toContain('input-touch-target');
    expect(controlErrors(
      html,
      indexSource.replace(
        '.panel .explorer-name-actions > button { min-width: 44px; min-height: 44px;',
        '.panel .explorer-name-actions > button { min-width: 20px; min-height: 20px;',
      ),
    )).toContain('action-touch-target');
  });
});
