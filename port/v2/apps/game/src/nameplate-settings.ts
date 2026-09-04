/* Accessible Settings projection for the Arc 9 saved nameplate choice.

   This component is read-only HTML. Main owns the native change gesture and
   the receipt-bearing action; rendering never mutates the save or promotes a
   locked color. */
import { EXPLORER_RANKS } from '@cf/domain-progression';
import type { SaveStateV2 } from '@cf/persistence';
import {
  projectArc9ProgressionStateV1,
  type Arc9ProgressionProjectionProtectionReasonV1,
} from './arc9-progression-projection.js';

export const ARC9_NAMEPLATE_SETTINGS_SCHEMA_V1 = 'cf-v2-arc9-nameplate-settings/v1';

export interface Arc9NameplateSettingsChoiceV1 {
  readonly index: number;
  readonly label: string;
  readonly hue: string;
  readonly iridescent: boolean;
  readonly followsCurrentRank: boolean;
}

export interface Arc9NameplateSettingsModelV1 {
  readonly schema: typeof ARC9_NAMEPLATE_SETTINGS_SCHEMA_V1;
  readonly selectedChoiceIndex: number;
  readonly savedBestRankIndex: number;
  readonly currentRankName: string;
  readonly choices: readonly Arc9NameplateSettingsChoiceV1[];
}

export type Arc9NameplateSettingsProjectionV1 =
  | Readonly<{ kind: 'projected'; model: Arc9NameplateSettingsModelV1 }>
  | Readonly<{ kind: 'protected'; reason: Arc9ProgressionProjectionProtectionReasonV1 }>;

export function projectArc9NameplateSettingsV1(
  state: SaveStateV2,
): Arc9NameplateSettingsProjectionV1 {
  const projection = projectArc9ProgressionStateV1(state);
  if (projection.kind !== 'projected') return projection;
  const { rank, savedBestRankIndex } = projection.projection;
  const rawChoice = Object.getOwnPropertyDescriptor(state, 'nameHue')?.value;
  const selectedChoiceIndex = Number.isSafeInteger(rawChoice)
    && (rawChoice as number) >= 0
    && (rawChoice as number) <= savedBestRankIndex
    ? rawChoice as number : -1;
  const choices: Arc9NameplateSettingsChoiceV1[] = [Object.freeze({
    index: -1,
    label: `Auto — match current rank (${rank.name})`,
    hue: rank.nameplateHue,
    iridescent: rank.iridescent,
    followsCurrentRank: true,
  })];
  for (const definition of EXPLORER_RANKS) {
    if (definition.index > savedBestRankIndex) break;
    choices.push(Object.freeze({
      index: definition.index,
      label: definition.name + (definition.iridescent ? ' — iridescent foil' : ''),
      hue: definition.nameplateHue,
      iridescent: definition.iridescent,
      followsCurrentRank: false,
    }));
  }
  return Object.freeze({
    kind: 'projected',
    model: Object.freeze({
      schema: ARC9_NAMEPLATE_SETTINGS_SCHEMA_V1,
      selectedChoiceIndex,
      savedBestRankIndex,
      currentRankName: rank.name,
      choices: Object.freeze(choices),
    }),
  });
}

function esc(value: string): string {
  return value.replace(/&/gu, '&amp;').replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;').replace(/"/gu, '&quot;').replace(/'/gu, '&#39;');
}

export function renderArc9NameplateSettingV1(
  projection: Arc9NameplateSettingsProjectionV1,
  pending: boolean,
): string {
  if (projection.kind !== 'projected') {
    return '<div class="row nameplate-setting" data-arc9-nameplate-setting="protected">'
      + '<label for="setnameplate">Nameplate</label>'
      + '<select id="setnameplate" data-arc9-nameplate-choice aria-label="Nameplate color" '
      + 'aria-describedby="setnameplate-help" disabled aria-disabled="true">'
      + '<option>Nameplate choices unavailable</option></select>'
      + '<small id="setnameplate-help">Reload after restoring save authority.</small></div>';
  }
  const { model } = projection;
  const options = model.choices.map((choice) => (
    '<option value="' + choice.index + '" data-nameplate-hue="' + esc(choice.hue) + '"'
      + (choice.iridescent ? ' data-nameplate-iridescent="true"' : '')
      + (choice.index === model.selectedChoiceIndex ? ' selected' : '')
      + '>' + esc(choice.label) + '</option>'
  )).join('');
  return '<div class="row nameplate-setting" data-arc9-nameplate-setting="ready"'
    + (pending ? ' aria-busy="true"' : '') + '>'
    + '<label for="setnameplate">Nameplate</label>'
    + '<select id="setnameplate" data-arc9-nameplate-choice aria-label="Nameplate color" '
    + 'aria-describedby="setnameplate-help"'
    + (pending ? ' disabled aria-disabled="true"' : '') + '>' + options + '</select>'
    + '<small id="setnameplate-help">Choose Auto or any color earned through '
    + esc(EXPLORER_RANKS[model.savedBestRankIndex]!.name) + '.</small></div>';
}
