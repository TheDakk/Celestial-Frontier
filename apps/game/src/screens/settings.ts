/* Settings. Every control changes a real field: of the save (stored by the save loop), or of the device for
   the two listening modes. The panel is drawn again after each change and the focus is kept on the control. */
import type { SaveStateV2 } from '@cf/persistence';
import type { UpdateControl } from '../offline';
import type { AudioAccessibilityModes } from '../sound';
import {
  DISPLAY_HEADINGS, capturePanelRefillFocus, displayText, localizeElement, translate,
  type LocaleId, type Toast,
} from '../ui';
import { el, row } from './dom';
import { createProtectView, type ProtectPorts } from './protect';
import type { ScreenDef } from './registry';
import { SETTINGS_CATALOG } from './strings';
import { createUpdateView } from './update';

/** The save fields Settings changes in this milestone. */
export type SettingsField = 'sndOn' | 'sfxVol' | 'motionMode' | 'fsMode' | 'toneMode' | 'fontMode' | 'tipsOn';

export interface StatusFacts {
  build: string;
  /** `ok`: this page stores the expedition. `held`: it writes nothing. `reload-required`: it must reload first. */
  save: 'ok' | 'held' | 'reload-required';
  /** The number of the stored revision this page knows. */
  revision: number;
  packs: ReadonlyArray<{ name: string; state: 'ready' | 'standin' | 'refused' }>;
  sheet: 'pack' | 'standin';
  /** How many different glyphs, icons and space elements were asked for and not found. */
  gaps: { glyphs: number; icons: number; elements: number };
}

export interface SettingsPorts {
  live(): SaveStateV2;
  /** A save field was changed: apply it and ask for it to be stored. */
  changed(field: SettingsField): void;
  listening: { get(): AudioAccessibilityModes; set(modes: AudioAccessibilityModes): void };
  locale: LocaleId;
  protect: ProtectPorts;
  /** False under any write hold: Reset is then not offered. */
  mayReplace(): boolean;
  reset(): Promise<'reset' | 'refused'>;
  status(): StatusFacts;
  /** The offline and update control: null where the page has no offline shell. */
  update: UpdateControl | null;
  toast: Toast;
}

const SAVE_WORDS: Readonly<Record<StatusFacts['save'], string>> = {
  ok: 'Stored on this device', held: 'Protected: nothing is written', 'reload-required': 'Reload needed',
};
/** How many characters of a build's identity Status shows: enough to tell two builds of one version apart. */
const BUILD_ID_SHOWN = 8;
const buildWords = (build: string, id: string | null): string => (id === null ? build : `${build} · ${id.slice(0, BUILD_ID_SHOWN)}`);
const PACK_WORDS = { ready: 'ready', standin: 'stand-in', refused: 'refused' } as const;
const FOCUS_KEYS = ['data-set', 'data-value'] as const;

