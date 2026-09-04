/* Accessible Settings projection for explorer self-rename.

   Rendering owns no persistence and never paints a tentative name into
   AppChrome. The editor starts from the durable explorerName, uses the one
   lifted cleanName policy, and leaves receipt/CAS ownership to Main. */
import { cleanName } from '@cf/domain-naming';
import type { SaveStateV2 } from '@cf/persistence';
import { ARC9_EXPLORER_NAME_MAX_CHARS_V1 } from './arc9-explorer-name-action.js';

export const ARC9_EXPLORER_NAME_SETTINGS_SCHEMA_V1 =
  'cf-v2-arc9-explorer-name-settings/v1';

export interface Arc9ExplorerNameSettingsModelV1 {
  readonly schema: typeof ARC9_EXPLORER_NAME_SETTINGS_SCHEMA_V1;
  readonly explorerName: string;
  readonly displayName: string;
  readonly maximumCharacters: typeof ARC9_EXPLORER_NAME_MAX_CHARS_V1;
}

export type Arc9ExplorerNameSettingsProjectionV1 =
  | Readonly<{ kind: 'projected'; model: Arc9ExplorerNameSettingsModelV1 }>
  | Readonly<{ kind: 'protected'; reason: 'state-name-shape' }>;

export interface Arc9ExplorerNameDraftAssessmentV1 {
  readonly cleanedName: string;
  readonly saveable: boolean;
  readonly reason: 'ready' | 'cleaned-empty' | 'unchanged';
}

export function assessArc9ExplorerNameDraftV1(
  explorerName: string,
  rawName: string,
): Arc9ExplorerNameDraftAssessmentV1 {
  const cleanedName = cleanName(rawName, ARC9_EXPLORER_NAME_MAX_CHARS_V1);
  const reason = !cleanedName ? 'cleaned-empty'
    : cleanedName === explorerName ? 'unchanged' : 'ready';
  return Object.freeze({ cleanedName, saveable: reason === 'ready', reason });
}

export function projectArc9ExplorerNameSettingsV1(
  state: SaveStateV2,
): Arc9ExplorerNameSettingsProjectionV1 {
  const descriptor = Object.getOwnPropertyDescriptor(state, 'explorerName');
  if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true
    || typeof descriptor.value !== 'string'
    || cleanName(descriptor.value, ARC9_EXPLORER_NAME_MAX_CHARS_V1) !== descriptor.value) {
    return Object.freeze({ kind: 'protected', reason: 'state-name-shape' });
  }
  return Object.freeze({
    kind: 'projected',
    model: Object.freeze({
      schema: ARC9_EXPLORER_NAME_SETTINGS_SCHEMA_V1,
      explorerName: descriptor.value,
      displayName: descriptor.value || 'Explorer',
      maximumCharacters: ARC9_EXPLORER_NAME_MAX_CHARS_V1,
    }),
  });
}

function esc(value: string): string {
  return value.replace(/&/gu, '&amp;').replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;').replace(/"/gu, '&quot;').replace(/'/gu, '&#39;');
}

export function renderArc9ExplorerNameSettingV1(
  projection: Arc9ExplorerNameSettingsProjectionV1,
  editing: boolean,
  pending: boolean,
): string {
  if (projection.kind !== 'projected') {
    return '<div class="row explorer-name-setting" data-arc9-explorer-name-setting="protected">'
      + '<label>Explorer name</label><span class="explorer-name-value">Unavailable</span>'
      + '<button type="button" data-arc9-explorer-name-open disabled aria-disabled="true">'
      + '&#9998; Change name</button></div>';
  }
  const { model } = projection;
  const summary = '<div class="row explorer-name-setting" '
    + 'data-arc9-explorer-name-setting="ready"'
    + (pending ? ' aria-busy="true"' : '') + '>'
    + '<label id="setexplorername-label">Explorer name</label>'
    + '<strong class="explorer-name-value" data-arc9-explorer-name-value>'
    + esc(model.displayName) + '</strong>'
    + '<button type="button" data-arc9-explorer-name-open '
    + 'aria-controls="setexplorername-editor" aria-expanded="' + String(editing) + '"'
    + (pending ? ' disabled aria-disabled="true"' : '') + '>&#9998; Change name</button></div>';
  if (!editing) return summary;
  const assessment = assessArc9ExplorerNameDraftV1(model.explorerName, model.explorerName);
  return summary
    + '<form id="setexplorername-editor" class="explorer-name-editor" '
    + 'data-arc9-explorer-name-editor aria-labelledby="setexplorername-editor-title"'
    + (pending ? ' aria-busy="true"' : '') + '>'
    + '<label id="setexplorername-editor-title" for="setexplorername">New explorer name</label>'
    + '<input id="setexplorername" data-arc9-explorer-name-input type="text" '
    + 'autocomplete="nickname" spellcheck="false" maxlength="'
    + model.maximumCharacters + '" value="' + esc(model.explorerName) + '" '
    + 'aria-describedby="setexplorername-help"'
    + (pending ? ' disabled aria-disabled="true"' : '') + '>'
    + '<div class="explorer-name-actions">'
    + '<button type="submit" data-arc9-explorer-name-save disabled aria-disabled="true">Save name</button>'
    + '<button type="button" data-arc9-explorer-name-cancel'
    + (pending ? ' disabled aria-disabled="true"' : '') + '>Cancel</button></div>'
    + '<small id="setexplorername-help" aria-live="polite" data-arc9-explorer-name-help>'
    + (assessment.reason === 'unchanged'
      ? 'Enter a different name. Unsafe punctuation is removed; 24 characters maximum.'
      : 'Unsafe punctuation is removed; 24 characters maximum.')
    + '</small></form>';
}
