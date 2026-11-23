/* The search field. In this milestone it takes a travel code: a pasted code that names a real place within
   reach travels there. */
import { el } from './dom';

export interface SearchBox {
  readonly el: HTMLInputElement;
  /** Takes the focus away when the field holds it; true when it did. */
  blurIfFocused(): boolean;
}

/** `travel` is given the text of the field when the player submits it, and answers whether it travelled. */
export function createSearchBox(host: HTMLElement, travel: (text: string) => boolean): SearchBox {
  const input = el('input', {
    type: 'search', class: 'search', autocomplete: 'off', spellcheck: 'false', enterkeyhint: 'go',
    placeholder: 'Search', 'aria-label': 'search or paste a code', title: 'Paste a travel code',
    'data-panel-boundary': true,
  });
  host.append(input);
  input.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (input.value.trim() !== '' && travel(input.value)) {
      input.value = '';
      input.blur();
    }
  });
  return {
    el: input,
    blurIfFocused() {
      if (input.ownerDocument.activeElement !== input) return false;
      input.blur();
      return true;
    },
  };
}
