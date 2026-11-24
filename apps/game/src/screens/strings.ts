import { UPDATE_WORDS } from '../offline';
import { catalog, type StringCatalog } from '../ui';

/** Every string the Settings panel shows, in the order it shows them. */
export const SETTINGS_CATALOG: StringCatalog = catalog('settings', [
  'Settings',
  'Sound', 'On', 'Off', 'Volume', 'Sound volume',
  'Mono audio', 'Both ears hear every sound (one earbud, one speaker). Saved on this device.',
  'Reduced intensity', 'Quieter, gentler sound with no sudden loud peaks. Saved on this device.',
  'Motion', 'Auto', 'Full', 'Reduced',
  'Text size', 'A', 'A+', 'A++',
  'Text tone', 'Soft', 'Bright', 'Max',
  'Font', 'Rounded', 'System', 'Mono',
  'Tooltips', 'Short hints: hover on a computer, press and hold on a phone.',
  'Save protection',
  'Saved data', 'Kept by this browser', 'This browser may clear it when the device runs short of space',
  'This browser cannot promise to keep it', 'Not known yet', 'Ask again',
  'Backup', 'Back up now', 'Last backup', 'Never', 'Backup file made.',
  'Restore', 'Restore…',
  'That file was written by a newer version of the game. Nothing was changed.',
  'That file is damaged or is not a backup of this game. Nothing was changed.',
  'That file is too large to be a backup. Nothing was changed.',
  'Confirm restore', 'Replace this whole expedition with the one in the backup file? This cannot be undone.',
  'Replace and reload', 'Cancel',
  'Not available while the save is protected.',
  'Reset expedition', 'Reset…', 'Confirm expedition reset',
  'Erase this whole expedition — discoveries, companions, Charters and Stardust — and start over? This cannot be undone.',
  'Erase and start over',
  'Status', 'Build', 'Save', 'Stored on this device', 'Protected: nothing is written', 'Reload needed', 'Save revision',
  'Art packs', 'None listed', 'Interface art', 'From the art pack', 'Stand-in',
  'Missing letters', 'Missing icons', 'Missing map art', 'Missing creature art', 'None',
  'ready', 'stand-in', 'refused',
]);

/** Every string the offline and update control shows. */
export const UPDATE_CATALOG: StringCatalog = catalog('update', Object.values(UPDATE_WORDS));
