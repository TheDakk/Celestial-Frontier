/* The offline and update control of Settings: what the app's own build is doing, in words, and the four things
   the player may ask of it. It draws the view the offline system keeps and decides nothing itself. */
import { UPDATE_WORDS, type UpdateControl } from '../offline';
import { capturePanelRefillFocus, translate, type LocaleId } from '../ui';
import { el } from './dom';
import { UPDATE_CATALOG } from './strings';

const ACTIONS = ['check', 'activate', 'reload', 'rollback'] as const;

/** The control's element, kept current until `stop` is called. Its words are its own catalogue's, so the
 *  element is marked as already localized. */
export function createUpdateView(control: UpdateControl, locale: LocaleId, panel: HTMLElement): { element: HTMLElement; stop(): void } {
  const say = (source: string): string => (source === '' ? '' : translate(UPDATE_CATALOG, locale, source));
  // The message element stays, so a screen reader hears each change of its words.
  const message = el('p', { class: 'sub', 'data-set': 'update-message', 'aria-live': 'polite', 'aria-atomic': 'true' });
  const actions = el('div', { class: 'row update-actions', role: 'group', 'aria-label': say(UPDATE_WORDS.label) });
  const element = el('div', { class: 'update', 'data-set': 'update', 'data-l10n-skip': true }, el('h3', {}, say(UPDATE_WORDS.heading)), message, actions);

  const draw = (): void => {
    const view = control.view();
    const restoreFocus = capturePanelRefillFocus(panel, ['data-set']);
    element.dataset['state'] = view.state;
    message.setAttribute('role', view.state === 'error' ? 'alert' : 'status');
    message.textContent = say(view.message);
    actions.replaceChildren(...ACTIONS.filter((action) => view[action]).map((action) => {
      const button = el('button', { type: 'button', 'data-set': `update-${action}`, disabled: view.busy }, say(UPDATE_WORDS[action]));
      button.addEventListener('click', () => {
        if (action === 'check') void control.check();
        else control[action]();
      });
      return button;
    }));
    restoreFocus();
  };
  draw();
  return { element, stop: control.onChange(draw) };
}