export function settingsScreen(ports: SettingsPorts): ScreenDef {
  let prepared: 'reset-confirm' | 'restore-confirm' | null = null;

  return {
    id: 'settings',
    dock: { icon: 'settings', label: 'Settings' },
    fixtures: [
      { id: 'settings', setup() { prepared = null; } },
      { id: 'settings-reset-confirm', setup() { prepared = 'reset-confirm'; } },
      { id: 'settings-restore-confirm', setup() { prepared = 'restore-confirm'; } },
    ],
    mount(root, ctx) {
      let resetAsked = prepared === 'reset-confirm';
      let resetBusy = false;
      let live = true;
      const redraw = (): void => {
        if (!live) return;
        const restoreFocus = capturePanelRefillFocus(root, FOCUS_KEYS);
        draw();
        restoreFocus();
      };
      const statusHost = el('div', { class: 'status', 'data-set': 'status' });
      const protect = createProtectView(ports.protect, redraw);
      const update = ports.update === null ? null : createUpdateView(ports.update, ports.locale, root);
      if (prepared === 'restore-confirm') protect.showConfirm();
      prepared = null;

      const toggle = (key: string, label: string, on: boolean, flip: () => void, title: string | null = null): HTMLElement => {
        const b = el('button', { type: 'button', 'data-set': key, 'aria-label': label, 'aria-pressed': String(on), class: on ? 'on' : null, title }, on ? 'On' : 'Off');
        b.addEventListener('click', () => { flip(); redraw(); });
        return row(label, b);
      };
      const choice = <V extends string | number>(key: string, label: string, current: V, options: ReadonlyArray<readonly [V, string]>, pick: (value: V) => void): HTMLElement => {
        const group = el('span', { class: 'seg', role: 'group', 'aria-label': label });
        for (const [value, text] of options) {
          const b = el('button', { type: 'button', 'data-set': key, 'data-value': String(value), 'aria-pressed': String(current === value), class: current === value ? 'on' : null }, text);
          b.addEventListener('click', () => { pick(value); redraw(); });
          group.append(b);
        }
        return row(label, group);
      };
      const set = <F extends SettingsField>(field: F, value: SaveStateV2[F]): void => {
        ports.live()[field] = value;
        ports.changed(field);
      };

      function draw(): void {
        const save = ports.live();
        const listening = ports.listening.get();
        const heading = displayText(translate(SETTINGS_CATALOG, ports.locale, DISPLAY_HEADINGS.settings), { level: 2 });
        heading.dataset.l10nSkip = '';

        const volume = el('input', { type: 'range', min: '0', max: '100', value: String(Math.round(save.sfxVol * 100)), 'data-set': 'volume', 'aria-label': 'Sound volume' });
        volume.addEventListener('input', () => { set('sfxVol', Number(volume.value) / 100); });

        const reset = el('button', { type: 'button', 'data-set': 'reset', 'aria-expanded': String(resetAsked), 'aria-controls': 'setresetconfirm', disabled: !ports.mayReplace() }, 'Reset…');
        reset.addEventListener('click', () => { resetAsked = true; redraw(); root.querySelector<HTMLElement>('[data-set="reset-no"]')?.focus(); });
        const yes = el('button', { type: 'button', 'data-set': 'reset-yes', class: 'danger', disabled: resetBusy || !ports.mayReplace() }, 'Erase and start over');
        yes.addEventListener('click', () => {
          resetBusy = true;
          redraw();
          void ports.reset().then((outcome) => {
            resetBusy = false;
            if (outcome === 'refused') ports.toast.show('Reset unavailable', 'The save could not be replaced. Your expedition is unchanged.', true);
            redraw();
          });
        });
        const no = el('button', { type: 'button', 'data-set': 'reset-no' }, 'Cancel');
        no.addEventListener('click', () => { resetAsked = false; redraw(); root.querySelector<HTMLElement>('[data-set="reset"]')?.focus(); });

        root.replaceChildren(
          heading,
          toggle('sound', 'Sound', save.sndOn, () => set('sndOn', !save.sndOn)),
          row('Volume', volume),
          toggle('mono', 'Mono audio', listening.mono, () => ports.listening.set({ ...listening, mono: !listening.mono }),
            'Both ears hear every sound (one earbud, one speaker). Saved on this device.'),
          toggle('soft', 'Reduced intensity', listening.reducedIntensity, () => ports.listening.set({ ...listening, reducedIntensity: !listening.reducedIntensity }),
            'Quieter, gentler sound with no sudden loud peaks. Saved on this device.'),
          choice('motion', 'Motion', save.motionMode, [[-1, 'Auto'], [0, 'Full'], [1, 'Reduced']], (v) => set('motionMode', v)),
          choice('size', 'Text size', save.fsMode, [['', 'A'], ['fs-lg', 'A+'], ['fs-xl', 'A++']], (v) => set('fsMode', v)),
          choice('tone', 'Text tone', save.toneMode, [['', 'Soft'], ['tone-bright', 'Bright'], ['tone-max', 'Max']], (v) => set('toneMode', v)),
          choice('font', 'Font', save.fontMode, [['', 'Rounded'], ['font-sys', 'System'], ['font-mono', 'Mono']], (v) => set('fontMode', v)),
          toggle('tips', 'Tooltips', save.tipsOn, () => set('tipsOn', !save.tipsOn), 'Short hints: hover on a computer, press and hold on a phone.'),
          ...protect.render(),
          row('Reset expedition', reset),
          el('div', { class: 'row confirm', id: 'setresetconfirm', role: 'group', 'aria-label': 'Confirm expedition reset', hidden: !resetAsked },
            el('span', { class: 'sub' }, 'Erase this whole expedition — discoveries, companions, Charters and Stardust — and start over? This cannot be undone.'),
            yes, no),
          ...(update === null ? [] : [update.element]),
          statusHost,
        );
        localizeElement(root, SETTINGS_CATALOG, ports.locale);
        drawStatus();
      }

      /** Status alone is drawn again when what it shows changes, so a control in use is never replaced. */
      function drawStatus(): void {
        const status = ports.status();
        const fact = (label: string, value: string, data: boolean): HTMLElement =>
          row(label, el('span', { class: 'row-value', 'data-l10n-skip': data }, value));
        const packs = status.packs.length === 0
          ? [fact('Art packs', 'None listed', false)]
          : status.packs.map((pack, i) => row(i === 0 ? 'Art packs' : '',
            el('span', { class: 'row-value', 'data-l10n-skip': true }, pack.name), el('span', { class: 'row-value' }, PACK_WORDS[pack.state])));
        statusHost.replaceChildren(
          el('h3', {}, 'Status'),
          fact('Build', buildWords(status.build, ports.update?.buildId() ?? null), true),
          fact('Save', SAVE_WORDS[status.save], false),
          fact('Save revision', String(status.revision), true),
          ...packs,
          fact('Interface art', status.sheet === 'pack' ? 'From the art pack' : 'Stand-in', false),
          fact('Missing letters', String(status.gaps.glyphs), true),
          fact('Missing icons', String(status.gaps.icons), true),
          fact('Missing map art', String(status.gaps.elements), true),
        );
        localizeElement(statusHost, SETTINGS_CATALOG, ports.locale);
      }

      draw();
      // What Status shows can change while the panel is open.
      const stops = [
        ...(['save:committed', 'save:reload-required', 'pack:status'] as const).map((type) => ctx.bus.on(type, () => { if (live) drawStatus(); })),
        ...(['protect:persist', 'protect:backup', 'save:held'] as const).map((type) => ctx.bus.on(type, redraw)),
        ...(ports.update === null ? [] : [ports.update.onChange(() => { if (live) drawStatus(); })]),
      ];
      return () => {
        live = false;
        update?.stop();
        for (const stop of stops) stop();
      };
    },
  };
}
